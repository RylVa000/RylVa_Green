"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

const BASE_URL = process.env.RYLVA_PAYMENT_PREVIEW_URL
  || "http://127.0.0.1:4178/pages/customer/payment.html";
const OUTPUT_DIRECTORY = path.resolve(".impeccable/review/payment");

async function verifyPayment()
{
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  const browser = await puppeteer.launch(
  {
    executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true,
    timeout: 20000
  });
  const errors = [];
  const checks = [];
  const screenshots = [];

  try
  {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    page.on("pageerror", (error) =>
    {
      errors.push(error.message);
    });

    async function openScenario(scenario = "pending", parameters = "")
    {
      await page.goto(BASE_URL + "?state=" + scenario + parameters, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      if (scenario !== "loading")
      {
        await page.waitForFunction(() =>
        {
          return document.getElementById("payment-root").getAttribute("aria-busy") === "false";
        });
      }
    }

    async function capture(name)
    {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot(
      {
        path: path.join(OUTPUT_DIRECTORY, name + ".png"),
        fullPage: true
      });
      screenshots.push(name + ".png");
    }

    async function checkLayout(context)
    {
      const result = await page.evaluate(() =>
      {
        const viewportWidth = document.documentElement.clientWidth;
        const overflowElements = Array.from(document.querySelectorAll(
          "main button, main section, main aside, main img, main .badge, main .payment-amount"
        )).filter((element) =>
        {
          const bounds = element.getBoundingClientRect();
          return bounds.width > 0 && (bounds.left < -1 || bounds.right > viewportWidth + 1);
        }).map((element) => element.id || element.className);
        const smallTargets = Array.from(document.querySelectorAll("button, summary, a")).filter((element) =>
        {
          if (element.matches(".storefront-footer-toggle:disabled"))
          {
            return false;
          }
          const bounds = element.getBoundingClientRect();
          const isCompactFigmaLink = window.innerWidth > 540
            && element.closest(".storefront-utility-links, .storefront-footer-links");
          const minimumHeight = isCompactFigmaLink ? 24 : 43;
          return bounds.width > 0 && (bounds.width < 43 || bounds.height < minimumHeight);
        }).map((element) => element.textContent.trim() || element.getAttribute("aria-label"));
        return {
          documentOverflow: document.documentElement.scrollWidth > viewportWidth,
          overflowElements,
          smallTargets
        };
      });
      assert.equal(result.documentOverflow, false, context + ": page overflow");
      assert.deepEqual(result.overflowElements, [], context + ": component overflow");
      assert.deepEqual(result.smallTargets, [], context + ": small targets");
      checks.push("Layout " + context);
    }

    await page.setViewport({ width: 1440, height: 1000 });
    await openScenario();
    await page.evaluate(() =>
    {
      for (const key of Object.keys(sessionStorage))
      {
        if (key.startsWith("rylva-payment-preview-v1:"))
        {
          sessionStorage.removeItem(key);
        }
      }
    });
    await openScenario();
    assert.match(await page.$eval(".payment-amount", (element) => element.textContent), /389.000/);
    assert.equal(await page.$eval("#payment-qr", (element) => element.naturalWidth > 0), true);
    assert.match(await page.$eval(".preview-note", (element) => element.textContent), /data contoh/);
    const primaryButtonColor = await page.$eval("#action-refresh", (element) =>
    {
      return getComputedStyle(element).color;
    });
    assert.equal(primaryButtonColor, "rgb(255, 255, 255)");
    assert.equal(await page.evaluate(() => document.fonts.check('400 16px "Poppins"')), true);
    const deadlineBeforeReload = await page.$eval(".deadline-text strong", (element) => element.textContent);
    await page.reload({ waitUntil: "networkidle0" });
    assert.equal(await page.$eval(".deadline-text strong", (element) => element.textContent), deadlineBeforeReload);
    checks.push("QR renders; fixture disclosed; deadline stable across reload");

    await page.goto(BASE_URL + "?state=pending", { waitUntil: "networkidle0" });
    for (let tabIndex = 0; tabIndex < 100; tabIndex += 1)
    {
      await page.keyboard.press("Tab");
      const focusResult = await page.evaluate(() =>
      {
        const focusedElement = document.activeElement;
        const bounds = focusedElement.getBoundingClientRect();
        return {
          tagName: focusedElement.tagName,
          name: focusedElement.getAttribute("aria-label") || focusedElement.textContent.trim(),
          inViewport: bounds.top >= -1 && bounds.bottom <= window.innerHeight + 1,
          outline: getComputedStyle(focusedElement).outlineStyle,
          top: bounds.top,
          bottom: bounds.bottom,
          transform: getComputedStyle(focusedElement).transform
        };
      });
      if (focusResult.tagName === "BODY")
      {
        break;
      }
      assert.equal(focusResult.inViewport, true, "Focused control visible: " + JSON.stringify(focusResult));
      assert.notEqual(focusResult.outline, "none", "Focus ring: " + focusResult.name);
    }
    checks.push("Complete keyboard walk keeps focused targets and their rings visible");

    for (const width of [1920, 1440, 1024, 850, 768, 390, 320])
    {
      await page.setViewport({ width, height: width < 600 ? 844 : 1000 });
      await checkLayout(width + "px");
      if ([1440, 768, 390].includes(width))
      {
        await capture(width === 1440 ? "desktop" : (width === 390 ? "mobile" : "tablet"));
      }
    }

    await page.setViewport({ width: 1440, height: 1000 });
    await page.click("#change-method");
    await page.waitForSelector("#payment-method-form");
    await page.click("#confirm-method");
    assert.match(await page.$eval("#method-error", (element) => element.textContent), /Pilih satu metode/);
    assert.equal(await page.evaluate(() => document.activeElement.id), "method-error");
    await page.click('input[value="va"]');
    await page.click("#confirm-method");
    await page.waitForSelector(".payment-code");
    assert.match(await page.$eval(".method-name", (element) => element.textContent), /Virtual Account/);
    await page.click("#payment-history summary");
    assert.equal(await page.$$eval(".history-item", (elements) => elements.length), 2);
    await page.reload({ waitUntil: "networkidle0" });
    assert.match(await page.$eval(".method-name", (element) => element.textContent), /Virtual Account/);
    checks.push("Method validation, new attempt, safe old attempt, persistence without duplicate");
    await capture("virtual-account");

    await page.click("#change-method");
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.getElementById("payment-dialog").open);
    assert.equal(await page.evaluate(() => document.activeElement.id), "change-method");
    checks.push("Native dialog Escape and focus return");

    await page.click("#copy-amount");
    await page.waitForFunction(() =>
    {
      return document.getElementById("manual-copy")
        || document.getElementById("payment-feedback-text")?.dataset.feedback === "true";
    });
    const manualCopy = await page.$("#manual-copy");
    if (manualCopy)
    {
      assert.equal(await page.$eval("#manual-copy", (element) => element.value), "389000");
      await page.keyboard.press("Escape");
    }
    checks.push("Copy feedback or manual recovery retains exact amount");

    await openScenario("failed");
    assert.match(await page.$eval("#primary-retry", (element) => element.textContent), /Coba Pembayaran Lagi/);
    await capture("failed-retry");
    await page.evaluate(() =>
    {
      const key = "rylva-payment-preview-v1:failed";
      const fixture = JSON.parse(sessionStorage.getItem(key));
      fixture.expiresAt = new Date(Date.now() + 1800).toISOString();
      fixture.attempt.expiresAt = fixture.expiresAt;
      sessionStorage.setItem(key, JSON.stringify(fixture));
    });
    await page.reload({ waitUntil: "networkidle0" });
    await page.click("#primary-retry");
    await page.evaluate(() =>
    {
      Date.now = () => 0;
    });
    await page.waitForFunction(() =>
    {
      return !document.getElementById("payment-dialog").open
        && document.getElementById("payment-root").textContent.includes("Memeriksa status pembayaran");
    });
    assert.equal(await page.$("#primary-retry"), null);
    assert.match(await page.$eval(".status-badges", (element) => element.textContent), /Gagal/);
    assert.doesNotMatch(await page.$eval(".status-badges", (element) => element.textContent), /Dibatalkan/);
    await capture("failed-expired");
    checks.push("Retry is primary; failed attempt locks and closes method dialog at monotonic deadline, without local cancellation");

    await openScenario("cod");
    assert.match(await page.$eval("#payment-status-title", (element) => element.textContent), /COD berhasil dibuat/);
    assert.equal(await page.$("#payment-qr"), null);
    assert.equal(await page.$("#payment-countdown"), null);
    assert.equal(await page.$('[data-action="receipt"]'), null);
    assert.match(await page.$eval(".status-badges", (element) => element.textContent), /Menunggu/);
    await capture("cod");
    checks.push("COD confirmed independently of unpaid status; no online instruction or receipt");

    await openScenario("checking");
    assert.equal(await page.$("#payment-qr"), null);
    assert.match(await page.$eval("#payment-root", (element) => element.textContent), /Memeriksa status pembayaran/);
    assert.match(await page.$eval(".status-badges", (element) => element.textContent), /Menunggu Pembayaran/);
    checks.push("Deadline is a checking UI state, not browser cancellation");

    await openScenario("verifiedAfterRefresh");
    await page.click("#action-refresh");
    await page.waitForFunction(() =>
    {
      return document.getElementById("payment-status-title").textContent === "Pembayaran berhasil";
    });
    assert.equal(await page.$("#payment-qr"), null);
    await capture("success");
    await page.setViewport({ width: 390, height: 844 });
    await page.click("#primary-details");
    await page.waitForSelector("#order-number");
    assert.match(await page.$eval("#order-number", (element) => element.textContent), /RV-261112-PAY001/);
    await page.click("#order-back");
    await page.waitForSelector("#copy-amount");
    await page.click("#copy-amount");
    await page.waitForFunction(() =>
    {
      return document.getElementById("manual-copy")
        || document.getElementById("payment-feedback-text")?.dataset.feedback === "true";
    });
    const manualFeedback = await page.$("#manual-copy");
    if (manualFeedback)
    {
      await page.keyboard.press("Escape");
    }
    await capture("success-mobile-feedback");
    assert.equal(await page.$(".payment-toast"), null);
    await page.setViewport({ width: 1440, height: 1000 });
    await page.click('[data-action="receipt"]');
    await page.waitForFunction(() =>
    {
      return document.getElementById("dialog-content").textContent.includes("bukan faktur pajak");
    });
    await capture("receipt");
    await page.keyboard.press("Escape");
    checks.push("Verified snapshot replaces instructions; receipt only after verified payment");

    await openScenario("receiptError");
    await page.click('[data-action="receipt"]');
    await page.waitForSelector('#payment-dialog [data-action="receipt"]');
    assert.match(await page.$eval("#dialog-content", (element) => element.textContent), /tanpa mengulangi pembayaran/);
    assert.equal(await page.$eval("#payment-status-title", (element) => element.textContent), "Pembayaran berhasil");
    await page.keyboard.press("Escape");
    checks.push("Document failure preserves payment success and offers document retry");

    await openScenario("cancelled");
    assert.equal(await page.$("#payment-qr"), null);
    await openScenario("pending");
    await page.click("#action-cancel");
    await page.click("#action-confirm-cancel");
    await page.waitForFunction(() =>
    {
      return document.getElementById("payment-status-title").textContent === "Pesanan dibatalkan";
    });
    assert.equal(await page.$("#change-method"), null);
    checks.push("Confirmed cancellation closes payable instructions and actions");

    await openScenario("va", "&actionError=timeout");
    await page.click("#change-method");
    await page.click('input[value="qris"]');
    await page.click("#confirm-method");
    await page.waitForFunction(() => !document.getElementById("payment-dialog").open);
    assert.equal(await page.$eval("#change-method", (element) => element.disabled), true);
    assert.match(await page.$eval("#payment-root", (element) => element.textContent), /Jangan membayar ulang/);
    await page.click("#action-refresh");
    await page.waitForFunction(() => !document.getElementById("change-method").disabled);
    checks.push("Mutation timeout locks new payments until snapshot recovery");

    const scenarios = await page.evaluate(() => Object.keys(window.RylvaPaymentPreview.scenarioLabels));
    for (const scenario of scenarios)
    {
      await page.setViewport({ width: 390, height: 844 });
      await openScenario(scenario);
      if (scenario === "loading")
      {
        assert.equal(await page.$eval("#payment-root", (element) => element.getAttribute("aria-busy")), "true");
      }
      else
      {
        assert.ok(await page.$("#payment-root h2"), scenario + ": state heading");
        await checkLayout(scenario);
      }
      if (["stockIssue", "review", "refund", "qrError", "notFound", "long"].includes(scenario))
      {
        await capture("state-" + scenario);
      }
    }
    checks.push("All " + scenarios.length + " development scenarios render without uncaught errors");

    await openScenario("long");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await checkLayout("long content with reduced motion");
    await openScenario("pending");
    await page.setOfflineMode(true);
    await page.waitForFunction(() => !document.getElementById("connection-notice").hidden);
    await page.setOfflineMode(false);
    await page.waitForFunction(() => document.getElementById("connection-notice").hidden);
    checks.push("Offline notice and online recovery");

    await page.goto(new URL("/__preview/payment", BASE_URL).href, { waitUntil: "networkidle0" });
    assert.equal(await page.$$eval("#scenario option", (elements) => elements.length), scenarios.length);
    checks.push("Development controls live outside public document root");

    const noScriptPage = await browser.newPage();
    await noScriptPage.setJavaScriptEnabled(false);
    await noScriptPage.goto(BASE_URL, { waitUntil: "load" });
    assert.match(await noScriptPage.$eval("noscript", (element) => element.textContent), /Aktifkan JavaScript/);
    await noScriptPage.close();
    checks.push("No-script recovery is visible");
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "verification.json"), JSON.stringify(
      { result: "PASS", scenarios: scenarios.length, checks, screenshots, browserErrors: errors },
      null,
      2
    ));
    console.log(JSON.stringify({ result: "PASS", scenarios: scenarios.length, checks: checks.length, screenshots: screenshots.length, browserErrors: errors }));
  }
  finally
  {
    await browser.close();
  }
}

verifyPayment().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
