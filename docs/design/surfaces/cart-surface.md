# Lihat Keranjang — spesifikasi halaman

14 November 2026. **Spesifikasi tertulis untuk ditinjau dan menjadi acuan
implementasi.** Tidak mengubah desain Figma, route, kode aplikasi atau database.
Tidak menyatakan integrasi yang masih scaffold sudah tersedia.

## Dasar dan cara membaca

- **Fakta:** ditemukan pada instruksi pengguna, baseline v2.6, Figma atau kode.
- **Usulan:** keputusan UX/arsitektur untuk melengkapi perilaku yang tidak
  terlihat pada frame. Menjadi rancangan kerja, bukan klaim fitur sudah aktif.
- **Asumsi perlu dikonfirmasi:** kontrak/kebijakan yang belum ditemukan atau
  berbeda antarsumber. Tidak boleh diam-diam dianggap aturan bisnis final.

Urutan acuan: instruksi/keputusan pengguna terbaru → spesifikasi proyek v2.6 →
desain Figma untuk komposisi visual → implementasi/komponen sebagai bukti
ketersediaan. Panduan skill mengikuti urutan ini.

| Sumber | Bukti yang dipakai |
| --- | --- |
| S1 — pengguna | Gunakan desain Keranjang yang sudah ada di Figma; tahap ini hanya spesifikasi. Aksi penting berupa tombol. Navbar/footer versi ringkas dan footer ponsel buka-tutup adalah keputusan terbaru. |
| S2 — baseline | `docs/specifications/spesifikasi-proyek-v2.6.md`: §6.1–6.4; §11/11.A; D-02/D-09/D-15/D-17; RL-08; P-05/P-22/P-25; §15; A.7; §26.5; §27.2–27.7. |
| S3 — Figma diperiksa langsung 14 November | [Keranjang 335:251](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=335-251) 1920 × 1665 dan [Keranjang kosong 360:372](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=360-372) 1263 × 893. Struktur/teks dan kedua render dibaca; interaksi prototipe tidak dianggap telah terbukti. |
| S4 — produk/desain | `PRODUCT.md`, `DESIGN.md`, `docs/design/surfaces/storefront-shell.md` dan `docs/coverage/customer-refinements.md`. `produk.md` tidak ditemukan pada pencarian repositori; konteks yang tersedia adalah PRODUCT.md dan keputusan percakapan. |
| S5 — kode | Template `cart.php`, controller `CartController.php`, validator `CartAndBouquetValidator.php`, `guest-cart.js` dan `config/routes.php` masih scaffold. Belum ada route HTML keranjang pada manifest pratinjau. |
| S6 — skema | `keranjang`, `item_keranjang_belanja`, `varian_produk`, `stok_varian_produk`, `konfigurasi_buket_keranjang` dan `pilihan_buket_keranjang` pada `database/schema/DB_RylVa_Green.sql`. Keberadaan tabel bukan bukti impor/koneksi berhasil. |

Bukti lokal analisis: `storage/reports/cart-spec/figma-cart.png`,
`figma-cart-empty.png` dan `figma-structure.json`. Ini bukti pemeriksaan, bukan
pengganti komponen atau aset UI produksi.

Mode halaman **Operate**. Taste/Hallmark digunakan untuk konsistensi dunia
existing, hierarki, jarak dan affordance; Impeccable untuk alur, state dan
pemulihan. Tidak membuat hero pemasaran, tema baru, visual comp baru atau
menjalankan build/detector seolah-olah UI sudah diimplementasikan.

## 1. Pemahaman dan cakupan halaman

**Tujuan:** pengguna memeriksa isi belanja, varian/satuan, harga terkini dan
jumlah; menyelesaikan masalah produk; lalu melanjutkan ke Checkout dengan
pilihan yang jelas. Keranjang belum merupakan pesanan dan tidak mengunci stok.

| Pengguna | Kewenangan |
| --- | --- |
| Pengunjung/tamu | Melihat dan mengubah keranjang milik perambannya tanpa login; sebelum Checkout harus autentikasi pelanggan. |
| Pelanggan aktif | Melihat/mengubah keranjang akunnya, digabung dengan keranjang tamu setelah login; lanjut Checkout dengan validasi server. |
| Pelanggan belum terverifikasi/sesi berakhir | Tidak memperoleh akses privat hanya dari ID keranjang. Selesaikan alur akses yang sah; jangan menampilkan cache akun sebelumnya. |
| Admin/SuperAdmin/staf | Sesi staf terpisah dan tidak memberi izin mengubah keranjang pelanggan dari halaman ini. |

**Termasuk:** daftar item, checkbox pilihan sesuai Figma, tambah/kurangi/input
jumlah, hapus satu item, ringkasan harga/potongan produk, masalah harga/stok/
varian, keranjang kosong, transisi login/merge/Checkout dan seluruh pemulihan.

**Di luar:** pemilihan alamat/kurir/slot/metode bayar, pembuatan pesanan,
reservasi stok, voucher/kupon, wishlist, ulasan, checkout tamu, serta rekomendasi
palsu. Bagian 1 baseline mengecualikan wishlist pada versi ini; keberadaan ikon
atau template wishlist tidak mengaktifkan fiturnya.

Hubungan: Katalog/Detail/Kustomisasi Buket → Keranjang → Login bila diperlukan
→ penggabungan/validasi → Checkout → Pembayaran. Pesanan Saya/Detail memakai
snapshot pesanan dan tidak ikut berubah ketika isi keranjang diedit.

**Kondisi saat ini:** desain tersedia, kode keranjang belum aktif. Empat halaman
pelanggan yang tersedia adalah Akun, Pesanan Saya, Detail Pesanan dan Pembayaran,
masing-masing masih memakai adapter data contoh untuk transaksi/akun. Leaflet
alamat pada Akun sudah tersedia, tetapi pemilih alamat bukan bagian Keranjang.

## 2. Struktur dan isi halaman

### Acuan visual yang dipertahankan

Figma memakai latar krem, Poppins, judul hijau, kartu horizontal bertepi tipis,
foto produk pada bidang abu muda dan kontrol jumlah dalam kelompok membulat.
Daftar berada di kiri, ringkasan di kanan. Pada kanvas 1920 px, daftar kira-kira
1141 px dan ringkasan 510 px. H1 pada frame berukuran 50 px; nama/harga utama
sekitar 36–40 px. Ini ukuran sumber desktop, bukan ukuran yang dipaksa ke ponsel.

