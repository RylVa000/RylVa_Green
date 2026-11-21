"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = "http://127.0.0.1:4185";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/category-products");

async function verifyCategoryNavigation()
{
  const browser = await runtime.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true,
    userDataDir: path.join(OUTPUT_DIRECTORY, "chrome-navigation")
  });
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const checks = [];
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  async function click(selector)
  {
    await page.$eval(selector, (element) => element.click());
  }

  async function input(selector, value)
  {
    await page.$eval(selector, (element, text) =>
    {
      element.value = text;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
  }

  try
  {
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(BASE_URL + "/pages/customer/cart.html?preview=cart&state=normal", { waitUntil: "networkidle0" });
    await page.waitForSelector("#cart-quantity-monstera-large");
    await input("#cart-quantity-monstera-large", "0");
    await click('header [data-storefront-category="pots"]');
    await page.waitForSelector("#cart-dialog[open]");
    assert.match(await page.$eval("#cart-dialog-title", (heading) => heading.textContent), /belum disimpan/);
    await page.keyboard.press("Escape");
    assert.equal(new URL(page.url()).pathname, "/pages/customer/cart.html");
    assert.equal(await page.$eval("#cart-quantity-monstera-large", (field) => field.value), "0");
    await click('header [data-storefront-category="pots"]');
    await click('[data-cart-action="leave"]');
    await page.waitForFunction(() => location.pathname === "/pages/public/category.html");
    assert.equal(new URL(page.url()).searchParams.get("category"), "pots");
    checks.push("Native category navigation preserves Cart draft confirmation, cancellation and explicit discard");

    await page.goto(BASE_URL + "/pages/customer/bouquet-customizer.html?preview=bouquet&state=ready", { waitUntil: "networkidle0" });
    await page.waitForSelector('[data-bq-group="flowers"]');
    await click('[data-bq-group="flowers"]');
    await click('[data-bq-option-step="red-rose"][data-step="1"]');
    await click('header [data-storefront-category="plants"]');
    await page.waitForSelector("#home-dialog[open]");
    assert.equal(await page.$eval("#home-dialog-title", (heading) => heading.textContent), "Tinggalkan rakitan?");
    await page.keyboard.press("Escape");
    assert.equal(new URL(page.url()).pathname, "/pages/customer/bouquet-customizer.html");
    await click('header [data-storefront-category="plants"]');
    await page.waitForSelector('[data-bq-action="confirm"]');
    await click('[data-bq-action="confirm"]');
    await page.waitForFunction(() => location.pathname === "/pages/public/category.html");
    checks.push("Native category link preserves bouquet draft confirmation, cancellation and explicit discard");

    await page.goto(BASE_URL + "/pages/public/category.html?category=plants", { waitUntil: "networkidle0" });
    await page.setViewport({ width: 390, height: 1000 });
    await click('[data-catalog-sheet="filter"]');
    await page.waitForSelector("#catalog-sheet[open]");
    await page.$eval("#catalog-sheet", async (sheet) =>
    {
      await Promise.all(sheet.getAnimations().map((animation) => animation.finished.catch(() => {})));
    });
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "mobile-filter-390.png"), fullPage: false });
    await input("#catalog-min-price", "900000");
    await input("#catalog-max-price", "100");
    await page.$eval("#catalog-price-error", (message) => message.scrollIntoView({ block: "center" }));
    assert.equal(await page.$eval("#catalog-price-error", (message) => message.hidden), false);
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "mobile-price-error-390.png"), fullPage: false });
    checks.push("Both mobile sheet captures show the actual viewport and visible price-validation state");

    await page.keyboard.press("Escape");
    await page.goto(BASE_URL + "/pages/public/category.html", { waitUntil: "networkidle0" });
    await page.setViewport({ width: 1440, height: 1000 });
    await page.evaluate(async () =>
    {
      const repository = window.RylvaHomepagePreviewRepository;
      const cart = await repository.readCart();
      for (const item of cart.items)
      {
        await repository.remove(item.lineId);
      }
    });
    await click('header [data-storefront-page="Keranjang"]');
    await page.waitForSelector("[data-header-browse]");
    await click("[data-header-browse]");
    await page.waitForFunction(() => location.pathname === "/pages/public/catalog.html");
    await page.goto(BASE_URL + "/pages/public/category.html?category=unknown", { waitUntil: "networkidle0" });
    await input("#storefront-search-input", "monstera");
    await new Promise((resolve) => setTimeout(resolve, 450));
    assert.equal(new URL(page.url()).searchParams.get("category"), "unknown");
    assert.equal(new URL(page.url()).searchParams.has("q"), false);
    await page.$eval("#storefront-search", (form) => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    await page.waitForFunction(() => location.pathname === "/pages/public/catalog.html");
    assert.equal(new URL(page.url()).searchParams.get("q"), "monstera");
    checks.push("Directory empty-cart recovery and unavailable-category search navigate to the general Catalog");

    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "navigation-verification.json"), JSON.stringify({ checks, errors }, null, 2));
    checks.forEach((check) => console.log("PASS " + check));
  }
  finally
  {
    await browser.close();
  }
}

verifyCategoryNavigation().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
