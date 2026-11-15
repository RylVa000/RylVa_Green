"use strict";

// Emulates a bounded server query over synthetic fixtures; no API is called.
window.RylvaMyOrdersPreview = (() =>
{
  const scenarioLabels =
  {
    normal: "Daftar pesanan",
    empty: "Belum mempunyai pesanan",
    loading: "Loading awal",
    slow: "Pemuatan lama — dapat dicoba ulang",
    loadError: "Gagal pertama — retry berhasil",
    refreshError: "Gagal memperbarui — data terakhir",
    offline: "Offline — snapshot terakhir",
    service: "Gangguan layanan",
    maintenance: "Pemeliharaan",
    rateLimit: "429 — tunggu lalu coba lagi",
    login: "Perlu masuk",
    session: "Sesi berakhir saat refresh",
    denied: "Akun tidak diizinkan",
    verification: "Perlu verifikasi akun",
    unavailable: "Daftar tidak tersedia",
    partial: "Metadata item belum lengkap",
    partialPage: "Satu kartu tidak valid",
    invalid: "Nominal tidak valid",
    unknown: "Status belum dikenali",
    imageError: "Foto produk gagal dimuat",
    long: "Nama panjang dan nominal besar",
    archived: "Riwayat hanya baca",
    duplicate: "Respons berisi duplikat",
    stale: "Data belum diperbarui",
    changed: "Status berubah setelah penyegaran",
    expired: "Batas pembayaran sudah lewat",
    cursorExpired: "Cursor kedaluwarsa pada halaman berikut",
    noCount: "Pagination tanpa total count",
    race: "Respons pencarian lambat"
  };

  function error(code, extra = {})
  {
    return Object.assign(new Error("Daftar pesanan belum dapat dimuat."), { code }, extra);
  }

  function clone(value)
  {
    return JSON.parse(JSON.stringify(value));
  }

  function queryScope(query)
  {
    return JSON.stringify({ ...query, cursor: "" });
  }

  function cursorFor(snapshot, query)
  {
    const encoded = new TextEncoder().encode(JSON.stringify(
    {
      at: snapshot.createdAt,
      id: snapshot.orderId,
      scope: queryScope(query),
      owner: window.RylvaOrdersPreviewRepository.customerId
    }));
    return window.btoa(String.fromCharCode(...encoded));
  }

  function delay(milliseconds, signal)
  {
    return new Promise((resolve, reject) =>
    {
      if (signal?.aborted)
      {
        reject(new DOMException("Request cancelled", "AbortError"));
        return;
      }
      const timer = window.setTimeout(resolve, milliseconds);
      signal?.addEventListener("abort", () =>
      {
        window.clearTimeout(timer);
        reject(new DOMException("Request cancelled", "AbortError"));
      }, { once: true });
    });
  }

  function createAdapter()
  {
    const requested = new URLSearchParams(window.location.search).get("state") || "normal";
    const scenario = Object.hasOwn(scenarioLabels, requested) ? requested : "unavailable";
    const repository = window.RylvaOrdersPreviewRepository;
    let readCount = 0;
    let decorated = false;

    function decorate()
    {
      if (decorated)
      {
        return;
      }
      decorated = true;
      const snapshot = repository.ownOrders()[0];
      if (["long", "imageError", "invalid", "unknown", "partial", "expired", "archived"].includes(scenario))
      {
        if (scenario === "long")
        {
          snapshot.items[0].name = "Monstera Deliciosa dengan pot keramik, rincian varian dan nama produk sangat panjang untuk memeriksa keterbacaan kartu pesanan";
          snapshot.items[0].variant = "Pot keramik besar dengan label konfigurasi pesanan yang panjang";
          snapshot.items[0].amount = 999999999;
          snapshot.subtotalAmount = 1000074999;
          snapshot.totalAmount = 1000099999;
        }
        if (scenario === "imageError")
        {
          snapshot.items[0].image = "../../assets/images/products/not-available.jpg";
        }
        if (scenario === "invalid")
        {
          snapshot.totalAmount = -1;
        }
        if (scenario === "unknown")
        {
          snapshot.orderStatus = "STATUS_BARU";
        }
        if (scenario === "partial")
        {
          snapshot.items[0].variant = null;
          snapshot.deliverySlot = null;
        }
        if (scenario === "expired")
        {
          snapshot.expiresAt = new Date(Date.now() - 1000).toISOString();
          snapshot.attempt.expiresAt = snapshot.expiresAt;
        }
        if (scenario === "archived")
        {
          snapshot.archived = true;
          snapshot.allowedActions = {};
        }
        repository.save(snapshot);
      }
    }

    return {
      isPreview: true,
      scenario,
      async getPage(query, { signal } = {})
      {
        if (window.RylvaCustomerPreviewAccess?.isSignedOut())
        {
          throw error("login");
        }
        readCount += 1;
        const currentRead = readCount;
        if (scenario === "loading" || (scenario === "slow" && currentRead === 1))
        {
          await delay(600000, signal);
        }
        await delay(scenario === "race" && query.q.toLowerCase().startsWith("mon") ? 1200 : 280, signal);
        const persistentErrors = ["service", "maintenance", "login", "denied", "verification", "unavailable"];
        if (persistentErrors.includes(scenario))
        {
          throw error(scenario);
        }
        if (scenario === "loadError" && currentRead === 1)
        {
          throw error("loadError");
        }
        if (scenario === "rateLimit" && currentRead === 1)
        {
          throw error("rateLimit", { retryAfter: 3 });
        }
        if (currentRead > 1 && ["refreshError", "offline", "session"].includes(scenario))
        {
          throw error(scenario === "refreshError" ? "service" : scenario);
        }
        decorate();
        if (scenario === "changed" && currentRead > 1)
        {
          const snapshot = repository.read("preview-order-001");
          snapshot.orderStatus = "Siap Diproses";
          snapshot.paymentStatus = "Berhasil";
          snapshot.verifiedPaidAmount = snapshot.totalAmount;
          snapshot.receiptAvailable = true;
          snapshot.allowedActions = { retry: false, changeMethod: false, cancel: true };
          snapshot.version += 1;
          repository.save(snapshot);
        }
        let records = scenario === "empty" ? [] : repository.ownOrders();
        const term = query.q.toLocaleLowerCase("id-ID");
        records = records.filter((snapshot) =>
        {
          const matchesTerm = !term || snapshot.orderNo.toLowerCase().includes(term)
            || snapshot.items.some((item) => item.name.toLocaleLowerCase("id-ID").includes(term));
          const matchesStatus = query.status === "all" || (query.status === "processing"
            ? ["Siap Diproses", "Sedang Disiapkan"].includes(snapshot.orderStatus)
            : snapshot.orderStatus === query.status);
          const createdAt = Date.parse(snapshot.createdAt);
          const fromTime = query.dateFrom ? Date.parse(query.dateFrom + "T00:00:00+07:00") : -Infinity;
          const toTime = query.dateTo ? Date.parse(query.dateTo + "T00:00:00+07:00") + 86400000 : Infinity;
          return matchesTerm && matchesStatus && createdAt >= fromTime && createdAt < toTime;
        });
        const direction = query.sort === "oldest" ? 1 : -1;
        records.sort((first, second) => direction * (Date.parse(first.createdAt) - Date.parse(second.createdAt)
          || first.orderId.localeCompare(second.orderId)));
        let startIndex = 0;
        if (query.cursor)
        {
          if (scenario === "cursorExpired")
          {
            throw error("cursorExpired");
          }
          let cursor;
          try
          {
            const decoded = Uint8Array.from(window.atob(query.cursor), (character) => character.charCodeAt(0));
            cursor = JSON.parse(new TextDecoder().decode(decoded));
          }
          catch
          {
            throw error("cursorExpired");
          }
          if (cursor.scope !== queryScope(query) || cursor.owner !== repository.customerId)
          {
            throw error("cursorExpired");
          }
          const found = records.findIndex((snapshot) => snapshot.orderId === cursor.id && snapshot.createdAt === cursor.at);
          if (found < 0)
          {
            throw error("cursorExpired");
          }
          startIndex = found + 1;
        }
        const pageSize = 10;
        const pageRecords = records.slice(startIndex, startIndex + pageSize);
        const nextCursor = startIndex + pageSize < records.length ? cursorFor(pageRecords.at(-1), query) : null;
        const previousBoundary = startIndex - pageSize - 1;
        const previousCursor = previousBoundary >= 0 ? cursorFor(records[previousBoundary], query) : null;
        if (scenario === "partialPage" && pageRecords.length)
        {
          pageRecords[0] = { orderId: null, orderNo: null, items: [] };
        }
        if (scenario === "duplicate" && pageRecords.length)
        {
          pageRecords.push(clone(pageRecords[0]));
        }
        const now = new Date().toISOString();
        return {
          records: pageRecords,
          query: clone(query),
          totalCount: scenario === "noCount" ? null : records.length,
          ownOrderCount: scenario === "empty" ? 0 : repository.ownOrders().length,
          pagination: { nextCursor, previousCursor, hasPrevious: startIndex > 0, startIndex, pageSize },
          serverNow: now,
          snapshotAt: now,
          stale: ["stale", "offline"].includes(scenario)
        };
      }
    };
  }

  return { createAdapter, scenarioLabels };
})();
