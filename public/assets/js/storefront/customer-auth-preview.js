"use strict";

// Synthetic adapter only. No password, OTP or real authentication token is stored.
window.RylvaCustomerAuthPreview = (() =>
{
  const query = new URLSearchParams(location.search);
  const development = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)
    && query.get("preview") === "auth";
  const scenarios =
  {
    normal: ["login", "Login normal"], register: ["register", "Registrasi normal"],
    verify: ["verify", "Kode verifikasi"], forgot: ["forgot", "Lupa kata sandi"],
    reset: ["reset", "Kata sandi baru"], loading: ["login", "Loading awal"],
    loadError: ["login", "Gagal memuat"], invalidCredentials: ["login", "Kredensial salah"],
    unverified: ["login", "Akun belum terverifikasi — pesan generik"],
    suspended: ["login", "Akun dibatasi — pesan generik"], captchaRequired: ["login", "Perlu pemeriksaan keamanan"],
    rateLimited: ["login", "Pembatasan percobaan"], serviceError: ["login", "Gangguan layanan"],
    timeout: ["register", "Respons terputus"], offline: ["login", "Koneksi terputus"],
    maintenance: ["login", "Pemeliharaan"], csrfExpired: ["register", "Sesi formulir berakhir"],
    duplicate: ["register", "Email duplikat — respons generik"], weakPassword: ["register", "Password umum ditolak"],
    verifyExpired: ["verify", "Kode kedaluwarsa"], verifyLocked: ["verify", "Batas kesalahan kode"],
    resendLimited: ["verify", "Batas kirim ulang"], resetExpired: ["reset", "Tautan reset kedaluwarsa"],
    resetUsed: ["reset", "Tautan reset sudah digunakan"], resetInvalid: ["reset", "Tautan reset tidak valid"],
    googleCancelled: ["login", "Google dibatalkan"], googleError: ["login", "Google gagal"],
    googleLinkRequired: ["login", "Google perlu bukti akun lokal"],
    storageBlocked: ["register", "Penyimpanan browser tidak tersedia"],
    brokenImage: ["login", "Gambar tidak dimuat"], longContent: ["register", "Konten panjang"]
  };
  const state = development && Object.hasOwn(scenarios, query.get("state")) ? query.get("state") : "normal";
  const storageKey = "rylva-customer-auth-preview-v1";
  let memory = null;
  let recovered = false;
  let storageAvailable = state !== "storageBlocked";
  const faults = new Set();

  function error(code, message, extra = {})
  {
    return Object.assign(new Error(message), { code }, extra);
  }

  function read()
  {
    try
    {
      return memory || (storageAvailable ? JSON.parse(sessionStorage.getItem(storageKey)) : null);
    }
    catch
    {
      storageAvailable = false;
      return memory;
    }
  }

  function write(value)
  {
    memory = value;
    try
    {
      if (storageAvailable)
      {
        sessionStorage.setItem(storageKey, JSON.stringify(value));
      }
    }
    catch
    {
      storageAvailable = false;
    }
    return structuredClone(value);
  }

  function maskEmail(value)
  {
    const [name, domain = "example.test"] = String(value).split("@");
    return name.slice(0, 1) + "***@" + domain;
  }

  function challenge(purpose, email = "pelanggan@example.test")
  {
    const now = Date.now();
    return write({ id: "preview-" + crypto.randomUUID(), purpose, email: maskEmail(email),
      expiresAt: now + (purpose === "reset" ? 15 : 10) * 60000,
      resendAt: now + 60000, windowAt: now, sent: 1, errors: 0, sequence: 0, used: false });
  }

  async function wait()
  {
    await new Promise((resolve) => setTimeout(resolve, 320));
    if (!navigator.onLine || (state === "offline" && !recovered))
    {
      throw error("offline", "Koneksi terputus. Sambungkan kembali dan coba lagi.");
    }
  }

  async function request(action, values = {})
  {
    await wait();
    if (!recovered && !faults.has(state)
      && ["serviceError", "timeout", "maintenance", "csrfExpired", "rateLimited"].includes(state))
    {
      faults.add(state);
      throw error(state, "Permintaan belum dapat diselesaikan.",
        state === "rateLimited" ? { retryAt: Date.now() + 15 * 60000 } : {});
    }
    if (action === "login")
    {
      if (["invalidCredentials", "unverified", "suspended"].includes(state))
      {
        throw error("credentials", "Email atau kata sandi salah.");
      }
      if (state === "captchaRequired")
      {
        throw error("captcha", "Pemeriksaan keamanan diperlukan sebelum melanjutkan.");
      }
      return { outcome: "previewLogin", isPreview: true };
    }
    if (action === "register" || action === "requestVerification")
    {
      if (action === "register" && (state === "weakPassword" || /^(password|12345678)$/i.test(values.password || "")))
      {
        throw error("validation", "Gunakan kata sandi yang tidak umum.", { field: "password" });
      }
      return { challenge: challenge("verify", values.email), outcome: "verificationPending", isPreview: true, storageAvailable };
    }
    if (action === "forgot")
    {
      return { challenge: challenge("reset", values.email), outcome: "recoveryRequested", isPreview: true };
    }
    if (action === "verify" || action === "resend")
    {
      const current = read();
      if (!current || current.purpose !== "verify" || current.used)
      {
        throw error("missingChallenge", "Mulai verifikasi email untuk meminta kode baru.");
      }
      if (action === "resend")
      {
        if (Date.now() < current.resendAt)
        {
          throw error("resendWait", "Tunggu sebelum mengirim ulang kode.");
        }
        if (Date.now() - current.windowAt >= 3600000)
        {
          current.sent = 0;
          current.windowAt = Date.now();
        }
        if (current.sent >= 5)
        {
          throw error("resendLimited", "Batas pengiriman tercapai. Coba lagi setelah satu jam.", { retryAt: current.windowAt + 3600000 });
        }
        current.sent++;
        current.sequence++;
        current.errors = 0;
        current.expiresAt = Date.now() + 10 * 60000;
        current.resendAt = Date.now() + 60000;
        return { challenge: write(current), outcome: "resent", isPreview: true };
      }
      if (Date.now() >= current.expiresAt)
      {
        throw error("expiredCode", "Kode sudah kedaluwarsa. Minta kode baru.");
      }
      if (current.errors >= 5)
      {
        throw error("lockedCode", "Kode tidak dapat digunakan lagi. Minta kode baru.");
      }
      if (values.code !== String(123456 + current.sequence))
      {
        current.errors++;
        write(current);
        throw error(current.errors >= 5 ? "lockedCode" : "wrongCode",
          current.errors >= 5 ? "Kode tidak dapat digunakan lagi. Minta kode baru." : "Kode tidak cocok. Periksa kembali kode Anda.");
      }
      current.used = true;
      write(current);
      return { outcome: "previewVerified", isPreview: true };
    }
    if (action === "reset")
    {
      const current = read();
      if (!current || current.purpose !== "reset" || current.used || Date.now() >= current.expiresAt)
      {
        throw error("invalidReset", "Tautan pemulihan tidak valid atau sudah kedaluwarsa. Minta tautan baru.");
      }
      current.used = true;
      write(current);
      return { outcome: "previewReset", isPreview: true };
    }
    if (action === "google")
    {
      throw error(state === "googleCancelled" ? "googleCancelled"
        : state === "googleLinkRequired" ? "googleLinkRequired" : "googleUnavailable",
      "Masuk dengan Google belum terhubung pada pratinjau ini.");
    }
    throw error("serviceError", "Tindakan belum tersedia.");
  }

  async function load(view)
  {
    if (state === "loading" && !recovered)
    {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    await wait();
    if (state === "loadError" && !recovered)
    {
      throw error("loadError", "Formulir belum dapat dimuat.");
    }
    if (development && ["verify", "reset"].includes(view) && !read())
    {
      challenge(view === "verify" ? "verify" : "reset");
    }
    const current = read();
    if (current && view === "verify" && state === "verifyExpired")
    {
      current.expiresAt = Date.now() - 1;
      write(current);
    }
    if (current && view === "verify" && state === "verifyLocked")
    {
      current.errors = 5;
      write(current);
    }
    if (current && state === "resendLimited")
    {
      current.sent = 5;
      current.resendAt = Date.now() - 1;
      write(current);
    }
    if (view === "reset" && ["resetExpired", "resetUsed", "resetInvalid"].includes(state))
    {
      throw error("invalidReset", "Tautan pemulihan tidak valid atau sudah kedaluwarsa. Minta tautan baru.");
    }
    if (view === "reset" && (!current || current.purpose !== "reset" || current.used || Date.now() >= current.expiresAt))
    {
      throw error("invalidReset", "Buka tautan pemulihan yang masih berlaku, atau minta tautan baru.");
    }
    return { challenge: read(), isPreview: true, storageAvailable };
  }

  return { isPreview: true, state, scenarios, load, request, read, maskEmail,
    recover()
    {
      recovered = true;
    } };
})();
