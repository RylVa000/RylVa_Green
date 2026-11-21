# Katalog RylVa Green

Implementasi frontend 16 November 2026, dilanjutkan dengan revisi sticky filter,
infinite scroll dan panel HP berdasarkan enam screenshot pengguna. Referensi
awal: Figma file LcUKB3k9C38G0g6KWo5zIU, frame Katalog 267:297.
Halaman aktif: /pages/public/catalog.html; alias preview /catalog.html dan
/katalog.html. Tidak ada commit, push atau deployment.

## Layout dan komponen

- Desktop memakai dua kartu horizontal per baris agar foto, harga, status dan
  tindakan tetap terbaca di samping filter. Pada lebar 701–1199px grid memakai
  satu kolom horizontal. Kartu HP mengikuti perilaku responsif homepage.
- Sidebar desktop sticky dengan jarak atas 16px dan tinggi terbatas viewport.
  Judul/Reset berada di luar area form yang digulir, sehingga opsi tidak bocor
  di atas judul. Semua bagian termasuk stok tetap dapat dijangkau.
- HP memakai tombol ikon Filter dan Urutkan. Filter membuka native dialog yang
  meluncur dari bawah, dengan navigasi Kategori/Harga/Diskon/Stok di kiri,
  isi yang dapat digulir di kanan, serta pencarian label filter.
- Urutan membuka sheet lebih pendek. Pilihan urutan langsung diterapkan lalu
  menutup panel. Reset urutan mempertahankan filter lain.
- Hanya ada satu form filter; catalog-controls.js memindahkannya dari sidebar
  ke sheet dan mengembalikannya saat tutup/resize. Tidak ada duplikasi ID atau
  dua salinan input yang harus diselaraskan.
- Renderer storefront-product-card.js tetap sama dengan homepage. Aset, token,
  Poppins, header, footer dan perilaku keranjang bersama tidak diubah dalam
  revisi interaksi ini.

## Filter dan penelusuran

Pencarian header, kategori jamak, rentang harga rupiah, minimum diskon serta
ketersediaan memperbarui hasil langsung. Kategori jamak menggunakan OR, tanpa
pilihan berarti semua kategori. Harga bertitik diterima sebagai rupiah bulat;
input bukan angka atau rentang terbalik memberi validasi inline dan tetap
menampilkan hasil terakhir yang valid. Reset dan chip filter tersedia.

Tombol Lihat N Produk pada sheet menutup panel; ini bukan tahap Terapkan.
Jika harga tidak valid, tombol memfokuskan isian yang perlu diperbaiki. Escape,
tombol tutup, klik backdrop dan Back menutup panel serta memulihkan fokus.
Pilihan tetap berlaku; penutupan tidak membuang filter. Reload dan pergantian
viewport membersihkan penanda history panel yang sudah tidak terbuka.


Panel dapat ditarik turun dari pegangan/judul menggunakan touch atau mouse.
Pada touch, pull dari isi filter atau navigasi Kategori hanya menutup jika
area itu mulai dari posisi gulir paling atas. Scroll biasa tetap berfungsi;
tarikan pendek atau touchcancel mengembalikan panel. Filter, fokus pemicu dan
history dipertahankan; X/Back/Escape tetap tersedia. Animasi keluar/springback
menghormati reduced motion dan dibersihkan sebelum panel dibuka kembali.

Pilihan urutan tetap Pilihan RylVa, harga terendah/tertinggi dan nama.
Terbaru/terlaris/ulasan tidak dikarang karena fixture tidak memiliki data itu.

## Infinite scroll dan konteks

Awalnya maksimal enam produk ditampilkan. Sentinel menambahkan maksimal enam
berikutnya tanpa membuang node kartu yang sudah ada. Pemuatan berulang dicegah;
filter baru membatalkan append yang belum dirender dan memulai batas awal lagi.
Tombol Muat Produk Lainnya menjadi jalur keyboard dan fallback jika
IntersectionObserver tidak tersedia; fokus berpindah ke produk baru pertama.

