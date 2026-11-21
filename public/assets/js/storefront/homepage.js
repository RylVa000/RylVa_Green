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
  const filterNames = { all: "Semua", easy: "Mudah Dirawat", pet: "Ramah Hewan", air: "Pembersih Udara" };
  let products = [];
  let failure = null;
  let cart = null;
  let pending = false;
  let loading = true;
  let opener = null;
  let filter = Object.hasOwn(filterNames, query.get("filter")) ? query.get("filter") : "all";
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

  function canBuy(product)
  {
    return product.available && product.availableStock > 0
      && Number.isSafeInteger(product.price) && product.price >= 0;
  }

  function card(product)
  {
    return window.RylvaProductCard.render(product, { pending });
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
      window.RylvaWishlistStore.registerProducts(products);
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

  function openCollection(category = "all", search = "")
  {
    header.close();
    if (category === "saved")
    {
      location.assign(window.RylvaWishlistStore.pageUrl());
      return;
    }
    const aliases = { indoor: "plants", outdoor: "plants", bouquet: "bouquet", terrarium: "terrarium",
      pots: "pots", nutrients: "media", media: "media", seeds: "seeds" };
    const categoryId = aliases[category];
    const destination = categoryId ? window.RylvaStorefrontCategories.url(categoryId) : null;
    const target = new URL(destination || "/pages/public/catalog.html", location.origin);
    if (aliases[category])
    {
      target.searchParams.set("category", aliases[category]);
    }
    if (search.trim())
    {
      target.searchParams.set("q", search.trim().slice(0, 100));
    }
    if (category === "promo")
    {
      target.searchParams.set("discount", "5");
    }
    location.assign(target.pathname + target.search);
  }

  function openDetail(slug)
  {
    header.close();
    window.RylvaProductNavigation.open(slug);
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

  document.addEventListener("click", (event) =>
  {
    const control = event.target.closest("button");
    if (!control || control.disabled || control.hasAttribute("data-header-wishlist-trigger"))
    {
      return;
    }
    const page = control.dataset.storefrontPage;
    if (["Buket Kustom", "Buket Costum"].includes(page))
    {
      event.stopImmediatePropagation();
      location.assign("/pages/customer/bouquet-customizer.html");
      return;
    }
    if (page === "Wishlist")
    {
      event.stopImmediatePropagation();
      openCollection("saved");
      return;
    }
    if (page === "Semua Produk")
    {
      event.stopImmediatePropagation();
      location.assign("/pages/public/catalog.html");
      return;
    }
    const navCategories =
    {
      "Semua Produk": "all", "Koleksi Baru": "all", "Promo Spesial": "promo", "Tanaman Hias": "indoor",
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
        kit: ["Urban Jungle Starter Kit", "Rp 245.000", "promo-kit.webp"],
        bouquet: ["Buket Musim Gugur Eksklusif", "Harga mengikuti pilihan buket", "promo-bouquet.webp"],
        terrarium: ["Terrarium Art DIY Capsule", "Rp 180.000", "promo-terrarium.webp"]
      };
      const offer = offers[control.dataset.homeOffer];
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
  window.RylvaWishlistStore.bind(
  {
    onMessage: (message, isError) => showMessage(message, isError, "saved")
  });
  load();
})();
