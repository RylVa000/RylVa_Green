"use strict";

// This prototype never sends files, messages, payments, or order changes to a server.
const workflowPanel = document.getElementById("workflow-panel");
const workflowDialog = document.getElementById("workflow-confirm");
const workflowProfiles =
{
  admin: { name: "Admin RylVa", role: "admin" },
  adminDian: { name: "Admin Dian", role: "admin" },
  superadmin: { name: "SuperAdmin RylVa", role: "superadmin" },
  superadminDian: { name: "SuperAdmin Dian", role: "superadmin" }
};
const requestStatusLabels =
{
  requested: "Menunggu keputusan",
  approved: "Disetujui",
  processing: "Diproses",
  success: "Berhasil",
  failed: "Gagal, perlu tindak lanjut",
  rejected: "Ditolak",
  open: "Dalam tinjauan",
  appeal: "Banding ke SuperAdmin",
  resolving: "Penyelesaian berlangsung",
  closed: "Selesai"
};
let workflowProfile = state.role === "superadmin" ? "superadmin" : "admin";
let activeEditor = null;
let pendingConfirmation = null;
let saveInProgress = false;
let failNextSave = new URLSearchParams(location.search).get("actionState") === "error";
const workflowMessages = new Map();
const localEvidenceUrls = new Set();

function workNode(tag, className = "", textContent = "")
{
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = textContent;
  return node;
}

function workButton(label, action, primary = false)
{
  const button = workNode("button", primary
    ? "queue-button queue-button--primary"
    : "queue-button", label);
  button.type = "button";
  button.dataset.workAction = action;
  return button;
}

function workNotice(text, warning = false)
{
  const notice = workNode("p", warning ? "work-notice work-notice--warning" : "work-notice");
  notice.append(workIcon(warning ? "alert" : "info"), workNode("span", "", text));
  return notice;
}

function workIcon(name)
{
  const namespace = "http://www.w3.org/2000/svg";
  const icon = document.createElementNS(namespace, "svg");
  const reference = document.createElementNS(namespace, "use");
  icon.setAttribute("class", "icon work-signal-icon");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("focusable", "false");
  reference.setAttribute("href", `#i-${name}`);
  icon.append(reference);
  return icon;
}

function setWorkSignal(node, tone, icon)
{
  const label = node.textContent;
  const tones = ["neutral", "info", "progress", "success", "warning", "critical"];
  node.classList.remove(...tones.map((value) => `work-signal--${value}`));
  node.classList.add("work-signal", `work-signal--${tone}`);
  node.replaceChildren(workIcon(icon), document.createTextNode(label));
  return node;
}

function workSignal(label, tone = "neutral", icon = "info")
{
  return setWorkSignal(workNode("span", "", label), tone, icon);
}

function orderSignal(order)
{
  const signals =
  {
    ready: ["info", "orders"],
    preparing: ["progress", "box"],
    attention: ["warning", "alert"],
    shipping: ["info", "truck"],
    delivered: ["success", "check"],
    complete: ["success", "check"],
    cancelled: ["neutral", "close"]
  };
  return signals[order.status] || ["neutral", "info"];
}

function paymentSignal(order)
{
  const signals =
  {
    paid: ["success", "check"],
    unpaid: ["info", "clock"],
    review: ["warning", "alert"],
    refundProcessing: ["info", "refresh"],
    refundedPartial: ["info", "refresh"],
    refundedFull: ["neutral", "refresh"],
    dispute: ["critical", "alert"]
  };
  return signals[order.payment] || ["neutral", "info"];
}

function renderStatusSignals(order)
{
  const shippingSignals =
  {
    pending: ["neutral", "box"],
    shipping: ["info", "truck"],
    delivered: ["success", "check"],
    issue: ["critical", "alert"],
    returned: ["warning", "refresh"]
  };
  setWorkSignal(document.getElementById("detail-order-status"), ...orderSignal(order));
  setWorkSignal(document.getElementById("detail-payment-status"), ...paymentSignal(order));
  setWorkSignal(document.getElementById("detail-shipping-status"), ...shippingSignals[order.shipping]);

  const urgency = document.getElementById("detail-urgency");
  const isUrgent = Boolean(getUrgency(order)) && !["cancelled", "complete"].includes(order.status);
  setWorkSignal(urgency, isUrgent ? "warning" : "neutral", isUrgent ? "clock" : "info");
}

function renderQueueSignals()
{
  for (const row of document.querySelectorAll("#order-rows tr"))
  {
    const orderId = row.querySelector("[data-open-order]")?.dataset.openOrder;
    const order = orders.find((candidate) => candidate.id === orderId);

    if (order)
    {
      setWorkSignal(row.querySelector('[data-field="orderStatus"]'), ...orderSignal(order));
      setWorkSignal(row.querySelector('[data-field="paymentStatus"]'), ...paymentSignal(order));
    }
  }
}

function workHeading(title, copy = "")
{
  const heading = workNode("div", "work-panel-heading");
  const text = workNode("div");
  text.append(workNode("h3", "", title));

  if (copy)
  {
    text.append(workNode("p", "", copy));
  }

  heading.append(text);
  return heading;
}

function workFacts(entries)
{
  const list = workNode("dl", "work-facts");

  for (const [label, value] of entries)
  {
    const pair = workNode("div");
    const description = workNode("dd");
    description.append(value instanceof Node ? value : document.createTextNode(String(value)));
    pair.append(workNode("dt", "", label), description);
    list.append(pair);
  }

  return list;
}

function currentOrder()
{
  return orders.find((order) => order.id === state.orderId);
}

function currentActor()
{
  return workflowProfiles[workflowProfile].name;
}

function isPerishable(order)
{
  return order.items.some((item) => item.sku.startsWith("DEMO-FL") || item.sku.startsWith("DEMO-PL"));
}

function remainingRefund(order)
{
  const reserved = order.operations.refunds
    .filter((refund) => refund.status !== "rejected")
    .reduce((total, refund) => total + refund.amount, 0);
  return Math.max(0, order.operations.paidAmount - reserved);
}

function refundableLimit(order)
{
  const operations = order.operations;
  const entitlement = operations.refundEntitlement || (order.shipping === "returned"
    ? getFulfillmentSubtotal(order)
    : operations.paidAmount);
  const allocated = operations.refunds.filter((refund) => refund.status !== "rejected")
    .reduce((sum, refund) => sum + refund.amount, 0);
  return Math.max(0, Math.min(remainingRefund(order), entitlement - allocated));
}

function syncRefundPayment(order)
{
  const refunds = order.operations.refunds;
  const returned = refunds.filter((refund) => refund.status === "success")
    .reduce((total, refund) => total + refund.amount, 0);

  if (refunds.some((refund) => ["approved", "processing", "failed"].includes(refund.status)))
  {
    order.payment = "refundProcessing";
  }
  else if (returned > 0)
  {
    order.payment = returned >= order.operations.paidAmount ? "refundedFull" : "refundedPartial";
  }
  else if (order.operations.paidAmount > 0)
  {
    order.payment = "paid";
  }
}

function addWorkHistory(order, label, reason)
{
  order.history.push({
    label,
    actor: currentActor(),
    time: snapshotAt.toISOString(),
    reason: reason || "",
    before: activeEditor ? activeEditor.before : "",
    after: `${orderStatusLabels[order.status]} / ${paymentStatusLabels[order.payment]} / ${shippingStatusLabels[order.shipping]}`
  });
}

function createRefund(order, amount, reason, automatic = false)
{
  if (!Number.isInteger(amount) || amount <= 0 || amount > remainingRefund(order))
  {
    throw new Error("Nominal refund melampaui sisa pembayaran yang dapat dikembalikan.");
  }

  const refund =
  {
    id: `${order.id}-RF-${order.operations.refunds.length + 1}`,
    amount,
    reason,
    maker: automatic ? "Sistem" : currentActor(),
    status: automatic ? "processing" : "requested",
    createdAt: snapshotAt.toISOString(),
    attempts: 0,
    method: order.method === "Online" ? "Metode pembayaran asal" : "Transfer atas nama pelanggan"
  };
  order.operations.refunds.push(refund);
  syncRefundPayment(order);
  return refund;
}

