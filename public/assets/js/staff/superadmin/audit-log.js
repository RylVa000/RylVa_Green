"use strict";

document.documentElement.classList.add("js");

const auditRoot = document.getElementById("audit-view");
const auditPageSize = 5;
const auditAccessEntries = [];
const auditActionLabels =
{
  status: "Perubahan status",
  price: "Perubahan harga",
  mutation: "Mutasi stok",
  approval: "Keputusan persetujuan",
  access: "Akses data",
  production: "Pemakaian produksi",
  parameter: "Perubahan parameter",
  login: "Login staf",
  mfa: "Reset MFA",
  calendar: "Perubahan kalender",
  export: "Ekspor data"
};
let auditState = readAuditState();
let auditLoadState = "full";
let auditIntegrity = "unknown";
let auditBusy = false;

function auditNode(tag, className = "", text = "")
{
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = String(text);
  return node;
}

function auditIcon(name)
{
  const node = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  node.setAttribute("class", "icon icon--small");
  node.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(node.namespaceURI, "use");
  use.setAttribute("href", `#i-${name}`);
  node.append(use);
  return node;
}

function auditButton(label, action, data = {})
{
  const button = auditNode("button", "queue-button", label);
  button.type = "button";
  button.dataset.auditAction = action;
  Object.assign(button.dataset, data);
  return button;
}

function auditBadge(text, tone = "neutral", icon = "info")
{
  const badge = auditNode("span", `queue-badge queue-badge--${tone} audit-badge`);
  badge.append(auditIcon(icon), auditNode("span", "", text));
  return badge;
}

function auditNotice(text, warning = false)
{
  const notice = auditNode("div", warning ? "product-note product-note--warning" : "product-note");
  notice.append(auditIcon(warning ? "alert" : "info"), auditNode("p", "", text));
  return notice;
}

function auditPanel(title, copy = "")
{
  const panel = auditNode("section", "product-panel audit-panel");
  panel.append(auditNode("h2", "", title));
  if (copy)
  {
    panel.append(auditNode("p", "secondary-text", copy));
  }
  return panel;
}

function auditActor(id)
{
  return auditActors.find((actor) => actor.id === id);
}

function auditTime(value, dateOnly = false)
{
  return new Intl.DateTimeFormat("id-ID",
  {
    dateStyle: "medium",
    ...(dateOnly ? {} : { timeStyle: "short" }),
    timeZone: "Asia/Jakarta"
  }).format(new Date(value)) + (dateOnly ? "" : " WIB");
}

function readAuditState()
{
  const params = new URLSearchParams(location.search);
  const choose = (key, options, fallback) => options.includes(params.get(key)) ? params.get(key) : fallback;
  const role = choose("role", ["admin", "superadmin"], "admin");
  return {
    role,
    entry: params.get("entry") || "",
    search: params.get("search") || "",
    period: choose("period", ["today", "week", "all", "custom"], "today"),
    from: params.get("from") || "2026-11-04",
    to: params.get("to") || "2026-11-04",
    actor: role === "admin" ? "admin" : choose("actor", ["all", ...auditActors.map((actor) => actor.id)], "all"),
    module: choose("module", ["all", ...Object.keys(auditModules)], "all"),
    action: choose("action", ["all", ...Object.keys(auditActionLabels)], "all"),
    result: choose("result", ["all", "success", "failed"], "all"),
    segment: choose("segment", ["all", "failed", "sensitive", "account"], "all"),
    page: Math.max(1, Number.parseInt(params.get("page"), 10) || 1)
  };
}

function auditUrl()
{
  const params = new URLSearchParams();
  Object.entries(auditState).forEach(([key, value]) =>
  {
    if (value !== "")
    {
      params.set(key, value);
    }
  });
  return `${location.pathname}?${params}`;
}

function auditVisibleEntries()
{
  if (auditLoadState === "empty")
  {
    return [];
  }
  return [...auditSeedEntries, ...auditAccessEntries]
    .filter((entry) => auditState.role === "superadmin" || entry.actorId === "admin");
}

