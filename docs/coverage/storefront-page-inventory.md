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
| Beranda | Landing Page `59:1033`, home page `128:228`, Home page rev `466:386`; ketiganya diperiksa visual | `templates/public/home.php` masih scaffold; belum ada route HTML storefront aktif. |
| Katalog | Katalog `267:297`; filter dan kartu produk terlihat | `templates/public/catalog.php` masih scaffold. |
| Detail produk | Detail Produk `282:838`; galeri, pilihan ukuran, ongkir, perawatan dan tombol beli terlihat | `templates/public/product_detail.php` masih scaffold. |
| Keranjang | Keranjang `335:251` dan Keranjang kosong `360:372` | `templates/customer/cart.php` masih scaffold. |
| Checkout | Checkout `375:108`; alamat, produk, kurir, pembayaran dan ringkasan | `templates/customer/checkout.php` masih scaffold. |
| Login pelanggan | Login page — RylVa Green `428:264` | `templates/auth/login_register.php` masih scaffold; login staf merupakan modul berbeda. |
| Registrasi | Register Page `72:136` | Belum ada UI pelanggan aktif. |
| Verifikasi email | OTP `90:220` | `templates/auth/verify_email.php` masih scaffold. |
| Lupa kata sandi | Forget Pass `126:114` | `templates/auth/forgot_password.php` masih scaffold. |
| Kata sandi baru | New Pass `126:155` | `templates/auth/reset_password.php` masih scaffold. |
| Kontak | Contact Page `137:311`; diperiksa visual | Belum ada halaman storefront aktif. |
| Pilih alamat | Pilih Alamat Page `409:107`; berupa dialog/panel | Buku alamat dan form dua tahap tersedia pada pratinjau Akun. Pemilih Checkout belum dihubungkan. |
| Tambah alamat | Tambah Alamat #1 `435:105` untuk lokasi dan #2 `435:130` untuk formulir | `templates/customer/profile_addresses.php` masih scaffold. |
| Kustomisasi buket | Section Costum Buket `454:1347`, frame 1920w light `454:1201` | `templates/customer/bouquet_customizer.php` masih scaffold. Prototipe Konva lama di `tools/archive/prototypes/tes.html` merupakan arsip, bukan route pelanggan aktif. |
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
- Wishlist; pengerjaannya tetap mengikuti aktivasi fitur pada spesifikasi.
- Halaman kategori khusus. Katalog sudah mempunyai filter kategori, namun
  belum ditemukan frame halaman kategori dengan nama/deskripsi kategorinya.
  Kebutuhan ini dapat dipenuhi sebagai varian katalog, tanpa layout baru total.
- Pusat bantuan/FAQ, Cara Memesan, Informasi Pengiriman, Pembatalan & Refund.
- Tentang Kami, Kebijakan Privasi serta Syarat & Ketentuan.
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

- **Jika menambah desain yang belum ada:** halaman bantuan dan kebijakan yang
  sudah ditautkan navbar/footer; Wishlist bila diaktifkan. Profil & Pengaturan
  Akun sekarang tersedia di kode sebagai pratinjau; frame lengkap Figma masih
  merupakan pekerjaan tersendiri.
- **Jika melengkapi desain yang sudah ada:** kustomisasi buket, konsistensi
  kontak/shell, serta kelengkapan state dan responsif halaman belanja.
- **Jika melanjutkan implementasi:** pakai desain yang ada untuk Keranjang dan
  Checkout agar terhubung ke Pembayaran; tahap kode publik/katalog/detail produk
  dan autentikasi tetap perlu diselesaikan sesuai prioritas baseline.
- **Jika menyelaraskan Figma dan kode:** tiga halaman transaksi serta Akun pelanggan yang
  sudah diimplementasikan belum tercatat sebagai frame pelanggan pada Figma
  yang diperiksa. Menambahkannya ke Figma merupakan pekerjaan tersendiri;
  pemeriksaan ini tidak melakukan impor atau perubahan desain.

Kode pelanggan saat ini menggunakan data contoh. Inventaris ini tidak
menyatakan gateway, autentikasi, kurir, database atau backend telah terintegrasi.
