const assert = require("node:assert/strict");
const fs = require("node:fs");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

async function verifyMaterialFixes()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const evidence = [];
  const errors = [];

  try
  {
    const page = await browser.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    const url = "file:///C:/laragon/www/rylva-green/public/pages/staff/production-materials.html";

    for (const width of [320, 390, 768, 1024, 1100, 1280, 1440, 1920])
    {
      await page.setViewport({ width, height: 1000 });
      await page.goto(url + "?material=rose&tab=batches", { waitUntil: "networkidle0" });
      await page.evaluate(() => document.fonts.ready);
      const result = await page.evaluate(() =>
      {
        const table = document.querySelector(".material-batches");
        const cells = [...table.tBodies[0].rows[0].cells];
        const dateCell = cells.at(-1);
        const label = table.querySelector(".material-signal-label");
        const start = label.textContent.indexOf("digunakan");
        const range = document.createRange();
        range.setStart(label.firstChild, start);
        range.setEnd(label.firstChild, start + "digunakan".length);
        const badge = label.parentElement.getBoundingClientRect();
        const badgeCell = label.closest("td").getBoundingClientRect();
        return {
          width: innerWidth,
          tableHeader: getComputedStyle(table.tHead).display,
          dateLabel: getComputedStyle(dateCell, "::before").content,
          dateLabelDisplay: getComputedStyle(dateCell, "::before").display,
          alignment: cells.slice(1).map((cell) => getComputedStyle(cell).textAlign),
          wordRects: range.getClientRects().length,
          badgeContained: badge.left >= badgeCell.left - 1 && badge.right <= badgeCell.right + 1,
          pageFits: document.documentElement.scrollWidth <= innerWidth + 1
        };
      });
      assert.ok(result.pageFits && result.badgeContained, JSON.stringify(result));
      assert.equal(result.wordRects, 1, "Status words remain whole");

      if (width <= 1099)
      {
        assert.equal(result.dateLabel, '"Batas pakai"');
        assert.notEqual(result.dateLabelDisplay, "none");
        assert.ok(result.alignment.every((value) => value === "left"));
      }
      else
      {
        assert.equal(result.alignment[0], "right");
      }
      evidence.push(result);

      for (const query of ["?workspace=usage", "?material=rose&tab=usage"])
      {
        await page.goto(url + query, { waitUntil: "networkidle0" });
        const gap = await page.$eval(".material-usage-history-title", (heading) =>
        {
          return heading.getBoundingClientRect().top - heading.previousElementSibling.getBoundingClientRect().bottom;
        });
        assert.ok(gap >= 24, `Usage history gap ${gap} at ${width}, ${query}`);
      }
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(".impeccable/review/materials/fix-verification.json", JSON.stringify({ evidence, errors }, null, 2));
    console.log(JSON.stringify({ viewports: evidence.length, wordAndLabelChecks: "passed", sectionGapChecks: "passed", errors }));
  }
  finally
  {
    await browser.close();
  }
}

verifyMaterialFixes().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
