"use strict";

const catalogNotices = [];
const catalogUnitOptions =
{
  plant: ["pot", "pcs", "pak"],
  florist: ["buket", "batang", "pcs"],
  pot: ["pcs", "set"],
  media: ["pak", "liter", "kg", "gram"],
  soil: ["kg", "pak", "liter"],
  fertilizer: ["pak", "gram", "kg", "ml", "liter"],
  tool: ["pcs", "set", "pak"],
  seed: ["pak", "pcs", "gram"],
  decor: ["pcs", "pak", "set", "batang"],
  kit: ["set", "pak"]
};
let productVariantOwnerId = "";
let productVariantEditorId = "";
const catalogTypes =
[
  ["plant", "Tanaman hias"], ["florist", "Florist siap jual"], ["pot", "Pot / vas"],
  ["media", "Media tanam"], ["soil", "Tanah / kompos"], ["fertilizer", "Pupuk / perawatan"],
  ["tool", "Alat berkebun"], ["seed", "Benih"], ["decor", "Perlengkapan / dekorasi"], ["kit", "Paket berkebun"]
];

function markProductDirty()
{
  productDirty = true;
  const status = document.getElementById("product-save-state");

  if (status)
  {
    status.textContent = "Ada perubahan belum disimpan";
  }

  if (productDraft)
  {
    renderProductReadiness();
  }
}

function productField(name, label, type, value, options = {})
{
  const wrapper = pNode("div", options.wide ? "product-field product-field--wide" : "product-field");
  const id = `product-${name}`;
  const caption = pNode("label", "", `${label}${options.required ? " (wajib)" : ""}`);
  caption.htmlFor = id;
  const input = pNode(type === "textarea" ? "textarea" : type === "select" ? "select" : "input");
  input.id = id;
  input.name = name;

  if (!["textarea", "select"].includes(type))
  {
    input.type = type;
  }

  if (type === "select")
  {
    for (const option of options.choices || [])
    {
      const [optionValue, optionLabel] = Array.isArray(option) ? option : [option, option];
      input.append(new Option(optionLabel, optionValue));
    }
  }

  input.value = value ?? "";
  input.required = Boolean(options.required);

  if (options.searchable)
  {
    input.dataset.searchable = "true";
  }

  if (type === "number")
  {
    input.step = options.step || "1";
    input.inputMode = "decimal";

    if (options.min !== undefined)
    {
      input.min = options.min;
    }

    if (options.max !== undefined)
    {
      input.max = options.max;
    }
  }

  if (options.maxLength)
  {
    input.maxLength = options.maxLength;
  }

  input.disabled = Boolean(options.disabled);
  const error = pNode("span", "product-field-error");
  error.id = `${id}-error`;
  error.hidden = true;
  const descriptions = [error.id];
  wrapper.append(caption, input);

  if (options.help)
  {
    const help = pNode("small", "product-help", options.help);
    help.id = `${id}-help`;
    descriptions.push(help.id);
    wrapper.append(help);
  }

  input.setAttribute("aria-describedby", descriptions.join(" "));
  input.addEventListener("input", () =>
  {
    const value = type === "number" && !(options.preserveEmpty && input.value === "")
      ? Number(input.value) : input.value;
    options.bind?.(value);
    markProductDirty();
    input.removeAttribute("aria-invalid");
    error.hidden = true;
  });

  if (options.change)
  {
    input.addEventListener("change", options.change);
  }

  wrapper.append(error);
  return wrapper;
}

function productCheck(name, label, checked, bind, disabled = false)
{
  const wrapper = pNode("label", "product-check");
  const input = pNode("input");
  input.id = `product-${name}`;
  input.type = "checkbox";
  input.checked = checked;
  input.disabled = disabled;
  input.addEventListener("change", () =>
  {
    bind(input.checked);
    markProductDirty();
  });
  wrapper.append(input, document.createTextNode(label));
  return wrapper;
}

function productFormSection(id, title, copy)
{
  const section = pNode("section", "product-form-section");
  section.id = `edit-${id}`;
  const heading = pNode("h2", "", title);
  heading.id = `edit-${id}-title`;
  section.setAttribute("aria-labelledby", heading.id);
  section.append(heading, pNode("p", "", copy));
  return section;
}

function blankCatalogVariant()
{
  productSequence += 1;
  return {
    id: `new-variant-${productSequence}`,
    name: "Varian utama",
    sku: "",
    price: 0,
    salePrice: 0,
    saleStart: "",
    saleEnd: "",
    unit: productUnitsFor(productDraft?.type || "plant")[0],
    active: true,
    weight: 0,
    length: 0,
    width: 0,
    height: 0,
    batchTracked: false,
    batches: [],
    components: []
  };
}

function productUnitsFor(type)
{
  return catalogUnitOptions[type] || ["pcs"];
}

function selectProductType(type)
{
  productDraft.type = type;
  const units = productUnitsFor(type);

  for (const variant of productDraft.variants)
  {
    if (!units.includes(variant.unit) && !catalogVariantReferenced(variant.id))
    {
      variant.unit = units[0];
    }
  }
}

function productVariantDisclosure(details, id)
{
  details.id = `variant-editor-${id}`;
  details.setAttribute("name", "product-variant-editor");
  details.open = productVariantEditorId === id;
  details.addEventListener("toggle", () =>
  {
    if (!details.isConnected)
    {
      return;
    }

    if (details.open)
    {
      productVariantEditorId = id;
      document.querySelectorAll("#edit-variants > details").forEach((other) =>
      {
        if (other !== details)
        {
          other.open = false;
        }
      });
    }
    else if (productVariantEditorId === id)
    {
      productVariantEditorId = "";
    }
  });
}

function newCatalogDraft()
{
  return catalogProduct(
  {
    id: `product-${++productSequence}`,
    name: "",
    type: "plant",
    status: "inactive",
    categories: [],
    primaryCategory: "",
    description: "",
    care: "",
    shippingNote: "",
    photos: [],
    variants: [blankCatalogVariant()],
    variantOptions: [],
    editReason: ""
  });
}

function refreshProductEditor()
{
  const focusedId = document.activeElement?.id;
  const scrollPosition = scrollY;
  renderProductEditor();
  document.getElementById(focusedId)?.focus({ preventScroll: true });
  window.scrollTo(0, scrollPosition);
}

