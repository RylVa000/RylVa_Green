"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_INFORMATION_URL || "http://127.0.0.1:4185";
const PAGE_PATH = "/pages/public/terms-conditions.html";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/terms-conditions");

async function verifyTermsConditions()
{
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  const browser = await runtime.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true,
    userDataDir: path.join(OUTPUT_DIRECTORY, "chrome-profile")
  });
  const page = await browser.newPage();
  const checks = [];
  const errors = [];
  const failedResources = [];
  const writes = [];

  function monitor(target)
  {
    target.on("pageerror", (error) => errors.push(error.message));
    target.on("response", (response) =>
    {
      if (response.url().startsWith(BASE_URL) && response.status() >= 400
        && new URL(response.url()).pathname !== "/favicon.ico")
      {
        failedResources.push(response.url() + " " + response.status());
      }
    });
    target.on("request", (request) =>
    {
      if (!["GET", "HEAD"].includes(request.method()))
      {
        writes.push(request.method() + " " + request.url());
      }
    });
  }

  monitor(page);

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

  async function follow(selector)
  {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.click(selector)
    ]);
  }

  async function openDocumentTab(selector)
  {
    const opened = new Promise((resolve) => page.once("popup", resolve));
    await page.click(selector);
    const child = await opened;
    monitor(child);
    await child.waitForSelector(".terms-main h1");
    await child.evaluate(() => document.fonts.ready);
    assert.equal(new URL(child.url()).pathname, PAGE_PATH);
    assert.equal(await child.evaluate(() => window.opener), null);
    assert.equal(await child.$eval("#terms-return", (link) => link.hidden), true);
    await child.close();
  }

  try
  {
    for (const width of [1440, 1024, 768, 390, 320])
    {
      await open(PAGE_PATH, width);
      const layout = await page.evaluate(() =>
      {
        const main = document.querySelector(".terms-main");
        const banner = getComputedStyle(document.querySelector(".policy-banner"));
        return {
          mainCount: document.querySelectorAll("main").length,
          headings: main.querySelectorAll("h1").length,
          overflow: document.documentElement.scrollWidth > innerWidth,
          clipped: [...main.querySelectorAll("a, summary")].some((element) =>
          {
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1);
          }),
          font: getComputedStyle(main).fontFamily,
          fontsLoaded: [400, 500, 600, 700].every((weight) =>
          {
            return [...document.fonts].some((face) => face.family === "Poppins"
              && face.weight === String(weight) && face.status === "loaded");
          }),
          bannerColor: banner.color,
          bannerImage: banner.backgroundImage,
          tocOpen: document.getElementById("terms-toc").open,
          tocPosition: getComputedStyle(document.querySelector(".shipping-sidebar")).position,
          inputs: main.querySelectorAll("form, input, textarea").length
        };
      });
      assert.equal(layout.mainCount, 1);
      assert.equal(layout.headings, 1);
      assert.equal(layout.overflow, false, "overflow at " + width);
      assert.equal(layout.clipped, false, "clipped controls at " + width);
      assert.equal(layout.inputs, 0);
      assert.match(layout.font, /Poppins/);
      assert.equal(layout.fontsLoaded, true);
      assert.equal(layout.bannerColor, "rgb(255, 255, 255)");
      assert.match(layout.bannerImage, /linear-gradient/);
      assert.equal(layout.tocOpen, width > 760);
      assert.equal(layout.tocPosition, width > 760 ? "sticky" : "static");
      assert.deepEqual(await page.$$eval('footer [aria-current="page"]', (links) =>
        links.map((link) => link.getAttribute("href"))), [PAGE_PATH]);
      await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, `terms-${width}.png`) });
      if ([1440, 390].includes(width))
      {
        await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, `terms-full-${width}.png`), fullPage: true });
      }
      checks.push("public read-only layout, local fonts and banner at " + width);
    }

    await open();
    const ids = ["layanan-akun", "produk-harga", "pemesanan", "pembayaran", "pengiriman",
      "pembatalan-komplain", "data-privasi", "bantuan-ketentuan"];
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
      assert.equal(await page.$$eval('#terms-toc [aria-current="location"]', (links) => links.length), 1);
      assert.equal(await page.$eval('#terms-toc [aria-current="location"]', (link) => link.hash), "#" + id);
    }
    assert.deepEqual(await page.evaluate(() => ({ url: location.href, history: history.length })), starting);
    await page.focus('#terms-toc a[href="#pengiriman"]');
    await page.keyboard.press("Enter");
    await settle();
    assert.equal(await page.evaluate(() => document.activeElement.id), "pengiriman");
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "terms-reading-1440.png") });
    checks.push("eight sections track scroll both ways without history changes; keyboard anchors focus headings");

    await open(PAGE_PATH + "#data-privasi");
    assert.ok(await page.$eval("#data-privasi", (heading) => heading.getBoundingClientRect().top) >= 0);
    await open(PAGE_PATH + "#bagian-lama");
    assert.equal(await page.evaluate(() => scrollY), 0);
    await page.focus(".skip-link");
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.activeElement.id), "information-main");
    checks.push("direct anchors, unknown fragment recovery and keyboard skip link");

    await open(PAGE_PATH, 390);
    await page.focus("#terms-toc summary");
    await page.keyboard.press("Enter");
    assert.equal(await page.$eval("#terms-toc", (toc) => toc.open), true);
    await page.click('#terms-toc a[href="#bantuan-ketentuan"]');
    await page.focus('.shipping-help a[href="/pages/public/contact.html"]');
    await settle();
    const position = await page.evaluate(() => scrollY);
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "terms-help-390.png") });
    await follow('.shipping-help a[href="/pages/public/contact.html"]');
    await page.goBack({ waitUntil: "networkidle0" });
    await settle();
    assert.equal(await page.$eval("#terms-toc", (toc) => toc.open), true);
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - position) < 200);
    checks.push("mobile disclosure keyboard and reading context restored after help");

    await open("/pages/auth/customer-register.html", 390);
    await page.waitForSelector("#auth-email");
    await page.type("#auth-name", "Pelanggan Contoh");
    await page.type("#auth-email", "terms-reader@example.test");
    await page.type("#auth-password", "PreviewPlant!2468");
    await page.click('[data-policy="Syarat dan Ketentuan"]');
    await page.waitForSelector("#auth-dialog[open]");
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "terms-register-dialog-390.png") });
    await openDocumentTab('#auth-dialog a[href="' + PAGE_PATH + '"]');
    assert.equal(await page.$eval("#auth-email", (input) => input.value), "terms-reader@example.test");
    assert.equal(await page.$eval("#auth-password", (input) => input.value), "PreviewPlant!2468");
    assert.equal(await page.$eval("#auth-consent", (input) => input.checked), false);
    assert.equal(await page.evaluate(() => JSON.stringify({ ...sessionStorage, ...localStorage }).includes("PreviewPlant!2468")), false);
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.activeElement.dataset.policy), "Syarat dan Ketentuan");
    await page.click('[data-policy="Kebijakan Privasi"]');
    assert.equal(await page.$eval('#auth-dialog a', (link) => link.pathname), "/pages/public/privacy-policy.html");
    await page.keyboard.press("Escape");
    await page.$eval("#auth-form", (form) => form.reset());
    checks.push("registration policy opens a real isolated tab, retains fields without secret storage or automatic consent");

    await open("/pages/customer/checkout.html?preview=checkout&state=normal", 390);
    await page.waitForSelector("#checkout-consent");
    await page.waitForFunction(() => !document.querySelector(".checkout-quote-status")?.textContent.includes("Menghitung ulang"));
    const total = await page.$eval(".checkout-grand-total dd", (element) => element.textContent);
    await page.click(".checkout-policy-details summary");
    await openDocumentTab('.checkout-policy-details a[href="' + PAGE_PATH + '"]');
    await page.waitForFunction(() => !document.querySelector(".checkout-quote-status")?.textContent.includes("Menghitung ulang"));
    assert.equal(await page.$eval("#checkout-consent", (input) => input.checked), false);
    assert.equal(await page.$eval(".checkout-grand-total dd", (element) => element.textContent), total);
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "terms-checkout-links-390.png") });
    const source = page.url();
    await page.$eval('footer [data-storefront-page="Syarat & Ketentuan"]', (link) =>
    {
      link.closest("nav").querySelector(".storefront-footer-toggle").click();
    });
    await follow('footer [data-storefront-page="Syarat & Ketentuan"]');
    await page.waitForSelector("#terms-return:not([hidden])");
    await page.click("#terms-toc summary");
    await page.click('#terms-toc a[href="#pembayaran"]');
    await page.click('#terms-toc a[href="#data-privasi"]');
    await follow("#terms-return");
    assert.equal(page.url(), source);
    checks.push("checkout policy tab preserves quote and unchecked consent; same-tab footer return preserves the source route");

    for (const route of ["/pages/public/home.html", "/pages/public/privacy-policy.html", "/pages/public/shipping-information.html",
      "/pages/public/cancellation-refund.html", "/pages/customer/cart.html", "/pages/customer/my-orders.html"])
    {
      await open(route);
      assert.equal(await page.$eval('footer [data-storefront-page="Syarat & Ketentuan"]',
        (link) => link.getAttribute("href")), PAGE_PATH);
    }
    checks.push("central footer links the real terms route across six existing pages");

    await open();
    await page.type("#storefront-search-input", "monstera");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.keyboard.press("Enter")
    ]);
    assert.equal(new URL(page.url()).pathname, "/pages/public/catalog.html");
    assert.equal(new URL(page.url()).searchParams.get("q"), "monstera");
    checks.push("global search keeps the existing catalogue handoff");

    for (const alias of ["/terms-conditions.html", "/syarat-ketentuan.html"])
    {
      await open(alias);
      assert.equal(new URL(page.url()).pathname, PAGE_PATH);
    }
    await page.setJavaScriptEnabled(false);
    for (const width of [1440, 1024, 768, 390, 320])
    {
      await open(PAGE_PATH, width);
      await page.click('#terms-toc a[href="#pengiriman"]');
      assert.equal(new URL(page.url()).hash, "#pengiriman");
      const clearance = await page.evaluate(() =>
      {
        return document.getElementById("pengiriman").getBoundingClientRect().top
          - document.querySelector(".storefront-header").getBoundingClientRect().bottom;
      });
      assert.ok(clearance >= 8, "native anchor header clearance at " + width);
      assert.deepEqual(await page.$$eval('footer [aria-current="page"]', (links) =>
        links.map((link) => ({ tag: link.tagName, path: link.getAttribute("href") }))),
      [{ tag: "A", path: PAGE_PATH }]);
      if (width === 390)
      {
        await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "terms-no-script-390.png") });
      }
    }
    await page.setJavaScriptEnabled(true);
    checks.push("English/Indonesian aliases and complete native reading without JavaScript");

    await open("/__preview/terms-conditions");
    await page.select("#preview-width", "320");
    await page.select("#preview-state", "long-text");
    await page.waitForFunction(() =>
      document.getElementById("preview-frame").contentDocument?.getElementById("produk-harga")?.textContent.includes("kebutuhan"));
    const frame = await (await page.$("#preview-frame")).contentFrame();
    assert.equal(await frame.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    checks.push("development-only long text preview at 320px");

    assert.deepEqual(errors, []);
    assert.deepEqual(failedResources, []);
    assert.deepEqual(writes, [], "reading terms does not submit consent or transactions");
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "verification.json"),
      JSON.stringify({ checks, errors, failedResources, writes }, null, 2));
    checks.forEach((check) => console.log("PASS " + check));
  }
  finally
  {
    await browser.close();
  }
}

verifyTermsConditions().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
