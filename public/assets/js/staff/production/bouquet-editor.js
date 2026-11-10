"use strict";

let bouquetPreviewChoices = null;
let bouquetPreviewQuantity = 1;

function bRecipeErrors(recipe)
{
  const errors = [];
  if (!recipe.name.trim() || !recipe.productCode.trim() || !recipe.variant.trim())
  {
    errors.push("Isi nama, kode, dan nama varian buket.");
  }
  if (bouquetRecipes.some((entry) => entry.id !== recipe.id
    && entry.productCode.toLowerCase() === recipe.productCode.trim().toLowerCase()))
  {
    errors.push("Kode konfigurasi sudah digunakan.");
  }
  if (!Number.isSafeInteger(recipe.price) || recipe.price < 0 || recipe.price > 100000000)
  {
    errors.push("Harga dasar harus rupiah bulat antara 0 dan 100.000.000.");
  }
  const options = recipe.groups.flatMap((group) => group.options);
  const checkIngredients = (ingredients, context) =>
  {
    const ids = ingredients.map((entry) => entry.materialId);
    if (new Set(ids).size !== ids.length)
    {
      errors.push(`${context}: bahan yang sama cukup ditulis satu kali.`);
    }
    ingredients.forEach((entry) =>
    {
      const material = bMaterial(entry.materialId);
      if (!material?.active || !Number.isSafeInteger(entry.units) || entry.units <= 0 || entry.units > 1000000)
      {
        errors.push(`${context}: pilih bahan aktif dan isi jumlah positif yang sesuai satuannya.`);
      }
    });
  };
  checkIngredients(recipe.base, "Bahan dasar");
  if (!recipe.groups.length)
  {
    errors.push("Tambahkan setidaknya satu kelompok pilihan.");
  }
  recipe.groups.forEach((group) =>
  {
    const active = group.options.filter((option) => option.active);
    if (!group.name.trim() || !Number.isInteger(group.minimum) || !Number.isInteger(group.maximum)
      || group.minimum < 0 || group.maximum < 1 || group.minimum > group.maximum || group.maximum > active.length)
    {
      errors.push(`${group.name || "Kelompok pilihan"}: batas minimum/maksimum harus sesuai jumlah opsi aktif.`);
    }
    if (new Set(group.options.map((option) => option.name.trim().toLowerCase())).size !== group.options.length)
    {
      errors.push(`${group.name}: nama opsi dalam kelompok harus berbeda.`);
    }
    group.options.forEach((option) =>
    {
      if (!option.name.trim() || !Number.isSafeInteger(option.price) || option.price < 0 || option.price > 100000000)
      {
        errors.push(`${group.name}: isi nama opsi dan harga tambahan rupiah bulat yang valid.`);
      }
      if (option.active && !option.ingredients.length)
      {
        errors.push(`${option.name || "Opsi aktif"}: petakan setidaknya satu bahan produksi.`);
      }
      checkIngredients(option.ingredients, option.name || "Opsi");
      if (option.incompatible && !options.some((entry) => entry.id === option.incompatible
        && !group.options.includes(entry)))
      {
        errors.push(`${option.name}: aturan ketidakcocokan harus menunjuk opsi kelompok lain.`);
      }
    });
  });
  return [...new Set(errors)];
}

function bRecipeBadge(recipe)
{
  if (bRecipeErrors(recipe).length)
  {
    return bBadge("Belum lengkap", "warning", "alert");
  }
  return bBadge(recipe.active ? "Aktif" : "Nonaktif", recipe.active ? "success" : "neutral", "check");
}

