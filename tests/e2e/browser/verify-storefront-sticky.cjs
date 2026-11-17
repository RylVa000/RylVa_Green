"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_STICKY_URL || "http://127.0.0.1:4185";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/storefront-sticky");

async function verifyStickyNavigation()
{
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  const routes = ["public", "customer"].flatMap((directory) =>
  {
    return fs.readdirSync(path.resolve("public/pages", directory)).filter((file) =>
    {
      return file.endsWith(".html") && fs.readFileSync(path.resolve("public/pages", directory, file), "utf8")
        .includes("storefront-header");
    }).map((file) => "/pages/" + directory + "/" + file);
  });
  const parameters =
  {
    "product-detail.html": "?product=monstera",
    "bouquet-customizer.html": "?preview=bouquet&state=ready",
    "wishlist.html": "?preview=wishlist&state=ready"
  };
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
  await page.setRequestInterception(true);
  page.on("request", (request) =>
  {
    if (/^https?:/.test(request.url()) && !request.url().startsWith(BASE_URL))
    {
      request.abort();
    }
    else
    {
      request.continue();
    }
  });

  async function settle()
  {
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.evaluate(async () =>
    {
      const selectors = ".storefront-header, .catalog-filter-panel, .catalog-mobile-tools, "
        + ".cart-summary, .detail-action-rail, .bq-categories";
      const animations = [...document.querySelectorAll(selectors)].flatMap((element) => element.getAnimations());
      await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
    });
  }

  async function open(route, width = 1440)
  {
    await page.setViewport({ width, height: 900, isMobile: width < 600, hasTouch: width < 600 });
    await page.goto(BASE_URL + route + (parameters[path.basename(route)] || ""), { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
    await settle();
  }

  try
  {
    for (const width of [1440, 390])
    {
      for (const route of routes)
      {
        await open(route, width);
        await page.evaluate(() => scrollTo(0, 650));
        await settle();
        const geometry = await page.evaluate(() =>
        {
          const header = document.querySelector(".storefront-header");
          const bounds = header.getBoundingClientRect();
          const logo = header.querySelector(".storefront-logo").getBoundingClientRect();
          const hit = document.elementFromPoint(logo.left + logo.width / 2, logo.top + logo.height / 2);
          return {
            top: bounds.top,
            bottom: bounds.bottom,
            height: bounds.height,
            scrollPosition: scrollY,
            hidden: document.documentElement.classList.contains("storefront-nav-hidden"),
            position: getComputedStyle(header).position,
            measuredHeight: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--storefront-sticky-height")),
            clickable: header.contains(hit),
            overflow: document.documentElement.scrollWidth > innerWidth
          };
        });
        assert.equal(geometry.position, "sticky", route);
        if (geometry.scrollPosition > geometry.height + 16)
        {
          assert.equal(geometry.hidden, true, route + " must hide while scrolling down");
          assert.ok(geometry.bottom <= 1, route + " hidden navbar must clear the viewport");
          assert.equal(geometry.measuredHeight, 0, route + " sidebars must reclaim navbar space");
        }
        assert.equal(geometry.overflow, false, route + " horizontal overflow");
        if (["home.html", "catalog.html", "contact.html", "my-orders.html"].includes(path.basename(route)))
        {
          await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, path.basename(route, ".html") + "-" + width + "-down.png") });
        }
        await page.evaluate(() => scrollBy(0, -90));
        await settle();
        assert.ok(await page.evaluate(() =>
        {
          const header = document.querySelector(".storefront-header");
          const bounds = header.getBoundingClientRect();
          const logo = header.querySelector(".storefront-logo").getBoundingClientRect();
          const hit = document.elementFromPoint(logo.left + logo.width / 2, logo.top + logo.height / 2);
          const measured = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--storefront-sticky-height"));
          return !document.documentElement.classList.contains("storefront-nav-hidden")
            && Math.abs(bounds.top) <= 1 && Math.abs(measured - bounds.height) <= 1 && header.contains(hit);
        }), route + " must reappear and accept interaction while scrolling up");
        if (["home.html", "catalog.html", "contact.html", "my-orders.html"].includes(path.basename(route)))
        {
          await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, path.basename(route, ".html") + "-" + width + "-up.png") });
        }
      }
    }
    checks.push("Sticky navbar hides down, reveals up and remains clickable on all " + routes.length + " storefront pages at desktop and mobile widths");

    const rails = [
      ["/pages/public/catalog.html", ".catalog-filter-panel", 16],
      ["/pages/customer/cart.html", ".cart-summary", 24],
      ["/pages/customer/order-detail.html", ".detail-action-rail", 24],
      ["/pages/customer/bouquet-customizer.html", ".bq-categories", 24]
    ];
    for (const [route, selector, gap] of rails)
    {
      await open(route);
      await page.waitForSelector(selector);
      await page.evaluate(() => scrollTo(0, 0));
      await settle();
      const offset = await page.$eval(selector, (element) =>
      {
        const style = getComputedStyle(element);
        return {
          top: parseFloat(style.top),
          headerHeight: document.querySelector(".storefront-header").getBoundingClientRect().height,
          maxHeight: parseFloat(style.maxHeight)
        };
      });
      assert.ok(Math.abs(offset.top - offset.headerHeight - gap) <= 1, selector + " offset below navbar");
      assert.ok(offset.maxHeight <= 900 - offset.headerHeight, selector + " bounded height below navbar");
      for (const distance of [650, -90])
      {
        await page.evaluate((amount) => scrollBy(0, amount), distance);
        await settle();
        const movingOffset = await page.$eval(selector, (element) =>
        {
          return {
            top: parseFloat(getComputedStyle(element).top),
            visibleHeader: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--storefront-sticky-height"))
          };
        });
        assert.ok(Math.abs(movingOffset.top - movingOffset.visibleHeader - gap) <= 1,
          selector + " must follow the navbar while hiding and revealing");
      }
      await page.$eval(selector, (element) =>
      {
        const controls = [...element.querySelectorAll("button:not(:disabled), a[href], input:not(:disabled), summary")]
          .filter((control) => control.getBoundingClientRect().height > 0);
        const control = controls.at(-1);
        control.scrollIntoView({ block: "nearest" });
      });
      await settle();
      const controlVisible = await page.$eval(selector, (element) =>
      {
        const control = [...element.querySelectorAll("button:not(:disabled), a[href], input:not(:disabled), summary")]
          .filter((item) => item.getBoundingClientRect().height > 0).at(-1);
        const bounds = control.getBoundingClientRect();
        const hit = document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
        return control.contains(hit);
      });
      assert.equal(controlVisible, true, selector + " final control must remain reachable");
    }
    checks.push("Catalog filters, Cart summary, order action rail and Bouquet categories reserve space below the measured navbar");

    await open("/pages/public/home.html");
    await page.evaluate(() => scrollTo(0, 700));
    await settle();
    await page.evaluate(() => scrollBy(0, -90));
    await settle();
    await page.hover('header [data-storefront-page="Wishlist"]');
    await page.waitForSelector("#home-wishlist-panel:not([hidden])");
    const panelBounds = await page.$eval("#home-wishlist-panel", (panel) =>
    {
      const bounds = panel.getBoundingClientRect();
      return { top: bounds.top, bottom: bounds.bottom, viewportHeight: innerHeight };
    });
    assert.ok(panelBounds.top >= 0 && panelBounds.bottom <= panelBounds.viewportHeight);
    await page.evaluate(() => scrollBy(0, 100));
    await settle();
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains("storefront-nav-hidden")), false,
      "Open dropdown must keep the header visible");
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.activeElement.hasAttribute("data-header-wishlist-trigger")), true);
    await page.click('header [data-storefront-page="Keranjang"]');
    await page.waitForSelector("#home-cart-panel:not([hidden])");
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "cart-panel-after-scroll.png") });
    await page.keyboard.press("Escape");
    checks.push("Wishlist hover, Cart click and Escape focus work after scrolling; open dropdowns keep the navbar visible");

    await page.focus("#storefront-search input");
    await page.evaluate(() => scrollTo(0, 900));
    await settle();
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains("storefront-nav-hidden")), false);
    await page.$eval("#storefront-search input", (input) => input.blur());
    await page.evaluate(() => scrollBy(0, 8));
    await settle();
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains("storefront-nav-hidden")), false);
    await page.evaluate(() => scrollBy(0, 20));
    await settle();
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains("storefront-nav-hidden")), true);
    await page.evaluate(() => scrollBy(0, -8));
    await settle();
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains("storefront-nav-hidden")), true);
    await page.evaluate(() => scrollBy(0, -6));
    await settle();
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains("storefront-nav-hidden")), false);
    checks.push("Search focus holds the navbar open; small scroll movements do not make it flicker");

    await page.setViewport({ width: 320, height: 844, isMobile: true, hasTouch: true });
    await settle();
    assert.ok(await page.evaluate(() =>
    {
      const header = document.querySelector(".storefront-header").getBoundingClientRect();
      const measured = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--storefront-sticky-height"));
      return Math.abs(header.top) <= 1 && Math.abs(header.height - measured) <= 1;
    }));
    await open("/pages/public/catalog.html", 390);
    await page.evaluate(() => scrollTo(0, 500));
    await settle();
    const toolbar = await page.$eval(".catalog-mobile-tools", (element) =>
    {
      return { top: element.getBoundingClientRect().top,
        headerBottom: document.querySelector(".storefront-header").getBoundingClientRect().bottom };
    });
    assert.ok(toolbar.top >= toolbar.headerBottom - 1, "Mobile filters must stay below the navbar");
    await page.click('[data-catalog-sheet="filter"]');
    await page.waitForSelector("#catalog-sheet[open]");
    await page.$eval("#catalog-sheet", async (sheet) =>
    {
      await Promise.all(sheet.getAnimations().map((animation) => animation.finished.catch(() => undefined)));
    });
    const sheetVisible = await page.$eval("#catalog-sheet [data-catalog-sheet-close]", (button) =>
    {
      const bounds = button.getBoundingClientRect();
      return button.contains(document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2));
    });
    assert.equal(sheetVisible, true, "Native filter sheet must remain above the sticky navbar");
    await page.keyboard.press("Escape");
    checks.push("Resize recalculates navbar height; mobile filters remain reachable and native sheets appear above it");

    await open("/pages/public/privacy-policy.html");
    await page.$eval("#privacy-section-5", (heading) => heading.scrollIntoView({ block: "start" }));
    await settle();
    assert.ok(await page.evaluate(() =>
      document.getElementById("privacy-section-5").getBoundingClientRect().top
        >= document.querySelector(".storefront-header").getBoundingClientRect().bottom));
    checks.push("Anchor scrolling leaves the target readable below the navbar");

    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    assert.equal(await page.$eval(".storefront-header", (header) => getComputedStyle(header).transitionDuration), "0s");
    await page.evaluate(() => scrollTo(0, 0));
    await settle();
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains("storefront-nav-hidden")), false);
    checks.push("Reduced motion removes transitions; returning to the page top always reveals navigation");

    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "verification.json"), JSON.stringify({ routes, checks, errors }, null, 2));
    checks.forEach((check) => console.log("PASS " + check));
  }
  finally
  {
    await browser.close();
  }
}

verifyStickyNavigation().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
