"use strict";

(() =>
{
  const parameters = new URLSearchParams(location.search);
  const guideId = parameters.get("guide");
  const content = document.getElementById("care-detail-content");
  const notice = document.getElementById("care-detail-notice");
  const connection = document.getElementById("care-detail-connection");
  const returnLink = document.getElementById("care-detail-return");
  const topics = window.RylvaCareGuidesData.topics;
  let loading = false;
  let ready = false;

  function escapeHtml(value)
  {
    return String(value).replace(/[&<>"']/g, (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function validSource(value)
  {
    try
    {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password
        && ["plants.ces.ncsu.edu", "gardeningsolutions.ifas.ufl.edu"].includes(url.hostname);
    }
    catch
    {
      return false;
    }
  }

  function validGuide(guide)
  {
    return [guide.name, guide.scientificName, guide.description, guide.sourceName]
      .every((value) => typeof value === "string" && value.trim())
      && validSource(guide.source) && Array.isArray(guide.sections) && guide.sections.length
      && guide.sections.every((section) => Object.hasOwn(topics, section.topic)
        && typeof section.text === "string" && section.text.trim());
  }

  function setReturnLink()
  {
    try
    {
      const source = new URL(parameters.get("returnTo") || "", location.origin);
      if (source.origin === location.origin && !source.username && !source.password
        && source.pathname === "/pages/public/care-guides.html")
      {
        returnLink.href = source.pathname + source.search;
      }
    }
    catch
    {
      // Untrusted return paths use the native list link.
    }
  }

  function updateConnection()
  {
    connection.hidden = navigator.onLine || !ready;
  }

  function articleMarkup(guide, article)
  {
    const blocks =
    [
      { id: "perawatan", title: "Perawatan sehari-hari", text: article?.care },
      { id: "pertumbuhan", title: "Tempat tumbuh & pertumbuhan", text: article?.growth },
      { id: "pengamatan", title: article?.observationTitle || "Hal yang perlu diamati", text: article?.observation }
    ].filter((block) => typeof block.text === "string" && block.text.trim());
    const image = typeof guide.image === "string" && guide.image.startsWith("/assets/images/")
      ? `<img src="${escapeHtml(guide.image)}" alt="${escapeHtml(guide.name)}" width="320" height="320" fetchpriority="high">` : "";
    const product = window.RylvaStorefrontProductPreviewData.products.find((item) => item.slug === guide.productSlug);
    const sections = [...blocks, { id: "sumber", title: "Sumber panduan" }];
    if (product)
    {
      sections.push({ id: "produk-terkait", title: "Produk terkait" });
    }
    return { partial: blocks.length < 3, markup: `
      <section class="care-detail-overview" aria-labelledby="care-overview-title">
        <div class="care-detail-photo">
          ${image}
          <span${image ? " hidden" : ""}>Foto belum tersedia</span>
        </div>
        <div>
          <h2 id="care-overview-title">Kebutuhan ${escapeHtml(guide.name)}</h2>
          <p class="care-scientific"><i lang="la">${escapeHtml(guide.scientificName)}</i></p>
          <dl class="care-detail-needs">
            ${guide.sections.map((section) => `<div>
              <dt>${escapeHtml(topics[section.topic])}</dt>
              <dd>${escapeHtml(section.text)}</dd>
            </div>`).join("\n")}
          </dl>
        </div>
      </section>
      <div class="shipping-reading-layout">
        <aside class="shipping-sidebar" aria-label="Navigasi artikel">
          <details class="shipping-toc" id="care-detail-toc" open>
            <summary>Di halaman ini</summary>
            <nav aria-label="Bagian panduan">
              ${sections.map((section) => `<a href="#${section.id}">${escapeHtml(section.title)}</a>`).join("\n")}
            </nav>
          </details>
        </aside>
        <article class="shipping-article" aria-label="Panduan perawatan ${escapeHtml(guide.name)}">
          ${blocks.map((block) => `<section class="shipping-section" id="${block.id}" tabindex="-1" aria-labelledby="${block.id}-title">
            <h2 id="${block.id}-title">${escapeHtml(block.title)}</h2>
            <p>${escapeHtml(block.text)}</p>
          </section>`).join("\n")}
          <section class="shipping-section" id="sumber" tabindex="-1" aria-labelledby="care-source-title">
            <h2 id="care-source-title">Sumber panduan</h2>
            <p>Panduan ini merangkum kebutuhan umum spesies atau genus. Sesuaikan dengan kultivar, media, dan kondisi tempat tumbuh tanaman Anda.</p>
            <a class="care-source-link" href="${escapeHtml(guide.source)}" target="_blank" rel="noopener noreferrer">${escapeHtml(guide.sourceName)} (bahasa Inggris, tab baru)</a>
          </section>
          ${product ? `<section class="shipping-section" id="produk-terkait" tabindex="-1" aria-labelledby="care-product-title">
            <h2 id="care-product-title">Produk terkait</h2>
            <p>${escapeHtml(product.name)}</p>
            <a class="info-tombolsekunder" data-home-detail="${escapeHtml(product.slug)}" href="/pages/public/product-detail.html?product=${encodeURIComponent(product.slug)}">Lihat Detail Produk</a>
          </section>` : ""}
        </article>
      </div>
      <aside class="care-help" aria-labelledby="care-detail-help-title">
        <h2 id="care-detail-help-title">Ada pertanyaan tentang tanaman Anda?</h2>
        <p>Ceritakan kondisi daun, media, dan tempat tumbuhnya agar pertanyaan perawatan lebih mudah dipahami.</p>
        <a class="info-tombolsekunder" href="/pages/public/contact.html">Tanyakan Perawatan</a>
      </aside>` };
  }

  function renderError(code)
  {
    const messages =
    {
      notFound: ["Panduan tidak ditemukan", "Tautan ini belum mengarah ke panduan yang tersedia. Pilih tanaman dari daftar panduan."],
      invalidData: ["Isi panduan belum tersedia", "Panduan ini belum dapat ditampilkan dengan lengkap. Pilih panduan lain atau hubungi kami."],
      offline: ["Koneksi terputus", "Sambungkan kembali ke internet, lalu coba lagi. Tautan panduan Anda tetap dipertahankan."],
      timeout: ["Pemuatan terlalu lama", "Panduan belum selesai dimuat. Coba lagi atau kembali ke daftar panduan."],
      maintenance: ["Panduan sementara tidak tersedia", "Silakan coba beberapa saat lagi atau hubungi kami bila membutuhkan bantuan."]
    };
    const [title, description] = messages[code] || ["Panduan belum dapat dimuat", "Coba lagi atau pilih panduan lain dari daftar."];
    const canRetry = !["notFound", "invalidData"].includes(code);
    content.innerHTML = `<section class="care-state" aria-labelledby="care-detail-state-title">
      <h2 id="care-detail-state-title">${title}</h2>
      <p>${description}</p>
      <div class="care-state-actions">
        ${canRetry ? '<button class="info-tombolutama" type="button" data-care-detail-retry>Coba Lagi</button>' : '<a class="info-tombolutama" href="/pages/public/care-guides.html">Lihat Daftar Panduan</a>'}
        <a class="info-tombolsekunder" href="/pages/public/contact.html">Hubungi Kami</a>
      </div>
    </section>`;
  }

  async function load(recover = false)
  {
    if (loading)
    {
      return;
    }
    loading = true;
    content.setAttribute("aria-busy", "true");
    content.innerHTML = '<div class="care-detail-loading" role="status">Memuat panduan perawatan…</div>';
    notice.hidden = true;
    try
    {
      if (!guideId || !/^[a-z0-9-]{1,80}$/.test(guideId))
      {
        throw Object.assign(new Error("ID panduan tidak valid."), { code: "notFound" });
      }
      const { guide, article, partial } = await window.RylvaCareGuideDetailRepository.load(guideId, { recover });
      if (!validGuide(guide))
      {
        throw Object.assign(new Error("Data panduan belum lengkap."), { code: "invalidData" });
      }
      const result = articleMarkup(guide, article);
      document.getElementById("care-detail-title").textContent = "Perawatan " + guide.name;
      document.getElementById("care-detail-intro").textContent = guide.description;
      document.getElementById("care-detail-crumb").textContent = guide.name;
      document.title = "Perawatan " + guide.name + " | RylVa Green";
      content.innerHTML = result.markup;
      if (partial || result.partial)
      {
        notice.textContent = "Sebagian isi panduan belum tersedia. Kebutuhan dasar dan sumber yang tersedia tetap dapat dibaca.";
        notice.hidden = false;
      }
      const image = content.querySelector(".care-detail-photo img");
      const handleImageFailure = () =>
      {
        image.hidden = true;
        image.nextElementSibling.hidden = false;
      };
      image?.addEventListener("error", handleImageFailure, { once: true });
      if (image?.complete && !image.naturalWidth)
      {
        handleImageFailure();
      }
      const returning = Boolean(history.state?.productReturn)
        || performance.getEntriesByType("navigation")[0]?.type === "back_forward";
      const reading = history.state?.careDetailReading;
      window.RylvaInformationArticle.init(
      {
        tocId: "care-detail-toc",
        returnId: "care-detail-return",
        depthKey: "careDetailDepth",
        readingKey: "careDetailReading",
        returnSources: [{ path: "/pages/public/care-guides.html", label: "Kembali ke Daftar Panduan" }]
      });
      ready = true;
      await document.fonts.ready;
      if (returning && reading)
      {
        document.getElementById("care-detail-toc").open = reading.tocOpen;
      }
      window.RylvaProductNavigation.restore();
      if (location.hash && !returning)
      {
        document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: "start", behavior: "instant" });
      }
      if (recover)
      {
        const heading = document.getElementById("care-overview-title");
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    }
    catch (error)
    {
      renderError(error.code);
    }
    finally
    {
      loading = false;
      content.setAttribute("aria-busy", "false");
      updateConnection();
    }
  }

  setReturnLink();
  document.getElementById("care-detail-fallback").hidden = true;
  content.hidden = false;
  content.addEventListener("click", (event) =>
  {
    if (event.target.closest("[data-care-detail-retry]"))
    {
      load(true);
    }
    const product = event.target.closest("[data-home-detail]");
    if (product && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey)
    {
      event.preventDefault();
      window.RylvaProductNavigation.open(product.dataset.homeDetail);
    }
  });
  window.addEventListener("offline", updateConnection);
  window.addEventListener("online", updateConnection);
  load();
})();
