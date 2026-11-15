"use strict";

// Local preview adapter. No production request, authentication or stock reservation.
window.RylvaCartPreviewRepository = (() =>
{
  const guestKey = "rylva-cart-preview-guest-v1";
  const source = window.RylvaCartPreviewData;
  const parameters = new URLSearchParams(window.location.search);
  const isDevelopment = ["127.0.0.1", "localhost", "[::1]"].includes(window.location.hostname);
  const workbench = isDevelopment && parameters.get("preview") === "cart";
  const requestedState = parameters.get("state");
  const scenario = workbench && Object.hasOwn(source.scenarios, requestedState) ? requestedState : "normal";
  const isolated = scenario !== "normal";
  let items = source.createItems(scenario);
  let revision = 0;
  let initialized = false;
  let storageWarning = "";
  let faultUsed = false;
  let recovered = false;
  let storedRevision = null;

  function failure(code, message)
  {
    return Object.assign(new Error(message), { code });
  }

  function snapshot()
  {
    return structuredClone(
    {
      items,
      revision,
      storageWarning,
      mode: ["account", "merging", "mergeAdjusted", "mergeError"].includes(scenario) ? "account" : "guest",
      limits: source.limits
    });
  }

  function readGuest()
  {
    if (isolated)
    {
      return;
    }
    try
    {
      const raw = window.localStorage.getItem(guestKey);
      storedRevision = raw;
      if (!raw)
      {
        return;
      }
      const stored = JSON.parse(raw);
      if (stored.version !== 1 || !Array.isArray(stored.items) || !Number.isFinite(stored.expiresAt))
      {
        throw new Error("Invalid guest data");
      }
      if (stored.expiresAt <= Date.now())
      {
        items = [];
        storageWarning = "Isi keranjang contoh telah kedaluwarsa. Anda dapat mulai belanja kembali.";
        return;
      }
      const catalog = source.createCatalog();
      let discarded = false;
      const resolvedItems = new Map();
      for (const record of stored.items)
      {
        const item = catalog.find((candidate) => candidate.productId === record.productId
          && candidate.variantId === record.variantId);
        if (!item || !Number.isInteger(record.quantity) || record.quantity < 1)
        {
          discarded = true;
          continue;
        }
        const duplicate = resolvedItems.get(item.lineId);
        const quantity = (duplicate?.quantity || 0) + record.quantity;
        const cappedQuantity = Math.min(quantity, source.limits.perProduct, item.availableStock);
        if (duplicate || cappedQuantity !== quantity)
        {
          discarded = true;
        }
        resolvedItems.set(item.lineId, { ...item, quantity: cappedQuantity });
      }
      items = [...resolvedItems.values()];
      if (discarded)
      {
        storageWarning = "Isi keranjang contoh telah disesuaikan: duplikat digabung, jumlah dibatasi, atau data tidak valid dilewati. Periksa kembali produk Anda.";
      }
    }
    catch
    {
      items = [];
      storageWarning = "Keranjang belum dapat dibaca dari peramban. Data yang tidak valid tidak dipakai untuk Checkout.";
    }
  }

  function persistGuest()
  {
    if (isolated)
    {
      if (scenario === "storageBlocked")
      {
        storageWarning = "Keranjang hanya tersimpan selama tab ini terbuka. Penyimpanan peramban tidak tersedia.";
      }
      return;
    }
    try
    {
      const currentRaw = window.localStorage.getItem(guestKey);
      if (currentRaw !== storedRevision)
      {
        throw failure("conflict", "Keranjang berubah di tab lain. Muat versi terbaru sebelum menyimpan.");
      }
      let expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
      if (currentRaw)
      {
        try
        {
          expiresAt = JSON.parse(currentRaw).expiresAt || expiresAt;
        }
        catch
        {
          // Replaced only after the invalid data was explicitly surfaced by readGuest.
        }
      }
      const stored =
      {
        version: 1,
        expiresAt,
        items: items.map((item) =>
        ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity
        }))
      };
      const nextStoredRevision = JSON.stringify(stored);
      window.localStorage.setItem(guestKey, nextStoredRevision);
      storedRevision = nextStoredRevision;
    }
    catch (error)
    {
      if (error.code === "conflict")
      {
        throw error;
      }
      storageWarning = "Keranjang belum tersimpan di peramban ini. Isi hanya bertahan selama tab terbuka.";
    }
  }

  async function load({ recover = false } = {})
  {
    if (!navigator.onLine)
    {
      throw failure("offline", "Koneksi terputus.");
    }
    if (recover)
    {
      recovered = true;
    }
    if (!initialized || recover)
    {
      readGuest();
      try
      {
        const changes = JSON.parse(window.sessionStorage.getItem("rylva-cart-checkout-updates-v1"));
        if (changes?.sourceScenario === scenario && Array.isArray(changes.items))
        {
          for (const change of changes.items)
          {
            const item = items.find((candidate) => candidate.lineId === change.lineId);
            if (item && change.quantity === null)
            {
              items = items.filter((candidate) => candidate.lineId !== item.lineId);
            }
            else if (item && Number.isInteger(change.quantity) && change.quantity >= 1
              && change.quantity <= Math.min(item.availableStock, source.limits.perProduct))
            {
              item.quantity = change.quantity;
            }
          }
          persistGuest();
          window.sessionStorage.removeItem("rylva-cart-checkout-updates-v1");
        }
      }
      catch
      {
        // Checkout preview handoff is optional; keep the valid cart snapshot.
      }
      initialized = true;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 240));
    if (!recovered && ["loadError", "maintenance", "offline", "slow", "loading", "notFound",
      "denied", "verification", "sessionExpired", "expired", "converted", "merged", "merging", "mergeError"].includes(scenario))
    {
      throw failure(scenario, "Keranjang belum dapat dibaca.");
    }
    if (scenario === "storageBlocked")
    {
      storageWarning = "Keranjang hanya tersimpan selama tab ini terbuka. Penyimpanan peramban tidak tersedia.";
    }
    if (scenario === "storageCorrupt")
    {
      storageWarning = "Sebagian data tamu rusak. Hanya produk contoh yang valid ditampilkan.";
    }
    return snapshot();
  }

  async function mutate(lineId, quantity, expectedRevision)
  {
    if (!navigator.onLine || (!recovered && scenario === "offline"))
    {
      throw failure("offline", "Koneksi terputus. Sambungkan kembali, lalu periksa keranjang terbaru.");
    }
    if (expectedRevision !== revision)
    {
      throw failure("conflict", "Keranjang sudah berubah. Muat versi terbaru.");
    }
    const delay = scenario === "slowSave" ? 1800 : 350;
    await new Promise((resolve) => window.setTimeout(resolve, delay));
    if (!faultUsed && ["saveError", "deleteError", "rateLimited", "csrf", "conflict", "removedElsewhere"].includes(scenario))
    {
      faultUsed = true;
      if (scenario === "removedElsewhere")
      {
        items = items.filter((item) => item.lineId !== lineId);
        revision++;
      }
      const error = failure(scenario, "Perubahan belum tersimpan.");
      if (scenario === "rateLimited")
      {
        error.retryAt = Date.now() + 5000;
      }
      throw error;
    }
    const item = items.find((candidate) => candidate.lineId === lineId);
    if (!item)
    {
      throw failure("removedElsewhere", "Item sudah dihapus. Perbarui isi keranjang.");
    }
    if (quantity !== null)
    {
      const siblingQuantity = items.filter((candidate) => candidate.productId === item.productId
        && candidate.lineId !== lineId).reduce((sum, candidate) => sum + candidate.quantity, 0);
      const maximum = Math.min(item.availableStock, source.limits.perProduct - siblingQuantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > maximum)
      {
        throw failure("validation", "Jumlah melampaui batas produk atau stok yang tersedia.");
      }
    }
    const previousItems = structuredClone(items);
    if (quantity === null)
    {
      items = items.filter((candidate) => candidate.lineId !== lineId);
    }
    else
    {
      item.quantity = quantity;
    }
    try
    {
      persistGuest();
    }
    catch (error)
    {
      items = previousItems;
      throw error;
    }
    revision++;
    if (!faultUsed && scenario === "uncertain")
    {
      faultUsed = true;
      throw failure("uncertain", "Perubahan belum dapat dipastikan. Periksa keranjang terbaru sebelum mencoba lagi.");
    }
    return snapshot();
  }

  async function add(productId, expectedRevision)
  {
    if (!navigator.onLine)
    {
      throw failure("offline", "Koneksi terputus. Sambungkan kembali sebelum menambah produk.");
    }
    await new Promise((resolve) => setTimeout(resolve, 280));
    if (expectedRevision !== revision)
    {
      throw failure("conflict", "Keranjang berubah. Perbarui keranjang sebelum mencoba lagi.");
    }
    const product = source.createCatalog().find((item) => item.productId === productId);
    if (!product?.available || product.availableStock < 1)
    {
      throw failure("unavailable", "Produk tidak tersedia. Pilih produk lain.");
    }
    const existing = items.find((item) => item.productId === productId && item.variantId === product.variantId);
    const productQuantity = items.filter((item) => item.productId === productId)
      .reduce((total, item) => total + item.quantity, 0);
    if (productQuantity >= Math.min(source.limits.perProduct, product.availableStock)
      || items.reduce((total, item) => total + item.quantity, 0) >= source.limits.perOrder)
    {
      throw failure("limit", "Batas jumlah tercapai. Sesuaikan jumlah di Keranjang.");
    }
    const previousItems = structuredClone(items);
    if (existing)
    {
      existing.quantity++;
    }
    else
    {
      items.push({ ...product, quantity: 1, selected: true });
    }
    try
    {
      persistGuest();
    }
    catch (error)
    {
      items = previousItems;
      throw error;
    }
    revision++;
    return snapshot();
  }

  async function prepareCheckout()
  {
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    if (!faultUsed && scenario === "quoteChanged")
    {
      faultUsed = true;
      items[0].price = 300000;
      items[0].changeMessage = "Harga berubah dari Rp289.000 menjadi Rp300.000 per pot. Tinjau total terbaru.";
      revision++;
      return { changed: true, cart: snapshot() };
    }
    return { changed: false, cart: snapshot() };
  }

  return { load, mutate, add, prepareCheckout, scenario, workbench, guestKey };
})();