function renderProductEditor()
{
  if (!productDraft)
  {
    productDraft = catalogState.mode === "new" ? newCatalogDraft() : structuredClone(findCatalogProduct());
    productDraft.variantOptions ||= [];
    productDraft.editReason = "";
  }

  if (productVariantOwnerId !== productDraft.id)
  {
    productVariantOwnerId = productDraft.id;
    productVariantEditorId = catalogState.mode === "new" ? productDraft.variants[0]?.id || "" : "";
  }

  const root = document.getElementById("product-editor-view");
  root.replaceChildren();
  const navigation = pNode("nav", "product-editor-nav");
  navigation.setAttribute("aria-label", "Bagian form produk");

  for (const [key, label] of [["basics", "Informasi"], ["categories", "Kategori & atribut"], ["variants", "Varian & harga"], ["photos", "Foto"], ["shipping", "Penanganan"]])
  {
    const link = pNode("a", "", label);
    link.href = `#edit-${key}`;
    link.dataset.editorSection = key;
    link.addEventListener("click", (event) =>
    {
      event.preventDefault();
      document.getElementById(`edit-${key}`)?.scrollIntoView({ block: "start" });
      updateProductEditorNavigation();
    });
    navigation.append(link);
  }

  const form = pNode("form");
  form.id = "product-editor-form";
  form.noValidate = true;
  const error = pNode("div", "product-error-summary");
  error.id = "product-editor-errors";
  error.hidden = true;
  error.tabIndex = -1;
  error.setAttribute("role", "alert");
  form.append(error);
  const layout = pNode("div", "product-editor-layout");
  const fields = pNode("div");
  const basics = productFormSection("basics", "Informasi produk", "Nama yang jelas membantu Admin dan pelanggan mengenali produk.");
  const basicsFields = pNode("div", "product-fields");
  basicsFields.append(
    productField("name", "Nama produk", "text", productDraft.name,
    {
      required: true, wide: true, maxLength: 120,
      bind: (value) => productDraft.name = value
    }),
    productField("type", "Jenis produk", "select", productDraft.type,
    {
      required: true, choices: catalogTypes,
      bind: selectProductType,
      change: refreshProductEditor
    }),
    productField("brand", "Merek", "text", productDraft.brand,
    {
      maxLength: 80, bind: (value) => productDraft.brand = value
    }),
    productField("description", "Deskripsi", "textarea", productDraft.description,
    {
      wide: true, maxLength: 4000,
      bind: (value) => productDraft.description = value
    })
  );
  basics.append(basicsFields);
  const categories = productFormSection("categories", "Kategori dan atribut", "Satu produk dapat masuk beberapa kategori. Atribut deskriptif tidak otomatis membuat SKU baru.");
  const categoryLabel = pNode("p", "product-field-label", "Kategori (wajib, pilih minimal satu)");
  const choices = pNode("div", "product-check-list");
  choices.id = "product-categories";

  const categorySearchLabel = pNode("label", "product-help", "Cari kategori");
  categorySearchLabel.htmlFor = "product-category-search";
  const categorySearch = pNode("input");
  categorySearch.id = "product-category-search";
  categorySearch.type = "search";
  categorySearch.placeholder = "Ketik nama kategori";
  categorySearch.addEventListener("input", () =>
  {
    const query = categorySearch.value.trim().toLocaleLowerCase("id");
    choices.querySelectorAll("label").forEach((label) =>
    {
      label.hidden = !label.textContent.toLocaleLowerCase("id").includes(query);
    });
  });

  for (const category of catalogCategories.filter((entry) => entry.active || productDraft.categories.includes(entry.id)))
  {
    choices.append(productCheck(`category-${category.id}`, category.name, productDraft.categories.includes(category.id), (checked) =>
    {
      productDraft.categories = checked ? [...new Set([...productDraft.categories, category.id])]
        : productDraft.categories.filter((id) => id !== category.id);

      if (!productDraft.categories.includes(productDraft.primaryCategory))
      {
        productDraft.primaryCategory = productDraft.categories[0] || "";
      }

      refreshProductEditor();
    }));
  }

  const primary = productField("primaryCategory", "Kategori utama", "select", productDraft.primaryCategory,
  {
    required: true, searchable: true,
    choices: [["", "Pilih kategori utama"], ...productDraft.categories.map((id) =>
    {
      return [id, catalogCategories.find((category) => category.id === id)?.name || id];
    })],
    help: "Dipakai sebagai kategori utama; kategori tambahan tetap dapat difilter.",
    bind: (value) => productDraft.primaryCategory = value
  });
  categories.append(categoryLabel, categorySearchLabel, categorySearch, choices, primary);
  const attributeList = pNode("div");

  productDraft.attributes.forEach((attribute, index) =>
  {
    const row = pNode("div", "product-attribute-row");
    row.append(
      productField(`attribute-${index}-name`, "Atribut", "text", attribute.name,
      {
        maxLength: 80, bind: (value) => attribute.name = value
      }),
      productField(`attribute-${index}-value`, "Nilai", "text", attribute.value,
      {
        maxLength: 300, bind: (value) => attribute.value = value
      }),
      pButton("Hapus", "remove-attribute", false, { index })
    );
    attributeList.append(row);
  });
  categories.append(attributeList, pButton("Tambah atribut", "add-attribute"));
  const variants = productFormSection("variants", "Varian, harga, dan satuan", "Setiap kombinasi yang memiliki harga atau stok berbeda membutuhkan SKU unik.");

  if (productDraft.type === "kit")
  {
    const locked = productDraft.variants.some((variant) => catalogLedger.some((entry) => entry.variantId === variant.id));
    variants.append(productField("stockMode", "Aturan stok paket", "select", productDraft.stockMode,
    {
      choices: [["independent", "Stok paket mandiri"], ["components", "Mengikuti komponen"]],
      disabled: locked,
      help: locked ? "SKU dengan riwayat stok tidak dapat dikonversi melalui edit katalog."
        : "Stok komponen dihitung dari komponen paling terbatas; tidak memiliki saldo paket terpisah.",
      bind: (value) =>
      {
        productDraft.stockMode = value;

        if (value === "independent")
        {
          productDraft.variants.forEach((variant) => variant.components = []);
        }
      },
      change: refreshProductEditor
    }));
  }

  const generator = pNode("details", "product-variant-editor");
  productVariantDisclosure(generator, "generator");
  generator.append(pNode("summary", "", "Buat kombinasi varian"));
  generator.append(pNode("p", "product-help", "Isi nama pilihan dan nilainya, dipisahkan koma. Kombinasi baru ditambahkan tanpa menghapus SKU yang sudah ada."));

  for (let index = 0; index < 2; index += 1)
  {
    productDraft.variantOptions[index] ||= { name: "", values: "" };
    const option = productDraft.variantOptions[index];
    const row = pNode("div", "product-fields");
    row.append(
      productField(`option-${index}-name`, index === 0 ? "Pilihan pertama" : "Pilihan kedua (opsional)", "text", option.name,
      {
        help: index === 0 ? "Contoh: Ukuran" : "Contoh: Warna",
        bind: (value) => option.name = value
      }),
      productField(`option-${index}-values`, "Nilai pilihan", "text", option.values,
      {
        help: index === 0 ? "Contoh: S, M, L" : "Contoh: Putih, Mint",
        bind: (value) => option.values = value
      })
    );
    generator.append(row);
  }

  generator.append(pButton("Tambahkan kombinasi", "generate-variants"));
  variants.append(generator);

  productDraft.variants.forEach((variant, index) => variants.append(renderCatalogVariantEditor(variant, index)));
  variants.append(pButton("Tambah satu varian", "add-variant"));
  variants.append(pNote("Stok awal varian baru adalah 0. Setelah produk disimpan, gunakan Catat stok untuk menerima barang."));
  const photos = productFormSection("photos", "Foto produk", "Unggah 1–8 foto JPG, PNG, atau WebP. Maksimal 5 MB per foto pada pratinjau ini.");
  const photoGrid = pNode("div", "product-photo-grid");

  productDraft.photos.forEach((photo, index) =>
  {
    const figure = pNode("figure");
    const image = pNode("img");
    image.src = photo.url;
    image.alt = photo.alt || productDraft.name || "Pratinjau foto produk";
    const caption = pNode("figcaption", "", index === 0 ? "Foto utama" : `Foto ${index + 1}`);
    const actions = pNode("div", "product-inline-actions");
    actions.append(pButton("Jadikan utama", "main-photo", false, { index }), pButton("Hapus", "remove-photo", false, { index }));
    actions.firstElementChild.disabled = index === 0;
    figure.append(image, caption,
      productField(`photo-${index}-alt`, "Deskripsi foto", "text", photo.alt,
      {
        maxLength: 180, bind: (value) => photo.alt = value
      }), actions);
    photoGrid.append(figure);
  });
  photos.append(photoGrid);

  if (!productDraft.photos.length)
  {
    photos.append(pNote("Minimal satu foto diperlukan untuk menyimpan produk.", true));
  }

  const uploadLabel = pNode("label", "product-upload-label", "Pilih foto produk");
  uploadLabel.htmlFor = "product-photo-files";
  uploadLabel.prepend(pIcon("photo"));
  const upload = pNode("input", "product-photo-file");
  upload.type = "file";
  upload.multiple = true;
  upload.accept = "image/jpeg,image/png,image/webp";
  upload.id = "product-photo-files";
  upload.setAttribute("aria-describedby", "product-photo-error");
  upload.addEventListener("change", uploadCatalogPhotos);
  const photoError = pNode("p", "product-field-error");
  photoError.id = "product-photo-error";
  photoError.setAttribute("role", "alert");
  photos.append(uploadLabel, upload, photoError);
  photos.append(pButton("Gunakan foto ilustrasi", "example-photo"));
  const shipping = productFormSection("shipping", "Penanganan dan publikasi", "Berat dan dimensi ditetapkan pada setiap varian agar ongkir dapat dihitung dengan benar.");
  const shippingFields = pNode("div", "product-fields");
  shippingFields.append(
    productField("handling", "Jenis penanganan", "select", productDraft.handling,
    {
      required: true,
      choices: [["durable", "Tahan lama"], ["perishable", "Mudah layu"]],
      bind: (value) => productDraft.handling = value,
      change: refreshProductEditor
    }),
    productField("status", "Status katalog", "select", productDraft.status,
    {
      choices: [["active", "Aktif"], ["inactive", "Nonaktif"]],
      bind: (value) => productDraft.status = value
    }),
    productField("care", "Perawatan / penggunaan", "textarea", productDraft.care,
    {
      wide: true, maxLength: 4000, help: "Gunakan informasi produk yang telah diverifikasi.",
      bind: (value) => productDraft.care = value
    }),
    productField("shippingNote", "Catatan pengemasan / pengiriman", "textarea", productDraft.shippingNote,
    {
      wide: true, maxLength: 2000, bind: (value) => productDraft.shippingNote = value
    })
  );
  shipping.append(shippingFields);

  if (productDraft.handling === "perishable")
  {
    shipping.append(pNote("Mudah layu: wajib tanggal dan slot kirim serta layanan instan/same-day. Aturan ini mengikuti produk saat checkout.", true));
  }

  if (catalogState.mode === "edit")
  {
    shipping.append(productField("editReason", "Alasan perubahan", "textarea", productDraft.editReason,
    {
      required: true, wide: true, maxLength: 1000,
      help: "Dicatat bersama pelaku dan rincian perubahan; pesanan lama mempertahankan snapshot.",
      bind: (value) => productDraft.editReason = value
    }));
  }

  fields.append(basics, categories, variants, photos, shipping);
  const aside = pNode("aside", "product-editor-context");
  aside.append(pNode("h2", "", "Kesiapan produk"));
  const readinessDisclosure = pNode("details", "product-readiness-disclosure");
  readinessDisclosure.open = innerWidth >= 640;
  const readinessTitle = pNode("summary");
  readinessTitle.id = "product-readiness-title";
  const readiness = pNode("ul", "product-readiness");
  readiness.id = "product-readiness";
  readinessDisclosure.append(readinessTitle, readiness,
    pNote("Perubahan disimpan sekaligus. Menyimpan katalog tidak mengubah stok atau harga pesanan lama."));
  aside.append(readinessDisclosure);
  layout.append(fields, aside);
  const saveBar = pNode("div", "product-save-bar");
  const saveState = pNode("p", "", productDirty ? "Ada perubahan belum disimpan" : "Belum ada perubahan");
  saveState.id = "product-save-state";
  const actions = pNode("div");
  const submit = pButton("Simpan produk", "");
  submit.removeAttribute("data-action");
  submit.classList.add("queue-button--primary");
  submit.type = "submit";
  submit.id = "save-product";
  actions.append(pButton("Batal", "cancel-editor"), submit);
  saveBar.append(saveState, actions);
  form.append(layout, saveBar);
  form.addEventListener("submit", saveCatalogProduct);
  form.addEventListener("focusin", (event) =>
  {
    if (!event.target.matches("input, select, textarea, button"))
    {
      return;
    }

    const control = event.target.getBoundingClientRect();
    const top = navigation.getBoundingClientRect().bottom + 12;
    const bottom = saveBar.getBoundingClientRect().top - 12;

    if (!saveBar.contains(event.target) && (control.top < top || control.bottom > bottom))
    {
      window.scrollBy(0, control.top < top ? control.top - top : control.bottom - bottom);
    }
  });
  root.append(navigation, form);
  renderProductReadiness();
  requestAnimationFrame(() =>
  {
    document.documentElement.style.setProperty("--product-editor-nav-height", `${navigation.offsetHeight}px`);
    updateProductEditorNavigation();
    window.adminControls?.enhanceSelects();
  });
}

