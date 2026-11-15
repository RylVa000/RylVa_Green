"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_CHECKOUT_URL || "http://127.0.0.1:4182/pages/customer/checkout.html";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/checkout/payment-methods");

async function verifyPaymentMethods()
{
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true,
    timeout: 20000
  });
  const page = await browser.newPage();
  const errors = [];
  const checks = [];
  page.setDefaultTimeout(12000);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());

  async function open(state = "normal")
  {
    await page.goto(BASE_URL + "?preview=checkout&state=" + state);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => document.getElementById("checkout-root").getAttribute("aria-busy") === "false");
    await page.waitForFunction(() => !document.querySelector(".checkout-quote-status")?.textContent.includes("Menghitung ulang"));
    await page.click('[data-checkout-action="methods"]');
  }

  async function capture(name)
  {
    await page.evaluate(() => Promise.all(document.getAnimations()
      .filter((animation) => Number.isFinite(animation.effect.getComputedTiming().endTime))
      .map((animation) => animation.finished.catch(() => undefined))));
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, name + ".png") });
  }

  async function toggle(id)
  {
    await page.click("#payment-category-" + id);
  }

  async function assertFits()
  {
    const layout = await page.evaluate(() =>
    {
      const dialog = document.getElementById("checkout-dialog");
      const rect = dialog.getBoundingClientRect();
      const footer = dialog.querySelector(".checkout-payment-footer").getBoundingClientRect();
      const heading = dialog.querySelector(".dialog-heading").getBoundingClientRect();
      return {
        withinViewport: rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight,
        footerVisible: footer.bottom <= rect.bottom && footer.top >= heading.bottom,
        overflow: dialog.scrollWidth > dialog.clientWidth,
        bodyOverflow: dialog.querySelector(".checkout-payment-body").scrollWidth > dialog.querySelector(".checkout-payment-body").clientWidth
      };
    });
    assert.deepEqual(layout, { withinViewport: true, footerVisible: true, overflow: false, bodyOverflow: false });
  }

  try
  {
    await page.setViewport({ width: 1440, height: 900 });
    await open();
    assert.equal(await page.$$(".checkout-payment-category").then((elements) => elements.length), 4);
    assert.equal(await page.$eval('[data-checkout-action="use-choice"]', (element) => element.disabled), true);
    assert.equal(await page.$$('[aria-expanded="true"][data-checkout-action="toggle-payment"]').then((elements) => elements.length), 0);
    assert.equal(await page.$$('input[name="paymentMethod"]:checked').then((elements) => elements.length), 0);
    await assertFits();
    await capture("desktop-categories");
    checks.push("Four supported categories only, initially collapsed and no implicit payment selection");

    await toggle("va");
    assert.equal(await page.$eval("#payment-category-va", (element) => element.getAttribute("aria-expanded")), "true");
    await capture("desktop-expanded");
    await page.click('input[name="checkoutChoice"][value="va"]');
    assert.equal(await page.$eval('[data-checkout-action="use-choice"]', (element) => element.disabled), false);
    assert.equal(await page.$$('input[name="paymentMethod"]:checked').then((elements) => elements.length), 0);
    await toggle("qris");
    assert.equal(await page.$eval("#payment-options-va", (element) => element.hidden), true);
    assert.equal(await page.$eval('input[name="checkoutChoice"][value="va"]', (element) => element.checked), true);
    await page.click('#checkout-dialog [data-checkout-action="close"]');
    assert.equal(await page.$$('input[name="paymentMethod"]:checked').then((elements) => elements.length), 0);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.checkoutAction), "methods");
    checks.push("Disclosure preserves draft across groups; cancel discards draft and restores trigger focus");

    await page.click('[data-checkout-action="methods"]');
    await toggle("wallet");
    await page.click('input[name="checkoutChoice"][value="wallet"]');
    await page.click('[data-checkout-action="use-choice"]');
    await page.waitForFunction(() => document.getElementById("payment-wallet").checked);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.checkoutAction), "methods");
    await page.click('[data-checkout-action="methods"]');
    assert.equal(await page.$eval("#payment-category-wallet", (element) => element.getAttribute("aria-expanded")), "true");
    assert.match(await page.$eval("#checkout-payment-current", (element) => element.textContent), /DANA/);
    await toggle("va");
    await page.click('input[name="checkoutChoice"][value="va"]');
    await page.keyboard.press("Escape");
    assert.equal(await page.$eval("#payment-wallet", (element) => element.checked), true);
    assert.equal(await page.$eval("#checkout-dialog", (element) => element.classList.contains("checkout-payment-dialog")), false);
    checks.push("Apply commits one supported method, reopen expands selection, Escape keeps committed choice");

    await page.click('[data-checkout-action="methods"]');
    await page.focus("#payment-category-qris");
    await page.keyboard.press("Space");
    assert.equal(await page.$eval("#payment-category-qris", (element) => element.getAttribute("aria-expanded")), "true");
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.value), "qris");
    await page.keyboard.press("Space");
    await page.focus('[data-checkout-action="use-choice"]');
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute("aria-label")), "Tutup dialog");
    await page.keyboard.down("Shift");
    await page.keyboard.press("Tab");
    await page.keyboard.up("Shift");
    assert.equal(await page.evaluate(() => document.activeElement.dataset.checkoutAction), "use-choice");
    await page.keyboard.press("Escape");
    checks.push("Keyboard expansion, radio selection, focus containment and Escape work");

    await open("noCod");
    await toggle("cod");
    assert.equal(await page.$eval('input[name="checkoutChoice"][value="cod"]', (element) => element.disabled), true);
    assert.match(await page.$eval('[data-payment-category="cod"]', (element) => element.textContent), /Tidak tersedia untuk kurir ini/);
    await capture("cod-unavailable");
    await page.keyboard.press("Escape");
    await page.click('[data-checkout-action="couriers"]');
    assert.equal(await page.$eval("#checkout-dialog", (element) => element.classList.contains("checkout-payment-dialog")), false);
    assert.ok(await page.$(".checkout-options"));
    checks.push("Ineligible COD is explained and disabled; courier dialog retains existing layout");

    for (const state of ["noMethods", "methodError"])
    {
      await open(state);
      assert.ok(await page.$(".checkout-payment-empty"));
      assert.equal(await page.$eval('[data-checkout-action="use-choice"]', (element) => element.disabled), true);
      const loading = await page.$eval('[data-checkout-action="retry-payment-methods"]', (element) =>
      {
        element.click();
        return { disabled: element.disabled, text: element.textContent };
      });
      assert.deepEqual(loading, { disabled: true, text: "Memuat..." });
      await page.waitForSelector(".checkout-payment-category");
      assert.equal(await page.$eval("#checkout-dialog", (element) => element.open), true);
    }
    await open("methodError");
    await page.$eval('[data-checkout-action="retry-payment-methods"]', (element) =>
    {
      element.click();
      document.querySelector('#checkout-dialog [data-checkout-action="close"]').click();
    });
    await page.waitForFunction(() => !document.querySelector(".checkout-quote-status")?.textContent.includes("Menghitung ulang"));
    assert.equal(await page.$eval("#checkout-dialog", (element) => element.open), false);
    checks.push("Empty methods and payment-service failure recover in the same dialog");

    for (const [width, height] of [[320, 640], [375, 812], [390, 844], [768, 900], [667, 375]])
    {
      await page.setViewport({ width, height });
      await open();
      await toggle("wallet");
      await page.click('input[name="checkoutChoice"][value="wallet"]');
      await assertFits();
      await page.$eval(".checkout-payment-body", (element) => element.scrollTop = element.scrollHeight);
      await assertFits();
      await capture("dialog-" + width + "x" + height);
    }
    checks.push("Header and actions remain visible across five mobile/tablet/landscape sizes; no horizontal overflow");

    await page.setViewport({ width: 1440, height: 900 });
    await open();
    await toggle("va");
    assert.equal(await page.$$('#payment-options-va input[name="checkoutChoice"]').then((elements) => elements.length), 7);
    await page.waitForFunction(() => [...document.querySelectorAll('#checkout-dialog img')].every((image) => image.complete && image.naturalWidth > 0));
    await page.focus('input[name="checkoutChoice"][value="va"]');
    await page.keyboard.press("ArrowDown");
    assert.equal(await page.evaluate(() => document.activeElement.dataset.providerId), "mandiri");
    await page.click('input[name="checkoutChoice"][data-provider-id="bni"]');
    await capture("bank-providers");
    await page.setViewport({ width: 375, height: 812 });
    await assertFits();
    await capture("bank-providers-mobile");
    await page.setViewport({ width: 1440, height: 900 });
    await page.click('[data-checkout-action="use-choice"]');
    assert.match(await page.$eval(".checkout-method:has(#payment-va)", (element) => element.textContent), /Bank BNI/);
    await page.waitForFunction(() => !document.querySelector(".checkout-quote-status")?.textContent.includes("Menghitung ulang"));
    await page.click("#checkout-consent");
    await page.click('[data-checkout-action="create"]');
    await page.waitForSelector("#checkout-result-title");
    const links = await page.$$eval(".checkout-result a", (elements) => elements.map((element) => element.href));
    const paymentUrl = links.find((link) => link.includes("payment.html"));
    const detailUrl = links.find((link) => link.includes("order-detail.html"));
    const orderId = new URL(paymentUrl).searchParams.get("orderId");
    const created = await page.evaluate((id) => window.RylvaOrdersPreviewRepository.read(id), orderId);
    assert.equal(created.selectedPaymentMethod, "va");
    assert.deepEqual(created.attempt.provider, { id: "bni", name: "Bank BNI" });
    assert.deepEqual(created.attempts[0].provider, created.attempt.provider);
    await page.goto(paymentUrl);
    await page.waitForFunction(() => document.querySelector(".method-name")?.textContent.includes("Bank BNI"));
    await page.reload();
    await page.waitForFunction(() => document.querySelector(".method-name")?.textContent.includes("Bank BNI"));
    await capture("bank-payment-handoff");
    await page.goto(detailUrl);
    await page.waitForFunction(() => document.getElementById("order-root")?.textContent.includes("Virtual Account — Bank BNI"));
    await page.goto(paymentUrl);
    await page.waitForSelector(".method-name");
    const retry = await page.evaluate(async () =>
    {
      const adapter = window.RylvaPaymentPreview.createAdapter();
      return adapter.createAttempt("va");
    });
    assert.deepEqual(retry.attempt.provider, { id: "bni", name: "Bank BNI" });
    const switched = await page.evaluate(async () => window.RylvaPaymentPreview.createAdapter().createAttempt("qris"));
    assert.equal(switched.attempt.provider, null);
    assert.ok(switched.attempts.some((attempt) => attempt.provider?.id === "bni"));
    await page.goto(detailUrl);
    await page.waitForFunction(() => document.getElementById("order-root")?.textContent.includes("Rincian Pembayaran"));
    assert.doesNotMatch(await page.$eval("#order-root", (element) => element.textContent), /Virtual Account — Bank BNI/);
    checks.push("Seven bank options, arrow-key selection, provider snapshot, payment reload/retry and no stale provider after method change");

    await open();
    await toggle("wallet");
    assert.equal(await page.$$('#payment-options-wallet input[name="checkoutChoice"]').then((elements) => elements.length), 5);
    await page.waitForFunction(() => [...document.querySelectorAll('#checkout-dialog img')].every((image) => image.complete && image.naturalWidth > 0));
    await page.click('input[name="checkoutChoice"][data-provider-id="ovo"]');
    await capture("wallet-providers");
    await page.click('[data-checkout-action="use-choice"]');
    assert.match(await page.$eval(".checkout-method:has(#payment-wallet)", (element) => element.textContent), /OVO/);
    await page.waitForFunction(() => !document.querySelector(".checkout-quote-status")?.textContent.includes("Menghitung ulang"));
    await page.click('[data-checkout-action="methods"]');
    await page.click('input[name="checkoutChoice"][data-provider-id="linkaja"]');
    await page.keyboard.press("Escape");
    assert.match(await page.$eval(".checkout-method:has(#payment-wallet)", (element) => element.textContent), /OVO/);
    await page.click("#checkout-consent");
    await page.click('[data-checkout-action="create"]');
    await page.waitForSelector("#checkout-result-title");
    const walletPaymentUrl = await page.$eval('.checkout-result a[href*="payment.html"]', (element) => element.href);
    await page.goto(walletPaymentUrl);
    await page.waitForFunction(() => document.querySelector(".method-name")?.textContent.includes("OVO"));
    await capture("wallet-payment-handoff");
    checks.push("Five wallet options, cancelled provider draft, main summary and matching OVO payment handoff");

    await open("providerUnavailable");
    assert.equal(await page.$eval('input[data-provider-id="bni"]', (element) => element.disabled), true);
    assert.match(await page.$eval(".checkout-method:has(#payment-va)", (element) => element.textContent), /Pilihan sebelumnya tidak tersedia/);
    assert.equal(await page.$eval('[data-checkout-action="use-choice"]', (element) => element.disabled), true);
    assert.match(await page.$eval("#payment-options-va", (element) => element.textContent), /Pilih bank lain/);
    assert.equal(await page.$eval('input[data-provider-id="bni"]', (element) => getComputedStyle(element.closest("label").querySelector("img")).filter), "grayscale(1)");
    await capture("provider-unavailable");
    await page.click('input[data-provider-id="mandiri"]');
    await page.click('[data-checkout-action="use-choice"]');
    assert.match(await page.$eval(".checkout-method:has(#payment-va)", (element) => element.textContent), /Mandiri/);
    await open("noBankProviders");
    await toggle("va");
    assert.match(await page.$eval("#payment-options-va", (element) => element.textContent), /Belum ada pilihan/);
    await page.click('[data-checkout-action="retry-payment-methods"]');
    await page.waitForSelector('input[data-provider-id="bni"]');
    checks.push("Unavailable selected provider does not silently switch; empty bank list offers recovery");

    await page.keyboard.press("Escape");
    const rejected = await page.evaluate(async () =>
    {
      const context = window.RylvaCheckoutPreviewData.create("normal");
      context.method = "va";
      context.paymentProviderId = "unknown-bank";
      const before = window.RylvaOrdersPreviewRepository.ownOrders().length;
      try
      {
        await window.RylvaCheckoutPreviewRepository.createOrder(context, "invalid-provider-test", JSON.stringify(context));
        return { rejected: false };
      }
      catch (error)
      {
        return { rejected: error.code === "invalidData", unchanged: before === window.RylvaOrdersPreviewRepository.ownOrders().length };
      }
    });
    assert.deepEqual(rejected, { rejected: true, unchanged: true });
    checks.push("Preview repository rejects an invalid provider before creating any order");

    await page.setViewport({ width: 1440, height: 900 });
    await page.setRequestInterception(true);
    page.on("request", (request) => request.url().endsWith("/checkout/bca.png") ? request.abort() : request.continue());
    await open();
    await toggle("va");
    await page.waitForFunction(() => [...document.querySelectorAll('#checkout-dialog img[src$="bca.png"]')].every((image) => image.hidden));
    assert.match(await page.$eval("#payment-options-va", (element) => element.textContent), /Bank BCA/);
    await page.click('input[name="checkoutChoice"][value="va"]');
    await page.click('[data-checkout-action="use-choice"]');
    assert.equal(await page.$eval("#payment-va", (element) => element.checked), true);
    checks.push("Failed logo assets retain named, usable payment choices");

    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "results.json"), JSON.stringify({ checks, errors }, null, 2));
    console.log(JSON.stringify({ passed: checks.length, checks, errors }, null, 2));
  }
  catch (error)
  {
    await capture("failure");
    throw error;
  }
  finally
  {
    await browser.close();
  }
}

verifyPaymentMethods().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
