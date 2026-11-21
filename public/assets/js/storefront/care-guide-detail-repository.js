"use strict";

// Detail read boundary. Development fixtures never write production data.
window.RylvaCareGuideDetailRepository = (() =>
{
  const parameters = new URLSearchParams(location.search);
  const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  const scenario = isLocal && parameters.get("preview") === "care-guide-detail"
    ? parameters.get("state") : "normal";

  async function load(id, options)
  {
    const result = await window.RylvaCareGuidesRepository.load(options);
    const guide = result.guides.find((item) => item.id === id);
    if (!guide || scenario === "notFound")
    {
      throw Object.assign(new Error("Panduan tidak ditemukan."), { code: "notFound" });
    }
    const article = structuredClone(window.RylvaCareGuideDetailData[id]);
    if (article?.image && scenario !== "brokenImage")
    {
      guide.image = article.image;
    }
    if (article && scenario === "missingSection")
    {
      article.observation = "";
    }
    return { guide, article, partial: result.partial || scenario === "missingSection" };
  }

  return { load };
})();
