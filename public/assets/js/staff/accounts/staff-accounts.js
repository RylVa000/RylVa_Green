"use strict";

(() =>
{
  const root = document.getElementById("staff-accounts-root");
  const dialog = document.getElementById("staff-dialog");
  const dialogTitle = document.getElementById("staff-dialog-title");
  const dialogBody = document.getElementById("staff-dialog-body");
  const feedbackElement = document.getElementById("staff-feedback");
  const params = new URLSearchParams(location.search);
  const pageSize = 5;

  if (!root || !dialog || !window.staffAccountsFixture)
  {
    return;
  }

  const appState =
  {
    role: params.get("role") === "admin" ? "admin" : "superadmin",
    view: params.get("view") === "detail" && params.get("user") ? "detail" : "list",
    selectedId: params.get("user") || "",
    detailTab: ["overview", "permissions", "activation", "security", "activity"].includes(params.get("tab"))
      ? params.get("tab") : "overview",
    search: params.get("q") || "",
    segment: params.get("segment") || "all",
    roleFilter: params.get("roleFilter") || "all",
    accountFilter: params.get("accountFilter") || "all",
    mfaFilter: params.get("mfaFilter") || "all",
    sort: params.get("sort") || "attention",
    page: Math.max(1, Number(params.get("page")) || 1),
    filtersOpen: params.get("filters") === "1",
    loadState: "full",
    busy: false,
    pendingAction: null
  };

  let users = window.staffAccountsFixture.map(clone);
  let feedbackTimer = null;

  function clone(value)
  {
    return JSON.parse(JSON.stringify(value));
  }

  function makeNode(tagName, className, textContent)
  {
    const element = document.createElement(tagName);

    if (className)
    {
      element.className = className;
    }

    if (textContent !== undefined)
    {
      element.textContent = textContent;
    }

    return element;
  }

  function makeIcon(name, className = "icon")
  {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    svg.setAttribute("class", className);
    use.setAttribute("href", `#i-${name}`);
    svg.append(use);
    svg.setAttribute("aria-hidden", "true");
    return svg;
  }

  function makeButton(label, action, options = {})
  {
    const button = makeNode("button", options.className || "queue-button", label);
    button.type = "button";
    button.dataset.staffAction = action;

    if (options.id)
    {
      button.id = options.id;
    }

    if (options.userId)
    {
      button.dataset.userId = options.userId;
    }

    if (options.segment)
    {
      button.dataset.segment = options.segment;
    }

    if (options.primary)
    {
      button.classList.add("queue-button--primary");
    }

    if (options.disabled)
    {
      button.disabled = true;
    }

    if (options.ariaLabel)
    {
      button.setAttribute("aria-label", options.ariaLabel);
    }

    return button;
  }

  function makeBadge(label, tone, iconName)
  {
    const badge = makeNode("span", `queue-badge queue-badge--${tone}`);
    badge.append(makeIcon(iconName, "icon staff-badge-icon"), makeNode("span", "", label));
    return badge;
  }

  function initials(name)
  {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  function formatDate(value, includeTime = true)
  {
    if (!value)
    {
      return "Belum pernah";
    }

    const date = new Date(value);
    const dateOptions =
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta"
    };
    const timeOptions =
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta"
    };
    const dateText = new Intl.DateTimeFormat("id-ID", dateOptions).format(date);

    if (!includeTime)
    {
      return dateText;
    }

    return `${dateText}, ${new Intl.DateTimeFormat("id-ID", timeOptions).format(date)} WIB`;
  }

  function roleLabel(role)
  {
    return role === "SUPERADMIN" ? "SuperAdmin" : "Admin";
  }

  function accountStatus(user)
  {
    const statuses =
    {
      ACTIVE: ["Aktif", "success", "check"],
      PENDING: ["Belum aktif", "warning", "clock"],
      SUSPENDED: ["Ditangguhkan", "warning", "lock"],
      DEACTIVATED: ["Dinonaktifkan", "info", "lock"]
    };
    return statuses[user.accountStatus] || statuses.PENDING;
  }

  function activationStatus(user)
  {
    if (user.activationStatus === "COMPLETE")
    {
      return ["Selesai", "success", "check"];
    }

    if (user.activationStatus === "EXPIRED")
    {
      return ["Undangan kedaluwarsa", "warning", "clock"];
    }

    if (user.activationStatus === "PENDING")
    {
      return ["Menunggu aktivasi", "warning", "mail"];
    }

    return ["Tidak berlaku", "info", "info"];
  }

  function mfaStatus(user)
  {
    const statuses =
    {
      ACTIVE: ["Aktif", "success", "shield"],
      NOT_READY: ["Belum siap", "warning", "clock"],
      RESET_REQUIRED: ["Daftar ulang", "warning", "key"]
    };
    return statuses[user.mfaStatus] || statuses.NOT_READY;
  }

  function attentionText(user)
  {
    if (user.accountStatus === "DEACTIVATED")
    {
      return "Riwayat tersimpan";
    }

    if (user.accountStatus === "SUSPENDED")
    {
      return "Login ditahan sementara";
    }

    if (user.mfaStatus === "RESET_REQUIRED")
    {
      return "MFA perlu daftar ulang";
    }

    if (user.activationStatus === "PENDING")
    {
      return "Undangan menunggu";
    }

    return "Tidak ada tindakan";
  }

  function hasAttention(user)
  {
    return ["SUSPENDED", "PENDING"].includes(user.accountStatus)
      || user.activationStatus === "PENDING"
      || user.mfaStatus === "RESET_REQUIRED";
  }

  function statusStack(user)
  {
    const stack = makeNode("div", "staff-status-stack");
    const account = accountStatus(user);
    const activation = activationStatus(user);
    const mfa = mfaStatus(user);
    stack.append(
      makeBadge(account[0], account[1], account[2]),
      makeBadge(`Aktivasi: ${activation[0]}`, activation[1], activation[2]),
      makeBadge(`MFA: ${mfa[0]}`, mfa[1], mfa[2])
    );
    return stack;
  }

  function updateUrl()
  {
    const next = new URLSearchParams();
    next.set("role", appState.role);

    if (appState.view === "detail" && appState.selectedId)
    {
      next.set("view", "detail");
      next.set("user", appState.selectedId);
      if (appState.detailTab !== "overview")
      {
        next.set("tab", appState.detailTab);
      }
    }

    if (appState.search)
    {
      next.set("q", appState.search);
    }

    if (appState.segment !== "all")
    {
      next.set("segment", appState.segment);
    }

    if (appState.roleFilter !== "all")
    {
      next.set("roleFilter", appState.roleFilter);
    }

    if (appState.accountFilter !== "all")
    {
      next.set("accountFilter", appState.accountFilter);
    }

    if (appState.mfaFilter !== "all")
    {
      next.set("mfaFilter", appState.mfaFilter);
    }

    if (appState.sort !== "attention")
    {
      next.set("sort", appState.sort);
    }

    if (appState.page > 1)
    {
      next.set("page", String(appState.page));
    }

    if (appState.filtersOpen)
    {
      next.set("filters", "1");
    }

    history.replaceState(null, "", `${location.pathname}?${next.toString()}`);
  }

  function findUser(userId)
  {
    return users.find((user) => user.id === userId) || null;
  }

  function getFilteredUsers()
  {
    const query = appState.search.trim().toLocaleLowerCase("id-ID");
    const filtered = users.filter((user) =>
    {
      const searchable = `${user.name} ${user.email} ${roleLabel(user.role)} ${attentionText(user)}`
        .toLocaleLowerCase("id-ID");
      const segmentMatches = appState.segment === "all"
        || (appState.segment === "attention" && hasAttention(user))
        || (appState.segment === "active" && user.accountStatus === "ACTIVE" && user.mfaStatus === "ACTIVE")
        || (appState.segment === "pending" && user.accountStatus === "PENDING");
      const roleMatches = appState.roleFilter === "all" || user.role === appState.roleFilter;
      const accountMatches = appState.accountFilter === "all" || user.accountStatus === appState.accountFilter;
      const mfaMatches = appState.mfaFilter === "all" || user.mfaStatus === appState.mfaFilter;
      return searchable.includes(query) && segmentMatches && roleMatches && accountMatches && mfaMatches;
    });

    filtered.sort((first, second) =>
    {
      if (appState.sort === "name")
      {
        return first.name.localeCompare(second.name, "id");
      }

      if (appState.sort === "lastLogin")
      {
        return String(second.lastLogin || "").localeCompare(String(first.lastLogin || ""));
      }

      if (appState.sort === "newest")
      {
        return String(second.createdAt).localeCompare(String(first.createdAt));
      }

      return Number(hasAttention(second)) - Number(hasAttention(first))
        || String(second.createdAt).localeCompare(String(first.createdAt));
    });

    return filtered;
  }

  function showFeedback(message, isError = false)
  {
    window.clearTimeout(feedbackTimer);
    feedbackElement.hidden = false;
    feedbackElement.className = `product-feedback ${isError ? "product-feedback--error" : "product-feedback--success"}`;
    feedbackElement.textContent = message;
    feedbackElement.focus();
    feedbackTimer = window.setTimeout(() =>
    {
      feedbackElement.hidden = true;
    }, 6000);
  }

  function renderAccessDenied()
  {
    root.replaceChildren();
    const state = makeNode("section", "staff-state");
    const description = "Manajemen akun staf hanya dapat dibuka oleh SuperAdmin. "
      + "Admin tetap dapat mengelola tugas operasionalnya tanpa melihat kredensial atau akun staf lain.";
    state.append(
      makeIcon("lock"),
      makeNode("h1", "", "Akses SuperAdmin diperlukan"),
      makeNode("p", "", description),
      makeButton("Kembali ke operasional", "go-dashboard", { primary: true })
    );
    root.append(state);
  }

  function renderHeading()
  {
    const heading = makeNode("div", "staff-heading");
    const copy = makeNode("div");
    copy.append(
      makeNode("h1", "", "Manajemen Akun Staf"),
      makeNode("p", "", "Kelola undangan Admin, kesiapan MFA, dan akses sesi tanpa membuka kredensial.")
    );
    const actions = makeNode("div", "staff-heading-actions");
    actions.append(makeButton("Undang Admin", "open-invite", { primary: true }));
    heading.append(copy, actions);
    root.append(heading);

    const note = makeNode("div", "staff-demo-note");
    const description = "Pratinjau lokal. Data contoh hanya tersimpan di tab ini; undangan, MFA, sesi, "
      + "dan audit produksi belum terhubung ke server.";
    note.append(
      makeIcon("info", "icon icon--small"),
      makeNode("p", "", description)
    );
    root.append(note);
  }

  function renderPriorityHooks()
  {
    const attentionCount = users.filter(hasAttention).length;
    const pendingCount = users.filter((user) => user.accountStatus === "PENDING").length;
    const section = makeNode("section", "staff-priority-section");
    const attentionHook = makeNode("button", "staff-priority-hook");
    attentionHook.type = "button";
    attentionHook.dataset.staffAction = "segment";
    attentionHook.dataset.segment = "attention";
    attentionHook.append(
      makeIcon(attentionCount ? "alert" : "check"),
      makeNode("span", "staff-priority-copy")
    );
    attentionHook.lastChild.append(
      makeNode("strong", "", attentionCount ? `${attentionCount} akun butuh perhatian` : "Semua akun siap ditinjau"),
      makeNode(
        "span",
        "",
        attentionCount
          ? "Buka akun dengan aktivasi, MFA, atau login yang tertahan."
          : "Tidak ada status tertunda pada data contoh."
      )
    );
    const attentionAction = makeNode("span", "hook-action", attentionCount ? "Buka daftar" : "Tinjau daftar");
    attentionHook.append(attentionAction);

    const inviteHook = makeNode("button", "staff-priority-hook staff-priority-hook--quiet");
    inviteHook.type = "button";
    inviteHook.dataset.staffAction = "segment";
    inviteHook.dataset.segment = "pending";
    inviteHook.append(
      makeIcon(pendingCount ? "mail" : "check"),
      makeNode("span", "staff-priority-copy")
    );
    inviteHook.lastChild.append(
      makeNode("strong", "", pendingCount ? `${pendingCount} undangan belum selesai` : "Tidak ada undangan tertunda"),
      makeNode(
        "span",
        "",
        pendingCount
          ? "Penerima harus membuat kata sandi lalu mendaftarkan MFA."
          : "Undangan baru akan muncul di sini sampai selesai."
      )
    );
    const inviteAction = makeNode("span", "hook-action", pendingCount ? "Lihat undangan" : "Undang Admin");
    inviteHook.append(inviteAction);
    section.append(attentionHook, inviteHook);
    root.append(section);
  }

  function renderSummary()
  {
    const allCount = users.length;
    const activeCount = users.filter((user) => user.accountStatus === "ACTIVE" && user.mfaStatus === "ACTIVE").length;
    const pendingCount = users.filter((user) => user.accountStatus === "PENDING").length;
    const attentionCount = users.filter(hasAttention).length;
    const summary = makeNode("div", "staff-summary");
    const items =
    [
      ["Semua akun", allCount, "all"],
      ["Aktif & siap", activeCount, "active"],
      ["Menunggu aktivasi", pendingCount, "pending"],
      ["Perlu perhatian", attentionCount, "attention"]
    ];
    items.forEach(([label, count, segment]) =>
    {
      const button = makeNode("button", "queue-tab");
      button.type = "button";
      button.dataset.staffAction = "segment";
      button.dataset.segment = segment;
      button.setAttribute("aria-pressed", String(appState.segment === segment));
      button.append(makeNode("span", "", label), makeNode("strong", "tabular", String(count)));
      summary.append(button);
    });
    root.append(summary);
  }

  function renderFilterPanel()
  {
    if (!appState.filtersOpen)
    {
      return null;
    }

    const panel = makeNode("div", "staff-filter-panel");
    panel.setAttribute("aria-label", "Filter akun staf");
    panel.append(
      filterSelect("Peran", "staff-role-filter", appState.roleFilter,
      [
        ["all", "Semua peran"],
        ["ADMIN", "Admin"],
        ["SUPERADMIN", "SuperAdmin"]
      ]),
      filterSelect("Status akun", "staff-account-filter", appState.accountFilter,
      [
        ["all", "Semua status"],
        ["ACTIVE", "Aktif"],
        ["PENDING", "Belum aktif"],
        ["SUSPENDED", "Ditangguhkan"],
        ["DEACTIVATED", "Dinonaktifkan"]
      ]),
      filterSelect("MFA", "staff-mfa-filter", appState.mfaFilter,
      [
        ["all", "Semua kesiapan MFA"],
        ["ACTIVE", "Aktif"],
        ["NOT_READY", "Belum siap"],
        ["RESET_REQUIRED", "Daftar ulang"]
      ]),
      filterSelect("Urutkan", "staff-sort", appState.sort,
      [
        ["attention", "Perhatian dulu"],
        ["newest", "Akun terbaru"],
        ["lastLogin", "Login terakhir"],
        ["name", "Nama A–Z"]
      ])
    );
    const actions = makeNode("div", "staff-filter-actions");
    actions.append(
      makeButton("Terapkan filter", "apply-filters", { primary: true }),
      makeButton("Reset", "reset-filters")
    );
    panel.append(actions);
    return panel;
  }

  function filterSelect(labelText, id, value, options)
  {
    const wrapper = makeNode("div", "staff-filter-field");
    const label = makeNode("label", "", labelText);
    const select = makeNode("select");
    label.htmlFor = id;
    select.id = id;
    select.dataset.staffFilter = id;
    options.forEach(([optionValue, optionLabel]) =>
    {
      const option = makeNode("option", "", optionLabel);
      option.value = optionValue;
      option.selected = optionValue === value;
      select.append(option);
    });
    wrapper.append(label, select);
    return wrapper;
  }

  function renderList()
  {
    renderHeading();
    renderPriorityHooks();
    renderSummary();
    const sheet = makeNode("section", "staff-sheet");
    const toolbar = makeNode("form", "staff-toolbar");
    toolbar.id = "staff-search-form";
    const search = makeNode("div", "staff-search");
    const searchLabel = makeNode("label", "", "Cari nama atau email");
    searchLabel.htmlFor = "staff-search-input";
    const searchControl = makeNode("div", "staff-search-control");
    const searchIcon = makeIcon("search", "icon icon--small");
    const input = makeNode("input");
    input.id = "staff-search-input";
    input.name = "search";
    input.type = "search";
    input.value = appState.search;
    input.placeholder = "Contoh: Nadia atau @rylva.green";
    input.maxLength = 254;
    searchControl.append(searchIcon, input);
    search.append(searchLabel, searchControl);
    const toolbarActions = makeNode("div", "staff-toolbar-actions");
    const filterButton = makeButton("Filter", "toggle-filters");
    filterButton.setAttribute("aria-expanded", String(appState.filtersOpen));
    filterButton.append(makeIcon("filter", "icon icon--small"));
    const refreshButton = makeButton("Muat ulang", "reload");
    refreshButton.append(makeIcon("refresh", "icon icon--small"));
    toolbarActions.append(filterButton, refreshButton);
    toolbar.append(search, toolbarActions);
    sheet.append(toolbar);
    const results = getFilteredUsers();
    const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
    appState.page = Math.min(appState.page, pageCount);
    const filterPanel = renderFilterPanel();
    if (filterPanel)
    {
      sheet.append(filterPanel);
    }
    const meta = makeNode("div", "staff-list-meta");
    meta.append(
      makeNode(
        "span",
        "",
        results.length ? `Menampilkan ${results.length} dari ${users.length} akun` : "Tidak ada akun yang cocok"
      ),
      makeNode("span", "", `Urutan: ${sortLabel(appState.sort)}`)
    );
    sheet.append(meta);

    if (appState.loadState === "loading")
    {
      sheet.append(renderLoading());
      root.append(sheet);
      return;
    }

    if (appState.loadState === "error")
    {
      sheet.append(renderDataError());
      root.append(sheet);
      return;
    }

    if (appState.loadState === "empty")
    {
      sheet.append(renderEmptyState(
        "Belum ada akun staf",
        "Undang Admin pertama untuk mulai menyiapkan akses tim.",
        "Undang Admin",
        "open-invite"
      ));
      root.append(sheet);
      return;
    }

    if (!results.length)
    {
      sheet.append(renderEmptyState(
        "Akun tidak ditemukan",
        "Coba kata kunci atau filter lain. Tidak ada data yang dihapus dari pratinjau.",
        "Reset pencarian",
        "reset-filters"
      ));
      root.append(sheet);
      return;
    }

    const table = makeNode("table", "staff-table");
    table.setAttribute("aria-label", "Daftar akun staf");
    const head = document.createElement("thead");
    const headerRow = document.createElement("tr");
    ["Identitas", "Peran", "Status akun", "Aktivasi", "MFA", "Aksi"].forEach((label) =>
    {
      headerRow.append(makeNode("th", "", label));
    });
    head.append(headerRow);
    const body = document.createElement("tbody");
    const start = (appState.page - 1) * pageSize;
    results.slice(start, start + pageSize).forEach((user) => body.append(renderRow(user)));
    table.append(head, body);
    sheet.append(table, renderPagination(results.length, pageCount));
    root.append(sheet);
  }

  function sortLabel(sort)
  {
    return {
      attention: "perhatian dulu",
      newest: "akun terbaru",
      lastLogin: "login terakhir",
      name: "nama A–Z"
    }[sort] || "perhatian dulu";
  }

  function renderRow(user)
  {
    const row = document.createElement("tr");
    const identity = makeNode("td", "", "");
    identity.dataset.label = "Identitas";
    const person = makeNode("div", "staff-person");
    person.append(
      makeNode("span", "staff-avatar", initials(user.name)),
      makeNode("span", "staff-person-meta")
    );
    person.lastChild.append(
      makeNode("strong", "", user.name),
      makeNode("span", "", user.email),
      makeNode("span", "staff-muted", `Login terakhir: ${formatDate(user.lastLogin)}`)
    );
    identity.append(person);
    const role = makeNode("td", "", "");
    role.dataset.label = "Peran";
    role.append(
      makeNode("span", "staff-role", roleLabel(user.role)),
      makeNode(
        "span",
        "staff-role-note",
        user.role === "SUPERADMIN" ? "Akses pengelola sistem" : "Akses operasional"
      )
    );
    const account = makeNode("td", "", "");
    account.dataset.label = "Status akun";
    account.append(makeBadge(accountStatus(user)[0], accountStatus(user)[1], accountStatus(user)[2]));
    const activation = makeNode("td", "", "");
    activation.dataset.label = "Aktivasi";
    const activationData = activationStatus(user);
    activation.append(makeBadge(activationData[0], activationData[1], activationData[2]));
    const mfa = makeNode("td", "", "");
    mfa.dataset.label = "MFA";
    const mfaData = mfaStatus(user);
    mfa.append(makeBadge(mfaData[0], mfaData[1], mfaData[2]));
    const action = makeNode("td", "staff-row-action", "");
    action.dataset.label = "Aksi";
    action.append(makeButton("Buka detail", "detail", { userId: user.id, className: "queue-open-button" }));
    row.append(identity, role, account, activation, mfa, action);
    return row;
  }

  function renderPagination(total, pageCount)
  {
    const footer = makeNode("div", "staff-pagination");
    const start = (appState.page - 1) * pageSize + 1;
    const end = Math.min(appState.page * pageSize, total);
    footer.append(makeNode("span", "", `${start}–${end} dari ${total} akun`));
    const actions = makeNode("div", "staff-pagination-actions");
    const previous = makeButton("", "page", { ariaLabel: "Halaman sebelumnya", className: "icon-button" });
    previous.dataset.page = String(Math.max(1, appState.page - 1));
    previous.disabled = appState.page <= 1;
    previous.append(makeIcon("chevron", "icon icon--small"));
    const next = makeButton("", "page", { ariaLabel: "Halaman berikutnya", className: "icon-button" });
    next.dataset.page = String(Math.min(pageCount, appState.page + 1));
    next.disabled = appState.page >= pageCount;
    next.append(makeIcon("chevron", "icon icon--small"));
    next.querySelector(".icon").style.transform = "rotate(180deg)";
    actions.append(previous, makeNode("span", "", `${appState.page} dari ${pageCount}`), next);
    footer.append(actions);
    return footer;
  }

  function renderLoading()
  {
    const skeleton = makeNode("div", "staff-skeleton");
    [1, 2, 3, 4].forEach(() => skeleton.append(makeNode("span")));
    return skeleton;
  }

  function renderDataError()
  {
    return renderEmptyState(
      "Data akun belum dapat dimuat",
      "Periksa koneksi atau coba lagi. Tidak ada tindakan yang dijalankan saat data belum pasti.",
      "Coba lagi",
      "reload"
    );
  }

  function renderEmptyState(title, message, actionLabel, action)
  {
    const empty = makeNode("div", "staff-empty");
    empty.append(
      makeIcon("users"),
      makeNode("h2", "", title),
      makeNode("p", "", message),
      makeButton(actionLabel, action, { primary: action === "open-invite" })
    );
    return empty;
  }

  function renderDetail()
  {
    const user = findUser(appState.selectedId);

    if (!user)
    {
      renderHeading();
      root.append(renderEmptyState(
        "Akun tidak ditemukan",
        "Akun mungkin sudah tidak tersedia atau tautan detailnya sudah lama.",
        "Kembali ke daftar",
        "back-list"
      ));
      return;
    }

    const back = makeButton("Kembali ke daftar", "back-list", { className: "queue-text-button staff-detail-back" });
    back.prepend(makeIcon("chevron", "icon icon--small"));
    root.append(back);
    const heading = makeNode("div", "staff-detail-heading");
    const identity = makeNode("div", "staff-detail-identity");
    identity.append(makeNode("span", "staff-avatar", initials(user.name)), makeNode("div"));
    identity.lastChild.append(
      makeNode("h1", "", user.name),
      makeNode("p", "", `${user.email} · ${roleLabel(user.role)}`)
    );
    const status = makeNode("div", "staff-detail-status");
    const account = accountStatus(user);
    const activation = activationStatus(user);
    const mfa = mfaStatus(user);
    status.append(
      makeBadge(account[0], account[1], account[2]),
      makeBadge(`Aktivasi: ${activation[0]}`, activation[1], activation[2]),
      makeBadge(`MFA: ${mfa[0]}`, mfa[1], mfa[2])
    );
    identity.lastChild.append(status);
    const actions = makeNode("div", "staff-detail-actions");
    if (user.activationStatus === "PENDING" || user.activationStatus === "EXPIRED")
    {
      actions.append(makeButton("Kirim ulang aktivasi", "reissue", { userId: user.id }));
    }

    if (user.role === "ADMIN" && user.mfaStatus === "RESET_REQUIRED" && user.accountStatus === "ACTIVE")
    {
      actions.append(makeButton("Mulai reset MFA", "reset-mfa", { userId: user.id }));
    }

    if (user.role === "ADMIN" && user.accountStatus === "ACTIVE")
    {
      actions.append(makeButton("Nonaktifkan akun", "deactivate", { userId: user.id }));
    }

    heading.append(identity, actions);
    root.append(heading);
    const tabs = makeNode("nav", "product-detail-tabs staff-detail-tabs");
    tabs.setAttribute("aria-label", "Bagian detail akun staf");
    [
      ["overview", "Ringkasan"],
      ["permissions", "Hak akses"],
      ["activation", "Aktivasi"],
      ["security", "Keamanan & sesi"],
      ["activity", "Aktivitas"]
    ].forEach(([tab, label]) =>
    {
      const button = makeButton(label, "detail-tab");
      button.className = "";
      button.dataset.tab = tab;
      if (appState.detailTab === tab)
      {
        button.setAttribute("aria-current", "page");
      }
      tabs.append(button);
    });
    root.append(tabs);
    const grid = makeNode(
      "div",
      appState.detailTab === "overview" ? "staff-detail-grid" : "staff-detail-grid staff-detail-grid--single"
    );
    const primary = makeNode("div", "staff-detail-primary");
    const secondary = makeNode("div", "staff-detail-secondary");
    if (appState.detailTab === "overview")
    {
      primary.append(renderIdentitySection(user));
      secondary.append(renderSecurityPanel(user));
    }
    else if (appState.detailTab === "permissions")
    {
      primary.append(renderPermissionsSection(user));
    }
    else if (appState.detailTab === "activation")
    {
      primary.append(renderActivationSection(user));
    }
    else if (appState.detailTab === "security")
    {
      primary.append(renderSecurityPanel(user));
    }
    else
    {
      primary.append(renderActivitySection(user));
    }
    grid.append(primary);
    if (appState.detailTab === "overview")
    {
      grid.append(secondary);
    }
    root.append(grid);
  }

  function renderIdentitySection(user)
  {
    const section = makeNode("section", "staff-detail-section");
    section.append(sectionHeading("Ringkasan akun", "Identitas, status akun, dan dampak akses yang terlihat bersama."));
    const list = makeNode("dl", "staff-summary-list");
    const values =
    [
      ["Email staf", user.email],
      ["Nomor telepon", user.phone || "Tidak diisi"],
      ["Dibuat", formatDate(user.createdAt)],
      ["Login terakhir", formatDate(user.lastLogin)],
      [
        "Kondisi akses",
        user.accountStatus === "ACTIVE" && user.mfaStatus !== "ACTIVE"
          ? "Belum memenuhi syarat MFA"
          : attentionText(user)
      ]
    ];
    values.forEach(([label, value]) =>
    {
      const row = makeNode("div", "staff-summary-item");
      row.append(makeNode("dt", "", label), makeNode("dd", "", value));
      list.append(row);
    });
    section.append(list);
    const note = makeNode("p", "staff-detail-note");
    note.append(makeIcon("info", "icon icon--small"), makeNode("span", "", user.note));
    section.append(note);
    return section;
  }

  function sectionHeading(title, description)
  {
    const heading = makeNode("div", "staff-section-heading");
    heading.append(makeNode("div"));
    heading.firstChild.append(makeNode("h2", "", title), makeNode("p", "", description));
    return heading;
  }

  function renderPermissionsSection(user)
  {
    const section = makeNode("section", "staff-detail-section");
    section.append(sectionHeading(
      "Hak akses",
      "Peran utama menentukan batas akses; perubahan dicatat sebelum diterapkan."
    ));
    const table = makeNode("table", "staff-permission-table");
    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    headRow.append(makeNode("th", "", "Area"), makeNode("th", "", "Akses"));
    head.append(headRow);
    const body = document.createElement("tbody");
    const permissions = user.role === "SUPERADMIN"
      ? [["Operasional", "Kelola"], ["Keuangan", "Kelola"], ["Audit & pengaturan", "Kelola"], ["Akun staf", "Kelola"]]
      : [
        ["Operasional", "Kelola sesuai batas"],
        ["Keuangan", "Terbatas"],
        ["Audit & pengaturan", "Lihat sesuai izin"],
        ["Akun staf", "Tidak dapat membuka"]
      ];
    permissions.forEach(([area, access]) =>
    {
      const row = document.createElement("tr");
      row.append(makeNode("td", "", area), makeNode("td", "", access));
      body.append(row);
    });
    table.append(head, body);
    section.append(table);
    const note = makeNode("p", "staff-permission-note");
    note.textContent = user.role === "SUPERADMIN"
      ? "Akun SuperAdmin tidak dapat dibuat dari formulir undangan Admin. "
        + "Penetapan awal mengikuti prosedur peluncuran dan membutuhkan dokumentasi terpisah."
      : "Model granular per area belum menjadi kolom pada skema prototipe. "
        + "Jangan menganggap checkbox UI sebagai enforcement server.";
    section.append(note);
    return section;
  }

  function renderActivationSection(user)
  {
    const section = makeNode("section", "staff-detail-section");
    section.append(sectionHeading(
      "Aktivasi & undangan",
      "Admin aktif hanya setelah kata sandi dan MFA selesai dibuat oleh penerima."
    ));
    const timeline = makeNode("ol", "staff-timeline");
    const steps =
    [
      ["Akun dibuat", user.createdAt, "Berhasil", "success", "check"],
      [
        "Undangan dikirim",
        user.invitedAt,
        user.invitedAt ? "Terkirim" : "Tidak berlaku",
        user.invitedAt ? "success" : "info",
        user.invitedAt ? "mail" : "info"
      ],
      [
        "Kata sandi dibuat",
        user.activationStatus === "COMPLETE" ? user.invitedAt : null,
        user.activationStatus === "COMPLETE" ? "Selesai" : "Menunggu",
        user.activationStatus === "COMPLETE" ? "success" : "warning",
        user.activationStatus === "COMPLETE" ? "check" : "clock"
      ],
      [
        "MFA didaftarkan",
        user.mfaStatus === "ACTIVE" ? user.lastLogin || user.createdAt : null,
        user.mfaStatus === "ACTIVE" ? "Selesai" : "Menunggu",
        user.mfaStatus === "ACTIVE" ? "success" : "warning",
        user.mfaStatus === "ACTIVE" ? "shield" : "clock"
      ]
    ];
    steps.forEach(([label, at, status, tone, iconName]) =>
    {
      const item = makeNode("li");
      item.append(
        makeNode("strong", "", label),
        makeNode("span", "", at ? formatDate(at) : "Belum tercatat"),
        makeBadge(status, tone, iconName)
      );
      timeline.append(item);
    });
    section.append(timeline);
    const note = makeNode("p", "staff-inline-note");
    note.append(
      makeIcon("clock", "icon icon--small"),
      makeNode(
        "span",
        "",
        "Tautan aktivasi berlaku 24 jam dan hanya dapat dipakai sekali. "
          + "Kata sandi tidak pernah dikirim oleh SuperAdmin."
      )
    );
    section.append(note);
    return section;
  }

  function renderSecurityPanel(user)
  {
    const panel = makeNode("section", "staff-context-panel");
    panel.append(
      makeNode("h2", "", "Keamanan & sesi"),
      makeNode(
        "p",
        "",
        "Tidak ada token, secret MFA, atau backup code yang ditampilkan di layar pengelola."
      )
    );
    const definition = makeNode("dl", "staff-definition-list");
    [
      ["Sesi aktif", `${user.sessions} dari batas 2`],
      ["Idle timeout", user.role === "SUPERADMIN" ? "15 menit" : "30 menit"],
      ["Batas sesi", user.role === "SUPERADMIN" ? "4 jam" : "8 jam"],
      ["Login gagal", `${user.failedLogins} percobaan`]
    ].forEach(([label, value]) =>
    {
      const row = makeNode("div");
      row.append(makeNode("dt", "", label), makeNode("dd", "", value));
      definition.append(row);
    });
    panel.append(definition);
    const sessions = makeNode("ul", "staff-session-list");

    if (!user.sessions)
    {
      sessions.append(makeNode("li", "staff-muted", "Tidak ada sesi aktif."));
    }
    else
    {
      for (let index = 0; index < user.sessions; index += 1)
      {
        const item = makeNode("li");
        const device = makeNode("div", "staff-session-device");
        device.append(
          makeIcon(index === 0 ? "box" : "users", "icon icon--small"),
          makeNode("span", "staff-session-copy")
        );
        device.lastChild.append(
          makeNode("strong", "", index === 0 ? "Chrome · Windows" : "Safari · iPhone"),
          makeNode("span", "", index === 0 ? "Gudang Pusat · sesi terbaru" : "Perangkat lain · data contoh")
        );
        const status = makeBadge("MFA terverifikasi", "success", "shield");
        device.append(status);
        const metadata = makeNode("div", "staff-session-meta");
        metadata.append(
          makeNode("span", "", `Terakhir aktif: ${formatDate(user.lastActivity || user.lastLogin)}`),
          makeNode("span", "", `Berakhir: ${user.role === "SUPERADMIN" ? "4 jam" : "8 jam"}`)
        );
        item.append(device, metadata);
        sessions.append(item);
      }
    }
    panel.append(sessions);
    if (user.role === "ADMIN" && user.mfaStatus === "RESET_REQUIRED" && user.accountStatus === "ACTIVE")
    {
      panel.append(makeButton("Mulai reset MFA", "reset-mfa", { userId: user.id, primary: true }));
    }
    else if (user.accountStatus === "DEACTIVATED")
    {
      panel.append(makeNode(
        "p",
        "staff-action-warning",
        "Akun dinonaktifkan. Sesi aktif sudah dicabut dan riwayat dipertahankan."
      ));
    }
    else
    {
      panel.append(makeNode(
        "p",
        "staff-inline-note",
        "Pencabutan sesi manual memerlukan endpoint server dan re-authentication SuperAdmin."
      ));
    }
    return panel;
  }

  function renderActivitySection(user)
  {
    const section = makeNode("section", "staff-detail-section staff-history");
    section.append(sectionHeading("Aktivitas akun", "Riwayat hanya baca. Detail lengkap tetap berada di Audit Log."));
    user.activity.forEach((entry, index) =>
    {
      const details = document.createElement("details");
      if (index === 0)
      {
        details.open = true;
      }
      const summary = document.createElement("summary");
      summary.append(
        makeIcon("plus", "icon icon--small staff-plus"),
        makeIcon("minus", "icon icon--small staff-minus"),
        makeNode("span", "", entry.text)
      );
      const content = makeNode("div", "staff-history-entry");
      content.append(
        makeNode("span", "", `${formatDate(entry.at)} · ${entry.result}`),
        makeNode("span", "", "Pelaku dan perubahan rinci tercatat pada Audit Log.")
      );
      details.append(summary, content);
      section.append(details);
    });
    const link = makeNode("a", "queue-text-button");
    link.href = `../superadmin/audit-log.html?role=${appState.role}`;
    link.textContent = "Buka Audit Log";
    link.append(makeIcon("arrow", "icon icon--small"));
    section.append(link);
    return section;
  }

  function render()
  {
    updateUrl();
    root.replaceChildren();

    if (appState.role !== "superadmin")
    {
      renderAccessDenied();
      syncPreviewControls();
      return;
    }

    if (appState.view === "detail")
    {
      renderDetail();
    }
    else
    {
      renderList();
    }

    syncPreviewControls();
  }

  function syncPreviewControls()
  {
    const roleSelect = document.getElementById("staff-profile");
    const loadSelect = document.getElementById("staff-load-state");
    if (roleSelect)
    {
      roleSelect.value = appState.role;
    }
    if (loadSelect)
    {
      loadSelect.value = appState.loadState;
    }
    const caption = document.getElementById("preview-role");
    if (caption)
    {
      caption.textContent = appState.role === "superadmin" ? "Pratinjau SuperAdmin" : "Pratinjau Admin";
    }
  }

  function navigate(next, replace = false)
  {
    Object.assign(appState, next);
    if (appState.view === "list")
    {
      appState.selectedId = "";
    }
    if (!replace)
    {
      updateUrl();
    }
    render();
  }

  function openDialog(title, content)
  {
    dialogTitle.textContent = title;
    dialogBody.replaceChildren(content);
    if (!dialog.open)
    {
      dialog.showModal();
    }
  }

  function renderInviteDialog()
  {
    const form = makeNode("form", "staff-dialog-form");
    form.id = "staff-invite-form";
    form.noValidate = true;
    const errors = makeNode("div", "staff-dialog-errors");
    errors.id = "staff-dialog-errors";
    errors.tabIndex = -1;
    errors.hidden = true;
    errors.setAttribute("role", "alert");
    form.append(errors);
    const fields = makeNode("div", "staff-form-grid");
    fields.append(
      formField(
        "Nama lengkap",
        "staff-invite-name",
        "text",
        "Contoh: Dimas Pratama",
        { required: true, maxLength: 100 }
      ),
      formField(
        "Email kerja",
        "staff-invite-email",
        "email",
        "Undangan dikirim ke alamat ini.",
        { required: true, maxLength: 254 }
      ),
      formField("Nomor telepon (opsional)", "staff-invite-phone", "tel", "+62xxxxxxxxx", { maxLength: 20 }),
      formField(
        "Peran",
        "staff-invite-role",
        "text",
        "Formulir ini hanya membuat Admin.",
        { value: "Admin", disabled: true }
      )
    );
    form.append(fields);
    const note = makeNode("p", "staff-dialog-note");
    note.append(
      makeIcon("lock", "icon icon--small"),
      makeNode(
        "span",
        "",
        "Jangan masukkan kata sandi. Penerima membuat kata sandi sendiri melalui "
          + "tautan aktivasi, lalu mendaftarkan MFA."
      )
    );
    form.append(note);
    const actions = makeNode("div", "staff-form-actions");
    actions.append(makeButton("Batal", "close-dialog"));
    const submit = makeButton("Buat undangan", "submit-invite", { primary: true });
    submit.type = "submit";
    actions.append(submit);
    form.append(actions);
    openDialog("Undang Admin", form);
    document.getElementById("staff-invite-name").focus();
  }

  function formField(labelText, id, type, helpText, options = {})
  {
    const field = makeNode("div", `staff-form-field ${options.full ? "staff-form-field--full" : ""}`);
    const label = makeNode("label", "", labelText);
    const input = makeNode(options.textarea ? "textarea" : "input");
    label.htmlFor = id;
    input.id = id;
    input.name = id;
    input.type = type;
    input.required = Boolean(options.required);
    input.maxLength = options.maxLength || 500;
    input.placeholder = helpText;

    if (options.value)
    {
      input.value = options.value;
    }

    if (options.disabled)
    {
      input.disabled = true;
    }

    const help = makeNode("small", "staff-form-help", helpText);
    help.id = `${id}-help`;
    input.setAttribute("aria-describedby", help.id);
    field.append(label, input, help);
    return field;
  }

  function renderActionDialog(action, user)
  {
    appState.pendingAction = { action, userId: user.id };
    const form = makeNode("form", "staff-dialog-form");
    form.id = "staff-action-form";
    form.noValidate = true;
    const errors = makeNode("div", "staff-dialog-errors");
    errors.id = "staff-dialog-errors";
    errors.tabIndex = -1;
    errors.hidden = true;
    errors.setAttribute("role", "alert");
    form.append(errors);
    const copy = makeNode("p", "", actionCopy(action, user));
    form.append(copy);

    if (action === "deactivate" || action === "reset-mfa")
    {
      const fields = makeNode("div", "staff-form-grid");
      fields.append(formField(
        "Alasan tindakan",
        "staff-action-reason",
        "text",
        "Minimal 5 karakter, maksimal 500 karakter.",
        { required: true, maxLength: 500, full: true }
      ));
      form.append(fields);
      const check = makeNode("label", "staff-check-row");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.id = "staff-action-confirm";
      input.required = true;
      check.append(input, makeNode("span", "", action === "deactivate"
        ? "Saya paham login akan ditolak, sesi dicabut maksimal 1 menit, dan pesanan berjalan dikembalikan ke antrean."
        : "Saya paham Admin tidak dapat memakai akses operasional sampai MFA didaftarkan ulang."));
      form.append(check);
    }

    if (action === "reissue")
    {
      const note = makeNode("p", "staff-dialog-note");
      note.append(
        makeIcon("mail", "icon icon--small"),
        makeNode(
          "span",
          "",
          "Undangan lama akan dianggap tidak berlaku. Tautan baru berlaku 24 jam "
            + "dan hanya dapat dipakai sekali."
        )
      );
      form.append(note);
    }

    const actions = makeNode("div", "staff-form-actions");
    actions.append(makeButton("Batal", "close-dialog"));
    const submitLabel = action === "deactivate"
      ? "Nonaktifkan akun"
      : action === "reset-mfa"
        ? "Tandai reset MFA"
        : "Kirim ulang undangan";
    const submit = makeButton(submitLabel, "submit-action", { primary: true });
    submit.type = "submit";
    actions.append(submit);
    form.append(actions);
    openDialog(actionTitle(action), form);
    const firstInput = form.querySelector("input:not([type='checkbox'])");
    firstInput?.focus();
  }

  function actionTitle(action)
  {
    return {
      deactivate: "Nonaktifkan akun",
      "reset-mfa": "Reset MFA Admin",
      reissue: "Kirim ulang aktivasi"
    }[action] || "Tindakan akun staf";
  }

  function actionCopy(action, user)
  {
    if (action === "deactivate")
    {
      return `Akun ${user.name} akan ditandai dinonaktifkan. `
        + `Login dan sesi aktif dicabut; riwayat tidak dihapus dan `
        + `${user.pendingOrders || 0} pesanan berjalan dikembalikan ke antrean.`;
    }

    if (action === "reset-mfa")
    {
      return `Pendaftaran MFA ${user.name} akan ditandai perlu diulang. `
        + "Reset ini tidak mengatur atau menampilkan kata sandi. Setelah reset, "
        + "Admin harus mendaftarkan MFA sebelum dapat masuk kembali.";
    }

      return `Kirim tautan aktivasi baru ke ${user.email}. `
        + "Jika email gagal terkirim, akun tetap menunggu dan dapat dicoba lagi.";
  }

  function validateInvite(form)
  {
    const errors = [];
    const name = form.elements.namedItem("staff-invite-name").value.trim();
    const email = form.elements.namedItem("staff-invite-email").value.trim().toLowerCase();
    const phone = form.elements.namedItem("staff-invite-phone").value.trim();

    if (name.length < 2 || name.length > 100)
    {
      errors.push("Nama lengkap harus berisi 2–100 karakter.");
    }

    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254)
    {
      errors.push("Masukkan email kerja yang valid, maksimal 254 karakter.");
    }

    if (users.some((user) => user.email.toLowerCase() === email))
    {
      errors.push("Email tersebut sudah terdaftar sebagai akun staf.");
    }

    if (phone && !/^\+62\d{9,15}$/.test(phone))
    {
      errors.push("Nomor telepon harus memakai format +62 diikuti 9–15 digit.");
    }

    return errors;
  }

  function showDialogErrors(errors)
  {
    const element = document.getElementById("staff-dialog-errors");
    if (!element)
    {
      return;
    }

    element.replaceChildren();
    const list = makeNode("ul");
    errors.forEach((error) => list.append(makeNode("li", "", error)));
    element.append(list);
    element.hidden = !errors.length;
    if (errors.length)
    {
      element.focus();
    }
  }

  function closeDialog()
  {
    appState.pendingAction = null;
    dialog.close();
  }

  function submitInvite(form)
  {
    const errors = validateInvite(form);
    if (errors.length)
    {
      showDialogErrors(errors);
      return;
    }

    if (document.getElementById("staff-fail-email").checked)
    {
      showDialogErrors([
        "Email undangan gagal dikirim pada simulasi ini. Akun belum dibuat. "
          + "Periksa alamat lalu coba lagi."
      ]);
      return;
    }

    const name = form.elements.namedItem("staff-invite-name").value.trim();
    const email = form.elements.namedItem("staff-invite-email").value.trim().toLowerCase();
    const phone = form.elements.namedItem("staff-invite-phone").value.trim();
    const now = new Date().toISOString();
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const user =
    {
      id: `admin-${String(Date.now()).slice(-6)}`,
      name,
      email,
      phone,
      role: "ADMIN",
      accountStatus: "PENDING",
      activationStatus: "PENDING",
      invitedAt: now,
      invitationExpiresAt: expiry,
      mfaStatus: "NOT_READY",
      lastLogin: null,
      lastActivity: null,
      sessions: 0,
      pendingOrders: 0,
      failedLogins: 0,
      createdAt: now,
      note: "Undangan lokal baru; penerima belum menyelesaikan aktivasi.",
      activity: [{ at: now, text: "Undangan Admin dibuat", result: "Menunggu" }]
    };
    users.unshift(user);
    closeDialog();
    navigate({ view: "detail", selectedId: user.id, page: 1 });
    showFeedback(`Undangan untuk ${name} dibuat. Kata sandi belum dibuat dan akun belum aktif.`);
  }

  function submitAction(form)
  {
    const pending = appState.pendingAction;
    const user = pending ? findUser(pending.userId) : null;

    if (!pending || !user)
    {
      closeDialog();
      return;
    }

    if (document.getElementById("staff-expire-session").checked)
    {
      showDialogErrors(["Sesi SuperAdmin berakhir pada simulasi ini. Tidak ada perubahan yang disimpan."]);
      return;
    }

    if (pending.action === "reissue" && document.getElementById("staff-fail-email").checked)
    {
      showDialogErrors([
        "Email undangan gagal dikirim pada simulasi ini. Undangan lama tetap tercatat "
          + "dan tidak ada tautan baru yang dibuat."
      ]);
      return;
    }

    if (pending.action === "deactivate" || pending.action === "reset-mfa")
    {
      const reason = form.elements.namedItem("staff-action-reason").value.trim();
      const confirmed = form.elements.namedItem("staff-action-confirm").checked;
      const errors = [];
      if (reason.length < 5 || reason.length > 500)
      {
        errors.push("Alasan harus berisi 5–500 karakter.");
      }
      if (!confirmed)
      {
        errors.push("Centang konfirmasi setelah membaca dampak tindakan.");
      }
      if (errors.length)
      {
        showDialogErrors(errors);
        return;
      }
      if (pending.action === "deactivate" && user.id === "superadmin-01")
      {
        showDialogErrors(["Akun SuperAdmin yang sedang digunakan tidak dapat dinonaktifkan dari layar ini."]);
        return;
      }
      if (pending.action === "reset-mfa" && user.role !== "ADMIN")
      {
        showDialogErrors(["Reset MFA SuperAdmin memerlukan backup code atau persetujuan SuperAdmin kedua."]);
        return;
      }
      if (pending.action === "deactivate")
      {
        user.accountStatus = "DEACTIVATED";
        user.sessions = 0;
        user.deactivatedAt = new Date().toISOString();
        user.deactivationReason = reason;
        user.activity.unshift(
        {
          at: new Date().toISOString(),
          text: "Akun dinonaktifkan oleh SuperAdmin",
          result: "Berhasil"
        });
        closeDialog();
        navigate({ view: "detail", selectedId: user.id });
        showFeedback(`Akun ${user.name} dinonaktifkan. Sesi aktif dicabut; pesanan berjalan dikembalikan ke antrean.`);
        return;
      }
      user.mfaStatus = "RESET_REQUIRED";
      user.sessions = 0;
      user.activity.unshift(
      {
        at: new Date().toISOString(),
        text: "MFA ditandai untuk pendaftaran ulang oleh SuperAdmin",
        result: "Berhasil"
      });
      closeDialog();
      navigate({ view: "detail", selectedId: user.id });
      showFeedback(`Reset MFA untuk ${user.name} dicatat. Akses operasional menunggu pendaftaran ulang MFA.`);
      return;
    }

    const now = new Date();
    user.invitedAt = now.toISOString();
    user.invitationExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    user.accountStatus = "PENDING";
    user.activationStatus = "PENDING";
    user.mfaStatus = "NOT_READY";
    user.activity.unshift({ at: now.toISOString(), text: "Undangan aktivasi dikirim ulang", result: "Menunggu" });
    closeDialog();
    navigate({ view: "detail", selectedId: user.id });
    showFeedback(`Undangan baru untuk ${user.name} dibuat dan berlaku 24 jam.`);
  }

  document.addEventListener("click", (event) =>
  {
    const control = event.target.closest("[data-staff-action]");
    if (!control || appState.busy)
    {
      return;
    }
    const action = control.dataset.staffAction;

    if (action === "open-invite")
    {
      renderInviteDialog();
    }
    else if (action === "close-dialog")
    {
      closeDialog();
    }
    else if (action === "detail")
    {
      navigate({ view: "detail", selectedId: control.dataset.userId, detailTab: "overview" });
      window.scrollTo(0, 0);
    }
    else if (action === "back-list")
    {
      navigate({ view: "list", selectedId: "" });
      window.scrollTo(0, 0);
    }
    else if (action === "detail-tab")
    {
      navigate({ detailTab: control.dataset.tab });
      const selectedTab = root.querySelector('.staff-detail-tabs [aria-current="page"]');
      if (selectedTab)
      {
        selectedTab.focus({ preventScroll: true });
        selectedTab.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    }
    else if (action === "segment")
    {
      navigate({ view: "list", segment: control.dataset.segment, page: 1 });
    }
    else if (action === "toggle-filters")
    {
      navigate({ filtersOpen: !appState.filtersOpen });
    }
    else if (action === "apply-filters")
    {
      navigate(
      {
        roleFilter: document.getElementById("staff-role-filter").value,
        accountFilter: document.getElementById("staff-account-filter").value,
        mfaFilter: document.getElementById("staff-mfa-filter").value,
        sort: document.getElementById("staff-sort").value,
        page: 1
      });
    }
    else if (action === "reset-filters")
    {
      navigate(
      {
        search: "",
        segment: "all",
        roleFilter: "all",
        accountFilter: "all",
        mfaFilter: "all",
        sort: "attention",
        page: 1
      });
    }
    else if (action === "reload")
    {
      appState.loadState = "full";
      render();
      showFeedback("Data contoh dimuat kembali. Tidak ada perubahan server yang dijalankan.");
    }
    else if (action === "page")
    {
      navigate({ page: Number(control.dataset.page) || 1 });
    }
    else if (action === "go-dashboard")
    {
      location.assign(`../staff/admin-dashboard.html?role=${appState.role}`);
    }
    else if (action === "reissue" || action === "reset-mfa" || action === "deactivate")
    {
      const user = findUser(control.dataset.userId);
      if (user)
      {
        renderActionDialog(action, user);
      }
    }
  });

  document.addEventListener("submit", (event) =>
  {
    if (event.target.id === "staff-search-form")
    {
      event.preventDefault();
      navigate({ search: event.target.elements.namedItem("search").value.trim(), page: 1 });
    }
    else if (event.target.id === "staff-invite-form")
    {
      event.preventDefault();
      submitInvite(event.target);
    }
    else if (event.target.id === "staff-action-form")
    {
      event.preventDefault();
      submitAction(event.target);
    }
  });

  document.getElementById("staff-profile").addEventListener("change", (event) =>
  {
    appState.role = event.target.value;
    appState.view = "list";
    appState.selectedId = "";
    render();
  });
  document.getElementById("staff-load-state").addEventListener("change", (event) =>
  {
    appState.loadState = event.target.value;
    appState.view = "list";
    render();
  });
  dialog.addEventListener("cancel", () =>
  {
    appState.pendingAction = null;
  });

  window.staffAccountsDemo = Object.freeze(
  {
    snapshot: () => clone({ users, appState })
  });

  render();
})();
