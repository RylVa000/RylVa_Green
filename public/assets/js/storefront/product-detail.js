"use strict";

(() =>
{
  const repository = window.RylvaProductDetailAdapter || window.RylvaProductDetailPreviewRepository;
  const navigation = window.RylvaProductNavigation;
  const { escapeHtml, money } = window.RylvaProductCard;
  const parameters = new URLSearchParams(location.search);
  const slug = parameters.get("product") || "monstera";
  const content = document.getElementById("product-content");
  const dialog = document.getElementById("home-dialog");
  const dialogTitle = document.getElementById("home-dialog-title");
  const dialogBody = document.getElementById("home-dialog-body");
  const toast = document.getElementById("home-toast");
  let product = null;
  let cart = null;
  let variant = null;
  let quantity = parameters.get("qty") || "1";
  let imageIndex = 0;
  let pending = false;
  let loading = false;
  let opener = null;
  let quoteVersion = 0;
  let shippingQuoteContext = null;
  const savedShipping = history.state?.productShipping;
  const savedPostcode = savedShipping?.slug === slug && typeof savedShipping.postcode === "string"
    ? savedShipping.postcode.slice(0, 5) : "";
  let shippingPostcode = repository.workbench && repository.scenario === "shippingRates" ? "40526" : savedPostcode;
  let actionBarObserver = null;
  const hoverZoomMedia = matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine)");
  const header = window.RylvaHomepageHeader.init(
  {
    readCart: () => repository.readCart(),
    removeItem: (lineId) => repository.remove(lineId),
    onCartChange: (snapshot) =>
    {
      cart = snapshot;
      updateCartCount();
      updatePurchase();
    },
    openDetail: (value) => navigation.open(value),
    openSaved: () => showWishlist(),
    browseCollection: () => location.assign("/pages/public/catalog.html")
  });

  function maximum()
  {
    return Math.min(variant?.stock || 0, cart?.limits.perProduct || 20);
  }

  function validPrice()
  {
    return Number.isSafeInteger(variant?.price) && variant.price >= 0;
  }

  function validQuantity()
  {
    const value = Number(quantity);
    return /^\d+$/.test(String(quantity)) && Number.isInteger(value) && value >= 1 && value <= maximum();
  }

  function existingQuantity()
  {
    return cart?.items.filter((item) => item.productId === product?.productId)
      .reduce((total, item) => total + item.quantity, 0) || 0;
  }

  function updateCartCount()
  {
    const count = cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;
    document.querySelectorAll(".storefront-cart-count").forEach((element) => element.textContent = count);
    document.querySelector('header [data-storefront-page="Keranjang"]')
      ?.setAttribute("aria-label", `Keranjang, ${count} unit produk contoh`);
  }

  function notice(message, isError = false, withCart = false)
  {
    const target = document.getElementById("product-feedback") || toast;
    target.hidden = false;
    target.setAttribute("role", isError ? "alert" : "status");
    target.innerHTML = `
      <span>${escapeHtml(message)}</span>
      ${withCart ? '<a href="/pages/customer/cart.html">Lihat Keranjang</a>' : ""}
      <button class="product-feedback-dismiss" type="button" data-product-dismiss aria-label="Tutup pemberitahuan">
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <use href="#home-close-icon"></use>
        </svg>
      </button>`;
  }

  function openDialog(title, markup)
  {
    opener = document.activeElement;
    header.close();
    document.getElementById("product-photo")?.classList.remove("is-hover-zoom");
    dialogTitle.textContent = title;
    dialogBody.innerHTML = markup;
    dialog.showModal();
    dialogTitle.focus({ preventScroll: true });
  }

  function showWishlist()
  {
    location.assign("/pages/customer/wishlist.html");
  }

  function renderGallery()
  {
    return `
      <section class="product-gallery" aria-label="Galeri ${escapeHtml(product.name)}">
        <div class="product-photo" id="product-photo">
          <button
            class="product-photo-button"
            type="button"
            data-product-zoom
            aria-label="Perbesar foto produk"
          >
            <img
              id="product-main-image"
              src="${escapeHtml(product.gallery[0].src)}"
              ${product.gallery[0].srcSet ? `srcset="${escapeHtml(product.gallery[0].srcSet)}" sizes="(max-width: 600px) calc(100vw - 48px), 540px"` : ""}
              alt="${escapeHtml(product.gallery[0].alt)}"
              width="540"
              height="580"
              fetchpriority="high"
            >
            <span class="product-zoom-label">Perbesar foto</span>
          </button>
          <div class="product-image-error" hidden>
            <p>Foto belum dapat ditampilkan.</p>
            <button class="home-text-button" type="button" data-product-image-retry>Coba Lagi</button>
          </div>
        </div>
        <div class="product-thumbnails" role="group" aria-label="Pilih foto produk">
          ${product.gallery.map((image, index) => `
            <button
              class="product-thumbnail"
              type="button"
              data-product-image="${index}"
              aria-pressed="${index === 0}"
              aria-label="Lihat foto ${index + 1}: ${escapeHtml(image.alt)}"
            >
              <img
                src="${escapeHtml(image.thumbnail || image.src)}"
                alt=""
                width="76"
                height="88"
                loading="lazy"
                decoding="async"
              >
              <span class="product-thumbnail-fallback" aria-hidden="true">${index + 1}</span>
            </button>`).join("")}
        </div>
        <p class="product-photo-caption">Foto ${imageIndex + 1} dari ${product.gallery.length}. Gambar produk contoh.</p>
      </section>`;
  }

  function renderCare()
  {
    return `
      <section class="product-care" aria-labelledby="product-care-title">
        <h2 id="product-care-title">Panduan Perawatan</h2>
        ${product.care.length ? product.care.map((item, index) => `
          <details ${index === 0 ? "open" : ""}>
            <summary>
              <img src="/assets/images/product-detail/${escapeHtml(item.icon)}.svg" alt="" width="24" height="24">
              <span>${escapeHtml(item.title)}</span>
              <img class="product-care-chevron" src="/assets/images/product-detail/chevron.svg" alt="" width="16" height="10">
            </summary>
            <div class="product-care-body">
              <p>${escapeHtml(item.text)}</p>
              <a href="${escapeHtml(item.source)}" target="_blank" rel="noopener noreferrer">Sumber: ${escapeHtml(item.sourceName)} <span class="visually-hidden">(tab baru)</span></a>
            </div>
          </details>`).join("") : '<p class="product-muted">Panduan khusus produk ini belum tersedia. Periksa informasi perawatan sebelum membeli.</p>'}
      </section>`;
  }

  function renderProduct()
  {
    const hasPrice = validPrice();
    const discount = hasPrice && variant.basePrice > variant.price
      ? Math.round((variant.basePrice - variant.price) / variant.basePrice * 100) : 0;
    const attributes = variant.attributes === "Pilihan contoh dari desain" ? "" : variant.attributes;
    const unavailable = !product.available || variant.stock < 1;
    document.title = product.name + " | RylVa Green";
    document.getElementById("product-breadcrumb-name").textContent = product.name;
    content.innerHTML = `
      <div class="product-layout">
        ${renderGallery()}
        <section class="product-information" aria-labelledby="product-title">
          <div class="product-title-row">
            <h1 id="product-title">${escapeHtml(product.name)}</h1>
            <button class="home-favorite-button product-favorite" type="button" data-product-save data-wishlist-product-id="${escapeHtml(product.productId)}" aria-pressed="${window.RylvaWishlistStore.has(product.productId)}" aria-label="Simpan ${escapeHtml(product.name)} ke Wishlist">
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <use href="#home-heart-icon"></use>
              </svg>
            </button>
          </div>
          ${product.latinName ? `<p class="product-latin"><i>${escapeHtml(product.latinName)}</i></p>` : ""}
          <div class="product-labels">
            <span>${escapeHtml(product.category)}</span>
            ${product.packaging ? '<span class="product-label-outline">Pot nursery</span>' : ""}
          </div>
          <div class="product-pricing">
            ${discount ? `<del>${money(variant.basePrice)}</del>` : ""}
            <p class="product-price">${hasPrice ? money(variant.price) : "Harga belum tersedia"}<small>${hasPrice ? " / " + escapeHtml(variant.unit) : ""}</small></p>
            ${discount ? `<span class="product-discount" aria-label="Diskon ${discount} persen">−${discount}%</span>` : ""}
          </div>
          ${product.packaging ? `<p class="product-packaging">${escapeHtml(product.packaging)}</p>` : ""}
          <section class="product-summary" aria-labelledby="product-summary-title">
            <h2 id="product-summary-title">Ringkasan Produk</h2>
            <p>${escapeHtml(product.description || "Deskripsi produk belum tersedia.")}</p>
            <dl class="product-specifications">
              ${product.sku ? `<div><dt>SKU</dt><dd>${escapeHtml(product.sku)}</dd></div>` : ""}
              <div><dt>Satuan</dt><dd>${escapeHtml(variant.unit)}</dd></div>
            </dl>
          </section>
          <div class="product-choice-label">
            <label for="product-variant">Pilih ukuran</label>
            <span class="product-stock ${unavailable ? "is-unavailable" : ""}">${!product.available ? "Tidak tersedia" : variant.stock < 1 ? "Stok habis" : `Tersedia (${variant.stock} ${escapeHtml(variant.unit)})`}</span>
          </div>
          <select id="product-variant" aria-describedby="product-variant-help">
            ${product.variants.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === variant.id ? "selected" : ""}>${escapeHtml(item.name)}${attributes ? " · " + escapeHtml(attributes) : ""}${Number.isSafeInteger(item.price) ? " — " + money(item.price) : ""}</option>`).join("")}
          </select>
          <p class="product-field-hint" id="product-variant-help">${product.variants.length === 1 ? "Satu pilihan ukuran tersedia untuk produk ini." : "Harga dan stok mengikuti ukuran yang dipilih."}</p>
          <form class="product-shipping" id="product-shipping" novalidate>
            <label for="product-postcode">Cek biaya pengiriman</label>
            <div class="product-postcode-row">
              <input id="product-postcode" name="postcode" type="text" inputmode="numeric" autocomplete="postal-code" maxlength="5" placeholder="Kode pos (5 angka)" value="${escapeHtml(shippingPostcode)}" aria-describedby="product-shipping-help product-shipping-result">
              <button class="product-button product-button-secondary" type="submit">Cek Ongkir</button>
            </div>
            <p class="product-field-hint" id="product-shipping-help">
              Cek dengan kode pos tujuan, tanpa perlu masuk.
              <a href="/pages/public/shipping-information.html#ongkir" data-product-shipping-guide>Informasi Pengiriman</a>
            </p>
            <div class="product-shipping-result" id="product-shipping-result" aria-live="polite" hidden></div>
          </form>
          <div class="product-purchase" aria-label="Pembelian">
            <div class="product-quantity-heading">
              <label for="product-quantity">Jumlah</label>
            </div>
            <div class="product-purchase-row">
              <div class="product-stepper">
                <button type="button" data-product-step="-1" aria-label="Kurangi jumlah">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
                  </svg>
                </button>
                <input id="product-quantity" type="text" inputmode="numeric" autocomplete="off" maxlength="3" value="${escapeHtml(quantity)}" aria-describedby="product-quantity-help">
                <button type="button" data-product-step="1" aria-label="Tambah jumlah">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h14M12 5v14" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
                  </svg>
                </button>
              </div>
              <div class="product-actions">
                <p class="product-feedback" id="product-feedback" role="status" hidden></p>
                <p id="product-subtotal"></p>
                <button
                  class="product-button product-button-secondary"
                  id="product-add"
                  type="button"
                  data-product-add
                  aria-label="Tambah ke Keranjang"
                >
                  <span class="product-add-label-desktop" aria-hidden="true">Tambah ke Keranjang</span>
                  <span class="product-add-label-mobile" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 4h2l2.5 12h10L20 8H6M9 20h.01M17 20h.01" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                    Tambah
                  </span>
                </button>
                <button class="product-button product-button-primary" id="product-buy" type="button" data-product-buy>Beli Sekarang</button>
              </div>
            </div>
            <p class="product-field-hint" id="product-quantity-help"></p>
          </div>
        </section>
        ${renderCare()}
      </div>`;
    if (parameters.has("variant") && !product.variants.some((item) => item.id === parameters.get("variant")))
    {
      notice("Ukuran pada tautan tidak tersedia. Pilihan yang tersedia sudah ditampilkan; periksa sebelum membeli.", true);
    }
    updatePurchase();
    observeActionBar();
  }

  function updatePurchase()
  {
    const input = document.getElementById("product-quantity");
    if (!input)
    {
      return;
    }
    const available = product.available && maximum() > 0 && validPrice();
    const isValid = validQuantity();
    const limit = maximum();
    const current = existingQuantity();
    const addOverLimit = isValid && Number(quantity) + current > limit;
    input.disabled = pending || !available;
    input.setAttribute("aria-invalid", String(available && !isValid));
    const hint = document.getElementById("product-quantity-help");
    hint.classList.toggle("is-error", available && (!isValid || addOverLimit));
    hint.textContent = !product.available ? "Produk ini belum tersedia untuk dibeli. Anda dapat memilih produk lain di katalog."
      : !maximum() ? "Stok sedang habis. Silakan pilih produk lain di katalog."
        : !validPrice() ? "Pembelian tersedia setelah informasi harga dilengkapi."
          : !isValid ? `Masukkan jumlah 1–${limit}.`
            : current ? `${current} ${variant.unit} sudah di keranjang. Maksimal total ${limit} ${variant.unit} per produk.`
              : `Maksimal ${limit} ${variant.unit} per pembelian.`;
    document.getElementById("product-subtotal").innerHTML = isValid && validPrice()
      ? `<span>Subtotal</span><strong>${money(variant.price * Number(quantity))}</strong>` : "";
    document.getElementById("product-add").disabled = pending || !available || !isValid || addOverLimit;
    document.getElementById("product-buy").disabled = pending || !available || !isValid;
    document.getElementById("product-variant").disabled = pending;
    document.querySelectorAll("[data-product-step]").forEach((button) =>
    {
      const step = Number(button.dataset.productStep);
      button.disabled = pending || !available || (isValid && (step < 0 ? Number(quantity) <= 1 : Number(quantity) >= limit));
    });
  }

  function rememberChoice()
  {
    if (!validQuantity())
    {
      return;
    }
    const url = new URL(location.href);
    url.searchParams.set("qty", quantity);
    url.searchParams.set("variant", variant.id);
    history.replaceState(history.state, "", url);
  }

  function selectImage(index)
  {
    imageIndex = index;
    const image = product.gallery[index];
    const frame = document.getElementById("product-photo");
    frame.classList.remove("is-hover-zoom");
    frame.querySelector(".product-image-error").hidden = true;
    frame.querySelector(".product-photo-button").hidden = false;
    const mainImage = document.getElementById("product-main-image");
    mainImage.style.transformOrigin = "50% 50%";
    mainImage.srcset = image.srcSet || "";
    mainImage.src = image.src;
    mainImage.alt = image.alt;
    document.querySelectorAll("[data-product-image]").forEach((button) =>
      button.setAttribute("aria-pressed", String(Number(button.dataset.productImage) === index)));
    document.querySelector(".product-photo-caption").textContent = `Foto ${index + 1} dari ${product.gallery.length}. Gambar produk contoh.`;
  }

  async function load(recover = false)
  {
    if (loading)
    {
      return;
    }
    loading = true;
    content.setAttribute("aria-busy", "true");
    content.innerHTML = '<div class="product-loading" role="status"><span class="product-spinner" aria-hidden="true"></span><p>Memuat detail produk…</p></div>';
    try
    {
      const result = await repository.load(slug, { recover });
      product = result.product;
      cart = result.cart;
      if (!product)
      {
        content.innerHTML = `
          <section class="product-state">
            <h1>Produk tidak ditemukan</h1>
            <p>Produk mungkin sudah dihapus atau tautannya tidak lagi tersedia.</p>
            <a class="product-button product-button-primary" href="/pages/public/catalog.html">Jelajahi Katalog</a>
          </section>`;
      }
      else
      {
        variant = product.variants.find((item) => item.id === parameters.get("variant")) || product.variants[0];
        renderProduct();
        window.RylvaWishlistStore.registerProducts([product]);
        window.RylvaWishlistStore.synchronize();
        updateCartCount();
        if (cart.storageWarning)
        {
          notice(cart.storageWarning, true);
        }
        if (repository.workbench && repository.scenario === "shippingRates")
        {
          document.getElementById("product-shipping").requestSubmit();
        }
      }
    }
    catch (error)
    {
      const offline = error.code === "offline";
      content.innerHTML = `
        <section class="product-state" role="alert">
          <h1>${offline ? "Koneksi terputus" : error.code === "maintenance" ? "Layanan sedang dalam perawatan" : "Detail produk belum dapat dimuat"}</h1>
          <p>${offline ? "Sambungkan kembali ke internet, lalu coba lagi." : "Pilihan Anda tetap ada di tautan ini. Coba muat kembali dalam beberapa saat."}</p>
          <button class="product-button product-button-primary" type="button" data-product-retry>Coba Lagi</button>
          <a href="/pages/public/catalog.html">Kembali ke Katalog</a>
        </section>`;
    }
    finally
    {
      loading = false;
      content.setAttribute("aria-busy", "false");
      if (recover)
      {
        const heading = content.querySelector("h1");
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    }
  }

  async function purchase(action)
  {
    if (pending || !product || !product.available || !validQuantity() || !validPrice())
    {
      return;
    }
    pending = true;
    updatePurchase();
    const button = document.getElementById(action === "add" ? "product-add" : "product-buy");
    const originalMarkup = button.innerHTML;
    button.textContent = action === "add" ? "Menambahkan…" : "Menyiapkan…";
    button.setAttribute("aria-busy", "true");
    try
    {
      if (action === "add")
      {
        cart = await repository.add(product, variant.id, Number(quantity));
        updateCartCount();
        notice(cart.storageWarning || `${quantity} ${variant.unit} ${product.name} ditambahkan ke keranjang contoh.`, false, true);
      }
      else
      {
        await repository.inspect(product, variant.id, Number(quantity));
        if (repository.workbench)
        {
          notice(`Pratinjau: ${quantity} ${variant.unit} siap dibeli. Checkout tidak dibuka dari pemeriksaan state.`);
          return;
        }
        sessionStorage.setItem("rylva-cart-checkout-preview-v1", JSON.stringify(
        {
          items: [{ lineId: variant.lineId, quantity: Number(quantity) }],
          mode: cart.mode,
          sourceScenario: "product-direct",
          returnTo: "/pages/customer/cart.html"
        }));
        const previousIntent = JSON.parse(sessionStorage.getItem("rylva-checkout-preview-intent-v1"));
        if (previousIntent?.status === "created")
        {
          sessionStorage.removeItem("rylva-checkout-preview-intent-v1");
        }
        location.assign("/pages/customer/checkout.html?from=cart");
      }
    }
    catch (error)
    {
      if (error.code === "conflict")
      {
        try
        {
          cart = await repository.readCart();
          updateCartCount();
        }
        catch
        {
          notice("Keranjang terbaru belum dapat dimuat. Sambungkan kembali dan coba lagi.", true);
          return;
        }
      }
      notice(error.code ? error.message : "Tindakan belum dapat disimpan. Periksa izin penyimpanan peramban dan coba lagi.", true, error.code === "limit");
    }
    finally
    {
      pending = false;
      button.innerHTML = originalMarkup;
      button.removeAttribute("aria-busy");
      updatePurchase();
    }
  }

  function renderShippingMessage(title, message, state, retry = false)
  {
    const result = document.getElementById("product-shipping-result");
    result.hidden = false;
    result.dataset.state = state;
    result.setAttribute("role", state === "error" ? "alert" : "status");
    result.setAttribute("aria-busy", String(state === "loading"));
    result.innerHTML = `
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
      ${retry ? '<button class="product-shipping-retry" type="button" data-product-shipping-retry>Coba Lagi</button>' : ""}`;
  }

  function invalidateShipping(reason, announce)
  {
    const result = document.getElementById("product-shipping-result");
    if (!result)
    {
      return;
    }
    const wasVisible = announce ?? !result.hidden;
    quoteVersion++;
    shippingQuoteContext = null;
    const button = document.querySelector("#product-shipping button[type='submit']");
    button.disabled = false;
    button.textContent = "Cek Ongkir";
    button.removeAttribute("aria-busy");
    result.removeAttribute("aria-busy");
    if (reason !== "postcode" && wasVisible)
    {
      renderShippingMessage("Perbarui estimasi", "Pilihan produk atau jumlah berubah. Tekan Cek Ongkir untuk melihat estimasi terbaru.", "stale");
    }
    else
    {
      result.hidden = true;
      result.replaceChildren();
      delete result.dataset.state;
    }
  }

  function renderShippingRates(response, requested)
  {
    if (!Array.isArray(response?.services))
    {
      renderShippingMessage("Ongkir belum dapat dimuat", "Data tarif belum lengkap. Kode pos tetap tersimpan; coba lagi.", "error", true);
      return;
    }
    const sourceServices = response.services;
    const services = sourceServices.filter((service) =>
      typeof service.name === "string" && service.name.trim()
      && Number.isSafeInteger(service.price) && service.price >= 0)
      .sort((first, second) => first.price - second.price);
    if (!services.length)
    {
      renderShippingMessage("Belum ada estimasi ongkir",
        sourceServices.length ? "Tarif layanan belum tersedia. Coba cek kembali dalam beberapa saat."
          : "Belum ada layanan pengiriman untuk tujuan ini. Coba kode pos lain.",
        "empty", Boolean(sourceServices.length));
      return;
    }
    const partial = services.length < sourceServices.length;
    const result = document.getElementById("product-shipping-result");
    result.hidden = false;
    result.dataset.state = partial ? "partial" : "success";
    result.setAttribute("role", "status");
    result.setAttribute("aria-busy", "false");
    result.innerHTML = `
      <div class="product-shipping-heading">
        <div>
          <h3>Estimasi ongkir</h3>
          <p>Ke kode pos ${escapeHtml(requested.postcode)}, untuk ${requested.quantity} ${escapeHtml(variant.unit)}.</p>
        </div>
        ${response.preview ? '<span class="product-shipping-preview">Tarif contoh</span>' : ""}
      </div>
      <ul class="product-shipping-services" aria-label="Layanan dan estimasi biaya pengiriman">
        ${services.map((service) => `
          <li>
            <div>
              <strong>${escapeHtml(service.name)}</strong>
              <p>${escapeHtml(service.eta || "Estimasi tiba belum tersedia.")}</p>
            </div>
            <strong class="product-shipping-price">${money(service.price)}</strong>
          </li>`).join("")}
      </ul>
      ${partial ? `
        <p class="product-shipping-partial">Sebagian tarif belum tersedia.</p>
        <button class="product-shipping-retry" type="button" data-product-shipping-retry>Coba Lagi</button>` : ""}
      <p class="product-shipping-note">Kode pos ini tidak menambah atau mengubah alamat Anda. Biaya akhir dikonfirmasi di Checkout.</p>`;
  }

  async function checkShipping()
  {
    const input = document.getElementById("product-postcode");
    const button = document.querySelector("#product-shipping button[type='submit']");
    if (button.disabled)
    {
      return;
    }
    const postcode = input.value.trim();
    shippingPostcode = postcode;
    const valid = /^\d{5}$/.test(postcode);
    input.setAttribute("aria-invalid", String(!valid));
    if (!valid)
    {
      renderShippingMessage("Periksa kode pos", "Masukkan kode pos yang terdiri dari 5 angka.", "error");
      input.focus();
      return;
    }
    if (!validQuantity())
    {
      renderShippingMessage("Periksa jumlah produk", "Masukkan jumlah produk yang tersedia sebelum mengecek ongkir.", "error");
      document.getElementById("product-quantity").focus();
      return;
    }
    const version = ++quoteVersion;
    const requested = { postcode, productId: product.productId, variantId: variant.id, quantity: Number(quantity) };
    shippingQuoteContext = requested;
    button.disabled = true;
    button.textContent = "Memeriksa…";
    button.setAttribute("aria-busy", "true");
    renderShippingMessage("Memeriksa ongkir", `Memuat layanan untuk kode pos ${postcode}…`, "loading");
    try
    {
      const response = await repository.quote(postcode, requested);
      if (version === quoteVersion)
      {
        renderShippingRates(response, requested);
        if (repository.workbench && repository.scenario === "shippingRates")
        {
          document.getElementById("product-shipping").scrollIntoView({ block: "start", behavior: "auto" });
        }
      }
    }
    catch (error)
    {
      if (version === quoteVersion)
      {
        renderShippingMessage("Ongkir belum dapat dimuat", error.code ? error.message
          : "Layanan pengiriman belum dapat dihubungi. Kode pos tetap tersimpan; coba lagi.", "error", true);
      }
    }
    finally
    {
      if (version === quoteVersion)
      {
        button.disabled = false;
        button.textContent = "Cek Ongkir";
        button.removeAttribute("aria-busy");
      }
    }
  }

  function observeActionBar()
  {
    actionBarObserver?.disconnect();
    const actions = document.querySelector(".product-actions");
    if (!actions)
    {
      return;
    }
    const updateHeight = () =>
    {
      document.body.style.setProperty("--product-action-bar-height", actions.getBoundingClientRect().height + "px");
    };
    if (typeof ResizeObserver === "function")
    {
      actionBarObserver = new ResizeObserver(updateHeight);
      actionBarObserver.observe(actions);
    }
    updateHeight();
  }

  function updateHoverZoom(event)
  {
    const button = event.target.closest(".product-photo-button");
    if (!button || event.pointerType !== "mouse" || !hoverZoomMedia.matches)
    {
      return;
    }
    const bounds = button.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100));
    const y = Math.max(0, Math.min(100, (event.clientY - bounds.top) / bounds.height * 100));
    document.getElementById("product-photo").classList.add("is-hover-zoom");
    document.getElementById("product-main-image").style.transformOrigin = `${x}% ${y}%`;
  }

  content.addEventListener("pointerover", updateHoverZoom);
  content.addEventListener("pointermove", updateHoverZoom, { passive: true });
  content.addEventListener("pointerout", (event) =>
  {
    const button = event.target.closest(".product-photo-button");
    if (button && !button.contains(event.relatedTarget))
    {
      document.getElementById("product-photo")?.classList.remove("is-hover-zoom");
    }
  });
  hoverZoomMedia.addEventListener("change", () =>
  {
    document.getElementById("product-photo")?.classList.remove("is-hover-zoom");
  });

  document.getElementById("product-back").href = navigation.returnUrl().pathname + navigation.returnUrl().search;
  const collectionLabels =
  {
    "/pages/public/new-collection.html": "Koleksi Baru",
    "/pages/public/special-offers.html": "Promo Spesial"
  };
  if (collectionLabels[navigation.returnUrl().pathname])
  {
    document.getElementById("product-back").textContent = collectionLabels[navigation.returnUrl().pathname];
  }
  if (["/pages/public/care-guides.html", "/pages/public/care-guide-detail.html"].includes(navigation.returnUrl().pathname))
  {
    document.getElementById("product-back").textContent = "Panduan Perawatan";
  }
  if (navigation.returnUrl().pathname === "/pages/public/category.html")
  {
    const category = window.RylvaStorefrontCategories.find(navigation.returnUrl().searchParams.get("category"));
    document.getElementById("product-back").textContent = category?.name || "Kategori";
  }
  document.addEventListener("click", (event) =>
  {
    if (event.target.closest("[data-product-shipping-guide]"))
    {
      try
      {
        history.replaceState(
        {
          ...history.state,
          productShipping: { slug, postcode: shippingPostcode }
        }, "", location.href);
      }
      catch
      {
        // The guide link remains usable when history state cannot be updated.
      }
      return;
    }
    const back = event.target.closest("[data-product-back]");
    if (back && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey)
    {
      event.preventDefault();
      navigation.back();
      return;
    }
    const control = event.target.closest("button");
    if (!control || control.disabled || control.hasAttribute("data-header-wishlist-trigger"))
    {
      return;
    }
    if (control.hasAttribute("data-product-shipping-retry"))
    {
      document.getElementById("product-shipping").requestSubmit();
    }
    else if (control.hasAttribute("data-product-dismiss"))
    {
      control.closest(".product-feedback, .home-toast").hidden = true;
    }
    else if (control.hasAttribute("data-home-close"))
    {
      dialog.close();
    }
    else if (control.hasAttribute("data-product-retry"))
    {
      load(true);
    }
    else if (control.hasAttribute("data-product-add") || control.hasAttribute("data-product-buy"))
    {
      purchase(control.hasAttribute("data-product-add") ? "add" : "buy");
    }
    else if (control.dataset.productStep)
    {
      quantity = String(Math.max(1, Math.min(maximum(), (Number(quantity) || 1) + Number(control.dataset.productStep))));
      document.getElementById("product-quantity").value = quantity;
      if (shippingQuoteContext && shippingQuoteContext.quantity !== Number(quantity))
      {
        invalidateShipping("quantity");
      }
      updatePurchase();
      rememberChoice();
    }
    else if (control.hasAttribute("data-product-image"))
    {
      selectImage(Number(control.dataset.productImage));
    }
    else if (control.hasAttribute("data-product-image-retry"))
    {
      selectImage(imageIndex);
    }
    else if (control.hasAttribute("data-product-zoom"))
    {
      const image = product.gallery[imageIndex];
      openDialog(`Foto ${imageIndex + 1} · ${product.name}`, `<img class="product-zoom-image" src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" width="700" height="700">`);
    }
    else if (control.dataset.storefrontPage === "Wishlist")
    {
      event.stopImmediatePropagation();
      showWishlist();
    }
    else if (control.dataset.storefrontPage && !["Beranda", "Akun", "Keranjang", "Lacak Pesanan"].includes(control.dataset.storefrontPage))
    {
      event.stopImmediatePropagation();
      const page = control.dataset.storefrontPage;
      if (["Buket Kustom", "Buket Costum"].includes(page))
      {
        location.assign("/pages/customer/bouquet-customizer.html");
        return;
      }
      const categories = { "Tanaman Hias": "plants", "Pot & Vas": "pots", "Media Tanam": "media", "Pupuk & Nutrisi": "media", "Alat Berkebun": "tools", "Buket Kustom": "custom", "Buket Costum": "custom", "Terrarium & Moss": "terrarium", "Perlengkapan Berkebun": "tools" };
      if (categories[page] || ["Semua Produk", "Koleksi Baru", "Promo Spesial"].includes(page))
      {
        const target = new URL("/pages/public/catalog.html", location.origin);
        if (categories[page])
        {
          target.searchParams.set("category", categories[page]);
        }
        if (page === "Promo Spesial")
        {
          target.searchParams.set("discount", "1");
        }
        location.assign(target);
      }
      else
      {
        openDialog(page, `<p>Bagian ${escapeHtml(page)} belum tersedia pada pratinjau ini.</p><button class="home-button" type="button" data-home-close>Kembali ke Produk</button>`);
      }
    }
  }, true);

  content.addEventListener("input", (event) =>
  {
    if (event.target.id === "product-quantity")
    {
      quantity = event.target.value;
      if (shippingQuoteContext && shippingQuoteContext.quantity !== Number(quantity))
      {
        invalidateShipping("quantity");
      }
      updatePurchase();
      rememberChoice();
    }
    else if (event.target.id === "product-postcode")
    {
      shippingPostcode = event.target.value;
      event.target.removeAttribute("aria-invalid");
      invalidateShipping("postcode");
    }
  });
  content.addEventListener("change", (event) =>
  {
    if (event.target.id === "product-variant")
    {
      const hadShippingResult = !document.getElementById("product-shipping-result").hidden;
      variant = product.variants.find((item) => item.id === event.target.value);
      quantity = String(Math.max(1, Math.min(Number(quantity) || 1, maximum())));
      renderProduct();
      invalidateShipping("variant", hadShippingResult);
      document.getElementById("product-variant").focus({ preventScroll: true });
      rememberChoice();
    }
  });
  content.addEventListener("submit", (event) =>
  {
    if (event.target.id === "product-shipping")
    {
      event.preventDefault();
      checkShipping();
    }
  });
  document.getElementById("storefront-search").addEventListener("submit", (event) =>
  {
    event.preventDefault();
    event.stopImmediatePropagation();
    const target = new URL("/pages/public/catalog.html", location.origin);
    const value = document.getElementById("storefront-search-input").value.trim();
    if (value)
    {
      target.searchParams.set("q", value);
    }
    location.assign(target);
  }, true);
  document.addEventListener("error", (event) =>
  {
    const image = event.target;
    if (image.tagName !== "IMG")
    {
      return;
    }
    if (image.id === "product-main-image")
    {
      const frame = image.closest(".product-photo");
      frame.querySelector(".product-photo-button").hidden = true;
      frame.querySelector(".product-image-error").hidden = false;
    }
    if (image.closest(".product-thumbnail"))
    {
      image.hidden = true;
      image.closest(".product-thumbnail").classList.add("has-image-error");
    }
  }, true);
  dialog.addEventListener("close", () => opener?.isConnected && opener.focus({ preventScroll: true }));
  dialog.addEventListener("click", (event) =>
  {
    if (event.target === dialog)
    {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)
      {
        dialog.close();
      }
    }
  });
  window.addEventListener("offline", () => notice("Koneksi terputus. Pilihan tetap tersimpan; sambungkan kembali sebelum melanjutkan.", true));
  window.addEventListener("online", () => notice("Koneksi kembali. Anda dapat mencoba tindakan sebelumnya lagi."));
  window.addEventListener("storage", async (event) =>
  {
    if (event.key === window.RylvaCartPreviewRepository.guestKey && !repository.workbench && product)
    {
      try
      {
        cart = await repository.readCart();
        updateCartCount();
        updatePurchase();
        notice("Keranjang diperbarui dari tab lain. Periksa jumlah sebelum melanjutkan.");
      }
      catch
      {
        notice("Keranjang terbaru belum dapat dimuat. Sambungkan kembali lalu coba lagi.", true);
      }
    }
  });
  window.RylvaWishlistStore.bind(
  {
    onMessage: (message, isError) => notice(message, isError)
  });
  load();
})();
