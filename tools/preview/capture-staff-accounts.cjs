"use strict";

const fs = require("node:fs");
const puppeteer = require("../testing/browser-runtime.cjs");

async function captureStaffAccounts()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const page = await browser.newPage();
  const folder = ".impeccable/review/staff-accounts";
  const captures = [];
  fs.mkdirSync(folder, { recursive: true });

  async function open(url, width, name)
  {
    await page.setViewport({ width, height: 1000, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
    const path = `${folder}/${name}-${width}.png`;
    await page.screenshot({ path, fullPage: true });
    captures.push(path);
  }

  try
  {
    await open("http://127.0.0.1:4178/staff-accounts.html?role=superadmin", 1440, "list");
    await open("http://127.0.0.1:4178/staff-accounts.html?role=superadmin", 768, "list");
    await open("http://127.0.0.1:4178/staff-accounts.html?role=superadmin", 390, "list");
    await open("http://127.0.0.1:4178/staff-accounts.html?role=superadmin&view=detail&user=admin-03", 1440, "detail-reset-mfa");
    await open("http://127.0.0.1:4178/staff-accounts.html?role=superadmin&view=detail&user=admin-03", 768, "detail-reset-mfa");
    await open("http://127.0.0.1:4178/staff-accounts.html?role=superadmin&view=detail&user=admin-03", 390, "detail-reset-mfa");
    for (const tab of ["permissions", "activation", "security", "activity"])
    {
      await open(
        `http://127.0.0.1:4178/staff-accounts.html?role=superadmin&view=detail&user=admin-03&tab=${tab}`,
        1440,
        `detail-${tab}`
      );
    }

    await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
    await page.goto("http://127.0.0.1:4178/staff-accounts.html?role=superadmin", { waitUntil: "networkidle0" });
    await page.click('[data-staff-action="open-invite"]');
    const invitePath = `${folder}/dialog-invite-1440.png`;
    await page.screenshot({ path: invitePath, fullPage: true });
    captures.push(invitePath);

    await page.goto("http://127.0.0.1:4178/staff-accounts.html?role=superadmin&view=detail&user=admin-03", { waitUntil: "networkidle0" });
    await page.click('[data-staff-action="reset-mfa"]');
    const resetPath = `${folder}/dialog-reset-mfa-1440.png`;
    await page.screenshot({ path: resetPath, fullPage: true });
    captures.push(resetPath);

    await page.goto("http://127.0.0.1:4178/staff-accounts.html?role=superadmin&view=detail&user=admin-02", { waitUntil: "networkidle0" });
    await page.evaluate(() =>
    {
      document.getElementById("staff-fail-email").checked = true;
    });
    await page.click('[data-staff-action="reissue"]');
    await page.click('[data-staff-action="submit-action"]');
    const reissueFailurePath = `${folder}/dialog-reissue-failure-1440.png`;
    await page.screenshot({ path: reissueFailurePath, fullPage: true });
    captures.push(reissueFailurePath);

    await open("http://127.0.0.1:4178/staff-accounts.html?role=admin", 1440, "access-denied");
    fs.writeFileSync(`${folder}/captures.json`, JSON.stringify({ captures }, null, 2));
    console.log(`${captures.length} staff account review captures saved.`);
  }
  finally
  {
    await browser.close();
  }
}

captureStaffAccounts().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
