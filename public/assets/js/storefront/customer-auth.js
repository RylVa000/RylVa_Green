"use strict";

(() =>
{
  const root = document.getElementById("customer-auth-root");
  const notice = document.getElementById("auth-announcement");
  const dialog = document.getElementById("auth-dialog");
  const repository = window.RylvaCustomerAuthAdapter || window.RylvaCustomerAuthPreview;
  const query = new URLSearchParams(location.search);
  let view = document.body.dataset.authView;
  const routes = { login: "customer-login.html", register: "customer-register.html", verify: "verify-email.html",
    forgot: "forgot-password.html", reset: "reset-password.html" };
  const titles = { login: "Masuk", register: "Buat Akun", verify: "Verifikasi Email", forgot: "Lupa Kata Sandi", reset: "Buat Kata Sandi Baru" };
  let configuration = null;
  let busy = false;
  let completed = false;
  let bypassLeave = false;
  let retryAt = 0;
  let resendRetryAt = 0;
  let timer = null;
  let dialogTrigger = null;
  let pendingDestination = null;
  let retainedEmail = "";
  let reloadRequired = false;
  let navigating = false;

  function needsChallenge()
  {
    const challenge = configuration?.challenge;
    return view === "verify" && (!challenge || challenge.purpose !== "verify" || challenge.used);
  }

  function escapeHtml(value)
  {
    return String(value ?? "").replace(/[&<>"']/g, (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function safeDestination(candidate)
  {
    const fallback = "/pages/customer/account.html";
    try
    {
      const target = new URL(candidate || fallback, location.origin);
      const paths = ["cart", "checkout", "account", "my-orders", "order-detail", "payment", "bouquet-customizer", "buket-kustom", "wishlist"];
      const allowed = paths.some((name) => target.pathname === "/pages/customer/" + name + ".html" || target.pathname === "/" + name + ".html");
      return target.origin === location.origin && !target.username && !target.password && allowed
        ? target.pathname + target.search : fallback;
    }
    catch
    {
      return fallback;
    }
  }

  const returnTo = safeDestination(query.get("returnTo"));

  function route(nextView)
  {
    const target = new URL(routes[nextView], location.href);
    target.searchParams.set("returnTo", returnTo);
    if (query.get("preview") === "auth")
    {
      target.searchParams.set("preview", "auth");
      target.searchParams.set("state", repository.state || "normal");
    }
    return target.pathname + target.search;
  }

  function actionButton(action, label, secondary = false, extra = "")
  {
    return `<button class="auth-action ${secondary ? "auth-action-secondary" : ""}" type="button"
      data-auth-action="${action}" ${extra}>${label}</button>`;
  }

  function field(name, label, options = {})
  {
    const password = options.type === "password";
    return `
      <div class="auth-field ${options.full ? "auth-field-full" : ""}">
        <label for="auth-${name}">${label}</label>
        <div class="auth-input-wrap">
          <input id="auth-${name}" name="${name}" type="${options.type || "text"}"
            autocomplete="${options.autocomplete || "off"}" ${options.inputmode ? `inputmode="${options.inputmode}"` : ""}
            ${options.maximum ? `maxlength="${options.maximum}"` : ""}
            aria-describedby="auth-${name}-error${options.help ? " auth-" + name + "-help" : ""}"
            aria-invalid="false" ${options.optional ? "" : "required"}>
          ${password ? `<button class="auth-password-toggle" type="button" data-auth-action="password"
            data-input="auth-${name}" aria-label="Tampilkan ${label.toLowerCase()}" aria-pressed="false">
            <img src="../../assets/images/auth/eye.svg" alt="" width="47" height="33">
          </button>` : ""}
        </div>
        ${options.help ? `<p class="auth-helper" id="auth-${name}-help">${options.help}</p>` : ""}
        <p class="auth-field-error" id="auth-${name}-error" hidden></p>
      </div>`;
  }

  function googleButton()
  {
    return `
      <button class="auth-google" type="button" data-auth-action="google">
        <img src="../../assets/images/auth/google.png" alt="" width="60" height="51">
        <span>Masuk dengan Google</span>
      </button>
      <div class="auth-divider">
        <span>atau</span>
      </div>`;
  }

  function codeField()
  {
    return `
      <div class="auth-field">
        <label for="auth-code">Kode verifikasi 6 digit</label>
        <div class="auth-code" id="auth-code-group">
          <input id="auth-code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code"
            maxlength="6" pattern="[0-9]{6}" aria-describedby="auth-code-help auth-code-error" required>
          <div class="auth-code-slots" aria-hidden="true">${Array.from({ length: 6 }, () => "<span></span>").join("\n")}</div>
        </div>
        <p class="auth-helper" id="auth-code-help">Anda dapat mengetik atau menempelkan seluruh kode sekaligus.</p>
        <p class="auth-field-error" id="auth-code-error" hidden></p>
      </div>`;
  }

  function art()
  {
    const artwork = window.RylvaCustomerAuthMotion.artwork(view);
    if (view === "login" || view === "register")
    {
      return `
        ${artwork}
        <a class="auth-brand" href="${escapeHtml(returnTo)}" aria-label="RylVa Green — kembali ke halaman sebelumnya">
          <img src="../../assets/images/storefront/logo-navbar.svg" alt="RylVa Green" width="162" height="36.7138">
        </a>`;
    }
    return artwork;
  }

  function render()
  {
    let fields = "";
    let introduction = "";
    let before = "";
    let after = "";
    if (view === "login")
    {
      introduction = `
        <h1 id="auth-title" tabindex="-1">Halo!</h1>
        <p class="auth-welcome">Selamat datang kembali :)</p>`;
      before = googleButton();
      fields = field("email", "Alamat Email", { type: "email", autocomplete: "username", maximum: 254 })
        + field("password", "Kata Sandi", { type: "password", autocomplete: "current-password", maximum: 128 });
      after = `<a class="auth-forgot-link" href="${route("forgot")}">Lupa kata sandi?</a>`;
    }
    else if (view === "register")
    {
      introduction = `
        <h1 id="auth-title" tabindex="-1">Halo!</h1>
        <p class="auth-welcome">Senang bertemu dengan Anda :)</p>`;
      before = googleButton();
      fields = field("name", "Nama Lengkap", { autocomplete: "name", maximum: 100 })
        + field("phone", "Nomor HP", { type: "tel", autocomplete: "tel", inputmode: "tel", maximum: 24 })
        + field("email", "Alamat Email", { type: "email", autocomplete: "email", maximum: 254, full: true })
        + field("password", "Kata Sandi", { type: "password", autocomplete: "new-password", maximum: 128 })
        + field("confirmPassword", "Konfirmasi Kata Sandi", { type: "password", autocomplete: "new-password", maximum: 128 });
      after = `
        <p class="auth-helper">Gunakan minimal 8 karakter dan hindari kata sandi yang umum.</p>
        <div class="auth-consent">
          <input id="auth-consent" name="consent" type="checkbox" aria-describedby="auth-consent-error" required>
          <div>
            <label for="auth-consent">Saya menyetujui</label>
            <button type="button" class="auth-policy-link" data-auth-action="policy" data-policy="Syarat dan Ketentuan">Syarat dan Ketentuan</button>
            <span>dan</span>
            <button type="button" class="auth-policy-link" data-auth-action="policy" data-policy="Kebijakan Privasi">Kebijakan Privasi</button>
          </div>
        </div>
        <p class="auth-field-error" id="auth-consent-error" hidden></p>`;
    }
    else if (view === "verify")
    {
      introduction = needsChallenge()
        ? `<h1 id="auth-title" tabindex="-1">Verifikasi Email</h1>
          <p class="auth-introduction">Masukkan email Anda untuk meminta kode verifikasi.</p>`
        : `<h1 id="auth-title" tabindex="-1">Periksa Email Anda</h1>
        <p class="auth-introduction">Masukkan kode 6 digit untuk memverifikasi email
          <strong>${escapeHtml(configuration.challenge?.email || "Anda")}</strong>.</p>`;
      fields = needsChallenge() ? field("email", "Alamat Email", { type: "email", autocomplete: "email", maximum: 254 }) : codeField();
      after = needsChallenge() ? "" : '<p class="auth-helper" id="auth-code-expiry"></p>';
    }
    else if (view === "forgot")
    {
      introduction = `
        <h1 id="auth-title" tabindex="-1">Lupa Kata Sandi?</h1>
        <p class="auth-introduction">Masukkan email akun Anda untuk meminta tautan pemulihan.</p>`;
      fields = field("email", "Alamat Email", { type: "email", autocomplete: "email", maximum: 254 });
    }
    else
    {
      introduction = `
        <h1 id="auth-title" tabindex="-1">Buat Kata Sandi Baru</h1>
        <p class="auth-introduction">Gunakan kata sandi yang berbeda dan tidak mudah ditebak.</p>`;
      fields = field("password", "Kata Sandi Baru", { type: "password", autocomplete: "new-password", maximum: 128, help: "Minimal 8 karakter." })
        + field("confirmPassword", "Konfirmasi Kata Sandi", { type: "password", autocomplete: "new-password", maximum: 128 });
    }
    root.className = "auth-scene auth-" + view;
    root.innerHTML = `
      ${art()}
      <section class="auth-form-area" aria-labelledby="auth-title">
        ${!["login", "register"].includes(view) ? `<a class="auth-back" href="${route("login")}">Kembali ke Masuk</a>` : ""}
        ${introduction}
        ${before}
        <div class="auth-notice" id="auth-notice" role="status" hidden></div>
        <form id="auth-form" novalidate autocomplete="on">
          <div class="auth-fields ${view === "register" ? "auth-fields-grid" : ""}">
            ${fields}
          </div>
          ${after}
          <button class="auth-action auth-submit" type="submit" id="auth-submit">${
            needsChallenge() ? "Kirim Kode Verifikasi"
              : view === "verify" ? "Verifikasi Email"
                : view === "forgot" ? "Kirim Tautan Pemulihan"
                  : view === "reset" ? "Simpan Kata Sandi" : titles[view]
          }</button>
        </form>
        ${view === "login" ? `<p class="auth-switch">Belum punya akun? <a href="${route("register")}">Daftar</a></p>
          <a class="auth-verification-link" href="${route("verify")}">Verifikasi email</a>` : view === "register" ? `<p class="auth-switch">Sudah punya akun? <a href="${route("login")}">Masuk</a></p>` : ""}
        ${view === "verify" && !needsChallenge() ? `
          ${actionButton("resend", "Kirim Ulang Kode", true, 'id="auth-resend"')}
          <p class="auth-helper" id="auth-resend-time" aria-live="off"></p>
          ${actionButton("restart", "Gunakan Email Lain", true)}` : ""}
      </section>`;
    root.setAttribute("aria-busy", "false");
    window.RylvaCustomerAuthMotion.mount(root);
    if (view === "verify")
    {
      updateCode();
      tick();
    }
    if (repository.state === "brokenImage")
    {
      root.querySelectorAll(".auth-photo image").forEach((image) =>
      {
        image.setAttribute("href", "../../assets/images/auth/missing-fixture.png");
      });
    }
    if (repository.state === "longContent")
    {
      document.getElementById("auth-name").value = "Pelanggan dengan nama lengkap panjang untuk pemeriksaan keterbacaan formulir";
      document.getElementById("auth-email").value = "pelanggan.dengan.alamat.email.panjang@contoh-pengujian.example.test";
    }
  }

  function showNotice(message, danger = false)
  {
    const element = document.getElementById("auth-notice");
    if (element)
    {
      element.hidden = !message;
      element.dataset.danger = String(danger);
      element.textContent = message;
    }
    notice.textContent = message;
  }

  function showErrors(errors)
  {
    root.querySelectorAll(".auth-field-error").forEach((element) =>
    {
      element.hidden = true;
      element.textContent = "";
    });
    root.querySelectorAll("[aria-invalid]").forEach((element) => element.setAttribute("aria-invalid", "false"));
    Object.entries(errors).forEach(([name, message]) =>
    {
      const element = document.getElementById("auth-" + name + "-error");
      if (element)
      {
        element.hidden = false;
        element.textContent = message;
        document.getElementById("auth-" + name)?.setAttribute("aria-invalid", "true");
      }
    });
    const first = Object.keys(errors)[0];
    if (first)
    {
      document.getElementById("auth-" + first)?.focus();
      notice.textContent = "Periksa isian formulir. " + errors[first];
    }
    return Boolean(first);
  }

  function validate(values)
  {
    const errors = {};
    if ((["login", "register", "forgot"].includes(view) || needsChallenge())
      && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email || "") || values.email.length > 254))
    {
      errors.email = "Masukkan alamat email yang valid.";
    }
    if (["login", "register", "reset"].includes(view) && !values.password)
    {
      errors.password = "Masukkan kata sandi Anda.";
    }
    if (view === "register")
    {
      Object.assign(errors, window.RylvaAccountValidation.validate("profile", values));
      if (!values.phone?.trim())
      {
        errors.phone = "Masukkan nomor HP Anda.";
      }
      if (!values.consent)
      {
        errors.consent = "Persetujuan diperlukan untuk melanjutkan registrasi.";
      }
    }
    if (["register", "reset"].includes(view))
    {
      const length = Array.from(values.password || "").length;
      if (length < 8 || length > 128)
      {
        errors.password = "Gunakan kata sandi 8–128 karakter.";
      }
      if (!values.confirmPassword || values.password !== values.confirmPassword)
      {
        errors.confirmPassword = "Konfirmasi harus sama dengan kata sandi Anda.";
      }
    }
    if (view === "verify" && !needsChallenge() && !/^[0-9]{6}$/.test(values.code || ""))
    {
      errors.code = "Masukkan 6 digit kode verifikasi.";
    }
    return errors;
  }

  function setBusy(value)
  {
    busy = value;
    root.setAttribute("aria-busy", String(value));
    root.querySelectorAll("button, input").forEach((element) => element.disabled = value);
    const submit = document.getElementById("auth-submit");
    if (submit)
    {
      submit.textContent = value ? "Memproses..." : needsChallenge() ? "Kirim Kode Verifikasi" : view === "verify" ? "Verifikasi Email"
        : view === "forgot" ? "Kirim Tautan Pemulihan" : view === "reset" ? "Simpan Kata Sandi" : titles[view];
      submit.disabled = value || reloadRequired || Date.now() < retryAt;
    }
    tick();
    window.RylvaCustomerAuthMotion.sync();
  }

  function result(outcome, isPreview = true)
  {
    const supported = isPreview
      ? ["previewLogin", "previewVerified", "previewReset", "recoveryRequested"]
      : ["authenticated", "emailVerified", "passwordReset", "recoveryRequested"];
    if (!supported.includes(outcome))
    {
      throw new Error("Hasil belum dapat dikonfirmasi. Coba kembali tanpa menutup formulir.");
    }
    completed = true;
    const formArea = root.querySelector(".auth-form-area");
    const content = outcome === "previewReset"
      ? ["Pratinjau Kata Sandi Selesai", "Tidak ada kata sandi akun nyata yang diubah.", "Masuk"]
      : outcome === "recoveryRequested"
        ? ["Periksa Email Anda", "Jika email terdaftar dan akunnya aktif, tautan pemulihan akan dikirim. Pada pratinjau ini tidak ada email nyata yang dikirim.", "Kembali ke Masuk"]
        : [outcome === "previewVerified" ? "Pratinjau Verifikasi Selesai" : "Pratinjau Masuk Selesai",
          "Halaman selanjutnya memakai data akun contoh. Tidak ada sesi autentikasi produksi yang dibuat.", "Lanjutkan Pratinjau"];
    if (!isPreview && ["authenticated", "emailVerified"].includes(outcome))
    {
      bypassLeave = true;
      location.assign(returnTo);
      return;
    }
    if (!isPreview)
    {
      content[0] = outcome === "passwordReset" ? "Kata Sandi Berhasil Diubah" : "Periksa Email Anda";
      content[1] = outcome === "passwordReset" ? "Masuk kembali menggunakan kata sandi baru Anda."
        : "Jika email terdaftar dan akunnya aktif, tautan pemulihan akan dikirim.";
      content[2] = "Kembali ke Masuk";
    }
    formArea.innerHTML = `
      <div class="auth-result">
        <span class="auth-result-check" aria-hidden="true">
          <svg width="28" height="28">
            <use href="#auth-check"></use>
          </svg>
        </span>
        <h1 id="auth-title" tabindex="-1">${content[0]}</h1>
        <p>${content[1]}</p>
        ${actionButton(["previewReset", "passwordReset", "recoveryRequested"].includes(outcome) ? "login" : "continue", content[2])}
        ${outcome === "recoveryRequested" ? actionButton("edit-email", "Ubah Email", true) : ""}
      </div>`;
    document.getElementById("auth-title").focus();
  }

  async function submit(action, values = {})
  {
    if (busy || reloadRequired || Date.now() < retryAt || (action === "resend" && Date.now() < resendRetryAt))
    {
      return;
    }
    setBusy(true);
    showNotice("");
    try
    {
      const response = await repository.request(action, values);
      if (response.challenge)
      {
        configuration.challenge = response.challenge;
      }
      if (action === "register" || action === "requestVerification")
      {
        completed = false;
        view = "verify";
        document.body.dataset.authView = view;
        document.title = "Verifikasi Email | RylVa Green";
        // Keep a blocked-storage challenge in memory instead of losing it in a navigation.
        if (response.storageAvailable !== false)
        {
          history.replaceState(null, "", route("verify"));
        }
        render();
        showNotice(action === "register" ? "Jika email belum terdaftar, kode verifikasi telah dikirim."
          : "Jika email dapat diverifikasi, kode verifikasi telah dikirim.");
        document.getElementById("auth-title").focus();
      }
      else if (action === "resend")
      {
        document.getElementById("auth-code").value = "";
        updateCode();
        showNotice("Permintaan kode baru diterima. Kode sebelumnya tidak berlaku lagi pada pratinjau.");
      }
      else
      {
        result(response.outcome, response.isPreview);
      }
    }
    catch (error)
    {
      if (repository.isPreview)
      {
        configuration.challenge = repository.read();
      }
      const messages =
      {
        credentials: "Email atau kata sandi salah. Periksa kembali atau gunakan pemulihan akun.",
        serviceError: "Layanan belum dapat dihubungi. Coba lagi; isian formulir tetap tersedia.",
        timeout: "Konfirmasi belum diterima. Periksa email Anda sebelum mencoba lagi.",
        maintenance: "Layanan sedang dalam pemeliharaan. Silakan coba kembali nanti.",
        csrfExpired: "Sesi formulir sudah berakhir. Muat ulang halaman sebelum mencoba kembali.",
        rateLimited: "Terlalu banyak percobaan. Tunggu 15 menit sebelum mencoba kembali.",
        captcha: "Pemeriksaan keamanan diperlukan. Layanan verifikasi belum tersedia pada pratinjau ini.",
        googleCancelled: "Proses masuk dengan Google dibatalkan. Anda dapat menggunakan email dan kata sandi.",
        googleUnavailable: "Masuk dengan Google belum tersedia. Gunakan email dan kata sandi.",
        googleLinkRequired: "Akun lokal perlu diverifikasi sebelum ditautkan ke Google. Masuk dengan kata sandi atau gunakan verifikasi email. Tidak ada penautan otomatis."
      };
      if (error.retryAt)
      {
        if (action === "resend")
        {
          resendRetryAt = error.retryAt;
        }
        else
        {
          retryAt = error.retryAt;
        }
      }
      if (error.code === "csrfExpired")
      {
        reloadRequired = true;
      }
      if (error.field)
      {
        showErrors({ [error.field]: error.message });
      }
      showNotice(messages[error.code] || error.message || "Permintaan belum berhasil. Silakan coba lagi.", true);
      if (reloadRequired)
      {
        document.getElementById("auth-notice").insertAdjacentHTML("beforeend", actionButton("reload", "Muat Ulang Formulir", true));
      }
    }
    finally
    {
      setBusy(false);
    }
  }

  function updateCode()
  {
    const input = document.getElementById("auth-code");
    if (!input)
    {
      return;
    }
    const value = input.value.replace(/[^0-9]/g, "").slice(0, 6);
    input.value = value;
    document.querySelectorAll(".auth-code-slots span").forEach((element, index) =>
    {
      element.textContent = value[index] || "";
      element.classList.toggle("is-active", index === Math.min(input.selectionStart ?? value.length, 5));
    });
  }

  function tick()
  {
    const submit = document.getElementById("auth-submit");
    if (submit && view !== "verify")
    {
      submit.disabled = busy || reloadRequired || Date.now() < retryAt;
    }
    const current = configuration?.challenge;
    const resend = document.getElementById("auth-resend");
    if (!resend)
    {
      return;
    }
    const seconds = current ? Math.max(0, Math.ceil((Math.max(current.resendAt, resendRetryAt) - Date.now()) / 1000)) : 0;
    resend.disabled = busy || !current || current.purpose !== "verify" || current.used || seconds > 0;
    document.getElementById("auth-resend-time").textContent = seconds ? "Kirim ulang tersedia dalam " + seconds + " detik." : "";
    const expired = current && (Date.now() >= current.expiresAt || current.errors >= 5 || current.used);
    if (submit)
    {
      submit.disabled = busy || reloadRequired || !current || current.purpose !== "verify" || Boolean(expired) || Date.now() < retryAt;
    }
    document.getElementById("auth-code-expiry").textContent = !current ? ""
      : current.errors >= 5 ? "Kode tidak dapat digunakan lagi. Minta kode baru."
        : Date.now() >= current.expiresAt ? "Kode kedaluwarsa. Minta kode baru."
          : "Kode berlaku selama 10 menit sejak permintaan terakhir.";
  }

  function dirty()
  {
    return !completed && ["register", "reset"].includes(view)
      && [...root.querySelectorAll("#auth-form input:not([type=checkbox])")].some((input) => input.value);
  }

  function openDialog(title, message, confirm = null)
  {
    dialogTrigger = document.activeElement;
    document.getElementById("auth-dialog-title").textContent = title;
    document.getElementById("auth-dialog-content").innerHTML = `
      <p>${escapeHtml(message)}</p>
      <div class="auth-dialog-actions">
        ${actionButton("close", confirm ? "Tetap Mengisi" : "Kembali", true)}
        ${confirm ? actionButton("leave", "Tinggalkan Formulir") : ""}
      </div>`;
    dialog.showModal();
    document.getElementById("auth-dialog-title").focus();
  }

  async function depart(destination)
  {
    if (navigating)
    {
      return;
    }
    navigating = true;
    bypassLeave = true;
    await window.RylvaCustomerAuthTransition?.leave(destination);
    location.assign(destination);
  }

  function navigate(destination)
  {
    if (dirty())
    {
      pendingDestination = destination;
      openDialog("Tinggalkan Formulir?", "Perubahan yang belum disimpan akan hilang.", true);
      return;
    }
    depart(destination);
  }

  async function load()
  {
    if (busy)
    {
      return;
    }
    setBusy(true);
    try
    {
      configuration = await repository.load(view, { token: query.get("token") });
      render();
      clearInterval(timer);
      timer = setInterval(tick, 1000);
    }
    catch (error)
    {
      root.className = "auth-scene auth-recovery";
      root.innerHTML = `<section class="auth-form-area auth-error-page">
        <h1 id="auth-title" tabindex="-1">${error.code === "invalidReset" ? "Tautan Tidak Dapat Digunakan" : "Formulir Belum Tersedia"}</h1>
        <p>${escapeHtml(error.message)}</p>
        ${actionButton(error.code === "invalidReset" ? "forgot" : "retry", error.code === "invalidReset" ? "Minta Tautan Baru" : "Coba Lagi")}
        <a class="auth-back" href="${route("login")}">Kembali ke Masuk</a>
      </section>`;
      root.setAttribute("aria-busy", "false");
    }
    finally
    {
      setBusy(false);
      await window.RylvaCustomerAuthTransition?.arrive();
    }
  }

  async function refreshForm()
  {
    setBusy(true);
    try
    {
      repository.recover?.();
      configuration = await repository.load(view, { token: query.get("token") });
      reloadRequired = false;
      showNotice("Formulir siap digunakan kembali. Periksa isian Anda sebelum mengirim.");
    }
    catch (error)
    {
      showNotice(error.message || "Formulir belum dapat diperbarui. Coba lagi.", true);
    }
    finally
    {
      setBusy(false);
    }
  }

  root.addEventListener("submit", (event) =>
  {
    if (event.target.id !== "auth-form")
    {
      return;
    }
    event.preventDefault();
    if (busy)
    {
      return;
    }
    const values = Object.fromEntries(new FormData(event.target));
    values.email = values.email?.trim();
    values.name = values.name?.trim();
    values.consent = values.consent === "on";
    if (!showErrors(validate(values)))
    {
      retainedEmail = values.email || retainedEmail;
      submit(needsChallenge() ? "requestVerification" : view, values);
    }
  });
  root.addEventListener("input", (event) =>
  {
    if (event.target.name === "code")
    {
      updateCode();
    }
  });
  root.addEventListener("focusin", updateCode);
  root.addEventListener("keyup", updateCode);
  document.addEventListener("click", (event) =>
  {
    const target = event.target.closest("[data-auth-action]");
    if (!target || target.disabled)
    {
      return;
    }
    const action = target.dataset.authAction;
    if (action === "password")
    {
      const input = document.getElementById(target.dataset.input);
      const visible = input.type === "password";
      input.type = visible ? "text" : "password";
      target.setAttribute("aria-pressed", String(visible));
      target.setAttribute("aria-label", (visible ? "Sembunyikan " : "Tampilkan ") + input.labels[0].textContent.toLowerCase());
    }
    else if (action === "google" || action === "resend")
    {
      submit(action);
    }
    else if (action === "policy")
    {
      openDialog(target.dataset.policy, "Dokumen kebijakan belum dipublikasikan pada pratinjau ini. Persetujuan formulir tidak membuat akun atau perjanjian produksi.");
    }
    else if (action === "close")
    {
      dialog.close();
    }
    else if (action === "leave")
    {
      dialog.close();
      depart(pendingDestination);
    }
    else if (action === "continue")
    {
      try
      {
        sessionStorage.removeItem("rylva-account-preview-access-v1");
        sessionStorage.setItem("rylva-bouquet-preview-access-v1", "customer-example");
        if (repository === window.RylvaCustomerAuthPreview)
        {
          sessionStorage.setItem("rylva-wishlist-preview-owner-v1", "customer-example");
        }
      }
      catch
      {
        // The example destination remains available when storage is restricted.
      }
      navigate(returnTo);
    }
    else if (action === "retry")
    {
      repository.recover?.();
      load();
    }
    else if (action === "edit-email")
    {
      completed = false;
      render();
      document.getElementById("auth-email").value = retainedEmail;
      document.getElementById("auth-email").focus();
    }
    else if (action === "reload")
    {
      // Reload configuration without navigating, retaining entered values in this document.
      refreshForm();
    }
    else if (action === "restart")
    {
      configuration.challenge = null;
      render();
      document.getElementById("auth-email").focus();
    }
    else if (["login", "forgot"].includes(action))
    {
      navigate(route(action === "restart" ? "register" : action));
    }
  });
  root.addEventListener("click", (event) =>
  {
    const link = event.target.closest("a[href]");
    const ordinaryClick = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
    if (link && ordinaryClick && !link.target && !link.hasAttribute("download")
      && (dirty() || window.RylvaCustomerAuthTransition?.isSwitch(link.href)))
    {
      event.preventDefault();
      if (busy || navigating)
      {
        return;
      }
      navigate(link.href);
    }
  });
  root.addEventListener("error", (event) =>
  {
    if (["img", "image"].includes(event.target.tagName.toLowerCase()))
    {
      if (event.target.tagName.toLowerCase() === "image")
      {
        event.target.closest("svg").style.visibility = "hidden";
      }
      else
      {
        event.target.hidden = true;
      }
      root.classList.add("auth-asset-unavailable");
    }
  }, true);
  dialog.addEventListener("close", () => dialogTrigger?.focus({ preventScroll: true }));
  dialog.addEventListener("keydown", (event) =>
  {
    if (event.key !== "Tab")
    {
      return;
    }
    const controls = [...dialog.querySelectorAll("button:not(:disabled), a[href], input:not(:disabled)")];
    const first = controls[0];
    const last = controls.at(-1);
    if (!controls.includes(document.activeElement) || (!event.shiftKey && document.activeElement === last)
      || (event.shiftKey && document.activeElement === first))
    {
      event.preventDefault();
      (event.shiftKey ? last : first)?.focus();
    }
  });
  window.addEventListener("beforeunload", (event) =>
  {
    if (!bypassLeave && dirty())
    {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  window.addEventListener("offline", () => showNotice("Koneksi terputus. Isian Anda tetap tersedia; sambungkan kembali sebelum melanjutkan.", true));
  window.addEventListener("pagehide", () => clearInterval(timer));
  window.addEventListener("pageshow", (event) =>
  {
    if (event.persisted)
    {
      navigating = false;
      bypassLeave = false;
      clearInterval(timer);
      timer = setInterval(tick, 1000);
    }
  });
  load();
})();
