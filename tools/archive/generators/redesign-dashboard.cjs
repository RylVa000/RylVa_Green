const fs = require('node:fs');
const file = 'public/admin-dashboard.html';
const backup = 'tools/archive/design-workbench/original-dashboard.html';
if (!fs.existsSync(backup)) fs.copyFileSync(file, backup);
const original = fs.readFileSync(backup, 'utf8');
const icon = (name, small = false) => `<svg class="icon${small ? ' icon--small' : ''}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const symbols = original.match(/<svg xmlns="http:\/\/www.w3.org\/2000\/svg"[\s\S]*?<\/svg>/)[0].replace(/class="[^"]*"/, 'class="symbol-library"');
const navItems = [
 ['#Operasional','home','Operasional',false],['#pesanan','orders','Manajemen Pesanan',false],
 ['#inventory','box','Produk &amp; Varian',false],['#inventory','flower','Bahan Produksi',false],
 ['#pesanan','users','Pelanggan',false],['#ringkasan','calendar','Kalender Tutup',false],
 ['financial-report.html','audit','Laporan Keuangan',true],['#ringkasan','audit','Audit Log',true],['#ringkasan','settings','Pengaturan Sistem',true]
];
const nav = navItems.map(([href,i,label,restricted], index) => `<a href="${href}" class="nav-item" title="${label.replace('&amp;', '&')}"${index === 0 ? ' aria-current="page"' : ''}${restricted ? ' data-superadmin-only style="display:none"' : ''}>${icon(i)}<span class="sidebar-label">${label}</span></a>`).join('\n');
let logic = original.slice(original.lastIndexOf('<script>') + 8, original.lastIndexOf('</script>'));
// Only presentation templates and accessibility are changed; the source data and handlers stay.
logic = logic.replaceAll(' · ', ', ').replaceAll('–', ' hingga ').replaceAll('overflow-hidden', 'menu-open');
logic = logic.replace(/<svg class="h-3 w-3 flex-none fill-none stroke-current stroke-2"/g, '<svg class="icon icon--small"');
logic = logic.replace('class="flex flex-wrap gap-1"', 'class="status-stack"');
logic = logic.replace('class="w-full text-[12px] text-primary-dark"', 'class="shipping-reason"');
logic = logic.replace(/<tr class="order-row align-middle">[\s\S]*?<\/tr>/, `<tr class="order-row">
              <td><strong class="order-number tabular">\${order.no}</strong><span class="order-secondary">\${order.product}</span><span class="order-secondary order-customer-fallback">\${order.customer}</span></td>
              <td>\${order.customer}</td>
              <td><span class="order-date">\${order.date}</span><span class="order-secondary">\${order.slot}</span></td>
              <td>\${renderBadgeGroup(order)}</td>
              <td class="order-total tabular">\${formatRupiah(order.total)}</td>
            </tr>`);
logic = logic.replace(/<article class="rounded-xl[\s\S]*?<\/dl>/, `<article class="mobile-order">
              <div class="mobile-order-head"><div><strong class="tabular">\${order.no}</strong><p>\${order.product}<br>\${order.customer}</p></div><strong class="tabular">\${formatRupiah(order.total)}</strong></div>
              <p>\${order.date}<br>\${order.slot}</p>
              <dl>
                <div><dt class="sr-only">Status pesanan</dt><dd>\${renderStatusBadge(order.order, orderStatusKind)}</dd></div>
                <div><dt class="sr-only">Status pembayaran</dt><dd>\${renderStatusBadge(getPaymentLabel(order), paymentStatusKind)}</dd></div>
                <div><dt class="sr-only">Status pengiriman</dt><dd>\${renderStatusBadge(order.shipping, shippingStatusKind)}</dd></div>
              </dl>`);
logic = logic.replace('class="mt-2 text-[12px] text-primary-dark"', 'class="shipping-reason"');
logic = logic.replace('class="px-5 py-10 text-center text-[13px] text-muted-ink"', 'class="empty-state"');
logic = logic.replace('class="py-8 text-center text-[13px] text-muted-ink"', 'class="empty-state"');
// These classes were Tailwind-only styling. aria-selected remains the source of tab state.
logic = logic.replace(/        item\.classList\.toggle\([^\n]+\);\s*/g, '');
logic = logic.replace("document.getElementById('order-count').textContent", "document.getElementById('order-count').textContent");
// Keep the existing menu handling and add the keyboard containment its overlay needs.
logic += `
    const navControls = () => Array.from(sidebarElement.querySelectorAll('a, button')).filter(el => el.getClientRects().length);
    document.addEventListener('keydown', function(event) {
      if (event.key !== 'Tab' || mobileOpenBtn.getAttribute('aria-expanded') !== 'true') return;
      const controls = navControls();
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    filterTabs.forEach((tab, index) => tab.addEventListener('keydown', event => {
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % filterTabs.length;
      else if (event.key === 'ArrowLeft') next = (index + filterTabs.length - 1) % filterTabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = filterTabs.length - 1;
      else return;
      event.preventDefault(); filterTabs[next].click(); filterTabs[next].focus();
    }));
`;
const tailwind = `<script src="https://cdn.tailwindcss.com"></script>
  <script>if (window.tailwind) { tailwind.config = {corePlugins: {preflight: false}, theme: {extend: {fontFamily: {sans: ['var(--font-body)']}, colors: {'primary-dark': 'var(--primary-dark)', primary: 'var(--primary)', 'primary-light': 'var(--primary-light)', 'neutral-soft': 'var(--neutral-soft)', background: 'var(--background)', 'card-background': 'var(--card-background)', 'muted-ink': 'var(--color-muted)'}}}}; }</script>`;
const stockRows = [['Tanaman hias varian','144 / 180','80%'],['Pot','88 / 110','80%'],['Media tanam','75 / 100','75%'],['Alat berkebun','61 / 82','74.4%']].map(([label,amount,level]) => `<div class="stock-row"><div class="stock-row-head"><span>${label}</span><strong class="tabular">${amount}</strong></div><div class="stock-track" style="--stock-level:${level}" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${parseFloat(level)}" aria-valuetext="${amount}"><span></span></div></div>`).join('\n');
const restock = [['Monstera','DEMO-M01','2 pot'],['Sirih gading','DEMO-S01','3 pot'],['Pot terakota','DEMO-P01','4 unit'],['Media tanam','DEMO-T01','1 sak']].map(([name,sku,count]) => `<li><span>${name}<code class="sku">${sku}</code></span><strong class="tabular">${count}</strong></li>`).join('\n');
let html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#FBF7F4">
  <meta name="description" content="Dashboard operasional RylVa Green untuk memantau antrean pesanan, pengiriman, pembayaran, dan stok toko.">
  <title>Dashboard Admin | RylVa Green</title>
  <link rel="stylesheet" href="assets/css/staff/dashboard/dashboard.css">
  ${tailwind}
</head>
<body>
  ${symbols}
  <a href="#Operasional" class="skip-link">Lewati navigasi</a>
  <div id="mobile-backdrop" class="mobile-backdrop hidden" aria-hidden="true"></div>
  <div class="app-shell">
    <aside id="sidebar" class="sidebar -translate-x-full" aria-label="Navigasi utama">
      <div class="brand-row">
        <a href="#Operasional" class="brand-lockup" aria-label="RylVa Green, Operasional"><span class="brand-mark">${icon('leaf')}</span><span class="sidebar-label"><strong class="brand-name">RylVa Green.</strong><small class="brand-caption">Plant &amp; Florist</small></span></a>
        <button id="sidebar-toggle" class="icon-button collapse-button" type="button" aria-label="Kecilkan sidebar" aria-expanded="true" aria-controls="sidebar-nav"><svg id="collapse-icon" class="icon icon--small" aria-hidden="true"><use href="#i-chevron"/></svg></button>
        <button id="mobile-close" class="icon-button mobile-control" type="button" aria-label="Tutup menu">${icon('close')}</button>
      </div>
      <div class="workspace sidebar-extra"><div class="workspace-card">${icon('box')}<span class="sidebar-label"><strong>Gudang Pusat</strong><small>Ruang kerja toko</small></span></div></div>
      <nav id="sidebar-nav" class="sidebar-nav" aria-label="Menu admin">${nav}</nav>
      <div class="sidebar-foot">
        <div class="help-block sidebar-extra">${icon('help')}<strong>Butuh Bantuan?</strong><p>Panduan operasional untuk tim RylVa Green.</p></div>
        <div class="profile-row"><span class="profile-avatar">AR</span><span class="sidebar-label"><strong id="profile-name">Admin RylVa</strong><small>Gudang Pusat</small></span></div>
      </div>
    </aside>
    <div class="workspace-main">
      <header class="topbar">
        <div class="topbar-leading"><button id="mobile-open" class="icon-button mobile-control" type="button" aria-label="Buka menu" aria-expanded="false" aria-controls="sidebar">${icon('menu')}</button><p class="breadcrumb">Ruang kerja <span aria-hidden="true">/</span><strong>Operasional</strong></p></div>
        <div class="topbar-account"><span id="preview-role" class="role-caption">Pratinjau Admin</span><span aria-label="Contoh notifikasi">${icon('bell')}</span><span class="profile-avatar" aria-label="Admin RylVa">AR</span></div>
      </header>
      <main id="Operasional" class="dashboard">
        <section id="ringkasan" class="page-heading" aria-labelledby="page-title">
          <div><h1 id="page-title">Prioritas operasional</h1><p>Selesaikan pengiriman hari ini dan tugas yang melewati tenggat.</p></div>
          <div class="heading-actions"><span class="date-label">${icon('calendar',true)}28 Oktober 2026, WIB</span><a href="#pesanan" class="button-primary">Lihat pesanan</a></div>
        </section>
        <div role="alert" class="attention-strip">${icon('alert')}<p><strong>Perlu perhatian sekarang:</strong> 1 refund melewati tenggat dan 4 produk berada di ambang stok rendah.</p><a href="#tasks-title" class="text-link">Lihat prioritas</a></div>
        <section class="stat-section" aria-labelledby="overview-title">
          <h2 id="overview-title">Situasi hari ini</h2>
          <div class="stat-strip">
            <article class="stat"><h3>Siap diproses</h3><strong class="stat-value tabular">12</strong><p><span>Antrean</span><span>menunggu tindakan</span></p></article>
            <article class="stat"><h3>Kirim hari ini</h3><strong class="stat-value tabular">8</strong><p><span>Hari ini</span><span>jatuh tempo, WIB</span></p></article>
            <article class="stat"><h3>Pembayaran ditinjau</h3><strong class="stat-value tabular">3</strong><p id="payment-metric-caption"><span>Periksa</span><span>dan eskalasi kasus</span></p></article>
            <article class="stat"><h3>Peringatan stok rendah</h3><strong class="stat-value tabular">4</strong><p><span>Perlu perhatian</span><span>≤ 5 unit, P-22</span></p></article>
          </div>
        </section>
        <div class="work-grid">
          <section id="pesanan" class="orders-section" aria-labelledby="orders-title">
            <div class="section-heading"><div><div class="heading-with-count"><h2 id="orders-title">Antrean pesanan</h2><span id="order-count" class="count-label">6 pesanan</span></div><p>Jadwal kirim dan status yang perlu ditindaklanjuti.</p></div><a href="#pesanan" class="text-link">Lihat semua</a></div>
            <div class="orders-toolbar">
              <label class="search-field" for="search-orders">${icon('search',true)}<input id="search-orders" type="search" placeholder="Cari pesanan…" aria-label="Cari pesanan"></label>
              <div class="filter-tabs" role="tablist" aria-label="Filter pesanan"><button type="button" class="filter-tab" data-filter="all" role="tab" aria-selected="true">Semua</button><button type="button" class="filter-tab" data-filter="Siap Diproses" role="tab" aria-selected="false">Siap diproses</button><button type="button" class="filter-tab" data-filter="Sedang Disiapkan" role="tab" aria-selected="false">Disiapkan</button><button type="button" class="filter-tab" data-filter="Dikirim" role="tab" aria-selected="false">Dikirim</button></div>
            </div>
            <div class="orders-table-wrap"><table class="orders-table" aria-label="Pesanan terbaru"><thead><tr><th scope="col">No. pesanan</th><th scope="col">Pelanggan</th><th scope="col">Jadwal kirim</th><th scope="col">Pesanan / Bayar / Kirim</th><th scope="col">Total</th></tr></thead><tbody id="orders-table"></tbody></table></div>
            <div id="orders-cards" class="orders-cards"></div>
            <div class="orders-footer"><span id="order-summary" aria-live="polite">Menampilkan 6 dari 6 pesanan contoh</span><button id="clear-filter" class="clear-filter" type="button">Hapus filter</button></div>
          </section>
          <div class="right-column">
            <section aria-labelledby="tasks-title"><div class="section-heading"><div><h2 id="tasks-title">Perlu ditindaklanjuti</h2><p>Urut menurut tenggat.</p></div><span class="count-label">4 tugas</span></div>
              <div class="urgent-task"><div class="urgent-title"><h3>Pembatalan / refund</h3><span class="deadline">Lewat 15 menit</span></div><p>Admin RylVa, Tinjau keputusan dan bukti pesanan.</p></div>
              <ul class="task-list"><li><span><strong>PH-06, Selisih stok</strong><small>Sisa 45 menit</small></span><span class="task-action">Tangani</span></li><li><span><strong>Pengiriman terkendala</strong><small>Sisa 1 jam</small></span><span class="task-action">Periksa</span></li><li><span><strong>Komplain terbuka</strong><small>Sisa 2 jam</small></span><span class="task-action">Tinjau</span></li></ul>
            </section>
            <section aria-labelledby="payment-review-title"><div class="section-heading"><div><h2 id="payment-review-title">Pembayaran ditinjau</h2><p>Tiga kasus menunggu pemeriksaan.</p></div>${icon('info',true)}</div>
              <ul class="review-list"><li><span><strong>DEMO-004</strong><small>PH-03, Nominal tidak cocok</small></span><span>Periksa</span></li><li><span><strong>DEMO-005</strong><small>PH-02, Pembayaran terlambat</small></span><span>Periksa</span></li><li><span><strong>DEMO-006</strong><small>Selisih rekonsiliasi</small></span><span>Eskalasi</span></li></ul>
              <p id="payment-review-note" class="review-note">Rekonsiliasi manual diteruskan ke SuperAdmin.</p>
            </section>
          </div>
        </div>
        <div class="stock-grid">
          <section id="inventory" aria-labelledby="inventory-title"><div class="section-heading"><div><h2 id="inventory-title">Peta stok</h2><p>Merchandise dan bahan produksi dipantau terpisah.</p></div>${icon('box')}</div>
            <div class="stock-summary"><p><strong class="tabular">368</strong>unit<small>Merchandise</small></p><p><strong class="tabular">186</strong>unit<small>Bahan buket</small></p></div>
            <p class="stock-domain-note">Dua domain stok aktif</p>
            <div class="stock-domain-head"><h3>Stok merchandise</h3><span>Tersedia / kapasitas</span></div><div class="stock-rows">${stockRows}</div>
            <div class="stock-materials"><div class="stock-domain-head"><h3>Bahan produksi buket</h3><span class="tabular">186 / 300</span></div><div class="stock-track" style="--stock-level:62%" role="meter" aria-label="Bahan produksi buket" aria-valuemin="0" aria-valuemax="300" aria-valuenow="186"><span></span></div><p>Bunga potong, kertas wrapping, pita, dan pelengkap.</p></div>
          </section>
          <section class="restock-section" aria-labelledby="restock-title"><div class="section-heading"><div><h2 id="restock-title">Prioritas restok</h2><p>Empat varian perlu diperiksa sebelum stok habis.</p></div>${icon('alert',true)}</div><p class="stock-threshold">P-22, ambang 5 unit</p><ul class="restock-list">${restock}</ul><div class="restock-totals"><div><strong class="tabular">2</strong><span>Varian tanaman</span></div><div><strong class="tabular">2</strong><span>Barang pendukung</span></div></div><p class="stock-rule">Stok tersedia ≤ 5 unit per produk.</p></section>
        </div>
        <footer class="dashboard-footer"><span>RylVa Green, Tumbuh bersama setiap hari.</span><span>Pratinjau desain, Data ilustrasi</span></footer>
      </main>
    </div>
  </div>
  <script>${logic}</script>
</body>
</html>
`;
const vm = require('node:vm');
const elements = new Map();
const element = id => {
  if (!elements.has(id)) elements.set(id, {value: '', innerHTML: '', textContent: ''});
  return elements.get(id);
};
vm.runInNewContext(logic.slice(0, logic.indexOf('    filterTabs.forEach(function (tab)')) + '\nrenderOrders();', {
  URLSearchParams, Intl, window: {location: {search: ''}},
  document: {getElementById: element, querySelectorAll: () => []}
});
html = html.replace('<tbody id="orders-table"></tbody>', `<tbody id="orders-table">${element('orders-table').innerHTML}</tbody>`)
  .replace('<div id="orders-cards" class="orders-cards"></div>', `<div id="orders-cards" class="orders-cards">${element('orders-cards').innerHTML}</div>`);
fs.writeFileSync(file, html);
console.log('Recomposed public/admin-dashboard.html; source backup retained in .hallmark.');
