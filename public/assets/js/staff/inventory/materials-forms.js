"use strict";

const materialPackagingTypes =
{
  flowers: ["ikat"], filler: ["ikat"], wrapping: ["pak", "rol"],
  ribbon: ["rol"], foam: ["pak", "dus"], cards: ["pak"], accessories: ["pak", "dus"]
};

function mMarkDirty()
{
  materialDirty = true;
  const label = document.getElementById("material-save-state");

  if (label)
  {
    label.textContent = "Ada perubahan belum disimpan";
  }
  mUpdateReadiness();
}

function mField(name, label, type, value, options = {})
{
  const wrapper = mNode("div", options.wide ? "product-field product-field--wide" : "product-field");
  const caption = mNode("label", "", `${label}${options.required ? " (wajib)" : ""}`);
  const input = mNode(type === "select" ? "select" : type === "textarea" ? "textarea" : "input");
  input.id = `material-${name}`;
  input.name = name;
  caption.htmlFor = input.id;

  if (!["select", "textarea"].includes(type))
  {
    input.type = type;
  }

  if (type === "select")
  {
    for (const choice of options.choices || [])
    {
      const [key, text] = Array.isArray(choice) ? choice : [choice, choice];
      input.append(new Option(text, key));
    }
  }
  input.value = value ?? "";
  input.required = Boolean(options.required);
  input.disabled = Boolean(options.disabled);

  if (options.searchable)
  {
    input.dataset.searchable = "true";
  }

  if (type === "number")
  {
    input.step = options.step || "1";
    input.inputMode = options.step && options.step !== "1" ? "decimal" : "numeric";

    if (options.min !== undefined)
    {
      input.min = options.min;
    }

    if (options.max !== undefined)
    {
      input.max = options.max;
    }
  }

  if (["text", "textarea", "search"].includes(type))
  {
    input.maxLength = options.maxLength || (type === "textarea" ? 1000 : 120);
  }
  const error = mNode("span", "product-field-error");
  error.id = `${input.id}-error`;
  error.hidden = true;
  const descriptions = [error.id];
  wrapper.append(caption, input);

  if (options.help)
  {
    const help = mNode("small", "product-help", options.help);
    help.id = `${input.id}-help`;
    descriptions.push(help.id);
    wrapper.append(help);
  }
  input.setAttribute("aria-describedby", descriptions.join(" "));
  input.addEventListener("input", () =>
  {
    const next = type === "number" && input.value !== "" ? Number(input.value) : input.value;
    options.bind?.(next);
    input.removeAttribute("aria-invalid");
    error.hidden = true;

    if (options.dirty !== false)
    {
      mMarkDirty();
    }
  });

  if (options.change)
  {
    input.addEventListener("change", options.change);
  }
  wrapper.append(error);
  return wrapper;
}

function mCheck(name, label, value, bind, disabled = false)
{
  const wrapper = mNode("label", "product-check");
  const input = mNode("input");
  input.type = "checkbox";
  input.id = `material-${name}`;
  input.checked = value;
  input.disabled = disabled;
  input.addEventListener("change", () =>
  {
    bind(input.checked);
    mMarkDirty();
  });
  wrapper.append(input, document.createTextNode(label));
  return wrapper;
}

function mSection(id, title, description)
{
  const section = mNode("section", "product-form-section material-form-section");
  section.id = `material-section-${id}`;
  section.append(mNode("h2", "", title), mNode("p", "", description));
  return section;
}

function mFormBase(root, title)
{
  document.getElementById("material-page-title").textContent = title;
  document.getElementById("material-page-intro").textContent = "Periksa bahan, satuan, dan dampak perubahan sebelum menyimpan.";
  const back = mButton("Kembali tanpa menyimpan", "back");
  back.className = "queue-text-button back-button";
  root.append(back);
  const form = mNode("form");
  form.id = "material-form";
  form.noValidate = true;
  const errors = mNode("div", "product-error-summary");
  errors.id = "material-errors";
  errors.hidden = true;
  errors.tabIndex = -1;
  errors.setAttribute("role", "alert");
  form.append(errors);
  root.append(form);
  return form;
}

function mFormFooter(form, label = "Periksa dan simpan", sticky = false)
{
  const footer = mNode("div", sticky ? "product-save-bar" : "work-form-footer");

  if (sticky)
  {
    const status = mNode("p", "", materialDirty ? "Ada perubahan belum disimpan" : "Belum ada perubahan");
    status.id = "material-save-state";
    footer.append(status);
  }
  const buttons = mNode("div", "product-inline-actions");
  const submit = mNode("button", "queue-button queue-button--primary", label);
  submit.type = "submit";
  submit.id = "material-save";
  buttons.append(mButton("Batal", "back"), submit);
  footer.append(buttons);
  form.append(footer);
  form.addEventListener("focusin", (event) =>
  {
    if (!event.target.matches("input, select, textarea, button") || footer.contains(event.target))
    {
      return;
    }
    const box = event.target.getBoundingClientRect();
    const top = document.querySelector(".material-form-nav")?.getBoundingClientRect().bottom || 0;
    const bottom = sticky ? Math.min(innerHeight, footer.getBoundingClientRect().top) : innerHeight;

    if (box.top < top + 12 || box.bottom > bottom - 12)
    {
      window.scrollBy(0, box.top < top + 12 ? box.top - top - 12 : box.bottom - bottom + 12);
    }
  });
  return submit;
}

function renderMaterialForm(root)
{
  if (["new", "edit"].includes(materialState.mode))
  {
    renderMaterialEditor(root);
  }
  else if (materialState.mode === "review")
  {
    renderMaterialReview(root);
  }
  else
  {
    renderMaterialMovementForm(root);
  }
}

function refreshMaterialForm(focusId = document.activeElement?.id)
{
  const y = scrollY;
  renderMaterials();
  window.scrollTo(0, y);
  document.getElementById(focusId)?.focus({ preventScroll: true });
}

