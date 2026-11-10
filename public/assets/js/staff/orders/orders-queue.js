"use strict";

document.documentElement.classList.add("js");

const snapshotAt = new Date("2026-11-03T11:25:00+07:00");
const todayKey = "2026-11-03";
const tomorrowKey = "2026-11-04";
const pageSize = 5;
const slotDefinitions =
{
  morning:
  {
    label: "Pagi",
    hours: "08.00 sampai 12.00",
    endTime: "12:00:00"
  },
  afternoon:
  {
    label: "Siang",
    hours: "12.00 sampai 16.00",
    endTime: "16:00:00"
  },
  evening:
  {
    label: "Sore",
    hours: "16.00 sampai 20.00",
    endTime: "20:00:00"
  }
};

const orderStatusLabels =
{
  ready: "Siap Diproses",
  preparing: "Sedang Disiapkan",
  attention: "Perlu Penanganan",
  shipping: "Dikirim",
  delivered: "Terkirim",
  cancelled: "Dibatalkan",
  complete: "Selesai"
};

const paymentStatusLabels =
{
  paid: "Berhasil",
  unpaid: "Menunggu",
  review: "Perlu Ditinjau",
  refundProcessing: "Refund Diproses",
  refundedPartial: "Dikembalikan Sebagian",
  refundedFull: "Dikembalikan Penuh",
  dispute: "Sengketa"
};

const shippingStatusLabels =
{
  pending: "Belum Diserahkan",
  shipping: "Dalam Pengiriman",
  delivered: "Terkirim",
  issue: "Terkendala",
  returned: "Dikembalikan"
};

const tabDescriptions =
{
  ready: "siap diproses",
  preparing: "sedang disiapkan",
  attention: "perlu penanganan",
  all: "dalam daftar"
};

function makeItem(name, price, sku, variant, quantity = 1, unit = "pot")
{
  return {
    name,
    price,
    sku,
    variant,
    quantity,
    unit
  };
}

function makeOrder(orderData)
{
  return {
    status: "ready",
    payment: "paid",
    method: "Online",
    shipping: "pending",
    deliveryDay: todayKey,
    slot: "afternoon",
    courier: "Kurir instan",
    shippingCost: 20000,
    stockCommitted: true,
    codValidated: false,
    tracking: "Belum diisi",
    greeting: "",
    history: [],
    ...orderData
  };
}

