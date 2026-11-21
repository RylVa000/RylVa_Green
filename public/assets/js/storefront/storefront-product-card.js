"use strict";

// Shared homepage and catalog card. Controllers own data and actions.
window.RylvaProductCard = (() =>
{
  function escapeHtml(value)
  {
    return String(value ?? "").replace(/[&<>"']/g, (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function money(value)
  {
    return Number.isSafeInteger(value) && value >= 0
      ? window.RylvaStorefrontFormat.money(value) : "Harga belum tersedia";
  }

  function canBuy(product)
  {
    return product.available && product.availableStock > 0
      && Number.isSafeInteger(product.price) && product.price >= 0;
  }

  function render(product, { pending = false, savedProducts = new Set(), savePending = false,
    purchaseAction = "add" } = {})
  {
    const available = product.available && product.availableStock > 0;
    const sale = canBuy(product) && product.basePrice > product.price;
    const discount = sale ? Math.round((product.basePrice - product.price) / product.basePrice * 100) : 0;
    const priceText = money(product.price);
    const priceClass = canBuy(product) && priceText.length > 12 ? " home-price--long" : "";
    const saved = window.RylvaWishlistStore ? window.RylvaWishlistStore.has(product.productId) : savedProducts.has(product.slug);
    const unit = product.unit ? `<small> / ${escapeHtml(product.unit)}</small>` : "";
    const actionLabel = purchaseAction === "detail" ? "Pilih varian" : purchaseAction === "custom" ? "Racik buket" : "Tambah ke keranjang";
    const membership = window.RylvaWishlistStore?.snapshot();
    savePending ||= Boolean(membership && (membership.status !== "ready"
      || membership.pending.includes(product.productId) || membership.uncertain.includes(product.productId)
      || membership.mergeProductIds.includes(product.productId)));
    return `
      <article class="home-product home-product--${escapeHtml(product.slug)}" data-product-id="${escapeHtml(product.productId)}">
        <div class="home-product-picture">
          <img src="${escapeHtml(product.image)}" width="160" height="220" alt="${escapeHtml(product.name)}" loading="lazy">
          ${discount ? `<span class="home-product-discount">-${discount}%</span>` : ""}
        </div>
        <div class="home-product-info">
          <div class="home-product-heading">
            <h3>${escapeHtml(product.name)}</h3>
            <span class="home-stock ${available ? product.stockTone === "low" ? "is-low" : "" : "is-unavailable"}">
              ${available ? escapeHtml(product.stockLabel || "Tersedia") : escapeHtml(product.stockLabel === "Tidak tersedia" ? "Tidak tersedia" : "Stok habis")}
            </span>
          </div>
          <p class="home-product-description">${escapeHtml(product.description)}</p>
          <div class="home-product-purchase">
            <div class="home-product-prices">
              <div class="home-original-price-slot"${sale ? "" : ' aria-hidden="true"'}>
                ${sale ? `<del class="home-original-price">${money(product.basePrice)}</del>` : ""}
              </div>
              <p class="home-price${priceClass}">${priceText}${Number.isSafeInteger(product.price) ? unit : ""}</p>
            </div>
          </div>
          <div class="home-product-actions">
            <button
              class="home-text-button"
              type="button"
              data-home-detail="${escapeHtml(product.slug)}"
              aria-label="Lihat detail ${escapeHtml(product.name)}">
              <img src="../../assets/images/homepage/vector.svg" width="23" height="20" alt="" loading="lazy">
              <span>Detail<span class="home-detail-label-suffix"> Produk</span></span>
            </button>
            <button
              class="home-favorite-button"
              type="button"
              data-home-save="${escapeHtml(product.slug)}"
              data-wishlist-product-id="${escapeHtml(product.productId)}"
              aria-pressed="${saved}"
              aria-busy="${savePending}"
              aria-label="${saved ? "Hapus" : "Simpan"} ${escapeHtml(product.name)} ${saved ? "dari" : "ke"} Wishlist"
              ${savePending ? "disabled" : ""}>
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <use href="#home-heart-icon"></use>
              </svg>
            </button>
            <button
              class="home-icon-button${purchaseAction !== "add" ? " home-variant-action" : ""}"
              type="button"
              data-home-add="${escapeHtml(product.slug)}"
              data-purchase-action="${escapeHtml(purchaseAction)}"
              aria-label="${actionLabel} ${escapeHtml(product.name)}" ${!canBuy(product) || pending ? "disabled" : ""}>
              ${purchaseAction === "add" ? '<img src="../../assets/images/homepage/add-cart.svg" width="18" height="20" alt="" loading="lazy">' : `<span>${actionLabel}</span>`}
            </button>
          </div>
        </div>
      </article>`;
  }

  return { render, escapeHtml, money, canBuy };
})();
