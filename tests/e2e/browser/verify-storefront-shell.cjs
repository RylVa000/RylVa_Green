"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

const PREVIEW_URL = process.env.RYLVA_PAYMENT_PREVIEW_URL || "http://127.0.0.1:4180/pages/customer/payment.html";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/payment-shell");

async function verifyStorefrontShell()
{
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  const browser = await puppeteer.launch(
  {
    executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true,
    timeout: 20000
  });
  const browserErrors = [];
  const checks = [];

  try
  {
    const page = await browser.newPage();
    page.on("pageerror", (error) =>
    {
      browserErrors.push(error.message);
    });
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(PREVIEW_URL, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForSelector("#payment-status-title");

    const referenceGeometry = await page.evaluate(() =>
    {
      function geometry(selector)
      {
        const bounds = document.querySelector(selector).getBoundingClientRect();
        return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
      }
      const footerBounds = document.querySelector(".storefront-footer").getBoundingClientRect();
      const footerLogo = geometry(".storefront-footer-logo img");
      return {
        utility: geometry(".storefront-utility"),
        main: geometry(".storefront-main"),
        categories: geometry(".storefront-categories"),
        search: geometry(".storefront-search"),
        navbarLogo: geometry(".storefront-logo img"),
        footerHeight: footerBounds.height,
        footerLogo: { ...footerLogo, y: footerLogo.y - footerBounds.y },
        headerColor: getComputedStyle(document.querySelector(".storefront-main")).backgroundColor,
        footerColor: getComputedStyle(document.querySelector(".storefront-footer")).backgroundColor,
        headingFont: getComputedStyle(document.getElementById("footer-explore")).fontFamily,
        interLoaded: Array.from(document.fonts).some((font) =>
        {
          return font.family.replace(/"/g, "") === "Inter" && font.status === "loaded";
        })
      };
    });

    function near(actual, expected, label)
    {
      assert.ok(Math.abs(actual - expected) <= 1, label + ": " + actual + " expected " + expected);
    }

    near(referenceGeometry.utility.height, 36, "Utility bar");
    near(referenceGeometry.main.height, 88, "Compact main navigation");
    near(referenceGeometry.categories.height, 52, "Category navigation");
    near(referenceGeometry.search.x, 401.5, "Search position");
    near(referenceGeometry.search.width, 960, "Search width");
    near(referenceGeometry.search.height, 52, "Search height");
    near(referenceGeometry.navbarLogo.x, 102, "Original navbar logo position");
    near(referenceGeometry.navbarLogo.width, 162, "Original navbar logo width");
    near(referenceGeometry.navbarLogo.height, 36.7138, "Original navbar logo height");
    assert.ok(referenceGeometry.footerHeight <= 220, "Compact desktop footer height");
    near(referenceGeometry.footerLogo.x, 102, "Original footer logo position");
    near(referenceGeometry.footerLogo.y, 16, "Compact footer logo top");
    near(referenceGeometry.footerLogo.width, 152, "Compact footer logo width");
    assert.ok(Math.abs(referenceGeometry.footerLogo.width / referenceGeometry.footerLogo.height - 203 / 61) < 0.02);
    assert.equal(referenceGeometry.headerColor, "rgb(107, 144, 113)");
    assert.equal(referenceGeometry.footerColor, "rgb(107, 144, 113)");
    assert.equal(referenceGeometry.interLoaded, true);
    assert.match(referenceGeometry.headingFont, /Inter/);
    checks.push("User-requested compact geometry preserves Figma colors, logo aspect and footer heading font at 1920px");

    const assets = await page.$$eval(".storefront-shell img", (images) =>
    {
      return images.map((image) =>
      {
        const bounds = image.getBoundingClientRect();
        return {
          file: image.getAttribute("src").split("/").pop(),
          loaded: image.complete && image.naturalWidth > 0,
          width: bounds.width,
          height: bounds.height
        };
      });
    });
    assert.equal(assets.length, 11);
    assert.ok(assets.every((asset) => asset.loaded));
    for (const asset of assets)
    {
      const localPath = path.resolve("public/assets/images/storefront", asset.file);
      assert.ok(fs.statSync(localPath).size > 0);
      const svgRoot = fs.readFileSync(localPath, "utf8").match(/<svg\b[^>]*>/)[0];
      const rootWidth = Number(svgRoot.match(/\bwidth="([^"]+)"/)[1]);
      const rootHeight = Number(svgRoot.match(/\bheight="([^"]+)"/)[1]);
      assert.ok(Math.abs(asset.width / asset.height - rootWidth / rootHeight) < 0.02, asset.file + " original aspect ratio");
    }
    const socialSlots = await page.$$eval(".storefront-social-links img", (images) =>
    {
      const footerTop = document.querySelector(".storefront-footer").getBoundingClientRect().top;
      return images.map((image) =>
      {
        const bounds = image.getBoundingClientRect();
        return { x: bounds.x, y: bounds.y - footerTop };
      });
    });
    near(socialSlots[0].x, socialSlots[2].x, "First social column alignment");
    near(socialSlots[1].x, socialSlots[3].x, "Second social column alignment");
    assert.ok(socialSlots[2].y > socialSlots[0].y);
    checks.push("All 11 original Figma SVGs are loaded and preserve aspect ratio");

    await page.$eval(".storefront-header", (element) => element.scrollIntoView());
    await (await page.$(".storefront-header")).screenshot(
      { path: path.join(OUTPUT_DIRECTORY, "navbar-1920.png") }
    );
    await (await page.$(".storefront-footer")).screenshot(
      { path: path.join(OUTPUT_DIRECTORY, "footer-1920.png") }
    );
    const categoryLabels = await page.$$eval(".storefront-category-links button", (buttons) =>
    {
      return buttons.map((button) => button.textContent.replace(/\s+/g, " ").trim());
    });
    assert.equal(categoryLabels.length, 9);
    assert.match(categoryLabels.join(" "), /Promo Spesial HOT.*Buket Kustom.*Pupuk & Nutrisi/);
    assert.deepEqual(await page.$$eval(".storefront-footer h2", (headings) =>
    {
      return headings.map((heading) => heading.textContent);
    }), ["Jelajahi RylVa", "Bantuan RylVa", "Informasi RylVa", "Kontak RylVa"]);
    checks.push("All original category and footer groups remain present");

    for (const width of [1920, 1440, 1280, 1024, 768, 390, 320])
    {
      await page.setViewport({ width, height: width < 600 ? 844 : 1000 });
      const layout = await page.evaluate(() =>
      {
        const viewportWidth = document.documentElement.clientWidth;
        const escaped = Array.from(document.querySelectorAll(
          ".storefront-main img, .storefront-footer button, .storefront-footer img, .storefront-search"
        )).filter((element) =>
        {
          const bounds = element.getBoundingClientRect();
          return bounds.left < -1 || bounds.right > viewportWidth + 1;
        }).map((element) => element.className || element.getAttribute("src"));
        return {
          pageOverflow: document.documentElement.scrollWidth > viewportWidth,
          escaped
        };
      });
      assert.equal(layout.pageOverflow, false, width + ": horizontal page overflow");
      assert.deepEqual(layout.escaped, [], width + ": shell content overflow");
      checks.push("Shell layout " + width + "px");
      if ([1440, 390].includes(width))
      {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot(
        {
          path: path.join(OUTPUT_DIRECTORY, "payment-" + width + ".png"),
          fullPage: true
        });
      }
    }

    const originalAmount = await page.$eval(".payment-amount", (element) => element.textContent);
    await page.type("#storefront-search-input", "Monstera");
    await page.click(".storefront-search-action");
    assert.equal(await page.$eval("#storefront-search-input", (element) => element.value), "Monstera");
    assert.match(await page.$eval("#storefront-preview-note", (element) => element.textContent), /Pencarian produk belum terhubung/);
    await page.click('[data-storefront-page="Tanaman Hias"]');
    assert.match(await page.$eval("#storefront-preview-note", (element) => element.textContent), /Tanaman Hias belum terhubung/);
    assert.equal(await page.$eval(".payment-amount", (element) => element.textContent), originalAmount);
    assert.equal(page.url(), PREVIEW_URL);
    await page.$eval('[data-storefront-page="Hubungi Kami"]', (element) =>
    {
      const toggle = element.closest(".storefront-footer-column").querySelector(".storefront-footer-toggle");
      if (toggle.getAttribute("aria-expanded") === "false")
      {
        toggle.click();
      }
    });
    await page.click('[data-storefront-page="Hubungi Kami"]');
    assert.equal(await page.$eval("#storefront-footer-notice", (element) => element.hidden), false);
    assert.match(await page.$eval("#storefront-footer-notice", (element) => element.textContent), /Hubungi Kami belum terhubung/);
    checks.push("Unavailable preview destinations are explicit; search and payment context remain intact");
    assert.deepEqual(browserErrors, []);
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "verification.json"), JSON.stringify(
      { result: "PASS", referenceGeometry, assets, checks, browserErrors },
      null,
      2
    ));
    console.log(JSON.stringify({ result: "PASS", checks: checks.length, assets: assets.length, browserErrors }));
  }
  finally
  {
    await browser.close();
  }
}

verifyStorefrontShell().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
