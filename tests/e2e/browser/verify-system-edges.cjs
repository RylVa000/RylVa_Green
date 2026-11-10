"use strict";

const fs = require("node:fs");
const assert = require("node:assert/strict");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

async function verifyEdges()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const page = await browser.newPage();
  const base = "file:///C:/laragon/www/rylva-green/public/pages/superadmin/system-parameters.html";
  const errors = [];
  const checks = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());

  async function go(query = "")
  {
    await page.goto(base + query, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
  }

  try
  {
    await page.setViewport({ width: 1440, height: 1000 });

    for (let index = 1; index <= 46; index++)
    {
      const code = `P-${String(index).padStart(2, "0")}`;
      await go(`?role=superadmin&view=editor&parameter=${code}`);
      const fields = await page.evaluate(() => systemParameterData.parameters.find((item) => item.code === systemParametersDemo.snapshot().state.code).fields.length);
      assert.ok(fields > 0);
      assert.equal(await page.$$eval("#settings-editor-form input", (inputs) => inputs.length), index < 45 ? fields : 0, code);
      const unlabeled = await page.$$eval("#settings-editor-form input", (inputs) => inputs.filter((input) => !input.labels.length).length);
      assert.equal(unlabeled, 0, code);
    }

    checks.push("All 46 deep links render complete labelled field schemas; P-45 and P-46 have no editable controls");

    for (const code of ["P-08", "P-32", "P-41", "P-42", "P-45"])
    {
      await go(`?view=editor&parameter=${code}`);

      for (const width of [320, 390, 640, 768, 1024, 1280, 1440, 1920])
      {
        await page.setViewport({ width, height: 1000 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${code} at ${width}`);
      }
    }

    checks.push("Long slot, session, rate-limit, upload and technical policies fit at 320–1920px");

    await go("?view=editor&parameter=P-28");
    await page.setViewport({ width: 390, height: 1000 });
    await page.$eval("#settings-P-28-staffMin", (input) =>
    {
      input.value = "8";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.click("#settings-stage");
    assert.ok(await page.$eval("#settings-editor-errors", (element) => element.textContent.includes("minimal 12")));
    assert.equal(Object.keys((await page.evaluate(() => systemParametersDemo.snapshot())).drafts).length, 0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: ".impeccable/review/system-parameters/password-floor-390.png", fullPage: true });
    checks.push("Password security floor cannot be lowered through the editor");

    await go("?view=editor&parameter=P-39");
    await page.$eval("#settings-P-39-seconds", (input) =>
    {
      input.value = "2.55";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.click("#settings-stage");
    assert.ok(await page.$eval("#settings-editor-errors", (element) => element.textContent.includes("kelipatan")));
    checks.push("Decimal settings validate step precision rather than silently rounding");

    await go("?view=editor&parameter=P-22");
    await page.$eval("#settings-P-22-units", (input) =>
    {
      input.value = "0";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.click("#settings-stage");
    assert.equal((await page.evaluate(() => systemParametersDemo.snapshot())).drafts["P-22"].values.units, 0);
    await page.click('[data-settings-action="review"]');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: ".impeccable/review/system-parameters/zero-review-390.png", fullPage: true });
    checks.push("A valid zero stock threshold remains zero in draft and comparison");

    await go();
    await page.setViewport({ width: 390, height: 1000 });
    const filters = await page.$$eval(".settings-summary button", (buttons) => buttons.map((button) =>
    {
      const rect = button.getBoundingClientRect();
      return { left: rect.left, right: rect.right, height: rect.height };
    }));
    assert.equal(filters.length, 4);
    assert.ok(filters.every((rect) => rect.left >= 0 && rect.right <= 390 && rect.height >= 44));
    await page.click("#mobile-open");
    await new Promise((resolve) => setTimeout(resolve, 350));
    const menuBounds = await page.$eval("#sidebar", (element) =>
    {
      const bounds = element.getBoundingClientRect();
      return { left: bounds.left, width: bounds.width };
    });
    assert.equal(menuBounds.left, 0);
    assert.equal(menuBounds.width, 280);
    await page.screenshot({ path: ".impeccable/review/system-parameters/mobile-menu-390.png", fullPage: false });
    await page.keyboard.press("Escape");
    await page.click("#settings-group-select-combobox");
    await page.keyboard.type("keamanan");
    await page.screenshot({ path: ".impeccable/review/system-parameters/group-combobox-390.png", fullPage: false });
    await page.keyboard.press("Escape");
    checks.push("All four scan filters are visible in the mobile two-column grid; mobile navigation and searchable group states captured");

    await go("?role=admin");
    assert.equal(await page.$eval('a[title="Pengaturan Sistem"]', (link) => Boolean(link.getClientRects().length)), false);
    await page.select("#settings-profile", "superadmin");
    assert.ok(await page.$(".settings-table"));
    await page.select("#settings-profile", "admin");
    assert.equal(await page.$(".settings-table"), null);
    checks.push("Changing preview role immediately replaces the settings surface with access denied");

    await go("?view=editor&parameter=missing");
    assert.ok(await page.$eval("#settings-view", (element) => element.textContent.includes("Parameter tidak tersedia")));
    await page.click('[data-settings-action="list"]');
    assert.ok(await page.$(".settings-table"));
    checks.push("Unknown parameter deep link has a working recovery path");

    assert.deepEqual(errors, []);
    fs.writeFileSync(".impeccable/review/system-parameters/edge-verification.json", JSON.stringify({ checks, errors }, null, 2));
    console.log(JSON.stringify({ checks: checks.length, errors }));
  }
  finally
  {
    await browser.close();
  }
}

verifyEdges().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
