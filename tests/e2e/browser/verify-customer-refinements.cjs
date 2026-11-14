"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_CUSTOMER_URL || "http://127.0.0.1:4180/pages/customer/";
const outputDirectory = path.resolve("storage/reports/customer-refinements");

async function verify()
{
  fs.mkdirSync(outputDirectory, { recursive: true });
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true
  });
  const checks = [];
  const errors = [];
  const screenshots = [];
  try
  {
    const page = await browser.newPage();
    page.setDefaultTimeout(15000);
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("dialog", (dialog) => dialog.accept());
    await page.setViewport({ width: 1440, height: 1000 });
    async function open(pageName, query = "")
    {
      await page.goto(new URL(pageName + query, BASE_URL).href);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() =>
      {
        const root = document.querySelector("#account-root, #orders-root, #order-root");
        return root && root.getAttribute("aria-busy") !== "true" && root.textContent.length > 50;
      });
    }
    async function capture(name, fullPage = false)
    {
      await page.screenshot({ path: path.join(outputDirectory, name + ".png"), fullPage });
      screenshots.push(name + ".png");
    }
    async function accountAction(action)
    {
      await page.click('[data-account-action="' + action + '"]');
    }
    await open("account.html");
    await page.waitForSelector(".account-data-row");
    await capture("profile-desktop");
    await open("account.html", "?section=security");
    await page.waitForSelector(".account-session");
    assert.equal(await page.$$(".account-session").then((items) => items.length), 3);
    assert.equal(await page.$('[data-session-id="session-current"] button'), null);
    await capture("login-desktop", true);
    await accountAction("revokeSession");
    await page.click("#account-submit");
    await page.waitForFunction(() => !document.getElementById("account-dialog").open);
    assert.equal(await page.$('[data-session-id="session-laptop"]'), null);
    assert.ok(await page.$('[data-session-id="session-current"]'));
    await page.reload();
    await page.waitForSelector(".account-session");
    assert.equal(await page.$$(".account-session").then((items) => items.length), 2);
    const denied = await page.evaluate(async () =>
    {
      const adapter = window.RylvaAccountPreview.createAdapter();
      const data = await adapter.getSnapshot();
      try
      {
        await adapter.perform("revokeSession", { id: "session-current" }, data.version);
      }
      catch (error)
      {
        return error.code;
      }
      return null;
    });
    assert.equal(denied, "denied");
    await open("account.html", "?state=sessionsEmpty&section=security");
    assert.match(await page.$eval("#account-root", (element) => element.textContent), /Tidak ada sesi lain/);
    await open("account.html", "?state=sessionsUnavailable&section=security");
    assert.match(await page.$eval("#account-root", (element) => element.textContent), /Aktivitas login belum tersedia/);
    checks.push("Pencabutan sesi lain, konfirmasi, persistensi dan perlindungan perangkat ini");

    await open("account.html", "?section=addresses");
    await page.waitForSelector(".account-address");
    await capture("addresses-desktop");
    await accountAction("editAddress");
    assert.equal(await page.$eval(".account-address-details", (element) => element.open), false);
    assert.equal(await page.$eval("#account-city", (element) => element.value), "Bandung");
    assert.equal(await page.$eval("#account-postcode", (element) => element.value), "40123");
    await capture("address-form-desktop");
    await page.click(".account-address-details summary");
    assert.equal(await page.$eval(".account-address-details", (element) => element.open), true);
    await page.keyboard.press("Escape");
    checks.push("Rincian alamat lengkap terisi dan tersembunyi secara default; dapat dibuka");

    await open("account.html", "?state=mapUnavailable&section=addresses");
    await page.waitForSelector(".account-address");
    await accountAction("addAddress");
    assert.equal(await page.$eval(".account-address-details", (element) => element.open), true);
    assert.match(await page.$eval("#account-dialog-content", (element) => element.textContent), /Peta belum tersedia/);
    await capture("address-map-fallback");
    await page.keyboard.press("Escape");
    checks.push("Peta gagal langsung membuka form dan rincian manual");

    await page.setRequestInterception(true);
    const requests = [];
    let completeMapData = true;
    page.on("request", (request) =>
    {
      if (request.url().startsWith("https://photon.komoot.io/"))
      {
        requests.push(request.url());
        request.respond(
        {
          status: 200,
          contentType: "application/json",
          headers: { "access-control-allow-origin": "*" },
          body: JSON.stringify({ features: [{ geometry: { coordinates: [107.6191, -6.9175] }, properties:
          {
            name: "Lokasi Uji", street: "Jalan Uji Peta", city: "Bandung", state: "Jawa Barat",
            ...(completeMapData ? { village: "Kelurahan Uji", district: "Kecamatan Uji", postcode: "40123" } : {})
          } }] })
        });
      }
      else
      {
        request.continue();
      }
    });
    await open("account.html", "?section=addresses");
    await accountAction("addAddress");
    await page.waitForFunction(() => document.querySelector(".leaflet-container") && !document.querySelector('[data-account-action="selectMapCenter"]').disabled, { timeout: 18000 });
    assert.equal(await page.evaluate(() => window.L.version), "1.9.4");
    await page.waitForFunction(() =>
    {
      const tiles = Array.from(document.querySelectorAll(".leaflet-tile"));
      return tiles.length > 0 && tiles.every((tile) => tile.complete && tile.naturalWidth > 0 && Number(getComputedStyle(tile).opacity) >= 0.99);
    }, { timeout: 12000 });
    await capture("leaflet-map");
    await accountAction("selectMapCenter");
    await page.waitForSelector(".account-address-details");
    assert.equal(await page.$eval(".account-address-details", (element) => element.open), false);
    assert.equal(await page.$eval("#account-village", (element) => element.value), "Kelurahan Uji");
    assert.equal(await page.$eval("#account-district", (element) => element.value), "Kecamatan Uji");
    assert.equal(await page.$eval("#account-city", (element) => element.value), "Bandung");
    assert.equal(await page.$eval("#account-postcode", (element) => element.value), "40123");
    assert.equal(requests.length, 1);
    assert.ok(requests.every((url) => !url.includes("Nadia") && !url.includes("62812")));
    await capture("map-autofill");
    checks.push("Leaflet nyata dimuat; titik tengah keyboard memicu reverse lookup dengan respons uji dan prefills lengkap");
    await page.keyboard.press("Escape");
    if (await page.$('[data-account-action="discard"]'))
    {
      await accountAction("discard");
    }
    completeMapData = false;
    await open("account.html", "?section=addresses");
    await accountAction("addAddress");
    await page.waitForFunction(() => !document.querySelector('[data-account-action="selectMapCenter"]')?.disabled);
    await accountAction("selectMapCenter");
    await page.waitForSelector(".account-address-details");
    assert.equal(await page.$eval(".account-address-details", (element) => element.open), true);
    assert.equal(await page.$eval("#account-postcode", (element) => element.value), "");
    await capture("map-incomplete");
    await page.keyboard.press("Escape");
    if (await page.$('[data-account-action="discard"]'))
    {
      await accountAction("discard");
    }
    checks.push("Hasil geocoding tidak lengkap membuka rincian tanpa mengarang wilayah/kode pos");

    await open("my-orders.html");
    await page.waitForSelector("article.order-card");
    await page.click(".order-card-menu summary");
    assert.ok(await page.$(".order-card-menu[open] nav a"));
    await capture("orders-dropdown");
    await page.keyboard.press("Escape");
    assert.equal(await page.$(".order-card-menu[open]"), null);
    const colors = await page.$$eval(".order-card-header .badge", (elements) =>
    {
      return [...new Set(elements.map((element) => getComputedStyle(element).backgroundColor))];
    });
    assert.ok(colors.length >= 3);
    const pricePosition = await page.$eval(".order-card-body", (element) =>
    {
      const body = element.getBoundingClientRect();
      const price = element.querySelector(".order-card-price").getBoundingClientRect();
      return Math.abs((price.top + price.bottom) / 2 - (body.top + body.bottom) / 2);
    });
    assert.ok(pricePosition <= 2);
    checks.push("Dropdown keyboard, variasi warna status dan total di tengah kartu pesanan");

    await open("order-detail.html", "?state=shipping&intent=tracking");
    await page.waitForSelector(".tracking-layout");
    await capture("tracking-desktop");
    const alignment = await page.$eval(".tracking-information .detail-tracking-number", (element) =>
    {
      const number = element.querySelector("strong").getBoundingClientRect();
      const copy = element.querySelector("button").getBoundingClientRect();
      return Math.abs((number.top + number.bottom) / 2 - (copy.top + copy.bottom) / 2);
    });
    assert.ok(alignment <= 1);
    assert.ok(await page.$(".tracking-timeline time + .tracking-point + div"));
    checks.push("Pelacakan dua kolom, resi sejajar dan titik waktu yang terpisah");

    for (const width of [1024, 768])
    {
      await page.setViewport({ width, height: 1000 });
      await open("account.html", "?section=security");
      await page.waitForSelector(".account-session");
      await capture("login-" + width, true);
      await open("account.html", "?section=addresses");
      await page.waitForSelector(".account-address");
      await accountAction("editAddress");
      await capture("address-form-" + width);
      await page.keyboard.press("Escape");
      await open("my-orders.html");
      await page.waitForSelector(".order-card-menu");
      await page.click(".order-card-menu summary");
      await capture("orders-" + width);
      await open("order-detail.html", "?state=shipping&intent=tracking");
      await page.waitForSelector(".tracking-layout");
      await capture("tracking-" + width);
    }

    for (const width of [390, 320])
    {
      await page.setViewport({ width, height: 844 });
      await open("account.html");
      await page.waitForSelector(".account-data-row");
      await capture("profile-" + width);
      await open("account.html", "?section=security");
      await page.waitForSelector(".account-session");
      await capture("login-" + width);
      await page.$eval(".account-sessions", (element) => element.scrollIntoView());
      await capture("login-list-" + width);
      const shell = await page.evaluate(() =>
      {
        return {
          headerHeight: document.querySelector("header.storefront-header").getBoundingClientRect().height,
          footerHeight: document.querySelector("footer.storefront-footer").getBoundingClientRect().height,
          pageWidth: document.documentElement.scrollWidth,
          viewportWidth: innerWidth
        };
      });
      assert.ok(shell.headerHeight <= 204, JSON.stringify(shell));
      assert.ok(shell.footerHeight <= 460, JSON.stringify(shell));
      assert.equal(shell.pageWidth, shell.viewportWidth);
      await page.$eval("footer.storefront-footer", (element) => element.scrollIntoView());
      await capture("footer-" + width);
      const toggle = await page.$(".storefront-footer-toggle");
      await toggle.click();
      assert.equal(await toggle.evaluate((element) => element.getAttribute("aria-expanded")), "true");
      await toggle.click();
      await open("account.html", "?section=addresses");
      await page.waitForSelector(".account-address");
      await capture("addresses-" + width, true);
      await accountAction("editAddress");
      const previewHeight = await page.$eval(".account-location-summary", (element) => element.getBoundingClientRect().height);
      assert.ok(previewHeight <= 140, "Ringkasan lokasi ringkas: " + previewHeight);
      await capture("address-form-" + width);
      await page.focus("#account-submit");
      await capture("address-form-bottom-" + width);
      await page.keyboard.press("Escape");
      await open("my-orders.html");
      await page.waitForSelector(".order-card-menu");
      await page.click(".order-card-menu summary");
      await capture("orders-" + width);
      await open("order-detail.html", "?state=shipping&intent=tracking");
      await page.waitForSelector(".tracking-layout");
      await capture("tracking-" + width);
    }
    checks.push("Ukuran shell ringkas, footer accordion dan layout 390/320 tanpa halaman melebar");
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(outputDirectory, "verification.json"), JSON.stringify({ passed: true, checks, screenshots, errors }, null, 2));
    console.log(JSON.stringify({ passed: true, checks: checks.length, screenshots: screenshots.length, errors }));
  }
  finally
  {
    await browser.close();
  }
}

verify().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
