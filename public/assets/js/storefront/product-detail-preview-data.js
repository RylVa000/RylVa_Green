"use strict";

window.RylvaProductDetailPreviewData = (() =>
{
  const imageRoot = "/assets/images/product-detail/";
  const careSource = "https://hort.extension.wisc.edu/articles/monstera-deliciosa/";
  const scenarios = ["normal", "loading", "notFound", "unavailable", "outOfStock", "invalidPrice",
    "partial", "brokenImage", "longContent", "loadError", "offline", "timeout", "maintenance",
    "addError", "conflict", "rateLimited", "shippingError", "shippingRates",
    "shippingLoading", "shippingTimeout", "shippingUnavailable", "shippingPartial"];

  function find(slug)
  {
    const summary = window.RylvaStorefrontProductPreviewData.products.find((item) => item.slug === slug);
    const item = window.RylvaCartPreviewData.createCatalog().find((candidate) => candidate.productId === summary?.productId);
    if (!item || !summary)
    {
      return null;
    }
    const monstera = slug === "monstera";
    const image = slug === "sirih-gading" ? "/assets/images/catalog/sirih-gading.png" : summary.image;
    return {
      slug,
      productId: item.productId,
      name: monstera ? "Monstera Deliciosa" : summary.name,
      latinName: monstera ? "Monstera deliciosa Liebm." : "",
      category: summary.categories.includes("outdoor") ? "Tanaman Hias Outdoor" : "Tanaman Hias Indoor",
      sku: monstera ? "TNM-MONSTERA-DEL" : "",
      description: monstera
        ? "Daun hijau besar dengan belahan alaminya memberi karakter pada sudut ruangan. Monstera tumbuh merambat dan dapat diarahkan menggunakan penyangga."
        : summary.description,
      packaging: monstera ? "Dikirim dengan pot nursery standar. Pot dekoratif dijual terpisah." : "",
      available: item.available,
      variants: [{
        id: item.variantId,
        lineId: item.lineId,
        name: item.variant,
        attributes: item.attributes,
        price: item.price,
        basePrice: item.basePrice,
        stock: item.availableStock,
        unit: item.unit
      }],
      gallery: monstera ? [
        { src: imageRoot + "monstera-main.png", alt: "Monstera Deliciosa dengan daun terbelah di atas penyangga pot" },
        { src: imageRoot + "monstera-room.png", alt: "Pilihan tampilan Monstera Deliciosa dalam pot putih" },
        { src: imageRoot + "monstera-close.png", alt: "Tampilan lain bentuk daun Monstera Deliciosa" }
      ] : [{ src: image, alt: summary.name }],
      care: monstera ? [
        { icon: "water", title: "Periksa media sebelum menyiram", text: "Siram hingga merata, lalu biarkan media sedikit mengering sebelum penyiraman berikutnya. Sesuaikan dengan kondisi media dan ruangan.", source: careSource, sourceName: "UW–Madison Extension" },
        { icon: "sun", title: "Cahaya terang, hindari perubahan mendadak", text: "Tempatkan di area bercahaya terang. Kenalkan perubahan intensitas cahaya secara bertahap agar daun tidak terbakar.", source: careSource, sourceName: "UW–Madison Extension" },
        { icon: "pets", title: "Jauhkan dari kucing dan anjing", text: "Monstera beracun bagi kucing dan anjing jika dikunyah. Letakkan di luar jangkauan hewan peliharaan.", source: "https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/cutleaf-philodendron", sourceName: "ASPCA" },
        { icon: "beginner", title: "Bersihkan daun dan beri penyangga", text: "Lap debu pada daun dan gunakan penyangga untuk membantu batang yang merambat.", source: careSource, sourceName: "UW–Madison Extension" }
      ] : []
    };
  }

  return { find, scenarios };
})();
