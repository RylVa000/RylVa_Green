const fs = require("node:fs");

const source = fs.readFileSync("public/products.html", "utf8");
const start = source.indexOf('      <main id="queue-main"');
const end = source.indexOf("      </main>", start) + "      </main>".length;
const main = `      <main id="queue-main" class="queue-main product-main material-main">
        <div class="product-heading">
          <div>
            <h1 id="material-page-title" tabindex="-1">Bahan Produksi</h1>
            <p id="material-page-intro">Jaga bahan siap pakai untuk setiap rangkaian.</p>
          </div>
          <div class="product-heading-actions" id="material-page-actions">
            <label class="location-control" for="material-location">
              Lokasi stok
              <select id="material-location">
                <option value="pusat">Gudang Pusat</option>
                <option value="toko">Etalase Toko</option>
              </select>
            </label>
            <button class="queue-button" type="button" data-material-action="new">
              Tambah bahan
            </button>
            <button class="queue-button queue-button--primary" type="button" data-material-action="receipt">
              <svg class="icon icon--small" aria-hidden="true">
                <use href="#i-plus"/>
              </svg>
              Catat barang masuk
            </button>
          </div>
        </div>
        <p id="material-feedback" class="product-feedback" role="status" tabindex="-1" hidden></p>
        <div id="material-view">
          <section class="product-panel">
            <h2>Persediaan bahan rangkai</h2>
            <p>Mawar merah, tulip, filler, pembungkus, pita, floral foam, dan kartu ucapan dikelola dalam satuan masing-masing.</p>
            <p>Gunakan JavaScript untuk pencarian, rincian batch, dan pencatatan mutasi.</p>
          </section>
        </div>
        <details class="product-preview-controls">
          <summary>Pilihan pratinjau</summary>
          <label for="material-profile">Profil pratinjau</label>
          <select id="material-profile">
            <option value="admin">Admin</option>
            <option value="superadmin">SuperAdmin</option>
          </select>
          <label for="material-load-state">Kondisi data</label>
          <select id="material-load-state">
            <option value="full">Data tersedia</option>
            <option value="loading">Sedang dimuat</option>
            <option value="error">Gagal dimuat</option>
            <option value="empty">Katalog kosong</option>
          </select>
          <label class="product-check">
            <input type="checkbox" id="material-fail-save">
            Simulasikan kegagalan simpan berikutnya
          </label>
          <p>Data ilustrasi 4 November 2026. Perubahan hanya berada di tab ini; refresh mengembalikan contoh.</p>
        </details>
        <footer class="queue-footer">
          <p>RylVa Green, bahan produksi buket</p>
          <p>Data ilustrasi. Persediaan terpisah dari barang dagangan.</p>
        </footer>
      </main>`;
let output = source.slice(0, start) + main + source.slice(end);
output = output.replace("Produk & Varian | RylVa Green", "Bahan Produksi | RylVa Green");
output = output.replace("Kelola katalog, varian, harga, dan stok barang dagangan RylVa Green.",
  "Kelola bahan rangkai, batch, alokasi, dan pemakaian produksi RylVa Green.");
output = output.replace('  <script src="assets/js/staff/catalog/products-data.js" defer></script>',
  '  <link rel="stylesheet" href="assets/css/staff/inventory/materials.css">\n  <script src="assets/js/staff/inventory/materials-data.js" defer></script>');
output = output.replace('assets/js/staff/catalog/products.js', 'assets/js/staff/inventory/materials.js');
output = output.replace('assets/js/staff/catalog/products-editor.js', 'assets/js/staff/inventory/materials-forms.js');
output = output.replace('  <script src="assets/js/staff/inventory/materials-forms.js" defer></script>',
  '  <script src="assets/js/staff/inventory/materials-forms.js" defer></script>\n  <script src="assets/js/shared/admin-shell.js" defer></script>');
output = output.replace('title="Produk &amp; Varian" aria-current="page"', 'title="Produk &amp; Varian"');
output = output.replace('href="admin-dashboard.html#inventory"', 'href="production-materials.html"');
output = output.replace('title="Bahan Produksi">', 'title="Bahan Produksi" aria-current="page">');
output = output.replace('id="product-breadcrumb"', 'id="material-breadcrumb"');
output = output.replaceAll('product-confirm', 'material-confirm');
fs.writeFileSync("public/production-materials.html", output);

for (const file of ["products.html", "orders-queue.html", "admin-dashboard.html", "financial-report.html"])
{
  const filePath = `public/${file}`;
  const html = fs.readFileSync(filePath, "utf8");
  const next = html.replaceAll('href="admin-dashboard.html#inventory"', 'href="production-materials.html"')
    .replaceAll('href="admin-dashboard.html?role=superadmin#inventory"', 'href="production-materials.html?role=superadmin"')
    .replaceAll('href="#inventory"', 'href="production-materials.html"');

  if (next !== html)
  {
    fs.writeFileSync(filePath, next);
  }
}
