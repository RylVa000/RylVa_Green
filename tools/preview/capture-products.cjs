const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const puppeteer = require("../testing/browser-runtime.cjs");
const assert = require("node:assert/strict");

async function captureProducts()
{
  const directory = path.resolve(".impeccable/review/products");
  fs.mkdirSync(directory, { recursive: true });
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
    const pageUrl = pathToFileURL(path.resolve("public/products.html")).href;

    async function capture(name)
    {
      await page.evaluate(() =>
      {
        document.activeElement?.blur();
        window.scrollTo(0, 0);
      });
      await page.screenshot({ path: path.join(directory, `${name}-fold.png`) });
      await page.screenshot({ path: path.join(directory, `${name}.png`), fullPage: true });
    }

    for (const [name, width, query] of
    [
      ["catalog-desktop", 1440, ""],
      ["catalog-mobile", 390, ""],
      ["detail-desktop", 1440, "?product=ficus"],
      ["editor-desktop", 1440, "?product=ficus&mode=edit"],
      ["editor-mobile", 390, "?product=ficus&mode=edit"],
      ["approvals-desktop", 1440, "?workspace=approvals&role=superadmin"]
    ])
    {
      await page.setViewport({ width, height: 1000 });
      await page.goto(pageUrl + query, { waitUntil: "networkidle0" });
      await page.evaluate(() => document.fonts.ready);
      await capture(name);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      console.log(JSON.stringify({ name, overflow, errors }));
    }

    const headerChecks = [];

    for (const width of [640, 768, 1024, 1280])
    {
      await page.setViewport({ width, height: 1000 });
      await page.goto(pageUrl, { waitUntil: "networkidle0" });
      await page.click('[data-action="toggle-variants"][data-id="ficus"]');
      const headerCheck = await page.evaluate(() =>
      {
        const table = document.querySelector("#variants-ficus .variant-table");
        const headings = [...table.querySelectorAll("thead th")];
        const values = [...table.tBodies[0].rows[0].cells];
        return {
          width: innerWidth,
          bodyDisplay: getComputedStyle(table.tBodies[0]).display,
          headerDisplay: getComputedStyle(table.tHead).display,
          labels: values.map((cell) =>
          {
            const bounds = cell.getBoundingClientRect();
            return {
              label: cell.dataset.label,
              before: getComputedStyle(cell, "::before").content,
              labelDisplay: getComputedStyle(cell, "::before").display,
              left: bounds.left,
              right: bounds.right
            };
          }),
          headings: headings.map((heading, index) =>
          {
            const headerBounds = heading.getBoundingClientRect();
            const valueBounds = values[index].getBoundingClientRect();
            return {
              label: heading.textContent,
              left: headerBounds.left,
              right: headerBounds.right,
              columnDifference: Math.abs(headerBounds.left - valueBounds.left)
            };
          })
        };
      });
      if (width < 768)
      {
        assert.equal(headerCheck.headerDisplay, "none");
        assert.ok(headerCheck.labels.every((label) => label.left >= 0 && label.right <= width));
        assert.ok(headerCheck.labels.slice(1, 6).every((label) =>
        {
          return label.label && label.before !== "none" && label.labelDisplay !== "none";
        }));
      }
      else
      {
        assert.equal(headerCheck.bodyDisplay, "table-row-group");
        assert.equal(headerCheck.headings.length, 7);
        assert.ok(headerCheck.headings.every((heading) => heading.left >= 0 && heading.right <= width));
        assert.ok(headerCheck.headings.every((heading) => heading.columnDifference < 1));
      }
      headerChecks.push(headerCheck);
      await capture(`variants-${width}`);
    }

    fs.writeFileSync(path.join(directory, "tablet-header-verification.json"), JSON.stringify(
    {
      passed: true,
      checks: headerChecks,
      browserErrors: errors
    }, null, 2));

    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(pageUrl + "?product=ficus&tab=stock", { waitUntil: "networkidle0" });
    await page.click('#product-detail-view [data-action="stock-movement"][data-variant="v1"]');

    for (const [key, value] of Object.entries(
    {
      quantity: "5",
      reference: "DEMO-PENERIMAAN-04",
      reason: "Jumlah fisik dan dokumen contoh telah diperiksa."
    }))
    {
      await page.$eval(`#product-task-${key}`, (node, text) =>
      {
        node.value = text;
        node.dispatchEvent(new Event("input", { bubbles: true }));
      }, value);
    }

    await page.$eval(".product-preview-controls", (node) => node.open = true);
    await page.click("#product-fail-save");
    await page.click("#save-movement");
    await page.waitForFunction(() => document.getElementById("product-confirm").open);
    await page.click("#product-confirm-submit");
    await page.waitForFunction(() =>
    {
      const error = document.querySelector("#product-stock-form .product-error-summary");
      return !productSaving && error && !error.hidden && error.textContent.includes("Perubahan belum disimpan");
    });
    await capture("movement-recovery");
    console.log(JSON.stringify({ recoveryCaptured: true, errors }));
  }
  finally
  {
    await browser.close();
  }
}

captureProducts().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