function updateProductEditorNavigation()
{
  const navigation = document.querySelector(".product-editor-nav");

  if (!navigation || document.getElementById("product-editor-view").hidden)
  {
    return;
  }

  const sections = [...document.querySelectorAll("#product-editor-form .product-form-section")];
  const offset = navigation.getBoundingClientRect().bottom + 24;
  const atBottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
  const current = atBottom ? sections.at(-1)
    : sections.filter((section) => section.getBoundingClientRect().top <= offset).at(-1) || sections[0];
  navigation.querySelectorAll("a").forEach((link) =>
  {
    if (`edit-${link.dataset.editorSection}` === current?.id)
    {
      link.setAttribute("aria-current", "location");
    }
    else
    {
      link.removeAttribute("aria-current");
    }
  });
}

let productEditorScrollQueued = false;
window.addEventListener("scroll", () =>
{
  if (!productEditorScrollQueued)
  {
    productEditorScrollQueued = true;
    requestAnimationFrame(() =>
    {
      productEditorScrollQueued = false;
      updateProductEditorNavigation();
    });
  }
}, { passive: true });

function renderCatalogVariantEditor(variant, index)
{
  const section = pNode("details", "product-variant-editor");
  productVariantDisclosure(section, variant.id);
  const summary = pNode("summary", "", `${variant.name || "Varian tanpa nama"}, ${variant.sku || "SKU belum diisi"}`);
  section.append(summary);
  const fields = pNode("div", "product-fields");
  const field = (key, label, type, options = {}) => productField(`${variant.id}-${key}`, label, type, variant[key],
  {
    ...options,
    bind: (value) =>
    {
      variant[key] = value;

      if (key === "name" || key === "sku")
      {
        summary.textContent = `${variant.name || "Varian tanpa nama"}, ${variant.sku || "SKU belum diisi"}`;
      }
    }
  });
  const units = productUnitsFor(productDraft.type);
  const lockedUnit = catalogVariantReferenced(variant.id);
  const unitChoices = units.includes(variant.unit) ? units : [...units, variant.unit];
  fields.append(
    field("name", "Nama varian", "text", { required: true, maxLength: 100 }),
    field("sku", "SKU", "text", { required: true, maxLength: 64, help: "Unik di seluruh produk, termasuk produk nonaktif." }),
    field("price", "Harga normal (Rp)", "number", { required: true, min: 1 }),
    field("unit", "Satuan jual", "select",
    {
      required: true,
      choices: unitChoices,
      disabled: lockedUnit,
      searchable: unitChoices.length > 4,
      help: lockedUnit ? "Satuan SKU dengan riwayat atau referensi tidak diubah melalui edit katalog."
        : "Pilihan satuan mengikuti jenis produk."
    }),
    field("salePrice", "Harga diskon (Rp)", "number", { min: 0, help: "Isi 0 jika tidak ada diskon." }),
    field("saleStart", "Mulai diskon", "date"),
    field("saleEnd", "Akhir diskon", "date"),
    field("weight", "Berat (gram)", "number", { required: true, min: 1 }),
    field("length", "Panjang (cm)", "number", { required: true, min: 0.1, step: "0.1" }),
    field("width", "Lebar (cm)", "number", { required: true, min: 0.1, step: "0.1" }),
    field("height", "Tinggi (cm)", "number", { required: true, min: 0.1, step: "0.1" })
  );
  section.append(fields, productCheck(`${variant.id}-active`, "Varian aktif", variant.active, (checked) => variant.active = checked));
  const existing = findCatalogVariant(variant.id);
  const hasUnbatchedBalance = !variant.batchTracked && Object.keys(productLocations)
    .some((locationId) => catalogStock(variant, locationId).balance > 0);
  const canChangeBatch = !variant.batches.some((batch) => batch.quantity > 0) && !hasUnbatchedBalance;
  section.append(productCheck(`${variant.id}-batchTracked`, "Lacak batch dan tanggal kedaluwarsa", variant.batchTracked, (checked) =>
  {
    variant.batchTracked = checked;
  }, !canChangeBatch));

  if (hasUnbatchedBalance)
  {
    section.append(pNode("p", "product-help", "SKU bersaldo tanpa batch memerlukan pencatatan konversi terlebih dahulu. Pelacakan batch tidak diubah melalui edit katalog ini."));
  }

  if (variant.batchTracked)
  {
    section.append(pNode("p", "product-help", "Nomor batch dan kedaluwarsa dicatat saat penerimaan. Gunakan batch dengan kedaluwarsa terdekat saat relevan."));
  }

  if (productDraft.stockMode === "components")
  {
    const componentOptions = catalogProducts.filter((product) => product.id !== productDraft.id)
      .flatMap((product) => product.variants.filter((entry) => !entry.components.length)
        .map((entry) => [entry.id, `${entry.sku}, ${product.name}, ${entry.unit}`]));
    variant.components.forEach((component, componentIndex) =>
    {
      const row = pNode("div", "product-component-row");
      row.append(
        productField(`${variant.id}-component-${componentIndex}`, "SKU komponen", "select", component.variantId,
        {
          choices: [["", "Pilih komponen"], ...componentOptions],
          bind: (value) => component.variantId = value
        }),
        productField(`${variant.id}-quantity-${componentIndex}`, "Jumlah per paket", "number", component.quantity,
        {
          required: true, min: 1, bind: (value) => component.quantity = value
        }),
        pButton("Hapus", "remove-component", false, { variant: variant.id, index: componentIndex })
      );
      section.append(row);
    });
    section.append(pButton("Tambah komponen", "add-component", false, { variant: variant.id }));
  }

  const remove = pButton("Hapus varian", "remove-variant", false, { variant: variant.id });
  remove.disabled = Boolean(existing && catalogVariantReferenced(variant.id));
  remove.setAttribute("aria-describedby", `variant-${variant.id}-help`);
  const help = pNode("p", "product-help", remove.disabled
    ? "Varian memiliki riwayat, reservasi, pengajuan stok, atau dipakai paket. Gunakan Nonaktif agar referensinya tetap tersedia."
    : "Varian yang belum memiliki riwayat dapat dihapus dari produk.");
  help.id = `variant-${variant.id}-help`;
  section.append(remove, help);
  return section;
}

