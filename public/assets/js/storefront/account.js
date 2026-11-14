"use strict";

(() =>
{
  const root = document.getElementById("account-root");
  const feedback = document.getElementById("account-feedback");
  const dialog = document.getElementById("account-dialog");
  const dialogTitle = document.getElementById("account-dialog-title");
  const content = document.getElementById("account-dialog-content");
  const adapter = window.RylvaAccountAdapter || window.RylvaAccountPreview.createAdapter();
  const validation = window.RylvaAccountValidation;
  const parameters = new URLSearchParams(location.search);
  const panels = { profile: "Profil", addresses: "Daftar Alamat", security: "Keamanan", privacy: "Privasi & Akun" };
  const messages =
  {
    loadError: "Informasi akun belum dapat dimuat. Coba lagi untuk membaca data terbaru.",
    refreshError: "Data terakhir belum berhasil diperbarui. Periksa koneksi lalu coba lagi.",
    offline: "Koneksi terputus. Sambungkan kembali sebelum menyimpan perubahan.",
    service: "Layanan akun sedang bermasalah. Coba lagi beberapa saat lagi.",
    maintenance: "Layanan akun sedang dalam pemeliharaan. Silakan periksa kembali nanti.",
    rateLimit: "Terlalu banyak percobaan. Tunggu sampai percobaan berikutnya tersedia.",
    login: "Masuk dengan akun pelanggan untuk mengelola profil dan alamat Anda.",
    session: "Sesi Anda telah berakhir. Masuk kembali untuk melanjutkan.",
    denied: "Tindakan ini tidak diizinkan untuk akun atau kondisi saat ini.",
    verification: "Selesaikan verifikasi registrasi sebelum mengakses pengaturan akun.",
    unavailable: "Akun tidak tersedia. Periksa akses akun Anda melalui alur masuk.",
    inactive: "Akun ini tidak aktif. Pengaturan akun tidak dapat diubah.",
    anonymized: "Anonimisasi akun telah selesai. Informasi pribadi tidak lagi ditampilkan.",
    invalid: "Data akun belum lengkap atau tidak valid. Muat ulang sebelum mengubah informasi.",
    saveError: "Perubahan belum tersimpan. Periksa koneksi lalu coba lagi.",
    conflict: "Data ini sudah berubah. Muat data terbaru dan tinjau kembali perubahan Anda.",
    csrf: "Keamanan formulir perlu diperbarui. Periksa data terbaru sebelum mengirim lagi.",
    timeout: "Hasil perubahan belum dapat dipastikan. Periksa hasil terbaru sebelum mengirim lagi.",
    duplicate: "Permintaan serupa sudah tercatat. Periksa hasil terbaru tanpa mengirim ulang.",
    validation: "Periksa isian yang ditandai, lalu simpan kembali.",
    emailConflict: "Email ini belum dapat digunakan. Periksa alamat email atau gunakan alamat lain.",
    codeInvalid: "Kode tidak valid. Periksa kode terbaru yang Anda gunakan.",
    codeExpired: "Kode tidak berlaku atau batas kesalahan tercapai. Minta kode baru untuk melanjutkan.",
    wrongPassword: "Kata sandi tidak dapat diverifikasi. Periksa kembali isian Anda.",
    notFound: "Alamat tidak tersedia. Kembali ke daftar untuk membaca alamat terbaru.",
    limit: "Batas alamat tersimpan telah tercapai. Ubah atau hapus alamat yang tidak digunakan.",
    sendError: "Kode belum berhasil dikirim. Periksa hasil terbaru sebelum meminta kode lagi."
  };
  let panel = Object.hasOwn(panels, parameters.get("section")) ? parameters.get("section") : "profile";
  let snapshot = null;
  let reading = false;
  let busy = false;
  let stale = false;
  let uncertain = false;
  let reconciliationCode = null;
  let retryAt = 0;
  let addressQuery = "";
  let requestRevision = 0;
  let controller = null;
  let modalAction = null;
  let modalId = null;
  let addressDraft = null;
  let originalForm = "";
  let dialogTrigger = null;
  let discardState = null;
  let bodyOverflow = "";
  let serverTime = 0;
  let receivedAt = 0;
  let locationQuery = "";
  let currentUrl = location.href;
  let failureCode = null;
  let locationMap = null;
  let locationController = null;
  let locationResults = [];
  let locationRevision = 0;

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

  function button(action, label, options = {})
  {
    return `<button type="button" class="button ${options.primary ? "button-primary" : "button-secondary"}"
      data-account-action="${action}" ${options.id ? `data-id="${escapeHtml(options.id)}"` : ""}
      ${options.disabled ? "disabled" : ""} ${options.aria ? `aria-label="${escapeHtml(options.aria)}"` : ""}>${escapeHtml(label)}</button>`;
  }

  function badge(label)
  {
    return `<span class="badge">${escapeHtml(label)}</span>`;
  }

  function notice(title, text, actions = "")
  {
    return `<div class="account-notice">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(text)}</p>
      ${actions}
    </div>`;
  }

  function method()
  {
    if (snapshot.googleLinked)
    {
      return snapshot.hasPassword ? "Email & kata sandi, Google" : "Google";
    }
    return "Email & kata sandi";
  }

  function allowed(action)
  {
    return Boolean(snapshot?.capabilities?.[action] && !stale && !reading && !busy && !uncertain && navigator.onLine);
  }

  function now()
  {
    return serverTime ? serverTime + performance.now() - receivedAt : Date.now();
  }

  function clearPrivateContext()
  {
    try
    {
      for (const key of Object.keys(sessionStorage))
      {
        if (["rylva-account-preview-", "rylva-orders-navigation-", "rylva-customer-orders-preview-"].some((prefix) => key.startsWith(prefix)))
        {
          sessionStorage.removeItem(key);
        }
      }
      sessionStorage.setItem("rylva-account-preview-access-v1", "signed-out");
    }
    catch
    {
      // No persisted private context exists when storage is unavailable.
    }
  }

  function returnUrl()
  {
    const fallback = "/pages/customer/my-orders.html";
    const key = parameters.get("returnKey");
    if (key && /^[\w-]{1,80}$/.test(key))
    {
      try
      {
        const context = JSON.parse(sessionStorage.getItem("rylva-orders-navigation-v1:" + key));
        const url = new URL(context.url, location.origin);
        if (context.customerId === snapshot?.id && url.origin === location.origin && url.pathname === fallback && !url.username && !url.password)
        {
          url.searchParams.set("restoreKey", key);
          return url.pathname + url.search;
        }
      }
      catch
      {
        return fallback;
      }
    }
    try
    {
      const url = new URL(parameters.get("returnTo") || fallback, location.origin);
      const paths = [fallback, "/pages/customer/payment.html", "/pages/customer/order-detail.html"];
      return url.origin === location.origin && paths.includes(url.pathname) && !url.username && !url.password
        ? url.pathname + url.search : fallback;
    }
    catch
    {
      return fallback;
    }
  }

  function panelUrl(nextPanel)
  {
    const url = new URL(location.href);
    url.searchParams.set("section", nextPanel);
    return url.pathname + url.search;
  }

  function ordersUrl()
  {
    const destination = returnUrl();
    return destination.startsWith("/pages/customer/my-orders.html")
      ? destination : "/pages/customer/my-orders.html";
  }

  function identityRows()
  {
    const rows = [
      ["Nama", snapshot.name, "profile", "Ubah nama"],
      ["Email", snapshot.email, "email", "Ubah email"],
      ["Nomor HP", snapshot.phone || "Belum ditambahkan", "profile", "Ubah nomor HP"]
    ];
    return rows.map(([label, value, action, aria], index) =>
    {
      return `${index === 1 ? "</dl>\n<h3>Kontak Akun</h3>\n<dl>" : ""}
        <div class="account-data-row">
          <dt>${label}</dt>
          <dd>${escapeHtml(value)}${index === 1 && snapshot.emailVerified ? `<br>${badge("Terverifikasi")}` : ""}</dd>
          ${button(action, "Ubah", { disabled: !allowed(action), aria })}
        </div>`;
    }).join("\n");
  }

  function pendingEmailNotice()
  {
    const pending = snapshot.pendingEmail;
    if (!pending)
    {
      return "";
    }
    const masked = pending.email.replace(/^(.{1,2})[^@]*(@.*)$/, "$1•••$2");
    return notice(pending.sent ? "Email baru menunggu verifikasi" : "Kode belum berhasil dikirim",
      "Tujuan: " + masked + ". Email akun saat ini tetap digunakan sampai verifikasi berhasil.",
      button("verifyEmail", pending.sent ? "Masukkan Kode" : "Kirim Ulang Kode", { disabled: !allowed("email") })
        + button("email", "Ubah Email Tujuan", { disabled: !allowed("email") }));
  }

  function profilePanel()
  {
    return `${pendingEmailNotice()}
      <h2 tabindex="-1" id="account-panel-title">Profil Saya</h2>
      <div class="account-profile-grid">
        <div class="account-identity">
          <div class="account-initials" aria-hidden="true">${initials()}</div>
          <strong>Akun Pelanggan</strong>
          <p class="account-muted">${escapeHtml(method())}</p>
          ${button("security", "Atur Keamanan")}
        </div>
        <div class="account-data">
          <h3>Informasi Pribadi</h3>
          <dl>${identityRows()}</dl>
          <p class="account-muted">Nomor akun dapat berbeda dari nomor penerima pada alamat pengiriman.</p>
        </div>
      </div>
      ${!snapshot.capabilities.email ? notice("Perubahan email belum tersedia", "Metode masuk akun ini memerlukan alur verifikasi tambahan. Email tidak diubah melalui formulir biasa.") : ""}`;
  }

  function addressCards()
  {
    const query = addressQuery.trim().toLocaleLowerCase("id-ID");
    const addresses = snapshot.addresses.filter((address) =>
    {
      return [address.label, address.recipient, address.street, address.city].join(" ").toLocaleLowerCase("id-ID").includes(query);
    });
    if (!snapshot.addresses.length || !addresses.length)
    {
      return `<div class="account-empty">
        <h3>${snapshot.addresses.length ? "Alamat tidak ditemukan" : "Belum ada alamat tersimpan"}</h3>
        <p class="account-muted">${snapshot.addresses.length ? "Coba kata kunci lain atau hapus pencarian." : "Simpan alamat agar lebih mudah memilih tujuan saat checkout."}</p>
        ${snapshot.addresses.length ? button("resetSearch", "Hapus Pencarian") : button("addAddress", "Tambah Alamat", { primary: true, disabled: !allowed("address") })}
      </div>`;
    }
    return addresses.map((address) =>
    {
      return `<article class="account-address" data-address-id="${escapeHtml(address.id)}" data-primary="${Boolean(address.primary)}">
        <div class="account-address-heading">
          <h3>${escapeHtml(address.label)}</h3>
          ${address.primary ? badge("Alamat Utama") : ""}
        </div>
        <p class="account-address-contact">
          <strong>${escapeHtml(address.recipient)}</strong>
          <span>${escapeHtml(address.recipientPhone)}</span>
        </p>
        <p class="account-address-street">${escapeHtml(address.street)}</p>
        <p class="account-address-region">${escapeHtml([address.village, address.district, address.city, address.province, address.postcode].join(" - "))}</p>
        ${address.note ? `<p class="account-muted">Patokan: ${escapeHtml(address.note)}</p>` : ""}
        <p class="account-address-point">${icon("pin")}${address.point ? "Sudah PinPoint" : "Belum ada titik lokasi untuk instan/same-day"}</p>
        <div class="account-address-actions">
          ${button("editAddress", "Ubah", { id: address.id, disabled: !allowed("address"), aria: "Ubah alamat " + address.label })}
          ${address.primary ? "" : button("primary", "Jadikan Alamat Utama", { id: address.id, disabled: !allowed("address") })}
          ${button("removeAddress", "Hapus", { id: address.id, disabled: !allowed("address"), aria: "Hapus alamat " + address.label })}
        </div>
      </article>`;
    }).join("\n");
  }

  function addressesPanel()
  {
    if (!snapshot.addressesAvailable)
    {
      return `<h2 tabindex="-1" id="account-panel-title">Daftar Alamat</h2>
        ${notice("Alamat belum dapat dimuat", "Informasi profil tetap tersedia. Coba muat lagi bagian alamat.", button("refresh", "Coba Lagi"))}`;
    }
    const atLimit = snapshot.addresses.length >= snapshot.limits.addresses;
    return `<div class="account-panel-heading">
        <div>
          <h2 tabindex="-1" id="account-panel-title">Daftar Alamat</h2>
          <p class="account-muted">${snapshot.addresses.length} dari ${snapshot.limits.addresses} alamat tersimpan</p>
        </div>
      </div>
      ${atLimit ? notice("Batas alamat tersimpan tercapai", "Ubah atau hapus alamat yang tidak digunakan untuk menambahkan alamat baru.") : ""}
      <div class="account-address-toolbar">
        ${snapshot.addresses.length ? `<label class="account-search" for="account-address-search">
          <span class="visually-hidden">Cari alamat</span>
          ${icon("search")}
          <input id="account-address-search" type="search" maxlength="100" value="${escapeHtml(addressQuery)}" placeholder="Cari alamat">
        </label>` : ""}
        ${snapshot.addresses.length ? button("addAddress", "Buat Alamat Baru", { primary: true, disabled: atLimit || !allowed("address") }) : ""}
      </div>
      <div id="account-address-list" class="account-address-list">${addressCards()}</div>
      <p class="account-muted" style="margin-top: var(--space-lg)">Perubahan alamat tersimpan tidak mengubah alamat pada pesanan yang sudah dibuat.</p>`;
  }

  function securityPanel()
  {
    return `<h2 tabindex="-1" id="account-panel-title">Keamanan Akun</h2>
      <div class="account-security-layout">
        <div class="account-security-overview">
          <section class="account-section-block">
            <h3>Metode Masuk</h3>
            <p>${escapeHtml(method())}</p>
            <p class="account-muted">${snapshot.googleLinked ? "Akun Google sudah tertaut." : "Akun ini menggunakan email dan kata sandi."}</p>
          </section>
          <section class="account-section-block">
            <h3>Kata Sandi</h3>
            <p class="account-muted">${snapshot.hasPassword ? "Gunakan kata sandi yang kuat. Perubahan kata sandi akan mengakhiri sesi lain." : "Akun ini belum memiliki kata sandi. Penambahan dilakukan melalui pemulihan akun."}</p>
            <div class="account-section-actions">
              ${button(snapshot.hasPassword ? "password" : "recovery", snapshot.hasPassword ? "Ubah Kata Sandi" : "Tambahkan Kata Sandi", { primary: true, disabled: !allowed("password") })}
            </div>
          </section>
        </div>
        <section class="account-section-block account-login-activity" aria-labelledby="account-login-title">
          <div class="account-panel-heading">
            <h3 id="account-login-title">Aktivitas Login</h3>
            ${button("refresh", "Perbarui Aktivitas", { disabled: reading || busy })}
          </div>
          <p class="account-muted">Jika ada perangkat yang tidak Anda kenali, akhiri sesinya lalu ubah kata sandi.</p>
          ${loginSessions()}
        </section>
      </div>`;
  }

  function loginSessions()
  {
    if (!snapshot.sessionsAvailable || !Array.isArray(snapshot.sessions))
    {
      return notice("Aktivitas login belum tersedia", "Informasi perangkat belum dapat dimuat. Coba perbarui aktivitas.", button("refresh", "Coba Lagi"));
    }
    const formatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });
    const sessions = [...snapshot.sessions].sort((first, second) => Number(second.current) - Number(first.current));
    return `<ul class="account-sessions">
      ${sessions.map((session) => `<li class="account-session" data-session-id="${escapeHtml(session.id)}">
        ${icon(session.type === "phone" ? "phone" : "desktop")}
        <div>
          <strong>${escapeHtml(session.device || "Perangkat tidak diketahui")}</strong>
          <p class="account-muted">${escapeHtml(session.ip || "IP belum tersedia")}</p>
          ${session.current ? '<span class="account-session-current">Perangkat Ini · Sedang Aktif</span>'
            : `<p class="account-muted">Aktif ${Number.isFinite(Date.parse(session.lastActiveAt)) ? formatter.format(new Date(session.lastActiveAt)) + " WIB" : "pada waktu yang belum tersedia"}</p>`}
        </div>
        ${session.current ? "" : button("revokeSession", "Akhiri Sesi", { id: session.id, disabled: !allowed("revokeSession"), aria: "Akhiri sesi " + session.device })}
      </li>`).join("\n")}
    </ul>
    ${sessions.every((session) => session.current) ? '<p class="account-muted">Tidak ada sesi lain yang aktif.</p>' : ""}`;
  }

  function privacyPanel()
  {
    return `<h2 tabindex="-1" id="account-panel-title">Privasi & Akun</h2>
      <section class="account-section-block">
        <h3>Penghapusan Akun</h3>
        <p class="account-muted">Anda dapat mengajukan penghapusan akun. Anonimisasi diproses setelah tidak ada pesanan aktif atau refund yang berjalan. Riwayat transaksi yang wajib disimpan tetap dipertahankan.</p>
        ${snapshot.deletion ? notice("Permintaan sudah tercatat", snapshot.hasActiveTransactions ? "Menunggu penyelesaian pesanan aktif atau refund. Akun belum dianonimkan." : "Menunggu pemrosesan. Akun belum dianonimkan.", button("refresh", "Periksa Status")) : ""}
        ${snapshot.hasActiveTransactions ? `<p class="account-muted">Masih ada pesanan aktif atau refund yang berjalan.</p>
          <a class="text-button" href="${escapeHtml(ordersUrl())}">Lihat Pesanan Saya</a>` : ""}
        ${!snapshot.capabilities.deletion ? notice("Verifikasi tambahan diperlukan", "Pengajuan untuk metode masuk akun ini belum tersedia. Akses akun tetap dapat digunakan sesuai izin.") : ""}
        ${!snapshot.deletion ? `<div class="account-section-actions">${button("deletion", "Ajukan Penghapusan Akun", { disabled: !allowed("deletion") })}</div>` : ""}
      </section>
      <section class="account-section-block">
        <h3>Keluar dari Akun</h3>
        <p class="account-muted">Akhiri sesi pada perangkat ini. Pastikan perubahan yang diperlukan sudah tersimpan.</p>
        <div class="account-section-actions">${button("logout", "Keluar dari Akun", { primary: true, disabled: reading || busy || stale })}</div>
      </section>`;
  }

  function initials()
  {
    return escapeHtml(snapshot.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0]).join("").toLocaleUpperCase("id-ID"));
  }

  function render()
  {
    if (!snapshot)
    {
      return;
    }
    const focusedControl = root.contains(document.activeElement)
      ? document.activeElement.closest("[data-account-action]") : null;
    const focusToken = focusedControl ? {
      action: focusedControl.dataset.accountAction,
      id: focusedControl.dataset.id,
      label: focusedControl.getAttribute("aria-label")
    } : null;
    document.getElementById("account-back").href = returnUrl();
    document.getElementById("account-back").textContent = returnUrl().includes("/payment.html")
      ? "Kembali ke Pembayaran" : (returnUrl().includes("/order-detail.html") ? "Kembali ke Detail Pesanan" : "Pesanan Saya");
    const panelContent = { profile: profilePanel, addresses: addressesPanel, security: securityPanel, privacy: privacyPanel }[panel]();
    root.innerHTML = `<div class="account-layout">
      <aside class="account-sidebar" aria-label="Ringkasan akun">
        <div class="account-person">
          <span class="account-initials" aria-hidden="true">${initials()}</span>
          <div>
            <strong>${escapeHtml(snapshot.name)}</strong>
            <small>Pelanggan RylVa</small>
          </div>
        </div>
        <nav aria-label="Menu pelanggan">
          <a class="account-side-link" href="${escapeHtml(ordersUrl())}">${icon("bag")}Pesanan Saya</a>
          <a class="account-side-link" href="${escapeHtml(panelUrl(panel))}" aria-current="page">${icon("shield")}Pengaturan Akun</a>
        </nav>
      </aside>
      <section class="account-workspace" aria-label="Pengaturan pelanggan">
        <nav class="account-tabs" aria-label="Bagian pengaturan akun">
          ${Object.entries(panels).map(([key, label]) => `<a href="${escapeHtml(panelUrl(key))}" data-account-panel="${key}" ${key === panel ? 'aria-current="page"' : ""}>${label}</a>`).join("\n")}
        </nav>
        <div class="account-panel">
          ${stale ? notice("Data perlu diperbarui", "Tindakan belum tersedia sampai informasi akun terbaru dimuat.", button("refresh", "Muat Terbaru")) : ""}
          ${Object.values(snapshot.capabilities).every((value) => !value) ? notice("Akun hanya dapat dilihat", "Perubahan belum tersedia untuk kondisi akun ini.") : ""}
          ${panelContent}
          <div class="account-section-actions">${button("refresh", "Perbarui Informasi", { disabled: reading || busy || now() < retryAt })}</div>
        </div>
      </section>
    </div>`;
    if (focusToken)
    {
      const target = Array.from(root.querySelectorAll("[data-account-action]")).find((element) =>
      {
        return element.dataset.accountAction === focusToken.action && element.dataset.id === focusToken.id
          && element.getAttribute("aria-label") === focusToken.label && !element.disabled;
      });
      (target || document.getElementById("account-panel-title"))?.focus({ preventScroll: true });
    }
  }

  function emptyPage(title, description, code)
  {
    root.innerHTML = `<section class="account-workspace account-panel account-empty">
      <h2 tabindex="-1" id="account-panel-title">${escapeHtml(title)}</h2>
      <p>${escapeHtml(description)}</p>
      <div class="account-section-actions">
        ${["login", "session", "denied", "verification", "inactive", "anonymized", "unavailable"].includes(code)
          ? button("accessHelp", "Panduan Akses") : button("refresh", "Coba Lagi", { primary: true, disabled: now() < retryAt })}
        <a class="text-button" href="/pages/customer/my-orders.html">Kembali ke Pesanan Saya</a>
      </div>
    </section>`;
  }

  async function load({ reconcile = false } = {})
  {
    controller?.abort();
    controller = new AbortController();
    const revision = ++requestRevision;
    reading = true;
    root.setAttribute("aria-busy", "true");
    if (!snapshot)
    {
      root.innerHTML = `<div class="account-skeleton" aria-label="Memuat informasi akun">
        <div></div>
        <div></div>
        <div></div>
        <p>Memuat informasi akun…</p>
      </div>`;
    }
    else
    {
      render();
    }
    const timer = setTimeout(() =>
    {
      if (revision !== requestRevision)
      {
        return;
      }
      controller.abort();
      reading = false;
      root.setAttribute("aria-busy", "false");
      if (!snapshot)
      {
        emptyPage("Data belum selesai dimuat", "Permintaan memerlukan waktu lebih lama. Coba muat ulang tanpa mengubah tujuan halaman.", "slow");
      }
      else
      {
        stale = true;
        render();
      }
    }, 6000);
    try
    {
      const result = await adapter.getSnapshot({ signal: controller.signal });
      if (revision !== requestRevision)
      {
        return;
      }
      if (!result.active)
      {
        throw Object.assign(new Error("session"), { code: "session" });
      }
      if (typeof result.name !== "string" || !result.name.trim() || typeof result.email !== "string"
        || !Array.isArray(result.addresses) || !result.capabilities || !result.limits)
      {
        throw Object.assign(new Error("invalid"), { code: "invalid" });
      }
      snapshot = result;
      failureCode = null;
      stale = Boolean(result.stale);
      serverTime = result.serverNow || Date.now();
      receivedAt = performance.now();
      reading = false;
      if (reconcile)
      {
        uncertain = false;
        if (["csrf", "conflict"].includes(reconciliationCode))
        {
          showErrors({}, "Data terbaru telah dimuat. "
            + (modalAction === "profile" ? "Nama tersimpan: " + snapshot.name + ". " : "")
            + "Isian Anda dipertahankan; tinjau kembali sebelum menyimpan.");
        }
        else
        {
          closeDialog(true);
          feedback.textContent = "Data terbaru ditampilkan. Periksa hasil perubahan sebelum melanjutkan.";
        }
        reconciliationCode = null;
      }
      render();
      updateClocks();
    }
    catch (error)
    {
      if (revision !== requestRevision || error.code === "aborted")
      {
        return;
      }
      reading = false;
      failureCode = error.code || "loadError";
      retryAt = error.retryAt || 0;
      if (["login", "session", "denied", "verification", "inactive", "anonymized", "unavailable"].includes(failureCode))
      {
        snapshot = null;
        addressQuery = "";
        clearPrivateContext();
        closeDialog(true);
        feedback.textContent = "";
      }
      if (snapshot)
      {
        stale = true;
        render();
        feedback.textContent = messages[failureCode] || messages.loadError;
      }
      else
      {
        emptyPage(failureCode === "anonymized" ? "Akun telah dianonimkan" : "Informasi Akun", messages[failureCode] || messages.loadError, failureCode);
      }
    }
    finally
    {
      clearTimeout(timer);
      if (revision === requestRevision)
      {
        reading = false;
        root.setAttribute("aria-busy", "false");
      }
    }
  }

  function formValues()
  {
    const form = content.querySelector("form");
    return form ? Object.fromEntries(new FormData(form)) : {};
  }

  function isDirty()
  {
    return Boolean(modalAction && !["verifyEmail", "primary", "removeAddress", "logout", "deletion", "help", "recovery"].includes(modalAction)
      && (JSON.stringify(formValues()) !== originalForm || addressDraft?.dirty));
  }

  function closeDialog(force = false)
  {
    if ((busy && !force) || (!force && isDirty()))
    {
      if (!busy)
      {
        askDiscard(() => closeDialog(true));
      }
      return;
    }
    disposeMap();
    dialog.close();
    content.replaceChildren();
    modalAction = null;
    addressDraft = null;
    discardState = null;
    document.body.style.overflow = bodyOverflow;
    (dialogTrigger?.isConnected ? dialogTrigger : document.getElementById("account-panel-title"))?.focus({ preventScroll: true });
  }

  function showDialog(title, html)
  {
    disposeMap();
    dialogTitle.textContent = title;
    content.innerHTML = html;
    if (!dialog.open)
    {
      bodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      dialog.showModal();
    }
    originalForm = JSON.stringify(formValues());
    dialogTitle.focus();
  }

  function askDiscard(callback)
  {
    if (discardState)
    {
      return;
    }
    const fragment = document.createDocumentFragment();
    fragment.append(...content.childNodes);
    discardState = { fragment, title: dialogTitle.textContent, callback };
    dialogTitle.textContent = "Perubahan Belum Disimpan";
    content.innerHTML = `<div class="account-dialog-body">
      <p>Perubahan Anda belum disimpan. Tetap mengedit atau buang perubahan untuk melanjutkan.</p>
      <div class="dialog-actions">
        ${button("keepEditing", "Tetap Mengedit", { primary: true })}
        ${button("discard", "Buang Perubahan")}
      </div>
    </div>`;
    dialogTitle.focus();
  }

  function field(name, label, value = "", options = {})
  {
    const type = options.type || "text";
    const input = type === "textarea" ? `<textarea id="account-${name}" name="${name}" rows="3"
      maxlength="${options.max || 255}" autocomplete="street-address"
      aria-describedby="account-${name}-help account-${name}-error">${escapeHtml(value)}</textarea>`
      : `<input id="account-${name}" name="${name}" type="${type}"
      value="${type === "password" ? "" : escapeHtml(value)}" maxlength="${options.max || 100}"
      ${options.autocomplete ? `autocomplete="${options.autocomplete}"` : ""}
      ${options.inputmode ? `inputmode="${options.inputmode}"` : ""}
      aria-describedby="account-${name}-help account-${name}-error">`;
    return `<div class="account-field">
      <label for="account-${name}">${label}</label>
      ${type === "password" ? `<div class="account-password">
        ${input}
        ${button("togglePassword", "Tampilkan", { id: name, aria: "Tampilkan " + label.toLowerCase() })}
      </div>` : input}
      <small id="account-${name}-help">${escapeHtml(options.help || "")}</small>
      <p class="account-error" id="account-${name}-error"></p>
    </div>`;
  }

  function reauthentication()
  {
    return snapshot.hasPassword ? field("currentPassword", "Kata Sandi Saat Ini", "",
      { type: "password", max: 128, autocomplete: "current-password", help: "Pratinjau: gunakan isian contoh, bukan kata sandi akun asli." }) : "";
  }

  function form(body, submitLabel = "Simpan Perubahan")
  {
    return `<form id="account-form" novalidate>
      <div id="account-form-error" class="account-error" role="alert" tabindex="-1"></div>
      ${body}
      <div class="dialog-actions">
        ${button("close", "Batal")}
        <button type="submit" class="button button-primary" id="account-submit">${submitLabel}</button>
      </div>
    </form>`;
  }

  function openAction(action, id = null, trigger = null)
  {
    if (busy || reading)
    {
      return;
    }
    dialogTrigger = trigger || document.activeElement;
    modalAction = action;
    modalId = id;
    uncertain = false;
    if (action === "profile")
    {
      showDialog("Ubah Profil", form(field("name", "Nama Lengkap", snapshot.name, { autocomplete: "name" })
        + field("phone", "Nomor HP Akun", snapshot.phone, { type: "tel", max: 20, autocomplete: "tel", help: "Nomor penerima di tiap alamat dikelola terpisah." }), "Simpan Profil"));
    }
    else if (action === "email")
    {
      showDialog("Ubah Email", form(`<p class="account-muted">Email akun: ${escapeHtml(snapshot.email)}. Email ini tetap digunakan sampai email baru terverifikasi.</p>
        ${field("email", "Email Baru", snapshot.pendingEmail?.email || "", { type: "email", max: 254, autocomplete: "email" })}
        ${reauthentication()}`, "Lanjutkan Verifikasi"));
    }
    else if (action === "verifyEmail")
    {
      showDialog("Verifikasi Email Baru", form(`<p>Masukkan kode untuk email tujuan baru. Email akun belum berubah.</p>
        ${field("code", "Kode Verifikasi", "", { max: 6, inputmode: "numeric", autocomplete: "one-time-code" })}
        <p id="account-code-status" class="account-muted"></p>
        ${button("resend", "Kirim Ulang Kode")}`, "Verifikasi Email"));
      updateClocks();
    }
    else if (action === "password")
    {
      showDialog("Ubah Kata Sandi", form(`<p class="account-muted">Setelah berhasil, sesi lain akan berakhir. Gunakan kata sandi 8–128 karakter.</p>
        ${reauthentication()}
        ${field("newPassword", "Kata Sandi Baru", "", { type: "password", max: 128, autocomplete: "new-password" })}
        ${field("confirmPassword", "Konfirmasi Kata Sandi Baru", "", { type: "password", max: 128, autocomplete: "new-password" })}`, "Simpan Kata Sandi"));
    }
    else if (action === "addAddress" || action === "editAddress")
    {
      const address = id ? snapshot.addresses.find((item) => item.id === id) : null;
      if (id && !address)
      {
        closeDialog(true);
        feedback.textContent = messages.notFound;
        return;
      }
      modalAction = "address";
      addressDraft = address ? { ...structuredClone(address), dirty: false } : { primary: false, point: null, dirty: false };
      if (address)
      {
        showAddressForm();
      }
      else
      {
        showLocation();
      }
    }
    else if (action === "primary" || action === "removeAddress")
    {
      const address = snapshot.addresses.find((item) => item.id === id);
      if (!address)
      {
        return;
      }
      showDialog(action === "primary" ? "Jadikan Alamat Utama?" : "Hapus Alamat?", form(`<p><strong>${escapeHtml(address.label)} · ${escapeHtml(address.recipient)}</strong></p>
        <p>${escapeHtml(address.street)}</p>
        <p class="account-muted">${action === "primary" ? "Alamat ini menjadi pilihan utama untuk pemesanan berikutnya." : "Alamat dihapus dari buku alamat. Alamat pada pesanan lama tetap tersimpan."}</p>`, action === "primary" ? "Jadikan Utama" : "Hapus Alamat"));
    }
    else if (action === "deletion")
    {
      showDialog("Ajukan Penghapusan Akun", form(`<p>Permintaan ini bukan penghapusan langsung. Anonimisasi menunggu pesanan aktif dan refund selesai; data transaksi yang wajib disimpan tetap dipertahankan.</p>
        ${reauthentication()}`, "Ajukan Permintaan"));
    }
    else if (action === "logout")
    {
      showDialog("Keluar dari Akun?", form("<p>Sesi pada perangkat ini akan diakhiri. Perubahan yang sudah tersimpan tetap ada.</p>", "Keluar dari Akun"));
    }
    else if (action === "revokeSession")
    {
      const session = snapshot.sessions?.find((entry) => entry.id === id && !entry.current);
      if (!session || !allowed("revokeSession"))
      {
        return;
      }
      showDialog("Akhiri Sesi Perangkat?", form(`<p><strong>${escapeHtml(session.device)}</strong></p>
        <p>Akses akun pada perangkat tersebut akan diakhiri. Perangkat ini tetap masuk.</p>`, "Akhiri Sesi"));
    }
    else
    {
      modalAction = "help";
      showDialog(action === "recovery" ? "Tambahkan Kata Sandi" : "Panduan Akses", `<div class="account-dialog-body">
        <p>${action === "recovery" ? "Akun Google-only dapat menambahkan kata sandi melalui pemulihan akun. Halaman pemulihan belum terhubung pada pratinjau ini; tidak ada email yang dikirim." : "Login, verifikasi dan pemulihan pelanggan belum terhubung pada pratinjau ini. Data akun sungguhan tidak diproses di halaman ini."}</p>
        <div class="dialog-actions">${button("close", "Tutup", { primary: true })}</div>
      </div>`);
    }
  }

  function showLocation()
  {
    showDialog(modalId ? "Ubah Titik Lokasi" : "Tambah Alamat · Lokasi", `<div class="account-dialog-body">
      <p class="account-muted">Cari jalan atau area, lalu pilih titik pengiriman pada peta.</p>
      <div class="account-map-search">
        <label class="account-field" for="account-location-search">Cari lokasi
          <input id="account-location-search" type="search" maxlength="100" value="${escapeHtml(locationQuery)}" placeholder="Cari jalan atau area">
        </label>
        ${button("searchMap", "Cari")}
      </div>
      <p id="account-map-status" role="status" class="account-muted">Memuat peta…</p>
      <div id="account-map" class="account-map" tabindex="0"></div>
      ${button("selectMapCenter", "Pilih Titik Tengah Peta", { disabled: true })}
      <div id="account-location-results"></div>
      <p class="account-map-credit">Peta © OpenStreetMap. Pencarian lokasi oleh Photon. Nama dan nomor HP penerima tidak dikirim ke layanan peta.</p>
      <div class="dialog-actions">
        ${button("close", "Batal")}
        ${button("manualAddress", "Isi Alamat Manual", { primary: true })}
      </div>
    </div>`);
    renderLocations();
    const revision = locationRevision;
    if (parameters.get("state") === "mapUnavailable")
    {
      mapFailure();
      return;
    }
    window.RylvaAccountMap.mount(document.getElementById("account-map"), addressDraft.point, selectMapPoint, mapFailure).then((map) =>
    {
      if (revision !== locationRevision || !document.getElementById("account-map"))
      {
        map?.destroy();
        return;
      }
      locationMap = map;
      document.querySelector('[data-account-action="selectMapCenter"]').disabled = false;
      document.getElementById("account-map-status").textContent = "Klik titik tujuan, atau geser peta dengan tombol panah lalu pilih titik tengah.";
    }).catch(() =>
    {
      if (revision === locationRevision && document.getElementById("account-map"))
      {
        mapFailure();
      }
    });
  }

  function disposeMap()
  {
    locationRevision++;
    locationController?.abort();
    locationMap?.destroy();
    locationMap = null;
  }

  function mapFailure()
  {
    if (!addressDraft || !document.getElementById("account-map"))
    {
      return;
    }
    addressDraft.manualDetails = true;
    addressDraft.mapUnavailable = true;
    showAddressForm();
  }

  function applyLocation(address)
  {
    for (const key of ["point", "street", "village", "district", "city", "province", "postcode"])
    {
      addressDraft[key] = structuredClone(address[key] || (key === "point" ? null : ""));
    }
    addressDraft.dirty = true;
    addressDraft.mapUnavailable = false;
    addressDraft.manualDetails = false;
    showAddressForm();
  }

  async function selectMapPoint(point)
  {
    locationController?.abort();
    locationController = new AbortController();
    const revision = ++locationRevision;
    locationMap?.select(point);
    const status = document.getElementById("account-map-status");
    status.textContent = "Membaca rincian wilayah dari titik yang dipilih…";
    try
    {
      const results = await window.RylvaAccountMap.reverse(point, locationController.signal);
      if (revision !== locationRevision || !document.getElementById("account-map"))
      {
        return;
      }
      // A nearby feature describes the address; the selected delivery point stays exact.
      applyLocation({ ...(results[0] || {}), point });
    }
    catch (error)
    {
      if (revision === locationRevision && error.name !== "AbortError")
      {
        addressDraft.point = point;
        mapFailure();
      }
    }
  }

  async function searchMap()
  {
    if (locationQuery.trim().length < 3)
    {
      document.getElementById("account-map-status").textContent = "Masukkan setidaknya 3 karakter nama jalan atau area.";
      return;
    }
    locationController?.abort();
    locationController = new AbortController();
    const revision = ++locationRevision;
    document.getElementById("account-map-status").textContent = "Mencari lokasi…";
    try
    {
      const results = await window.RylvaAccountMap.search(locationQuery.trim(), locationController.signal);
      if (revision !== locationRevision || !document.getElementById("account-map"))
      {
        return;
      }
      locationResults = results;
      document.getElementById("account-map-status").textContent = results.length ? "Pilih hasil lokasi di bawah." : "Lokasi tidak ditemukan. Coba nama area lain atau isi alamat manual.";
      document.getElementById("account-location-results").innerHTML = results.map((result, index) => `<button type="button" class="account-location-result" data-account-action="chooseMapResult" data-id="${index}">
        ${escapeHtml(result.title || result.street || "Lokasi pada peta")}
      </button>`).join("\n");
    }
    catch (error)
    {
      if (revision === locationRevision && error.name !== "AbortError")
      {
        mapFailure();
      }
    }
  }

  function renderLocations()
  {
    const element = document.getElementById("account-location-results");
    if (!element)
    {
      return;
    }
    const addresses = snapshot.addresses.filter((item) => item.point && (item.street + item.label).toLocaleLowerCase().includes(locationQuery.toLocaleLowerCase()));
    element.innerHTML = parameters.get("state") === "mapUnavailable"
      ? notice("Lokasi belum dapat dimuat", "Rincian alamat tetap dapat diisi manual. Titik lokasi diperlukan saat memakai instan/same-day.")
      : addresses.map((address) => `<button type="button" class="account-location-result" data-account-action="chooseLocation" data-id="${escapeHtml(address.id)}">
        <strong>${escapeHtml(address.label)}</strong>
        <br>${escapeHtml(address.street)}
        <br>Gunakan titik tersimpan ini
      </button>`).join("\n") || "<p class=\"account-muted\">Lokasi tersimpan tidak ditemukan. Ubah pencarian atau isi alamat manual.</p>";
  }

  function showAddressForm()
  {
    const draft = addressDraft;
    const complete = ["village", "district", "city", "province"].every((key) => String(draft[key] || "").trim())
      && /^\d{5}$/.test(String(draft.postcode || ""));
    const manual = draft.manualDetails || draft.mapUnavailable || !draft.point || !complete;
    const region = [draft.village, draft.district, draft.city, draft.province, draft.postcode].filter(Boolean).join(", ");
    showDialog(modalId ? "Ubah Alamat" : "Tambah Alamat · Rincian", form(`
      <div class="account-location-summary">
        ${icon("pin")}
        <div>
          <small>Lokasi Pengiriman</small>
          <p>${escapeHtml(draft.street || "Pilih lokasi pengiriman")}</p>
          ${region ? `<small>${escapeHtml(region)}</small>` : ""}
        </div>
        ${button("location", "Ubah", { primary: true, aria: "Ubah titik lokasi" })}
      </div>
      ${draft.mapUnavailable ? notice("Peta belum tersedia", "Lengkapi rincian wilayah secara manual. Data yang sudah diisi tetap dipertahankan.") : ""}
      <p class="account-error" id="account-point-error"></p>
      ${field("recipient", "Nama Penerima", draft.recipient || "", { autocomplete: "name" })}
      ${field("recipientPhone", "Nomor HP", draft.recipientPhone || "", { type: "tel", max: 20, autocomplete: "tel" })}
      ${field("street", "Alamat Lengkap", draft.street || "", { type: "textarea", max: 255, autocomplete: "street-address", help: region ? "Wilayah: " + region + ". Pastikan semua informasi sudah benar." : "Isi nama jalan, nomor rumah dan rincian bangunan." })}
      <details class="account-address-details" ${manual ? "open" : ""}>
        <summary>${manual ? "Lengkapi Detail Alamat" : "Lihat Detail Alamat"}</summary>
        ${manual ? '<p class="account-muted">Rincian peta belum lengkap. Isi bagian yang belum tersedia agar alamat dapat disimpan.</p>' : ""}
        <div class="account-fields-grid">
          ${field("village", "Kelurahan/Desa", draft.village || "")}
          ${field("district", "Kecamatan", draft.district || "")}
          ${field("city", "Kota/Kabupaten", draft.city || "", { autocomplete: "address-level2" })}
          ${field("province", "Provinsi", draft.province || "", { autocomplete: "address-level1" })}
        </div>
        ${field("postcode", "Kode Pos", draft.postcode || "", { max: 5, inputmode: "numeric", autocomplete: "postal-code" })}
      </details>
      ${field("label", "Label Alamat", draft.label || "", { max: 50, help: "Contoh: Rumah, Kantor, dan lainnya." })}
      ${field("note", "Catatan Alamat (opsional)", draft.note || "", { max: snapshot.limits.addressNote, help: "Contoh: warna rumah, nomor unit apartemen. Maksimal " + snapshot.limits.addressNote + " karakter." })}
      <label class="account-check" for="account-primary">
        <input id="account-primary" name="primary" type="checkbox" ${draft.primary ? "checked" : ""}>
        Jadikan Alamat Utama
      </label>`, "Simpan Alamat"));
    content.querySelector("#account-form").classList.add("account-address-form");
  }

  function payload()
  {
    const values = formValues();
    if (modalAction === "address")
    {
      return { ...values, id: modalId, primary: values.primary === "on", point: addressDraft.point || null, requiresPoint: snapshot.requiresPoint };
    }
    return { ...values, id: modalId, requiresPassword: snapshot.hasPassword };
  }

  function showErrors(errors, message)
  {
    content.querySelectorAll(".account-error").forEach((element) =>
    {
      element.textContent = "";
    });
    content.querySelectorAll("[aria-invalid]").forEach((element) => element.removeAttribute("aria-invalid"));
    for (const [name, text] of Object.entries(errors || {}))
    {
      const input = document.getElementById("account-" + name);
      const error = document.getElementById("account-" + name + "-error");
      input?.setAttribute("aria-invalid", "true");
      if (error)
      {
        error.textContent = text;
      }
      if (input?.closest("details"))
      {
        input.closest("details").open = true;
      }
    }
    const summary = document.getElementById("account-form-error");
    if (summary)
    {
      summary.textContent = message || "";
      summary.focus();
    }
  }

  async function submit(action = modalAction)
  {
    if (busy || reading || !snapshot || uncertain || stale || now() < retryAt)
    {
      return;
    }
    const values = action === "resend" ? {} : payload();
    const errors = validation.validate(action, values, snapshot.limits);
    if (Object.keys(errors).length)
    {
      showErrors(errors, messages.validation);
      return;
    }
    busy = true;
    content.querySelectorAll("button, input, textarea").forEach((element) =>
    {
      element.disabled = true;
    });
    const submitButton = document.getElementById("account-submit");
    const submitText = submitButton?.textContent;
    if (submitButton)
    {
      submitButton.textContent = "Menyimpan…";
    }
    try
    {
      const result = await adapter.perform(action, values, snapshot.version);
      if (action === "logout")
      {
        snapshot = null;
        clearPrivateContext();
        closeDialog(true);
        emptyPage("Anda Sudah Keluar", "Sesi contoh pada perangkat ini telah diakhiri.", "session");
        feedback.textContent = "";
        return;
      }
      snapshot = result;
      serverTime = result.serverNow || Date.now();
      receivedAt = performance.now();
      stale = false;
      busy = false;
      if (action === "email")
      {
        closeDialog(true);
        render();
        openAction("verifyEmail");
      }
      else if (action === "resend")
      {
        showErrors({}, "Kode baru pada data contoh siap diperiksa. Kode sebelumnya tidak berlaku.");
        updateClocks();
      }
      else
      {
        closeDialog(true);
        render();
        const labels = { profile: "Profil berhasil diperbarui.", address: "Alamat berhasil disimpan.", primary: "Alamat utama berhasil diperbarui.", removeAddress: "Alamat berhasil dihapus. Alamat pesanan lama tetap tersimpan.", verifyEmail: "Email baru berhasil diverifikasi.", password: "Kata sandi pada data contoh diperbarui. Tidak ada kredensial sungguhan yang diubah.", deletion: "Permintaan penghapusan akun telah tercatat. Akun belum dianonimkan." };
        feedback.textContent = action === "revokeSession" ? "Sesi perangkat pada data contoh telah diakhiri. Perangkat ini tetap masuk." : labels[action] || "Perubahan tersimpan.";
      }
      if (result.notificationPending)
      {
        feedback.textContent += " Perubahan tersimpan; pemberitahuan masih menunggu pengiriman.";
      }
    }
    catch (error)
    {
      if (["session", "login", "inactive", "anonymized"].includes(error.code))
      {
        snapshot = null;
        clearPrivateContext();
        closeDialog(true);
        root.setAttribute("aria-busy", "false");
        emptyPage("Akses Akun", messages[error.code], error.code);
        feedback.textContent = "";
        return;
      }
      retryAt = error.retryAt || 0;
      uncertain = ["timeout", "conflict", "csrf", "duplicate", "notFound", "sendError", "limit"].includes(error.code);
      reconciliationCode = error.code;
      if (["offline", "denied"].includes(error.code))
      {
        stale = true;
      }
      showErrors(error.fields || {}, messages[error.code] || messages.saveError);
      if (uncertain)
      {
        document.getElementById("account-form-error")?.insertAdjacentHTML("beforeend", `<div>${button("reconcile", "Periksa Hasil Terbaru")}</div>`);
      }
      if (["codeInvalid", "codeExpired"].includes(error.code))
      {
        const code = document.getElementById("account-code");
        if (code)
        {
          code.value = "";
        }
        if (error.code === "codeExpired" && snapshot.pendingEmail)
        {
          snapshot.pendingEmail.expiresAt = now();
        }
      }
    }
    finally
    {
      busy = false;
      content.querySelectorAll("button, input, textarea").forEach((element) =>
      {
        element.disabled = false;
      });
      if (submitButton?.isConnected)
      {
        submitButton.textContent = submitText;
        submitButton.disabled = uncertain || now() < retryAt || stale;
      }
      updateClocks();
    }
  }

  function updateClocks()
  {
    const resend = content.querySelector('[data-account-action="resend"]');
    const status = document.getElementById("account-code-status");
    const pending = snapshot?.pendingEmail;
    const activeSubmit = document.getElementById("account-submit");
    if (activeSubmit)
    {
      activeSubmit.disabled = busy || reading || uncertain || stale || now() < retryAt;
    }
    if (resend && pending)
    {
      const seconds = Math.max(0, Math.ceil((Math.max(pending.resendAt, retryAt) - now()) / 1000));
      resend.disabled = busy || seconds > 0;
      resend.textContent = seconds ? "Kirim Ulang dalam " + seconds + " dtk" : "Kirim Ulang Kode";
      status.textContent = pending.failures >= 5 || now() >= pending.expiresAt
        ? "Kode tidak berlaku. Minta kode baru untuk melanjutkan."
        : "Kode berlaku hingga batas waktu verifikasi berakhir.";
      const submitButton = document.getElementById("account-submit");
      if (submitButton)
      {
        submitButton.disabled ||= !pending.sent || pending.failures >= 5 || now() >= pending.expiresAt;
      }
    }
    if (retryAt && now() >= retryAt)
    {
      retryAt = 0;
      if (!dialog.open && !snapshot && failureCode === "rateLimit")
      {
        emptyPage("Informasi Akun", messages.rateLimit, failureCode);
      }
      if (!uncertain && !stale && !busy)
      {
        const submitButton = document.getElementById("account-submit");
        if (submitButton && !pending)
        {
          submitButton.disabled = false;
        }
      }
    }
  }

  function navigate(url)
  {
    const proceed = () =>
    {
      location.assign(url);
    };
    if (isDirty())
    {
      askDiscard(proceed);
    }
    else
    {
      proceed();
    }
  }

  function setPanel(next, push = true)
  {
    const proceed = () =>
    {
      closeDialog(true);
      panel = next;
      if (push)
      {
        history.pushState(null, "", panelUrl(next));
      }
      currentUrl = location.href;
      render();
      document.getElementById("account-panel-title")?.focus({ preventScroll: true });
      root.querySelector('[aria-current="page"][data-account-panel]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
    };
    if (isDirty())
    {
      askDiscard(proceed);
    }
    else
    {
      proceed();
    }
  }

  document.addEventListener("click", (event) =>
  {
    const panelLink = event.target.closest("[data-account-panel]");
    if (panelLink)
    {
      event.preventDefault();
      if (!busy && snapshot)
      {
        setPanel(panelLink.dataset.accountPanel);
      }
      return;
    }
    const actionButton = event.target.closest("[data-account-action]");
    if (!actionButton || actionButton.disabled)
    {
      return;
    }
    const action = actionButton.dataset.accountAction;
    const id = actionButton.dataset.id;
    if (action === "close")
    {
      closeDialog();
    }
    else if (action === "refresh")
    {
      load();
    }
    else if (action === "reconcile")
    {
      load({ reconcile: true });
    }
    else if (action === "security")
    {
      setPanel("security");
    }
    else if (action === "resetSearch")
    {
      addressQuery = "";
      render();
      document.getElementById("account-address-search")?.focus();
    }
    else if (action === "keepEditing")
    {
      const previous = discardState;
      content.replaceChildren(previous.fragment);
      dialogTitle.textContent = previous.title;
      discardState = null;
      content.querySelector("input")?.focus();
    }
    else if (action === "discard")
    {
      const callback = discardState.callback;
      discardState = null;
      modalAction = null;
      addressDraft = null;
      callback();
    }
    else if (action === "togglePassword")
    {
      const input = document.getElementById("account-" + id);
      input.type = input.type === "password" ? "text" : "password";
      actionButton.textContent = input.type === "password" ? "Tampilkan" : "Sembunyikan";
      actionButton.setAttribute("aria-label", actionButton.textContent + " kata sandi");
    }
    else if (action === "location")
    {
      Object.assign(addressDraft, formValues(), { primary: formValues().primary === "on", dirty: isDirty() });
      showLocation();
    }
    else if (action === "manualAddress")
    {
      addressDraft.manualDetails = true;
      showAddressForm();
    }
    else if (action === "searchMap")
    {
      searchMap();
    }
    else if (action === "selectMapCenter")
    {
      if (locationMap)
      {
        selectMapPoint(locationMap.center());
      }
    }
    else if (action === "chooseMapResult")
    {
      if (locationResults[Number(id)])
      {
        applyLocation(locationResults[Number(id)]);
      }
    }
    else if (action === "chooseLocation")
    {
      const source = snapshot.addresses.find((address) => address.id === id);
      for (const key of ["point", "street", "village", "district", "city", "province", "postcode"])
      {
        addressDraft[key] = structuredClone(source[key]);
      }
      addressDraft.dirty = true;
      showAddressForm();
    }
    else if (action === "resend")
    {
      submit("resend");
    }
    else
    {
      openAction(action, id, actionButton);
    }
  });

  document.addEventListener("click", (event) =>
  {
    if (!dialog.open || !isDirty() || event.target.closest("dialog"))
    {
      return;
    }
    const anchor = event.target.closest("a[href]");
    const shellButton = event.target.closest("[data-storefront-page]");
    if (anchor || shellButton)
    {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (anchor)
      {
        askDiscard(() => navigate(anchor.href));
      }
      else
      {
        askDiscard(() =>
        {
          closeDialog(true);
          shellButton.click();
        });
      }
    }
  }, true);

  document.addEventListener("input", (event) =>
  {
    if (event.target.id === "account-address-search")
    {
      addressQuery = event.target.value;
      document.getElementById("account-address-list").innerHTML = addressCards();
    }
    if (event.target.id === "account-location-search")
    {
      locationQuery = event.target.value;
      renderLocations();
    }
    if (event.target.closest("#account-form") && event.target.name)
    {
      const errors = validation.validate(modalAction, payload(), snapshot.limits);
      if (!errors[event.target.name])
      {
        const fieldError = document.getElementById("account-" + event.target.name + "-error");
        if (fieldError)
        {
          fieldError.textContent = "";
        }
        event.target.removeAttribute("aria-invalid");
      }
      const summary = document.getElementById("account-form-error");
      if (summary && !uncertain)
      {
        summary.textContent = "";
      }
    }
  });
  content.addEventListener("submit", (event) =>
  {
    event.preventDefault();
    submit();
  });
  dialog.addEventListener("cancel", (event) =>
  {
    event.preventDefault();
    if (discardState)
    {
      content.querySelector('[data-account-action="keepEditing"]').click();
    }
    else
    {
      closeDialog();
    }
  });
  dialog.addEventListener("keydown", (event) =>
  {
    if (event.key !== "Tab")
    {
      return;
    }
    const focusable = Array.from(dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')).filter((element) => element.getClientRects().length);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogTitle))
    {
      event.preventDefault();
      last?.focus();
    }
    else if (!event.shiftKey && document.activeElement === last)
    {
      event.preventDefault();
      first?.focus();
    }
  });
  window.addEventListener("beforeunload", (event) =>
  {
    if (isDirty())
    {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  window.addEventListener("popstate", () =>
  {
    const targetUrl = location.href;
    const target = new URL(targetUrl).searchParams.get("section");
    if (isDirty())
    {
      history.replaceState(null, "", currentUrl);
      askDiscard(() =>
      {
        history.replaceState(null, "", targetUrl);
        setPanel(Object.hasOwn(panels, target) ? target : "profile", false);
      });
    }
    else
    {
      setPanel(Object.hasOwn(panels, target) ? target : "profile", false);
    }
  });
  window.addEventListener("offline", () =>
  {
    stale = true;
    feedback.textContent = messages.offline;
    if (snapshot)
    {
      render();
    }
  });
  window.addEventListener("online", () => load());
  window.addEventListener("storage", () =>
  {
    if (!dialog.open)
    {
      load();
    }
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
    if (!document.hidden && snapshot && !dialog.open && !busy)
    {
      load();
    }
  });
  setInterval(updateClocks, 1000);
  window.RylvaAccountPreviewControl = { reset: () => adapter.reset() };
  load();
})();
