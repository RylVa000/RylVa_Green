const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

async function verifyMaterials()
{
  const directory = path.resolve(".impeccable/review/materials");
  fs.mkdirSync(directory, { recursive: true });
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const errors = [];
  const checks = [];
  let page;

  try
  {
    page = await browser.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("dialog", (dialog) => dialog.accept());
    const url = pathToFileURL(path.resolve("public/pages/staff/production-materials.html")).href;
    await page.setViewport({ width: 1440, height: 1000 });

    async function open(query = "")
    {
      await page.goto(url + query, { waitUntil: "networkidle0" });
      await page.evaluate(() => document.fonts.ready);
    }

    async function act(action, extra = "")
    {
      const controls = await page.$$(`[data-material-action="${action}"]${extra}`);

      for (const control of controls)
      {
        if (await control.isVisible())
        {
          await control.evaluate((node) => node.scrollIntoView({ block: "center" }));
          await control.click();
          return;
        }
      }
      throw new Error(`Visible action not found: ${action}${extra}`);
    }

    async function fill(name, value)
    {
      await page.$eval(`#material-${name}`, (node, next) =>
      {
        node.value = String(next);
        node.dispatchEvent(new Event("input", { bubbles: true }));
      }, value);
    }

    async function choose(name, value)
    {
      await page.select(`#material-${name}`, value);
    }

    async function capture(name, full = false)
    {
      await page.evaluate(() =>
      {
        document.activeElement?.blur();
        window.scrollTo(0, 0);
      });
      await new Promise((resolve) => setTimeout(resolve, 200));
      await page.screenshot({ path: path.join(directory, `${name}.png`) });

      if (full)
      {
        await page.screenshot({ path: path.join(directory, `${name}-full.png`), fullPage: true });
      }
    }

    async function confirm(reason = "")
    {
      await page.waitForFunction(() => document.getElementById("material-confirm").open);

      if (reason)
      {
        await fill("action-reason", reason);
      }
      await page.click("#material-confirm-submit");
    }

    async function submit(fail = false)
    {
      await page.click("#material-save");
      await confirm();
      await page.waitForFunction((expectFailure) =>
      {
        return !materialSaving && (expectFailure
          ? document.querySelector("#material-errors:not([hidden])")?.textContent.includes("Simpan gagal")
          : materialState.mode === "view");
      }, {}, fail);
    }

    async function reference()
    {
      await fill("reference", "DEMO-DOC-0411");
      await fill("reason", "Jumlah dan dokumen contoh sudah diperiksa.");
    }

    await open();
    assert.deepEqual(await page.evaluate(() =>
    {
      const stock = mStock(mFind("rose"));
      return [stock.balance, stock.allocated, stock.expired, stock.available];
    }), [34, 12, 4, 18]);
    assert.match(await page.$eval(".material-summary", (node) => node.textContent), /9 jenis bahan aktif.*1 bahan habis.*3 bahan menipis/);
    await capture("catalog-desktop", true);
    await fill("search", "BH-PIT");
    assert.equal(await page.$$eval("#material-rows tbody > tr", (nodes) => nodes.length), 1);
    assert.match(page.url(), /q=BH-PIT/);
    await act("reset");
    await act("page", '[data-direction="1"]');
    await page.waitForFunction(() => new URL(location.href).searchParams.get("page") === "2");
    await act("condition", '[data-condition="expired"]');
    assert.equal(await page.$$eval("#material-rows tbody > tr", (nodes) => nodes.length), 1);
    checks.push("Computed counts, physical/allocation/expired/free stock, code search, URL paging and actionable warning filters agree");

    await open("?material=rose&mode=receipt");
    await page.click("#material-materialId-combobox");
    await page.keyboard.down("Control");
    await page.keyboard.press("a");
    await page.keyboard.up("Control");
    await page.type("#material-materialId-combobox", "pita sage");
    assert.equal(await page.$$eval('.admin-combobox-popup:not([hidden]) [role="option"]', (nodes) => nodes.length), 1);
    await page.screenshot({ path: path.join(directory, "material-search.png") });
    await page.keyboard.press("Enter");
    assert.equal(await page.$eval("#material-materialId", (node) => node.value), "ribbon");
    await choose("materialId", "rose");
    assert.deepEqual(await page.$eval("#material-unit", (node) => [...node.options].map((option) => option.value)), ["batang", "ikat"]);
    await choose("unit", "ikat");
    await fill("quantity", -4);
    assert.equal(await page.$eval("#material-quantity", (node) => node.value), "1");
    await fill("quantity", 2);
    await fill("batchId", "MWR-NEW-0411");
    await fill("expires", "2026-11-09");
    await reference();
    assert.match(await page.$eval("#material-movement-preview", (node) => node.textContent), /2 ikat = 20 batang.*34 batang menjadi 54 batang/);
    await page.$eval(".product-preview-controls", (node) => node.open = true);
    await page.click("#material-fail-save");
    await submit(true);
    assert.equal(await page.evaluate(() => mStock(mFind("rose")).balance), 34);
    assert.equal(await page.$eval("#material-quantity", (node) => node.value), "2");
    await capture("receipt-recovery", true);
    await submit();
    assert.equal(await page.evaluate(() => mStock(mFind("rose")).balance), 54);
    assert.equal(await page.evaluate(() => materialLedger.filter((entry) => entry.type === "receipt").length), 1);
    checks.push("Searchable material choices, relevant flower units, positive receipt, configured package conversion and failed-save recovery work; retry writes once");

    await open("?material=rose&mode=transfer");
    assert.equal(await page.$eval("#material-quantity", (node) => node.disabled), true);
    await choose("batchId", "MWR-0111");
    assert.equal(await page.$eval("#material-save", (node) => node.disabled), true);
    await capture("expired-batch-blocked", true);
    await choose("batchId", "MWR-0411");
    await fill("quantity", 100);
    assert.equal(await page.$eval("#material-quantity", (node) => node.value), "18");
    await reference();
    await capture("transfer-at-limit", true);
    await submit();
    assert.deepEqual(await page.evaluate(() =>
    {
      const material = mFind("rose");
      return [mStock(material, "pusat").balance, mStock(material, "toko").balance, material.batches.find((batch) => batch.id === "MWR-0411").expires];
    }), [16, 26, "2026-11-07"]);
    checks.push("Batch selection is required; expired transfer is blocked; transfer clamps at free stock and preserves total quantity and expiry");

    await open("?material=eucalyptus&mode=damage");
    assert.equal(await page.$eval("#material-quantity", (node) => node.disabled), true);
    assert.equal(await page.$eval("#material-save", (node) => node.disabled), true);
    assert.equal(await page.$eval("#material-movement-preview", (node) => node.textContent), "");
    await open("?material=rose&mode=damage");
    await choose("batchId", "MWR-0111");
    await fill("quantity", 9);
    assert.equal(await page.$eval("#material-quantity", (node) => node.value), "4");
    await reference();
    await submit();
    assert.equal(await page.evaluate(() => mStock(mFind("rose")).expired), 0);
    checks.push("Zero stock disables reductions; an expired batch can be disposed of up to its exact unallocated balance");

    await open("?material=ribbon&mode=transfer");
    await fill("quantity", 0.25);
    await reference();
    await submit();
    assert.deepEqual(await page.evaluate(() =>
    {
      return [mStock(mFind("ribbon"), "pusat").balance, mStock(mFind("ribbon"), "toko").balance];
    }), [1225, 350]);
    assert.equal(await page.evaluate(() => mStock(mFind("ribbon"), "pusat").balance + mStock(mFind("ribbon"), "toko").balance), 1575);
    checks.push("Fractional metre quantities remain exact integer ticks across transfers");

    await open("?material=rose&mode=consume&allocation=alloc-rose");
    await fill("quantity", 5);
    await reference();
    await submit();
    assert.deepEqual(await page.evaluate(() =>
    {
      const stock = mStock(mFind("rose"));
      return [stock.balance, stock.allocated, stock.available];
    }), [29, 7, 18]);
    await act("consume", '[data-allocation="alloc-rose"]');
    await fill("quantity", 50);
    assert.equal(await page.$eval("#material-quantity", (node) => node.value), "7");
    await reference();
    await submit();
    assert.equal(await page.evaluate(() => mAllocationRemaining(materialAllocations.find((entry) => entry.id === "alloc-rose"))), 0);
    assert.equal(await page.evaluate(() => materialLedger.filter((entry) => entry.type === "consume").reduce((sum, entry) => sum + entry.units, 0)), -12);
    assert.ok(await page.evaluate(() => validateMaterialMovement(
    {
      materialId: "rose", type: "consume", allocationId: "alloc-rose", batchId: "MWR-0411",
      quantity: 1, unit: "batang", reason: "Pemeriksaan contoh", reference: "DEMO-USE"
    }).length > 0));
    await capture("usage-completed", true);
    checks.push("Partial production use reduces physical stock and remaining allocation together; repeated use is capped and a finished allocation cannot be consumed again");

    await open("?material=wrap&mode=allocate");
    await fill("quantity", 5);
    await reference();
    await submit();
    assert.deepEqual(await page.evaluate(() =>
    {
      const stock = mStock(mFind("wrap"));
      return [stock.balance, stock.allocated, stock.available];
    }), [40, 8, 32]);
    const allocationId = await page.evaluate(() => materialAllocations.at(-1).id);
    await act("release", `[data-allocation="${allocationId}"]`);
    await page.click("#material-confirm-submit");
    assert.equal(await page.$eval("#material-confirm", (node) => node.open), true);
    await confirm("Produksi contoh dibatalkan sebelum pemakaian.");
    await page.waitForFunction(() => !materialSaving && !document.getElementById("material-confirm").open);
    assert.equal(await page.evaluate(() => mStock(mFind("wrap")).allocated), 3);
    assert.equal(await page.evaluate(() => mStock(mFind("wrap")).balance), 40);
    checks.push("Allocation reserves without consuming; release requires a reason and restores free stock without a ledger deduction");

    await open("?material=wrap&mode=adjustment");
    await fill("quantity", 25);
    await reference();
    await submit();
    assert.equal(await page.evaluate(() => mStock(mFind("wrap")).balance), 40);
    const requestId = await page.evaluate(() => materialApprovals.at(-1).id);
    await page.$eval(".product-preview-controls", (node) => node.open = true);
    await choose("profile", "superadmin");
    await act("workspace", '[data-workspace="approvals"]');
    await act("review", `[data-request="${requestId}"]`);
    await fill("reason", "Dokumen dan jumlah fisik sudah diverifikasi.");
    await capture("approval-review", true);
    await submit();
    assert.equal(await page.evaluate(() => mStock(mFind("wrap")).balance), 65);
    assert.equal(await page.evaluate((id) => materialLedger.filter((entry) => entry.requestId === id).length, requestId), 1);
    await act("review", '[data-request="approval-demo-01"]');
    await choose("decision", "reject");
    await fill("reason", "Dokumen contoh awal tidak sesuai pemeriksaan.");
    await submit();
    assert.equal(await page.evaluate(() => mStock(mFind("wrap")).balance), 65);
    checks.push("Admin adjustment over twenty waits without changing stock; SuperAdmin approval applies once and rejection leaves stock unchanged");

    await open("?material=rose&mode=edit");
    assert.equal(await page.$eval("#material-unit", (node) => node.disabled), true);
    assert.equal(await page.$eval("#material-batchTracked", (node) => node.disabled), true);
    await fill("code", "BH-TLP-PNK");
    await fill("reason", "Menguji duplikasi kode bahan.");
    await page.click("#material-save");
    assert.equal(await page.$eval("#material-code", (node) => node.getAttribute("aria-invalid")), "true");
    await act("back");
    await page.waitForFunction(() => document.getElementById("material-confirm").open);
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => materialState.mode), "edit");
    await fill("code", "BH-MWR-MRH");
    await fill("name", "Mawar merah segar");
    await page.click("#material-save");
    await page.waitForFunction(() => materialState.mode === "view");
    assert.equal(await page.evaluate(() => mStock(mFind("rose")).balance), 34);
    await act("toggle", '[data-id="rose"]');
    assert.match(await page.$eval("#material-feedback", (node) => node.textContent), /masih dialokasikan/);
    checks.push("Referenced units and batch settings are locked, duplicate codes are rejected, dirty navigation can be cancelled, edits preserve stock and active allocations block deactivation");

    await open("?mode=new&role=superadmin");
    await fill("name", "Kartu ucapan kraft");
    await fill("code", "BH-KRT-KRF");
    await choose("category", "cards");
    await fill("storage", "Simpan kering dan terlindung dari air.");
    await act("add-pack");
    await fill("pack-0-factor", 25);
    await page.click("#material-save");
    await page.waitForFunction(() => materialState.mode === "view");
    const newId = await page.evaluate(() => materialState.material);
    assert.equal(await page.evaluate((id) => mStock(mFind(id)).balance, newId), 0);
    await act("delete");
    await confirm("Bahan percobaan tanpa riwayat dihapus kembali.");
    await page.waitForFunction(() => !materialSaving && !materialState.material);
    assert.equal(await page.evaluate((id) => Boolean(mFind(id)), newId), false);
    checks.push("A complete new material supports contextual units and packaging, starts at zero and is deletable only without references by SuperAdmin");

    for (const width of [320, 390, 640, 768, 1024, 1280, 1440, 1920])
    {
      await page.setViewport({ width, height: 1000 });

      for (const [state, query] of
      [
        ["catalog", ""], ["batches", "?material=rose&tab=batches"],
        ["editor", "?material=rose&mode=edit"], ["receipt", "?material=ribbon&mode=receipt"],
        ["usage", "?workspace=usage"]
      ])
      {
        await open(query);
        const problems = await page.evaluate(() =>
        {
          return [...document.querySelectorAll("main input, main button, main select, main textarea")].filter((node) =>
          {
            const box = node.getBoundingClientRect();
            return box.width && !node.closest(".product-workspaces, .product-detail-tabs, .material-form-nav")
              && (box.left < -1 || box.right > innerWidth + 1);
          }).map((node) => node.id || node.textContent);
        });
        assert.deepEqual(problems, [], `${state} fits ${width}`);

        if ([390, 768, 1440, 1920].includes(width))
        {
          await capture(`${state}-${width}`, true);
        }
      }
    }
    checks.push("Catalog, batch table, editor, receipt and production-use controls fit 320–1920px across eight viewport widths");

    await page.setViewport({ width: 390, height: 1000 });
    await open("?material=rose&mode=edit");
    await page.click('.material-form-nav a[href="#material-section-storage"]');
    await new Promise((resolve) => setTimeout(resolve, 200));
    assert.ok(await page.$eval(".material-form-nav", (node) => node.getBoundingClientRect().top <= 5));
    await page.screenshot({ path: path.join(directory, "editor-sticky-mobile.png") });
    await open();
    await page.click("#mobile-open");
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.activeElement.id), "mobile-open");
    checks.push("Sticky form navigation remains available and the mobile drawer closes with Escape and returns focus");

    await open("?state=empty");
    assert.equal(await page.evaluate(() => productionMaterials.length + materialLedger.length + materialAllocations.length + materialApprovals.length), 0);
    assert.match(await page.$eval("#material-rows", (node) => node.textContent), /Belum ada bahan produksi/);
    await capture("empty-mobile", true);
    await open("?state=error");
    await capture("error-mobile", true);
    await act("retry");
    assert.equal(await page.evaluate(() => materialLoadState), "full");
    await open("?state=loading");
    assert.equal(await page.$$eval(".skeleton-row", (nodes) => nodes.length), 4);
    await act("retry");
    await open("?material=unknown");
    assert.match(await page.$eval("#material-view", (node) => node.textContent), /Bahan tidak ditemukan/);
    await act("list");
    checks.push("Loading, retryable error, honest empty inventory, and missing deep-link recovery have usable next actions");
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(directory, "verification.json"), JSON.stringify({ passed: true, checks, errors }, null, 2));
    console.log(JSON.stringify({ passed: true, checks, errors }, null, 2));
  }
  catch (error)
  {
    if (page)
    {
      await page.screenshot({ path: path.join(directory, "test-failure.png"), fullPage: true });
      console.error(await page.evaluate(() =>
      {
        return {
          state: materialState,
          draft: materialDraft,
          error: document.getElementById("material-errors")?.textContent,
          consoleErrors: []
        };
      }));
    }
    throw error;
  }
  finally
  {
    await browser.close();
  }
}

verifyMaterials().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