function renderProductReadiness()
{
  const container = document.getElementById("product-readiness");

  if (!container || !productDraft)
  {
    return;
  }

  const checks =
  [
    ["Nama produk", productDraft.name.trim().length >= 3],
    ["Kategori utama", productDraft.categories.includes(productDraft.primaryCategory)],
    ["SKU dan harga", productDraft.variants.length > 0 && productDraft.variants.every((variant) => variant.sku.trim() && variant.price > 0)],
    ["Foto produk", productDraft.photos.length > 0],
    ["Berat dan dimensi", productDraft.variants.every((variant) => variant.weight > 0 && variant.length > 0 && variant.width > 0 && variant.height > 0)]
  ];
  container.replaceChildren();
  const missing = checks.filter(([, complete]) => !complete).length;
  const title = document.getElementById("product-readiness-title");
  title.replaceChildren(
    pIcon(missing ? "alert" : "check"),
    pNode("span", "", missing ? `${missing} bagian belum lengkap` : "5 dari 5 bagian terisi"),
    pIcon("chevron")
  );
  title.classList.toggle("is-missing", missing > 0);

  for (const [label, complete] of checks)
  {
    const row = pNode("li", complete ? "is-complete" : "is-missing");
    row.append(pIcon(complete ? "check" : "alert"), pNode("span", "", `${label}: ${complete ? "terisi" : "belum lengkap"}`));
    container.append(row);
  }
}

function validateCatalogProduct(product)
{
  const errors = [];
  const add = (field, message) => errors.push({ field, message });

  if (product.name.trim().length < 3 || product.name.length > 120)
  {
    add("name", "Nama produk harus berisi 3–120 karakter.");
  }

  if (!product.categories.length || !product.categories.includes(product.primaryCategory))
  {
    add("primaryCategory", "Pilih minimal satu kategori dan tetapkan kategori utama.");
  }

  if (product.photos.length < 1 || product.photos.length > productLimits.photos)
  {
    add("photo-files", "Tambahkan 1–8 foto produk.");
  }

  if (!product.variants.length)
  {
    add("name", "Produk harus mempunyai minimal satu varian.");
  }

  if (product.status === "active" && !product.variants.some((variant) => variant.active))
  {
    add("status", "Aktifkan minimal satu varian sebelum mengaktifkan produk.");
  }

  if (product.stockMode === "components" && product.type !== "kit")
  {
    add("type", "Stok berbasis komponen memakai jenis Paket berkebun. Pilih jenis tersebut untuk mengatur aturan stok paket.");
  }

  const skus = new Set();
  const names = new Set();

  for (const variant of product.variants)
  {
    const sku = variant.sku.trim().toLocaleUpperCase("id");
    const name = variant.name.trim().toLocaleLowerCase("id");
    const outsideDuplicate = catalogProducts.some((entry) => entry.id !== product.id
      && entry.variants.some((candidate) => candidate.sku.toLocaleUpperCase("id") === sku));

    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$/.test(sku) || skus.has(sku) || outsideDuplicate)
    {
      add(`${variant.id}-sku`, `${variant.name}: SKU harus unik, 2–64 karakter, memakai huruf, angka, titik, garis bawah, atau tanda hubung.`);
    }

    if (!name || names.has(name))
    {
      add(`${variant.id}-name`, "Nama setiap varian harus diisi dan berbeda dalam satu produk.");
    }

    skus.add(sku);
    names.add(name);

    if (!Number.isSafeInteger(variant.price) || variant.price <= 0)
    {
      add(`${variant.id}-price`, `${variant.name}: harga harus berupa rupiah bulat lebih dari 0.`);
    }

    if (!productUnitsFor(product.type).includes(variant.unit))
    {
      add(`${variant.id}-unit`, `${variant.name}: satuan tidak sesuai jenis produk. Gunakan SKU baru untuk satuan berbeda pada barang yang sudah memiliki riwayat.`);
    }

    const originalVariant = findCatalogVariant(variant.id)?.variant;

    if (originalVariant && catalogVariantReferenced(variant.id) && originalVariant.unit !== variant.unit)
    {
      add(`${variant.id}-unit`, `${variant.name}: satuan dengan riwayat stok tidak dapat diganti tanpa proses konversi.`);
    }

    for (const [key, label] of [["weight", "Berat"], ["length", "Panjang"], ["width", "Lebar"], ["height", "Tinggi"]])
    {
      if (!Number.isFinite(variant[key]) || variant[key] <= 0)
      {
        add(`${variant.id}-${key}`, `${variant.name}: ${label} harus lebih dari 0.`);
      }
    }

    if (!Number.isSafeInteger(variant.salePrice) || variant.salePrice < 0 || variant.salePrice >= variant.price)
    {
      if (variant.salePrice !== 0)
      {
        add(`${variant.id}-salePrice`, `${variant.name}: harga diskon harus berupa rupiah bulat di bawah harga normal.`);
      }
    }

    if (variant.salePrice > 0 && (!variant.saleStart || !variant.saleEnd || variant.saleStart > variant.saleEnd))
    {
      add(`${variant.id}-saleEnd`, `${variant.name}: isi periode diskon dengan tanggal akhir setelah atau sama dengan tanggal mulai.`);
    }

    if (product.stockMode === "components")
    {
      const componentIds = new Set();

      if (!variant.components.length)
      {
        add(`${variant.id}-name`, `${variant.name}: tambahkan minimal satu komponen paket.`);
      }

      for (const component of variant.components)
      {
        const found = findCatalogVariant(component.variantId);

        if (!found || found.product.id === product.id || found.variant.components.length
          || componentIds.has(component.variantId) || !Number.isSafeInteger(component.quantity) || component.quantity <= 0)
        {
          add(`${variant.id}-name`, `${variant.name}: pilih komponen berbeda dengan jumlah bulat lebih dari 0. Paket bertingkat tidak didukung pada pratinjau.`);
        }

        componentIds.add(component.variantId);
      }
    }
  }

  for (const [index, attribute] of product.attributes.entries())
  {
    if (!attribute.name.trim() || !attribute.value.trim())
    {
      add(`attribute-${index}-name`, "Nama dan nilai atribut harus diisi, atau hapus baris atribut tersebut.");
    }
  }

  return errors;
}

function showProductErrors(form, errors)
{
  form.querySelectorAll('[aria-invalid="true"]').forEach((input) => input.removeAttribute("aria-invalid"));
  form.querySelectorAll(".product-field-error").forEach((error) => error.hidden = true);
  const summary = form.querySelector(".product-error-summary");
  summary.hidden = false;
  summary.replaceChildren(pNode("strong", "", "Periksa isian berikut sebelum menyimpan."));
  const list = pNode("ul");

  for (const error of errors)
  {
    const input = document.getElementById(`product-${error.field}`);
    const item = pNode("li");
    const link = pNode("a", "", error.message);
    link.href = `#product-${error.field}`;
    link.addEventListener("click", (event) =>
    {
      if (input)
      {
        event.preventDefault();
        input.closest("details")?.setAttribute("open", "");
        const control = window.adminControls?.getControl(input) || input;
        control.focus();
      }
    });
    item.append(link);
    list.append(item);

    if (input)
    {
      input.setAttribute("aria-invalid", "true");
      const message = document.getElementById(`${input.id}-error`);

      if (message)
      {
        message.hidden = false;
        message.textContent = error.message;
      }
    }
  }

  summary.append(list);
  summary.focus();
}

