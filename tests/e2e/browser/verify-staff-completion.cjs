"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");
const output = ".impeccable/review/staff-completion";
fs.mkdirSync(output, { recursive: true });

async function verify()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"]
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  async function open(file, query = "")
  {
    await page.goto(`http://127.0.0.1:4178/${file}.html?${query}`, { waitUntil: "networkidle0" });
  }

  async function state()
  {
    return page.evaluate(() => window.superadminReview.snapshot());
  }

  async function fill(name, text)
  {
    await page.$eval(`#support-${name}`, (control, content) =>
    {
      control.value = content;
      control.dispatchEvent(new Event("input", { bubbles: true }));
    }, text);
  }

  async function fields()
  {
    await fill("reason", "Catatan status contoh perlu dikoreksi setelah pemeriksaan.");
    await fill("mfa", "123456");
    await page.$eval('[name="acknowledgement"]', (control) =>
    {
      control.checked = true;
    });
  }

  async function submit()
  {
    await page.click('#support-dialog-actions button[type="submit"]');
  }

  async function propose(source, target)
  {
    await open("sensitive-approvals", `role=superadmin&source=${source}`);
    await page.click('[data-hub-action="correction-propose"]');
    await page.select("#support-targetStatus", target);
    await fill("reference", "DEMO-PERIKSA-2026");
    await fields();
    await submit();
    return page.evaluate(() => window.staffHub.state.item);
  }

  try
  {
    await open("sensitive-approvals", "role=superadmin");
    await page.evaluate(() => window.superadminReview.reset());
    const routes =
    [
      ["sensitive-approvals", "role=superadmin&source=select", "source-select"],
      ["sensitive-approvals", "role=superadmin&source=DEMO-COR-001", "source-complete"],
      ["sensitive-approvals", "role=superadmin&source=DEMO-COR-002", "source-cancelled"],
      ["sensitive-approvals", "role=superadmin&source=missing", "source-missing"],
      ["sensitive-approvals", "role=admin&source=DEMO-COR-001", "source-denied"],
      ["staff-status", "role=superadmin&state=internal-error&return=orders", "error500"],
      ["staff-status", "role=admin&state=rate-limited&return=orders", "error429"],
      ["orders-queue", "role=superadmin&tab=all&order=RV-261102-V4H8B6", "order-superadmin"],
      ["orders-queue", "role=admin&tab=all&order=RV-261102-V4H8B6", "order-admin"]
    ];
    for (const width of [320, 390, 768, 1440, 1920])
    {
      await page.setViewport({ width, height: 900 });
      for (const [file, query, name] of routes)
      {
        await open(file, query);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Overflow ${name} ${width}`);
        assert(await page.$("h1"), `Judul hilang ${name}`);
        if (name === "source-denied")
        {
          assert(await page.$('[data-hub-action="correction-propose"]') === null, "Admin dapat membuat koreksi.");
          assert(!(await page.$eval("#support-root", (root) => root.textContent)).includes("DEMO-COR-001"), "Sumber sensitif bocor ke Admin.");
        }
        if (name === "order-admin")
        {
          assert(await page.$("#open-terminal-correction") === null, "Admin memperoleh tindakan koreksi.");
        }
        if ([390, 1440].includes(width))
        {
          await page.screenshot({ path: `${output}/${name}-${width}.png`, fullPage: true });
        }
      }
    }
    await page.setViewport({ width: 390, height: 900 });
    await open("sensitive-approvals", "role=superadmin&source=DEMO-COR-001");
    const initial = await state();
    await page.click('[data-hub-action="correction-propose"]');
    await fields();
    await page.screenshot({ path: `${output}/proposal-dialog-390.png`, fullPage: false });
    await submit();
    assert(await page.$eval("#support-dialog", (dialog) => dialog.open), "Isian koreksi kosong lolos.");
    await page.select("#support-targetStatus", "cancelled");
    await fill("reference", "DEMO-PERIKSA-2026");
    await page.$eval("#support-fail", (control) =>
    {
      control.checked = true;
    });
    await submit();
    assert((await state()).requests.length === initial.requests.length, "Simpan gagal tetap membuat pengajuan.");
    assert(await page.$eval("#support-reference", (control) => control.value) === "DEMO-PERIKSA-2026", "Isian gagal simpan hilang.");
    await page.$eval("#support-fail", (control) =>
    {
      control.checked = false;
    });
    await page.screenshot({ path: `${output}/save-failure-390.png`, fullPage: false });
    await submit();
    const requestId = await page.evaluate(() => window.staffHub.state.item);
    assert(requestId.startsWith("COR-"), "Pengajuan tidak membuka detail.");
    assert(await page.$eval('[data-hub-action="approve-request"]', (control) => control.disabled), "Pengaju dapat menyetujui sendiri.");
    const pending = await state();
    const duplicate = await page.evaluate(() =>
    {
      const demo = window.superadminReview;
      return demo.proposeCorrection("DEMO-COR-001", 1, "cancelled", "DEMO-DUPLIKAT", "Alasan contoh duplikat", demo.snapshot().actors[0]);
    });
    assert(duplicate.errors?.length && (await state()).requests.length === pending.requests.length, "Duplikat aktif lolos.");
    await open("sensitive-approvals", `role=superadmin&actor=sa-02&item=${requestId}&tab=impact`);
    await page.screenshot({ path: `${output}/impact-390.png`, fullPage: true });
    await page.click('[data-hub-action="approve-request"]');
    await fields();
    await submit();
    const decided = await state();
    const source = decided.terminalOrders.find((item) => item.id === "DEMO-COR-001");
    assert.equal(source.corrections.length, 1);
    assert.equal(source.currentStatus, "cancelled");
    assert.deepEqual(source.event, initial.terminalOrders[0].event, "Riwayat asli ditimpa.");
    assert.deepEqual(decided.stocks, initial.stocks, "Koreksi mengubah stok.");
    assert.deepEqual(decided.refundRights, initial.refundRights, "Koreksi mengubah dana.");
    const repeated = await page.evaluate((id) =>
    {
      const demo = window.superadminReview;
      const record = demo.snapshot().requests.find((item) => item.id === id);
      return demo.decide(id, record.version, true, "Contoh percobaan kedua", demo.snapshot().actors[1]);
    }, requestId);
    assert(repeated.errors?.length, "Keputusan dapat diterapkan dua kali.");
    await open("sensitive-approvals", "role=superadmin&source=DEMO-COR-001");
    assert.equal((await state()).terminalOrders[0].corrections.length, 1, "Koreksi hilang saat navigasi.");
    await page.screenshot({ path: `${output}/approved-source-390.png`, fullPage: true });
    await page.setViewport({ width: 1440, height: 900 });
    await page.screenshot({ path: `${output}/approved-source-1440.png`, fullPage: true });

    const staleId = await propose("DEMO-COR-002", "complete");
    await page.evaluate(() =>
    {
      const demo = window.superadminReview;
      const source = demo.snapshot().terminalOrders.find((item) => item.id === "DEMO-COR-002");
      source.sourceFingerprint = "changed-source";
      demo.registerTerminalOrder(source);
    });
    await open("sensitive-approvals", `role=superadmin&actor=sa-02&item=${staleId}`);
    assert(await page.$eval('[data-hub-action="approve-request"]', (control) => control.disabled), "Revisi berubah dapat disetujui.");
    await page.click('[data-hub-action="reject-request"]');
    await fields();
    await submit();
    assert.equal((await state()).terminalOrders.find((item) => item.id === "DEMO-COR-002").corrections.length, 0);

    await open("orders-queue", "role=superadmin&tab=all&order=RV-261102-V4H8B6");
    const originalOrder = await page.evaluate(() => JSON.stringify(currentOrder()));
    await Promise.all(
    [
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.click("#open-terminal-correction")
    ]);
    assert(await page.$('[data-hub-action="correction-propose"]'), "Snapshot pesanan tidak terbawa ke persetujuan.");
    const orderId = "RV-261102-V4H8B6";
    const fromOrderId = await propose(orderId, "complete");
    await open("sensitive-approvals", `role=superadmin&actor=sa-02&item=${fromOrderId}`);
    await page.click('[data-hub-action="approve-request"]');
    await fields();
    await submit();
    await open("orders-queue", `role=superadmin&tab=all&order=${orderId}&detailTab=activity`);
    assert.equal(await page.evaluate(() => JSON.stringify(currentOrder())), originalOrder, "Snapshot pesanan atau riwayat asli berubah.");
    assert((await page.$eval("#order-correction-surface", (section) => section.textContent)).includes("Dibatalkan menjadi Selesai"), "Catatan tidak kembali ke detail pesanan.");
    await page.screenshot({ path: `${output}/order-correction-1440.png`, fullPage: true });
    await page.setViewport({ width: 390, height: 900 });
    await page.screenshot({ path: `${output}/order-correction-390.png`, fullPage: true });
    await open("staff-status", "state=rate-limited&return=https://example.org");
    assert.equal(await page.evaluate(() => window.staffHub.state.destination), "dashboard", "Tujuan pemulihan keluar dari allowlist.");
    assert(!await page.$('[data-hub-action="retry"]'), "429 mengulang tindakan secara otomatis.");
    assert.equal(errors.length, 0, errors.join(" | "));
    console.log("Penyelesaian staf: 45 layout, koreksi dua pelaku, validasi, duplikat, revisi, preservasi riwayat/dana/stok, lintas halaman, error 500/429 lulus; 0 error browser.");
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