function renderMaterialEditor(root)
{
  if (!materialDraft)
  {
    materialDraft = materialState.mode === "new"
      ? materialFixture(`material-${++materialSequence}`, "", "", "flowers", "batang", 5)
      : structuredClone(mFind());
    materialDraft.reason = "";
  }
  const draft = materialDraft;
  const locked = mReferenced(draft.id);
  const form = mFormBase(root, materialState.mode === "new" ? "Tambah bahan" : "Edit bahan");
  const nav = mNode("nav", "product-editor-nav material-form-nav");
  nav.setAttribute("aria-label", "Bagian form bahan");

  for (const [key, text] of [["info", "Informasi"], ["units", "Satuan & kemasan"], ["storage", "Penyimpanan"]])
  {
    const link = mNode("a", "", text);
    link.href = `#material-section-${key}`;
    link.addEventListener("click", (event) =>
    {
      event.preventDefault();
      document.getElementById(`material-section-${key}`).scrollIntoView({ block: "start" });
    });
    nav.append(link);
  }
  form.before(nav);
  const layout = mNode("div", "product-editor-layout");
  const content = mNode("div");
  const info = mSection("info", "Informasi bahan", "Beri nama dan kode yang mudah dikenali saat menerima atau mengambil bahan.");
  const fields = mNode("div", "product-fields");
  const field = (key, label, type, options = {}) => mField(key, label, type, draft[key],
  {
    ...options,
    bind: (value) => draft[key] = value
  });
  fields.append(
    field("name", "Nama bahan", "text", { required: true, wide: true }),
    field("code", "Kode bahan", "text", { required: true, maxLength: 64 }),
    field("category", "Jenis bahan", "select",
    {
      required: true,
      choices: materialCategories.map((category) => [category.id, category.name]),
      change: () =>
      {
        const choices = materialCategories.find((category) => category.id === draft.category).units;

        if (!locked)
        {
          draft.unit = choices[0];
          draft.packaging = [];
        }
        refreshMaterialForm();
      }
    })
  );
  info.append(fields, mCheck("active", "Bahan aktif untuk operasional", draft.active, (value) => draft.active = value));
  const units = mSection("units", "Satuan dan kemasan", "Jumlah stok selalu dicatat dalam satuan dasar. Kemasan penerimaan memiliki faktor konversi yang jelas.");
  const categoryUnits = materialCategories.find((category) => category.id === draft.category).units;
  const unitFields = mNode("div", "product-fields");
  unitFields.append(
    field("unit", "Satuan dasar", "select",
    {
      required: true,
      choices: [...new Set([...categoryUnits, ...(locked ? [draft.unit] : [])])],
      disabled: locked,
      help: locked ? "Satuan dengan riwayat atau referensi dikunci. Buat bahan baru untuk satuan berbeda." : "Pilihan mengikuti jenis bahan.",
      change: refreshMaterialForm
    }),
    field("minimum", "Ambang stok minimum", "number",
    {
      required: true, min: 0, step: draft.unit === "meter" ? "0.01" : "1",
      help: `Dalam ${draft.unit}. Jumlah tersedia pada atau di bawah ambang ditandai menipis.`
    })
  );
  units.append(unitFields);
  const packs = mNode("div");
  const packChoices = materialPackagingTypes[draft.category].filter((name) => name !== draft.unit);

  draft.packaging.forEach((pack, index) =>
  {
    const row = mNode("div", "product-fields material-pack-row");
    row.append(
      mField(`pack-${index}-name`, "Kemasan penerimaan", "select", pack.name,
      {
        choices: [...new Set([...packChoices, pack.name])],
        required: true, disabled: locked,
        bind: (value) => pack.name = value
      }),
      mField(`pack-${index}-factor`, `Isi per ${pack.name} (${draft.unit})`, "number", pack.factor,
      {
        min: 0, required: true, disabled: locked,
        step: draft.unit === "meter" ? "0.01" : "1",
        bind: (value) => pack.factor = value
      })
    );
    const remove = mButton("Hapus kemasan", "remove-pack", false, { index });
    remove.disabled = locked;
    row.append(remove);
    packs.append(row);
  });
  const addPack = mButton("Tambah kemasan", "add-pack");
  addPack.disabled = locked || !packChoices.some((name) => !draft.packaging.some((pack) => pack.name === name));
  units.append(packs, addPack);

  if (locked)
  {
    units.append(mNote("Faktor kemasan bersejarah dikunci agar penerimaan lama tetap dapat ditelusuri."));
  }
  units.append(mCheck("batchTracked", "Lacak batch dan batas pakai", draft.batchTracked,
    (value) => draft.batchTracked = value, locked));
  units.append(mNote("Saldo awal bahan baru adalah 0. Setelah disimpan, gunakan Catat barang masuk."));
  const storage = mSection("storage", "Penyimpanan dan catatan", "Catat petunjuk operasional yang sudah diverifikasi untuk bahan ini.");
  const storageFields = mNode("div", "product-fields");
  storageFields.append(field("storage", "Petunjuk penyimpanan", "textarea", { required: true, wide: true }),
    field("notes", "Catatan bahan", "textarea", { wide: true }));

  if (materialState.mode === "edit")
  {
    storageFields.append(field("reason", "Alasan perubahan", "textarea", { required: true, wide: true }));
  }
  storage.append(storageFields);
  content.append(info, units, storage);
  const aside = mNode("aside", "material-readiness");
  aside.append(mNode("h2", "", "Kesiapan bahan"));
  const readiness = mNode("div");
  readiness.id = "material-readiness";
  aside.append(readiness, mNote("Perubahan informasi tidak menimpa saldo. Riwayat stok tetap dipertahankan."));
  layout.append(content, aside);
  form.append(layout);
  mFormFooter(form, "Simpan bahan", true);
  form.addEventListener("submit", submitMaterialEditor);
  requestAnimationFrame(() =>
  {
    document.documentElement.style.setProperty("--material-nav-height", `${nav.offsetHeight}px`);
    mUpdateFormNavigation();
  });
  mUpdateReadiness();
}