async function saveCatalogProduct(event)
{
  event.preventDefault();
  const errors = validateCatalogProduct(productDraft);

  if (catalogState.mode === "edit" && productDraft.editReason.trim().length < 5)
  {
    errors.push({ field: "editReason", message: "Tuliskan alasan perubahan minimal 5 karakter." });
  }

  if (errors.length)
  {
    showProductErrors(event.currentTarget, errors);
    return;
  }

  const form = event.currentTarget;
  const original = findCatalogProduct();
  const priceChanges = [];
  const guardedChanges = [];

  if (original)
  {
    for (const variant of productDraft.variants)
    {
      const previous = original.variants.find((entry) => entry.id === variant.id);

      if (!previous)
      {
        continue;
      }

      const before = catalogFinalPrice(previous);
      const after = catalogFinalPrice(variant);

      if (previous.price !== variant.price || before !== after || previous.salePrice !== variant.salePrice
        || previous.saleStart !== variant.saleStart || previous.saleEnd !== variant.saleEnd)
      {
        const change = `${variant.sku}: harga normal ${productMoney(previous.price)} menjadi ${productMoney(variant.price)}; ` +
          `harga berlaku ${productMoney(before)} menjadi ${productMoney(after)}.` +
          (variant.salePrice > 0 ? ` Diskon ${productMoney(variant.salePrice)}, ${variant.saleStart} sampai ${variant.saleEnd}.` : "");
        priceChanges.push(change);
        const previousPlannedPrice = previous.salePrice > 0 ? previous.salePrice : previous.price;
        const plannedPrice = variant.salePrice > 0 ? variant.salePrice : variant.price;

        if (Math.abs(variant.price - previous.price) / previous.price > productLimits.priceChange
          || Math.abs(after - before) / before > productLimits.priceChange
          || Math.abs(plannedPrice - previousPlannedPrice) / previousPlannedPrice > productLimits.priceChange)
        {
          guardedChanges.push(change);
        }
      }
    }
  }

  const waiting = original ? catalogReservations.filter((entry) =>
  {
    return original.variants.some((variant) => variant.id === entry.variantId) && entry.status === "active";
  }).length : 0;
  const deactivating = original?.status === "active" && productDraft.status === "inactive";

  if (guardedChanges.length || deactivating)
  {
    const accepted = await confirmCatalog(guardedChanges.length ? "Perubahan harga lebih dari 50%" : "Nonaktifkan produk?",
    [
      ...guardedChanges,
      ...(deactivating ? ["Produk akan disembunyikan dari katalog pembelian baru."] : []),
      `${waiting} pesanan Menunggu Pembayaran tetap memakai harga snapshot. Reservasi dan stok pesanan lama tidak diubah.`,
      guardedChanges.length ? "Perubahan harga besar dicatat sebagai peringatan SuperAdmin pada pratinjau ini." : ""
    ].filter(Boolean), "Simpan perubahan");

    if (!accepted)
    {
      return;
    }
  }

  const saved = structuredClone(productDraft);
  saved.name = saved.name.trim();
  saved.variants.forEach((variant) => variant.sku = variant.sku.trim().toLocaleUpperCase("id"));
  const reason = saved.editReason || "Produk baru ditambahkan melalui form katalog.";
  delete saved.editReason;
  const success = await saveCatalog(() =>
  {
    if (original)
    {
      Object.assign(original, saved);
      catalogHistory(original, "Katalog diperbarui", [reason, ...priceChanges].join(" "));
    }
    else
    {
      catalogProducts.push(saved);
      catalogHistory(saved, "Produk ditambahkan", reason);
    }

    if (guardedChanges.length)
    {
      catalogNotices.push({ productId: saved.id, text: guardedChanges.join(" "), actor: catalogActor() });
    }
  }, guardedChanges.length ? "Produk disimpan. Peringatan perubahan harga besar dicatat untuk SuperAdmin."
    : "Produk disimpan. Harga pesanan yang sudah dibuat tetap memakai snapshot.", form);

  if (success)
  {
    catalogState.product = saved.id;
    catalogState.mode = "view";
    catalogState.tab = "info";
    catalogLoadState = "full";
    productDraft = null;
    writeCatalogUrl();
    renderCatalog();
    window.scrollTo(0, 0);
  }
}

async function uploadCatalogPhotos(event)
{
  const files = [...event.target.files];
  const errorMessages = [];

  for (const file of files)
  {
    if (productDraft.photos.length >= productLimits.photos)
    {
      errorMessages.push("Maksimal delapan foto per produk.");
      break;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > productLimits.fileBytes)
    {
      errorMessages.push(`${file.name}: gunakan JPG, PNG, atau WebP maksimal 5 MB.`);
      continue;
    }

    const url = URL.createObjectURL(file);

    try
    {
      const image = new Image();
      image.src = url;
      await image.decode();
      catalogObjectUrls.add(url);
      productDraft.photos.push({ url, name: file.name, alt: productDraft.name || "Foto produk" });
      markProductDirty();
    }
    catch
    {
      URL.revokeObjectURL(url);
      errorMessages.push(`${file.name}: gambar tidak dapat dibaca. Pilih berkas lain.`);
    }
  }

  refreshProductEditor();
  document.getElementById("product-photo-error").textContent = errorMessages.join(" ");
}

async function productEditorAction(button)
{
  const action = button.dataset.action;

  if (!productDraft)
  {
    await productTaskAction(button);
    return;
  }

  const variant = productDraft.variants.find((entry) => entry.id === button.dataset.variant);
  const index = Number(button.dataset.index);
  let focusedVariant = "";

  if (action === "add-variant")
  {
    const next = blankCatalogVariant();
    next.name = `Varian ${productDraft.variants.length + 1}`;
    productDraft.variants.push(next);
    productVariantEditorId = next.id;
    focusedVariant = next.id;
  }
  else if (action === "remove-variant")
  {
    if (productDraft.variants.length <= 1)
    {
      catalogFeedback("Produk membutuhkan minimal satu varian.", true);
      return;
    }

    if (catalogVariantReferenced(variant.id))
    {
      return;
    }

    productDraft.variants = productDraft.variants.filter((entry) => entry.id !== variant.id);
  }
  else if (action === "add-attribute")
  {
    productDraft.attributes.push({ name: "", value: "" });
  }
  else if (action === "remove-attribute")
  {
    productDraft.attributes.splice(index, 1);
  }
  else if (action === "example-photo")
  {
    if (productDraft.photos.length >= productLimits.photos)
    {
      catalogFeedback("Maksimal delapan foto per produk.", true);
      return;
    }

    const key = productDraft.type === "florist" ? "bouquet" : productDraft.type === "plant" ? "plant" : "garden";
    productDraft.photos.push(structuredClone(catalogPhotos[key]));
  }
  else if (action === "remove-photo")
  {
    productDraft.photos.splice(index, 1);
  }
  else if (action === "main-photo")
  {
    productDraft.photos.unshift(...productDraft.photos.splice(index, 1));
  }
  else if (action === "add-component")
  {
    variant.components.push({ variantId: "", quantity: 1 });
  }
  else if (action === "remove-component")
  {
    variant.components.splice(index, 1);
  }
  else if (action === "generate-variants")
  {
    const options = productDraft.variantOptions.filter((option) => option.name.trim() || option.values.trim());

    if (!options.length || options.some((option) => !option.name.trim() || !option.values.trim()))
    {
      catalogFeedback("Isi nama pilihan dan nilainya sebelum membuat kombinasi.", true);
      return;
    }

    const lists = options.map((option) => [...new Set(option.values.split(",").map((value) => value.trim()).filter(Boolean))]);
    const combinations = lists.reduce((rows, values) => rows.flatMap((row) => values.map((value) => [...row, value])), [[]]);

    if (combinations.length > 30)
    {
      catalogFeedback("Batasi kombinasi menjadi maksimal 30 varian per pembuatan pada pratinjau ini.", true);
      return;
    }

    for (const combination of combinations)
    {
      const name = combination.map((value, optionIndex) => `${options[optionIndex].name}: ${value}`).join(", ");

      if (!productDraft.variants.some((entry) => entry.name === name))
      {
        const next = blankCatalogVariant();
        next.name = name;
        next.sku = `RG-NEW-${productSequence}`;
        productDraft.variants.push(next);
        focusedVariant ||= next.id;
      }
    }

    if (focusedVariant)
    {
      productVariantEditorId = focusedVariant;
    }
  }
  else
  {
    return;
  }

  markProductDirty();
  refreshProductEditor();

  if (focusedVariant)
  {
    document.getElementById(`variant-editor-${focusedVariant}`)?.scrollIntoView({ block: "start" });
    document.getElementById(`product-${focusedVariant}-name`)?.focus({ preventScroll: true });
  }
}

function renderProductTask()
{
  const root = document.getElementById("product-task-view");
  root.replaceChildren();
  const back = pButton("Kembali tanpa menyimpan", "cancel-task");
  back.className = "queue-text-button back-button";
  back.prepend(pIcon("chevron"));
  root.append(back);

  if (productTask.kind === "categories")
  {
    renderCategoryTask(root);
    return;
  }

  const form = pNode("form", "product-form-section");
  form.id = "product-stock-form";
  form.noValidate = true;
  const error = pNode("div", "product-error-summary");
  error.hidden = true;
  error.tabIndex = -1;
  error.setAttribute("role", "alert");
  form.append(error);
  const layout = pNode("div", "product-task-layout");
  const aside = pNode("aside");

  if (productTask.kind === "movement")
  {
    renderMovementTask(form, aside);
  }
  else
  {
    renderApprovalTask(form, aside);
  }

  layout.append(form, aside);
  root.append(layout);

  if (productTask.kind === "movement")
  {
    syncMovementQuantityBounds();
    renderMovementPreview();
  }

  window.adminControls?.enhanceSelects();
}

