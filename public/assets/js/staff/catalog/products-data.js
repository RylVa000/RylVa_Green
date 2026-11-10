"use strict";

// Synthetic, memory-only catalog. No product or inventory service is contacted.
const productSnapshotAt = new Date("2026-11-04T10:20:00+07:00");
const productLocations = { pusat: "Gudang Pusat", toko: "Etalase Toko" };
const productLimits = { lowStock: 5, adjustment: 20, priceChange: 0.5, photos: 8, fileBytes: 5242880 };
const catalogCategories =
[
  { id: "plants", name: "Tanaman hias", active: true },
  { id: "indoor", name: "Tanaman indoor", active: true },
  { id: "flowers", name: "Florist", active: true },
  { id: "pots", name: "Pot & vas", active: true },
  { id: "media", name: "Media tanam", active: true },
  { id: "tools", name: "Alat berkebun", active: true },
  { id: "seeds", name: "Benih", active: true },
  { id: "kits", name: "Paket berkebun", active: true }
];
const catalogLedger = [];
const catalogReservations = [];
const catalogApprovals = [];
const catalogPhotos =
{
  plant: { url: "../../assets/images/products/plant.jpg", name: "ficus-ilustrasi.jpg", alt: "Daun ficus elastica, foto ilustrasi" },
  succulent: { url: "../../assets/images/products/succulent.jpg", name: "sukulen-ilustrasi.jpg", alt: "Sukulen dalam pot, foto ilustrasi" },
  garden: { url: "../../assets/images/products/garden.jpg", name: "berkebun-ilustrasi.jpg", alt: "Media tanam dan peralatan, foto ilustrasi" },
  bouquet: { url: "../../assets/images/products/bouquet.jpg", name: "tulip-ilustrasi.jpg", alt: "Rangkaian tulip merah muda, foto ilustrasi" }
};

function catalogVariant(id, name, sku, price, unit, balances, reserved = 0)
{
  for (const [location, quantity] of Object.entries(balances))
  {
    catalogLedger.push(
    {
      id: `opening-${id}-${location}`,
      variantId: id,
      location,
      quantity,
      type: "Saldo awal",
      reason: "Saldo awal data ilustrasi, bukan transaksi toko.",
      reference: "DEMO-SALDO-AWAL",
      actor: "Sistem contoh",
      at: "2026-11-01T08:00:00+07:00"
    });
  }

  if (reserved > 0)
  {
    // Zero padding belongs to the six-character synthetic order suffix, not a display label.
    catalogReservations.push(
    {
      id: `reservation-${id}`,
      variantId: id,
      location: "pusat",
      quantity: reserved,
      orderId: `RV-261104-DEMO${id.replace(/\D/g, "").padStart(2, "0")}`,
      unitPrice: price,
      status: "active"
    });
  }

  return {
    id,
    name,
    sku,
    price,
    salePrice: 0,
    saleStart: "",
    saleEnd: "",
    unit,
    active: true,
    weight: 500,
    length: 20,
    width: 20,
    height: 30,
    batchTracked: false,
    batches: [],
    components: []
  };
}

function catalogProduct(values)
{
  return {
    status: "active",
    handling: "durable",
    brand: "",
    description: "Deskripsi ilustrasi untuk meninjau pengelolaan katalog.",
    care: "Isi petunjuk perawatan atau penggunaan dari data produk yang telah diverifikasi.",
    shippingNote: "Pengemasan dan layanan mengikuti jenis penanganan.",
    attributes: [],
    stockMode: "independent",
    transactionCount: 0,
    updatedAt: "2026-11-04T09:10:00+07:00",
    history: [],
    ...values
  };
}

