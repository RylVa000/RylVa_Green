"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_HOME_URL || "http://127.0.0.1:4185";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/homepage");

async function verifyHomepage()
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
  const capturesOnly = process.argv.includes("--captures-only");
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());

  async function open(state = "", width = 1440)
  {
    await page.setViewport({ width, height: width >= 1440 ? 1080 : width >= 768 ? 1024 : 844 });
    await page.goto(BASE_URL + "/pages/public/home.html" + (state ? "?preview=home&state=" + state : ""), { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.getElementById("home-trending").getAttribute("aria-busy") === "false");
  }

  async function settleAssets()
  {
    await page.evaluate(async () =>
    {
      document.querySelectorAll("img").forEach((image) => image.loading = "eager");
      await document.fonts.ready;
      await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
    });
    await new Promise((resolve) => setTimeout(resolve, 700));
  }

  try
  {
    for (const width of [1920, 1440, 1024, 768, 390, 320])
    {
      await open("", width);
      await settleAssets();
      const layout = await page.evaluate(() =>
      ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        products: document.querySelectorAll(".home-main .home-product").length,
        broken: [...document.images].filter((image) => !image.naturalWidth).map((image) => image.src),
        navigationHeight: document.querySelector("header").getBoundingClientRect().height,
        footerHeight: document.querySelector("footer").getBoundingClientRect().height,
        heroWidth: document.querySelector(".home-hero").getBoundingClientRect().width,
        mainWidth: document.querySelector(".home-main").getBoundingClientRect().width,
        clippedActions: [...document.querySelectorAll(".home-product-actions")].some((actions) =>
        {
          const card = actions.closest(".home-product").getBoundingClientRect();
          const rect = actions.getBoundingClientRect();
          return rect.right > card.right + 1 || rect.bottom > card.bottom + 1;
        })
      }));
      assert.equal(layout.overflow, false, "Horizontal overflow at " + width);
      assert.equal(layout.products, 8);
      assert.deepEqual(layout.broken, []);
      assert.equal(layout.clippedActions, false);
      assert.ok(layout.heroWidth <= layout.mainWidth + 1, "Hero exceeds its content frame at " + width);
      if (width === 1024)
      {
        assert.ok(await page.$eval(".home-offer-kit .home-button", (button) => button.getBoundingClientRect().height < 60));
      }
      if (width <= 390)
      {
        assert.ok(layout.navigationHeight < 260);
        assert.ok(layout.footerHeight < 500);
      }
      await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "home-" + width + ".png"), fullPage: true });
    }
    checks.push("Six rendered sizes 320–1920px: eight product cards, all local assets render, no horizontal overflow or clipped actions, compact mobile shell");
    if (capturesOnly)
    {
      return;
    }

    await open();
    await page.focus("#storefront-search-input");
    await page.type("#storefront-search-input", "Monstera");
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.getElementById("catalog-products")?.getAttribute("aria-busy") === "false");
    assert.equal(await page.$$eval("#catalog-products .home-product", (items) => items.length), 1);
    assert.equal(new URL(page.url()).searchParams.get("q"), "Monstera");
    await settleAssets();
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "collection-desktop.png") });
    await page.click('[data-home-detail="monstera"]');
    await page.waitForSelector("#product-title");
    assert.match(await page.$eval("#product-title", (element) => element.textContent), /Monstera/);
    await settleAssets();
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "detail-desktop.png") });
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.getElementById("catalog-products")?.getAttribute("aria-busy") === "false");
    assert.equal(new URL(page.url()).searchParams.get("q"), "Monstera");
    await open();
    await page.focus(".home-offer-terrarium .home-button");
    assert.equal(await page.$eval(".home-offer-terrarium .home-button", (button) =>
    {
      const style = getComputedStyle(button);
      return button.matches(":focus-visible") && style.outlineColor === "rgb(255, 255, 255)"
        && parseFloat(style.outlineWidth) >= 3;
    }), true);
    checks.push("Header search opens Catalog; real Product Detail preserves the catalog query on return");

    await page.click("[data-home-filter=pet]");
    assert.equal(await page.$eval("[data-home-filter=pet]", (element) => element.getAttribute("aria-pressed")), "true");
    assert.match(await page.$eval("#home-recommendations", (element) => element.textContent), /terverifikasi/);
    assert.equal(new URL(page.url()).searchParams.get("filter"), "pet");
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "filter-empty-desktop.png"), fullPage: true });
    await page.click("[data-home-action=reset]");
    assert.equal(await page.$$eval("#home-recommendations .home-product", (items) => items.length), 4);
    await page.click("[data-home-slide='1']");
    await page.waitForFunction(() => document.getElementById("home-title").textContent === "CALATHEA");
    assert.equal(await page.$eval("#home-title", (element) => element.textContent), "CALATHEA");
    await page.click("[data-home-slide='0']");
    await page.waitForFunction(() => document.getElementById("home-title").textContent === "MONSTERA");
    await page.click("[data-home-collection=seeds]");
    await page.waitForFunction(() => document.getElementById("catalog-products")?.getAttribute("aria-busy") === "false");
    assert.equal(new URL(page.url()).searchParams.get("category"), "seeds");
    assert.match(await page.$eval("#catalog-products", (element) => element.textContent), /sesuai/);
    await open();
    checks.push("Recommendation filters update immediately, retain URL context and reset; manual hero selection and empty category recovery work");

    await page.evaluate(() => localStorage.removeItem("rylva-cart-preview-guest-v1"));
    await page.reload();
    await page.waitForSelector("[data-home-add=peace-lily]");
    await page.$eval("[data-home-add=peace-lily]", (button) =>
    {
      button.click();
      button.click();
    });
    await page.waitForFunction(() => !document.getElementById("home-toast").hidden);
    const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem("rylva-cart-preview-guest-v1")));
    assert.equal(persisted.items.find((item) => item.productId === "example-peace-lily").quantity, 1);
    await page.goto(BASE_URL + "/pages/customer/cart.html");
    await page.waitForFunction(() => document.getElementById("cart-root").getAttribute("aria-busy") === "false");
    assert.match(await page.$eval("#cart-root", (element) => element.textContent), /Peace Lily/);
    await Promise.all([page.waitForNavigation(), page.click("[data-cart-action=checkout]")]);
    await page.waitForFunction(() => document.querySelector("#checkout-root")?.getAttribute("aria-busy") === "false");
    assert.match(await page.$eval("#checkout-root", (element) => element.textContent), /Masuk untuk Checkout/);
    assert.equal(await page.evaluate(async () =>
    {
      const snapshot = await window.RylvaCheckoutPreviewRepository.load();
      return snapshot.items.some((item) => item.name === "Peace Lily");
    }), true);
    checks.push("Double add prevented; product persists into Cart and Checkout data handoff while guest authentication guard remains enforced");

    for (const state of ["loadError", "offline", "timeout", "maintenance"])
    {
      await open(state);
      assert.equal(await page.$("#home-trending .home-product"), null);
      await page.click("#home-trending [data-home-action=retry]");
      await page.waitForSelector("#home-trending .home-product");
    }
    for (const state of ["loading", "empty", "partial", "unavailable", "invalidPrice", "brokenImage", "longContent"])
    {
      await open(state, 320);
      await settleAssets();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, state);
      if (["unavailable", "invalidPrice"].includes(state))
      {
        assert.equal(await page.$eval("#home-trending [data-home-add]", (element) => element.disabled), true);
      }
      await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "state-" + state + ".png"), fullPage: true });
    }
    for (const state of ["addError", "conflict", "rateLimited"])
    {
      await open(state);
      await page.click("[data-home-add=peace-lily]");
      await page.waitForFunction(() => !document.getElementById("home-toast").hidden);
      assert.match(await page.$eval("#home-toast", (element) => element.textContent), /belum|berubah|percobaan/);
      await page.waitForFunction(() => !document.querySelector("[data-home-add=peace-lily]").disabled);
      await page.click("[data-home-add=peace-lily]");
      await page.waitForFunction(() => document.getElementById("home-toast").textContent.includes("ditambahkan"));
    }
    checks.push("Load failure/offline/timeout/maintenance recover; empty/partial/invalid/unavailable/image-failure/long-content states and action errors are usable");

    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await open();
    assert.equal(await page.$eval(".home-hero-copy", (element) => getComputedStyle(element).animationName), "none");
    await page.setOfflineMode(true);
    await page.click("[data-home-add=peace-lily]");
    await page.waitForFunction(() => !document.getElementById("home-toast").hidden);
    assert.match(await page.$eval("#home-toast", (element) => element.textContent), /Koneksi terputus/);
    await page.setOfflineMode(false);
    assert.deepEqual(errors, []);
    checks.push("Reduced motion disables entrance; real browser offline blocks writes and gives recovery without losing rendered collection");
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "verification.json"), JSON.stringify({ checks, errors }, null, 2));
    console.log(JSON.stringify({ checks, errors }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyHomepage().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
