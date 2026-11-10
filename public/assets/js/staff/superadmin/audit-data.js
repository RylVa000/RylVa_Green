"use strict";

const auditSnapshot = "2026-11-04T03:20:00Z";
const auditActors =
[
  { id: "admin", name: "Admin RylVa", role: "Admin", type: "Staf" },
  { id: "dian", name: "Admin Dian", role: "Admin", type: "Staf" },
  { id: "superadmin", name: "SuperAdmin RylVa", role: "SuperAdmin", type: "Staf" },
  { id: "system", name: "Sistem", role: "Otomatis", type: "Sistem" },
  { id: "gateway", name: "Gateway contoh", role: "Layanan pembayaran", type: "Gateway" },
  { id: "adminB", name: "Admin Bima", role: "Admin", type: "Staf" }
];
const auditModules =
{
  orders: "Pesanan",
  payments: "Pembayaran",
  products: "Produk & Varian",
  stock: "Stok barang",
  materials: "Bahan Produksi",
  bouquet: "Buket & Produksi",
  customers: "Pelanggan",
  calendar: "Kalender Tutup",
  staff: "Akun staf",
  settings: "Pengaturan Sistem",
  audit: "Audit Log"
};

function auditFixture(id, at, actorId, module, action, title, object, options = {})
{
  return {
    id: `AUD-DEMO-${id}`,
    at: `2026-11-04T${at}:00+07:00`,
    actorId,
    module,
    action,
    title,
    object,
    result: "success",
    sensitive: false,
    account: false,
    ip: ["system", "gateway"].includes(actorId) ? "Tidak berlaku untuk sumber otomatis" : "192.0.2.24",
    reason: "",
    changes: [],
    applied: true,
    ...options
  };
}

