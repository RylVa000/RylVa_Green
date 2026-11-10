const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../testing/browser-runtime.cjs");

async function captureMaterials()
{
  const directory = path.resolve(".impeccable/review/materials");
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });

  try
  {
    const page = await browser.newPage();
    const errors = [];
    const results = [];
    page.on("pageerror", (error) => errors.push(error.message));

    for (const width of [390, 768, 1440, 1920])
    {
      await page.setViewport({ width, height: 1000 });

      for (const [state, query] of
      [
        ["catalog", ""], ["batches", "?material=rose&tab=batches"],
        ["editor", "?material=rose&mode=edit"], ["receipt", "?material=ribbon&mode=receipt"],
        ["usage", "?workspace=usage"]
      ])
      {
        await page.goto(`file:///C:/laragon/www/rylva-green/public/production-materials.html${query}`, { waitUntil: "networkidle0" });
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() =>
        {
          document.activeElement?.blur();
          window.scrollTo(0, 0);
        });
        await page.screenshot({ path: path.join(directory, `${state}-${width}.png`) });
        await page.screenshot({ path: path.join(directory, `${state}-${width}-full.png`), fullPage: true });
        results.push({ state, width, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1) });
      }
    }
    fs.writeFileSync(path.join(directory, "captures.json"), JSON.stringify({ results, errors }, null, 2));
    console.log(JSON.stringify({ results, errors }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

captureMaterials().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
