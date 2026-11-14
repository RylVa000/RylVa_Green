"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_ORDER_PREVIEW_URL || "http://127.0.0.1:4179/pages/customer/order-detail.html";
const OUTPUT_DIRECTORY = path.resolve("storage/reports/order-detail");

async function verifyOrderDetail()
{
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  const browser = await puppeteer.launch(
  {
    executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    pipe: true,
    timeout: 20000
  });
  const checks = [];
  const browserErrors = [];
  const screenshots = [];
  try
  {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    page.on("pageerror", (error) => browserErrors.push(error.message));

    async function open(state = "shipping", extra = "")
    {
      await page.goto(BASE_URL + "?state=" + state + extra, { waitUntil: "load" });
      await page.evaluate(() =>
      {
        sessionStorage.removeItem("rylva-order-detail-preview-v1:" + new URLSearchParams(location.search).get("state"));
      });
      await page.reload({ waitUntil: "load" });
      if (state !== "loading")
      {
        await page.waitForFunction(() => document.getElementById("order-root").getAttribute("aria-busy") === "false");
      }
      await page.evaluate(() => document.fonts.ready);
    }

    async function capture(name, fullPage = true)
    {
      await page.screenshot({ path: path.join(OUTPUT_DIRECTORY, name + ".png"), fullPage });
      screenshots.push(name + ".png");
    }

    async function layout(name)
    {
      const violations = await page.evaluate(() =>
      {
        const viewport = document.documentElement.clientWidth;
        return Array.from(document.querySelectorAll("main section, main aside, main button, main .badge, dialog[open]"))
          .filter((element) =>
          {
            const bounds = element.getBoundingClientRect();
            return bounds.width > 0 && (bounds.left < -1 || bounds.right > viewport + 1);
          }).map((element) => element.id || element.className);
      });
      assert.deepEqual(violations, [], name + " overflow");
      checks.push("Layout " + name);
    }

    async function submit()
    {
      await page.click("#order-submit");
      await page.waitForFunction(() => !document.getElementById("payment-dialog").open);
    }

    async function fill(selector, value)
    {
      await page.type(selector, value);
    }

    await page.setViewport({ width: 1440, height: 1000 });
    await open();
    const shellMarkup = await page.$eval(".storefront-header", (element) => element.outerHTML);
    const footerMarkup = await page.$eval(".storefront-footer", (element) => element.outerHTML);
    await layout("desktop");
    await capture("desktop");
    const desktopGeometry = await page.evaluate(() =>
    {
      const actions = document.querySelector(".detail-action-rail").getBoundingClientRect();
      const summary = document.querySelector(".detail-summary").getBoundingClientRect();
      const delivery = document.getElementById("delivery-heading").getBoundingClientRect();
      const payment = document.getElementById("cost-heading").getBoundingClientRect();
      return { actionsLeft: actions.left, summaryRight: summary.right, paymentTop: payment.top, deliveryTop: delivery.top };
    });
    assert.ok(desktopGeometry.actionsLeft >= desktopGeometry.summaryRight - 1);
    assert.ok(desktopGeometry.paymentTop > desktopGeometry.deliveryTop);
    assert.equal(await page.$eval('.detail-action-rail [data-order-action="confirmReceipt"]', (element) => element.textContent), "Selesaikan Pesanan");
    await page.evaluate(() => document.getElementById("cost-heading").scrollIntoView({ block: "start" }));
    const stickyGeometry = await page.$eval(".detail-action-rail", (element) =>
    {
      const bounds = element.getBoundingClientRect();
      return { top: bounds.top, bottom: bounds.bottom, viewport: window.innerHeight };
    });
    assert.ok(stickyGeometry.top >= 0 && stickyGeometry.top <= 25);
    assert.ok(stickyGeometry.bottom < stickyGeometry.viewport);
    await capture("payment-sticky", false);
    await page.click('.detail-action-rail [data-order-action="track"]');
    assert.match(await page.$eval("#dialog-content", (element) => element.textContent), /Dalam Pengiriman/);
    assert.match(await page.$eval("#dialog-content", (element) => element.textContent), /RESI-CONTOH-261113/);
    assert.match(await page.$eval("#dialog-content", (element) => element.textContent), /Riwayat Pesanan/);
    await capture("tracking-dialog", false);
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.activeElement.dataset.orderAction), "track");
    await page.evaluate(() => window.scrollTo(0, 0));
    checks.push("Pola referensi: rincian kiri, tindakan kanan sticky, pembayaran setelah pengiriman, Lacak membuka riwayat");
    await page.click('[data-order-action="confirmReceipt"]');
    assert.match(await page.$eval("#dialog-content", (element) => element.textContent), /tidak dapat mengajukan komplain lagi/);
    assert.equal(await page.evaluate(() => document.activeElement.id), "dialog-title");
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.closest("dialog") !== null), true);
    await capture("confirm-dialog", false);
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.activeElement.dataset.orderAction), "confirmReceipt");
    checks.push("Penerimaan: dampak eksplisit, fokus, Escape dan pengembalian fokus");

    await page.click('[data-order-action="confirmReceipt"]');
    await page.click("#order-submit", { clickCount: 2 });
    await page.waitForFunction(() => !document.getElementById("payment-dialog").open);
    assert.match(await page.$eval(".status-badges", (element) => element.textContent), /Selesai/);
    assert.equal(await page.$$eval(".detail-timeline h3", (elements) => elements.filter((element) => element.textContent === "Penerimaan dikonfirmasi").length), 1);
    assert.equal(await page.$('[data-order-action="complain"]'), null);
    await page.reload();
    await page.waitForSelector("#order-number");
    assert.match(await page.$eval(".status-badges", (element) => element.textContent), /Selesai/);
    checks.push("Konfirmasi sekali, persisten setelah reload dan hak komplain ditutup");

    await open("cod");
    await page.click('[data-order-action="confirmReceipt"]');
    await submit();
    assert.match(await page.$eval(".status-badges", (element) => element.textContent), /Pembayaran\s+Menunggu/);
    checks.push("Penerimaan COD tidak memalsukan pelunasan");

    await open("ready");
    await page.click('[data-order-action="cancel"]');
    await page.click("#order-submit");
    assert.equal(await page.$eval("#order-reason", (element) => element.getAttribute("aria-invalid")), "true");
    await fill("#order-reason", "Penerima berubah jadwal.");
    assert.equal(await page.$eval("#reason-error", (element) => element.textContent), "");
    assert.equal(await page.$eval("#order-reason", (element) => element.getAttribute("aria-invalid")), "false");
    await page.keyboard.press("Escape");
    assert.equal(await page.$eval("#discard-draft", (element) => element.hidden), false);
    await page.click('[data-order-action="keep-draft"]');
    assert.equal(await page.$eval("#order-reason", (element) => element.value), "Penerima berubah jadwal.");
    await capture("cancel-draft", false);
    await submit();
    assert.match(await page.$eval(".status-badges", (element) => element.textContent), /Dibatalkan[\s\S]+Refund Diproses/);
    assert.match(await page.$eval("#order-cases", (element) => element.textContent), /Rp\s*389.000/);
    checks.push("Pembatalan paid: alasan wajib, draft terlindungi, refund terpisah");

    await open("preparing");
    await page.click('[data-order-action="requestCancel"]');
    await fill("#order-reason", "Mohon ditinjau kembali.");
    await submit();
    assert.match(await page.$eval(".status-badges", (element) => element.textContent), /Sedang Disiapkan/);
    assert.match(await page.$eval("#order-cases", (element) => element.textContent), /Diajukan/);
    assert.equal(await page.$('[data-order-action="requestCancel"]'), null);
    checks.push("Permintaan pembatalan tidak langsung membatalkan dan tidak duplikat");

    await open("delivered");
    await page.click('[data-order-action="complain"]');
    await page.click("#order-submit");
    assert.equal(await page.$$eval('[aria-invalid="true"]', (elements) => elements.length), 3);
    await page.select("#complaint-category", "Tidak diterima");
    await fill("#complaint-description", "Paket belum diterima oleh penerima.");
    assert.equal(await page.$eval("#form-error", (element) => element.textContent), "");
    assert.equal(await page.$$eval('[aria-invalid="true"]', (elements) => elements.length), 0);
    await capture("complaint-form", false);
    await submit();
    assert.match(await page.$eval("#complaint-record", (element) => element.textContent), /Diajukan[\s\S]+Tidak diterima/);
    assert.equal(await page.$('[data-order-action="confirmReceipt"]'), null);
    checks.push("Komplain Tidak diterima tanpa foto; komplain terbuka memblokir penerimaan");
    await page.click('.detail-action-rail [data-order-action="view-case"]');
    assert.equal(await page.evaluate(() => document.activeElement.id), "order-cases");
    checks.push("Lihat Komplain menuju bagian penyelesaian dan memindahkan fokus");

    await open("delivered");
    await page.click('[data-order-action="complain"]');
    await page.select("#complaint-category", "Rusak (produk atau kemasan)");
    await fill("#complaint-description", "Kemasan dan produk mengalami kerusakan.");
    const filesInput = await page.$("#complaint-photos");
    await filesInput.uploadFile(path.resolve("public/assets/images/products/plant.jpg"));
    await page.waitForFunction(() => document.getElementById("selected-photos").children.length === 1);
    await page.click("#order-submit");
    assert.match(await page.$eval("#photos-error", (element) => element.textContent), /minimal 2 foto/);
    await filesInput.uploadFile(path.resolve("public/assets/images/products/plant.jpg"), path.resolve("public/assets/images/products/succulent.jpg"));
    await page.waitForFunction(() => document.getElementById("selected-photos").children.length === 2);
    await submit();
    assert.match(await page.$eval("#complaint-record", (element) => element.textContent), /plant.jpg, succulent.jpg/);
    checks.push("Komplain kerusakan membutuhkan dua foto valid, nama bukti tersimpan sebagai contoh");

    await open("delivered");
    await page.click('[data-order-action="complain"]');
    await page.evaluate(() =>
    {
      const transfer = new DataTransfer();
      transfer.items.add(new File(["bukan gambar"], "foto.png", { type: "image/png" }));
      const input = document.getElementById("complaint-photos");
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForFunction(() => /tidak dapat dibaca/.test(document.getElementById("photos-error").textContent));
    await page.click('[data-order-action="clear-photos"]');
    await page.evaluate(() =>
    {
      const transfer = new DataTransfer();
      transfer.items.add(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "besar.png", { type: "image/png" }));
      const input = document.getElementById("complaint-photos");
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForFunction(() => /maksimal 5 MB/.test(document.getElementById("photos-error").textContent));
    await page.click('[data-order-action="close"]');
    await page.click('[data-order-action="discard"]');
    checks.push("Foto rusak dan lebih dari 5 MB ditolak, pilihan dapat dibersihkan");

    await open("complaintRejected");
    await page.click('[data-order-action="appeal"]');
    await fill("#order-reason", "Mohon tinjau ulang bukti penerimaan.");
    await submit();
    assert.match(await page.$eval("#complaint-record", (element) => element.textContent), /Dieskalasi/);
    assert.equal(await page.$('[data-order-action="appeal"]'), null);
    checks.push("Banding satu kali menjadi Dieskalasi");

    for (const actionError of ["timeout", "conflict", "duplicate", "csrf", "validation", "service", "rateLimit", "session"])
    {
      await open("ready", "&actionError=" + actionError);
      await page.click('[data-order-action="cancel"]');
      await fill("#order-reason", "Alasan tetap tersimpan.");
      await page.click("#order-submit");
      if (actionError === "session")
      {
        await page.waitForFunction(() => !document.getElementById("payment-dialog").open);
        assert.equal(await page.$("#order-number"), null);
      }
      else
      {
        await page.waitForFunction(() => document.getElementById("form-error").textContent.length > 0);
        assert.equal(await page.$eval("#order-reason", (element) => element.value), "Alasan tetap tersimpan.");
        if (actionError === "rateLimit")
        {
          await new Promise((resolve) => setTimeout(resolve, 3100));
        }
        if (actionError !== "validation")
        {
          assert.equal(await page.$eval("#order-submit", (element) => element.disabled), true);
          await capture("action-" + actionError, false);
          await page.click('[data-order-action="reconcile"]');
          await page.waitForFunction(() => /Status diperbarui|Status berubah/.test(document.getElementById("form-error").textContent));
          assert.equal(await page.$eval("#order-submit", (element) => element.disabled), actionError === "conflict");
        }
        await page.click('[data-order-action="close"]');
        await page.click('[data-order-action="discard"]');
      }
      checks.push("Pemulihan tindakan " + actionError);
    }

    await open("ready");
    await page.setOfflineMode(true);
    await page.waitForFunction(() => !document.getElementById("order-connection").hidden);
    assert.equal(await page.$('[data-order-action="cancel"]'), null);
    await page.setOfflineMode(false);
    await page.waitForSelector('[data-order-action="cancel"]');
    checks.push("Offline mempertahankan snapshot dan membatasi mutasi sampai online");

    const scenarioNames = await page.evaluate(() => Object.keys(window.RylvaOrderDetailPreview.scenarioLabels));
    for (const scenario of scenarioNames)
    {
      if (scenario === "loading")
      {
        continue;
      }
      await open(scenario);
      assert.match(await page.$eval("#order-root", (element) => element.textContent), /\S/);
      if (["notFound", "denied", "session", "login", "invalid", "unknown", "unavailable"].includes(scenario))
      {
        assert.equal(await page.$("#order-number"), null, scenario + " must not expose order");
      }
      if (["closedWindow", "completed", "archived"].includes(scenario))
      {
        assert.equal(await page.$('[data-order-action="complain"]'), null);
      }
      if (scenario === "review")
      {
        assert.match(await page.$eval(".status-badges", (element) => element.textContent), /Perlu Ditinjau/);
        assert.equal(await page.$('[data-order-action="receipt"]'), null);
        assert.match(await page.$eval('[aria-labelledby="cost-heading"]', (element) => element.textContent), /380.000/);
      }
      if (["perishable", "long"].includes(scenario))
      {
        const firstProduct = await page.$eval(".detail-product", (element) => element.textContent);
        assert.match(firstProduct, /1 buket/);
        assert.match(firstProduct, /Tema sage, pembungkus krem/);
        assert.doesNotMatch(firstProduct, /Monstera|70–90 cm/);
        assert.equal(await page.$(".detail-product:first-child img"), null);
      }
      if (["refund", "refundFailed", "fullRefund", "stockIssue", "review", "perishable", "delivered", "imageError", "notFound", "long"].includes(scenario))
      {
        await page.evaluate(() => window.scrollTo(0, 0));
        await capture("state-" + scenario);
        if (scenario === "delivered")
        {
          await capture("delivered-viewport", false);
        }
      }
    }
    checks.push("Semua " + scenarioNames.length + " skenario terdaftar diperiksa (loading terpisah)");

    await open("loadError");
    await page.click('[data-order-action="refresh"]');
    await page.waitForSelector("#order-number");
    checks.push("Gagal memuat pulih tanpa mengganti pesanan");

    await open("noTracking");
    await page.click('.detail-action-rail [data-order-action="track"]');
    assert.match(await page.$eval("#dialog-content", (element) => element.textContent), /Belum Diserahkan/);
    assert.match(await page.$eval("#dialog-content", (element) => element.textContent), /Resi muncul setelah paket/);
    assert.equal(await page.$("#dialog-content a[target='_blank']"), null);
    await page.keyboard.press("Escape");
    checks.push("Lacak sebelum serah menampilkan resi belum tersedia tanpa tautan fiktif");

    await open("loading");
    assert.equal(await page.$eval("#order-root", (element) => element.getAttribute("aria-busy")), "true");
    await page.waitForSelector('[data-order-action="reload"]', { timeout: 12000 });
    checks.push("Loading lama menyediakan muat ulang");

    for (const width of [768, 390, 320])
    {
      await page.setViewport({ width, height: 900 });
      await open("long");
      await layout("long-" + width);
      const mobileOrder = await page.evaluate(() =>
      {
        const summary = document.querySelector(".detail-summary").getBoundingClientRect();
        const actions = document.querySelector(".detail-action-rail").getBoundingClientRect();
        const products = document.getElementById("items-heading").getBoundingClientRect();
        const focusable = Array.from(document.querySelectorAll("#order-root button"));
        return {
          summaryBottom: summary.bottom,
          actionsTop: actions.top,
          actionsBottom: actions.bottom,
          productsTop: products.top,
          actionIndex: focusable.findIndex((element) => element.dataset.orderAction === "confirmReceipt"),
          deliveryIndex: focusable.findIndex((element) => element.closest("#delivery-section"))
        };
      });
      assert.ok(mobileOrder.actionsTop >= mobileOrder.summaryBottom - 1);
      assert.ok(mobileOrder.productsTop >= mobileOrder.actionsBottom);
      assert.ok(mobileOrder.actionIndex < mobileOrder.deliveryIndex);
      const amountLineCounts = await page.$$eval(".price-row dd", (elements) => elements.map((element) =>
      {
        const range = document.createRange();
        range.selectNodeContents(element);
        return range.getClientRects().length;
      }));
      assert.ok(amountLineCounts.every((count) => count === 1), "Currency must remain on a single line at " + width);
      await capture("long-" + width);
      await open("delivered");
      await page.click('[data-order-action="complain"]');
      await layout("dialog-" + width);
      await capture("dialog-" + width, false);
      await page.keyboard.press("Escape");
    }

    await page.setViewport({ width: 1440, height: 1000 });
    const paymentUrl = new URL("payment.html?state=pending", BASE_URL).href;
    await page.goto(paymentUrl);
    await page.evaluate(() => sessionStorage.removeItem("rylva-payment-preview-v1:pending"));
    await page.reload();
    await page.waitForSelector('[data-action="details"]');
    await page.waitForFunction(() => document.getElementById("payment-root").getAttribute("aria-busy") === "false");
    const paymentText = await page.$eval("#payment-root", (element) => element.textContent);
    assert.equal(await page.$eval(".storefront-header", (element) => element.outerHTML), shellMarkup);
    assert.equal(await page.$eval(".storefront-footer", (element) => element.outerHTML), footerMarkup);
    await page.click('[data-action="details"]');
    await page.waitForSelector("#order-number");
    assert.equal(await page.$eval(".storefront-header", (element) => element.outerHTML), shellMarkup);
    assert.match(await page.$eval("#order-root", (element) => element.textContent), /RV-261112-PAY001/);
    assert.match(paymentText, /389.000/);
    await page.click("#order-back");
    await page.waitForFunction(() => document.getElementById("payment-root")?.getAttribute("aria-busy") === "false");
    assert.match(await page.$eval("#payment-root", (element) => element.textContent), /389.000/);
    assert.equal(await page.$("#change-method") !== null, true);
    checks.push("Pembayaran ↔ detail mempertahankan nomor, nominal, metode dan shell identik");
    checks.push("Review fixes: PH-03, snapshot buket, nominal utuh, validasi dibersihkan saat koreksi");

    const workbench = await page.goto(new URL("/__preview/order-detail", BASE_URL).href);
    assert.equal(workbench.status(), 200);
    await page.waitForSelector("#scenario option");
    assert.equal(await page.$$eval("#scenario option", (elements) => elements.length), scenarioNames.length);
    checks.push("Workbench pengembangan seluruh skenario tersedia di luar root publik");
    assert.deepEqual(browserErrors, []);
    const result = { passed: true, scenarios: scenarioNames.length, checks, screenshots, browserErrors };
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "verification.json"), JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ passed: true, scenarios: result.scenarios, checks: checks.length, screenshots: screenshots.length, browserErrors }));
  }
  finally
  {
    await browser.close();
  }
}

verifyOrderDetail().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
