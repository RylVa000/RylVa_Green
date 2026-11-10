"use strict";

document.documentElement.classList.add("js");

const bouquetRoot = document.getElementById("bouquet-view");
const bouquetDialog = document.getElementById("bouquet-dialog");
let bouquetState = readBouquetState();
let bouquetSaving = false;
let bouquetDirty = false;
let bouquetDraft = null;
let bouquetLoadState = "full";
let bouquetSequence = 100;
let bouquetConfirmAction = null;
let bouquetLastTrigger = null;

function bNode(tag, className = "", text = "")
{
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = String(text);
  return node;
}

function bIcon(name)
{
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "icon icon--small");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(svg.namespaceURI, "use");
  use.setAttribute("href", `#i-${name}`);
  svg.append(use);
  return svg;
}

function bButton(label, action, primary = false, data = {})
{
  const button = bNode("button", primary ? "queue-button queue-button--primary" : "queue-button", label);
  button.type = "button";
  button.dataset.bouquetAction = action;
  Object.assign(button.dataset, data);
  return button;
}

function bBadge(label, tone = "neutral", icon = "info")
{
  const badge = bNode("span", `queue-badge queue-badge--${tone} bouquet-badge`);
  badge.append(bIcon(icon), bNode("span", "", label));
  return badge;
}

function bNotice(text, warning = false)
{
  const note = bNode("div", warning ? "product-note product-note--warning" : "product-note");
  note.append(bIcon(warning ? "alert" : "info"), bNode("p", "", text));
  return note;
}