function taskField(key, label, type, options = {})
{
  return productField(`task-${key}`, label, type, productTask.values[key],
  {
    ...options,
    bind: (value) => productTask.values[key] = value
  });
}

function refreshProductTask()
{
  const focusedId = document.activeElement?.id;
  const scrollPosition = scrollY;
  renderProductTask();
  document.getElementById(focusedId)?.focus({ preventScroll: true });
  window.scrollTo(0, scrollPosition);
}

function renderMovementTask(form, aside)
{
  const variants = catalogProducts.flatMap((product) => product.variants
    .filter((variant) => !variant.components.length)
    .map((variant) => [variant.id, `${variant.sku}, ${product.name}, ${variant.unit}`]));
  productTask.values ||=
  {
    variant: productTask.variant || variants[0]?.[0] || "",
    type: "receipt",
    quantity: "",
    destination: catalogState.location === "pusat" ? "toko" : "pusat",
    reason: "",
    reference: "",
    batch: "",
    expires: ""
  };
  const values = productTask.values;
  const found = findCatalogVariant(values.variant);
  form.append(pNode("h2", "", "Rincian mutasi"));
  form.append(pNode("p", "product-help", `Lokasi sumber: ${productLocations[catalogState.location]}. Setiap perubahan memerlukan alasan dan referensi.`));
  const fields = pNode("div", "product-fields");
  fields.append(
    taskField("variant", "Produk / SKU", "select",
    {
      required: true, wide: true, choices: variants,
      searchable: true,
      change: () =>
      {
        values.batch = "";
        values.expires = "";
        refreshProductTask();
      }
    }),
    taskField("type", "Jenis mutasi", "select",
    {
      required: true,
      choices: [["receipt", "Barang masuk"], ["adjustment", "Penyesuaian stok"], ["damage", "Rusak / buang"], ["transfer", "Transfer lokasi"]],
      change: refreshProductTask
    }),
    taskField("quantity", values.type === "adjustment" ? "Perubahan jumlah (+/−)"
      : values.type === "transfer" ? "Jumlah dipindahkan"
      : values.type === "damage" ? "Jumlah dikurangi" : "Jumlah diterima", "number",
    {
      required: true, preserveEmpty: true,
      min: values.type === "adjustment" ? -catalogStock(found?.variant || { id: "", components: [] }).available : 1,
      help: values.type === "adjustment" ? "Gunakan angka positif untuk menambah, negatif untuk mengurangi."
        : `Bilangan bulat dalam satuan ${found?.variant.unit || "jual"}.`
    })
  );
  const quantityInput = fields.querySelector("#product-task-quantity");
  quantityInput.addEventListener("keydown", (event) =>
  {
    const blocked = ["e", "E", ".", ","];

    if (values.type !== "adjustment")
    {
      blocked.push("-", "+");
    }

    if (blocked.includes(event.key))
    {
      event.preventDefault();
    }
  });
  quantityInput.addEventListener("input", () => syncMovementQuantityBounds(true), { capture: true });

  if (values.type === "transfer")
  {
    fields.append(taskField("destination", "Lokasi tujuan", "select",
    {
      required: true,
      choices: Object.entries(productLocations).filter(([key]) => key !== catalogState.location)
    }));
  }

  if (found?.variant.batchTracked)
  {
    fields.append(
      taskField("batch", "Nomor batch / lot", "text",
      {
        required: true,
        help: "Untuk pengurangan atau transfer, gunakan nomor batch yang tersedia di lokasi sumber."
      }),
      taskField("expires", "Tanggal kedaluwarsa", "date",
      {
        help: "Wajib saat menambah batch baru. Transfer mengikuti kedaluwarsa batch asal."
      })
    );
    const batches = found.variant.batches.filter((batch) => batch.location === catalogState.location && batch.quantity > 0)
      .sort((first, second) => first.expires.localeCompare(second.expires));
    form.append(pNote(batches.length ? `Batch tersedia: ${batches.map((batch) => `${batch.id} (${batch.quantity} ${found.variant.unit}, ${productDate(batch.expires)})`).join("; ")}.`
      : "Belum ada batch di lokasi ini. Penerimaan memerlukan nomor batch dan kedaluwarsa."));
  }

  fields.append(
    taskField("reference", "Referensi dokumen", "text",
    {
      required: true, maxLength: 100,
      help: "Contoh: nomor penerimaan, stok opname, atau dokumen transfer."
    }),
    taskField("reason", "Alasan / catatan", "textarea", { required: true, wide: true, maxLength: 1000 })
  );
  form.append(fields);

  if (values.type === "adjustment")
  {
    form.append(pNote(catalogState.role === "admin"
      ? "Penyesuaian lebih dari 20 unit akan diajukan ke SuperAdmin. Saldo tidak berubah sebelum disetujui."
      : "SuperAdmin dapat mencatat penyesuaian. Alasan, jumlah, dan pelaku tetap dicatat dalam mutasi."));
  }

  const preview = pNode("div");
  preview.id = "stock-change-preview";
  const buttons = pNode("div", "work-form-footer");
  const submit = pNode("button", "queue-button queue-button--primary", "Periksa dan simpan");
  submit.type = "submit";
  submit.id = "save-movement";
  const quantityNotice = pNode("p", "product-quantity-limit");
  quantityNotice.id = "product-quantity-limit";
  quantityNotice.hidden = true;
  quantityNotice.setAttribute("role", "status");
  quantityInput.setAttribute("aria-describedby", `${quantityInput.getAttribute("aria-describedby")} product-quantity-limit`);
  quantityInput.parentElement.append(quantityNotice);
  buttons.append(pButton("Batal", "cancel-task"), submit);
  form.append(preview, buttons);
  form.addEventListener("input", () =>
  {
    syncMovementQuantityBounds();
    renderMovementPreview();
  });
  form.addEventListener("submit", submitCatalogMovement);
  aside.append(pNode("h2", "", "Saldo sebelum perubahan"));

  if (found)
  {
    const stock = catalogStock(found.variant);
    aside.append(catalogFacts(
    [
      ["SKU", found.variant.sku],
      ["Saldo stok jual", `${stock.balance} ${found.variant.unit}`],
      ["Reservasi aktif", `${stock.reserved} ${found.variant.unit}`],
      ["Tersedia", catalogStockBadge(found.variant)]
    ]));
  }

  aside.append(pNote("Mutasi tidak boleh membuat saldo kurang dari reservasi aktif. Bahan produksi buket tidak tercampur di sini."));
  renderMovementPreview();
}

function movementDelta(values)
{
  return ["damage", "transfer"].includes(values.type) ? -Number(values.quantity) : Number(values.quantity);
}

function movementQuantityBounds(values)
{
  const found = findCatalogVariant(values.variant);

  if (!found)
  {
    return { min: 0, max: 0, available: 0, disabled: true, unit: "unit" };
  }

  const stock = catalogStock(found.variant);
  const batch = found.variant.batches.find((entry) => entry.id === values.batch && entry.location === catalogState.location);
  const available = Math.min(stock.available, batch ? batch.quantity : stock.available);
  const reducing = ["damage", "transfer"].includes(values.type);
  return {
    min: values.type === "adjustment" ? -available : reducing && available === 0 ? 0 : 1,
    max: reducing ? available : Number.MAX_SAFE_INTEGER - stock.balance,
    available,
    disabled: reducing && available === 0,
    unit: found.variant.unit
  };
}

