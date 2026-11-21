# Koleksi Baru, Promo Spesial, Mitra Florist

Tanggal 20 November 2026. Frontend publik dalam proyek existing. Pengguna memilih
Mitra Florist sebagai **informasi kerja sama dan kontak**, bukan direktori atau
formulir pengajuan.

## Cakupan

- `/pages/public/new-collection.html`: empat anggota koleksi contoh yang dipilih
  eksplisit dari fixture existing, tanpa tanggal penambahan atau klaim urutan
  terbaru yang belum ada datanya.
- `/pages/public/special-offers.html`: produk contoh yang harganya lebih rendah
  dari harga dasar. Semua diskon positif termasuk yang di bawah 5%; minimum
  diskon tambahan tetap filter opsional. Tidak membuat voucher, periode atau
  countdown. Jadwal promo belum diterbitkan, dijelaskan pada keterangan pratinjau.
- `/pages/public/florist-partners.html`: pengantar kerja sama, informasi usaha
  yang dapat disiapkan, email/Kontak, dua FAQ dan CTA di tengah. Tidak mengarang
  nama/logo mitra, biaya, ketentuan, benefit, persetujuan atau janji waktu balasan.

Keenam alias Inggris/Indonesia terdaftar pada config preview. Navigasi shared
mengubah ketiga tujuan menjadi tautan native; label, logo, menu kategori,
header sticky/hide dan footer tetap memakai komponen existing. Handler lama
berbasis tombol tidak lagi mengubah tujuan tersebut menjadi filter/dialog.

## Komponen dan kontrak

Koleksi/promo membungkus `RylvaHomepagePreviewRepository` melalui boundary
`RylvaCatalogAdapter`; tidak menyalin controller atau renderer produk. Kartu,
harga/stock, Wishlist, cart, price validation, chip, filter dan sort sheet,
native dialog focus, infinite-scroll fallback serta Detail/Back memakai Katalog.
Reset menghapus pilihan pengguna sambil mempertahankan anggota koleksi/promo.

Header search pada kedua daftar mencari dalam scope aktif. Pada Mitra, pencarian
produk tetap mengarah ke Katalog. Pencarian, kategori, harga, minimum diskon,
stok, urutan dan jumlah hasil dipertahankan oleh URL dan pemulihan existing.
Tombol kembali Detail Produk menyebut Koleksi Baru atau Promo Spesial dan
mengembalikan posisi gulir serta fokus kartu.

Mitra memakai pembaca artikel/scrollspy dan disclosure existing. Tautan email
beralamat `rylvagreen@gmail.com` dari halaman Kontak, dengan subject kerja sama.
Klik membuka aplikasi email pengguna; tidak mengirim pesan atau menyatakan
pengajuan berhasil. Alamat tetap terlihat untuk disalin jika aplikasi tidak
terbuka, dan halaman Kontak menjadi alternatif. Tidak ada form atau data pribadi
yang disimpan oleh halaman Mitra.

## State dan pemulihan

| Area | State | Perilaku/pemulihan |
| --- | --- | --- |
| Daftar | Default/hover/fokus/selected | Renderer dan kontrol Katalog existing, current page pada header. |
| Daftar | Loading/refresh | Status pemuatan; scope halaman dan kontrol tetap tersedia. |
| Daftar | Load error/offline/timeout/maintenance | Retry mempertahankan URL/pilihan; tidak mengganti dengan koleksi umum. |
| Koleksi | Kosong | Pesan koleksi belum tersedia serta tautan semua produk. |
| Promo | Kosong/periode contoh berakhir | Pesan sesuai keadaan dan jalur ke Katalog, tanpa harga promo palsu. |
| Filter | Tanpa hasil | Reset mengembalikan koleksi aktif, bukan seluruh katalog. |
| Harga | Tidak valid | Penjelasan inline, hasil valid terakhir dipertahankan; isian dapat diperbaiki. |
| Data | Sebagian/harga hilang | Informasi sebagian dijelaskan; data sah tetap tersedia. Harga tidak diketahui tidak bisa dibeli. |
| Produk | Tidak tersedia | Status teks dan pembelian disabled; informasi masih dibaca. |
| Foto/teks | Gambar gagal/nama dan angka panjang | Fallback serta wrapping mengikuti kartu existing. |
| Shopping | Add gagal/konflik/rate limit | Feedback dan pemulihan adapter existing; aksi pending mencegah pengiriman ganda. |
| Sheet | Terbuka/ditutup/Back/Escape | Form tunggal, pilihan tetap berlaku, fokus kembali ke pemicu. |
| Mitra | TOC/FAQ terbuka/tertutup/aktif | Native disclosure, keyboard, scrollspy dua arah; tanpa loading bisnis palsu. |
| Email | Aplikasi tidak terbuka | Alamat dapat disalin dan tautan Kontak tersedia; tidak membuat status terkirim palsu. |
| Tanpa JS | Daftar dan Mitra | Daftar menjelaskan kebutuhan JS dan jalur Katalog; seluruh isi/FAQ/kontak Mitra native. |

