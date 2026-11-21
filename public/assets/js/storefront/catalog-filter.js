"use strict";

(() =>
{
  const repository = window.RylvaCatalogAdapter || window.RylvaHomepagePreviewRepository;
  const { escapeHtml, money, canBuy } = window.RylvaProductCard;
  const grid = document.getElementById("catalog-products");
  const form = document.getElementById("catalog-filters");
  const search = document.getElementById("storefront-search-input");
  const sort = document.getElementById("catalog-sort");
  const resultCount = document.getElementById("catalog-result-count");
  const activeFilters = document.getElementById("catalog-active-filters");
  const loadMoreRegion = document.getElementById("catalog-load-more");
  const loadMoreStatus = document.getElementById("catalog-load-more-status");
  const sentinel = document.getElementById("catalog-scroll-sentinel");
  const listEnd = document.getElementById("catalog-list-end");
  const feedback = document.getElementById("catalog-feedback");
  const priceError = document.getElementById("catalog-price-error");
  const minPrice = document.getElementById("catalog-min-price");
  const maxPrice = document.getElementById("catalog-max-price");
  const dialog = document.getElementById("home-dialog");
  const dialogTitle = document.getElementById("home-dialog-title");
  const dialogBody = document.getElementById("home-dialog-body");
  const toast = document.getElementById("home-toast");
  const batchSize = 6;
  const categoryPage = window.RylvaCategoryPage || null;
  const collectionPage = window.RylvaCollectionPage || null;
  const fixedCategory = categoryPage?.category?.id || null;
  const categories = window.RylvaStorefrontCategories;
  const categoryNames = Object.fromEntries(categories.categories.map((category) => [category.id, category.name]));
  const curatedOrder = ["peace-lily", "monstera", "snake-plant", "aglaonema", "calathea", "sirih-gading"];
  const savedProducts = new Set();
  let products = [];
  let cart = null;
  let loading = false;
  let failure = null;
  let pending = false;
  let opener = null;
  let openerSlug = null;
  let listScroll = 0;
  let urlTimer = null;
  let selection = readUrl();
  let controls = null;
  let loadingMore = false;
  let appendVersion = 0;
  const moreObserver = typeof IntersectionObserver === "function" ? new IntersectionObserver((entries) =>
  {
    if (entries.some((entry) => entry.isIntersecting))
    {
      loadMore();
    }
  }, { rootMargin: "0px 0px 120px 0px" }) : null;
  const header = window.RylvaHomepageHeader.init(
  {
    readCart: () => repository.readCart(),
    removeItem: (lineId) => repository.remove(lineId),
    onCartChange: (snapshot) =>
    {
      cart = snapshot;
      updateCartCount();
    },
    openDetail: (slug) => openDetail(slug),
    openSaved: () => selectSaved(),
    browseCollection: () =>
    {
      if (categoryPage && !fixedCategory)
      {
        location.assign("/pages/public/catalog.html");
        return;
      }
      reset();
      resultCount.tabIndex = -1;
      resultCount.focus({ preventScroll: true });
      resultCount.scrollIntoView({ block: "start" });
    }
  });

  controls = window.RylvaCatalogControls.init(
  {
    beforeNavigate: () =>
    {
      writeUrl();
      header.close();
    },
    onSort: (value) =>
    {
      sort.value = value;
      readControls();
      writeUrl();
    },
    onReset: () => reset()
  });

  function parsePrice(value)
  {
    const normalized = value.trim().replace(/[.\s]/g, "");
    if (!normalized)
    {
      return null;
    }
    const amount = Number(normalized);
    return /^\d+$/.test(normalized) && Number.isSafeInteger(amount) ? amount : NaN;
  }

  function readUrl()
  {
    const params = new URLSearchParams(location.search);
    const readAmount = (name) =>
    {
      const value = parsePrice(params.get(name) || "");
      return Number.isNaN(value) ? null : value;
    };
    const minimum = readAmount("min_price");
    const maximum = readAmount("max_price");
    const limit = Number(params.get("loaded")) || Number(params.get("page")) * batchSize;
    return {
      search: (params.get("q") || "").slice(0, 100),
      categories: fixedCategory ? [fixedCategory]
        : [...new Set(params.getAll("category").filter((category) => Object.hasOwn(categoryNames, category)))],
      minPrice: minimum !== null && maximum !== null && minimum > maximum ? null : minimum,
      maxPrice: minimum !== null && maximum !== null && minimum > maximum ? null : maximum,
      discount: [5, 10, 25, 50, 75].includes(Number(params.get("discount"))) ? Number(params.get("discount")) : 0,
      available: params.get("available") === "1",
      saved: params.get("saved") === "1",
      sort: ["price_asc", "price_desc", "name"].includes(params.get("sort")) ? params.get("sort") : "featured",
      limit: Number.isSafeInteger(limit) && limit >= batchSize ? Math.min(limit, 6000) : batchSize
    };
  }

  function synchronizeControls()
  {
    search.value = selection.search;
    sort.value = selection.sort;
    minPrice.value = selection.minPrice ?? "";
    maxPrice.value = selection.maxPrice ?? "";
    form.querySelectorAll('[name="category"]').forEach((input) =>
    {
      input.checked = selection.categories.includes(input.value);
    });
    form.querySelectorAll('[name="discount"]').forEach((input) =>
    {
      input.checked = Number(input.value) === selection.discount;
    });
    form.elements.available.checked = selection.available;
    priceError.hidden = true;
    minPrice.removeAttribute("aria-invalid");
    maxPrice.removeAttribute("aria-invalid");
  }

  function writeUrl(replace = false)
  {
    clearTimeout(urlTimer);
    const url = new URL(location.href);
    ["q", "category", "min_price", "max_price", "discount", "available", "saved", "sort", "page", "loaded"].forEach((name) => url.searchParams.delete(name));
    if (selection.search)
    {
      url.searchParams.set("q", selection.search);
    }
    selection.categories.forEach((category) => url.searchParams.append("category", category));
    const values =
    {
      min_price: selection.minPrice,
      max_price: selection.maxPrice,
      discount: selection.discount || null,
      available: selection.available ? "1" : null,
      saved: selection.saved ? "1" : null,
      sort: selection.sort === "featured" ? null : selection.sort,
      loaded: selection.limit > batchSize ? selection.limit : null
    };
    Object.entries(values).forEach(([name, value]) =>
    {
      if (value !== null)
      {
        url.searchParams.set(name, value);
      }
    });
    if (url.href !== location.href)
    {
      const inSheet = controls?.isOpen();
      const nextState = inSheet ? { ...history.state, catalogSheet: document.getElementById("catalog-sheet").dataset.view }
        : replace ? history.state : null;
      history[replace || inSheet ? "replaceState" : "pushState"](nextState, "", url);
    }
    controls?.rememberUrl();
  }

  function discountOf(product)
  {
    return Number.isSafeInteger(product.price) && product.price >= 0 && product.basePrice > product.price
      ? (product.basePrice - product.price) / product.basePrice * 100 : 0;
  }

  function matchesCategory(product, category)
  {
    return categories.matches(product, category);
  }

  function filteredProducts()
  {
    const query = selection.search.trim().toLocaleLowerCase("id");
    const matches = products.filter((product) =>
    {
      const categories = Object.keys(categoryNames).filter((category) => matchesCategory(product, category));
      const searchable = [product.name, product.productId, product.variantId, product.sku || "", product.description,
        ...categories.map((category) => categoryNames[category])].join(" ").toLocaleLowerCase("id");
      const validPrice = Number.isSafeInteger(product.price) && product.price >= 0;
      return searchable.includes(query)
        && (!selection.categories.length || selection.categories.some((category) => matchesCategory(product, category)))
        && (selection.minPrice === null || (validPrice && product.price >= selection.minPrice))
        && (selection.maxPrice === null || (validPrice && product.price <= selection.maxPrice))
        && (!selection.discount || discountOf(product) >= selection.discount)
        && (!selection.available || (product.available && product.availableStock > 0))
        && (!selection.saved || savedProducts.has(product.slug));
    });
    const orderIndex = (product) => curatedOrder.includes(product.slug) ? curatedOrder.indexOf(product.slug) : curatedOrder.length;
    return matches.sort((first, second) =>
    {
      if (["price_asc", "price_desc"].includes(selection.sort))
      {
        const firstValid = Number.isSafeInteger(first.price) && first.price >= 0;
        const secondValid = Number.isSafeInteger(second.price) && second.price >= 0;
        if (firstValid !== secondValid)
        {
          return firstValid ? -1 : 1;
        }
        return firstValid ? (first.price - second.price) * (selection.sort === "price_desc" ? -1 : 1) : 0;
      }
      return selection.sort === "name" ? first.name.localeCompare(second.name, "id") : orderIndex(first) - orderIndex(second);
    });
  }

  function emptyState(title, description, action = "reset")
  {
    return `
      <div class="home-empty">
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(description)}</p>
        <button class="home-button" type="button" data-catalog-action="${action}">
          ${action === "retry" ? "Coba Lagi" : "Reset Pilihan"}
        </button>
      </div>`;
  }

  function renderChips()
  {
    const chips = fixedCategory ? []
      : selection.categories.map((category) => ({ key: "category", value: category, label: categoryNames[category] }));
    if (selection.search)
    {
      chips.push({ key: "search", label: `Pencarian: ${selection.search}` });
    }
    if (selection.minPrice !== null || selection.maxPrice !== null)
    {
      const label = selection.minPrice !== null && selection.maxPrice !== null
        ? `${money(selection.minPrice)}–${money(selection.maxPrice)}`
        : selection.minPrice !== null ? `Mulai ${money(selection.minPrice)}` : `Hingga ${money(selection.maxPrice)}`;
      chips.push({ key: "price", label });
    }
    if (selection.discount)
    {
      chips.push({ key: "discount", label: `Diskon ${selection.discount}% atau lebih` });
    }
    if (selection.available)
    {
      chips.push({ key: "available", label: "Produk tersedia" });
    }
    if (selection.saved)
    {
      chips.push({ key: "saved", label: "Wishlist contoh" });
    }
    activeFilters.hidden = !chips.length;
    activeFilters.innerHTML = chips.map((chip) => `
      <button
        class="catalog-chip"
        type="button"
        data-catalog-remove="${chip.key}"
        data-value="${escapeHtml(chip.value || "")}"
        aria-label="Hapus filter ${escapeHtml(chip.label)}"
      >
        <span>${escapeHtml(chip.label)}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <use href="#home-close-icon"></use>
        </svg>
      </button>`).join("\n");
    return chips.filter((chip) => !["search", "saved"].includes(chip.key)).length;
  }

  function observeSentinel()
  {
    moreObserver?.unobserve(sentinel);
    if (!sentinel.hidden && !loading && !loadingMore && !dialog.open && !controls.isOpen())
    {
      moreObserver?.observe(sentinel);
    }
  }

  function render({ append = false } = {})
  {
    const filterCount = renderChips();
    const matches = filteredProducts();
    controls.update({ count: matches.length, filterCount, sortValue: selection.sort });
    grid.setAttribute("aria-busy", String(loading));
    loadMoreRegion.hidden = true;
    sentinel.hidden = true;
    listEnd.hidden = true;
    moreObserver?.unobserve(sentinel);
    if (loading && !products.length)
    {
      grid.innerHTML = '<div class="catalog-loading" role="status">Memuat koleksi tanaman…</div>';
      resultCount.textContent = "Memuat produk…";
      return;
    }
    if (failure && !products.length)
    {
      const messages =
      {
        offline: ["Koneksi terputus", "Sambungkan kembali, lalu coba lagi. Pilihan Anda tetap tersimpan."],
        timeout: ["Pemuatan terlalu lama", "Koleksi belum berhasil dimuat. Silakan coba lagi."],
        maintenance: ["Katalog sementara tidak tersedia", "Silakan coba lagi setelah layanan kembali tersedia."]
      };
      const message = messages[failure.code] || ["Produk belum dapat dimuat", "Coba lagi untuk menampilkan koleksi. Pilihan Anda tetap tersimpan."];
      grid.innerHTML = emptyState(message[0], message[1], "retry");
      resultCount.textContent = "Koleksi belum dimuat";
      return;
    }
    const boundedLimit = Math.max(batchSize, Math.min(selection.limit, matches.length));
    if (selection.limit !== boundedLimit)
    {
      selection.limit = boundedLimit;
      writeUrl(true);
    }
    const visible = matches.slice(0, selection.limit);
    resultCount.textContent = matches.length
      ? `Menampilkan 1–${visible.length} dari ${matches.length} produk${loading ? " (memperbarui)" : ""}`
      : "0 produk ditemukan";
    if (visible.length)
    {
      const existingCount = append ? grid.querySelectorAll(".home-product").length : 0;
      const content = visible.slice(existingCount).map((product) =>
        window.RylvaProductCard.render(product, { pending, savedProducts })).join("\n");
      if (append)
      {
        grid.insertAdjacentHTML("beforeend", content);
      }
      else
      {
        grid.innerHTML = content;
      }
    }
    else if (fixedCategory && !products.some((product) => matchesCategory(product, fixedCategory)))
    {
      grid.innerHTML = `
        <div class="home-empty">
          <h2>Belum ada produk di kategori ini</h2>
          <p>Koleksi ${escapeHtml(categoryNames[fixedCategory])} belum tersedia pada pratinjau ini. Pilih kategori lain atau jelajahi semua produk.</p>
          <div class="category-empty-actions">
            <a class="home-button" href="/pages/public/catalog.html">Jelajahi Semua Produk</a>
            ${fixedCategory === "custom" ? '<a class="home-text-button" href="/pages/customer/bouquet-customizer.html">Racik Buket Kustom</a>' : ""}
          </div>
        </div>`;
    }
    else if (!products.length && collectionPage)
    {
      grid.innerHTML = `
        <div class="home-empty">
          <h2>${escapeHtml(collectionPage.emptyTitle)}</h2>
          <p>${escapeHtml(collectionPage.emptyDescription)}</p>
          <a class="home-button" href="/pages/public/catalog.html">Jelajahi Semua Produk</a>
        </div>`;
    }
    else if (!products.length)
    {
      grid.innerHTML = emptyState("Koleksi belum tersedia", "Produk akan tampil setelah koleksi tersedia. Silakan coba lagi nanti.", "retry");
    }
    else
    {
      grid.innerHTML = emptyState(selection.saved ? "Belum ada produk disimpan" : "Belum ada produk yang sesuai",
        selection.saved ? "Simpan produk melalui ikon hati, atau kembali ke semua produk."
          : "Coba kata kunci lain atau kurangi filter untuk melihat lebih banyak pilihan.");
    }
    const hasMore = visible.length < matches.length;
    loadMoreRegion.hidden = !hasMore;
    loadMoreRegion.setAttribute("aria-busy", String(loadingMore));
    loadMoreRegion.querySelector("button").disabled = loadingMore;
    loadMoreStatus.textContent = loadingMore ? "Memuat produk berikutnya…" : "Gulir untuk melihat produk lainnya.";
    sentinel.hidden = !hasMore;
    listEnd.hidden = !visible.length || hasMore;
    observeSentinel();
  }

  async function loadMore()
  {
    if (loading || loadingMore || failure || dialog.open || controls.isOpen())
    {
      return;
    }
    const matches = filteredProducts();
    if (selection.limit >= matches.length)
    {
      return;
    }
    const version = ++appendVersion;
    loadingMore = true;
    moreObserver?.unobserve(sentinel);
    loadMoreRegion.setAttribute("aria-busy", "true");
    loadMoreRegion.querySelector("button").disabled = true;
    loadMoreStatus.textContent = "Memuat produk berikutnya…";
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (version !== appendVersion)
    {
      return;
    }
    const focusedButton = document.activeElement === loadMoreRegion.querySelector("button");
    const previousCount = grid.querySelectorAll(".home-product").length;
    selection.limit = Math.min(selection.limit + batchSize, matches.length);
    loadingMore = false;
    render({ append: true });
    writeUrl(true);
    if (focusedButton)
    {
      grid.querySelectorAll("[data-home-detail]")[previousCount]?.focus({ preventScroll: true });
    }
  }

  function readControls()
  {
    if (categoryPage && !fixedCategory)
    {
      return;
    }
    appendVersion++;
    loadingMore = false;
    selection.search = search.value.slice(0, 100);
    selection.categories = fixedCategory ? [fixedCategory]
      : [...form.querySelectorAll('[name="category"]:checked')].map((input) => input.value);
    selection.discount = Number(form.querySelector('[name="discount"]:checked')?.value || 0);
    selection.available = form.elements.available.checked;
    selection.sort = sort.value;
    const minimum = parsePrice(minPrice.value);
    const maximum = parsePrice(maxPrice.value);
    const invalidMinimum = Number.isNaN(minimum);
    const invalidMaximum = Number.isNaN(maximum);
    const crossed = minimum !== null && maximum !== null && minimum > maximum;
    priceError.hidden = !invalidMinimum && !invalidMaximum && !crossed;
    priceError.textContent = invalidMinimum || invalidMaximum
      ? "Masukkan harga berupa angka rupiah, misalnya 50.000."
      : "Harga minimum harus lebih kecil atau sama dengan harga maksimum.";
    minPrice.setAttribute("aria-invalid", String(invalidMinimum || crossed));
    maxPrice.setAttribute("aria-invalid", String(invalidMaximum || crossed));
    if (priceError.hidden)
    {
      selection.minPrice = minimum;
      selection.maxPrice = maximum;
    }
    selection.limit = batchSize;
    render();
    clearTimeout(urlTimer);
    urlTimer = setTimeout(() => writeUrl(), 350);
  }

  function reset(writeHistory = true)
  {
    clearTimeout(urlTimer);
    appendVersion++;
    loadingMore = false;
    selection = { search: "", categories: fixedCategory ? [fixedCategory] : [], minPrice: null, maxPrice: null, discount: 0,
      available: false, saved: false, sort: "featured", limit: batchSize };
    synchronizeControls();
    if (writeHistory)
    {
      writeUrl();
    }
    render();
  }

  function updateCartCount()
  {
    const count = cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;
    document.querySelectorAll(".storefront-cart-count").forEach((element) => element.textContent = count);
    document.querySelectorAll('[data-storefront-page="Keranjang"]').forEach((element) =>
      element.setAttribute("aria-label", `Keranjang, ${count} unit produk contoh`));
  }

  async function load(recover = false)
  {
    if (loading)
    {
      return;
    }
    loading = true;
    failure = null;
    feedback.hidden = true;
    render();
    try
    {
      const result = await repository.load({ recover, view: "catalog" });
      products = result.products;
      window.RylvaWishlistStore.registerProducts(products);
      cart = result.cart;
      updateCartCount();
      if (products.some((product) => !Number.isSafeInteger(product.price) || product.price < 0))
      {
        feedback.textContent = "Sebagian informasi harga belum tersedia. Produk tersebut belum dapat ditambahkan ke keranjang.";
        feedback.hidden = false;
      }
      else if (collectionPage && result.partial)
      {
        feedback.textContent = "Sebagian informasi produk belum dapat ditampilkan. Produk yang tersedia tetap dapat dijelajahi.";
        feedback.hidden = false;
      }
    }
    catch (error)
    {
      failure = error;
      if (products.length)
      {
        feedback.innerHTML = 'Pembaruan gagal. Koleksi sebelumnya tetap terlihat. <button class="home-text-button" type="button" data-catalog-action="retry">Coba Lagi</button>';
        feedback.hidden = false;
      }
    }
    finally
    {
      loading = false;
      render();
    }
    window.RylvaProductNavigation.restore();
    const slug = new URLSearchParams(location.search).get("product");
    if (slug && !failure)
    {
      openDetail(slug, false);
    }
  }

  function openDialog(title, content)
  {
    if (!dialog.open)
    {
      opener = document.activeElement;
      openerSlug = opener?.dataset.homeDetail || null;
      listScroll = scrollY;
    }
    header.close();
    dialogTitle.textContent = title;
    dialogBody.innerHTML = `<p class="home-dialog-feedback" id="home-dialog-feedback" role="status" hidden></p>${content}`;
    if (!dialog.open)
    {
      dialog.showModal();
    }
    dialog.scrollTop = 0;
    dialogTitle.focus({ preventScroll: true });
  }

  function openDetail(slug)
  {
    writeUrl();
    window.RylvaProductNavigation.open(slug);
  }

  function closeDialog()
  {
    if (new URLSearchParams(location.search).has("product"))
    {
      if (history.state?.catalogDetail)
      {
        history.back();
        return;
      }
      const url = new URL(location.href);
      url.searchParams.delete("product");
      history.replaceState(null, "", url);
    }
    dialog.close();
  }

  function showMessage(message, isError = false, destination = "cart")
  {
    const target = dialog.open ? document.getElementById("home-dialog-feedback") : toast;
    target.hidden = false;
    target.setAttribute("role", isError ? "alert" : "status");
    target.innerHTML = `
      <span>${escapeHtml(message)}</span>
      ${destination === "saved" ? '<button class="home-text-button" type="button" data-catalog-action="saved">Lihat Wishlist</button>' : '<a href="/pages/customer/cart.html">Lihat Keranjang</a>'}
      <button class="home-text-button" type="button" data-catalog-action="dismiss">Tutup</button>`;
  }

  async function addProduct(slug)
  {
    const product = products.find((item) => item.slug === slug);
    if (pending || loading || failure || !product || !canBuy(product))
    {
      return;
    }
    pending = true;
    document.querySelectorAll("[data-home-add]").forEach((button) =>
    {
      button.disabled = true;
      if (button.dataset.homeAdd === slug)
      {
        button.setAttribute("aria-busy", "true");
      }
    });
    try
    {
      cart = await repository.add(product.productId);
      updateCartCount();
      showMessage(cart.storageWarning || `${product.name} ditambahkan ke keranjang contoh.`);
    }
    catch (error)
    {
      showMessage(error.message || "Produk belum ditambahkan. Coba lagi.", true);
      if (error.code === "conflict")
      {
        try
        {
          cart = await repository.readCart();
          updateCartCount();
        }
        catch
        {
          showMessage("Keranjang belum dapat diperbarui. Sambungkan kembali lalu coba lagi.", true);
        }
      }
    }
    finally
    {
      pending = false;
      document.querySelectorAll("[data-home-add]").forEach((button) =>
      {
        const item = products.find((candidate) => candidate.slug === button.dataset.homeAdd);
        button.disabled = !item || !canBuy(item) || Boolean(failure);
        button.removeAttribute("aria-busy");
      });
    }
  }

  function selectSaved()
  {
    location.assign("/pages/customer/wishlist.html");
  }

  function removeChip(control)
  {
    const key = control.dataset.catalogRemove;
    if (key === "category")
    {
      selection.categories = selection.categories.filter((value) => value !== control.dataset.value);
    }
    else if (key === "price")
    {
      selection.minPrice = null;
      selection.maxPrice = null;
    }
    else
    {
      selection[key] = key === "search" ? "" : key === "discount" ? 0 : false;
    }
    selection.limit = batchSize;
    synchronizeControls();
    writeUrl();
    render();
    (activeFilters.querySelector("button") || search).focus({ preventScroll: true });
  }

  function selectNavigation(page)
  {
    if (["Buket Kustom", "Buket Costum"].includes(page))
    {
      location.assign("/pages/customer/bouquet-customizer.html");
      return;
    }
    const destinations =
    {
      "Semua Produk": null,
      "Koleksi Baru": null,
      "Tanaman Hias": "plants",
      "Buket Kustom": "custom",
      "Buket Costum": "custom",
      "Terrarium & Moss": "terrarium",
      "Media Tanam": "media",
      "Pot & Vas": "pots",
      "Alat Berkebun": "tools",
      "Pupuk & Nutrisi": "media",
      "Perlengkapan Berkebun": "tools"
    };
    if (Object.hasOwn(destinations, page) || page === "Promo Spesial")
    {
      reset(false);
      selection.categories = destinations[page] ? [destinations[page]] : [];
      selection.discount = page === "Promo Spesial" ? 5 : 0;
      synchronizeControls();
      writeUrl();
      render();
      return;
    }
    openDialog(page, `
      <p>Bagian ${escapeHtml(page)} belum tersedia pada pratinjau ini.</p>
      <p class="home-result-count">Anda tetap dapat menelusuri koleksi atau membuka pesanan Anda.</p>
      <button class="home-button" type="button" data-home-close>Kembali ke Katalog</button>`);
  }

  document.addEventListener("click", (event) =>
  {
    const control = event.target.closest("button");
    if (!control || control.disabled || control.hasAttribute("data-header-wishlist-trigger"))
    {
      return;
    }
    const page = control.dataset.storefrontPage;
    if (page === "Wishlist")
    {
      event.stopImmediatePropagation();
      selectSaved();
    }
    else if (page && !["Beranda", "Akun", "Keranjang", "Lacak Pesanan"].includes(page))
    {
      event.stopImmediatePropagation();
      selectNavigation(page);
    }
    else if (control.dataset.homeDetail)
    {
      openDetail(control.dataset.homeDetail);
    }
    else if (control.dataset.homeAdd)
    {
      addProduct(control.dataset.homeAdd);
    }
    else if (control.hasAttribute("data-home-close"))
    {
      closeDialog();
    }
    else if (control.dataset.catalogRemove)
    {
      removeChip(control);
    }
    else if (control.dataset.catalogAction === "load-more")
    {
      loadMore();
    }
    else if (control.dataset.catalogAction === "reset")
    {
      const restoreSearchFocus = Boolean(control.closest(".home-empty"));
      reset();
      if (restoreSearchFocus)
      {
        search.focus({ preventScroll: true });
      }
    }
    else if (control.dataset.catalogAction === "retry")
    {
      load(true);
    }
    else if (control.dataset.catalogAction === "saved")
    {
      selectSaved();
    }
    else if (control.dataset.catalogAction === "dismiss")
    {
      control.closest(".home-toast, .home-dialog-feedback").hidden = true;
    }
  }, true);

  form.addEventListener("submit", (event) => event.preventDefault());
  form.addEventListener("input", readControls);
  sort.addEventListener("change", readControls);
  search.addEventListener("input", readControls);
  document.getElementById("storefront-search").addEventListener("submit", (event) =>
  {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (categoryPage && !fixedCategory)
    {
      const target = new URL("/pages/public/catalog.html", location.origin);
      if (search.value.trim())
      {
        target.searchParams.set("q", search.value.trim().slice(0, 100));
      }
      location.assign(target.pathname + target.search);
      return;
    }
    readControls();
    writeUrl();
    resultCount.scrollIntoView({ block: "center" });
  }, true);
  dialog.addEventListener("cancel", (event) =>
  {
    event.preventDefault();
    closeDialog();
  });
  dialog.addEventListener("close", () =>
  {
    const replacement = [...grid.querySelectorAll("[data-home-detail]")].find((button) => button.dataset.homeDetail === openerSlug);
    const target = opener?.isConnected ? opener : replacement || search;
    target.focus({ preventScroll: true });
    window.scrollTo({ top: listScroll, behavior: "instant" });
    observeSentinel();
  });
  window.addEventListener("popstate", () =>
  {
    clearTimeout(urlTimer);
    appendVersion++;
    loadingMore = false;
    selection = readUrl();
    synchronizeControls();
    render();
    const slug = new URLSearchParams(location.search).get("product");
    if (slug)
    {
      openDetail(slug, false);
    }
    else if (dialog.open)
    {
      dialog.close();
    }
  });
  document.addEventListener("error", (event) =>
  {
    if (event.target.tagName !== "IMG")
    {
      return;
    }
    const frame = event.target.closest(".home-product-picture, .home-detail-picture");
    if (frame)
    {
      event.target.hidden = true;
      frame.dataset.imageFailed = "true";
    }
  }, true);
  window.addEventListener("offline", () => showMessage("Koneksi terputus. Koleksi tetap terlihat. Sambungkan kembali sebelum menambah produk.", true));
  document.addEventListener("rylva:catalog-sheet-closed", observeSentinel);
  window.addEventListener("pageshow", (event) =>
  {
    if (event.persisted)
    {
      window.RylvaProductNavigation.restore();
    }
  });
  window.RylvaWishlistStore.bind(
  {
    onChange: () =>
    {
      savedProducts.clear();
      [...window.RylvaStorefrontProductPreviewData.products, ...products].forEach((product) =>
      {
        if (window.RylvaWishlistStore.has(product.productId))
        {
          savedProducts.add(product.slug);
        }
      });
      if (selection.saved && !loading)
      {
        render();
      }
    },
    onMessage: (message, isError) => showMessage(message, isError, "saved")
  });
  if (categoryPage && !fixedCategory)
  {
    repository.readCart().then((snapshot) =>
    {
      cart = snapshot;
      updateCartCount();
    }).catch(() => document.querySelector(".storefront-cart-count").hidden = true);
    return;
  }
  synchronizeControls();
  writeUrl(true);
  load();
})();
