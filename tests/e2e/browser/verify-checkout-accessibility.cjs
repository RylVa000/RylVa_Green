"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_CHECKOUT_URL || "http://127.0.0.1:4182/pages/customer/checkout.html";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/checkout");

async function verifyAccessibility()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true
  });
  const page = await browser.newPage();
  const checks = [];
  let mapResult = null;
  try
  {
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(BASE_URL + "?preview=checkout&state=normal");
    await page.waitForSelector("#checkout-summary");
    await page.evaluate(() => document.fonts.ready);
    const assets = await page.evaluate(() =>
    {
      const controls = [...document.querySelectorAll("main button, main input, main textarea, main select")];
      return {
        font: getComputedStyle(document.body).fontFamily,
        missingImages: [...document.querySelectorAll("main img")].filter((element) => !element.complete || !element.naturalWidth).map((element) => element.src),
        missingIcons: [...document.querySelectorAll("main svg use")].filter((element) => !document.getElementById(element.getAttribute("href").slice(1))).length,
        unnamedControls: controls.filter((element) => !element.textContent.trim() && !element.getAttribute("aria-label")
          && !element.labels?.length).map((element) => element.id),
        positiveTabindex: document.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])').length
      };
    });
    assert.match(assets.font, /Poppins/i);
    assert.deepEqual(assets.missingImages, []);
    assert.equal(assets.missingIcons, 0);
    assert.deepEqual(assets.unnamedControls, []);
    assert.equal(assets.positiveTabindex, 0);
    checks.push("Poppins, local assets/icons and accessible control names");

    await page.click('[data-checkout-action="address"]');
    await page.waitForSelector("#address-search");
    for (let index = 0; index < 18; index += 1)
    {
      await page.keyboard.press("Tab");
      assert.equal(await page.evaluate(() => document.getElementById("checkout-dialog").contains(document.activeElement)), true);
    }
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.activeElement.dataset.checkoutAction), "address");
    checks.push("native dialog focus trap, Escape and focus return");

    await page.setViewport({ width: 375, height: 812 });
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.click('[data-checkout-action="address"]');
    await page.click('[data-address-action="edit"]');
    await page.evaluate(() =>
    {
      const dialog = document.getElementById("checkout-dialog");
      dialog.scrollTop = dialog.scrollHeight;
    });
    const mobileDialog = await page.$eval(".checkout-save-address", (element) =>
    {
      const rect = element.getBoundingClientRect();
      return { visible: rect.top >= 0 && rect.bottom <= innerHeight, height: rect.height };
    });
    assert.equal(mobileDialog.visible, true);
    assert.ok(mobileDialog.height >= 44);
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "mobile-address-bottom.png") });
    checks.push("mobile modal scroll reaches save without clipped action");
    await page.keyboard.press("Escape");

    await page.setViewport({ width: 667, height: 375 });
    const overflowing = await page.evaluate(() =>
    {
      return [...document.querySelectorAll("main section, main aside")].some((element) => element.getBoundingClientRect().right > innerWidth + 1);
    });
    assert.equal(overflowing, false);
    assert.equal(await page.$eval("#checkout-submit", (element) => getComputedStyle(element).transitionDuration), "0s");
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "landscape.png"), fullPage: true });
    checks.push("phone landscape and reduced motion");

    await page.setViewport({ width: 1280, height: 900 });
    await page.click('[data-checkout-action="address"]');
    await page.click('[data-address-action="edit"]');
    await page.click('[data-address-action="map"]');
    await page.waitForFunction(() => document.querySelector(".leaflet-tile-loaded")
      || document.querySelector("#address-administrative:not([hidden])"), { timeout: 16000 });
    mapResult = await page.evaluate(() =>
    {
      return document.querySelector(".leaflet-tile-loaded") ? "Leaflet and OSM tiles rendered"
        : "Provider unavailable; manual fallback rendered";
    });
    if (mapResult.startsWith("Leaflet"))
    {
      await page.waitForFunction(() =>
      {
        const tiles = [...document.querySelectorAll("#checkout-location-map .leaflet-tile")];
        return tiles.length > 1 && tiles.every((tile) => tile.complete && tile.naturalWidth > 0);
      }, { timeout: 12000 });
    }
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "map-provider.png") });
    checks.push(mapResult);

    await page.setJavaScriptEnabled(false);
    await page.goto(BASE_URL);
    assert.match(await page.$eval("main", (element) => element.textContent), /Checkout memerlukan JavaScript/);
    checks.push("noscript path explains recovery without a fake submit");
    await page.setJavaScriptEnabled(true);
    await page.goto(new URL("/__preview/checkout", BASE_URL).href);
    await page.waitForSelector("#checkout-state-links a");
    const stateCount = await page.$$eval("#checkout-state-links a", (elements) => elements.length);
    assert.ok(stateCount > 50);
    checks.push("development workbench is separate and lists " + stateCount + " states");
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "accessibility.json"), JSON.stringify({ checks, assets, mobileDialog, mapResult }, null, 2));
    console.log(JSON.stringify({ checks, assets, mobileDialog, mapResult }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyAccessibility().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
