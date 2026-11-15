"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_PAYMENT_PREVIEW_URL || "http://127.0.0.1:4182/pages/customer/payment.html";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/payment-providers");

async function verifyPaymentProviders()
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

  async function open(state = "pending", parameters = "")
  {
    if (page.url().startsWith(new URL(BASE_URL).origin))
    {
      await page.evaluate((scenario) => sessionStorage.removeItem("rylva-payment-preview-v1:" + scenario), state);
    }
    await page.goto(BASE_URL + "?state=" + state + parameters);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => document.getElementById("payment-root").getAttribute("aria-busy") === "false");
  }

  async function showMethods()
  {
    await page.click("#change-method");
    await page.waitForSelector("#payment-method-form");
  }

  async function choose(methodId, providerId)
  {
    if (await page.$eval("#payment-category-" + methodId, (element) => element.getAttribute("aria-expanded") !== "true"))
    {
      await page.click("#payment-category-" + methodId);
    }
    await page.click(providerId ? `input[data-provider-id="${providerId}"]` : `input[value="${methodId}"]`);
  }

  async function capture(name)
  {
    await page.evaluate(() => Promise.all(document.getAnimations()
      .filter((animation) => Number.isFinite(animation.effect.getComputedTiming().endTime))
      .map((animation) => animation.finished.catch(() => undefined))));
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, name + ".png") });
  }

  async function apply(expected)
  {
    await page.click("#confirm-method");
    await page.waitForFunction((label) => !document.getElementById("payment-dialog").open
      && document.querySelector(".method-name")?.textContent.includes(label), {}, expected);
    await page.waitForFunction(() => document.getElementById("payment-root").getAttribute("aria-busy") === "false");
  }

  async function snapshot()
  {
    return page.evaluate(() => JSON.parse(sessionStorage.getItem("rylva-payment-preview-v1:pending")));
  }

  async function assertFits()
  {
    const layout = await page.evaluate(() =>
    {
      const dialog = document.getElementById("payment-dialog");
      const bounds = dialog.getBoundingClientRect();
      const footer = dialog.querySelector(".payment-method-footer").getBoundingClientRect();
      const body = dialog.querySelector(".payment-method-scroll");
      return {
        viewport: bounds.left >= 0 && bounds.right <= innerWidth && bounds.top >= 0 && bounds.bottom <= innerHeight,
        footer: footer.bottom <= bounds.bottom && footer.top >= bounds.top,
        horizontalOverflow: dialog.scrollWidth > dialog.clientWidth || body.scrollWidth > body.clientWidth
      };
    });
    assert.deepEqual(layout, { viewport: true, footer: true, horizontalOverflow: false });
  }

  try
  {
    await page.setViewport({ width: 1440, height: 1000 });
    await open();
    const original = await snapshot();
    await showMethods();
    assert.equal(await page.$eval("#confirm-method", (element) => element.disabled), true);
    await choose("va", "bni");
    assert.equal(await page.$$('#payment-options-va input').then((elements) => elements.length), 7);
    await page.waitForFunction(() => [...document.querySelectorAll("#payment-dialog img")].every((image) => image.complete && image.naturalWidth > 0));
    await capture("bank-picker");
    await page.$eval("#confirm-method", (element) =>
    {
      element.click();
      element.click();
    });
    await page.waitForFunction(() => !document.getElementById("payment-dialog").open && document.querySelector(".method-name")?.textContent.includes("Bank BNI"));
    const bni = await snapshot();
    assert.deepEqual(bni.attempt.provider, { id: "bni", name: "Bank BNI" });
    assert.equal(bni.attempt.number, original.attempt.number + 1);
    assert.equal(bni.orderId, original.orderId);
    assert.equal(bni.expiresAt, original.expiresAt);
    assert.equal(bni.attempts[1].status, "Dibatalkan");
    await page.waitForFunction(() => document.activeElement.id === "change-method");
    checks.push("QRIS to BNI creates one replacement attempt, cancels the previous attempt, preserves order/deadline and restores focus");

    await showMethods();
    await choose("va", "mandiri");
    await page.keyboard.press("Escape");
    assert.deepEqual((await snapshot()).attempt, bni.attempt);
    assert.equal(await page.evaluate(() => document.activeElement.id), "change-method");
    await showMethods();
    await choose("va", "mandiri");
    await apply("Bank Mandiri");
    assert.deepEqual((await snapshot()).attempt.provider, { id: "mandiri", name: "Bank Mandiri" });
    await page.reload();
    await page.waitForFunction(() => document.querySelector(".method-name")?.textContent.includes("Bank Mandiri"));
    checks.push("Switching bank within Virtual Account works; cancel preserves the old bank and reload preserves the new bank");

    await showMethods();
    await choose("wallet", "ovo");
    assert.equal(await page.$$('#payment-options-wallet input').then((elements) => elements.length), 5);
    await capture("wallet-picker");
    await apply("OVO");
    await showMethods();
    await choose("wallet", "linkaja");
    await apply("LinkAja");
    const wallet = await snapshot();
    assert.deepEqual(wallet.attempt.provider, { id: "linkaja", name: "LinkAja" });
    assert.ok(wallet.attempts.some((attempt) => attempt.provider?.id === "ovo"));
    assert.ok(wallet.attempts.some((attempt) => attempt.provider?.id === "mandiri"));
    checks.push("Different wallets replace the provider while preserving prior bank/wallet history");

    for (const [width, height] of [[320, 640], [375, 812], [768, 900], [667, 375]])
    {
      await page.setViewport({ width, height });
      await open();
      await showMethods();
      await choose("va", "bsi");
      await assertFits();
      await capture("bank-" + width + "x" + height);
      await page.focus("#confirm-method");
      await page.keyboard.press("Tab");
      assert.equal(await page.evaluate(() => document.activeElement.dataset.action), "close-dialog");
      await page.keyboard.press("Escape");
    }
    checks.push("Bank picker fits phone/tablet/landscape, keeps actions visible and traps keyboard focus");

    await page.setViewport({ width: 1440, height: 1000 });
    await open("pending", "&actionError=validation");
    await showMethods();
    await choose("va", "bni");
    await page.click("#confirm-method");
    await page.waitForFunction(() => !document.getElementById("method-error").hidden);
    assert.equal(await page.$eval('input[data-provider-id="bni"]', (element) => element.checked), true);
    assert.equal(await page.$eval("#confirm-method", (element) => element.disabled), false);
    await apply("Bank BNI");
    checks.push("Validation failure keeps provider selection and permits a successful retry");

    await open();
    await page.evaluate(() =>
    {
      const key = "rylva-payment-preview-v1:pending";
      const data = JSON.parse(sessionStorage.getItem(key));
      data.availableMethods.find((method) => method.id === "va").providers[1].available = false;
      data.availableMethods.find((method) => method.id === "wallet").providers = [];
      sessionStorage.setItem(key, JSON.stringify(data));
    });
    await page.reload();
    await page.waitForSelector("#change-method");
    await showMethods();
    await choose("va", "bni");
    assert.equal(await page.$eval('input[data-provider-id="mandiri"]', (element) => element.disabled), true);
    const invalid = await page.evaluate(async () =>
    {
      const adapter = window.RylvaPaymentPreview.createAdapter();
      const before = await adapter.getSnapshot();
      try
      {
        await adapter.createAttempt("va", { providerId: "mandiri" });
        return { rejected: false };
      }
      catch (error)
      {
        const after = await adapter.getSnapshot();
        return { rejected: error.code === "validation", unchanged: before.attempt.id === after.attempt.id };
      }
    });
    assert.deepEqual(invalid, { rejected: true, unchanged: true });
    await page.click("#payment-category-wallet");
    assert.match(await page.$eval("#payment-options-wallet", (element) => element.textContent), /Belum ada pilihan/);
    await capture("provider-unavailable");
    await page.keyboard.press("Escape");
    checks.push("Unavailable banks are disabled and rejected by adapter; empty wallets offer recovery without losing the active attempt");

    const checkoutUrl = new URL("checkout.html?preview=checkout&state=normal", BASE_URL).href;
    await page.goto(checkoutUrl);
    await page.waitForSelector("#checkout-summary");
    const linked = await page.evaluate(async () =>
    {
      const context = window.RylvaCheckoutPreviewData.create("normal");
      context.method = "va";
      context.paymentProviderId = "bni";
      return window.RylvaCheckoutPreviewRepository.createOrder(context, crypto.randomUUID(), JSON.stringify(context));
    });
    await page.goto(BASE_URL + "?orderId=" + linked.orderId);
    await page.waitForSelector("#change-method");
    await showMethods();
    await choose("va", "permata");
    await apply("Bank Permata");
    await page.goto(new URL("order-detail.html?orderId=" + linked.orderId, BASE_URL).href);
    await page.waitForFunction(() => document.getElementById("order-root")?.textContent.includes("Virtual Account — Bank Permata"));
    checks.push("Changing bank on a Checkout-created order updates the same shared order and Detail Pesanan");

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

verifyPaymentProviders().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
