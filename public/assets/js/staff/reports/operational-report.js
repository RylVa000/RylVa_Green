"use strict";

(() =>
{
  const root = document.getElementById("report-root");
  const fixture = window.operationalReportFixture;
  const profile = document.getElementById("report-profile");
  const loadSelect = document.getElementById("report-load");
  const params = new URLSearchParams(location.search);
  const tabs =
  [
    ["overview", "Ringkasan"],
    ["orders", "Pesanan"],
    ["products", "Produk terlaris"],
    ["stock", "Stok & bahan"],
    ["shipping", "Pengiriman"]
  ];
  const orderLabels =
  {
    waiting: "Menunggu Pembayaran",
    ready: "Siap Diproses",
    preparing: "Sedang Disiapkan",
    shipping: "Dikirim",
    delivered: "Terkirim",
    complete: "Selesai",
    cancelled: "Dibatalkan",
    attention: "Perlu Penanganan"
  };
  const shippingLabels =
  {
    pending: "Belum Diserahkan",
    shipping: "Dalam Pengiriman",
    issue: "Terkendala",
    delivered: "Terkirim",
    returned: "Dikembalikan"
  };
  const stockLabels = { produk: "Stok produk", bahan: "Bahan produksi", movements: "Riwayat mutasi" };
  const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || "")
    && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));
  const initialStart = validDate(params.get("start")) ? params.get("start") : "2026-10-30";
  const initialEnd = validDate(params.get("end")) ? params.get("end") : "2026-11-05";
  const state =
  {
    role: params.get("role") === "superadmin" ? "superadmin" : "admin",
    tab: tabs.some(([key]) => key === params.get("tab")) ? params.get("tab") : "overview",
    start: initialStart <= initialEnd ? initialStart : "2026-10-30",
    end: initialStart <= initialEnd ? initialEnd : "2026-11-05",
    period: ["today", "7", "30", "month", "custom"].includes(params.get("period"))
      ? params.get("period") : "7",
    stock: stockLabels[params.get("stock")] ? params.get("stock") : "produk",
    query: params.get("q") || "",
    filter: params.get("filter") || "all",
    orderBasis: params.get("basis") === "delivery" ? "delivery" : "created",
    location: ["Gudang Pusat", "Etalase Toko"].includes(params.get("location")) ? params.get("location") : "all",
    sort: ["recent", "oldest", "name"].includes(params.get("sort")) ? params.get("sort") : "recent",
    page: Math.max(1, Number.parseInt(params.get("page"), 10) || 1),
    load: "full"
  };
  const pageSize = 5;

  if (!root || !fixture || !profile || !loadSelect)
  {
    return;
  }

  function node(tag, className, value)
  {
    const element = document.createElement(tag);
    if (className)
    {
      element.className = className;
    }
    if (value !== undefined)
    {
      element.textContent = String(value);
    }
    return element;
  }

  function icon(name)
  {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    svg.setAttribute("class", "icon icon--small");
    svg.setAttribute("aria-hidden", "true");
    use.setAttribute("href", `#i-${name}`);
    svg.append(use);
    return svg;
  }

  function button(label, action, className = "queue-button")
  {
    const element = node("button", className, label);
    element.type = "button";
    element.dataset.reportAction = action;
    return element;
  }

  function link(label, path, className = "report-link")
  {
    const element = node("a", className, label);
    const url = new URL(path, location.href);
    url.searchParams.set("role", state.role);
    element.href = url.href;
    return element;
  }

  function badge(text, tone = "info")
  {
    return node("span", `queue-badge queue-badge--${tone}`, text);
  }

  function statusBadge(key, labels)
  {
    const urgent = ["attention", "issue", "returned", "empty", "low"].includes(key);
    const positive = ["complete", "delivered", "available"].includes(key);
    return badge(labels[key] || key, urgent ? "warning" : positive ? "success" : "info");
  }

  function displayDate(value)
  {
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
      .format(new Date(`${value}T12:00:00Z`));
  }

  function inPeriod(value)
  {
    return value >= state.start && value <= state.end;
  }

  function withinOrders(key = "created")
  {
    return fixture.orders.filter((order) => inPeriod(order[key]));
  }

  function stockCondition(item)
  {
    const available = item.balance - item.held;
    if (available <= 0)
    {
      return "empty";
    }
    return available <= item.minimum ? "low" : "available";
  }

  function writeUrl(push = false)
  {
    const url = new URL(location.href);
    url.search = "";
    url.searchParams.set("role", state.role);
    if (state.tab !== "overview")
    {
      url.searchParams.set("tab", state.tab);
    }
    url.searchParams.set("start", state.start);
    url.searchParams.set("end", state.end);
    url.searchParams.set("period", state.period);
    if (state.stock !== "produk")
    {
      url.searchParams.set("stock", state.stock);
    }
    if (state.query)
    {
      url.searchParams.set("q", state.query);
    }
    if (state.filter !== "all")
    {
      url.searchParams.set("filter", state.filter);
    }
    if (state.orderBasis !== "created")
    {
      url.searchParams.set("basis", state.orderBasis);
    }
    if (state.location !== "all")
    {
      url.searchParams.set("location", state.location);
    }
    if (state.sort !== "recent")
    {
      url.searchParams.set("sort", state.sort);
    }
    if (state.page > 1)
    {
      url.searchParams.set("page", String(state.page));
    }
    history[push ? "pushState" : "replaceState"](null, "", url);
  }

  function updateRole()
  {
    const superadmin = state.role === "superadmin";
    document.getElementById("profile-name").textContent = superadmin ? "SuperAdmin RylVa" : "Admin RylVa";
    document.getElementById("preview-role").textContent = superadmin ? "Pratinjau SuperAdmin" : "Pratinjau Admin";
    document.querySelectorAll(".report-avatar").forEach((avatar) =>
    {
      avatar.textContent = superadmin ? "SA" : "AD";
    });
    document.querySelectorAll("[data-superadmin-only]").forEach((element) =>
    {
      element.hidden = !superadmin;
    });
    document.querySelectorAll("[data-role-link]").forEach((element) =>
    {
      const url = new URL(element.getAttribute("href"), location.href);
      url.searchParams.set("role", state.role);
      element.href = url.href;
    });
    profile.value = state.role;
    loadSelect.value = state.load;
  }

  function labeledField(label, id, control)
  {
    const wrapper = node("div", "report-field");
    const labelElement = node("label", "", label);
    labelElement.htmlFor = id;
    control.id = id;
    wrapper.append(labelElement, control);
    return wrapper;
  }

  function select(options, value)
  {
    const element = document.createElement("select");
    options.forEach(([key, label]) =>
    {
      const option = node("option", "", label);
      option.value = key;
      element.append(option);
    });
    element.value = value;
    return element;
  }

  function renderHeader()
  {
    const heading = node("div", "report-heading");
    const copy = node("div");
    copy.append(node("h1", "", "Laporan Operasional"));
    copy.append(node("p", "", "Pantau pesanan, produk, persediaan, dan pengiriman."));
    const refresh = button("Muat ulang", "reload");
    heading.append(copy, refresh);
    root.append(heading);
    const note = node("p", "report-note");
    note.append(
      icon("info"),
      node("span", "", "Pratinjau data contoh. Angka dan tautan modul belum tersinkron satu sama lain.")
    );
    root.append(note);
    root.append(node("p", "report-muted report-export-note", "Ekspor belum tersedia dalam pratinjau."));
    const nav = node("nav", "product-detail-tabs report-tabs");
    nav.setAttribute("aria-label", "Bagian laporan operasional");
    tabs.forEach(([key, label]) =>
    {
      const tab = button(label, "tab", "");
      tab.className = "";
      tab.dataset.tab = key;
      if (state.tab === key)
      {
        tab.setAttribute("aria-current", "page");
      }
      nav.append(tab);
    });
    root.append(nav);
    root.append(node("p", "report-tabs-hint", "Geser untuk melihat bagian laporan lainnya."));
    requestAnimationFrame(() =>
    {
      const active = nav.querySelector('[aria-current="page"]');
      if (active)
      {
        nav.scrollLeft = Math.max(0, active.offsetLeft - nav.offsetLeft - 12);
      }
    });
    renderPeriod();
  }

  function renderPeriod()
  {
    const controls = node("form", "report-controls");
    controls.id = "report-period-form";
    controls.noValidate = true;
    const period = select(
    [
      ["today", "Hari ini"], ["7", "7 hari terakhir"], ["30", "30 hari terakhir"],
      ["month", "Bulan ini"], ["custom", "Rentang khusus"]
    ], state.period);
    controls.append(labeledField("Periode contoh", "report-period", period));
    const start = document.createElement("input");
    start.type = "date";
    start.value = state.start;
    start.setAttribute("aria-describedby", "report-period-error");
    const end = document.createElement("input");
    end.type = "date";
    end.value = state.end;
    end.setAttribute("aria-describedby", "report-period-error");
    const startField = labeledField("Tanggal awal", "report-start", start);
    const endField = labeledField("Tanggal akhir", "report-end", end);
    startField.hidden = state.period !== "custom";
    endField.hidden = state.period !== "custom";
    controls.append(startField, endField);
    controls.append(button("Reset periode", "reset-period"));
    const error = node("p", "report-error");
    error.id = "report-period-error";
    error.setAttribute("role", "alert");
    controls.append(error);
    root.append(controls);
    root.append(node("p", "report-update",
      `Periode: ${displayDate(state.start)} – ${displayDate(state.end)}. Snapshot contoh: ${displayDate(fixture.snapshot)} WIB.`));
  }

  function sectionHead(title, description, action, tab)
  {
    const head = node("div", "report-section-head");
    head.append(node("h2", "", title));
    if (action)
    {
      const view = button(action, "tab", "queue-text-button");
      view.dataset.tab = tab;
      head.append(view);
    }
    head.append(node("p", "", description));
    return head;
  }

  function metrics(items)
  {
    const container = node("div", "report-metrics");
    items.forEach(([label, value, note]) =>
    {
      const item = node("div", "catalog-stat report-metric");
      item.append(node("span", "", label), node("strong", "", value), node("small", "", note));
      container.append(item);
    });
    return container;
  }

  function chart(items)
  {
    const list = node("ul", "report-chart");
    const maximum = Math.max(0, ...items.map((item) => item[1]));
    items.forEach(([label, count]) =>
    {
      const row = document.createElement("li");
      const track = node("span", "report-bar-track");
      track.setAttribute("aria-hidden", "true");
      const bar = node("span", "report-bar");
      bar.style.width = maximum ? `${count / maximum * 100}%` : "0%";
      track.append(bar);
      row.append(node("span", "", label), track, node("strong", "", count));
      list.append(row);
    });
    return list;
  }

  function countBy(records, key, labels)
  {
    return Object.entries(labels).map(([value, label]) =>
    {
      return [label, records.filter((record) => record[key] === value).length];
    });
  }

  function hooks()
  {
    const attention = fixture.orders.filter((order) => order.status === "attention").length;
    const issues = fixture.orders.filter((order) => order.shipping === "issue").length;
    const lowProducts = fixture.inventory
      .filter((item) => item.type === "produk" && stockCondition(item) !== "available").length;
    const lowMaterials = fixture.inventory
      .filter((item) => item.type === "bahan" && stockCondition(item) !== "available").length;
    const container = node("div", "report-hooks");
    [
      [
        attention, `${attention} pesanan perlu penanganan`, "Status pesanan saat snapshot.",
        "Buka antrean", "../staff/orders-queue.html?tab=attention"
      ],
      [
        issues, `${issues} pengiriman terkendala`, "Status pengiriman saat snapshot.",
        "Buka pengiriman", "../staff/orders-queue.html?tab=all&shipping=issue"
      ],
      [
        lowProducts, `${lowProducts} stok produk perlu perhatian`, "Saldo bebas pada snapshot.",
        "Buka stok produk", "../staff/products.html?availability=attention"
      ],
      [
        lowMaterials, `${lowMaterials} bahan perlu perhatian`, "Saldo bebas pada snapshot.",
        "Buka bahan", "../staff/production-materials.html?condition=attention"
      ]
    ].forEach(([count, title, description, action, path]) =>
    {
      const element = node("div", count ? "report-hook" : "report-hook report-hook--quiet");
      const copy = node("div", "report-hook-copy");
      copy.append(node("strong", "", title), node("span", "", description), link(action, path));
      element.append(icon(count ? "alert" : "check"), copy);
      container.append(element);
    });
    return container;
  }

  function renderOverview()
  {
    const created = withinOrders();
    const delivery = withinOrders("delivery").filter((order) => order.status !== "cancelled");
    root.append(hooks());
    root.append(metrics(
    [
      ["Pesanan dibuat", created.length, "Berdasarkan tanggal dibuat"],
      ["Status selesai", created.filter((order) => order.status === "complete").length, "Status terkini dari pesanan dibuat"],
      ["Jadwal kirim", delivery.length, "Berdasarkan tanggal kirim"],
      ["Pengiriman terkendala", fixture.orders.filter((order) => order.shipping === "issue").length, "Kondisi saat snapshot"]
    ]));
    const grid = node("div", "report-grid");
    const orders = node("section", "report-card");
    orders.append(sectionHead("Status pesanan", "Status terkini dari pesanan yang dibuat dalam periode.", "Lihat laporan", "orders"));
    orders.append(chart(countBy(created, "status", orderLabels)));
    const shipping = node("section", "report-card");
    shipping.append(sectionHead("Pengiriman", "Status terkini dari jadwal kirim dalam periode.", "Lihat laporan", "shipping"));
    shipping.append(chart(countBy(delivery, "shipping", shippingLabels)));
    const products = node("section", "report-card");
    products.append(sectionHead(
      "Produk terlaris", "Jumlah per SKU; satuan berbeda tidak setara. Pesanan dibatalkan dikecualikan.",
      "Lihat laporan", "products"
    ));
    const leaders = productRows(created).slice(0, 3);
    const leaderList = node("ul", "report-rank");
    leaders.forEach((item) =>
    {
      const row = document.createElement("li");
      row.append(node("span", "", item.name), node("strong", "", `${item.quantity} ${item.unit}`));
      leaderList.append(row);
    });
    products.append(leaders.length ? leaderList
      : node("p", "report-muted", "Belum ada unit yang dapat dihitung pada periode ini."));
    const stock = node("section", "report-card");
    stock.append(sectionHead(
      "Stok & bahan", "Saldo dan ambang contoh per baris saat snapshot, bukan P-22 sistem.",
      "Lihat laporan", "stock"
    ));
    stock.append(chart([
      ["Stok rendah", fixture.inventory.filter((item) => stockCondition(item) === "low").length],
      ["Habis", fixture.inventory.filter((item) => stockCondition(item) === "empty").length],
      ["Tersedia", fixture.inventory.filter((item) => stockCondition(item) === "available").length]
    ]));
    grid.append(orders, shipping, products, stock);
    root.append(grid);
  }

  function productRows(orders)
  {
    const result = new Map();
    orders.filter((order) => order.status !== "cancelled").forEach((order) =>
    {
      order.items.forEach((item) =>
      {
        if (!result.has(item.sku))
        {
          result.set(item.sku, { ...item, quantity: 0, orderIds: new Set() });
        }
        const product = result.get(item.sku);
        product.quantity += item.quantity;
        product.orderIds.add(order.id);
      });
    });
    return Array.from(result.values()).sort((first, second) => second.quantity - first.quantity);
  }

  function table(headers, rows)
  {
    const element = node("table", "report-table");
    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    headers.forEach((label) =>
    {
      const cell = node("th", "", label);
      cell.scope = "col";
      headRow.append(cell);
    });
    head.append(headRow);
    const body = document.createElement("tbody");
    rows.forEach((values) =>
    {
      const row = document.createElement("tr");
      values.forEach((value, index) =>
      {
        const cell = document.createElement("td");
        cell.dataset.label = headers[index];
        if (value instanceof Node)
        {
          cell.append(value);
        }
        else
        {
          cell.textContent = String(value);
        }
        row.append(cell);
      });
      body.append(row);
    });
    element.append(head, body);
    return element;
  }

  function tablePagination(total)
  {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    state.page = Math.min(state.page, pages);
    const footer = node("div", "report-pagination");
    const start = total ? (state.page - 1) * pageSize + 1 : 0;
    footer.append(node("span", "report-muted", `${start}–${Math.min(state.page * pageSize, total)} dari ${total}`));
    const controls = node("div", "report-pagination-controls");
    const previous = button("", "previous", "icon-button");
    previous.setAttribute("aria-label", "Halaman sebelumnya");
    previous.disabled = state.page === 1;
    previous.append(icon("chevron"));
    const next = button("", "next", "icon-button");
    next.setAttribute("aria-label", "Halaman berikutnya");
    next.disabled = state.page >= pages;
    next.append(icon("chevron"));
    controls.append(previous, node("span", "report-muted", `${state.page} dari ${pages}`), next);
    footer.append(controls);
    return footer;
  }

  function filterTools(options)
  {
    const tools = node("form", "report-tools");
    tools.id = "report-filter-form";
    const search = document.createElement("input");
    search.type = "search";
    search.value = state.query;
    search.placeholder = "Cari dalam laporan";
    tools.append(labeledField("Pencarian", "report-search", search));
    tools.append(labeledField("Filter", "report-filter", select([["all", "Semua"], ...options], state.filter)));
    if (state.tab === "orders")
    {
      tools.append(labeledField("Dasar periode", "report-basis", select(
        [["created", "Tanggal dibuat"], ["delivery", "Tanggal kirim"]], state.orderBasis
      )));
    }
    if (state.tab === "stock")
    {
      tools.append(labeledField("Lokasi", "report-location", select(
        [["all", "Semua lokasi"], ["Gudang Pusat", "Gudang Pusat"], ["Etalase Toko", "Etalase Toko"]], state.location
      )));
    }
    tools.append(labeledField("Urutkan", "report-sort", select(
      [["recent", "Terbaru / terbanyak"], ["oldest", "Terlama / terkecil"], ["name", "Nama A–Z"]], state.sort
    )));
    tools.append(button("Reset filter", "reset"));
    return tools;
  }

  function renderSheet(title, description, headers, records, toRow, options)
  {
    const section = node("section", "report-sheet");
    const head = node("div", "report-sheet-heading");
    head.append(node("h2", "", title), node("p", "report-muted", description));
    section.append(head, filterTools(options));
    const pages = Math.max(1, Math.ceil(records.length / pageSize));
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * pageSize;
    if (records.length)
    {
      section.append(table(headers, records.slice(start, start + pageSize).map(toRow)));
    }
    else
    {
      const empty = node("div", "report-state");
      empty.append(
        node("h2", "", "Tidak ada data yang cocok"),
        node("p", "report-muted", "Coba ubah periode atau hapus filter yang dipilih."),
        button("Reset filter", "reset")
      );
      section.append(empty);
    }
    section.append(tablePagination(records.length));
    root.append(section);
  }

  function matches(record, value)
  {
    const query = state.query.trim().toLocaleLowerCase("id-ID");
    return (!query || JSON.stringify(record).toLocaleLowerCase("id-ID").includes(query))
      && (state.filter === "all" || state.filter === value);
  }

  function renderOrders()
  {
    const scheduled = withinOrders("delivery").filter((order) => order.status !== "cancelled");
    const groups = new Map();
    scheduled.forEach((order) => groups.set(order.delivery, (groups.get(order.delivery) || 0) + 1));
    const scheduleCard = node("section", "report-card report-schedule");
    scheduleCard.append(sectionHead("Jadwal kirim per tanggal", "Berdasarkan tanggal kirim; pesanan dibatalkan dikecualikan."));
    const schedule = [...groups.entries()].sort(([first], [second]) => first.localeCompare(second));
    scheduleCard.append(schedule.length ? chart(schedule.map(([date, count]) => [displayDate(date), count]))
      : node("p", "report-muted", "Tidak ada jadwal kirim pada periode ini."));
    root.append(scheduleCard);
    const rows = sortRows(withinOrders(state.orderBasis).filter((order) => matches(order, order.status)), state.orderBasis);
    renderSheet(
      "Pesanan", `Berdasarkan tanggal ${state.orderBasis === "created" ? "dibuat" : "kirim"}; status adalah kondisi saat snapshot.`,
      ["Nomor pesanan", "Dibuat", "Jadwal kirim", "Status pesanan", "Status pengiriman", "Tindakan"],
      rows,
      (order) => [
        order.id, displayDate(order.created), `${displayDate(order.delivery)} · ${order.slot}`,
        statusBadge(order.status, orderLabels), statusBadge(order.shipping, shippingLabels),
        link("Buka antrean", "../staff/orders-queue.html", "queue-button report-row-link")
      ],
      Object.entries(orderLabels)
    );
  }

  function renderProducts()
  {
    const rows = sortRows(productRows(withinOrders()).filter((product) => matches(product, product.category)), "quantity");
    const categories = [...new Set(fixture.orders.flatMap((order) => order.items.map((item) => item.category)))];
    renderSheet(
      "Produk terlaris", "Unit per SKU dari pesanan dibuat dalam periode; pesanan dibatalkan dikecualikan. Satuan berbeda tidak setara.",
      ["Produk", "SKU", "Kategori", "Unit dipesan", "Jumlah pesanan", "Tindakan"],
      rows,
      (product) => [product.name, product.sku, product.category, `${product.quantity} ${product.unit}`,
        product.orderIds.size, link("Buka produk", "../staff/products.html", "queue-button report-row-link")],
      categories.map((category) => [category, category])
    );
  }

  function renderStock()
  {
    const nav = node("nav", "product-detail-tabs report-tabs");
    nav.setAttribute("aria-label", "Jenis laporan persediaan");
    Object.entries(stockLabels).forEach(([key, label]) =>
    {
      const item = button(label, "stock", "");
      item.className = "";
      item.dataset.stock = key;
      if (state.stock === key)
      {
        item.setAttribute("aria-current", "page");
      }
      nav.append(item);
    });
    root.append(nav);
    if (state.stock === "movements")
    {
      const rows = sortRows(fixture.movements.filter((item) => inPeriod(item.date) && matches(item, item.type)
        && (state.location === "all" || item.location === state.location)), "date");
      renderSheet(
        "Riwayat mutasi", "Contoh mutasi dalam periode. Belum terhubung dengan buku besar.",
        ["Barang / bahan", "Tanggal", "Lokasi", "Jenis", "Jumlah", "Referensi", "Tindakan"],
        rows,
        (item) => [item.name, displayDate(item.date), item.location, item.action,
          `${item.amount > 0 ? "+" : ""}${item.amount} ${item.unit}`, item.reference,
          link("Buka modul", item.type === "produk" ? "../staff/products.html" : "../staff/production-materials.html", "queue-button report-row-link")],
        [["produk", "Produk"], ["bahan", "Bahan"]]
      );
      return;
    }
    const rows = sortRows(fixture.inventory.filter((item) => item.type === state.stock && matches(item, stockCondition(item))
      && (state.location === "all" || item.location === state.location)), "balance");
    const labels = { empty: "Habis", low: "Stok rendah", available: "Tersedia" };
    const heading = state.stock === "produk" ? "Stok produk" : "Bahan produksi";
    renderSheet(
      heading, "Snapshot contoh: tersedia = saldo tercatat − reservasi/alokasi. Ambang per baris bukan P-22 sistem.",
      ["Nama / kode", "Lokasi", "Saldo tercatat", "Ditahan", "Tersedia", "Kondisi", "Tindakan"],
      rows,
      (item) => [
        `${item.name} (${item.code})`, item.location, `${item.balance} ${item.unit}`, `${item.held} ${item.unit}`,
        `${item.balance - item.held} ${item.unit}`, statusBadge(stockCondition(item), labels),
        link("Buka modul", item.type === "produk" ? "../staff/products.html" : "../staff/production-materials.html", "queue-button report-row-link")
      ],
      Object.entries(labels)
    );
  }

  function renderShipping()
  {
    const rows = sortRows(withinOrders("delivery")
      .filter((order) => order.status !== "cancelled" && matches(order, order.shipping)), "delivery");
    renderSheet(
      "Pengiriman", "Jadwal kirim dalam periode; status adalah kondisi saat snapshot. Pesanan dibatalkan dikecualikan.",
      ["Nomor pesanan", "Jadwal kirim", "Kurir", "Status pengiriman", "Kendala", "Tindakan"],
      rows,
      (order) => [order.id, `${displayDate(order.delivery)} · ${order.slot}`, order.courier,
        statusBadge(order.shipping, shippingLabels), order.issue || "Tidak ada",
        link("Buka antrean", "../staff/orders-queue.html", "queue-button report-row-link")],
      Object.entries(shippingLabels)
    );
  }

  function renderState()
  {
    const area = node("section", "report-state");
    if (state.load === "loading")
    {
      area.setAttribute("role", "status");
      area.append(node("h2", "", "Memuat laporan"), node("p", "report-muted", "Menyiapkan data contoh."));
    }
    else if (state.load === "error")
    {
      area.append(node("h2", "", "Laporan belum dapat dimuat"),
        node("p", "report-muted", "Coba lagi untuk menampilkan data contoh."), button("Coba lagi", "reload"));
    }
    else
    {
      area.append(node("h2", "", "Belum ada data laporan"),
        node("p", "report-muted", "Data operasional akan muncul setelah tersedia."), button("Muat data contoh", "reload"));
    }
    root.append(area);
  }

  function render()
  {
    writeUrl();
    root.replaceChildren();
    updateRole();
    renderHeader();
    if (state.load !== "full")
    {
      renderState();
      return;
    }
    const renderers =
    {
      overview: renderOverview,
      orders: renderOrders,
      products: renderProducts,
      stock: renderStock,
      shipping: renderShipping
    };
    renderers[state.tab]();
  }

  function sortRows(rows, key)
  {
    return [...rows].sort((first, second) =>
    {
      if (state.sort === "name")
      {
        return String(first.name || first.id).localeCompare(String(second.name || second.id), "id");
      }
      const firstValue = first[key];
      const secondValue = second[key];
      const comparison = typeof firstValue === "number"
        ? firstValue - secondValue : String(firstValue).localeCompare(String(secondValue));
      return state.sort === "oldest" ? comparison : -comparison;
    });
  }

  function resetList()
  {
    state.query = "";
    state.filter = "all";
    state.page = 1;
    state.location = "all";
    state.sort = "recent";
    state.orderBasis = "created";
  }

  root.addEventListener("click", (event) =>
  {
    const control = event.target.closest("[data-report-action]");
    if (!control)
    {
      return;
    }
    const action = control.dataset.reportAction;
    if (action === "tab")
    {
      state.tab = control.dataset.tab;
      resetList();
    }
    else if (action === "stock")
    {
      state.stock = control.dataset.stock;
      resetList();
    }
    else if (action === "reset")
    {
      resetList();
    }
    else if (action === "reset-period")
    {
      state.start = "2026-10-30";
      state.end = fixture.snapshot;
      state.period = "7";
      state.page = 1;
    }
    else if (action === "previous")
    {
      state.page = Math.max(1, state.page - 1);
    }
    else if (action === "next")
    {
      state.page += 1;
    }
    else if (action === "reload")
    {
      state.load = "full";
    }
    writeUrl(true);
    render();
    if (action === "tab" || action === "stock")
    {
      const selector = action === "tab" ? `[data-tab="${state.tab}"]` : `[data-stock="${state.stock}"]`;
      root.querySelector(selector)?.focus({ preventScroll: true });
    }
    else if (action === "reset" || action === "reset-period")
    {
      root.querySelector(`[data-report-action="${action}"]`)?.focus({ preventScroll: true });
    }
  });

  root.addEventListener("change", (event) =>
  {
    const id = event.target.id;
    if (["report-filter", "report-basis", "report-location", "report-sort"].includes(id))
    {
      applyListFilters(id);
      return;
    }
    if (id === "report-start" || id === "report-end")
    {
      const start = document.getElementById("report-start").value;
      const end = document.getElementById("report-end").value;
      if (!start || !end || start > end)
      {
        document.getElementById("report-period-error").textContent =
          "Pilih tanggal awal dan akhir yang valid. Periode sebelumnya masih digunakan.";
        document.getElementById("report-start").setAttribute("aria-invalid", "true");
        document.getElementById("report-end").setAttribute("aria-invalid", "true");
        return;
      }
      state.start = start;
      state.end = end;
      state.period = "custom";
      state.page = 1;
      renderAndRestoreFocus(id);
      return;
    }
    if (id !== "report-period")
    {
      return;
    }
    const choice = event.target.value;
    state.period = choice;
    if (choice === "custom")
    {
      renderAndRestoreFocus("report-start");
      return;
    }
    const last = new Date(`${fixture.snapshot}T12:00:00Z`);
    const first = new Date(last);
    if (choice === "month")
    {
      first.setUTCDate(1);
    }
    else
    {
      first.setUTCDate(first.getUTCDate() - (choice === "today" ? 0 : Number(choice) - 1));
    }
    state.start = first.toISOString().slice(0, 10);
    state.end = fixture.snapshot;
    state.page = 1;
    renderAndRestoreFocus("report-period");
  });

  function renderAndRestoreFocus(id, selectionStart = null, selectionEnd = null)
  {
    render();
    const control = document.getElementById(id);
    if (control)
    {
      control.focus({ preventScroll: true });
      if (selectionStart !== null && typeof control.setSelectionRange === "function")
      {
        control.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  }

  function applyListFilters(focusId, selectionStart = null, selectionEnd = null)
  {
    state.query = document.getElementById("report-search").value;
    state.filter = document.getElementById("report-filter").value;
    state.orderBasis = document.getElementById("report-basis")?.value || state.orderBasis;
    state.location = document.getElementById("report-location")?.value || "all";
    state.sort = document.getElementById("report-sort").value;
    state.page = 1;
    renderAndRestoreFocus(focusId, selectionStart, selectionEnd);
  }

  root.addEventListener("input", (event) =>
  {
    if (event.target.id === "report-search" && !event.isComposing)
    {
      applyListFilters("report-search", event.target.selectionStart, event.target.selectionEnd);
    }
  });

  root.addEventListener("submit", (event) =>
  {
    event.preventDefault();
  });

  profile.addEventListener("change", () =>
  {
    state.role = profile.value;
    render();
  });
  loadSelect.addEventListener("change", () =>
  {
    state.load = loadSelect.value;
    render();
  });
  window.addEventListener("popstate", () => location.reload());
  render();
})();
