# Cakupan UI Cara Memesan

19 November 2026. Ekstensi **Read** dalam sistem informasi storefront existing; tidak mengganti tema, fondasi desain, header/footer atau alur transaksi.

## Halaman dan komponen

- Route aktif: `/pages/public/how-to-order.html`.
- Alias: `/how-to-order.html` dan `/cara-memesan.html`.
- Footer Cara Memesan kini menjadi tautan route aktif melalui pemetaan shell bersama. Footer halaman ini juga berupa anchor native dengan satu `aria-current="page"`.
- Banner hijau/teks putih terpusat, breadcrumb kiri, container, Poppins, pasangan tombol sejajar, daftar isi desktop sticky/mobile disclosure dan FAQ memakai komponen informasi yang sudah ada.
- Revisi posisi tombol 19 November: Mulai dari Katalog dan Buka Keranjang dipindahkan ke dalam banner, rata tengah di bawah deskripsi. Tombol utama memakai varian putih existing; tombol sekunder transparan dengan border/teks putih. Pada mobile keduanya bertumpuk dalam banner. Gaya hanya berlaku pada `.ordering-main .ordering-banner-actions`.
- `public/assets/js/storefront/how-to-order.js` hanya mengonfigurasi pembaca artikel bersama: delapan ID bagian, scroll spy, fokus anchor, penyimpanan konteks baca dan sumber kembali yang dibatasi.
- Gaya bersama hanya ditambah selector `.information-ordering` dan `.ordering-main`; tidak ada perubahan nilai gaya untuk halaman lain.

[Brief dan dasar keputusan](../design/surfaces/how-to-order-surface.md) mencatat sumber serta batasnya. Panduan mengikuti baseline v2.6, PRODUCT.md dan UI Katalog, Detail Produk, Keranjang, autentikasi, Checkout, Pembayaran serta Pesanan Saya yang tersedia.

## Isi dan state

Enam langkah: pilih produk; periksa Keranjang; masuk/verifikasi; alamat/pengiriman; tinjau/bayar; pantau/terima. Ada jalur alternatif Buket Kustom, empat FAQ pemulihan, serta tautan Pengiriman, Refund, Syarat, Kontak dan Pusat Bantuan. Tidak membuat klaim tarif, cakupan kota, provider atau waktu tiba tambahan.

| Area | State dan pemulihan |
| --- | --- |
| Artikel publik | Guest dapat membaca lengkap; CTA Katalog/Keranjang tidak memaksa login |
| Daftar isi | Satu bagian aktif saat scroll dua arah, tanpa perubahan URL/history/fokus |
| Anchor | Klik/keyboard/direct link memfokuskan heading dengan ruang header; fragmen lama kembali ke pembuka |
| Mobile | Disclosure daftar isi; teks membungkus dan tindakan berurutan, tanpa overflow |
| FAQ | Native details; keyboard, satu jawaban terbuka dan jawaban dipertahankan ketika kembali |
| Konteks baca | Browser Back memulihkan posisi, TOC dan FAQ; tautan sumber dibatasi Katalog/Keranjang/Checkout same-origin |
| Kembali Katalog | Query, kategori, urutan dan posisi dipulihkan melalui history walau melewati fragment artikel |
| Tanpa JavaScript | Artikel, footer target, anchor dan FAQ tetap native; offset fallback memberi ruang header |
| Tujuan pelanggan | Buket Kustom tetap menampilkan guard guest; tautan Masuk kembali ke Keranjang untuk memeriksa pilihan |
| Konten panjang | Workbench terpisah mengubah hanya frame pengembangan; tidak menambah state simulasi transaksi di halaman publik |

Tidak ada formulir atau permintaan API pada artikel. Loading/error layanan, validasi rekening, pengiriman bukti, penyimpanan atau konflik transaksi tetap menjadi state halaman tujuan. Tidak menambahkan state palsu untuk artikel statis.

## Pratinjau pengembangan

`/__preview/how-to-order` menyediakan normal, anchor pembayaran, fragmen lama, FAQ terbuka, tanpa script dan teks panjang, dengan pilihan lebar 1440/1024/768/390/320 px. Kontrol tidak dimuat pada route pengguna.

## Verifikasi

`node tests/e2e/browser/verify-how-to-order.cjs`: **14 kelompok lulus**. Bukti di `storage/reports/how-to-order/verification.json` dan 11 screenshot pada direktori yang sama. Pemeriksaan mencakup lima ukuran, seluruh delapan bagian dua arah, keyboard, keempat FAQ, Back, Katalog dengan pencarian/kategori/urutan/posisi, footer enam halaman, CTA dan guard guest, pencarian header, alias, tanpa JavaScript pada lima ukuran serta teks panjang 320 px. Tidak ditemukan pageerror, aset lokal gagal atau HTTP write pada skenario tersebut.