function bMoney(value)
{
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function bMaterial(id)
{
  return productionMaterials.find((entry) => entry.id === id);
}

function bFactor(material)
{
  return material.unit === "meter" ? 100 : 1;
}

function bReadUnits(value, material)
{
  const scaled = Number(value) * bFactor(material);
  const rounded = Math.round(scaled);
  return value !== "" && Math.abs(scaled - rounded) < 0.000001 ? rounded : NaN;
}

function bQuantity(units, material)
{
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(units / bFactor(material))} ${material.unit}`;
}

function bRemaining(allocation)
{
  return Math.max(0, allocation.units - allocation.consumed - allocation.released);
}

function bAvailable(material, batchId = null)
{
  const validBatch = (id) => !material.batches.find((batch) => batch.id === id && batch.expires < materialSnapshot);
  const balance = materialLedger
    .filter((entry) => entry.materialId === material.id && entry.locationId === "pusat"
      && (batchId === null || entry.batchId === batchId) && validBatch(entry.batchId))
    .reduce((sum, entry) => sum + entry.units, 0);
  const reserved = materialAllocations
    .filter((entry) => entry.materialId === material.id && entry.locationId === "pusat"
      && (batchId === null || entry.batchId === batchId) && validBatch(entry.batchId))
    .reduce((sum, entry) => sum + bRemaining(entry), 0);
  return material.active ? Math.max(0, balance - reserved) : 0;
}

function bJobAllocations(job)
{
  return materialAllocations.filter((entry) => entry.jobId === job.id && entry.locationId === "pusat");
}

function bShortages(job)
{
  if (job.status === "complete")
  {
    return [];
  }
  return job.needs.map((need) =>
  {
    const material = bMaterial(need.materialId);
    const own = bJobAllocations(job).filter((entry) => entry.materialId === need.materialId);
    const covered = own.reduce((sum, entry) => sum + bRemaining(entry) + entry.consumed, 0);
    return { ...need, material, missing: Math.max(0, need.units - covered - bAvailable(material)) };
  }).filter((need) => need.missing > 0);
}

function bStage(job)
{
  return job.issue || bShortages(job).length ? "attention" : job.status;
}

function bJobBadge(job)
{
  const stage = bStage(job);
  return bBadge(bouquetStageLabels[stage], stage === "attention" ? "warning" : stage === "complete" ? "success" : "info",
    stage === "attention" ? "alert" : stage === "complete" ? "check" : "orders");
}

function bConsumed(job, materialId)
{
  return bJobAllocations(job).filter((entry) => entry.materialId === materialId)
    .reduce((sum, entry) => sum + entry.consumed, 0);
}

function bCanFinish(job)
{
  return job.status === "preparing" && !job.issue
    && job.needs.every((need) => bConsumed(job, need.materialId) === need.units);
}

function bAllocationPlan(job)
{
  const plan = [];
  for (const need of job.needs)
  {
    const material = bMaterial(need.materialId);
    let remaining = need.units;
    const batches = material.batchTracked
      ? material.batches.filter((batch) => batch.expires >= materialSnapshot)
        .slice().sort((left, right) => left.expires.localeCompare(right.expires))
      : [{ id: "" }];
    for (const batch of batches)
    {
      const units = Math.min(remaining, bAvailable(material, batch.id));
      if (units > 0)
      {
        plan.push({ materialId: material.id, batchId: batch.id, units });
        remaining -= units;
      }
    }
    if (remaining > 0)
    {
      throw new Error(`Bahan ${material.name} tidak cukup. Periksa saldo terbaru.`);
    }
  }
  return plan;
}

function bActor()
{
  return bouquetState.role === "superadmin" ? "SuperAdmin RylVa" : "Admin RylVa";
}

function bHistory(job, label, reason)
{
  job.history.push({ label, reason, actor: bActor(), at: new Date().toISOString() });
}

function readBouquetState()
{
  const params = new URLSearchParams(location.search);
  return {
    role: params.get("role") === "superadmin" ? "superadmin" : "admin",
    workspace: params.get("workspace") === "configuration" ? "configuration" : "production",
    job: params.get("job") || "",
    recipe: params.get("recipe") || "",
    mode: params.get("mode") === "edit" ? "edit" : "view",
    filter: ["ready", "preparing", "attention", "complete"].includes(params.get("filter")) ? params.get("filter") : "all",
    search: params.get("search") || "",
    page: Math.max(1, Number.parseInt(params.get("page"), 10) || 1)
  };
}

function bUrl()
{
  const params = new URLSearchParams();
  Object.entries(bouquetState).forEach(([key, value]) =>
  {
    if (value !== "")
    {
      params.set(key, value);
    }
  });
  return `${location.pathname}?${params}`;
}

function bNavigate(changes)
{
  if (bouquetDirty && !window.confirm("Perubahan konfigurasi belum disimpan. Tinggalkan formulir?"))
  {
    return;
  }
  bouquetDirty = false;
  bouquetDraft = null;
  Object.assign(bouquetState, changes);
  history.pushState({}, "", bUrl());
  document.getElementById("bouquet-feedback").hidden = true;
  renderBouquetPage();
  document.getElementById("main-content").focus({ preventScroll: true });
}

function bFeedback(message)
{
  const node = document.getElementById("bouquet-feedback");
  node.replaceChildren(bIcon("check"), bNode("span", "", message));
  node.hidden = false;
  node.focus();
}

function bField(label, control, help = "")
{
  const field = bNode("div", "product-field");
  const caption = bNode("label", "", label);
  caption.htmlFor = control.id;
  field.append(caption, control);
  if (help)
  {
    const hint = bNode("p", "bouquet-help", help);
    hint.id = `${control.id}-help`;
    control.setAttribute("aria-describedby", hint.id);
    field.append(hint);
  }
  return field;
}

function bSelect(id, options, value, searchable = false)
{
  const select = bNode("select");
  select.id = id;
  if (searchable)
  {
    select.dataset.searchable = "true";
  }
  options.forEach(([key, label]) =>
  {
    const option = bNode("option", "", label);
    option.value = key;
    select.append(option);
  });
  select.value = value;
  return select;
}

function bPanel(title, copy = "")
{
  const panel = bNode("section", "product-panel bouquet-panel");
  panel.append(bNode("h2", "", title));
  if (copy)
  {
    panel.append(bNode("p", "secondary-text", copy));
  }
  return panel;
}

function bEmpty(title, text)
{
  const panel = bPanel(title, text);
  panel.classList.add("bouquet-empty");
  return panel;
}

function bOrderLink(job)
{
  const link = bNode("a", "queue-button", "Buka pesanan");
  link.href = `../staff/orders-queue.html?role=${bouquetState.role}&tab=all&order=${job.orderId}`;
  return link;
}

function bMaterialLink(material, receipt = false)
{
  const link = bNode("a", "queue-text-button", receipt ? "Periksa stok bahan" : material.code);
  link.href = `../staff/production-materials.html?role=${bouquetState.role}&material=${material.id}${receipt ? "&mode=receipt" : ""}`;
  return link;
}

function bTable(headings, rows)
{
  const table = bNode("table", "bouquet-table");
  const caption = bNode("caption", "sr-only", headings.join(", "));
  const head = bNode("thead");
  const header = bNode("tr");
  headings.forEach((label) =>
  {
    const cell = bNode("th", "", label);
    cell.scope = "col";
    header.append(cell);
  });
  head.append(header);
  const body = bNode("tbody");
  rows.forEach((contents) =>
  {
    const row = bNode("tr");
    contents.forEach((content, index) =>
    {
      const cell = bNode("td");
      cell.dataset.label = headings[index];
      if (typeof content === "string")
      {
        cell.textContent = content;
      }
      else
      {
        cell.append(content);
      }
      row.append(cell);
    });
    body.append(row);
  });
  table.append(caption, head, body);
  return table;
}

function bSummary()
{
  const section = bNode("section", "catalog-summary bouquet-summary");
  section.setAttribute("aria-label", "Ringkasan pekerjaan produksi");
  Object.entries(bouquetStageLabels).forEach(([filter, label]) =>
  {
    const count = bouquetLoadState === "empty" ? 0 : bouquetJobs.filter((job) => bStage(job) === filter).length;
    const button = bButton("", "filter", false, { filter });
    button.className = "queue-tab";
    button.setAttribute("aria-pressed", String(bouquetState.filter === filter));
    button.append(bNode("span", "", label), bNode("strong", "", count));
    if (filter === "attention" && count)
    {
      button.classList.add("bouquet-attention-count");
    }
    section.append(button);
  });
  bouquetRoot.append(section);
}

function bRenderQueue()
{
  bSummary();
  const shortageJobs = bouquetJobs.filter((job) => bShortages(job).length);
  if (shortageJobs.length && bouquetLoadState !== "empty")
  {
    const alert = bNode("section", "bouquet-alert");
    alert.append(
      bIcon("alert"),
      bNode("p", "", `${shortageJobs.length} pekerjaan kekurangan bahan. Periksa sebelum mulai merangkai.`)
    );
    const button = bButton("Periksa pekerjaan", "filter", false, { filter: "attention" });
    button.className = "queue-text-button";
    alert.append(button);
    bouquetRoot.append(alert);
  }
  const sheet = bNode("section", "catalog-sheet bouquet-sheet");
  const tools = bNode("div", "bouquet-toolbar");
  const search = bNode("input");
  search.id = "bouquet-search";
  search.type = "search";
  search.placeholder = "Nomor pesanan, pekerjaan, atau nama buket";
  search.value = bouquetState.search;
  const filter = bSelect(
    "bouquet-filter",
    [["all", "Semua pekerjaan"], ...Object.entries(bouquetStageLabels)],
    bouquetState.filter
  );
  tools.append(bField("Cari pekerjaan", search), bField("Tahap produksi", filter));
  sheet.append(tools);
  const query = bouquetState.search.trim().toLocaleLowerCase("id");
  const jobs = (bouquetLoadState === "empty" ? [] : bouquetJobs).filter((job) =>
  {
    return (bouquetState.filter === "all" || bStage(job) === bouquetState.filter)
      && [job.id, job.orderId, job.name, job.customer].join(" ").toLocaleLowerCase("id").includes(query);
  }).sort((left, right) => left.deadline.localeCompare(right.deadline));
  const meta = bNode("div", "bouquet-list-meta");
  meta.append(bNode("p", "", `${jobs.length} pekerjaan ditemukan`));
  const clear = bButton("Hapus filter", "clear");
  clear.className = "queue-text-button";
  clear.hidden = !query && bouquetState.filter === "all";
  meta.append(clear);
  sheet.append(meta);
  if (!jobs.length)
  {
    sheet.append(bEmpty(
      "Tidak ada pekerjaan",
      "Coba pencarian lain atau hapus filter. Pekerjaan berasal dari pesanan buket yang tervalidasi."
    ));
  }
  else
  {
    const rows = jobs.map((job) =>
    {
      const identity = bNode("div", "bouquet-stack");
      identity.append(
        bNode("strong", "", job.name),
        bNode("span", "secondary-text", job.id),
        bNode("span", "", job.orderId)
      );
      const schedule = bNode("div", "bouquet-stack");
      schedule.append(bNode("strong", "", "4 Nov 2026"), bNode("span", "", job.slot));
      const minutes = Math.round((Date.parse(job.deadline) - Date.parse(bouquetSnapshot)) / 60000);
      if (minutes < 120 && job.status !== "complete")
      {
        schedule.append(bBadge(`${minutes} menit ke awal slot`, "warning", "clock"));
      }
      const shortage = bShortages(job);
      const stock = bNode("div", "bouquet-stack");
      stock.append(bBadge(shortage.length ? "Bahan tidak cukup" : job.status === "complete" ? "Pemakaian tercatat" : "Bahan cukup",
        shortage.length ? "warning" : "success", shortage.length ? "alert" : "check"));
      const action = bButton("Buka", "job", false, { id: job.id });
      action.setAttribute("aria-label", `Buka pekerjaan ${job.id}`);
      return [identity, `${job.quantity} buket`, schedule, stock, bJobBadge(job), action];
    });
    sheet.append(bTable(["Pekerjaan", "Jumlah", "Jadwal kirim", "Kesiapan bahan", "Produksi", "Tindakan"], rows));
  }
  bouquetRoot.append(sheet);
  search.addEventListener("input", () =>
  {
    const caret = search.selectionStart;
    bouquetState.search = search.value;
    history.replaceState({}, "", bUrl());
    renderBouquetPage();
    const replacement = document.getElementById("bouquet-search");
    replacement.focus();
    replacement.setSelectionRange(caret, caret);
  });
  filter.addEventListener("change", () => bNavigate({ filter: filter.value }));
}

function bRenderJob(job)
{
  const layout = bNode("div", "bouquet-detail-layout");
  const main = bPanel(
    "Kebutuhan bahan",
    "Kebutuhan ini adalah snapshot pekerjaan; perubahan konfigurasi tidak mengubahnya."
  );
  const rows = job.needs.map((need) =>
  {
    const material = bMaterial(need.materialId);
    const own = bJobAllocations(job).filter((entry) => entry.materialId === material.id);
    const reserved = own.reduce((sum, entry) => sum + bRemaining(entry), 0);
    const used = bConsumed(job, material.id);
    const identity = bNode("div", "bouquet-stack");
    identity.append(bNode("strong", "", material.name), bMaterialLink(material));
    return [identity, bQuantity(need.units, material), bQuantity(bAvailable(material), material),
      bQuantity(reserved, material), bQuantity(used, material)];
  });
  main.append(bTable(["Bahan", "Kebutuhan", "Stok bebas", "Alokasi", "Dipakai"], rows));
  main.append(bNotice("Alokasi dan pemakaian pada halaman ini hanya simulasi di tab ini. Modul Bahan Produksi dan pesanan belum tersinkronisasi."));
  const history = bNode("section", "bouquet-job-history");
  history.append(bNode("h3", "", "Aktivitas produksi"));
  if (!job.history.length)
  {
    history.append(bNode("p", "secondary-text", "Belum ada perubahan tahap produksi."));
  }
  job.history.slice().reverse().forEach((entry) =>
  {
    const row = bNode("article", "bouquet-history-row");
    const time = new Intl.DateTimeFormat("id-ID",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Jakarta"
    }).format(new Date(entry.at));
    row.append(
      bNode("strong", "", entry.label),
      bNode("p", "", entry.reason),
      bNode("span", "secondary-text", `${entry.actor}, ${time} WIB`)
    );
    history.append(row);
  });
  main.append(history);
  const side = bPanel("Pekerjaan yang dipilih");
  side.append(bJobBadge(job), bNode("h3", "", job.name), bNode("p", "", `${job.quantity} buket — ${job.customer}`));
  const list = bNode("ul", "bouquet-choices");
  job.choices.forEach((choice) => list.append(bNode("li", "", choice)));
  side.append(
    list,
    bNode("p", "", job.note),
    bNode("p", "secondary-text", `Konfigurasi versi ${job.recipeVersion}; harga snapshot ${bMoney(job.price)}.`)
  );
  const shortage = bShortages(job);
  shortage.forEach((entry) =>
  {
    side.append(
      bNotice(`${entry.material.name} kurang ${bQuantity(entry.missing, entry.material)}.`, true),
      bMaterialLink(entry.material, true)
    );
  });
  if (job.issue)
  {
    side.append(bNotice(job.issue, true));
  }
  const actions = bNode("div", "bouquet-action-list");
  if (job.status === "ready")
  {
    const start = bButton("Mulai merangkai", "start", true, { id: job.id });
    start.disabled = Boolean(shortage.length || job.issue);
    actions.append(start);
  }
  if (job.status === "preparing" && !job.issue)
  {
    const remaining = bJobAllocations(job).some((entry) => bRemaining(entry) > 0);
    const consume = bButton("Catat pemakaian bahan", "consume", true, { id: job.id });
    consume.disabled = !remaining;
    const finish = bButton("Selesaikan produksi", "finish", false, { id: job.id });
    finish.disabled = !bCanFinish(job);
    actions.append(consume, finish);
    if (!bCanFinish(job))
    {
      actions.append(bNode("p", "bouquet-help", "Catat pemakaian seluruh kebutuhan sebelum menyelesaikan produksi."));
    }
    if (bJobAllocations(job).every((entry) => entry.consumed === 0))
    {
      actions.append(bButton("Lepas alokasi & hentikan", "release", false, { id: job.id }));
    }
  }
  if (job.issue)
  {
    actions.append(bButton("Catat penyelesaian kendala", "resume", true, { id: job.id }));
  }
  else if (job.status !== "complete")
  {
    actions.append(bButton("Tandai kendala", "issue", false, { id: job.id }));
  }
  actions.append(bOrderLink(job));
  side.append(actions);
  layout.append(main, side);
  bouquetRoot.append(layout);
}

function renderBouquetPage()
{
  bouquetRoot.replaceChildren();
  const job = bouquetJobs.find((entry) => entry.id === bouquetState.job);
  const recipe = bouquetRecipes.find((entry) => entry.id === bouquetState.recipe);
  const editing = bouquetState.workspace === "configuration" && bouquetState.mode === "edit";
  const detail = Boolean(bouquetState.job || bouquetState.recipe);
  document.getElementById("bouquet-title").textContent = editing ? bouquetState.recipe === "new"
    ? "Tambah konfigurasi buket" : "Edit konfigurasi buket"
    : detail ? job?.name || recipe?.name || "Data tidak ditemukan" : "Buket & Produksi";
  const actions = document.getElementById("bouquet-heading-actions");
  actions.replaceChildren();
  if (!detail && bouquetState.workspace === "configuration")
  {
    actions.append(bButton("Tambah konfigurasi", "new-recipe", true));
  }
  const breadcrumb = document.getElementById("bouquet-breadcrumb");
  breadcrumb.replaceChildren();
  const home = bNode("a", "", "Ruang kerja");
  home.href = `../staff/admin-dashboard.html?role=${bouquetState.role}`;
  breadcrumb.append(home, bNode("span", "", "/"));
  if (detail)
  {
    const back = bNode("a", "", "Buket & Produksi");
    back.href = `../staff/bouquet-production.html?role=${bouquetState.role}&workspace=${bouquetState.workspace}`;
    back.dataset.bouquetAction = "back";
    breadcrumb.append(back, bNode("span", "", "/"));
  }
  const current = bNode("span", "", detail ? editing ? "Edit konfigurasi" : "Detail" : "Buket & Produksi");
  current.setAttribute("aria-current", "page");
  breadcrumb.append(current);
  document.getElementById("profile-name").textContent = bActor();
  document.getElementById("preview-role").textContent = `Pratinjau ${bouquetState.role === "superadmin" ? "SuperAdmin" : "Admin"}`;
  document.getElementById("bouquet-profile").value = bouquetState.role;
  document.querySelectorAll("[data-superadmin-only]").forEach((node) => node.hidden = bouquetState.role !== "superadmin");
  document.querySelectorAll("[data-role-link]").forEach((link) =>
  {
    const url = new URL(link.href, location.href);
    url.searchParams.set("role", bouquetState.role);
    link.href = url.href;
  });
  if (["loading", "error"].includes(bouquetLoadState))
  {
    const section = bEmpty(
      bouquetLoadState === "loading" ? "Memuat pekerjaan…" : "Data gagal dimuat",
      "Muat ulang untuk kembali ke data contoh."
    );
    section.append(bButton("Muat ulang", "retry"));
    section.setAttribute("role", bouquetLoadState === "loading" ? "status" : "alert");
    bouquetRoot.append(section);
    return;
  }
  if (detail)
  {
    const back = bButton("Kembali ke daftar", "back");
    back.className = "queue-text-button back-button";
    back.prepend(bIcon("chevron"));
    bouquetRoot.append(back);
    if ((bouquetState.job && !job) || (bouquetState.recipe && !recipe && bouquetState.recipe !== "new"))
    {
      bouquetRoot.append(bEmpty(
        "Data tidak ditemukan",
        "Kembali ke daftar dan pilih pekerjaan atau konfigurasi yang tersedia."
      ));
    }
    else if (bouquetState.workspace === "configuration")
    {
      renderBouquetEditor(recipe, editing);
    }
    else
    {
      bRenderJob(job);
    }
    return;
  }
  const tabs = bNode("nav", "product-detail-tabs bouquet-workspaces");
  tabs.setAttribute("aria-label", "Ruang kerja buket");
  [["production", "Antrean produksi"], ["configuration", "Konfigurasi buket"]].forEach(([workspace, label]) =>
  {
    const button = bButton(label, "workspace", false, { workspace });
    button.className = "";
    if (workspace === bouquetState.workspace)
    {
      button.setAttribute("aria-current", "page");
    }
    tabs.append(button);
  });
  bouquetRoot.append(tabs);
  if (bouquetState.workspace === "configuration")
  {
    renderBouquetConfigurations();
  }
  else
  {
    bRenderQueue();
  }
}

async function bCommit(container, mutation)
{
  if (bouquetSaving)
  {
    return false;
  }
  bouquetSaving = true;
  container.setAttribute("aria-busy", "true");
  const controls = [...container.querySelectorAll("button, input, select, textarea")];
  const disabled = controls.map((control) => control.disabled);
  controls.forEach((control) => control.disabled = true);
  try
  {
    await new Promise((resolve) => setTimeout(resolve, 220));
    const fail = document.getElementById("bouquet-fail-save");
    if (fail.checked)
    {
      fail.checked = false;
      throw new Error("Gagal menyimpan. Isian tetap tersedia; coba lagi.");
    }
    mutation();
    return true;
  }
  catch (error)
  {
    let message = container.querySelector(".bouquet-save-error");
    if (!message)
    {
      message = bNode("p", "bouquet-save-error");
      message.setAttribute("role", "alert");
      message.tabIndex = -1;
      container.append(message);
    }
    message.textContent = error.message;
    message.focus();
    return false;
  }
  finally
  {
    bouquetSaving = false;
    container.removeAttribute("aria-busy");
    controls.forEach((control, index) => control.disabled = disabled[index]);
  }
}

function bOpenJobAction(job, action)
{
  bouquetLastTrigger = document.activeElement;
  const body = document.getElementById("bouquet-dialog-body");
  body.replaceChildren();
  const titles =
  {
    start: "Mulai merangkai?",
    consume: "Catat pemakaian bahan",
    finish: "Selesaikan produksi?",
    issue: "Catat kendala produksi",
    resume: "Catat penyelesaian kendala",
    release: "Lepas alokasi pekerjaan?"
  };
  document.getElementById("bouquet-dialog-title").textContent = titles[action];
  body.append(bNode("p", "", `${job.id} — ${job.name}`));
  const reason = bNode("textarea");
  reason.id = "bouquet-action-reason";
  reason.rows = 2;
  reason.maxLength = 500;
  body.append(bField("Catatan tindakan (wajib)", reason, "Minimal 5 karakter, maksimal 500 karakter."));
  const quantities = [];
  if (action === "consume")
  {
    bJobAllocations(job).filter((entry) => bRemaining(entry) > 0).forEach((entry) =>
    {
      const material = bMaterial(entry.materialId);
      const input = bNode("input");
      input.id = `use-${entry.id}`;
      input.type = "number";
      input.min = "0";
      input.max = String(bRemaining(entry) / bFactor(material));
      input.step = String(1 / bFactor(material));
      input.value = input.max;
      input.addEventListener("input", () =>
      {
        if (Number(input.value) > Number(input.max))
        {
          input.value = input.max;
        }
      });
      input.addEventListener("change", () =>
      {
        if (input.value !== "" && Number(input.value) < 0)
        {
          input.value = "0";
        }
      });
      quantities.push({ entry, input, material });
      body.append(bField(
        `${material.name} (${material.unit})`,
        input,
        `Sisa ${bQuantity(bRemaining(entry), material)}; batch ${entry.batchId || "tanpa batch"}.`
      ));
    });
    body.append(bNotice("Konfirmasi ini mengurangi saldo fisik contoh dan sisa alokasi. Isi sebagian jika bahan belum seluruhnya dipakai."));
  }
  if (action === "start")
  {
    body.append(bNotice("Mulai merangkai mengalokasikan bahan contoh yang tersedia. Saldo fisik baru berkurang saat Catat pemakaian."));
  }
  if (action === "finish")
  {
    body.append(bNotice("Produksi selesai tidak mengubah status pesanan, pembayaran, atau pengiriman."));
  }
  bouquetConfirmAction = () =>
  {
    const text = reason.value.trim();
    if (text.length < 5)
    {
      throw new Error("Tulis catatan tindakan minimal 5 karakter.");
    }
    if (action === "start")
    {
      if (job.status !== "ready" || job.issue || bShortages(job).length)
      {
        throw new Error("Pekerjaan belum dapat dimulai. Periksa tahap dan bahan terbaru.");
      }
      const plan = bAllocationPlan(job);
      plan.forEach((entry) => materialAllocations.push(
      {
        ...entry,
        id: `bouquet-alloc-${++bouquetSequence}`,
        jobId: job.id,
        locationId: "pusat",
        consumed: 0,
        released: 0,
        actor: bActor(),
        at: new Date().toISOString()
      }));
      job.status = "preparing";
    }
    else if (action === "consume")
    {
      if (job.status !== "preparing" || job.issue)
      {
        throw new Error("Pemakaian hanya dapat dicatat saat pekerjaan sedang dirangkai.");
      }
      const changes = quantities.map(({ entry, input, material }) =>
      {
        return { entry, units: bReadUnits(input.value, material) };
      });
      if (!changes.some((change) => change.units > 0)
        || changes.some((change) => !Number.isSafeInteger(change.units) || change.units < 0 || change.units > bRemaining(change.entry)))
      {
        throw new Error("Isi pemakaian positif tanpa melebihi sisa alokasi.");
      }
      changes.filter((change) => change.units > 0).forEach(({ entry, units }) =>
      {
        materialLedger.push(
        {
          id: `bouquet-use-${++bouquetSequence}`,
          materialId: entry.materialId,
          locationId: "pusat",
          batchId: entry.batchId,
          units: -units,
          type: "consume",
          reference: job.id,
          reason: text,
          actor: bActor(),
          at: new Date().toISOString()
        });
        entry.consumed += units;
      });
    }
    else if (action === "finish")
    {
      if (!bCanFinish(job))
      {
        throw new Error("Selesaikan pencatatan kebutuhan bahan terlebih dahulu.");
      }
      job.status = "complete";
    }
    else if (action === "issue")
    {
      if (job.status === "complete")
      {
        throw new Error("Pekerjaan selesai tidak dapat diubah melalui tindakan ini.");
      }
      job.issue = text;
    }
    else if (action === "resume")
    {
      if (!job.issue)
      {
        throw new Error("Kendala sudah diselesaikan.");
      }
      job.issue = "";
    }
    else if (action === "release")
    {
      if (job.status !== "preparing" || bJobAllocations(job).some((entry) => entry.consumed > 0))
      {
        throw new Error("Alokasi tidak dapat dilepas setelah ada pemakaian. Catat kendala untuk penanganan.");
      }
      bJobAllocations(job).forEach((entry) => entry.released += bRemaining(entry));
      job.status = "ready";
    }
    bHistory(job, titles[action].replace("?", ""), text);
  };
  bouquetDialog.showModal();
  reason.focus();
}

document.getElementById("bouquet-dialog-form").addEventListener("submit", async (event) =>
{
  event.preventDefault();
  if (!bouquetConfirmAction)
  {
    return;
  }
  const success = await bCommit(event.currentTarget, bouquetConfirmAction);
  if (success)
  {
    bouquetConfirmAction = null;
    bouquetDialog.close();
    renderBouquetPage();
    bFeedback("Tindakan produksi tercatat pada pratinjau ini.");
  }
});
document.getElementById("bouquet-dialog-cancel").addEventListener("click", () =>
{
  if (!bouquetSaving)
  {
    bouquetDialog.close();
  }
});
bouquetDialog.addEventListener("cancel", (event) =>
{
  if (bouquetSaving)
  {
    event.preventDefault();
  }
});
bouquetDialog.addEventListener("close", () =>
{
  if (bouquetLastTrigger?.isConnected)
  {
    bouquetLastTrigger.focus();
  }
});

document.addEventListener("click", (event) =>
{
  const button = event.target.closest("[data-bouquet-action]");
  if (!button || bouquetSaving)
  {
    return;
  }
  event.preventDefault();
  const { bouquetAction: action, id, workspace, filter } = button.dataset;
  if (action === "workspace")
  {
    bNavigate({ workspace, job: "", recipe: "", filter: "all", search: "" });
  }
  else if (action === "filter")
  {
    bNavigate({ filter, page: 1 });
  }
  else if (action === "clear")
  {
    bNavigate({ filter: "all", search: "" });
  }
  else if (action === "job")
  {
    bNavigate({ job: id, recipe: "", mode: "view" });
  }
  else if (action === "back")
  {
    bNavigate({ job: "", recipe: "", mode: "view" });
  }
  else if (action === "new-recipe" || action === "recipe")
  {
    bNavigate({ workspace: "configuration", recipe: action === "new-recipe" ? "new" : id, mode: "edit", job: "" });
  }
  else if (action === "retry")
  {
    bouquetLoadState = "full";
    document.getElementById("bouquet-load-state").value = "full";
    renderBouquetPage();
  }
  else if (["start", "consume", "finish", "issue", "resume", "release"].includes(action))
  {
    const job = bouquetJobs.find((entry) => entry.id === id);
    if (job)
    {
      bOpenJobAction(job, action);
    }
  }
  else
  {
    handleBouquetEditorAction(action, button.dataset);
  }
});
document.getElementById("bouquet-profile").addEventListener("change", (event) =>
{
  bNavigate({ role: event.target.value });
  event.target.value = bouquetState.role;
});
document.getElementById("bouquet-load-state").addEventListener("change", (event) =>
{
  if (bouquetDirty && !window.confirm("Tinggalkan konfigurasi yang belum disimpan?"))
  {
    event.target.value = bouquetLoadState;
    return;
  }
  bouquetDirty = false;
  bouquetDraft = null;
  bouquetLoadState = event.target.value;
  renderBouquetPage();
});
window.addEventListener("beforeunload", (event) =>
{
  if (bouquetDirty || bouquetSaving)
  {
    event.preventDefault();
    event.returnValue = "";
  }
});
window.addEventListener("popstate", () =>
{
  if (bouquetDirty && !window.confirm("Tinggalkan konfigurasi yang belum disimpan?"))
  {
    history.pushState({}, "", bUrl());
    return;
  }
  bouquetDirty = false;
  bouquetDraft = null;
  bouquetState = readBouquetState();
  renderBouquetPage();
});
