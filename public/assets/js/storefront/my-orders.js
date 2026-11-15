"use strict";

(() =>
{
  const adapter = window.RylvaMyOrdersAdapter || window.RylvaMyOrdersPreview.createAdapter();
  const navigation = window.RylvaOrderNavigation;
  const root = document.getElementById("orders-root");
  const form = document.getElementById("orders-filters");
  const summary = document.getElementById("orders-result-summary");
  const feedback = document.getElementById("orders-feedback");
  const notice = document.getElementById("orders-notice");
  const fieldError = document.getElementById("orders-filter-error");
  const pagination = document.getElementById("orders-pagination");
  const dialog = document.getElementById("orders-dialog");
  const queryParameters = new URLSearchParams(window.location.search);
  const statuses = [
    ["all", "Semua"], ["Menunggu Pembayaran", "Menunggu Pembayaran"],
    ["processing", "Diproses"], ["Dikirim", "Dikirim"], ["Terkirim", "Terkirim"],
    ["Selesai", "Selesai"], ["Dibatalkan", "Dibatalkan"], ["Perlu Penanganan", "Perlu Penanganan"]
  ];
  const knownStatuses = ["Menunggu Pembayaran", "Siap Diproses", "Sedang Disiapkan", "Dikirim", "Terkirim", "Selesai", "Dibatalkan", "Perlu Penanganan"];
  const errors =
  {
    loadError: "Pesanan belum dapat dimuat. Coba lagi untuk melihat daftar terbaru.",
    service: "Layanan sedang bermasalah. Coba lagi nanti.",
    maintenance: "Layanan sedang dalam pemeliharaan. Silakan periksa kembali nanti.",
    login: "Masuk dengan akun pelanggan untuk melihat pesanan Anda.",
    session: "Sesi Anda telah berakhir. Masuk kembali untuk melihat pesanan.",
    denied: "Halaman ini tersedia untuk akun pelanggan. Data pesanan tidak ditampilkan.",
    verification: "Selesaikan verifikasi akun pelanggan sebelum melanjutkan.",
    unavailable: "Daftar pesanan tidak tersedia. Periksa kembali alamat halaman atau coba nanti.",
    rateLimit: "Terlalu banyak permintaan. Tunggu sebelum mencoba kembali.",
    cursorExpired: "Posisi daftar perlu diperbarui. Buka awal daftar dengan filter yang sama.",
    offline: "Koneksi terputus. Sambungkan kembali lalu perbarui daftar.",
    invalid: "Informasi daftar belum dapat dipastikan. Coba muat lagi."
  };
  const moneyFormatter = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
  const dateFormatter = new Intl.DateTimeFormat("id-ID",
  {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta"
  });
  let query = readUrl();
  let data = null;
  let controller = null;
  let requestRevision = 0;
  let reading = false;
  let staleError = false;
  let debounceTimer = null;
  let slowTimer = null;
  let deadlineTimer = null;
  let receivedAt = 0;
  let retryUntil = 0;
  let dialogTrigger = null;
  let restorePending = navigation.readContext(queryParameters.get("restoreKey"));
  let normalizationMessage = ["status", "sort", "dateFrom", "dateTo"].some((name) =>
  {
    return queryParameters.has(name) && queryParameters.get(name) !== query[name];
  }) ? "Sebagian filter dari tautan tidak dikenali dan telah diatur ulang." : "";

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

  function date(value)
  {
    return Number.isFinite(Date.parse(value)) ? dateFormatter.format(new Date(value)) + " WIB" : "Tanggal belum tersedia";
  }

  function money(value)
  {
    return Number.isSafeInteger(value) && value >= 0 ? moneyFormatter.format(value) : "Belum tersedia";
  }

  function validDate(value)
  {
    if (!value)
    {
      return true;
    }
    const parsed = Date.parse(value + "T00:00:00Z");
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(parsed)
      && new Date(parsed).toISOString().slice(0, 10) === value;
  }

  function readUrl()
  {
    const parameters = new URLSearchParams(window.location.search);
    return {
      q: (parameters.get("q") || "").trim(),
      status: statuses.some(([value]) => value === parameters.get("status")) ? parameters.get("status") : "all",
      dateFrom: validDate(parameters.get("dateFrom") || "") ? parameters.get("dateFrom") || "" : "",
      dateTo: validDate(parameters.get("dateTo") || "") ? parameters.get("dateTo") || "" : "",
      sort: parameters.get("sort") === "oldest" ? "oldest" : "newest",
      cursor: parameters.get("cursor") || ""
    };
  }

  function synchronizeControls(keepSearch = false)
  {
    if (!keepSearch)
    {
      document.getElementById("orders-search").value = query.q;
    }
    document.getElementById("orders-date-from").value = query.dateFrom;
    document.getElementById("orders-date-to").value = query.dateTo;
    document.getElementById("orders-sort").value = query.sort;
    document.querySelectorAll("[data-orders-status]").forEach((button) =>
    {
      button.setAttribute("aria-pressed", String(button.dataset.ordersStatus === query.status));
    });
    document.querySelector('[data-orders-action="clear-search"]').hidden = !query.q;
    document.getElementById("orders-reset").hidden = !query.q && query.status === "all"
      && !query.dateFrom && !query.dateTo && query.sort === "newest" && !query.cursor;
    renderActiveFilters();
  }

  function writeUrl(push = false)
  {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(query))
    {
      if (!value || key === "status" && value === "all" || key === "sort" && value === "newest")
      {
        url.searchParams.delete(key);
      }
      else
      {
        url.searchParams.set(key, value);
      }
    }
    window.history[push ? "pushState" : "replaceState"]({}, "", url.pathname + url.search);
  }

  function validate()
  {
    const invalidSearch = query.q.length > 100;
    const invalidDates = !validDate(query.dateFrom) || !validDate(query.dateTo)
      || query.dateFrom && query.dateTo && query.dateFrom > query.dateTo;
    document.getElementById("orders-search").setAttribute("aria-invalid", String(invalidSearch));
    document.getElementById("orders-date-from").setAttribute("aria-invalid", String(Boolean(invalidDates)));
    document.getElementById("orders-date-to").setAttribute("aria-invalid", String(Boolean(invalidDates)));
    fieldError.textContent = invalidSearch ? "Perpendek pencarian hingga 100 karakter."
      : (invalidDates ? "Tanggal akhir harus sama atau setelah tanggal awal." : "");
    return !invalidSearch && !invalidDates;
  }

  function renderActiveFilters()
  {
    const chips = [];
    if (query.q)
    {
      chips.push(["clear-search", "Pencarian: " + query.q]);
    }
    if (query.status !== "all")
    {
      chips.push(["clear-status", statuses.find(([value]) => value === query.status)[1]]);
    }
    if (query.dateFrom || query.dateTo)
    {
      chips.push(["clear-dates", "Tanggal: " + (query.dateFrom || "awal") + " sampai " + (query.dateTo || "sekarang")]);
    }
    document.getElementById("orders-active-filters").innerHTML = chips.map(([action, label]) => `<button
      type="button"
      class="orders-filter-chip"
      data-orders-action="${action}"
      aria-label="Hapus filter ${escapeHtml(label)}"
    >${escapeHtml(label)} ${icon("close")}</button>`).join("\n");
  }

  function showNotice(message)
  {
    notice.hidden = !message;
    notice.textContent = message;
  }

  function offline()
  {
    return navigator.onLine === false || adapter.isPreview && adapter.scenario === "offline";
  }

  function serverTime()
  {
    return Date.parse(data?.serverNow) + performance.now() - receivedAt;
  }

  function orderLink(snapshot, label, page, key, primary = false, intent = "")
  {
    const url = navigation.destination(page, snapshot.orderId, { returnKey: key, from: "orders", intent });
    return `<a
      class="button${primary ? "" : " button-secondary"}"
      href="${escapeHtml(url)}"
      data-order-id="${escapeHtml(snapshot.orderId)}"
      data-return-key="${key}"
      data-orders-link="${intent || (page === "payment.html" ? "payment" : "detail")}"
      aria-label="${escapeHtml(label + ", " + snapshot.orderNo)}"
    >${escapeHtml(label)}</a>`;
  }

  function renderCard(snapshot)
  {
    if (!snapshot?.orderId || !snapshot.orderNo || !Array.isArray(snapshot.items) || !snapshot.items.length)
    {
      return `<section class="order-card orders-state">
        <h2>Sebagian detail pesanan belum tersedia</h2>
        <p>Informasi kartu ini belum lengkap. Perbarui daftar untuk memeriksa kembali.</p>
      </section>`;
    }
    const key = window.crypto.randomUUID();
    const item = snapshot.items[0];
    const searchTerm = data.query.q || "";
    const matchedItem = searchTerm ? snapshot.items.find((entry) => entry.name.toLocaleLowerCase("id-ID").includes(searchTerm.toLocaleLowerCase("id-ID"))) : null;
    const valid = knownStatuses.includes(snapshot.orderStatus)
      && Number.isSafeInteger(snapshot.totalAmount) && snapshot.totalAmount >= 0;
    const uncertainData = staleError || data.stale || offline() || snapshot.archived || !valid;
    let primaryLabel = "Lihat Detail Pesanan";
    let primaryPage = "order-detail.html";
    let primaryIntent = "";
    let secondary = "";
    if (!uncertainData && snapshot.orderStatus === "Menunggu Pembayaran" && !snapshot.isCod)
    {
      primaryLabel = snapshot.allowedActions?.pay && Date.parse(snapshot.expiresAt) > serverTime() ? "Bayar" : "Periksa Pembayaran";
      primaryPage = "payment.html";
      secondary = orderLink(snapshot, "Lihat Detail Pesanan", "order-detail.html", key);
    }
    else if (snapshot.handling || snapshot.complaint || snapshot.refunds?.length)
    {
      primaryLabel = snapshot.complaint ? "Lihat Komplain" : (snapshot.refunds?.length ? "Lihat Refund" : "Lihat Penanganan");
    }
    else if (snapshot.orderStatus === "Dikirim")
    {
      primaryLabel = "Lacak";
      primaryIntent = "tracking";
      secondary = orderLink(snapshot, "Lihat Detail Pesanan", "order-detail.html", key);
    }
    else if (snapshot.orderStatus === "Terkirim")
    {
      secondary = orderLink(snapshot, "Lacak", "order-detail.html", key, false, "tracking");
      if (!uncertainData && snapshot.allowedActions?.confirmReceipt)
      {
        primaryLabel = "Selesaikan Pesanan";
        primaryIntent = "confirmReceipt";
      }
    }
    let imageUrl = null;
    try
    {
      const url = new URL(item.image, window.location.href);
      if (item.image && url.origin === window.location.origin && url.pathname.startsWith("/assets/images/"))
      {
        imageUrl = url.href;
      }
    }
    catch
    {
      imageUrl = null;
    }
    const positive = ["Selesai", "Terkirim"].includes(snapshot.orderStatus);
    let note = "";
    if (snapshot.orderStatus === "Menunggu Pembayaran" && !snapshot.isCod && snapshot.expiresAt)
    {
      note = Date.parse(snapshot.expiresAt) > serverTime() ? "Bayar sebelum " + date(snapshot.expiresAt)
        : "Batas waktu pembayaran tercapai. Periksa status pembayaran sebelum melanjutkan.";
    }
    if (snapshot.orderStatus === "Terkirim" && !snapshot.complaint && snapshot.complaintDeadline)
    {
      note = Date.parse(snapshot.complaintDeadline) > serverTime()
        ? "Periksa paket Anda. Batas komplain " + date(snapshot.complaintDeadline)
        : "Jendela komplain berakhir. Perbarui status pesanan untuk memeriksa hasilnya.";
    }
    const caseStatus = snapshot.complaint ? "Komplain: " + snapshot.complaint.status
      : (snapshot.refunds?.length ? "Refund: " + snapshot.refunds[0].status
        : (snapshot.cancellationRequest ? "Pembatalan: " + snapshot.cancellationRequest.status : ""));
    const handlingLabels =
    {
      "PH-01": "Ketersediaan produk sedang ditinjau.",
      "PH-02": "Pembayaran terlambat sedang ditinjau.",
      "PH-03": "Kecocokan pembayaran sedang ditinjau.",
      "PH-04": "Pengiriman mengalami kendala.",
      "PH-05": "Kehilangan atau kerusakan paket sedang ditinjau.",
      "PH-06": "Ketersediaan produk saat persiapan sedang diperiksa.",
      "PH-07": "Permintaan penghentian pengiriman sedang ditinjau."
    };
    return `<article class="order-card" id="order-${escapeHtml(snapshot.orderId)}" data-card-order-id="${escapeHtml(snapshot.orderId)}">
      <header class="order-card-header">
        <div>
          <h2>${escapeHtml(snapshot.orderNo)}</h2>
          <time datetime="${escapeHtml(snapshot.createdAt)}">${date(snapshot.createdAt)}</time>
        </div>
        <span class="badge${positive ? " badge-positive" : ""}" data-status="${escapeHtml(snapshot.orderStatus)}">
          ${icon(positive ? "check" : (snapshot.orderStatus === "Dikirim" ? "truck" : "clock"))}
          ${escapeHtml(knownStatuses.includes(snapshot.orderStatus) ? snapshot.orderStatus : "Status perlu diperiksa")}
        </span>
      </header>
      <div class="order-card-body">
        <div class="order-card-product">
          <div class="order-card-photo">
            ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="" loading="lazy">` : ""}
            <span ${imageUrl ? "hidden" : ""}>Foto belum tersedia</span>
          </div>
          <div>
            <h3>${escapeHtml(item.name || "Nama produk belum tersedia")}</h3>
            <p class="order-card-meta">${escapeHtml(item.variant || "Varian belum tersedia")}</p>
            <p class="order-card-meta">${escapeHtml(item.quantity)} ${escapeHtml(item.unit || "unit")} × ${money(item.amount)}</p>
            ${snapshot.items.length > 1 ? `<p class="order-card-meta">+${snapshot.items.length - 1} jenis produk lainnya</p>` : ""}
            ${matchedItem && matchedItem !== item ? `<p class="order-card-meta">Cocok dengan pencarian: ${escapeHtml(matchedItem.name)}</p>` : ""}
          </div>
        </div>
        <div class="order-card-price">
          <span>Total belanja</span>
          <strong>${money(snapshot.totalAmount)}</strong>
        </div>
      </div>
      <div class="order-card-statuses">
        <span>Pembayaran: <strong>${escapeHtml(snapshot.paymentStatus || "Belum tersedia")}</strong></span>
        <span>Pengiriman: <strong>${escapeHtml(snapshot.shippingStatus || "Belum tersedia")}</strong></span>
        ${snapshot.isCod ? "<span><strong>COD</strong>, bayar saat diterima</span>" : ""}
        ${caseStatus ? `<span>${escapeHtml(caseStatus)}</span>` : ""}
      </div>
      ${snapshot.archived ? '<p class="order-card-note">Riwayat hanya dapat dilihat.</p>' : ""}
      ${!valid ? '<p class="order-card-note">Informasi pesanan perlu diperiksa. Pembayaran belum dapat dilanjutkan dari kartu ini.</p>' : ""}
      ${note ? `<p class="order-card-note">${escapeHtml(note)}</p>` : ""}
      ${snapshot.handling ? `<p class="order-card-note">${escapeHtml(handlingLabels[snapshot.handling.code] || "Toko sedang meninjau kendala pesanan.")}</p>` : ""}
      <footer class="order-card-footer">
        <span class="order-card-meta">RylVa Green</span>
        <div class="order-card-actions">
          ${secondary}
          ${orderLink(snapshot, primaryLabel, primaryPage, key, true, primaryIntent)}
          <details class="order-card-menu">
            <summary aria-label="Tindakan lain untuk ${escapeHtml(snapshot.orderNo)}">
              <svg class="icon" aria-hidden="true" viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="1"/>
                <circle cx="12" cy="12" r="1"/>
                <circle cx="19" cy="12" r="1"/>
              </svg>
            </summary>
            <nav aria-label="Tindakan pesanan ${escapeHtml(snapshot.orderNo)}">
              ${!uncertainData && snapshot.allowedActions?.complain ? orderLink(snapshot, "Ajukan Komplain", "order-detail.html", key, false, "complain") : ""}
              ${orderLink(snapshot, "Lacak Pengiriman", "order-detail.html", key, false, "tracking")}
              ${orderLink(snapshot, "Rincian Pembayaran", snapshot.isCod || uncertainData ? "order-detail.html" : "payment.html", key, false, snapshot.isCod || uncertainData ? "paymentDetails" : "")}
              ${orderLink(snapshot, "Bantuan Pesanan", "order-detail.html", key, false, "help")}
            </nav>
          </details>
        </div>
      </footer>
    </article>`;
  }

  function renderResults()
  {
    const seen = new Set();
    const records = data.records.filter((record) =>
    {
      if (!record.orderId)
      {
        return true;
      }
      if (seen.has(record.orderId))
      {
        return false;
      }
      seen.add(record.orderId);
      return true;
    });
    root.setAttribute("aria-busy", "false");
    if (!records.length)
    {
      const empty = data.ownOrderCount === 0;
      root.innerHTML = `<section class="order-card orders-state">
        <span class="status-mark">${icon("bag")}</span>
        <h2>${empty ? "Belum ada pesanan" : "Pesanan tidak ditemukan"}</h2>
        <p>${empty ? "Pesanan Anda akan muncul di sini setelah checkout." : "Coba kata kunci lain atau kurangi filter untuk melihat pesanan Anda."}</p>
        <button type="button" class="button" data-orders-action="${empty ? "help" : "reset"}">${empty ? "Panduan Pesanan" : "Reset Pencarian dan Filter"}</button>
      </section>`;
    }
    else
    {
      root.innerHTML = records.map(renderCard).join("\n");
    }
    const validCount = Number.isSafeInteger(data.totalCount) && data.totalCount >= 0;
    const start = data.pagination.startIndex;
    summary.textContent = records.length ? (validCount
      ? "Menampilkan " + (start + 1) + "–" + (start + records.length) + " dari " + data.totalCount + " pesanan"
      : "Menampilkan " + records.length + " pesanan") : (validCount ? "0 pesanan" : "Tidak ada hasil");
    if (staleError)
    {
      summary.textContent = "Hasil terakhir. " + summary.textContent;
    }
    pagination.hidden = !records.length;
    pagination.querySelector('[data-orders-action="previous"]').disabled = !data.pagination.hasPrevious || staleError;
    pagination.querySelector('[data-orders-action="next"]').disabled = !data.pagination.nextCursor || staleError;
    const pageNumber = Math.floor(start / data.pagination.pageSize) + 1;
    document.getElementById("orders-page-label").textContent = "Halaman " + pageNumber
      + (validCount ? " dari " + Math.max(1, Math.ceil(data.totalCount / data.pagination.pageSize)) : "");
    root.querySelectorAll(".order-card-photo img").forEach((image) =>
    {
      image.addEventListener("error", () =>
      {
        image.hidden = true;
        image.nextElementSibling.hidden = false;
      }, { once: true });
    });
    window.clearTimeout(deadlineTimer);
    const nextDeadline = records.filter((record) => record.orderStatus === "Menunggu Pembayaran")
      .map((record) => Date.parse(record.expiresAt) - serverTime()).filter((remaining) => remaining > 0);
    if (nextDeadline.length)
    {
      deadlineTimer = window.setTimeout(renderResults, Math.min(2147483647, Math.ceil(Math.min(...nextDeadline)) + 1));
    }
  }

  function errorState(error)
  {
    root.setAttribute("aria-busy", "false");
    const access = ["login", "session", "denied", "verification"].includes(error.code);
    root.innerHTML = `<section class="order-card orders-state">
      <span class="status-mark">${icon(access ? "shield" : "alert")}</span>
      <h2>${access ? "Akses pesanan Anda" : "Daftar pesanan belum tersedia"}</h2>
      <p>${escapeHtml(errors[error.code] || errors.loadError)}</p>
      <button type="button" class="button" data-orders-action="${access ? "help" : (error.code === "cursorExpired" ? "first" : "refresh")}" ${Date.now() < retryUntil ? "disabled" : ""}>
        ${access ? "Panduan Akses" : (error.code === "cursorExpired" ? "Buka Awal Daftar" : "Coba Lagi")}
      </button>
    </section>`;
    pagination.hidden = true;
    summary.textContent = "Hasil belum tersedia";
  }

  function skeleton()
  {
    return `<section class="order-card orders-state" aria-label="Memuat daftar pesanan">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-line"></div>
      <p>Memuat pesanan…</p>
    </section>`;
  }

  async function load({ focusResults = false } = {})
  {
    window.clearTimeout(debounceTimer);
    controller?.abort();
    const revision = ++requestRevision;
    if (!validate())
    {
      reading = false;
      root.setAttribute("aria-busy", "false");
      if (data)
      {
        staleError = true;
        renderResults();
        showNotice("Isian filter belum valid. Yang ditampilkan masih hasil terakhir.");
      }
      else
      {
        root.innerHTML = '<section class="order-card orders-state"><h2>Periksa pencarian dan tanggal</h2><p>Perbaiki isian yang ditandai untuk memuat pesanan.</p></section>';
      }
      return;
    }
    if (Date.now() < retryUntil)
    {
      return;
    }
    writeUrl();
    if (navigator.onLine === false)
    {
      staleError = true;
      if (data)
      {
        renderResults();
        showNotice(errors.offline + " Data terakhir: " + date(data.snapshotAt));
      }
      else
      {
        errorState({ code: "offline" });
      }
      return;
    }
    controller = new AbortController();
    reading = true;
    root.setAttribute("aria-busy", "true");
    root.innerHTML = skeleton();
    pagination.hidden = true;
    summary.textContent = "Memuat pesanan…";
    document.getElementById("orders-refresh").disabled = true;
    showNotice("");
    feedback.textContent = "";
    window.clearTimeout(slowTimer);
    slowTimer = window.setTimeout(() =>
    {
      if (revision === requestRevision && reading)
      {
        showNotice("Pemuatan lebih lama dari biasanya. Anda dapat mencoba lagi tanpa kehilangan filter.");
        document.getElementById("orders-refresh").disabled = false;
      }
    }, 8000);
    try
    {
      const result = await adapter.getPage({ ...query }, { signal: controller.signal });
      if (revision !== requestRevision)
      {
        return;
      }
      if (!Array.isArray(result.records) || !result.pagination || !Number.isFinite(Date.parse(result.serverNow)))
      {
        throw { code: "invalid" };
      }
      data = result;
      receivedAt = performance.now();
      staleError = false;
      reading = false;
      renderResults();
      showNotice(data.stale || offline() ? "Data terakhir ditampilkan. Perbarui untuk memastikan status terbaru. Diperbarui " + date(data.snapshotAt) : normalizationMessage);
      normalizationMessage = "";
      if (focusResults)
      {
        summary.focus();
      }
      if (restorePending)
      {
        const context = restorePending;
        restorePending = null;
        const restoredUrl = new URL(window.location.href);
        restoredUrl.searchParams.delete("restoreKey");
        window.history.replaceState({}, "", restoredUrl.pathname + restoredUrl.search);
        await document.fonts.ready;
        window.requestAnimationFrame(() =>
        {
          window.scrollTo(0, context.scrollY || 0);
          const card = document.getElementById("order-" + context.orderId);
          const link = card?.querySelector("a");
          if (link)
          {
            link.focus({ preventScroll: true });
          }
          else
          {
            summary.focus({ preventScroll: true });
            feedback.textContent = "Status pesanan diperbarui; hasil daftar disesuaikan.";
          }
        });
      }
      else
      {
        feedback.textContent = focusResults ? summary.textContent + "." : "";
      }
    }
    catch (error)
    {
      if (revision !== requestRevision || error.name === "AbortError")
      {
        return;
      }
      reading = false;
      const access = ["login", "session", "denied", "verification", "unavailable"].includes(error.code);
      if (access)
      {
        data = null;
        navigation.clearContexts();
      }
      if (error.code === "rateLimit")
      {
        retryUntil = Date.now() + (error.retryAfter || 30) * 1000;
        window.setTimeout(() =>
        {
          document.getElementById("orders-refresh").disabled = false;
          if (!data)
          {
            errorState(error);
          }
        }, Math.max(0, retryUntil - Date.now()) + 1);
      }
      staleError = true;
      if (data && error.code !== "cursorExpired")
      {
        renderResults();
        const previous = statuses.find(([value]) => value === data.query.status)?.[1] || "Semua";
        showNotice((errors[error.code] || errors.loadError) + " Yang ditampilkan masih hasil terakhir untuk "
          + previous + (data.query.q ? ', pencarian "' + data.query.q + '"' : "")
          + ". Diperbarui " + date(data.snapshotAt));
      }
      else
      {
        errorState(error);
        if (error.code === "rateLimit")
        {
          showNotice("Coba lagi setelah " + (error.retryAfter || 30) + " detik.");
        }
      }
    }
    finally
    {
      if (revision === requestRevision)
      {
        window.clearTimeout(slowTimer);
        reading = false;
        document.getElementById("orders-refresh").disabled = Date.now() < retryUntil;
      }
    }
  }

  function changeQuery(values, immediate = true)
  {
    query = { ...query, ...values, cursor: "" };
    synchronizeControls(!immediate);
    window.clearTimeout(debounceTimer);
    if (immediate)
    {
      load();
    }
    else
    {
      controller?.abort();
      debounceTimer = window.setTimeout(load, 300);
    }
  }

  function openHelp()
  {
    dialogTrigger = document.activeElement;
    document.getElementById("orders-dialog-title").textContent = "Panduan Pesanan";
    document.getElementById("orders-dialog-content").innerHTML = `<div class="dialog-body">
      <p>Gunakan akun pelanggan yang dipakai saat checkout. Cari melalui nomor pesanan atau nama produk yang dibeli.</p>
      <p>Pembayaran, pengiriman dan refund mempunyai status terpisah. COD belum lunas tidak berarti pesanan belum diproses.</p>
      <p>Buka Detail Pesanan untuk pembatalan, komplain atau konfirmasi penerimaan. Periksa paket sebelum menyelesaikan pesanan.</p>
      <p>Dalam pratinjau ini, semua pesanan adalah data contoh. Login pelanggan dan katalog belum terhubung; tidak ada pesan atau transaksi sungguhan yang dikirim.</p>
    </div>
    <div class="dialog-actions"><button class="button" type="button" data-orders-action="close-dialog">Tutup</button></div>`;
    dialog.showModal();
    document.getElementById("orders-dialog-title").focus();
  }

  document.getElementById("orders-status-filters").innerHTML = statuses.map(([value, label]) => `<button
    class="orders-status-filter"
    type="button"
    data-orders-status="${escapeHtml(value)}"
    aria-pressed="false"
  >${escapeHtml(label)}</button>`).join("\n");
  synchronizeControls();
  form.addEventListener("submit", (event) =>
  {
    event.preventDefault();
    load();
  });
  document.getElementById("orders-search").addEventListener("input", (event) => changeQuery({ q: event.target.value.trim() }, false));
  document.getElementById("orders-sort").addEventListener("change", (event) => changeQuery({ sort: event.target.value }));
  for (const [id, field] of [["orders-date-from", "dateFrom"], ["orders-date-to", "dateTo"]])
  {
    document.getElementById(id).addEventListener("change", (event) => changeQuery({ [field]: event.target.value }));
  }
  document.addEventListener("click", (event) =>
  {
    document.querySelectorAll(".order-card-menu[open]").forEach((menu) =>
    {
      if (!menu.contains(event.target))
      {
        menu.open = false;
      }
    });
    const status = event.target.closest("[data-orders-status]");
    if (status)
    {
      changeQuery({ status: status.dataset.ordersStatus });
      return;
    }
    const link = event.target.closest("a[data-return-key]");
    if (link)
    {
      navigation.saveContext(link.dataset.returnKey, link.dataset.orderId);
      return;
    }
    const control = event.target.closest("[data-orders-action]");
    if (!control || control.disabled)
    {
      return;
    }
    switch (control.dataset.ordersAction)
    {
      case "refresh":
        load();
        break;
      case "reset":
        changeQuery({ q: "", status: "all", dateFrom: "", dateTo: "", sort: "newest" });
        break;
      case "clear-search":
        changeQuery({ q: "" });
        document.getElementById("orders-search").focus();
        break;
      case "clear-status":
        changeQuery({ status: "all" });
        break;
      case "clear-dates":
        changeQuery({ dateFrom: "", dateTo: "" });
        break;
      case "first":
        query.cursor = "";
        load({ focusResults: true });
        break;
      case "previous":
      case "next":
        query.cursor = control.dataset.ordersAction === "next" ? data.pagination.nextCursor : data.pagination.previousCursor || "";
        writeUrl(true);
        load({ focusResults: true });
        break;
      case "help":
        openHelp();
        break;
      case "close-dialog":
        dialog.close();
        break;
    }
  });
  document.addEventListener("keydown", (event) =>
  {
    if (event.key === "Escape")
    {
      const menu = document.querySelector(".order-card-menu[open]");
      if (menu)
      {
        menu.open = false;
        menu.querySelector("summary").focus();
      }
    }
  });
  document.addEventListener("toggle", (event) =>
  {
    if (event.target.matches(".order-card-menu[open]"))
    {
      const menu = event.target;
      menu.classList.remove("menu-up");
      if (menu.querySelector("nav").getBoundingClientRect().bottom > window.innerHeight - 8)
      {
        menu.classList.add("menu-up");
      }
      document.querySelectorAll(".order-card-menu[open]").forEach((menu) =>
      {
        if (menu !== event.target)
        {
          menu.open = false;
        }
      });
    }
  }, true);
  document.addEventListener("auxclick", (event) =>
  {
    const link = event.target.closest("a[data-return-key]");
    if (link)
    {
      navigation.saveContext(link.dataset.returnKey, link.dataset.orderId);
    }
  });
  document.getElementById("orders-date-filter").addEventListener("keydown", (event) =>
  {
    if (event.key === "Escape")
    {
      event.currentTarget.open = false;
      event.currentTarget.querySelector("summary").focus();
    }
  });
  dialog.addEventListener("close", () =>
  {
    document.getElementById("orders-dialog-content").replaceChildren();
    (dialogTrigger?.isConnected ? dialogTrigger : summary).focus({ preventScroll: true });
  });
  window.addEventListener("offline", () => load());
  window.addEventListener("online", () => load());
  window.addEventListener("popstate", () =>
  {
    query = readUrl();
    synchronizeControls();
    load({ focusResults: true });
  });
  window.addEventListener("pageshow", (event) =>
  {
    if (event.persisted)
    {
      load();
    }
  });
  document.addEventListener("visibilitychange", () =>
  {
    if (!document.hidden && data && !reading && !dialog.open)
    {
      load();
    }
  });
  load();
})();
