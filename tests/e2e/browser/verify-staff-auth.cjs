"use strict";

const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

async function verify()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) =>
  {
    if (message.type() === "error")
    {
      errors.push(message.text());
    }
  });

  function assert(condition, message)
  {
    if (!condition)
    {
      throw new Error(message);
    }
  }

  try
  {
    for (const width of [390, 768, 1440])
    {
      await page.setViewport({ width, height: 900 });
      for (const view of [
        "login", "mfa", "activation", "activation-mfa", "help", "expired", "recovery",
        "backup-code", "credentials-error", "mfa-error", "blocked", "session-expired", "network-error"
      ])
      {
        await page.goto(`http://127.0.0.1:4178/staff-login.html?view=${view}`, { waitUntil: "load" });
        const metrics = await page.evaluate(() =>
        {
          return {
            overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            title: Boolean(document.querySelector("#auth-title"))
          };
        });
        assert(!metrics.overflow && metrics.title, `Layout ${view} ${width} bermasalah.`);
        await page.screenshot({ path: `storage/reports/hallmark/screenshots/staff-auth-${view}-${width}.png`, fullPage: true });
        if (view === "login")
        {
          await page.click("#auth-help-toggle");
          await page.evaluate(async () =>
          {
            await Promise.all(document.getElementById("auth-help").getAnimations().map((animation) => animation.finished));
          });
          const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
          assert(!overflows, `Panel bantuan meluap pada ${width}.`);
          await page.screenshot({ path: `storage/reports/hallmark/screenshots/staff-auth-help-open-${width}.png`, fullPage: true });
        }
      }
    }
    await page.goto("http://127.0.0.1:4178/staff-login.html", { waitUntil: "networkidle0" });
    assert(await page.$eval("#auth-help", (element) => element.hidden), "Bantuan seharusnya tersembunyi.");
    await page.type("#email", "contoh@rylva.test");
    await page.click("#auth-help-toggle");
    assert(await page.$eval("#auth-help-toggle", (element) => element.getAttribute("aria-expanded")) === "true",
      "Tombol bantuan tidak menandai panel terbuka.");
    assert(await page.$eval("#auth-help", (element) => !element.hidden), "Panel bantuan tidak terbuka.");
    await page.screenshot({ path: "storage/reports/hallmark/screenshots/staff-auth-help-open-1440.png", fullPage: true });
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => document.getElementById("auth-help").hidden);
    assert(await page.$eval("#email", (element) => element.value) === "contoh@rylva.test",
      "Menutup bantuan menghapus isian login.");
    await page.$eval("#email", (element) =>
    {
      element.value = "";
    });
    await page.click('[data-form="login"] button[type="submit"]');
    assert(await page.$('[aria-invalid="true"]') !== null, "Validasi kosong tidak muncul.");
    await page.type("#email", "contoh@rylva.test");
    await page.type("#password", "contoh-bukan-asli");
    await page.click('[data-form="login"] button[type="submit"]');
    assert(page.url().includes("view=mfa") && !page.url().includes("contoh"), "Navigasi MFA atau URL tidak aman.");
    await page.click('#auth-view [data-view="help"]');
    await page.click('#auth-view [data-view="mfa"]');
    assert(page.url().includes("view=mfa"), "Bantuan tidak kembali ke MFA.");
    await page.type("#code", "123456");
    await page.click('[data-form="mfa"] button[type="submit"]');
    assert((await page.$eval("#auth-view", (element) => element.textContent)).includes("Anda belum masuk"),
      "Akhir pratinjau tidak jelas.");
    await page.goto("http://127.0.0.1:4178/staff-login.html?view=activation", { waitUntil: "networkidle0" });
    await page.type("#new-password", "contoh-kata-sandi");
    await page.type("#confirm-password", "contoh-kata-sandi");
    await page.click('[data-target="confirm-password"]');
    const toggleLabel = await page.$eval('[data-target="confirm-password"]', (element) => element.getAttribute("aria-label"));
    assert(toggleLabel.includes("konfirmasi kata sandi"), "Label tombol kata sandi kurang jelas.");
    await page.click('[data-form="activation"] button[type="submit"]');
    assert(page.url().includes("view=activation-mfa"), "Aktivasi tidak masuk ke langkah MFA.");
    assert(errors.length === 0, `Kesalahan browser: ${errors.join(" | ")}`);
    console.log("Staff auth: 39 tampilan responsif dan alur login/aktivasi lulus; 0 kesalahan browser.");
  }
  finally
  {
    await browser.close();
  }
}

verify().catch((error) =>
{
  console.error(error.message);
  process.exitCode = 1;
});
