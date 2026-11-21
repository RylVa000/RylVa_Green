"use strict";

const path = require("node:path");
const fs = require("node:fs");
const packageRuntimePath = path.resolve(__dirname, "node_modules/puppeteer-core");
const runtimePath = process.env.RYLVA_PUPPETEER_PATH
  || (fs.existsSync(packageRuntimePath) ? packageRuntimePath
    : path.resolve(__dirname, "../../.hallmark/runtime/node_modules/puppeteer-core"));

fs.mkdirSync(path.resolve(__dirname, "../../storage/reports/hallmark/screenshots"), { recursive: true });
const puppeteer = require(runtimePath);

function resolveBrowser(requestedPath)
{
  if (process.env.CHROME_PATH)
  {
    return process.env.CHROME_PATH;
  }
  const candidates = [requestedPath,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",
    "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium",
    "/usr/bin/chromium-browser"];
  const installed = candidates.find((candidate) => candidate && fs.existsSync(candidate));
  if (!installed)
  {
    throw new Error("Browser Chromium belum ditemukan. Tetapkan CHROME_PATH ke browser yang tersedia.");
  }
  return installed;
}

module.exports =
{
  ...puppeteer,
  launch(options = {})
  {
    return puppeteer.launch({ ...options, executablePath: resolveBrowser(options.executablePath) });
  }
};
