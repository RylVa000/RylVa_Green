"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const runtime = require("../../../tools/testing/browser-runtime.cjs");
const baseUrl = process.env.RYLVA_BOUQUET_URL || "http://127.0.0.1:4185";
const outputDirectory = "storage/reports/bouquet-refinement";

async function verify()
{
  fs.mkdirSync(outputDirectory, { recursive: true });
  const browser = await runtime.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true
  });
  const page = await browser.newPage();
  const checks = [];
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", async (dialog) => dialog.accept());

  async function click(selector)
  {
    await page.$eval(selector, (element) => element.click());
  }

  async function open(width, height = 1000)
  {
    await page.setViewport({ width, height, isMobile: width < 701, hasTouch: width < 701 });
    await page.goto(baseUrl + "/pages/customer/bouquet-customizer.html?preview=bouquet&state=ready",
      { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.getElementById("bouquet-submit")?.disabled === false);
    await page.evaluate(() => document.fonts.ready);
  }

  async function sixChoices()
  {
    await click('[data-bq-group="flowers"]');
    await click('[data-bq-option="white-rose"]');
    await click('[data-bq-group="foliage"]');
    await click('[data-bq-option="baby-breath"]');
    await page.waitForFunction(() => document.getElementById("bouquet-submit").disabled === false);
    assert.equal(await page.$$("#bouquet-selected li").then((elements) => elements.length), 6);
  }

  try
  {
    await open(1440, 1100);
    const baseLayout = await page.evaluate(() =>
    {
      const data = window.RylvaBouquetPreviewData;
      const selections = { "red-rose": 2, "white-rose": 1, eucalyptus: 1, "sage-wrap": 1 };
      return window.RylvaBouquetComposition.createLayout(data.options, selections);
    });
    const sameLayout = await page.evaluate(() =>
    {
      const data = window.RylvaBouquetPreviewData;
      return window.RylvaBouquetComposition.createLayout(data.options,
        { "red-rose": 2, "white-rose": 1, eucalyptus: 1, "sage-wrap": 1 });
    });
    assert.deepEqual(baseLayout, sameLayout);
    assert.ok(new Set(baseLayout.blooms.map((item) => item.y)).size > 8);
    assert.ok(new Set(baseLayout.blooms.map((item) => item.rotation)).size > 6);
    assert.ok(new Set(baseLayout.blooms.map((item) => item.size)).size > 4);
    assert.equal(baseLayout.blooms.length, 15);
    checks.push("Seeded arrangement mixes flowers with varied heights, angles and sizes and remains repeatable");

    const originalComposition = await page.$eval(".bq-composition", (element) => element.innerHTML);
    await click('[data-bq-action="more-bouquets"]');
    await page.waitForFunction(() => document.getElementById("bouquet-submit").disabled === false);
    assert.equal(await page.$eval(".bq-composition", (element) => element.innerHTML), originalComposition);
    const layers = await page.evaluate(() =>
    {
      const nodes = Array.from(document.querySelectorAll(".bq-composition-layer"));
      return {
        names: nodes.map((element) => element.dataset.compositionLayer),
        depth: nodes.map((element) => Number(getComputedStyle(element).zIndex)),
        frontImage: document.querySelector(".bq-paper-front").getAttribute("src"),
        backImage: document.querySelector(".bq-paper-back").getAttribute("src"),
        flowerImage: getComputedStyle(document.querySelector(".bq-bloom-art")).backgroundImage
      };
    });
    assert.deepEqual(layers.names, ["back-wrapper", "back-foliage", "focal-flowers", "front-filler", "front-collar", "ribbon"]);
    assert.deepEqual(layers.depth, [1, 2, 3, 4, 5, 6]);
    assert.match(layers.frontImage, /front-collar.png/);
    assert.match(layers.backImage, /back-wrapper.png/);
    assert.match(layers.flowerImage, /rose-heads.png/);
    checks.push("Six independent material layers preserve insertion, depth and stable bouquet quantity updates");

    for (const width of [320, 390, 700, 768, 1024, 1280, 1440, 1920])
    {
      await open(width, width < 701 ? 844 : 1000);
      const four = await page.$eval("#bouquet-selected-list", (element) => element.getBoundingClientRect().height);
      await sixChoices();
      const geometry = await page.evaluate(() =>
      {
        const list = document.getElementById("bouquet-selected-list");
        const children = Array.from(list.children);
        const panel = document.querySelector(".bq-options-panel");
        const options = document.querySelector(".bq-options-body");
        const pricing = document.querySelector(".bq-pricing");
        return {
          rows: new Set(children.map((element) => Math.round(element.offsetTop))).size,
          height: list.getBoundingClientRect().height,
          scrollWidth: list.scrollWidth,
          width: list.clientWidth,
          pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
          asideOverflow: getComputedStyle(panel).overflowY,
          optionsOverflow: getComputedStyle(options).overflowY,
          gap: pricing.getBoundingClientRect().top - options.getBoundingClientRect().bottom,
          controls: !document.getElementById("bouquet-selected-controls").hidden
        };
      });
      assert.equal(geometry.rows, 2, "Row count at " + width);
      assert.equal(geometry.height, four, "More choices increased rail height at " + width);
      assert.ok(geometry.scrollWidth > geometry.width, "Rail should slide at " + width);
      assert.equal(geometry.pageOverflow, false, "Page overflow at " + width);
      assert.equal(geometry.asideOverflow, "visible");
      assert.equal(geometry.optionsOverflow, "visible");
      assert.ok(geometry.gap >= 16);
      assert.equal(geometry.controls, true);
      await click('[data-bq-action="selected-next"]');
      await page.waitForFunction(() => document.querySelector('[data-bq-action="selected-next"]').disabled);
      await click('[data-bq-action="selected-previous"]');
      await page.waitForFunction(() => document.getElementById("bouquet-selected-list").scrollLeft < 2);
      if (width === 390 || width === 1440)
      {
        await page.screenshot(
        {
          path: outputDirectory + "/" + (width === 390 ? "mobile-final" : "desktop-final") + ".png",
          fullPage: true
        });
      }
    }
    checks.push("Eight viewport widths retain exactly two rows, fixed rail height, horizontal navigation and separated unclipped panels");

    await open(390, 844);
    await sixChoices();
    await page.$eval("#bouquet-selected-list", (element) => element.scrollIntoView({ block: "start" }));
    const rail = await page.$eval("#bouquet-selected-list", (element) =>
    {
      const bounds = element.getBoundingClientRect();
      return { x: bounds.left, y: bounds.top, width: bounds.width };
    });
    const client = await page.createCDPSession();
    const y = Math.max(30, rail.y + 90);
    await client.send("Input.dispatchTouchEvent",
    { type: "touchStart", touchPoints: [{ x: rail.x + rail.width - 40, y }] });
    for (let step = 1; step <= 8; step++)
    {
      await client.send("Input.dispatchTouchEvent",
      { type: "touchMove", touchPoints: [{ x: rail.x + rail.width - 40 - step * 24, y }] });
    }
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForFunction(() => document.getElementById("bouquet-selected-list").scrollLeft > 10);
    checks.push("Real mobile touch gesture horizontally slides the two-row component rail");

    const icons = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".bq-category-glyph")).map((element) =>
      {
        const style = getComputedStyle(element);
        return { color: style.backgroundColor, mask: style.maskImage, width: element.clientWidth, height: element.clientHeight };
      }));
    assert.ok(icons.every((icon) => icon.mask.includes(".svg") && icon.width === 21 && icon.height === 21));
    const activeIcon = await page.$eval('.bq-category[aria-pressed="true"] .bq-category-glyph',
      (element) => getComputedStyle(element).backgroundColor);
    const inactiveIcon = await page.$eval('.bq-category[aria-pressed="false"] .bq-category-glyph',
      (element) => getComputedStyle(element).backgroundColor);
    assert.notEqual(activeIcon, inactiveIcon);
    await click('[data-bq-action="zoom"]');
    await page.waitForSelector("#home-dialog[open]");
    assert.ok(await page.$("#home-dialog .bq-paper-front"));
    await page.keyboard.press("Escape");
    checks.push("Category SVG silhouettes adapt to active/inactive surfaces and enlarged preview uses the same layered composition");

    assert.deepEqual(errors, []);
    fs.writeFileSync(outputDirectory + "/verification.json", JSON.stringify({ checks, errors }, null, 2));
    console.log(JSON.stringify({ passed: checks.length, checks, errors }, null, 2));
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
