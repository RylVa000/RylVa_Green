"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("../../../tools/testing/browser-runtime.cjs");
const baseUrl = process.env.RYLVA_WISHLIST_URL || "http://127.0.0.1:4185";
const output = path.resolve("storage/reports/wishlist-links");

async function run()
{
  fs.mkdirSync(output, { recursive: true });
  const browser = await runtime.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true
  });
  const page = await browser.newPage();
  const errors = [];
  const checks = [];
  page.on("pageerror", (error) => errors.push(error.message));

  async function home()
  {
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(baseUrl + "/pages/public/home.html", { waitUntil: "networkidle0" });
  }

  async function showPanel(hover = true)
  {
    const trigger = 'header [data-storefront-page="Wishlist"]';
    if (hover)
    {
      await page.hover(trigger);
    }
    else
    {
      await page.click(trigger);
    }
    await page.waitForSelector("#home-wishlist-panel:not([hidden])");
    await page.evaluate(async () =>
    {
      await document.fonts.ready;
      await Promise.all([...document.querySelectorAll("#home-wishlist-panel img")]
        .map((image) => image.decode().catch(() => undefined)));
    });
  }

  async function fullWishlist()
  {
    await showPanel(false);
    await page.click("[data-header-wishlist-all]");
    await page.waitForFunction(() => document.getElementById("wishlist-products")?.getAttribute("aria-busy") === "false");
  }

  try
  {
    await home();
    await showPanel();
    assert.match(await page.$eval("#home-wishlist-panel-body", (element) => element.textContent), /Wishlist masih kosong/);
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.activeElement.hasAttribute("data-header-wishlist-trigger")), true);
    await page.click('[data-home-save="peace-lily"]');
    await page.waitForFunction(() => window.RylvaWishlistStore.has("example-peace-lily"));
    await showPanel();
    assert.equal(await page.$$eval("#home-wishlist-panel article", (items) => items.length), 1);
    await page.screenshot({ path: path.join(output, "home-wishlist-hover.png") });
    const bounds = await page.$eval("#home-wishlist-panel", (element) =>
    {
      const rect = element.getBoundingClientRect();
      return { x: rect.x + 100, y: rect.y + 150 };
    });
    await page.mouse.move(bounds.x, bounds.y);
    await new Promise((resolve) => setTimeout(resolve, 360));
    assert.equal(await page.$eval("#home-wishlist-panel", (element) => element.hidden), false);
    await page.mouse.move(5, 700);
    await page.waitForFunction(() => document.getElementById("home-wishlist-panel").hidden);
    checks.push("Wishlist hover shows real saved items; pointer bridge, empty state and Escape focus work");

    await page.focus('[data-header-wishlist-trigger]');
    await page.keyboard.press("ArrowDown");
    await page.waitForSelector("#home-wishlist-panel:not([hidden])");
    assert.equal(await page.evaluate(() => document.getElementById("home-wishlist-panel").contains(document.activeElement)), true);
    await page.keyboard.press("Escape");
    await page.evaluate(async () =>
    {
      for (const product of window.RylvaStorefrontProductPreviewData.products)
      {
        await window.RylvaWishlistStore.setSaved(product.productId, true);
      }
    });
    await showPanel();
    assert.equal(await page.$$eval("#home-wishlist-panel article", (items) => items.length), 5);
    assert.match(await page.$eval("#home-wishlist-panel-title", (element) => element.textContent), /8/);
    const removed = await page.$eval("[data-header-wishlist-remove]", (element) => element.dataset.headerWishlistRemove);
    await page.click("[data-header-wishlist-remove]");
    await page.waitForFunction((id) => !window.RylvaWishlistStore.has(id), {}, removed);
    assert.match(await page.$eval("#home-wishlist-panel-title", (element) => element.textContent), /7/);
    await page.keyboard.press("Escape");
    assert.equal(await page.$eval(`[data-wishlist-product-id="${removed}"]`, (element) => element.getAttribute("aria-pressed")), "false");
    checks.push("Keyboard entry, five-item preview/count, remove and live card synchronization");

    await fullWishlist();
    assert.equal(new URL(page.url()).pathname, "/pages/customer/wishlist.html");
    assert.equal(await page.evaluate(() => window.RylvaWishlistStore.snapshot().items.length), 7);
    for (const width of [1920, 1440, 1024])
    {
      await page.setViewport({ width, height: 1000 });
      const layout = await page.$eval("#wishlist-products .home-product", (card) =>
      {
        const heading = card.querySelector("h3").getBoundingClientRect();
        const stock = card.querySelector(".home-stock").getBoundingClientRect();
        return { aligned: Math.abs(heading.top - stock.top) <= 8, separate: stock.left >= heading.right,
          columns: getComputedStyle(card.querySelector(".home-product-heading")).gridTemplateColumns.split(" ").length };
      });
      assert.equal(layout.columns, 2);
      assert.equal(layout.aligned, true);
      assert.equal(layout.separate, true);
      await page.screenshot({ path: path.join(output, "wishlist-card-" + width + ".png"), fullPage: true });
    }
    checks.push("Wishlist desktop shares Homepage title/badge placement and card hierarchy at three widths");

    for (const route of ["/pages/public/home.html", "/pages/public/catalog.html", "/pages/public/product-detail.html?product=monstera",
      "/pages/customer/wishlist.html", "/pages/customer/bouquet-customizer.html?preview=bouquet&state=guest"])
    {
      await page.goto(baseUrl + route, { waitUntil: "networkidle0" });
      await showPanel();
      const rect = await page.$eval("#home-wishlist-panel", (element) =>
      {
        const bounds = element.getBoundingClientRect();
        return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom, width: innerWidth, height: innerHeight };
      });
      assert.ok(rect.left >= 0 && rect.right <= rect.width && rect.top >= 0 && rect.bottom <= rect.height + 1, route);
      await page.keyboard.press("Escape");
    }
    checks.push("Shared wishlist panel works on Home, Catalog, Product Detail, Wishlist and Bouquet");

    await home();
    await page.click('[data-home-collection="all"]');
    await page.waitForFunction(() => location.pathname === "/pages/public/catalog.html");
    assert.equal(new URL(page.url()).searchParams.get("category"), null);
    await home();
    await page.click('[data-home-collection="pots"]');
    await page.waitForFunction(() => location.pathname === "/pages/public/catalog.html");
    assert.equal(new URL(page.url()).searchParams.get("category"), "pots");
    await home();
    await page.type("#storefront-search-input", "Sirih Gading");
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.getElementById("catalog-products")?.getAttribute("aria-busy") === "false");
    assert.equal(new URL(page.url()).searchParams.get("q"), "Sirih Gading");
    assert.equal(await page.$$eval("#catalog-products .home-product", (items) => items.length), 1);
    checks.push("View All, category and header search link to Catalog with supported parameters");

    await home();
    await page.click('[data-home-detail="sirih-gading"]');
    await page.waitForSelector("#product-title");
    assert.equal(new URL(page.url()).pathname, "/pages/public/product-detail.html");
    assert.equal(new URL(page.url()).searchParams.get("product"), "sirih-gading");
    assert.match(await page.$eval("#product-main-image", (image) => image.src), /sirih-gading\.png/);
    assert.equal(await page.evaluate(() => scrollY), 0);
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("#home-trending .home-product");
    await page.waitForFunction(() => document.activeElement.dataset.homeDetail === "sirih-gading");
    await showPanel();
    await page.click("#home-wishlist-panel [data-header-detail]");
    await page.waitForSelector("#product-title");
    assert.equal(new URL(page.url()).pathname, "/pages/public/product-detail.html");
    checks.push("Product cards and saved-item preview open real Detail; correct Sirih photo and return focus");

    await home();
    await page.setViewport({ width: 390, height: 844 });
    await showPanel(false);
    const mobileRow = await page.$eval("#home-wishlist-panel .home-mini-wishlist-item", (element) =>
    {
      const image = element.querySelector(".home-mini-cart-image").getBoundingClientRect();
      const remove = element.querySelector(".home-panel-remove").getBoundingClientRect();
      return { aligned: Math.abs(image.top + image.height / 2 - remove.top - remove.height / 2) < 2,
        separate: remove.left > image.right };
    });
    assert.equal(mobileRow.aligned, true);
    assert.equal(mobileRow.separate, true);
    await page.screenshot({ path: path.join(output, "wishlist-panel-mobile.png") });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.click("#home-wishlist-panel [data-header-close]");
    assert.equal(await page.evaluate(() => document.activeElement.hasAttribute("data-header-wishlist-trigger")), true);
    await page.setViewport({ width: 320, height: 844 });
    await showPanel(false);
    assert.equal(await page.$eval("#home-wishlist-panel", (element) => element.scrollWidth > element.clientWidth), false);
    await page.screenshot({ path: path.join(output, "wishlist-panel-320.png") });
    checks.push("Mobile click, bounded scrolling, visible actions, close and focus return at 390/320px");

    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, "verification.json"), JSON.stringify({ checks, errors }, null, 2));
    checks.forEach((check) => console.log("PASS " + check));
  }
  finally
  {
    await browser.close();
  }
}

run().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
