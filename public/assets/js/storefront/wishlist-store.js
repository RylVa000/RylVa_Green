"use strict";

// Membership only. Account authorization and persistence belong to the injected adapter.
window.RylvaWishlistStoreFactory = (options = {}) =>
{
  const adapter = options.adapter || null;
  const guestKey = options.guestKey || "rylva-wishlist-guest-v1";
  const mergeKey = guestKey + "-merge";
  const listeners = new Set();
  const pending = new Map();
  const uncertain = new Map();
  let storage = options.storage;
  let guest = new Map();
  let items = new Map();
  let session = { mode: "guest", owner: "guest", preview: false };
  let status = "loading";
  let warning = "";
  let error = null;
  let merge = null;
  let mergeOperation = null;
  let revision = 0;
  let generation = 0;
  let memoryOnly = false;

  function failure(code, message)
  {
    return Object.assign(new Error(message), { code });
  }

  function validItem(item)
  {
    return item && typeof item.productId === "string" && item.productId.length > 0
      && item.productId.length <= 128 && Number.isFinite(item.savedAt);
  }

  function itemMap(records)
  {
    return new Map((records || []).filter(validItem).map((item) =>
      [item.productId, { productId: item.productId, savedAt: item.savedAt }]));
  }

  function snapshot()
  {
    return structuredClone(
    {
      ...session,
      status,
      revision,
      items: [...items.values()],
      pending: [...pending.keys()],
      uncertain: [...uncertain.keys()],
      warning,
      memoryOnly,
      error: error ? { code: error.code, message: error.message, retryAt: error.retryAt } : null,
      merge,
      mergeProductIds: merge?.status === "running" ? (mergeOperation?.items || []).map((item) => item.productId) : []
    });
  }

  function emit()
  {
    const value = snapshot();
    listeners.forEach((listener) => listener(value));
  }

  function readGuest()
  {
    try
    {
      storage ??= window.sessionStorage;
      const raw = storage.getItem(guestKey);
      if (raw === null)
      {
        guest = itemMap(options.guestSeed || []);
        if (guest.size)
        {
          persistGuest();
        }
        return;
      }
      const value = JSON.parse(raw);
      if (value.version !== 1 || !Array.isArray(value.items))
      {
        throw failure("storageCorrupt", "Format penyimpanan sementara tidak dikenal.");
      }
      guest = itemMap(value.items);
      if (guest.size !== value.items.length)
      {
        memoryOnly = true;
        warning = "Sebagian data sementara tidak dapat dibaca. Pilihan yang valid tetap ditampilkan. Reset penyimpanan untuk memperbaikinya.";
      }
      const savedMerge = storage.getItem(mergeKey);
      if (savedMerge)
      {
        const operation = JSON.parse(savedMerge);
        if (typeof operation.id === "string" && typeof operation.owner === "string"
          && Array.isArray(operation.items) && operation.items.every(validItem))
        {
          mergeOperation = operation;
        }
      }
    }
    catch
    {
      memoryOnly = true;
      warning = "Penyimpanan sementara belum dapat dibaca. Pilihan baru hanya bertahan pada halaman ini.";
    }
  }

  function persistGuest()
  {
    if (memoryOnly)
    {
      return;
    }
    try
    {
      storage.setItem(guestKey, JSON.stringify({ version: 1, items: [...guest.values()] }));
      if (mergeOperation)
      {
        storage.setItem(mergeKey, JSON.stringify(mergeOperation));
      }
      else
      {
        storage.removeItem(mergeKey);
      }
    }
    catch
    {
      memoryOnly = true;
      warning = "Penyimpanan peramban tidak tersedia. Pilihan baru hanya bertahan pada halaman ini.";
    }
  }

  function boundToMerge(item)
  {
    return mergeOperation?.items.some((source) => source.productId === item.productId
      && source.savedAt === item.savedAt);
  }

  function applyAccount(result)
  {
    if (!Array.isArray(result?.items) || !result.items.every(validItem) || !Number.isSafeInteger(result.revision))
    {
      throw failure("invalidData", "Data Wishlist belum lengkap. Coba muat kembali.");
    }
    if (result.revision >= revision)
    {
      items = itemMap(result.items);
      revision = result.revision;
    }
  }

  function accessFailure(reason)
  {
    if (["session", "denied", "verification"].includes(reason.code))
    {
      items.clear();
      status = reason.code;
    }
    error = reason;
  }

  async function mergeGuest({ reconcile = false } = {})
  {
    if (session.mode !== "account" || merge?.status === "running")
    {
      return snapshot();
    }
    if (mergeOperation && mergeOperation.owner !== session.owner)
    {
      return snapshot();
    }
    const source = mergeOperation?.items || [...guest.values()];
    if (!source.length)
    {
      return snapshot();
    }
    mergeOperation ||= { id: crypto.randomUUID(), owner: session.owner, items: structuredClone(source) };
    persistGuest();
    const operation = structuredClone(mergeOperation);
    const currentGeneration = generation;
    merge = { status: "running", total: operation.items.length, remaining: operation.items.length };
    emit();
    try
    {
      const result = reconcile
        ? await adapter.reconcile(operation.id)
        : await adapter.mergeGuest(operation);
      if (currentGeneration !== generation)
      {
        return snapshot();
      }
      if (!result || result.outcome === "unknown")
      {
        throw failure("uncertain", "Hasil penggabungan belum dapat dipastikan.");
      }
      if (result.outcome === "rejected")
      {
        throw failure("mergeError", "Pilihan sementara belum berhasil digabung.");
      }
      applyAccount(result);
      const accepted = new Set(result.accepted || []);
      if (!memoryOnly)
      {
        const activeOperation = mergeOperation;
        readGuest();
        mergeOperation = activeOperation;
      }
      operation.items.forEach((item) =>
      {
        if (accepted.has(item.productId) && guest.get(item.productId)?.savedAt === item.savedAt)
        {
          guest.delete(item.productId);
        }
      });
      const remaining = operation.items.filter((item) => !accepted.has(item.productId));
      mergeOperation = remaining.length ? { ...operation, id: crypto.randomUUID(), items: remaining } : null;
      merge = { status: remaining.length ? "partial" : "success", total: operation.items.length,
        accepted: accepted.size, remaining: remaining.length };
      persistGuest();
    }
    catch (reason)
    {
      if (currentGeneration !== generation)
      {
        return snapshot();
      }
      accessFailure(reason);
      merge = { status: ["uncertain", "timeout"].includes(reason.code) ? "unknown" : "error",
        total: operation.items.length, remaining: operation.items.length };
    }
    emit();
    return snapshot();
  }

  async function refresh()
  {
    if (generation > 0 && !memoryOnly)
    {
      readGuest();
    }
    const currentGeneration = ++generation;
    items.clear();
    pending.clear();
    uncertain.clear();
    merge = null;
    error = null;
    revision = 0;
    status = "loading";
    emit();
    try
    {
      const identity = adapter ? await adapter.getSession() : { mode: "guest", owner: "guest", preview: false };
      if (currentGeneration !== generation)
      {
        return snapshot();
      }
      if (!identity || !["guest", "account"].includes(identity.mode)
        || typeof identity.owner !== "string" || !identity.owner)
      {
        throw failure("invalidData", "Sesi Wishlist belum dapat diperiksa. Coba muat kembali.");
      }
      session = identity;
      if (session.mode === "account")
      {
        const result = await adapter.load();
        if (currentGeneration !== generation)
        {
          return snapshot();
        }
        applyAccount(result);
      }
      else
      {
        items = itemMap([...guest.values()].filter((item) => !boundToMerge(item)));
      }
      status = "ready";
      emit();
      if (session.mode === "account")
      {
        await mergeGuest({ reconcile: Boolean(mergeOperation) });
      }
    }
    catch (reason)
    {
      if (currentGeneration === generation)
      {
        status = "error";
        accessFailure(reason);
        emit();
      }
    }
    return snapshot();
  }

  async function setSaved(productId, desired)
  {
    if (error?.retryAt > Date.now())
    {
      throw error;
    }
    if (status !== "ready")
    {
      throw failure("loading", "Muat Wishlist terlebih dahulu, lalu coba lagi.");
    }
    if (typeof productId !== "string" || !productId)
    {
      throw failure("invalidData", "Produk belum dapat dikenali. Buka detail produk.");
    }
    if (pending.has(productId) || uncertain.has(productId)
      || (merge?.status === "running" && mergeOperation?.items.some((item) => item.productId === productId)))
    {
      throw failure("pending", "Perubahan produk ini masih diproses.");
    }
    if (items.has(productId) === desired)
    {
      return snapshot();
    }
    const currentGeneration = generation;
    const operation = { id: crypto.randomUUID(), productId, desired, owner: session.owner };
    pending.set(productId, operation);
    emit();
    try
    {
      if (session.mode === "guest")
      {
        if (desired)
        {
          const item = { productId, savedAt: Date.now() };
          guest.set(productId, item);
          items.set(productId, item);
        }
        else
        {
          guest.delete(productId);
          items.delete(productId);
        }
        persistGuest();
      }
      else
      {
        const result = await adapter.setSaved(operation);
        if (currentGeneration !== generation)
        {
          throw failure("session", "Sesi berubah. Periksa Wishlist yang sedang aktif.");
        }
        applyAccount(result);
      }
      error = null;
      return snapshot();
    }
    catch (reason)
    {
      if (currentGeneration === generation)
      {
        if (["timeout", "uncertain"].includes(reason.code))
        {
          uncertain.set(productId, operation);
        }
        accessFailure(reason);
      }
      throw reason;
    }
    finally
    {
      if (currentGeneration === generation)
      {
        pending.delete(productId);
        emit();
      }
    }
  }

  async function reconcile(productId)
  {
    const operation = uncertain.get(productId);
    if (!operation || pending.has(productId))
    {
      return snapshot();
    }
    const currentGeneration = generation;
    pending.set(productId, operation);
    emit();
    try
    {
      const result = await adapter.reconcile(operation.id);
      if (currentGeneration !== generation)
      {
        return snapshot();
      }
      if (!result || result.outcome === "unknown")
      {
        throw failure("uncertain", "Hasil belum tersedia. Periksa kembali sebelum mengulangi perubahan.");
      }
      applyAccount(result);
      uncertain.delete(productId);
      error = null;
    }
    catch (reason)
    {
      if (currentGeneration === generation)
      {
        accessFailure(reason);
      }
    }
    finally
    {
      if (currentGeneration === generation)
      {
        pending.delete(productId);
        emit();
      }
    }
    return snapshot();
  }

  function resetStorage()
  {
    memoryOnly = false;
    warning = "";
    persistGuest();
    emit();
  }

  readGuest();
  return {
    ready: refresh(), snapshot, refresh, setSaved, mergeGuest, reconcile, resetStorage,
    has: (productId) => items.has(productId),
    subscribe(listener)
    {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
};

(() =>
{
  const preview = window.RylvaWishlistPreviewRepository;
  const store = window.RylvaWishlistStoreFactory(
  {
    adapter: window.RylvaWishlistAdapter || preview?.adapter,
    guestKey: preview?.guestKey,
    guestSeed: preview?.guestSeed,
    storage: preview?.storage
  });
  window.RylvaWishlistStore = store;
  let binding = null;
  const registeredProducts = new Map((window.RylvaStorefrontProductPreviewData?.products || [])
    .map((product) => [product.productId, product]));

  store.registerProducts = (products) =>
  {
    products.forEach((product) => registeredProducts.set(product.productId, product));
  };
  store.products = () => structuredClone([...registeredProducts.values()]);
  store.pageUrl = () =>
  {
    const target = new URL("/pages/customer/wishlist.html", location.origin);
    if (preview?.workbench)
    {
      target.searchParams.set("preview", "wishlist");
      target.searchParams.set("state", preview.scenario);
    }
    return target.pathname + target.search;
  };

  function productFor(control)
  {
    const products = [...registeredProducts.values()];
    if (control.dataset.wishlistProductId)
    {
      return registeredProducts.get(control.dataset.wishlistProductId)
        || { productId: control.dataset.wishlistProductId, name: "Produk" };
    }
    const slug = control.dataset.homeSave || new URLSearchParams(location.search).get("product") || "monstera";
    return products.find((item) => item.slug === slug)
      || (control.dataset.wishlistProductId ? { productId: control.dataset.wishlistProductId, name: "Produk" } : null);
  }

  function synchronize()
  {
    const state = store.snapshot();
    const navigation = document.querySelector('header [data-storefront-page="Wishlist"]');
    const badge = navigation?.querySelector(".storefront-wishlist-count");
    if (badge)
    {
      const count = state.items.length;
      badge.hidden = state.status !== "ready" || count === 0;
      badge.textContent = count > 99 ? "99+" : String(count);
      navigation.setAttribute("aria-label", state.status === "ready"
        ? `Wishlist, ${count} produk tersimpan` : "Wishlist, memeriksa daftar tersimpan");
    }
    document.querySelectorAll("[data-home-save], [data-product-save]").forEach((control) =>
    {
      const product = productFor(control);
      if (!product)
      {
        return;
      }
      const saved = store.has(product.productId);
      const busy = state.pending.includes(product.productId) || state.uncertain.includes(product.productId)
        || state.mergeProductIds.includes(product.productId);
      control.setAttribute("aria-pressed", String(saved));
      control.setAttribute("aria-busy", String(busy));
      control.setAttribute("aria-label", state.status !== "ready" ? "Memeriksa Wishlist"
        : `${saved ? "Hapus" : "Simpan"} ${product.name} ${saved ? "dari" : "ke"} Wishlist`);
      control.disabled = state.status !== "ready" || busy;
    });
  }

  store.bind = (callbacks) =>
  {
    binding = callbacks;
    store.ready.then(() =>
    {
      binding.onChange?.(store.snapshot());
      synchronize();
    });
  };
  store.synchronize = synchronize;
  store.subscribe((state) =>
  {
    binding?.onChange?.(state);
    synchronize();
  });

  document.addEventListener("click", async (event) =>
  {
    const control = event.target.closest("[data-home-save], [data-product-save], [data-storefront-page='Wishlist'], [data-header-saved]");
    if (!control)
    {
      return;
    }
    if (control.hasAttribute("data-header-wishlist-trigger") || control.dataset.storefrontPage === "Wishlist")
    {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    if (control.dataset.storefrontPage === "Wishlist" || control.hasAttribute("data-header-saved"))
    {
      location.assign(store.pageUrl());
      return;
    }
    if (control.disabled)
    {
      return;
    }
    const product = productFor(control);
    if (!product)
    {
      return;
    }
    const desired = !store.has(product.productId);
    binding?.onIntent?.({ product, desired, control });
    try
    {
      await store.setSaved(product.productId, desired);
      const state = store.snapshot();
      const destination = state.mode === "guest" ? state.memoryOnly ? " pada halaman ini" : " sementara di tab ini"
        : state.preview ? " pada akun pratinjau" : " di akun Anda";
      binding?.onMessage?.(product.name + (desired ? " disimpan" + destination + "." : " dihapus dari Wishlist."), false,
        { product, desired, owner: state.owner });
    }
    catch (reason)
    {
      binding?.onMessage?.(reason.message || "Perubahan belum tersimpan. Coba lagi.", true, { product, desired });
    }
  }, true);

  addEventListener("pageshow", (event) =>
  {
    if (event.persisted)
    {
      store.refresh();
    }
  });
  addEventListener("rylva:customer-session", () => store.refresh());
})();
