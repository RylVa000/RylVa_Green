# Audit akhir UI publik — 20 November 2026

Pembaruan: seluruh 11 temuan di bawah sudah ditangani pada pekerjaan lanjutan. Lihat [laporan penyelesaian dan hasil verifikasi](public-ui-audit-fixes-2026-11-20.md). Isi audit awal dipertahankan sebagai riwayat bukti.

Status: audit selesai. Pemeriksaan visual, pengukuran, 27 suite interaksi dan probe verifikasi sudah dijalankan. Tidak ada kode UI produksi yang diubah dalam audit ini.

## Verdict integritas implementasi

**Identitas produk koheren, tetapi konsistensi akhir belum lulus.** Fotografi tanaman, logo botani, Poppins, palet hijau/krem, pola belanja dan artikel informasi membentuk sistem yang dapat dikenali. Masalah yang perlu ditutup adalah kontras bersama, copy header yang bertentangan, penggunaan Inter pada footer, perbedaan header informasi, keterbacaan teks kecil, serta beberapa detail data/pengujian.

Ini audit frontend pratinjau, bukan sertifikasi WCAG atau pemeriksaan backend produksi. Keberadaan UI tidak membuktikan autentikasi, pembayaran, refund, kurir atau database produksi sudah terhubung.

## Skor kesehatan audit

Skor berikut merupakan penilaian heuristik 0–4 berdasarkan bukti, bukan skor Lighthouse.

| Dimensi | Skor | Bukti utama |
| --- | --- | --- |
| Aksesibilitas | 2/4 | Fokus dan label tersedia; teks navigasi/footer tidak memenuhi kontras AA. |
| Performa | 2/4 | Font Inter besar tetap dimuat; thumbnail Detail Produk menggunakan PNG besar. |
| Sistem desain / theming | 3/4 | Token dan identitas konsisten, tetapi footer menyimpang dari aturan Poppins. Dark mode tidak termasuk kebutuhan dan tidak dinilai sebagai kekurangan. |
| Responsif | 3/4 | 136 pemeriksaan pada empat lebar tanpa overflow halaman; badge/unit dan harga panjang masih perlu perhatian. |
| Integritas implementasi | 2/4 | Copy header lama bertentangan dengan panduan, fixture waktu dan beberapa ekspektasi tes tidak lagi konsisten. |
| **Total** | **12/20** | **Acceptable — masih perlu perbaikan signifikan sebelum rilis.** |

**11 kelompok temuan: 0 P0, 2 P1, 7 P2 dan 2 P3.** Tidak ada pemblokir P0 yang ditemukan dalam cakupan pemeriksaan. Kegagalan tes tidak otomatis dihitung sebagai bug produk.

## Cakupan dan metode

- 34 route: 21 halaman publik, 8 halaman pelanggan, 5 halaman autentikasi pelanggan.
- Lebar 1440, 768, 390 dan 320 CSS px: 136 kondisi render. Desktop dan ponsel memiliki capture atas serta halaman penuh; 17 lembar perbandingan desktop/ponsel dibuka satu per satu untuk memeriksa semua halaman.
- Keadaan pelanggan berisi data memakai fixture/workbench proyek, di browser context terisolasi. Akun, transaksi, alamat dan kontak pada bukti merupakan contoh.
- Pemeriksaan DOM: landmark, judul, ID ganda, nama kontrol, label input, atribut alt, font terhitung, ukuran teks, target kontrol, aset gagal serta overflow. Pemeriksaan awal keyboard mencakup tiga perpindahan Tab pada setiap route; suite khusus melengkapi interaksi dan pemulihan.
- Kontras dihitung dari warna teks dan komposit latar CSS solid. Latar gradien/foto dan opacity tidak diklaim lulus dari perhitungan ini. Angka pada satu elemen berulang tidak dihitung sebagai temuan terpisah.
- 114 tujuan tautan internal diperiksa melalui HEAD. Keempat route kondisi sistem sengaja memberikan status 403/404/500/503; ini bukan tautan rusak.
- Detector Impeccable dijalankan sekali pada 34 berkas HTML: 272 hit mentah, terdiri dari 206 advisory dan 66 warning. Hit tersebut diverifikasi konteksnya, bukan diperlakukan sebagai 272 bug.
- Bukti: `storage/reports/public-ui-audit-2026-11-20/`. Data pengukuran ada di `observations.json`, `summary.json`, `coverage-matrix.json`, `interaction-and-links.json`, `impeccable-detect.json`, capture dan hasil suite individual.
- Laporan persisten utama adalah berkas ini. Helper arsip Impeccable `audit-storage` tidak didukung runtime yang tersedia (`Unknown command`), sehingga arsip disimpan langsung di `docs/coverage/`; skill/runtime tidak diubah.

