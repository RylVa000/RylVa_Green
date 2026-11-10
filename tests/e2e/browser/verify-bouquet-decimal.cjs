const assert = require("node:assert/strict");
const fs = require("node:fs");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

async function verifyBouquetDecimal()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const page = await browser.newPage();
  const checks = [];
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const base = "file:///C:/laragon/www/rylva-green/public/pages/staff/bouquet-production.html?job=PRD-DEMO-041";
  async function settle()
  {
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  async function replace(selector, text)
  {
    await page.focus(selector);
    await page.keyboard.down("Control");
    await page.keyboard.press("a");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    assert.equal(await page.$eval(selector, (input) => input.value), "");
    await page.keyboard.type(text);
  }
  try
  {
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(base, { waitUntil: "networkidle0" });
    await page.click('[data-bouquet-action="consume"]');
    const ribbon = await page.evaluate(() => `#use-${bJobAllocations(bouquetJobs[2]).find((entry) => entry.materialId === "ribbon").id}`);
    const rose = await page.evaluate(() => `#use-${bJobAllocations(bouquetJobs[2]).find((entry) => entry.materialId === "rose").id}`);
    await replace(ribbon, "0.29");
    assert.equal(await page.$eval(ribbon, (input) => input.value), "0.29");
    assert.equal(await page.$eval(ribbon, (input) => input.validity.stepMismatch), false);
    checks.push("Real key-by-key 0.29 meter entry preserves decimal and allows clearing/replacing prefill");
    await replace(rose, "1.5");
    await page.$$eval('#bouquet-dialog-body input[type="number"]', (inputs, roseSelector) =>
    {
      inputs.filter((input) => `#${input.id}` !== roseSelector).forEach((input) => input.value = "0");
    }, rose);
    await page.type("#bouquet-action-reason", "Pengujian jumlah pecahan");
    const before = await page.evaluate(() => materialLedger.length);
    await page.click("#bouquet-dialog-submit");
    await settle();
    assert.equal(await page.evaluate(() => materialLedger.length), before);
    assert.ok(await page.$(".bouquet-save-error"));
    await replace(rose, "0");
    await replace(ribbon, "0.29");
    await page.click("#bouquet-dialog-submit");
    await settle();
    assert.equal(await page.evaluate(() => materialLedger.length), before + 1);
    assert.equal(await page.evaluate(() => bConsumed(bouquetJobs[2], "ribbon")), 29);
    assert.equal(await page.evaluate(() => bCanFinish(bouquetJobs[2])), false);
    checks.push("Fractional batang is blocked without mutation; 0.29 meter posts exactly 29 units and leaves work incomplete");
    await page.click('[data-bouquet-action="consume"]');
    await replace(ribbon, "999");
    assert.equal(await page.$eval(ribbon, (input) => input.value), "1.21");
    await page.keyboard.press("ArrowUp");
    assert.equal(await page.$eval(ribbon, (input) => input.value), "1.21");
    await replace(ribbon, "-1");
    await page.focus("#bouquet-action-reason");
    assert.equal(await page.$eval(ribbon, (input) => input.value), "0");
    checks.push("Typing and incrementing stop at 1.21 meter remaining; completed negative entry clamps to zero");
    await page.click("#bouquet-dialog-cancel");
    await page.click('[data-bouquet-action="consume"]');
    await replace(ribbon, "0.29");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: ".impeccable/review/bouquet-production/decimal-entry-390.png" });
    assert.deepEqual(errors, []);
    const result = { checks, errors };
    fs.writeFileSync(".impeccable/review/bouquet-production/decimal-verification.json", JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyBouquetDecimal().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
