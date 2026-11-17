"use strict";

// Tab-scoped synthetic customer configuration storage. No production writes.
// Gift text stays out of URLs and localStorage; all prices are rebuilt from fixtures.
window.RylvaBouquetCartPreview = (() =>
{
  const key = "rylva-bouquet-cart-preview-v1";
  const accessKey = "rylva-bouquet-preview-access-v1";
  const data = window.RylvaBouquetPreviewData;
  let loadedRaw = null;
  let warning = "";

  function active()
  {
    try
    {
      return sessionStorage.getItem(accessKey) === "customer-example"
        && !window.RylvaCustomerPreviewAccess?.isSignedOut();
    }
    catch
    {
      return false;
    }
  }

  function read()
  {
    if (!active())
    {
      loadedRaw = null;
      return [];
    }
    const raw = sessionStorage.getItem(key);
    loadedRaw = raw;
    if (!raw)
    {
      return [];
    }
    warning = "";
    const discardMessage = "Konfigurasi buket contoh yang tidak valid dilewati. Susun ulang rakitan yang masih diperlukan.";
    try
    {
      const stored = JSON.parse(raw);
      if (stored.version !== 1 || !Array.isArray(stored.items))
      {
        warning = discardMessage;
        return [];
      }
      return stored.items.flatMap((record) =>
      {
        if (!record || !/^bouquet-[a-f0-9]{64}$/.test(record.lineId) || data.validate(record.draft).length)
        {
          warning = discardMessage;
          return [];
        }
        return [data.line(record.draft, record.lineId, record.revision)];
      });
    }
    catch
    {
      warning = discardMessage;
      return [];
    }
  }

  function write(items)
  {
    const configured = items.filter((item) => item.configurationDraft);
    if (!active())
    {
      if (configured.length)
      {
        throw Object.assign(new Error("Masuk kembali sebelum menyimpan rakitan. Pilihan Anda tetap ada di halaman ini."), { code: "session" });
      }
      return;
    }
    const raw = sessionStorage.getItem(key);
    if (raw !== loadedRaw)
    {
      throw Object.assign(new Error("Rakitan di keranjang telah berubah. Muat keranjang terbaru sebelum mencoba lagi."), { code: "conflict" });
    }
    const next = JSON.stringify({ version: 1, items: configured.map((item) =>
      ({ lineId: item.lineId, revision: item.configurationRevision, draft: { ...item.configurationDraft, quantity: item.quantity } })) });
    try
    {
      sessionStorage.setItem(key, next);
      loadedRaw = next;
    }
    catch
    {
      throw Object.assign(new Error("Penyimpanan tab tidak tersedia. Rakitan belum ditambahkan. Pilihan Anda tetap ada."), { code: "storage" });
    }
  }

  async function identity(draft)
  {
    const bytes = new TextEncoder().encode(data.canonical(draft));
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return "bouquet-" + Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  return {
    active, read, write, identity, key,
    getWarning()
    {
      return warning;
    }
  };
})();