const orders =
[
  makeOrder({
    id: "RV-261103-A7K9M2",
    customer: "Nadia Putri",
    recipient: "Alya Putri",
    createdAt: "2026-11-03T08:10:00+07:00",
    paidAt: "2026-11-03T08:12:00+07:00",
    slot: "morning",
    shippingCost: 25000,
    greeting: "Selamat atas hari istimewamu. Semoga selalu tumbuh bahagia.",
    items: [makeItem("Buket mawar pastel", 225000, "DEMO-FL-07", "12 tangkai, wrapping krem, pita sage", 1, "buket")]
  }),
  makeOrder({
    id: "RV-261103-C3F8R6",
    customer: "Raka Pratama",
    createdAt: "2026-11-03T08:35:00+07:00",
    paidAt: null,
    payment: "unpaid",
    method: "COD",
    codValidated: true,
    items:
    [
      makeItem("Monstera deliciosa", 128999, "DEMO-PL-02", "Ukuran M, pot nursery"),
      makeItem("Pot terakota", 45000, "DEMO-GD-04", "Diameter 18 cm", 1, "unit")
    ]
  }),
  makeOrder({
    id: "RV-261103-H4T6W8",
    customer: "Fitri Anjani",
    createdAt: "2026-11-03T09:15:00+07:00",
    paidAt: "2026-11-03T09:18:00+07:00",
    slot: "evening",
    shippingCost: 35000,
    courier: "Kurir same-day",
    items: [makeItem("Media tanam organik", 89000, "DEMO-GD-09", "Kemasan 10 liter", 2, "sak")]
  }),
  makeOrder({
    id: "RV-261103-J5N7P3",
    customer: "Wulan Maharani",
    createdAt: "2026-11-03T09:40:00+07:00",
    paidAt: "2026-11-03T09:42:00+07:00",
    deliveryDay: tomorrowKey,
    slot: "morning",
    items: [makeItem("Peace lily", 149000, "DEMO-PL-05", "Ukuran M, pot putih")]
  }),
  makeOrder({
    id: "RV-261103-D8V2X6",
    customer: "Jaya Saputra",
    createdAt: "2026-11-03T10:05:00+07:00",
    paidAt: null,
    payment: "unpaid",
    method: "COD",
    codValidated: true,
    deliveryDay: tomorrowKey,
    shippingCost: 25000,
    items: [makeItem("Pot keramik minimalis", 59000, "DEMO-GD-12", "Warna sand, diameter 15 cm", 2, "unit")]
  }),
  makeOrder({
    id: "RV-261103-K9B3S7",
    customer: "Sinta Larasati",
    createdAt: "2026-11-03T07:50:00+07:00",
    paidAt: "2026-11-03T07:53:00+07:00",
    status: "preparing",
    slot: "morning",
    shippingCost: 25000,
    items: [makeItem("Buket garden rose", 275000, "DEMO-FL-11", "15 tangkai, wrapping ivory", 1, "buket")],
    history: [{ label: "Mulai disiapkan", actor: "Admin RylVa", time: "2026-11-03T10:35:00+07:00" }]
  }),
  makeOrder({
    id: "RV-261103-F6L8Q4",
    customer: "Bima Aditya",
    createdAt: "2026-11-03T08:05:00+07:00",
    paidAt: "2026-11-03T08:08:00+07:00",
    status: "preparing",
    items:
    [
      makeItem("Set alat berkebun", 98000, "DEMO-GD-15", "Sekop dan garpu, 3 alat", 1, "set"),
      makeItem("Media tanam serbaguna", 45000, "DEMO-GD-16", "Kemasan 5 liter", 1, "sak")
    ],
    history: [{ label: "Mulai disiapkan", actor: "Admin RylVa", time: "2026-11-03T10:50:00+07:00" }]
  }),
  makeOrder({
    id: "RV-261103-M2Y6Z8",
    customer: "Dewi Kusuma",
    createdAt: "2026-11-03T09:00:00+07:00",
    paidAt: "2026-11-03T09:04:00+07:00",
    status: "preparing",
    slot: "evening",
    shippingCost: 25000,
    items: [makeItem("Anggrek bulan", 210000, "DEMO-PL-17", "2 tangkai, warna putih")],
    history: [{ label: "Mulai disiapkan", actor: "Admin RylVa", time: "2026-11-03T11:00:00+07:00" }]
  }),
  makeOrder({
    id: "RV-261103-R7C5G9",
    customer: "Livia Amanda",
    createdAt: "2026-11-03T08:00:00+07:00",
    paidAt: "2026-11-03T08:03:00+07:00",
    status: "attention",
    items: [makeItem("Peace lily", 149000, "DEMO-PL-05", "Ukuran M, pot putih")],
    caseInfo:
    {
      code: "PH-06",
      title: "Stok fisik tidak sesuai",
      description: "Peace lily yang dialokasikan ditemukan rusak saat pemeriksaan. Pesanan ditahan sampai solusi disepakati.",
      owner: "Admin RylVa",
      deadline: "2026-11-03T11:05:00+07:00",
      previousStatus: "Sedang Disiapkan",
      nextAction: "Tinjau substitusi atau pemenuhan sebagian dengan persetujuan pelanggan, atau ajukan refund sesuai kewenangan."
    },
    history: [{ label: "Masuk Perlu Penanganan PH-06", actor: "Admin RylVa", time: "2026-11-03T09:05:00+07:00" }]
  }),
  makeOrder({
    id: "RV-261103-T8D4H6",
    customer: "Andi Wijaya",
    createdAt: "2026-11-03T10:45:00+07:00",
    paidAt: null,
    status: "attention",
    payment: "review",
    stockCommitted: false,
    slot: "evening",
    items: [makeItem("Sukulen mix", 129000, "DEMO-PL-21", "3 tanaman dalam pot oval", 1, "set")],
    caseInfo:
    {
      code: "PH-03",
      title: "Nominal pembayaran tidak cocok",
      description: "Pembayaran memerlukan pencocokan dengan bukti transaksi. Pemenuhan belum boleh dilanjutkan.",
      owner: "SuperAdmin RylVa",
      deadline: "2026-11-03T13:00:00+07:00",
      previousStatus: "Menunggu Pembayaran",
      nextAction: "SuperAdmin melakukan rekonsiliasi manual berdasarkan bukti terverifikasi. Admin dapat memeriksa dan mengeskalasi kasus."
    },
    history: [{ label: "Pembayaran perlu ditinjau, PH-03", actor: "Sistem", time: "2026-11-03T11:00:00+07:00" }]
  }),
  makeOrder({
    id: "RV-261103-N6E9U2",
    customer: "Nisa Aulia",
    createdAt: "2026-11-03T07:05:00+07:00",
    paidAt: "2026-11-03T07:08:00+07:00",
    status: "shipping",
    shipping: "shipping",
    slot: "morning",
    tracking: "DEMO-KURIR-01",
    items: [makeItem("Lidah mertua", 99000, "DEMO-PL-23", "Ukuran S, pot nursery")],
    history: [{ label: "Diserahkan ke kurir", actor: "Admin RylVa", time: "2026-11-03T10:30:00+07:00" }]
  }),
  makeOrder({
    id: "RV-261102-P3J7W9",
    customer: "Dimas Prakoso",
    createdAt: "2026-11-02T09:05:00+07:00",
    paidAt: "2026-11-02T09:08:00+07:00",
    status: "complete",
    shipping: "delivered",
    deliveryDay: "2026-11-02",
    slot: "afternoon",
    tracking: "DEMO-KURIR-02",
    items: [makeItem("Pot keramik sage", 79000, "DEMO-GD-25", "Diameter 20 cm", 1, "unit")],
    history: [{ label: "Penerimaan dikonfirmasi", actor: "Pelanggan", time: "2026-11-02T14:30:00+07:00" }]
  })
];

