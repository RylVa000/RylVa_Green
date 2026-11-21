"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("./browser-runtime.cjs");
const projectRoot = path.resolve(__dirname, "../..");
const credentials = JSON.parse(fs.readFileSync(path.join(projectRoot, "config/staging-review.local.json"), "utf8"));
const baseUrl = new URL(process.env.RYLVA_STAGING_URL || credentials.baseUrl);
const authorization = "Basic " + Buffer.from(credentials.user + ":" + credentials.password).toString("base64");
const outputRoot = path.join(projectRoot, "storage/reports/staging", baseUrl.hostname === "127.0.0.1" ? "query-local" : "online");

function routeUrl(route)
{
  const logical = new URL(route, baseUrl);
  const destination = new URL("/index.php", baseUrl);
  destination.searchParams.set("route", logical.pathname);
  logical.searchParams.forEach((value, key) => destination.searchParams.append(key, value));
  destination.hash = logical.hash;
  return destination;
}

async function verify()
{
  assert.ok(baseUrl.origin === "https://rylvagreen.biz.id" || baseUrl.hostname === "127.0.0.1");
  fs.mkdirSync(outputRoot, { recursive: true });
  const checks = [];
  const request = (route, options = {}) => fetch(routeUrl(route),
  {
    ...options,
    redirect: "manual",
    signal: AbortSignal.timeout(20000),
    headers: { Authorization: authorization, ...(options.headers || {}) }
  });
  for (const route of ["/", "/index.php", "/pages/public/home.html", "/pages/staff/admin-dashboard.html"])
  {
    const response = await fetch(routeUrl(route), { redirect: "manual", signal: AbortSignal.timeout(20000) });
    assert.equal(response.status, 401, route);
    assert.match(response.headers.get("www-authenticate"), /^Basic /);
  }
  const wrongCredentials = "Basic " + Buffer.from("invalid:invalid").toString("base64");
  assert.equal((await request("/", { headers: { Authorization: wrongCredentials } })).status, 401);
  checks.push("HTTPS storefront and staff documents require valid review credentials");

  let response = await request("/");
  assert.equal(response.status, 302);
  assert.equal(new URL(response.headers.get("location"), baseUrl).searchParams.get("route"), "/pages/public/home.html");
  response = await request("/pages/public/home.html");
  assert.equal(response.status, 200);
  assert.match(await response.text(), /rylva/i);
  assert.match(response.headers.get("x-robots-tag"), /noindex/);
  assert.equal(response.headers.get("x-powered-by"), null);
  checks.push("The normal PHP entry point serves private HTML over the verified HTTPS domain");

  response = await request("/catalog.html?q=daun%20hijau&page=2");
  assert.equal(response.status, 302);
  const destination = new URL(response.headers.get("location"), baseUrl);
  assert.equal(destination.pathname, "/index.php");
  assert.equal(destination.searchParams.get("route"), "/pages/public/catalog.html");
  assert.equal(destination.searchParams.get("q"), "daun hijau");
  assert.equal(destination.searchParams.get("page"), "2");
  checks.push("Query routing reaches legacy aliases and preserves query parameters without web server rewrite");

  const expectedErrors = new Map([
    ["error-403.html", 403], ["error-404.html", 404], ["error-500.html", 500], ["maintenance.html", 503]
  ]);
  const documents = [];
  function collectDocuments(directory)
  {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }))
    {
      if (entry.name.startsWith("."))
      {
        continue;
      }
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory())
      {
        collectDocuments(filePath);
      }
      else if (entry.name.endsWith(".html"))
      {
        documents.push("/" + path.relative(path.join(projectRoot, "public"), filePath).split(path.sep).join("/"));
      }
    }
  }
  collectDocuments(path.join(projectRoot, "public/pages"));
  for (const route of documents)
  {
    response = await request(route);
    assert.equal(response.status, expectedErrors.get(path.posix.basename(route)) || 200, route);
    assert.match(response.headers.get("x-robots-tag"), /noindex/);
    const body = await response.text();
    assert.match(body, /<!doctype html>/i);
    assert.doesNotMatch(body, /Fatal error:|Warning: require|DB_PASSWORD=/);
  }
  checks.push(documents.length + " existing HTML documents return their intended HTTP statuses");

  for (const [route, status] of [["/missing/deep/page", 404], ["/pages/public/error-403.html", 403],
    ["/pages/public/error-500.html", 500], ["/pages/public/maintenance.html", 503]])
  {
    response = await request(route);
    assert.equal(response.status, status, route);
    assert.match(await response.text(), /<base href="\/index\.php\?route=/);
  }
  checks.push("Botanical errors use the intended statuses and resolve assets from deep URLs");

  for (const route of ["/config/.env", "/src/Bootstrap.php", "/vendor/autoload.php", "/assets/",
    "/pages/public/.hallmark/verdict.json", "/_rylva_green_private/", "/.user.ini", "/.htaccess", "/health"])
  {
    response = await request(route);
    assert.ok([403, 404].includes(response.status), route + ": " + response.status);
    assert.doesNotMatch(await response.text(), /DB_PASSWORD=|ComposerAutoloaderInit|Index of/);
  }
  checks.push("Private configuration, source code, dotfiles, directory listings and development health diagnostics are inaccessible");
  response = await request("/missing/deep/page", { method: "HEAD" });
  assert.equal(response.status, 404);
  assert.equal(await response.text(), "");
  response = await request("/pages/public/home.html", { method: "POST", body: "" });
  assert.equal(response.status, 405);
  assert.match(response.headers.get("allow"), /GET/);
  checks.push("HEAD omits the body and static documents reject write methods");

  const fontResponse = await fetch(new URL("/assets/fonts/poppins/poppins-600.woff2", baseUrl),
  {
    signal: AbortSignal.timeout(20000)
  });
  assert.equal(fontResponse.status, 200);
  assert.match(fontResponse.headers.get("content-type"), /font|woff|octet-stream/);
  checks.push("Non-sensitive static assets are served directly by the hosting web server");

  let browser;
  try
  {
    browser = await runtime.launch({ headless: true, pipe: true });
    const page = await browser.newPage();
    await page.authenticate({ username: credentials.user, password: credentials.password });
    const pageErrors = [];
    const failedAssets = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (result) =>
    {
      if (new URL(result.url()).pathname.startsWith("/assets/") && result.status() >= 400)
      {
        failedAssets.push({ path: new URL(result.url()).pathname, status: result.status() });
      }
    });
    for (const width of [1440, 390])
    {
      await page.setViewport({ width, height: width === 390 ? 844 : 1000 });
      for (const [name, route] of [["home", "/pages/public/home.html"], ["account", "/pages/customer/account.html"],
        ["404", "/missing/deep/page"]])
      {
        await page.goto(routeUrl(route).href, { waitUntil: "networkidle0", timeout: 45000 });
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, name);
        if (name === "404")
        {
          assert.equal(await page.$eval("img.public-error-illustration", (image) => image.complete && image.naturalWidth > 0), true);
        }
        await page.screenshot({ path: path.join(outputRoot, name + "-" + width + ".png"), fullPage: true });
      }
    }
    assert.deepEqual(pageErrors, []);
    assert.deepEqual(failedAssets, []);
    checks.push("Home, account preview and botanical 404 render at 1440/390 px without overflow, JavaScript errors or failed assets");
  }
  finally
  {
    if (browser)
    {
      await browser.close();
    }
  }
  const report = { passed: true, checkedAt: new Date().toISOString(), origin: baseUrl.origin,
    checks, htmlDocuments: documents.length, databaseConnectionVerified: false, databaseOperations: 0 };
  fs.writeFileSync(path.join(outputRoot, "tests.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

verify().catch((error) =>
{
  fs.mkdirSync(outputRoot, { recursive: true });
  fs.writeFileSync(path.join(outputRoot, "failure.json"), JSON.stringify({
    passed: false,
    checkedAt: new Date().toISOString(),
    origin: baseUrl.origin,
    reason: error.message
  }, null, 2));
  console.error(error.message);
  process.exitCode = 1;
});
