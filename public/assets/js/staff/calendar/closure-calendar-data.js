"use strict";

// Fixtures mirror the existing order queue; no live order integration is implied.
const closureSnapshot = "2026-11-03";
const closureDates =
[
  {
    date: "2026-11-04",
    reason: "Pemeliharaan toko",
    actor: "Admin RylVa",
    changedAt: "2026-11-02T09:30:00+07:00"
  },
  {
    date: "2026-11-10",
    reason: "Libur operasional",
    actor: "SuperAdmin RylVa",
    changedAt: "2026-11-01T10:00:00+07:00"
  }
];

const closureOrders =
[
  {
    id: "RV-261103-A7K9M2",
    customer: "Nadia Putri",
    date: "2026-11-03",
    slot: "Pagi, 08.00–12.00",
    status: "Siap Diproses",
    payment: "Berhasil",
    shipping: "Belum Diserahkan"
  },
  {
    id: "RV-261103-C3F8R6",
    customer: "Raka Pratama",
    date: "2026-11-03",
    slot: "Siang, 12.00–16.00",
    status: "Siap Diproses",
    payment: "Menunggu / COD",
    shipping: "Belum Diserahkan"
  },
  {
    id: "RV-261103-K9B3S7",
    customer: "Sinta Larasati",
    date: "2026-11-03",
    slot: "Pagi, 08.00–12.00",
    status: "Sedang Disiapkan",
    payment: "Berhasil",
    shipping: "Belum Diserahkan"
  },
  {
    id: "RV-261103-R7C5G9",
    customer: "Livia Amanda",
    date: "2026-11-03",
    slot: "Siang, 12.00–16.00",
    status: "Perlu Penanganan",
    payment: "Berhasil",
    shipping: "Belum Diserahkan"
  },
  {
    id: "RV-261103-J5N7P3",
    customer: "Wulan Maharani",
    date: "2026-11-04",
    slot: "Pagi, 08.00–12.00",
    status: "Siap Diproses",
    payment: "Berhasil",
    shipping: "Belum Diserahkan"
  },
  {
    id: "RV-261103-D8V2X6",
    customer: "Jaya Saputra",
    date: "2026-11-04",
    slot: "Siang, 12.00–16.00",
    status: "Siap Diproses",
    payment: "Menunggu / COD",
    shipping: "Belum Diserahkan"
  }
];

const closureHistory =
[
  {
    date: "2026-11-04",
    action: "Tanggal ditandai tutup",
    reason: "Pemeliharaan toko",
    actor: "Admin RylVa",
    at: "2026-11-02T09:30:00+07:00"
  },
  {
    date: "2026-11-10",
    action: "Tanggal ditandai tutup",
    reason: "Libur operasional",
    actor: "SuperAdmin RylVa",
    at: "2026-11-01T10:00:00+07:00"
  }
];
