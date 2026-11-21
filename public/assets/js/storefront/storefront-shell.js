"use strict";

// Display only: amounts stay integer rupiah in adapters and calculations.
window.RylvaStorefrontFormat = (() =>
{
  const integerFormatter = new Intl.NumberFormat("id-ID");

  function money(value, unavailable = "Belum tersedia")
  {
    return Number.isSafeInteger(value) && value >= 0
      ? "Rp " + integerFormatter.format(value) : unavailable;
  }

  return { money };
})();

// Shared only by synthetic customer adapters; production authorization remains server-side.
window.RylvaCustomerPreviewAccess =
{
  isSignedOut()
  {
    try
    {
      return window.sessionStorage.getItem("rylva-account-preview-access-v1") === "signed-out";
    }
    catch
    {
      return false;
    }
  }
};

// Category IDs and aliases follow the existing public catalog contract.
window.RylvaStorefrontCategories = (() =>
{
  const imageRoot = "/assets/images/homepage/";
  const categories =
  [
    { id: "plants", name: "Tanaman Hias", image: "category-indoor.webp",
      description: "Jelajahi pilihan tanaman hias dan periksa informasi produk sebelum memilih untuk rumah atau taman Anda." },
    { id: "bouquet", name: "Buket Bunga", image: "category-bouquet.webp",
      description: "Temukan pilihan buket bunga dan periksa rincian rangkaian serta ketersediaannya." },
    { id: "custom", name: "Buket Kustom", image: "category-bouquet.webp",
      description: "Jelajahi pilihan buket kustom atau buka peracik untuk menyusun rangkaian Anda." },
    { id: "pots", name: "Pot & Vas", image: "category-pots.webp",
      description: "Jelajahi pot dan vas, lalu sesuaikan pilihan dengan ukuran serta kebutuhan Anda." },
    { id: "media", name: "Media Tanam & Pupuk", image: "category-media.webp",
      description: "Temukan media tanam dan pupuk. Periksa jenis, satuan, serta petunjuk penggunaan pada rincian produk." },
    { id: "tools", name: "Alat Berkebun", image: "category-seeds.webp",
      description: "Jelajahi alat berkebun dan periksa fungsi serta rincian produk sebelum memilih." },
    { id: "seeds", name: "Benih & Bibit", image: "category-seeds.webp",
      description: "Temukan pilihan benih dan bibit untuk kebutuhan menanam Anda." },
    { id: "accessories", name: "Aksesori Berkebun", image: "category-pots.webp",
      description: "Jelajahi aksesori pelengkap untuk tanaman dan kegiatan berkebun Anda." },
    { id: "terrarium", name: "Terrarium & Moss", image: "category-terrarium.webp",
      description: "Jelajahi pilihan terrarium dan moss, lalu periksa isi serta informasi produknya." }
  ].map((category) => ({ ...category, image: imageRoot + category.image }));
  const aliases = { plants: ["indoor", "outdoor"], media: ["media", "nutrients"] };
  const navigation =
  {
    "Tanaman Hias": "plants",
    "Buket Bunga": "bouquet",
    "Pot & Vas": "pots",
    "Media Tanam": "media",
    "Pupuk & Nutrisi": "media",
    "Alat Berkebun": "tools",
    "Perlengkapan Berkebun": "tools",
    "Benih & Bibit": "seeds",
    "Aksesori Berkebun": "accessories",
    "Terrarium & Moss": "terrarium"
  };

  function find(id)
  {
    return categories.find((category) => category.id === id) || null;
  }

  function url(id)
  {
    return find(id) ? "/pages/public/category.html?category=" + encodeURIComponent(id) : null;
  }

  function matches(product, id)
  {
    return (aliases[id] || [id]).some((value) => product.categories?.includes(value));
  }

  return { categories, navigation, find, url, matches };
})();

