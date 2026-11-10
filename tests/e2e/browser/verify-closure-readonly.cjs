const assert = require("node:assert/strict");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

async function verifyClosureReadonly()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const page = await browser.newPage();
  const errors = [];
  await page.evaluateOnNewDocument(() =>
  {
    const NativeDate = Date;
    class FixtureDate extends NativeDate
    {
      constructor(...args)
      {
        if (args.length)
        {
          super(...args);
        }
        else
        {
          super("2026-11-03T11:25:00+07:00");
        }
      }

      static now()
      {
        return NativeDate.parse("2026-11-03T11:25:00+07:00");
      }
    }
    window.Date = FixtureDate;
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());
  try
  {
    for (const role of ["admin", "superadmin"])
    {
      await page.setViewport({ width: role === "admin" ? 390 : 1440, height: 900 });
      await page.goto(
        `file:///C:/laragon/www/rylva-green/public/pages/staff/closure-calendar.html?role=${role}&date=2026-10-31`,
        { waitUntil: "networkidle0" }
      );
      await page.evaluate(() =>
      {
        closureDates.push(
        {
          date: "2026-10-31",
          reason: "Penutupan sebelumnya",
          actor: "Admin RylVa",
          changedAt: "2026-10-30T09:00:00+07:00"
        });
        renderClosurePage();
      });
      const pastContent = await page.$eval("#closure-date-detail", (node) => node.textContent);
      assert.match(pastContent, /hanya lihat/i);
      assert.match(pastContent, /Penutupan sebelumnya/);
      assert.equal(await page.$('[data-closure-action="edit"]'), null);
      assert.equal(await page.$('[data-closure-action="reopen"]'), null);
      assert.equal(await page.$('[data-closure-action="add"]'), null);
      await page.evaluate(() => openClosureDialog("edit", "2026-10-31"));
      assert.equal(await page.$eval("#closure-dialog", (node) => node.open), false);
      await page.click("#closure-add");
      assert.equal(await page.$eval("#closure-form-date", (node) => node.value), "2026-11-03");
      assert.equal(await page.$eval("#closure-form-date", (node) => node.min), "2026-11-03");
      await page.$eval("#closure-form-date", (node) =>
      {
        node.value = "2026-10-30";
        node.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await page.type("#closure-form-reason", "Tanggal sebelum hari ini");
      await page.click("#closure-submit");
      assert.match(await page.$eval("#closure-form-error", (node) => node.textContent), /Tanggal lampau/);
      assert.equal(await page.evaluate(() => closureDates.some((entry) => entry.date === "2026-10-30")), false);
      await page.click("#closure-cancel");
      await page.goto(
        `file:///C:/laragon/www/rylva-green/public/pages/staff/closure-calendar.html?role=${role}&date=2026-11-03`,
        { waitUntil: "networkidle0" }
      );
      assert.ok(await page.$('[data-closure-action="add"]'));
      await page.click('[data-date="2026-11-04"]');
      assert.ok(await page.$('[data-closure-action="edit"]'));
      assert.ok(await page.$('[data-closure-action="reopen"]'));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    }
    const livePage = await browser.newPage();
    await livePage.goto("file:///C:/laragon/www/rylva-green/public/pages/staff/closure-calendar.html", { waitUntil: "networkidle0" });
    const today = await livePage.evaluate(() => closureTodayKey());
    const yesterday = await livePage.evaluate((value) =>
    {
      const date = new Date(`${value}T12:00:00Z`);
      date.setUTCDate(date.getUTCDate() - 1);
      return date.toISOString().slice(0, 10);
    }, today);
    await livePage.goto(
      `file:///C:/laragon/www/rylva-green/public/pages/staff/closure-calendar.html?date=${yesterday}`,
      { waitUntil: "networkidle0" }
    );
    assert.match(await livePage.$eval("#closure-date-detail", (node) => node.textContent), /hanya lihat/i);
    await livePage.click("#closure-add");
    assert.equal(await livePage.$eval("#closure-form-date", (node) => node.min), today);
    await livePage.close();
    assert.deepEqual(errors, []);
    console.log("PASS: Tanggal lampau hanya dibaca, diblokir pada form dan tindakan langsung, sedangkan hari ini dan tanggal mendatang tetap dapat dikelola untuk kedua peran.");
  }
  finally
  {
    await browser.close();
  }
}

verifyClosureReadonly().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
