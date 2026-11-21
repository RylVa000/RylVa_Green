"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_INFORMATION_URL || "http://127.0.0.1:4185";
const PAGE_PATH = "/pages/public/cancellation-refund.html";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/cancellation-refund");

async function verifyCancellationRefund()
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
  const writes = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) =>
  {
    if (response.url().startsWith(BASE_URL) && response.status() >= 400
      && new URL(response.url()).pathname !== "/favicon.ico")
    {
      failedResources.push(response.url() + " " + response.status());
    }
  });
  await page.setRequestInterception(true);
  page.on("request", (request) =>
  {
    if (!["GET", "HEAD"].includes(request.method()))
    {
      writes.push(request.method() + " " + request.url());
    }
    if (/^https?:/.test(request.url()) && !request.url().startsWith(BASE_URL))
    {
      request.abort();
    }
    else
    {
      request.continue();
    }
  });

  async function open(route = PAGE_PATH, width = 1440)
  {
    await page.setViewport({ width, height: 1000, isMobile: width < 600, hasTouch: width < 600 });
    await page.goto(BASE_URL + route, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
  }

  async function settle()
  {
    await new Promise((resolve) => setTimeout(resolve, 450));
  }

  async function scrollToHeading(id)
  {
    await page.evaluate((headingId) =>
    {
      const heading = document.getElementById(headingId);
      const headerHeight = document.querySelector(".storefront-header").offsetHeight;
      scrollTo({ top: heading.getBoundingClientRect().top + scrollY - headerHeight - 16, behavior: "instant" });
    }, id);
    await page.waitForFunction((hash) =>
      document.querySelector('#refund-toc [aria-current="location"]')?.hash === hash,
    { timeout: 3000 }, "#" + id);
  }

  async function follow(selector)
  {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.click(selector)
    ]);
  }

  try
  {
    for (const width of [1440, 1024, 768, 390, 320])
    {
      await open(PAGE_PATH, width);
      const layout = await page.evaluate(() =>
      {
        const main = document.querySelector(".refund-main");
        const banner = getComputedStyle(document.querySelector(".refund-banner"));
        return {
          mainCount: document.querySelectorAll("main").length,
          headingCount: main.querySelectorAll("h1").length,
          overflow: document.documentElement.scrollWidth > innerWidth,
          clipped: [...main.querySelectorAll("a, summary, table")].some((element) =>
          {
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1);
          }),
          font: getComputedStyle(main).fontFamily,
          fontsLoaded: [400, 500, 600, 700].every((weight) =>
          {
            return [...document.fonts].some((face) =>
            {
              return face.family === "Poppins" && face.weight === String(weight)
                && face.status === "loaded";
            });
          }),
          bannerColor: banner.color,
          bannerImage: banner.backgroundImage,
          tocOpen: document.getElementById("refund-toc").open,
          tocPosition: getComputedStyle(document.querySelector(".shipping-sidebar")).position,
          financialInputs: main.querySelectorAll("form, input, textarea").length
        };
      });
      assert.equal(layout.mainCount, 1);
      assert.equal(layout.headingCount, 1);
      assert.equal(layout.overflow, false, "overflow at " + width);
      assert.equal(layout.clipped, false, "clipped main controls at " + width);
      assert.equal(layout.financialInputs, 0);
      assert.match(layout.font, /Poppins/);
      assert.equal(layout.fontsLoaded, true, "local Poppins faces loaded at " + width);
      assert.equal(layout.bannerColor, "rgb(255, 255, 255)");
      assert.match(layout.bannerImage, /linear-gradient/);
      assert.equal(layout.tocOpen, width > 760);
      assert.equal(layout.tocPosition, width > 760 ? "sticky" : "static");
      await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, `refund-${width}.png`) });
      if ([1440, 390].includes(width))
      {
        await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, `refund-full-${width}.png`), fullPage: true });
      }
      checks.push("layout, hierarchy, banner and read-only guide at " + width);
    }

    await open();
    const startingUrl = page.url();
    const ids = ["pembatalan", "nominal-ongkir", "metode-waktu", "status-refund", "komplain", "kasus-khusus", "pertanyaan"];
    for (const id of [...ids, ...ids.toReversed()])
    {
      await scrollToHeading(id);
      assert.equal(await page.$$eval('#refund-toc [aria-current="location"]', (links) => links.length), 1);
    }
    assert.equal(page.url(), startingUrl);
    await page.focus('#refund-toc a[href="#metode-waktu"]');
    await page.keyboard.press("Enter");
    await settle();
    assert.equal(new URL(page.url()).hash, "#metode-waktu");
    assert.equal(await page.evaluate(() => document.activeElement.id), "metode-waktu");
    const historySnapshot = await page.evaluate(() =>
    ({ url: location.href, depth: history.state.refundGuideDepth, count: history.length }));
    await scrollToHeading("pembatalan");
    assert.deepEqual(await page.evaluate(() =>
    ({ url: location.href, depth: history.state.refundGuideDepth, count: history.length })), historySnapshot);
    await scrollToHeading("metode-waktu");
    await settle();
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "refund-methods-1440.png") });
    checks.push("scroll spy in both directions, keyboard anchors and stable return history");

    await open(PAGE_PATH, 390);
    await page.focus(".skip-link");
    await page.keyboard.press("Enter");
    await settle();
    assert.equal(await page.evaluate(() => document.activeElement.id), "information-main");
    assert.ok(await page.evaluate(() => scrollY > 0));
    await open(PAGE_PATH + "#metode-waktu");
    await settle();
    assert.ok(await page.$eval("#metode-waktu", (heading) => heading.getBoundingClientRect().top >= 0));
    await open(PAGE_PATH + "#bagian-lama");
    assert.equal(await page.evaluate(() => scrollY), 0);
    await scrollToHeading("status-refund");
    checks.push("skip link, direct fragments and recovery from a missing fragment");

    await open(PAGE_PATH, 390);
    await page.focus("#refund-faq-1 summary");
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.getElementById("refund-faq-1").open);
    await page.focus("#refund-faq-2 summary");
    await page.keyboard.press("Space");
    await page.waitForFunction(() => document.querySelectorAll(".shipping-faq details[open]").length === 1);
    assert.equal(await page.$eval("#refund-faq-1", (element) => element.open), false);
    await settle();
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "refund-faq-390.png") });
    await page.focus('.shipping-help a[href="/pages/public/contact.html"]');
    const readingScroll = await page.evaluate(() => scrollY);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.keyboard.press("Enter")
    ]);
    await page.goBack({ waitUntil: "networkidle0" });
    await settle();
    assert.equal(await page.$eval("#refund-faq-2", (element) => element.open), true);
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - readingScroll) < 200);
    checks.push("native FAQ keyboard, single-open behaviour and return restores reading context");

    await open("/pages/customer/order-detail.html");
    await page.waitForSelector("#order-number");
    const orderIdentity = await page.$eval("#order-number", (element) => element.textContent);
    const orderUrl = page.url();
    await page.click('[data-order-action="help"]');
    await page.waitForSelector("#payment-dialog[open]");
    await follow('#payment-dialog a[href="' + PAGE_PATH + '"]');
    await page.waitForSelector("#refund-return:not([hidden])");
    assert.equal(await page.$eval("#refund-return", (element) => element.textContent), "Kembali ke Detail Pesanan");
    await page.click('#refund-toc a[href="#metode-waktu"]');
    await page.click('#refund-toc a[href="#komplain"]');
    await page.goBack({ waitUntil: "networkidle0" });
    await follow("#refund-return");
    await page.waitForSelector("#order-number");
    assert.equal(page.url(), orderUrl);
    assert.equal(await page.$eval("#order-number", (element) => element.textContent), orderIdentity);
    checks.push("order help and contextual return after several fragments preserve the source order");

    await open("/pages/customer/payment.html");
    const paymentUrl = page.url();
    await follow('footer [data-storefront-page="Pembatalan & Refund"]');
    await page.waitForSelector("#refund-return:not([hidden])");
    assert.equal(await page.$eval("#refund-return", (element) => element.textContent), "Kembali ke Pembayaran");
    await page.click('#refund-toc a[href="#status-refund"]');
    await follow("#refund-return");
    assert.equal(page.url(), paymentUrl);
    checks.push("contextual return restores the source payment route");

    for (const source of ["/pages/public/home.html", "/pages/public/faq.html", "/pages/public/shipping-information.html",
      "/pages/customer/my-orders.html", "/pages/customer/cart.html", "/pages/customer/checkout.html"])
    {
      await open(source);
      assert.equal(await page.$eval('footer [data-storefront-page="Pembatalan & Refund"]',
        (link) => link.getAttribute("href")), PAGE_PATH, source);
    }
    checks.push("central footer route across six existing public and customer pages");

    await page.evaluate(() => sessionStorage.setItem("rylva-account-preview-access-v1", "signed-out"));
    await open();
    assert.equal(await page.$eval("#refund-return", (element) => element.hidden), true);
    await follow('.refund-actions a[href="/pages/customer/my-orders.html"]');
    assert.match(await page.$eval("main", (element) => element.textContent), /Masuk/i);
    await open();
    await page.type("#storefront-search-input", "monstera");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.keyboard.press("Enter")
    ]);
    assert.equal(new URL(page.url()).pathname, "/pages/public/catalog.html");
    assert.equal(new URL(page.url()).searchParams.get("q"), "monstera");
    checks.push("public guest reading, protected orders destination and global catalogue search");

    for (const alias of ["/cancellation-refund.html", "/pembatalan-refund.html"])
    {
      await open(alias);
      assert.equal(new URL(page.url()).pathname, PAGE_PATH);
    }
    await page.setJavaScriptEnabled(false);
    await open(PAGE_PATH, 390);
    await page.click('#refund-toc a[href="#komplain"]');
    assert.equal(new URL(page.url()).hash, "#komplain");
    await page.focus("#refund-faq-1 summary");
    await page.keyboard.press("Enter");
    assert.equal(await page.$eval("#refund-faq-1", (element) => element.open), true);
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "refund-no-script-390.png") });
    await page.setJavaScriptEnabled(true);
    checks.push("route aliases, static article, anchors and FAQ without JavaScript");

    await open("/__preview/cancellation-refund");
    await page.select("#preview-width", "320");
    await page.select("#preview-state", "long-text");
    await page.waitForFunction(() =>
      document.getElementById("preview-frame").contentDocument?.getElementById("pembatalan")?.textContent.includes("kebutuhan")
        || document.getElementById("preview-frame").contentDocument?.getElementById("pembatalan")?.textContent.includes("tahap persiapan"));
    const frame = await (await page.$("#preview-frame")).contentFrame();
    assert.equal(await frame.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    checks.push("development-only workbench and overlong content at 320px");

    assert.deepEqual(errors, []);
    assert.deepEqual(failedResources, []);
    assert.deepEqual(writes, [], "guide navigation does not submit financial requests");
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "verification.json"),
      JSON.stringify({ checks, errors, failedResources, writes }, null, 2));
    checks.forEach((check) => console.log("PASS " + check));
  }
  finally
  {
    await browser.close();
  }
}

verifyCancellationRefund().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
