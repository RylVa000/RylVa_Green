"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_INFORMATION_URL || "http://127.0.0.1:4185";
const OUTPUT_DIRECTORY = path.resolve(process.env.RYLVA_CARE_REPORT_DIR || "storage/reports/care-guides");

async function verifyCareGuides()
{
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  const browser = await runtime.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true,
    userDataDir: path.join(OUTPUT_DIRECTORY, "chrome-verification")
  });
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const checks = [];
  const captures = [];
  const errors = [];
  const failedResources = [];
  const writes = [];
  page.setDefaultTimeout(10000);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) =>
  {
    if (!["GET", "HEAD"].includes(request.method()))
    {
      writes.push(request.method() + " " + request.url());
    }
  });
  page.on("response", (response) =>
  {
    if (response.url().startsWith(BASE_URL) && response.status() >= 400
      && !/care-missing-example|favicon/.test(response.url()))
    {
      failedResources.push(response.url());
    }
  });

  async function open(query = "", width = 1440, wait = true)
  {
    await page.setViewport({ width, height: 1000 });
    await page.goto(BASE_URL + "/pages/public/care-guides.html" + query, { waitUntil: "networkidle0" });
    if (wait)
    {
      await page.waitForFunction(() => document.getElementById("care-guides").getAttribute("aria-busy") === "false");
    }
    await page.evaluate(() => document.fonts.ready);
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
    if (process.env.RYLVA_CARE_SKIP_CAPTURES === "1")
    {
      return;
    }
    await page.evaluate(async () =>
    {
      scrollTo({ top: 0, behavior: "instant" });
      document.querySelectorAll("img").forEach((image) => image.loading = "eager");
      await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
    });
    await new Promise((resolve) => setTimeout(resolve, 420));
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, name), fullPage: true });
    captures.push(name);
  }

  async function noOverflow()
  {
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const clipped = await page.$$eval(".care-card, .care-filters, .care-state", (elements) =>
      elements.filter((element) => element.scrollWidth > element.clientWidth + 1).length);
    assert.equal(clipped, 0);
  }

  try
  {
    for (const width of [1920, 1440, 1024, 768, 390, 320])
    {
      await open("", width);
      assert.equal(await page.$$eval(".care-card", (cards) => cards.length), 6);
      assert.equal(await page.$$eval("h1", (heads) => heads.length), 1);
      assert.equal(await page.$$eval('footer [aria-current="page"]', (links) => links.length), 1);
      assert.equal(await page.$eval('footer [aria-current="page"]', (link) => link.dataset.storefrontPage), "Panduan Perawatan");
      assert.equal(await page.$eval("#care-count", (element) => element.textContent), "Menampilkan 6 dari 6 panduan");
      assert.equal(await page.$eval(".policy-banner", (element) => getComputedStyle(element).color), "rgb(255, 255, 255)");
      assert.deepEqual(await page.evaluate(() => [400, 500, 600, 700].map((weight) =>
        document.fonts.check(`${weight} 16px Poppins`))), [true, true, true, true]);
      await noOverflow();
      await capture(`care-guides-${width}.png`);
    }
    checks.push("Six widths render six sourced guides, settled Poppins, consistent green/white banner and no overflow");

    await open();
    await input("#care-search", "SPATHIPHYLLUM");
    assert.equal(await page.$$eval(".care-card", (cards) => cards.length), 1);
    assert.equal(await page.$eval(".care-card h2", (element) => element.textContent), "Peace Lily");
    await input("#care-search", "penyiraman");
    assert.equal(await page.$$eval(".care-card", (cards) => cards.length), 5);
    await input("#care-search", "");
    await page.click('[data-care-topic="water"]');
    await page.select("#care-type", "outdoor");
    assert.match(await page.$eval(".care-state h2", (element) => element.textContent), /tidak ditemukan/);
    await capture("care-no-results-1440.png");
    await page.click("[data-care-reset]");
    assert.equal(await page.evaluate(() => document.activeElement.id), "care-search");
    assert.equal(await page.$$eval(".care-card", (cards) => cards.length), 6);
    assert.equal(await page.$eval('[data-care-topic="all"]', (element) => element.getAttribute("aria-pressed")), "true");
    checks.push("Search covers common/scientific names and topics; combined filters update directly; Reset restores results and focus");

    await page.select("#care-sort", "nameAsc");
    assert.equal(await page.$eval(".care-card h2", (element) => element.textContent), "Aglaonema");
    await page.select("#care-sort", "nameDesc");
    assert.equal(await page.$eval(".care-card h2", (element) => element.textContent), "Petunia");
    await page.select("#care-type", "outdoor");
    const sharedUrl = page.url();
    await page.reload({ waitUntil: "networkidle0" });
    assert.equal(await page.$eval("#care-sort", (element) => element.value), "nameDesc");
    assert.equal(await page.$eval("#care-type", (element) => element.value), "outdoor");
    assert.equal(page.url(), sharedUrl);
    checks.push("Sorting and shareable URL preserve type, topic, query and order through reload");

    await open("?q=monstera&topic=water&guide=monstera", 1440);
    assert.equal(await page.$eval("#guide-monstera details", (element) => element.open), true);
    await page.focus("#guide-monstera summary");
    await page.keyboard.press("Space");
    await page.waitForFunction(() => !document.querySelector("#guide-monstera details").open);
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelector("#guide-monstera details").open);
    await capture("care-reading-1440.png");
    assert.equal(await page.$$eval(".care-source a", (links) => links.every((link) =>
      link.protocol === "https:" && link.target === "_blank" && link.rel.includes("noopener"))), true);
    await page.click('[data-home-detail="monstera"]');
    await page.waitForSelector("#product-title");
    assert.equal(await page.$eval("#product-back", (element) => element.textContent), "Panduan Perawatan");
    await page.click("#product-back");
    await page.waitForFunction(() => location.pathname === "/pages/public/care-guides.html");
    await page.waitForFunction(() => document.activeElement.dataset.homeDetail === "monstera");
    assert.equal(await page.$eval("#care-search", (element) => element.value), "monstera");
    assert.equal(await page.$eval("#guide-monstera details", (element) => element.open), true);
    assert.equal(new URL(page.url()).searchParams.get("topic"), "water");
    checks.push("Native disclosure supports keyboard and source links; product Detail/Back restores filters, reading state and focus");

    await open("?preview=care-guides&state=loading", 390, false);
    assert.equal(await page.$eval("#care-guides", (element) => element.getAttribute("aria-busy")), "true");
    await capture("care-loading-390.png");
    await page.waitForSelector(".care-card");
    checks.push("Loading skeleton resolves to the list without removing controls");

    for (const state of ["loadError", "offline", "timeout", "maintenance"])
    {
      await open(`?preview=care-guides&state=${state}&q=monstera&topic=water`, 390);
      await page.waitForSelector("[data-care-retry]");
      if (state === "loadError")
      {
        await capture("care-error-390.png");
      }
      await page.click("[data-care-retry]");
      await page.waitForSelector(".care-card");
      assert.equal(await page.$$eval(".care-card", (cards) => cards.length), 1);
      assert.equal(await page.$eval("#care-search", (element) => element.value), "monstera");
      assert.equal(await page.$eval("#care-count", (element) => element.textContent), "Menampilkan 1 dari 6 panduan");
    }
    checks.push("Load failure, offline, timeout and maintenance offer retry while retaining query and topic");

    await open("?preview=care-guides&state=empty", 390);
    assert.match(await page.$eval(".care-state h2", (element) => element.textContent), /belum tersedia/);
    assert.equal(await page.$eval(".care-state a", (element) => element.pathname), "/pages/public/contact.html");
    await capture("care-empty-390.png");
    await open("?preview=care-guides&state=partial", 390);
    assert.equal(await page.$$eval(".care-card", (cards) => cards.length), 3);
    assert.equal(await page.$eval("#care-notice", (element) => element.hidden), false);
    await capture("care-partial-390.png");
    await open("?preview=care-guides&state=invalidData", 390);
    assert.equal(await page.$$eval(".care-card", (cards) => cards.length), 4);
    assert.equal(await page.$$eval('.care-main a[href^="javascript:"]', (links) => links.length), 0);
    checks.push("Collection empty differs from no results; partial and invalid entries preserve usable data without unsafe sources");

    await open("?preview=care-guides&state=brokenImage", 390);
    await page.waitForFunction(() => document.querySelector("#guide-monstera .care-photo img").hidden);
    assert.equal(await page.$eval("#guide-monstera .care-photo span", (element) => element.hidden), false);
    await capture("care-broken-image-390.png");
    await open("?preview=care-guides&state=longContent&guide=monstera", 320);
    await noOverflow();
    await capture("care-long-content-320.png");
    checks.push("Broken images keep identity readable; long content wraps at 320 pixels");

    await open("?guide=unknown&topic=forged&type=forged&sort=forged&q=%3Cscript%3E", 390);
    assert.equal(await page.$eval("#care-notice", (element) => element.hidden), false);
    assert.equal(await page.$eval("#care-type", (element) => element.value), "all");
    assert.equal(await page.$$eval(".care-main script", (elements) => elements.length), 0);
    await page.click("[data-care-reset]");
    assert.equal(await page.$eval("#care-notice", (element) => element.hidden), true);
    await open("#guide-petunia", 390);
    assert.equal(await page.$eval("#guide-petunia details", (element) => element.open), true);
    checks.push("Invalid query parameters and missing guide recover safely; direct anchor opens its native summary");

    await open("", 390);
    await page.setOfflineMode(true);
    await page.waitForFunction(() => !document.getElementById("care-connection").hidden);
    await page.click("#guide-monstera summary");
    assert.equal(await page.$eval("#guide-monstera details", (element) => element.open), true);
    await page.setOfflineMode(false);
    await page.waitForFunction(() => document.getElementById("care-connection").hidden);
    checks.push("Offline after load preserves readable summaries and clears its notice on reconnection");

    await open("", 1440);
    await input("#storefront-search-input", "petunia");
    await page.$eval("#storefront-search", (element) => element.requestSubmit());
    await page.waitForFunction(() => location.pathname === "/pages/public/catalog.html");
    assert.equal(new URL(page.url()).searchParams.get("q"), "petunia");
    await page.goto(BASE_URL + "/pages/public/contact.html", { waitUntil: "networkidle0" });
    assert.equal(await page.$$eval('footer [data-storefront-page="Panduan Perawatan"]', (links) => links.length), 1);
    await page.click('footer [data-storefront-page="Panduan Perawatan"]');
    await page.waitForFunction(() => location.pathname === "/pages/public/care-guides.html");
    checks.push("Global product search stays separate; existing footer exposes one native care-guide entry");

    for (const alias of ["care-guides.html", "panduan-perawatan.html"])
    {
      await page.goto(BASE_URL + "/" + alias + "?q=petunia", { waitUntil: "networkidle0" });
      assert.equal(new URL(page.url()).pathname, "/pages/public/care-guides.html");
      assert.equal(await page.$eval(".care-card h2", (element) => element.textContent), "Petunia");
    }
    await page.goto(BASE_URL + "/__preview/care-guides", { waitUntil: "networkidle0" });
    assert.equal(await page.$$eval("#scenarios a", (links) => links.length), 11);
    checks.push("Both route aliases retain the query; isolated workbench exposes eleven scenarios");

    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await open("", 390);
    assert.equal(await page.$eval(".care-photo img", (element) => getComputedStyle(element).transitionDuration), "0s");
    await page.keyboard.press("Tab");
    await page.evaluate(() => document.querySelector(".skip-link").focus());
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.activeElement.id), "information-main");
    await page.setJavaScriptEnabled(false);
    await page.goto(BASE_URL + "/pages/public/care-guides.html", { waitUntil: "networkidle0" });
    assert.equal(await page.$eval("#care-fallback", (element) => element.hidden), false);
    assert.equal(await page.$$eval("#care-fallback a", (links) => links.length), 6);
    assert.equal(await page.$eval("#care-filters", (element) => element.hidden), true);
    assert.equal(await page.$$eval('footer [aria-current="page"]', (links) => links.length), 1);
    assert.equal(await page.$eval('footer [aria-current="page"]', (link) => link.dataset.storefrontPage), "Panduan Perawatan");
    await capture("care-no-script-390.png");
    checks.push("Reduced motion, skip link and no-JavaScript native source directory remain usable");

    assert.deepEqual(errors, []);
    assert.deepEqual(failedResources, []);
    assert.deepEqual(writes, []);
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "verification.json"),
      JSON.stringify({ checks, captures, errors, failedResources, writes }, null, 2));
    checks.forEach((check) => console.log("PASS " + check));
  }
  finally
  {
    await browser.close();
  }
}

verifyCareGuides().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
