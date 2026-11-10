"use strict";

document.documentElement.classList.add("js");
const materialPageSize = 5;
const materialTypeLabels =
{
  opening: "Saldo awal",
  receipt: "Barang masuk",
  adjustment: "Penyesuaian stok",
  damage: "Rusak / buang",
  transfer: "Transfer keluar",
  transferIn: "Transfer masuk",
  consume: "Pemakaian produksi"
};
let materialState = readMaterialState();
let materialDraft = null;
let materialDirty = false;
let materialSaving = false;
let materialSequence = 100;
let materialLoadState = new URLSearchParams(location.search).get("state") || "full";
const materialInitialData = structuredClone(
{
  materials: productionMaterials,
  ledger: materialLedger,
  allocations: materialAllocations,
  approvals: materialApprovals
});

function mNode(tag, className = "", text = "")
{
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

function mIcon(name)
{
  const namespace = "http://www.w3.org/2000/svg";
  const icon = document.createElementNS(namespace, "svg");
  const use = document.createElementNS(namespace, "use");
  icon.setAttribute("class", "icon work-signal-icon");
  icon.setAttribute("aria-hidden", "true");
  use.setAttribute("href", `#i-${name}`);
  icon.append(use);
  return icon;
}

function mButton(label, action, primary = false, data = {})
{
  const button = mNode("button", primary ? "queue-button queue-button--primary" : "queue-button", label);
  button.type = "button";
  button.dataset.materialAction = action;
  Object.assign(button.dataset, data);
  return button;
}

function mBadge(label, tone = "neutral", icon = "info")
{
  const badge = mNode("span", `work-signal work-signal--${tone === "danger" ? "critical" : tone}`);
  badge.append(mIcon(icon), mNode("span", "material-signal-label", label));
  return badge;
}

function mNote(text, warning = false)
{
  const note = mNode("p", warning ? "product-note product-note--warning" : "product-note");
  note.append(mIcon(warning ? "alert" : "info"), mNode("span", "", text));
  return note;
}

function mFind(id = materialState.material)
{
  return productionMaterials.find((material) => material.id === id);
}

function mFactor(material)
{
  return material.unit === "meter" ? 100 : 1;
}

function mQuantity(units, material, withUnit = true)
{
  const number = new Intl.NumberFormat("id-ID",
  {
    maximumFractionDigits: material.unit === "meter" ? 2 : 0
  }).format(units / mFactor(material));
  return withUnit ? `${number} ${material.unit}` : number;
}

function mDate(value)
{
  return new Intl.DateTimeFormat("id-ID",
  {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta"
  }).format(new Date(value.length === 10 ? `${value}T12:00:00+07:00` : value));
}

function mAllocationRemaining(allocation)
{
  return Math.max(0, allocation.units - allocation.consumed - allocation.released);
}

function mExpired(material, batchId)
{
  const batch = material.batches.find((entry) => entry.id === batchId);
  return Boolean(batch?.expires && batch.expires < materialSnapshot);
}

function mStock(material, locationId = materialState.location, batchId = null)
{
  const entries = materialLedger.filter((entry) => entry.materialId === material.id
    && entry.locationId === locationId && (batchId === null || entry.batchId === batchId));
  const balance = entries.reduce((sum, entry) => sum + entry.units, 0);
  const allocated = materialAllocations.filter((entry) => entry.materialId === material.id
    && entry.locationId === locationId && (batchId === null || entry.batchId === batchId))
    .reduce((sum, entry) => sum + mAllocationRemaining(entry), 0);
  const expired = entries.filter((entry) => mExpired(material, entry.batchId))
    .reduce((sum, entry) => sum + entry.units, 0);
  return {
    balance,
    allocated,
    expired,
    available: Math.max(0, balance - allocated - expired),
    removable: Math.max(0, balance - allocated)
  };
}

function mReferenced(id)
{
  return materialLedger.some((entry) => entry.materialId === id)
    || materialAllocations.some((entry) => entry.materialId === id)
    || materialApprovals.some((entry) => entry.materialId === id);
}

function mBatchCondition(material, batch)
{
  if (!batch?.expires)
  {
    return mBadge("Tanpa batas pakai", "neutral", "info");
  }

  const days = Math.round((Date.parse(batch.expires) - Date.parse(materialSnapshot)) / 86400000);

  if (days < 0)
  {
    return mBadge("Tidak dapat digunakan", "danger", "alert");
  }

  if (days <= 2)
  {
    return mBadge(days === 0 ? "Batas pakai hari ini" : `Batas pakai ${days} hari lagi`, "warning", "clock");
  }

  return mBadge("Layak digunakan", "success", "check");
}

function mCondition(material)
{
  const stock = mStock(material);

  if (!material.active)
  {
    return mBadge("Nonaktif", "neutral", "close");
  }

  if (stock.expired > 0)
  {
    return mBadge("Batch perlu ditangani", "danger", "alert");
  }

  if (stock.available === 0)
  {
    return mBadge("Habis", "danger", "alert");
  }

  if (stock.available <= material.minimum * mFactor(material))
  {
    return mBadge("Stok menipis", "warning", "alert");
  }

  const soon = material.batches.some((batch) =>
  {
    const days = (Date.parse(batch.expires) - Date.parse(materialSnapshot)) / 86400000;
    return days >= 0 && days <= 2 && mStock(material, materialState.location, batch.id).balance > 0;
  });
  return soon ? mBadge("Segera digunakan", "warning", "clock")
    : mBadge("Tersedia", "success", "check");
}

function readMaterialState()
{
  const query = new URLSearchParams(location.search);
  const choose = (key, allowed, fallback) => allowed.includes(query.get(key)) ? query.get(key) : fallback;
  return {
    workspace: choose("workspace", ["materials", "movements", "usage", "approvals"], "materials"),
    location: choose("location", ["pusat", "toko"], "pusat"),
    role: choose("role", ["admin", "superadmin"], "admin"),
    material: query.get("material") || "",
    mode: choose("mode", ["view", "new", "edit", "receipt", "adjustment", "damage", "transfer", "allocate", "consume", "review"], "view"),
    tab: choose("tab", ["info", "batches", "usage", "activity"], "info"),
    search: query.get("q") || "",
    category: query.get("category") || "all",
    condition: choose("condition", ["all", "attention", "empty", "low", "expired", "soon", "available"], "all"),
    status: choose("status", ["all", "active", "inactive"], "active"),
    sort: choose("sort", ["attention", "name"], "attention"),
    page: Math.max(1, Number.parseInt(query.get("page"), 10) || 1),
    allocation: query.get("allocation") || "",
    request: query.get("request") || ""
  };
}

function writeMaterialUrl(replace = false)
{
  const url = new URL(location.href);
  const defaults =
  {
    workspace: "materials", location: "pusat", role: "admin", material: "", mode: "view",
    tab: "info", search: "", category: "all", condition: "all", status: "active",
    sort: "attention", page: 1, allocation: "", request: ""
  };

  for (const [key, value] of Object.entries(materialState))
  {
    const parameter = key === "search" ? "q" : key;

    if (value === defaults[key])
    {
      url.searchParams.delete(parameter);
    }
    else
    {
      url.searchParams.set(parameter, value);
    }
  }

  try
  {
    history[replace ? "replaceState" : "pushState"](null, "", url);
  }
  catch
  {
    // File previews can restrict history; the rendered state still works.
  }
}

async function mConfirm(title, paragraphs, label = "Konfirmasi")
{
  const dialog = document.getElementById("material-confirm");
  document.getElementById("material-confirm-title").textContent = title;
  const body = document.getElementById("material-confirm-copy");
  body.replaceChildren(...paragraphs.map((text) => mNode("p", "", text)));
  const button = document.getElementById("material-confirm-submit");
  button.textContent = label;
  dialog.returnValue = "cancel";
  const previous = document.activeElement;
  dialog.showModal();
  dialog.querySelector('[value="cancel"]').focus();
  return new Promise((resolve) =>
  {
    dialog.addEventListener("close", () =>
    {
      previous?.isConnected && previous.focus({ preventScroll: true });
      resolve(dialog.returnValue === "confirm");
    }, { once: true });
  });
}

async function mNavigate(changes, scroll = true)
{
  if (materialSaving)
  {
    return false;
  }

  if (materialDirty && !await mConfirm("Tinggalkan perubahan?",
  ["Isian yang belum disimpan akan hilang. Kembali untuk melanjutkan pengisian atau tinggalkan halaman ini."], "Tinggalkan"))
  {
    return false;
  }

  materialDraft = null;
  materialDirty = false;
  Object.assign(materialState, changes);
  writeMaterialUrl();
  renderMaterials();

  if (scroll)
  {
    window.scrollTo(0, 0);
    document.getElementById("material-page-title").focus({ preventScroll: true });
  }

  return true;
}

function mFeedback(text, warning = false)
{
  const root = document.getElementById("material-feedback");
  root.hidden = false;
  root.textContent = text;
  root.classList.toggle("product-feedback--warning", warning);
}

function mActor()
{
  return materialState.role === "superadmin" ? "SuperAdmin RylVa" : "Admin RylVa";
}

function mRecord(materialId, units, type, values = {})
{
  if (!Number.isSafeInteger(units) || units === 0)
  {
    throw new Error("Jumlah mutasi harus tepat dalam satuan dasar dan bukan nol.");
  }

  const entry =
  {
    id: `movement-${++materialSequence}`,
    materialId,
    locationId: materialState.location,
    batchId: "",
    units,
    type,
    actor: mActor(),
    at: "2026-11-04T10:30:00+07:00",
    ...values
  };
  materialLedger.push(entry);
  return entry;
}

function mHistory(materialId, action, reason)
{
  materialHistory.push(
  {
    materialId, action, reason,
    actor: mActor(),
    at: "2026-11-04T10:30:00+07:00"
  });
}

async function mSave(form, mutation, message, destination)
{
  if (materialSaving)
  {
    return;
  }

  materialSaving = true;
  form.setAttribute("aria-busy", "true");
  const controls = [...form.querySelectorAll("button, input, select, textarea")];
  const previousDisabled = controls.map((control) => control.disabled);
  controls.forEach((control) => control.disabled = true);
  const button = form.querySelector('[type="submit"]');
  const previousLabel = button?.textContent;

  if (button)
  {
    button.textContent = "Menyimpan…";
  }

  let saved = false;

  try
  {
    await new Promise((resolve) => setTimeout(resolve, 240));
    const simulate = document.getElementById("material-fail-save");

    if (simulate.checked)
    {
      simulate.checked = false;
      throw new Error("Simpan gagal pada simulasi ini. Isian tetap tersedia; periksa lalu coba lagi.");
    }

    mutation();
    saved = true;
    materialDraft = null;
    materialDirty = false;
  }
  catch (error)
  {
    mShowErrors(form, [{ field: "", message: error.message }]);
  }
  finally
  {
    materialSaving = false;
    form.removeAttribute("aria-busy");
    controls.forEach((control, index) => control.disabled = previousDisabled[index]);

    if (button)
    {
      button.textContent = previousLabel;
    }
  }

  if (saved)
  {
    Object.assign(materialState, { mode: "view" }, destination);
    writeMaterialUrl();
    renderMaterials();
    mFeedback(message);
    window.scrollTo(0, 0);
    document.getElementById("material-feedback").focus({ preventScroll: true });
  }
}

function mTable(headers, rows, label)
{
  const table = mNode("table", "material-table");
  const caption = mNode("caption", "sr-only", label);
  const head = mNode("thead");
  const headRow = mNode("tr");

  headers.forEach((header, index) =>
  {
    const cell = mNode("th", [1, 2, 3].includes(index) ? "material-number" : "", header);
    cell.scope = "col";
    headRow.append(cell);
  });
  head.append(headRow);
  const body = mNode("tbody");

  for (const values of rows)
  {
    const row = mNode("tr");
    values.forEach((value, index) =>
    {
      const cell = mNode("td", [1, 2, 3].includes(index) ? "material-number" : "");
      cell.dataset.label = headers[index];
      cell.append(value instanceof Node ? value : document.createTextNode(String(value)));

      if (value instanceof Element && (value.matches("button") || value.querySelector("button")))
      {
        cell.classList.add("material-actions-cell");
      }
      row.append(cell);
    });
    body.append(row);
  }

  table.append(caption, head, body);

  if (label === "Batch bahan di lokasi terpilih")
  {
    table.classList.add("material-batches");
  }
  return table;
}

function mFacts(entries)
{
  const list = mNode("dl", "material-facts");

  for (const [label, value] of entries)
  {
    const pair = mNode("div");
    const description = mNode("dd");
    description.append(value instanceof Node ? value : document.createTextNode(String(value)));
    pair.append(mNode("dt", "", label), description);
    list.append(pair);
  }

  return list;
}

function mBreadcrumb()
{
  const root = document.getElementById("material-breadcrumb");
  const trail =
  [
    ["Ruang kerja", `../staff/admin-dashboard.html${materialState.role === "superadmin" ? "?role=superadmin" : ""}`],
    ["Bahan Produksi", "list"]
  ];
  const material = mFind();

  if (material)
  {
    trail.push([material.name, "detail"]);
  }

  const titles =
  {
    new: "Tambah bahan", edit: "Edit bahan", receipt: "Catat barang masuk", adjustment: "Penyesuaian stok",
    damage: "Catat rusak / buang", transfer: "Transfer bahan", allocate: "Alokasikan bahan",
    consume: "Catat pemakaian", review: "Tinjau penyesuaian"
  };

  if (materialState.mode !== "view")
  {
    trail.push([titles[materialState.mode], ""]);
  }
  else if (!material && materialState.workspace !== "materials")
  {
    trail.push([{ movements: "Mutasi stok", usage: "Pemakaian produksi", approvals: "Persetujuan stok" }[materialState.workspace], ""]);
  }

  const list = mNode("ol");
  trail.forEach(([label, target], index) =>
  {
    const item = mNode("li");

    if (index > 0)
    {
      const separator = mNode("span", "product-breadcrumb-separator", "/");
      separator.setAttribute("aria-hidden", "true");
      item.append(separator);
    }

    if (index === trail.length - 1)
    {
      const current = mNode("span", "", label);
      current.setAttribute("aria-current", "page");
      item.append(current);
    }
    else
    {
      const link = mNode("a", "", label);
      link.href = target === "list" || target === "detail"
        ? `../staff/production-materials.html?role=${materialState.role}${target === "detail" ? `&material=${material.id}` : ""}` : target;

      if (["list", "detail"].includes(target))
      {
        link.addEventListener("click", (event) =>
        {
          if (!event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0)
          {
            event.preventDefault();
            mNavigate({ material: target === "detail" ? material.id : "", mode: "view", workspace: "materials" });
          }
        });
      }
      item.append(link);
    }
    list.append(item);
  });
  root.replaceChildren(list);
}

function renderMaterials()
{
  const root = document.getElementById("material-view");
  root.replaceChildren();
  document.getElementById("material-feedback").hidden = true;
  document.getElementById("material-location").value = materialState.location;
  document.getElementById("material-profile").value = materialState.role;
  document.getElementById("material-load-state").value = materialLoadState;
  document.getElementById("profile-name").textContent = mActor();
  document.getElementById("preview-role").textContent = `Pratinjau ${materialState.role === "superadmin" ? "SuperAdmin" : "Admin"}`;
  document.querySelectorAll("[data-superadmin-only]").forEach((node) => node.hidden = materialState.role !== "superadmin");
  document.querySelectorAll("[data-role-link]").forEach((link) =>
  {
    const url = new URL(link.getAttribute("href"), location.href);

    if (materialState.role === "superadmin")
    {
      url.searchParams.set("role", "superadmin");
    }
    else
    {
      url.searchParams.delete("role");
    }
    link.href = url.href;
  });
  mBreadcrumb();
  const editing = materialState.mode !== "view";
  document.getElementById("material-page-actions").hidden = editing || Boolean(materialState.material);
  const title = document.getElementById("material-page-title");
  title.textContent = "Bahan Produksi";
  document.getElementById("material-page-intro").textContent = "Jaga bahan siap pakai untuk setiap rangkaian.";

  if (materialState.material && !mFind())
  {
    const panel = mNode("section", "product-panel");
    panel.append(mNode("h2", "", "Bahan tidak ditemukan"), mNote("Bahan mungkin sudah dihapus atau tautannya tidak tersedia."), mButton("Kembali ke daftar", "list"));
    root.append(panel);
    return;
  }

  if (editing)
  {
    renderMaterialForm(root);
  }
  else if (materialState.material)
  {
    renderMaterialDetail(root);
  }
  else
  {
    renderMaterialWorkspace(root);
  }

  window.adminControls?.enhanceSelects();
}

function renderMaterialWorkspace(root)
{
  const navigation = mNode("nav", "product-workspaces material-workspaces");
  navigation.setAttribute("aria-label", "Ruang kerja bahan");

  for (const [key, label] of
  [
    ["materials", "Daftar bahan"], ["movements", "Mutasi stok"],
    ["usage", "Pemakaian produksi"], ["approvals", "Persetujuan stok"]
  ])
  {
    const button = mButton(label, "workspace", false, { workspace: key });
    button.className = "";

    if (key === materialState.workspace)
    {
      button.setAttribute("aria-current", "page");
    }

    if (key === "approvals")
    {
      const count = materialApprovals.filter((request) => request.status === "pending").length;

      if (count)
      {
        button.append(mNode("span", "product-count", count));
      }
    }
    navigation.append(button);
  }
  root.append(navigation);

  if (["loading", "error"].includes(materialLoadState))
  {
    const panel = mNode("section", "product-panel");
    panel.append(mNode("h2", "", materialLoadState === "loading" ? "Memuat persediaan" : "Persediaan belum dapat dimuat"));

    if (materialLoadState === "loading")
    {
      panel.setAttribute("aria-busy", "true");

      for (let index = 0; index < 4; index += 1)
      {
        panel.append(mNode("div", "skeleton-row"));
      }
      panel.append(mButton("Tampilkan data contoh", "retry"));
    }
    else
    {
      panel.append(mNote("Data belum tersedia. Coba muat lagi untuk melanjutkan pencatatan.", true), mButton("Coba lagi", "retry", true));
    }
    root.append(panel);
    return;
  }

  if (materialState.workspace === "materials")
  {
    renderMaterialCatalog(root);
  }
  else if (materialState.workspace === "movements")
  {
    renderMaterialMovements(root);
  }
  else if (materialState.workspace === "usage")
  {
    renderMaterialUsage(root);
  }
  else
  {
    renderMaterialApprovals(root);
  }
}

function materialNeeds(material, condition)
{
  const stock = mStock(material);
  const soon = material.batches.some((batch) =>
  {
    const days = (Date.parse(batch.expires) - Date.parse(materialSnapshot)) / 86400000;
    return days >= 0 && days <= 2 && mStock(material, materialState.location, batch.id).balance > 0;
  });
  const low = stock.available > 0 && stock.available <= material.minimum * mFactor(material);
  return condition === "all" || (condition === "expired" && stock.expired > 0)
    || (condition === "empty" && stock.available === 0) || (condition === "low" && low)
    || (condition === "soon" && soon) || (condition === "available" && stock.available > 0)
    || (condition === "attention" && (stock.expired > 0 || stock.available === 0 || low || soon));
}

function renderMaterialCatalog(root)
{
  const active = productionMaterials.filter((material) => material.active);
  const summary = mNode("div", "material-summary");
  summary.setAttribute("aria-label", "Ringkasan bahan aktif di lokasi terpilih");

  for (const [condition, label, count] of
  [
    ["all", "jenis bahan aktif", active.length],
    ["empty", "bahan habis", active.filter((material) => materialNeeds(material, "empty")).length],
    ["low", "bahan menipis", active.filter((material) => materialNeeds(material, "low")).length],
    ["expired", "bahan lewat batas pakai", active.filter((material) => materialNeeds(material, "expired")).length]
  ])
  {
    const button = mButton("", "condition", false, { condition });
    button.className = "";
    button.append(mNode("strong", "", count), document.createTextNode(` ${label}`));
    button.setAttribute("aria-pressed", String(materialState.condition === condition));
    summary.append(button);
  }
  root.append(summary);
  const expiredMaterials = active.filter((material) => mStock(material).expired > 0);

  if (expiredMaterials.length)
  {
    const note = mNode("section", "material-attention");
    note.setAttribute("aria-label", "Bahan perlu penanganan");
    const message = mNode("div");
    const text = mNode("div");
    text.append(mNode("p", "", `${expiredMaterials.length} bahan memiliki batch lewat batas pakai`));
    text.append(mNode("p", "", "Tidak dihitung sebagai stok tersedia."));
    message.append(mIcon("alert"), text);
    const button = mButton("Periksa batch", "condition", false, { condition: "expired" });
    button.className = "queue-text-button";
    note.append(message, button);
    root.append(note);
  }
  const sheet = mNode("section", "catalog-sheet");
  sheet.setAttribute("aria-label", "Daftar bahan produksi");
  const toolbar = mNode("div", "material-toolbar");
  const field = mNode("div", "product-field");
  const label = mNode("label", "", "Cari bahan atau kode");
  label.htmlFor = "material-search";
  const search = mNode("input");
  search.type = "search";
  search.id = "material-search";
  search.placeholder = "Nama bahan atau kode bahan";
  search.value = materialState.search;
  search.addEventListener("input", () =>
  {
    materialState.search = search.value;
    materialState.page = 1;
    writeMaterialUrl(true);
    renderMaterialRows();
  });
  field.append(label, search);
  const filter = mButton("Filter", "filters");
  filter.setAttribute("aria-controls", "material-filters");
  filter.setAttribute("aria-expanded", "false");
  const reset = mButton("Hapus filter", "reset");
  const toolbarActions = mNode("div", "product-inline-actions");
  toolbarActions.append(filter, reset);
  toolbar.append(field, toolbarActions);
  const filters = mNode("div", "material-filters");
  filters.id = "material-filters";
  filters.hidden = true;
  const options =
  [
    ["category", "Kategori", [["all", "Semua kategori"], ...materialCategories.map((category) => [category.id, category.name])]],
    ["condition", "Kondisi", [["all", "Semua kondisi"], ["attention", "Perlu perhatian"], ["empty", "Habis"], ["low", "Menipis"], ["expired", "Lewat batas pakai"], ["soon", "Segera digunakan"], ["available", "Tersedia"]]],
    ["status", "Status bahan", [["all", "Semua status"], ["active", "Aktif"], ["inactive", "Nonaktif"]]]
  ];

  for (const [key, text, choices] of options)
  {
    filters.append(mField(`filter-${key}`, text, "select", materialState[key],
    {
      choices,
      bind: (value) => materialState[key] = value,
      dirty: false,
      change: () =>
      {
        materialState.page = 1;
        writeMaterialUrl();
        renderMaterialRows();
      }
    }));
  }
  const meta = mNode("div", "material-meta");
  const result = mNode("p");
  result.id = "material-result";
  result.setAttribute("role", "status");
  const sort = mField("sort", "Urutkan", "select", materialState.sort,
  {
    choices: [["attention", "Perlu perhatian"], ["name", "Nama bahan A–Z"]],
    bind: (value) => materialState.sort = value,
    dirty: false,
    change: () =>
    {
      materialState.page = 1;
      writeMaterialUrl();
      renderMaterialRows();
    }
  });
  meta.append(result, sort);
  const rows = mNode("div");
  rows.id = "material-rows";
  sheet.append(toolbar, filters, meta, rows);
  root.append(sheet);
  renderMaterialRows();
  root.append(mNote("Tersedia = saldo fisik dikurangi alokasi aktif dan bahan melewati batas pakai. Setiap jumlah memakai satuan bahannya."));
}

function renderMaterialRows()
{
  const query = materialState.search.trim().toLocaleLowerCase("id");
  const materials = productionMaterials.filter((material) =>
  {
    return `${material.name} ${material.code}`.toLocaleLowerCase("id").includes(query)
      && (materialState.category === "all" || material.category === materialState.category)
      && (materialState.status === "all" || material.active === (materialState.status === "active"))
      && materialNeeds(material, materialState.condition);
  });
  const rank = (material) =>
  {
    const stock = mStock(material);
    return stock.expired > 0 ? 0 : stock.available === 0 ? 1
      : stock.available <= material.minimum * mFactor(material) ? 2 : 3;
  };
  materials.sort((first, second) =>
  {
    return (materialState.sort === "attention" ? rank(first) - rank(second) : 0)
      || first.name.localeCompare(second.name, "id");
  });
  const root = document.getElementById("material-rows");
  root.replaceChildren();
  document.getElementById("material-result").textContent = `${materials.length} bahan ditemukan di ${materialLocations[materialState.location]}`;
  const pages = Math.max(1, Math.ceil(materials.length / materialPageSize));
  materialState.page = Math.min(materialState.page, pages);
  const first = (materialState.page - 1) * materialPageSize;

  if (!materials.length)
  {
    const empty = mNode("div", "product-panel");
    empty.append(mNode("h2", "", productionMaterials.length ? "Tidak ada bahan yang cocok" : "Belum ada bahan produksi"));
    empty.append(mNode("p", "", productionMaterials.length
      ? "Coba nama atau kode lain, atau hapus filter untuk melihat bahan lainnya."
      : "Tambahkan bahan pertama, lalu catat penerimaan untuk mengisi persediaan."));
    empty.append(mButton(productionMaterials.length ? "Hapus filter" : "Tambah bahan", productionMaterials.length ? "reset" : "new", true));
    root.append(empty);
    return;
  }
  const rows = materials.slice(first, first + materialPageSize).map((material) =>
  {
    const stock = mStock(material);
    const identity = mNode("div");
    identity.append(mNode("strong", "", material.name));
    const category = materialCategories.find((entry) => entry.id === material.category)?.name;
    identity.append(mNode("small", "", `${material.code}, ${category}`));
    const available = mNode("div", "material-number", mQuantity(stock.available, material));
    const balance = mNode("div", "material-number", mQuantity(stock.balance, material));

    if (stock.expired)
    {
      balance.append(mNode("small", "", `${mQuantity(stock.expired, material)} tidak layak pakai`));
    }
    return [identity, balance, mQuantity(stock.allocated, material), available,
      mCondition(material), mButton("Buka", "open", false, { id: material.id })];
  });
  root.append(mTable(["Bahan", "Saldo fisik", "Dialokasikan", "Tersedia", "Kondisi", "Aksi"], rows, "Persediaan bahan produksi per lokasi"));
  const pagination = mNode("div", "material-pagination");
  pagination.append(mNode("p", "", `Menampilkan ${first + 1} sampai ${Math.min(first + materialPageSize, materials.length)} dari ${materials.length} bahan`));
  const actions = mNode("div", "pagination-actions");

  for (const [direction, label] of [[-1, "Halaman sebelumnya"], [1, "Halaman berikutnya"]])
  {
    const button = mButton("", "page", false, { direction });
    button.className = "icon-button";
    button.setAttribute("aria-label", label);
    const icon = mIcon("chevron");

    if (direction === 1)
    {
      icon.classList.add("next-chevron");
    }
    button.append(icon);
    button.disabled = direction === -1 ? materialState.page <= 1 : materialState.page >= pages;
    actions.append(button);

    if (direction === -1)
    {
      actions.append(mNode("span", "", `${materialState.page} dari ${pages}`));
    }
  }
  pagination.append(actions);
  root.append(pagination);
}

function renderMaterialDetail(root)
{
  const material = mFind();
  document.getElementById("material-page-title").textContent = "Detail bahan";
  document.getElementById("material-page-intro").textContent = "Periksa saldo, batch, dan pemakaian sebelum mencatat perubahan.";
  const back = mButton("Kembali ke daftar bahan", "list");
  back.className = "queue-text-button back-button";
  root.append(back);
  const heading = mNode("div", "product-detail-heading");
  const identity = mNode("div");
  identity.append(mNode("h2", "", material.name), mNode("p", "", `${material.code}, ${material.unit}`));
  const actions = mNode("div", "product-detail-actions");
  actions.append(mCondition(material), mButton("Edit bahan", "edit", false, { id: material.id }));
  const receipt = mButton("Catat barang masuk", "receipt", true, { id: material.id });
  receipt.disabled = !material.active;
  actions.append(receipt);
  heading.append(identity, actions);
  root.append(heading);
  const nav = mNode("nav", "product-detail-tabs");
  nav.setAttribute("aria-label", "Bagian detail bahan");

  for (const [key, label] of [["info", "Ringkasan"], ["batches", "Stok & batch"], ["usage", "Pemakaian"], ["activity", "Aktivitas"]])
  {
    const button = mButton(label, "tab", false, { tab: key });

    if (materialState.tab === key)
    {
      button.setAttribute("aria-current", "page");
    }
    nav.append(button);
  }
  root.append(nav);
  const panel = mNode("section", "product-panel");
  const stock = mStock(material);

  if (materialState.tab === "info")
  {
    panel.append(mNode("h2", "", "Informasi dan kesiapan bahan"));
    panel.append(mFacts(
    [
      ["Kategori", materialCategories.find((entry) => entry.id === material.category)?.name],
      ["Status bahan", material.active ? "Aktif" : "Nonaktif"],
      ["Satuan dasar", material.unit],
      ["Ambang minimum", `${material.minimum} ${material.unit}`],
      ["Pelacakan batch", material.batchTracked ? "Batch dan batas pakai" : "Tidak dilacak"],
      ["Kemasan penerimaan", material.packaging.length
        ? material.packaging.map((pack) => `1 ${pack.name} = ${pack.factor} ${material.unit}`).join("; ") : "Satuan dasar"]
    ]));
    panel.append(mNode("h3", "", "Penyimpanan"), mNode("p", "", material.storage));

    if (material.notes)
    {
      panel.append(mNode("h3", "", "Catatan bahan"), mNode("p", "", material.notes));
    }
    const footer = mNode("div", "work-form-footer");
    footer.append(mButton(material.active ? "Nonaktifkan bahan" : "Aktifkan bahan", "toggle", false, { id: material.id }));

    if (materialState.role === "superadmin")
    {
      const remove = mButton("Hapus permanen", "delete", false, { id: material.id });
      remove.disabled = mReferenced(material.id);
      footer.append(remove);
      panel.append(mNote(remove.disabled ? "Bahan memiliki riwayat atau referensi. Gunakan Nonaktifkan untuk mempertahankan catatan." : "Bahan tanpa riwayat dapat dihapus permanen oleh SuperAdmin."));
    }
    panel.append(footer);
  }
  else if (materialState.tab === "batches")
  {
    panel.append(mNode("h2", "", `Stok di ${materialLocations[materialState.location]}`));
    const location = mField("detail-location", "Lokasi stok", "select", materialState.location,
    {
      choices: Object.entries(materialLocations), dirty: false,
      bind: (value) => materialState.location = value,
      change: () =>
      {
        writeMaterialUrl();
        renderMaterials();
      }
    });
    panel.append(location, mFacts(
    [
      ["Saldo fisik", mQuantity(stock.balance, material)],
      ["Alokasi aktif", mQuantity(stock.allocated, material)],
      ["Lewat batas pakai", mQuantity(stock.expired, material)],
      ["Tersedia untuk produksi", mQuantity(stock.available, material)]
    ]));

    if (material.batchTracked)
    {
      const batches = material.batches.filter((batch) => mStock(material, materialState.location, batch.id).balance > 0);
      const rows = batches.sort((first, second) => first.expires.localeCompare(second.expires)).map((batch) =>
      {
        const balance = mStock(material, materialState.location, batch.id);
        const identity = mNode("div");
        identity.append(mNode("strong", "", batch.id), mNode("small", "", `Diterima ${mDate(batch.received)}`));
        return [identity, mQuantity(balance.balance, material), mQuantity(balance.allocated, material),
          mQuantity(balance.available, material), mBatchCondition(material, batch), mDate(batch.expires)];
      });
      panel.append(rows.length ? mTable(["Batch", "Saldo", "Alokasi", "Tersedia", "Kondisi", "Batas pakai"], rows, "Batch bahan di lokasi terpilih")
        : mNote("Belum ada saldo batch di lokasi ini. Catat penerimaan untuk mengisi bahan."));
    }
    else
    {
      panel.append(mNote("Bahan ini dicatat tanpa batch. Setiap perubahan tetap memiliki referensi dan alasan."));
    }
    const controls = mNode("div", "work-form-footer");

    for (const [key, label] of [["allocate", "Alokasikan bahan"], ["damage", "Catat rusak / buang"], ["transfer", "Transfer lokasi"], ["adjustment", "Penyesuaian stok"]])
    {
      const button = mButton(label, key, false, { id: material.id });
      button.disabled = ["allocate", "transfer"].includes(key) ? !material.active || !stock.available
        : key === "damage" ? !stock.removable : false;
      controls.append(button);
    }
    panel.append(controls);
  }
  else if (materialState.tab === "usage")
  {
    renderMaterialUsage(panel, material.id);
  }
  else
  {
    renderMaterialMovements(panel, material.id);
    const history = materialHistory.filter((entry) => entry.materialId === material.id);

    if (history.length)
    {
      panel.append(mNode("h3", "", "Perubahan katalog dan alokasi"));
      const list = mNode("ul", "material-history");

      for (const entry of [...history].reverse())
      {
        const item = mNode("li");
        item.append(mNode("strong", "", entry.action), mNode("p", "", entry.reason),
          mNode("p", "product-help", `${mDate(entry.at)}, ${entry.actor}`));
        list.append(item);
      }
      panel.append(list);
    }
  }
  root.append(panel);
}

function renderMaterialMovements(root, materialId = "")
{
  const entries = materialLedger.filter((entry) => entry.locationId === materialState.location
    && (!materialId || entry.materialId === materialId));
  root.append(mNode("h2", "", "Riwayat mutasi"));
  root.append(mNode("p", "product-help", "Perubahan dicatat sebagai entri baru; riwayat tidak dapat diubah atau dihapus."));
  const filters = mNode("div", "material-toolbar");
  const search = mField("ledger-search", "Cari kode, referensi, atau pelaku", "search", "", { dirty: false });
  const type = mField("ledger-type", "Jenis mutasi", "select", "all",
  {
    choices: [["all", "Semua mutasi"], ...Object.entries(materialTypeLabels)], dirty: false
  });
  filters.append(search, type);
  const result = mNode("div");
  const paint = () =>
  {
    const query = search.querySelector("input").value.trim().toLocaleLowerCase("id");
    const kind = type.querySelector("select").value;
    const filtered = entries.filter((entry) =>
    {
      const material = mFind(entry.materialId);
      return (kind === "all" || entry.type === kind)
        && `${material?.name} ${material?.code} ${entry.reference} ${entry.actor}`.toLocaleLowerCase("id").includes(query);
    });
    const list = mNode("ul", "material-history");

    for (const entry of [...filtered].reverse())
    {
      const material = mFind(entry.materialId);
      const item = mNode("li");
      item.append(mNode("strong", "", `${entry.units > 0 ? "+" : ""}${mQuantity(entry.units, material)}, ${material.name}`));
      item.append(mNode("p", "", `${materialTypeLabels[entry.type]}, ${entry.reference}${entry.batchId ? `, batch ${entry.batchId}` : ""}`));
      item.append(mNode("p", "", entry.reason), mNode("p", "product-help", `${mDate(entry.at)}, ${entry.actor}`));
      list.append(item);
    }
    result.replaceChildren(filtered.length ? list : mNote("Tidak ada mutasi yang cocok. Ubah pencarian atau jenis mutasi."));
  };
  filters.addEventListener("input", paint);
  filters.addEventListener("change", paint);
  root.append(filters, result);
  paint();
}

function renderMaterialUsage(root, materialId = "")
{
  root.append(mNode("h2", "", "Alokasi untuk produksi"));
  root.append(mNode("p", "product-help", "Alokasi menyisihkan bahan. Saldo fisik berkurang setelah pemakaian dikonfirmasi."));
  const allocations = materialAllocations.filter((allocation) => allocation.locationId === materialState.location
    && (!materialId || allocation.materialId === materialId) && mAllocationRemaining(allocation) > 0);

  if (!allocations.length)
  {
    root.append(mNote("Belum ada alokasi aktif di lokasi ini. Pilih bahan yang tersedia untuk mengalokasikannya."));
  }
  else
  {
    const list = mNode("ul", "material-history");

    for (const allocation of allocations)
    {
      const material = mFind(allocation.materialId);
      const job = materialJobs.find((entry) => entry.id === allocation.jobId);
      const item = mNode("li", "material-allocation");
      const information = mNode("div");
      information.append(mNode("strong", "", `${material.name}, ${mQuantity(mAllocationRemaining(allocation), material)}`));
      information.append(mNode("p", "", `${job.id}, ${job.name}`));
      information.append(mNode("p", "product-help", `${job.order}${allocation.batchId ? `, batch ${allocation.batchId}` : ""}`));
      const actions = mNode("div", "work-form-footer");
      const use = mButton("Catat pemakaian", "consume", false,
      {
        id: material.id, allocation: allocation.id
      });
      use.disabled = mExpired(material, allocation.batchId) || !material.active;
      actions.append(use, mButton("Lepaskan alokasi", "release", false, { allocation: allocation.id }));
      information.append(mExpired(material, allocation.batchId)
        ? mNote("Batch alokasi telah melewati batas pakai. Lepaskan alokasi dan periksa bahan pengganti.", true)
        : mBadge("Dialokasikan", "info", "clock"));
      item.append(information, actions);
      list.append(item);
    }
    root.append(list);
  }
  const controls = mNode("div", "work-form-footer");
  controls.append(mButton("Alokasikan bahan", "allocate", false, { id: materialId }));
  root.append(controls);
  const used = materialLedger.filter((entry) => entry.type === "consume"
    && entry.locationId === materialState.location && (!materialId || entry.materialId === materialId));
  root.append(mNode("h2", "material-usage-history-title", "Pemakaian tercatat"));

  if (!used.length)
  {
    root.append(mNote("Belum ada pemakaian yang dikonfirmasi. Alokasi aktif belum mengurangi saldo fisik."));
  }
  else
  {
    const list = mNode("ul", "material-history");

    for (const entry of [...used].reverse())
    {
      const item = mNode("li");
      item.append(mBadge("Terpakai", "success", "check"),
        mNode("p", "", `${mQuantity(-entry.units, mFind(entry.materialId))}, ${mFind(entry.materialId).name}`),
        mNode("p", "", `${entry.reference}, ${entry.reason}`), mNode("p", "product-help", `${mDate(entry.at)}, ${entry.actor}`));
      list.append(item);
    }
    root.append(list);
  }
}

function renderMaterialApprovals(root)
{
  root.append(mNode("h2", "", "Persetujuan penyesuaian"));
  root.append(mNode("p", "product-help", "Pengajuan belum mengubah stok. SuperAdmin meninjau alasan, referensi, dan saldo terbaru sebelum mengambil keputusan."));
  const requests = materialApprovals.filter((request) => request.locationId === materialState.location);

  if (!requests.length)
  {
    root.append(mNote("Belum ada pengajuan penyesuaian di lokasi ini."));
  }
  const list = mNode("ul", "material-history");

  for (const request of [...requests].reverse())
  {
    const material = mFind(request.materialId);
    const item = mNode("li");
    item.append(mBadge(request.status === "pending" ? "Menunggu SuperAdmin" : request.status === "approved" ? "Disetujui" : "Ditolak",
      request.status === "pending" ? "warning" : request.status === "approved" ? "success" : "neutral", request.status === "pending" ? "clock" : "check"));
    item.append(mNode("p", "", `${material.name}, ${request.units > 0 ? "+" : ""}${mQuantity(request.units, material)}`),
      mNode("p", "", request.reason), mNode("p", "product-help", `${request.reference}, ${request.actor}, ${mDate(request.at)}`));

    if (request.status === "pending" && materialState.role === "superadmin")
    {
      item.append(mButton("Tinjau penyesuaian", "review", false, { request: request.id, id: material.id }));
    }
    else if (request.status === "pending")
    {
      item.append(mNode("p", "product-help", "Keputusan tersedia untuk SuperAdmin. Saldo tetap sebelum disetujui."));
    }
    else
    {
      item.append(mNode("p", "", `${request.checker}: ${request.decisionReason}`));
    }
    list.append(item);
  }
  root.append(list);
}

async function mAskReason(title, paragraphs, label)
{
  const pending = mConfirm(title, paragraphs, label);
  const body = document.getElementById("material-confirm-copy");
  const field = mField("action-reason", "Alasan tindakan", "textarea", "", { required: true, dirty: false });
  body.append(field);
  const input = field.querySelector("textarea");
  const form = document.querySelector("#material-confirm form");
  form.noValidate = true;
  const validate = (event) =>
  {
    if (event.submitter?.value === "confirm" && input.value.trim().length < 5)
    {
      event.preventDefault();
      const error = field.querySelector(".product-field-error");
      error.hidden = false;
      error.textContent = "Tuliskan alasan minimal 5 karakter.";
      input.setAttribute("aria-invalid", "true");
      input.focus();
    }
  };
  form.addEventListener("submit", validate);
  const accepted = await pending;
  form.removeEventListener("submit", validate);
  return accepted ? input.value.trim() : null;
}

async function mAction(button)
{
  if (materialSaving || button.disabled)
  {
    return;
  }
  const action = button.dataset.materialAction;
  const material = mFind(button.dataset.id || materialState.material);

  if (action === "list")
  {
    await mNavigate({ material: "", mode: "view", workspace: "materials", allocation: "", request: "" });
  }
  else if (action === "workspace")
  {
    await mNavigate({ workspace: button.dataset.workspace, material: "", mode: "view", page: 1 });
  }
  else if (action === "open")
  {
    await mNavigate({ material: material.id, mode: "view", tab: "info" });
  }
  else if (action === "tab")
  {
    await mNavigate({ tab: button.dataset.tab }, false);
  }
  else if (["new", "edit", "receipt", "adjustment", "damage", "transfer", "allocate", "consume", "review"].includes(action))
  {
    await mNavigate(
    {
      mode: action,
      material: action === "new" ? "" : button.dataset.id || "",
      allocation: button.dataset.allocation || "",
      request: button.dataset.request || ""
    });
  }
  else if (action === "back")
  {
    await mNavigate({ mode: "view", allocation: "", request: "" });
  }
  else if (action === "filters")
  {
    const filters = document.getElementById("material-filters");
    filters.hidden = !filters.hidden;
    button.setAttribute("aria-expanded", String(!filters.hidden));
  }
  else if (action === "reset" || action === "condition")
  {
    Object.assign(materialState,
    {
      search: "", category: "all", condition: action === "condition" ? button.dataset.condition : "all",
      status: "active", page: 1
    });
    writeMaterialUrl();
    renderMaterials();
  }
  else if (action === "page")
  {
    materialState.page += Number(button.dataset.direction);
    writeMaterialUrl();
    renderMaterialRows();
    document.getElementById("material-result").scrollIntoView({ block: "center" });
  }
  else if (action === "retry")
  {
    materialLoadState = "full";
    mWriteLoadState();
    renderMaterials();
  }
  else if (action === "add-pack" || action === "remove-pack")
  {
    if (action === "add-pack")
    {
      const name = materialPackagingTypes[materialDraft.category].find((entry) => entry !== materialDraft.unit
        && !materialDraft.packaging.some((pack) => pack.name === entry));

      if (name)
      {
        materialDraft.packaging.push({ name, factor: 1 });
      }
    }
    else
    {
      materialDraft.packaging.splice(Number(button.dataset.index), 1);
    }
    mMarkDirty();
    refreshMaterialForm();
  }
  else if (action === "release")
  {
    const allocation = materialAllocations.find((entry) => entry.id === button.dataset.allocation);

    if (!allocation || !mAllocationRemaining(allocation))
    {
      mFeedback("Alokasi sudah terpakai atau dilepaskan.", true);
      return;
    }
    const ingredient = mFind(allocation.materialId);
    const reason = await mAskReason("Lepaskan sisa alokasi?",
    [`${ingredient.name}, ${mQuantity(mAllocationRemaining(allocation), ingredient)}, ${allocation.jobId}. Saldo fisik tidak berubah; bahan kembali bebas bila masih layak pakai.`], "Lepaskan alokasi");

    if (reason)
    {
      await mSave(document.getElementById("material-view"), () =>
      {
        const remaining = mAllocationRemaining(allocation);

        if (!remaining)
        {
          throw new Error("Alokasi sudah selesai; tidak ada sisa yang dapat dilepaskan.");
        }
        allocation.released += remaining;
        mHistory(ingredient.id, "Alokasi dilepaskan", `${allocation.jobId}, ${mQuantity(remaining, ingredient)}. ${reason}`);
      }, "Sisa alokasi dilepaskan. Saldo fisik tetap.");
    }
  }
  else if (action === "toggle" || action === "delete")
  {
    const hasAllocations = materialAllocations.some((entry) => entry.materialId === material.id && mAllocationRemaining(entry) > 0);

    if (action === "delete" && (materialState.role !== "superadmin" || mReferenced(material.id)))
    {
      mFeedback("Hapus permanen hanya tersedia untuk SuperAdmin dan bahan tanpa riwayat.", true);
      return;
    }

    if (action === "toggle" && material.active && hasAllocations)
    {
      mFeedback("Bahan masih dialokasikan. Selesaikan pemakaian atau lepaskan alokasi sebelum menonaktifkan.", true);
      return;
    }
    const label = action === "delete" ? "Hapus permanen" : material.active ? "Nonaktifkan bahan" : "Aktifkan bahan";
    const reason = await mAskReason(`${label}?`,
    [action === "delete" ? `${material.name} tidak memiliki riwayat. Penghapusan ini tidak dapat dibatalkan.`
      : `${material.name}. Penonaktifan menghentikan penerimaan, alokasi, dan pemakaian baru; riwayat tetap tersimpan.`], label);

    if (reason)
    {
      await mSave(document.getElementById("material-view"), () =>
      {
        if (action === "delete")
        {
          if (mReferenced(material.id) || materialState.role !== "superadmin")
          {
            throw new Error("Bahan kini memiliki referensi atau akses tidak sesuai. Penghapusan dibatalkan.");
          }
          productionMaterials.splice(productionMaterials.indexOf(material), 1);
        }
        else
        {
          material.active = !material.active;
          mHistory(material.id, label, reason);
        }
      }, action === "delete" ? "Bahan tanpa riwayat dihapus." : `${label} berhasil dicatat.`,
      action === "delete" ? { material: "" } : {});
    }
  }
}

function mWriteLoadState()
{
  const url = new URL(location.href);

  if (materialLoadState === "full")
  {
    url.searchParams.delete("state");
  }
  else
  {
    url.searchParams.set("state", materialLoadState);
  }
  history.replaceState(null, "", url);
}

function mEmptyData()
{
  productionMaterials.length = 0;
  materialLedger.length = 0;
  materialAllocations.length = 0;
  materialApprovals.length = 0;
  materialHistory.length = 0;
}

document.addEventListener("click", (event) =>
{
  const button = event.target.closest("[data-material-action]");

  if (button)
  {
    mAction(button);
  }
});

document.getElementById("material-location").addEventListener("change", (event) =>
{
  mNavigate({ location: event.target.value, page: 1 });
});

document.getElementById("material-profile").addEventListener("change", async (event) =>
{
  const accepted = await mNavigate({ role: event.target.value, mode: "view", request: "" });

  if (!accepted)
  {
    event.target.value = materialState.role;
  }
});

document.getElementById("material-load-state").addEventListener("change", async (event) =>
{
  const value = event.target.value;

  if (!await mNavigate({ mode: "view", material: "" }))
  {
    event.target.value = materialLoadState;
    return;
  }

  if (value === "empty")
  {
    mEmptyData();
  }
  else if (materialLoadState === "empty")
  {
    productionMaterials.push(...structuredClone(materialInitialData.materials));
    materialLedger.push(...structuredClone(materialInitialData.ledger));
    materialAllocations.push(...structuredClone(materialInitialData.allocations));
    materialApprovals.push(...structuredClone(materialInitialData.approvals));
  }
  materialLoadState = value;
  mWriteLoadState();
  renderMaterials();
});

window.addEventListener("beforeunload", (event) =>
{
  if (materialDirty || materialSaving)
  {
    event.preventDefault();
    event.returnValue = "";
  }
});

window.addEventListener("popstate", async () =>
{
  const next = readMaterialState();

  if (materialDirty && !await mConfirm("Tinggalkan perubahan?", ["Isian yang belum disimpan akan hilang."], "Tinggalkan"))
  {
    writeMaterialUrl(true);
    return;
  }
  materialState = next;
  materialDraft = null;
  materialDirty = false;
  renderMaterials();
});

document.addEventListener("DOMContentLoaded", () =>
{
  if (materialLoadState === "empty")
  {
    mEmptyData();
  }
  renderMaterials();
}, { once: true });
