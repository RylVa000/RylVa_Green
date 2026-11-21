"use strict";

const fs = require("node:fs");
const path = require("node:path");
const runtime = require("./browser-runtime.cjs");
const OUTPUT = path.resolve(process.env.RYLVA_AUDIT_OUTPUT || "storage/reports/public-ui-audit-2026-11-20");
const BASE_URL = process.env.RYLVA_AUDIT_URL || "http://127.0.0.1:4185";

async function probe()
{
  const browser = await runtime.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true, pipe: true });
  const results = [];
  try
  {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    for (const route of ["home", "catalog"])
    {
      await page.setViewport({ width: 1440, height: 1000 });
      await page.goto(BASE_URL + "/pages/public/" + route + ".html", { waitUntil: "networkidle0" });
      await page.click('header [data-storefront-page="Wishlist"]');
      await new Promise((resolve) => setTimeout(resolve, 500));
      results.push(await page.evaluate((value) =>
        ({ route: value, state: "wishlist-header-click", url: location.href,
          visible: Boolean(document.querySelector("#home-wishlist-panel:not([hidden])")),
          expanded: document.querySelector("[data-header-wishlist-trigger]")?.getAttribute("aria-expanded") }), route));
    }
    for (const [route, query] of [["catalog", "preview=catalog&state=longContent"],
      ["category", "category=plants&preview=catalog&state=longContent"],
      ["home", "preview=home&state=longContent"], ["new-collection", "preview=collections&state=longContent"]])
    {
      await page.setViewport({ width: 320, height: 844 });
      await page.goto(BASE_URL + "/pages/public/" + route + ".html?" + query, { waitUntil: "networkidle0" });
      await page.waitForSelector(".home-price--long");
      const price = await page.$eval(".home-price--long", (item) =>
      {
        const unit = item.querySelector("small");
        return { text: item.textContent, font: getComputedStyle(item).fontSize,
          unitFont: unit ? getComputedStyle(unit).fontSize : null,
          overflow: item.scrollWidth > item.clientWidth };
      });
      await page.$eval(".home-price--long", (item) => item.closest(".home-product").scrollIntoView({ block: "center" }));
      await new Promise((resolve) => setTimeout(resolve, 500));
      await page.screenshot({ path: path.join(OUTPUT, "screenshots", route + "-long-price-320.png") });
      results.push({ route, state: "long-price", ...price });
    }
    for (const route of ["about", "cancellation-refund", "care-guides", "florist-partners",
      "how-to-order", "privacy-policy", "shipping-information", "terms-conditions"])
    {
      await page.setViewport({ width: 1440, height: 1000 });
      await page.goto(BASE_URL + "/pages/public/" + route + ".html", { waitUntil: "networkidle0" });
      const alignment = await page.$$eval(".shipping-help-actions, .care-help, .care-list-help", (groups) => groups.map((group) =>
      {
        const controls = [...group.querySelectorAll("a,button")].map((item) =>
        {
          const bounds = item.getBoundingClientRect();
          return { text: item.textContent.trim(), top: bounds.top, height: bounds.height };
        });
        return { controls, align: getComputedStyle(group).alignItems };
      }));
      await page.evaluate(() =>
      {
        const close = document.querySelector(".shipping-help, .care-help, .care-list-help");
        if (close)
        {
          close.scrollIntoView({ block: "start" });
        }
        else
        {
          scrollTo(0, document.documentElement.scrollHeight);
        }
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
      await page.screenshot({ path: path.join(OUTPUT, "screenshots", route + "-close-1440.png") });
      results.push({ route, state: "closing-actions", alignment });
    }
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(BASE_URL + "/pages/public/florist-partners.html", { waitUntil: "networkidle0" });
    for (const width of [1440, 768, 390, 320])
    {
      await page.setViewport({ width, height: 844 });
      await page.evaluate(() => scrollTo(0, 0));
      await new Promise((resolve) => setTimeout(resolve, 500));
      results.push(await page.$$eval("header a.storefront-page-link", (items, value) =>
        ({ route: "florist-partners", state: "navigation-size", width: value,
          targets: items.map((item) => ({ text: item.textContent.trim(), height: item.getBoundingClientRect().height,
            display: getComputedStyle(item).display, minHeight: getComputedStyle(item).minHeight })) }), width));
    }
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(BASE_URL + "/pages/public/about.html", { waitUntil: "networkidle0" });
    await page.evaluate(() => document.querySelector(".storefront-footer").scrollIntoView());
    await page.evaluate(() => document.fonts.ready);
    const client = await page.createCDPSession();
    await client.send("DOM.enable");
    await client.send("CSS.enable");
    const documentNode = await client.send("DOM.getDocument");
    const footerHeading = await client.send("DOM.querySelector", { nodeId: documentNode.root.nodeId, selector: ".storefront-footer h2 button" });
    const fonts = await client.send("CSS.getPlatformFontsForNode", { nodeId: footerHeading.nodeId });
    results.push({ route: "about", state: "footer-actual-font", fonts: fonts.fonts });
    await client.detach();

    await page.goto(BASE_URL + "/pages/public/care-guide-detail.html?guide=monstera", { waitUntil: "networkidle0" });
    await page.waitForSelector('[data-home-detail="monstera"]');
    await page.click('[data-home-detail="monstera"]');
    await page.waitForFunction(() => location.pathname.endsWith("product-detail.html")
      && document.getElementById("product-content")?.getAttribute("aria-busy") === "false");
    results.push(await page.$eval("#product-back", (item) =>
      ({ route: "care-guide-detail", state: "product-back-settled", text: item.textContent, href: item.href })));
    await page.click("#product-back");
    await page.waitForFunction(() => location.pathname.endsWith("care-guide-detail.html") && document.querySelector("#care-detail-toc"));
    results.push({ route: "care-guide-detail", state: "returned", url: page.url() });

    await page.goto(BASE_URL + "/pages/public/home.html", { waitUntil: "networkidle0" });
    await page.click("[data-home-collection=seeds]");
    await page.waitForFunction(() => location.pathname.endsWith("category.html")
      && document.getElementById("catalog-products")?.getAttribute("aria-busy") === "false");
    results.push({ route: "home", state: "seed-category-recovery", url: page.url(),
      text: await page.$eval("#catalog-products", (item) => item.innerText) });

    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.goto(BASE_URL + "/pages/public/home.html", { waitUntil: "networkidle0" });
    results.push(await page.$eval("header", (item) =>
      ({ route: "home", state: "reduced-motion", headerTransition: getComputedStyle(item).transitionDuration })));
    fs.writeFileSync(path.join(OUTPUT, "probes.json"), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

probe().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
