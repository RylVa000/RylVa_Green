"use strict";

(() =>
{
  document.documentElement.classList.add("js");
  const { groups, parameters } = window.systemParameterData;
  const root = document.getElementById("settings-view");
  const dialog = document.getElementById("settings-dialog");
  const pageSize = 6;
  const activeValues = new Map();
  const revisions = new Map();
  const metadata = new Map();
  const drafts = new Map();
  const entries = [];
  const numberFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
  let state = readState();
  let loadState = "full";
  let editorInitial = null;
  let editorCode = "";
  let pendingNavigation = null;
  let busy = false;
  let allowUnload = false;
  let historySearch = "";
  let historyPage = 1;
  let reviewInput = { reason: "", reference: "", reviewed: false, verification: "" };

  parameters.forEach((item) =>
  {
    activeValues.set(item.code, baseline(item));
    revisions.set(item.code, 1);
  });

  function node(tag, className = "", text = "")
  {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = String(text);
    return element;
  }

  function icon(name)
  {
    const element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    element.setAttribute("class", "icon icon--small");
    element.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(element.namespaceURI, "use");
    use.setAttribute("href", `#i-${name}`);
    element.append(use);
    return element;
  }

  function button(label, action, data = {}, primary = false)
  {
    const element = node("button", `queue-button${primary ? " queue-button--primary" : ""}`, label);
    element.type = "button";
    element.dataset.settingsAction = action;
    Object.assign(element.dataset, data);
    return element;
  }

  function badge(label, tone = "neutral", mark = "info")
  {
    const element = node("span", `queue-badge queue-badge--${tone} settings-badge`);
    element.append(icon(mark), node("span", "", label));
    return element;
  }

  function notice(copy, warning = false)
  {
    const element = node("div", `product-note${warning ? " product-note--warning" : ""}`);
    element.append(icon(warning ? "alert" : "info"), node("p", "", copy));
    return element;
  }

  function panel(title, copy = "")
  {
    const element = node("section", "product-panel settings-panel");
    element.append(node("h2", "", title));

    if (copy)
    {
      element.append(node("p", "secondary-text", copy));
    }

    return element;
  }

  function baseline(item)
  {
    return Object.fromEntries(item.fields.map((field) => [field.key, field.value]));
  }

  function same(left, right)
  {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  function clone(value)
  {
    return structuredClone(value);
  }

  function parameter(code)
  {
    return parameters.find((item) => item.code === code);
  }

  function time(value)
  {
    return new Intl.DateTimeFormat("id-ID",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Jakarta"
    }).format(new Date(value)) + " WIB";
  }

  function formattedValue(field, value)
  {
    if (field.type === "boolean")
    {
      return value ? "Wajib" : "Tidak";
    }

    if (field.unit === "rupiah")
    {
      return `Rp${numberFormat.format(value)}`;
    }

    const text = field.type === "number" ? numberFormat.format(value) : value;
    return `${text}${field.unit ? ` ${field.unit}` : ""}`;
  }

  function summary(item, values)
  {
    if (item.code === "P-08")
    {
      return `${values.morningStart}–${values.eveningEnd} WIB, 3 slot`;
    }

    if (item.code === "P-09")
    {
      return `${values.open}–${values.close} WIB`;
    }

    if (item.code === "P-41")
    {
      return "15 aturan, batas per akun dan IP";
    }

    if (item.code === "P-05")
    {
      return `${values.perProduct} unit/produk; ${values.perOrder} unit/pesanan`;
    }

    return item.fields.slice(0, 2).map((field) => formattedValue(field, values[field.key])).join(" / ")
      + (item.fields.length > 2 ? `; +${item.fields.length - 2} ketentuan` : "");
  }

  function readState()
  {
    const params = new URLSearchParams(location.search);
    const choose = (key, allowed, fallback) => allowed.includes(params.get(key)) ? params.get(key) : fallback;
    return {
      role: choose("role", ["admin", "superadmin"], "superadmin"),
      view: choose("view", ["list", "editor", "review", "history"], "list"),
      group: choose("group", ["all", ...groups.map((group) => group.id)], "all"),
      segment: choose("segment", ["all", "draft", "sensitive", "readonly"], "all"),
      search: (params.get("search") || "").slice(0, 150),
      code: params.get("parameter") || "",
      page: Math.max(1, Number.parseInt(params.get("page"), 10) || 1)
    };
  }

  function writeUrl()
  {
    const params = new URLSearchParams({ role: state.role });

    for (const key of ["view", "group", "segment", "search", "page"])
    {
      if (!["list", "all", "", 1].includes(state[key]))
      {
        params.set(key, state[key]);
      }
    }

    if (state.view === "editor")
    {
      params.set("parameter", state.code);
    }

    history.replaceState(null, "", `${location.pathname}?${params}${location.hash}`);
  }

  function feedback(message, error = false)
  {
    const element = document.getElementById("settings-feedback");
    element.className = `product-feedback${error ? " product-feedback--error" : ""}`;
    element.replaceChildren(icon(error ? "alert" : "check"), node("p", "", message));
    element.hidden = false;
    element.focus({ preventScroll: false });
  }

  function clearFeedback()
  {
    document.getElementById("settings-feedback").hidden = true;
  }

  function editorValues()
  {
    const item = parameter(editorCode);
    const form = document.getElementById("settings-editor-form");

    if (!item || !form)
    {
      return null;
    }

    return Object.fromEntries(item.fields.map((field) =>
    {
      const input = form.elements.namedItem(field.key);
      const value = field.type === "boolean" ? input.checked
        : field.type === "number" ? input.valueAsNumber : input.value;
      return [field.key, value];
    }));
  }

  function editorDirty()
  {
    const current = editorValues();
    return current !== null && !same(current, editorInitial);
  }

  function navigate(nextState, force = false)
  {
    if (busy)
    {
      return;
    }

    if (!force && editorDirty())
    {
      pendingNavigation = () => navigate(nextState, true);
      openDialog(
        "Isian belum ditambahkan",
        "Isian editor belum masuk ke draf. Buang isian ini dan lanjutkan?",
        "Buang isian"
      );
      return;
    }

    state = { ...state, ...nextState };
    editorCode = "";
    editorInitial = null;
    clearFeedback();
    writeUrl();
    render();
    document.getElementById("main-content").focus({ preventScroll: false });
  }

  function openDialog(title, copy, confirm)
  {
    document.getElementById("settings-dialog-title").textContent = title;
    document.getElementById("settings-dialog-copy").textContent = copy;
    document.getElementById("settings-dialog-confirm").textContent = confirm;
    dialog.showModal();
  }

  function currentValues(code)
  {
    return drafts.get(code)?.values || activeValues.get(code);
  }

  function selectedItems()
  {
    const words = state.search.toLocaleLowerCase("id-ID").trim().split(/\s+/).filter(Boolean);
    return parameters.filter((item) =>
    {
      const text = `${item.code} ${item.key} ${item.name} ${item.description}`.toLocaleLowerCase("id-ID");
      return (state.group === "all" || item.group === state.group) && words.every((word) => text.includes(word));
    });
  }

  function segmentMatches(item)
  {
    return state.segment === "all"
      || (state.segment === "draft" && drafts.has(item.code))
      || (state.segment === "sensitive" && item.sensitive)
      || (state.segment === "readonly" && item.readonly);
  }

  function renderChrome()
  {
    const superadmin = state.role === "superadmin";
    document.getElementById("preview-role").textContent = superadmin ? "Pratinjau SuperAdmin" : "Pratinjau Admin";
    document.getElementById("profile-name").textContent = superadmin ? "SuperAdmin RylVa" : "Admin RylVa";
    document.getElementById("settings-profile").value = state.role;
    document.getElementById("settings-load-state").value = loadState;
    document.querySelectorAll("[data-superadmin-only]").forEach((element) => element.hidden = !superadmin);
    document.querySelectorAll("[data-role-link]").forEach((link) =>
    {
      const url = new URL(link.href);
      url.searchParams.set("role", state.role);
      link.href = url.href;
    });

    const actions = document.getElementById("settings-heading-actions");
    actions.replaceChildren();

    if (superadmin)
    {
      const reload = button("Muat ulang", "reload");
      reload.prepend(icon("refresh"));
      const review = button(`Tinjau perubahan (${drafts.size})`, "review", {}, true);
      review.disabled = drafts.size === 0 || busy;
      review.prepend(icon("check"));
      actions.append(reload, review);
    }

    const tabs = document.getElementById("settings-tabs");
    tabs.hidden = !superadmin;
    tabs.replaceChildren();

    for (const [view, label] of [["list", "Parameter"], ["history", `Riwayat perubahan (${entries.length})`]])
    {
      const tab = button(label, view);

      if ((view === "list" && state.view !== "history") || state.view === view)
      {
        tab.setAttribute("aria-current", "page");
      }

      tabs.append(tab);
    }
  }

  function renderState(title, copy, actionLabel = "", action = "reload")
  {
    const section = panel(title, copy);
    section.classList.add("settings-empty");

    if (actionLabel)
    {
      section.append(button(actionLabel, action));
    }

    root.append(section);
  }

  function render()
  {
    renderChrome();
    root.replaceChildren();
    root.setAttribute("aria-busy", String(loadState === "loading"));

    if (state.role !== "superadmin")
    {
      renderState("Akses khusus SuperAdmin", "Admin tidak memiliki kewenangan membuka atau mengubah parameter sistem.");
      const link = node("a", "queue-button", "Kembali ke Operasional");
      link.href = "../staff/admin-dashboard.html?role=admin";
      root.firstElementChild.append(link);
      return;
    }

    if (loadState !== "full")
    {
      if (loadState === "loading")
      {
        renderState("Memuat parameter", "Nilai aktif sedang dimuat. Draf lokal tetap tersedia.");
        const skeleton = node("div", "settings-skeleton");
        skeleton.setAttribute("aria-hidden", "true");

        for (let index = 0; index < 4; index++)
        {
          skeleton.append(node("div"));
        }

        root.firstElementChild.append(skeleton, button("Selesaikan simulasi muat", "reload"));
      }
      else if (loadState === "error")
      {
        renderState(
          "Parameter gagal dimuat",
          "Nilai aktif belum dapat ditampilkan. Draf lokal tidak dihapus; coba muat kembali.",
          "Coba lagi"
        );
      }
      else
      {
        renderState(
          "Belum ada parameter",
          "Register belum tersedia pada kondisi contoh ini. Muat baseline untuk mencoba alur pengaturan.",
          "Muat baseline contoh"
        );
      }

      return;
    }

    if (state.view === "editor")
    {
      renderEditor();
    }
    else if (state.view === "review")
    {
      renderReview();
    }
    else if (state.view === "history")
    {
      renderHistory();
    }
    else
    {
      renderList();
    }

    window.adminControls?.enhanceSelects();
  }

  function renderSegments()
  {
    const selected = selectedItems();
    const summaryRow = node("div", "queue-tabs settings-summary");
    const segments =
    [
      ["all", "Semua parameter", selected.length],
      ["draft", "Draf belum disimpan", selected.filter((item) => drafts.has(item.code)).length],
      ["sensitive", "Pengaturan sensitif", selected.filter((item) => item.sensitive).length],
      ["readonly", "Hanya baca", selected.filter((item) => item.readonly).length]
    ];

    segments.forEach(([segment, label, count]) =>
    {
      const control = button("", "segment", { segment });
      control.className = "queue-tab";
      control.setAttribute("aria-pressed", String(state.segment === segment));
      control.append(node("span", "", label), node("strong", "num", count));
      summaryRow.append(control);
    });

    root.append(summaryRow);
  }

  function renderList()
  {
    renderSegments();
    const layout = node("div", "settings-layout");
    const navigation = node("aside", "settings-groups");
    navigation.append(node("h2", "", "Kelompok pengaturan"));
    const mobileGroup = node("div", "product-field settings-mobile-group");
    const mobileLabel = node("label", "", "Kelompok pengaturan");
    mobileLabel.htmlFor = "settings-group-select";
    const mobileSelect = node("select");
    mobileSelect.id = mobileLabel.htmlFor;

    [{ id: "all", label: "Semua kelompok" }, ...groups].forEach((group) =>
    {
      const option = node("option", "", group.label);
      option.value = group.id;
      mobileSelect.append(option);
    });

    mobileSelect.value = state.group;
    mobileSelect.addEventListener("change", () => navigate({ group: mobileSelect.value, page: 1 }));
    mobileGroup.append(mobileLabel, mobileSelect);
    navigation.append(mobileGroup);
    const nav = node("nav", "", "");
    nav.setAttribute("aria-label", "Kelompok pengaturan");

    [{ id: "all", label: "Semua kelompok", icon: "settings" }, ...groups].forEach((group) =>
    {
      const control = button("", "group", { group: group.id });
      control.className = "settings-group";
      control.append(icon(group.icon), node("span", "", group.label));

      if (state.group === group.id)
      {
        control.setAttribute("aria-current", "true");
      }

      nav.append(control);
    });

    navigation.append(nav);
    const help = node("div", "settings-group-help");
    help.append(icon("info"), node("p", "", "Nilai aktif tetap dipakai sampai draf ditinjau dan disimpan."));
    navigation.append(help);
    const sheet = node("section", "product-panel settings-sheet");
    const heading = node("div", "settings-sheet-heading");
    const group = groups.find((item) => item.id === state.group);
    heading.append(node("h2", "", group?.label || "Seluruh parameter"));
    heading.append(node(
      "p",
      "secondary-text",
      group?.description || "Telusuri nilai aktif, lalu buka parameter yang ingin diubah."
    ));
    const form = node("form", "settings-toolbar");
    form.id = "settings-search-form";
    const searchField = node("div", "product-field");
    const searchLabel = node("label", "", "Cari parameter");
    searchLabel.htmlFor = "settings-search";
    const search = node("input");
    search.id = "settings-search";
    search.name = "search";
    search.type = "search";
    search.maxLength = 150;
    search.placeholder = "Nama, kode P-18, atau kata kunci";
    search.value = state.search;
    searchField.append(searchLabel, search);
    const submit = button("Cari", "search");
    submit.type = "submit";
    form.append(searchField, submit);
    const filtered = selectedItems().filter(segmentMatches);
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    state.page = Math.min(state.page, pages);
    const meta = node("div", "settings-list-meta");
    meta.append(node("p", "", `${filtered.length} parameter ditemukan`));

    if (state.search || state.segment !== "all" || state.group !== "all")
    {
      meta.append(button("Hapus filter", "reset"));
    }

    sheet.append(heading, form, meta);

    if (!filtered.length)
    {
      const empty = node("div", "settings-no-results");
      empty.append(node("h3", "", state.segment === "draft" ? "Belum ada draf" : "Parameter tidak ditemukan"));
      empty.append(node("p", "secondary-text", state.segment === "draft"
        ? "Buka parameter dan tambahkan nilai usulan untuk mulai meninjau perubahan."
        : "Coba kata kunci lain atau hapus filter untuk melihat seluruh register."));
      empty.append(button("Lihat semua parameter", "reset"));
      sheet.append(empty);
    }
    else
    {
      sheet.append(renderParameterTable(filtered.slice((state.page - 1) * pageSize, state.page * pageSize)));
      sheet.append(pagination(state.page, pages, filtered.length, "page"));
    }

    layout.append(navigation, sheet);
    root.append(layout);
  }

  function renderParameterTable(items)
  {
    const table = node("table", "settings-table");
    const caption = node("caption", "sr-only", "Nilai aktif dan status parameter sistem");
    const head = node("thead");
    const row = node("tr");

    ["Parameter", "Nilai aktif", "Status", "Tindakan"].forEach((label) =>
    {
      const cell = node("th", "", label);
      cell.scope = "col";
      row.append(cell);
    });

    head.append(row);
    const body = node("tbody");

    items.forEach((item) =>
    {
      const row = node("tr");
      row.dataset.parameterCode = item.code;
      const name = node("td", "settings-parameter-name");
      name.dataset.label = "Parameter";
      const labels = node("div", "settings-inline settings-code");
      labels.append(node("span", "", item.code));

      if (item.sensitive && !item.readonly)
      {
        const mark = node("span", "settings-inline");
        mark.append(icon("shield"), node("span", "", "Sensitif"));
        labels.append(mark);
      }

      name.append(node("strong", "", item.name), labels);
      const value = node("td", "settings-value");
      value.dataset.label = "Nilai aktif";
      value.append(node("strong", "num", summary(item, activeValues.get(item.code))));
      const info = metadata.get(item.code);
      value.append(node("small", "secondary-text", info ? `Diubah ${time(info.at)}` : "Baseline v2.6"));
      const status = node("td", "settings-status");
      status.dataset.label = "Status";

      if (drafts.has(item.code))
      {
        status.append(badge("Ada draf", "warning", "edit"));
      }
      else if (item.readonly)
      {
        status.append(badge("Hanya baca", "neutral", "lock"));
      }
      else if (!same(activeValues.get(item.code), baseline(item)))
      {
        status.append(badge("Diubah", "info", "check"));
      }
      else
      {
        status.append(badge("Baseline", "neutral", "check"));
      }

      const action = node("td", "settings-row-action");
      action.dataset.label = "Tindakan";
      const open = button(item.readonly ? "Detail" : "Buka", "edit", { code: item.code });
      open.setAttribute("aria-label", `${item.readonly ? "Lihat" : "Buka"} ${item.code}, ${item.name}`);
      open.append(icon("chevron"));
      action.append(open);
      row.append(name, value, status, action);
      body.append(row);
    });

    table.append(caption, head, body);
    return table;
  }

  function pagination(page, pages, total, action)
  {
    const element = node("div", "settings-pagination");
    const start = total ? (page - 1) * pageSize + 1 : 0;
    const end = Math.min(page * pageSize, total);
    element.append(node("span", "", `${start}–${end} dari ${total}`));
    const controls = node("div", "settings-inline");
    const previous = button("", action, { page: String(page - 1) });
    previous.append(icon("chevron"));
    previous.className = "icon-button settings-previous";
    previous.setAttribute("aria-label", "Halaman sebelumnya");
    previous.disabled = page <= 1;
    const next = button("", action, { page: String(page + 1) });
    next.className = "icon-button";
    next.append(icon("chevron"));
    next.setAttribute("aria-label", "Halaman berikutnya");
    next.disabled = page >= pages;
    controls.append(previous, node("span", "", `${page} dari ${pages}`), next);
    element.append(controls);
    return element;
  }

  function valueList(item, values, previous = null)
  {
    const list = node("dl", "settings-definition");

    item.fields.forEach((field) =>
    {
      const row = node("div");
      row.append(node("dt", "", field.label), node("dd", "num", formattedValue(field, values[field.key])));

      if (previous && previous[field.key] !== values[field.key])
      {
        row.classList.add("settings-changed");
        row.lastElementChild.append(node("small", "", "Berubah"));
      }

      list.append(row);
    });

    return list;
  }

  function renderEditor()
  {
    const item = parameter(state.code);

    if (!item)
    {
      renderState(
        "Parameter tidak tersedia",
        "Kode parameter tidak ditemukan pada register. Kembali untuk memilih parameter yang tersedia.",
        "Kembali ke parameter",
        "list"
      );
      return;
    }

    editorCode = item.code;
    editorInitial = clone(currentValues(item.code));
    const back = button("Kembali ke parameter", "list");
    back.className = "queue-text-button back-button";
    back.prepend(icon("chevron"));
    root.append(back);
    const heading = node("div", "settings-detail-heading");
    heading.append(node("h2", "", item.name));
    const marks = node("div", "settings-inline");
    marks.append(node("span", "settings-code", item.code));
    marks.append(item.readonly ? badge("Hanya baca", "neutral", "lock")
      : item.sensitive ? badge("Sensitif", "warning", "shield") : badge("Operasional", "neutral", "settings"));
    heading.append(marks);
    root.append(heading);
    const layout = node("div", "settings-editor-layout");
    const section = panel(item.readonly ? "Nilai kebijakan" : "Nilai usulan", item.description);

    if (item.readonly)
    {
      section.append(valueList(item, activeValues.get(item.code)));
      section.append(notice(`Dikelola oleh ${item.owner}. `
        + "Perubahan mengikuti review teknis dan ADR; tidak dapat disimpan dari editor operasional."));
    }
    else
    {
      if (drafts.has(item.code) && drafts.get(item.code).revision !== revisions.get(item.code))
      {
        section.append(notice(
          "Versi aktif berubah sejak draf dibuat. Bandingkan dengan Nilai aktif, lalu tambahkan ulang draf untuk memakai versi terbaru.",
          true
        ));
      }

      const form = node("form", "settings-editor-form");
      form.id = "settings-editor-form";
      form.noValidate = true;
      const errors = node("div", "settings-errors");
      errors.id = "settings-editor-errors";
      errors.setAttribute("role", "alert");
      errors.tabIndex = -1;
      errors.hidden = true;
      form.append(errors);
      const fields = node("div", "product-fields settings-fields");
      item.fields.forEach((field) => fields.append(renderField(item, field)));
      form.append(fields);

      if (item.linked)
      {
        const links = node("div", "settings-linked");
        links.append(node("p", "secondary-text", "Batas terkait yang dikelola pada parameter lain:"));

        item.linked.forEach((code) => links.append(button(`${code}: ${parameter(code).name}`, "edit", { code })));
        form.append(links);
      }

      const preview = node("div", "settings-output");
      preview.id = "settings-output";
      preview.setAttribute("aria-live", "polite");
      const actions = node("div", "settings-form-actions");
      const stage = button("Tambahkan ke draf", "stage", {}, true);
      stage.type = "submit";
      stage.id = "settings-stage";
      actions.append(button("Batal", "list"), stage);
      form.append(preview, actions);
      section.append(form);
    }

    const context = node("aside", "settings-context");
    const impact = panel("Dampak perubahan");
    impact.append(node("p", "", item.effect));
    impact.append(node("p", "settings-help", item.review
      ? "Perubahan kebijakan ini memerlukan referensi CR/ADR, peninjauan, dan pengujian sebelum penerapan."
      : "Setiap perubahan tetap membutuhkan alasan dan referensi CR/ADR sebelum disimpan."));

    if (item.related)
    {
      const link = node("a", "queue-button", item.relatedLabel);
      link.href = `${item.related}?role=superadmin`;
      impact.append(link);
    }

    const live = panel("Nilai aktif");
    live.append(valueList(item, activeValues.get(item.code)));
    const info = metadata.get(item.code);
    live.append(node("p", "settings-help", info
      ? `${info.actor}, ${time(info.at)}. Alasan: ${info.reason}` : "Baseline v2.6. Belum ada perubahan lokal."));
    const baselineDetails = node("details", "settings-baseline");
    baselineDetails.append(node("summary", "", "Lihat nilai baseline v2.6"));
    baselineDetails.append(valueList(item, baseline(item)));

    if (!item.readonly)
    {
      baselineDetails.append(button("Gunakan baseline sebagai usulan", "baseline", { code: item.code }));
    }

    live.append(baselineDetails);
    context.append(impact, live);
    layout.append(section, context);
    root.append(layout);

    if (!item.readonly)
    {
      updateEditorPreview();
    }
  }

  function renderField(item, field)
  {
    const wrapper = node("div", "product-field");
    const id = `settings-${item.code}-${field.key}`;
    const label = node("label", "", field.label);
    label.htmlFor = id;
    const input = node("input");
    input.id = id;
    input.name = field.key;
    input.type = field.type === "boolean" ? "checkbox" : field.type;
    input.disabled = Boolean(field.fixed);

    if (field.type === "boolean")
    {
      input.checked = editorInitial[field.key];
    }
    else
    {
      input.value = editorInitial[field.key];
      input.required = true;

      if (field.type === "number")
      {
        input.min = field.min;
        input.step = field.step;

        if (field.max !== undefined)
        {
          input.max = field.max;
        }
      }
    }

    const control = node("div", "settings-input-unit");
    control.append(input);

    if (field.unit)
    {
      control.append(node("span", "", field.unit));
    }

    const help = node("small", "product-help");
    help.id = `${id}-help`;
    const current = formattedValue(field, activeValues.get(item.code)[field.key]);
    help.textContent = `Aktif: ${current}.${field.fixed ? " Ketentuan tetap; perlu perubahan teknis untuk mengubahnya." : ""}`;
    input.setAttribute("aria-describedby", help.id);
    wrapper.append(label, control, help);
    return wrapper;
  }

  function updateEditorPreview()
  {
    const item = parameter(editorCode);
    const values = editorValues();
    const output = document.getElementById("settings-output");

    if (!item || !values || !output)
    {
      return;
    }

    const errors = validateParameter(item, values);
    output.replaceChildren(node("strong", "", "Pratinjau kebijakan"));
    output.append(node("p", "", errors.length
      ? "Lengkapi nilai yang valid untuk melihat kebijakan usulan."
      : `${item.name}: ${summary(item, values)}.`));
    const count = item.fields.filter((field) => values[field.key] !== activeValues.get(item.code)[field.key]).length;
    output.append(node("small", "secondary-text", `${count} ketentuan berbeda dari nilai aktif. Belum disimpan.`));
    document.getElementById("settings-stage").disabled = count === 0 && !drafts.has(item.code);
  }

  function validateParameter(item, values)
  {
    const errors = [];

    function add(key, message)
    {
      errors.push({ code: item.code, key, message });
    }

    item.fields.forEach((field) =>
    {
      const value = values[field.key];

      if (field.fixed && value !== field.value)
      {
        add(field.key, `${field.label} merupakan ketentuan tetap.`);
      }

      if (field.type === "number")
      {
        if (!Number.isFinite(value) || value < field.min || (field.step === 1 && !Number.isSafeInteger(value)))
        {
          add(field.key, `${field.label}: isi ${field.step === 1 ? "bilangan bulat" : "angka"} minimal ${field.min}.`);
        }
        else if (field.max !== undefined && value > field.max)
        {
          add(field.key, `${field.label}: maksimum ${field.max} ${field.unit}.`);
        }
        else if (field.step !== 1 && Math.abs(value / field.step - Math.round(value / field.step)) > 0.000001)
        {
          add(field.key, `${field.label}: gunakan kelipatan ${field.step}.`);
        }
      }
      else if (field.type === "time" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value))
      {
        add(field.key, `${field.label}: isi jam yang valid dalam WIB.`);
      }
    });

    if (item.code === "P-05" && values.perProduct > values.perOrder)
    {
      add("perProduct", "Batas per produk tidak boleh melebihi batas total per pesanan.");
    }

    if (item.code === "P-08")
    {
      const ordered = [values.morningStart, values.morningEnd, values.afternoonStart,
        values.afternoonEnd, values.eveningStart, values.eveningEnd];

      if (ordered.some((value, index) => index > 0 && (index % 2 === 1
        ? value <= ordered[index - 1] : value < ordered[index - 1])))
      {
        add("morningStart", "Slot harus berurutan, awal sebelum akhir, dan tidak tumpang tindih.");
      }
    }

    if (item.code === "P-09" && values.open >= values.close)
    {
      add("close", "Jam tutup harus setelah jam buka pada hari yang sama.");
    }

    if (item.code === "P-27" && values.complaintMin > values.complaintMax)
    {
      add("complaintMin", "Minimum foto tidak boleh melebihi maksimum foto komplain.");
    }

    if (item.code === "P-28" && values.staffMin < values.customerMin)
    {
      add("staffMin", "Panjang minimum staf tidak boleh lebih rendah daripada pelanggan.");
    }

    if (item.code === "P-31" && values.captchaAt > values.failures)
    {
      add("captchaAt", "CAPTCHA harus muncul paling lambat saat batas kegagalan tercapai.");
    }

    if (item.code === "P-32")
    {
      if (values.adminIdleMinutes > values.adminAbsoluteHours * 60
        || values.superadminIdleMinutes > values.superadminAbsoluteHours * 60)
      {
        add("adminIdleMinutes", "Batas idle tidak boleh melebihi durasi absolut sesi per peran.");
      }

      if (values.superadminIdleMinutes > values.adminIdleMinutes
        || values.superadminAbsoluteHours > values.adminAbsoluteHours)
      {
        add("superadminIdleMinutes", "Masa sesi SuperAdmin harus paling ketat: tidak melebihi masa sesi Admin.");
      }
    }

    if (item.code === "P-41")
    {
      if (values.registerHour > values.registerDay || values.staffCaptchaAt > values.staffAccount15m)
      {
        add("registerHour", "Batas registrasi per jam harus ≤ per hari; CAPTCHA staf harus muncul sebelum batas kegagalan.");
      }
    }

    return errors;
  }

  function validateDrafts()
  {
    const errors = [];
    drafts.forEach((draft, code) =>
    {
      const item = parameter(code);

      if (!item || item.readonly)
      {
        errors.push({ code, message: "Parameter hanya baca tidak dapat diubah." });
        return;
      }

      errors.push(...validateParameter(item, draft.values));

      if (draft.revision !== revisions.get(code))
      {
        errors.push({
          code,
          message: "Nilai aktif berubah sejak draf dibuat. Buka kembali dan gunakan nilai terbaru sebelum menyimpan."
        });
      }
    });

    const slots = currentValues("P-08");
    const hours = currentValues("P-09");

    if ((drafts.has("P-08") || drafts.has("P-09"))
      && (slots.morningStart < hours.open || slots.eveningEnd > hours.close))
    {
      errors.push({
        code: "P-08",
        message: "Seluruh slot harus berada dalam jam toko (P-09). Sesuaikan kedua parameter dalam satu draf."
      });
    }

    if ((drafts.has("P-06") || drafts.has("P-07"))
      && currentValues("P-06").durableDays > currentValues("P-07").days)
    {
      errors.push({ code: "P-06", message: "Waktu persiapan produk Tahan Lama melebihi batas pemesanan di muka (P-07)." });
    }

    if ((drafts.has("P-27") || drafts.has("P-42"))
      && currentValues("P-27").complaintMax > currentValues("P-42").complaintFiles)
    {
      errors.push({ code: "P-27", message: "Maksimum foto komplain melebihi batas unggahan P-42." });
    }

    if ((drafts.has("P-03") || drafts.has("P-41"))
      && currentValues("P-03").attempts > currentValues("P-41").paymentHour)
    {
      errors.push({ code: "P-03", message: "Percobaan per pesanan melebihi batas pembayaran per akun per jam pada P-41." });
    }

    return errors;
  }

  function showErrors(element, errors)
  {
    element.replaceChildren(node("strong", "", "Periksa perubahan berikut"));
    const list = node("ul");
    errors.forEach((error) =>
    {
      const row = node("li", "", `${error.code}: ${error.message}`);

      if (element.id === "settings-review-errors" && parameter(error.code))
      {
        row.append(button("Buka parameter", "edit", { code: error.code }));
      }

      list.append(row);
    });
    element.append(list);
    element.hidden = !errors.length;
    element.focus();
  }

  function stageEditor()
  {
    const item = parameter(editorCode);

    if (state.role !== "superadmin" || !item || item.readonly || busy)
    {
      return;
    }

    const values = editorValues();
    const errors = validateParameter(item, values);
    const form = document.getElementById("settings-editor-form");
    form.querySelectorAll("[aria-invalid]").forEach((input) => input.removeAttribute("aria-invalid"));

    if (errors.length)
    {
      errors.forEach((error) => form.elements.namedItem(error.key)?.setAttribute("aria-invalid", "true"));
      showErrors(document.getElementById("settings-editor-errors"), errors);
      return;
    }

    const unchanged = same(values, activeValues.get(item.code));

    if (unchanged)
    {
      drafts.delete(item.code);
    }
    else
    {
      drafts.set(item.code,
      {
        values: clone(values),
        revision: revisions.get(item.code),
        before: clone(activeValues.get(item.code))
      });
    }

    navigate({ view: "list", code: "" }, true);
    feedback(unchanged ? `${item.code} kembali sama dengan nilai aktif dan dikeluarkan dari draf.`
      : `${item.code} ditambahkan ke draf. Nilai aktif belum berubah. Tinjau perubahan untuk menyimpan.`);
  }

  function renderReview()
  {
    const back = button("Kembali ke parameter", "list");
    back.className = "queue-text-button back-button";
    back.prepend(icon("chevron"));
    root.append(back);

    if (!drafts.size)
    {
      renderState(
        "Belum ada perubahan",
        "Tambahkan nilai usulan dari editor parameter sebelum meninjau perubahan.",
        "Pilih parameter",
        "list"
      );
      return;
    }

    const header = node("div", "settings-review-heading");
    header.append(node("h2", "", "Tinjau perubahan"));
    header.append(badge(`${drafts.size} parameter belum disimpan`, "warning", "edit"));
    root.append(header);
    root.append(notice("Penyimpanan menerapkan seluruh draf sekaligus. "
      + "Nilai aktif dan audit contoh berubah bersama; modul lain tetap belum terhubung."));
    const layout = node("div", "settings-review-layout");
    const changes = node("div", "settings-review-changes");

    drafts.forEach((draft, code) =>
    {
      const item = parameter(code);
      const section = panel(`${code}: ${item.name}`);
      const compare = node("div", "settings-compare");
      const before = node("div");
      before.append(node("h3", "", "Aktif sekarang"), valueList(item, activeValues.get(code)));
      const after = node("div");
      after.append(node("h3", "", "Usulan draf"), valueList(item, draft.values, activeValues.get(code)));
      compare.append(before, after);
      const actions = node("div", "settings-inline settings-change-actions");
      actions.append(button("Edit draf", "edit", { code }), button("Hapus dari draf", "remove-draft", { code }));
      section.append(compare, node("p", "settings-help", item.effect), actions);
      changes.append(section);
    });

    const confirmation = panel("Alasan & konfirmasi");
    const form = node("form", "settings-confirm-form");
    form.id = "settings-review-form";
    form.noValidate = true;
    const errors = node("div", "settings-errors");
    errors.id = "settings-review-errors";
    errors.tabIndex = -1;
    errors.setAttribute("role", "alert");
    errors.hidden = true;
    form.append(errors);
    form.append(reviewField(
      "reason",
      "Alasan perubahan",
      "textarea",
      "Jelaskan kebutuhan dan dampak perubahan, 5–500 karakter."
    ));
    form.append(reviewField(
      "reference",
      "Referensi CR / ADR",
      "text",
      "Nomor atau judul catatan perubahan dan hasil pengujiannya."
    ));
    const needsReview = [...drafts.keys()].some((code) => parameter(code).review);
    const sensitive = [...drafts.keys()].some((code) => parameter(code).sensitive);

    if (needsReview)
    {
      const check = node("label", "product-check settings-review-check");
      const input = node("input");
      input.type = "checkbox";
      input.name = "reviewed";
      input.checked = reviewInput.reviewed;
      check.append(
        input,
        node("span", "", "Dampak telah ditinjau dan pengujian perubahan telah dicatat pada referensi di atas.")
      );
      form.append(check);
    }

    if (sensitive)
    {
      form.append(reviewField(
        "verification",
        "Konfirmasi tindakan sensitif",
        "text",
        "Simulasi MFA: masukkan 123456. Jangan gunakan kode MFA atau kata sandi asli."
      ));
    }

    form.append(node(
      "p",
      "settings-help",
      "Konfirmasi dan referensi pada prototipe ini adalah simulasi proses, bukan bukti persetujuan atau pengujian produksi."
    ));
    const actions = node("div", "settings-confirm-actions");
    const save = button("Simpan perubahan lokal", "save", {}, true);
    save.type = "submit";
    save.id = "settings-save";
    const discard = button("Buang seluruh draf", "discard");
    actions.append(save, discard);
    form.append(actions);
    confirmation.append(form);
    layout.append(changes, confirmation);
    root.append(layout);
    const validation = validateDrafts();

    if (validation.length)
    {
      showErrors(errors, validation);
      save.disabled = true;
    }
  }

  function reviewField(key, labelText, type, helpText)
  {
    const wrapper = node("div", "product-field");
    const label = node("label", "", labelText);
    label.htmlFor = `settings-review-${key}`;
    const input = node(type === "textarea" ? "textarea" : "input");
    input.id = label.htmlFor;
    input.name = key;
    input.value = reviewInput[key];
    input.required = true;
    input.maxLength = key === "reason" ? 500 : key === "verification" ? 6 : 150;

    if (type !== "textarea")
    {
      input.type = type;
    }

    if (key === "verification")
    {
      input.inputMode = "numeric";
      input.autocomplete = "off";
    }

    const help = node("small", "product-help", helpText);
    help.id = `${input.id}-help`;
    input.setAttribute("aria-describedby", help.id);
    wrapper.append(label, input, help);
    return wrapper;
  }

  async function saveChanges()
  {
    if (busy || state.role !== "superadmin" || !drafts.size)
    {
      return;
    }

    const errors = validateDrafts();
    const needsReview = [...drafts.keys()].some((code) => parameter(code).review);
    const sensitive = [...drafts.keys()].some((code) => parameter(code).sensitive);

    if (reviewInput.reason.trim().length < 5 || reviewInput.reason.length > 500)
    {
      errors.push({ code: "Alasan", message: "Isi alasan perubahan sepanjang 5–500 karakter." });
    }

    if (reviewInput.reference.trim().length < 3)
    {
      errors.push({ code: "Referensi", message: "Isi referensi CR/ADR yang dapat ditelusuri, minimal 3 karakter." });
    }

    if (needsReview && !reviewInput.reviewed)
    {
      errors.push({ code: "Review", message: "Konfirmasikan peninjauan dampak dan pencatatan hasil pengujian." });
    }

    if (sensitive && reviewInput.verification !== "123456")
    {
      errors.push({ code: "Verifikasi", message: "Gunakan kode simulasi 123456 untuk mencoba konfirmasi ini." });
    }

    if (errors.length)
    {
      showErrors(document.getElementById("settings-review-errors"), errors);
      return;
    }

    busy = true;
    const save = document.getElementById("settings-save");
    save.textContent = "Menyimpan perubahan…";
    save.disabled = true;
    save.setAttribute("aria-busy", "true");
    root.querySelectorAll("button, input, textarea").forEach((control) => control.disabled = true);
    await new Promise((resolve) => setTimeout(resolve, 450));
    busy = false;

    if (state.role !== "superadmin" || document.getElementById("settings-expired").checked)
    {
      render();
      feedback(
        "Sesi tidak berlaku. Perubahan belum disimpan dan draf tetap tersedia. Akhiri simulasi sesi berakhir lalu coba lagi.",
        true
      );
      return;
    }

    const failure = document.getElementById("settings-fail-save");

    if (failure.checked)
    {
      failure.checked = false;
      render();
      feedback(
        "Penyimpanan gagal pada simulasi ini. Tidak ada nilai aktif atau riwayat yang berubah. "
          + "Draf dan alasan tetap tersedia untuk dicoba lagi.",
        true
      );
      return;
    }

    if (validateDrafts().length)
    {
      render();
      feedback("Nilai aktif berubah selama penyimpanan. Tinjau kembali draf yang berkonflik.", true);
      return;
    }

    const at = new Date().toISOString();
    const changes = [...drafts].map(([code, draft]) =>
    {
      return Object.freeze(
      {
        code,
        before: Object.freeze(clone(activeValues.get(code))),
        after: Object.freeze(clone(draft.values))
      });
    });
    const entry = Object.freeze(
    {
      id: `CFG-LOCAL-${String(entries.length + 1).padStart(3, "0")}`,
      actor: "SuperAdmin RylVa (contoh)",
      at,
      reason: reviewInput.reason.trim(),
      reference: reviewInput.reference.trim(),
      changes: Object.freeze(changes)
    });

    changes.forEach((change) =>
    {
      activeValues.set(change.code, clone(change.after));
      revisions.set(change.code, revisions.get(change.code) + 1);
      metadata.set(change.code, { at, actor: entry.actor, reason: entry.reason });
    });
    entries.unshift(entry);
    const count = drafts.size;
    drafts.clear();
    reviewInput = { reason: "", reference: "", reviewed: false, verification: "" };
    navigate({ view: "history", code: "" }, true);
    feedback(`${count} parameter tersimpan di tab ini. Riwayat perubahan lokal ditambahkan; modul produksi belum terpengaruh.`);
  }

  function renderHistory()
  {
    const section = panel(
      "Riwayat perubahan",
      "Catatan lokal hanya baca. Pengembalian nilai dilakukan sebagai perubahan baru, bukan menghapus riwayat."
    );
    const form = node("form", "settings-history-search");
    form.id = "settings-history-search";
    const field = node("div", "product-field");
    const label = node("label", "", "Cari riwayat");
    label.htmlFor = "settings-history-query";
    const input = node("input");
    input.id = label.htmlFor;
    input.type = "search";
    input.value = historySearch;
    input.maxLength = 150;
    input.placeholder = "Kode parameter, alasan, atau referensi";
    field.append(label, input);
    const submit = button("Cari riwayat", "history-search");
    submit.type = "submit";
    form.append(field, submit);
    section.append(form);
    const query = historySearch.trim().toLocaleLowerCase("id-ID");
    const filtered = entries.filter((entry) =>
    {
      const text = `${entry.id} ${entry.reason} ${entry.reference} ${entry.changes.map((change) => change.code).join(" ")}`;
      return text.toLocaleLowerCase("id-ID").includes(query);
    });
    historyPage = Math.min(historyPage, Math.max(1, Math.ceil(filtered.length / pageSize)));

    if (!filtered.length)
    {
      const empty = node("div", "settings-no-results");
      empty.append(node("h3", "", entries.length ? "Riwayat tidak ditemukan" : "Belum ada perubahan lokal"));
      empty.append(node("p", "secondary-text", entries.length
        ? "Coba kode parameter atau kata kunci lain."
        : "Setelah draf disimpan, nilai sebelum dan sesudah beserta alasannya akan muncul di sini."));
      empty.append(button(
        entries.length ? "Hapus pencarian" : "Pilih parameter",
        entries.length ? "clear-history" : "list"
      ));
      section.append(empty);
    }

    filtered.slice((historyPage - 1) * pageSize, historyPage * pageSize).forEach((entry) =>
    {
      const detail = node("details", "settings-history-entry");
      const title = node("summary");
      const closedIcon = icon("plus");
      closedIcon.classList.add("settings-history-closed");
      const openIcon = icon("minus");
      openIcon.classList.add("settings-history-open");
      const heading = node("span", "settings-history-title");
      heading.append(node("strong", "", entry.id), node("span", "", `${entry.changes.length} parameter disimpan`));
      title.append(closedIcon, openIcon, heading, badge("Tersimpan lokal", "success", "check"));
      detail.append(title, node("p", "settings-help", `${entry.actor}, ${time(entry.at)}`));
      detail.append(node("p", "", `Alasan: ${entry.reason}`), node("p", "", `Referensi: ${entry.reference}`));
      entry.changes.forEach((change) =>
      {
        const item = parameter(change.code);
        const block = node("div", "settings-history-change");
        block.append(node("h3", "", `${item.code}: ${item.name}`));
        const compare = node("div", "settings-compare");
        const before = node("div");
        before.append(node("strong", "", "Sebelum"), valueList(item, change.before));
        const after = node("div");
        after.append(node("strong", "", "Sesudah"), valueList(item, change.after, change.before));
        compare.append(before, after);
        block.append(compare, button("Buka parameter", "edit", { code: item.code }));
        detail.append(block);
      });
      section.append(detail);
    });

    if (filtered.length)
    {
      section.append(pagination(historyPage, Math.ceil(filtered.length / pageSize), filtered.length, "history-page"));
    }

    root.append(section);
  }

  function discardDrafts()
  {
    if (!drafts.size)
    {
      return;
    }

    pendingNavigation = () =>
    {
      drafts.clear();
      reviewInput = { reason: "", reference: "", reviewed: false, verification: "" };
      navigate({ view: "list" }, true);
      feedback("Seluruh draf dibuang. Nilai aktif dan riwayat tetap tersimpan di tab ini.");
    };
    openDialog(
      "Buang seluruh draf?",
      "Seluruh nilai usulan akan dibuang. Nilai aktif dan riwayat tidak berubah.",
      "Buang draf"
    );
  }

  function simulateConflict()
  {
    if (!drafts.size || busy)
    {
      feedback("Tambahkan draf terlebih dahulu untuk mencoba konflik perubahan.", true);
      return;
    }

    const code = drafts.keys().next().value;
    revisions.set(code, revisions.get(code) + 1);
    feedback(
      `Simulasi versi ${code} berubah oleh proses lain. Draf harus dibuka dan ditambahkan ulang sebelum disimpan.`,
      true
    );
  }

  const actions =
  {
    list: () => navigate({ view: "list", code: "" }),
    history: () => navigate({ view: "history", code: "" }),
    review: () => navigate({ view: "review", code: "" }),
    edit: (control) => navigate({ view: "editor", code: control.dataset.code }),
    group: (control) => navigate({ group: control.dataset.group, page: 1 }),
    segment: (control) => navigate({ segment: control.dataset.segment, page: 1 }),
    page: (control) => navigate({ page: Number(control.dataset.page) }),
    reset: () => navigate({ group: "all", segment: "all", search: "", page: 1 }),
    reload: () =>
    {
      if (editorDirty())
      {
        navigate({ view: "list" });
        return;
      }

      loadState = "full";
      render();
      feedback("Nilai aktif lokal dimuat kembali. Draf tetap tersedia; data server belum terhubung.");
    },
    baseline: () =>
    {
      const item = parameter(editorCode);
      const form = document.getElementById("settings-editor-form");
      item.fields.forEach((field) =>
      {
        const input = form.elements.namedItem(field.key);

        if (field.type === "boolean")
        {
          input.checked = field.value;
        }
        else
        {
          input.value = field.value;
        }
      });
      updateEditorPreview();
    },
    "remove-draft": (control) =>
    {
      drafts.delete(control.dataset.code);
      render();
    },
    discard: discardDrafts,
    conflict: simulateConflict,
    "cancel-dialog": () =>
    {
      pendingNavigation = null;
      dialog.close();
    },
    "history-page": (control) =>
    {
      historyPage = Number(control.dataset.page);
      render();
    },
    "clear-history": () =>
    {
      historySearch = "";
      historyPage = 1;
      render();
    }
  };

  document.addEventListener("click", (event) =>
  {
    const control = event.target.closest("[data-settings-action]");

    if (control && !control.disabled && !busy)
    {
      actions[control.dataset.settingsAction]?.(control);
    }

    const link = event.target.closest("a[href]");

    if (link && !link.href.endsWith("#main-content") && (editorDirty() || drafts.size))
    {
      event.preventDefault();
      pendingNavigation = () =>
      {
        allowUnload = true;
        location.assign(link.href);
      };
      openDialog("Tinggalkan halaman?",
        "Isian dan draf lokal akan hilang jika meninggalkan halaman ini. Lanjutkan?", "Tinggalkan halaman");
    }
  });

  document.addEventListener("submit", (event) =>
  {
    const form = event.target;

    if (!form.id.startsWith("settings-"))
    {
      return;
    }

    event.preventDefault();

    if (form.id === "settings-dialog-form")
    {
      dialog.close();
      const next = pendingNavigation;
      pendingNavigation = null;
      next?.();
    }
    else if (form.id === "settings-search-form")
    {
      navigate({ search: form.elements.namedItem("search").value.trim(), page: 1 });
    }
    else if (form.id === "settings-editor-form")
    {
      stageEditor();
    }
    else if (form.id === "settings-review-form")
    {
      saveChanges();
    }
    else if (form.id === "settings-history-search")
    {
      historySearch = document.getElementById("settings-history-query").value;
      historyPage = 1;
      render();
    }
  });

  document.addEventListener("input", (event) =>
  {
    if (event.target.closest("#settings-editor-form"))
    {
      event.target.removeAttribute("aria-invalid");
      document.getElementById("settings-editor-errors").hidden = true;
      updateEditorPreview();
    }

    if (event.target.closest("#settings-review-form"))
    {
      const { name, type, checked, value } = event.target;
      reviewInput[name] = type === "checkbox" ? checked : value;
      document.getElementById("settings-review-errors").hidden = true;
    }
  });

  document.getElementById("settings-profile").addEventListener("change", (event) =>
  {
    navigate({ role: event.target.value, view: "list", code: "" });
    event.target.value = state.role;
  });
  document.getElementById("settings-load-state").addEventListener("change", (event) =>
  {
    if (editorDirty())
    {
      const desired = event.target.value;
      event.target.value = loadState;
      pendingNavigation = () =>
      {
        loadState = desired;
        editorCode = "";
        render();
      };
      openDialog(
        "Isian belum ditambahkan",
        "Beralih kondisi data akan membuang isian editor yang belum menjadi draf.",
        "Buang isian"
      );
      return;
    }

    loadState = event.target.value;
    render();
  });
  window.addEventListener("beforeunload", (event) =>
  {
    if (!allowUnload && (drafts.size || editorDirty()))
    {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  window.addEventListener("popstate", () =>
  {
    const next = readState();
    writeUrl();
    navigate(next);
  });
  dialog.addEventListener("cancel", () => pendingNavigation = null);

  // Read-only inspection surface for local verification; not an authorization boundary.
  window.systemParametersDemo = Object.freeze(
  {
    snapshot: () => clone(
    {
      values: Object.fromEntries(activeValues),
      drafts: Object.fromEntries(drafts),
      entries,
      state,
      revisions: Object.fromEntries(revisions)
    })
  });

  writeUrl();
  render();
})();
