# Routing query pada Dza Software

Tanggal pemeriksaan: 21 November 2026. Domain: `https://rylvagreen.biz.id`. Keputusan terbaru pengguna: admin hosting tidak mengizinkan perubahan Nginx; gunakan fallback aplikasi.

## Temuan langsung

- FTP sekarang dapat melihat folder domain dan membuat direktori privat di sebelahnya.
- Kode aplikasi serta konfigurasi privat telah diunggah dengan checksum yang diperiksa lewat FTP.
- HTTPS domain valid. `/index.php` dan `/` mencapai aplikasi: anonim menerima 401; akun peninjau menerima 302 menuju halaman beranda.
- `/pages/public/home.html` serta `/catalog.html` masih menerima 404 dari Nginx sebelum mencapai PHP. `.htaccess` tidak mengatur routing Nginx ini.
- Tidak ada installer atau skrip PHP diagnostik sementara yang digunakan. Tidak ada operasi database.

## Keputusan yang diterapkan

Routing memakai `/index.php?route=/pages/public/home.html`, tanpa perubahan konfigurasi hosting. Parameter halaman seperti `q`, `category`, `page`, `guide` dan `returnTo` dipertahankan di luar parameter `route`. Fragmen artikel tetap berada setelah `#`.

Alasan memilih query: `/index.php` sudah terbukti dieksekusi oleh host; bentuk `/index.php/...` masih bergantung pada dukungan PATH_INFO/FastCGI. Query tidak memerlukan dukungan tersebut.

Gateway memvalidasi route lokal dan menolak traversal, URL eksternal, backslash, query/fragmen yang disisipkan ke path, serta nilai non-string. Redirect aplikasi ditulis ulang ke entry point. HTML dan JavaScript tetap memakai URL logis melalui adapter rilis; aset tetap dilayani dari `/assets/`.

Contoh Nginx di `deploy/nginx/ftp-staging-routing.conf.example` merupakan alternatif yang tidak diterapkan. Tidak ada permintaan perubahan konfigurasi hosting yang masih diperlukan untuk mode query ini.

## Pemeriksaan mode query

1. Tanpa akun peninjau, `/index.php?route=/pages/public/home.html` harus mengembalikan 401 dengan tantangan Basic.
2. Dengan akun peninjau, halaman tersebut harus mengembalikan 200 dan `X-Robots-Tag: noindex`.
3. `/index.php?route=/catalog.html&q=tanaman&page=2` harus mengembalikan 302 menuju route katalog dengan query tetap tersimpan.
4. Alamat yang tidak ditemukan harus memakai halaman error botani dengan status 404.
5. Berkas privat dan dotfile tetap tidak dapat diakses.

Jalankan `node tools/testing/verify-ftp-staging.cjs` dan `node tools/testing/verify-query-navigation.cjs`. Kredensial dibaca dari `config/staging-review.local.json` yang diabaikan Git; jangan tempel sandinya pada chat atau laporan. Alamat lama tanpa entry point dapat tetap 404 pada hosting ini; seluruh tautan aplikasi memakai mode query.

Staging belum dianggap selesai sampai pemeriksaan tersebut dan render browser benar-benar lulus. Login bisnis, transaksi, koneksi database online dan integrasi vendor tidak dibuktikan oleh berhasilnya entry point PHP.
