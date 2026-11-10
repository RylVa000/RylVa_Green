"use strict";

document.documentElement.classList.add("js");

const customerRoot = document.getElementById("customer-view");
const customerDialog = document.getElementById("customer-dialog");
let customerSaving = false;
let customerDraftDirty = false;
let customerDialogContext = null;
let customerLoadedState = "full";
let customerSequence = 10;
let customerState = readCustomerState();

function customerNode(tag, className = "", text = "")
{
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = String(text);
  return node;
}

function customerIcon(name)
{
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "icon icon--small");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(svg.namespaceURI, "use");
  use.setAttribute("href", `#i-${name}`);
  svg.append(use);
  return svg;
}

function customerButton(label, action, primary = false, data = {})
{
  const button = customerNode("button", `queue-button${primary ? " queue-button--primary" : ""}`, label);
  button.type = "button";
  button.dataset.customerAction = action;
  Object.assign(button.dataset, data);
  return button;
}

function customerBadge(label, tone = "neutral", icon = "info")
{
  const badge = customerNode("span", `queue-badge queue-badge--${tone} customer-badge`);
  badge.append(customerIcon(icon), customerNode("span", "", label));
  return badge;
}

function customerAccountBadge(customer)
{
  const styles =
  {
    active: ["success", "check"],
    unverified: ["warning", "clock"],
    suspended: ["critical", "alert"],
    inactive: ["neutral", "close"],
    anonymized: ["neutral", "info"]
  };
  return customerBadge(customerStatusLabels[customer.status], ...styles[customer.status]);
}

function customerNotice(text, tone = "info")
{
  const note = customerNode("div", `product-note product-note--${tone}`);
  note.append(customerIcon(tone === "warning" || tone === "critical" ? "alert" : "info"), customerNode("p", "", text));
  return note;
}

function customerMoney(amount)
{
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

function customerDate(value, time = false)
{
  return new Intl.DateTimeFormat("id-ID",
  {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
    ...(time ? { hour: "2-digit", minute: "2-digit" } : {})
  }).format(new Date(value));
}

function customerEmail(email)
{
  if (!email)
  {
    return "Email tidak tersedia";
  }
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}

function customerOwnOrders(id)
{
  return customerOrders.filter((order) => order.customerId === id);
}

function customerOpenNotes(id)
{
  return customerNotes.filter((note) => note.customerId === id && note.followup && !note.resolved);
}

function customerOpenCases(id)
{
  return customerCases.filter((entry) => entry.customerId === id && entry.open);
}

function customerAttention(id)
{
  return customerOpenCases(id).length + customerOpenNotes(id).length;
}

function customerNetPaid(id)
{
  return customerOwnOrders(id).reduce((sum, order) => sum + order.paid - order.refund, 0);
}

function customerIsRecent(customer)
{
  return customerOwnOrders(customer.id).some((order) => order.date >= "2026-10-06" && order.date <= "2026-11-04");
}

function readCustomerState()
{
  const params = new URLSearchParams(location.search);
  const allowed = (key, options, fallback) => options.includes(params.get(key)) ? params.get(key) : fallback;
  return {
    role: allowed("role", ["admin", "superadmin"], "admin"),
    customer: params.get("customer") || "",
    tab: allowed("tab", ["overview", "orders", "addresses", "notes", "activity"], "overview"),
    search: params.get("search") || "",
    segment: allowed("segment", ["all", "recent", "new", "attention"], "all"),
    status: allowed("status", ["all", ...Object.keys(customerStatusLabels)], "all"),
    sort: allowed("sort", ["attention", "name", "newest", "lastOrder"], "attention"),
    page: Math.max(1, Number.parseInt(params.get("page"), 10) || 1)
  };
}

function customerUrl()
{
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(customerState))
  {
    if (value !== "" && !(key === "page" && value === 1))
    {
      params.set(key, value);
    }
  }
  return `${location.pathname}?${params}`;
}

function customerActor()
{
  return customerState.role === "superadmin" ? "SuperAdmin RylVa" : "Admin RylVa";
}

function customerLog(id, label, detail)
{
  customerActivities.push({ customerId: id, label, detail, actor: customerActor(), at: new Date().toISOString() });
}

function customerFeedback(message, error = false)
{
  const feedback = document.getElementById("customer-feedback");
  feedback.replaceChildren(customerIcon(error ? "alert" : "check"), customerNode("span", "", message));
  feedback.hidden = false;
  feedback.classList.toggle("customer-feedback-error", error);
  feedback.focus();
}

function customerNavigate(changes, replace = false)
{
  if (customerDraftDirty && !window.confirm("Catatan belum disimpan. Tinggalkan perubahan ini?"))
  {
    return;
  }
  customerDraftDirty = false;
  Object.assign(customerState, changes);
  history[replace ? "replaceState" : "pushState"]({}, "", customerUrl());
  document.getElementById("customer-feedback").hidden = true;
  renderCustomers();
  const focusTarget = changes.tab
    ? customerRoot.querySelector('.customer-tabs [aria-current="page"]')
    : document.getElementById("main-content");
  focusTarget?.focus({ preventScroll: true });
}

function customerOrderLink(orderId, label = "Buka pesanan")
{
  const link = customerNode("a", "queue-button", label);
  link.href = `../staff/orders-queue.html?role=${customerState.role}&tab=all&order=${encodeURIComponent(orderId)}`;
  return link;
}

function customerField(label, control, help = "")
{
  const field = customerNode("div", "product-field");
  const caption = customerNode("label", "", label);
  caption.htmlFor = control.id;
  field.append(caption, control);
  if (help)
  {
    const hint = customerNode("p", "product-help", help);
    hint.id = `${control.id}-help`;
    control.setAttribute("aria-describedby", hint.id);
    field.append(hint);
  }
  return field;
}