function renderBouquetConfigurations()
{
  const sheet = bNode("section", "catalog-sheet bouquet-sheet");
  const tools = bNode("div", "bouquet-toolbar");
  const search = bNode("input");
  search.id = "bouquet-recipe-search";
  search.type = "search";
  search.placeholder = "Nama atau kode konfigurasi buket";
  search.value = bouquetState.search;
  tools.append(bField("Cari konfigurasi", search));
  sheet.append(tools);
  const query = bouquetState.search.trim().toLowerCase();
  const recipes = (bouquetLoadState === "empty" ? [] : bouquetRecipes).filter((recipe) =>
  {
    return `${recipe.name} ${recipe.productCode}`.toLowerCase().includes(query);
  });
  const meta = bNode("div", "bouquet-list-meta");
  meta.append(bNode("p", "", `${recipes.length} konfigurasi ditemukan`));
  sheet.append(meta);
  if (!recipes.length)
  {
    sheet.append(bEmpty("Konfigurasi belum ditemukan", "Ubah pencarian atau tambahkan konfigurasi buket baru."));
  }
  else
  {
    const rows = recipes.map((recipe) =>
    {
      const identity = bNode("div", "bouquet-stack");
      identity.append(bNode("strong", "", recipe.name), bNode("span", "secondary-text", recipe.productCode));
      return [identity, `${recipe.groups.length} kelompok pilihan`, bMoney(recipe.price), bRecipeBadge(recipe),
        bButton("Buka", "recipe-view", false, { id: recipe.id })];
    });
    sheet.append(bTable(["Buket", "Pilihan pelanggan", "Harga dasar", "Status", "Tindakan"], rows));
  }
  bouquetRoot.append(
    sheet,
    bNotice("Konfigurasi menentukan pilihan, harga, dan kebutuhan bahan. Stok barang jual tetap terpisah dari bahan produksi.")
  );
  search.addEventListener("input", () =>
  {
    const caret = search.selectionStart;
    bouquetState.search = search.value;
    history.replaceState({}, "", bUrl());
    renderBouquetPage();
    const replacement = document.getElementById("bouquet-recipe-search");
    replacement.focus();
    replacement.setSelectionRange(caret, caret);
  });
}

function bNewRecipe()
{
  return {
    id: `custom-${++bouquetSequence}`,
    name: "",
    productCode: "",
    variant: "Ukuran reguler",
    price: 0,
    active: false,
    version: 0,
    base: [],
    groups: [],
    history: []
  };
}

function bInput(id, value, change, options = {})
{
  const input = bNode("input");
  Object.assign(input, { id, type: "text", value, maxLength: 100 }, options);
  input.addEventListener("input", () =>
  {
    change(input.value);
    bDraftChanged();
  });
  return input;
}

function bDraftChanged()
{
  bouquetDirty = true;
  const label = document.getElementById("bouquet-save-state");
  if (label)
  {
    label.textContent = "Ada perubahan belum disimpan";
  }
  renderBouquetPreview();
}

function bIngredientRows(ingredients, container, key)
{
  const list = bNode("div", "bouquet-ingredient-list");
  ingredients.forEach((entry, index) =>
  {
    const row = bNode("div", "bouquet-ingredient-row");
    const material = bMaterial(entry.materialId);
    const select = bSelect(`${key}-material-${index}`,
      [["", "Pilih bahan produksi"], ...productionMaterials.filter((item) => item.active || item.id === entry.materialId)
        .map((item) => [item.id, `${item.code} — ${item.name}`])], entry.materialId, true);
    const input = bInput(`${key}-units-${index}`, material ? entry.units / bFactor(material) : "", (value) =>
    {
      entry.units = material ? bReadUnits(value, material) : NaN;
    }, { type: "number", min: "0.01", max: "1000000", step: material ? String(1 / bFactor(material)) : "1" });
    select.addEventListener("change", () =>
    {
      entry.materialId = select.value;
      entry.units = bMaterial(select.value) ? bFactor(bMaterial(select.value)) : 0;
      bDraftChanged();
      bRefreshEditor(select.id);
    });
    const remove = bButton("Hapus bahan", "remove-ingredient", false, { key, index });
    remove.classList.add("bouquet-remove");
    row.append(bField("Bahan", select), bField(material ? `Jumlah (${material.unit})` : "Jumlah", input), remove);
    list.append(row);
  });
  if (!ingredients.length)
  {
    list.append(bNode("p", "secondary-text", "Belum ada bahan yang dipetakan."));
  }
  container.append(list, bButton("Tambah bahan", "add-ingredient", false, { key }));
}

function bRefreshEditor(focusId = "")
{
  const open = [...document.querySelectorAll("details[data-option-id][open]")].map((entry) => entry.dataset.optionId);
  const scroll = window.scrollY;
  renderBouquetPage();
  open.forEach((id) =>
  {
    const node = [...document.querySelectorAll("[data-option-id]")].find((entry) => entry.dataset.optionId === id);
    if (node)
    {
      node.open = true;
    }
  });
  if (focusId)
  {
    const field = document.getElementById(focusId);
    (window.adminControls?.getControl(field) || field)?.focus({ preventScroll: true });
  }
  window.scrollTo(0, scroll);
}