const documentNodes =
{
  rows: document.getElementById("order-rows"),
  rowTemplate: document.getElementById("order-row-template"),
  search: document.getElementById("order-search"),
  filters: document.getElementById("advanced-filters"),
  filtersToggle: document.getElementById("filters-toggle"),
  queueView: document.getElementById("queue-view"),
  detailView: document.getElementById("detail-view"),
  prepareDialog: document.getElementById("prepare-dialog"),
  sidebar: document.getElementById("sidebar"),
  menuOpen: document.getElementById("mobile-open"),
  menuClose: document.getElementById("mobile-close"),
  backdrop: document.getElementById("mobile-backdrop")
};

let state = readUrlState();
let searchTimer;
let refreshTimer;
let lastOpenedOrderId = "";

function readUrlState()
{
  const parameters = new URLSearchParams(window.location.search);
  const validValue = (name, options, fallback) =>
  {
    const value = parameters.get(name);
    return options.includes(value) ? value : fallback;
  };

  return {
    tab: validValue("tab", ["ready", "preparing", "attention", "all"], "ready"),
    stage: validValue("stage", ["all", ...Object.keys(orderStatusLabels)], "all"),
    query: parameters.get("q") || "",
    day: validValue("day", ["all", "today", "tomorrow"], "all"),
    slot: validValue("slot", ["all", "morning", "afternoon", "evening"], "all"),
    payment: validValue("payment", ["all", "paid", "cod", "review", "refundProcessing", "refundedPartial", "refundedFull"], "all"),
    shipping: validValue("shipping", ["all", "pending", "shipping", "delivered", "issue", "returned"], "all"),
    workspace: validValue("workspace", ["queue", "aftercare"], "queue"),
    detailTab: validValue("detailTab", ["overview", "fulfillment", "case", "aftercare", "activity"], "overview"),
    aftercareFilter: validValue("requests", ["all", "cancellation", "refund", "complaint"], "all"),
    page: Math.max(1, Number.parseInt(parameters.get("page"), 10) || 1),
    previewState: validValue("state", ["full", "loading", "empty", "error"], "full"),
    role: parameters.get("role") === "superadmin" ? "superadmin" : "admin",
    orderId: parameters.get("order") || ""
  };
}

function writeUrlState(pushEntry = false)
{
  const url = new URL(window.location.href);
  const values =
  {
    tab: state.tab === "ready" ? "" : state.tab,
    stage: state.stage === "all" ? "" : state.stage,
    q: state.query,
    day: state.day === "all" ? "" : state.day,
    slot: state.slot === "all" ? "" : state.slot,
    payment: state.payment === "all" ? "" : state.payment,
    shipping: state.shipping === "all" ? "" : state.shipping,
    page: state.page === 1 ? "" : String(state.page),
    state: state.previewState === "full" ? "" : state.previewState,
    order: state.orderId,
    workspace: state.workspace === "queue" ? "" : state.workspace,
    detailTab: state.detailTab === "overview" ? "" : state.detailTab,
    requests: state.aftercareFilter === "all" ? "" : state.aftercareFilter,
    role: state.role === "superadmin" ? "superadmin" : ""
  };

  Object.entries(values).forEach(([name, value]) =>
  {
    if (value)
    {
      url.searchParams.set(name, value);
    }
    else
    {
      url.searchParams.delete(name);
    }
  });

  try
  {
    const method = pushEntry ? "pushState" : "replaceState";
    window.history[method](null, "", url);
  }
  catch (error)
  {
    console.info("Penyimpanan filter pada URL tidak tersedia.", error.name);
  }
}

function rupiah(value)
{
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
}

function formatTime(value)
{
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta"
  }).format(new Date(value));
}

function formatDate(value)
{
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta"
  }).format(new Date(value));
}

function setText(id, value)
{
  document.getElementById(id).textContent = value;
}

function setField(fragment, field, value)
{
  fragment.querySelector(`[data-field="${field}"]`).textContent = value;
}

function getSubtotal(order)
{
  return order.items.reduce((total, item) => total + item.price * item.quantity, 0);
}

function getTotal(order)
{
  return getSubtotal(order) + order.shippingCost;
}

function getFulfillmentItems(order)
{
  return order.operations?.fulfillmentItems || order.items;
}

function getFulfillmentSubtotal(order)
{
  return getFulfillmentItems(order).reduce((total, item) => total + item.price * item.quantity, 0);
}

function getCollectibleTotal(order)
{
  return getTotal(order) - (order.operations?.collectionAdjustment?.reduction || 0);
}

function getItemSummary(order)
{
  const firstItem = order.items[0].name;
  return order.items.length > 1 ? `${firstItem} + ${order.items.length - 1} item` : firstItem;
}

function getSlotEnd(order)
{
  return new Date(`${order.deliveryDay}T${slotDefinitions[order.slot].endTime}+07:00`);
}

function getRemainingMinutes(value)
{
  return Math.round((new Date(value).getTime() - snapshotAt.getTime()) / 60000);
}

function getUrgency(order)
{
  if (order.caseInfo)
  {
    const minutes = getRemainingMinutes(order.caseInfo.deadline);
    return minutes < 0 ? `Lewat tenggat ${Math.abs(minutes)} menit` : `Tenggat ${formatTime(order.caseInfo.deadline)} WIB`;
  }

  if (!["ready", "preparing"].includes(order.status))
  {
    return "";
  }

  const minutes = getRemainingMinutes(getSlotEnd(order));

  if (minutes < 0)
  {
    return `Slot lewat ${Math.abs(minutes)} menit`;
  }

  return minutes <= 60 ? `${minutes} menit ke akhir slot` : "";
}

