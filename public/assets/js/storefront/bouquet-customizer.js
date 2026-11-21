"use strict";

(() =>
{
  const data = window.RylvaBouquetPreviewData;
  const repository = window.RylvaBouquetAdapter || window.RylvaBouquetPreviewRepository;
  const root = document.getElementById("bouquet-content");
  const dialog = document.getElementById("home-dialog");
  const dialogTitle = document.getElementById("home-dialog-title");
  const dialogBody = document.getElementById("home-dialog-body");
  const { escapeHtml, money } = window.RylvaProductCard;
  let model = null;
  let draft = null;
  let baseline = "";
  let groupId = "flowers";
  let filter = "";
  let quote = null;
  let quoteVersion = 0;
  let quotePending = false;
  let pending = false;
  let saved = false;
  let bypassLeave = false;
  let requestId = null;
  let uncertain = false;
  let priceChange = null;
  let dialogAction = null;
  let opener = null;
  let barObserver = null;
  let selectionObserver = null;
  let imageFailed = repository.scenario === "brokenImage";
  let compositionLoading = true;
  let imageRecoveryPending = false;
  let compositionImages = null;
  const spriteUrl = "/assets/images/bouquet/components.png";
  const header = window.RylvaHomepageHeader.init(
  {
    readCart: () => repository.workbench
      ? Promise.resolve(model?.cart || { items: [], revision: 0, mode: "account", limits: { perProduct: 20, perOrder: 50 } })
      : window.RylvaCartPreviewRepository.load(),
    removeItem: async (lineId) =>
    {
      if (repository.workbench)
      {
        return { ...model.cart, items: model.cart.items.filter((item) => item.lineId !== lineId) };
      }
      const cart = await window.RylvaCartPreviewRepository.load();
      return window.RylvaCartPreviewRepository.mutate(lineId, null, cart.revision);
    },
    onCartChange: (cart) =>
    {
      updateCount(cart);
      if (model)
      {
        model.cart = cart;
      }
    },
    openDetail: (slug) =>
    {
      const depart = () =>
      {
        bypassLeave = true;
        window.RylvaProductNavigation.open(slug);
      };
      if (dirty())
      {
        confirmLeave(depart);
      }
      else
      {
        depart();
      }
    },
    openSaved: () => location.assign("/pages/customer/wishlist.html"),
    browseCollection: () => location.assign("/pages/public/catalog.html")
  });

  function updateCount(cart)
  {
    const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll(".storefront-cart-count").forEach((element) =>
    {
      element.textContent = count;
    });
  }

  function dirty()
  {
    return draft && !saved && JSON.stringify(draft) !== baseline;
  }

  function action(name, label, secondary = false)
  {
    return '<button type="button" class="bq-button' + (secondary ? ' bq-secondary' : '')
      + '" data-bq-action="' + name + '">' + label + '</button>';
  }

  function showDialog(title, body, callback = null)
  {
    opener = document.activeElement;
    dialogAction = callback;
    dialogTitle.textContent = title;
    dialogBody.innerHTML = body;
    dialog.showModal();
    dialog.querySelector("button")?.focus();
  }

  dialog.addEventListener("close", () =>
  {
    opener?.isConnected && opener.focus({ preventScroll: true });
    dialogAction = null;
  });

  function confirmLeave(callback)
  {
    if (!dirty())
    {
      callback();
      return;
    }
    showDialog("Tinggalkan rakitan?", '<p>Perubahan ini belum ditambahkan ke keranjang. Tetap di sini untuk melanjutkan.</p>'
      + '<div class="bq-dialog-actions">' + action("close", "Tetap meracik", true)
      + action("confirm", "Buang perubahan") + "</div>", callback);
  }

  function state(title, description, code)
  {
    root.setAttribute("aria-busy", "false");
    const access = ["guest", "session", "verification"].includes(code);
    const login = new URL("/pages/auth/customer-login.html", location.origin);
    login.searchParams.set("returnTo", location.pathname + location.search);
    root.innerHTML = '<section class="bq-state" aria-labelledby="bouquet-state-title">'
      + '<h1 id="bouquet-state-title">' + title + '</h1><p>' + escapeHtml(description) + '</p>'
      + '<div class="bq-dialog-actions">'
      + (access ? '<a class="bq-button" href="' + escapeHtml(login.pathname + login.search) + '">Masuk untuk meracik</a>'
        : ["notFound", "removed", "unavailable", "denied"].includes(code) ? "" : action("load", "Coba lagi"))
      + '<a class="bq-button bq-secondary" href="/pages/public/catalog.html">Kembali ke Katalog</a></div></section>';
  }

  function sprite(option, className = "")
  {
    return '<span class="bq-sprite bq-sprite-' + option.visual + " " + className + '" aria-hidden="true"></span>';
  }

  function renderEditor()
  {
    root.setAttribute("aria-busy", "false");
    root.innerHTML = `
      <div class="bq-heading">
        <div>
          <h1>${model.editLineId ? "Ubah rakitan buket" : "Racik buket Anda"}</h1>
          <p>Pilih bunganya, lengkapi dengan sentuhan Anda.</p>
        </div>
        <div class="bq-heading-actions">
          ${model.editLineId ? '<a class="bq-text-button" href="/pages/customer/cart.html">Batal & kembali ke Keranjang</a>' : ""}
          <button class="bq-text-button" type="button" data-bq-action="reset">Reset rakitan</button>
        </div>
      </div>
      <div class="bq-layout">
        <nav class="bq-categories" aria-label="Kategori pilihan buket" id="bouquet-categories"></nav>
        <div class="bq-center">
          <section class="bq-preview" aria-labelledby="bouquet-preview-title">
            <div class="bq-section-heading">
              <h2 id="bouquet-preview-title">Pratinjau buket</h2>
              <button type="button" class="bq-text-button" data-bq-action="zoom">Perbesar</button>
            </div>
            <div class="bq-stage" id="bouquet-stage" role="img" aria-label="Belum ada bunga dipilih"></div>
            <p class="bq-caption" id="bouquet-preview-caption">Susunan ilustratif otomatis. Hasil rangkaian florist dapat berbeda.</p>
          </section>
          <section class="bq-selected" aria-labelledby="bouquet-selected-title">
            <div class="bq-section-heading">
              <h2 id="bouquet-selected-title">Pilihan Anda</h2>
              <div class="bq-selected-tools">
                <span class="bq-caption" id="bouquet-selected-count"></span>
                <div class="bq-carousel-controls" id="bouquet-selected-controls" hidden>
                  <button type="button" data-bq-action="selected-previous" aria-controls="bouquet-selected-list" aria-label="Geser pilihan sebelumnya">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                      <path d="m14 6-6 6 6 6"></path>
                    </svg>
                  </button>
                  <button type="button" data-bq-action="selected-next" aria-controls="bouquet-selected-list" aria-label="Geser pilihan berikutnya">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                      <path d="m10 6 6 6-6 6"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div id="bouquet-selected"></div>
          </section>
          <details class="bq-notes" id="bouquet-notes">
            <summary>Pesan kartu &amp; catatan <span>Opsional</span></summary>
            <div class="bq-note-fields">
              ${noteField("label", "Nama rakitan", false, "Untuk memudahkan Anda mengenali buket ini.")}
              ${noteField("theme", "Tema atau acara", false, "Contoh: wisuda atau ulang tahun.")}
              ${noteField("message", "Pesan kartu", true, "Satu pesan untuk setiap buket dalam rakitan ini.")}
              ${noteField("sender", "Nama pengirim", false, "Kosongkan bila tidak ingin dicantumkan.")}
              ${noteField("note", "Catatan untuk florist", true, "Ketersediaan bahan mengikuti pilihan yang tersedia.")}
            </div>
          </details>
        </div>
        <aside class="bq-options-panel" aria-label="Pilihan dan harga buket">
          <div class="bq-options-body">
            <div class="bq-section-heading">
              <h2 id="bouquet-group-title"></h2>
              <span class="bq-tag" id="bouquet-required"></span>
            </div>
            <p class="bq-caption" id="bouquet-group-help"></p>
            <label class="bq-search" for="bouquet-filter">
              <span>Cari pilihan</span>
              <input type="search" id="bouquet-filter" placeholder="Cari bunga atau bahan…" autocomplete="off">
            </label>
            <div id="bouquet-options"></div>
            <div class="bq-group-navigation">
              <button class="bq-text-button" type="button" data-bq-action="previous-group">Sebelumnya</button>
              <button class="bq-text-button" type="button" data-bq-action="next-group">Berikutnya</button>
            </div>
          </div>
          <section class="bq-pricing" aria-labelledby="bouquet-price-title">
            <h2 id="bouquet-price-title">Ringkasan harga</h2>
            <details class="bq-price-details">
              <summary>Rincian harga per buket</summary>
              <dl id="bouquet-breakdown"></dl>
            </details>
            <div class="bq-quantity-line">
              <label for="bouquet-quantity">Jumlah buket</label>
              <div class="bq-stepper">
                <button type="button" data-bq-action="less-bouquets" aria-label="Kurangi jumlah buket">−</button>
                <input type="number" id="bouquet-quantity" min="1" max="20" step="1" value="${draft.quantity}" inputmode="numeric">
                <button type="button" data-bq-action="more-bouquets" aria-label="Tambah jumlah buket">+</button>
              </div>
            </div>
            <p class="bq-caption">Maksimal 20 buket per produk. Belum termasuk ongkir.</p>
            <div id="bouquet-validation" class="bq-validation" role="status"></div>
            <div class="bq-purchase-bar" id="bouquet-purchase-bar">
              <div class="bq-total">
                <span>Subtotal</span>
                <strong id="bouquet-subtotal" role="status" aria-live="polite" aria-atomic="true">Menghitung…</strong>
              </div>
              <button class="bq-button" type="button" id="bouquet-submit" data-bq-action="save" disabled>
                ${model.editLineId ? "Simpan perubahan" : "Tambah ke Keranjang"}
              </button>
            </div>
            <div class="bq-feedback" id="bouquet-feedback" role="status" tabindex="-1"></div>
          </section>
        </aside>
      </div>`;
    renderCategories();
    renderOptions();
    renderSelection();
    renderPreview();
    updateQuote();
    barObserver?.disconnect();
    barObserver = new ResizeObserver(() =>
    {
      const bar = document.getElementById("bouquet-purchase-bar");
      document.body.style.setProperty("--bouquet-bar-height", Math.ceil(bar.getBoundingClientRect().height) + "px");
    });
    barObserver.observe(document.getElementById("bouquet-purchase-bar"));
    if (repository.scenario === "noResults")
    {
      filter = "Anggrek tidak tersedia";
      document.getElementById("bouquet-filter").value = filter;
      renderOptions();
    }
    if (repository.scenario === "success")
    {
      finish({ merged: false, cart: model.cart });
    }
  }

  function noteField(key, label, multiline, help)
  {
    const id = "bouquet-" + key;
    const attributes = ' id="' + id + '" data-bq-field="' + key + '" aria-describedby="' + id + '-help ' + id + '-count"';
    return '<div class="bq-field"><label for="' + id + '">' + label + '</label>'
      + (multiline ? "<textarea" + attributes + ' rows="3">' + escapeHtml(draft[key]) + "</textarea>"
        : '<input type="text"' + attributes + ' value="' + escapeHtml(draft[key]) + '">')
      + '<div class="bq-field-help"><small id="' + id + '-help">' + help + '</small><small id="' + id
      + '-count">' + Array.from(draft[key]).length + "/" + data.fields[key] + "</small></div></div>";
  }

  function renderCategories()
  {
    document.getElementById("bouquet-categories").innerHTML = model.groups.map((group) =>
    {
      const selected = model.options.filter((option) => option.groupId === group.id && draft.selections[option.id]).length;
      const name = group.id === "foliage" ? "Pendamping" : group.name;
      return `
        <button type="button" class="bq-category" data-bq-group="${group.id}" aria-pressed="${groupId === group.id}">
          <span class="bq-category-icon" aria-hidden="true">
            <span class="bq-category-glyph" style="--category-icon: url('/assets/images/bouquet/${group.icon}.svg')"></span>
          </span>
          <span>
            ${escapeHtml(name)}
            <small>${group.required ? "Wajib" : "Opsional"} · ${selected} dipilih</small>
          </span>
        </button>`;
    }).join("");
  }

  function renderOptions()
  {
    const group = model.groups.find((candidate) => candidate.id === groupId);
    document.getElementById("bouquet-group-title").textContent = group.name;
    document.getElementById("bouquet-required").textContent = group.required ? "Wajib" : "Opsional";
    document.getElementById("bouquet-group-help").textContent = "Pilih "
      + (group.min === group.max ? group.min : group.min + "–" + group.max) + " jenis. Jumlah paket dihitung per buket.";
    const options = model.options.filter((option) => option.groupId === groupId);
    const matches = options.filter((option) => (option.name + " " + option.pack).toLowerCase().includes(filter.toLowerCase().trim()));
    const count = options.filter((option) => draft.selections[option.id]).length;
    document.getElementById("bouquet-options").innerHTML = matches.length ? matches.map((option) =>
    {
      const quantity = draft.selections[option.id] || 0;
      const disabled = !option.available || (!quantity && group.mode === "many" && count >= group.max);
      return `
        <div class="bq-option ${quantity ? "is-selected" : ""}">
          <label class="bq-option-choice">
            <input type="${group.mode === "one" ? "radio" : "checkbox"}" name="bq-${groupId}"
              data-bq-option="${option.id}" ${quantity ? "checked" : ""} ${disabled || pending || saved || uncertain ? "disabled" : ""}>
            ${imageFailed ? "" : sprite(option, "bq-option-image")}
            <span>
              <strong>${escapeHtml(option.name)}</strong>
              <small>${escapeHtml(option.pack)}</small>
              <span class="bq-option-price">+${money(option.price)}${!option.available ? " · Tidak tersedia" : ""}</span>
            </span>
          </label>
          ${quantity ? `
            <div class="bq-option-bottom">
              <span>Jumlah paket</span>
              <div class="bq-stepper">
                <button type="button" data-bq-option-step="${option.id}" data-step="-1"
                  aria-label="Kurangi paket ${escapeHtml(option.name)}" ${quantity <= 1 || pending || saved || uncertain ? "disabled" : ""}>−</button>
                <output aria-label="Jumlah paket ${escapeHtml(option.name)}">${quantity}</output>
                <button type="button" data-bq-option-step="${option.id}" data-step="1"
                  aria-label="Tambah paket ${escapeHtml(option.name)}" ${quantity >= option.max || pending || saved || uncertain ? "disabled" : ""}>+</button>
              </div>
            </div>` : ""}
        </div>`;
    }).join("") : '<div class="bq-empty"><p>' + (options.length ? "Tidak ada pilihan yang cocok." : "Pilihan kategori ini belum tersedia.")
      + '</p>' + (filter ? action("reset-filter", "Reset pencarian", true) : action("next-group", "Lihat kategori lain", true)) + "</div>";
    const index = model.groups.indexOf(group);
    root.querySelector('[data-bq-action="previous-group"]').disabled = index === 0;
    root.querySelector('[data-bq-action="next-group"]').disabled = index === model.groups.length - 1;
  }

  function updateSelectionNavigation()
  {
    const list = document.getElementById("bouquet-selected-list");
    const controls = document.getElementById("bouquet-selected-controls");
    const overflow = list && list.scrollWidth > list.clientWidth + 2;
    controls.hidden = !overflow;
    if (!list)
    {
      return;
    }
    controls.querySelector('[data-bq-action="selected-previous"]').disabled = list.scrollLeft <= 2;
    controls.querySelector('[data-bq-action="selected-next"]').disabled = list.scrollLeft + list.clientWidth >= list.scrollWidth - 2;
  }

  function renderSelection()
  {
    const selected = data.options.filter((option) => draft.selections[option.id]);
    const previousScroll = document.getElementById("bouquet-selected-list")?.scrollLeft || 0;
    document.getElementById("bouquet-selected-count").textContent = selected.length + " jenis dipilih";
    document.getElementById("bouquet-selected").innerHTML = selected.length ? `
      <ul class="bq-selected-list" id="bouquet-selected-list" tabindex="0" aria-label="Pilihan buket, geser untuk melihat semua komponen">
        ${selected.map((option) => `
          <li>
            ${imageFailed ? "" : sprite(option, "bq-selected-image")}
            <div class="bq-selected-copy">
              <button type="button" class="bq-selected-edit" data-bq-edit-group="${option.groupId}"
                title="${escapeHtml(option.name)}" aria-label="Ubah ${escapeHtml(option.name)}">${escapeHtml(option.name)}</button>
              <p>${draft.selections[option.id]} × ${escapeHtml(option.pack)}</p>
              <strong>${money(option.price * draft.selections[option.id])}</strong>
            </div>
            <button type="button" class="bq-remove" data-bq-remove="${option.id}"
              aria-label="Hapus ${escapeHtml(option.name)}" ${pending || saved || uncertain ? "disabled" : ""}>
              <img src="/assets/images/bouquet/remove.svg" width="11" height="11" alt="">
            </button>
          </li>`).join("")}
      </ul>` : '<p class="bq-empty-copy">Mulai dengan bunga utama. Pilihan Anda akan tersusun di sini.</p>';
    selectionObserver?.disconnect();
    const list = document.getElementById("bouquet-selected-list");
    if (list)
    {
      list.scrollLeft = previousScroll;
      list.addEventListener("scroll", updateSelectionNavigation, { passive: true });
      selectionObserver = new ResizeObserver(updateSelectionNavigation);
      selectionObserver.observe(list);
    }
    updateSelectionNavigation();
  }

  function renderPreview()
  {
    const stage = document.getElementById("bouquet-stage");
    const selected = data.options.filter((option) => draft.selections[option.id]);
    const description = selected.map((option) => option.name + " " + draft.selections[option.id] + " paket").join(", ");
    stage.setAttribute("aria-label", description ? "Ilustrasi rakitan: " + description : "Belum ada bunga dipilih");
    stage.setAttribute("role", imageFailed || !model.previewAvailable ? "group" : "img");
    stage.setAttribute("aria-busy", String(compositionLoading));
    if (imageFailed || !model.previewAvailable)
    {
      stage.innerHTML = '<div class="bq-preview-fallback"><strong>Pratinjau gambar belum tersedia</strong><p>'
        + escapeHtml(description || "Pilih bunga untuk mulai meracik.") + '</p><p>Ringkasan pilihan dan harga tetap dapat digunakan.</p>'
        + action("retry-image", "Coba muat gambar", true) + "</div>";
      return;
    }
    if (compositionLoading)
    {
      stage.innerHTML = '<p class="bq-caption" role="status">Menyiapkan pratinjau rangkaian…</p>';
      return;
    }
    if (!selected.length)
    {
      stage.innerHTML = '<div class="bq-preview-empty"><span class="bq-category-glyph" style="--category-icon:url(/assets/images/bouquet/flower.svg)" aria-hidden="true"></span>'
        + "<strong>Buket Anda dimulai dari sini</strong><p>Pilih bunga utama, lalu pembungkus dan pita favorit Anda.</p></div>";
      return;
    }
    stage.innerHTML = window.RylvaBouquetComposition.render(data.options, draft.selections, sprite);
  }

  function renderPrice()
  {
    if (!draft)
    {
      return;
    }
    document.getElementById("bouquet-breakdown").innerHTML = '<div><dt>Harga dasar contoh</dt><dd>' + money(0) + "</dd></div>"
      + data.options.filter((option) => draft.selections[option.id]).map((option) =>
        '<div><dt>' + escapeHtml(option.name) + " × " + draft.selections[option.id] + "</dt><dd>"
        + money(option.price * draft.selections[option.id]) + "</dd></div>").join("")
      + (quote && quote.unitPrice !== data.price(draft)
        ? '<div><dt>Penyesuaian harga</dt><dd>' + money(quote.unitPrice - data.price(draft)) + '</dd></div>' : "")
      + '<div class="bq-unit-price"><dt>Harga per buket</dt><dd>' + (quote ? money(quote.unitPrice) : "Belum tersedia") + "</dd></div>";
    document.getElementById("bouquet-subtotal").textContent = quotePending ? "Menghitung…" : quote ? money(quote.subtotal) : "Belum tersedia";
    const errors = data.validate(draft);
    document.getElementById("bouquet-validation").textContent = errors.length ? errors.join(" ") : "";
    const submit = document.getElementById("bouquet-submit");
    submit.disabled = pending || saved || quotePending || !quote || errors.length > 0 || uncertain;
    submit.textContent = pending ? "Menyimpan…" : saved ? "Tersimpan di Keranjang" : model.editLineId ? "Simpan perubahan" : "Tambah ke Keranjang";
    root.querySelector('[data-bq-action="less-bouquets"]').disabled = pending || saved || draft.quantity <= 1;
    root.querySelector('[data-bq-action="more-bouquets"]').disabled = pending || saved || draft.quantity >= 20;
    document.getElementById("bouquet-quantity").disabled = pending || saved || uncertain;
    root.querySelectorAll("[data-bq-field]").forEach((field) =>
    {
      field.disabled = pending || saved || uncertain;
    });
    root.querySelector('[data-bq-action="reset"]').disabled = pending || saved;
  }

  function feedback(message, actions = "", alert = false)
  {
    const element = document.getElementById("bouquet-feedback");
    element.setAttribute("role", alert ? "alert" : "status");
    element.innerHTML = '<p>' + escapeHtml(message) + "</p>" + (actions ? '<div class="bq-feedback-actions">' + actions + "</div>" : "");
  }

  async function updateQuote()
  {
    const version = ++quoteVersion;
    const current = structuredClone(draft);
    quote = null;
    quotePending = true;
    renderPrice();
    try
    {
      const result = await repository.quote(current);
      if (version !== quoteVersion)
      {
        return;
      }
      if (!Number.isSafeInteger(result.unitPrice) || result.unitPrice < 0
        || !Number.isSafeInteger(result.subtotal) || result.subtotal < 0)
      {
        throw new Error("Harga belum valid. Hitung ulang sebelum menambahkan.");
      }
      quote = result;
    }
    catch (error)
    {
      if (version !== quoteVersion)
      {
        return;
      }
      feedback(error.message, action("quote", "Hitung ulang", true), true);
    }
    finally
    {
      if (version === quoteVersion)
      {
        quotePending = false;
        renderPrice();
      }
    }
  }

  function changed()
  {
    requestId = null;
    priceChange = null;
    saved = false;
    renderCategories();
    renderOptions();
    renderSelection();
    renderPreview();
    feedback("");
    updateQuote();
  }

  function finish(result)
  {
    uncertain = false;
    saved = true;
    pending = false;
    baseline = JSON.stringify(draft);
    if (result.cart)
    {
      model.cart = result.cart;
      updateCount(result.cart);
    }
    feedback((result.merged ? "Rakitan yang sama digabung" : model.editLineId ? "Perubahan rakitan tersimpan" : "Rakitan ditambahkan")
      + " ke keranjang contoh. " + (repository.workbench ? "Workbench ini tidak mengubah keranjang biasa." : ""),
      (repository.workbench ? "" : '<a class="bq-button" href="/pages/customer/cart.html">Lihat Keranjang</a>')
      + action("continue", "Racik buket lain", true));
    renderOptions();
    renderSelection();
    renderPrice();
    document.getElementById("bouquet-feedback").focus();
  }

  async function save(acceptPriceChange = false)
  {
    if (pending || saved || uncertain || !quote || data.validate(draft).length)
    {
      return;
    }
    requestId ||= crypto.randomUUID();
    pending = true;
    renderOptions();
    renderSelection();
    renderPrice();
    feedback("Menyimpan rakitan…");
    try
    {
      finish(await repository.save(structuredClone(draft), model.editLineId, model.editRevision, requestId, acceptPriceChange));
    }
    catch (error)
    {
      if (error.code === "priceChanged")
      {
        priceChange = error;
        quote = { unitPrice: error.newPrice, subtotal: error.newPrice * draft.quantity };
        feedback("Harga berubah. Tinjau dan setujui harga terbaru sebelum menyimpan.");
        showDialog("Harga rakitan berubah", "<p>Harga per buket berubah dari <del>" + money(error.oldPrice)
          + "</del> menjadi <strong>" + money(error.newPrice) + "</strong>.</p><p>Tinjau perubahan ini sebelum melanjutkan.</p>"
          + '<div class="bq-dialog-actions">' + action("close", "Tinjau kembali", true)
          + action("accept-price", "Setujui harga & simpan") + "</div>");
      }
      else if (error.code === "timeout")
      {
        uncertain = true;
        feedback(error.message, action("reconcile", "Periksa hasil", true), true);
      }
      else if (error.code === "session")
      {
        const target = new URL("/pages/auth/customer-login.html", location.origin);
        target.searchParams.set("returnTo", location.pathname);
        let recoveryNote = " Pilihan Anda tetap ada di tab ini.";
        try
        {
          const recoveryId = crypto.randomUUID();
          sessionStorage.setItem("rylva-bouquet-recovery-" + recoveryId, JSON.stringify(
          {
            owner: "customer-example", expiresAt: Date.now() + 30 * 60000,
            draft, editLineId: model.editLineId, editRevision: model.editRevision
          }));
          target.searchParams.set("returnTo", location.pathname + "?recovery=" + recoveryId);
          recoveryNote = " Pilihan akan dipulihkan setelah kembali dari masuk di tab ini.";
        }
        catch
        {
          recoveryNote = " Penyimpanan tab tidak tersedia. Salin catatan Anda sebelum masuk kembali.";
        }
        feedback(error.message + recoveryNote,
          '<a class="bq-button bq-secondary" href="' + escapeHtml(target.pathname + target.search) + '">Masuk kembali</a>', true);
      }
      else
      {
        const recovery = ["conflict", "removed"].includes(error.code)
          ? action("refresh-cart", "Perbarui keranjang", true) + action("as-new", "Tambahkan sebagai rakitan baru", true)
          : action("retry-save", "Coba lagi", true);
        feedback(error.message, recovery, true);
        if (error.retryAt)
        {
          const retry = root.querySelector('[data-bq-action="retry-save"]');
          retry.disabled = true;
          setTimeout(() =>
          {
            if (retry.isConnected)
            {
              retry.disabled = false;
            }
          }, Math.max(0, error.retryAt - Date.now()));
        }
      }
    }
    finally
    {
      pending = false;
      renderOptions();
      renderSelection();
      renderPrice();
    }
  }

  async function load()
  {
    root.setAttribute("aria-busy", "true");
    root.innerHTML = '<div class="bq-loading" role="status">Memuat pilihan buket…</div>';
    try
    {
      model = await repository.load();
      draft = model.draft;
      const recoveryId = new URLSearchParams(location.search).get("recovery");
      if (recoveryId && /^[a-f0-9-]{36}$/.test(recoveryId))
      {
        try
        {
          const key = "rylva-bouquet-recovery-" + recoveryId;
          const stored = JSON.parse(sessionStorage.getItem(key));
          if (stored?.owner === "customer-example" && stored.expiresAt > Date.now()
            && !data.validate(stored.draft, false).length)
          {
            draft = stored.draft;
            model.editLineId = stored.editLineId;
            model.editRevision = stored.editRevision;
          }
          sessionStorage.removeItem(key);
        }
        catch
        {
          // The editor still opens with its valid initial draft.
        }
      }
      baseline = JSON.stringify(model.draft);
      updateCount(model.cart);
      renderEditor();
      loadCompositionImages();
    }
    catch (error)
    {
      const titles = { guest: "Masuk untuk meracik buket", session: "Sesi Anda berakhir", denied: "Akses tidak diizinkan",
        verification: "Verifikasi akun Anda", notFound: "Buket tidak ditemukan", unavailable: "Buket belum tersedia", removed: "Rakitan tidak ditemukan" };
      state(titles[error.code] || "Pilihan buket belum dapat dimuat", error.message, error.code);
    }
  }

  function goGroup(nextId)
  {
    groupId = nextId;
    filter = "";
    document.getElementById("bouquet-filter").value = "";
    renderCategories();
    renderOptions();
    document.getElementById("bouquet-options").scrollTop = 0;
    const heading = document.getElementById("bouquet-group-title");
    const position = heading.getBoundingClientRect();
    if (position.top < 16 || position.top > innerHeight - 160)
    {
      heading.tabIndex = -1;
      heading.scrollIntoView({ block: "start", behavior: "auto" });
      heading.focus({ preventScroll: true });
    }
    else
    {
      root.querySelector('[data-bq-group="' + groupId + '"]')?.focus({ preventScroll: true });
    }
  }

  root.addEventListener("change", (event) =>
  {
    const id = event.target.dataset.bqOption;
    if (!id || pending || saved || uncertain)
    {
      return;
    }
    const option = model.options.find((candidate) => candidate.id === id);
    const group = model.groups.find((candidate) => candidate.id === option.groupId);
    if (group.mode === "one")
    {
      model.options.filter((candidate) => candidate.groupId === group.id).forEach((candidate) => delete draft.selections[candidate.id]);
    }
    if (event.target.checked)
    {
      draft.selections[id] = 1;
    }
    else
    {
      delete draft.selections[id];
    }
    changed();
    root.querySelector('[data-bq-option="' + id + '"]')?.focus({ preventScroll: true });
  });

  root.addEventListener("input", (event) =>
  {
    const target = event.target;
    if (target.id === "bouquet-filter")
    {
      filter = target.value;
      renderOptions();
    }
    else if (target.id === "bouquet-quantity" && !pending && !saved && !uncertain)
    {
      draft.quantity = Number(target.value);
      requestId = null;
      priceChange = null;
      updateQuote();
    }
    else if (target.dataset.bqField && !pending && !saved && !uncertain)
    {
      const key = target.dataset.bqField;
      draft[key] = target.value;
      requestId = null;
      priceChange = null;
      const length = Array.from(target.value).length;
      target.setAttribute("aria-invalid", String(length > data.fields[key]));
      document.getElementById(target.id + "-count").textContent = length + "/" + data.fields[key];
      renderPrice();
    }
  });

  document.addEventListener("click", (event) =>
  {
    if (event.target.closest("[data-home-close]"))
    {
      dialog.close();
    }
  });

  document.addEventListener("click", async (event) =>
  {
    const target = event.target.closest("[data-bq-action], [data-bq-group], [data-bq-remove], [data-bq-edit-group], [data-bq-option-step]");
    if (!target || target.disabled)
    {
      return;
    }
    if ((pending || uncertain) && !["reconcile", "close"].includes(target.dataset.bqAction))
    {
      return;
    }
    const actionName = target.dataset.bqAction;
    if (target.dataset.bqGroup || target.dataset.bqEditGroup)
    {
      goGroup(target.dataset.bqGroup || target.dataset.bqEditGroup);
      if (target.dataset.bqEditGroup)
      {
        document.getElementById("bouquet-filter").focus();
      }
    }
    else if (target.dataset.bqRemove && !saved)
    {
      const id = target.dataset.bqRemove;
      delete draft.selections[id];
      changed();
      document.getElementById("bouquet-selected-title").tabIndex = -1;
      document.getElementById("bouquet-selected-title").focus({ preventScroll: true });
    }
    else if (target.dataset.bqOptionStep && !saved)
    {
      const option = data.options.find((candidate) => candidate.id === target.dataset.bqOptionStep);
      draft.selections[option.id] = Math.max(1, Math.min(option.max, draft.selections[option.id] + Number(target.dataset.step)));
      changed();
      root.querySelector('[data-bq-option-step="' + option.id + '"][data-step="' + target.dataset.step + '"]')?.focus({ preventScroll: true });
    }
    else if (["selected-previous", "selected-next"].includes(actionName))
    {
      const list = document.getElementById("bouquet-selected-list");
      list.scrollBy(
      {
        left: (list.clientWidth + 12) * (actionName === "selected-next" ? 1 : -1),
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
      });
    }
    else if (actionName === "close")
    {
      dialog.close();
    }
    else if (actionName === "confirm")
    {
      const callback = dialogAction;
      dialog.close();
      callback?.();
    }
    else if (actionName === "load")
    {
      repository.recover();
      load();
    }
    else if (["next-group", "previous-group"].includes(actionName))
    {
      const index = model.groups.findIndex((group) => group.id === groupId);
      const next = model.groups[index + (actionName === "next-group" ? 1 : -1)];
      if (next)
      {
        goGroup(next.id);
        document.getElementById("bouquet-filter").focus({ preventScroll: true });
      }
    }
    else if (actionName === "reset-filter")
    {
      filter = "";
      document.getElementById("bouquet-filter").value = "";
      renderOptions();
      document.getElementById("bouquet-filter").focus();
    }
    else if (["more-bouquets", "less-bouquets"].includes(actionName))
    {
      draft.quantity = Math.max(1, Math.min(20, draft.quantity + (actionName === "more-bouquets" ? 1 : -1)));
      document.getElementById("bouquet-quantity").value = draft.quantity;
      requestId = null;
      updateQuote();
    }
    else if (actionName === "reset")
    {
      confirmLeave(() =>
      {
        draft = data.emptyDraft();
        renderEditor();
      });
    }
    else if (actionName === "continue")
    {
      model.editLineId = null;
      model.editRevision = null;
      requestId = null;
      saved = false;
      draft = data.emptyDraft();
      baseline = JSON.stringify(draft);
      history.replaceState(null, "", location.pathname + (repository.workbench ? "?preview=bouquet&state=normal" : ""));
      renderEditor();
    }
    else if (actionName === "zoom")
    {
      showDialog("Pratinjau rakitan", '<div class="bq-stage bq-zoom-stage">' + document.getElementById("bouquet-stage").innerHTML
        + "</div><p>Susunan ilustratif otomatis; hasil rangkaian florist dapat berbeda.</p>");
    }
    else if (actionName === "retry-image")
    {
      if (imageRecoveryPending)
      {
        return;
      }
      imageRecoveryPending = true;
      document.querySelector('[data-bq-action="retry-image"]')?.setAttribute("disabled", "");
      try
      {
        await loadCompositionImages(true);
      }
      finally
      {
        imageRecoveryPending = false;
      }
    }
    else if (actionName === "quote")
    {
      repository.recover();
      feedback("");
      updateQuote();
    }
    else if (["save", "retry-save"].includes(actionName))
    {
      save();
    }
    else if (actionName === "accept-price")
    {
      dialog.close();
      if (priceChange)
      {
        save(true);
      }
    }
    else if (actionName === "reconcile")
    {
      target.disabled = true;
      try
      {
        finish(await repository.reconcile(requestId));
      }
      catch (error)
      {
        uncertain = false;
        feedback(error.message, action("retry-save", "Coba lagi", true), true);
        renderPrice();
      }
    }
    else if (actionName === "refresh-cart")
    {
      try
      {
        model.cart = await repository.refreshCart();
        feedback("Keranjang terbaru dimuat. Pilihan Anda di halaman ini tetap ada. Tambahkan sebagai rakitan baru untuk mempertahankan versi di keranjang.",
          action("as-new", "Tambahkan sebagai rakitan baru", true));
      }
      catch (error)
      {
        feedback(error.message, action("refresh-cart", "Coba lagi", true), true);
      }
    }
    else if (actionName === "as-new")
    {
      model.editLineId = null;
      model.editRevision = null;
      requestId = null;
      repository.recover();
      try
      {
        await repository.refreshCart();
        save();
      }
      catch (error)
      {
        feedback(error.message, action("refresh-cart", "Coba lagi", true), true);
      }
    }
  });

  document.addEventListener("click", (event) =>
  {
    if (bypassLeave || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey
      || event.shiftKey || event.altKey || !dirty())
    {
      return;
    }
    const link = event.target.closest("a[href]");
    const navigation = event.target.closest("[data-storefront-page]");
    if (navigation?.hasAttribute("data-header-wishlist-trigger"))
    {
      return;
    }
    if (link && (link.hash && new URL(link.href, location.href).pathname === location.pathname || link.target === "_blank"))
    {
      return;
    }
    if (!link && !navigation)
    {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    confirmLeave(() =>
    {
      bypassLeave = true;
      if (link)
      {
        location.assign(link.href);
      }
      else
      {
        navigation.click();
      }
    });
  }, true);

  window.addEventListener("beforeunload", (event) =>
  {
    if (dirty() && !bypassLeave)
    {
      event.preventDefault();
      event.returnValue = "";
    }
  });

  async function loadCompositionImages(recover = false)
  {
    if (recover && compositionLoading && compositionImages)
    {
      await compositionImages;
    }
    if (compositionImages && !recover)
    {
      return compositionImages;
    }
    compositionLoading = true;
    document.querySelector('[data-bq-action="retry-image"]')?.setAttribute("disabled", "");
    const urls = [spriteUrl, ...window.RylvaBouquetComposition.assetUrls];
    compositionImages = Promise.all(urls.map((url) => new Promise((resolve, reject) =>
    {
      const image = new Image();
      image.onload = resolve;
      image.onerror = () => reject(new Error("Aset rangkaian belum dapat dimuat."));
      image.src = url;
    }))).then(() =>
    {
      if (recover)
      {
        imageFailed = false;
        model.previewAvailable = true;
        renderOptions();
        renderSelection();
      }
    }).catch(() =>
    {
      imageFailed = true;
    }).finally(() =>
    {
      compositionLoading = false;
      if (draft)
      {
        renderPreview();
      }
    });
    return compositionImages;
  }

  document.getElementById("storefront-search")?.addEventListener("submit", (event) =>
  {
    event.preventDefault();
    event.stopImmediatePropagation();
    const search = document.getElementById("storefront-search-input").value.trim();
    if (search)
    {
      confirmLeave(() =>
      {
        bypassLeave = true;
        location.assign("/pages/public/catalog.html?q=" + encodeURIComponent(search));
      });
    }
  }, true);
  load();
})();