const auditSeedEntries =
[
  auditFixture("001", "10:18", "admin", "orders", "status", "Memulai persiapan pesanan",
    { id: "RV-261103-C3F8R6", label: "Pesanan Raka Pratama", route: "../staff/orders-queue.html?tab=all&order=RV-261103-C3F8R6" },
    {
      reason: "Barang dan jadwal telah diperiksa.",
      changes: [{ field: "Status pesanan", before: "Siap Diproses", after: "Sedang Disiapkan" }]
    }),
  auditFixture("002", "10:15", "dian", "products", "price", "Mengubah harga varian",
    { id: "RG-FIC-M16", label: "Ficus elastica, ukuran M", route: "../staff/products.html" },
    {
      reason: "Penyesuaian harga katalog contoh.",
      changes: [{ field: "Harga normal", before: "Rp149.000", after: "Rp159.000" }]
    }),
  auditFixture("003", "10:12", "admin", "stock", "mutation", "Pengurangan stok ditolak",
    { id: "RG-MED-1L", label: "Media tanam serbaguna", route: "../staff/products.html" },
    { result: "failed", applied: false, reason: "Pengurangan 19 pak melebihi stok bebas 18 pak.",
      changes: [{ field: "Saldo stok", before: "18 pak", after: "18 pak" }] }),
  auditFixture("004", "10:08", "superadmin", "payments", "approval", "Menyetujui refund contoh",
    { id: "RV-261103-K9B3S7", label: "Refund pesanan Sinta", route: "../staff/orders-queue.html?tab=all&order=RV-261103-K9B3S7" },
    { sensitive: true, reason: "Bukti dan alasan pengajuan contoh telah diperiksa.", approval: { requester: "Admin Dian", checker: "SuperAdmin RylVa" },
      changes: [
        { field: "Keputusan refund", before: "Diajukan", after: "Disetujui" },
        { field: "Nominal", before: "Rp50.000", after: "Rp50.000" }
      ] }),
  auditFixture("005", "10:05", "admin", "materials", "mutation", "Mencatat penerimaan bahan",
    { id: "BH-MWR-MRH", label: "Mawar merah, Gudang Pusat", route: "../staff/production-materials.html?material=rose" },
    {
      reason: "Penerimaan contoh, dokumen TERIMA-DEMO-04.",
      changes: [{ field: "Saldo bahan layak pakai", before: "20 batang", after: "30 batang" }]
    }),
  auditFixture("006", "10:00", "system", "orders", "status", "Menyelesaikan pesanan otomatis",
    { id: "RV-261103-M2Y6Z8", label: "Pesanan Dewi Kusuma", route: "../staff/orders-queue.html?tab=all&order=RV-261103-M2Y6Z8" },
    {
      reason: "Ilustrasi transisi otomatis setelah syarat penyelesaian terpenuhi.",
      changes: [{ field: "Status pesanan", before: "Terkirim", after: "Selesai" }]
    }),
  auditFixture("007", "09:55", "admin", "bouquet", "production", "Mencatat pemakaian bahan buket",
    { id: "PRD-DEMO-041", label: "Rangkaian mawar", route: "../staff/bouquet-production.html?job=PRD-DEMO-041" },
    {
      reason: "Pemakaian contoh untuk perakitan.",
      changes: [{ field: "Pita satin, saldo fisik", before: "12,5 meter", after: "11 meter" }]
    }),
  auditFixture("008", "09:50", "superadmin", "settings", "parameter", "Mengubah ambang stok rendah",
    { id: "P-22", label: "Parameter stok rendah", route: "" },
    {
      sensitive: true,
      reason: "Ilustrasi perubahan parameter, bukan perubahan baseline aktif.",
      changes: [{ field: "Ambang per SKU", before: "5 unit", after: "8 unit" }]
    }),
  auditFixture("009", "09:45", "admin", "customers", "access", "Membuka data operasional pelanggan",
    { id: "PLG-0004", label: "Profil pelanggan contoh", route: "../staff/customers.html?customer=PLG-0004" },
    { reason: "Pemeriksaan kontak untuk pemenuhan pesanan.", applied: false }),
  auditFixture("010", "09:40", "gateway", "payments", "status", "Mencatat hasil pembayaran gagal",
    {
      id: "RV-261103-D8V2X6",
      label: "Peristiwa pembayaran contoh",
      route: "../staff/orders-queue.html?tab=all&order=RV-261103-D8V2X6"
    },
    {
      reason: "Pencatatan peristiwa berhasil; hasil pembayaran dari layanan adalah Gagal.",
      changes: [{ field: "Status pembayaran", before: "Menunggu", after: "Gagal" }]
    }),
  auditFixture("011", "09:30", "adminB", "staff", "login", "Login staf ditolak",
    { id: "STAF-DEMO-B", label: "Akun staf contoh", route: "" },
    {
      result: "failed",
      account: true,
      applied: false,
      reason: "Verifikasi login tidak terpenuhi; rahasia autentikasi tidak dicatat."
    }),
  auditFixture("012", "09:20", "admin", "calendar", "calendar", "Menandai tanggal tutup",
    { id: "2026-11-08", label: "Tanggal tutup 8 November", route: "../staff/closure-calendar.html?date=2026-11-08" },
    { reason: "Pemeliharaan area kerja contoh.", changes: [{ field: "Status tanggal", before: "Buka", after: "Tutup" }] }),
  auditFixture("013", "09:10", "superadmin", "staff", "mfa", "Mereset pendaftaran MFA Admin",
    { id: "STAF-DEMO-D", label: "Akun Admin Dian contoh", route: "" },
    {
      sensitive: true,
      account: true,
      reason: "Ilustrasi reset setelah verifikasi identitas.",
      changes: [{ field: "Pendaftaran MFA", before: "Terdaftar", after: "Perlu daftar ulang" }]
    }),
  auditFixture("014", "09:00", "admin", "staff", "login", "Login staf berhasil",
    { id: "STAF-DEMO-A", label: "Admin RylVa", route: "" },
    { account: true, applied: false, reason: "Sesi staf contoh dibuat setelah pemeriksaan login." }),
  auditFixture("015", "08:55", "superadmin", "customers", "export", "Mengekspor data pelanggan contoh",
    { id: "EKSPOR-DEMO-01", label: "Hasil filter pelanggan", route: "../staff/customers.html" },
    {
      sensitive: true,
      applied: false,
      reason: "Ilustrasi ekspor untuk pemeriksaan operasional; data pribadi tidak disalin ke log."
    }),
  auditFixture("016", "08:50", "dian", "products", "status", "Menonaktifkan produk",
    { id: "PRODUK-DEMO-08", label: "Produk katalog contoh", route: "../staff/products.html" },
    {
      reason: "Produk sementara tidak ditawarkan.",
      changes: [{ field: "Status katalog", before: "Aktif", after: "Nonaktif" }]
    }),
  auditFixture("017", "08:40", "system", "materials", "approval", "Mencatat keputusan penyesuaian stok",
    { id: "BH-WRP-IVR", label: "Wrapping matte ivory", route: "../staff/production-materials.html?material=wrap" },
    { sensitive: true, reason: "Ilustrasi pencatatan keputusan yang telah disetujui.", approval: { requester: "Admin Bima", checker: "SuperAdmin RylVa" },
      changes: [{ field: "Saldo bahan", before: "40 lembar", after: "42 lembar" }] })
];

function freezeAuditValue(value)
{
  if (value && typeof value === "object")
  {
    Object.values(value).forEach(freezeAuditValue);
    Object.freeze(value);
  }
  return value;
}

freezeAuditValue(auditSeedEntries);
freezeAuditValue(auditActors);
freezeAuditValue(auditModules);
