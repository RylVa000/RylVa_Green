"use strict";

// Leaflet displays tiles; the geocoder adapter supplies structured address data.
window.RylvaAccountMap = (() =>
{
  let leafletPromise;
  let lastRequestAt = 0;
  let queue = Promise.resolve();
  const cache = new Map();
  const config = window.RylvaMapConfig || {};

  function normalize(feature)
  {
    const properties = feature.properties || {};
    const coordinates = feature.geometry?.coordinates || [];
    const street = [properties.street, properties.housenumber].filter(Boolean).join(" ");
    return {
      point: { latitude: Number(coordinates[1]), longitude: Number(coordinates[0]) },
      street: street || properties.name || "",
      village: properties.village || properties.locality || "",
      district: properties.district || "",
      city: properties.city || properties.county || "",
      province: properties.state || "",
      postcode: properties.postcode || "",
      title: [properties.name, street, properties.district, properties.city, properties.state].filter(Boolean).join(", ")
    };
  }

  async function request(path, parameters, signal)
  {
    const base = new URL(config.geocoderBaseUrl || "https://photon.komoot.io/");
    const url = new URL(path, base);
    url.search = new URLSearchParams(parameters);
    if (cache.has(url.href))
    {
      return structuredClone(cache.get(url.href));
    }
    const operation = queue.catch(() =>
    {
      // A previous failed lookup must not block the next user request.
    }).then(async () =>
    {
      const delay = Math.max(0, 1100 - (Date.now() - lastRequestAt));
      await new Promise((resolve) => setTimeout(resolve, delay));
      signal?.throwIfAborted();
      lastRequestAt = Date.now();
      const timeout = AbortSignal.timeout(8000);
      const response = await fetch(url, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
      if (!response.ok)
      {
        throw new Error("Lokasi belum dapat dimuat.");
      }
      const body = await response.json();
      const addresses = (body.features || []).map(normalize).filter((address) =>
      {
        return Number.isFinite(address.point.latitude) && Number.isFinite(address.point.longitude);
      });
      cache.set(url.href, addresses);
      return structuredClone(addresses);
    });
    queue = operation;
    return operation;
  }

  function loadLeaflet()
  {
    if (window.L && document.querySelector("link[data-rylva-leaflet]")?.sheet)
    {
      return Promise.resolve(window.L);
    }
    if (!leafletPromise)
    {
      leafletPromise = new Promise((resolve, reject) =>
      {
        const stylesheet = document.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.href = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";
        stylesheet.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
        stylesheet.crossOrigin = "anonymous";
        stylesheet.dataset.rylvaLeaflet = "true";
        const stylesheetReady = new Promise((resolveStyle, rejectStyle) =>
        {
          stylesheet.onload = resolveStyle;
          stylesheet.onerror = () => rejectStyle(new Error("Gaya peta belum dapat dimuat."));
        });
        stylesheetReady.catch(() =>
        {
          leafletPromise = null;
        });
        document.head.append(stylesheet);
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";
        script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
        script.crossOrigin = "anonymous";
        const timer = setTimeout(() =>
        {
          leafletPromise = null;
          reject(new Error("Peta belum dapat dimuat."));
        }, 8000);
        script.onload = () =>
        {
          stylesheetReady.then(() =>
          {
            clearTimeout(timer);
            resolve(window.L);
          }).catch((error) =>
          {
            clearTimeout(timer);
            leafletPromise = null;
            reject(error);
          });
        };
        script.onerror = () =>
        {
          clearTimeout(timer);
          leafletPromise = null;
          reject(new Error("Peta belum dapat dimuat."));
        };
        document.head.append(script);
      });
    }
    return leafletPromise;
  }

  async function mount(element, point, onSelect, onError)
  {
    const leaflet = await loadLeaflet();
    if (!element.isConnected)
    {
      return null;
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const map = leaflet.map(element, { zoomAnimation: !reduceMotion, fadeAnimation: !reduceMotion })
      .setView(point ? [point.latitude, point.longitude] : [-6.9175, 107.6191], 14);
    element.setAttribute("aria-label", "Peta lokasi. Gunakan tombol Pilih Titik Tengah Peta setelah menggeser peta dengan tombol panah.");
    const tiles = leaflet.tileLayer(config.tileUrl || "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    let tileLoaded = false;
    tiles.once("tileload", () =>
    {
      tileLoaded = true;
    });
    const tileTimer = setTimeout(() =>
    {
      if (!tileLoaded && element.isConnected)
      {
        onError();
      }
    }, 9000);
    let marker;
    function select(selectedPoint)
    {
      if (marker)
      {
        marker.setLatLng([selectedPoint.latitude, selectedPoint.longitude]);
      }
      else
      {
        marker = leaflet.marker([selectedPoint.latitude, selectedPoint.longitude],
        {
          icon: leaflet.divIcon({ className: "account-map-marker", html: '<span aria-hidden="true"></span>', iconSize: [24, 24] })
        }).addTo(map);
      }
      map.panTo(marker.getLatLng());
    }
    if (point)
    {
      select(point);
    }
    map.on("click", (event) => onSelect({ latitude: event.latlng.lat, longitude: event.latlng.lng }));
    return {
      select,
      center: () => ({ latitude: map.getCenter().lat, longitude: map.getCenter().lng }),
      destroy()
      {
        clearTimeout(tileTimer);
        map.remove();
      }
    };
  }

  return {
    mount,
    search: (query, signal) => request("api/", { q: query, countrycode: "ID", limit: 5 }, signal),
    reverse: (point, signal) => request("reverse", { lat: point.latitude, lon: point.longitude, limit: 1 }, signal)
  };
})();
