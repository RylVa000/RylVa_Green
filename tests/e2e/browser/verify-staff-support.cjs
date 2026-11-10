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
  const origin = "http://127.0.0.1:4178";
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) =>
  {
    if (request.url().startsWith(origin) && ["stylesheet", "script", "font"].includes(request.resourceType()))
    {
      errors.push(`${request.failure()?.errorText} ${request.url()}`);
    }
  });

  function assert(condition, message)
  {
    if (!condition)
    {
      throw new Error(message);
    }
  }

  async function open(file, query = "")
  {
    await page.goto(`${origin}/${file}.html?role=admin${query}`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
  }

  async function fill(name, value)
  {
    await page.$eval(`#support-form [name="${name}"]`, (element, content) =>
    {
      element.value = content;
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);
  }

  async function submit()
  {
    await page.$eval("#support-form", (form) => form.requestSubmit());
  }

  async function preview(id, value)
  {
    await page.$eval(`#${id}`, (element, content) =>
    {
      if (element.type === "checkbox")
      {
        element.checked = content;
      }
      else
      {
        element.value = content;
      }
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
  }

  async function discard()
  {
    await page.click("#support-dialog-close");
    if (await page.$(".support-discard:not([hidden])"))
    {
      await page.click('[data-hub-action="discard"]');
    }
  }

  try
  {
    const routes =
    [
      ["staff-profile", "&tab=profile", "profile"],
      ["staff-profile", "&tab=security", "security"],
      ["staff-profile", "&tab=sessions", "sessions"],
      ["staff-profile", "&tab=activity", "activity"],
      ["staff-notifications", "", "notifications"],
      ["staff-notifications", "&item=payment-review", "notification-detail"],
      ["staff-help", "", "help"],
      ["staff-help", "&article=mfa", "help-article"],
      ["staff-status", "&state=forbidden", "forbidden"],
      ["staff-status", "&state=not-found", "not-found"],
      ["staff-status", "&state=unavailable&return=orders", "unavailable"],
      ["staff-status", "&state=maintenance", "maintenance"],
      ["staff-status", "&state=session-expired", "session-expired"]
    ];
    for (const width of [320, 390, 768, 1440, 1920])
    {
      await page.setViewport({ width, height: 900 });
      for (const [file, query, name] of routes)
      {
        await open(file, query);
        const layout = await page.evaluate(() =>
        {
          const heading = document.querySelector("h1");
          const headingStyle = getComputedStyle(heading);
          const cards = [...document.querySelectorAll(".support-stats .catalog-stat")];
          return {
            heading: heading.textContent,
            overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            lines: heading.getBoundingClientRect().height / parseFloat(headingStyle.lineHeight),
            heights: cards.map((card) => card.getBoundingClientRect().height),
            active: document.querySelectorAll('#sidebar-nav [aria-current="page"]').length,
            font: headingStyle.fontFamily
          };
        });
        assert(layout.heading && !layout.overflow && layout.lines <= 2.1, `Layout ${name} ${width}: ${JSON.stringify(layout)}`);
        assert(layout.font.includes("Poppins"), `Font ${name} tidak sesuai.`);
        assert(layout.active === (file === "staff-status" ? 0 : 1), `Menu aktif ${name} tidak konsisten.`);
        if (layout.heights.length)
        {
          assert(Math.max(...layout.heights) - Math.min(...layout.heights) < 1, `Tinggi kartu ${width} tidak sama.`);
        }
        if ([390, 1440].includes(width) && ["profile", "security", "sessions", "notifications", "help", "help-article", "unavailable"].includes(name))
        {
          await page.screenshot({ path: `storage/reports/hallmark/screenshots/support-${name}-${width}.png`, fullPage: true });
        }
      }
    }

    await page.setViewport({ width: 1440, height: 900 });
    await open("staff-help");
    const articleIds = await page.evaluate(() => window.staffHub.source.articles.map((article) => article.id));
    await page.setViewport({ width: 320, height: 844 });
    for (const id of articleIds)
    {
      await open("staff-help", `&article=${id}`);
      const lineCount = await page.$eval("h1", (element) =>
      {
        return element.getBoundingClientRect().height / parseFloat(getComputedStyle(element).lineHeight);
      });
      assert(lineCount <= 2.1, `Judul panduan ${id} terlalu panjang pada 320 px.`);
    }
    await page.setViewport({ width: 1440, height: 900 });
    await open("staff-profile");
    await page.click('[data-hub-action="edit-profile"]');
    await fill("name", "Nadia Uji");
    await fill("phone", "08123");
    await submit();
    assert((await page.$eval(".support-errors", (element) => element.textContent)).includes("+62"), "Nomor telepon tidak divalidasi.");
    await fill("phone", "+6281398765432");
    await page.keyboard.press("Escape");
    assert(await page.$eval("#support-dialog", (element) => element.open), "Escape membuang perubahan.");
    await page.click('[data-hub-action="keep-editing"]');
    await preview("support-fail", true);
    await submit();
    assert(await page.evaluate(() => window.staffHub.account().name) === "Nadia Putri", "Simpan gagal tetap mengubah profil.");
    await preview("support-fail", false);
    await submit();
    assert(await page.$eval("#profile-name", (element) => element.textContent) === "Nadia Uji", "Nama profil belum diperbarui.");
    await page.click('[data-hub-action="tab"][data-value="security"]');
    await page.click('[data-hub-action="change-password"]');
    await fill("current-password", "ContohLama_123");
    await fill("mfa-code", "123456");
    await fill("new-password", "pendek");
    await fill("confirm-password", "berbeda");
    await submit();
    assert((await page.$eval(".support-errors", (element) => element.textContent)).includes("12–128"), "Batas kata sandi gagal.");
    await fill("new-password", " ContohBaru_456 ");
    await fill("confirm-password", " ContohBaru_456 ");
    await page.screenshot({ path: "storage/reports/hallmark/screenshots/support-password-1440.png", fullPage: false });
    await page.setViewport({ width: 390, height: 844 });
    await page.screenshot({ path: "storage/reports/hallmark/screenshots/support-password-390.png", fullPage: false });
    const separate = await page.evaluate(() =>
    {
      const dialog = document.getElementById("support-dialog").getBoundingClientRect();
      const body = document.getElementById("support-dialog-body").getBoundingClientRect();
      const footer = document.getElementById("support-dialog-actions").getBoundingClientRect();
      return body.bottom <= footer.top && dialog.left >= 0 && dialog.right <= innerWidth && dialog.bottom <= innerHeight;
    });
    assert(separate, "Tombol dialog menutupi formulir atau dialog terpotong.");
    await page.goBack();
    assert(await page.$eval("#support-dialog", (element) => element.open), "Kembali browser membuang edit sensitif.");
    assert(await page.evaluate(() => window.staffHub.state.tab) === "security", "Kembali browser mengubah tab di belakang editor.");
    await page.click('[data-hub-action="keep-editing"]');
    await submit();
    assert(await page.evaluate(() => window.staffHub.account().sessions.length) === 1, "Sesi contoh lain tidak dihapus.");
    assert(!(await page.evaluate(() => JSON.stringify(window.staffHub.source))).includes("ContohBaru_456"), "Kata sandi tersimpan di fixture.");
    assert(await page.$('#support-dialog input[type="password"]') === null, "Isian kata sandi tidak dibersihkan.");

    await open("staff-profile", "&tab=sessions");
    await page.click('[data-hub-action="end-session"]');
    await fill("current-password", "ContohLama_123");
    await fill("mfa-code", "123");
    await submit();
    assert((await page.$eval(".support-errors", (element) => element.textContent)).includes("6 digit"), "Kode MFA tidak divalidasi.");
    await fill("mfa-code", "123456");
    await preview("support-fail", true);
    await submit();
    assert(await page.evaluate(() => window.staffHub.account().sessions.length) === 2, "Sesi berubah ketika gagal.");
    await preview("support-fail", false);
    await submit();
    assert(await page.evaluate(() => window.staffHub.account().sessions[0].current), "Sesi saat ini ikut terhapus.");
    await preview("support-profile", "superadmin");
    assert((await page.$eval(".support-definition", (element) => element.textContent)).includes("15 menit"), "Idle SuperAdmin tidak sesuai.");
    assert((await page.$eval(".support-definition", (element) => element.textContent)).includes("4 jam"), "Batas absolut SuperAdmin tidak sesuai.");
    assert(await page.$eval('[data-hub-action="end-others"]', (element) => element.disabled), "Akhiri sesi lain aktif saat kosong.");

    await open("staff-notifications");
    await page.type("#support-search", "tidak-ada-xyz");
    assert((await page.$eval(".report-state", (element) => element.textContent)).includes("Tidak ada"), "Pencarian notifikasi otomatis gagal.");
    await page.click('[data-hub-action="reset"]');
    await page.select("#support-filter", "unread");
    await preview("support-fail", true);
    await page.click('[data-hub-action="read-results"]');
    assert(await page.$$eval(".support-row", (rows) => rows.length) === 4, "Gagal penandaan tetap mengubah notifikasi.");
    await preview("support-fail", false);
    await page.click('[data-hub-action="read-results"]');
    assert(await page.$(".report-state") !== null, "Tandai hasil dibaca tidak berlaku untuk semua hasil.");
    await page.click('[data-hub-action="reset"]');
    await page.click('[data-hub-action="next"]');
    await page.click('[data-hub-action="open-notification"]');
    assert(await page.evaluate(() => scrollY) === 0, "Detail notifikasi tidak mulai dari atas.");
    await page.click('[data-hub-action="back-notifications"]');
    assert((await page.$eval(".report-pagination", (element) => element.textContent)).includes("2 dari 2"), "Konteks daftar notifikasi hilang.");
    await open("staff-notifications", "&item=finance-review");
    assert(await page.$eval("h1", (element) => element.textContent) === "Notifikasi tidak tersedia", "Notifikasi khusus SuperAdmin terbuka oleh Admin.");
    await preview("support-profile", "superadmin");
    assert(await page.evaluate(() => window.staffHub.source.notifications.filter((item) => !item.read).length) === 5, "Fixture SuperAdmin berubah tidak semestinya.");

    await open("staff-help");
    await page.type("#support-search", "refund");
    assert(await page.$(".support-row") !== null, "Pencarian panduan gagal.");
    await page.click('[data-hub-action="open-article"]');
    await page.evaluate(() =>
    {
      Object.defineProperty(navigator, "clipboard",
      {
        configurable: true,
        value:
        {
          writeText: async () =>
          {
            throw new Error("Clipboard ditolak pada pengujian fallback");
          }
        }
      });
    });
    await page.click('[data-hub-action="copy-report"]');
    await page.waitForSelector("#support-report-draft:not([hidden])");
    assert((await page.$eval("#support-report-draft", (element) => element.value)).includes("Waktu kejadian"), "Fallback salin laporan gagal.");
    await page.click('[data-hub-action="back-help"]');
    assert(await page.$eval("#support-search", (element) => element.value) === "refund", "Konteks pencarian panduan hilang.");
    await open("staff-help", "&article=tidak-ada");
    assert(await page.$eval("h1", (element) => element.textContent) === "Panduan tidak ditemukan", "Panduan hilang tidak ditangani.");

    for (const file of ["staff-profile", "staff-notifications", "staff-help"])
    {
      await open(file);
      for (const condition of ["loading", "empty", "error"])
      {
        await preview("support-load", condition);
        assert(await page.$(".support-panel h2") !== null, `Kondisi ${file} ${condition} kosong.`);
      }
      await page.click('[data-hub-action="reload"]');
      assert(await page.evaluate(() => window.staffHub.state.load) === "full", `Coba lagi ${file} gagal.`);
    }
    await open("staff-status", "&state=unavailable&return=https://example.com");
    assert((await page.$eval('.support-panel .queue-button--primary', (element) => element.href)).startsWith(origin), "Tujuan pemulihan membuka alamat asing.");
    await preview("support-condition", "session-expired");
    assert((await page.$eval('.support-panel .queue-button--primary', (element) => element.href)).includes("staff-login.html"), "Sesi berakhir tidak menuju login staf.");

    for (const file of ["admin-dashboard", "categories-attributes", "orders-queue"])
    {
      for (const role of ["admin", "superadmin"])
      {
        await page.goto(`${origin}/${file}.html?role=${role}`, { waitUntil: "load" });
        assert(await page.$$eval("[data-support-page]", (links) => links.length) === 3, `Menu pendukung ${file} belum lengkap.`);
        assert((await page.$eval('[data-support-page="staff-profile.html"]', (element) => element.href)).includes(`role=${role}`), "Tautan kehilangan peran.");
        assert(await page.$$eval('#sidebar-nav [aria-current="page"]', (links) => links.length) === 1, `Menu aktif ${file} ganda.`);
      }
    }
    await open("staff-profile");
    await page.click('[data-hub-action="logout"]');
    await Promise.all([
      page.waitForNavigation({ waitUntil: "load" }),
      page.click('#support-dialog-actions button[type="submit"]')
    ]);
    assert(page.url().includes("staff-login.html?view=login"), "Keluar tidak menuju login staf.");
    assert(errors.length === 0, `Kesalahan browser: ${errors.join(" | ")}`);
    console.log("Halaman pendukung staf: 65 layout, profil, keamanan, sesi, notifikasi, bantuan, kondisi sistem, recovery, navigasi lintas modul dan 2 peran lulus; 0 error browser.");
  }
  finally
  {
    await browser.close();
  }
}

verify().catch((error) =>
{
  console.error(error.stack);
  process.exitCode = 1;
});
