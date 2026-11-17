"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_CHECKBOX_URL || "http://127.0.0.1:4185";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/shared-checkbox");
const CHECKBOX_STYLESHEET = path.resolve("public/assets/css/shared/checkbox.css");

function readDependencies(file, expression, visited = new Set())
{
  if (visited.has(file) || !fs.existsSync(file))
  {
    return visited;
  }
  visited.add(file);
  for (const match of fs.readFileSync(file, "utf8").matchAll(expression))
  {
    if (!match[1].startsWith("http"))
    {
      readDependencies(path.resolve(path.dirname(file), match[1]), expression, visited);
    }
  }
  return visited;
}

function verifyStylesheetCoverage()
{
  const pages = fs.readdirSync(path.resolve("public/pages"), { recursive: true })
    .filter((file) => file.endsWith(".html"));
  const coveredPages = [];
  for (const page of pages)
  {
    const file = path.resolve("public/pages", page);
    const markup = fs.readFileSync(file, "utf8");
    const scripts = [...markup.matchAll(/<script[^>]+src="([^"]+)"/g)]
      .filter((match) => !match[1].startsWith("http"))
      .map((match) => path.resolve(path.dirname(file), match[1]))
      .filter((script) => fs.existsSync(script));
    const content = markup + scripts.map((script) => fs.readFileSync(script, "utf8")).join("\n");
    if (!/type\s*=\s*["']checkbox["']/.test(content))
    {
      continue;
    }
    const styles = [...markup.matchAll(/<link[^>]+href="([^"]+\.css)"/g)];
    const dependencies = new Set();
    for (const match of styles)
    {
      readDependencies(path.resolve(path.dirname(file), match[1]), /@import\s+url\(["']([^"']+)["']\)/g, dependencies);
    }
    assert.ok(dependencies.has(CHECKBOX_STYLESHEET), page + " must use the shared checkbox skin");
    coveredPages.push(page.replaceAll("\\", "/"));
  }
  return coveredPages;
}

async function verifyCheckboxes()
{
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  const coveredPages = verifyStylesheetCoverage();
  const checks = ["All " + coveredPages.length + " pages containing native checkboxes load the shared skin"];
  const errors = [];
  const browser = await runtime.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true
  });
  const page = await browser.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());
  await page.setRequestInterception(true);
  page.on("request", (request) =>
  {
    if (/^https?:/.test(request.url()) && !request.url().startsWith(BASE_URL))
    {
      request.abort();
    }
    else
    {
      request.continue();
    }
  });

  async function open(route)
  {
    await page.goto(BASE_URL + route, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
  }

  async function checkSkin(selector, name)
  {
    await page.waitForSelector(selector, { visible: true });
    const style = await page.$eval(selector, (input) =>
    {
      const computed = getComputedStyle(input);
      return { radius: computed.borderRadius, appearance: computed.appearance, width: input.getBoundingClientRect().width };
    });
    assert.equal(style.radius, "6px", name);
    assert.equal(style.appearance, "none", name);
    assert.ok(style.width >= 16 && style.width <= 24, name + " keeps local form dimensions");
  }

  try
  {
    await page.setViewport({ width: 1440, height: 900 });
    await open("/pages/public/catalog.html");
    const category = '.catalog-filter-panel input[type="checkbox"]';
    await checkSkin(category, "Catalog");
    await page.focus(category);
    await page.keyboard.press("Space");
    assert.equal(await page.$eval(category, (input) => input.checked), true);
    assert.equal(await page.$eval(category, (input) => getComputedStyle(input).outlineStyle), "solid");
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "catalog-desktop.png") });
    await page.keyboard.press("Space");
    assert.equal(await page.$eval(category, (input) => input.checked), false);
    checks.push("Catalog checkbox toggles with Space and shows keyboard focus");

    await open("/pages/customer/cart.html?preview=cart&state=normal");
    await checkSkin("#cart-select-all", "Cart");
    assert.equal(await page.$eval("#cart-select-all", (input) => input.indeterminate), true);
    assert.ok(await page.$eval("#cart-select-all", (input) =>
      decodeURIComponent(getComputedStyle(input).backgroundImage).includes("M6 12h12")));
    await page.click("#cart-select-all");
    await page.waitForFunction(() => document.getElementById("cart-select-all")?.checked);
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "cart-selected.png") });
    checks.push("Cart mixed selection and select-all remain functional");

    await open("/pages/customer/checkout.html?preview=checkout&state=normal");
    await checkSkin("#gift-enabled", "Checkout");
    await page.click("#gift-enabled");
    await page.waitForSelector("#gift-anonymous");
    await checkSkin("#gift-anonymous", "Checkout gift");
    checks.push("Checkout gift controls retain native selection and reveal dependent fields");

    await open("/pages/customer/account.html?state=mapUnavailable&section=addresses");
    await page.click('[data-account-action="addAddress"]');
    await checkSkin("#account-primary", "Account address");
    await page.click("#account-primary");
    assert.equal(await page.$eval("#account-primary", (input) => input.checked), true);
    checks.push("Account address checkbox uses the same skin inside the native dialog");

    await open("/pages/auth/customer-register.html?preview=auth&state=normal");
    await checkSkin("#auth-consent", "Registration");
    await page.click('label[for="auth-consent"]');
    assert.equal(await page.$eval("#auth-consent", (input) => input.checked), true);
    const checkedImage = await page.$eval("#auth-consent", (input) => getComputedStyle(input).backgroundImage);
    assert.ok(decodeURIComponent(checkedImage).includes("stroke-linecap='round'"));
    const client = await page.createCDPSession();
    await client.send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value: "active" }] });
    assert.equal(await page.$eval("#auth-consent", (input) => getComputedStyle(input).appearance), "auto");
    await client.send("Emulation.setEmulatedMedia", { features: [] });
    await page.$eval("#auth-consent", (input) => input.disabled = true);
    assert.equal(await page.$eval("#auth-consent", (input) => getComputedStyle(input).cursor), "not-allowed");
    checks.push("Registration label toggles consent; disabled and forced-colors states stay usable");

    await open("/pages/staff/products.html");
    await page.$eval("#product-fail-save", (input) => input.closest("details").open = true);
    await checkSkin("#product-fail-save", "Staff");
    await page.click("#product-fail-save");
    assert.equal(await page.$eval("#product-fail-save", (input) => input.checked), true);
    checks.push("Staff checkbox shares the design while preserving existing form behavior");

    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await open("/pages/public/catalog.html");
    await page.click('[data-catalog-sheet="filter"]');
    await checkSkin('#catalog-sheet input[type="checkbox"]', "Mobile filter");
    await page.$eval("#catalog-sheet", async (sheet) =>
    {
      await Promise.all(sheet.getAnimations().map((animation) => animation.finished.catch(() => undefined)));
    });
    await page.click('#catalog-sheet input[type="checkbox"]');
    await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, "catalog-mobile.png") });
    checks.push("Mobile filter sheet uses the shared rounded check and remains interactive");
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "verification.json"), JSON.stringify({ coveredPages, checks, errors }, null, 2));
    checks.forEach((check) => console.log("PASS " + check));
  }
  finally
  {
    await browser.close();
  }
}

verifyCheckboxes().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