| Urutan | Isi |
| --- | --- |
| 1 | Navbar existing versi ringkas, termasuk pencarian global dan akses Keranjang. Tidak mengganti kategori atau tujuan menu. |
| 2 | Breadcrumb Beranda / Keranjang dan H1 **Keranjang**. Nama pekerjaan “Lihat Keranjang” tidak mengharuskan mengganti judul Figma. |
| 3 | Pemberitahuan kontekstual bila ada hasil merge/perubahan harga/stok; daftar item bermasalah dapat dituju dari sini. Tidak ada banner sukses permanen. |
| 4 | **Pilih Semua Produk**, checkbox tiga kondisi dan jumlah pilihan yang dapat dipahami. |
| 5 kiri | Kartu item berurutan stabil; perubahan jumlah tidak memindahkan kartu. |
| 5 kanan | Ringkasan Total Harga, Potongan Promo bila ada, Total, keterangan ongkir, dan tombol **Checkout (N)**. |
| 6 | Rekomendasi hanya jika ada data katalog nyata dan kontraknya tersedia; tanpa data, section beserta spacer buatan dihilangkan. |
| 7 | Footer existing ringkas; kelompok menu ponsel dapat dibuka-tutup. |

### Isi setiap kartu

- Checkbox item dengan nama aksesibel, foto, nama produk dan tautan Detail.
- Varian/atribut yang relevan, misalnya ukuran dan rentang tinggi; satuan jual
  eksplisit seperti pot/pcs/kg/liter/pack, bukan diasumsikan selalu pot.
- Harga berlaku per satuan; harga dasar dicoret hanya jika diskon produk sah.
  Badge diskon hanya dari data yang dapat dibuktikan.
- Ringkasan konfigurasi buket/paket jika memang menjadi item; tidak menggabungkan
  dua kustomisasi berbeda hanya karena nama produknya sama.
- Kelompok tombol **Kurangi**, input jumlah, **Tambah**, serta **Hapus**. Ikon
  boleh mengikuti Figma, dengan nama aksesibel dan area klik memadai.
- Pesan masalah tepat di dekat item dan tindakan seperti Kurangi Jumlah,
  Pilih Varian Lain atau Hapus, hanya bila tujuan/fiturnya tersedia.

Foto gagal memakai fallback dengan teks singkat; tidak mengambil foto produk
lain. Nama/atribut panjang membungkus. Ringkasan buket panjang dapat memakai
disclosure Detail Kustomisasi; harga, jumlah dan error tidak disembunyikan.

### Ringkasan dan perhitungan

**Usulan konsisten dengan struktur Figma:** Total Harga adalah jumlah harga
dasar item terpilih × kuantitas; Potongan Promo adalah jumlah diskon produk yang
sedang berlaku; Total = Total Harga − Potongan Promo. Jika tidak ada potongan,
baris promo boleh disembunyikan dan Total Harga sama dengan subtotal berlaku.
Tidak mengurangi diskon dua kali dari harga net yang sudah didiskon.

“Potongan Promo” bukan kolom voucher. Tidak menambah ongkir, biaya layanan,
asuransi, pajak tambahan atau gratis ongkir tanpa dasar perhitungan. Harga
produk sudah final terhadap pajak yang berlaku menurut D-15. Tampilkan
**“Belum termasuk ongkos kirim. Dihitung saat Checkout.”**

N pada Total Harga/Checkout **diusulkan menghitung baris item terpilih**, bukan
kuantitas unit. Sediakan konteks “2 jenis produk, 4 unit” agar tidak ambigu;
kontrak ini perlu diselaraskan dengan Checkout. Tidak mengunci contoh N = 1.

### Keranjang kosong dan perangkat

Pakai ilustrasi keranjang botani yang sudah ada pada frame kosong, judul
**“Keranjang Kamu masih kosong”**, kalimat pendukung sumber, serta **Mulai
Belanja** menuju Katalog. Ilustrasi bukan tombol dan dapat memakai alt kosong
karena pesan sudah tertulis. Frame kosong adalah isi main, tidak perlu shell
baru atau menampilkan checkout/ringkasan harga nol sebagai ajakan membeli.

**Usulan responsif:** desktop mempertahankan dua kolom dan proporsi sumber;
skala disesuaikan ketika konten tidak lagi muat. Ringkasan boleh sticky dengan
batas main agar tidak menabrak footer. Tablet menumpuk ketika lebar tidak cukup;
ponsel menempatkan ringkasan setelah item. Checkbox, foto, nama, harga dan aksi
ditata ulang tanpa mengecilkan teks/target sentuh secara berlebihan. Tidak ada
varian mobile Keranjang yang ditemukan pada frame yang diperiksa. Bar checkout
fixed pada ponsel bukan kebutuhan awal; hindari overlay tambahan yang menutupi
konten. Navbar/footer mengikuti hasil revisi pengguna, bukan ukuran lama frame.

## 3. Alur penggunaan

### Masuk dan alur utama

1. Masuk melalui ikon Keranjang, notifikasi Tambah ke Keranjang, atau route
   internal. Katalog dan Detail belum aktif di kode; rute yang belum dibuat
   tidak boleh ditampilkan seolah sudah terhubung.
2. Baca keranjang tamu atau akun yang sesuai pemilik. Resolve data produk,
   varian, harga, promo dan ketersediaan terkini; jangan mempercayai harga lokal.
3. Tampilkan item dan pulihkan pilihan yang masih sah. **Usulan awal:** bila
   belum ada pilihan tersimpan, pilih seluruh item valid; Figma hanya contoh
   satu item dipilih, tidak membuktikan default bisnis.
4. Pengguna mengubah pilihan/jumlah. Ringkasan hanya mengikuti perubahan yang
   telah tervalidasi; proses yang belum pasti ditandai dan Checkout dikunci.
5. Selesaikan semua item bermasalah. Produk nonaktif/stok nol tetap memblokir
   Checkout menurut §6.2, walaupun checkboxnya tidak dipilih.
6. Tekan Checkout. Pastikan ada pilihan, jumlah sah, tidak ada mutasi pending,
   data terbaru tersedia dan konteks akun benar. Ini belum membuat pesanan.
7. Tamu diarahkan login/registrasi; setelah autentikasi sah, keranjang digabung,
   hasil penyesuaian ditampilkan, lalu lanjut Checkout dengan pilihan yang jelas.
8. Checkout mengambil quote server dan memvalidasi ulang. Jika total berubah,
   pengguna meninjau/menyetujui ulang sebelum pesanan dibuat (§6.4).

### Alur alternatif dan kembali

- Hapus item memerlukan dialog singkat menyebut nama/varian/konfigurasi dan
  dampaknya. Batal mempertahankan item/pilihan/jumlah. Tidak menawarkan Undo
  tanpa kontrak pemulihan yang benar.
- Menghapus item terakhir membawa ke frame kosong; fokus ke pesan/aksi Mulai
  Belanja. Tidak menyebut keranjang kosong saat item masih ada tetapi tidak dipilih.
