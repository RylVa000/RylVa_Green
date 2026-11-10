"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const root = path.resolve(__dirname, "../../..");
const pageRoutes = require("../../../config/preview-pages.json");
const pages = Object.values(pageRoutes);

async function checkPages()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"]
  });
  const page = await browser.newPage();
  const failures = [];
  const checks = [];
  let currentPage = "";
  page.on("pageerror", (error) => failures.push({ page: currentPage, error: error.message }));
  page.on("response", (response) =>
  {
    const url = new URL(response.url());
    if (url.hostname === "127.0.0.1" && response.status() >= 400 && url.pathname !== "/favicon.ico")
    {
      failures.push({ page: currentPage, resource: url.pathname, status: response.status() });
    }
  });
  try
  {
    for (const [legacy, target] of Object.entries(pageRoutes))
    {
      const response = await fetch(`http://127.0.0.1:4178/${legacy}?role=superadmin&tab=overview`, { redirect: "manual" });
      assert.equal(response.status, 302, `Legacy redirect missing: ${legacy}`);
      assert.equal(response.headers.get("location"), `/${target}?role=superadmin&tab=overview`, `Legacy parameters lost: ${legacy}`);
    }
    for (const missing of ["constructor", "__proto__", "unknown-page.html"])
    {
      const response = await fetch(`http://127.0.0.1:4178/${missing}`, { redirect: "manual" });
      assert.equal(response.status, 404, `Unknown route was redirected: ${missing}`);
    }
    for (const width of [390, 1440])
    {
      await page.setViewport({ width, height: 900 });
      for (const file of pages)
      {
        currentPage = `${file}@${width}`;
        await page.goto(`http://127.0.0.1:4178/${file}?role=superadmin`, { waitUntil: "domcontentloaded" });
        await page.evaluate(() => document.fonts.ready);
        const result = await page.evaluate(() =>
        {
          const title = document.querySelector("h1");
          return {
            title: title?.textContent.trim(),
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            font: getComputedStyle(document.body).fontFamily
          };
        });
        assert(result.title, `Missing title: ${currentPage}`);
        assert(!result.overflow, `Horizontal overflow: ${currentPage}`);
        assert(result.font.includes("Poppins"), `Font not loaded: ${currentPage}`);
        checks.push({ page: currentPage, ...result });
      }
    }
    const output = path.join(root, "storage/reports/project-structure/browser-check.json");
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, `${JSON.stringify({ checks, failures }, null, 2)}\n`);
    assert.equal(failures.length, 0, JSON.stringify(failures));
    console.log(`${checks.length} page/viewport checks passed; no missing local resources or browser errors.`);
  }
  finally
  {
    await browser.close();
  }
}

checkPages().catch((error) =>
{
  console.error(error.stack);
  process.exitCode = 1;
});
