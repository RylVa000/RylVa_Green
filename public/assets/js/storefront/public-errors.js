"use strict";

(() =>
{
  const main = document.querySelector(".public-error-main");
  const primary = document.getElementById("public-error-primary");
  const illustration = document.getElementById("public-error-illustration");
  const fallback = document.getElementById("public-error-fallback");
  const connection = document.getElementById("public-error-connection");
  if (!main || !primary)
  {
    return;
  }

  function showImageFallback()
  {
    illustration.hidden = true;
    fallback.hidden = false;
  }

  illustration.addEventListener("error", showImageFallback);
  if (illustration.complete && illustration.naturalWidth === 0)
  {
    showImageFallback();
  }

  function updateConnection()
  {
    connection.hidden = false;
    connection.textContent = navigator.onLine
      ? "Koneksi kembali tersedia. Anda bisa mencoba membuka halaman lagi."
      : "Koneksi terputus. Sambungkan kembali, lalu pilih halaman yang ingin dibuka.";
  }

  if (!navigator.onLine)
  {
    updateConnection();
  }
  window.addEventListener("offline", updateConnection);
  window.addEventListener("online", updateConnection);

  function connectCatalogueReturn()
  {
    if (main.dataset.publicError === "403")
    {
      return;
    }
    const rawTarget = new URLSearchParams(location.search).get("returnTo");
    if (!rawTarget || !rawTarget.startsWith("/") || rawTarget.startsWith("//"))
    {
      return;
    }
    try
    {
      const target = new URL(rawTarget, location.origin);
      if (target.origin !== location.origin || target.username || target.password
        || target.pathname !== "/pages/public/catalog.html")
      {
        return;
      }
      const safeTarget = new URL(target.pathname, location.origin);
      const allowedKeys = ["q", "category", "min_price", "max_price", "discount",
        "available", "saved", "sort", "page", "loaded"];
      target.searchParams.forEach((value, key) =>
      {
        if (allowedKeys.includes(key))
        {
          safeTarget.searchParams.append(key, value);
        }
      });
      primary.href = safeTarget.pathname + safeTarget.search;
      primary.textContent = main.dataset.publicError === "503"
        ? "Periksa Katalog" : "Kembali ke Katalog";
    }
    catch
    {
      // Keep the native default action when a supplied context is malformed.
    }
  }

  connectCatalogueReturn();
})();
