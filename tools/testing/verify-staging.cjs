"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("./browser-runtime.cjs");
const root = path.resolve(__dirname, "../..");
const privateFile = process.env.RYLVA_STAGING_CREDENTIAL_FILE
  || path.join(root, "storage/cache/apache-staging/review-credentials.json");
const credentials = JSON.parse(fs.readFileSync(privateFile, "utf8").replace(/^\uFEFF/, ""));
const baseUrl = new URL(process.env.RYLVA_STAGING_URL || credentials.baseUrl);
if (!["127.0.0.1", "localhost", "[::1]"].includes(baseUrl.hostname) && baseUrl.protocol !== "https:")
{
  throw new Error("Remote staging verification requires HTTPS.");
}
const authorization = "Basic " + Buffer.from(credentials.user + ":" + credentials.password).toString("base64");
const output = path.join(root, "storage/reports/staging");

async function verify()
{
  const checks = [];
  fs.mkdirSync(output, { recursive: true });
  const request = (route, options = {}) => fetch(new URL(route, baseUrl),
  {
    ...options,
    redirect: "manual",
    signal: AbortSignal.timeout(10000),
    headers: { Authorization: authorization, ...(options.headers || {}) }
  });
  for (const route of ["/", "/pages/public/home.html", "/pages/staff/admin-dashboard.html", "/assets/fonts/poppins/poppins-600.woff2"])
  {
    const denied = await fetch(new URL(route, baseUrl), { redirect: "manual", signal: AbortSignal.timeout(10000) });
    assert.equal(denied.status, 401, route);
    assert.match(denied.headers.get("www-authenticate"), /^Basic /);
  }
  checks.push("Anonymous access is denied for storefront, staff prototypes and assets");
  let response = await request("/", { headers: { Authorization: "Basic " + Buffer.from("invalid:invalid").toString("base64") } });
  assert.equal(response.status, 401);
  checks.push("Incorrect review credentials are rejected");
  response = await request("/");
  assert.equal(response.status, 302);
  assert.equal(new URL(response.headers.get("location"), baseUrl).pathname, "/pages/public/home.html");
  response = await request("/pages/public/home.html");
  assert.equal(response.status, 200);
  assert.match(await response.text(), /rylva/i);
  assert.match(response.headers.get("x-robots-tag"), /noindex/);
  assert.equal(response.headers.get("x-powered-by"), null);
  assert.doesNotMatch(response.headers.get("server") || "", /PHP|Apache\//);
  checks.push("Authenticated Apache serves the storefront without runtime version disclosure and disallows indexing");
  response = await request("/health", { headers: { Accept: "application/json" } });
  assert.equal(response.status, 404);
  checks.push("Staging environment disables development health diagnostics");
  response = await request("/catalog.html?q=daun%20hijau&page=2");
  assert.equal(response.status, 302);
  const destination = new URL(response.headers.get("location"), baseUrl);
  assert.equal(destination.pathname, "/pages/public/catalog.html");
  assert.equal(destination.searchParams.get("q"), "daun hijau");
  assert.equal(destination.searchParams.get("page"), "2");
  checks.push("Apache rewrite reaches PHP aliases and retains the query context");
  for (const [route, status] of [["/missing/deep/page", 404], ["/pages/public/error-403.html", 403],
    ["/pages/public/error-500.html", 500], ["/pages/public/maintenance.html", 503]])
  {
    response = await request(route);
    assert.equal(response.status, status, route);
    assert.match(await response.text(), /<base href="\/pages\/public\/">/);
  }
  checks.push("Real Apache routing returns botanical errors with the correct status and asset base");
  for (const route of ["/config/.env", "/src/Bootstrap.php", "/vendor/autoload.php", "/assets/", "/pages/public/.hallmark/verdict.json"])
  {
    response = await request(route);
    assert.ok([403, 404].includes(response.status), route);
    assert.doesNotMatch(await response.text(), /DB_PASSWORD=|ComposerAutoloaderInit|class AppConfig|Index of/);
  }
  checks.push("Private files, workbench dot-directories and directory listings are not exposed");
  response = await request("/missing/deep/page", { method: "HEAD" });
  assert.equal(response.status, 404);
  assert.equal(await response.text(), "");
  checks.push("HEAD preserves status and sends no document body through Apache");

  let browser;
  try
  {
    browser = await runtime.launch({ headless: true, pipe: true });
    const page = await browser.newPage();
    await page.authenticate({ username: credentials.user, password: credentials.password });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const width of [1440, 390])
    {
      await page.setViewport({ width, height: width === 390 ? 844 : 1000 });
      await page.goto(new URL("/missing/deep/page", baseUrl).href, { waitUntil: "networkidle0" });
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.$eval("img.public-error-illustration", (image) => image.complete && image.naturalWidth > 0), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.screenshot({ path: path.join(output, "apache-404-" + width + ".png"), fullPage: true });
    }
    assert.deepEqual(errors, []);
    checks.push("Protected Apache renders the botanical error and its assets at desktop/mobile widths");
  }
  finally
  {
    if (browser)
    {
      await browser.close();
    }
  }
  const report = { passed: true, checks, origin: baseUrl.origin, remoteDeployment: !["127.0.0.1", "localhost", "[::1]"].includes(baseUrl.hostname) };
  fs.writeFileSync(path.join(output, "apache-tests.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

verify().catch((error) =>
{
  console.error(error.message);
  process.exitCode = 1;
});
