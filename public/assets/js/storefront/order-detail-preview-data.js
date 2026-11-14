"use strict";

// Synthetic read model and mutations for the explicitly labelled HTML preview.
window.RylvaOrderDetailPreview = (() =>
{
  const scenarioLabels =
  {
    shipping: "Dikirim — tampilan utama",
    pending: "Menunggu pembayaran",
    ready: "Siap diproses — pembatalan langsung",
    preparing: "Sedang disiapkan — permintaan pembatalan",
    perishable: "Buket mudah layu — sedang disiapkan",
    cod: "COD dikirim — belum lunas",
    delivered: "Terkirim — jendela komplain",
    completed: "Selesai — hak komplain ditutup",
    closedWindow: "Batas komplain sudah lewat",
    cancelled: "Dibatalkan — belum dibayar",
    cancelPending: "Permintaan pembatalan diajukan",
    cancelRejected: "Permintaan pembatalan ditolak",
    complaint: "Komplain dalam tinjauan",
    complaintRejected: "Komplain ditolak — dapat banding",
    appeal: "Banding dieskalasi",
    appealClosed: "Banding tidak tersedia",
    resolved: "Komplain selesai — refund sebagian",
    refund: "Dibatalkan — refund diproses",
    refundFailed: "Refund gagal — ditindaklanjuti toko",
    fullRefund: "Refund penuh berhasil",
    stockIssue: "PH-01 — masalah ketersediaan",
    late: "PH-02 — pembayaran terlambat",
    review: "PH-03 — dana perlu ditinjau",
    deliveryIssue: "PH-04 — pengiriman terkendala",
    lost: "PH-05 — investigasi kehilangan",
    physicalStock: "PH-06 — stok fisik",
    intercept: "PH-07 — penghentian pengiriman",
    returned: "Paket dikembalikan",
    dispute: "Sengketa pembayaran",
    noTracking: "Belum ada resi",
    emptyHistory: "Riwayat belum tersedia",
    partial: "Metadata pendukung belum lengkap",
    imageError: "Foto produk gagal dimuat",
    long: "Nama panjang, buket, angka besar",
    archived: "Riwayat read-only",
    loading: "Loading awal yang tertahan",
    loadError: "Gagal memuat — retry berhasil",
    offline: "Koneksi terputus — snapshot terakhir",
    maintenance: "Layanan dalam pemeliharaan",
    service: "Gangguan layanan",
    rateLimit: "Pembatasan sementara",
    login: "Perlu masuk",
    session: "Sesi berakhir",
    denied: "Akses tidak diizinkan",
    verification: "Perlu verifikasi",
    notFound: "Pesanan tidak ditemukan",
    unavailable: "Pesanan tidak tersedia",
    invalid: "Data inti tidak valid",
    unknown: "Status tidak dikenal",
    receiptError: "Bukti pelunasan gagal dimuat"
  };
  const categories =
  [
    "Layu/tidak segar", "Rusak (produk atau kemasan)", "Salah/tidak sesuai pesanan",
    "Kurang item", "Terlambat lebih dari 2 jam", "Tidak diterima"
  ];

  function clone(value)
  {
    return JSON.parse(JSON.stringify(value));
  }

  function fail(code, message)
  {
    return Object.assign(new Error(message), { code, retryAfter: 3 });
  }

  function wait()
  {
    return new Promise((resolve) =>
    {
      window.setTimeout(resolve, 280);
    });
  }

  function enhance(base)
  {
    const now = Date.now();
    return {
      ...base,
      shippingStatus: "Belum Diserahkan",
      recipient: { name: "Penerima Contoh", phone: "Nomor contoh tidak ditampilkan", address: "Jalan Kebun, Kecamatan Contoh, Jakarta — alamat ilustrasi" },
      trackingNumber: null,
      trackingUrl: null,
      greeting: null,
      note: "Mohon hubungi penerima saat kurir tiba.",
      history: [{ title: "Pesanan dibuat", at: base.createdAt, detail: "Snapshot produk dan biaya tercatat." }],
      cancellationRequest: null,
      complaint: null,
      handling: base.caseCode ? { code: base.caseCode, description: "Toko sedang memeriksa pesanan ini. Pilihan penyelesaian akan diinformasikan setelah pemeriksaan." } : null,
      complaintDeadline: null,
      archived: false,
      snapshotAt: new Date(now).toISOString(),
      serverNow: new Date(now).toISOString()
    };
  }

  function rights(snapshot)
  {
    const openComplaint = snapshot.complaint && snapshot.complaint.status !== "Selesai";
    const mutable = !snapshot.archived && snapshot.paymentStatus !== "Sengketa";
    const pendingCancellation = snapshot.cancellationRequest?.status === "Diajukan";
    return {
      pay: mutable && !snapshot.isCod && snapshot.orderStatus === "Menunggu Pembayaran",
      cancel: mutable && !pendingCancellation && ["Menunggu Pembayaran", "Siap Diproses"].includes(snapshot.orderStatus),
      requestCancel: mutable && !pendingCancellation && ["Sedang Disiapkan", "Dikirim"].includes(snapshot.orderStatus),
      confirmReceipt: mutable && !openComplaint && ["Dikirim", "Terkirim"].includes(snapshot.orderStatus),
      complain: mutable && !snapshot.complaint && snapshot.orderStatus === "Terkirim"
        && Date.parse(snapshot.complaintDeadline) > Date.now(),
      appeal: mutable && snapshot.complaint?.status === "Ditolak" && !snapshot.complaint.appealUsed
        && Date.parse(snapshot.complaint.appealDeadline) > Date.now()
    };
  }

  function createFixture(base, scenario)
  {
    const snapshot = enhance(base);
    const now = Date.now();
    const deliveredCases = ["delivered", "closedWindow", "complaint", "complaintRejected", "appeal", "appealClosed", "resolved"];
    const terminalCases = ["completed", "resolved"];
    snapshot.orderStatus = "Dikirim";
    snapshot.createdAt = new Date(now - 240 * 60000).toISOString();
    snapshot.deliveryDate = new Date(now + 7 * 3600000).toISOString().slice(0, 10);
    snapshot.history[0].at = snapshot.createdAt;
    snapshot.paymentStatus = "Berhasil";
    snapshot.verifiedPaidAmount = snapshot.totalAmount;
    snapshot.receiptAvailable = true;
    snapshot.shippingStatus = "Dalam Pengiriman";
    snapshot.trackingNumber = "RESI-CONTOH-261113";
    snapshot.history.unshift(
      { title: "Diserahkan ke kurir", at: new Date(now - 180 * 60000).toISOString(), detail: "Paket dalam pengiriman menuju penerima." },
      { title: "Pesanan disiapkan", at: new Date(now - 210 * 60000).toISOString(), detail: "Produk diperiksa dan dikemas." },
      { title: "Pembayaran terkonfirmasi", at: new Date(now - 230 * 60000).toISOString(), detail: "Dana contoh tercatat terverifikasi." }
    );
    snapshot.history.sort((first, second) => Date.parse(second.at) - Date.parse(first.at));
    if (["pending", "ready", "preparing", "perishable", "noTracking"].includes(scenario))
    {
      snapshot.orderStatus = scenario === "pending" ? "Menunggu Pembayaran"
        : (["preparing", "perishable"].includes(scenario) ? "Sedang Disiapkan" : "Siap Diproses");
      snapshot.shippingStatus = "Belum Diserahkan";
      snapshot.trackingNumber = null;
      snapshot.history = snapshot.history.filter((event) => event.title !== "Diserahkan ke kurir");
    }
    if (["pending", "cancelled"].includes(scenario))
    {
      snapshot.paymentStatus = scenario === "pending" ? "Menunggu" : "Dibatalkan";
      snapshot.orderStatus = scenario === "pending" ? "Menunggu Pembayaran" : "Dibatalkan";
      snapshot.verifiedPaidAmount = null;
      snapshot.receiptAvailable = false;
      snapshot.shippingStatus = "Belum Diserahkan";
      snapshot.trackingNumber = null;
      snapshot.history = snapshot.history.filter((event) => event.title === "Pesanan dibuat");
    }
    if (scenario === "cod")
    {
      snapshot.isCod = true;
      snapshot.paymentStatus = "Menunggu";
      snapshot.verifiedPaidAmount = null;
      snapshot.receiptAvailable = false;
      snapshot.attempt = null;
      snapshot.attempts = [];
      snapshot.history = snapshot.history.filter((event) => event.title !== "Pembayaran terkonfirmasi");
    }
    if (deliveredCases.includes(scenario) || terminalCases.includes(scenario))
    {
      snapshot.orderStatus = terminalCases.includes(scenario) ? "Selesai" : "Terkirim";
      snapshot.shippingStatus = "Terkirim";
      snapshot.deliveredAt = new Date(now - 2 * 3600000).toISOString();
      snapshot.complaintDeadline = new Date(Date.parse(snapshot.deliveredAt) + 24 * 3600000).toISOString();
      snapshot.history.unshift({ title: "Paket tercatat diterima", at: snapshot.deliveredAt, detail: "Jendela komplain dimulai dari status Terkirim." });
      if (scenario === "closedWindow")
      {
        snapshot.deliveredAt = new Date(Date.parse(snapshot.deliveredAt) - 24 * 3600000).toISOString();
        snapshot.complaintDeadline = new Date(Date.parse(snapshot.complaintDeadline) - 24 * 3600000).toISOString();
        snapshot.createdAt = new Date(Date.parse(snapshot.createdAt) - 24 * 3600000).toISOString();
        snapshot.history.forEach((event) =>
        {
          event.at = new Date(Date.parse(event.at) - 24 * 3600000).toISOString();
        });
      }
    }
    if (["cancelPending", "cancelRejected"].includes(scenario))
    {
      snapshot.orderStatus = "Sedang Disiapkan";
      snapshot.shippingStatus = "Belum Diserahkan";
      snapshot.trackingNumber = null;
      snapshot.cancellationRequest = { status: scenario === "cancelPending" ? "Diajukan" : "Ditolak", reason: "Jadwal penerima berubah.", decision: scenario === "cancelRejected" ? "Paket telah dikemas. Pesanan dilanjutkan sesuai jadwal." : null };
    }
    if (["complaint", "complaintRejected", "appeal", "appealClosed", "resolved"].includes(scenario))
    {
      snapshot.complaint = {
        status: scenario === "complaint" ? "Dalam Tinjauan" : (scenario === "appeal" ? "Dieskalasi" : (scenario === "resolved" ? "Selesai" : "Ditolak")),
        category: "Tidak diterima", description: "Penerima belum menemukan paket pada lokasi pengiriman.",
        photos: [], appealUsed: ["appeal", "appealClosed"].includes(scenario),
        appealDeadline: new Date(now + 20 * 3600000).toISOString(),
        decision: scenario === "complaint" ? null : (scenario === "resolved" ? "Refund sebagian telah diselesaikan sesuai keputusan." : "Bukti pengiriman telah ditinjau. Anda dapat membaca alasan keputusan dan mengajukan banding jika masih tersedia.")
      };
    }
    if (["refund", "refundFailed", "fullRefund", "resolved"].includes(scenario))
    {
      const successful = ["resolved", "fullRefund"].includes(scenario);
      snapshot.orderStatus = scenario === "resolved" ? "Selesai" : "Dibatalkan";
      snapshot.paymentStatus = successful ? (scenario === "resolved" ? "Dikembalikan Sebagian" : "Dikembalikan Penuh") : (scenario === "refund" ? "Refund Diproses" : "Berhasil");
      snapshot.refunds = [{ amount: scenario === "resolved" ? 75000 : snapshot.totalAmount, status: successful ? "Berhasil" : (scenario === "refund" ? "Diproses" : "Gagal"), reason: "Penyelesaian pesanan contoh", approvedAt: new Date(now - 3600000).toISOString() }];
    }
    const cases = { stockIssue: "PH-01", late: "PH-02", review: "PH-03", deliveryIssue: "PH-04", lost: "PH-05", physicalStock: "PH-06", intercept: "PH-07" };
    if (cases[scenario])
    {
      snapshot.orderStatus = "Perlu Penanganan";
      snapshot.handling = { code: cases[scenario], description: "Toko sedang meninjau kendala pesanan. Ikuti keputusan dan pilihan penyelesaian yang diinformasikan toko; penggantian atau refund belum dipastikan." };
      snapshot.shippingStatus = ["deliveryIssue", "lost", "intercept"].includes(scenario) ? "Terkendala" : "Belum Diserahkan";
      if (snapshot.shippingStatus === "Belum Diserahkan")
      {
        snapshot.trackingNumber = null;
      }
    }
    if (scenario === "review")
    {
      snapshot.paymentStatus = "Perlu Ditinjau";
      snapshot.verifiedPaidAmount = 380000;
      snapshot.receiptAvailable = false;
      snapshot.attempt.status = "Perlu Ditinjau";
      snapshot.attempts[0].status = "Perlu Ditinjau";
      snapshot.history = snapshot.history.filter((event) => event.title !== "Pembayaran terkonfirmasi");
    }
    if (scenario === "returned")
    {
      snapshot.orderStatus = "Perlu Penanganan";
      snapshot.shippingStatus = "Dikembalikan";
      snapshot.handling = { code: "PH-04", description: "Paket dikembalikan ke toko. Kondisi barang dan penyebab kegagalan pengiriman perlu diperiksa sebelum keputusan refund." };
    }
    if (scenario === "dispute")
    {
      snapshot.paymentStatus = "Sengketa";
    }
    if (scenario === "partial")
    {
      snapshot.recipient = null;
      snapshot.deliverySlot = null;
      snapshot.note = null;
    }
    if (scenario === "emptyHistory")
    {
      snapshot.history = [];
    }
    if (scenario === "imageError")
    {
      snapshot.items[0].image = "../../assets/images/products/not-available.jpg";
    }
    if (["perishable", "long"].includes(scenario))
    {
      snapshot.hasPerishable = true;
      snapshot.items[0].name = "Buket Kustom";
      snapshot.items[0].variant = "Tema sage, pembungkus krem";
      snapshot.items[0].unit = "buket";
      snapshot.items[0].image = null;
      snapshot.items[0].configuration = "Buket kustom • tema sage • pembungkus krem • pita hijau";
      snapshot.greeting = "Semoga hari-harimu penuh warna dan kebahagiaan. Dari Pengirim Contoh.";
    }
    if (scenario === "long")
    {
      snapshot.items[0].name = "Buket kustom dengan konfigurasi bunga, pembungkus, kartu dan pilihan label yang sangat panjang untuk pemeriksaan keterbacaan";
      snapshot.items[0].amount = 999999999;
      snapshot.subtotalAmount = 1000074999;
      snapshot.totalAmount = 1000099999;
      snapshot.verifiedPaidAmount = snapshot.totalAmount;
    }
    snapshot.archived = scenario === "archived";
    if (snapshot.shippingStatus === "Belum Diserahkan")
    {
      snapshot.history = snapshot.history.filter((event) => event.title !== "Diserahkan ke kurir");
    }
    if (["Siap Diproses", "Menunggu Pembayaran"].includes(snapshot.orderStatus)
      || ["PH-01", "PH-02", "PH-03"].includes(snapshot.handling?.code))
    {
      snapshot.history = snapshot.history.filter((event) => event.title !== "Pesanan disiapkan");
    }
    if (scenario === "invalid")
    {
      snapshot.totalAmount = -1;
    }
    if (scenario === "unknown")
    {
      snapshot.orderStatus = "STATUS_BARU";
    }
    snapshot.history.sort((first, second) => Date.parse(second.at) - Date.parse(first.at));
    return snapshot;
  }

  function createAdapter()
  {
    const query = new URLSearchParams(window.location.search);
    const linkedOrderId = query.get("orderId");
    const repository = linkedOrderId ? window.RylvaOrdersPreviewRepository : null;
    const fromPayment = query.has("paymentState");
    const requestedScenario = query.get("state") || "shipping";
    const scenario = Object.hasOwn(scenarioLabels, requestedScenario) ? requestedScenario : "notFound";
    const paymentScenario = fromPayment ? query.get("paymentState") : (scenario === "pending" ? "pending" : "paid");
    const paymentAdapter = window.RylvaPaymentPreview.createAdapter({ scenario: paymentScenario });
    const storageKey = "rylva-order-detail-preview-v1:" + scenario;
    let snapshot = null;
    let readCount = 0;
    let actionError = query.get("actionError");

    function persist()
    {
      if (repository)
      {
        repository.save(snapshot);
        return;
      }
      try
      {
        if (fromPayment || snapshot?.paymentLinked)
        {
          paymentAdapter.updatePreviewOrder(snapshot);
        }
        else
        {
          window.sessionStorage.setItem(storageKey, JSON.stringify(snapshot));
        }
      }
      catch
      {
        // Optional storage only contains synthetic fixture data.
      }
    }

    return {
      isPreview: true,
      scenario,
      async getSnapshot()
      {
        if (window.RylvaCustomerPreviewAccess?.isSignedOut())
        {
          throw fail("login", "Masuk kembali untuk membuka detail pesanan.");
        }
        readCount += 1;
        if (scenario === "loading" && !fromPayment)
        {
          return new Promise(() => {});
        }
        await wait();
        if (repository)
        {
          snapshot = repository.read(linkedOrderId);
        }
        const errors = ["maintenance", "service", "rateLimit", "login", "session", "denied", "verification", "notFound", "unavailable"];
        if (!fromPayment && (errors.includes(scenario) || (scenario === "loadError" && readCount === 1)))
        {
          throw fail(scenario, "Pesanan belum dapat dimuat.");
        }
        if (!snapshot)
        {
          const base = fromPayment
            ? await paymentAdapter.getSnapshot()
            : window.RylvaPaymentPreview.createSnapshot(paymentScenario, Date.now());
          if (fromPayment)
          {
            snapshot = base.recipient !== undefined ? base : enhance(base);
          }
          else
          {
            try
            {
              snapshot = JSON.parse(window.sessionStorage.getItem(storageKey));
            }
            catch
            {
              snapshot = null;
            }
            snapshot ||= createFixture(base, scenario);
          }
        }
        snapshot.serverNow = new Date().toISOString();
        snapshot.snapshotAt = snapshot.serverNow;
        snapshot.allowedActions = { ...snapshot.allowedActions, ...rights(snapshot) };
        persist();
        return clone(snapshot);
      },
      async perform(action, payload, expectedVersion)
      {
        await wait();
        if (repository)
        {
          snapshot = repository.read(linkedOrderId);
        }
        if (actionError)
        {
          const code = actionError;
          actionError = null;
          if (code === "conflict")
          {
            snapshot.orderStatus = "Selesai";
            snapshot.version += 1;
            persist();
          }
          throw fail(code, "Permintaan belum selesai.");
        }
        if (expectedVersion !== snapshot.version || !rights(snapshot)[action])
        {
          throw fail("conflict", "Tindakan tidak lagi tersedia. Perbarui status pesanan.");
        }
        if (["cancel", "requestCancel", "appeal"].includes(action) && !payload.reason?.trim())
        {
          throw fail("validation", "Alasan wajib diisi.");
        }
        if (action === "complain")
        {
          if (!categories.includes(payload.category) || !payload.description?.trim()
            || (payload.category !== "Tidak diterima" && payload.photos.length < 2))
          {
            throw fail("validation", "Periksa kategori, deskripsi dan foto bukti.");
          }
          snapshot.complaint = {
            status: "Diajukan", category: payload.category, description: payload.description,
            photos: payload.photos.map((file) => ({ name: file.name, size: file.size, type: file.type })),
            appealUsed: false
          };
        }
        if (action === "cancel")
        {
          snapshot.orderStatus = "Dibatalkan";
          snapshot.cancellationRequest = { status: "Disetujui", reason: payload.reason, decision: "Pembatalan sebelum persiapan disetujui." };
          snapshot.allowedActions = {};
          if (snapshot.paymentStatus === "Berhasil")
          {
            snapshot.paymentStatus = "Refund Diproses";
            snapshot.refunds = [{ amount: snapshot.verifiedPaidAmount, status: "Diproses", reason: "Pembatalan sebelum persiapan", approvedAt: new Date().toISOString() }];
          }
          else
          {
            snapshot.paymentStatus = "Dibatalkan";
            if (snapshot.attempt)
            {
              snapshot.attempt.status = "Dibatalkan";
            }
            snapshot.attempts.forEach((attempt) =>
            {
              if (attempt.status === "Menunggu")
              {
                attempt.status = "Dibatalkan";
              }
            });
          }
        }
        if (action === "requestCancel")
        {
          snapshot.cancellationRequest = { status: "Diajukan", reason: payload.reason, decision: null };
          if (snapshot.orderStatus === "Dikirim")
          {
            snapshot.orderStatus = "Perlu Penanganan";
            snapshot.handling = { code: "PH-07", description: "Permintaan penghentian pengiriman diteruskan ke toko. Penghentian belum dapat dijamin." };
          }
        }
        if (action === "confirmReceipt")
        {
          snapshot.orderStatus = "Selesai";
          snapshot.shippingStatus = "Terkirim";
        }
        if (action === "appeal")
        {
          snapshot.complaint.status = "Dieskalasi";
          snapshot.complaint.appealUsed = true;
          snapshot.complaint.appealReason = payload.reason;
        }
        snapshot.history.unshift({ title: { cancel: "Pesanan dibatalkan", requestCancel: "Pembatalan diajukan", confirmReceipt: "Penerimaan dikonfirmasi", complain: "Komplain diajukan", appeal: "Banding diajukan" }[action], at: new Date().toISOString(), detail: "Perubahan data contoh pada pratinjau." });
        snapshot.version += 1;
        persist();
        return this.getSnapshot();
      },
      async getReceipt()
      {
        await wait();
        if (scenario === "receiptError" || !snapshot.receiptAvailable)
        {
          throw fail("document", "Bukti pelunasan belum dapat dimuat. Coba lagi tanpa mengulangi pembayaran.");
        }
        return clone(snapshot);
      },
      paymentUrl()
      {
        if (repository)
        {
          return window.RylvaOrderNavigation.destination("payment.html", linkedOrderId);
        }
        snapshot.paymentLinked = true;
        paymentAdapter.updatePreviewOrder(snapshot);
        persist();
        return "payment.html?state=" + encodeURIComponent(paymentScenario);
      }
    };
  }

  return { createAdapter, createFixture, rights, scenarioLabels, categories };
})();