function mUpdateReadiness()
{
  const root = document.getElementById("material-readiness");

  if (!root || !materialDraft || !["new", "edit"].includes(materialState.mode))
  {
    return;
  }
  root.replaceChildren();

  for (const [text, complete] of
  [
    ["Nama dan kode", Boolean(materialDraft.name.trim() && materialDraft.code.trim())],
    ["Jenis dan satuan", Boolean(materialDraft.category && materialDraft.unit)],
    ["Ambang stok", materialDraft.minimum !== "" && Number(materialDraft.minimum) >= 0],
    ["Penyimpanan", materialDraft.storage.trim().length >= 5]
  ])
  {
    const line = mNode("p", complete ? "material-ready" : "material-incomplete");
    line.append(mIcon(complete ? "check" : "alert"),
      document.createTextNode(`${text}: ${complete ? "terisi" : "belum lengkap"}`));
    root.append(line);
  }
}

function validateMaterialEditor(draft)
{
  const errors = [];
  const add = (field, message) => errors.push({ field, message });

  if (draft.name.trim().length < 2)
  {
    add("name", "Tuliskan nama bahan minimal 2 karakter.");
  }

  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$/.test(draft.code.trim())
    || productionMaterials.some((material) => material.id !== draft.id && material.code.toLowerCase() === draft.code.trim().toLowerCase()))
  {
    add("code", "Kode harus unik, 2–64 karakter, memakai huruf, angka, titik, garis bawah, atau tanda hubung.");
  }
  const category = materialCategories.find((entry) => entry.id === draft.category);

  if (!category?.units.includes(draft.unit))
  {
    add("category", "Jenis bahan tidak sesuai dengan satuan dasar. Pilih jenis yang sesuai atau buat bahan baru.");
  }
  const scaledMinimum = Number(draft.minimum) * mFactor(draft);

  if (draft.minimum === "" || !Number.isSafeInteger(Math.round(scaledMinimum)) || scaledMinimum < 0
    || Math.abs(scaledMinimum - Math.round(scaledMinimum)) > 0.000001)
  {
    add("minimum", `Ambang minimum harus 0 atau lebih, sesuai ketelitian satuan ${draft.unit}.`);
  }

  if (draft.storage.trim().length < 5)
  {
    add("storage", "Tuliskan petunjuk penyimpanan minimal 5 karakter.");
  }

  if (materialState.mode === "edit" && draft.reason.trim().length < 5)
  {
    add("reason", "Tuliskan alasan perubahan minimal 5 karakter.");
  }
  const original = mFind(draft.id);

  if (original && mReferenced(draft.id)
    && (original.unit !== draft.unit || original.batchTracked !== draft.batchTracked
      || JSON.stringify(original.packaging) !== JSON.stringify(draft.packaging)))
  {
    add("unit", "Satuan, pelacakan batch, dan konversi bersejarah tidak boleh diganti melalui edit bahan.");
  }

  if (!draft.active && materialAllocations.some((entry) => entry.materialId === draft.id && mAllocationRemaining(entry) > 0))
  {
    add("active", "Bahan masih dialokasikan. Selesaikan pemakaian atau lepaskan alokasi sebelum menonaktifkan.");
  }
  const names = new Set();
  draft.packaging.forEach((pack, index) =>
  {
    const scaled = Number(pack.factor) * mFactor(draft);

    if (!materialPackagingTypes[draft.category]?.includes(pack.name) || pack.name === draft.unit || names.has(pack.name))
    {
      add(`pack-${index}-name`, "Pilih kemasan yang relevan dan berbeda dari satuan dasar maupun kemasan lain.");
    }

    if (!Number.isSafeInteger(Math.round(scaled)) || scaled <= 0 || Math.abs(scaled - Math.round(scaled)) > 0.000001)
    {
      add(`pack-${index}-factor`, `Isi kemasan harus positif dan sesuai ketelitian ${draft.unit}.`);
    }
    names.add(pack.name);
  });
  return errors;
}

async function submitMaterialEditor(event)
{
  event.preventDefault();
  const errors = validateMaterialEditor(materialDraft);

  if (errors.length)
  {
    mShowErrors(event.currentTarget, errors);
    return;
  }
  const draft = structuredClone(materialDraft);
  draft.name = draft.name.trim();
  draft.code = draft.code.trim().toUpperCase();
  draft.minimum = Number(draft.minimum);
  await mSave(event.currentTarget, () =>
  {
    const currentErrors = validateMaterialEditor(draft);

    if (currentErrors.length)
    {
      throw new Error(currentErrors[0].message);
    }
    const original = mFind(draft.id);

    if (original)
    {
      Object.assign(original, draft);
    }
    else
    {
      productionMaterials.push(draft);
    }
    mHistory(draft.id, original ? "Informasi bahan diubah" : "Bahan dibuat", draft.reason || "Bahan baru dibuat dengan saldo awal 0.");
  }, "Bahan disimpan. Saldo stok tidak diubah oleh form informasi.",
  { material: draft.id, workspace: "materials", tab: "info" });
}

