"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const browserRuntime = require("../../../tools/testing/browser-runtime.cjs");
const baseUrl = process.env.RYLVA_WISHLIST_URL || "http://127.0.0.1:4185";
const outputDirectory = path.resolve("storage/reports/wishlist");

async function verifyWishlist()
{
  fs.mkdirSync(outputDirectory, { recursive: true });
  const browser = await browserRuntime.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  const checks = [];
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  async function settled()
  {
    await page.waitForFunction(() => document.getElementById("wishlist-products")?.getAttribute("aria-busy") === "false");
    await page.evaluate(async () =>
    {
      await document.fonts.ready;
      document.querySelectorAll("img").forEach((image) => image.loading = "eager");
      await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)));
    });
  }

  async function open(state = "ready", width = 1440, reset = true)
  {
    await page.setViewport({ width, height: width > 700 ? 1000 : 844 });
    if (reset)
    {
      await page.goto(baseUrl + "/pages/customer/wishlist.html", { waitUntil: "domcontentloaded" });
      await page.evaluate((scenario) =>
      {
        sessionStorage.removeItem("rylva-wishlist-workbench-" + scenario);
        sessionStorage.removeItem("rylva-wishlist-workbench-" + scenario + "-merge");
        for (const key of Object.keys(localStorage))
        {
          if (key.startsWith("rylva-wishlist-preview-account-v1:" + scenario + ":"))
          {
            localStorage.removeItem(key);
          }
        }
      }, state);
    }
    await page.goto(baseUrl + "/pages/customer/wishlist.html?preview=wishlist&state=" + state, { waitUntil: "domcontentloaded" });
    await settled();
    if (state.startsWith("merge"))
    {
      await page.waitForFunction(() => window.RylvaWishlistStore.snapshot().merge
        && window.RylvaWishlistStore.snapshot().merge.status !== "running");
    }
  }

  async function waitForSheet()
  {
    await page.waitForSelector("#wishlist-sheet[open]");
    await page.$eval("#wishlist-sheet", async (element) =>
    {
      await Promise.all(element.getAnimations().map((animation) => animation.finished.catch(() => undefined)));
    });
  }

  async function input(selector, value)
  {
    await page.$eval(selector, (element, text) =>
    {
      element.value = text;
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);
  }

  async function ids()
  {
    return page.$$eval("#wishlist-products .home-product", (cards) => cards.map((card) => card.dataset.productId));
  }

  async function capture(name, fullPage = true)
  {
    await settled();
    await page.screenshot({ path: path.join(outputDirectory, name + ".png"), fullPage });
  }

  try
  {
    await page.goto(baseUrl + "/pages/public/catalog.html", { waitUntil: "networkidle0" });
    await page.evaluate(() =>
    {
      sessionStorage.removeItem("rylva-wishlist-guest-v1");
      sessionStorage.removeItem("rylva-wishlist-guest-v1-merge");
      sessionStorage.removeItem("rylva-wishlist-preview-owner-v1");
    });
    await page.reload({ waitUntil: "networkidle0" });
    await page.click('[data-home-save="peace-lily"]');
    await page.click('[data-home-save="monstera"]');
    await page.waitForFunction(() => window.RylvaWishlistStore.snapshot().items.length === 2);
    await page.click('header [data-storefront-page="Wishlist"]');
    await page.waitForSelector("#home-wishlist-panel:not([hidden])");
    await page.click("[data-header-wishlist-all]");
    await settled();
    assert.equal((await ids()).length, 2);
    await page.reload({ waitUntil: "domcontentloaded" });
    await settled();
    assert.equal((await ids()).length, 2, "Guest memberships survive navigation and reload");
    await page.click('[data-home-detail="peace-lily"]');
    await page.waitForSelector("[data-product-save]");
    assert.equal(await page.$eval("[data-product-save]", (button) => button.getAttribute("aria-pressed")), "true");
    await page.click("[data-product-save]");
    await page.waitForFunction(() => !window.RylvaWishlistStore.has("example-peace-lily"));
    await page.goBack({ waitUntil: "domcontentloaded" });
    await settled();
    assert.deepEqual(await ids(), ["example-monstera"]);
    await page.waitForFunction(() => document.activeElement.dataset.homeDetail === "monstera");
    checks.push("Guest save across Catalog/Wishlist/Detail/reload and browser Back");

    await page.goto(baseUrl + "/pages/public/home.html", { waitUntil: "networkidle0" });
    assert.equal(await page.$eval('[data-home-save="monstera"]', (button) => button.getAttribute("aria-pressed")), "true");
    await page.click('[data-home-save="peace-lily"]');
    await page.waitForFunction(() => window.RylvaWishlistStore.has("example-peace-lily"));
    await page.click('header [data-storefront-page="Wishlist"]');
    await page.waitForSelector("#home-wishlist-panel:not([hidden])");
    await page.click("[data-header-wishlist-all]");
    await settled();
    assert.equal((await ids()).length, 2);
    checks.push("Homepage uses the same membership and Wishlist destination");

    for (const width of [1920, 1440, 1024, 820, 768, 390, 320])
    {
      await open("ready", width);
      const layout = await page.evaluate(() =>
      ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        radius: getComputedStyle(document.querySelector("#wishlist-products .home-product")).borderRadius,
        columns: getComputedStyle(document.getElementById("wishlist-products")).gridTemplateColumns.split(" ").length,
        clipped: [...document.querySelectorAll("#wishlist-products .home-product-actions")].some((actions) =>
        {
          const frame = actions.closest(".home-product").getBoundingClientRect();
          const rect = actions.getBoundingClientRect();
          return rect.right > frame.right + 1 || rect.bottom > frame.bottom + 1;
        }),
        broken: [...document.querySelectorAll("#wishlist-products img")].filter((image) => !image.naturalWidth && !image.hidden).length
      }));
      assert.equal(layout.overflow, false, "Horizontal overflow at " + width);
      assert.equal(layout.clipped, false, "Clipped actions at " + width);
      assert.equal(layout.broken, 0);
      assert.notEqual(layout.radius, "0px");
      if (width === 1920)
      {
        assert.equal(layout.columns, 3);
      }
      if (width === 1440)
      {
        assert.equal(layout.columns, 2);
      }
      await capture("wishlist-" + width);
    }
    checks.push("Rendered layout at seven widths, 3/2/1 columns, rounded cards, no overflow or clipped actions");

    await open();
    await input("#wishlist-search", "Monstera");
    assert.deepEqual(await ids(), ["example-monstera"]);
    await input("#wishlist-search", "tidak-adaproduk");
    assert.match(await page.$eval("#wishlist-products", (element) => element.textContent), /tidak ditemukan/);
    await page.click("#wishlist-reset");
    await page.select("#wishlist-category", "outdoor");
    assert.deepEqual(await ids(), ["example-petunia"]);
    await page.select("#wishlist-availability", "unavailable");
    assert.match(await page.$eval("#wishlist-products", (element) => element.textContent), /sesuai filter/);
    await page.click("#wishlist-reset");
    await page.select("#wishlist-sort", "price_asc");
    assert.equal((await ids())[0], "example-petunia");
    await page.select("#wishlist-sort", "price_desc");
    assert.equal((await ids())[0], "example-monstera");
    assert.equal(await page.evaluate(() => window.RylvaWishlistStore.snapshot().items.length), 8);
    checks.push("Live search/category/availability/sort/reset without deleting memberships");

    await open();
    await page.focus('[data-home-save="peace-lily"]');
    await page.click('[data-home-save="peace-lily"]');
    await page.waitForFunction(() => !window.RylvaWishlistStore.has("example-peace-lily"));
    assert.equal(await page.evaluate(() => document.activeElement.dataset.homeSave), "monstera");
    await page.click("[data-wishlist-undo]");
    await page.waitForFunction(() => window.RylvaWishlistStore.has("example-peace-lily"));
    assert.equal(await page.evaluate(() => window.RylvaWishlistStore.snapshot().items.length), 8);
    checks.push("Remove and save again, focus moves to the next product");

    await open("ready", 390);
    await page.click('[data-wishlist-sheet="filter"]');
    await waitForSheet();
    await page.select("#wishlist-category", "outdoor");
    assert.deepEqual(await ids(), ["example-petunia"]);
    await capture("wishlist-filter-mobile", false);
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.getElementById("wishlist-sheet").open);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.wishlistSheet), "filter");
    await page.click('[data-wishlist-sheet="sort"]');
    await waitForSheet();
    await page.click('#wishlist-sheet-sort input[value="name"]');
    await page.waitForFunction(() => !document.getElementById("wishlist-sheet").open);
    assert.equal(await page.$eval("#wishlist-sort", (element) => element.value), "name");
    await page.click('[data-wishlist-sheet="filter"]');
    await waitForSheet();
    const handle = await page.$eval(".catalog-sheet-handle", (element) =>
    {
      const rect = element.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    });
    await page.mouse.move(handle.x, handle.y);
    await page.mouse.down();
    await page.mouse.move(handle.x, handle.y + 250, { steps: 8 });
    await page.mouse.up();
    await page.waitForFunction(() => !document.getElementById("wishlist-sheet").open);
    checks.push("Mobile filter/sort sheet, immediate filtering, Escape, drag dismissal and returned focus");

    await open("appendError");
    await page.evaluate(() => document.getElementById("wishlist-load-more").click());
    await page.waitForFunction(() => document.getElementById("wishlist-more-status").textContent.includes("belum termuat"));
    assert.equal((await ids()).length, 6);
    await page.evaluate(() => document.getElementById("wishlist-load-more").click());
    await page.waitForFunction(() => document.querySelectorAll("#wishlist-products .home-product").length === 8);
    assert.equal(new Set(await ids()).size, 8);
    checks.push("Failed next batch preserves cards; manual retry appends uniquely");

    for (const scenario of ["merge", "mergePartial", "mergeError", "mergeTimeout"])
    {
      await open(scenario);
      let snapshot = await page.evaluate(() => window.RylvaWishlistStore.snapshot());
      if (scenario === "mergePartial")
      {
        assert.equal(snapshot.merge.status, "partial");
        assert.equal(snapshot.merge.remaining, 4);
      }
      if (scenario !== "merge")
      {
        await capture("wishlist-" + scenario, false);
        await page.click("[data-wishlist-merge]");
        await page.waitForFunction(() => window.RylvaWishlistStore.snapshot().merge.status === "success");
      }
      snapshot = await page.evaluate(() => window.RylvaWishlistStore.snapshot());
      assert.equal(snapshot.items.length, 8);
      assert.equal(new Set(snapshot.items.map((item) => item.productId)).size, 8);
      assert.equal(await page.evaluate((state) => JSON.parse(sessionStorage.getItem("rylva-wishlist-workbench-" + state)).items.length, scenario), 0);
    }
    checks.push("Merge union/dedupe, partial selective retry, confirmed failure recovery and timeout reconciliation");

    await page.evaluate(() =>
    {
      sessionStorage.setItem("rylva-wishlist-workbench-merge", JSON.stringify({ version: 1,
        items: [{ productId: "example-peace-lily", savedAt: 1 }] }));
      sessionStorage.removeItem("rylva-wishlist-workbench-merge-merge");
      localStorage.removeItem("rylva-wishlist-preview-account-v1:merge:wishlist-workbench-customer");
    });
    await page.goto(baseUrl + "/pages/customer/wishlist.html?preview=wishlist&state=merge", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.RylvaWishlistStore?.snapshot().merge?.status === "running");
    await page.waitForSelector('[data-home-save="monstera"]');
    assert.equal(await page.$eval('[data-home-save="peace-lily"]', (button) => button.disabled), true);
    assert.equal(await page.$eval('[data-home-save="monstera"]', (button) => button.disabled), false);
    await page.evaluate(() => window.RylvaWishlistStore.setSaved("example-calathea", true));
    await page.waitForFunction(() => window.RylvaWishlistStore.snapshot().merge.status === "success");
    assert.equal(await page.evaluate(() => window.RylvaWishlistStore.has("example-calathea")), true);
    checks.push("Merge only locks snapshot products; unrelated account saves remain usable");

    await open("saveError");
    await page.click('[data-home-save="peace-lily"]');
    await page.waitForFunction(() => document.getElementById("home-toast").textContent.includes("belum tersimpan"));
    assert.equal(await page.evaluate(() => window.RylvaWishlistStore.snapshot().items.length), 8);
    await page.click("[data-wishlist-retry-action]");
    await page.waitForFunction(() => !window.RylvaWishlistStore.has("example-peace-lily"));
    await open("saveTimeout");
    await page.click('[data-home-save="peace-lily"]');
    await page.waitForSelector("[data-wishlist-reconcile]");
    assert.equal(await page.evaluate(() => window.RylvaWishlistStore.snapshot().items.length), 8);
    await page.click("[data-wishlist-reconcile]");
    await page.waitForFunction(() => !window.RylvaWishlistStore.has("example-peace-lily"));
    assert.equal(await page.evaluate(() => window.RylvaWishlistStore.snapshot().items.length), 7);
    checks.push("Definite mutation failure retains membership; uncertain mutation reconciles before retry");

    for (const scenario of ["empty", "loadError", "offline", "timeout", "maintenance", "denied", "session", "verification",
      "partial", "notFound", "outOfStock", "unavailable", "invalidPrice", "brokenImage", "longContent", "storageBlocked", "storageCorrupt", "stale"])
    {
      await open(scenario, scenario === "longContent" ? 320 : 1440);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, scenario);
      if (["loadError", "offline", "timeout", "maintenance"].includes(scenario))
      {
        await page.click("[data-wishlist-retry]");
        await page.waitForFunction(() => document.querySelectorAll("#wishlist-products .home-product").length >= 6);
      }
      if (["outOfStock", "unavailable", "invalidPrice", "stale"].includes(scenario))
      {
        assert.equal(await page.$eval('[data-home-add="peace-lily"]', (button) => button.disabled), true);
      }
      if (scenario === "brokenImage")
      {
        await page.waitForSelector('[data-image-failed="true"]');
      }
      if (scenario === "partial")
      {
        assert.match(await page.$eval("#wishlist-notice", (element) => element.textContent), /Sebagian/);
      }
      if (scenario === "storageBlocked")
      {
        assert.equal(await page.evaluate(() => window.RylvaWishlistStore.snapshot().memoryOnly), true);
      }
      await capture("wishlist-state-" + scenario, scenario === "longContent");
      if (scenario === "longContent")
      {
        const card = await page.$("#wishlist-products .home-product");
        await card.screenshot({ path: path.join(outputDirectory, "wishlist-long-content-card-320.png") });
      }
    }
    checks.push("18 empty/error/access/data/storage states and relevant recovery, including long content at 320px");

    await open("ready");
    const before = await page.evaluate(async () =>
    {
      const cart = await window.RylvaWishlistPreviewRepository.readCart();
      return cart.items.filter((item) => item.productId === "example-peace-lily").reduce((sum, item) => sum + item.quantity, 0);
    });
    await page.click('[data-home-add="peace-lily"]');
    await page.waitForFunction(() => document.getElementById("home-toast").textContent.includes("ditambahkan"));
    const after = await page.evaluate(async () =>
    {
      const cart = await window.RylvaWishlistPreviewRepository.readCart();
      return cart.items.filter((item) => item.productId === "example-peace-lily").reduce((sum, item) => sum + item.quantity, 0);
    });
    assert.equal(after, before + 1);
    assert.equal(await page.evaluate(() => window.RylvaWishlistStore.has("example-peace-lily")), true);
    await page.click('[data-home-add="monstera"]');
    await page.waitForFunction(() => location.pathname.endsWith("product-detail.html"));
    assert.equal(new URL(page.url()).searchParams.get("product"), "monstera");
    checks.push("Standard add increments once and preserves Wishlist; required variant opens Detail");

    await page.goto(baseUrl + "/pages/customer/wishlist.html", { waitUntil: "domcontentloaded" });
    await settled();
    await page.click("#wishlist-login");
    await page.waitForSelector("#auth-email");
    assert.equal(new URL(page.url()).searchParams.get("returnTo"), "/pages/customer/wishlist.html");
    await page.type("#auth-email", "synthetic.person@example.test");
    await page.type("#auth-password", "bunga-sintetis-2026");
    await page.click("#auth-submit");
    await page.waitForSelector('[data-auth-action="continue"]');
    await page.click('[data-auth-action="continue"]');
    await settled();
    await page.waitForFunction(() => window.RylvaWishlistStore.snapshot().merge?.status === "success");
    assert.equal(await page.evaluate(() => window.RylvaWishlistStore.snapshot().owner), "customer-example");
    assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem("rylva-wishlist-guest-v1")).items.length), 0);
    await page.reload({ waitUntil: "domcontentloaded" });
    await settled();
    assert.ok((await ids()).length > 0, "Preview account membership survives reload");
    checks.push("Wishlist login preserves returnTo, merges guest choices after preview continuation, and reloads account data");
    await page.evaluate(async () =>
    {
      sessionStorage.setItem("rylva-wishlist-preview-owner-v1", "customer-A");
      sessionStorage.removeItem("rylva-account-preview-access-v1");
      await window.RylvaWishlistStore.refresh();
      await window.RylvaWishlistStore.setSaved("example-monstera", true);
    });
    assert.equal(await page.evaluate(() => window.RylvaWishlistStore.snapshot().owner), "customer-A");
    await page.evaluate(async () =>
    {
      sessionStorage.setItem("rylva-wishlist-preview-owner-v1", "customer-B");
      await window.RylvaWishlistStore.refresh();
    });
    assert.equal(await page.evaluate(() => window.RylvaWishlistStore.snapshot().items.length), 0);
    await page.evaluate(async () =>
    {
      sessionStorage.removeItem("rylva-wishlist-preview-owner-v1");
      await window.RylvaWishlistStore.refresh();
    });
    assert.equal(await page.evaluate(() => window.RylvaWishlistStore.snapshot().mode), "guest");
    assert.equal(await page.evaluate(() => window.RylvaWishlistStore.snapshot().items.length), 0);
    checks.push("Owner changes and logout never expose account A memberships as account B or guest");

    await open("ready", 390);
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.click('[data-wishlist-sheet="filter"]');
    await waitForSheet();
    assert.equal(await page.$eval("#wishlist-sheet", (element) => getComputedStyle(element).animationName), "none");
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.getElementById("wishlist-sheet").contains(document.activeElement)), true);
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.getElementById("wishlist-sheet").open);
    checks.push("Reduced motion and native dialog keyboard containment");
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(outputDirectory, "verification.json"), JSON.stringify({ checks, errors }, null, 2));
    checks.forEach((check) => console.log("PASS " + check));
  }
  finally
  {
    await browser.close();
  }
}

verifyWishlist().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
