"use strict";

// Figma examples, not a live catalog. All stock/capability values are fixtures.
window.RylvaCartPreviewData = (() =>
{
  const baseItems =
  [
    {
      lineId: "monstera-large",
      productId: "example-monstera",
      variantId: "example-large",
      name: "Monstera Deliciosa",
      variant: "Besar",
      attributes: "70–90 cm",
      image: "../../assets/images/cart/monstera.png",
      imageKey: "monstera",
      unit: "pot",
      basePrice: 350000,
      price: 289000,
      quantity: 1,
      availableStock: 20,
      available: true,
      selected: true
    },
    {
      lineId: "calathea-small",
      productId: "example-calathea",
      variantId: "example-small",
      name: "Calathea",
      variant: "Kecil",
      attributes: "20–45 cm",
      image: "../../assets/images/cart/calathea.png",
      imageKey: "calathea",
      unit: "pot",
      basePrice: 75000,
      price: 75000,
      quantity: 1,
      availableStock: 20,
      available: true,
      selected: false
    }
  ];

  const scenarios =
  {
    normal: "Normal: contoh Figma",
    account: "Keranjang pelanggan (contoh)",
    empty: "Keranjang kosong",
    unselected: "Tidak ada pilihan",
    allSelected: "Semua dipilih",
    loading: "Loading awal",
    slow: "Pemuatan lama",
    loadError: "Gagal memuat",
    partialRefresh: "Memperbarui sebagian",
    unavailable: "Produk tidak tersedia",
    allUnavailable: "Semua produk tidak tersedia",
    lowStock: "Stok terbatas",
    stockChanged: "Stok turun",
    variantUnavailable: "Varian tidak tersedia",
    configuration: "Ringkasan buket contoh",
    componentUnavailable: "Komponen buket tidak tersedia",
    configurationInvalid: "Referensi kustomisasi tidak sah",
    metadataPartial: "Metadata sebagian",
    invalidData: "Data harga tidak valid",
    partialPrices: "Sebagian harga gagal",
    brokenImage: "Gambar gagal dimuat",
    longContent: "Nama panjang dan nominal besar",
    quantityLimit: "Batas 20 unit per produk",
    totalLimit: "Batas 50 unit per pesanan",
    priceChanged: "Harga berubah",
    promoExpired: "Promo berakhir",
    saveError: "Gagal menyimpan (sekali)",
    deleteError: "Gagal menghapus (sekali)",
    uncertain: "Hasil perubahan belum pasti",
    slowSave: "Penyimpanan lama",
    offline: "Offline",
    maintenance: "Maintenance",
    rateLimited: "Pembatasan sementara",
    storageBlocked: "Penyimpanan browser ditolak",
    storageCorrupt: "Data tamu rusak",
    expired: "Keranjang kedaluwarsa",
    sessionExpired: "Sesi berakhir",
    denied: "Akses tidak diizinkan",
    verification: "Perlu verifikasi akun",
    notFound: "Keranjang tidak ditemukan",
    converted: "Keranjang sudah dikonversi",
    merged: "Keranjang sumber sudah digabung",
    merging: "Penggabungan berjalan",
    mergeAdjusted: "Penggabungan dengan penyesuaian",
    mergeError: "Penggabungan gagal",
    conflict: "Perubahan dari perangkat lain",
    csrf: "Keamanan sesi perlu diperbarui",
    removedElsewhere: "Item dihapus di tempat lain",
    quoteChanged: "Harga berubah saat lanjut Checkout"
  };

  function createItems(scenario)
  {
    const items = structuredClone(baseItems);
    const firstItem = items[0];

    if (scenario === "empty")
    {
      return [];
    }
    if (scenario === "unselected")
    {
      items.forEach((item) => item.selected = false);
    }
    if (scenario === "allSelected")
    {
      items.forEach((item) => item.selected = true);
    }
    if (["unavailable", "allUnavailable", "variantUnavailable"].includes(scenario))
    {
      firstItem.available = false;
      firstItem.availableStock = 0;
      firstItem.issue = scenario === "variantUnavailable" ? "Varian ini tidak tersedia." : "Produk ini tidak tersedia.";
      if (scenario === "allUnavailable")
      {
        items[1].available = false;
        items[1].availableStock = 0;
      }
    }
    if (scenario === "lowStock" || scenario === "stockChanged")
    {
      firstItem.availableStock = 2;
      firstItem.quantity = scenario === "stockChanged" ? 3 : 1;
    }
    if (["configuration", "componentUnavailable", "configurationInvalid"].includes(scenario))
    {
      firstItem.name = "Buket Kustom — contoh konfigurasi";
      firstItem.variant = "Konfigurasi contoh";
      firstItem.attributes = "Harga dan pilihan ilustratif";
      firstItem.image = "../../assets/images/products/bouquet.jpg";
      firstItem.configRef = "example-bouquet-a";
      firstItem.configuration = ["Bunga contoh: pilihan A", "Pembungkus contoh: hijau", "Pita contoh: krem"];
      if (scenario !== "configuration")
      {
        firstItem.available = false;
        firstItem.issue = scenario === "componentUnavailable"
          ? "Salah satu bahan buket tidak tersedia. Sesuaikan kustomisasi atau hapus item."
          : "Kustomisasi perlu diperiksa. Pilihan belum dapat divalidasi.";
      }
    }
    if (scenario === "metadataPartial")
    {
      firstItem.name = "";
      firstItem.attributes = "";
    }
    if (["invalidData", "partialPrices"].includes(scenario))
    {
      firstItem.price = null;
    }
    if (scenario === "brokenImage")
    {
      firstItem.image = "../../assets/images/cart/image-unavailable.png";
    }
    if (scenario === "longContent")
    {
      firstItem.name = "Monstera Deliciosa dengan nama produk sangat panjang untuk memeriksa keterbacaan, pembungkusan teks, dan posisi kontrol keranjang";
      firstItem.basePrice = 999999999;
      firstItem.price = 999999999;
    }
    if (scenario === "quantityLimit")
    {
      firstItem.quantity = 20;
    }
    if (scenario === "totalLimit")
    {
      items.forEach((item) =>
      {
        item.quantity = 20;
        item.selected = true;
      });
      items.push(
      {
        ...structuredClone(items[1]),
        lineId: "example-growing-medium",
        productId: "example-medium",
        name: "Media Tanam — contoh pengujian batas",
        variant: "Kemasan contoh",
        attributes: "Data ilustratif",
        image: "../../assets/images/products/garden.jpg",
        unit: "pack"
      });
    }
    if (scenario === "priceChanged" || scenario === "promoExpired")
    {
      firstItem.price = scenario === "promoExpired" ? 350000 : 300000;
      firstItem.changeMessage = scenario === "promoExpired"
        ? "Promo berakhir. Harga terbaru Rp 350.000 per pot."
        : "Harga berubah dari Rp 289.000 menjadi Rp 300.000 per pot.";
    }
    return items;
  }

  function createCatalog()
  {
    const extras = window.RylvaStorefrontProductPreviewData?.products || [];
    return structuredClone([
      ...baseItems,
      ...extras.filter((item) => !baseItems.some((base) => base.productId === item.productId))
    ]);
  }

  return { createItems, createCatalog, scenarios, limits: { perProduct: 20, perOrder: 50, lowStock: 5 } };
})();
