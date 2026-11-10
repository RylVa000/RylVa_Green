const assert = require("node:assert/strict");
const fs = require("node:fs");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

async function verifyCustomers()
{
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const errors = [];
  const checks = [];
  const captures = [];
  const base = "file:///C:/laragon/www/rylva-green/public/pages/staff/customers.html";
  const output = ".impeccable/review/customers";
  const page = await browser.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());
  async function settle()
  {
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  async function go(query = "")
  {
    await page.goto(base + query, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
  }
  async function click(selector)
  {
    await page.click(selector);
    await settle();
  }
  async function confirm(reason = "Pemeriksaan operasional contoh")
  {
    await page.type("#customer-action-reason", reason);
    await click("#customer-dialog-submit");
  }
  try
  {
    await page.setViewport({ width: 1440, height: 1000 });
    await go();
    assert.equal(await page.$$eval(".customer-summary strong", (nodes) => nodes.map((node) => node.textContent).join(",")), "9,6,5,3");
    await page.type("#customer-search", "RV-261103-C3F8R6");
    assert.equal(await page.$eval(".customer-directory tbody", (node) => node.rows.length), 1);
    assert.match(await page.$eval(".customer-directory", (node) => node.textContent), /Raka Pratama/);
    await click('[data-customer-action="clear"]');
    await click('[data-customer-action="page"][data-page="2"]');
    assert.equal(await page.$eval(".customer-directory tbody", (node) => node.rows.length), 4);
    checks.push("Computed summary, order-number search, clear, and pagination");

    await go("?customer=PLG-0001&tab=orders");
    const orderText = await page.$eval(".customer-orders", (node) => node.textContent);
    assert.match(orderText, /Siap Diproses/);
    assert.match(orderText, /Menunggu/);
    assert.match(orderText, /COD \/ UNPAID/);
    assert.match(orderText, /Belum Diserahkan/);
    assert.match(await page.$eval(".customer-orders a", (node) => node.href), /order=RV-261103-C3F8R6/);
    checks.push("Independent order/payment/shipping states and real prototype order link");

    await go("?customer=PLG-0002&tab=notes");
    await click('.customer-note-form button[type="submit"]');
    assert.equal(await page.$eval("#customer-note-text", (node) => node.getAttribute("aria-invalid")), "true");
    await page.type("#customer-note-text", "Periksa kartu sebelum pengemasan.");
    await page.click('[name="followup"]');
    await page.click(".product-preview-controls > summary");
    await page.click("#customer-fail-save");
    await page.click(".product-preview-controls > summary");
    await click('.customer-note-form button[type="submit"]');
    assert.match(await page.$eval("#customer-note-text", (node) => node.value), /Periksa kartu/);
    await click('.customer-note-form button[type="submit"]');
    assert.equal(await page.evaluate(() => customerOpenNotes("PLG-0002").length), 2);
    await click('[data-customer-action="resolve"][data-note="CT-11"]');
    await confirm("Nama penerima dan kartu sudah diperiksa.");
    assert.equal(await page.evaluate(() => customerOpenNotes("PLG-0002").length), 1);
    checks.push("Note validation, failed-save recovery, append once, and follow-up resolution");

    await go("?customer=PLG-0001");
    assert.equal(await page.$('[data-customer-action="reactivate"]'), null);
    await click('[data-customer-action="deactivate"]');
    await click("#customer-dialog-submit");
    assert.equal(await page.$eval("#customer-action-reason", (node) => node.getAttribute("aria-invalid")), "true");
    await confirm();
    assert.equal(await page.evaluate(() => customers[0].status), "inactive");
    assert.equal(await page.evaluate(() => customerOrders[0].active), true);
    await page.select("#customer-profile", "superadmin");
    await click('[data-customer-action="reactivate"]');
    await page.type("#customer-action-mfa", "123456");
    await confirm();
    assert.equal(await page.evaluate(() => customers[0].status), "active");
    checks.push("Admin deactivation requires reason and preserves orders; reactivation restricted to SuperAdmin");

    await click('[data-customer-action="anonymize"]');
    assert.equal(await page.$eval("#customer-dialog-submit", (node) => node.hidden), true);
    await page.keyboard.press("Escape");
    await go("?role=superadmin&customer=PLG-0008");
    await click('[data-customer-action="anonymize"]');
    await page.type("#customer-action-mfa", "123456");
    await page.type("#customer-action-phrase", "ANONIMKAN");
    await confirm("Permintaan penghapusan sudah diperiksa.");
    assert.equal(await page.evaluate(() => customers.find((entry) => entry.id === "PLG-0008").status), "anonymized");
    assert.equal(await page.evaluate(() => customerAddresses.some((entry) => entry.customerId === "PLG-0008")), false);
    checks.push("Anonymization blocks active work and requires request, reason, MFA simulation, and exact phrase");

    await go("?role=superadmin&search=Raka");
    await click('[data-customer-action="export"]');
    await page.type("#customer-action-mfa", "123456");
    await confirm("Ekspor terbatas untuk pemeriksaan contoh.");
    assert.equal(await page.evaluate(() => customerActivities.filter((entry) => entry.label.includes("diekspor")).length), 1);
    checks.push("SuperAdmin filtered export is confirmed and recorded locally");

    for (const width of [320, 390, 640, 768, 1024, 1280, 1440, 1920])
    {
      await page.setViewport({ width, height: 1000 });
      await go();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `List overflow ${width}`);
    }
    checks.push("Page bounds at eight widths from 320 to 1920");

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
        ["activity", "?role=superadmin&customer=PLG-0008&tab=activity"]
      ])
      {
        await go(query);
        await page.evaluate(() =>
        {
          document.activeElement?.blur();
          scrollTo(0, 0);
        });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${state} overflow ${width}`);
        const file = `${output}/${state}-${width}.png`;
        await page.screenshot({ path: file, fullPage: true });
        captures.push(file);
      }
      await go("?role=superadmin&customer=PLG-0008");
      await click('[data-customer-action="anonymize"]');
      await page.screenshot({ path: `${output}/confirmation-${width}.png` });
      captures.push(`${output}/confirmation-${width}.png`);
    }
    await page.setViewport({ width: 390, height: 900 });
    for (const state of ["empty", "loading", "error"])
    {
      await go();
      await page.select("#customer-load-state", state);
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: `${output}/${state}-390.png`, fullPage: true });
      captures.push(`${output}/${state}-390.png`);
      if (state !== "empty")
      {
        await click('[data-customer-action="retry"]');
        assert.ok(await page.$(".customer-directory"));
      }
    }
    await go("?customer=missing");
    assert.match(await page.$eval("#customer-view", (node) => node.textContent), /Pelanggan tidak ditemukan/);
    await click('[data-customer-action="back"]');
    assert.ok(await page.$(".customer-directory"));
    checks.push("Empty, loading, error, and not-found recovery");
    assert.deepEqual(errors, []);
    fs.writeFileSync(`${output}/verification.json`, JSON.stringify({ checks, errors, captures }, null, 2));
    console.log(JSON.stringify({ checks, errors, captures }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyCustomers().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