`node tests/e2e/browser/verify-information-pages.cjs`: **7 kelompok regresi lulus**, meliputi Kontak/FAQ/Privasi, lima ukuran, keyboard, scroll spy Privasi, tanpa JavaScript, pencarian serta panel belanja bersama.

`node tests/e2e/browser/verify-terms-conditions.cjs`: **14 kelompok regresi lulus**, termasuk pembaca bersama pada lima ukuran, tab kebijakan dari registrasi/Checkout, total dan persetujuan Checkout yang tetap, konteks kembali, footer, pencarian, alias dan tanpa JavaScript. Total **35 kelompok** dari tiga suite; tidak dihitung sebagai pengujian transaksi produksi.

Audit statis: **34 ID unik, 9 fragment dan 35 aset lokal valid**; konfigurasi alias valid. Pemeriksaan sintaks wrapper/shell/server/test dan `git diff --check` lulus. Seluruh 11 capture dibuka dan diperiksa: banner, lima ukuran, artikel penuh desktop/mobile, bagian aktif, FAQ, bantuan dan tanpa script.

Detector Impeccable dijalankan sekali pada target dan CSS yang disentuh; dua peringatan berasal dari shell/token bersama: HOT 9 px dan deteksi Inter. Pemeriksaan FontFace aktual menunjukkan Poppins 400/500/600/700 telah dimuat pada lima ukuran. Header/token dipertahankan sesuai cakupan. Lihat `storage/reports/how-to-order/impeccable-detect.json`; hasil ini bukan seluruh pemeriksaan desain tanpa temuan.

Taste: **FAIL 46, ronde 1**, dicatat pada `storage/reports/how-to-order/taste-gate.txt`. Aturan hero satu layar, moment, gambar dan `.wrap` tidak sesuai dengan pola artikel yang dipin. Ada juga temuan shell yang diwarisi terkait navigasi, footer, fokus dan kontras. Tidak ditambahkan waiver dan tidak diubah checker atau header/footer untuk mengejar skor. Gate tersebut belum lulus.

Hallmark render: **140 FAIL, 67 reflex, 11 WARN**, dengan CSS halaman bersama ikut dipindai. Laporan `storage/reports/how-to-order/hallmark-render.json` mencatat antara lain token putih/hijau existing serta kontras header/footer yang belum memenuhi ambang pada sebagian teks. Berkas screenshot pengembangan dipindahkan dari area publik ke `storage/reports/how-to-order/hallmark-artifacts/`. Ini bukan klaim kelulusan kualitas seluruh storefront.

`storage/reports/how-to-order/quality-scope.json` memisahkan hasil fungsi, temuan yang diwarisi, serta cakupan review.

Review independen: **disposition: ship** untuk ekstensi Cara Memesan terhadap kontrak Read yang ditetapkan. Reviewer membuka seluruh 11 capture serta memeriksa sumber, konteks produk/desain, state dan laporan pengujian. Tidak ditemukan perbaikan material pada target. Laporan lengkap: `storage/reports/how-to-order/finish-review.md`, dengan bagian persistence, fidelity, ceiling, material_fixes dan keep. Tidak ada comp atau kartu QUALITY BAR terpisah untuk ekstensi ini; penilaian memakai DESIGN.md dan kontrak permukaan. Verdict ini tidak menutup gate mentah atau temuan aksesibilitas shell bersama di atas.

Revisi tombol di dalam banner: suite target **14 kelompok kembali lulus**, termasuk pengukuran kedua tombol sepenuhnya di dalam banner dan kelompoknya rata tengah pada lima ukuran. Seluruh 11 capture diperbarui dan dibuka. Detector layout CSS yang dibatasi pada berkas perubahan tidak menemukan temuan (`banner-actions-detect.json`); sintaks dan whitespace diff lulus. Reviewer baru memeriksa screenshot pengguna dan hasil terbaru dengan **disposition: ship**, tanpa perbaikan material dalam cakupan koreksi. Laporan: `storage/reports/how-to-order/banner-actions-finish-review.md`. Hasil Taste/Hallmark dan 21 kelompok regresi lain di atas berasal dari sebelum koreksi posisi ini; tidak dijalankan ulang atau diklaim sebagai kelulusan gate terbaru.

## Batas integrasi

Label pratinjau terlihat. Halaman menjelaskan alur frontend/data contoh yang sudah ada; tidak mengaktifkan akun, stok, pengiriman, pembayaran atau pemrosesan pesanan produksi. Tidak menambah endpoint atau menyimpan persetujuan pembelian. PRODUCT.md, DESIGN.md dan teks Kebijakan Privasi pengguna dipertahankan. Tidak dilakukan commit, push atau deployment dalam pekerjaan ini.