function syncMovementQuantityBounds(report = false)
{
  const input = document.getElementById("product-task-quantity");

  if (!input || productTask?.kind !== "movement")
  {
    return;
  }

  const values = productTask.values;
  const bounds = movementQuantityBounds(values);
  const notice = document.getElementById("product-quantity-limit");
  input.min = bounds.min;
  input.max = bounds.max;
  input.step = "1";
  input.disabled = bounds.disabled;

  if (bounds.disabled)
  {
    input.value = "0";
    values.quantity = 0;
    notice.hidden = false;
    notice.textContent = "Stok bebas 0. Pengurangan atau transfer tidak tersedia; pilih SKU lain atau catat barang masuk.";
  }
  else if (input.value !== "" && Number.isFinite(Number(input.value)))
  {
    const quantity = Number(input.value);
    const bounded = Math.max(bounds.min, Math.min(bounds.max, Math.trunc(quantity)));

    if (bounded !== quantity)
    {
      input.value = String(bounded);
      values.quantity = bounded;
      notice.hidden = false;
      notice.textContent = !Number.isInteger(quantity)
        ? `Jumlah harus bilangan bulat. Nilai disesuaikan menjadi ${bounded} ${bounds.unit}.`
        : quantity < bounds.min && bounds.min === 1
          ? "Jumlah harus positif. Nilai dibatasi minimal 1."
          : quantity > bounds.max && !["damage", "transfer"].includes(values.type)
            ? "Jumlah melampaui batas bilangan bulat yang dapat disimpan dengan tepat."
            : `Jumlah dibatasi sesuai stok bebas: maksimal pengurangan ${bounds.available} ${bounds.unit}.`;
    }
    else if (report)
    {
      notice.hidden = true;
    }
  }
  else if (report)
  {
    notice.hidden = true;
  }

  const quantity = Number(input.value);
  const valid = input.value !== "" && Number.isSafeInteger(quantity) && quantity !== 0
    && quantity >= bounds.min && quantity <= bounds.max && !bounds.disabled;
  document.getElementById("save-movement").disabled = !valid || productSaving;
}

function renderMovementPreview()
{
  const root = document.getElementById("stock-change-preview");

  if (!root || !productTask?.values)
  {
    return;
  }

  const values = productTask.values;
  const found = findCatalogVariant(values.variant);
  root.replaceChildren();

  if (!found || !values.quantity)
  {
    return;
  }

  const stock = catalogStock(found.variant);
  const delta = movementDelta(values);
  const bounds = movementQuantityBounds(values);

  if (!Number.isSafeInteger(Number(values.quantity)) || Number(values.quantity) < bounds.min
    || Number(values.quantity) > bounds.max || stock.balance + delta < stock.reserved)
  {
    return;
  }
  const pending = catalogState.role === "admin" && values.type === "adjustment" && Math.abs(delta) > productLimits.adjustment;
  root.append(pNote(pending
    ? `Pengajuan ${delta > 0 ? "+" : ""}${delta} ${found.variant.unit}; saldo tetap ${stock.balance} sampai disetujui SuperAdmin.`
    : `Saldo ${stock.balance} menjadi ${stock.balance + delta} ${found.variant.unit}; tersedia setelah perubahan ${stock.balance + delta - stock.reserved}.`,
  stock.balance + delta < stock.reserved));
}

function validateCatalogMovement(values, locationId = catalogState.location)
{
  const errors = [];
  const add = (field, message) => errors.push({ field: `task-${field}`, message });
  const found = findCatalogVariant(values.variant);
  const quantity = Number(values.quantity);

  if (!["receipt", "adjustment", "damage", "transfer"].includes(values.type))
  {
    add("type", "Pilih jenis mutasi yang tersedia.");
  }

  if (!found || found.variant.components.length)
  {
    add("variant", "Pilih SKU dengan stok mandiri. Stok paket komponen tidak dapat diubah langsung.");
    return errors;
  }

  if (!Number.isSafeInteger(quantity) || quantity === 0 || (values.type !== "adjustment" && quantity < 0))
  {
    add("quantity", "Jumlah harus bilangan bulat bukan 0. Gunakan jumlah positif kecuali pada penyesuaian.");
  }

  if (values.reason.trim().length < 5)
  {
    add("reason", "Tuliskan alasan minimal 5 karakter.");
  }

  if (!values.reference.trim())
  {
    add("reference", "Isi referensi dokumen agar mutasi dapat ditelusuri.");
  }

  const stock = catalogStock(found.variant, locationId);
  const delta = movementDelta(values);

  if (!Number.isSafeInteger(stock.balance + delta))
  {
    add("quantity", "Jumlah melampaui batas bilangan bulat yang dapat disimpan dengan tepat.");
  }

  if (stock.balance + delta < stock.reserved)
  {
    add("quantity", `Pengurangan melampaui stok bebas. Maksimal ${stock.available} ${found.variant.unit}; ${stock.reserved} sedang direservasi.`);
  }

  if (values.type === "transfer" && (!productLocations[values.destination] || values.destination === locationId))
  {
    add("destination", "Lokasi tujuan harus berbeda dari lokasi sumber.");
  }

  if (found.variant.batchTracked)
  {
    const batch = found.variant.batches.find((entry) => entry.id === values.batch && entry.location === locationId);

    if (!values.batch.trim())
    {
      add("batch", "Isi nomor batch / lot.");
    }

    if (delta < 0 && (!batch || batch.quantity < Math.abs(delta)))
    {
      add("batch", "Batch tidak ditemukan atau jumlah pada batch tersebut tidak mencukupi.");
    }

    if (delta > 0 && !batch && (!values.expires || values.expires <= "2026-11-04"))
    {
      add("expires", "Batch baru memerlukan tanggal kedaluwarsa setelah tanggal contoh hari ini.");
    }

    if (delta > 0 && batch && values.expires && values.expires !== batch.expires)
    {
      add("expires", "Kedaluwarsa tidak cocok dengan batch yang sudah ada. Gunakan nomor batch berbeda.");
    }
  }

  return errors;
}

function updateCatalogBatch(variant, locationId, batchId, quantity, expires)
{
  if (!variant.batchTracked)
  {
    return;
  }

  const batch = variant.batches.find((entry) => entry.id === batchId && entry.location === locationId);

  if (batch)
  {
    batch.quantity += quantity;
  }
  else
  {
    variant.batches.push({ id: batchId, location: locationId, quantity, expires });
  }
}

function recordCatalogMovement(values, locationId = catalogState.location)
{
  const errors = validateCatalogMovement(values, locationId);

  if (errors.length)
  {
    throw new Error(errors[0].message);
  }

  const found = findCatalogVariant(values.variant);
  const quantity = movementDelta(values);
  const typeNames = { receipt: "Barang masuk", adjustment: "Penyesuaian", damage: "Rusak / buang", transfer: "Transfer keluar" };
  const batch = found.variant.batches.find((entry) => entry.id === values.batch && entry.location === locationId);
  const expires = batch?.expires || values.expires;
  const entry =
  {
    id: `movement-${++productSequence}`,
    variantId: values.variant,
    location: locationId,
    quantity,
    type: typeNames[values.type],
    reason: values.reason.trim(),
    reference: values.reference.trim(),
    actor: catalogActor(),
    at: productSnapshotAt.toISOString(),
    batch: found.variant.batchTracked ? values.batch : ""
  };
  catalogLedger.push(entry);
  updateCatalogBatch(found.variant, locationId, values.batch, quantity, expires);

  if (values.type === "transfer")
  {
    catalogLedger.push(
    {
      ...entry,
      id: `movement-${++productSequence}`,
      location: values.destination,
      quantity: -quantity,
      type: "Transfer masuk",
      linkedEntry: entry.id
    });
    updateCatalogBatch(found.variant, values.destination, values.batch, -quantity, expires);
  }

  catalogHistory(found.product, `${typeNames[values.type]} ${quantity > 0 ? "+" : ""}${quantity} ${found.variant.unit}`,
    `${values.reason}. Referensi ${values.reference}. Lokasi ${productLocations[locationId]}.`);
}

