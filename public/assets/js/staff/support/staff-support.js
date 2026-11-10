"use strict";

(() =>
{
  const root = document.getElementById("support-root");
  const dialog = document.getElementById("support-dialog");
  const dialogBody = document.getElementById("support-dialog-body");
  const source = structuredClone(window.staffSupportFixture);
  const pageKind = document.body.dataset.staffPage;
  const pageSize = 5;
  let renderer = null;
  let actions = {};
  let pending = null;
  let initialForm = "";

  function readState()
  {
    const params = new URLSearchParams(location.search);
    return {
      role: params.get("role") === "superadmin"
        || (document.body.dataset.defaultRole === "superadmin" && params.get("role") !== "admin") ? "superadmin" : "admin",
      actor: params.get("actor") === "sa-02" ? "sa-02" : "sa-01",
      tab: params.get("tab") || "profile",
      query: params.get("q") || "",
      filter: params.get("filter") || "all",
      category: params.get("category") || "all",
      sort: params.get("sort") === "attention" ? "attention" : "newest",
      pageIndex: Math.max(1, Number.parseInt(params.get("page"), 10) || 1),
      item: params.get("item") || "",
      correctionSource: params.get("source") || "",
      article: params.get("article") || "",
      condition: ["forbidden", "not-found", "internal-error", "rate-limited", "unavailable", "maintenance", "session-expired"].includes(params.get("state"))
        ? params.get("state") : "not-found",
      destination: ["orders", "products", "materials", "dashboard"].includes(params.get("return"))
        ? params.get("return") : "dashboard",
      load: "full"
    };
  }

  const state = readState();

  function node(tag, className = "", text)
  {
    const element = document.createElement(tag);
    element.className = className;
    if (text !== undefined)
    {
      element.textContent = String(text);
    }
    return element;
  }

  function icon(name)
  {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    svg.setAttribute("class", "icon icon--small");
    svg.setAttribute("aria-hidden", "true");
    use.setAttribute("href", `#i-${name}`);
    svg.append(use);
    return svg;
  }

  function button(label, action, data = {}, className = "queue-button")
  {
    const control = node("button", className, label);
    control.type = "button";
    control.dataset.hubAction = action;
    Object.entries(data).forEach(([key, value]) =>
    {
      control.dataset[key] = value;
    });
    return control;
  }

  function link(label, target, className = "queue-button")
  {
    const control = node("a", className, label);
    const url = new URL(target, location.href);
    url.searchParams.set("role", state.role);
    control.href = url.href;
    return control;
  }

  function badge(label, tone = "info")
  {
    const mark = node("span", `queue-badge queue-badge--${tone}`);
    mark.append(icon(tone === "success" ? "check" : tone === "warning" ? "alert" : "info"), node("span", "", label));
    return mark;
  }

  function banner(title, description, tone = "info", controls = [])
  {
    const area = node("div", `support-banner support-banner--${tone}`);
    const copy = node("div", "support-banner-copy");
    copy.append(node("strong", "", title));
    if (description)
    {
      copy.append(node("p", "", description));
    }
    area.append(icon(tone === "warning" ? "alert" : "info"), copy);
    if (controls.length)
    {
      const actionsArea = node("div", "support-actions");
      actionsArea.append(...controls);
      area.append(actionsArea);
    }
    return area;
  }

  function heading(title, description, controls = [])
  {
    const area = node("div", "report-heading");
    const copy = node("div");
    copy.append(node("h1", "", title), node("p", "", description));
    const actionsArea = node("div", "support-actions");
    actionsArea.append(...controls);
    area.append(copy, actionsArea);
    root.append(area);
  }

  function demoNote()
  {
    root.append(node("p", "report-note", "Pratinjau lokal dengan data contoh. Perubahan hanya berlaku di halaman ini dan hilang saat dimuat ulang."));
  }

  function panel(title, description = "")
  {
    const section = node("section", "support-panel");
    section.append(node("h2", "", title));
    if (description)
    {
      section.append(node("p", "support-meta", description));
    }
    return section;
  }

  function definition(values)
  {
    const list = node("dl", "support-definition");
    values.forEach(([label, value]) =>
    {
      const row = document.createElement("div");
      const detail = node("dd");
      detail.append(value instanceof Node ? value : document.createTextNode(String(value)));
      row.append(node("dt", "", label), detail);
      list.append(row);
    });
    return list;
  }

  function tabs(entries, label = "Bagian profil saya")
  {
    const nav = node("nav", "product-detail-tabs report-tabs");
    nav.setAttribute("aria-label", label);
    entries.forEach(([value, label]) =>
    {
      const control = button(label, "tab", { value }, "");
      if (state.tab === value)
      {
        control.setAttribute("aria-current", "page");
      }
      nav.append(control);
    });
    return nav;
  }

  function field(label, name, control, hint = "", required = false)
  {
    const area = node("div", "report-field");
    const caption = node("label", "", `${label}${required ? " (wajib)" : ""}`);
    control.id = `support-${name}`;
    control.name = name;
    control.required = required;
    caption.htmlFor = control.id;
    area.append(caption, control);
    if (hint)
    {
      const helper = node("small", "", hint);
      helper.id = `${control.id}-help`;
      control.setAttribute("aria-describedby", helper.id);
      area.append(helper);
    }
    return area;
  }

  function input(value = "", type = "text")
  {
    const control = document.createElement("input");
    control.type = type;
    control.value = value;
    return control;
  }

  function passwordField(label, name, hint)
  {
    const control = input("", "password");
    control.maxLength = 128;
    control.autocomplete = "off";
    const area = field(label, name, control, hint, true);
    const group = node("div", "support-password");
    const toggle = button("Tampilkan", "show-password", { target: control.id });
    toggle.setAttribute("aria-label", `Tampilkan ${label.toLocaleLowerCase("id-ID")}`);
    toggle.setAttribute("aria-pressed", "false");
    toggle.dataset.passwordLabel = label.toLocaleLowerCase("id-ID");
    control.replaceWith(group);
    group.append(control, toggle);
    return area;
  }

  function select(entries, value, filterName)
  {
    const control = document.createElement("select");
    entries.forEach(([id, label]) =>
    {
      const option = node("option", "", label);
      option.value = id;
      control.append(option);
    });
    control.value = value;
    if (filterName)
    {
      control.dataset.hubFilter = filterName;
    }
    return control;
  }

  function searchField(placeholder)
  {
    const control = input(state.query, "search");
    control.placeholder = placeholder;
    control.dataset.hubFilter = "query";
    return field("Pencarian", "search", control);
  }

  function pagination(total)
  {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    state.pageIndex = Math.min(state.pageIndex, pages);
    const area = node("div", "report-pagination");
    const start = total ? (state.pageIndex - 1) * pageSize + 1 : 0;
    const count = node("span", "report-muted", `${start}–${Math.min(state.pageIndex * pageSize, total)} dari ${total}`);
    count.setAttribute("role", "status");
    const controls = node("div", "report-pagination-controls");
    const previous = button("", "previous", {}, "icon-button");
    previous.setAttribute("aria-label", "Halaman sebelumnya");
    previous.disabled = state.pageIndex === 1;
    previous.append(icon("chevron"));
    const next = button("", "next", {}, "icon-button");
    next.setAttribute("aria-label", "Halaman berikutnya");
    next.disabled = state.pageIndex >= pages;
    next.append(icon("chevron"));
    controls.append(previous, node("span", "", `${state.pageIndex} dari ${pages}`), next);
    area.append(count, controls);
    return area;
  }

  function date(value)
  {
    return new Intl.DateTimeFormat("id-ID",
    {
      dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta"
    }).format(new Date(value)) + " WIB";
  }

  function account()
  {
    return source.accounts[state.role];
  }

  function syncRole()
  {
    const initials = account().name.trim().split(/\s+/).slice(0, 2)
      .map((word) => word.charAt(0)).join("").toLocaleUpperCase("id-ID");
    document.getElementById("preview-role").textContent = `Pratinjau ${account().role}`;
    document.getElementById("profile-name").textContent = account().name;
    document.querySelectorAll(".report-avatar").forEach((avatar) =>
    {
      avatar.textContent = state.role === "superadmin" ? "SA" : initials;
    });
    document.querySelectorAll("[data-role-link]").forEach((element) =>
    {
      const url = new URL(element.href, location.href);
      url.searchParams.set("role", state.role);
      element.href = url.href;
    });
    document.querySelectorAll("[data-superadmin-only]").forEach((element) =>
    {
      element.hidden = state.role !== "superadmin";
    });
    document.getElementById("support-profile").value = state.role;
    document.getElementById("support-load").value = state.load;
    document.getElementById("support-condition").value = state.condition;
  }

  function writeUrl(push = false)
  {
    const url = new URL(location.href);
    url.search = "";
    const values = { role: state.role };
    if (pageKind === "profile")
    {
      values.tab = state.tab;
    }
    if (["notifications", "help", "reconciliation", "approvals"].includes(pageKind))
    {
      Object.assign(values,
      {
        q: state.query, category: state.category, page: state.pageIndex,
        filter: state.filter, sort: state.sort
      });
      values[pageKind === "help" ? "article" : "item"] = pageKind === "help" ? state.article : state.item;
    }
    if (pageKind === "reconciliation" || pageKind === "approvals")
    {
      values.actor = state.actor;
      values.tab = state.tab;
      if (pageKind === "approvals")
      {
        values.source = state.correctionSource;
      }
    }
    if (pageKind === "status")
    {
      values.state = state.condition;
      values.return = state.destination;
    }
    Object.entries(values).forEach(([key, value]) =>
    {
      if (value !== "")
      {
        url.searchParams.set(key, value);
      }
    });
    history[push ? "pushState" : "replaceState"](null, "", url);
  }

  function render()
  {
    root.replaceChildren();
    syncRole();
    renderer();
    writeUrl();
  }

  function navigate(values, focusHeading = true)
  {
    Object.assign(state, values);
    document.getElementById("support-feedback").hidden = true;
    writeUrl(true);
    render();
    if (focusHeading)
    {
      const title = root.querySelector("h1");
      title.tabIndex = -1;
      title.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }

  function feedback(text, warning = false)
  {
    const area = document.getElementById("support-feedback");
    area.className = `support-banner support-banner--${warning ? "warning" : "success"}`;
    area.textContent = text;
    area.hidden = false;
  }

  function perform(commit, text)
  {
    if (document.getElementById("support-fail").checked)
    {
      feedback("Simulasi simpan gagal. Data belum berubah; matikan simulasi lalu coba lagi.", true);
      return false;
    }
    const focused = document.activeElement;
    const action = focused?.dataset.hubAction;
    const id = focused?.dataset.id;
    commit();
    render();
    feedback(text);
    if (action)
    {
      const selector = `[data-hub-action="${CSS.escape(action)}"]`;
      const exact = id ? root.querySelector(`${selector}[data-id="${CSS.escape(id)}"]:not(:disabled)`) : null;
      const target = exact || root.querySelector(`${selector}:not(:disabled)`)
        || root.querySelector('[data-hub-filter="query"]');
      target?.focus({ preventScroll: Boolean(exact) });
    }
    return true;
  }

  function loadState(emptyTitle = "Belum ada data", emptyDescription = "Tidak ada data pada kondisi pratinjau ini.")
  {
    if (state.load === "full")
    {
      return false;
    }
    const labels =
    {
      loading: ["Memuat data", "Menyiapkan informasi halaman."],
      error: ["Data belum dapat dimuat", "Coba lagi untuk membuka data contoh."],
      empty: [emptyTitle, emptyDescription]
    };
    const area = panel(...labels[state.load]);
    if (state.load === "loading")
    {
      area.setAttribute("aria-busy", "true");
      const skeleton = node("div", "support-skeleton");
      skeleton.setAttribute("aria-hidden", "true");
      for (let index = 0; index < 4; index += 1)
      {
        skeleton.append(node("span"));
      }
      area.append(skeleton);
    }
    else
    {
      const controls = node("div", "support-actions");
      controls.append(button("Muat data contoh", "reload"));
      area.append(controls);
    }
    root.append(area);
    return true;
  }

  function signature()
  {
    const form = dialogBody.querySelector("form");
    return form ? JSON.stringify(Array.from(new FormData(form).entries())) : "";
  }

  function closeDialog(force = false)
  {
    if (!force && signature() !== initialForm)
    {
      dialogBody.querySelector(".support-discard").hidden = false;
      dialogBody.querySelector('[data-hub-action="keep-editing"]').focus();
      return;
    }
    dialog.close();
    dialogBody.replaceChildren();
    document.getElementById("support-dialog-actions").replaceChildren();
    pending = null;
  }

  function showErrors(errors)
  {
    const area = dialogBody.querySelector(".support-errors");
    const list = node("ul");
    errors.forEach((error) => list.append(node("li", "", error)));
    area.replaceChildren(list);
    area.hidden = false;
    area.focus();
  }

  function openDialog(config)
  {
    pending = { ...config, role: state.role };
    document.getElementById("support-dialog-title").textContent = config.title;
    dialogBody.replaceChildren();
    const form = node("form", "support-form");
    form.id = "support-form";
    form.noValidate = true;
    const errors = node("div", "support-errors");
    errors.hidden = true;
    errors.tabIndex = -1;
    errors.setAttribute("role", "alert");
    form.append(errors);
    config.build(form);
    const discard = banner("Perubahan belum disimpan", "Lanjutkan edit atau buang isian untuk menutup dialog.", "warning", [
      button("Lanjutkan edit", "keep-editing"), button("Buang perubahan", "discard")
    ]);
    discard.classList.add("support-discard");
    discard.hidden = true;
    dialogBody.append(form, discard);
    const controls = document.getElementById("support-dialog-actions");
    controls.replaceChildren();
    const submit = node("button", "queue-button queue-button--primary", config.submitLabel || "Simpan");
    submit.type = "submit";
    submit.setAttribute("form", form.id);
    controls.append(button("Batal", "close"), submit);
    initialForm = signature();
    dialog.showModal();
    (form.querySelector("input:not(:disabled), textarea, select") || controls.querySelector("button")).focus();
  }

  function value(form, name, trim = true)
  {
    const text = form.elements.namedItem(name)?.value || "";
    return trim ? text.trim() : text;
  }

  dialogBody.addEventListener("submit", (event) =>
  {
    event.preventDefault();
    if (!pending || pending.role !== state.role)
    {
      return;
    }
    const form = event.target;
    const errors = pending.validate ? pending.validate(form) : [];
    if (errors.length)
    {
      showErrors(errors);
      return;
    }
    if (document.getElementById("support-fail").checked)
    {
      showErrors(["Simulasi simpan gagal. Isian tetap tersedia. Matikan simulasi lalu coba lagi."]);
      return;
    }
    const result = pending.commit(form);
    if (result && Array.isArray(result.errors))
    {
      showErrors(result.errors);
      return;
    }
    closeDialog(true);
    render();
    feedback(result);
    const title = root.querySelector("h1");
    title.tabIndex = -1;
    title.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  });

  document.addEventListener("click", (event) =>
  {
    const control = event.target.closest("[data-hub-action]");
    if (!control || control.disabled)
    {
      return;
    }
    const action = control.dataset.hubAction;
    if (action === "close" || action === "discard")
    {
      closeDialog(action === "discard");
    }
    else if (action === "keep-editing")
    {
      dialogBody.querySelector(".support-discard").hidden = true;
      dialogBody.querySelector("input:not(:disabled), textarea, select")?.focus();
    }
    else if (action === "show-password")
    {
      const inputControl = document.getElementById(control.dataset.target);
      const show = inputControl.type === "password";
      inputControl.type = show ? "text" : "password";
      control.textContent = show ? "Sembunyikan" : "Tampilkan";
      control.setAttribute("aria-label", `${control.textContent} ${control.dataset.passwordLabel}`);
      control.setAttribute("aria-pressed", String(show));
    }
    else if (action === "tab")
    {
      navigate({ tab: control.dataset.value }, false);
      root.querySelector('.report-tabs [aria-current="page"]')?.focus({ preventScroll: true });
    }
    else if (action === "reload")
    {
      navigate({ load: "full" });
    }
    else if (action === "reset")
    {
      navigate({ query: "", filter: "all", category: "all", sort: "newest", pageIndex: 1 }, false);
      root.querySelector('[data-hub-action="reset"]')?.focus({ preventScroll: true });
    }
    else if (action === "previous" || action === "next")
    {
      navigate({ pageIndex: state.pageIndex + (action === "next" ? 1 : -1) }, false);
      root.querySelector(`[data-hub-action="${action}"]:not(:disabled)`)?.focus({ preventScroll: true });
    }
    else if (actions[action])
    {
      actions[action](control, event);
    }
  });

  root.addEventListener("input", (event) =>
  {
    if (event.target.dataset.hubFilter !== "query" || event.isComposing)
    {
      return;
    }
    const cursor = event.target.selectionStart;
    state.query = event.target.value;
    state.pageIndex = 1;
    render();
    const control = root.querySelector('[data-hub-filter="query"]');
    control.focus({ preventScroll: true });
    control.setSelectionRange(cursor, cursor);
  });

  root.addEventListener("change", (event) =>
  {
    const name = event.target.dataset.hubFilter;
    if (!name || name === "query")
    {
      return;
    }
    state[name] = event.target.value;
    state.pageIndex = 1;
    render();
    root.querySelector(`[data-hub-filter="${name}"]`)?.focus({ preventScroll: true });
  });

  document.getElementById("support-profile").addEventListener("change", (event) =>
  {
    navigate({ role: event.target.value, item: "", pageIndex: 1 });
  });
  document.getElementById("support-load").addEventListener("change", (event) =>
  {
    navigate({ load: event.target.value, item: "", article: "" });
  });
  document.getElementById("support-condition").addEventListener("change", (event) =>
  {
    navigate({ condition: event.target.value });
  });
  document.getElementById("support-dialog-close").addEventListener("click", () => closeDialog());
  dialog.addEventListener("cancel", (event) =>
  {
    event.preventDefault();
    closeDialog();
  });
  window.addEventListener("beforeunload", (event) =>
  {
    if (dialog.open && signature() !== initialForm)
    {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  window.addEventListener("popstate", () =>
  {
    if (dialog.open)
    {
      writeUrl(true);
      closeDialog();
      return;
    }
    Object.assign(state, readState());
    render();
    window.scrollTo(0, 0);
  });

  window.staffHub =
  {
    root, state, source, pageSize, node, icon, button, link, badge, banner, heading,
    demoNote, panel, definition, tabs, field, input, passwordField, select, searchField,
    pagination, date, account, navigate, render, feedback, perform, loadState, openDialog, value,
    start(pageRenderer, pageActions = {})
    {
      renderer = pageRenderer;
      actions = pageActions;
      document.getElementById("support-condition-control").hidden = pageKind !== "status";
      document.getElementById("support-load-control").hidden = pageKind === "status";
      document.getElementById("support-fail-control").hidden = pageKind === "help" || pageKind === "status";
      render();
    }
  };
})();
