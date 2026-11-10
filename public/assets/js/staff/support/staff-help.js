"use strict";

(() =>
{
  const hub = window.staffHub;
  const { node, button, link, banner } = hub;
  const categories =
  {
    access: "Akses & keamanan", orders: "Pesanan & purnajual", catalog: "Katalog & stok",
    production: "Produksi buket", system: "Gangguan sistem"
  };

  function renderList()
  {
    hub.heading("Pusat Bantuan", "Temukan langkah kerja dan batas kewenangan sebelum bertindak.");
    hub.demoNote();
    if (hub.loadState("Panduan belum tersedia", "Muat kembali data contoh untuk membuka panduan operasional."))
    {
      return;
    }
    hub.root.append(banner("Tidak dapat masuk?", "Bantuan akses tetap dapat dibuka dari halaman login staf.", "info", [
      link("Bantuan akses", "../auth/staff-login.html?view=help")
    ]));
    const area = node("section", "support-register");
    area.setAttribute("aria-label", "Panduan operasional staf");
    const tools = node("div", "report-tools");
    tools.append(hub.searchField("Cari topik, status atau kendala"),
      hub.field("Topik", "category", hub.select([
        ["all", "Semua topik"], ...Object.entries(categories)
      ], hub.state.category, "category")), button("Reset filter", "reset"));
    area.append(tools);
    const query = hub.state.query.trim().toLocaleLowerCase("id-ID");
    const rows = hub.source.articles.filter((article) =>
    {
      const content = `${article.title} ${article.summary} ${article.steps.join(" ")} ${article.important}`.toLocaleLowerCase("id-ID");
      return content.includes(query) && (hub.state.category === "all" || hub.state.category === article.category);
    });
    const footer = hub.pagination(rows.length);
    const list = node("ul", "support-list");
    rows.slice((hub.state.pageIndex - 1) * hub.pageSize, hub.state.pageIndex * hub.pageSize).forEach((article) =>
    {
      const row = node("li", "support-row");
      const copy = node("div", "support-row-copy");
      copy.append(node("strong", "support-item-title", article.title),
        node("p", "", article.summary), node("small", "support-meta", categories[article.category]));
      const controls = node("div", "support-row-actions");
      controls.append(button("Baca panduan", "open-article", { id: article.id }));
      row.append(copy, controls);
      list.append(row);
    });
    if (!rows.length)
    {
      const empty = node("div", "report-state");
      empty.append(node("h2", "", "Panduan belum ditemukan"),
        node("p", "support-meta", "Coba kata yang lebih umum atau reset filter."), button("Reset filter", "reset"));
      area.append(empty);
    }
    area.append(list, footer);
    hub.root.append(area);
  }

  function renderArticle()
  {
    const back = button("Kembali ke bantuan", "back-help", {}, "queue-text-button support-back");
    back.prepend(hub.icon("chevron"));
    hub.root.append(back);
    const article = hub.source.articles.find((entry) => entry.id === hub.state.article);
    if (!article)
    {
      hub.heading("Panduan tidak ditemukan", "Kembali ke daftar untuk memilih topik yang tersedia.");
      return;
    }
    hub.heading(article.title, categories[article.category]);
    hub.demoNote();
    const section = hub.panel("Langkah yang dapat dilakukan", article.summary);
    const layout = node("div", "support-article-layout");
    const prose = node("div", "support-prose");
    const steps = node("ol");
    article.steps.forEach((step) => steps.append(node("li", "", step)));
    prose.append(steps);
    const related = node("aside", "support-related");
    related.setAttribute("aria-label", "Tautan terkait panduan");
    related.append(node("h3", "", "Buka modul terkait"), link(article.targetLabel, article.target));
    related.append(node("h3", "", "Panduan terkait"));
    article.related.forEach((id) =>
    {
      const target = hub.source.articles.find((entry) => entry.id === id);
      related.append(link(target.title, `../staff/staff-help.html?article=${target.id}`));
    });
    layout.append(prose, related);
    section.append(layout, banner("Hal yang perlu diperhatikan", article.important, "warning"));
    hub.root.append(section);
    const support = hub.panel("Masih membutuhkan bantuan?", "Hubungi SuperAdmin atau penanggung jawab melalui kanal internal yang disepakati. Tidak ada pesan yang dikirim dari halaman ini.");
    support.append(node("p", "", "Sertakan waktu, halaman, langkah dan pesan kesalahan. Jangan menyertakan kata sandi, kode MFA atau data pelanggan yang tidak diperlukan."));
    const controls = node("div", "support-actions");
    controls.append(button("Salin format laporan", "copy-report"));
    const label = node("label", "sr-only", "Format laporan kendala");
    label.htmlFor = "support-report-draft";
    const draft = node("textarea", "support-draft");
    draft.id = "support-report-draft";
    draft.readOnly = true;
    draft.hidden = true;
    draft.value = `Topik: ${article.title}\nHalaman yang bermasalah:\nWaktu kejadian (WIB):\nLangkah yang dilakukan:\nPesan kesalahan:\nHasil yang diharapkan:\nHasil yang terjadi:\n\nJangan sertakan kata sandi, OTP, secret MFA atau data pelanggan yang tidak diperlukan.`;
    support.append(controls, label, draft);
    hub.root.append(support);
  }

  function render()
  {
    if (!Object.hasOwn(categories, hub.state.category))
    {
      hub.state.category = "all";
    }
    if (hub.state.article)
    {
      renderArticle();
    }
    else
    {
      renderList();
    }
  }

  function openArticle(control)
  {
    hub.navigate({ article: control.dataset.id });
  }

  function backHelp()
  {
    hub.navigate({ article: "" });
  }

  async function copyReport()
  {
    const draft = document.getElementById("support-report-draft");
    try
    {
      await navigator.clipboard.writeText(draft.value);
      hub.feedback("Format laporan disalin. Lengkapi sendiri sebelum mengirimnya melalui kanal internal.");
    }
    catch
    {
      draft.hidden = false;
      draft.focus();
      draft.select();
      hub.feedback("Salin otomatis belum tersedia. Format laporan ditampilkan agar dapat disalin manual.", true);
    }
  }

  hub.start(render,
  {
    "open-article": openArticle,
    "back-help": backHelp,
    "copy-report": copyReport
  });
})();
