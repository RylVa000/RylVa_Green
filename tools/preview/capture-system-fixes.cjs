"use strict";

const fs = require("node:fs");
const puppeteer = require("../testing/browser-runtime.cjs");

async function captureFixes()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const page = await browser.newPage();
  const captures = [];
  const folder = ".impeccable/review/system-parameters";

  try
  {
    for (const [code, label] of [["P-32", "session-policy"], ["P-34", "retention-policy"], ["P-46", "maintenance-policy"]])
    {
      await page.goto(`file:///C:/laragon/www/rylva-green/public/system-parameters.html?view=editor&parameter=${code}`,
      {
        waitUntil: "networkidle0"
      });
      await page.evaluate(() => document.fonts.ready);

      for (const width of [1440, 390])
      {
        await page.setViewport({ width, height: 1000 });
        await page.evaluate(() => window.scrollTo(0, 0));
        const path = `${folder}/${label}-${width}.png`;
        await page.screenshot({ path, fullPage: true });
        captures.push(path);
      }
    }

    fs.writeFileSync(`${folder}/correction-captures.json`, JSON.stringify({ captures }, null, 2));
    console.log(`${captures.length} representative policy correction captures saved.`);
  }
  finally
  {
    await browser.close();
  }
}

captureFixes().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
