"use strict";

(() =>
{
  function updateSettingsNavigation()
  {
    const params = new URLSearchParams(location.search);
    const superadmin = params.get("role") === "superadmin"
      || location.pathname.endsWith("financial-report.html")
      || (location.pathname.endsWith("system-parameters.html") && params.get("role") !== "admin");

    document.querySelectorAll('a[title="Pengaturan Sistem"]').forEach((link) =>
    {
      link.href = "../superadmin/system-parameters.html?role=superadmin";
      link.hidden = !superadmin;
      link.style.display = superadmin ? "" : "none";
    });

    const navigation = document.getElementById("sidebar-nav");
    let taxonomyLink = navigation?.querySelector("[data-taxonomy-link]");

    if (navigation && !taxonomyLink)
    {
      taxonomyLink = document.createElement("a");
      const taxonomyIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const taxonomyUse = document.createElementNS("http://www.w3.org/2000/svg", "use");
      const taxonomyLabel = document.createElement("span");
      const productLink = navigation.querySelector('a[title="Produk & Varian"]');
      const exampleLink = productLink || navigation.querySelector("a.nav-item");
      taxonomyLink.className = exampleLink?.className || "nav-item";
      taxonomyLink.removeAttribute("aria-current");
      taxonomyLink.title = "Kategori & Atribut";
      taxonomyLink.dataset.taxonomyLink = "true";
      taxonomyLink.dataset.roleLink = "true";
      taxonomyIcon.setAttribute("class", exampleLink?.querySelector("svg")?.getAttribute("class") || "icon");
      taxonomyIcon.setAttribute("aria-hidden", "true");
      taxonomyUse.setAttribute("href", "#i-box");
      taxonomyLabel.className = exampleLink?.querySelector(".sidebar-label")?.className || "sidebar-label";
      taxonomyLabel.textContent = "Kategori & Atribut";
      taxonomyIcon.append(taxonomyUse);
      taxonomyLink.append(taxonomyIcon, taxonomyLabel);
      navigation.insertBefore(taxonomyLink, productLink?.nextSibling || null);
    }

    if (taxonomyLink)
    {
      taxonomyLink.href = `../staff/categories-attributes.html?role=${superadmin ? "superadmin" : "admin"}`;
    }

    let reportLink = navigation?.querySelector("[data-report-link]");

    if (navigation && !reportLink)
    {
      reportLink = document.createElement("a");
      const reportIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const reportUse = document.createElementNS("http://www.w3.org/2000/svg", "use");
      const reportLabel = document.createElement("span");
      const exampleLink = navigation.querySelector("a.nav-item");
      reportLink.className = exampleLink?.className || "nav-item";
      reportLink.title = "Laporan Operasional";
      reportLink.dataset.reportLink = "true";
      reportLink.dataset.roleLink = "true";
      reportIcon.setAttribute("class", exampleLink?.querySelector("svg")?.getAttribute("class") || "icon");
      reportIcon.setAttribute("aria-hidden", "true");
      reportUse.setAttribute("href", "#i-audit");
      reportLabel.className = exampleLink?.querySelector(".sidebar-label")?.className || "sidebar-label";
      reportLabel.textContent = "Laporan Operasional";
      reportIcon.append(reportUse);
      reportLink.append(reportIcon, reportLabel);
      const nextLink = navigation.querySelector('a[title="Laporan Keuangan"]')
        || navigation.querySelector('a[title="Audit Log"]');
      navigation.insertBefore(reportLink, nextLink || null);
    }

    if (reportLink)
    {
      reportLink.href = `../staff/operational-report.html?role=${superadmin ? "superadmin" : "admin"}`;
    }

    const existingStaffLink = navigation?.querySelector("[data-staff-accounts-link]");

    if (navigation && superadmin && !existingStaffLink)
    {
      const link = document.createElement("a");
      const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      const label = document.createElement("span");
      link.href = "../superadmin/staff-accounts.html?role=superadmin";
      link.className = "nav-item";
      link.title = "Akun Staf";
      link.dataset.staffAccountsLink = "true";
      link.dataset.superadminOnly = "true";
      icon.classList.add("icon");
      icon.setAttribute("aria-hidden", "true");
      use.setAttribute("href", "#i-users");
      label.className = "sidebar-label";
      label.textContent = "Akun Staf";
      icon.append(use);
      link.append(icon, label);
      navigation.append(link);
    }

    navigation?.querySelectorAll("[data-staff-accounts-link]").forEach((link) =>
    {
      link.hidden = !superadmin;
      link.style.display = superadmin ? "" : "none";
      link.href = "../superadmin/staff-accounts.html?role=superadmin";
    });

    const reviewPages =
    [
      ["../superadmin/payment-reconciliation.html", "Rekonsiliasi Pembayaran", "audit"],
      ["../superadmin/sensitive-approvals.html", "Persetujuan Sensitif", "check"]
    ];
    reviewPages.forEach(([file, title, symbol]) =>
    {
      const pageName = file.split("/").pop();
      let link = navigation?.querySelector(`[data-review-page="${pageName}"]`);
      if (navigation && !link)
      {
        link = document.createElement("a");
        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
        const label = document.createElement("span");
        const example = navigation.querySelector("a.nav-item");
        link.className = example?.className || "nav-item";
        link.title = title;
        link.dataset.reviewPage = pageName;
        link.dataset.superadminOnly = "true";
        icon.setAttribute("class", example?.querySelector("svg")?.getAttribute("class") || "icon");
        icon.setAttribute("aria-hidden", "true");
        use.setAttribute("href", `#i-${symbol}`);
        label.className = example?.querySelector(".sidebar-label")?.className || "sidebar-label";
        label.textContent = pageName === "payment-reconciliation.html" ? "Rekonsiliasi" : title;
        icon.append(use);
        link.append(icon, label);
        navigation.insertBefore(link, navigation.querySelector('a[title="Laporan Keuangan"]'));
      }
      if (link)
      {
        const actor = params.get("actor") === "sa-02" ? "sa-02" : "sa-01";
        link.href = `${file}?role=superadmin&actor=${actor}`;
        link.hidden = !superadmin;
        link.style.display = superadmin ? "" : "none";
        if (location.pathname.endsWith(pageName) && superadmin)
        {
          link.setAttribute("aria-current", "page");
          const selected = link.getBoundingClientRect();
          const bounds = navigation.getBoundingClientRect();
          if (selected.bottom > bounds.bottom)
          {
            navigation.scrollTop += selected.bottom - bounds.bottom;
          }
        }
        else
        {
          link.removeAttribute("aria-current");
        }
      }
    });

    const supportPages =
    [
      ["../staff/staff-profile.html", "Profil & Keamanan", "users"],
      ["../staff/staff-notifications.html", "Pusat Notifikasi", "info"],
      ["../staff/staff-help.html", "Pusat Bantuan", "help"]
    ];
    supportPages.forEach(([file, title, symbol]) =>
    {
      const pageName = file.split("/").pop();
      let link = navigation?.querySelector(`[data-support-page="${pageName}"]`);
      if (navigation && !link)
      {
        link = document.createElement("a");
        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
        const label = document.createElement("span");
        const example = navigation.querySelector("a.nav-item");
        link.className = example?.className || "nav-item";
        link.title = title;
        link.dataset.supportPage = pageName;
        link.dataset.roleLink = "true";
        icon.setAttribute("class", example?.querySelector("svg")?.getAttribute("class") || "icon");
        icon.setAttribute("aria-hidden", "true");
        use.setAttribute("href", `#i-${symbol}`);
        label.className = example?.querySelector(".sidebar-label")?.className || "sidebar-label";
        label.textContent = title;
        icon.append(use);
        link.append(icon, label);
        navigation.append(link);
      }
      if (link)
      {
        link.href = `${file}?role=${superadmin ? "superadmin" : "admin"}`;
        if (location.pathname.endsWith(pageName))
        {
          link.setAttribute("aria-current", "page");
          const selectedBounds = link.getBoundingClientRect();
          const navigationBounds = navigation.getBoundingClientRect();
          if (selectedBounds.bottom > navigationBounds.bottom)
          {
            navigation.scrollTop += selectedBounds.bottom - navigationBounds.bottom;
          }
          else if (selectedBounds.top < navigationBounds.top)
          {
            navigation.scrollTop -= navigationBounds.top - selectedBounds.top;
          }
        }
      }
    });

    const ownProfile = document.querySelector(".profile-row");
    if (ownProfile && ownProfile.tagName !== "A")
    {
      const link = document.createElement("a");
      Array.from(ownProfile.attributes).forEach((attribute) => link.setAttribute(attribute.name, attribute.value));
      link.dataset.supportShortcut = "profile";
      link.setAttribute("aria-label", "Buka Profil & Keamanan saya");
      link.append(...ownProfile.childNodes);
      ownProfile.replaceWith(link);
    }

    const helpBlock = document.querySelector(".help-block");
    if (helpBlock && helpBlock.tagName !== "A")
    {
      const link = document.createElement("a");
      link.className = helpBlock.className;
      link.dataset.supportShortcut = "help";
      link.append(...helpBlock.childNodes);
      helpBlock.replaceWith(link);
    }

    const avatar = document.querySelector(".topbar-account .profile-avatar");
    if (avatar && !avatar.closest("a"))
    {
      const link = document.createElement("a");
      link.className = "icon-button";
      link.dataset.supportShortcut = "profile";
      link.setAttribute("aria-label", "Buka Profil & Keamanan saya");
      avatar.replaceWith(link);
      link.append(avatar);
    }

    document.querySelectorAll("[data-support-shortcut]").forEach((link) =>
    {
      const file = link.dataset.supportShortcut === "help" ? "../staff/staff-help.html" : "../staff/staff-profile.html";
      link.href = `${file}?role=${superadmin ? "superadmin" : "admin"}`;
    });
  }

  updateSettingsNavigation();
  window.addEventListener("popstate", updateSettingsNavigation);
  document.addEventListener("change", () => queueMicrotask(updateSettingsNavigation));
  const caption = document.getElementById("preview-role");

  if (caption)
  {
    new MutationObserver(updateSettingsNavigation).observe(caption, { childList: true, subtree: true });
  }
})();
