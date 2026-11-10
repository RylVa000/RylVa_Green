const assert = require("node:assert/strict");
const fs = require("node:fs");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

async function verifyCustomerFixes()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const checks = [];
  const errors = [];
  const page = await browser.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  const base = "file:///C:/laragon/www/rylva-green/public/";
  try
  {
    for (const width of [320, 390, 768, 1440])
    {
      await page.setViewport({ width, height: 1000 });
      for (const tab of ["notes", "activity"])
      {
        await page.goto(`${base}customers.html?customer=PLG-0002&tab=${tab}`, { waitUntil: "networkidle0" });
        const visible = await page.evaluate(() =>
        {
          const nav = document.querySelector(".customer-tabs").getBoundingClientRect();
          const active = document.querySelector('.customer-tabs [aria-current="page"]').getBoundingClientRect();
          return active.left >= nav.left - 1 && active.right <= nav.right + 1;
        });
        assert.ok(visible, `${tab} completely visible at ${width}`);
      }
      await page.goto(`${base}customers.html`, { waitUntil: "networkidle0" });
      const fits = await page.evaluate(() =>
      {
        return ["customer-status-filter-combobox", "customer-sort"].every((id) =>
        {
          const input = document.getElementById(id);
          const style = getComputedStyle(input);
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          context.font = style.font;
          const select = input.tagName === "SELECT" ? input : document.getElementById("customer-status-filter");
          const contentWidth = input.clientWidth
            - Number.parseFloat(style.paddingLeft)
            - Number.parseFloat(style.paddingRight)
            - (input.tagName === "SELECT" ? 20 : 0);
          return [...select.options].every((option) => context.measureText(option.textContent).width < contentWidth);
        });
      });
      assert.ok(fits, `Full default filter labels fit at ${width}`);
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      assert.equal(await page.evaluate(() => document.activeElement.id), "main-content");
    }
    checks.push("Active Notes/Activity tabs visible on direct URLs at 320/390/768/1440");
    checks.push("Every status and ordering option fits when selected at 320/390/768/1440");
    checks.push("Skip navigation transfers keyboard focus to main at all four widths");
    await page.goto(`${base}customers.html?customer=PLG-0001&tab=activity`, { waitUntil: "networkidle0" });
    await page.click('[data-customer-action="tab"][data-tab="notes"]');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.tab), "notes");
    checks.push("Selected tab retains keyboard focus after rerender");
    await page.goto(`${base}admin-dashboard.html?role=superadmin`, { waitUntil: "networkidle0" });
    assert.match(await page.$eval('[title="Pelanggan"]', (node) => node.href), /customers.html\?role=superadmin/);
    assert.match(await page.$eval('[title="Bahan Produksi"]', (node) => node.href), /production-materials.html\?role=superadmin/);
    checks.push("SuperAdmin dashboard preserves distinct Customers and Materials links");
    assert.deepEqual(errors, []);
    fs.writeFileSync(".impeccable/review/customers/fix-verification.json", JSON.stringify({ checks, errors }, null, 2));
    console.log(JSON.stringify({ checks, errors }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyCustomerFixes().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
