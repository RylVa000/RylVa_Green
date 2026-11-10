const fs = require("node:fs");

let html = fs.readFileSync("public/customers.html", "utf8");
html = html.replace("Periksa pelanggan, pesanan, alamat, dan tindak lanjut operasional RylVa Green.", "Kelola tanggal tutup dan periksa pesanan yang terdampak di RylVa Green.");
html = html.replace("Pelanggan | RylVa Green", "Kalender Tutup | RylVa Green");
html = html.replace('href="assets/css/staff/customers/customers.css"', 'href="assets/css/staff/calendar/closure-calendar.css"');
html = html.replace('src="assets/js/staff/customers/customers-data.js"', 'src="assets/js/staff/calendar/closure-calendar-data.js"');
html = html.replace('src="assets/js/staff/customers/customers.js"', 'src="assets/js/staff/calendar/closure-calendar.js"');
html = html.replace(/<a[^>]+title="Pelanggan"[^>]*>/, '<a href="customers.html" class="nav-item" data-role-link title="Pelanggan">');
html = html.replace(/<a[^>]+title="Kalender Tutup"[^>]*>/, '<a href="closure-calendar.html" class="nav-item" data-role-link title="Kalender Tutup" aria-current="page">');
html = html.replace('id="customer-breadcrumb"', 'id="closure-breadcrumb"');
html = html.replace('<span aria-current="page">Pelanggan</span>', '<span aria-current="page">Kalender Tutup</span>');
const mainStart = html.indexOf('      <main id="main-content"');
const mainEnd = html.indexOf('      </main>', mainStart) + '      </main>'.length;
html = html.slice(0, mainStart) + `      <main id="main-content" class="queue-main product-main closure-main" tabindex="-1">
        <div class="product-heading closure-heading">
          <div>
            <h1>Kalender Tutup</h1>
            <p>Atur tanggal tutup dan periksa jadwal pesanan yang terdampak.</p>
          </div>
          <button id="closure-add" class="queue-button queue-button--primary" type="button">
            <svg class="icon icon--small" aria-hidden="true">
              <use href="#i-plus"/>
            </svg>
            Tandai tanggal tutup
          </button>
        </div>
        <p id="closure-feedback" class="product-feedback" role="status" tabindex="-1" hidden></p>
        <div id="closure-view">
          <section class="product-panel">
            <h2>Jadwal toko</h2>
            <p>Aktifkan JavaScript untuk melihat kalender dan memeriksa tanggal tutup.</p>
          </section>
        </div>
        <details class="product-preview-controls">
          <summary>Pilihan pratinjau</summary>
          <label for="closure-profile">Profil pratinjau</label>
          <select id="closure-profile">
            <option value="admin">Admin</option>
            <option value="superadmin">SuperAdmin</option>
          </select>
          <label for="closure-load-state">Kondisi data</label>
          <select id="closure-load-state">
            <option value="full">Data tersedia</option>
            <option value="loading">Sedang dimuat</option>
            <option value="error">Gagal dimuat</option>
            <option value="empty">Belum ada tanggal tutup</option>
          </select>
          <label class="product-check">
            <input id="closure-fail-save" type="checkbox">
            Simulasikan kegagalan simpan berikutnya
          </label>
          <p>Data ilustrasi pada 3 November 2026. Perubahan hanya tersimpan pada tab ini.</p>
        </details>
        <footer class="queue-footer">
          <p>RylVa Green, Gudang Pusat</p>
          <p>Data ilustrasi untuk pratinjau operasional.</p>
        </footer>
      </main>` + html.slice(mainEnd);
const dialogStart = html.indexOf('  <dialog id="customer-dialog"');
const dialogEnd = html.indexOf('  </dialog>', dialogStart) + '  </dialog>'.length;
html = html.slice(0, dialogStart) + `  <dialog id="closure-dialog" class="product-dialog product-main closure-dialog" aria-labelledby="closure-dialog-title">
    <form id="closure-form" novalidate>
      <h2 id="closure-dialog-title">Tandai tanggal tutup</h2>
      <div id="closure-dialog-body"></div>
      <div class="product-dialog-actions">
        <button type="button" class="queue-button" id="closure-cancel">Batal</button>
        <button type="submit" class="queue-button queue-button--primary" id="closure-submit">Simpan</button>
      </div>
    </form>
  </dialog>` + html.slice(dialogEnd);
fs.writeFileSync("public/closure-calendar.html", html);

for (const file of ["public/admin-dashboard.html", "public/orders-queue.html", "public/products.html", "public/production-materials.html", "public/customers.html", "public/financial-report.html"])
{
  let source = fs.readFileSync(file, "utf8");
  const href = file.includes("financial-report") ? "closure-calendar.html?role=superadmin" : "closure-calendar.html";
  source = source.replace(/<a[^>]+title="Kalender Tutup"[^>]*>/g, `<a href="${href}" class="nav-item" data-role-link title="Kalender Tutup">`);
  if (file.includes("admin-dashboard"))
  {
    source = source.replace('a[href="customers.html"]', 'a[href="customers.html"], a[href="closure-calendar.html"]');
  }
  fs.writeFileSync(file, source);
}
