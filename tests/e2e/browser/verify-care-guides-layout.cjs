"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("../../../tools/testing/browser-runtime.cjs");
const OUTPUT_DIRECTORY = path.resolve("storage/reports/care-guides/two-column-correction");
const REVIEW_DIRECTORY = path.resolve(".impeccable/review/care-guides-paired");
const BASE_URL = process.env.RYLVA_INFORMATION_URL || "http://127.0.0.1:4185";

async function verifyCareGuidesLayout()
{
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  fs.mkdirSync(REVIEW_DIRECTORY, { recursive: true });
  const browser = await runtime.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true,
    userDataDir: path.join(OUTPUT_DIRECTORY, "chrome-layout")
  });
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const checks = [];
  const captures = [];
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  async function capture(name)
  {
    await page.evaluate(async () =>
    {
      scrollTo({ top: 0, behavior: "instant" });
      await document.fonts.ready;
      document.querySelectorAll("img").forEach((image) => image.loading = "eager");
      await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
    });
    await new Promise((resolve) => setTimeout(resolve, 420));
    const file = path.join(OUTPUT_DIRECTORY, name);
    await page.screenshot({ path: file, fullPage: true });
    fs.copyFileSync(file, path.join(REVIEW_DIRECTORY, name));
    captures.push(name);
  }

  async function checkRows()
  {
    const rows = await page.$$eval(".care-card", (cards) => cards.map((card) =>
    {
      const box = card.getBoundingClientRect();
      return {
        id: card.id,
        x: box.x,
        width: box.width,
        top: box.top + scrollY,
        bottom: box.bottom + scrollY,
        actionTop: card.querySelector("summary").getBoundingClientRect().top + scrollY,
        imageTop: card.querySelector(".care-photo").getBoundingClientRect().top + scrollY,
        titleTop: card.querySelector("h2").getBoundingClientRect().top + scrollY
      };
    }));
    assert.equal(rows.length, 5);
    const desktop = await page.evaluate(() => innerWidth > 800);
    for (let index = 1; index < rows.length; index++)
    {
      assert.ok(Math.abs(rows[index].width - rows[0].width) < 1);
      if (desktop && index % 2 === 1)
      {
        const previous = rows[index - 1];
        assert.ok(rows[index].x > previous.x);
        for (const key of ["top", "bottom", "actionTop", "imageTop", "titleTop"])
        {
          assert.ok(Math.abs(rows[index][key] - previous[key]) < 1, key + " must align across each card pair");
        }
      }
      else
      {
        const previousRow = rows[index - (desktop ? 2 : 1)];
        assert.ok(Math.abs(rows[index].x - rows[0].x) < 1);
        assert.ok(Math.abs(rows[index].top - previousRow.bottom - 24) < 1);
      }
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await page.$eval(".care-help", (element) => getComputedStyle(element).textAlign), "center");
    return rows;
  }

  try
  {
    for (const width of [1440, 1578, 1024, 390, 320])
    {
      await page.setViewport({ width, height: 1000 });
      await page.goto(BASE_URL + "/pages/public/care-guides.html?type=indoor", { waitUntil: "networkidle0" });
      await page.waitForSelector(".care-card");
      await page.evaluate(() => document.fonts.ready);
      const before = await checkRows();
      await capture(`care-paired-closed-${width}.png`);

      const summary = "#guide-peace-lily summary";
      await page.focus(summary);
      await page.keyboard.press("Enter");
      await page.waitForFunction(() => document.querySelector("#guide-peace-lily details").open);
      const expanded = await checkRows();
      assert.ok(Math.abs(expanded[0].top - before[0].top) < 1);
      assert.ok(Math.abs(expanded[1].top - before[1].top) < 1);
      assert.ok(expanded[2].top > before[2].top);
      await capture(`care-paired-expanded-${width}.png`);

      await page.focus("#guide-aglaonema summary");
      await page.keyboard.press("Space");
      await page.waitForFunction(() => document.querySelector("#guide-aglaonema details").open);
      await checkRows();
      assert.equal(new URL(page.url()).searchParams.getAll("guide").length, 2);
      await capture(`care-paired-multiple-${width}.png`);

      await page.focus(summary);
      await page.keyboard.press("Enter");
      await page.waitForFunction(() => !document.querySelector("#guide-peace-lily details").open);
      await checkRows();
      assert.equal(await page.$eval("#guide-aglaonema details", (element) => element.open), true);
      checks.push(`Paired desktop cards or single mobile cards align through closed, second-open, multi-open and close states at ${width}px`);
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "layout-verification.json"),
      JSON.stringify({ checks, captures, errors }, null, 2));
    checks.forEach((check) => console.log("PASS " + check));
  }
  finally
  {
    await browser.close();
  }
}

verifyCareGuidesLayout().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