// Preview navigation stays explicit until the related storefront routes exist.
(() =>
{
  const previewNote = document.getElementById("storefront-preview-note");
  const footerNote = document.getElementById("storefront-footer-notice");
  const searchForm = document.getElementById("storefront-search");
  const compactScreen = window.matchMedia("(max-width: 600px)");
  const header = document.querySelector(".storefront-header");
  const wishlistTrigger = header?.querySelector('[data-storefront-page="Wishlist"]');
  if (wishlistTrigger)
  {
    const badge = document.createElement("span");
    badge.className = "storefront-wishlist-count";
    badge.setAttribute("aria-hidden", "true");
    badge.hidden = true;
    wishlistTrigger.insertBefore(badge, wishlistTrigger.querySelector("span:last-child"));
  }
  if (header)
  {
    const root = document.documentElement;
    let previousPosition = Math.max(0, scrollY);
    let direction = 0;
    let travel = 0;
    let scrollFrame = null;
    let instantFrame = null;

    const hasHeaderFocus = () => header.contains(document.activeElement)
      && document.activeElement.matches(":focus-visible, input, textarea, select, [contenteditable='true']");
    const hasOpenPanel = () => Boolean(document.querySelector(".home-header-panel:not([hidden])"));

    const setHeaderHidden = (hidden, instant = false) =>
    {
      const changed = root.classList.contains("storefront-nav-hidden") !== hidden;
      if (instant)
      {
        cancelAnimationFrame(instantFrame);
        root.classList.add("storefront-nav-instant");
        instantFrame = requestAnimationFrame(() =>
        {
          instantFrame = requestAnimationFrame(() => root.classList.remove("storefront-nav-instant"));
        });
      }
      root.classList.toggle("storefront-nav-hidden", hidden);
      if (changed || instant)
      {
        document.dispatchEvent(new CustomEvent("rylva:header-visibility", { detail: { hidden } }));
      }
    };

    const synchronizeHeaderHeight = () =>
    {
      root.style.setProperty("--storefront-header-height", `${header.offsetHeight}px`);
      setHeaderHidden(false, true);
      previousPosition = Math.max(0, scrollY);
      direction = 0;
      travel = 0;
    };

    const updateHeader = () =>
    {
      scrollFrame = null;
      const maximum = Math.max(0, root.scrollHeight - innerHeight);
      const position = Math.min(maximum, Math.max(0, scrollY));
      const delta = position - previousPosition;
      previousPosition = position;
      if (position <= header.offsetHeight + 16 || hasHeaderFocus() || hasOpenPanel())
      {
        setHeaderHidden(false);
        direction = 0;
        travel = 0;
        return;
      }
      if (Math.abs(delta) < 1)
      {
        return;
      }
      const nextDirection = Math.sign(delta);
      travel = direction === nextDirection ? travel + Math.abs(delta) : Math.abs(delta);
      direction = nextDirection;
      if (travel >= (direction > 0 ? 24 : 12))
      {
        setHeaderHidden(direction > 0);
        travel = 0;
      }
    };

    synchronizeHeaderHeight();
    if (typeof ResizeObserver === "function")
    {
      new ResizeObserver(synchronizeHeaderHeight).observe(header);
    }
    window.addEventListener("resize", synchronizeHeaderHeight, { passive: true });
    window.addEventListener("pageshow", synchronizeHeaderHeight);
    window.addEventListener("scroll", () =>
    {
      if (scrollFrame === null)
      {
        scrollFrame = requestAnimationFrame(updateHeader);
      }
    }, { passive: true });
    header.addEventListener("focusin", () =>
    {
      if (hasHeaderFocus())
      {
        setHeaderHidden(false, true);
      }
    });
    document.addEventListener("rylva:header-panel", () =>
    {
      if (hasOpenPanel())
      {
        setHeaderHidden(false, true);
      }
    });
  }
  const informationPages =
  {
    "Pusat Bantuan": "/pages/public/faq.html",
    "FAQ": "/pages/public/faq.html",
    "Hubungi Kami": "/pages/public/contact.html",
    "Kontak": "/pages/public/contact.html",
    "Informasi Pengiriman": "/pages/public/shipping-information.html",
    "Pembatalan & Refund": "/pages/public/cancellation-refund.html",
    "Syarat & Ketentuan": "/pages/public/terms-conditions.html",
    "Kebijakan Privasi": "/pages/public/privacy-policy.html",
    "Cara Memesan": "/pages/public/how-to-order.html",
    "Tentang Kami": "/pages/public/about.html",
    "Panduan Perawatan": "/pages/public/care-guides.html",
    "Koleksi Baru": "/pages/public/new-collection.html",
    "Promo Spesial": "/pages/public/special-offers.html",
    "Mitra Florist": "/pages/public/florist-partners.html"
  };
  const exploreLinks = document.querySelector('[aria-labelledby="footer-explore"] .storefront-footer-links');
  if (exploreLinks && !exploreLinks.querySelector('[data-storefront-page="Panduan Perawatan"]'))
  {
    const link = document.createElement("a");
    link.className = "storefront-page-link";
    link.dataset.storefrontPage = "Panduan Perawatan";
    link.href = informationPages["Panduan Perawatan"];
    link.textContent = "Panduan Perawatan";
    if (location.pathname === new URL(link.href, location.href).pathname)
    {
      link.setAttribute("aria-current", "page");
    }
    exploreLinks.append(link);
  }
  document.querySelectorAll("button[data-storefront-page]").forEach((button) =>
  {
    const categoryId = window.RylvaStorefrontCategories.navigation[button.dataset.storefrontPage];
    const destination = categoryId ? window.RylvaStorefrontCategories.url(categoryId)
      : informationPages[button.dataset.storefrontPage];
    if (!destination)
    {
      return;
    }
    const link = document.createElement("a");
    [...button.attributes].filter((attribute) => attribute.name !== "type").forEach((attribute) =>
    {
      link.setAttribute(attribute.name, attribute.value);
    });
    link.classList.add("storefront-page-link");
    link.href = destination;
    if (["Koleksi Baru", "Promo Spesial", "Mitra Florist"].includes(button.dataset.storefrontPage))
    {
      link.dataset.storefrontDestination = button.dataset.storefrontPage;
      link.removeAttribute("data-storefront-page");
      if (location.pathname === destination)
      {
        link.setAttribute("aria-current", "page");
      }
    }
    if (categoryId)
    {
      link.removeAttribute("data-storefront-page");
      link.dataset.storefrontCategory = categoryId;
    }
    link.replaceChildren(...button.childNodes);
    button.replaceWith(link);
  });
  const footerGroups = [];
  document.querySelectorAll(".storefront-footer-column:not(.storefront-contact)").forEach((column, index) =>
  {
    const heading = column.querySelector("h2");
    const links = column.querySelector(".storefront-footer-links");
    if (!heading || !links)
    {
      return;
    }
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "storefront-footer-toggle";
    toggle.textContent = heading.textContent;
    links.id = "storefront-footer-group-" + index;
    toggle.setAttribute("aria-controls", links.id);
    heading.replaceChildren(toggle);
    footerGroups.push({ toggle, links });
    toggle.addEventListener("click", () =>
    {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      links.hidden = expanded;
    });
  });
  function synchronizeFooter()
  {
    footerGroups.forEach(({ toggle, links }) =>
    {
      toggle.disabled = !compactScreen.matches;
      toggle.setAttribute("aria-expanded", String(!compactScreen.matches));
      links.hidden = compactScreen.matches;
    });
  }
  compactScreen.addEventListener("change", synchronizeFooter);
  synchronizeFooter();

  function showPreviewDestination(destination, trigger = null)
  {
    if (!previewNote)
    {
      return;
    }
    previewNote.hidden = false;
    previewNote.textContent = "Pratinjau dengan data contoh. "
      + destination + " belum terhubung pada pratinjau ini. "
      + (document.body.classList.contains("information-page") ? document.title.split("|")[0].trim()
        : document.body.classList.contains("cart-page") ? "Keranjang"
        : document.body.classList.contains("account-page") ? "Pengaturan Akun"
        : (document.body.classList.contains("my-orders-page") ? "Pesanan Saya"
          : (document.body.classList.contains("order-detail-page") ? "Detail Pesanan" : "Pembayaran")))
      + " tetap terbuka.";
    if (footerNote)
    {
      footerNote.hidden = !trigger?.closest(".storefront-footer");
      footerNote.textContent = previewNote.textContent;
    }
  }

  document.addEventListener("click", (event) =>
  {
    const trigger = event.target.closest("[data-storefront-page]");
    if (trigger)
    {
      if (informationPages[trigger.dataset.storefrontPage])
      {
        return;
      }
      if (trigger.dataset.storefrontPage === "Semua Produk")
      {
        window.location.assign("/pages/public/catalog.html");
        return;
      }
      if (trigger.dataset.storefrontPage === "Beranda")
      {
        window.location.assign("/pages/public/home.html");
        return;
      }
      if (trigger.dataset.storefrontPage === "Wishlist")
      {
        window.location.assign("/pages/customer/wishlist.html");
        return;
      }
      if (trigger.dataset.storefrontPage === "Keranjang")
      {
        if (!document.body.classList.contains("cart-page"))
        {
          window.location.assign("/pages/customer/cart.html");
        }
        return;
      }
      if (trigger.dataset.storefrontPage === "Akun")
      {
        if (window.RylvaCustomerPreviewAccess.isSignedOut())
        {
          const login = new URL("/pages/auth/customer-login.html", location.origin);
          login.searchParams.set("returnTo", "/pages/customer/account.html");
          location.assign(login.pathname + login.search);
          return;
        }
        const destination = new URL("/pages/customer/account.html", window.location.origin);
        if (window.location.pathname.endsWith("/my-orders.html") && window.RylvaOrderNavigation)
        {
          const key = "account-" + crypto.randomUUID();
          window.RylvaOrderNavigation.saveContext(key, null);
          destination.searchParams.set("returnKey", key);
        }
        else if (["payment.html", "order-detail.html"].some((page) => window.location.pathname.endsWith("/" + page)))
        {
          destination.searchParams.set("returnTo", window.location.pathname + window.location.search);
        }
        window.location.assign(destination.pathname + destination.search);
        return;
      }
      if (trigger.dataset.storefrontPage === "Lacak Pesanan")
      {
        window.location.assign("/pages/customer/my-orders.html");
        return;
      }
      if (["Buket Kustom", "Buket Costum"].includes(trigger.dataset.storefrontPage))
      {
        location.assign("/pages/customer/bouquet-customizer.html");
        return;
      }
      showPreviewDestination(trigger.dataset.storefrontPage, trigger);
    }
  });

  searchForm?.addEventListener("submit", (event) =>
  {
    event.preventDefault();
    const searchInput = document.getElementById("storefront-search-input");
    const target = new URL("/pages/public/catalog.html", location.origin);
    const query = searchInput.value.trim().slice(0, 100);
    if (query)
    {
      target.searchParams.set("q", query);
    }
    const proceed = () => location.assign(target.pathname + target.search);
    const navigation = new CustomEvent("rylva:before-search",
    {
      cancelable: true,
      detail: { proceed }
    });
    if (document.dispatchEvent(navigation))
    {
      proceed();
    }
  });
})();
