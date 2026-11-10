"use strict";

const bouquetSnapshot = "2026-11-04T10:20:00+07:00";
const bouquetStageLabels =
{
  ready: "Siap Dirangkai",
  preparing: "Sedang Dirangkai",
  attention: "Perlu Penanganan",
  complete: "Selesai Dirangkai"
};

function bouquetIngredient(materialId, units)
{
  return { materialId, units };
}

// Fictional custom products; ready-made SKU stock is not used for these examples.
const bouquetRecipes =
[
  {
    id: "custom-rose",
    name: "Buket mawar kustom",
    productCode: "DEMO-KUSTOM-MAWAR",
    variant: "Ukuran reguler",
    price: 150000,
    active: true,
    version: 1,
    base: [bouquetIngredient("ribbon", 50), bouquetIngredient("card", 1)],
    groups:
    [
      {
        id: "flowers",
        name: "Bunga utama",
        minimum: 1,
        maximum: 1,
        options:
        [
          {
            id: "rose-six",
            name: "Mawar merah, 6 batang",
            price: 50000,
            active: true,
            incompatible: "",
            ingredients: [bouquetIngredient("rose", 6)]
          },
          {
            id: "rose-twelve",
            name: "Mawar merah, 12 batang",
            price: 100000,
            active: true,
            incompatible: "",
            ingredients: [bouquetIngredient("rose", 12)]
          }
        ]
      },
      {
        id: "wrap",
        name: "Pembungkus",
        minimum: 1,
        maximum: 1,
        options:
        [
          {
            id: "wrap-ivory",
            name: "Wrapping matte ivory",
            price: 15000,
            active: true,
            incompatible: "",
            ingredients: [bouquetIngredient("wrap", 2)]
          }
        ]
      },
      {
        id: "extra",
        name: "Tambahan",
        minimum: 0,
        maximum: 1,
        options:
        [
          {
            id: "baby-extra",
            name: "Baby's breath putih",
            price: 20000,
            active: true,
            incompatible: "",
            ingredients: [bouquetIngredient("baby", 2)]
          }
        ]
      }
    ]
  },
  {
    id: "custom-tulip",
    name: "Buket tulip kustom",
    productCode: "DEMO-KUSTOM-TULIP",
    variant: "Ukuran reguler",
    price: 190000,
    active: true,
    version: 1,
    base: [bouquetIngredient("wrap", 2), bouquetIngredient("ribbon", 50)],
    groups:
    [
      {
        id: "tulip-main",
        name: "Bunga utama",
        minimum: 1,
        maximum: 1,
        options:
        [
          {
            id: "tulip-four",
            name: "Tulip merah muda, 4 batang",
            price: 60000,
            active: true,
            incompatible: "",
            ingredients: [bouquetIngredient("tulip", 4)]
          }
        ]
      }
    ]
  }
];

const bouquetJobs =
[
  {
    id: "PRD-KUSTOM-001",
    orderId: "RV-261103-A7K9M2",
    customer: "Nadia Putri",
    recipeId: "custom-rose",
    recipeVersion: 1,
    name: "Buket mawar kustom",
    quantity: 1,
    choices: ["Mawar merah, 6 batang", "Wrapping matte ivory", "Baby's breath putih"],
    needs: [
      bouquetIngredient("rose", 6),
      bouquetIngredient("baby", 2),
      bouquetIngredient("wrap", 2),
      bouquetIngredient("ribbon", 50),
      bouquetIngredient("card", 1)
    ],
    price: 235000,
    slot: "Siang, 12.00–16.00 WIB",
    deadline: "2026-11-04T12:00:00+07:00",
    status: "ready",
    issue: "",
    note: "Pastikan nama penerima pada kartu sesuai pesanan.",
    history: []
  },
  {
    id: "PRD-KUSTOM-002",
    orderId: "RV-261103-K9B3S7",
    customer: "Sinta Larasati",
    recipeId: "custom-tulip",
    recipeVersion: 1,
    name: "Buket tulip kustom",
    quantity: 2,
    choices: ["Tulip merah muda, 4 batang per buket"],
    needs: [bouquetIngredient("tulip", 8), bouquetIngredient("wrap", 4), bouquetIngredient("ribbon", 100)],
    price: 500000,
    slot: "Sore, 16.00–20.00 WIB",
    deadline: "2026-11-04T16:00:00+07:00",
    status: "ready",
    issue: "",
    note: "Dua buket memakai konfigurasi yang sama.",
    history: []
  },
  {
    id: "PRD-DEMO-041",
    orderId: "RV-261103-A7K9M2",
    customer: "Nadia Putri",
    recipeId: "custom-rose",
    recipeVersion: 1,
    name: "Rangkaian mawar, pekerjaan contoh",
    quantity: 1,
    choices: ["Mawar merah, 12 batang", "Baby's breath 6 batang", "Wrapping 3 lembar", "Pita 1,5 meter"],
    needs: [
      bouquetIngredient("rose", 12),
      bouquetIngredient("baby", 6),
      bouquetIngredient("wrap", 3),
      bouquetIngredient("ribbon", 150)
    ],
    price: 300000,
    slot: "Siang, 12.00–16.00 WIB",
    deadline: "2026-11-04T12:00:00+07:00",
    status: "preparing",
    issue: "",
    note: "Pekerjaan ini memakai alokasi contoh dari master Bahan Produksi.",
    history:
    [
      { label: "Mulai dirangkai", reason: "Alokasi contoh tersedia.", actor: "Admin Dian", at: "2026-11-04T09:00:00+07:00" }
    ]
  }
];