function auditRecordAccess(target)
{
  const actorId = auditState.role;
  const entry = auditFixture(`AKSES-${auditAccessEntries.length + 1}`, "10:20", actorId, "audit", "access",
    "Membuka riwayat aktivitas", { id: target || "DAFTAR-AUDIT", label: "Riwayat aktivitas", route: "" },
    {
      at: new Date(Date.parse(auditSnapshot) + (auditAccessEntries.length + 1) * 1000).toISOString(),
      reason: "Akses pratinjau dicatat di memori tab; bukan audit server.",
      applied: false
    });
  auditAccessEntries.push(freezeAuditValue(entry));
}

function auditNavigate(changes, replace = false)
{
  document.getElementById("audit-feedback").hidden = true;
  Object.assign(auditState, changes);
  if (auditState.role === "admin")
  {
    auditState.actor = "admin";
  }
  if (changes.entry && auditVisibleEntries().some((entry) => entry.id === changes.entry))
  {
    auditRecordAccess(changes.entry);
  }
  history[replace ? "replaceState" : "pushState"]({}, "", auditUrl());
  renderAudit();
  document.getElementById("main-content").focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function auditDateValid(value)
{
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

function auditBaseRows()
{
  const query = auditState.search.trim().toLocaleLowerCase("id");
  const customValid = auditDateValid(auditState.from) && auditDateValid(auditState.to) && auditState.from <= auditState.to;
  return auditVisibleEntries().filter((entry) =>
  {
    const day = new Date(Date.parse(entry.at) + 7 * 3600000).toISOString().slice(0, 10);
    const actor = auditActor(entry.actorId);
    const text = [entry.id, actor.name, actor.type, entry.title, entry.object.id, entry.object.label,
      auditModules[entry.module], entry.reason].join(" ").toLocaleLowerCase("id");
    const inPeriod = auditState.period === "all"
      || (auditState.period === "today" && day === "2026-11-04")
      || (auditState.period === "week" && day >= "2026-10-29" && day <= "2026-11-04")
      || (auditState.period === "custom" && customValid && day >= auditState.from && day <= auditState.to);
    return inPeriod && text.includes(query)
      && (auditState.actor === "all" || entry.actorId === auditState.actor)
      && (auditState.module === "all" || entry.module === auditState.module)
      && (auditState.action === "all" || entry.action === auditState.action)
      && (auditState.result === "all" || entry.result === auditState.result);
  }).sort((left, right) => Date.parse(right.at) - Date.parse(left.at));
}

function auditSegmentMatches(entry, segment = auditState.segment)
{
  return segment === "all" || (segment === "failed" && entry.result === "failed")
    || (segment === "sensitive" && entry.sensitive) || (segment === "account" && entry.account);
}

function auditField(label, control, help = "")
{
  const field = auditNode("div", "product-field");
  const caption = auditNode("label", "", label);
  caption.htmlFor = control.id;
  field.append(caption, control);
  if (help)
  {
    const hint = auditNode("p", "audit-help", help);
    hint.id = `${control.id}-help`;
    control.setAttribute("aria-describedby", hint.id);
    field.append(hint);
  }
  return field;
}

function auditSelect(id, choices, value, searchable = false)
{
  const select = auditNode("select");
  select.id = id;
  if (searchable)
  {
    select.dataset.searchable = "true";
  }
  choices.forEach(([value, label]) =>
  {
    const option = auditNode("option", "", label);
    option.value = value;
    select.append(option);
  });
  select.value = value;
  return select;
}

function auditFeedback(message)
{
  const feedback = document.getElementById("audit-feedback");
  feedback.replaceChildren(auditIcon("info"), auditNode("span", "", message));
  feedback.hidden = false;
}

function renderAuditSummary(rows)
{
  const grid = auditNode("section", "catalog-summary audit-summary");
  grid.setAttribute("aria-label", "Ringkasan sebelum filter kartu");
  [["all", "Semua aktivitas"], ["failed", "Tindakan gagal"], ["sensitive", "Tindakan sensitif"], ["account", "Akses & akun"]]
    .forEach(([segment, label]) =>
    {
      const button = auditButton("", "segment", { segment });
      button.className = "queue-tab";
      button.setAttribute("aria-pressed", String(auditState.segment === segment));
      if (segment === "failed")
      {
        button.classList.add("audit-summary-warning");
      }
      button.append(
        auditNode("span", "", label),
        auditNode("strong", "", rows.filter((entry) => auditSegmentMatches(entry, segment)).length)
      );
      grid.append(button);
    });
  auditRoot.append(
    grid,
    auditNode(
      "p",
      "audit-scope",
      `${auditState.role === "admin" ? "Hanya aktivitas Anda, sesuai filter." : "Ringkasan sesuai filter."} Satu catatan dapat masuk beberapa kartu.`
    )
  );
}

function renderAuditFilters(sheet)
{
  const form = auditNode("form", "audit-filters");
  form.noValidate = true;
  const toolbar = auditNode("div", "audit-toolbar");
  const search = auditNode("input");
  Object.assign(
    search,
    {
      id: "audit-search",
      type: "search",
      value: auditState.search,
      placeholder: "Nomor pesanan, SKU, aktivitas, atau pelaku"
    }
  );
  const period = auditSelect("audit-period", [["today", "Hari ini (contoh)"], ["week", "7 hari terakhir (contoh)"],
    ["all", "Semua tanggal"], ["custom", "Tanggal khusus"]], auditState.period);
  const submit = auditNode("button", "queue-button", "Terapkan filter");
  submit.type = "submit";
  toolbar.append(auditField("Cari aktivitas", search), auditField("Periode", period), submit);
  const dates = auditNode("div", "audit-date-fields");
  dates.hidden = period.value !== "custom";
  const from = auditNode("input");
  Object.assign(from, { id: "audit-from", type: "date", value: auditDateValid(auditState.from) ? auditState.from : "" });
  const to = auditNode("input");
  Object.assign(to, { id: "audit-to", type: "date", value: auditDateValid(auditState.to) ? auditState.to : "" });
  dates.append(auditField("Dari tanggal", from), auditField("Sampai tanggal", to));
  period.addEventListener("change", () =>
  {
    dates.hidden = period.value !== "custom";
  });
  const advanced = auditNode("details", "audit-advanced");
  advanced.open = auditState.actor !== (auditState.role === "admin" ? "admin" : "all")
    || [auditState.module, auditState.action, auditState.result].some((value) => value !== "all");
  advanced.append(auditNode("summary", "", "Filter pelaku, modul, dan hasil"));
  const controls = auditNode("div", "audit-advanced-fields");
  const actor = auditSelect("audit-actor", auditState.role === "admin" ? [["admin", "Admin RylVa (Anda)"]]
    : [
      ["all", "Semua pelaku"],
      ...auditActors.map((actor) => [actor.id, `${actor.name} — ${actor.role}`])
    ], auditState.actor, true);
  actor.disabled = auditState.role === "admin";
  const module = auditSelect(
    "audit-module",
    [["all", "Semua modul"], ...Object.entries(auditModules)],
    auditState.module,
    true
  );
  const action = auditSelect(
    "audit-action",
    [["all", "Semua jenis tindakan"], ...Object.entries(auditActionLabels)],
    auditState.action,
    true
  );
  const result = auditSelect(
    "audit-result",
    [["all", "Semua hasil"], ["success", "Berhasil"], ["failed", "Gagal"]],
    auditState.result
  );
  controls.append(
    auditField("Pelaku", actor),
    auditField("Modul", module),
    auditField("Jenis tindakan", action),
    auditField("Hasil tindakan", result)
  );
  advanced.append(controls);
  form.append(toolbar, dates, advanced);
  const endActions = auditNode("div", "audit-filter-end-actions");
  const apply = auditNode("button", "queue-button", "Terapkan filter");
  apply.type = "submit";
  endActions.append(apply);
  form.append(endActions);
  form.addEventListener("submit", (event) =>
  {
    event.preventDefault();
    const invalid = period.value === "custom" && (!auditDateValid(from.value) || !auditDateValid(to.value) || from.value > to.value);
    let error = form.querySelector(".audit-filter-error");
    if (invalid)
    {
      if (!error)
      {
        error = auditNode(
          "p",
          "audit-filter-error",
          "Isi tanggal yang valid; tanggal awal tidak boleh melewati tanggal akhir."
        );
        error.setAttribute("role", "alert");
        error.tabIndex = -1;
        form.append(error);
      }
      from.setAttribute("aria-invalid", "true");
      to.setAttribute("aria-invalid", "true");
      error.focus();
      return;
    }
    auditNavigate({ search: search.value, period: period.value, from: from.value, to: to.value,
      actor: actor.value, module: module.value, action: action.value, result: result.value, page: 1 });
  });
  sheet.append(form);
}

function auditResult(entry)
{
  return auditBadge(entry.result === "success" ? "Berhasil" : "Gagal", entry.result === "success" ? "success" : "warning",
    entry.result === "success" ? "check" : "alert");
}

function auditActivityIdentity(entry)
{
  const identity = auditNode("div", "audit-stack");
  identity.append(auditNode("strong", "", entry.title), auditNode("span", "secondary-text", entry.id));
  if (entry.sensitive)
  {
    identity.append(auditBadge("Tindakan sensitif", "info", "info"));
  }
  return identity;
}

function renderAuditTable(entries, sheet)
{
  const table = auditNode("table", "audit-table");
  table.append(auditNode("caption", "sr-only", "Daftar aktivitas, terbaru terlebih dahulu"));
  const headings = ["Waktu", "Pelaku", "Aktivitas", "Objek", "Hasil tindakan", "Tindakan"];
  const head = auditNode("thead");
  const row = auditNode("tr");
  headings.forEach((label) =>
  {
    const cell = auditNode("th", "", label);
    cell.scope = "col";
    row.append(cell);
  });
  head.append(row);
  const body = auditNode("tbody");
  entries.forEach((entry) =>
  {
    const row = auditNode("tr");
    const actor = auditActor(entry.actorId);
    const identity = auditNode("div", "audit-stack");
    identity.append(auditNode("strong", "", actor.name), auditNode("span", "secondary-text", actor.role));
    if (actor.type !== "Staf")
    {
      identity.append(auditBadge(actor.type, "neutral", "info"));
    }
    const object = auditNode("div", "audit-stack");
    object.append(auditNode("strong", "", entry.object.id), auditNode("span", "secondary-text", auditModules[entry.module]));
    const button = auditButton("Buka", "entry", { entry: entry.id });
    button.setAttribute("aria-label", `Buka catatan ${entry.id}`);
    button.append(auditIcon("chevron"));
    const time = auditNode("time", "audit-time audit-stack");
    time.dateTime = entry.at;
    time.setAttribute("aria-label", auditTime(entry.at));
    const clock = new Intl.DateTimeFormat("id-ID",
    {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta"
    }).format(new Date(entry.at));
    time.append(auditNode("span", "", auditTime(entry.at, true)), auditNode("span", "secondary-text", `${clock} WIB`));
    [time, identity, auditActivityIdentity(entry), object, auditResult(entry), button].forEach((content, index) =>
    {
      const cell = auditNode("td");
      cell.dataset.label = headings[index];
      cell.append(content);
      row.append(cell);
    });
    body.append(row);
  });
  table.append(head, body);
  sheet.append(table);
}

function renderAuditList()
{
  const base = auditBaseRows();
  renderAuditSummary(base);
  if (auditIntegrity === "warning" && auditState.role === "superadmin")
  {
    auditRoot.append(auditNotice(
      "Simulasi: hasil pemeriksaan integritas menunjukkan ketidaksesuaian. Periksa catatan melalui penanggung jawab sistem; riwayat tidak diubah dari halaman ini.",
      true
    ));
  }
  const sheet = auditNode("section", "catalog-sheet audit-sheet");
  renderAuditFilters(sheet);
  const rows = base.filter((entry) => auditSegmentMatches(entry));
  const pages = Math.max(1, Math.ceil(rows.length / auditPageSize));
  auditState.page = Math.min(auditState.page, pages);
  history.replaceState({}, "", auditUrl());
  const offset = (auditState.page - 1) * auditPageSize;
  const meta = auditNode("div", "audit-list-meta");
  const count = auditNode("p", "", `${rows.length} aktivitas ditemukan`);
  count.setAttribute("role", "status");
  const clear = auditButton("Hapus filter", "clear");
  clear.className = "queue-text-button";
  meta.append(count, clear);
  sheet.append(meta);
  if (!rows.length)
  {
    const empty = auditPanel(auditLoadState === "empty" ? "Belum ada aktivitas" : "Aktivitas tidak ditemukan",
      auditLoadState === "empty" ? "Aktivitas akan muncul setelah tindakan yang tercatat dilakukan. Catatan dibuat oleh sistem."
        : "Ubah kata pencarian, periode, atau filter. Anda juga dapat menghapus semua filter.");
    empty.classList.add("audit-empty");
    sheet.append(empty);
  }
  else
  {
    renderAuditTable(rows.slice(offset, offset + auditPageSize), sheet);
  }
  const footer = auditNode("div", "audit-pagination");
  footer.append(auditNode(
    "p",
    "",
    rows.length ? `Menampilkan ${offset + 1}–${Math.min(offset + auditPageSize, rows.length)} dari ${rows.length} aktivitas` : "Menampilkan 0 aktivitas"
  ));
  const controls = auditNode("div", "audit-pagination-controls");
  const previous = auditButton("", "page", { page: auditState.page - 1 });
  previous.className = "icon-button";
  previous.setAttribute("aria-label", "Halaman sebelumnya");
  previous.disabled = auditState.page <= 1;
  previous.append(auditIcon("chevron"));
  const next = auditButton("", "page", { page: auditState.page + 1 });
  next.className = "icon-button";
  next.setAttribute("aria-label", "Halaman berikutnya");
  next.disabled = auditState.page >= pages;
  next.append(auditIcon("chevron"));
  controls.append(previous, auditNode("span", "", `${auditState.page} dari ${pages}`), next);
  footer.append(controls);
  sheet.append(footer);
  auditRoot.append(sheet);
  const help = auditNode("details", "audit-readonly-info");
  help.append(auditNode("summary", "", "Tentang catatan dan pemeriksaan integritas"));
  help.append(auditNode(
    "p",
    "",
    "Catatan hanya baca. Koreksi dilakukan melalui modul asal dan menghasilkan catatan baru. Rahasia login dan isi data pribadi lengkap tidak ditampilkan."
  ));
  if (auditState.role === "superadmin")
  {
    const text = auditIntegrity === "unknown" ? "Belum ada hasil pemeriksaan integritas."
      : auditIntegrity === "verified" ? "Simulasi hasil sesuai; bukan hasil verifikasi server."
        : "Simulasi ketidaksesuaian; bukan hasil pemeriksaan server.";
    help.append(auditNode("p", "", text));
  }
  help.append(auditNode(
    "p",
    "secondary-text",
    "Data ilustrasi terpisah dari modul lain. Akses pratinjau ditambahkan ke riwayat lokal; tidak ada penyimpanan atau pemeriksaan integritas server."
  ));
  auditRoot.append(help);
}

function renderAuditChanges(entry)
{
  const panel = auditPanel("Perubahan yang tercatat");
  if (!entry.changes.length)
  {
    panel.append(auditNotice("Peristiwa ini tidak memiliki perbandingan nilai. Lihat hasil tindakan dan alasannya."));
    return panel;
  }
  if (!entry.applied)
  {
    panel.append(auditNotice(
      "Tidak ada perubahan yang diterapkan. Nilai sesudah tetap sama dengan nilai sebelumnya.",
      entry.result === "failed"
    ));
  }
  const table = auditNode("table", "audit-change-table");
  const head = auditNode("thead");
  const heading = auditNode("tr");
  ["Data", "Sebelum", "Sesudah"].forEach((label) =>
  {
    const cell = auditNode("th", "", label);
    cell.scope = "col";
    heading.append(cell);
  });
  head.append(heading);
  const body = auditNode("tbody");
  entry.changes.forEach((change) =>
  {
    const row = auditNode("tr");
    const field = auditNode("th", "", change.field);
    field.scope = "row";
    const before = auditNode("td", "", change.before);
    before.dataset.label = "Sebelum";
    const after = auditNode("td", change.before !== change.after ? "audit-changed" : "");
    after.dataset.label = "Sesudah";
    const value = auditNode("div", "audit-stack");
    value.append(auditNode("span", "", change.after));
    if (change.before !== change.after)
    {
      value.append(auditBadge("Berubah", "info", "edit"));
    }
    after.append(value);
    row.append(field, before, after);
    body.append(row);
  });
  table.append(head, body);
  panel.append(table);
  return panel;
}

function renderAuditDetail(entry)
{
  const header = auditPanel(entry.title);
  const badges = auditNode("div", "audit-inline");
  badges.append(auditResult(entry), auditBadge(auditModules[entry.module], "neutral", "orders"));
  if (entry.sensitive)
  {
    badges.append(auditBadge("Tindakan sensitif", "info", "info"));
  }
  header.append(badges, auditNode("p", "secondary-text", `${entry.id}, ${auditTime(entry.at)}`));
  auditRoot.append(header);
  const layout = auditNode("div", "audit-detail-grid");
  const main = auditNode("div", "audit-detail-main");
  main.append(renderAuditChanges(entry));
  const reason = auditPanel(entry.result === "failed" ? "Mengapa tindakan gagal?" : "Alasan dan konteks");
  reason.append(auditNode("p", "", entry.reason || "Alasan tidak tersedia pada catatan sumber."));
  if (entry.module === "payments")
  {
    reason.append(auditNotice("Hasil tindakan menunjukkan keberhasilan pencatatan atau pemrosesan. Status pembayaran berada pada rincian objek dan dapat berbeda."));
  }
  if (entry.approval)
  {
    const people = auditNode("dl", "audit-definition");
    people.append(auditNode("dt", "", "Pengaju"), auditNode("dd", "", entry.approval.requester),
      auditNode("dt", "", "Penyetuju"), auditNode("dd", "", entry.approval.checker));
    reason.append(people);
  }
  main.append(reason);
  const side = auditPanel("Pelaku dan objek");
  const actor = auditActor(entry.actorId);
  const metadata = auditNode("dl", "audit-definition");
  [["Pelaku", actor.name], ["Peran saat tindakan", actor.role], ["Sumber", actor.type], ["Alamat IP", entry.ip],
    ["Jenis tindakan", auditActionLabels[entry.action]], ["Objek", entry.object.id], ["Keterangan", entry.object.label]]
    .forEach(([label, value]) => metadata.append(auditNode("dt", "", label), auditNode("dd", "", value)));
  side.append(metadata);
  if (entry.object.route)
  {
    const link = auditNode("a", "queue-button", "Buka modul asal");
    const url = new URL(entry.object.route, location.href);
    url.searchParams.set("role", auditState.role);
    link.href = url.href;
    side.append(
      link,
      auditNode(
        "p",
        "audit-help",
        "Tautan membuka fixture modul terkait; perubahan contoh lintas halaman belum tersinkronisasi."
      )
    );
  }
  else
  {
    side.append(auditNode("p", "secondary-text", "Tautan objek belum tersedia pada prototipe ini."));
  }
  layout.append(main, side);
  auditRoot.append(layout);
  const related = auditVisibleEntries().filter((item) => item.id !== entry.id
    && item.module === entry.module && item.object.id === entry.object.id).slice(0, 5);
  if (related.length)
  {
    const panel = auditPanel("Aktivitas pada objek yang sama");
    related.forEach((item) => panel.append(auditButton(
      `${auditTime(item.at)}: ${item.title}`,
      "entry",
      { entry: item.id }
    )));
    auditRoot.append(panel);
  }
}

function renderAuditLoading()
{
  const section = auditPanel("Memuat riwayat aktivitas…");
  section.setAttribute("role", "status");
  section.setAttribute("aria-busy", "true");
  for (let index = 0; index < 5; index++)
  {
    const row = auditNode("div", "audit-skeleton");
    row.setAttribute("aria-hidden", "true");
    section.append(row);
  }
  auditRoot.append(section);
}

function renderAudit()
{
  auditRoot.replaceChildren();
  const full = auditState.role === "superadmin";
  const title = full ? "Audit Log" : "Aktivitas Saya";
  document.title = `${title} | RylVa Green`;
  document.getElementById("audit-title").textContent = auditState.entry ? "Detail aktivitas" : title;
  document.getElementById("audit-subtitle").textContent = full
    ? "Telusuri pelaku, perubahan, dan hasil tindakan operasional toko."
    : "Telusuri tindakan dan perubahan operasional milik Anda.";
  document.getElementById("profile-name").textContent = full ? "SuperAdmin RylVa" : "Admin RylVa";
  document.getElementById("preview-role").textContent = `Pratinjau ${full ? "SuperAdmin" : "Admin"}`;
  document.getElementById("audit-profile").value = auditState.role;
  document.getElementById("audit-load-state").value = auditLoadState;
  document.getElementById("audit-reload").disabled = auditBusy;
  document.querySelectorAll("[data-superadmin-only]").forEach((node) => node.hidden = !full);
  document.querySelectorAll("[data-role-link]").forEach((link) =>
  {
    const url = new URL(link.href, location.href);
    url.searchParams.set("role", auditState.role);
    link.href = url.href;
  });
  const breadcrumb = document.getElementById("audit-breadcrumb");
  const home = auditNode("a", "", "Ruang kerja");
  home.href = `../staff/admin-dashboard.html?role=${auditState.role}`;
  breadcrumb.replaceChildren(home, auditNode("span", "", "/"));
  if (auditState.entry)
  {
    const list = auditNode("a", "", title);
    list.href = auditUrl();
    list.dataset.auditAction = "back";
    breadcrumb.append(list, auditNode("span", "", "/"));
  }
  const current = auditNode("span", "", auditState.entry ? "Detail aktivitas" : title);
  current.setAttribute("aria-current", "page");
  breadcrumb.append(current);
  if (auditLoadState === "loading")
  {
    renderAuditLoading();
    return;
  }
  if (auditLoadState === "error")
  {
    const error = auditPanel("Riwayat gagal dimuat", "Coba lagi. Filter Anda tetap dipertahankan.");
    error.setAttribute("role", "alert");
    error.append(auditButton("Coba lagi", "retry"));
    auditRoot.append(error);
    return;
  }
  if (auditState.entry)
  {
    const back = auditButton(`Kembali ke ${full ? "audit log" : "aktivitas saya"}`, "back");
    back.className = "queue-text-button back-button";
    back.prepend(auditIcon("chevron"));
    auditRoot.append(back);
    const entry = auditVisibleEntries().find((item) => item.id === auditState.entry);
    if (entry)
    {
      renderAuditDetail(entry);
    }
    else
    {
      const unavailable = auditPanel(
        "Catatan tidak tersedia",
        "Catatan tidak ditemukan atau berada di luar akses Anda. Kembali ke daftar aktivitas yang dapat Anda lihat."
      );
      unavailable.setAttribute("role", "alert");
      auditRoot.append(unavailable);
    }
  }
  else
  {
    renderAuditList();
  }
}

async function reloadAudit()
{
  if (auditBusy)
  {
    return;
  }
  auditBusy = true;
  auditLoadState = "loading";
  renderAudit();
  await new Promise((resolve) => setTimeout(resolve, 250));
  const fail = document.getElementById("audit-fail-load");
  auditLoadState = fail.checked ? "error" : "full";
  fail.checked = false;
  auditBusy = false;
  if (auditLoadState === "full")
  {
    auditRecordAccess(auditState.entry);
  }
  renderAudit();
  auditFeedback(auditLoadState === "error" ? "Data belum berhasil dimuat. Gunakan Coba lagi." : "Data contoh dimuat ulang; akses tercatat di tab ini.");
}

document.addEventListener("click", (event) =>
{
  const button = event.target.closest("[data-audit-action]");
  if (!button || auditBusy)
  {
    return;
  }
  event.preventDefault();
  const { auditAction: action, entry, segment, page } = button.dataset;
  if (action === "entry")
  {
    auditNavigate({ entry });
  }
  else if (action === "back")
  {
    auditNavigate({ entry: "" });
  }
  else if (action === "segment")
  {
    auditNavigate({ segment, page: 1 });
  }
  else if (action === "page")
  {
    auditNavigate({ page: Math.max(1, Number(page)) });
  }
  else if (action === "clear")
  {
    auditNavigate({ search: "", actor: auditState.role === "admin" ? "admin" : "all", module: "all", action: "all",
      result: "all", segment: "all", period: "today", from: "2026-11-04", to: "2026-11-04", page: 1 });
  }
  else if (action === "reload" || action === "retry")
  {
    reloadAudit();
  }
});
document.getElementById("audit-profile").addEventListener("change", (event) =>
{
  auditState.role = event.target.value;
  auditState.actor = auditState.role === "admin" ? "admin" : "all";
  auditRecordAccess("");
  auditNavigate({ page: 1 });
});
document.getElementById("audit-load-state").addEventListener("change", (event) =>
{
  auditLoadState = event.target.value;
  renderAudit();
});
document.getElementById("audit-integrity").addEventListener("change", (event) =>
{
  auditIntegrity = event.target.value;
  renderAudit();
});
window.addEventListener("popstate", () =>
{
  auditState = readAuditState();
  renderAudit();
});

auditRecordAccess(auditState.entry);
renderAudit();