function openWorkCase(order, code, title, description)
{
  order.operations.previousState = order.status;
  order.caseInfo =
  {
    code,
    title,
    description,
    owner: currentActor(),
    deadline: new Date(snapshotAt.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    previousStatus: orderStatusLabels[order.status],
    nextAction: "Catat kontak, bukti, dan persetujuan sebelum memilih penyelesaian."
  };
  order.status = "attention";
}

function prepareWorkflowData()
{
  orders.push(makeOrder({
    id: "RV-261102-V4H8B6",
    customer: "Tari Puspita",
    createdAt: "2026-11-02T08:00:00+07:00",
    paidAt: "2026-11-02T08:05:00+07:00",
    status: "cancelled",
    shipping: "returned",
    deliveryDay: "2026-11-02",
    tracking: "DEMO-RETUR-03",
    items:
    [
      makeItem("Pot terakota", 45000, "DEMO-GD-04", "Diameter 18 cm", 2, "unit")
    ]
  }));
  orders.push(makeOrder({
    id: "RV-261102-S5D7K3",
    customer: "Hana Safitri",
    createdAt: "2026-11-02T08:20:00+07:00",
    paidAt: "2026-11-02T08:25:00+07:00",
    status: "delivered",
    shipping: "delivered",
    deliveryDay: "2026-11-02",
    tracking: "DEMO-KURIR-04",
    items:
    [
      makeItem("Buket mawar", 260000, "DEMO-FL-29", "12 tangkai, wrapping putih", 1, "buket")
    ]
  }));
  orders.push(makeOrder({
    id: "RV-261102-E6G8R4",
    customer: "Galih Ramadhan",
    createdAt: "2026-11-02T08:10:00+07:00",
    paidAt: "2026-11-02T08:15:00+07:00",
    status: "shipping",
    shipping: "issue",
    deliveryDay: todayKey,
    tracking: "DEMO-KURIR-05",
    items:
    [
      makeItem("Peace lily", 149000, "DEMO-PL-05", "Ukuran M, pot putih", 4, "pot")
    ]
  }));

  for (const order of orders)
  {
    order.operations =
    {
      paidAmount: order.payment === "paid" ? getTotal(order) : 0,
      refunds: [],
      cancellation: null,
      complaint: null,
      deliveredAt: order.shipping === "delivered" ? "2026-11-02T14:30:00+07:00" : "",
      evidence: [],
      notes: [],
      attempts: 0,
      revision: 0,
      previousState: order.caseInfo?.previousStatus === "Sedang Disiapkan" ? "preparing" : "ready"
    };
  }

  const cancellationOrder = orders.find((order) => order.customer === "Bima Aditya");
  cancellationOrder.operations.cancellation =
  {
    status: "requested",
    reason: "Pelanggan meminta pembatalan sebelum barang dikemas.",
    source: "Pelanggan",
    createdAt: "2026-11-03T10:50:00+07:00",
    deadline: "2026-11-03T12:50:00+07:00"
  };
  const complaintOrder = orders.find((order) => order.customer === "Dimas Prakoso");
  complaintOrder.status = "delivered";
  complaintOrder.operations.complaint =
  {
    status: "open",
    category: "Rusak",
    description: "Retak pada sisi pot saat diterima. Dua lampiran contoh dicatat oleh pelanggan.",
    createdAt: "2026-11-02T16:00:00+07:00",
    deadline: "2026-11-03T16:00:00+07:00",
    evidence: ["kondisi-pot-contoh.jpg", "kemasan-contoh.jpg"],
    appeals: 0
  };
  const returnedOrder = orders.find((order) => order.customer === "Tari Puspita");
  returnedOrder.operations.refunds.push({
    id: "DEMO-RF-RETUR",
    amount: 90000,
    reason: "Produk tahan lama telah kembali dan lolos pemeriksaan kelayakan.",
    maker: "Admin Dian",
    checker: "SuperAdmin Dian",
    status: "failed",
    createdAt: "2026-11-02T16:00:00+07:00",
    attempts: 3,
    method: "Metode pembayaran asal",
    failure: "Layanan pembayaran tidak merespons. Periksa sebelum mencoba ulang."
  });
  syncRefundPayment(returnedOrder);
  const appealOrder = orders.find((order) => order.customer === "Hana Safitri");
  appealOrder.operations.complaint =
  {
    status: "appeal",
    category: "Layu / tidak segar",
    description: "Pelanggan mengajukan banding dengan bukti tambahan setelah keputusan pertama.",
    createdAt: "2026-11-02T17:00:00+07:00",
    deadline: "2026-11-03T17:00:00+07:00",
    rejectionReason: "Bukti pertama belum cukup menjelaskan waktu penerimaan.",
    evidence: ["bunga-contoh.jpg", "waktu-terima-contoh.jpg"],
    appeals: 1
  };
  const lostOrder = orders.find((order) => order.customer === "Galih Ramadhan");
  openWorkCase(lostOrder, "PH-05", "Paket dinyatakan hilang", "Investigasi contoh mengonfirmasi kehilangan oleh kurir.");
  const refund = createRefund(lostOrder, getTotal(lostOrder), "Barang hilang; refund penuh setelah investigasi.");
  refund.maker = "Admin Dian";
  refund.cancelOnApproval = true;
  returnedOrder.operations.refunds[0].deadline = "2026-11-04T16:00:00+07:00";

  for (const [code, id, customer] of [
    ["PH-01", "RV-261103-B8F4N6", "Nadia Wibowo"],
    ["PH-02", "RV-261103-G7M5T9", "Reno Mahendra"]
  ])
  {
    const example = makeOrder({
      id,
      customer,
      createdAt: "2026-11-03T09:00:00+07:00",
      paidAt: "2026-11-03T10:00:00+07:00",
      deliveryDay: tomorrowKey,
      stockCommitted: false,
      items:
      [
        makeItem("Peace lily", 149000, "DEMO-PL-05", "Ukuran M", 2, "pot")
      ],
      operations:
      {
        paidAmount: 0,
        refunds: [],
        cancellation: null,
        complaint: null,
        deliveredAt: "",
        evidence: [],
        notes: [],
        attempts: 0,
        revision: 0,
        previousState: "ready"
      }
    });
    example.operations.paidAmount = getTotal(example);
    openWorkCase(example, code, code === "PH-01" ? "Pembayaran masuk, stok tidak cukup" : "Pembayaran setelah kedaluwarsa",
      code === "PH-01" ? "Alokasi stok contoh belum berhasil. Tawarkan opsi yang disetujui pelanggan."
        : "Pembayaran terverifikasi setelah pesanan kedaluwarsa. Periksa ulang kelayakan sebelum pemulihan.");
    orders.push(example);
  }
}

function requestEntries(order)
{
  const entries = [];
  const operations = order.operations;

  if (operations.cancellation)
  {
    entries.push({
      kind: "cancellation",
      title: "Permintaan pembatalan",
      ...operations.cancellation
    });
  }

  for (const refund of operations.refunds)
  {
    entries.push({ kind: "refund", title: `Refund ${rupiah(refund.amount)}`, ...refund });
  }

  if (operations.complaint)
  {
    entries.push({ kind: "complaint", title: `Komplain: ${operations.complaint.category}`, ...operations.complaint });
  }

  return entries;
}

function renderRequest(order, entry, globalView = false)
{
  const row = workNode("article", "work-request");
  row.classList.toggle("work-request--urgent", entry.status === "failed");
  const text = workNode("div");
  const actions = workNode("div", "work-actions");
  text.append(workNode(globalView ? "h3" : "h4", "", entry.title));
  text.append(workNode("p", "", globalView ? `${order.id} — ${order.customer}` : entry.reason || entry.description || ""));
  const requestTone = ["success", "closed", "approved"].includes(entry.status) ? "success"
    : entry.status === "failed" ? "critical"
    : ["requested", "appeal"].includes(entry.status) ? "warning"
    : entry.status === "rejected" ? "neutral" : "info";
  const requestIcon = requestTone === "success" ? "check"
    : ["critical", "warning"].includes(requestTone) ? "alert"
    : requestTone === "neutral" ? "close" : "clock";
  const statusLine = workNode("p", "work-request-status");
  statusLine.append(workSignal(requestStatusLabels[entry.status], requestTone, requestIcon));
  text.append(statusLine);

  if (entry.deadline && !["closed", "rejected", "approved"].includes(entry.status))
  {
    text.append(workNode("p", "work-deadline", `Tenggat ${formatDate(entry.deadline)}, ${formatTime(entry.deadline)} WIB`));
  }

  if (globalView)
  {
    const open = workButton("Tinjau", "open-request");
    open.dataset.orderId = order.id;
    actions.append(open);
  }
  else if (entry.kind === "cancellation" && entry.status === "requested")
  {
    actions.append(workButton("Tinjau pembatalan", "cancel-decision"));
  }
  else if (entry.kind === "refund")
  {
    const action = entry.status === "requested" ? "refund-decision"
      : entry.status === "failed" ? "refund-retry"
      : ["approved", "processing"].includes(entry.status) ? "refund-check" : "";
    text.append(workNode("p", "", `Pengaju: ${entry.maker}. Metode: ${entry.method}.`));

    if (entry.failure)
    {
      text.append(workNotice(entry.failure, true));
    }

    if (action)
    {
      const button = workButton(action === "refund-decision" ? "Tinjau refund"
        : action === "refund-retry" ? "Tindak lanjuti" : "Periksa hasil", action);
      button.dataset.requestId = entry.id;
      actions.append(button);
    }
  }
  else if (entry.kind === "complaint" && !["closed", "rejected"].includes(entry.status))
  {
    if (entry.status === "resolving" && entry.resolution === "replace")
    {
      actions.append(workButton("Selesaikan pengganti", "replacement-complete"));
    }
    else if (entry.status === "resolving")
    {
      text.append(workNode("p", "", "Menunggu hasil refund. Komplain ditutup setelah refund berhasil."));
    }
    else
    {
      actions.append(workButton("Tinjau komplain", "complaint-decision"));
    }
    text.append(workNode("p", "", `${entry.evidence.length} lampiran ilustrasi: ${entry.evidence.join(", ")}`));
    renderEvidence(text, order.operations.evidence.filter((attachment) =>
    {
      return ["complaint-request", "appeal"].includes(attachment.source);
    }));
  }
  else if (entry.kind === "complaint" && entry.status === "rejected" && entry.appeals === 0)
  {
    actions.append(workButton("Catat permintaan banding", "appeal"));
  }

  row.append(text, actions);
  return row;
}

function renderAftercareList()
{
  const entries = getAvailableOrders().flatMap((order) =>
  {
    return requestEntries(order).map((entry) => ({ order, entry }));
  });
  const pending = entries.filter(({ entry }) => !["closed", "success", "rejected", "approved"].includes(entry.status));
  setText("aftercare-count", pending.length);
  const container = document.getElementById("aftercare-list");
  const selected = entries
    .filter(({ entry }) => state.aftercareFilter === "all" || entry.kind === state.aftercareFilter)
    .sort((first, second) =>
    {
      const firstFailed = first.entry.status === "failed";
      const secondFailed = second.entry.status === "failed";

      if (firstFailed !== secondFailed)
      {
        return firstFailed ? -1 : 1;
      }

      return new Date(first.entry.deadline || "2099-01-01") - new Date(second.entry.deadline || "2099-01-01");
    });
  container.replaceChildren(...selected.map(({ order, entry }) => renderRequest(order, entry, true)));

  if (selected.length === 0)
  {
    container.append(workNode("p", "work-empty", "Tidak ada permintaan pada kategori ini. Permintaan baru akan muncul di sini."));
  }

  document.querySelectorAll("[data-aftercare-filter]").forEach((button) =>
  {
    button.setAttribute("aria-pressed", String(button.dataset.aftercareFilter === state.aftercareFilter));
  });
}

function renderFulfillment(order)
{
  const layout = workNode("div", "work-layout");
  const main = workNode("section", "work-sheet");
  const aside = workNode("aside", "work-sheet");
  main.append(workHeading("Persiapan dan pengiriman", "Periksa isi, kemasan, dan bukti sebelum setiap perpindahan tahap."));
  main.append(renderFulfillmentProgress(order));

  for (const item of getFulfillmentItems(order).filter((candidate) => candidate.quantity > 0))
  {
    const row = workNode("div", "work-request");
    const text = workNode("div");
    text.append(workNode("h4", "", item.name), workNode("p", "", `${item.variant}. ${item.quantity} ${item.unit}.`));
    row.append(text, workNode("span", "secondary-text", item.sku));
    main.append(row);
  }

  if (order.operations.fulfillmentPlan)
  {
    main.append(workNotice(order.operations.fulfillmentPlan));
  }

  if (order.operations.collectionAdjustment)
  {
    main.append(collectionAdjustmentNotice(order));
  }

  const actions = workNode("div", "work-actions work-fulfillment-actions");

  if (order.status === "preparing")
  {
    actions.append(workButton("Serahkan ke kurir", "handoff", true), workButton("Barang tidak tersedia", "stock-issue"));
  }

  if (order.status === "shipping")
  {
    actions.append(workButton("Catat bukti terkirim", "delivered", true), workButton("Catat kendala", "shipping-issue"));
  }

  if (["ready", "preparing"].includes(order.status))
  {
    actions.append(workButton("Ubah jadwal / alamat", "schedule"));
  }

  main.append(actions);
  aside.append(workHeading("Ketentuan pesanan"));
  const needsHandoff = order.status === "preparing";
  const hasTracking = order.tracking && order.tracking !== "Belum diisi";
  const hasHandoff = Boolean(order.operations.handoff);
  const photoCount = order.operations.handoff?.evidence.length || 0;
  const needsPhoto = isPerishable(order) && photoCount === 0;
  const reference = hasTracking ? order.tracking : needsHandoff
    ? workSignal("Wajib diisi", "warning", "orders")
    : "Belum diisi";
  const handoff = hasHandoff
    ? workSignal("Sudah dicatat", "success", "check")
    : needsHandoff ? workSignal("Belum dicatat", "warning", "clock") : "Belum dicatat";
  aside.append(workFacts([
    ["Penanganan", isPerishable(order)
      ? workSignal("Mudah layu", "warning", "leaf")
      : workSignal("Tahan lama", "neutral", "box")],
    ["Layanan", order.courier],
    ["Tanggal", formatDate(`${order.deliveryDay}T12:00:00+07:00`)],
    ["Slot", slotDefinitions[order.slot].hours],
    ["Referensi / resi", reference],
    ["Bukti serah", handoff]
  ]));

  if (needsHandoff)
  {
    const checklist = workNode("section", "work-handoff-checklist");
    const requirements =
    [
      { label: "Layanan, resi, dan waktu serah", complete: hasHandoff && hasTracking, icon: "truck" },
      { label: "Konfirmasi isi dan kemasan", complete: hasHandoff, icon: "box" }
    ];

    if (isPerishable(order))
    {
      requirements.push({ label: "Minimal 1 foto paket", complete: !needsPhoto, icon: "photo" });
    }

    const remaining = requirements.filter((requirement) => !requirement.complete).length;
    checklist.append(workNode("h4", "", remaining > 0
      ? `${remaining} syarat serah belum lengkap`
      : "Syarat serah lengkap"));
    const list = workNode("ul");

    for (const requirement of requirements)
    {
      const item = workNode("li", requirement.complete ? "is-complete" : "");
      item.append(
        workIcon(requirement.complete ? "check" : requirement.icon),
        workNode("span", "", requirement.label),
        workNode("span", "work-checklist-state", requirement.complete ? "Lengkap" : "Wajib")
      );
      list.append(item);
    }

    checklist.append(list, workNode("p", "", "Lengkapi melalui tombol “Serahkan ke kurir”."));
    aside.append(checklist);
  }

  aside.append(workNotice(isPerishable(order)
    ? "Mudah layu: gunakan layanan instan/same-day dan minimal satu foto paket saat serah ke kurir."
    : "Perubahan tanggal harus paling cepat H+1. Layanan dan ongkir pesanan tetap.", isPerishable(order)));

  if (order.shipping === "delivered")
  {
    const deadline = new Date(new Date(order.operations.deliveredAt).getTime() + 86400000);
    main.append(workNotice(
      `Bukti terkirim tercatat. Jendela komplain berakhir ${formatDate(deadline)}, ${formatTime(deadline)} WIB. ` +
      "Penyelesaian otomatis menunggu komplain terbuka selesai."
    ));
  }

  renderEvidence(main, order.operations.evidence);
  layout.append(main, aside);
  return layout;
}

function renderFulfillmentProgress(order)
{
  if (order.status === "cancelled")
  {
    return workNotice("Pemenuhan dihentikan. Status refund dipantau secara terpisah di Purnajual.", true);
  }

  const stages =
  [
    ["ready", "Siap diproses"],
    ["preparing", "Disiapkan"],
    ["shipping", "Dikirim"],
    ["delivered", "Terkirim"]
  ];
  const status = order.status === "attention" ? order.operations.previousState : order.status;
  const currentIndex = order.status === "complete" ? stages.length : stages.findIndex(([key]) => key === status);
  const progress = workNode("ol", "work-progress");
  progress.setAttribute("aria-label", "Tahap pemenuhan pesanan");

  stages.forEach(([key, label], index) =>
  {
    const isCurrent = index === currentIndex;
    const isDone = index < currentIndex;
    const isPaused = isCurrent && order.status === "attention";
    const step = workNode("li", isDone ? "is-complete" : isPaused ? "is-paused" : "");
    const marker = workNode("span", "work-step-marker", isDone ? "" : String(index + 1));
    marker.setAttribute("aria-hidden", "true");

    if (isDone)
    {
      marker.append(workIcon("check"));
    }
    else if (isPaused)
    {
      marker.replaceChildren(workIcon("alert"));
    }

    if (isCurrent)
    {
      step.setAttribute("aria-current", "step");
    }

    const caption = isDone ? "Selesai" : isPaused ? "Ditahan" : isCurrent
      ? "Tahap saat ini" : index === currentIndex + 1 ? "Berikutnya" : "Belum dimulai";
    step.append(marker, workNode("strong", "", label), workNode("span", "work-step-caption", caption));
    progress.append(step);
  });

  return progress;
}

function renderCase(order)
{
  const sheet = workNode("section", "work-sheet");

  if (!order.caseInfo)
  {
    sheet.append(workHeading("Tidak ada kasus terbuka"));
    sheet.append(workNode("p", "work-empty", "Pemenuhan dapat dilanjutkan sesuai tahap pesanan. Jika ada masalah, catat dari tab Pemenuhan."));
    return sheet;
  }

  const caseInfo = order.caseInfo;
  sheet.append(workHeading(`${caseInfo.code}: ${caseInfo.title}`, caseInfo.description));
  sheet.append(workFacts([
    ["Penanggung jawab", caseInfo.owner],
    ["Status sebelumnya", caseInfo.previousStatus],
    ["Tenggat tindakan awal", `${formatDate(caseInfo.deadline)}, ${formatTime(caseInfo.deadline)} WIB`],
    ["Respons pelanggan", "Maksimum 24 jam untuk opsi penyelesaian yang memerlukan respons"]
  ]));
  sheet.append(workNotice(caseInfo.nextAction, true));
  if (order.operations.contact)
  {
    const contact = order.operations.contact;
    sheet.append(workNotice(`Kontak terakhir: ${contact.channel}. ` +
      `${contact.response === "replied" ? "Pelanggan merespons" : "Belum ada respons"}. ${contact.note}`));
  }
  const actions = workNode("div", "work-actions");
  actions.append(workButton("Catat kontak pelanggan", "contact"));

  if (caseInfo.code === "PH-03")
  {
    if (state.role === "superadmin")
    {
      actions.append(workButton(order.operations.reconciliation ? "Tinjau persetujuan kedua" : "Verifikasi pembayaran",
        order.operations.reconciliation ? "reconcile-approve" : "reconcile", true));
    }
  }
  else
  {
    actions.append(workButton("Pilih penyelesaian", "resolve-case", true));
  }

  actions.append(workButton("Eskalasi ke SuperAdmin", "escalate"));
  sheet.append(actions);
  return sheet;
}

function renderOrderAftercare(order)
{
  const layout = workNode("div", "work-layout");
  const main = workNode("section", "work-sheet");
  main.append(workHeading("Pembatalan, refund, dan komplain", "Keputusan pesanan dan pengembalian dana dicatat secara terpisah."));
  if (order.operations.collectionAdjustment)
  {
    main.append(collectionAdjustmentNotice(order));
  }
  const entries = requestEntries(order);

  if (entries.length === 0)
  {
    main.append(workNode("p", "work-empty", "Belum ada permintaan untuk pesanan ini."));
  }

  for (const entry of entries)
  {
    main.append(renderRequest(order, entry));
  }

  const actions = workNode("div", "work-actions");

  if (["ready", "preparing", "shipping"].includes(order.status) && !order.operations.cancellation)
  {
    actions.append(workButton("Catat pembatalan", "cancel-request"));
  }

  const hasRefundBasis = order.caseInfo || order.operations.complaint || order.shipping === "returned" ||
    order.operations.refundEntitlement;

  if (refundableLimit(order) > 0 && order.payment !== "dispute" && hasRefundBasis)
  {
    actions.append(workButton("Ajukan refund", "refund-request"));
  }

  if (order.shipping === "delivered" && !order.operations.complaint && order.status !== "complete")
  {
    actions.append(workButton("Catat komplain", "complaint-request"));
  }

  main.append(actions);
  const aside = workNode("aside", "work-sheet");
  const returned = order.operations.refunds.filter((refund) => refund.status === "success")
    .reduce((sum, refund) => sum + refund.amount, 0);
  aside.append(workHeading("Pembayaran dan kewenangan"));
  aside.append(workFacts([
    ["Dibayar", rupiah(order.operations.paidAmount)],
    ["Refund berhasil", rupiah(returned)],
    ["Sisa dapat diajukan", rupiah(refundableLimit(order))],
    ["Batas Admin", rupiah(500000)]
  ]));
  aside.append(workNotice(
    "Pengaju tidak boleh menyetujui refund sendiri. Di atas Rp 500.000 memerlukan SuperAdmin. " +
    "Refund tidak otomatis menambah stok."
  ));

  if (order.method === "COD" && order.payment === "unpaid")
  {
    aside.append(workNotice("COD tetap Menunggu sampai penerimaan uang dikonfirmasi dengan bukti."));

    if (order.shipping === "delivered")
    {
      aside.append(workButton("Konfirmasi penerimaan COD", "cod"));
    }
  }

  layout.append(main, aside);
  return layout;
}

function renderActivity(order)
{
  const sheet = workNode("section", "work-sheet");
  sheet.append(workHeading("Aktivitas pesanan", "Alasan, pelaku, dan perubahan status membantu melanjutkan pekerjaan tanpa kehilangan konteks."));
  sheet.append(workButton("Tambah catatan internal", "note"));
  const list = workNode("ol", "work-timeline");
  const events = [{ label: "Pesanan dibuat", actor: "Pelanggan", time: order.createdAt }, ...order.history];

  for (const event of events.slice().reverse())
  {
    const row = workNode("li");
    row.append(workNode("p", "", event.label));
    row.append(workNode("small", "", `${event.actor}, ${formatDate(event.time)}, ${formatTime(event.time)} WIB`));

    if (event.reason)
    {
      row.append(workNode("p", "", event.reason));
    }

    if (event.before)
    {
      row.append(workNode("small", "", `Sebelum: ${event.before}. Sesudah: ${event.after}.`));
    }

    list.append(row);
  }

  sheet.append(list);
  return sheet;
}

function renderEvidence(container, evidence)
{
  if (!evidence.length)
  {
    return;
  }

  const attachments = workNode("div", "work-attachments");

  for (const attachment of evidence)
  {
    const figure = workNode("figure");
    const photo = workNode("img");
    photo.src = attachment.url;
    photo.alt = `Bukti lokal: ${attachment.name}`;
    const link = workNode("a");
    link.href = attachment.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.setAttribute("aria-label", `Buka foto bukti ${attachment.name}`);
    link.append(photo);
    figure.append(link, workNode("figcaption", "", attachment.name));
    attachments.append(figure);
  }

  container.append(attachments);
}

function renderWorkflowSurface()
{
  renderQueueSignals();
  const order = currentOrder();
  const isAftercare = !order && state.workspace === "aftercare";
  document.querySelector(".work-next-action").hidden = Boolean(activeEditor);
  documentNodes.queueView.hidden = Boolean(order) || isAftercare;
  document.getElementById("aftercare-view").hidden = !isAftercare;
  document.getElementById("order-workspaces").hidden = Boolean(order);
  renderAftercareList();
  document.querySelectorAll("[data-workspace]").forEach((button) =>
  {
    button.setAttribute("aria-pressed", String(button.dataset.workspace === state.workspace));
  });

  if (isAftercare)
  {
    setText("page-title", "Purnajual pesanan");
    setText("view-intro", "Dahulukan keputusan yang mendekati tenggat dan pengembalian dana yang gagal.");
  }

  if (!order)
  {
    activeEditor = null;
    return;
  }

  document.getElementById("back-to-queue").lastChild.textContent = state.workspace === "aftercare"
    ? "Kembali ke purnajual"
    : "Kembali ke antrean";

  if (["cancelled", "complete"].includes(order.status))
  {
    setText("detail-urgency", order.status === "cancelled" ? "Pemenuhan dihentikan" : "Riwayat pesanan tersimpan");
  }

  renderStatusSignals(order);

  const blockedCancellation = order.operations.cancellation?.status === "requested";
  document.getElementById("prepare-button").hidden = document.getElementById("prepare-button").hidden || blockedCancellation;
  const buttons = document.getElementById("detail-action-buttons");
  buttons.querySelectorAll("[data-work-action]").forEach((button) => button.remove());
  let nextAction = "";
  let nextLabel = "";

  if (blockedCancellation)
  {
    nextAction = "cancel-decision";
    nextLabel = "Tinjau pembatalan";
    setText("detail-action-copy", "Ada permintaan pembatalan. Putuskan terlebih dahulu sebelum melanjutkan pemenuhan.");
  }
  else if (order.status === "preparing")
  {
    nextAction = "handoff";
    nextLabel = "Serahkan ke kurir";
  }
  else if (order.status === "shipping")
  {
    nextAction = "delivered";
    nextLabel = "Catat bukti terkirim";
  }
  else if (order.status === "attention")
  {
    nextAction = "view-case";
    nextLabel = "Tinjau kasus";
  }
  else if (order.status === "delivered")
  {
    setText("detail-action-copy", "Pantau jendela komplain. Status selesai mengikuti konfirmasi pelanggan atau penutupan komplain yang sah.");
  }
  else if (order.status === "cancelled")
  {
    setText("detail-action-copy", "Pemenuhan dihentikan. Pantau refund secara terpisah dari status pembatalan.");
  }

  if (nextAction)
  {
    buttons.append(workButton(nextLabel, nextAction, true));
  }

  buttons.append(workButton("Tambah catatan", "note"));
  const feedback = document.getElementById("detail-action-result");
  feedback.hidden = !workflowMessages.has(order.id) && !order.wasSimulated;

  if (workflowMessages.has(order.id))
  {
    feedback.textContent = workflowMessages.get(order.id);
  }

  if (!feedback.hidden)
  {
    const message = feedback.textContent;
    const content = workNode("span");
    content.append(workNode("strong", "", "Perubahan tersimpan"), workNode("span", "", message));
    feedback.replaceChildren(workIcon("check"), content);
  }

  setText("detail-payment-note", order.method === "COD" && order.payment === "unpaid"
    ? "COD belum lunas. Konfirmasi penerimaan uang memerlukan nominal, referensi, dan bukti."
    : `${paymentStatusLabels[order.payment]}. Nilai transaksi memakai snapshot pesanan.`);
  if (order.operations.address)
  {
    setText("detail-address", order.operations.address);
  }
  const hasAdjustment = Boolean(order.operations.collectionAdjustment);
  document.getElementById("cod-adjustment-row").hidden = !hasAdjustment;
  document.getElementById("cod-adjustment-label").hidden = !hasAdjustment;
  document.getElementById("cod-adjustment-value").hidden = !hasAdjustment;

  if (hasAdjustment)
  {
    setText("cod-adjustment-value", `−${rupiah(order.operations.collectionAdjustment.reduction)}`);
    setText("detail-total", rupiah(getCollectibleTotal(order)));
  }
  const overview = document.querySelector("#detail-view > .detail-grid");
  overview.hidden = state.detailTab !== "overview";
  document.getElementById("detail-history-section").hidden = true;
  document.getElementById("detail-case").hidden = !order.caseInfo || state.detailTab !== "overview";
  workflowPanel.hidden = state.detailTab === "overview";
  document.querySelectorAll("[data-detail-tab]").forEach((button) =>
  {
    if (button.dataset.detailTab === state.detailTab)
    {
      button.setAttribute("aria-current", "page");
    }
    else
    {
      button.removeAttribute("aria-current");
    }
  });

  if (activeEditor && activeEditor.orderId === order.id && activeEditor.tab === state.detailTab)
  {
    document.getElementById("order-correction-surface")?.setAttribute("hidden", "");
    return;
  }

  activeEditor = null;
  const renderers =
  {
    fulfillment: renderFulfillment,
    case: renderCase,
    aftercare: renderOrderAftercare,
    activity: renderActivity
  };
  workflowPanel.replaceChildren();

  if (renderers[state.detailTab])
  {
    workflowPanel.append(renderers[state.detailTab](order));
  }
  renderTerminalCorrections(order);
}

function workField(name, label, kind = "text", options = {})
{
  return { name, label, kind, required: true, ...options };
}

function collectionAdjustmentNotice(order)
{
  const adjustment = order.operations.collectionAdjustment;
  return workNotice(`Penyesuaian COD disetujui pelanggan. Tagihan awal ${rupiah(getTotal(order))}, ` +
    `pengurangan ${rupiah(adjustment.reduction)}, jumlah ditagih ${rupiah(getCollectibleTotal(order))}. ` +
    `Dasar: ${adjustment.reason}. Referensi: ${adjustment.reference}. Pengurangan diterapkan sebelum penagihan COD.`);
}

function caseChoices(order)
{
  const code = order.caseInfo?.code;

  if (["PH-01", "PH-06"].includes(code))
  {
    return [
      ["substitute", "Substitusi setara / lebih murah"],
      ["partial", "Pemenuhan sebagian"],
      ["refund", order.operations.paidAmount > 0 ? "Refund penuh" : "Batalkan pesanan yang belum dibayar"]
    ];
  }

  if (code === "PH-02")
  {
    return [["restore", "Pulihkan setelah pemeriksaan"], ["refund", "Refund penuh"]];
  }

  if (code === "PH-05")
  {
    return [["replace", "Kirim pengganti tanpa biaya"], ["refund", "Ajukan refund penuh"]];
  }

  return [["retry", "Kirim ulang sesuai persetujuan"], ["return", "Catat paket telah kembali"], ["escalate", "Eskalasi untuk penilaian"]];
}

function getActionDefinition(action, order)
{
  const reference = workField("reference", "Referensi bukti / kontak", "text", { maxLength: 160 });
  const reason = workField("reason", "Alasan dan catatan keputusan", "textarea", { minLength: 10, wide: true });
  const consent = workField("consent", "Persetujuan pelanggan telah diperoleh dan dicatat", "checkbox");
  const photos = workField("photos", "Foto bukti", "files", {
    help: "JPG, PNG, atau WebP. Maksimum 5 foto, masing-masing 5 MB. Berkas hanya dibaca di tab ini.",
    wide: true
  });
  const time = workField("eventTime", "Waktu kejadian (WIB)", "datetime-local", { value: "2026-11-03T11:25" });
  const itemChoices = getFulfillmentItems(order)
    .map((item, index) => [String(index), `${item.name} — ${item.quantity} ${item.unit}`])
    .filter(([index]) => getFulfillmentItems(order)[Number(index)].quantity > 0);
  const definitions =
  {
    handoff:
    {
      title: "Serahkan ke kurir",
      tab: "fulfillment",
      copy: "Layanan mengikuti pilihan pelanggan. Pastikan paket benar-benar diterima kurir.",
      submit: "Tinjau penyerahan",
      fields:
      [
        workField("courier", "Layanan kurir", "text", { value: order.courier, readOnly: true }),
        workField("tracking", "Resi / nomor order pelacakan", "text", { maxLength: 100 }),
        time,
        { ...photos, required: isPerishable(order), minFiles: isPerishable(order) ? 1 : 0 },
        workField("packed", "Jumlah, varian, kartu ucapan, dan kondisi kemasan sudah sesuai", "checkbox"),
        reason
      ]
    },
    "stock-issue":
    {
      title: "Barang tidak tersedia",
      tab: "fulfillment",
      copy: "Pesanan akan ditahan sebagai PH-06. Selisih fisik dicatat sebagai permintaan penyesuaian stok beralasan.",
      fields:
      [
        workField("item", "Item terdampak", "select", { choices: itemChoices }),
        workField("quantity", "Jumlah tidak tersedia", "number", { min: 1, value: 1 }),
        reason,
        { ...photos, required: false, minFiles: 0 }
      ]
    },
    delivered:
    {
      title: "Catat bukti terkirim",
      tab: "fulfillment",
      copy: "Bukti ini memulai jendela komplain 24 jam. Status pembayaran COD tetap terpisah.",
      fields:
      [
        workField("recipient", "Nama penerima", "text", { maxLength: 100 }),
        time,
        reference,
        { ...photos, minFiles: 1 },
        reason
      ]
    },
    "shipping-issue":
    {
      title: "Catat kendala pengiriman",
      tab: "fulfillment",
      copy: "Pilih sebab berdasarkan bukti. Jenis produk tidak menjadi dasar penolakan refund otomatis.",
      fields:
      [
        workField("issue", "Jenis kendala", "select", {
          choices:
          [
            ["recipient", "Penerima tidak ada"],
            ["address", "Alamat tidak ditemukan"],
            ["courier", "Kurir gagal antar"],
            ["lost", "Barang hilang"],
            ["damaged", "Barang rusak"]
          ]
        }),
        workField("responsibility", "Dugaan tanggung jawab", "select", {
          choices: [["unknown", "Belum dapat ditentukan"], ["customer", "Pelanggan"], ["shop", "Toko / pemenuhan"], ["courier", "Kurir"]]
        }),
        reference,
        { ...photos, minFiles: 1 },
        reason
      ]
    },
    contact:
    {
      title: "Catat kontak pelanggan",
      submit: "Simpan catatan kontak",
      tab: "case",
      copy: "Catatan membantu staf berikutnya memahami respons pelanggan. Tidak ada pesan yang dikirim dari pratinjau ini.",
      fields:
      [
        workField("channel", "Kanal kontak", "select", { choices: [["phone", "Telepon"], ["chat", "Chat"], ["email", "Email"]] }),
        workField("response", "Hasil kontak", "select", { choices: [["replied", "Pelanggan merespons"], ["waiting", "Belum ada respons"]] }),
        reference,
        reason
      ]
    },
    escalate:
    {
      title: "Eskalasi ke SuperAdmin",
      tab: "case",
      copy: "Kasus tetap terbuka dan pemenuhan tetap ditahan sampai ada keputusan yang sah.",
      fields: [reason, reference]
    },
    "resolve-case":
    {
      title: "Pilih penyelesaian kasus",
      tab: "case",
      copy: "Harga snapshot tetap. Setiap perubahan pemenuhan memerlukan bukti dan persetujuan pelanggan.",
      fields:
      [
        workField("resolution", "Penyelesaian", "select", { choices: caseChoices(order), wide: true }),
        workField("item", "Item terdampak", "select", {
          choices: itemChoices,
          when: (values) => ["substitute", "partial"].includes(values.resolution)
        }),
        workField("quantity", "Jumlah tidak dipenuhi", "number", {
          min: 1,
          value: 1,
          when: (values) => values.resolution === "partial"
        }),
        workField("replacement", "Nama dan SKU pengganti", "text", {
          when: (values) => values.resolution === "substitute"
        }),
        workField("replacementPrice", "Harga pengganti per satuan (Rp)", "number", {
          min: 0,
          when: (values) => values.resolution === "substitute"
        }),
        workField("responsibility", "Tanggung jawab berdasarkan bukti", "select", {
          choices: [["unknown", "Belum dapat ditentukan"], ["shop", "Toko"], ["courier", "Kurir"], ["customer", "Pelanggan"]],
          when: () => ["PH-04", "PH-05", "PH-07"].includes(order.caseInfo?.code)
        }),
        workField("day", "Tanggal pemenuhan yang disepakati", "date", {
          value: order.deliveryDay,
          min: todayKey,
          when: (values) => ["restore", "retry", "replace"].includes(values.resolution)
        }),
        workField("slot", "Slot pemenuhan", "select", {
          choices: Object.entries(slotDefinitions).map(([key, slot]) => [key, `${slot.label}, ${slot.hours}`]),
          value: order.slot,
          when: (values) => ["restore", "retry", "replace"].includes(values.resolution)
        }),
        workField("returnConfirmed", "Paket benar-benar sudah kembali dan produk tahan lama layak dijual", "checkbox", {
          when: (values) => values.resolution === "return"
        }),
        workField("feasible", "Stok, layanan, ongkir, serta jadwal telah diperiksa dan tetap memenuhi syarat", "checkbox", {
          when: (values) => ["restore", "substitute", "partial", "retry", "replace"].includes(values.resolution)
        }),
        { ...consent, when: (values) => values.resolution !== "escalate" },
        reference,
        reason
      ]
    },
    schedule:
    {
      title: "Ubah jadwal atau alamat",
      tab: "fulfillment",
      copy: "Hanya sebelum Dikirim. Layanan dan ongkir harus tetap; jika berubah, gunakan pembatalan dan pesanan baru.",
      fields:
      [
        workField("day", "Tanggal kirim", "date", { value: order.deliveryDay, min: todayKey }),
        workField("slot", "Slot kirim", "select", {
          choices: Object.entries(slotDefinitions).map(([key, slot]) => [key, `${slot.label}, ${slot.hours}`]),
          value: order.slot
        }),
        workField("address", "Alamat penerima", "textarea", {
          value: order.operations.address || "Alamat demonstrasi, Kebayoran Baru, Jakarta Selatan.",
          wide: true
        }),
        workField("sameService", "Layanan kurir dan ongkir tetap sama setelah diperiksa", "checkbox"),
        consent,
        reference,
        reason
      ]
    },
    note:
    {
      title: "Tambah catatan internal",
      submit: "Simpan catatan",
      tab: "activity",
      copy: "Catatan hanya untuk staf. Sertakan konteks yang diperlukan dan hindari data pribadi yang tidak relevan.",
      fields: [{ ...reason, label: "Catatan internal" }]
    },
    "cancel-request":
    {
      title: "Catat pembatalan",
      tab: "aftercare",
      copy: "Pembatalan mengikuti tahap pesanan. Setelah dikirim, penghentian pengiriman tidak dijamin.",
      fields:
      [
        workField("source", "Dasar permintaan", "select", {
          choices: [["customer", "Permintaan pelanggan"], ["shop", "Kesalahan toko / stok fisik habis"]]
        }),
        reference,
        reason
      ]
    },
    "cancel-decision":
    {
      title: "Tinjau pembatalan",
      tab: "aftercare",
      copy: order.operations.cancellation?.reason || "Periksa tahap, kondisi barang, serta alasan permintaan.",
      fields:
      [
        workField("decision", "Keputusan", "select", { choices: [["approve", "Setujui"], ["reject", "Tolak dengan alasan"]] }),
        workField("notPacked", "Produk tahan lama belum dikemas atau diserahkan", "checkbox", {
          when: (values) => values.decision === "approve" && order.status === "preparing"
        }),
        reason
      ]
    },
    "refund-request":
    {
      title: "Ajukan refund",
      tab: "aftercare",
      copy: `Sisa hak refund yang belum terikat permintaan: ${rupiah(refundableLimit(order))}. Pengaju tidak dapat menyetujui sendiri.`,
      fields:
      [
        workField("amount", "Nominal refund (Rp)", "number", { min: 1, max: refundableLimit(order) }),
        reference,
        reason
      ]
    },
    "refund-decision":
    {
      title: "Tinjau pengajuan refund",
      tab: "aftercare",
      copy: "Periksa pengaju, nominal, dan penyebab sebelum membuat keputusan. Di atas Rp 500.000 hanya SuperAdmin.",
      fields:
      [
        workField("decision", "Keputusan", "select", { choices: [["approve", "Setujui dan proses"], ["reject", "Tolak dengan alasan"]] }),
        reason
      ]
    },
    "refund-retry":
    {
      title: "Tindak lanjuti refund gagal",
      tab: "aftercare",
      copy: "Periksa referensi transaksi agar tidak terjadi pengembalian ganda. Penyelesaian manual memerlukan bukti transfer.",
      fields:
      [
        workField("mode", "Tindakan", "select", { choices: [["retry", "Coba ulang ke metode asal"], ["manual", "Catat transfer manual berhasil"]] }),
        workField("bank", "Bank / e-wallet tujuan", "text", {
          when: (values) => values.mode === "manual"
        }),
        workField("accountName", "Nama pemilik rekening", "text", {
          value: order.customer,
          readOnly: true,
          when: (values) => values.mode === "manual"
        }),
        workField("accountNumber", "Nomor rekening / e-wallet contoh", "text", {
          help: "Gunakan nomor contoh. Riwayat pratinjau hanya menyimpan empat digit terakhir.",
          when: (values) => values.mode === "manual"
        }),
        reference,
        { ...photos, minFiles: 1, when: (values) => values.mode === "manual" },
        workField("verified", "Rekening atas nama pelanggan dan status transaksi terakhir sudah diverifikasi", "checkbox"),
        reason
      ]
    },
    "refund-check":
    {
      title: "Periksa hasil refund",
      tab: "aftercare",
      copy: "Pratinjau ini menyimulasikan respons pembayaran berhasil. Aplikasi produksi menerima hasil terverifikasi dari penyedia.",
      fields: [workField("verified", "Saya memahami bahwa hasil ini adalah simulasi lokal", "checkbox")]
    },
    "complaint-request":
    {
      title: "Catat komplain pelanggan",
      tab: "aftercare",
      copy: "Pengajuan dalam 24 jam sejak Terkirim. Foto minimal dua, kecuali kategori tidak diterima.",
      fields:
      [
        workField("category", "Kategori komplain", "select", {
          choices:
          [
            ["freshness", "Layu / tidak segar"],
            ["damaged", "Rusak"],
            ["wrong", "Salah / tidak sesuai pesanan"],
            ["missing", "Kurang item"],
            ["late", "Terlambat lebih dari dua jam"],
            ["notReceived", "Tidak diterima"]
          ]
        }),
        reference,
        { ...photos, minFiles: 2, when: (values) => values.category !== "notReceived" },
        reason
      ]
    },
    "complaint-decision":
    {
      title: order.operations.complaint?.status === "appeal" ? "Putuskan banding komplain" : "Tinjau komplain",
      tab: "aftercare",
      copy: "Nilai bukti dan pihak yang bertanggung jawab. Refund mengikuti maker-checker; keputusan banding oleh SuperAdmin bersifat final.",
      fields:
      [
        workField("resolution", "Resolusi", "select", {
          choices:
          [
            ["replace", "Kirim ulang / pengganti tanpa biaya"],
            ["partial", "Ajukan refund sebagian"],
            ["full", "Ajukan refund penuh"],
            ["reject", "Tolak dengan alasan"]
          ]
        }),
        workField("responsibility", "Tanggung jawab hasil tinjauan", "select", {
          choices: [["unknown", "Belum dapat ditentukan"], ["shop", "Toko / pemenuhan"], ["courier", "Kurir"], ["customer", "Pelanggan"]]
        }),
        workField("item", "Item terdampak", "select", {
          choices: itemChoices,
          when: (values) => values.resolution === "partial"
        }),
        workField("amount", "Nominal refund (Rp)", "number", {
          min: 1,
          when: (values) => values.resolution === "partial"
        }),
        reference,
        reason
      ]
    },
    appeal:
    {
      title: "Catat permintaan banding",
      tab: "aftercare",
      copy: "Hanya satu kali, dalam 24 jam setelah penolakan. Keputusan berikutnya menjadi kewenangan SuperAdmin.",
      fields: [reference, reason, { ...photos, minFiles: 1 }]
    },
    "replacement-complete":
    {
      title: "Selesaikan pengiriman pengganti",
      tab: "aftercare",
      copy: "Catat bukti pengganti sudah diterima dan penyelesaian disepakati pelanggan.",
      fields: [reference, { ...photos, minFiles: 1 }, consent, reason]
    },
    cod:
    {
      title: "Konfirmasi penerimaan COD",
      tab: "aftercare",
      copy: `Nominal wajib cocok dengan tagihan ${rupiah(getCollectibleTotal(order))}. Pengiriman terkirim tidak otomatis berarti pembayaran lunas.`,
      fields:
      [
        workField("amount", "Uang diterima (Rp)", "number", { min: 1 }),
        reference,
        time,
        { ...photos, minFiles: 1 },
        reason
      ]
    },
    reconcile:
    {
      title: "Verifikasi pembayaran",
      tab: "case",
      copy: "Khusus SuperAdmin. Bukti manual saat API tidak tersedia harus diperiksa SuperAdmin kedua.",
      fields:
      [
        workField("verification", "Sumber verifikasi", "select", {
          choices: [["api", "Respons API gateway terverifikasi (simulasi)"], ["manual", "Bukti dasbor resmi, API tidak tersedia"]]
        }),
        reference,
        workField("amount", "Nominal terverifikasi (Rp)", "number", { min: 1 }),
        { ...photos, minFiles: 1, when: (values) => values.verification === "manual" },
        workField("stockChecked", "Stok, validitas produk, jadwal, dan layanan sudah diperiksa", "checkbox"),
        workField("mfa", "Kode MFA pratinjau", "text", { help: "Enam digit contoh; jangan masukkan kode akun sungguhan.", maxLength: 6 }),
        reason
      ]
    },
    "reconcile-approve":
    {
      title: "Persetujuan kedua pembayaran",
      tab: "case",
      copy: "Penyetuju harus SuperAdmin yang berbeda dari pengaju. Bukti dan nominal tetap wajib diperiksa.",
      fields:
      [
        workField("verified", "Bukti dasbor resmi, nominal, stok, dan kelayakan pemenuhan sudah diverifikasi", "checkbox"),
        workField("mfa", "Kode MFA pratinjau", "text", { help: "Enam digit contoh, bukan kode akun sungguhan.", maxLength: 6 }),
        reason
      ]
    }
  };

  return definitions[action];
}

function permissionFailure(action, order, requestId)
{
  const cancellationPending = order.operations.cancellation?.status === "requested";
  const refund = order.operations.refunds.find((candidate) => candidate.id === requestId);

  if (["handoff", "stock-issue"].includes(action) && order.status !== "preparing")
  {
    return "Tindakan ini hanya tersedia ketika pesanan Sedang Disiapkan.";
  }

  if (action === "handoff" && cancellationPending)
  {
    return "Putuskan permintaan pembatalan sebelum menyerahkan paket.";
  }

  if (action === "handoff" && !order.stockCommitted)
  {
    return "Alokasi stok belum dikomit. Selesaikan kasus terlebih dahulu.";
  }

  if (action === "handoff" && order.method !== "COD" &&
    !["paid", "refundedPartial", "refundProcessing"].includes(order.payment))
  {
    return "Pembayaran belum memenuhi syarat penyerahan.";
  }

  if (action === "handoff" && order.method === "COD" && !order.codValidated)
  {
    return "Checkout COD belum tervalidasi.";
  }

  if (action === "cancel-decision" && order.operations.cancellation?.status !== "requested")
  {
    return "Permintaan pembatalan ini tidak lagi menunggu keputusan.";
  }

  if (action === "complaint-decision" && !["open", "appeal"].includes(order.operations.complaint?.status))
  {
    return "Komplain ini tidak lagi menunggu keputusan.";
  }

  if (action === "replacement-complete" && (order.operations.complaint?.status !== "resolving" ||
    order.operations.complaint?.resolution !== "replace"))
  {
    return "Penyelesaian ini memerlukan pengiriman pengganti yang aktif.";
  }

  if (["delivered", "shipping-issue"].includes(action) && order.status !== "shipping")
  {
    return "Tindakan pengiriman hanya tersedia untuk pesanan Dikirim.";
  }

  if (action === "schedule" && !["ready", "preparing"].includes(order.status))
  {
    return "Jadwal dan alamat tidak dapat diubah setelah paket diserahkan.";
  }

  if (["contact", "escalate", "resolve-case", "reconcile", "reconcile-approve"].includes(action) && !order.caseInfo)
  {
    return "Kasus ini sudah selesai. Muat tampilan pesanan terbaru.";
  }

  if (["reconcile", "reconcile-approve"].includes(action) && state.role !== "superadmin")
  {
    return "Rekonsiliasi pembayaran hanya dapat dilakukan SuperAdmin.";
  }

  if (action === "reconcile-approve" && order.operations.reconciliation?.maker === currentActor())
  {
    return "Pengaju tidak boleh memberikan persetujuan kedua. Gunakan akun SuperAdmin lain.";
  }

  if (action === "resolve-case" && order.caseInfo?.code === "PH-03")
  {
    return "Pembayaran perlu verifikasi terkontrol oleh SuperAdmin, bukan perubahan status langsung.";
  }

  if (action === "refund-decision")
  {
    if (!refund || refund.status !== "requested")
    {
      return "Pengajuan refund ini tidak lagi menunggu keputusan.";
    }

    if (refund.maker === currentActor())
    {
      return "Anda adalah pengaju refund ini. Admin lain atau SuperAdmin harus meninjaunya.";
    }

    if (refund.amount > 500000 && state.role !== "superadmin")
    {
      return "Refund di atas Rp 500.000 hanya dapat diputuskan SuperAdmin.";
    }
  }

  if (["refund-request", "refund-decision", "refund-retry", "refund-check"].includes(action) && order.payment === "dispute")
  {
    return "Pembayaran dalam Sengketa. Refund ditahan sampai sengketa selesai.";
  }

  if (action === "refund-retry" && (!refund || refund.status !== "failed"))
  {
    return "Hanya refund gagal yang dapat ditindaklanjuti.";
  }

  if (action === "refund-check" && (!refund || !["approved", "processing"].includes(refund.status)))
  {
    return "Refund ini tidak sedang diproses.";
  }

  if (action === "complaint-decision" && order.operations.complaint?.status === "appeal" && state.role !== "superadmin")
  {
    return "Banding hanya dapat diputuskan SuperAdmin. Bukti dan riwayat tetap dapat Anda baca.";
  }

  if (action === "cod" && (order.method !== "COD" || order.payment !== "unpaid" || order.shipping !== "delivered"))
  {
    return "Konfirmasi COD memerlukan paket terkirim dan pembayaran yang masih Menunggu.";
  }

  if (action === "complaint-request")
  {
    const deliveredAt = new Date(order.operations.deliveredAt).getTime();

    if (order.status === "complete" || order.shipping !== "delivered" || snapshotAt.getTime() - deliveredAt > 86400000)
    {
      return "Jendela komplain 24 jam telah berakhir atau pesanan belum Terkirim.";
    }
  }

  if (action === "appeal")
  {
    const complaint = order.operations.complaint;

    if (!complaint || complaint.appeals > 0 || complaint.status !== "rejected" ||
      snapshotAt.getTime() - new Date(complaint.rejectedAt).getTime() > 86400000)
    {
      return "Banding hanya satu kali dalam 24 jam setelah penolakan.";
    }
  }

  return "";
}

function collectWorkValues(form)
{
  const values = {};

  for (const descriptor of activeEditor.definition.fields)
  {
    const control = form.elements.namedItem(descriptor.name);
    values[descriptor.name] = descriptor.kind === "checkbox" ? control.checked
      : descriptor.kind === "files" ? Array.from(control.files)
      : control.value.trim();
  }

  return values;
}

function createWorkField(descriptor)
{
  const wrapper = workNode("div", descriptor.wide || ["checkbox", "textarea", "files"].includes(descriptor.kind)
    ? "work-field work-field--wide"
    : "work-field");
  wrapper.dataset.field = descriptor.name;
  const controlId = `work-${descriptor.name}`;
  const label = workNode("label", descriptor.kind === "checkbox" ? "work-check-label" : "",
    descriptor.label + (!descriptor.required ? " (opsional)" : ""));
  label.htmlFor = controlId;
  let control;

  if (descriptor.kind === "select")
  {
    control = workNode("select");
    control.append(new Option("Pilih salah satu", ""));

    for (const [value, text] of descriptor.choices)
    {
      control.append(new Option(text, value));
    }
  }
  else
  {
    control = workNode(descriptor.kind === "textarea" ? "textarea" : "input");

    if (descriptor.kind !== "textarea")
    {
      control.type = descriptor.kind === "files" ? "file" : descriptor.kind;
    }
  }

  control.id = controlId;
  control.name = descriptor.name;
  control.required = descriptor.required;

  if (descriptor.kind === "files")
  {
    control.multiple = true;
    control.accept = "image/jpeg,image/png,image/webp";
    control.className = "work-file-input";
    control.tabIndex = -1;
  }
  else if (descriptor.kind !== "checkbox")
  {
    control.value = descriptor.value ?? "";
  }

  for (const attribute of ["min", "max", "maxLength", "readOnly"])
  {
    if (descriptor[attribute] !== undefined)
    {
      control[attribute] = descriptor[attribute];
    }
  }

  if (descriptor.kind === "number")
  {
    control.step = "1";
    control.inputMode = "numeric";
  }

  if (["text", "textarea"].includes(descriptor.kind))
  {
    control.maxLength = descriptor.maxLength || (descriptor.kind === "textarea" ? 2000 : 160);
  }

  if (descriptor.kind === "checkbox")
  {
    label.prepend(control);
    wrapper.append(label);
  }
  else if (descriptor.kind === "files")
  {
    const picker = workNode("div", "work-file-picker");
    const choose = workNode("button", "queue-button", "Pilih foto");
    choose.type = "button";
    choose.dataset.filePicker = descriptor.name;
    choose.setAttribute("aria-describedby", `${controlId}-help ${controlId}-error`);
    choose.addEventListener("click", () => control.click());
    const count = workNode("span", "work-help", "Belum ada foto dipilih");
    count.id = `${controlId}-count`;
    const clear = workNode("button", "queue-text-button", "Hapus pilihan");
    clear.type = "button";
    clear.addEventListener("click", () =>
    {
      control.value = "";
      control.dispatchEvent(new Event("change", { bubbles: true }));
    });
    picker.append(control, choose, count, clear);
    wrapper.append(label, picker);
  }
  else
  {
    wrapper.append(label, control);
  }

  const error = workNode("span", "work-field-error");
  error.id = `${controlId}-error`;
  error.hidden = true;
  control.setAttribute("aria-describedby", `${controlId}-help ${error.id}`);
  const help = workNode("span", "work-help", descriptor.help || (descriptor.required ? "" : "Opsional"));
  help.id = `${controlId}-help`;
  help.hidden = !help.textContent;
  wrapper.append(help, error);
  return wrapper;
}

function updateConditionalFields(form)
{
  const values = collectWorkValues(form);

  for (const descriptor of activeEditor.definition.fields)
  {
    const visible = !descriptor.when || descriptor.when(values);
    const wrapper = form.querySelector(`[data-field="${descriptor.name}"]`);
    wrapper.hidden = !visible;
    form.elements.namedItem(descriptor.name).disabled = !visible;
  }
}

function businessErrors(order, action, values)
{
  const errors = {};
  const item = getFulfillmentItems(order)[Number(values.item)];
  const eventAt = values.eventTime ? new Date(`${values.eventTime}+07:00`) : null;

  if (eventAt && (!Number.isFinite(eventAt.getTime()) || eventAt > snapshotAt || eventAt < new Date(order.createdAt)))
  {
    errors.eventTime = "Gunakan waktu setelah pesanan dibuat dan tidak melewati waktu contoh 3 November 2026, 11.25 WIB.";
  }

  if (action === "stock-issue" && item && Number(values.quantity) > item.quantity)
  {
    errors.quantity = "Jumlah tidak boleh melebihi jumlah item pada pesanan.";
  }

  if (action === "resolve-case")
  {
    if (values.resolution === "substitute" && item && Number(values.replacementPrice) > item.price)
    {
      errors.replacementPrice = "Harga pengganti tidak boleh lebih tinggi dari harga satuan asli.";
    }

    if (values.resolution === "partial" && item)
    {
      const quantity = Number(values.quantity);
      const totalQuantity = getFulfillmentItems(order).reduce((total, candidate) => total + candidate.quantity, 0);

      if (quantity > item.quantity || quantity >= totalQuantity)
      {
        errors.quantity = "Sisakan minimal satu item yang dapat dipenuhi; jika seluruhnya tidak tersedia, pilih refund penuh.";
      }
    }

    if (values.resolution === "retry" && isPerishable(order) && order.operations.attempts >= 1)
    {
      errors.resolution = "Mudah layu hanya boleh satu percobaan ulang pada hari yang sama. Eskalasi kasus ini.";
    }

    if (values.resolution === "return" && isPerishable(order))
    {
      errors.resolution = "Produk mudah layu tidak dikembalikan ke stok. Eskalasi untuk penilaian tanggung jawab dan kondisi.";
    }

    if (values.resolution === "refund" && ["PH-04", "PH-05", "PH-07"].includes(order.caseInfo?.code) &&
      !["shop", "courier"].includes(values.responsibility))
    {
      errors.responsibility = "Refund penuh memerlukan tanggung jawab toko/kurir yang terbukti. Jika belum jelas, eskalasi.";
    }
  }

  const changesDelivery = action === "schedule" || (action === "resolve-case" &&
    ["restore", "retry", "replace"].includes(values.resolution));

  if (changesDelivery)
  {
    const slotStart = { morning: "08:00", afternoon: "12:00", evening: "16:00" }[values.slot];
    const startsAt = new Date(`${values.day}T${slotStart}:00+07:00`);
    const latestDay = new Date(order.createdAt);
    latestDay.setUTCDate(latestDay.getUTCDate() + 30);

    if (startsAt > latestDay)
    {
      errors.day = "Tanggal kirim maksimal 30 hari dari pemesanan.";
    }
    else if (isPerishable(order) && startsAt.getTime() - snapshotAt.getTime() < 4 * 3600000)
    {
      errors.slot = "Mudah layu membutuhkan minimal empat jam sebelum awal slot.";
    }
    else if (!isPerishable(order) && values.day < tomorrowKey)
    {
      errors.day = "Produk tahan lama dijadwalkan paling cepat besok (H+1).";
    }

    if (values.resolution === "retry" && isPerishable(order) &&
      (values.day !== todayKey || order.deliveryDay !== todayKey))
    {
      errors.day = "Percobaan ulang produk mudah layu hanya pada hari kirim yang sama.";
    }
  }

  if (action === "cancel-decision" && values.decision === "approve")
  {
    if (order.status === "preparing" && isPerishable(order) && order.operations.cancellation.source !== "shop")
    {
      errors.decision = "Produk mudah layu yang sudah disiapkan tidak dapat dibatalkan, kecuali kesalahan toko.";
    }

    if (["shipping", "attention"].includes(order.status) && order.shipping !== "returned")
    {
      errors.decision = "Setelah dikirim, tunggu paket kembali dan penilaian kelayakan. Tangani melalui kasus PH-07.";
    }
  }

  if (action === "refund-request")
  {
    const amount = Number(values.amount);
    const eligible = order.caseInfo || order.operations.complaint || order.shipping === "returned" || order.operations.refundEntitlement;

    if (!eligible)
    {
      errors.reason = "Refund memerlukan dasar kasus, komplain, retur, atau selisih pemenuhan yang tercatat.";
    }

    if (amount > refundableLimit(order))
    {
      errors.amount = "Nominal melampaui hak refund atau sisa pembayaran yang belum terikat permintaan.";
    }
  }

  if (action === "complaint-decision" && values.resolution === "partial" && item &&
    Number(values.amount) > item.price * item.quantity)
  {
    errors.amount = "Refund sebagian tidak boleh melebihi nilai item terdampak.";
  }

  const expectedPayment = action === "cod" ? getCollectibleTotal(order) : getTotal(order);

  if (["cod", "reconcile"].includes(action) && Number(values.amount) !== expectedPayment)
  {
    errors.amount = `Nominal harus tepat ${rupiah(expectedPayment)}. Jangan melanjutkan jika ada selisih.`;
  }

  if (["reconcile", "reconcile-approve"].includes(action) && !/^\d{6}$/.test(values.mfa || ""))
  {
    errors.mfa = "Masukkan enam digit kode contoh.";
  }

  if (action === "refund-retry" && values.mode === "manual" && !/^\d{6,30}$/.test(values.accountNumber || ""))
  {
    errors.accountNumber = "Gunakan 6 sampai 30 digit nomor rekening contoh.";
  }

  return errors;
}

function validateWorkForm(form, showErrors = true)
{
  const order = currentOrder();
  const values = collectWorkValues(form);
  const errors = businessErrors(order, activeEditor.action, values);

  for (const descriptor of activeEditor.definition.fields)
  {
    const control = form.elements.namedItem(descriptor.name);

    if (control.disabled)
    {
      delete errors[descriptor.name];
      continue;
    }

    const value = values[descriptor.name];

    if (descriptor.required && (!value || (Array.isArray(value) && value.length === 0)))
    {
      errors[descriptor.name] = descriptor.kind === "checkbox" ? "Konfirmasi pemeriksaan ini untuk melanjutkan." : "Bagian ini wajib diisi.";
    }
    else if (descriptor.kind === "select" && value && !descriptor.choices.some(([choice]) => choice === value))
    {
      errors[descriptor.name] = "Pilih salah satu opsi yang tersedia.";
    }
    else if (descriptor.kind === "files" && value.length)
    {
      if (value.length < (descriptor.minFiles || 0) || value.length > 5)
      {
        errors[descriptor.name] = `Lampirkan ${descriptor.minFiles || 1} sampai 5 foto.`;
      }
      else if (value.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024))
      {
        errors[descriptor.name] = "Gunakan JPG, PNG, atau WebP dengan ukuran maksimal 5 MB per foto.";
      }
    }
    else if (descriptor.kind === "number" && value !== "")
    {
      const amount = Number(value);

      if (!Number.isSafeInteger(amount) || amount < (descriptor.min ?? 0) || amount > (descriptor.max ?? Number.MAX_SAFE_INTEGER))
      {
        errors[descriptor.name] = "Masukkan bilangan bulat dalam batas yang ditampilkan.";
      }
    }
    else if (descriptor.minLength && String(value).length < descriptor.minLength)
    {
      errors[descriptor.name] = `Gunakan minimal ${descriptor.minLength} karakter agar konteksnya jelas.`;
    }

    if (showErrors)
    {
      const message = form.querySelector(`#work-${descriptor.name}-error`);
      message.textContent = errors[descriptor.name] || "";
      message.hidden = !errors[descriptor.name];
      control.setAttribute("aria-invalid", String(Boolean(errors[descriptor.name])));
    }
  }

  if (showErrors && Object.keys(errors).length)
  {
    const first = form.elements.namedItem(Object.keys(errors)[0]);
    if (first?.type === "file")
    {
      form.querySelector(`[data-file-picker="${first.name}"]`).focus();
    }
    else
    {
      first?.focus();
    }
  }

  return { valid: Object.keys(errors).length === 0, values, errors };
}