function getAvailableOrders()
{
  return state.previewState === "empty" ? [] : orders;
}

function getFilteredOrders()
{
  const normalizedQuery = state.query.trim().toLocaleLowerCase("id-ID");

  return getAvailableOrders().filter((order) =>
  {
    const matchesQuery = `${order.id} ${order.customer}`.toLocaleLowerCase("id-ID").includes(normalizedQuery);
    const matchesDay = state.day === "all" || order.deliveryDay === (state.day === "today" ? todayKey : tomorrowKey);
    const matchesSlot = state.slot === "all" || order.slot === state.slot;
    const matchesPayment = state.payment === "all" ||
      (state.payment === "cod" && order.method === "COD" && order.payment === "unpaid") ||
      order.payment === state.payment;
    const matchesShipping = state.shipping === "all" || order.shipping === state.shipping;
    const matchesStage = state.stage === "all" || order.status === state.stage;

    return matchesQuery && matchesDay && matchesSlot && matchesPayment && matchesShipping && matchesStage;
  });
}

function sortByDelivery(firstOrder, secondOrder)
{
  const dateDifference = getSlotEnd(firstOrder).getTime() - getSlotEnd(secondOrder).getTime();

  if (dateDifference !== 0)
  {
    return dateDifference;
  }

  const firstEvent = firstOrder.paidAt || firstOrder.createdAt;
  const secondEvent = secondOrder.paidAt || secondOrder.createdAt;
  return new Date(firstEvent).getTime() - new Date(secondEvent).getTime();
}

function renderAttentionHooks()
{
  const availableOrders = getAvailableOrders();
  const overdueOrders = availableOrders
    .filter((order) => order.caseInfo && getRemainingMinutes(order.caseInfo.deadline) < 0)
    .sort((firstOrder, secondOrder) =>
    {
      return new Date(firstOrder.caseInfo.deadline) - new Date(secondOrder.caseInfo.deadline);
    });
  const morningOrders = availableOrders.filter((order) =>
  {
    return order.deliveryDay === todayKey && order.slot === "morning" &&
      ["ready", "preparing"].includes(order.status);
  });
  const overdueHook = document.getElementById("overdue-hook");
  const deliveryHook = document.getElementById("delivery-hook");
  const overdueOrder = overdueOrders[0];

  overdueHook.disabled = !overdueOrder;
  deliveryHook.disabled = morningOrders.length === 0;
  overdueHook.closest(".priority-hook").classList.toggle("priority-hook--inactive", !overdueOrder);
  deliveryHook.closest(".priority-hook").classList.toggle("priority-hook--inactive", morningOrders.length === 0);
  setText("case-hook-title", overdueOrder
    ? `${overdueOrders.length} kasus terlambat ${Math.abs(getRemainingMinutes(overdueOrder.caseInfo.deadline))} menit`
    : "Tidak ada kasus lewat tenggat");
  setText("case-hook-copy", overdueOrder
    ? `${overdueOrder.caseInfo.code}: ${overdueOrder.caseInfo.title}.`
    : "Seluruh tenggat kasus masih terjaga.");
  setText("delivery-hook-title", morningOrders.length > 0
    ? `Slot pagi berakhir ${getRemainingMinutes(getSlotEnd(morningOrders[0]))} menit lagi`
    : "Slot pagi sudah ditangani");
  setText("delivery-hook-copy", `${morningOrders.length} pesanan belum diserahkan ke kurir.`);
  overdueHook.dataset.orderId = overdueOrder ? overdueOrder.id : "";
}

function renderCounts(filteredOrders)
{
  document.querySelectorAll("[data-count]").forEach((node) =>
  {
    const tab = node.dataset.count;
    node.textContent = tab === "all" ? filteredOrders.length : filteredOrders.filter((order) => order.status === tab).length;
  });

  document.querySelectorAll("[data-tab]").forEach((button) =>
  {
    button.setAttribute("aria-pressed", String(button.dataset.tab === state.tab));
  });
}

