"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_INFORMATION_URL || "http://127.0.0.1:4185";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/category-products");

async function verifyCategoryProducts()
{
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  const browser = await runtime.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true,
    userDataDir: path.join(OUTPUT_DIRECTORY, "chrome-verification")
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  const checks = [];
  const errors = [];
  const failedResources = [];
  const writes = [];
  const captures = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) =>
  {
    if (!["GET", "HEAD"].includes(request.method()))
    {
      writes.push(request.method() + " " + request.url());
    }
  });
  page.on("response", (response) =>
  {
    if (response.request().resourceType() !== "document" && response.url().startsWith(BASE_URL)
      && response.status() >= 400 && !/favicon|missing-example|category-image-missing/.test(response.url()))
    {
      failedResources.push(response.url());
    }
  });

  async function open(query = "?category=plants", width = 1440, ready = true)
  {
    await page.setViewport({ width, height: 1000 });
    await page.goto(BASE_URL + "/pages/public/category.html" + query, { waitUntil: "networkidle0" });
    await page.waitForFunction(() => Boolean(window.RylvaCategoryPage));
    if (ready && await page.evaluate(() => Boolean(window.RylvaCategoryPage.category)))
    {
      await page.waitForFunction(() => document.getElementById("catalog-products").getAttribute("aria-busy") === "false");
    }
    await page.evaluate(() => document.fonts.ready);
  }

  async function capture(name, fullPage = true)
  {
    await page.evaluate(async () =>
    {
      window.scrollTo({ top: 0, behavior: "instant" });
      document.querySelectorAll("img").forEach((image) => image.loading = "eager");
      await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
    });
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, name), fullPage });
    captures.push(name);
  }

  async function input(selector, value)
  {
    await page.$eval(selector, (element, text) =>
    {
      element.value = text;
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);
  }

  async function follow(selector)
  {
    await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" }), page.click(selector)]);
  }

  async function reset()
  {
    await page.$eval('[data-catalog-action="reset"]', (button) => button.click());
  }

  try
  {
    for (const width of [1920, 1440, 1024, 768, 390, 320])
    {
      await open("?category=plants", width);
      const layout = await page.evaluate(() =>
      {
        const main = document.getElementById("home-main");
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          heading: document.querySelector("h1").textContent,
          headingCount: main.querySelectorAll("h1").length,
          image: document.getElementById("category-image").naturalWidth > 0,
          fonts: [400, 500, 600, 700].every((weight) => document.fonts.check(weight + ' 16px "Poppins"')),
          current: document.querySelector('.category-navigation [aria-current="page"]').dataset.categoryChoice,
          clipped: [...main.querySelectorAll(".home-product-actions")].some((actions) =>
          {
            const card = actions.closest(".home-product").getBoundingClientRect();
            const bounds = actions.getBoundingClientRect();
            return bounds.right > card.right + 1 || bounds.bottom > card.bottom + 1;
          })
        };
      });
      assert.deepEqual(layout, { overflow: false, heading: "Tanaman Hias", headingCount: 1,
        image: true, fonts: true, current: "plants", clipped: false });
      assert.equal(await page.$$eval('[data-catalog-remove="category"]', (items) => items.length), 0);
      await capture("plants-" + width + ".png");
      checks.push("Category identity, fonts, imagery, fixed selection and unclipped cards at " + width);
    }

    await open("?category=plants&q=monstera&sort=price_asc&max_price=300000");
    assert.equal(await page.$$eval("#catalog-products .home-product", (cards) => cards.length), 1);
    await capture("plants-filtered-1440.png");
    await input("#catalog-min-price", "400000");
    assert.equal(await page.$eval("#catalog-price-error", (message) => message.hidden), false);
    await reset();
    assert.equal(new URL(page.url()).searchParams.get("category"), "plants");
    assert.equal(new URL(page.url()).searchParams.has("q"), false);
    assert.equal(await page.$eval("#catalog-sort", (select) => select.value), "featured");
    await input("#storefront-search-input", "does-not-exist");
    assert.match(await page.$eval("#catalog-products", (grid) => grid.textContent), /sesuai/);
    await reset();
    assert.equal(new URL(page.url()).searchParams.get("category"), "plants");
    checks.push("Live search, price validation, no-result recovery and Reset retain the category");

    await open("?category=plants&sort=price_asc&loaded=12");
    await page.waitForFunction(() => document.querySelectorAll("#catalog-products .home-product").length === 8);
    const sourceUrl = page.url();
    await page.$eval('[data-home-detail="dracaena"]', (button) => button.scrollIntoView({ block: "center" }));
    await follow('[data-home-detail="dracaena"]');
    assert.equal(new URL(page.url()).pathname, "/pages/public/product-detail.html");
    assert.equal(new URL(new URL(page.url()).searchParams.get("returnTo"), BASE_URL).pathname, "/pages/public/category.html");
    await page.waitForSelector("#product-title");
    assert.equal(await page.$eval("#product-back", (link) => link.textContent), "Tanaman Hias");
    assert.ok(await page.evaluate(() => scrollY < 80));
    await page.click("#product-back");
    await page.waitForFunction(() => location.pathname === "/pages/public/category.html");
    await page.waitForFunction(() => document.querySelectorAll("#catalog-products .home-product").length === 8);
    assert.equal(page.url(), sourceUrl);
    await page.waitForFunction(() => document.activeElement.dataset.homeDetail === "dracaena");
    assert.ok(await page.evaluate(() => scrollY > 0));
    checks.push("Detail opens from the top and Back restores category, sort, loaded products, scroll and focus");

    const categoryIds = await page.evaluate(() => window.RylvaStorefrontCategories.categories.map((category) => category.id));
    for (const id of categoryIds.filter((id) => id !== "plants"))
    {
      await open("?category=" + id);
      assert.match(await page.$eval("#catalog-products", (grid) => grid.textContent), /Belum ada produk di kategori ini/);
      assert.equal(await page.$$eval("#catalog-products .home-product", (cards) => cards.length), 0);
      if (id === "custom")
      {
        assert.equal(await page.$eval('.category-empty-actions a:last-child', (link) => link.pathname), "/pages/customer/bouquet-customizer.html");
      }
    }
    await open("?category=pots");
    await capture("empty-pots-1440.png");
    await open("?category=pots", 390);
    await capture("empty-pots-390.png");
    checks.push("All eight other existing categories remain honestly empty; custom bouquet links to its editor");

    for (const width of [1440, 390])
    {
      await open("", width);
      assert.equal(await page.$$eval("#category-directory a", (links) => links.length), 9);
      assert.equal(await page.$eval("#category-results", (region) => region.hidden), true);
      await capture("directory-" + width + ".png");
    }
    for (const query of ["?category=unknown", "?category=plants&category=pots", "?category=%3Cimg%3E"])
    {
      await open(query, 390);
      assert.equal(await page.$eval("h1", (heading) => heading.textContent), "Kategori tidak ditemukan");
      assert.equal(await page.$$eval("#category-directory a", (links) => links.length), 9);
    }
    await capture("unknown-category-390.png");
    checks.push("Directory and invalid category recovery preserve safe native choices without guessing a category");

    await open("?category=plants", 390);
    await page.click('[data-catalog-sheet="filter"]');
    await page.waitForSelector("#catalog-sheet[open]");
    await capture("mobile-filter-390.png", false);
    await input("#catalog-min-price", "900000");
    await input("#catalog-max-price", "100");
    assert.equal(await page.$eval("#catalog-price-error", (message) => message.hidden), false);
    await page.$eval("#catalog-price-error", (element) => element.scrollIntoView({ block: "center" }));
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "mobile-price-error-390.png"), fullPage: false });
    captures.push("mobile-price-error-390.png");
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.getElementById("catalog-sheet").open);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.catalogSheet), "filter");
    assert.equal(new URL(page.url()).searchParams.get("category"), "plants");
    checks.push("Mobile sheet retains one form, fixed category and price validation; Escape returns focus");

    for (const state of ["loadError", "offline", "timeout", "maintenance"])
    {
      await open("?category=plants&preview=catalog&state=" + state);
      await page.click('#catalog-products [data-catalog-action="retry"]');
      await page.waitForSelector("#catalog-products .home-product");
      assert.equal(new URL(page.url()).searchParams.get("category"), "plants");
    }
    await open("?category=plants&preview=catalog&state=loadError", 390);
    await capture("load-error-390.png");
    await open("?category=plants&preview=catalog&state=loading", 390, false);
    assert.equal(await page.$eval("#catalog-products", (grid) => grid.getAttribute("aria-busy")), "true");
    await capture("loading-390.png");
    checks.push("Loading, offline, timeout and maintenance use existing retry and preserve category context");

    await open("?category=plants&preview=catalog&state=brokenImage", 390);
    await page.waitForSelector('[data-image-failed="true"]');
    await capture("broken-image-390.png");
    await open("?category=plants&preview=catalog&state=longContent", 390);
    await capture("long-content-390.png");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await open("?category=plants&preview=catalog&state=invalidPrice");
    assert.equal(await page.$eval('[data-home-add="peace-lily"]', (button) => button.disabled), true);
    await open("?category=plants&preview=catalog&state=unavailable");
    assert.equal(await page.$eval('[data-home-add="peace-lily"]', (button) => button.disabled), true);
    checks.push("Broken imagery, long names, invalid price and out-of-stock states reuse card recovery and purchase restrictions");

    await open("?category=plants&preview=catalog&state=addError");
    await page.click('[data-home-add="peace-lily"]');
    await page.waitForSelector('#home-toast[role="alert"]');
    await page.waitForFunction(() => !document.querySelector('[data-home-add="peace-lily"]').disabled);
    await page.click('[data-home-add="peace-lily"]');
    await page.waitForFunction(() => document.getElementById("home-toast").textContent.includes("ditambahkan"));
    await page.click('[data-home-save="peace-lily"]');
    await page.waitForFunction(() => document.querySelector('[data-home-save="peace-lily"]').getAttribute("aria-pressed") === "true");
    checks.push("Existing Cart retry and Wishlist remain connected on the category product card");

    for (const route of ["/pages/public/home.html", "/pages/public/contact.html", "/pages/public/product-detail.html?product=monstera"])
    {
      await page.goto(BASE_URL + route, { waitUntil: "networkidle0" });
      await follow('header [data-storefront-category="plants"]');
      assert.equal(new URL(page.url()).pathname, "/pages/public/category.html");
    }
    await page.goto(BASE_URL + "/pages/public/home.html", { waitUntil: "networkidle0" });
    await follow('[data-home-collection="pots"]');
    assert.equal(new URL(page.url()).searchParams.get("category"), "pots");
    checks.push("Shared navigation and home category tiles reach the new route from existing pages");

    await open("?category=plants", 390);
    await page.$eval("#category-image", (image) => image.src = "/assets/images/category-image-missing.png");
    await page.waitForFunction(() => document.getElementById("category-image").hidden);
    assert.equal(await page.$eval("h1", (heading) => heading.textContent), "Tanaman Hias");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.focus('[data-catalog-sheet="filter"]');
    assert.notEqual(await page.$eval('[data-catalog-sheet="filter"]', (button) => getComputedStyle(button).outlineStyle), "none");
    await page.setJavaScriptEnabled(false);
    await page.reload({ waitUntil: "networkidle0" });
    assert.equal(await page.$$eval("#category-directory a", (links) => links.length), 9);
    assert.equal(await page.$eval("#category-results", (region) => getComputedStyle(region).display), "none");
    await capture("no-script-390.png");
    checks.push("Category image failure preserves identity; keyboard/reduced motion and native no-JS directory remain usable");

    assert.deepEqual(errors, []);
    assert.deepEqual(failedResources, []);
    assert.deepEqual(writes, []);
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "verification.json"),
      JSON.stringify({ checks, captures, errors, failedResources, writes }, null, 2));
    checks.forEach((check) => console.log("PASS " + check));
  }
  finally
  {
    await browser.close();
  }
}

verifyCategoryProducts().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
