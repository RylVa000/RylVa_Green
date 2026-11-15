"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_CHECKOUT_URL || "http://127.0.0.1:4182/pages/customer/checkout.html";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/checkout");

async function verifyCheckout()
{
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true,
    timeout: 20000
  });
  const page = await browser.newPage();
  const errors = [];
  const checks = [];
  const screenshots = [];
  page.setDefaultTimeout(12000);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());

  async function open(state = "normal")
  {
    await page.goto(BASE_URL + "?preview=checkout&state=" + state);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => document.getElementById("checkout-root").getAttribute("aria-busy") === "false");
    if (await page.$("#checkout-summary"))
    {
      await settled();
    }
  }

  async function settled()
  {
    await page.waitForFunction(() => !document.querySelector(".checkout-quote-status")?.textContent.includes("Menghitung ulang"));
  }

  async function click(action)
  {
    await page.click(`[data-checkout-action="${action}"]`);
  }

  async function capture(name)
  {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, name + ".png"), fullPage: true });
    screenshots.push(name + ".png");
  }

  async function layout(label)
  {
    const failures = await page.evaluate(() =>
    {
      const width = document.documentElement.clientWidth;
      return [...document.querySelectorAll("main section, main aside, main input, main button, dialog[open], dialog[open] input")]
        .filter((element) =>
        {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && (rect.left < -1 || rect.right > width + 1);
        }).map((element) => element.id || element.className);
    });
    assert.deepEqual(failures, [], label);
  }

  async function selectMethod(method = "qris")
  {
    await page.click("#payment-" + method);
    await settled();
  }

  async function submit()
  {
    await page.click("#checkout-consent");
    assert.equal(await page.$eval("#checkout-submit", (element) => element.disabled), false);
    await click("create");
  }

  try
  {
    await page.setViewport({ width: 1440, height: 1000 });
    await open();
    assert.equal(await page.$eval("#checkout-consent", (element) => element.checked), false);
    assert.equal(await page.$eval("#checkout-submit", (element) => element.disabled), true);
    assert.match(await page.$eval(".checkout-grand-total dd", (element) => element.textContent), /389\.000/);
    await capture("desktop");
    await layout("desktop overflow");
    await selectMethod();
    await page.click("#checkout-consent");
    await page.click('[data-checkout-action="increase"]');
    await settled();
    assert.equal(await page.$eval("#checkout-consent", (element) => element.checked), false);
    assert.match(await page.$eval(".checkout-grand-total dd", (element) => element.textContent), /678\.000/);
    checks.push("normal, totals, quantity and consent invalidation");

    await page.$eval("#quantity-monstera-large", (element) =>
    {
      element.value = "1.5";
      element.dispatchEvent(new Event("change", { bubbles: true }));
    });
    assert.equal(await page.$eval("#quantity-monstera-large", (element) => element.getAttribute("aria-invalid")), "true");
    await page.$eval("#quantity-monstera-large", (element) =>
    {
      element.value = "1";
      element.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await settled();
    checks.push("invalid quantity preserves input and recovers");

    await click("address");
    await page.waitForSelector("#address-search");
    await capture("address-picker");
    await page.type("#address-search", "no-address-match");
    assert.match(await page.$eval("#address-results", (element) => element.textContent), /Tidak ada alamat/);
    await page.click('[data-address-action="reset"]');
    await page.click('[data-address-action="edit"]');
    assert.equal(await page.$eval("#address-administrative", (element) => element.hidden), true);
    await capture("address-form");
    await page.click('[data-address-action="details"]');
    assert.equal(await page.$eval("#address-administrative", (element) => element.hidden), false);
    await page.$eval("#address-postcode", (element) =>
    {
      element.value = "12";
    });
    await page.click('.checkout-save-address');
    assert.equal(await page.$eval("#address-postcode", (element) => element.getAttribute("aria-invalid")), "true");
    await page.$eval("#address-postcode", (element) => element.value = "40123");
    await page.click('.checkout-save-address');
    await page.waitForSelector("#use-address");
    await page.click("#use-address");
    await settled();
    checks.push("address search, Figma details, validation and save/select");

    await open("priceChanged");
    await selectMethod();
    await submit();
    await page.waitForFunction(() => document.getElementById("checkout-notice").textContent.includes("Harga"));
    await settled();
    assert.match(await page.$eval(".checkout-grand-total dd", (element) => element.textContent), /400\.000/);
    assert.equal(await page.$eval("#checkout-consent", (element) => element.checked), false);
    await capture("price-changed");
    checks.push("price change requires explicit new consent");

    await open("uncertain");
    await selectMethod();
    await submit();
    await page.waitForSelector('[data-checkout-action="inspect"]');
    assert.equal(await page.$eval("#checkout-submit", (element) => element.disabled), true);
    await capture("uncertain");
    await click("inspect");
    await page.waitForSelector("#checkout-result-title");
    const linkedOrder = await page.$eval('.checkout-result a[href*="payment.html"]', (element) => element.href);
    await page.goto(linkedOrder);
    await page.waitForFunction(() => document.getElementById("payment-root")?.getAttribute("aria-busy") === "false"
      || document.querySelector(".payment-status"));
    assert.match(await page.$eval("body", (element) => element.textContent), /389[.\s]?000/);
    checks.push("uncertain order recovers once and opens matching payment");

    await open("cod");
    await submit();
    await page.waitForSelector("#checkout-result-title");
    assert.match(await page.$eval(".checkout-result", (element) => element.textContent), /Siap Diproses/);
    assert.match(await page.$eval(".checkout-result", (element) => element.textContent), /Menunggu/);
    await capture("cod-result");
    checks.push("COD ready and unpaid");

    const states = ["empty", "unselected", "login", "verification", "session", "denied", "notFound", "loadError", "maintenance", "offline",
      "partial", "unavailable", "invalidData", "brokenImage", "longContent", "perishable", "mixed", "configuration", "componentUnavailable",
      "noAddress", "addressLimit", "addressPartial", "noPin", "noSlots", "calendarClosed", "noCourier", "courierError", "noEta", "noCod", "noMethods", "methodError", "quoteError", "stale", "storageBlocked"];
    for (const state of states)
    {
      await open(state);
      await layout(state);
      assert.ok(await page.$eval("#checkout-root", (element) => element.textContent.trim().length > 30));
    }
    checks.push(states.length + " access, empty, partial, invalid and service states render");

    await open("perishable");
    await selectMethod();
    assert.equal(await page.$eval("#checkout-submit", (element) => element.disabled), true);
    const tomorrow = await page.evaluate(() => window.RylvaCheckoutPreviewData.dateInWib(Date.now() + 86400000));
    await page.$eval("#checkout-date", (element, value) =>
    {
      element.value = value;
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }, tomorrow);
    await page.select("#checkout-slot", "SIANG");
    await settled();
    await page.click("#checkout-consent");
    assert.equal(await page.$eval("#checkout-submit", (element) => element.disabled), false);
    checks.push("perishable date/slot requirement");

    for (const state of ["createError", "conflict", "csrf", "rateLimited", "orderLimit", "addressChanged", "policyChanged", "stockChanged", "cutoffChanged"])
    {
      await open(state);
      await selectMethod();
      if (state === "cutoffChanged")
      {
        await page.$eval("#checkout-date", (element, value) =>
        {
          element.value = value;
          element.dispatchEvent(new Event("change", { bubbles: true }));
        }, tomorrow);
        await page.select("#checkout-slot", "SIANG");
        await settled();
      }
      await submit();
      await page.waitForFunction(() => !document.getElementById("checkout-notice").textContent.includes("Sedang membuat"));
      await settled();
      assert.equal(await page.$eval("#checkout-consent", (element) => element.checked), false, state);
      assert.equal(await page.$("#checkout-result-title"), null, state);
      await layout(state + " submit result");
    }
    checks.push("9 final-validation, CSRF, rate-limit and conflict failures preserve form");

    await open();
    await click("address");
    await page.click('[data-address-action="edit"]');
    await page.type("#address-recipient", " Baru");
    await page.keyboard.press("Escape");
    assert.match(await page.$eval("#checkout-dialog-title", (element) => element.textContent), /Buang perubahan/);
    await click("confirm-cancel");
    assert.match(await page.$eval("#address-recipient", (element) => element.value), /Baru/);
    await page.keyboard.press("Escape");
    await click("confirm");
    assert.equal(await page.$eval("#checkout-dialog", (element) => element.open), false);
    checks.push("dirty address cancel, Escape and retained input");

    await open();
    await page.evaluate(() =>
    {
      const address = { street: "Jalan Lokasi Uji Nomor 20", village: "Desa Uji", district: "Kecamatan Uji", city: "Bandung", province: "Jawa Barat", postcode: "40222" };
      window.RylvaAccountMap =
      {
        async mount(element)
        {
          element.textContent = "Peta kontrol pengujian";
          return {
            center: () => ({ latitude: -6.9, longitude: 107.6 }),
            select()
            {
              // Deterministic map test double.
            },
            destroy()
            {
              // No external map instance in this test double.
            }
          };
        },
        async reverse(point)
        {
          return [{ ...address, point }];
        },
        async search()
        {
          return [];
        }
      };
    });
    await click("address");
    await page.click('[data-address-action="edit"]');
    await page.click('[data-address-action="map"]');
    await page.waitForSelector("#checkout-location-map");
    await page.click('[data-address-action="center"]');
    await page.waitForFunction(() => !document.querySelector('[data-address-action="map-use"]').disabled);
    await page.click('[data-address-action="map-use"]');
    assert.equal(await page.$eval("#address-postcode", (element) => element.value), "40222");
    assert.equal(await page.$eval("#address-administrative", (element) => element.hidden), true);
    checks.push("structured reverse-geocoder data and hidden complete details (test adapter)");

    await open("mapUnavailable");
    await click("address");
    await page.click('[data-address-action="edit"]');
    await page.click('[data-address-action="map"]');
    await page.waitForSelector("#address-administrative:not([hidden])");
    assert.match(await page.$eval("#checkout-dialog-content", (element) => element.textContent), /Peta belum dapat digunakan/);
    checks.push("unsupported map immediately opens manual details");

    for (const state of ["addressSaveError", "addressConflict", "addressUncertain"])
    {
      await open(state);
      await click("address");
      await page.click('[data-address-action="edit"]');
      await page.type("#address-note", " baru");
      await page.click(".checkout-save-address");
      if (state === "addressUncertain")
      {
        await page.waitForSelector("#use-address");
        assert.equal(await page.$$eval(".checkout-address-card", (elements) => elements.length), 1);
      }
      else
      {
        await page.waitForFunction(() => document.querySelector(".checkout-feedback")?.textContent.includes("belum tersimpan"));
        assert.match(await page.$eval("#address-note", (element) => element.value), /baru/);
        await page.click(".checkout-save-address");
        await page.waitForSelector("#use-address");
      }
    }
    checks.push("address save retry, conflict and uncertain response do not lose input or duplicate");

    await open();
    const replay = await page.evaluate(async () =>
    {
      const adapter = window.RylvaCheckoutPreviewRepository;
      const state = await adapter.load();
      state.method = "qris";
      const quote = await adapter.quote(state);
      const intent = crypto.randomUUID();
      const before = window.RylvaOrdersPreviewRepository.ownOrders().length;
      const orders = await Promise.all([adapter.createOrder(state, intent, quote.fingerprint), adapter.createOrder(state, intent, quote.fingerprint)]);
      const next = await adapter.createOrder(state, intent, quote.fingerprint);
      let conflict = false;
      try
      {
        await adapter.createOrder({ ...state, method: "va" }, intent, quote.fingerprint);
      }
      catch (error)
      {
        conflict = error.code === "conflict";
      }
      return { same: orders[0].orderId === orders[1].orderId && next.orderId === orders[0].orderId,
        added: window.RylvaOrdersPreviewRepository.ownOrders().length - before, conflict };
    });
    assert.deepEqual(replay, { same: true, added: 1, conflict: true });
    checks.push("concurrent replay, repeated key and different-payload rejection");

    await open();
    await selectMethod();
    await page.click("#gift-enabled");
    await settled();
    assert.equal(await page.$eval("#checkout-submit", (element) => element.disabled), true);
    await page.type("#gift-message", "Pesan contoh untuk penerima.");
    await page.type("#gift-from", "Nama Pengirim");
    await page.click("#gift-anonymous");
    await settled();
    await submit();
    await page.waitForSelector("#checkout-result-title");
    const anonymous = await page.evaluate(() =>
    {
      const intent = window.RylvaCheckoutPreviewRepository.readIntent();
      return window.RylvaOrdersPreviewRepository.read(intent.orderId).greeting;
    });
    assert.equal(anonymous.from, "");
    assert.equal(anonymous.message, "Pesan contoh untuk penerima.");
    checks.push("optional card validation, counter and anonymous payload");

    await page.goto(new URL("/pages/customer/cart.html?preview=cart&state=account", BASE_URL).href);
    await page.waitForSelector("#cart-checkout");
    await page.waitForFunction(() => !document.getElementById("cart-checkout").disabled);
    await page.click("#cart-checkout");
    await page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForSelector("#checkout-summary");
    await settled();
    assert.equal(await page.$$eval(".checkout-product", (elements) => elements.length), 1);
    await page.click('[data-checkout-action="increase"]');
    await settled();
    await click("cart");
    await page.waitForFunction(() => location.pathname.endsWith("cart.html"));
    await page.waitForSelector("#cart-checkout");
    assert.equal(await page.$eval("#cart-quantity-monstera-large", (element) => element.value), "2");
    checks.push("selected cart handoff and return restores updated quantity/context");

    for (const width of [1920, 1280, 1024, 820, 768, 600, 390, 375, 320])
    {
      await page.setViewport({ width, height: width < 600 ? 844 : 900 });
      await open("longContent");
      await layout("width " + width);
      if ([390, 768, 1920].includes(width))
      {
        await capture("long-" + width);
      }
      await open();
      if (width === 390)
      {
        await capture("mobile");
        await click("address");
        await page.click('[data-address-action="edit"]');
        await layout("mobile address form");
        await capture("mobile-address");
      }
    }
    checks.push("9 viewport widths including long content and mobile dialog");
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "report.json"), JSON.stringify({ checks, states, screenshots, browserErrors: errors }, null, 2));
    console.log(JSON.stringify({ checks, stateCount: states.length, screenshots, browserErrors: errors }, null, 2));
  }
  catch (error)
  {
    await capture("failure");
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "failure.json"), JSON.stringify({ error: error.stack, checks, errors }, null, 2));
    throw error;
  }
  finally
  {
    await browser.close();
  }
}

verifyCheckout().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
