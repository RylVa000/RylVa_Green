"use strict";

(() =>
{
  const key = "rylva.superadminReview.demo.v2";
  const fixture = window.superadminReviewFixture;
  let memory = structuredClone(fixture);
  let memoryOnly = false;

  function snapshot()
  {
    if (!memoryOnly)
    {
      try
      {
        const saved = JSON.parse(sessionStorage.getItem(key) || "null");
        if (saved?.schema === fixture.schema && Array.isArray(saved.cases) && Array.isArray(saved.requests)
          && Array.isArray(saved.actors) && saved.stocks && saved.refundRights)
        {
          memory = saved;
        }
      }
      catch
      {
        memoryOnly = true;
      }
    }
    memory.terminalOrders ??= structuredClone(fixture.terminalOrders);
    return structuredClone(memory);
  }

  function transact(update)
  {
    const next = snapshot();
    const error = update(next);
    if (error)
    {
      return { errors: [error] };
    }
    if (!memoryOnly)
    {
      try
      {
        sessionStorage.setItem(key, JSON.stringify(next));
      }
      catch
      {
        return { errors: ["Data contoh belum dapat disimpan di tab ini. Isian tetap tersedia; coba lagi atau gunakan tab baru."] };
      }
    }
    memory = next;
    return null;
  }

  function entry(record, title, reason, actor)
  {
    record.history.unshift({ title, reason, actor: actor.name, at: new Date().toISOString() });
    record.version += 1;
  }

  function approvalBlock(request, actorId, data = snapshot())
  {
    if (request.status !== "pending")
    {
      return "Pengajuan sudah diputuskan. Keputusan tidak dapat diterapkan ulang.";
    }
    if (request.makerId === actorId)
    {
      return "Pengaju tidak boleh menjadi penyetuju. Diperlukan SuperAdmin lain.";
    }
    if (request.type === "terminal-correction")
    {
      return correctionBlock(request, data);
    }
    const remaining = Math.min(request.remaining ?? 0, data.refundRights[request.orderId] ?? 0);
    if (request.type === "refund" && (!Number.isSafeInteger(request.amount) || request.amount <= 0 || request.amount > remaining))
    {
      return "Nominal melebihi sisa hak refund atau tidak sah. Periksa kembali di modul pesanan.";
    }
    if (request.type === "reconciliation")
    {
      const item = data.cases.find((candidate) => candidate.id === request.caseId);
      if (!item || item.status !== "awaiting" || item.requestId !== request.id || item.version !== request.caseVersion)
      {
        return "Kasus rekonsiliasi telah berubah. Tinjau data terbaru sebelum keputusan.";
      }
      if (item.lastCheck !== "unavailable" || item.amount !== request.amount || !request.evidence.length)
      {
        return "Prasyarat API tidak tersedia, nominal atau bukti manual belum sesuai.";
      }
    }
    if (request.type === "product-stock" || request.type === "material-stock")
    {
      const stock = data.stocks[request.stockId];
      if (!stock || stock.version !== request.targetVersion)
      {
        return "Revisi stok telah berubah. Tinjau pengajuan terbaru dari modul sumber.";
      }
      if (!Number.isSafeInteger(request.delta) || request.delta === 0 || stock.balance + request.delta < stock.reserved)
      {
        return "Pengurangan melampaui stok bebas atau jumlah tidak sah. Alokasi/reservasi tetap dilindungi.";
      }
    }
    return "";
  }

  function correctionBlock(request, data = snapshot())
  {
    const source = data.terminalOrders.find((item) => item.id === request.orderId);
    if (!source || source.version !== request.targetVersion || source.currentStatus !== request.fromStatus
      || source.event.id !== request.originalEventId)
    {
      return "Snapshot atau revisi sumber berubah. Buka kembali pesanan dan tinjau usulan terbaru.";
    }
    if (!["complete", "cancelled"].includes(source.currentStatus)
      || !Object.hasOwn(fixture.orderStatusLabels, request.targetStatus) || request.targetStatus === source.currentStatus)
    {
      return "Koreksi memerlukan status asal Selesai/Dibatalkan dan status usulan yang berbeda.";
    }
    if (!request.reference || request.reference.length < 5 || request.reference.length > 160
      || source.payment !== request.paymentSnapshot || source.shipping !== request.shippingSnapshot)
    {
      return "Rujukan pemeriksaan atau snapshot pembayaran/pengiriman tidak sesuai. Koreksi status tidak boleh mengubah transaksi tersebut.";
    }
    return "";
  }

  function registerTerminalOrder(source)
  {
    snapshot();
    if (memoryOnly)
    {
      return { errors: ["Penyimpanan tab tidak tersedia. Snapshot tidak dapat dibawa ke halaman persetujuan; aktifkan penyimpanan atau gunakan data DEMO di halaman tersebut."] };
    }
    const result = transact((data) =>
    {
      if (!["complete", "cancelled"].includes(source.sourceStatus) || !source.event?.id || !source.sourceFingerprint)
      {
        return "Hanya snapshot pesanan Selesai atau Dibatalkan yang dapat diajukan untuk koreksi.";
      }
      const existing = data.terminalOrders.find((item) => item.id === source.id);
      if (existing?.sourceFingerprint === source.sourceFingerprint)
      {
        return "";
      }
      const next = structuredClone(source);
      next.currentStatus = next.sourceStatus;
      next.version = existing ? existing.version + 1 : 1;
      next.corrections = existing?.corrections || [];
      if (existing)
      {
        Object.assign(existing, next);
      }
      else
      {
        data.terminalOrders.unshift(next);
      }
      return "";
    });
    return result || "Snapshot contoh tersedia untuk usulan koreksi.";
  }

  function proposeCorrection(orderId, version, targetStatus, reference, reason, actor)
  {
    const result = transact((data) =>
    {
      const source = data.terminalOrders.find((item) => item.id === orderId);
      if (!source || source.version !== version)
      {
        return "Sumber berubah atau tidak ditemukan. Tutup dialog dan tinjau ulang.";
      }
      if (data.requests.some((item) => item.type === "terminal-correction" && item.orderId === orderId && item.status === "pending"))
      {
        return "Masih ada usulan koreksi aktif untuk pesanan ini. Putuskan usulan tersebut lebih dahulu.";
      }
      const request =
      {
        id: `COR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        type: "terminal-correction",
        title: "Koreksi status akhir pesanan",
        orderId,
        status: "pending",
        priority: "urgent",
        makerId: actor.id,
        makerName: actor.name,
        fromStatus: source.currentStatus,
        targetStatus,
        targetVersion: version,
        originalEventId: source.event.id,
        originalEvent: structuredClone(source.event),
        paymentSnapshot: source.payment,
        shippingSnapshot: source.shipping,
        reference,
        reason,
        evidence: [],
        outcome: "Menunggu penyetuju berbeda; catatan asli tetap",
        createdAt: new Date().toISOString(),
        version: 1,
        history: []
      };
      const block = correctionBlock(request, data);
      if (block || reason.length < 5 || reason.length > 500)
      {
        return block || "Alasan koreksi harus 5–500 karakter.";
      }
      entry(request, "Usulan koreksi status diajukan", reason, actor);
      data.requests.unshift(request);
      return "";
    });
    return result || "Usulan koreksi contoh tersimpan. Status asli, pembayaran, pengiriman dan stok belum berubah.";
  }

  function rejectionBlock(request, actorId)
  {
    if (request.status !== "pending")
    {
      return "Pengajuan sudah diputuskan.";
    }
    return request.makerId === actorId ? "Pengaju tidak dapat memutuskan pengajuannya sendiri." : "";
  }

  function checkGateway(id, version, reference, reason, actor)
  {
    let outcome = "";
    const result = transact((data) =>
    {
      const item = data.cases.find((candidate) => candidate.id === id);
      if (!item || item.version !== version || item.status !== "review")
      {
        return "Kasus telah berubah atau tidak lagi dapat diperiksa. Tutup dialog dan tinjau ulang.";
      }
      if (reference !== item.reference)
      {
        return "Referensi tidak sesuai dengan transaksi contoh pada kasus ini.";
      }
      const matches = item.gatewayAmount === item.amount && item.gatewayCurrency === item.currency
        && item.gatewayOrder === item.orderId && item.gatewayStatus === "success";
      const status = item.scenario === "match" && !matches ? "mismatch" : item.scenario;
      item.lastCheck = status;
      item.checks.unshift({ result: status, reference, actor: actor.name, at: new Date().toISOString() });
      if (status === "match" && matches)
      {
        item.status = "resolved";
        item.paymentStatus = "success";
        outcome = "Data contoh cocok; kasus lokal selesai. Pesanan, dana dan gateway nyata tidak berubah.";
      }
      else
      {
        outcome = status === "unavailable" ? "Simulasi API tidak tersedia. Bukti manual dapat diajukan untuk tinjauan kedua."
          : status === "pending" ? "Gateway contoh masih menunggu. Pembayaran tidak dikonfirmasi."
            : "Data contoh tidak cocok. Pembayaran tetap perlu ditinjau; jalur manual tidak tersedia untuk selisih ini.";
      }
      entry(item, "Pemeriksaan gateway contoh", reason, actor);
      return "";
    });
    return result || outcome;
  }

  function proposeManual(id, version, reason, evidence, actor)
  {
    const result = transact((data) =>
    {
      const item = data.cases.find((candidate) => candidate.id === id);
      if (!item || item.version !== version || item.status !== "review" || item.lastCheck !== "unavailable")
      {
        return "Bukti manual hanya dapat diajukan setelah API tidak tersedia dan belum ada pengajuan aktif.";
      }
      if (!evidence.length || evidence.length > 5)
      {
        return "Lampirkan 1–5 berkas contoh yang sah.";
      }
      const requestId = `APR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      item.status = "awaiting";
      item.requestId = requestId;
      entry(item, "Bukti manual diajukan", reason, actor);
      data.requests.unshift(
      {
        id: requestId, type: "reconciliation", title: "Tinjauan bukti manual", makerId: actor.id, makerName: actor.name,
        status: "pending", priority: item.priority, reason, amount: item.amount, caseId: item.id,
        caseVersion: item.version, orderId: item.orderId, evidence, outcome: "Menunggu SuperAdmin berbeda",
        createdAt: new Date().toISOString(), version: 1,
        history: [{ title: "Bukti manual diajukan", reason, actor: actor.name, at: new Date().toISOString() }]
      });
      return "";
    });
    return result || "Usulan manual disimpan pada contoh. Pembayaran belum berubah dan menunggu SuperAdmin lain.";
  }

  function decide(id, version, approve, reason, actor)
  {
    let outcome = "";
    const result = transact((data) =>
    {
      const request = data.requests.find((candidate) => candidate.id === id);
      if (!request || request.version !== version)
      {
        return "Pengajuan telah berubah. Tutup dialog dan tinjau ulang.";
      }
      const block = approve ? approvalBlock(request, actor.id, data) : rejectionBlock(request, actor.id);
      if (block)
      {
        return block;
      }
      if (request.type === "product-stock" || request.type === "material-stock")
      {
        const stock = data.stocks[request.stockId];
        if (stock)
        {
          request.beforeBalance = stock.balance;
          request.reservedAtDecision = stock.reserved;
          request.afterBalance = approve ? stock.balance + request.delta : stock.balance;
        }
      }
      request.status = approve ? "approved" : "rejected";
      request.decidedBy = actor.name;
      entry(request, approve ? "Pengajuan disetujui" : "Pengajuan ditolak", reason, actor);
      if (request.type === "reconciliation")
      {
        const item = data.cases.find((candidate) => candidate.id === request.caseId);
        if (item && item.status === "awaiting" && item.requestId === request.id)
        {
          item.status = approve ? "resolved" : "review";
          item.paymentStatus = approve ? "success" : "review";
          item.requestId = "";
          entry(item, approve ? "Bukti manual disetujui" : "Usulan manual ditolak", reason, actor);
        }
        outcome = approve ? "Kasus pembayaran contoh selesai setelah keputusan kedua. Transaksi nyata tidak berubah."
          : "Usulan ditolak. Kasus contoh kembali perlu ditinjau; pembayaran tidak dikonfirmasi.";
      }
      else if (request.type === "terminal-correction")
      {
        if (approve)
        {
          const source = data.terminalOrders.find((item) => item.id === request.orderId);
          source.corrections.push(
          {
            id: `NOTE-${request.id}`,
            requestId: request.id,
            originalEventId: request.originalEventId,
            before: request.fromStatus,
            after: request.targetStatus,
            reason: request.reason,
            decisionReason: reason,
            reference: request.reference,
            maker: request.makerName,
            checker: actor.name,
            at: new Date().toISOString()
          });
          source.currentStatus = request.targetStatus;
          source.version += 1;
        }
        outcome = approve ? "Catatan koreksi contoh ditambahkan dan tertaut ke riwayat asli. Pembayaran, pengiriman, stok dan workflow pesanan tidak dijalankan ulang."
          : "Usulan koreksi ditolak. Catatan dan status sumber tetap.";
      }
      else if (approve && request.type !== "refund")
      {
        const stock = data.stocks[request.stockId];
        stock.balance += request.delta;
        stock.version += 1;
        outcome = "Saldo contoh pada dua halaman ini diperbarui. Modul produk/bahan dan stok server tidak berubah.";
      }
      else
      {
        if (approve && request.type === "refund")
        {
          data.refundRights[request.orderId] -= request.amount;
        }
        outcome = approve ? "Refund contoh disetujui. Pencairan dana belum dijalankan."
          : "Pengajuan ditolak pada contoh. Dana dan saldo tetap.";
      }
      request.outcome = outcome;
      return "";
    });
    return result || outcome;
  }

  function reset()
  {
    const result = transact((data) =>
    {
      Object.keys(data).forEach((property) => delete data[property]);
      Object.assign(data, structuredClone(fixture));
      return "";
    });
    return result || "Data contoh kedua halaman dikembalikan ke awal. Tidak ada data server yang diubah.";
  }

  window.superadminReview =
  {
    snapshot, approvalBlock, rejectionBlock, checkGateway, proposeManual, decide, reset,
    correctionBlock, registerTerminalOrder, proposeCorrection,
    isMemoryOnly: () => memoryOnly
  };
})();