Koleksi contoh berisi delapan produk: normalnya enam lalu dua, kemudian
penanda Semua produk sudah ditampilkan. Footer tetap dapat dijangkau.
Tidak ada duplikasi fixture untuk membuat daftar seolah-olah tak habis.
Ini progressive rendering atas hasil adapter existing, bukan klaim request
pagination server atau endpoint produksi yang baru.

URL menyimpan q, category (dapat berulang), min_price, max_price, discount,
available, sort, saved dan loaded. loaded mempertahankan jumlah produk yang
sudah dibuka. Parameter page lama dibaca sebagai batas kumulatif lalu dinormalisasi.
Detail ringkas memakai product, selalu dibuka dari atas; kembali memulihkan
jumlah kartu, pilihan, posisi gulir dan fokus. Detail produksi tetap terpisah.

## Data dan state

Delapan produk, harga dan stok merupakan fixture existing. Calathea tetap
Rp75.000 mengikuti Keranjang; diskon dihitung dari nominal. Sirih Gading memakai
PNG Figma layer 272:690 yang sudah ditambahkan pada implementasi awal; foto
homepage tidak diubah. Wishlist contoh berlaku selama halaman terbuka.
Tambah ke keranjang memakai adapter existing, menghindari pengiriman ganda,
memperbarui badge serta mempertahankan handoff ke Keranjang/Checkout existing.

State existing tetap tersedia: loading, kosong, tanpa hasil, error, offline,
timeout, maintenance, harga sebagian/tidak valid, produk habis, gambar gagal,
konten panjang, tambah gagal/berhasil, konflik, pembatasan percobaan dan reduced
motion. Katalog publik tidak diberi state login/MFA palsu.

Workbench /__preview/catalog tetap terpisah dari alur pengguna. Parameter
?preview=catalog&state=... hanya aktif di localhost/loopback. Lima belas skenario
adapter tetap tersedia; mutasi workbench di memori, bukan data produksi.

Backend PHP/database, validasi stok/harga server, reservasi, pagination layanan,
dan konten perawatan terverifikasi belum terhubung. RylvaCatalogAdapter adalah
seam frontend; adapter contoh dan scaffold PHP tetap dibedakan dari produksi.

## Pemeriksaan

Tes aktif: tests/e2e/browser/verify-catalog.cjs; 19 kelompok lulus, 0 page error.
Bukti revisi di
storage/reports/catalog-interactions: verification.json, enam viewport 320–1920px,
rail sticky yang digulir, sheet HP 320/390px, urutan, filter harga dan state edge.
Pemeriksaan mencakup append/end/duplikasi, fallback keyboard, history dan reload,
form tunggal, batas konten, fokus/penutupan, validasi dan perpindahan viewport.

[Laporan revisi interaksi](../design/reviews/catalog-interaction-review-2026-11-16.md).
[Laporan implementasi awal dan gate generik](../design/reviews/catalog-review-2026-11-16.md)
merupakan riwayat, bukan bukti gate baru. DESIGN.md tetap dipertahankan.

Revisi gestur: tests/e2e/browser/verify-catalog-gestures.cjs lulus 9 kelompok
menggunakan input touch/mouse CDP Chrome; regresi Katalog 19 kelompok juga lulus.
Bukti: storage/reports/catalog-gestures. Bukan pengujian perangkat iOS fisik.
[Laporan gestur](../design/reviews/catalog-sheet-gesture-review-2026-11-16.md).

## Ekstensi kategori, 19 November 2026

Kategori Produk memakai ulang filter, kartu, sheet dan adapter Katalog pada
`/pages/public/category.html?category=plants`. Pembatasan satu kategori hanya
berlaku ketika konteks halaman kategori tersedia; Katalog umum mempertahankan
filter multi-kategori. Tautan kategori di navigasi kini membuka route kategori,
sedangkan filter checkbox di Katalog tetap bekerja seperti sebelumnya.
Regresi `verify-catalog.cjs` kembali lulus 19 kelompok setelah selector navigasi
disesuaikan dengan tautan native dan tujuan baru yang disepakati.
[Cakupan Kategori Produk](category-products-ui.md).