Workbench `/__preview/collections` berisi skenario terpisah untuk dua daftar
(32 tautan). Semua fault injection dibatasi loopback dan parameter preview.
Mitra tidak diberi state pengiriman, penyimpanan, login atau layanan API buatan.

## Pemeriksaan

Laporan/capture disimpan di `storage/reports/commercial-pages/` dan
`.impeccable/review/commercial-pages/`.

- Target: 14 kelompok pemeriksaan browser lulus pada 1440/1024/768/390/320,
  tanpa pageerror atau request mutasi. Mencakup filter/search/Reset, harga invalid,
  reload, Detail/Back beserta posisi/fokus, sheet keyboard, shopping, delapan
  failure/retry, empty/partial/foto gagal, alias, tanpa JS dan navigasi dari enam
  halaman existing. Browser context terisolasi menjaga guest state setiap run;
  Detail ditunggu sampai selesai memuat agar history push tidak dibaca sebagai
  navigasi halaman yang sudah siap.
- Regresi: Katalog 19, Detail Produk 13, halaman informasi 7, Buket Kustom 17;
  total bersama target **70 kelompok lulus**.
- Dua puluh capture diperiksa satu per satu, termasuk FAQ terbuka, nama panjang,
  koleksi kosong, promo berakhir dan gambar gagal. FAQ Mitra sudah memakai kelas
  komponen existing. Reviewer meminta satu perbaikan lokal: harga sangat panjang
  di kartu ponsel kini minimal 14px dan unit 12px pada baris berikutnya, tanpa
  mengubah dua kolom. Run target terakhir lulus serta memperbarui 20 capture;
  tiga capture yang diminta reviewer diperiksa kembali. Pengujian memastikan
  nilai harga lengkap dan tidak melampaui kartu.
- Syntax 11 berkas JS/CJS dan `git diff --check` lulus; provenance 28 raster,
  0 metadata hilang; copy lint ketiga route 0 FAIL/0 WARN.
- Pemeriksa desain otomatis **belum lulus seluruhnya**. Taste representatif
  Koleksi Baru: `GATE: FAIL 42`; Hallmark tiga route: 29 FAIL/16 REFLEX/10 WARN;
  detector: 28 advisory/warning. Performance masing-masing route: 38 PASS,
  4 FAIL, 6 WARN, terutama font Poppins dan aset footer existing. Semua temuan,
  alasan cakupan, serta batas pengukuran ada pada
  [laporan kualitas](commercial-pages-quality.md).

Review independen awal: `fix`, satu temuan keterbacaan harga panjang.
Verdict setelah koreksi: `ship`, temuan dinilai `Resolved`. Ini verdict atas
perbaikan harga panjang yang diminta reviewer, bukan pernyataan seluruh
storefront bebas masalah atau semua raw checker lulus. Bukti lengkap:
`storage/reports/commercial-pages/finish-review.md`.

## Kebutuhan produksi

Metadata keanggotaan/tanggal koleksi baru, periode diskon produk aktif menurut
D-09 dan layanan katalog produksi belum tersedia. Harga/stock divalidasi server
sebelum transaksi; UI ini tidak menegakkan atau mengklaim integrasi produksi.
Form program/direktori mitra bukan scope yang dipilih. Ketentuan kerja sama
nyata perlu diberikan pemilik sebelum dipublikasikan sebagai aturan program.

PRODUCT.md, DESIGN.md, font, foto, logo dan token dipertahankan. Tidak ada aset
baru, endpoint, commit, push atau deployment.