- Tamu batal login kembali ke Keranjang dengan isi/pilihan yang masih sah.
  Return URL hanya internal dalam allowlist. Perubahan akun memerlukan pembacaan
  ulang dan pembersihan cache privat sebelumnya.
- Dari Keranjang ke Detail/Kustomisasi dan kembali: pulihkan pilihan, gulir,
  anchor item serta draft nonrahasia yang masih relevan; validasi ulang harga/
  stok dan tunjukkan perubahannya. Tidak ada search/filter/pagination lokal yang
  perlu dipulihkan pada rancangan awal. Search global tetap search produk.
- Input jumlah disimpan saat Enter/blur jika valid, bukan satu request untuk
  setiap digit. Saat ada draft belum selesai, Checkout menunggu penyelesaian;
  navigasi keluar menawarkan Tetap Mengedit/Buang Draft. Tidak mengirim mutasi
  otomatis hanya karena pengguna memilih meninggalkan halaman.
- Timeout setelah mutasi: periksa keadaan terbaru sebelum menawarkan ulang.
  Hapus/merge/ubah jumlah tidak dikirim ulang membabi buta.

## 4. Komponen dan interaksi

| Komponen | Pakai ulang/baru | Perilaku |
| --- | --- | --- |
| Shell, logo, font dan kategori | `storefront-shell.css/js`, SVG sumber | Ukuran/reflow versi revisi terbaru; ikon Keranjang dihubungkan saat implementasi route tersedia. |
| Breadcrumb, tombol, angka rupiah, focus ring | Pola storefront existing | Aksi utama solid hijau, sekunder berbingkai; tidak menjadikan tindakan penting hanya teks bergaris bawah. |
| Checkbox semua/item | Baru, mengikuti Figma | Checked bila seluruh item eligible dipilih, indeterminate bila sebagian, unchecked bila tidak ada. Perubahan langsung menghitung ulang ringkasan. |
| Kartu item | Baru, komposisi Figma | Checkbox/foto/informasi/harga/aksi; tidak mengganti menjadi tabel operasional atau marketplace banyak penjual. |
| Stepper kuantitas | Baru | Integer, keyboard, batas dinamis dan feedback per baris. Minus pada 1 dinonaktifkan; hapus melalui kontrol terpisah agar tidak tak sengaja. |
| Panel ringkasan | Pola breakdown existing, susunan Figma | Selaras ke kanan untuk angka; total menonjol; jangan menghitung draft sebagai nilai final. |
| Notice, loading, dialog konfirmasi | Pola Akun/Detail/Pesanan Saya | Konten baru untuk konteks keranjang; native dialog, focus trap, Escape/Batal dan pengembalian fokus. Tidak mengubah helper halaman lama tanpa memeriksa konsumennya. |
| Item unavailable/price changed | Baru | Label + ikon + warna semantik terbatas; pesan dekat masalah dan jalan perbaikan. |
| Empty state | Aset/frame Figma | Satu ajakan Mulai Belanja; tidak memproduksi ilustrasi baru jika aset asli dapat diekspor. |

**Usulan pilihan:** item yang berubah tidak eligible dikeluarkan dari pilihan
dengan pemberitahuan, tetap berada dalam daftar sebagai masalah yang harus
diselesaikan. Select All tidak diam-diam memilih sebagian agar pas limit. Bila
pilihan membuat total >50 unit, tampilkan masalah dan blokir Checkout sampai
pengguna menyesuaikan. Perubahan satu item tidak mereset pilihan item lain.

Saat satu mutasi berjalan, kunci kontrol baris terkait dan cegah Checkout;
pengguna tetap dapat membaca isi. Gunakan hasil versi terbaru untuk ringkasan,
tanpa re-render penuh yang menghilangkan fokus. Error menyimpan mempertahankan
draft dan menjelaskan nilai terakhir yang tersimpan.

Tidak menambah pencarian, filter, pengurutan atau pagination di main Keranjang
tanpa kebutuhan baru. Karena itu state “pencarian/filter tanpa hasil” dan
“memuat halaman berikutnya” tidak dibuat untuk daftar ini.

## 5. Status dan penanda penting

| Jenis | Status | Makna dan dampak |
| --- | --- | --- |
| Data keranjang, fakta SQL | AKTIF | Keranjang berjalan; tindakan mengikuti akses dan validitas item. |
| Data keranjang, fakta SQL | DIGABUNGKAN | Keranjang sumber telah dipindah ke akun; baca target, jangan merge ulang otomatis. |
| Data keranjang, fakta SQL | DIKONVERSI_PESANAN | Keranjang versi itu telah digunakan; baca keranjang aktif/tujuan yang sah, jangan membuat pesanan kedua. Nasib item tak terpilih perlu kontrak Checkout. |
| Data keranjang, fakta SQL | KEDALUWARSA | Retensi selesai; baca ulang/berikan jalan mulai belanja, tanpa menjanjikan pemulihan data yang dihapus. |
| Data item | Tersedia | Produk/varian aktif dan kuantitas dapat dipenuhi pada snapshot ini; bukan reservasi. |
| Data item | Stok terbatas | Stok sampai P-22 (default 5); tampilkan jumlah yang relevan dari server. |
| Data item | Jumlah perlu disesuaikan | Kuantitas melebihi stok/batas; item tetap terlihat, Checkout diblokir sampai sah. |
| Data item | Tidak tersedia | Produk nonaktif/stok nol/varian tidak dapat dibeli; sesuaikan atau hapus. |
| Data item | Harga/promo berubah | Tampilkan harga terkini dan perubahan yang dapat dibuktikan. Jangan menganggap checkout lama sudah menyetujui total baru. |
| State UI | Dipilih/tidak dipilih, loading/saving, gagal, readonly | Bukan enum status keranjang/pesanan dan tidak disimpan sebagai status bisnis palsu. |

**Usulan semantik:** hijau untuk pilihan/hasil sah, amber untuk perlu perhatian,
merah untuk gagal/tidak tersedia dan netral untuk metadata. Gunakan token state
yang sudah disepakati pada revisi pelanggan, label serta ikon; tidak mengganti
warna brand. Jangan memakai badge “Pesanan Berhasil”, timer reservasi, atau
“stok sudah diamankan” pada Keranjang.

## 6. Tindakan dan dampaknya

