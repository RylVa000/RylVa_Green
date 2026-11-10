const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

const artifactDirectory = path.resolve(".impeccable/review/order-signals");
const pageUrl = pathToFileURL(path.resolve("public/pages/staff/orders-queue.html")).href;

async function verifyOrderSignals()
{
  fs.mkdirSync(artifactDirectory, { recursive: true });
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const browserErrors = [];
  const checks = [];

  try
  {
    const page = await browser.newPage();
    page.on("pageerror", (error) => browserErrors.push(error.message));

    async function open(orderId, detailTab = "fulfillment")
    {
      await page.goto(`${pageUrl}?order=${orderId}&detailTab=${detailTab}`,
      {
        waitUntil: "networkidle0"
      });
      await page.evaluate(() => document.fonts.ready);
    }

    async function capture(name)
    {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot(
      {
        path: path.join(artifactDirectory, `${name}.png`),
        fullPage: true
      });
    }

    async function verifyBounds()
    {
      const problems = await page.evaluate(() =>
      {
        const nodes = document.querySelectorAll(
          "#detail-view .work-signal, .work-progress li, .work-handoff-checklist li"
        );
        const overflowing = [...nodes].filter((node) =>
        {
          const bounds = node.getBoundingClientRect();
          return bounds.width > 0 && (bounds.left < 0 || bounds.right > innerWidth + 1);
        });
        return {
          pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
          overflowing: overflowing.map((node) => node.textContent)
        };
      });
      assert.equal(problems.pageOverflow, false);
      assert.deepEqual(problems.overflowing, []);
    }

    await page.setViewport({ width: 1440, height: 1000 });
    await open("RV-261103-C3F8R6");
    assert.equal(
      await page.$eval('.work-progress [aria-current="step"] strong', (node) => node.textContent),
      "Siap diproses"
    );
    await capture("ready-desktop");
    await page.click("#prepare-button");
    await page.click("#confirm-prepare");
    await page.waitForFunction(() =>
    {
      return document.getElementById("detail-order-status").textContent === "Sedang Disiapkan";
    });
    assert.equal(
      await page.$eval('.work-progress [aria-current="step"] strong', (node) => node.textContent),
      "Disiapkan"
    );
    assert.equal(await page.$$eval(".work-progress .is-complete", (nodes) => nodes.length), 1);
    assert.match(await page.$eval("#detail-payment-status", (node) => node.textContent), /Menunggu \(COD\)/);
    assert.equal(
      await page.$eval("#detail-payment-status", (node) => node.classList.contains("work-signal--success")),
      false
    );
    assert.match(
      await page.$eval(".work-handoff-checklist", (node) => node.textContent),
      /3 syarat serah belum lengkap/
    );
    await verifyBounds();
    await capture("preparing-desktop");
    checks.push("Current and completed fulfillment stages are explicit; COD waiting remains separate from preparation");

    for (const width of [320, 390, 768, 1024, 1920])
    {
      await page.setViewport({ width, height: 1000 });
      await verifyBounds();

      if ([320, 390, 768].includes(width))
      {
        await capture(`preparing-${width}`);
      }
    }

    checks.push("Status badges, fulfillment stages and required handoff checklist fit 320–1920px");
    await page.setViewport({ width: 1440, height: 1000 });
    await open("RV-261103-R7C5G9");
    assert.equal(
      await page.$eval("#detail-order-status", (node) => node.classList.contains("work-signal--warning")),
      true
    );
    assert.equal(
      await page.$$eval('.work-progress .is-paused[aria-current="step"]', (nodes) => nodes.length),
      1
    );
    await capture("case-paused-desktop");
    checks.push("An order on hold has an explicit paused stage and warning status");

    await open("", "overview");
    await page.click('[data-workspace="aftercare"]');
    assert.ok(
      await page.$$eval(".work-request--urgent .work-signal--critical", (nodes) => nodes.length) > 0
    );
    await capture("aftercare-desktop");
    checks.push("Failed refunds have a distinct critical icon and label in the aftercare list");

    assert.deepEqual(browserErrors, []);
    const result = { passed: true, checks, browserErrors };
    fs.writeFileSync(path.join(artifactDirectory, "verification.json"), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyOrderSignals().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
