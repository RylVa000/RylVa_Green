"use strict";

(() =>
{
  const repository = window.RylvaCheckoutAdapter || window.RylvaCheckoutPreviewRepository;
  const root = document.getElementById("checkout-root");
  const notice = document.getElementById("checkout-notice");
  const announcement = document.getElementById("checkout-announcement");
  const dialog = document.getElementById("checkout-dialog");
  const dialogContent = document.getElementById("checkout-dialog-content");
  const dialogTitle = document.getElementById("checkout-dialog-title");
  const source = window.RylvaCheckoutPreviewData;
  const quantityDrafts = new Map();
  const fieldErrors = new Map();
  let context = null;
  let quote = null;
  let consent = false;
  let approvedPurchaseFingerprint = null;
  let quoteRevision = 0;
  let pendingQuote = false;
  let submitting = false;
  let uncertain = false;
  let intent = null;
  let order = null;
  let retryAt = 0;
  let dialogTrigger = null;
  let dialogKind = null;
  let confirmAction = null;
  let confirmCancel = null;
  let originalDraft = "";
  let bypassLeave = false;
  let addressDialog;

  function escapeHtml(value)
  {
    return String(value ?? "").replace(/[&<>"']/g, (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function money(value)
  {
    return Number.isSafeInteger(value) && value >= 0
      ? window.RylvaStorefrontFormat.money(value) : "Belum dihitung";
  }

  function icon(name)
  {
    return `<svg class="icon" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
  }

  function button(action, label, secondary = true, extra = "")
  {
    return `<button class="button ${secondary ? "button-secondary" : "button-primary"}" type="button"
      data-checkout-action="${action}" ${extra}>${label}</button>`;
  }

  function announce(message)
  {
    announcement.textContent = message;
  }

  function feedback(message, tone = "info", action = null)
  {
    notice.hidden = !message;
    notice.dataset.tone = tone;
    notice.innerHTML = message ? `
      <div>${icon(tone === "danger" || tone === "warning" ? "alert" : "help")}<p>${escapeHtml(message)}</p></div>
      ${action ? button(action, action === "inspect" ? "Periksa Hasil" : action === "orders" ? "Lihat Pesanan" : "Coba Lagi") : ""}
      ${action === "inspect" ? button("orders", "Pesanan Saya") : ""}` : "";
    announce(message || "Rincian diperbarui.");
  }

  function showDialog(title, html)
  {
    dialog.classList.toggle("checkout-payment-dialog", dialogKind === "methods");
    dialogTitle.textContent = title;
    dialogContent.innerHTML = html;
    if (!dialog.open)
    {
      dialogTrigger = document.activeElement;
      dialog.showModal();
      document.body.classList.add("checkout-modal-open");
    }
    dialog.scrollTop = 0;
    dialogTitle.focus();
  }

  function closeDialog()
  {
    addressDialog?.reset();
    dialog.close();
    dialog.classList.remove("checkout-payment-dialog");
    document.body.classList.remove("checkout-modal-open");
    dialogContent.replaceChildren();
    dialogKind = null;
    (dialogTrigger?.isConnected ? dialogTrigger : document.getElementById("checkout-title"))?.focus({ preventScroll: true });
  }

  function confirm(title, description, action, cancel = closeDialog)
  {
    dialogKind = "confirm";
    confirmAction = action;
    confirmCancel = cancel;
    showDialog(title, `
      <p>${escapeHtml(description)}</p>
      <div class="checkout-dialog-actions">
        ${button("confirm-cancel", "Tetap Mengedit")}
        ${button("confirm", "Lanjutkan", false)}
      </div>`);
  }

  function selectedAddress()
  {
    return context.addresses.find((address) => address.id === context.addressId);
  }

  function selectedService()
  {
    return availableServices().find((service) => service.id === context.serviceId);
  }

  function perishable()
  {
    return context.items.some((item) => item.handling === "perishable");
  }

  function availableServices()
  {
    return context.services.filter((service) => !perishable() || service.kind !== "regular");
  }

  function availableMethods()
  {
    return context.methods.filter((method) => (method.id !== "cod" || selectedService()?.cod)
      && (!method.providers || method.providers.some((provider) => provider.available !== false)));
  }

  function selectedProvider(method)
  {
    if (!method?.providers)
    {
      return null;
    }
    return method.id === context.method && context.paymentProviderId
      ? method.providers.find((provider) => provider.id === context.paymentProviderId && provider.available !== false)
      : method.providers.find((provider) => provider.available !== false);
  }

  function paymentLogo(provider)
  {
    return `<img class="checkout-payment-logo ${provider.inverseLogo ? "is-inverse" : ""}"
      src="../../assets/images/checkout/${escapeHtml(provider.image)}" alt="" width="64" height="24">`;
  }

  function paymentOption(method, provider, disabled)
  {
    const unavailable = disabled || provider.available === false;
    const selected = !unavailable && context.method === method.id
      && (!method.providers || selectedProvider(method)?.id === provider.id);
    const value = method.providers && provider.id !== method.providers[0]?.id
      ? method.id + ":" + provider.id : method.id;
    const description = unavailable
      ? provider.unavailableReason || (disabled ? "Tidak tersedia untuk kurir ini" : "Belum tersedia")
      : provider.description;
    return `
      <label class="checkout-payment-option ${unavailable ? "is-disabled" : ""}">
        ${paymentLogo(provider)}
        <span>
          <strong>${escapeHtml(provider.name)}</strong>
          ${description ? `<span class="checkout-helper">${escapeHtml(description)}</span>` : ""}
        </span>
        <input type="radio" name="checkoutChoice" value="${escapeHtml(value)}"
          data-method-id="${escapeHtml(method.id)}" data-provider-id="${method.providers ? escapeHtml(provider.id) : ""}"
          ${selected ? "checked" : ""} ${unavailable ? "disabled" : ""}>
      </label>`;
  }

  function showPaymentMethods()
  {
    dialogKind = "methods";
    const categories =
    {
      va: "Transfer ke Virtual Account",
      cod: "Bayar di Tempat",
      qris: "Bayar dengan QRIS",
      wallet: "Uang Elektronik"
    };
    const categoryOrder = Object.keys(categories);
    const methods = [...context.methods].sort((first, second) =>
      categoryOrder.indexOf(first.id) - categoryOrder.indexOf(second.id));
    showDialog("Metode Pembayaran", `
      <div class="checkout-payment-body">
        <fieldset class="checkout-payment-categories">
          <legend class="visually-hidden">Pilih metode pembayaran</legend>
          ${methods.map((method) =>
          {
            const title = categories[method.id] || method.name;
            const disabled = method.id === "cod" && !selectedService()?.cod;
            const emptyProviders = method.providers && method.providers.length === 0;
            const selected = !disabled && context.method === method.id;
            const providers = method.providers || [{ ...method, description: method.detail }];
            return `
              <div class="checkout-payment-category ${disabled ? "is-unavailable" : ""} ${selected ? "is-selected" : ""}"
                data-payment-category="${escapeHtml(method.id)}">
                <button class="checkout-payment-toggle" type="button"
                  id="payment-category-${escapeHtml(method.id)}"
                  data-checkout-action="toggle-payment" aria-expanded="${selected}"
                  aria-controls="payment-options-${escapeHtml(method.id)}">
                  <span class="checkout-payment-category-heading">
                    <span>${escapeHtml(title)}</span>
                    <span class="checkout-payment-selected" ${selected ? "" : "hidden"}>${icon("check")}Dipilih</span>
                  </span>
                  ${icon("chevron")}
                  <span class="checkout-payment-logos" aria-hidden="true">
                    ${providers.map(paymentLogo).join("\n")}
                  </span>
                  ${disabled ? '<span class="checkout-payment-unavailable">Tidak tersedia untuk kurir ini</span>' : ""}
                  ${emptyProviders ? '<span class="checkout-payment-unavailable">Pilihan dalam kategori ini belum tersedia</span>' : ""}
                </button>
                <div class="checkout-payment-options" id="payment-options-${escapeHtml(method.id)}" ${selected ? "" : "hidden"}>
                  ${providers.map((provider) => paymentOption(method, provider, disabled)).join("\n") || `
                    <div class="checkout-payment-empty">
                      <p>Belum ada pilihan dalam kategori ini. Pilih metode lain atau muat kembali.</p>
                      ${button("retry-payment-methods", "Coba Lagi")}
                    </div>`}
                </div>
              </div>`;
          }).join("") || `
            <div class="checkout-payment-empty" role="status">
              <p>${repository.scenario === "methodError" ? "Layanan pembayaran sedang bermasalah." : "Metode pembayaran belum tersedia."}</p>
              <p>Coba muat kembali pilihan pembayaran.</p>
              ${button("retry-payment-methods", "Coba Lagi")}
            </div>`}
        </fieldset>
      </div>
      <div class="checkout-payment-footer">
        <p class="checkout-payment-current" aria-live="polite">
          <span>Pilihanmu</span>
          <strong id="checkout-payment-current"></strong>
        </p>
        <div class="checkout-dialog-actions">
          ${button("close", "Batal")}
          ${button("use-choice", "Gunakan Metode", false, "disabled")}
        </div>
      </div>`);
    updatePaymentChoice();
  }

  function updatePaymentChoice()
  {
    const chosen = dialogContent.querySelector('input[name="checkoutChoice"]:checked:not(:disabled)');
    const method = context.methods.find((candidate) => candidate.id === chosen?.dataset.methodId);
    const provider = method?.providers?.find((candidate) => candidate.id === chosen?.dataset.providerId);
    document.getElementById("checkout-payment-current").textContent = method
      ? [method.name, provider?.name || method.detail].join(" — ") : "Belum ada metode dipilih";
    dialogContent.querySelector('[data-checkout-action="use-choice"]').disabled = !method;
    dialogContent.querySelectorAll("[data-payment-category]").forEach((category) =>
    {
      const selected = category.dataset.paymentCategory === method?.id;
      category.classList.toggle("is-selected", selected);
      category.querySelector(".checkout-payment-selected").hidden = !selected;
    });
  }

  function togglePaymentCategory(target)
  {
    const expand = target.getAttribute("aria-expanded") !== "true";
    dialogContent.querySelectorAll(".checkout-payment-toggle").forEach((toggle) =>
    {
      const expanded = toggle === target && expand;
      toggle.setAttribute("aria-expanded", String(expanded));
      document.getElementById(toggle.getAttribute("aria-controls")).hidden = !expanded;
    });
  }

  function scheduleProblem()
  {
    if (perishable() && (!context.date || !context.slot))
    {
      return "Pilih tanggal dan slot pengiriman untuk produk Mudah Layu.";
    }
    if (!context.date)
    {
      return "";
    }
    const today = source.dateInWib();
    const minimum = perishable() ? today : source.dateInWib(Date.now() + 86400000);
    const maximum = source.dateInWib(Date.now() + 30 * 86400000);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(context.date) || context.date < minimum || context.date > maximum)
    {
      return "Pilih tanggal yang memenuhi jadwal, paling jauh 30 hari ke depan.";
    }
    if (["calendarClosed", "noSlots"].includes(repository.scenario) && !context.scheduleRecovered)
    {
      return repository.scenario === "calendarClosed" ? "Tanggal ini termasuk kalender tutup contoh. Pilih tanggal lain."
        : "Slot pada tanggal ini penuh. Pilih tanggal lain.";
    }
    const startHour = { PAGI: "08", SIANG: "12", SORE: "16" }[context.slot];
    if (perishable() && Date.parse(context.date + "T" + startHour + ":00:00+07:00") < Date.now() + 4 * 3600000)
    {
      return "Slot membutuhkan jeda minimal 4 jam. Pilih slot yang lebih akhir atau tanggal berikutnya.";
    }
    return "";
  }

  function maximumFor(item)
  {
    const siblings = context.items.filter((candidate) => candidate.lineId !== item.lineId && candidate.productId === item.productId)
      .reduce((sum, candidate) => sum + candidate.quantity, 0);
    const otherUnits = context.items.filter((candidate) => candidate.lineId !== item.lineId)
      .reduce((sum, candidate) => sum + candidate.quantity, 0);
    return Math.max(0, Math.min(item.availableStock, 20 - siblings, 50 - otherUnits));
  }

  function problem()
  {
    if (!context?.items.length)
    {
      return "Pilih produk dari Keranjang untuk melanjutkan.";
    }
    if (context.orderLimit && context.method !== "cod")
    {
      return "Selesaikan pesanan Menunggu Pembayaran melalui Pesanan Saya.";
    }
    if (quantityDrafts.size || fieldErrors.size)
    {
      return "Perbaiki isian yang ditandai sebelum melanjutkan.";
    }
    if (context.items.some((item) => !item.available || !Number.isSafeInteger(item.price) || item.price < 0
      || item.quantity > maximumFor(item) || item.configurationValid === false))
    {
      return "Periksa produk, konfigurasi dan jumlah yang belum tersedia.";
    }
    const address = selectedAddress();
    if (!address)
    {
      return "Pilih alamat pengiriman.";
    }
    const addressErrors = window.RylvaAccountValidation.validate("address", address, { addressNote: 50 });
    if (Object.keys(addressErrors).length)
    {
      return "Lengkapi alamat, wilayah dan kode pos melalui Ganti Alamat.";
    }
    const scheduleError = scheduleProblem();
    if (scheduleError)
    {
      return scheduleError;
    }
    const service = selectedService();
    if (!service)
    {
      return "Pilih layanan kurir yang tersedia untuk seluruh produk.";
    }
    if (service.kind !== "regular" && (!address.point || !Number.isFinite(address.point.latitude)
      || !Number.isFinite(address.point.longitude) || Math.abs(address.point.latitude) > 90 || Math.abs(address.point.longitude) > 180))
    {
      return "Tambahkan titik lokasi untuk kurir instan/same-day, atau pilih reguler jika tersedia.";
    }
    if (!availableMethods().some((method) => method.id === context.method))
    {
      return "Pilih metode pembayaran yang tersedia.";
    }
    const paymentMethod = context.methods.find((method) => method.id === context.method);
    if (paymentMethod.providers && !selectedProvider(paymentMethod))
    {
      return "Pilihan bank atau e-wallet tidak lagi tersedia. Pilih kembali metode pembayaran.";
    }
    if (context.gift.enabled && !context.gift.message.trim())
    {
      return "Isi pesan kartu ucapan atau matikan opsi kartu.";
    }
    if (context.gift.enabled && Array.from(context.gift.message).length > 200)
    {
      return "Pesan kartu ucapan maksimal 200 karakter.";
    }
    return "";
  }

  function panelHeading(title, symbol = null, action = "")
  {
    return `<div class="checkout-panel-heading">
      <h2>${symbol ? icon(symbol) : ""}${title}</h2>${action}
    </div>`;
  }

  function renderAddress()
  {
    const address = selectedAddress();
    return `
      <section class="checkout-panel checkout-address" data-figma-node="393:153">
        ${panelHeading("Alamat Pengiriman", "pin", button("address", address ? "Ganti" : "Tambah Alamat"))}
        ${address ? `
          <p class="checkout-recipient"><strong>${escapeHtml(address.label)} — ${escapeHtml(address.recipient)}</strong>
            <span>${escapeHtml(address.recipientPhone)}</span>
          </p>
          <p class="checkout-address-summary">${escapeHtml(addressDialog.fullAddress(address))}</p>
          ${!address.postcode ? '<p class="checkout-error">Kode pos belum lengkap. Ganti atau ubah alamat.</p>' : ""}
        ` : '<p>Belum ada alamat pengiriman. Tambahkan alamat untuk melihat pilihan kurir.</p>'}
      </section>`;
  }

  function renderSchedule()
  {
    const minimum = source.dateInWib(perishable() ? Date.now() : Date.now() + 86400000);
    const maximum = source.dateInWib(Date.now() + 30 * 86400000);
    const scheduleError = scheduleProblem();
    return `
      <section class="checkout-panel checkout-schedule" data-figma-node="395:158">
        ${panelHeading("Jadwal Pengiriman", "calendar")}
        <p class="checkout-helper">${perishable() ? "Produk Mudah Layu memerlukan tanggal dan slot; minimal 4 jam sebelum slot dimulai."
          : "Tanggal opsional untuk produk Tahan Lama. Pengiriman paling awal H+1."}</p>
        <div class="checkout-form-grid">
          <div class="checkout-field">
            <label for="checkout-date">Tanggal pengiriman${perishable() ? "" : " (opsional)"}</label>
            <input id="checkout-date" type="date" value="${escapeHtml(context.date)}" min="${minimum}" max="${maximum}"
              aria-describedby="checkout-schedule-help">
          </div>
          ${perishable() ? `
          <div class="checkout-field">
            <label for="checkout-slot">Slot pengiriman (WIB)</label>
            <select id="checkout-slot" aria-describedby="checkout-schedule-help">
              <option value="">Pilih slot pengiriman</option>
              ${Object.entries({ PAGI: "08.00–12.00 WIB", SIANG: "12.00–16.00 WIB", SORE: "16.00–20.00 WIB" }).map(([value, label]) =>
                `<option value="${value}" ${context.slot === value ? "selected" : ""}>${label}</option>`).join("")}
            </select>
          </div>` : '<p class="checkout-helper checkout-schedule-optional">Slot tidak diperlukan untuk produk ini.</p>'}
        </div>
        <p id="checkout-schedule-help" class="${scheduleError ? "checkout-error" : "checkout-helper"}">${escapeHtml(scheduleError || "Semua waktu menggunakan WIB. Jadwal mengikuti ketersediaan layanan.")}</p>
      </section>`;
  }

  function renderProducts()
  {
    return `
      <section class="checkout-panel checkout-products" data-figma-node="395:157">
        ${panelHeading("Produk Pesanan", "bag")}
        ${context.items.map((item) => `
          <article class="checkout-product" data-line-id="${escapeHtml(item.lineId)}">
            <div class="checkout-product-row">
              <div class="checkout-product-image">
                <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" width="104" height="120">
              </div>
              <div class="checkout-product-copy">
                <h3>${escapeHtml(item.name)}</h3>
                <p class="checkout-helper">${escapeHtml([item.variant, item.attributes].filter(Boolean).join(", "))}</p>
                ${item.configuration ? `
                  <details>
                    <summary>Konfigurasi buket</summary>
                    ${Array.isArray(item.configuration)
                      ? `<ul>${item.configuration.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>`
                      : `<p>${escapeHtml(item.configuration)}</p>`}
                    ${button("cart", "Ubah di Keranjang")}
                  </details>` : ""}
                <p class="checkout-unit-price">${money(item.price)}<span> / ${escapeHtml(item.unit)}</span></p>
                ${!item.available || item.configurationValid === false ? '<p class="checkout-error">Tidak tersedia. Hapus atau sesuaikan di Keranjang.</p>' : ""}
              </div>
              <div class="checkout-product-controls">
                <button class="checkout-icon-button" type="button" data-checkout-action="remove-item" data-id="${escapeHtml(item.lineId)}"
                  aria-label="Hapus ${escapeHtml(item.name)}">${icon("trash")}</button>
                <div class="checkout-quantity">
                  <button type="button" data-checkout-action="decrease" data-id="${escapeHtml(item.lineId)}"
                    aria-label="Kurangi jumlah ${escapeHtml(item.name)}" ${item.quantity <= 1 ? "disabled" : ""}>−</button>
                  <label class="visually-hidden" for="quantity-${escapeHtml(item.lineId)}">Jumlah ${escapeHtml(item.name)}</label>
                  <input id="quantity-${escapeHtml(item.lineId)}" data-quantity="${escapeHtml(item.lineId)}" type="text"
                    inputmode="numeric" value="${escapeHtml(quantityDrafts.get(item.lineId) ?? item.quantity)}"
                    aria-invalid="${fieldErrors.has(item.lineId)}" aria-describedby="quantity-error-${escapeHtml(item.lineId)}">
                  <button type="button" data-checkout-action="increase" data-id="${escapeHtml(item.lineId)}"
                    aria-label="Tambah jumlah ${escapeHtml(item.name)}" ${item.quantity >= maximumFor(item) ? "disabled" : ""}>+</button>
                </div>
                <p class="checkout-line-total">${money(item.price * item.quantity)}</p>
              </div>
            </div>
            <p class="checkout-error" id="quantity-error-${escapeHtml(item.lineId)}">${escapeHtml(fieldErrors.get(item.lineId) || "")}</p>
            <details class="checkout-note" ${item.note ? "open" : ""}>
              <summary>${icon("note")}Tambah catatan untuk kami<span id="note-count-${escapeHtml(item.lineId)}">${Array.from(item.note || "").length}/200</span></summary>
              <label class="visually-hidden" for="note-${escapeHtml(item.lineId)}">Catatan untuk ${escapeHtml(item.name)}</label>
              <textarea id="note-${escapeHtml(item.lineId)}" data-note="${escapeHtml(item.lineId)}" rows="2" maxlength="200">${escapeHtml(item.note || "")}</textarea>
            </details>
          </article>`).join("")}
        <div class="checkout-gift">
          ${context.items.some((item) => item.hasBouquetCard)
            ? '<p class="checkout-helper">Pesan kartu buket sudah tercantum pada rincian rakitan. Kartu pesanan di bawah terpisah dan bersifat opsional.</p>' : ""}
          <label class="checkout-check"><input id="gift-enabled" type="checkbox" ${context.gift.enabled ? "checked" : ""}>Tambahkan kartu ucapan</label>
          <div id="checkout-gift-fields" ${context.gift.enabled ? "" : "hidden"}>
            <div class="checkout-gift-grid">
              <div class="checkout-field">
                <label for="gift-message">Pesan kartu ucapan</label>
                <textarea id="gift-message" rows="3" maxlength="200" placeholder="Sampaikan pesan Anda kepadanya"
                  aria-invalid="${context.gift.enabled && !context.gift.message.trim()}" aria-describedby="gift-count gift-error">${escapeHtml(context.gift.message)}</textarea>
                <p class="checkout-helper" id="gift-count">${Array.from(context.gift.message).length}/200 karakter</p>
                <p class="checkout-error" id="gift-error">${context.gift.enabled && !context.gift.message.trim() ? "Isi pesan atau matikan opsi kartu ucapan." : ""}</p>
              </div>
              <div>
                <div class="checkout-form-grid">
                  <div class="checkout-field"><label for="gift-from">Dari (opsional)</label><input id="gift-from" value="${escapeHtml(context.gift.from)}" maxlength="100" ${context.gift.anonymous ? "disabled" : ""}></div>
                  <div class="checkout-field"><label for="gift-to">Kepada (opsional)</label><input id="gift-to" value="${escapeHtml(context.gift.to)}" maxlength="100"></div>
                </div>
                <label class="checkout-check"><input id="gift-anonymous" type="checkbox" ${context.gift.anonymous ? "checked" : ""}>Kirim sebagai anonim</label>
              </div>
            </div>
          </div>
        </div>
      </section>`;
  }

  function renderShipping()
  {
    const service = selectedService();
    return `
      <section class="checkout-panel checkout-shipping" data-figma-node="401:246">
        ${panelHeading("Metode Pengiriman", "truck", button("couriers", "Lihat Semua Kurir"))}
        ${service ? `
          <div class="checkout-shipping-choice"><div>
            <strong>${escapeHtml(service.name)}</strong>
            ${service.cod ? '<span class="checkout-primary-tag">Bisa COD</span>' : ""}
            <p class="checkout-helper">${escapeHtml(service.eta || "Estimasi tiba belum tersedia")}</p>
          </div><strong>${money(service.price)}</strong></div>
        ` : `<p class="checkout-error">${repository.scenario === "mixed" ? "Tidak ada layanan yang cocok untuk seluruh produk. Pisahkan pilihan di Keranjang." : "Belum ada layanan tersedia untuk alamat dan isi pesanan ini."}</p>
          ${button("address", "Ganti Alamat")}`}
      </section>`;
  }

  function renderMethods()
  {
    return `
      <section class="checkout-panel checkout-methods" data-figma-node="403:353">
        ${panelHeading("Metode Pembayaran", null, button("methods", "Lihat Semua"))}
        <fieldset><legend class="visually-hidden">Pilih metode pembayaran</legend>
          ${context.methods.length ? context.methods.map((method) =>
          {
            const disabled = (method.id === "cod" && !selectedService()?.cod)
              || (method.providers && !method.providers.some((provider) => provider.available !== false));
            const provider = selectedProvider(method);
            const unavailableSelection = method.id === context.method && method.providers
              && context.paymentProviderId && !provider;
            let description = provider?.name || method.detail;
            if (disabled)
            {
              description = method.id === "cod" ? "Tidak tersedia untuk kurir ini"
                : "Pilihan dalam kategori ini belum tersedia";
            }
            else if (unavailableSelection)
            {
              description = "Pilihan sebelumnya tidak tersedia. Pilih kembali.";
            }
            return `
              <label class="checkout-method ${disabled ? "is-disabled" : ""}">
                ${paymentLogo(provider || method)}
                <span>
                  <strong>${escapeHtml(method.name)}</strong>
                  <span class="checkout-helper">${escapeHtml(description)}</span>
                </span>
                <input id="payment-${method.id}" type="radio" name="paymentMethod" value="${method.id}" ${context.method === method.id ? "checked" : ""} ${disabled ? "disabled" : ""}>
              </label>`;
          }).join("") : `<p class="checkout-error">${repository.scenario === "methodError" ? "Layanan pembayaran sedang bermasalah." : "Metode pembayaran belum tersedia."}</p>${button("retry-services", "Coba Lagi")}`}
        </fieldset>
      </section>`;
  }

  function policyMarkup()
  {
    return `
      <ul class="checkout-policy-list">
        <li>Sebelum disiapkan, pembatalan dapat dilakukan sendiri dengan refund penuh. Setelah disiapkan perlu persetujuan toko; tidak berlaku untuk produk mudah layu yang telah dirangkai.</li>
        <li>Komplain kondisi barang maksimal <strong>24 jam setelah terkirim</strong>, dengan foto sebagai bukti.</li>
        <li>Refund diproses maksimal <strong>3 hari kerja setelah disetujui</strong>; waktu dana masuk mengikuti bank atau penyedia pembayaran.</li>
      </ul>
      <details class="checkout-policy-details"><summary>Risiko pengiriman dan kebijakan lengkap</summary>
        <p>Alamat salah atau penerima tidak tersedia pada produk Mudah Layu dapat memengaruhi refund atas biaya atau kerusakan yang wajar, setelah bukti upaya pengiriman dicatat.</p>
        <p>Kesalahan toko atau kurir tetap ditangani melalui investigasi dan penyelesaian yang proporsional. Refund tidak ditolak otomatis hanya karena jenis produk.</p>
        <p>
          Baca
          <a class="checkout-policy-link" href="/pages/public/terms-conditions.html" target="_blank" rel="noopener">Syarat dan Ketentuan</a>
          serta
          <a class="checkout-policy-link" href="/pages/public/cancellation-refund.html" target="_blank" rel="noopener">Pembatalan &amp; Refund</a>
          di tab baru agar rincian Checkout tetap tersedia.
        </p>
      </details>`;
  }

  function summaryMarkup()
  {
    const blocking = problem();
    const totalUnits = context.items.reduce((sum, item) => sum + item.quantity, 0);
    const disabled = blocking || pendingQuote || !quote || !consent || submitting || uncertain || Date.now() < retryAt;
    return `
      ${panelHeading("Detail Pembayaran")}
      <dl class="checkout-totals">
        <div><dt>Subtotal produk <small>(${context.items.length} jenis, ${totalUnits} barang)</small></dt><dd>${quote ? money(quote.subtotal) : "Menghitung…"}</dd></div>
        <div><dt>Ongkos kirim</dt><dd>${quote ? money(quote.shipping) : "Belum dihitung"}</dd></div>
        <div class="checkout-grand-total"><dt>Total pembayaran</dt><dd>${quote ? money(quote.total) : "Belum dihitung"}</dd></div>
      </dl>
      <p class="checkout-quote-status" role="status">${pendingQuote ? "Menghitung ulang rincian…" : quote ? "Rincian contoh sudah diperbarui." : "Perbarui rincian sebelum membuat pesanan."}</p>
      ${!quote && !pendingQuote ? button("requote", "Perbarui Rincian") : ""}
      ${policyMarkup()}
      <label class="checkout-consent checkout-check">
        <input id="checkout-consent" type="checkbox" ${consent ? "checked" : ""} ${!quote || pendingQuote || submitting || uncertain ? "disabled" : ""}>
        <span>Saya telah memeriksa rincian pesanan dan menyetujui kebijakan pembelian.</span>
      </label>
      <button id="checkout-submit" class="button button-primary" type="button"
        data-checkout-action="create" aria-describedby="checkout-submit-help" ${disabled ? "disabled" : ""}>
        ${submitting ? "Sedang Membuat Pesanan…" : uncertain ? "Memeriksa Hasil Pemesanan" : context.method === "cod" ? "Buat Pesanan — Bayar di Tempat" : "Buat Pesanan &amp; Bayar"}
      </button>
      <p class="checkout-helper" id="checkout-submit-help">${escapeHtml(uncertain ? "Hasil belum diketahui. Gunakan Periksa Hasil sebelum mencoba membuat pesanan lagi."
        : blocking || (pendingQuote ? "Tunggu perhitungan terbaru." : !quote ? "Rincian belum siap." : !consent ? "Tinjau rincian, lalu centang persetujuan." : context.method === "cod" ? "Pembayaran dilakukan saat pesanan diterima." : "Anda akan melanjutkan ke instruksi pembayaran."))}</p>`;
  }

  function renderSummary()
  {
    const target = document.getElementById("checkout-summary");
    if (!target || !context || order)
    {
      return;
    }
    const focusId = target.contains(document.activeElement) ? document.activeElement.id : null;
    const policyOpen = target.querySelector(".checkout-policy-details")?.open;
    target.innerHTML = summaryMarkup();
    if (policyOpen)
    {
      target.querySelector(".checkout-policy-details").open = true;
    }
    if (focusId)
    {
      document.getElementById(focusId)?.focus({ preventScroll: true });
    }
  }

  function render()
  {
    const activeId = document.activeElement?.id;
    root.setAttribute("aria-busy", "false");
    if (!context.items.length)
    {
      pageState("Keranjang kosong", "Belum ada produk untuk dipesan. Pilih produk dari Keranjang atau lanjut menjelajah.", "empty");
      return;
    }
    root.innerHTML = `
      <div class="checkout-layout">
        ${renderAddress()}${renderSchedule()}${renderProducts()}${renderShipping()}${renderMethods()}
        <aside class="checkout-panel checkout-summary" id="checkout-summary" aria-label="Detail pembayaran">${summaryMarkup()}</aside>
      </div>
      <div class="checkout-back">${button("cart", icon("back") + "Kembali ke Keranjang")}</div>`;
    if (activeId)
    {
      document.getElementById(activeId)?.focus({ preventScroll: true });
    }
  }

  function pageState(title, message, code)
  {
    const access = ["login", "session", "verification", "denied"].includes(code);
    root.setAttribute("aria-busy", "false");
    root.innerHTML = `
      <section class="checkout-page-state">
        ${icon(access ? "shield" : "bag")}
        <h2 id="checkout-state-title">${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p>
        <div class="checkout-dialog-actions">
          ${["login", "session", "verification"].includes(code) ? button("account", code === "verification" ? "Buka Akun" : "Masuk untuk Checkout", false)
            : !access && !["empty", "notFound"].includes(code) ? button("reload", "Coba Lagi", false) : ""}
          ${button("cart", "Kembali ke Keranjang")}
          ${code === "empty" ? button("catalog", "Lihat Produk") : ""}
        </div>
      </section>`;
  }

  async function requestQuote(preserveConsent = false)
  {
    const previousQuote = quote;
    const previousConsent = consent;
    const previousApproval = approvedPurchaseFingerprint;
    const revision = ++quoteRevision;
    pendingQuote = true;
    consent = false;
    approvedPurchaseFingerprint = null;
    quote = null;
    renderSummary();
    try
    {
      const next = await repository.quote(structuredClone(context));
      if (revision !== quoteRevision || order)
      {
        return;
      }
      quote = next;
      const sameAmounts = previousQuote?.subtotal === next.subtotal
        && previousQuote?.shipping === next.shipping && previousQuote?.total === next.total;
      if (preserveConsent && previousConsent && sameAmounts && previousApproval === JSON.stringify(context))
      {
        consent = true;
        approvedPurchaseFingerprint = previousApproval;
      }
    }
    catch (error)
    {
      if (revision === quoteRevision)
      {
        feedback(error.message, "warning", "requote");
      }
    }
    finally
    {
      if (revision === quoteRevision)
      {
        pendingQuote = false;
        renderSummary();
      }
    }
  }

  function changed(requote = true)
  {
    consent = false;
    approvedPurchaseFingerprint = null;
    repository.syncCart?.(context);
    if (context.method === "cod" && !selectedService()?.cod)
    {
      context.method = "";
      feedback("Kurir yang dipilih tidak mendukung COD. Pilih metode pembayaran lain.", "warning");
    }
    if (requote)
    {
      requestQuote();
    }
    else
    {
      quote = null;
      renderSummary();
    }
  }

  function changeQuantity(lineId, value)
  {
    const item = context.items.find((candidate) => candidate.lineId === lineId);
    if (!item || submitting || uncertain)
    {
      return;
    }
    if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > maximumFor(item))
    {
      quantityDrafts.set(lineId, value);
      fieldErrors.set(lineId, "Isi jumlah bulat 1–" + maximumFor(item) + " sesuai stok dan batas pesanan.");
      consent = false;
      render();
      return;
    }
    quantityDrafts.delete(lineId);
    fieldErrors.delete(lineId);
    item.quantity = Number(value);
    consent = false;
    render();
    changed();
  }

  function draftSignature()
  {
    return JSON.stringify({ notes: context?.items.map((item) => item.note), gift: context?.gift, quantities: [...quantityDrafts] });
  }

  function goCart()
  {
    const navigate = () =>
    {
      bypassLeave = true;
      if (context)
      {
        repository.syncCart?.(context, Boolean(order));
      }
      location.assign(repository.returnToCart?.() || "/pages/customer/cart.html");
    };
    if (!order && context && (draftSignature() !== originalDraft || quantityDrafts.size))
    {
      confirm("Kembali ke Keranjang?", "Catatan atau kartu yang belum menjadi pesanan akan ditinggalkan. Isi keranjang yang sudah tersimpan tetap ada.", navigate);
    }
    else
    {
      navigate();
    }
  }

  function renderResult()
  {
    quoteRevision++;
    submitting = false;
    uncertain = false;
    feedback("", "success");
    const paymentUrl = "/pages/customer/payment.html?orderId=" + encodeURIComponent(order.orderId);
    const detailUrl = "/pages/customer/order-detail.html?orderId=" + encodeURIComponent(order.orderId);
    root.innerHTML = `
      <section class="checkout-result">
        <div class="checkout-result-icon">${icon("check")}</div>
        <h2 tabindex="-1" id="checkout-result-title">Pesanan contoh berhasil dibuat</h2>
        <p>${order.isCod ? "Pesanan siap diproses. Pembayaran dilakukan saat pesanan diterima." : "Lanjutkan ke instruksi pembayaran untuk menyelesaikan pesanan."}</p>
        <p class="checkout-helper">Ini simulasi pratinjau. Tidak ada transaksi, pengiriman atau pengurangan stok nyata.</p>
        <dl class="checkout-result-details">
          <div><dt>Nomor pesanan contoh</dt><dd>${escapeHtml(order.orderNo)}</dd></div>
          <div><dt>Status pesanan</dt><dd><span class="badge" data-status="${order.orderStatus}">${order.orderStatus}</span></dd></div>
          <div><dt>Status pembayaran</dt><dd><span class="badge" data-status="Menunggu">Menunggu${order.isCod ? " — Bayar saat diterima" : ""}</span></dd></div>
          <div><dt>Total pembayaran</dt><dd><strong>${money(order.totalAmount)}</strong></dd></div>
        </dl>
        ${repository.scenario === "paymentInitError" ? '<p class="checkout-feedback">Pesanan contoh sudah dibuat, tetapi instruksi pembayaran belum tersedia. Buka Pembayaran untuk menyiapkan instruksi pada pesanan yang sama.</p>' : ""}
        <div class="checkout-dialog-actions">
          ${!order.isCod ? `<a class="button button-primary" href="${paymentUrl}">Lanjut ke Pembayaran</a>` : ""}
          <a class="button ${order.isCod ? "button-primary" : "button-secondary"}" href="${detailUrl}">Detail Pesanan</a>
          <a class="button button-secondary" href="/pages/customer/my-orders.html">Pesanan Saya</a>
        </div>
      </section>`;
    root.setAttribute("aria-busy", "false");
    window.scrollTo(0, 0);
    document.getElementById("checkout-result-title").focus({ preventScroll: true });
    announce("Pesanan contoh dibuat. Status pembayaran masih menunggu.");
  }

  async function inspect()
  {
    if (submitting || !intent)
    {
      return;
    }
    submitting = true;
    renderSummary();
    try
    {
      order = await repository.inspectIntent(intent);
      renderResult();
    }
    catch (error)
    {
      feedback(error.message, "warning", "inspect");
    }
    finally
    {
      submitting = false;
      renderSummary();
    }
  }

  async function createOrder()
  {
    if (submitting || uncertain || problem() || !quote || pendingQuote || !consent || Date.now() < retryAt)
    {
      return;
    }
    submitting = true;
    intent ||= crypto.randomUUID();
    root.querySelectorAll("button, input, select, textarea").forEach((element) => element.disabled = true);
    renderSummary();
    feedback("Sedang membuat pesanan contoh. Tunggu hasil sebelum mencoba lagi.");
    try
    {
      order = await repository.createOrder(structuredClone(context), intent, approvedPurchaseFingerprint);
      renderResult();
    }
    catch (error)
    {
      if (["uncertain", "offline"].includes(error.code))
      {
        uncertain = true;
        feedback(error.message, "warning", "inspect");
      }
      else
      {
        intent = null;
        consent = false;
        if (error.code === "priceChanged")
        {
          const previous = context.items[0].price;
          context.items[0].price = error.price;
          feedback("Harga " + context.items[0].name + " berubah dari " + money(previous) + " menjadi " + money(error.price) + ". Tinjau total dan setujui ulang.", "warning");
        }
        else if (error.code === "stockChanged")
        {
          context.items[0].availableStock = 0;
          context.items[0].available = false;
          feedback(error.message, "danger");
        }
        else if (error.code === "rateLimited")
        {
          retryAt = error.retryAt;
          feedback("Terlalu banyak percobaan. Tunggu " + Math.ceil((retryAt - Date.now()) / 1000) + " detik sebelum mencoba lagi.", "warning");
          setTimeout(renderSummary, Math.max(0, retryAt - Date.now()) + 30);
        }
        else if (error.code === "orderLimit")
        {
          feedback("Sudah ada 3 pesanan Menunggu Pembayaran. Selesaikan atau batalkan melalui Pesanan Saya.", "warning", "orders");
          context.orderLimit = true;
        }
        else if (error.code === "addressChanged")
        {
          context.addressId = null;
          feedback("Alamat terpilih sudah berubah. Pilih alamat dan periksa ongkir kembali.", "warning");
        }
        else if (error.code === "cutoffChanged")
        {
          context.date = "";
          context.slot = "";
          feedback("Batas waktu jadwal sudah berubah. Pilih tanggal dan slot kembali.", "warning");
        }
        else
        {
          feedback(error.code === "policyChanged" ? "Kebijakan diperbarui. Baca rincian dan setujui ulang."
            : error.code === "csrf" ? "Sesi perlu diperbarui. Muat ulang aman sebelum melanjutkan."
              : error.message, "warning", "requote");
        }
        quote = null;
      }
    }
    finally
    {
      submitting = false;
      if (!order)
      {
        render();
        if (uncertain)
        {
          root.querySelectorAll("button, input, select, textarea").forEach((element) => element.disabled = true);
        }
        else
        {
          await requestQuote();
        }
      }
    }
  }

  addressDialog = window.RylvaCheckoutAddress({ dialog, content: dialogContent, repository, escapeHtml, icon,
    show: showDialog, close: closeDialog, announce, confirm,
    select(id)
    {
      context.addressId = id;
      render();
      changed();
    },
    addressesChanged(addresses)
    {
      context.addresses = addresses;
      if (!addresses.some((address) => address.id === context.addressId))
      {
        context.addressId = null;
      }
      render();
      changed();
    }
  });

  async function load()
  {
    root.setAttribute("aria-busy", "true");
    root.innerHTML = '<section class="checkout-panel checkout-loading"><h2>Memuat Checkout…</h2><div class="skeleton"></div><div class="skeleton"></div><p>Menyiapkan rincian pesanan.</p></section>';
    try
    {
      context = await repository.load();
      if (window.RylvaCustomerPreviewAccess?.isSignedOut())
      {
        pageState("Masuk untuk Checkout", "Sesi contoh telah keluar. Masuk dengan akun pelanggan untuk melanjutkan.", "login");
        return;
      }
      if (!repository.workbench && new URLSearchParams(location.search).get("from") === "cart")
      {
        try
        {
          const handoff = JSON.parse(sessionStorage.getItem("rylva-cart-checkout-preview-v1"));
          if (handoff?.mode === "guest")
          {
            pageState("Masuk untuk Checkout", "Keranjang tamu tetap tersimpan. Autentikasi pelanggan belum terhubung pada pratinjau ini; belum ada pesanan dibuat.", "login");
            return;
          }
        }
        catch
        {
          pageState("Pilihan belum dapat dimuat", "Kembali ke Keranjang untuk memilih barang lagi.", "notFound");
          return;
        }
      }
      originalDraft = draftSignature();
      const savedIntent = !repository.workbench ? repository.readIntent() : null;
      if (savedIntent?.key)
      {
        intent = savedIntent.key;
        uncertain = true;
        render();
        await inspect();
        return;
      }
      render();
      if (!context.items.length)
      {
        return;
      }
      await requestQuote();
      if (["success", "alreadyCreated"].includes(repository.scenario))
      {
        context.method = "qris";
        await requestQuote();
        consent = true;
        approvedPurchaseFingerprint = JSON.stringify(context);
        await createOrder();
      }
      if (!repository.storageAvailable)
      {
        feedback("Penyimpanan tab dibatasi. Rincian contoh hanya tersedia selama halaman ini terbuka.", "warning");
      }
    }
    catch (error)
    {
      const messages = { login: "Masuk dengan akun pelanggan terverifikasi untuk melanjutkan.",
        verification: "Verifikasi akun sebelum membuat pesanan.", session: "Sesi berakhir. Masuk kembali untuk melanjutkan.",
        denied: "Akun ini tidak memiliki akses Checkout.", notFound: "Data Checkout tidak ditemukan." };
      pageState(["login", "session", "verification", "denied"].includes(error.code) ? "Akses Checkout" : "Checkout belum dapat dimuat",
        messages[error.code] || error.message, error.code);
    }
  }

  async function action(name, target)
  {
    if (name === "confirm-cancel")
    {
      dialogKind = "address";
      confirmCancel?.();
      return;
    }
    if (name === "confirm")
    {
      const callback = confirmAction;
      closeDialog();
      await callback?.();
      return;
    }
    if (name === "close")
    {
      if (dialogKind === "address")
      {
        addressDialog.requestClose();
      }
      else
      {
        closeDialog();
      }
      return;
    }
    if (name === "cart")
    {
      goCart();
    }
    else if (name === "orders")
    {
      bypassLeave = true;
      location.assign("/pages/customer/my-orders.html");
    }
    else if (name === "account")
    {
      const destination = new URL("/pages/auth/customer-login.html", location.origin);
      destination.searchParams.set("returnTo", location.pathname + location.search);
      bypassLeave = true;
      location.assign(destination.pathname + destination.search);
    }
    else if (name === "catalog")
    {
      showDialog("Lihat Produk", '<p>Katalog belum terhubung pada pratinjau ini. Isi keranjang contoh dapat diperiksa dari halaman Keranjang.</p>' + button("cart", "Buka Keranjang"));
    }
    else if (name === "reload")
    {
      repository.recover();
      feedback("");
      await load();
    }
    else if (name === "inspect")
    {
      await inspect();
    }
    else if (submitting || uncertain || !context)
    {
      return;
    }
    else if (name === "address")
    {
      dialogKind = "address";
      addressDialog.open(context);
    }
    else if (name === "requote" || name === "retry-services")
    {
      if (name === "retry-services")
      {
        const fresh = source.create("normal");
        context.methods = fresh.methods;
        context.services = fresh.services;
        render();
      }
      feedback("");
      await requestQuote();
    }
    else if (name === "methods" || name === "retry-payment-methods")
    {
      if (name === "retry-payment-methods")
      {
        target.disabled = true;
        target.textContent = "Memuat...";
        await action("retry-services");
        if (!dialog.open || dialogKind !== "methods" || !target.isConnected)
        {
          return;
        }
      }
      showPaymentMethods();
    }
    else if (name === "toggle-payment")
    {
      togglePaymentCategory(target);
    }
    else if (name === "couriers")
    {
      dialogKind = name;
      const choices = availableServices();
      showDialog("Pilih Kurir", `
        <fieldset class="checkout-options">
          <legend class="visually-hidden">Layanan pengiriman</legend>
          ${choices.map((choice) => `
            <label>
              <input type="radio" name="checkoutChoice" value="${choice.id}" ${context.serviceId === choice.id ? "checked" : ""}>
              <span>
                <strong>${escapeHtml(choice.name)}</strong>
                <span class="checkout-helper">${escapeHtml(choice.eta || "Estimasi belum tersedia")}</span>
              </span>
              <strong>${money(choice.price)}</strong>
            </label>`).join("") || '<p class="checkout-error">Belum ada pilihan tersedia. Ganti alamat/jadwal atau kembali ke Keranjang.</p>'}
        </fieldset>
        <div class="checkout-dialog-actions">
          ${button("close", "Batal")}
          ${choices.length ? button("use-choice", "Gunakan Kurir", false) : ""}
        </div>`);
    }
    else if (name === "use-choice")
    {
      const chosen = dialogContent.querySelector('input[name="checkoutChoice"]:checked');
      if (!chosen || chosen.disabled)
      {
        announce("Pilih salah satu opsi sebelum melanjutkan.");
        return;
      }
      const methodId = chosen.dataset.methodId || chosen.value;
      const paymentMethod = context.methods.find((method) => method.id === methodId);
      const providerId = chosen.dataset.providerId || null;
      if (dialogKind === "methods" && (!availableMethods().some((method) => method.id === methodId)
        || (paymentMethod?.providers && !paymentMethod.providers.some((provider) => provider.id === providerId && provider.available !== false))))
      {
        showPaymentMethods();
        announce("Metode ini tidak lagi tersedia. Pilih metode pembayaran lain.");
        return;
      }
      const returnAction = dialogKind;
      if (dialogKind === "methods")
      {
        context.method = methodId;
        context.paymentProviderId = providerId;
      }
      else
      {
        context.serviceId = chosen.value;
      }
      closeDialog();
      render();
      changed();
      root.querySelector(`[data-checkout-action="${returnAction}"]`)?.focus({ preventScroll: true });
    }
    else if (name === "increase" || name === "decrease")
    {
      const item = context.items.find((candidate) => candidate.lineId === target.dataset.id);
      changeQuantity(item.lineId, String(item.quantity + (name === "increase" ? 1 : -1)));
    }
    else if (name === "remove-item")
    {
      confirm("Hapus produk dari Checkout?", "Produk ini tidak akan termasuk dalam pesanan. Periksa kembali isi Keranjang setelah kembali.", () =>
      {
        context.items = context.items.filter((item) => item.lineId !== target.dataset.id);
        fieldErrors.delete(target.dataset.id);
        quantityDrafts.delete(target.dataset.id);
        render();
        changed();
      });
    }
    else if (name === "create")
    {
      await createOrder();
    }
  }

  document.addEventListener("click", (event) =>
  {
    const addressAction = event.target.closest("[data-address-action]");
    if (addressAction)
    {
      addressDialog.action(addressAction.dataset.addressAction, addressAction);
      return;
    }
    const target = event.target.closest("[data-checkout-action]");
    if (target)
    {
      action(target.dataset.checkoutAction, target);
    }
  });
  dialog.addEventListener("cancel", (event) =>
  {
    event.preventDefault();
    action("close");
  });
  dialog.addEventListener("keydown", (event) =>
  {
    if (event.key !== "Tab")
    {
      return;
    }
    const focusable = [...dialog.querySelectorAll("button, a[href], input, select, textarea, [tabindex]")]
      .filter((element) => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first)
    {
      event.preventDefault();
      dialogTitle.focus();
      return;
    }
    if (!focusable.includes(document.activeElement)
      || (!event.shiftKey && document.activeElement === last)
      || (event.shiftKey && document.activeElement === first))
    {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  });
  dialogContent.addEventListener("submit", (event) =>
  {
    event.preventDefault();
    addressDialog.submit(event.target);
  });
  dialogContent.addEventListener("change", (event) =>
  {
    if (dialogKind === "methods" && event.target.name === "checkoutChoice")
    {
      updatePaymentChoice();
    }
  });
  dialogContent.addEventListener("error", (event) =>
  {
    if (event.target.tagName === "IMG")
    {
      event.target.hidden = true;
    }
  }, true);
  root.addEventListener("change", (event) =>
  {
    const target = event.target;
    if (submitting || uncertain || !context)
    {
      return;
    }
    if (target.dataset.quantity)
    {
      changeQuantity(target.dataset.quantity, target.value);
      return;
    }
    if (target.id === "checkout-consent")
    {
      consent = target.checked;
      approvedPurchaseFingerprint = consent ? JSON.stringify(context) : null;
      renderSummary();
      return;
    }
    if (target.name === "paymentMethod")
    {
      context.method = target.value;
      context.paymentProviderId = selectedProvider(context.methods.find((method) => method.id === target.value))?.id || null;
    }
    else if (target.id === "checkout-date" || target.id === "checkout-slot")
    {
      const key = target.id === "checkout-date" ? "date" : "slot";
      if (key === "date" && context.date && context.date !== target.value)
      {
        context.scheduleRecovered = true;
      }
      context[key] = target.value;
    }
    else if (target.id === "gift-enabled")
    {
      context.gift.enabled = target.checked;
    }
    else if (target.id === "gift-anonymous")
    {
      context.gift.anonymous = target.checked;
    }
    else
    {
      return;
    }
    render();
    changed();
  });
  root.addEventListener("input", (event) =>
  {
    if (submitting || uncertain || !context)
    {
      return;
    }
    const target = event.target;
    if (target.dataset.quantity)
    {
      quantityDrafts.set(target.dataset.quantity, target.value);
      consent = false;
      renderSummary();
      return;
    }
    if (target.dataset.note)
    {
      const item = context.items.find((candidate) => candidate.lineId === target.dataset.note);
      item.note = target.value;
      document.getElementById("note-count-" + item.lineId).textContent = Array.from(target.value).length + "/200";
    }
    else if (["gift-message", "gift-from", "gift-to"].includes(target.id))
    {
      const key = { "gift-message": "message", "gift-from": "from", "gift-to": "to" }[target.id];
      context.gift[key] = target.value;
      document.getElementById("gift-count").textContent = Array.from(context.gift.message).length + "/200 karakter";
      const invalidMessage = context.gift.enabled && !context.gift.message.trim();
      document.getElementById("gift-message").setAttribute("aria-invalid", String(invalidMessage));
      document.getElementById("gift-error").textContent = invalidMessage ? "Isi pesan atau matikan opsi kartu ucapan." : "";
    }
    else
    {
      return;
    }
    consent = false;
    approvedPurchaseFingerprint = null;
    renderSummary();
  });
  root.addEventListener("keydown", (event) =>
  {
    if (event.key === "Enter" && event.target.dataset.quantity)
    {
      event.preventDefault();
      changeQuantity(event.target.dataset.quantity, event.target.value);
    }
  });
  root.addEventListener("error", (event) =>
  {
    if (event.target.tagName === "IMG")
    {
      event.target.hidden = true;
      event.target.parentElement.classList.add("checkout-image-failed");
    }
  }, true);
  window.addEventListener("offline", () =>
  {
    if (!order)
    {
      quote = null;
      consent = false;
      feedback("Koneksi terputus. Sambungkan kembali lalu perbarui rincian.", "warning", "requote");
      renderSummary();
    }
  });
  document.addEventListener("visibilitychange", () =>
  {
    if (!document.hidden && context && !submitting && !uncertain && !order)
    {
      requestQuote(true);
    }
  });
  document.addEventListener("rylva:before-search", (event) =>
  {
    if (submitting || uncertain)
    {
      event.preventDefault();
      feedback("Tunggu hingga proses pesanan selesai sebelum membuka pencarian.", "warning");
    }
    else if (!order && context && (draftSignature() !== originalDraft || addressDialog.dirty()))
    {
      event.preventDefault();
      confirm("Buka pencarian produk?", "Perubahan Checkout yang belum menjadi pesanan akan ditinggalkan.", () =>
      {
        bypassLeave = true;
        event.detail.proceed();
      });
    }
  });

  window.addEventListener("beforeunload", (event) =>
  {
    if (!bypassLeave && !order && context && (draftSignature() !== originalDraft || addressDialog.dirty()))
    {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  load();
})();
