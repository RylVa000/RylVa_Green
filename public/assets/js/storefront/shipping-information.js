"use strict";

window.RylvaInformationArticle.init(
{
  tocId: "shipping-toc",
  returnId: "shipping-return",
  depthKey: "shippingGuideDepth",
  readingKey: "shippingReading",
  returnHash: "#product-shipping",
  validateSource: (source) => Boolean(source.searchParams.get("product")),
  returnSources:
  [
    { path: "/pages/public/product-detail.html", label: "Kembali ke Produk" }
  ]
});