function bRenderGroups(section)
{
  bouquetDraft.groups.forEach((group, groupIndex) =>
  {
    const block = bNode("section", "bouquet-group");
    const heading = bNode("div", "bouquet-section-heading");
    heading.append(bNode("h3", "", `Kelompok ${groupIndex + 1}`),
      bButton("Hapus kelompok", "remove-group", false, { id: group.id }));
    block.append(heading);
    const fields = bNode("div", "bouquet-group-fields");
    fields.append(
      bField("Nama kelompok", bInput(`${group.id}-name`, group.name, (value) => group.name = value)),
      bField("Minimal pilihan", bInput(`${group.id}-min`, group.minimum, (value) => group.minimum = value === "" ? NaN : Number(value),
        { type: "number", min: "0", max: "20", step: "1" })),
      bField("Maksimal pilihan", bInput(`${group.id}-max`, group.maximum, (value) => group.maximum = value === "" ? NaN : Number(value),
        { type: "number", min: "1", max: "20", step: "1" }))
    );
    block.append(fields);
    group.options.forEach((option) =>
    {
      const details = bNode("details", "bouquet-option");
      details.dataset.optionId = option.id;
      details.name = "bouquet-option-editor";
      const summary = bNode("summary", "", option.name || "Opsi baru");
      summary.append(bNode("span", "secondary-text", option.active ? "Aktif" : "Nonaktif"));
      const content = bNode("div", "bouquet-option-fields");
      const fields = bNode("div", "bouquet-two-fields");
      fields.append(
        bField("Nama opsi", bInput(`${option.id}-name`, option.name, (value) =>
        {
          option.name = value;
          summary.firstChild.textContent = value || "Opsi baru";
        })),
        bField("Harga tambahan (Rp)", bInput(`${option.id}-price`, option.price, (value) => option.price = value === "" ? NaN : Number(value),
          { type: "number", min: "0", max: "100000000", step: "1" }))
      );
      content.append(fields);
      const active = bSelect(`${option.id}-active`, [["true", "Aktif"], ["false", "Nonaktif"]], String(option.active));
      active.addEventListener("change", () =>
      {
        option.active = active.value === "true";
        bDraftChanged();
      });
      const others = bouquetDraft.groups.filter((entry) => entry !== group).flatMap((entry) =>
      {
        return entry.options.map((item) => [item.id, `${entry.name}: ${item.name || "Opsi tanpa nama"}`]);
      });
      const incompatible = bSelect(`${option.id}-incompatible`, [["", "Dapat digabung dengan semua opsi"], ...others],
        option.incompatible, true);
      incompatible.addEventListener("change", () =>
      {
        option.incompatible = incompatible.value;
        bDraftChanged();
      });
      const settings = bNode("div", "bouquet-two-fields");
      settings.append(bField("Status opsi", active), bField("Tidak boleh digabung dengan", incompatible));
      content.append(settings, bNode("h4", "", "Bahan per satu pilihan opsi"));
      bIngredientRows(option.ingredients, content, option.id);
      content.append(bButton("Hapus opsi", "remove-option", false, { id: option.id }));
      details.append(summary, content);
      details.addEventListener("toggle", () =>
      {
        if (details.open)
        {
          document.querySelectorAll("details[data-option-id]").forEach((other) =>
          {
            if (other !== details)
            {
              other.open = false;
            }
          });
        }
      });
      block.append(details);
    });
    block.append(bButton("Tambah opsi", "add-option", false, { id: group.id }));
    section.append(block);
  });
  section.append(bButton("Tambah kelompok pilihan", "add-group"));
}

function bDefaultChoices(recipe)
{
  return recipe.groups.flatMap((group) => group.options.filter((option) => option.active)
    .slice(0, Math.max(0, group.minimum)).map((option) => option.id));
}

