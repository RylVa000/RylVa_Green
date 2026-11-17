"use strict";

(() =>
{
  const repository = window.RylvaCartPreviewRepository;
  const root = document.getElementById("cart-root");
  const notice = document.getElementById("cart-notice");
  const contextLabel = document.getElementById("cart-context");
  const dialog = document.getElementById("cart-dialog");
  const dialogTitle = document.getElementById("cart-dialog-title");
  const dialogContent = document.getElementById("cart-dialog-content");
  const announcement = document.getElementById("cart-announcement");
  const contextKey = "rylva-cart-preview-context-v1:" + repository.scenario;
  const selected = new Set();
  const drafts = new Map();
  const errors = new Map();
  const failedImages = new Set();
  let cart = null;
  let pending = false;
  let stale = false;
  let uncertain = false;
  let selectionInitialized = false;
  let triggerElement = null;
  let dialogAction = null;
  let leaveAction = null;
  let bypassLeave = false;
  let savedContext = null;
  let activeNotice = null;
  let retryAt = 0;

  const currency = new Intl.NumberFormat("id-ID",
  {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  });

  function escapeHtml(value)
  {
    return String(value ?? "").replace(/[&<>"']/g, (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function money(value)
  {
    return currency.format(value);
  }

  function validPrice(item)
  {
    return Number.isSafeInteger(item.price) && item.price >= 0
      && Number.isSafeInteger(item.basePrice) && item.basePrice >= item.price;
  }

  function maximumFor(item)
  {
    const siblings = cart.items.filter((candidate) => candidate.productId === item.productId
      && candidate.lineId !== item.lineId).reduce((sum, candidate) => sum + candidate.quantity, 0);
    return Math.max(0, Math.min(item.availableStock, cart.limits.perProduct - siblings));
  }

  function itemProblem(item)
  {
    if (!Number.isInteger(item.availableStock) || item.availableStock < 0)
    {
      return "Ketersediaan produk belum dapat diperiksa. Perbarui keranjang sebelum Checkout.";
    }
    if (!item.available || item.availableStock < 1)
    {
      return item.issue || "Produk ini tidak tersedia. Hapus untuk melanjutkan Checkout.";
    }
    if (!validPrice(item) || !item.unit || !item.productId || !item.variantId)
    {
      return "Informasi produk perlu diperiksa. Perbarui keranjang sebelum Checkout.";
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > maximumFor(item))
    {
      return "Jumlah perlu disesuaikan. Maksimal " + maximumFor(item) + " " + item.unit + " untuk item ini.";
    }
    return "";
  }

  function announce(message)
  {
    announcement.textContent = "";
    window.setTimeout(() => announcement.textContent = message, 30);
  }

  function saveContext()
  {
    if (!cart || !selectionInitialized)
    {
      return;
    }
    try
    {
      window.sessionStorage.setItem(contextKey, JSON.stringify(
      {
        selected: [...selected],
        scrollY: window.scrollY
      }));
    }
    catch
    {
      // Context restoration is optional; the cart adapter owns persisted items.
    }
  }

  function readContext()
  {
    try
    {
      const value = JSON.parse(window.sessionStorage.getItem(contextKey));
      if (Array.isArray(value?.selected))
      {
        savedContext = value;
      }
    }
    catch
    {
      savedContext = null;
    }
  }

  function setNotice(message, tone = "info", action = null)
  {
    activeNotice = { message, tone, action };
    renderNotice();
    announce(message);
  }

  function renderNotice()
  {
    const message = activeNotice?.message || cart?.storageWarning;
    notice.hidden = !message;
    if (!message)
    {
      notice.replaceChildren();
      return;
    }
    notice.dataset.tone = activeNotice?.tone || "warning";
    const text = document.createElement("p");
    text.textContent = message;
    notice.replaceChildren(text);
    if (activeNotice?.action)
    {
      const button = document.createElement("button");
      button.className = "button button-secondary";
      button.type = "button";
      button.dataset.cartAction = activeNotice.action;
      button.textContent = activeNotice.action === "recover" ? "Muat Keranjang Terbaru" : "Periksa Produk";
      button.disabled = pending || Date.now() < retryAt;
      if (Date.now() < retryAt)
      {
        button.textContent = "Tunggu sebentar sebelum mencoba lagi";
      }
      notice.append(button);
    }
  }

  function focusControl(controlId)
  {
    if (controlId)
    {
      document.getElementById(controlId)?.focus({ preventScroll: true });
    }
  }

  function selectedItems()
  {
    return cart.items.filter((item) => selected.has(item.lineId) && !itemProblem(item));
  }

  function checkoutProblem()
  {
    if (pending)
    {
      return "Tunggu hingga perubahan selesai.";
    }
    if (stale || uncertain)
    {
      return "Muat keranjang terbaru untuk memastikan isi dan jumlahnya.";
    }
    if (!navigator.onLine)
    {
      return "Sambungkan kembali ke internet sebelum Checkout.";
    }
    if (drafts.size)
    {
      return "Perbaiki atau selesaikan perubahan jumlah terlebih dahulu.";
    }
    if (cart.items.some((item) => itemProblem(item)))
    {
      return "Selesaikan produk bermasalah sebelum Checkout, meskipun tidak dipilih.";
    }
    const chosen = selectedItems();
    if (!chosen.length)
    {
      return "Pilih produk untuk Checkout.";
    }
    if (chosen.reduce((sum, item) => sum + item.quantity, 0) > cart.limits.perOrder)
    {
      return "Maksimal " + cart.limits.perOrder + " unit per pesanan. Kurangi jumlah atau pilihan produk.";
    }
    return "";
  }

  function itemMarkup(item)
  {
    const lineId = escapeHtml(item.lineId);
    const name = escapeHtml(item.name || "Nama produk belum tersedia");
    const problem = itemProblem(item);
    const draft = drafts.has(item.lineId) ? drafts.get(item.lineId) : item.quantity;
    const fieldError = errors.get(item.lineId);
    const disabled = pending || stale || uncertain;
    const maxQuantity = maximumFor(item);
    const hasDiscount = validPrice(item) && item.basePrice > item.price;
    const issue = fieldError || problem || item.changeMessage
      || (item.availableStock <= cart.limits.lowStock ? "Stok terbatas: " + item.availableStock + " " + item.unit + "." : "");
    const photo = failedImages.has(item.lineId)
      ? '<span class="cart-photo-fallback">Foto belum tersedia</span>'
      : `<img src="${escapeHtml(item.image)}" data-product="${escapeHtml(item.imageKey)}"
          data-cart-image="${lineId}" alt="${name}" loading="eager">`;
    return `
      <article class="cart-item" id="cart-item-${lineId}" aria-labelledby="cart-name-${lineId}"
        aria-busy="${pending}">
        <label class="cart-check">
          <input type="checkbox" data-cart-select="${lineId}" id="cart-select-${lineId}"
            aria-label="Pilih ${name}, ${escapeHtml(item.variant)}"
            ${selected.has(item.lineId) && !problem ? "checked" : ""}
            ${disabled || problem ? "disabled" : ""}>
        </label>
        <div class="cart-photo">${photo}</div>
        <div class="cart-product-copy">
          <h3 class="cart-product-name" id="cart-name-${lineId}">
            <button type="button" data-cart-action="product" data-line-id="${lineId}">${name}</button>
          </h3>
          <p class="cart-variant">${escapeHtml(item.variant)} <span>${escapeHtml(item.attributes)}</span></p>
          ${item.configuration ? `
            <details class="cart-config">
              <summary>Detail Kustomisasi</summary>
              <ul>${item.configuration.map((value) => `
                <li>${escapeHtml(value)}</li>`).join("")}
              </ul>
            </details>
            ${item.configurationDraft ? `
              <a href="/pages/customer/bouquet-customizer.html?edit=${encodeURIComponent(item.lineId)}">Ubah rakitan</a>` : ""}` : ""}
        </div>
        <div class="cart-price-actions">
          <div class="cart-pricing">
            ${hasDiscount ? `
              <div class="cart-previous-price">
                <del class="cart-old-price">${money(item.basePrice)}</del>
                <span class="cart-discount">Hemat ${money(item.basePrice - item.price)}</span>
              </div>` : ""}
            <p class="cart-unit-price">
              ${validPrice(item) ? `${money(item.price)}<small>/${escapeHtml(item.unit)}</small>` : "Harga belum tersedia"}
            </p>
          </div>
          <div class="cart-row-actions">
            <button class="cart-remove" type="button" id="cart-remove-${lineId}"
              data-cart-action="delete" data-line-id="${lineId}"
              aria-label="Hapus ${name}, ${escapeHtml(item.variant)}" ${disabled ? "disabled" : ""}>Hapus</button>
            <div class="cart-stepper" role="group" aria-label="Jumlah ${name}">
              <button type="button" data-cart-action="decrease" data-line-id="${lineId}"
                id="cart-decrease-${lineId}" aria-label="Kurangi jumlah ${name}"
                ${disabled || !item.available || item.quantity <= 1 ? "disabled" : ""}>−</button>
              <label class="visually-hidden" for="cart-quantity-${lineId}">Jumlah ${name}, maksimal ${maxQuantity}</label>
              <input id="cart-quantity-${lineId}" data-cart-quantity="${lineId}" type="text"
                inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off"
                value="${escapeHtml(draft)}" aria-describedby="cart-feedback-${lineId}"
                aria-invalid="${Boolean(fieldError)}" ${disabled || !item.available ? "disabled" : ""}>
              <button type="button" data-cart-action="increase" data-line-id="${lineId}"
                id="cart-increase-${lineId}" aria-label="Tambah jumlah ${name}"
                ${disabled || !item.available || item.quantity >= maxQuantity ? "disabled" : ""}>+</button>
            </div>
          </div>
        </div>
        <div class="cart-item-feedback" id="cart-feedback-${lineId}" data-tone="${fieldError || problem ? "danger" : "warning"}">
          ${issue ? `<p>${escapeHtml(issue)}</p>` : ""}
          ${problem && item.available && validPrice(item) && item.quantity > maxQuantity && maxQuantity > 0 ? `
            <button class="button button-secondary" type="button" data-cart-action="adjust"
              data-line-id="${lineId}" ${disabled ? "disabled" : ""}>Ubah menjadi ${maxQuantity}</button>` : ""}
          ${fieldError ? `<button class="button button-secondary" type="button" data-cart-action="discard"
            data-line-id="${lineId}">Gunakan jumlah tersimpan (${item.quantity})</button>` : ""}
          ${problem && (!validPrice(item) || !item.unit) ? `
            <button class="button button-secondary" type="button" data-cart-action="recover">Perbarui Keranjang</button>` : ""}
        </div>
      </article>`;
  }

  function renderSummary()
  {
    const summary = document.getElementById("cart-summary");
    if (!summary || !cart)
    {
      return;
    }
    const chosen = selectedItems();
    const units = chosen.reduce((sum, item) => sum + item.quantity, 0);
    const baseTotal = chosen.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);
    const total = chosen.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const problem = checkoutProblem();
    const pricesIncomplete = cart.items.some((item) => !validPrice(item));
    summary.innerHTML = `
      <h2>Ringkasan Belanja</h2>
      <p class="cart-quantity-note">${chosen.length} jenis produk, ${units} unit dipilih</p>
      <dl>
        <div>
          <dt>Total Harga (${chosen.length} Produk)</dt>
          <dd>${pricesIncomplete ? "Belum tersedia" : money(baseTotal)}</dd>
        </div>
        ${baseTotal > total ? `
          <div>
            <dt>Potongan Promo</dt>
            <dd>−${money(baseTotal - total)}</dd>
          </div>` : ""}
        <div class="cart-total">
          <dt>Total</dt>
          <dd>${pricesIncomplete ? "Belum tersedia" : money(total)}</dd>
        </div>
      </dl>
      <button class="button button-primary cart-checkout" id="cart-checkout" type="button"
        data-cart-action="checkout" aria-describedby="cart-checkout-help" ${problem ? "disabled" : ""}>
        ${pending ? "Memproses…" : "Checkout (" + chosen.length + ")"}
      </button>
      <p class="cart-helper" id="cart-checkout-help">${escapeHtml(problem || "Belum termasuk ongkos kirim. Dihitung saat Checkout.")}</p>
      ${problem && (stale || uncertain) ? `
        <button class="button button-secondary" type="button" data-cart-action="recover" ${pending ? "disabled" : ""}>Muat Keranjang Terbaru</button>` : ""}`;
    const all = document.getElementById("cart-select-all");
    if (all)
    {
      const eligible = cart.items.filter((item) => !itemProblem(item));
      all.checked = eligible.length > 0 && eligible.every((item) => selected.has(item.lineId));
      all.indeterminate = chosen.length > 0 && chosen.length < eligible.length;
      all.disabled = pending || stale || uncertain || eligible.length === 0;
    }
    for (const checkbox of root.querySelectorAll("[data-cart-select]"))
    {
      const item = cart.items.find((candidate) => candidate.lineId === checkbox.dataset.cartSelect);
      checkbox.checked = Boolean(item && selected.has(item.lineId) && !itemProblem(item));
    }
  }

  function renderCart(focusId = null)
  {
    root.setAttribute("aria-busy", String(pending));
    contextLabel.textContent = cart.mode === "account"
      ? "Keranjang pelanggan dengan data contoh. Perubahan hanya pada pratinjau ini."
      : "Periksa pilihan dan jumlah sebelum Checkout. Keranjang belum mengunci stok.";
    renderNotice();
    const totalCount = document.querySelector(".storefront-cart-count");
    if (totalCount)
    {
      totalCount.textContent = cart.items.length;
      totalCount.closest("button").setAttribute("aria-label", "Keranjang, " + cart.items.length + " jenis produk contoh");
    }
    if (!cart.items.length)
    {
      root.innerHTML = `
        <section class="cart-empty" data-figma-node="360:372" aria-labelledby="cart-empty-title">
          <img src="../../assets/images/cart/empty-basket.svg" width="475" height="354" alt="">
          <h2 id="cart-empty-title">Keranjang Kamu masih kosong</h2>
          <p>yuk, isi keranjangnya sama pilihan kamu</p>
          <button class="button button-primary" type="button" data-cart-action="shop">Mulai Belanja</button>
        </section>`;
      return;
    }
    root.innerHTML = `
      <div class="cart-layout">
        <div class="cart-product-column">
          <label class="cart-select-all" for="cart-select-all">
            <span class="cart-check">
              <input type="checkbox" id="cart-select-all">
            </span>
            <span>Pilih Semua Produk</span>
          </label>
          <section class="cart-product-group" aria-labelledby="cart-products-title">
            <header class="cart-group-heading">
              <h2 id="cart-products-title">Produk RylVa Green</h2>
              <span class="cart-group-count">${cart.items.length} jenis produk</span>
            </header>
            <div class="cart-products">
              ${cart.items.map(itemMarkup).join("")}
            </div>
          </section>
        </div>
        <aside class="cart-summary" id="cart-summary" aria-label="Ringkasan Belanja"></aside>
      </div>`;
    renderSummary();
    focusControl(focusId);
  }

  function acceptSnapshot(nextCart)
  {
    cart = nextCart;
    if (!selectionInitialized)
    {
      const initial = savedContext?.selected || cart.items.filter((item) => item.selected).map((item) => item.lineId);
      initial.forEach((lineId) => selected.add(lineId));
      selectionInitialized = true;
    }
    for (const lineId of selected)
    {
      const item = cart.items.find((candidate) => candidate.lineId === lineId);
      if (!item || itemProblem(item))
      {
        selected.delete(lineId);
      }
    }
    for (const lineId of drafts.keys())
    {
      const currentItem = cart.items.find((item) => item.lineId === lineId);
      if (!currentItem || String(currentItem.quantity) === String(drafts.get(lineId)).trim())
      {
        drafts.delete(lineId);
        errors.delete(lineId);
      }
    }
  }

  const readFailures =
  {
    loadError: ["Keranjang belum dapat dimuat", "Coba muat ulang. Isi yang masih tersimpan tidak dihapus."],
    maintenance: ["Layanan sedang tidak tersedia", "Tunggu sebentar, lalu coba muat keranjang kembali."],
    offline: ["Koneksi terputus", "Sambungkan ke internet, lalu muat keranjang terbaru."],
    notFound: ["Keranjang tidak ditemukan", "Tautan ini tidak menunjuk keranjang aktif yang dapat dibuka."],
    denied: ["Keranjang tidak dapat diakses", "Gunakan akun pelanggan yang memiliki keranjang ini."],
    verification: ["Verifikasi akun diperlukan", "Selesaikan verifikasi akun melalui alur masuk sebelum melanjutkan Checkout."],
    sessionExpired: ["Sesi Anda telah berakhir", "Masuk kembali untuk membuka keranjang akun. Data akun tidak disalin ke keranjang tamu."],
    expired: ["Keranjang telah kedaluwarsa", "Isi lama tidak lagi tersedia. Mulai belanja untuk membuat keranjang baru."],
    converted: ["Keranjang ini sudah digunakan", "Buka Pesanan Saya atau periksa keranjang aktif. Pesanan baru belum dibuat dari halaman ini."],
    merged: ["Keranjang telah digabung", "Periksa keranjang akun yang aktif sebelum melanjutkan."],
    merging: ["Menyinkronkan keranjang", "Tunggu sampai penggabungan terkonfirmasi. Keranjang tamu belum dibuang."],
    mergeError: ["Keranjang belum selesai digabung", "Periksa hasil penggabungan sebelum mencoba ulang. Isi tamu tetap dipertahankan."],
    slow: ["Keranjang belum selesai dimuat", "Pemuatan berlangsung lebih lama. Anda dapat mencoba kembali."],
    loading: ["Memuat keranjang…", "Menyiapkan produk dan ringkasan belanja."]
  };

  function renderReadFailure(code)
  {
    const [title, description] = readFailures[code] || readFailures.loadError;
    const onlyAuth = ["verification", "sessionExpired", "denied"].includes(code);
    root.setAttribute("aria-busy", String(["loading", "merging"].includes(code)));
    contextLabel.textContent = "Isi keranjang belum dapat ditampilkan.";
    root.innerHTML = `
      <section class="cart-page-state" aria-labelledby="cart-state-title">
        <h2 id="cart-state-title">${escapeHtml(title)}</h2>
        <p>${escapeHtml(description)}</p>
        <div class="cart-state-actions">
          ${onlyAuth ? '<button class="button button-primary" type="button" data-cart-action="auth">Masuk ke Akun</button>'
            : '<button class="button button-primary" type="button" data-cart-action="recover">Coba Lagi</button>'}
          ${code === "converted" ? '<button class="button button-secondary" type="button" data-cart-action="orders">Pesanan Saya</button>'
            : '<button class="button button-secondary" type="button" data-cart-action="shop">Mulai Belanja</button>'}
        </div>
      </section>`;
  }

  async function loadCart(recover = false)
  {
    if (pending || (recover && Date.now() < retryAt))
    {
      return;
    }
    pending = true;
    root.setAttribute("aria-busy", "true");
    if (cart)
    {
      renderCart();
    }
    try
    {
      acceptSnapshot(await repository.load({ recover }));
      pending = false;
      stale = false;
      uncertain = false;
      if (recover)
      {
        activeNotice = null;
      }
      if (repository.scenario === "mergeAdjusted")
      {
        activeNotice =
        {
          message: "Contoh hasil penggabungan: item identik digabung dan jumlah disesuaikan dengan batas. Tinjau pilihan sebelum Checkout.",
          tone: "warning"
        };
      }
      renderCart();
      if (recover)
      {
        announce("Keranjang terbaru sudah ditampilkan. Tinjau kembali perubahan Anda.");
      }
      else if (savedContext && Number.isFinite(savedContext.scrollY))
      {
        await document.fonts.ready;
        window.scrollTo(0, Math.max(0, savedContext.scrollY));
      }
      if (!recover && repository.scenario === "partialRefresh")
      {
        pending = true;
        renderCart();
        setNotice("Memperbarui harga dan stok. Tunggu sebelum Checkout.");
        window.setTimeout(() =>
        {
          pending = false;
          activeNotice = null;
          renderCart();
        }, 1800);
      }
    }
    catch (error)
    {
      pending = false;
      if (cart)
      {
        stale = true;
        setNotice("Keranjang terbaru belum dapat dimuat. Isi terakhir tetap terlihat. Coba kembali setelah koneksi atau layanan pulih.", "warning", "recover");
        renderCart();
      }
      else
      {
        renderReadFailure(error.code);
      }
    }
  }

  function openDialog(title, markup, action = null, trigger = document.activeElement)
  {
    triggerElement = trigger;
    dialogAction = action;
    dialogTitle.textContent = title;
    dialogContent.innerHTML = markup;
    if (!dialog.open)
    {
      dialog.showModal();
    }
    dialogTitle.focus();
  }

  function closeDialog()
  {
    if (pending)
    {
      return;
    }
    dialog.close();
    dialogAction = null;
    if (triggerElement?.isConnected)
    {
      triggerElement.focus({ preventScroll: true });
    }
    else
    {
      document.getElementById("cart-title").focus({ preventScroll: true });
    }
  }

  function showDestination(title)
  {
    const checkout = title === "Checkout" || title === "Masuk untuk Checkout";
    const chosen = cart ? selectedItems() : [];
    openDialog(title, `
      <div class="cart-dialog-copy">
        ${checkout && cart?.mode === "guest" ? '<p>Masuk atau daftar akun pelanggan untuk melanjutkan Checkout. Isi keranjang tetap dipertahankan.</p>' : ""}
        ${checkout ? `<p><strong>${chosen.length} jenis produk</strong> telah dipilih. Belum ada pesanan dibuat dan stok belum dicadangkan.</p>` : ""}
        <p>${escapeHtml(title)} belum terhubung pada pratinjau ini.</p>
        <div class="cart-dialog-actions">
          <button class="button button-primary" type="button" data-cart-action="close-dialog">Kembali ke Keranjang</button>
        </div>
      </div>`);
  }

  function mutationFailure(error)
  {
    const messages =
    {
      conflict: "Keranjang berubah di tempat lain. Muat versi terbaru; masukan Anda tetap dipertahankan.",
      removedElsewhere: "Item telah dihapus di tempat lain. Muat keranjang terbaru untuk melanjutkan.",
      csrf: "Keamanan sesi perlu diperbarui. Muat keranjang terbaru, lalu kirim ulang perubahan Anda.",
      rateLimited: "Terlalu banyak perubahan. Tunggu sebentar, lalu coba kembali.",
      saveError: "Jumlah belum tersimpan. Periksa masukan, lalu coba kembali.",
      deleteError: "Produk belum berhasil dihapus. Isi keranjang tetap dipertahankan."
    };
    uncertain = error.code === "uncertain";
    stale = ["conflict", "removedElsewhere", "csrf", "rateLimited"].includes(error.code);
    if (error.retryAt)
    {
      retryAt = error.retryAt;
      window.setTimeout(renderNotice, Math.max(0, retryAt - Date.now()) + 30);
    }
    setNotice(messages[error.code] || error.message || "Perubahan belum tersimpan. Coba kembali.",
      "warning", stale || uncertain ? "recover" : null);
  }

  async function changeQuantity(lineId, quantity, focusId)
  {
    if (pending || stale || uncertain)
    {
      return;
    }
    const item = cart.items.find((candidate) => candidate.lineId === lineId);
    if (!item)
    {
      return;
    }
    const target = String(quantity).trim();
    const number = /^\d+$/.test(target) ? Number(target) : NaN;
    if (!Number.isInteger(number) || number < 1 || number > maximumFor(item))
    {
      drafts.set(lineId, String(quantity));
      errors.set(lineId, maximumFor(item) > 0
        ? "Isi jumlah 1–" + maximumFor(item) + ". Untuk pesanan besar, hubungi toko melalui kanal yang tersedia."
        : "Batas produk sudah dipakai pada item lain. Kurangi jumlah item tersebut atau hapus produk ini.");
      renderCart(focusId);
      announce(errors.get(lineId));
      return;
    }
    if (number === item.quantity)
    {
      drafts.delete(lineId);
      errors.delete(lineId);
      renderCart(focusId);
      return;
    }
    drafts.set(lineId, target);
    errors.delete(lineId);
    pending = true;
    renderCart();
    try
    {
      acceptSnapshot(await repository.mutate(lineId, number, cart.revision));
      drafts.delete(lineId);
      activeNotice = null;
      announce("Jumlah diperbarui. Ringkasan belanja sudah dihitung ulang.");
    }
    catch (error)
    {
      errors.set(lineId, "Jumlah terakhir tersimpan: " + item.quantity + ". Periksa perubahan Anda.");
      mutationFailure(error);
    }
    pending = false;
    renderCart(focusId);
    saveContext();
  }

  async function removeItem(lineId)
  {
    if (pending || stale || uncertain)
    {
      return;
    }
    const itemIndex = cart.items.findIndex((item) => item.lineId === lineId);
    pending = true;
    for (const button of dialog.querySelectorAll("button"))
    {
      button.disabled = true;
    }
    dialog.setAttribute("aria-busy", "true");
    renderCart();
    try
    {
      acceptSnapshot(await repository.mutate(lineId, null, cart.revision));
      selected.delete(lineId);
      drafts.delete(lineId);
      errors.delete(lineId);
      pending = false;
      dialog.close();
      dialogAction = null;
      activeNotice = null;
      renderCart();
      const next = cart.items[Math.min(itemIndex, cart.items.length - 1)];
      focusControl(next ? "cart-remove-" + next.lineId : "cart-title");
      announce("Produk dihapus dari keranjang.");
      saveContext();
    }
    catch (error)
    {
      pending = false;
      mutationFailure(error);
      dialog.close();
      renderCart("cart-remove-" + lineId);
    }
    dialog.removeAttribute("aria-busy");
    for (const button of dialog.querySelectorAll("button"))
    {
      button.disabled = false;
    }
  }

  async function checkout()
  {
    if (checkoutProblem())
    {
      return;
    }
    pending = true;
    renderCart();
    saveContext();
    try
    {
      const result = await repository.prepareCheckout();
      acceptSnapshot(result.cart);
      pending = false;
      renderCart();
      if (result.changed)
      {
        setNotice("Harga berubah. Tinjau total terbaru sebelum melanjutkan Checkout.", "warning");
        focusControl("cart-checkout");
        return;
      }
      if (checkoutProblem())
      {
        return;
      }
      try
      {
        window.sessionStorage.setItem("rylva-cart-checkout-preview-v1", JSON.stringify(
        {
          items: cart.items.filter((item) => selected.has(item.lineId)).map((item) =>
          ({ lineId: item.lineId, quantity: item.quantity })),
          mode: cart.mode,
          sourceScenario: repository.scenario,
          returnTo: window.location.pathname + window.location.search
        }));
        const previousIntent = JSON.parse(window.sessionStorage.getItem("rylva-checkout-preview-intent-v1"));
        if (previousIntent?.status === "created")
        {
          window.sessionStorage.removeItem("rylva-checkout-preview-intent-v1");
        }
      }
      catch
      {
        showDestination("Checkout");
        setNotice("Penyimpanan tab dibatasi. Pilihan belum dapat diteruskan; periksa izin penyimpanan peramban lalu coba lagi.", "warning");
        return;
      }
      bypassLeave = true;
      window.location.assign("/pages/customer/checkout.html?from=cart");
    }
    catch (error)
    {
      pending = false;
      mutationFailure(error);
      renderCart("cart-checkout");
    }
  }

  function requestLeave(action)
  {
    leaveAction = action;
    openDialog("Perubahan jumlah belum disimpan", `
      <div class="cart-dialog-copy">
        <p>Perbaiki jumlah sebelum melanjutkan, atau buang masukan untuk memakai jumlah terakhir yang tersimpan.</p>
        <div class="cart-dialog-actions">
          <button class="button button-secondary" type="button" data-cart-action="close-dialog">Tetap Mengedit</button>
          <button class="button button-primary" type="button" data-cart-action="leave">Buang Masukan dan Lanjutkan</button>
        </div>
      </div>`);
  }

  document.addEventListener("click", (event) =>
  {
    const destination = event.target.closest("[data-storefront-page], a[href]");
    if (!destination || destination.closest("dialog") || bypassLeave || !drafts.size)
    {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    requestLeave(() =>
    {
      bypassLeave = true;
      destination.click();
      bypassLeave = false;
    });
  }, true);

  document.addEventListener("rylva:before-search", (event) =>
  {
    if (pending)
    {
      event.preventDefault();
      announcement.textContent = "Perubahan keranjang sedang disimpan. Coba pencarian setelah selesai.";
    }
    else if (drafts.size)
    {
      event.preventDefault();
      requestLeave(() =>
      {
        bypassLeave = true;
        event.detail.proceed();
      });
    }
  });

  document.addEventListener("click", (event) =>
  {
    const button = event.target.closest("[data-cart-action]");
    if (!button || button.disabled)
    {
      return;
    }
    const action = button.dataset.cartAction;
    const lineId = button.dataset.lineId;
    const item = cart?.items.find((candidate) => candidate.lineId === lineId);
    if (action === "close-dialog")
    {
      closeDialog();
    }
    else if (action === "recover")
    {
      loadCart(true);
    }
    else if (["increase", "decrease", "adjust"].includes(action) && item)
    {
      const target = action === "adjust" ? maximumFor(item) : item.quantity + (action === "increase" ? 1 : -1);
      changeQuantity(lineId, target, button.id || "cart-quantity-" + lineId);
    }
    else if (action === "discard")
    {
      drafts.delete(lineId);
      errors.delete(lineId);
      renderCart("cart-quantity-" + lineId);
    }
    else if (action === "delete" && item)
    {
      openDialog("Hapus produk dari keranjang?", `
        <div class="cart-dialog-copy">
          <p><strong>${escapeHtml(item.name || "Produk ini")}</strong> — ${escapeHtml(item.variant)}</p>
          <p>Produk akan dihapus dari keranjang. Tindakan ini tidak membatalkan pesanan yang sudah dibuat.</p>
          <div class="cart-dialog-actions">
            <button class="button button-secondary" type="button" data-cart-action="close-dialog">Batal</button>
            <button class="button button-primary" type="button" data-cart-action="confirm-delete">Hapus Produk</button>
          </div>
        </div>`, () => removeItem(lineId), button);
    }
    else if (action === "confirm-delete")
    {
      dialogAction?.();
    }
    else if (action === "checkout")
    {
      checkout();
    }
    else if (action === "leave")
    {
      drafts.clear();
      errors.clear();
      closeDialog();
      if (cart)
      {
        renderCart();
      }
      leaveAction?.();
      leaveAction = null;
    }
    else if (action === "product" && item?.configurationDraft)
    {
      saveContext();
      window.location.assign("/pages/customer/bouquet-customizer.html?edit=" + encodeURIComponent(item.lineId));
    }
    else if (["shop", "home", "product", "auth", "orders"].includes(action))
    {
      const navigate = () =>
      {
        if (action === "orders")
        {
          window.location.assign("/pages/customer/my-orders.html");
        }
        else
        {
          showDestination({ shop: "Katalog Produk", home: "Beranda", product: "Detail Produk", auth: "Masuk ke Akun" }[action]);
        }
      };
      saveContext();
      if (drafts.size)
      {
        requestLeave(navigate);
      }
      else
      {
        navigate();
      }
    }
  });

  root.addEventListener("change", (event) =>
  {
    if (pending || stale || uncertain)
    {
      return;
    }
    if (event.target.id === "cart-select-all")
    {
      cart.items.filter((item) => !itemProblem(item)).forEach((item) =>
      {
        if (event.target.checked)
        {
          selected.add(item.lineId);
        }
        else
        {
          selected.delete(item.lineId);
        }
      });
    }
    else if (event.target.dataset.cartSelect)
    {
      const lineId = event.target.dataset.cartSelect;
      if (event.target.checked)
      {
        selected.add(lineId);
      }
      else
      {
        selected.delete(lineId);
      }
    }
    else
    {
      return;
    }
    renderSummary();
    saveContext();
    announce(selectedItems().length + " jenis produk dipilih. Total diperbarui.");
  });

  root.addEventListener("input", (event) =>
  {
    const lineId = event.target.dataset.cartQuantity;
    if (!lineId)
    {
      return;
    }
    drafts.set(lineId, event.target.value);
    renderSummary();
  });

  root.addEventListener("focusout", (event) =>
  {
    const lineId = event.target.dataset.cartQuantity;
    const nextAction = event.relatedTarget?.closest("[data-cart-action]");
    if (lineId && drafts.has(lineId) && !dialog.open && !nextAction)
    {
      changeQuantity(lineId, drafts.get(lineId), event.relatedTarget?.id || null);
    }
  });

  root.addEventListener("keydown", (event) =>
  {
    const lineId = event.target.dataset.cartQuantity;
    if (lineId && event.key === "Enter")
    {
      event.preventDefault();
      changeQuantity(lineId, event.target.value, event.target.id);
    }
    if (lineId && event.key === "Escape")
    {
      drafts.delete(lineId);
      errors.delete(lineId);
      renderCart(event.target.id);
    }
  });

  root.addEventListener("error", (event) =>
  {
    const lineId = event.target.dataset.cartImage;
    if (lineId)
    {
      failedImages.add(lineId);
      const fallback = document.createElement("span");
      fallback.className = "cart-photo-fallback";
      fallback.textContent = "Foto belum tersedia";
      event.target.replaceWith(fallback);
    }
  }, true);

  dialog.addEventListener("cancel", (event) =>
  {
    event.preventDefault();
    closeDialog();
  });

  window.addEventListener("beforeunload", (event) =>
  {
    saveContext();
    if ((drafts.size || pending) && !bypassLeave)
    {
      event.preventDefault();
      event.returnValue = "";
    }
  });

  window.addEventListener("pagehide", saveContext);
  window.addEventListener("pageshow", (event) =>
  {
    if (event.persisted && cart)
    {
      loadCart(true);
    }
  });
  window.addEventListener("storage", (event) =>
  {
    if (event.key === repository.guestKey && cart?.mode === "guest" && repository.scenario === "normal")
    {
      stale = true;
      setNotice("Keranjang berubah di tab lain. Muat keranjang terbaru; masukan Anda tetap dipertahankan.", "warning", "recover");
      renderCart();
    }
  });

  window.addEventListener("offline", () =>
  {
    stale = true;
    setNotice("Koneksi terputus. Isi terakhir tetap terlihat. Sambungkan kembali, lalu muat keranjang terbaru.", "warning", "recover");
    if (cart)
    {
      renderCart();
    }
  });

  window.addEventListener("online", () =>
  {
    setNotice("Koneksi kembali tersedia. Periksa keranjang terbaru sebelum melanjutkan.", "info", "recover");
  });

  readContext();
  loadCart();
})();
