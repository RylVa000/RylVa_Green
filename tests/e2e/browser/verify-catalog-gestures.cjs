"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const baseUrl = process.env.RYLVA_CATALOG_URL || "http://127.0.0.1:4185";
const outputDirectory = path.resolve("storage/reports/catalog-gestures");

async function verifySheetGestures()
{
  fs.mkdirSync(outputDirectory, { recursive: true });
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true
  });
  const page = await browser.newPage();
  const client = await page.createCDPSession();
  const checks = [];
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const delay = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

  async function settleSheet()
  {
    await page.$eval("#catalog-sheet", async (sheet) =>
    {
      await Promise.all(sheet.getAnimations().map((animation) => animation.finished.catch(() => {})));
    });
  }

  async function open(view = "filter")
  {
    await page.click(`[data-catalog-sheet="${view}"]`);
    await page.waitForSelector("#catalog-sheet[open]");
    await settleSheet();
  }

  async function point(selector)
  {
    return page.$eval(selector, (element) =>
    {
      const rect = element.getBoundingClientRect();
      return { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) };
    });
  }

  async function startTouch(position)
  {
    await client.send("Input.dispatchTouchEvent",
    {
      type: "touchStart",
      touchPoints: [{ x: position.x, y: position.y, id: 1 }]
    });
  }

  async function moveTouch(start, deltaX, deltaY, steps = 8)
  {
    for (let step = 1; step <= steps; step++)
    {
      await client.send("Input.dispatchTouchEvent",
      {
        type: "touchMove",
        touchPoints: [{ x: start.x + deltaX * step / steps, y: start.y + deltaY * step / steps, id: 1 }]
      });
      await delay(25);
    }
  }

  async function endTouch(cancelled = false)
  {
    await client.send("Input.dispatchTouchEvent",
    {
      type: cancelled ? "touchCancel" : "touchEnd",
      touchPoints: []
    });
  }

  async function closed()
  {
    await page.waitForFunction(() => !document.getElementById("catalog-sheet").open);
    assert.equal(await page.evaluate(() => document.body.classList.contains("catalog-sheet-open")), false);
    assert.equal(await page.$$eval("#catalog-filters", (forms) => forms.length), 1);
  }

  try
  {
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(baseUrl + "/pages/public/catalog.html?preview=catalog&state=normal", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.getElementById("catalog-products").getAttribute("aria-busy") === "false");
    await page.evaluate(async () =>
    {
      document.querySelectorAll("img").forEach((image) => image.loading = "eager");
      await document.fonts.ready;
    });
    await open();
    await page.tap('#catalog-sheet [name="category"][value="plants"]');
    const header = await point("#catalog-sheet-title");
    await startTouch(header);
    await moveTouch(header, 0, 72, 5);
    assert.ok(await page.$eval("#catalog-sheet", (sheet) => new DOMMatrixReadOnly(getComputedStyle(sheet).transform).m42) > 40);
    await page.screenshot({ path: path.join(outputDirectory, "filter-mid-drag.png") });
    await moveTouch({ x: header.x, y: header.y + 72 }, 0, 100, 5);
    await endTouch();
    await closed();
    assert.match(page.url(), /category=plants/);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.catalogSheet), "filter");
    checks.push("Trusted touch drag follows the finger and dismisses Filter; category, form, history and opener focus are preserved");

    await open();
    const shortStart = await point("#catalog-sheet-title");
    await startTouch(shortStart);
    await moveTouch(shortStart, 0, 24);
    await delay(160);
    await endTouch();
    await settleSheet();
    assert.equal(await page.$eval("#catalog-sheet", (sheet) => sheet.open), true);
    assert.equal(await page.$eval("#catalog-sheet", (sheet) => getComputedStyle(sheet).transform), "none");
    checks.push("A short pull springs back without closing or discarding selected filters");

    const cancelledStart = await point("#catalog-sheet-title");
    await startTouch(cancelledStart);
    await moveTouch(cancelledStart, 0, 60);
    await endTouch(true);
    await settleSheet();
    assert.equal(await page.$eval("#catalog-sheet", (sheet) => sheet.open), true);
    assert.equal(await page.$eval("#catalog-sheet", (sheet) => getComputedStyle(sheet).transform), "none");
    checks.push("Interrupted touch gesture restores the open sheet without leaving a transform behind");

    const scrollPoint = await page.$eval("#catalog-sheet-scroll", (element) =>
    {
      const rect = element.getBoundingClientRect();
      return { x: Math.round(rect.left + rect.width * 0.65), y: Math.round(rect.bottom - 65) };
    });
    await startTouch(scrollPoint);
    await moveTouch(scrollPoint, 0, -240);
    await delay(160);
    await endTouch();
    await page.waitForFunction(() => document.getElementById("catalog-sheet-scroll").scrollTop > 80);
    const beforeScroll = await page.$eval("#catalog-sheet-scroll", (element) => element.scrollTop);
    const scrollDownStart = { x: scrollPoint.x, y: scrollPoint.y - 220 };
    await startTouch(scrollDownStart);
    await moveTouch(scrollDownStart, 0, 100);
    await delay(160);
    await endTouch();
    await page.waitForFunction((before) => document.getElementById("catalog-sheet-scroll").scrollTop < before, {}, beforeScroll);
    assert.equal(await page.$eval("#catalog-sheet", (sheet) => sheet.open), true);
    checks.push("Native touch scrolling still moves the filter list; downward scrolling while away from its top does not dismiss the sheet");

    await page.$eval("#catalog-sheet-scroll", (element) => element.scrollTop = 0);
    const contentStart = await point('#catalog-group-category .catalog-choice span');
    await startTouch(contentStart);
    await moveTouch(contentStart, 0, 165);
    await endTouch();
    await closed();
    assert.match(page.url(), /category=plants/);
    checks.push("Pulling down inside the filter content when already at the top dismisses it without toggling a checkbox");

    await open();
    const navigationStart = await point('[data-filter-section="category"]');
    await startTouch(navigationStart);
    await moveTouch(navigationStart, 0, 155);
    await endTouch();
    await closed();
    checks.push("Pulling down over the Category navigation also dismisses the filter panel");

    await open("sort");
    const sortStart = await point("#catalog-sheet-title");
    await startTouch(sortStart);
    await moveTouch(sortStart, 0, 110);
    await endTouch();
    await closed();
    assert.equal(await page.evaluate(() => document.activeElement.dataset.catalogSheet), "sort");
    checks.push("Sort sheet supports the same downward touch gesture and returns focus to its own trigger");

    await open();
    const mouseStart = await point("#catalog-sheet-title");
    await page.mouse.move(mouseStart.x, mouseStart.y);
    await page.mouse.down();
    await page.mouse.move(mouseStart.x, mouseStart.y + 160, { steps: 12 });
    await page.mouse.up();
    await closed();
    checks.push("Mouse dragging the header works in a phone-sized desktop preview");

    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.setViewport({ width: 320, height: 740, isMobile: true, hasTouch: true });
    await open();
    const reducedStart = await point("#catalog-sheet-title");
    await startTouch(reducedStart);
    await moveTouch(reducedStart, 0, 155);
    await endTouch();
    await closed();
    await open();
    await page.screenshot({ path: path.join(outputDirectory, "filter-reopened-320.png") });
    await page.click('[data-catalog-sheet-close]');
    await closed();
    checks.push("Gesture dismissal and reopening work at 320px with reduced motion; the X alternative stays functional");

    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(outputDirectory, "verification.json"), JSON.stringify({ checks, errors, input: "CDP touch and mouse in Chrome mobile emulation; not a physical iOS device" }, null, 2));
    console.log(JSON.stringify({ passed: checks.length, checks, errors }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifySheetGestures().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