function renderBouquetPreview()
{
  const preview = document.getElementById("bouquet-config-preview");
  if (!preview || !bouquetDraft)
  {
    return;
  }
  const recipe = bouquetDraft;
  bouquetPreviewChoices ??= bDefaultChoices(recipe);
  preview.replaceChildren(bNode("h2", "", "Simulasi pilihan pelanggan"),
    bNode("p", "secondary-text", "Periksa harga dan kebutuhan bahan tanpa membuat pesanan."));
  const selections = bNode("div", "bouquet-preview-selections");
  const errors = [];
  const chosen = [];
  recipe.groups.forEach((group) =>
  {
    const fieldset = bNode("fieldset");
    fieldset.append(bNode("legend", "", group.name || "Kelompok belum diberi nama"),
      bNode("p", "bouquet-help", `Pilih ${group.minimum} sampai ${group.maximum} opsi.`));
    const active = group.options.filter((option) => option.active);
    active.forEach((option) =>
    {
      const label = bNode("label", "bouquet-choice");
      const input = bNode("input");
      input.type = "checkbox";
      input.checked = bouquetPreviewChoices.includes(option.id);
      input.addEventListener("change", () =>
      {
        bouquetPreviewChoices = bouquetPreviewChoices.filter((id) => id !== option.id);
        if (input.checked)
        {
          bouquetPreviewChoices.push(option.id);
        }
        renderBouquetPreview();
        document.getElementById(`preview-${option.id}`)?.focus({ preventScroll: true });
      });
      input.id = `preview-${option.id}`;
      label.append(input, bNode("span", "", `${option.name || "Opsi baru"} (+${bMoney(option.price || 0)})`));
      fieldset.append(label);
    });
    const selected = active.filter((option) => bouquetPreviewChoices.includes(option.id));
    if (selected.length < group.minimum || selected.length > group.maximum)
    {
      errors.push(`${group.name}: jumlah pilihan belum sesuai.`);
    }
    chosen.push(...selected);
    selections.append(fieldset);
  });
  if (chosen.some((option) => chosen.some((entry) => entry.id === option.incompatible)))
  {
    errors.push("Ada pilihan yang tidak dapat digabung. Ubah salah satu pilihan.");
  }
  const quantityInput = bNode("input");
  Object.assign(quantityInput,
  {
    id: "bouquet-preview-quantity",
    type: "number",
    min: "1",
    max: "20",
    step: "1",
    value: bouquetPreviewQuantity
  });
  quantityInput.addEventListener("input", () =>
  {
    bouquetPreviewQuantity = Math.min(20, Math.max(1, Math.trunc(Number(quantityInput.value) || 1)));
    renderBouquetPreview();
    document.getElementById("bouquet-preview-quantity").focus({ preventScroll: true });
  });
  selections.append(bField("Jumlah buket", quantityInput, "Maksimal 20 buket per simulasi."));
  preview.append(selections);
  const price = (recipe.price + chosen.reduce((sum, option) => sum + option.price, 0)) * bouquetPreviewQuantity;
  preview.append(bNode("p", "bouquet-preview-price", Number.isSafeInteger(price) ? bMoney(price) : "Harga belum valid"));
  const needs = new Map();
  [...recipe.base, ...chosen.flatMap((option) => option.ingredients)].forEach((need) =>
  {
    needs.set(need.materialId, (needs.get(need.materialId) || 0) + need.units * bouquetPreviewQuantity);
  });
  const rows = [];
  needs.forEach((units, id) =>
  {
    const material = bMaterial(id);
    if (material && Number.isSafeInteger(units) && units > 0)
    {
      const missing = Math.max(0, units - bAvailable(material));
      rows.push([material.name, bQuantity(units, material),
        bBadge(missing ? `Kurang ${bQuantity(missing, material)}` : "Cukup", missing ? "warning" : "success",
          missing ? "alert" : "check")]);
    }
  });
  const validation = bRecipeErrors(recipe);
  if (validation.length)
  {
    errors.unshift("Konfigurasi belum lengkap. Periksa semua isian sebelum disimpan.");
  }
  if (errors.length)
  {
    preview.append(bNotice(errors.join(" "), true));
  }
  if (rows.length)
  {
    preview.append(bTable(["Bahan", "Dibutuhkan", "Kesiapan"], rows));
  }
  preview.append(bNode(
    "p",
    "bouquet-help",
    "Saldo bebas Gudang Pusat; bahan lewat batas pakai tidak dihitung. Simulasi tidak mereservasi stok."
  ));
}

