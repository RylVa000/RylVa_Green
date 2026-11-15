"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_AUTH_URL || "http://127.0.0.1:4182";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/customer-auth-wave");

async function verifyArtwork()
{
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true
  });
  const page = await browser.newPage();
  const checks = [];
  const errors = [];
  const routes = { login: "customer-login", register: "customer-register", verify: "verify-email", forgot: "forgot-password", reset: "reset-password" };
  page.on("pageerror", (error) => errors.push(error.message));

  async function open(view, width = 1440, height = 1024)
  {
    await page.setViewport({ width, height });
    await page.goto(BASE_URL + "/pages/auth/" + routes[view] + ".html?preview=auth&state=normal");
    await page.evaluate(() =>
    {
      sessionStorage.removeItem("rylva-customer-auth-preview-v1");
      sessionStorage.removeItem("rylva-auth-motion-paused");
    });
    await page.reload();
    await page.waitForSelector(".auth-motion-toggle");
    await page.waitForFunction(() => document.getElementById("customer-auth-root").getAttribute("aria-busy") === "false");
    await page.evaluate(async () =>
    {
      await document.fonts.ready;
      await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
      await Promise.all([...document.querySelectorAll("svg image")].map((element) =>
      {
        const image = new Image();
        image.src = element.getAttribute("href");
        return image.decode();
      }));
    });
  }

  async function capture(filename)
  {
    await page.evaluate(() =>
    {
      if (document.getElementById("customer-auth-root").dataset.motion === "playing")
      {
        document.querySelector(".auth-motion-toggle").click();
      }
    });
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, filename), fullPage: true });
  }

  async function waitForMotion(milliseconds = 1200)
  {
    await page.evaluate((duration) => new Promise((resolve) => setTimeout(resolve, duration)), milliseconds);
  }

  async function waveState()
  {
    return page.evaluate(() =>
    {
      const path = document.querySelector(innerWidth <= 1100 ? ".auth-green-wave-horizontal path" : ".auth-green-wave-vertical path");
      const photo = document.querySelector(innerWidth <= 1100 ? ".auth-photo-source-mobile" : ".auth-photo-source-desktop")
        || document.querySelector(".auth-background");
      const bounds = photo.getBoundingClientRect();
      return { shape: path.getAttribute("d"), transform: getComputedStyle(photo).transform,
        photoBounds: [bounds.x, bounds.y, bounds.width, bounds.height] };
    });
  }

  try
  {
    for (const view of Object.keys(routes))
    {
      const widths = ["login", "register", "forgot"].includes(view) ? [1440, 1920, 2560, 1101, 1024, 390, 320] : [1440, 390];
      for (const width of widths)
      {
        await open(view, width, width <= 1100 ? 844 : 1024);
        const geometry = await page.evaluate(() =>
        {
          const root = document.getElementById("customer-auth-root").getBoundingClientRect();
          const art = document.querySelector(".auth-art").getBoundingClientRect();
          return { rootLeft: root.left, rootRight: root.right, artLeft: art.left, artRight: art.right,
            width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth,
            horizontalWave: getComputedStyle(document.querySelector(".auth-green-wave-horizontal")).display };
        });
        assert.equal(geometry.rootLeft, 0, view + " left edge " + width);
        assert.equal(geometry.rootRight, geometry.width, view + " right edge " + width);
        assert.equal(geometry.artRight, geometry.width);
        assert.equal(geometry.artLeft, 0);
        assert.equal(geometry.overflow, false);
        if (width <= 1100)
        {
          assert.notEqual(geometry.horizontalWave, "none");
        }
        await capture(view + "-" + width + ".png");
      }
    }
    checks.push("Five views render at 320–2560px; green overlays form the mobile wave edges");

    await open("login");
    const first = await waveState();
    await waitForMotion();
    const second = await waveState();
    await waitForMotion();
    const third = await waveState();
    assert.notEqual(first.shape, second.shape);
    assert.notEqual(second.shape, third.shape);
    assert.equal(first.transform, "none");
    assert.deepEqual(first.photoBounds, second.photoBounds);
    assert.deepEqual(second.photoBounds, third.photoBounds);
    const firstCoordinates = first.shape.match(/-?\d+(?:\.\d+)?/g).map(Number);
    const secondCoordinates = second.shape.match(/-?\d+(?:\.\d+)?/g).map(Number);
    const deltas = firstCoordinates.filter((_, index) => index % 2 === 0).map((value, index) => secondCoordinates[index * 2] - value);
    assert.ok(deltas.some((value) => value > 0.0001) && deltas.some((value) => value < -0.0001), "separate parts of green edge change in different directions");
    checks.push("Green boundary deforms locally in different directions; photograph has no zoom, translation or changing bounds");

    for (const [view, width] of [["login", 1440], ["register", 1101], ["login", 390], ["forgot", 390]])
    {
      await open(view, width);
      await waitForMotion(1800);
      await capture(view + "-" + width + "-varied.png");
    }

    await open("login");
    await page.click(".auth-motion-toggle");
    assert.equal(await page.$eval("#customer-auth-root", (element) => element.dataset.motion), "paused");
    const paused = await waveState();
    await waitForMotion(400);
    assert.equal((await waveState()).shape, paused.shape);
    await page.click(".auth-motion-toggle");
    assert.equal(await page.$eval("#customer-auth-root", (element) => element.dataset.motion), "playing");
    await page.focus(".auth-motion-toggle");
    await page.keyboard.press("Space");
    assert.equal(await page.$eval(".auth-motion-toggle", (element) => element.getAttribute("aria-pressed")), "false");
    await page.reload();
    await page.waitForSelector(".auth-motion-toggle");
    assert.equal(await page.$eval("#customer-auth-root", (element) => element.dataset.motion), "paused");
    checks.push("Pause/play works by pointer and keyboard and persists across navigation");

    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.waitForFunction(() => document.querySelector(".auth-motion-toggle").disabled);
    const reduced = await waveState();
    await waitForMotion(400);
    assert.equal((await waveState()).shape, reduced.shape);
    assert.equal(await page.$eval(".auth-photo-source", (element) => getComputedStyle(element).animationName), "none");
    await capture("login-reduced-motion.png");
    checks.push("Reduced motion stops green-boundary updates while preserving form controls");

    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    await open("register", 390);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForFunction(() => document.getElementById("customer-auth-root").dataset.motion === "paused");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForFunction(() => document.getElementById("customer-auth-root").dataset.motion === "playing");
    checks.push("Offscreen header animation pauses and resumes when visible");

    await open("forgot", 390);
    await page.type("#auth-email", "synthetic@example.test");
    await page.click("#auth-submit");
    await page.waitForSelector(".auth-result");
    assert.match(await page.$eval(".auth-result p", (element) => element.textContent), /Jika email terdaftar/);
    checks.push("Forgot-password submission still works with animated artwork");
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "verification.json"), JSON.stringify({ checks, errors }, null, 2));
    console.log(JSON.stringify({ checks, errors }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyArtwork().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