## Temuan prioritas

### F01 — P1: kontras teks bersama belum memenuhi AA

**Area:** header dan footer storefront, termasuk halaman informasi dan pelanggan. **Kategori:** aksesibilitas. **Standar:** WCAG 1.4.3.

Pengukuran terkonfirmasi pada latar solid:

| Teks | Pasangan warna | Kontras | Kebutuhan |
| --- | --- | --- | --- |
| Akun / Wishlist / Keranjang | `#F8F9FA` di `#6B9071` | 3,40:1 | 4,5:1 |
| Promo Spesial | `#F44949` di `#375534` | 2,35:1 | 4,5:1 |
| HOT | putih di `#F44949` | 3,56:1 | 4,5:1 |
| Teks dan tautan footer kecil | putih di `#6B9071` | 3,59:1 | 4,5:1 |
| Copy utility lama | `#77838D` di `#F8F9FA` | 3,68:1 | 4,5:1 |

**Dampak:** label navigasi, promosi dan bantuan sulit dibaca bagi pengguna dengan penglihatan rendah. **Perbaikan:** tetapkan pasangan token teks/latar yang memenuhi ambang pada semua state. Pisahkan token warna teks promo dari latar badge; satu merah yang sama tidak otomatis cocok untuk kedua fungsi. Pertahankan identitas hijau/krem dan pemeriksaan kontras normal/hover/fokus.

**Lokasi:** `public/assets/css/storefront/storefront-shell.css:8`, `:16`, `:337`, `:340`, `:398`. **Perintah:** `$impeccable colorize`, lalu `$impeccable audit`.

### F02 — P1: enam halaman pelanggan masih menampilkan janji pemasaran lama

**Area:** Akun, Keranjang, Checkout, Pesanan Saya, Detail Pesanan dan Pembayaran. **Kategori:** integritas / konsistensi konten.

Desktop masih menampilkan “Gratis ongkir min. Rp 200.000” dan “Pengembalian mudah 7 hari”, sementara storefront publik menggunakan informasi kurir/pelacakan yang netral. Tidak ditemukan dasar perhitungan gratis ongkir tersebut; Checkout contoh dengan subtotal Rp364.000 masih menampilkan ongkir Rp25.000. P-11 menetapkan jendela komplain 24 jam; dokumen Akun/Pesanan sendiri sudah mencatat konflik copy tujuh hari sebagai pekerjaan sebelum rilis.

**Dampak:** pengguna menerima janji ongkir dan pengembalian yang berbeda ketika berpindah dari panduan ke transaksi. **Perbaikan:** selaraskan enam utility header ke copy yang sudah didukung. Bila promosi memang akan diaktifkan, tampilkan syarat dari sumber aturan yang benar dan hindari janji menyeluruh yang berbeda dari hak komplain.

**Lokasi:** `public/pages/customer/account.html:29`, `cart.html:31`, `checkout.html:40`, `my-orders.html:32`, `order-detail.html:31`, `payment.html:31`; konflik tercatat di `docs/design/surfaces/customer-account-surface.md:631`. **Perintah:** `$impeccable clarify`.

### F03 — P2: judul footer masih menggunakan Inter

**Kategori:** theming / konsistensi tipografi.

`--storefront-heading-font` masih berisi `"Inter", var(--font-body)` dan dipakai pada judul footer. Pengukuran menemukan keluarga tersebut pada empat judul footer, sedangkan DESIGN.md mengikat Poppins sebagai satu-satunya keluarga desain. Ini bukan sekadar nama font pada detector: stylesheet, resource `inter-variable.ttf`, dan CDP pada teks tombol judul footer mengonfirmasi font aktual `Inter-Bold` (`failure-verification.json`).