function renderBouquetEditor(recipe, editing)
{
  if (!bouquetDraft)
  {
    bouquetDraft = recipe ? structuredClone(recipe) : bNewRecipe();
    bouquetPreviewChoices = null;
    bouquetPreviewQuantity = 1;
  }
  const form = bNode("form", "bouquet-editor");
  form.id = "bouquet-editor-form";
  form.noValidate = true;
  const nav = bNode("nav", "bouquet-editor-nav");
  nav.setAttribute("aria-label", "Bagian konfigurasi");
  [["information", "Informasi"], ["base", "Bahan dasar"], ["options", "Pilihan buket"], ["preview", "Simulasi"]]
    .forEach(([id, label]) =>
    {
      const link = bNode("a", "queue-text-button", label);
      link.href = `#bouquet-${id}`;
      nav.append(link);
    });
  form.append(nav);
  const information = bPanel("Informasi konfigurasi", "Konfigurasi untuk buket kustom, terpisah dari SKU buket siap jual.");
  information.id = "bouquet-information";
  const fields = bNode("div", "bouquet-two-fields");
  fields.append(
    bField("Nama buket (wajib)", bInput("bouquet-name", bouquetDraft.name, (value) => bouquetDraft.name = value)),
    bField("Kode konfigurasi (wajib)", bInput("bouquet-code", bouquetDraft.productCode,
      (value) => bouquetDraft.productCode = value, { maxLength: 40 })),
    bField("Nama varian (wajib)", bInput("bouquet-variant", bouquetDraft.variant, (value) => bouquetDraft.variant = value)),
    bField("Harga dasar (Rp)", bInput("bouquet-price", bouquetDraft.price, (value) => bouquetDraft.price = value === "" ? NaN : Number(value),
      { type: "number", min: "0", max: "100000000", step: "1" }))
  );
  const active = bSelect("bouquet-active", [["false", "Nonaktif"], ["true", "Aktif"]], String(bouquetDraft.active));
  active.addEventListener("change", () =>
  {
    bouquetDraft.active = active.value === "true";
    bDraftChanged();
  });
  fields.append(bField(
    "Status konfigurasi",
    active,
    "Nonaktif menghentikan pilihan baru; snapshot pekerjaan lama tetap utuh."
  ));
  information.append(fields);
  const base = bPanel("Bahan dasar per buket", "Bahan yang selalu digunakan, apa pun pilihan pelanggan.");
  base.id = "bouquet-base";
  bIngredientRows(bouquetDraft.base, base, "base");
  const options = bPanel("Pilihan buket", "Kelompokkan pilihan dan tetapkan kebutuhan bahan per opsi, bukan per pesanan.");
  options.id = "bouquet-options";
  bRenderGroups(options);
  const simulation = bPanel("Simulasi");
  simulation.id = "bouquet-preview";
  const preview = bNode("div");
  preview.id = "bouquet-config-preview";
  simulation.replaceChildren(preview);
  form.append(information, base, options, simulation);
  if (editing)
  {
    const reason = bInput("bouquet-change-reason", bouquetDraft.changeReason || "",
      (value) => bouquetDraft.changeReason = value, { maxLength: 500 });
    form.append(bField("Alasan penyimpanan (wajib)", reason, "Minimal 5 karakter; dicatat bersama versi konfigurasi."));
    const footer = bNode("div", "bouquet-savebar");
    const status = bNode("p", "secondary-text", bouquetDirty ? "Ada perubahan belum disimpan" : "Belum ada perubahan");
    status.id = "bouquet-save-state";
    const save = bNode("button", "queue-button queue-button--primary", "Simpan konfigurasi");
    save.type = "submit";
    footer.append(status, bButton("Batal", "back"), save);
    form.append(footer);
    form.addEventListener("submit", async (event) =>
    {
      event.preventDefault();
      const errors = bRecipeErrors(bouquetDraft);
      if ((bouquetDraft.changeReason || "").trim().length < 5)
      {
        errors.push("Tulis alasan penyimpanan minimal 5 karakter.");
      }
      if (errors.length)
      {
        let summary = form.querySelector(".bouquet-validation");
        if (!summary)
        {
          summary = bNode("div", "bouquet-validation product-note product-note--warning");
          summary.tabIndex = -1;
          summary.setAttribute("role", "alert");
          form.insertBefore(summary, information);
        }
        const list = bNode("ul");
        errors.forEach((error) => list.append(bNode("li", "", error)));
        summary.replaceChildren(bNode("strong", "", "Konfigurasi belum dapat disimpan"), list);
        summary.focus();
        return;
      }
      const success = await bCommit(form, () =>
      {
        const saved = structuredClone(bouquetDraft);
        saved.name = saved.name.trim();
        saved.productCode = saved.productCode.trim();
        saved.version += 1;
        saved.history ??= [];
        saved.history.push({
          actor: bActor(),
          reason: saved.changeReason,
          at: new Date().toISOString(),
          version: saved.version
        });
        delete saved.changeReason;
        const index = bouquetRecipes.findIndex((entry) => entry.id === saved.id);
        if (index === -1)
        {
          bouquetRecipes.push(saved);
        }
        else
        {
          bouquetRecipes[index] = saved;
        }
        bouquetDirty = false;
        bouquetDraft = null;
        bouquetState.recipe = saved.id;
        bouquetState.mode = "view";
        history.replaceState({}, "", bUrl());
      });
      if (success)
      {
        renderBouquetPage();
        bFeedback("Konfigurasi tersimpan di pratinjau. Snapshot pekerjaan lama tetap utuh.");
      }
    });
  }
  else
  {
    const readonly = bNode("fieldset", "bouquet-readonly");
    readonly.disabled = true;
    readonly.append(information, base, options);
    nav.after(readonly);
    form.prepend(bNotice(`Versi ${recipe.version}. Buka Edit konfigurasi untuk menyesuaikan pilihan baru.`));
    const action = bButton("Edit konfigurasi", "edit-recipe", true, { id: recipe.id });
    document.getElementById("bouquet-heading-actions").append(action);
    if (recipe.history?.length)
    {
      const history = bPanel("Riwayat konfigurasi");
      recipe.history.slice().reverse().forEach((entry) =>
      {
        history.append(bNode("p", "", `Versi ${entry.version}: ${entry.reason} (${entry.actor})`));
      });
      form.append(history);
    }
  }
  bouquetRoot.append(form);
  renderBouquetPreview();
  form.addEventListener("focusin", (event) =>
  {
    if (!event.target.matches("input, select, textarea, summary, button"))
    {
      return;
    }
    const rect = event.target.getBoundingClientRect();
    const footer = form.querySelector(".bouquet-savebar");
    const limit = window.innerHeight - (footer?.offsetHeight || 0) - 16;
    if (!event.target.closest(".bouquet-savebar") && rect.bottom > limit)
    {
      window.scrollBy(0, rect.bottom - limit);
    }
  });
}

