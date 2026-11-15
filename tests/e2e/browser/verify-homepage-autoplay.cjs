"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_HOME_URL || "http://127.0.0.1:4185";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/homepage-marigold/autoplay");

async function verifyAutoplay()
{
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true
  });
  const errors = [];
  const checks = [];

  async function open(width = 1440, accelerated = false)
  {
    const page = await browser.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewport(
    {
      width,
      height: width <= 600 ? 844 : 1080,
      isMobile: width <= 600,
      hasTouch: width <= 600
    });
    if (accelerated)
    {
      await page.evaluateOnNewDocument(() =>
      {
        // Only accelerate the hero interval. No development switch reaches production.
        const nativeSetTimeout = window.setTimeout.bind(window);
        window.setTimeout = (callback, delay, ...args) =>
          nativeSetTimeout(callback, delay === 6500 ? 500 : delay, ...args);
      });
    }
    await page.goto(BASE_URL + "/pages/public/home.html", { waitUntil: "networkidle0" });
    await page.waitForSelector(".home-product");
    return page;
  }

  async function expectTheme(page, theme, timeout = 2500)
  {
    await page.waitForFunction((expected) =>
      document.querySelector(".home-hero").dataset.heroTheme === expected,
      { timeout }, theme);
  }

  async function delay(duration)
  {
    await new Promise((resolve) => setTimeout(resolve, duration));
  }

  try
  {
    const desktop = await open();
    await desktop.click('[data-home-slide="1"]');
    await expectTheme(desktop, "calathea");
    assert.equal(await desktop.evaluate(() => document.activeElement.dataset.homeSlide), "1");
    assert.equal(await desktop.$eval(".home-hero", (hero) => hero.dataset.autoplay), "playing");
    const selectedAt = Date.now();
    await expectTheme(desktop, "petunia", 8500);
    assert.ok(Date.now() - selectedAt >= 6000, "A manual selection must get a full reading interval");
    assert.equal(await desktop.evaluate(() => document.activeElement.dataset.homeSlide), "1");
    checks.push("Real pointer selection keeps focus and resumes automatic rotation after the 6.5-second interval");
    await desktop.close();

    for (const width of [1440, 390])
    {
      const page = await open(width, true);
      const lastDot = '[data-home-slide="3"]';
      if (width <= 600)
      {
        await (await page.$(lastDot)).tap();
      }
      else
      {
        await page.focus(lastDot);
        await page.keyboard.press("Enter");
      }
      await expectTheme(page, "marigold");
      await expectTheme(page, "monstera");
      await expectTheme(page, "calathea");
      assert.equal(await page.evaluate(() => document.activeElement.dataset.homeSlide), "3");

      await page.click("#home-hero-playback");
      await page.click('[data-home-slide="3"]');
      await expectTheme(page, "marigold");
      await delay(1300);
      assert.equal(await page.$eval(".home-hero", (hero) => hero.dataset.heroTheme), "marigold");
      assert.equal(await page.$eval(".home-hero", (hero) => hero.dataset.autoplay), "paused");
      assert.equal(await page.$eval("#home-hero-playback", (button) => button.getAttribute("aria-pressed")), "true");
      await page.click("#home-hero-playback");
      await expectTheme(page, "monstera");

      await page.focus(".home-hero [data-home-collection]");
      const focusedTheme = await page.$eval(".home-hero", (hero) => hero.dataset.heroTheme);
      await delay(1300);
      assert.equal(await page.$eval(".home-hero", (hero) => hero.dataset.heroTheme), focusedTheme);

      await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
      await page.click(lastDot);
      await expectTheme(page, "marigold");
      await delay(1300);
      assert.equal(await page.$eval(".home-hero", (hero) => hero.dataset.heroTheme), "marigold");
      assert.equal(await page.$eval("#home-hero-playback", (button) => button.hidden), true);
      assert.equal(await page.$$eval('[data-home-slide][aria-pressed="true"]', (dots) => dots.length), 1);
      await page.close();
    }
    checks.push("Keyboard and touch selections continue through Marigold and wrap to the first slide without moving focus");
    checks.push("Explicit Pause survives manual selections; Resume works; ordinary keyboard focus and reduced motion still pause rotation");

    for (const width of [1920, 1440, 1024, 768, 390, 320])
    {
      const page = await open(width);
      await page.click("#home-hero-playback");
      await page.click('[data-home-slide="3"]');
      await expectTheme(page, "marigold");
      await delay(750);
      const layout = await page.$eval(".home-hero", (hero) =>
      {
        const rect = (node) =>
        {
          const bounds = node.getBoundingClientRect();
          return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom, width: bounds.width, height: bounds.height };
        };
        const photo = hero.querySelector(".home-hero-plant");
        return {
          hero: rect(hero),
          image: rect(photo),
          art: rect(hero.querySelector(".home-hero-art")),
          cta: rect(hero.querySelector("[data-home-collection]")),
          pagination: rect(hero.querySelector(".home-hero-pagination")),
          title: rect(hero.querySelector("h1")),
          titleText: hero.querySelector("h1").textContent,
          description: hero.querySelector("#home-hero-description").textContent,
          alt: photo.alt,
          imageLoaded: photo.complete && photo.naturalWidth > 0,
          surface: getComputedStyle(hero).backgroundColor,
          dots: hero.querySelectorAll("[data-home-slide]").length,
          overflowing: document.documentElement.scrollWidth > innerWidth
        };
      });
      assert.equal(layout.titleText, "MARIGOLD");
      assert.match(layout.description, /Jingga.*kuning.*Marigold/);
      assert.match(layout.alt, /Marigold/);
      assert.equal(layout.imageLoaded, true);
      assert.equal(layout.surface, "rgb(255, 242, 223)");
      assert.equal(layout.dots, 4);
      assert.equal(layout.overflowing, false);
      assert.ok(layout.pagination.left >= layout.hero.left && layout.pagination.right <= layout.hero.right);
      if (width <= 600)
      {
        assert.ok(Math.abs(layout.cta.width - layout.art.width) < 1);
        assert.ok(layout.cta.height >= 48);
        assert.ok(layout.image.bottom < layout.cta.top);
      }
      await (await page.$(".home-hero")).screenshot(
      {
        path: path.join(OUTPUT_DIRECTORY, "marigold-" + width + ".png")
      });
      if (width === 1440 || width === 390)
      {
        await page.evaluate(async () =>
        {
          await document.fonts.ready;
          document.querySelectorAll("img").forEach((image) => image.loading = "eager");
          await Promise.all([...document.images].map((image) => image.decode()));
        });
        await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "page-" + width + ".png"), fullPage: true });
      }
      await page.click(".home-hero [data-home-collection]");
      await page.waitForFunction(() => document.getElementById("home-dialog").open);
      assert.ok(await page.$$("#home-collection-results .home-product").then((items) => items.length > 0));
      await page.keyboard.press("Escape");
      await page.close();
    }
    checks.push("Marigold has its orange palette, image, copy, fourth dot and working collection CTA at six viewport widths; mobile image/CTA layout is preserved");
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "verification.json"), JSON.stringify({ checks, errors }, null, 2));
    console.log(JSON.stringify({ checks, errors }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyAutoplay().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
