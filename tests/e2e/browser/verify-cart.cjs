"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_CART_URL || "http://127.0.0.1:4179/pages/customer/cart.html";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/cart");

async function verifyCart()
{
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  const browser = await puppeteer.launch(
  {
    executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true,
    timeout: 20000
  });
  const checks = [];
  const browserErrors = [];
  const screenshots = [];
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("dialog", async (dialog) => dialog.accept());

  async function open(state = "normal")
  {
    const resetScript = await page.evaluateOnNewDocument(() =>
    {
      localStorage.removeItem("rylva-cart-preview-guest-v1");
      for (const key of Object.keys(sessionStorage))
      {
        if (key.startsWith("rylva-cart-preview-context-v1:"))
        {
          sessionStorage.removeItem(key);
        }
      }
    });
    await page.goto(BASE_URL + "?preview=cart&state=" + state);
    await page.removeScriptToEvaluateOnNewDocument(resetScript.identifier);
    await page.waitForFunction(() => window.RylvaCartPreviewRepository);
    if (!["loading", "merging"].includes(state))
    {
      await page.waitForFunction(() => document.getElementById("cart-root").getAttribute("aria-busy") === "false");
    }
    else
    {
      await page.waitForSelector("#cart-state-title");
    }
    await page.evaluate(() => document.fonts.ready);
  }

  async function settled()
  {
    await page.waitForFunction(() => document.getElementById("cart-root").getAttribute("aria-busy") === "false");
  }

  async function capture(name)
  {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, name + ".png"), fullPage: true });
    screenshots.push(name + ".png");
  }

  async function checkLayout(label)
  {
    const violations = await page.evaluate(() =>
    {
      const viewport = document.documentElement.clientWidth;
      const targets = [...document.querySelectorAll("main article, main input, main button, main aside, dialog[open]")];
      return targets.filter((element) =>
      {
        const bounds = element.getBoundingClientRect();
        return bounds.width > 0 && (bounds.left < -1 || bounds.right > viewport + 1);
      }).map((element) => element.id || element.className);
    });
    assert.deepEqual(violations, [], label + " horizontal overflow");
  }

  async function setQuantity(value)
  {
    const input = await page.$("#cart-quantity-monstera-large");
    await input.click();
    await page.keyboard.down("Control");
    await page.keyboard.press("A");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    await page.keyboard.type(value);
    await page.keyboard.press("Enter");
    await settled();
  }

  try
  {
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(new URL("/pages/customer/my-orders.html", BASE_URL).href);
    await page.evaluate(() => document.fonts.ready);
    await capture("incumbent-my-orders");

    await open();
    assert.equal(await page.$eval("#cart-checkout", (element) => element.textContent.trim()), "Checkout (1)");
    assert.match(await page.$eval(".cart-total dd", (element) => element.textContent), /289[.]000/);
    assert.equal(await page.$eval("#cart-select-all", (element) => element.indeterminate), true);
    checks.push("Figma items, correct total and mixed checkbox");

    const composition = await page.evaluate(() =>
    {
      const name = document.querySelector(".cart-product-name").getBoundingClientRect();
      const price = document.querySelector(".cart-unit-price").getBoundingClientRect();
      return {
        productGroups: document.querySelectorAll(".cart-product-group").length,
        priceBelowName: price.top >= name.bottom,
        priceAlignedWithName: Math.abs(price.left - name.left) < 2,
        nameFontSize: parseFloat(getComputedStyle(document.querySelector(".cart-product-name")).fontSize),
        summaryVisibleTitle: !document.querySelector("#cart-summary h2").classList.contains("visually-hidden"),
        summaryPanel: getComputedStyle(document.querySelector("#cart-summary")).backgroundColor
          !== getComputedStyle(document.body).backgroundColor
      };
    });
    assert.equal(composition.productGroups, 1);
    assert.equal(composition.priceBelowName, true);
    assert.equal(composition.priceAlignedWithName, true);
    assert.ok(composition.nameFontSize <= 18);
    assert.equal(composition.summaryVisibleTitle, true);
    assert.equal(composition.summaryPanel, true);
    checks.push("Blibli-inspired compact grouped rows, price hierarchy and visible summary panel");
    await page.focus("#cart-quantity-monstera-large");
    assert.ok(await page.$eval("#cart-quantity-monstera-large", (element) => parseFloat(getComputedStyle(element).outlineOffset)) <= 0);
    await capture("quantity-focus");
    await page.keyboard.press("Tab");

    for (const width of [1920, 1536, 1440, 1280, 1024, 768, 720, 390, 320])
    {
      await page.setViewport({ width, height: width === 1920 ? 1665 : 950 });
      await checkLayout("normal-" + width);
      await capture("normal-" + width);
    }
    await page.setViewport({ width: 1440, height: 1000 });
    await page.click("#cart-select-all");
    assert.equal(await page.$eval("#cart-select-all", (element) => element.checked), true);
    assert.equal(await page.$$eval("[data-cart-select]", (elements) => elements.filter((element) => element.checked).length), 2);
    assert.match(await page.$eval(".cart-total dd", (element) => element.textContent), /364[.]000/);
    await capture("all-selected");
    await page.click("#cart-select-all");
    assert.equal(await page.$$eval("[data-cart-select]", (elements) => elements.filter((element) => element.checked).length), 0);
    assert.equal(await page.$eval("#cart-checkout", (element) => element.disabled), true);
    await capture("none-selected");
    checks.push("selection, totals and no-selection block");

    await open();
    await page.click("#cart-increase-monstera-large");
    await settled();
    assert.equal(await page.$eval("#cart-quantity-monstera-large", (element) => element.value), "2");
    assert.match(await page.$eval(".cart-total dd", (element) => element.textContent), /578[.]000/);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("rylva-cart-preview-guest-v1")));
    assert.deepEqual(Object.keys(stored.items[0]).sort(), ["productId", "quantity", "variantId"]);
    await page.reload();
    await settled();
    assert.equal(await page.$eval("#cart-quantity-monstera-large", (element) => element.value), "2");
    checks.push("quantity update, recalculation and minimal guest persistence");

    await setQuantity("0");
    assert.equal(await page.$eval("#cart-quantity-monstera-large", (element) => element.getAttribute("aria-invalid")), "true");
    assert.equal(await page.$eval("#cart-checkout", (element) => element.disabled), true);
    await capture("quantity-invalid");
    await page.click('[data-cart-action="discard"]');
    assert.equal(await page.$eval("#cart-quantity-monstera-large", (element) => element.value), "2");
    await setQuantity("21");
    assert.match(await page.$eval("#cart-feedback-monstera-large", (element) => element.textContent), /1–20/);
    await page.click('[data-cart-action="discard"]');
    for (const invalidQuantity of ["-1", "1.5", "abc", ""])
    {
      await setQuantity(invalidQuantity);
      assert.equal(await page.$eval("#cart-quantity-monstera-large", (element) => element.getAttribute("aria-invalid")), "true", "invalid quantity: " + invalidQuantity);
      await page.click('[data-cart-action="discard"]');
    }
    checks.push("quantity validation and discard recovery");

    await setQuantity("0");
    await page.click('[data-cart-action="home"]');
    await page.waitForSelector("#cart-dialog[open]");
    assert.match(await page.$eval("#cart-dialog-title", (element) => element.textContent), /belum disimpan/);
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.closest("dialog")?.id), "cart-dialog");
    await page.keyboard.press("Escape");
    await page.click('[data-cart-action="discard"]');
    checks.push("dirty draft navigation and modal keyboard focus");

    await page.click("#cart-remove-monstera-large");
    await page.waitForSelector("#cart-dialog[open]");
    await capture("delete-dialog");
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.activeElement.id), "cart-remove-monstera-large");
    await page.click("#cart-remove-monstera-large");
    await page.click('[data-cart-action="confirm-delete"]');
    await settled();
    assert.equal(await page.$$(".cart-item").then((items) => items.length), 1);
    await page.click("#cart-remove-calathea-small");
    await page.click('[data-cart-action="confirm-delete"]');
    await settled();
    assert.ok(await page.$(".cart-empty"));
    assert.equal(await page.$eval(".storefront-cart-count", (element) => element.textContent), "0");
    await capture("empty");
    checks.push("delete confirm/cancel, Escape focus return and final empty state");

    await open("stockChanged");
    assert.equal(await page.$eval("#cart-checkout", (element) => element.disabled), true);
    await page.click('[data-cart-action="adjust"]');
    await settled();
    assert.equal(await page.$eval("#cart-quantity-monstera-large", (element) => element.value), "2");
    checks.push("stock drop with explicit adjustment");

    await open("unavailable");
    await page.click("#cart-select-calathea-small");
    assert.equal(await page.$eval("#cart-checkout", (element) => element.disabled), true);
    await capture("unavailable");
    checks.push("unselected unavailable item still blocks Checkout");

    await open("uncertain");
    await page.click("#cart-increase-monstera-large");
    await settled();
    assert.match(await page.$eval("#cart-notice", (element) => element.textContent), /belum dapat dipastikan/);
    await page.click('#cart-notice [data-cart-action="recover"]');
    await settled();
    assert.equal(await page.$eval("#cart-quantity-monstera-large", (element) => element.value), "2");
    checks.push("uncertain mutation reconciles without double increment");

    await open("saveError");
    await page.click("#cart-increase-monstera-large");
    await settled();
    assert.equal(await page.$eval("#cart-quantity-monstera-large", (element) => element.value), "2");
    assert.match(await page.$eval("#cart-feedback-monstera-large", (element) => element.textContent), /terakhir tersimpan: 1/);
    await setQuantity("2");
    assert.equal(await page.$eval("#cart-checkout", (element) => element.disabled), false);
    checks.push("failed save retains draft and allows correction/retry");

    await open("quoteChanged");
    await page.click("#cart-checkout");
    await settled();
    assert.match(await page.$eval(".cart-total dd", (element) => element.textContent), /300[.]000/);
    assert.equal(await page.$("#cart-dialog[open]"), null);
    await page.click("#cart-checkout");
    await page.waitForSelector("#checkout-state-title");
    assert.match(await page.$eval("#checkout-root", (element) => element.textContent), /Autentikasi pelanggan belum terhubung/);
    await capture("checkout-login");
    checks.push("price change requires another review; no fake checkout/authentication");

    await open();
    await page.evaluate(() =>
    {
      localStorage.setItem("rylva-cart-preview-guest-v1", JSON.stringify(
      {
        version: 1,
        expiresAt: Date.now() + 60000,
        items: []
      }));
      window.dispatchEvent(new StorageEvent("storage", { key: "rylva-cart-preview-guest-v1" }));
    });
    assert.equal(await page.$eval("#cart-checkout", (element) => element.disabled), true);
    await page.click('#cart-notice [data-cart-action="recover"]');
    await settled();
    assert.ok(await page.$(".cart-empty"));
    checks.push("cross-tab changes require refresh and reconcile actual guest data");

    await open();
    await page.evaluate(() =>
    {
      localStorage.setItem("rylva-cart-preview-guest-v1", JSON.stringify(
      {
        version: 1,
        expiresAt: Date.now() + 60000,
        items:
        [
          { productId: "example-monstera", variantId: "example-large", quantity: 15 },
          { productId: "example-monstera", variantId: "example-large", quantity: 15 },
          { productId: "not-in-catalog", variantId: "invalid", quantity: 1 }
        ]
      }));
    });
    await page.reload();
    await settled();
    assert.equal(await page.$$(".cart-item").then((items) => items.length), 1);
    assert.equal(await page.$eval("#cart-quantity-monstera-large", (element) => element.value), "20");
    assert.match(await page.$eval("#cart-notice", (element) => element.textContent), /duplikat digabung/);
    checks.push("guest duplicates merge within cap, invalid records excluded with notice");

    await open("rateLimited");
    await page.click("#cart-increase-monstera-large");
    await settled();
    assert.equal(await page.$eval('#cart-notice [data-cart-action="recover"]', (element) => element.disabled), true);
    checks.push("rate limit wait disables immediate retry");

    await open();
    await page.setOfflineMode(true);
    await page.waitForFunction(() => document.getElementById("cart-notice").textContent.includes("Koneksi terputus"));
    assert.equal(await page.$eval("#cart-checkout", (element) => element.disabled), true);
    await page.setOfflineMode(false);
    await page.click('#cart-notice [data-cart-action="recover"]');
    await settled();
    checks.push("real browser offline and reconnect recovery");

    const scenarios = await page.evaluate(() => Object.keys(window.RylvaCartPreviewData.scenarios));
    for (const state of scenarios)
    {
      await open(state);
      await checkLayout("state-" + state);
      if (["totalLimit", "partialPrices", "allUnavailable", "componentUnavailable", "configurationInvalid"].includes(state))
      {
        assert.equal(await page.$eval("#cart-checkout", (element) => element.disabled), true, state);
      }
      if (["longContent", "configuration", "storageBlocked", "loadError", "merging"].includes(state))
      {
        await capture(state);
      }
    }
    checks.push(scenarios.length + " development scenarios rendered without JS errors or horizontal overflow");

    await open("longContent");
    await page.setViewport({ width: 320, height: 850 });
    await checkLayout("long-content-mobile");
    await capture("long-content-320");
    await open();
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    assert.equal(await page.$eval("#cart-checkout", (element) => getComputedStyle(element).transitionDuration), "0s");
    await page.keyboard.press("Tab");
    checks.push("320px long content and reduced motion");

    await page.goto(new URL("/__preview/cart", BASE_URL).href);
    await page.waitForSelector("#cart-state-links a");
    assert.equal(await page.$$("#cart-state-links a").then((links) => links.length), scenarios.length);
    checks.push("development workbench route");
    assert.deepEqual(browserErrors, []);
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "results.json"), JSON.stringify({ checks, screenshots, browserErrors }, null, 2));
    console.log(JSON.stringify({ passed: checks.length, checks, screenshots }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyCart().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
