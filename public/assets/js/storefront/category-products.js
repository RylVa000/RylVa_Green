"use strict";

(() =>
{
  const registry = window.RylvaStorefrontCategories;
  const parameters = new URLSearchParams(location.search);
  const requested = [...new Set(parameters.getAll("category"))];
  const category = requested.length === 1 ? registry.find(requested[0]) : null;
  const missing = parameters.has("category") && !category;
  const title = document.getElementById("catalog-title");
  const description = document.getElementById("category-description");
  const image = document.getElementById("category-image");

  window.RylvaCategoryPage = { category };
  if (!category)
  {
    if (missing)
    {
      title.textContent = "Kategori tidak ditemukan";
      description.textContent = "Kategori pada tautan ini tidak tersedia. Pilih salah satu kategori di bawah untuk melanjutkan.";
      document.getElementById("category-unavailable").hidden = false;
      document.title = "Kategori tidak ditemukan | RylVa Green";
    }
    return;
  }

  document.body.classList.remove("category-directory-page");
  document.getElementById("category-directory").hidden = true;
  document.getElementById("category-results").hidden = false;
  document.getElementById("catalog-filter-panel").hidden = false;
  document.querySelector(".catalog-sort").hidden = false;
  title.textContent = category.name;
  description.textContent = category.description;
  document.getElementById("category-breadcrumb").textContent = category.name;
  document.getElementById("catalog-results-title").textContent = "Produk " + category.name;
  document.title = category.name + " | RylVa Green";
  document.querySelector('meta[name="description"]').content = category.description;
  document.querySelector('meta[property="og:title"]').content = document.title;
  document.querySelector('meta[property="og:description"]').content = category.description;
  document.querySelector('meta[property="og:image"]').content = category.image;
  image.addEventListener("error", () => image.hidden = true);
  image.src = category.image;
  image.hidden = false;
  const search = document.getElementById("storefront-search-input");
  search.placeholder = "Cari di " + category.name + "…";
  document.querySelector('label[for="storefront-search-input"]').textContent = "Cari produk dalam " + category.name;
  document.querySelectorAll("[data-category-choice], [data-storefront-category]").forEach((link) =>
  {
    if ((link.dataset.categoryChoice || link.dataset.storefrontCategory) === category.id)
    {
      link.setAttribute("aria-current", "page");
    }
  });
})();
