"use strict";

// Homepage header extension. Other storefront pages keep their current shell.
window.RylvaHomepageHeader = (() =>
{
  function init({ readCart, removeItem, onCartChange, openDetail, openSaved, browseCollection = null })
  {
    const backdrop = document.getElementById("home-header-backdrop");
    const wishlistStore = window.RylvaWishlistStore;
    const wishlistTrigger = document.querySelector('header [data-storefront-page="Wishlist"]');
    let wishlistPanel = null;
    if (wishlistStore && wishlistTrigger)
    {
      wishlistPanel = document.createElement("section");
      wishlistPanel.className = "home-header-panel home-wishlist-panel";
      wishlistPanel.id = "home-wishlist-panel";
      wishlistPanel.hidden = true;
      wishlistPanel.setAttribute("role", "dialog");
      wishlistPanel.setAttribute("aria-labelledby", "home-wishlist-panel-title");
      wishlistPanel.innerHTML = `
        <div class="home-header-panel-top">
          <h2 id="home-wishlist-panel-title">Wishlist</h2>
          <button class="home-panel-close" type="button" data-header-close aria-label="Tutup Wishlist">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M6 18 18 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
            </svg>
          </button>
        </div>
        <div class="home-cart-panel-body" id="home-wishlist-panel-body" aria-live="polite"></div>
        <div class="home-panel-feedback" id="home-wishlist-panel-feedback" role="status" hidden></div>
        <div class="home-wishlist-panel-footer">
          <p class="home-panel-muted" id="home-wishlist-panel-count"></p>
          <a class="home-button" data-header-wishlist-all href="${wishlistStore.pageUrl()}">Lihat Semua Wishlist</a>
        </div>`;
      document.getElementById("home-cart-panel").after(wishlistPanel);
      wishlistTrigger.setAttribute("data-header-wishlist-trigger", "");
    }
    const panels =
    {
      cart: document.getElementById("home-cart-panel"),
      account: document.getElementById("home-account-panel")
    };
    const triggers =
    {
      cart: document.querySelector('header [data-storefront-page="Keranjang"]'),
      account: document.querySelector('header [data-storefront-page="Akun"]')
    };
    if (wishlistPanel)
    {
      panels.wishlist = wishlistPanel;
      triggers.wishlist = wishlistTrigger;
    }
    const cartBody = document.getElementById("home-cart-panel-body");
    const total = document.getElementById("home-cart-panel-total");
    const feedback = document.getElementById("home-cart-panel-feedback");
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    let active = null;
    let closeTimer = null;
    let openTimer = null;
    let snapshot = null;
    let busy = false;
    let requestVersion = 0;
    let pendingRemoval = null;
    let openedByClick = false;

    function renderWishlist()
    {
      const state = wishlistStore.snapshot();
      const body = document.getElementById("home-wishlist-panel-body");
      const count = document.getElementById("home-wishlist-panel-count");
      const title = document.getElementById("home-wishlist-panel-title");
      const items = [...state.items].sort((first, second) => second.savedAt - first.savedAt);
      const products = new Map(wishlistStore.products().map((product) => [product.productId, product]));
      title.textContent = state.status === "ready" ? `Wishlist (${items.length})` : "Wishlist";
      wishlistTrigger.setAttribute("aria-label", state.status === "ready" ? `Wishlist, ${items.length} produk tersimpan` : "Wishlist");
      body.setAttribute("aria-busy", String(state.status === "loading"));
      count.textContent = "";
      if (state.status === "loading")
      {
        body.innerHTML = '<p class="home-panel-loading" role="status">Memuat Wishlist…</p>';
      }
      else if (state.status !== "ready")
      {
        body.innerHTML = `
          <div class="home-panel-empty">
            <h3>Wishlist belum dapat ditampilkan</h3>
            <p>${escapeHtml(state.error?.message || "Coba muat kembali atau buka halaman Wishlist.")}</p>
            <button class="home-button" type="button" data-header-wishlist-retry>Coba Lagi</button>
          </div>`;
      }
      else if (!items.length)
      {
        body.innerHTML = `
          <div class="home-panel-empty">
            <h3>Wishlist masih kosong</h3>
            <p>Simpan produk yang Anda suka lewat ikon hati.</p>
            <a class="home-panel-secondary" href="/pages/public/catalog.html">Jelajahi Katalog</a>
          </div>`;
      }
      else
      {
        body.innerHTML = items.slice(0, 5).map((item) =>
        {
          const product = products.get(item.productId);
          const variant = product?.variants?.[0];
          const price = product && Object.hasOwn(product, "price") ? product.price : variant?.price;
          const image = product?.image || product?.gallery?.[0]?.src;
          const name = product?.name || "Produk tidak ditemukan";
          const unit = product?.unit || variant?.unit;
          const busy = state.pending.includes(item.productId) || state.uncertain.includes(item.productId)
            || state.mergeProductIds.includes(item.productId);
          return `
            <article class="home-mini-cart-item home-mini-wishlist-item">
              <div class="home-mini-cart-image">
                ${image ? `<img src="${escapeHtml(image)}" width="72" height="90" alt="${escapeHtml(name)}">` : '<span>Foto belum tersedia</span>'}
              </div>
              <div class="home-mini-cart-copy">
                ${product?.slug ? `<button class="home-panel-product-link" type="button" data-header-detail="${escapeHtml(product.slug)}">${escapeHtml(name)}</button>` : `<h3>${escapeHtml(name)}</h3>`}
                <p class="home-mini-cart-price">${money(price)}${Number.isSafeInteger(price) && unit ? ` <small>/ ${escapeHtml(unit)}</small>` : ""}</p>
              </div>
              <button class="home-panel-remove" type="button" data-header-wishlist-remove="${escapeHtml(item.productId)}"
                aria-label="Hapus ${escapeHtml(name)} dari Wishlist" aria-busy="${busy}" ${busy ? "disabled" : ""}>
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              </button>
            </article>`;
        }).join("\n");
        count.textContent = `Menampilkan ${Math.min(5, items.length)} dari ${items.length} produk tersimpan.`;
      }
      if (state.uncertain.length)
      {
        body.insertAdjacentHTML("beforeend", `
          <div class="home-panel-empty">
            <p>Respons perubahan terputus. Periksa hasil sebelum mengulangi tindakan.</p>
            <button class="home-panel-secondary" type="button" data-header-wishlist-reconcile="${escapeHtml(state.uncertain[0])}">Periksa Hasil</button>
          </div>`);
      }
    }

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

    function position()
    {
      if (!active)
      {
        return;
      }
      const trigger = triggers[active].getBoundingClientRect();
      const panel = panels[active];
      const top = Math.max(8, trigger.bottom + 10);
      const left = Math.max(16, Math.min(trigger.right - panel.offsetWidth, innerWidth - panel.offsetWidth - 16));
      panel.style.top = top + "px";
      panel.style.left = left + "px";
      panel.style.maxHeight = Math.max(140, innerHeight - top - 16) + "px";
      backdrop.style.top = document.querySelector(".storefront-main").getBoundingClientRect().bottom + "px";
    }

    function close(restoreFocus = false)
    {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      if (!active)
      {
        return;
      }
      const previous = triggers[active];
      panels[active].hidden = true;
      previous.setAttribute("aria-expanded", "false");
      active = null;
      pendingRemoval = null;
      openedByClick = false;
      backdrop.hidden = true;
      document.dispatchEvent(new CustomEvent("rylva:header-panel"));
      if (restoreFocus)
      {
        previous.focus({ preventScroll: true });
      }
    }

    function scheduleClose()
    {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      if (!openedByClick && !panels[active]?.contains(document.activeElement))
      {
        closeTimer = setTimeout(() => close(), 280);
      }
    }

    function renderCart()
    {
      const items = snapshot?.items || [];
      const quantity = items.reduce((count, item) => count + item.quantity, 0);
      document.getElementById("home-cart-panel-title").textContent = "Keranjang (" + quantity + ")";
      cartBody.setAttribute("aria-busy", String(busy));
      if (!items.length)
      {
        cartBody.innerHTML = `
          <div class="home-panel-empty">
            <h3>Keranjang masih kosong</h3>
            <p>Temukan tanaman atau bunga pilihan Anda di koleksi RylVa.</p>
            <button class="home-button" type="button" data-header-browse>Jelajahi Koleksi</button>
          </div>`;
        total.replaceChildren();
        return;
      }
      cartBody.innerHTML = items.map((item) => `
        <article class="home-mini-cart-item">
          <div class="home-mini-cart-image">
            <img src="${escapeHtml(item.image)}" width="72" height="90" alt="${escapeHtml(item.name)}">
          </div>
          <div class="home-mini-cart-copy">
            <button class="home-panel-product-link" type="button" data-header-detail="${escapeHtml(item.productId.replace(/^example-/, ""))}">
              ${escapeHtml(item.name)}
            </button>
            <p class="home-panel-muted">${escapeHtml(item.variant || "Standar")}</p>
            ${item.basePrice > item.price ? `<del>${money(item.basePrice)}</del>` : ""}
            <p class="home-mini-cart-price">${money(item.price)}</p>
          </div>
          <div class="home-mini-cart-quantity">
            <span>Jumlah <strong>${item.quantity}</strong></span>
            <button class="home-panel-remove" type="button" data-header-remove="${escapeHtml(item.lineId)}"
              aria-label="Hapus ${escapeHtml(item.name)} dari keranjang" ${busy ? "disabled" : ""}>
              <svg width="20" height="20" aria-hidden="true"><use href="#home-trash-icon"></use></svg>
            </button>
          </div>
        </article>`).join("\n");
      const validPrices = items.every((item) => Number.isSafeInteger(item.price) && item.price >= 0);
      const amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      total.innerHTML = `
        <div><span>Total produk (${quantity} unit)</span><strong>${validPrices ? money(amount) : "Periksa harga di keranjang"}</strong></div>
        <p>Belum termasuk ongkir. Produk dan harga contoh.</p>`;
    }

    async function refreshCart()
    {
      const version = ++requestVersion;
      cartBody.setAttribute("aria-busy", "true");
      if (!snapshot)
      {
        cartBody.innerHTML = '<p class="home-panel-loading" role="status">Memuat keranjang…</p>';
      }
      try
      {
        snapshot = await readCart();
        if (version !== requestVersion)
        {
          return;
        }
        renderCart();
        onCartChange(snapshot);
        feedback.textContent = snapshot.storageWarning || "";
        feedback.setAttribute("role", "status");
      }
      catch (error)
      {
        cartBody.setAttribute("aria-busy", "false");
        if (!snapshot)
        {
          cartBody.innerHTML = `
            <div class="home-panel-empty">
              <h3>Keranjang belum dapat dimuat</h3>
              <p>${escapeHtml(error.message || "Coba kembali atau buka halaman keranjang.")}</p>
              <button class="home-button" type="button" data-header-retry>Coba Lagi</button>
            </div>`;
        }
        feedback.setAttribute("role", "alert");
        feedback.textContent = snapshot ? "Isi sebelumnya tetap ditampilkan. Perbarui di halaman keranjang atau coba lagi." : "";
      }
    }

    function renderAccount()
    {
      const signedOut = window.RylvaCustomerPreviewAccess.isSignedOut();
      document.getElementById("home-account-panel-body").innerHTML = signedOut ? `
        <div class="home-account-welcome">
          <h3>Selamat datang di RylVa</h3>
          <p>Masuk untuk mengelola profil, alamat, dan pesanan Anda.</p>
          <div class="home-account-auth-actions">
            <a class="home-button" href="/pages/auth/customer-login.html?returnTo=%2Fpages%2Fcustomer%2Faccount.html">Masuk</a>
            <a class="home-panel-secondary" href="/pages/auth/customer-register.html">Daftar</a>
          </div>
        </div>` : `
        <p class="home-panel-muted">Kelola akun dan aktivitas belanja Anda. Data akun masih pratinjau.</p>
        <nav class="home-account-shortcuts" aria-label="Pintasan akun pelanggan">
          <a href="/pages/customer/account.html?section=profile">Profil Saya</a>
          <a href="/pages/customer/my-orders.html">Daftar Pesanan</a>
          <a href="/pages/customer/account.html?section=addresses">Daftar Alamat</a>
          <button type="button" data-header-saved>Wishlist</button>
          <a href="/pages/customer/account.html?section=security">Keamanan Akun</a>
          <a href="/pages/customer/account.html?section=privacy">Privasi &amp; Akun</a>
        </nav>`;
    }

    function open(type, focus = false)
    {
      clearTimeout(closeTimer);
      clearTimeout(openTimer);
      if (active && active !== type)
      {
        close();
      }
      active = type;
      panels[type].hidden = false;
      triggers[type].setAttribute("aria-expanded", "true");
      backdrop.hidden = false;
      if (type === "cart")
      {
        refreshCart();
      }
      else if (type === "wishlist")
      {
        renderWishlist();
      }
      else
      {
        renderAccount();
      }
      position();
      document.dispatchEvent(new CustomEvent("rylva:header-panel"));
      if (focus)
      {
        panels[type].querySelector("a, button")?.focus();
      }
    }

    async function confirmRemoval()
    {
      if (busy || !pendingRemoval)
      {
        return;
      }
      busy = true;
      feedback.querySelectorAll("button").forEach((button) => button.disabled = true);
      cartBody.querySelectorAll("button").forEach((button) => button.disabled = true);
      cartBody.setAttribute("aria-busy", "true");
      try
      {
        snapshot = await removeItem(pendingRemoval);
        pendingRemoval = null;
        onCartChange(snapshot);
        feedback.setAttribute("role", "status");
        feedback.textContent = "Produk dihapus dari keranjang contoh.";
      }
      catch (error)
      {
        pendingRemoval = null;
        feedback.setAttribute("role", "alert");
        feedback.textContent = error.message || "Produk belum dihapus. Coba lagi.";
        if (error.code === "conflict")
        {
          await refreshCart();
          feedback.setAttribute("role", "alert");
          feedback.textContent = "Keranjang telah diperbarui karena berubah di tab lain. Periksa kembali sebelum menghapus.";
        }
      }
      finally
      {
        busy = false;
        renderCart();
        if (active === "cart")
        {
          panels.cart.querySelector("[data-header-close]").focus();
        }
      }
    }

    for (const type of Object.keys(triggers))
    {
      const trigger = triggers[type];
      trigger.setAttribute("aria-haspopup", "dialog");
      trigger.setAttribute("aria-controls", panels[type].id);
      trigger.setAttribute("aria-expanded", "false");
      trigger.addEventListener("pointerenter", () =>
      {
        if (finePointer.matches)
        {
          clearTimeout(closeTimer);
          openTimer = setTimeout(() => open(type), 140);
        }
      });
      trigger.addEventListener("pointerleave", scheduleClose);
      trigger.addEventListener("click", (event) =>
      {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (active === type && openedByClick)
        {
          close();
        }
        else
        {
          open(type);
          openedByClick = true;
        }
      });
      trigger.addEventListener("keydown", (event) =>
      {
        if (event.key === "ArrowDown")
        {
          event.preventDefault();
          open(type, true);
          openedByClick = true;
        }
      });
      panels[type].addEventListener("pointerenter", () => clearTimeout(closeTimer));
      panels[type].addEventListener("pointerleave", scheduleClose);
    }
    document.addEventListener("click", (event) =>
    {
      const control = event.target.closest("button");
      if (!control || !control.closest(".home-header-panel") || control.disabled)
      {
        return;
      }
      if (control.hasAttribute("data-header-close"))
      {
        close(true);
      }
      else if (control.hasAttribute("data-header-retry"))
      {
        refreshCart();
      }
      else if (control.hasAttribute("data-header-remove"))
      {
        pendingRemoval = control.dataset.headerRemove;
        const item = snapshot.items.find((candidate) => candidate.lineId === pendingRemoval);
        feedback.setAttribute("role", "status");
        feedback.innerHTML = `
          <p>Hapus ${escapeHtml(item.name)} dari keranjang?</p>
          <div class="home-panel-confirm-actions">
            <button type="button" data-header-cancel>Batal</button>
            <button type="button" data-header-confirm>Hapus Produk</button>
          </div>`;
        feedback.querySelector("[data-header-cancel]").focus();
      }
      else if (control.hasAttribute("data-header-cancel"))
      {
        const previous = [...cartBody.querySelectorAll("[data-header-remove]")]
          .find((button) => button.dataset.headerRemove === pendingRemoval);
        pendingRemoval = null;
        feedback.replaceChildren();
        previous?.focus();
      }
      else if (control.hasAttribute("data-header-confirm"))
      {
        confirmRemoval();
      }
      else if (control.hasAttribute("data-header-detail"))
      {
        close(true);
        openDetail(control.dataset.headerDetail);
      }
      else if (control.hasAttribute("data-header-wishlist-retry"))
      {
        wishlistStore.refresh();
      }
      else if (control.dataset.headerWishlistReconcile)
      {
        wishlistStore.reconcile(control.dataset.headerWishlistReconcile);
      }
      else if (control.dataset.headerWishlistRemove)
      {
        removeSavedProduct(control);
      }
      else if (control.hasAttribute("data-header-saved"))
      {
        close(true);
        openSaved();
      }
      else if (control.hasAttribute("data-header-browse"))
      {
        close();
        if (browseCollection)
        {
          browseCollection();
        }
        else
        {
          document.getElementById("home-categories-title")?.scrollIntoView({ behavior: "instant" });
          document.querySelector("[data-home-collection=all]")?.focus({ preventScroll: true });
        }
      }
    });
    document.addEventListener("keydown", (event) =>
    {
      if (event.key === "Escape" && active)
      {
        event.preventDefault();
        close(true);
      }
    });
    document.addEventListener("focusin", (event) =>
    {
      if (active && !panels[active].contains(event.target) && !Object.values(triggers).includes(event.target))
      {
        close();
      }
    });
    backdrop.addEventListener("click", () => close(true));
    window.addEventListener("resize", position);
    document.addEventListener("rylva:header-visibility", position);
    window.addEventListener("scroll", () =>
    {
      if (active && triggers[active].getBoundingClientRect().bottom < 0)
      {
        close();
      }
      else
      {
        position();
      }
    }, { passive: true });
    panels.cart.addEventListener("error", (event) =>
    {
      if (event.target instanceof HTMLImageElement)
      {
        event.target.hidden = true;
        event.target.parentElement.textContent = "Foto belum tersedia";
      }
    }, true);
    async function removeSavedProduct(control)
    {
      const id = control.dataset.headerWishlistRemove;
      const index = [...wishlistPanel.querySelectorAll("[data-header-wishlist-remove]")].indexOf(control);
      const owner = wishlistStore.snapshot().owner;
      const message = document.getElementById("home-wishlist-panel-feedback");
      let failure = null;
      try
      {
        await wishlistStore.setSaved(id, false);
      }
      catch (error)
      {
        failure = error;
      }
      if (wishlistStore.snapshot().owner !== owner)
      {
        return;
      }
      message.setAttribute("role", failure ? "alert" : "status");
      message.textContent = failure
        ? failure.message || "Produk belum dihapus. Coba lagi."
        : "Produk dihapus dari Wishlist.";
      message.hidden = false;
      const buttons = [...wishlistPanel.querySelectorAll("[data-header-wishlist-remove]")];
      (buttons[Math.min(index, buttons.length - 1)] || wishlistPanel.querySelector("[data-header-wishlist-all]"))
        ?.focus({ preventScroll: true });
    }
    if (wishlistPanel)
    {
      let previousOwner = wishlistStore.snapshot().owner;
      wishlistStore.subscribe((state) =>
      {
        if (state.owner !== previousOwner || state.status === "loading")
        {
          const message = document.getElementById("home-wishlist-panel-feedback");
          message.hidden = true;
          message.textContent = "";
          previousOwner = state.owner;
        }
        renderWishlist();
      });
      renderWishlist();
      wishlistPanel.addEventListener("error", (event) =>
      {
        if (event.target instanceof HTMLImageElement)
        {
          event.target.parentElement.textContent = "Foto belum tersedia";
        }
      }, true);
    }
    return { close };
  }

  return { init };
})();
