const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

async function verifyEmptyCatalog()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });

  try
  {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewport({ width: 1440, height: 1000 });
    const url = pathToFileURL(path.resolve("public/pages/staff/products.html")).href;
    await page.goto(url + "?state=empty", { waitUntil: "networkidle0" });
    const counts = await page.$$eval(".catalog-stat strong, #approval-count", (nodes) => nodes.map((node) => node.textContent));
    assert.ok(counts.every((count) => count === "0"));
    assert.equal(await page.$eval("#catalog-empty", (node) => node.hidden), false);
    await page.screenshot({ path: ".impeccable/review/products/catalog-empty.png", fullPage: true });
    await page.click("#catalog-empty-action");
    assert.equal(await page.$eval("#product-editor-view", (node) => node.hidden), false);
    assert.deepEqual(errors, []);
    fs.writeFileSync(".impeccable/review/products/empty-verification.json", JSON.stringify(
    {
      passed: true,
      checks: ["Empty catalog has zero summary and approval counts and opens the new-product form"],
      browserErrors: errors
    }, null, 2));
    console.log("Empty catalog passed: counters agree and add-product action works.");
  }
  finally
  {
    await browser.close();
  }
}

verifyEmptyCatalog().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
