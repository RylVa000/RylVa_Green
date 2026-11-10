const fs = require("node:fs");

let html = fs.readFileSync("public/bouquet-production.html", "utf8");
html = html.replace("Buket & Produksi | RylVa Green", "Audit Log | RylVa Green");
html = html.replace("Kelola konfigurasi buket, kebutuhan bahan, dan pekerjaan produksi RylVa Green.",
  "Telusuri aktivitas dan perubahan operasional RylVa Green sesuai kewenangan staf.");
html = html.replace("assets/css/staff/production/bouquet-production.css", "assets/css/staff/superadmin/audit-log.css");
html = html.replace(/  <script src="assets\/js\/(materials-data|bouquet-data|bouquet-production|bouquet-editor)\.js" defer><\/script>\r?\n/g, "");
html = html.replace('  <script src="assets/js/shared/admin-shell.js"',
  '  <script src="assets/js/staff/superadmin/audit-data.js" defer></script>\n  <script src="assets/js/staff/superadmin/audit-log.js" defer></script>\n  <script src="assets/js/shared/admin-shell.js"');
html = html.replace('title="Buket &amp; Produksi" aria-current="page"', 'title="Buket &amp; Produksi"');
html = html.replace('id="bouquet-breadcrumb"', 'id="audit-breadcrumb"');
html = html.replace('<span aria-current="page">Buket &amp; Produksi</span>', '<span aria-current="page">Aktivitas Saya</span>');
const mainStart = html.indexOf("      <main");
const mainEnd = html.indexOf("      </main>", mainStart) + "      </main>".length;
html = html.slice(0, mainStart) + `      <main id="main-content" class="queue-main product-main audit-main" tabindex="-1">
        <div class="product-heading">
          <div>
            <h1 id="audit-title">Aktivitas Saya</h1>
            <p id="audit-subtitle">Telusuri tindakan dan perubahan operasional Anda.</p>
          </div>
          <button id="audit-reload" class="queue-button" type="button" data-audit-action="reload">
            <svg class="icon icon--small" aria-hidden="true">
              <use href="#i-refresh"/>
            </svg>
            <span>Muat ulang</span>
          </button>
        </div>
        <div id="audit-feedback" class="product-feedback" role="status" tabindex="-1" hidden></div>
        <div id="audit-view">
          <section class="product-panel">
            <h2>Riwayat aktivitas</h2>
            <p>Aktifkan JavaScript untuk mencari dan membuka catatan contoh. Catatan hanya dapat dibaca.</p>
          </section>
        </div>
        <details class="product-preview-controls">
          <summary>Pilihan pratinjau</summary>
          <label for="audit-profile">Profil pratinjau</label>
          <select id="audit-profile">
            <option value="admin">Admin RylVa</option>
            <option value="superadmin">SuperAdmin RylVa</option>
          </select>
          <label for="audit-load-state">Kondisi data</label>
          <select id="audit-load-state">
            <option value="full">Data tersedia</option>
            <option value="loading">Sedang dimuat</option>
            <option value="error">Gagal dimuat</option>
            <option value="empty">Belum ada data</option>
          </select>
          <label for="audit-integrity">Pemeriksaan integritas contoh</label>
          <select id="audit-integrity">
            <option value="unknown">Belum ada hasil pemeriksaan</option>
            <option value="verified">Simulasi hasil sesuai</option>
            <option value="warning">Simulasi ketidaksesuaian</option>
          </select>
          <label class="product-check">
            <input id="audit-fail-load" type="checkbox">
            Simulasikan kegagalan muat berikutnya
          </label>
          <p>Data ilustrasi 4 November 2026. Profil hanya pratinjau, bukan otorisasi. Akses halaman dicatat di memori tab; modul lain belum tersinkronisasi.</p>
        </details>
        <footer class="queue-footer">
          <p>RylVa Green, Gudang Pusat</p>
          <p>Catatan contoh hanya baca; hilang saat refresh.</p>
        </footer>
      </main>` + html.slice(mainEnd);
html = html.replace(/  <dialog[\s\S]*?  <\/dialog>\r?\n/, "");
fs.writeFileSync("public/audit-log.html", html);

const pages = ["admin-dashboard", "financial-report", "orders-queue", "products",
  "production-materials", "customers", "closure-calendar", "bouquet-production", "audit-log"];
for (const page of pages)
{
  const path = `public/${page}.html`;
  let source = fs.readFileSync(path, "utf8");
  source = source.replace(/<a\b[^>]*title="Audit Log"[^>]*>/, (anchor) =>
  {
    return anchor.replace(/href="[^"]*"/, 'href="audit-log.html"')
      .replace(/ data-superadmin-only| hidden| style="display:none"/g, "")
      .replace('title="Audit Log"', 'title="Audit Log" data-audit-link data-role-link'
        + (page === "audit-log" ? ' aria-current="page"' : ""));
  });
  if (!source.includes('src="assets/js/shared/admin-audit-nav.js"'))
  {
    source = source.replace("</body>", '  <script src="assets/js/shared/admin-audit-nav.js" defer></script>\n</body>');
  }
  fs.writeFileSync(path, source);
}
