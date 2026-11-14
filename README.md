# RylVa Green

Proyek PHP Native untuk florist, tanaman hias dan gardening goods. Desain staf/Admin/SuperAdmin tersedia sebagai prototipe HTML interaktif. Backend dan layanan produksi masih memerlukan implementasi/integrasi; keberadaan folder PHP bukan bukti fitur sudah berfungsi.

## Mulai dari sini

- [Spesifikasi proyek v2.6](docs/specifications/spesifikasi-proyek-v2.6.md): acuan aturan bisnis.
- [PRODUCT.md](PRODUCT.md): konteks dan batas produk.
- [DESIGN.md](DESIGN.md): acuan desain global.
- [Daftar 20 halaman staf](docs/coverage/staff-ui-completion.md): cakupan desain yang sudah tersedia.
- [Panduan direktori](docs/architecture/project-structure.md): tempat menyimpan kode, dokumen dan hasil pemeriksaan.
- [Indeks dokumentasi](docs/README.md).

## Susunan proyek

```text
rylva-green/
  bin/                    Perintah console dan pekerjaan terjadwal PHP
  config/                 Konfigurasi dan rute aplikasi
  database/               Skema, migrasi dan seed
  docs/                   Spesifikasi, desain, cakupan dan panduan
  public/                 Document root
    pages/
      auth/               Login, aktivasi dan pemulihan staf
      staff/              Panel operasional dan halaman pendukung staf
      superadmin/         Pengelolaan khusus SuperAdmin
      customer/           Pratinjau UI transaksi pelanggan
    assets/
      css/
        shared/           Token dan komponen CSS bersama
        staff/            CSS per modul staf
        storefront/       CSS area pelanggan
      js/
        shared/           Shell, navigasi dan kontrol bersama
        staff/            JavaScript per modul staf
        storefront/       JavaScript area pelanggan
      fonts/
      images/
  src/                    Kode aplikasi PHP menurut lapisan/domain
  storage/                Unggahan, cache, log, backup dan laporan lokal
  templates/              Template PHP menurut area pengguna
  tests/
    e2e/browser/          Pemeriksaan UI melalui browser
    integration/
    unit/
  tools/
    maintenance/          Pemeriksaan struktur dan utilitas pemeliharaan
    preview/              Server/capture pengembangan
    testing/              Penghubung dependensi pengujian
    archive/              Percobaan dan generator lama, bukan kode aplikasi aktif
```

Folder tersembunyi `.agents`, `.hallmark`, `.impeccable` dan `.taste-skill` dipertahankan untuk konfigurasi serta jejak alat desain. Jangan menyajikannya sebagai document root. `vendor/` dikelola Composer.

## Kerapian repository GitHub

- `.agents/skills/` memuat skill proyek yang dapat dipakai bersama. `skills-lock.json` mencatat sumber/versinya.
- `README.md` tetap di root sebagai halaman pengantar repository. `PRODUCT.md` dan `DESIGN.md` merupakan konteks produk/desain yang dibaca alat; keduanya merupakan dokumentasi proyek, bukan skill.
- `.hallmark/` dan `.taste-skill/` merupakan workbench/cache lokal dan dikecualikan melalui `.gitignore`.
- Isi lokal `.impeccable/` dikecualikan, kecuali `config.json` dan `design.json` bila tersedia, karena keduanya dapat menjadi konfigurasi/otoritas bersama.
- `storage/reports/`, log pengembangan, `vendor/` dan `node_modules/` tidak ikut commit. Berkas lokal tetap tersedia saat bekerja.
- `.git/` merupakan metadata Git lokal dan otomatis bukan bagian isi repository yang diunggah; jangan dipindahkan ke folder skill.

## Pratinjau UI statis

Jalankan dari direktori proyek:

```powershell
node tools/preview/serve-dashboard.cjs
```

