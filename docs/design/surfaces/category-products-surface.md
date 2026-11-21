# Kategori Produk

Jenis bisnis: place, toko tanaman dan florist. Mode: Operate. Ekstensi Katalog
aktif untuk pengunjung publik; tidak membutuhkan login untuk menjelajah.

## Sumber dan cakupan

PRODUCT.md, DESIGN.md, baseline v2.6 bagian penelusuran produk, Katalog aktif
dan keputusan pengguna menjadi acuan. Kategori memakai taksonomi frontend
existing: plants, bouquet, custom, pots, media, tools, seeds, accessories,
terrarium. Plants mencakup indoor/outdoor; media mencakup media/nutrients.
Tidak mengubah kontrak produk. Delapan fixture saat ini semuanya tanaman;
kategori lain menampilkan kosong tanpa produk atau jumlah buatan.

## Direction contract

**THESIS:** Pengunjung memahami kategori yang dibuka dan menemukan produk
melalui kontrol Katalog yang sudah dikenal.

**OWN-WORLD:** Poppins, krem, hijau, kartu horizontal, checkbox membulat,
sidebar sticky serta bottom sheet Katalog tetap dipakai. Header/footer tidak
didesain ulang. Tidak ada hero marketing tinggi yang menjauhkan daftar produk.

**STORY:** Breadcrumb Beranda/Katalog/kategori, nama dan deskripsi kategori,
pilihan kategori, pengurutan, filter aktif, jumlah, kartu, muat berikutnya dan
akhir daftar. Detail produk memakai halaman existing.

**FIRST VIEWPORT:** Desktop menampilkan judul/deskripsi ringkas dan foto kategori
existing di atas daftar; sidebar berisi tautan kategori serta filter. Dua kartu
per baris mengikuti Katalog. Ponsel mempertahankan dua kartu ringkas per baris
dan kontrol bottom sheet existing; gambar kategori kecil tidak mengambil layar.

**FORM:** `seed: none (pinned)`. Pengguna menyetujui pengembangan Katalog dengan
judul/deskripsi kategori dan filter yang sesuai. UI Katalog aktif, kartu homepage
dan keputusan interaksi terdahulu menjadi visual authority. Tidak ada comp baru
atau pilihan dunia visual. Interaksi utama: filter langsung memperbarui hasil
tanpa melepas kategori; transisi dan reduced motion mengikuti komponen existing.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

DESIGN.md dipertahankan. Foto kategori dan produk memakai aset existing yang
memiliki provenance; tidak ada generasi, stok baru atau klaim perawatan baru.

## Route, interaksi dan state

`/pages/public/category.html?category=plants` membuka satu kategori. Tanpa
parameter tampil direktori kategori; parameter tidak dikenal/berulang yang
bertentangan menampilkan kategori tidak ditemukan dengan pilihan pemulihan.
Tidak diam-diam menganggap kategori asing sebagai plants. Tanpa JavaScript,
direktori native tetap dapat dibaca dan ada penjelasan kebutuhan JS pratinjau.

Kategori halaman tidak menjadi chip yang bisa dihapus. Reset membersihkan
pencarian, harga, diskon, stok, Wishlist dan urutan, tetapi mempertahankan kategori.
Mengganti kategori membuka kategori baru dengan filter bersih; Back dan URL tetap
memulihkan konteks sebelumnya. Pencarian pada kategori menyaring kategori itu;
pencarian pada direktori/tidak ditemukan membuka Katalog umum.

Pemuatan enam lalu sisa, validasi harga, loading, error/retry, offline, timeout,
maintenance, harga tidak lengkap, stok habis, gambar gagal, teks panjang,
pending/hasil keranjang, konflik, rate limit dan Wishlist memakai implementasi
Katalog existing. Kosong kategori berbeda dari filter tanpa hasil: yang pertama
mengarahkan ke kategori/Katalog lain, yang kedua menawarkan Reset Filter.
Buket Kustom dapat mengarah ke editor existing tanpa membuat produk baru.

Tautan kategori pada shell dan beranda mengarah ke route kategori baru; tautan
Semua Produk, Koleksi Baru, Promo dan editor Buket Kustom mempertahankan tujuannya.
Tautan native tetap melewati guard perubahan belum disimpan pada Keranjang/Buket.
Detail menerima kategori sebagai sumber kembali same-origin yang diizinkan,
memulihkan URL, jumlah termuat, gulir dan fokus. Tidak menambah bypass izin.

## Pemeriksaan dan batas

Uji desktop utama 1440/1920 serta 1024/768/390/320. Periksa judul, deskripsi,
current link, pembatasan kategori, Reset, pencarian/sort/harga, semua kategori
kosong, tidak ditemukan, URL/history, Detail/Back, Wishlist/Keranjang, panel/fokus,
no-JS, gambar, pending dan pemulihan kegagalan. Workbench terpisah memakai
adapter skenario Katalog yang hanya aktif di loopback.

Frontend tetap pratinjau. Endpoint baseline bukan bukti backend telah terhubung.
Admin/category persistence, produk kategori lain dan validasi stok/harga server
memerlukan integrasi nyata. Asumsi rutin: satu kategori per route; pengelompokan
media/pupuk dan indoor/outdoor mengikuti kontrak existing, bukan taksonomi baru.
