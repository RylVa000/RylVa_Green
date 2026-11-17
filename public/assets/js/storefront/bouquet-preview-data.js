"use strict";

// Preview DTO: option prices and pack sizes mirror SQL seeds. The base product,
// zero base price, availability, and visual positions are illustrative, not live stock.
window.RylvaBouquetPreviewData = (() =>
{
  const productId = "preview-custom-bouquet";
  const groups =
  [
    { id: "flowers", name: "Bunga utama", icon: "flower", required: true, mode: "many", min: 1, max: 3 },
    { id: "foliage", name: "Bunga & daun pendamping", icon: "foliage", required: false, mode: "many", min: 0, max: 2 },
    { id: "wrap", name: "Pembungkus", icon: "wrap", required: true, mode: "one", min: 1, max: 1 },
    { id: "ribbon", name: "Pita", icon: "ribbon", required: true, mode: "one", min: 1, max: 1 }
  ];
  const options =
  [
    { id: "red-rose", groupId: "flowers", name: "Mawar merah", pack: "Paket 5 tangkai", price: 60000, max: 6, visual: 0 },
    { id: "white-rose", groupId: "flowers", name: "Mawar putih", pack: "Paket 5 tangkai", price: 65000, max: 6, visual: 1 },
    { id: "baby-breath", groupId: "foliage", name: "Baby's breath", pack: "1 ikat", price: 25000, max: 3, visual: 2 },
    { id: "eucalyptus", groupId: "foliage", name: "Eucalyptus", pack: "1 ikat", price: 30000, max: 2, visual: 3 },
    { id: "sage-wrap", groupId: "wrap", name: "Pembungkus sage", pack: "Paket 3 lembar", price: 15000, max: 2, visual: 4 },
    { id: "cream-ribbon", groupId: "ribbon", name: "Pita satin krem", pack: "1,5 meter", price: 5000, max: 1, visual: 5 }
  ];
  const fields = { label: 100, theme: 100, message: 200, sender: 100, note: 300 };
  const fieldLabels =
  {
    label: "Nama rakitan", theme: "Tema atau acara", message: "Pesan kartu",
    sender: "Nama pengirim", note: "Catatan untuk florist"
  };

  function emptyDraft()
  {
    return { productId, selections: {}, quantity: 1, label: "", theme: "", message: "", sender: "", note: "" };
  }

  function validate(draft, requireComplete = true)
  {
    const errors = [];
    if (!draft || draft.productId !== productId || !draft.selections
      || typeof draft.selections !== "object" || Array.isArray(draft.selections))
    {
      return ["Produk atau konfigurasi buket tidak valid."];
    }
    if (!Number.isInteger(draft.quantity) || draft.quantity < 1 || draft.quantity > 20)
    {
      errors.push("Jumlah buket harus 1–20.");
    }
    for (const [key, limit] of Object.entries(fields))
    {
      if (typeof draft[key] !== "string" || Array.from(draft[key]).length > limit)
      {
        errors.push(fieldLabels[key] + " maksimal " + limit + " karakter. Perbaiki isinya sebelum melanjutkan.");
      }
    }
    for (const [id, quantity] of Object.entries(draft.selections))
    {
      const option = options.find((candidate) => candidate.id === id);
      if (!option || !Number.isInteger(quantity) || quantity < 1 || quantity > option.max)
      {
        errors.push("Pilihan atau jumlah paket tidak valid.");
      }
    }
    for (const group of groups)
    {
      const count = options.filter((option) => option.groupId === group.id && draft.selections[option.id]).length;
      if (count > group.max || (requireComplete && count < group.min))
      {
        errors.push(group.name + ": pilih " + (group.min === group.max ? group.min : group.min + "–" + group.max) + " jenis.");
      }
    }
    return errors;
  }

  function price(draft)
  {
    return options.reduce((total, option) => total + option.price * (draft.selections[option.id] || 0), 0);
  }

  function canonical(draft)
  {
    return JSON.stringify(
    {
      productId,
      selections: Object.entries(draft.selections).sort(([left], [right]) => left.localeCompare(right)),
      ...Object.fromEntries(Object.keys(fields).map((key) => [key, draft[key].trim()]))
    });
  }

  function line(draft, lineId, revision)
  {
    const unitPrice = price(draft);
    const summary = options.filter((option) => draft.selections[option.id])
      .map((option) => option.name + " · " + draft.selections[option.id] + " × " + option.pack);
    if (draft.message.trim())
    {
      summary.push("Kartu: " + draft.message.trim());
    }
    if (draft.sender.trim())
    {
      summary.push("Dari: " + draft.sender.trim());
    }
    if (draft.theme.trim())
    {
      summary.push("Tema: " + draft.theme.trim());
    }
    if (draft.note.trim())
    {
      summary.push("Catatan florist: " + draft.note.trim());
    }
    return {
      lineId, productId, variantId: null, name: draft.label.trim() || "Buket Kustom",
      variant: "Rakitan pilihan Anda", attributes: "Buket contoh",
      image: "/assets/images/products/bouquet.jpg", imageKey: "bouquet",
      unit: "buket", basePrice: unitPrice, price: unitPrice, quantity: draft.quantity,
      availableStock: 20, available: true, selected: true, handling: "perishable",
      configuration: summary, configurationRef: lineId, configurationRevision: revision,
      configurationDraft: structuredClone(draft), hasBouquetCard: Boolean(draft.message.trim())
    };
  }

  return { productId, groups, options, fields, emptyDraft, validate, price, canonical, line };
})();
