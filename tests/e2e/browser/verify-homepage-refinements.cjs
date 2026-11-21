"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_HOME_URL || "http://127.0.0.1:4185";
const OUTPUT_DIRECTORY = path.resolve(process.env.RYLVA_HOME_REPORT_DIR || "storage/reports/homepage-card-spacing");

async function verifyRefinements()
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
  const checks = [];
  const cartTrigger = 'header [data-storefront-page="Keranjang"]';
  const accountTrigger = 'header [data-storefront-page="Akun"]';
  page.on("pageerror", (error) => errors.push(error.message));

  async function open(width = 1440)
  {
    await page.setViewport(
    {
      width,
      height: width < 600 ? 844 : 1080,
      isMobile: width <= 600,
      hasTouch: width <= 600
    });
    await page.goto(BASE_URL + "/pages/public/home.html", { waitUntil: "networkidle0" });
    await page.waitForSelector("#home-trending .home-product");
    await page.evaluate(async () =>
    {
      await document.fonts.ready;
      document.querySelectorAll("img").forEach((image) => image.loading = "eager");
      await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
    });
  }

  async function selectSlide(index)
  {
    await page.evaluate(async (nextIndex) => window.RylvaHomepageHero.select(nextIndex, true), index);
    await new Promise((resolve) => setTimeout(resolve, 700));
  }

  async function capture(name, fullPage = false)
  {
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, name + ".png"), fullPage });
  }

  try
  {
    await open(1920);
    const cardLayout = await page.$eval("#home-trending .home-product", (card) =>
    {
      const rect = card.getBoundingClientRect();
      const title = card.querySelector("h3").getBoundingClientRect();
      const badge = card.querySelector(".home-stock").getBoundingClientRect();
      return { ratio: rect.width / rect.height, headingDifference: Math.abs(title.top - badge.top) };
    });
    assert.ok(cardLayout.ratio > 1.5, "Product card is too tall compared with Figma");
    assert.ok(cardLayout.headingDifference < 8, "Stock label is separated from product heading");
    assert.match(await page.$eval('.home-product--calathea .home-stock', (node) => node.textContent), /Hampir Habis/);
    assert.equal(await page.$eval(".home-offer-kit .home-offer-badge", (node) => node.textContent), "HEMAT 25%");
    await capture("desktop", true);
    await page.$eval("#home-trending", (node) => node.scrollIntoView({ block: "center" }));
    await capture("product-cards");
    checks.push("Figma card proportions, stock/name alignment, price/favorite row, original promo labels");

    await page.evaluate(() => scrollTo(0, 0));
    const colors = [];
    for (const [index, theme] of [[0, "monstera"], [1, "calathea"], [2, "petunia"], [3, "marigold"]])
    {
      await selectSlide(index);
      assert.equal(await page.$eval(".home-hero", (node) => node.dataset.heroTheme), theme);
      colors.push(await page.$eval(".home-hero", (node) => getComputedStyle(node).backgroundColor));
      assert.equal(await page.$eval("#home-hero-image", (node) => Boolean(node.naturalWidth)), true);
      if (theme === "petunia")
      {
        await capture("hero-pink");
      }
      if (theme === "calathea")
      {
        await capture("hero-calathea");
      }
      if (theme === "marigold")
      {
        await capture("hero-marigold");
      }
    }
    assert.equal(new Set(colors).size, 4);
    await page.hover(".home-hero-art");
    await page.focus("#storefront-search-input");
    await page.waitForFunction(() => document.querySelector(".home-hero").dataset.autoplay === "playing");
    await page.waitForFunction(() => document.querySelector(".home-hero").dataset.heroTheme === "monstera", { timeout: 8500 });
    await page.click("#home-hero-playback");
    await page.focus("#storefront-search-input");
    await page.mouse.move(1, 1);
    await new Promise((resolve) => setTimeout(resolve, 6800));
    assert.equal(await page.$eval(".home-hero", (node) => node.dataset.heroTheme), "monstera");
    await page.click("#home-hero-playback");
    await page.waitForFunction(() => document.querySelector(".home-hero").dataset.autoplay === "playing");
    assert.equal(await page.evaluate(() => document.activeElement.id), "home-hero-playback");
    await page.waitForFunction(() => document.querySelector(".home-hero").dataset.heroTheme === "calathea", { timeout: 8500 });
    await page.click("#home-hero-playback");
    await selectSlide(0);
    checks.push("Four decoded slides switch image, palette and CTA; automatic 6.5s transition, pause, and Resume while still focused/hovered work");

    await page.hover(cartTrigger);
    await page.waitForSelector("#home-cart-panel:not([hidden]) .home-mini-cart-item");
    await page.hover("#home-cart-panel-title");
    await new Promise((resolve) => setTimeout(resolve, 350));
    assert.equal(await page.$eval("#home-cart-panel", (node) => node.hidden), false);
    assert.match(await page.$eval("#home-cart-panel-total", (node) => node.textContent), /Rp 364.000/);
    await capture("cart-hover");
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.activeElement.dataset.storefrontPage), "Keranjang");
    assert.equal(await page.$eval("#home-header-backdrop", (node) => node.hidden), true);
    await page.keyboard.press("ArrowDown");
    await page.waitForSelector("#home-cart-panel:not([hidden])");
    assert.equal(await page.evaluate(() => document.activeElement.closest("#home-cart-panel") !== null), true);
    await page.keyboard.press("Escape");
    await page.hover(accountTrigger);
    await page.waitForSelector("#home-account-panel:not([hidden])");
    assert.equal(await page.$$eval(".home-account-shortcuts a", (nodes) => nodes.length), 5);
    await capture("account-hover");
    await page.keyboard.press("Escape");
    checks.push("Cart/account hover overlays, pointer bridge, totals, available account routes, ArrowDown and Escape focus restoration");

    await page.click(cartTrigger);
    await page.waitForSelector("#home-cart-panel .home-mini-cart-item");
    await page.click("[data-header-remove]");
    await page.click("[data-header-cancel]");
    assert.equal(await page.$$("#home-cart-panel .home-mini-cart-item").then((nodes) => nodes.length), 2);
    await page.click("[data-header-remove]");
    await page.click("[data-header-confirm]");
    await page.waitForFunction(() => document.querySelectorAll("#home-cart-panel .home-mini-cart-item").length === 1);
    assert.match(await page.$eval("#home-cart-panel-feedback", (node) => node.textContent), /dihapus/);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("rylva-cart-preview-guest-v1")).items.length), 1);
    await page.keyboard.press("Escape");
    await page.$eval('.home-product--monstera [data-home-add]', (button) => button.click());
    await page.waitForFunction(() => document.getElementById("home-toast").textContent.includes("ditambahkan"));
    await page.evaluate(() => scrollTo(0, 0));
    await page.click(cartTrigger);
    await page.waitForFunction(() => document.querySelectorAll("#home-cart-panel .home-mini-cart-item").length === 2);
    await page.keyboard.press("Escape");
    checks.push("Removal cancellation, confirmed persistence, refreshed header count, and product-add synchronization");

    await page.focus('[data-home-save="monstera"]');
    await page.$eval('[data-home-save="monstera"]', (button) => button.click());
    assert.equal(await page.$eval('[data-home-save="monstera"]', (button) => button.getAttribute("aria-pressed")), "true");
    assert.equal(await page.$eval('[data-home-save="monstera"] svg', (icon) => getComputedStyle(icon).fill), "rgb(150, 63, 92)");
    assert.equal(await page.evaluate(() => document.activeElement.dataset.homeSave), "monstera");
    await page.$eval(".home-product--monstera", (card) =>
    {
      card.scrollIntoView({ block: "center" });
    });
    await capture("wishlist-filled");
    assert.equal(await page.$("#home-toast a[href='/pages/customer/cart.html']"), null);
    await page.click("#home-toast [data-home-collection=saved]");
    await page.waitForFunction(() => document.getElementById("wishlist-products")?.getAttribute("aria-busy") === "false");
    assert.equal(await page.$$("#wishlist-products .home-product").then((nodes) => nodes.length), 1);
    await open();
    await page.click('header [data-storefront-page="Wishlist"]');
    await page.waitForSelector("#home-wishlist-panel:not([hidden])");
    assert.equal(await page.$$("#home-wishlist-panel article").then((nodes) => nodes.length), 1);
    await page.keyboard.press("Escape");
    await page.evaluate(() => sessionStorage.setItem("rylva-account-preview-access-v1", "signed-out"));
    await page.click(accountTrigger);
    assert.equal(await page.$$eval(".home-account-auth-actions a", (nodes) => nodes.map((node) => node.textContent.trim())).then((labels) => labels.join(",")), "Masuk,Daftar");
    await capture("account-signed-out");
    await page.keyboard.press("Escape");
    await page.evaluate(() => sessionStorage.removeItem("rylva-account-preview-access-v1"));
    checks.push("Shared Wishlist and hover preview are linked; signed-out account panel provides login/register");

    for (const width of [1440, 1366, 1024, 768, 390, 320])
    {
      await open(width);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const layout = await page.evaluate(() =>
      {
        const cards = [...document.querySelectorAll("#home-trending .home-product")];
        const favorite = cards[0].querySelector("[data-home-save]").getBoundingClientRect();
        const cart = cards[0].querySelector("[data-home-add]").getBoundingClientRect();
        const picture = cards[0].querySelector(".home-product-picture").getBoundingClientRect();
        const stock = cards[0].querySelector(".home-stock").getBoundingClientRect();
        const price = cards[0].querySelector(".home-price");
        const priceRange = document.createRange();
        priceRange.selectNodeContents(price.firstChild);
        const priceText = priceRange.getBoundingClientRect();
        const unit = price.querySelector("small").getBoundingClientRect();
        const oldPrice = cards[0].querySelector("del");
        const heading = cards[0].querySelector("h3");
        const detail = cards[0].querySelector("[data-home-detail]").getBoundingClientRect();
        const card = cards[0].getBoundingClientRect();
        const heroImage = document.querySelector(".home-hero-art").getBoundingClientRect();
        const heroAction = document.querySelector(".home-hero [data-home-collection]").getBoundingClientRect();
        const heroBrand = document.querySelector(".home-hero-brand").getBoundingClientRect();
        const playback = document.getElementById("home-hero-playback").getBoundingClientRect();
        const pagination = document.querySelector(".home-hero-pagination").getBoundingClientRect();
        const hero = document.querySelector(".home-hero").getBoundingClientRect();
        const offers = document.querySelector(".home-offers");
        return {
          favoriteSize: [favorite.width, favorite.height],
          centerDifference: Math.abs((favorite.left + favorite.width / 2) - (cart.left + cart.width / 2)),
          actionRowDifference: Math.abs(favorite.top - cart.top),
          desktopActionCenterDifference: Math.abs(favorite.top + favorite.height / 2 - cart.top - cart.height / 2),
          desktopActionGap: cart.left - favorite.right,
          cardDetailCoverage: Math.abs(detail.width - card.width) < 1 && Math.abs(detail.height - card.height) < 1,
          stockOverPhoto: stock.top >= picture.top && stock.top < picture.top + 20 && stock.right <= picture.right,
          stockHeadingDifference: Math.abs(stock.top - heading.getBoundingClientRect().top),
          splitProductWord: cards.some((product) =>
          {
            const text = product.querySelector("h3").firstChild;
            return [...text.textContent.matchAll(/\S+/g)].some((word) =>
            {
              const wordRange = document.createRange();
              wordRange.setStart(text, word.index);
              wordRange.setEnd(text, word.index + word[0].length);
              return wordRange.getClientRects().length > 1;
            });
          }),
          unitSameLine: unit.left >= priceText.right - 1 && Math.abs(unit.bottom - priceText.bottom) < 5,
          nameSize: parseFloat(getComputedStyle(heading).fontSize),
          priceWeight: getComputedStyle(price).fontWeight,
          strikeColor: getComputedStyle(oldPrice).textDecorationColor,
          categoryWrapped: [...document.querySelectorAll(".home-category-title, .home-category-subtitle")].some((label) =>
          {
            if (!label.getClientRects().length)
            {
              return false;
            }
            const labelRange = document.createRange();
            labelRange.selectNodeContents(label);
            return labelRange.getClientRects().length > 1 || label.scrollWidth > label.clientWidth + 1;
          }),
          firstTop: cards[0].getBoundingClientRect().top,
          secondTop: cards[1].getBoundingClientRect().top,
          firstLeft: cards[0].getBoundingClientRect().left,
          secondLeft: cards[1].getBoundingClientRect().left,
          photoBeforeAction: heroImage.bottom <= heroAction.top,
          heroActionWidthDifference: Math.abs(heroImage.width - heroAction.width),
          heroActionLeftDifference: Math.abs(heroImage.left - heroAction.left),
          heroActionHeight: heroAction.height,
          playbackBrandDifference: Math.abs(playback.top + playback.height / 2 - heroBrand.top - heroBrand.height / 2),
          paginationCenterDifference: Math.abs(pagination.left + pagination.width / 2 - hero.left - hero.width / 2),
          paginationActionGap: pagination.top + 15 - heroAction.bottom,
          offerHeight: Math.max(...[...offers.children].map((card) => card.getBoundingClientRect().height)),
          offersScrollable: offers.scrollWidth > offers.clientWidth
        };
      });
      assert.deepEqual(layout.favoriteSize, width <= 600 ? [44, 44] : [36, 36]);
      assert.equal(layout.priceWeight, "700");
      assert.equal(layout.strikeColor, "rgb(181, 43, 34)");
      assert.equal(layout.categoryWrapped, false, "Category labels must stay on one line at " + width);
      assert.ok(layout.nameSize >= 17);
      assert.equal(layout.splitProductWord, false, "Known product names must wrap between words at " + width);
      if (width <= 600)
      {
        assert.ok(layout.actionRowDifference < 1, "Mobile wishlist/cart must share one action row");
        assert.equal(layout.cardDetailCoverage, true);
        assert.equal(layout.stockOverPhoto, true);
        assert.equal(layout.unitSameLine, true, "Price and unit must remain on the same line");
        assert.ok(Math.abs(layout.firstTop - layout.secondTop) < 1, "Mobile must show two products in a row");
        assert.ok(layout.secondLeft > layout.firstLeft);
        assert.ok(layout.photoBeforeAction, "Mobile hero image must appear before its button");
        assert.ok(layout.heroActionWidthDifference < 1 && layout.heroActionLeftDifference < 1, "Hero CTA must align with the image container");
        assert.ok(layout.heroActionHeight >= 48);
        assert.ok(layout.playbackBrandDifference < 3, "Pause must align with the top logo row");
        assert.ok(layout.paginationCenterDifference < 1);
        assert.ok(Math.abs(layout.paginationActionGap - 20) < 1);
        assert.ok(layout.offerHeight < 280, "Mobile promotions must remain compact");
        assert.ok(layout.offersScrollable);
      }
      else
      {
        assert.ok(layout.desktopActionCenterDifference < 1, "Desktop actions must align in the bottom row at " + width);
        assert.ok(layout.desktopActionGap >= 8 && layout.desktopActionGap <= 10);
        assert.ok(layout.stockHeadingDifference < 8, "Desktop status must stay beside the heading");
      }
      await capture("layout-" + width, true);
      await page.click(cartTrigger);
      await page.waitForSelector("#home-cart-panel:not([hidden]) .home-mini-cart-item");
      const bounds = await page.$eval("#home-cart-panel", (node) =>
      {
        const rect = node.getBoundingClientRect();
        return { left: rect.left, right: rect.right, bottom: rect.bottom };
      });
      assert.ok(bounds.left >= 0 && bounds.right <= width && bounds.bottom <= (width < 600 ? 844 : 1080));
      if (width === 390)
      {
        await capture("cart-mobile");
      }
      await page.keyboard.press("Escape");
    }
    await open(390);
    await (await page.$(".home-product--monstera .home-product-picture")).tap();
    await page.waitForSelector("#product-title");
    assert.match(await page.$eval("#product-title", (node) => node.textContent), /Monstera/);
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-home-save="monstera"]');
    await page.waitForFunction(() =>
    {
      const control = document.querySelector('[data-home-save="monstera"]');
      return window.RylvaWishlistStore.snapshot().status === "ready" && !control.disabled;
    });
    const wasSaved = await page.$eval('[data-home-save="monstera"]', (node) => node.getAttribute("aria-pressed"));
    const expectedSaved = wasSaved === "true" ? "false" : "true";
    await (await page.$('[data-home-save="monstera"]')).tap();
    await page.waitForFunction((expected) =>
      document.querySelector('[data-home-save="monstera"]').getAttribute("aria-pressed") === expected,
    {}, expectedSaved);
    assert.equal(await page.$eval("#home-dialog", (node) => node.open), false);
    assert.equal(await page.$eval('[data-home-save="monstera"]', (node) => node.getAttribute("aria-pressed")), expectedSaved);
    await (await page.$('.home-product--monstera [data-home-add]')).tap();
    await page.waitForFunction(() => document.getElementById("home-toast").textContent.includes("ditambahkan"));
    assert.equal(await page.$eval("#home-dialog", (node) => node.open), false);
    await page.focus('[data-home-detail="monstera"]');
    await page.keyboard.press("Enter");
    await page.waitForSelector("#product-title");
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("#home-trending .home-product");
    await page.$eval("#home-trending", (node) => node.scrollIntoView({ block: "start" }));
    await capture("mobile-products");
    await page.evaluate(() => scrollTo(0, 0));
    checks.push("Typography, red sale strikes, single-line categories and mobile prices; whole-card touch/keyboard detail with independent wishlist/cart controls");
    await page.focus("#storefront-search-input");
    await page.hover(".home-hero-art");
    await page.waitForFunction(() => document.querySelector(".home-hero").dataset.autoplay === "playing");
    await page.waitForFunction(() => document.querySelector(".home-hero").dataset.heroTheme !== "monstera", { timeout: 8500 });
    checks.push("Filled wishlist, desktop 36px/mobile 44px controls, compact promotion rail, two-column mobile products, image-before-CTA, and mobile autoplay");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await open(390);
    assert.equal(await page.$eval(".home-hero", (node) => node.dataset.autoplay), "paused");
    await selectSlide(2);
    assert.equal(await page.$eval(".home-hero", (node) => node.dataset.heroTheme), "petunia");
    await capture("hero-pink-mobile", true);
    await page.setOfflineMode(true);
    await page.click(cartTrigger);
    await page.waitForFunction(() => document.getElementById("home-cart-panel-body").textContent.includes("belum dapat dimuat"));
    await page.setOfflineMode(false);
    await page.click("[data-header-retry]");
    await page.waitForSelector("#home-cart-panel .home-mini-cart-item");
    await page.keyboard.press("Escape");
    checks.push("Tablet/mobile panels stay within viewport; reduced motion stops autoplay but keeps manual selection; offline recovery works");
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "verification.json"), JSON.stringify({ checks, errors }, null, 2));
    console.log(JSON.stringify({ checks, errors }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyRefinements().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
