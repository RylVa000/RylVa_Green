"use strict";

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

// Preview navigation stays explicit until the related storefront routes exist.
(() =>
{
  const previewNote = document.getElementById("storefront-preview-note");
  const footerNote = document.getElementById("storefront-footer-notice");
  const searchForm = document.getElementById("storefront-search");
  const compactScreen = window.matchMedia("(max-width: 600px)");
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
    previewNote.textContent = "Pratinjau dengan data contoh. "
      + destination + " belum terhubung pada pratinjau ini. "
      + (document.body.classList.contains("account-page") ? "Pengaturan Akun"
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
      if (trigger.dataset.storefrontPage === "Akun")
      {
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
      showPreviewDestination(trigger.dataset.storefrontPage, trigger);
    }
  });

  searchForm?.addEventListener("submit", (event) =>
  {
    event.preventDefault();
    const searchInput = document.getElementById("storefront-search-input");
    if (!searchInput.value.trim())
    {
      searchInput.focus();
      showPreviewDestination("Pencarian produk");
      return;
    }
    showPreviewDestination("Pencarian produk");
  });
})();
