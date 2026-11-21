"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("../../../tools/testing/browser-runtime.cjs");
const { inspectDocument } = require("../../../tools/testing/audit-public-ui.cjs");
const BASE_URL = process.env.RYLVA_AUDIT_URL || "http://127.0.0.1:4185";
const OUTPUT = path.resolve("storage/reports/public-ui-fixes-2026-11-20");

async function verify()
{
  fs.mkdirSync(OUTPUT, { recursive: true });
  const browser = await runtime.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true
  });
  const checks = [];
  const evidence = {};

  try
  {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", (request) =>
    {
      if (request.url().startsWith(BASE_URL) || request.url().startsWith("data:"))
      {
        request.continue();
      }
      else
      {
        request.abort();
      }
    });
    const fontRequests = [];
    page.on("request", (request) =>
    {
      if (request.url().includes("/fonts/"))
      {
        fontRequests.push(request.url());
      }
    });
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(BASE_URL + "/pages/public/product-detail.html?product=monstera", { waitUntil: "networkidle0" });
    await page.waitForFunction(() => document.getElementById("product-content")?.getAttribute("aria-busy") === "false");
    await page.evaluate(() => document.fonts.ready);
    evidence.fontRequests = [...fontRequests];
    assert.ok(fontRequests.every((url) => url.endsWith(".woff2") && !url.includes("/inter/")));
    assert.equal(new Set(fontRequests).size, fontRequests.length, "Each font face is requested once");

    const client = await page.createCDPSession();
    await client.send("DOM.enable");
    await client.send("CSS.enable");
    const documentNode = await client.send("DOM.getDocument");
    const heading = await client.send("DOM.querySelector",
    {
      nodeId: documentNode.root.nodeId,
      selector: ".storefront-footer h2 button"
    });
    evidence.footerFonts = (await client.send("CSS.getPlatformFontsForNode", { nodeId: heading.nodeId })).fonts;
    assert.ok(evidence.footerFonts.some((font) => font.familyName === "Poppins" && font.isCustomFont));
    await client.detach();
    checks.push("Poppins WOFF2 renders footer text; no Inter or TTF request");

    evidence.thumbnails = await page.$$eval(".product-thumbnail img", (images) => images.map((image) =>
    ({ source: image.currentSrc, naturalWidth: image.naturalWidth })));
    assert.equal(evidence.thumbnails.length, 3);
    assert.ok(evidence.thumbnails.every((image) => image.source.endsWith("-thumb.webp")
      && image.naturalWidth > 0 && image.naturalWidth <= 160));
    const expectedPhotos = ["monstera-main", "monstera-room", "monstera-close"];
    for (const index of [0, 1, 2])
    {
      await page.click('[data-product-image="' + index + '"]');
      await page.waitForFunction((expectedPhoto) =>
      {
        const image = document.getElementById("product-main-image");
        return image.complete && image.naturalWidth > 0 && image.currentSrc.includes(expectedPhoto);
      }, {}, expectedPhotos[index]);
      assert.equal(await page.$eval('[data-product-image="' + index + '"]', (button) => button.getAttribute("aria-pressed")), "true");
      assert.match(await page.$eval("#product-main-image", (image) => image.currentSrc), /\.webp$/);
    }
    checks.push("Three distinct photos remain selectable with dedicated loaded thumbnails");

    for (const [route, title] of [["contact", "Hubungi Kami"], ["faq", "Pertanyaan Umum"]])
    {
      await page.goto(BASE_URL + "/pages/public/" + route + ".html", { waitUntil: "networkidle0" });
      for (const width of [1440, 768, 390, 320])
      {
        await page.setViewport({ width, height: 1000 });
        const result = await page.$eval("main h1", (element) =>
        ({ text: element.textContent, size: getComputedStyle(element).fontSize, align: getComputedStyle(element).textAlign }));
        assert.equal(result.text, title);
        assert.equal(result.size, width <= 600 ? "28px" : "36px");
        assert.equal(result.align, "center");
        assert.equal(await page.$eval('[aria-current="page"]', (element) => element.textContent), title);
        assert.ok(await page.$('main nav a[href="/pages/public/home.html"]'));
      }
    }
    checks.push("Contact/FAQ use matching responsive titles and navigable breadcrumbs");

    await page.goto(BASE_URL + "/pages/customer/payment.html?state=pending", { waitUntil: "networkidle0" });
    evidence.paymentDates = await page.evaluate(() =>
    {
      return ["2026-11-20T16:59:00Z", "2026-11-20T17:01:00Z", "2026-12-31T17:01:00Z"].map((iso) =>
      {
        const snapshot = window.RylvaPaymentPreview.createSnapshot("pending", Date.parse(iso));
        return { createdAt: snapshot.createdAt, deliveryDate: snapshot.deliveryDate };
      });
    });
    assert.deepEqual(evidence.paymentDates.map((item) => item.deliveryDate), ["2026-11-21", "2026-11-22", "2027-01-02"]);
    assert.equal(await page.evaluate(() => window.RylvaStorefrontFormat.money(128999)), "Rp 128.999");
    assert.equal(await page.evaluate(() => window.RylvaStorefrontFormat.money(null)), "Belum tersedia");
    checks.push("Fixture delivery dates follow WIB across midnight/year boundaries; IDR formatting retains missing-price fallback");

    await page.goto(BASE_URL + "/pages/customer/bouquet-customizer.html?preview=bouquet&state=normal", { waitUntil: "networkidle0" });
    await page.waitForFunction(() => document.getElementById("bouquet-content")?.getAttribute("aria-busy") === "false");
    evidence.bouquetContrast = (await page.evaluate(inspectDocument)).contrast;
    assert.deepEqual(evidence.bouquetContrast, []);
    await page.screenshot({ path: path.join(OUTPUT, "bouquet-contrast-final.png"), fullPage: true });
    checks.push("Active bouquet navigation text passes solid-background contrast check");

    const cartContext = await browser.createBrowserContext();
    const cartPage = await cartContext.newPage();
    const failedCartResources = [];
    cartPage.on("response", (response) =>
    {
      if (response.status() >= 400)
      {
        failedCartResources.push(response.url());
      }
    });
    await cartPage.goto(BASE_URL + "/pages/customer/cart.html?preview=cart&state=normal", { waitUntil: "networkidle0" });
    assert.match(await cartPage.$eval('link[rel="icon"]', (link) => link.href), /storefront\/favicon.svg$/);
    assert.deepEqual(failedCartResources, []);
    evidence.cartFailedResources = failedCartResources;
    await cartContext.close();
    checks.push("Cold Cart navigation loads its favicon without a missing-resource response");
    fs.writeFileSync(path.join(OUTPUT, "targeted-verification.json"), JSON.stringify({ checks, evidence }, null, 2));
    console.log(JSON.stringify({ checks, evidence }, null, 2));
  }
  finally
  {
    fs.writeFileSync(path.join(OUTPUT, "targeted-evidence.json"), JSON.stringify(evidence, null, 2));
    await browser.close();
  }
}

verify().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
