const fs = require("fs");

let html = fs.readFileSync("public/production-materials.html", "utf8");
html = html.replace("Kelola bahan rangkai, batch, alokasi, dan pemakaian produksi RylVa Green.", "Periksa pelanggan, pesanan, alamat, dan tindak lanjut operasional RylVa Green.");
html = html.replace("Bahan Produksi |", "Pelanggan |");
html = html.replace('  <link rel="stylesheet" href="assets/css/staff/inventory/materials.css">', '  <link rel="stylesheet" href="assets/css/staff/customers/customers.css">');
html = html.replace('  <script src="assets/js/staff/inventory/materials-data.js" defer></script>', '  <script src="assets/js/staff/customers/customers-data.js" defer></script>');
html = html.replace('  <script src="assets/js/staff/inventory/materials.js" defer></script>', '  <script src="assets/js/staff/customers/customers.js" defer></script>');
html = html.replace('  <script src="assets/js/staff/inventory/materials-forms.js" defer></script>\n', "");
html = html.replace(/<a[^>]+title="Bahan Produksi"[^>]*>/, '<a href="production-materials.html" class="nav-item" data-role-link title="Bahan Produksi">');
html = html.replace(/<a[^>]+title="Pelanggan"[^>]*>/, '<a href="customers.html" class="nav-item nav-item-active" data-role-link title="Pelanggan" aria-current="page">');
html = html.replace(/<nav id="material-breadcrumb"[\s\S]*?<\/nav>/, `<nav id="customer-breadcrumb" class="breadcrumb product-breadcrumb" aria-label="Breadcrumb">
            <a href="admin-dashboard.html">Ruang kerja</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Pelanggan</span>
          </nav>`);
const start = html.indexOf('      <main');
const end = html.indexOf('      </main>', start) + '      </main>'.length;
html = html.slice(0, start) + `      <main id="main-content" class="queue-main product-main customer-main">
        <div class="product-heading">
          <div>
            <h1 id="customer-title">Pelanggan</h1>
            <p id="customer-subtitle">Temukan pelanggan dan tindak lanjuti kebutuhan pesanannya.</p>
          </div>
          <div class="product-heading-actions" id="customer-heading-actions"></div>
        </div>
        <p id="customer-feedback" class="product-feedback" role="status" tabindex="-1" hidden></p>
        <div id="customer-view">
          <section class="product-panel">
            <h2>Informasi pelanggan</h2>
            <p>Aktifkan JavaScript untuk mencari pelanggan, membuka riwayat pesanan, dan mencatat tindak lanjut.</p>
          </section>
        </div>
        <details class="product-preview-controls">
          <summary>Pilihan pratinjau</summary>
          <label for="customer-profile">Profil pratinjau</label>
          <select id="customer-profile">
            <option value="admin">Admin</option>
            <option value="superadmin">SuperAdmin</option>
          </select>
          <label for="customer-load-state">Kondisi data</label>
          <select id="customer-load-state">
            <option value="full">Data tersedia</option>
            <option value="loading">Sedang dimuat</option>
            <option value="error">Gagal dimuat</option>
            <option value="empty">Belum ada pelanggan</option>
          </select>
          <label class="product-check">
            <input id="customer-fail-save" type="checkbox">
            Simulasikan kegagalan simpan berikutnya
          </label>
          <p>Data pelanggan sintetis, snapshot 4 November 2026. Perubahan hanya di tab ini dan kembali ke awal saat refresh.</p>
        </details>
        <footer class="queue-footer">
          <p>RylVa Green, Gudang Pusat</p>
          <p>Pratinjau data operasional pelanggan.</p>
        </footer>
      </main>` + html.slice(end);
const dialogStart = html.indexOf('  <dialog id="material-confirm"');
const dialogEnd = html.indexOf('  </dialog>', dialogStart) + '  </dialog>'.length;
html = html.slice(0, dialogStart) + `  <dialog id="customer-dialog" class="product-dialog product-main customer-dialog" aria-labelledby="customer-dialog-title">
    <form id="customer-dialog-form" novalidate>
      <h2 id="customer-dialog-title">Konfirmasi tindakan</h2>
      <div id="customer-dialog-body"></div>
      <div class="product-dialog-actions">
        <button type="button" class="queue-button" id="customer-dialog-cancel">Batal</button>
        <button type="submit" class="queue-button queue-button--primary" id="customer-dialog-submit">Konfirmasi</button>
      </div>
    </form>
  </dialog>` + html.slice(dialogEnd);
fs.writeFileSync("public/customers.html", html);

for (const path of ["public/products.html", "public/orders-queue.html", "public/admin-dashboard.html", "public/financial-report.html", "public/production-materials.html"])
{
  let source = fs.readFileSync(path, "utf8");
  source = source.replace(/<a[^>]+title="Pelanggan"[^>]*>/g, `<a href="customers.html${path.includes("financial-report") ? "?role=superadmin" : ""}" class="nav-item" data-role-link title="Pelanggan">`);
  if (path.includes("admin-dashboard"))
  {
    source = source.replace('a[href="production-materials.html"]', 'a[href="production-materials.html"], a[href="customers.html"]');
  }
  fs.writeFileSync(path, source);
}
