const fs = require("node:fs");
const puppeteer = require("../testing/browser-runtime.cjs");

async function captureCustomers()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const page = await browser.newPage();
  const base = "file:///C:/laragon/www/rylva-green/public/customers.html";
  const directory = ".impeccable/review/customers";
  const errors = [];
  const captures = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try
  {
    for (const width of [390, 768, 1440])
    {
      await page.setViewport({ width, height: 1000 });
      for (const [state, query] of
      [
        ["list", ""],
        ["overview", "?customer=PLG-0003"],
        ["orders", "?customer=PLG-0001&tab=orders"],
        ["addresses", "?customer=PLG-0002&tab=addresses"],
        ["notes", "?customer=PLG-0002&tab=notes"],
        ["activity", "?role=superadmin&customer=PLG-0008&tab=activity"],
        ["confirmation", "?role=superadmin&customer=PLG-0008"]
      ])
      {
        await page.goto(base + query, { waitUntil: "networkidle0" });
        await page.evaluate(() => document.fonts.ready);
        if (state === "confirmation")
        {
          await page.click('[data-customer-action="anonymize"]');
        }
        else
        {
          await page.evaluate(() =>
          {
            document.activeElement?.blur();
            scrollTo(0, 0);
          });
        }
        const file = `${directory}/${state}-${width}.png`;
        await page.screenshot({ path: file, fullPage: state !== "confirmation" });
        captures.push(file);
      }
    }
    await page.setViewport({ width: 390, height: 900 });
    for (const state of ["empty", "loading", "error"])
    {
      await page.goto(base, { waitUntil: "networkidle0" });
      await page.select("#customer-load-state", state);
      await page.evaluate(() => scrollTo(0, 0));
      const file = `${directory}/${state}-390.png`;
      await page.screenshot({ path: file, fullPage: true });
      captures.push(file);
    }
    fs.writeFileSync(`${directory}/final-captures.json`, JSON.stringify({ captures, errors }, null, 2));
    console.log(JSON.stringify({ captured: captures.length, errors }));
  }
  finally
  {
    await browser.close();
  }
}

captureCustomers().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
