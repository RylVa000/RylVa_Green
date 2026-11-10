"use strict";

(() =>
{
  const hub = window.staffHub;
  const demo = window.superadminReview;
  const { node, button, link, badge, banner, panel, value } = hub;
  const isReconciliation = document.body.dataset.staffPage === "reconciliation";
  const title = isReconciliation ? "Rekonsiliasi Pembayaran" : "Persetujuan Sensitif";
  const types =
  {
    refund: "Refund",
    "product-stock": "Stok produk",
    "material-stock": "Bahan produksi",
    "terminal-correction": "Koreksi status akhir",
    reconciliation: "Rekonsiliasi"
  };
  const caseLabels =
  {
    review: "Perlu ditinjau",
    awaiting: "Menunggu keputusan",
    resolved: "Selesai"
  };
  const requestLabels =
  {
    pending: "Menunggu keputusan",
    approved: "Disetujui",
    rejected: "Ditolak"
  };
  const checkLabels =
  {
    match: "Data cocok",
    unavailable: "API tidak tersedia",
    mismatch: "Data berbeda",
    pending: "Masih menunggu"
  };
  const tabs = isReconciliation
    ? [["overview", "Ringkasan"], ["comparison", "Perbandingan"], ["evidence", "Bukti"], ["activity", "Aktivitas"]]
    : [["overview", "Ringkasan"], ["impact", "Dampak"], ["evidence", "Bukti"], ["activity", "Aktivitas"]];
  const orderLabels = window.superadminReviewFixture.orderStatusLabels;

  function actor()
  {
    return demo.snapshot().actors.find((item) => item.id === hub.state.actor);
  }

  function money(amount)
  {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
  }

  function reviewLink(label, file, id = "", primary = false)
  {
    const query = new URLSearchParams({ role: hub.state.role, actor: hub.state.actor, item: id, tab: "overview" });
    return link(label, `${file}?${query}`, primary ? "queue-button queue-button--primary" : "queue-button");
  }

  function correctionLink(id, label = "Tinjau sumber koreksi")
  {
    const query = new URLSearchParams(
    {
      role: hub.state.role,
      actor: hub.state.actor,
      source: id
    });
    return link(label, `../superadmin/sensitive-approvals.html?${query}`);
  }

  function table(headers, rows, detail = false)
  {
    const element = node("table", `report-table review-table${detail ? " review-detail-table" : ""}`);
    const head = node("thead");
    const headerRow = node("tr");
    headers.forEach((label) =>
    {
      const cell = node("th", "", label);
      cell.scope = "col";
      headerRow.append(cell);
    });
    head.append(headerRow);
    const body = node("tbody");
    rows.forEach((values) =>
    {
      const row = node("tr");
      values.forEach((content, index) =>
      {
        const cell = node("td");
        cell.dataset.label = headers[index];
        cell.append(content instanceof Node ? content : document.createTextNode(String(content)));
        row.append(cell);
      });
      body.append(row);
    });
    element.append(head, body);
    return element;
  }

  function status(record)
  {
    const labels = isReconciliation ? caseLabels : requestLabels;
    return badge(labels[record.status], ["resolved", "approved"].includes(record.status) ? "success"
      : record.status === "rejected" ? "info" : "warning");
  }

  function note()
  {
    hub.root.append(node("p", "report-note", "Data contoh dua halaman ini tersimpan sementara pada tab ini. Tidak mengubah dana, gateway atau data modul lain."));
    const identity = node("div", "support-inline review-identity");
    identity.append(badge("SuperAdmin", "success"), node("span", "support-meta", `Pelaku contoh: ${actor().name}`));
    hub.root.append(identity);
    if (demo.isMemoryOnly())
    {
      hub.root.append(banner("Penyimpanan tab tidak tersedia", "Perubahan hanya berada di memori halaman dan tidak terbawa saat berpindah halaman.", "warning"));
    }
  }

  function renderStats(data)
  {
    const stats = node("div", "support-stats review-stats");
    const items = isReconciliation ? [
      ["Perlu ditinjau", data.cases.filter((item) => item.status === "review").length, "Belum selesai diperiksa"],
      ["Menunggu keputusan", data.cases.filter((item) => item.status === "awaiting").length, "Usulan manual aktif"],
      ["Selesai", data.cases.filter((item) => item.status === "resolved").length, "Hasil pada contoh lokal"],
      ["Prioritas tinggi", data.cases.filter((item) => item.priority === "urgent" && item.status !== "resolved").length, "Periksa lebih dahulu"]
    ] : [
      ["Menunggu keputusan", data.requests.filter((item) => item.status === "pending").length, "Seluruh pengajuan aktif"],
      ["Dapat saya tinjau", data.requests.filter((item) => !demo.approvalBlock(item, hub.state.actor, data)).length, "Prasyarat contoh terpenuhi"],
      ["Pengajuan saya", data.requests.filter((item) => item.status === "pending" && item.makerId === hub.state.actor).length, "Perlu penyetuju berbeda"],
      ["Sudah diputuskan", data.requests.filter((item) => item.status !== "pending").length, "Disetujui atau ditolak"]
    ];
    items.forEach(([label, count, description]) =>
    {
      const stat = node("div", "catalog-stat");
      stat.append(node("span", "", label), node("strong", "", count), node("small", "", description));
      stats.append(stat);
    });
    hub.root.append(stats);
  }

  function filtered(data)
  {
    const rows = isReconciliation ? data.cases : data.requests;
    return rows.filter((item) =>
    {
      const query = `${item.id} ${item.title} ${item.orderId} ${item.reference || ""} ${item.makerName || ""}`.toLocaleLowerCase("id-ID");
      const filter = hub.state.filter;
      const matches = filter === "all" || filter === item.status
        || (filter === "urgent" && item.priority === "urgent" && item.status !== "resolved")
        || (filter === "reviewable" && !demo.approvalBlock(item, hub.state.actor, data))
        || (filter === "own" && item.status === "pending" && item.makerId === hub.state.actor);
      return query.includes(hub.state.query.trim().toLocaleLowerCase("id-ID")) && matches
        && (isReconciliation || hub.state.category === "all" || item.type === hub.state.category);
    }).sort((first, second) =>
    {
      const priority = hub.state.sort === "attention" ? Number(second.priority === "urgent") - Number(first.priority === "urgent") : 0;
      return priority || Date.parse(second.createdAt) - Date.parse(first.createdAt) || first.id.localeCompare(second.id);
    });
  }

  function renderList(data)
  {
    const controls =
    [
      reviewLink(isReconciliation ? "Buka persetujuan" : "Buka rekonsiliasi", isReconciliation ? "../superadmin/sensitive-approvals.html" : "../superadmin/payment-reconciliation.html")
    ];
    if (!isReconciliation)
    {
      controls.unshift(button("Ajukan koreksi status", "correction-start", {}, "queue-button queue-button--primary"));
    }
    hub.heading(title, isReconciliation ? "Bandingkan transaksi dan selesaikan selisih melalui jalur yang tepat."
      : "Tinjau pengajuan lintas modul dengan dampak dan kewenangan yang jelas.", controls);
    note();
    if (hub.loadState("Belum ada kasus", "Kasus dan pengajuan baru akan ditampilkan di sini."))
    {
      return;
    }
    renderStats(data);
    hub.root.append(banner(isReconciliation ? "Pemeriksaan sebelum perubahan" : "Persetujuan berbeda dari pelaksanaan",
      isReconciliation ? "Periksa gateway terlebih dahulu. Bukti manual memerlukan SuperAdmin berbeda dan tidak boleh melewati selisih nominal."
        : "Pengaju tidak dapat memutuskan usulannya sendiri. Refund yang disetujui belum berarti dana telah dicairkan."));
    const area = node("section", "support-register");
    area.setAttribute("aria-label", title);
    const tools = node("div", "report-tools");
    const filters = isReconciliation ? [
      ["all", "Semua status"], ["review", "Perlu ditinjau"], ["awaiting", "Menunggu keputusan"], ["resolved", "Selesai"], ["urgent", "Prioritas tinggi"]
    ] : [
      ["all", "Semua status"], ["pending", "Menunggu keputusan"], ["reviewable", "Dapat saya tinjau"],
      ["own", "Pengajuan saya"], ["approved", "Disetujui"], ["rejected", "Ditolak"]
    ];
    tools.append(hub.searchField(isReconciliation ? "Cari kasus, pesanan atau referensi" : "Cari pengajuan, pesanan atau pengaju"),
      hub.field("Kondisi", "filter", hub.select(filters, hub.state.filter, "filter")));
    if (!isReconciliation)
    {
      tools.append(hub.field("Jenis", "category", hub.select([["all", "Semua jenis"], ...Object.entries(types)], hub.state.category, "category")));
    }
    tools.append(hub.field("Urutan", "sort", hub.select([["newest", "Terbaru dahulu"], ["attention", "Prioritas dahulu"]], hub.state.sort, "sort")),
      button("Reset filter", "reset"));
    area.append(tools);
    const rows = filtered(data);
    const footer = hub.pagination(rows.length);
    const visible = rows.slice((hub.state.pageIndex - 1) * hub.pageSize, hub.state.pageIndex * hub.pageSize).map((item) =>
    {
      const identity = node("div");
      const source = item.orderId || data.stocks[item.stockId]?.name;
      identity.append(node("strong", "", item.id), node("small", "", item.title));
      if (source)
      {
        identity.append(node("small", "", source));
      }
      const amount = node("div");
      const impact = item.type === "terminal-correction" ? orderLabels[item.targetStatus]
        : isReconciliation || item.type === "refund" || item.type === "reconciliation"
          ? money(item.amount) : `${item.delta > 0 ? "+" : ""}${item.delta} ${item.unit}`;
      amount.append(node("strong", "review-money", impact));
      amount.append(node("small", "", isReconciliation ? "Nilai pesanan contoh" : types[item.type]));
      const middle = node("div");
      middle.append(node("span", "", isReconciliation ? checkLabels[item.lastCheck] || "Belum diperiksa" : item.makerName));
      if (item.priority === "urgent")
      {
        middle.append(node("small", "", "Prioritas tinggi"));
      }
      return [identity, amount, middle, status(item), button("Buka detail", "review-open", { id: item.id })];
    });
    if (visible.length)
    {
      area.append(table([isReconciliation ? "Kasus & pesanan" : "Pengajuan", "Nilai / dampak",
        isReconciliation ? "Pemeriksaan" : "Pengaju", "Status", "Tindakan"], visible));
    }
    else
    {
      const empty = node("div", "report-state");
      empty.append(node("h2", "", "Tidak ada hasil yang cocok"), node("p", "support-meta", "Ubah pencarian atau reset filter."), button("Reset filter", "reset"));
      area.append(empty);
    }
    area.append(footer);
    hub.root.append(area);
  }

  function historyPanel(record)
  {
    const section = panel("Aktivitas lokal", "Riwayat contoh kedua halaman, bukan audit produksi atau hasil dari gateway.");
    const list = node("ol", "support-timeline");
    record.history.forEach((event) =>
    {
      const row = node("li");
      row.append(node("strong", "", event.title), node("p", "", event.reason), node("small", "support-meta", event.actor),
        node("small", "support-meta", hub.date(event.at)));
      list.append(row);
    });
    section.append(list);
    return section;
  }

  function evidencePanel(record, data)
  {
    if (record.type === "terminal-correction")
    {
      const section = panel("Rujukan koreksi", "Cocokkan catatan asli dengan hasil pemeriksaan sebelum memutuskan.");
      section.append(hub.definition(
      [
        ["Catatan asli", record.originalEventId],
        ["Isi catatan", record.originalEvent.label],
        ["Pelaku asli", record.originalEvent.actor],
        ["Waktu asli", hub.date(record.originalEvent.at)],
        ["Rujukan pemeriksaan", record.reference]
      ]));
      section.append(banner("Rujukan contoh", "Rujukan berupa teks lokal, bukan bukti yang telah diverifikasi server. Pembayaran memerlukan bukti gateway melalui rekonsiliasi."));
      return section;
    }
    const section = panel("Bukti dan referensi", "Lampiran pada pratinjau hanya menyimpan nama/metadata, bukan isi berkas atau unggahan server.");
    const request = isReconciliation ? data.requests.find((item) => item.id === record.requestId)
      || data.requests.find((item) => item.caseId === record.id) : record;
    const evidence = request?.evidence || [];
    const list = node("ul", "support-timeline");
    evidence.forEach((file) =>
    {
      const row = node("li", "review-attachment");
      row.append(node("strong", "", file.name), node("p", "support-meta", file.note || "Metadata berkas lokal; isi belum diunggah."));
      list.append(row);
    });
    if (!evidence.length)
    {
      section.append(banner("Belum ada lampiran", "Gunakan modul sumber atau ajukan bukti manual setelah API contoh tidak tersedia."));
    }
    section.append(list);
    if (isReconciliation && request)
    {
      section.append(reviewLink("Buka pengajuan terkait", "../superadmin/sensitive-approvals.html", request.id));
    }
    section.append(banner("Bukti nyata tetap diperlukan", "Nama berkas dan kode contoh tidak membuktikan pembayaran. Aplikasi produksi harus menyimpan, menampilkan dan memverifikasi bukti yang sah.", "warning"));
    return section;
  }

  function comparisonPanel(item)
  {
    const section = panel("Perbandingan transaksi", "Nilai gateway adalah fixture contoh. Pemeriksaan pada halaman ini tidak memanggil API.");
    const unavailable = item.scenario === "unavailable";
    const rows = [
      ["Pesanan", item.orderId, unavailable ? "Belum tersedia" : item.gatewayOrder],
      ["Nominal", money(item.amount), unavailable ? "Belum tersedia" : money(item.gatewayAmount)],
      ["Mata uang", item.currency, unavailable ? "Belum tersedia" : item.gatewayCurrency],
      ["Status pembayaran", item.paymentStatus === "success" ? "Berhasil pada contoh" : "Perlu ditinjau", unavailable ? "Belum tersedia" : item.gatewayStatus === "success" ? "Berhasil pada fixture" : "Menunggu"]
    ].map(([label, system, gateway]) => [label, system, gateway]);
    section.append(table(["Bidang", "Sistem", "Gateway contoh"], rows, true));
    section.append(banner("Hasil pemeriksaan", checkLabels[item.lastCheck] || "Belum ada pemeriksaan. Nilai fixture belum merupakan verifikasi transaksi."));
    return section;
  }

  function impactPanel(request, data)
  {
    const section = panel("Dampak keputusan", "Periksa data dan prasyarat sebelum memberikan keputusan.");
    let values;
    if (request.type === "terminal-correction")
    {
      values =
      [
        ["Status asal", orderLabels[request.fromStatus]],
        ["Status usulan", orderLabels[request.targetStatus]],
        ["Riwayat yang dirujuk", request.originalEventId],
        ["Pembayaran tetap", request.paymentSnapshot],
        ["Pengiriman tetap", request.shippingSnapshot],
        ["Dampak stok dan refund", "Tidak dijalankan otomatis"],
        ["Jika disetujui", "Tambahkan catatan koreksi baru; pertahankan catatan asli"],
        ["Jika ditolak", "Tidak menambahkan koreksi pada sumber"]
      ];
    }
    else if (request.type === "refund")
    {
      values = [["Nominal pengajuan", money(request.amount)], ["Sisa hak contoh", money(data.refundRights[request.orderId] ?? request.remaining)],
        ["Jika disetujui", "Hak contoh dialokasikan; pencairan dana belum dijalankan"], ["Jika ditolak", "Dana tetap; pengajuan ditutup sebagai ditolak"]];
    }
    else if (request.type === "reconciliation")
    {
      const item = data.cases.find((entry) => entry.id === request.caseId);
      values = [["Kasus", request.caseId], ["Nominal", money(request.amount)], ["Pemeriksaan", checkLabels[item?.lastCheck] || "Tidak tersedia"],
        ["Jika disetujui", "Kasus dan status pembayaran contoh diperbarui, tanpa perubahan gateway atau modul pesanan"]];
    }
    else
    {
      const stock = data.stocks[request.stockId];
      const decided = request.status !== "pending" && request.beforeBalance !== undefined;
      values = [["Objek", stock.name], [decided ? "Saldo sebelum keputusan" : "Saldo contoh saat ini", `${decided ? request.beforeBalance : stock.balance} ${stock.unit}`],
        ["Reservasi / alokasi", `${decided ? request.reservedAtDecision : stock.reserved} ${stock.unit}`],
        ["Perubahan yang diajukan", `${request.delta > 0 ? "+" : ""}${request.delta} ${stock.unit}`],
        [decided ? "Saldo setelah keputusan" : "Saldo jika disetujui", `${decided ? request.afterBalance : stock.balance + request.delta} ${stock.unit}`],
        ["Revisi target", `${stock.version} (pengajuan: ${request.targetVersion})`]];
    }
    section.append(hub.definition(values), banner("Hasil saat ini", request.outcome));
    return section;
  }

  function renderDetail(data)
  {
    const collection = isReconciliation ? data.cases : data.requests;
    const record = collection.find((item) => item.id === hub.state.item);
    const back = button("Kembali ke daftar", "review-back", {}, "queue-text-button support-back");
    back.prepend(hub.icon("chevron"));
    hub.root.append(back);
    if (!record)
    {
      hub.heading("Kasus tidak ditemukan", "Kembali ke daftar untuk memilih kasus atau pengajuan yang tersedia.");
      return;
    }
    const controls = [];
    if (isReconciliation)
    {
      const check = button("Periksa gateway", "gateway-check", { id: record.id }, "queue-button queue-button--primary");
      check.disabled = record.status !== "review";
      const manual = button("Ajukan bukti manual", "manual-proposal", { id: record.id });
      manual.disabled = record.status !== "review" || record.lastCheck !== "unavailable";
      controls.push(check, manual);
    }
    else
    {
      const approve = button("Setujui", "approve-request", { id: record.id }, "queue-button queue-button--primary");
      const reject = button("Tolak", "reject-request", { id: record.id });
      approve.disabled = Boolean(demo.approvalBlock(record, hub.state.actor, data));
      reject.disabled = Boolean(demo.rejectionBlock(record, hub.state.actor));
      controls.push(approve, reject);
    }
    const source = record.orderId || data.stocks[record.stockId]?.name || types[record.type];
    hub.heading(record.title, `${record.id} — ${source}`, controls);
    note();
    const marks = node("div", "support-inline review-note");
    marks.append(status(record));
    if (record.priority === "urgent")
    {
      marks.append(badge("Prioritas tinggi", "warning"));
    }
    hub.root.append(marks);
    if (!isReconciliation)
    {
      const block = demo.approvalBlock(record, hub.state.actor, data);
      hub.root.append(banner(block ? "Batas keputusan" : "Prasyarat contoh terpenuhi", block
        || "Periksa bukti dan dampak. Keputusan memerlukan alasan dan autentikasi ulang contoh.", block ? "warning" : "info"));
    }
    else if (record.status !== "resolved")
    {
      hub.root.append(banner(record.status === "awaiting" ? "Menunggu SuperAdmin berbeda" : "Ikuti jalur pemeriksaan",
        record.status === "awaiting" ? "Ada usulan manual aktif. Periksa pengajuan sebelum mengambil keputusan lain."
          : "Jalur manual hanya dibuka setelah API contoh tidak tersedia. Selisih nominal dan transaksi menunggu tidak dapat dilewati."));
    }
    hub.root.append(hub.tabs(tabs, isReconciliation ? "Bagian rekonsiliasi" : "Bagian persetujuan"));
    if (hub.state.tab === "activity")
    {
      hub.root.append(historyPanel(record));
    }
    else if (hub.state.tab === "evidence")
    {
      hub.root.append(evidencePanel(record, data));
    }
    else if (hub.state.tab === "comparison")
    {
      hub.root.append(comparisonPanel(record));
    }
    else if (hub.state.tab === "impact")
    {
      hub.root.append(impactPanel(record, data));
    }
    else
    {
      const section = panel("Ringkasan kasus");
      const values = isReconciliation ? [
        ["Referensi gateway contoh", record.reference], ["Nilai pesanan", money(record.amount)], ["Mata uang", record.currency],
        ["Status pembayaran", record.paymentStatus === "success" ? "Berhasil pada contoh lokal" : "Perlu ditinjau"],
        ["Hasil pemeriksaan", checkLabels[record.lastCheck] || "Belum diperiksa"], ["Revisi", record.version]
      ] : [["Jenis", types[record.type]], ["Pengaju", record.makerName], ["Alasan pengajuan", record.reason],
        ["Dibuat", hub.date(record.createdAt)], ["Hasil", record.outcome], ["Revisi", record.version]];
      section.append(hub.definition(values));
      const related = node("div", "support-actions review-note");
      if (record.type === "terminal-correction")
      {
        related.append(correctionLink(record.orderId));
      }
      else if (record.orderId)
      {
        related.append(link("Buka Manajemen Pesanan", "../staff/orders-queue.html?tab=attention"));
      }
      if (isReconciliation && record.requestId)
      {
        related.append(reviewLink("Buka pengajuan terkait", "../superadmin/sensitive-approvals.html", record.requestId));
      }
      if (!isReconciliation && record.caseId)
      {
        related.append(reviewLink("Buka kasus rekonsiliasi", "../superadmin/payment-reconciliation.html", record.caseId));
      }
      if (!isReconciliation && record.type.includes("stock"))
      {
        related.append(link("Buka modul stok", record.type === "product-stock" ? "../staff/products.html" : "../staff/production-materials.html"));
      }
      section.append(related);
      hub.root.append(section);
    }
  }

  function render()
  {
    if (hub.state.role !== "superadmin")
    {
      hub.heading("Akses khusus SuperAdmin", "Halaman ini memerlukan kewenangan SuperAdmin.");
      hub.root.append(banner("Akses tidak tersedia", "Profil pada URL hanya memilih pratinjau. Identitas dan izin nyata harus diperiksa server.", "warning", [
        link("Kembali ke ruang kerja", "../staff/admin-dashboard.html")
      ]));
      return;
    }
    const data = demo.snapshot();
    const filters = isReconciliation ? ["all", "review", "awaiting", "resolved", "urgent"]
      : ["all", "pending", "reviewable", "own", "approved", "rejected"];
    if (!filters.includes(hub.state.filter))
    {
      hub.state.filter = "all";
    }
    if (!Object.hasOwn(types, hub.state.category))
    {
      hub.state.category = "all";
    }
    if (!tabs.some(([id]) => id === hub.state.tab))
    {
      hub.state.tab = "overview";
    }
    hub.account().name = actor().name;
    document.getElementById("profile-name").textContent = actor().name;
    document.getElementById("review-actor").value = hub.state.actor;
    if (hub.state.item)
    {
      renderDetail(data);
    }
    else if (!isReconciliation && hub.state.correctionSource)
    {
      renderCorrectionSource(data);
    }
    else
    {
      renderList(data);
    }
  }

  function acknowledgement(label)
  {
    const wrapper = node("label", "review-check");
    const control = hub.input("yes", "checkbox");
    control.name = "acknowledgement";
    wrapper.append(control, node("span", "", label));
    return wrapper;
  }

  function renderCorrectionSource(data)
  {
    const back = button("Kembali ke persetujuan", "correction-back", {}, "queue-text-button support-back");
    back.prepend(hub.icon("chevron"));
    hub.root.append(back);
    const selected = data.terminalOrders.find((item) => item.id === hub.state.correctionSource);
    const pending = selected && data.requests.find((item) => item.type === "terminal-correction" && item.orderId === selected.id && item.status === "pending");
    const terminal = selected && ["complete", "cancelled"].includes(selected.currentStatus);
    const controls = [];
    if (selected && terminal && !pending)
    {
      controls.push(button("Ajukan koreksi", "correction-propose", { id: selected.id }, "queue-button queue-button--primary"));
    }
    hub.heading("Koreksi status akhir", "Tinjau riwayat asli sebelum mengajukan catatan koreksi.", controls);
    note();
    if (hub.loadState("Belum ada sumber koreksi", "Buka pesanan Selesai atau Dibatalkan melalui modul Pesanan."))
    {
      return;
    }
    const choose = hub.select(
      [["select", "Pilih sumber pesanan"], ...data.terminalOrders.map((item) => [item.id, `${item.id} — ${item.customer}`])],
      selected?.id || "select", "correction-source"
    );
    choose.id = "correction-source";
    delete choose.dataset.hubFilter;
    choose.addEventListener("change", (event) => hub.navigate({ correctionSource: event.target.value }));
    const selector = panel("Sumber koreksi", "Pesanan dari modul Pesanan tersedia di sini setelah Anda membuka alur koreksinya.");
    selector.classList.add("review-source-selector");
    selector.append(hub.field("Pesanan", "correction-source", choose));
    hub.root.append(selector);
    if (!selected)
    {
      hub.root.append(banner("Pilih sumber terlebih dahulu", "Dua pesanan DEMO tersedia untuk mencoba alur. Sumber yang tidak ditemukan tidak dapat diproses."));
      return;
    }
    const original = panel("Riwayat asli", "Catatan ini tetap dipertahankan setelah keputusan koreksi.");
    const mark = node("div", "support-inline review-note");
    mark.append(badge(orderLabels[selected.sourceStatus], "info"),
      badge(selected.synthetic ? "Data contoh" : "Snapshot lokal pesanan", "info"));
    original.append(mark, hub.definition(
    [
      ["Pesanan", selected.id],
      ["Status pada sumber", orderLabels[selected.sourceStatus]],
      [selected.corrections.length ? "Status setelah koreksi contoh" : "Status yang tercatat", orderLabels[selected.currentStatus]],
      ["Pembayaran", selected.payment],
      ["Pengiriman", selected.shipping],
      ["Referensi catatan", selected.event.id],
      ["Isi catatan asli", selected.event.label],
      ["Pelaku asli", selected.event.actor],
      ["Waktu catatan", hub.date(selected.event.at)]
    ]));
    if (!selected.synthetic)
    {
      original.append(link("Buka detail pesanan", `../staff/orders-queue.html?role=${hub.state.role}&tab=all&order=${encodeURIComponent(selected.id)}`));
    }
    hub.root.append(original);
    if (pending)
    {
      hub.root.append(banner("Ada pengajuan aktif", "Selesaikan pengajuan yang tersedia sebelum membuat usulan lain.", "warning", [
        reviewLink("Buka pengajuan aktif", "../superadmin/sensitive-approvals.html", pending.id)
      ]));
    }
    else if (terminal)
    {
      hub.root.append(banner("Persetujuan kedua diperlukan", "Usulan hanya mengoreksi catatan status. Pembayaran, pengiriman, stok dan pemenuhan tidak dijalankan ulang."));
    }
    else
    {
      hub.root.append(banner("Status contoh bukan lagi status akhir", "Koreksi baru memerlukan status Selesai atau Dibatalkan. Tinjau catatan yang sudah disetujui dan modul sumber.", "warning"));
    }
    const notes = panel("Catatan koreksi", "Catatan baru merujuk riwayat asli dan keputusan terkait.");
    if (!selected.corrections.length)
    {
      notes.append(node("p", "support-meta", "Belum ada koreksi disetujui. Riwayat asli tetap."));
    }
    selected.corrections.slice().reverse().forEach((correction) =>
    {
      const row = node("div", "review-correction-note");
      row.append(node("strong", "", `${orderLabels[correction.before]} menjadi ${orderLabels[correction.after]}`),
        node("p", "", correction.reason),
        node("p", "support-meta", `Pengaju: ${correction.maker}. Penyetuju: ${correction.checker}.`),
        node("p", "support-meta", `Catatan asli: ${correction.originalEventId}`),
        node("p", "support-meta", hub.date(correction.at)),
        reviewLink("Buka keputusan", "../superadmin/sensitive-approvals.html", correction.requestId));
      notes.append(row);
    });
    hub.root.append(notes);
  }

  function proposeCorrection(control)
  {
    if (hub.state.role !== "superadmin")
    {
      return;
    }
    const source = demo.snapshot().terminalOrders.find((item) => item.id === control.dataset.id);
    const capturedActor = actor();
    if (!source)
    {
      hub.feedback("Sumber tidak ditemukan. Pilih kembali pesanan.", true);
      return;
    }
    hub.openDialog(
    {
      title: "Ajukan koreksi status",
      submitLabel: "Ajukan contoh",
      build(form)
      {
        form.append(banner("Catatan asli tidak ditimpa", "Diperlukan keputusan SuperAdmin berbeda. Usulan tidak mengubah pembayaran atau menjalankan transaksi.", "warning"),
          node("p", "review-form-reference", `${source.id} — status asal: ${orderLabels[source.currentStatus]}`));
        const choices = [["", "Pilih status yang benar"], ...Object.entries(orderLabels).filter(([id]) => id !== source.currentStatus)];
        form.append(hub.field("Status usulan", "targetStatus", hub.select(choices, "", "correction-target"),
          "Pilihan status adalah contoh. Kelayakan transisi produksi tetap harus diperiksa server.", true));
        const reference = hub.input();
        reference.maxLength = 160;
        form.append(hub.field("Rujukan pemeriksaan", "reference", reference,
          "5–160 karakter: referensi pemeriksaan atau dokumen internal. Gunakan data contoh.", true));
        form.append(node("p", "support-meta", `Tertaut ke catatan asli ${source.event.id}. Pembayaran tetap: ${source.payment}.`));
        decisionFields(form);
      },
      validate(form)
      {
        const errors = validateBase(form, capturedActor);
        const data = demo.snapshot();
        const latest = data.terminalOrders.find((item) => item.id === source.id);
        const request =
        {
          orderId: source.id,
          targetVersion: source.version,
          originalEventId: source.event.id,
          fromStatus: source.currentStatus,
          targetStatus: value(form, "targetStatus"),
          reference: value(form, "reference"),
          paymentSnapshot: source.payment,
          shippingSnapshot: source.shipping
        };
        const block = demo.correctionBlock(request, data);
        if (!latest || block)
        {
          errors.push(block || "Sumber tidak tersedia.");
        }
        return errors;
      },
      commit(form)
      {
        const result = demo.proposeCorrection(source.id, source.version, value(form, "targetStatus"),
          value(form, "reference"), value(form, "reason"), capturedActor);
        if (typeof result === "string")
        {
          hub.state.item = demo.snapshot().requests[0].id;
          hub.state.correctionSource = "";
          hub.state.tab = "overview";
        }
        return result;
      }
    });
  }

  function decisionFields(form)
  {
    const reason = node("textarea");
    reason.maxLength = 500;
    const mfa = hub.input();
    mfa.inputMode = "numeric";
    mfa.maxLength = 6;
    mfa.autocomplete = "off";
    form.append(hub.field("Alasan", "reason", reason, "5–500 karakter. Tidak boleh berisi kata sandi atau data rahasia.", true),
      hub.field("Kode MFA contoh", "mfa", mfa, "Gunakan 123456 untuk simulasi. Tidak ada verifikasi MFA nyata.", true),
      acknowledgement("Saya memahami bahwa keputusan ini hanya mengubah data contoh, tanpa transaksi server."));
  }

  function validateBase(form, capturedActor)
  {
    const errors = [];
    if (hub.state.role !== "superadmin" || capturedActor.id !== hub.state.actor)
    {
      errors.push("Pelaku atau kewenangan berubah. Tutup dialog dan tinjau ulang.");
    }
    const reason = value(form, "reason");
    if (reason.length < 5 || reason.length > 500)
    {
      errors.push("Alasan harus terdiri dari 5–500 karakter.");
    }
    if (value(form, "mfa") !== "123456")
    {
      errors.push("Isi kode MFA contoh 123456. Jangan gunakan kode autentikator asli.");
    }
    if (!form.elements.namedItem("acknowledgement").checked)
    {
      errors.push("Konfirmasikan bahwa Anda memahami dampak pada data contoh.");
    }
    if (document.getElementById("review-conflict").checked)
    {
      errors.push("Simulasi versi berubah: keputusan ditahan. Tinjau data terbaru sebelum mencoba lagi.");
    }
    return errors;
  }

  function gatewayCheck(control)
  {
    if (hub.state.role !== "superadmin")
    {
      return;
    }
    const record = demo.snapshot().cases.find((item) => item.id === control.dataset.id);
    const capturedActor = actor();
    if (!record || record.status !== "review")
    {
      hub.feedback("Kasus tidak lagi tersedia untuk pemeriksaan.", true);
      return;
    }
    hub.openDialog(
    {
      title: "Periksa gateway contoh",
      submitLabel: "Periksa contoh",
      build(form)
      {
        form.append(banner("Tidak memanggil gateway nyata", "Hasil berasal dari skenario fixture. Hanya kecocokan nominal, mata uang, pesanan dan status sukses yang menyelesaikan kasus contoh."));
        const reference = hub.input(record.reference);
        reference.maxLength = 100;
        form.append(hub.field("Referensi transaksi gateway", "reference", reference, "Cocokkan dengan referensi pada ringkasan kasus.", true));
        decisionFields(form);
      },
      validate(form)
      {
        const errors = validateBase(form, capturedActor);
        const latest = demo.snapshot().cases.find((item) => item.id === record.id);
        if (!latest || latest.version !== record.version || latest.status !== "review")
        {
          errors.push("Kasus telah berubah. Tutup dialog dan tinjau kembali.");
        }
        if (value(form, "reference") !== record.reference)
        {
          errors.push("Referensi tidak sesuai dengan transaksi contoh pada kasus ini.");
        }
        return errors;
      },
      commit(form)
      {
        return demo.checkGateway(record.id, record.version, value(form, "reference"), value(form, "reason"), capturedActor);
      }
    });
  }

  function manualProposal(control)
  {
    if (hub.state.role !== "superadmin")
    {
      return;
    }
    const record = demo.snapshot().cases.find((item) => item.id === control.dataset.id);
    const capturedActor = actor();
    if (!record || record.status !== "review" || record.lastCheck !== "unavailable")
    {
      hub.feedback("Jalur manual memerlukan hasil API tidak tersedia dan belum ada pengajuan aktif.", true);
      return;
    }
    hub.openDialog(
    {
      title: "Ajukan bukti manual",
      submitLabel: "Ajukan contoh",
      build(form)
      {
        form.append(banner("Menunggu penyetuju kedua", "Pengajuan belum mengonfirmasi pembayaran. SuperAdmin berbeda harus meninjau bukti dan dampaknya.", "warning"),
          node("p", "review-form-reference", `${record.reference} — ${money(record.amount)}`));
        const files = hub.input("", "file");
        files.multiple = true;
        files.accept = "image/jpeg,image/png,image/webp";
        form.append(hub.field("Bukti gateway contoh", "evidence", files,
          "1–5 JPG/PNG/WebP, maksimal 5 MB per berkas. Hanya nama/metadata disimpan; isi berkas tidak diunggah.", true));
        const selected = node("small", "review-file-note support-meta", "Belum ada berkas dipilih.");
        selected.setAttribute("role", "status");
        files.addEventListener("change", () =>
        {
          selected.textContent = Array.from(files.files).map((file) => file.name).join(", ") || "Belum ada berkas dipilih.";
        });
        form.append(selected);
        decisionFields(form);
      },
      validate(form)
      {
        const errors = validateBase(form, capturedActor);
        const latest = demo.snapshot().cases.find((item) => item.id === record.id);
        if (!latest || latest.version !== record.version || latest.status !== "review" || latest.lastCheck !== "unavailable")
        {
          errors.push("Kasus atau prasyarat pengajuan telah berubah.");
        }
        const files = Array.from(form.elements.namedItem("evidence").files);
        if (files.length < 1 || files.length > 5)
        {
          errors.push("Pilih 1–5 berkas bukti contoh.");
        }
        if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size <= 0 || file.size > 5 * 1024 * 1024))
        {
          errors.push("Setiap berkas harus JPG/PNG/WebP dengan ukuran lebih dari 0 dan maksimal 5 MB.");
        }
        return errors;
      },
      commit(form)
      {
        const evidence = Array.from(form.elements.namedItem("evidence").files).map((file) =>
        {
          return { name: file.name, size: file.size, type: file.type, note: "Metadata berkas lokal; isi tidak disimpan atau dikirim." };
        });
        return demo.proposeManual(record.id, record.version, value(form, "reason"), evidence, capturedActor);
      }
    });
  }

  function decideRequest(control, approve)
  {
    if (hub.state.role !== "superadmin")
    {
      return;
    }
    const data = demo.snapshot();
    const request = data.requests.find((item) => item.id === control.dataset.id);
    const capturedActor = actor();
    if (!request)
    {
      return;
    }
    const block = approve ? demo.approvalBlock(request, capturedActor.id, data) : demo.rejectionBlock(request, capturedActor.id);
    if (block)
    {
      hub.feedback(block, true);
      return;
    }
    hub.openDialog(
    {
      title: approve ? "Setujui pengajuan?" : "Tolak pengajuan?",
      submitLabel: approve ? "Setujui contoh" : "Tolak contoh",
      build(form)
      {
        const effect = !approve ? "Pengajuan ditutup sebagai ditolak. Dana dan stok tidak ditambah atau dikurangi."
          : request.type === "terminal-correction" ? "Tambahkan catatan koreksi tertaut. Riwayat asli, pembayaran, pengiriman dan stok tidak ditulis ulang."
          : request.type === "refund" ? "Hak refund contoh dialokasikan. Pencairan dana belum dijalankan."
            : request.type === "reconciliation" ? "Kasus dan pembayaran contoh diselesaikan setelah keputusan kedua. Tidak ada konfirmasi gateway nyata."
              : "Saldo pada contoh kedua halaman diperbarui sekali. Modul stok lain tetap.";
        form.append(node("p", "review-form-reference", `${request.id} — ${request.title}`), banner("Dampak keputusan", effect, "warning"));
        decisionFields(form);
      },
      validate(form)
      {
        const errors = validateBase(form, capturedActor);
        const latestData = demo.snapshot();
        const latest = latestData.requests.find((item) => item.id === request.id);
        if (!latest || latest.version !== request.version)
        {
          errors.push("Pengajuan telah berubah. Tutup dialog dan tinjau kembali.");
        }
        else
        {
          const latestBlock = approve ? demo.approvalBlock(latest, capturedActor.id, latestData) : demo.rejectionBlock(latest, capturedActor.id);
          if (latestBlock)
          {
            errors.push(latestBlock);
          }
        }
        return errors;
      },
      commit(form)
      {
        return demo.decide(request.id, request.version, approve, value(form, "reason"), capturedActor);
      }
    });
  }

  function resetDemo()
  {
    if (hub.state.role !== "superadmin")
    {
      return;
    }
    hub.openDialog(
    {
      title: "Reset dua halaman contoh?",
      submitLabel: "Reset contoh",
      build(form)
      {
        form.append(banner("Hanya data pratinjau", "Keputusan, pengajuan baru dan metadata lampiran pada dua halaman ini kembali ke fixture awal. Tidak ada data server atau modul lain yang dihapus.", "warning"));
      },
      commit()
      {
        const result = demo.reset();
        if (typeof result === "string")
        {
          hub.state.item = "";
          hub.state.correctionSource = "";
          hub.state.filter = "all";
          hub.state.query = "";
          hub.state.pageIndex = 1;
        }
        return result;
      }
    });
  }

  document.getElementById("review-actor").addEventListener("change", (event) =>
  {
    hub.navigate({ actor: event.target.value }, false);
  });
  hub.start(render,
  {
    "review-open": (control) => hub.navigate({ item: control.dataset.id, correctionSource: "", tab: "overview" }),
    "review-back": () => hub.navigate({ item: "" }),
    "correction-start": () => hub.navigate({ item: "", correctionSource: "select" }),
    "correction-back": () => hub.navigate({ item: "", correctionSource: "" }),
    "correction-propose": proposeCorrection,
    "gateway-check": gatewayCheck,
    "manual-proposal": manualProposal,
    "approve-request": (control) => decideRequest(control, true),
    "reject-request": (control) => decideRequest(control, false),
    "reset-demo": resetDemo
  });
})();