Buka [Dashboard Admin](http://127.0.0.1:4178/pages/staff/admin-dashboard.html) atau [Login Staf](http://127.0.0.1:4178/pages/auth/staff-login.html). Untuk profil SuperAdmin tambahkan `?role=superadmin` pada halaman panel yang mendukungnya. Parameter ini hanya pilihan pratinjau.

Server tersebut menyajikan HTML/aset dan tidak menjalankan PHP. Aplikasi PHP tetap menggunakan `public/index.php`, PHP 8.2+, Composer, PDO dan MySQL sesuai spesifikasi.

Pratinjau [Pembayaran pelanggan](http://127.0.0.1:4178/pages/customer/payment.html)
memakai data contoh dan QR yang tidak berisi instruksi pembayaran nyata.
[Workbench state Pembayaran](http://127.0.0.1:4178/__preview/payment) menyediakan
pilihan state dan gangguan tindakan; kontrol tersebut berada di alat pengembangan,
di luar document root. Lihat [cakupan UI Pembayaran](docs/coverage/payment-ui.md)
untuk batas integrasi dan cara pemeriksaannya.

Pratinjau [Detail Pesanan pelanggan](http://127.0.0.1:4178/pages/customer/order-detail.html)
menggunakan navbar/footer Figma yang sama dan terhubung dari Pembayaran.
Susunannya mengikuti referensi detail transaksi Tokopedia: rincian di kiri,
tindakan di kanan, serta dialog Lacak untuk informasi pengiriman.
[Workbench Detail Pesanan](http://127.0.0.1:4178/__preview/order-detail) memisahkan
50 skenario contoh dan gangguan tindakan dari alur pelanggan. Form pembatalan,
penerimaan, komplain dan banding hanya mengubah data contoh lokal. Lihat
[spesifikasi Detail Pesanan](docs/design/surfaces/order-detail-surface.md) dan
[cakupan UI Detail Pesanan](docs/coverage/order-detail-ui.md).

Pratinjau [Pesanan Saya](http://127.0.0.1:4178/pages/customer/my-orders.html)
menyediakan pencarian, filter status/tanggal, urutan dan pagination. Kartu
membuka Detail/Pembayaran untuk orderId yang sama; kembali memulihkan konteks
daftar. [Workbench Pesanan Saya](http://127.0.0.1:4178/__preview/my-orders)
memisahkan 29 skenario pengembangan dari alur pelanggan. Repository contoh
bersama tersimpan per tab, bukan backend atau autentikasi produksi. Lihat
[spesifikasi](docs/design/surfaces/my-orders-surface.md) dan
[cakupan UI Pesanan Saya](docs/coverage/my-orders-ui.md).

Pratinjau [Profil & Pengaturan Akun](http://127.0.0.1:4178/pages/customer/account.html)
menggunakan pola navigasi dan baris Ubah dari referensi Tokopedia, dengan shell
RylVa yang sama. Profil, alamat, keamanan dan privasi memakai data sintetis;
[workbench Akun](http://127.0.0.1:4178/__preview/account) memisahkan state dan
gangguan tindakan. Lihat [cakupan UI Akun](docs/coverage/customer-account-ui.md)
untuk batas autentikasi, email dan alur pemulihan yang belum terhubung.
Revisi berikutnya menambahkan Aktivitas Login contoh, Leaflet/geocoding,
disclosure wilayah, dropdown/status pesanan dan shell ponsel ringkas;
lihat [cakupan revisi pelanggan](docs/coverage/customer-refinements.md).

Alamat HTML lama dialihkan ke lokasi baru dengan parameter URL tetap dibawa. Pemetaan berada pada `config/preview-pages.json`; aturan kompatibilitas Apache berada pada `public/.htaccess`. Server statis Python biasa tidak membaca aturan pengalihan ini, sehingga gunakan server Node di atas untuk pratinjau proyek.

## Pemeriksaan

```powershell
node tools/maintenance/check-project-structure.cjs
node tests/e2e/browser/check-staff-pages.cjs
node tests/e2e/browser/verify-superadmin-review.cjs
node tests/e2e/browser/verify-workflows.cjs
```

Dengan server default 4178 tetap berjalan, jalankan pemeriksaan pelanggan pada
terminal lain. URL daftar dan detail disesuaikan karena kedua skrip itu default
ke 4179; Pembayaran dan shell memakai 4178.

```powershell
$env:RYLVA_MY_ORDERS_URL = 'http://127.0.0.1:4178/pages/customer/my-orders.html'
$env:RYLVA_ORDER_PREVIEW_URL = 'http://127.0.0.1:4178/pages/customer/order-detail.html'
node tests/e2e/browser/verify-my-orders.cjs
node tests/e2e/browser/verify-order-detail.cjs
node tests/e2e/browser/verify-payment.cjs
node tests/e2e/browser/verify-storefront-shell.cjs
```

Pengujian akun memakai port 4180 secara default. Untuk server default 4178:

```powershell
$env:RYLVA_ACCOUNT_URL = 'http://127.0.0.1:4178/pages/customer/account.html'
node tests/e2e/browser/verify-account.cjs
```

Pemeriksaan browser membutuhkan server pratinjau, Chrome serta `puppeteer-core`. Penghubung `tools/testing/browser-runtime.cjs` menggunakan runtime lokal yang sudah tersedia di `.hallmark/runtime`; lokasi alternatif dapat diberikan melalui `RYLVA_PUPPETEER_PATH`. Jalankan skrip uji dari root proyek.

Hasil pemeriksaan disimpan di `storage/reports/` atau direktori bukti alat yang sudah digunakan sebelumnya. Skrip di `tools/archive/` merupakan arsip pengerjaan; jangan menjalankannya untuk membangun ulang aplikasi saat ini.
