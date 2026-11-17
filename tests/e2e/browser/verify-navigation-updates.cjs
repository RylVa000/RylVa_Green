"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_NAVIGATION_URL || "http://127.0.0.1:4185";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/navigation-updates");

async function verifyNavigation()
{
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
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
  await page.setRequestInterception(true);
  page.on("request", (request) =>
  {
    if (/^https?:/.test(request.url()) && !request.url().startsWith(BASE_URL))
    {
      request.abort();
    }
    else
    {
      request.continue();
    }
  });
  const routes = ["public", "customer"].flatMap((directory) =>
    fs.readdirSync(path.resolve("public/pages", directory)).filter((file) =>
      file.endsWith(".html") && fs.readFileSync(path.resolve("public/pages", directory, file), "utf8")
        .includes("storefront-header"))
      .map((file) => "/pages/" + directory + "/" + file));

  async function open(route, width = 1440)
  {
    await page.setViewport({ width, height: 900, isMobile: width < 600, hasTouch: width < 600 });
    await page.goto(BASE_URL + route, { waitUntil: "networkidle0" });
    await page.waitForFunction(() => window.RylvaWishlistStore?.snapshot().status === "ready");
    await page.evaluate(() => document.fonts.ready);
  }

  async function search(value)
  {
    await page.$eval("#storefront-search-input", (input, text) => input.value = text, value);
    await page.focus("#storefront-search-input");
    await page.keyboard.press("Enter");
  }

  async function expectCatalog(value)
  {
    await page.waitForFunction(() => location.pathname === "/pages/public/catalog.html"
      && document.getElementById("catalog-products")?.getAttribute("aria-busy") === "false");
    assert.equal(new URL(page.url()).searchParams.get("q"), value);
    assert.equal(await page.$eval("#storefront-search-input", (input) => input.value), value);
  }

  try
  {
    await open("/pages/public/home.html");
    assert.equal(await page.$eval(".storefront-wishlist-count", (badge) => badge.hidden), true);
    await page.evaluate(async () =>
    {
      await window.RylvaWishlistStore.setSaved("example-peace-lily", true);
      await window.RylvaWishlistStore.setSaved("example-monstera", true);
    });
    assert.equal(await page.$eval(".storefront-wishlist-count", (badge) => badge.textContent), "2");
    await page.evaluate(() => window.RylvaWishlistStore.setSaved("example-monstera", false));
    assert.equal(await page.$eval(".storefront-wishlist-count", (badge) => badge.textContent), "1");
    const badgeOffset = await page.$eval('header [data-storefront-page="Wishlist"]', (trigger) =>
    {
      const icon = trigger.querySelector("img").getBoundingClientRect();
      const badge = trigger.querySelector(".storefront-wishlist-count").getBoundingClientRect();
      return badge.left + badge.width / 2 - icon.left - icon.width / 2;
    });
    assert.ok(badgeOffset >= 11 && badgeOffset <= 14, "Wishlist count sits slightly to the right of the heart");
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "wishlist-badge-desktop.png") });
    checks.push("Wishlist badge updates on save/remove and stays hidden when the collection is empty");

    for (const route of routes)
    {
      const query = route.endsWith("product-detail.html") ? "?product=monstera" : "";
      await open(route + query);
      assert.equal(await page.$eval(".storefront-wishlist-count", (badge) => badge.textContent), "1", route);
      assert.equal(await page.$eval(".storefront-wishlist-count", (badge) => badge.hidden), false, route);
      assert.match(await page.$eval('header [data-storefront-page="Wishlist"]', (button) => button.getAttribute("aria-label")), /1 produk/);
      if (!route.endsWith("catalog.html"))
      {
        await search("Sirih Gading");
        await expectCatalog("Sirih Gading");
        assert.equal(await page.$$eval("#catalog-products .home-product", (cards) => cards.length), 1);
      }
    }
    checks.push("All 14 storefront pages share the saved-item count; non-Catalog search opens matching Catalog results");

    await open("/pages/customer/cart.html");
    await page.waitForSelector("#cart-quantity-monstera-large");
    await page.$eval("#cart-quantity-monstera-large", (input) =>
    {
      input.value = "0";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await search("Mawar");
    await page.waitForSelector("#cart-dialog[open]");
    await page.click('[data-cart-action="close-dialog"]');
    assert.equal(await page.$eval("#cart-quantity-monstera-large", (input) => input.value), "0");
    assert.equal(await page.$eval("#storefront-search-input", (input) => input.value), "Mawar");
    await search("Mawar");
    await page.waitForSelector("#cart-dialog[open]");
    await page.click('[data-cart-action="leave"]');
    await expectCatalog("Mawar");
    checks.push("Cart search protects unsaved quantity input; cancel retains the input and confirmed departure opens Catalog");

    await open("/pages/customer/checkout.html?preview=checkout&state=normal");
    await page.waitForSelector('textarea[id^="note-"]');
    const note = await page.$eval('textarea[id^="note-"]', (input) =>
    {
      input.closest("details").open = true;
      input.value = "Catatan belum disimpan";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return input.id;
    });
    await search("Sirih");
    await page.waitForSelector("#checkout-dialog[open]");
    await page.click('[data-checkout-action="confirm-cancel"]');
    assert.equal(await page.$eval("#" + note, (input) => input.value), "Catatan belum disimpan");
    await search("Sirih");
    await page.waitForSelector("#checkout-dialog[open]");
    await page.click('[data-checkout-action="confirm"]');
    await expectCatalog("Sirih");
    checks.push("Checkout search requests confirmation for unsaved notes and retains them when canceled");

    await open("/pages/public/home.html", 390);
    const badge = await page.$eval(".storefront-wishlist-count", (element) =>
    {
      const bounds = element.getBoundingClientRect();
      return { visible: bounds.width > 0 && bounds.height > 0,
        top: bounds.top, cartTop: document.querySelector(".storefront-cart-count").getBoundingClientRect().top };
    });
    assert.equal(badge.visible, true);
    assert.ok(Math.abs(badge.top - badge.cartTop) <= 1);
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "wishlist-badge-mobile.png") });
    checks.push("Wishlist badge remains visible on mobile and aligns with the Cart badge");

    await open("/pages/customer/bouquet-customizer.html?preview=bouquet&state=guest");
    await page.waitForSelector(".bq-state a.bq-button");
    const colors = await page.$eval(".bq-state a.bq-button", (button) =>
    {
      const style = getComputedStyle(button);
      return { color: style.color, background: style.backgroundColor };
    });
    assert.equal(colors.color, "rgb(255, 255, 255)");
    assert.notEqual(colors.color, colors.background);
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "bouquet-login-label.png") });
    checks.push("Bouquet sign-in action has a readable white label before hover");

    await open("/pages/public/catalog.html");
    await page.click('.catalog-choice input[name="category"][value="custom"]');
    const checkbox = await page.$eval('input[name="category"][value="custom"]', (input) =>
    {
      const style = getComputedStyle(input);
      return { checked: input.checked, radius: style.borderRadius, image: style.backgroundImage };
    });
    assert.equal(checkbox.checked, true);
    assert.equal(checkbox.radius, "6px");
    assert.match(checkbox.image, /round/);
    await (await page.$(".catalog-filter-panel")).screenshot({ path: path.join(OUTPUT_DIRECTORY, "checkbox-desktop.png") });
    await page.focus('input[name="category"][value="custom"]');
    await page.keyboard.press("Space");
    assert.equal(await page.$eval('input[name="category"][value="custom"]', (input) => input.checked), false);
    await open("/pages/public/catalog.html", 390);
    await page.click('[data-catalog-sheet="filter"]');
    await page.waitForSelector("#catalog-sheet[open]");
    await page.$eval("#catalog-sheet", async (sheet) =>
    {
      await Promise.all(sheet.getAnimations().map((animation) => animation.finished.catch(() => undefined)));
    });
    await page.click('input[name="category"][value="custom"]');
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "checkbox-mobile.png") });
    checks.push("Category checkboxes use rounded corners/check strokes while preserving click and keyboard filtering on desktop/mobile");

    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "verification.json"), JSON.stringify({ checks, errors }, null, 2));
    checks.forEach((check) => console.log("PASS " + check));
  }
  finally
  {
    await browser.close();
  }
}

verifyNavigation().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