function createOrderRow(order)
{
  const fragment = documentNodes.rowTemplate.content.cloneNode(true);
  const slot = slotDefinitions[order.slot];
  const urgency = getUrgency(order);
  const dayLabel = order.deliveryDay === todayKey ? "Hari ini" :
    order.deliveryDay === tomorrowKey ? "Besok" : formatDate(`${order.deliveryDay}T12:00:00+07:00`);

  setField(fragment, "id", order.id);
  setField(fragment, "itemSummary", getItemSummary(order));
  setField(fragment, "customer", order.customer);
  setField(fragment, "createdTime", `Dibuat ${formatTime(order.createdAt)}`);
  setField(fragment, "deliveryDay", dayLabel);
  setField(fragment, "slotLabel", `${slot.label}, ${slot.hours}`);
  setField(fragment, "orderStatus", orderStatusLabels[order.status]);
  setField(fragment, "paymentStatus", paymentStatusLabels[order.payment]);
  setField(fragment, "method", order.method === "COD"
    ? order.payment === "unpaid" ? "COD / UNPAID" : "COD"
    : "Online");
  setField(fragment, "shippingStatus", shippingStatusLabels[order.shipping]);
  setField(fragment, "courierShort", order.courier);
  setField(fragment, "total", rupiah(getCollectibleTotal(order)));

  const urgencyNode = fragment.querySelector('[data-field="urgency"]');
  urgencyNode.hidden = !urgency;
  urgencyNode.textContent = urgency;

  if (order.caseInfo)
  {
    const caseNode = fragment.querySelector('[data-field="caseSummary"]');
    caseNode.hidden = false;
    caseNode.textContent = `${order.caseInfo.code}: ${order.caseInfo.title}`;
    fragment.querySelector('[data-field="orderStatus"]').classList.add("queue-badge--warning");
  }

  const paymentClass = order.payment === "paid" ? "queue-badge--success" :
    order.payment === "review" ? "queue-badge--warning" : "queue-badge--info";
  fragment.querySelector('[data-field="paymentStatus"]').classList.add(paymentClass);

  const openButton = fragment.querySelector("[data-open-order]");
  openButton.dataset.openOrder = order.id;
  openButton.setAttribute("aria-label", `Buka pesanan ${order.id}`);
  return fragment;
}

function renderActiveFilters()
{
  const container = document.getElementById("active-filters");
  const labels =
  {
    stage: orderStatusLabels,
    day: { today: "Hari ini", tomorrow: "Besok" },
    slot: { morning: "Slot pagi", afternoon: "Slot siang", evening: "Slot sore" },
    payment:
    {
      paid: "Pembayaran berhasil",
      cod: "COD menunggu",
      review: "Pembayaran ditinjau",
      refundProcessing: "Refund diproses",
      refundedPartial: "Refund sebagian",
      refundedFull: "Refund penuh"
    },
    shipping:
    {
      pending: "Belum diserahkan",
      shipping: "Dalam pengiriman",
      delivered: "Terkirim",
      issue: "Terkendala",
      returned: "Dikembalikan"
    }
  };
  const filterEntries = Object.entries(labels).filter(([name]) => state[name] !== "all");
  container.replaceChildren();

  filterEntries.forEach(([name, options]) =>
  {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-chip";
    button.textContent = `${options[state[name]]} ×`;
    button.setAttribute("aria-label", `Hapus filter ${options[state[name]]}`);
    button.addEventListener("click", () =>
    {
      state[name] = "all";
      state.page = 1;
      updateView();
    });
    container.append(button);
  });

  container.hidden = filterEntries.length === 0;
  setText("filter-count", String(filterEntries.length));
  document.getElementById("filter-count").hidden = filterEntries.length === 0;
}

function renderQueue()
{
  const filteredOrders = getFilteredOrders();
  const visibleOrders = filteredOrders
    .filter((order) => state.tab === "all" || order.status === state.tab)
    .sort(sortByDelivery);
  const pageCount = Math.max(1, Math.ceil(visibleOrders.length / pageSize));
  state.page = Math.min(state.page, pageCount);

  const startIndex = (state.page - 1) * pageSize;
  const currentOrders = visibleOrders.slice(startIndex, startIndex + pageSize);
  const isLoading = state.previewState === "loading";
  const isError = state.previewState === "error";
  const isEmpty = visibleOrders.length === 0 && !isError && !isLoading;
  const showTable = !isLoading && !isError && !isEmpty;

  renderAttentionHooks();
  renderCounts(filteredOrders);
  renderActiveFilters();
  documentNodes.rows.replaceChildren(...currentOrders.map(createOrderRow));
  document.getElementById("orders-table").hidden = !showTable;
  document.getElementById("list-loading").hidden = !isLoading;
  document.getElementById("list-error").hidden = !isError;
  document.getElementById("list-empty").hidden = !isEmpty;
  document.getElementById("queue-pagination").hidden = !showTable;
  document.querySelector(".queue-sheet").setAttribute("aria-busy", String(isLoading));
  setText("result-summary", isLoading ? "Memuat antrean…" : isError ? "Antrean belum dimuat" :
    `${visibleOrders.length} pesanan ${tabDescriptions[state.tab]}`);
  setText("pagination-summary", `Menampilkan ${startIndex + 1} sampai ${Math.min(startIndex + pageSize, visibleOrders.length)} dari ${visibleOrders.length} pesanan`);
  setText("page-label", `${state.page} dari ${pageCount}`);
  document.getElementById("previous-page").disabled = state.page <= 1;
  document.getElementById("next-page").disabled = state.page >= pageCount;

  const noOrders = getAvailableOrders().length === 0;
  setText("empty-title", noOrders ? "Belum ada pesanan masuk" : "Tidak ada pesanan yang sesuai");
  setText("empty-copy", noOrders
    ? "Pesanan baru yang tervalidasi akan muncul di antrean ini."
    : "Coba kata pencarian lain atau hapus filter yang aktif.");
  setText("empty-reset", noOrders ? "Lihat contoh antrean" : "Hapus pencarian dan filter");
}

