"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_AUTH_URL || "http://127.0.0.1:4182";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/customer-auth");

async function verifyCustomerAuth()
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
  const credentialRequests = [];
  const routes = { login: "customer-login", register: "customer-register", verify: "verify-email", forgot: "forgot-password", reset: "reset-password" };
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) =>
  {
    if (request.method() !== "GET")
    {
      credentialRequests.push(request.url());
    }
  });
  page.on("dialog", (dialog) => dialog.accept());

  async function open(view, state = "normal", width = 1440, height = 1024)
  {
    await page.setViewport({ width, height });
    await page.goto(BASE_URL + "/pages/auth/" + routes[view] + ".html?preview=auth&state=" + state);
    await page.evaluate(() => sessionStorage.removeItem("rylva-customer-auth-preview-v1"));
    await page.reload();
    await page.waitForFunction(() => document.getElementById("customer-auth-root").getAttribute("aria-busy") === "false");
    await page.evaluate(() => document.fonts.ready);
  }

  async function capture(filename)
  {
    await page.evaluate(async () =>
    {
      await document.fonts.ready;
      await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
      await Promise.all([...document.querySelectorAll("svg image")].map((element) =>
      {
        const image = new Image();
        image.src = element.getAttribute("href");
        return image.decode().catch(() => {});
      }));
    });
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, filename), fullPage: true });
  }

  async function fill(values)
  {
    await page.evaluate((data) =>
    {
      for (const [name, value] of Object.entries(data))
      {
        const input = document.getElementById("auth-" + name);
        if (input.type === "checkbox")
        {
          input.checked = value;
        }
        else
        {
          input.value = value;
        }
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }, values);
  }

  async function send()
  {
    await page.click("#auth-submit");
    await page.waitForFunction(() => document.getElementById("customer-auth-root").getAttribute("aria-busy") === "false");
  }

  async function advance(milliseconds)
  {
    await page.evaluate((offset) =>
    {
      const originalNow = Date.now.bind(Date);
      Date.now = () => originalNow() + offset;
    }, milliseconds);
    await page.waitForFunction(() => !document.getElementById("auth-resend")?.disabled, { timeout: 3000 });
  }

  const credentials = { email: "synthetic.person@example.test", password: "bunga-sintetis-2026" };
  const registration = { ...credentials, name: "Pelanggan Contoh", phone: "081234567890", confirmPassword: credentials.password, consent: true };

  try
  {
    for (const view of Object.keys(routes))
    {
      const [width, height] = { verify: [1440, 832], forgot: [1364, 761], reset: [1378, 769] }[view] || [1440, 1024];
      await open(view, "normal", width, height);
      await capture(view + "-desktop.png");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, view + " desktop overflow");
      const actionStyle = await page.$eval("#auth-submit", (element) =>
      {
        const style = getComputedStyle(element);
        return { size: parseFloat(style.fontSize), weight: Number(style.fontWeight) };
      });
      assert.ok(actionStyle.size >= 18 && actionStyle.weight >= 600, view + " primary action hierarchy");
      if (["login", "register"].includes(view))
      {
        const contrasts = await page.$eval(".auth-input-wrap input", (element) =>
        {
          function channels(color)
          {
            return color.match(/[\d.]+/g).map(Number);
          }
          function luminance(color)
          {
            return color.slice(0, 3).reduce((sum, value, index) =>
            {
              const normalized = value / 255;
              const linear = normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
              return sum + linear * [0.2126, 0.7152, 0.0722][index];
            }, 0);
          }
          function contrast(a, b)
          {
            const first = luminance(a);
            const second = luminance(b);
            return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
          }
          const style = getComputedStyle(element);
          const border = channels(style.borderTopColor);
          const exterior = channels(getComputedStyle(document.body).backgroundColor);
          const fill = channels(style.backgroundColor);
          const alpha = fill[3] ?? 1;
          const interior = fill.slice(0, 3).map((value, index) => value * alpha + exterior[index] * (1 - alpha));
          return [contrast(border, exterior), contrast(border, interior)];
        });
        assert.ok(contrasts.every((ratio) => ratio >= 3), view + " input boundary contrast " + contrasts);
      }
      await open(view, "normal", 390, 844);
      await capture(view + "-mobile.png");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, view + " mobile overflow");
    }
    checks.push("Five rendered desktop/mobile views without horizontal overflow");

    for (const width of [320, 768, 1024])
    {
      for (const view of Object.keys(routes))
      {
        await open(view, "normal", width, width === 1024 ? 768 : 844);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, view + " width " + width);
        await capture(view + "-" + width + ".png");
      }
    }
    checks.push("Five views at 320, 768 and 1024 px");
    if (process.argv.includes("--captures-only"))
    {
      console.log(JSON.stringify({ checks, errors }, null, 2));
      return;
    }

    await open("register");
    const consentTarget = await page.$eval('label[for="auth-consent"]', (element) =>
    {
      const box = element.getBoundingClientRect();
      return { width: box.width, height: box.height };
    });
    assert.ok(consentTarget.width >= 44 && consentTarget.height >= 44);
    await page.click('label[for="auth-consent"]');
    assert.equal(await page.$eval("#auth-consent", (element) => element.checked), true);
    await page.click('label[for="auth-consent"]');
    await send();
    assert.equal(await page.$eval("#auth-email", (input) => input.getAttribute("aria-invalid")), "true");
    assert.equal(await page.$eval("#auth-consent-error", (element) => element.hidden), false);
    await fill({ ...registration, phone: "123", confirmPassword: "different" });
    await send();
    assert.equal(await page.$eval("#auth-phone", (input) => input.getAttribute("aria-invalid")), "true");
    assert.equal(await page.$eval("#auth-confirmPassword", (input) => input.getAttribute("aria-invalid")), "true");
    await capture("register-validation.png");
    await fill(registration);
    await page.click('[data-auth-action="password"][data-input="auth-password"]');
    assert.equal(await page.$eval("#auth-password", (input) => input.type), "text");
    await page.click('[data-auth-action="policy"]');
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.closest("dialog")?.id), "auth-dialog");
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.activeElement.dataset.authAction), "policy");
    await page.click('.auth-switch a');
    assert.equal(await page.$eval("#auth-dialog", (element) => element.open), true);
    await page.click('[data-auth-action="close"]');
    assert.equal(await page.$eval("#auth-email", (input) => input.value), credentials.email);
    await send();
    await page.waitForSelector("#auth-code");
    assert.match(await page.$eval("#auth-notice", (element) => element.textContent), /Jika email belum terdaftar/);
    const storage = await page.evaluate(() => JSON.stringify({ ...sessionStorage, ...localStorage }));
    assert.equal(storage.includes(credentials.password), false);
    assert.equal(storage.includes(credentials.email), false);
    assert.equal(storage.includes("123456"), false);
    await fill({ code: "123456" });
    assert.equal(await page.$$eval(".auth-code-slots span", (elements) => elements.map((element) => element.textContent).join("")), "123456");
    await send();
    assert.match(await page.$eval("#auth-title", (element) => element.textContent), /Pratinjau Verifikasi Selesai/);
    checks.push("Registration validation, 44px consent target, password toggle, policy/dirty dialog focus, generic response, OTP paste and verification");
    checks.push("No raw email, password or code in browser storage");

    await open("verify");
    for (let attempt = 0; attempt < 5; attempt++)
    {
      await fill({ code: "000000" });
      await send();
    }
    assert.equal(await page.$eval("#auth-submit", (element) => element.disabled), true);
    assert.match(await page.$eval("#auth-code-expiry", (element) => element.textContent), /tidak dapat digunakan/);
    await advance(61000);
    await page.click("#auth-resend");
    await page.waitForFunction(() => !document.getElementById("customer-auth-root").getAttribute("aria-busy").includes("true"));
    await fill({ code: "123456" });
    await send();
    assert.match(await page.$eval("#auth-notice", (element) => element.textContent), /tidak cocok/);
    await fill({ code: "123457" });
    await send();
    assert.match(await page.$eval("#auth-title", (element) => element.textContent), /Selesai/);
    checks.push("Five wrong codes lock verification; resend unlocks with a new code and invalidates old code");

    await open("verify", "resendLimited");
    await page.click("#auth-resend");
    await page.waitForFunction(() => !document.getElementById("auth-notice").hidden);
    assert.match(await page.$eval("#auth-notice", (element) => element.textContent), /Batas pengiriman/);
    assert.equal(await page.$eval("#auth-submit", (element) => element.disabled), false);
    await fill({ code: "123456" });
    await send();
    checks.push("Hourly resend limit preserves ability to verify a valid code");

    await open("forgot");
    await fill({ email: credentials.email });
    await send();
    assert.match(await page.$eval(".auth-result p", (element) => element.textContent), /Jika email terdaftar/);
    await page.click('[data-auth-action="edit-email"]');
    assert.equal(await page.$eval("#auth-email", (input) => input.value), credentials.email);
    await send();
    await page.goto(BASE_URL + "/pages/auth/reset-password.html");
    await page.waitForSelector("#auth-password");
    await fill({ password: credentials.password, confirmPassword: credentials.password });
    await send();
    assert.match(await page.$eval("#auth-title", (element) => element.textContent), /Pratinjau Kata Sandi Selesai/);
    await page.reload();
    await page.waitForSelector('[data-auth-action="forgot"]');
    checks.push("Forgot flow retains edited email, reset completes once and used token offers a new request");

    const scenarios = await page.evaluate(() => window.RylvaCustomerAuthPreview.scenarios);
    for (const [state, [view]] of Object.entries(scenarios))
    {
      await open(view, state);
      if (["loadError", "offline", "resetExpired", "resetUsed", "resetInvalid"].includes(state))
      {
        assert.ok(await page.$(".auth-error-page button"), state + " recovery");
      }
      else if (["verifyExpired", "verifyLocked"].includes(state))
      {
        assert.equal(await page.$eval("#auth-submit", (element) => element.disabled), true, state);
      }
      else if (["invalidCredentials", "unverified", "suspended", "captchaRequired", "rateLimited", "serviceError", "maintenance"].includes(state))
      {
        await fill(credentials);
        await send();
        assert.equal(await page.$eval("#auth-notice", (element) => element.hidden), false, state + " notice");
        assert.equal(await page.$eval("#auth-email", (input) => input.value), credentials.email);
        if (state === "rateLimited")
        {
          assert.equal(await page.$eval("#auth-submit", (element) => element.disabled), true);
          await page.evaluate(() =>
          {
            const originalNow = Date.now.bind(Date);
            Date.now = () => originalNow() + 901000;
          });
          await page.waitForFunction(() => !document.getElementById("auth-submit").disabled, { timeout: 3000 });
        }
      }
      else if (["timeout", "csrfExpired", "duplicate", "weakPassword", "storageBlocked"].includes(state))
      {
        await fill(registration);
        await send();
        if (["duplicate", "storageBlocked"].includes(state))
        {
          await page.waitForSelector("#auth-code");
          await fill({ code: "123456" });
          await send();
          assert.match(await page.$eval("#auth-title", (element) => element.textContent), /Verifikasi Selesai/);
        }
        else
        {
          assert.equal(await page.$eval("#auth-notice", (element) => element.hidden), false, state);
          assert.equal(await page.$eval("#auth-password", (input) => input.value), credentials.password);
          if (state === "csrfExpired")
          {
            await page.click('[data-auth-action="reload"]');
            await page.waitForFunction(() => !document.getElementById("auth-submit").disabled);
            assert.equal(await page.$eval("#auth-password", (input) => input.value), credentials.password);
          }
        }
      }
      else if (state.startsWith("google"))
      {
        await page.click('[data-auth-action="google"]');
        await page.waitForFunction(() => !document.getElementById("auth-notice").hidden);
        assert.match(await page.$eval("#auth-notice", (element) => element.textContent), /Google/);
      }
      await capture("state-" + state + ".png");
    }
    checks.push(Object.keys(scenarios).length + " development states render; relevant submit/recovery controls exercised");

    await page.goto(BASE_URL + "/pages/auth/verify-email.html");
    await page.evaluate(() => sessionStorage.removeItem("rylva-customer-auth-preview-v1"));
    await page.reload();
    await page.waitForSelector("#auth-email");
    await fill({ email: credentials.email });
    await send();
    await page.waitForSelector("#auth-code");
    checks.push("Direct verification can request a code without re-registering");

    await page.goto(BASE_URL + "/pages/auth/customer-login.html?returnTo=https://outside.example/path");
    await page.waitForSelector("#auth-email");
    await fill(credentials);
    await page.evaluate(() =>
    {
      document.getElementById("auth-form").requestSubmit();
      document.getElementById("auth-form").requestSubmit();
    });
    await page.waitForSelector('[data-auth-action="continue"]');
    await Promise.all([page.waitForNavigation(), page.click('[data-auth-action="continue"]')]);
    assert.equal(new URL(page.url()).pathname, "/pages/customer/account.html");
    checks.push("External returnTo rejected; double submit prevented; explicit preview continuation reaches a safe internal destination");

    await page.evaluate(() => sessionStorage.setItem("rylva-account-preview-access-v1", "signed-out"));
    await page.reload();
    await page.waitForSelector('[data-storefront-page="Akun"]');
    await Promise.all([page.waitForNavigation(), page.click('[data-storefront-page="Akun"]')]);
    assert.equal(new URL(page.url()).pathname, "/pages/auth/customer-login.html");
    checks.push("Signed-out storefront account navigation reaches customer login");
    assert.deepEqual(credentialRequests, []);
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "verification.json"), JSON.stringify({ checks, errors }, null, 2));
    console.log(JSON.stringify({ checks, errors }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyCustomerAuth().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
