"use strict";

const customerSnapshot = "2026-11-04T10:00:00+07:00";
const customerStatusLabels =
{
  active: "Aktif",
  unverified: "Belum Terverifikasi",
  suspended: "Ditangguhkan",
  inactive: "Dinonaktifkan",
  anonymized: "Dianonimkan"
};

// All identities, addresses, and contacts below are illustrative fixtures.
const customers =
[
  {
    id: "PLG-0001",
    name: "Raka Pratama",
    status: "active",
    joined: "2026-10-08",
    phone: "0812-0000-0101",
    email: "raka@pelanggan.test",
    city: "Jakarta Selatan"
  },
  {
    id: "PLG-0002",
    name: "Nadia Putri",
    status: "active",
    joined: "2026-11-01",
    phone: "0812-0000-0102",
    email: "nadia@pelanggan.test",
    city: "Depok"
  },
  {
    id: "PLG-0003",
    name: "Livia Amanda",
    status: "active",
    joined: "2026-09-15",
    phone: "0812-0000-0103",
    email: "livia@pelanggan.test",
    city: "Tangerang Selatan"
  },
  {
    id: "PLG-0004",
    name: "Andi Wijaya",
    status: "active",
    joined: "2026-11-02",
    phone: "0812-0000-0104",
    email: "andi@pelanggan.test",
    city: "Jakarta Barat"
  },
  {
    id: "PLG-0005",
    name: "Dimas Prakoso",
    status: "active",
    joined: "2026-08-12",
    phone: "0812-0000-0105",
    email: "dimas@pelanggan.test",
    city: "Bekasi"
  },
  {
    id: "PLG-0006",
    name: "Sinta Larasati",
    status: "active",
    joined: "2026-10-26",
    phone: "0812-0000-0106",
    email: "sinta@pelanggan.test",
    city: "Jakarta Selatan"
  },
  {
    id: "PLG-0007",
    name: "Hana Maharani",
    status: "unverified",
    joined: "2026-11-04",
    phone: "",
    email: "hana@pelanggan.test",
    city: ""
  },
  {
    id: "PLG-0008",
    name: "Yuni Wulandari",
    status: "inactive",
    joined: "2025-06-21",
    phone: "0812-0000-0108",
    email: "yuni@pelanggan.test",
    city: "Bogor",
    deletionRequested: true
  },
  {
    id: "PLG-0009",
    name: "Pelanggan dianonimkan",
    status: "anonymized",
    joined: "2024-04-10",
    phone: "",
    email: "",
    city: ""
  }
];

const customerOrders =
[
  {
    id: "RV-261103-C3F8R6",
    customerId: "PLG-0001",
    date: "2026-11-03",
    item: "Monstera deliciosa + 1 item",
    total: 193999,
    paid: 0,
    refund: 0,
    order: "Siap Diproses",
    payment: "Menunggu",
    shipping: "Belum Diserahkan",
    method: "COD / UNPAID",
    active: true
  },
  {
    id: "RV-261103-A7K9M2",
    customerId: "PLG-0002",
    date: "2026-11-03",
    item: "Buket mawar pastel",
    total: 250000,
    paid: 250000,
    refund: 0,
    order: "Siap Diproses",
    payment: "Berhasil",
    shipping: "Belum Diserahkan",
    method: "Online",
    active: true
  },
  {
    id: "RV-261103-R7C5G9",
    customerId: "PLG-0003",
    date: "2026-11-03",
    item: "Peace lily",
    total: 169000,
    paid: 169000,
    refund: 0,
    order: "Perlu Penanganan",
    payment: "Berhasil",
    shipping: "Belum Diserahkan",
    method: "Online",
    active: true
  },
  {
    id: "RV-261103-T8D4H6",
    customerId: "PLG-0004",
    date: "2026-11-03",
    item: "Sukulen mix",
    total: 149000,
    paid: 0,
    refund: 0,
    order: "Perlu Penanganan",
    payment: "Perlu Ditinjau",
    shipping: "Belum Diserahkan",
    method: "Online",
    active: true
  },
  {
    id: "RV-261102-P3J7W9",
    customerId: "PLG-0005",
    date: "2026-11-02",
    item: "Pot keramik sage",
    total: 99000,
    paid: 99000,
    refund: 0,
    order: "Selesai",
    payment: "Berhasil",
    shipping: "Terkirim",
    method: "Online",
    active: false
  },
  {
    id: "RV-261103-K9B3S7",
    customerId: "PLG-0006",
    date: "2026-11-03",
    item: "Buket garden rose",
    total: 300000,
    paid: 300000,
    refund: 0,
    order: "Sedang Disiapkan",
    payment: "Berhasil",
    shipping: "Belum Diserahkan",
    method: "Online",
    active: true
  }
];

const customerCases =
[
  {
    id: "PH-06",
    customerId: "PLG-0003",
    orderId: "RV-261103-R7C5G9",
    title: "Stok fisik tidak sesuai",
    description: "Peace lily ditemukan rusak. Periksa solusi pemenuhan pada detail pesanan.",
    owner: "Admin RylVa",
    open: true
  },
  {
    id: "PH-03",
    customerId: "PLG-0004",
    orderId: "RV-261103-T8D4H6",
    title: "Pembayaran perlu dicocokkan",
    description: "Nominal pembayaran belum cocok. Keputusan rekonsiliasi memerlukan SuperAdmin.",
    owner: "SuperAdmin RylVa",
    open: true
  }
];

const customerNotes =
[
  {
    id: "CT-001",
    customerId: "PLG-0002",
    text: "Periksa kembali nama penerima dan pesan kartu sebelum buket dikemas.",
    followup: true,
    resolved: false,
    actor: "Admin RylVa",
    at: "2026-11-04T08:30:00+07:00"
  },
  {
    id: "CT-002",
    customerId: "PLG-0003",
    text: "Masalah stok sudah diteruskan ke tim pemenuhan. Lanjutkan penanganan di pesanan terkait.",
    followup: false,
    resolved: false,
    actor: "Admin Dian",
    at: "2026-11-03T10:00:00+07:00"
  }
];

const customerAddresses = customers
  .filter((customer) => customer.phone)
  .map((customer) =>
  {
    return {
      id: `AL-${customer.id}`,
      customerId: customer.id,
      label: "Rumah",
      recipient: customer.name,
      phone: customer.phone,
      street: "Jl. Taman Contoh No. 12, Blok A",
      city: customer.city,
      postalCode: "12345",
      primary: true,
      instructions: "Konfirmasi penerima sebelum menyerahkan paket."
    };
  });

const customerActivities =
[
  {
    customerId: "PLG-0008",
    label: "Akun dinonaktifkan sementara",
    detail: "Permintaan pelanggan; menunggu peninjauan penghapusan data.",
    actor: "Admin RylVa",
    at: "2026-11-02T09:00:00+07:00"
  },
  {
    customerId: "PLG-0009",
    label: "Akun dianonimkan",
    detail: "Data pribadi dihapus dari profil; referensi transaksi dipertahankan sesuai retensi.",
    actor: "SuperAdmin RylVa",
    at: "2026-10-31T09:00:00+07:00"
  }
];
