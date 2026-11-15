"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_CHECKOUT_URL || "http://127.0.0.1:4182/pages/customer/checkout.html";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/checkout");

async function verifyReviewFixes()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true
  });
  const page = await browser.newPage();
  const checks = [];
  page.on("dialog", (dialog) => dialog.accept());
  async function open(state = "normal")
  {
    await page.goto(BASE_URL + "?preview=checkout&state=" + state);
    await page.waitForSelector("#checkout-summary");
    await settled();
  }
  async function settled()
  {
    await page.waitForFunction(() => !document.querySelector(".checkout-quote-status")?.textContent.includes("Menghitung ulang"));
  }
  try
  {
    await page.setViewport({ width: 1440, height: 1000 });
    await open();
    await page.click("#payment-qris");
    await settled();
    await page.click("#gift-enabled");
    assert.match(await page.$eval(".checkout-quote-status", (element) => element.textContent), /Menghitung ulang/);
    await page.evaluate(() =>
    {
      const message = document.getElementById("gift-message");
      message.value = "Pesan ditempel ketika total sedang diperbarui.";
      message.dispatchEvent(new Event("input", { bubbles: true }));
      document.querySelector(".checkout-note").open = true;
      const note = document.getElementById("note-monstera-large");
      note.value = "Catatan ditempel saat perhitungan berjalan.";
      note.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await settled();
    await page.click("#checkout-consent");
    await page.click("#checkout-submit");
    await page.waitForSelector("#checkout-result-title");
    const order = await page.evaluate(() =>
    {
      return window.RylvaOrdersPreviewRepository.read(window.RylvaCheckoutPreviewRepository.readIntent().orderId);
    });
    assert.equal(order.greeting.message, "Pesan ditempel ketika total sedang diperbarui.");
    assert.equal(order.items[0].note, "Catatan ditempel saat perhitungan berjalan.");
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "review-fast-paste-result.png"), fullPage: true });
    checks.push("fast card/note paste during pending quote submits matching current payload once");

    await open("addressLimit");
    await page.click('[data-checkout-action="address"]');
    await page.focus('input[name="shippingAddress"]:checked');
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Space");
    const selectedId = await page.$eval('input[name="shippingAddress"]:checked', (element) => element.value);
    assert.equal(await page.evaluate(() => document.activeElement.value), selectedId);
    await page.keyboard.press("Tab");
    assert.deepEqual(await page.evaluate(() =>
    ({ action: document.activeElement.dataset.addressAction, id: document.activeElement.dataset.id })),
    { action: "edit", id: selectedId });
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "review-address-keyboard.png") });
    checks.push("Arrow/Space address selection retains radio and subsequent Tab progress");

    await open();
    await page.click("#payment-qris");
    await settled();
    await page.click("#checkout-consent");
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await settled();
    assert.equal(await page.$eval("#checkout-consent", (element) => element.checked), true);
    checks.push("unchanged background revalidation preserves current purchase approval");
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "review-fixes.json"), JSON.stringify({ checks }, null, 2));
    console.log(JSON.stringify({ checks }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyReviewFixes().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
