const assert = require("node:assert/strict");
const fs = require("node:fs");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

async function verifyBouquetProduction()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const page = await browser.newPage();
  const folder = ".impeccable/review/bouquet-production";
  const base = "file:///C:/laragon/www/rylva-green/public/pages/staff/bouquet-production.html";
  const errors = [];
  const checks = [];
  const captures = [];
  fs.mkdirSync(folder, { recursive: true });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());
  async function go(query = "")
  {
    await page.goto(base + query, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
  }
  async function settle()
  {
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  async function click(selector)
  {
    await page.click(selector);
    await settle();
  }
  async function confirm()
  {
    await page.type("#bouquet-action-reason", "Pemeriksaan produksi contoh");
    await click("#bouquet-dialog-submit");
  }
  try
  {
    await page.setViewport({ width: 1440, height: 1000 });
    await go();
    assert.equal(await page.$$eval(".bouquet-summary strong", (nodes) => nodes.map((node) => node.textContent).join(",")), "1,1,1,0");
    await click('[data-bouquet-action="job"][data-id="PRD-KUSTOM-002"]');
    assert.equal(await page.$eval('[data-bouquet-action="start"]', (node) => node.disabled), true);
    checks.push("Summary derives from jobs; insufficient materials block start");
    await go("?job=PRD-KUSTOM-001");
    const before = await page.evaluate(() => materialLedger.length);
    await click('[data-bouquet-action="start"]');
    await page.evaluate(() => document.getElementById("bouquet-fail-save").checked = true);
    await confirm();
    assert.equal(await page.evaluate(() => bouquetJobs[0].status), "ready");
    assert.ok(await page.$(".bouquet-save-error"));
    await click("#bouquet-dialog-submit");
    assert.equal(await page.evaluate(() => bouquetJobs[0].status), "preparing");
    assert.equal(await page.evaluate(() => materialLedger.length), before);
    assert.ok(await page.evaluate(() => bJobAllocations(bouquetJobs[0]).every((entry) => entry.batchId !== "MWR-0111")));
    assert.equal(await page.$eval('[data-bouquet-action="finish"]', (node) => node.disabled), true);
    await click('[data-bouquet-action="consume"]');
    await page.$eval('#bouquet-dialog-body input[type="number"]', (node) =>
    {
      node.value = "999";
      node.dispatchEvent(new Event("input", { bubbles: true }));
      if (node.value !== node.max)
      {
        throw new Error("Consumption must clamp to allocation");
      }
    });
    await confirm();
    assert.ok(await page.evaluate(() => bCanFinish(bouquetJobs[0])));
    assert.equal(await page.$('[data-bouquet-action="release"]'), null);
    await click('[data-bouquet-action="finish"]');
    await confirm();
    assert.equal(await page.evaluate(() => bouquetJobs[0].status), "complete");
    const finalLength = await page.evaluate(() => materialLedger.length);
    assert.equal(finalLength, before + 5);
    assert.ok(await page.evaluate(() => productionMaterials.every((material) => bAvailable(material) >= 0)));
    checks.push("Save failure is atomic; FEFO allocations preserve physical stock; bounded consumption then completion");
    await go("?job=PRD-KUSTOM-001");
    await click('[data-bouquet-action="start"]');
    await confirm();
    await click('[data-bouquet-action="release"]');
    await confirm();
    assert.equal(await page.evaluate(() => bouquetJobs[0].status), "ready");
    assert.equal(await page.evaluate(() => bJobAllocations(bouquetJobs[0]).reduce((sum, entry) => sum + bRemaining(entry), 0)), 0);
    await click('[data-bouquet-action="issue"]');
    await confirm();
    assert.equal(await page.evaluate(() => bStage(bouquetJobs[0])), "attention");
    await click('[data-bouquet-action="resume"]');
    await confirm();
    assert.equal(await page.evaluate(() => bStage(bouquetJobs[0])), "ready");
    checks.push("Release before consumption, issue and resume preserve stage and record history");
    await go("?workspace=configuration&recipe=custom-rose&mode=edit");
    assert.equal(await page.evaluate(() => bRecipeErrors(bouquetDraft).length), 0);
    await page.evaluate(() =>
    {
      const quantity = document.getElementById("bouquet-preview-quantity");
      quantity.value = "2";
      quantity.dispatchEvent(new Event("input", { bubbles: true }));
    });
    assert.equal(await page.$eval(".bouquet-preview-price", (node) => node.textContent.replace(/\s/g, "")), "Rp430.000");
    assert.equal(await page.evaluate(() => bouquetDirty), false);
    const snapshots = await page.evaluate(() => JSON.stringify(bouquetJobs.map((job) => [job.needs, job.choices, job.price])));
    await page.$eval("#bouquet-price", (node) =>
    {
      node.value = "200000";
      node.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.type("#bouquet-change-reason", "Perubahan harga contoh");
    await click('#bouquet-editor-form button[type="submit"]');
    assert.equal(await page.evaluate(() => bouquetRecipes[0].version), 2);
    assert.equal(await page.evaluate(() => JSON.stringify(bouquetJobs.map((job) => [job.needs, job.choices, job.price]))), snapshots);
    assert.equal(await page.evaluate(() => bouquetDirty), false);
    checks.push("Preview multiplies price and materials without dirtying; saved version preserves old job snapshots");
    await go("?workspace=configuration&recipe=custom-rose&mode=edit");
    await page.evaluate(() =>
    {
      bouquetDraft.productCode = bouquetRecipes[1].productCode;
      bouquetDraft.groups[0].maximum = 99;
      bouquetDraft.base[0].units = -1;
    });
    await click('#bouquet-editor-form button[type="submit"]');
    assert.ok(await page.$(".bouquet-validation"));
    assert.equal(await page.evaluate(() => bouquetRecipes[0].version), 1);
    assert.ok(await page.evaluate(() => bRecipeErrors(bouquetDraft).length >= 3));
    await go("?workspace=configuration&recipe=custom-rose&mode=edit");
    await click('[data-bouquet-action="add-option"][data-id="flowers"]');
    assert.equal(await page.$$eval("details[data-option-id][open]", (nodes) => nodes.length), 1);
    await click('details[open] [data-bouquet-action="add-ingredient"]');
    assert.ok(await page.$('details[open] [role="combobox"]'));
    assert.ok(await page.evaluate(() =>
    {
      bouquetDraft.groups[2].options[0].incompatible = "rose-six";
      bouquetPreviewChoices = ["rose-six", "wrap-ivory", "baby-extra"];
      renderBouquetPreview();
      return document.getElementById("bouquet-config-preview").textContent.includes("tidak dapat digabung");
    }));
    checks.push("Invalid codes, amounts and option constraints block saves; single open editor and searchable material control");
    await go("?role=superadmin");
    assert.equal(await page.evaluate(() => bouquetState.role), "superadmin");
    await page.select("#bouquet-load-state", "error");
    assert.ok(await page.$('[role="alert"]'));
    await click('[data-bouquet-action="retry"]');
    await page.select("#bouquet-load-state", "empty");
    assert.equal(await page.$$eval(".bouquet-summary strong", (nodes) => nodes.map((node) => node.textContent).join(",")), "0,0,0,0");
    checks.push("Role preview, error recovery and empty state work");
    const surfaces =
    [
      ["queue", ""],
      ["job", "?job=PRD-KUSTOM-002"],
      ["configurations", "?workspace=configuration"],
      ["editor", "?workspace=configuration&recipe=custom-rose&mode=edit"]
    ];
    for (const width of [320, 390, 640, 768, 1024, 1280, 1440, 1920])
    {
      await page.setViewport({ width, height: width < 768 ? 844 : 1000 });
      for (const [name, query] of surfaces)
      {
        await go(query);
        const dimensions = await page.evaluate(() =>
        {
          return { viewport: innerWidth, content: document.documentElement.scrollWidth };
        });
        assert.ok(dimensions.content <= dimensions.viewport + 1, `${name} at ${width} overflows: ${JSON.stringify(dimensions)}`);
        if ([390, 768, 1440].includes(width))
        {
          const path = `${folder}/${name}-${width}.png`;
          await page.screenshot({ path, fullPage: true });
          captures.push(path);
        }
      }
    }
    await page.setViewport({ width: 390, height: 844 });
    await go("?job=PRD-DEMO-041");
    await click('[data-bouquet-action="consume"]');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${folder}/consume-390.png` });
    captures.push(`${folder}/consume-390.png`);
    checks.push("Four surfaces fit eight widths 320–1920; 13 screenshots captured");
    assert.deepEqual(errors, []);
    fs.writeFileSync(`${folder}/verification.json`, JSON.stringify({ checks, errors, captures }, null, 2));
    console.log(JSON.stringify({ checks, errors, captures }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyBouquetProduction().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
