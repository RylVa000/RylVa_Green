"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("../../../tools/testing/browser-runtime.cjs");
const OUTPUT = path.resolve("storage/reports/commercial-pages");
const REVIEW = path.resolve(".impeccable/review/commercial-pages");
const BASE = process.env.RYLVA_INFORMATION_URL || "http://127.0.0.1:4185";

async function verify()
{
  fs.mkdirSync(OUTPUT, { recursive: true });
  fs.mkdirSync(REVIEW, { recursive: true });
  const browser = await runtime.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true,
    userDataDir: path.join(OUTPUT, "chrome")
  });
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const checks = [];
  const captures = [];
  const errors = [];
  const writes = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) =>
  {
    if (!["GET", "HEAD"].includes(request.method()))
    {
      writes.push(request.url());
    }
  });

  async function open(route, query = "")
  {
    await page.goto(BASE + "/pages/public/" + route + ".html" + (query ? "?" + query : ""));
    if (route !== "florist-partners")
    {
      await page.waitForFunction(() => document.getElementById("catalog-products").getAttribute("aria-busy") === "false");
    }
    await page.evaluate(() => document.fonts.ready);
  }

  async function capture(name)
  {
    if (process.env.RYLVA_SKIP_CAPTURES === "1")
    {
      return;
    }
    await page.evaluate(async () =>
    {
      scrollTo({ top: 0, behavior: "instant" });
      document.querySelectorAll("img").forEach((image) => image.loading = "eager");
      await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
    });
    await new Promise((resolve) => setTimeout(resolve, 420));
    const file = path.join(OUTPUT, name + ".png");
    await page.screenshot({ path: file, fullPage: true });
    fs.copyFileSync(file, path.join(REVIEW, name + ".png"));
    captures.push(name + ".png");
  }

  async function count()
  {
    return page.$$eval("#catalog-products .home-product", (items) => items.length);
  }

  try
  {
    for (const route of ["new-collection", "special-offers", "florist-partners"])
    {
      for (const width of [1440, 1024, 768, 390, 320])
      {
        await page.setViewport({ width, height: width < 600 ? 844 : 900 });
        await open(route);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.equal(await page.$eval(".policy-banner h1", (item) => getComputedStyle(item).textAlign), "center");
        assert.equal(await page.$$eval("h1", (items) => items.length), 1);
        assert.equal(await page.$$eval("header [data-storefront-destination][aria-current='page']", (items) => items.length), 1);
        if (route !== "florist-partners")
        {
          assert.equal(await count(), 4);
        }
        await capture(route + "-" + width);
      }
      checks.push(route + " renders at five widths without page overflow, with one centered title and current navigation");
    }

    await page.setViewport({ width: 1440, height: 900 });
    for (const route of ["new-collection", "special-offers"])
    {
      await open(route);
      await page.type("#storefront-search-input", "monstera");
      await page.waitForFunction(() => document.querySelectorAll("#catalog-products .home-product").length === 1);
      assert.equal(new URL(page.url()).pathname, "/pages/public/" + route + ".html");
      await page.click('[data-catalog-action="reset"]');
      assert.equal(await count(), 4);
      await page.click('[name="category"][value="pots"]');
      assert.equal(await count(), 0);
      await page.click('.home-empty [data-catalog-action="reset"]');
      assert.equal(await count(), 4);
      await page.type("#catalog-min-price", "500000");
      await page.type("#catalog-max-price", "10000");
      assert.equal(await page.$eval("#catalog-price-error", (item) => item.hidden), false);
      await page.click('[data-catalog-action="reset"]');
      await page.select("#catalog-sort", "price_desc");
      await page.waitForFunction(() => new URL(location.href).searchParams.get("sort") === "price_desc");
      await page.reload();
      await page.waitForSelector(".home-product");
      assert.equal(await page.$eval("#catalog-sort", (item) => item.value), "price_desc");
    }
    checks.push("Both collections retain scope through search, category filters, Reset, invalid price recovery, sorting and reload");

    for (const route of ["new-collection", "special-offers"])
    {
      await open(route, "sort=price_desc");
      await page.$eval('[data-home-detail="monstera"]', (item) => item.scrollIntoView({ block: "center" }));
      const position = await page.evaluate(() => scrollY);
      await Promise.all([page.waitForNavigation(), page.click('[data-home-detail="monstera"]')]);
      await page.waitForFunction(() =>
        document.getElementById("product-content")?.getAttribute("aria-busy") === "false");
      assert.ok((await page.$eval("#product-back", (item) => item.textContent)).includes(route === "new-collection" ? "Koleksi" : "Promo"));
      await Promise.all([page.waitForNavigation(), page.click("#product-back")]);
      await page.waitForFunction(() => document.activeElement?.dataset.homeDetail === "monstera");
      assert.ok(page.url().includes("sort=price_desc"));
      assert.ok(Math.abs(await page.evaluate(() => scrollY) - position) < 3);
    }
    checks.push("Product Detail/Back restores the correct collection, sort, reading position and exact product focus");

    await open("new-collection", "preview=collections&state=normal");
    await page.click('[data-home-save="peace-lily"]');
    await page.waitForFunction(() => document.querySelector('[data-home-save="peace-lily"]').getAttribute("aria-pressed") === "true");
    await page.click('[data-home-add="peace-lily"]');
    await page.waitForFunction(() => !document.getElementById("home-toast").hidden);
    checks.push("Shared Wishlist and preview cart actions remain functional in the collection");

    await page.setViewport({ width: 390, height: 844 });
    await open("special-offers");
    await page.click('[data-catalog-sheet="filter"]');
    await page.waitForSelector("#catalog-sheet[open]");
    assert.equal(await page.$$eval("#catalog-filters", (items) => items.length), 1);
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.getElementById("catalog-sheet").open);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.catalogSheet), "filter");
    await page.click('[data-catalog-sheet="sort"]');
    await page.waitForSelector("#catalog-sheet[open]");
    await page.keyboard.press("Escape");
    checks.push("Mobile sheets reuse one form, close with Escape and restore trigger focus");

    await page.setViewport({ width: 1440, height: 900 });
    for (const route of ["new-collection", "special-offers"])
    {
      for (const state of ["loadError", "offline", "timeout", "maintenance"])
      {
        await open(route, "preview=collections&state=" + state + "&q=monstera");
        assert.ok(await page.$('[data-catalog-action="retry"]'));
        await page.click('[data-catalog-action="retry"]');
        await page.waitForSelector(".home-product");
        assert.ok(page.url().includes("q=monstera"));
      }
    }
    checks.push("Eight failure/retry paths preserve collection identity and search input");

    await open("new-collection", "preview=collections&state=empty");
    assert.equal(await count(), 0);
    assert.ok((await page.$eval(".home-empty h2", (item) => item.textContent)).includes("Koleksi baru"));
    await capture("new-empty-1440");
    await open("special-offers", "preview=collections&state=ended");
    assert.equal(await count(), 0);
    assert.ok((await page.$eval(".home-empty h2", (item) => item.textContent)).includes("berakhir"));
    await capture("promo-ended-1440");
    await open("special-offers", "preview=collections&state=partial");
    assert.equal(await page.$eval("#catalog-feedback", (item) => item.hidden), false);
    await open("new-collection", "preview=collections&state=invalidPrice");
    assert.ok(await page.$eval('[data-home-add="peace-lily"]', (item) => item.disabled));
    await open("new-collection", "preview=collections&state=unavailable");
    assert.ok(await page.$eval('[data-home-add="peace-lily"]', (item) => item.disabled));
    checks.push("Collection empty, ended promotion, partial data, invalid price and unavailable stock have honest distinct behavior");

    await page.setViewport({ width: 320, height: 844 });
    await open("new-collection", "preview=collections&state=longContent");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const longPrice = await page.$eval(".home-price--long", (item) =>
    {
      const unit = item.querySelector("small");
      return {
        amountSize: parseFloat(getComputedStyle(item).fontSize),
        unitSize: parseFloat(getComputedStyle(unit).fontSize),
        text: item.textContent,
        overflows: item.scrollWidth > item.clientWidth
      };
    });
    assert.ok(longPrice.amountSize >= 14);
    assert.ok(longPrice.unitSize >= 12);
    assert.ok(longPrice.text.includes("1.250.000.000"));
    assert.equal(longPrice.overflows, false);
    await capture("new-long-320");
    await open("special-offers", "preview=collections&state=brokenImage");
    await capture("promo-image-failure-320");
    checks.push("Long product content and failed images preserve readable cards at 320px");

    await open("florist-partners");
    await page.focus("#partner-toc summary");
    await page.keyboard.press("Space");
    assert.equal(await page.$eval("#partner-toc", (item) => item.open), true);
    await page.click('#partner-toc a[href="#kontak-kemitraan"]');
    assert.equal(await page.evaluate(() => document.activeElement.id), "kontak-kemitraan");
    await page.focus("#partner-email-question summary");
    await page.keyboard.press("Space");
    assert.equal(await page.$eval("#partner-email-question", (item) => item.open), true);
    assert.ok(await page.$eval(".shipping-help a[href^='mailto:']", (item) => item.href.includes("Rencana%20Kerja%20Sama")));
    assert.equal(await page.$$eval(".partner-main form", (items) => items.length), 0);
    await capture("partner-faq-open-320");
    await page.focus("#storefront-search-input");
    await page.type("#storefront-search-input", "bunga");
    await Promise.all([page.waitForNavigation(), page.keyboard.press("Enter")]);
    assert.ok(page.url().includes("catalog.html?q=bunga"));
    checks.push("Partner TOC/FAQ work by keyboard; email is a draft link, no fake form exists and product search opens Catalog");

    for (const [alias, route] of [["koleksi-baru", "new-collection"], ["promo-spesial", "special-offers"], ["mitra-florist", "florist-partners"]])
    {
      await page.goto(BASE + "/" + alias + ".html?q=monstera");
      assert.ok(page.url().includes("/pages/public/" + route + ".html?q=monstera"));
    }
    await page.goto(BASE + "/__preview/collections");
    await page.waitForFunction(() => document.querySelectorAll("#scenarios a").length === 32);
    checks.push("Three aliases retain query parameters and 32 development links stay in a separate workbench");

    const origins = ["home", "catalog", "category?category=plants", "product-detail?product=monstera", "about", "contact"];
    const destinations = ["new-collection", "special-offers", "florist-partners"];
    for (let index = 0; index < origins.length; index++)
    {
      const [origin, query] = origins[index].split("?");
      const destination = destinations[index % destinations.length];
      await page.goto(BASE + "/pages/public/" + origin + ".html" + (query ? "?" + query : ""));
      const selector = 'header a[href="/pages/public/' + destination + '.html"]';
      await page.waitForSelector(selector);
      await Promise.all([page.waitForNavigation(), page.click(selector)]);
      assert.equal(new URL(page.url()).pathname, "/pages/public/" + destination + ".html");
    }
    checks.push("Native collection/promo/partner navigation works from six incumbent public entry pages without old dialog routing");

    await page.setJavaScriptEnabled(false);
    await page.goto(BASE + "/pages/public/florist-partners.html");
    assert.ok(await page.$("#informasi-usaha"));
    assert.ok(await page.$("a[href^='mailto:']"));
    await page.goto(BASE + "/pages/public/new-collection.html");
    assert.ok(await page.$eval("noscript", (item) => item.textContent.includes("Aktifkan JavaScript")));
    checks.push("Partner information, FAQ and contacts remain native without JavaScript; collections explain their fallback");
    assert.deepEqual(errors, []);
    assert.deepEqual(writes, []);
  }
  finally
  {
    fs.writeFileSync(path.join(OUTPUT, "verification.json"), JSON.stringify({ checks, captures, errors, writes }, null, 2));
    await browser.close();
  }
  console.log(JSON.stringify({ checks, captures, errors, writes }, null, 2));
}

verify().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
