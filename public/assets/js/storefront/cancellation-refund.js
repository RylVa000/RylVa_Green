"use strict";

window.RylvaInformationArticle.init(
{
  tocId: "refund-toc",
  returnId: "refund-return",
  depthKey: "refundGuideDepth",
  readingKey: "refundReading",
  returnSources:
  [
    { path: "/pages/customer/order-detail.html", label: "Kembali ke Detail Pesanan" },
    { path: "/pages/customer/payment.html", label: "Kembali ke Pembayaran" },
    { path: "/pages/customer/my-orders.html", label: "Kembali ke Pesanan Saya" }
  ]
});
