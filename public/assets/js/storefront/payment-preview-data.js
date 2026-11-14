"use strict";

// Only the explicit static preview loads this adapter. No production API is called.
window.RylvaPaymentPreview = (() =>
{
  const scenarioLabels =
  {
    pending: "Online — QRIS",
    va: "Online — Virtual Account",
    transfer: "Online — transfer bank",
    wallet: "Online — e-wallet",
    cod: "COD — belum lunas",
    paid: "Pembayaran berhasil",
    codPaid: "COD — uang terkonfirmasi",
    failed: "Percobaan gagal",
    cancelled: "Pesanan dibatalkan",
    expired: "Kedaluwarsa terkonfirmasi",
    checking: "Tenggat lewat — diperiksa",
    stockIssue: "PH-01 — masalah stok",
    late: "PH-02 — pembayaran terlambat",
    review: "PH-03 — perlu ditinjau",
    refund: "Refund diproses",
    partialRefund: "Refund sebagian berhasil",
    fullRefund: "Refund penuh berhasil",
    refundFailed: "Refund gagal — tindak lanjut",
    duplicate: "Dua pembayaran berhasil",
    overpaid: "Dana lebih — refund selisih",
    dispute: "Sengketa pembayaran",
    noAttempt: "Instruksi belum dibuat",
    noMethods: "Tidak ada kanal tersedia",
    incomplete: "Instruksi tidak lengkap",
    invalid: "Data tagihan tidak valid",
    partial: "Metadata pendukung kosong",
    qrError: "QR gagal dimuat",
    imageError: "Foto produk gagal dimuat",
    loading: "Loading awal",
    creating: "Menyiapkan instruksi",
    slow: "Hasil permintaan belum pasti",
    cancelling: "Pembatalan sedang diperiksa",
    loadError: "Gagal memuat — dapat dicoba ulang",
    offline: "Offline — snapshot terakhir",
    service: "Layanan bermasalah",
    maintenance: "Pemeliharaan",
    rateLimit: "Batas laju sementara",
    attemptLimit: "Batas lima percobaan",
    login: "Belum masuk akun",
    session: "Sesi berakhir",
    denied: "Akses ditolak",
    verification: "Verifikasi akun diperlukan",
    notFound: "Pesanan tidak ditemukan",
    archived: "Riwayat pesanan — read-only",
    conflict: "Data berubah di tab lain",
    unknown: "Status tidak dikenal",
    receiptError: "Berhasil — dokumen gagal dimuat",
    emailPending: "Berhasil — email belum terkirim",
    long: "Nama panjang dan nominal besar",
    verifiedAfterRefresh: "Konfirmasi saat diperbarui"
  };

  const methods =
  [
    { id: "qris", label: "QRIS", description: "Pindai melalui aplikasi pembayaran" },
    { id: "va", label: "Virtual Account", description: "Bayar menggunakan nomor virtual account" },
    { id: "transfer", label: "Transfer bank", description: "Ikuti instruksi bank yang tersedia" },
    { id: "wallet", label: "E-wallet", description: "Bayar melalui aplikasi e-wallet" }
  ];

  function copy(value)
  {
    return JSON.parse(JSON.stringify(value));
  }

  function wait()
  {
    return new Promise((resolve) =>
    {
      window.setTimeout(resolve, 360);
    });
  }

  function createError(code, message, extra = {})
  {
    return Object.assign(new Error(message), { code }, extra);
  }

  function createSnapshot(scenario, anchorTime)
  {
    const createdAt = new Date(anchorTime).toISOString();
    const expiresAt = new Date(anchorTime + 10 * 60 * 1000).toISOString();
    const snapshot =
    {
      orderId: "preview-payment-order",
      orderNo: "RV-261112-PAY001",
      orderStatus: "Menunggu Pembayaran",
      paymentStatus: "Menunggu",
      isCod: false,
      version: 1,
      currency: "IDR",
      subtotalAmount: 364000,
      shippingAmount: 25000,
      totalAmount: 389000,
      verifiedPaidAmount: null,
      createdAt,
      expiresAt,
      snapshotAt: createdAt,
      serverNow: new Date().toISOString(),
      deliveryDate: "2026-11-14",
      deliverySlot: "08.00–12.00 WIB",
      courierName: "Kurir instan",
      items:
      [
        {
          name: "Monstera Deliciosa",
          variant: "Besar, 70–90 cm",
          unit: "pot",
          quantity: 1,
          amount: 289000,
          image: "../../assets/images/products/plant.jpg"
        },
        {
          name: "Calathea",
          variant: "Kecil",
          unit: "pot",
          quantity: 1,
          amount: 75000,
          image: "../../assets/images/products/succulent.jpg"
        }
      ],
      attempt:
      {
        id: "preview-attempt-1",
        number: 1,
        method: "qris",
        status: "Menunggu",
        paymentCode: null,
        qrImage: "../../assets/images/payment/preview-qr.svg",
        paymentUrl: null,
        createdAt,
        expiresAt
      },
      attempts: [],
      availableMethods: copy(methods),
      allowedActions: { retry: false, changeMethod: true, cancel: true },
      receiptAvailable: false,
      refunds: [],
      uiState: null,
      paidAt: null
    };

    if (["va", "transfer", "wallet"].includes(scenario))
    {
      snapshot.attempt.method = scenario;
      snapshot.attempt.paymentCode = scenario === "wallet" ? null : "VA-CONTOH-001";
    }

    const paidScenarios =
    [
      "paid", "codPaid", "stockIssue", "late", "refund", "partialRefund",
      "fullRefund", "refundFailed", "duplicate", "overpaid", "dispute",
      "archived", "receiptError", "emailPending"
    ];

    if (paidScenarios.includes(scenario))
    {
      snapshot.paymentStatus = "Berhasil";
      snapshot.orderStatus = "Siap Diproses";
      snapshot.verifiedPaidAmount = snapshot.totalAmount;
      snapshot.paidAt = new Date(anchorTime + 60000).toISOString();
      snapshot.attempt.status = "Berhasil";
      snapshot.receiptAvailable = true;
      snapshot.allowedActions = { retry: false, changeMethod: false, cancel: false };
    }

    if (scenario === "cod" || scenario === "codPaid")
    {
      snapshot.isCod = true;
      snapshot.orderStatus = "Siap Diproses";
      snapshot.attempt = null;
      snapshot.allowedActions = { retry: false, changeMethod: false, cancel: false };
      snapshot.expiresAt = null;
    }

    if (["stockIssue", "late", "review"].includes(scenario))
    {
      snapshot.orderStatus = "Perlu Penanganan";
      snapshot.caseCode = { stockIssue: "PH-01", late: "PH-02", review: "PH-03" }[scenario];
      snapshot.allowedActions = { retry: false, changeMethod: false, cancel: false };
    }

    if (scenario === "review")
    {
      snapshot.paymentStatus = "Perlu Ditinjau";
      snapshot.verifiedPaidAmount = 380000;
      snapshot.attempt.status = "Perlu Ditinjau";
    }

    if (["refund", "partialRefund", "fullRefund", "refundFailed", "duplicate", "overpaid"].includes(scenario))
    {
      const isPartial = scenario === "partialRefund";
      const isComplete = isPartial || scenario === "fullRefund";
      snapshot.paymentStatus = isComplete
        ? (isPartial ? "Dikembalikan Sebagian" : "Dikembalikan Penuh")
        : (scenario === "refundFailed" ? "Berhasil" : "Refund Diproses");
      snapshot.refunds =
      [
        {
          amount: isPartial ? 75000 : (scenario === "overpaid" ? 11000 : 389000),
          status: isComplete ? "Berhasil" : (scenario === "refundFailed" ? "Gagal" : "Diproses"),
          reason: scenario === "duplicate"
            ? "Pengembalian pembayaran kedua"
            : (scenario === "overpaid" ? "Pengembalian kelebihan pembayaran" : "Pengembalian dana pesanan")
        }
      ];
      if (["refund", "fullRefund", "refundFailed"].includes(scenario))
      {
        snapshot.orderStatus = "Dibatalkan";
      }
      if (scenario === "overpaid")
      {
        snapshot.verifiedPaidAmount = 400000;
      }
    }

    if (scenario === "duplicate")
    {
      snapshot.attempts.push(
        { method: "va", status: "Berhasil", amount: 389000, createdAt, number: 2 }
      );
    }

    if (["cancelled", "expired"].includes(scenario))
    {
      snapshot.orderStatus = "Dibatalkan";
      snapshot.paymentStatus = scenario === "expired" ? "Kedaluwarsa" : "Dibatalkan";
      snapshot.attempt.status = snapshot.paymentStatus;
      snapshot.allowedActions = { retry: false, changeMethod: false, cancel: false };
    }

    if (scenario === "failed" || scenario === "attemptLimit")
    {
      snapshot.paymentStatus = "Gagal";
      snapshot.attempt.status = "Gagal";
      snapshot.allowedActions.retry = scenario !== "attemptLimit";
      snapshot.allowedActions.changeMethod = scenario !== "attemptLimit";
      snapshot.attempt.number = scenario === "attemptLimit" ? 5 : 1;
    }

    if (scenario === "noAttempt" || scenario === "noMethods")
    {
      snapshot.attempt = null;
      snapshot.allowedActions.retry = scenario === "noAttempt";
      snapshot.availableMethods = scenario === "noMethods" ? [] : copy(methods);
      snapshot.allowedActions.changeMethod = false;
    }

    if (scenario === "incomplete")
    {
      snapshot.attempt.qrImage = null;
    }
    if (scenario === "invalid")
    {
      snapshot.totalAmount = null;
    }
    if (scenario === "partial")
    {
      snapshot.courierName = null;
      snapshot.items[0].variant = null;
      snapshot.items[0].image = null;
    }
    if (scenario === "qrError")
    {
      snapshot.attempt.qrImage = "../../assets/images/payment/missing-qr.svg";
    }
    if (scenario === "imageError")
    {
      snapshot.items[0].image = "../../assets/images/payment/missing-photo.jpg";
    }
    if (scenario === "dispute")
    {
      snapshot.paymentStatus = "Sengketa";
    }
    if (scenario === "archived")
    {
      snapshot.orderStatus = "Selesai";
    }
    if (scenario === "unknown")
    {
      snapshot.paymentStatus = "UNKNOWN_STATUS";
      snapshot.allowedActions = { retry: false, changeMethod: false, cancel: false };
    }
    if (scenario === "long")
    {
      snapshot.items[0].name = "Monstera Deliciosa dengan pilihan pot keramik dan konfigurasi pesanan berlabel sangat panjang";
      snapshot.items[0].variant = "Pot keramik ukuran besar, warna hijau sage, rincian snapshot yang harus tetap terbaca pada layar kecil";
      snapshot.items[0].amount = 999999999;
      snapshot.subtotalAmount = 1000074999;
      snapshot.totalAmount = 1000099999;
    }
    if (["checking", "creating", "slow", "cancelling", "offline", "conflict", "emailPending", "receiptError"].includes(scenario))
    {
      snapshot.uiState = scenario;
    }
    if (scenario === "checking")
    {
      snapshot.expiresAt = new Date(anchorTime - 1000).toISOString();
      snapshot.attempt.expiresAt = snapshot.expiresAt;
    }

    if (snapshot.attempt)
    {
      snapshot.attempts.unshift({ ...copy(snapshot.attempt), amount: snapshot.totalAmount });
    }
    else if (snapshot.isCod && snapshot.paymentStatus === "Berhasil")
    {
      snapshot.attempts.push(
        { method: "cod", status: "Berhasil", amount: snapshot.totalAmount, createdAt: snapshot.paidAt }
      );
    }
    return snapshot;
  }

  function createAdapter(options = {})
  {
    const query = new URLSearchParams(window.location.search);
    const linkedOrderId = options.orderId || query.get("orderId");
    const repository = linkedOrderId ? window.RylvaOrdersPreviewRepository : null;
    const requestedScenario = options.scenario || query.get("state") || "pending";
    const scenario = Object.hasOwn(scenarioLabels, requestedScenario) ? requestedScenario : "notFound";
    const storageKey = "rylva-payment-preview-v1:" + scenario;
    let readCount = 0;
    let mutationError = query.get("actionError");
    let storedSnapshot = null;

    try
    {
      storedSnapshot = JSON.parse(window.sessionStorage.getItem(storageKey));
    }
    catch
    {
      // Storage is optional; the preview still works in restricted browsers.
    }

    let snapshot = storedSnapshot || createSnapshot(scenario, Date.now());

    function persist()
    {
      if (repository)
      {
        repository.save(snapshot);
        return;
      }
      try
      {
        window.sessionStorage.setItem(storageKey, JSON.stringify(snapshot));
      }
      catch
      {
        // No production state or sensitive data is stored by this preview.
      }
    }

    if (!repository)
    {
      persist();
    }

    async function checkMutation()
    {
      await wait();
      if (repository)
      {
        snapshot = repository.read(linkedOrderId);
      }
      if (!mutationError)
      {
        return;
      }

      const errorCode = mutationError;
      mutationError = null;
      if (errorCode === "conflict")
      {
        snapshot = repository
          ? { ...snapshot, orderStatus: "Siap Diproses", paymentStatus: "Berhasil", verifiedPaidAmount: snapshot.totalAmount, version: snapshot.version + 1 }
          : createSnapshot("paid", Date.parse(snapshot.createdAt));
        persist();
      }
      throw createError(errorCode, "Permintaan belum dapat diselesaikan.");
    }

    return {
      isPreview: true,
      scenario,
      updatePreviewOrder(nextSnapshot)
      {
        // Shared synthetic order only; this is never a production mutation.
        snapshot = copy(nextSnapshot);
        persist();
      },
      async getSnapshot()
      {
        if (window.RylvaCustomerPreviewAccess?.isSignedOut())
        {
          throw createError("login", "Masuk kembali untuk membuka pembayaran.");
        }
        readCount += 1;
        if (repository)
        {
          snapshot = repository.read(linkedOrderId);
        }
        if (scenario === "loading")
        {
          return new Promise(() =>
          {
            // Deliberately pending only in the development fixture.
          });
        }
        await wait();
        const errors =
        {
          service: "service",
          maintenance: "maintenance",
          rateLimit: "rateLimit",
          login: "login",
          session: "session",
          denied: "denied",
          verification: "verification",
          notFound: "notFound"
        };
        if (errors[scenario] || (scenario === "loadError" && readCount === 1))
        {
          throw createError(errors[scenario] || "loadError", "Pembayaran belum dapat dimuat.", { retryAfter: 30 });
        }
        if (scenario === "verifiedAfterRefresh" && readCount > 1)
        {
          snapshot = createSnapshot("paid", Date.parse(snapshot.createdAt));
          persist();
        }
        const response = copy(snapshot);
        response.serverNow = new Date().toISOString();
        response.snapshotAt = response.serverNow;
        return response;
      },
      async createAttempt(methodId)
      {
        await checkMutation();
        if (Date.parse(snapshot.expiresAt) <= Date.now())
        {
          throw createError("conflict", "Batas pembayaran perlu diperiksa kembali.");
        }
        if (!snapshot.allowedActions.retry && !snapshot.allowedActions.changeMethod)
        {
          throw createError("conflict", "Tindakan tidak lagi tersedia.");
        }
        if (!methods.some((method) => method.id === methodId))
        {
          throw createError("validation", "Pilih metode yang tersedia.");
        }
        if (snapshot.attempt && snapshot.attempt.number >= 5)
        {
          throw createError("attemptLimit", "Batas percobaan tercapai.");
        }
        if (snapshot.attempt)
        {
          snapshot.attempts[0].status = "Dibatalkan";
        }
        const attemptNumber = snapshot.attempt ? snapshot.attempt.number + 1 : 1;
        snapshot.attempt =
        {
          id: "preview-attempt-" + attemptNumber,
          number: attemptNumber,
          method: methodId,
          status: "Menunggu",
          paymentCode: ["va", "transfer"].includes(methodId) ? "VA-CONTOH-00" + attemptNumber : null,
          qrImage: methodId === "qris" ? "../../assets/images/payment/preview-qr.svg" : null,
          createdAt: new Date().toISOString(),
          expiresAt: snapshot.expiresAt
        };
        snapshot.attempts.unshift({ ...copy(snapshot.attempt), amount: snapshot.totalAmount });
        snapshot.paymentStatus = "Menunggu";
        snapshot.allowedActions.retry = false;
        snapshot.uiState = null;
        snapshot.version += 1;
        persist();
        return this.getSnapshot();
      },
      async cancelOrder()
      {
        await checkMutation();
        if (!snapshot.allowedActions.cancel)
        {
          throw createError("conflict", "Pembatalan tidak lagi tersedia.");
        }
        snapshot.orderStatus = "Dibatalkan";
        snapshot.paymentStatus = "Dibatalkan";
        snapshot.allowedActions = { retry: false, changeMethod: false, cancel: false };
        snapshot.attempts.forEach((attempt) =>
        {
          if (attempt.status === "Menunggu")
          {
            attempt.status = "Dibatalkan";
          }
        });
        snapshot.version += 1;
        persist();
        return this.getSnapshot();
      },
      async getReceipt()
      {
        await wait();
        if (!snapshot.receiptAvailable)
        {
          throw createError("notReady", "Bukti pelunasan belum tersedia.");
        }
        if (scenario === "receiptError")
        {
          throw createError("document", "Bukti pelunasan belum dapat dimuat.");
        }
        return copy(snapshot);
      }
    };
  }

  return { createAdapter, createSnapshot, scenarioLabels };
})();
