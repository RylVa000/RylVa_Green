# Penyelesaian audit UI publik — 20 November 2026

Seluruh 11 temuan dalam [audit awal](public-ui-final-audit-2026-11-20.md) telah ditangani. Cakupan tetap 34 route: 21 publik, 8 pelanggan, dan 5 autentikasi pelanggan. Identitas hijau/krem, font Poppins, kartu produk dua kolom di ponsel, serta header yang bersembunyi saat menggulir turun tetap dipertahankan.

## Penyelesaian temuan

| Temuan | Perubahan | Bukti hasil |
| --- | --- | --- |
| F01 — kontras shell | Sage header/footer menjadi `#4D725C`; teks promo putih; HOT memakai latar terpisah `#B33232`; utility memakai `#526452`. | Label akun 5,14:1; footer putih 5,42:1; promo 8,36:1; HOT 6,14:1; utility 6,03:1. Semuanya di atas 4,5:1. |
| F02 — klaim pemasaran lama | Enam header pelanggan memakai “Pilihan kurir sesuai alamat” dan “Pantau status pesanan Anda”. Penanda pengembalian lama dihapus. | Klaim gratis ongkir Rp200.000 dan pengembalian 7 hari tidak lagi ada pada header pelanggan. Tidak ada aturan promosi baru. |
| F03 — Inter pada footer | Footer memakai Poppins; deklarasi/pemuatan Inter di shell dihapus. | CDP mengonfirmasi `Poppins-Bold` aktual pada tombol judul footer. Tidak ada permintaan Inter. |
| F04 — banner Kontak/FAQ | Breadcrumb, judul 36px desktop/28px ponsel, teks putih terpusat, dan resep banner informasi digunakan kembali. Kontak dan FAQ memakai judul Indonesia. | Diperiksa pada 1440, 768, 390, dan 320px. Kartu Kontak/FAQ yang bertumpuk dengan banner tetap utuh. Nomor, email, lokasi, serta jam layanan sumber dipertahankan. |
| F05 — harga panjang | Aturan kartu bersama membungkus nominal panjang dan menempatkan satuan pada baris berikutnya. Koreksi lokal koleksi yang berulang dihapus. | Beranda, Katalog, Kategori, dan Koleksi Baru menampilkan nominal `Rp 1.250.000.000` lengkap pada 320px, dengan harga 14px dan satuan 12px tanpa overflow. |
| F06 — caption terlalu kecil | Status stok, satuan harga, dan HOT menggunakan 12px. Badge stok ponsel ditempatkan di area foto terpisah dari diskon. | Kartu dua kolom dan kontrol belanja 44px tetap dipertahankan; alignment pasangan kartu diperiksa melalui capture. |
| F07 — bobot aset | Empat Poppins dikompresi menjadi WOFF2 tanpa subset; galeri memakai WebP, varian 360px, serta thumbnail 160px. Preload 600 dihapus setelah dua permintaan jaringan terkonfirmasi. | Empat face mempertahankan peta karakter dan jumlah glyph; setiap face kini diminta sekali. Ketiga foto galeri dapat dipilih dan thumbnail termuat. |
| F08 — pengujian lama/timing | Assertion mengikuti route dan state yang tersedia; penantian memakai kesiapan konten, font, serta posisi header. Skenario buket menunggu pemuatan aset, dengan retry berurutan dan pencegahan klik ganda. Profil browser pengujian informasi dibuat baru tiap run. | Semua 27 suite regresi awal lulus setelah perbaikan/pengujian ulang. Dua suite tambahan juga lulus. Kegagalan awal tetap tersimpan pada log. |
| F09 — tanggal pembayaran contoh | Tanggal kirim dibuat H+1 dari clock fixture yang sama, dalam WIB. | Uji sebelum/sesudah tengah malam WIB dan pergantian tahun menghasilkan tanggal yang benar. Tidak mengubah pesanan produksi atau snapshot lama yang tersimpan. |
| F10 — favicon | Semua 34 route mendeklarasikan SVG favicon proyek yang sama. | Pemeriksaan terakhir juga menemukan favicon Cart yang belum dideklarasikan; sudah diperbaiki dan cold navigation Cart tidak lagi mendapat respons aset 404. |
| F11 — rupiah | Formatter tampilan bersama menghasilkan `Rp 128.999`, tanpa mengubah nilai integer atau perhitungan adapter. Satuan menggunakan pemisah yang terbaca. | Kartu, panel header, detail produk, buket, keranjang, checkout, daftar/detail pesanan, serta pembayaran memakai format yang sama. Nilai hilang tetap memiliki pesan fallback. |

## Perbaikan tambahan yang ditemukan saat verifikasi

- Logo autentikasi tertutup area padding formulir. `z-index` logo diperbaiki agar klik kembali ke Akun berfungsi; tombol jeda animasi tetap berada di atas artwork.
- Kembali dari Akun ke Pesanan Saya memunculkan pesan perubahan status sesudah pemulihan gulir. Pesan itu menambah tinggi layout dan menggeser posisi. Pesan kini hanya muncul ketika pesanan terkait memang tidak lagi ada dalam hasil; perubahan layout dilakukan sebelum posisi/fokus dipulihkan. Suite Akun dan Pesanan Saya lulus kembali.
- Teks navigasi aktif pada panel opsi buket terukur 4,47:1. Warna lokal menjadi `primary-dark`; pemeriksaan akhir tidak lagi menemukan kegagalan kontras solid pada state default yang diuji.
- Runtime browser mempertahankan `CHROME_PATH` eksplisit dan menggunakan browser Chromium lain yang terpasang bila lokasi default hilang. Chrome tidak lagi tersedia pada lokasi awal saat pekerjaan berlangsung; verifikasi akhir dilanjutkan di Edge. Tidak ada instalasi atau perubahan browser pengguna.