**Dampak:** detail tipografi berbeda dari halaman/form utama dan menambah berkas font sekitar 856 KiB. **Perbaikan:** gunakan Poppins untuk judul footer dan hapus pemuatan Inter setelah memastikan dependensi shared. Jangan mengganti font seluruh situs.

**Lokasi:** `public/assets/css/storefront/storefront-shell.css:18`, `:63`, `:400`; `DESIGN.md:88`. **Perintah:** `$impeccable typeset`, `$impeccable optimize`.

### F04 — P2: header halaman informasi belum memiliki resep yang sama

**Area:** Kontak dan FAQ dibandingkan Pengiriman, Refund, Syarat, Privasi, Cara Memesan, Tentang Kami, panduan dan Mitra. **Kategori:** konsistensi / hierarki.

Judul sudah berada di tengah dan berwarna putih pada bidang hijau, tetapi desktop Kontak memakai 56px dan FAQ 43,2px, sementara keluarga policy memakai 36px. Kontak dan FAQ belum memakai breadcrumb yang ada pada keluarga informasi lainnya. Judul “Contact Us” / “Frequently Asked Questions” juga berbeda bahasa dari navigasi dan judul halaman lain.

**Dampak:** perpindahan antarhalaman informasi terasa berasal dari beberapa template. **Perbaikan:** gunakan satu resep banner/breadcrumb/heading untuk keluarga informasi. Pertahankan isi kartu/form dan konten pengguna; terjemahan Kontak/FAQ dapat diselaraskan tanpa mengubah fakta. Kontak sudah memberi `lang="en"` pada isi Inggris, sehingga perbedaan bahasa ini tidak dilaporkan sebagai kegagalan bahasa pembaca layar secara menyeluruh.

**Lokasi:** `public/assets/css/storefront/information-pages.css:19`, `:519`; `public/pages/public/contact.html:148`, `faq.html:148`; acuan bersama `public/assets/css/storefront/information-policy.css:13`. **Perintah:** `$impeccable typeset`, `$impeccable layout`, `$impeccable clarify`.

### F05 — P2: aturan harga sangat panjang belum konsisten di semua daftar

**Area:** Katalog, kategori dan Beranda; dibandingkan dua halaman koleksi yang sudah memiliki koreksi lokal. **Kategori:** responsif / keterbacaan.

Probe terarah mengonfirmasi aturan shared `.home-price--long` mengecilkan harga sampai 10px pada 320px, dan satuannya sampai 6,5px, pada Katalog, kategori dan Beranda. Koleksi Baru/Promo sudah memakai koreksi lokal; pembanding Koleksi Baru terukur 14px dan unit 12px. Seluruh angka tetap lengkap dan tidak overflow, tetapi keterbacaannya berbeda.

**Dampak:** nilai transaksi lengkap secara teknis masih ada, tetapi sulit dibaca. **Perbaikan:** bungkus harga dan pisahkan unit ke baris berikutnya pada kartu sempit, sambil mempertahankan dua kolom dan kontrol belanja. Jangan memotong angka atau sekadar mengecilkan font.

**Lokasi:** `public/assets/css/storefront/homepage.css:1821`; pembanding `public/assets/css/storefront/commercial-pages.css`. **Perintah:** `$impeccable adapt`, `$impeccable typeset`.

### F06 — P2: teks status dan unit terlalu kecil pada kartu ponsel

**Area:** kartu produk dan badge shared. **Kategori:** aksesibilitas / keterbacaan.

HOT 9px; status stok Katalog/koleksi 9px pada ponsel dan 10px pada desktop; unit harga ponsel 10px. Wishlist justru sudah menaikkan status stok ke 11px. **Dampak:** informasi ketersediaan dan satuan lebih sulit dibaca daripada judul dan harga. **Perbaikan:** gunakan ukuran caption yang konsisten dan layak baca; atur ruang badge sebelum menaikkan ukuran. Ini temuan legibilitas terhadap standar desain proyek, bukan klaim bahwa WCAG mempunyai minimum font universal.