| Tindakan | Syarat dan ketersediaan | Dampak/feedback dan pemulihan |
| --- | --- | --- |
| Pilih item/semua | Item eligible; data dapat dinilai | Perbarui pilihan dan ringkasan; tidak mengubah stok atau jumlah. Tanpa konfirmasi. |
| Tambah/kurangi jumlah | Akses sah; bukan pending/uncertain; target dalam batas | Kirim kuantitas target absolut melalui kontrak yang disepakati, lalu tampilkan hasil. Jangan increment ulang setelah timeout. |
| Ketik jumlah | Integer valid saat commit | Invalid tetap sebagai draft dengan pesan. Kosong/0 bukan perintah hapus. Checkout tidak memakai draft tersebut. |
| Hapus | Item masih milik keranjang, versi sah | Dialog → pending → hilang setelah hasil sah. Fokus ke item berikutnya atau judul kosong. Gagal mempertahankan item; ambigu diperiksa dahulu. |
| Lihat Detail/ubah varian | Route dan produk dapat dibuka | Simpan konteks kembali. Identitas varian tidak diubah otomatis hanya karena satu varian habis. Jika hanya Detail yang mendukung pilihan ulang, gunakan jalur itu. |
| Detail/Ubah Kustomisasi | Konfigurasi dan rute tersedia | Baca ringkasan yang sah; perubahan menghasilkan identitas/fingerprint yang tepat, bukan menimpa buket lain. Tanpa integrasi, jelaskan kebutuhan melengkapi dan sediakan Hapus. |
| Checkout (N) | Pilihan ada, item/kuantitas/total sah, data fresh, semua mutasi pasti | Satu navigasi/preflight; tamu ke login, pelanggan ke quote Checkout. Tidak mencadangkan stok atau membuat pesanan dari klik di Keranjang. |
| Muat Terbaru/Coba Lagi | Sesuai jenis kegagalan | Membaca ulang, mempertahankan konteks yang sah; tidak otomatis mengulang mutasi. |
| Mulai Belanja | Route katalog tersedia | Menuju Katalog. Bila tahap implementasi masih pratinjau tanpa katalog, tujuan yang belum terhubung harus jujur, bukan tautan sukses palsu. |

Tidak ada Hapus Semua, pindah ke Wishlist, voucher atau tombol Bayar Langsung
yang ditambahkan dari asumsi. Tidak membuat layanan chat atau nomor kontak
operasional baru untuk pesan batas pembelian besar.

## 7. Aturan bisnis, validasi dan hak akses

**Fakta baseline:**

1. Tamu menyimpan identitas/kuantitas di peramban tanpa harga; akun di server.
   Retensi P-25: tamu 7 hari; akun 30 hari tanpa aktivitas. Titik awal/reset TTL
   tamu belum eksplisit; jangan mengklaim sliding 7 hari sebagai fakta.
2. Harga adalah harga terkini dengan diskon produk yang berlaku. Semua angka
   uang rupiah integer; total dihitung/diterima server, bukan kiriman klien.
3. P-05: 20 unit per produk per pesanan dan 50 unit total per pesanan. Batas
   dibaca dari parameter; angka default bukan konstanta yang tidak dapat diubah.
4. Tidak boleh mengakali limit per produk dengan memisahkan varian/konfigurasi
   ke baris lain. Penghitungan lintas SKU/fingerprint harus dikonfirmasi pada
   kontrak service; sumber menyebut produk, bukan “20 untuk setiap baris”.
5. Produk nonaktif/stok 0 ditandai Tidak tersedia dan memblokir Checkout sampai
   dihapus/disesuaikan. Menghilangkan centang saja bukan pemenuhan §6.2.
6. Merge menjumlahkan item yang identik, membatasi sesuai kuantitas/stok, membuang
   item tidak valid dengan pemberitahuan, dan membersihkan keranjang tamu hanya
   setelah hasil penggabungan sah. Ini berbeda dari pembacaan normal yang
   mempertahankan item bermasalah untuk ditindaklanjuti.
7. Keranjang tidak mengurangi/mencadangkan stok. Pemeriksaan stok/bahan paket/
   buket dan harga diulang pada Checkout. Produk mudah layu memerlukan layanan
   serta jadwal yang sesuai pada Checkout, bukan field baru di Keranjang.
8. Checkout membutuhkan akun pelanggan aktif/terverifikasi. Sesi staf, parameter
   customerId atau cartId dari URL bukan dasar izin. Terapkan ownership dan
   pemisahan cache antar akun di server/klien.

**Usulan validasi/interaksi:** jumlah wajib integer positif, menerima input
angka yang dinormalisasi, menolak pecahan/negatif/huruf/notasi ilmiah. Pada
kelebihan batas, tampilkan “Maksimal 20 unit per produk” atau batas aktual,
pertahankan pilihan yang dapat diperbaiki dan tunjukkan jalan menghubungi toko
melalui kanal proyek yang sudah ada. Bila server menyesuaikan kuantitas secara
sah, tampilkan jumlah sebelum/sesudah; tidak memotong diam-diam.

**Konflik/duplikasi:** identitas item mempertimbangkan produk + varian +
fingerprint konfigurasi, bukan nama tampilan. Kuantitas absolut, revisi dan
idempotensi merge diusulkan untuk mencegah penggabungan/pengiriman ganda;
header/payload pastinya belum tersedia. Respons lama tidak boleh menimpa
jumlah versi terbaru. Tidak memilih varian pengganti atau menebak harga ketika
metadata tidak valid.

Pesan harus menunjukkan cara memperbaiki, misalnya “Stok tersedia 2. Ubah
jumlah menjadi maksimal 2” bila angka tersebut memang diberikan server,
“Isi jumlah antara 1 dan batas yang ditampilkan”, atau “Perubahan belum dapat
dipastikan. Periksa isi keranjang terbaru.” Tidak menampilkan SQL/stack trace,
identitas akun lain atau status stok seolah real-time tanpa sumber.

## 8. Matriks state yang relevan

Prioritas: **W** wajib untuk fitur inti, termasuk state bersyarat ketika jenis
item terkait dipakai; **L** penyempurnaan lanjutan; **O** opsional. Ketergantungan
integrasi tidak menjadikan kebutuhan inti opsional. Pemicu layanan di bawah
adalah kebutuhan penanganan, bukan klaim layanan tersebut sudah aktif.

