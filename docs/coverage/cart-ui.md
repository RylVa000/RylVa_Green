# Cakupan UI Lihat Keranjang

14 November 2026. Implementasi frontend pratinjau berdasarkan spesifikasi
[Keranjang](../design/surfaces/cart-surface.md) dan dua frame Figma `335:251`
serta `360:372`. Dokumen ini membedakan UI yang dapat dijalankan dari layanan
produksi yang belum tersedia.

## Halaman dan komponen

### Revisi referensi Blibli, 14 November 2026

Arahan terbaru pengguna mengganti komposisi isi dengan pola Keranjang
[Blibli](https://www.blibli.com/cart), sambil mempertahankan style RylVa.
Referensi diperiksa langsung di Chrome pengguna: tanpa pilihan, satu item
dipilih, lalu scroll. Pilihan dan posisi gulir dikembalikan sesudah pemeriksaan.
Tidak ada produk/harga/nama penjual atau data akun pengguna yang disalin ke UI
maupun fixture proyek. Browser dalam aplikasi memerlukan login; pemeriksaan
referensi selesai pada sesi Chrome yang sudah terbuka.

Yang diikuti: container terpusat dan dibatasi, toolbar pilihan di kiri,
kelompok produk dengan pemisah baris, foto kecil, nama/varian di atas harga,
kontrol jumlah di kanan bawah, serta panel Ringkasan Belanja yang tetap terlihat
saat scroll desktop. Ponsel/tablet mengikuti urutan baca tanpa bar fixed baru.

Yang disesuaikan: produk satu toko dikelompokkan sebagai Produk RylVa Green;
warna hijau/krem, Poppins, aset Figma, tombol Hapus bernama jelas, shell serta
dialog existing dipertahankan. Heading lebih ringkas dan harga tidak lagi
menjadi judul besar di kanan kartu.

Yang tidak diterapkan: banyak penjual, langganan, voucher, biaya platform,
gratis ongkir, logo pembayaran dan klaim keamanan Blibli. Referensi visual
tidak menambahkan aturan bisnis, biaya atau integrasi yang belum tersedia.
State dan validasi implementasi sebelumnya tetap berlaku.

Verifikasi revisi: 19 kelompok pemeriksaan dan 49 skenario lulus pada sembilan
lebar 320–1920 px, termasuk 720/1536 px yang relevan dengan browser pengguna.
Pemeriksaan mengukur harga di bawah/sejajar kiri nama, ukuran nama yang ringkas,
satu kelompok produk, panel ringkasan dan penanda fokus yang tidak terpotong.
Pemindaian layout sebelum dan sesudah perubahan tidak menemukan temuan pada
scope layout. Bukti revisi berada di `storage/reports/cart-blibli/` dan
`.impeccable/review/cart-blibli/`.

[Review revisi Blibli](../design/reviews/cart-blibli-finish-review.md) berakhir
dengan disposition **ship**. Verifikasi terakhir menilai penggantian jarak
dengan token bernilai sama dan peningkatan kontras minus nonaktif sebagai
resolved, tanpa perubahan geometri. Pratinjau pada browser pengguna juga
dimuat ulang dan tampilan baru dilihat langsung; pilihan belanjanya dipertahankan.
Hallmark final masih mencatat temuan lintas shell/aturan umum yang dijelaskan
pada laporan lokal; tidak dinyatakan lulus keseluruhan.

- Route utama: `public/pages/customer/cart.html`; alias `/cart.html` pada server
  pratinjau dan Apache. Workbench pengembangan: `/__preview/cart`.
- Shell, logo, pencarian global, footer ponsel buka-tutup, tombol, dialog,
  tipografi dan token memakai komponen/pola storefront existing. Perubahan
  bersama hanya menghubungkan tombol Keranjang serta nama halaman pada notice.
- Isi awal memakai kartu horizontal Figma; revisi terbaru memakai baris lebih
  ringkas dan panel ringkasan sesuai Blibli, dengan identitas/aset RylVa.
  Ponsel/tablet menumpuk mengikuti urutan baca. Keranjang kosong
  memakai ilustrasi sumber; tidak ada area rekomendasi placeholder.
- Wishlist item/voucher tidak diaktifkan; navbar existing dipertahankan sesuai
  keputusan pengguna. Total contoh Figma dibetulkan menjadi Rp289.000;
  potongan Rp61.000 ditampilkan sebagai nominal yang konsisten, bukan -6%.
- Hapus berupa tombol bernama jelas sebagai pengganti ikon saja. Checkbox
  memakai state sebagian; kontrol jumlah berlabel dan memiliki fokus keyboard.

## Data dan interaksi yang tersedia

`cart-preview-data.js` memisahkan contoh Figma/fixture dari UI.
`cart-preview-repository.js` merupakan adapter lokal; `cart.js` hanya mengatur
tampilan, pilihan, draft, tindakan dan pemulihan. Tidak ada endpoint baru,
autentikasi palsu, pesanan lokal atau reservasi stok.

Normal memuat dua item contoh Figma. Setelah edit jumlah/hapus, guest store
`rylva-cart-preview-guest-v1` menyimpan ID produk, ID varian dan kuantitas;
metadata versi serta masa berlaku hanya untuk lifecycle. Harga/PII tidak
disimpan. Preview memakai 7 hari dari penulisan pertama, tidak memperpanjang
setiap render; aturan TTL operasional masih perlu disepakati.

Pilihan dan gulir disimpan dalam session storage terpisah. Mutasi memakai
kuantitas absolut; kontrol dikunci saat pending, respons ambigu memerlukan
pembacaan ulang. Perubahan storage dari tab lain memblokir Checkout sampai
pengguna memuat keadaan terbaru. Draft dipertahankan pada kegagalan; navigasi
dengan draft menawarkan Tetap Mengedit atau Buang Masukan.

Validasi mencakup integer positif, batas parameter contoh 20 per produk/50 per
pesanan, stok, harga tidak valid, varian/konfigurasi tidak tersedia dan produk
nonaktif. Produk invalid tetap memblokir Checkout walaupun tidak dipilih.
Duplikat guest identik digabung dan dibatasi dengan notice; konfigurasi berbeda
tidak diidentifikasi hanya berdasarkan nama produk.

Dialog Checkout menjelaskan kebutuhan login dan mempertahankan keranjang.
Karena login/Checkout/katalog/detail pelanggan belum aktif, tujuan tersebut
menyampaikan batas pratinjau tanpa menavigasi ke halaman kosong atau mengklaim
proses produksi berhasil. Pesanan Saya yang sudah tersedia dapat dibuka.

## State dan cara memeriksa

Workbench menyediakan 49 skenario contoh; parameter khusus hanya diproses pada
localhost dengan `preview=cart`. Tidak ada pemilih state dalam alur pengguna.
State seperti hover/fokus, input salah, pending, dialog Batal/Escape, draft dan
penghapusan terakhir diperiksa melalui interaksi langsung.

Kelompok state: normal/pilihan, loading/refresh/lambat, kosong, stok/jumlah,
metadata/harga/aset, konfigurasi, berhasil/gagal/ambigu, offline/maintenance/429,
akses/sesi, kedaluwarsa/cart terminal, merge, CSRF dan konflik. Fixture merge
serta akun hanya contoh tampilan; tidak mengubah sesi atau keranjang produksi.

## Aset sumber

| Berkas | Asal dan slot |
| --- | --- |
| `public/assets/images/cart/monstera.png` | Figma `353:183`; foto item Monstera. |
| `public/assets/images/cart/calathea.png` | Figma `356:343`; foto item Calathea. |
| `public/assets/images/cart/empty-basket.svg` | Figma `360:373`; ilustrasi keranjang kosong. |

Raster menyimpan provenance asal di metadata PNG. Semua aset berada lokal;
tidak memakai URL aset Figma sementara saat runtime. Foto buket/media tanam
existing hanya dipakai pada fixture yang secara jelas bersifat contoh.

## Pemeriksaan

- `node tests/e2e/browser/verify-cart.cjs`: revisi Blibli menambah pemeriksaan
  komposisi menjadi 19 kelompok, termasuk 49 skenario, desktop 1920/1536/1440/
  1280/1024, tablet 768/720, ponsel 390/320, keyboard,
  input 0/negatif/pecahan/huruf/kosong, batas, harga, hapus, penyimpanan,
  konflik, offline nyata dan reduced motion. Tidak ada error JavaScript atau
  overflow horizontal pada cakupan tersebut.
- `verify-storefront-shell.cjs`: 11 pemeriksaan lulus, 11 aset, tanpa error
  browser. Shell bersama tetap berfungsi.
- Navigasi Keranjang dari Pembayaran, Detail Pesanan, Pesanan Saya dan Akun
  diperiksa di browser; keempatnya membuka route Keranjang. Alias `/cart.html`
  juga mengarah ke halaman yang benar.
- `check-project-structure.cjs`: lulus; 25 halaman publik pratinjau, seluruh
  referensi yang diperiksa ditemukan. Pemeriksaan sintaks Node juga lulus.
- Bukti: `storage/reports/cart/results.json` dan screenshot pada direktori
  yang sama. Pemeriksaan visual membandingkan frame sumber dengan hasil render.

Pemeriksaan otomatis desain tidak dinyatakan lulus keseluruhan. Taste
menandai pola hero, section dan satu bar navbar yang tidak sesuai konteks
keranjang/Figma, serta masalah lama pada shell yang dipin. Hallmark menandai
spacing/kontras dan kontrol footer existing; masalah batas input jumlah dalam
scope sudah diperbaiki. Impeccable menemukan label HOT 9px dan font Inter
footer existing; keduanya tidak diganti pada tugas Keranjang. Radius kartu dan
warna semantik mengikuti Figma/revisi pelanggan, bukan tema baru. Tidak ada
klaim WCAG AA seluruh situs atau build/backend produksi telah lulus.

## Review akhir

[Review independen](../design/reviews/cart-finish-review.md) meminta satu
perbaikan material: centang setiap item harus mengikuti Pilih Semua/hapus
pilihan. Sinkronisasi diperbaiki tanpa mengganti DOM atau memindahkan fokus;
pengujian memeriksa jumlah centang yang terlihat serta total. Pemeriksaan ulang
18 kelompok/49 skenario lulus. Verdict berikutnya **ship** menilai temuan
tersebut **resolved**; ini bukan klaim bahwa seluruh gate otomatis atau backend
produksi sudah lulus.

Taste terakhir: **GATE: FAIL 53 (round 1 of 3)**. Tidak membuat hero atau
mengganti shell yang dipin untuk memenuhi aturan pemasaran. Rincian temuan
otomatis dan batas scope tetap dicatat pada bagian Pemeriksaan.

## Integrasi yang masih diperlukan

- Backend keranjang akun, autentikasi/ownership/CSRF/rate limit/retensi server.
- Sumber katalog, harga/promo/stok, validitas paket dan kustomisasi nyata.
- Merge atomik/idempoten, rincian penyesuaian aktual, dan pembersihan guest
  setelah commit terkonfirmasi.
- Kontrak identitas baris varian/config, pemilihan sebagian produk, jumlah lintas
  varian, transfer pilihan dan nasib item tak dipilih sesudah Checkout.
- Route login, katalog, detail, Checkout dan quote yang benar-benar terhubung.

Adapter lokal bukan batas keamanan. Semua validasi dan kewenangan tetap harus
ditegakkan di server sebelum produksi. Scaffold PHP tidak diubah menjadi backend
palsu dan kontrak API tidak ditambahkan dari asumsi.
