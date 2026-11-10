"use strict";

const fs = require("node:fs");
let source = fs.readFileSync("public/audit-log.html", "utf8");
source = source.replaceAll("audit-log.css", "system-parameters.css");
source = source.replaceAll("audit-data.js", "system-parameters-data.js");
source = source.replaceAll("audit-log.js", "system-parameters.js");
source = source.replace("Audit Log | RylVa Green", "Pengaturan Sistem | RylVa Green");
source = source.replace(
  "Telusuri aktivitas dan perubahan operasional RylVa Green sesuai kewenangan staf.",
  "Kelola kebijakan operasional RylVa Green dengan tinjauan perubahan dan riwayat parameter."
);
source = source.replace("data-audit-link data-role-link aria-current=\"page\"", "data-audit-link data-role-link");
source = source.replace(
  'href="admin-dashboard.html?role=superadmin#ringkasan" class="nav-item" title="Pengaturan Sistem"',
  'href="system-parameters.html?role=superadmin" class="nav-item" aria-current="page" title="Pengaturan Sistem"'
);
source = source.replace("audit-breadcrumb", "settings-breadcrumb");
source = source.replace('<span aria-current="page">Aktivitas Saya</span>', '<span aria-current="page">Pengaturan Sistem</span>');
const start = source.indexOf('      <main id="main-content"');
const end = source.indexOf("      </main>", start) + "      </main>".length;
const main = `      <main id="main-content" class="queue-main product-main settings-main" tabindex="-1">
        <div class="product-heading">
          <div>
            <h1>Pengaturan Sistem</h1>
            <p>Atur kebijakan toko. Tinjau dampaknya sebelum menyimpan.</p>
          </div>
          <div id="settings-heading-actions" class="product-heading-actions"></div>
        </div>
        <div id="settings-feedback" class="product-feedback" role="status" tabindex="-1" hidden></div>
        <div class="settings-demo-note">
          <svg class="icon icon--small" aria-hidden="true">
            <use href="#i-info"/>
          </svg>
          <p>Pratinjau lokal. Nilai awal mengikuti v2.6; perubahan hanya di tab ini dan hilang saat refresh.</p>
        </div>
        <nav id="settings-tabs" class="settings-tabs" aria-label="Tampilan pengaturan"></nav>
        <div id="settings-view">
          <section class="product-panel">
            <h2>Kebijakan operasional</h2>
            <p>Aktifkan JavaScript untuk menelusuri 46 parameter dan mencoba alur perubahan lokal.</p>
            <p>Akses halaman ini ditujukan untuk SuperAdmin. Nilai awal mengikuti Register Parameter v2.6.</p>
          </section>
        </div>
        <details class="product-preview-controls">
          <summary>Pilihan pratinjau</summary>
          <label for="settings-profile">Profil pratinjau</label>
          <select id="settings-profile">
            <option value="superadmin">SuperAdmin RylVa</option>
            <option value="admin">Admin RylVa (akses ditolak)</option>
          </select>
          <label for="settings-load-state">Kondisi data</label>
          <select id="settings-load-state">
            <option value="full">Data tersedia</option>
            <option value="loading">Sedang dimuat</option>
            <option value="error">Gagal dimuat</option>
            <option value="empty">Belum ada parameter</option>
          </select>
          <label class="product-check">
            <input id="settings-fail-save" type="checkbox">
            Simulasikan kegagalan simpan berikutnya
          </label>
          <label class="product-check">
            <input id="settings-expired" type="checkbox">
            Simulasikan sesi berakhir saat menyimpan
          </label>
          <button class="queue-button" type="button" data-settings-action="conflict">Simulasikan perubahan bersamaan</button>
          <p>Profil dan kode 123456 hanya untuk simulasi. Backend, MFA nyata, audit permanen, gateway, dan modul lain belum terhubung.</p>
        </details>
        <footer class="queue-footer">
          <p>RylVa Green, Gudang Pusat</p>
          <p>Waktu WIB. Riwayat contoh hanya baca.</p>
        </footer>
      </main>`;
source = source.slice(0, start) + main + source.slice(end);
source = source.replace('  <script src="assets/js/shared/admin-audit-nav.js" defer></script>', `  <dialog id="settings-dialog" class="product-dialog" aria-labelledby="settings-dialog-title">
    <form id="settings-dialog-form" method="dialog">
      <h2 id="settings-dialog-title">Perubahan belum ditambahkan</h2>
      <p id="settings-dialog-copy">Isian yang belum ditambahkan ke draf akan dibuang.</p>
      <div class="product-dialog-actions">
        <button class="queue-button" type="button" data-settings-action="cancel-dialog">Tetap mengedit</button>
        <button id="settings-dialog-confirm" class="queue-button queue-button--primary" type="submit">Buang isian</button>
      </div>
    </form>
  </dialog>
  <script src="assets/js/shared/admin-audit-nav.js" defer></script>
  <script src="assets/js/shared/admin-settings-nav.js" defer></script>`);
source = source.replace('    <symbol id="i-plus"', `    <symbol id="i-shield" viewBox="0 0 24 24">
      <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/>
      <path d="m8 12 3 3 5-6"/>
    </symbol>
    <symbol id="i-lock" viewBox="0 0 24 24">
      <rect x="5" y="10" width="14" height="11" rx="2"/>
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>
    </symbol>
    <symbol id="i-plus"`);
fs.writeFileSync("public/system-parameters.html", source);

const pages =
[
  "admin-dashboard", "financial-report", "orders-queue", "products", "production-materials",
  "bouquet-production", "customers", "closure-calendar", "audit-log"
];

pages.forEach((page) =>
{
  const path = `public/${page}.html`;
  let html = fs.readFileSync(path, "utf8");
  html = html.replace(/<a href="[^"]+"([^>]*title="Pengaturan Sistem"[^>]*)>/,
    '<a href="system-parameters.html?role=superadmin"$1>');

  if (!html.includes('src="assets/js/shared/admin-settings-nav.js"'))
  {
    html = html.replace("</body>", '  <script src="assets/js/shared/admin-settings-nav.js" defer></script>\n</body>');
  }

  fs.writeFileSync(path, html);
});
