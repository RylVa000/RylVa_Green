const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

const pageUrl = pathToFileURL(path.resolve("public/pages/staff/orders-queue.html")).href;
const outputDirectory = path.resolve(".impeccable/review/orders");
const browserErrors = [];
const spacingChecks = [];

async function verifyOrders()
{
  fs.mkdirSync(outputDirectory, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });

  try
  {
    const page = await browser.newPage();
    page.on("pageerror", (error) => browserErrors.push(error.message));

    async function openPreview(query = "")
    {
      await page.goto(pageUrl + query, { waitUntil: "networkidle0" });
      await page.evaluate(() => document.fonts.ready);
    }

    async function capture(name)
    {
      await page.screenshot({
        path: path.join(outputDirectory, name + ".png"),
        fullPage: true
      });
    }

    async function verifyRowSpacing(width, collapsed)
    {
      const measurement = await page.evaluate(() =>
      {
        const table = document.getElementById("orders-table");
        const row = document.querySelector("#order-rows tr");
        const cells = Array.from(row.cells);
        const orderBadge = cells[3].firstElementChild.getBoundingClientRect();
        const paymentBadge = cells[4].firstElementChild.getBoundingClientRect();
        const button = cells[7].firstElementChild.getBoundingClientRect();
        const rowBounds = row.getBoundingClientRect();
        const buttonStyle = getComputedStyle(cells[7].firstElementChild);
        const gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--queue-sheet-gutter"));
        const numberRange = document.createRange();
        numberRange.selectNodeContents(cells[0].querySelector(".order-number"));
        const numberBounds = numberRange.getBoundingClientRect();
        const isTable = getComputedStyle(table).display === "table";
        const identityLimit = isTable
          ? cells[1].getBoundingClientRect().left
          : button.left;

        return {
          isTable,
          buttonWidth: button.width,
          buttonHeight: button.height,
          buttonInset: rowBounds.right - button.right,
          buttonPadding: parseFloat(buttonStyle.paddingRight),
          badgeGap: paymentBadge.left - orderBadge.right,
          badgeContained: orderBadge.right <= cells[3].getBoundingClientRect().right - 11,
          identityGap: identityLimit - numberBounds.right,
          gutter
        };
      });

      const context = `${width}px, ${collapsed ? "collapsed" : "expanded"}`;
      assert.ok(measurement.buttonWidth >= 80, `Button width at ${context}`);
      assert.ok(measurement.buttonHeight >= 44, `Button height at ${context}`);
      assert.ok(measurement.buttonPadding >= 12, `Button padding at ${context}`);
      assert.ok(measurement.buttonInset >= measurement.gutter - 1, `Button edge at ${context}`);
      assert.ok(measurement.identityGap >= 8, `Order number spacing at ${context}`);

      if (measurement.isTable)
      {
        assert.ok(measurement.badgeGap >= 24, `Status spacing at ${context}`);
        assert.ok(measurement.badgeContained, `Status overflow at ${context}`);
      }

      spacingChecks.push({ width, collapsed, ...measurement });
    }

    await page.setViewport({ width: 1440, height: 900 });
    await openPreview();
    assert.equal(await page.$$eval("#order-rows tr", (rows) => rows.length), 5);
    assert.equal(await page.$eval('[data-count="all"]', (node) => node.textContent), "17");
    assert.match(await page.$eval("#case-hook-title", (node) => node.textContent), /20 menit/);
    assert.equal(await page.$$eval("[data-superadmin-only]", (nodes) => nodes.every((node) => node.hidden)), true);
    await capture("desktop");

    await page.click("#delivery-hook");
    assert.equal(await page.$$eval("#order-rows tr", (rows) => rows.length), 2);
    assert.match(page.url(), /slot=morning/);
    await capture("delivery-priority");

    await page.click('[data-tab="attention"]');
    assert.equal(await page.$eval("#list-empty", (node) => node.hidden), false);
    await page.click("#empty-reset");
    assert.equal(await page.$$eval("#order-rows tr", (rows) => rows.length), 5);
    await page.click("#overdue-hook");
    assert.match(await page.$eval("#detail-case", (node) => node.textContent), /PH-06/);
    assert.equal(await page.$eval("#prepare-button", (node) => node.hidden), true);
    await capture("case-detail");

    await openPreview();
    await page.click('[data-open-order="RV-261103-C3F8R6"]');
    assert.match(await page.$eval("#detail-payment-status", (node) => node.textContent), /Menunggu \(COD\)/);
    await page.click("#prepare-button");
    assert.equal(await page.$eval("#prepare-dialog", (node) => node.open), true);
    await capture("confirmation");
    await page.keyboard.press("Escape");
    assert.match(await page.$eval("#detail-order-status", (node) => node.textContent), /Siap Diproses/);
    await page.click("#prepare-button");
    await page.click("#confirm-prepare");
    await page.waitForFunction(() => document.getElementById("detail-order-status").textContent === "Sedang Disiapkan");
    assert.match(await page.$eval("#detail-payment-status", (node) => node.textContent), /Menunggu \(COD\)/);
    assert.equal(await page.$eval('[data-count="ready"]', (node) => node.textContent), "4");
    assert.equal(await page.$eval('[data-count="preparing"]', (node) => node.textContent), "4");
    assert.match(await page.$eval("#detail-history", (node) => node.textContent), /Simulasi mulai/);
    await capture("cod-detail");
    await page.click("#back-to-queue");
    assert.equal(await page.$eval("#detail-view", (node) => node.hidden), true);

    await page.click('[data-tab="all"]');
    await page.click("#next-page");
    assert.match(page.url(), /page=2/);
    await page.click("#filters-toggle");
    await page.select("#payment-filter", "cod");
    await page.click('#advanced-filters button[type="submit"]');
    assert.equal(await page.$$eval("#order-rows tr", (rows) => rows.length), 2);
    assert.match(page.url(), /payment=cod/);
    await page.type("#order-search", "tidakada");
    await page.waitForFunction(() => document.getElementById("list-empty").hidden === false);
    await capture("no-results");
    await page.click("#empty-reset");

    await openPreview("?state=error");
    await capture("error");
    await page.click("#retry-button");
    assert.equal(await page.$eval("#list-loading", (node) => node.hidden), false);
    await capture("loading");
    await page.waitForFunction(() => document.getElementById("list-loading").hidden === true);
    assert.equal(await page.$eval("#orders-table", (node) => node.hidden), false);
    await openPreview("?state=empty");
    assert.equal(await page.$eval('[data-count="all"]', (node) => node.textContent), "0");
    await capture("empty");
    await page.click("#empty-reset");

    await openPreview("?role=superadmin&tab=attention");
    assert.equal(await page.$$eval("[data-superadmin-only]", (nodes) => nodes.every((node) => !node.hidden)), true);
    await page.click('[data-open-order="RV-261103-T8D4H6"]');
    assert.match(await page.$eval("#detail-case-next", (node) => node.textContent), /SuperAdmin/);
    await capture("superadmin-case");

    for (const width of [320, 375, 390, 768, 1024, 1280, 1440, 1920])
    {
      await page.setViewport({ width, height: 900 });
      await openPreview();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Overflow at ${width}`);
    }

    for (const width of [320, 390, 768, 1024, 1280, 1440, 1920])
    {
      await page.setViewport({ width, height: 900 });
      await openPreview("?tab=preparing");
      await verifyRowSpacing(width, false);
      await capture(`spacing-${width}`);

      if (width >= 1024)
      {
        await page.click("#sidebar-toggle");
        await verifyRowSpacing(width, true);
      }
    }

    await page.setViewport({ width: 768, height: 1024 });
    await openPreview();
    await capture("tablet");
    await page.setViewport({ width: 390, height: 844 });
    await capture("mobile");
    assert.ok(await page.$eval("#order-rows tr", (node) => node.getBoundingClientRect().top < 844 * 0.8));
    await page.click("#mobile-open");
    assert.equal(await page.$eval("#sidebar", (node) => node.inert), false);
    await capture("mobile-menu");
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.activeElement.id), "mobile-open");
    await page.click('[data-open-order="RV-261103-C3F8R6"]');
    await capture("mobile-detail");

    await page.setJavaScriptEnabled(false);
    await openPreview();
    assert.match(await page.$eval("#order-rows", (node) => node.textContent), /Buket mawar pastel/);
    assert.deepEqual(browserErrors, []);

    const report =
    {
      passed: true,
      browserErrors,
      spacingChecks,
      checks:
      [
        "Computed counts and delivery priority",
        "URL filters, pagination and no-result recovery",
        "PH deadline detail and blocked preparation",
        "COD stays unpaid after simulated preparation",
        "Cancel and confirm dialog flows",
        "Loading, error and empty states",
        "Admin/SuperAdmin visibility",
        "No horizontal page overflow from 320 to 1920",
        "Preparing badges and action button retain their spacing with either sidebar size",
        "Mobile menu Escape and focus return",
        "Visible sample order without JavaScript"
      ]
    };
    fs.writeFileSync(path.join(outputDirectory, "verification.json"), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyOrders().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