function startWorkAction(action, requestId = "")
{
  const order = currentOrder();

  if (!order)
  {
    return;
  }

  if (action === "view-case")
  {
    activeEditor = null;
    state.detailTab = "case";
    updateView();
    return;
  }

  const definition = getActionDefinition(action, order);

  if (!definition)
  {
    return;
  }

  activeEditor = null;
  state.detailTab = definition.tab;
  updateView();
  workflowPanel.hidden = false;
  const sheet = workNode("section", "work-sheet");
  sheet.append(workHeading(definition.title, definition.copy));
  const permissionError = permissionFailure(action, order, requestId);

  if (permissionError)
  {
    const notice = workNotice(permissionError, true);
    notice.tabIndex = -1;
    sheet.append(notice);
    workflowPanel.replaceChildren(sheet);
    notice.focus();
    return;
  }

  activeEditor =
  {
    action,
    orderId: order.id,
    requestId,
    definition,
    tab: definition.tab,
    revision: order.operations.revision,
    url: window.location.href,
    dirty: false,
    before: `${orderStatusLabels[order.status]} / ${paymentStatusLabels[order.payment]} / ${shippingStatusLabels[order.shipping]}`
  };
  const request = order.operations.refunds.find((refund) => refund.id === requestId);

  if (request)
  {
    sheet.append(workNotice(`${request.id}. ${rupiah(request.amount)}. Pengaju: ${request.maker}. ${request.reason}`));
  }

  const form = workNode("form", "work-form");
  form.id = "workflow-form";
  form.noValidate = true;
  const error = workNode("div", "work-form-error");
  error.id = "workflow-save-error";
  error.hidden = true;
  error.setAttribute("role", "alert");
  const grid = workNode("div", "work-form-grid");
  grid.append(...definition.fields.map(createWorkField));
  const footer = workNode("div", "work-form-footer");
  const cancel = workButton("Kembali", "cancel-editor");
  const submit = workNode("button", "queue-button queue-button--primary", definition.submit || "Tinjau perubahan");
  submit.type = "submit";
  submit.id = "workflow-submit";
  const readiness = workNode("p", "work-help");
  readiness.id = "workflow-readiness";
  footer.append(cancel, submit);
  const estimate = workNode("p", "work-notice");
  estimate.id = "workflow-estimate";
  estimate.hidden = true;
  form.append(error, workNode("p", "work-form-intro", "Isian wajib kecuali ditandai opsional."), grid, estimate, readiness, footer);
  const layout = workNode("div", "work-form-layout");
  const context = workNode("aside", "work-form-context");
  context.append(workHeading("Pesanan ini"));
  const collectionFacts = order.operations.collectionAdjustment
    ? [
      ["Tagihan awal", rupiah(getTotal(order))],
      ["Pengurangan COD", rupiah(order.operations.collectionAdjustment.reduction)],
      ["Jumlah ditagih", rupiah(getCollectibleTotal(order))]
    ]
    : [["Tagihan", rupiah(getTotal(order))]];
  context.append(workFacts([
    ["Nomor", order.id],
    ["Pelanggan", order.customer],
    ...collectionFacts,
    ["Dibayar", rupiah(order.operations.paidAmount)],
    ["Jenis", isPerishable(order) ? "Mudah layu" : "Tahan lama"]
  ]));
  layout.append(form, context);
  sheet.append(layout);
  workflowPanel.replaceChildren(sheet);
  updateConditionalFields(form);
  document.querySelector(".work-next-action").hidden = true;
  document.getElementById("detail-action-result").hidden = true;

  function updateFormState()
  {
    activeEditor.dirty = true;
    updateConditionalFields(form);
    const result = validateWorkForm(form, false);
    const item = order.items[Number(result.values.item)];
    estimate.hidden = !item || !["substitute", "partial"].includes(result.values.resolution);

    if (!estimate.hidden)
    {
      const refundAmount = result.values.resolution === "partial"
        ? item.price * Number(result.values.quantity)
        : (item.price - Number(result.values.replacementPrice)) * item.quantity;
      estimate.textContent = order.method === "COD" && order.operations.paidAmount === 0
        ? `Tagihan COD awal ${rupiah(getTotal(order))}. Pengurangan tambahan ${rupiah(Math.max(0, refundAmount))}. ` +
          `Jumlah ditagih menjadi ${rupiah(getCollectibleTotal(order) - Math.max(0, refundAmount))}. ` +
          "Pembayaran tetap Menunggu; tidak ada refund dana."
        : `Harga satuan asli ${rupiah(item.price)}. ` +
          `Estimasi pengembalian ${rupiah(Math.max(0, refundAmount))}; ongkir tetap. Snapshot asli tidak berubah.`;
    }
    submit.disabled = action === "handoff" && !result.valid;
    readiness.textContent = action === "handoff"
      ? result.valid ? "Semua syarat penyerahan terpenuhi." : "Lengkapi resi, waktu, bukti, dan pemeriksaan paket untuk melanjutkan."
      : ["note", "contact"].includes(action)
        ? "Catatan disimpan langsung dalam aktivitas pesanan."
        : "Perubahan belum diterapkan. Anda akan meninjau konfirmasi terlebih dahulu.";
  }

  form.addEventListener("input", updateFormState);
  form.addEventListener("change", updateFormState);
  form.addEventListener("change", (event) =>
  {
    if (event.target.type !== "file")
    {
      return;
    }

    const wrapper = event.target.closest(".work-field");
    wrapper.querySelector(".work-attachments")?.remove();
    const files = Array.from(event.target.files).slice(0, 5)
      .filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= 5 * 1024 * 1024);
    setText(`work-${event.target.name}-count`, `${event.target.files.length} foto dipilih`);
    renderEvidence(wrapper, evidenceFromFiles(files));
  });
  form.addEventListener("submit", submitWorkForm);

  if (action === "handoff")
  {
    submit.disabled = true;
    readiness.textContent = "Lengkapi seluruh syarat penyerahan untuk mengaktifkan tombol.";
  }

  sheet.querySelector("h3").tabIndex = -1;
  sheet.querySelector("h3").focus({ preventScroll: true });
  sheet.scrollIntoView({ block: "start", behavior: "instant" });
}