const catalogProducts =
[
  catalogProduct(
  {
    id: "ficus",
    name: "Ficus elastica",
    type: "plant",
    categories: ["plants", "indoor"],
    primaryCategory: "plants",
    handling: "perishable",
    description: "Tanaman hias berdaun lebar dalam pot nursery. Ukuran dan tinggi mengikuti varian yang dipilih.",
    photos: [structuredClone(catalogPhotos.plant)],
    attributes: [{ name: "Pot", value: "Nursery" }, { name: "Warna daun", value: "Hijau" }],
    transactionCount: 12,
    variants:
    [
      catalogVariant("v1", "Ukuran S, pot 12 cm", "RG-FIC-S12", 95000, "pot", { pusat: 18, toko: 4 }, 2),
      catalogVariant("v2", "Ukuran M, pot 16 cm", "RG-FIC-M16", 149000, "pot", { pusat: 6, toko: 2 }, 3),
      catalogVariant("v3", "Ukuran L, pot 20 cm", "RG-FIC-L20", 225000, "pot", { pusat: 0, toko: 1 })
    ]
  }),
  catalogProduct(
  {
    id: "succulent",
    name: "Sukulen zebra",
    type: "plant",
    categories: ["plants", "indoor"],
    primaryCategory: "plants",
    photos: [structuredClone(catalogPhotos.succulent)],
    attributes: [{ name: "Jenis pot", value: "Keramik" }],
    transactionCount: 8,
    variants:
    [
      catalogVariant("v4", "Pot mint, 8 cm", "RG-SUK-M08", 65000, "pot", { pusat: 24, toko: 5 }, 1),
      catalogVariant("v5", "Pot putih, 10 cm", "RG-SUK-P10", 85000, "pot", { pusat: 4, toko: 0 })
    ]
  }),
  catalogProduct(
  {
    id: "media",
    name: "Media tanam serbaguna",
    type: "media",
    categories: ["media"],
    primaryCategory: "media",
    photos: [structuredClone(catalogPhotos.garden)],
    attributes: [{ name: "Komposisi", value: "Lengkapi dari label pemasok" }],
    transactionCount: 17,
    variants:
    [
      catalogVariant("v6", "Kemasan 1 liter", "RG-MED-1L", 18000, "pak", { pusat: 32, toko: 8 }),
      catalogVariant("v7", "Kemasan 5 liter", "RG-MED-5L", 65000, "pak", { pusat: 5, toko: 0 }, 1)
    ]
  }),
  catalogProduct(
  {
    id: "tulip",
    name: "Rangkaian tulip merah muda",
    type: "florist",
    categories: ["flowers"],
    primaryCategory: "flowers",
    handling: "perishable",
    photos: [structuredClone(catalogPhotos.bouquet)],
    description: "Rangkaian bunga siap jual. Persediaan ini terpisah dari bunga potong untuk produksi buket kustom.",
    attributes: [{ name: "Kartu ucapan", value: "Tersedia" }],
    transactionCount: 5,
    variants:
    [
      catalogVariant("v8", "Rangkaian kecil", "RG-TUL-S", 275000, "buket", { pusat: 3, toko: 0 }),
      catalogVariant("v9", "Rangkaian besar", "RG-TUL-L", 425000, "buket", { pusat: 7, toko: 0 }, 2)
    ]
  }),
  catalogProduct(
  {
    id: "tools",
    name: "Set alat berkebun",
    type: "tool",
    categories: ["tools"],
    primaryCategory: "tools",
    photos: [structuredClone(catalogPhotos.garden)],
    attributes: [{ name: "Isi", value: "Sekop, garpu, dan penggaruk" }],
    transactionCount: 4,
    variants:
    [
      catalogVariant("v10", "Set 3 alat", "RG-ALT-03", 89000, "set", { pusat: 12, toko: 3 })
    ]
  }),
  catalogProduct(
  {
    id: "pots",
    name: "Pot terakota",
    type: "pot",
    categories: ["pots"],
    primaryCategory: "pots",
    status: "inactive",
    photos: [],
    attributes: [{ name: "Bahan", value: "Terakota" }, { name: "Drainase", value: "Berlubang" }],
    variants:
    [
      catalogVariant("v11", "Diameter 15 cm", "RG-POT-15", 45000, "pcs", { pusat: 16, toko: 4 }),
      catalogVariant("v12", "Diameter 20 cm", "RG-POT-20", 65000, "pcs", { pusat: 8, toko: 2 })
    ]
  }),
  catalogProduct(
  {
    id: "seeds",
    name: "Benih bunga matahari",
    type: "seed",
    categories: ["seeds"],
    primaryCategory: "seeds",
    status: "inactive",
    photos: [],
    attributes: [{ name: "Isi kemasan", value: "20 benih" }],
    variants:
    [
      catalogVariant("v13", "Kemasan 20 benih", "RG-BNH-20", 22000, "pak", { pusat: 15, toko: 2 })
    ]
  }),
  catalogProduct(
  {
    id: "kit",
    name: "Paket mulai berkebun",
    type: "kit",
    categories: ["kits", "plants"],
    primaryCategory: "kits",
    photos: [structuredClone(catalogPhotos.succulent)],
    stockMode: "components",
    attributes: [{ name: "Isi paket", value: "1 sukulen dan 1 pak media tanam" }],
    variants:
    [
      catalogVariant("v14", "Sukulen + media 1 L", "RG-KIT-S01", 79000, "set", {})
    ]
  })
];

const seedBatchVariant = catalogProducts.find((product) => product.id === "seeds").variants[0];
seedBatchVariant.batchTracked = true;
seedBatchVariant.batches =
[
  { id: "BT-2026-08", location: "pusat", quantity: 15, expires: "2027-08-31" },
  { id: "BT-2026-08-T", location: "toko", quantity: 2, expires: "2027-08-31" }
];
catalogProducts.find((product) => product.id === "kit").variants[0].components =
[
  { variantId: "v4", quantity: 1 },
  { variantId: "v6", quantity: 1 }
];
catalogApprovals.push(
{
  id: "ADJ-DEMO-01",
  variantId: "v2",
  location: "pusat",
  quantity: 25,
  reason: "Selisih hasil hitung ulang penerimaan pemasok, menunggu verifikasi.",
  reference: "DEMO-OPNAME-04",
  actor: "Admin Dian",
  at: "2026-11-04T09:30:00+07:00",
  status: "pending"
});
