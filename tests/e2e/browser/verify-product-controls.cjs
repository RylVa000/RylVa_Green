const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const puppeteer = require("../../../tools/testing/browser-runtime.cjs");

async function verifyProductControls()
{
  const directory = path.resolve(".impeccable/review/product-controls");
  fs.mkdirSync(directory, { recursive: true });
  const browser = await puppeteer.launch(
  {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });
  const checks = [];
  const errors = [];

  try
  {
    const page = await browser.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("dialog", (dialog) => dialog.accept());
    const pageUrl = pathToFileURL(path.resolve("public/pages/staff/products.html")).href;
    await page.setViewport({ width: 1440, height: 1000 });

    async function open(query = "")
    {
      await page.goto(pageUrl + query, { waitUntil: "networkidle0" });
      await page.evaluate(() => document.fonts.ready);
    }

    async function fill(id, value)
    {
      await page.$eval(id, (node, nextValue) =>
      {
        node.value = String(nextValue);
        node.dispatchEvent(new Event("input", { bubbles: true }));
      }, value);
    }

    async function choose(id, value)
    {
      await page.select(id, value);
    }

    async function selectAll()
    {
      await page.keyboard.down("Control");
      await page.keyboard.press("a");
      await page.keyboard.up("Control");
    }

    async function capture(name, reset = false)
    {
      if (reset)
      {
        await page.evaluate(() =>
        {
          document.activeElement?.blur();
          window.scrollTo(0, 0);
        });
      }

      await page.screenshot({ path: path.join(directory, `${name}.png`) });

      if (reset)
      {
        await page.screenshot({ path: path.join(directory, `${name}-full.png`), fullPage: true });
      }
    }

    async function stock(variant)
    {
      await open("?role=superadmin");
      await page.evaluate((id) =>
      {
        productTask = { kind: "movement", title: "Catat mutasi stok", variant: id };
        renderCatalog();
      }, variant);
    }

    await stock("v1");
    const combo = "#product-task-variant-combobox";
    await page.click(combo);
    await selectAll();
    await page.type(combo, "RG-MED 1L");
    assert.equal(await page.$$eval('.admin-combobox-popup:not([hidden]) [role="option"]', (nodes) => nodes.length), 1);
    await capture("sku-search-desktop");
    await page.keyboard.press("Enter");
    assert.equal(await page.$eval("#product-task-variant", (node) => node.value), "v6");
    await page.waitForFunction(() => document.activeElement.id === "product-task-variant-combobox");
    await selectAll();
    await page.type(combo, "tidak ada hasil xyz");
    assert.equal(await page.$$eval('.admin-combobox-popup:not([hidden]) [role="option"]', (nodes) => nodes.length), 0);
    await capture("sku-empty-search");
    await page.keyboard.press("Escape");
    assert.match(await page.$eval(combo, (node) => node.value), /RG-MED-1L/);
    await page.type(combo, "cari tidak dipilih");
    await page.keyboard.press("Tab");
    assert.match(await page.$eval(combo, (node) => node.value), /RG-MED-1L/);
    checks.push("Search SKU with multiple words, keyboard selection, empty result, Escape and Tab preserve valid selection");

    await fill("#product-task-quantity", -4);
    assert.equal(await page.$eval("#product-task-quantity", (node) => node.value), "1");
    assert.match(await page.$eval("#stock-change-preview", (node) => node.textContent), /Saldo 32 menjadi 33/);
    await page.focus("#product-task-quantity");
    await page.keyboard.press("-");
    assert.equal(await page.$eval("#product-task-quantity", (node) => node.value), "1");
    await choose("#product-task-type", "transfer");
    await fill("#product-task-quantity", 999);
    assert.equal(await page.$eval("#product-task-quantity", (node) => node.value), "32");
    await page.focus("#product-task-quantity");
    await page.keyboard.press("ArrowUp");
    assert.equal(await page.$eval("#product-task-quantity", (node) => node.value), "32");
    await capture("transfer-at-stock-limit", true);
    checks.push("Receipt accepts positive integers; transfer clamps immediately to free stock and spinner cannot exceed the maximum");

    await choose("#product-task-variant", "v3");
    assert.equal(await page.$eval("#product-task-quantity", (node) => node.disabled), true);
    assert.equal(await page.$eval("#save-movement", (node) => node.disabled), true);
    assert.equal(await page.$eval("#stock-change-preview", (node) => node.textContent), "");
    await capture("empty-stock-reduction", true);
    await choose("#product-task-variant", "v1");
    assert.equal(await page.$eval("#product-task-quantity", (node) => node.max), "16");
    await fill("#product-task-quantity", 18);
    assert.equal(await page.$eval("#product-task-quantity", (node) => node.value), "16");
    await choose("#product-task-type", "adjustment");
    await fill("#product-task-quantity", -19);
    assert.equal(await page.$eval("#product-task-quantity", (node) => node.value), "-16");
    assert.match(await page.$eval("#stock-change-preview", (node) => node.textContent), /Saldo 18 menjadi 2.*tersedia setelah perubahan 0/);
    await page.keyboard.press("ArrowDown");
    assert.equal(await page.$eval("#product-task-quantity", (node) => node.value), "-16");
    await capture("adjustment-reservation-limit", true);
    assert.ok(await page.evaluate(() => validateCatalogMovement(
    {
      variant: "v1", type: "receipt", quantity: -4, reason: "Alasan contoh", reference: "DOC-01"
    }).some((error) => error.field === "task-quantity")));
    assert.ok(await page.evaluate(() => validateCatalogMovement(
    {
      variant: "v1", type: "adjustment", quantity: -19, reason: "Alasan contoh", reference: "DOC-02"
    }).some((error) => error.field === "task-quantity")));
    checks.push("Empty stock blocks reductions; active reservations set the exact lower bound; submission validation independently rejects invalid data");

    await open("?product=tulip&mode=edit&role=superadmin");
    await page.click('[data-action="add-variant"]');
    const newId = await page.evaluate(() => productDraft.variants.at(-1).id);
    assert.deepEqual(await page.$eval(`#product-${newId}-unit`, (node) => [...node.options].map((option) => option.value)), ["buket", "batang", "pcs"]);
    assert.equal(await page.$eval(`#product-${newId}-unit`, (node) => node.value), "buket");
    assert.equal(await page.$$eval("#edit-variants > details[open]", (nodes) => nodes.length), 1);
    await fill(`#product-${newId}-name`, "Rangkaian sedang");
    await fill(`#product-${newId}-sku`, "RG-TUL-M");
    assert.match(await page.$eval(`#variant-editor-${newId} > summary`, (node) => node.textContent), /Rangkaian sedang, RG-TUL-M/);
    await page.click("#variant-editor-v8 > summary");
    await page.waitForFunction(() => document.querySelectorAll("#edit-variants > details[open]").length === 1);
    await page.click('[data-action="add-variant"]');
    await page.waitForFunction(() => document.querySelectorAll("#edit-variants > details[open]").length === 1);
    await capture("new-flower-variant");
    checks.push("Flower units exclude volume and weight; adding a variant opens only the new editor; summaries follow current name and SKU");

    await page.click('[data-editor-section="categories"]');
    await fill("#product-category-search", "florist");
    assert.equal(await page.$$eval("#product-categories label:not([hidden])", (nodes) => nodes.length), 1);
    await page.click("#product-primaryCategory-combobox");
    await page.keyboard.press("Escape");
    await fill("#product-category-search", "");
    await page.click('[data-editor-section="shipping"]');
    await new Promise((resolve) => setTimeout(resolve, 200));
    const sticky = await page.evaluate(() =>
    {
      const nav = document.querySelector(".product-editor-nav").getBoundingClientRect();
      const section = document.getElementById("edit-shipping").getBoundingClientRect();
      return { navTop: nav.top, navBottom: nav.bottom, sectionTop: section.top };
    });
    assert.ok(Math.abs(sticky.navTop) <= 1, JSON.stringify(sticky));
    assert.ok(sticky.sectionTop >= sticky.navBottom - 1, JSON.stringify(sticky));
    assert.equal(await page.evaluate(() => productDraft.variants.some((variant) => variant.sku === "RG-TUL-M")), true);
    await capture("editor-sticky-desktop");
    assert.match(await page.$eval("#product-breadcrumb", (node) => node.textContent), /Ruang kerja.*Produk & Varian.*Edit produk/);
    await page.click("#product-breadcrumb a[href*='products.html']");
    await page.waitForFunction(() => document.getElementById("product-confirm").open);
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => catalogState.mode), "edit");
    await page.click("#product-breadcrumb a[href*='products.html']");
    await page.click("#product-confirm-submit");
    await page.waitForFunction(() => catalogState.mode === "view" && !catalogState.product);
    assert.match(page.url(), /role=superadmin/);
    checks.push("Categories can be searched; editor navigation stays sticky without losing draft; contextual breadcrumb navigates and protects unsaved edits");

    assert.equal(await page.$eval("#next-product-page", (node) => node.classList.contains("icon-button")), true);
    await page.click("#next-product-page");
    assert.equal(await page.$eval("#product-page-number", (node) => node.textContent), "2 dari 2");
    await open("?product=ficus&tab=stock");
    const gap = await page.$eval(".product-note + .product-note", (node) =>
    {
      return node.getBoundingClientRect().top - node.previousElementSibling.getBoundingClientRect().bottom;
    });
    assert.ok(gap >= 12, `Reservation note gap ${gap}`);
    await capture("reservations-separated", true);
    checks.push("Pagination uses queue arrow buttons and matching page labels; reservation notices have a visible 12px gap");

    for (const width of [320, 390, 640, 768, 1024, 1440, 1920])
    {
      await page.setViewport({ width, height: 1000 });
      await stock("v1");
      await page.click(combo);
      await selectAll();
      await page.type(combo, "media");
      const bounds = await page.$eval(".admin-combobox-popup:not([hidden])", (node) =>
      {
        const box = node.getBoundingClientRect();
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: innerWidth, height: innerHeight };
      });
      assert.ok(bounds.left >= 0 && bounds.right <= bounds.width + 1 && bounds.top >= 0 && bounds.bottom <= bounds.height + 1, JSON.stringify(bounds));
      await capture(`search-${width}`);
      await page.keyboard.press("Escape");
      await open("?product=ficus&mode=edit");
      await page.click('[data-editor-section="variants"]');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await capture(`sticky-editor-${width}`);
    }

    checks.push("Search popups stay within the viewport and sticky editor navigation fits at 320, 390, 640, 768, 1024, 1440 and 1920 pixels");
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(directory, "verification.json"), JSON.stringify({ checks, errors }, null, 2));
    console.log(JSON.stringify({ checks, errors }, null, 2));
  }
  finally
  {
    await browser.close();
  }
}

verifyProductControls().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
