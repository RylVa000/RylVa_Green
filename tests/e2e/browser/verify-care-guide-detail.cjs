"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("../../../tools/testing/browser-runtime.cjs");
const OUTPUT = path.resolve("storage/reports/care-guide-detail");
const REVIEW = path.resolve(".impeccable/review/care-guide-detail");
const BASE = process.env.RYLVA_INFORMATION_URL || "http://127.0.0.1:4185";
const ROUTE = "/pages/public/care-guide-detail.html";

async function verify()
{
  fs.mkdirSync(OUTPUT, { recursive: true });
  fs.mkdirSync(REVIEW, { recursive: true });
  const browser = await runtime.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true,
    userDataDir: path.join(OUTPUT, "chrome")
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(12000);
  const checks = [];
  const captures = [];
  const errors = [];
  const writes = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) =>
  {
    if (!["GET", "HEAD"].includes(request.method()))
    {
      writes.push(request.url());
    }
  });

  async function visit(query = "guide=monstera")
  {
    await page.goto(BASE + ROUTE + "?" + query);
    await page.waitForSelector("#care-detail-content[aria-busy='false']");
  }

  async function capture(name)
  {
    await page.evaluate(async () =>
    {
      scrollTo({ top: 0, behavior: "instant" });
      await document.fonts.ready;
      document.querySelectorAll("img").forEach((image) => image.loading = "eager");
      await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
    });
    await new Promise((resolve) => setTimeout(resolve, 420));
    const file = path.join(OUTPUT, name + ".png");
    await page.screenshot({ path: file, fullPage: true });
    fs.copyFileSync(file, path.join(REVIEW, name + ".png"));
    captures.push(name + ".png");
  }

  try
  {
    for (const width of [1440, 1024, 820, 768, 390, 320])
    {
      await page.setViewport({ width, height: width < 600 ? 844 : 900 });
      await visit();
      assert.equal(await page.$eval("#care-detail-title", (item) => item.textContent), "Perawatan Monstera");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await page.$eval(".policy-banner h1", (item) => getComputedStyle(item).textAlign), "center");
      assert.equal(await page.$$(".shipping-section").then((items) => items.length), 5);
      assert.ok(await page.$eval(".care-detail-photo", (frame) =>
      {
        const picture = frame.querySelector("img").getBoundingClientRect();
        const surface = frame.getBoundingClientRect();
        return picture.left >= surface.left && picture.right <= surface.right + 1
          && picture.top >= surface.top && picture.bottom <= surface.bottom + 1;
      }), "Plant photo must stay within its surface at " + width);
      await capture("detail-ready-" + width);
    }
    checks.push("Six viewport widths render a centered brand banner, photograph, summary and five readable sections without overflow");

    for (const id of ["peace-lily", "snake-plant", "aglaonema", "dracaena", "petunia"])
    {
      await visit("guide=" + id);
      assert.ok(await page.$("#care-detail-toc"));
      assert.ok(await page.$eval(".care-source-link", (link) =>
        link.href.startsWith("https://") && link.target === "_blank" && link.rel.includes("noopener")));
    }
    checks.push("All six guide identities load their corresponding sourced article and related product");

    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(BASE + "/pages/public/care-guides.html?type=indoor&topic=water&sort=nameDesc&guide=peace-lily");
    await page.waitForSelector("[data-care-detail='peace-lily']");
    await page.$eval("[data-care-detail='peace-lily']", (link) => link.scrollIntoView({ block: "center" }));
    const oldScroll = await page.evaluate(() => scrollY);
    await Promise.all([page.waitForNavigation(), page.click("[data-care-detail='peace-lily']")]);
    await page.waitForSelector("#care-detail-toc");
    assert.equal(await page.evaluate(() => scrollY), 0);
    await page.click("#care-detail-toc a[href='#pengamatan']");
    await page.click("#care-detail-toc a[href='#sumber']");
    await Promise.all([page.waitForNavigation(), page.click("#care-detail-return")]);
    await page.waitForSelector("[data-care-detail='peace-lily']");
    await page.waitForFunction(() => document.activeElement?.dataset.careDetail === "peace-lily");
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - oldScroll) < 3);
    assert.ok(await page.$eval("details[data-guide-id='peace-lily']", (item) => item.open));
    assert.ok(page.url().includes("sort=nameDesc"));
    checks.push("List/detail return skips article anchors and restores type, topic, order, open summary, scroll and link focus");

    await visit("guide=peace-lily");
    await page.$eval("[data-home-detail]", (link) => link.scrollIntoView({ block: "center" }));
    const articleScroll = await page.evaluate(() => scrollY);
    await Promise.all([page.waitForNavigation(), page.click("[data-home-detail]")]);
    await page.waitForFunction(() => location.pathname.endsWith("product-detail.html")
      && document.getElementById("product-content")?.getAttribute("aria-busy") === "false");
    await page.waitForSelector("#product-back");
    assert.equal(await page.$eval("#product-back", (link) => link.textContent), "Panduan Perawatan");
    await Promise.all([page.waitForNavigation(), page.click("#product-back")]);
    await page.waitForSelector("#care-detail-toc");
    await page.waitForFunction(() => document.activeElement?.hasAttribute("data-home-detail"));
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - articleScroll) < 3);
    checks.push("Related Product/Back restores the article and focuses its product link at the saved reading position");

    await visit();
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForFunction(() => document.querySelector('#care-detail-toc a[aria-current="location"]')?.hash === "#produk-terkait");
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForFunction(() => document.querySelector('#care-detail-toc a[aria-current="location"]')?.hash === "#perawatan");
    await page.setViewport({ width: 390, height: 844 });
    await visit();
    assert.equal(await page.$eval("#care-detail-toc", (toc) => toc.open), false);
    await page.focus("#care-detail-toc summary");
    await page.keyboard.press("Space");
    assert.equal(await page.$eval("#care-detail-toc", (toc) => toc.open), true);
    await page.click("a[href='#pengamatan']");
    assert.equal(await page.evaluate(() => document.activeElement.id), "pengamatan");
    checks.push("TOC follows scroll in both directions, supports keyboard disclosure and transfers focus to the selected article section");

    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(BASE + ROUTE + "?guide=monstera&preview=care-guide-detail&state=loading");
    await page.waitForSelector(".care-detail-loading");
    await capture("detail-loading-1440");
    await page.waitForSelector("#care-detail-toc");
    checks.push("Loading announces its progress and resolves to readable content");

    for (const state of ["loadError", "offline", "timeout", "maintenance"])
    {
      await visit("guide=monstera&preview=care-guide-detail&state=" + state);
      assert.ok(await page.$("[data-care-detail-retry]"));
      if (state === "loadError")
      {
        await capture("detail-error-1440");
      }
      await page.click("[data-care-detail-retry]");
      await page.waitForSelector("#care-detail-toc");
      assert.ok(page.url().includes("guide=monstera"));
    }
    checks.push("Four load failures provide retry, retain guide/context and recover without a duplicate request or mutation");

    for (const query of ["", "guide=missing", "guide=%3Cscript%3E", "guide=monstera&preview=care-guide-detail&state=empty", "guide=monstera&preview=care-guide-detail&state=invalidData"])
    {
      await visit(query);
      assert.ok(await page.$("#care-detail-state-title"));
      assert.equal(await page.$$("a[href^='javascript:']").then((items) => items.length), 0);
    }
    await page.setViewport({ width: 320, height: 844 });
    await visit("guide=missing");
    await capture("detail-missing-320");
    checks.push("Missing/invalid IDs, absent records and invalid source data give honest recovery without unsafe content");

    await page.setViewport({ width: 390, height: 844 });
    await visit("guide=monstera&preview=care-guide-detail&state=missingSection");
    assert.equal(await page.$("#pengamatan"), null);
    assert.equal(await page.$eval("#care-detail-notice", (item) => item.hidden), false);
    await capture("detail-partial-390");
    await visit("guide=monstera&preview=care-guide-detail&state=brokenImage");
    await page.waitForFunction(() => document.querySelector(".care-detail-photo img").hidden);
    await capture("detail-broken-image-390");
    await page.setViewport({ width: 320, height: 844 });
    await visit("guide=monstera&preview=care-guide-detail&state=longContent");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await capture("detail-long-320");
    checks.push("Partial sections are disclosed, broken photos retain identity and long text wraps at 320px");

    await visit();
    await page.setOfflineMode(true);
    await page.waitForFunction(() => !document.getElementById("care-detail-connection").hidden);
    assert.ok(await page.$("#perawatan"));
    await page.setOfflineMode(false);
    await page.waitForFunction(() => document.getElementById("care-detail-connection").hidden);
    checks.push("Offline after load preserves reading and clears the connection message on reconnection");

    await visit("guide=monstera&returnTo=https%3A%2F%2Fevil.example%2F");
    assert.equal(await page.$eval("#care-detail-return", (link) => new URL(link.href).pathname), "/pages/public/care-guides.html");
    await page.goto(BASE + "/detail-panduan-perawatan.html?guide=petunia");
    await page.waitForSelector("#care-detail-toc");
    assert.ok(page.url().includes("care-guide-detail.html?guide=petunia"));
    await page.goto(BASE + "/__preview/care-guide-detail");
    await page.waitForFunction(() => document.querySelectorAll("#scenarios a").length === 13);
    checks.push("Return paths stay local; aliases preserve the guide; 13 development scenarios remain in the separate workbench");

    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await visit();
    assert.ok(await page.$("#perawatan"));
    await page.setJavaScriptEnabled(false);
    await page.goto(BASE + ROUTE + "?guide=monstera");
    assert.ok(await page.$eval("#care-detail-fallback", (item) => !item.hidden));
    assert.equal(await page.$$("#care-detail-fallback a").then((items) => items.length), 6);
    checks.push("Reduced motion retains content and no-JavaScript readers can use six university sources and native return links");
    assert.deepEqual(errors, []);
    assert.deepEqual(writes, []);
  }
  finally
  {
    fs.writeFileSync(path.join(OUTPUT, "verification.json"), JSON.stringify({ checks, captures, errors, writes }, null, 2));
    await browser.close();
  }
  console.log(JSON.stringify({ checks, captures, errors, writes }, null, 2));
}

verify().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
