"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_INFORMATION_URL || "http://127.0.0.1:4185";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/public-errors");
const PAGES =
[
  { code: 404, route: "/pages/public/error-404.html", image: "not-found.jpg" },
  { code: 403, route: "/pages/public/error-403.html", image: "forbidden.jpg" },
  { code: 500, route: "/pages/public/error-500.html", image: "server-error.jpg" },
  { code: 503, route: "/pages/public/maintenance.html", image: "maintenance.jpg" }
];

async function verifyPublicErrors()
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
  const captures = [];
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
    const request = response.request();
    if (request.resourceType() !== "document" && response.url().startsWith(BASE_URL)
      && response.status() >= 400)
    {
      const route = new URL(response.url()).pathname;
      if (!["/favicon.ico", "/assets/images/public-errors/test-missing.jpg",
        "/assets/images/public-errors/development-missing.jpg"].includes(route))
      {
        failedResources.push(route + " " + response.status());
      }
    }
  });

  async function open(route, width = 1440)
  {
    await page.setViewport({ width, height: 1000, isMobile: width < 600, hasTouch: width < 600 });
    const response = await page.goto(BASE_URL + route, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await new Promise((resolve) => setTimeout(resolve, 300));
    return response;
  }

  async function capture(name)
  {
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, name), fullPage: true });
    captures.push(name);
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
    for (const item of PAGES)
    {
      for (const width of [1440, 1024, 768, 390, 320])
      {
        const response = await open(item.route, width);
        assert.equal(response.status(), item.code);
        const layout = await page.evaluate(() =>
        {
          const main = document.querySelector(".public-error-main");
          const illustration = document.getElementById("public-error-illustration");
          const visual = document.querySelector(".public-error-visual").getBoundingClientRect();
          const copy = document.querySelector(".public-error-copy").getBoundingClientRect();
          return {
            code: main.dataset.publicError,
            headings: main.querySelectorAll("h1").length,
            mains: document.querySelectorAll("main").length,
            forms: main.querySelectorAll("form, input").length,
            overflow: document.documentElement.scrollWidth > innerWidth,
            clipped: [...main.querySelectorAll("a, h1, p")].some((element) =>
            {
              const bounds = element.getBoundingClientRect();
              return bounds.width > 0 && (bounds.left < -1 || bounds.right > innerWidth + 1);
            }),
            fontsLoaded: [400, 500, 600, 700].every((weight) =>
              [...document.fonts].some((face) => face.family === "Poppins"
                && face.weight === String(weight) && face.status === "loaded")),
            image: illustration.getAttribute("src"),
            imageLoaded: illustration.complete && illustration.naturalWidth > 0 && !illustration.hidden,
            imageFit: getComputedStyle(illustration).objectFit,
            frameRatio: visual.width / visual.height,
            separated: innerWidth > 850 ? visual.right <= copy.left : visual.bottom <= copy.top,
            actionCount: main.querySelectorAll(".public-error-actions a").length,
            touchTargets: [...main.querySelectorAll(".public-error-actions a")]
              .every((link) => link.getBoundingClientRect().height >= 44),
            background: getComputedStyle(main).backgroundColor
          };
        });
        assert.equal(layout.code, String(item.code));
        assert.equal(layout.headings, 1);
        assert.equal(layout.mains, 1);
        assert.equal(layout.forms, 0);
        assert.equal(layout.overflow, false, "overflow " + item.code + " at " + width);
        assert.equal(layout.clipped, false, "clipped content " + item.code + " at " + width);
        assert.equal(layout.fontsLoaded, true);
        assert.equal(layout.image, "/assets/images/public-errors/" + item.image);
        assert.equal(layout.imageLoaded, true);
        assert.equal(layout.imageFit, "contain");
        assert.ok(Math.abs(layout.frameRatio - 4 / 3) < 0.02);
        assert.equal(layout.separated, true);
        assert.equal(layout.actionCount, 2);
        assert.equal(layout.touchTargets, true);
        assert.equal(layout.background, "rgb(255, 255, 255)");
        if ([1440, 390].includes(width) || item.code === 404)
        {
          await capture(item.code + "-" + width + ".png");
        }
        checks.push(item.code + " HTTP status, assigned illustration, loaded fonts and unclipped layout at " + width);
      }
      const head = await fetch(BASE_URL + item.route, { method: "HEAD" });
      assert.equal(head.status, item.code);
      assert.equal(await head.text(), "");
    }
    checks.push("HEAD preserves all four status codes with empty bodies");

    const deepRoute = "/missing/deep/public-page.html?example=unavailable";
    const missing = await open(deepRoute);
    assert.equal(missing.status(), 404);
    assert.equal(new URL(page.url()).pathname, "/missing/deep/public-page.html");
    assert.equal(await page.$eval(".public-error-main", (main) => main.dataset.publicError), "404");
    assert.equal(await page.$eval("#public-error-illustration", (image) => image.naturalWidth > 0), true);
    await capture("404-deep-path.png");
    const denied = await fetch(BASE_URL + "/%2eprivate/internal.html");
    assert.equal(denied.status, 403);
    assert.match(await denied.text(), /Akses tidak diizinkan/);
    const resource = await fetch(BASE_URL + "/assets/unknown-resource.css");
    assert.equal(resource.status, 404);
    assert.match(resource.headers.get("content-type"), /text\/plain/);
    const staff = await fetch(BASE_URL + "/pages/staff/unknown-public-error-test.html");
    assert.equal(staff.status, 404);
    assert.equal((await staff.text()).includes("public-error-main"), false);
    checks.push("deep public URLs keep real 404 and absolute assets; forbidden path uses 403; assets/staff retain plain fallback");

    for (const item of PAGES)
    {
      await open(item.route);
      const destination = await page.$eval("#public-error-primary", (link) => link.pathname);
      await follow("#public-error-primary");
      assert.equal(new URL(page.url()).pathname, destination);
    }
    await open(PAGES[0].route);
    await follow('.public-error-actions a[href="/pages/public/home.html"]');
    assert.equal(new URL(page.url()).pathname, "/pages/public/home.html");
    await open(PAGES[2].route);
    await follow('.public-error-actions a[href="/pages/public/contact.html"]');
    assert.equal(new URL(page.url()).pathname, "/pages/public/contact.html");
    checks.push("all primary actions and home/contact recovery links navigate through GET");

    const catalogue = "/pages/public/catalog.html?q=monstera&category=plants&sort=price_asc&token=discard";
    await open(PAGES[2].route + "?returnTo=" + encodeURIComponent(catalogue));
    const safeHref = await page.$eval("#public-error-primary", (link) => link.href);
    assert.equal(new URL(safeHref).searchParams.get("q"), "monstera");
    assert.equal(new URL(safeHref).searchParams.has("token"), false);
    await capture("500-catalogue-return.png");
    await follow("#public-error-primary");
    assert.equal(await page.$eval('#catalog-sort', (input) => input.value), "price_asc");
    assert.equal(await page.$eval('input[name="category"][value="plants"]', (input) => input.checked), true);
    for (const target of ["https://outside.example/", "//outside.example/", "javascript:alert(1)",
      "/pages/customer/checkout.html", "/pages/staff/admin-dashboard.html", "/%E0%A4%A"])
    {
      await open(PAGES[2].route + "?returnTo=" + encodeURIComponent(target));
      assert.equal(await page.$eval("#public-error-primary", (link) => link.pathname), "/pages/public/home.html");
    }
    await open(PAGES[1].route + "?returnTo=" + encodeURIComponent(catalogue));
    assert.equal(await page.$eval("#public-error-primary", (link) => link.pathname), "/pages/public/home.html");
    checks.push("only same-origin catalogue read context is allowed, secrets are discarded, external/private targets and 403 bypass are rejected");

    await open(PAGES[0].route, 390);
    await page.setOfflineMode(true);
    await page.waitForFunction(() => document.getElementById("public-error-connection").textContent.includes("Koneksi terputus"));
    await capture("404-offline-390.png");
    await page.setOfflineMode(false);
    await page.waitForFunction(() => document.getElementById("public-error-connection").textContent.includes("Koneksi kembali tersedia"));
    assert.equal(new URL(page.url()).pathname, PAGES[0].route);
    checks.push("offline/online messages retain explicit actions without reload or transaction retry");

    await open(PAGES[0].route, 390);
    await page.$eval("#public-error-illustration", (image) => image.src = "/assets/images/public-errors/test-missing.jpg");
    await page.waitForFunction(() => !document.getElementById("public-error-fallback").hidden);
    assert.equal(await page.$eval("#public-error-illustration", (image) => image.hidden), true);
    assert.equal(await page.$eval("#public-error-fallback", (image) => image.naturalWidth > 0), true);
    await capture("404-image-fallback-390.png");
    checks.push("failed illustration uses botanical fallback while preserving heading and recovery actions");

    await open(PAGES[0].route);
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains("skip-link")), true);
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.activeElement.id), "information-main");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.focus("#public-error-primary");
    assert.notEqual(await page.$eval("#public-error-primary", (link) => getComputedStyle(link).outlineStyle), "none");
    await page.hover("#public-error-primary");
    assert.equal(await page.$eval("#public-error-primary", (link) => getComputedStyle(link).color), "rgb(255, 255, 255)");
    await capture("404-keyboard-focus.png");
    checks.push("skip link, primary action focus and hover remain visible with reduced motion");

    await open(PAGES[2].route);
    await page.type("#storefront-search-input", "monstera");
    await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" }), page.keyboard.press("Enter")]);
    assert.equal(new URL(page.url()).pathname, "/pages/public/catalog.html");
    assert.equal(new URL(page.url()).searchParams.get("q"), "monstera");
    checks.push("shared header search still navigates to catalogue from an error page");

    await page.setJavaScriptEnabled(false);
    for (const item of PAGES)
    {
      await open(item.route, 390);
      assert.equal(await page.$eval("#public-error-illustration", (image) => image.naturalWidth > 0), true);
      assert.equal(await page.$$eval(".public-error-actions a", (links) => links.every((link) => link.pathname.startsWith("/pages/public/"))), true);
    }
    await capture("503-no-script-390.png");
    await follow("#public-error-primary");
    assert.equal(new URL(page.url()).pathname, "/pages/public/home.html");
    await page.setJavaScriptEnabled(true);
    checks.push("all four pages retain native content, artwork and safe recovery without JavaScript");

    for (const [alias, code] of [["404", 404], ["403", 403], ["500", 500], ["503", 503], ["maintenance", 503]])
    {
      const response = await fetch(BASE_URL + "/" + alias + ".html");
      assert.equal(response.status, code);
    }
    await open("/__preview/public-errors");
    await page.select("#preview-width", "320");
    await page.select("#preview-page", "500");
    await page.select("#preview-state", "long-text");
    await page.waitForFunction(() => document.getElementById("preview-frame").contentDocument
      ?.querySelector("h1")?.textContent.includes("untuk saat ini"));
    const frame = await (await page.$("#preview-frame")).contentFrame();
    assert.equal(await frame.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.$eval("#preview-frame", (previewFrame) =>
    {
      previewFrame.style.height = previewFrame.contentDocument.documentElement.scrollHeight + "px";
    });
    await frame.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    const longName = "500-long-content-320.png";
    await (await page.$("#preview-frame")).screenshot({ path: path.join(OUTPUT_DIRECTORY, longName) });
    captures.push(longName);
    checks.push("aliases preserve proper statuses; isolated development workbench handles long text at 320px");

    assert.deepEqual(errors, []);
    assert.deepEqual(failedResources, []);
    assert.deepEqual(writes, []);
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "verification.json"),
      JSON.stringify({ checks, captures, errors, failedResources, writes }, null, 2));
    checks.forEach((check) => console.log("PASS " + check));
  }
  finally
  {
    await page.setOfflineMode(false);
    await browser.close();
  }
}

verifyPublicErrors().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
