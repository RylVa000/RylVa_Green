const assert = require("node:assert/strict");
const fs = require("node:fs");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

async function verifyClosureLinks()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const page = await browser.newPage();
  const pages =
  [
    "admin-dashboard.html",
    "orders-queue.html",
    "products.html",
    "production-materials.html",
    "customers.html",
    "financial-report.html"
  ];
  const results = [];
  try
  {
    for (const file of pages)
    {
      await page.goto(`file:///C:/laragon/www/rylva-green/public/${file}?role=superadmin`,
      {
        waitUntil: "domcontentloaded"
      });
      await page.waitForFunction(() =>
      {
        const link = document.querySelector('[title="Kalender Tutup"]');
        return link && link.href.includes("role=superadmin");
      });
      const link = await page.$eval('[title="Kalender Tutup"]', (node) =>
      {
        return { href: node.href, className: node.className };
      });
      assert.match(link.href, /closure-calendar\.html\?role=superadmin/);
      if (file === "financial-report.html")
      {
        assert.match(link.className, /min-h-11/);
        assert.match(link.className, /items-center/);
      }
      results.push({ file, rolePreserved: true });
    }
    fs.writeFileSync(".impeccable/review/closure-calendar/links-verification.json", JSON.stringify({ results }, null, 2));
    console.log(JSON.stringify({ results }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyClosureLinks().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
