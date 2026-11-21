"use strict";

(() =>
{
  const kind = document.body.dataset.collection;
  const isNew = kind === "new";
  const title = isNew ? "Koleksi Baru" : "Promo Spesial";
  const source = window.RylvaHomepagePreviewRepository;
  const query = new URLSearchParams(location.search);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  const ended = !isNew && local && query.get("preview") === "collections"
    && query.get("state") === "ended";

  window.RylvaCollectionPage =
  {
    title,
    emptyTitle: isNew ? "Koleksi baru belum tersedia" : ended ? "Periode promo telah berakhir" : "Belum ada produk promo",
    emptyDescription: isNew
      ? "Belum ada produk dalam koleksi ini. Anda tetap dapat menjelajahi semua produk."
      : "Belum ada harga promo yang dapat ditampilkan. Jelajahi semua produk atau periksa kembali nanti."
  };

  window.RylvaCatalogAdapter =
  {
    ...source,
    async load(options)
    {
      const result = await source.load(options);
      const products = result.products.filter((product) =>
      {
        if (isNew)
        {
          return window.RylvaCollectionsPreviewData.newProductIds.includes(product.slug);
        }
        return !ended && Number.isSafeInteger(product.price) && product.price >= 0
          && Number.isSafeInteger(product.basePrice) && product.basePrice > product.price;
      });
      const partial = !isNew && result.products.some((product) =>
        !Number.isSafeInteger(product.price) || product.price < 0);
      return { ...result, products, partial };
    }
  };

  const search = document.getElementById("storefront-search-input");
  search.placeholder = "Cari di " + title + "…";
  document.querySelector('label[for="storefront-search-input"]').textContent = "Cari produk dalam " + title;
})();
