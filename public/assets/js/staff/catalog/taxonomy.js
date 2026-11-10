"use strict";

(() =>
{
  const root = document.getElementById("taxonomy-root");
  const dialog = document.getElementById("taxonomy-dialog");
  const body = document.getElementById("taxonomy-dialog-body");
  const fixture = window.taxonomyFixture;
  const params = new URLSearchParams(location.search);
  if (!root || !dialog || !fixture)
  {
    return;
  }
  const state =
  {
    role: params.get("role") === "superadmin" ? "superadmin" : "admin",
    kind: params.get("kind") === "attributes" ? "attributes" : "categories",
    detail: params.get("item") || "",
    tab: ["info", "usage", "history"].includes(params.get("tab")) ? params.get("tab") : "info",
    query: params.get("q") || "",
    status: ["active", "inactive", "unused"].includes(params.get("status")) ? params.get("status") : "all",
    sort: params.get("sort") === "usage" ? "usage" : "name",
    page: Math.max(1, Number.parseInt(params.get("page"), 10) || 1),
    load: "full"
  };
  const types = { text: "Teks", number: "Angka", choice: "Pilihan" };
  const modes = { description: "Deskriptif", variant: "Pembeda varian" };
  const pageSize = 5;
  let pending = null;
  let initialForm = "";

  function node(tag, className, text)
  {
    const element = document.createElement(tag);
    if (className)
    {
      element.className = className;
    }
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
    control.dataset.taxAction = action;
    Object.entries(data).forEach(([key, value]) =>
    {
      control.dataset[key] = value;
    });
    return control;
  }

  function badge(label, tone = "info")
  {
    const element = node("span", `queue-badge queue-badge--${tone}`);
    element.append(icon(tone === "success" ? "check" : "info"), node("span", "", label));
    return element;
  }

  function slug(value)
  {
    return value.toLocaleLowerCase("id-ID").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function items()
  {
    return fixture[state.kind];
  }

  function itemById(id)
  {
    return items().find((item) => item.id === id);
  }

  function usedBy(item, kind = state.kind)
  {
    return fixture.products.filter((product) => kind === "categories"
      ? product.categories.includes(item.id)
      : product.attributes.some((attribute) => attribute.name === item.name));
  }

  function optionUsage(item, option)
  {
    return usedBy(item, "attributes").filter((product) => product.attributes
      .some((attribute) => attribute.name === item.name && attribute.value === option.label));
  }

  function optionDeletionBlock(item, option)
  {
    if (optionUsage(item, option).length)
    {
      return "Pilihan masih digunakan produk.";
    }
    if (item.active && option.active && !item.options.some((entry) => entry.id !== option.id && entry.active))
    {
      return "Ini pilihan aktif terakhir. Nonaktifkan atribut terlebih dahulu atau tambahkan pilihan aktif lain.";
    }
    return "";
  }

  function children(item)
  {
    return fixture.categories.filter((category) => category.parent === item.id);
  }

  function deletionBlock(item)
  {
    if (usedBy(item).length)
    {
      return "Masih digunakan produk. Lepaskan pemakaian yang sesuai sebelum menghapus.";
    }
    if (state.kind === "categories" && children(item).length)
    {
      return "Masih memiliki kategori anak. Pindahkan kategori anak terlebih dahulu.";
    }
    if (state.kind === "categories" && fixture.attributes.some((attribute) => attribute.categories.includes(item.id)))
    {
      return "Masih ditautkan ke definisi atribut. Lepaskan kategori terkait pada atribut terlebih dahulu.";
    }
    return "";
  }

  function statusBlock(item)
  {
    if (!item.active)
    {
      return "";
    }
    if (usedBy(item).some((product) => product.status === "active"))
    {
      return "Masih dipakai produk aktif. Kelola pemakaian produk sebelum menonaktifkan.";
    }
    if (state.kind === "categories" && children(item).some((category) => category.active))
    {
      return "Masih memiliki kategori anak aktif.";
    }
    return "";
  }

  function linkProduct(product)
  {
    const link = node("a", "queue-button", "Buka produk");
    link.href = `../staff/products.html?role=${state.role}&product=${encodeURIComponent(product.id)}`;
    return link;
  }

  function writeUrl(push = false)
  {
    const url = new URL(location.href);
    url.search = "";
    Object.entries(
    {
      role: state.role, kind: state.kind, item: state.detail, tab: state.tab,
      q: state.query, status: state.status, sort: state.sort, page: String(state.page)
    }).forEach(([key, value]) =>
    {
      if (value)
      {
        url.searchParams.set(key, value);
      }
    });
    history[push ? "pushState" : "replaceState"](null, "", url);
  }

  function syncRole()
  {
    const name = state.role === "superadmin" ? "SuperAdmin" : "Admin";
    document.getElementById("preview-role").textContent = `Pratinjau ${name}`;
    document.getElementById("profile-name").textContent = `${name} RylVa`;
    document.querySelectorAll(".report-avatar").forEach((avatar) =>
    {
      avatar.textContent = state.role === "superadmin" ? "SA" : "AD";
    });
    document.querySelectorAll("[data-superadmin-only]").forEach((element) =>
    {
      element.hidden = state.role !== "superadmin";
    });
    document.querySelectorAll("[data-role-link]").forEach((link) =>
    {
      const url = new URL(link.getAttribute("href"), location.href);
      url.searchParams.set("role", state.role);
      link.href = url.href;
    });
    document.getElementById("taxonomy-profile").value = state.role;
    document.getElementById("taxonomy-load").value = state.load;
  }

  function heading(title, description, actions = [])
  {
    const head = node("div", "report-heading taxonomy-heading");
    const copy = node("div");
    copy.append(node("h1", "", title), node("p", "", description));
    const controls = node("div", "taxonomy-actions");
    controls.append(...actions);
    head.append(copy, controls);
    root.append(head);
  }

  function note(text, warning = false)
  {
    const wrapper = node("div", warning ? "taxonomy-notice" : "taxonomy-hook");
    wrapper.append(icon(warning ? "alert" : "info"), node("p", "", text));
    return wrapper;
  }

  function tabs(entries, active, action)
  {
    const nav = node("nav", "product-detail-tabs report-tabs");
    nav.setAttribute("aria-label", action === "kind" ? "Kelompok pengaturan katalog" : "Bagian detail");
    entries.forEach(([id, label]) =>
    {
      const control = button(label, action, { value: id }, "");
      if (id === active)
      {
        control.setAttribute("aria-current", "page");
      }
      nav.append(control);
    });
    return nav;
  }

  function select(options, value)
  {
    const control = document.createElement("select");
    options.forEach(([id, label]) =>
    {
      const option = node("option", "", label);
      option.value = id;
      control.append(option);
    });
    control.value = value;
    return control;
  }

  function field(label, name, control, helper = "")
  {
    const wrapper = node("div", "report-field");
    const caption = node("label", "", label);
    control.id = `tax-${name}`;
    control.name = name;
    control.required = label.includes("(wajib)");
    caption.htmlFor = control.id;
    wrapper.append(caption, control);
    if (helper)
    {
      const help = node("small", "", helper);
      help.id = `${control.id}-help`;
      control.setAttribute("aria-describedby", help.id);
      wrapper.append(help);
    }
    return wrapper;
  }

  function input(value = "", type = "text")
  {
    const control = document.createElement("input");
    control.type = type;
    control.value = value;
    return control;
  }

  function table(headers, rows)
  {
    const element = node("table", "report-table");
    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    headers.forEach((label) =>
    {
      const cell = node("th", "", label);
      cell.scope = "col";
      headRow.append(cell);
    });
    head.append(headRow);
    const bodyElement = document.createElement("tbody");
    rows.forEach((values) =>
    {
      const row = document.createElement("tr");
      values.forEach((value, index) =>
      {
        const cell = document.createElement("td");
        cell.dataset.label = headers[index];
        if (value instanceof Node)
        {
          cell.append(value);
        }
        else
        {
          cell.textContent = String(value);
        }
        row.append(cell);
      });
      bodyElement.append(row);
    });
    element.append(head, bodyElement);
    return element;
  }

  function renderStats()
  {
    const all = items();
    const stats = node("div", "taxonomy-stats");
    [
      ["Semua", all.length, "Definisi dalam daftar"],
      ["Aktif", all.filter((item) => item.active).length, "Tersedia untuk pemakaian baru"],
      ["Nonaktif", all.filter((item) => !item.active).length, "Riwayat dipertahankan"],
      ["Belum dipakai", all.filter((item) => !usedBy(item).length).length, "Periksa sebelum menghapus"]
    ].forEach(([label, value, description]) =>
    {
      const stat = node("div", "catalog-stat");
      stat.append(node("span", "", label), node("strong", "", value), node("small", "", description));
      stats.append(stat);
    });
    root.append(stats);
  }

  function renderFilters()
  {
    const tools = node("div", "report-tools");
    const search = input(state.query, "search");
    search.placeholder = "Cari nama atau kode";
    tools.append(
      field("Pencarian", "search", search),
      field("Status", "filter", select([
        ["all", "Semua"], ["active", "Aktif"], ["inactive", "Nonaktif"], ["unused", "Belum dipakai"]
      ], state.status)),
      field("Urutkan", "sort", select([["name", "Nama A–Z"], ["usage", "Pemakaian terbanyak"]], state.sort)),
      button("Reset filter", "reset")
    );
    return tools;
  }

  function renderList()
  {
    heading("Kategori & Atribut", "Atur pengelompokan dan informasi katalog dengan pemakaian yang jelas.",
      [button(state.kind === "categories" ? "Tambah kategori" : "Tambah atribut", "new", {},
        "queue-button queue-button--primary")]);
    root.append(node("p", "report-note", "Pratinjau lokal dari data produk contoh. Perubahan hilang saat dimuat ulang."));
    root.append(tabs([["categories", "Kategori"], ["attributes", "Atribut"]], state.kind, "kind"));
    if (state.load !== "full")
    {
      renderLoadState();
      return;
    }
    renderStats();
    root.append(note(state.kind === "categories"
      ? "Satu produk dapat berada di beberapa kategori. Pemakaian dan kategori anak diperiksa sebelum penghapusan."
      : "Atribut deskriptif tidak otomatis membuat SKU. Aturan pembeda varian diterapkan melalui editor Produk & Varian."));
    const rows = items().filter((item) =>
    {
      const search = `${item.name} ${item.slug || item.key}`.toLocaleLowerCase("id-ID");
      return search.includes(state.query.trim().toLocaleLowerCase("id-ID"))
        && (state.status === "all" || (state.status === "unused" && !usedBy(item).length)
          || (state.status === "active" && item.active) || (state.status === "inactive" && !item.active));
    }).sort((first, second) => state.sort === "usage"
      ? usedBy(second).length - usedBy(first).length || first.name.localeCompare(second.name, "id")
      : first.name.localeCompare(second.name, "id"));
    const sheet = node("section", "report-sheet");
    sheet.setAttribute("aria-label", "Daftar kategori dan atribut");
    sheet.append(renderFilters());
    const pages = Math.max(1, Math.ceil(rows.length / pageSize));
    state.page = Math.min(state.page, pages);
    if (!rows.length)
    {
      const empty = node("div", "report-state");
      empty.append(node("h2", "", "Tidak ada hasil yang cocok"),
        node("p", "report-muted", "Ubah kata pencarian atau reset filter."), button("Reset filter", "reset"));
      sheet.append(empty);
    }
    else
    {
      const headers = state.kind === "categories"
        ? ["Kategori", "Induk", "Pemakaian", "Urutan", "Status", "Tindakan"]
        : ["Atribut", "Tipe / fungsi", "Pilihan", "Pemakaian", "Status", "Tindakan"];
      const visible = rows.slice((state.page - 1) * pageSize, state.page * pageSize).map((item) =>
      {
        const name = node("div");
        name.append(node("strong", "", item.name), node("small", "", item.slug || item.key));
        const used = node("span", "taxonomy-used", `${usedBy(item).length} produk`);
        const mark = badge(item.active ? "Aktif" : "Nonaktif", item.active ? "success" : "info");
        const open = button("Buka detail", "detail", { id: item.id });
        return state.kind === "categories"
          ? [name, fixture.categories.find((category) => category.id === item.parent)?.name || "Tanpa induk",
            used, item.position, mark, open]
          : [name, `${types[item.type]} / ${modes[item.mode]}`,
            item.type === "choice" ? `${item.options.filter((option) => option.active).length} aktif` : "Tidak berlaku",
            used, mark, open];
      });
      sheet.append(table(headers, visible));
    }
    const footer = node("div", "report-pagination");
    const first = rows.length ? (state.page - 1) * pageSize + 1 : 0;
    const count = node("span", "report-muted", `${first}–${Math.min(state.page * pageSize, rows.length)} dari ${rows.length}`);
    count.setAttribute("role", "status");
    footer.append(count);
    const controls = node("div", "report-pagination-controls");
    const previous = button("", "previous", {}, "icon-button");
    previous.setAttribute("aria-label", "Halaman sebelumnya");
    previous.disabled = state.page === 1;
    previous.append(icon("chevron"));
    const next = button("", "next", {}, "icon-button");
    next.setAttribute("aria-label", "Halaman berikutnya");
    next.disabled = state.page >= pages;
    next.append(icon("chevron"));
    controls.append(previous, node("span", "", `${state.page} dari ${pages}`), next);
    footer.append(controls);
    sheet.append(footer);
    root.append(sheet);
  }

  function renderLoadState()
  {
    const area = node("section", "report-state");
    const labels =
    {
      loading: ["Memuat data katalog", "Menyiapkan daftar kategori dan atribut."],
      error: ["Data belum dapat dimuat", "Coba lagi untuk memuat data contoh."],
      empty: ["Belum ada data katalog", "Tambahkan definisi untuk mulai mengatur katalog."]
    };
    area.append(node("h2", "", labels[state.load][0]), node("p", "report-muted", labels[state.load][1]));
    if (state.load === "loading")
    {
      area.setAttribute("aria-busy", "true");
      const skeleton = node("div", "taxonomy-skeleton");
      skeleton.setAttribute("aria-hidden", "true");
      for (let index = 0; index < 4; index += 1)
      {
        skeleton.append(node("span"));
      }
      area.append(skeleton);
    }
    else
    {
      if (state.load === "empty")
      {
        area.append(button(state.kind === "categories" ? "Tambah kategori" : "Tambah atribut", "new", {},
          "queue-button queue-button--primary"));
      }
      area.append(button("Muat data contoh", "reload"));
    }
    root.append(area);
  }

  function renderDetail()
  {
    const item = itemById(state.detail);
    const back = button("Kembali ke daftar", "back", {}, "queue-text-button taxonomy-back");
    back.prepend(icon("chevron"));
    root.append(back);
    if (!item)
    {
      heading("Definisi tidak ditemukan", "Kembali ke daftar untuk memilih kategori atau atribut yang tersedia.");
      return;
    }
    heading(item.name, state.kind === "categories" ? "Detail kategori katalog" : "Detail definisi atribut", [
      button("Edit", "edit", { id: item.id }), button("Hapus", "delete", { id: item.id })
    ]);
    root.append(node("div", "taxonomy-inline"));
    root.lastChild.append(badge(item.active ? "Aktif" : "Nonaktif", item.active ? "success" : "info"),
      node("span", "report-muted", `Dipakai ${usedBy(item).length} produk`));
    root.append(tabs([["info", "Informasi"], ["usage", "Pemakaian"], ["history", "Aktivitas"]], state.tab, "tab"));
    const section = node("section", "taxonomy-detail");
    if (state.tab === "info")
    {
      section.append(node("h2", "", "Informasi utama"));
      const values = state.kind === "categories"
        ? [
          ["Slug", item.slug],
          ["Kategori induk", fixture.categories.find((category) => category.id === item.parent)?.name || "Tanpa induk"],
          ["Urutan", item.position], ["Kategori anak", children(item).map((child) => child.name).join(", ") || "Tidak ada"]
        ]
        : [
          ["Kode", item.key], ["Tipe data", types[item.type]], ["Fungsi", modes[item.mode]],
          ["Kategori terkait", item.categories.map((id) => fixture.categories.find((entry) => entry.id === id)?.name)
            .filter(Boolean).join(", ") || "Belum ditetapkan"]
        ];
      values.push(["Deskripsi", item.description || "Belum diisi"]);
      const list = node("dl", "taxonomy-definition");
      values.forEach(([label, value]) =>
      {
        const row = document.createElement("div");
        row.append(node("dt", "", label), node("dd", "", value));
        list.append(row);
      });
      section.append(list);
      if (state.kind === "attributes" && item.type === "choice")
      {
        renderOptions(section, item);
      }
      section.append(note(deletionBlock(item) || "Belum memiliki pemakaian produk. Periksa sebelum menghapus."));
    }
    else if (state.tab === "usage")
    {
      section.append(node("h2", "", "Produk yang menggunakan"));
      const products = usedBy(item);
      section.append(node("p", "report-muted", "Pemakaian dihitung dari data produk contoh awal, termasuk produk nonaktif."));
      if (products.length)
      {
        section.append(table(["Produk", "Status", "Tindakan"], products.map((product) =>
          [product.name, badge(product.status === "active" ? "Aktif" : "Nonaktif"), linkProduct(product)])));
      }
      else
      {
        section.append(note("Belum digunakan oleh produk contoh."));
      }
    }
    else
    {
      section.append(node("h2", "", "Aktivitas pratinjau"));
      if (!item.history.length)
      {
        section.append(note("Belum ada perubahan pada sesi pratinjau ini."));
      }
      const list = node("ol", "taxonomy-history");
      item.history.forEach((entry) =>
      {
        const row = document.createElement("li");
        row.append(node("strong", "", entry.action), node("span", "taxonomy-subtitle", entry.reason),
          node("small", "taxonomy-subtitle", `${entry.actor}, ${entry.at}`));
        list.append(row);
      });
      section.append(list);
    }
    root.append(section);
  }

  function renderOptions(section, item)
  {
    const head = node("div", "report-section-head");
    head.append(node("h2", "", "Pilihan atribut"), button("Tambah pilihan", "option-new", { id: item.id }));
    section.append(head);
    if (!item.options.length)
    {
      section.append(note("Belum ada pilihan. Tambahkan nilai sebelum atribut dipakai."));
    }
    const list = node("ul", "taxonomy-option-list");
    item.options.forEach((option) =>
    {
      const count = optionUsage(item, option).length;
      const row = node("li", "taxonomy-option-row");
      const text = node("div");
      text.append(node("strong", "", option.label), node("span", "taxonomy-subtitle", `Dipakai ${count} produk`));
      const controls = node("div", "taxonomy-actions");
      controls.append(badge(option.active ? "Aktif" : "Nonaktif", option.active ? "success" : "info"),
        button("Edit", "option-edit", { id: item.id, option: option.id }));
      const remove = button("Hapus", "option-delete", { id: item.id, option: option.id });
      const block = optionDeletionBlock(item, option);
      remove.disabled = Boolean(block);
      if (block)
      {
        remove.title = block;
        text.append(node("small", "taxonomy-subtitle", block));
      }
      controls.append(remove);
      row.append(text, controls);
      list.append(row);
    });
    section.append(list, node("p", "report-muted", "Pilihan yang sudah dipakai dikunci dari penggantian nilai dan penghapusan."));
  }

  function render()
  {
    root.replaceChildren();
    syncRole();
    if (state.detail)
    {
      renderDetail();
    }
    else
    {
      renderList();
    }
    writeUrl();
  }

  function message(text)
  {
    const feedback = document.getElementById("taxonomy-feedback");
    feedback.textContent = text;
    feedback.hidden = false;
  }

  function formSignature()
  {
    const form = body.querySelector("form");
    return form ? JSON.stringify(Array.from(new FormData(form).entries())) : "";
  }

  function tryClose(force = false)
  {
    if (!force && formSignature() !== initialForm)
    {
      body.querySelector(".taxonomy-discard").hidden = false;
      body.querySelector('[data-tax-action="keep-editing"]').focus();
      return;
    }
    dialog.close();
    pending = null;
  }

  function showErrors(errors)
  {
    const box = body.querySelector(".taxonomy-errors");
    const list = node("ul");
    errors.forEach((error) => list.append(node("li", "", error)));
    box.replaceChildren(list);
    box.hidden = false;
    box.focus();
  }

  function openEditor(action, id = "", optionId = "")
  {
    const item = itemById(id);
    const isOption = action.startsWith("option-");
    const option = isOption ? item.options.find((entry) => entry.id === optionId) : null;
    const deleting = action === "delete" || action === "option-delete";
    pending = { action, id, optionId, kind: state.kind };
    body.replaceChildren();
    document.getElementById("taxonomy-dialog-title").textContent = deleting ? "Hapus definisi"
      : isOption ? (option ? "Edit pilihan" : "Tambah pilihan")
        : `${item ? "Edit" : "Tambah"} ${state.kind === "categories" ? "kategori" : "atribut"}`;
    const form = node("form", "taxonomy-form");
    form.id = "taxonomy-form";
    form.noValidate = true;
    const errors = node("div", "taxonomy-errors");
    errors.hidden = true;
    errors.tabIndex = -1;
    errors.setAttribute("role", "alert");
    form.append(errors);
    const referenced = item ? usedBy(item).length > 0 : false;
    const block = deleting ? isOption ? optionDeletionBlock(item, option) : deletionBlock(item) : "";
    if (deleting)
    {
      form.append(note(block || `Hapus ${option?.label || item.name}? Tindakan ini menghapus definisi dari pratinjau.`, true));
    }
    else if (isOption)
    {
      const label = input(option?.label || "");
      label.maxLength = 80;
      label.disabled = Boolean(option && optionUsage(item, option).length);
      form.append(field("Nama pilihan (wajib)", "name", label,
        label.disabled ? "Nilai yang sudah digunakan dikunci agar referensi produk tetap utuh." : "Maksimal 80 karakter."));
      form.append(check("Aktif untuk pemakaian baru", "active", option?.active ?? true));
    }
    else
    {
      const name = input(item?.name || "");
      name.maxLength = 80;
      name.disabled = Boolean(referenced && state.kind === "attributes");
      form.append(field("Nama (wajib)", "name", name,
        name.disabled ? "Nama atribut yang sudah dipakai dikunci dalam pratinjau ini." : "Nama unik, maksimal 80 karakter."));
      const key = input(item?.slug || item?.key || "");
      key.maxLength = 80;
      key.disabled = referenced;
      form.append(field(state.kind === "categories" ? "Slug (wajib)" : "Kode (wajib)", "key", key,
        referenced ? "Identitas yang sudah dipakai dipertahankan." : "Huruf kecil, angka, dan tanda hubung."));
      if (state.kind === "categories")
      {
        const parents = fixture.categories.filter((entry) => entry.active && entry.id !== id && !isDescendant(entry, id));
        form.append(field("Kategori induk", "parent", select(
          [["", "Tanpa induk"], ...parents.map((entry) => [entry.id, entry.name])], item?.parent || ""
        )));
        const position = input(item?.position || 1, "number");
        position.min = "1";
        position.max = "999";
        form.append(field("Urutan tampil (wajib)", "position", position, "Angka 1–999. Angka kecil tampil lebih dahulu."));
      }
      else
      {
        const type = select(Object.entries(types), item?.type || "text");
        const mode = select(Object.entries(modes), item?.mode || "description");
        type.disabled = referenced || Boolean(item?.options.length);
        mode.disabled = referenced;
        form.append(field("Tipe data", "type", type,
          type.disabled ? "Tipe dikunci saat dipakai atau sudah memiliki pilihan." : "Pilihan menggunakan daftar nilai terkontrol."));
        form.append(field("Fungsi atribut", "mode", mode, "Pembeda varian tidak otomatis membuat atau mengubah SKU."));
        const categoryPicker = node("details", "taxonomy-category-picker");
        categoryPicker.append(node("summary", "", "Kategori terkait (opsional)"));
        const chosenNames = (item?.categories || []).map((categoryId) => fixture.categories
          .find((category) => category.id === categoryId)?.name).filter(Boolean);
        categoryPicker.append(node("small", "taxonomy-subtitle", chosenNames.join(", ") || "Belum ada kategori dipilih"));
        const choices = node("fieldset", "taxonomy-category-choices");
        choices.append(node("legend", "", "Kategori yang relevan"));
        fixture.categories.forEach((category) =>
        {
          const selected = item?.categories.includes(category.id) || false;
          if (!category.active && !selected)
          {
            return;
          }
          const label = category.active ? category.name : `${category.name} (nonaktif)`;
          choices.append(check(label, "categories", selected, category.id));
        });
        categoryPicker.append(choices);
        form.append(categoryPicker);
        const choiceHelp = node("small", "", item?.options.some((entry) => entry.active)
          ? "Atribut pilihan aktif harus tetap memiliki setidaknya satu pilihan aktif."
          : "Untuk tipe Pilihan, simpan sebagai nonaktif dahulu. Tambahkan pilihan, lalu aktifkan atribut.");
        choiceHelp.id = "taxonomy-choice-help";
        choiceHelp.hidden = type.value !== "choice";
        form.append(choiceHelp);
      }
      const description = node("textarea");
      description.value = item?.description || "";
      description.maxLength = 500;
      form.append(field("Deskripsi", "description", description, "Opsional, maksimal 500 karakter."));
      form.append(check("Aktif untuk pemakaian baru", "active", item?.active ?? true));
      if (item && statusBlock(item))
      {
        form.append(note(statusBlock(item)));
      }
    }
    if (item)
    {
      const reason = node("textarea");
      reason.maxLength = 500;
      form.append(field("Alasan perubahan (wajib)", "reason", reason, "5–500 karakter untuk aktivitas pratinjau."));
    }
    const controls = document.getElementById("taxonomy-dialog-actions");
    controls.replaceChildren();
    const submit = node("button", "queue-button queue-button--primary", deleting ? "Hapus" : "Simpan");
    submit.type = "submit";
    submit.setAttribute("form", form.id);
    submit.disabled = Boolean(block);
    controls.append(button("Batal", "close"), submit);
    const discard = node("div", "taxonomy-notice taxonomy-discard");
    discard.hidden = true;
    discard.append(node("p", "", "Perubahan belum disimpan."),
      button("Lanjutkan edit", "keep-editing"), button("Buang perubahan", "discard"));
    body.append(form, discard);
    initialForm = formSignature();
    dialog.showModal();
    (form.querySelector("input:not(:disabled), textarea, select:not(:disabled)") || submit).focus();
  }

  function check(label, name, checked, value = "yes")
  {
    const element = node("label", "taxonomy-check");
    const control = input(value, "checkbox");
    control.name = name;
    control.checked = checked;
    element.append(control, node("span", "", label));
    return element;
  }

  function isDescendant(category, ancestorId)
  {
    const visited = new Set();
    let parent = category.parent;
    while (parent && !visited.has(parent))
    {
      if (parent === ancestorId)
      {
        return true;
      }
      visited.add(parent);
      parent = fixture.categories.find((entry) => entry.id === parent)?.parent;
    }
    return false;
  }

  function historyEntry(item, action, reason)
  {
    item.history.unshift(
    {
      action,
      reason,
      actor: state.role === "superadmin" ? "SuperAdmin contoh" : "Admin contoh",
      at: new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" })
        .format(new Date()) + " WIB"
    });
  }

  body.addEventListener("submit", (event) =>
  {
    event.preventDefault();
    if (!pending)
    {
      return;
    }
    const form = event.target;
    const value = (name) => form.elements.namedItem(name)?.value.trim() || "";
    const item = itemById(pending.id);
    const errors = [];
    const isOption = pending.action.startsWith("option-");
    const deleting = pending.action === "delete" || pending.action === "option-delete";
    const option = isOption ? item.options.find((entry) => entry.id === pending.optionId) : null;
    const reason = value("reason");
    if (item && reason.length < 5)
    {
      errors.push("Isi alasan perubahan sedikitnya 5 karakter.");
    }
    if (deleting)
    {
      const block = isOption ? optionDeletionBlock(item, option) : deletionBlock(item);
      if (block)
      {
        errors.push(block);
      }
    }
    else
    {
      const name = value("name");
      const active = form.elements.namedItem("active").checked;
      if (name.length < 2 || name.length > 80)
      {
        errors.push("Nama harus terdiri dari 2–80 karakter.");
      }
      const peers = isOption ? item.options : items();
      if (peers.some((entry) => entry.id !== (isOption ? option?.id : item?.id)
        && (entry.name || entry.label).toLocaleLowerCase("id-ID") === name.toLocaleLowerCase("id-ID")))
      {
        errors.push("Nama sudah digunakan. Pilih nama lain.");
      }
      if (isOption)
      {
        if (option && optionUsage(item, option).length && (!active || name !== option.label))
        {
          errors.push("Pilihan yang sudah dipakai tidak dapat diubah atau dinonaktifkan dalam pratinjau ini.");
        }
        if (option && !active && item.active && !item.options.some((entry) => entry.id !== option.id && entry.active))
        {
          errors.push("Atribut aktif memerlukan setidaknya satu pilihan aktif. Nonaktifkan atribut terlebih dahulu.");
        }
      }
      else
      {
        const key = value("key");
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key) || key.length > 80)
        {
          errors.push("Kode/slug wajib berisi huruf kecil, angka, dan tanda hubung, maksimal 80 karakter.");
        }
        if (items().some((entry) => entry.id !== item?.id && (entry.slug || entry.key) === key))
        {
          errors.push("Kode/slug sudah digunakan.");
        }
        if (item && !active && statusBlock(item))
        {
          errors.push(statusBlock(item));
        }
        if (item && usedBy(item).length && key !== (item.slug || item.key))
        {
          errors.push("Identitas yang sudah digunakan tidak dapat diubah.");
        }
        if (state.kind === "categories")
        {
          const parent = fixture.categories.find((entry) => entry.id === value("parent"));
          if (parent && (parent.id === item?.id || isDescendant(parent, item?.id)))
          {
            errors.push("Kategori induk tidak boleh membentuk siklus.");
          }
          const position = Number(value("position"));
          if (!Number.isInteger(position) || position < 1 || position > 999)
          {
            errors.push("Urutan harus berupa angka bulat 1–999.");
          }
        }
        else
        {
          const type = value("type");
          const mode = value("mode");
          if (!Object.hasOwn(types, type) || !Object.hasOwn(modes, mode))
          {
            errors.push("Pilih tipe dan fungsi atribut yang tersedia.");
          }
          if (type === "choice" && active && !item?.options.some((entry) => entry.active))
          {
            errors.push("Simpan atribut pilihan sebagai nonaktif, tambahkan pilihan aktif, lalu aktifkan atribut.");
          }
          if (item && usedBy(item).length && (name !== item.name || type !== item.type || mode !== item.mode))
          {
            errors.push("Nama, tipe, dan fungsi atribut yang sudah digunakan dikunci.");
          }
          if (item?.options.length && type !== item.type)
          {
            errors.push("Hapus pilihan yang belum dipakai sebelum mengubah tipe atribut.");
          }
        }
      }
    }
    if (errors.length)
    {
      showErrors(errors);
      return;
    }
    if (document.getElementById("taxonomy-fail").checked)
    {
      showErrors(["Simulasi simpan gagal. Isian tetap tersedia; coba lagi setelah menonaktifkan simulasi kegagalan."]);
      return;
    }
    let resultId = item?.id;
    if (deleting)
    {
      if (isOption)
      {
        item.options = item.options.filter((entry) => entry.id !== option.id);
        historyEntry(item, `Menghapus pilihan ${option.label}`, reason);
      }
      else
      {
        fixture[state.kind] = items().filter((entry) => entry.id !== item.id);
        state.detail = "";
      }
    }
    else if (isOption)
    {
      const values = { label: value("name"), active: form.elements.namedItem("active").checked };
      if (option)
      {
        Object.assign(option, values);
      }
      else
      {
        item.options.push({ id: `option-${crypto.randomUUID()}`, ...values });
      }
      historyEntry(item, option ? "Mengubah pilihan" : "Menambahkan pilihan", reason);
    }
    else
    {
      const values =
      {
        name: value("name"), description: value("description"), active: form.elements.namedItem("active").checked
      };
      if (state.kind === "categories")
      {
        Object.assign(values, { slug: value("key"), parent: value("parent"), position: Number(value("position")) });
      }
      else
      {
        Object.assign(values,
        {
          key: value("key"), type: value("type"), mode: value("mode"),
          categories: Array.from(form.querySelectorAll('input[name="categories"]:checked')).map((control) => control.value)
        });
      }
      if (item)
      {
        Object.assign(item, values);
        historyEntry(item, "Mengubah definisi", reason);
      }
      else
      {
        const created = { id: `definition-${crypto.randomUUID()}`, options: [], history: [], ...values };
        historyEntry(created, "Membuat definisi", "Ditambahkan melalui pratinjau lokal.");
        items().push(created);
        resultId = created.id;
      }
    }
    tryClose(true);
    state.load = "full";
    if (!deleting)
    {
      state.detail = resultId;
    }
    render();
    const title = root.querySelector("h1");
    title.tabIndex = -1;
    title.focus({ preventScroll: true });
    message("Perubahan tersimpan pada sesi pratinjau ini. Data halaman produk lain belum berubah.");
    window.scrollTo(0, 0);
  });

  document.addEventListener("click", (event) =>
  {
    const control = event.target.closest("[data-tax-action]");
    if (!control)
    {
      return;
    }
    const action = control.dataset.taxAction;
    if (["new", "edit", "delete", "option-new", "option-edit", "option-delete"].includes(action))
    {
      openEditor(action, control.dataset.id, control.dataset.option);
      return;
    }
    if (action === "close" || action === "discard")
    {
      tryClose(action === "discard");
      return;
    }
    if (action === "keep-editing")
    {
      body.querySelector(".taxonomy-discard").hidden = true;
      body.querySelector("input:not(:disabled), textarea, select:not(:disabled)")?.focus();
      return;
    }
    if (action === "kind")
    {
      state.kind = control.dataset.value;
      state.detail = "";
      state.query = "";
      state.status = "all";
      state.page = 1;
    }
    else if (action === "detail")
    {
      state.detail = control.dataset.id;
      state.tab = "info";
    }
    else if (action === "back")
    {
      state.detail = "";
    }
    else if (action === "tab")
    {
      state.tab = control.dataset.value;
    }
    else if (action === "reset")
    {
      state.query = "";
      state.status = "all";
      state.sort = "name";
      state.page = 1;
    }
    else if (action === "previous" || action === "next")
    {
      state.page += action === "previous" ? -1 : 1;
    }
    else if (action === "reload")
    {
      state.load = "full";
    }
    writeUrl(true);
    render();
    if (action === "tab" || action === "kind")
    {
      root.querySelector(`[data-tax-action="${action}"][aria-current="page"]`)?.focus({ preventScroll: true });
    }
    else if (action === "detail" || action === "back" || action === "reload")
    {
      const title = root.querySelector("h1");
      title.tabIndex = -1;
      title.focus({ preventScroll: true });
    }
    else
    {
      root.querySelector(`[data-tax-action="${action}"]:not(:disabled)`)?.focus({ preventScroll: true });
    }
    if (action === "detail" || action === "back" || action === "kind")
    {
      window.scrollTo(0, 0);
    }
  });

  root.addEventListener("input", (event) =>
  {
    if (event.target.id !== "tax-search" || event.isComposing)
    {
      return;
    }
    const cursor = event.target.selectionStart;
    state.query = event.target.value;
    state.page = 1;
    render();
    const search = document.getElementById("tax-search");
    search.focus({ preventScroll: true });
    search.setSelectionRange(cursor, cursor);
  });
  root.addEventListener("change", (event) =>
  {
    if (!["tax-filter", "tax-sort"].includes(event.target.id))
    {
      return;
    }
    const id = event.target.id;
    state[id === "tax-filter" ? "status" : "sort"] = event.target.value;
    state.page = 1;
    render();
    document.getElementById(id).focus({ preventScroll: true });
  });
  body.addEventListener("input", (event) =>
  {
    if (event.target.name === "categories")
    {
      const names = Array.from(body.querySelectorAll('input[name="categories"]:checked')).map((control) => fixture.categories
        .find((category) => category.id === control.value)?.name).filter(Boolean);
      body.querySelector(".taxonomy-category-picker > small").textContent = names.join(", ") || "Belum ada kategori dipilih";
    }
    if (event.target.name === "name" && pending && !pending.id && !pending.action.startsWith("option-"))
    {
      body.querySelector('[name="key"]').value = slug(event.target.value);
    }
  });
  document.getElementById("taxonomy-dialog-close").addEventListener("click", () => tryClose());
  body.addEventListener("change", (event) =>
  {
    if (event.target.name === "type")
    {
      document.getElementById("taxonomy-choice-help").hidden = event.target.value !== "choice";
    }
  });
  dialog.addEventListener("cancel", (event) =>
  {
    event.preventDefault();
    tryClose();
  });
  document.getElementById("taxonomy-profile").addEventListener("change", (event) =>
  {
    state.role = event.target.value;
    render();
  });
  document.getElementById("taxonomy-load").addEventListener("change", (event) =>
  {
    state.load = event.target.value;
    state.detail = "";
    render();
  });
  window.addEventListener("beforeunload", (event) =>
  {
    if (dialog.open && formSignature() !== initialForm)
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
      tryClose();
      return;
    }
    const current = new URLSearchParams(location.search);
    state.role = current.get("role") === "superadmin" ? "superadmin" : "admin";
    state.kind = current.get("kind") === "attributes" ? "attributes" : "categories";
    state.detail = current.get("item") || "";
    state.tab = ["info", "usage", "history"].includes(current.get("tab")) ? current.get("tab") : "info";
    state.query = current.get("q") || "";
    state.status = ["active", "inactive", "unused"].includes(current.get("status")) ? current.get("status") : "all";
    state.sort = current.get("sort") === "usage" ? "usage" : "name";
    state.page = Math.max(1, Number.parseInt(current.get("page"), 10) || 1);
    render();
    window.scrollTo(0, 0);
  });
  render();
})();
