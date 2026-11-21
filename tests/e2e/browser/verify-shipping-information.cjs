"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_INFORMATION_URL || "http://127.0.0.1:4185";
const PAGE_PATH = "/pages/public/shipping-information.html";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/shipping-information");

async function verifyShippingInformation()
{
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  const browser = await runtime.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true
  });
  const page = await browser.newPage();
  const checks = [];
  const errors = [];
  const failedResources = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) =>
  {
    if (response.url().startsWith(BASE_URL) && response.status() >= 400
      && new URL(response.url()).pathname !== "/favicon.ico")
    {
      failedResources.push(response.url() + " " + response.status());
    }
  });

  async function open(route = PAGE_PATH, width = 1440)
  {
    await page.setViewport({ width, height: 1000, isMobile: width < 600, hasTouch: width < 600 });
    await page.goto(BASE_URL + route, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
  }

  async function waitForScroll()
  {
    await new Promise((resolve) => setTimeout(resolve, 450));
  }

  async function scrollToHeading(id)
  {
    await page.evaluate((headingId) =>
    {
      const heading = document.getElementById(headingId);
      const headerHeight = document.querySelector(".storefront-header").offsetHeight;
      window.scrollTo(
      {
        top: heading.getBoundingClientRect().top + scrollY - headerHeight - 16,
        behavior: "instant"
      });
    }, id);
    await page.waitForFunction((hash) =>
      document.querySelector('.shipping-toc [aria-current="location"]')?.hash === hash,
    { timeout: 3000 }, "#" + id);
  }

  try
  {
    for (const width of [1440, 1024, 768, 390, 320])
    {
      await open(PAGE_PATH, width);
      const layout = await page.evaluate(() =>
      {
        const main = document.getElementById("information-main");
        return {
          headings: main.querySelectorAll("h1").length,
          overflow: document.documentElement.scrollWidth > innerWidth,
          clipped: [...main.querySelectorAll("a, summary, table")].some((element) =>
          {
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1);
          }),
          font: getComputedStyle(main).fontFamily,
          sidebarPosition: getComputedStyle(document.querySelector(".shipping-sidebar")).position,
          tocOpen: document.getElementById("shipping-toc").open,
          emptyLinks: [...main.querySelectorAll("a")].filter((link) => !link.textContent.trim()).length
        };
      });
      assert.equal(layout.headings, 1);
      assert.equal(layout.overflow, false, "page overflow at " + width);
      assert.equal(layout.clipped, false, "clipped main controls at " + width);
      assert.equal(layout.emptyLinks, 0);
      assert.match(layout.font, /Poppins/);
      assert.equal(layout.sidebarPosition, width > 760 ? "sticky" : "static");
      assert.equal(layout.tocOpen, width > 760);
      await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, `shipping-${width}.png`) });
      if ([1440, 390].includes(width))
      {
        await page.screenshot(
        {
          path: path.join(OUTPUT_DIRECTORY, `shipping-full-${width}.png`),
          fullPage: true
        });
      }
      checks.push("layout, readable controls and navigation at " + width);
    }

    await open();
    const sectionIds = ["layanan", "ongkir", "jadwal", "pengemasan", "pelacakan", "kendala", "pertanyaan"];
    const originalUrl = page.url();
    for (const id of [...sectionIds, ...sectionIds.toReversed()])
    {
      await scrollToHeading(id);
      assert.equal(await page.$$eval('.shipping-toc [aria-current="location"]', (links) => links.length), 1);
    }
    assert.equal(page.url(), originalUrl, "scrolling does not add fragments");
    await page.click('.shipping-toc a[href="#pelacakan"]');
    await waitForScroll();
    const clickedContext = await page.evaluate(() =>
    ({
      url: location.href,
      entries: history.length,
      depth: history.state.shippingGuideDepth,
      focused: document.activeElement.id
    }));
    await scrollToHeading("layanan");
    assert.deepEqual(await page.evaluate(() =>
    ({
      url: location.href,
      entries: history.length,
      depth: history.state.shippingGuideDepth,
      focused: document.activeElement.id
    })), clickedContext, "scroll selection preserves URL, history, return depth and focus");
    await page.hover('.shipping-toc a[href="#pelacakan"]');
    const highlights = await page.evaluate(() =>
    ({
      active: getComputedStyle(document.querySelector('.shipping-toc a[href="#layanan"]')).backgroundColor,
      hovered: getComputedStyle(document.querySelector('.shipping-toc a[href="#pelacakan"]')).backgroundColor
    }));
    assert.notEqual(highlights.active, highlights.hovered, "hover does not imitate the active section");
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "shipping-scrollspy-1440.png") });
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
    await page.waitForFunction(() =>
      document.querySelector('.shipping-toc [aria-current="location"]').hash === "#pertanyaan");
    await open(PAGE_PATH, 390);
    await scrollToHeading("jadwal");
    assert.equal(await page.$eval("#shipping-toc", (element) => element.open), false);
    checks.push("scroll selection tracks every section in both directions without changing URL, focus or return history");

    await open();
    await page.focus('.shipping-toc a[href="#ongkir"]');
    await page.keyboard.press("Enter");
    await waitForScroll();
    assert.equal(new URL(page.url()).hash, "#ongkir");
    const anchor = await page.evaluate(() =>
    {
      const heading = document.getElementById("ongkir");
      return {
        focused: document.activeElement === heading,
        headingTop: heading.getBoundingClientRect().top,
        headerBottom: document.querySelector(".storefront-header").getBoundingClientRect().bottom,
        current: document.querySelector('.shipping-toc [aria-current="location"]').hash
      };
    });
    assert.equal(anchor.focused, true, "keyboard anchor focuses the target heading");
    assert.equal(anchor.current, "#ongkir");
    assert.ok(anchor.headingTop >= Math.max(0, anchor.headerBottom) - 1);
    await page.mouse.wheel({ deltaY: -80 });
    await waitForScroll();
    const revealed = await page.evaluate(() =>
      document.getElementById("ongkir").getBoundingClientRect().top
        >= document.querySelector(".storefront-header").getBoundingClientRect().bottom - 1);
    assert.equal(revealed, true, "returning sticky header does not cover anchor");
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "shipping-ongkir.png") });
    checks.push("keyboard anchors, current section and sticky header clearance");

    await open(PAGE_PATH + "#jadwal");
    await waitForScroll();
    const scheduleTop = await page.$eval("#jadwal", (element) => element.getBoundingClientRect().top);
    assert.ok(scheduleTop >= 0 && scheduleTop < 600);
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "shipping-jadwal.png") });
    await open(PAGE_PATH + "#bagian-lama");
    assert.equal(await page.$eval("h1", (element) => element.textContent), "Informasi Pengiriman");
    assert.equal(await page.evaluate(() => scrollY), 0);
    checks.push("direct anchors and unknown fragment fallback");

    await open(PAGE_PATH, 390);
    await page.focus(".skip-link");
    await page.keyboard.press("Enter");
    await waitForScroll();
    const skip = await page.evaluate(() =>
    ({
      focused: document.activeElement === document.getElementById("information-main"),
      scroll: scrollY,
      hash: location.hash
    }));
    assert.equal(skip.focused, true);
    assert.equal(skip.hash, "#information-main");
    assert.ok(skip.scroll > 0, "valid skip target is not reset to the document top");
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "shipping-skip-390.png") });
    checks.push("keyboard skip link keeps its valid non-TOC target");

    await open(PAGE_PATH, 390);
    await page.focus("#pengiriman-faq-guest summary");
    await page.keyboard.press("Space");
    await page.waitForFunction(() => document.getElementById("pengiriman-faq-guest").open);
    await page.focus("#pengiriman-faq-biaya summary");
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelectorAll(".shipping-faq details[open]").length === 1);
    assert.equal(await page.$eval("#pengiriman-faq-guest", (element) => element.open), false);
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "shipping-faq-390.png") });
    checks.push("mobile FAQ keyboard and single-open behaviour");

    await page.focus('.shipping-help a[href="/pages/public/contact.html"]');
    const readingScroll = await page.evaluate(() => scrollY);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.keyboard.press("Enter")
    ]);
    await page.goBack({ waitUntil: "networkidle0" });
    await waitForScroll();
    assert.equal(await page.$eval("#pengiriman-faq-biaya", (element) => element.open), true);
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - readingScroll) < 200);
    checks.push("return from help restores FAQ and reading position");

    await page.focus("#storefront-search-input");
    await page.type("#storefront-search-input", "lidah mertua");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.keyboard.press("Enter")
    ]);
    assert.equal(new URL(page.url()).pathname, "/pages/public/catalog.html");
    assert.equal(new URL(page.url()).searchParams.get("q"), "lidah mertua");
    await page.goBack({ waitUntil: "networkidle0" });
    await waitForScroll();
    assert.equal(await page.$eval("#pengiriman-faq-biaya", (element) => element.open), true);
    checks.push("global search uses catalogue query and keeps FAQ state on return");

    await open("/pages/public/product-detail.html?product=monstera&qty=2");
    await page.waitForSelector("#product-postcode");
    await page.type("#product-postcode", "40526");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.click('a[href="/pages/public/shipping-information.html#ongkir"]')
    ]);
    await page.waitForSelector("#shipping-return:not([hidden])");
    await page.click('.shipping-toc a[href="#jadwal"]');
    await page.click('.shipping-toc a[href="#kendala"]');
    await page.goBack({ waitUntil: "networkidle0" });
    assert.equal(new URL(page.url()).hash, "#jadwal");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.click("#shipping-return")
    ]);
    assert.equal(new URL(page.url()).searchParams.get("product"), "monstera");
    assert.equal(await page.$eval("#product-quantity", (element) => element.value), "2");
    assert.equal(await page.$eval("#product-postcode", (element) => element.value), "40526");
    checks.push("contextual return after multiple sections and Back preserves product, quantity and guest postcode");

    for (const source of ["/pages/public/home.html", "/pages/public/faq.html", "/pages/public/contact.html",
      "/pages/customer/cart.html", "/pages/customer/wishlist.html", "/pages/customer/checkout.html"])
    {
      await open(source);
      assert.equal(await page.$eval('footer [data-storefront-page="Informasi Pengiriman"]',
        (link) => link.getAttribute("href")), PAGE_PATH, source);
    }
    checks.push("shipping footer destination across six storefront routes");

    await page.evaluate(() => sessionStorage.setItem("rylva-account-preview-access-v1", "signed-out"));
    await open();
    assert.equal(await page.$eval(".shipping-main h1", (element) => element.textContent), "Informasi Pengiriman");
    assert.equal(await page.$$eval(".shipping-main input", (elements) => elements.length), 0);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.click('a[href="/pages/customer/my-orders.html"]')
    ]);
    assert.match(await page.$eval("main", (element) => element.textContent), /Masuk/i);
    checks.push("public guest access and order destination authentication");

    for (const alias of ["/shipping-information.html", "/informasi-pengiriman.html"])
    {
      await open(alias);
      assert.equal(new URL(page.url()).pathname, PAGE_PATH);
    }
    checks.push("English and Indonesian route aliases");

    await page.setJavaScriptEnabled(false);
    await open(PAGE_PATH, 390);
    await page.click('.shipping-toc a[href="#jadwal"]');
    assert.equal(new URL(page.url()).hash, "#jadwal");
    await page.focus("#pengiriman-faq-guest summary");
    await page.keyboard.press("Enter");
    assert.equal(await page.$eval("#pengiriman-faq-guest", (element) => element.open), true);
    assert.equal(await page.$eval('a[href="/pages/public/catalog.html"]', (element) => element.getAttribute("href")),
      "/pages/public/catalog.html");
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "shipping-no-script-390.png") });
    await page.setJavaScriptEnabled(true);
    checks.push("article, anchors, native FAQ and main links work without JavaScript");

    await open("/__preview/shipping-information");
    const frame = await (await page.$("#preview-frame")).contentFrame();
    await frame.waitForSelector(".shipping-main");
    await page.select("#preview-width", "320");
    await page.select("#preview-state", "long-text");
    await page.waitForFunction(() =>
      document.getElementById("preview-frame").contentDocument?.getElementById("layanan")?.textContent.includes("kebutuhan"));
    const stress = await (await page.$("#preview-frame")).contentFrame();
    assert.equal(await stress.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    checks.push("development workbench and long text at 320px");

    assert.deepEqual(errors, []);
    assert.deepEqual(failedResources, []);
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "verification.json"),
      JSON.stringify({ checks, errors, failedResources }, null, 2));
    checks.forEach((check) => console.log("PASS " + check));
  }
  finally
  {
    await browser.close();
  }
}

verifyShippingInformation().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
