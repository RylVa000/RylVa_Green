"use strict";

(() =>
{
  const store = window.RylvaWishlistStore;
  const repository = window.RylvaWishlistPageAdapter || window.RylvaWishlistPreviewRepository;
  const { escapeHtml } = window.RylvaProductCard;
  const grid = document.getElementById("wishlist-products");
  const count = document.getElementById("wishlist-count");
  const notice = document.getElementById("wishlist-notice");
  const toast = document.getElementById("home-toast");
  const search = document.getElementById("wishlist-search");
  const category = document.getElementById("wishlist-category");
  const availability = document.getElementById("wishlist-availability");
  const sort = document.getElementById("wishlist-sort");
  const sheet = document.getElementById("wishlist-sheet");
  const sheetFilters = document.getElementById("wishlist-sheet-filters");
  const sheetSort = document.getElementById("wishlist-sheet-sort");
  const filters = document.getElementById("wishlist-filters");
  const more = document.getElementById("wishlist-more");
  const moreButton = document.getElementById("wishlist-load-more");
  const moreStatus = document.getElementById("wishlist-more-status");
  const compact = matchMedia("(max-width: 700px)");
  const batchSize = 6;
  const categoryNames = { indoor: "Tanaman indoor", outdoor: "Tanaman outdoor", bouquet: "Buket bunga",
    custom: "Buket kustom", pots: "Pot & vas", media: "Media tanam", nutrients: "Pupuk", tools: "Alat berkebun" };
  const sortNames = { recent: "Terakhir disimpan", price_asc: "Harga terendah", price_desc: "Harga tertinggi", name: "Nama A sampai Z" };
  let products = [];
  let productMap = new Map();
  let state = store.snapshot();
  let metadataLoading = true;
  let metadataError = null;
  let partial = false;
  let stale = false;
  let cart = null;
  let selection = readUrl();
  let limit = selection.shown;
  let productsVersion = 0;
  let renderedKey = "";
  let loadingMore = false;
  let appendVersion = 0;
  let appendFaultUsed = false;
  let pendingFocus = null;
  let undo = null;
  let retryAction = null;
  let retryLabel = "Coba lagi";
  const adding = new Set();
  const uncertainCart = new Set();
  let sheetOpener = null;
  let sheetClosing = false;
  let revalidated = false;
  let requestVersion = 0;
  const observer = typeof IntersectionObserver === "function" ? new IntersectionObserver((entries) =>
  {
    if (entries.some((entry) => entry.isIntersecting))
    {
      loadMore();
    }
  }, { rootMargin: "0px 0px 80px 0px" }) : null;
  const motion = window.RylvaCatalogSheetMotion.init({ sheet, onDismiss: () => closeSheet(), isClosing: () => sheetClosing });
  const header = window.RylvaHomepageHeader.init(
  {
    readCart: () => repository.readCart(),
    removeItem: (lineId) => window.RylvaCartPreviewRepository.mutate(lineId, null, cart.revision),
    onCartChange: (value) => updateCart(value),
    openDetail: (slug) => openDetail(slug),
    openSaved: () => location.assign("/pages/customer/wishlist.html"),
    browseCollection: () => location.assign("/pages/public/catalog.html")
  });

  function readUrl()
  {
    const query = new URLSearchParams(location.search);
    const shown = Number(query.get("shown"));
    return { q: (query.get("q") || "").slice(0, 100), category: query.get("category") || "all",
      availability: ["available", "unavailable"].includes(query.get("availability")) ? query.get("availability") : "all",
      sort: Object.hasOwn(sortNames, query.get("sort")) ? query.get("sort") : "recent",
      shown: Number.isSafeInteger(shown) && shown >= batchSize ? shown : batchSize };
  }

  function writeUrl()
  {
    const url = new URL(location.href);
    for (const key of ["q", "category", "availability", "sort", "shown"])
    {
      url.searchParams.delete(key);
    }
    if (selection.q)
    {
      url.searchParams.set("q", selection.q);
    }
    if (selection.category !== "all")
    {
      url.searchParams.set("category", selection.category);
    }
    if (selection.availability !== "all")
    {
      url.searchParams.set("availability", selection.availability);
    }
    if (selection.sort !== "recent")
    {
      url.searchParams.set("sort", selection.sort);
    }
    if (limit > batchSize)
    {
      url.searchParams.set("shown", String(limit));
    }
    history.replaceState({ ...history.state, wishlistContext: { owner: state.owner, shown: limit } }, "", url);
    document.getElementById("wishlist-login").href = loginUrl();
  }

  function loginUrl()
  {
    const target = new URL("/pages/auth/customer-login.html", location.origin);
    target.searchParams.set("returnTo", location.pathname + location.search);
    return target.pathname + target.search;
  }

  function updateCart(value)
  {
    cart = value;
    const total = value?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
    document.querySelectorAll(".storefront-cart-count").forEach((element) => element.textContent = total);
    document.querySelector('header [data-storefront-page="Keranjang"]')?.setAttribute("aria-label", `Keranjang, ${total} unit produk contoh`);
  }

  function filtered()
  {
    const query = selection.q.trim().toLocaleLowerCase("id");
    const records = state.items.map((item) => ({ ...item, product: productMap.get(item.productId) }));
    const selected = records.filter(({ product }) =>
    {
      return (!query || product?.name.toLocaleLowerCase("id").includes(query))
        && (selection.category === "all" || product?.categories.includes(selection.category))
        && (selection.availability === "all" || (selection.availability === "available"
          ? product?.available && product.availableStock > 0 : product?.available && product.availableStock <= 0));
    });
    selected.sort((first, second) =>
    {
      if (selection.sort.startsWith("price"))
      {
        const firstValid = Number.isSafeInteger(first.product?.price) && first.product.price >= 0;
        const secondValid = Number.isSafeInteger(second.product?.price) && second.product.price >= 0;
        if (firstValid !== secondValid)
        {
          return firstValid ? -1 : 1;
        }
        if (firstValid && first.product.price !== second.product.price)
        {
          return (first.product.price - second.product.price) * (selection.sort === "price_desc" ? -1 : 1);
        }
      }
      if (selection.sort === "name")
      {
        return (first.product?.name || "").localeCompare(second.product?.name || "", "id")
          || first.productId.localeCompare(second.productId);
      }
      return second.savedAt - first.savedAt || first.productId.localeCompare(second.productId);
    });
    return selected;
  }

  function showMessage(message, isError = false, context = null)
  {
    if (context && !isError)
    {
      undo = context.desired ? null : context;
      retryAction = null;
    }
    toast.hidden = false;
    toast.setAttribute("role", isError ? "alert" : "status");
    toast.innerHTML = `
      <span>${escapeHtml(message)}</span>
      ${undo && !isError ? '<button class="home-text-button" type="button" data-wishlist-undo>Simpan kembali</button>' : ""}
      ${retryAction && isError ? `<button class="home-text-button" type="button" data-wishlist-retry-action>${escapeHtml(retryLabel)}</button>` : ""}
      <button class="home-text-button" type="button" data-wishlist-dismiss aria-label="Tutup pemberitahuan">Tutup</button>`;
  }

  function renderMode()
  {
    const account = state.mode === "account";
    document.getElementById("wishlist-mode-title").textContent = account ? state.preview ? "Wishlist akun pratinjau" : "Pilihan tersimpan di akun"
      : "Wishlist sementara";
    document.getElementById("wishlist-mode-description").textContent = account
      ? state.preview ? "Penyimpanan akun ini masih simulasi pada peramban. Belum tersinkron ke layanan produksi."
        : "Buka kembali pilihan Anda saat masuk dengan akun yang sama."
      : state.memoryOnly ? "Penyimpanan peramban tidak tersedia. Pilihan baru hanya bertahan pada halaman ini."
        : "Disimpan di tab ini. Masuk untuk menyimpannya di akun.";
    document.getElementById("wishlist-login").hidden = account && !["session", "verification"].includes(state.status);
  }

  function renderNotices()
  {
    const messages = [];
    if (state.warning)
    {
      messages.push(`<div><p>${escapeHtml(state.warning)}</p></div><button class="home-text-button" type="button" data-wishlist-reset-storage>Reset penyimpanan</button>`);
    }
    if (state.merge)
    {
      const merged = state.merge;
      const texts = { running: "Sedang menggabungkan pilihan sementara ke Wishlist akun…",
        success: "Pilihan sementara berhasil digabung ke Wishlist akun.", partial: `${merged.remaining} pilihan belum berhasil digabung. Pilihan tersebut tetap disimpan untuk dicoba lagi.`,
        unknown: "Status penggabungan belum pasti. Periksa hasil sebelum mencoba kembali.", error: "Penggabungan belum berhasil. Pilihan sementara Anda tetap tersedia." };
      messages.push(`<div><p>${escapeHtml(texts[merged.status])}</p></div>${["partial", "error", "unknown"].includes(merged.status)
        ? `<button class="home-text-button" type="button" data-wishlist-merge>${merged.status === "unknown" ? "Periksa hasil" : "Coba gabungkan lagi"}</button>` : ""}`);
    }
    if (state.uncertain.length)
    {
      messages.push(`<div><p>Respons perubahan terputus. Periksa hasil sebelum menyimpan atau menghapus lagi.</p></div>
        <button class="home-text-button" type="button" data-wishlist-reconcile="${escapeHtml(state.uncertain[0])}">Periksa hasil</button>`);
    }
    if (partial || stale || (metadataError && products.length))
    {
      messages.push(`<div><p>${partial ? "Sebagian informasi produk belum termuat. Produk lain tetap dapat dilihat."
        : "Informasi produk belum diperbarui. Periksa data terbaru sebelum menambah ke Keranjang."}</p></div>
        <button class="home-text-button" type="button" data-wishlist-retry>Perbarui produk</button>`);
    }
    notice.hidden = messages.length === 0;
    notice.innerHTML = messages.join("\n");
  }

  function emptyState(title, description, action = "catalog")
  {
    return `
      <div class="wishlist-state">
        <svg width="42" height="42" viewBox="0 0 24 24" aria-hidden="true">
          <use href="#home-heart-icon"></use>
        </svg>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(description)}</p>
        ${action === "catalog" ? '<a class="home-button" href="/pages/public/catalog.html">Jelajahi Katalog</a>'
          : action === "login" ? `<a class="home-button" href="${escapeHtml(loginUrl())}">Masuk Kembali</a>`
            : action === "verification" ? `<a class="home-button" href="/pages/auth/verify-email.html?returnTo=${encodeURIComponent(location.pathname + location.search)}">Verifikasi Akun</a>`
              : `<button class="home-button" type="button" data-wishlist-${action}>${action === "reset" ? "Reset filter" : "Coba Lagi"}</button>`}
      </div>`;
  }

  function missingCard(item)
  {
    return `
      <article class="home-product" data-product-id="${escapeHtml(item.productId)}">
        <div class="home-product-picture" data-image-failed="true"></div>
        <div class="home-product-info">
          <div class="home-product-heading">
            <h3>Produk tidak ditemukan</h3>
          </div>
          <p class="home-product-description">Informasi produk ini belum tersedia. Hapus dari Wishlist atau coba muat kembali.</p>
          <div class="home-product-actions">
            <button class="home-text-button" type="button" data-wishlist-remove="${escapeHtml(item.productId)}">Hapus dari Wishlist</button>
          </div>
        </div>
      </article>`;
  }

  function render()
  {
    renderMode();
    renderNotices();
    const results = filtered();
    const loading = metadataLoading || state.status === "loading";
    const filterCount = Number(selection.category !== "all") + Number(selection.availability !== "all");
    const hasFilters = Boolean(selection.q || filterCount);
    const chips = [selection.q ? { key: "q", label: `Pencarian: ${selection.q}` } : null,
      selection.category !== "all" ? { key: "category", label: categoryNames[selection.category] || selection.category } : null,
      selection.availability !== "all" ? { key: "availability", label: selection.availability === "available" ? "Tersedia" : "Stok habis" } : null].filter(Boolean);
    document.getElementById("wishlist-active-filters").innerHTML = chips.map((chip) => `
      <button class="wishlist-filter-chip" type="button" data-wishlist-clear="${chip.key}" aria-label="Hapus filter ${escapeHtml(chip.label)}">
        <span>${escapeHtml(chip.label)}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <use href="#home-close-icon"></use>
        </svg>
      </button>`).join("\n");
    document.getElementById("wishlist-active-filters").hidden = !chips.length;
    const mobileSort = document.querySelector('[data-wishlist-sheet="sort"] span');
    mobileSort.textContent = selection.sort === "recent" ? "Urutkan" : selection.sort === "name" ? "Nama A–Z" : sortNames[selection.sort];
    document.getElementById("wishlist-reset").hidden = !hasFilters;
    document.getElementById("wishlist-filter-count").hidden = filterCount === 0;
    document.getElementById("wishlist-filter-count").textContent = filterCount;
    document.getElementById("wishlist-sheet-results").textContent = `Lihat ${results.length} Produk`;
    sheetSort.querySelectorAll("input").forEach((input) => input.checked = input.value === selection.sort);
    count.textContent = loading ? "Memuat Wishlist…" : state.status !== "ready" ? "Wishlist belum dapat ditampilkan"
      : `${results.length ? `Menampilkan ${Math.min(limit, results.length)} dari ${results.length}` : "0"} produk${hasFilters ? " sesuai pencarian dan filter" : " tersimpan"}`;
    grid.setAttribute("aria-busy", String(loading));
    const key = JSON.stringify([state.status, state.items, productsVersion, metadataLoading, metadataError?.code, selection, limit]);
    if (renderedKey !== key)
    {
      renderedKey = key;
      if (loading)
      {
        grid.innerHTML = Array.from({ length: 6 }, () => `
          <div class="wishlist-skeleton" aria-hidden="true">
            <span></span>
            <div>
              <i></i>
              <i></i>
              <i></i>
            </div>
          </div>`).join("\n");
      }
      else if (state.status !== "ready")
      {
        const titles = { session: "Masuk kembali untuk melihat Wishlist", denied: "Wishlist tidak dapat diakses", verification: "Verifikasi akun diperlukan" };
        grid.innerHTML = emptyState(titles[state.status] || "Wishlist belum dapat dimuat", state.error?.message || "Coba lagi. Pilihan sementara Anda tetap tersedia.",
          state.status === "session" ? "login" : state.status === "verification" ? "verification" : state.status === "denied" ? "catalog" : "retry");
      }
      else if (metadataError && !products.length && state.items.length)
      {
        grid.innerHTML = emptyState(metadataError.code === "offline" ? "Koneksi terputus" : "Informasi produk belum dapat dimuat",
          "Pilihan tersimpan tetap ada. Sambungkan kembali atau coba muat produknya lagi.", "retry");
      }
      else if (!state.items.length)
      {
        grid.innerHTML = emptyState("Wishlist masih kosong", "Ketuk ikon hati pada produk yang Anda suka. Pilihan Anda akan terkumpul di sini.");
      }
      else if (!results.length)
      {
        grid.innerHTML = emptyState(selection.q ? "Produk tidak ditemukan di Wishlist" : "Belum ada produk sesuai filter",
          "Coba nama lain atau reset filter. Produk tersimpan Anda tetap ada.", "reset");
      }
      else
      {
        grid.innerHTML = results.slice(0, limit).map((item) => item.product ? window.RylvaProductCard.render(item.product,
        {
          pending: stale || Boolean(metadataError) || !item.product.unit || adding.has(item.productId) || uncertainCart.has(item.productId),
          purchaseAction: item.product.kind === "custom" ? "custom" : item.product.hasVariants ? "detail" : "add"
        }) : missingCard(item)).join("\n");
      }
      if (pendingFocus && !state.items.some((item) => item.productId === pendingFocus.productId))
      {
        const cards = [...grid.querySelectorAll(".home-product")];
        const nextCard = cards[Math.min(pendingFocus.index, cards.length - 1)];
        const target = nextCard?.querySelector("[data-home-save]") || nextCard?.querySelector("button")
          || grid.querySelector("a, button");
        target?.focus({ preventScroll: true });
        pendingFocus = null;
      }
    }
    store.synchronize();
    const canAppend = !loading && state.status === "ready" && limit < results.length && (!metadataError || products.length);
    more.hidden = !canAppend;
    document.getElementById("wishlist-end").hidden = loading || state.status !== "ready" || !results.length || limit < results.length || Boolean(metadataError);
    moreButton.disabled = loadingMore;
    observer?.disconnect();
    if (canAppend && !loadingMore && !sheet.open)
    {
      observer?.observe(document.getElementById("wishlist-sentinel"));
    }
  }

  function applyControls()
  {
    selection = { q: search.value.slice(0, 100), category: category.value,
      availability: availability.value, sort: sort.value, shown: batchSize };
    limit = batchSize;
    appendVersion++;
    loadingMore = false;
    moreStatus.textContent = "";
    writeUrl();
    render();
  }

  function reset()
  {
    search.value = "";
    category.value = "all";
    availability.value = "all";
    applyControls();
  }

  async function load(recover = false)
  {
    const version = ++requestVersion;
    metadataLoading = products.length === 0;
    metadataError = null;
    render();
    if (recover)
    {
      repository.recover?.();
      await store.refresh();
    }
    try
    {
      const result = await repository.loadProducts({ recover });
      if (version !== requestVersion)
      {
        return;
      }
      products = result.products;
      productMap = new Map(products.map((product) => [product.productId, product]));
      store.registerProducts?.(products);
      productsVersion++;
      partial = Boolean(result.partial);
      stale = Boolean(result.stale);
      const categories = [...new Set(products.flatMap((product) => product.categories))];
      category.innerHTML = '<option value="all">Semua kategori</option>' + categories.map((key) =>
        `<option value="${escapeHtml(key)}">${escapeHtml(categoryNames[key] || key)}</option>`).join("\n");
      if (!categories.includes(selection.category))
      {
        selection.category = "all";
      }
      category.value = selection.category;
    }
    catch (reason)
    {
      if (version === requestVersion)
      {
        metadataError = reason;
      }
    }
    finally
    {
      if (version === requestVersion)
      {
        metadataLoading = false;
        await store.ready;
        state = store.snapshot();
        render();
        writeUrl();
        if (!revalidated)
        {
          revalidated = true;
          window.RylvaProductNavigation.restore();
        }
      }
    }
  }

  async function loadMore()
  {
    if (loadingMore || metadataLoading || state.status !== "ready" || limit >= filtered().length || sheet.open)
    {
      return;
    }
    const version = ++appendVersion;
    loadingMore = true;
    observer?.disconnect();
    moreButton.disabled = true;
    moreStatus.textContent = "Memuat produk berikutnya…";
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (version !== appendVersion)
    {
      return;
    }
    if (repository.scenario === "appendError" && !appendFaultUsed)
    {
      appendFaultUsed = true;
      loadingMore = false;
      moreButton.disabled = false;
      moreStatus.textContent = "Produk berikutnya belum termuat. Coba lagi; produk sebelumnya tetap tersedia.";
      return;
    }
    const previousLimit = limit;
    const restoreFocus = document.activeElement === moreButton;
    limit = Math.min(limit + batchSize, filtered().length);
    loadingMore = false;
    writeUrl();
    render();
    moreStatus.textContent = "Produk berikutnya ditampilkan.";
    if (restoreFocus)
    {
      grid.children[previousLimit]?.querySelector("button")?.focus({ preventScroll: true });
    }
  }

  function openDetail(slug)
  {
    writeUrl();
    header.close();
    window.RylvaProductNavigation.open(slug);
  }

  async function addProduct(slug)
  {
    const product = products.find((item) => item.slug === slug);
    if (!product || adding.has(product.productId) || uncertainCart.has(product.productId))
    {
      return;
    }
    if (product.hasVariants)
    {
      openDetail(slug);
      return;
    }
    if (product.kind === "custom")
    {
      location.assign("/pages/customer/bouquet-customizer.html");
      return;
    }
    if (!window.RylvaProductCard.canBuy(product) || !product.unit || stale || metadataError)
    {
      showMessage("Perbarui informasi produk sebelum menambah ke Keranjang.", true);
      return;
    }
    adding.add(product.productId);
    grid.querySelector(`[data-product-id="${CSS.escape(product.productId)}"] [data-home-add]`).disabled = true;
    try
    {
      updateCart(await repository.readCart());
      updateCart(await repository.add(product.productId));
      undo = null;
      retryAction = null;
      showMessage(`${product.name} ditambahkan ke keranjang contoh. Wishlist tetap tersimpan.`);
      toast.insertAdjacentHTML("beforeend", '<a href="/pages/customer/cart.html">Lihat Keranjang</a>');
    }
    catch (reason)
    {
      retryLabel = ["timeout", "uncertain"].includes(reason.code) ? "Periksa hasil" : "Coba lagi";
      if (["timeout", "uncertain"].includes(reason.code))
      {
        uncertainCart.add(product.productId);
        retryAction = async () =>
        {
          updateCart(await repository.readCart());
          uncertainCart.delete(product.productId);
          const button = grid.querySelector(`[data-product-id="${CSS.escape(product.productId)}"] [data-home-add]`);
          if (button)
          {
            button.disabled = false;
          }
          retryAction = null;
          showMessage("Keranjang sudah diperbarui. Periksa jumlah produk sebelum menambahkan lagi.");
          toast.insertAdjacentHTML("beforeend", '<a href="/pages/customer/cart.html">Periksa Keranjang</a>');
        };
      }
      else
      {
        retryAction = () => addProduct(slug);
      }
      showMessage(reason.message || "Produk belum ditambahkan. Coba lagi.", true);
      if (reason.code === "conflict")
      {
        toast.insertAdjacentHTML("beforeend", '<a href="/pages/customer/cart.html">Periksa Keranjang</a>');
      }
    }
    finally
    {
      adding.delete(product.productId);
      const button = grid.querySelector(`[data-product-id="${CSS.escape(product.productId)}"] [data-home-add]`);
      if (button)
      {
        button.disabled = !window.RylvaProductCard.canBuy(product) || stale || Boolean(metadataError) || uncertainCart.has(product.productId);
      }
    }
  }

  function finishSheet()
  {
    sheetClosing = false;
    sheet.close();
    motion.reset();
    document.getElementById("wishlist-filter-home").append(filters);
    document.body.classList.remove("catalog-sheet-open");
    document.querySelectorAll("[data-wishlist-sheet]").forEach((button) => button.setAttribute("aria-expanded", "false"));
    sheetOpener?.focus({ preventScroll: true });
    render();
  }

  async function closeSheet()
  {
    if (!sheet.open || sheetClosing)
    {
      return;
    }
    sheetClosing = true;
    await motion.dismiss();
    if (history.state?.wishlistSheet)
    {
      history.back();
    }
    else
    {
      finishSheet();
    }
  }

  function openSheet(view)
  {
    if (!compact.matches || sheet.open)
    {
      return;
    }
    sheetOpener = document.activeElement;
    header.close();
    sheet.dataset.view = view;
    sheetFilters.hidden = view !== "filter";
    sheetSort.hidden = view !== "sort";
    document.getElementById("wishlist-sheet-footer").hidden = view !== "filter";
    document.getElementById("wishlist-sheet-title").textContent = view === "sort" ? "Urutkan" : "Filter";
    if (view === "filter")
    {
      sheetFilters.append(filters);
    }
    history.pushState({ ...history.state, wishlistSheet: view }, "", location.href);
    sheet.showModal();
    document.body.classList.add("catalog-sheet-open");
    document.querySelectorAll("[data-wishlist-sheet]").forEach((button) =>
      button.setAttribute("aria-expanded", String(button.dataset.wishlistSheet === view)));
    document.getElementById("wishlist-sheet-title").focus({ preventScroll: true });
    render();
  }

  store.bind(
  {
    onChange: (value) =>
    {
      if (state.owner !== value.owner)
      {
        undo = null;
        retryAction = null;
        adding.clear();
        uncertainCart.clear();
        toast.hidden = true;
      }
      state = value;
      render();
    },
    onIntent: ({ product, desired, control }) =>
    {
      if (!desired && document.activeElement === control)
      {
        pendingFocus = { productId: product.productId, index: [...grid.children].indexOf(control.closest(".home-product")) };
      }
    },
    onMessage: (message, isError, context) =>
    {
      if (isError && context && !state.uncertain.includes(context.product.productId))
      {
        retryLabel = "Coba lagi";
        retryAction = async () =>
        {
          await store.setSaved(context.product.productId, context.desired);
          showMessage("Wishlist sudah diperbarui.");
        };
      }
      showMessage(message, isError, context);
    }
  });

  search.value = selection.q;
  availability.value = selection.availability;
  sort.value = selection.sort;
  sheetSort.insertAdjacentHTML("beforeend", Object.entries(sortNames).map(([value, label]) => `
    <label class="catalog-sort-choice">
      <span>${escapeHtml(label)}</span>
      <input type="radio" name="wishlist-sheet-sort" value="${value}">
    </label>`).join("\n"));
  document.getElementById("wishlist-search-form").addEventListener("submit", (event) =>
  {
    event.preventDefault();
    applyControls();
  });
  search.addEventListener("input", applyControls);
  [category, availability, sort].forEach((control) => control.addEventListener("change", applyControls));
  document.getElementById("wishlist-reset").addEventListener("click", reset);
  moreButton.addEventListener("click", loadMore);
  sheetSort.addEventListener("change", (event) =>
  {
    sort.value = event.target.value;
    applyControls();
    closeSheet();
  });
  sheet.addEventListener("cancel", (event) =>
  {
    event.preventDefault();
    closeSheet();
  });
  sheet.addEventListener("click", (event) =>
  {
    if (event.target === sheet)
    {
      const rect = sheet.getBoundingClientRect();
      if (event.clientY < rect.top || event.clientX < rect.left || event.clientX > rect.right)
      {
        closeSheet();
      }
    }
  });
  compact.addEventListener("change", () =>
  {
    if (!compact.matches && sheet.open)
    {
      closeSheet();
    }
  });
  addEventListener("popstate", () =>
  {
    if (sheet.open && !history.state?.wishlistSheet)
    {
      finishSheet();
      writeUrl();
      return;
    }
    selection = readUrl();
    limit = selection.shown;
    search.value = selection.q;
    category.value = selection.category;
    availability.value = selection.availability;
    sort.value = selection.sort;
    render();
  });
  if (history.state?.wishlistSheet)
  {
    const cleanState = { ...history.state };
    delete cleanState.wishlistSheet;
    history.replaceState(cleanState, "", location.href);
  }

  document.addEventListener("click", async (event) =>
  {
    const control = event.target.closest("button");
    if (!control || control.disabled)
    {
      return;
    }
    try
    {
      if (control.dataset.homeDetail)
      {
        openDetail(control.dataset.homeDetail);
      }
      else if (control.dataset.homeAdd)
      {
        await addProduct(control.dataset.homeAdd);
      }
      else if (control.dataset.wishlistSheet)
      {
        openSheet(control.dataset.wishlistSheet);
      }
      else if (control.hasAttribute("data-wishlist-sheet-close"))
      {
        closeSheet();
      }
      else if (control.hasAttribute("data-wishlist-sheet-reset"))
      {
        if (sheet.dataset.view === "sort")
        {
          sort.value = "recent";
          applyControls();
        }
        else
        {
          reset();
        }
      }
      else if (control.hasAttribute("data-wishlist-reset"))
      {
        reset();
        search.focus();
      }
      else if (control.dataset.wishlistClear)
      {
        const key = control.dataset.wishlistClear;
        const field = key === "q" ? search : key === "category" ? category : availability;
        field.value = key === "q" ? "" : "all";
        applyControls();
        const target = compact.matches && key !== "q" ? document.querySelector('[data-wishlist-sheet="filter"]') : field;
        target.focus({ preventScroll: true });
      }
      else if (control.hasAttribute("data-wishlist-retry"))
      {
        await load(true);
      }
      else if (control.hasAttribute("data-wishlist-reset-storage"))
      {
        store.resetStorage();
      }
      else if (control.dataset.wishlistReconcile)
      {
        await store.reconcile(control.dataset.wishlistReconcile);
      }
      else if (control.hasAttribute("data-wishlist-merge"))
      {
        await store.mergeGuest({ reconcile: state.merge.status === "unknown" });
      }
      else if (control.hasAttribute("data-wishlist-undo") && undo)
      {
        const last = undo;
        if (last.owner !== state.owner)
        {
          return;
        }
        control.disabled = true;
        await store.setSaved(last.product.productId, true);
        undo = null;
        showMessage(last.product.name + " disimpan kembali.");
      }
      else if (control.dataset.wishlistRemove)
      {
        await store.setSaved(control.dataset.wishlistRemove, false);
        showMessage("Produk dihapus dari Wishlist.");
        (grid.querySelector("button, a") || search).focus({ preventScroll: true });
      }
      else if (control.hasAttribute("data-wishlist-retry-action") && retryAction)
      {
        control.disabled = true;
        await retryAction();
      }
      else if (control.hasAttribute("data-wishlist-dismiss"))
      {
        toast.hidden = true;
        search.focus({ preventScroll: true });
      }
      else if (control.hasAttribute("data-home-close"))
      {
        document.getElementById("home-dialog").close();
      }
    }
    catch (reason)
    {
      showMessage(reason.message || "Perubahan belum tersimpan. Coba lagi.", true);
    }
    finally
    {
      if (control.isConnected && !control.hasAttribute("data-home-add"))
      {
        control.disabled = false;
      }
    }
  });
  document.addEventListener("click", (event) =>
  {
    const control = event.target.closest("[data-storefront-page]");
    const page = control?.dataset.storefrontPage;
    const routes = { "Koleksi Baru": "", "Promo Spesial": "discount=5", "Tanaman Hias": "category=plants",
      "Terrarium & Moss": "category=terrarium", "Media Tanam": "category=media", "Pot & Vas": "category=pots",
      "Alat Berkebun": "category=tools", "Pupuk & Nutrisi": "category=media" };
    if (Object.hasOwn(routes, page))
    {
      event.preventDefault();
      event.stopImmediatePropagation();
      location.assign("/pages/public/catalog.html" + (routes[page] ? "?" + routes[page] : ""));
    }
  }, true);
  document.getElementById("storefront-search").addEventListener("submit", (event) =>
  {
    event.preventDefault();
    event.stopImmediatePropagation();
    const query = document.getElementById("storefront-search-input").value.trim();
    location.assign("/pages/public/catalog.html" + (query ? "?q=" + encodeURIComponent(query) : ""));
  }, true);
  document.addEventListener("error", (event) =>
  {
    const frame = event.target.closest?.(".home-product-picture");
    if (event.target.tagName === "IMG" && frame)
    {
      event.target.hidden = true;
      frame.dataset.imageFailed = "true";
    }
  }, true);
  addEventListener("offline", () =>
  {
    stale = true;
    productsVersion++;
    render();
    showMessage("Koneksi terputus. Pilihan sementara tetap dapat dikelola; informasi produk perlu diperbarui.", true);
  });
  addEventListener("online", () => load(true));
  addEventListener("storage", (event) =>
  {
    if (state.mode === "account" && event.key?.startsWith("rylva-wishlist-preview-account-v1:"))
    {
      store.refresh();
    }
  });
  addEventListener("pageshow", async (event) =>
  {
    if (event.persisted)
    {
      await load(true);
      window.RylvaProductNavigation.restore();
    }
  });
  repository.readCart().then(updateCart).catch(() =>
  {
    // The shared cart panel provides its own retry and error state when opened.
  });
  load();
})();
