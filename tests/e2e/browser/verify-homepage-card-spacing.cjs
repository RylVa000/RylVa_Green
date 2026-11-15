"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_HOME_URL || "http://127.0.0.1:4185";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/homepage-card-spacing");

async function verifyCardSpacing()
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

  async function open(route, width)
  {
    await page.setViewport(
    {
      width,
      height: width <= 600 ? 844 : 1080,
      isMobile: width <= 600,
      hasTouch: width <= 600
    });
    await page.goto(BASE_URL + route, { waitUntil: "networkidle0" });
    await page.evaluate(async () =>
    {
      await document.fonts.ready;
      document.querySelectorAll("img").forEach((image) => image.loading = "eager");
      await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
    });
  }

  async function badgeGeometry(text)
  {
    return page.$eval('header [data-storefront-page="Keranjang"]', (button, nextText) =>
    {
      const badge = button.querySelector(".storefront-cart-count");
      if (nextText)
      {
        badge.textContent = nextText;
      }
      const badgeRect = badge.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const iconRect = button.querySelector("img").getBoundingClientRect();
      return {
        inside: badgeRect.top >= buttonRect.top && badgeRect.left >= buttonRect.left
          && badgeRect.right <= buttonRect.right && badgeRect.bottom <= buttonRect.bottom,
        overlapsIcon: badgeRect.bottom > iconRect.top && badgeRect.left < iconRect.right
          && badgeRect.top < iconRect.bottom && badgeRect.right > iconRect.left
      };
    }, text);
  }

  try
  {
    for (const width of [1920, 1440, 1366, 1024, 768, 390, 360, 320])
    {
      await open("/pages/public/home.html", width);
      await page.waitForSelector("#home-recommendations .home-product");
      const cards = await page.$$eval("#home-recommendations .home-product", (elements) =>
      {
        return elements.map((card) =>
        {
          const box = card.getBoundingClientRect();
          const heading = card.querySelector("h3");
          const headingBox = heading.getBoundingClientRect();
          const headingArea = card.querySelector(".home-product-heading").getBoundingClientRect();
          const photo = card.querySelector(".home-product-picture").getBoundingClientRect();
          const slot = card.querySelector(".home-original-price-slot").getBoundingClientRect();
          const price = card.querySelector(".home-price").getBoundingClientRect();
          const actions = card.querySelector(".home-product-actions");
          const actionBox = actions.getBoundingClientRect();
          const favorite = card.querySelector("[data-home-save]").getBoundingClientRect();
          const cart = card.querySelector("[data-home-add]").getBoundingClientRect();
          const oldPrice = card.querySelector("del");
          const detailLabel = card.querySelector("[data-home-detail] > span");
          const detailRange = document.createRange();
          detailRange.selectNodeContents(detailLabel);
          return {
            name: heading.textContent,
            top: box.top,
            headingHeight: headingBox.height,
            maxHeadingHeight: parseFloat(getComputedStyle(heading).lineHeight) * 2,
            headingCentered: getComputedStyle(heading).textAlign === "center",
            photoBeforeTitle: photo.bottom <= headingBox.top,
            descriptionTop: card.querySelector(".home-product-description").getBoundingClientRect().top,
            titlePriceGap: slot.top - headingArea.bottom,
            oldPriceSize: oldPrice ? parseFloat(getComputedStyle(oldPrice).fontSize) : null,
            oldPriceSlotHeight: slot.height,
            priceTop: price.top,
            dividerTop: actionBox.top,
            priceDividerGap: actionBox.top - price.bottom,
            actionPaddingTop: parseFloat(getComputedStyle(actions).paddingTop),
            actionBottomGap: box.bottom - cart.bottom,
            actionGap: cart.left - favorite.right,
            actionCenterDifference: Math.abs(favorite.top + favorite.height / 2 - cart.top - cart.height / 2),
            contentOrder: headingBox.bottom <= slot.top && slot.bottom <= price.top && price.bottom <= actionBox.top,
            actionsFit: cart.right <= box.right && favorite.left >= box.left && cart.bottom <= box.bottom,
            detailLabelLines: new Set([...detailRange.getClientRects()].map((rect) => Math.round(rect.top))).size
          };
        });
      });
      for (const card of cards)
      {
        assert.ok(card.headingHeight <= card.maxHeadingHeight + 1);
        assert.equal(card.oldPriceSlotHeight, 18);
        assert.ok(card.oldPriceSize === null || card.oldPriceSize >= 12);
        assert.equal(card.contentOrder, true, card.name + " content order at " + width);
        assert.equal(card.actionsFit, true);
        assert.ok(card.actionCenterDifference < 1);
        if (width <= 600)
        {
          assert.equal(card.headingCentered, true);
          assert.equal(card.photoBeforeTitle, true);
          assert.ok(card.titlePriceGap >= 10 && card.titlePriceGap <= 12);
          assert.ok(card.priceDividerGap >= 10 && card.priceDividerGap <= 12);
          assert.ok(card.actionPaddingTop >= 10 && card.actionPaddingTop <= 12);
          assert.ok(card.actionBottomGap >= 10 && card.actionBottomGap <= 12);
        }
        else
        {
          assert.ok(card.actionGap >= 8 && card.actionGap <= 10);
          assert.equal(card.detailLabelLines, 1, "Detail label must fit on one line at " + width);
        }
      }
      for (const card of cards)
      {
        const row = cards.filter((other) => Math.abs(other.top - card.top) < 1);
        for (const peer of row)
        {
          assert.ok(Math.abs(peer.priceTop - card.priceTop) < 1, "Main prices must align at " + width);
          assert.ok(Math.abs(peer.dividerTop - card.dividerTop) < 1, "Dividers must align at " + width);
          if (width > 600)
          {
            assert.ok(Math.abs(peer.descriptionTop - card.descriptionTop) < 1, "Descriptions must align at " + width);
          }
        }
      }
      if (width <= 600)
      {
        assert.deepEqual(await badgeGeometry(), { inside: true, overlapsIcon: true });
        assert.deepEqual(await badgeGeometry("99+"), { inside: true, overlapsIcon: true });
        await badgeGeometry("2");
        await (await page.$("header")).screenshot({ path: path.join(OUTPUT_DIRECTORY, "header-" + width + ".png") });
      }
      await (await page.$("#home-recommendations")).screenshot({ path: path.join(OUTPUT_DIRECTORY, "recommendations-" + width + ".png") });
      measurements.push({ width, cards });
    }

    for (const state of ["longContent", "invalidPrice", "brokenImage", "partial"])
    {
      await open("/pages/public/home.html?preview=home&state=" + state, 320);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const fits = await page.$$eval(".home-main .home-product", (cards) => cards.every((card) =>
      {
        const price = card.querySelector(".home-price");
        const box = card.getBoundingClientRect();
        const cart = card.querySelector("[data-home-add]").getBoundingClientRect();
        return price.scrollWidth <= price.clientWidth + 1 && cart.right <= box.right && cart.bottom <= box.bottom;
      }));
      assert.equal(fits, true, state + " must remain usable at 320px");
    }

    for (const route of ["cart", "account", "my-orders"])
    {
      await open("/pages/customer/" + route + ".html", 390);
      assert.deepEqual(await badgeGeometry(), { inside: true, overlapsIcon: true });
      for (const area of ["header", "footer"])
      {
        const matchesSource = await page.$eval(area + " img[src*='logo-']", async (image) =>
        {
          const svg = new DOMParser().parseFromString(await (await fetch(image.src)).text(), "image/svg+xml");
          return svg.querySelector('[data-figma-logo="649:197"] [data-figma-botanical="649:199"]') !== null;
        });
        assert.equal(matchesSource, true, route + " " + area + " must serve the requested Figma botanical logo");
      }
      await (await page.$("header")).screenshot({ path: path.join(OUTPUT_DIRECTORY, route + "-header-mobile.png") });
    }
    assert.deepEqual(errors, []);
    const checks = [
      "Desktop descriptions align under two-line titles; action gap 8px; red original prices at least 12px",
      "Mobile centered titles; title/price gap 10px; reserved original-price rows align main prices and dividers; 10px action spacing",
      "Eight viewports 320–1920px and four mobile incomplete/extreme data states remain usable",
      "Mobile cart counts 2 and 99+ stay anchored to the icon; Figma logos and badge positioning verified on Cart, Account and My Orders"
    ];
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "spacing-verification.json"), JSON.stringify({ checks, errors, measurements }, null, 2));
    console.log(JSON.stringify({ checks, errors }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyCardSpacing().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
