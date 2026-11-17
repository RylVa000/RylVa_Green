"use strict";

// Fixture boundary. Replace with RylvaProductDetailAdapter for production services.
window.RylvaProductDetailPreviewRepository = (() =>
{
  const parameters = new URLSearchParams(location.search);
  const workbench = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)
    && parameters.get("preview") === "product-detail";
  const source = window.RylvaProductDetailPreviewData;
  const scenario = workbench && source.scenarios.includes(parameters.get("state")) ? parameters.get("state") : "normal";
  const cartRepository = window.RylvaCartPreviewRepository;
  const wait = (delay = 250) => new Promise((resolve) => setTimeout(resolve, delay));
  let cart = null;
  let faultUsed = false;

  function failure(code, message)
  {
    return Object.assign(new Error(message), { code });
  }

  async function load(slug, { recover = false } = {})
  {
    await wait(scenario === "loading" && !recover ? 1800 : 220);
    if (!navigator.onLine || (!recover && ["loadError", "offline", "timeout", "maintenance"].includes(scenario)))
    {
      throw failure(!navigator.onLine ? "offline" : scenario, "Detail produk belum dapat dimuat. Coba kembali.");
    }
    const product = source.find(slug);
    if (!product || scenario === "notFound")
    {
      return { product: null, preview: true };
    }
    cart = workbench
      ? { items: [], revision: 0, mode: "guest", limits: window.RylvaCartPreviewData.limits }
      : await cartRepository.load({ recover });
    if (scenario === "unavailable")
    {
      product.available = false;
    }
    if (scenario === "outOfStock")
    {
      product.variants[0].stock = 0;
    }
    if (scenario === "invalidPrice")
    {
      product.variants[0].price = null;
    }
    if (scenario === "partial")
    {
      product.description = "";
      product.care = [];
      product.sku = "";
    }
    if (scenario === "brokenImage")
    {
      product.gallery = [{ src: "/assets/images/product-detail/unavailable.png", alt: product.name }];
    }
    if (scenario === "longContent")
    {
      product.name = "Monstera Deliciosa dengan pilihan pot dekoratif dan perlengkapan tanaman untuk ruang keluarga";
      product.variants[0].price = 1250000000;
      product.variants[0].basePrice = 1250000000;
    }
    return { product, cart: structuredClone(cart), preview: true };
  }

  async function readCart()
  {
    cart = workbench ? cart : await cartRepository.load({ recover: true });
    return structuredClone(cart);
  }

  async function inspect(product, variantId, quantity)
  {
    if (!navigator.onLine)
    {
      throw failure("offline", "Koneksi terputus. Sambungkan kembali lalu coba lagi.");
    }
    await wait();
    const variant = product.variants.find((item) => item.id === variantId);
    if (!product.available || !variant || variant.stock < 1)
    {
      throw failure("unavailable", "Pilihan ini tidak tersedia. Periksa pilihan produk kembali.");
    }
    if (!Number.isSafeInteger(variant.price) || variant.price < 0)
    {
      throw failure("price", "Harga belum tersedia. Pilih produk lain atau coba lagi nanti.");
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > Math.min(variant.stock, cart.limits.perProduct))
    {
      throw failure("validation", "Jumlah melampaui stok atau batas pembelian.");
    }
    if (!faultUsed && ["addError", "conflict", "rateLimited"].includes(scenario))
    {
      faultUsed = true;
      throw failure(scenario, scenario === "conflict"
        ? "Keranjang berubah di tab lain. Keranjang terbaru sudah dimuat; periksa jumlah lalu coba lagi."
        : scenario === "rateLimited" ? "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi."
          : "Produk belum ditambahkan. Pilihan Anda tetap tersimpan; coba lagi.");
    }
    return variant;
  }

  async function add(product, variantId, quantity)
  {
    await inspect(product, variantId, quantity);
    if (!workbench)
    {
      cart = await cartRepository.add(product.productId, cart.revision, quantity);
      return structuredClone(cart);
    }
    const variant = product.variants.find((item) => item.id === variantId);
    const current = cart.items.find((item) => item.productId === product.productId);
    const total = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    if ((current?.quantity || 0) + quantity > Math.min(variant.stock, cart.limits.perProduct)
      || total + quantity > cart.limits.perOrder)
    {
      throw failure("limit", "Batas jumlah tercapai. Sesuaikan jumlah di Keranjang.");
    }
    if (current)
    {
      current.quantity += quantity;
    }
    else
    {
      cart.items.push({ ...window.RylvaCartPreviewData.createCatalog().find((item) => item.productId === product.productId), quantity });
    }
    cart.revision++;
    return structuredClone(cart);
  }

  async function remove(lineId)
  {
    if (workbench)
    {
      cart.items = cart.items.filter((item) => item.lineId !== lineId);
      return structuredClone(cart);
    }
    cart = await cartRepository.mutate(lineId, null, cart.revision);
    return structuredClone(cart);
  }

  async function quote(postcode, context = {})
  {
    if (!/^\d{5}$/.test(postcode))
    {
      throw failure("validation", "Masukkan kode pos yang terdiri dari 5 angka.");
    }
    const delay = ["shippingLoading", "shippingTimeout"].includes(scenario) ? 1800 : 420;
    await wait(delay);
    if (!navigator.onLine)
    {
      throw failure("offline", "Koneksi terputus. Sambungkan kembali lalu cek ongkir lagi.");
    }
    if (["shippingError", "shippingTimeout"].includes(scenario) && !faultUsed)
    {
      faultUsed = true;
      throw failure(scenario === "shippingTimeout" ? "timeout" : "shipping",
        scenario === "shippingTimeout"
          ? "Pengecekan ongkir terlalu lama. Kode pos tetap tersimpan; coba lagi."
          : "Estimasi ongkir belum dapat dimuat. Kode pos tetap tersimpan; coba lagi.");
    }
    const services = scenario === "shippingUnavailable" ? [] : window.RylvaShippingPreviewData.createServices();
    if (scenario === "shippingPartial")
    {
      services[1].price = null;
    }
    return {
      postcode,
      quantity: context.quantity || 1,
      services,
      preview: true
    };
  }

  return { load, readCart, inspect, add, remove, quote, workbench, scenario };
})();