function confirmWorkflow(title, copy, callback)
{
  setText("workflow-confirm-title", title);
  setText("workflow-confirm-copy", copy);
  pendingConfirmation = callback;
  workflowDialog.returnValue = "cancel";
  workflowDialog.showModal();
}

function evidenceFromFiles(files = [])
{
  return files.map((file) =>
  {
    const url = URL.createObjectURL(file);
    localEvidenceUrls.add(url);
    return { name: file.name, url };
  });
}

function finishRefundResult(order, refund)
{
  refund.status = "success";
  refund.resultReference = `DEMO-${refund.id}`;
  refund.finishedAt = snapshotAt.toISOString();
  syncRefundPayment(order);

  if (order.operations.complaint?.refundId === refund.id)
  {
    order.operations.complaint.status = "closed";
    order.status = "complete";
  }
}

function cancelOrderWithRefund(order, reason, automatic = true)
{
  order.status = "cancelled";
  order.caseInfo = null;

  if (order.operations.cancellation)
  {
    order.operations.cancellation.status = "approved";
  }

  if (remainingRefund(order) > 0)
  {
    const refund = createRefund(order, remainingRefund(order), reason, automatic);
    refund.cancelOnApproval = !automatic;
  }

  order.operations.stockReview = "Penilaian kelayakan retur dan buku besar diperlukan; tidak ada penambahan stok otomatis.";
}

