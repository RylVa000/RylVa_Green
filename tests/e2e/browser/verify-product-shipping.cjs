"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("../../../tools/testing/browser-runtime.cjs");
const baseUrl = process.env.RYLVA_PRODUCT_DETAIL_URL || "http://127.0.0.1:4185";
const outputDirectory = path.resolve("storage/reports/product-shipping");

async function verifyShipping()
{
  fs.mkdirSync(outputDirectory, { recursive: true });
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

  async function open(state = "", width = 1440)
  {
    await page.setViewport({ width, height: width < 768 ? 844 : 1000, isMobile: width < 768, hasTouch: width < 768 });
    await page.goto(baseUrl + "/pages/public/product-detail.html?product=monstera"
      + (state ? "&preview=product-detail&state=" + state : ""), { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#product-postcode");
  }

  async function input(selector, value)
  {
    await page.$eval(selector, (element, text) =>
    {
      element.value = text;
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);
  }

  async function submit()
  {
    await page.$eval("#product-shipping", (form) => form.requestSubmit());
  }

  async function success()
  {
    await page.waitForFunction(() => document.getElementById("product-shipping-result").dataset.state === "success");
  }

  async function storageSnapshot()
  {
    return page.evaluate(() =>
    {
      const contents = (storage) => Object.fromEntries(Object.keys(storage).sort().map((key) => [key, storage.getItem(key)]));
      return { local: contents(localStorage), session: contents(sessionStorage) };
    });
  }

  async function captureForm(name)
  {
    await page.evaluate(async () =>
    {
      await document.fonts.ready;
      document.getElementById("product-shipping").scrollIntoView({ block: "start" });
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const form = await page.$("#product-shipping");
    await form.screenshot({ path: path.join(outputDirectory, name + ".png") });
  }

  try
  {
    await open();
    const mode = await page.evaluate(async () => (await window.RylvaCartPreviewRepository.load()).mode);
    assert.equal(mode, "guest");
    assert.equal(await page.$$eval("#product-shipping input", (items) => items.length), 1);
    const before = await storageSnapshot();
    await input("#product-postcode", "40526");
    await submit();
    await success();
    assert.deepEqual(await storageSnapshot(), before, "A guest quote writes neither account addresses nor any other browser storage");
    const prices = await page.$$eval(".product-shipping-price", (items) => items.map((item) => item.textContent));
    assert.deepEqual(prices, ["Rp 15.000", "Rp 20.000", "Rp 25.000"]);
    assert.match(await page.$eval("#product-shipping-result", (element) => element.textContent), /40526, untuk 1 pot/);
    assert.match(await page.$eval(".product-shipping-preview", (element) => element.textContent), /Tarif contoh/);
    assert.match(await page.$eval(".product-shipping-note", (element) => element.textContent), /tidak menambah atau mengubah alamat/);
    await captureForm("guest-rates-desktop");
    checks.push("Guest checks a postcode alone, sees existing shared example rates and never creates/updates an address or writes storage");

    await input("#product-postcode", "12abc");
    await submit();
    assert.equal(await page.$eval("#product-postcode", (element) => element.getAttribute("aria-invalid")), "true");
    assert.equal(await page.evaluate(() => document.activeElement.id), "product-postcode");
    assert.equal(await page.$(".product-shipping-services"), null);
    await input("#product-postcode", "40123");
    await submit();
    await success();
    await input("#product-quantity", "3");
    assert.equal(await page.$eval("#product-shipping-result", (element) => element.dataset.state), "stale");
    assert.equal(await page.$(".product-shipping-services"), null);
    assert.equal(await page.$eval("#product-postcode", (element) => element.value), "40123");
    await submit();
    await success();
    assert.match(await page.$eval("#product-shipping-result", (element) => element.textContent), /untuk 3 pot/);
    await page.$eval("#product-variant", (element) => element.dispatchEvent(new Event("change", { bubbles: true })));
    assert.equal(await page.$eval("#product-postcode", (element) => element.value), "40123");
    assert.equal(await page.$eval("#product-shipping-result", (element) => element.dataset.state), "stale");
    checks.push("Invalid postcode focuses recovery; quantity/variant changes clear stale rates and preserve the destination postcode");

    for (const state of ["shippingError", "shippingTimeout"])
    {
      await open(state);
      await input("#product-postcode", "40526");
      await submit();
      await page.waitForFunction(() => document.getElementById("product-shipping-result").dataset.state === "error");
      assert.equal(await page.$eval("#product-postcode", (element) => element.value), "40526");
      await page.click("[data-product-shipping-retry]");
      await success();
    }
    await open("shippingUnavailable");
    await input("#product-postcode", "40526");
    await submit();
    await page.waitForFunction(() => document.getElementById("product-shipping-result").dataset.state === "empty");
    assert.equal(await page.$(".product-shipping-services"), null);
    await open("shippingPartial");
    await input("#product-postcode", "40526");
    await submit();
    await page.waitForFunction(() => document.getElementById("product-shipping-result").dataset.state === "partial");
    assert.equal(await page.$$eval(".product-shipping-services li", (items) => items.length), 2);
    assert.match(await page.$eval("#product-shipping-result", (element) => element.textContent), /Sebagian tarif belum tersedia/);
    assert.doesNotMatch(await page.$eval("#product-shipping-result", (element) => element.textContent), /NaN|Rp 0/);
    checks.push("Service errors/timeouts retry with retained input; empty/partial results show clear recovery without fabricated missing prices");

    await open("shippingLoading");
    await input("#product-postcode", "40526");
    await page.evaluate(() =>
    {
      const repository = window.RylvaProductDetailPreviewRepository;
      const original = repository.quote;
      window.shippingCalls = 0;
      repository.quote = async (...args) =>
      {
        window.shippingCalls++;
        return original(...args);
      };
      const form = document.getElementById("product-shipping");
      form.requestSubmit();
      form.requestSubmit();
    });
    assert.equal(await page.$eval('#product-shipping button[type="submit"]', (element) => element.disabled), true);
    assert.equal(await page.$eval("#product-shipping-result", (element) => element.getAttribute("aria-busy")), "true");
    await captureForm("shipping-loading");
    await success();
    assert.equal(await page.evaluate(() => window.shippingCalls), 1);
    await page.setOfflineMode(true);
    await submit();
    await page.waitForFunction(() => document.getElementById("product-shipping-result").dataset.state === "error");
    await page.setOfflineMode(false);
    await page.click("[data-product-shipping-retry]");
    await success();
    checks.push("Loading state prevents duplicate requests; real offline leaves postcode intact and supports retry");

    await open("normal");
    await page.evaluate(() =>
    {
      const repository = window.RylvaProductDetailPreviewRepository;
      const original = repository.quote;
      repository.quote = async (postcode, context) =>
      {
        if (postcode === "40123")
        {
          await new Promise((resolve) => setTimeout(resolve, 650));
        }
        return original(postcode, context);
      };
    });
    await input("#product-postcode", "40123");
    await submit();
    await input("#product-postcode", "40526");
    await submit();
    await success();
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 800)));
    assert.match(await page.$eval("#product-shipping-result", (element) => element.textContent), /40526/);
    assert.doesNotMatch(await page.$eval("#product-shipping-result", (element) => element.textContent), /40123/);
    await page.evaluate(() =>
    {
      window.RylvaProductDetailPreviewRepository.quote = async () => ({});
    });
    await submit();
    await page.waitForFunction(() => document.getElementById("product-shipping-result").dataset.state === "error");
    assert.match(await page.$eval("#product-shipping-result", (element) => element.textContent), /Data tarif belum lengkap/);
    assert.doesNotMatch(await page.$eval("#product-shipping-result", (element) => element.textContent), /Belum ada layanan/);
    checks.push("Late responses cannot replace the current result; malformed responses are service errors rather than claims that a postcode is unserved");

    for (const width of [390, 320])
    {
      await open("shippingRates", width);
      await success();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await captureForm("guest-rates-mobile-" + width);
    }
    checks.push("Direct rate preview and 390/320px layouts show prices without horizontal overflow");

    for (const width of [1440, 390, 320])
    {
      await page.setViewport({ width, height: width < 768 ? 844 : 1000 });
      await page.goto(baseUrl + "/pages/customer/checkout.html?preview=checkout&state=login", { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".checkout-page-state");
      await page.evaluate(() => document.fonts.ready);
      const centered = await page.$eval(".checkout-page-state", (state) =>
      {
        const container = state.getBoundingClientRect();
        const buttons = [...state.querySelectorAll(".checkout-dialog-actions .button")].map((button) => button.getBoundingClientRect());
        const left = Math.min(...buttons.map((button) => button.left));
        const right = Math.max(...buttons.map((button) => button.right));
        return Math.abs((left + right) / 2 - (container.left + container.right) / 2) <= 1;
      });
      assert.equal(centered, true, "Checkout login action group is centered at " + width);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(outputDirectory, "checkout-login-centered-" + width + ".png") });
    }
    await page.click('[data-checkout-action="account"]');
    await page.waitForFunction(() => location.pathname.endsWith("customer-login.html"));
    const returnTo = new URL(page.url()).searchParams.get("returnTo");
    assert.match(returnTo, /checkout.html/);
    checks.push("Checkout access buttons center on desktop/mobile while the login destination and Checkout return context stay intact");

    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(outputDirectory, "verification.json"), JSON.stringify({ checks, errors }, null, 2));
    console.log(JSON.stringify({ passed: checks.length, checks, errors }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyShipping().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
