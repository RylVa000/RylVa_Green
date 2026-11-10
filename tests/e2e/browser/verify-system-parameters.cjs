"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const folder = ".impeccable/review/system-parameters";
const base = "file:///C:/laragon/www/rylva-green/public/";
fs.mkdirSync(folder, { recursive: true });

async function verify()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const page = await browser.newPage();
  const errors = [];
  const checks = [];
  const captures = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());

  async function go(query = "")
  {
    await page.goto(base + "system-parameters.html" + query, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
  }

  async function click(selector)
  {
    await page.click(selector);
  }

  async function fill(selector, value)
  {
    await page.$eval(selector, (input, text) =>
    {
      input.value = text;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, String(value));
  }

  async function snapshot()
  {
    return page.evaluate(() => window.systemParametersDemo.snapshot());
  }

  async function capture(name, width = 1440, fullPage = true)
  {
    await page.setViewport({ width, height: 1000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const path = `${folder}/${name}-${width}.png`;
    await page.screenshot({ path, fullPage });
    captures.push(path);
  }

  async function edit(code)
  {
    const current = await snapshot();
    await click('[data-settings-action="list"]');
    await fill("#settings-search", code);
    await click('#settings-search-form button[type="submit"]');
    await click(`[data-settings-action="edit"][data-code="${code}"]`);
    assert.equal((await snapshot()).state.code, code);
    return current;
  }

  async function stage(code, key, value)
  {
    await edit(code);
    await fill(`#settings-${code}-${key}`, value);
    await click("#settings-stage");
  }

  async function confirm(sensitive = false)
  {
    await fill("#settings-review-reason", "Penyesuaian operasional untuk skenario uji lokal.");
    await fill("#settings-review-reference", "CR-DEMO-001 / hasil uji contoh");
    const checkbox = await page.$('[name="reviewed"]');

    if (checkbox)
    {
      await checkbox.click();
    }

    if (sensitive)
    {
      await fill("#settings-review-verification", "123456");
    }
  }

  try
  {
    await page.setViewport({ width: 1440, height: 1000 });
    await go();
    assert.equal(await page.evaluate(() => systemParameterData.parameters.length), 46);
    assert.equal(await page.$$eval(".settings-summary strong", (nodes) => nodes[0].textContent), "46");
    assert.equal(await page.$$eval(".settings-table tbody tr", (rows) => rows.length), 6);
    assert.equal(await page.evaluate(() => systemParameterData.parameters.filter((item) => item.readonly).length), 2);
    await capture("list");
    await capture("list", 768);
    await capture("list", 390);
    checks.push("46 baseline parameters, derived summary counts, six-row pagination and read-only scope");

    await page.setViewport({ width: 1440, height: 1000 });
    await click('[data-settings-action="page"][data-page="2"]');
    assert.ok(await page.$('[data-parameter-code="P-07"]'));
    await fill("#settings-search", "P-18");
    await click('#settings-search-form button[type="submit"]');
    assert.equal((await snapshot()).state.search, "P-18");
    assert.equal(await page.$$eval(".settings-table tbody tr", (rows) => rows.length), 1);
    await click('[data-settings-action="edit"][data-code="P-18"]');
    await capture("sensitive-editor");
    await capture("sensitive-editor", 390);
    await click('[data-settings-action="list"]');
    assert.equal(await page.$eval("#settings-search", (input) => input.value), "P-18");
    await click('[data-settings-action="reset"]');
    checks.push("Search, pagination, URL state and return to filtered list preserve context");

    await page.setViewport({ width: 1440, height: 1000 });
    await stage("P-22", "units", 7);
    assert.equal((await snapshot()).values["P-22"].units, 5);
    assert.equal((await snapshot()).drafts["P-22"].values.units, 7);
    await click('[data-settings-action="review"]');
    await click("#settings-save");
    assert.ok(await page.$eval("#settings-review-errors", (element) => element.textContent.includes("Alasan")));
    await confirm();
    await capture("review");
    await capture("review", 390);
    await page.setViewport({ width: 1440, height: 1000 });
    await page.$eval("#settings-fail-save", (input) => input.checked = true);
    await click("#settings-save");
    await page.waitForFunction(() => document.getElementById("settings-feedback").textContent.includes("Penyimpanan gagal"));
    assert.equal((await snapshot()).values["P-22"].units, 5);
    assert.equal((await snapshot()).entries.length, 0);
    assert.ok((await snapshot()).drafts["P-22"]);
    await capture("save-error");
    await click("#settings-save");
    await page.waitForFunction(() => window.systemParametersDemo.snapshot().entries.length === 1);
    assert.equal((await snapshot()).values["P-22"].units, 7);
    await click(".settings-history-entry summary");
    await capture("history");
    await capture("history", 390);
    checks.push("Draft never mutates active values; reason required; failed save is atomic and retry adds immutable local history");

    await page.setViewport({ width: 1440, height: 1000 });
    await stage("P-18", "rupiah", 750000);
    await click('[data-settings-action="review"]');
    await confirm(true);
    await fill("#settings-review-verification", "111111");
    await click("#settings-save");
    assert.equal((await snapshot()).values["P-18"].rupiah, 500000);
    await fill("#settings-review-verification", "123456");
    await click("#settings-save");
    await page.waitForFunction(() => window.systemParametersDemo.snapshot().entries.length === 2);
    assert.equal((await snapshot()).values["P-18"].rupiah, 750000);
    checks.push("Sensitive change requires review acknowledgement and the explicit demo verification code");

    await stage("P-09", "open", "09:00");
    await click('[data-settings-action="review"]');
    assert.equal(await page.$eval("#settings-save", (input) => input.disabled), true);
    assert.ok(await page.$eval("#settings-review-errors", (element) => element.textContent.includes("P-09")));
    await capture("cross-validation");
    await stage("P-08", "morningStart", "09:00");
    await click('[data-settings-action="review"]');
    assert.equal(await page.$eval("#settings-save", (input) => input.disabled), false);
    await confirm();
    await click("#settings-save");
    await page.waitForFunction(() => window.systemParametersDemo.snapshot().entries.length === 3);
    const batch = await snapshot();
    assert.equal(batch.values["P-09"].open, "09:00");
    assert.equal(batch.values["P-08"].morningStart, "09:00");
    assert.equal(batch.entries[0].changes.length, 2);
    checks.push("Interdependent store hours and slots must agree and save together as one two-parameter batch");

    await stage("P-03", "attempts", 4);
    await page.$eval(".product-preview-controls", (element) => element.open = true);
    await click('[data-settings-action="conflict"]');
    await click('[data-settings-action="review"]');
    assert.equal(await page.$eval("#settings-save", (input) => input.disabled), true);
    await capture("conflict");
    await edit("P-03");
    assert.ok(await page.$eval(".settings-editor-layout", (element) => element.textContent.includes("Versi aktif berubah")));
    await click("#settings-stage");
    await click('[data-settings-action="review"]');
    assert.equal(await page.$eval("#settings-save", (input) => input.disabled), false);
    await confirm(true);
    await page.$eval("#settings-expired", (input) => input.checked = true);
    await click("#settings-save");
    await page.waitForFunction(() => document.getElementById("settings-feedback").textContent.includes("Sesi tidak berlaku"));
    assert.equal((await snapshot()).values["P-03"].attempts, 5);
    await page.$eval("#settings-expired", (input) => input.checked = false);
    await click('[data-settings-action="discard"]');
    await click("#settings-dialog-confirm");
    assert.equal(Object.keys((await snapshot()).drafts).length, 0);
    checks.push("Stale versions block saving, explicit re-review resolves conflict, expired session preserves draft, discard is confirmed");

    await edit("P-05");
    await fill("#settings-P-05-perProduct", 100);
    await click("#settings-stage");
    assert.ok(await page.$eval("#settings-editor-errors", (element) => element.textContent.includes("Batas per produk")));
    await fill("#settings-P-05-perProduct", "");
    await click("#settings-stage");
    assert.ok(await page.$eval("#settings-editor-errors", (element) => !element.hidden));
    await capture("invalid-editor", 390);
    await click('[data-settings-action="list"]');
    assert.ok(await page.$eval("#settings-dialog", (element) => element.open));
    await click('[data-settings-action="cancel-dialog"]');
    assert.ok(await page.$("#settings-editor-form"));
    await click('[data-settings-action="list"]');
    await click("#settings-dialog-confirm");
    checks.push("Invalid and blank numbers fail, local relationships validate, unsaved edit can cancel or confirm navigation");

    await go("?role=superadmin&view=editor&parameter=P-45");
    assert.equal(await page.$("#settings-editor-form"), null);
    await capture("readonly");
    await go("?role=admin&view=editor&parameter=P-18");
    assert.equal(await page.$("#settings-editor-form"), null);
    assert.equal(await page.$(".settings-table"), null);
    await capture("denied", 390);
    checks.push("Technical policies are read-only; Admin deep links reveal no editor or parameter table");

    for (const condition of ["loading", "error", "empty"])
    {
      await go();
      await page.select("#settings-load-state", condition);
      await capture(condition, 390);
      await click('[data-settings-action="reload"]');
      assert.ok(await page.$(".settings-table"));
    }

    await fill("#settings-search", "tidak-ada-parameter");
    await click('#settings-search-form button[type="submit"]');
    await capture("search-empty", 390);
    await click('[data-settings-action="reset"]');
    checks.push("Loading, error, empty and filtered empty states have a working recovery action");

    const sizes = [320, 390, 640, 768, 1024, 1280, 1440, 1920];

    for (const width of sizes)
    {
      await page.setViewport({ width, height: 1000 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false, `list overflow at ${width}`);
    }

    await page.setViewport({ width: 390, height: 1000 });
    await click("#mobile-open");
    assert.equal(await page.$eval("#mobile-open", (element) => element.getAttribute("aria-expanded")), "true");
    await page.keyboard.press("Escape");
    assert.equal(await page.$eval("#mobile-open", (element) => element.getAttribute("aria-expanded")), "false");
    const groupControl = "#settings-group-select-combobox";
    await page.click(groupControl);
    await page.type(groupControl, "Stok");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    assert.equal((await snapshot()).state.group, "stock");
    assert.equal(await page.$$eval(".settings-table tbody tr", (rows) => rows.length), 3);
    checks.push("320–1920px has no document overflow; mobile menu and reused group combobox work with keyboard");

    await page.setViewport({ width: 1440, height: 1000 });

    for (const pageName of
    [
      "admin-dashboard", "financial-report", "orders-queue", "products", "production-materials",
      "bouquet-production", "customers", "closure-calendar", "audit-log"
    ])
    {
      await page.goto(`${base}${pageName}.html?role=superadmin`, { waitUntil: "networkidle0" });
      const link = await page.$eval('a[title="Pengaturan Sistem"]', (element) =>
      ({ href: element.href, visible: Boolean(element.getClientRects().length) }));
      assert.ok(link.href.includes("system-parameters.html?role=superadmin"), pageName);
      assert.ok(link.visible, pageName);
    }

    checks.push("All nine incumbent admin surfaces link to the new settings screen for SuperAdmin");
    assert.deepEqual(errors, []);
    fs.writeFileSync(`${folder}/verification.json`, JSON.stringify({ checks, errors, captures }, null, 2));
    console.log(JSON.stringify({ checks: checks.length, errors, captures: captures.length }));
  }
  finally
  {
    await browser.close();
  }
}

verify().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