function customerSelect(id, options, value)
{
  const select = customerNode("select");
  select.id = id;
  for (const [key, label] of options)
  {
    const option = customerNode("option", "", label);
    option.value = key;
    select.append(option);
  }
  select.value = value;
  return select;
}

function customerListData()
{
  const query = customerState.search.trim().toLocaleLowerCase("id");
  const digits = query.replace(/\D/g, "");
  const rows = (customerLoadedState === "empty" ? [] : customers).filter((customer) =>
  {
    const text = [
      customer.name,
      customer.id,
      customer.email,
      customer.phone,
      ...customerOwnOrders(customer.id).map((order) => order.id)
    ].join(" ").toLocaleLowerCase("id");
    const matchesSearch = !query || text.includes(query)
      || (digits.length >= 4 && customer.phone.replace(/\D/g, "").includes(digits));
    const matchesSegment = customerState.segment === "all"
      || (customerState.segment === "attention" && customerAttention(customer.id) > 0)
      || (customerState.segment === "new" && customer.joined >= "2026-10-06")
      || (customerState.segment === "recent" && customerIsRecent(customer));
    return matchesSearch && matchesSegment && (customerState.status === "all" || customer.status === customerState.status);
  });
  return rows.sort((left, right) =>
  {
    if (customerState.sort === "attention")
    {
      return customerAttention(right.id) - customerAttention(left.id) || left.name.localeCompare(right.name, "id");
    }
    if (customerState.sort === "newest")
    {
      return right.joined.localeCompare(left.joined);
    }
    if (customerState.sort === "lastOrder")
    {
      return (customerOwnOrders(right.id)[0]?.date || "").localeCompare(customerOwnOrders(left.id)[0]?.date || "");
    }
    return left.name.localeCompare(right.name, "id");
  });
}