function mShowErrors(form, errors)
{
  form.querySelectorAll('[aria-invalid="true"]').forEach((node) => node.removeAttribute("aria-invalid"));
  form.querySelectorAll(".product-field-error").forEach((node) => node.hidden = true);
  let summary = form.querySelector(".product-error-summary");

  if (!summary)
  {
    summary = mNode("div", "product-error-summary");
    summary.tabIndex = -1;
    summary.setAttribute("role", "alert");
    form.prepend(summary);
  }
  summary.hidden = false;
  summary.replaceChildren(mNode("strong", "", "Perubahan belum disimpan. Periksa isian berikut."));
  const list = mNode("ul");

  for (const error of errors)
  {
    const item = mNode("li");
    const input = document.getElementById(`material-${error.field}`);

    if (input)
    {
      input.setAttribute("aria-invalid", "true");
      const fieldError = document.getElementById(`${input.id}-error`);

      if (fieldError)
      {
        fieldError.hidden = false;
        fieldError.textContent = error.message;
      }
      const link = mNode("a", "", error.message);
      link.href = `#${input.id}`;
      link.addEventListener("click", (event) =>
      {
        event.preventDefault();
        const control = window.adminControls?.getControl(input) || input;
        control.focus();
        control.scrollIntoView({ block: "center" });
      });
      item.append(link);
    }
    else
    {
      item.textContent = error.message;
    }
    list.append(item);
  }
  summary.append(list);
  summary.focus();
}

function renderMaterialMovementForm(root)
{
  if (!materialDraft)
  {
    const allocation = materialAllocations.find((entry) => entry.id === materialState.allocation);
    const material = mFind() || productionMaterials.find((entry) => entry.active);
    materialDraft =
    {
      materialId: allocation?.materialId || material?.id || "",
      type: materialState.mode,
      quantity: "",
      unit: allocation ? mFind(allocation.materialId).unit : material?.unit || "",
      batchId: allocation?.batchId || "",
      expires: "",
      destination: materialState.location === "pusat" ? "toko" : "pusat",
      allocationId: allocation?.id || "",
      jobId: allocation?.jobId || materialJobs[0]?.id || "",
      reference: allocation?.jobId || "",
      reason: ""
    };
  }
  const values = materialDraft;
  const material = mFind(values.materialId);
  const titles =
  {
    receipt: "Catat barang masuk", adjustment: "Penyesuaian stok", damage: "Catat rusak / buang",
    transfer: "Transfer bahan", allocate: "Alokasikan bahan", consume: "Catat pemakaian"
  };
  const form = mFormBase(root, titles[values.type]);
  const layout = mNode("div", "product-editor-layout");
  const section = mSection("movement", "Rincian pencatatan", `Lokasi sumber: ${materialLocations[materialState.location]}. Setiap perubahan memiliki referensi dan alasan.`);
  const fields = mNode("div", "product-fields");
  const field = (key, text, type, options = {}) => mField(key, text, type, values[key],
  {
    ...options,
    bind: (value) => values[key] = value
  });
  fields.append(field("materialId", "Bahan / kode", "select",
  {
    required: true, wide: true, searchable: true,
    disabled: values.type === "consume",
    choices: productionMaterials.filter((entry) => entry.active || entry.id === values.materialId)
      .map((entry) => [entry.id, `${entry.code}, ${entry.name}, ${entry.unit}`]),
    change: () =>
    {
      values.batchId = "";
      values.expires = "";
      values.quantity = "";
      values.unit = mFind(values.materialId)?.unit || "";
      refreshMaterialForm();
    }
  }));

  if (!["allocate", "consume"].includes(values.type))
  {
    fields.append(field("type", "Jenis mutasi", "select",
    {
      required: true,
      choices: ["receipt", "adjustment", "damage", "transfer"].map((type) => [type, materialTypeLabels[type]]),
      change: () =>
      {
        values.quantity = "";
        values.unit = material?.unit || "";
        materialState.mode = values.type;
        writeMaterialUrl(true);
        refreshMaterialForm();
      }
    }));
  }

  if (values.type === "consume")
  {
    const allocations = materialAllocations.filter((entry) => entry.locationId === materialState.location && mAllocationRemaining(entry) > 0);
    fields.append(field("allocationId", "Alokasi produksi", "select",
    {
      required: true, wide: true, searchable: true,
      choices: [["", "Pilih alokasi produksi"], ...allocations.map((entry) =>
      {
        const ingredient = mFind(entry.materialId);
        return [entry.id, `${entry.jobId}, ${ingredient.name}, sisa ${mQuantity(mAllocationRemaining(entry), ingredient)}`];
      })],
      change: () =>
      {
        const allocation = materialAllocations.find((entry) => entry.id === values.allocationId);
        values.materialId = allocation?.materialId || "";
        values.batchId = allocation?.batchId || "";
        values.unit = mFind(values.materialId)?.unit || "";
        values.quantity = "";
        values.reference = allocation?.jobId || "";
        values.jobId = allocation?.jobId || "";
        refreshMaterialForm();
      }
    }));
  }

  if (material?.batchTracked)
  {
    if (values.type === "receipt")
    {
      fields.append(field("batchId", "Nomor batch / lot", "text",
      {
        required: true,
        help: "Gunakan kode batch penerimaan. Untuk batch yang sama, batas pakai harus tetap sama."
      }), field("expires", "Batas pakai", "date", { required: true }));
    }
    else
    {
      const batches = material.batches.filter((batch) => mStock(material, materialState.location, batch.id).balance > 0);
      fields.append(field("batchId", "Batch bahan", "select",
      {
        required: true,
        disabled: values.type === "consume",
        choices: [["", "Pilih batch"], ...batches.map((batch) =>
        {
          const stock = mStock(material, materialState.location, batch.id);
          return [batch.id, `${batch.id}, saldo ${mQuantity(stock.balance, material)}, batas ${mDate(batch.expires)}${mExpired(material, batch.id) ? ", lewat batas pakai" : ""}`];
        })],
        change: () =>
        {
          mSyncMovementQuantity();
          mMovementPreview();
        }
      }));
    }
  }

  if (values.type === "receipt")
  {
    fields.append(field("unit", "Satuan penerimaan", "select",
    {
      required: true,
      choices: [[material?.unit || "", material?.unit || "Pilih bahan"], ...(material?.packaging || []).map((pack) =>
      {
        return [pack.name, `${pack.name}, isi ${pack.factor} ${material.unit}`];
      })],
      change: () =>
      {
        values.quantity = "";
        refreshMaterialForm();
      }
    }));
  }
  const quantityText = values.type === "adjustment" ? "Perubahan jumlah (+/−)"
    : values.type === "consume" ? "Jumlah dipakai" : values.type === "allocate" ? "Jumlah dialokasikan"
      : values.type === "receipt" ? "Jumlah diterima" : "Jumlah";
  fields.append(field("quantity", quantityText, "number",
  {
    required: true,
    step: values.unit === "meter" ? "0.01" : "1",
    help: values.type === "adjustment" ? `Positif menambah, negatif mengurangi. Satuan ${material?.unit || "dasar"}.`
      : `Dalam ${values.unit || material?.unit || "satuan bahan"}. ${values.unit === "meter" ? "Maksimal 2 angka desimal." : "Bilangan bulat."}`
  }));

  if (values.type === "transfer")
  {
    fields.append(field("destination", "Lokasi tujuan", "select",
    {
      required: true,
      choices: Object.entries(materialLocations).filter(([key]) => key !== materialState.location)
    }));
  }

  if (values.type === "allocate")
  {
    fields.append(field("jobId", "Produksi buket", "select",
    {
      required: true, searchable: true,
      choices: materialJobs.map((job) => [job.id, `${job.id}, ${job.name}, ${job.order}`])
    }));
  }
  fields.append(field("reference", "Referensi dokumen", "text",
  {
    required: true,
    help: "Nomor penerimaan, produksi, opname, kerusakan, atau dokumen transfer."
  }), field("reason", "Alasan / catatan", "textarea", { required: true, wide: true }));
  section.append(fields);
  const notice = mNode("p", "product-help material-quantity-notice");
  notice.id = "material-quantity-notice";
  notice.hidden = true;
  notice.setAttribute("role", "status");
  const amount = fields.querySelector("#material-quantity");
  amount.parentElement.append(notice);
  amount.setAttribute("aria-describedby", `${amount.getAttribute("aria-describedby")} material-quantity-notice`);
  amount.addEventListener("keydown", (event) =>
  {
    const forbidden = ["e", "E", ...(values.type === "adjustment" ? [] : ["-", "+"]), ...(values.unit === "meter" ? [] : [".", ","])];

    if (forbidden.includes(event.key))
    {
      event.preventDefault();
    }
  });
  amount.addEventListener("input", () => mSyncMovementQuantity(true), { capture: true });
  const preview = mNode("div");
  preview.id = "material-movement-preview";
  section.append(preview);

  if (values.type === "adjustment")
  {
    section.append(mNote(materialState.role === "admin"
      ? "Penyesuaian lebih dari 20 satuan dasar diajukan ke SuperAdmin. Saldo belum berubah sebelum disetujui."
      : "Penyesuaian dicatat bersama alasan, referensi, dan pelaku."));
  }
  const aside = mNode("aside", "material-readiness");
  aside.append(mNode("h2", "", "Saldo sebelum pencatatan"));

  if (material)
  {
    const stock = mStock(material);
    aside.append(mFacts(
    [
      ["Bahan", material.name], ["Lokasi", materialLocations[materialState.location]],
      ["Saldo fisik", mQuantity(stock.balance, material)], ["Alokasi aktif", mQuantity(stock.allocated, material)],
      ["Lewat batas pakai", mQuantity(stock.expired, material)], ["Bebas digunakan", mQuantity(stock.available, material)]
    ]));
    aside.append(mNote(values.type === "damage"
      ? "Kerusakan dapat mencatat batch melewati batas pakai. Unit yang masih dialokasikan harus dilepaskan dahulu."
      : "Bahan yang dialokasikan atau melewati batas pakai tidak dapat digunakan untuk produksi lain."));
  }
  layout.append(section, aside);
  form.append(layout);
  mFormFooter(form);
  form.addEventListener("input", () =>
  {
    mSyncMovementQuantity();
    mMovementPreview();
  });
  form.addEventListener("submit", submitMaterialMovement);
  mSyncMovementQuantity();
  mMovementPreview();
}

