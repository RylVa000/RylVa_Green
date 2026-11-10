"use strict";

(() =>
{
  const root = document.getElementById("auth-view");
  const helpToggle = document.getElementById("auth-help-toggle");
  const helpPanel = document.getElementById("auth-help");
  const helpClose = document.getElementById("auth-help-close");
  const layout = document.querySelector(".auth-layout");
  const allowedViews =
  [
    "login", "mfa", "recovery", "recovery-sent", "help", "activation",
    "activation-mfa", "activation-done", "expired", "unavailable", "demo-done",
    "reset-password", "reset-done", "backup-code", "blocked", "session-expired", "network-error",
    "credentials-error", "mfa-error"
  ];
  const state =
  {
    view: new URLSearchParams(location.search).get("view") || "login",
    helpReturn: "login"
  };

  if (!root || !helpToggle || !helpPanel || !helpClose || !layout)
  {
    return;
  }

  let closingTimer = null;
  helpToggle.disabled = false;

  function closeHelp(immediate = false)
  {
    if (helpPanel.hidden)
    {
      return;
    }
    if (helpPanel.contains(document.activeElement))
    {
      helpToggle.focus({ preventScroll: true });
    }
    helpToggle.setAttribute("aria-expanded", "false");
    helpPanel.inert = true;
    helpPanel.classList.add("is-closing");
    window.clearTimeout(closingTimer);
    const finish = () =>
    {
      helpPanel.hidden = true;
      helpPanel.inert = false;
      helpPanel.classList.remove("is-closing");
      layout.classList.remove("is-help-open");
    };
    if (immediate || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    {
      finish();
    }
    else
    {
      closingTimer = window.setTimeout(finish, 180);
    }
  }

  helpToggle.addEventListener("click", () =>
  {
    if (helpToggle.getAttribute("aria-expanded") === "true")
    {
      closeHelp();
      return;
    }
    window.clearTimeout(closingTimer);
    helpPanel.inert = false;
    helpPanel.classList.remove("is-closing");
    helpPanel.hidden = false;
    layout.classList.add("is-help-open");
    helpToggle.setAttribute("aria-expanded", "true");
    if (window.matchMedia("(max-width: 767px)").matches)
    {
      helpClose.focus({ preventScroll: true });
    }
  });

  helpClose.addEventListener("click", () => closeHelp());

  document.addEventListener("keydown", (event) =>
  {
    if (event.key === "Escape" && helpToggle.getAttribute("aria-expanded") === "true")
    {
      closeHelp();
      helpToggle.focus({ preventScroll: true });
    }
  });

  function node(tagName, className, content)
  {
    const element = document.createElement(tagName);
    if (className)
    {
      element.className = className;
    }
    if (content !== undefined)
    {
      element.textContent = content;
    }
    return element;
  }

  function button(label, view, className = "queue-text-button auth-inline-link")
  {
    const element = node("button", className, label);
    element.type = "button";
    element.dataset.view = view;
    return element;
  }

  function icon(name)
  {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    svg.setAttribute("class", "icon");
    svg.setAttribute("aria-hidden", "true");
    use.setAttribute("href", `#auth-${name}`);
    svg.append(use);
    return svg;
  }

  function heading(title, description, backView)
  {
    if (backView)
    {
      const back = button("Kembali", backView, "queue-text-button auth-back");
      back.prepend(icon("arrow"));
      root.append(back);
    }
    const titleElement = node("h1", "", title);
    titleElement.id = "auth-title";
    titleElement.tabIndex = -1;
    root.append(titleElement, node("p", "", description));
  }

  function field(id, label, type, helper, autocomplete)
  {
    const wrapper = node("div", "auth-field");
    const labelElement = node("label", "", label);
    labelElement.htmlFor = id;
    const input = document.createElement("input");
    input.id = id;
    input.name = id;
    input.type = type;
    input.autocomplete = autocomplete;
    input.required = true;
    if (type === "password")
    {
      input.maxLength = 128;
    }
    input.setAttribute("aria-describedby", `${id}-help ${id}-error`);
    if (id === "code")
    {
      input.inputMode = "numeric";
      input.maxLength = 6;
    }
    const help = node("small", "", helper);
    help.id = `${id}-help`;
    const error = node("small", "auth-field-error");
    error.id = `${id}-error`;
    error.setAttribute("aria-live", "polite");
    wrapper.append(labelElement);
    if (type === "password")
    {
      const group = node("div", "auth-password");
      const toggle = button("Tampilkan", "toggle-password", "queue-button");
      toggle.dataset.target = id;
      toggle.setAttribute("aria-label", `Tampilkan ${label.toLowerCase()}`);
      group.append(input, toggle);
      wrapper.append(group);
    }
    else
    {
      wrapper.append(input);
    }
    wrapper.append(help, error);
    return wrapper;
  }

  function form(action, label)
  {
    const element = node("form", "auth-form");
    element.noValidate = true;
    element.dataset.form = action;
    element.autocomplete = "off";
    const submit = node("button", "queue-button queue-button--primary", label);
    submit.type = "submit";
    return { element, submit };
  }

  function steps(current)
  {
    const list = node("ol", "auth-steps");
    list.setAttribute("aria-label", "Tahap aktivasi");
    ["Kata sandi", "MFA", "Selesai"].forEach((label, index) =>
    {
      const item = node("li", "", label);
      if (index === current)
      {
        item.setAttribute("aria-current", "step");
      }
      list.append(item);
    });
    root.append(list);
  }

  function notice(message)
  {
    const element = node("div", "auth-notice");
    element.append(icon("info"), node("p", "", message));
    root.append(element);
  }

  function renderLogin()
  {
    heading("Masuk sebagai staf", "Gunakan akun Admin atau SuperAdmin yang telah diaktifkan.");
    const login = form("login", "Lanjutkan ke verifikasi");
    login.element.append(
      field("email", "Email staf", "email", "Masukkan email akun staf contoh.", "off"),
      field("password", "Kata sandi", "password", "Gunakan kata sandi contoh, bukan kata sandi asli.", "off"),
      button("Lupa kata sandi?", "recovery"),
      login.submit
    );
    root.append(login.element);
  }

  function renderMfa()
  {
    heading("Verifikasi keamanan", "Masukkan kode dari aplikasi autentikator yang terhubung ke akun Anda.", "login");
    const verification = form("mfa", "Verifikasi dan masuk");
    verification.element.append(
      field("code", "Kode autentikator", "text", "Masukkan 6 digit. Pada pratinjau, kode tidak diverifikasi.", "off"),
      verification.submit,
      button("Gunakan kode cadangan SuperAdmin", "backup-code"),
      button("Tidak dapat menggunakan autentikator?", "help")
    );
    root.append(verification.element);
  }

  function renderRecovery()
  {
    heading("Lupa kata sandi?", "Masukkan email staf untuk melihat alur permintaan pemulihan.", "login");
    const recovery = form("recovery", "Lanjutkan");
    recovery.element.append(field("email", "Email staf", "email", "Gunakan email contoh.", "off"), recovery.submit);
    root.append(recovery.element);
  }

  function renderHelp()
  {
    heading("Bantuan akses staf", "Pilih bantuan sesuai kendala yang Anda alami.", state.helpReturn);
    const section = node("div", "auth-help-content");
    section.append(
      node("h2", "", "Belum menerima undangan"),
      node("p", "", "Hubungi SuperAdmin untuk memeriksa atau mengirim ulang undangan."),
      node("h2", "", "Tidak dapat menggunakan autentikator"),
      node("p", "", "Admin dapat meminta bantuan SuperAdmin untuk verifikasi identitas dan reset MFA."),
      node("h2", "", "Pemulihan SuperAdmin"),
      node("p", "", "Gunakan kode cadangan. Jika tidak tersedia, hubungi SuperAdmin lain untuk prosedur pemulihan.")
    );
    root.append(section, button("Lupa kata sandi", "recovery"));
  }

  function renderActivation()
  {
    heading("Aktivasi akun staf", "Buat kata sandi, lalu daftarkan aplikasi autentikator.", "login");
    steps(0);
    notice("Contoh tampilan undangan. Tidak ada tautan atau akun yang diverifikasi dalam pratinjau ini.");
    const activation = form("activation", "Lanjutkan ke MFA");
    activation.element.append(
      field("new-password", "Kata sandi baru", "password", "Minimal 12 karakter. Gunakan data contoh.", "off"),
      field("confirm-password", "Konfirmasi kata sandi", "password", "Masukkan kembali kata sandi contoh.", "off"),
      activation.submit
    );
    root.append(activation.element);
  }

  function renderActivationMfa()
  {
    heading("Daftarkan autentikator", "Hubungkan aplikasi autentikator sebelum akun dapat digunakan.", "activation");
    steps(1);
    notice("QR dan kunci pendaftaran akan tersedia setelah layanan MFA terhubung. Jangan gunakan kode asli di sini.");
    const activation = form("activation-mfa", "Lihat akhir pratinjau");
    activation.element.append(
      field("code", "Kode autentikator", "text", "Masukkan 6 digit contoh untuk melihat langkah berikutnya.", "off"),
      activation.submit,
      button("Butuh bantuan?", "help")
    );
    root.append(activation.element);
  }

  function renderResetPassword()
  {
    heading("Buat kata sandi baru", "Gunakan tautan pemulihan yang masih berlaku.", "login");
    notice("Tampilan contoh. Tautan dan perubahan kata sandi belum terhubung ke layanan.");
    const reset = form("reset-password", "Simpan kata sandi");
    reset.element.append(
      field("new-password", "Kata sandi baru", "password", "Minimal 12 karakter. Gunakan data contoh.", "off"),
      field("confirm-password", "Konfirmasi kata sandi", "password", "Masukkan kembali kata sandi contoh.", "off"),
      reset.submit
    );
    root.append(reset.element);
  }

  function renderBackupCode()
  {
    heading("Gunakan kode cadangan", "Kode cadangan digunakan untuk pemulihan akses SuperAdmin.", "mfa");
    const backup = form("backup-code", "Lanjutkan");
    backup.element.append(
      field("backup-code", "Kode cadangan", "text", "Gunakan kode contoh, bukan kode cadangan asli.", "off"),
      backup.submit,
      button("Tidak memiliki kode cadangan?", "help")
    );
    root.append(backup.element);
  }

  function renderMessage(title, description, message, actionLabel, action)
  {
    heading(title, description, "login");
    notice(message);
    root.append(button(actionLabel, action, "queue-button queue-button--primary"));
  }

  function render()
  {
    if (!allowedViews.includes(state.view))
    {
      state.view = "login";
    }
    root.replaceChildren();
    const views =
    {
      login: renderLogin,
      mfa: renderMfa,
      recovery: renderRecovery,
      help: renderHelp,
      activation: renderActivation,
      "activation-mfa": renderActivationMfa,
      "reset-password": renderResetPassword,
      "backup-code": renderBackupCode,
      "credentials-error": () => renderMessage(
        "Belum bisa masuk", "Email atau kata sandi tidak sesuai.",
        "Periksa kembali data yang dimasukkan dan coba lagi. Ini adalah contoh pesan kesalahan.",
        "Coba kembali", "login"
      ),
      "mfa-error": () => renderMessage(
        "Kode belum sesuai", "Kode autentikator tidak dapat digunakan.",
        "Periksa waktu perangkat dan coba kode terbaru. Ini adalah contoh pesan kesalahan.",
        "Coba kembali", "mfa"
      ),
      blocked: () => renderMessage(
        "Percobaan sementara ditunda", "Terlalu banyak percobaan masuk dilakukan.",
        "Coba kembali setelah waktu tunggu dari layanan berakhir, atau hubungi SuperAdmin.",
        "Kembali ke login", "login"
      ),
      "session-expired": () => renderMessage(
        "Sesi verifikasi berakhir", "Mulai kembali proses masuk untuk melanjutkan.",
        "Langkah verifikasi sebelumnya tidak lagi dapat dilanjutkan.", "Kembali ke login", "login"
      ),
      "network-error": () => renderMessage(
        "Belum dapat terhubung", "Permintaan belum dapat diproses saat ini.",
        "Periksa koneksi dan coba kembali. Hubungi SuperAdmin jika kendala berlanjut.",
        "Kembali ke login", "login"
      ),
      expired: () => renderMessage(
        "Undangan kedaluwarsa", "Tautan aktivasi tidak lagi dapat digunakan.",
        "Hubungi SuperAdmin untuk meminta undangan baru.", "Kembali ke login", "login"
      ),
      unavailable: () => renderMessage(
        "Undangan tidak tersedia", "Tautan mungkin tidak valid atau sudah digunakan.",
        "Hubungi SuperAdmin jika Anda memerlukan bantuan aktivasi.", "Kembali ke login", "login"
      ),
      "recovery-sent": () => renderMessage(
        "Permintaan pemulihan", "Jika akun memenuhi syarat, petunjuk pemulihan akan dikirim melalui kanal yang tersedia.",
        "Ini hanya pratinjau. Tidak ada email yang dikirim.", "Kembali ke login", "login"
      ),
      "activation-done": () => renderMessage(
        "Akhir pratinjau aktivasi", "Alur contoh telah selesai ditampilkan.",
        "Akun belum diaktifkan dan MFA belum didaftarkan. Integrasi server diperlukan.", "Kembali ke login", "login"
      ),
      "demo-done": () => renderMessage(
        "Akhir pratinjau login", "Alur contoh telah selesai ditampilkan.",
        "Anda belum masuk. Pemeriksaan kredensial dan MFA memerlukan layanan server.", "Kembali ke login", "login"
      ),
      "reset-done": () => renderMessage(
        "Akhir pratinjau pemulihan", "Alur contoh telah selesai ditampilkan.",
        "Kata sandi belum diubah. Integrasi server diperlukan.", "Kembali ke login", "login"
      )
    };
    views[state.view]();
    document.title = `${root.querySelector("h1").textContent} | RylVa Green`;
  }

  function navigate(view)
  {
    closeHelp(true);
    if (view === "help" && state.view !== "help")
    {
      state.helpReturn = state.view;
    }
    state.view = view;
    const url = new URL(location.href);
    url.search = view === "login" ? "" : `?view=${encodeURIComponent(view)}`;
    history.pushState({ view }, "", url);
    render();
    root.querySelector("h1").focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function validate(input)
  {
    let error = "";
    if (!input.value)
    {
      error = "Kolom ini wajib diisi.";
    }
    else if (input.type === "email" && !input.validity.valid)
    {
      error = "Masukkan alamat email dengan format yang benar.";
    }
    else if (input.id === "code" && !/^\d{6}$/.test(input.value))
    {
      error = "Masukkan 6 digit angka.";
    }
    else if (input.id === "new-password" && input.value.length < 12)
    {
      error = "Gunakan sedikitnya 12 karakter.";
    }
    else if (input.id === "confirm-password" && input.value !== document.getElementById("new-password").value)
    {
      error = "Konfirmasi belum sesuai dengan kata sandi baru.";
    }
    input.setAttribute("aria-invalid", String(Boolean(error)));
    document.getElementById(`${input.id}-error`).textContent = error;
    return !error;
  }

  document.addEventListener("click", (event) =>
  {
    const control = event.target.closest("[data-view]");
    if (!control)
    {
      return;
    }
    if (control.dataset.view === "toggle-password")
    {
      const input = document.getElementById(control.dataset.target);
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      control.textContent = show ? "Sembunyikan" : "Tampilkan";
      const label = document.querySelector(`label[for="${input.id}"]`).textContent.toLowerCase();
      control.setAttribute("aria-label", `${show ? "Sembunyikan" : "Tampilkan"} ${label}`);
      return;
    }
    navigate(control.dataset.view);
  });

  root.addEventListener("focusout", (event) =>
  {
    if (event.target.matches("input"))
    {
      event.target.dataset.touched = "true";
      validate(event.target);
    }
  });

  root.addEventListener("input", (event) =>
  {
    if (event.target.matches('input[data-touched="true"]'))
    {
      validate(event.target);
    }
  });

  root.addEventListener("submit", (event) =>
  {
    event.preventDefault();
    const inputs = Array.from(event.target.querySelectorAll("input"));
    const invalid = inputs.filter((input) => !validate(input));
    if (invalid.length)
    {
      invalid[0].focus();
      return;
    }
    const next =
    {
      login: "mfa",
      mfa: "demo-done",
      recovery: "recovery-sent",
      activation: "activation-mfa",
      "activation-mfa": "activation-done",
      "reset-password": "reset-done",
      "backup-code": "demo-done"
    };
    navigate(next[event.target.dataset.form]);
  });

  window.addEventListener("popstate", () =>
  {
    state.view = new URLSearchParams(location.search).get("view") || "login";
    render();
  });

  render();
})();
