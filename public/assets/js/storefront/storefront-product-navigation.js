"use strict";

window.RylvaProductNavigation = (() =>
{
  const allowedPaths = ["/pages/public/catalog.html", "/pages/public/home.html", "/pages/customer/wishlist.html"];
  const parameters = new URLSearchParams(location.search);

  function safeList(value)
  {
    try
    {
      const url = new URL(value, location.origin);
      return url.origin === location.origin && !url.username && !url.password && allowedPaths.includes(url.pathname) ? url : null;
    }
    catch
    {
      return null;
    }
  }

  function open(slug)
  {
    const source = safeList(location.href);
    const target = new URL("/pages/public/product-detail.html", location.origin);
    target.searchParams.set("product", slug);
    if (source)
    {
      if (["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)
        && source.searchParams.get("preview") === "wishlist")
      {
        target.searchParams.set("preview", "wishlist");
        target.searchParams.set("state", source.searchParams.get("state") || "ready");
      }
      source.searchParams.delete("product");
      const context = { url: source.pathname + source.search, scroll: scrollY, slug,
        itemIndex: [...document.querySelectorAll(".home-product")].findIndex((card) =>
          card.querySelector("[data-home-detail]")?.dataset.homeDetail === slug),
        ownerScope: source.pathname === "/pages/customer/wishlist.html" ? window.RylvaWishlistStore?.snapshot().owner : null };
      history.replaceState({ ...history.state, productReturn: context }, "", source);
      target.searchParams.set("returnTo", context.url);
      try
      {
        const key = "rylva-product-return-" + crypto.randomUUID();
        sessionStorage.setItem(key, JSON.stringify(context));
        target.searchParams.set("returnKey", key);
      }
      catch
      {
        // The current history entry still retains the list context.
      }
    }
    location.assign(target);
  }

  function returnUrl()
  {
    return safeList(parameters.get("returnTo")) || new URL("/pages/public/catalog.html", location.origin);
  }

  function back()
  {
    const target = returnUrl();
    const referrer = safeList(document.referrer);
    if (referrer?.href === target.href && history.length > 1)
    {
      history.back();
      return;
    }
    const key = parameters.get("returnKey");
    if (key?.startsWith("rylva-product-return-"))
    {
      target.searchParams.set("restoreKey", key);
    }
    location.assign(target);
  }

  function restore()
  {
    let context = history.state?.productReturn;
    const url = new URL(location.href);
    const key = url.searchParams.get("restoreKey");
    try
    {
      if (!context && key?.startsWith("rylva-product-return-"))
      {
        context = JSON.parse(sessionStorage.getItem(key));
      }
      if (key)
      {
        sessionStorage.removeItem(key);
      }
    }
    catch
    {
      // Restoration is optional when browser storage is unavailable.
    }
    url.searchParams.delete("restoreKey");
    if (!context || safeList(context.url)?.pathname !== url.pathname)
    {
      return;
    }
    history.replaceState({ ...history.state, productReturn: null }, "", url);
    if (context.ownerScope && context.ownerScope !== window.RylvaWishlistStore?.snapshot().owner)
    {
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(() =>
    {
      const exact = [...document.querySelectorAll("[data-home-detail]")]
        .find((button) => button.dataset.homeDetail === context.slug);
      const cards = [...document.querySelectorAll(".home-product")];
      const index = Number.isInteger(context.itemIndex) ? Math.max(0, context.itemIndex) : 0;
      const nearest = cards[Math.min(index, cards.length - 1)]?.querySelector("[data-home-detail], button");
      const fallback = document.querySelector("#wishlist-products .wishlist-state a, #wishlist-search")
        || document.querySelector("#catalog-sort, #storefront-search-input");
      (exact || nearest || fallback)?.focus({ preventScroll: true });
      scrollTo({ top: Number.isFinite(context.scroll) ? context.scroll : 0, behavior: "instant" });
    }));
  }

  return { open, back, returnUrl, restore };
})();
