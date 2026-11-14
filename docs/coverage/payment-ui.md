# UI Pembayaran

Implementasi frontend, 12 November 2026. Acuan:
[spesifikasi halaman](D:/rylva-green/docs/design/surfaces/payment-surface.md),
spesifikasi proyek v2.6, PRODUCT.md, DESIGN.md, serta Figma Checkout 375:108.
Mode Impeccable: **Operate**. Jalur pengerjaan: kode, memakai dunia visual incumbent.

## Menjalankan

Jalankan perintah berikut dari root proyek:

    node tools/preview/serve-dashboard.cjs

- [Halaman Pembayaran](http://127.0.0.1:4178/pages/customer/payment.html).
- [Workbench state](http://127.0.0.1:4178/__preview/payment).
- Alias pratinjau /payment.html mengikuti pemetaan Node dan Apache yang sama.

Workbench tersimpan di tools/preview/payment-states.html, bukan public/.
Parameter state dan actionError hanya dibaca adapter pratinjau yang secara
eksplisit dimuat oleh HTML contoh. Parameter ini bukan otorisasi, hasil gateway,
atau cara mengubah data produksi.

## Cakupan yang dibuat

- Status pesanan dan pembayaran terpisah, nomor order, nominal, deadline absolut
  WIB, dan hitung mundur dengan elapsed time monotonic.
- Instruksi QRIS, VA, transfer, e-wallet; COD tanpa QR/deadline online.
- Ringkasan snapshot barang, ongkir, total, jadwal dan kurir.
- Riwayat pembayaran, pemilih metode, validasi, konfirmasi pembatalan,
  salin dengan pemulihan manual, hasil verifikasi dan bukti pelunasan contoh.
- Percobaan gagal yang masih dapat dipulihkan mengutamakan tombol coba lagi.
  Saat tenggat terlewati, retry dan pergantian metode ditahan; dialog metode
  ditutup dan status dibaca ulang tanpa pembatalan lokal. Hitung waktu memakai
  elapsed time monotonic dari snapshot server, bukan perubahan jam browser.
- Umpan balik tindakan berada di area inline yang dicadangkan, terpisah dari
  pengumuman pembaca layar; tidak ada toast yang menutupi tombol.
- Pending, berhasil, gagal, kedaluwarsa, dibatalkan, PH-01/02/03,
  refund, duplikasi, kelebihan dana dan sengketa.
- Loading, data parsial/tidak valid, QR/foto gagal, offline, timeout,
  maintenance, rate limit, limit percobaan, akses dan konflik.
- Dialog detail hanya menyediakan ringkasan pesanan yang sama. Ini bukan
  implementasi lengkap riwayat, pelacakan atau purnajual pelanggan.
- Navbar tiga baris dan footer lima kolom mengikuti desain Figma asli,
  sesuai koreksi pengguna pada 13 November 2026. Logo dan ikon menggunakan
  11 ekspor SVG asli yang tersimpan lokal. Detail ada pada
  [acuan navbar/footer](D:/rylva-green/docs/design/surfaces/storefront-shell.md).
- Tujuan navbar/footer yang halamannya belum dibuat memberikan pemberitahuan
  pratinjau yang jelas. Tidak ada pengalihan palsu ke halaman pesanan lain;
  pencarian mempertahankan kata kunci dan konteks pembayaran.

Semua angka, transaksi, dan perubahan pada halaman ini adalah data contoh.
Foto memakai aset produk yang sudah ada sebagai ilustrasi fixture, bukan
verifikasi foto atau inventaris barang yang dijual. QR memuat teks
RYLVA-GREEN-PREVIEW-NOT-A-PAYMENT, bukan payload pembayaran.

## Pemisahan data

- payment.js mengurus presentasi dan interaksi.
- payment-countdown.js mengurus tampilan deadline; tidak mengubah status order.
- payment-preview-data.js menyediakan fixture dan operasi lokal. Penyimpanan
  sesi hanya berisi fixture sintetis agar reload tidak mereset order/tenggat.
- Adapter lain dapat diberikan melalui window.RylvaPaymentAdapter sebelum UI
  dimuat, dengan metode getSnapshot, createAttempt, cancelOrder, getReceipt.
  Ini sambungan frontend, bukan klaim API produksi sudah tersedia.
- Mata uang, jumlah, status serta hubungan subtotal/ongkir divalidasi untuk
  menghindari menampilkan instruksi dari snapshot yang tidak lengkap.
- Semua state awal dapat dipilih dari workbench. Hover, fokus, accordion,
  validasi, mengirim, gagal tindakan, salin dan batal ditinjau melalui kontrol
  yang nyata pada halaman. Workbench dapat mereset fixture per skenario.

## Integrasi yang masih diperlukan

Bootstrap/router/controller PHP dan layanan pembayaran produksi masih kerangka.
UI tidak melakukan transaksi gateway, otorisasi server, penutupan VA nyata,
konfirmasi COD, reservasi/komit stok, refund, pengiriman email, atau penerbitan
dokumen legal. Penolakan akses pada fixture hanya memeriksa tampilan state.

Sebelum produksi, hubungkan kontrak read model dan mutasi yang disepakati:
ownership, CSRF, idempotensi, optimistic version, limit, verifikasi webhook/API,
reservasi, outbox, audit, dan rekonsiliasi tetap menjadi kewajiban backend.
Deadline fixture bukan keputusan penyelesaian konflik P-01/P-40/P-02.

Respons adapter harus menyediakan snapshot dan allowedActions yang sudah
divalidasi server. QR/kode/URL pembayaran dan kanal aktif harus berasal dari
gateway terpilih; jangan mengaktifkan vendor berdasarkan logo Figma.
Deep link e-wallet serta dokumen unduhan nyata memerlukan integrasi vendor.
Halaman Detail Pesanan frontend telah ditambahkan pada 13 November 2026;
tombol detail membuka `order-detail.html` dan mempertahankan snapshot contoh
yang sama saat kembali ke Pembayaran. Lihat `docs/coverage/order-detail-ui.md`.
Daftar Pesanan Saya kini terhubung melalui orderId dan repository fixture bersama.
Kembali melalui Detail/Pembayaran mempertahankan pesanan, tenggat dan konteks
daftar; lihat [cakupan Pesanan Saya](my-orders-ui.md). Akun, kontak operasional
dan pelacakan produksi belum disambungkan. Jangan mempublikasikan adapter
data contoh sebagai backend.

## Pemeriksaan

    node --check public/assets/js/storefront/payment.js
    node --check public/assets/js/storefront/payment-preview-data.js
    node --check public/assets/js/storefront/payment-countdown.js
    node tools/maintenance/check-project-structure.cjs
    node tests/e2e/browser/verify-payment.cjs

Pemeriksaan browser memakai Chrome headless serta runtime Puppeteer proyek.
Di lingkungan pengerjaan ini, Chrome perlu dijalankan di luar sandbox karena
dua percobaan sandbox tidak dapat terhubung ke browser. Tidak menggunakan
profil browser pengguna.

Bukti browser disimpan di .impeccable/review/payment/verification.json dan PNG
per viewport/state. Pengujian UI tidak membuktikan AC backend stok, gateway,
refund atau keamanan produksi telah lulus.

### Hasil verifikasi implementasi

- Pemeriksaan sintaks JavaScript dan struktur proyek lulus; 473 referensi
  diperiksa tanpa rujukan yang hilang. Halaman staf lama tetap merespons normal.
- Uji browser lulus untuk **50 skenario, 73 pemeriksaan, 16 tangkapan layar**,
  tanpa kesalahan JavaScript yang tidak tertangani. Lebar 320, 390, 768, 850,
  1024, 1440 dan 1920 px diperiksa untuk luapan dan ukuran target.
- Cakupan uji mencakup reload tanpa reset tenggat, pergantian metode,
  validasi, pembatalan, COD, verifikasi, kegagalan dokumen, timeout, keyboard,
  fokus dialog, data panjang, offline, dan workbench terpisah.
- Uji tambahan membuka dialog retry pada percobaan gagal sampai deadline
  terlewati, mengubah Date.now menjadi 0, lalu memastikan retry terkunci dan
  status pesanan tidak dibatalkan oleh frontend.
- Pada implementasi awal, Hallmark statis: **0 FAIL, 0 REFLEX, 0 WARN**. Sweep dengan render:
  **0 FAIL, 4 WARN**, berupa dua jenis peringatan yang muncul pada URL dan
  berkas: cakupan aksen hijau serta empat bobot Poppins. Keduanya mengikuti
  identitas dan bobot yang ditentukan DESIGN.md.
- Detector Impeccable implementasi awal dijalankan satu kali. Dua temuan label header ponsel
  berukuran 10 px diperbaiki menjadi 12 px, kemudian diperiksa pada render.
  Font Poppins juga diperiksa oleh uji browser; peringatan preload font pada
  sweep awal sudah tidak muncul setelah preload yang berlebihan dihapus.
- Gate Taste implementasi awal: **GATE: OPEN 30 (rounds used up)**. Aturan hero satu layar,
  section setinggi layar, foto/creative moment, kelas grid kit, dan larangan
  label QR contoh bertentangan dengan cakupan transaksi, identitas incumbent,
  dan kejujuran data yang diminta pengguna. Hasil ini tidak dinyatakan PASS.
  Dua temuan fokus yang relevan diperbaiki dan uji keyboard lengkap lulus.
- Tinjauan visual terpisah menemukan tiga perbaikan: tenggat retry, hierarki
  tindakan gagal, dan toast yang menutupi aksi. Ketiganya telah diimplementasikan,
  diuji, dan ditangkap ulang. Verdict pass pada 13 November 2026 menilai ketiganya
  **resolved** dengan disposition **ship**, khusus tiga perbaikan pada frontend
  pratinjau. Ini bukan penilaian kesiapan pembayaran produksi.
- Koreksi navbar/footer 13 November 2026 mengikuti ekspor Figma asli,
  termasuk warna #6B9071, tiga baris navbar, dan lima kolom footer.
  Pemeriksaan shell lulus untuk 11 kelompok pemeriksaan serta 11 aset.
  Regresi 50 skenario/73 pemeriksaan dijalankan ulang dan lulus setelah
  perbaikan pemicu timeout yang berjalan terlalu dini.