function mMovementBounds(values, locationId = materialState.location)
{
  const material = mFind(values.materialId);

  if (!material)
  {
    return { min: 0, max: 0, step: 1, maximumUnits: 0, conversion: 1, disabled: true, message: "Pilih bahan yang tersedia." };
  }
  const factor = mFactor(material);
  const packageSize = values.unit === material.unit ? 1
    : material.packaging.find((pack) => pack.name === values.unit)?.factor || 1;
  const conversion = values.type === "receipt" ? packageSize : 1;
  const step = (values.type === "receipt" ? values.unit : material.unit) === "meter" ? 0.01 : 1;
  const stock = mStock(material, locationId, material.batchTracked ? values.batchId : null);
  const allStock = mStock(material, locationId);
  const allocation = materialAllocations.find((entry) => entry.id === values.allocationId);
  const reducing = ["damage", "transfer", "allocate", "consume"].includes(values.type);
  const expired = mExpired(material, values.batchId);
  let maximumUnits = ["damage", "adjustment"].includes(values.type) ? stock.removable : stock.available;

  if (values.type === "consume")
  {
    maximumUnits = allocation && allocation.locationId === locationId && allocation.materialId === material.id
      ? Math.min(mAllocationRemaining(allocation), Math.max(0, stock.balance - stock.expired - stock.allocated + mAllocationRemaining(allocation))) : 0;
  }
  const needsBatch = material.batchTracked && values.type !== "receipt" && !material.batches.some((batch) => batch.id === values.batchId);
  const expiredBlocked = expired && ["transfer", "allocate", "consume"].includes(values.type);
  const disabled = needsBatch || expiredBlocked || (reducing && maximumUnits <= 0);
  const message = needsBatch ? "Pilih batch terlebih dahulu."
    : expiredBlocked ? "Batch melewati batas pakai. Pilih batch lain atau catat penanganan rusak / buang."
      : reducing && maximumUnits <= 0 ? "Tidak ada stok yang dapat digunakan untuk tindakan ini. Pilih bahan lain atau catat barang masuk." : "";
  return {
    min: values.type === "adjustment" ? -maximumUnits / factor : disabled ? 0 : step,
    max: reducing ? maximumUnits / factor : Math.floor((Number.MAX_SAFE_INTEGER - allStock.balance) / (factor * conversion * step)) * step,
    step,
    maximumUnits,
    conversion,
    disabled,
    message
  };
}

