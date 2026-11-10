const assert = require("node:assert/strict");
const fs = require("node:fs");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

async function verifyAuditLog()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const page = await browser.newPage();
  const base = "file:///C:/laragon/www/rylva-green/public/";
  const folder = ".impeccable/review/audit-log";
  const errors = [];
  const checks = [];
  const captures = [];
  page.on("pageerror", (error) => errors.push(error.message));
  async function go(query = "")
  {
    await page.goto(base + "audit-log.html" + query, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
  }
  async function click(selector)
  {
    await page.click(selector);
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  async function setValue(selector, value)
  {
    await page.$eval(selector, (input, text) => input.value = text, value);
  }
  async function apply()
  {
    await click('.audit-filters button[type="submit"]');
  }
  try
  {
    await page.setViewport({ width: 1440, height: 1000 });
    await go();
    assert.equal(await page.$eval("#audit-title", (node) => node.textContent), "Aktivitas Saya");
    assert.ok(await page.evaluate(() => auditVisibleEntries().every((entry) => entry.actorId === "admin")));
    assert.equal(await page.evaluate(() => auditAccessEntries.length), 1);
    assert.equal(await page.$eval("#audit-actor", (node) => node.disabled), true);
    assert.equal(await page.$$eval(".audit-summary strong", (nodes) => nodes.map((node) => node.textContent).join(",")), "8,1,0,1");
    await click('[data-audit-action="page"][data-page="2"]');
    assert.equal(await page.$$eval(".audit-table tbody tr", (nodes) => nodes.length), 3);
    await go("?role=admin&actor=dian&entry=AUD-DEMO-002");
    assert.equal(await page.evaluate(() => auditState.actor), "admin");
    assert.ok(await page.$eval("#audit-view", (node) => node.textContent.includes("Catatan tidak tersedia")));
    assert.equal(await page.$(".audit-definition"), null);
    checks.push("Admin sees only own records, actor cannot be overridden, foreign details disclose no record, pagination works");
    await go("?role=superadmin");
    assert.equal(await page.evaluate(() => auditVisibleEntries().length), 18);
    const seed = await page.evaluate(() => JSON.stringify(auditSeedEntries));
    await click('[data-audit-action="segment"][data-segment="failed"]');
    assert.equal(await page.$$eval(".audit-table tbody tr", (nodes) => nodes.length), 2);
    await click('[data-audit-action="entry"][data-entry="AUD-DEMO-003"]');
    assert.ok(await page.$eval(".audit-change-table", (node) => node.textContent.includes("18 pak18 pak")));
    assert.equal(await page.$(".audit-changed"), null);
    await click('[data-audit-action="back"]');
    assert.equal(await page.evaluate(() => auditState.segment), "failed");
    assert.ok(await page.evaluate(() => auditAccessEntries.length > 1));
    assert.equal(await page.evaluate(() => JSON.stringify(auditSeedEntries)), seed);
    assert.equal(await page.evaluate(() => Object.isFrozen(auditSeedEntries[0].changes[0])), true);
    checks.push("SuperAdmin sees all sources; failed stock mutation keeps balance; back preserves filter; view records append without modifying history");
    await click('[data-audit-action="clear"]');
    await setValue("#audit-search", "RG-FIC-M16");
    await apply();
    assert.equal(await page.$$eval(".audit-table tbody tr", (nodes) => nodes.length), 1);
    await click('[data-audit-action="entry"][data-entry="AUD-DEMO-002"]');
    assert.ok(await page.$(".audit-changed"));
    await page.select("#audit-profile", "admin");
    assert.equal(await page.$(".audit-definition"), null);
    assert.ok(await page.$eval("#audit-view", (node) => node.textContent.includes("Catatan tidak tersedia")));
    checks.push("SKU search and before/after detail work; role switch immediately removes foreign detail");
    await go("?role=superadmin&entry=AUD-DEMO-010");
    assert.equal(await page.$eval(".audit-panel .queue-badge", (node) => node.textContent), "Berhasil");
    assert.ok(await page.$eval(".audit-change-table", (node) => node.textContent.includes("Gagal")));
    await go("?role=superadmin&entry=AUD-DEMO-004");
    assert.ok(await page.$eval(".audit-definition", (node) => node.textContent.includes("SuperAdmin RylVa")));
    const relatedHref = await page.$eval('.audit-detail-grid a[href]', (node) => node.href);
    assert.ok(relatedHref.includes("role=superadmin"));
    checks.push("Action result stays separate from payment status; approval participants and role-aware source link are readable");
    await go("?role=superadmin");
    await page.select("#audit-period", "custom");
    await setValue("#audit-from", "2026-11-05");
    await setValue("#audit-to", "2026-11-04");
    await apply();
    assert.ok(await page.$(".audit-filter-error"));
    await setValue("#audit-from", "2026-11-01");
    await setValue("#audit-to", "2026-11-04");
    await apply();
    assert.equal(await page.evaluate(() => auditState.period), "custom");
    await click(".audit-advanced summary");
    assert.ok(await page.$('[role="combobox"]'));
    await page.select("#audit-module", "materials");
    await apply();
    assert.ok(await page.evaluate(() => auditBaseRows().every((entry) => entry.module === "materials")));
    await page.goBack();
    assert.equal(await page.evaluate(() => auditState.module), "all");
    checks.push("Custom date order validates; advanced searchable module filter and browser history restore state");
    await page.select("#audit-integrity", "warning");
    assert.ok(await page.$eval("#audit-view", (node) => node.textContent.includes("Simulasi: hasil pemeriksaan integritas")));
    await page.select("#audit-load-state", "empty");
    assert.equal(await page.$$eval(".audit-summary strong", (nodes) => nodes.map((node) => node.textContent).join(",")), "0,0,0,0");
    await page.select("#audit-load-state", "full");
    await page.evaluate(() => document.getElementById("audit-fail-load").checked = true);
    await click("#audit-reload");
    assert.ok(await page.$eval("#audit-view", (node) => node.textContent.includes("Riwayat gagal dimuat")));
    await click('[data-audit-action="retry"]');
    assert.equal(await page.evaluate(() => auditLoadState), "full");
    assert.equal(await page.evaluate(() => auditState.period), "custom");
    checks.push("Explicit integrity simulation, zero state, load failure and retry retain filters");
    for (const file of ["admin-dashboard", "financial-report", "orders-queue", "products", "production-materials", "customers", "closure-calendar", "bouquet-production"])
    {
      await page.goto(`${base}${file}.html?role=superadmin`, { waitUntil: "networkidle0" });
      const link = await page.$eval("[data-audit-link]", (node) =>
      {
        return { href: node.href, title: node.title, visible: Boolean(node.getClientRects().length) };
      });
      assert.ok(link.href.includes("audit-log.html?role=superadmin") && link.visible && link.title === "Audit Log", file);
    }
    checks.push("Eight incumbent admin pages have visible, role-aware Audit Log links");
    const surfaces =
    [
      ["admin", ""],
      ["superadmin", "?role=superadmin"],
      ["change", "?role=superadmin&entry=AUD-DEMO-002"],
      ["failed", "?role=superadmin&entry=AUD-DEMO-003"]
    ];
    for (const width of [320, 390, 640, 768, 1024, 1280, 1440, 1920])
    {
      await page.setViewport({ width, height: width < 768 ? 844 : 1000 });
      for (const [name, query] of surfaces)
      {
        await go(query);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name} at ${width} overflows`);
        if ([390, 768, 1440].includes(width))
        {
          const path = `${folder}/${name}-${width}.png`;
          await page.screenshot({ path, fullPage: true });
          captures.push(path);
        }
      }
    }
    assert.deepEqual(errors, []);
    checks.push("Four surfaces fit eight widths 320–1920; twelve screenshots captured, no browser errors");
    const result = { checks, errors, captures };
    fs.writeFileSync(`${folder}/verification.json`, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyAuditLog().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