| Area/komponen | Nama state | Pemicu | Isi/pesan | Tindakan tersedia | Data/input dipertahankan | Jalur pemulihan | Prioritas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Halaman | Normal | Read model valid | Kartu dan ringkasan harga terkini | Pilih, jumlah, hapus, Checkout | Item, pilihan, gulir | Alur utama | W |
| Pilihan | Tidak ada pilihan | Seluruh checkbox dilepas | Total pilihan 0; “Pilih produk untuk Checkout” | Pilih item/semua | Semua isi keranjang | Pilih minimal satu | W |
| Pilihan | Sebagian/indeterminate | Hanya sebagian eligible dipilih | Select All indeterminate, ringkasan pilihan | Ubah pilihan | Kuantitas item tidak berubah | Pilih semua atau sebagian | W |
| Kontrol | Hover/focus/pressed | Pointer/keyboard | Fokus jelas dan feedback tekan | Kontrol terkait | Semua konteks | Lepas/lanjut keyboard | W |
| Stepper | Disabled pada batas | Jumlah 1 atau limit/stok tercapai | Minus/plus nonaktif dengan alasan | Arah perubahan yang sah, Hapus | Nilai terakhir sah | Kurangi/pilih barang lain | W |
| Item | Read-only sementara | Refresh, saving atau data stale | Nilai tetap terlihat, status proses | Baca, tunggu/perbarui | Snapshot dan draft aman | Respons sah/read ulang | W |
| Halaman | Loading awal | Pembacaan pertama | Skeleton kartu/ringkasan, “Memuat keranjang” | Kembali bila perlu | Identitas/selection aman lokal | Baca selesai atau retry | W |
| Item/ringkasan | Refresh sebagian | Harga/stok dimuat ulang | Busy area terkait; nilai lama berlabel | Baca; Checkout terkunci | Pilihan, gulir, nilai terakhir | Perbarui area | W |
| Jumlah | Menyimpan | Commit angka valid | Indikator menyimpan pada baris | Kontrol baris dikunci | Target jumlah + jumlah terakhir | Terima hasil/beri error | W |
| Hapus | Konfirmasi | Hapus dipilih | Nama/varian dan dampak | Batal/Hapus | Item utuh | Batal kembali ke pemicu | W |
| Hapus | Menghapus | Konfirmasi dikirim | Busy, cegah klik ganda | Tunggu | ID, posisi, selection | Hasil sah atau reconcile | W |
| Baca | Lama/timeout | Batas tunggu terlampaui | “Keranjang belum selesai dimuat” | Coba Lagi/Kembali | Isi lokal/snapshot aman | Batalkan respons lama, read ulang | W |
| Mutasi | Hasil belum pasti | Timeout/koneksi terputus setelah kirim | “Perubahan belum dapat dipastikan” | Periksa Keranjang Terbaru | Draft, target, identitas operasi | Reconcile sebelum retry | W |
| Main | Kosong sah | Tidak ada item setelah read valid | Ilustrasi dan copy Figma kosong | Mulai Belanja | Tujuan kembali | Katalog | W |
| Main | Semua item bermasalah | Tidak ada item eligible | Item tetap terlihat; jangan menyebut kosong | Sesuaikan/Hapus | Semua item dan masalah | Tindakan sampai sah | W |
| Kartu | Metadata sebagian | Nama/foto/atribut tidak lengkap | Fallback jelas; data yang sah tetap tampil | Perbarui/Hapus bila aman | ID, kuantitas | Resolve metadata | W |
| Foto | Aset gagal | Gagal image load | Placeholder “Foto belum tersedia” | Detail/jumlah jika data lain sah | Item lengkap | Retry gambar opsional | W |
| Data/harga | Malformed/tidak dapat dihitung | ID/harga/kuantitas/satuan wajib tidak sah | “Informasi produk perlu diperiksa”; bukan Rp0 palsu | Muat Terbaru, hapus dengan ID sah | Data aman yang dapat diidentifikasi | Respons valid | W |
| Ringkasan | Sebagian harga gagal | Tidak semua pilihan dapat dihitung | Total belum tersedia; Checkout terkunci | Perbarui | Pilihan dan item | Semua harga tervalidasi | W |
| Mutasi | Berhasil | Server/local save sah | Jumlah/total diperbarui atau item dihapus | Lanjut | Hasil terbaru + pilihan relevan | Fokus dipulihkan | W |
| Input | Validasi gagal | Kosong, 0, pecahan, negatif, bukan angka | Error dekat jumlah; nilai terakhir dijelaskan | Perbaiki/Buang Draft | Input yang diketik | Commit angka sah | W |
| Kuantitas | Batas produk | Total produk melewati P-05 | Batas aktual dan penjelasan pesanan besar | Kurangi/Hapus/pilih lain | Nilai sah/draft | Jumlah sesuai batas | W |
| Pilihan/total | Melebihi 50 unit | Pilih semua/subset melebihi P-05 | “Maksimal 50 unit per pesanan”; CTA terkunci | Kurangi jumlah/lepas pilihan | Isi dan pilihan | Total pilihan sah | W |
| Stok | Stok terbatas | Stok sampai P-22 | Label dan stok snapshot server | Beli dalam batas | Item | Validasi ulang Checkout | W |
| Stok | Stok turun | Stok di bawah kuantitas | Angka tersedia dan penyesuaian diperlukan | Kurangi/Hapus | Target lama untuk penjelasan | Kuantitas sah | W |
| Item | Tidak tersedia | Produk nonaktif/stok 0 | Label + alasan; global Checkout terkunci | Hapus/Detail yang sah | Item sampai ditindaklanjuti | Sesuaikan/hapus, bukan sekadar uncheck | W |
| Varian | Dihapus/nonaktif | Varian tidak lagi dapat dibeli | “Varian ini tidak tersedia” | Pilih ulang bila route ada/Hapus | Identitas varian lama | Pilihan baru tervalidasi | W |
| Paket/buket | Komponen tidak tersedia | Validasi stok komponen gagal | Konfigurasi dan kebutuhan penyesuaian | Ubah bila didukung/Hapus | Ringkasan konfigurasi | Revalidasi bahan/opsi | W, bila item terkait ada |
| Konfigurasi | Referensi tidak sah | ID/hash/opsi tidak cocok | “Kustomisasi perlu diperiksa” | Buka konfigurasi/Hapus | Data yang sah tanpa harga tebakan | Read model konfigurasi sah | W, bila item terkait ada |
| Harga | Harga/promo berubah | Harga terbaru berbeda | Nilai terkini, selisih bila terbukti | Tinjau/perbarui, lanjut sesuai validasi | Item/pilihan | Quote baru dan persetujuan Checkout | W |
| Harga | Diskon berakhir | Periode promo selesai | Potongan hilang/berubah dan total terbaru | Tinjau/Hapus | Kuantitas/pilihan | Gunakan harga sah, tanpa voucher pengganti | W |
| Halaman | Gagal memuat | Read gagal tanpa snapshot | Error state; bukan keranjang kosong | Coba Lagi/Kembali | Guest IDs/tujuan yang aman | Read ulang | W |
| Mutasi | Gagal pasti | Penolakan validasi/penyimpanan | Tidak mengklaim tersimpan; error spesifik | Perbaiki/Coba Lagi sesuai respons | Item lama + draft | Submit valid/read jika perlu | W |
| Koneksi | Offline | Browser/lokasi jaringan putus | Snapshot lama berlabel; tidak checkout final | Sambungkan/Coba Lagi | Guest data dan konteks nonrahasia | Online, read ulang dan reconcile | W |
| Layanan | Gangguan/maintenance | Layanan tidak tersedia | Pesan layanan dan jalan kembali | Coba Lagi/Kembali | Konteks aman | Pulih layanan; jangan membuat pesanan lokal | W |
| Mutasi | Rate limited | RL-08/HTTP429 | Tunggu menurut respons server | Tunggu/Coba setelah diizinkan | Draft/item | Retry-After sah | W |
| Penyimpanan tamu | Diblokir/kuota penuh | Browser menolak penyimpanan | “Keranjang belum tersimpan di peramban ini” | Coba Lagi/lanjut sesi memori dengan penjelasan | Data memori selama tab hidup | Penyimpanan pulih; jangan klaim persisten | W |
| Guest data | Rusak/kedaluwarsa | Data tidak dapat dibaca/TTL selesai | Jelaskan read ulang atau isi telah kedaluwarsa | Muat produk/Mulai Belanja | Record valid yang dapat dibuktikan | Bersihkan hanya data invalid/expired dengan notice | W |
| Akses | Tamu menuju Checkout | Klik Checkout valid tanpa login | Tujuan autentikasi dan konteks kembali | Login/Daftar/Batal | Guest IDs, kuantitas, selection | Auth → merge → Checkout | W |
| Akses | Sesi berakhir/logout | Sesi akun ditolak/diakhiri | Cache privat ditutup; isi akun tidak menjadi guest cart | Masuk Kembali/Keranjang Tamu | Hanya guest store terpisah yang sah | Auth, read akun ulang | W |
| Akses | Verifikasi diperlukan | Akun tidak berstatus aktif/terverifikasi | Langkah verifikasi yang tersedia | Verifikasi/Kembali | Guest context yang sah | Akun sah sebelum Checkout | W |
| Akses | Denied/ownership/staf | Tidak berwenang | Pesan umum tanpa isi akun lain | Kembali/akses akun pelanggan | Tujuan aman tanpa PII | Sesi/peran sah | W |
| Keranjang | Tidak ditemukan/berstatus terminal | ID lama/expired/converted/merged | Cari keranjang aktif milik pemilik; jangan tampilkan kosong palsu sebelum hasil | Muat Terbaru/Mulai Belanja/tujuan sah | Konteks item yang masih dapat dipetakan | Active cart sah | W |
| Merge | Berlangsung | Login pelanggan berhasil | “Menyinkronkan keranjang” | Tunggu/Kembali yang aman | Guest store belum dibuang | Hasil merge terkonfirmasi | W |
| Merge | Berhasil dengan penyesuaian | Duplikat dijumlah, kuantitas dipotong, item invalid dibuang | Daftar item ditambah/disesuaikan/dihapus | Tinjau Keranjang/Lanjut setelah sah | Akun terbaru + laporan penyesuaian | Bersihkan guest hanya setelah commit | W |
| Merge | Gagal/hasil ambigu | Koneksi/konflik setelah merge | Tidak mengklaim sinkronisasi selesai | Periksa Hasil/Coba sesuai status operasi | Guest source dan identitas merge | Reconcile/idempotensi, jangan gandakan | W |
| Konflik | Tab/perangkat lain mengubah | Versi server/storage berubah | “Keranjang berubah di tempat lain” | Muat Terbaru/Tinjau ulang draft | Draft aman dan pilihan yang masih ada | Rebase/read terbaru, tanpa overwrite diam-diam | W |
| Keamanan | CSRF kedaluwarsa | Token mutasi ditolak | “Keamanan sesi perlu diperbarui” | Perbarui sesi/form/Kembali | Draft nonrahasia jika sesi masih sah | Ambil konteks aman, pengguna submit ulang | W |
| Navigasi | Draft belum disimpan | Keluar/Detail/Back saat ada input belum commit | Tetap Mengedit/Buang Draft | Pilihan eksplisit | Draft selama sesi sah | Simpan valid atau kembali ke nilai terakhir | W |
| Item | Dihapus selama dipakai | Baris hilang di server/perangkat lain | Item tidak lagi tersedia di keranjang; jangan submit ID salah | Muat Terbaru | Baris lain, selection, anchor pengganti | Rekonsiliasi daftar | W |
| Checkout | Preflight/quote berubah | Klik lanjut, server menemukan stok/harga baru | Masalah item/total baru; pesanan belum dibuat | Sesuaikan/Tinjau quote/Kembali | Pilihan dan konteks keranjang | Validasi serta persetujuan ulang | W |
| Checkout | Klik ganda/proses tertunda | Tombol ditekan berulang saat persiapan | Loading/disabled, satu transisi aktif | Tunggu; hasil ambigu diperiksa | Selection/versi target | Satu hasil, bukan dua merge/pesanan | W |

