"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("../../../tools/testing/browser-runtime.cjs");
const baseUrl = process.env.RYLVA_PRODUCT_DETAIL_URL || "http://127.0.0.1:4185";
const outputDirectory = path.resolve("storage/reports/product-detail");

async function verifyProductDetail()
{
  fs.mkdirSync(outputDirectory, { recursive: true });
  const browser = await runtime.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  const checks = [];
  page.on("pageerror", (error) => errors.push(error.message));

  async function open(state = "normal", width = 1440, extra = "")
  {
    await page.setViewport({ width, height: width < 768 ? 844 : 1000 });
    await page.goto(baseUrl + "/pages/public/product-detail.html?product=monstera&preview=product-detail&state=" + state + extra, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.getElementById("product-content").getAttribute("aria-busy") === "false");
  }

  async function input(selector, value)
  {
    await page.$eval(selector, (element, text) =>
    {
      element.value = text;
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);
  }

  async function capture(name)
  {
    await page.evaluate(async () =>
    {
      await document.fonts.ready;
      await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
    });
    await page.screenshot({ path: path.join(outputDirectory, name + ".png"), fullPage: true });
  }

  try
  {
    await open();
    assert.equal(await page.$eval("#product-title", (element) => element.textContent), "Monstera Deliciosa");
    assert.equal(await page.$$eval("#product-variant option", (items) => items.length), 1);
    assert.match(await page.$eval(".product-stock", (element) => element.textContent), /20 pot/);
    assert.match(await page.$eval(".product-discount", (element) => element.textContent), /17%/);
    const sizes = await page.evaluate(() =>
    {
      const heading = document.querySelector("h1");
      const section = document.querySelector(".product-summary h2");
      const photo = document.querySelector(".product-photo").getBoundingClientRect();
      const image = document.querySelector("#product-main-image").getBoundingClientRect();
      return { title: parseFloat(getComputedStyle(heading).fontSize), section: parseFloat(getComputedStyle(section).fontSize), photoHeight: photo.height, imageHeight: image.height,
        favoriteColor: getComputedStyle(document.querySelector(".product-favorite")).color };
    });
    assert.ok(sizes.title > sizes.section && sizes.title <= 36);
    assert.ok(sizes.imageHeight <= sizes.photoHeight, "Gallery image fits its frame");
    assert.notEqual(sizes.favoriteColor, "rgb(255, 255, 255)");
    await capture("desktop-1440");
    await page.focus("[data-product-zoom]");
    const focusOffset = await page.$eval("[data-product-zoom]", (element) => getComputedStyle(element).outlineOffset);
    assert.ok(parseFloat(focusOffset) < 0, "Zoom focus is drawn inside the clipped photo frame");
    await capture("gallery-keyboard-focus");
    checks.push("Figma layout, smaller type hierarchy, correct fixture stock/discount and contained gallery");

    await page.click('[data-product-image="1"]');
    assert.equal(await page.$eval('[data-product-image="1"]', (element) => element.getAttribute("aria-pressed")), "true");
    await page.click("[data-product-zoom]");
    await page.waitForSelector("#home-dialog[open]");
    assert.equal(await page.evaluate(() => document.activeElement.id), "home-dialog-title");
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.hasAttribute("data-home-close")), true);
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.activeElement.hasAttribute("data-product-zoom")), true);
    await page.click(".product-care details:nth-of-type(3) summary");
    assert.equal(await page.$eval(".product-care details:nth-of-type(3)", (element) => element.open), true);
    assert.match(await page.$eval(".product-care details:nth-of-type(3)", (element) => element.textContent), /beracun/);
    checks.push("Thumbnail selection, zoom dialog keyboard/escape/focus return, native care accordion and sourced pet safety");

    await page.click("[data-product-save]");
    assert.equal(await page.$eval("[data-product-save]", (element) => element.getAttribute("aria-pressed")), "true");
    await page.click('header [data-storefront-page="Wishlist"]');
    await page.waitForSelector("#home-wishlist-panel:not([hidden])");
    await page.click("[data-header-wishlist-all]");
    await page.waitForFunction(() => document.getElementById("wishlist-products")?.getAttribute("aria-busy") === "false");
    assert.equal(await page.$eval('[data-home-save="monstera"]', (element) => element.getAttribute("aria-pressed")), "true");
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("#product-quantity");
    checks.push("Shared Wishlist destination and persistent membership from Product Detail");

    await input("#product-quantity", "0");
    assert.equal(await page.$eval("#product-add", (element) => element.disabled), true);
    assert.equal(await page.$eval("#product-quantity", (element) => element.getAttribute("aria-invalid")), "true");
    await input("#product-quantity", "1.5");
    assert.equal(await page.$eval("#product-buy", (element) => element.disabled), true);
    await input("#product-quantity", "21");
    assert.equal(await page.$eval("#product-buy", (element) => element.disabled), true);
    await input("#product-quantity", "3");
    assert.match(await page.$eval("#product-subtotal", (element) => element.textContent), /867.000/);
    assert.match(page.url(), /qty=3/);
    await page.$eval("#product-add", (element) =>
    {
      element.click();
      element.click();
    });
    await page.waitForFunction(() => document.getElementById("product-feedback").textContent.includes("ditambahkan ke keranjang"));
    assert.equal(await page.$eval(".storefront-cart-count", (element) => element.textContent), "3");
    assert.equal(await page.evaluate(() => localStorage.getItem("rylva-cart-preview-guest-v1")), null);
    await input("#product-quantity", "20");
    assert.equal(await page.$eval("#product-add", (element) => element.disabled), true);
    assert.equal(await page.$eval("#product-buy", (element) => element.disabled), false);
    checks.push("Quantity validation/subtotal, URL choice state, duplicate prevention, aggregate cart limit and workbench isolation");

    await page.click('#product-shipping button');
    assert.equal(await page.$eval("#product-postcode", (element) => element.getAttribute("aria-invalid")), "true");
    await input("#product-postcode", "40123");
    await page.click('#product-shipping button');
    await page.waitForFunction(() => !document.querySelector("#product-shipping button").disabled);
    assert.equal(await page.$$eval(".product-shipping-services li", (items) => items.length), 3);
    assert.match(await page.$eval("#product-shipping-result", (element) => element.textContent), /Rp 15.000/);
    assert.match(await page.$eval("#product-shipping-result", (element) => element.textContent), /Tarif contoh/);
    assert.equal(await page.$eval("#product-postcode", (element) => element.value), "40123");
    checks.push("Postcode-only guest rate estimates, validation, pending state and retained input without address creation");

    for (const state of ["unavailable", "outOfStock", "invalidPrice"])
    {
      await open(state);
      assert.equal(await page.$eval("#product-add", (element) => element.disabled), true);
      assert.equal(await page.$eval("#product-buy", (element) => element.disabled), true);
    }
    await open("notFound");
    assert.match(await page.$eval("h1", (element) => element.textContent), /tidak ditemukan/);
    assert.equal(await page.$("#product-buy"), null);
    await open("partial");
    assert.match(await page.$eval(".product-summary", (element) => element.textContent), /belum tersedia/);
    assert.match(await page.$eval(".product-care", (element) => element.textContent), /belum tersedia/);
    checks.push("Unavailable, out-of-stock, missing price, not-found and incomplete content states");

    for (const state of ["loadError", "offline", "timeout", "maintenance"])
    {
      await open(state);
      await page.click("[data-product-retry]");
      await page.waitForSelector("#product-title");
      assert.equal(await page.evaluate(() => document.activeElement.id), "product-title");
    }
    checks.push("Load/offline/timeout/maintenance errors recover without losing the product link; focus restored");

    for (const state of ["addError", "conflict", "rateLimited"])
    {
      await open(state);
      await input("#product-quantity", "2");
      await page.click("#product-add");
      await page.waitForFunction(() => !document.getElementById("product-add").disabled);
      assert.equal(await page.$eval("#product-feedback", (element) => element.getAttribute("role")), "alert");
      assert.equal(await page.$eval("#product-quantity", (element) => element.value), "2");
      await page.click("#product-add");
      await page.waitForFunction(() => document.getElementById("product-feedback").textContent.includes("ditambahkan ke keranjang"));
      assert.equal(await page.$eval(".storefront-cart-count", (element) => element.textContent), "2");
    }
    await open("shippingError");
    await input("#product-postcode", "40123");
    await page.click('#product-shipping button');
    await page.waitForFunction(() => document.getElementById("product-shipping-result").textContent.includes("belum dapat"));
    await page.click('#product-shipping button');
    await page.waitForFunction(() => document.getElementById("product-shipping-result").dataset.state === "success");
    checks.push("Add error/conflict/rate-limit and shipping error retain choices and allow successful retry");

    await open("brokenImage");
    await page.waitForSelector(".product-image-error:not([hidden])");
    assert.equal(await page.$eval("[data-product-zoom]", (element) => element.hidden), true);
    assert.ok(await page.$("[data-product-image-retry]"));
    await capture("image-failure");
    checks.push("Broken product image has a readable fallback and retry, with unavailable zoom hidden");

    for (const width of [1920, 1024, 768, 390, 320])
    {
      await open("normal", width);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `No overflow at ${width}`);
      if (width === 390)
      {
        const order = await page.evaluate(() =>
        {
          const gallery = document.querySelector(".product-gallery").getBoundingClientRect();
          const info = document.querySelector(".product-information").getBoundingClientRect();
          return gallery.bottom <= info.top;
        });
        assert.equal(order, true, "Mobile sees product photography before purchase information");
      }
      const purchaseHeight = await page.$eval("#product-add", (element) => element.getBoundingClientRect().height);
      assert.ok(purchaseHeight <= 49, "Rounded 48px purchase button stays compact at " + width);
      await capture("responsive-" + width);
    }
    await open("longContent", 390);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await capture("long-content-mobile");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await open("loading");
    assert.equal(await page.$eval(".product-care-chevron", (element) => getComputedStyle(element).transitionDuration), "0s");
    checks.push("1920/1440/1024/768/390/320 layouts, mobile gallery order, long names/prices and reduced motion");

    await open();
    await page.setOfflineMode(true);
    await page.click("#product-add");
    await page.waitForFunction(() => document.getElementById("product-feedback").textContent.includes("Koneksi terputus"));
    assert.equal(await page.$eval("#product-quantity", (element) => element.value), "1");
    await page.setOfflineMode(false);
    checks.push("Real browser offline prevents writes while preserving rendered content and input");

    await page.goto(baseUrl + "/pages/public/product-detail.html?product=monstera", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#product-title");
    await input("#product-quantity", "3");
    await page.click("#product-add");
    await page.waitForFunction(() => document.getElementById("product-feedback").textContent.includes("ditambahkan ke keranjang"));
    let stored = await page.evaluate(() => JSON.parse(localStorage.getItem("rylva-cart-preview-guest-v1")));
    assert.equal(stored.items.find((item) => item.productId === "example-monstera").quantity, 4);
    const rejected = await page.evaluate(async () =>
    {
      const repository = window.RylvaCartPreviewRepository;
      const snapshot = await repository.load();
      try
      {
        await repository.add("example-monstera", snapshot.revision, 20);
        return false;
      }
      catch (error)
      {
        return error.code === "limit";
      }
    });
    assert.equal(rejected, true);
    stored = await page.evaluate(() => JSON.parse(localStorage.getItem("rylva-cart-preview-guest-v1")));
    assert.equal(stored.items.find((item) => item.productId === "example-monstera").quantity, 4);
    await input("#product-quantity", "2");
    await page.evaluate(() => sessionStorage.setItem("rylva-checkout-preview-intent-v1", JSON.stringify(
    {
      key: "completed-previous-order",
      status: "created",
      orderId: "previous-order"
    })));
    await page.click("#product-buy");
    await page.waitForFunction(() => location.pathname.includes("checkout.html"));
    const handoff = await page.evaluate(() => JSON.parse(sessionStorage.getItem("rylva-cart-checkout-preview-v1")));
    assert.deepEqual(handoff.items, [{ lineId: "monstera-large", quantity: 2 }]);
    assert.equal(handoff.mode, "guest");
    assert.equal(handoff.sourceScenario, "product-direct");
    assert.equal(await page.evaluate(() => sessionStorage.getItem("rylva-checkout-preview-intent-v1")), null);
    stored = await page.evaluate(() => JSON.parse(localStorage.getItem("rylva-cart-preview-guest-v1")));
    assert.equal(stored.items.find((item) => item.productId === "example-monstera").quantity, 4);
    checks.push("Atomic multi-quantity persistence rejects stock excess; Buy Now sends only selected quantity without altering existing cart or guest mode");

    await page.goto(baseUrl + "/pages/public/product-detail.html?product=monstera&returnTo=https%3A%2F%2Fevil.example", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#product-title");
    assert.equal(await page.$eval("#product-back", (element) => new URL(element.href).pathname), "/pages/public/catalog.html");
    await page.evaluate(() =>
    {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value)
      {
        if (key === "rylva-cart-checkout-preview-v1")
        {
          throw new Error("Blocked storage");
        }
        return original.call(this, key, value);
      };
    });
    await page.click("#product-buy");
    await page.waitForFunction(() => document.getElementById("product-feedback").textContent.includes("izin penyimpanan"));
    assert.match(page.url(), /product-detail.html/);
    assert.equal(await page.$eval("#product-buy", (element) => element.disabled), false);
    checks.push("Return links reject external redirects; blocked checkout handoff reports recovery without navigation");

    await page.goto(baseUrl + "/__preview/product-detail");
    assert.equal(await page.$$eval("li a", (items) => items.length), 22);
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(outputDirectory, "verification.json"), JSON.stringify({ checks, errors }, null, 2));
    console.log(JSON.stringify({ passed: checks.length, checks, errors }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyProductDetail().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
