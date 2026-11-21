"use strict";

const fs = require("node:fs");
const path = require("node:path");
const runtime = require("./browser-runtime.cjs");
const { inspectDocument } = require("./audit-public-ui.cjs");
const OUTPUT = path.resolve(process.env.RYLVA_AUDIT_OUTPUT || "storage/reports/public-ui-audit-2026-11-20");
const BASE_URL = process.env.RYLVA_AUDIT_URL || "http://127.0.0.1:4185";

async function evidence()
{
  const observations = JSON.parse(fs.readFileSync(path.join(OUTPUT, "observations.json"), "utf8"));
  const browser = await runtime.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true, pipe: true });
  const checks = [];
  try
  {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    for (const route of ["about", "how-to-order", "contact", "faq"])
    {
      await page.goto(BASE_URL + "/pages/public/" + route + ".html", { waitUntil: "networkidle0" });
      const targets = await page.$$eval("main a[class*='tombol']", (items) => items.map((item, index) =>
        ({ index, text: item.textContent.trim() })));
      for (const target of targets)
      {
        const handle = (await page.$$("main a[class*='tombol']"))[target.index];
        await handle.hover();
        await new Promise((resolve) => setTimeout(resolve, 250));
        const style = await handle.evaluate((item) =>
        {
          const computed = getComputedStyle(item);
          return { text: item.textContent.trim(), color: computed.color,
            background: computed.backgroundColor, size: computed.fontSize };
        });
        checks.push({ route, state: "hover", ...style });
      }
      const pageState = await page.evaluate(inspectDocument);
      checks.push({ route, state: "visible-control-contrast", findings: pageState.contrast
        .filter((item) => item.selector.includes("tombol")) });
      await page.screenshot({ path: path.join(OUTPUT, "screenshots", route + "-hover-1440.png"), fullPage: true });
    }
    await page.close();
    const sheets = await context.newPage();
    await sheets.setViewport({ width: 1480, height: 1680 });
    for (let index = 0; index < observations.manifest.length; index += 2)
    {
      const entries = observations.manifest.slice(index, index + 2);
      const rows = entries.map((entry) =>
      {
        const desktop = fs.readFileSync(path.join(OUTPUT, "screenshots", entry.name + "-1440-top.png")).toString("base64");
        const mobile = fs.readFileSync(path.join(OUTPUT, "screenshots", entry.name + "-390-top.png")).toString("base64");
        return `
          <section>
            <h2>${entry.area}/${entry.name}</h2>
            <div>
              <img class="desktop" src="data:image/png;base64,${desktop}">
              <img class="mobile" src="data:image/png;base64,${mobile}">
            </div>
          </section>`;
      });
      await sheets.setContent(`
        <!doctype html>
        <html lang="id">
          <head>
            <meta charset="utf-8">
            <style>
              body
              {
                margin: 16px;
                background: #ddd;
                font-family: Arial, sans-serif;
              }
              h2
              {
                margin: 0 0 8px;
                font-size: 18px;
              }
              section
              {
                margin-bottom: 18px;
              }
              section > div
              {
                display: flex;
                align-items: flex-start;
                gap: 16px;
              }
              img
              {
                display: block;
                object-fit: contain;
                object-position: top;
              }
              .desktop
              {
                width: 1080px;
              }
              .mobile
              {
                width: 320px;
              }
            </style>
          </head>
          <body>
            ${rows.join("")}
          </body>
        </html>`);
      await sheets.evaluate(() => Promise.all([...document.images].map((image) => image.decode())));
      await sheets.screenshot({ path: path.join(OUTPUT, "sheet-" + String(index / 2 + 1).padStart(2, "0") + ".png"), fullPage: true });
    }
    const links = [...new Set(observations.results.flatMap((entry) => entry.viewports[0]?.links || [])
      .map((link) => link.href).filter((href) => href.startsWith(BASE_URL)).map((href) =>
      {
        const url = new URL(href);
        url.hash = "";
        return url.href;
      }))];
    const linkResults = [];
    for (const href of links)
    {
      try
      {
        const response = await fetch(href, { method: "HEAD", signal: AbortSignal.timeout(10000) });
        linkResults.push({ href, status: response.status, destination: response.url });
      }
      catch (error)
      {
        linkResults.push({ href, error: error.message });
      }
    }
    fs.writeFileSync(path.join(OUTPUT, "interaction-and-links.json"), JSON.stringify({ checks, links: linkResults }, null, 2));
    console.log("Evidence: " + Math.ceil(observations.manifest.length / 2) + " sheets; " + linkResults.length + " local destinations");
  }
  finally
  {
    await browser.close();
  }
}

evidence().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