async function submitCatalogMovement(event)
{
  event.preventDefault();
  const values = structuredClone(productTask.values);
  const errors = validateCatalogMovement(values);

  if (errors.length)
  {
    showProductErrors(event.currentTarget, errors);
    return;
  }

  const form = event.currentTarget;
  const found = findCatalogVariant(values.variant);
  const pending = catalogState.role === "admin" && values.type === "adjustment"
    && Math.abs(Number(values.quantity)) > productLimits.adjustment;
  const stock = catalogStock(found.variant);
  const accepted = await confirmCatalog(pending ? "Ajukan penyesuaian ke SuperAdmin?" : "Simpan mutasi stok?",
  [
    `${found.variant.sku}, ${productLocations[catalogState.location]}.`,
    pending ? "Saldo belum berubah sampai penyesuaian disetujui."
      : `Saldo ${stock.balance} menjadi ${stock.balance + movementDelta(values)} ${found.variant.unit}.`,
    values.type === "transfer" ? `Lokasi tujuan ${productLocations[values.destination]} menerima ${values.quantity} ${found.variant.unit}.` : "",
    `Referensi: ${values.reference}. Alasan: ${values.reason}.`
  ].filter(Boolean), pending ? "Ajukan" : "Simpan mutasi");

  if (!accepted)
  {
    return;
  }

  const success = await saveCatalog(() =>
  {
    if (pending)
    {
      catalogApprovals.push(
      {
        ...values,
        id: `adjustment-${++productSequence}`,
        variantId: values.variant,
        location: catalogState.location,
        quantity: Number(values.quantity),
        actor: catalogActor(),
        at: productSnapshotAt.toISOString(),
        status: "pending"
      });
      catalogHistory(found.product, "Penyesuaian diajukan", `${values.quantity} ${found.variant.unit}; ${values.reason}; ${values.reference}.`);
    }
    else
    {
      recordCatalogMovement(values);
    }
  }, pending ? "Pengajuan tersimpan. Saldo menunggu persetujuan SuperAdmin." : "Mutasi tersimpan dan saldo diperbarui.", form);

  if (success)
  {
    productTask = null;
    catalogState.mode = "view";

    if (pending)
    {
      catalogState.product = "";
      catalogState.workspace = "approvals";
    }
    else if (catalogState.product)
    {
      catalogState.tab = "stock";
    }
    else
    {
      catalogState.workspace = "movements";
    }

    writeCatalogUrl();
    renderCatalog();
    window.scrollTo(0, 0);
  }
}

function renderApprovalTask(form, aside)
{
  const request = catalogApprovals.find((entry) => entry.id === productTask.request);

  if (!request || catalogState.role !== "superadmin" || request.status !== "pending")
  {
    form.append(pNote("Pengajuan ini tidak tersedia untuk diputuskan oleh profil saat ini.", true));
    return;
  }

  productTask.values ||= { decision: "approve", reason: "" };
  const found = findCatalogVariant(request.variantId);
  const stock = catalogStock(found.variant, request.location);
  form.append(pNode("h2", "", `${found.product.name}, ${found.variant.sku}`));
  form.append(pNote(`${request.actor} mengajukan ${request.quantity > 0 ? "+" : ""}${request.quantity} ${found.variant.unit}. ${request.reason}`));
  form.append(catalogFacts(
  [
    ["Lokasi", productLocations[request.location]],
    ["Referensi", request.reference],
    ["Saldo saat ini", `${stock.balance} ${found.variant.unit}`],
    ["Setelah disetujui", `${stock.balance + request.quantity} ${found.variant.unit}`]
  ]));
  const fields = pNode("div", "product-fields");
  fields.append(
    taskField("decision", "Keputusan", "select",
    {
      required: true, choices: [["approve", "Setujui penyesuaian"], ["reject", "Tolak pengajuan"]]
    }),
    taskField("reason", "Alasan keputusan", "textarea", { required: true, wide: true, maxLength: 1000 })
  );
  const actions = pNode("div", "work-form-footer");
  const submit = pNode("button", "queue-button queue-button--primary", "Simpan keputusan");
  submit.type = "submit";
  submit.id = "save-adjustment-decision";
  actions.append(pButton("Batal", "cancel-task"), submit);
  form.append(fields, actions);
  form.addEventListener("submit", submitCatalogApproval);
  aside.append(pNode("h2", "", "Pemeriksaan SuperAdmin"));
  aside.append(pNote("Persetujuan memeriksa kembali saldo dan reservasi terkini. Menolak pengajuan tidak mengubah stok."));
}

async function submitCatalogApproval(event)
{
  event.preventDefault();
  const form = event.currentTarget;
  const values = structuredClone(productTask.values);
  const request = catalogApprovals.find((entry) => entry.id === productTask.request);

  if (catalogState.role !== "superadmin" || !request || request.status !== "pending")
  {
    catalogFeedback("Keputusan tidak dapat diterapkan pada profil atau status pengajuan ini.", true);
    return;
  }

  const errors = [];

  if (values.reason.trim().length < 5)
  {
    errors.push({ field: "task-reason", message: "Tuliskan alasan keputusan minimal 5 karakter." });
  }

  if (values.decision === "approve")
  {
    errors.push(...validateCatalogMovement(
    {
      variant: request.variantId,
      type: "adjustment",
      quantity: request.quantity,
      reason: request.reason,
      reference: request.reference,
      batch: request.batch || "",
      expires: request.expires || ""
    }, request.location));
  }

  if (errors.length)
  {
    showProductErrors(form, errors);
    return;
  }

  if (!await confirmCatalog("Simpan keputusan penyesuaian?",
    [values.decision === "approve" ? "Saldo stok akan berubah dan mutasi dicatat sekali." : "Pengajuan ditolak. Saldo stok tidak berubah.", values.reason],
  values.decision === "approve" ? "Setujui" : "Tolak"))
  {
    return;
  }

  if (await saveCatalog(() =>
  {
    if (request.status !== "pending")
    {
      throw new Error("Pengajuan sudah diputuskan. Muat kembali daftar persetujuan.");
    }

    if (values.decision === "approve")
    {
      recordCatalogMovement(
      {
        variant: request.variantId,
        type: "adjustment",
        quantity: request.quantity,
        reason: `${request.reason}. Disetujui: ${values.reason}`,
        reference: request.reference,
        batch: request.batch || "",
        expires: request.expires || ""
      }, request.location);
    }

    request.status = values.decision === "approve" ? "approved" : "rejected";
    request.checker = catalogActor();
    request.decisionReason = values.reason.trim();
    catalogHistory(findCatalogVariant(request.variantId).product, "Keputusan penyesuaian stok", `${request.status}: ${values.reason}`);
  }, "Keputusan tersimpan dan riwayat diperbarui.", form))
  {
    productTask = null;
    catalogState.product = "";
    catalogState.workspace = "approvals";
    writeCatalogUrl();
    renderCatalog();
    window.scrollTo(0, 0);
  }
}

function renderCategoryTask(root)
{
  productTask.categories ||= structuredClone(catalogCategories);
  const form = pNode("form", "product-form-section");
  form.id = "product-category-form";
  form.noValidate = true;
  const error = pNode("div", "product-error-summary");
  error.hidden = true;
  error.tabIndex = -1;
  error.setAttribute("role", "alert");
  form.append(pNode("h2", "", "Kategori katalog"), pNode("p", "product-help", "Perubahan kategori disimpan sekaligus. Kategori yang dipakai produk tidak dapat dihapus."), error);

  productTask.categories.forEach((category, index) =>
  {
    const usage = catalogProducts.filter((product) => product.categories.includes(category.id)).length;
    const row = pNode("div", "product-attribute-row");
    const remove = pButton("Hapus", "remove-category", false, { index });
    remove.disabled = usage > 0;
    row.append(
      productField(`category-name-${index}`, "Nama kategori", "text", category.name,
      {
        required: true, maxLength: 80, bind: (value) => category.name = value
      }),
      pNode("p", "product-help", `${usage} produk terkait${usage > 0 ? "; hapus tidak tersedia" : ""}.`),
      remove
    );
    form.append(row);
  });
  form.append(pButton("Tambah kategori", "add-category"));
  const actions = pNode("div", "work-form-footer");
  const submit = pNode("button", "queue-button queue-button--primary", "Simpan kategori");
  submit.type = "submit";
  actions.append(pButton("Batal", "cancel-task"), submit);
  form.append(actions);
  form.addEventListener("submit", async (event) =>
  {
    event.preventDefault();
    const names = new Set();
    const errors = [];

    productTask.categories.forEach((category, index) =>
    {
      const name = category.name.trim().toLocaleLowerCase("id");

      if (name.length < 2 || names.has(name))
      {
        errors.push({ field: `category-name-${index}`, message: "Nama kategori minimal dua karakter dan tidak boleh duplikat." });
      }

      names.add(name);
    });

    if (errors.length)
    {
      showProductErrors(form, errors);
      return;
    }

    const saved = structuredClone(productTask.categories);

    if (await saveCatalog(() => catalogCategories.splice(0, catalogCategories.length, ...saved), "Kategori disimpan.", form))
    {
      productTask = null;
      renderCatalog();
    }
  });
  root.append(form);
}

async function productTaskAction(button)
{
  if (!productTask || productTask.kind !== "categories")
  {
    return;
  }

  if (button.dataset.action === "add-category")
  {
    productTask.categories.push({ id: `category-${++productSequence}`, name: "", active: true });
  }
  else if (button.dataset.action === "remove-category")
  {
    const index = Number(button.dataset.index);
    const category = productTask.categories[index];

    if (catalogProducts.some((product) => product.categories.includes(category.id)))
    {
      return;
    }

    productTask.categories.splice(index, 1);
  }
  else
  {
    return;
  }

  markProductDirty();
  refreshProductTask();
}
