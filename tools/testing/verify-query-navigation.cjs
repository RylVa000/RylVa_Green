"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("./browser-runtime.cjs");
const { adaptJavaScript } = require("../maintenance/prepare-query-routing.cjs");
const root = path.resolve(__dirname, "../..");
const credentials = JSON.parse(fs.readFileSync(path.join(root, "config/staging-review.local.json"), "utf8"));
const baseUrl = new URL(process.env.RYLVA_STAGING_URL || credentials.baseUrl);
const output = path.join(root, "storage/reports/staging", baseUrl.hostname === "127.0.0.1" ? "query-local" : "online");

function routeUrl(route)
{
  const logical = new URL(route, baseUrl);
  const url = new URL("/index.php", baseUrl);
  url.searchParams.set("route", logical.pathname);
  logical.searchParams.forEach((value, key) => url.searchParams.append(key, value));
  url.hash = logical.hash;
  return url;
}

async function verify()
{
  const checks = [];
  const fixture = 'const text = "window.location"; function local(history) { return history; } '
    + 'window.location.assign(new URL("catalog.html", location.href)); const item = { location: "pusat" };';
  const adapted = adaptJavaScript(fixture);
  assert.match(adapted, /text = "window.location"/);
  assert.match(adapted, /return history/);
  assert.match(adapted, /location: "pusat"/);
  assert.match(adapted, /window.RylvaQueryRouting.location.assign/);
  assert.match(adapted, /new window.RylvaQueryRouting.URL/);
  checks.push("AST adaptation preserves strings, stock-location fields and locally scoped history variables");

  const authorization = "Basic " + Buffer.from(credentials.user + ":" + credentials.password).toString("base64");
  for (const route of ["//example.org", "/../config/.env", "/path?query", "/%2e%2e/config", "/path\\file"])
  {
    const url = new URL("/index.php", baseUrl);
    url.searchParams.set("route", route);
    const response = await fetch(url, { headers: { Authorization: authorization }, signal: AbortSignal.timeout(20000) });
    assert.equal(response.status, 400, route);
    assert.doesNotMatch(await response.text(), /DB_PASSWORD=|Fatal error:/);
  }
  checks.push("Invalid, external and traversal routes are rejected without exposing configuration");

  let browser;
  try
  {
    browser = await runtime.launch({ headless: true, pipe: true });
    const page = await browser.newPage();
    await page.authenticate({ username: credentials.user, password: credentials.password });
    await page.setViewport({ width: 1440, height: 1000 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const open = (route) => page.goto(routeUrl(route).href, { waitUntil: "networkidle0", timeout: 45000 });
    const assertRoute = (expected) => assert.equal(new URL(page.url()).searchParams.get("route"), expected);
    const clickNavigation = async (selector, expectedPage) =>
    {
      await page.waitForSelector(selector);
      await page.click(selector);
      try
      {
        await page.waitForFunction((expected) => document.readyState === "complete"
          && document.querySelector("script[data-logical-page]")?.dataset.logicalPage === expected, {}, expectedPage);
      }
      catch (error)
      {
        fs.mkdirSync(output, { recursive: true });
        await page.screenshot({ path: path.join(output, "navigation-failure.png"), fullPage: true });
        console.log(JSON.stringify({ selector, expectedPage, actual: page.url(), errors }));
        throw error;
      }
      await page.waitForNetworkIdle({ idleTime: 300, timeout: 15000 });
    };

    await open("/pages/public/home.html");
    await page.type("#storefront-search-input", "monstera");
    await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" }), page.keyboard.press("Enter")]);
    assertRoute("/pages/public/catalog.html");
    assert.equal(new URL(page.url()).searchParams.get("q"), "monstera");
    await page.waitForSelector("[data-home-detail]");
    await clickNavigation("[data-home-detail]", "/pages/public/product-detail.html");
    assertRoute("/pages/public/product-detail.html");
    await clickNavigation("[data-product-back]", "/pages/public/catalog.html");
    assertRoute("/pages/public/catalog.html");
    assert.equal(new URL(page.url()).searchParams.get("q"), "monstera");
    checks.push("Search → catalog → product → back preserves the query and logical navigation context");

    await open("/pages/public/catalog.html");
    await page.click('input[name="category"][value="plants"]');
    await page.waitForFunction(() => new window.URL(location.href).searchParams.has("category"));
    assertRoute("/pages/public/catalog.html");
    await page.reload({ waitUntil: "networkidle0" });
    assert.equal(await page.$eval('input[name="category"][value="plants"]', (input) => input.checked), true);
    checks.push("Filter history retains route= and survives reload without a server rewrite");

    await open("/pages/public/care-guides.html?type=indoor");
    await clickNavigation("[data-care-detail]", "/pages/public/care-guide-detail.html");
    assertRoute("/pages/public/care-guide-detail.html");
    await page.evaluate(() => history.back());
    await page.waitForFunction(() => document.readyState === "complete"
      && document.querySelector("script[data-logical-page]")?.dataset.logicalPage === "/pages/public/care-guides.html");
    await page.waitForNetworkIdle({ idleTime: 300, timeout: 15000 });
    assertRoute("/pages/public/care-guides.html");
    assert.equal(new URL(page.url()).searchParams.get("type"), "indoor");
    checks.push("Dynamic care-guide links and browser Back preserve the list filter");

    await open("/pages/auth/customer-login.html?returnTo=%2Fpages%2Fcustomer%2Faccount.html");
    await clickNavigation(".auth-switch a", "/pages/auth/customer-register.html");
    assertRoute("/pages/auth/customer-register.html");
    assert.equal(new URL(page.url()).searchParams.get("returnTo"), "/pages/customer/account.html");
    checks.push("Login/register transition retains the safe return destination");

    await open("/pages/public/terms-conditions.html");
    await page.click('a[href="#pemesanan"]');
    assertRoute("/pages/public/terms-conditions.html");
    assert.equal(new URL(page.url()).hash, "#pemesanan");
    await page.reload({ waitUntil: "networkidle0" });
    assert.equal(new URL(page.url()).hash, "#pemesanan");
    checks.push("Article anchors and refresh retain the page route and fragment");

    await open("/pages/customer/cart.html");
    const anchors = await page.$$eval("a[href]", (links) => links.filter((link) =>
    {
      const href = link.getAttribute("href");
      return !href.startsWith("#") && link.origin === location.origin && !link.hasAttribute("download")
        && !link.pathname.startsWith("/assets/");
    }).map((link) => link.pathname));
    assert.ok(anchors.length > 0);
    assert.ok(anchors.every((pathname) => pathname === "/index.php"));
    checks.push("Native links, including links opened in a new tab, point to the query entry point");
    assert.deepEqual(errors, []);
    checks.push("Navigation flows produce no JavaScript errors");

    const noScriptPage = await browser.newPage();
    await noScriptPage.authenticate({ username: credentials.user, password: credentials.password });
    await noScriptPage.setJavaScriptEnabled(false);
    await noScriptPage.goto(routeUrl("/pages/public/terms-conditions.html").href, { waitUntil: "networkidle0" });
    const homeLink = await noScriptPage.$eval('a[href*="route="]', (link) => link.href);
    assert.equal(new URL(homeLink).pathname, "/index.php");
    await noScriptPage.click('a[href="#pemesanan"]');
    assert.equal(new URL(noScriptPage.url()).searchParams.get("route"), "/pages/public/terms-conditions.html");
    assert.equal(new URL(noScriptPage.url()).hash, "#pemesanan");
    await noScriptPage.close();
    checks.push("Server-rendered navigation and article fragments also work with JavaScript disabled");
  }
  finally
  {
    if (browser)
    {
      await browser.close();
    }
  }
  fs.mkdirSync(output, { recursive: true });
  const report = { passed: true, checkedAt: new Date().toISOString(), origin: baseUrl.origin, checks };
  fs.writeFileSync(path.join(output, "navigation.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

verify().catch((error) =>
{
  console.error(error.stack);
  process.exitCode = 1;
});
