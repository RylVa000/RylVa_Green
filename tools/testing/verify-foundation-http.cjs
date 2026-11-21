"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");
const { spawn } = require("node:child_process");
const runtime = require("./browser-runtime.cjs");
const ROOT = path.resolve(__dirname, "../..");
const OUTPUT = path.join(ROOT, "storage/reports/foundation");
const PHP = process.env.RYLVA_PHP_BIN
  || (process.platform === "win32" ? "C:/laragon/bin/php/php-8.3.36-Win32-vs16-x64/php.exe" : "php");
const TEST_ENV_FILE = process.env.RYLVA_TEST_ENV_FILE || path.join(ROOT, "config/.env.testing");

async function freePort()
{
  const server = net.createServer();
  await new Promise((resolve, reject) =>
  {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function startServer(overrides = {})
{
  const port = await freePort();
  const baseUrl = "http://127.0.0.1:" + port;
  const child = spawn(PHP, ["-d", "display_errors=0", "-d", "expose_php=0", "-d", "log_errors=1",
    "-S", "127.0.0.1:" + port, "-t", "public", "tools/preview/router.php"],
  {
    cwd: ROOT,
    env: { ...process.env, RYLVA_ENV_FILE: TEST_ENV_FILE, ...overrides },
    windowsHide: true,
    stdio: ["ignore", "ignore", "pipe"]
  });
  let log = "";
  child.stderr.on("data", (data) =>
  {
    log = (log + data.toString()).slice(-12000);
  });
  let spawnError = null;
  child.on("error", (error) =>
  {
    spawnError = error;
  });
  const stop = async () =>
  {
    if (child.exitCode === null && !child.killed)
    {
      const exited = new Promise((resolve) => child.once("exit", resolve));
      child.kill();
      await exited;
    }
  };
  for (let attempt = 0; attempt < 50; attempt++)
  {
    if (spawnError || child.exitCode !== null)
    {
      throw new Error("PHP development server could not start: " + (spawnError?.message || log));
    }
    try
    {
      await fetch(baseUrl + "/", { redirect: "manual", signal: AbortSignal.timeout(500) });
      return { baseUrl, stop };
    }
    catch
    {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  await stop();
  throw new Error("PHP development server did not become ready.");
}

async function verify()
{
  fs.mkdirSync(path.join(OUTPUT, "screenshots"), { recursive: true });
  const checks = [];
  const servers = [];
  let browser = null;
  try
  {
    const normal = await startServer();
    servers.push(normal);
    let response = await fetch(normal.baseUrl + "/health");
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok", services: { database: "ok" } });
    assert.match(response.headers.get("x-request-id"), /^[a-f0-9]{16}$/);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("x-powered-by"), null);
    checks.push("A real HTTP request traverses the front controller/kernel and checks MySQL");
    for (const route of ["/", "/index.php"])
    {
      response = await fetch(normal.baseUrl + route, { redirect: "manual" });
      assert.equal(response.status, 302);
      assert.equal(response.headers.get("location"), "/pages/public/home.html");
    }
    checks.push("Root and direct front-controller requests preserve the existing storefront entry");
    const legacyPaths = JSON.parse(fs.readFileSync(path.join(ROOT, "config/preview-pages.json"), "utf8"));
    for (const [alias, destination] of Object.entries(legacyPaths))
    {
      response = await fetch(normal.baseUrl + "/" + alias + "?q=daun%20hijau&page=2", { redirect: "manual" });
      assert.equal(response.status, 302, alias);
      assert.equal(response.headers.get("location"), "/" + destination + "?q=daun%20hijau&page=2");
    }
    checks.push("Every existing HTML alias redirects using the shared manifest and preserves query parameters");
    for (const route of ["/health", "/pages/public/error-404.html"])
    {
      response = await fetch(normal.baseUrl + route, { method: "HEAD" });
      assert.equal(response.status, route === "/health" ? 200 : 404);
      assert.equal(await response.text(), "");
    }
    checks.push("HEAD returns the correct status and no response body");
    response = await fetch(normal.baseUrl + "/health", { method: "POST" });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "GET, HEAD");
    assert.equal((await response.json()).error.requestId, response.headers.get("x-request-id"));
    checks.push("Wrong methods return 405, allowed methods and a correlated request identifier");
    response = await fetch(normal.baseUrl + "/api/not-implemented", { headers: { Accept: "application/json" } });
    assert.equal(response.status, 404);
    assert.equal((await response.json()).error.code, "NOT_FOUND");
    checks.push("Unimplemented business APIs remain explicit 404s");
    for (const [route, status] of [["error-403", 403], ["error-404", 404], ["error-500", 500], ["maintenance", 503]])
    {
      response = await fetch(normal.baseUrl + "/pages/public/" + route + ".html");
      assert.equal(response.status, status);
      assert.match(response.headers.get("content-type"), /text\/html/);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.match(await response.text(), /<base href="\/pages\/public\/">/);
    }
    checks.push("All four existing botanical system pages carry their actual HTTP status");
    for (const [route, status] of [["/bad%00path", 400], ["/config/.env", 403], ["/assets/", 403],
      ["/src/Bootstrap.php", 404], ["/vendor/autoload.php", 404]])
    {
      response = await fetch(normal.baseUrl + route);
      assert.equal(response.status, status, route);
      assert.doesNotMatch(await response.text(), /DB_PASSWORD=|class AppConfig|ComposerAutoloaderInit/);
    }
    checks.push("Malformed paths, dotfiles, directory listing and private project files are not served");
    response = await fetch(normal.baseUrl + "/assets/fonts/poppins/poppins-600.woff2");
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /woff2/);
    assert.ok((await response.arrayBuffer()).byteLength > 40000);
    checks.push("PHP static serving loads the actual WOFF2 asset with its MIME type");

    const unusedDatabasePort = await freePort();
    const unavailable = await startServer({ DB_PORT: String(unusedDatabasePort) });
    servers.push(unavailable);
    response = await fetch(unavailable.baseUrl + "/health");
    assert.equal(response.status, 503);
    const failure = await response.text();
    assert.equal(JSON.parse(failure).error.code, "DATABASE_UNAVAILABLE");
    assert.doesNotMatch(failure, /SQLSTATE|PDO|DB_PASSWORD|rylva_green_m0_test|13367/);
    checks.push("Unavailable MySQL produces a sanitized, retryable 503 response");
    const production = await startServer({ APP_ENV: "production", APP_DEBUG: "false" });
    servers.push(production);
    response = await fetch(production.baseUrl + "/health", { headers: { Accept: "application/json" } });
    assert.equal(response.status, 404);
    checks.push("Development health diagnostics are not registered in production");
    const invalid = await startServer({ APP_ENV: "production", APP_DEBUG: "true" });
    servers.push(invalid);
    response = await fetch(invalid.baseUrl + "/health", { headers: { Accept: "application/json" } });
    assert.equal(response.status, 500);
    assert.doesNotMatch(await response.text(), /Stack trace|APP_DEBUG|DB_PASSWORD|Fatal error|\.php/);
    checks.push("Invalid startup configuration fails without exposing configuration or a PHP trace");

    browser = await runtime.launch({ headless: true, pipe: true });
    const page = await browser.newPage();
    const browserErrors = [];
    const failedAssets = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("response", (resource) =>
    {
      if (resource.request().resourceType() !== "document" && resource.status() >= 400)
      {
        failedAssets.push(resource.url());
      }
    });
    for (const [route, name] of [["/missing/deep/page", "nested-404"],
      ["/pages/public/home.html", "home"], ["/pages/customer/account.html?state=normal", "account"]])
    {
      for (const width of [1440, 390])
      {
        await page.setViewport({ width, height: width === 390 ? 844 : 1000 });
        await page.goto(normal.baseUrl + route, { waitUntil: "networkidle0" });
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        assert.equal(await page.$$eval("main h1", (items) => items.filter((item) => item.checkVisibility()).length), 1);
        if (name === "nested-404")
        {
          assert.equal(await page.$eval("img.public-error-illustration", (image) => image.complete && image.naturalWidth > 0), true);
        }
        await page.screenshot({ path: path.join(OUTPUT, "screenshots", name + "-" + width + ".png"), fullPage: true });
      }
    }
    assert.deepEqual(browserErrors, []);
    assert.deepEqual(failedAssets, []);
    checks.push("Rendered Home, Account and nested botanical 404 retain their assets/layout at desktop and mobile widths");
    fs.writeFileSync(path.join(OUTPUT, "http-tests.json"), JSON.stringify({ passed: true, checks, browserErrors, failedAssets }, null, 2));
    console.log(JSON.stringify({ passed: true, checks, browserErrors, failedAssets }, null, 2));
  }
  finally
  {
    if (browser)
    {
      await browser.close();
    }
    for (const server of servers.reverse())
    {
      await server.stop();
    }
  }
}

verify().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
