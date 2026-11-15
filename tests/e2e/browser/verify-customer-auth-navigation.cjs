"use strict";

const assert = require("node:assert/strict");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_AUTH_URL || "http://127.0.0.1:4182";

async function verifyNavigation()
{
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
  try
  {
    for (const route of ["customer-login", "customer-register", "verify-email", "forgot-password", "reset-password"])
    {
      await page.goto(BASE_URL + "/" + route + ".html");
      assert.equal(new URL(page.url()).pathname, "/pages/auth/" + route + ".html");
    }
    await page.goto(BASE_URL + "/__preview/customer-auth");
    assert.equal(await page.$$eval("#auth-state-links a", (links) => links.length), 31);
    checks.push("Five aliases and 31-link development workbench resolve");

    await page.goto(BASE_URL + "/pages/customer/account.html");
    await page.evaluate(() => sessionStorage.setItem("rylva-account-preview-access-v1", "signed-out"));
    await page.reload();
    await page.waitForSelector('[data-account-action="accessHelp"]');
    await Promise.all([page.waitForNavigation(), page.click('[data-account-action="accessHelp"]')]);
    assert.equal(new URL(page.url()).pathname, "/pages/auth/customer-login.html");
    assert.equal(new URL(page.url()).searchParams.get("returnTo"), "/pages/customer/account.html");
    checks.push("Signed-out account action reaches Login with account return context");

    await page.goto(BASE_URL + "/pages/customer/checkout.html");
    await page.waitForSelector('[data-checkout-action="account"]');
    const cartBefore = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.includes("cart"))));
    await Promise.all([page.waitForNavigation(), page.click('[data-checkout-action="account"]')]);
    assert.equal(new URL(page.url()).pathname, "/pages/auth/customer-login.html");
    assert.equal(new URL(page.url()).searchParams.get("returnTo"), "/pages/customer/checkout.html");
    assert.deepEqual(await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.includes("cart")))), cartBefore);
    checks.push("Checkout login action retains its return context and cart storage");

    await page.goto(BASE_URL + "/pages/auth/customer-login.html?state=invalidCredentials&returnTo=/pages/staff/admin-dashboard.html");
    await page.waitForSelector("#auth-email");
    assert.equal(await page.evaluate(() => window.RylvaCustomerAuthPreview.state), "normal");
    assert.equal(await page.$eval(".auth-brand", (element) => new URL(element.href).pathname), "/pages/customer/account.html");
    checks.push("Fixtures require explicit local preview flag; staff return destination rejected");

    await page.goto(BASE_URL + "/pages/auth/staff-login.html");
    assert.ok(await page.$("form"));
    assert.equal(await page.$("#customer-auth-root"), null);
    checks.push("Staff login remains separate");
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ checks, errors }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyNavigation().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
