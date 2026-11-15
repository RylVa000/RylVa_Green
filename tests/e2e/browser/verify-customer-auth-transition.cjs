"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_AUTH_URL || "http://127.0.0.1:4182";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/customer-auth-transition");

async function verifyTransition()
{
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true
  });
  const page = await browser.newPage();
  const errors = [];
  const checks = [];
  page.on("pageerror", (error) => errors.push(error.message));

  async function ready(view)
  {
    await page.waitForFunction((name) => document.body.dataset.authView === name
      && document.querySelector("#auth-form")
      && document.querySelector("#customer-auth-root").getAttribute("aria-busy") === "false"
      && !document.querySelector(".auth-tide-veil") && !document.documentElement.dataset.authArrival
      && !document.getElementById("customer-auth-root").inert, {}, view);
    await page.evaluate(async () =>
    {
      await document.fonts.ready;
      await Promise.all([...document.querySelectorAll("svg image")].map((element) =>
      {
        const image = new Image();
        image.src = element.getAttribute("href");
        return image.decode().catch(() => {});
      }));
    });
  }

  async function open(view = "login", width = 1440)
  {
    await page.setViewport({ width, height: width === 1440 ? 1024 : 844 });
    await page.goto(BASE_URL + "/pages/auth/customer-" + view + ".html?returnTo=" + encodeURIComponent("/pages/customer/checkout.html?from=cart"));
    await ready(view);
  }

  async function switchTo(view, prefix)
  {
    const navigation = page.waitForNavigation({ waitUntil: "domcontentloaded" });
    await page.click(".auth-switch a");
    await page.waitForSelector(".auth-tide-veil");
    assert.equal(await page.$eval("#customer-auth-root", (element) => element.inert), true);
    await partialTide();
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, prefix + "-out.png") });
    await navigation;
    await page.waitForSelector(".auth-tide-veil");
    await partialTide();
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, prefix + "-in.png") });
    await ready(view);
    assert.equal(new URL(page.url()).pathname, "/pages/auth/customer-" + view + ".html");
    assert.equal(new URL(page.url()).searchParams.get("returnTo"), "/pages/customer/checkout.html?from=cart");
    assert.equal(await page.evaluate(() => document.activeElement.id), "auth-title");
    const focus = await page.$eval("#auth-title", (element) =>
    {
      const style = getComputedStyle(element);
      return {
        outline: style.outlineStyle,
        color: style.outlineColor,
        width: element.getBoundingClientRect().width,
        formWidth: element.closest(".auth-form-area").getBoundingClientRect().width
      };
    });
    assert.equal(focus.outline, "solid");
    assert.equal(focus.color, "rgb(15, 42, 29)");
    assert.ok(focus.width < focus.formWidth / 2);
    assert.equal(await page.evaluate(() => sessionStorage.getItem("rylva-auth-arrival")), null);
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, prefix + "-ready.png"), fullPage: true });
  }

  async function partialTide()
  {
    await page.waitForFunction(() =>
    {
      const path = document.querySelector(".auth-tide-veil path");
      if (!path)
      {
        return false;
      }
      const bounds = path.getBBox();
      const extent = innerWidth <= 1100 ? bounds.height : bounds.width;
      return extent > 0.5 && extent < 1;
    }, { polling: "raf", timeout: 3000 });
  }

  try
  {
    await open();
    await switchTo("register", "desktop-register");
    await switchTo("login", "desktop-login");
    checks.push("Desktop Login ↔ Registration uses exit and arrival tides, retains URL context, restores heading focus and clears overlay/inert/marker");

    await page.goBack();
    await ready("register");
    await page.goBack();
    await ready("login");
    checks.push("Browser history restores usable pages without retained overlays");

    await open("register", 390);
    await page.type("#auth-name", "Pelanggan Contoh");
    await page.type("#auth-password", "contoh-untuk-uji");
    await page.click(".auth-switch a");
    assert.equal(await page.$eval("#auth-dialog", (element) => element.open), true);
    assert.equal(await page.$(".auth-tide-veil"), null);
    await page.keyboard.press("Escape");
    assert.equal(await page.$eval("#auth-password", (element) => element.value), "contoh-untuk-uji");
    await page.click(".auth-switch a");
    const navigation = page.waitForNavigation();
    await page.click('[data-auth-action="leave"]');
    await navigation;
    await ready("login");
    checks.push("Unsaved registration still requires confirmation; cancel retains fields; confirm continues with tide");
    await switchTo("register", "mobile-register");
    await switchTo("login", "mobile-login");
    checks.push("Mobile uses rising/falling wave navigation in both directions");

    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await Promise.all([page.waitForNavigation(), page.click(".auth-switch a")]);
    await ready("register");
    assert.equal(await page.$(".auth-tide-veil"), null);
    checks.push("Reduced motion uses immediate native navigation without tide");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    await page.click(".auth-motion-toggle");
    await Promise.all([page.waitForNavigation(), page.click(".auth-switch a")]);
    await ready("login");
    assert.equal(await page.$(".auth-tide-veil"), null);
    checks.push("User pause preference also suppresses navigation motion");

    await page.evaluate(() =>
    {
      sessionStorage.removeItem("rylva-auth-motion-paused");
      sessionStorage.setItem("rylva-auth-arrival", JSON.stringify({ destination: "/pages/auth/customer-register.html", direction: 1, createdAt: Date.now() - 20000 }));
    });
    await page.goto(BASE_URL + "/pages/auth/customer-register.html");
    await ready("register");
    assert.equal(await page.evaluate(() => sessionStorage.getItem("rylva-auth-arrival")), null);
    checks.push("Stale transition markers are discarded and never hide a direct visit");

    await page.evaluateOnNewDocument(() =>
    {
      const write = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value)
      {
        if (key === "rylva-auth-arrival")
        {
          throw new DOMException("Preview storage failure", "QuotaExceededError");
        }
        return write.call(this, key, value);
      };
    });
    await open("login");
    await Promise.all([page.waitForNavigation(), page.click(".auth-switch a")]);
    await ready("register");
    assert.equal(await page.$(".auth-tide-veil"), null);
    checks.push("Storage failure falls back to normal usable navigation");
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "verification.json"), JSON.stringify({ checks, errors }, null, 2));
    console.log(JSON.stringify({ checks, errors }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyTransition().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
