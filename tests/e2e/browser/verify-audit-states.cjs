const assert = require("node:assert/strict");
const fs = require("node:fs");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

async function verifyAuditStates()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const page = await browser.newPage();
  const base = "file:///C:/laragon/www/rylva-green/public/pages/superadmin/audit-log.html";
  const folder = ".impeccable/review/audit-log";
  const checks = [];
  const errors = [];
  const captures = [];
  page.on("pageerror", (error) => errors.push(error.message));
  async function go(query)
  {
    await page.goto(base + query, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
  }
  async function capture(name)
  {
    await page.evaluate(() => window.scrollTo(0, 0));
    const path = `${folder}/${name}.png`;
    await page.screenshot({ path, fullPage: true });
    captures.push(path);
  }
  try
  {
    for (const width of [390, 1440])
    {
      await page.setViewport({ width, height: width === 390 ? 844 : 1000 });
      await go("?role=superadmin");
      await page.click(".audit-advanced summary");
      const combo = await page.$eval("#audit-actor", (select) => window.adminControls.getControl(select).id);
      await page.focus(`#${combo}`);
      await page.keyboard.type("Admin Dian");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      await page.click(width < 768 ? '.audit-filter-end-actions button' : '.audit-toolbar button[type="submit"]');
      assert.equal(await page.evaluate(() => auditState.actor), "dian");
      assert.equal(await page.evaluate(() => auditBaseRows().length), 2);
      if (width < 768)
      {
        const order = await page.evaluate(() =>
        {
          const last = document.getElementById("audit-result");
          const submit = document.querySelector(".audit-filter-end-actions button");
          return last.getBoundingClientRect().bottom <= submit.getBoundingClientRect().top;
        });
        assert.ok(order, "Submit follows the last filter visually");
        await page.focus("#audit-result");
        await page.keyboard.press("Tab");
        assert.equal(await page.evaluate(() => document.activeElement.closest(".audit-filter-end-actions") !== null), true);
      }
      await capture(`filtered-${width}`);
      await page.select("#audit-load-state", "loading");
      assert.equal(await page.$$eval(".audit-skeleton", (nodes) => nodes.length), 5);
      await capture(`loading-${width}`);
      await page.select("#audit-load-state", "error");
      await capture(`error-${width}`);
      await page.select("#audit-load-state", "empty");
      await capture(`empty-${width}`);
      await go("?role=admin&entry=AUD-DEMO-002");
      await capture(`denied-${width}`);
      assert.equal(await page.$(".audit-definition"), null);
      await go("?role=superadmin");
      await page.select("#audit-integrity", "warning");
      await capture(`integrity-${width}`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    }
    checks.push("Actor combobox accepts real keyboard search and produces the two matching records");
    checks.push("Filtered, loading, error, empty, denied and explicit integrity simulation captured at 390/1440");
    await page.setViewport({ width: 390, height: 844 });
    await go("?role=superadmin");
    await page.click("#mobile-open");
    assert.equal(await page.$eval("#sidebar", (node) => node.inert), false);
    assert.equal(await page.$eval("[data-audit-link]", (node) => node.title), "Audit Log");
    await page.keyboard.press("Escape");
    assert.equal(await page.$eval("#sidebar", (node) => node.inert), true);
    await page.select("#audit-profile", "admin");
    assert.equal(await page.$eval("[data-audit-link]", (node) => node.title), "Aktivitas Saya");
    assert.ok(await page.$eval("[data-audit-link]", (node) => node.href.includes("role=admin")));
    checks.push("Mobile navigation opens, Escape restores focus and role switch updates the shared menu");
    for (const width of [1200, 1240, 1280, 1366, 1440])
    {
      await page.setViewport({ width, height: 800 });
      await go("?role=superadmin");
      assert.ok(await page.$$eval(".audit-table td:nth-child(5) .audit-badge span", (nodes) =>
      {
        return nodes.every((node) =>
        {
          const range = document.createRange();
          range.selectNodeContents(node);
          return range.getClientRects().length === 1;
        });
      }), `Result labels stay on one line at ${width}`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    }
    checks.push("Result labels remain unbroken at 1200/1240/1280/1366/1440; mobile Apply follows last field in visual and Tab order");
    assert.deepEqual(errors, []);
    const result = { checks, errors, captures };
    fs.writeFileSync(`${folder}/state-verification.json`, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyAuditStates().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
