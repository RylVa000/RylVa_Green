"use strict";

document.documentElement.classList.add("js");

const closureRoot = document.getElementById("closure-view");
const closureDialog = document.getElementById("closure-dialog");
const closureForm = document.getElementById("closure-form");
const closureWeekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
let closureState = readClosureState();
let closureLoadState = "full";
let closureSaving = false;
let closureDirty = false;
let closureDialogContext = null;
let closureRenderedToday = closureTodayKey();

function closureTodayKey()
{
  return new Intl.DateTimeFormat("en-CA",
  {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta"
  }).format(new Date());
}

function closureNode(tag, className = "", text = "")
{
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = String(text);
  return node;
}

function closureIcon(name)
{
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "icon icon--small");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(svg.namespaceURI, "use");
  use.setAttribute("href", `#i-${name}`);
  svg.append(use);
  return svg;
}

function closureButton(label, action, className = "queue-button", data = {})
{
  const button = closureNode("button", className, label);
  button.type = "button";
  button.dataset.closureAction = action;
  Object.assign(button.dataset, data);
  return button;
}

function closureBadge(label, tone = "info", icon = "info")
{
  const badge = closureNode("span", `queue-badge queue-badge--${tone} closure-badge`);
  badge.append(closureIcon(icon), closureNode("span", "", label));
  return badge;
}

function closureNotice(message, tone = "info")
{
  const notice = closureNode("div", `product-note product-note--${tone} closure-notice`);
  notice.append(closureIcon(tone === "warning" ? "alert" : "info"), closureNode("p", "", message));
  return notice;
}

function closureKey(date)
{
  return date.toISOString().slice(0, 10);
}

function closureDate(key)
{
  return new Date(`${key}T12:00:00Z`);
}

function closureValidDate(key)
{
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key))
  {
    return false;
  }
  const date = closureDate(key);
  return !Number.isNaN(date.getTime()) && closureKey(date) === key;
}

function closureIsPast(date)
{
  return closureValidDate(date) && date < closureTodayKey();
}

