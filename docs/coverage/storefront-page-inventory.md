# Inventaris desain dan implementasi storefront

Pemeriksaan langsung pada 13 November 2026 melalui Figma MCP dan berkas proyek.
File sumber: [Morkup TA Web Berryl](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=0-1).
Tidak ada desain atau kode aplikasi yang diubah pada pemeriksaan ini.

Inventaris membedakan keberadaan desain, implementasi UI dan integrasi produksi.
Frame tersedia tidak berarti seluruh interaksi/state lengkap. Scaffold PHP
berisi komentar tidak dihitung sebagai implementasi halaman yang berfungsi.

## Halaman publik dan pelanggan

| Halaman/alur | Bukti Figma | Kondisi kode aktif |
| --- | --- | --- |
| Beranda | Home page rev `466:386` dipilih pengguna; sumber diperiksa ulang 15 November | `public/pages/public/home.html` tersedia sebagai pratinjau interaktif. [Cakupan Homepage](homepage-ui.md); backend PHP masih scaffold. |
| Katalog | Katalog `267:297`; diperiksa ulang 16 November | `public/pages/public/catalog.html` tersedia sebagai frontend interaktif dengan kartu homepage. [Cakupan Katalog](catalog-ui.md); backend PHP masih scaffold. |
| Detail produk | Detail Produk `282:838`; diperiksa ulang 17 November | `public/pages/public/product-detail.html` tersedia dengan galeri, perawatan, jumlah, keranjang dan handoff Checkout. [Cakupan Detail Produk](product-detail-ui.md); backend PHP masih scaffold. |
| Keranjang | Keranjang `335:251` dan Keranjang kosong `360:372` | Pembaruan 14 November: `public/pages/customer/cart.html` tersedia sebagai pratinjau interaktif. [Cakupan dan batas integrasi](cart-ui.md); template/backend PHP masih scaffold. |
| Checkout | Checkout `375:108`; alamat, produk, kurir, pembayaran dan ringkasan | Pembaruan 14 November: `public/pages/customer/checkout.html` tersedia sebagai frontend pratinjau interaktif. [Cakupan UI Checkout](checkout-ui.md); template/backend PHP masih scaffold. |
| Login pelanggan | Login page — RylVa Green `428:264` | Pembaruan 15 November: `public/pages/auth/customer-login.html` tersedia sebagai UI pratinjau; login staf terpisah. [Cakupan autentikasi](customer-auth-ui.md). |
| Registrasi | Register Page `72:136` | `public/pages/auth/customer-register.html` tersedia sebagai pratinjau; backend masih scaffold. |
| Verifikasi email | OTP `90:220` | `public/pages/auth/verify-email.html` tersedia dengan OTP contoh, resend dan pemulihan; pengiriman email belum terhubung. |
| Lupa kata sandi | Forget Pass `126:114` | `public/pages/auth/forgot-password.html` tersedia sebagai pratinjau dengan respons generik. |
| Kata sandi baru | New Pass `126:155` | `public/pages/auth/reset-password.html` tersedia sebagai pratinjau token sekali pakai; password produksi tidak diubah. |
| Kontak | Contact Page `137:311`; pengguna juga memberikan `Contact.html` pada 17 November | `public/pages/public/contact.html` mengintegrasikan isi file pengguna dengan shell aktif. Formulir membuka draf email; tidak ada endpoint pengiriman formulir. [Cakupan halaman informasi](information-pages-ui.md). |
| Pusat Bantuan / FAQ | Pengguna memberikan `FAQ.html`, `tanaman.css` dan `tanaman.js` pada 17 November | `public/pages/public/faq.html` tersedia dengan delapan pertanyaan asli, accordion keyboard dan tautan Kontak. |
| Kebijakan Privasi | Pengguna memberikan `PrivacyPolicy.html` pada 17 November | `public/pages/public/privacy-policy.html` mempertahankan delapan bagian dan tanggal dokumen sumber. Ini impor konten; bukan bukti layanan yang disebut telah terintegrasi. |
| Pilih alamat | Pilih Alamat Page `409:107`; berupa dialog/panel | Buku alamat/form tersedia pada Akun; pemilih, formulir dan peta juga tersedia pada pratinjau Checkout. Persistence produksi belum terhubung. |
| Tambah alamat | Tambah Alamat #1 `435:105` untuk lokasi dan #2 `435:130` untuk formulir | `templates/customer/profile_addresses.php` masih scaffold. |
| Kustomisasi buket | Section Costum Buket `454:1347`, frame 1920w light `454:1201` | [Spesifikasi tertulis Buket Kustom](../design/surfaces/bouquet-customizer-surface.md) tersedia, termasuk keputusan preview otomatis. UI pelanggan kini tersedia pada `/pages/customer/bouquet-customizer.html`, dengan preview otomatis, editor, keranjang dan checkout contoh. Lihat [cakupan implementasi](bouquet-customizer-ui.md). Backend tetap scaffold; Konva arsip bukan route aktif. |
| Pembayaran | Tidak ditemukan frame halaman pelanggan tersendiri pada file yang diperiksa | `public/pages/customer/payment.html` tersedia sebagai pratinjau data contoh. |
| Detail Pesanan | Tidak ditemukan frame pelanggan lengkap. Node `356:349` bernama Detail Pesanan hanya bertipe TEXT; bukan halaman | `public/pages/customer/order-detail.html` tersedia sebagai pratinjau, termasuk Lacak, komplain, pembatalan dan penerimaan. |
| Pesanan Saya | Tidak ditemukan frame halaman pelanggan tersendiri | `public/pages/customer/my-orders.html` tersedia sebagai pratinjau; identitas/konteks terhubung ke Detail/Pembayaran. |

