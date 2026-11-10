"use strict";

(() =>
{
  const slug = (value) => value.toLocaleLowerCase("id-ID").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const products = structuredClone(catalogProducts);
  const categories = structuredClone(catalogCategories).map((category, index) =>
  {
    return {
      ...category,
      slug: slug(category.name),
      parent: category.id === "indoor" ? "plants" : "",
      description: "",
      position: index + 1,
      history: []
    };
  });
  const attributes = [];
  products.forEach((product) =>
  {
    product.attributes.forEach((attribute) =>
    {
      let entry = attributes.find((item) => item.name === attribute.name);
      if (!entry)
      {
        entry = {
          id: `attr-${slug(attribute.name)}`,
          name: attribute.name,
          key: slug(attribute.name),
          type: ["Bahan", "Warna daun", "Drainase"].includes(attribute.name) ? "choice" : "text",
          mode: "description",
          active: true,
          description: "",
          categories: [],
          options: [],
          history: []
        };
        attributes.push(entry);
      }
      product.categories.forEach((id) =>
      {
        if (!entry.categories.includes(id))
        {
          entry.categories.push(id);
        }
      });
      if (entry.type === "choice" && !entry.options.some((option) => option.label === attribute.value))
      {
        entry.options.push({ id: `opt-${slug(attribute.value)}`, label: attribute.value, active: true });
      }
    });
  });
  categories.push(
  {
    id: "seasonal", name: "Koleksi musiman", slug: "koleksi-musiman", parent: "", active: false,
    description: "Contoh kategori belum dipakai.", position: 9, history: []
  });
  attributes.push(
  {
    id: "attr-size", name: "Ukuran", key: "ukuran", type: "choice", mode: "variant", active: false,
    description: "Definisi contoh; belum dikaitkan ke SKU.", categories: ["plants"],
    options: [{ id: "opt-small", label: "Kecil", active: true }], history: []
  });
  window.taxonomyFixture = { products, categories, attributes };
})();
