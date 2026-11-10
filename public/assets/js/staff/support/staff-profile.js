"use strict";

(() =>
{
  const hub = window.staffHub;
  const { node, button, link, badge, banner, panel, field, input, value } = hub;
  const allowedTabs = ["profile", "security", "sessions", "activity"];

  function addActivity(title, description)
  {
    hub.account().activity.unshift({ title, description, at: new Date().toISOString() });
  }

  function renderProfile()
  {
    const account = hub.account();
    const section = panel("Informasi akun", "Profil ini milik akun yang sedang digunakan, terpisah dari pengelolaan akun staf lain.");
    const identity = node("div", "support-person");
    identity.append(node("strong", "", account.name), badge("Aktif", "success"), node("span", "support-meta", account.role));
    section.append(identity, hub.definition([
      ["Email staf", account.email],
      ["Nomor telepon", account.phone || "Belum diisi"],
      ["Verifikasi email", "Terverifikasi pada data contoh"],
      ["Autentikasi", "Kata sandi dan MFA wajib"],
      ["Akses akun", "Akun staf tidak digunakan untuk berbelanja"]
    ]));
    const controls = node("div", "support-actions");
    controls.append(button("Edit profil", "edit-profile", {}, "queue-button queue-button--primary"));
    section.append(banner("Email dan peran dilindungi", "Perubahan email memerlukan verifikasi. Peran tidak dapat dinaikkan sendiri melalui halaman profil."), controls);
    hub.root.append(section);
  }

  function renderSecurity()
  {
    const grid = node("div", "support-grid");
    const password = panel("Kata sandi", "Gunakan kata sandi yang berbeda dari akun belanja dan layanan lain.");
    password.append(hub.definition([
      ["Panjang minimum", "12 karakter untuk staf"],
      ["Terakhir diperbarui", hub.date(hub.account().passwordUpdated)],
      ["Dampak perubahan", "Sesi lain dicabut pada alur aplikasi nyata"]
    ]));
    const passwordActions = node("div", "support-actions");
    passwordActions.append(button("Ubah kata sandi", "change-password", {}, "queue-button queue-button--primary"));
    password.append(passwordActions);
    const mfa = panel("Autentikator (MFA)", "MFA wajib bagi Admin dan SuperAdmin; tidak tersedia pilihan menonaktifkannya.");
    mfa.append(hub.definition([
      ["Status", badge("Aktif", "success")],
      ["Metode", "Aplikasi autentikator"],
      ["Pemulihan", hub.state.role === "superadmin" ? "Kode cadangan atau persetujuan SuperAdmin kedua" : "Verifikasi dan reset oleh SuperAdmin"]
    ]));
    const mfaActions = node("div", "support-actions");
    mfaActions.append(link("Bantuan ganti perangkat MFA", "../staff/staff-help.html?article=mfa"));
    mfa.append(mfaActions);
    grid.append(password, mfa);
    hub.root.append(grid, banner("Jaga informasi autentikasi", "Secret MFA, QR, kata sandi dan kode cadangan tidak ditampilkan di halaman profil. Jangan membagikannya melalui laporan kendala."));
  }

  function renderSessions()
  {
    const account = hub.account();
    const idle = hub.state.role === "superadmin" ? "15 menit" : "30 menit";
    const absolute = hub.state.role === "superadmin" ? "4 jam" : "8 jam";
    const summary = panel("Batas sesi akun", "Nilai baseline ditampilkan untuk menjelaskan aturan. Waktu dan pencabutan nyata harus ditegakkan server.");
    summary.append(hub.definition([
      ["Sesi aktif contoh", `${account.sessions.length} dari batas 2`],
      ["Tanpa aktivitas", idle],
      ["Batas absolut", absolute]
    ]));
    const head = node("div", "support-section-head");
    head.append(node("h2", "", "Perangkat & sesi"));
    const revokeOthers = button("Akhiri semua sesi lain", "end-others");
    revokeOthers.disabled = !account.sessions.some((session) => !session.current);
    head.append(revokeOthers);
    const area = node("section", "support-register");
    const heading = node("div", "report-sheet-heading");
    heading.append(head, node("p", "support-meta", "Perangkat dan lokasi berikut adalah data contoh, bukan pelacakan perangkat nyata."));
    const list = node("ul", "support-list");
    account.sessions.forEach((session) =>
    {
      const row = node("li", "support-row");
      const copy = node("div", "support-row-copy");
      copy.append(node("strong", "", session.device));
      const marks = node("div", "support-inline");
      marks.append(badge(session.current ? "Sesi ini" : "Sesi lain", session.current ? "success" : "info"),
        node("span", "support-meta", session.location));
      copy.append(marks, node("p", "support-meta", `Aktivitas terakhir: ${hub.date(session.at)}`));
      const controls = node("div", "support-row-actions");
      controls.append(session.current ? button("Keluar", "logout") : button("Akhiri sesi", "end-session", { id: session.id }));
      row.append(copy, controls);
      list.append(row);
    });
    area.append(heading, list);
    hub.root.append(summary, area);
  }

  function renderActivity()
  {
    const area = panel("Aktivitas akun saya", "Riwayat contoh dan perubahan pada halaman ini. Bukan rekam audit produksi.");
    const list = node("ol", "support-timeline");
    hub.account().activity.forEach((entry) =>
    {
      const row = document.createElement("li");
      row.append(node("strong", "", entry.title), node("p", "", entry.description), node("small", "support-meta", hub.date(entry.at)));
      list.append(row);
    });
    area.append(list);
    hub.root.append(area);
  }

  function render()
  {
    if (!allowedTabs.includes(hub.state.tab))
    {
      hub.state.tab = "profile";
    }
    hub.heading("Profil & Keamanan", "Periksa identitas, keamanan dan sesi akun staf Anda.", [
      link("Bantuan akun", "../staff/staff-help.html?category=access"), button("Keluar", "logout")
    ]);
    hub.demoNote();
    hub.root.append(hub.tabs([
      ["profile", "Profil"], ["security", "Keamanan"], ["sessions", "Perangkat & sesi"], ["activity", "Aktivitas"]
    ]));
    if (hub.loadState("Profil belum tersedia", "Muat data contoh atau kembali ke halaman login staf."))
    {
      return;
    }
    const renderers = { profile: renderProfile, security: renderSecurity, sessions: renderSessions, activity: renderActivity };
    renderers[hub.state.tab]();
  }

  function editProfile()
  {
    hub.openDialog(
    {
      title: "Edit profil saya",
      build(form)
      {
        const name = input(hub.account().name);
        name.maxLength = 100;
        name.autocomplete = "name";
        const phone = input(hub.account().phone, "tel");
        phone.maxLength = 18;
        phone.autocomplete = "tel";
        form.append(field("Nama", "name", name, "2–100 karakter.", true),
          field("Nomor telepon", "phone", phone, "Opsional. Gunakan +62 diikuti 9–15 digit."),
          banner("Perubahan lokal", "Email dan peran tetap. Perubahan ini tidak memperbarui akun pada server."));
      },
      validate(form)
      {
        const errors = [];
        const name = value(form, "name");
        const phone = value(form, "phone");
        if (name.length < 2 || name.length > 100)
        {
          errors.push("Nama harus terdiri dari 2–100 karakter.");
        }
        if (phone && !/^\+62\d{9,15}$/.test(phone))
        {
          errors.push("Nomor telepon harus memakai +62 diikuti 9–15 digit.");
        }
        return errors;
      },
      commit(form)
      {
        hub.account().name = value(form, "name");
        hub.account().phone = value(form, "phone");
        addActivity("Profil contoh diperbarui", "Nama atau nomor telepon diubah dalam sesi pratinjau.");
        return "Profil contoh diperbarui di halaman ini. Akun server belum berubah.";
      }
    });
  }

  function reauthenticationFields(form)
  {
    const code = input();
    code.inputMode = "numeric";
    code.maxLength = 6;
    code.autocomplete = "off";
    form.append(hub.passwordField("Kata sandi saat ini", "current-password", "Gunakan data contoh, bukan kata sandi asli."),
      field("Kode autentikator", "mfa-code", code, "6 digit contoh. Kode tidak diverifikasi ke layanan MFA.", true));
  }

  function validateReauthentication(form)
  {
    const errors = [];
    const password = value(form, "current-password", false);
    if (!password || password.length > 128)
    {
      errors.push("Isi kata sandi contoh saat ini, maksimal 128 karakter.");
    }
    if (!/^\d{6}$/.test(value(form, "mfa-code")))
    {
      errors.push("Isi kode autentikator contoh dengan tepat 6 digit.");
    }
    return errors;
  }

  function changePassword()
  {
    hub.openDialog(
    {
      title: "Ubah kata sandi",
      submitLabel: "Simulasikan perubahan",
      build(form)
      {
        form.append(banner("Gunakan kredensial contoh", "Form ini memeriksa format saja. Tidak memverifikasi atau mengganti kata sandi server.", "warning"));
        reauthenticationFields(form);
        form.append(hub.passwordField("Kata sandi baru", "new-password", "12–128 karakter. Spasi pada kata sandi dipertahankan."),
          hub.passwordField("Konfirmasi kata sandi baru", "confirm-password", "Masukkan kembali kata sandi contoh yang sama."),
          banner("Dampak pada sesi", "Pada aplikasi nyata, perubahan kata sandi mencabut sesi lain. Di sini hanya daftar sesi contoh yang berubah."));
      },
      validate(form)
      {
        const errors = validateReauthentication(form);
        const password = value(form, "new-password", false);
        if (password.length < 12 || password.length > 128)
        {
          errors.push("Kata sandi baru harus terdiri dari 12–128 karakter.");
        }
        if (password === value(form, "current-password", false))
        {
          errors.push("Kata sandi baru harus berbeda dari kata sandi saat ini.");
        }
        if (password !== value(form, "confirm-password", false))
        {
          errors.push("Konfirmasi kata sandi baru belum sesuai.");
        }
        if (["password1234", "123456789012"].includes(password.toLocaleLowerCase("id-ID")))
        {
          errors.push("Pilih kata sandi contoh yang tidak terlalu umum. Pemeriksaan kata sandi bocor belum terhubung.");
        }
        return errors;
      },
      commit()
      {
        hub.account().passwordUpdated = new Date().toISOString();
        hub.account().sessions = hub.account().sessions.filter((session) => session.current);
        addActivity("Simulasi perubahan kata sandi", "Waktu dan daftar sesi contoh diperbarui. Tidak ada kredensial server yang berubah.");
        return "Simulasi selesai. Kata sandi server tidak berubah; sesi lain hanya dihapus dari daftar contoh.";
      }
    });
  }

  function endSessions(control, all = false)
  {
    const sessions = hub.account().sessions.filter((session) => !session.current && (all || session.id === control.dataset.id));
    if (!sessions.length)
    {
      hub.feedback("Sesi tersebut sudah tidak tersedia pada daftar contoh.", true);
      return;
    }
    hub.openDialog(
    {
      title: all ? "Akhiri semua sesi lain" : "Akhiri sesi perangkat",
      submitLabel: "Akhiri sesi contoh",
      build(form)
      {
        form.append(banner("Sesi ini tetap terbuka", `${sessions.length} sesi contoh akan dikeluarkan dari daftar. Tidak ada sesi server yang dicabut.`, "warning"));
        sessions.forEach((session) => form.append(node("p", "", session.device)));
        reauthenticationFields(form);
      },
      validate: validateReauthentication,
      commit()
      {
        const ids = sessions.map((session) => session.id);
        hub.account().sessions = hub.account().sessions.filter((session) => !ids.includes(session.id));
        addActivity("Sesi contoh diakhiri", `${sessions.length} sesi perangkat lain dihapus dari daftar lokal.`);
        return "Daftar sesi contoh diperbarui. Pencabutan sesi server belum dijalankan.";
      }
    });
  }

  function logout()
  {
    hub.openDialog(
    {
      title: "Keluar dari ruang kerja?",
      submitLabel: "Buka halaman login",
      build(form)
      {
        form.append(banner("Akhiri pratinjau halaman", "Anda akan diarahkan ke login staf. Ini tidak menghapus sesi server karena autentikasi belum terhubung.", "warning"));
      },
      commit()
      {
        location.assign("../auth/staff-login.html?view=login");
        return "Membuka halaman login contoh.";
      }
    });
  }

  hub.start(render,
  {
    "edit-profile": editProfile,
    "change-password": changePassword,
    "end-session": (control) => endSessions(control),
    "end-others": (control) => endSessions(control, true),
    logout
  });
})();