State search/filter tanpa hasil, pagination, persetujuan staf, upload bukti dan
verifikasi pembayaran tidak dipaksakan ke Keranjang. Tidak membuat semua jenis
error sebagai URL/state produksi; saat implementasi sediakan workbench/data
fixture terpisah seperti halaman pelanggan existing dan uji gangguan nyata yang
relevan. State sebagian berhasil terutama merge, bukan fitur bulk baru.

## 9. UX dan aksesibilitas

- Hierarki: judul → pilihan/item → harga dan masalah → ringkasan/Checkout.
  Pertahankan hubungan foto, nama, varian dan satuan; jangan membiarkan harga
  atau stepper berpindah ke item lain saat teks panjang membungkus.
- Target sentuh tombol/checkbox minimal 44 × 44 px untuk kontrol utama. Badge
  dan angka bukan target sentuh. Fokus terlihat, tidak mengandalkan hover.
- Select All mengumumkan mixed state; checkbox tiap item menyebut nama/varian.
  Tombol ikon punya label seperti “Hapus Monstera Deliciosa, ukuran Besar”.
- Stepper memakai kontrol angka berlabel, batas yang dapat dibaca dan navigasi
  keyboard. Minus/+ tidak sekadar glyph tanpa nama. Jangan mengubah jumlah saat
  pengguna hanya menggulir halaman.
- Ringkasan menggunakan angka tabular/alignment kanan, harga coret tetap terbaca
  dan diskon tidak hanya disampaikan lewat merah/coretan. Gunakan format rupiah
  konsisten dengan storefront, tanpa desimal dan tanpa “.000” yang terpotong.
- Perubahan total/hasil mutasi diumumkan singkat melalui live region; jangan
  membacakan seluruh halaman setiap jumlah berubah. Error dikaitkan input dan
  menjelaskan pemulihan. Loading memakai aria-busy dan menghormati reduced motion.
- Dialog hanya untuk penghapusan/draft yang memerlukan keputusan. Fokus awal
  aman, Tab tetap di dialog, Escape membatalkan jika bukan pending, fokus kembali
  ke pemicu atau item pengganti setelah item dihapus.
