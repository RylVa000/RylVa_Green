"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_MY_ORDERS_URL || "http://127.0.0.1:4179/pages/customer/my-orders.html";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/my-orders");

async function verifyMyOrders()
{
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  const browser = await puppeteer.launch(
  {
    executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true,
    timeout: 20000
  });
  const checks = [];
  const screenshots = [];
  const browserErrors = [];
  try
  {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    page.on("pageerror", (error) => browserErrors.push(error.message));

    async function ready()
    {
      await page.waitForFunction(() => document.getElementById("orders-root")?.getAttribute("aria-busy") === "false");
      await page.evaluate(() => document.fonts.ready);
    }

    async function open(state = "normal", extra = "")
    {
      await page.goto(BASE_URL + "?state=" + state + extra);
      await page.evaluate(() =>
      {
        window.RylvaOrdersPreviewRepository.reset();
        for (const key of Object.keys(sessionStorage))
        {
          if (key.startsWith("rylva-orders-navigation-v1:"))
          {
            sessionStorage.removeItem(key);
          }
        }
      });
      await page.reload();
      if (!["loading", "slow"].includes(state))
      {
        await ready();
      }
    }

    async function click(selector)
    {
      await page.click(selector);
      await ready();
    }

    async function search(value)
    {
      await page.click("#orders-search");
      await page.keyboard.down("Control");
      await page.keyboard.press("A");
      await page.keyboard.up("Control");
      await page.type("#orders-search", value);
      await page.keyboard.press("Enter");
      await ready();
    }

    async function capture(name, fullPage = true)
    {
      if (fullPage)
      {
        await page.evaluate(() => window.scrollTo(0, 0));
      }
      await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, name + ".png"), fullPage });
      screenshots.push(name + ".png");
    }

    async function layout(name)
    {
      const violations = await page.evaluate(() =>
      {
        const viewport = document.documentElement.clientWidth;
        return Array.from(document.querySelectorAll("main article, main input, main select, main .button, main .order-card-price, dialog[open]"))
          .filter((element) =>
          {
            const bounds = element.getBoundingClientRect();
            return bounds.width > 0 && (bounds.left < -1 || bounds.right > viewport + 1);
          }).map((element) => element.id || element.className);
      });
      assert.deepEqual(violations, [], name + " overflow");
      checks.push("Layout " + name);
    }

    await page.setViewport({ width: 1440, height: 1000 });
    await open();
    assert.equal(await page.$$("article.order-card").then((elements) => elements.length), 10);
    assert.match(await page.$eval("#orders-result-summary", (element) => element.textContent), /1–10 dari 27/);
    assert.doesNotMatch(await page.$eval("#orders-root", (element) => element.textContent), /foreign|another-preview/);
    await layout("desktop");
    await capture("desktop");
    await capture("desktop-viewport", false);
    const headerMarkup = await page.$eval(".storefront-header", (element) => element.outerHTML);
    const footerMarkup = await page.$eval(".storefront-footer", (element) => element.outerHTML);
    const firstId = await page.$eval("article.order-card", (element) => element.dataset.cardOrderId);
    await click('[data-orders-action="next"]');
    assert.match(await page.$eval("#orders-result-summary", (element) => element.textContent), /11–20 dari 27/);
    await click('[data-orders-action="next"]');
    assert.match(await page.$eval("#orders-result-summary", (element) => element.textContent), /21–27 dari 27/);
    assert.equal(await page.$eval('[data-orders-action="next"]', (element) => element.disabled), true);
    await click('[data-orders-action="previous"]');
    await click('[data-orders-action="previous"]');
    assert.equal(await page.$eval("article.order-card", (element) => element.dataset.cardOrderId), firstId);
    checks.push("Pagination bounded 10/10/7, previous dan batas halaman");

    await click('[data-orders-status="Menunggu Pembayaran"]');
    assert.equal(await page.$$("article.order-card").then((elements) => elements.length), 1);
    assert.equal(await page.$('[data-card-order-id="preview-order-005"]'), null);
    await click('[data-orders-status="Dikirim"]');
    assert.ok(await page.$('[data-card-order-id="preview-order-005"]'));
    assert.equal(await page.$('[data-card-order-id="preview-order-005"] [data-orders-link="payment"]'), null);
    checks.push("COD belum lunas masuk status pengiriman, tanpa tombol Bayar online");

    await click('[data-orders-action="reset"]');
    await search("Monstera Deliciosa");
    assert.equal(await page.$eval("#orders-search", (element) => element.value), "Monstera Deliciosa");
    assert.equal(new URL(page.url()).searchParams.get("q"), "Monstera Deliciosa");
    await click('[data-orders-action="clear-search"]');
    await search("tidak-ada-pesanan-seperti-ini");
    assert.match(await page.$eval("#orders-root", (element) => element.textContent), /Pesanan tidak ditemukan/);
    await capture("no-results");
    await click('#orders-root [data-orders-action="reset"]');
    await click('[data-orders-status="Dikirim"]');
    await search("tidak-ada");
    assert.match(await page.$eval("#orders-root", (element) => element.textContent), /kurangi filter/);
    checks.push("Pencarian berspasi, URL, tanpa hasil, filter kosong dan Reset");

    await click('[data-orders-action="reset"]');
    await page.click("#orders-date-filter summary");
    await page.$eval("#orders-date-from", (element) =>
    {
      element.value = "2026-11-13";
      element.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.$eval("#orders-date-to", (element) =>
    {
      element.value = "2026-11-12";
      element.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForFunction(() => document.getElementById("orders-filter-error").textContent.length > 0);
    assert.equal(await page.$eval("#orders-date-to", (element) => element.getAttribute("aria-invalid")), "true");
    await page.click('[data-orders-action="clear-dates"]');
    await ready();
    assert.equal(await page.$eval("#orders-filter-error", (element) => element.textContent), "");
    await page.keyboard.press("Escape");
    await page.select("#orders-sort", "oldest");
    await ready();
    assert.notEqual(await page.$eval("article.order-card", (element) => element.dataset.cardOrderId), firstId);
    checks.push("Rentang invalid pulih tanpa menerapkan tanggal salah, urutan berubah");

    await click('[data-orders-action="reset"]');
    await search("Monstera");
    await click('[data-orders-action="next"]');
    const selected = await page.$eval("article.order-card:nth-child(3)", (element) =>
    {
      element.scrollIntoView({ block: "center" });
      return { id: element.dataset.cardOrderId, number: element.querySelector("h2").textContent };
    });
    const scrollBefore = await page.evaluate(() => window.scrollY);
    const queryBefore = new URL(page.url()).search;
    await page.click('[data-card-order-id="' + selected.id + '"] a.button');
    await page.waitForSelector("#order-number");
    assert.equal(await page.$eval("#order-number", (element) => element.textContent), selected.number);
    assert.equal(await page.$eval(".storefront-header", (element) => element.outerHTML), headerMarkup);
    assert.equal(await page.$eval(".storefront-footer", (element) => element.outerHTML), footerMarkup);
    await page.click("#order-back");
    await ready();
    await page.waitForFunction((id) => document.activeElement.dataset.orderId === id, {}, selected.id);
    assert.equal(new URL(page.url()).searchParams.get("q"), "Monstera");
    assert.equal(new URL(page.url()).searchParams.get("cursor"), new URLSearchParams(queryBefore).get("cursor"));
    assert.ok(Math.abs(await page.evaluate(() => window.scrollY) - scrollBefore) < 80);
    checks.push("Daftar -> detail -> kembali memulihkan ID, kueri, cursor, fokus dan gulir");

    await open();
    const pendingNumber = await page.$eval('[data-card-order-id="preview-order-001"] h2', (element) => element.textContent);
    const originalDeadline = await page.evaluate(() => window.RylvaOrdersPreviewRepository.read("preview-order-001").expiresAt);
    await page.click('[data-card-order-id="preview-order-001"] [data-orders-link="payment"]');
    await page.waitForFunction(() => document.getElementById("payment-root")?.getAttribute("aria-busy") === "false");
    assert.match(await page.$eval("#payment-root", (element) => element.textContent), new RegExp(pendingNumber));
    assert.ok(await page.$("#change-method"));
    await page.click('[data-action="details"]');
    await page.waitForSelector("#order-number");
    assert.equal(await page.$eval("#order-number", (element) => element.textContent), pendingNumber);
    await page.click("#order-back");
    await page.waitForFunction(() => document.getElementById("payment-root")?.getAttribute("aria-busy") === "false");
    assert.equal(await page.evaluate(() => window.RylvaOrdersPreviewRepository.read("preview-order-001").expiresAt), originalDeadline);
    await page.click("main .breadcrumb a");
    await ready();
    checks.push("Daftar -> bayar -> detail -> bayar -> daftar mempertahankan order dan tenggat");

    await click('[data-orders-status="Dikirim"]');
    await page.click('[data-card-order-id="preview-order-003"] [data-orders-link="tracking"]');
    await page.waitForFunction(() => document.getElementById("payment-dialog")?.open);
    assert.match(await page.$eval("#dialog-content", (element) => element.textContent), /Lacak|Dalam Pengiriman/);
    await page.keyboard.press("Escape");
    await page.click('[data-order-action="confirmReceipt"]');
    await page.click("#order-submit");
    await page.waitForFunction(() => !document.getElementById("payment-dialog").open);
    await page.click("#order-back");
    await ready();
    assert.equal(await page.$('[data-card-order-id="preview-order-003"]'), null);
    assert.ok(await page.$('[data-card-order-id="preview-order-005"]'));
    assert.equal(new URL(page.url()).searchParams.get("status"), "Dikirim");
    checks.push("Lacak membuka dialog, mutasi detail direkonsiliasi tanpa mereset filter");

    for (const target of ["order-detail.html", "payment.html"])
    {
      await page.goto(new URL(target + "?orderId=preview-foreign-order", BASE_URL).href);
      await page.waitForFunction(() => document.querySelector("#order-root, #payment-root")?.getAttribute("aria-busy") === "false");
      assert.equal(await page.$("#order-number"), null);
      assert.match(await page.$eval("main", (element) => element.textContent), /tidak ditemukan|tidak dapat diakses/);
    }
    checks.push("Order akun lain tidak terbuka di detail maupun pembayaran");

    await open("race");
    await page.type("#orders-search", "mon");
    await page.keyboard.press("Enter");
    await search("Calathea");
    await new Promise((resolve) => setTimeout(resolve, 1300));
    assert.equal(new URL(page.url()).searchParams.get("q"), "Calathea");
    assert.match(await page.$eval("#orders-root", (element) => element.textContent), /Cocok dengan pencarian: Calathea|Calathea/);
    checks.push("Respons pencarian lama tidak menimpa kueri terbaru");

    await open();
    await page.setOfflineMode(true);
    await page.waitForFunction(() => !document.getElementById("orders-notice").hidden);
    assert.match(await page.$eval("#orders-notice", (element) => element.textContent), /Koneksi terputus/);
    assert.equal(await page.$('[data-orders-link="payment"]'), null);
    await page.setOfflineMode(false);
    await ready();
    checks.push("Offline mempertahankan konteks, Bayar dipulihkan setelah online");

    const scenarioNames = await page.evaluate(() => Object.keys(window.RylvaMyOrdersPreview.scenarioLabels));
    for (const scenario of scenarioNames)
    {
      if (["loading", "slow"].includes(scenario))
      {
        continue;
      }
      await open(scenario);
      assert.match(await page.$eval("#orders-root", (element) => element.textContent), /\S/);
      if (["login", "denied", "verification", "unavailable"].includes(scenario))
      {
        assert.equal(await page.$("article.order-card"), null);
      }
      if (["empty", "invalid", "imageError", "long", "partialPage", "login", "archived", "expired"].includes(scenario))
      {
        await capture("state-" + scenario);
      }
      if (["loadError", "rateLimit"].includes(scenario))
      {
        if (scenario === "rateLimit")
        {
          await new Promise((resolve) => setTimeout(resolve, 3100));
        }
        await click('#orders-root [data-orders-action="refresh"]');
        assert.ok(await page.$("article.order-card"));
      }
      if (["refreshError", "session"].includes(scenario))
      {
        await click("#orders-refresh");
        assert.equal(await page.$("article.order-card") === null, scenario === "session");
      }
      if (scenario === "cursorExpired")
      {
        await click('[data-orders-action="next"]');
        await click('[data-orders-action="first"]');
        assert.ok(await page.$("article.order-card"));
      }
    }
    checks.push("Semua " + scenarioNames.length + " skenario daftar diperiksa (loading terpisah)");

    await open("slow");
    await page.waitForFunction(() => !document.getElementById("orders-refresh").disabled, { timeout: 10000 });
    await click("#orders-refresh");
    assert.ok(await page.$("article.order-card"));
    await open("loading");
    assert.equal(await page.$eval("#orders-root", (element) => element.getAttribute("aria-busy")), "true");
    checks.push("Loading lama dapat diulang tanpa kehilangan filter");

    for (const width of [1024, 768, 390, 320])
    {
      await page.setViewport({ width, height: 900 });
      await open("long");
      await layout("long-" + width);
      const lines = await page.$$eval(".order-card-price strong", (elements) => elements.map((element) =>
      {
        const range = document.createRange();
        range.selectNodeContents(element);
        return range.getClientRects().length;
      }));
      assert.ok(lines.every((count) => count === 1));
      const refreshGeometry = await page.$eval("#orders-refresh", (button) =>
      {
        const icon = button.querySelector(".icon");
        const buttonRect = button.getBoundingClientRect();
        const iconRect = icon.getBoundingClientRect();
        return {
          width: buttonRect.width,
          height: buttonRect.height,
          iconVisible: getComputedStyle(icon).display !== "none"
            && iconRect.width > 0 && iconRect.height > 0,
          accessibleText: button.textContent.trim()
        };
      });
      assert.ok(refreshGeometry.width >= 44 && refreshGeometry.height >= 44);
      assert.ok(refreshGeometry.iconVisible);
      assert.equal(refreshGeometry.accessibleText, "Perbarui Daftar");
      await click("#orders-refresh");
      assert.equal(await page.$eval("#orders-root", (element) => element.getAttribute("aria-busy")), "false");
      assert.ok(await page.$("article.order-card"));
      await capture("long-" + width);
      if ([768, 390, 320].includes(width))
      {
        await capture("viewport-" + width, false);
      }
      await page.click("#orders-date-filter summary");
      await layout("date-" + width);
      await capture("date-" + width, false);
      await page.keyboard.press("Escape");
    }
    const workbench = await page.goto(new URL("/__preview/my-orders", BASE_URL).href);
    assert.equal(workbench.status(), 200);
    await page.waitForSelector("#scenario option");
    assert.equal(await page.$$eval("#scenario option", (elements) => elements.length), scenarioNames.length);
    checks.push("Workbench terpisah tersedia dengan semua skenario");
    assert.deepEqual(browserErrors, []);
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "verification.json"), JSON.stringify(
    {
      passed: true, scenarios: scenarioNames.length, checks, screenshots, browserErrors
    }, null, 2));
    console.log(JSON.stringify({ passed: true, scenarios: scenarioNames.length, checks: checks.length, screenshots: screenshots.length, browserErrors }));
  }
  finally
  {
    await browser.close();
  }
}

verifyMyOrders().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
