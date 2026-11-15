"use strict";

(() =>
{
  const repository = window.RylvaHomepageAdapter || window.RylvaHomepagePreviewRepository;
  const dialog = document.getElementById("home-dialog");
  const dialogBody = document.getElementById("home-dialog-body");
  const dialogTitle = document.getElementById("home-dialog-title");
  const trending = document.getElementById("home-trending");
  const recommendations = document.getElementById("home-recommendations");
  const toast = document.getElementById("home-toast");
  const query = new URLSearchParams(location.search);
  const categories =
  {
    all: "Semua Koleksi", indoor: "Tanaman Indoor", outdoor: "Tanaman Outdoor",
    bouquet: "Buket Bunga", terrarium: "Terrarium & Moss", pots: "Pot & Vas",
    nutrients: "Pupuk & Nutrisi", media: "Media Tanam", seeds: "Benih & Bibit", saved: "Wishlist Contoh"
  };
  const filterNames = { all: "Semua", easy: "Mudah Dirawat", pet: "Ramah Hewan", air: "Pembersih Udara" };
  let products = [];
  let failure = null;
  let cart = null;
  let pending = false;
  let loading = true;
  let opener = null;
  let collection = { category: "all", search: "", scroll: 0 };
  let dialogView = "";
  let filter = Object.hasOwn(filterNames, query.get("filter")) ? query.get("filter") : "all";
  const savedProducts = new Set();
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
    openSaved: () => openCollection("saved")
  });

  function escapeHtml(value)
  {
    return String(value ?? "").replace(/[&<>"']/g, (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function money(value)
  {
    return Number.isSafeInteger(value) && value >= 0
      ? "Rp" + new Intl.NumberFormat("id-ID").format(value) : "Harga belum tersedia";
  }

  function canBuy(product)
  {
    return product.available && product.availableStock > 0
      && Number.isSafeInteger(product.price) && product.price >= 0;
  }

  function card(product)
  {
    const available = product.available && product.availableStock > 0;
    const sale = canBuy(product) && product.basePrice > product.price;
    const discount = sale ? Math.round((product.basePrice - product.price) / product.basePrice * 100) : 0;
    const priceText = money(product.price);
    const priceClass = canBuy(product) && priceText.length > 12 ? " home-price--long" : "";
    return `
      <article class="home-product home-product--${escapeHtml(product.slug)}" data-product-id="${escapeHtml(product.productId)}">
        <div class="home-product-picture">
          <img src="${escapeHtml(product.image)}" width="160" height="220" alt="${escapeHtml(product.name)}" loading="lazy">
          ${discount ? `<span class="home-product-discount">-${discount}%</span>` : ""}
        </div>
        <div class="home-product-info">
          <div class="home-product-heading">
            <h3>${escapeHtml(product.name)}</h3>
            <span class="home-stock ${available ? product.stockTone === "low" ? "is-low" : "" : "is-unavailable"}">
              ${available ? escapeHtml(product.stockLabel || "Tersedia") : "Habis"}
            </span>
          </div>
          <p class="home-product-description">${escapeHtml(product.description)}</p>
          <div class="home-product-purchase">
            <div class="home-product-prices">
              <div class="home-original-price-slot"${sale ? "" : ' aria-hidden="true"'}>
                ${sale ? `<del class="home-original-price">${money(product.basePrice)}</del>` : ""}
              </div>
              <p class="home-price${priceClass}">${priceText}${canBuy(product) ? "<small> / pot</small>" : ""}</p>
            </div>
          </div>
          <div class="home-product-actions">
            <button class="home-text-button" type="button" data-home-detail="${escapeHtml(product.slug)}"
              aria-label="Lihat detail ${escapeHtml(product.name)}">
              <img src="../../assets/images/homepage/vector.svg" width="23" height="20" alt="" loading="lazy">
              <span>Detail<span class="home-detail-label-suffix"> Produk</span></span>
            </button>
            <button class="home-favorite-button" type="button" data-home-save="${escapeHtml(product.slug)}"
              aria-pressed="${savedProducts.has(product.slug)}" aria-label="${savedProducts.has(product.slug) ? "Hapus" : "Simpan"} ${escapeHtml(product.name)} ${savedProducts.has(product.slug) ? "dari" : "ke"} wishlist contoh">
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <use href="#home-heart-icon"></use>
              </svg>
            </button>
            <button class="home-icon-button" type="button" data-home-add="${escapeHtml(product.slug)}"
              aria-label="Tambah ${escapeHtml(product.name)} ke keranjang" ${!canBuy(product) || pending ? "disabled" : ""}>
              <img src="../../assets/images/homepage/add-cart.svg" width="18" height="20" alt="" loading="lazy">
            </button>
          </div>
        </div>
      </article>`;
  }

  function emptyState(title, description, action = "reset")
  {
    return `
      <div class="home-empty">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(description)}</p>
        <button class="home-button" type="button" data-home-action="${action}">
          ${action === "retry" ? "Coba Lagi" : "Reset Pilihan"}
        </button>
      </div>`;
  }

  function unavailableState()
  {
    const messages =
    {
      offline: ["Koneksi terputus", "Sambungkan kembali, lalu coba lagi. Pilihan Anda tetap tersedia."],
      timeout: ["Pemuatan terlalu lama", "Koleksi belum berhasil dimuat. Anda dapat mencoba kembali."],
      maintenance: ["Koleksi sementara tidak tersedia", "Layanan sedang dalam pemeliharaan. Silakan coba lagi nanti."]
    };
    const message = messages[failure?.code] || ["Koleksi belum dapat dimuat", "Coba lagi untuk menampilkan produk. Pilihan Anda tetap tersedia."];
    return emptyState(message[0], message[1], "retry");
  }

  function renderProducts()
  {
    trending.setAttribute("aria-busy", String(loading));
    recommendations.setAttribute("aria-busy", String(loading));
    if (loading)
    {
      return;
    }
    if (failure)
    {
      trending.innerHTML = unavailableState();
      recommendations.innerHTML = unavailableState();
      return;
    }
    trending.innerHTML = products.length ? products.slice(0, 4).map(card).join("\n")
      : emptyState("Koleksi belum tersedia", "Produk akan ditampilkan setelah koleksi tersedia.", "retry");
    const selected = products.slice(4).filter((product) => filter === "all" || product.tags.includes(filter));
    recommendations.innerHTML = selected.length ? selected.map(card).join("\n")
      : emptyState("Belum ada rekomendasi yang sesuai", filter === "all"
        ? "Koleksi rekomendasi belum tersedia. Anda tetap dapat melihat koleksi lainnya."
        : `Belum ada produk dengan atribut ${filterNames[filter]} yang terverifikasi pada koleksi ini.`);
    document.querySelectorAll("[data-home-filter]").forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.homeFilter === filter)));
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
    loading = true;
    failure = null;
    renderProducts();
    try
    {
      const result = await repository.load({ recover });
      products = result.products;
      cart = result.cart;
      updateCartCount();
    }
    catch (error)
    {
      failure = error;
    }
    finally
    {
      loading = false;
      renderProducts();
      if (dialog.open && dialogView === "collection")
      {
        renderCollectionResults();
      }
    }
  }

  function openDialog(title, content)
  {
    header.close();
    if (!dialog.open)
    {
      opener = document.activeElement;
    }
    dialogTitle.textContent = title;
    dialogBody.innerHTML = `
      <p class="home-dialog-feedback" id="home-dialog-feedback" role="status" hidden></p>
      ${content}`;
    if (!dialog.open)
    {
      dialog.showModal();
    }
    dialog.scrollTop = 0;
    dialogTitle.focus({ preventScroll: true });
  }

  function openCollection(category = "all", search = "", restore = false)
  {
    collection = { category: Object.hasOwn(categories, category) ? category : "all", search, scroll: restore ? collection.scroll : 0 };
    dialogView = "collection";
    openDialog(categories[collection.category], `
      <div class="home-dialog-tools">
        <label for="home-collection-search">Cari dalam koleksi</label>
        <input id="home-collection-search" type="search" maxlength="100" value="${escapeHtml(search)}" placeholder="Cari nama tanaman…">
        <button class="home-text-button" type="button" data-home-action="reset-search">Reset</button>
      </div>
      <p class="home-result-count" id="home-result-count" role="status"></p>
      <div class="home-product-grid" id="home-collection-results"></div>`);
    renderCollectionResults();
    dialog.scrollTop = collection.scroll;
  }

  function renderCollectionResults()
  {
    const results = document.getElementById("home-collection-results");
    if (!results)
    {
      return;
    }
    if (loading || failure)
    {
      results.innerHTML = loading ? '<p class="home-loading" role="status">Memuat koleksi…</p>' : unavailableState();
      return;
    }
    const search = collection.search.toLocaleLowerCase("id").trim();
    const matches = products.filter((product) =>
    {
      const searchable = [product.name, ...product.categories.map((category) => categories[category])]
        .join(" ").toLocaleLowerCase("id");
      return (collection.category === "all" || product.categories.includes(collection.category)
        || (collection.category === "saved" && savedProducts.has(product.slug)))
        && searchable.includes(search);
    });
    document.getElementById("home-result-count").textContent = `${matches.length} produk contoh`;
    if (!matches.length && collection.category === "saved" && !collection.search)
    {
      results.innerHTML = emptyState("Belum ada produk disimpan",
        "Pilih ikon hati pada produk untuk menyimpannya selama halaman ini terbuka.", "reset-search");
      return;
    }
    results.innerHTML = matches.length ? matches.map(card).join("\n")
      : emptyState(collection.search ? "Produk tidak ditemukan" : "Koleksi belum tersedia",
        collection.search ? "Coba nama lain atau reset pencarian."
          : "Belum ada produk pada kategori ini. Lihat semua koleksi untuk pilihan lainnya.", "reset-search");
  }

  function openDetail(slug)
  {
    const product = products.find((item) => item.slug === slug);
    if (!product)
    {
      openDialog("Produk tidak tersedia", emptyState("Produk tidak ditemukan", "Perbarui koleksi untuk melihat produk terbaru.", "retry"));
      return;
    }
    if (dialog.open && dialogView === "collection")
    {
      collection.scroll = dialog.scrollTop;
    }
    dialogView = "detail";
    openDialog(product.name, `
      <button class="home-text-button" type="button" data-home-action="back-collection">Kembali ke Koleksi</button>
      <div class="home-detail">
        <div class="home-detail-picture">
          <img src="${escapeHtml(product.image)}" width="320" height="360" alt="${escapeHtml(product.name)}">
        </div>
        <div class="home-detail-copy">
          <span class="home-stock ${product.available ? product.stockTone === "low" ? "is-low" : "" : "is-unavailable"}">
            ${product.available ? escapeHtml(product.stockLabel || "Tersedia") : "Habis"}
          </span>
          <h3>${escapeHtml(product.name)}</h3>
          <p>${escapeHtml(product.description)}</p>
          <p class="home-price">${money(product.price)} <small>/ ${escapeHtml(product.unit)}</small></p>
          <dl>
            <dt>Pilihan</dt>
            <dd>${escapeHtml(product.variant)}</dd>
            <dt>Satuan</dt>
            <dd>${escapeHtml(product.unit)}</dd>
          </dl>
          <p>Produk, foto, harga, dan ketersediaan ini merupakan contoh. Informasi perawatan lengkap belum tersedia.</p>
          <button class="home-button" type="button" data-home-add="${escapeHtml(product.slug)}" ${canBuy(product) && !pending ? "" : "disabled"}>
            ${canBuy(product) ? "Tambah ke Keranjang" : product.available ? "Harga Belum Tersedia" : "Produk Habis"}
          </button>
          <p><a href="/pages/customer/cart.html">Lihat Keranjang</a></p>
        </div>
      </div>`);
  }

  function showMessage(message, error = false, destination = "cart")
  {
    const feedback = dialog.open ? document.getElementById("home-dialog-feedback") : toast;
    feedback.hidden = false;
    if (dialog.open)
    {
      feedback.textContent = message;
    }
    else
    {
      const action = destination === "saved"
        ? '<button class="home-text-button" type="button" data-home-collection="saved">Lihat Wishlist</button>'
        : '<a href="/pages/customer/cart.html">Lihat Keranjang</a>';
      feedback.innerHTML = `
        <span>${escapeHtml(message)}</span>
        ${action}
        <button class="home-icon-button" type="button" data-home-action="dismiss" aria-label="Tutup pemberitahuan">
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <use href="#home-close-icon"></use>
          </svg>
        </button>`;
    }
    feedback.setAttribute("role", error ? "alert" : "status");
  }

  async function addProduct(slug)
  {
    const product = products.find((item) => item.slug === slug);
    if (pending || !product || !canBuy(product) || loading || failure)
    {
      return;
    }
    pending = true;
    const controls = [...document.querySelectorAll("[data-home-add]")];
    controls.forEach((button) =>
    {
      button.dataset.wasDisabled = String(button.disabled);
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
        await load(true);
      }
    }
    finally
    {
      pending = false;
      document.querySelectorAll("[data-home-add]").forEach((button) =>
      {
        const item = products.find((candidate) => candidate.slug === button.dataset.homeAdd);
        button.disabled = loading || Boolean(failure) || !item || !canBuy(item);
        delete button.dataset.wasDisabled;
        button.removeAttribute("aria-busy");
      });
    }
  }

  function selectFilter(nextFilter)
  {
    filter = nextFilter;
    const url = new URL(location.href);
    if (filter === "all")
    {
      url.searchParams.delete("filter");
    }
    else
    {
      url.searchParams.set("filter", filter);
    }
    history.replaceState(null, "", url);
    renderProducts();
  }

  function toggleSaved(slug)
  {
    const product = products.find((item) => item.slug === slug);
    if (!product)
    {
      return;
    }
    if (savedProducts.has(slug))
    {
      savedProducts.delete(slug);
    }
    else
    {
      savedProducts.add(slug);
    }
    renderProducts();
    if (dialog.open && dialogView === "collection")
    {
      renderCollectionResults();
    }
    const scope = dialog.open && dialogView === "collection" ? dialogBody : document.querySelector(".home-main");
    [...scope.querySelectorAll("[data-home-save]")].find((button) => button.dataset.homeSave === slug)
      ?.focus({ preventScroll: true });
    showMessage(product.name + (savedProducts.has(slug) ? " disimpan ke" : " dihapus dari")
      + " wishlist contoh selama halaman ini terbuka.", false, "saved");
  }

  document.addEventListener("click", (event) =>
  {
    const control = event.target.closest("button");
    if (!control || control.disabled)
    {
      return;
    }
    const page = control.dataset.storefrontPage;
    if (page === "Wishlist")
    {
      event.stopImmediatePropagation();
      openCollection("saved");
      return;
    }
    const navCategories =
    {
      "Semua Produk": "all", "Koleksi Baru": "all", "Tanaman Hias": "indoor",
      "Terrarium & Moss": "terrarium", "Media Tanam": "media", "Pot & Vas": "pots",
      "Alat Berkebun": "all", "Pupuk & Nutrisi": "nutrients", "Perlengkapan Berkebun": "all"
    };
    if (page && !["Beranda", "Akun", "Keranjang", "Lacak Pesanan"].includes(page))
    {
      event.stopImmediatePropagation();
      if (Object.hasOwn(navCategories, page))
      {
        openCollection(navCategories[page]);
      }
      else
      {
        dialogView = "information";
        openDialog(page, `
          <p>Bagian ${escapeHtml(page)} belum tersedia. Anda dapat menelusuri koleksi atau membuka pesanan Anda.</p>
          <p class="home-result-count">Pratinjau ini tidak mengirim pesan atau membuat transaksi nyata.</p>
          <button class="home-button" type="button" data-home-collection="all">Lihat Koleksi</button>`);
      }
      return;
    }
    if (control.hasAttribute("data-home-collection"))
    {
      openCollection(control.dataset.homeCollection);
    }
    else if (control.hasAttribute("data-home-detail"))
    {
      openDetail(control.dataset.homeDetail);
    }
    else if (control.hasAttribute("data-home-add"))
    {
      addProduct(control.dataset.homeAdd);
    }
    else if (control.hasAttribute("data-home-save"))
    {
      toggleSaved(control.dataset.homeSave);
    }
    else if (control.hasAttribute("data-home-filter"))
    {
      selectFilter(control.dataset.homeFilter);
    }
    else if (control.hasAttribute("data-home-slide"))
    {
      window.RylvaHomepageHero.select(Number(control.dataset.homeSlide), true);
    }
    else if (control.hasAttribute("data-home-offer"))
    {
      const offers =
      {
        kit: ["Urban Jungle Starter Kit", "Rp245.000", "promo-kit.webp"],
        bouquet: ["Buket Musim Gugur Eksklusif", "Harga mengikuti pilihan buket", "promo-bouquet.webp"],
        terrarium: ["Terrarium Art DIY Capsule", "Rp180.000", "promo-terrarium.webp"]
      };
      const offer = offers[control.dataset.homeOffer];
      dialogView = "offer";
      openDialog(offer[0], `
        <div class="home-detail">
          <div class="home-detail-picture">
            <img src="/assets/images/homepage/${offer[2]}" alt="${offer[0]}" width="320" height="320">
          </div>
          <div class="home-detail-copy">
            <p class="home-price">${offer[1]}</p>
            <p>Penawaran contoh dari koleksi RylVa. Pemesanan paket ini belum tersedia.</p>
            <button class="home-button" type="button" data-home-collection="all">Lihat Koleksi Tanaman</button>
          </div>
        </div>`);
    }
    else if (control.hasAttribute("data-home-close"))
    {
      dialog.close();
    }
    else if (control.dataset.homeAction === "reset")
    {
      selectFilter("all");
    }
    else if (control.dataset.homeAction === "retry")
    {
      if (!loading)
      {
        load(true);
      }
    }
    else if (control.dataset.homeAction === "reset-search")
    {
      collection.category = "all";
      collection.search = "";
      dialogTitle.textContent = categories.all;
      document.getElementById("home-collection-search").value = "";
      renderCollectionResults();
      document.getElementById("home-collection-search").focus();
    }
    else if (control.dataset.homeAction === "back-collection")
    {
      openCollection(collection.category, collection.search, true);
    }
    else if (control.dataset.homeAction === "dismiss")
    {
      toast.hidden = true;
    }
  }, true);

  document.getElementById("storefront-search").addEventListener("submit", (event) =>
  {
    event.preventDefault();
    event.stopImmediatePropagation();
    openCollection("all", document.getElementById("storefront-search-input").value.trim());
  }, true);

  dialog.addEventListener("input", (event) =>
  {
    if (event.target.id === "home-collection-search")
    {
      collection.search = event.target.value;
      renderCollectionResults();
    }
  });
  dialog.addEventListener("close", () =>
  {
    if (opener?.isConnected)
    {
      opener.focus({ preventScroll: true });
    }
  });
  document.addEventListener("error", (event) =>
  {
    if (event.target.tagName !== "IMG")
    {
      return;
    }
    event.target.hidden = true;
    const frame = event.target.closest(".home-product-picture, .home-category-picture, .home-hero-art, .home-detail-picture");
    if (frame)
    {
      frame.dataset.imageFailed = "true";
    }
  }, true);
  window.addEventListener("offline", () => showMessage("Koneksi terputus. Koleksi tetap terlihat; sambungkan kembali sebelum menambah produk.", true));
  load();
})();
