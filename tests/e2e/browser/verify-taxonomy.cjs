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
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (entry) =>
  {
    if (entry.type() === "error" && !entry.location().url.endsWith("/favicon.ico"))
    {
      errors.push(`${entry.text()} ${entry.location().url}`);
    }
  });

  function assert(condition, message)
  {
    if (!condition)
    {
      throw new Error(message);
    }
  }

  async function open(query = "")
  {
    await page.goto(`http://127.0.0.1:4178/categories-attributes.html?role=admin${query}`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
  }

  async function fill(name, value)
  {
    await page.$eval(`#taxonomy-dialog [name="${name}"]`, (element, content) =>
    {
      element.value = content;
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);
  }

  async function submit()
  {
    await page.$eval(".taxonomy-form", (form) => form.requestSubmit());
  }

  async function closeDirty()
  {
    await page.click("#taxonomy-dialog-close");
    if (await page.$eval(".taxonomy-discard", (element) => !element.hidden))
    {
      await page.click('[data-tax-action="discard"]');
    }
  }

  try
  {
    const routes =
    [
      ["categories", ""],
      ["attributes", "&kind=attributes"],
      ["category-detail", "&item=plants"],
      ["attribute-detail", "&kind=attributes&item=attr-bahan"],
      ["usage", "&item=plants&tab=usage"],
      ["history", "&item=plants&tab=history"]
    ];
    for (const width of [320, 390, 768, 1440, 1920])
    {
      await page.setViewport({ width, height: 900 });
      for (const [name, query] of routes)
      {
        await open(query);
        const layout = await page.evaluate(() =>
        {
          const cards = [...document.querySelectorAll(".taxonomy-stats .catalog-stat")];
          const detail = document.querySelector(".taxonomy-detail");
          return {
            heading: document.querySelector("h1")?.textContent,
            overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            heights: cards.map((element) => element.getBoundingClientRect().height),
            detailFull: !detail || Math.abs(detail.getBoundingClientRect().width
              - document.querySelector("#taxonomy-root").getBoundingClientRect().width) < 1
          };
        });
        assert(layout.heading && !layout.overflow && layout.detailFull, `Layout ${name} ${width} gagal: ${JSON.stringify(layout)}`);
        if (layout.heights.length)
        {
          assert(Math.max(...layout.heights) - Math.min(...layout.heights) < 1, `Kartu tidak sama tinggi pada ${width}.`);
        }
        if ([390, 1440].includes(width))
        {
          await page.screenshot({ path: `storage/reports/hallmark/screenshots/taxonomy-${name}-${width}.png`, fullPage: true });
        }
      }
    }

    await page.setViewport({ width: 1440, height: 900 });
    await open();
    await page.type("#tax-search", "xxxx-tidak-ada");
    assert((await page.$eval(".report-state", (element) => element.textContent)).includes("Tidak ada hasil"), "Pencarian otomatis gagal.");
    await page.click('[data-tax-action="reset"]');
    await page.select("#tax-filter", "inactive");
    assert(await page.$$eval(".report-table tbody tr", (rows) => rows.length) === 1, "Filter status otomatis gagal.");
    await page.click('[data-tax-action="reset"]');
    await page.click('[data-tax-action="next"]');
    assert((await page.$eval(".report-pagination", (element) => element.textContent)).includes("2 dari 2"), "Pagination gagal.");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.click('[data-tax-action="detail"][data-id="plants"]');
    assert(await page.evaluate(() => scrollY) === 0, "Detail tidak dimulai dari atas.");
    assert((await page.$eval('.report-tabs [aria-current="page"]', (element) => element.textContent)) === "Informasi", "Detail tidak membuka informasi utama.");
    await page.click('[data-tax-action="delete"]');
    assert(await page.$eval('#taxonomy-dialog-actions button[type="submit"]', (element) => element.disabled), "Kategori terpakai dapat dihapus.");
    await page.click('[data-tax-action="close"]');
    await page.click('[data-tax-action="edit"]');
    await page.$eval('[name="active"]', (element) =>
    {
      element.checked = false;
    });
    await fill("reason", "Menguji batas status");
    await submit();
    assert((await page.$eval(".taxonomy-errors", (element) => element.textContent)).includes("produk aktif"), "Kategori terpakai dapat dinonaktifkan.");
    await closeDirty();

    await page.click('[data-tax-action="back"]');
    await page.click('[data-tax-action="new"]');
    await fill("name", "Kategori uji");
    await page.keyboard.press("Escape");
    assert(await page.$eval("#taxonomy-dialog", (element) => element.open), "Escape membuang edit tanpa konfirmasi.");
    assert(!(await page.$eval(".taxonomy-discard", (element) => element.hidden)), "Peringatan perubahan hilang tidak muncul.");
    await page.click('[data-tax-action="keep-editing"]');
    await page.goBack();
    assert(await page.$eval("#taxonomy-dialog", (element) => element.open), "Kembali browser membuang edit tanpa konfirmasi.");
    assert(await page.$eval('[name="name"]', (element) => element.value) === "Kategori uji", "Kembali browser mengubah isian.");
    assert(await page.evaluate(() => new URLSearchParams(location.search).get("kind")) === "categories", "Kembali browser mengubah jenis data di balik editor.");
    await page.click('[data-tax-action="keep-editing"]');
    await submit();
    assert(await page.$eval("h1", (element) => element.textContent) === "Kategori uji", "Kategori gagal dibuat.");
    const createdId = await page.evaluate(() => new URLSearchParams(location.search).get("item"));
    await page.click('[data-tax-action="edit"]');
    await fill("name", "Tanaman hias");
    await fill("reason", "Menguji nama duplikat");
    await submit();
    assert((await page.$eval(".taxonomy-errors", (element) => element.textContent)).includes("Nama sudah"), "Duplikasi nama tidak dicegah.");
    await fill("name", "Kategori uji revisi");
    await submit();
    await page.click('[data-tax-action="tab"][data-value="history"]');
    assert((await page.$eval(".taxonomy-history", (element) => element.textContent)).includes("Menguji nama duplikat"), "Aktivitas perubahan gagal.");
    await page.click('[data-tax-action="back"]');
    await page.goBack({ waitUntil: "load" });
    assert(await page.evaluate((id) => window.taxonomyFixture.categories.some((item) => item.id === id), createdId), "Kembali browser menghilangkan data sesi.");
    await page.click('[data-tax-action="delete"]');
    await fill("reason", "Menghapus data uji");
    await submit();
    assert(!(await page.evaluate((id) => window.taxonomyFixture.categories.some((item) => item.id === id), createdId)), "Kategori belum dipakai gagal dihapus.");

    await page.evaluate(() =>
    {
      window.taxonomyFixture.attributes[0].categories.push("seasonal");
    });
    await page.type("#tax-search", "Koleksi musiman");
    await page.click('[data-tax-action="detail"][data-id="seasonal"]');
    await page.click('[data-tax-action="delete"]');
    assert((await page.$eval(".taxonomy-notice", (element) => element.textContent)).includes("definisi atribut"),
      "Kategori dengan referensi atribut belum dilindungi.");
    assert(await page.$eval('#taxonomy-dialog-actions button[type="submit"]', (element) => element.disabled),
      "Kategori dengan referensi atribut dapat dihapus.");
    await page.click('[data-tax-action="close"]');

    await open("&kind=attributes&item=attr-bahan");
    await page.click('[data-tax-action="edit"]');
    assert(await page.$eval('[name="name"]', (element) => element.disabled), "Nama atribut terpakai tidak dikunci.");
    assert(await page.$eval('[name="type"]', (element) => element.disabled), "Tipe atribut terpakai tidak dikunci.");
    await page.screenshot({ path: "storage/reports/hallmark/screenshots/taxonomy-edit-1440.png", fullPage: true });
    await page.click('[data-tax-action="close"]');
    assert(await page.$eval('[data-tax-action="option-delete"]', (element) => element.disabled), "Pilihan terpakai dapat dihapus.");
    await page.click('[data-tax-action="back"]');
    await page.click('[data-tax-action="new"]');
    await fill("name", "Warna uji");
    await page.select('[name="type"]', "choice");
    await submit();
    assert((await page.$eval(".taxonomy-errors", (element) => element.textContent)).includes("Simpan atribut pilihan sebagai nonaktif"), "Pilihan aktif kosong diterima.");
    await page.$eval('[name="active"]', (element) =>
    {
      element.checked = false;
    });
    await submit();
    const attributeId = await page.evaluate(() => new URLSearchParams(location.search).get("item"));
    await page.click('[data-tax-action="option-new"]');
    await fill("name", "Merah");
    await fill("reason", "Menambahkan pilihan uji");
    await submit();
    assert((await page.$eval(".taxonomy-option-list", (element) => element.textContent)).includes("Merah"), "Pilihan gagal dibuat.");
    await page.click('[data-tax-action="option-new"]');
    await fill("name", "Merah");
    await fill("reason", "Menguji pilihan duplikat");
    await submit();
    assert((await page.$eval(".taxonomy-errors", (element) => element.textContent)).includes("Nama sudah"), "Pilihan duplikat diterima.");
    await closeDirty();
    await page.click('[data-tax-action="edit"]');
    await page.$eval('[name="active"]', (element) =>
    {
      element.checked = true;
    });
    await fill("reason", "Mengaktifkan atribut uji");
    await submit();
    assert(await page.$eval('[data-tax-action="option-delete"]', (element) => element.disabled), "Pilihan aktif terakhir bisa dihapus.");

    await page.click('[data-tax-action="edit"]');
    await fill("description", "Deskripsi tidak boleh tersimpan");
    await fill("reason", "Menguji kegagalan simpan");
    await page.evaluate(() =>
    {
      document.getElementById("taxonomy-fail").checked = true;
    });
    await submit();
    assert(await page.$eval("#taxonomy-dialog", (element) => element.open), "Form ditutup ketika gagal.");
    assert(!(await page.evaluate((id) => window.taxonomyFixture.attributes.find((item) => item.id === id).description, attributeId)), "Gagal simpan tetap mengubah data.");
    await page.evaluate(() =>
    {
      document.getElementById("taxonomy-fail").checked = false;
    });
    await submit();
    assert((await page.$eval(".taxonomy-definition", (element) => element.textContent)).includes("Deskripsi tidak boleh tersimpan"), "Simpan ulang gagal.");

    await page.setViewport({ width: 390, height: 844 });
    await page.click('[data-tax-action="edit"]');
    await page.screenshot({ path: "storage/reports/hallmark/screenshots/taxonomy-edit-390.png", fullPage: true });
    const dialogBounds = await page.$eval("#taxonomy-dialog", (element) =>
    {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, bottom: rect.bottom, top: rect.top };
    });
    assert(dialogBounds.left >= 0 && dialogBounds.right <= 390 && dialogBounds.bottom <= 844 && dialogBounds.top >= 0, "Dialog mobile terpotong.");
    const separateFooter = await page.evaluate(() =>
    {
      const body = document.getElementById("taxonomy-dialog-body").getBoundingClientRect();
      const footer = document.getElementById("taxonomy-dialog-actions").getBoundingClientRect();
      return body.bottom <= footer.top;
    });
    assert(separateFooter, "Tombol dialog menutupi isi formulir.");
    await page.click('[data-tax-action="close"]');
    for (const state of ["loading", "empty", "error"])
    {
      await page.evaluate((value) =>
      {
        const select = document.getElementById("taxonomy-load");
        select.value = value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }, state);
      assert(await page.$(".report-state") !== null, `Kondisi ${state} gagal.`);
    }
    await page.click('[data-tax-action="reload"]');
    assert(await page.$(".report-table") !== null, "Coba lagi gagal.");
    for (const role of ["admin", "superadmin"])
    {
      await page.goto(`http://127.0.0.1:4178/admin-dashboard.html?role=${role}`, { waitUntil: "load" });
      assert((await page.$eval("[data-taxonomy-link]", (element) => element.getAttribute("href"))).includes(`role=${role}`), "Navigasi kategori salah peran.");
      assert(await page.$$eval('[aria-current="page"]', (elements) => elements.filter((element) => element.closest("#sidebar-nav")).length) === 1, "Navigasi memiliki lebih dari satu penanda aktif.");
    }
    assert(errors.length === 0, `Kesalahan browser: ${errors.join(" | ")}`);
    console.log("Kategori & Atribut: 30 layout, CRUD, dependensi, pilihan, pencarian langsung, pagination, riwayat, dirty guard, recovery, navigasi dan 2 peran lulus; 0 error browser.");
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