function canStartPreparation(order)
{
  if (!order || order.status !== "ready" || !order.stockCommitted || order.caseInfo ||
    order.operations?.cancellation?.status === "requested")
  {
    return false;
  }

  if (order.method === "COD" && order.payment === "unpaid" && order.codValidated)
  {
    return true;
  }

  const paidAmount = order.operations?.paidAmount ?? (order.payment === "paid" ? getTotal(order) : 0);
  const refundLiability = (order.operations?.refunds || [])
    .filter((refund) => refund.status !== "rejected")
    .reduce((total, refund) => total + refund.amount, 0);
  const fulfillmentAmount = getFulfillmentSubtotal(order) + order.shippingCost;

  return ["paid", "refundProcessing", "refundedPartial"].includes(order.payment) &&
    paidAmount - refundLiability >= fulfillmentAmount;
}

function renderDetail(order)
{
  const slot = slotDefinitions[order.slot];
  const detailItems = document.getElementById("detail-items");
  const itemTemplate = document.getElementById("detail-item-template");
  const historyTemplate = document.getElementById("history-template");
  const canPrepare = canStartPreparation(order);

  setText("detail-order-id", order.id);
  setText("detail-created", `Dibuat ${formatDate(order.createdAt)}, ${formatTime(order.createdAt)} WIB`);
  setText("detail-order-status", orderStatusLabels[order.status]);
  setText("detail-payment-status", `${paymentStatusLabels[order.payment]} (${order.method})`);
  setText("detail-shipping-status", shippingStatusLabels[order.shipping]);
  setText("detail-customer", order.customer);
  setText("detail-recipient", order.recipient || order.customer);
  setText("detail-address", "Alamat demonstrasi, Kebayoran Baru, Jakarta Selatan. Kontak pelanggan disamarkan pada pratinjau.");
  setText("detail-delivery-date", formatDate(`${order.deliveryDay}T12:00:00+07:00`));
  setText("detail-delivery-slot", `${slot.label}, ${slot.hours}`);
  setText("detail-courier", order.courier);
  setText("detail-tracking", order.tracking);
  setText("detail-subtotal", rupiah(getSubtotal(order)));
  setText("detail-shipping-cost", rupiah(order.shippingCost));
  setText("detail-total", rupiah(getTotal(order)));
  setText("detail-payment-note", order.method === "COD"
    ? "COD belum lunas. Status pembayaran menunggu konfirmasi penerimaan uang dengan bukti."
    : order.payment === "review" ? "Pembayaran perlu ditinjau sebelum pemenuhan dapat dilanjutkan."
    : "Pembayaran contoh terverifikasi. Harga mengikuti snapshot saat pesanan dibuat.");

  const urgency = getUrgency(order);
  setText("detail-urgency", urgency || (order.stockCommitted ? "Stok sudah dialokasikan" : "Alokasi stok belum dikomit"));
  document.getElementById("detail-urgency").className = `queue-badge ${urgency ? "queue-badge--warning" : "queue-badge--info"}`;
  document.getElementById("detail-case").hidden = !order.caseInfo;

  if (order.caseInfo)
  {
    setText("detail-case-title", `${order.caseInfo.code}: ${order.caseInfo.title}`);
    setText("detail-case-description", order.caseInfo.description);
    setText("detail-case-owner", `Penanggung jawab: ${order.caseInfo.owner}. Tenggat ${formatTime(order.caseInfo.deadline)} WIB. Status sebelumnya: ${order.caseInfo.previousStatus}.`);
    setText("detail-case-next", order.caseInfo.nextAction);
  }

  detailItems.replaceChildren(...order.items.map((item) =>
  {
    const fragment = itemTemplate.content.cloneNode(true);
    setField(fragment, "name", item.name);
    setField(fragment, "variant", item.variant);
    setField(fragment, "sku", `SKU ${item.sku}`);
    setField(fragment, "lineTotal", rupiah(item.price * item.quantity));
    setField(fragment, "quantity", `${item.quantity} ${item.unit} × ${rupiah(item.price)}`);
    return fragment;
  }));

  document.getElementById("detail-greeting").hidden = !order.greeting;
  setText("greeting-text", order.greeting);

  const history =
  [
    { label: "Pesanan dibuat", actor: "Pelanggan", time: order.createdAt },
    {
      label: order.method === "COD" ? "Checkout COD tervalidasi, stok dikomit" :
        order.payment === "paid" ? "Pembayaran terverifikasi, stok dikomit" : "Pembayaran diterima untuk ditinjau",
      actor: "Sistem",
      time: order.paidAt || order.createdAt
    },
    ...order.history
  ];

  document.getElementById("detail-history").replaceChildren(...history.map((event) =>
  {
    const fragment = historyTemplate.content.cloneNode(true);
    setField(fragment, "label", event.label);
    setField(fragment, "actor", event.actor);
    setField(fragment, "time", `${formatTime(event.time)} WIB`);
    fragment.querySelector("time").dateTime = event.time;
    return fragment;
  }));

  document.getElementById("prepare-button").hidden = !canPrepare;
  setText("detail-action-copy", canPrepare
    ? "Periksa varian, jumlah, dan kartu ucapan. Persiapan akan mencatat waktu mulai dan penanggung jawab."
    : order.status === "attention" ? "Selesaikan kasus terlebih dahulu. Pemenuhan ditahan sampai prasyarat terpenuhi."
    : order.status === "preparing" ? "Pesanan sedang disiapkan. Penyerahan ke kurir memerlukan layanan, resi, waktu serah, dan foto paket untuk produk Mudah Layu."
    : order.status === "shipping" ? "Paket sudah diserahkan. Pantau pelacakan dan catat bukti jika pengiriman terkendala."
    : "Pesanan telah selesai. Riwayat tetap tersimpan.");
  document.getElementById("detail-action-result").hidden = !order.wasSimulated;
  setText("detail-action-result", "Status contoh menjadi Sedang Disiapkan. Pembayaran tetap mengikuti status sebelumnya.");
}

