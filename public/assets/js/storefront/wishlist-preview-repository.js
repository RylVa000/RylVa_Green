"use strict";

// Development/local account simulation. This file never supplies production authentication.
window.RylvaWishlistPreviewRepository = (() =>
{
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  const query = new URLSearchParams(location.search);
  const scenarios = ["ready", "empty", "loading", "account", "merge", "mergePartial", "mergeError", "mergeTimeout",
    "loadError", "offline", "timeout", "maintenance", "denied", "session", "verification", "partial", "notFound",
    "outOfStock", "unavailable", "invalidPrice", "brokenImage", "longContent", "storageBlocked", "storageCorrupt",
    "saveError", "saveTimeout", "rateLimited", "addError", "conflict", "appendError", "stale"];
  const workbench = local && query.get("preview") === "wishlist";
  const scenario = workbench && scenarios.includes(query.get("state")) ? query.get("state") : "normal";
  const products = window.RylvaStorefrontProductPreviewData?.products || [];
  const guestKey = workbench ? "rylva-wishlist-workbench-" + scenario : "rylva-wishlist-guest-v1";
  const merging = scenario.startsWith("merge");
  const accountScenario = ["account", "saveError", "saveTimeout", "rateLimited", "denied", "session", "verification"].includes(scenario) || merging;
  const guestSeed = workbench && scenario !== "empty" && (!accountScenario || merging)
    ? products.map((item, index) => ({ productId: item.productId, savedAt: 1794870000000 - index * 60000 })) : [];
  const operations = new Map();
  let recovered = false;
  let faultUsed = false;
  let cart = null;
  let account = null;
  let accountKey = null;
  let owner = null;

  function failure(code, message, extra = {})
  {
    return Object.assign(new Error(message), { code, ...extra });
  }

  function pause(duration = 180)
  {
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  function readOwner()
  {
    if (!local)
    {
      return null;
    }
    if (accountScenario)
    {
      return "wishlist-workbench-customer";
    }
    try
    {
      return sessionStorage.getItem("rylva-account-preview-access-v1") === "signed-out" ? null
        : sessionStorage.getItem("rylva-wishlist-preview-owner-v1");
    }
    catch
    {
      return null;
    }
  }

  function guard()
  {
    if (!navigator.onLine)
    {
      throw failure("offline", "Koneksi terputus. Sambungkan kembali, lalu coba lagi.");
    }
    if (owner !== readOwner())
    {
      throw failure("session", "Sesi berubah. Masuk kembali untuk melihat Wishlist akun Anda.");
    }
    if (!recovered && ["session", "denied", "verification"].includes(scenario))
    {
      const messages = { session: "Sesi berakhir. Masuk kembali untuk melanjutkan.",
        denied: "Akses Wishlist akun tidak diizinkan.", verification: "Lengkapi verifikasi akun untuk melanjutkan." };
      throw failure(scenario, messages[scenario]);
    }
  }

  function persistAccount()
  {
    // A local preview database, explicitly separate from guest storage and real APIs.
    try
    {
      localStorage.setItem(accountKey, JSON.stringify(account));
    }
    catch
    {
      throw failure("storage", "Akun pratinjau belum dapat disimpan di peramban. Izinkan penyimpanan, lalu coba lagi.");
    }
  }

  function accountResult(extra = {})
  {
    return structuredClone({ ...account, outcome: "confirmed", ...extra });
  }

  const adapter = local ?
  {
    async getSession()
    {
      await pause(scenario === "loading" && !recovered ? 1700 : 60);
      owner = readOwner();
      return owner ? { mode: "account", owner, preview: true } : { mode: "guest", owner: "guest", preview: false };
    },
    async load()
    {
      guard();
      await pause();
      accountKey = "rylva-wishlist-preview-account-v1:" + (workbench ? scenario + ":" : "") + owner;
      const raw = localStorage.getItem(accountKey);
      account = raw ? JSON.parse(raw) : { revision: 0, items: accountScenario
        ? products.slice(0, merging ? 2 : 8).map((item, index) => ({ productId: item.productId, savedAt: 1794870000000 - index * 60000 })) : [] };
      if (!Array.isArray(account.items) || !Number.isSafeInteger(account.revision))
      {
        throw failure("invalidData", "Penyimpanan akun pratinjau tidak dapat dibaca.");
      }
      return accountResult();
    },
    async setSaved(operation)
    {
      guard();
      await pause(260);
      guard();
      if (operations.has(operation.id))
      {
        return operations.get(operation.id);
      }
      if (!faultUsed && ["saveError", "rateLimited"].includes(scenario))
      {
        faultUsed = true;
        throw failure(scenario, scenario === "rateLimited" ? "Terlalu banyak percobaan. Coba lagi setelah jeda."
          : "Perubahan belum tersimpan. Coba lagi.", scenario === "rateLimited" ? { retryAt: Date.now() + 2000 } : {});
      }
      const previous = structuredClone(account);
      const next = new Map(account.items.map((item) => [item.productId, item]));
      if (operation.desired)
      {
        if (!products.some((item) => item.productId === operation.productId))
        {
          throw failure("notFound", "Produk ini tidak lagi tersedia untuk disimpan.");
        }
        next.set(operation.productId, next.get(operation.productId) || { productId: operation.productId, savedAt: Date.now() });
      }
      else
      {
        next.delete(operation.productId);
      }
      account = { revision: account.revision + 1, items: [...next.values()] };
      try
      {
        persistAccount();
      }
      catch (reason)
      {
        account = previous;
        throw reason;
      }
      const result = accountResult();
      operations.set(operation.id, result);
      if (!faultUsed && scenario === "saveTimeout")
      {
        faultUsed = true;
        throw failure("uncertain", "Respons terputus. Periksa hasil sebelum mengulangi perubahan.");
      }
      return result;
    },
    async mergeGuest(operation)
    {
      guard();
      await pause(460);
      guard();
      if (operations.has(operation.id))
      {
        return operations.get(operation.id);
      }
      if (!recovered && !faultUsed && scenario === "mergeError")
      {
        faultUsed = true;
        throw failure("mergeError", "Pilihan sementara belum berhasil digabung. Data Anda tetap tersedia.");
      }
      const source = scenario === "mergePartial" && !faultUsed ? operation.items.slice(0, 4) : operation.items;
      const accepted = source.filter((item) => products.some((product) => product.productId === item.productId));
      const next = new Map(account.items.map((item) => [item.productId, item]));
      accepted.forEach((item) =>
      {
        if (!next.has(item.productId))
        {
          next.set(item.productId, { productId: item.productId, savedAt: Date.now() });
        }
      });
      const previous = account;
      account = { revision: account.revision + 1, items: [...next.values()] };
      try
      {
        persistAccount();
      }
      catch (reason)
      {
        account = previous;
        throw reason;
      }
      const result = accountResult({ accepted: accepted.map((item) => item.productId) });
      operations.set(operation.id, result);
      if (!faultUsed && scenario === "mergeTimeout")
      {
        faultUsed = true;
        throw failure("uncertain", "Status penggabungan belum pasti. Periksa hasilnya.");
      }
      faultUsed = true;
      return result;
    },
    async reconcile(operationId)
    {
      guard();
      await pause();
      // Re-read current state. A confirmed response is never replayed across an owner change.
      return operations.get(operationId) || accountResult({ outcome: "rejected", accepted: [] });
    }
  } : null;

  async function loadProducts({ recover = false } = {})
  {
    recovered ||= recover;
    await pause(scenario === "loading" && !recovered ? 1700 : 180);
    if (!navigator.onLine || (!recovered && ["loadError", "offline", "timeout", "maintenance"].includes(scenario)))
    {
      throw failure(navigator.onLine ? scenario : "offline", "Informasi produk belum dapat dimuat. Coba lagi.");
    }
    const catalog = window.RylvaCartPreviewData.createCatalog();
    let records = products.map((item) =>
    ({
      ...structuredClone(item),
      image: item.slug === "sirih-gading" ? "/assets/images/catalog/sirih-gading.png" : item.image,
      price: catalog.find((candidate) => candidate.productId === item.productId)?.price ?? null,
      hasVariants: ["monstera", "calathea"].includes(item.slug)
    }));
    if (!recovered && records.length)
    {
      if (scenario === "partial")
      {
        records = records.slice(0, 6);
      }
      if (scenario === "notFound")
      {
        records = records.slice(1);
      }
      if (["outOfStock", "unavailable"].includes(scenario))
      {
        records[0].availableStock = 0;
        records[0].available = scenario !== "unavailable";
        records[0].stockLabel = scenario === "unavailable" ? "Tidak tersedia" : "Stok habis";
      }
      if (scenario === "invalidPrice")
      {
        records[0].price = null;
      }
      if (scenario === "brokenImage")
      {
        records[0].image = "/assets/images/wishlist-missing.png";
      }
      if (scenario === "longContent")
      {
        records[0].name = "Peace Lily dengan pilihan pot dekoratif dan perlengkapan tanaman untuk ruang keluarga";
        records[0].price = 1250000000;
        records[0].basePrice = 1250000000;
      }
    }
    return { products: records, partial: !recovered && scenario === "partial", stale: !recovered && scenario === "stale" };
  }

  async function readCart()
  {
    cart = await window.RylvaCartPreviewRepository.load({ recover: true });
    return cart;
  }

  async function add(productId)
  {
    if (!faultUsed && ["addError", "conflict"].includes(scenario))
    {
      faultUsed = true;
      throw failure(scenario, scenario === "conflict" ? "Keranjang berubah. Periksa Keranjang sebelum mencoba lagi."
        : "Produk belum ditambahkan. Coba lagi.");
    }
    cart ||= await readCart();
    cart = await window.RylvaCartPreviewRepository.add(productId, cart.revision, 1);
    return cart;
  }

  const storage = scenario === "storageBlocked" ?
  {
    getItem: () => null,
    setItem()
    {
      throw failure("storage", "Storage blocked");
    },
    removeItem()
    {
      // No persistent data exists in this fixture.
    }
  } : scenario === "storageCorrupt" ?
  {
    getItem: () => "not-json",
    setItem()
    {
      // Deliberately malformed, isolated development storage.
    },
    removeItem()
    {
      // No production storage is touched.
    }
  } : undefined;

  return { adapter, guestKey, guestSeed, storage, workbench, scenario, scenarios, loadProducts, readCart, add,
    recover: () =>
    {
      recovered = true;
    } };
})();
