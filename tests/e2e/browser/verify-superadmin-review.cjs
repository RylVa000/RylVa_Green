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
  const origin = "http://127.0.0.1:4178";
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) =>
  {
    if (request.url().startsWith(origin) && ["script", "stylesheet", "font"].includes(request.resourceType()))
    {
      errors.push(request.url());
    }
  });

  function assert(condition, message)
  {
    if (!condition)
    {
      throw new Error(message);
    }
  }

  async function open(file, query = "", role = "superadmin")
  {
    await page.goto(`${origin}/${file}.html?role=${role}${query}`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
  }

  async function fill(name, content)
  {
    await page.$eval(`#support-form [name="${name}"]`, (element, text) =>
    {
      element.value = text;
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }, content);
  }

  async function confirmFields(reason = "Pemeriksaan transaksi contoh")
  {
    await fill("reason", reason);
    await fill("mfa", "123456");
    await page.$eval('[name="acknowledgement"]', (element) =>
    {
      element.checked = true;
      element.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  async function submit()
  {
    await page.$eval("#support-form", (form) => form.requestSubmit());
  }

  async function toggle(id, checked)
  {
    await page.$eval(`#${id}`, (element, content) =>
    {
      element.checked = content;
    }, checked);
  }

  async function data()
  {
    return page.evaluate(() => window.superadminReview.snapshot());
  }

  async function runCheck(id)
  {
    await open("payment-reconciliation", `&item=${id}`);
    await page.click('[data-hub-action="gateway-check"]');
    await confirmFields();
    await submit();
  }

  try
  {
    const routes =
    [
      ["payment-reconciliation", "", "reconciliation", "superadmin"],
      ["sensitive-approvals", "", "approvals", "superadmin"],
      ...["overview", "comparison", "evidence", "activity"].map((tab) =>
        ["payment-reconciliation", `&item=REC-003&tab=${tab}`, `reconciliation-${tab}`, "superadmin"]),
      ...["overview", "impact", "evidence", "activity"].map((tab) =>
        ["sensitive-approvals", `&item=APR-001&tab=${tab}`, `approval-${tab}`, "superadmin"]),
      ["payment-reconciliation", "&item=REC-004", "awaiting", "superadmin"],
      ["sensitive-approvals", "&item=APR-003", "stock-blocked", "superadmin"],
      ["payment-reconciliation", "", "denied-reconciliation", "admin"],
      ["sensitive-approvals", "", "denied-approvals", "admin"]
    ];
    for (const width of [320, 390, 768, 1440, 1920])
    {
      await page.setViewport({ width, height: 900 });
      for (const [file, query, name, role] of routes)
      {
        await open(file, query, role);
        const layout = await page.evaluate(() =>
        {
          const title = document.querySelector("h1");
          const cards = [...document.querySelectorAll(".review-stats .catalog-stat")];
          return {
            heading: title.textContent,
            overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            lines: title.getBoundingClientRect().height / parseFloat(getComputedStyle(title).lineHeight),
            heights: cards.map((card) => card.getBoundingClientRect().height),
            active: document.querySelectorAll('#sidebar-nav [aria-current="page"]').length
          };
        });
        assert(!layout.overflow && layout.lines <= 2.1, `Layout ${name} ${width}: ${JSON.stringify(layout)}`);
        assert(layout.active === (role === "admin" ? 0 : 1), `Menu aktif ${name} tidak sesuai.`);
        if (layout.heights.length)
        {
          assert(Math.max(...layout.heights) - Math.min(...layout.heights) < 1, `Kartu ${name} ${width} tidak sama tinggi.`);
        }
        if (role === "admin")
        {
          assert(await page.$(".review-table") === null && await page.$(".review-stats") === null, "Data sensitif terlihat oleh Admin.");
        }
        if (width < 1200 && name === "reconciliation-comparison")
        {
          const comparison = await page.$eval(".review-detail-table tbody tr", (row) =>
          {
            const system = row.cells[1];
            const gateway = row.cells[2];
            return {
              labelVisible: getComputedStyle(gateway, "::before").display !== "none",
              aligned: Math.abs(system.getBoundingClientRect().top - gateway.getBoundingClientRect().top) < 1
            };
          });
          assert(comparison.labelVisible && comparison.aligned, `Sumber perbandingan tidak jelas pada ${width}px.`);
        }
        if ([390, 1440].includes(width) && ["reconciliation", "approvals", "reconciliation-comparison", "approval-impact", "awaiting", "stock-blocked"].includes(name))
        {
          await page.screenshot({ path: `storage/reports/hallmark/screenshots/review-${name}-${width}.png`, fullPage: true });
        }
      }
    }
    await page.setViewport({ width: 1440, height: 900 });
    await open("payment-reconciliation", "&item=REC-001");
    const initial = await data();
    for (const request of initial.requests.filter((item) => item.type === "reconciliation"))
    {
      const item = initial.cases.find((candidate) => candidate.id === request.caseId);
      assert(request.orderId === item.orderId && request.amount === item.amount, "Pengajuan dan kasus terkait berbeda.");
    }
    assert(await page.$eval('[data-hub-action="manual-proposal"]', (element) => element.disabled), "Manual aktif sebelum API gagal.");
    await page.click('[data-hub-action="gateway-check"]');
    await confirmFields();
    await fill("reference", "SALAH");
    await submit();
    assert((await page.$eval(".support-errors", (element) => element.textContent)).includes("Referensi"), "Referensi salah lolos.");
    await fill("reference", "DEMO-GW-1001");
    await toggle("support-fail", true);
    await submit();
    assert((await data()).cases.find((item) => item.id === "REC-001").status === "review", "Gagal simpan tetap menyelesaikan kasus.");
    await toggle("support-fail", false);
    await toggle("review-conflict", true);
    await submit();
    assert((await page.$eval(".support-errors", (element) => element.textContent)).includes("versi"), "Konflik tidak ditahan.");
    await toggle("review-conflict", false);
    await submit();
    assert((await data()).cases.find((item) => item.id === "REC-001").status === "resolved", "API cocok tidak menyelesaikan contoh.");
    await page.reload({ waitUntil: "load" });
    assert(await page.$eval('[data-hub-action="gateway-check"]', (element) => element.disabled), "Hasil hilang saat refresh.");
    await runCheck("REC-003");
    assert((await data()).cases.find((item) => item.id === "REC-003").paymentStatus === "review", "Selisih nominal dikonfirmasi.");
    assert(await page.$eval('[data-hub-action="manual-proposal"]', (element) => element.disabled), "Manual melewati selisih nominal.");
    await runCheck("REC-005");
    assert((await data()).cases.find((item) => item.id === "REC-005").status === "review", "Transaksi menunggu diselesaikan.");
    await runCheck("REC-002");
    await page.click('[data-hub-action="manual-proposal"]');
    await confirmFields();
    await submit();
    assert((await page.$eval(".support-errors", (element) => element.textContent)).includes("berkas"), "Pengajuan tanpa bukti diterima.");
    const upload = await page.$('[name="evidence"]');
    await upload.uploadFile("C:/laragon/www/rylva-green/storage/reports/hallmark/screenshots/review-reconciliation-390.png");
    await submit();
    const createdCase = (await data()).cases.find((item) => item.id === "REC-002");
    assert(createdCase.status === "awaiting", "Bukti manual langsung menyelesaikan pembayaran.");
    const requestId = createdCase.requestId;
    await Promise.all([
      page.waitForNavigation({ waitUntil: "load" }),
      page.click(`a[href*="sensitive-approvals.html"][href*="${requestId}"]`)
    ]);
    assert(await page.$eval('[data-hub-action="approve-request"]', (element) => element.disabled), "Pengaju menyetujui dirinya sendiri.");
    await page.select("#review-actor", "sa-02");
    assert(!(await page.$eval('[data-hub-action="approve-request"]', (element) => element.disabled)), "Penyetuju kedua tidak tersedia.");
    await page.click('[data-hub-action="approve-request"]');
    await confirmFields("Bukti contoh ditinjau oleh pelaku kedua");
    await page.screenshot({ path: "storage/reports/hallmark/screenshots/review-decision-1440.png", fullPage: false });
    await page.setViewport({ width: 390, height: 844 });
    await page.screenshot({ path: "storage/reports/hallmark/screenshots/review-decision-390.png", fullPage: false });
    const footerClear = await page.evaluate(() =>
    {
      const body = document.getElementById("support-dialog-body").getBoundingClientRect();
      const footer = document.getElementById("support-dialog-actions").getBoundingClientRect();
      return body.bottom <= footer.top;
    });
    assert(footerClear, "Tombol keputusan menutupi formulir.");
    await submit();
    const afterManual = await data();
    assert(afterManual.requests.find((item) => item.id === requestId).status === "approved", "Persetujuan kedua gagal.");
    assert(afterManual.cases.find((item) => item.id === "REC-002").status === "resolved", "Keputusan tidak memperbarui kasus terkait.");

    await open("sensitive-approvals", "&item=APR-001");
    await page.click('[data-hub-action="approve-request"]');
    await confirmFields("Tinjauan refund contoh");
    await page.evaluate(() =>
    {
      window.originalStorageSet = Storage.prototype.setItem;
      Storage.prototype.setItem = function setItem()
      {
        throw new Error("Quota simulasi");
      };
    });
    await submit();
    assert(await page.$eval("#support-dialog", (element) => element.open), "Form ditutup saat penyimpanan gagal.");
    assert((await data()).requests.find((item) => item.id === "APR-001").status === "pending", "Gagal penyimpanan tetap mengubah data.");
    await page.evaluate(() =>
    {
      Storage.prototype.setItem = window.originalStorageSet;
    });
    await submit();
    const refund = await data();
    assert(refund.refundRights["DEMO-ORDER-RF-001"] === 100000, "Hak refund tidak dialokasikan tepat sekali.");
    assert(refund.requests.find((item) => item.id === "APR-001").outcome.includes("belum dijalankan"), "Persetujuan dianggap pencairan.");
    assert(await page.$eval('[data-hub-action="approve-request"]', (element) => element.disabled), "Keputusan dapat diterapkan ulang.");

    await open("sensitive-approvals", "&item=APR-003");
    assert(await page.$eval('[data-hub-action="approve-request"]', (element) => element.disabled), "Stok di bawah alokasi dapat disetujui.");
    await page.click('[data-hub-action="reject-request"]');
    await confirmFields("Jumlah melampaui stok bebas");
    await submit();
    assert((await data()).stocks.rose.balance === 40, "Penolakan mengubah stok.");
    await open("sensitive-approvals", "&item=APR-002");
    await page.click('[data-hub-action="tab"][data-value="impact"]');
    await page.click('[data-hub-action="approve-request"]');
    await confirmFields();
    await page.keyboard.press("Escape");
    assert(await page.$eval("#support-dialog", (element) => element.open), "Escape membuang keputusan kotor.");
    await page.click('[data-hub-action="keep-editing"]');
    await page.goBack();
    assert(await page.evaluate(() => window.staffHub.state.item) === "APR-002", "Kembali browser mengubah target keputusan.");
    await page.click('[data-hub-action="keep-editing"]');
    await submit();
    assert((await data()).stocks.pot.balance === 65, "Koreksi stok tidak tepat sekali.");
    await page.click('[data-hub-action="tab"][data-value="impact"]');
    const impact = await page.$eval(".support-definition", (element) => element.textContent);
    assert(impact.includes("Saldo setelah keputusan65 pcs") && !impact.includes("90 pcs"), "Saldo dampak menghitung koreksi dua kali.");

    await open("payment-reconciliation");
    await page.type("#support-search", "tidak-ada-xyz");
    assert(await page.$(".report-state") !== null, "Pencarian otomatis gagal.");
    await page.click('[data-hub-action="reset"]');
    await page.select("#support-filter", "resolved");
    assert(await page.$(".review-table tbody tr") !== null, "Filter status gagal.");
    await page.click('[data-hub-action="reset"]');
    await page.click('[data-hub-action="next"]');
    await page.click('[data-hub-action="review-open"]');
    assert(await page.evaluate(() => scrollY) === 0, "Detail tidak mulai dari atas.");
    assert(await page.$eval('.report-tabs [aria-current="page"]', (element) => element.textContent) === "Ringkasan", "Detail tidak membuka Ringkasan.");
    await page.click('[data-hub-action="review-back"]');
    assert((await page.$eval(".report-pagination", (element) => element.textContent)).includes("2 dari 2"), "Konteks daftar hilang.");
    await page.$eval(".product-preview-controls", (element) =>
    {
      element.open = true;
    });
    await page.click('[data-hub-action="reset-demo"]');
    await submit();
    assert((await data()).cases.find((item) => item.id === "REC-001").status === "review", "Reset contoh gagal.");
    for (const file of ["payment-reconciliation", "sensitive-approvals"])
    {
      await open(file);
      for (const state of ["loading", "empty", "error"])
      {
        await page.select("#support-load", state);
        assert(await page.$(".support-panel h2") !== null, `State ${file} ${state} gagal.`);
      }
      await page.click('[data-hub-action="reload"]');
      assert(await page.$(".review-table") !== null, "Coba lagi gagal.");
    }
    for (const role of ["admin", "superadmin"])
    {
      await open("admin-dashboard", "", role);
      assert(await page.$$eval("[data-review-page]", (links) => links.every((link) => link.hidden === (new URLSearchParams(location.search).get("role") === "admin"))),
        "Menu review tidak sesuai peran.");
    }
    assert(errors.length === 0, `Kesalahan browser: ${errors.join(" | ")}`);
    console.log("Review SuperAdmin: 70 layout, gateway cocok/selisih/pending/gagal API, usulan manual lintas halaman, pemisahan pelaku, keputusan satu kali, hak refund, stok, recovery, dirty guard dan navigasi lulus; 0 error browser.");
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
