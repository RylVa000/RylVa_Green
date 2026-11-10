# Panduan struktur proyek

Struktur disusun berdasarkan tanggung jawab. Root hanya memuat konfigurasi dependensi, acuan produk/desain dan pintu masuk dokumentasi. Detail perpindahan berkas lama ke baru tercatat pada `directory-migration.json` di folder ini.

## Kode dan halaman

- `public/` adalah document root; root menyimpan `index.php`, aturan server, robots dan sitemap.
- `public/pages/auth/` menyimpan satu halaman login/aktivasi/pemulihan; `public/pages/staff/` menyimpan 13 halaman staf; `public/pages/superadmin/` menyimpan enam halaman khusus SuperAdmin.
- Alamat HTML lama dialihkan melalui server pratinjau Node dan aturan Apache, termasuk query string. Pemetaan ada pada `config/preview-pages.json`; manifest pemindahan halaman ada pada `page-directory-migration.json`.
- `public/assets/css/shared/` menyimpan token, base dan komponen CSS yang dipakai beberapa modul.
- `public/assets/js/shared/` menyimpan shell, navigasi dan kontrol JavaScript bersama.
- `public/assets/{css,js}/staff/` memisahkan modul `accounts`, `auth`, `calendar`, `catalog`, `customers`, `dashboard`, `inventory`, `orders`, `production`, `reports`, `superadmin` dan `support` sesuai aset yang tersedia.
- `public/assets/{css,js}/storefront/` menampung aset pelanggan. Berkas kerangka di sana tidak dianggap fitur pelanggan yang sudah selesai.
- `public/assets/fonts/` dan `public/assets/images/` memuat aset yang benar-benar dipakai halaman. Folder `img/` yang masih berupa kerangka tidak dipakai sebagai lokasi baru untuk gambar.
- `src/`, `templates/`, `config/`, `database/` dan `bin/` mempertahankan pemisahan backend yang sudah ada. Namespace PSR-4 dan titik masuk PHP tidak dipindahkan.

Perubahan lokasi aset harus memperbarui atribut HTML, rujukan template, jalur dinamis JavaScript, import CSS dan URL font/gambar. Import CSS relatif dihitung dari lokasi stylesheet, bukan halaman HTML.

Seluruh halaman HTML berada pada kedalaman folder yang sama (`pages/<area>/`). Halaman menggunakan `../../assets/` untuk aset dan `../<area>/<halaman>.html` untuk navigasi. Helper yang memperbarui query mempertahankan pathname lengkap agar tautan lintas area tidak berubah menjadi nama berkas saja.

## Pengujian dan alat

- `tests/e2e/browser/`: skrip `verify-*.cjs` dan pemeriksaan pemuatan halaman. Pengujian PHP yang sudah ada tetap berada di direktori tes semula.
- `tools/testing/browser-runtime.cjs`: satu penghubung runtime Puppeteer untuk skrip browser yang dipindahkan.
- `tools/preview/`: utilitas server pratinjau dan pengambilan screenshot.
- `tools/maintenance/`: pemeriksaan jalur/aset dan catatan utilitas reorganisasi. Skrip reorganisasi berhenti tanpa perubahan jika tidak ada perpindahan yang tersisa.
- `tools/archive/generators/`: generator/formatter lama sebagai arsip. Skrip ini dapat memuat asumsi struktur pada saat dibuat dan bukan perintah build yang didukung untuk aplikasi sekarang.
- `tools/archive/prototypes/`: `g1.html` dan `tes.html`, percobaan lama yang tidak termasuk dua puluh halaman aktif.
- `tools/archive/design-workbench/`: snapshot/sumber referensi pengerjaan lama.

Jalankan skrip browser dari root agar lokasi output dan document root konsisten. Runtime dependensi `.hallmark/runtime` dipertahankan; pemindahan ini tidak memasang paket baru.

## Laporan dan metadata alat

- `storage/reports/hallmark/screenshots/`: screenshot yang sebelumnya bercampur di root `.hallmark`.
- `storage/reports/hallmark/reports/`: laporan verifikasi dan data pendukung pemeriksaan lama.
- `storage/reports/legacy-public-preview/`: bukti pratinjau lama yang sebelumnya berada dalam `public/.hallmark`.
- `storage/reports/project-structure/`: hasil pemeriksaan reorganisasi.
- `storage/logs/development/`: log server/pratinjau pengembangan.
- `.hallmark/log.json` dan `.hallmark/preflight.json`: lokasi standar alat tetap.
- `.hallmark/entries/` dan `.hallmark/preflights/`: catatan per proses/modul.
- `.impeccable/` dan `.taste-skill/`: metadata dan bukti milik alat, dipertahankan agar alur alat tetap kompatibel.

Untuk version control, `.hallmark/` dan `.taste-skill/` diabaikan seluruhnya. `.impeccable/` hanya menyertakan `config.json` dan `design.json` bila ada; hasil review, seed dan bukti lokal tidak disertakan. Skill sumber tetap di `.agents/skills/`. README.md, PRODUCT.md dan DESIGN.md tetap di root untuk pengantar repository serta penemuan konteks otomatis. Folder `.git` tidak pernah menjadi isi commit dan tidak dipindahkan.

Tidak ada data pengguna atau berkas proyek yang dihapus sebagai bagian pemindahan ini. Folder publik tidak lagi memuat dua percobaan lama maupun bukti `.hallmark`. Penyimpanan laporan tidak merupakan bagian yang perlu disajikan ke pengunjung.
