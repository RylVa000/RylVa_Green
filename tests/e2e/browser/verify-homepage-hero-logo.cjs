"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_HOME_URL || "http://127.0.0.1:4185";
const OUTPUT_DIRECTORY = path.resolve(process.env.RYLVA_HOME_REPORT_DIR || "storage/reports/homepage-hero-logo-final");

async function verifyHeroLogo()
{
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true
  });
  const page = await browser.newPage();
  const errors = [];
  const measurements = [];
  page.on("pageerror", (error) => errors.push(error.message));

  async function open(width, route = "/pages/public/home.html")
  {
    await page.setViewport({ width, height: width <= 600 ? 844 : 1080 });
    await page.goto(BASE_URL + route, { waitUntil: "networkidle0" });
    await page.evaluate(async () =>
    {
      await document.fonts.ready;
      document.querySelectorAll("img").forEach((image) => image.loading = "eager");
      await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
    });
  }

  async function slide(index)
  {
    await page.evaluate(async (value) => window.RylvaHomepageHero.select(value, true), index);
    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  try
  {
    for (const width of [1920, 1440, 1366, 1024, 768])
    {
      await open(width);
      for (const [index, theme] of ["monstera", "calathea", "petunia", "marigold"].entries())
      {
        await slide(index);
        const overlap = await page.$eval(".home-hero", (hero) =>
        {
          const image = hero.querySelector(".home-hero-plant");
          const imageRect = image.getBoundingClientRect();
          const arch = hero.querySelector(".home-hero-arch").getBoundingClientRect();
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0);
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
          const samples = [];
          for (const offsetX of [-2, 0, 2])
          {
            for (const offsetY of [-2, -1, 0])
            {
              const x = Math.floor((arch.left + offsetX - imageRect.left) / imageRect.width * canvas.width);
              const y = Math.floor((arch.bottom + offsetY - imageRect.top) / imageRect.height * canvas.height);
              samples.push(pixels[(y * canvas.width + x) * 4 + 3] || 0);
            }
          }
          return {
            minimumAlphaAtCorner: Math.min(...samples),
            aspectDifference: Math.abs(imageRect.width / imageRect.height - canvas.width / canvas.height),
            overflowsPage: document.documentElement.scrollWidth > innerWidth
          };
        });
        assert.ok(overlap.minimumAlphaAtCorner > 230, theme + " leaves a visible strip at " + width);
        assert.ok(overlap.aspectDifference < 0.001, theme + " must keep its original aspect ratio");
        assert.equal(overlap.overflowsPage, false);
        measurements.push({ width, theme, ...overlap });
        if ([1920, 768].includes(width))
        {
          await (await page.$(".home-hero")).screenshot({ path: path.join(OUTPUT_DIRECTORY, theme + "-" + width + ".png") });
        }
      }
    }

    await open(1440);
    const saveSelector = '.home-product--monstera [data-home-save]';
    async function favoriteState()
    {
      return page.$eval(saveSelector, (button) =>
      {
        const style = getComputedStyle(button);
        const icon = getComputedStyle(button.querySelector("svg"));
        return { border: style.borderTopColor, background: style.backgroundColor, color: icon.color, fill: icon.fill, pressed: button.getAttribute("aria-pressed") };
      });
    }
    const defaultState = await favoriteState();
    await page.hover(saveSelector);
    const hoverState = await favoriteState();
    assert.equal(hoverState.border, "rgb(150, 63, 92)");
    assert.equal(hoverState.background, defaultState.background);
    assert.equal(hoverState.color, defaultState.color);
    assert.equal(hoverState.fill, "none");
    assert.equal(hoverState.pressed, "false");
    await (await page.$(".home-product--monstera")).screenshot({ path: path.join(OUTPUT_DIRECTORY, "wishlist-hover.png") });
    await page.click(saveSelector);
    const savedState = await favoriteState();
    assert.equal(savedState.pressed, "true");
    assert.equal(savedState.fill, "rgb(150, 63, 92)");
    await (await page.$(".home-product--monstera")).screenshot({ path: path.join(OUTPUT_DIRECTORY, "wishlist-saved.png") });
    await page.mouse.move(0, 0);
    await page.$eval(saveSelector, (button) => button.click());
    const removedState = await favoriteState();
    assert.equal(removedState.pressed, "false");
    assert.equal(removedState.fill, "none");
    assert.equal(removedState.background, defaultState.background);

    for (const width of [390, 320])
    {
      await open(width);
      await slide(1);
      await (await page.$(".home-hero")).screenshot({ path: path.join(OUTPUT_DIRECTORY, "mobile-hero-" + width + ".png") });
      await (await page.$("header")).screenshot({ path: path.join(OUTPUT_DIRECTORY, "mobile-header-" + width + ".png") });
    }

    for (const [route, width] of [["cart", 1920], ["account", 390], ["my-orders", 320]])
    {
      await open(width, "/pages/customer/" + route + ".html");
      for (const area of ["header", "footer"])
      {
        const sourceMatch = await page.$eval(area + " img[src*='logo-']", async (image) =>
        {
          const parser = new DOMParser();
          const source = parser.parseFromString(await (await fetch("/assets/images/storefront/logo-figma-source.svg")).text(), "image/svg+xml");
          const logo = parser.parseFromString(await (await fetch(image.src)).text(), "image/svg+xml");
          const botanical = logo.querySelector('[data-figma-botanical="649:199"]');
          const originalBotanical = source.getElementById("Group");
          const paths = (node) => [...node.querySelectorAll("path")].map((part) =>
            ["d", "fill", "fill-rule", "stroke", "stroke-width"].map((attribute) => part.getAttribute(attribute)));
          const rect = image.getBoundingClientRect();
          const dimensions = logo.documentElement.getAttribute("viewBox").split(" ").map(Number);
          return {
            samePathsAndColors: JSON.stringify(paths(originalBotanical)) === JSON.stringify(paths(botanical)),
            sameFullGeometry: JSON.stringify([...source.querySelectorAll("path")].map((part) => part.getAttribute("d")))
              === JSON.stringify([...logo.querySelectorAll("path")].map((part) => part.getAttribute("d"))),
            uniformScale: botanical.getAttribute("transform") === originalBotanical.getAttribute("transform"),
            aspectDifference: Math.abs(rect.width / rect.height - dimensions[2] / dimensions[3]),
            heightDifference: Math.abs(rect.height - rect.width * dimensions[3] / dimensions[2]),
            sourceWidth: source.documentElement.getAttribute("width"),
            nestedWidth: logo.documentElement.getAttribute("width"),
            sourceHeight: source.documentElement.getAttribute("height"),
            logoHeight: logo.documentElement.getAttribute("height"),
            renderedWidth: rect.width,
            renderedHeight: rect.height,
            viewBox: dimensions
          };
        });
        assert.equal(sourceMatch.samePathsAndColors, true);
        assert.equal(sourceMatch.sameFullGeometry, true);
        assert.equal(sourceMatch.uniformScale, true);
        assert.equal(sourceMatch.sourceWidth, sourceMatch.nestedWidth);
        assert.equal(sourceMatch.sourceHeight, sourceMatch.logoHeight);
        assert.ok(sourceMatch.heightDifference < 0.1, route + " " + area + ": " + JSON.stringify(sourceMatch));
        await (await page.$(area)).screenshot({ path: path.join(OUTPUT_DIRECTORY, route + "-" + area + ".png") });
      }
    }
    assert.deepEqual(errors, []);
    const checks = [
      "All four desktop/tablet hero images cover the lower-left arch corner and its adjacent pixels at five widths without distortion",
      "Wishlist hover changes only its thin border; heart fill changes only after saving and resets when removed",
      "Mobile hero controls and centered composition remain rendered at 320px and 390px",
      "Navigation/footer use the exact Figma botanical paths and colors with uniform scale; existing cream wordmark remains readable on green"
    ];
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "verification.json"), JSON.stringify({ checks, errors, measurements, defaultState, hoverState, savedState, removedState }, null, 2));
    console.log(JSON.stringify({ checks, errors }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyHeroLogo().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
