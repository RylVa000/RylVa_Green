"use strict";

(() =>
{
  const root = document.getElementById("payment-root");
  const dialog = document.getElementById("payment-dialog");
  const dialogContent = document.getElementById("dialog-content");
  const announcement = document.getElementById("payment-announcement");
  const notice = document.getElementById("connection-notice");
  const adapter = window.RylvaPaymentAdapter || window.RylvaPaymentPreview?.createAdapter();
  const currencyFormatter = new Intl.NumberFormat("id-ID",
  {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  });
  const dateFormatter = new Intl.DateTimeFormat("id-ID",
  {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta"
  });
  const knownPaymentStatuses =
  [
    "Menunggu", "Berhasil", "Gagal", "Kedaluwarsa", "Dibatalkan",
    "Perlu Ditinjau", "Refund Diproses", "Dikembalikan Sebagian",
    "Dikembalikan Penuh", "Sengketa"
  ];
  const methodNames =
  {
    qris: "QRIS",
    va: "Virtual Account",
    transfer: "Transfer bank",
    wallet: "E-wallet",
    cod: "Bayar di tempat (COD)"
  };
  const errorMessages =
  {
    loadError: ["Pembayaran belum dapat dimuat", "Coba muat kembali. Pesanan yang sama akan tetap digunakan."],
    service: ["Layanan sedang bermasalah", "Status pembayaran belum dapat diperbarui. Jangan membayar ulang sebelum hasil sebelumnya dipastikan."],
    gateway: ["Instruksi belum dapat dibuat", "Penyedia pembayaran belum dapat dihubungi. Periksa status sebelum mencoba lagi."],
    maintenance: ["Layanan sedang dalam pemeliharaan", "Silakan periksa kembali nanti. Tidak ada perubahan pembayaran yang dapat dipastikan dari halaman ini."],
    rateLimit: ["Terlalu banyak permintaan", "Tunggu sesuai batas layanan sebelum mencoba lagi."],
    login: ["Masuk untuk melihat pembayaran", "Gunakan akun pelanggan yang dipakai saat membuat pesanan."],
    session: ["Sesi Anda telah berakhir", "Masuk kembali dengan akun pemilik pesanan untuk melanjutkan."],
    denied: ["Pembayaran tidak dapat diakses", "Gunakan akun pelanggan pemilik pesanan. Data transaksi ini tidak ditampilkan."],
    verification: ["Verifikasi akun diperlukan", "Selesaikan verifikasi akun pelanggan sebelum menjalankan tindakan yang dibatasi."],
    notFound: ["Pesanan tidak ditemukan", "Pesanan tidak ditemukan atau tidak dapat diakses oleh akun ini."],
    invalid: ["Data pembayaran belum lengkap", "Nominal atau status belum dapat dipastikan. Jangan membayar dari instruksi yang belum lengkap."],
    unknown: ["Status belum dapat ditampilkan", "Informasi pembayaran perlu diperiksa. Jangan melakukan pembayaran baru dahulu."],
    offline: ["Koneksi terputus", "Sambungkan kembali untuk mendapatkan status pembayaran terbaru."],
    timeout: ["Hasil permintaan sedang diperiksa", "Jangan membayar ulang dahulu. Perbarui status untuk mengetahui hasil permintaan sebelumnya."],
    conflict: ["Status pesanan berubah", "Muat informasi terbaru dan tinjau kembali tindakan yang masih tersedia."],
    csrf: ["Form perlu diperbarui", "Perbarui informasi halaman sebelum mengirim ulang permintaan."],
    validation: ["Pilih metode yang tersedia", "Pilihan sebelumnya belum dapat digunakan. Periksa kembali metode pembayaran."],
    attemptLimit: ["Batas percobaan tercapai", "Pesanan ini telah mencapai batas percobaan pembayaran. Lihat detail atau panduan untuk langkah berikutnya."],
    document: ["Bukti pelunasan belum dapat dimuat", "Pembayaran tetap tercatat sesuai statusnya. Coba muat dokumen lagi tanpa mengulangi pembayaran."]
  };

  let snapshot = null;
  let busyAction = null;
  let reading = false;
  let operationUncertain = false;
  let operationError = null;
  let countdownStop = null;
  let dialogTrigger = null;
  let qrFailed = false;
  let feedbackTimeout = null;
  let feedbackMessage = null;
  let retryBlockedUntil = 0;
  let dialogRevision = 0;
  let snapshotReceivedAt = 0;
  let snapshotServerTime = 0;
  let deadlineTimeout = null;
  let handledDeadlineKey = null;

  function escapeHtml(value)
  {
    return String(value ?? "").replace(/[&<>"']/g, (character) =>
    {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function markup(lines)
  {
    return lines.filter((line) => line !== null && line !== false).join("\n");
  }

  function icon(name)
  {
    return markup([
      '<svg class="icon" aria-hidden="true">',
      '  <use href="#icon-' + escapeHtml(name) + '"/>',
      '</svg>'
    ]);
  }

  function money(amount)
  {
    return Number.isSafeInteger(amount) ? currencyFormatter.format(amount).replace(/\s/g, "") : "Belum tersedia";
  }

  function dateTime(value)
  {
    return value && Number.isFinite(Date.parse(value))
      ? dateFormatter.format(new Date(value)) + " WIB"
      : "Belum tersedia";
  }

  function methodName(methodId)
  {
    return methodNames[methodId] || "Metode belum tersedia";
  }

  function formatDeliveryDate(value)
  {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    {
      return "Lihat detail pesanan";
    }
    return new Intl.DateTimeFormat("id-ID",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta"
    }).format(new Date(value + "T00:00:00+07:00"));
  }

  function button(label, action, options = {})
  {
    return markup([
      '<button type="button" id="' + (options.id || "action-" + action) + '"',
      '  class="' + (options.className || "button") + '" data-action="' + action + '"',
      (options.disabled ? '  disabled aria-disabled="true"' : "") + '>',
      options.icon ? icon(options.icon) : null,
      '  ' + escapeHtml(label),
      '</button>'
    ]);
  }

  function copyButton(label, value, id)
  {
    return markup([
      '<button type="button" class="icon-button" id="' + id + '"',
      '  data-action="copy" data-copy="' + escapeHtml(value) + '"',
      '  aria-label="' + escapeHtml(label) + '">',
      icon("copy"),
      '</button>'
    ]);
  }

  function announce(message, showFeedback = false)
  {
    announcement.textContent = message;
    if (showFeedback)
    {
      feedbackMessage = message;
      updateFeedback();
      window.clearTimeout(feedbackTimeout);
      feedbackTimeout = window.setTimeout(() =>
      {
        feedbackMessage = null;
        updateFeedback();
      }, 3500);
    }
  }

  function updateFeedback()
  {
    const feedbackElement = document.getElementById("payment-feedback-text");
    if (feedbackElement)
    {
      feedbackElement.textContent = feedbackMessage || "Data diperbarui " + dateTime(snapshot.snapshotAt);
      feedbackElement.dataset.feedback = String(Boolean(feedbackMessage));
    }
  }

  function currentServerTime()
  {
    return snapshotServerTime + performance.now() - snapshotReceivedAt;
  }

  function isUnpaidOnline()
  {
    return snapshot && !snapshot.isCod && ["Menunggu", "Gagal"].includes(snapshot.paymentStatus);
  }

  function isDeadlinePassed()
  {
    return Boolean(snapshot?.expiresAt)
      && Date.parse(snapshot.expiresAt) <= currentServerTime();
  }

  function updateSnapshot(value)
  {
    snapshot = value;
    snapshotReceivedAt = performance.now();
    snapshotServerTime = Date.parse(value.serverNow);
    window.clearTimeout(deadlineTimeout);
    const deadlineKey = snapshot.orderNo + ":" + snapshot.attempt?.id + ":" + snapshot.expiresAt;
    if (isUnpaidOnline() && snapshot.expiresAt && deadlineKey !== handledDeadlineKey)
    {
      deadlineTimeout = window.setTimeout(
        handleDeadline,
        Math.max(0, Math.ceil(Date.parse(snapshot.expiresAt) - currentServerTime()))
      );
    }
  }

  function handleDeadline()
  {
    if (!isUnpaidOnline())
    {
      return;
    }
    if (!isDeadlinePassed())
    {
      // A browser timeout can fire before a fractional deadline.
      const remainingTime = Date.parse(snapshot.expiresAt) - currentServerTime();
      deadlineTimeout = window.setTimeout(handleDeadline, Math.max(1, Math.ceil(remainingTime)));
      return;
    }
    const deadlineKey = snapshot.orderNo + ":" + snapshot.attempt?.id + ":" + snapshot.expiresAt;
    if (handledDeadlineKey === deadlineKey)
    {
      return;
    }
    handledDeadlineKey = deadlineKey;
    snapshot.uiState = "checking";
    if (dialog.open && (dialog.querySelector("#payment-method-form")
      || dialog.querySelector('[data-action="confirm-cancel"]')))
    {
      closeDialog();
    }
    renderSnapshot();
    announce("Batas waktu tampilan berakhir. Status pembayaran sedang diperiksa.", true);
    loadSnapshot();
  }

  function isLocked()
  {
    return busyAction || reading || operationUncertain
      || Date.now() < retryBlockedUntil
      || navigator.onLine === false
      || ["creating", "slow", "cancelling", "checking", "offline", "conflict"].includes(snapshot?.uiState)
      || (isUnpaidOnline() && isDeadlinePassed());
  }

  function isValidSnapshot(value)
  {
    return value
      && typeof value.orderNo === "string"
      && typeof value.orderStatus === "string"
      && knownPaymentStatuses.includes(value.paymentStatus)
      && value.currency === "IDR"
      && Number.isFinite(Date.parse(value.serverNow))
      && (value.isCod || !["Menunggu", "Gagal"].includes(value.paymentStatus)
        || Number.isFinite(Date.parse(value.expiresAt)))
      && [value.subtotalAmount, value.shippingAmount, value.totalAmount].every((amount) =>
      {
        return Number.isSafeInteger(amount) && amount >= 0;
      })
      && value.totalAmount === value.subtotalAmount + value.shippingAmount
      && Array.isArray(value.items)
      && value.items.length > 0
      && value.items.every((item) =>
      {
        return Number.isSafeInteger(item.quantity) && item.quantity > 0
          && Number.isSafeInteger(item.amount) && item.amount >= 0;
      });
  }

  function normalizeSnapshot(value)
  {
    if (!value || typeof value !== "object")
    {
      return value;
    }
    return {
      ...value,
      attempts: Array.isArray(value.attempts) ? value.attempts : [],
      refunds: Array.isArray(value.refunds) ? value.refunds : [],
      availableMethods: Array.isArray(value.availableMethods) ? value.availableMethods : [],
      allowedActions:
      {
        retry: value.allowedActions?.retry === true,
        changeMethod: value.allowedActions?.changeMethod === true,
        cancel: value.allowedActions?.cancel === true
      }
    };
  }

  function statusContent()
  {
    if (snapshot.caseCode === "PH-01")
    {
      return ["Pembayaran diterima", "Pesanan memerlukan penanganan ketersediaan barang. Lihat detail untuk mengikuti penyelesaiannya.", "alert"];
    }
    if (snapshot.caseCode === "PH-02")
    {
      return ["Pembayaran terlambat diterima", "Dana diterima setelah pesanan ditutup. Pemulihan atau pengembalian dana mengikuti hasil pemeriksaan.", "alert"];
    }
    if (snapshot.paymentStatus === "Perlu Ditinjau")
    {
      return ["Pembayaran perlu ditinjau", "Dana belum dapat dicocokkan dengan tagihan. Jangan mengirim pembayaran tambahan selama pemeriksaan.", "alert"];
    }
    if (snapshot.isCod && snapshot.paymentStatus === "Menunggu")
    {
      return ["Pesanan COD berhasil dibuat", "Pesanan siap diproses. Siapkan pembayaran saat pesanan diterima; pembayaran saat ini belum lunas.", "check"];
    }
    const statuses =
    {
      Menunggu: ["Selesaikan pembayaran Anda", "Pesanan sudah dibuat. Ikuti instruksi berikut sebelum batas pembayaran berakhir.", "clock"],
      Berhasil: ["Pembayaran berhasil", "Pembayaran telah terverifikasi. Ikuti proses pesanan melalui detail pesanan.", "check"],
      Gagal: ["Pembayaran belum berhasil", "Percobaan terakhir gagal. Anda dapat mencoba lagi selama pesanan masih aktif dan batas percobaan tersedia.", "close"],
      Kedaluwarsa: ["Waktu pembayaran berakhir", "Pesanan telah ditutup setelah pemeriksaan. Jangan gunakan instruksi pembayaran sebelumnya.", "clock"],
      Dibatalkan: ["Pesanan dibatalkan", "Instruksi pembayaran pesanan ini tidak lagi aktif. Lihat detail untuk informasi pesanan.", "close"],
      "Refund Diproses": ["Pengembalian dana diproses", "Permintaan pengembalian sedang berjalan. Dana belum dinyatakan kembali sebelum ada konfirmasi.", "refresh"],
      "Dikembalikan Sebagian": ["Sebagian dana telah dikembalikan", "Lihat rincian jumlah pengembalian dan status pesanan secara terpisah.", "check"],
      "Dikembalikan Penuh": ["Dana telah dikembalikan", "Pengembalian dana telah terkonfirmasi. Riwayat pembayaran tetap tersedia.", "check"],
      Sengketa: ["Pembayaran dalam sengketa", "Transaksi sedang ditangani. Perubahan nominal dan pengembalian dana dibatasi selama sengketa.", "alert"]
    };
    return statuses[snapshot.paymentStatus];
  }

  function badge(label, positive = false)
  {
    return '<span class="badge' + (positive ? " badge-positive" : "") + '">'
      + icon(positive ? "check" : "clock") + escapeHtml(label) + '</span>';
  }

  function renderStatus()
  {
    const [title, description, symbol] = statusContent();
    return markup([
      '<section class="payment-panel" aria-labelledby="payment-status-title">',
      '  <div class="status-heading">',
      '    <span class="status-mark">' + icon(symbol) + '</span>',
      '    <div class="status-copy">',
      '      <h2 id="payment-status-title" tabindex="-1">' + escapeHtml(title) + '</h2>',
      '      <p>' + escapeHtml(description) + '</p>',
      '    </div>',
      '  </div>',
      '  <div class="status-badges">',
      '    <div class="status-field">',
      '      <span>Pesanan</span>',
      badge(snapshot.orderStatus),
      '    </div>',
      '    <div class="status-field">',
      '      <span>Pembayaran</span>',
      badge(snapshot.paymentStatus, snapshot.paymentStatus === "Berhasil"),
      '    </div>',
      '  </div>',
      '  <div class="order-reference">',
      '    <span>Nomor pesanan</span>',
      '    <div class="reference-value">',
      '      <strong>' + escapeHtml(snapshot.orderNo) + '</strong>',
      copyButton("Salin nomor pesanan", snapshot.orderNo, "copy-order"),
      '    </div>',
      '  </div>',
      '</section>'
    ]);
  }

  function renderItem(item, index)
  {
    return markup([
      '<article class="order-item">',
      item.image
        ? markup([
          '  <img',
          '    class="item-image"',
          '    src="' + escapeHtml(safeAsset(item.image)) + '"',
          '    width="64"',
          '    height="72"',
          '    alt=""',
          '    data-item-image="' + index + '"',
          '  >'
        ])
        : '  <span class="image-fallback" aria-hidden="true">Foto tidak tersedia</span>',
      '  <div class="item-info">',
      '    <h3>' + escapeHtml(item.name || "Produk pesanan") + '</h3>',
      item.variant ? '    <p class="item-meta">' + escapeHtml(item.variant) + '</p>' : null,
      '    <p class="item-meta">' + escapeHtml(item.quantity) + ' ' + escapeHtml(item.unit || "unit") + '</p>',
      '    <p class="item-price">' + money(item.amount) + '</p>',
      '  </div>',
      '</article>'
    ]);
  }

  function priceRow(label, amount, total = false)
  {
    return markup([
      '<div class="price-row' + (total ? " price-total" : "") + '">',
      '  <dt>' + escapeHtml(label) + '</dt>',
      '  <dd>' + money(amount) + '</dd>',
      '</div>'
    ]);
  }

  function renderSummary()
  {
    return markup([
      '<aside class="payment-panel" aria-labelledby="order-summary-title">',
      '  <div class="panel-heading">',
      '    <h2 id="order-summary-title">Ringkasan Pesanan</h2>',
      '    <span class="muted item-meta">' + snapshot.items.length + ' produk</span>',
      '  </div>',
      '  <div class="item-list">',
      snapshot.items.map(renderItem).join("\n"),
      '  </div>',
      '  <dl class="price-breakdown">',
      priceRow("Subtotal produk", snapshot.subtotalAmount),
      priceRow("Ongkos kirim", snapshot.shippingAmount),
      priceRow("Total pesanan", snapshot.totalAmount, true),
      '  </dl>',
      '  <div class="delivery-context">',
      '    <div class="delivery-row">',
      icon("calendar"),
      '      <div>',
      '        <strong>Jadwal pengiriman</strong>',
      '        <small>' + escapeHtml(formatDeliveryDate(snapshot.deliveryDate)) + '</small>',
      '        <small>' + escapeHtml(snapshot.deliverySlot || "") + '</small>',
      '      </div>',
      '    </div>',
      '    <div class="delivery-row">',
      icon("truck"),
      '      <div>',
      '        <strong>' + escapeHtml(snapshot.courierName || "Kurir belum tersedia") + '</strong>',
      '        <small>Sesuai pilihan pada pesanan</small>',
      '      </div>',
      '    </div>',
      '  </div>',
      button("Lihat Detail Pesanan", "details", { className: "text-button summary-link", id: "summary-details" }),
      '  <div class="trust-line">',
      icon("shield"),
      '    <p>Nominal mengikuti ringkasan pesanan. Status diperbarui setelah verifikasi.</p>',
      '  </div>',
      '</aside>'
    ]);
  }

  function safeAsset(value)
  {
    try
    {
      const url = new URL(value, window.location.href);
      return url.origin === window.location.origin && ["http:", "https:", "file:"].includes(url.protocol)
        ? url.href : "";
    }
    catch
    {
      return "";
    }
  }

  function renderQr()
  {
    return markup([
      '<div class="qr-area">',
      '  <div class="qr-frame">',
      qrFailed
        ? markup([
          '    <div class="qr-error">',
          icon("alert"),
          '      <p>Kode QR belum dapat dimuat.</p>',
          button("Muat Ulang QR", "retry-qr", { className: "text-button" }),
          '    </div>'
        ])
        : markup([
          '    <img',
          '      id="payment-qr"',
          '      class="qr-image"',
          '      src="' + escapeHtml(safeAsset(snapshot.attempt.qrImage)) + '"',
          '      width="188"',
          '      height="188"',
          '      alt="' + (adapter.isPreview
            ? "QR pratinjau, tidak dapat digunakan untuk membayar"
            : "QR pembayaran pesanan " + escapeHtml(snapshot.orderNo)) + '"',
          '    >'
        ]),
      '  </div>',
      adapter.isPreview ? '  <p class="qr-caption">QR contoh, tidak dapat digunakan untuk membayar.</p>' : null,
      '</div>'
    ]);
  }

  function inlineNotice(message, symbol = "alert")
  {
    return markup([
      '<div class="notice instruction-notice">',
      icon(symbol),
      '  <p>' + escapeHtml(message) + '</p>',
      '</div>'
    ]);
  }

  function renderPaymentFacts()
  {
    if (snapshot.verifiedPaidAmount === null)
    {
      return "";
    }
    return markup([
      '<dl class="price-breakdown">',
      priceRow("Dana terverifikasi", snapshot.verifiedPaidAmount),
      '  <div class="price-row">',
      '    <dt>Metode</dt>',
      '    <dd>' + escapeHtml(methodName(snapshot.isCod ? "cod" : snapshot.attempt?.method)) + '</dd>',
      '  </div>',
      snapshot.paidAt ? markup([
        '<div class="price-row">',
        '  <dt>Waktu pembayaran</dt>',
        '  <dd>' + dateTime(snapshot.paidAt) + '</dd>',
        '</div>'
      ]) : null,
      '</dl>'
    ]);
  }

  function renderInstructions()
  {
    const attempt = snapshot.attempt;
    if (snapshot.isCod)
    {
      return renderPaymentFacts() + inlineNotice(
        snapshot.paymentStatus === "Menunggu"
          ? "Bayarkan sesuai tagihan saat pesanan diterima. Anda tidak perlu melakukan transfer atau memindai QR untuk pesanan COD."
          : "Penerimaan uang COD telah dikonfirmasi. Bukti pelunasan tersedia sesuai catatan pembayaran.",
        snapshot.paymentStatus === "Menunggu" ? "truck" : "check"
      );
    }
    if (snapshot.uiState === "checking" || (isUnpaidOnline() && isDeadlinePassed()))
    {
      return inlineNotice("Memeriksa status pembayaran. Tenggat tampilan telah berakhir; hasil akhir menunggu pemeriksaan sistem.", "clock");
    }
    const processMessages =
    {
      creating: "Menyiapkan instruksi pembayaran. Jangan membuat percobaan lain selama proses berjalan.",
      slow: "Hasil permintaan sedang diperiksa. Jangan membayar ulang dahulu.",
      cancelling: "Pembatalan sedang diperiksa. Status akhir akan ditampilkan setelah proses selesai.",
      offline: "Koneksi terputus. Informasi terakhir belum tentu terbaru; perbarui sebelum melanjutkan.",
      conflict: "Informasi berubah saat halaman digunakan. Perbarui status sebelum menjalankan tindakan."
    };
    if (processMessages[snapshot.uiState])
    {
      return inlineNotice(processMessages[snapshot.uiState], "clock");
    }
    if (snapshot.paymentStatus !== "Menunggu")
    {
      return markup([
        renderPaymentFacts(),
        snapshot.refunds.map((refund) =>
        {
          return inlineNotice(refund.reason + ": " + money(refund.amount)
            + ". Status: " + refund.status
            + (refund.status === "Gagal" ? ". Dana belum kembali; tindak lanjut diperlukan." : "."),
          refund.status === "Berhasil" ? "check" : "clock");
        }).join("\n"),
        snapshot.paymentStatus === "Gagal" && !snapshot.allowedActions.retry
          ? inlineNotice("Batas percobaan untuk pesanan ini telah tercapai. Lihat panduan atau detail pesanan.") : null
      ]);
    }
    if (!attempt || snapshot.availableMethods.length === 0)
    {
      return inlineNotice(snapshot.availableMethods.length === 0
        ? "Metode pembayaran sedang tidak tersedia. Perbarui status atau lihat panduan untuk melanjutkan."
        : "Instruksi pembayaran belum dibuat. Pilih metode untuk menyiapkan instruksi.", "clock");
    }
    if (attempt.status !== "Menunggu")
    {
      return inlineNotice("Instruksi sebelumnya tidak aktif. Perbarui status untuk melihat tindakan berikutnya.");
    }
    if ((attempt.method === "qris" && !attempt.qrImage)
      || (["va", "transfer"].includes(attempt.method) && !attempt.paymentCode))
    {
      return inlineNotice("Instruksi belum lengkap. Jangan membayar sebelum kode dan nominal yang sah tersedia.");
    }
    const instructions = attempt.method === "qris"
      ? ["Buka aplikasi pembayaran yang mendukung QRIS.", "Pindai QR, lalu periksa nama penerima dan nominal.", "Selesaikan pembayaran. Status diperbarui setelah verifikasi."]
      : (attempt.method === "wallet"
        ? ["Buka aplikasi e-wallet sesuai kanal yang dipilih.", "Gunakan instruksi resmi penyedia dan periksa nominal pembayaran.", "Kembali ke halaman ini untuk melihat status terverifikasi."]
        : ["Pilih pembayaran melalui bank sesuai instruksi penyedia.", "Masukkan nomor pembayaran dan periksa nominal tagihan.", "Selesaikan pembayaran, lalu tunggu konfirmasi terverifikasi."]);
    return markup([
      '  <div class="method-heading">',
      '    <span class="method-name">' + escapeHtml(methodName(attempt.method)) + '</span>',
      '    <span class="method-caption">Pembayaran online</span>',
      '  </div>',
      attempt.method === "qris" ? renderQr() : null,
      attempt.paymentCode ? markup([
        '<div class="payment-code">',
        '  <div>',
        '    <span>' + (adapter.isPreview ? "Nomor pembayaran contoh" : "Nomor pembayaran") + '</span>',
        '    <strong>' + escapeHtml(attempt.paymentCode) + '</strong>',
        '  </div>',
        copyButton("Salin nomor pembayaran", attempt.paymentCode, "copy-payment"),
        '</div>'
      ]) : null,
      attempt.method === "wallet"
        ? inlineNotice("Tautan aplikasi pembayaran belum tersedia pada data contoh ini. Tidak ada aplikasi atau transaksi nyata yang dibuka.", "help") : null,
      '  <details id="payment-instructions" open>',
      '    <summary>Cara Membayar' + icon("chevron") + '</summary>',
      '    <ol class="instruction-list">',
      instructions.map((instruction) => '      <li>' + escapeHtml(instruction) + '</li>').join("\n"),
      '    </ol>',
      '  </details>'
    ]);
  }

  function renderActions()
  {
    const hasPayableAttempt = snapshot.paymentStatus === "Menunggu" && !snapshot.isCod;
    const isPending = hasPayableAttempt || snapshot.paymentStatus === "Gagal";
    const locked = Boolean(isLocked());
    const recoverableFailure = snapshot.paymentStatus === "Gagal"
      && snapshot.allowedActions.retry && !isDeadlinePassed();
    let primaryAction;

    if (recoverableFailure)
    {
      primaryAction = button("Coba Pembayaran Lagi", "methods",
      {
        className: "button button-full",
        id: "primary-retry",
        disabled: locked
      });
    }
    else if (isPending)
    {
      primaryAction = button(reading ? "Memperbarui Status…" : "Perbarui Status", "refresh",
      {
        className: "button button-full",
        disabled: reading || Boolean(busyAction),
        icon: "refresh"
      });
    }
    else
    {
      primaryAction = button("Lihat Detail Pesanan", "details",
      {
        className: "button button-full",
        id: "primary-details"
      });
    }

    return markup([
      '<div class="payment-actions">',
      primaryAction,
      recoverableFailure
        ? button(reading ? "Memperbarui Status…" : "Perbarui Status", "refresh",
          { className: "button button-secondary button-full", disabled: reading || Boolean(busyAction), icon: "refresh" })
        : null,
      snapshot.receiptAvailable
        ? button("Lihat Bukti Pelunasan", "receipt",
          { className: "button button-secondary button-full", disabled: Boolean(busyAction) })
        : null,
      '<div class="inline-actions">',
      snapshot.allowedActions.retry && !recoverableFailure && !isDeadlinePassed()
        ? button("Coba Pembayaran Lagi", "methods", { className: "text-button", disabled: locked }) : null,
      snapshot.allowedActions.changeMethod
        ? button("Ganti Metode", "methods",
          { className: "text-button", id: "change-method", disabled: locked }) : null,
      snapshot.allowedActions.cancel
        ? button("Batalkan Pesanan", "cancel", { className: "text-button", disabled: locked }) : null,
      '</div>',
      locked && !reading && isPending
        ? '<p class="action-note">Tindakan pembayaran ditahan sampai status terbaru dapat dipastikan.</p>' : null,
      '<p class="updated-at payment-feedback" id="payment-feedback-text" data-feedback="' + Boolean(feedbackMessage) + '">',
      escapeHtml(feedbackMessage || "Data diperbarui " + dateTime(snapshot.snapshotAt)),
      '</p>',
      '</div>'
    ]);
  }

  function renderPaymentPanel()
  {
    const showDeadline = snapshot.paymentStatus === "Menunggu" && !snapshot.isCod && snapshot.expiresAt && !isDeadlinePassed();
    return markup([
      '<section class="payment-panel" aria-label="Instruksi dan hasil pembayaran">',
      '  <div class="amount-heading">',
      '    <div>',
      '      <p class="amount-label">' + (snapshot.isCod && snapshot.paymentStatus === "Menunggu" ? "Bayar saat pesanan diterima" : "Total pembayaran") + '</p>',
      '      <p class="payment-amount">' + money(snapshot.totalAmount) + '</p>',
      '    </div>',
      copyButton("Salin nominal pembayaran", snapshot.totalAmount, "copy-amount"),
      '  </div>',
      showDeadline ? markup([
        '<div class="deadline-row">',
        '  <div class="deadline-text">Bayar sebelum',
        '    <strong>' + dateTime(snapshot.expiresAt) + '</strong>',
        '  </div>',
        '  <span class="countdown" aria-label="Sisa waktu pembayaran, lihat juga batas waktu di sebelahnya">',
        icon("clock"),
        '    <span id="payment-countdown" aria-hidden="true">--:--</span>',
        '  </span>',
        '</div>'
      ]) : null,
      renderInstructions(),
      snapshot.uiState === "emailPending"
        ? inlineNotice("Pembayaran telah terverifikasi. Email bukti pelunasan belum terkonfirmasi terkirim; Anda tetap dapat melihat bukti di sini.", "help") : null,
      operationError ? inlineNotice(operationError) : null,
      renderActions(),
      '</section>'
    ]);
  }

  function renderHistory()
  {
    return markup([
      '<details class="payment-panel history-panel" id="payment-history">',
      '  <summary>Riwayat Pembayaran' + icon("chevron") + '</summary>',
      '  <div class="history-list">',
      snapshot.attempts.length ? snapshot.attempts.map((attempt) =>
      {
        return markup([
          '<div class="history-item">',
          '  <div>',
          '    <strong>' + escapeHtml(methodName(attempt.method)) + '</strong>',
          '    <small>' + (attempt.method === "cod" ? "Penerimaan COD" : "Percobaan " + escapeHtml(attempt.number))
            + ', ' + dateTime(attempt.createdAt) + '</small>',
          '    <small>' + money(attempt.amount) + '</small>',
          '  </div>',
          badge(attempt.status, attempt.status === "Berhasil"),
          '</div>'
        ]);
      }).join("\n") : '<p class="muted">' + (snapshot.isCod
        ? "Belum ada penerimaan uang COD yang terkonfirmasi."
        : "Belum ada percobaan pembayaran.") + '</p>',
      '  </div>',
      '</details>'
    ]);
  }

  function renderSnapshot()
  {
    countdownStop?.();
    const activeId = document.activeElement?.id;
    const expandedDetails = new Map(Array.from(root.querySelectorAll("details[id]")).map((element) =>
    {
      return [element.id, element.open];
    }));
    root.setAttribute("aria-busy", String(reading));
    root.innerHTML = markup([
      '<div class="payment-layout">',
      '  <div class="payment-column">',
      renderStatus(),
      renderPaymentPanel(),
      renderHistory(),
      '  </div>',
      renderSummary(),
      '</div>'
    ]);
    for (const [elementId, isOpen] of expandedDetails)
    {
      const element = document.getElementById(elementId);
      if (element)
      {
        element.open = isOpen;
      }
    }
    if (activeId && root.contains(document.getElementById(activeId)))
    {
      document.getElementById(activeId).focus({ preventScroll: true });
    }
    const countdown = document.getElementById("payment-countdown");
    if (countdown)
    {
      countdownStop = window.RylvaPaymentCountdown.start(countdown,
      {
        serverNow: new Date(currentServerTime()).toISOString(),
        expiresAt: snapshot.expiresAt,
        onDeadline()
        {
          queueMicrotask(() =>
          {
            handleDeadline();
          });
        }
      });
    }
  }

  function renderPageError(error)
  {
    countdownStop?.();
    const [title, description] = errorMessages[error.code] || errorMessages.loadError;
    const accessError = ["login", "session", "denied", "verification", "notFound"].includes(error.code);
    root.setAttribute("aria-busy", "false");
    root.innerHTML = markup([
      '<section class="payment-panel empty-state">',
      '  <span class="status-mark">' + icon(accessError ? "shield" : "alert") + '</span>',
      '  <h2 id="page-error-title" tabindex="-1">' + escapeHtml(title) + '</h2>',
      '  <p>' + escapeHtml(description) + '</p>',
      error.code === "rateLimit" ? '<p>Coba lagi setelah 30 detik.</p>' : null,
      button(accessError ? "Panduan Akses" : "Coba Muat Lagi", accessError ? "help" : "refresh",
        { disabled: error.code === "rateLimit" && Date.now() < retryBlockedUntil }),
      '</section>'
    ]);
    announce(title + ". " + description);
  }

  async function loadSnapshot(isRefresh = false)
  {
    if (reading || busyAction)
    {
      return;
    }
    if (navigator.onLine === false)
    {
      updateConnectionNotice();
      if (!snapshot)
      {
        renderPageError({ code: "offline" });
      }
      return;
    }
    reading = true;
    if (snapshot)
    {
      renderSnapshot();
    }
    try
    {
      if (!adapter)
      {
        throw { code: "service" };
      }
      const nextSnapshot = normalizeSnapshot(await adapter.getSnapshot());
      if (!isValidSnapshot(nextSnapshot))
      {
        throw { code: knownPaymentStatuses.includes(nextSnapshot?.paymentStatus) ? "invalid" : "unknown" };
      }
      const previousStatus = snapshot?.paymentStatus;
      updateSnapshot(nextSnapshot);
      operationUncertain = false;
      operationError = null;
      reading = false;
      renderSnapshot();
      if (previousStatus && previousStatus !== snapshot.paymentStatus)
      {
        announce("Status pembayaran diperbarui: " + snapshot.paymentStatus, true);
      }
      else if (isRefresh)
      {
        announce("Informasi diperbarui. Pembayaran: " + snapshot.paymentStatus + ".", true);
      }
    }
    catch (error)
    {
      if (error.code === "rateLimit")
      {
        retryBlockedUntil = Date.now() + (error.retryAfter || 30) * 1000;
        window.setTimeout(() =>
        {
          if (!snapshot)
          {
            renderPageError(error);
          }
        }, (error.retryAfter || 30) * 1000);
      }
      const accessError = ["login", "session", "denied", "verification", "notFound"].includes(error.code);
      if (accessError || !snapshot || ["invalid", "unknown"].includes(error.code))
      {
        if (accessError)
        {
          if (dialog.open)
          {
            dialog.close();
          }
          dialogContent.replaceChildren();
          dialogRevision += 1;
        }
        snapshot = null;
        renderPageError(error);
      }
      else
      {
        operationError = (errorMessages[error.code] || errorMessages.service).join(". ");
        operationUncertain = true;
      }
      reading = false;
      if (snapshot)
      {
        renderSnapshot();
      }
    }
    finally
    {
      reading = false;
    }
  }

  function openDialog(title, content)
  {
    if (!dialog.open)
    {
      dialogTrigger = document.activeElement;
    }
    dialogRevision += 1;
    document.getElementById("dialog-title").textContent = title;
    dialogContent.innerHTML = content;
    if (!dialog.open)
    {
      dialog.showModal();
    }
    dialog.scrollTop = 0;
  }

  function closeDialog()
  {
    dialog.close();
  }

  function showDetails()
  {
    if (!snapshot)
    {
      showHelp();
      return;
    }
    if (new URLSearchParams(window.location.search).has("orderId"))
    {
      window.location.assign(window.RylvaOrderNavigation.destination("order-detail.html", snapshot.orderId, { from: "payment" }));
      return;
    }
    const destination = new URL("order-detail.html", window.location.href);
    if (!adapter.isPreview)
    {
      showHelp();
      return;
    }
    destination.searchParams.set("paymentState", adapter.scenario);
    destination.searchParams.set("from", "payment");
    window.location.assign(destination.href);
  }

  function showHelp()
  {
    openDialog("Panduan Pembayaran", markup([
      '<div class="dialog-body">',
      '  <section>',
      '    <h3>Sudah membayar, status belum berubah?</h3>',
      '    <p>Perbarui status dan tunggu verifikasi. Jangan melakukan pembayaran kedua selama hasil sebelumnya belum dipastikan.</p>',
      '  </section>',
      '  <section>',
      '    <h3>Pesanan menggunakan COD?</h3>',
      '    <p>Bayar saat pesanan diterima. Pesanan dapat diproses ketika pembayaran masih berstatus Menunggu.</p>',
      '  </section>',
      '  <section>',
      '    <h3>Tidak dapat mengakses pesanan?</h3>',
      '    <p>Gunakan akun pelanggan yang dipakai untuk memesan. Akun staf dan akun belanja memiliki akses berbeda.</p>',
      '  </section>',
      '  <section>',
      '    <h3>Perlu menelusuri transaksi?</h3>',
      '    <p>Siapkan nomor pesanan dan waktu transaksi. Jangan membagikan kata sandi, OTP, atau informasi rahasia pembayaran.</p>',
      '  </section>',
      '</div>',
      '<div class="dialog-actions">',
      button("Kembali", "close-dialog"),
      '</div>'
    ]));
  }

  function showMethods()
  {
    if (!snapshot || isLocked() || (!snapshot.allowedActions.retry && !snapshot.allowedActions.changeMethod))
    {
      return;
    }
    openDialog("Pilih Metode Pembayaran", markup([
      '<form id="payment-method-form" novalidate>',
      '  <fieldset class="method-options">',
      '    <legend>Pilih satu metode yang tersedia</legend>',
      snapshot.availableMethods.map((method) =>
      {
        return markup([
          '    <label class="method-option">',
          '      <input type="radio" name="paymentMethod" value="' + escapeHtml(method.id) + '" required>',
          '      <span>',
          '        <strong>' + escapeHtml(method.label) + '</strong>',
          '        <small>' + escapeHtml(method.description) + '</small>',
          '      </span>',
          '    </label>'
        ]);
      }).join("\n"),
      '  </fieldset>',
      '  <p id="method-error" class="field-error" role="alert" tabindex="-1" hidden></p>',
      '  <p class="muted action-note">Instruksi sebelumnya akan ditutup dengan aman. Batas pembayaran mengikuti informasi terbaru dari sistem; waktu tidak otomatis bertambah.</p>',
      '  <div class="dialog-actions">',
      button("Kembali", "close-dialog", { className: "button button-secondary" }),
      '    <button class="button" type="submit" id="confirm-method">Gunakan Metode Ini</button>',
      '  </div>',
      '</form>'
    ]));
  }

  function showCancellation()
  {
    if (!snapshot?.allowedActions.cancel || isLocked())
    {
      return;
    }
    openDialog("Batalkan Pesanan?", markup([
      '<div class="dialog-body">',
      '  <p>Pesanan <strong>' + escapeHtml(snapshot.orderNo) + '</strong> akan dibatalkan. Instruksi pembayaran aktif akan ditutup terlebih dahulu.</p>',
      '  <p>Jangan lanjutkan pembayaran setelah pembatalan. Jika dana tetap masuk, transaksi akan melalui pemeriksaan pembayaran terlambat.</p>',
      '</div>',
      '<div class="dialog-actions">',
      button("Kembali", "close-dialog", { className: "button button-secondary" }),
      button("Ya, Batalkan Pesanan", "confirm-cancel"),
      '</div>'
    ]));
  }

  async function mutate(action, methodId = null)
  {
    if (isLocked())
    {
      return;
    }
    busyAction = action;
    operationError = null;
    const submitButton = dialog.querySelector('button[type="submit"], [data-action="confirm-cancel"]');
    if (submitButton)
    {
      submitButton.disabled = true;
      submitButton.textContent = action === "cancel" ? "Memeriksa Pembatalan…" : "Menyiapkan Instruksi…";
    }
    renderSnapshot();
    try
    {
      const response = action === "cancel"
        ? await adapter.cancelOrder({ version: snapshot.version })
        : await adapter.createAttempt(methodId, { version: snapshot.version });
      const result = normalizeSnapshot(response);
      if (!isValidSnapshot(result))
      {
        throw { code: "unknown" };
      }
      updateSnapshot(result);
      qrFailed = false;
      closeDialog();
      announce(action === "cancel" ? "Pesanan dibatalkan." : "Instruksi pembayaran diperbarui.", true);
    }
    catch (error)
    {
      const normalizedCode = error.code === "rate-limit" ? "rateLimit" : error.code;
      const errorCopy = (errorMessages[normalizedCode] || errorMessages.service).join(". ");
      if (normalizedCode === "validation" && dialog.querySelector("#method-error"))
      {
        const errorElement = document.getElementById("method-error");
        errorElement.hidden = false;
        errorElement.textContent = errorCopy;
        errorElement.focus();
        submitButton.disabled = false;
        submitButton.textContent = "Gunakan Metode Ini";
      }
      else
      {
        operationError = errorCopy;
        operationUncertain = ["timeout", "gateway", "conflict", "csrf"].includes(normalizedCode);
        if (normalizedCode === "rateLimit")
        {
          retryBlockedUntil = Date.now() + 30000;
          window.setTimeout(renderSnapshot, 30000);
        }
        closeDialog();
        announce(errorCopy, true);
      }
    }
    finally
    {
      busyAction = null;
      renderSnapshot();
    }
  }

  async function showReceipt()
  {
    if (!snapshot?.receiptAvailable || busyAction)
    {
      return;
    }
    openDialog("Bukti Pelunasan", '<p>Memuat bukti pelunasan…</p>');
    const requestedRevision = dialogRevision;
    try
    {
      const receipt = await adapter.getReceipt();
      if (!dialog.open || dialogRevision !== requestedRevision)
      {
        return;
      }
      dialogContent.innerHTML = markup([
        '<div class="dialog-body">',
        '  <p class="muted">Pratinjau bukti pelunasan dengan data contoh.</p>',
        '  <p><strong>' + escapeHtml(receipt.orderNo) + '</strong></p>',
        '  <p>Pembayaran diterima: ' + dateTime(receipt.paidAt) + '</p>',
        '  <p>Metode: ' + escapeHtml(methodName(receipt.isCod ? "cod" : receipt.attempt?.method)) + '</p>',
        '  <dl class="price-breakdown">',
        priceRow("Dana terverifikasi", receipt.verifiedPaidAmount, true),
        '  </dl>',
        receipt.items.map(renderItem).join("\n"),
        '  <p>Bukti pelunasan ini bukan faktur pajak. Pengembalian dana, jika ada, ditampilkan terpisah dari riwayat penerimaan pembayaran.</p>',
        '</div>'
      ]);
    }
    catch
    {
      if (!dialog.open || dialogRevision !== requestedRevision)
      {
        return;
      }
      dialogContent.innerHTML = markup([
        '<div class="dialog-body">',
        '  <p>' + escapeHtml(errorMessages.document.join(". ")) + '</p>',
        '</div>',
        '<div class="dialog-actions">',
        button("Kembali", "close-dialog", { className: "button button-secondary" }),
        button("Muat Ulang Bukti", "receipt"),
        '</div>'
      ]);
    }
  }

  async function copyValue(trigger)
  {
    const value = trigger.dataset.copy;
    try
    {
      await navigator.clipboard.writeText(value);
      announce(trigger.getAttribute("aria-label").replace("Salin ", "") + " disalin.", true);
    }
    catch
    {
      openDialog("Salin Secara Manual", markup([
        '<div class="dialog-body">',
        '  <label for="manual-copy">Pilih dan salin nilai berikut</label>',
        '  <input id="manual-copy" value="' + escapeHtml(value) + '" readonly>',
        '  <p>Penyalinan otomatis belum tersedia. Gunakan perintah salin pada perangkat Anda.</p>',
        '</div>'
      ]));
      document.getElementById("manual-copy").select();
    }
  }

  function updateConnectionNotice()
  {
    notice.hidden = navigator.onLine !== false;
    notice.textContent = "Koneksi terputus. Status terakhir mungkin belum terbaru. Sambungkan kembali sebelum melanjutkan pembayaran.";
    if (snapshot)
    {
      renderSnapshot();
    }
  }

  document.addEventListener("click", (event) =>
  {
    const trigger = event.target.closest("[data-action]");
    if (!trigger || trigger.disabled)
    {
      return;
    }
    const action = trigger.dataset.action;
    const actions =
    {
      refresh: () => loadSnapshot(true),
      details: showDetails,
      help: showHelp,
      methods: showMethods,
      cancel: showCancellation,
      "confirm-cancel": () => mutate("cancel"),
      "close-dialog": closeDialog,
      receipt: showReceipt,
      copy: () => copyValue(trigger),
      "retry-qr": () =>
      {
        qrFailed = false;
        renderSnapshot();
      }
    };
    actions[action]?.();
  });

  document.addEventListener("submit", (event) =>
  {
    if (event.target.id !== "payment-method-form")
    {
      return;
    }
    event.preventDefault();
    const selectedMethod = new FormData(event.target).get("paymentMethod");
    if (!selectedMethod)
    {
      const errorElement = document.getElementById("method-error");
      errorElement.hidden = false;
      errorElement.textContent = "Pilih satu metode pembayaran untuk melanjutkan.";
      errorElement.focus();
      return;
    }
    mutate("method", selectedMethod);
  });

  document.addEventListener("error", (event) =>
  {
    if (event.target.id === "payment-qr")
    {
      qrFailed = true;
      renderSnapshot();
    }
    if (event.target.matches?.("[data-item-image]"))
    {
      const fallback = document.createElement("span");
      fallback.className = "image-fallback";
      fallback.setAttribute("aria-hidden", "true");
      fallback.textContent = "Foto tidak tersedia";
      event.target.replaceWith(fallback);
    }
  }, true);

  dialog.addEventListener("close", () =>
  {
    dialogRevision += 1;
    if (dialogTrigger?.isConnected)
    {
      dialogTrigger.focus({ preventScroll: true });
    }
    else
    {
      document.getElementById("payment-status-title")?.focus({ preventScroll: true });
    }
  });

  dialog.addEventListener("click", (event) =>
  {
    if (event.target === dialog)
    {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right
        || event.clientY < bounds.top || event.clientY > bounds.bottom)
      {
        closeDialog();
      }
    }
  });

  window.addEventListener("offline", updateConnectionNotice);
  window.addEventListener("online", () =>
  {
    updateConnectionNotice();
    loadSnapshot(true);
  });
  document.addEventListener("visibilitychange", () =>
  {
    if (!document.hidden)
    {
      loadSnapshot();
    }
  });
  window.setInterval(() =>
  {
    if (!document.hidden && !dialog.open && snapshot
      && ["Menunggu", "Gagal", "Refund Diproses", "Perlu Ditinjau"].includes(snapshot.paymentStatus))
    {
      loadSnapshot();
    }
  }, 15000);
  window.addEventListener("pagehide", () =>
  {
    countdownStop?.();
    window.clearTimeout(deadlineTimeout);
  });
  window.addEventListener("pageshow", (event) =>
  {
    if (event.persisted)
    {
      loadSnapshot();
    }
  });
  loadSnapshot();
})();