Pada halaman `00 Public` ditemukan 18 frame halaman/state utama dalam kelompok
di atas, termasuk tiga varian beranda, keranjang kosong, tiga tampilan alamat
dan satu konsep buket. Aset, logo, dropdown, teks lepas dan komponen tidak
dihitung sebagai halaman tambahan. Seluruh 18 frame tersebut dilihat melalui
render Figma; interaksi prototipe tidak diuji sebagai aplikasi.

## Yang belum ditemukan sebagai desain pelanggan tersendiri

- Profil dan pengaturan akun pelanggan. Tiga tampilan alamat yang ada dapat
  dipakai kembali untuk bagian alamat; tidak perlu didesain ulang dari nol.
  [Spesifikasi tertulis](../design/surfaces/customer-account-surface.md) disusun
  setelah inventaris ini; berikutnya frontend pratinjau diimplementasikan pada
  `public/pages/customer/account.html`. [Cakupan UI akun](customer-account-ui.md)
  memisahkan hasil implementasi dari desain Figma dan layanan produksi.
- Wishlist belum ditemukan sebagai frame khusus Figma. Implementasi frontend
  pratinjau kini tersedia pada `public/pages/customer/wishlist.html`, mengikuti
  [spesifikasi Wishlist](../design/surfaces/wishlist-surface.md) dan keputusan
  guest sementara serta akun permanen. [Cakupan UI](wishlist-ui.md) mencatat
  store hati bersama, penggabungan akun pratinjau, state dan pemeriksaannya;
  layanan persistence akun produksi belum terhubung.
- Halaman kategori khusus. Katalog sudah mempunyai filter kategori, namun
  belum ditemukan frame halaman kategori dengan nama/deskripsi kategorinya.
  Kebutuhan ini dapat dipenuhi sebagai varian katalog, tanpa layout baru total.
- Frame Figma Pusat Bantuan/FAQ dan Kebijakan Privasi belum ditemukan, tetapi
  HTML pengguna kini diintegrasikan ke route aktif. Cara Memesan, Informasi
  Pengiriman dan Pembatalan & Refund sebagai halaman lengkap masih belum tersedia.
- Tentang Kami serta Syarat & Ketentuan.
- Kondisi 403/404/500/maintenance khusus storefront. Frame kondisi sistem yang
  ditemukan pada halaman `04` memakai area staf; keberadaannya tidak dianggap
  otomatis memenuhi desain pelanggan.

Nama menu/footer yang menyebut tujuan di atas tidak dihitung sebagai desain
halamannya. Form komplain dan pelacakan sudah ada pada kode Detail Pesanan;
tidak perlu otomatis membuat route terpisah hanya karena ada nama template PHP.

