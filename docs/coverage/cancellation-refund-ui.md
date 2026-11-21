# Pembatalan & Refund — cakupan UI

18 November 2026. Frontend panduan publik mengikuti [spesifikasi halaman](../design/surfaces/cancellation-refund-surface.md), baseline v2.6 dan sistem storefront existing. Mode **Read**; tidak ada perubahan tema, framework, kontrak transaksi atau akses finansial.

## Route dan isi

- Halaman `/pages/public/cancellation-refund.html`; alias `/cancellation-refund.html` dan `/pembatalan-refund.html`.
- Footer bersama memetakan Pembatalan & Refund ke halaman baru. FAQ, Informasi Pengiriman dan dialog Bantuan Detail Pesanan mempunyai tautan yang nyata.
- Pembuka memakai warna FAQ/Kontak; ringkasan membedakan pembatalan pesanan dan pengembalian dana. Artikel berisi matriks pembatalan per tahap, nominal/ongkir, metode dan target waktu, status refund, komplain/banding, kasus khusus, delapan FAQ dan bantuan.
- Isi mempertahankan pengecualian COD belum dibayar, dana terverifikasi, biaya penyedia ditanggung toko, 3 hari kerja sejak persetujuan, 24 jam sejak Terkirim sebelum konfirmasi penerimaan, 2–5 foto kecuali Tidak diterima, dan banding khusus komplain. Tidak menambahkan SLA keputusan akhir 2 jam atau refund otomatis untuk semua laporan.

## Komponen bersama dan interaksi

Header, footer, SVG/logo, Poppins, token, tombol dan native FAQ menggunakan dependensi storefront existing. Layout artikel, ringkasan, tabel responsif, daftar isi dan callout menggunakan `shipping-information.css`; `cancellation-refund.css` hanya menambah pembuka dan penyesuaian target. Tidak menyalin seluruh stylesheet atau mengganti identitas halaman asal.

Perilaku artikel diekstrak ke `information-article.js`, dipakai oleh wrapper Informasi Pengiriman dan Pembatalan & Refund. ID dan history key Informasi Pengiriman dipertahankan. Scroll spy pasif dijadwalkan melalui requestAnimationFrame, mempertahankan satu bagian aktif, serta tidak mengubah URL, fokus atau kedalaman riwayat ketika hanya menggulir. Garis baca menggunakan ruang header penuh agar hide/show navbar tidak membuat bagian aktif berkedip. Mobile memakai daftar isi disclosure, bukan overlay atau toolbar baru.

FAQ memakai details/summary native dan single-open existing. Artikel, link inti, anchor dan FAQ berfungsi tanpa JavaScript. Fragmen yang tidak mempunyai target kembali ke pembuka; skip link dan anchor valid tetap dihormati. Tabel reflow menjadi kelompok berlabel di mobile.

Konteks kembali dibatasi referrer/riwayat yang sama origin-nya dan path yang diizinkan. Target dapat kembali ke Detail Pesanan, Pembayaran atau Pesanan Saya. Kedalaman fragmen dicatat agar kembali melewati seluruh entry panduan, termasuk setelah Back. Konteks baca/FAQ dipulihkan ketika kembali dari bantuan. Data riwayat tidak menjadi izin membaca transaksi; guard tetap pada halaman tujuan. Tidak ada form rekening, pengajuan finansial, unggahan bukti, kalkulator, atau status pesanan pribadi di panduan.

Dialog Bantuan Detail Pesanan tetap memakai fokus dan kontrol existing. Naskah yang menyebut daftar/login/kontak belum tersedia diganti dengan tautan panduan serta batas pratinjau yang sesuai. Logika pembatalan, komplain, persetujuan, pembayaran dan refund tidak diubah.

## State dan pemeriksaan pengembangan

Workbench `/__preview/cancellation-refund` berada di `tools/preview/`, di luar source halaman publik. Kondisi artikel: normal, anchor langsung, fragmen tidak dikenal, FAQ terbuka, tanpa JavaScript dan teks panjang; lima lebar layar. Tidak mengarang loading/error API atau mengubah data transaksi untuk memperagakan state. State transaksi tetap milik workbench Detail Pesanan dan alur existing, sebagaimana batas spesifikasi.

`tests/e2e/browser/verify-cancellation-refund.cjs` memeriksa 14 kelompok: lima ukuran 1440/1024/768/390/320 px; scroll spy dua arah; keyboard/anchor/skip/fallback; FAQ dan pemulihan baca; tautan bantuan/kembali ke objek pesanan setelah beberapa fragmen; kembali ke Pembayaran; pemetaan footer enam route; guest dan guard tujuan; pencarian Katalog; alias; tanpa JavaScript; workbench teks panjang. Pengujian lulus tanpa pageerror, kegagalan resource lokal atau permintaan HTTP yang menulis data pada skenario yang diuji.