function mSyncMovementQuantity(report = false)
{
  const input = document.getElementById("material-quantity");

  if (!input || !materialDraft)
  {
    return;
  }
  const values = materialDraft;
  const bounds = mMovementBounds(values);
  const notice = document.getElementById("material-quantity-notice");
  input.min = bounds.min;
  input.max = bounds.max;
  input.step = bounds.step;
  input.disabled = bounds.disabled;

  if (bounds.disabled)
  {
    input.value = "0";
    values.quantity = 0;
    notice.hidden = false;
    notice.textContent = bounds.message;
  }
  else if (input.value !== "" && Number.isFinite(Number(input.value)))
  {
    const quantity = Number(input.value);
    const precision = Math.round(1 / bounds.step);
    const bounded = Math.max(bounds.min, Math.min(bounds.max, Math.trunc((quantity + Math.sign(quantity) * 0.00000001) * precision) / precision));

    if (Math.abs(bounded - quantity) > 0.0000001)
    {
      input.value = String(bounded);
      values.quantity = bounded;
      notice.hidden = false;
      notice.textContent = quantity < bounds.min && bounds.min > 0
        ? `Jumlah harus positif. Minimal ${bounds.step} ${values.unit}.`
        : quantity > bounds.max || quantity < bounds.min
          ? `Jumlah dibatasi pada batas tindakan ini: ${bounded} ${values.unit}.`
          : `Ketelitian satuan disesuaikan menjadi ${bounded} ${values.unit}.`;
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
  const number = Number(input.value);
  document.getElementById("material-save").disabled = materialSaving || bounds.disabled || input.value === ""
    || !Number.isFinite(number) || number === 0 || number < bounds.min || number > bounds.max;
}

function mMovementUnits(values)
{
  const material = mFind(values.materialId);
  return material ? Math.round(Number(values.quantity) * mMovementBounds(values).conversion * mFactor(material)) : 0;
}

function mMovementPreview()
{
  const root = document.getElementById("material-movement-preview");
  root.replaceChildren();
  const values = materialDraft;
  const material = mFind(values.materialId);
  const bounds = mMovementBounds(values);
  const quantity = Number(values.quantity);

  if (!material || !quantity || bounds.disabled || quantity < bounds.min || quantity > bounds.max)
  {
    return;
  }
  const units = mMovementUnits(values);
  const stock = mStock(material);
  const pending = values.type === "adjustment" && materialState.role === "admin" && Math.abs(units) > 20 * mFactor(material);
  const subtract = ["damage", "transfer", "consume"].includes(values.type);
  const after = stock.balance + (values.type === "allocate" ? 0 : subtract ? -units : units);

  if (after < 0)
  {
    return;
  }
  const text = pending ? `Pengajuan ${units > 0 ? "+" : ""}${mQuantity(units, material)}. Saldo tetap ${mQuantity(stock.balance, material)} sampai disetujui.`
    : values.type === "allocate" ? `Alokasi bertambah ${mQuantity(units, material)}. Saldo fisik tetap ${mQuantity(stock.balance, material)}; tersedia menjadi ${mQuantity(stock.available - units, material)}.`
      : `${values.type === "receipt" && bounds.conversion !== 1 ? `${quantity} ${values.unit} = ${mQuantity(units, material)}. ` : ""}Saldo ${mQuantity(stock.balance, material)} menjadi ${mQuantity(after, material)}${values.type === "transfer" ? `; ${materialLocations[values.destination]} menerima ${mQuantity(units, material)}` : ""}.`;
  root.append(mNote(text));
}

function validateMaterialMovement(values, locationId = materialState.location)
{
  const errors = [];
  const add = (field, message) => errors.push({ field, message });
  const material = mFind(values.materialId);

  if (!material)
  {
    add("materialId", "Pilih bahan yang tersedia.");
    return errors;
  }

  if (!["receipt", "adjustment", "damage", "transfer", "allocate", "consume"].includes(values.type))
  {
    add("type", "Pilih tindakan yang tersedia.");
  }

  if (!material.active && !["damage", "adjustment"].includes(values.type))
  {
    add("materialId", "Bahan nonaktif tidak dapat diterima, dialokasikan, dipakai, atau ditransfer.");
  }
  const bounds = mMovementBounds(values, locationId);
  const quantity = Number(values.quantity);
  const scaled = quantity / bounds.step;
  const units = Math.round(quantity * bounds.conversion * mFactor(material));

  if (values.quantity === "" || !Number.isFinite(quantity) || quantity === 0 || bounds.disabled
    || quantity < bounds.min || quantity > bounds.max || !Number.isSafeInteger(units)
    || Math.abs(scaled - Math.round(scaled)) > 0.000001)
  {
    add("quantity", bounds.message || `Jumlah harus sesuai satuan dan tidak melebihi stok bebas pada lokasi/batch terpilih.`);
  }

  if (values.type !== "receipt" && values.unit !== material.unit)
  {
    add("quantity", "Tindakan ini harus menggunakan satuan dasar bahan.");
  }

  if (values.type === "receipt" && values.unit !== material.unit
    && !material.packaging.some((pack) => pack.name === values.unit))
  {
    add("unit", "Pilih satuan penerimaan yang dikonfigurasi untuk bahan ini.");
  }

  if (!String(values.reference || "").trim())
  {
    add("reference", "Isi referensi dokumen agar pencatatan dapat ditelusuri.");
  }

  if (String(values.reason || "").trim().length < 5)
  {
    add("reason", "Tuliskan alasan minimal 5 karakter.");
  }

  if (material.batchTracked)
  {
    const batch = material.batches.find((entry) => entry.id === values.batchId);

    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$/.test(values.batchId || ""))
    {
      add("batchId", "Isi atau pilih kode batch 2–64 karakter yang valid.");
    }

    if (values.type === "receipt")
    {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(values.expires || "") || values.expires < materialSnapshot)
      {
        add("expires", "Batas pakai penerimaan harus hari ini atau setelahnya.");
      }

      if (batch && batch.expires !== values.expires)
      {
        add("expires", `Batch ${batch.id} sudah memiliki batas pakai ${mDate(batch.expires)}. Gunakan tanggal yang sama atau kode batch baru.`);
      }
    }
    else if (!batch)
    {
      add("batchId", "Pilih batch yang tercatat pada bahan ini.");
    }
  }

  if (values.type === "transfer" && (!materialLocations[values.destination] || values.destination === locationId))
  {
    add("destination", "Pilih lokasi tujuan yang berbeda dari sumber.");
  }

  if (values.type === "allocate" && !materialJobs.some((job) => job.id === values.jobId))
  {
    add("jobId", "Pilih produksi buket yang tercatat.");
  }

  if (values.type === "consume")
  {
    const allocation = materialAllocations.find((entry) => entry.id === values.allocationId);

    if (!allocation || allocation.materialId !== material.id || allocation.locationId !== locationId
      || allocation.batchId !== values.batchId || mAllocationRemaining(allocation) < units)
    {
      add("allocationId", "Alokasi tidak sesuai atau sudah terpakai/dilepaskan. Pilih alokasi aktif dan periksa sisa terbaru.");
    }
  }
  return errors;
}