function handleBouquetEditorAction(action, dataset)
{
  if (action === "recipe-view" || action === "edit-recipe")
  {
    bNavigate({ workspace: "configuration", recipe: dataset.id, mode: action === "edit-recipe" ? "edit" : "view", job: "" });
    return;
  }
  if (!bouquetDraft || bouquetState.mode !== "edit")
  {
    return;
  }
  const option = bouquetDraft.groups.flatMap((group) => group.options).find((entry) => entry.id === dataset.id);
  const group = bouquetDraft.groups.find((entry) => entry.id === dataset.id);
  if (action === "add-group")
  {
    bouquetDraft.groups.push({ id: `group-${++bouquetSequence}`, name: "", minimum: 1, maximum: 1, options: [] });
  }
  else if (action === "remove-group" && group)
  {
    if (!window.confirm("Hapus kelompok dan semua opsinya dari konfigurasi ini?"))
    {
      return;
    }
    bouquetDraft.groups = bouquetDraft.groups.filter((entry) => entry !== group);
  }
  else if (action === "add-option" && group)
  {
    group.options.push({
      id: `option-${++bouquetSequence}`,
      name: "",
      price: 0,
      active: true,
      incompatible: "",
      ingredients: []
    });
  }
  else if (action === "remove-option" && option)
  {
    if (!window.confirm("Hapus opsi ini dari konfigurasi? Snapshot pekerjaan lama tidak berubah."))
    {
      return;
    }
    bouquetDraft.groups.forEach((entry) => entry.options = entry.options.filter((item) => item !== option));
  }
  else if (["add-ingredient", "remove-ingredient"].includes(action))
  {
    const ingredients = dataset.key === "base" ? bouquetDraft.base
      : bouquetDraft.groups.flatMap((entry) => entry.options).find((entry) => entry.id === dataset.key)?.ingredients;
    if (!ingredients)
    {
      return;
    }
    if (action === "add-ingredient")
    {
      ingredients.push({ materialId: "", units: 0 });
    }
    else
    {
      ingredients.splice(Number(dataset.index), 1);
    }
  }
  else
  {
    return;
  }
  bDraftChanged();
  bRefreshEditor();
  if (action === "add-option")
  {
    const details = [...document.querySelectorAll("[data-option-id]")].find((entry) =>
    {
      return entry.dataset.optionId === group.options.at(-1).id;
    });
    document.querySelectorAll("details[data-option-id]").forEach((entry) => entry.open = entry === details);
    details.querySelector("input").focus();
  }
}

renderBouquetPage();
