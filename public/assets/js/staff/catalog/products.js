"use strict";

document.documentElement.classList.add("js");

const catalogPageSize = 5;
const catalogDialog = document.getElementById("product-confirm");
const catalogExpanded = new Set();
const catalogObjectUrls = new Set();
let catalogState = readCatalogState();
let productDraft = null;
let productTask = null;
let productDirty = false;
let productSaving = false;
let catalogLoadState = new URLSearchParams(location.search).get("state") || "full";
let productSequence = 100;

if (catalogLoadState === "empty")
{
  catalogProducts.length = 0;
  catalogLedger.length = 0;
  catalogReservations.length = 0;
  catalogApprovals.length = 0;
}

function pNode(tag, className = "", text = "")
{
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

function pIcon(name)
{
  const namespace = "http://www.w3.org/2000/svg";
  const icon = document.createElementNS(namespace, "svg");
  const use = document.createElementNS(namespace, "use");
  icon.setAttribute("class", "icon work-signal-icon");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("focusable", "false");
  use.setAttribute("href", `#i-${name}`);
  icon.append(use);
  return icon;
}

function pButton(label, action, primary = false, values = {})
{
  const button = pNode("button", primary ? "queue-button queue-button--primary" : "queue-button", label);
  button.type = "button";
  button.dataset.action = action;
  Object.assign(button.dataset, values);
  return button;
}

function pBadge(label, tone = "neutral", icon = "info")
{
  const badge = pNode("span", `work-signal work-signal--${tone}`);
  badge.append(pIcon(icon), document.createTextNode(label));
  return badge;
}

function pNote(text, warning = false)
{
  const note = pNode("p", warning ? "product-note product-note--warning" : "product-note");
  note.append(pIcon(warning ? "alert" : "info"), pNode("span", "", text));
  return note;
}

function productMoney(value)
{
  return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
}

function productDate(value)
{
  return new Intl.DateTimeFormat("id-ID",
  {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta"
  }).format(new Date(value.length === 10 ? `${value}T12:00:00+07:00` : value));
}

function readCatalogState()
{
  const query = new URLSearchParams(location.search);
  const choose = (name, allowed, fallback) => allowed.includes(query.get(name)) ? query.get(name) : fallback;
  return {
    workspace: choose("workspace", ["catalog", "movements", "approvals"], "catalog"),
    location: choose("location", ["pusat", "toko"], "pusat"),
    role: choose("role", ["admin", "superadmin"], "admin"),
    status: choose("status", ["all", "active", "inactive"], "all"),
    availability: choose("availability", ["all", "attention", "low", "empty", "available"], "all"),
    handling: choose("handling", ["all", "perishable", "durable"], "all"),
    sort: choose("sort", ["attention", "name", "priceLow", "recent"], "attention"),
    category: query.get("category") || "all",
    search: query.get("q") || "",
    page: Math.max(1, Number.parseInt(query.get("page"), 10) || 1),
    product: query.get("product") || "",
    tab: choose("tab", ["info", "variants", "stock", "activity"], "info"),
    mode: choose("mode", ["view", "edit", "new"], "view")
  };
}

function writeCatalogUrl(replace = false)
{
  const url = new URL(location.href);
  const mapping = { ...catalogState, q: catalogState.search };
  delete mapping.search;
  const defaults =
  {
    workspace: "catalog", location: "pusat", role: "admin", status: "all",
    availability: "all", handling: "all", sort: "attention", category: "all",
    page: 1, product: "", tab: "info", mode: "view", q: ""
  };

  for (const [key, value] of Object.entries(mapping))
  {
    if (value === defaults[key])
    {
      url.searchParams.delete(key);
    }
    else
    {
      url.searchParams.set(key, value);
    }
  }

  try
  {
    history[replace ? "replaceState" : "pushState"](null, "", url);
  }
  catch
  {
    // A restrictive file preview may block history updates; the local interface still works.
  }
}

function findCatalogProduct(id = catalogState.product)
{
  return catalogProducts.find((product) => product.id === id);
}

function findCatalogVariant(id)
{
  for (const product of catalogProducts)
  {
    const variant = product.variants.find((candidate) => candidate.id === id);

    if (variant)
    {
      return { product, variant };
    }
  }

  return null;
}

function catalogStock(variant, locationId = catalogState.location, visited = new Set())
{
  if (visited.has(variant.id))
  {
    return { balance: 0, reserved: 0, available: 0, components: true };
  }

  const visitedIds = new Set([...visited, variant.id]);

  if (variant.components.length > 0)
  {
    const counts = variant.components.map((component) =>
    {
      const found = findCatalogVariant(component.variantId);
      return found && found.variant.active && component.quantity > 0
        ? Math.floor(catalogStock(found.variant, locationId, visitedIds).available / component.quantity)
        : 0;
    });
    return { balance: null, reserved: null, available: Math.min(...counts), components: true };
  }

  const balance = catalogLedger
    .filter((entry) => entry.variantId === variant.id && entry.location === locationId)
    .reduce((total, entry) => total + entry.quantity, 0);
  const reserved = catalogReservations
    .filter((entry) => entry.variantId === variant.id && entry.location === locationId && entry.status === "active")
    .reduce((total, entry) => total + entry.quantity, 0);
  return { balance, reserved, available: Math.max(0, balance - reserved), components: false };
}

function catalogFinalPrice(variant)
{
  const today = "2026-11-04";
  const discountActive = variant.salePrice > 0 && variant.salePrice < variant.price
    && variant.saleStart <= today && variant.saleEnd >= today;
  return discountActive ? variant.salePrice : variant.price;
}

function catalogStockBadge(variant)
{
  const stock = catalogStock(variant);

  if (stock.available === 0)
  {
    return pBadge("Habis", "critical", "alert");
  }

  return stock.available <= productLimits.lowStock
    ? pBadge(`${stock.available} ${variant.unit} tersisa`, "warning", "alert")
    : pBadge(`${stock.available} ${variant.unit}`, "neutral", "box");
}

function catalogStatusBadge(product)
{
  return product.status === "active"
    ? pBadge("Aktif", "success", "check")
    : pBadge("Nonaktif", "neutral", "close");
}

function catalogHandlingBadge(product)
{
  return product.handling === "perishable"
    ? pBadge("Mudah layu", "warning", "leaf")
    : pBadge("Tahan lama", "neutral", "box");
}

function catalogCategoryNames(product)
{
  return product.categories.map((id) => catalogCategories.find((category) => category.id === id)?.name || id);
}

function catalogProductVariants(product)
{
  return product.variants.filter((variant) => variant.active);
}

function catalogRisk(product)
{
  if (product.status !== "active")
  {
    return 100000;
  }

  return Math.min(...catalogProductVariants(product).map((variant) => catalogStock(variant).available), 9999);
}

function catalogMatchesAvailability(product)
{
  const quantities = catalogProductVariants(product).map((variant) => catalogStock(variant).available);
  const matching =
  {
    all: () => true,
    attention: () => quantities.some((quantity) => quantity <= productLimits.lowStock),
    low: () => quantities.some((quantity) => quantity > 0 && quantity <= productLimits.lowStock),
    empty: () => quantities.includes(0),
    available: () => quantities.some((quantity) => quantity > productLimits.lowStock)
  };
  return matching[catalogState.availability]();
}

function catalogFilteredProducts()
{
  const query = catalogState.search.trim().toLocaleLowerCase("id");
  const products = catalogProducts.filter((product) =>
  {
    const searchable = [product.name, ...product.variants.map((variant) => `${variant.sku} ${variant.name}`)]
      .join(" ").toLocaleLowerCase("id");
    return searchable.includes(query)
      && (catalogState.status === "all" || product.status === catalogState.status)
      && (catalogState.category === "all" || product.categories.includes(catalogState.category))
      && (catalogState.handling === "all" || product.handling === catalogState.handling)
      && catalogMatchesAvailability(product);
  });
  return products.sort((first, second) =>
  {
    if (catalogState.sort === "name")
    {
      return first.name.localeCompare(second.name, "id");
    }

    if (catalogState.sort === "recent")
    {
      return new Date(second.updatedAt) - new Date(first.updatedAt);
    }

    if (catalogState.sort === "priceLow")
    {
      return Math.min(...first.variants.map(catalogFinalPrice)) - Math.min(...second.variants.map(catalogFinalPrice));
    }

    return catalogRisk(first) - catalogRisk(second) || first.name.localeCompare(second.name, "id");
  });
}

function catalogThumbnail(product, large = false)
{
  if (product.photos[0])
  {
    const photo = pNode("img", large ? "product-detail-photo" : "product-thumbnail");
    photo.src = product.photos[0].url;
    photo.alt = product.photos[0].alt || product.name;
    photo.width = large ? 400 : 52;
    photo.height = large ? 400 : 52;
    return photo;
  }

  const placeholder = pNode("span", "product-thumbnail-empty");
  placeholder.setAttribute("aria-label", "Foto belum tersedia");
  placeholder.append(pIcon("photo"));
  return placeholder;
}

function catalogPriceNode(product)
{
  const values = catalogProductVariants(product).map(catalogFinalPrice);
  const prices = values.length ? values : product.variants.map(catalogFinalPrice);
  const minimum = Math.min(...prices);
  const maximum = Math.max(...prices);
  const text = pNode("div", "product-price", productMoney(minimum));

  if (minimum !== maximum)
  {
    text.append(pNode("span", "product-cell-caption", `s.d. ${productMoney(maximum)}`));
  }

  return text;
}

function catalogCell(label)
{
  const cell = pNode("td");
  cell.dataset.label = label;
  return cell;
}

function renderCatalogRow(product)
{
  const row = pNode("tr", "product-row");
  row.dataset.productId = product.id;
  const identityCell = catalogCell("Produk");
  const identity = pNode("div", "product-identity");
  const text = pNode("div");
  const name = pNode("strong", "product-name-button", product.name);
  const expanded = catalogExpanded.has(product.id);
  const toggle = pButton(`${product.variants.length} varian`, "toggle-variants", false, { id: product.id });
  toggle.className = "product-expand";
  toggle.setAttribute("aria-expanded", String(expanded));
  toggle.setAttribute("aria-controls", `variants-${product.id}`);
  toggle.prepend(pIcon("chevron"));
  text.append(name, toggle);

  if (product.photos.length === 0)
  {
    text.append(pNode("small", "", "Foto belum dilengkapi"));
  }

  identity.append(catalogThumbnail(product), text);
  identityCell.append(identity);
  const category = catalogCell("Kategori");
  category.append(pNode("span", "product-category-list", catalogCategoryNames(product).join(", ")));
  const price = catalogCell("Harga");
  price.append(catalogPriceNode(product));
  const availability = catalogCell("Ketersediaan");
  const variants = catalogProductVariants(product);
  const empty = variants.filter((variant) => catalogStock(variant).available === 0).length;
  const low = variants.filter((variant) =>
  {
    const quantity = catalogStock(variant).available;
    return quantity > 0 && quantity <= productLimits.lowStock;
  }).length;
  availability.append(empty > 0 ? pBadge(`${empty} varian habis`, "critical", "alert")
    : low > 0 ? pBadge(`${low} varian menipis`, "warning", "alert")
    : variants.length ? pBadge("Tersedia", "neutral", "box") : pBadge("Varian nonaktif", "neutral", "close"));

  if (empty > 0 && low > 0)
  {
    availability.append(pNode("small", "product-cell-caption", `${low} varian juga menipis`));
  }

  if (product.stockMode === "components")
  {
    availability.append(pNode("small", "product-cell-caption", "Mengikuti komponen"));
  }

  const handling = catalogCell("Penanganan");
  handling.append(catalogHandlingBadge(product));
  const status = catalogCell("Katalog");
  status.append(catalogStatusBadge(product));
  const action = catalogCell("Aksi");
  const open = pButton("Buka", "open-product", false, { id: product.id });
  open.className = "queue-open-button";
  action.append(open);
  row.append(identityCell, category, price, availability, handling, status, action);

  const expansion = pNode("tr", "variant-expansion");
  expansion.id = `variants-${product.id}`;
  expansion.hidden = !expanded;
  const cell = pNode("td");
  cell.colSpan = 7;
  const heading = pNode("div", "variant-disclosure-heading");
  heading.append(pNode("strong", "", `Varian di ${productLocations[catalogState.location]}`));
  heading.append(pButton("Kelola varian", "edit-product", false, { id: product.id, section: "variants" }));
  cell.append(heading, renderVariantTable(product));
  expansion.append(cell);
  return [row, expansion];
}

function renderVariantTable(product)
{
  const table = pNode("table", "variant-table");
  const caption = pNode("caption", "sr-only", `Varian ${product.name}, lokasi ${productLocations[catalogState.location]}`);
  const head = pNode("thead");
  const headings = pNode("tr");

  for (const label of ["Varian / SKU", "Harga / satuan", "Saldo", "Direservasi", "Tersedia", "Status", "Aksi"])
  {
    const cell = pNode("th", "", label);
    cell.scope = "col";
    headings.append(cell);
  }

  head.append(headings);
  const body = pNode("tbody");

  for (const variant of product.variants)
  {
    const row = pNode("tr");
    const stock = catalogStock(variant);
    const identity = catalogCell("Varian");
    identity.append(pNode("strong", "", variant.name), pNode("small", "", variant.sku));
    const price = catalogCell("Harga");
    price.append(pNode("span", "product-price", `${productMoney(catalogFinalPrice(variant))} / ${variant.unit}`));

    if (catalogFinalPrice(variant) !== variant.price)
    {
      price.append(pNode("del", "product-price-old", productMoney(variant.price)));
    }

    const balance = catalogCell("Saldo");
    balance.textContent = stock.components ? "Komponen" : `${stock.balance} ${variant.unit}`;
    const reserved = catalogCell("Direservasi");
    reserved.textContent = stock.components ? "Per komponen" : `${stock.reserved} ${variant.unit}`;
    const available = catalogCell("Tersedia");
    available.append(catalogStockBadge(variant));
    const status = catalogCell("Status");
    status.append(variant.active ? pBadge("Aktif", "success", "check") : pBadge("Nonaktif", "neutral", "close"));
    const action = catalogCell("Aksi");
    action.append(pButton(stock.components ? "Lihat komponen" : "Catat stok", stock.components
      ? "view-components" : "stock-movement", false, { id: product.id, variant: variant.id }));
    row.append(identity, price, balance, reserved, available, status, action);
    body.append(row);
  }

  table.append(caption, head, body);
  return table;
}

function renderCatalogSummary()
{
  const activeProducts = catalogProducts.filter((product) => product.status === "active");
  const variants = activeProducts.flatMap(catalogProductVariants);
  const low = variants.filter((variant) =>
  {
    const quantity = catalogStock(variant).available;
    return quantity > 0 && quantity <= productLimits.lowStock;
  }).length;
  const empty = variants.filter((variant) => catalogStock(variant).available === 0).length;
  document.getElementById("active-product-count").textContent = activeProducts.length;
  document.getElementById("all-product-count").textContent = catalogProducts.length;
  document.getElementById("active-variant-count").textContent = variants.length;
  document.getElementById("low-stock-count").textContent = low;
  document.getElementById("empty-stock-count").textContent = empty;
  document.getElementById("catalog-priority").hidden = low + empty === 0;
  document.getElementById("catalog-priority-title").textContent = `${empty} varian habis, ${low} varian menipis`;
  document.getElementById("catalog-priority-copy").textContent =
    `Produk aktif di ${productLocations[catalogState.location]}. Periksa SKU sebelum mencatat barang masuk.`;
  document.querySelectorAll("[data-summary]").forEach((button) =>
  {
    const selected = button.dataset.summary === "active" ? catalogState.status === "active"
      : ["low", "empty"].includes(button.dataset.summary)
        ? catalogState.availability === button.dataset.summary
        : catalogState.status === "all" && catalogState.availability === "all";
    button.setAttribute("aria-pressed", String(selected));
  });
}

function renderCatalogFilters()
{
  const categorySelect = document.getElementById("category-filter");
  categorySelect.replaceChildren(new Option("Semua kategori", "all"));
  catalogCategories.forEach((category) => categorySelect.append(new Option(category.name, category.id)));
  categorySelect.value = catalogState.category;
  document.getElementById("status-filter").value = catalogState.status;
  document.getElementById("availability-filter").value = catalogState.availability;
  document.getElementById("handling-filter").value = catalogState.handling;
  document.getElementById("product-search").value = catalogState.search;
  document.getElementById("product-sort").value = catalogState.sort;
  const chips = document.getElementById("active-product-filters");
  chips.replaceChildren();
  const active =
  [
    ["category", categorySelect],
    ["status", document.getElementById("status-filter")],
    ["availability", document.getElementById("availability-filter")],
    ["handling", document.getElementById("handling-filter")]
  ];

  for (const [key, select] of active)
  {
    if (catalogState[key] !== "all")
    {
      const label = select.selectedOptions[0]?.textContent || catalogState[key];
      const chip = pButton(label, "clear-filter", false, { filter: key });
      chip.setAttribute("aria-label", `Hapus filter ${label}`);
      chip.append(pIcon("close"));
      chips.append(chip);
    }
  }

  if (catalogState.search)
  {
    chips.append(pButton(`Pencarian: ${catalogState.search}`, "clear-filter", false, { filter: "search" }));
  }

  chips.hidden = !chips.childElementCount;

  if (!chips.hidden)
  {
    chips.append(pButton("Reset filter", "reset-filters"));
  }
}

function renderCatalogList()
{
  renderCatalogSummary();
  renderCatalogFilters();
  const products = catalogLoadState === "empty" ? [] : catalogFilteredProducts();
  const lastPage = Math.max(1, Math.ceil(products.length / catalogPageSize));
  catalogState.page = Math.min(catalogState.page, lastPage);
  const start = (catalogState.page - 1) * catalogPageSize;
  const visible = products.slice(start, start + catalogPageSize);
  const isFull = !["loading", "error"].includes(catalogLoadState);
  document.getElementById("catalog-loading").hidden = catalogLoadState !== "loading";
  document.getElementById("catalog-error").hidden = catalogLoadState !== "error";
  document.getElementById("catalog-empty").hidden = !isFull || products.length > 0;
  document.getElementById("products-table").hidden = !isFull || products.length === 0;
  document.getElementById("catalog-pagination").hidden = !isFull || products.length === 0;
  document.getElementById("product-rows").replaceChildren(...visible.flatMap(renderCatalogRow));
  const genuinelyEmpty = catalogProducts.length === 0 || catalogLoadState === "empty";
  document.getElementById("catalog-empty-title").textContent = genuinelyEmpty ? "Belum ada produk" : "Produk tidak ditemukan";
  document.getElementById("catalog-empty-copy").textContent = genuinelyEmpty
    ? "Tambahkan produk beserta varian pertamanya untuk memulai."
    : "Coba kata kunci lain atau hapus filter untuk melihat produk lainnya.";
  const emptyAction = document.getElementById("catalog-empty-action");
  emptyAction.dataset.action = genuinelyEmpty ? "new-product" : "reset-filters";
  emptyAction.textContent = genuinelyEmpty ? "Tambah produk" : "Reset filter";
  document.getElementById("catalog-result").textContent = `${products.length} produk di ${productLocations[catalogState.location]}`;
  document.getElementById("catalog-page-copy").textContent = `${start + 1}–${start + visible.length} dari ${products.length} produk`;
  document.getElementById("product-page-number").textContent = `${catalogState.page} dari ${lastPage}`;
  document.getElementById("previous-product-page").disabled = catalogState.page <= 1;
  document.getElementById("next-product-page").disabled = catalogState.page >= lastPage;
}

function catalogFacts(entries)
{
  const list = pNode("dl", "product-facts");

  for (const [label, value] of entries)
  {
    const pair = pNode("div");
    const description = pNode("dd");
    description.append(value instanceof Node ? value : document.createTextNode(String(value)));
    pair.append(pNode("dt", "", label), description);
    list.append(pair);
  }

  return list;
}

function renderCatalogDetail(product)
{
  const root = document.getElementById("product-detail-view");
  root.replaceChildren();
  const back = pButton("Kembali ke daftar produk", "back-catalog");
  back.className = "queue-text-button back-button";
  back.prepend(pIcon("chevron"));
  const heading = pNode("div", "product-detail-heading");
  const identity = pNode("div", "product-identity");
  const text = pNode("div");
  text.append(pNode("h2", "", product.name), pNode("p", "", catalogCategoryNames(product).join(", ")));
  identity.append(catalogThumbnail(product), text);
  const actions = pNode("div", "product-detail-actions");
  actions.append(catalogStatusBadge(product));
  actions.append(pButton("Edit produk", "edit-product", true, { id: product.id }));
  actions.append(pButton(product.status === "active" ? "Nonaktifkan" : "Aktifkan", "toggle-product", false, { id: product.id }));

  if (catalogState.role === "superadmin")
  {
    const remove = pButton("Hapus permanen", "delete-product", false, { id: product.id });
    remove.disabled = !catalogCanDelete(product);
    remove.setAttribute("aria-describedby", "delete-product-help");
    actions.append(remove);
  }

  heading.append(identity, actions);
  root.append(back, heading);

  if (catalogState.role === "superadmin")
  {
    for (const notice of catalogNotices.filter((entry) => entry.productId === product.id))
    {
      root.append(pNote(`Perubahan harga besar oleh ${notice.actor}. ${notice.text}`, true));
    }
  }

  if (catalogState.role === "superadmin" && !catalogCanDelete(product))
  {
    root.append(pNode("p", "product-help", "Hapus permanen tidak tersedia: produk memiliki saldo, reservasi, pengajuan stok, riwayat transaksi, atau dipakai sebagai komponen paket."));
    root.lastElementChild.id = "delete-product-help";
  }

  const tabs = pNode("nav", "product-detail-tabs");
  tabs.setAttribute("aria-label", "Bagian detail produk");

  for (const [key, label] of [["info", "Informasi"], ["variants", "Varian & harga"], ["stock", "Stok & reservasi"], ["activity", "Aktivitas"]])
  {
    const tab = pButton(label, "detail-tab", false, { tab: key });

    if (catalogState.tab === key)
    {
      tab.setAttribute("aria-current", "page");
    }

    tabs.append(tab);
  }

  root.append(tabs);
  const content = pNode("div");
  content.id = "product-detail-content";

  if (catalogState.tab === "info")
  {
    const layout = pNode("div", "product-detail-layout");
    const photos = pNode("div");
    photos.append(catalogThumbnail(product, true));

    if (product.photos.length === 0)
    {
      photos.append(pNote("Foto produk belum dilengkapi. Tambahkan minimal satu foto sebelum menyimpan perubahan.", true));
    }

    const copy = pNode("div", "product-detail-copy");
    copy.append(pNode("p", "", product.description));
    copy.append(catalogFacts(
    [
      ["Penanganan", catalogHandlingBadge(product)],
      ["Kategori utama", catalogCategories.find((category) => category.id === product.primaryCategory)?.name || "—"],
      ["Varian", `${product.variants.length} SKU`],
      ["Merek", product.brand || "—"],
      ["Aturan stok", product.stockMode === "components" ? "Mengikuti komponen" : "Stok per SKU"],
      ["Terakhir diubah", productDate(product.updatedAt)]
    ]));

    for (const [title, value] of [["Perawatan / penggunaan", product.care], ["Pengiriman", product.shippingNote]])
    {
      copy.append(pNode("h3", "", title), pNode("p", "", value || "Belum diisi"));
    }

    if (product.attributes.length)
    {
      copy.append(catalogFacts(product.attributes.map((attribute) => [attribute.name, attribute.value])));
    }

    if (product.handling === "perishable")
    {
      copy.append(pNote("Mudah layu: wajib tanggal dan slot kirim, dengan layanan instan/same-day.", true));
    }

    layout.append(photos, copy);
    content.append(layout);
  }
  else if (catalogState.tab === "variants")
  {
    const panel = pNode("section", "product-panel");
    panel.append(pNode("h2", "", "Harga dan satuan per varian"), renderVariantTable(product));
    panel.append(pNote("Harga baru berlaku untuk pembelian berikutnya. Pesanan yang sudah dibuat mempertahankan snapshot harga."));
    content.append(panel);
  }
  else if (catalogState.tab === "stock")
  {
    const panel = pNode("section", "product-panel");
    const heading = pNode("div", "product-section-heading");
    heading.append(pNode("h2", "", `Saldo di ${productLocations[catalogState.location]}`));
    const locationSelect = pNode("select");
    locationSelect.id = "detail-stock-location";
    locationSelect.setAttribute("aria-label", "Lokasi stok produk");
    Object.entries(productLocations).forEach(([key, label]) => locationSelect.append(new Option(label, key)));
    locationSelect.value = catalogState.location;
    heading.append(locationSelect);
    panel.append(heading, renderVariantTable(product));
    const reservations = catalogReservations.filter((entry) =>
    {
      return product.variants.some((variant) => variant.id === entry.variantId)
        && entry.status === "active" && entry.location === catalogState.location;
    });
    panel.append(pNode("h3", "", "Reservasi aktif"));

    if (!reservations.length)
    {
      panel.append(pNode("p", "product-help", "Tidak ada reservasi aktif pada SKU produk ini di lokasi terpilih."));
    }

    for (const reservation of reservations)
    {
      const variant = findCatalogVariant(reservation.variantId).variant;
      panel.append(pNote(
        `${reservation.orderId}: ${reservation.quantity} ${variant.unit}, ${variant.sku}. ` +
        `Harga snapshot ${productMoney(reservation.unitPrice)} / ${variant.unit}.`
      ));
    }

    for (const variant of product.variants)
    {
      if (variant.components.length)
      {
        panel.append(pNode("h3", "", `Komponen ${variant.sku}`));
        const facts = variant.components.map((component) =>
        {
          const found = findCatalogVariant(component.variantId);
          return [found.variant.sku, `${component.quantity} ${found.variant.unit} per ${variant.unit}`];
        });
        panel.append(catalogFacts(facts), pNote("Stok paket mengikuti komponen paling terbatas. Catat penerimaan pada SKU komponen."));
      }

      if (variant.batchTracked)
      {
        panel.append(pNode("h3", "", `Batch ${variant.sku}`));

        for (const batch of variant.batches.filter((entry) => entry.location === catalogState.location))
        {
          panel.append(pNote(`${batch.id}: ${batch.quantity} ${variant.unit}, kedaluwarsa ${productDate(batch.expires)}.`));
        }
      }
    }

    content.append(panel);
  }
  else
  {
    const panel = pNode("section", "product-panel");
    panel.append(pNode("h2", "", "Aktivitas produk"));

    if (!product.history.length)
    {
      panel.append(pNode("p", "product-help", "Belum ada perubahan pada sesi pratinjau ini."));
    }

    for (const entry of [...product.history].reverse())
    {
      const article = pNode("article", "product-movement");
      article.append(pNode("h3", "", entry.label), pNode("p", "", entry.reason));
      article.append(pNode("p", "product-movement-meta", `${entry.actor}, ${productDate(entry.at)}`));
      panel.append(article);
    }

    content.append(panel);
  }

  root.append(content);
}

function catalogCanDelete(product)
{
  return product.transactionCount === 0
    && product.variants.every((variant) => !catalogVariantReferenced(variant.id));
}

function catalogVariantReferenced(variantId)
{
  return catalogReservations.some((entry) => entry.variantId === variantId)
    || catalogApprovals.some((entry) => entry.variantId === variantId)
    || catalogLedger.some((entry) => entry.variantId === variantId)
    || catalogProducts.some((product) => product.variants.some((variant) =>
    {
      return variant.components.some((component) => component.variantId === variantId);
    }));
}

function renderCatalogMovements()
{
  const container = document.getElementById("movement-list");
  const entries = catalogLedger.filter((entry) => entry.location === catalogState.location)
    .sort((first, second) => new Date(second.at) - new Date(first.at));
  container.replaceChildren(pNode("p", "product-help", `${entries.length} catatan di ${productLocations[catalogState.location]}`));

  if (!entries.length)
  {
    container.append(pNote("Belum ada mutasi pada lokasi ini. Catat barang masuk untuk menambah saldo."));
  }

  for (const entry of entries)
  {
    const found = findCatalogVariant(entry.variantId);

    if (!found)
    {
      continue;
    }

    const article = pNode("article", "product-movement");
    const heading = pNode("div", "product-request-heading");
    heading.append(pNode("h3", "", `${found.product.name}, ${found.variant.name}`));
    heading.append(pBadge(`${entry.quantity > 0 ? "+" : ""}${entry.quantity} ${found.variant.unit}`, "neutral",
      entry.quantity >= 0 ? "plus" : "minus"));
    article.append(heading, pNode("p", "", `${entry.type}: ${entry.reason}`));
    article.append(pNode("p", "product-movement-meta", `${found.variant.sku}, ${entry.reference}`));
    article.append(pNode("p", "product-movement-meta", `${entry.actor}, ${productDate(entry.at)}`));

    if (entry.batch)
    {
      article.append(pNode("p", "product-movement-meta", `Batch ${entry.batch}`));
    }

    container.append(article);
  }
}

function renderCatalogApprovals()
{
  const container = document.getElementById("approval-list");
  container.replaceChildren();

  if (!catalogApprovals.length)
  {
    container.append(pNote("Belum ada pengajuan penyesuaian stok."));
  }

  for (const request of [...catalogApprovals].reverse())
  {
    const found = findCatalogVariant(request.variantId);
    const article = pNode("article", "product-request");
    const heading = pNode("div", "product-request-heading");
    const text = pNode("div");
    text.append(pNode("h3", "", `${found.product.name}, ${found.variant.sku}`));
    text.append(pNode("p", "", `${request.quantity > 0 ? "+" : ""}${request.quantity} ${found.variant.unit}, ${productLocations[request.location]}`));
    heading.append(text, request.status === "pending" ? pBadge("Menunggu SuperAdmin", "warning", "clock")
      : request.status === "approved" ? pBadge("Disetujui", "success", "check") : pBadge("Ditolak", "neutral", "close"));
    article.append(heading, pNode("p", "", request.reason));
    article.append(pNode("p", "product-movement-meta", `${request.actor}, ${request.reference}, ${productDate(request.at)}`));

    if (request.status === "pending")
    {
      if (catalogState.role === "superadmin")
      {
        article.append(pButton("Tinjau penyesuaian", "review-adjustment", false, { request: request.id }));
      }
      else
      {
        article.append(pNode("p", "product-help", "Saldo belum berubah. Keputusan tersedia untuk SuperAdmin."));
      }
    }
    else
    {
      article.append(pNode("p", "product-help", `${request.checker}: ${request.decisionReason}`));
    }

    container.append(article);
  }
}

function renderCatalogShell()
{
  document.querySelectorAll("[data-superadmin-only]").forEach((node) => node.hidden = catalogState.role !== "superadmin");
  document.getElementById("profile-name").textContent = catalogState.role === "superadmin" ? "SuperAdmin RylVa" : "Admin RylVa";
  document.getElementById("preview-role").textContent = catalogState.role === "superadmin" ? "Pratinjau SuperAdmin" : "Pratinjau Admin";
  document.getElementById("product-profile").value = catalogState.role;
  document.querySelectorAll("[data-role-link]").forEach((link) =>
  {
    const url = new URL(link.getAttribute("href"), location.href);

    if (catalogState.role === "superadmin")
    {
      url.searchParams.set("role", "superadmin");
    }
    else
    {
      url.searchParams.delete("role");
    }

    link.href = url.href;
  });
}

function renderProductBreadcrumb()
{
  const root = document.getElementById("product-breadcrumb");
  const product = findCatalogProduct();
  const trail =
  [
    { label: "Ruang kerja", href: `../staff/admin-dashboard.html${catalogState.role === "superadmin" ? "?role=superadmin" : ""}` }
  ];
  const nested = product || productTask || catalogState.mode !== "view" || catalogState.workspace !== "catalog";
  const catalogHref = new URL("../staff/products.html", location.href);

  if (catalogState.role === "superadmin")
  {
    catalogHref.searchParams.set("role", "superadmin");
  }

  trail.push(
  {
    label: "Produk & Varian",
    href: nested ? catalogHref.href : "",
    changes: { product: "", mode: "view", workspace: "catalog" }
  });

  if (product)
  {
    const detailHref = new URL(catalogHref);
    detailHref.searchParams.set("product", product.id);
    trail.push(
    {
      label: product.name,
      href: productTask || catalogState.mode === "edit" ? detailHref.href : "",
      changes: { product: product.id, mode: "view", tab: "info" }
    });
  }

  if (productTask)
  {
    trail.push({ label: productTask.title });
  }
  else if (catalogState.mode !== "view")
  {
    trail.push({ label: catalogState.mode === "new" ? "Tambah produk" : "Edit produk" });
  }
  else if (!product && catalogState.workspace !== "catalog")
  {
    trail.push({ label: catalogState.workspace === "movements" ? "Mutasi stok" : "Persetujuan stok" });
  }

  const list = pNode("ol");

  trail.forEach((entry, index) =>
  {
    const item = pNode("li");
    const link = pNode(entry.href ? "a" : "span", "", entry.label);

    if (entry.href)
    {
      link.href = entry.href;

      if (entry.changes)
      {
        link.addEventListener("click", (event) =>
        {
          if (!event.ctrlKey && !event.metaKey && !event.shiftKey)
          {
            event.preventDefault();
            navigateCatalog(entry.changes);
          }
        });
      }
    }

    if (index === trail.length - 1)
    {
      link.setAttribute("aria-current", "page");
    }

    if (index > 0)
    {
      const separator = pNode("span", "product-breadcrumb-separator", "/");
      separator.setAttribute("aria-hidden", "true");
      item.append(separator);
    }

    item.append(link);
    list.append(item);
  });
  root.replaceChildren(list);
}

function renderCatalog()
{
  let product = findCatalogProduct();

  if (catalogState.product && !product && catalogState.mode !== "new")
  {
    catalogState.product = "";
    catalogState.mode = "view";
    productDraft = null;
    writeCatalogUrl(true);
    catalogFeedback("Produk tidak ditemukan. Pilih produk lain dari daftar.", true);
  }

  const editing = catalogState.mode !== "view";
  document.getElementById("catalog-view").hidden = Boolean(product) || editing || Boolean(productTask);
  document.getElementById("product-detail-view").hidden = !product || editing || Boolean(productTask);
  document.getElementById("product-editor-view").hidden = !editing || Boolean(productTask);
  document.getElementById("product-task-view").hidden = !productTask;
  document.getElementById("catalog-actions").hidden = Boolean(product) || editing || Boolean(productTask);
  document.getElementById("stock-location").value = catalogState.location;
  document.getElementById("product-page-title").textContent = productTask ? productTask.title
    : editing ? (catalogState.mode === "new" ? "Tambah produk" : "Edit produk")
    : product ? "Detail produk" : "Produk & Varian";
  document.getElementById("product-page-intro").textContent = productTask ? "Periksa rincian dan alasan sebelum menyimpan."
    : editing ? "Lengkapi informasi, varian, dan foto. Stok dicatat melalui mutasi."
    : product ? "Periksa katalog, varian, dan persediaan sebelum melakukan perubahan."
    : "Kelola katalog dan ketersediaan setiap SKU di satu tempat.";
  const pending = catalogApprovals.filter((request) => request.status === "pending").length;
  document.getElementById("approval-count").textContent = pending;
  document.querySelectorAll("[data-workspace]").forEach((button) =>
  {
    button.setAttribute("aria-current", button.dataset.workspace === catalogState.workspace ? "page" : "false");
  });
  document.getElementById("catalog-list-view").hidden = catalogState.workspace !== "catalog";
  document.getElementById("movements-view").hidden = catalogState.workspace !== "movements";
  document.getElementById("approvals-view").hidden = catalogState.workspace !== "approvals";
  renderCatalogShell();
  renderProductBreadcrumb();

  if (productTask)
  {
    renderProductTask();
  }
  else if (editing)
  {
    renderProductEditor();
  }
  else if (product)
  {
    renderCatalogDetail(product);
  }
  else
  {
    renderCatalogList();
    renderCatalogMovements();
    renderCatalogApprovals();
  }
}

function catalogActor()
{
  return catalogState.role === "superadmin" ? "SuperAdmin RylVa" : "Admin RylVa";
}

function catalogHistory(product, label, reason)
{
  product.updatedAt = productSnapshotAt.toISOString();
  product.history.push({ label, reason, actor: catalogActor(), at: productSnapshotAt.toISOString() });
}

function catalogFeedback(text, error = false)
{
  const feedback = document.getElementById("product-feedback");
  feedback.hidden = false;
  feedback.classList.toggle("product-feedback--error", error);
  feedback.replaceChildren(pIcon(error ? "alert" : "check"), pNode("span", "", text));
  feedback.focus({ preventScroll: true });
}

function confirmCatalog(title, paragraphs, label = "Konfirmasi")
{
  if (catalogDialog.open)
  {
    return Promise.resolve(false);
  }

  document.getElementById("product-confirm-title").textContent = title;
  const content = document.getElementById("product-confirm-copy");
  content.replaceChildren(...paragraphs.map((paragraph) => paragraph instanceof Node ? paragraph : pNode("p", "", paragraph)));
  document.getElementById("product-confirm-submit").textContent = label;
  catalogDialog.returnValue = "";
  catalogDialog.showModal();
  return new Promise((resolve) =>
  {
    catalogDialog.addEventListener("close", () => resolve(catalogDialog.returnValue === "confirm"), { once: true });
  });
}

async function leaveCatalogEditor()
{
  if (productSaving)
  {
    return false;
  }

  if (productDirty && !await confirmCatalog("Tinggalkan perubahan?",
    ["Perubahan belum disimpan. Tetap di halaman ini untuk melanjutkan, atau tinggalkan perubahan."], "Tinggalkan"))
  {
    return false;
  }

  productDraft = null;
  productTask = null;
  productDirty = false;
  return true;
}

async function navigateCatalog(changes, focus = true)
{
  if (!await leaveCatalogEditor())
  {
    return;
  }

  Object.assign(catalogState, changes);
  writeCatalogUrl();
  document.getElementById("product-feedback").hidden = true;
  renderCatalog();

  if (focus)
  {
    document.getElementById("product-page-title").focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}

async function saveCatalog(mutation, message, root = document.getElementById("queue-main"))
{
  if (productSaving)
  {
    return false;
  }

  productSaving = true;
  const controls = [...root.querySelectorAll("button, input, select, textarea")]
    .map((node) => ({ node, disabled: node.disabled }));
  controls.forEach(({ node }) => node.disabled = true);
  const submit = root.querySelector('[type="submit"]');
  const originalLabel = submit?.textContent;

  if (submit)
  {
    submit.textContent = "Menyimpan…";
  }

  try
  {
    await new Promise((resolve) => setTimeout(resolve, 220));
    const failControl = document.getElementById("product-fail-save");

    if (failControl.checked)
    {
      failControl.checked = false;
      throw new Error("Perubahan belum disimpan. Isian tetap tersedia; periksa lalu coba simpan kembali.");
    }

    mutation();
    productDirty = false;
    catalogFeedback(message);
    return true;
  }
  catch (error)
  {
    catalogFeedback(error.message, true);
    const errorBox = root.querySelector(".product-error-summary");

    if (errorBox)
    {
      errorBox.hidden = false;
      errorBox.textContent = error.message;
      errorBox.focus();
    }

    return false;
  }
  finally
  {
    productSaving = false;
    controls.forEach(({ node, disabled }) => node.disabled = disabled);

    if (submit)
    {
      submit.textContent = originalLabel;
    }
  }
}

async function catalogAction(button)
{
  if (productSaving)
  {
    return;
  }

  const action = button.dataset.action;
  const product = findCatalogProduct(button.dataset.id);

  if (["open-product", "back-catalog", "detail-tab", "view-components"].includes(action))
  {
    await navigateCatalog(
    {
      product: action === "back-catalog" ? "" : button.dataset.id || catalogState.product,
      mode: "view",
      tab: action === "view-components" ? "stock" : button.dataset.tab || "info"
    });
  }
  else if (action === "new-product" || action === "edit-product")
  {
    await navigateCatalog({ product: product?.id || "", mode: action === "new-product" ? "new" : "edit" });

    if (button.dataset.section && productDraft)
    {
      document.getElementById(`edit-${button.dataset.section}`)?.scrollIntoView({ block: "start" });
    }
  }
  else if (action === "toggle-variants")
  {
    catalogExpanded.has(product.id) ? catalogExpanded.delete(product.id) : catalogExpanded.add(product.id);
    const expansion = document.getElementById(`variants-${product.id}`);
    expansion.hidden = !catalogExpanded.has(product.id);
    button.setAttribute("aria-expanded", String(!expansion.hidden));
  }
  else if (action === "filter-attention")
  {
    Object.assign(catalogState, { availability: "attention", status: "active", page: 1 });
    writeCatalogUrl();
    renderCatalogList();
    document.getElementById("catalog-result").scrollIntoView({ block: "center" });
  }
  else if (action === "reset-filters" || action === "clear-filter")
  {
    if (action === "reset-filters")
    {
      Object.assign(catalogState, { search: "", status: "all", availability: "all", category: "all", handling: "all" });
    }
    else
    {
      catalogState[button.dataset.filter] = button.dataset.filter === "search" ? "" : "all";
    }

    catalogState.page = 1;
    writeCatalogUrl();
    renderCatalogList();
  }
  else if (action === "retry-load")
  {
    loadCatalogPreview();
  }
  else if (action === "toggle-product")
  {
    if (product.status === "inactive")
    {
      const errors = validateCatalogProduct(product);

      if (errors.length)
      {
        catalogFeedback(`Produk belum dapat diaktifkan. ${errors[0].message} Pilih Edit produk untuk melengkapi.`, true);
        return;
      }
    }

    const waiting = catalogReservations.filter((entry) => product.variants.some((variant) => variant.id === entry.variantId)).length;
    const active = product.status !== "active";
    const accepted = await confirmCatalog(active ? "Aktifkan produk?" : "Nonaktifkan produk?",
    [
      active ? "Produk dan varian aktif dapat tampil pada katalog." : "Produk tidak dapat dibeli melalui katalog setelah dinonaktifkan.",
      `${waiting} pesanan Menunggu Pembayaran tetap valid dengan harga snapshot. Reservasi tidak dilepas oleh perubahan katalog.`
    ], active ? "Aktifkan" : "Nonaktifkan");

    if (accepted && await saveCatalog(() =>
    {
      product.status = active ? "active" : "inactive";
      catalogHistory(product, active ? "Produk diaktifkan" : "Produk dinonaktifkan", "Status katalog diubah melalui konfirmasi.");
    }, active ? "Produk diaktifkan." : "Produk dinonaktifkan. Pesanan lama tetap memakai snapshot."))
    {
      renderCatalog();
    }
  }
  else if (action === "delete-product")
  {
    if (catalogState.role !== "superadmin" || !catalogCanDelete(product))
    {
      catalogFeedback("Produk ini tidak memenuhi syarat penghapusan permanen.", true);
      return;
    }

    if (await confirmCatalog("Hapus produk permanen?", [`${product.name} belum memiliki riwayat transaksi. Penghapusan ini tidak dapat dibatalkan.`], "Hapus permanen"))
    {
      if (await saveCatalog(() => catalogProducts.splice(catalogProducts.indexOf(product), 1), "Produk tanpa riwayat dihapus."))
      {
        catalogState.product = "";
        writeCatalogUrl();
        renderCatalog();
      }
    }
  }
  else if (action === "stock-movement" || action === "new-movement")
  {
    if (await leaveCatalogEditor())
    {
      productTask = { kind: "movement", title: "Catat mutasi stok", variant: button.dataset.variant || "" };
      renderCatalog();
      window.scrollTo(0, 0);
    }
  }
  else if (action === "review-adjustment")
  {
    if (catalogState.role === "superadmin" && await leaveCatalogEditor())
    {
      productTask = { kind: "approval", title: "Tinjau penyesuaian", request: button.dataset.request };
      renderCatalog();
      window.scrollTo(0, 0);
    }
  }
  else if (action === "manage-categories")
  {
    if (await leaveCatalogEditor())
    {
      productTask = { kind: "categories", title: "Kategori produk" };
      renderCatalog();
    }
  }
  else if (action === "cancel-editor" || action === "cancel-task")
  {
    await navigateCatalog({ mode: "view" });
  }
  else if (action === "photo-credits")
  {
    const paragraph = pNode("p", "", "Foto ilustrasi berasal dari Unsplash. Sumber: ");

    for (const [index, label] of ["Ficus", "Sukulen", "Berkebun", "Tulip"].entries())
    {
      const id = ["1501004318641-b39e6451bec6", "1485955900006-10f4d324d411", "1416879595882-3373a0480b5b", "1561181286-d3fee7d55364"][index];
      const link = pNode("a", "", label);
      link.href = `https://images.unsplash.com/photo-${id}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      paragraph.append(link, document.createTextNode(index < 3 ? ", " : "."));
    }

    await confirmCatalog("Foto ilustrasi", [paragraph, "Ganti dengan foto produk toko yang sesuai sebelum digunakan untuk katalog nyata."], "Tutup");
  }
  else
  {
    await productEditorAction(button);
  }
}

function loadCatalogPreview()
{
  catalogLoadState = "loading";
  renderCatalogList();
  setTimeout(() =>
  {
    catalogLoadState = "full";
    const url = new URL(location.href);
    url.searchParams.delete("state");
    history.replaceState(null, "", url);
    renderCatalogList();
  }, 450);
}

document.addEventListener("click", (event) =>
{
  const button = event.target.closest("[data-action]");

  if (button)
  {
    catalogAction(button);
  }

  const workspace = event.target.closest("[data-workspace]");

  if (workspace)
  {
    navigateCatalog({ workspace: workspace.dataset.workspace, product: "", mode: "view" });
  }

  const summary = event.target.closest("[data-summary]");

  if (summary)
  {
    catalogState.status = "active";
    catalogState.availability = ["low", "empty"].includes(summary.dataset.summary) ? summary.dataset.summary : "all";
    catalogState.page = 1;
    writeCatalogUrl();
    renderCatalogList();
  }
});

document.getElementById("product-search").addEventListener("input", (event) =>
{
  catalogState.search = event.target.value;
  catalogState.page = 1;
  writeCatalogUrl(true);
  renderCatalogList();
});

for (const [id, field] of [["category-filter", "category"], ["status-filter", "status"], ["availability-filter", "availability"], ["handling-filter", "handling"], ["product-sort", "sort"]])
{
  document.getElementById(id).addEventListener("change", (event) =>
  {
    catalogState[field] = event.target.value;
    catalogState.page = 1;
    writeCatalogUrl();
    renderCatalogList();
  });
}

document.getElementById("product-filter-toggle").addEventListener("click", (event) =>
{
  const panel = document.getElementById("catalog-filters");
  panel.hidden = !panel.hidden;
  event.currentTarget.setAttribute("aria-expanded", String(!panel.hidden));
});

for (const [id, direction] of [["previous-product-page", -1], ["next-product-page", 1]])
{
  document.getElementById(id).addEventListener("click", () =>
  {
    catalogState.page += direction;
    writeCatalogUrl();
    renderCatalogList();
    document.getElementById("catalog-result").scrollIntoView({ block: "center" });
  });
}

document.addEventListener("change", async (event) =>
{
  if (["stock-location", "detail-stock-location"].includes(event.target.id))
  {
    catalogState.location = event.target.value;
    catalogState.page = 1;
    writeCatalogUrl();
    renderCatalog();
  }

  if (event.target.id === "product-profile")
  {
    const nextRole = event.target.value;

    if (await leaveCatalogEditor())
    {
      catalogState.role = nextRole;
      catalogState.mode = "view";
      writeCatalogUrl();
      renderCatalog();
    }
    else
    {
      event.target.value = catalogState.role;
    }
  }
});

function setCatalogMobileMenu(open)
{
  const sidebar = document.getElementById("sidebar");
  document.getElementById("mobile-open").setAttribute("aria-expanded", String(open));
  document.getElementById("mobile-backdrop").classList.toggle("hidden", !open);
  sidebar.classList.toggle("-translate-x-full", !open);
  sidebar.inert = !open && innerWidth < 1024;
  document.body.classList.toggle("overflow-hidden", open);

  if (open)
  {
    document.getElementById("mobile-close").focus();
  }
  else if (innerWidth < 1024)
  {
    document.getElementById("mobile-open").focus();
  }
}

document.getElementById("sidebar-toggle").addEventListener("click", (event) =>
{
  const collapsed = document.getElementById("sidebar").classList.toggle("sidebar-collapsed");
  event.currentTarget.setAttribute("aria-expanded", String(!collapsed));
  event.currentTarget.setAttribute("aria-label", collapsed ? "Besarkan sidebar" : "Kecilkan sidebar");
});
document.getElementById("mobile-open").addEventListener("click", () => setCatalogMobileMenu(true));
document.getElementById("mobile-close").addEventListener("click", () => setCatalogMobileMenu(false));
document.getElementById("mobile-backdrop").addEventListener("click", () => setCatalogMobileMenu(false));

document.addEventListener("keydown", (event) =>
{
  if (document.getElementById("mobile-open").getAttribute("aria-expanded") !== "true")
  {
    return;
  }

  if (event.key === "Escape")
  {
    setCatalogMobileMenu(false);
  }

  if (event.key === "Tab")
  {
    const controls = [...document.getElementById("sidebar").querySelectorAll("a[href], button")]
      .filter((node) => node.getClientRects().length && !node.hidden);
    const first = controls[0];
    const last = controls.at(-1);

    if (event.shiftKey && document.activeElement === first)
    {
      event.preventDefault();
      last.focus();
    }
    else if (!event.shiftKey && document.activeElement === last)
    {
      event.preventDefault();
      first.focus();
    }
  }
});

window.addEventListener("resize", () =>
{
  const sidebar = document.getElementById("sidebar");
  sidebar.inert = innerWidth < 1024 && document.getElementById("mobile-open").getAttribute("aria-expanded") !== "true";

  if (innerWidth >= 1024 && document.getElementById("mobile-open").getAttribute("aria-expanded") === "true")
  {
    setCatalogMobileMenu(false);
    sidebar.inert = false;
  }
});

window.addEventListener("popstate", async () =>
{
  const nextState = readCatalogState();

  if (await leaveCatalogEditor())
  {
    catalogState = nextState;
    renderCatalog();
  }
  else
  {
    writeCatalogUrl(true);
  }
});

window.addEventListener("beforeunload", (event) =>
{
  if (productDirty)
  {
    event.preventDefault();
    event.returnValue = "";
  }
});

document.addEventListener("DOMContentLoaded", () =>
{
  document.getElementById("sidebar").inert = innerWidth < 1024;
  renderCatalog();

  if (catalogLoadState === "loading")
  {
    loadCatalogPreview();
  }
}, { once: true });