async function submitMaterialMovement(event)
{
  event.preventDefault();
  const form = event.currentTarget;
  const errors = validateMaterialMovement(materialDraft);

  if (errors.length)
  {
    mShowErrors(form, errors);
    return;
  }
  const values = structuredClone(materialDraft);
  const material = mFind(values.materialId);
  const units = mMovementUnits(values);

  if (!await mConfirm("Simpan pencatatan bahan?",
  [
    `${material.name}, ${Math.abs(Number(values.quantity))} ${values.unit}, ${materialLocations[materialState.location]}.`,
    document.getElementById("material-movement-preview").textContent,
    `Referensi: ${values.reference}. ${values.reason}`
  ], values.type === "allocate" ? "Simpan alokasi" : values.type === "consume" ? "Catat pemakaian" : "Simpan mutasi"))
  {
    return;
  }
  await mSave(form, () =>
  {
    const currentErrors = validateMaterialMovement(values);

    if (currentErrors.length)
    {
      throw new Error(currentErrors[0].message);
    }
    const reference = values.reference.trim();
    const reason = values.reason.trim();

    if (values.type === "allocate")
    {
      materialAllocations.push(
      {
        id: `allocation-${++materialSequence}`,
        materialId: material.id,
        locationId: materialState.location,
        batchId: material.batchTracked ? values.batchId : "",
        units, consumed: 0, released: 0,
        jobId: values.jobId,
        actor: mActor(),
        at: "2026-11-04T10:30:00+07:00"
      });
      mHistory(material.id, "Bahan dialokasikan", `${values.jobId}, ${mQuantity(units, material)}, ${reference}. ${reason}`);
      return;
    }

    if (values.type === "adjustment" && materialState.role === "admin" && Math.abs(units) > 20 * mFactor(material))
    {
      materialApprovals.push(
      {
        id: `request-${++materialSequence}`,
        materialId: material.id,
        locationId: materialState.location,
        batchId: material.batchTracked ? values.batchId : "",
        units, reference, reason,
        actor: mActor(), status: "pending",
        at: "2026-11-04T10:30:00+07:00"
      });
      return;
    }

    if (values.type === "receipt" && material.batchTracked && !material.batches.some((batch) => batch.id === values.batchId))
    {
      material.batches.push({ id: values.batchId, received: materialSnapshot, expires: values.expires });
    }
    const subtract = ["damage", "transfer", "consume"].includes(values.type);
    const entry = mRecord(material.id, subtract ? -units : units, values.type,
    {
      batchId: material.batchTracked ? values.batchId : "",
      reference, reason,
      allocationId: values.type === "consume" ? values.allocationId : ""
    });

    if (values.type === "transfer")
    {
      mRecord(material.id, units, "transferIn",
      {
        locationId: values.destination,
        batchId: entry.batchId,
        reference,
        reason: `Dari ${materialLocations[materialState.location]}. ${reason}`,
        transferId: entry.id
      });
    }

    if (values.type === "consume")
    {
      const allocation = materialAllocations.find((entry) => entry.id === values.allocationId);
      allocation.consumed += units;
    }
  }, values.type === "allocate" ? "Alokasi disimpan. Saldo fisik tetap."
    : values.type === "adjustment" && materialState.role === "admin" && Math.abs(units) > 20 * mFactor(material)
      ? "Pengajuan dikirim ke antrean pratinjau SuperAdmin. Saldo belum berubah."
      : "Pencatatan disimpan satu kali pada riwayat bahan.",
  values.type === "adjustment" && materialState.role === "admin" && Math.abs(units) > 20 * mFactor(material)
    ? { material: "", workspace: "approvals" }
    : { material: material.id, tab: ["allocate", "consume"].includes(values.type) ? "usage" : "batches" });
}