Regresi Informasi Pengiriman (`verify-shipping-information.cjs`) lulus 18 kelompok setelah ekstraksi komponen; halaman informasi lama (`verify-information-pages.cjs`) lulus 6 kelompok. `verify-order-detail.cjs` lulus 34 pemeriksaan pada 50 skenario, dengan 29 capture dan tanpa browser error. Dependensi lokal, ID unik, anchor, tujuan tautan, konfigurasi alias, sintaks JavaScript dan whitespace diff juga diperiksa. Capture dan laporan target disimpan di `storage/reports/cancellation-refund/`.

### Review visual dan gate desain

Review terpisah memeriksa kontrak Read, kelima viewport, seluruh artikel, FAQ terbuka dan tampilan tanpa JavaScript. Disposition **ship**, tanpa perbaikan material pada permukaan target. Review lanjutan menyatakan perubahan token spacing dan penulisan rentang foto **resolved**, tanpa regresi yang terlihat. Review ini tidak mengaudit seluruh internal pembaca bersama atau menyatakan shell dan integrasi finansial telah lolos audit.

- Pengujian target terakhir tetap lulus 14 kelompok setelah perapian. Selain font-family, pemeriksaan memastikan empat FontFace Poppins (400/500/600/700) benar-benar berstatus `loaded` pada kelima ukuran layar. Ini menjadi bukti langsung terhadap peringatan fallback preload `poppins-600.ttf` dari alat Hallmark.
- Impeccable mencatat 10 temuan pada dependensi existing: HOT 9 px, deklarasi font, variasi radius dan warna. Identitas bersama dipertahankan sesuai cakupan; laporan `impeccable-detect.json`.
- Taste gate tercatat **FAIL 46, round 1 of 3** pada `taste-gate.txt`. Sebagian temuan meminta hero/section satu layar, gambar/moment dan struktur kelas template pemasaran yang tidak sesuai kontrak artikel Read. Temuan kontras, navigasi dan fokus shell tetap dicatat; tidak diklaim telah diperbaiki oleh pekerjaan ini.
- Hallmark render dijalankan kembali setelah lima nilai spacing diganti token dengan nilai piksel sama dan dua rentang foto ditulis “2 sampai 5”. Laporan akhir `hallmark-render-final.json`: **140 FAIL, 67 REFLEX, 11 WARN**, render berhasil. FAIL tersisa berasal dari stylesheet bersama dan hasil pengukuran shell, termasuk kontras navigasi/footer dan search field. Tidak ada FAIL yang menunjuk stylesheet target baru pada laporan akhir.
- Target CSS yang diperiksa sendiri menghasilkan 0 FAIL dan 1 REFLEX karena tidak mendefinisikan `:active` sendiri; state tersebut diwarisi dari `shipping-information.css`. Outline putih pada banner juga ditandai REFLEX oleh render gabungan, tetapi dipertahankan agar fokus kontras pada latar hijau sesuai sistem halaman informasi. Pengukuran isi FAQ tertutup ditinjau terhadap capture FAQ terbuka; tidak ditemukan clipping pada isi terbuka.

Gate alat secara keseluruhan **belum hijau**. Temuan di luar cakupan bukan alasan untuk mengganti tema/header/footer yang diminta tetap. Capture tooling dipindahkan ke `storage/reports/cancellation-refund/hallmark-artifacts/` dan `hallmark-artifacts-final/`, sehingga tidak tertinggal dalam source halaman publik.

## Integrasi yang belum tersedia

Revisi tampilan 19 November: judul dan deskripsi banner dipusatkan agar konsisten dengan contoh halaman informasi dari pengguna; breadcrumb tetap di kiri. Pemeriksaan render pada 1440/1024/768/390/320 px memastikan pusat teks tepat, warna banner tetap dan tidak ada overflow. Bukti tersimpan di `storage/reports/policy-banner-alignment/`. Ini koreksi alignment, bukan perubahan ketentuan atau hasil gate desain terdahulu.

Artikel menggunakan ketentuan baseline dan menampilkan label pratinjau. Gateway, eksekusi refund, nominal kasus aktual, kalender hari kerja, metadata versi kebijakan publik, notifikasi dan alur rekening alternatif aman belum dihubungkan oleh perubahan ini. Tidak ada endpoint baru, proses finansial produksi, perubahan stok, unggahan file, deployment atau klaim dana sudah dipindahkan.

Pada integrasi produksi, parameter harus sejalan dengan Checkout/Detail Pesanan; otorisasi pemilik, maker-checker, idempotensi, versi data, akumulasi dana, sengketa dan audit tetap ditegakkan server. Kasus campuran, redaksi P-15 dan logistik retur yang belum terperinci tetap mengikuti catatan spesifikasi, tidak diganti aturan frontend baru.