function syncControls()
{
  documentNodes.search.value = state.query;
  ["stage", "day", "slot", "payment", "shipping"].forEach((name) =>
  {
    document.getElementById(`${name}-filter`).value = state[name];
  });
}

function updateView(writeHistory = true)
{
  syncControls();
  renderQueue();
  const selectedOrder = orders.find((order) => order.id === state.orderId);
  documentNodes.queueView.hidden = Boolean(selectedOrder);
  documentNodes.detailView.hidden = !selectedOrder;
  setText("page-title", selectedOrder ? "Detail pesanan" : "Antrean pesanan");
  setText("view-intro", selectedOrder
    ? "Periksa isi pesanan dan prasyarat sebelum melanjutkan."
    : "Dahulukan jadwal kirim terdekat dan kasus yang tertunda.");
  document.title = `${selectedOrder ? selectedOrder.id : "Antrean Pesanan"} | RylVa Green`;

  if (selectedOrder)
  {
    renderDetail(selectedOrder);
  }
  else
  {
    state.orderId = "";
  }

  if (writeHistory)
  {
    writeUrlState();
  }

  document.dispatchEvent(new CustomEvent("orders:render"));
}

function openOrder(orderId)
{
  lastOpenedOrderId = orderId;
  state.detailTab = "overview";
  state.orderId = orderId;
  writeUrlState(true);
  updateView(false);
  document.getElementById("page-title").focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "instant" });
}

function resetFilters()
{
  state.query = "";
  state.day = "all";
  state.slot = "all";
  state.payment = "all";
  state.shipping = "all";
  state.stage = "all";
  state.page = 1;
  state.previewState = "full";
  updateView();
}

function refreshOrders()
{
  clearTimeout(refreshTimer);
  state.previewState = "loading";
  updateView();
  refreshTimer = setTimeout(() =>
  {
    state.previewState = "full";
    updateView();
  }, 500);
}

function setMobileMenu(isOpen)
{
  documentNodes.sidebar.classList.toggle("-translate-x-full", !isOpen);
  documentNodes.backdrop.classList.toggle("hidden", !isOpen);
  documentNodes.menuOpen.setAttribute("aria-expanded", String(isOpen));
  document.body.classList.toggle("overflow-hidden", isOpen);
  documentNodes.sidebar.inert = !isOpen && window.innerWidth < 1024;
  (isOpen ? documentNodes.menuClose : documentNodes.menuOpen).focus();
}

document.getElementById("search-form").addEventListener("submit", (event) =>
{
  event.preventDefault();
  clearTimeout(searchTimer);
  state.query = documentNodes.search.value;
  state.page = 1;
  updateView();
});

documentNodes.search.addEventListener("input", () =>
{
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() =>
  {
    state.query = documentNodes.search.value;
    state.page = 1;
    updateView();
  }, 180);
});

documentNodes.filtersToggle.addEventListener("click", () =>
{
  const isOpen = documentNodes.filters.hidden;
  documentNodes.filters.hidden = !isOpen;
  documentNodes.filtersToggle.setAttribute("aria-expanded", String(isOpen));
});

documentNodes.filters.addEventListener("submit", (event) =>
{
  event.preventDefault();
  ["stage", "day", "slot", "payment", "shipping"].forEach((name) =>
  {
    state[name] = document.getElementById(`${name}-filter`).value;
  });
  if (state.stage !== "all")
  {
    state.tab = "all";
  }
  state.page = 1;
  updateView();
});

document.querySelectorAll("[data-tab]").forEach((button) =>
{
  button.addEventListener("click", () =>
  {
    state.tab = button.dataset.tab;
    state.page = 1;
    updateView();
  });
});

documentNodes.rows.addEventListener("click", (event) =>
{
  const button = event.target.closest("[data-open-order]");

  if (button)
  {
    openOrder(button.dataset.openOrder);
  }
});

document.getElementById("overdue-hook").addEventListener("click", (event) =>
{
  openOrder(event.currentTarget.dataset.orderId);
});

document.getElementById("delivery-hook").addEventListener("click", () =>
{
  resetFilters();
  state.tab = "all";
  state.day = "today";
  state.slot = "morning";
  state.shipping = "pending";
  updateView();
  document.getElementById("result-summary").scrollIntoView({ block: "center" });
});

document.getElementById("back-to-queue").addEventListener("click", () =>
{
  state.orderId = "";
  writeUrlState(true);
  updateView(false);
  if (state.workspace === "aftercare")
  {
    const heading = document.getElementById("aftercare-title");
    heading.tabIndex = -1;
    heading.focus();
    return;
  }

  const returnButton = [...documentNodes.rows.querySelectorAll("[data-open-order]")]
    .find((button) => button.dataset.openOrder === lastOpenedOrderId);

  if (returnButton)
  {
    returnButton.focus();
  }
  else
  {
    document.getElementById("page-title").focus();
  }
});