function renderMaterialReview(root)
{
  const request = materialApprovals.find((entry) => entry.id === materialState.request);
  const form = mFormBase(root, "Tinjau penyesuaian");

  if (!request || materialState.role !== "superadmin")
  {
    form.append(mNote("Peninjauan pengajuan hanya tersedia untuk SuperAdmin dengan pengajuan yang valid.", true), mButton("Kembali ke daftar", "list"));
    return;
  }
  materialDraft ||= { decision: "approve", reason: "" };
  const material = mFind(request.materialId);
  const section = mSection("review", "Ringkasan pengajuan", "Periksa dokumen dan saldo terbaru. Keputusan berlaku satu kali untuk pengajuan ini.");
  section.append(mFacts(
  [
    ["Bahan", `${material.name}, ${material.code}`],
    ["Lokasi", materialLocations[request.locationId]],
    ["Perubahan", `${request.units > 0 ? "+" : ""}${mQuantity(request.units, material)}`],
    ["Saldo saat ini", mQuantity(mStock(material, request.locationId).balance, material)],
    ["Pengaju", request.actor], ["Referensi", request.reference]
  ]));
  section.append(mNote(request.reason));

  if (request.status !== "pending")
  {
    section.append(mNote("Pengajuan ini sudah diputuskan. Saldo tidak akan diterapkan ulang."));
    form.append(section);
    return;
  }
  const fields = mNode("div", "product-fields");
  fields.append(mField("decision", "Keputusan", "select", materialDraft.decision,
  {
    required: true, choices: [["approve", "Setujui"], ["reject", "Tolak"]],
    bind: (value) => materialDraft.decision = value
  }), mField("reason", "Alasan keputusan", "textarea", materialDraft.reason,
  {
    required: true, wide: true, bind: (value) => materialDraft.reason = value
  }));
  section.append(fields, mNote("Pengaju tidak boleh menyetujui pengajuannya sendiri. Saldo dan reservasi diperiksa ulang ketika keputusan disimpan."));
  form.append(section);
  mFormFooter(form, "Simpan keputusan");
  form.addEventListener("submit", async (event) =>
  {
    event.preventDefault();
    const errors = mValidateDecision(request, materialDraft);

    if (errors.length)
    {
      mShowErrors(form, errors);
      return;
    }
    const decision = structuredClone(materialDraft);

    if (!await mConfirm(decision.decision === "approve" ? "Setujui penyesuaian?" : "Tolak penyesuaian?",
    [
      `${material.name}, ${request.units > 0 ? "+" : ""}${mQuantity(request.units, material)}.`,
      decision.decision === "approve" ? "Saldo akan berubah sesuai pengajuan setelah pemeriksaan ulang." : "Saldo tidak berubah ketika pengajuan ditolak.",
      decision.reason
    ], "Simpan keputusan"))
    {
      return;
    }
    await mSave(form, () =>
    {
      const currentErrors = mValidateDecision(request, decision);

      if (currentErrors.length)
      {
        throw new Error(currentErrors[0].message);
      }

      if (decision.decision === "approve")
      {
        mRecord(material.id, request.units, "adjustment",
        {
          locationId: request.locationId,
          batchId: request.batchId,
          reference: request.reference,
          reason: `${request.reason} Disetujui: ${decision.reason}`,
          requestId: request.id
        });
      }
      request.status = decision.decision === "approve" ? "approved" : "rejected";
      request.checker = mActor();
      request.decisionReason = decision.reason.trim();
    }, "Keputusan disimpan. Pengajuan tidak dapat diterapkan ulang.",
    { material: "", workspace: "approvals", request: "" });
  });
}

function mValidateDecision(request, decision)
{
  const errors = [];

  if (materialState.role !== "superadmin" || request.status !== "pending" || request.actor === mActor())
  {
    errors.push({ field: "decision", message: "Keputusan memerlukan SuperAdmin berbeda dan pengajuan yang masih menunggu." });
  }

  if (!["approve", "reject"].includes(decision.decision))
  {
    errors.push({ field: "decision", message: "Pilih setujui atau tolak." });
  }

  if (decision.reason.trim().length < 5)
  {
    errors.push({ field: "reason", message: "Tuliskan alasan keputusan minimal 5 karakter." });
  }

  if (decision.decision === "approve")
  {
    const material = mFind(request.materialId);
    const stockErrors = validateMaterialMovement(
    {
      type: "adjustment",
      materialId: request.materialId,
      batchId: request.batchId,
      quantity: request.units / mFactor(material),
      unit: material.unit,
      reference: request.reference,
      reason: request.reason
    }, request.locationId);
    errors.push(...stockErrors.map((error) => ({ field: "decision", message: error.message })));
  }
  return errors;
}

function mUpdateFormNavigation()
{
  const navigation = document.querySelector(".material-form-nav");

  if (!navigation)
  {
    return;
  }
  const sections = [...document.querySelectorAll(".material-form-section")];
  const atBottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
  const current = atBottom ? sections.at(-1) : sections.filter((section) =>
  {
    return section.getBoundingClientRect().top <= navigation.getBoundingClientRect().bottom + 24;
  }).at(-1) || sections[0];
  navigation.querySelectorAll("a").forEach((link) =>
  {
    if (link.hash === `#${current?.id}`)
    {
      link.setAttribute("aria-current", "location");
    }
    else
    {
      link.removeAttribute("aria-current");
    }
  });
}

let materialNavigationQueued = false;
window.addEventListener("scroll", () =>
{
  if (!materialNavigationQueued)
  {
    materialNavigationQueued = true;
    requestAnimationFrame(() =>
    {
      materialNavigationQueued = false;
      mUpdateFormNavigation();
    });
  }
}, { passive: true });
