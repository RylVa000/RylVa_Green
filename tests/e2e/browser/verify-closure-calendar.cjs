const assert = require("node:assert/strict");
const fs = require("node:fs");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

async function verifyClosureCalendar()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const page = await browser.newPage();
  const base = "file:///C:/laragon/www/rylva-green/public/pages/staff/closure-calendar.html";
  const folder = ".impeccable/review/closure-calendar";
  const checks = [];
  const errors = [];
  const captures = [];
  fs.mkdirSync(folder, { recursive: true });
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
  async function waitForSave()
  {
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  async function go(query = "")
  {
    await page.goto(base + query, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
  }
  try
  {
    await page.setViewport({ width: 1440, height: 1000 });
    await go();
    assert.equal(await page.$$eval(".closure-summary strong", (nodes) => nodes.map((node) => node.textContent).join(",")), "2,6,2");
    const sameHeight = await page.$eval('[data-date="2026-11-04"]', (node) =>
    {
      const buttons = [...node.closest("tr").querySelectorAll("button")];
      return Math.max(...buttons.map((button) => button.offsetHeight))
        - Math.min(...buttons.map((button) => button.offsetHeight)) <= 1;
    });
    assert.ok(sameHeight, "Calendar cells in a week share the same height");
    assert.equal(await page.$$eval(".closure-order", (nodes) => nodes.length), 4);
    await page.click('[data-closure-action="affected"]');
    assert.equal(await page.$$eval(".closure-order", (nodes) => nodes.length), 2);
    assert.match(await page.$eval("#closure-date-detail", (node) => node.textContent), /Tidak ada jadwal yang dipindahkan otomatis/);
    assert.match(await page.$eval(".closure-order a", (node) => node.href), /order=RV-261103-J5N7P3/);
    assert.match(await page.$eval(".closure-order:last-of-type", (node) => node.textContent), /Menunggu \/ COD/);
    checks.push("Counts match fixtures, conflict warning points to affected orders and separates COD status");

    await page.click('[data-closure-action="date"][data-date="2026-11-03"]');
    await page.click('[data-closure-action="add"]');
    assert.match(await page.$eval("#closure-dialog-body", (node) => node.textContent), /belum terhubung ke checkout/);
    await page.type("#closure-form-reason", "Toko tutup mendadak");
    await page.click("#closure-submit");
    assert.match(await page.$eval("#closure-form-error", (node) => node.textContent), /Konfirmasi/);
    await page.click("#closure-form-ack");
    await page.evaluate(() => document.getElementById("closure-fail-save").checked = true);
    await page.click("#closure-submit");
    await waitForSave();
    assert.equal(await page.$eval("#closure-form-reason", (node) => node.value), "Toko tutup mendadak");
    assert.match(await page.$eval("#closure-form-error", (node) => node.textContent), /Gagal menyimpan/);
    await page.click("#closure-submit");
    await waitForSave();
    assert.equal(await page.evaluate(() => closureDates.filter((entry) => entry.date === "2026-11-03").length), 1);
    assert.equal(await page.evaluate(() => closureOrders.filter((entry) => entry.date === "2026-11-03").length), 4);
    checks.push("Closure with existing orders requires acknowledgement; failed save preserves inputs and retry saves once without rescheduling");

    await page.click('[data-closure-action="edit"]');
    await page.$eval("#closure-form-reason", (node) => node.value = "Perbaikan listrik");
    await page.click("#closure-form-ack");
    await page.click("#closure-submit");
    await waitForSave();
    assert.equal(await page.evaluate(() => closureDates.find((entry) => entry.date === "2026-11-03").reason), "Perbaikan listrik");
    assert.equal(await page.evaluate(() => closureHistory.at(-1).previousReason), "Toko tutup mendadak");
    await page.click('[data-closure-action="reopen"]');
    await page.type("#closure-form-reason", "Pekerjaan sudah selesai");
    await page.click("#closure-submit");
    await waitForSave();
    assert.equal(await page.evaluate(() => Boolean(closureDates.find((entry) => entry.date === "2026-11-03"))), false);
    assert.equal(await page.evaluate(() => closureOrders.filter((entry) => entry.date === "2026-11-03").length), 4);
    checks.push("Edit retains old reason in history and reopen keeps orders unchanged");

    await page.click("#closure-add");
    await page.$eval("#closure-form-date", (input) =>
    {
      input.value = "2026-11-04";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.type("#closure-form-reason", "Hari tutup contoh");
    await page.click("#closure-submit");
    assert.match(await page.$eval("#closure-form-error", (node) => node.textContent), /sudah ditandai/);
    await page.click("#closure-cancel");
    await page.click('[data-date="2026-11-03"]');
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.evaluate(() => document.activeElement.dataset.date), "2026-11-04");
    await page.click('[data-closure-action="next"]');
    assert.match(await page.$eval(".closure-month-title", (node) => node.textContent), /Desember 2026/);
    checks.push("Duplicate date validation, keyboard day navigation, and month navigation");

    await page.select("#closure-profile", "superadmin");
    assert.match(await page.$eval('[title="Pelanggan"]', (node) => node.href), /role=superadmin/);
    await page.click('[data-closure-action="view"][data-view="history"]');
    assert.ok(await page.$(".closure-history"));
    await page.select("#closure-load-state", "error");
    assert.match(await page.$eval("#closure-view", (node) => node.textContent), /gagal dimuat/);
    await page.click('[data-closure-action="retry"]');
    await page.select("#closure-load-state", "empty");
    assert.equal(await page.$eval(".closure-summary strong", (node) => node.textContent), "0");
    checks.push("Role-preserving links and recoverable error and empty states");

    for (const width of [320, 390, 640, 768, 1024, 1280, 1440, 1920])
    {
      await page.setViewport({ width, height: 1000 });
      await go();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Page overflow ${width}`);
      const markersFit = await page.$eval('[data-date="2026-11-04"]', (button) =>
      {
        const bounds = button.getBoundingClientRect();
        return [...button.querySelectorAll("svg")].every((icon) =>
        {
          const iconBounds = icon.getBoundingClientRect();
          return iconBounds.left >= bounds.left && iconBounds.right <= bounds.right;
        });
      });
      assert.ok(markersFit, `Conflict icons remain within their cell at ${width}`);
      const scrollHintMatches = await page.evaluate(() =>
      {
        const region = document.querySelector(".closure-calendar-scroll");
        const hint = document.querySelector(".closure-scroll-hint");
        return hint.hidden === (region.scrollWidth <= region.clientWidth + 1);
      });
      assert.ok(scrollHintMatches, `Calendar scroll hint matches actual overflow at ${width}`);
    }
    checks.push("Viewport fits, markers remain inside cells, and scroll hint matches overflow at 320–1920 pixels");
    for (const width of [390, 768, 1440])
    {
      await page.setViewport({ width, height: 1000 });
      for (const [name, query] of
      [
        ["calendar", ""],
        ["conflict", "?date=2026-11-04"],
        ["closed", "?view=closed"],
        ["history", "?role=superadmin&view=history"],
        ["dialog", "?date=2026-11-03"]
      ])
      {
        await go(query);
        if (name === "dialog")
        {
          await page.click("#closure-add");
        }
        else
        {
          await page.evaluate(() =>
          {
            document.activeElement?.blur();
            scrollTo(0, 0);
          });
        }
        const file = `${folder}/${name}-${width}.png`;
        await page.screenshot({ path: file, fullPage: name !== "dialog" });
        captures.push(file);
      }
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(`${folder}/verification.json`, JSON.stringify({ checks, errors, captures }, null, 2));
    console.log(JSON.stringify({ checks, errors, captures }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyClosureCalendar().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