## Bagian yang sudah ada tetapi belum dapat disebut final

1. Kustomisasi buket masih bertuliskan “floret.” dan berbahasa Inggris, dengan
   bidang pratinjau dan thumbnail abu-abu. Ini bukti konsep tersedia, bukan
   rancangan RylVa lengkap yang siap diimplementasikan tanpa penyesuaian.
2. Contact Page dan Landing Page lama memakai shell yang berbeda dari shell
   Figma Checkout yang dipin pengguna. Pertahankan konsep yang relevan, lalu
   selaraskan saat implementasi; jangan menganggap halaman belum ada.
3. Ada tiga varian beranda. Home page rev memiliki struktur storefront paling
   baru menurut penamaannya, tetapi tidak ada keputusan baru pada pemeriksaan
   ini yang menghapus atau menetapkannya menggantikan semua versi sebelumnya.
4. Keranjang masih memuat teks placeholder area rekomendasi. Checkout mempunyai
   label jadwal/slot/metode yang sebagian juga berada sebagai teks lepas di
   kanvas. Keberadaan frame tidak membuktikan seluruh kontrol dan state final.
5. OTP menampilkan enam kolom kode, tetapi keterangannya menyebut tautan email.
   Copy perlu diselaraskan dengan alur kode verifikasi P-29 saat implementasi.
6. Frame utama yang diperiksa terutama desktop. Tidak ditemukan varian mobile/
   tablet halaman publik tersendiri dalam inventaris utama ini. Responsivitas
   tiga halaman pelanggan kode telah dicatat dalam dokumen cakupannya.

## Area staf yang sudah tersedia

Enam page Figma ditemukan: `00 Public`, `01 Admin — Operasional`,
`02 SuperAdmin — Kontrol`, `03 Akses & Akun Staf`, `04 State & Pemulihan` dan
`05 Komponen Staf`. Inventaris struktur page 01–04 berisi 259 frame desktop
halaman/detail/dialog/state, bukan 259 halaman modul yang berbeda. Page 05
berisi foundations, button serta kelompok komponen dan tidak dihitung sebagai
halaman pelanggan tambahan.

Implementasi staf tetap 20 halaman utama/pendukung HTML sesuai
[staff-ui-completion.md](staff-ui-completion.md). Detail, form dan state berada
dalam modul. Bukti pemeriksaan struktur Figma tersimpan lokal di
`storage/reports/figma-page-inventory-2026-11-13.json`.

## Arah pekerjaan berikutnya

- **Jika menambah desain yang belum ada:** Cara Memesan, Informasi Pengiriman,
  Pembatalan & Refund, Tentang Kami serta Syarat & Ketentuan. Kontak, FAQ dan
  Kebijakan Privasi kini memakai file pengguna pada route aktif;
  frame Wishlist tersendiri bila diperlukan.
  Frontend Wishlist sudah tersedia sebagai pratinjau. Profil & Pengaturan
  Akun sekarang tersedia di kode sebagai pratinjau; frame lengkap Figma masih
  merupakan pekerjaan tersendiri.
- **Jika melengkapi desain yang sudah ada:** pemeriksaan kelengkapan konten,
  state dan responsif halaman belanja. Kustomisasi buket dan konsistensi shell
  Kontak sudah diimplementasikan sebagai frontend pratinjau.
- **Jika melanjutkan implementasi:** halaman belanja utama, autentikasi,
  Wishlist dan tiga halaman informasi sudah tersedia sebagai UI pratinjau.
  Berikutnya halaman pendukung yang masih kosong atau integrasi backend sesuai
  prioritas baseline.
- **Jika menyelaraskan Figma dan kode:** tiga halaman transaksi serta Akun pelanggan yang
  sudah diimplementasikan belum tercatat sebagai frame pelanggan pada Figma
  yang diperiksa. Menambahkannya ke Figma merupakan pekerjaan tersendiri;
  pemeriksaan ini tidak melakukan impor atau perubahan desain.

Kode pelanggan saat ini menggunakan data contoh. Inventaris ini tidak
menyatakan gateway, autentikasi, kurir, database atau backend telah terintegrasi.
