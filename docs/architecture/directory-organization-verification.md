# Hasil reorganisasi direktori

Reorganisasi memindahkan **306 berkas** dan memperbarui **141 berkas teks** pada tahap pemindahan utama. Pemetaan lokasi serta hash sebelum/sesudah tersedia di `directory-migration.json`. Penyesuaian lanjutan memperjelas pemisah jalur dokumen, lokasi output screenshot dinamis dan pemuatan runtime uji bersama.

## Hasil

- Aset dipisahkan menjadi `shared`, `staff` per modul, dan `storefront`; URL dua puluh halaman staf tetap.
- Spesifikasi memiliki satu ekstensi `.md` dan berada pada `docs/specifications/`. Acuan desain lama berada pada arsip; PRODUCT.md dan DESIGN.md tetap menjadi acuan root.
- Brief desain, cakupan, keputusan dan panduan memiliki direktori masing-masing.
- Skrip browser berada pada `tests/e2e/browser/`; utilitas pratinjau dan arsip generator berada pada `tools/`.
- Dua percobaan HTML dan bukti `.hallmark` dikeluarkan dari document root dan dipertahankan sebagai arsip/laporan.
- Root `.hallmark` hanya menyimpan konfigurasi standar; catatan per proses berada di subfolder. Runtime serta konvensi direktori alat dipertahankan.
- README root, indeks dokumentasi dan panduan struktur ditambahkan. Tidak ada dependensi baru yang dipasang atau data proyek yang dihapus.

## Pemeriksaan

- Pemeriksaan statis: **20 halaman**, **24 stylesheet**, **48 JavaScript**, **453 rujukan lokal**; tidak ada rujukan hilang. Sintaks seluruh JavaScript publik lulus.
- Pemeriksaan manifest sesaat setelah pemindahan memastikan seluruh sumber sudah berpindah, semua tujuan ada, dan berkas biner yang dipindahkan tidak berubah. Hash bersifat rekaman migrasi, bukan pengunci berkas pengembangan yang boleh diedit kemudian.
- Browser: **40 kombinasi halaman/viewport**, masing-masing halaman pada 390 dan 1440 px; judul dan Poppins tersedia, tanpa luapan horizontal, tanpa resource lokal gagal atau error JavaScript. Permintaan favicon bawaan browser yang tidak dirujuk halaman dikecualikan.
- Regresi review SuperAdmin: **70 layout dan alur lulus**, 0 error browser, memakai skrip dari direktori baru.
- Regresi workflow pesanan: **24 kelompok pemeriksaan lulus**, 0 error browser, dijalankan dari direktori baru; hasilnya berada pada laporan modul yang sudah digunakan sebelumnya.
- Menjalankan utilitas reorganisasi kembali menghasilkan **0 perpindahan**, tanpa perubahan.

## Perluasan ke berkas halaman

Setelah peninjauan pengguna, 20 HTML yang sebelumnya masih berada pada root `public/` dipisahkan menjadi `pages/auth/` (1), `pages/staff/` (13) dan `pages/superadmin/` (6). Rujukan aset serta tautan lintas area diperbarui. Helper query mempertahankan jalur lengkap, bukan hanya basename. Tidak ada stub pengalihan HTML tambahan di root.

Kompatibilitas alamat lama ditangani oleh `tools/preview/serve-dashboard.cjs` dan `public/.htaccess`. Peta 20 alamat dan target disimpan di `config/preview-pages.json`. Server pratinjau pada port 4178 diperbarui agar pengalihan ini bekerja saat ditinjau dalam browser aplikasi.

Pemeriksaan setelah pemindahan HTML: 40 tampilan halaman, 20 pengalihan dengan query utuh, 70 layout/alur review SuperAdmin, 45 layout/alur koreksi, 65 layout/alur pendukung staf dan 24 kelompok workflow pesanan lulus tanpa error browser. Penanda `data-support-page`/`data-review-page` mempertahankan nama halaman sebagai identitas stabil; URL navigasinya mengikuti lokasi baru. Aturan Apache diperiksa kesesuaiannya terhadap peta halaman secara statis, belum melalui server Apache pada pemeriksaan ini.

Laporan mesin berada pada `storage/reports/project-structure/static-check.json` dan `browser-check.json`. Laporan/screenshot di storage adalah hasil lokal dan tidak wajib ikut version control. Pemeriksaan struktur normal tidak mewajibkan cache/bukti hasil uji tersedia pada checkout baru.
