# Cakupan UI Checkout

14 November 2026. **Frontend pratinjau interaktif**, mengikuti
[spesifikasi Checkout](../design/surfaces/checkout-surface.md) dan empat frame
Figma yang dirujuk di sana. PHP, database, gateway dan layanan transaksi
produksi tidak diaktifkan dalam pengerjaan UI ini.

## Halaman dan cara membuka

- Halaman: `public/pages/customer/checkout.html`; alias `/checkout.html`.
- Jalankan `node tools/preview/serve-dashboard.cjs`; port default 4178, atau
  tetapkan `RYLVA_PREVIEW_PORT` sesuai kebutuhan. Pemeriksaan Checkout memakai
  port 4182.
- Contoh: [Checkout lokal](http://127.0.0.1:4182/pages/customer/checkout.html).
- Kontrol development: [workbench](http://127.0.0.1:4182/__preview/checkout).
  State khusus memerlukan localhost dan `preview=checkout&state=...`; kontrol
  tidak ditempatkan pada halaman belanja atau route produksi.

## Yang tersedia

- Komposisi dua kolom Figma: alamat dan jadwal, barang/kartu, kurir; metode
  bayar serta ringkasan di kanan. Ponsel mengikuti urutan tugas satu kolom.
- Navbar/footer existing disalin dengan dependensi shell yang sama, tanpa
  mengubah CSS global. Footer ponsel tetap dapat dibuka/tutup.
- Foto Monstera/Calathea Figma existing dan logo QRIS/BCA/DANA/COD dari context
  Figma disimpan lokal. Asal raster tercatat pada metadata file dan
  `public/assets/images/checkout/provenance.json`; tidak ada URL aset sementara
  pada runtime.
- Pemilih alamat sesuai Figma: pencarian langsung, kartu utama/terpilih,
  radio, Gunakan Alamat, tambah/ubah/hapus, batas 5, konfirmasi dan fokus dialog.
- Form alamat menggunakan validator existing; detail administratif tersembunyi
  jika lengkap dan valid. Detail dapat dibuka; peta gagal, geocoder parsial atau
  error validasi membuka detail. Nama penerima/telepon tidak dikirim ke geocoder.
- Renderer Leaflet/OSM dan geocoder Photon memakai helper Akun existing,
  pencarian, titik tengah melalui keyboard, reverse lookup dan penolakan
  respons lama. Mengganti pin mengosongkan rincian lokasi lama sebelum lookup;
  tombol pemakaian lokasi menunggu lookup selesai.
- Jumlah, subtotal, penghapusan dengan konfirmasi, catatan produk, kartu
  opsional, Dari/Kepada, anonim dan penghitung. Pesan kosong saat kartu aktif
  ditandai inline; anonim tidak memasukkan nama pengirim ke hasil pesanan.
- Tanggal opsional untuk Tahan Lama; tanggal/slot wajib untuk Mudah Layu,
  validasi WIB, batas 30 hari, H+1 dan cutoff 4 jam. Kalender tutup/kapasitas
  pada adapter saat ini adalah skenario contoh, bukan data operasional.
- Pemilihan kurir/metode melalui radio dan dialog; COD hanya aktif untuk
  layanan contoh yang mendukung. Tidak menambahkan voucher atau biaya layanan
  yang tidak mempunyai dasar baseline.
- Revisi `Lihat Semua` pembayaran mengikuti kategori buka-tutup yang diamati
  langsung pada Checkout Blibli di browser pengguna, 14 November 2026. Empat
  kategori: Transfer ke Virtual Account, Bayar di Tempat, Bayar dengan QRIS
  dan Uang Elektronik. Logo tetap terlihat
  ketika tertutup; satu kategori terbuka pada satu waktu. Kategori pilihan
  terakhir dibuka otomatis ketika dialog dibuka kembali.
- Pilihan di dialog bersifat draft sampai `Gunakan Metode` ditekan. Batal/X/
  Escape mempertahankan metode sebelumnya; menerapkan pilihan mengembalikan
  fokus ke `Lihat Semua`. COD yang tidak berlaku tetap dapat diperiksa alasannya
  tetapi radionya nonaktif. Judul serta tindakan tetap terlihat ketika isi
  dialog digulir pada ponsel maupun desktop. Kondisi kosong/gagal memiliki
  `Coba Lagi` di dialog yang sama, dengan tombol nonaktif selama pemuatan.
- Berdasarkan permintaan lanjutan pengguna, kategori VA memuat **7 bank contoh**:
  BCA, Mandiri, BNI, BRI, Danamon, Permata dan BSI. Kategori e-wallet memuat
  **5 pilihan contoh**: DANA, GoPay, OVO, LinkAja dan ShopeePay. Ini katalog
  pratinjau, bukan daftar kanal merchant yang sudah aktif atau keputusan vendor.
  Jenis metode tetap `va`/`wallet`; `paymentProviderId` menyimpan pilihan kanal.
  Radio keluarga pada halaman memakai BCA/DANA sebagai pilihan awal yang
  terlihat. Kanal yang sudah dipilih dan kemudian tidak tersedia harus dipilih
  ulang, tanpa penggantian diam-diam.
- Logo tambahan diambil dari halaman resmi Midtrans, OVO dan LinkAja; sumber
  setiap berkas ada di `public/assets/images/checkout/provider-provenance.json`.
  Label penyedia tetap dapat dipakai jika logo gagal. Logo kategori tersembunyi
  saat kategori terbuka sehingga ruang lebih banyak untuk daftar pilihan.
- Snapshot `attempt.provider` dan `selectedPaymentProvider` menyimpan ID/nama
  penyedia pada pesanan contoh. Pembayaran, riwayat dan Detail Pesanan memakai
  nama tersebut. Percobaan ulang dengan metode sama mempertahankan penyedia;
  mengganti jenis metode menghapus penyedia lama dari percobaan baru. Adapter
  menolak ID penyedia yang tidak tersedia sebelum membuat pesanan contoh.
- Ketersediaan/reason per penyedia dibaca dari data; tidak menyalin batas nominal,
  promo atau aktivasi akun dari Blibli. Daftar bank kosong memiliki pemulihan
  dan alternatif metode. Workbench menambahkan `providerUnavailable` serta
  `noBankProviders`. Navbar, footer dan dialog alamat tetap memakai desain existing.
- Perhitungan ulang, respons terbaru mengalahkan respons lama, status stale,
  kegagalan section, batas jumlah/stok dan persetujuan ulang. Revalidasi saat
  kembali ke tab mempertahankan persetujuan hanya jika rincian tetap sama.
- CTA online/COD, pending, konflik, kegagalan akhir, batas order, 429, CSRF,
  hasil tidak pasti, inspeksi hasil dan pencegahan kirim ganda pada simulasi.
- Permintaan contoh bersamaan dengan kunci sama/payload sama menghasilkan
  satu hasil; payload berbeda ditolak. Ini menguji adapter dan UI, bukan
  membuktikan transaksi atomik atau keamanan backend produksi.
- Hasil online terhubung ke Pembayaran dan Detail Pesanan existing dengan
  ID contoh yang sama; hasil COD menampilkan Siap Diproses dan pembayaran
  Menunggu. Kegagalan instruksi tidak membuat ulang order.

## Hubungan dengan Keranjang

Tombol Checkout mengirim referensi item terpilih/jumlah melalui sessionStorage
pratinjau, tanpa membawa harga sebagai sumber transaksi. Tamu mendapat kondisi
perlu masuk; tidak disimulasikan otomatis menjadi akun pelanggan. Login dan
merge produksi masih belum terhubung.

Pada mode akun contoh, pilihan diteruskan ke Checkout. Perubahan jumlah/hapus
diteruskan kembali ke adapter Keranjang melalui handoff terbatas; item yang
tidak dipilih tetap ada. Setelah order contoh dipastikan dibuat, item terpilih
ditandai untuk dikeluarkan ketika Keranjang dibuka kembali. Tujuan kembali
dibatasi ke route Keranjang lokal; konteks skenario, pilihan dan gulir existing
dipakai kembali.

Kunci niat yang hasilnya masih diperiksa tidak dibuang saat berpindah dari
Keranjang. Referensi hasil yang sudah diketahui dapat dibuka kembali setelah
reload. Pada penyimpanan browser yang diblokir, halaman menjelaskan batas
pemulihan lintas reload; tidak mengaku pesanan nyata telah dibuat.

## Berkas dan batas adapter

- `checkout.js`: koordinasi tampilan, input, quote, dialog dan pembuatan.
- `checkout-address.js`: komposisi pemilih/form/peta, memakai
  `account-map.js` serta `account-validation.js`.
- `checkout-preview-data.js`: fixture, parameter dan daftar state.
- `payment-provider-catalog.js`: satu katalog contoh bank/e-wallet untuk
  Checkout dan pemilih metode pada Pembayaran. Adapter produksi memakai kanal
  yang disediakan server; fixture tidak mengaktifkan kanal merchant.
- `checkout-preview-repository.js`: layanan contoh di balik antarmuka adapter;
  tidak memanggil endpoint pesanan produksi.
- `orders-preview-repository.js`: tambahan `insertPreview`, hanya menerima
  prefiks order Checkout contoh dan pemilik pelanggan contoh; operasi
  existing tidak diubah.
- `cart.js`/`cart-preview-repository.js`: handoff dan pengembalian perubahan.
- Manifest, redirect Apache serta server pratinjau mengenali halaman/workbench.

Adapter transaksi dapat diganti melalui `window.RylvaCheckoutAdapter`; kontrak
implementasi tetap harus diselesaikan terhadap API baseline. Ini bukan klaim
bahwa bentuk DTO frontend saat ini sudah menjadi kontrak API produksi.

## Integrasi yang masih diperlukan

1. Autentikasi pelanggan terverifikasi, ownership, CSRF dan sesi produksi.
2. Penyimpanan buku alamat/keranjang akun, merge, identitas baris varian dan
   konfigurasi, agregasi P-05 dan penanganan konflik antarperangkat.
3. Quote otoritatif, kalender/kapasitas, area dan tarif kurir serta kemampuan
   metode/COD nyata. Verifikasi kelengkapan wilayah dan kapasitas provider peta.
4. Idempotensi tahan reload/perangkat, transaksi stok/bahan atomik, snapshot,
   audit/persetujuan dan rekonsiliasi hasil pembuatan yang belum diketahui.
5. Penyelarasan tenggat P-01/P-40, inisiasi gateway dan verifikasi pembayaran.
   Daftar kanal aktif, pemetaan ID provider ke gateway, aktivasi merchant, batas
   nominal dan pengaitan akun mengikuti konfigurasi/server nyata, bukan fixture.
6. Penyimpanan `Kepada`, catatan item ke order dan prioritas kartu per buket.
   Preview menyimpan teks tersebut pada hasil contoh; skema produksi tidak diubah.

Draft buku alamat pada Checkout bersifat in-memory pada pratinjau, belum
tersinkron ke buku alamat Akun. Hasil pesanan memakai repository sessionStorage
contoh existing agar alur antartampilan dapat diperiksa; mekanisme ini bukan
penyimpanan data pelanggan produksi yang aman atau pengganti backend.

## Pemeriksaan

- `node tests/e2e/browser/verify-checkout-payment-methods.cjs`: **12 kelompok
  lulus**, meliputi kategori, pilihan draft/terapkan/batal, pengembalian fokus,
  keyboard, COD nonaktif, pemulihan kosong/gagal, kegagalan logo dan lima ukuran
  layar (320, 375, 390, 768 serta landscape 667×375). Termasuk 7 bank/5 wallet,
  navigasi panah, pemilihan penyedia, perpindahan dan reload Pembayaran/Detail,
  retry yang mempertahankan provider, penggantian metode tanpa provider lama,
  provider nonaktif/invalid dan daftar bank kosong. Capture dialog tersimpan
  pada `storage/reports/checkout/payment-methods/`. Regresi Checkout dan
  aksesibilitas existing juga dijalankan setelah revisi kategori.
- `node --check` pada seluruh modul baru serta JS bersama yang disentuh: lulus.
- `node tests/e2e/browser/verify-checkout.cjs`: **17 kelompok pemeriksaan lulus**,
  34 kondisi pemuatan/data/akses, 9 kegagalan akhir, dialog/draft, alamat,
  reverse geocoder dengan test adapter, peta tidak didukung, replay konkuren,
  kartu anonim, tautan Pembayaran, handoff Keranjang dan 9 lebar viewport.
- `node tests/e2e/browser/verify-cart.cjs`: **19 kelompok regresi lulus**,
  termasuk 49 skenario development, penyimpanan, stok, offline, dialog/fokus
  serta perpindahan tamu ke kondisi perlu login pada Checkout.
- `node tests/e2e/browser/verify-checkout-accessibility.cjs`: **7 kelompok lulus**,
  termasuk nama kontrol, aset, computed Poppins, putaran Tab/Escape/pengembalian
  fokus, Simpan pada ponsel, landscape/reduced motion, noscript dan workbench
  59 state. Peta Leaflet dan seluruh tile OSM diperiksa pada browser sebenarnya;
  reverse geocoding terstruktur pada uji formulir tetap memakai test adapter.
- Tinjauan Impeccable terpisah menemukan dua interaksi: teks yang ditempel
  ketika quote pending dan fokus radio pemilih alamat. Perbaikan memisahkan
  persetujuan payload terbaru dari quote harga serta memperbarui penanda
  alamat tanpa mengganti radio. `verify-checkout-review-fixes.cjs`: **3 kelompok
  regresi lulus**, termasuk persetujuan yang tetap sah saat revalidasi tanpa
  perubahan. Penilaian ulang pemeriksa dicatat pada direktori review.
- Pemeriksa akhir memberi **ship untuk dua perbaikan yang dinilai**, keduanya
  resolved; 16 capture dinyatakan valid. Ini penilaian atas daftar perbaikan,
  bukan sertifikasi seluruh sistem/produksi. Laporan awal dan verdict berada
  di `.impeccable/review/checkout/review.md` dan `verdict.md`.
- Screenshot dan JSON hasil: `storage/reports/checkout/` serta
  `storage/reports/cart/`. Lebar Checkout 320, 375, 390, 600, 768, 820, 1024,
  1280 dan 1920; gambar utama juga diambil pada 1440.
- Impeccable detector dijalankan satu kali. Temuan shell, HOT kecil serta
  advisory radius/font incumbent dicatat; Poppins mengikuti DESIGN dan tidak
  diganti. Radius panel mengikuti frame yang diminta pengguna.
- Hallmark source/render sweep dijalankan. Temuan spacing pada CSS Checkout
  diperbaiki memakai token; temuan shell existing (kontras, fokus, spacing)
  berada di luar perubahan target. Hasil sweep tidak diklaim lulus global.
- Taste marketing gate mencatat **GATE: FAIL 59 (round 2 of 3)**. Banyak aturan
  mengharuskan hero, satu section per layar, satu baris nav dan kontak publik
  nyata; ketentuan ini bertentangan dengan formulir Checkout Figma, fixture
  yang harus jujur, serta instruksi mempertahankan shell. Layout tidak diubah
  menjadi halaman pemasaran untuk meloloskan gate. Detail hasil disimpan pada
  `storage/reports/checkout/taste-gate.json`; bukan laporan lulus.

Belum ada pengujian API, database, reservasi stok, uang atau integrasi gateway
produksi. Tidak dilakukan commit, push, publikasi atau deployment.
