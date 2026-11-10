const assert = require("node:assert/strict");
const fs = require("node:fs");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

async function verifyMaterialEdges()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const checks = [];

  try
  {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewport({ width: 1440, height: 1000 });
    const base = "file:///C:/laragon/www/rylva-green/public/";
    await page.goto(`${base}production-materials.html?material=rose&mode=adjustment`, { waitUntil: "networkidle0" });
    await page.select("#material-batchId", "MWR-0411");
    await page.$eval("#material-quantity", (node) =>
    {
      node.value = "-99";
      node.dispatchEvent(new Event("input", { bubbles: true }));
      node.focus();
    });
    assert.equal(await page.$eval("#material-quantity", (node) => node.value), "-18");
    await page.keyboard.press("ArrowDown");
    assert.equal(await page.$eval("#material-quantity", (node) => node.value), "-18");
    assert.match(await page.$eval("#material-movement-preview", (node) => node.textContent), /34 batang menjadi 16 batang/);
    assert.ok(await page.evaluate(() => validateMaterialMovement(
    {
      materialId: "rose", type: "adjustment", unit: "batang", batchId: "MWR-0411",
      quantity: -19, reason: "Pemeriksaan contoh", reference: "DEMO-EDGE"
    }).length > 0));
    checks.push("Signed adjustments clamp immediately at unallocated batch balance and submission validation independently rejects an overdraw");
    await page.evaluate(() => materialDirty = false);
    await page.goto(`${base}production-materials.html?role=superadmin`, { waitUntil: "networkidle0" });
    assert.ok(await page.evaluate(() =>
    {
      const own = { ...materialApprovals[0], actor: mActor() };
      const stale = { ...materialApprovals[0], units: -100 };
      return mValidateDecision(own, { decision: "approve", reason: "Alasan verifikasi" }).length > 0
        && mValidateDecision(stale, { decision: "approve", reason: "Alasan verifikasi" }).length > 0;
    }));
    checks.push("Approval guards reject self-approval and a negative request exceeding the latest free balance");

    for (const width of [320, 390, 768, 1440])
    {
      await page.setViewport({ width, height: 1000 });
      await page.goto(`${base}production-materials.html?mode=receipt`, { waitUntil: "networkidle0" });
      const selector = "#material-materialId-combobox";
      await page.click(selector);
      await page.type(selector, "pita");
      assert.equal(await page.$$eval('.admin-combobox-popup:not([hidden]) [role="option"]', (nodes) => nodes.length), 1);
      const box = await page.$eval('.admin-combobox-popup:not([hidden])', (node) =>
      {
        const rect = node.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: innerWidth, height: innerHeight };
      });
      assert.ok(box.left >= 0 && box.right <= box.width + 1 && box.top >= 0 && box.bottom <= box.height + 1);
      await page.screenshot({ path: `.impeccable/review/materials/combobox-${width}.png` });
      await page.keyboard.press("Escape");
      assert.match(await page.$eval(selector, (node) => node.value), /Mawar merah/);
    }
    checks.push("Click and type filters immediately without Ctrl+A; Escape restores selection and popup fits phone/tablet/desktop");
    await page.goto(`${base}admin-dashboard.html?role=superadmin`, { waitUntil: "networkidle0" });
    assert.match(await page.$eval('a[title="Bahan Produksi"]', (node) => node.href), /production-materials.html\?role=superadmin/);
    await page.goto(`${base}financial-report.html`, { waitUntil: "networkidle0" });
    assert.match(await page.$eval('a[title="Bahan Produksi"]', (node) => node.href), /production-materials.html\?role=superadmin/);
    checks.push("Dashboard and financial-report navigation open materials with the correct SuperAdmin preview");
    assert.deepEqual(errors, []);
    const result = { checks, errors };
    fs.writeFileSync(".impeccable/review/materials/edge-verification.json", JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyMaterialEdges().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
