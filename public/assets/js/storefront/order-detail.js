"use strict";

(() =>
{
  const root = document.getElementById("order-root");
  const dialog = document.getElementById("payment-dialog");
  const dialogContent = document.getElementById("dialog-content");
  const feedback = document.getElementById("order-feedback");
  const connection = document.getElementById("order-connection");
  const query = new URLSearchParams(window.location.search);
  const adapter = window.RylvaOrderDetailAdapter || window.RylvaOrderDetailPreview.createAdapter();
  const dateFormatter = new Intl.DateTimeFormat("id-ID",
  {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    timeZone: "Asia/Jakarta"
  });
  const moneyFormatter = new Intl.NumberFormat("id-ID",
  {
    style: "currency", currency: "IDR", maximumFractionDigits: 0
  });
  const deliveryDateFormatter = new Intl.DateTimeFormat("id-ID",
  {
    day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta"
  });
  const orderStatuses = ["Menunggu Pembayaran", "Siap Diproses", "Sedang Disiapkan", "Dikirim", "Terkirim", "Selesai", "Dibatalkan", "Perlu Penanganan"];
  const paymentStatuses = ["Menunggu", "Berhasil", "Gagal", "Kedaluwarsa", "Dibatalkan", "Perlu Ditinjau", "Refund Diproses", "Dikembalikan Sebagian", "Dikembalikan Penuh", "Sengketa"];
  const shippingStatuses = ["Belum Diserahkan", "Dalam Pengiriman", "Terkendala", "Terkirim", "Dikembalikan"];
  const actionLabels = { cancel: "Batalkan Pesanan", requestCancel: "Ajukan Pembatalan", confirmReceipt: "Konfirmasi Diterima", complain: "Ajukan Komplain", appeal: "Ajukan Banding" };
  const errors =
  {
    loadError: "Pesanan belum dapat dimuat. Coba muat lagi untuk melihat informasi terbaru.",
    offline: "Koneksi terputus. Sambungkan kembali lalu perbarui status pesanan.",
    service: "Layanan sedang bermasalah. Coba lagi nanti; hasil tindakan belum dapat dipastikan.",
    maintenance: "Layanan sedang dalam pemeliharaan. Silakan periksa kembali nanti.",
    rateLimit: "Terlalu banyak permintaan. Tunggu sebelum mencoba lagi.",
    login: "Masuk dengan akun pelanggan pemilik pesanan untuk melihat detailnya.",
    session: "Sesi Anda telah berakhir. Masuk kembali dengan akun pemilik pesanan.",
    denied: "Pesanan tidak ditemukan atau tidak dapat diakses oleh akun ini.",
    verification: "Selesaikan verifikasi akun pelanggan sebelum melanjutkan.",
    notFound: "Pesanan tidak ditemukan atau tidak dapat diakses oleh akun ini.",
    unavailable: "Pesanan tidak tersedia. Periksa kembali tautan atau hubungi toko melalui kanal yang tersedia.",
    invalid: "Data pesanan belum lengkap atau tidak valid. Muat lagi; tindakan transaksi belum tersedia.",
    unknown: "Status pesanan belum dapat dikenali. Perbarui informasi sebelum melakukan tindakan.",
    timeout: "Hasil permintaan belum pasti. Perbarui status sebelum mengirim lagi.",
    conflict: "Status pesanan berubah. Perbarui status dan tinjau kembali tindakan yang tersedia.",
    duplicate: "Permintaan serupa sudah tercatat. Perbarui status untuk melihat hasilnya.",
    csrf: "Form perlu diperbarui. Perbarui status lalu tinjau isian sebelum mengirim lagi.",
    validation: "Isian belum dapat diterima. Periksa alasan, kategori dan bukti yang diperlukan.",
    document: "Bukti pelunasan belum dapat dimuat. Coba lagi tanpa mengulangi pembayaran."
  };
  let snapshot = null;
  let reading = false;
  let busy = false;
  let uncertain = false;
  let stale = false;
  let dirty = false;
  let trigger = null;
  let activeAction = null;
  let files = [];
  let validatingFiles = false;
  let photoValidationError = "";
  let requestKey = null;
  let receivedAt = 0;
  let retryUntil = 0;
  let deadlineTimer = null;
  let dialogRevision = 0;
  let photoRevision = 0;
  let formValidationAttempted = false;

  function escapeHtml(value)
  {
    return String(value ?? "").replace(/[&<>"']/g, (character) =>
    {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function icon(name)
  {
    return `<svg class="icon" aria-hidden="true">
      <use href="#icon-${name}"/>
    </svg>`;
  }

  function money(value)
  {
    return Number.isSafeInteger(value) && value >= 0 ? moneyFormatter.format(value) : "Belum tersedia";
  }

  function date(value)
  {
    return Number.isFinite(Date.parse(value)) ? dateFormatter.format(new Date(value)) + " WIB" : "Belum tersedia";
  }

  function deliveryDate(value)
  {
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value || "") ? Date.parse(value + "T00:00:00+07:00") : NaN;
    return Number.isFinite(parsed) ? deliveryDateFormatter.format(new Date(parsed)) : "Tanggal belum tersedia";
  }

  function serverTime()
  {
    return Date.parse(snapshot?.serverNow) + performance.now() - receivedAt;
  }

  function announce(message)
  {
    feedback.textContent = message;
  }

  function button(label, action, secondary = false, disabled = false)
  {
    return `<button
      type="button"
      class="button${secondary ? " button-secondary" : ""}"
      data-order-action="${action}"
      ${disabled ? "disabled" : ""}
    >${escapeHtml(label)}</button>`;
  }

  function field(label, content)
  {
    return `<div class="detail-field">
      <dt>${escapeHtml(label)}</dt>
      <dd>${content}</dd>
    </div>`;
  }

  function price(label, value, total = false)
  {
    return `<div class="price-row${total ? " price-total" : ""}">
      <dt>${escapeHtml(label)}</dt>
      <dd>${money(value)}</dd>
    </div>`;
  }

  function safeUrl(value, asset = false)
  {
    if (!value)
    {
      return null;
    }
    try
    {
      const url = new URL(value, window.location.href);
      if (asset && url.origin === window.location.origin && url.pathname.startsWith("/assets/images/"))
      {
        return escapeHtml(url.href);
      }
      return !asset && url.protocol === "https:" && !url.username && !url.password ? escapeHtml(url.href) : null;
    }
    catch
    {
      return null;
    }
  }

  function can(action)
  {
    if (!snapshot || snapshot.archived || uncertain || stale || navigator.onLine === false
      || (adapter.isPreview && adapter.scenario === "offline")
      || snapshot.paymentStatus === "Sengketa")
    {
      return false;
    }
    if (action === "complain" && Date.parse(snapshot.complaintDeadline) <= serverTime())
    {
      return false;
    }
    if (action === "appeal" && Date.parse(snapshot.complaint?.appealDeadline) <= serverTime())
    {
      return false;
    }
    return snapshot.allowedActions?.[action] === true;
  }

  function validSnapshot(value)
  {
    return value && value.orderId && value.orderNo && orderStatuses.includes(value.orderStatus)
      && paymentStatuses.includes(value.paymentStatus) && shippingStatuses.includes(value.shippingStatus)
      && Array.isArray(value.items) && value.items.length > 0
      && [value.subtotalAmount, value.shippingAmount, value.totalAmount].every((amount) => Number.isSafeInteger(amount) && amount >= 0)
      && value.subtotalAmount + value.shippingAmount === value.totalAmount
      && value.items.every((item) => Number.isSafeInteger(item.quantity) && item.quantity > 0
        && Number.isSafeInteger(item.amount) && item.amount >= 0)
      && Number.isFinite(Date.parse(value.serverNow));
  }

  function statusBadge(label, value)
  {
    const positive = ["Berhasil", "Selesai", "Terkirim"].includes(value);
    return `<span class="status-field">
      <span>${escapeHtml(label)}</span>
      <span class="badge${positive ? " badge-positive" : ""}" data-status="${escapeHtml(value)}">
        ${icon(positive ? "check" : (value === "Dikirim" ? "truck" : "clock"))}
        ${escapeHtml(value)}
      </span>
    </span>`;
  }

  function nextStep()
  {
    if (snapshot.archived)
    {
      return ["Riwayat hanya dapat dilihat", "Data historis ini tidak menyediakan tindakan perubahan.", null];
    }
    if (snapshot.complaint && snapshot.complaint.status !== "Selesai")
    {
      return ["Komplain sedang ditangani", "Baca status dan keputusan komplain di bawah. Penyelesaian otomatis ditunda selama komplain terbuka.", can("appeal") ? "appeal" : null];
    }
    if (snapshot.handling)
    {
      return ["Pesanan memerlukan penanganan", snapshot.handling.description, null];
    }
    const steps =
    {
      "Menunggu Pembayaran": ["Selesaikan pembayaran", "Buka instruksi pembayaran untuk melihat metode dan batas waktu pesanan ini.", "pay"],
      "Siap Diproses": ["Pesanan siap diproses", "Toko akan menyiapkan produk sesuai pesanan dan jadwal pengiriman.", null],
      "Sedang Disiapkan": ["Pesanan sedang disiapkan", "Produk sedang diperiksa dan dikemas. Pembatalan pada tahap ini memerlukan keputusan toko.", null],
      "Dikirim": ["Pesanan dalam perjalanan", "Pantau pengiriman. Konfirmasi diterima hanya setelah Anda menerima dan memeriksa paket.", "confirmReceipt"],
      "Terkirim": ["Periksa paket Anda", "Ajukan komplain sebelum " + date(snapshot.complaintDeadline) + ". Konfirmasi diterima akan menutup hak komplain.", "confirmReceipt"],
      "Selesai": ["Pesanan selesai", "Terima kasih. Pengajuan komplain tidak lagi tersedia setelah pesanan selesai.", null],
      "Dibatalkan": ["Pesanan dibatalkan", "Periksa informasi pembayaran dan refund secara terpisah. Pembatalan tidak berarti dana telah kembali.", null]
    };
    if (snapshot.orderStatus === "Terkirim" && Date.parse(snapshot.complaintDeadline) <= serverTime())
    {
      return ["Jendela komplain telah berakhir", "Perbarui status untuk melihat hasil penyelesaian pesanan dari sistem.", "confirmReceipt"];
    }
    return steps[snapshot.orderStatus] || ["Periksa informasi pesanan", "Perbarui status untuk melihat langkah berikutnya.", null];
  }

  function renderItem(item)
  {
    const imageUrl = safeUrl(item.image, true);
    return `<li class="detail-product">
      <div class="detail-photo">
        ${imageUrl ? `<img src="${imageUrl}" alt="" loading="lazy">` : ""}
        <span ${imageUrl ? "hidden" : ""}>Foto belum tersedia</span>
      </div>
      <div>
        <div class="detail-product-top">
          <div>
            <h3>${escapeHtml(item.name || "Nama produk belum tersedia")}</h3>
            <p class="detail-product-meta">${escapeHtml(item.variant || "Varian belum tersedia")}</p>
            ${item.sku ? `<p class="detail-product-meta">SKU ${escapeHtml(item.sku)}</p>` : ""}
          </div>
          <strong>${money(item.amount * item.quantity)}</strong>
        </div>
        <p class="detail-product-price">${escapeHtml(item.quantity)} ${escapeHtml(item.unit || "unit")} × ${money(item.amount)}</p>
        ${item.configuration ? `<p class="detail-configuration">${escapeHtml(item.configuration)}</p>` : ""}
      </div>
    </li>`;
  }

  function renderHistory(isTracking = false)
  {
    const history = Array.isArray(snapshot.history) ? snapshot.history : [];
    function entries(values)
    {
      return values.map((event) => `<li>
        <h3>${escapeHtml(event.title)}</h3>
        <time datetime="${escapeHtml(event.at)}">${date(event.at)}</time>
        <p>${escapeHtml(event.detail)}</p>
      </li>`).join("\n");
    }
    const headingId = isTracking ? "tracking-history-heading" : "history-heading";
    return `<section class="${isTracking ? "detail-tracking-history" : "detail-section"}" aria-labelledby="${headingId}">
      <h2 id="${headingId}">Riwayat Pesanan</h2>
      ${history.length ? `<ol class="detail-timeline">${entries(history.slice(0, 4))}</ol>` : "<p>Riwayat belum tersedia. Perbarui status untuk memeriksa lagi.</p>"}
      ${history.length > 4 ? `<details>
        <summary>Lihat seluruh riwayat ${icon("chevron")}</summary>
        <ol class="detail-timeline">${entries(history.slice(4))}</ol>
      </details>` : ""}
    </section>`;
  }

  function renderCases()
  {
    const complaint = snapshot.complaint;
    const cancellation = snapshot.cancellationRequest;
    const refunds = Array.isArray(snapshot.refunds) ? snapshot.refunds : [];
    if (!complaint && !cancellation && !snapshot.handling && refunds.length === 0)
    {
      return "";
    }
    return `<section class="detail-section" id="order-cases" aria-labelledby="cases-heading" tabindex="-1">
      <h2 id="cases-heading">Penanganan &amp; Penyelesaian</h2>
      ${snapshot.handling ? `<div class="detail-record">
        <h3>Perlu penanganan · ${escapeHtml(snapshot.handling.code)}</h3>
        <p>${escapeHtml(snapshot.handling.description)}</p>
        ${snapshot.handling.respondBy ? `<p>Batas respons: ${date(snapshot.handling.respondBy)}</p>` : ""}
        <p>Pilihan penyelesaian mengikuti penawaran dan keputusan toko. Belum ada perubahan item tanpa persetujuan Anda.</p>
      </div>` : ""}
      ${cancellation ? `<div class="detail-record">
        <h3>Permintaan Pembatalan · ${escapeHtml(cancellation.status)}</h3>
        <p>Alasan: ${escapeHtml(cancellation.reason)}</p>
        <p>${escapeHtml(cancellation.decision || "Menunggu keputusan toko. Pesanan belum otomatis dibatalkan.")}</p>
      </div>` : ""}
      ${complaint ? `<div class="detail-record" id="complaint-record">
        <h3>Komplain · ${escapeHtml(complaint.status)}</h3>
        <p><strong>${escapeHtml(complaint.category)}</strong></p>
        <p>${escapeHtml(complaint.description)}</p>
        ${complaint.photos?.length ? `<p>Bukti: ${complaint.photos.map((photo) => escapeHtml(photo.name)).join(", ")}</p>` : ""}
        <p>${escapeHtml(complaint.decision || "Toko meninjau laporan Anda. Target respons pertama maksimum 24 jam sejak pengajuan.")}</p>
        ${complaint.appealReason ? `<p>Alasan banding: ${escapeHtml(complaint.appealReason)}</p>` : ""}
        ${can("appeal") ? `<p>Banding satu kali sebelum ${date(complaint.appealDeadline)}. Gunakan tombol Ajukan Banding di area tindakan.</p>` : (complaint.status === "Ditolak" ? "<p>Banding tidak tersedia karena sudah digunakan atau batas waktunya berakhir.</p>" : "")}
      </div>` : ""}
      ${refunds.map((refund) => `<div class="detail-record">
        <h3>Refund · ${escapeHtml(refund.status)}</h3>
        <p><strong>${money(refund.amount)}</strong> · ${escapeHtml(refund.reason)}</p>
        <p>${refund.status === "Berhasil" ? "Pengembalian tercatat berhasil. Total pesanan historis tetap ditampilkan." : (refund.status === "Gagal" ? "Pengembalian belum berhasil. Toko menindaklanjuti melalui percobaan ulang atau penanganan manual." : "Dana belum dinyatakan kembali. Target pemrosesan maksimum 3 hari kerja sejak disetujui; waktu dana masuk mengikuti penyedia.")}</p>
        ${refund.approvedAt ? `<p>Disetujui: ${date(refund.approvedAt)}</p>` : ""}
      </div>`).join("\n")}
    </section>`;
  }

  function renderActions(primary, disabled)
  {
    const primaryLabel = primary === "pay" ? "Lanjutkan Pembayaran"
      : (primary === "confirmReceipt" ? "Selesaikan Pesanan" : actionLabels[primary]);
    return `<aside class="detail-action-rail" aria-labelledby="actions-heading">
      <h2 id="actions-heading" class="visually-hidden">Tindakan Pesanan</h2>
      <div class="detail-action-buttons">
        ${primary && can(primary) ? button(primaryLabel, primary, false, disabled) : ""}
        ${button("Lacak", "track", true, busy)}
        ${button("Bantuan", "help", true, busy)}
        ${can("complain") ? button("Ajukan Komplain", "complain", true, disabled) : ""}
        ${snapshot.complaint ? button("Lihat Komplain", "view-case", true, busy) : ""}
      </div>
      ${can("confirmReceipt") ? `<p class="detail-action-note">Periksa paket terlebih dahulu. Menyelesaikan pesanan akan menutup hak mengajukan komplain.</p>` : ""}
      ${can("cancel") || can("requestCancel") ? `<div class="detail-action-secondary">
        ${can("cancel") ? button("Batalkan Pesanan", "cancel", true, disabled) : ""}
        ${can("requestCancel") ? button("Ajukan Pembatalan", "requestCancel", true, disabled) : ""}
      </div>` : ""}
      <div class="detail-refresh">
        <button type="button" class="button button-secondary" data-order-action="refresh" ${reading || busy || Date.now() < retryUntil ? "disabled" : ""}>
          ${icon("refresh")} ${reading ? "Memperbarui…" : "Perbarui Status"}
        </button>
        <p>Diperbarui ${date(snapshot.snapshotAt)}</p>
      </div>
    </aside>`;
  }

  function render()
  {
    if (!snapshot)
    {
      return;
    }
    const [title, description, primary] = nextStep();
    const disabled = reading || busy || uncertain || stale || navigator.onLine === false;
    const trackingUrl = safeUrl(snapshot.trackingUrl);
    const recipient = snapshot.recipient;
    const method = snapshot.isCod ? "Bayar di tempat (COD)" : ({ qris: "QRIS", va: "Virtual Account", transfer: "Transfer bank", wallet: "E-wallet" }[snapshot.attempt?.method] || "Belum tersedia");
    const oldFocus = document.activeElement?.dataset?.orderAction;
    root.setAttribute("aria-busy", String(reading));
    root.innerHTML = `<div class="detail-layout">
      <section class="detail-section detail-summary" aria-labelledby="status-heading">
        <h2 id="status-heading">${escapeHtml(snapshot.orderStatus === "Terkirim" && !snapshot.complaint ? "Tiba di tujuan" : title)}</h2>
        <dl class="detail-meta">
          ${field("No. Pesanan", `<span class="detail-order-reference">
            <strong id="order-number" tabindex="-1">${escapeHtml(snapshot.orderNo)}</strong>
            <button type="button" class="icon-button" data-order-action="copy-order" aria-label="Salin nomor pesanan">${icon("copy")}</button>
          </span>`)}
          ${field("Tanggal pembelian", date(snapshot.createdAt))}
          ${snapshot.orderStatus === "Terkirim" && !snapshot.complaint ? field("Batas komplain", `<span class="detail-deadline">${icon("clock")}${date(snapshot.complaintDeadline)}</span>`) : ""}
        </dl>
        <div class="status-badges">
          ${statusBadge("Pesanan", snapshot.orderStatus)}
          ${statusBadge("Pembayaran", snapshot.paymentStatus)}
          ${statusBadge("Pengiriman", snapshot.shippingStatus)}
        </div>
        <p class="detail-status-description">${escapeHtml(description)}</p>
        ${snapshot.isCod && snapshot.paymentStatus === "Menunggu" ? `<p class="detail-warning">COD belum lunas. Bayar saat paket diterima. Konfirmasi penerimaan tidak menandai uang telah diterima toko.</p>` : ""}
        ${snapshot.paymentStatus === "Sengketa" ? `<p class="detail-warning">Pembayaran sedang dalam sengketa. Perubahan dana dibatasi sampai pemeriksaan selesai.</p>` : ""}
      </section>
      ${renderActions(primary, disabled)}
      <div class="detail-column detail-main-column">
        <section class="detail-section" aria-labelledby="items-heading">
          <div class="detail-section-heading">
            <h2 id="items-heading">Detail Produk</h2>
            <span class="detail-store-name">RylVa Green</span>
          </div>
          <ul class="detail-items">
            ${snapshot.items.map(renderItem).join("\n")}
          </ul>
          ${snapshot.greeting ? `<div class="detail-policy"><h3>Kartu Ucapan</h3><p>${escapeHtml(snapshot.greeting)}</p></div>` : ""}
          ${snapshot.note ? `<div class="detail-policy"><h3>Catatan Pesanan</h3><p>${escapeHtml(snapshot.note)}</p></div>` : ""}
        </section>
        <section class="detail-section" id="delivery-section" aria-labelledby="delivery-heading">
          <div class="detail-section-heading">
            <h2 id="delivery-heading">Info Pengiriman</h2>
            <button class="button button-secondary" type="button" data-order-action="track">Lihat Detail</button>
          </div>
          <dl class="detail-fields">
            ${field("Kurir", escapeHtml(snapshot.courierName || "Belum tersedia"))}
            ${field("No. Resi", trackingNumber())}
            ${field("Penerima", recipient ? `<address>
              <strong>${escapeHtml(recipient.name || "Nama belum tersedia")}</strong>
              <small>${escapeHtml(recipient.phone || "Telepon belum tersedia")}</small>
              ${escapeHtml(recipient.address || "Alamat belum tersedia")}
            </address>` : "Alamat penerima belum tersedia. Perbarui informasi pesanan.")}
            ${field("Jadwal kirim", deliveryDate(snapshot.deliveryDate) + "<br>" + escapeHtml(snapshot.deliverySlot || "Slot belum tersedia"))}
          </dl>
          ${trackingUrl ? `<a class="button button-secondary summary-link" href="${trackingUrl}" target="_blank" rel="noopener noreferrer">Lacak Pengiriman</a>` : ""}
          <p class="detail-policy">Perubahan alamat atau jadwal harus diminta kepada toko sebelum dikirim dan mengikuti ketentuan layanan. Data pesanan tidak dapat diubah sendiri di halaman ini.</p>
        </section>
        <section class="detail-section" aria-labelledby="cost-heading">
          <div class="detail-section-heading">
            <h2 id="cost-heading">Rincian Pembayaran</h2>
            ${snapshot.receiptAvailable ? `<button type="button" class="button button-secondary" data-order-action="receipt" ${busy ? "disabled" : ""}>Bukti Pelunasan</button>` : ""}
          </div>
          <dl class="detail-meta detail-payment-method">
            ${field("Metode pembayaran", escapeHtml(method))}
          </dl>
          <dl class="price-breakdown">
            ${price("Subtotal produk", snapshot.subtotalAmount)}
            ${price("Ongkos kirim", snapshot.shippingAmount)}
            ${price("Total belanja", snapshot.totalAmount, true)}
          </dl>
          <div class="detail-policy">
            <p>Dana terverifikasi: <strong>${snapshot.verifiedPaidAmount === null ? "Belum tercatat" : money(snapshot.verifiedPaidAmount)}</strong></p>
            <p>Status pembayaran: ${escapeHtml(snapshot.paymentStatus)}</p>
          </div>
          ${adapter.paymentUrl && primary !== "pay" ? `<button type="button" class="text-button" data-order-action="pay" ${busy ? "disabled" : ""}>Lihat Pembayaran</button>` : ""}
        </section>
        ${renderCases()}
        ${renderHistory()}
      </div>
    </div>`;
    if (oldFocus && !dialog.open)
    {
      root.querySelector(`[data-order-action="${oldFocus}"]`)?.focus({ preventScroll: true });
    }
    root.querySelectorAll(".detail-photo img").forEach((image) =>
    {
      image.addEventListener("error", () =>
      {
        image.hidden = true;
        image.nextElementSibling.hidden = false;
      }, { once: true });
    });
    armDeadline();
  }

  function armDeadline()
  {
    window.clearTimeout(deadlineTimer);
    const deadline = snapshot.complaint?.status === "Ditolak" ? snapshot.complaint.appealDeadline : snapshot.complaintDeadline;
    const remaining = Date.parse(deadline) - serverTime();
    if (remaining > 0)
    {
      deadlineTimer = window.setTimeout(() =>
      {
        render();
        announce("Batas waktu tindakan berubah. Perbarui status sebelum melanjutkan.");
      }, Math.min(2147483647, Math.ceil(remaining) + 1));
    }
  }

  function connectionNotice()
  {
    const offline = navigator.onLine === false || (adapter.isPreview && adapter.scenario === "offline");
    connection.hidden = !offline;
    connection.textContent = offline ? "Koneksi terputus. Data terakhir ditampilkan; sambungkan kembali dan perbarui status sebelum melakukan tindakan." : "";
  }

  function pageError(error)
  {
    root.setAttribute("aria-busy", "false");
    root.innerHTML = `<section class="payment-panel empty-state">
      <span class="status-mark">${icon("alert")}</span>
      <h2 tabindex="-1">Detail pesanan belum tersedia</h2>
      <p>${escapeHtml(errors[error.code] || errors.loadError)}</p>
      ${button("Coba Muat Lagi", "refresh", false, Date.now() < retryUntil)}
      ${button("Panduan Akses", "help", true)}
    </section>`;
    announce(errors[error.code] || errors.loadError);
  }

  async function load()
  {
    if (reading || busy || Date.now() < retryUntil)
    {
      return false;
    }
    if (navigator.onLine === false)
    {
      connectionNotice();
      if (!snapshot)
      {
        pageError({ code: "offline" });
      }
      return false;
    }
    reading = true;
    if (snapshot)
    {
      render();
    }
    try
    {
      const nextSnapshot = await adapter.getSnapshot();
      if (!validSnapshot(nextSnapshot))
      {
        throw { code: orderStatuses.includes(nextSnapshot?.orderStatus) ? "invalid" : "unknown" };
      }
      snapshot = nextSnapshot;
      receivedAt = performance.now();
      uncertain = false;
      stale = false;
      reading = false;
      render();
      connectionNotice();
      return true;
    }
    catch (error)
    {
      reading = false;
      if (error.code === "rateLimit")
      {
        retryUntil = Date.now() + (error.retryAfter || 30) * 1000;
        window.setTimeout(() =>
        {
          if (snapshot)
          {
            render();
          }
          else
          {
            pageError(error);
          }
        }, Math.max(0, retryUntil - Date.now()) + 1);
      }
      if (["login", "session", "denied", "verification", "notFound", "unavailable", "invalid", "unknown"].includes(error.code))
      {
        snapshot = null;
        dirty = false;
        if (dialog.open)
        {
          dialog.close();
        }
        dialogContent.replaceChildren();
        files = [];
      }
      if (snapshot)
      {
        stale = true;
        render();
        announce((errors[error.code] || errors.service) + " Data terakhir tetap ditampilkan; perbarui sebelum bertindak.");
      }
      else
      {
        pageError(error);
      }
      return false;
    }
    finally
    {
      reading = false;
    }
  }

  function openDialog(title, content)
  {
    dialog.classList.toggle("detail-tracking-dialog", title === "Lacak Pengiriman");
    trigger = document.activeElement;
    activeAction = null;
    dirty = false;
    files = [];
    photoValidationError = "";
    requestKey = null;
    formValidationAttempted = false;
    dialogRevision += 1;
    document.getElementById("dialog-title").textContent = title;
    dialogContent.innerHTML = content;
    if (!dialog.open)
    {
      dialog.showModal();
    }
    dialog.scrollTop = 0;
    const firstInput = dialogContent.querySelector("select, textarea, input");
    (firstInput || document.getElementById("dialog-title")).focus();
  }

  function requestClose()
  {
    if (busy)
    {
      return;
    }
    if (dirty)
    {
      const discard = document.getElementById("discard-draft");
      discard.hidden = false;
      discard.querySelector("button").focus();
      return;
    }
    dialog.close();
  }

  function help()
  {
    openDialog("Panduan Pesanan", `<div class="dialog-body">
      <p>Gunakan akun pelanggan yang membuat pesanan. Periksa nomor pesanan saat meminta bantuan melalui kanal toko yang tersedia.</p>
      <p>Pembatalan sebelum persiapan berbeda dengan permintaan saat disiapkan atau dikirim. Permintaan belum berarti disetujui.</p>
      <p>Komplain dapat diajukan 24 jam sejak Terkirim, sebelum Anda mengonfirmasi penerimaan. Refund mengikuti keputusan dan konfirmasi penyedia.</p>
      <p>Dalam pratinjau ini, daftar pesanan, login pelanggan dan kanal kontak toko belum terhubung. Tidak ada pesan yang dikirim ke toko.</p>
    </div>
    <div class="dialog-actions">${button("Tutup Panduan", "close")}</div>`);
  }

  function showTracking()
  {
    if (!snapshot)
    {
      return;
    }
    const trackingUrl = safeUrl(snapshot.trackingUrl);
    const events = Array.isArray(snapshot.history) ? snapshot.history : [];
    const dispatched = events.find((event) => event.title === "Diserahkan ke kurir");
    openDialog("Lacak Pengiriman", `<div class="tracking-layout">
      <section class="tracking-information" aria-label="Informasi pengiriman">
        <dl class="detail-fields">
          ${field("Kurir", escapeHtml(snapshot.courierName || "Belum tersedia"))}
          ${field("Jadwal Kirim", deliveryDate(snapshot.deliveryDate))}
        </dl>
        <div class="tracking-info-block">
          <p>Nomor Resi</p>
          ${trackingNumber()}
        </div>
        <div class="tracking-info-block">
          <p>Tanggal Dikirim</p>
          <strong>${dispatched ? date(dispatched.at) : "Belum diserahkan ke kurir"}</strong>
        </div>
        <div class="tracking-info-block">
          <p>Penerima</p>
          <strong>${escapeHtml(snapshot.recipient?.name || "Belum tersedia")}</strong>
          <p>${escapeHtml(snapshot.recipient?.address || "Alamat belum tersedia")}</p>
        </div>
        ${trackingUrl ? `<a class="button button-secondary" href="${trackingUrl}" target="_blank" rel="noopener noreferrer">Buka Pelacakan Kurir</a>` : '<p class="tracking-service-note">Tautan pelacakan langsung belum tersedia. Riwayat pesanan yang tercatat ditampilkan di samping.</p>'}
      </section>
      <section class="tracking-activity" aria-labelledby="tracking-history-heading">
        <div class="tracking-current-status">
          ${icon("truck")}
          <span>Status Pengiriman</span>
          <span class="badge" data-status="${escapeHtml(snapshot.shippingStatus)}">${escapeHtml(snapshot.shippingStatus)}</span>
        </div>
        <h2 id="tracking-history-heading">Riwayat Pesanan & Pengiriman</h2>
        ${events.length ? `<ol class="tracking-timeline">${events.map((event, index) => `<li ${index === 0 ? 'aria-current="step"' : ""}>
          <time datetime="${escapeHtml(event.at)}">${date(event.at)}</time>
          <span class="tracking-point" aria-hidden="true"></span>
          <div>
            <h3>${escapeHtml(event.title)}</h3>
            <p>${escapeHtml(event.detail)}</p>
          </div>
        </li>`).join("\n")}</ol>` : '<p>Riwayat belum tersedia. Perbarui status pesanan untuk memeriksa kembali.</p>'}
      </section>
    </div>
    <div class="dialog-actions">${button("Tutup", "close")}</div>`);
  }

  function trackingNumber()
  {
    return snapshot.trackingNumber ? `<span class="detail-tracking-number">
      <strong>${escapeHtml(snapshot.trackingNumber)}</strong>
      <button type="button" class="icon-button" data-order-action="copy-tracking" aria-label="Salin nomor resi">${icon("copy")}</button>
    </span>` : "Belum tersedia. Resi muncul setelah paket diserahkan ke kurir.";
  }

  function reasonInput(label)
  {
    return `<div class="detail-input-group">
      <label for="order-reason">${label} <span>(wajib)</span></label>
      <textarea id="order-reason" name="reason" maxlength="2000" aria-describedby="reason-error"></textarea>
      <p class="detail-field-error" id="reason-error"></p>
    </div>`;
  }

  function showAction(action)
  {
    if (!can(action) || reading || busy)
    {
      announce("Tindakan belum tersedia. Perbarui status pesanan.");
      return;
    }
    let content = "";
    if (action === "confirmReceipt")
    {
      content = `<p>Pastikan paket <strong>${escapeHtml(snapshot.orderNo)}</strong> telah diterima dan diperiksa.</p>
        <p class="detail-warning">Pesanan menjadi Selesai dan Anda tidak dapat mengajukan komplain lagi. Jika ada masalah, batalkan konfirmasi dan ajukan komplain saat masih tersedia.</p>
        ${snapshot.isCod ? "<p>Konfirmasi ini tidak menandai pembayaran COD telah diterima toko.</p>" : ""}`;
    }
    if (["cancel", "requestCancel"].includes(action))
    {
      content = `<p>Pesanan <strong>${escapeHtml(snapshot.orderNo)}</strong> · ${escapeHtml(snapshot.orderStatus)}</p>
        <p>${action === "cancel" ? (snapshot.paymentStatus === "Berhasil" ? "Pesanan akan dibatalkan dan refund penuh diproses. Dana belum tentu langsung masuk ke metode asal." : "Pembatalan diperiksa lebih dahulu. Jangan membayar dari instruksi lama setelah pembatalan disetujui.") : "Permintaan ini menunggu keputusan toko; pesanan belum dibatalkan."}</p>
        ${snapshot.orderStatus === "Dikirim" ? "<p class=\"detail-warning\">Penghentian pengiriman tidak dijamin. Refund produk tahan lama hanya setelah kembali dan dinilai layak; ongkir tidak dikembalikan. Produk mudah layu mengikuti bukti tanggung jawab toko/kurir/pelanggan.</p>" : ""}
        ${snapshot.orderStatus === "Sedang Disiapkan" ? "<p class=\"detail-warning\">Produk mudah layu yang sedang disiapkan tidak dapat dibatalkan kecuali karena kesalahan toko. Produk tahan lama harus belum dikemas atau diserahkan.</p>" : ""}
        ${reasonInput("Alasan pembatalan")}`;
    }
    if (action === "appeal")
    {
      content = `<p>Banding hanya satu kali, sebelum ${date(snapshot.complaint.appealDeadline)}. Keputusan SuperAdmin bersifat final di dalam sistem.</p>
        ${reasonInput("Alasan banding")}`;
    }
    if (action === "complain")
    {
      const categories = window.RylvaOrderDetailPreview.categories.filter((category) => category !== "Terlambat lebih dari 2 jam" || snapshot.hasPerishable);
      content = `<p>Ajukan sebelum ${date(snapshot.complaintDeadline)}. Pesanan tidak diselesaikan otomatis selama komplain terbuka.</p>
        <div class="detail-input-group">
          <label for="complaint-category">Kategori (wajib)</label>
          <select id="complaint-category" name="category" aria-describedby="category-error">
            <option value="">Pilih kategori</option>
            ${categories.map((category) => `<option>${escapeHtml(category)}</option>`).join("\n")}
          </select>
          <p class="detail-field-error" id="category-error"></p>
        </div>
        <div class="detail-input-group">
          <label for="complaint-description">Jelaskan masalah (wajib)</label>
          <textarea id="complaint-description" name="description" maxlength="2000" aria-describedby="description-error"></textarea>
          <p class="detail-field-error" id="description-error"></p>
        </div>
        <div class="detail-input-group">
          <label for="complaint-photos" id="photos-label">Foto bukti (wajib, 2–5 foto)</label>
          <input id="complaint-photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple aria-describedby="photos-help photos-error">
          <small id="photos-help">JPEG, PNG atau WebP. Maksimal 5 MB per foto dan 4000 × 4000 px. Kategori Tidak diterima tidak wajib foto.</small>
          <ul id="selected-photos" class="detail-file-list"></ul>
          <div id="clear-photos-control" hidden>${button("Hapus Foto Terpilih", "clear-photos", true)}</div>
          <p class="detail-field-error" id="photos-error"></p>
        </div>`;
    }
    openDialog(actionLabels[action], `<form id="order-action-form" class="detail-form" novalidate>
      ${content}
      <p id="form-error" class="detail-field-error" role="alert" tabindex="-1"></p>
      <div class="detail-actions">
        ${button("Batal", "close", true)}
        <button class="button" type="submit" id="order-submit">${escapeHtml(actionLabels[action])}</button>
      </div>
      <div id="discard-draft" class="detail-warning" hidden>
        <p>Buang isian yang belum dikirim?</p>
        <div class="detail-actions">
          ${button("Lanjut Mengisi", "keep-draft", true)}
          ${button("Buang Isian", "discard")}
        </div>
      </div>
    </form>`);
    activeAction = action;
    requestKey = window.crypto.randomUUID();
  }

  function fieldError(id, message)
  {
    const input = document.getElementById(id);
    input?.setAttribute("aria-invalid", message ? "true" : "false");
    const errorId = { "order-reason": "reason-error", "complaint-category": "category-error", "complaint-description": "description-error", "complaint-photos": "photos-error" }[id];
    document.getElementById(errorId).textContent = message;
  }

  async function validatePhotos(input)
  {
    const revision = dialogRevision;
    const selectionRevision = ++photoRevision;
    const validFiles = [];
    validatingFiles = true;
    files = [];
    fieldError(input.id, "");
    const selected = Array.from(input.files);
    let message = selected.length > 5 ? "Pilih maksimal 5 foto." : "";
    for (const file of selected.slice(0, 5))
    {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)
      {
        message = "Gunakan JPEG, PNG atau WebP dengan ukuran maksimal 5 MB per foto.";
        break;
      }
      try
      {
        const bitmap = await createImageBitmap(file);
        const tooLarge = bitmap.width > 4000 || bitmap.height > 4000;
        bitmap.close();
        if (tooLarge)
        {
          message = "Dimensi foto maksimal 4000 × 4000 px.";
          break;
        }
      }
      catch
      {
        message = "Foto tidak dapat dibaca. Pilih berkas gambar lain.";
        break;
      }
      if (revision !== dialogRevision || selectionRevision !== photoRevision || !input.isConnected)
      {
        return;
      }
      validFiles.push(file);
    }
    if (revision !== dialogRevision || selectionRevision !== photoRevision || !input.isConnected)
    {
      return;
    }
    files = message ? [] : validFiles;
    photoValidationError = message;
    fieldError(input.id, message);
    document.getElementById("selected-photos").innerHTML = files.map((file) => `<li>${escapeHtml(file.name)}</li>`).join("\n");
    document.getElementById("clear-photos-control").hidden = input.files.length === 0;
    validatingFiles = false;
    refreshValidation();
  }

  function validateFields(form)
  {
    const payload = Object.fromEntries(new FormData(form));
    payload.photos = files;
    let invalid = false;
    if (["cancel", "requestCancel", "appeal"].includes(activeAction))
    {
      const message = payload.reason.trim() ? "" : "Isi alasan agar permintaan dapat ditinjau.";
      fieldError("order-reason", message);
      invalid ||= Boolean(message);
    }
    if (activeAction === "complain")
    {
      fieldError("complaint-category", payload.category ? "" : "Pilih kategori masalah.");
      fieldError("complaint-description", payload.description.trim() ? "" : "Jelaskan masalah yang Anda alami.");
      const photoMessage = photoValidationError || (payload.category !== "Tidak diterima" && files.length < 2
        ? "Lampirkan minimal 2 foto yang dapat dibaca." : "");
      fieldError("complaint-photos", photoMessage);
      invalid = !payload.category || !payload.description.trim() || Boolean(photoMessage);
    }
    return { payload, invalid };
  }

  function refreshValidation()
  {
    const form = document.getElementById("order-action-form");
    if (!formValidationAttempted || !form || busy || uncertain || validatingFiles)
    {
      return;
    }
    const { invalid } = validateFields(form);
    document.getElementById("form-error").textContent = invalid
      ? "Periksa isian yang ditandai sebelum mengirim." : "";
  }

  async function submit(event)
  {
    event.preventDefault();
    if (busy || !activeAction)
    {
      return;
    }
    const errorRegion = document.getElementById("form-error");
    if (!can(activeAction) || validatingFiles)
    {
      errorRegion.textContent = validatingFiles ? "Tunggu pemeriksaan foto selesai." : "Tindakan belum tersedia. Perbarui status sebelum mengirim lagi.";
      errorRegion.focus();
      return;
    }
    const form = event.target;
    formValidationAttempted = true;
    const { payload, invalid } = validateFields(form);
    if (invalid)
    {
      errorRegion.textContent = "Periksa isian yang ditandai sebelum mengirim.";
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    busy = true;
    errorRegion.textContent = "";
    const submitButton = document.getElementById("order-submit");
    submitButton.textContent = "Mengirim…";
    form.querySelectorAll("button, input, select, textarea").forEach((control) =>
    {
      control.disabled = true;
    });
    try
    {
      const nextSnapshot = await adapter.perform(activeAction, payload, snapshot.version, requestKey);
      if (!validSnapshot(nextSnapshot))
      {
        throw { code: "invalid" };
      }
      snapshot = nextSnapshot;
      receivedAt = performance.now();
      dirty = false;
      busy = false;
      dialog.close();
      render();
      announce((adapter.isPreview ? "Pratinjau: " : "") + "Tindakan berhasil dicatat. Status pesanan: " + snapshot.orderStatus + ".");
    }
    catch (error)
    {
      busy = false;
      uncertain = ["timeout", "service", "conflict", "duplicate", "csrf", "offline", "invalid"].includes(error.code);
      if (["login", "session", "denied"].includes(error.code))
      {
        snapshot = null;
        dirty = false;
        dialog.close();
        dialogContent.replaceChildren();
        files = [];
        pageError(error);
        return;
      }
      if (error.code === "rateLimit")
      {
        retryUntil = Date.now() + (error.retryAfter || 30) * 1000;
        uncertain = true;
      }
      errorRegion.textContent = errors[error.code] || errors.service;
      formValidationAttempted = false;
      if (error.code === "rateLimit")
      {
        errorRegion.textContent += " Coba setelah " + (error.retryAfter || 30) + " detik.";
      }
      if (uncertain)
      {
        errorRegion.insertAdjacentHTML("beforeend", `<br>${button("Perbarui Status", "reconcile", true)}`);
      }
      form.querySelectorAll("button, input, select, textarea").forEach((control) =>
      {
        control.disabled = false;
      });
      submitButton.disabled = uncertain;
      submitButton.textContent = actionLabels[activeAction];
      errorRegion.focus();
      render();
    }
  }

  async function receipt()
  {
    openDialog("Bukti Pelunasan", `<div class="dialog-body" aria-busy="true"><p>Memuat bukti pelunasan…</p></div>`);
    const revision = dialogRevision;
    try
    {
      const documentSnapshot = await adapter.getReceipt();
      if (!dialog.open || revision !== dialogRevision)
      {
        return;
      }
      dialogContent.innerHTML = `<div class="dialog-body">
        <p><strong>${escapeHtml(documentSnapshot.orderNo)}</strong></p>
        <p>Dana terverifikasi: ${money(documentSnapshot.verifiedPaidAmount)}</p>
        <p>Status: ${escapeHtml(documentSnapshot.paymentStatus)}</p>
        <p>Dokumen contoh untuk pratinjau. Bukti pelunasan resmi belum terhubung.</p>
      </div>
      <div class="dialog-actions">${button("Tutup", "close")}</div>`;
    }
    catch (error)
    {
      if (!dialog.open || revision !== dialogRevision)
      {
        return;
      }
      dialogContent.innerHTML = `<div class="dialog-body"><p>${escapeHtml(errors[error.code] || errors.document)}</p></div>
        <div class="dialog-actions">${button("Coba Muat Lagi", "receipt")}${button("Tutup", "close", true)}</div>`;
    }
  }

  async function copyValue(value)
  {
    try
    {
      await navigator.clipboard.writeText(value);
      announce("Berhasil disalin: " + value);
    }
    catch
    {
      announce("Salin manual dengan memilih teks berikut: " + value);
    }
  }

  document.addEventListener("click", async (event) =>
  {
    const control = event.target.closest("[data-order-action], [data-action='close-dialog']");
    if (!control || control.disabled)
    {
      return;
    }
    const action = control.dataset.orderAction || "close";
    if (action === "refresh")
    {
      if (await load())
      {
        announce("Informasi pesanan diperbarui.");
      }
    }
    else if (action === "reconcile")
    {
      if (await load())
      {
        const available = can(activeAction);
        document.getElementById("form-error").textContent = available ? "Status diperbarui. Tinjau isian sebelum mencoba lagi." : "Status berubah. Tindakan ini tidak lagi tersedia; tutup formulir untuk melihat detail terbaru.";
        document.getElementById("order-submit").disabled = !available;
      }
      else
      {
        const formError = document.getElementById("form-error");
        if (formError)
        {
          formError.textContent = "Status belum dapat diperbarui. Coba lagi setelah koneksi atau layanan pulih.";
          formError.insertAdjacentHTML("beforeend", button("Perbarui Status", "reconcile", true));
        }
      }
    }
    else if (action === "close")
    {
      requestClose();
    }
    else if (action === "discard")
    {
      dirty = false;
      dialog.close();
    }
    else if (action === "keep-draft")
    {
      document.getElementById("discard-draft").hidden = true;
      dialogContent.querySelector("textarea, select")?.focus();
    }
    else if (action === "clear-photos")
    {
      files = [];
      photoRevision += 1;
      validatingFiles = false;
      document.getElementById("complaint-photos").value = "";
      document.getElementById("selected-photos").replaceChildren();
      document.getElementById("clear-photos-control").hidden = true;
      fieldError("complaint-photos", "");
      photoValidationError = "";
      dirty = true;
      refreshValidation();
    }
    else if (action === "pay" || (action === "back" && query.get("from") === "payment"))
    {
      if (snapshot && adapter.paymentUrl)
      {
        window.location.assign(adapter.paymentUrl());
      }
      else
      {
        help();
      }
    }
    else if (action === "back")
    {
      window.location.assign(window.RylvaOrderNavigation.listUrl());
    }
    else if (action === "help")
    {
      help();
    }
    else if (action === "receipt")
    {
      await receipt();
    }
    else if (action === "track")
    {
      showTracking();
    }
    else if (action === "view-case")
    {
      const caseSection = document.getElementById("order-cases");
      caseSection?.scrollIntoView({ block: "start", behavior: "instant" });
      caseSection?.focus({ preventScroll: true });
    }
    else if (action === "copy-order")
    {
      await copyValue(snapshot.orderNo);
    }
    else if (action === "copy-tracking")
    {
      await copyValue(snapshot.trackingNumber);
    }
    else if (Object.hasOwn(actionLabels, action))
    {
      showAction(action);
    }
  });

  dialog.addEventListener("submit", submit);
  dialog.addEventListener("input", () =>
  {
    dirty = true;
    refreshValidation();
  });
  dialog.addEventListener("change", (event) =>
  {
    dirty = true;
    if (event.target.id === "complaint-photos")
    {
      validatePhotos(event.target);
    }
    if (event.target.id === "complaint-category")
    {
      document.getElementById("photos-label").textContent = event.target.value === "Tidak diterima" ? "Foto bukti (opsional)" : "Foto bukti (wajib, 2–5 foto)";
      fieldError("complaint-photos", photoValidationError);
      refreshValidation();
    }
  });
  dialog.addEventListener("cancel", (event) =>
  {
    event.preventDefault();
    requestClose();
  });
  dialog.addEventListener("close", () =>
  {
    dirty = false;
    activeAction = null;
    files = [];
    validatingFiles = false;
    dialogRevision += 1;
    dialogContent.replaceChildren();
    if (trigger?.isConnected && !trigger.disabled)
    {
      trigger.focus({ preventScroll: true });
    }
    else
    {
      document.getElementById("order-number")?.focus({ preventScroll: true });
    }
  });
  window.addEventListener("beforeunload", (event) =>
  {
    if (dirty)
    {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  window.addEventListener("offline", () =>
  {
    connectionNotice();
    render();
  });
  window.addEventListener("online", async () =>
  {
    connectionNotice();
    await load();
  });
  document.addEventListener("visibilitychange", () =>
  {
    if (!document.hidden && snapshot && !busy)
    {
      render();
    }
  });
  if (query.get("from") === "payment")
  {
    document.getElementById("order-breadcrumb").textContent = "Pembayaran";
    document.querySelector("#order-back span").textContent = "Kembali ke Pembayaran";
  }
  window.setTimeout(() =>
  {
    if (reading && !snapshot)
    {
      root.innerHTML = `<section class="payment-panel empty-state">
        <h2>Masih memuat pesanan</h2>
        <p>Proses lebih lama dari biasanya. Muat ulang atau kembali ke halaman sebelumnya.</p>
        ${button("Muat Ulang Halaman", "reload")}
      </section>`;
      root.querySelector("button").addEventListener("click", () => window.location.reload());
    }
  }, 10000);
  load().then((loaded) =>
  {
    if (loaded && query.get("intent") === "tracking")
    {
      showTracking();
    }
    else if (loaded && query.get("intent") === "help")
    {
      help();
    }
    else if (loaded && query.get("intent") === "paymentDetails")
    {
      document.getElementById("cost-heading")?.scrollIntoView({ block: "start" });
    }
    else if (loaded && ["confirmReceipt", "complain"].includes(query.get("intent")) && can(query.get("intent")))
    {
      showAction(query.get("intent"));
    }
  });
})();

