"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_INFORMATION_URL || "http://127.0.0.1:4185";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/information-pages");

async function verifyPages()
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
  const localFailures = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) =>
  {
    const pathname = new URL(response.url()).pathname;
    // Older consumer pages may request Chrome's implicit /favicon.ico; imported pages declare their local SVG icon.
    if (response.url().startsWith(BASE_URL) && response.status() >= 400 && pathname !== "/favicon.ico")
    {
      localFailures.push(response.url() + " " + response.status());
    }
  });
  // The imported Google map remains external; this suite does not verify Google's availability.
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

  async function open(slug, width = 1440)
  {
    await page.setViewport({ width, height: 1000, isMobile: width < 600, hasTouch: width < 600 });
    await page.goto(BASE_URL + "/pages/public/" + slug + ".html", { waitUntil: "networkidle0" });
    await page.evaluate(async () =>
    {
      await document.fonts.ready;
      await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)));
    });
  }

  try
  {
    for (const slug of ["contact", "faq", "privacy-policy"])
    {
      for (const width of [1440, 1024, 768, 390, 320])
      {
        await open(slug, width);
        const layout = await page.evaluate(() =>
        {
          const main = document.getElementById("information-main");
          const banner = getComputedStyle(main.querySelector(".info-herokontak, .info-headerfaq, .policy-banner"));
          const luminance = (channels) =>
          {
            const linear = channels.map((value) =>
            {
              const channel = Number(value) / 255;
              return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
            });
            return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
          };
          const channels = (color) => color.match(/[\d.]+/g).map(Number);
          const background = channels(banner.backgroundColor);
          const stops = banner.backgroundImage.match(/rgba?\([^)]+\)/g) || [banner.backgroundColor];
          const surfaceLuminance = stops.map((stop) =>
          {
            const values = channels(stop);
            const alpha = values[3] ?? 1;
            return luminance(values.slice(0, 3).map((value, index) =>
              value * alpha + background[index] * (1 - alpha)));
          });
          const textLuminance = luminance(channels(banner.color).slice(0, 3));
          const card = main.querySelector(".info-kartuterang");
          const middleCard = main.querySelector(".info-kartugelap");
          return {
            headingCount: main.querySelectorAll("h1").length,
            mainCount: document.querySelectorAll("main").length,
            overflow: document.documentElement.scrollWidth > innerWidth,
            font: getComputedStyle(main).fontFamily,
            bannerLuminance: Math.min(...surfaceLuminance),
            bannerContrast: Math.min(...surfaceLuminance.map((value) =>
              (Math.max(value, textLuminance) + 0.05) / (Math.min(value, textLuminance) + 0.05))),
            bannerColor: banner.color,
            middleCardColor: middleCard && getComputedStyle(middleCard).backgroundColor,
            cardBorderWidth: card && getComputedStyle(card).borderTopWidth,
            cardBorderStyle: card && getComputedStyle(card).borderTopStyle,
            clipped: [...main.querySelectorAll("a, input, textarea, summary")].some((element) =>
            {
              const rect = element.getBoundingClientRect();
              return rect.width && (rect.left < -1 || rect.right > innerWidth + 1);
            })
          };
        });
        assert.equal(layout.headingCount, 1, slug + " has one page heading");
        assert.equal(layout.mainCount, 1);
        assert.equal(layout.overflow, false, slug + " overflow at " + width);
        assert.equal(layout.clipped, false, slug + " clipped controls at " + width);
        assert.match(layout.font, /Poppins/);
        assert.equal(layout.bannerColor, "rgb(255, 255, 255)");
        if (slug === "contact")
        {
          assert.equal(layout.middleCardColor, "rgb(78, 105, 75)");
          assert.equal(layout.cardBorderWidth, "2px");
          assert.equal(layout.cardBorderStyle, "dashed");
        }
        assert.ok(layout.bannerContrast >= 4.5, slug + " banner text contrast");
        if ([1440, 390, 320].includes(width))
        {
          await page.screenshot(
          {
            path: path.join(OUTPUT_DIRECTORY, slug + "-" + width + ".png"),
            fullPage: slug !== "privacy-policy"
          });
        }
      }
    }
    checks.push("Three imported pages render at five widths with local assets, Poppins, one main heading and no horizontal clipping");

    await open("privacy-policy");
    const privacyStart = await page.evaluate(() => ({ url: location.href, entries: history.length }));
    const privacyIds = Array.from({ length: 8 }, (_, index) => "privacy-section-" + (index + 1));
    for (const id of [...privacyIds, ...privacyIds.toReversed()])
    {
      await page.evaluate((headingId) =>
      {
        const heading = document.getElementById(headingId);
        window.scrollTo(
        {
          top: scrollY + heading.getBoundingClientRect().top
            - document.querySelector(".storefront-header").offsetHeight - 20,
          behavior: "instant"
        });
      }, id);
      await page.waitForFunction((hash) =>
        document.querySelector('#privacy-toc [aria-current="location"]')?.hash === hash,
      {}, "#" + id);
      assert.equal(await page.$$eval('#privacy-toc [aria-current="location"]', (links) => links.length), 1);
    }
    assert.deepEqual(await page.evaluate(() => ({ url: location.href, entries: history.length })), privacyStart);
    await page.focus('#privacy-toc a[href="#privacy-section-4"]');
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.activeElement.id), "privacy-section-4");
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "privacy-reader-1440.png") });
    await open("privacy-policy", 390);
    assert.equal(await page.$eval("#privacy-toc", (toc) => toc.open), false);
    await page.focus("#privacy-toc summary");
    await page.keyboard.press("Enter");
    await page.click('#privacy-toc a[href="#privacy-section-5"]');
    assert.equal(await page.evaluate(() => document.activeElement.id), "privacy-section-5");
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "privacy-reader-390.png") });
    await page.$eval('footer [data-storefront-page="Hubungi Kami"]', (link) =>
      link.closest("nav").querySelector(".storefront-footer-toggle").click());
    await page.focus('footer [data-storefront-page="Hubungi Kami"]');
    const privacyPosition = await page.evaluate(() => scrollY);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.click('footer [data-storefront-page="Hubungi Kami"]')
    ]);
    await page.goBack({ waitUntil: "networkidle0" });
    await page.waitForFunction(() => document.getElementById("privacy-toc").open);
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - privacyPosition) < 200);
    await page.setJavaScriptEnabled(false);
    await open("privacy-policy", 390);
    await page.click('#privacy-toc a[href="#privacy-section-5"]');
    const privacyClearance = await page.evaluate(() =>
      document.getElementById("privacy-section-5").getBoundingClientRect().top
        - document.querySelector(".storefront-header").getBoundingClientRect().bottom);
    assert.ok(privacyClearance >= 8);
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "privacy-no-script-390.png") });
    await page.setJavaScriptEnabled(true);
    checks.push("Privacy breadcrumb, eight-section scroll spy, keyboard/mobile disclosure, reading restoration and no-JS anchors");

    await open("faq");
    assert.equal(await page.$$(".info-itemfaq").then((items) => items.length), 8);
    await page.focus("#faq-1 summary");
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.getElementById("faq-1").open);
    await page.click("#faq-2 summary");
    await page.waitForFunction(() => document.querySelectorAll(".info-itemfaq[open]").length === 1);
    assert.equal(await page.$eval("#faq-1", (item) => item.open), false);
    assert.equal(await page.$eval("#faq-2", (item) => item.open), true);
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "faq-expanded.png"), fullPage: true });
    await page.click("#faq-2 summary");
    assert.equal(await page.$eval("#faq-2", (item) => item.open), false);
    await page.setJavaScriptEnabled(false);
    await page.reload({ waitUntil: "networkidle0" });
    await page.click("#faq-3 summary");
    assert.equal(await page.$eval("#faq-3", (item) => item.open), true);
    await page.setJavaScriptEnabled(true);
    checks.push("All eight FAQ answers remain available; keyboard, single-open accordion and no-JavaScript reading work");

    await open("contact", 390);
    await page.click("#contact-compose");
    assert.equal(await page.$eval("#contact-email", (field) => field.validity.valueMissing), true);
    assert.equal(await page.$eval("#contact-form-status", (element) => element.hidden), true);
    await page.type("#contact-email", "pengunjung@example.com");
    await page.type("#contact-name", "Nama & Pengunjung");
    await page.type("#contact-message", "Pertanyaan <tanaman> & buket\nBaris kedua.");
    await page.evaluate(() =>
    {
      window.emailHandoffs = 0;
      document.getElementById("contact-email-fallback").addEventListener("click", (event) =>
      {
        event.preventDefault();
        window.emailHandoffs++;
      });
    });
    await page.click("#contact-compose");
    const draft = await page.$eval("#contact-email-fallback", (anchor) => anchor.href);
    const draftParameters = new URL(draft).searchParams;
    assert.match(draft, /^mailto:rylvagreen@gmail\.com\?/);
    assert.match(draftParameters.get("body"), /Nama & Pengunjung/);
    assert.match(draftParameters.get("body"), /<tanaman> & buket\nBaris kedua/);
    assert.equal(await page.evaluate(() => window.emailHandoffs), 1);
    assert.match(await page.$eval("#contact-form-status", (element) => element.textContent), /Draf email disiapkan/);
    assert.equal(await page.$eval("#contact-message", (field) => field.value), "Pertanyaan <tanaman> & buket\nBaris kedua.");
    assert.equal(await page.$$eval(".info-bungkuspeta iframe[title]", (frames) => frames.length), 1);
    assert.match(await page.$eval('a[href^="https://www.google.com/maps/search"]', (anchor) => anchor.href), /Bandung/);
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "contact-email-draft.png"), fullPage: true });
    checks.push("Contact validates required fields, prepares an encoded mail draft, retains inputs and provides direct email/map alternatives without claiming a send");

    for (const route of ["/pages/public/home.html", "/pages/public/catalog.html", "/pages/public/product-detail.html?product=monstera", "/pages/customer/cart.html"])
    {
      await page.setViewport({ width: 1440, height: 1000 });
      await page.goto(BASE_URL + route, { waitUntil: "networkidle0" });
      assert.equal(await page.$eval('[data-storefront-page="Pusat Bantuan"]', (element) => element.tagName), "A");
      await page.click('[data-storefront-page="Pusat Bantuan"]');
      await page.waitForFunction(() => location.pathname === "/pages/public/faq.html");
    }
    await page.waitForSelector('a[data-storefront-page="Hubungi Kami"]');
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.click('a[data-storefront-page="Hubungi Kami"]')
    ]);
    assert.equal(new URL(page.url()).pathname, "/pages/public/contact.html");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.click('a[data-storefront-page="Kebijakan Privasi"]')
    ]);
    assert.equal(new URL(page.url()).pathname, "/pages/public/privacy-policy.html");
    assert.equal(await page.$$(".info-judulbagian").then((items) => items.length), 8);
    checks.push("Shared Help, Contact and Privacy links navigate from existing storefront pages instead of opening unavailable notices");

    await open("contact");
    await page.focus("#storefront-search-input");
    await page.type("#storefront-search-input", "sirih");
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => location.pathname === "/pages/public/catalog.html");
    assert.equal(new URL(page.url()).searchParams.get("q"), "sirih");
    await open("faq", 390);
    await page.click('header [data-storefront-page="Wishlist"]');
    await page.waitForSelector("#home-wishlist-panel:not([hidden])");
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.activeElement.hasAttribute("data-header-wishlist-trigger")), true);
    await page.click('header [data-storefront-page="Keranjang"]');
    await page.waitForSelector("#home-cart-panel:not([hidden]) .home-mini-cart-item");
    await page.keyboard.press("Escape");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.focus("#faq-1 summary");
    assert.notEqual(await page.$eval("#faq-1 summary", (element) => getComputedStyle(element).outlineStyle), "none");
    await Promise.all([
      page.waitForNavigation(),
      page.click('[data-storefront-destination="Mitra Florist"]')
    ]);
    assert.equal(new URL(page.url()).pathname, "/pages/public/florist-partners.html");
    checks.push("Imported pages retain Catalog search, Cart and Wishlist panels, Escape focus return and visible keyboard focus with reduced motion");

    for (const [alias, destination] of [["Contact.html", "contact"], ["FAQ.html", "faq"], ["PrivacyPolicy.html", "privacy-policy"]])
    {
      await page.goto(BASE_URL + "/" + alias, { waitUntil: "networkidle0" });
      assert.equal(new URL(page.url()).pathname, "/pages/public/" + destination + ".html");
    }
    checks.push("Original file-name aliases redirect to the integrated directory");

    if (process.env.RYLVA_INFORMATION_SOURCE_DIR)
    {
      const sourceRoot = process.env.RYLVA_INFORMATION_SOURCE_DIR;
      const sourcePrivacy = fs.readFileSync(path.join(sourceRoot, "PrivacyPolicy.html"), "utf8");
      const sourceFaq = fs.readFileSync(path.join(sourceRoot, "FAQ.html"), "utf8");
      await open("privacy-policy");
      assert.equal(await page.evaluate((source) =>
      {
        const original = new DOMParser().parseFromString(source, "text/html");
        const normalize = (value) => value.replace(/\s/g, "");
        return normalize(original.querySelector("main").textContent)
          === normalize(document.querySelector(".info-kontenprivasi").textContent);
      }, sourcePrivacy), true);
      await open("faq");
      assert.equal(await page.evaluate((source) =>
      {
        const original = new DOMParser().parseFromString(source, "text/html");
        const normalize = (value) => value.replace(/\s/g, "");
        return [...original.querySelectorAll(".itemfaq")].every((item, index) =>
        {
          const current = document.querySelectorAll(".info-itemfaq")[index];
          return normalize(item.querySelector(".tombolfaq > span").textContent)
            === normalize(current.querySelector("summary > span").textContent)
            && normalize(item.querySelector(".isijawaban").textContent)
              === normalize(current.querySelector(".info-isijawaban").textContent);
        });
      }, sourceFaq), true);
      checks.push("FAQ questions/answers and all Privacy body text match the supplied source files, ignoring formatting whitespace");
    }

    assert.deepEqual(errors, []);
    assert.deepEqual(localFailures, []);
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "verification.json"), JSON.stringify({ checks, errors, localFailures }, null, 2));
    checks.forEach((check) => console.log("PASS " + check));
  }
  finally
  {
    await browser.close();
  }
}

verifyPages().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
