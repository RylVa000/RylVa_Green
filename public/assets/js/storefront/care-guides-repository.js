"use strict";

// Local read adapter. Replace this boundary when a publishing service is available.
window.RylvaCareGuidesRepository = (() =>
{
  const parameters = new URLSearchParams(location.search);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  const scenarios = ["normal", "loading", "empty", "loadError", "offline", "timeout",
    "maintenance", "partial", "invalidData", "brokenImage", "longContent"];
  const requested = parameters.get("state");
  const scenario = local && ["care-guides", "care-guide-detail"].includes(parameters.get("preview"))
    && scenarios.includes(requested) ? requested : "normal";
  let recovered = false;

  async function load({ recover = false } = {})
  {
    recovered ||= recover;
    await new Promise((resolve) => setTimeout(resolve, scenario === "loading" && !recovered ? 1800 : 180));
    if (!navigator.onLine || (!recovered && ["loadError", "offline", "timeout", "maintenance"].includes(scenario)))
    {
      throw Object.assign(new Error("Panduan belum dapat dimuat."),
      {
        code: !navigator.onLine ? "offline" : scenario
      });
    }
    let guides = structuredClone(window.RylvaCareGuidesData.guides);
    const products = window.RylvaStorefrontProductPreviewData.products;
    guides = guides.map((guide) =>
    {
      const product = products.find((item) => item.slug === guide.id);
      return { ...guide, image: product?.image || null, productSlug: product?.slug || null };
    });
    if (scenario === "empty")
    {
      guides = [];
    }
    if (scenario === "partial")
    {
      guides = guides.slice(0, 3);
    }
    if (scenario === "invalidData")
    {
      guides[0].source = "javascript:alert(1)";
      guides[1].name = "";
    }
    if (scenario === "brokenImage")
    {
      guides[0].image = "/assets/images/homepage/care-missing-example.png";
    }
    if (scenario === "longContent")
    {
      guides[0].name = "Monstera dengan daun berukuran besar untuk koleksi tanaman di ruang keluarga dan area kerja";
      guides[0].description += " Perhatikan kebutuhan tanaman berdasarkan kondisi tempat tumbuh dan identitas spesiesnya sebelum menentukan perawatan.";
    }
    return { guides, partial: scenario === "partial" };
  }

  return { load, scenarios };
})();
