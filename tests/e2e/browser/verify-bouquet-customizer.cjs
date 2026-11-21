"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const runtime = require("../../../tools/testing/browser-runtime.cjs");
const base = process.env.RYLVA_BOUQUET_URL || "http://127.0.0.1:4185";
const route = "/pages/customer/bouquet-customizer.html";
const directory = "storage/reports/bouquet-customizer";

async function verify()
{
  fs.mkdirSync(directory, { recursive: true });
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
  page.on("dialog", async (dialog) => dialog.accept());

  async function open(state = "ready", width = 1440)
  {
    await page.setViewport({ width, height: width < 701 ? 844 : 1100, isMobile: width < 701, hasTouch: width < 701 });
    await page.goto(base + route + (state === null ? "" : "?preview=bouquet&state=" + state), { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.getElementById("bouquet-content").getAttribute("aria-busy") === "false");
  }

  async function input(selector, value)
  {
    await page.$eval(selector, (element, text) =>
    {
      element.value = text;
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);
  }

  async function click(selector)
  {
    await page.$eval(selector, (element) => element.click());
  }

  async function ready()
  {
    await page.waitForFunction(() => document.getElementById("bouquet-submit")?.disabled === false);
  }

  async function feedback(text)
  {
    await page.waitForFunction((value) => document.getElementById("bouquet-feedback")?.textContent.includes(value), {}, text);
  }

  try
  {
    await open(null);
    assert.match(await page.$eval("#bouquet-content", (element) => element.innerText), /Masuk untuk meracik/);
    const destination = await page.$eval(".bq-state a", (element) => element.href);
    assert.match(destination, /customer-login.*returnTo/);
    assert.equal(await page.$eval(".bq-state a.bq-button", (element) => getComputedStyle(element).color), "rgb(255, 255, 255)");
    checks.push("Guest gate and safe login return");

    await open("normal");
    assert.equal(await page.$eval("#bouquet-submit", (element) => element.disabled), true);
    assert.match(await page.$eval("#bouquet-validation", (element) => element.textContent), /Bunga utama/);
    await click('[data-bq-option="red-rose"]');
    await click('[data-bq-group="wrap"]');
    await click('[data-bq-option="sage-wrap"]');
    await click('[data-bq-group="ribbon"]');
    await click('[data-bq-option="cream-ribbon"]');
    await ready();
    assert.equal(await page.$eval("#bouquet-subtotal", (element) => element.textContent), "Rp 80.000");
    assert.equal(await page.$$(".bq-stem").then((items) => items.length), 5);
    await click('[data-bq-group="flowers"]');
    await click('[data-bq-option-step="red-rose"][data-step="1"]');
    await ready();
    assert.equal(await page.$eval("#bouquet-subtotal", (element) => element.textContent), "Rp 140.000");
    assert.equal(await page.$$(".bq-stem").then((items) => items.length), 10);
    await click('[data-bq-action="more-bouquets"]');
    await ready();
    assert.equal(await page.$eval("#bouquet-subtotal", (element) => element.textContent), "Rp 280.000");
    checks.push("Required groups, pack quantities, bouquet quantities and automatic composition");

    await input("#bouquet-filter", "Tidak ada bunga ini");
    assert.match(await page.$eval("#bouquet-options", (element) => element.innerText), /Tidak ada pilihan/);
    await click('[data-bq-action="reset-filter"]');
    assert.equal(await page.$$("#bouquet-selected li").then((items) => items.length), 3);
    await click('[data-bq-action="reset"]');
    await page.waitForSelector("#home-dialog[open]");
    await page.keyboard.press("Escape");
    assert.equal(await page.$$("#bouquet-selected li").then((items) => items.length), 3);
    await click('[data-bq-action="zoom"]');
    await page.waitForSelector("#home-dialog[open]");
    await click("[data-home-close]");
    assert.equal(await page.$eval("#home-dialog", (element) => element.open), false);
    checks.push("Search reset preserves selection, dirty reset cancel and zoom dialog close");

    await click("#bouquet-notes summary");
    await input("#bouquet-message", "🌷".repeat(201));
    assert.equal(await page.$eval("#bouquet-message", (element) => element.getAttribute("aria-invalid")), "true");
    assert.equal(await page.$eval("#bouquet-submit", (element) => element.disabled), true);
    await input("#bouquet-message", '<img src=x onerror="alert(1)">');
    await ready();
    await input("#bouquet-quantity", "0");
    await page.waitForFunction(() => document.getElementById("bouquet-submit").disabled);
    await input("#bouquet-quantity", "1");
    await ready();
    checks.push("Unicode metadata limit, plain-text input and invalid quantity prevention");

    for (const state of ["loadError", "offline", "maintenance"])
    {
      await open(state);
      assert.ok(await page.$('[data-bq-action="load"]'));
      await click('[data-bq-action="load"]');
      await page.waitForSelector("#bouquet-submit");
    }
    for (const state of ["guest", "session", "verification", "denied", "notFound", "unavailable"])
    {
      await open(state);
      assert.equal(await page.$("#bouquet-submit"), null);
    }
    checks.push("Load recovery and access/unavailability gates");

    await open("brokenImage");
    assert.match(await page.$eval("#bouquet-stage", (element) => element.innerText), /Pratinjau gambar/);
    await page.waitForFunction(() => document.getElementById("bouquet-stage")?.getAttribute("aria-busy") === "false");
    await click('[data-bq-action="retry-image"]');
    await page.waitForFunction(() => document.getElementById("bouquet-stage")?.getAttribute("aria-busy") === "false"
      && document.querySelector(".bq-composition"));
    await open("emptyOptions");
    assert.match(await page.$eval("#bouquet-options", (element) => element.textContent), /belum tersedia/);
    await open("quoteError");
    await feedback("Harga belum");
    await click('[data-bq-action="quote"]');
    await ready();
    checks.push("Missing images, empty options and quote retry");

    for (const state of ["saveError", "csrf", "storageBlocked", "limit", "rateLimited"])
    {
      await open(state);
      await ready();
      await click('[data-bq-action="save"]');
      await page.waitForSelector('[data-bq-action="retry-save"]');
      if (state === "rateLimited")
      {
        assert.equal(await page.$eval('[data-bq-action="retry-save"]', (element) => element.disabled), true);
        await page.waitForFunction(() => document.querySelector('[data-bq-action="retry-save"]').disabled === false, { timeout: 7000 });
      }
      await click('[data-bq-action="retry-save"]');
      await feedback("keranjang contoh");
    }
    checks.push("Commit failure recovery, storage errors, limits and timed rate limit");

    await open("timeout");
    await ready();
    await click('[data-bq-action="save"]');
    await page.waitForSelector('[data-bq-action="reconcile"]');
    assert.equal(await page.$eval("#bouquet-submit", (element) => element.disabled), true);
    await click('[data-bq-action="reconcile"]');
    await feedback("keranjang contoh");
    await open("priceChanged");
    await ready();
    await click('[data-bq-action="save"]');
    await page.waitForSelector("#home-dialog[open]");
    assert.match(await page.$eval("#home-dialog-body", (element) => element.textContent), /Rp 120.000/);
    await page.keyboard.press("Escape");
    await click('[data-bq-action="save"]');
    await page.waitForSelector("#home-dialog[open]");
    assert.match(await page.$eval("#bouquet-subtotal", (element) => element.textContent), /120.000/);
    await click('[data-bq-action="accept-price"]');
    await feedback("keranjang contoh");
    await open("conflict");
    await ready();
    await click('[data-bq-action="save"]');
    await page.waitForSelector('[data-bq-action="as-new"]');
    await click('[data-bq-action="as-new"]');
    await feedback("keranjang contoh");
    checks.push("Uncertain result reconciled without duplicate, price consent and safe conflict recovery");

    await open("ready");
    await page.focus('[data-bq-group="wrap"]');
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.activeElement.dataset.bqGroup), "wrap");
    await page.evaluate(() =>
    {
      localStorage.setItem("rylva-cart-preview-guest-v1", JSON.stringify(
      { version: 1, expiresAt: Date.now() + 600000, items: [{ productId: "example-monstera", variantId: "example-large", quantity: 1 }] }));
    });
    const storedBeforeHeader = await page.evaluate(() => localStorage.getItem("rylva-cart-preview-guest-v1"));
    await click('header [data-storefront-page="Keranjang"]');
    await page.waitForFunction(() => document.getElementById("home-cart-panel").hidden === false
      && document.getElementById("home-cart-panel-body").textContent.includes("kosong"));
    assert.equal(await page.evaluate(() => localStorage.getItem("rylva-cart-preview-guest-v1")), storedBeforeHeader);
    checks.push("Category activation retains keyboard focus and workbench header is isolated from ordinary cart");

    for (const width of [320, 390, 700, 768, 1024, 1280, 1440, 1920])
    {
      await open("ready", width);
      await ready();
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      assert.equal(overflow, false, "Horizontal overflow at " + width);
      if (width === 390 || width === 1440)
      {
        await page.screenshot({ path: directory + "/" + (width === 390 ? "mobile" : "desktop") + ".png", fullPage: true });
      }
      if (width === 390)
      {
        await click("#bouquet-notes summary");
        await page.focus("#bouquet-note");
        const geometry = await page.evaluate(() =>
        {
          const input = document.getElementById("bouquet-note").getBoundingClientRect();
          const bar = document.getElementById("bouquet-purchase-bar").getBoundingClientRect();
          return { inputBottom: input.bottom, barTop: bar.top };
        });
        assert.ok(geometry.inputBottom <= geometry.barTop, "Focused field obscured by action bar");
      }
    }
    checks.push("Eight responsive widths, desktop/mobile render and visible focused mobile fields");

    await open(null);
    await click(".bq-state a");
    await page.waitForSelector("#auth-email");
    await input("#auth-email", "synthetic.person@example.test");
    await input("#auth-password", "bunga-sintetis-2026");
    await click("#auth-submit");
    await page.waitForSelector('[data-auth-action="continue"]');
    await click('[data-auth-action="continue"]');
    await page.waitForSelector("#bouquet-submit");
    assert.ok(page.url().includes(route));
    checks.push("Existing preview login returns to the protected bouquet editor");

    const recoveryId = await page.evaluate(() =>
    {
      const id = crypto.randomUUID();
      const draft = window.RylvaBouquetPreviewData.emptyDraft();
      draft.selections = { "red-rose": 1, "sage-wrap": 1, "cream-ribbon": 1 };
      draft.message = "Draft pulihan tetap belum tersimpan";
      sessionStorage.setItem("rylva-bouquet-recovery-" + id, JSON.stringify(
      { owner: "customer-example", expiresAt: Date.now() + 600000, draft, editLineId: null, editRevision: null }));
      return id;
    });
    await page.goto(base + route + "?recovery=" + recoveryId, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#bouquet-message");
    assert.equal(await page.$eval("#bouquet-message", (element) => element.value), "Draft pulihan tetap belum tersimpan");
    await click('.bq-breadcrumb a[href*="catalog"]');
    await page.waitForSelector("#home-dialog[open]");
    assert.match(await page.$eval("#home-dialog-title", (element) => element.textContent), /Tinggalkan rakitan/);
    await page.keyboard.press("Escape");
    checks.push("Restored draft retains its card message and unsaved-change protection");

    await open(null);
    await page.evaluate(() =>
    {
      sessionStorage.setItem("rylva-bouquet-preview-access-v1", "customer-example");
      localStorage.setItem("rylva-cart-preview-guest-v1", JSON.stringify({ version: 1, expiresAt: Date.now() + 600000, items: [] }));
      sessionStorage.removeItem("rylva-bouquet-cart-preview-v1");
    });
    await open(null);
    await click('[data-bq-option="red-rose"]');
    await click('[data-bq-group="wrap"]');
    await click('[data-bq-option="sage-wrap"]');
    await click('[data-bq-group="ribbon"]');
    await click('[data-bq-option="cream-ribbon"]');
    await click("#bouquet-notes summary");
    await input("#bouquet-label", "Buket untuk Ibu");
    await input("#bouquet-message", "Terima kasih, Ibu.");
    await ready();
    await page.evaluate(() =>
    {
      document.getElementById("bouquet-submit").click();
      document.getElementById("bouquet-submit").click();
    });
    await feedback("keranjang contoh");
    let lines = await page.evaluate(() => window.RylvaBouquetCartPreview.read());
    assert.equal(lines.length, 1);
    assert.equal(lines[0].quantity, 1);
    assert.equal(lines[0].price, 80000);
    const lineId = lines[0].lineId;
    assert.ok(!await page.evaluate(() => localStorage.getItem("rylva-cart-preview-guest-v1").includes("Terima kasih")));
    checks.push("Real preview save, double submission protection and no gift text in localStorage");

    await page.goto(base + "/pages/customer/cart.html", { waitUntil: "domcontentloaded" });
    await page.waitForSelector('a[href*="bouquet-customizer.html?edit="]');
    assert.match(await page.$eval("#cart-root", (element) => element.innerText), /Buket untuk Ibu/);
    await page.goto(base + route + "?edit=" + lineId, { waitUntil: "domcontentloaded" });
    await ready();
    assert.equal(await page.$eval("#bouquet-message", (element) => element.value), "Terima kasih, Ibu.");
    await click('[data-bq-action="more-bouquets"]');
    await ready();
    await click('[data-bq-action="save"]');
    await feedback("Perubahan");
    lines = await page.evaluate(() => window.RylvaBouquetCartPreview.read());
    assert.equal(lines.length, 1);
    assert.equal(lines[0].quantity, 2);
    assert.equal(lines[0].lineId, lineId);
    checks.push("Cart summary and edit round-trip retain metadata and replace the existing configuration");

    const contract = await page.evaluate(async () =>
    {
      const repository = window.RylvaCartPreviewRepository;
      const snapshot = await repository.load({ recover: true });
      const draft = window.RylvaBouquetCartPreview.read()[0].configurationDraft;
      draft.quantity = 1;
      const result = await repository.saveConfiguration(draft, snapshot.revision);
      let rejected = false;
      draft.label = "Different configuration";
      draft.quantity = 18;
      try
      {
        await repository.saveConfiguration(draft, result.cart.revision);
      }
      catch (error)
      {
        rejected = error.code === "limit";
      }
      return { quantity: result.cart.items[0].quantity, count: result.cart.items.length, rejected };
    });
    assert.deepEqual(contract, { quantity: 3, count: 1, rejected: true });
    checks.push("Canonical configuration merge and aggregate limit across different configurations");

    await page.evaluate((id) =>
    {
      sessionStorage.setItem("rylva-cart-checkout-preview-v1", JSON.stringify(
      { items: [{ lineId: id, quantity: 3 }], mode: "account", sourceScenario: "normal", returnTo: "/pages/customer/cart.html" }));
    }, lineId);
    await page.goto(base + "/pages/customer/checkout.html?from=cart", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.body.innerText.includes("Buket untuk Ibu"));
    await click(".checkout-product details summary");
    assert.match(await page.$eval("main", (element) => element.innerText), /Terima kasih, Ibu/);
    await page.screenshot({ path: directory + "/checkout.png", fullPage: true });
    checks.push("Checkout resolves canonical configured line with its gift message");

    await page.goto(base + route, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#bouquet-submit");
    const corruptRecovery = await page.evaluate(async () =>
    {
      sessionStorage.setItem("rylva-bouquet-cart-preview-v1", "broken-json");
      const cart = await window.RylvaCartPreviewRepository.load({ recover: true });
      return { items: cart.items.length, warning: cart.storageWarning };
    });
    assert.match(corruptRecovery.warning, /tidak valid/);
    assert.equal(corruptRecovery.items, 0);
    checks.push("Corrupt configured data is excluded with a recovery notice instead of breaking the cart");

    assert.deepEqual(errors, []);
    fs.writeFileSync(directory + "/verification.json", JSON.stringify({ checks, errors }, null, 2));
    console.log(JSON.stringify({ passed: checks.length, checks, errors }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verify().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
