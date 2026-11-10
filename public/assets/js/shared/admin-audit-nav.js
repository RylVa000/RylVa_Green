"use strict";

(() =>
{
  function updateAuditNavigation()
  {
    const params = new URLSearchParams(location.search);
    const superadmin = params.get("role") === "superadmin" || location.pathname.endsWith("financial-report.html");
    const label = superadmin ? "Audit Log" : "Aktivitas Saya";
    document.querySelectorAll("[data-audit-link]").forEach((link) =>
    {
      link.href = `../superadmin/audit-log.html?role=${superadmin ? "superadmin" : "admin"}`;
      link.title = label;
      const text = link.querySelector(".sidebar-label");
      if (text && text.textContent !== label)
      {
        text.textContent = label;
      }
    });
  }

  updateAuditNavigation();
  window.addEventListener("popstate", updateAuditNavigation);
  document.addEventListener("change", () => queueMicrotask(updateAuditNavigation));
  const caption = document.getElementById("preview-role");
  if (caption)
  {
    new MutationObserver(updateAuditNavigation).observe(caption, { childList: true, subtree: true });
  }
})();
