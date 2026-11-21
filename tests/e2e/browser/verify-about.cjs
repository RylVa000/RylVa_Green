"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_INFORMATION_URL || "http://127.0.0.1:4185";
const PAGE_PATH = "/pages/public/about.html";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/about");

async function verifyAbout()
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
  page.on("request", (request) =>
  {
    if (!["GET", "HEAD"].includes(request.method()))
    {
      writes.push(request.method() + " " + request.url());
    }
  });

  async function settle()
  {
    await new Promise((resolve) => setTimeout(resolve, 450));
  }

  async function open(route = PAGE_PATH, width = 1440)
  {
    await page.setViewport({ width, height: 1000, isMobile: width < 600, hasTouch: width < 600 });
    await page.goto(BASE_URL + route, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
    if (!new URL(page.url()).hash)
    {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    }
    await settle();
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
        const main = document.querySelector(".about-main");
        const banner = document.querySelector(".policy-banner");
        const heading = main.querySelector("h1");
        const rect = heading.getBoundingClientRect();
        const bannerBounds = banner.getBoundingClientRect();
        const actionBounds = [...banner.querySelectorAll(".about-banner-actions a")]
          .map((link) => link.getBoundingClientRect());
        return {
          mainCount: document.querySelectorAll("main").length,
          headings: main.querySelectorAll("h1").length,
          overflow: document.documentElement.scrollWidth > innerWidth,
          clipped: [...main.querySelectorAll("a, summary")].some((element) =>
          {
            const bounds = element.getBoundingClientRect();
            return bounds.width > 0 && (bounds.left < -1 || bounds.right > innerWidth + 1);
          }),
          font: getComputedStyle(main).fontFamily,
          fontsLoaded: [400, 500, 600, 700].every((weight) =>
            [...document.fonts].some((face) => face.family === "Poppins"
              && face.weight === String(weight) && face.status === "loaded")),
          color: getComputedStyle(banner).color,
          ground: getComputedStyle(banner).backgroundImage,
          centered: getComputedStyle(heading).textAlign === "center"
            && Math.abs(rect.left + rect.width / 2 - innerWidth / 2) < 2,
          actionsInside: actionBounds.length === 2 && actionBounds.every((bounds) =>
            bounds.top >= bannerBounds.top && bounds.bottom <= bannerBounds.bottom),
          actionsCentered: Math.abs((Math.min(...actionBounds.map((bounds) => bounds.left))
            + Math.max(...actionBounds.map((bounds) => bounds.right))) / 2 - innerWidth / 2) < 2,
          tocOpen: document.getElementById("about-toc").open,
          tocPosition: getComputedStyle(document.querySelector(".shipping-sidebar")).position,
          forms: main.querySelectorAll("form, input, textarea").length
        };
      });
      assert.equal(layout.mainCount, 1);
      assert.equal(layout.headings, 1);
      assert.equal(layout.overflow, false, "overflow at " + width);
      assert.equal(layout.clipped, false, "clipped controls at " + width);
      assert.equal(layout.forms, 0);
      assert.match(layout.font, /Poppins/);
      assert.equal(layout.fontsLoaded, true);
      assert.equal(layout.color, "rgb(255, 255, 255)");
      assert.match(layout.ground, /linear-gradient/);
      assert.equal(layout.centered, true);
      assert.equal(layout.actionsInside, true, "shopping buttons stay inside green banner at " + width);
      assert.equal(layout.actionsCentered, true, "shopping buttons are centered at " + width);
      assert.equal(layout.tocOpen, width > 760);
      assert.equal(layout.tocPosition, width > 760 ? "sticky" : "static");
      assert.deepEqual(await page.$$eval('footer [aria-current="page"]', (links) =>
        links.map((link) => link.getAttribute("href"))), [PAGE_PATH]);
      await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, `about-${width}.png`) });
      if ([1440, 390].includes(width))
      {
        await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, `about-full-${width}.png`), fullPage: true });
      }
      checks.push("public layout, loaded Poppins, centered white banner, native current footer at " + width);
    }

    await open();
    const ids = ["kenali-rylva", "untuk-anda", "pilihan-koleksi", "informasi-belanja", "bantuan-rylva"];
    const starting = await page.evaluate(() => ({ url: location.href, history: history.length }));
    for (const id of [...ids, ...ids.toReversed()])
    {
      await page.evaluate((headingId) =>
      {
        const heading = document.getElementById(headingId);
        const header = document.querySelector(".storefront-header");
        window.scrollTo({ top: scrollY + heading.getBoundingClientRect().top - header.offsetHeight - 20 });
      }, id);
      await settle();
      assert.equal(await page.$$eval('#about-toc [aria-current="location"]', (links) => links.length), 1);
      assert.equal(await page.$eval('#about-toc [aria-current="location"]', (link) => link.hash), "#" + id);
    }
    assert.deepEqual(await page.evaluate(() => ({ url: location.href, history: history.length })), starting);
    await page.focus('#about-toc a[href="#informasi-belanja"]');
    await page.keyboard.press("Enter");
    await settle();
    assert.equal(await page.evaluate(() => document.activeElement.id), "informasi-belanja");
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "about-reading-1440.png") });
    checks.push("five sections track scroll both ways without history changes; keyboard anchor focuses heading");

    await open(PAGE_PATH + "#pilihan-koleksi");
    const directClearance = await page.evaluate(() =>
      document.getElementById("pilihan-koleksi").getBoundingClientRect().top
        - document.querySelector(".storefront-header").getBoundingClientRect().bottom);
    assert.ok(directClearance >= 8, "direct anchor clears the visible header");
    await open(PAGE_PATH + "#bagian-lama");
    assert.equal(await page.evaluate(() => scrollY), 0);
    await page.focus(".skip-link");
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.activeElement.id), "information-main");
    checks.push("direct and unknown anchors, keyboard skip link");

    await open(PAGE_PATH, 390);
    await page.focus("#about-toc summary");
    await page.keyboard.press("Enter");
    assert.equal(await page.$eval("#about-toc", (toc) => toc.open), true);
    await page.click('#about-toc a[href="#bantuan-rylva"]');
    await page.focus('.shipping-help a[href="/pages/public/contact.html"]');
    await settle();
    const position = await page.evaluate(() => scrollY);
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "about-help-390.png") });
    await follow('.shipping-help a[href="/pages/public/contact.html"]');
    await page.goBack({ waitUntil: "networkidle0" });
    await settle();
    assert.equal(await page.$eval("#about-toc", (toc) => toc.open), true);
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - position) < 200);
    checks.push("mobile TOC works by keyboard and restores reading position after help");

    const catalogue = "/pages/public/catalog.html?q=monstera&category=plants&sort=price_asc";
    await open(catalogue);
    await page.focus('footer [data-storefront-page="Tentang Kami"]');
    await settle();
    const source = page.url();
    const sourcePosition = await page.evaluate(() => scrollY);
    await follow('footer [data-storefront-page="Tentang Kami"]');
    await page.waitForSelector("#about-return:not([hidden])");
    await page.click('#about-toc a[href="#pilihan-koleksi"]');
    await page.click('#about-toc a[href="#untuk-anda"]');
    await follow("#about-return");
    await settle();
    assert.equal(page.url(), source);
    assert.equal(await page.$eval("#storefront-search-input", (input) => input.value), "monstera");
    assert.equal(await page.$eval('input[name="category"][value="plants"]', (input) => input.checked), true);
    assert.equal(await page.$eval("#catalog-sort", (input) => input.value), "price_asc");
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - sourcePosition) < 200);
    checks.push("context return crosses two article anchors and restores catalogue search, category, sort and scroll");

    for (const route of ["/pages/public/home.html", "/pages/public/contact.html", "/pages/public/privacy-policy.html",
      "/pages/public/shipping-information.html", "/pages/public/how-to-order.html", "/pages/customer/cart.html"])
    {
      await open(route);
      assert.equal(await page.$eval('footer [data-storefront-page="Tentang Kami"]',
        (link) => link.getAttribute("href")), PAGE_PATH);
    }
    checks.push("central footer maps Tentang Kami to the active route on six existing pages");

    await open();
    await follow('.about-banner-actions a[href="/pages/public/catalog.html"]');
    assert.equal(new URL(page.url()).pathname, "/pages/public/catalog.html");
    await open();
    await follow('.about-banner-actions a[href="/pages/public/contact.html"]');
    assert.equal(new URL(page.url()).pathname, "/pages/public/contact.html");
    for (const category of ["plants", "bouquet", "pots", "media", "tools"])
    {
      await open();
      await follow('.about-collections a[href="/pages/public/catalog.html?category=' + category + '"]');
      assert.equal(new URL(page.url()).searchParams.get("category"), category);
      assert.equal(await page.$eval('input[name="category"][value="' + category + '"]', (input) => input.checked), true);
    }
    await open();
    await page.evaluate(() => sessionStorage.setItem("rylva-account-preview-access-v1", "signed-out"));
    await follow('.about-collections a[href="/pages/customer/bouquet-customizer.html"]');
    assert.equal(new URL(page.url()).search, "");
    await page.waitForFunction(() => document.querySelector("#bouquet-content")?.textContent.includes("Masuk untuk meracik"));
    checks.push("banner actions and five category links navigate; bouquet retains guest guard without bypass");

    await open();
    await page.type("#storefront-search-input", "monstera");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.keyboard.press("Enter")
    ]);
    assert.equal(new URL(page.url()).pathname, "/pages/public/catalog.html");
    assert.equal(new URL(page.url()).searchParams.get("q"), "monstera");
    checks.push("shared header search navigates to catalogue with the query");

    for (const alias of ["/about.html", "/about-us.html", "/tentang-kami.html"])
    {
      await open(alias);
      assert.equal(new URL(page.url()).pathname, PAGE_PATH);
    }
    await page.setJavaScriptEnabled(false);
    for (const width of [1440, 1024, 768, 390, 320])
    {
      await open(PAGE_PATH, width);
      await page.click('#about-toc a[href="#informasi-belanja"]');
      assert.equal(new URL(page.url()).hash, "#informasi-belanja");
      const clearance = await page.evaluate(() =>
        document.getElementById("informasi-belanja").getBoundingClientRect().top
          - document.querySelector(".storefront-header").getBoundingClientRect().bottom);
      assert.ok(clearance >= 8, "native anchor header clearance at " + width);
      if (width === 390)
      {
        await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "about-no-script-390.png") });
      }
    }
    await page.setJavaScriptEnabled(true);
    checks.push("English/Indonesian aliases; native article, footer and unobstructed anchors without JavaScript at five sizes");

    await open("/__preview/about");
    await page.select("#preview-width", "320");
    await page.select("#preview-state", "long-text");
    await page.waitForFunction(() => document.getElementById("preview-frame").contentDocument
      ?.getElementById("kenali-rylva")?.textContent.includes("kebutuhan"));
    const frame = await (await page.$("#preview-frame")).contentFrame();
    assert.equal(await frame.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    checks.push("isolated development workbench handles long text at 320px");

    assert.deepEqual(errors, []);
    assert.deepEqual(failedResources, []);
    assert.deepEqual(writes, [], "reading the guide does not submit accounts, consent, orders or payments");
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "verification.json"),
      JSON.stringify({ checks, errors, failedResources, writes }, null, 2));
    checks.forEach((check) => console.log("PASS " + check));
  }
  finally
  {
    await browser.close();
  }
}

verifyAbout().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
