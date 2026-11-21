"use strict";

window.RylvaInformationArticle.init(
{
  tocId: "about-toc",
  returnId: "about-return",
  depthKey: "aboutGuideDepth",
  readingKey: "aboutReading",
  validateSource: () => history.length > 1,
  returnSources:
  [
    { path: "/pages/public/catalog.html", label: "Kembali ke Katalog" }
  ]
});
