"use strict";

// Data ilustrasi laporan berdiri sendiri dan tidak tersinkron dengan modul operasional.
window.operationalReportFixture = Object.freeze(
{
  snapshot: "2026-11-05",
  orders:
  [
    {
      id: "RV-261105-A7K9M2", created: "2026-11-05", delivery: "2026-11-05", slot: "08.00–12.00",
      status: "attention", shipping: "issue", courier: "Kurir instan", issue: "Penerima tidak ada",
      items: [{ name: "Buket mawar pastel", sku: "FL-01", category: "Florist", unit: "buket", quantity: 1 }]
    },
    {
      id: "RV-261105-C3F8R6", created: "2026-11-05", delivery: "2026-11-06", slot: "12.00–16.00",
      status: "ready", shipping: "pending", courier: "Kurir instan", issue: "",
      items: [{ name: "Ficus elastica", sku: "PL-01", category: "Tanaman", unit: "pot", quantity: 2 }]
    },
    {
      id: "RV-261104-H4T6W8", created: "2026-11-04", delivery: "2026-11-05", slot: "12.00–16.00",
      status: "preparing", shipping: "pending", courier: "Kurir instan", issue: "",
      items: [{ name: "Buket mawar pastel", sku: "FL-01", category: "Florist", unit: "buket", quantity: 2 }]
    },
    {
      id: "RV-261104-J5N7P3", created: "2026-11-04", delivery: "2026-11-05", slot: "16.00–20.00",
      status: "shipping", shipping: "shipping", courier: "Kurir instan", issue: "",
      items: [{ name: "Pot terakota", sku: "GD-01", category: "Perlengkapan", unit: "pcs", quantity: 2 }]
    },
    {
      id: "RV-261103-D8V2X6", created: "2026-11-03", delivery: "2026-11-04", slot: "08.00–12.00",
      status: "delivered", shipping: "delivered", courier: "Kurir instan", issue: "",
      items: [{ name: "Ficus elastica", sku: "PL-01", category: "Tanaman", unit: "pot", quantity: 1 }]
    },
    {
      id: "RV-261103-K9B3S7", created: "2026-11-03", delivery: "2026-11-04", slot: "12.00–16.00",
      status: "complete", shipping: "delivered", courier: "Kurir instan", issue: "",
      items: [{ name: "Media tanam", sku: "MD-01", category: "Perlengkapan", unit: "pak", quantity: 2 }]
    },
    {
      id: "RV-261102-F6L8Q4", created: "2026-11-02", delivery: "2026-11-03", slot: "08.00–12.00",
      status: "cancelled", shipping: "pending", courier: "Kurir instan", issue: "",
      items: [{ name: "Ficus elastica", sku: "PL-01", category: "Tanaman", unit: "pot", quantity: 3 }]
    },
    {
      id: "RV-261101-M2Y6Z8", created: "2026-11-01", delivery: "2026-11-03", slot: "12.00–16.00",
      status: "attention", shipping: "returned", courier: "Ekspedisi", issue: "Paket kembali",
      items: [{ name: "Pot terakota", sku: "GD-01", category: "Perlengkapan", unit: "pcs", quantity: 1 }]
    },
    {
      id: "RV-261030-R7C5G9", created: "2026-10-30", delivery: "2026-11-01", slot: "12.00–16.00",
      status: "complete", shipping: "delivered", courier: "Ekspedisi", issue: "",
      items: [{ name: "Buket mawar pastel", sku: "FL-01", category: "Florist", unit: "buket", quantity: 1 }]
    },
    {
      id: "RV-261029-T8D4H6", created: "2026-10-29", delivery: "2026-10-30", slot: "08.00–12.00",
      status: "complete", shipping: "delivered", courier: "Kurir instan", issue: "",
      items: [{ name: "Media tanam", sku: "MD-01", category: "Perlengkapan", unit: "pak", quantity: 1 }]
    }
  ],
  inventory:
  [
    {
      type: "produk", name: "Ficus elastica", code: "PL-01", location: "Gudang Pusat",
      unit: "pot", balance: 4, held: 1, minimum: 5
    },
    {
      type: "produk", name: "Pot terakota", code: "GD-01", location: "Gudang Pusat",
      unit: "pcs", balance: 0, held: 0, minimum: 5
    },
    {
      type: "produk", name: "Media tanam", code: "MD-01", location: "Etalase Toko",
      unit: "pak", balance: 12, held: 2, minimum: 5
    },
    {
      type: "bahan", name: "Mawar merah", code: "BH-MWR", location: "Gudang Pusat",
      unit: "batang", balance: 18, held: 12, minimum: 10
    },
    {
      type: "bahan", name: "Wrapping matte ivory", code: "BH-WRP", location: "Gudang Pusat",
      unit: "lembar", balance: 24, held: 4, minimum: 10
    },
    {
      type: "bahan", name: "Pita satin sage", code: "BH-PIT", location: "Etalase Toko",
      unit: "meter", balance: 4, held: 1, minimum: 5
    }
  ],
  movements:
  [
    {
      date: "2026-11-05", name: "Ficus elastica", code: "PL-01", type: "produk", location: "Gudang Pusat",
      action: "Barang masuk", amount: 4, unit: "pot", reference: "DEMO-M01"
    },
    {
      date: "2026-11-04", name: "Mawar merah", code: "BH-MWR", type: "bahan", location: "Gudang Pusat",
      action: "Pemakaian", amount: -4, unit: "batang", reference: "DEMO-M02"
    },
    {
      date: "2026-11-03", name: "Media tanam", code: "MD-01", type: "produk", location: "Etalase Toko",
      action: "Penjualan", amount: -2, unit: "pak", reference: "DEMO-M03"
    },
    {
      date: "2026-11-02", name: "Pita satin sage", code: "BH-PIT", type: "bahan", location: "Etalase Toko",
      action: "Barang masuk", amount: 4, unit: "meter", reference: "DEMO-M04"
    }
  ]
});
