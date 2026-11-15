"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_ACCOUNT_URL || "http://127.0.0.1:4180/pages/customer/account.html";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/account");

async function verifyAccount()
{
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  const browser = await puppeteer.launch(
  {
    executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true, pipe: true, timeout: 20000
  });
  const checks = [];
  const screenshots = [];
  const browserErrors = [];
  try
  {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("dialog", (dialog) => dialog.accept());
    async function ready()
    {
      await page.waitForFunction(() => document.getElementById("account-root")?.getAttribute("aria-busy") === "false");
      await page.evaluate(() => document.fonts.ready);
    }
    async function open(state = "normal", section = "profile", fault = "none")
    {
      await page.goto(BASE_URL);
      await ready();
      await page.evaluate(() => sessionStorage.clear());
      await page.goto(BASE_URL + "?" + new URLSearchParams({ state, section, fault }));
      await ready();
    }
    async function action(name)
    {
      await page.click('[data-account-action="' + name + '"]');
    }
    async function fill(id, value)
    {
      await page.$eval("#account-" + id, (element) =>
      {
        element.value = "";
      });
      await page.type("#account-" + id, value);
    }
    async function submit()
    {
      await page.click("#account-submit");
      await page.waitForFunction(() => !document.getElementById("account-dialog").open
        || document.getElementById("account-form-error")?.textContent
        || document.getElementById("account-code"));
    }
    async function capture(name, fullPage = false)
    {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, name + ".png"), fullPage });
      screenshots.push(name + ".png");
    }
    async function layout(name)
    {
      const violations = await page.evaluate(() =>
      {
        const width = document.documentElement.clientWidth;
        return Array.from(document.querySelectorAll("main input, main article, main .account-workspace, dialog[open], dialog[open] input, dialog[open] textarea"))
          .filter((element) =>
          {
            const bounds = element.getBoundingClientRect();
            return bounds.width > 0 && (bounds.left < -1 || bounds.right > width + 1);
          }).map((element) => element.id || element.className);
      });
      assert.deepEqual(violations, [], "Overflow " + name);
    }
    await page.setViewport({ width: 1440, height: 1000 });
    await open();
    assert.equal(await page.$$eval(".account-tabs a", (elements) => elements.length), 4);
    const shell = await page.$eval(".storefront-header", (element) => element.outerHTML);
    await capture("desktop");
    await action("profile");
    await fill("name", "A");
    await submit();
    assert.equal(await page.$eval("#account-name", (element) => element.getAttribute("aria-invalid")), "true");
    await capture("profile-validation");
    await fill("name", "Nadia Contoh");
    await fill("phone", "081200000001");
    await submit();
    assert.match(await page.$eval("#account-root", (element) => element.textContent), /Nadia Contoh/);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.accountAction), "profile");
    await page.reload();
    await ready();
    assert.match(await page.$eval("#account-root", (element) => element.textContent), /Nadia Contoh/);
    checks.push("Profil validasi, normalisasi telepon, simpan dan reload");

    await action("profile");
    await fill("name", "Nama Disimpan Sekali");
    const versionBefore = await page.evaluate(() => JSON.parse(sessionStorage.getItem("rylva-account-preview-v1:normal")).version);
    await page.$eval("#account-form", (form) =>
    {
      form.requestSubmit();
      form.requestSubmit();
    });
    await page.waitForFunction(() => !document.getElementById("account-dialog").open);
    const versionAfter = await page.evaluate(() => JSON.parse(sessionStorage.getItem("rylva-account-preview-v1:normal")).version);
    assert.equal(versionAfter, versionBefore + 1);
    checks.push("Pengiriman ganda dicegah dan fokus kembali ke pemicu sesudah render");

    await action("profile");
    await fill("name", "Draft Belum Disimpan");
    await page.keyboard.press("Escape");
    assert.match(await page.$eval("#account-dialog-title", (element) => element.textContent), /Belum Disimpan/);
    await capture("unsaved-dialog");
    await action("keepEditing");
    assert.equal(await page.$eval("#account-name", (element) => element.value), "Draft Belum Disimpan");
    await page.keyboard.press("Escape");
    await action("discard");
    assert.equal(await page.$eval("#account-dialog", (element) => element.open), false);
    checks.push("Escape melindungi draft dan mengembalikan kontrol");

    await action("email");
    await fill("email", "NADIA.BARU@pelanggan.example");
    await fill("currentPassword", "ContohSandi2026");
    await submit();
    await page.waitForSelector("#account-code");
    await capture("email-dialog");
    assert.match(await page.$eval("#account-root", (element) => element.textContent), /nadia@pelanggan.example/);
    await fill("code", "000000");
    await page.click("#account-submit");
    await page.waitForFunction(() => document.getElementById("account-form-error").textContent.includes("Kode tidak valid"));
    await fill("code", "123456");
    await page.click("#account-submit");
    await page.waitForFunction(() => !document.getElementById("account-dialog").open);
    assert.match(await page.$eval("#account-root", (element) => element.textContent), /nadia.baru@pelanggan.example/);
    checks.push("Email lama bertahan sampai kode valid, email baru dinormalisasi");

    await page.click('[data-account-panel="security"]');
    await action("password");
    await fill("currentPassword", "ContohSandi2026");
    await fill("newPassword", "password12345");
    await fill("confirmPassword", "password12345");
    await submit();
    assert.match(await page.$eval("#account-newPassword-error", (element) => element.textContent), /terlalu umum/);
    await capture("password-validation");
    await fill("newPassword", "  Sandi Contoh Aman 2026  ");
    await fill("confirmPassword", "  Sandi Contoh Aman 2026  ");
    await submit();
    const storage = await page.evaluate(() => JSON.stringify(sessionStorage));
    assert.ok(!storage.includes("Sandi Contoh Aman") && !storage.includes("ContohSandi2026") && !storage.includes('"code":'));
    checks.push("Kata sandi umum ditolak, spasi dipertahankan dan rahasia tidak disimpan");

    await open("empty", "addresses");
    await action("addAddress");
    await action("manualAddress");
    await fill("label", "Rumah");
    await fill("recipient", "Nadia Contoh");
    await fill("recipientPhone", "081200000001");
    await fill("street", "Jalan Taman Contoh Nomor 12");
    for (const [field, value] of [["village", "Desa Contoh"], ["district", "Kecamatan Contoh"], ["city", "Bandung"], ["province", "Jawa Barat"], ["postcode", "00123"]])
    {
      await fill(field, value);
    }
    await page.click("#account-primary");
    await submit();
    assert.equal(await page.$$("article.account-address").then((items) => items.length), 1);
    assert.match(await page.$eval(".account-address", (element) => element.textContent), /00123/);
    await capture("addresses");
    await page.type("#account-address-search", "tidak cocok");
    assert.match(await page.$eval("#account-address-list", (element) => element.textContent), /tidak ditemukan/);
    await action("resetSearch");
    await action("editAddress");
    await capture("address-dialog");
    await page.keyboard.press("Escape");
    await action("removeAddress");
    await submit();
    assert.match(await page.$eval("#account-root", (element) => element.textContent), /Belum ada alamat/);
    checks.push("Alamat manual, nol kode pos, utama, cari/reset, edit dan hapus");

    await open("normal", "addresses");
    await action("primary");
    await submit();
    assert.equal(await page.$$eval('[data-primary="true"]', (items) => items.length), 1);
    checks.push("Hanya satu alamat utama setelah perubahan");

    for (const fault of ["saveError", "timeout", "conflict", "csrf", "rateLimit", "session", "denied", "validation", "duplicate", "wrongPassword", "partialSuccess"])
    {
      await open("normal", fault === "wrongPassword" ? "security" : "profile", fault);
      await action(fault === "wrongPassword" ? "password" : "profile");
      if (fault === "wrongPassword")
      {
        await fill("currentPassword", "ContohSandi2026");
        await fill("newPassword", "Sandi Contoh 2026");
        await fill("confirmPassword", "Sandi Contoh 2026");
      }
      else
      {
        await fill("name", "Nadia Setelah Perubahan");
      }
      await submit();
      if (fault === "session")
      {
        assert.equal(await page.$(".account-person"), null);
      }
      else if (["timeout", "conflict", "csrf", "duplicate"].includes(fault))
      {
        assert.equal(await page.$eval("#account-submit", (element) => element.disabled), true);
        await action("reconcile");
        await ready();
        if (["csrf", "conflict"].includes(fault))
        {
          assert.equal(await page.$eval("#account-name", (element) => element.value), "Nadia Setelah Perubahan");
        }
        if (fault === "timeout")
        {
          assert.match(await page.$eval("#account-root", (element) => element.textContent), /Nadia Setelah Perubahan/);
        }
      }
      else if (fault !== "partialSuccess")
      {
        assert.ok(await page.$eval("#account-form-error", (element) => element.textContent.length));
      }
    }
    checks.push("Gangguan mutasi, hasil ambigu, konflik, CSRF, sesi dan pemulihan draft");

    await open("normal", "privacy");
    await action("deletion");
    await fill("currentPassword", "ContohSandi2026");
    await submit();
    assert.match(await page.$eval("#account-root", (element) => element.textContent), /Permintaan sudah tercatat/);
    assert.match(await page.$eval("#account-root", (element) => element.textContent), /belum dianonimkan/);
    await capture("privacy-pending");
    await action("logout");
    await submit();
    assert.equal(await page.$(".account-person"), null);
    await page.reload();
    await ready();
    assert.equal(await page.$(".account-person"), null);
    for (const [target, privateSelector] of [["my-orders.html", "article.order-card"], ["order-detail.html", ".transaction-layout"], ["payment.html", ".payment-layout"]])
    {
      await page.goto(new URL(target, BASE_URL).href);
      await page.waitForFunction(() => document.querySelector("main")?.textContent.includes("Masuk"));
      assert.equal(await page.$(privateSelector), null);
      assert.doesNotMatch(await page.$eval("main", (element) => element.textContent), /RV-\d{6}|Monstera|Nadia/);
    }
    checks.push("Permintaan penghapusan tidak mengaku anonimisasi; logout membersihkan data");

    await open("googleOnly", "security");
    assert.equal(await page.$('[data-account-action="password"]'), null);
    await action("recovery");
    assert.match(await page.$eval("#account-dialog-content", (element) => element.textContent), /belum terhubung/);
    checks.push("Google-only menggunakan jalur pemulihan dan tidak meminta sandi lama");

    await open("emailExpired");
    await action("verifyEmail");
    assert.equal(await page.$eval("#account-submit", (element) => element.disabled), true);
    await action("resend");
    await page.waitForFunction(() => document.getElementById("account-form-error")?.textContent.includes("Kode baru"));
    await fill("code", "123456");
    await page.click("#account-submit");
    await page.waitForFunction(() => !document.getElementById("account-dialog").open);
    checks.push("Kode kedaluwarsa diblokir, resend membuka verifikasi baru");

    for (const fault of ["emailConflict", "sendError"])
    {
      await open("normal", "profile", fault);
      await action("email");
      await fill("email", "tujuan@pelanggan.example");
      await fill("currentPassword", "ContohSandi2026");
      await submit();
      assert.match(await page.$eval("#account-root", (element) => element.textContent), /nadia@pelanggan.example/);
      assert.ok(await page.$eval("#account-form-error", (element) => element.textContent.length));
    }
    checks.push("Konflik dan kegagalan kirim email tidak mengganti email aktif");

    await open("pinRequired", "addresses");
    await action("addAddress");
    await capture("location-step");
    await action("manualAddress");
    await page.click("#account-submit");
    assert.match(await page.$eval("#account-point-error", (element) => element.textContent), /Pilih titik/);
    await action("location");
    await action("chooseLocation");
    await fill("label", "Rumah Baru");
    await fill("recipient", "Nadia Contoh");
    await fill("recipientPhone", "081200000001");
    await submit();
    assert.equal(await page.$$eval("article.account-address", (items) => items.length), 3);
    const ownershipCode = await page.evaluate(async () =>
    {
      const adapter = window.RylvaAccountPreview.createAdapter();
      const snapshot = await adapter.getSnapshot();
      try
      {
        await adapter.perform("removeAddress", { id: "foreign-address" }, snapshot.version);
      }
      catch (error)
      {
        return error.code;
      }
    });
    assert.equal(ownershipCode, "notFound");
    checks.push("Titik wajib divalidasi, lokasi tersimpan dipakai ulang dan ID asing ditolak adapter contoh");

    await open("slow");
    await action("refresh");
    await ready();
    assert.ok(await page.$(".account-person"));
    await page.goto(BASE_URL + "?state=loading");
    await page.waitForSelector(".account-skeleton");
    assert.equal(await page.$eval("#account-root", (element) => element.getAttribute("aria-busy")), "true");
    await capture("loading");
    checks.push("Loading awal dan loading lama memiliki pemulihan");

    await open();
    const scenarios = await page.evaluate(() => Object.keys(window.RylvaAccountPreview.scenarioLabels));
    for (const scenario of scenarios)
    {
      if (["loading", "slow"].includes(scenario))
      {
        continue;
      }
      const section = ["empty", "limit", "partial", "addressRemoved", "mapUnavailable", "pinRequired"].includes(scenario) ? "addresses"
        : (scenario.startsWith("deletion") ? "privacy" : "profile");
      await open(scenario, section);
      await layout(scenario);
      if (["empty", "login", "long", "emailPending", "limit", "partial"].includes(scenario))
      {
        await capture("state-" + scenario);
      }
      if (scenario === "partial")
      {
        await action("refresh");
        await ready();
        assert.ok(await page.$("article.account-address"));
      }
      if (scenario === "session")
      {
        await action("refresh");
        await ready();
        assert.equal(await page.$(".account-person"), null);
      }
    }
    checks.push("Seluruh skenario pembacaan dan pemulihan diperiksa");

    for (const width of [1440, 1024, 768, 390, 320])
    {
      await page.setViewport({ width, height: 1000 });
      await open("long");
      await layout("profile-" + width);
      await capture("profile-" + width);
      await page.click('[data-account-panel="addresses"]');
      await layout("addresses-" + width);
      const placeholderStyle = await page.$eval("#account-address-search", (element) =>
      {
        const style = getComputedStyle(element, "::placeholder");
        return { color: style.color, opacity: style.opacity };
      });
      assert.equal(placeholderStyle.color, "rgb(82, 100, 82)");
      assert.equal(placeholderStyle.opacity, "1");
      await capture("addresses-" + width);
      await action("editAddress");
      await layout("dialog-" + width);
      await capture("dialog-" + width);
      const focusInside = await page.evaluate(() => document.getElementById("account-dialog").contains(document.activeElement));
      assert.equal(focusInside, true);
      await page.focus("#account-submit");
      await page.keyboard.press("Tab");
      assert.equal(await page.evaluate(() => document.getElementById("account-dialog").contains(document.activeElement)), true);
      await page.focus("#account-submit");
      if ([1440, 390].includes(width))
      {
        await capture("dialog-bottom-" + width);
      }
      await page.keyboard.press("Escape");
      if ([1440, 390].includes(width))
      {
        await capture("addresses-full-" + width, true);
      }
    }
    checks.push("Layout dan fokus responsif 1440/1024/768/390/320");
    await page.setViewport({ width: 1440, height: 1000 });
    await open();
    assert.equal(await page.$eval(".storefront-header", (element) => element.outerHTML), shell);
    await page.goto(BASE_URL + "?returnTo=https%3A%2F%2Fevil.example");
    await ready();
    assert.ok((await page.$eval("#account-back", (element) => element.getAttribute("href"))).startsWith("/pages/customer/my-orders.html"));
    await page.goto(new URL("/pages/customer/my-orders.html?status=Dikirim&q=Monstera", BASE_URL).href);
    await page.waitForFunction(() => document.getElementById("orders-root")?.getAttribute("aria-busy") === "false");
    await page.evaluate(() => window.scrollTo(0, 500));
    const previousScroll = await page.evaluate(() => window.scrollY);
    await page.$eval('[data-storefront-page="Akun"]', (button) => button.click());
    await ready();
    await page.click("#account-back");
    await page.waitForFunction(() => document.getElementById("orders-root")?.getAttribute("aria-busy") === "false");
    assert.equal(new URL(page.url()).searchParams.get("status"), "Dikirim");
    assert.equal(new URL(page.url()).searchParams.get("q"), "Monstera");
    await page.waitForFunction((scroll) => Math.abs(window.scrollY - scroll) < 20, {}, previousScroll);
    checks.push("Navbar Akun membuka route, kembali memulihkan daftar; return URL eksternal ditolak");
    await page.goto(new URL("/__preview/account", BASE_URL).href);
    await page.waitForSelector("#scenario option");
    assert.equal(await page.$$eval("#scenario option", (items) => items.length), scenarios.length);
    checks.push("Workbench terpisah dan shell tetap identik");
    assert.deepEqual(browserErrors, []);
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "verification.json"), JSON.stringify({ passed: true, scenarios: scenarios.length, checks, screenshots, browserErrors }, null, 2));
    console.log(JSON.stringify({ passed: true, scenarios: scenarios.length, checks: checks.length, screenshots: screenshots.length, browserErrors }));
  }
  finally
  {
    await browser.close();
  }
}

verifyAccount().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
