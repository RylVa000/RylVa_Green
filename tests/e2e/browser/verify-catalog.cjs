"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const baseUrl = process.env.RYLVA_CATALOG_URL || "http://127.0.0.1:4185";
const outputDirectory = path.resolve("storage/reports/catalog-interactions");

async function verifyCatalog()
{
  fs.mkdirSync(outputDirectory, { recursive: true });
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true
  });
  const page = await browser.newPage();
  const errors = [];
  const checks = [];
  page.on("pageerror", (error) => errors.push(error.message));

  async function open(query = "", width = 1440)
  {
    await page.setViewport({ width, height: width >= 768 ? 1000 : 844 });
    await page.goto(baseUrl + "/pages/public/catalog.html" + query, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.getElementById("catalog-products").getAttribute("aria-busy") === "false");
  }

  async function settle()
  {
    await page.evaluate(async () =>
    {
      await document.fonts.ready;
      document.querySelectorAll("img").forEach((image) => image.loading = "eager");
      await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
    });
  }

  async function replaceInput(selector, value)
  {
    await page.$eval(selector, (input, text) =>
    {
      input.value = text;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);
  }

  async function productIds()
  {
    return page.$$eval("#catalog-products .home-product", (cards) => cards.map((card) => card.dataset.productId));
  }

  async function waitForSheet()
  {
    await page.waitForSelector("#catalog-sheet[open]");
    await page.$eval("#catalog-sheet", async (sheet) =>
    {
      await Promise.all(sheet.getAnimations().map((animation) => animation.finished.catch(() => {})));
    });
  }

  async function capture(name, fullPage = false)
  {
    await settle();
    await page.screenshot({ path: path.join(outputDirectory, name + ".png"), fullPage });
  }

  try
  {
    for (const width of [1920, 1440, 1024, 768, 390, 320])
    {
      await open("", width);
      await settle();
      const layout = await page.evaluate(() =>
      ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        cards: document.querySelectorAll("#catalog-products .home-product").length,
        broken: [...document.images].filter((image) => !image.naturalWidth && !image.hidden).map((image) => image.src),
        clipped: [...document.querySelectorAll("#catalog-products .home-product-actions")].some((actions) =>
        {
          const card = actions.closest(".home-product").getBoundingClientRect();
          const rect = actions.getBoundingClientRect();
          return rect.right > card.right + 1 || rect.bottom > card.bottom + 1;
        })
      }));
      assert.equal(layout.overflow, false, "Horizontal overflow at " + width);
      assert.ok(layout.cards >= 6 && layout.cards <= 8, "Expected the initial batch or auto-appended collection");
      assert.equal(layout.clipped, false, "Clipped action at " + width);
      assert.deepEqual(layout.broken, []);
      await capture("catalog-" + width, true);
      if (width === 320)
      {
        await page.click('[data-catalog-sheet="filter"]');
        await waitForSheet();
        assert.equal(await page.$eval("#catalog-sheet-scroll", (element) => element.scrollWidth > element.clientWidth), false);
        await capture("catalog-filter-320");
        await page.keyboard.press("Escape");
        await page.waitForFunction(() => !document.getElementById("catalog-sheet").open);
      }

    }
    checks.push("Six viewports 320–1920px: six cards, local images, no horizontal overflow or clipped actions");

    await open();
    await replaceInput("#storefront-search-input", "Monstera");
    assert.deepEqual(await productIds(), ["example-monstera"]);
    await new Promise((resolve) => setTimeout(resolve, 450));
    assert.match(page.url(), /q=Monstera/);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.querySelectorAll("#catalog-products .home-product").length === 1);
    assert.equal(await page.$eval("#storefront-search-input", (input) => input.value), "Monstera");
    await page.click('[data-catalog-action="reset"]');
    await page.click('[name="category"][value="plants"]');
    await replaceInput("#catalog-min-price", "100.000");
    await replaceInput("#catalog-max-price", "200.000");
    assert.deepEqual(await productIds(), ["example-peace-lily", "example-aglaonema"]);
    await capture("catalog-filtered");
    await replaceInput("#catalog-min-price", "300000");
    assert.equal(await page.$eval("#catalog-price-error", (element) => element.hidden), false);
    assert.equal(await page.$eval("#catalog-min-price", (input) => input.getAttribute("aria-invalid")), "true");
    assert.equal((await productIds()).length, 2, "Invalid range keeps the last valid result set");
    await replaceInput("#catalog-min-price", "abc");
    assert.match(await page.$eval("#catalog-price-error", (element) => element.textContent), /angka/);
    await page.click('[data-catalog-action="reset"]');
    assert.equal(await page.$eval("#catalog-price-error", (element) => element.hidden), true);
    checks.push("Live search, reloadable URL, category and rupiah range filters, invalid range recovery and Reset");

    await page.click('[name="discount"][value="10"]');
    assert.deepEqual(await productIds(), ["example-monstera", "example-snake-plant"]);
    await page.click('[data-catalog-action="reset"]');
    await page.select("#catalog-sort", "price_asc");
    const lowPrices = await productIds();
    assert.deepEqual(lowPrices.slice(0, 3), ["example-petunia", "example-dracaena", "example-sirih-gading"]);
    await page.select("#catalog-sort", "price_desc");
    assert.equal((await productIds())[0], "example-monstera");
    await page.click('[data-catalog-action="reset"]');
    await page.click('[name="category"][value="pots"]');
    assert.equal((await productIds()).length, 0);
    assert.match(await page.$eval("#catalog-products", (element) => element.textContent), /Belum ada produk yang sesuai/);
    await page.click('[name="category"][value="plants"]');
    assert.equal((await productIds()).length, 6, "Multiple categories use inclusive OR");
    checks.push("Accurate discount thresholds, price sorting, empty category recovery, multi-category matching");

    await open();
    const firstCard = await page.$("#catalog-products .home-product");
    await page.$eval("#catalog-scroll-sentinel", (element) => element.scrollIntoView({ block: "center" }));
    await page.waitForFunction(() => document.querySelectorAll("#catalog-products .home-product").length === 8);
    assert.equal(await firstCard.evaluate((element) => element.isConnected), true, "Append preserves existing card nodes");
    assert.equal(await page.$eval("#catalog-list-end", (element) => element.hidden), false);
    assert.equal(await page.$eval("#catalog-scroll-sentinel", (element) => element.hidden), true);
    assert.equal(await page.$("#catalog-pagination"), null);
    assert.match(page.url(), /loaded=8/);
    const detailSelector = '#catalog-products [data-home-detail="dracaena"]';
    await page.$eval(detailSelector, (button) => button.scrollIntoView({ block: "center" }));
    const scrollBeforeDetail = await page.evaluate(() => scrollY);
    await page.click(detailSelector);
    await page.waitForSelector("#product-title");
    assert.match(page.url(), /product-detail.html/);
    assert.match(page.url(), /product=dracaena/);
    await page.click("[data-product-back]");
    await page.waitForFunction(() => document.querySelectorAll("#catalog-products .home-product").length === 8);
    await page.waitForFunction(() => document.activeElement.dataset.homeDetail === "dracaena");
    assert.match(page.url(), /loaded=8/);
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - scrollBeforeDetail) <= 2);
    await page.goForward({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("#product-title");
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.querySelectorAll("#catalog-products .home-product").length === 8);
    assert.equal((await productIds()).length, 8);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.querySelectorAll("#catalog-products .home-product").length === 8);
    checks.push("Infinite scroll appends unique products without replacing cards, stops at collection end, restores loaded count, scroll and detail focus through history/reload");

    await page.evaluate(() => window.scrollTo(0, 320));
    const sticky = await page.$eval("#catalog-filter-panel", (element) =>
    {
      const rect = element.getBoundingClientRect();
      const scroller = element.querySelector("#catalog-filters");
      return { top: rect.top, height: rect.height, scrollHeight: scroller.scrollHeight, clientHeight: scroller.clientHeight,
        position: getComputedStyle(element).position, overflowY: getComputedStyle(scroller).overflowY,
        headerBottom: document.querySelector(".storefront-header").getBoundingClientRect().bottom };
    });
    assert.equal(sticky.position, "sticky");
    assert.equal(sticky.overflowY, "auto");
    assert.ok(Math.abs(sticky.top - sticky.headerBottom - 16) <= 2, "Desktop rail pins below the sticky navbar");
    assert.ok(sticky.scrollHeight > sticky.clientHeight, "Long filters scroll inside the rail");
    await page.$eval("#catalog-filters", (element) => element.scrollTop = element.scrollHeight);
    const stockBounds = await page.$eval('[name="available"]', (element) => element.getBoundingClientRect().bottom);
    assert.ok(stockBounds <= 1000, "Last filter remains reachable inside sticky rail");
    const railHeader = await page.$eval("#catalog-filter-panel", (element) =>
    {
      const heading = element.querySelector(".catalog-filter-heading");
      const form = element.querySelector("#catalog-filters");
      return { outsideForm: !form.contains(heading), headingBottom: heading.getBoundingClientRect().bottom,
        formTop: form.getBoundingClientRect().top };
    });
    assert.equal(railHeader.outsideForm, true);
    assert.ok(railHeader.formTop >= railHeader.headingBottom, "Scrolled options cannot paint above the fixed rail heading");
    await capture("catalog-sticky");
    checks.push("Desktop filter sticks to viewport and all filter sections remain reachable in its own scroller");

    const fallbackPage = await browser.newPage();
    fallbackPage.on("pageerror", (error) => errors.push(error.message));
    try
    {
      await fallbackPage.evaluateOnNewDocument(() =>
      {
        Object.defineProperty(window, "IntersectionObserver", { value: undefined, configurable: true });
      });
      await fallbackPage.setViewport({ width: 1440, height: 1000 });
      await fallbackPage.goto(baseUrl + "/pages/public/catalog.html", { waitUntil: "domcontentloaded" });
      await fallbackPage.waitForFunction(() => document.getElementById("catalog-products").getAttribute("aria-busy") === "false");
      await fallbackPage.click('[data-catalog-action="load-more"]');
      await fallbackPage.waitForFunction(() => document.querySelectorAll("#catalog-products .home-product").length === 8);
      assert.equal(await fallbackPage.$$eval("#catalog-products .home-product", (cards) => new Set(cards.map((card) => card.dataset.productId)).size), 8);
      assert.equal(await fallbackPage.evaluate(() => document.activeElement.dataset.homeDetail), "dracaena");
    }
    finally
    {
      await fallbackPage.close();
    }
    checks.push("Accessible load-more fallback works without IntersectionObserver, avoids duplicates and focuses the first appended product");

    await open("?preview=catalog&state=normal");
    await page.click('#catalog-products [data-home-save="peace-lily"]');
    assert.equal(await page.$eval('[data-home-save="peace-lily"]', (button) => button.getAttribute("aria-pressed")), "true");
    await page.click('header [data-storefront-page="Wishlist"]');
    await page.waitForSelector("#home-wishlist-panel:not([hidden])");
    await page.click("[data-header-wishlist-all]");
    await page.waitForFunction(() => document.getElementById("wishlist-products")?.getAttribute("aria-busy") === "false");
    assert.equal(await page.$eval('[data-home-save="peace-lily"]', (button) => button.getAttribute("aria-pressed")), "true");
    await page.click('#wishlist-products [data-home-save="peace-lily"]');
    await page.waitForFunction(() => !window.RylvaWishlistStore.has("example-peace-lily"));
    assert.match(await page.$eval("#wishlist-products", (element) => element.textContent), /Wishlist masih kosong/);
    checks.push("Shared Wishlist navigation, persistent guest membership, removal and empty recovery");

    await open("?preview=catalog&state=normal");
    const initialCount = Number(await page.$eval(".storefront-cart-count", (element) => element.textContent));
    await page.evaluate(() =>
    {
      const button = document.querySelector('[data-home-add="peace-lily"]');
      button.click();
      button.click();
    });
    await page.waitForFunction((count) => Number(document.querySelector(".storefront-cart-count").textContent) === count + 1, {}, initialCount);
    assert.match(await page.$eval("#home-toast", (element) => element.textContent), /keranjang contoh/);
    await page.setOfflineMode(true);
    await page.click('[data-home-add="monstera"]');
    assert.match(await page.$eval("#home-toast", (element) => element.textContent), /Koneksi terputus/);
    assert.equal((await productIds()).length, 6);
    await page.setOfflineMode(false);
    checks.push("Cart badge, duplicate submission prevention, truthful preview confirmation, offline preserves cards");

    for (const state of ["loadError", "offline", "timeout", "maintenance"])
    {
      await open("?preview=catalog&state=" + state + "&q=Monstera");
      assert.equal((await productIds()).length, 0);
      assert.equal(await page.$eval("#storefront-search-input", (input) => input.value), "Monstera");
      await page.click('[data-catalog-action="retry"]');
      await page.waitForFunction(() => document.querySelectorAll("#catalog-products .home-product").length === 1);
      assert.deepEqual(await productIds(), ["example-monstera"]);
    }
    checks.push("Load error, offline, timeout and maintenance retry preserve search and recover");

    for (const state of ["empty", "partial", "unavailable", "invalidPrice", "brokenImage", "longContent"])
    {
      await open("?preview=catalog&state=" + state);
      await settle();
      if (state === "empty")
      {
        assert.match(await page.$eval("#catalog-products", (element) => element.textContent), /Koleksi belum tersedia/);
      }
      if (["partial", "invalidPrice", "unavailable"].includes(state))
      {
        assert.equal(await page.$eval('[data-home-add="peace-lily"]', (button) => button.disabled), true);
      }
      if (state === "brokenImage")
      {
        assert.ok(await page.$("[data-image-failed]"));
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await capture("catalog-state-" + state);
    }
    checks.push("Empty, partial price data, unavailable product, invalid price, image fallback and long content render safely");

    for (const state of ["addError", "conflict", "rateLimited"])
    {
      await open("?preview=catalog&state=" + state);
      await page.click('[data-home-add="peace-lily"]');
      await page.waitForSelector('#home-toast[role="alert"]');
      await page.waitForFunction(() => !document.querySelector('[data-home-add="peace-lily"]').disabled);
      await page.click('[data-home-add="peace-lily"]');
      await page.waitForFunction(() => document.getElementById("home-toast").textContent.includes("ditambahkan"));
    }
    checks.push("Cart failure, revision conflict and rate limit expose recovery and allow a successful retry");

    await open();
    await page.click('header [data-storefront-page="Tanaman Hias"]');
    assert.match(page.url(), /category=plants/);
    await page.goBack({ waitUntil: "domcontentloaded" });
    assert.equal(await page.$eval('[name="category"][value="plants"]', (input) => input.checked), false);
    await open("?preview=catalog&state=normal");
    await page.evaluate(async () =>
    {
      const repository = window.RylvaHomepagePreviewRepository;
      const snapshot = await repository.readCart();
      for (const item of snapshot.items)
      {
        await repository.remove(item.lineId);
      }
    });
    await page.click('header [data-storefront-page="Keranjang"]');
    await page.waitForSelector('[data-header-browse]');
    await page.click('[data-header-browse]');
    const browsedIds = await productIds();
    assert.ok([6, 8].includes(browsedIds.length), "Browse shows the initial batch or the automatically appended collection");
    assert.equal(new Set(browsedIds).size, browsedIds.length);
    assert.equal(await page.evaluate(() => document.activeElement.id), "catalog-result-count");
    checks.push("Category navigation Back restores the prior selection; empty header cart Browse returns to the catalog without errors");

    await open("?preview=catalog&state=loading");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.reload({ waitUntil: "domcontentloaded" });
    assert.equal(await page.$eval("#catalog-products", (element) => element.getAttribute("aria-busy")), "true");
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains("skip-link")), true);
    assert.equal(await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle), "solid");
    await page.waitForFunction(() => document.getElementById("catalog-products").getAttribute("aria-busy") === "false");
    assert.equal(await page.$eval(".home-product", (element) => getComputedStyle(element).transitionDuration), "0s");
    checks.push("Initial loading, keyboard skip link and reduced motion remain available");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    await open("", 390);
    assert.equal(await page.$eval("#catalog-filter-panel", (element) => getComputedStyle(element).display), "none");
    assert.equal(await page.$("#catalog-filter-panel > summary"), null);
    await page.click('[data-catalog-sheet="filter"]');
    await waitForSheet();
    await new Promise((resolve) => setTimeout(resolve, 300));
    const sheetGeometry = await page.evaluate(() =>
    {
      const sheet = document.getElementById("catalog-sheet").getBoundingClientRect();
      const scroll = document.getElementById("catalog-sheet-scroll");
      const scrollBounds = scroll.getBoundingClientRect();
      return { bottom: sheet.bottom, width: sheet.width, viewport: innerHeight,
        overflow: scroll.scrollWidth > scroll.clientWidth,
        formCount: document.querySelectorAll("#catalog-filters").length,
        ownsForm: document.getElementById("catalog-sheet-form-slot").contains(document.getElementById("catalog-filters")),
        clippedChoices: [...scroll.querySelectorAll(".catalog-choice")].some((element) => element.getBoundingClientRect().right > scrollBounds.right + 1) };
    });
    assert.equal(sheetGeometry.width, 390);
    assert.ok(Math.abs(sheetGeometry.bottom - sheetGeometry.viewport) < 2);
    assert.equal(sheetGeometry.overflow, false);
    assert.equal(sheetGeometry.clippedChoices, false);
    assert.equal(sheetGeometry.formCount, 1);
    assert.equal(sheetGeometry.ownsForm, true);
    await capture("catalog-mobile-filter");
    await page.click('[data-filter-section="price"]');
    await page.waitForFunction(() => Math.abs(document.getElementById("catalog-group-price").getBoundingClientRect().top
      - document.getElementById("catalog-sheet-scroll").getBoundingClientRect().top) < 3);
    await replaceInput("#catalog-min-price", "100000");
    await replaceInput("#catalog-max-price", "200000");
    assert.deepEqual(await productIds(), ["example-peace-lily", "example-aglaonema"]);
    assert.equal(await page.$eval("#catalog-sheet-results", (button) => button.textContent), "Lihat 2 Produk");
    await capture("catalog-mobile-filter-price");
    await page.click('[data-catalog-sheet-results]');
    await page.waitForFunction(() => !document.getElementById("catalog-sheet").open);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.catalogSheet), "filter");
    assert.equal(await page.$eval("#catalog-filter-panel", (element) => element.contains(document.getElementById("catalog-filters"))), true);
    assert.match(page.url(), /min_price=100000/);
    checks.push("Mobile icon opens a bounded bottom sheet with one shared form, section navigation, live result counts, immediate filters and focus restoration");

    await page.click('[data-catalog-sheet="filter"]');
    await waitForSheet();
    assert.equal(await page.$eval("#catalog-max-price", (input) => input.value), "200000");
    await replaceInput("#catalog-filter-search", "pot");
    assert.equal(await page.$$eval('.catalog-choice:not([hidden])', (labels) => labels.length), 1);
    await replaceInput("#catalog-filter-search", "zzfilter");
    assert.equal(await page.$eval("#catalog-filter-search-empty", (element) => element.hidden), false);
    await replaceInput("#catalog-filter-search", "");
    await page.focus("#catalog-sheet-results");
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.hasAttribute("data-catalog-sheet-close")), true);
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.getElementById("catalog-sheet").open);
    assert.match(page.url(), /max_price=200000/);
    assert.equal(await page.evaluate(() => document.body.classList.contains("catalog-sheet-open")), false);
    checks.push("Filter search and empty search, native focus containment, Escape and retained selections work without duplicated fields");

    await page.click('[data-catalog-sheet="sort"]');
    await waitForSheet();
    await new Promise((resolve) => setTimeout(resolve, 300));
    await capture("catalog-mobile-sort");
    await page.click('[name="catalog-sheet-sort"][value="price_desc"]');
    await page.waitForFunction(() => !document.getElementById("catalog-sheet").open);
    assert.deepEqual(await productIds(), ["example-aglaonema", "example-peace-lily"]);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.catalogSheet), "sort");
    await page.click('[data-catalog-sheet="sort"]');
    await waitForSheet();
    await page.click('[data-catalog-sheet-reset]');
    assert.equal(await page.$eval("#catalog-sort", (select) => select.value), "featured");
    assert.equal(await page.$eval("#catalog-min-price", (input) => input.value), "100000");
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => !document.getElementById("catalog-sheet").open);
    assert.deepEqual(await productIds(), ["example-peace-lily", "example-aglaonema"]);
    checks.push("Sort sheet applies immediately, closes and restores focus; sort Reset preserves filters, and browser Back closes the sheet");

    await page.click('[data-catalog-sheet="filter"]');
    await waitForSheet();
    await replaceInput("#catalog-min-price", "300000");
    await page.click('[data-catalog-sheet-results]');
    assert.equal(await page.$eval("#catalog-sheet", (element) => element.open), true);
    assert.equal(await page.evaluate(() => document.activeElement.id), "catalog-min-price");
    await page.click('[data-catalog-sheet-reset]');
    assert.equal(await page.$eval("#catalog-price-error", (element) => element.hidden), true);
    await page.setViewport({ width: 1440, height: 1000 });
    await page.waitForFunction(() => !document.getElementById("catalog-sheet").open);
    assert.equal(await page.$eval("#catalog-filter-panel", (element) => element.contains(document.getElementById("catalog-filters"))), true);
    assert.equal(await page.evaluate(() => document.body.classList.contains("catalog-sheet-open")), false);
    checks.push("Invalid price keeps the sheet open with focused error recovery; Reset and resize restore the same form to the desktop rail");

    await open("", 390);
    await page.click('[data-catalog-sheet="filter"]');
    await waitForSheet();
    await page.click('#catalog-sheet [name="category"][value="plants"]');
    await page.waitForFunction(() => location.search.includes("category=plants"));
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.getElementById("catalog-products").getAttribute("aria-busy") === "false");
    assert.equal(await page.evaluate(() => Boolean(history.state?.catalogSheet)), false);
    await page.click('[data-catalog-sheet="filter"]');
    await waitForSheet();
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.getElementById("catalog-sheet").open);
    await page.goForward({ waitUntil: "domcontentloaded" });
    await waitForSheet();
    await page.setViewport({ width: 1440, height: 1000 });
    await page.waitForFunction(() => !document.getElementById("catalog-sheet").open);
    await page.goForward({ waitUntil: "domcontentloaded" });
    assert.equal(await page.evaluate(() => Boolean(history.state?.catalogSheet)), false);
    await page.setViewport({ width: 390, height: 844 });
    await page.click('[data-catalog-sheet="filter"]');
    await waitForSheet();
    await page.click('[data-catalog-sheet-close]');
    await page.waitForFunction(() => !document.getElementById("catalog-sheet").open);
    assert.match(page.url(), /category=plants/);
    checks.push("Reload and browser Forward across desktop/mobile cannot leave a stale sheet history marker or trap reopening/closing");

    await open();
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.getElementById("catalog-products").getAttribute("aria-busy") === "false");
    await page.click('[data-home-add="peace-lily"]');
    await page.waitForFunction(() => document.getElementById("home-toast").textContent.includes("ditambahkan"));
    await page.goto(baseUrl + "/pages/customer/cart.html", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.body.textContent.includes("Peace Lily"));
    checks.push("Catalog additions persist through the existing cart adapter and appear on the Cart page");

    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(outputDirectory, "verification.json"), JSON.stringify({ checks, errors }, null, 2));
    console.log(JSON.stringify({ passed: checks.length, checks, errors }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyCatalog().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
