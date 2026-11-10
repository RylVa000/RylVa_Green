"use strict";

(() =>
{
  const history = (title) => [
    { title, reason: "Data awal untuk pratinjau lokal.", actor: "Sistem contoh", at: "2026-11-10T08:00:00+07:00" }
  ];
  const makeCase = (values) =>
  {
    return {
      id: "", orderId: "", title: "", amount: 250000, currency: "IDR", paymentStatus: "review",
      status: "review", priority: "normal", version: 1, reference: "", gatewayAmount: 250000,
      gatewayCurrency: "IDR", gatewayStatus: "success", gatewayOrder: "", scenario: "match",
      lastCheck: "", requestId: "", createdAt: "2026-11-10T08:00:00+07:00", checks: [],
      history: history("Kasus rekonsiliasi dibuat"), ...values
    };
  };
  const makeRequest = (values) =>
  {
    return {
      id: "", type: "refund", title: "", makerId: "admin-01", makerName: "Nadia Putri",
      status: "pending", priority: "normal", reason: "Memerlukan keputusan sesuai kewenangan.",
      amount: 650000, remaining: 750000, caseId: "", caseVersion: 1, stockId: "", targetVersion: 1,
      delta: 0, unit: "unit", orderId: "", evidence: [], outcome: "Belum diputuskan",
      createdAt: "2026-11-10T08:15:00+07:00", version: 1,
      history: history("Pengajuan diterima"), ...values
    };
  };

  window.superadminReviewFixture =
  {
    schema: 2,
    orderStatusLabels:
    {
      ready: "Siap diproses",
      preparing: "Sedang disiapkan",
      attention: "Perlu penanganan",
      shipping: "Dikirim",
      delivered: "Terkirim",
      complete: "Selesai",
      cancelled: "Dibatalkan"
    },
    terminalOrders:
    [
      {
        id: "DEMO-COR-001",
        customer: "Pesanan contoh selesai",
        sourceStatus: "complete",
        currentStatus: "complete",
        payment: "Berhasil pada contoh",
        shipping: "Terkirim pada contoh",
        sourceFingerprint: "fixture-complete-1",
        version: 1,
        event:
        {
          id: "DEMO-EVT-001",
          label: "Status Selesai pada snapshot contoh",
          actor: "Sistem contoh",
          at: "2026-11-09T14:30:00+07:00"
        },
        corrections: [],
        synthetic: true
      },
      {
        id: "DEMO-COR-002",
        customer: "Pesanan contoh dibatalkan",
        sourceStatus: "cancelled",
        currentStatus: "cancelled",
        payment: "Menunggu pada contoh",
        shipping: "Belum diserahkan pada contoh",
        sourceFingerprint: "fixture-cancelled-1",
        version: 1,
        event:
        {
          id: "DEMO-EVT-002",
          label: "Status Dibatalkan pada snapshot contoh",
          actor: "Sistem contoh",
          at: "2026-11-09T15:00:00+07:00"
        },
        corrections: [],
        synthetic: true
      }
    ],
    actors:
    [
      { id: "sa-01", name: "SuperAdmin RylVa" },
      { id: "sa-02", name: "SuperAdmin Kedua" }
    ],
    cases:
    [
      makeCase(
      {
        id: "REC-001", title: "Webhook belum tercatat", priority: "urgent",
        orderId: "RV-261103-A7K9M2", gatewayOrder: "RV-261103-A7K9M2", reference: "DEMO-GW-1001"
      }),
      makeCase(
      {
        id: "REC-002", title: "API gateway tidak tersedia", scenario: "unavailable",
        orderId: "RV-261103-F6L8Q4", gatewayOrder: "RV-261103-F6L8Q4", reference: "DEMO-GW-1002",
        amount: 163000, gatewayAmount: 163000
      }),
      makeCase(
      {
        id: "REC-003", title: "Nominal pembayaran berbeda", scenario: "mismatch", priority: "urgent",
        orderId: "RV-261103-H4T6W8", gatewayOrder: "RV-261103-H4T6W8", reference: "DEMO-GW-1003",
        amount: 213000, gatewayAmount: 200000
      }),
      makeCase(
      {
        id: "REC-004", title: "Bukti manual menunggu tinjauan", scenario: "unavailable", lastCheck: "unavailable",
        orderId: "RV-261103-J5N7P3", gatewayOrder: "RV-261103-J5N7P3", reference: "DEMO-GW-1004",
        status: "awaiting", requestId: "APR-004", amount: 169000, gatewayAmount: 169000
      }),
      makeCase(
      {
        id: "REC-005", title: "Pembayaran masih menunggu", scenario: "pending", gatewayStatus: "pending",
        orderId: "RV-261103-T8D4H6", gatewayOrder: "RV-261103-T8D4H6", reference: "DEMO-GW-1005",
        amount: 149000, gatewayAmount: 149000
      }),
      makeCase(
      {
        id: "REC-006", title: "Pemeriksaan contoh selesai", status: "resolved", paymentStatus: "success", lastCheck: "match",
        orderId: "RV-261103-K9B3S7", gatewayOrder: "RV-261103-K9B3S7", reference: "DEMO-GW-1006",
        amount: 300000, gatewayAmount: 300000
      })
    ],
    stocks:
    {
      pot: { name: "Pot terakota", balance: 40, reserved: 5, unit: "pcs", version: 1 },
      rose: { name: "Mawar potong", balance: 40, reserved: 10, unit: "batang", version: 1 }
    },
    refundRights:
    {
      "DEMO-ORDER-RF-001": 750000
    },
    requests:
    [
      makeRequest(
      {
        id: "APR-001", title: "Refund di atas batas Admin", priority: "urgent",
        orderId: "DEMO-ORDER-RF-001",
        reason: "Pengembalian sebagian memerlukan keputusan SuperAdmin.",
        evidence: [{ name: "referensi-refund-contoh", note: "Referensi contoh, bukan bukti transaksi asli." }]
      }),
      makeRequest(
      {
        id: "APR-002", type: "product-stock", title: "Koreksi stok pot terakota", stockId: "pot", delta: 25, unit: "pcs",
        reason: "Selisih penerimaan dicatat untuk pemeriksaan.", makerId: "admin-02", makerName: "Dimas Pratama"
      }),
      makeRequest(
      {
        id: "APR-003", type: "material-stock", title: "Koreksi bahan tidak mencukupi", stockId: "rose", delta: -35, unit: "batang",
        reason: "Contoh pengajuan yang harus ditolak atau diperbaiki karena melewati stok bebas."
      }),
      makeRequest(
      {
        id: "APR-004", type: "reconciliation", title: "Bukti manual pembayaran", caseId: "REC-004", amount: 169000,
        orderId: "RV-261103-J5N7P3",
        makerId: "sa-01", makerName: "SuperAdmin RylVa", reason: "Contoh API tidak dapat dijangkau; perlu peninjauan kedua.",
        evidence: [{ name: "bukti-gateway-contoh.png", note: "Nama lampiran contoh. Tidak ada berkas transaksi asli." }]
      }),
      makeRequest(
      {
        id: "APR-005", title: "Refund contoh telah disetujui", status: "approved", amount: 550000,
        orderId: "DEMO-ORDER-RF-001",
        outcome: "Disetujui pada contoh; pencairan dana belum dijalankan."
      }),
      makeRequest(
      {
        id: "APR-006", type: "product-stock", title: "Pengajuan koreksi ditolak", stockId: "pot", delta: -2, unit: "pcs",
        status: "rejected", outcome: "Ditolak pada contoh; saldo tetap."
      })
    ]
  };
})();
