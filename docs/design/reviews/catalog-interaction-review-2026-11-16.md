# Review revisi interaksi Katalog, 16 November 2026

## Hasil

Permintaan sticky filter desktop, infinite scroll dan kontrol ikon/bottom sheet
HP sudah diimplementasikan. Dua kartu horizontal per baris dipertahankan pada
desktop lebar agar nama, harga dan tindakan tidak dipadatkan di samping filter.
Header, footer, font, palet serta renderer kartu homepage dipertahankan.

## Perubahan

- catalog.html: sidebar menjadi aside, toolbar ikon HP, sheet filter/urutan,
  serta sentinel/end marker menggantikan pagination bernomor.
- catalog.css: rail sticky dengan tinggi terbatas viewport, header di luar
  form scroller, toolbar HP dan bottom sheet yang menghormati reduced motion.
- catalog-controls.js: satu form dipindah ke sheet, navigasi/pencarian filter,
  pilihan sort, keyboard wrap, fokus, Back/Escape/backdrop, reload dan resize.
- catalog-filter.js: append progresif tanpa mengganti node lama, fallback
  tombol, pencegahan append ganda, jumlah loaded dalam URL dan pemulihan konteks.
- verify-catalog.cjs dan dokumentasi Katalog diperbarui.

Filter langsung memperbarui hasil. Lihat N Produk menutup panel; bukan tahap
Terapkan. Reset pada sheet urutan hanya mereset urutan. Kategori/atribut dari
referensi toko lain yang tidak ada dalam data proyek tidak ditambahkan.

## Bukti pengujian

verify-catalog.cjs lulus 19 kelompok, 0 page error. Cakupan:

- Enam viewport 1920/1440/1024/768/390/320, gambar lokal, overflow dan aksi kartu.
- Sticky top16px, semua opsi bisa digulir, header di luar wilayah scroll.
- Append otomatis, node lama tetap terhubung, tanpa duplikasi, finite end,
  loaded/scroll/detail/fokus dipulihkan melalui history dan reload.
- Fallback tanpa IntersectionObserver, keyboard mencapai produk baru pertama.
- Pencarian, kategori jamak, harga/diskon/stok/urutan, validasi dan Reset.
- Sheet 320/390px tanpa overflow, satu form, navigasi bagian dan hitungan langsung.
- Pencarian filter/kosong, focus wrap, Escape/Back, reset sort, harga tidak valid,
  resize dan reload/Forward lintas desktop/HP tanpa penanda history yang usang.
- Wishlist, keranjang/handoff, duplikasi tindakan, offline/error/retry dan
  state data/gambar existing.

node --check pada dua controller dan tes, serta git diff --check lulus.
Tidak ada build framework baru untuk situs HTML/CSS/JavaScript existing.
Bukti lokal: storage/reports/catalog-interactions/verification.json dan capture
catalog-sticky.png, catalog-mobile-filter.png, catalog-mobile-filter-price.png,
catalog-mobile-sort.png, catalog-filter-320.png serta enam capture viewport.

## Review visual

Review independen terbatas pada tujuh capture, source yang disampel, konteks
produk/desain dan laporan tes. Tidak mengklaim uji runtime mandiri atau
perbandingan langsung dengan screenshot referensi pengguna.

Satu temuan material: opsi yang digulir sempat terlihat di atas judul rail.
Diperbaiki dengan menempatkan judul sebagai saudara form, lalu hanya form yang
digulir. Capture diperbarui; assertion mengonfirmasi header berada di luar form
serta formTop tidak melampaui headingBottom. Reviewer menilai fix resolved dan
ship pada satu perbaikan itu. Tidak ada klaim review ulang seluruh permukaan.

Gate marketing generik tidak dijalankan ulang untuk revisi interaksi ini.
[Hasil gate awal](catalog-review-2026-11-16.md) merupakan riwayat yang masih
mencatat temuan shell/aturan marketing; hasil tes di sini bukan klaim bahwa
semua temuan tersebut selesai atau audit aksesibilitas menyeluruh lulus.

## Data dan integrasi

Tetap delapan produk contoh. Daftar menampilkan enam lalu dua dan berhenti saat
koleksi habis. Tidak menggandakan produk atau membuat endpoint agar daftar tampak
tak terbatas. Append saat ini memakai hasil adapter existing yang sudah dimuat;
pagination/fetch bertahap layanan produksi belum tersedia. Keranjang contoh dan
scaffold PHP tidak diubah menjadi transaksi atau backend produksi.
