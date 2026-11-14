"use strict";

// Synthetic, account-scoped snapshots shared by the three HTML preview pages.
window.RylvaOrdersPreviewRepository = (() =>
{
  const storageKey = "rylva-customer-orders-preview-v1";
  const customerId = "preview-customer";
  const records = new Map();

  function clone(value)
  {
    return JSON.parse(JSON.stringify(value));
  }

  function persist()
  {
    try
    {
      window.sessionStorage.setItem(storageKey, JSON.stringify(Array.from(records.values())));
    }
    catch
    {
      // Restricted storage falls back to the current tab's memory.
    }
  }

  function seed()
  {
    const scenarios = ["pending", "ready", "shipping", "delivered", "cod", "preparing", "stockIssue", "refund", "complaint", "review", "cancelled", "fullRefund", "perishable", "returned"];
    const now = Date.now();
    for (let index = 0; index < 27; index++)
    {
      const scenario = scenarios[index] || "completed";
      const base = window.RylvaPaymentPreview.createSnapshot(scenario === "pending" ? "pending" : "paid", now);
      const snapshot = window.RylvaOrderDetailPreview.createFixture(base, scenario);
      const age = index < 10 ? index * 12 * 60000 : (index - 8) * 86400000;
      for (const event of snapshot.history)
      {
        event.at = new Date(Date.parse(event.at) - age).toISOString();
      }
      snapshot.createdAt = new Date(Date.parse(snapshot.createdAt) - age).toISOString();
      if (snapshot.deliveredAt)
      {
        snapshot.deliveredAt = new Date(Date.parse(snapshot.deliveredAt) - age).toISOString();
        snapshot.complaintDeadline = new Date(Date.parse(snapshot.deliveredAt) + 86400000).toISOString();
      }
      if (scenario === "pending")
      {
        snapshot.createdAt = new Date(now - 3 * 60000).toISOString();
        snapshot.expiresAt = new Date(now + 7 * 60000).toISOString();
        snapshot.attempt.createdAt = snapshot.createdAt;
        snapshot.attempt.expiresAt = snapshot.expiresAt;
        snapshot.attempts = [{ ...clone(snapshot.attempt), amount: snapshot.totalAmount }];
        snapshot.history = [{ title: "Pesanan dibuat", at: snapshot.createdAt, detail: "Snapshot contoh tercatat." }];
      }
      const suffix = "K7M" + String.fromCharCode(65 + Math.floor(index / 16))
        + "R" + "ABCDEFGHJKLMNPQRSTUVWXYZ"[index % 23];
      const dateCode = new Date(Date.parse(snapshot.createdAt) + 7 * 3600000).toISOString().slice(2, 10).replaceAll("-", "");
      snapshot.orderId = "preview-order-" + String(index + 1).padStart(3, "0");
      snapshot.orderNo = "RV-" + dateCode + "-" + suffix;
      snapshot.ownerId = customerId;
      if (snapshot.verifiedPaidAmount !== null)
      {
        snapshot.paidAt = new Date(Date.parse(snapshot.createdAt) + 10 * 60000).toISOString();
      }
      snapshot.previewScenario = scenario;
      snapshot.allowedActions = { ...snapshot.allowedActions, ...window.RylvaOrderDetailPreview.rights(snapshot) };
      if (index >= 14)
      {
        snapshot.items = [clone(snapshot.items[index % snapshot.items.length])];
        snapshot.items[0].quantity = index % 3 + 1;
        snapshot.subtotalAmount = snapshot.items[0].amount * snapshot.items[0].quantity;
        snapshot.totalAmount = snapshot.subtotalAmount + snapshot.shippingAmount;
        snapshot.verifiedPaidAmount = snapshot.totalAmount;
      }
      if (snapshot.attempt)
      {
        snapshot.attempt.createdAt = snapshot.createdAt;
      }
      snapshot.attempts.forEach((attempt) =>
      {
        attempt.amount = snapshot.totalAmount;
        attempt.createdAt = snapshot.createdAt;
      });
      if (snapshot.orderStatus === "Selesai")
      {
        snapshot.history.unshift({ title: "Pesanan selesai", at: new Date(Date.parse(snapshot.deliveredAt) + 3600000).toISOString(), detail: "Penerimaan pesanan contoh telah dikonfirmasi." });
      }
      records.set(snapshot.orderId, snapshot);
    }
    const foreign = clone(records.get("preview-order-003"));
    foreign.orderId = "preview-foreign-order";
    foreign.ownerId = "another-preview-customer";
    records.set(foreign.orderId, foreign);
    persist();
  }

  function initialize()
  {
    try
    {
      const saved = JSON.parse(window.sessionStorage.getItem(storageKey));
      if (Array.isArray(saved) && saved.length)
      {
        for (const snapshot of saved)
        {
          records.set(snapshot.orderId, snapshot);
        }
        return;
      }
    }
    catch
    {
      // Invalid local preview fixtures are rebuilt from their declared source.
    }
    seed();
  }

  function synchronize()
  {
    try
    {
      const saved = JSON.parse(window.sessionStorage.getItem(storageKey));
      if (Array.isArray(saved))
      {
        records.clear();
        saved.forEach((snapshot) => records.set(snapshot.orderId, snapshot));
      }
    }
    catch
    {
      // Keep the in-memory preview when storage is unavailable.
    }
  }

  function read(orderId)
  {
    synchronize();
    const snapshot = records.get(orderId);
    if (!snapshot || snapshot.ownerId !== customerId)
    {
      throw Object.assign(new Error("Pesanan tidak ditemukan atau tidak dapat diakses."), { code: "notFound" });
    }
    const response = clone(snapshot);
    response.serverNow = new Date().toISOString();
    response.snapshotAt = response.serverNow;
    return response;
  }

  function save(snapshot)
  {
    const current = read(snapshot.orderId);
    if (current.ownerId !== snapshot.ownerId)
    {
      throw Object.assign(new Error("Pesanan tidak dapat diakses."), { code: "notFound" });
    }
    if (snapshot.version < current.version)
    {
      throw Object.assign(new Error("Status pesanan berubah."), { code: "conflict" });
    }
    records.set(snapshot.orderId, clone(snapshot));
    persist();
  }

  initialize();
  return {
    customerId,
    read,
    save,
    ownOrders()
    {
      synchronize();
      return Array.from(records.values()).filter((snapshot) => snapshot.ownerId === customerId).map(clone);
    },
    reset()
    {
      records.clear();
      seed();
    }
  };
})();
