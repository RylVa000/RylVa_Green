"use strict";

// Preview-only implementation of the Checkout adapter. It never calls an order API.
window.RylvaCheckoutPreviewRepository = (() =>
{
  const source = window.RylvaCheckoutPreviewData;
  const query = new URLSearchParams(window.location.search);
  const workbench = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)
    && query.get("preview") === "checkout";
  const requested = query.get("state");
  const scenario = workbench && Object.hasOwn(source.scenarios, requested) ? requested : "normal";
  const state = source.create(scenario);
  const faults = new Set();
  const orders = new Map();
  const inFlight = new Map();
  let recovered = false;
  let storageAvailable = scenario !== "storageBlocked";
  const intentStorageKey = "rylva-checkout-preview-intent-v1";

  function clone(value)
  {
    return structuredClone(value);
  }

  function wait(milliseconds = 300)
  {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  function fail(code, message)
  {
    const error = Object.assign(new Error(message), { code });
    if (code === "rateLimited")
    {
      error.retryAt = Date.now() + 4000;
    }
    return error;
  }

  function once(code)
  {
    if (scenario !== code || faults.has(code) || recovered)
    {
      return false;
    }
    faults.add(code);
    return true;
  }

  function readIntent()
  {
    try
    {
      return storageAvailable ? JSON.parse(sessionStorage.getItem(intentStorageKey)) : null;
    }
    catch
    {
      storageAvailable = false;
      return null;
    }
  }

  function writeIntent(value)
  {
    try
    {
      if (!storageAvailable)
      {
        return;
      }
      sessionStorage.setItem(intentStorageKey, JSON.stringify(value));
    }
    catch
    {
      storageAvailable = false;
    }
  }

  async function load()
  {
    await wait(once("loading") ? 1800 : 280);
    if (!recovered && ["login", "verification", "session", "denied", "notFound"].includes(scenario))
    {
      throw fail(scenario, "Checkout tidak dapat diakses pada kondisi ini.");
    }
    if (once("loadError") || once("maintenance") || once("offline"))
    {
      throw fail(scenario, "Checkout belum dapat dimuat. Coba lagi setelah layanan tersedia.");
    }
    if (!workbench && query.get("from") === "cart")
    {
      try
      {
        const handoff = JSON.parse(sessionStorage.getItem("rylva-cart-checkout-preview-v1"));
        if (Array.isArray(handoff?.items))
        {
          state.items = handoff.items.map((reference) =>
          {
            const item = state.items.find((candidate) => candidate.lineId === reference.lineId)
              || window.RylvaCartPreviewData.createCatalog().find((candidate) => candidate.lineId === reference.lineId);
            return item && Number.isInteger(reference.quantity) && reference.quantity > 0
              ? { ...item, handling: item.handling || "durable", note: item.note || "", quantity: reference.quantity } : null;
          }).filter(Boolean);
        }
      }
      catch
      {
        storageAvailable = false;
      }
    }
    return clone(state);
  }

  async function quote(context)
  {
    await wait();
    if (!navigator.onLine)
    {
      throw fail("offline", "Koneksi terputus. Sambungkan kembali untuk memperbarui total.");
    }
    if (once("quoteError") || once("courierError") || once("partial"))
    {
      throw fail(scenario, "Rincian belum dapat dihitung. Data yang sudah diisi tetap tersedia.");
    }
    if (once("stale"))
    {
      throw fail("stale", "Rincian sudah tidak terbaru. Perbarui sebelum menyetujui pesanan.");
    }
    const subtotal = context.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (context.items.some((item) => !Number.isSafeInteger(item.price) || item.price < 0))
    {
      throw fail("invalidData", "Harga produk belum lengkap. Perbarui atau sesuaikan produk di Keranjang.");
    }
    const service = context.services.find((candidate) => candidate.id === context.serviceId);
    return { revision: ++state.revision, subtotal, shipping: service?.price ?? null,
      total: service ? subtotal + service.price : null, at: Date.now(), fingerprint: JSON.stringify(context) };
  }

  async function saveAddress(address)
  {
    await wait();
    if (once("addressSaveError") || once("addressConflict"))
    {
      throw fail(scenario, "Alamat belum tersimpan. Periksa isian dan coba lagi; draft tetap tersedia.");
    }
    const existing = state.addresses.findIndex((candidate) => candidate.id === address.id);
    if (existing < 0 && state.addresses.length >= state.limits.addresses)
    {
      throw fail("validation", "Maksimum 5 alamat. Ubah atau hapus alamat yang ada.");
    }
    const saved = { ...clone(address), id: address.id || "preview-address-" + crypto.randomUUID() };
    if (saved.primary)
    {
      state.addresses.forEach((candidate) => candidate.primary = false);
    }
    if (existing >= 0)
    {
      state.addresses[existing] = saved;
    }
    else
    {
      state.addresses.push(saved);
    }
    if (once("addressUncertain"))
    {
      // Inspect this in-memory book before offering another create operation.
      throw Object.assign(fail("addressUncertain", "Hasil penyimpanan perlu diperiksa."), { savedId: saved.id });
    }
    return clone(saved);
  }

  function addressBook()
  {
    return clone(state.addresses);
  }

  async function removeAddress(id)
  {
    await wait();
    state.addresses = state.addresses.filter((address) => address.id !== id);
    return addressBook();
  }

  function resolvePaymentProvider(context)
  {
    const method = context.methods.find((candidate) => candidate.id === context.method);
    const provider = method?.providers?.find((candidate) => candidate.available !== false
      && (!context.paymentProviderId || candidate.id === context.paymentProviderId));
    if (!method || (method.providers && !provider))
    {
      throw fail("invalidData", "Pilihan bank atau e-wallet tidak tersedia. Pilih kembali metode pembayaran.");
    }
    return provider || null;
  }

  function makeOrder(context)
  {
    const isCod = context.method === "cod";
    const provider = resolvePaymentProvider(context);
    const base = window.RylvaPaymentPreview.createSnapshot(isCod ? "cod"
      : scenario === "paymentInitError" ? "noAttempt" : context.method, Date.now());
    const providerSnapshot = provider ? { id: provider.id, name: provider.name } : null;
    if (base.attempt && providerSnapshot)
    {
      base.attempt.provider = providerSnapshot;
      base.attempts.forEach((attempt) =>
      {
        if (attempt.id === base.attempt.id)
        {
          attempt.provider = { ...providerSnapshot };
        }
      });
    }
    const address = context.addresses.find((candidate) => candidate.id === context.addressId);
    const service = context.services.find((candidate) => candidate.id === context.serviceId);
    const suffix = crypto.randomUUID().replace(/[^a-f]/g, "").toUpperCase().padEnd(6, "A").slice(0, 6);
    const subtotal = context.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return {
      ...base, orderId: "preview-checkout-" + crypto.randomUUID(),
      orderNo: "RV-" + source.dateInWib().slice(2).replaceAll("-", "") + "-" + suffix,
      ownerId: window.RylvaOrdersPreviewRepository.customerId,
      orderStatus: isCod ? "Siap Diproses" : "Menunggu Pembayaran", paymentStatus: "Menunggu",
      isCod, subtotalAmount: subtotal, shippingAmount: service.price, totalAmount: subtotal + service.price,
      deliveryDate: context.date || null, deliverySlot: context.slot || "Tidak dipilih",
      courierName: service.name, selectedPaymentMethod: context.method,
      selectedPaymentProvider: providerSnapshot,
      items: context.items.map((item) =>
      ({ name: item.name, variant: [item.variant, item.attributes].filter(Boolean).join(", "),
        unit: item.unit, quantity: item.quantity, amount: item.price, image: item.image,
        lineId: item.lineId, note: item.note, configuration: item.configuration || null })),
      recipient: { name: address.recipient, phone: address.recipientPhone,
        address: [address.street, address.village, address.district, address.city, address.province, address.postcode].join(", ") },
      greeting: context.gift.enabled ? { message: context.gift.message,
        from: context.gift.anonymous ? "" : context.gift.from, to: context.gift.to } : null,
      shippingStatus: "Belum Diserahkan", trackingNumber: null, trackingUrl: null,
      note: "", archived: false, cancellationRequest: null, complaint: null,
      complaintDeadline: null, handling: null,
      history: [{ title: "Pesanan contoh dibuat", at: new Date().toISOString(), detail: "Simulasi Checkout; tidak ada transaksi atau pengurangan stok nyata." }],
      allowedActions: { pay: !isCod, cancel: true, retry: !isCod, changeMethod: !isCod },
      previewScenario: isCod ? "cod" : "pending"
    };
  }

  async function executeCreate(context, intent, approvedFingerprint)
  {
    const payloadFingerprint = JSON.stringify(context);
    const previous = orders.get(intent);
    if (previous)
    {
      if (previous.fingerprint !== payloadFingerprint)
      {
        throw fail("conflict", "Permintaan ini sudah dipakai untuk rincian berbeda. Periksa hasil sebelumnya.");
      }
      return clone(previous.order);
    }
    if (approvedFingerprint !== payloadFingerprint)
    {
      throw fail("stale", "Rincian berubah. Tinjau dan setujui kembali.");
    }
    resolvePaymentProvider(context);
    writeIntent({ key: intent, status: "checking", orderId: null });
    await wait(scenario === "slowCreate" ? 2200 : 600);
    if (!navigator.onLine)
    {
      throw fail("offline", "Koneksi terputus. Periksa hasil pemesanan sebelum mengirim ulang.");
    }
    for (const code of ["createError", "conflict", "csrf", "rateLimited", "orderLimit", "addressChanged", "cutoffChanged", "policyChanged"])
    {
      if (code === "orderLimit" && context.method === "cod")
      {
        continue;
      }
      if (once(code))
      {
        writeIntent(null);
        throw fail(code, "Pesanan belum dibuat. Periksa rincian sebelum mencoba kembali.");
      }
    }
    if (once("priceChanged"))
    {
      writeIntent(null);
      throw Object.assign(fail("priceChanged", "Harga berubah. Tinjau total terbaru dan setujui ulang."),
        { price: context.items[0].price + 11000 });
    }
    if (once("stockChanged"))
    {
      writeIntent(null);
      throw fail("stockChanged", "Stok produk pertama habis. Hapus atau sesuaikan isi keranjang.");
    }
    const order = makeOrder(context);
    window.RylvaOrdersPreviewRepository.insertPreview(order);
    orders.set(intent, { fingerprint: payloadFingerprint, order });
    writeIntent({ key: intent, status: "created", orderId: order.orderId });
    syncCart(context, true);
    if (once("uncertain"))
    {
      throw fail("uncertain", "Respons terputus. Periksa hasil; jangan membuat pesanan baru.");
    }
    return clone(order);
  }

  async function createOrder(context, intent, approvedFingerprint)
  {
    const fingerprint = JSON.stringify(context);
    const pending = inFlight.get(intent);
    if (pending)
    {
      if (pending.fingerprint !== fingerprint)
      {
        throw fail("conflict", "Permintaan yang sama sedang diproses dengan rincian berbeda.");
      }
      return pending.promise;
    }
    const promise = executeCreate(context, intent, approvedFingerprint);
    inFlight.set(intent, { fingerprint, promise });
    try
    {
      return await promise;
    }
    finally
    {
      inFlight.delete(intent);
    }
  }

  function syncCart(context, completed = false)
  {
    if (workbench || query.get("from") !== "cart")
    {
      return;
    }
    try
    {
      const handoff = JSON.parse(sessionStorage.getItem("rylva-cart-checkout-preview-v1"));
      if (!Array.isArray(handoff?.items))
      {
        return;
      }
      const items = handoff.items.map((reference) =>
      {
        const current = context.items.find((item) => item.lineId === reference.lineId);
        return { lineId: reference.lineId, quantity: completed || !current ? null : current.quantity };
      });
      sessionStorage.setItem("rylva-cart-checkout-updates-v1", JSON.stringify({ sourceScenario: handoff.sourceScenario, items }));
    }
    catch
    {
      storageAvailable = false;
    }
  }

  function returnToCart()
  {
    try
    {
      const handoff = JSON.parse(sessionStorage.getItem("rylva-cart-checkout-preview-v1"));
      const destination = new URL(handoff?.returnTo || "/pages/customer/cart.html", location.origin);
      if (destination.origin === location.origin && ["/pages/customer/cart.html", "/cart.html"].includes(destination.pathname))
      {
        return destination.pathname + destination.search;
      }
    }
    catch
    {
      // Fall through to the known local cart route.
    }
    return "/pages/customer/cart.html";
  }

  async function inspectIntent(intent)
  {
    await wait();
    if (orders.has(intent))
    {
      return clone(orders.get(intent).order);
    }
    const saved = readIntent();
    if (saved?.key === intent && saved.orderId)
    {
      return window.RylvaOrdersPreviewRepository.read(saved.orderId);
    }
    throw fail("uncertain", "Hasil belum dapat dipastikan. Periksa Pesanan Saya atau coba Periksa Hasil kembali.");
  }

  return {
    scenario, workbench, load, quote, saveAddress, addressBook, removeAddress,
    createOrder, inspectIntent, readIntent, syncCart, returnToCart,
    get storageAvailable()
    {
      return storageAvailable;
    },
    recover()
    {
      recovered = true;
    }
  };
})();
