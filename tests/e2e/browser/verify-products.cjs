const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

async function verifyProducts()
{
  const directory = path.resolve(".impeccable/review/products");
  fs.mkdirSync(directory, { recursive: true });
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const checks = [];
  const browserErrors = [];
  const boundsChecks = [];

  try
  {
    const page = await browser.newPage();
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("dialog", (dialog) => dialog.accept());
    const pageUrl = pathToFileURL(path.resolve("public/pages/staff/products.html")).href;
    await page.setViewport({ width: 1440, height: 1000 });

    async function open(query = "")
    {
      await page.goto(pageUrl + query, { waitUntil: "networkidle0" });
      await page.evaluate(() => document.fonts.ready);
    }

    async function capture(name)
    {
      await page.evaluate(() =>
      {
        document.activeElement?.blur();
        window.scrollTo(0, 0);
      });
      await page.screenshot({ path: path.join(directory, `${name}-fold.png`) });
      await page.screenshot({ path: path.join(directory, `${name}.png`), fullPage: true });
    }

    async function fill(name, value)
    {
      const selector = `#product-${name}`;
      const input = await page.$(selector);
      assert.ok(input, `Field ${name} exists`);
      const type = await input.evaluate((node) => node.type);

      if (type === "select-one")
      {
        await page.select(selector, value);
      }
      else
      {
        await input.evaluate((node, nextValue) =>
        {
          node.value = nextValue;
          node.dispatchEvent(new Event("input", { bubbles: true }));
        }, String(value));
      }
    }

    async function act(action, extra = "", root = "#queue-main")
    {
      const controls = await page.$$(`${root} [data-action="${action}"]${extra}`);

      for (const control of controls)
      {
        if (await control.isVisible())
        {
          await control.click();
          return;
        }
      }

      throw new Error(`Visible action ${action}${extra} not found`);
    }

    async function confirm()
    {
      await page.waitForFunction(() => document.getElementById("product-confirm").open);
      await page.click("#product-confirm-submit");
    }

    async function submitStock()
    {
      await page.click("#save-movement");
      await confirm();
      await page.waitForFunction(() =>
      {
        const error = document.querySelector("#product-stock-form .product-error-summary");
        return !productSaving && (!productTask
          || (error && !error.hidden && error.textContent.includes("Perubahan belum disimpan")));
      });
    }

    async function fillStock(quantity, type = "receipt")
    {
      await fill("task-type", type);
      await fill("task-quantity", quantity);
      await fill("task-reference", "DEMO-PENERIMAAN-04");
      await fill("task-reason", "Jumlah fisik dan dokumen contoh telah diperiksa.");
    }

    async function profile(role)
    {
      await page.$eval(".product-preview-controls", (node) => node.open = true);
      await page.select("#product-profile", role);
    }

    async function verifyBounds(name)
    {
      const problems = await page.evaluate(() =>
      {
        return [...document.querySelectorAll("main button, main input, main select, main textarea, main .work-signal")]
          .filter((node) =>
          {
            const bounds = node.getBoundingClientRect();
            const scrollingTabs = node.closest(".product-workspaces, .product-detail-tabs, .product-editor-nav");
            return bounds.width > 0 && !scrollingTabs && (bounds.left < -1 || bounds.right > innerWidth + 1);
          })
          .map((node) => ({ tag: node.tagName, text: node.textContent.slice(0, 70), id: node.id }));
      });
      boundsChecks.push({ name, problems });
      assert.deepEqual(problems, [], `Visible controls fit: ${name}`);
    }

    await open();
    assert.equal(await page.$eval("#active-product-count", (node) => node.textContent), "6");
    assert.equal(await page.$eval("#active-variant-count", (node) => node.textContent), "11");
    assert.equal(await page.$eval("#low-stock-count", (node) => node.textContent), "5");
    assert.equal(await page.$eval("#empty-stock-count", (node) => node.textContent), "1");
    await page.type("#product-search", "RG-FIC-M16");
    assert.equal(await page.$$eval(".product-row", (nodes) => nodes.length), 1);
    await act("toggle-variants", '[data-id="ficus"]');
    assert.match(await page.$eval("#variants-ficus", (node) => node.textContent), /3 pot tersisa/);
    assert.match(page.url(), /q=RG-FIC-M16/);
    await act("reset-filters");
    await page.click("#next-product-page");
    assert.match(page.url(), /page=2/);
    checks.push("Computed counts, SKU search, expandable variants and URL pagination agree");

    await open("?product=ficus&tab=stock");
    await act("stock-movement", '[data-variant="v1"]');
    await fillStock(5);
    await page.$eval(".product-preview-controls", (node) => node.open = true);
    await page.click("#product-fail-save");
    await submitStock();
    assert.equal(await page.$eval("#product-task-quantity", (node) => node.value), "5");
    assert.equal(await page.evaluate(() => catalogStock(findCatalogVariant("v1").variant).balance), 18);
    await capture("movement-recovery");
    await submitStock();
    await page.waitForFunction(() => !productTask);
    assert.equal(await page.evaluate(() => catalogStock(findCatalogVariant("v1").variant).balance), 23);
    assert.equal(await page.evaluate(() => catalogLedger.filter((entry) => entry.type === "Barang masuk").length), 1);
    checks.push("A failed receipt preserves fields and changes no stock; retry appends exactly one ledger entry");

    await act("stock-movement", '[data-variant="v1"]');
    await fillStock(-100, "adjustment");
    assert.equal(await page.$eval("#product-task-quantity", (node) => node.value), "-21");
    assert.match(await page.$eval("#stock-change-preview", (node) => node.textContent), /Pengajuan -21 pot; saldo tetap 23/);
    await fillStock(3, "transfer");
    await fill("task-destination", "toko");
    await capture("transfer-desktop");
    await submitStock();
    await page.waitForFunction(() => !productTask);
    const transferred = await page.evaluate(() =>
    {
      const variant = findCatalogVariant("v1").variant;
      return [catalogStock(variant, "pusat").balance, catalogStock(variant, "toko").balance];
    });
    assert.deepEqual(transferred, [20, 7]);
    checks.push("Negative stock and consumption of reserved units are blocked; transfer preserves total inventory");

    await act("stock-movement", '[data-variant="v2"]');
    await fillStock(25, "adjustment");
    await submitStock();
    await page.waitForFunction(() => !productTask);
    assert.equal(await page.evaluate(() => catalogStock(findCatalogVariant("v2").variant).balance), 6);
    assert.equal(await page.$eval("#approval-count", (node) => node.textContent), "2");
    assert.equal(await page.$$eval('#approval-list [data-action="review-adjustment"]', (nodes) => nodes.length), 0);
    await capture("approval-admin");
    await profile("superadmin");
    await act("review-adjustment");
    await fill("task-reason", "Dokumen dan hitung fisik telah diverifikasi ulang.");
    await page.click("#save-adjustment-decision");
    await confirm();
    await page.waitForFunction(() => !productTask);
    assert.equal(await page.evaluate(() => catalogStock(findCatalogVariant("v2").variant).balance), 31);
    await act("review-adjustment");
    await fill("task-decision", "reject");
    await fill("task-reason", "Pengajuan awal sudah tidak sesuai dengan pemeriksaan terbaru.");
    await page.click("#save-adjustment-decision");
    await confirm();
    await page.waitForFunction(() => !productTask);
    assert.equal(await page.evaluate(() => catalogStock(findCatalogVariant("v2").variant).balance), 31);
    checks.push("Admin adjustment over 20 waits; SuperAdmin approval applies it once and rejection leaves stock unchanged");

    await open("?product=ficus&mode=edit");
    await fill("v1-price", 250000);
    await fill("editReason", "Perubahan harga pemasok untuk data contoh.");
    await page.click("#save-product");
    await page.waitForFunction(() => document.getElementById("product-confirm").open);
    await capture("price-guard-desktop");
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => findCatalogVariant("v1").variant.price), 95000);
    assert.equal(await page.$eval("#product-v1-price", (node) => node.value), "250000");
    await page.click("#save-product");
    await confirm();
    await page.waitForFunction(() => catalogState.mode === "view");
    assert.equal(await page.evaluate(() => findCatalogVariant("v1").variant.price), 250000);
    assert.equal(await page.evaluate(() => catalogReservations.find((entry) => entry.variantId === "v1").unitPrice), 95000);
    assert.equal(await page.evaluate(() => catalogNotices.length), 1);
    checks.push("Large price changes need confirmation; cancellation preserves draft and existing order snapshots stay immutable");

    await act("toggle-product", '[data-id="ficus"]');
    await confirm();
    await page.waitForFunction(() => findCatalogProduct("ficus").status === "inactive");
    assert.equal(await page.evaluate(() => catalogReservations.filter((entry) => entry.variantId === "v1").length), 1);
    await profile("superadmin");
    assert.equal(await page.$eval('[data-action="delete-product"]', (node) => node.disabled), true);
    assert.match(await page.$eval("#product-detail-view", (node) => node.textContent), /Perubahan harga besar/);
    checks.push("Deactivation preserves reservations and prior transactions prevent permanent deletion");

    await open("?product=ficus&mode=edit");
    assert.equal(await page.$eval("#product-v1-batchTracked", (node) => node.disabled), true);
    await fill("v1-salePrice", 10000);
    await fill("v1-saleStart", "2027-01-01");
    await fill("v1-saleEnd", "2027-01-31");
    await fill("editReason", "Menjadwalkan harga diskon besar pada periode mendatang.");
    await page.click("#save-product");
    await page.waitForFunction(() => document.getElementById("product-confirm").open);
    assert.match(await page.$eval("#product-confirm-copy", (node) => node.textContent), /2027-01-01/);
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => findCatalogVariant("v1").variant.salePrice), 0);
    checks.push("Scheduled deep discounts also trigger the price guard; an existing unbatched balance cannot silently become batch tracked");

    await open("?product=ficus&mode=edit");
    await fill("v1-sku", "RG-SUK-M08");
    await fill("editReason", "Pemeriksaan validasi SKU duplikat.");
    await page.click("#save-product");
    assert.equal(await page.$eval("#product-v1-sku", (node) => node.getAttribute("aria-invalid")), "true");
    await fill("v1-sku", "RG-FIC-S12");
    await act("remove-photo", '[data-index="0"]');
    await page.click("#save-product");
    assert.match(await page.$eval("#product-editor-errors", (node) => node.textContent), /1–8 foto/);
    await act("cancel-editor");
    await page.waitForFunction(() => document.getElementById("product-confirm").open);
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => Boolean(productDraft)), true);
    checks.push("Duplicate SKU and missing photo validation target fields; leaving unsaved work can be cancelled");

    await open("?product=ficus&mode=edit");
    await page.$eval("#edit-variants > details", (node) => node.open = true);
    await fill("option-0-name", "Ukuran");
    await fill("option-0-values", "S, M");
    await fill("option-1-name", "Warna");
    await fill("option-1-values", "Putih, Mint");
    await act("generate-variants");
    assert.equal(await page.evaluate(() => productDraft.variants.length), 7);
    assert.equal(await page.evaluate(() => productDraft.variants[0].sku), "RG-FIC-S12");
    checks.push("Attribute choices generate independent combinations without deleting existing SKU history");

    await open("?mode=new&role=superadmin");
    const variantId = await page.evaluate(() => productDraft.variants[0].id);
    await fill("name", "Produk contoh baru");
    await page.$eval("#product-category-plants", (node) => node.scrollIntoView({ block: "center" }));
    await page.click("#product-category-plants");
    await fill(`${variantId}-sku`, "DEMO-NEW-01");
    await fill(`${variantId}-price`, 75000);
    await fill(`${variantId}-weight`, 600);
    await fill(`${variantId}-length`, 20);
    await fill(`${variantId}-width`, 20);
    await fill(`${variantId}-height`, 30);
    const upload = await page.$("#product-photo-files");
    await upload.uploadFile(path.resolve("public/assets/images/products/plant.jpg"));
    await page.waitForFunction(() => productDraft.photos.length === 1);
    await fill("status", "active");
    await page.click("#save-product");
    await page.waitForFunction(() => catalogState.mode === "view").catch(async (error) =>
    {
      console.error(await page.evaluate(() =>
      {
        return {
          draft: productDraft,
          errors: document.getElementById("product-editor-errors").textContent,
          confirmation: document.getElementById("product-confirm").open
        };
      }));
      throw error;
    });
    assert.equal(await page.evaluate(() => catalogProducts.length), 9);
    assert.equal(await page.evaluate(() => catalogStock(findCatalogProduct().variants[0]).available), 0);
    const newProductId = await page.evaluate(() => catalogState.product);

    async function setKitComponent(componentId)
    {
      await act("back-catalog");
      await fill("search", "RG-KIT");
      await act("open-product", '[data-id="kit"]');
      await act("edit-product", '[data-id="kit"]');
      await fill("v14-component-0", componentId);
      await fill("editReason", "Mengubah komponen paket pada data pratinjau.");
      await page.click("#save-product");
      await page.waitForFunction(() => catalogState.mode === "view");
      await act("back-catalog");
      await fill("search", "DEMO-NEW-01");
      await act("open-product", `[data-id="${newProductId}"]`);
    }

    await setKitComponent(variantId);
    assert.equal(await page.$eval('[data-action="delete-product"]', (node) => node.disabled), true);
    await setKitComponent("v4");
    await act("delete-product");
    await confirm();
    await page.waitForFunction(() => catalogProducts.length === 8);
    checks.push("A complete new product with an uploaded photo starts at zero stock and may be deleted only without history");
    checks.push("A bundle reference prevents deletion of a zero-stock component until the package points to another SKU");

    await open("?mode=new");
    const pendingVariantId = await page.evaluate(() => productDraft.variants[0].id);
    await fill("name", "Produk pengajuan contoh");
    await page.$eval("#product-category-plants", (node) => node.scrollIntoView({ block: "center" }));
    await page.click("#product-category-plants");
    await fill(`${pendingVariantId}-sku`, "DEMO-PENDING-01");
    await fill(`${pendingVariantId}-price`, 20000);
    await fill(`${pendingVariantId}-weight`, 100);
    await fill(`${pendingVariantId}-length`, 10);
    await fill(`${pendingVariantId}-width`, 10);
    await fill(`${pendingVariantId}-height`, 10);
    await act("example-photo");
    await page.click("#save-product");
    await page.waitForFunction(() => catalogState.mode === "view");
    await act("detail-tab", '[data-tab="stock"]');
    await act("stock-movement", `[data-variant="${pendingVariantId}"]`);
    await fillStock(25, "adjustment");
    await submitStock();
    await profile("superadmin");
    await page.click('[data-workspace="catalog"]');
    await fill("search", "DEMO-PENDING-01");
    await act("open-product");
    assert.equal(await page.$eval('[data-action="delete-product"]', (node) => node.disabled), true);
    assert.match(await page.$eval("#delete-product-help", (node) => node.textContent), /pengajuan stok/);
    await act("edit-product");
    assert.equal(await page.$eval('[data-action="remove-variant"]', (node) => node.disabled), true);
    checks.push("A pending stock approval protects a newly created zero-stock product and its SKU from deletion");

    await open("?product=seeds&tab=stock");
    await act("stock-movement", '[data-variant="v13"]');
    await fillStock(5);
    await fill("task-batch", "BT-NEW-04");
    await fill("task-expires", "2026-11-01");
    await page.click("#save-movement");
    assert.equal(await page.$eval("#product-task-expires", (node) => node.getAttribute("aria-invalid")), "true");
    await fill("task-expires", "2028-01-01");
    await submitStock();
    await page.waitForFunction(() => !productTask);
    await act("stock-movement", '[data-variant="v13"]');
    await fillStock(3, "transfer");
    await fill("task-batch", "BT-NEW-04");
    await submitStock();
    await page.waitForFunction(() => !productTask);
    const batches = await page.evaluate(() => findCatalogVariant("v13").variant.batches.filter((batch) => batch.id === "BT-NEW-04"));
    assert.deepEqual(batches.map((batch) => batch.quantity), [2, 3]);
    assert.ok(batches.every((batch) => batch.expires === "2028-01-01"));
    checks.push("Batch receipt validates expiry and transfer preserves lot quantities and expiry across locations");

    await open("?product=kit&tab=stock");
    assert.equal(await page.evaluate(() => catalogStock(findCatalogVariant("v14").variant).available), 23);
    await page.select("#detail-stock-location", "toko");
    assert.equal(await page.evaluate(() => catalogStock(findCatalogVariant("v14").variant).available), 5);
    assert.match(await page.$eval("#product-detail-content", (node) => node.textContent), /komponen paling terbatas/);
    checks.push("A component-stock bundle follows its limiting component and the selected location");

    await open();
    await act("manage-categories");
    await act("add-category");
    await fill("category-name-8", "Aksesori tanaman");
    await page.click('#product-category-form [type="submit"]');
    await page.waitForFunction(() => !productTask);
    assert.equal(await page.$$eval("#category-filter option", (nodes) => nodes.length), 10);
    checks.push("Category changes save together and update catalog filters while used categories remain protected");

    await open("?location=toko");
    await page.click('[data-summary="low"]');
    assert.match(page.url(), /status=active/);
    assert.equal(await page.evaluate(() => catalogFilteredProducts().every((product) => product.status === "active")), true);
    checks.push("Summary stock filters retain the active-product scope at a second location");

    await open("?state=error");
    assert.equal(await page.$eval("#catalog-error", (node) => node.hidden), false);
    await capture("catalog-error");
    await act("retry-load");
    await page.waitForFunction(() => catalogLoadState === "full");
    await open("?state=empty");
    assert.equal(await page.$eval("#catalog-empty", (node) => node.hidden), false);
    await open("?product=not-found");
    assert.match(await page.$eval("#product-feedback", (node) => node.textContent), /tidak ditemukan/);
    checks.push("Load error retries, empty state has a next action, and missing product links recover to the catalog");

    for (const width of [320, 390, 768, 1024, 1280, 1440, 1920])
    {
      await page.setViewport({ width, height: 1000 });
      await open();
      await verifyBounds(`catalog-${width}`);
      await act("toggle-variants", '[data-id="ficus"]');
      await verifyBounds(`variants-${width}`);

      if (width >= 768)
      {
        assert.equal(await page.$eval("#variants-ficus .variant-table thead", (node) => getComputedStyle(node).display === "none"), false);
      }

      if ([320, 390, 768, 1024, 1280, 1440].includes(width))
      {
        await capture(`variants-${width}`);
      }

      await open("?product=ficus&mode=edit");
      await verifyBounds(`editor-${width}`);

      if ([390, 1440].includes(width))
      {
        await capture(`editor-${width}`);
      }

      await open("?product=ficus&tab=stock");
      await act("stock-movement", '[data-variant="v2"]');
      await verifyBounds(`movement-${width}`);

      if ([390, 1440].includes(width))
      {
        await capture(`movement-${width}`);
      }
    }

    checks.push("Catalog, SKU disclosure, editor and inventory controls fit 320–1920px without clipping");
    await page.setViewport({ width: 390, height: 1000 });
    await open();
    await page.click("#mobile-open");
    await page.keyboard.press("Escape");
    assert.equal(await page.$eval("#mobile-open", (node) => node.getAttribute("aria-expanded")), "false");
    assert.equal(await page.evaluate(() => document.activeElement.id), "mobile-open");
    checks.push("Mobile navigation closes with Escape and returns keyboard focus");
    assert.deepEqual(browserErrors, []);
    const report = { passed: true, checks, browserErrors, boundsChecks };
    fs.writeFileSync(path.join(directory, "verification.json"), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ passed: true, checks, browserErrors }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyProducts().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