function applyWorkflowAction(order, action, values, requestId)
{
  const operations = order.operations;
  const evidence = evidenceFromFiles(values.photos);
  evidence.forEach((attachment) => attachment.source = action);
  operations.evidence.push(...evidence);
  const item = order.items[Number(values.item)];
  const refund = operations.refunds.find((candidate) => candidate.id === requestId);
  const eventTime = values.eventTime ? new Date(`${values.eventTime}+07:00`).toISOString() : snapshotAt.toISOString();

  switch (action)
  {
    case "handoff":
      operations.handoff = { courier: values.courier, tracking: values.tracking, eventTime, evidence };
      order.tracking = values.tracking;
      order.status = "shipping";
      order.shipping = "shipping";
      break;

    case "stock-issue":
      openWorkCase(order, "PH-06", "Stok fisik tidak sesuai", values.reason);
      operations.stockAdjustment = { sku: item.sku, quantity: Number(values.quantity), reason: values.reason };
      break;

    case "delivered":
      order.status = "delivered";
      order.shipping = "delivered";
      operations.deliveredAt = eventTime;
      operations.receipt = { recipient: values.recipient, reference: values.reference, evidence };
      break;

    case "shipping-issue":
      openWorkCase(order, ["lost", "damaged"].includes(values.issue) ? "PH-05" : "PH-04",
        "Kendala pengiriman", values.reason);
      order.shipping = "issue";
      operations.shippingIssue = { type: values.issue, responsibility: values.responsibility, reference: values.reference };
      break;

    case "contact":
      operations.contact = { channel: values.channel, response: values.response, reference: values.reference, note: values.reason };
      break;

    case "escalate":
      order.caseInfo.owner = "SuperAdmin RylVa";
      order.caseInfo.nextAction = `Menunggu peninjauan SuperAdmin. ${values.reason}`;
      break;

    case "resolve-case":
      applyCaseResolution(order, values);
      break;

    case "schedule":
      operations.scheduleBefore = { day: order.deliveryDay, slot: order.slot, address: operations.address || "Alamat demonstrasi" };
      order.deliveryDay = values.day;
      order.slot = values.slot;
      operations.address = values.address;
      operations.customerConfirmation = values.reference;
      break;

    case "note":
      operations.notes.push({ text: values.reason, actor: currentActor(), at: snapshotAt.toISOString() });
      break;

    case "cancel-request":
      operations.cancellation =
      {
        status: "requested",
        source: values.source,
        reason: values.reason,
        createdAt: snapshotAt.toISOString(),
        deadline: new Date(snapshotAt.getTime() + 2 * 3600000).toISOString()
      };

      if (order.status === "shipping")
      {
        openWorkCase(order, "PH-07", "Pembatalan setelah dikirim", values.reason);
      }
      else if (order.status === "ready" || values.source === "shop")
      {
        cancelOrderWithRefund(order, values.reason);
      }
      break;

    case "cancel-decision":
      operations.cancellation.status = values.decision === "approve" ? "approved" : "rejected";
      operations.cancellation.decisionReason = values.reason;

      if (values.decision === "approve")
      {
        cancelOrderWithRefund(order, values.reason, operations.cancellation.source === "shop");
      }
      else if (order.caseInfo?.code === "PH-07")
      {
        order.status = "shipping";
        order.caseInfo = null;
      }
      break;

    case "refund-request":
      createRefund(order, Number(values.amount), values.reason);
      break;

    case "refund-decision":
      refund.status = values.decision === "approve" ? "processing" : "rejected";
      refund.checker = currentActor();
      refund.decisionReason = values.reason;

      if (values.decision === "approve" && refund.cancelOnApproval)
      {
        order.status = "cancelled";
        order.caseInfo = null;
      }
      if (values.decision === "reject" && operations.complaint?.refundId === refund.id)
      {
        operations.complaint.status = "open";
        operations.complaint.refundId = "";
      }
      syncRefundPayment(order);
      break;

    case "refund-retry":
      refund.attempts += 1;
      refund.failure = "";
      refund.followUpReference = values.reference;

      if (values.mode === "manual")
      {
        refund.manualTransfer = { bank: values.bank, name: values.accountName, lastDigits: values.accountNumber.slice(-4) };
        finishRefundResult(order, refund);
      }
      else
      {
        refund.status = "processing";
        syncRefundPayment(order);
      }
      break;

    case "refund-check":
      finishRefundResult(order, refund);
      break;

    case "complaint-request":
      operations.complaint =
      {
        status: "open",
        category: values.category,
        description: values.reason,
        createdAt: snapshotAt.toISOString(),
        deadline: new Date(snapshotAt.getTime() + 86400000).toISOString(),
        evidence: evidence.map((entry) => entry.name),
        appeals: 0
      };
      break;

    case "complaint-decision":
      applyComplaintDecision(order, values);
      break;

    case "appeal":
      operations.complaint.status = "appeal";
      operations.complaint.appeals += 1;
      operations.complaint.appealReason = values.reason;
      operations.complaint.evidence.push(...evidence.map((entry) => entry.name));
      break;

    case "replacement-complete":
      operations.complaint.status = "closed";
      order.status = "complete";
      break;

    case "cod":
      operations.paidAmount = Number(values.amount);
      operations.codReceipt = { reference: values.reference, eventTime, evidence };
      order.payment = "paid";
      order.paidAt = eventTime;
      break;

    case "reconcile":
      if (values.verification === "manual")
      {
        operations.reconciliation = { maker: currentActor(), amount: Number(values.amount), reference: values.reference, evidence };
        order.caseInfo.owner = "SuperAdmin kedua";
        order.caseInfo.nextAction = "Bukti manual menunggu persetujuan SuperAdmin berbeda. Pembayaran belum diubah.";
      }
      else
      {
        applyVerifiedPayment(order);
      }
      break;

    case "reconcile-approve":
      operations.reconciliation.checker = currentActor();
      applyVerifiedPayment(order);
      break;
  }

  addWorkHistory(order, `${getActionDefinition(action, order).title} — simulasi`, values.reason || values.reference);
  operations.revision += 1;
  order.wasSimulated = false;
}

