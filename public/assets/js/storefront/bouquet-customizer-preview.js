"use strict";

// Replace this adapter with a server-backed implementation for production.
// Workbench faults are local-host only and never write the ordinary preview cart.
window.RylvaBouquetPreviewRepository = (() =>
{
  const data = window.RylvaBouquetPreviewData;
  const cartRepository = window.RylvaCartPreviewRepository;
  const query = new URLSearchParams(location.search);
  const workbench = ["127.0.0.1", "localhost", "[::1]"].includes(location.hostname)
    && query.get("preview") === "bouquet";
  const scenarios =
  {
    normal: "Normal", ready: "Rakitan lengkap", fullComposition: "Komposisi Korean Bouquet lengkap", guest: "Perlu masuk", session: "Sesi berakhir",
    denied: "Akses ditolak", verification: "Verifikasi diperlukan", loading: "Memuat",
    loadError: "Gagal memuat", offline: "Offline", maintenance: "Maintenance",
    notFound: "Produk tidak ditemukan", unavailable: "Produk tidak tersedia",
    emptyOptions: "Pilihan kosong", unavailableOption: "Pilihan tidak tersedia",
    partial: "Data sebagian", brokenImage: "Aset gagal", missingPreview: "Pratinjau tidak tersedia",
    noResults: "Pencarian kosong", quoteLoading: "Menghitung harga",
    quoteError: "Gagal menghitung harga", quoteStale: "Harga tidak terbaru",
    saveLoading: "Menyimpan", saveError: "Gagal menyimpan", timeout: "Respons terputus",
    priceChanged: "Harga berubah", conflict: "Konflik perubahan",
    removed: "Item dihapus", rateLimited: "Batas percobaan", csrf: "Sesi formulir berakhir",
    limit: "Batas jumlah", storageBlocked: "Penyimpanan tidak tersedia",
    success: "Berhasil", longContent: "Konten panjang"
  };
  const scenario = workbench && Object.hasOwn(scenarios, query.get("state")) ? query.get("state") : "normal";
  const faults = new Set();
  let recovered = false;
  let cart = null;
  let demoRevision = 0;
  let lastResult = null;
  let retryAt = 0;
  let priceAccepted = false;
  let priceAdjustment = 0;

  function fail(code, message)
  {
    return Object.assign(new Error(message), { code });
  }

  function once(name)
  {
    if (!recovered && scenario === name && !faults.has(name))
    {
      faults.add(name);
      return true;
    }
    return false;
  }

  async function wait(milliseconds = 250)
  {
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
    if (!navigator.onLine)
    {
      throw fail("offline", "Koneksi terputus. Sambungkan kembali lalu coba lagi. Pilihan Anda tetap ada.");
    }
  }

  async function load()
  {
    await wait(scenario === "loading" && !recovered ? 2000 : 220);
    if (!workbench && !window.RylvaBouquetCartPreview.active())
    {
      throw fail("guest", "Masuk dengan akun pelanggan untuk meracik dan menambahkan buket.");
    }
    if (!recovered && ["guest", "session", "denied", "verification", "notFound", "unavailable"].includes(scenario))
    {
      throw fail(scenario, "Buket belum dapat dibuka pada kondisi ini.");
    }
    if (once("loadError") || once("maintenance") || once("offline"))
    {
      throw fail(scenario, "Pilihan buket belum dapat dimuat. Coba lagi tanpa mengubah isi keranjang.");
    }
    if (query.has("product") && query.get("product") !== data.productId)
    {
      throw fail("notFound", "Buket tidak ditemukan. Pilih produk dari katalog.");
    }
    cart = workbench ? { items: [], revision: demoRevision, limits: { perProduct: 20, perOrder: 50 } }
      : await cartRepository.load({ recover: true });
    const editLineId = query.get("edit");
    const current = editLineId && cart.items.find((item) => item.lineId === editLineId && item.configurationDraft);
    if (editLineId && !current)
    {
      throw fail("removed", "Rakitan tidak ditemukan di keranjang sesi pelanggan ini. Mulai rakitan baru atau kembali ke keranjang.");
    }
    const draft = current ? structuredClone(current.configurationDraft) : data.emptyDraft();
    if (workbench && !["normal", "noResults", "emptyOptions", "loading"].includes(scenario))
    {
      draft.selections = { "red-rose": 1, eucalyptus: 1, "sage-wrap": 1, "cream-ribbon": 1 };
    }
    if (scenario === "fullComposition")
    {
      draft.selections =
      {
        "red-rose": 2,
        "white-rose": 1,
        "baby-breath": 1,
        eucalyptus: 1,
        "sage-wrap": 1,
        "cream-ribbon": 1
      };
    }
    if (scenario === "longContent")
    {
      draft.label = "Buket untuk perayaan kelulusan bersama sahabat dan keluarga";
      draft.message = "Terima kasih sudah tumbuh bersama. Semoga setiap langkah baru membawa kebahagiaan dan kenangan yang hangat.";
    }
    return {
      draft, cart, editLineId: current?.lineId || null, editRevision: current?.configurationRevision || null,
      groups: structuredClone(data.groups),
      options: scenario === "emptyOptions" ? [] : structuredClone(data.options).map((option) =>
      ({ ...option, available: !(scenario === "unavailableOption" && option.id === "white-rose") })),
      previewAvailable: !["missingPreview", "partial"].includes(scenario)
    };
  }

  async function quote(draft)
  {
    await wait(scenario === "quoteLoading" && !recovered ? 1400 : 180);
    if (once("quoteError") || once("quoteStale"))
    {
      throw fail(scenario, "Harga belum dapat diperbarui. Pilihan Anda tetap ada. Hitung ulang sebelum menambahkan.");
    }
    return { unitPrice: data.price(draft) + priceAdjustment, subtotal: (data.price(draft) + priceAdjustment) * draft.quantity };
  }

  async function save(draft, editLineId, editRevision, requestId, acceptPriceChange)
  {
    await wait(scenario === "saveLoading" ? 1800 : 250);
    if (lastResult?.requestId === requestId)
    {
      return lastResult;
    }
    if (Date.now() < retryAt)
    {
      throw Object.assign(fail("rateLimited", "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi."), { retryAt });
    }
    if (once("rateLimited"))
    {
      retryAt = Date.now() + 5000;
      throw Object.assign(fail("rateLimited", "Terlalu banyak percobaan. Coba lagi dalam 5 detik."), { retryAt });
    }
    if (scenario === "priceChanged" && !priceAccepted)
    {
      priceAdjustment = 10000;
      if (acceptPriceChange)
      {
        priceAccepted = true;
      }
      else
      {
        throw Object.assign(fail("priceChanged", "Harga rakitan berubah. Tinjau harga terbaru sebelum menyimpan."),
          { oldPrice: data.price(draft), newPrice: data.price(draft) + priceAdjustment });
      }
    }
    for (const code of ["saveError", "conflict", "removed", "csrf", "storageBlocked", "limit"])
    {
      if (once(code))
      {
        const messages =
        {
          saveError: "Rakitan belum tersimpan. Coba lagi; semua pilihan tetap ada.",
          conflict: "Rakitan berubah di keranjang. Muat versi keranjang terbaru; pilihan di halaman ini tetap ada.",
          removed: "Rakitan ini telah dihapus dari keranjang. Tambahkan sebagai rakitan baru.",
          csrf: "Sesi formulir berakhir. Perbarui sesi lalu coba lagi.",
          storageBlocked: "Penyimpanan tab tidak tersedia. Rakitan belum ditambahkan. Izinkan penyimpanan dan coba lagi.",
          limit: "Batas jumlah keranjang tercapai. Kurangi jumlah atau sesuaikan isi keranjang."
        };
        throw fail(code, messages[code]);
      }
    }
    const errors = data.validate(draft);
    if (errors.length)
    {
      throw fail("validation", errors.join(" "));
    }
    const result = workbench ? { lineId: "bouquet-demo", merged: false, cart: { ...cart, revision: ++demoRevision } }
      : await cartRepository.saveConfiguration(draft, cart.revision, editLineId, editRevision);
    cart = result.cart;
    lastResult = { ...result, requestId };
    if (once("timeout"))
    {
      throw fail("timeout", "Respons terputus. Periksa hasil permintaan sebelum mengirim lagi.");
    }
    return lastResult;
  }

  async function reconcile(requestId)
  {
    await wait();
    if (lastResult?.requestId === requestId)
    {
      return lastResult;
    }
    throw fail("saveError", "Rakitan belum tersimpan. Anda dapat mencoba lagi.");
  }

  async function refreshCart()
  {
    recovered = true;
    cart = workbench ? cart : await cartRepository.load({ recover: true });
    return cart;
  }

  return {
    load, quote, save, reconcile, refreshCart, scenarios, scenario, workbench,
    recover()
    {
      recovered = true;
    }
  };
})();
