const assert = require("node:assert/strict");
const fs = require("node:fs");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

async function verifyBouquetEdges()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const page = await browser.newPage();
  const errors = [];
  const checks = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());
  const base = "file:///C:/laragon/www/rylva-green/public/";
  async function settle()
  {
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  async function click(selector)
  {
    await page.click(selector);
    await settle();
  }
  async function fill(selector, value)
  {
    await page.$eval(selector, (input, text) =>
    {
      input.value = text;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);
  }
  try
  {
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(base + "bouquet-production.html?workspace=configuration", { waitUntil: "networkidle0" });
    await click('[data-bouquet-action="new-recipe"]');
    await fill("#bouquet-name", "Buket uji formulir");
    await fill("#bouquet-code", "DEMO-TEST-CREATE");
    await fill("#bouquet-price", "75000");
    await click('[data-bouquet-action="add-group"]');
    const groupId = await page.evaluate(() => bouquetDraft.groups[0].id);
    await fill(`#${groupId}-name`, "Bunga utama");
    await click(`[data-bouquet-action="add-option"][data-id="${groupId}"]`);
    const optionId = await page.evaluate(() => bouquetDraft.groups[0].options[0].id);
    await fill(`#${optionId}-name`, "Mawar 3 batang");
    await click(`details[open] [data-bouquet-action="add-ingredient"]`);
    const selectId = `${optionId}-material-0`;
    const comboId = await page.$eval(`#${selectId}`, (select) => window.adminControls.getControl(select).id);
    await page.focus(`#${comboId}`);
    await page.keyboard.type("mawar");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await settle();
    assert.equal(await page.evaluate(() => bouquetDraft.groups[0].options[0].ingredients[0].materialId), "rose");
    await fill(`#${optionId}-units-0`, "3");
    await page.select("#bouquet-active", "true");
    await fill("#bouquet-change-reason", "Pembuatan konfigurasi untuk uji");
    assert.deepEqual(await page.evaluate(() => bRecipeErrors(bouquetDraft)), []);
    await page.evaluate(() => document.getElementById("bouquet-fail-save").checked = true);
    await click('#bouquet-editor-form button[type="submit"]');
    assert.ok(await page.$(".bouquet-save-error"));
    assert.equal(await page.evaluate(() => bouquetRecipes.length), 2);
    assert.equal(await page.$eval("#bouquet-name", (input) => input.value), "Buket uji formulir");
    await click('#bouquet-editor-form button[type="submit"]');
    assert.equal(await page.evaluate(() => bouquetRecipes.length), 3);
    assert.equal(await page.evaluate(() => bouquetRecipes.at(-1).version), 1);
    assert.equal(await page.evaluate(() => bouquetRecipes.at(-1).active), true);
    checks.push("Create configuration entirely via form, keyboard material search, failed save and retry");
    await page.goto(base + "bouquet-production.html?job=PRD-DEMO-041", { waitUntil: "networkidle0" });
    assert.equal(await page.evaluate(() => bReadUnits("0.29", bMaterial("ribbon"))), 29);
    assert.equal(await page.evaluate(() => Number.isNaN(bReadUnits("1.5", bMaterial("rose")))), true);
    assert.equal(await page.evaluate(() => Number.isNaN(bReadUnits("", bMaterial("rose")))), true);
    await click('[data-bouquet-action="consume"]');
    await fill("#bouquet-action-reason", "Pemakaian sebagian contoh");
    await page.$$eval('#bouquet-dialog-body input[type="number"]', (inputs) =>
    {
      inputs.forEach((input, index) => input.value = index === 0 ? "1.5" : "0");
    });
    const before = await page.evaluate(() => materialLedger.length);
    await click("#bouquet-dialog-submit");
    assert.equal(await page.evaluate(() => materialLedger.length), before);
    await page.$eval('#bouquet-dialog-body input[type="number"]', (input) => input.value = "1");
    await click("#bouquet-dialog-submit");
    assert.equal(await page.evaluate(() => materialLedger.length), before + 1);
    assert.equal(await page.evaluate(() => bConsumed(bouquetJobs[2], "rose")), 1);
    assert.equal(await page.evaluate(() => bCanFinish(bouquetJobs[2])), false);
    checks.push("Decimal meter quantities are exact; fractional discrete units reject; partial usage cannot finish job");
    for (const file of ["admin-dashboard", "orders-queue", "products", "production-materials", "customers", "closure-calendar", "financial-report"])
    {
      await page.goto(`${base}${file}.html?role=superadmin`, { waitUntil: "networkidle0" });
      const links = await page.$$eval('a[href*="bouquet-production.html"]', (nodes) => nodes.map((node) => node.href));
      assert.equal(links.length, 1, `${file} should have exactly one bouquet menu link`);
      assert.ok(links[0].includes("role=superadmin"), `${file} preserves role`);
    }
    checks.push("Seven incumbent admin page menus link once to bouquet workspace and preserve SuperAdmin role");
    assert.deepEqual(errors, []);
    const result = { checks, errors };
    fs.writeFileSync(".impeccable/review/bouquet-production/edge-verification.json", JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyBouquetEdges().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