**Lokasi:** `public/assets/css/storefront/storefront-shell.css:345`, `homepage.css:779`, `:1786`, `:1813`; pembanding `wishlist.css:610`. **Perintah:** `$impeccable typeset`, `$impeccable adapt`.

### F07 — P2: pemuatan aset awal masih berat

**Kategori:** performa. Pengukuran adalah resource browser lokal, bukan data lapangan atau tes perangkat lambat.

Detail Produk memuat PNG galeri sekitar 504, 497 dan 439 KiB pada keadaan awal; gambar yang sama dipakai untuk thumbnail kecil. Beranda juga memuat Inter sekitar 856 KiB, di samping Poppins. Pada beberapa halaman teramati dua entry resource Poppins 600; pemanfaatan preload perlu diperiksa, tanpa mengasumsikan semua entry tersebut selalu menjadi download terpisah di seluruh browser.

**Dampak:** waktu tampil dan kuota jaringan lebih besar, terutama pada ponsel. **Perbaikan:** sediakan ukuran thumbnail yang sesuai dan turunan gambar terkompresi, gunakan galeri besar saat dibutuhkan, optimalkan format font sambil mempertahankan Poppins, lalu ukur ulang transfer dan layout shift.

**Lokasi:** `public/assets/js/storefront/product-detail-preview-data.js`, `public/assets/css/shared/tokens.css:80`, `public/assets/css/storefront/storefront-shell.css:63`. **Perintah:** `$impeccable optimize`.

### F08 — P2: sebagian suite belum mengikuti perilaku halaman terkini

**Kategori:** integritas pengujian. Ini temuan pada bukti pengujian, tidak otomatis menjadi bug produk.

- Homepage berhenti pada pencocokan kata `/sesuai/`, padahal navigasi berhasil menuju kategori Benih & Bibit dan menampilkan empty state serta pemulihan yang sah. Ekspektasi tersebut mengikuti copy lama.
- Detail Panduan berhenti karena membaca label kembali “Katalog” sebelum skrip Detail Produk selesai mengubahnya. Pola `waitForNavigation` dapat terselesaikan oleh perubahan history sebelum halaman tujuan siap; probe menunggu `product-content` selesai untuk membedakan race pengujian dari kegagalan pengguna.
- Akun Google-only masih diharapkan membuka dialog “belum terhubung”. Implementasi terkini justru sudah menavigasi ke halaman Lupa Kata Sandi beserta `returnTo`; probe mengonfirmasi jalur tersebut.
- Wishlist tetap timeout pada run ulang. Diagnostik dengan assertion asli menunjukkan tes mencoba menekan ikon saat header tersembunyi/bertransisi setelah save di bagian bawah halaman: event klik justru mengenai `img.home-hero-plant`, bukan trigger Wishlist. Klik normal dari header yang sudah terlihat membuka panel dengan benar pada Beranda/Katalog. Pengujian harus menunggu header terlihat dan bounds stabil sebelum klik; jangan mengganti perilaku produk untuk meloloskan koordinat klik yang keliru.
- Buket sempat timeout pada pemulihan gambar. Probe context bersih berhasil memuat komposisi dengan empat pilihan; run ulang suite asli lulus 17 kelompok tanpa perubahan UI. Timeout awal tetap dicatat sebagai masalah determinisme/pemuatan yang belum memiliki sebab tunggal terkonfirmasi, bukan bukti pemulihan gambar selalu rusak.

**Dampak:** suite merah dapat menutupi pemeriksaan berikutnya dan tidak memberi keputusan regresi yang stabil. **Perbaikan:** periksa tujuan dan semantik pemulihan, bukan satu kata copy; tunggu kesiapan halaman tujuan sebelum memeriksa label/fokus. Pertahankan seluruh assertion bisnis yang relevan.

**Lokasi:** `tests/e2e/browser/verify-homepage.cjs:130`, `verify-care-guide-detail.cjs:113`, `verify-account.cjs:253`; hasil mentah suite, `probes.json` dan `failure-verification.json`. **Perintah:** `$impeccable harden`, lalu jalankan ulang suite terkait.

