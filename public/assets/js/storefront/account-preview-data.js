"use strict";

// Synthetic preview adapter. It performs no authentication, email or provider request.
window.RylvaAccountPreview = (() =>
{
  const scenarioLabels =
  {
    normal: "Normal", empty: "Belum ada alamat", noPhone: "Telepon belum ditambahkan",
    googleOnly: "Google-only", linked: "Email dan Google", readOnly: "Hanya dapat dilihat",
    limit: "Batas alamat", long: "Konten panjang", partial: "Section alamat gagal",
    invalid: "Data inti tidak valid", loading: "Loading", slow: "Loading lama",
    loadError: "Gagal memuat", refreshError: "Gagal memperbarui", offline: "Offline",
    service: "Gangguan layanan", maintenance: "Maintenance", rateLimit: "Pembatasan sementara",
    login: "Perlu masuk", session: "Sesi berakhir", denied: "Peran staf",
    verification: "Registrasi belum terverifikasi", unavailable: "Akun tidak tersedia",
    inactive: "Akun nonaktif", anonymized: "Anonimisasi selesai",
    emailPending: "Email menunggu kode", emailExpired: "Kode kedaluwarsa",
    codeLimit: "Batas kesalahan kode", emailSendError: "Pengiriman kode gagal",
    emailConflict: "Email tidak dapat digunakan", deletionPending: "Permintaan penghapusan tercatat",
    deletionReady: "Tanpa transaksi aktif", notificationPending: "Pemberitahuan tertunda",
    addressRemoved: "Alamat dihapus saat dibuka", stale: "Data perlu diperbarui",
    changed: "Data berubah", mapUnavailable: "Lokasi gagal dimuat", pinRequired: "Titik lokasi wajib",
    sessionsEmpty: "Hanya perangkat ini", sessionsUnavailable: "Aktivitas login gagal dimuat"
  };
  const faultLabels =
  {
    none: "Tanpa gangguan", saveError: "Gagal simpan", timeout: "Commit lalu respons terputus",
    conflict: "Konflik revisi", csrf: "CSRF kedaluwarsa", rateLimit: "429 sementara",
    session: "Sesi berakhir", denied: "Aksi ditolak", validation: "Validasi server",
    emailConflict: "Email konflik", sendError: "Email gagal dikirim", duplicate: "Request duplikat",
    partialSuccess: "Tersimpan, pemberitahuan tertunda", wrongPassword: "Kata sandi salah"
  };
  const clone = (value) => JSON.parse(JSON.stringify(value));

  function fixture(scenario)
  {
    const addresses = [
      {
        id: "address-home", ownerId: "preview-customer", label: "Rumah", recipient: "Nadia Pratama",
        recipientPhone: "+6281200000001", street: "Jalan Taman Contoh Nomor 12", village: "Kelurahan Contoh",
        district: "Kecamatan Contoh", city: "Bandung", province: "Jawa Barat", postcode: "40123",
        note: "Pagar hijau", primary: true, point: { latitude: -6.9, longitude: 107.6 }
      },
      {
        id: "address-office", ownerId: "preview-customer", label: "Kantor", recipient: "Nadia Pratama",
        recipientPhone: "+6281200000001", street: "Jalan Kebun Contoh Nomor 8", village: "Kelurahan Contoh",
        district: "Kecamatan Contoh", city: "Bandung", province: "Jawa Barat", postcode: "40124",
        note: "Titip di resepsionis", primary: false, point: null
      }
    ];
    const account =
    {
      id: "preview-customer", version: 1, name: "Nadia Pratama", email: "nadia@pelanggan.example",
      phone: "+6281200000001", emailVerified: true, hasPassword: true, googleLinked: false,
      active: true, addresses, pendingEmail: null, deletion: null, hasActiveTransactions: true,
      sessionsAvailable: true,
      sessions: [
        { id: "session-current", device: "Chrome di Windows", type: "desktop", ip: "192.0.2.12", current: true, lastActiveAt: new Date().toISOString() },
        { id: "session-laptop", device: "Chrome di Windows", type: "desktop", ip: "198.51.100.24", current: false, lastActiveAt: new Date(Date.now() - 86400000).toISOString() },
        { id: "session-phone", device: "Chrome di Android", type: "phone", ip: "2001:db8::12", current: false, lastActiveAt: new Date(Date.now() - 3 * 86400000).toISOString() }
      ],
      limits: { addresses: 5, addressNote: 50 },
      capabilities: { profile: true, address: true, email: true, password: true, deletion: true, revokeSession: true },
      requiresPoint: scenario === "pinRequired", addressesAvailable: scenario !== "partial"
    };
    if (scenario === "empty")
    {
      account.addresses = [];
    }
    if (scenario === "noPhone")
    {
      account.phone = "";
    }
    if (scenario === "sessionsEmpty")
    {
      account.sessions = account.sessions.filter((session) => session.current);
    }
    if (scenario === "sessionsUnavailable")
    {
      account.sessionsAvailable = false;
    }
    if (scenario === "googleOnly")
    {
      account.hasPassword = false;
      account.googleLinked = true;
      account.capabilities.email = false;
      account.capabilities.deletion = false;
    }
    if (scenario === "linked")
    {
      account.googleLinked = true;
    }
    if (scenario === "readOnly")
    {
      Object.keys(account.capabilities).forEach((key) =>
      {
        account.capabilities[key] = false;
      });
    }
    if (scenario === "limit")
    {
      for (let index = 3; index <= 5; index++)
      {
        account.addresses.push({ ...clone(addresses[1]), id: "address-" + index, label: "Alamat " + index });
      }
    }
    if (scenario === "long")
    {
      account.name = "Nadia Pratama dengan nama keluarga panjang untuk pemeriksaan tampilan akun";
      account.email = "nadia.dengan.alamat.email.panjang.untuk.pemeriksaan@pelanggan.example";
      account.addresses[0].label = "Rumah keluarga dengan label alamat yang panjang";
      account.addresses[0].street = "Jalan Taman Contoh Nomor 12, blok dan rincian alamat yang panjang untuk memastikan teks tetap membungkus dengan baik pada kartu alamat di perangkat kecil.";
    }
    if (scenario === "invalid")
    {
      account.email = null;
    }
    if (["emailPending", "emailExpired", "codeLimit", "emailSendError"].includes(scenario))
    {
      account.pendingEmail =
      {
        email: "nadia.baru@pelanggan.example", expiresAt: Date.now() + (scenario === "emailExpired" ? -1000 : 600000),
        resendAt: Date.now() + (["emailSendError", "emailExpired"].includes(scenario) ? 0 : 60000), failures: scenario === "codeLimit" ? 5 : 0,
        sends: 1, sent: scenario !== "emailSendError"
      };
    }
    if (scenario === "deletionPending")
    {
      account.deletion = { status: "pending", requestedAt: new Date().toISOString() };
    }
    if (scenario === "deletionReady")
    {
      account.hasActiveTransactions = false;
    }
    return account;
  }

  function createAdapter()
  {
    const parameters = new URLSearchParams(window.location.search);
    const scenario = Object.hasOwn(scenarioLabels, parameters.get("state")) ? parameters.get("state") : "normal";
    const fault = Object.hasOwn(faultLabels, parameters.get("fault")) ? parameters.get("fault") : "none";
    const key = "rylva-account-preview-v1:" + scenario;
    let data = fixture(scenario);
    let reads = 0;
    let faultUsed = false;
    let revisionChanged = false;
    let blockedUntil = 0;
    let emailWindowStarted = Date.now();
    try
    {
      const saved = JSON.parse(sessionStorage.getItem(key));
      if (saved?.id === data.id && saved.schemaVersion === 1)
      {
        data = saved;
      }
    }
    catch
    {
      // Restricted storage uses the current tab's memory only.
    }
    if (!Array.isArray(data.sessions))
    {
      const baseline = fixture(scenario);
      data.sessions = baseline.sessions;
      data.sessionsAvailable = baseline.sessionsAvailable;
      data.capabilities.revokeSession = scenario !== "readOnly";
    }
    function save()
    {
      try
      {
        sessionStorage.setItem(key, JSON.stringify({ ...data, schemaVersion: 1 }));
      }
      catch
      {
        // Data remains available until this preview page closes.
      }
    }
    function error(code, details = {})
    {
      return Object.assign(new Error(code), { code, ...details });
    }
    function synchronize()
    {
      try
      {
        if (sessionStorage.getItem("rylva-account-preview-access-v1") === "signed-out")
        {
          throw error("session");
        }
        const saved = JSON.parse(sessionStorage.getItem(key));
        if (saved?.id === data.id && saved.schemaVersion === 1 && saved.version > data.version)
        {
          data = saved;
        }
      }
      catch (failure)
      {
        if (failure.code === "session")
        {
          throw failure;
        }
      }
    }
    async function wait(signal, milliseconds = 280)
    {
      await new Promise((resolve, reject) =>
      {
        const timeout = setTimeout(resolve, milliseconds);
        signal?.addEventListener("abort", () =>
        {
          clearTimeout(timeout);
          reject(error("aborted"));
        }, { once: true });
      });
    }
    async function getSnapshot({ signal } = {})
    {
      reads++;
      if (scenario === "loading" || (scenario === "slow" && reads === 1))
      {
        await wait(signal, 60000);
      }
      await wait(signal);
      synchronize();
      if (!navigator.onLine || scenario === "offline")
      {
        throw error("offline");
      }
      if (!data.active)
      {
        throw error("session");
      }
      const failure = ["loadError", "service", "maintenance", "login", "denied", "verification", "unavailable", "inactive", "anonymized"].includes(scenario)
        ? scenario : (["session", "refreshError"].includes(scenario) && reads > 1 ? scenario : null);
      if (failure)
      {
        throw error(failure);
      }
      if (scenario === "rateLimit" && reads === 1)
      {
        blockedUntil = Date.now() + 2500;
        throw error("rateLimit", { retryAt: blockedUntil });
      }
      if (Date.now() < blockedUntil)
      {
        throw error("rateLimit", { retryAt: blockedUntil });
      }
      if (scenario === "changed" && reads > 1 && !revisionChanged)
      {
        data.name = "Nadia Pratama Diperbarui";
        data.version++;
        revisionChanged = true;
        save();
      }
      if (scenario === "partial" && reads > 1)
      {
        data.addressesAvailable = true;
      }
      return { ...clone(data), stale: scenario === "stale" && reads === 1, serverNow: Date.now(), notificationPending: scenario === "notificationPending" };
    }
    async function perform(action, values, expectedVersion)
    {
      await wait();
      synchronize();
      if (!navigator.onLine)
      {
        throw error("offline");
      }
      if (!data.active)
      {
        throw error("session");
      }
      if (expectedVersion !== data.version)
      {
        throw error("conflict");
      }
      const capability = ["primary", "removeAddress"].includes(action) ? "address"
        : (["verifyEmail", "resend"].includes(action) ? "email" : action);
      if (action !== "logout" && action !== "recovery" && !data.capabilities[capability])
      {
        throw error("denied");
      }
      const validationAction = action === "address" ? "address" : action;
      const fields = window.RylvaAccountValidation.validate(validationAction, { ...values, requiresPassword: data.hasPassword }, data.limits);
      if (Object.keys(fields).length)
      {
        throw error("validation", { fields });
      }
      if (scenario === "addressRemoved" && values.id)
      {
        data.addresses = data.addresses.filter((address) => address.id !== values.id);
        data.version++;
        save();
        throw error("notFound");
      }
      let appliedFault = "none";
      if (!faultUsed && fault !== "none")
      {
        faultUsed = true;
        appliedFault = fault;
        if (["timeout", "partialSuccess"].includes(fault))
        {
          /* Commit is handled below. */
        }
        else if (fault === "conflict")
        {
          data.version++;
          data.name = "Nadia Pratama Diperbarui";
          save();
          throw error("conflict");
        }
        else if (fault === "rateLimit")
        {
          throw error(fault, { retryAt: Date.now() + 2500 });
        }
        else if (fault === "validation")
        {
          throw error(fault, { fields: { [Object.keys(values)[0]]: "Periksa kembali isian ini sebelum menyimpan." } });
        }
        else
        {
          if (fault === "session")
          {
            data.active = false;
            save();
          }
          throw error(fault);
        }
      }
      if (["email", "password", "deletion"].includes(action) && data.hasPassword && values.currentPassword.length < 8)
      {
        throw error("wrongPassword", { fields: { currentPassword: "Kata sandi tidak dapat diverifikasi. Periksa kembali isian Anda." } });
      }
      if (action === "profile")
      {
        data.name = values.name.trim().replace(/\s+/g, " ");
        data.phone = window.RylvaAccountValidation.normalizePhone(values.phone);
      }
      if (action === "email")
      {
        if (scenario === "emailConflict" || values.email.toLowerCase() === data.email)
        {
          throw error("emailConflict");
        }
        data.pendingEmail = { email: values.email.toLowerCase().trim(), expiresAt: Date.now() + 600000, resendAt: Date.now() + 60000, failures: 0, sends: 1, sent: true };
      }
      if (action === "verifyEmail")
      {
        const pending = data.pendingEmail;
        if (!pending || !pending.sent || pending.failures >= 5 || Date.now() > pending.expiresAt)
        {
          throw error("codeExpired");
        }
        if (values.code !== "123456")
        {
          pending.failures++;
          save();
          throw error("codeInvalid");
        }
        data.email = pending.email;
        data.pendingEmail = null;
      }
      if (action === "resend")
      {
        const pending = data.pendingEmail;
        if (!pending)
        {
          throw error("conflict");
        }
        if (Date.now() < pending.resendAt)
        {
          throw error("rateLimit", { retryAt: pending.resendAt });
        }
        if (Date.now() - emailWindowStarted >= 3600000)
        {
          emailWindowStarted = Date.now();
          pending.sends = 0;
        }
        if (pending.sends >= 5)
        {
          throw error("rateLimit", { retryAt: emailWindowStarted + 3600000 });
        }
        Object.assign(pending, { expiresAt: Date.now() + 600000, resendAt: Date.now() + 60000, failures: 0, sends: pending.sends + 1, sent: true });
      }
      if (action === "password")
      {
        if (/^(password|12345678)/i.test(values.newPassword))
        {
          throw error("validation", { fields: { newPassword: "Kata sandi ini terlalu umum. Gunakan kata sandi lain." } });
        }
        // No password or derived credential is retained by this preview.
        data.sessions = data.sessions.filter((session) => session.current);
      }
      if (action === "revokeSession")
      {
        const session = data.sessions.find((entry) => entry.id === values.id);
        if (!session)
        {
          throw error("notFound");
        }
        if (session.current)
        {
          throw error("denied");
        }
        data.sessions = data.sessions.filter((entry) => entry.id !== session.id);
      }
      if (action === "address")
      {
        const existing = values.id && data.addresses.find((address) => address.id === values.id && address.ownerId === data.id);
        if (values.id && !existing)
        {
          throw error("notFound");
        }
        if (!existing && data.addresses.length >= data.limits.addresses)
        {
          throw error("limit");
        }
        const address = { ...values, id: existing?.id || "address-" + crypto.randomUUID(), ownerId: data.id, recipientPhone: window.RylvaAccountValidation.normalizePhone(values.recipientPhone) };
        delete address.requiresPoint;
        if (address.primary)
        {
          data.addresses.forEach((item) =>
          {
            item.primary = false;
          });
        }
        if (existing)
        {
          data.addresses[data.addresses.indexOf(existing)] = address;
        }
        else
        {
          data.addresses.push(address);
        }
      }
      if (["primary", "removeAddress"].includes(action))
      {
        const address = data.addresses.find((item) => item.id === values.id && item.ownerId === data.id);
        if (!address)
        {
          throw error("notFound");
        }
        if (action === "primary")
        {
          data.addresses.forEach((item) =>
          {
            item.primary = item.id === address.id;
          });
        }
        else
        {
          data.addresses = data.addresses.filter((item) => item.id !== address.id);
        }
      }
      if (action === "deletion")
      {
        if (data.deletion)
        {
          throw error("duplicate");
        }
        data.deletion = { status: "pending", requestedAt: new Date().toISOString() };
      }
      if (action === "logout")
      {
        data.active = false;
      }
      data.version++;
      save();
      if (appliedFault === "timeout")
      {
        throw error("timeout");
      }
      return { ...clone(data), notificationPending: appliedFault === "partialSuccess" };
    }
    return {
      getSnapshot, perform,
      reset()
      {
        try
        {
          sessionStorage.removeItem("rylva-account-preview-access-v1");
        }
        catch
        {
          // In-memory reset remains available without storage.
        }
        data = fixture(scenario);
        reads = 0;
        faultUsed = false;
        save();
      }
    };
  }
  return { createAdapter, scenarioLabels, faultLabels };
})();