function closureFormatDate(key, withWeekday = false)
{
  return new Intl.DateTimeFormat("id-ID",
  {
    ...(withWeekday ? { weekday: "long" } : {}),
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(closureDate(key));
}

function closureFormatTime(value)
{
  return `${new Intl.DateTimeFormat("id-ID",
  {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta"
  }).format(new Date(value))} WIB`;
}

function closureMonthLabel(key)
{
  return new Intl.DateTimeFormat("id-ID",
  {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(closureDate(`${key}-01`));
}

function readClosureState()
{
  const params = new URLSearchParams(location.search);
  const selected = params.get("date");
  let date = closureValidDate(selected || "") ? selected : closureTodayKey();
  const month = params.get("month");
  const validMonth = /^\d{4}-\d{2}$/.test(month || "") && closureValidDate(`${month}-01`);
  if (validMonth && !date.startsWith(month))
  {
    date = `${month}-01`;
  }
  const view = params.get("view");
  return {
    role: params.get("role") === "superadmin" ? "superadmin" : "admin",
    month: validMonth ? month : date.slice(0, 7),
    date,
    view: ["calendar", "closed", "history"].includes(view) ? view : "calendar"
  };
}

function closureUrl()
{
  const params = new URLSearchParams(closureState);
  return `${location.pathname}?${params}`;
}

function closureNavigate(changes, focusSelector = "")
{
  Object.assign(closureState, changes);
  history.pushState({}, "", closureUrl());
  document.getElementById("closure-feedback").hidden = true;
  renderClosurePage();
  if (focusSelector)
  {
    closureRoot.querySelector(focusSelector)?.focus({ preventScroll: true });
  }
}

function closureActor()
{
  return closureState.role === "superadmin" ? "SuperAdmin RylVa" : "Admin RylVa";
}

function closureAt(date)
{
  return closureLoadState === "empty" ? undefined : closureDates.find((entry) => entry.date === date);
}

function closureOrdersAt(date)
{
  return closureOrders.filter((order) => order.date === date);
}

function closureOrderLink(id, text = "Buka pesanan")
{
  const link = closureNode("a", "queue-button", text);
  link.href = `../staff/orders-queue.html?role=${closureState.role}&tab=all&order=${encodeURIComponent(id)}`;
  link.setAttribute("aria-label", `${text} ${id}`);
  return link;
}

function closureFeedback(message)
{
  const feedback = document.getElementById("closure-feedback");
  feedback.replaceChildren(closureIcon("check"), closureNode("span", "", message));
  feedback.hidden = false;
  feedback.focus();
}

function closurePanel(title, description = "")
{
  const panel = closureNode("section", "product-panel closure-panel");
  panel.append(closureNode("h2", "", title));
  if (description)
  {
    panel.append(closureNode("p", "secondary-text", description));
  }
  return panel;
}

function closureEmpty(title, text)
{
  const empty = closureNode("div", "closure-empty");
  empty.append(closureIcon("info"), closureNode("h3", "", title), closureNode("p", "", text));
  return empty;
}

function closureRenderSummary()
{
  const monthClosures = closureLoadState === "empty"
    ? []
    : closureDates.filter((entry) => entry.date.startsWith(closureState.month));
  const monthOrders = closureOrders.filter((entry) => entry.date.startsWith(closureState.month));
  const affected = monthOrders.filter((entry) => closureAt(entry.date));
  const summary = closureNode("section", "catalog-summary closure-summary");
  summary.setAttribute("aria-label", `Ringkasan ${closureMonthLabel(closureState.month)}`);
  [
    ["Tanggal tutup", monthClosures.length],
    ["Pesanan terjadwal", monthOrders.length],
    ["Pesanan terdampak", affected.length]
  ].forEach(([label, count], index) =>
  {
    const item = closureNode("div", `queue-tab${index === 2 && count ? " closure-summary-warning" : ""}`);
    item.append(closureNode("span", "", label), closureNode("strong", "", count));
    summary.append(item);
  });
  closureRoot.append(summary);
  if (affected.length)
  {
    const alert = closureNode("section", "closure-alert");
    alert.setAttribute("aria-label", "Pesanan perlu ditangani");
    const message = closureNode("div", "closure-alert-message");
    message.append(
      closureIcon("alert"),
      closureNode("div", "", `${affected.length} pesanan berada pada tanggal tutup di bulan ini.`)
    );
    const button = closureButton("Lihat pesanan terdampak", "affected", "queue-text-button");
    alert.append(message, button);
    closureRoot.append(alert);
  }
}

function closureRenderTabs()
{
  const tabs = closureNode("nav", "product-detail-tabs closure-tabs");
  tabs.setAttribute("aria-label", "Bagian kalender tutup");
  [["calendar", "Kalender"], ["closed", "Tanggal tutup"], ["history", "Riwayat perubahan"]]
    .forEach(([view, label]) =>
    {
      const button = closureButton(label, "view", "", { view });
      if (view === closureState.view)
      {
        button.setAttribute("aria-current", "page");
      }
      tabs.append(button);
    });
  closureRoot.append(tabs);
}

function closureShiftMonth(offset)
{
  const date = closureDate(`${closureState.month}-01`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  const month = closureKey(date).slice(0, 7);
  const currentDay = Number(closureState.date.slice(-2));
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  const selected = `${month}-${String(Math.min(currentDay, lastDay)).padStart(2, "0")}`;
  closureNavigate({ month, date: selected }, ".closure-month-title");
}

function closureRenderCalendar()
{
  const grid = closureNode("div", "closure-layout");
  const calendar = closurePanel("Kalender pengiriman");
  const header = closureNode("div", "closure-calendar-header");
  const month = closureNode("h3", "closure-month-title", closureMonthLabel(closureState.month));
  month.tabIndex = -1;
  const controls = closureNode("div", "closure-month-controls");
  const previous = closureButton("", "previous", "icon-button");
  previous.setAttribute("aria-label", "Bulan sebelumnya");
  previous.append(closureIcon("chevron"));
  const today = closureButton("Hari ini", "today", "queue-button");
  const next = closureButton("", "next", "icon-button closure-next");
  next.setAttribute("aria-label", "Bulan berikutnya");
  next.append(closureIcon("chevron"));
  controls.append(previous, today, next);
  header.append(month, controls);
  const legend = closureNode("div", "closure-legend");
  legend.append(
    closureBadge("Tutup", "warning", "calendar"),
    closureBadge("Jumlah pesanan", "info", "orders"),
    closureBadge("Perlu ditangani", "warning", "alert"),
    closureBadge("Lampau: hanya lihat", "neutral", "info")
  );
  const table = closureNode("table", "closure-month-grid");
  table.setAttribute("aria-label", `Kalender ${closureMonthLabel(closureState.month)}`);
  const head = closureNode("thead");
  const weekRow = closureNode("tr");
  closureWeekdays.forEach((day) =>
  {
    const cell = closureNode("th", "", day);
    cell.scope = "col";
    weekRow.append(cell);
  });
  head.append(weekRow);
  const body = closureNode("tbody");
  const first = closureDate(`${closureState.month}-01`);
  const firstOffset = (first.getUTCDay() + 6) % 7;
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const weeks = Math.ceil((firstOffset + last) / 7);
  for (let week = 0; week < weeks; week++)
  {
    const row = closureNode("tr");
    for (let day = 0; day < 7; day++)
    {
      const number = week * 7 + day - firstOffset + 1;
      const cell = closureNode("td");
      if (number > 0 && number <= last)
      {
        const date = `${closureState.month}-${String(number).padStart(2, "0")}`;
        const count = closureOrdersAt(date).length;
        const closed = Boolean(closureAt(date));
        const button = closureButton("", "date", "closure-day", { date });
        button.tabIndex = date === closureState.date ? 0 : -1;
        button.setAttribute("aria-pressed", String(date === closureState.date));
        const dateLabel = `${closureFormatDate(date, true)}; `
          + `${closed ? "toko tutup" : "toko buka"}; ${count} pesanan`
          + `${closed && count ? "; perlu ditangani" : ""}`
          + `${closureIsPast(date) ? "; tanggal lampau, hanya dapat dilihat" : ""}`
          + `${date === closureTodayKey() ? "; hari ini WIB" : ""}`;
        button.setAttribute("aria-label", dateLabel);
        button.classList.toggle("is-past", closureIsPast(date));
        if (date === closureTodayKey())
        {
          button.setAttribute("aria-current", "date");
        }
        const top = closureNode("span", "closure-day-top");
        top.append(closureNode("strong", "", number));
        if (closed)
        {
          top.append(closureIcon("calendar"));
          button.classList.add("is-closed");
        }
        button.append(top);
        if (closed)
        {
          button.append(closureNode("span", "closure-day-label", "Tutup"));
        }
        if (count)
        {
          const orderCount = closureNode("span", "closure-day-orders");
          orderCount.append(
            closureIcon("orders"),
            closureNode("span", "", count)
          );
          if (closed)
          {
            orderCount.append(closureIcon("alert"));
          }
          button.append(orderCount);
        }
        if (closed && count)
        {
          button.classList.add("has-conflict");
        }
        cell.append(button);
      }
      row.append(cell);
    }
    body.append(row);
  }
  table.append(head, body);
  const calendarScroll = closureNode("div", "closure-calendar-scroll");
  calendarScroll.tabIndex = 0;
  calendarScroll.setAttribute("aria-label", "Kalender bulanan, dapat digeser ke samping bila diperlukan");
  calendarScroll.append(table);
  const scrollHint = closureNode("p", "closure-scroll-hint", "Geser kalender untuk melihat semua hari.");
  scrollHint.hidden = true;
  calendar.append(
    header,
    legend,
    scrollHint,
    calendarScroll
  );
  grid.append(calendar, closureRenderDay());
  closureRoot.append(grid);
  requestAnimationFrame(closureUpdateScrollHint);
}

function closureUpdateScrollHint()
{
  const scroll = closureRoot.querySelector(".closure-calendar-scroll");
  const hint = closureRoot.querySelector(".closure-scroll-hint");
  if (scroll && hint)
  {
    hint.hidden = scroll.scrollWidth <= scroll.clientWidth + 1;
  }
}

function closureOrderEntry(order, conflict)
{
  const item = closureNode("article", "closure-order");
  const top = closureNode("div", "closure-order-heading");
  const identity = closureNode("div", "closure-stack");
  identity.append(closureNode("strong", "", order.id), closureNode("span", "", order.customer));
  top.append(identity, closureOrderLink(order.id, "Buka"));
  const details = closureNode("dl", "closure-order-details");
  [
    ["Jadwal", order.slot],
    ["Pesanan", order.status],
    ["Pembayaran", order.payment],
    ["Pengiriman", order.shipping]
  ].forEach(([label, value]) =>
  {
    const group = closureNode("div");
    const detail = closureNode("dd");
    if (label === "Pesanan")
    {
      detail.append(closureBadge(value, value === "Perlu Penanganan" ? "warning" : "info", value === "Perlu Penanganan" ? "alert" : "orders"));
    }
    else if (label === "Pembayaran")
    {
      detail.append(closureBadge(value, value === "Berhasil" ? "success" : "info", value === "Berhasil" ? "check" : "clock"));
    }
    else if (label === "Pengiriman")
    {
      detail.append(closureBadge(value, "neutral", "truck"));
    }
    else
    {
      detail.textContent = value;
    }
    group.append(closureNode("dt", "", label), detail);
    details.append(group);
  });
  item.append(top);
  if (conflict)
  {
    item.append(closureBadge("Jadwal perlu ditangani", "warning", "alert"));
  }
  item.append(details);
  return item;
}

function closureRenderDay()
{
  const date = closureState.date;
  const closed = closureAt(date);
  const isPast = closureIsPast(date);
  const orders = closureOrdersAt(date);
  const panel = closurePanel("Detail tanggal");
  panel.id = "closure-date-detail";
  panel.querySelector("h2").tabIndex = -1;
  const heading = closureNode("div", "closure-detail-header");
  heading.append(
    closureNode("h3", "", closureFormatDate(date, true)),
    closureBadge(closed ? "Toko tutup" : "Toko buka", closed ? "warning" : "success", closed ? "calendar" : "check")
  );
  panel.append(heading);
  if (isPast)
  {
    panel.append(closureBadge("Tanggal lampau — hanya lihat", "neutral", "info"));
    panel.append(closureNotice(
      `Tanggal sebelum ${closureFormatDate(closureTodayKey())} hanya dapat dilihat. Riwayat dan pesanan tetap tersedia.`
    ));
  }
  if (closed)
  {
    const reason = closureNode("div", "closure-reason");
    reason.append(closureNode("span", "secondary-text", "Keterangan"), closureNode("p", "", closed.reason));
    panel.append(reason);
    if (orders.length)
    {
      panel.append(closureNotice("Hubungi pelanggan dan tinjau jadwal melalui detail pesanan. Tidak ada jadwal yang dipindahkan otomatis.", "warning"));
    }
  }
  else
  {
    panel.append(closureNode("p", "secondary-text", "Tanggal ini belum ditandai tutup."));
  }
  const actions = closureNode("div", "closure-actions");
  if (!isPast && closed)
  {
    actions.append(
      closureButton("Edit keterangan", "edit", "queue-button", { date }),
      closureButton("Buka kembali tanggal", "reopen", "queue-button", { date })
    );
  }
  else if (!isPast)
  {
    actions.append(closureButton("Tandai tanggal tutup", "add", "queue-button queue-button--primary", { date }));
  }
  panel.append(actions);
  const orderHeading = closureNode("div", "closure-section-heading");
  orderHeading.append(
    closureNode("h3", "", "Pesanan terjadwal"),
    closureNode("strong", "tabular", String(orders.length))
  );
  panel.append(orderHeading);
  if (!orders.length)
  {
    panel.append(closureEmpty("Tidak ada pesanan terjadwal", "Belum ada pesanan contoh pada tanggal ini."));
  }
  orders.forEach((order) => panel.append(closureOrderEntry(order, Boolean(closed))));
  if (orders.length)
  {
    panel.append(closureNode("p", "closure-sync-note", "Pesanan contoh tidak tersinkronisasi dengan perubahan di antrean."));
  }
  return panel;
}

function closureRenderClosed()
{
  const monthEntries = (closureLoadState === "empty" ? [] : closureDates)
    .filter((entry) => entry.date.startsWith(closureState.month))
    .slice()
    .sort((left, right) => left.date.localeCompare(right.date));
  const section = closurePanel("Tanggal tutup", `Jadwal tutup untuk ${closureMonthLabel(closureState.month)}.`);
  if (!monthEntries.length)
  {
    section.append(closureEmpty("Belum ada tanggal tutup", "Bulan ini belum memiliki tanggal tutup yang dicatat."));
  }
  monthEntries.forEach((entry) =>
  {
    const row = closureNode("article", "closure-record");
    const info = closureNode("div", "closure-stack");
    const count = closureOrdersAt(entry.date).length;
    info.append(
      closureNode("h3", "", closureFormatDate(entry.date, true)),
      closureNode("p", "", entry.reason),
      closureBadge(count ? `${count} pesanan perlu ditangani` : "Tidak ada pesanan terjadwal", count ? "warning" : "info", count ? "alert" : "info")
    );
    const button = closureButton("Lihat tanggal", "date", "queue-button", { date: entry.date });
    row.append(info, button);
    section.append(row);
  });
  closureRoot.append(section);
}

function closureRenderHistory()
{
  const description = closureState.role === "superadmin"
    ? "Perubahan yang dicatat oleh seluruh profil pratinjau."
    : "Menampilkan perubahan yang dicatat oleh Admin ini.";
  const section = closurePanel("Riwayat perubahan", description);
  const history = (closureLoadState === "empty" ? [] : closureHistory)
    .filter((entry) => entry.date.startsWith(closureState.month)
      && (closureState.role === "superadmin" || entry.actor === closureActor()))
    .slice()
    .reverse();
  if (!history.length)
  {
    section.append(closureEmpty("Belum ada riwayat", "Tidak ada perubahan tanggal tutup pada bulan ini."));
  }
  const list = closureNode("ol", "closure-history");
  history.forEach((entry) =>
  {
    const item = closureNode("li");
    item.append(
      closureIcon("check"),
      closureNode("strong", "", entry.action),
      closureNode("p", "", `${closureFormatDate(entry.date)} — ${entry.reason}`),
      closureNode("span", "secondary-text", `${entry.actor} — ${closureFormatTime(entry.at)}`)
    );
    if (entry.previousReason)
    {
      item.append(closureNode("p", "", `Keterangan sebelumnya: ${entry.previousReason}`));
    }
    list.append(item);
  });
  section.append(list);
  closureRoot.append(section);
}

function renderClosurePage()
{
  closureRoot.replaceChildren();
  document.getElementById("closure-add").disabled = ["loading", "error"].includes(closureLoadState);
  document.getElementById("profile-name").textContent = closureActor();
  document.getElementById("preview-role").textContent = `Pratinjau ${closureState.role === "superadmin" ? "SuperAdmin" : "Admin"}`;
  document.getElementById("closure-profile").value = closureState.role;
  document.querySelectorAll("[data-superadmin-only]").forEach((node) =>
  {
    node.hidden = closureState.role !== "superadmin";
  });
  document.querySelectorAll("[data-role-link]").forEach((link) =>
  {
    const url = new URL(link.href, location.href);
    url.searchParams.set("role", closureState.role);
    link.href = url.href;
  });
  if (["loading", "error"].includes(closureLoadState))
  {
    const loading = closureLoadState === "loading";
    const section = closurePanel(loading ? "Memuat kalender…" : "Kalender gagal dimuat");
    section.setAttribute("role", loading ? "status" : "alert");
    section.append(
      closureNode("p", "", loading ? "Data sedang disiapkan." : "Jadwal belum dapat ditampilkan. Silakan coba lagi."),
      closureButton("Muat ulang", "retry")
    );
    closureRoot.append(section);
    return;
  }
  closureRenderSummary();
  closureRenderTabs();
  if (closureState.view === "calendar")
  {
    closureRenderCalendar();
  }
  else
  {
    const navigation = closureNode("div", "closure-secondary-month");
    navigation.append(
      closureButton("Bulan sebelumnya", "previous", "queue-text-button"),
      closureNode("strong", "", closureMonthLabel(closureState.month)),
      closureButton("Bulan berikutnya", "next", "queue-text-button")
    );
    closureRoot.append(navigation);
    if (closureState.view === "closed")
    {
      closureRenderClosed();
    }
    else
    {
      closureRenderHistory();
    }
  }
}

function closureField(label, input, help = "")
{
  const field = closureNode("div", "product-field");
  const caption = closureNode("label", "", label);
  caption.htmlFor = input.id;
  field.append(caption, input);
  if (help)
  {
    const hint = closureNode("p", "closure-help", help);
    hint.id = `${input.id}-help`;
    input.setAttribute("aria-describedby", hint.id);
    field.append(hint);
  }
  return field;
}

function closureUpdateImpact()
{
  const dateInput = document.getElementById("closure-form-date");
  const impact = document.getElementById("closure-form-impact");
  const acknowledgement = document.getElementById("closure-acknowledgement");
  if (!dateInput || !impact || !acknowledgement)
  {
    return;
  }
  impact.replaceChildren();
  acknowledgement.hidden = true;
  acknowledgement.querySelector("input").checked = false;
  if (!closureValidDate(dateInput.value))
  {
    return;
  }
  const orders = closureOrdersAt(dateInput.value);
  if (closureDialogContext.action !== "reopen" && orders.length)
  {
    impact.append(closureNotice(`${orders.length} pesanan terjadwal. Hubungi pelanggan; jadwal tidak berubah otomatis.`, "warning"));
    const list = closureNode("ul", "closure-impact-list");
    orders.forEach((order) =>
    {
      const item = closureNode("li");
      item.append(closureNode("span", "", `${order.id} — ${order.customer} — ${order.slot}`));
      list.append(item);
    });
    impact.append(list);
    acknowledgement.hidden = false;
  }
  else
  {
    impact.append(closureNotice(closureDialogContext.action === "reopen"
      ? "Membuka tanggal tidak otomatis mengubah jadwal pesanan yang ada."
      : "Tidak ada pesanan contoh yang terjadwal pada tanggal ini."));
  }
}

function openClosureDialog(action, date)
{
  if (closureSaving || ["loading", "error"].includes(closureLoadState))
  {
    return;
  }
  if (closureIsPast(date))
  {
    if (action === "add")
    {
      date = closureTodayKey();
    }
    else
    {
      return;
    }
  }
  const entry = closureAt(date);
  if ((action === "edit" || action === "reopen") && !entry)
  {
    return;
  }
  closureDirty = false;
  closureDialogContext = { action, originalDate: date, trigger: document.activeElement };
  document.getElementById("closure-dialog-title").textContent = action === "edit"
    ? "Edit keterangan tanggal tutup"
    : action === "reopen" ? "Buka kembali tanggal?" : "Tandai tanggal tutup";
  const body = document.getElementById("closure-dialog-body");
  body.replaceChildren();
  body.append(closureNode("p", "", action === "reopen"
    ? "Setelah terintegrasi, tanggal dapat dipilih kembali sesuai aturan pengiriman."
    : "Setelah terintegrasi, tanggal tutup tidak dapat dipilih untuk pengiriman. Pratinjau ini belum terhubung ke checkout."));
  const dateInput = closureNode("input");
  dateInput.id = "closure-form-date";
  dateInput.type = "date";
  dateInput.required = true;
  dateInput.min = closureTodayKey();
  dateInput.value = date;
  dateInput.readOnly = action !== "add";
  body.append(closureField("Tanggal (wajib)", dateInput, action === "add"
    ? "Pilih tanggal yang akan ditandai tutup."
    : "Tanggal tidak berubah pada tindakan ini."));
  const reason = closureNode("textarea");
  reason.id = "closure-form-reason";
  reason.rows = 3;
  reason.maxLength = 250;
  reason.required = true;
  reason.value = action === "edit" ? entry.reason : "";
  body.append(closureField(action === "reopen" ? "Alasan membuka kembali (wajib)" : "Keterangan tutup (wajib)", reason, "Tulis 3–250 karakter."));
  const impact = closureNode("div", "closure-impact");
  impact.id = "closure-form-impact";
  impact.setAttribute("aria-live", "polite");
  body.append(impact);
  const acknowledge = closureNode("label", "product-check closure-acknowledgement");
  acknowledge.id = "closure-acknowledgement";
  const checkbox = closureNode("input");
  checkbox.type = "checkbox";
  checkbox.id = "closure-form-ack";
  acknowledge.append(checkbox, closureNode("span", "", "Saya akan menindaklanjuti pesanan yang terdampak."));
  body.append(acknowledge);
  const error = closureNode("p", "closure-error");
  error.id = "closure-form-error";
  error.setAttribute("role", "alert");
  error.tabIndex = -1;
  error.hidden = true;
  body.append(error);
  document.getElementById("closure-submit").textContent = action === "reopen"
    ? "Buka kembali"
    : action === "edit" ? "Simpan keterangan" : "Simpan tanggal tutup";
  closureUpdateImpact();
  dateInput.addEventListener("input", () =>
  {
    closureDirty = true;
    closureUpdateImpact();
  });
  reason.addEventListener("input", () => closureDirty = true);
  checkbox.addEventListener("change", () => closureDirty = true);
  closureDialog.showModal();
  if (action === "add")
  {
    dateInput.focus();
  }
  else
  {
    reason.focus();
  }
}

function closeClosureDialog()
{
  if (closureSaving)
  {
    return;
  }
  if (closureDirty && !window.confirm("Perubahan belum disimpan. Tutup formulir?"))
  {
    return;
  }
  closureDirty = false;
  closureDialog.close();
}

closureForm.addEventListener("submit", async (event) =>
{
  event.preventDefault();
  if (closureSaving || !closureDialogContext)
  {
    return;
  }
  const action = closureDialogContext.action;
  const dateInput = document.getElementById("closure-form-date");
  const reasonInput = document.getElementById("closure-form-reason");
  const acknowledge = document.getElementById("closure-form-ack");
  const error = document.getElementById("closure-form-error");
  const date = dateInput.value;
  const reason = reasonInput.value.trim();
  let invalid = null;
  let message = "";
  if (!closureValidDate(date))
  {
    invalid = dateInput;
    message = "Pilih tanggal yang valid.";
  }
  else if (closureIsPast(date))
  {
    invalid = dateInput;
    message = "Tanggal lampau hanya dapat dilihat. Pilih hari ini atau tanggal berikutnya.";
  }
  else if (action === "add" && closureAt(date))
  {
    invalid = dateInput;
    message = "Tanggal ini sudah ditandai tutup. Buka tanggalnya untuk mengubah keterangan.";
  }
  else if (reason.length < 3 || reason.length > 250)
  {
    invalid = reasonInput;
    message = "Tulis keterangan atau alasan antara 3 dan 250 karakter.";
  }
  else if (action !== "reopen" && closureOrdersAt(date).length && !acknowledge.checked)
  {
    invalid = acknowledge;
    message = "Konfirmasi bahwa pesanan terdampak akan ditindaklanjuti.";
  }
  if (invalid)
  {
    error.textContent = message;
    error.hidden = false;
    invalid.setAttribute("aria-invalid", "true");
    invalid.setAttribute("aria-describedby", error.id);
    invalid.focus();
    return;
  }
  error.hidden = true;
  closureSaving = true;
  closureForm.setAttribute("aria-busy", "true");
  const controls = [...closureForm.querySelectorAll("button, input, textarea")];
  const wasDisabled = controls.map((control) => control.disabled);
  controls.forEach((control) => control.disabled = true);
  try
  {
    await new Promise((resolve) => setTimeout(resolve, 220));
    const fail = document.getElementById("closure-fail-save");
    if (fail.checked)
    {
      fail.checked = false;
      throw new Error("Gagal menyimpan. Isian tetap tersedia; coba lagi.");
    }
    const existing = closureAt(date);
    if (closureIsPast(date))
    {
      throw new Error("Tanggal lampau hanya dapat dilihat dan tidak dapat diubah.");
    }
    if ((action === "add" && existing) || (action !== "add" && !existing))
    {
      throw new Error("Status tanggal berubah. Tutup formulir dan periksa tanggal kembali.");
    }
    if (closureLoadState === "empty")
    {
      closureDates.splice(0);
      closureHistory.splice(0);
      closureLoadState = "full";
      document.getElementById("closure-load-state").value = "full";
    }
    const previousReason = existing?.reason || "";
    const now = new Date().toISOString();
    const actor = closureActor();
    if (action === "add")
    {
      closureDates.push({ date, reason, actor, changedAt: now });
    }
    else if (action === "edit")
    {
      existing.reason = reason;
      existing.actor = actor;
      existing.changedAt = now;
    }
    else
    {
      closureDates.splice(closureDates.indexOf(existing), 1);
    }
    closureHistory.push(
    {
      date,
      action: action === "add" ? "Tanggal ditandai tutup" : action === "edit" ? "Keterangan diperbarui" : "Tanggal dibuka kembali",
      reason,
      previousReason: action === "edit" || action === "reopen" ? previousReason : "",
      actor,
      at: now
    });
    closureState.date = date;
    closureState.month = date.slice(0, 7);
    closureState.view = "calendar";
    history.replaceState({}, "", closureUrl());
    closureDirty = false;
    closureDialog.close();
    renderClosurePage();
    closureFeedback(action === "reopen" ? "Tanggal berhasil dibuka kembali pada pratinjau." : "Tanggal tutup berhasil disimpan pada pratinjau.");
  }
  catch (failure)
  {
    error.textContent = failure.message;
    error.hidden = false;
    error.focus();
  }
  finally
  {
    controls.forEach((control, index) => control.disabled = wasDisabled[index]);
    closureSaving = false;
    closureForm.removeAttribute("aria-busy");
  }
});

document.getElementById("closure-cancel").addEventListener("click", closeClosureDialog);
closureDialog.addEventListener("cancel", (event) =>
{
  event.preventDefault();
  closeClosureDialog();
});
closureDialog.addEventListener("close", () =>
{
  if (closureDialogContext?.trigger?.isConnected)
  {
    closureDialogContext.trigger.focus();
  }
});

document.addEventListener("click", (event) =>
{
  const button = event.target.closest("[data-closure-action]");
  if (!button || closureSaving)
  {
    return;
  }
  const { closureAction: action, date, view } = button.dataset;
  if (action === "date")
  {
    closureNavigate({ date, month: date.slice(0, 7), view: "calendar" }, `[data-date="${date}"]`);
  }
  else if (action === "previous" || action === "next")
  {
    closureShiftMonth(action === "previous" ? -1 : 1);
  }
  else if (action === "today")
  {
    const today = closureTodayKey();
    closureNavigate({ date: today, month: today.slice(0, 7) }, `[data-date="${today}"]`);
  }
  else if (action === "view")
  {
    closureNavigate({ view }, `[data-view="${view}"]`);
  }
  else if (action === "affected")
  {
    const first = closureOrders.find((order) => order.date.startsWith(closureState.month) && closureAt(order.date));
    if (first)
    {
      closureNavigate({ date: first.date, view: "calendar" }, "#closure-date-detail h2");
      document.getElementById("closure-date-detail")?.scrollIntoView({ block: "nearest" });
    }
  }
  else if (action === "retry")
  {
    closureLoadState = "full";
    document.getElementById("closure-load-state").value = "full";
    renderClosurePage();
  }
  else
  {
    openClosureDialog(action, date || closureState.date);
  }
});

document.getElementById("closure-add").addEventListener("click", () => openClosureDialog("add", closureState.date));
document.getElementById("closure-profile").addEventListener("change", (event) =>
{
  closureNavigate({ role: event.target.value });
});
document.getElementById("closure-load-state").addEventListener("change", (event) =>
{
  closureLoadState = event.target.value;
  renderClosurePage();
});
document.addEventListener("keydown", (event) =>
{
  const day = event.target.closest(".closure-day");
  const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
  if (!day || !(event.key in offsets))
  {
    return;
  }
  event.preventDefault();
  const date = closureDate(day.dataset.date);
  date.setUTCDate(date.getUTCDate() + offsets[event.key]);
  const key = closureKey(date);
  closureNavigate({ date: key, month: key.slice(0, 7) }, `[data-date="${key}"]`);
});
window.addEventListener("beforeunload", (event) =>
{
  if (closureDirty || closureSaving)
  {
    event.preventDefault();
    event.returnValue = "";
  }
});
window.addEventListener("popstate", () =>
{
  closureState = readClosureState();
  renderClosurePage();
});
window.addEventListener("resize", closureUpdateScrollHint);
renderClosurePage();
setInterval(() =>
{
  const today = closureTodayKey();
  if (today !== closureRenderedToday)
  {
    closureRenderedToday = today;
    renderClosurePage();
  }
}, 60000);