function applyVerifiedPayment(order)
{
  order.payment = "paid";
  order.operations.paidAmount = getTotal(order);
  order.paidAt = snapshotAt.toISOString();
  order.stockCommitted = true;
  order.status = "ready";
  order.caseInfo = null;
}

function applyCaseResolution(order, values)
{
  const operations = order.operations;
  const code = order.caseInfo.code;
  const fulfillmentItems = structuredClone(getFulfillmentItems(order));
  const item = fulfillmentItems[Number(values.item)];

  if (values.resolution === "escalate")
  {
    order.caseInfo.owner = "SuperAdmin RylVa";
    order.caseInfo.nextAction = values.reason;
    return;
  }

  if (values.resolution === "refund")
  {
    if (operations.paidAmount === 0)
    {
      order.status = "cancelled";
      order.caseInfo = null;
      return;
    }

    const automatic = ["PH-01", "PH-02", "PH-06"].includes(code);
    const refund = createRefund(order, remainingRefund(order), values.reason, automatic);
    refund.cancelOnApproval = !automatic;

    if (automatic)
    {
      order.status = "cancelled";
      order.caseInfo = null;
    }
    return;
  }

  if (values.resolution === "substitute")
  {
    operations.fulfillmentPlan = `Pengganti: ${values.replacement}, ${item.quantity} ${item.unit}. ` +
      `Disetujui melalui ${values.reference}. Snapshot pesanan asli tetap tersimpan.`;
    const difference = (item.price - Number(values.replacementPrice)) * item.quantity;
    item.name = values.replacement;
    item.variant = "Pengganti disetujui pelanggan";
    item.price = Number(values.replacementPrice);
    applyFulfillmentReduction(order, fulfillmentItems, difference, values,
      "Selisih substitusi yang disetujui pelanggan.");
  }

  if (values.resolution === "partial")
  {
    operations.fulfillmentPlan = `Tidak dipenuhi: ${item.name}, ${values.quantity} ${item.unit}. ` +
      `Sisa item dipenuhi atas persetujuan ${values.reference}. Snapshot asli tetap tersimpan.`;
    const difference = item.price * Number(values.quantity);
    item.quantity -= Number(values.quantity);
    applyFulfillmentReduction(order, fulfillmentItems, difference, values,
      "Item tidak tersedia pada pemenuhan sebagian.");
  }

  if (values.resolution === "return")
  {
    order.shipping = "returned";
    order.status = "cancelled";
    const refund = createRefund(order, Math.min(getSubtotal(order), remainingRefund(order)),
      "Paket tahan lama kembali dan layak. Ongkir tidak dikembalikan.");
    refund.cancelOnApproval = true;
    order.caseInfo = null;
    operations.stockReview = "Retur layak menunggu pencatatan buku besar; refund tidak menambah stok otomatis.";
    return;
  }

  operations.customerConfirmation = values.reference;
  if (values.day && values.slot)
  {
    order.deliveryDay = values.day;
    order.slot = values.slot;
  }
  order.caseInfo = null;

  if (["retry", "replace"].includes(values.resolution))
  {
    operations.attempts += 1;
    operations.fulfillmentPlan = `Pengiriman ulang/pengganti disetujui: ${values.reference}. ${values.reason}`;
    order.status = "preparing";
    order.shipping = "pending";
    order.tracking = "Belum diisi";
  }
  else
  {
    order.stockCommitted = true;
    order.status = code === "PH-02" ? "ready" : operations.previousState;
  }
}

