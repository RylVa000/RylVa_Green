const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

const artifactDirectory = path.resolve(".impeccable/review/order-workflows");
const photo = path.resolve(".impeccable/review/orders/spacing-390.png");
const pageUrl = "file:///C:/laragon/www/rylva-green/public/pages/staff/orders-queue.html";
const browserErrors = [];
const checks = [];

async function verifyWorkflows()
{
  fs.mkdirSync(artifactDirectory, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });

  try
  {
    const page = await browser.newPage();
    page.on("pageerror", (error) => browserErrors.push(error.message));
    await page.setViewport({ width: 1440, height: 1000 });

    async function open(id = "", parameters = "")
    {
      await page.goto(`${pageUrl}?order=${id}${parameters}`, { waitUntil: "networkidle0" });
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.$eval('[data-count="all"]', (node) => node.textContent), "17");
    }

    async function tab(name)
    {
      await page.click(`[data-detail-tab="${name}"]`);
    }

    async function action(name)
    {
      const button = await page.$(`#detail-view [data-work-action="${name}"]`);
      assert.ok(button, `Action ${name} exists`);
      await button.click();
    }

    async function fill(values)
    {
      for (const [name, value] of Object.entries(values))
      {
        const selector = `#work-${name}`;
        const control = await page.$(selector);
        assert.ok(control, `Field ${name} exists`);
        const type = await control.evaluate((node) => node.type);

        if (type === "select-one")
        {
          await page.select(selector, value);
        }
        else if (type === "checkbox")
        {
          if (await control.evaluate((node) => node.checked) !== value)
          {
            await control.click();
          }
        }
        else if (type === "file")
        {
          await control.uploadFile(...(Array.isArray(value) ? value : [value]));
        }
        else
        {
          await control.evaluate((node, fieldValue) =>
          {
            node.value = fieldValue;
            node.dispatchEvent(new Event("input", { bubbles: true }));
          }, String(value));
        }
      }
    }

    async function submit()
    {
      const directSave = await page.evaluate(() => ["note", "contact"].includes(activeEditor.action));
      await page.click("#workflow-submit");

      if (!directSave)
      {
        await page.waitForFunction(() => document.getElementById("workflow-confirm").open);
        await page.click('#workflow-confirm button[value="confirm"]');
      }

      await page.waitForFunction(() => !document.getElementById("workflow-form"));
    }

    async function capture(name)
    {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: path.join(artifactDirectory, `${name}.png`), fullPage: true });
    }

    async function profile(name)
    {
      await page.$eval(".work-preview-controls", (node) => node.open = true);
      await page.select("#workflow-profile", name);
    }

    const reason = "Pemeriksaan dan persetujuan contoh telah dicatat dengan bukti.";
    const reference = "DEMO-BUKTI-VERIFIKASI";

    await open("RV-261103-C3F8R6");
    await page.click("#prepare-button");
    await page.click("#confirm-prepare");
    await page.waitForFunction(() => document.getElementById("detail-order-status").textContent === "Sedang Disiapkan");
    await action("handoff");
    assert.equal(await page.$eval("#workflow-submit", (node) => node.disabled), true);
    await fill({ tracking: "DEMO-KURIR-COD", photos: photo, packed: true, reason });
    assert.equal(await page.$eval("#workflow-submit", (node) => node.disabled), false);
    await capture("handoff-desktop");
    await page.click("#workflow-submit");
    await page.keyboard.press("Escape");
    assert.equal(await page.$eval("#work-tracking", (node) => node.value), "DEMO-KURIR-COD");
    await submit();
    assert.match(await page.$eval("#detail-payment-status", (node) => node.textContent), /Menunggu/);
    assert.equal(await page.$eval("#detail-order-status", (node) => node.textContent), "Dikirim");
    await action("delivered");
    await fill({ recipient: "Raka Pratama", reference, photos: photo, reason });
    await submit();
    await tab("aftercare");
    await action("cod");
    await fill({ amount: "1", reference, photos: photo, reason });
    await page.click("#workflow-submit");
    assert.equal(await page.$eval("#work-amount", (node) => node.getAttribute("aria-invalid")), "true");
    await fill({ amount: "193999" });
    await submit();
    assert.match(await page.$eval("#detail-payment-status", (node) => node.textContent), /Berhasil/);
    checks.push("COD stays unpaid through preparation, handoff and delivery; cash confirmation requires exact amount and evidence");

    await open("RV-261103-R7C5G9");
    const snapshot = await page.evaluate(() => JSON.stringify(currentOrder().items));
    await tab("case");
    await action("resolve-case");
    await fill(
    {
      resolution: "substitute",
      item: "0",
      replacement: "DEMO-PL-30, tanaman pengganti setara",
      replacementPrice: "100000",
      feasible: true,
      consent: true,
      reference,
      reason
    });
    await submit();
    assert.equal(await page.evaluate(() => JSON.stringify(currentOrder().items)), snapshot);
    await tab("aftercare");
    await action("refund-decision");
    assert.match(await page.$eval("#workflow-panel", (node) => node.textContent), /Anda adalah pengaju/);
    await profile("adminDian");
    await action("refund-decision");
    await fill({ decision: "approve", reason });
    await submit();
    await action("refund-check");
    await fill({ verified: true });
    await submit();
    assert.match(await page.$eval("#detail-payment-status", (node) => node.textContent), /Dikembalikan Sebagian/);
    checks.push("Substitution preserves original snapshot, computes the price difference, and enforces maker-checker");

    await open("RV-261102-E6G8R4");
    await tab("aftercare");
    await action("refund-decision");
    assert.match(await page.$eval("#workflow-panel", (node) => node.textContent), /500.000/);
    await profile("superadmin");
    await action("refund-decision");
    await fill({ decision: "approve", reason });
    await capture("refund-approval-desktop");
    await submit();
    assert.equal(await page.$eval("#detail-order-status", (node) => node.textContent), "Dibatalkan");
    assert.match(await page.$eval("#detail-payment-status", (node) => node.textContent), /Refund Diproses/);
    await action("refund-check");
    await fill({ verified: true });
    await submit();
    assert.match(await page.$eval("#detail-payment-status", (node) => node.textContent), /Dikembalikan Penuh/);
    checks.push("Refund over Rp500000 requires SuperAdmin and does not conflate cancellation with completed refund");

    await open("RV-261103-K9B3S7");
    await tab("aftercare");
    await action("cancel-request");
    await fill({ source: "customer", reference, reason });
    await submit();
    await action("cancel-decision");
    await fill({ decision: "approve", notPacked: true, reason });
    await page.click("#workflow-submit");
    assert.equal(await page.$eval("#work-decision", (node) => node.getAttribute("aria-invalid")), "true");
    await fill({ decision: "reject" });
    await submit();
    assert.equal(await page.$eval("#detail-order-status", (node) => node.textContent), "Sedang Disiapkan");
    checks.push("Perishable preparation cannot be cancelled as a routine customer request");

    await open("RV-261102-P3J7W9");
    await tab("aftercare");
    await action("complaint-decision");
    await fill(
    {
      resolution: "partial",
      responsibility: "courier",
      item: "0",
      amount: "10000",
      reference,
      reason
    });
    await submit();
    assert.equal(await page.$('[data-work-action="replacement-complete"]'), null);
    await profile("adminDian");
    await action("refund-decision");
    await fill({ decision: "approve", reason });
    await submit();
    await action("refund-check");
    await fill({ verified: true });
    await submit();
    assert.equal(await page.$eval("#detail-order-status", (node) => node.textContent), "Selesai");
    checks.push("A refund resolution keeps the complaint open until the refund succeeds");

    await open("RV-261102-S5D7K3");
    await tab("aftercare");
    await action("complaint-decision");
    assert.match(await page.$eval("#workflow-panel", (node) => node.textContent), /Banding hanya/);
    await profile("superadmin");
    await action("complaint-decision");
    await fill({ resolution: "reject", responsibility: "unknown", reference, reason });
    await submit();
    assert.equal(await page.evaluate(() => currentOrder().operations.complaint.status), "closed");
    checks.push("A complaint appeal is restricted to SuperAdmin and its decision is final");

    await open("RV-261103-T8D4H6");
    await tab("case");
    assert.equal(await page.$('[data-work-action="reconcile"]'), null);
    await profile("superadmin");
    await action("reconcile");
    await fill(
    {
      verification: "manual",
      reference,
      amount: "149000",
      photos: photo,
      stockChecked: true,
      mfa: "123456",
      reason
    });
    await submit();
    assert.match(await page.$eval("#detail-payment-status", (node) => node.textContent), /Perlu Ditinjau/);
    await action("reconcile-approve");
    assert.match(await page.$eval("#workflow-panel", (node) => node.textContent), /Pengaju tidak boleh/);
    await profile("superadminDian");
    await action("reconcile-approve");
    await fill({ verified: true, mfa: "654321", reason });
    await submit();
    assert.equal(await page.$eval("#detail-order-status", (node) => node.textContent), "Siap Diproses");
    checks.push("Manual gateway evidence requires a distinct second SuperAdmin before applying payment");

    await open("RV-261103-G7M5T9");
    await tab("case");
    await action("resolve-case");
    await fill(
    {
      resolution: "restore",
      day: "2026-11-04",
      slot: "afternoon",
      feasible: true,
      consent: true,
      reference,
      reason
    });
    await submit();
    assert.equal(await page.$eval("#detail-order-status", (node) => node.textContent), "Siap Diproses");
    checks.push("Late payment recovery requires explicit customer consent and feasible delivery");

    await open("RV-261103-N6E9U2");
    await tab("fulfillment");
    await action("shipping-issue");
    await fill({ issue: "lost", responsibility: "courier", reference, photos: photo, reason });
    await submit();
    assert.equal(await page.$eval("#detail-shipping-status", (node) => node.textContent), "Terkendala");
    await tab("case");
    await action("resolve-case");
    await fill(
    {
      resolution: "replace",
      responsibility: "courier",
      day: "2026-11-04",
      slot: "morning",
      feasible: true,
      consent: true,
      reference,
      reason
    });
    await submit();
    assert.equal(await page.$eval("#detail-order-status", (node) => node.textContent), "Sedang Disiapkan");
    checks.push("Shipping failure creates a case with evidence and can route to an agreed replacement");

    await open("RV-261102-V4H8B6");
    await tab("aftercare");
    await action("refund-retry");
    await fill(
    {
      mode: "manual",
      bank: "Bank contoh",
      accountNumber: "1234567890",
      reference,
      photos: photo,
      verified: true,
      reason
    });
    await submit();
    assert.match(await page.$eval("#detail-payment-status", (node) => node.textContent), /Dikembalikan Sebagian/);
    checks.push("A failed return refund can be resolved manually with verified transfer evidence");

    await open("RV-261103-A7K9M2", "&actionState=error");
    await action("note");
    await fill({ reason });
    await page.click('[data-detail-tab="overview"]');
    assert.equal(await page.$eval("#workflow-confirm", (node) => node.open), true);
    await page.keyboard.press("Escape");
    assert.equal(await page.$eval("#work-reason", (node) => node.value), reason);
    await page.click("#workflow-submit");
    await page.waitForFunction(() => !document.getElementById("workflow-save-error").hidden);
    await capture("save-error-desktop");
    assert.equal(await page.$eval("#work-reason", (node) => node.value), reason);
    await submit();
    assert.equal(await page.evaluate(() => currentOrder().operations.notes.length), 1);
    checks.push("Unsaved edits require confirmation; a failed save retains fields and retry applies exactly once");

    await open("RV-261103-B8F4N6");
    await tab("case");
    await action("resolve-case");
    await fill(
    {
      resolution: "partial",
      item: "0",
      quantity: "1",
      feasible: true,
      consent: true,
      reference,
      reason
    });
    await submit();
    assert.equal(await page.evaluate(() => currentOrder().operations.refunds[0].amount), 149000);
    checks.push("Partial fulfillment computes refund from quantity and retains remaining items");

    await open("RV-261103-A7K9M2");
    await tab("fulfillment");
    await action("schedule");
    await fill(
    {
      day: "2026-11-03",
      slot: "afternoon",
      address: "Alamat demonstrasi baru di Jakarta Selatan.",
      sameService: true,
      consent: true,
      reference,
      reason
    });
    await page.click("#workflow-submit");
    assert.equal(await page.$eval("#work-slot", (node) => node.getAttribute("aria-invalid")), "true");
    await fill({ slot: "evening" });
    await submit();
    await tab("overview");
    assert.match(await page.$eval("#detail-address", (node) => node.textContent), /Alamat demonstrasi baru/);
    checks.push("Rescheduling enforces four-hour lead time and updates the displayed address without changing prices");

    await open("RV-261103-A7K9M2");
    await page.click("#prepare-button");
    await page.click("#confirm-prepare");
    await page.waitForFunction(() => document.getElementById("detail-order-status").textContent === "Sedang Disiapkan");
    await tab("fulfillment");
    await action("stock-issue");
    await fill({ item: "0", quantity: "1", reason });
    await submit();
    await tab("case");
    await action("contact");
    await fill({ channel: "chat", response: "replied", reference, reason });
    await submit();
    await action("escalate");
    await fill({ reference, reason });
    await submit();
    assert.match(await page.evaluate(() => currentOrder().caseInfo.owner), /SuperAdmin/);
    checks.push("Stock discrepancy, customer contact and escalation remain actionable with a recorded owner");

    await open("RV-261103-F6L8Q4");
    await action("cancel-decision");
    await fill({ decision: "approve", notPacked: true, reason });
    await submit();
    assert.equal(await page.evaluate(() => currentOrder().operations.refunds[0].status), "requested");
    await action("refund-decision");
    assert.match(await page.$eval("#workflow-panel", (node) => node.textContent), /Anda adalah pengaju/);
    checks.push("Approving a non-automatic cancellation still requires a separate refund checker");

    await open("RV-261102-V4H8B6");
    await tab("aftercare");
    assert.equal(await page.$('[data-work-action="refund-request"]'), null);
    await action("refund-retry");
    await fill({ mode: "retry", reference, verified: true, reason });
    await submit();
    await action("refund-check");
    await fill({ verified: true });
    await submit();
    assert.equal(await page.evaluate(() => refundableLimit(currentOrder())), 0);
    checks.push("Return refund entitlement excludes shipping and cannot be requested twice");

    await open("RV-261103-T8D4H6");
    await profile("superadmin");
    await tab("case");
    await action("reconcile");
    await fill(
    {
      verification: "api",
      reference,
      amount: "149000",
      stockChecked: true,
      mfa: "123456",
      reason
    });
    await submit();
    assert.match(await page.$eval("#detail-payment-status", (node) => node.textContent), /Berhasil/);
    checks.push("Verified API reconciliation follows an explicit SuperAdmin verification flow");

    await open("RV-261103-N6E9U2");
    await tab("fulfillment");
    await action("delivered");
    await fill({ recipient: "Nisa Aulia", reference, photos: photo, reason });
    await submit();
    await tab("aftercare");
    await action("complaint-request");
    await fill({ category: "notReceived", reference, reason });
    await submit();
    await action("complaint-decision");
    await fill({ resolution: "replace", responsibility: "courier", reference, reason });
    await submit();
    await action("replacement-complete");
    await fill({ reference, photos: photo, consent: true, reason });
    await submit();
    assert.equal(await page.evaluate(() => currentOrder().operations.complaint.status), "closed");
    checks.push("A not-received complaint needs no photos and replacement completion requires customer consent and receipt evidence");

    await open("RV-261102-P3J7W9");
    await tab("aftercare");
    await action("complaint-decision");
    await fill({ resolution: "reject", responsibility: "unknown", reference, reason });
    await submit();
    await action("appeal");
    await fill({ reference, photos: photo, reason });
    await submit();
    assert.equal(await page.evaluate(() => currentOrder().operations.complaint.appeals), 1);
    checks.push("Customer-requested appeal is recorded once with supporting evidence");

    await open("RV-261103-B8F4N6");
    await tab("case");
    await action("resolve-case");
    await fill(
    {
      resolution: "partial",
      item: "0",
      quantity: "1",
      feasible: true,
      consent: true,
      reference,
      reason
    });
    await submit();
    await tab("aftercare");
    await profile("adminDian");
    await action("refund-decision");
    await fill({ decision: "approve", reason });
    await submit();
    assert.equal(await page.evaluate(() => canStartPreparation(currentOrder())), true);
    await capture("partial-refund-processing");
    await action("refund-check");
    await fill({ verified: true });
    await submit();
    assert.equal(await page.evaluate(() => canStartPreparation(currentOrder())), true);
    await page.click("#prepare-button");
    await page.click("#confirm-prepare");
    await page.waitForFunction(() => currentOrder().status === "preparing");
    checks.push("Remaining paid fulfillment can be prepared during and after a partial refund");

    for (const resolution of ["substitute", "partial"])
    {
      await open("RV-261103-C3F8R6");
      const originalItems = await page.evaluate(() => JSON.stringify(currentOrder().items));
      await page.click("#prepare-button");
      await page.click("#confirm-prepare");
      await page.waitForFunction(() => currentOrder().status === "preparing");
      await tab("fulfillment");
      await action("stock-issue");
      await fill({ item: "0", quantity: "1", reason });
      await submit();
      await tab("case");
      await action("resolve-case");
      await fill({ resolution, item: "0" });

      if (resolution === "substitute")
      {
        await fill({ replacement: "Pengganti contoh DEMO-PL-30", replacementPrice: "100000" });
      }
      else
      {
        await fill({ quantity: "1" });
      }

      await fill({ feasible: true, consent: true, reference, reason });
      await submit();
      const expected = resolution === "substitute" ? 165000 : 65000;
      assert.equal(await page.evaluate(() => currentOrder().operations.refunds.length), 0);
      assert.equal(await page.evaluate(() => getCollectibleTotal(currentOrder())), expected);
      assert.equal(await page.evaluate(() => JSON.stringify(currentOrder().items)), originalItems);
      await tab("fulfillment");
      assert.match(await page.$eval("#workflow-panel", (node) => node.textContent), /Tagihan awal/);
      await capture(`cod-adjustment-${resolution}`);
      await action("handoff");
      assert.match(await page.$eval(".work-form-context", (node) => node.textContent), new RegExp(expected === 165000 ? "165.000" : "65.000"));
      await fill({ tracking: "DEMO-COD-ADJUSTED", photos: photo, packed: true, reason });
      await submit();
      await action("delivered");
      await fill({ recipient: "Raka Pratama", reference, photos: photo, reason });
      await submit();
      await tab("aftercare");
      await action("cod");
      await fill({ amount: "193999", reference, photos: photo, reason });
      await page.click("#workflow-submit");
      assert.equal(await page.$eval("#work-amount", (node) => node.getAttribute("aria-invalid")), "true");
      await fill({ amount: String(expected) });
      await submit();
      assert.equal(await page.evaluate(() => currentOrder().operations.paidAmount), expected);
      checks.push(`Unpaid COD ${resolution} uses a consented collection adjustment through delivery and exact cash receipt`);
    }

    for (const width of [320, 390, 768, 1280, 1440, 1920])
    {
      await page.setViewport({ width, height: 1000 });
      await open("RV-261103-K9B3S7");
      await tab("fulfillment");
      await action("handoff");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Form overflow ${width}`);

      if ([390, 768, 1440].includes(width))
      {
        await capture(`fulfillment-form-${width}`);
      }
    }

    await page.setViewport({ width: 1440, height: 1000 });
    await open();
    await page.click("#filters-toggle");
    await page.select("#stage-filter", "cancelled");
    await page.click('#advanced-filters button[type="submit"]');
    assert.equal(await page.$$eval("#order-rows tr", (rows) => rows.length), 1);
    assert.match(page.url(), /tab=all/);
    checks.push("The advanced status filter includes cancelled and post-delivery orders and persists in the URL");
    await open("", "&workspace=aftercare");
    await capture("aftercare-desktop");
    await page.setViewport({ width: 390, height: 844 });
    await capture("aftercare-mobile");
    await open("RV-261103-R7C5G9", "&detailTab=case");
    await capture("case-mobile");
    await open("RV-261103-C3F8R6");
    await capture("overview-mobile");
    await page.setViewport({ width: 1440, height: 1000 });
    await capture("overview-desktop");
    checks.push("Deep-linked tabs and workspaces render correctly; no form overflow from 320 to 1920px");
    assert.deepEqual(browserErrors, []);
    const report = { passed: true, browserErrors, checks };
    fs.writeFileSync(path.join(artifactDirectory, "verification.json"), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyWorkflows().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