### F09 — P2: tanggal contoh Pembayaran tidak koheren

**Kategori:** konsistensi data pratinjau.

Pembayaran pending yang dibuat 20 November 2026 menampilkan jadwal kirim 14 November 2026. `createdAt` mengikuti waktu berjalan, tetapi `deliveryDate` masih literal `2026-11-14`.

**Dampak:** demonstrasi terlihat menyatakan pengiriman sebelum pesanan dibuat; state dan aturan jadwal sulit dinilai dengan fixture yang saling bertentangan. **Perbaikan:** gunakan satu waktu acuan fixture untuk pembuatan, kedaluwarsa dan jadwal yang sah. Jangan mengubah tanggal pesanan produksi di frontend.

**Lokasi:** `public/assets/js/storefront/payment-preview-data.js:122`; bukti visual `sheet-14.png`. **Perintah:** `$impeccable harden`.

### F10 — P3: Akun meminta favicon yang tidak tersedia

**Kategori:** kelengkapan aset. Halaman Akun tidak menetapkan favicon seperti halaman storefront lain, sehingga browser meminta `/favicon.ico` dan menerima 404. Konten Akun tetap tampil.

**Perbaikan:** gunakan favicon SVG existing melalui deklarasi head yang sama. **Lokasi:** `public/pages/customer/account.html:11`. **Perintah:** `$impeccable polish`.

### F11 — P3: penulisan rupiah belum seragam

**Kategori:** konsistensi mikrocopy. Kartu daftar menulis `Rp128.999`, Keranjang menggunakan `Rp 289.000`, sedangkan Pembayaran kembali tanpa spasi. Nilainya tidak salah, tetapi format di alur yang sama berubah.

**Perbaikan:** pilih satu format rupiah dan satuan untuk ringkasan, harga produk serta pembayaran, tanpa mengubah presisi atau perhitungan angka. Gunakan utilitas yang sudah sesuai dan uji nilai panjang.

**Lokasi:** `public/assets/js/storefront/storefront-product-card.js`, `cart.js`, `payment.js`. **Perintah:** `$impeccable clarify`, `$impeccable polish`.

## Temuan positif dan pengecualian

- Semua keadaan awal yang diperiksa memiliki satu `main`, satu h1 yang terlihat, `lang="id"` pada dokumen, tanpa ID ganda atau kontrol terlihat tanpa nama dari pemeriksaan DOM. Seluruh elemen gambar mempunyai atribut alt; kualitas semua deskripsi belum disertifikasi dengan pembaca layar.
- Tidak ditemukan overflow halaman atau pageerror pada 136 kondisi render. Dua kolom kartu ponsel dipertahankan sesuai keputusan pengguna; scroller kategori dan tab yang disengaja bukan otomatis bug overflow.
- Fokus keyboard terlihat pada awal tiap route. Skip link yang berukuran 1px saat tersembunyi tidak dihitung sebagai target sentuh rusak; ketika fokus, ia muncul dengan ring yang terlihat.
- Hover CTA About/Cara Memesan diperiksa langsung: teks putih di hijau gelap atau hijau di putih. Dua warning detector tentang putih-di-putih adalah false positive pada konteks tersebut.
- Warning category `<img>` tanpa src berasal dari elemen yang diisi secara dinamis; gambar kategori tampil dan tidak ada kegagalan resource foto pada route normal. Tidak dihitung sebagai gambar produk rusak.
- Detector “Primary font: inter” terlalu luas bila dimaknai sebagai seluruh isi halaman; isi utama tetap Poppins. Namun Inter memang digunakan pada footer, sehingga F03 tetap valid.
- Dugaan klik Wishlist langsung menavigasi di Beranda tidak terkonfirmasi pada probe: panel Beranda dan Katalog sama-sama terbuka, `aria-expanded=true`. Handler Beranda memiliki guard `data-header-wishlist-trigger`. Dugaan ini dikeluarkan dari temuan produk, bukan dilaporkan sebagai bug pasti.
- Dugaan target navigasi Mitra terlalu kecil dari satu pengukuran tidak terulang: probe pada 390/320 mengukur utility dan kategori 44px, desktop kategori 51px. Tidak dihitung sebagai pelanggaran ukuran target.
- Status HTTP pada halaman kondisi sistem benar pada server preview, ilustrasi botanical tetap sesuai arahan, dan pemulihan ke Beranda/Katalog/Kontak tersedia.
- Perbedaan susunan autentikasi, artikel, editor buket dan transaksi mengikuti fungsi masing-masing. Audit tidak menuntut semua halaman memakai satu layout yang sama.