function applyFulfillmentReduction(order, fulfillmentItems, difference, values, reason)
{
  const operations = order.operations;
  operations.fulfillmentItems = fulfillmentItems;

  if (order.method === "COD" && order.payment === "unpaid" && operations.paidAmount === 0)
  {
    operations.collectionAdjustment =
    {
      originalAmount: getTotal(order),
      reduction: getSubtotal(order) - getFulfillmentSubtotal(order),
      reason: values.reason,
      reference: values.reference,
      actor: currentActor()
    };
  }
  else if (difference > 0)
  {
    createRefund(order, difference, reason);
  }
}

function applyComplaintDecision(order, values)
{
  const complaint = order.operations.complaint;
  complaint.decisionReason = values.reason;
  complaint.responsibility = values.responsibility;
  complaint.resolution = values.resolution;
  complaint.finalDecision = complaint.status === "appeal";

  if (values.resolution === "reject")
  {
    complaint.status = complaint.finalDecision ? "closed" : "rejected";
    complaint.rejectedAt = snapshotAt.toISOString();

    if (complaint.finalDecision)
    {
      order.status = "complete";
    }
  }
  else if (values.resolution === "replace")
  {
    complaint.status = "resolving";
    complaint.replacementReference = values.reference;
  }
  else
  {
    const amount = values.resolution === "full" ? remainingRefund(order) : Number(values.amount);
    const refund = createRefund(order, amount, `Komplain: ${values.reason}`);
    complaint.refundId = refund.id;
    complaint.status = "resolving";
  }
}