- Nama panjang tetap bisa dipahami tanpa tooltip. Rincian kustomisasi boleh
  disclosure, tetapi informasi uang/error/tindakan tidak dipangkas.
- Uji zoom/reflow, keyboard, kontras dan pembaca layar pada target nanti. Batas
  kontras source shell yang sudah terdokumentasi tidak menjadi klaim WCAG AA
  seluruh proyek. Tidak merombak shell di luar scope tanpa keputusan pengguna.

## 10. Data, keamanan dan kebutuhan sistem

### Read model minimum yang diusulkan, bukan endpoint aktif

| Kelompok | Data |
| --- | --- |
| Konteks | Guest/akun yang sah, cartId bila server, status keranjang, revisi, serverNow, batas kuantitas/retensi yang berlaku, capability. |
| Baris | Stable lineId, productId, variantId bila wajib, fingerprint/ref konfigurasi, nama/gambar, atribut, satuan, kuantitas. |
| Harga | Harga dasar/net integer, promo yang berlaku dan periode bila relevan, discountAmount yang konsisten, subtotal baris, mata uang IDR. |
| Ketersediaan | Aktif/tidak, stok tersedia yang boleh ditampilkan, maksimum dapat dipesan, alasan blokir, kelayakan komponen paket/buket. |
| Pilihan | Selected line IDs/selection context, selected line count dan unit count; format/persistensinya masih usulan untuk Checkout. |
| Hasil proses | Revision baru, per-item errors, adjustment before/after, item yang dihapus merge, read model target dan petunjuk retry yang sah. |

Harga berasal dari produk/varian/promo service, stok dari mekanisme persediaan
resmi, konfigurasi dari data buket yang sah. Data kartu tidak diambil dari
fixture Pesanan Saya karena itu snapshot pesanan historis. Gambar dari aset
produk yang sesuai, bukan memilih gambar generik dengan nama mirip.

### Kontrak yang ditemukan

Baseline A.7 menggunakan `/api/v1`, dengan kelompok **GET/PUT/DELETE** untuk
`/cart` dan `/cart/items/:productId`, **POST /cart/merge**, serta
**POST /checkout/quote**. Dokumen mengelompokkan method/path; spesifikasi ini
tidak mengarang method tambah item, payload, header revisi/idempotensi atau path
baru untuk varian/konfigurasi. Controller/router/validator belum aktif.

Path berbasis productId belum cukup untuk membedakan dua varian/buket berbeda.
Service perlu identitas baris/varian/fingerprint yang tidak ambigu sebelum
mutasi dihubungkan. Persyaratan ini tidak berarti route diubah pada tahap ini.

### Pembagian tanggung jawab

**Frontend:** UI/state, pilihan, draft, validasi kenyamanan, lifecycle guest
store, format rupiah, fokus, request busy/revision, pembatalan respons lama,
reconcile dan disclosure; tidak menentukan harga/stock/role dari storage.

**Backend:** autentikasi/ownership, CSRF, validasi input/status produk/varian,
limit P-05, harga/promo/stok, merge atomik dan aman diulang, retensi P-25,
integritas baris/konfigurasi, quote Checkout serta rate limit RL-08 (default
60 mutasi/menit menurut sesi dan IP). Kunci/clock/revisi frontend bukan kontrol
keamanan server. Jangan mengimplementasikan reservasi stok pada edit keranjang.

**Data tamu:** tetap minimal tanpa harga, identitas pribadi atau token auth.
§27.5/SQL memerlukan varian dan fingerprint, sementara §6.2 menulis hanya ID
produk/jumlah. Usulan minimal adalah reference produk + varian/config yang
dibutuhkan + kuantitas, bukan snapshot harga; perlu kontrak penyimpanan sebelum
implementasi. Teks kartu ucapan/nama penerima/catatan pribadi buket tidak
disisipkan ke guest storage tanpa desain privasi yang benar.

Guest metadata versi/retensi boleh dibutuhkan untuk lifecycle, tetapi jangan
menjadikannya sumber harga atau jaminan persisten ketika browser menolak storage.
Keranjang akun tidak disalin ke guest store saat logout. Bersihkan tampilan/cache
privat pada sesi/akun berubah; guest store terpisah yang sah dapat dibaca ulang.

Uang memakai integer rupiah; tanggal audit/TTL disimpan UTC dan waktu yang perlu
ditampilkan memakai WIB sesuai proyek. Tampilkan unit count dan jenis produk
secara berbeda. Catat kegagalan layanan/perubahan penting menurut kebijakan log
proyek, dengan correlation ID bila tersedia; jangan mengirim PII/isi personal
buket ke log/frontend error. Tidak mengarang kewajiban audit persetujuan staf
untuk perubahan keranjang biasa.

## 11. Daftar pekerjaan dan kriteria selesai

### Daftar pekerjaan

| Prioritas | Pekerjaan | Ketergantungan |
| --- | --- | --- |
| W | Halaman normal dan kosong berdasarkan kedua frame Figma; shell ringkas dan responsive | Aset sumber, token, route halaman saat implementasi diminta. |
| W | Kartu item, checkbox tiga state, stepper, Hapus/dialog, ringkasan konsisten | Identitas item dan read model harga/stock. |
| W | Error/limit/stock/harga berubah, loading/partial/offline/stale/uncertain | Kontrak respons/revisi service; fixture dev terpisah bila frontend-only. |
| W | Guest cart, akun, ownership cache, merge dan return auth | Penyimpanan guest/varian/config, autentikasi, service merge. |
| W | Jalur Checkout dan pemulihan quote | Kontrak selection, Checkout/login/katalog belum aktif di kode. |
| W | Reuse shell/tombol/format uang/dialog, tanpa mengubah halaman lama | Periksa konsumen helper/styles dan regresi empat halaman pelanggan. |
| W, bila item terkait ada | Ringkasan buket/paket, identitas konfigurasi dan validasi komponen | Read model konfigurasi dan stok; jangan gabungkan kustomisasi berbeda atau menebak harganya. |
| L | Jalur edit kustomisasi langsung dari Keranjang | Rute kustomisasi dan pemulihan konteks; bila belum tersedia, tetap sediakan ringkasan masalah dan Hapus. |
| O | Rekomendasi nyata di area yang ditunjuk Figma | Data katalog/aturan kurasi yang benar; bukan prasyarat Keranjang. |

### Kriteria penerimaan yang dapat diperiksa nanti

1. Struktur desktop mengikuti Figma; normal dan kosong memakai identitas sumber.
   Ponsel/tablet tidak melebar dan tombol tidak menutupi konten/footer.
2. Wishlist/voucher tidak muncul sebagai fitur aktif. Placeholder rekomendasi,
   total salah dan diskon fiktif dari frame tidak masuk UI pengguna.
