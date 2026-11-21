"use strict";

// Hosting adapter. The source UI keeps logical URLs; only navigation uses index.php.
window.RylvaQueryRouting = (() =>
{
  const NativeUrl = window.URL;
  const nativeLocation = window.location;
  const nativeHistory = window.history;
  const pagePath = document.currentScript?.dataset.logicalPage || "/pages/public/home.html";

  function logicalUrl(value, base)
  {
    const url = base === undefined ? new NativeUrl(value) : new NativeUrl(value, base);
    if (url.origin === nativeLocation.origin && url.pathname === "/index.php" && url.searchParams.has("route"))
    {
      const route = url.searchParams.get("route");
      if (route.startsWith("/") && !route.startsWith("//") && !/[?#\\\r\n]/.test(route))
      {
        url.pathname = route;
        url.searchParams.delete("route");
      }
    }
    return url;
  }

  class RoutingUrl extends NativeUrl
  {
    constructor(value, base)
    {
      const logicalBase = base === undefined ? undefined : logicalUrl(base).href;
      super(logicalUrl(value, logicalBase).href);
    }
  }

  function physicalUrl(value, base = logicalUrl(nativeLocation.href).href)
  {
    const url = logicalUrl(value, base);
    if (url.origin !== nativeLocation.origin || url.username || url.password
      || url.pathname.startsWith("/assets/"))
    {
      return url.href;
    }
    const destination = new NativeUrl("/index.php", nativeLocation.origin);
    destination.searchParams.set("route", url.pathname);
    url.searchParams.forEach((entry, key) =>
    {
      if (key !== "route")
      {
        destination.searchParams.append(key, entry);
      }
    });
    destination.hash = url.hash;
    return destination.href;
  }

  const locationAdapter =
  {
    assign(value)
    {
      nativeLocation.assign(physicalUrl(value));
    },
    replace(value)
    {
      nativeLocation.replace(physicalUrl(value));
    },
    reload()
    {
      nativeLocation.reload();
    },
    toString()
    {
      return logicalUrl(nativeLocation.href).href;
    }
  };
  for (const property of ["href", "origin", "protocol", "host", "hostname", "port", "pathname", "search", "hash"])
  {
    Object.defineProperty(locationAdapter, property,
    {
      get: () => logicalUrl(nativeLocation.href)[property],
      set(value)
      {
        if (property === "hash")
        {
          nativeLocation.hash = value;
          return;
        }
        const destination = logicalUrl(nativeLocation.href);
        destination[property] = value;
        locationAdapter.assign(destination.href);
      }
    });
  }
  const historyAdapter = new Proxy(nativeHistory,
  {
    get(target, property)
    {
      if (["pushState", "replaceState"].includes(property))
      {
        return (state, title, url) => target[property](state, title,
          url === undefined || url === null ? url : physicalUrl(url));
      }
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
    set(target, property, value)
    {
      return Reflect.set(target, property, value, target);
    }
  });

  function adaptLink(link)
  {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || link.hasAttribute("download"))
    {
      return;
    }
    const base = new NativeUrl(pagePath, nativeLocation.origin);
    const destination = physicalUrl(href, base.href);
    if (destination !== link.href)
    {
      link.setAttribute("href", destination);
    }
  }

  const observer = new MutationObserver((records) =>
  {
    for (const record of records)
    {
      if (record.type === "attributes")
      {
        adaptLink(record.target);
      }
      for (const node of record.addedNodes)
      {
        if (node.nodeType === Node.ELEMENT_NODE)
        {
          if (node.matches("a[href], area[href]"))
          {
            adaptLink(node);
          }
          node.querySelectorAll("a[href], area[href]").forEach(adaptLink);
        }
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["href"] });
  document.querySelectorAll("a[href], area[href]").forEach(adaptLink);

  return {
    URL: RoutingUrl,
    location: locationAdapter,
    history: historyAdapter,
    physicalUrl,
    get referrer()
    {
      return document.referrer ? logicalUrl(document.referrer).href : "";
    }
  };
})();
