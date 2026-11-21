"use strict";

// Re-encode existing photographs; the PNG originals remain the source assets.
const fs = require("node:fs");
const path = require("node:path");
const runtime = require("./browser-runtime.cjs");

async function optimize()
{
  const browser = await runtime.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true
  });

  try
  {
    const page = await browser.newPage();
    await page.goto("http://127.0.0.1:4185/pages/public/product-detail.html?product=monstera");
    const manifest = [];

    for (const name of ["monstera-main", "monstera-room", "monstera-close"])
    {
      const variants = await page.evaluate(async (assetName) =>
      {
        const image = new Image();
        image.src = "/assets/images/product-detail/" + assetName + ".png";
        await image.decode();

        return [
          { suffix: "", maxWidth: image.naturalWidth },
          { suffix: "-360", maxWidth: 360 },
          { suffix: "-thumb", maxWidth: 160 }
        ].map((variant) =>
        {
          const canvas = document.createElement("canvas");
          canvas.width = Math.min(variant.maxWidth, image.naturalWidth);
          canvas.height = Math.round(image.naturalHeight * canvas.width / image.naturalWidth);
          canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
          return { suffix: variant.suffix, width: canvas.width, height: canvas.height,
            data: canvas.toDataURL("image/webp", 0.88).split(",")[1] };
        });
      }, name);

      for (const variant of variants)
      {
        const file = path.resolve("public/assets/images/product-detail", name + variant.suffix + ".webp");
        const bytes = Buffer.from(variant.data, "base64");
        fs.writeFileSync(file, bytes);
        manifest.push({ name: path.basename(file), width: variant.width, height: variant.height, bytes: bytes.length });
      }
    }

    console.log(JSON.stringify(manifest, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

optimize().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
