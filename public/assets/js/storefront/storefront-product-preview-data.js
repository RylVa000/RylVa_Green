"use strict";

// Figma catalog examples. Prices, inventory and attributes are preview data.
window.RylvaStorefrontProductPreviewData = (() =>
{
  const imageRoot = "/assets/images/homepage/";
  const records =
  [
    ["peace-lily", "Peace Lily", "peace-lily", 128999, 130000, "Tanaman berbunga putih dalam pot untuk melengkapi koleksi Anda."],
    ["monstera", "Monstera", "monstera", 289000, 350000, "Daun berlekuk khas dengan pilihan ukuran dan pot."],
    ["calathea", "Calathea", "calathea", 75000, 75000, "Koleksi tanaman berdaun lebar dengan pola yang khas."],
    ["sirih-gading", "Sirih Gading", "calathea", 42700, 45000, "Pilihan tanaman rambat untuk koleksi hijau di rumah."],
    ["snake-plant", "Lidah Mertua", "snake-plant", 79000, 95000, "Daun tegak dengan bentuk ramping untuk sudut ruangan."],
    ["aglaonema", "Aglaonema Red", "aglaonema", 150000, 150000, "Corak daun merah muda untuk variasi koleksi tanaman."],
    ["dracaena", "Dracaena sanderiana", "dracaena", 40000, 40000, "Tanaman berbatang ramping dalam pot kecil."],
    ["petunia", "Petunia", "petunia", 30000, 30000, "Koleksi tanaman berbunga untuk memberi warna pada taman."]
  ];
  const products = records.map(([slug, name, image, price, basePrice, description], index) =>
  ({
    slug,
    lineId: slug === "monstera" ? "monstera-large" : slug === "calathea" ? "calathea-small" : slug + "-standard",
    productId: "example-" + slug,
    variantId: slug === "monstera" ? "example-large" : slug === "calathea" ? "example-small" : "example-standard",
    name,
    description,
    image: slug === "sirih-gading" ? "/assets/images/catalog/sirih-gading.png" : imageRoot + image + ".webp",
    imageKey: slug,
    price,
    basePrice,
    unit: "pot",
    variant: slug === "monstera" ? "Besar" : slug === "calathea" ? "Kecil" : "Standar",
    attributes: "Pilihan contoh dari desain",
    categories: index === 7 ? ["outdoor"] : ["indoor"],
    tags: [],
    available: true,
    availableStock: 20,
    stockLabel: slug === "calathea" ? "Hampir Habis" : "Tersedia",
    stockTone: slug === "calathea" ? "low" : "available",
    quantity: 1,
    selected: true,
    handling: "durable"
  }));

  return { products };
})();
