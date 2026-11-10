"use strict";

(() =>
{
  const sidebar = document.getElementById("sidebar");
  const openButton = document.getElementById("mobile-open");
  const closeButton = document.getElementById("mobile-close");
  const backdrop = document.getElementById("mobile-backdrop");

  function setAdminMenu(open)
  {
    openButton.setAttribute("aria-expanded", String(open));
    backdrop.classList.toggle("hidden", !open);
    sidebar.classList.toggle("-translate-x-full", !open);
    sidebar.inert = !open && innerWidth < 1024;
    document.body.classList.toggle("overflow-hidden", open);

    if (open)
    {
      closeButton.focus();
    }
    else if (innerWidth < 1024)
    {
      openButton.focus();
    }
  }

  document.getElementById("sidebar-toggle").addEventListener("click", (event) =>
  {
    const collapsed = sidebar.classList.toggle("sidebar-collapsed");
    event.currentTarget.setAttribute("aria-expanded", String(!collapsed));
    event.currentTarget.setAttribute("aria-label", collapsed ? "Besarkan sidebar" : "Kecilkan sidebar");
  });
  openButton.addEventListener("click", () => setAdminMenu(true));
  closeButton.addEventListener("click", () => setAdminMenu(false));
  backdrop.addEventListener("click", () => setAdminMenu(false));
  document.addEventListener("keydown", (event) =>
  {
    if (openButton.getAttribute("aria-expanded") !== "true")
    {
      return;
    }

    if (event.key === "Escape")
    {
      setAdminMenu(false);
    }

    if (event.key === "Tab")
    {
      const controls = [...sidebar.querySelectorAll("a[href], button")]
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
    if (innerWidth >= 1024 && openButton.getAttribute("aria-expanded") === "true")
    {
      setAdminMenu(false);
    }
    sidebar.inert = innerWidth < 1024 && openButton.getAttribute("aria-expanded") !== "true";
  });
  sidebar.inert = innerWidth < 1024;
})();
