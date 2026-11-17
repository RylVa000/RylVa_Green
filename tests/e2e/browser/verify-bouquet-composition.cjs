"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const runtime = require("../../../tools/testing/browser-runtime.cjs");
const baseUrl = process.env.RYLVA_BOUQUET_URL || "http://127.0.0.1:4185";
const directory = "storage/reports/bouquet-korean";

async function verify()
{
  fs.mkdirSync(directory, { recursive: true });
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

  async function open(state = "ready", width = 1440)
  {
    await page.setViewport({ width, height: width < 701 ? 844 : 1100, isMobile: width < 701, hasTouch: width < 701 });
    await page.goto(baseUrl + "/pages/customer/bouquet-customizer.html?preview=bouquet&state=" + state,
      { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.getElementById("bouquet-submit")?.disabled === false || document.querySelector(".bq-preview-empty"));
    await page.waitForSelector(".bq-stem, .bq-preview-empty, .bq-preview-fallback");
  }

  async function completeSelection()
  {
    await click('[data-bq-group="flowers"]');
    await click('[data-bq-option="white-rose"]');
    await click('[data-bq-group="foliage"]');
    await click('[data-bq-option="baby-breath"]');
    await page.waitForFunction(() => document.getElementById("bouquet-submit").disabled === false);
  }

  try
  {
    await open();
    await completeSelection();
    const anatomy = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".bq-composition-layer")).map((element) =>
        ({ name: element.dataset.compositionLayer, depth: Number(getComputedStyle(element).zIndex) })));
    assert.deepEqual(anatomy, [
      { name: "back-wrapper", depth: 1 }, { name: "back-foliage", depth: 2 },
      { name: "focal-flowers", depth: 3 }, { name: "front-filler", depth: 4 },
      { name: "front-collar", depth: 5 }, { name: "ribbon", depth: 6 }
    ]);
    const sourceAssets = await page.evaluate(async () =>
    {
      const records = [];
      for (const url of window.RylvaBouquetComposition.assetUrls)
      {
        const image = new Image();
        image.src = url;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(image, 0, 0);
        const corners = [[0, 0], [canvas.width - 1, 0], [0, canvas.height - 1], [canvas.width - 1, canvas.height - 1]];
        const alpha = corners.map(([x, y]) => context.getImageData(x, y, 1, 1).data[3]);
        let whiteTissue = 0;
        if (url.endsWith("front-collar.png"))
        {
          const pixels = context.getImageData(0, 0, canvas.width, Math.floor(canvas.height * 0.6)).data;
          for (let index = 0; index < pixels.length; index += 64)
          {
            if (pixels[index] > 220 && pixels[index + 1] > 220 && pixels[index + 2] > 210 && pixels[index + 3] > 200)
            {
              whiteTissue++;
            }
          }
        }
        records.push({ url, alpha, whiteTissue, width: canvas.width, height: canvas.height });
      }
      return records;
    });
    assert.ok(sourceAssets.every((asset) => asset.alpha.every((value) => value < 5) && asset.width > 500));
    assert.ok(sourceAssets.find((asset) => asset.url.endsWith("front-collar.png")).whiteTissue > 100);
    checks.push("Six ordered material layers use independent transparent assets and a photographic white tissue collar");

    const layouts = await page.evaluate(() =>
    {
      const data = window.RylvaBouquetPreviewData;
      const composer = window.RylvaBouquetComposition;
      const selections = { "red-rose": 6, "white-rose": 6, eucalyptus: 2, "baby-breath": 3, "sage-wrap": 1, "cream-ribbon": 1 };
      const maximum = composer.createLayout(data.options, selections);
      const repeated = composer.createLayout(data.options, selections);
      const withoutExtras = composer.createLayout(data.options,
        { "red-rose": 1, "sage-wrap": 1, "cream-ribbon": 1 });
      return { maximum, repeated, withoutExtras };
    });
    assert.deepEqual(layouts.maximum, layouts.repeated);
    assert.equal(layouts.maximum.blooms.length, 24);
    assert.equal(new Set(layouts.maximum.blooms.map((item) => item.x + "," + item.y)).size, 24);
    assert.ok(layouts.maximum.blooms.every((item) => item.rotation >= -25 && item.rotation <= 25 && item.scale >= 0.85 && item.scale <= 1.15));
    assert.ok(layouts.maximum.blooms.filter((item) => item.x < 190).every((item) => item.rotation < 0));
    assert.ok(layouts.maximum.blooms.filter((item) => item.x > 230).every((item) => item.rotation > 0));
    assert.ok(new Set(layouts.maximum.blooms.map((item) => item.variant)).size === 3);
    assert.ok(layouts.maximum.blooms.every((item, index, items) => index === 0 || item.y >= items[index - 1].y));
    const averageScale = (items) => items.reduce((sum, item) => sum + item.scale, 0) / items.length;
    assert.ok(averageScale(layouts.maximum.blooms.slice(-6)) > averageScale(layouts.maximum.blooms.slice(0, 6)));
    assert.equal(layouts.withoutExtras.greenery.length, 0);
    assert.equal(layouts.withoutExtras.fillers.length, 0);
    assert.equal(layouts.withoutExtras.frontGreenery.length, 0);
    assert.ok(layouts.maximum.greenery.every((item) => item.brightness >= 0.9 && item.brightness <= 0.95));
    checks.push("Organic slots obey fan direction, rotation and scale limits, depth ordering, perspective, three views and deterministic placement");

    const painted = await page.evaluate(() =>
    {
      const blooms = Array.from(document.querySelectorAll(".bq-stem"));
      const front = document.querySelector(".bq-paper-front").getBoundingClientRect();
      const lowerBloom = Math.max(...blooms.map((element) => element.getBoundingClientRect().bottom));
      return {
        petalFilters: blooms.map((element) => getComputedStyle(element).filter),
        paperFilter: getComputedStyle(document.querySelector(".bq-paper-front")).filter,
        insertion: front.top < lowerBloom && front.bottom > lowerBloom,
        fillers: document.querySelectorAll(".bq-layer-front-filler .bq-filler").length
      };
    });
    assert.ok(painted.petalFilters.every((filter) => filter.includes("brightness(") && filter.includes("drop-shadow(")));
    assert.ok(painted.paperFilter.includes("drop-shadow("));
    assert.equal(painted.insertion, true);
    assert.ok(painted.fillers > 0);
    await page.$eval("#bouquet-stage", (element) => element.scrollIntoView({ block: "center" }));
    await page.screenshot({ path: directory + "/desktop.png", fullPage: true });
    await page.$(".bq-preview").then((element) => element.screenshot({ path: directory + "/composition.png" }));
    checks.push("Rendered petals and front paper cast soft alpha shadows while the collar covers the lower flower bases");

    for (const width of [320, 390, 768, 1440, 1920])
    {
      await open("ready", width);
      await completeSelection();
      await click('[data-bq-group="flowers"]');
      for (let index = 0; index < 5; index++)
      {
        await click('[data-bq-option-step="red-rose"][data-step="1"]');
        await click('[data-bq-option-step="white-rose"][data-step="1"]');
      }
      await page.waitForFunction(() => document.getElementById("bouquet-submit").disabled === false);
      const bounds = await page.evaluate(() =>
      {
        const stage = document.getElementById("bouquet-stage").getBoundingClientRect();
        const ribbon = document.querySelector(".bq-composition-ribbon").getBoundingClientRect();
        const backPaper = document.querySelector(".bq-paper-back").getBoundingClientRect();
        const frontPaper = document.querySelector(".bq-paper-front").getBoundingClientRect();
        return {
          stageBottom: stage.bottom, stageTop: stage.top, ribbonBottom: ribbon.bottom,
          paperBottom: backPaper.bottom, frontBottom: frontPaper.bottom,
          paperTie: backPaper.top + backPaper.height * 0.76,
          ribbonTie: ribbon.top + ribbon.height * 0.2,
          rootTransform: getComputedStyle(document.querySelector(".bq-composition")).transform,
          rootStyle: document.querySelector(".bq-composition").getAttribute("style"),
          rootHeight: document.querySelector(".bq-composition").getBoundingClientRect().height,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          blooms: document.querySelectorAll(".bq-stem").length
        };
      });
      assert.equal(bounds.blooms, 24);
      assert.equal(bounds.overflow, false);
      assert.ok(bounds.ribbonBottom <= bounds.stageBottom - 8, "Ribbon clipped at " + width + " " + JSON.stringify(bounds));
      assert.ok(bounds.paperBottom <= bounds.stageBottom - 8, "Paper hem clipped at " + width);
      assert.ok(bounds.paperBottom > bounds.frontBottom + 20, "Lower wrapper hidden at " + width);
      assert.ok(Math.abs(bounds.paperTie - bounds.ribbonTie) < 1, "Paper and bow ties misaligned at " + width);
      if (width === 390)
      {
        await page.screenshot({ path: directory + "/mobile-maximum.png", fullPage: true });
      }
    }
    checks.push("Maximum floral density retains a complete paper hem, aligned bow and visible tails at five desktop/mobile widths");

    await page.setRequestInterception(true);
    let blockRoseAsset = true;
    const requestHandler = (request) =>
    {
      if (blockRoseAsset && request.url().endsWith("/korean/rose-heads.png"))
      {
        request.abort();
      }
      else
      {
        request.continue();
      }
    };
    page.on("request", requestHandler);
    await page.setCacheEnabled(false);
    await page.goto(baseUrl + "/pages/customer/bouquet-customizer.html?preview=bouquet&state=ready",
      { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".bq-preview-fallback");
    assert.equal(await page.$eval("#bouquet-stage", (element) => element.getAttribute("role")), "group");
    await page.waitForFunction(() => document.getElementById("bouquet-submit").disabled === false);
    blockRoseAsset = false;
    await click('[data-bq-action="retry-image"]');
    await page.waitForSelector(".bq-stem");
    assert.equal(await page.$("#bouquet-content [data-composition-layer='front-collar'] img").then(Boolean), true);
    await page.setRequestInterception(false);
    page.off("request", requestHandler);
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    assert.equal(await page.$eval(".bq-stem", (element) => getComputedStyle(element).animationName), "none");
    checks.push("Failed composition asset preserves the form and recovers; reduced motion disables flower entrances");

    assert.deepEqual(errors, []);
    fs.writeFileSync(directory + "/verification.json", JSON.stringify({ checks, sourceAssets, errors }, null, 2));
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
