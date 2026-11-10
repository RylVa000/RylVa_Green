"use strict";

// Illustrative production inventory. Transactions remain in this browser tab.
const materialSnapshot = "2026-11-04";
const materialLocations = { pusat: "Gudang Pusat", toko: "Etalase Toko" };
const materialCategories =
[
  { id: "flowers", name: "Bunga potong", units: ["batang"] },
  { id: "filler", name: "Filler & daun", units: ["batang"] },
  { id: "wrapping", name: "Pembungkus", units: ["lembar", "rol"] },
  { id: "ribbon", name: "Pita & tali", units: ["meter", "rol"] },
  { id: "foam", name: "Floral foam", units: ["balok", "pcs"] },
  { id: "cards", name: "Kartu ucapan", units: ["lembar", "pcs"] },
  { id: "accessories", name: "Perlengkapan rangkai", units: ["pcs", "rol"] }
];
const materialLedger = [];
const materialAllocations = [];
const materialHistory = [];
const materialApprovals = [];
const materialJobs =
[
  { id: "PRD-DEMO-041", name: "Buket mawar merah", order: "RV-261104-DEMO41" },
  { id: "PRD-DEMO-042", name: "Buket pastel", order: "RV-261104-DEMO42" },
  { id: "PRD-DEMO-043", name: "Rangkaian meja", order: "RV-261104-DEMO43" }
];

function materialFixture(id, name, code, category, unit, minimum, options = {})
{
  return {
    id,
    name,
    code,
    category,
    unit,
    minimum,
    active: true,
    batchTracked: false,
    storage: "Simpan di tempat bersih sesuai kebutuhan bahan.",
    notes: "",
    packaging: [],
    batches: [],
    ...options
  };
}

const productionMaterials =
[
  materialFixture("rose", "Mawar merah", "BH-MWR-MRH", "flowers", "batang", 10,
  {
    batchTracked: true,
    storage: "Jaga hidrasi dan suhu penyimpanan sesuai kondisi bunga.",
    packaging: [{ name: "ikat", factor: 10 }],
    batches:
    [
      { id: "MWR-0411", received: "2026-11-04", expires: "2026-11-07" },
      { id: "MWR-0111", received: "2026-11-01", expires: "2026-11-03" }
    ]
  }),
  materialFixture("tulip", "Tulip merah muda", "BH-TLP-PNK", "flowers", "batang", 8,
  {
    batchTracked: true,
    packaging: [{ name: "ikat", factor: 10 }],
    batches: [{ id: "TLP-0311", received: "2026-11-03", expires: "2026-11-05" }]
  }),
  materialFixture("baby", "Baby's breath putih", "BH-BBY-PTH", "filler", "batang", 10,
  {
    batchTracked: true,
    packaging: [{ name: "ikat", factor: 5 }],
    batches: [{ id: "BBY-0311", received: "2026-11-03", expires: "2026-11-06" }]
  }),
  materialFixture("eucalyptus", "Daun eucalyptus", "BH-EUC-HJA", "filler", "batang", 5,
  {
    batchTracked: true,
    batches: [{ id: "EUC-0211", received: "2026-11-02", expires: "2026-11-06" }]
  }),
  materialFixture("wrap", "Wrapping matte ivory", "BH-WRP-IVR", "wrapping", "lembar", 10,
  {
    packaging: [{ name: "pak", factor: 20 }]
  }),
  materialFixture("ribbon", "Pita satin sage 2 cm", "BH-PIT-SGE", "ribbon", "meter", 5,
  {
    packaging: [{ name: "rol", factor: 25 }]
  }),
  materialFixture("foam", "Floral foam basah", "BH-FOM-BSH", "foam", "balok", 3),
  materialFixture("card", "Kartu ucapan polos", "BH-KRT-PLS", "cards", "lembar", 10,
  {
    packaging: [{ name: "pak", factor: 25 }]
  }),
  materialFixture("wire", "Kawat bunga hijau", "BH-KWT-HJA", "accessories", "pcs", 10),
  materialFixture("oldWrap", "Wrapping motif lama", "BH-WRP-LMA", "wrapping", "lembar", 5,
  {
    active: false,
    notes: "Bahan contoh nonaktif tanpa riwayat atau saldo."
  })
];

function materialOpening(materialId, locationId, quantity, batchId = "")
{
  const material = productionMaterials.find((entry) => entry.id === materialId);
  const factor = material.unit === "meter" ? 100 : 1;
  materialLedger.push(
  {
    id: `opening-${materialId}-${locationId}-${batchId || "base"}`,
    materialId,
    locationId,
    units: Math.round(quantity * factor),
    batchId,
    type: "opening",
    reference: "DEMO-SALDO-AWAL",
    reason: "Saldo ilustrasi untuk mencoba prototipe.",
    actor: "Sistem contoh",
    at: "2026-11-04T08:00:00+07:00"
  });
}

materialOpening("rose", "pusat", 30, "MWR-0411");
materialOpening("rose", "pusat", 4, "MWR-0111");
materialOpening("rose", "toko", 8, "MWR-0411");
materialOpening("tulip", "pusat", 6, "TLP-0311");
materialOpening("baby", "pusat", 16, "BBY-0311");
materialOpening("eucalyptus", "pusat", 0, "EUC-0211");
materialOpening("wrap", "pusat", 40);
materialOpening("wrap", "toko", 12);
materialOpening("ribbon", "pusat", 12.5);
materialOpening("ribbon", "toko", 3.25);
materialOpening("foam", "pusat", 2);
materialOpening("card", "pusat", 50);
materialOpening("wire", "pusat", 18);

for (const [id, materialId, jobId, quantity, batchId] of
[
  ["alloc-rose", "rose", "PRD-DEMO-041", 12, "MWR-0411"],
  ["alloc-baby", "baby", "PRD-DEMO-041", 6, "BBY-0311"],
  ["alloc-wrap", "wrap", "PRD-DEMO-041", 3, ""],
  ["alloc-ribbon", "ribbon", "PRD-DEMO-041", 1.5, ""]
])
{
  materialAllocations.push(
  {
    id,
    materialId,
    jobId,
    locationId: "pusat",
    batchId,
    units: Math.round(quantity * (materialId === "ribbon" ? 100 : 1)),
    consumed: 0,
    released: 0,
    actor: "Admin Dian",
    at: "2026-11-04T09:00:00+07:00"
  });
}

materialApprovals.push(
{
  id: "approval-demo-01",
  materialId: "wrap",
  locationId: "pusat",
  batchId: "",
  units: 25,
  reference: "DEMO-OPNAME-0411",
  reason: "Selisih hitung fisik pada penerimaan contoh sebelumnya.",
  actor: "Admin Dian",
  status: "pending",
  at: "2026-11-04T09:15:00+07:00"
});