3. Tamu dapat melihat/mengubah keranjang tanpa login, tanpa menyimpan harga/PII
   di guest store; kegagalan storage tidak diklaim tersimpan.
4. Checkout tamu menuju login dan kembali internal, setelah merge sah. Akun
   berbeda/staf/ID keranjang asing tidak membuka isi akun lain.
5. Dua SKU/konfigurasi berbeda tetap berbeda; duplikat identik digabung sesuai
   kontrak tanpa melewati batas produk dan tanpa menambah ganda setelah retry.
6. Qty 1, batas produk, batas stok, total 50, 0/negatif/pecahan/huruf dan input
   kosong ditangani; batas lintas varian tidak diakali dengan baris baru.
7. Perubahan pilihan/jumlah/hapus tidak mereset baris lain. N jenis/unit dan
   ringkasan sesuai pilihan yang benar-benar dipakai Checkout.
8. Harga/promo selalu dari sumber terkini, aritmetika konsisten, tanpa ongkir/
   fee tebakan. Perubahan sebelum pesan dibuat memerlukan review/consent quote.
9. Produk nonaktif/stok nol tidak hilang diam-diam pada read normal dan tetap
   memblokir Checkout menurut baseline, walaupun tak dipilih. Merge mengikuti
   aturan berbeda: item invalid dibuang dengan notice.
10. Keranjang tidak mengurangi atau mencadangkan stok; klik Checkout di halaman
    ini tidak membuat dua pesanan/merge atau melewati langkah wajib Checkout.
11. Timeout mutasi/merge diperiksa sebelum retry; respons lama tidak menimpa
    revisi terbaru. Konflik mempertahankan draft yang masih sah.
12. Dialog hapus/Batal/Escape/focus return dan draft leave protection dapat
    dipakai keyboard. Penghapusan terakhir menampilkan empty state yang benar.
13. Login batal, sesi expired, CSRF, offline, timeout, layanan bermasalah,
    429 dan cart terminal mempunyai next action serta tidak membocorkan cache.
14. Kembali dari Detail/Checkout memulihkan selection dan gulir, lalu memeriksa
    perubahan sumber. Tidak memakai stale data sebagai izin checkout.
15. Seluruh state W pada matriks dapat diperiksa melalui fixture/workbench atau
    skenario layanan yang relevan; kontrol pengujian tidak berada di UI produksi.
16. Saat implementasi nanti, hasil dirender dan diperiksa pada ukuran source
    desktop, desktop biasa, tablet dan ponsel; jalankan cek yang sesuai stack.
    Belum ada klaim build/lint/E2E atau review implementasi lulus pada spesifikasi ini.

## 12. Asumsi, konflik dan keputusan yang belum pasti

| Temuan | Keputusan rancangan saat ini / dampak |
| --- | --- |
| Figma: Rp350.000 − Rp61.000 ditulis Rp290.000, sedangkan harga item Rp289.000 | Fakta aritmetika: hasilnya Rp289.000. Gunakan perhitungan benar dari data, pertahankan susunan visual. Ini contoh desain, bukan harga katalog operasional. |
| Badge Figma -6% tidak cocok dengan selisih Rp61.000 dari Rp350.000 | Jangan menyalin persentase. Sekitar 17,43% secara matematis; aturan pembulatan badge belum ditetapkan. Gunakan data promo yang sah atau nominal hemat yang benar. |
| Ikon hati ada di Figma, wishlist di luar scope versi 1 | Tidak menambahkan aksi wishlist pada Keranjang. Perubahan ini mengikuti baseline, bukan mengganti identitas visual. |
| “Tempat rekomendasi produk” masih placeholder | Tidak ditampilkan kepada pengguna. Section hanya dilengkapi jika data/aturan nyata tersedia; tidak membuat kartu/ulasan/promo fiktif. |
| Frame masih navbar/footer besar, user meminta versi ringkas sesudahnya | Pakai shell implementasi versi terbaru; source layout isi Keranjang tetap acuan. |
| Checkbox/Checkout (1) membuktikan selection UI, tetapi subset Checkout belum dikontrak | Usulan: pilihan diteruskan sebagai stable line IDs, item tak dipilih tetap di cart. Kontrak ini dan nasib cart/items setelah konversi harus ditetapkan sebelum integrasi. Tidak menganggap source membuktikan behavior backend. |
| §6.2 memblokir checkout atas produk invalid, sementara selection dapat dipakai mengecualikan item | Ikuti baseline: uncheck saja belum cukup; item nonaktif/stok 0 harus dihapus/disesuaikan. Pelonggaran agar invalid tak dipilih boleh ditinggal memerlukan keputusan proyek, tidak dilakukan diam-diam. |
| P-05 menyebut per produk/per pesanan, SQL mendukung beberapa varian/konfigurasi | Penghitungan lintas baris dan urutan penyesuaian merge ketika limit terlampaui perlu kontrak. Jangan mengarang pemotongan item secara acak atau limit baru per SKU. |
| Guest §6.2 hanya ID produk/jumlah; §27.5 dan SQL memerlukan varian/config | Pertahankan minimal references tanpa harga/PII; payload/storage khusus varian dan buket perlu diselaraskan sebelum implementasi. |
| API item berbasis :productId, SQL mempunyai line ID + varian/fingerprint | Tidak mengarang path baru. API harus mampu menargetkan satu baris yang benar; unresolved mutation identity adalah blocker integrasi, bukan alasan menggabungkan kustomisasi berbeda. |
| P-25 guest 7 hari tanpa titik awal/reset eksplisit | Retensi tetap 7 hari; jangan menyatakan sliding TTL atau memperpanjang tiap render sebelum aturan disepakati. Akun 30 hari tanpa aktivitas sudah eksplisit. |
| Harga lama untuk notice perubahan tidak boleh berasal dari guest price cache permanen | Gunakan snapshot sesi/read model sebelumnya yang sah atau event perubahan server. Jika tidak ada, tampilkan harga terkini tanpa mengarang selisih/harga lama. |
| Pilihan awal, hitungan N, selection persistence dan sticky summary bukan interaksi yang terlihat dari frame | Usulan pada dokumen ini; validasi bersama kontrak Checkout saat implementasi. Tidak memerlukan mendesain ulang halaman. |
| Catalog/Detail/login/Checkout dan sumber produk belum aktif | Susun route/intention dan adapter terpisah; bila implementasi masih frontend-only, label pratinjau dan fixture jujur. Jangan menyebut layanan produksi sudah tersedia. |

Keputusan yang benar-benar menentukan integrasi adalah identitas baris mutasi,
selection/konversi Checkout, payload guest variant/config dan penyesuaian limit
lintas varian. Bagian yang sudah jelas tetap dapat menjadi acuan desain; jangan
mengubah ketidakpastian ini menjadi fitur/endpoint/aturan bisnis tanpa bukti.