## Verifikasi

- **29 suite lulus:** 27 suite regresi, `verify-storefront-shell.cjs`, dan `verify-public-ui-fixes.cjs`; total 475 kelompok pemeriksaan.
- **136 kondisi render:** 34 route pada lebar 1440, 768, 390, dan 320px. Hasil akhir: nol overflow halaman, nol error JavaScript, nol temuan kontras teks pada latar solid yang diukur.
- Semua 17 lembar perbandingan desktop/ponsel dibuka untuk pemeriksaan visual. Capture panjang kartu, penutup artikel, Kontak/FAQ, dan galeri juga ditinjau.
- 114 tujuan internal diperiksa. Empat halaman error tetap memberikan status HTTP 403/404/500/503 sesuai fungsinya.
- Font aktual diperiksa melalui CDP; peta karakter/jumlah glyph dibandingkan dengan TTF sumber. Permintaan jaringan font diperiksa melalui event request browser.
- Validasi parse JavaScript dan `git diff --check` dijalankan. Proyek tidak memiliki paket build frontend/npm pada root; pengujian menggunakan server pratinjau dan runtime browser proyek.

Suite shell juga diperbarui untuk tautan kategori nyata, bukan placeholder, serta lima tautan eksplorasi footer yang sudah ada. Footer desktop 1920px terukur 233px; batas lama 220px mendahului tambahan tautan panduan, sehingga batas pemeriksaan menjadi 240px tanpa menyembunyikan konten atau merombak footer.

## Aset dan performa

| Aset | Sebelum | Sesudah |
| --- | ---: | ---: |
| Empat font Poppins | 609.296 byte TTF | 197.340 byte WOFF2 |
| Monstera utama | PNG sekitar 504 KiB | WebP 130.786 byte; varian 360px 61.294 byte |
| Monstera dalam pot | PNG sekitar 439 KiB | WebP 98.696 byte; varian 360px 48.702 byte |
| Monstera tampilan daun | PNG sekitar 497 KiB | WebP 129.404 byte; varian 360px 59.502 byte |
| Tiga thumbnail | Menggunakan foto PNG penuh | Total 48.232 byte WebP |

Sumber PNG/TTF tetap disimpan. Pengompresan tidak mengubah jenis tanaman, foto, atau cakupan karakter. Galeri dapat diregenerasi dengan `node tools/testing/optimize-product-gallery.cjs` ketika server pratinjau berjalan. Font dibuat dengan `fontTools.ttLib.TTFont`, `flavor = "woff2"`, tanpa subset.

Sebagai pembanding pengamatan resource sebelum penghapusan preload terakhir: Beranda turun dari sekitar 2597 ke 1238 KiB, Tentang Kami 1861 ke 503 KiB, autentikasi 1188 ke 786 KiB, dan Detail Produk 3348 ke 725 KiB. Ini hasil lingkungan pratinjau lokal, bukan skor Core Web Vitals atau janji performa produksi. Setelah itu permintaan ganda Poppins 600 juga dihapus.

## Bukti dan menjalankan ulang

Direktori bukti lokal: `storage/reports/public-ui-fixes-2026-11-20/`.

- `suites.json`: hasil batch awal, termasuk kegagalan yang ditemukan.
- `suites-final.json`: hasil akhir 27 suite dengan rujukan log pengujian ulang.
- `suite-storefront-shell.txt`, `targeted-verification.json`: dua suite tambahan.
- `final-metrics/`: pemeriksaan ulang seluruh route setelah optimasi font dan perbaikan kontras buket. Satu respons favicon Cart pada snapshot ini diselesaikan sesudahnya dan diverifikasi melalui cold browser context pada suite terarah.
- `observations.json`, `probes.json`, `interaction-and-links.json`, `sheet-*.png`, `screenshots/`: metrik dan capture yang ditinjau.

Jalankan server dengan `RYLVA_PREVIEW_PORT=4185`. Untuk batch audit/regresi gunakan `RYLVA_AUDIT_OUTPUT` agar bukti sebelumnya tetap tersedia, lalu jalankan helper `audit-public-ui.cjs`, `audit-public-ui-evidence.cjs`, `audit-public-ui-probes.cjs`, atau `run-public-ui-audit-suites.cjs`. Pemeriksaan tambahan: `node tests/e2e/browser/verify-public-ui-fixes.cjs`.

## Batas pemeriksaan

Tidak ada perubahan integrasi backend, kebijakan operasional, otorisasi produksi, pembayaran nyata, atau pengiriman email nyata. Fixture dan penanda pratinjau tetap jujur. Dokumen/konten hukum final masih mengikuti kebutuhan proyek sebelumnya.

Pengukuran kontras otomatis ini tidak mensertifikasi seluruh WCAG, pembaca layar, browser/OS, atau kombinasi latar foto/gradien. Pengujian utama menggunakan Chromium desktop; perangkat fisik dan Safari belum diperiksa.

Detector Impeccable pada audit awal tetap menjadi bukti triase, bukan daftar 272 bug. Gate pemasaran Taste yang diwarisi dari pekerjaan koleksi sebelumnya tidak di-reset atau diklaim lulus; pengecekan generik hero satu layar/moment dekoratif tidak digunakan untuk mengganti pola katalog serta halaman informasi yang diminta pengguna. Rincian historis tetap ada di `commercial-pages-quality.md`.

Tidak dilakukan commit, push, publikasi, atau deployment.
