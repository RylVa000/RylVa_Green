"use strict";

// Synthetic adapter only. No catalog service, stock reservation or order API.
window.RylvaHomepagePreviewRepository = (() =>
{
  const query = new URLSearchParams(location.search);
  const development = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  const workbench = development && ["home", "catalog", "collections"].includes(query.get("preview"));
  const scenarios = ["normal", "loading", "empty", "loadError", "partial", "offline", "timeout",
    "maintenance", "unavailable", "invalidPrice", "brokenImage", "longContent", "addError", "conflict", "rateLimited"];
  const scenario = workbench && scenarios.includes(query.get("state")) ? query.get("state") : "normal";
  const cartRepository = window.RylvaCartPreviewRepository;
  let cart = null;
  let recovered = false;
  let faultUsed = false;

  function failure(code, message)
  {
    return Object.assign(new Error(message), { code });
  }

  async function load({ recover = false, view = "home" } = {})
  {
    recovered ||= recover;
    await new Promise((resolve) => setTimeout(resolve, scenario === "loading" && !recovered ? 1800 : 240));
    if (!navigator.onLine || (!recovered && ["loadError", "offline", "timeout", "maintenance"].includes(scenario)))
    {
      throw failure(navigator.onLine ? scenario : "offline", "Koleksi belum dapat dimuat. Coba kembali.");
    }
    cart = await cartRepository.load({ recover });
    const catalog = window.RylvaCartPreviewData.createCatalog();
    let products = window.RylvaStorefrontProductPreviewData.products.map((product) =>
    ({
      ...structuredClone(product),
      price: catalog.find((item) => item.productId === product.productId)?.price ?? null
    }));
    if (view === "catalog")
    {
      products = products.map((product) => product.slug === "sirih-gading"
        ? { ...product, image: "/assets/images/catalog/sirih-gading.png" } : product);
    }
    if (scenario === "empty")
    {
      products = [];
    }
    if (products.length)
    {
      if (scenario === "unavailable")
      {
        products[0].available = false;
        products[0].availableStock = 0;
      }
      if (["invalidPrice", "partial"].includes(scenario))
      {
        products[0].price = null;
      }
      if (scenario === "partial")
      {
        products = products.slice(0, 6);
      }
      if (scenario === "brokenImage")
      {
        products[0].image = "/assets/images/homepage/missing-example.png";
      }
      if (scenario === "longContent")
      {
        products[0].name = "Peace Lily dengan pilihan pot dekoratif dan paket perlengkapan tanaman untuk ruang keluarga";
        products[0].price = 1250000000;
        products[0].basePrice = 1250000000;
      }
    }
    return { products, cart, preview: true };
  }

  async function add(productId)
  {
    if (!navigator.onLine)
    {
      throw failure("offline", "Koneksi terputus. Sambungkan kembali lalu coba lagi.");
    }
    if (!faultUsed && ["addError", "conflict", "rateLimited"].includes(scenario))
    {
      faultUsed = true;
      throw failure(scenario, scenario === "conflict"
        ? "Keranjang berubah di tab lain. Perbarui sebelum mencoba lagi."
        : scenario === "rateLimited" ? "Terlalu banyak percobaan. Tunggu sebentar, lalu coba lagi."
          : "Produk belum ditambahkan. Silakan coba lagi.");
    }
    if (workbench)
    {
      const product = window.RylvaCartPreviewData.createCatalog().find((item) => item.productId === productId);
      const existing = cart.items.find((item) => item.productId === productId);
      if (existing)
      {
        existing.quantity++;
      }
      else
      {
        cart.items.push({ ...product, quantity: 1 });
      }
      return structuredClone(cart);
    }
    cart = await cartRepository.add(productId, cart.revision);
    return cart;
  }

  async function readCart()
  {
    if (!navigator.onLine)
    {
      throw failure("offline", "Koneksi terputus. Sambungkan kembali untuk memperbarui keranjang.");
    }
    if (workbench)
    {
      if (!cart)
      {
        throw failure("loading", "Keranjang belum tersedia. Coba lagi setelah koleksi selesai dimuat.");
      }
      return structuredClone(cart);
    }
    cart = await cartRepository.load({ recover: true });
    return cart;
  }

  async function remove(lineId)
  {
    if (!navigator.onLine)
    {
      throw failure("offline", "Koneksi terputus. Produk belum dihapus dari keranjang.");
    }
    if (workbench)
    {
      cart.items = cart.items.filter((item) => item.lineId !== lineId);
      return structuredClone(cart);
    }
    cart = await cartRepository.mutate(lineId, null, cart.revision);
    return cart;
  }

  return { load, add, readCart, remove, scenario, scenarios, workbench };
})();
