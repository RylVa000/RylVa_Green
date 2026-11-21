"use strict";

window.RylvaInformationArticle.init(
{
  tocId: "terms-toc",
  returnId: "terms-return",
  depthKey: "termsGuideDepth",
  readingKey: "termsReading",
  validateSource: () => history.length > 1,
  returnSources:
  [
    { path: "/pages/customer/checkout.html", label: "Kembali ke Checkout" },
    { path: "/pages/customer/cart.html", label: "Kembali ke Keranjang" }
  ]
});
