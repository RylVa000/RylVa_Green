"use strict";

const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

async function verifyStaffAccounts()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const page = await browser.newPage();
  const errors = [];

  page.on("console", (message) =>
  {
    if (message.type() === "error")
    {
      errors.push(message.text());
    }
  });

  page.on("response", (response) =>
  {
    if (response.status() >= 400)
    {
      errors.push(`${response.status()} ${response.url()}`);
    }
  });

  async function open(url)
  {
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
  }

  function assert(condition, message)
  {
    if (!condition)
    {
      throw new Error(message);
    }
  }

  try
  {
    await open("http://127.0.0.1:4178/staff-accounts.html?role=superadmin");
    assert(await page.$("h1") !== null, "Daftar: heading tidak ditemukan.");
    assert(await page.$$eval(".staff-table tbody tr", (rows) => rows.length) > 0, "Daftar: baris akun tidak ditemukan.");
    await page.click('[data-staff-action="segment"][data-segment="attention"]');
    assert((await page.$eval(".staff-list-meta", (node) => node.textContent)).includes("akun"), "Filter perhatian tidak merender meta daftar.");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.click('[data-staff-action="detail"]');
    assert(await page.evaluate(() => window.scrollY) === 0, "Detail tidak dibuka dari atas.");
    assert(await page.$('.staff-detail-tabs [data-tab="overview"][aria-current="page"]') !== null, "Ringkasan tidak aktif.");
    for (const tab of ["permissions", "activation", "security", "activity", "overview"])
    {
      await page.click(`[data-staff-action="detail-tab"][data-tab="${tab}"]`);
      assert(await page.$(`.staff-detail-tabs [data-tab="${tab}"][aria-current="page"]`) !== null, `Navigasi ${tab} tidak aktif.`);
    }

    await open("http://127.0.0.1:4178/staff-accounts.html?role=superadmin&view=detail&user=admin-03");
    assert((await page.$eval("h1", (node) => node.textContent)).includes("Maya"), "Detail: akun Maya tidak ditemukan.");
    await page.click('[data-staff-action="reset-mfa"]');
    assert(await page.$("#staff-action-form") !== null, "Dialog reset MFA tidak terbuka.");
    await page.click('[data-staff-action="close-dialog"]');

    await open("http://127.0.0.1:4178/staff-accounts.html?role=superadmin");
    await page.click('[data-staff-action="open-invite"]');
    await page.type("#staff-invite-name", "Akun Baru");
    await page.type("#staff-invite-email", "bukan-email");
    await page.click('[data-staff-action="submit-invite"]');
    assert(await page.$("#staff-dialog-errors:not([hidden])") !== null, "Validasi undangan tidak muncul.");

    await open("http://127.0.0.1:4178/staff-accounts.html?role=superadmin&view=detail&user=admin-02");
    const beforeReissue = await page.evaluate(() => window.staffAccountsDemo.snapshot().users.find((user) => user.id === "admin-02"));
    await page.evaluate(() =>
    {
      document.getElementById("staff-fail-email").checked = true;
    });
    await page.click('[data-staff-action="reissue"]');
    await page.click('[data-staff-action="submit-action"]');
    assert(await page.$("#staff-dialog-errors:not([hidden])") !== null, "Gagal kirim ulang tidak ditampilkan.");
    const afterFailure = await page.evaluate(() => window.staffAccountsDemo.snapshot().users.find((user) => user.id === "admin-02"));
    assert(beforeReissue.invitedAt === afterFailure.invitedAt, "Gagal kirim ulang mengubah waktu undangan.");
    await page.evaluate(() =>
    {
      document.getElementById("staff-fail-email").checked = false;
    });
    await page.click('[data-staff-action="submit-action"]');
    const afterRetry = await page.evaluate(() => window.staffAccountsDemo.snapshot().users.find((user) => user.id === "admin-02"));
    assert(beforeReissue.invitedAt !== afterRetry.invitedAt, "Coba ulang tidak memperbarui undangan.");

    await open("http://127.0.0.1:4178/staff-accounts.html?role=admin");
    assert((await page.$eval("h1", (node) => node.textContent)).includes("Akses SuperAdmin"), "Guard Admin tidak muncul.");
    assert(errors.length === 0, `Console error: ${errors.join(" | ")}`);
    console.log("Staff accounts verification: 4 workflow groups passed, 0 console errors.");
  }
  finally
  {
    await browser.close();
  }
}

verifyStaffAccounts().catch((error) =>
{
  console.error(error.message);
  process.exitCode = 1;
});
