"use strict";

(() =>
{
  const hub = window.staffHub;
  const { node, button, badge, link, banner } = hub;
  const categories =
  {
    orders: "Pesanan & produksi",
    stock: "Stok & bahan",
    security: "Keamanan akun",
    system: "Informasi sistem",
    finance: "Keuangan"
  };

  function available()
  {
    return hub.source.notifications.filter((item) => !item.superadminOnly || hub.state.role === "superadmin");
  }

  function filtered()
  {
    return available().filter((item) =>
    {
      const text = `${item.title} ${item.description} ${categories[item.type]}`.toLocaleLowerCase("id-ID");
      const status = hub.state.filter;
      return text.includes(hub.state.query.trim().toLocaleLowerCase("id-ID"))
        && (hub.state.category === "all" || hub.state.category === item.type)
        && (status === "all" || (status === "read" && item.read) || (status === "unread" && !item.read)
          || (status === "attention" && item.attention));
    }).sort((first, second) =>
    {
      const priority = hub.state.sort === "attention" ? Number(second.attention) - Number(first.attention) : 0;
      return priority || Date.parse(second.at) - Date.parse(first.at);
    });
  }

  function renderStats()
  {
    const all = available();
    const area = node("div", "support-stats");
    [
      ["Belum dibaca", all.filter((item) => !item.read).length, "Pemberitahuan yang belum Anda tandai"],
      ["Perlu tindak lanjut", all.filter((item) => item.attention).length, "Periksa kondisi di modul terkait"],
      ["Semua notifikasi", all.length, "Sesuai profil pratinjau yang dipilih"]
    ].forEach(([label, count, description]) =>
    {
      const stat = node("div", "catalog-stat");
      stat.append(node("span", "", label), node("strong", "", count), node("small", "", description));
      area.append(stat);
    });
    hub.root.append(area);
  }

  function renderList()
  {
    const rows = filtered();
    const markAll = button("Tandai hasil dibaca", "read-results");
    markAll.disabled = hub.state.load !== "full" || !rows.some((item) => !item.read);
    hub.heading("Pusat Notifikasi", "Baca konteks dan buka pekerjaan yang memerlukan perhatian.", [markAll]);
    hub.demoNote();
    if (hub.loadState("Belum ada notifikasi", "Pemberitahuan baru akan ditampilkan di sini."))
    {
      return;
    }
    renderStats();
    hub.root.append(banner("Dibaca berbeda dari selesai", "Menandai notifikasi tidak menyelesaikan pesanan, mengubah stok atau mencabut sesi. Tindak lanjuti melalui modul terkait."));
    const area = node("section", "support-register");
    area.setAttribute("aria-label", "Daftar notifikasi");
    const tools = node("div", "report-tools");
    const types = Object.entries(categories).filter(([id]) => id !== "finance" || hub.state.role === "superadmin");
    tools.append(hub.searchField("Cari judul atau isi notifikasi"),
      hub.field("Kondisi", "filter", hub.select([
        ["all", "Semua"], ["unread", "Belum dibaca"], ["read", "Sudah dibaca"], ["attention", "Perlu tindak lanjut"]
      ], hub.state.filter, "filter")),
      hub.field("Jenis", "category", hub.select([["all", "Semua jenis"], ...types], hub.state.category, "category")),
      hub.field("Urutan", "sort", hub.select([
        ["newest", "Terbaru dahulu"], ["attention", "Tindak lanjut dahulu"]
      ], hub.state.sort, "sort")), button("Reset filter", "reset"));
    area.append(tools);
    const footer = hub.pagination(rows.length);
    const list = node("ul", "support-list");
    rows.slice((hub.state.pageIndex - 1) * hub.pageSize, hub.state.pageIndex * hub.pageSize).forEach((item) =>
    {
      const row = node("li", `support-row${item.read ? "" : " support-row--unread"}`);
      const copy = node("div", "support-row-copy");
      copy.append(node("strong", "support-item-title", item.title));
      const marks = node("div", "support-inline");
      marks.append(badge(item.read ? "Sudah dibaca" : "Belum dibaca", item.read ? "success" : "info"));
      if (item.attention)
      {
        marks.append(badge("Perlu tindak lanjut", "warning"));
      }
      copy.append(marks, node("p", "", item.description), node("p", "support-meta", categories[item.type]),
        node("small", "support-meta", hub.date(item.at)));
      const controls = node("div", "support-row-actions");
      controls.append(button(item.read ? "Tandai belum dibaca" : "Tandai dibaca", "toggle-read", { id: item.id }),
        button("Buka detail", "open-notification", { id: item.id }));
      row.append(copy, controls);
      list.append(row);
    });
    if (!rows.length)
    {
      const empty = node("div", "report-state");
      empty.append(node("h2", "", "Tidak ada notifikasi yang cocok"),
        node("p", "support-meta", "Ubah pencarian atau reset filter."), button("Reset filter", "reset"));
      area.append(empty);
    }
    area.append(list, footer);
    hub.root.append(area);
  }

  function renderDetail()
  {
    const back = button("Kembali ke notifikasi", "back-notifications", {}, "queue-text-button support-back");
    back.prepend(hub.icon("chevron"));
    hub.root.append(back);
    const item = available().find((entry) => entry.id === hub.state.item);
    if (!item)
    {
      hub.heading("Notifikasi tidak tersedia", "Kembali ke daftar untuk memilih pemberitahuan yang dapat Anda buka.");
      return;
    }
    hub.heading(item.title, categories[item.type]);
    hub.demoNote();
    const section = hub.panel("Isi pemberitahuan");
    const marks = node("div", "support-inline");
    marks.append(badge(item.read ? "Sudah dibaca" : "Belum dibaca", item.read ? "success" : "info"));
    if (item.attention)
    {
      marks.append(badge("Perlu tindak lanjut", "warning"));
    }
    section.append(marks, node("p", "support-meta", hub.date(item.at)), node("p", "support-prose", item.detail),
      banner("Periksa sumber sebelum bertindak", "Data contoh antarhalaman belum tersinkron. Kondisi dan tindakan yang berlaku ditampilkan di modul tujuan."));
    const controls = node("div", "support-actions");
    controls.append(link(item.targetLabel, item.target, "queue-button queue-button--primary"),
      button(item.read ? "Tandai belum dibaca" : "Tandai dibaca", "toggle-read", { id: item.id }));
    section.append(controls);
    hub.root.append(section);
  }

  function render()
  {
    if (!["all", "unread", "read", "attention"].includes(hub.state.filter))
    {
      hub.state.filter = "all";
    }
    if (!Object.hasOwn(categories, hub.state.category) || (hub.state.category === "finance" && hub.state.role !== "superadmin"))
    {
      hub.state.category = "all";
    }
    if (hub.state.item)
    {
      renderDetail();
    }
    else
    {
      renderList();
    }
  }

  const firstItem = available().find((item) => item.id === hub.state.item);
  if (firstItem)
  {
    firstItem.read = true;
  }
  function openNotification(control)
  {
    const item = available().find((entry) => entry.id === control.dataset.id);
    if (!item)
    {
      return;
    }
    hub.navigate({ item: item.id });
    if (!item.read)
    {
      hub.perform(() =>
      {
        item.read = true;
      }, "Notifikasi ditandai dibaca pada pratinjau. Kasus terkait belum berubah.");
    }
  }

  function toggleRead(control)
  {
    const item = available().find((entry) => entry.id === control.dataset.id);
    if (item)
    {
      hub.perform(() =>
      {
        item.read = !item.read;
      }, "Penanda dibaca diperbarui pada pratinjau. Kondisi pekerjaan terkait tetap.");
    }
  }

  function readResults()
  {
    const rows = filtered().filter((item) => !item.read);
    hub.perform(() => rows.forEach((item) =>
    {
      item.read = true;
    }), `${rows.length} notifikasi sesuai filter ditandai dibaca, termasuk hasil di halaman lain. Kasus belum diselesaikan.`);
  }

  function backNotifications()
  {
    hub.navigate({ item: "" });
  }

  hub.start(render,
  {
    "open-notification": openNotification,
    "toggle-read": toggleRead,
    "read-results": readResults,
    "back-notifications": backNotifications
  });
})();