## Batas pemeriksaan

Chrome headless di Windows, viewport emulasi dan context fixture. Belum diuji di perangkat fisik, Safari/Firefox, NVDA/JAWS, jaringan seluler nyata, atau zoom teks 200% secara menyeluruh. Pengujian gesture terarah menggunakan sintesis touch; ukuran viewport sendiri tidak membuktikan semua gesture bekerja. Gradien/foto, dialog/state yang tidak dikunjungi suite, serta integrasi produksi memerlukan pemeriksaan tambahan sesuai cakupan.

## Tindakan yang disarankan

1. **P1 — `$impeccable colorize` dan `$impeccable clarify`:** tutup kontras F01 dan konflik janji header F02 sebelum rilis.
2. **P2 — `$impeccable typeset` dan `$impeccable adapt`:** footer Poppins, resep banner informasi, badge/unit dan harga panjang F03–F06.
3. **P2 — `$impeccable optimize`:** aset galeri/font F07, dengan pengukuran ulang setelah perubahan.
4. **P2 — `$impeccable harden`:** perbaiki determinisme suite dan tanggal fixture F08–F09, lalu jalankan ulang pemeriksaan terkait.
5. **P3 — `$impeccable clarify`, kemudian `$impeccable polish`:** format rupiah dan favicon F10–F11; ulangi `$impeccable audit` setelah seluruh perbaikan.

Urutan perbaikan dapat dijalankan satu per satu atau bersama sesuai prioritas. Audit ini belum melakukan perubahan UI, commit, push atau deployment.

## Hasil suite dan verifikasi ulang

Run awal: **22 dari 27 suite lulus; 5 suite gagal**. Hasil gagal tetap disimpan dan tidak diubah menjadi lulus berdasarkan inspeksi sumber.

- Buket: run ulang suite asli lulus 17 kelompok tanpa perubahan UI; timeout awal tetap tercatat.
- Wishlist: run ulang tetap gagal. Log diagnostik menunjukkan klik otomatis mengenai foto hero ketika header bergerak, bukan ikon Wishlist. Probe klik header yang stabil berhasil membuka panel.
- Homepage: tujuan kategori dan empty-state recovery benar; assertion satu kata copy sudah tertinggal.
- Detail Panduan: probe yang menunggu Detail Produk selesai memuat mendapat label Panduan Perawatan dan dapat kembali ke artikel. Suite asli masih gagal pada pembacaan label yang terlalu dini.
- Akun: probe Google-only membuka Lupa Kata Sandi dengan returnTo yang sah, sementara assertion masih menunggu dialog lama.

Empat suite tersebut belum dinyatakan lulus karena sumber tes asli tidak diubah dalam audit. Seluruh laporan mentah, run ulang dan diagnostik tersedia dalam direktori bukti.

| Suite | Exit awal | Jumlah pemeriksaan yang dilaporkan |
| --- | --- | --- |
| homepage | FAIL | terhenti / lihat log |
| catalog | PASS | 19 |
| product-detail | PASS | 13 |
| information-pages | PASS | 7 |
| shipping-information | PASS | 18 |
| cancellation-refund | PASS | 14 |
| terms-conditions | PASS | 14 |
| how-to-order | PASS | 14 |
| about | PASS | 14 |
| public-errors | PASS | 30 |
| category-products | PASS | 16 |
| category-navigation | PASS | 4 |
| care-guides | PASS | 13 |
| care-guide-detail | FAIL | terhenti / lihat log |
| commercial-pages | PASS | 14 |
| storefront-sticky | PASS | 7 |
| shared-checkbox | PASS | 8 |
| catalog-gestures | PASS | 9 |
| customer-auth | PASS | 11 |
| wishlist | FAIL | terhenti / lihat log |
| cart | PASS | 19 |
| checkout | PASS | 17 |
| my-orders | PASS | 22 |
| order-detail | PASS | 34 |
| payment | PASS | 73 |
| account | FAIL | terhenti / lihat log |
| bouquet-customizer | FAIL | terhenti / lihat log |

