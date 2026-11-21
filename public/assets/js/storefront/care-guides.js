"use strict";

(() =>
{
  const repository = window.RylvaCareGuidesRepository;
  const topicNames = window.RylvaCareGuidesData.topics;
  const form = document.getElementById("care-filters");
  const search = document.getElementById("care-search");
  const type = document.getElementById("care-type");
  const sort = document.getElementById("care-sort");
  const grid = document.getElementById("care-guides");
  const count = document.getElementById("care-count");
  const reset = document.getElementById("care-reset");
  const notice = document.getElementById("care-notice");
  const connection = document.getElementById("care-connection");
  let guides = [];
  let phase = "loading";
  let selectedTopic = "all";
  let partial = false;
  let invalidCount = 0;
  let missingGuide = false;
  let loading = false;
  let openedIds = new Set();

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

  function isValidGuide(guide)
  {
    return guide && /^[a-z0-9-]+$/.test(guide.id) && typeof guide.name === "string"
      && guide.name.trim() && typeof guide.scientificName === "string"
      && typeof guide.description === "string" && ["indoor", "outdoor"].includes(guide.type)
      && typeof guide.sourceName === "string" && validSource(guide.source)
      && Array.isArray(guide.topics) && guide.topics.every((topic) => Object.hasOwn(topicNames, topic))
      && Array.isArray(guide.sections) && guide.sections.length
      && guide.sections.every((section) => section && Object.hasOwn(topicNames, section.topic)
        && typeof section.text === "string" && section.text.trim());
  }

  function readUrl()
  {
    const parameters = new URLSearchParams(location.search);
    search.value = (parameters.get("q") || "").slice(0, 100);
    type.value = ["indoor", "outdoor"].includes(parameters.get("type")) ? parameters.get("type") : "all";
    sort.value = ["nameAsc", "nameDesc"].includes(parameters.get("sort")) ? parameters.get("sort") : "default";
    selectedTopic = Object.hasOwn(topicNames, parameters.get("topic")) ? parameters.get("topic") : "all";
    openedIds = new Set(parameters.getAll("guide"));
    if (location.hash.startsWith("#guide-"))
    {
      openedIds.add(location.hash.slice(7));
    }
    syncControls();
  }

  function syncControls()
  {
    form.querySelectorAll("[data-care-topic]").forEach((button) =>
    {
      button.setAttribute("aria-pressed", String(button.dataset.careTopic === selectedTopic));
    });
    reset.hidden = !search.value && type.value === "all" && selectedTopic === "all" && sort.value === "default";
  }

  function writeUrl()
  {
    const url = new URL(location.href);
    ["q", "type", "topic", "sort", "guide"].forEach((key) => url.searchParams.delete(key));
    if (search.value.trim())
    {
      url.searchParams.set("q", search.value.trim());
    }
    if (type.value !== "all")
    {
      url.searchParams.set("type", type.value);
    }
    if (selectedTopic !== "all")
    {
      url.searchParams.set("topic", selectedTopic);
    }
    if (sort.value !== "default")
    {
      url.searchParams.set("sort", sort.value);
    }
    openedIds.forEach((id) => url.searchParams.append("guide", id));
    history.replaceState(history.state, "", url);
  }

  function renderNotice()
  {
    const messages = [];
    if (partial || invalidCount)
    {
      messages.push("Sebagian panduan belum dapat ditampilkan. Panduan yang tersedia tetap dapat dibaca.");
    }
    if (missingGuide)
    {
      messages.push("Panduan pada tautan ini tidak ditemukan. Pilih ringkasan lain pada daftar atau reset pencarian.");
    }
    notice.textContent = messages.join(" ");
    notice.hidden = !messages.length;
  }

  function stateMarkup(title, description, action)
  {
    return `<li class="care-state">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(description)}</p>
      <div class="care-state-actions">${action}</div>
    </li>`;
  }

  function cardMarkup(guide)
  {
    const image = typeof guide.image === "string" && guide.image.startsWith("/assets/images/")
      ? `<img
          src="${escapeHtml(guide.image)}"
          alt="${escapeHtml(guide.name)}"
          width="112"
          height="150"
          loading="lazy"
        >`
      : "";
    const product = window.RylvaStorefrontProductPreviewData.products.find((item) => item.slug === guide.productSlug);
    return `<li class="care-card" id="guide-${guide.id}" aria-labelledby="care-title-${guide.id}">
      <div class="care-card-summary">
        <div class="care-photo">
          ${image}
          <span${image ? " hidden" : ""}>Foto belum tersedia</span>
        </div>
        <div class="care-card-content">
          <div class="care-identity">
            <h2 id="care-title-${guide.id}">${escapeHtml(guide.name)}</h2>
            <p class="care-scientific"><i lang="la">${escapeHtml(guide.scientificName)}</i></p>
          </div>
          <p class="care-description">${escapeHtml(guide.description)}</p>
          <a
            class="care-detail-link"
            data-care-detail="${guide.id}"
            href="/pages/public/care-guide-detail.html?guide=${encodeURIComponent(guide.id)}"
          >Baca panduan lengkap</a>
        </div>
      </div>
      <details data-guide-id="${guide.id}"${openedIds.has(guide.id) ? " open" : ""}>
        <summary aria-label="Baca ringkasan perawatan ${escapeHtml(guide.name)}">Baca ringkasan</summary>
        <div class="care-reading">
          <dl>
            ${guide.sections.map((section) => `<div>
              <dt>${escapeHtml(topicNames[section.topic])}</dt>
              <dd>${escapeHtml(section.text)}</dd>
            </div>`).join("\n")}
          </dl>
          <p class="care-source">
            Sumber: <a href="${escapeHtml(guide.source)}" target="_blank" rel="noopener noreferrer">${escapeHtml(guide.sourceName)} (bahasa Inggris, tab baru)</a>.
          </p>
          ${product ? `<a href="/pages/public/product-detail.html?product=${encodeURIComponent(product.slug)}" data-home-detail="${escapeHtml(product.slug)}">Lihat produk ${escapeHtml(product.name)}</a>` : ""}
        </div>
      </details>
    </li>`;
  }

  function normalized(value)
  {
    return value.normalize("NFKD").toLocaleLowerCase("id-ID").replace(/\p{Diacritic}/gu, "");
  }

  function render()
  {
    syncControls();
    if (phase !== "ready")
    {
      return;
    }
    const query = normalized(search.value.trim());
    const matches = guides.filter((guide) =>
    {
      const text = [guide.name, guide.scientificName, guide.description,
        ...guide.topics.map((topic) => topicNames[topic])].join(" ");
      return (!query || normalized(text).includes(query))
        && (type.value === "all" || guide.type === type.value)
        && (selectedTopic === "all" || guide.topics.includes(selectedTopic));
    });
    if (sort.value !== "default")
    {
      matches.sort((left, right) => left.name.localeCompare(right.name, "id-ID")
        * (sort.value === "nameDesc" ? -1 : 1));
    }
    count.textContent = `Menampilkan ${matches.length} dari ${guides.length} panduan`;
    if (!guides.length)
    {
      grid.innerHTML = stateMarkup("Panduan belum tersedia", "Silakan kembali lagi atau hubungi kami untuk menanyakan perawatan tanaman Anda.",
        '<a class="info-tombolutama" href="/pages/public/contact.html">Hubungi Kami</a>');
    }
    else if (!matches.length)
    {
      grid.innerHTML = stateMarkup("Panduan tidak ditemukan", "Coba nama tanaman lain atau reset pencarian dan filter untuk melihat semua panduan.",
        '<button class="info-tombolutama" type="button" data-care-reset>Reset Pencarian & Filter</button>');
    }
    else
    {
      grid.innerHTML = matches.map(cardMarkup).join("\n");
      grid.querySelectorAll("details").forEach((details) =>
      {
        details.addEventListener("toggle", () =>
        {
          if (details.open)
          {
            openedIds.add(details.dataset.guideId);
          }
          else
          {
            openedIds.delete(details.dataset.guideId);
          }
          writeUrl();
        });
      });
      grid.querySelectorAll("img").forEach((image) =>
      {
        const fail = () =>
        {
          image.hidden = true;
          image.nextElementSibling.hidden = false;
        };
        image.addEventListener("error", fail, { once: true });
        if (image.complete && !image.naturalWidth)
        {
          fail();
        }
      });
    }
    grid.setAttribute("aria-busy", "false");
    renderNotice();
  }

  function update()
  {
    missingGuide = false;
    render();
    writeUrl();
  }

  function restoreCareReading()
  {
    const context = history.state?.careDetailReturn;
    if (!context || context.url !== location.pathname + location.search)
    {
      return;
    }
    try
    {
      history.replaceState({ ...history.state, careDetailReturn: null }, "", location.href);
    }
    catch
    {
      // Browser history can still restore the viewport if state updates are blocked.
    }
    document.fonts.ready.then(() => requestAnimationFrame(() => requestAnimationFrame(() =>
    {
      [...grid.querySelectorAll("[data-care-detail]")]
        .find((link) => link.dataset.careDetail === context.id)?.focus({ preventScroll: true });
      scrollTo({ top: Number.isFinite(context.scroll) ? context.scroll : 0, behavior: "instant" });
    })));
  }

  function resetFilters()
  {
    search.value = "";
    type.value = "all";
    sort.value = "default";
    selectedTopic = "all";
    missingGuide = false;
    openedIds.clear();
    const url = new URL(location.href);
    url.hash = "";
    history.replaceState(history.state, "", url);
    update();
    search.focus({ preventScroll: true });
  }

  function updateConnection()
  {
    connection.hidden = navigator.onLine || phase !== "ready";
  }

  async function load(recover = false)
  {
    if (loading)
    {
      return;
    }
    loading = true;
    phase = "loading";
    count.textContent = "Memuat panduan perawatan…";
    grid.setAttribute("aria-busy", "true");
    notice.hidden = true;
    grid.innerHTML = '<li class="care-skeleton" aria-hidden="true"></li>'.repeat(4);
    try
    {
      const result = await repository.load({ recover });
      const ids = new Set();
      guides = result.guides.filter((guide) =>
      {
        if (!isValidGuide(guide) || ids.has(guide.id))
        {
          return false;
        }
        ids.add(guide.id);
        return true;
      });
      invalidCount = result.guides.length - guides.length;
      partial = result.partial;
      missingGuide = [...openedIds].some((id) => !ids.has(id));
      openedIds = new Set([...openedIds].filter((id) => ids.has(id)));
      phase = "ready";
      render();
      updateConnection();
      window.RylvaProductNavigation.restore();
      if (recover)
      {
        count.tabIndex = -1;
        count.focus({ preventScroll: true });
      }
    }
    catch (error)
    {
      phase = "error";
      const messages =
      {
        offline: ["Koneksi terputus", "Sambungkan kembali ke internet, lalu coba lagi. Pencarian dan filter Anda tetap tersimpan."],
        timeout: ["Pemuatan terlalu lama", "Panduan belum selesai dimuat. Coba lagi dengan pencarian dan filter yang sama."],
        maintenance: ["Panduan sementara tidak tersedia", "Silakan coba beberapa saat lagi atau hubungi kami bila membutuhkan bantuan."]
      };
      const message = messages[error.code] || ["Panduan belum dapat dimuat", "Coba lagi. Pencarian dan filter Anda tetap tersimpan."];
      count.textContent = "Daftar panduan belum tersedia";
      grid.innerHTML = stateMarkup(...message,
        '<button class="info-tombolutama" type="button" data-care-retry>Coba Lagi</button><a class="info-tombolsekunder" href="/pages/public/contact.html">Hubungi Kami</a>');
      grid.setAttribute("aria-busy", "false");
    }
    finally
    {
      loading = false;
    }
  }

  document.getElementById("care-fallback").hidden = true;
  form.hidden = false;
  document.getElementById("care-results").hidden = false;
  readUrl();
  form.addEventListener("submit", (event) =>
  {
    event.preventDefault();
    update();
  });
  search.addEventListener("input", update);
  type.addEventListener("change", update);
  sort.addEventListener("change", update);
  reset.addEventListener("click", resetFilters);
  form.addEventListener("click", (event) =>
  {
    const button = event.target.closest("[data-care-topic]");
    if (button)
    {
      selectedTopic = button.dataset.careTopic;
      update();
    }
  });
  grid.addEventListener("click", (event) =>
  {
    const detail = event.target.closest("[data-care-detail]");
    if (detail && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0)
    {
      writeUrl();
      const context = { url: location.pathname + location.search, scroll: scrollY, id: detail.dataset.careDetail };
      try
      {
        history.replaceState({ ...history.state, careDetailReturn: context }, "", location.href);
      }
      catch
      {
        // Native browser history and the URL still preserve list filters.
      }
      const target = new URL(detail.href);
      target.searchParams.set("returnTo", context.url);
      detail.href = target.pathname + target.search;
    }
    if (event.target.closest("[data-care-reset]"))
    {
      resetFilters();
    }
    if (event.target.closest("[data-care-retry]"))
    {
      load(true);
    }
    const link = event.target.closest("[data-home-detail]");
    if (link && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0)
    {
      event.preventDefault();
      writeUrl();
      window.RylvaProductNavigation.open(link.dataset.homeDetail);
    }
  });
  window.addEventListener("popstate", () =>
  {
    readUrl();
    render();
  });
  window.addEventListener("offline", updateConnection);
  window.addEventListener("online", updateConnection);
  window.addEventListener("pageshow", (event) =>
  {
    if (event.persisted)
    {
      updateConnection();
      window.RylvaProductNavigation.restore();
      restoreCareReading();
    }
  });
  load().then(() =>
  {
    if (location.hash.startsWith("#guide-"))
    {
      const card = document.getElementById(location.hash.slice(1));
      card?.querySelector("summary")?.focus({ preventScroll: true });
      card?.scrollIntoView({ block: "start" });
    }
    restoreCareReading();
  });
})();