document.getElementById("prepare-button").addEventListener("click", () =>
{
  const order = orders.find((candidate) => candidate.id === state.orderId);
  setText("prepare-dialog-copy", `${order.id} akan berubah dari Siap Diproses menjadi Sedang Disiapkan. Status pembayaran ${paymentStatusLabels[order.payment]} tetap dipertahankan.`);
  documentNodes.prepareDialog.returnValue = "cancel";
  documentNodes.prepareDialog.showModal();
});

documentNodes.prepareDialog.addEventListener("click", (event) =>
{
  if (event.target !== documentNodes.prepareDialog)
  {
    return;
  }

  const bounds = documentNodes.prepareDialog.getBoundingClientRect();
  const outside = event.clientX < bounds.left || event.clientX > bounds.right ||
    event.clientY < bounds.top || event.clientY > bounds.bottom;

  if (outside)
  {
    documentNodes.prepareDialog.close("cancel");
  }
});

documentNodes.prepareDialog.addEventListener("close", () =>
{
  if (documentNodes.prepareDialog.returnValue !== "prepare")
  {
    return;
  }

  const order = orders.find((candidate) => candidate.id === state.orderId);
  const allowed = canStartPreparation(order);

  if (!allowed)
  {
    return;
  }

  order.status = "preparing";
  order.wasSimulated = true;
  order.history.push({
    label: "Simulasi mulai disiapkan",
    actor: state.role === "superadmin" ? "SuperAdmin RylVa" : "Admin RylVa",
    time: snapshotAt.toISOString()
  });
  document.dispatchEvent(new CustomEvent("orders:prepared", { detail: { orderId: order.id } }));
  updateView();
  const result = document.getElementById("detail-action-result");
  result.tabIndex = -1;
  result.focus();
});

document.getElementById("reset-filters").addEventListener("click", resetFilters);
document.getElementById("empty-reset").addEventListener("click", resetFilters);
document.getElementById("refresh-button").addEventListener("click", refreshOrders);
document.getElementById("retry-button").addEventListener("click", refreshOrders);

["previous", "next"].forEach((direction) =>
{
  document.getElementById(`${direction}-page`).addEventListener("click", () =>
  {
    state.page += direction === "next" ? 1 : -1;
    updateView();
    document.getElementById("result-summary").scrollIntoView({ block: "center" });
  });
});

document.getElementById("sidebar-toggle").addEventListener("click", (event) =>
{
  const collapsed = documentNodes.sidebar.classList.toggle("sidebar-collapsed");
  event.currentTarget.setAttribute("aria-expanded", String(!collapsed));
  event.currentTarget.setAttribute("aria-label", collapsed ? "Besarkan sidebar" : "Kecilkan sidebar");
});

documentNodes.menuOpen.addEventListener("click", () => setMobileMenu(true));
documentNodes.menuClose.addEventListener("click", () => setMobileMenu(false));
documentNodes.backdrop.addEventListener("click", () => setMobileMenu(false));

document.addEventListener("keydown", (event) =>
{
  if (event.key === "Escape" && documentNodes.menuOpen.getAttribute("aria-expanded") === "true")
  {
    setMobileMenu(false);
  }

  if (event.key === "Tab" && documentNodes.menuOpen.getAttribute("aria-expanded") === "true")
  {
    const focusableNodes = [...documentNodes.sidebar.querySelectorAll('a[href], button:not([disabled])')]
      .filter((node) => !node.hidden && node.getClientRects().length > 0);
    const firstNode = focusableNodes[0];
    const lastNode = focusableNodes.at(-1);

    if (event.shiftKey && document.activeElement === firstNode)
    {
      event.preventDefault();
      lastNode.focus();
    }
    else if (!event.shiftKey && document.activeElement === lastNode)
    {
      event.preventDefault();
      firstNode.focus();
    }
  }
});

window.addEventListener("resize", () =>
{
  const isDesktop = window.innerWidth >= 1024;
  documentNodes.sidebar.inert = !isDesktop && documentNodes.menuOpen.getAttribute("aria-expanded") !== "true";

  if (isDesktop && documentNodes.menuOpen.getAttribute("aria-expanded") === "true")
  {
    setMobileMenu(false);
    documentNodes.sidebar.inert = false;
  }
});

window.addEventListener("popstate", () =>
{
  state = readUrlState();
  updateView(false);
});

document.querySelectorAll("[data-role-link]").forEach((link) =>
{
  if (state.role === "superadmin")
  {
    const url = new URL(link.href);
    url.searchParams.set("role", "superadmin");
    link.href = url.href;
  }
});

document.querySelectorAll("[data-superadmin-only]").forEach((node) =>
{
  node.hidden = state.role !== "superadmin";
});

setText("preview-role", state.role === "superadmin" ? "Pratinjau SuperAdmin" : "Pratinjau Admin");
setText("profile-name", state.role === "superadmin" ? "SuperAdmin RylVa" : "Admin RylVa");
documentNodes.sidebar.inert = window.innerWidth < 1024;
document.addEventListener("DOMContentLoaded", () => updateView(), { once: true });
