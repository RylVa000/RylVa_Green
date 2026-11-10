const fs = require("node:fs");

const menu = `        <a href="bouquet-production.html" class="nav-item" data-role-link title="Buket &amp; Produksi">
          <svg class="icon" aria-hidden="true">
            <use href="#i-flower"/>
          </svg>
          <span class="sidebar-label">Buket &amp; Produksi</span>
        </a>
`;
let html = fs.readFileSync("public/customers.html", "utf8");
html = html.replace("Pelanggan | RylVa Green", "Buket & Produksi | RylVa Green");
html = html.replace("Periksa pelanggan, pesanan, alamat, dan tindak lanjut operasional RylVa Green.", "Kelola konfigurasi buket, kebutuhan bahan, dan pekerjaan produksi RylVa Green.");
html = html.replace('assets/css/staff/customers/customers.css', 'assets/css/staff/production/bouquet-production.css');
html = html.replace('  <script src="assets/js/staff/customers/customers-data.js" defer></script>', '  <script src="assets/js/staff/inventory/materials-data.js" defer></script>\n  <script src="assets/js/staff/production/bouquet-data.js" defer></script>');
html = html.replace('  <script src="assets/js/staff/customers/customers.js" defer></script>', '  <script src="assets/js/staff/production/bouquet-production.js" defer></script>\n  <script src="assets/js/staff/production/bouquet-editor.js" defer></script>');
html = html.replace(/<a[^>]+title="Pelanggan"[^>]*>/, '<a href="customers.html" class="nav-item" data-role-link title="Pelanggan">');
html = html.replace('        <a href="customers.html"', menu.replace('title="Buket &amp; Produksi"', 'title="Buket &amp; Produksi" aria-current="page"') + '        <a href="customers.html"');
html = html.replace('id="customer-breadcrumb"', 'id="bouquet-breadcrumb"');
html = html.replace('<span aria-current="page">Pelanggan</span>', '<span aria-current="page">Buket &amp; Produksi</span>');
const mainStart = html.indexOf('      <main');
const mainEnd = html.indexOf('      </main>', mainStart) + '      </main>'.length;
html = html.slice(0, mainStart) + `      <main id="main-content" class="queue-main product-main bouquet-main" tabindex="-1">
        <div class="product-heading">
          <div>
            <h1 id="bouquet-title">Buket &amp; Produksi</h1>
            <p id="bouquet-subtitle">Periksa kebutuhan bahan dan lanjutkan pekerjaan florist.</p>
          </div>
          <div id="bouquet-heading-actions" class="product-heading-actions"></div>
        </div>
        <p id="bouquet-feedback" class="product-feedback" role="status" tabindex="-1" hidden></p>
        <div id="bouquet-view">
          <section class="product-panel">
            <h2>Pekerjaan buket</h2>
            <p>Aktifkan JavaScript untuk konfigurasi, kebutuhan bahan, dan pencatatan produksi.</p>
          </section>
        </div>
        <details class="product-preview-controls">
          <summary>Pilihan pratinjau</summary>
          <label for="bouquet-profile">Profil pratinjau</label>
          <select id="bouquet-profile">
            <option value="admin">Admin</option>
            <option value="superadmin">SuperAdmin</option>
          </select>
          <label for="bouquet-load-state">Kondisi data</label>
          <select id="bouquet-load-state">
            <option value="full">Data tersedia</option>
            <option value="loading">Sedang dimuat</option>
            <option value="error">Gagal dimuat</option>
            <option value="empty">Belum ada data</option>
          </select>
          <label class="product-check">
            <input id="bouquet-fail-save" type="checkbox">
            Simulasikan kegagalan simpan berikutnya
          </label>
          <p>Data ilustrasi 4 November 2026, 10.20 WIB. Perubahan hanya di tab ini; modul lain belum tersinkronisasi.</p>
        </details>
        <footer class="queue-footer">
          <p>RylVa Green, Gudang Pusat</p>
          <p>Pratinjau konfigurasi dan pekerjaan florist.</p>
        </footer>
      </main>` + html.slice(mainEnd);
const dialogStart = html.indexOf('  <dialog');
const dialogEnd = html.indexOf('  </dialog>', dialogStart) + '  </dialog>'.length;
html = html.slice(0, dialogStart) + `  <dialog id="bouquet-dialog" class="product-dialog product-main bouquet-dialog" aria-labelledby="bouquet-dialog-title">
    <form id="bouquet-dialog-form" novalidate>
      <h2 id="bouquet-dialog-title">Konfirmasi produksi</h2>
      <div id="bouquet-dialog-body"></div>
      <div class="product-dialog-actions">
        <button type="button" class="queue-button" id="bouquet-dialog-cancel">Batal</button>
        <button type="submit" class="queue-button queue-button--primary" id="bouquet-dialog-submit">Konfirmasi</button>
      </div>
    </form>
  </dialog>` + html.slice(dialogEnd);
fs.writeFileSync("public/bouquet-production.html", html);

for (const file of ["admin-dashboard", "orders-queue", "products", "production-materials", "customers", "financial-report", "closure-calendar"])
{
  const path = `public/${file}.html`;
  let source = fs.readFileSync(path, "utf8");
  const anchor = source.indexOf('        <a', source.indexOf('title="Bahan Produksi"'));
  let entry = menu;
  if (file === "financial-report")
  {
    entry = entry.replace('href="bouquet-production.html"', 'href="bouquet-production.html?role=superadmin"');
    entry = entry.replace('class="nav-item"', 'class="nav-item flex min-h-11 items-center gap-3 rounded-xl px-4 text-[13px]"');
    entry = entry.replace('class="icon"', 'class="h-[18px] w-[18px] flex-none fill-none stroke-current stroke-[1.7]"');
  }
  source = source.slice(0, anchor) + entry + source.slice(anchor);
  if (file === "admin-dashboard")
  {
    source = source.replace('a[href="closure-calendar.html"]', 'a[href="closure-calendar.html"], a[href="bouquet-production.html"]');
  }
  fs.writeFileSync(path, source);
}