## Matriks cakupan halaman

Setiap baris diperiksa pada 1440/768/390/320. Capture desktop dan ponsel tersimpan dengan nama route; variasi data pelanggan memakai query fixture yang tercantum di observations.json. Status error yang tertera adalah respons yang disengaja.

| Area / halaman | HTTP | Lebar diperiksa | Overflow halaman | Pageerror | Capture atas |
| --- | --- | --- | --- | --- | --- |
| public/about | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/about-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/about-390-top.png) |
| public/cancellation-refund | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/cancellation-refund-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/cancellation-refund-390-top.png) |
| public/care-guide-detail | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/care-guide-detail-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/care-guide-detail-390-top.png) |
| public/care-guides | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/care-guides-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/care-guides-390-top.png) |
| public/catalog | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/catalog-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/catalog-390-top.png) |
| public/category | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/category-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/category-390-top.png) |
| public/contact | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/contact-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/contact-390-top.png) |
| public/error-403 | 403 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/error-403-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/error-403-390-top.png) |
| public/error-404 | 404 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/error-404-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/error-404-390-top.png) |
| public/error-500 | 500 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/error-500-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/error-500-390-top.png) |
| public/faq | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/faq-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/faq-390-top.png) |
| public/florist-partners | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/florist-partners-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/florist-partners-390-top.png) |
| public/home | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/home-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/home-390-top.png) |
| public/how-to-order | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/how-to-order-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/how-to-order-390-top.png) |
| public/maintenance | 503 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/maintenance-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/maintenance-390-top.png) |
| public/new-collection | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/new-collection-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/new-collection-390-top.png) |
| public/privacy-policy | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/privacy-policy-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/privacy-policy-390-top.png) |
| public/product-detail | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/product-detail-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/product-detail-390-top.png) |
| public/shipping-information | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/shipping-information-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/shipping-information-390-top.png) |
| public/special-offers | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/special-offers-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/special-offers-390-top.png) |
| public/terms-conditions | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/terms-conditions-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/terms-conditions-390-top.png) |
| customer/account | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/account-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/account-390-top.png) |
| customer/bouquet-customizer | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/bouquet-customizer-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/bouquet-customizer-390-top.png) |
| customer/cart | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/cart-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/cart-390-top.png) |
| customer/checkout | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/checkout-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/checkout-390-top.png) |
| customer/my-orders | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/my-orders-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/my-orders-390-top.png) |
| customer/order-detail | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/order-detail-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/order-detail-390-top.png) |
| customer/payment | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/payment-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/payment-390-top.png) |
| customer/wishlist | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/wishlist-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/wishlist-390-top.png) |
| auth/customer-login | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/customer-login-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/customer-login-390-top.png) |
| auth/customer-register | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/customer-register-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/customer-register-390-top.png) |
| auth/forgot-password | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/forgot-password-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/forgot-password-390-top.png) |
| auth/reset-password | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/reset-password-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/reset-password-390-top.png) |
| auth/verify-email | 200 | 1440/768/390/320 | tidak | 0 | [desktop](../../storage/reports/public-ui-audit-2026-11-20/screenshots/verify-email-1440-top.png), [ponsel](../../storage/reports/public-ui-audit-2026-11-20/screenshots/verify-email-390-top.png) |

## Berkas audit yang ditambahkan

- tools/testing/audit-public-ui.cjs: pengukuran 34 route dan capture.
- tools/testing/audit-public-ui-evidence.cjs: hover, lembar perbandingan dan tujuan tautan.
- tools/testing/audit-public-ui-probes.cjs: harga panjang, CTA penutup, navigasi dan verifikasi state.
- tools/testing/run-public-ui-audit-suites.cjs: runner suite berurutan dan pelaporan exit.

Helper tersebut hanya untuk pemeriksaan pengembangan, tidak diimpor oleh halaman produksi.
