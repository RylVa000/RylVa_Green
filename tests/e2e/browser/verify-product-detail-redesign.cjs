"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("../../../tools/testing/browser-runtime.cjs");
const baseUrl = process.env.RYLVA_PRODUCT_DETAIL_URL || "http://127.0.0.1:4185";
const outputDirectory = path.resolve("storage/reports/product-detail-redesign");

async function verifyRedesign()
{
  fs.mkdirSync(outputDirectory, { recursive: true });
  const browser = await runtime.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true
  });
  const page = await browser.newPage();
  const errors = [];
  const checks = [];
  page.on("pageerror", (error) => errors.push(error.message));

  async function settle()
  {
    await page.evaluate(async () =>
    {
      await document.fonts.ready;
      await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
  }

  async function open(width, state = "normal", touch = false)
  {
    await page.mouse.move(0, 0);
    await page.setViewport({ width, height: width < 768 ? 844 : 1000, hasTouch: touch, isMobile: touch });
    await page.goto(baseUrl + "/pages/public/product-detail.html?product=monstera&preview=product-detail&state=" + state, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.getElementById("product-content").getAttribute("aria-busy") === "false");
    await settle();
  }

  async function capture(name, fullPage = false)
  {
    await settle();
    await page.screenshot({ path: path.join(outputDirectory, name + ".png"), fullPage });
  }

  try
  {
    for (const width of [1920, 1440, 1280, 1024, 768])
    {
      await open(width);
      const columns = await page.evaluate(() =>
      {
        const quote = document.querySelector("#product-shipping button").getBoundingClientRect();
        const quantity = document.querySelector(".product-stepper").getBoundingClientRect();
        const button = document.querySelector("#product-add").getBoundingClientRect();
        return { quoteLeft: quote.left, quantityLeft: quantity.left, quoteRight: quote.right, quantityRight: quantity.right,
          quoteWidth: quote.width, quantityWidth: quantity.width, quoteHeight: quote.height, quantityHeight: quantity.height,
          buttonHeight: button.height, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      assert.ok(Math.abs(columns.quoteLeft - columns.quantityLeft) <= 0.1, "Left edges match at " + width);
      assert.ok(Math.abs(columns.quoteRight - columns.quantityRight) <= 0.1, "Right edges match at " + width);
      assert.equal(columns.quoteWidth, columns.quantityWidth);
      assert.equal(columns.quoteHeight, 48);
      assert.equal(columns.quantityHeight, 48);
      assert.equal(columns.buttonHeight, 48);
      assert.equal(columns.overflow, false);
      if (width === 1440 || width === 1920)
      {
        await capture("desktop-" + width, true);
      }
    }
    checks.push("Five desktop/tablet widths: shipping and quantity share exact column edges, widths and 48px height");

    await open(1440);
    const colors = await page.evaluate(() =>
    {
      const badge = getComputedStyle(document.querySelector(".product-discount"));
      const old = getComputedStyle(document.querySelector(".product-pricing del"));
      return { badge: badge.backgroundColor, ink: badge.color, badgeSize: parseFloat(badge.fontSize), weight: Number(badge.fontWeight),
        old: old.color, strike: old.textDecorationColor, strikeLine: old.textDecorationLine,
        buttonRadius: parseFloat(getComputedStyle(document.getElementById("product-buy")).borderRadius),
        selectRadius: parseFloat(getComputedStyle(document.getElementById("product-variant")).borderRadius),
        careRadius: parseFloat(getComputedStyle(document.querySelector(".product-care")).borderRadius) };
    });
    assert.equal(colors.badge, "rgb(255, 0, 0)");
    assert.equal(colors.ink, "rgb(255, 255, 255)");
    assert.ok(colors.badgeSize >= 18.67 && colors.weight >= 700, "White/red badge uses readable large bold text");
    assert.equal(colors.old, "rgb(113, 128, 150)");
    assert.equal(colors.strike, "rgb(255, 0, 0)");
    assert.equal(colors.strikeLine, "line-through");
    assert.ok(colors.buttonRadius >= 24 && colors.selectRadius >= 20 && colors.careRadius >= 28);
    checks.push("Figma red discount and strike, muted old price, rounded controls and care panel");

    const photo = await page.$eval("#product-photo", (element) =>
    {
      const bounds = element.getBoundingClientRect();
      return { x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height };
    });
    await page.mouse.move(photo.x + photo.width * 0.5, photo.y + photo.height * 0.5);
    await page.waitForFunction(() => getComputedStyle(document.getElementById("product-main-image")).transform.startsWith("matrix(1.9"));
    assert.equal(await page.$eval(".product-zoom-label", (element) => getComputedStyle(element).display), "none");
    const firstOrigin = await page.$eval("#product-main-image", (element) => element.style.transformOrigin);
    await page.mouse.move(photo.x + photo.width * 0.8, photo.y + photo.height * 0.7);
    const secondOrigin = await page.$eval("#product-main-image", (element) => element.style.transformOrigin);
    assert.notEqual(firstOrigin, secondOrigin);
    await capture("desktop-hover-zoom");
    await page.mouse.move(0, 0);
    await page.waitForFunction(() => !document.getElementById("product-photo").classList.contains("is-hover-zoom"));
    await page.focus("[data-product-zoom]");
    await page.keyboard.press("Tab");
    await page.keyboard.down("Shift");
    await page.keyboard.press("Tab");
    await page.keyboard.up("Shift");
    assert.equal(await page.$eval(".product-zoom-label", (element) => getComputedStyle(element).display), "block");
    await capture("desktop-zoom-keyboard");
    await page.keyboard.press("Enter");
    await page.waitForSelector("#home-dialog[open]");
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.activeElement.hasAttribute("data-product-zoom")), true);
    checks.push("Desktop auto hover zoom tracks pointer, exits cleanly, hides mouse hint and retains keyboard dialog access");

    for (const width of [390, 320])
    {
      await open(width, "normal", true);
      const mobile = await page.evaluate(() =>
      {
        const bounds = (selector) => document.querySelector(selector).getBoundingClientRect();
        const actions = bounds(".product-actions");
        const thumbnails = [...document.querySelectorAll(".product-thumbnail")].map((element) => element.getBoundingClientRect());
        const title = bounds("#product-title");
        return { bottom: actions.bottom, viewport: innerHeight, fixed: getComputedStyle(document.querySelector(".product-actions")).position,
          thumbsSameRow: thumbnails.every((item) => Math.abs(item.top - thumbnails[0].top) < 1),
          titleVisible: title.bottom <= actions.top, pad: parseFloat(getComputedStyle(document.body).paddingBottom),
          barHeight: actions.height, overflow: document.documentElement.scrollWidth > innerWidth,
          addHeight: bounds("#product-add").height, buyHeight: bounds("#product-buy").height,
          zoomLabelVisible: getComputedStyle(document.querySelector(".product-zoom-label")).display !== "none" };
      });
      assert.equal(mobile.fixed, "fixed");
      assert.ok(Math.abs(mobile.bottom - mobile.viewport) <= 1);
      assert.equal(mobile.thumbsSameRow, true);
      assert.equal(mobile.titleVisible, true, "Product title appears before the fixed bar at " + width);
      assert.ok(mobile.pad >= mobile.barHeight - 1);
      assert.equal(mobile.overflow, false);
      assert.equal(mobile.addHeight, 48);
      assert.equal(mobile.buyHeight, 48);
      assert.equal(mobile.zoomLabelVisible, true);
      await capture("mobile-" + width);
      await capture("mobile-full-" + width, true);
      await page.tap("[data-product-zoom]");
      await page.waitForSelector("#home-dialog[open]");
      await page.tap("[data-home-close]");
      await page.waitForFunction(() => !document.getElementById("home-dialog").open);
      await page.$eval("#product-quantity", (element) =>
      {
        element.scrollIntoView({ block: "center" });
        element.value = "3";
        element.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await page.tap("#product-add");
      await page.waitForFunction(() => document.getElementById("product-feedback").textContent.includes("ditambahkan ke keranjang"));
      await settle();
      assert.match(await page.$eval("#product-subtotal", (element) => element.textContent), /867.000/);
      assert.equal(await page.$eval(".storefront-cart-count", (element) => element.textContent), "3");
      assert.notEqual(await page.$eval(".product-add-label-mobile", (element) => getComputedStyle(element).display), "none");
      await capture("mobile-feedback-" + width);
      await page.tap("[data-product-dismiss]");
      await page.waitForFunction(() => document.getElementById("product-feedback").hidden);
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await settle();
      const footerVisible = await page.evaluate(() =>
        document.querySelector(".storefront-copyright").getBoundingClientRect().bottom
        <= document.querySelector(".product-actions").getBoundingClientRect().top + 1);
      assert.equal(footerVisible, true, "Footer remains reachable above purchase bar");
      await capture("mobile-footer-" + width);
    }
    checks.push("Touch mobile 390/320: horizontal gallery, visible title, retained zoom button/dialog and fixed rounded 48px purchase bar");
    checks.push("Mobile cart quantity/subtotal, restored button markup, dismissible feedback, dynamic safe space and unobscured footer");

    await open(390, "outOfStock", true);
    assert.equal(await page.$eval("#product-add", (element) => element.disabled), true);
    assert.equal(await page.$eval("#product-buy", (element) => element.disabled), true);
    await capture("mobile-out-of-stock");
    await open(390, "longContent", true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await capture("mobile-long-content", true);
    await open(390, "brokenImage", true);
    await page.waitForSelector(".product-image-error:not([hidden])");
    await capture("mobile-image-failure");
    checks.push("Mobile fixed actions preserve unavailable, long-content and image-error states");

    await open(1440);
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    assert.equal(await page.$eval("#product-main-image", (element) => getComputedStyle(element).transitionDuration), "0s");
    await page.mouse.move(photo.x + photo.width / 2, photo.y + photo.height / 2);
    await page.waitForFunction(() => getComputedStyle(document.getElementById("product-main-image")).transform.startsWith("matrix(1.9"));
    await page.setViewport({ width: 390, height: 844 });
    await page.waitForFunction(() => !document.getElementById("product-photo").classList.contains("is-hover-zoom"));
    assert.equal(await page.$eval("#product-main-image", (element) => getComputedStyle(element).transform), "none");
    checks.push("Reduced motion uses instant zoom and changing to mobile clears desktop hover zoom");

    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(outputDirectory, "verification.json"), JSON.stringify({ checks, errors }, null, 2));
    console.log(JSON.stringify({ passed: checks.length, checks, errors }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyRedesign().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
