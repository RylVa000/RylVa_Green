"use strict";

window.RylvaInformationArticle.init(
{
  tocId: "ordering-toc",
  returnId: "ordering-return",
  depthKey: "orderingGuideDepth",
  readingKey: "orderingReading",
  validateSource: () => history.length > 1,
  returnSources:
  [
    { path: "/pages/public/catalog.html", label: "Kembali ke Katalog" },
    { path: "/pages/customer/cart.html", label: "Kembali ke Keranjang" },
    { path: "/pages/customer/checkout.html", label: "Kembali ke Checkout" }
  ]
});
