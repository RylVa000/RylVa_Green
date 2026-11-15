"use strict";

window.RylvaOrderNavigation = (() =>
{
  const storagePrefix = "rylva-orders-navigation-v1:";
  const listPath = "/pages/customer/my-orders.html";
  const query = new URLSearchParams(window.location.search);

  function readContext(key = query.get("returnKey"))
  {
    if (!key || !/^[\w-]{1,80}$/.test(key))
    {
      return null;
    }
    try
    {
      const context = JSON.parse(window.sessionStorage.getItem(storagePrefix + key));
      const url = new URL(context.url, window.location.origin);
      if (context.customerId !== window.RylvaOrdersPreviewRepository?.customerId
        || url.origin !== window.location.origin || url.pathname !== listPath
        || url.username || url.password)
      {
        return null;
      }
      return { ...context, url: url.pathname + url.search };
    }
    catch
    {
      return null;
    }
  }

  function listUrl(key = query.get("returnKey"))
  {
    const context = readContext(key);
    const url = new URL(context?.url || listPath, window.location.origin);
    if (context)
    {
      url.searchParams.set("restoreKey", key);
    }
    return url.pathname + url.search;
  }

  function destination(page, orderId, options = {})
  {
    if (!["payment.html", "order-detail.html"].includes(page))
    {
      throw new Error("Tujuan pesanan tidak tersedia.");
    }
    const url = new URL(page, window.location.href);
    url.search = "";
    url.searchParams.set("orderId", orderId);
    const key = options.returnKey || query.get("returnKey");
    if (key)
    {
      url.searchParams.set("returnKey", key);
    }
    if (options.from)
    {
      url.searchParams.set("from", options.from);
    }
    if (options.intent)
    {
      url.searchParams.set("intent", options.intent);
    }
    return url.pathname + url.search;
  }

  return {
    readContext,
    listUrl,
    destination,
    saveContext(key, orderId)
    {
      if (window.location.pathname !== listPath)
      {
        return;
      }
      const url = new URL(window.location.href);
      url.searchParams.delete("restoreKey");
      try
      {
        window.sessionStorage.setItem(storagePrefix + key, JSON.stringify(
        {
          customerId: window.RylvaOrdersPreviewRepository.customerId,
          url: url.pathname + url.search,
          orderId,
          scrollY: window.scrollY
        }));
      }
      catch
      {
        // Navigation remains available even without position restoration.
      }
    },
    clearContexts()
    {
      try
      {
        for (const key of Object.keys(window.sessionStorage))
        {
          if (key.startsWith(storagePrefix))
          {
            window.sessionStorage.removeItem(key);
          }
        }
      }
      catch
      {
        // There is no stored navigation context when storage is restricted.
      }
    }
  };
})();

// A direct list shortcut survives payment -> detail -> payment navigation.
if (new URLSearchParams(window.location.search).has("orderId"))
{
  const breadcrumb = document.querySelector("main .breadcrumb");
  if (breadcrumb && !document.body.classList.contains("my-orders-page"))
  {
    const link = document.createElement("a");
    link.className = "text-button";
    link.href = window.RylvaOrderNavigation.listUrl();
    link.textContent = "Pesanan Saya";
    breadcrumb.prepend(link);
  }
}
