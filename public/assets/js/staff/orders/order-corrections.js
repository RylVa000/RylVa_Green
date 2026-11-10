"use strict";

function correctionSnapshot(order)
{
  const lastEvent = order.history.slice().reverse().find((event) =>
  {
    const resultingStatus = event.after?.split(" / ")[0];
    return resultingStatus === orderStatusLabels[order.status]
      || event.label?.toLocaleLowerCase("id-ID").includes(orderStatusLabels[order.status].toLocaleLowerCase("id-ID"));
  });
  const revision = order.operations.revision;
  return {
    id: order.id,
    customer: order.customer,
    sourceStatus: order.status,
    payment: paymentStatusLabels[order.payment],
    shipping: shippingStatusLabels[order.shipping],
    sourceFingerprint: JSON.stringify(
    {
      status: order.status,
      payment: order.payment,
      shipping: order.shipping,
      revision,
      history: order.history
    }),
    event:
    {
      id: lastEvent ? `${order.id}-event-${order.history.indexOf(lastEvent)}`
        : `${order.id}-snapshot-${revision}-${order.history.length}`,
      label: lastEvent?.label || `Status ${orderStatusLabels[order.status]} pada snapshot contoh`,
      actor: lastEvent?.actor || "Sistem contoh",
      at: lastEvent?.time || snapshotAt.toISOString()
    },
    synthetic: false
  };
}

function renderTerminalCorrections(order)
{
  let section = document.getElementById("order-correction-surface");
  if (!section)
  {
    section = workNode("section", "work-sheet workflow-panel");
    section.id = "order-correction-surface";
    section.setAttribute("aria-label", "Koreksi status akhir");
    document.getElementById("workflow-panel").after(section);
  }
  section.replaceChildren();
  section.hidden = !["complete", "cancelled"].includes(order.status)
    || !["overview", "activity"].includes(state.detailTab) || Boolean(activeEditor);
  if (section.hidden)
  {
    return;
  }
  section.append(workHeading("Koreksi status akhir", "Status akhir terkunci. Koreksi memerlukan alasan dan persetujuan kedua, tanpa menimpa catatan asli."));
  if (state.role !== "superadmin")
  {
    section.append(workNotice("Jika catatan status keliru, minta SuperAdmin meninjau melalui Pusat Persetujuan Sensitif."));
    return;
  }
  const demo = window.superadminReview;
  const snapshot = correctionSnapshot(order);
  const data = demo.snapshot();
  const source = data.terminalOrders.find((item) => item.id === order.id);
  const pending = data.requests.find((item) => item.type === "terminal-correction" && item.orderId === order.id && item.status === "pending");
  const labels = window.superadminReviewFixture.orderStatusLabels;
  const query = new URLSearchParams(
  {
    role: "superadmin",
    actor: "sa-01",
    source: order.id
  });
  const open = workNode("a", "queue-button", pending ? "Buka usulan koreksi" : "Tinjau & ajukan koreksi");
  open.id = "open-terminal-correction";
  open.href = `../superadmin/sensitive-approvals.html?${query}`;
  const feedback = workNode("p", "work-notice work-notice--warning");
  feedback.hidden = true;
  feedback.setAttribute("role", "alert");
  open.addEventListener("click", (event) =>
  {
    const result = demo.registerTerminalOrder(snapshot);
    if (result?.errors)
    {
      event.preventDefault();
      feedback.textContent = result.errors.join(" ");
      feedback.hidden = false;
    }
  });
  if (pending)
  {
    section.append(workNotice("Ada usulan koreksi menunggu keputusan. Status dan catatan asli belum berubah.", true));
  }
  if (source?.corrections.length)
  {
    section.append(workNotice(`Status setelah koreksi contoh: ${labels[source.currentStatus]}. Snapshot pesanan ini tetap ${orderStatusLabels[order.status]}; pembayaran, pengiriman dan stok tidak dijalankan ulang.`));
    const list = workNode("ol", "work-timeline work-correction-timeline");
    for (const correction of source.corrections.slice().reverse())
    {
      const row = workNode("li");
      const decision = workNode("a", "queue-button", "Buka keputusan");
      decision.href = `../superadmin/sensitive-approvals.html?role=superadmin&item=${encodeURIComponent(correction.requestId)}`;
      row.append(workNode("strong", "", `${labels[correction.before]} menjadi ${labels[correction.after]}`),
        workNode("p", "", correction.reason),
        workNode("small", "", `Catatan asli: ${correction.originalEventId}`),
        workNode("small", "", `Pengaju: ${correction.maker}. Penyetuju: ${correction.checker}.`), decision);
      list.append(row);
    }
    section.append(list);
  }
  section.append(workNotice("Pengajuan dan catatan koreksi adalah contoh lokal pada tab ini, bukan audit atau transisi pesanan server."));
  const actions = workNode("div", "work-actions");
  actions.append(open);
  section.append(actions, feedback);
}
