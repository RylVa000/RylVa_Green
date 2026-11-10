"use strict";

const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

async function verify()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) =>
  {
    if (message.type() === "error" && !message.location().url.endsWith("/favicon.ico"))
    {
      errors.push(`${message.text()} ${message.location().url || ""}`);
    }
  });
  function assert(condition, message)
  {
    if (!condition)
    {
      throw new Error(message);
    }
  }
  try
  {
    for (const width of [390, 768, 1440])
    {
      await page.setViewport({ width, height: 900 });
      for (const tab of ["overview", "orders", "products", "stock", "shipping"])
      {
        await page.goto(`http://127.0.0.1:4178/operational-report.html?role=admin&tab=${tab}`, { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready);
        const info = await page.evaluate(() =>
        {
          return {
            heading: document.querySelector("h1")?.textContent,
            overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            active: document.querySelector(".report-tabs [aria-current=page]")?.textContent
          };
        });
        assert(info.heading === "Laporan Operasional" && info.active && !info.overflow, `Layout ${tab} ${width} gagal.`);
        await page.screenshot({ path: `storage/reports/hallmark/screenshots/report-${tab}-${width}.png`, fullPage: true });
      }
    }
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto("http://127.0.0.1:4178/operational-report.html?role=admin", { waitUntil: "load" });
    const layout = await page.evaluate(() =>
    {
      const cards = [...document.querySelectorAll(".report-grid .report-card")];
      return {
        buttons: [...document.querySelectorAll(".report-controls button, .report-tools button")]
          .map((element) => element.textContent),
        first: cards[0].getBoundingClientRect().height,
        second: cards[1].getBoundingClientRect().height
      };
    });
    assert(layout.buttons.every((label) => label.includes("Reset")), "Tombol penerapan filter masih terlihat.");
    assert(Math.abs(layout.first - layout.second) < 1, "Tinggi kartu tidak sejajar.");
    await page.goto("http://127.0.0.1:4178/operational-report.html?role=admin&tab=orders", { waitUntil: "load" });
    assert(await page.$eval('[title="Laporan Keuangan"]', (element) => element.hidden), "Keuangan terlihat oleh Admin.");
    await page.type("#report-search", "tidak-ada-xyz");
    assert((await page.$eval(".report-state", (element) => element.textContent)).includes("Tidak ada"), "Hasil kosong gagal.");
    await page.click('[data-report-action="reset"]');
    assert(await page.$(".report-table tbody tr") !== null, "Reset filter gagal.");
    await page.select("#report-period", "today");
    assert((await page.$eval(".report-pagination", (element) => element.textContent)).includes("2 dari 2"), "Periode gagal.");
    await page.select("#report-period", "custom");
    assert(await page.$eval("#report-start", (element) => !element.parentElement.hidden), "Tanggal khusus tidak muncul.");
    await page.$eval("#report-start", (element) =>
    {
      element.value = "2026-11-01";
      element.dispatchEvent(new Event("change", { bubbles: true }));
    });
    assert(await page.$eval("#report-period", (element) => element.value) === "custom", "Periode tidak ditandai khusus.");
    await page.$eval("#report-start", (element) =>
    {
      element.value = "2027-01-01";
      element.dispatchEvent(new Event("change", { bubbles: true }));
    });
    assert((await page.$eval("#report-period-error", (element) => element.textContent)).includes("sebelumnya"),
      "Tanggal tidak valid tidak memberi penjelasan.");
    await page.click('[data-report-action="reset-period"]');
    assert(await page.$eval("#report-period", (element) => element.value) === "7", "Reset periode gagal.");
    await page.click('[data-report-action="tab"][data-tab="stock"]');
    await page.select("#report-location", "Etalase Toko");
    assert(await page.$$eval(".report-table tbody tr", (rows) => rows.length) === 1, "Filter lokasi gagal.");
    await page.click('[data-report-action="tab"][data-tab="orders"]');
    await page.select("#report-profile", "superadmin");
    assert(!(await page.$eval('[title="Laporan Keuangan"]', (element) => element.hidden)), "Keuangan tersembunyi bagi SuperAdmin.");
    await page.select("#report-load", "error");
    assert((await page.$eval(".report-state", (element) => element.textContent)).includes("belum dapat dimuat"), "State error gagal.");
    await page.click('[data-report-action="reload"]');
    assert(await page.$(".report-table tbody tr") !== null, "Coba lagi gagal.");
    for (const role of ["admin", "superadmin"])
    {
      await page.goto(`http://127.0.0.1:4178/admin-dashboard.html?role=${role}`, { waitUntil: "load" });
      const href = await page.$eval("[data-report-link]", (element) => element.getAttribute("href"));
      assert(href.includes(`role=${role}`), `Navigasi laporan untuk ${role} tidak tepat.`);
    }
    assert(errors.length === 0, `Kesalahan browser: ${errors.join(" | ")}`);
    console.log("Laporan operasional: 15 tampilan, filter, periode, navigasi, peran, recovery lulus; 0 error browser.");
  }
  finally
  {
    await browser.close();
  }
}

verify().catch((error) =>
{
  console.error(error.message);
  process.exitCode = 1;
});