function submitWorkForm(event)
{
  event.preventDefault();

  if (saveInProgress || !activeEditor)
  {
    return;
  }

  const result = validateWorkForm(event.currentTarget);

  if (!result.valid)
  {
    return;
  }

  const order = currentOrder();
  const editor = activeEditor;

  if (["note", "contact"].includes(editor.action))
  {
    saveWorkAction(editor, result.values);
    return;
  }

  const amount = result.values.amount ? ` Nominal: ${rupiah(Number(result.values.amount))}.` : "";
  const estimate = document.getElementById("workflow-estimate");
  const adjustmentSummary = estimate && !estimate.hidden ? ` ${estimate.textContent}` : "";
  confirmWorkflow(`${editor.definition.title}?`, `${order.id}.${amount} ` +
    "Perubahan dan alasan akan dicatat pada riwayat contoh. Tidak ada transaksi atau pesan sungguhan." +
    adjustmentSummary, () => saveWorkAction(editor, result.values));
}

async function saveWorkAction(editor, values)
{
  const form = document.getElementById("workflow-form");
  const order = currentOrder();
  const error = document.getElementById("workflow-save-error");
  const submit = document.getElementById("workflow-submit");
  const denied = permissionFailure(editor.action, order, editor.requestId);

  if (denied || order.operations.revision !== editor.revision)
  {
    error.textContent = denied || "Pesanan berubah sejak form dibuka. Kembali dan periksa data terbaru sebelum mencoba lagi.";
    error.hidden = false;
    return;
  }

  saveInProgress = true;
  form.querySelectorAll("button, input, select, textarea").forEach((control) => control.disabled = true);
  submit.textContent = "Menyimpan contoh…";
  form.setAttribute("aria-busy", "true");

  try
  {
    await new Promise((resolve) => setTimeout(resolve, 350));

    if (failNextSave)
    {
      failNextSave = false;
      throw new Error("Perubahan belum tersimpan. Data isian tetap tersedia; coba simpan kembali.");
    }

    const candidate = structuredClone(order);
    applyWorkflowAction(candidate, editor.action, values, editor.requestId);
    Object.assign(order, candidate);
    workflowMessages.set(order.id, `${editor.definition.title} berhasil dicatat pada contoh. ` +
      `Pesanan: ${orderStatusLabels[order.status]}. Pembayaran: ${paymentStatusLabels[order.payment]}.`);
    activeEditor = null;
    updateView();
    document.getElementById("detail-action-result").focus({ preventScroll: true });
    document.getElementById("detail-action-result").scrollIntoView({ block: "nearest" });
  }
  catch (failure)
  {
    error.textContent = failure.message;
    error.hidden = false;
    form.querySelectorAll("button, input, select, textarea").forEach((control) => control.disabled = false);
    updateConditionalFields(form);
    submit.textContent = "Coba simpan kembali";
  }
  finally
  {
    saveInProgress = false;
    form.removeAttribute("aria-busy");
  }
}

workflowDialog.addEventListener("close", () =>
{
  const callback = pendingConfirmation;
  pendingConfirmation = null;

  if (workflowDialog.returnValue === "confirm" && callback)
  {
    callback();
  }
});

function closeWorkEditor()
{
  activeEditor = null;
  updateView();
}

document.addEventListener("click", (event) =>
{
  const actionButton = event.target.closest("[data-work-action]");
  const tab = event.target.closest("[data-detail-tab]");
  const workspace = event.target.closest("[data-workspace]");
  const filter = event.target.closest("[data-aftercare-filter]");
  const navigation = event.target.closest('[data-open-order], #back-to-queue, a[href]:not([target="_blank"])');
  const leavesEditor = actionButton || tab || workspace || navigation;

  if (saveInProgress && leavesEditor)
  {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }

  if (activeEditor?.dirty && leavesEditor)
  {
    event.preventDefault();
    event.stopImmediatePropagation();
    const target = actionButton || tab || workspace || navigation;
    const warning = "Perubahan pada form ini belum diterapkan. Kembali untuk melanjutkan, atau tinggalkan isian.";
    confirmWorkflow("Tinggalkan isian yang belum disimpan?", warning, () =>
    {
      activeEditor = null;
      target.click();
    });
    return;
  }

  if (workspace)
  {
    activeEditor = null;
    state.workspace = workspace.dataset.workspace;
    state.orderId = "";
    writeUrlState(true);
    updateView(false);
  }

  if (tab)
  {
    activeEditor = null;
    state.detailTab = tab.dataset.detailTab;
    writeUrlState(true);
    updateView(false);
  }

  if (filter)
  {
    state.aftercareFilter = filter.dataset.aftercareFilter;
    updateView();
  }

  if (actionButton)
  {
    const action = actionButton.dataset.workAction;

    if (action === "open-request")
    {
      openOrder(actionButton.dataset.orderId);
      state.detailTab = "aftercare";
      updateView();
    }
    else if (action === "cancel-editor")
    {
      closeWorkEditor();
    }
    else
    {
      startWorkAction(action, actionButton.dataset.requestId || "");
    }
  }
}, true);

window.addEventListener("beforeunload", (event) =>
{
  if (activeEditor?.dirty)
  {
    event.preventDefault();
    event.returnValue = "";
  }
});

window.addEventListener("popstate", (event) =>
{
  if (!activeEditor || (!activeEditor.dirty && !saveInProgress))
  {
    return;
  }

  event.stopImmediatePropagation();
  const requestedUrl = window.location.href;
  window.history.replaceState(null, "", activeEditor.url);

  if (saveInProgress)
  {
    return;
  }

  confirmWorkflow("Tinggalkan isian yang belum disimpan?",
    "Form ini belum disimpan. Kembali untuk melanjutkan atau konfirmasikan perpindahan halaman.", () =>
    {
      activeEditor = null;
      window.history.replaceState(null, "", requestedUrl);
      state = readUrlState();
      updateView(false);
    });
}, true);

function addPreviewControls()
{
  const disclosure = workNode("details", "work-preview-controls");
  const summary = workNode("summary", "", "Pilihan pratinjau");
  const label = workNode("label", "work-help", "Akun contoh untuk menguji perbedaan kewenangan");
  label.htmlFor = "workflow-profile";
  const select = workNode("select");
  select.id = "workflow-profile";

  for (const [key, profile] of Object.entries(workflowProfiles))
  {
    select.append(new Option(profile.name, key));
  }

  select.value = workflowProfile;
  select.addEventListener("change", () =>
  {
    if (saveInProgress)
    {
      select.value = workflowProfile;
      return;
    }

    const applyProfile = () =>
    {
      activeEditor = null;
      workflowProfile = select.value;
      state.role = workflowProfiles[workflowProfile].role;
      document.querySelectorAll("[data-role-link]").forEach((link) =>
      {
        const url = new URL(link.href);

        if (state.role === "superadmin")
        {
          url.searchParams.set("role", "superadmin");
        }
        else
        {
          url.searchParams.delete("role");
        }

        link.href = url.href;
      });
      document.querySelectorAll("[data-superadmin-only]").forEach((node) =>
      {
        node.hidden = state.role !== "superadmin";
      });
      setText("preview-role", state.role === "superadmin" ? "Pratinjau SuperAdmin" : "Pratinjau Admin");
      setText("profile-name", currentActor());
      updateView();
    };

    if (activeEditor?.dirty)
    {
      const requested = select.value;
      select.value = workflowProfile;
      confirmWorkflow("Ganti akun contoh?", "Isian yang belum disimpan akan ditinggalkan.", () =>
      {
        select.value = requested;
        applyProfile();
      });
    }
    else
    {
      applyProfile();
    }
  });
  const failLabel = workNode("label", "work-help");
  const checkbox = workNode("input");
  checkbox.type = "checkbox";
  checkbox.id = "workflow-fail-next";
  checkbox.addEventListener("change", () =>
  {
    failNextSave = checkbox.checked;
  });
  failLabel.append(checkbox, document.createTextNode(" Simulasikan satu kegagalan penyimpanan berikutnya"));
  disclosure.append(summary, label, select, failLabel,
    workNode("p", "work-help",
      "Data ilustrasi pada 3 November 2026, 11.25 WIB. " +
      "Perubahan dan foto hanya berada di memori tab; muat ulang untuk mengulang contoh."));
  document.querySelector(".queue-footer").before(disclosure);
}

prepareWorkflowData();
addPreviewControls();
document.addEventListener("orders:prepared", (event) => workflowMessages.delete(event.detail.orderId));
document.addEventListener("orders:render", renderWorkflowSurface);
updateView();