function customerTable(headings, rows, className = "")
{
  const table = customerNode("table", `customer-table ${className}`);
  const caption = customerNode("caption", "sr-only", headings.join(", "));
  const head = customerNode("thead");
  const headRow = customerNode("tr");
  headings.forEach((heading) =>
  {
    const cell = customerNode("th", "", heading);
    cell.scope = "col";
    headRow.append(cell);
  });
  head.append(headRow);
  const body = customerNode("tbody");
  rows.forEach((cells) =>
  {
    const row = customerNode("tr");
    cells.forEach((content, index) =>
    {
      const cell = customerNode("td");
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

function customerIdentity(customer)
{
  const identity = customerNode("div", "customer-identity");
  const initials = customer.status === "anonymized" ? "—" : customer.name.split(" ").slice(0, 2).map((word) => word[0]).join("");
  const avatar = customerNode("span", "profile-avatar", initials);
  avatar.setAttribute("aria-hidden", "true");
  const text = customerNode("div");
  text.append(customerNode("strong", "", customer.name), customerNode("span", "secondary-text", customer.id));
  identity.append(avatar, text);
  return identity;
}

function customerEmpty(title, text, button = null)
{
  const section = customerNode("section", "customer-empty");
  section.append(customerIcon("info"), customerNode("h2", "", title), customerNode("p", "", text));
  if (button)
  {
    section.append(button);
  }
  return section;
}

function renderCustomerList()
{
  const summary = customerNode("section", "catalog-summary customer-summary");
  summary.setAttribute("aria-label", "Ringkasan pelanggan");
  const source = customerLoadedState === "empty" ? [] : customers;
  const segments =
  [
    ["all", "Semua pelanggan", source.length],
    ["recent", "Bertransaksi 30 hari", source.filter(customerIsRecent).length],
    ["new", "Pelanggan baru 30 hari", source.filter((customer) => customer.joined >= "2026-10-06").length],
    ["attention", "Perlu tindak lanjut", source.filter((customer) => customerAttention(customer.id) > 0).length]
  ];
  segments.forEach(([segment, label, count]) =>
  {
    const button = customerButton("", "segment", false, { segment });
    button.className = `queue-tab${segment === "attention" ? " customer-summary-attention" : ""}`;
    button.setAttribute("aria-pressed", String(customerState.segment === segment));
    button.append(customerNode("span", "", label), customerNode("strong", "", count));
    summary.append(button);
  });
  customerRoot.append(
    summary,
    customerNode(
      "p",
      "customer-period",
      "30 hari: 6 Okt–4 Nov 2026. Tindak lanjut dihitung dari penanganan pesanan dan catatan yang masih terbuka."
    )
  );
  const sheet = customerNode("section", "catalog-sheet customer-sheet");
  sheet.setAttribute("aria-label", "Daftar pelanggan");
  const toolbar = customerNode("div", "customer-toolbar");
  const search = customerNode("input");
  search.type = "search";
  search.id = "customer-search";
  search.placeholder = "Nama, kontak, atau nomor pesanan";
  search.value = customerState.search;
  toolbar.append(customerField("Cari pelanggan", search));
  const status = customerSelect(
    "customer-status-filter",
    [["all", "Semua status akun"], ...Object.entries(customerStatusLabels)],
    customerState.status
  );
  const sort = customerSelect(
    "customer-sort",
    [
      ["attention", "Tindak lanjut dahulu"],
      ["name", "Nama A–Z"],
      ["newest", "Terbaru bergabung"],
      ["lastOrder", "Pesanan terbaru"]
    ],
    customerState.sort
  );
  toolbar.append(customerField("Status akun", status), customerField("Urutkan", sort));
  sheet.append(toolbar);
  const filtered = customerListData();
  const totalPages = Math.max(1, Math.ceil(filtered.length / 5));
  customerState.page = Math.min(customerState.page, totalPages);
  const meta = customerNode("div", "customer-list-meta");
  const count = customerNode("p", "", `${filtered.length} pelanggan ditemukan`);
  count.setAttribute("role", "status");
  const clear = customerButton("Hapus filter", "clear");
  clear.className = "queue-text-button";
  clear.hidden = !customerState.search && customerState.status === "all" && customerState.segment === "all";
  meta.append(count, clear);
  sheet.append(meta);
  if (!filtered.length)
  {
    sheet.append(customerEmpty(
      source.length ? "Pelanggan tidak ditemukan" : "Belum ada pelanggan",
      source.length ? "Coba nama atau kontak lain, atau hapus filter." : "Pelanggan akan tercatat setelah melakukan registrasi akun.",
      source.length ? customerButton("Hapus filter", "clear") : null
    ));
  }
  else
  {
    const rows = filtered.slice((customerState.page - 1) * 5, customerState.page * 5).map((customer) =>
    {
      const contact = customerNode("div", "customer-stack");
      contact.append(
        customerNode("span", "", customer.phone || "Telepon belum tersedia"),
        customerNode("span", "secondary-text", customerEmail(customer.email))
      );
      const orders = customerOwnOrders(customer.id);
      const historyCell = customerNode("div", "customer-stack");
      historyCell.append(
        customerNode("strong", "", `${orders.length} pesanan`),
        customerNode("span", "secondary-text", orders.length ? customerDate(orders[0].date) : "Belum memesan")
      );
      const condition = customerNode("div", "customer-stack");
      condition.append(customerAccountBadge(customer));
      if (customerAttention(customer.id))
      {
        condition.append(customerBadge(`${customerAttention(customer.id)} tindak lanjut`, "warning", "alert"));
      }
      const money = customerNode("strong", "customer-money", customerMoney(customerNetPaid(customer.id)));
      const action = customerButton("Buka", "open", false, { id: customer.id });
      action.setAttribute("aria-label", `Buka pelanggan ${customer.name}`);
      action.append(customerIcon("chevron"));
      return [customerIdentity(customer), contact, historyCell, money, condition, action];
    });
    sheet.append(customerTable(
      ["Pelanggan", "Kontak", "Pesanan terakhir", "Pembayaran bersih", "Kondisi", "Tindakan"],
      rows,
      "customer-directory"
    ));
  }
  const pagination = customerNode("div", "customer-pagination");
  pagination.append(customerNode(
    "p",
    "",
    filtered.length ? `Menampilkan ${(customerState.page - 1) * 5 + 1}–${Math.min(customerState.page * 5, filtered.length)} dari ${filtered.length} pelanggan` : "0 pelanggan"
  ));
  const controls = customerNode("div", "customer-pagination-controls");
  const previous = customerButton("", "page", false, { page: customerState.page - 1 });
  previous.className = "icon-button";
  previous.setAttribute("aria-label", "Halaman sebelumnya");
  previous.append(customerIcon("chevron"));
  previous.disabled = customerState.page <= 1;
  const next = customerButton("", "page", false, { page: customerState.page + 1 });
  next.className = "icon-button";
  next.setAttribute("aria-label", "Halaman berikutnya");
  next.append(customerIcon("chevron"));
  next.disabled = customerState.page >= totalPages;
  controls.append(previous, customerNode("span", "tabular", `${customerState.page} dari ${totalPages}`), next);
  pagination.append(controls);
  sheet.append(pagination);
  customerRoot.append(
    sheet,
    customerNode(
      "p",
      "customer-period",
      "Pembayaran bersih = pembayaran berhasil dikurangi refund berhasil pada contoh transaksi. COD yang belum dibayar tidak dihitung."
    )
  );
  search.addEventListener("input", () =>
  {
    const position = search.selectionStart;
    customerState.search = search.value;
    customerState.page = 1;
    history.replaceState({}, "", customerUrl());
    renderCustomers();
    const replacement = document.getElementById("customer-search");
    replacement.focus();
    replacement.setSelectionRange(position, position);
  });
  status.addEventListener("change", () => customerNavigate({ status: status.value, page: 1 }));
  sort.addEventListener("change", () => customerNavigate({ sort: sort.value, page: 1 }));
}

function customerDataList(entries)
{
  const list = customerNode("dl", "customer-data-list");
  entries.forEach(([label, value]) =>
  {
    const group = customerNode("div");
    group.append(customerNode("dt", "", label), customerNode("dd", "", value));
    list.append(group);
  });
  return list;
}

function customerPanel(title, description = "")
{
  const section = customerNode("section", "product-panel customer-panel");
  section.append(customerNode("h2", "", title));
  if (description)
  {
    section.append(customerNode("p", "secondary-text", description));
  }
  return section;
}

function customerCaseList(customer, target)
{
  customerOpenCases(customer.id).forEach((entry) =>
  {
    const item = customerNode("article", "customer-case");
    item.append(
      customerBadge("Penanganan pesanan", "warning", "alert"),
      customerNode("h3", "", entry.title),
      customerNode("p", "", entry.description),
      customerNode("p", "secondary-text", `${entry.id} — Penanggung jawab: ${entry.owner}`),
      customerOrderLink(entry.orderId, "Buka penanganan pesanan")
    );
    target.append(item);
  });
}

function renderCustomerOverview(customer)
{
  const grid = customerNode("div", "customer-detail-grid");
  const profile = customerPanel("Informasi pelanggan", "Data profil dan alamat dikelola oleh pelanggan.");
  profile.append(customerDataList([
    ["ID pelanggan", customer.id],
    ["Nomor telepon", customer.phone || "Belum tersedia"],
    ["Email", customerEmail(customer.email)],
    ["Kota", customer.city || "Belum tersedia"],
    ["Bergabung", customerDate(customer.joined)],
    [
      "Verifikasi",
      customer.status === "unverified" ? "Belum terverifikasi" : customer.status === "anonymized" ? "Data dianonimkan" : "Email terverifikasi"
    ]
  ]));
  grid.append(profile);
  const work = customerPanel("Yang perlu ditindaklanjuti");
  customerCaseList(customer, work);
  const notes = customerOpenNotes(customer.id);
  notes.forEach((note) =>
  {
    const row = customerNode("article", "customer-case");
    row.append(
      customerBadge("Catatan terbuka", "info", "orders"),
      customerNode("p", "", note.text),
      customerButton("Lihat catatan", "tab", false, { tab: "notes" })
    );
    work.append(row);
  });
  if (!customerAttention(customer.id))
  {
    work.append(customerNotice("Tidak ada tindak lanjut yang masih terbuka.", "success"));
  }
  const order = customerOwnOrders(customer.id)[0];
  if (order)
  {
    const last = customerNode("div", "customer-latest");
    last.append(
      customerNode("h3", "", "Pesanan terakhir"),
      customerNode("p", "", order.id),
      customerNode("p", "secondary-text", `${order.item} — ${customerDate(order.date)}`),
      customerOrderLink(order.id)
    );
    work.append(last);
  }
  grid.append(work);
  customerRoot.append(grid);
}

function renderCustomerOrders(customer)
{
  const panel = customerPanel("Riwayat pesanan", "Status pesanan, pembayaran, dan pengiriman ditampilkan terpisah.");
  const orders = customerOwnOrders(customer.id);
  if (!orders.length)
  {
    panel.append(customerEmpty("Belum ada pesanan", "Pesanan akan muncul setelah pelanggan menyelesaikan checkout."));
  }
  else
  {
    const rows = orders.map((order) =>
    {
      const identity = customerNode("div", "customer-stack");
      identity.append(
        customerNode("strong", "", order.id),
        customerNode("span", "secondary-text", order.item),
        customerNode("span", "secondary-text", customerDate(order.date))
      );
      const payment = customerNode("div", "customer-stack");
      payment.append(
        customerBadge(
          order.payment,
          order.payment === "Berhasil" ? "success" : order.payment === "Menunggu" ? "info" : "warning",
          order.payment === "Berhasil" ? "check" : "clock"
        ),
        customerNode("span", "secondary-text", order.method)
      );
      return [
        identity,
        customerBadge(order.order, order.order === "Perlu Penanganan" ? "warning" : "info", "orders"),
        payment,
        customerBadge(
          order.shipping,
          order.shipping === "Terkirim" ? "success" : "neutral",
          order.shipping === "Terkirim" ? "check" : "clock"
        ),
        customerNode("strong", "customer-money", customerMoney(order.total)),
        customerOrderLink(order.id, "Buka")
      ];
    });
    panel.append(customerTable(
      ["Pesanan", "Status pesanan", "Pembayaran", "Pengiriman", "Total", "Tindakan"],
      rows,
      "customer-orders"
    ));
  }
  panel.append(customerNotice("Tautan membuka contoh pesanan di modul Antrean. Perubahan antarmodul belum tersinkronisasi."));
  customerRoot.append(panel);
}

function renderCustomerAddresses(customer)
{
  const section = customerPanel(
    "Alamat tersimpan",
    "Untuk kebutuhan operasional. Mengubah alamat akun tidak mengubah snapshot alamat pesanan lama."
  );
  const addresses = customerAddresses.filter((address) => address.customerId === customer.id);
  if (!addresses.length)
  {
    section.append(customerEmpty(
      "Belum ada alamat tersimpan",
      customer.status === "anonymized" ? "Alamat pribadi telah dihapus dari profil ini." : "Alamat akan tersedia setelah pelanggan menambahkannya."
    ));
  }
  addresses.forEach((address) =>
  {
    const item = customerNode("article", "customer-address");
    const heading = customerNode("div", "customer-inline");
    heading.append(customerNode("h3", "", address.label));
    if (address.primary)
    {
      heading.append(customerBadge("Alamat utama", "success", "check"));
    }
    item.append(heading, customerDataList([
      ["Penerima", address.recipient],
      ["Telepon penerima", address.phone],
      ["Alamat", `${address.street}, ${address.city}, ${address.postalCode}`],
      ["Petunjuk pengiriman", address.instructions]
    ]));
    section.append(item);
  });
  customerRoot.append(section);
}

function renderCustomerNotes(customer)
{
  const grid = customerNode("div", "customer-detail-grid");
  const history = customerPanel(
    "Catatan & penanganan",
    "Catatan internal membantu pergantian shift. Keputusan komplain tetap dilakukan pada pesanan terkait."
  );
  customerCaseList(customer, history);
  const notes = customerNotes.filter((note) => note.customerId === customer.id).slice().reverse();
  notes.forEach((note) =>
  {
    const article = customerNode("article", "customer-case");
    article.append(
      customerBadge(
        note.followup ? note.resolved ? "Sudah ditindaklanjuti" : "Perlu tindak lanjut" : "Catatan internal",
        note.followup && !note.resolved ? "warning" : note.resolved ? "success" : "neutral",
        note.resolved ? "check" : note.followup ? "alert" : "info"
      ),
      customerNode("p", "customer-note-text", note.text),
      customerNode("p", "secondary-text", `${note.actor} — ${customerDate(note.at, true)} WIB`)
    );
    if (note.followup && !note.resolved)
    {
      article.append(customerButton("Catat hasil tindak lanjut", "resolve", false, { note: note.id }));
    }
    if (note.resolution)
    {
      article.append(customerNode("p", "", `Hasil: ${note.resolution}`));
    }
    history.append(article);
  });
  if (!notes.length && !customerOpenCases(customer.id).length)
  {
    history.append(customerEmpty("Belum ada catatan", "Catat informasi yang diperlukan untuk penanganan pelanggan."));
  }
  grid.append(history);
  const entry = customerPanel("Tambah catatan");
  if (customer.status === "anonymized")
  {
    entry.append(customerNotice("Profil telah dianonimkan. Penambahan catatan pribadi dinonaktifkan."));
  }
  else
  {
    const form = customerNode("form", "customer-note-form");
    form.noValidate = true;
    const text = customerNode("textarea");
    text.id = "customer-note-text";
    text.name = "note";
    text.maxLength = 1000;
    text.rows = 6;
    const checkLabel = customerNode("label", "product-check");
    const check = customerNode("input");
    check.type = "checkbox";
    check.name = "followup";
    checkLabel.append(check, customerNode("span", "", "Tandai perlu tindak lanjut"));
    const counter = customerNode("p", "product-help", "0/1.000 karakter");
    const error = customerNode("p", "customer-form-error");
    error.setAttribute("role", "alert");
    error.hidden = true;
    error.id = "customer-note-error";
    form.append(
      customerField("Catatan operasional (wajib)", text, "5–1.000 karakter. Hindari data pribadi yang tidak diperlukan."),
      counter,
      checkLabel,
      error
    );
    text.setAttribute("aria-describedby", `${text.id}-help ${error.id}`);
    const submit = customerNode("button", "queue-button queue-button--primary", "Simpan catatan");
    submit.type = "submit";
    form.append(submit);
    text.addEventListener("input", () =>
    {
      customerDraftDirty = Boolean(text.value.trim());
      counter.textContent = `${text.value.length}/1.000 karakter`;
      text.removeAttribute("aria-invalid");
      error.hidden = true;
    });
    check.addEventListener("change", () => customerDraftDirty = true);
    form.addEventListener("submit", async (event) =>
    {
      event.preventDefault();
      const value = text.value.trim();
      if (value.length < 5 || value.length > 1000)
      {
        error.textContent = "Tulis catatan antara 5 dan 1.000 karakter.";
        error.hidden = false;
        text.setAttribute("aria-invalid", "true");
        text.focus();
        return;
      }
      const result = await customerCommit(form, () =>
      {
        if (customer.status === "anonymized")
        {
          throw new Error("Profil sudah dianonimkan. Catatan tidak dapat ditambahkan.");
        }
        customerNotes.push({
          id: `CT-${++customerSequence}`,
          customerId: customer.id,
          text: value,
          followup: check.checked,
          resolved: false,
          actor: customerActor(),
          at: new Date().toISOString()
        });
        customerLog(
          customer.id,
          "Catatan operasional ditambahkan",
          check.checked ? "Ditandai untuk tindak lanjut." : "Catatan internal."
        );
      });
      if (result)
      {
        customerDraftDirty = false;
        renderCustomers();
        customerFeedback("Catatan tersimpan pada pratinjau ini.");
      }
    });
    entry.append(form);
  }
  grid.append(entry);
  customerRoot.append(grid);
}

function renderCustomerActivity(customer)
{
  const section = customerPanel(
    "Aktivitas pelanggan",
    customerState.role === "superadmin" ? "Aktivitas operasional lokal semua profil staf." : "Menampilkan aktivitas milik profil Admin ini. Audit penuh khusus SuperAdmin."
  );
  const events = customerActivities.filter((entry) =>
  {
    return entry.customerId === customer.id
      && (customerState.role === "superadmin" || entry.actor === customerActor());
  }).slice().reverse();
  if (!events.length)
  {
    section.append(customerEmpty(
      "Belum ada aktivitas yang dapat ditampilkan",
      "Aktivitas baru akan tercatat setelah tindakan dilakukan."
    ));
  }
  const list = customerNode("ol", "customer-activity");
  events.forEach((entry) =>
  {
    const row = customerNode("li");
    row.append(
      customerIcon("check"),
      customerNode("strong", "", entry.label),
      customerNode("p", "", entry.detail),
      customerNode("span", "secondary-text", `${entry.actor} — ${customerDate(entry.at, true)} WIB`)
    );
    list.append(row);
  });
  section.append(list);
  customerRoot.append(section);
}

function revealCustomerActiveTab()
{
  const tabs = customerRoot.querySelector(".customer-tabs");
  const activeTab = tabs?.querySelector('[aria-current="page"]');
  if (!activeTab)
  {
    return;
  }
  const tabBounds = activeTab.getBoundingClientRect();
  const navBounds = tabs.getBoundingClientRect();
  if (tabBounds.right > navBounds.right)
  {
    tabs.scrollLeft += tabBounds.right - navBounds.right;
  }
  else if (tabBounds.left < navBounds.left)
  {
    tabs.scrollLeft -= navBounds.left - tabBounds.left;
  }
}

function renderCustomerDetail(customer)
{
  const hero = customerNode("section", "customer-detail-heading");
  hero.setAttribute("aria-label", "Identitas dan kondisi pelanggan");
  hero.append(customerIdentity(customer));
  const statuses = customerNode("div", "customer-inline");
  statuses.append(customerAccountBadge(customer));
  const active = customerOwnOrders(customer.id).filter((order) => order.active).length;
  if (active)
  {
    statuses.append(customerBadge(`${active} pesanan aktif`, "info", "orders"));
  }
  if (customerAttention(customer.id))
  {
    statuses.append(customerBadge(`${customerAttention(customer.id)} tindak lanjut`, "warning", "alert"));
  }
  if (customer.deletionRequested)
  {
    statuses.append(customerBadge("Permintaan penghapusan data", "warning", "info"));
  }
  hero.append(statuses);
  const actions = customerNode("div", "customer-inline");
  if (["active", "unverified", "suspended"].includes(customer.status))
  {
    actions.append(customerButton("Nonaktifkan sementara", "deactivate", false, { id: customer.id }));
  }
  if (customerState.role === "superadmin" && ["inactive", "suspended"].includes(customer.status))
  {
    actions.append(customerButton("Aktifkan kembali", "reactivate", false, { id: customer.id }));
  }
  if (customerState.role === "superadmin" && customer.status !== "anonymized")
  {
    actions.append(customerButton("Tinjau anonimisasi", "anonymize", false, { id: customer.id }));
  }
  hero.append(actions);
  customerRoot.append(hero);
  if (customer.status === "inactive")
  {
    customerRoot.append(customerNotice(
      "Akun dinonaktifkan sementara. Pesanan yang sudah dibuat tetap perlu ditangani. Pengaktifan kembali hanya oleh SuperAdmin.",
      "warning"
    ));
  }
  const tabs = customerNode("nav", "product-detail-tabs customer-tabs");
  tabs.setAttribute("aria-label", "Bagian detail pelanggan");
  [
    ["overview", "Ringkasan"],
    ["orders", "Pesanan"],
    ["addresses", "Alamat"],
    ["notes", "Catatan & penanganan"],
    ["activity", "Aktivitas"]
  ].forEach(([tab, label]) =>
  {
    const button = customerButton(label, "tab", false, { tab });
    button.className = "";
    if (customerState.tab === tab)
    {
      button.setAttribute("aria-current", "page");
    }
    tabs.append(button);
  });
  customerRoot.append(tabs);
  requestAnimationFrame(revealCustomerActiveTab);
  const renderers = {
    overview: renderCustomerOverview,
    orders: renderCustomerOrders,
    addresses: renderCustomerAddresses,
    notes: renderCustomerNotes,
    activity: renderCustomerActivity
  };
  renderers[customerState.tab](customer);
}

function renderCustomers()
{
  customerRoot.replaceChildren();
  const selected = customers.find((customer) => customer.id === customerState.customer);
  const detail = Boolean(customerState.customer);
  document.getElementById("customer-title").textContent = detail ? selected?.name || "Pelanggan tidak ditemukan" : "Pelanggan";
  document.getElementById("customer-subtitle").textContent = detail
    ? "Periksa informasi, pesanan, dan tindak lanjut pelanggan."
    : "Temukan pelanggan dan tindak lanjuti kebutuhan pesanannya.";
  const headingActions = document.getElementById("customer-heading-actions");
  headingActions.replaceChildren();
  if (!detail && customerState.role === "superadmin")
  {
    headingActions.append(customerButton("Ekspor hasil filter", "export"));
  }
  const breadcrumb = document.getElementById("customer-breadcrumb");
  breadcrumb.replaceChildren();
  const home = customerNode("a", "", "Ruang kerja");
  home.href = `../staff/admin-dashboard.html?role=${customerState.role}`;
  breadcrumb.append(home, customerNode("span", "", "/"));
  if (detail)
  {
    const back = customerNode("a", "", "Pelanggan");
    const url = new URL(customerUrl(), location.href);
    url.searchParams.delete("customer");
    url.searchParams.delete("tab");
    back.href = url.href;
    back.dataset.customerAction = "back";
    breadcrumb.append(back, customerNode("span", "", "/"));
  }
  const current = customerNode("span", "", detail ? selected?.name || "Tidak ditemukan" : "Pelanggan");
  current.setAttribute("aria-current", "page");
  breadcrumb.append(current);
  document.getElementById("profile-name").textContent = customerActor();
  document.getElementById("preview-role").textContent = `Pratinjau ${customerState.role === "superadmin" ? "SuperAdmin" : "Admin"}`;
  document.getElementById("customer-profile").value = customerState.role;
  document.querySelectorAll("[data-superadmin-only]").forEach((node) => node.hidden = customerState.role !== "superadmin");
  document.querySelectorAll("[data-role-link]").forEach((link) =>
  {
    const target = new URL(link.href, location.href);
    target.searchParams.set("role", customerState.role);
    link.href = target.href;
  });
  if (detail)
  {
    const backButton = customerButton("Kembali ke pelanggan", "back");
    backButton.className = "queue-text-button back-button";
    backButton.prepend(customerIcon("chevron"));
    customerRoot.append(backButton);
  }
  if (["loading", "error"].includes(customerLoadedState))
  {
    const loading = customerLoadedState === "loading";
    const state = customerEmpty(
      loading ? "Memuat pelanggan…" : "Data pelanggan gagal dimuat",
      loading ? "Daftar sedang disiapkan. Anda dapat memuat ulang data contoh." : "Data belum dapat ditampilkan. Coba muat ulang.",
      customerButton(loading ? "Muat ulang data" : "Coba lagi", "retry")
    );
    state.setAttribute("role", loading ? "status" : "alert");
    customerRoot.append(state);
  }
  else if (detail && (!selected || customerLoadedState === "empty"))
  {
    customerRoot.append(customerEmpty(
      "Pelanggan tidak ditemukan",
      "Referensi pelanggan tidak tersedia pada pratinjau ini.",
      customerButton("Kembali ke daftar", "back")
    ));
  }
  else if (detail)
  {
    renderCustomerDetail(selected);
  }
  else
  {
    renderCustomerList();
  }
}

async function customerCommit(container, mutation)
{
  if (customerSaving)
  {
    return false;
  }
  customerSaving = true;
  container.setAttribute("aria-busy", "true");
  const controls = [...container.querySelectorAll("button, input, textarea, select")];
  const disabled = controls.map((control) => control.disabled);
  controls.forEach((control) => control.disabled = true);
  try
  {
    await new Promise((resolve) => setTimeout(resolve, 220));
    const fail = document.getElementById("customer-fail-save");
    if (fail.checked)
    {
      fail.checked = false;
      throw new Error("Gagal menyimpan. Isian tetap tersimpan di formulir; coba lagi.");
    }
    mutation();
    return true;
  }
  catch (error)
  {
    const scope = container.querySelector(".customer-save-error") || customerNode("p", "customer-form-error customer-save-error");
    scope.setAttribute("role", "alert");
    scope.tabIndex = -1;
    scope.textContent = error.message;
    container.append(scope);
    scope.focus();
    return false;
  }
  finally
  {
    customerSaving = false;
    container.removeAttribute("aria-busy");
    controls.forEach((control, index) => control.disabled = disabled[index]);
  }
}

function customerAnonymizeBlocks(customer)
{
  const reasons = [];
  if (customerOwnOrders(customer.id).some((order) => order.active))
  {
    reasons.push("Masih ada pesanan aktif.");
  }
  if (customerOpenCases(customer.id).length || customerOpenNotes(customer.id).length)
  {
    reasons.push("Masih ada penanganan atau tindak lanjut terbuka.");
  }
  if (customer.refundPending)
  {
    reasons.push("Refund masih berjalan.");
  }
  if (customer.legalHold)
  {
    reasons.push("Data sedang dalam penahanan retensi.");
  }
  if (!customer.deletionRequested)
  {
    reasons.push("Belum ada permintaan penghapusan yang tercatat. Aturan akun tidak aktif belum dievaluasi di prototipe ini.");
  }
  return reasons;
}

function openCustomerDialog(action, id = "")
{
  const selected = customers.find((customer) => customer.id === (id || customerState.customer));
  const note = customerNotes.find((entry) => entry.id === id);
  const titles =
  {
    deactivate: "Nonaktifkan sementara akun?",
    reactivate: "Aktifkan kembali akun?",
    anonymize: "Tinjau anonimisasi pelanggan",
    resolve: "Catat hasil tindak lanjut",
    export: "Ekspor data pelanggan"
  };
  const body = document.getElementById("customer-dialog-body");
  body.replaceChildren();
  customerDialogContext = { action, customer: selected, note, trigger: document.activeElement, role: customerState.role };
  document.getElementById("customer-dialog-title").textContent = titles[action];
  const submit = document.getElementById("customer-dialog-submit");
  submit.hidden = false;
  submit.textContent = action === "export" ? "Unduh CSV" : action === "anonymize" ? "Anonimkan profil" : "Konfirmasi";
  const messages =
  {
    deactivate: "Pelanggan tidak dapat login. Pesanan aktif dan riwayat transaksi tetap perlu ditangani. Pencabutan sesi nyata memerlukan integrasi server.",
    reactivate: "Akun dapat digunakan kembali sesuai status verifikasi sebelumnya. Tindakan khusus SuperAdmin.",
    anonymize: "Profil, kontak, alamat, dan catatan pribadi akan dianonimkan. "
      + "Referensi transaksi dan audit dipertahankan sesuai retensi. "
      + "Tindakan ini tidak dapat dibatalkan pada pratinjau.",
    resolve: "Catat hasil penanganan catatan ini. Tindakan ini tidak menyelesaikan komplain atau status pesanan.",
    export: `${customerListData().length} pelanggan sesuai filter akan diekspor. Berkas berisi identitas operasional dan email tersamarkan; tindakan dicatat pada aktivitas lokal.`
  };
  body.append(customerNode("p", "", messages[action]));
  if (action === "anonymize")
  {
    const blocks = customerAnonymizeBlocks(selected);
    if (blocks.length)
    {
      blocks.forEach((reason) => body.append(customerNotice(reason, "warning")));
      submit.hidden = true;
      customerDialog.showModal();
      document.getElementById("customer-dialog-cancel").focus();
      return;
    }
  }
  if (action === "export" && !customerListData().length)
  {
    body.append(customerNotice("Tidak ada hasil filter untuk diekspor."));
    submit.hidden = true;
  }
  const reason = customerNode("textarea");
  reason.id = "customer-action-reason";
  reason.rows = 3;
  reason.maxLength = 500;
  body.append(customerField(
    action === "resolve" ? "Hasil tindak lanjut (wajib)" : "Alasan tindakan (wajib)",
    reason,
    "5–500 karakter. Tercatat bersama pelaku dan waktu."
  ));
  if (["reactivate", "anonymize", "export"].includes(action))
  {
    const mfa = customerNode("input");
    mfa.id = "customer-action-mfa";
    mfa.inputMode = "numeric";
    mfa.autocomplete = "off";
    mfa.maxLength = 6;
    body.append(customerField(
      "Verifikasi staf (simulasi)",
      mfa,
      "Gunakan 123456 untuk pratinjau. Ini bukan autentikasi atau MFA nyata."
    ));
  }
  if (action === "anonymize")
  {
    const confirm = customerNode("input");
    confirm.id = "customer-action-phrase";
    confirm.autocomplete = "off";
    body.append(customerField("Ketik ANONIMKAN untuk melanjutkan", confirm));
  }
  customerDialog.showModal();
  reason.focus();
}

function customerDownload()
{
  const rows = customerListData();
  const csvCell = (value) =>
  {
    let safe = String(value);
    if (/^[=+@\-\t\r]/.test(safe))
    {
      safe = `'${safe}`;
    }
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const data = [
    ["ID pelanggan", "Nama", "Telepon", "Email tersamarkan", "Status akun", "Jumlah pesanan", "Pembayaran bersih IDR"],
    ...rows.map((customer) => [
      customer.id,
      customer.name,
      customer.phone,
      customerEmail(customer.email),
      customerStatusLabels[customer.status],
      customerOwnOrders(customer.id).length,
      customerNetPaid(customer.id)
    ])
  ];
  const blob = new Blob(
    ["\ufeff", data.map((row) => row.map(csvCell).join(",")).join("\r\n")],
    { type: "text/csv;charset=utf-8" }
  );
  const url = URL.createObjectURL(blob);
  const link = customerNode("a");
  link.href = url;
  link.download = "rylva-pelanggan-pratinjau.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return rows;
}

document.getElementById("customer-dialog-form").addEventListener("submit", async (event) =>
{
  event.preventDefault();
  if (document.getElementById("customer-dialog-submit").hidden || !customerDialogContext)
  {
    return;
  }
  const context = customerDialogContext;
  const form = event.currentTarget;
  form.querySelector(".customer-save-error")?.remove();
  const reason = document.getElementById("customer-action-reason");
  const mfa = document.getElementById("customer-action-mfa");
  const phrase = document.getElementById("customer-action-phrase");
  const invalid = !reason || reason.value.trim().length < 5 ? reason : mfa && mfa.value !== "123456" ? mfa : phrase && phrase.value !== "ANONIMKAN" ? phrase : null;
  if (invalid)
  {
    const error = customerNode(
      "p",
      "customer-form-error customer-save-error",
      invalid === reason ? "Tulis alasan atau hasil minimal 5 karakter." : invalid === mfa ? "Kode simulasi harus 123456." : "Ketik ANONIMKAN persis untuk mengonfirmasi."
    );
    error.id = "customer-dialog-error";
    error.setAttribute("role", "alert");
    form.append(error);
    invalid.setAttribute("aria-invalid", "true");
    invalid.setAttribute("aria-describedby", error.id);
    invalid.focus();
    return;
  }
  const explanation = reason.value.trim();
  const saved = await customerCommit(form, () =>
  {
    const { action, customer, note } = context;
    if (customerState.role !== context.role || (["reactivate", "anonymize", "export"].includes(action) && customerState.role !== "superadmin"))
    {
      throw new Error("Profil ini tidak berwenang menjalankan tindakan tersebut.");
    }
    if (action === "deactivate")
    {
      if (!["active", "unverified", "suspended"].includes(customer.status))
      {
        throw new Error("Status akun sudah berubah. Muat ulang detail pelanggan.");
      }
      customer.previousStatus = customer.status;
      customer.status = "inactive";
      customerLog(customer.id, "Akun dinonaktifkan sementara", explanation);
    }
    else if (action === "reactivate")
    {
      if (!["inactive", "suspended"].includes(customer.status))
      {
        throw new Error("Akun ini tidak dapat diaktifkan kembali.");
      }
      customer.status = customer.previousStatus === "unverified" ? "unverified" : "active";
      customerLog(customer.id, "Akun diaktifkan kembali", explanation);
    }
    else if (action === "resolve")
    {
      if (!note || note.resolved)
      {
        throw new Error("Tindak lanjut sudah diselesaikan.");
      }
      note.resolved = true;
      note.resolution = explanation;
      customerLog(note.customerId, "Tindak lanjut catatan diselesaikan", explanation);
    }
    else if (action === "anonymize")
    {
      if (customer.status === "anonymized" || customerAnonymizeBlocks(customer).length)
      {
        throw new Error("Kondisi pelanggan berubah. Anonimisasi diblokir.");
      }
      customer.status = "anonymized";
      customer.name = "Pelanggan dianonimkan";
      customer.phone = "";
      customer.email = "";
      customer.city = "";
      customer.deletionRequested = false;
      for (let index = customerAddresses.length - 1; index >= 0; index--)
      {
        if (customerAddresses[index].customerId === customer.id)
        {
          customerAddresses.splice(index, 1);
        }
      }
      customerNotes.filter((entry) => entry.customerId === customer.id).forEach((entry) => entry.text = "Catatan dianonimkan.");
      customerLog(customer.id, "Profil pelanggan dianonimkan", explanation);
    }
    else if (action === "export")
    {
      const rows = customerDownload();
      rows.forEach((entry) => customerLog(entry.id, "Data operasional diekspor", explanation));
    }
  });
  if (saved)
  {
    customerDialog.close();
    renderCustomers();
    customerFeedback("Tindakan selesai dan tercatat pada aktivitas pratinjau.");
  }
});

document.getElementById("customer-dialog-cancel").addEventListener("click", () => customerDialog.close());
customerDialog.addEventListener("cancel", (event) =>
{
  if (customerSaving)
  {
    event.preventDefault();
  }
});
customerDialog.addEventListener("close", () =>
{
  if (customerDialogContext?.trigger?.isConnected)
  {
    customerDialogContext.trigger.focus();
  }
});

document.addEventListener("click", (event) =>
{
  const button = event.target.closest("[data-customer-action]");
  if (!button || customerSaving)
  {
    return;
  }
  event.preventDefault();
  const action = button.dataset.customerAction;
  if (action === "segment")
  {
    customerNavigate({ segment: button.dataset.segment, page: 1 });
  }
  else if (action === "clear")
  {
    customerNavigate({ segment: "all", status: "all", search: "", page: 1 });
  }
  else if (action === "page")
  {
    customerNavigate({ page: Number(button.dataset.page) });
  }
  else if (action === "open")
  {
    customerLog(button.dataset.id, "Data operasional pelanggan diakses", "Detail pelanggan dibuka untuk operasional.");
    customerNavigate({ customer: button.dataset.id, tab: "overview" });
  }
  else if (action === "back")
  {
    customerNavigate({ customer: "", tab: "overview" });
  }
  else if (action === "tab")
  {
    customerNavigate({ tab: button.dataset.tab });
  }
  else if (action === "retry")
  {
    customerLoadedState = "full";
    document.getElementById("customer-load-state").value = "full";
    renderCustomers();
  }
  else
  {
    openCustomerDialog(action, button.dataset.id || button.dataset.note || "");
  }
});

document.getElementById("customer-profile").addEventListener("change", (event) =>
{
  customerNavigate({ role: event.target.value });
  event.target.value = customerState.role;
});
document.getElementById("customer-load-state").addEventListener("change", (event) =>
{
  if (customerDraftDirty && !window.confirm("Tinggalkan catatan yang belum disimpan?"))
  {
    event.target.value = customerLoadedState;
    return;
  }
  customerDraftDirty = false;
  customerLoadedState = event.target.value;
  renderCustomers();
});
window.addEventListener("beforeunload", (event) =>
{
  if (customerDraftDirty || customerSaving)
  {
    event.preventDefault();
    event.returnValue = "";
  }
});
window.addEventListener("popstate", () =>
{
  if (customerDraftDirty && !window.confirm("Tinggalkan catatan yang belum disimpan?"))
  {
    history.pushState({}, "", customerUrl());
    return;
  }
  customerDraftDirty = false;
  customerState = readCustomerState();
  renderCustomers();
});
renderCustomers();
document.fonts.ready.then(revealCustomerActiveTab);
window.addEventListener("resize", revealCustomerActiveTab);
