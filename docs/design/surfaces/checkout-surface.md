# Checkout — spesifikasi halaman

Tanggal pemeriksaan: **14 November 2026**. Status: **spesifikasi acuan dengan
implementasi UI pratinjau terpisah**. Hasil serta batas integrasi dicatat pada
[cakupan UI Checkout](../../coverage/checkout-ui.md). Skema dan Figma tidak diubah;
layanan transaksi produksi belum diaktifkan.

**Revisi terarah, 14 November 2026:** pengguna meminta `Lihat Semua` metode
pembayaran mengikuti dialog Checkout Blibli. Referensi diperiksa langsung pada
browser pengguna: kelompok berlogo, chevron, pilihan di dalam kategori dan
konten yang dapat digulir. Implementasi memakai gaya RylVa serta empat kategori
(VA, QRIS, e-wallet dan COD). Permintaan lanjutan menambah pilihan penyedia
sebagai pratinjau: BCA, Mandiri, BNI, BRI, Danamon, Permata, BSI; DANA, GoPay,
OVO, LinkAja dan ShopeePay. Ini bukan keputusan vendor atau klaim kanal aktif.
Ketersediaan, batas nominal dan aktivasi harus berasal dari gateway produksi.
Kategori tertutup pada pembukaan pertama; jika sudah ada pilihan,
kategorinya terbuka. Satu kategori dibuka pada satu waktu. Pilihan baru
diterapkan melalui `Gunakan Metode`; batal tidak mengganti pilihan sebelumnya.
COD nonaktif diberi alasan, header/tindakan tetap terlihat dan fokus kembali
ke pemicu setelah tutup atau terapkan. Revisi ini hanya mengganti dialog
pembayaran, bukan komposisi halaman Figma, navbar/footer, atau dialog alamat.

Pilihan kanal dibawa sebagai `paymentProviderId` pada DTO pratinjau, dengan
snapshot ID/nama pada `attempt.provider`. Nama penyedia ditampilkan di ringkasan,
Pembayaran dan Detail Pesanan. Pilihan nonaktif diberi alasan; daftar bank kosong
memiliki `Coba Lagi`/pilihan metode lain. Tidak ada aktivasi akun, nomor rekening
pribadi, atau batas nominal baru yang diasumsikan. Field tambahan bersifat
opsional sehingga adapter existing tanpa daftar provider tetap dapat digunakan.

## Dasar dan cara membaca

- **Fakta:** ditemukan pada instruksi pengguna, baseline, desain atau kode.
- **Usulan:** keputusan UX/arsitektur untuk melengkapi perilaku yang belum
  ditentukan. Bukan klaim bahwa fitur sudah berjalan.
- **Asumsi perlu dikonfirmasi:** kontrak atau keputusan yang belum ditemukan,
  bertentangan, atau membutuhkan penetapan sebelum integrasi produksi.

Urutan acuan: instruksi pengguna terbaru → aturan bisnis v2.6 → Figma untuk
desain halaman → implementasi sebagai bukti ketersediaan. Referensi Blibli
sebelumnya berlaku untuk revisi Keranjang; permintaan Checkout ini kembali
mengikat pada desain Checkout Figma, dengan shell ringkas yang sudah disepakati.

| Sumber | Bukti yang digunakan |
| --- | --- |
| S1 — arahan pengguna | Desain Checkout menggunakan Figma; navbar/footer tetap beridentitas RylVa dengan ukuran ringkas; aksi penting berupa tombol; rincian administratif alamat otomatis dari geocoder, tersembunyi jika lengkap, dapat dibuka, dan otomatis tampil saat peta tidak mendukung. |
| S2 — baseline | [Spesifikasi v2.6](../../specifications/spesifikasi-proyek-v2.6.md): §5, §6.2–6.4, §7–8, §10.6–10.7, §11/11.A, §15, A.7/A.11, §26.5–26.6, §27; D-06/D-07/D-09/D-11/D-15–D-17; parameter P-01–P-11/P-19/P-26/P-40 dan RL-09/RL-10. |
| S3 — Figma diperiksa langsung | [Checkout 375:108](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=375-108), [Pilih Alamat 409:107](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=409-107), [Tambah Alamat/peta 435:105](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=435-105), [Tambah Alamat/formulir 435:130](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=435-130). Struktur, teks dan empat render diperiksa; perilaku prototipe tidak dianggap terbukti. |
| S4 — produk/desain | [PRODUCT.md](../../../PRODUCT.md), [DESIGN.md](../../../DESIGN.md), [shell storefront](storefront-shell.md), [revisi pelanggan](../../coverage/customer-refinements.md). PRODUCT menetapkan mobile-first, tablet dan desktop. `produk.md` tidak ditemukan; PRODUCT dan keputusan percakapan digunakan. |
| S5 — kondisi implementasi | [Manifest pratinjau](../../../config/preview-pages.json); [Keranjang](../../../public/pages/customer/cart.html), [Akun](../../../public/pages/customer/account.html), [Pembayaran](../../../public/pages/customer/payment.html), Pesanan Saya dan Detail Pesanan sudah memiliki UI pratinjau. Template `templates/customer/checkout.php`, controller `src/Http/Controllers/Customer/CheckoutController.php` dan `public/assets/js/storefront/checkout-map-slot.js` masih kerangka komentar. Belum ada Checkout aktif dalam manifest tersebut. |
| S6 — komponen | [account-map.js](../../../public/assets/js/storefront/account-map.js), [account-validation.js](../../../public/assets/js/storefront/account-validation.js), pola dialog/fokus, badge status, shell serta adapter pratinjau halaman pelanggan. Map memakai Leaflet/OSM dan geocoder Photon; penyimpanan alamat/pesanan produksi belum terhubung. |
| S7 — skema | [DB_RylVa_Green.sql](../../../database/schema/DB_RylVa_Green.sql): alamat_pengguna, item_keranjang_belanja, item_pesanan, konfigurasi_buket_keranjang/pesanan, pesanan, percobaan_pembayaran_pesanan, reservasi_stok_pesanan dan snapshot_produk_pesanan. Keberadaan SQL bukan bukti impor atau integrasi telah berhasil. |

Bukti render lokal berada di `storage/reports/checkout-spec/`: `figma-checkout.png`,
`figma-address-picker.png`, `figma-address-map.png` dan `figma-address-form.png`.
Screenshot merupakan bahan pembanding, bukan pengganti UI atau peta interaktif.

Panduan Taste, Hallmark dan Impeccable digunakan untuk hierarki transaksi,
konsistensi, formulir, aksesibilitas dan pemulihan. Identitas existing tetap
mengikat; tidak diperlukan tema, hero pemasaran atau ilustrasi dekoratif baru.

## Direction contract

**THESIS:** penerima, isi pembelian dan total dapat diperiksa sebelum satu
tindakan pemesanan; halaman ini menyelesaikan transaksi, tanpa hero pemasaran.

**OWN-WORLD:** krem dan hijau botani, Poppins, panel berbingkai ringan, tombol
solid dan shell ringkas existing. Foto produk Figma tetap menjadi aset barang.

**STORY:** pilih alamat dan jadwal yang sah, periksa barang, pilih kurir/metode,
tinjau total/kebijakan, lalu buat satu pesanan contoh yang jelas statusnya.

**FIRST VIEWPORT:** breadcrumb dan Checkout di atas; alamat/jadwal di kiri,
metode bayar di kanan; produk dan ringkasan mengikuti di bawah. Ponsel mengikuti
urutan tugas dengan kontrol 44 px dan tanpa panel fixed penutup formulir.

**FORM:** seed: none (pinned). Pengguna: “desain pakai yang udah ada di figma”
dan “Implementasikan UI target ... berdasarkan spesifikasi ... yang ... disepakati”.
Mode Operate, code-led; komposisi frame 375:108 dan revisi alamat/shell mengikat.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Pembaruan implementasi: frontend pratinjau dan hasil pemeriksaannya dicatat pada
[cakupan UI Checkout](../../coverage/checkout-ui.md). Keterangan kondisi kode
di bawah merekam keadaan saat penyusunan spesifikasi, sebelum implementasi UI.

## 1. Pemahaman dan cakupan halaman

**Tujuan:** pelanggan memastikan barang, penerima, jadwal, pengiriman, metode
bayar dan total sudah benar, lalu memberi persetujuan untuk membuat satu
pesanan. Checkout berakhir ketika hasil pembuatan pesanan sudah diketahui;
instruksi dan verifikasi pembayaran diteruskan ke halaman Pembayaran.

| Pengguna | Akses dan kewenangan |
| --- | --- |
| Pelanggan aktif dan terverifikasi | Menggunakan keranjang dan alamat miliknya; mengubah data pembelian sebelum pesanan dibuat; membuat pesanan sesuai validasi server. |
| Tamu | Kembali ke login/registrasi, lalu melanjutkan setelah autentikasi, verifikasi dan penggabungan keranjang yang sah. Tidak dapat membuat pesanan tamu. |
| Pelanggan dengan sesi berakhir/nonaktif | Tidak dapat mengirim pesanan; pulihkan sesi atau ikuti penanganan akun tanpa memperlihatkan data akun lain. |
| Admin/SuperAdmin | Sesi staf tidak memberi hak Checkout atas nama pelanggan. Pengelolaan transaksi tetap di modul staf; tidak ditambahkan di sini. |

**Fakta:** keranjang dan quote belum mengunci stok. Online membuat pesanan
**Menunggu Pembayaran** beserta snapshot dan reservasi ACTIVE melalui T-01.
COD tervalidasi membuat pesanan **Siap Diproses**, setelah komit stok atomik,
dengan pembayaran **Menunggu/UNPAID** melalui T-20. [S2]

**Termasuk cakupan:** memilih/mengelola alamat, memilih titik lokasi, tanggal
dan slot yang relevan, memeriksa produk/varian/konfigurasi, jumlah dan catatan,
kartu ucapan opsional, layanan kurir, metode pembayaran, perhitungan ulang,
ringkasan kebijakan, persetujuan dan pembuatan pesanan yang tahan pengulangan.

**Diteruskan ke modul terkait:** login/verifikasi; perubahan konfigurasi buket
yang kompleks melalui Keranjang/konfigurator; instruksi bayar dan status dana
melalui Pembayaran; pelacakan, pembatalan pascapemesanan, komplain dan refund
melalui Detail Pesanan. Tidak menambah voucher, rekening tersimpan, pengaitan
akun e-wallet, cicilan, multi-alamat atau pemecahan pesanan otomatis.

**Kondisi saat penyusunan spesifikasi:** Figma sudah mempunyai komposisi lengkap dan tiga tampilan
alamat. Kode Checkout belum menjadi halaman fungsional. Tombol Checkout pada
pratinjau Keranjang saat ini membuka penjelasan tujuan, bukan membuat pesanan
atau berpindah ke Checkout yang terhubung backend. [S3, S5]

## 2. Struktur dan isi halaman

**Fakta visual:** frame Checkout berukuran 1920 × 2439, dengan kolom konten
kiri sekitar 994 px, kanan 703 px dan sela sekitar 25 px. Poppins, krem,
hijau botani, panel berbingkai, sudut membulat serta tombol solid mengikuti
DESIGN. Angka ini ukuran kanvas sumber, bukan ukuran tetap semua perangkat.

Label `Pilih Jadwal & Slot Pengiriman`, `Pilih Tanggal`, `Pilih Slot Pengiriman`,
`Metode Pengiriman`, `Metode Pembayaran`, `Detail Pembayaran`, `Bank BCA` dan
`DANA` ditemukan berada pada posisi layar Checkout tetapi di luar subtree
frame utama. Pemeriksaan implementasi harus memasukkannya; ekspor hanya frame
utama berisiko menghilangkan label tersebut. [S3]

| Urutan/area | Isi dan ketentuan rancangan |
| --- | --- |
| Shell | Navbar dan footer ringkas yang sudah tersedia. Tidak menyalin tinggi navbar/footer lama pada frame; footer ponsel tetap memakai bagian buka-tutup. |
| Breadcrumb dan judul | `Beranda / Keranjang / Checkout`, H1 `Checkout`. Keranjang menjadi jalur kembali utama. Tautan hanya menuju halaman yang benar-benar tersedia. |
| Kiri 1 — Alamat Pengiriman | Ikon pin, label alamat, nama penerima, telepon, jalan/rincian bangunan, kelurahan, kecamatan, kota/kabupaten, provinsi, kode pos; tombol `Ganti`. Alamat kosong menampilkan `Tambah Alamat`. Jangan mengambil data pribadi dari screenshot sebagai alamat default aplikasi. |
| Kiri 2 — Pilih Jadwal & Slot Pengiriman | Label permanen `Tanggal pengiriman` dan, bila wajib, `Slot pengiriman (WIB)`. Penjelasan sesuai jenis penanganan, tanggal/slot tidak tersedia beserta alasan, informasi kalender tutup. |
| Kiri 3 — Produk Pesanan | Foto, nama, varian, atribut penting, satuan, konfigurasi buket/paket, harga satuan final, jumlah, subtotal baris, kontrol jumlah dan hapus mengikuti Figma. Catatan per produk dengan penghitung. Tidak menyediakan checkbox pemilihan produk kedua di Checkout. |
| Kiri 3b — Kartu Ucapan | Dalam kelompok produk sebagaimana Figma: opsi `Tambahkan kartu ucapan`, pesan, `Dari`, `Kepada` dan `Kirim sebagai anonim`. Batas dan celah penyimpanan dijelaskan di §7/§10/§12. |
| Kiri 4 — Metode Pengiriman | Layanan terpilih: nama penyedia/layanan, estimasi yang benar-benar tersedia, ongkir, badge `Bisa COD` hanya jika berlaku, tombol `Lihat Semua Kurir`. Kondisi belum dipilih mempunyai ajakan yang jelas. |
| Kanan 1 — Metode Pembayaran | Pilihan radio metode aktif; label dan logo yang sesuai data penyedia; tombol `Lihat Semua Metode`. QRIS, VA/BCA, e-wallet/DANA dan COD adalah contoh pada Figma, bukan bukti seluruhnya aktif. |
| Kanan 2 — Detail Pembayaran | `Subtotal produk (N jenis, M barang)`, rincian diskon bila diperlukan tanpa dihitung dua kali, ongkos kirim, total, ringkasan kebijakan, persetujuan dan satu CTA pembuatan pesanan. Sebelum tarif valid tampilkan `Belum dihitung`, bukan `Rp 0`. |
| Akhir | Bantuan memakai tujuan/kanal yang sudah tersedia, lalu footer. Tidak membuat janji respons, nomor kontak atau promosi baru. |

**Usulan detail produk:** nama dan konfigurasi dapat membungkus; harga dan
jumlah tidak bertumpuk dengan menu. Foto berukuran stabil, `object-fit` mengikuti
aset, serta fallback bergambar netral jika gagal. Nama panjang tetap dapat
dibaca, bukan hanya tooltip. Harga sejajar dan tidak menggunakan tinggi kartu
tetap yang memotong isi. Varian/configuration tidak dapat diubah lewat teks
bebas; gunakan `Ubah di Keranjang` jika memerlukan konfigurator.

Figma mempunyai ikon tiga titik pada baris produk. **Usulan:** utamakan tombol
berlabel untuk tindakan utama; tampilkan menu hanya jika ada tindakan tambahan
yang benar-benar didukung. Tidak mengisi menu dengan fitur rekaan atau
menggandakan semua kontrol yang sudah terlihat.

**Ringkasan angka ilustratif dari Figma:** Monstera Rp 289.000 × 1 + Calathea
Rp 75.000 × 1 = subtotal Rp 364.000; ongkir contoh Rp 25.000; total contoh
Rp 389.000. Angka ini tidak membuktikan harga/tarif saat transaksi. Badge `-6%`
memerlukan harga asal dan aturan pembulatan yang valid; jangan menyalinnya
sebagai klaim tanpa data. Baris `Biaya Layanan: Gratis` tidak memiliki dasar
perhitungan baseline dan dihilangkan dari rancangan kerja sampai ada aturan
yang sah. [S2, S3]

**Responsif — usulan:** desktop mempertahankan dua kolom Figma; tablet/ponsel
menjadi satu kolom: alamat → jadwal → produk/kartu → kurir → metode bayar →
ringkasan/persetujuan/CTA. Batasi lebar konten mengikuti halaman existing,
bukan memperbesar seluruh UI proporsional ke kanvas 1920. Ringkasan boleh
sticky hanya jika seluruh panel muat pada tinggi viewport dan tidak bertabrakan
dengan header/footer. Default ponsel tidak memakai panel fixed yang menutupi
formulir, keyboard atau footer. Tidak ada pagination produk pada Checkout;
konfigurasi panjang memakai disclosure berlabel, dengan ringkasan tetap terlihat.

### Tampilan alamat mengikuti Figma dan revisi terbaru

1. **Pilih Alamat:** judul, tutup, pencarian dan `Buat Alamat Baru` satu baris
   pada desktop; kartu berbingkai dengan label, badge utama solid, nama/telepon,
   alamat lengkap, wilayah, pin dan `Sudah PinPoint`; divider sebelum tombol
   `Ubah`/`Hapus`. Ponsel menumpuk tanpa mengganti identitas visual.
2. **Usulan pemilihan:** kartu dengan radio dan area klik jelas; tombol
   `Gunakan Alamat` untuk mengonfirmasi alamat terpilih. Figma tidak menunjukkan
   mekanisme komit pilihan. Tombol ini membedakan memilih penerima dari mengedit
   buku alamat, dan menghindari ongkir berubah akibat klik tidak sengaja.
3. **Pilih lokasi:** pencarian/hasil dan `Pilih Lokasi Ini` di kiri, peta/pin
   di kanan, mengikuti frame 435:105. Ponsel menumpuk. Gambar Google Maps pada
   referensi tidak dipakai sebagai peta fungsional; renderer existing Leaflet
   dipertahankan dengan atribusi penyedia.
4. **Tambah/Ubah Alamat:** strip lokasi dan tombol `Ubah`, nama penerima,
   telepon, alamat lengkap, label, catatan 0/50, checkbox utama, tombol `Simpan`
   selebar konten sebagaimana frame 435:130. Label input tetap terlihat setelah
   terisi; placeholder tidak menjadi satu-satunya label.
5. Wilayah dan kode pos diisi dari hasil geocoder yang tersedia, disimpan
   sebagai data terstruktur dan tetap tercermin dalam alamat lengkap. Detail
   administratif **default tersembunyi hanya jika lengkap dan valid**. Tombol
   `Lihat Detail Alamat`/`Sembunyikan Detail` mengontrolnya. Saat geocoder/peta
   tidak mendukung, respons parsial atau validasi bermasalah, detail langsung
   terbuka dengan petunjuk pengisian manual; data benar yang ada tidak dihapus.

## 3. Alur penggunaan

**Alur utama — usulan interaksi dengan aturan bisnis S2:**

1. Dari Keranjang, pelanggan melanjutkan item yang dipilih. Simpan konteks
   daftar: pilihan item, jumlah tersimpan, posisi gulir dan pengurutan/filter
   jika memang ada pada halaman sumber. Identitas varian/configuration harus
   stabil; nama produk atau indeks tampilan tidak dipakai sebagai identitas.
2. Jika belum login, arahkan ke autentikasi dengan tujuan kembali internal
   yang diizinkan. Setelah login/verifikasi, gabungkan keranjang, tampilkan
   penyesuaian stok/duplikasi bila ada, lalu validasi ulang pilihan. Tidak
   mengirim data pribadi maupun total melalui URL. Keranjang tamu baru
   dibersihkan setelah server memastikan penggabungan berhasil; kegagalan
   penggabungan tidak boleh menghilangkan barang sumber.
3. Muat keranjang akun, alamat, parameter dan kemampuan layanan. **Usulan:**
   pilih alamat utama aktif sebagai awal jika valid; selain itu minta pilihan,
   jangan memilih alamat lain diam-diam. Status buku alamat utama berbeda dari
   pilihan penerima untuk pembelian ini.
4. Periksa barang; isi tanggal/slot bila wajib. Pilih layanan yang cocok
   untuk seluruh item, alamat dan jadwal. Isi catatan/kartu bila diperlukan.
5. Pilih metode bayar yang tersedia untuk layanan tersebut. Muat quote final
   dari server, lalu tampilkan subtotal, ongkir, total, penerima, jadwal, metode
   dan ringkasan kebijakan. Jangan menampilkan total lama sebagai total sah.
6. Pelanggan menandai persetujuan yang **default tidak dicentang**. CTA aktif
   hanya jika input valid, quote terkini, layanan/metode valid, tidak ada proses
   yang belum selesai, dan persetujuan sesuai versi ringkasan saat ini.
7. Kirim satu niat pembelian dengan `Idempotency-Key`; server memvalidasi ulang
   semua syarat dan membuat pesanan secara atomik. Perubahan harga/total
   mengembalikan ringkasan baru untuk persetujuan ulang, bukan langsung membuat
   pesanan dengan nominal baru.
8. Online: hasil memuat pesanan Menunggu Pembayaran dan reservasi resmi;
   lanjut ke Pembayaran milik pesanan tersebut. COD: tampilkan hasil pesanan
   Siap Diproses dan pembayaran Menunggu, nominal dibayar saat diterima.
   Gunakan [spesifikasi Pembayaran](payment-surface.md) untuk layar hasil.

**Alur alternatif dan pemulihan:**

- Mengubah alamat/jadwal/jumlah/kurir/metode memperbarui ketergantungan menurut
  §4. Pilihan lama dipertahankan hanya jika masih valid. Tidak mengganti ke
  layanan lebih mahal, COD atau metode lain tanpa sepengetahuan pelanggan.
- Jika produk campuran tidak memiliki layanan bersama, kembali ke Keranjang
  untuk memilih kelompok produk secara terpisah. Tidak otomatis membuat dua
  pesanan, memungut dua ongkir atau menghapus produk yang lain.
- `Kembali ke Keranjang` bukan membatalkan pesanan karena belum ada pesanan.
  Pulihkan konteks sumber. Draft catatan/kartu/alamat yang belum disimpan
  memerlukan pilihan `Tetap Mengedit` atau `Buang Perubahan dan Kembali`.
  Jumlah/alamat yang sudah tersimpan tidak di-rollback diam-diam.
- Membatalkan pemilih alamat mempertahankan alamat aktif sebelumnya. Dari
  formulir/peta kembali ke pemilih dengan pencarian dan pilihan sebelumnya;
  jika ada perubahan, lakukan konfirmasi sebelum membuang. Setelah alamat
  disimpan, pilih alamat tersebut untuk pembelian hanya melalui konfirmasi
  yang jelas, bukan semata karena menjadi alamat utama.
- Refresh/kembali dari tab lain memvalidasi ulang server dan tidak otomatis
  mengirim POST terakhir. Pulihkan draft yang masih sah; persetujuan tidak
  dianggap berlaku atas ringkasan yang berubah.
- Kegagalan membuat instruksi bayar **setelah order berhasil** berbeda dari
  kegagalan membuat order. Bawa pelanggan ke Pembayaran untuk order yang sama;
  jangan menawarkan CTA yang menciptakan order baru.
- Timeout setelah POST berarti hasil **belum diketahui**, bukan pasti gagal.
  Simpan identitas niat pembelian secara aman; periksa hasil di server atau
  ulangi dengan kunci dan payload sama melalui semantik idempotensi yang sah.
  Kontrak rekonsiliasi belum lengkap (§10/§12); jangan mengarang endpointnya.

## 4. Komponen dan interaksi

| Komponen | Pakai ulang/penyesuaian dan perilaku |
| --- | --- |
| Shell, breadcrumb, tombol, input, badge, pesan | Pakai token/pola existing; scope CSS Checkout. Gunakan teks + ikon untuk status, bukan variasi warna tanpa arti. |
| Dialog alamat/peta/formulir | Ekstrak atau gunakan pola dari Akun dan helper `account-map.js`/`account-validation.js`; jangan mengimpor seluruh controller halaman akun atau adapter data contoh sebagai layanan produksi. Perlu kontrak callback simpan/pilih/batal dan penanganan fokus. |
| Pencarian alamat | Langsung memfilter label, nama penerima dan alamat tersimpan; pencarian kosong memperlihatkan semua. Tombol hapus pencarian/Reset ketika tanpa hasil. Maksimum 5 alamat tidak memerlukan pagination atau tombol Terapkan. |
| Pencarian lokasi | Berbeda dari filter alamat: pencarian penyedia menggunakan tombol/jeda mengikuti adapter existing untuk mengendalikan permintaan jaringan, lengkap loading, tanpa hasil dan batal. Respons lama tidak menimpa titik/hasil yang lebih baru. |
| Pemilih jadwal | Input kalender dan kelompok radio/select slot berlabel. Hanya nilai sah dapat dipilih. Hari tidak tersedia mempunyai alasan yang dapat diakses tanpa hover; tampilkan alternatif valid dari server, bukan tanggal tebakan. |
| Baris produk/jumlah | Pola Keranjang: minus/plus dan input bilangan bulat. Minus berhenti di 1; penghapusan menggunakan tombol tersendiri. Batas mempertimbangkan stok, P-05 dan proses yang sedang berlangsung. Perubahan sah memicu quote; cegah balasan lama menimpa perubahan terbaru. |
| Catatan dan kartu | Label, penghitung karakter, pesan inline. Menutup bagian tidak langsung membuang teks. Jika kartu dinonaktifkan, draft boleh tetap ada selama kunjungan, tetapi tidak dikirim. Mengaktifkan anonim mengosongkan pengirim pada payload, bukan hanya menyembunyikan label visual. |
| Layanan kurir/metode bayar | Kelompok radio dengan area tekan penuh dan nama aksesibel; logo bukan satu-satunya nama. `Lihat Semua` membuka daftar lengkap yang tersedia melalui dialog/disclosure; pilihan tidak dibuat hanya karena panel dibuka. Layanan tidak berlaku dijelaskan, bukan dapat dipilih. |
| E-wallet `Tambah` pada Figma | **Usulan:** bila dibutuhkan untuk memilih penyedia, ubah label menjadi `Pilih E-Wallet`. Tidak menambah alur menautkan akun/menyimpan saldo tanpa kontrak dan integrasi. |
| Ringkasan/CTA | Nilai uang dari quote server; pembaruan sebagian memakai indikator di bagian yang terpengaruh, bukan mengganti seluruh form. Saat stale tampilkan penanda dan blokir pengiriman. CTA mempertahankan lebar saat loading. |
| Pengelola Checkout | Komponen baru yang mengoordinasi draft, status quote, request terbaru, validasi, dialog dan niat pembelian. Adapter terpisah untuk pratinjau dan produksi; logika perhitungan otoritatif tetap di server. |

### Ketergantungan antarkontrol — usulan

| Perubahan | Yang diperiksa ulang | Pilihan/input yang dipertahankan |
| --- | --- | --- |
| Alamat atau titik berubah | Area, kurir, tarif, COD, quote; kelayakan jadwal bila layanan memengaruhinya | Produk, catatan, kartu, tanggal/slot hanya jika tetap sah; pilihan kurir/metode dievaluasi kembali. |
| Tanggal/slot berubah | Lead time, kalender, kapasitas/layanan yang tersedia, tarif dan quote | Alamat, barang dan teks; pilihan layanan/metode yang masih kompatibel. |
| Jumlah/item/konfigurasi berubah | Harga, stok, bahan/komponen, berat, jenis penanganan, jadwal, kurir, COD, total | Alamat dan teks pada item yang sama; jangan menempelkan catatan ke varian lain. |
| Kurir berubah | Ongkir, estimasi, kemampuan COD dan quote | Jadwal/alamat valid, metode yang masih didukung; jika COD gugur, minta pilihan pengganti. |
| Metode bayar berubah | Kelayakan metode, aturan reservasi hasil checkout dan validitas quote/konteks pembelian | Alamat, item, jadwal, layanan dan teks yang sah. Tidak memulai countdown sebelum order dibuat. |
| Catatan/kartu/anonim berubah | Validasi teks dan payload snapshot | Semua pilihan logistik yang tetap sah. Tidak memanggil API tarif setiap ketikan. |
| Cari alamat/buka detail/buka kebijakan | Hanya tampilan lokal | Tidak membatalkan quote/persetujuan selama data pembelian tidak berubah. |

Perubahan total **wajib** membatalkan persetujuan sebelumnya menurut §6.4.
**Usulan tambahan:** perubahan penerima, jadwal, layanan, metode, teks kartu
atau isi pembelian juga meminta persetujuan baru walau nominal tetap, agar
persetujuan merujuk rincian yang akan dikirim. Hindari pengosongan persetujuan
akibat render ulang atau membuka disclosure tanpa perubahan data.

## 5. Status dan penanda penting

| Jenis | Label | Pemicu/dampak dan penanda |
| --- | --- | --- |
| UI/validasi | `Lengkapi data pengiriman` | Alamat/jadwal wajib belum lengkap. Pesan dekat bagian terkait; ikon informasi dan CTA menuju perbaikan. Bukan status pesanan. |
| UI/quote | `Menghitung ulang` | Data pembelian berubah atau quote dimuat; total belum dapat disetujui. Indikator proses berlabel dan CTA nonaktif. |
| UI/quote | `Tinjau perubahan` | Harga, tarif, isi atau pilihan penting berubah. Amber/peringatan, ringkasan lama→baru untuk bagian yang berubah dan persetujuan ulang. |
| UI/gangguan | `Belum dapat dilanjutkan` | Validasi atau layanan gagal. Merah untuk masalah yang menghalangi, pesan penyebab dan tindakan pemulihan. Tidak melabeli order sebagai Gagal sebelum ada order. |
| UI/pembuatan | `Sedang membuat pesanan` / `Memeriksa hasil pemesanan` | POST berjalan atau hasil belum diketahui; cegah kirim kedua. Status belum dapat disimpulkan lunas/berhasil dari animasi atau callback klien. |
| Bisnis online | Pesanan `Menunggu Pembayaran`; pembayaran `Menunggu` | Hanya setelah T-01 berhasil di server; reservasi ACTIVE sesuai metode, bukan stok sudah terjual permanen. Lanjut ke Pembayaran. |
| Bisnis COD | Pesanan `Siap Diproses`; pembayaran `Menunggu` | Hanya setelah T-20 dan komit stok berhasil. Badge informasi + teks `Bayar saat diterima`; tidak memakai badge `Lunas`. |
| UI hasil | `Pesanan berhasil dibuat` | Respons server atau rekonsiliasi memastikan order; nomor server dan tindakan lanjut tersedia. Hijau + ikon berhasil tidak berarti pembayaran berhasil. |

Gunakan kombinasi warna semantik existing pada `customer-status.css`/DESIGN
dengan kontras teruji; jangan membuat palet baru untuk tiap kartu. Pilihan
radio memakai outline/penanda terpilih, alamat utama badge solid, dan pin
memakai ikon + teks. `Sudah PinPoint` hanya berarti koordinat tersedia, bukan
sertifikasi alamat benar atau area kurir pasti didukung.

Perubahan status pesanan/pembayaran setelah order dibuat bukan kontrol
Checkout. Tidak ada tombol untuk mengubah status, mengaku sudah membayar,
mengonfirmasi uang COD atau menerbitkan bukti pelunasan di sini.

## 6. Tindakan dan dampaknya

| Tindakan | Syarat/visibilitas | Dampak, konfirmasi dan pemulihan |
| --- | --- | --- |
| Ganti/Gunakan Alamat | Aktif saat tidak membuat order; alamat milik akun dan valid | Pemilihan eksplisit memperbarui penerima, memvalidasi logistik/quote dan persetujuan. Batal mempertahankan pilihan lama. |
| Buat/Ubah Alamat | Dalam dialog; maksimum P-26 untuk alamat baru | Validasi frontend dan server. `Simpan` terkunci selama request; sukses memperbarui buku alamat, gagal mempertahankan input. Simpan alamat bukan membuat order. |
| Hapus Alamat | Alamat milik sendiri; tidak sedang dipakai request yang belum selesai | Dialog menyebut label dan dampaknya; soft-delete sesuai skema. Jika alamat aktif dihapus, minta pengganti dan hitung ulang. Jangan memilih alamat lain diam-diam atau mengubah snapshot order lama. |
| Pilih tanggal/slot | Nilai lolos kalender dan aturan server | Mengubah rencana kirim, bukan jaminan jam tiba; pembaruan layanan/quote. Tidak perlu dialog konfirmasi tiap perubahan sebelum persetujuan akhir. |
| Ubah jumlah | Integer dan dalam batas; tidak pending | Simpan perubahan sah, tampilkan progres dan quote baru. Kegagalan mempertahankan input untuk diperbaiki, dengan jumlah tersimpan tetap jelas. Tidak mengurangi stok hanya karena jumlah diubah. |
| Hapus produk | Tombol berlabel, tidak pending | **Usulan:** konfirmasi karena mengubah isi pembelian; sinkronkan ke keranjang setelah berhasil, hitung ulang. Produk terakhir dihapus → Checkout kosong. Jangan menjanjikan Undo tanpa dukungan pemulihan item/configuration. |
| Ubah konfigurasi | Jika produk memerlukan konfigurator | Kembali melalui Keranjang/konfigurator dengan konteks yang dipertahankan. Tidak mengganti bahan/varian secara otomatis. |
| Lihat semua kurir/metode | Jika data daftar tersedia | Membuka pilihan; batal tidak mengganti nilai. Terapkan pilihan radio secara jelas, tutup kembali ke pemicu dan tampilkan dampaknya. |
| Tinjau kebijakan | Selalu tersedia dari ringkasan | Membuka rincian tanpa membuang input/quote; ringkasan penting tetap terlihat sebelum checkbox. Tujuan Syarat & Ketentuan yang belum aktif tidak diberi tautan mati. |
| Buat Pesanan & Bayar | Online, seluruh syarat valid dan persetujuan terkini | Satu POST idempoten. Sukses membuka Pembayaran order sama; belum berarti lunas. Tidak menambahkan dialog konfirmasi kedua jika ringkasan/persetujuan sudah memadai. |
| Buat Pesanan — Bayar di Tempat | COD diizinkan server untuk kombinasi terpilih | T-20 atomik, pembayaran tetap Menunggu. Copy bawah tombol: bayar nominal saat diterima. COD tidak memunculkan instruksi VA/QR. |
| Coba Lagi/Periksa Hasil | Sesuai jenis kegagalan | Retry quote/layanan aman; retry pembuatan mempertahankan kunci niat dan payload bila hasil belum diketahui. Jangan membuat niat baru untuk melewati status tidak pasti. |
| Kembali/Batal | Sebelum order, kecuali request masih belum terselesaikan | Menutup dialog atau kembali ke Keranjang; perubahan belum disimpan ditangani. Setelah order dibuat, pembatalan harus lewat aturan Detail Pesanan, bukan sekadar menutup Checkout. |

Selama pembuatan order, bekukan kontrol yang mengubah payload dan cegah double
click/Enter/request ulang. Jika pengguna berpindah setelah request terkirim,
proses server tidak dianggap batal; saat kembali periksa hasil niat yang sama.
Hindari menjebak navigasi browser; tampilkan keadaan dan konsekuensi secara jelas.

## 7. Aturan bisnis, validasi dan hak akses

### Aturan transaksi yang ditemukan

| Aturan | Ketentuan dan penerapan |
| --- | --- |
| Akun | Pelanggan aktif dan terverifikasi; validasi ownership di server untuk keranjang, alamat dan order. Objek milik orang lain diperlakukan tidak ditemukan sesuai A.7. |
| Item | Status produk/varian aktif, konfigurasi valid, stok barang serta bahan/komponen cukup. Produk nonaktif/stok nol di keranjang memblokir Checkout sampai dihapus/disesuaikan menurut §6.2 dan pola Keranjang existing; checkbox tidak menjadi cara melewati penghalang itu. Tidak mengganti desain/bahan buket tanpa persetujuan. Quote bukan jaminan stok sampai transaksi order berhasil. |
| Kuantitas P-05 | Bilangan bulat minimum 1, maksimum 20 per produk dan 50 per pesanan, dibatasi stok tersedia. Definisi agregasi beberapa varian/configuration dalam satu produk harus ditetapkan di kontrak server, bukan diasumsikan 20 untuk setiap baris. |
| Jenis penanganan | Baca atribut Mudah Layu/Tahan Lama, jangan simpulkan dari nama, gambar atau kategori tanaman. Produk campuran harus memakai layanan yang valid untuk seluruh isi pembelian. |
| Jadwal P-06–P-09 | Mudah Layu wajib tanggal + slot, minimal 4 jam sebelum awal slot; Tahan Lama tanggal saja opsional dengan pengiriman paling awal H+1. Maksimum 30 hari ke depan, mengikuti kalender tutup dan jam operasional 08.00–20.00 WIB. |
| Slot P-08 | PAGI 08.00–12.00, SIANG 12.00–16.00, SORE 16.00–20.00 WIB. Nilai enum dan tanggal sah divalidasi server. Kapasitas layanan yang tersedia harus dihormati; angka kapasitas tidak ditemukan dan tidak dibuat sendiri. |
| Kurir D-06 | Mudah Layu memakai instan/same-day; reguler untuk Tahan Lama hanya bila tersedia. Area, tarif, ETA dan COD mengikuti hasil validasi layanan, bukan logo atau contoh Figma. |
| Total | Harga produk final setelah diskon dan kustomisasi sah + ongkir kurir. Nilai harga, ongkir dan total berupa rupiah integer nonnegatif; harga final termasuk pajak menurut D-15. Tidak ada voucher v1; tidak menambah pajak/biaya admin/asuransi sendiri. |
| Perubahan | Validasi akhir harga, diskon, stok, jumlah, lead time, layanan dan batas pending order. Setiap perubahan yang memengaruhi total wajib ditinjau dan disetujui ulang. Tidak memakai ambang perubahan harga Admin P-24 untuk mengecualikan perubahan kecil. |
| Batas order P-04/RL-09 | Maksimum 3 pesanan Menunggu Pembayaran aktif; pembuatan order 10/jam/akun. Arahkan ke Pesanan Saya untuk menyelesaikan/membatalkan yang ada, tanpa tindakan pembatalan otomatis. Bukan batas 3 untuk seluruh riwayat atau semua order COD. |
| Online vs COD | Online: order + snapshot + reservasi; COD: validasi + komit stok atomik + order Siap Diproses/UNPAID. Tidak mencatat dana diterima dari respons Checkout. |

Parameter harus berasal dari konfigurasi server. Angka di atas adalah baseline,
bukan konstanta baru yang boleh berbeda antara klien dan backend. Perhitungan
hari, cutoff dan alternatif jadwal menggunakan waktu server dalam WIB; jam
komputer pelanggan tidak boleh menentukan kelayakan akhir.

### Alamat dan teks

| Bidang | Validasi dan pesan perbaikan |
| --- | --- |
| Nama penerima | Wajib 2–100 karakter; gunakan validator nama existing yang mendukung Unicode. Jangan hanya menerima huruf ASCII atau menyalin nama akun sebagai satu-satunya penerima. |
| Telepon | Wajib; normalisasi 08/62 menjadi +62 sesuai helper; total 9–15 digit. Tampilkan pesan format dan pertahankan input saat gagal. |
| Jalan/rincian bangunan | Wajib 10–255 karakter. Penerima dapat mengoreksi nomor rumah/RT/RW yang tidak diketahui geocoder. Jangan menggandakan nama wilayah berkali-kali ke kolom ini. |
| Wilayah | Kelurahan/desa, kecamatan, kota/kabupaten, provinsi wajib terstruktur dan tidak kosong; batas penyimpanan masing-masing 100 karakter. Geocoder hanya mengisi nilai yang benar-benar didapat; tingkat wilayah yang ambigu perlu diperiksa pengguna. |
| Kode pos | Wajib 5 digit, simpan sebagai string agar nol awal tidak hilang. Jika tidak diberikan penyedia, buka detail dan minta melengkapi. Tidak menebak dari kota atau kode pos alamat sebelumnya. |
| Koordinat | Latitude −90 sampai 90, longitude −180 sampai 180, harus sepasang valid. Wajib untuk instan/same-day. Manual alamat tidak otomatis menghasilkan pin; tanpa pin, layanan tersebut tetap diblokir. Reguler tanpa pin hanya jika server mengizinkan. |
| Label/patokan/utama | Label wajib, maksimum 50 mengikuti implementasi. Catatan alamat opsional maksimum 50 pada Figma/helper existing, walau kolom SQL lebih longgar. Utama adalah properti buku alamat; penanganan satu alamat utama ditegakkan server. Maksimum 5 alamat P-26. |
| Catatan per produk | Figma menampilkan 0/200; **usulan batas UI 200 karakter teks biasa**. `catatan_item` keranjang SQL menampung 255, tetapi kolom snapshot setara belum ditemukan pada item_pesanan. Batas dan penyimpanan ke order perlu diselaraskan, tidak disamakan otomatis dengan P-10. |
| Pesan kartu | Opsional, maksimum 200 karakter teks biasa P-10; strip karakter kontrol yang tidak didukung dan escape saat render/email. Nama pengirim boleh kosong; anonim mengirim nilai pengirim kosong. Jika fitur diaktifkan tanpa pesan, **usulan** minta isi pesan atau matikan opsi, bukan membuat pesan sendiri. |
| Dari/Kepada | SQL mendukung nama pengirim maksimum 100. `Kepada` terlihat di Figma tetapi field tujuan kartu belum ditemukan pada pesanan. **Asumsi perlu dikonfirmasi:** penyimpanan dan batasnya; jangan menyamakannya otomatis dengan nama penerima kiriman. |

Jika satu produk mempunyai kartu khusus pada konfigurasi buket, pertahankan
snapshot kartu tersebut. **Asumsi perlu dikonfirmasi:** hubungan kartu tingkat
pesanan dengan kartu per buket, prioritas dan pratinjau cetaknya. Jangan
menimpa seluruh pesan buket memakai satu textarea Checkout.

### Ringkasan kebijakan dan persetujuan

**Fakta:** §10.6 mewajibkan ringkasan pembatalan, refund, komplain dan risiko
pengiriman. Redaksi Figma terlalu ringkas untuk menjelaskan pengecualian.
**Usulan copy**, tetap menunggu redaksi final kebijakan proyek:

- Sebelum mulai disiapkan, pesanan dapat dibatalkan sendiri dengan refund
  penuh. Setelah disiapkan, perlu persetujuan toko; tidak berlaku untuk
  produk mudah layu yang telah dirangkai.
- Komplain kondisi barang diajukan paling lambat **24 jam setelah terkirim**,
  dengan foto. Penyelesaian mengikuti penyebab dan bukti.
- Alamat salah atau penerima tidak tersedia pada produk mudah layu dapat
  memengaruhi refund biaya/kerusakan yang wajar setelah bukti upaya pengiriman
  dicatat. Kesalahan toko atau kurir tetap ditangani melalui investigasi dan
  penyelesaian yang proporsional, bukan penolakan otomatis.
- Refund diproses maksimal **3 hari kerja setelah disetujui**; waktu dana
  masuk mengikuti bank/penyedia pembayaran.

Ringkasan terlihat sebelum checkbox; rincian panjang dapat dibuka lewat
`Baca Kebijakan Lengkap`. Checkbox berlabel singkat: **“Saya telah memeriksa
rincian pesanan dan menyetujui kebijakan pembelian.”** Default tidak dicentang;
tidak digabungkan dengan persetujuan promosi. Sistem merekam versi rincian dan
kebijakan yang disetujui; bentuk kontrak penyimpanannya belum tersedia.

## 8. Matriks seluruh state yang relevan

**Prioritas:** **W** wajib sebelum rilis Checkout; **W-kondisional** wajib saat
layanan/alur terkait diaktifkan; **L** penyempurnaan setelah fondasi tersedia.
Ini prioritas pekerjaan, bukan kode prioritas halaman pada baseline.

**Konteks checkout (K):** identitas item/varian/configuration, jumlah tersimpan,
alamat terpilih, jadwal, kurir, metode dan draft teks yang masih sah. Data
pribadi/draft disimpan di memori sesi terautentikasi atau penyimpanan server
yang sesuai; tidak berarti menaruh seluruh K di localStorage/URL. Quote dan
persetujuan hanya dipertahankan jika masih cocok. **Niat (I):** kunci idempotensi
dan referensi aman atas payload pembuatan yang sama. Pemulihannya harus tahan
reload tanpa membuka data pribadi; kontrak teknis masih perlu diselesaikan.

| Area atau komponen | Nama state | Pemicu | Isi tampilan atau pesan | Tindakan yang tersedia | Data/input yang dipertahankan | Jalur pemulihan | Prioritas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Halaman | Normal | Akun dan K valid | Rincian pembelian, total sah, kebijakan, CTA | Ubah bagian, setujui, buat order | K | Lanjut sesuai metode | W |
| Kontrol | Hover/focus | Pointer atau keyboard | Batas/fokus terlihat; label tetap terbaca | Aktifkan sesuai jenis kontrol | K | Fokus tidak hilang saat render | W |
| Pilihan | Selected | Alamat/slot/kurir/metode dipilih | Radio/penanda + nama pilihan | Ganti pilihan | K | Validasi ulang ketergantungan | W |
| Detail | Expanded/collapsed | Buka rincian/kebijakan | Label buka/tutup, isi terhubung | Buka/tutup; kembali ke pemicu | K dan teks | Tidak memicu quote jika data tetap | W |
| Kontrol | Disabled/read-only | Batas jumlah, syarat kurang, pending; atribut bukan input | Alasan di dekat kontrol; nilai tersimpan jelas | Perbaiki prasyarat atau tunggu | K | Aktif kembali setelah syarat sah | W |
| Halaman | Loading awal | Membuka Checkout | Skeleton struktur; belum ada total/stock claim | Kembali | Referensi pilihan sumber | Muat data; retry bila gagal | W |
| Halaman | Gagal memuat | Permintaan awal gagal | Tidak dapat memuat Checkout | Coba Lagi, Keranjang | Pilihan sumber | Muat ulang tanpa membuat order | W |
| Section | Data sebagian | Item tersedia, alamat/layanan belum berhasil | Bagian sehat tetap terlihat; bagian gagal berpesan | Retry bagian, kembali | K yang berhasil dimuat | Jangan aktifkan CTA memakai data kurang | W |
| Quote | Memperbarui | K relevan berubah | Menghitung ulang; nilai lama ditandai belum sah | Tunggu, ubah input yang tidak terkunci | K terbaru | Terima hanya respons terbaru | W |
| Quote | Respons lama | Respons untuk K sebelumnya tiba terlambat | Tidak menimpa pilihan/total terkini | Tidak perlu tindakan pengguna | K terbaru | Abaikan/batalkan request lama | W |
| Quote | Harga/diskon/ongkir berubah | Server memberi total berbeda | Tinjau perubahan, rincian lama→baru | Tinjau, setujui ulang, kembali | K valid; consent direset | Quote baru disetujui sebelum order | W |
| Quote | Stale/kedaluwarsa | Server menolak versi atau masa berlaku; kembali setelah jeda | Perbarui rincian sebelum melanjutkan | Perbarui | K, bukan keabsahan total lama | Requote, tunjukkan perubahan | W |
| Quote | Gagal menghitung | Layanan perhitungan gagal | Total belum tersedia; bukan Rp 0 | Coba Lagi, Keranjang | K | CTA tetap blokir sampai quote sah | W |
| Akun | Tamu | Belum autentikasi | Masuk untuk Checkout; isi keranjang tetap ada | Masuk/Daftar, kembali | ID item, varian/configuration dan jumlah aman | Login → merge → validasi | W |
| Akun | Belum terverifikasi | Server mewajibkan verifikasi | Verifikasi akun sebelum membuat pesanan | Ke verifikasi, kembali | Pilihan sumber/K aman | Verifikasi lalu validasi ulang | W |
| Akun | Sesi berakhir | 401 atau sesi kedaluwarsa | Sesi berakhir; masuk kembali | Masuk, kembali | K/I aman milik sesi; sembunyikan PII | Autentikasi lalu pulihkan milik akun sama | W |
| Akses | Denied/nonaktif | 403/akun tidak berhak | Akses Checkout tidak tersedia | Kembali, bantuan yang tersedia | Hanya konteks yang boleh dilihat | Jangan tampilkan data akun lain | W |
| Akses | Objek bukan milik/tidak ditemukan | Referensi alamat/item/order asing atau hilang | Data tidak ditemukan | Kembali ke daftar milik sendiri | K lain yang sah | Ambil ulang resource pemilik | W |
| Keranjang | Kosong | Tidak ada barang setelah muat/hapus | Keranjang kosong; belum ada order | Ke katalog | Konteks asal yang masih relevan | Tambah barang lalu kembali | W |
| Pilihan item | Tidak ada pilihan/kontrak tidak valid | Pilihan dari Keranjang hilang/tidak dikenali | Pilih produk lagi di Keranjang | Kembali ke Keranjang | Isi keranjang tersimpan | Pilih ulang identitas item sah | W |
| Item | Nonaktif/dihapus/tidak tersedia | Produk/varian dinonaktifkan | Item bermasalah dan alasan | Hapus/Ubah di Keranjang | Item lain, catatan terkait | Sesuaikan; jangan membuat order parsial diam-diam | W |
| Item | Stok kurang/berubah | Validasi stok akhir gagal | Jumlah tersedia jika diketahui | Kurangi, hapus, kembali | Jumlah input dan jumlah tersimpan dibedakan | Quote ulang setelah koreksi | W |
| Buket/paket | Konfigurasi/bahan tidak valid | Opsi/komponen tidak lagi sah | Konfigurasi perlu diperiksa | Ubah di konfigurator/Keranjang | Konfigurasi lama sebagai konteks baca | Pilih konfigurasi sah, tanpa substitusi otomatis | W-kondisional |
| Item | Data/harga tidak lengkap | Field wajib transaksi hilang | Produk belum dapat dihitung | Muat ulang, kembali | Item lain dan draft | Blokir item/order sampai valid | W |
| Gambar | Aset gagal | Foto/logo gagal dimuat | Fallback + nama teks; layout stabil | Tindakan normal jika data transaksi sah | K | Gambar bukan penghalang Checkout | W |
| Jumlah | Validasi gagal | Kosong, pecahan, negatif, melewati limit | Isi jumlah bulat dalam batas yang berlaku | Perbaiki, pulihkan nilai tersimpan | Input pengguna dan nilai terakhir | Tidak mengirim nilai invalid | W |
| Jumlah/item | Menyimpan/gagal | Mutasi jumlah/hapus berlangsung atau gagal | Sedang memperbarui / perubahan belum tersimpan | Tunggu atau Coba Lagi/perbaiki | Draft dan snapshot terakhir | Rekonsiliasi sebelum quote/order | W |
| Alamat | Belum ada alamat | Buku alamat kosong | Tambahkan alamat pengiriman | Tambah Alamat | K lainnya | Form → simpan → pilih | W |
| Pemilih alamat | Tanpa hasil | Filter lokal tidak cocok | Alamat tidak ditemukan untuk pencarian ini | Hapus Pencarian, Buat Baru | K dan kueri | Reset langsung memulihkan daftar | W |
| Buku alamat | Batas maksimum | Sudah 5 alamat | Maksimum alamat tercapai | Ubah/hapus alamat yang ada | Daftar dan K | Baru aktif setelah ruang tersedia | W |
| Form alamat | Kosong/default | Tambah alamat | Field berlabel; tidak berisi data contoh pribadi | Pilih lokasi, isi, batal | Draft selama dialog | Lengkapi sebelum simpan | W |
| Peta/geocoder | Loading/hasil ditemukan | Cari lokasi atau pilih titik | Memuat hasil/alamat; titik terpilih jelas | Pilih hasil/titik, batal | Draft dan titik terakhir | Isi wilayah yang benar-benar tersedia | W-kondisional |
| Pencarian lokasi | Tanpa hasil | Penyedia tidak menemukan lokasi | Lokasi belum ditemukan | Ubah kueri, pilih titik, isi manual | Kueri/draft | Jangan membuat alamat/koordinat rekaan | W-kondisional |
| Alamat | Geocoder parsial/ambigu | Kelurahan/kode pos atau level lain tidak tersedia | Detail terbuka; bidang yang perlu dilengkapi ditandai | Lengkapi/koreksi | Semua field valid/titik | Validasi ulang sebelum simpan | W |
| Peta | Tidak didukung/tile atau CDN gagal | Renderer tidak tersedia, aset/penyedia gagal | Peta belum dapat digunakan; detail manual terbuka | Retry peta, isi manual | Draft/titik valid sebelumnya | Reguler jika sah; instan tetap butuh titik | W |
| Peta | Reverse lookup gagal/timeout/offline | Alamat dari titik gagal dimuat | Gagal mengambil rincian lokasi | Coba Lagi, isi manual | Koordinat baru dan draft, tanpa wilayah lama disahkan otomatis | Tandai rincian perlu diperiksa; validasi lagi | W |
| Detail alamat | Hidden/ditampilkan | Data lengkap valid atau pengguna membuka | Ringkasan lengkap / field administratif | Lihat/Sembunyikan Detail | Nilai tetap tersimpan saat hidden | Error pada field hidden membukanya otomatis | W |
| Alamat | Pin wajib belum ada | Layanan instan/same-day dipilih tanpa titik | Pilih titik untuk layanan ini | Pilih Titik, ganti layanan sah | Alamat teks dan K | Tidak menganggap input manual sebagai koordinat | W |
| Form alamat | Validasi satu/beberapa bidang | Nama/telepon/wilayah/kode pos invalid | Pesan spesifik dan ringkasan error | Perbaiki, batal | Seluruh draft | Fokus bidang pertama; detail terbuka | W |
| Form alamat | Menyimpan | POST/PATCH alamat berjalan | Menyimpan alamat | Tunggu | Draft | Cegah simpan ganda | W |
| Form alamat | Gagal menyimpan/konflik/duplikasi | Server menolak, respons tidak pasti atau versi berubah | Jelaskan penyebab; jangan mengaku tersimpan | Muat versi terbaru, retry aman, pilih yang sudah ada | Draft dan referensi request | Rekonsiliasi buku alamat sebelum POST ulang; aturan deduplikasi belum ditetapkan | W |
| Alamat | Berhasil disimpan | Server memastikan simpan | Alamat tersimpan; siap dipilih | Gunakan Alamat, kembali ke daftar | Buku alamat baru dan K | Pilih eksplisit lalu validasi ongkir | W |
| Alamat terpilih | Diubah/dihapus di tempat lain | Revalidasi mendapati versi baru/tidak aktif | Periksa alamat pengiriman kembali | Tinjau/pilih alamat lain | Produk dan teks; alamat lama sebagai konteks, bukan pilihan sah | Validasi logistik dan consent ulang | W |
| Form/dialog | Perubahan belum disimpan | Tutup, kembali, pindah halaman | Simpan dulu atau buang perubahan? | Tetap Mengedit, Buang Perubahan | Draft sampai keputusan | Kembali ke pemicu/konteks asal | W |
| Catatan/kartu | Opsional tidak diisi/nonaktif | Fitur tidak digunakan | Ajakan singkat, bukan error | Tambah kartu/catatan | K; draft lokal selama kunjungan | Tidak kirim teks fitur yang dimatikan | W |
| Catatan/kartu | Panjang/karakter tidak valid | Melebihi batas atau teks tidak sah | Batas + jumlah karakter + cara perbaikan | Koreksi, matikan kartu bila opsional | Teks sampai diperbaiki | Tidak memotong diam-diam saat submit | W |
| Kartu | Anonim terpilih | Checkbox anonim | Dari nonaktif dengan penjelasan; pesan tetap ada | Batalkan anonim, ubah pesan | Draft pengirim di memori jika perlu | Payload pengirim kosong saat anonim | W |
| Kartu buket | Konflik kartu tingkat pesanan/per buket | Pesan buket sudah ada | Tunjukkan kartu mana yang berlaku | Tinjau konfigurasi | Semua pesan asli | Kontrak prioritas harus ditetapkan; jangan timpa | W-kondisional |
| Jadwal | Opsional Tahan Lama | Tidak ada item Mudah Layu | Tanggal opsional; slot tidak diminta | Pilih/hapus tanggal opsional | K lainnya | Server menentukan layanan sah tanpa tanggal pilihan | W |
| Jadwal | Memuat ketersediaan | Tanggal/jenis penanganan berubah | Memuat jadwal yang tersedia | Tunggu, ganti tanggal bila aman | Tanggal input dan K | Terima data terbaru | W |
| Jadwal | Lead time/tanggal invalid | Terlalu dekat, lewat 30 hari, tanggal lampau atau kalender tutup | Alasan + pilihan valid terdekat dari server | Pilih tanggal/slot lain | K, pilihan lama ditandai invalid | Pilihan valid baru sebelum quote | W |
| Slot | Tidak tersedia/kapasitas penuh | Server menolak slot atau layanan | Slot tidak tersedia; tanpa janji kuota rekaan | Slot/tanggal lain | Alamat, produk, teks | Ambil alternatif sah | W-kondisional |
| Jadwal | Berubah saat menunggu | Waktu server melewati cutoff/kalender berubah | Jadwal perlu dipilih ulang | Pilih alternatif, kembali | K lainnya | Validasi ulang sampai sebelum order | W |
| Kurir | Belum dipilih/loading | Prasyarat tersedia; daftar sedang diambil | Pilih layanan / Memuat kurir | Pilih setelah daftar sah | K | Tidak mengasumsikan tarif 0/default Gosend | W |
| Kurir | Tidak melayani/tidak ada layanan bersama | Alamat di luar area atau cart campuran tidak cocok | Alasan area/penanganan yang diketahui | Ganti alamat/jadwal; pisahkan pilihan di Keranjang | K | Jangan membuat order atau membagi otomatis | W |
| Kurir | API gagal/timeout | Pengambilan layanan/tarif gagal | Tarif belum dapat diperoleh | Coba Lagi, Ganti Alamat, kembali | K | Tidak memakai tarif lama sebagai tarif sah | W |
| Kurir | ETA/metadata sebagian | Tarif valid, ETA/atribut opsional tidak diberikan | Estimasi belum tersedia; nama/tarif sah tetap ada | Pilih jika backend mengizinkan | K | Jangan menebak ETA atau service code | W |
| Pembayaran | Belum dipilih | Tidak ada metode sah dipilih | Pilih metode pembayaran | Pilih metode | K | Quote/persetujuan sesuai pilihan | W |
| Pembayaran | COD tidak didukung | Layanan/area/produk tidak memenuhi kemampuan COD | COD tidak tersedia untuk pilihan ini | Pilih online atau layanan lain | K, jangan otomatis pindah metode | Pilihan baru disetujui | W-kondisional |
| Pembayaran | Metode tidak aktif/tidak ada/gangguan penyedia | Kemampuan layanan berubah atau semua unavailable | Metode belum tersedia; detail sebab bila diketahui | Pilih metode lain, retry, kembali | K | Tidak membuat instruksi/metode palsu | W |
| Persetujuan | Belum disetujui | Default atau perubahan rincian | Periksa ringkasan dan setujui sebelum membuat order | Tinjau kebijakan, centang | K | CTA aktif hanya sesudah syarat lain sah | W |
| Persetujuan | Versi kebijakan/ringkasan berubah | Server menolak versi yang disetujui | Tinjau perubahan terbaru | Baca, setujui ulang | K; persetujuan lama tidak berlaku | Tidak otomatis mencentang ulang | W |
| Batas transaksi | Pending order mencapai P-04 | Ada 3 Menunggu Pembayaran aktif | Selesaikan pesanan yang menunggu | Pesanan Saya, kembali | K | Bayar/batalkan yang sah lalu revalidasi | W |
| Permintaan | Rate limited | 429/RL-09 atau pembatasan layanan | Coba kembali sesuai waktu server | Tunggu, kembali | K/I bila relevan | Hormati Retry-After; tidak auto-loop | W |
| Koneksi | Offline sebelum pengiriman | Jaringan terputus | Koneksi terputus; pesanan belum dikirim jika memang belum terkirim | Sambungkan kembali, retry | K | Requote dan validasi setelah online | W |
| Layanan | Maintenance/5xx | Respons layanan sedang tidak tersedia | Checkout sementara belum tersedia | Coba Lagi, kembali/bantuan | K/I jika request pernah terkirim | Jika hasil pembuatan belum pasti, periksa dahulu | W |
| Keamanan request | CSRF/sesi tidak valid | Mutasi ditolak server | Sesi perlu diperbarui | Muat ulang aman/masuk | K/I aman | Perbarui otorisasi; jangan bypass atau POST otomatis | W |
| Pembuatan | Mengirim/proses lama | POST berjalan lebih lama | Sedang membuat pesanan; jangan kirim lagi | Tunggu; navigasi dengan penjelasan | K + I | Tetap satu request/niat; beralih periksa hasil bila timeout | W |
| Pembuatan | Validasi akhir ditolak | Stok/harga/lead time/versi berubah | Tidak dibuat bila server memastikan; masalah per bagian | Perbaiki/tinjau ulang | K; quote/consent direvisi | Requote; niat baru hanya setelah hasil sebelumnya jelas | W |
| Pembuatan | Timeout/terputus, hasil tidak diketahui | Respons hilang setelah POST | Memeriksa apakah pesanan sudah dibuat | Periksa Hasil, Pesanan Saya | I + referensi K aman | Rekonsiliasi/replay sama; jangan buat ulang dengan kunci baru | W |
| Pembuatan | Duplikasi/replay idempoten | Klik/tab/request berulang untuk niat sama | Buka hasil pesanan yang sama | Lanjut ke hasil | I/order yang dipastikan server | Tidak ada order/reservasi/komit kedua | W |
| Pembuatan | Kunci sama, payload berbeda | Niat lama dipakai untuk rincian berbeda | Rincian tidak cocok dengan permintaan sebelumnya | Periksa hasil lama; tinjau perubahan | I lama dan draft baru terpisah | Jangan menimpa order; kontrak konflik server harus ditetapkan | W |
| Hasil | Alamat tersimpan, order gagal | Simpan alamat berhasil; langkah order ditolak | Alamat tersimpan, pesanan belum dibuat bila dipastikan | Perbaiki Checkout, kembali | Buku alamat dan K | Tidak rollback alamat atau tampilkan sukses seluruh proses | W |
| Hasil online | Order berhasil/instruksi belum ada | T-01 dipastikan; inisiasi gateway gagal/belum selesai | Pesanan dibuat, pembayaran belum dapat dimulai | Buka/Coba Lagi di Pembayaran order sama | Order/I dan snapshot server | Jangan POST order baru; RL-10 berlaku pada payment attempt | W |
| Hasil online | Berhasil dibuat | T-01 dan respons hasil sah | Nomor pesanan, Menunggu Pembayaran, total, tenggat resmi | Ke Pembayaran, Detail Pesanan | Snapshot order, bukan form editable | Pembayaran menangani instruksi/status | W |
| Hasil COD | Berhasil dibuat, belum dibayar | T-20 dan komit berhasil | Siap Diproses; Bayar saat diterima; pembayaran Menunggu | Detail Pesanan/Pesanan Saya | Snapshot order | Tidak menampilkan lunas/bukti pelunasan | W-kondisional |
| Kembali ke halaman | Order sudah berubah di tab lain | Revisit/bfcache/reload | Hasil terbaru order/niat, bukan CTA membuat ulang | Buka Pembayaran/Detail sesuai status | Referensi order sah dan konteks daftar | Revalidasi server, cegah resubmit order lama | W |

**Tidak dipaksakan:** pagination hasil produk, pencarian/filter daftar pesanan,
upload bukti bayar, moderasi Admin, verifikasi uang COD, refund dan arsip order
bukan state Checkout. Pencarian tanpa hasil relevan pada pemilih alamat/peta,
bukan alasan menambahkan search produk baru. Tidak ada hasil “sebagian produk
berhasil dipesan”: pembuatan satu order harus atomik. Keberhasilan sebagian
langkah seperti alamat tersimpan tetapi order gagal harus dijelaskan terpisah.

**Usulan cara memeriksa saat implementasi:** gunakan workbench development
terpisah seperti halaman pelanggan existing, dengan adapter deterministik
untuk state matrix. Kontrol fault/role tidak masuk alur produksi; parameter
preview tidak boleh menggantikan otorisasi server. Skenario waktu menggunakan
jam terkontrol. Pengujian idempotensi/stock membutuhkan backend nyata atau
test double kontrak yang jujur; UI simulasi tidak membuktikan keamanan transaksi.

## 9. UX dan aksesibilitas

- Pertahankan Poppins dan token DESIGN. **Usulan jarak:** sela panel 24 px,
  padding desktop 24 px/ponsel 16 px, sela field 16 px; sesuaikan token existing
  saat dirender. Gunakan ukuran teks isi sekitar 14–16 px, judul kelompok
  sekitar 18–20 px; jangan menyalin seluruh ukuran font kanvas Figma ke ponsel.
- Heading satu H1, lalu H2 per kelompok. Form memiliki label permanen,
  `fieldset`/`legend` pada radio/checkbox terkait; urutan DOM mengikuti alur
  tugas, bukan urutan penempatan absolut Figma. Beri penanda wajib/opsional.
- Target tekan **usulan minimal 44 × 44 px** untuk kontrol utama, termasuk
  tombol ikon, tutup dan jumlah. Label hapus menyebut produk; nama aksesibel
  `Tambah jumlah [produk/varian]` tidak hanya `+`.
- Semua kontrol berfungsi dengan keyboard; radio memakai perilaku native,
  disclosure menyampaikan expanded state. Hindari role menu jika perilaku
  keyboard menu belum diimplementasikan; daftar tindakan biasa dalam popover
  dapat memakai tombol semantik sesuai pola existing.
- Dialog mempunyai judul, fokus awal yang tepat, trap fokus, Escape sesuai
  kondisi, pengembalian fokus ke pemicu dan background inert. Perpindahan
  peta/formulir tidak menumpuk beberapa dialog aktif. Konfirmasi buang perubahan
  mengembalikan fokus/input bila dibatalkan.
- Peta tidak menjadi satu-satunya cara memasukkan alamat. Gunakan pencarian
  hasil keyboard dan tombol existing `Pilih Titik Tengah Peta`. Mode manual
  tetap menghormati kebutuhan koordinat layanan; atribusi peta terlihat.
- Error inline terhubung ke input; setelah submit tidak valid, tampilkan
  ringkasan dan fokus error pertama. Error administratif membuka detail
  tersembunyi. Jangan memindahkan fokus setiap kali quote berubah.
- Progres/hasil umum diumumkan melalui status live yang tidak berulang tiap
  ketikan; kegagalan kritis melalui alert yang tepat. Sebutkan nilai dan sebab
  perubahan, bukan hanya warna badge. Periksa kontras teks kecil, placeholder,
  disabled, badge dan focus ring pada permukaan krem.
- Angka memakai format `Rp 389.000`, unit dan varian eksplisit; jumlah jenis
  dan total unit berbeda. Tanggal tampilan `14 Nov 2026`, jam `12.00–16.00 WIB`;
  ISO hanya untuk kontrak data. Harga tidak memerlukan tooltip untuk terbaca.
- Alamat/nama panjang membungkus; tombol tidak mengecil sampai sulit ditekan.
  Nomor telepon/resi tidak relevan selain telepon penerima; jangan menambah
  field resi di Checkout. Modal tinggi menggulir isi, tindakan tidak menutupi
  error terakhir, dan halaman tidak scroll horizontal pada ponsel.
- Periksa desktop, tablet, ponsel, pembesaran teks/zoom dan keyboard layar.
  Hormati reduced motion; animasi bukan syarat memahami keberhasilan. Saat
  kembali ke daftar, pulihkan pencarian/pilihan/gulir yang relevan.

## 10. Data, keamanan dan kebutuhan sistem

### Data minimum dan hubungan

| Data | Sumber/batas dan kebutuhan |
| --- | --- |
| Sesi pelanggan | Status aktif/terverifikasi dan ownership dari server; sesi staf terpisah. Tidak mempercayai mode akun di adapter preview. |
| Keranjang/item | ID stabil, produk/varian/SKU, konfigurasi, jenis penanganan, satuan, harga normal/diskon/kustomisasi final, kuantitas, stok/ketersediaan yang boleh ditampilkan, berat/komponen untuk validasi server, gambar dan catatan. Keranjang akun merupakan sumber tersimpan, bukan total klien. |
| Alamat | ID pemilik, label, penerima, telepon, jalan, seluruh wilayah/kode pos, patokan, koordinat, utama/aktif dan versi bila kontrak mendukung. Snapshot alamat order tidak berubah saat buku alamat diedit. |
| Jadwal | Tanggal ISO, kode slot, timezone/waktu server, kalender tutup dan hasil ketersediaan. Tanggal pilihan/pengiriman tidak disamakan dengan janji jam tiba. |
| Pengiriman | ID/kode layanan resmi, jenis layanan, area yang memenuhi, tarif integer, ETA bila tersedia, kemampuan COD, keterkaitan dengan quote. Provider produksi belum ditetapkan terbukti. |
| Pembayaran | Metode/penyedia yang benar-benar aktif, kemampuan untuk kombinasi order dan aturan hasil reservasi. Daftar enum SQL lebih luas daripada Figma bukan alasan mengaktifkan semua metode. |
| Quote | Item dan harga sah, subtotal, ongkir, total, masalah per bagian dan konteks yang dihitung. **Usulan kontrak:** identitas/revisi, waktu server, masa berlaku bila ada, serta keterikatan ke pilihan dan versi kebijakan. Nama field/TTL belum ditetapkan, bukan endpoint aktif. |
| Niat/order | Kunci idempotensi, referensi payload yang disetujui, hasil order/nomor server, status terpisah, snapshot harga/alamat/jadwal/kurir/teks, tenggat resmi dan reservasi/komit. Skema mempunyai kolom kunci checkout dan unique index; perilaku HTTP replay tetap perlu implementasi. |
| Teks kartu | Pesanan memiliki pesan dan nama pengirim; konfigurasi buket memiliki pesan/pengirim snapshot sendiri. `Kepada` dan snapshot catatan item belum terlihat pada tempat tujuan order yang diperiksa. Jangan diam-diam membuangnya. |

### API yang tercatat, belum terbukti aktif

Basis terdokumentasi **`/api/v1`**. Daftar ini kontrak baseline A.7, bukan klaim
bahwa request produksi saat ini berhasil. Detail body/response perlu ditetapkan.

| Metode/path baseline | Tanggung jawab yang terkait |
| --- | --- |
| GET/PUT/DELETE `/cart`, `/cart/items/:productId`; POST `/cart/merge` | Keranjang dan penggabungan setelah login. Pemilihan subset, identitas varian/configuration dan target mutasi belum cukup rinci; jangan memutasi semua varian lewat productId saja. |
| GET/POST/PATCH/DELETE `/me/addresses` | Buku alamat pemilik, maksimum 5; detail identifikasi record/version mengikuti kontrak yang akan ditetapkan. Tidak mengarang path item baru dalam dokumen ini. |
| GET `/shipping/options` | Layanan sah sesuai alamat, jadwal dan jenis penanganan. |
| POST `/checkout/quote` | Validasi dan perhitungan; **tidak membuat order atau reservasi stok**. Endpoint slot tersendiri belum ditemukan; jangan membuatnya seolah tersedia. |
| POST `/orders` + `Idempotency-Key` | Membuat satu order, snapshot dan reservasi online/komit COD sesuai transisi. A.7 menulis T-01; §6.4/§26.5 juga mensyaratkan T-20. Discriminator/hasil COD perlu diselaraskan tanpa mengubah aturan bisnis. |
| GET `/orders`, `/orders/:id` | Daftar/detail milik pelanggan untuk hasil/recovery. Jika ID belum diketahui, pencocokan niat perlu kontrak tambahan yang ditetapkan, bukan pencarian berdasarkan tebakan nomor. |
| POST `/orders/:id/payments` | Membuat payment attempt untuk order yang sudah ada; RL-10/P-03 berlaku. Gagal pada langkah ini tidak membuat ulang order. |

**Usulan pembagian implementasi:** frontend mengelola input, validasi bantu,
state dan presentasi. Backend menentukan ownership, aturan, quote, stok/bahan,
tarif sah, batas, snapshot, idempotensi dan transaksi atomik. Adapter penyedia
kurir/gateway menangani kontrak eksternal; hasil klien tidak memverifikasi uang.
Jalur T-01/T-20 dan pembukaan instruksi pembayaran harus dapat dibedakan pada
respons agar frontend tidak menyimpulkan kegagalan semua langkah sekaligus.

**Keamanan dan pemulihan yang diperlukan:**

- Mutasi terlindungi sesi/CSRF; cookie mengikuti baseline HttpOnly, Secure dan
  SameSite. Harga, pemilik, diskon, koordinat, kemampuan COD dan jumlah tidak
  dipercaya hanya dari request klien. Escape catatan/kartu pada seluruh tujuan.
- Cegah pengulangan lewat unique key dan transaksi server, bukan sekadar
  menonaktifkan tombol. Kunci sama/payload sama harus mengarah hasil yang sama;
  payload berbeda membutuhkan penolakan konflik yang jelas. Durasi retensi,
  scope akun dan respons replay harus ditentukan dan diuji.
- Tidak menyimpan alamat, telepon, teks kartu atau instruksi pembayaran dalam
  URL, log frontend umum atau storage tamu. Persistensi draft/niat yang tahan
  reload memerlukan mekanisme aman, terikat akun dan dapat dibersihkan saat
  logout/pergantian akun. Jangan memulihkan draft akun A ke akun B.
- Leaflet adalah renderer, bukan sumber alamat. Adapter existing memakai
  OSM/Photon; kirim kueri lokasi/koordinat seperlunya, tanpa nama penerima,
  telepon atau catatan pribadi. Pertahankan atribusi, pembatasan permintaan,
  penolakan respons lama dan fallback. Kapasitas/ketentuan provider produksi
  masih memerlukan verifikasi sebelum rilis.
- Audit/log transaksi mencatat order, aktor, waktu, alasan kegagalan penting,
  idempotensi, versi snapshot/persetujuan, reservasi/komit dan hasil. Log tidak
  mengekspos token, kredensial atau seluruh data pribadi tanpa kebutuhan.
- Nomor pesanan `RV-YYMMDD-XXXXXX` dihasilkan server dan unik; enam karakter
  terakhir acak huruf besar/angka tanpa karakter yang mudah tertukar seperti
  0/O dan 1/I. Bukan ID yang dibuat frontend; mengetahui nomor tidak memberi
  hak melihat pesanan.
- Tenggat online mengikuti respons server yang konsisten dengan metode dan
  reservasi. P-01 menyebut 60 menit, P-40 menyebut QRIS/e-wallet 10 menit,
  transfer 15 menit dan VA sesuai penyedia. Jangan memasang timer universal
  di Checkout; selaraskan aturan ini dengan Pembayaran sebelum produksi.

**Fakta batas ketersediaan:** komponen UI, fixture dan workbench halaman
pelanggan sudah ada; map/geocoder Akun sudah mempunyai implementasi frontend.
Checkout, autentikasi/persistence produksi, quote, kurir, stok dan gateway
belum terbukti terhubung. Pratinjau berikutnya wajib diberi penanda data contoh
dan adapter terpisah, tidak mengaku telah membuat order/menyimpan alamat nyata.
Penjelasan teknis ini ditempatkan pada dokumentasi/development, bukan memenuhi
form produksi dengan istilah endpoint dan database.

## 11. Daftar pekerjaan dan kriteria selesai

### Daftar pekerjaan

| Prioritas | Pekerjaan | Ketergantungan/hasil |
| --- | --- | --- |
| W | Pakai ulang shell ringkas, token Poppins/warna, breadcrumb, tombol, input, status, dialog dan pola fokus | Tidak mengubah desain halaman lain. Shell dibandingkan pada desktop/ponsel. |
| W | Buat struktur Checkout dua kolom Figma dan satu kolom responsif | Termasuk label yang berada di luar subtree frame, ringkasan, kebijakan dan CTA kontekstual. |
| W | Gunakan/rapikan komponen alamat dan adapter map agar dapat dipanggil Checkout | Figma picker/peta/form + detail otomatis/manual, validasi dan pemulihan; CRUD produksi terpisah dari preview. |
| W | Buat koordinasi draft, identitas item, jumlah/catatan/kartu, dependency invalidation dan quote terbaru | Kontrak subset/varian, batas, snapshot catatan, kartu pesanan/per buket perlu diselesaikan. |
| W | Buat pemilih jadwal, daftar kurir dan metode sesuai kemampuan server | Parameter, kalender dan integrasi; jangan menampilkan tarif/metode contoh sebagai layanan nyata. |
| W | Tetapkan dan implementasikan kontrak quote/pembuatan/recovery idempoten | Atomic order, reservasi/komit, consent, penanganan hasil tidak pasti dan handoff ke Pembayaran. |
| W | Selaraskan kebijakan dan data | Hilangkan fee tanpa dasar, perbaiki ringkasan risiko, kontrak `Kepada`/catatan, P-01/P-40 dan pemrosesan subset. |
| W | Lengkapi state matrix, workbench development dan verifikasi | Normal, gagal, konflik, akses, tanpa data, map fallback, timeout/replay, online/COD; kontrol uji terpisah produksi. |
| W | Integrasikan dengan Keranjang dan Pembayaran tanpa membuat order kedua | Kembali menjaga konteks; hasil terhubung order yang sama. Dokumentasikan batas aktif/simulasi. |
| W-kondisional | Konfigurasi buket/paket, COD dan metode vendor tertentu | Wajib sebelum kemampuan tersebut diaktifkan, bukan boleh dilewati saat melayani transaksi tersebut. |
| L | Optimalkan cache pemuatan, skeleton dan pemulihan draft lintas kunjungan yang lebih nyaman | Setelah keamanan, konsistensi dan kontrak pemulihan dasar selesai; jangan cache total sebagai kebenaran transaksi. |
| Opsional | Sticky ringkasan desktop jika tinggi panel sesuai | Hanya setelah render membuktikan tidak menutupi isi/fokus; tidak menjadi kebutuhan fungsional. |

### Kriteria penerimaan yang dapat diperiksa

1. Susunan, panel, tipografi, warna dan dialog alamat dapat dibandingkan dengan
   empat frame Figma; revisi ukuran shell dan detail alamat pengguna tetap berlaku.
2. Desktop/tablet/ponsel tidak overflow horizontal; nama/alamat/konfigurasi
   panjang, angka besar, foto gagal dan keyboard layar tidak memotong tindakan.
3. Tamu diarahkan login/verifikasi, keranjang digabung dengan hasil yang jelas,
   lalu kembali; tidak ada checkout tamu atau akses lewat sesi staf.
4. Pelanggan hanya dapat melihat/memakai alamat, keranjang dan order sendiri;
   kasus 401/403/404 tidak membocorkan keberadaan data pelanggan lain.
5. Pilihan produk dari Keranjang memakai identitas varian/configuration stabil.
   Kembali memulihkan pilihan, jumlah tersimpan dan posisi gulir; produk yang
   tidak dipesan tidak hilang tanpa aturan/persetujuan yang ditetapkan.
6. Alamat baru/ubah/hapus/pilih, batas 5, pencarian tanpa hasil, batal dan
   perubahan belum disimpan berfungsi tanpa menciptakan order.
7. Geocoder lengkap mengisi wilayah/kode pos yang benar dan menyembunyikan
   detail; tombol membuka detail. Respons parsial/gagal/invalid otomatis
   membuka field, mempertahankan input dan tidak membuat kode pos rekaan.
8. Leaflet gagal/ditolak/offline tetap menyediakan jalur manual; instan/same-day
   tidak lolos tanpa koordinat valid. Pencarian dan pemilihan titik dapat
   dilakukan dengan keyboard; respons lama tidak menimpa lokasi terbaru.
9. Jadwal Mudah Layu wajib, Tahan Lama tanggal opsional; cutoff 4 jam, H+1,
   batas 30 hari, slot WIB, kalender tutup dan perubahan waktu server diperiksa.
10. Cart campuran hanya mendapat layanan yang cocok untuk semua barang;
    tanpa layanan ditangani tanpa pemecahan order atau tarif buatan.
11. Jumlah integer, stok/varian/komponen, P-05 dan item nonaktif diperiksa di
    klien dan server; tidak terjadi order parsial atau substitusi otomatis.
12. Catatan/kartu mematuhi batas Unicode dan escaping; anonim tidak mengirim
    nama. Pesan buket tidak tertimpa; `Kepada`/catatan item tidak dibuang diam-diam.
13. Kurir, ETA, COD, bank/e-wallet hanya tampil sebagai tersedia jika didukung
    data. Tidak ada klaim layanan gratis, voucher atau biaya baru tanpa dasar.
14. Setiap perubahan ketergantungan memperbarui quote; respons lama diabaikan.
    Total belum sah ditandai dan tidak dapat digunakan untuk membuat order.
15. Perubahan total saat validasi akhir selalu menampilkan ringkasan baru dan
    meminta persetujuan ulang. Checkbox default kosong; kebijakan penting
    terbaca sebelum menyetujui dan tidak menyatakan seluruh refund hangus.
16. Batas 3 Menunggu Pembayaran dan 10 pembuatan/jam menghasilkan pesan serta
    jalur ke Pesanan Saya; pembatasan tidak diterapkan sebagai batas semua order.
17. Double click, Enter berulang, replay jaringan dan dua tab untuk niat sama
    tidak menggandakan order, reservasi atau komit stok. Payload berbeda dengan
    kunci sama ditolak secara jelas.
18. Timeout setelah POST tidak diberi pesan pasti gagal; reload/recovery memakai
    niat yang sama dan memperoleh hasil server tanpa order baru yang tidak sengaja.
19. Online membuat snapshot + reservasi atomik dan status Menunggu Pembayaran;
    COD membuat komit atomik + Siap Diproses/UNPAID. Tidak ada badge Lunas dari Checkout.
20. Order berhasil tetapi inisiasi pembayaran gagal dipulihkan di order yang
    sama. Batas payment attempt dan tenggat memakai sumber server, bukan timer
    universal atau order baru pada setiap retry.
21. Offline, 5xx, maintenance, 429, CSRF dan konflik mempunyai langkah berikut
    yang dapat digunakan tanpa kehilangan input yang masih diperlukan.
22. Semua input, radio, disclosure, dialog dan tindakan berfungsi dengan
    keyboard; fokus/error/status diumumkan, kontras memadai, warna bukan satu-satunya petunjuk.
23. State development dapat dipicu tanpa mengubah akun/data produksi. Fixture
    tidak memuat data pribadi screenshot dan tidak diperlakukan sebagai integrasi.
24. Jika komponen shared disentuh, Keranjang, Akun, Pembayaran, Pesanan Saya
    dan Detail Pesanan diperiksa regresinya pada interaksi yang terdampak.

**Pemeriksaan tahap ini:** inspeksi dokumen/kode dan empat render Figma serta
validasi struktur dokumen. Build, uji browser Checkout, uji API/idempotensi,
database dan transaksi **belum dijalankan**, karena halaman belum diimplementasikan
pada tugas spesifikasi ini. Daftar di atas adalah target uji saat implementasi,
bukan laporan kelulusan saat ini.

## 12. Asumsi dan keputusan yang belum pasti

| Temuan/perbedaan | Rancangan kerja dan dampak | Status penyelesaian |
| --- | --- | --- |
| Figma label penting berada di luar frame utama | Masukkan label yang telah ditemukan dalam implementasi. Tidak menyimpulkan label tidak ada hanya dari ekspor frame. | Fakta inspeksi; tidak perlu pertanyaan pengguna. |
| Navbar/footer Figma lama besar | Pakai shell ringkas terbaru, footer ponsel buka-tutup; hanya komposisi isi Checkout mengikuti frame lama. | Keputusan pengguna terbaru mengikat. |
| Figma memakai gambar peta Google, kode existing Leaflet/OSM/Photon | Pertahankan komposisi dan strip alamat, gunakan renderer/adapter existing dan fallback. Jangan mengklaim Google Maps aktif. | Fakta + usulan reuse; provider produksi perlu verifikasi. |
| Figma wilayah tidak menjadi form panjang | Lengkapi dari geocoder; detail hidden hanya jika valid, otomatis terbuka saat gagal/parsial, tersedia tombol detail. | Keputusan pengguna mengikat; kelengkapan geocoder tidak dijamin. |
| Consent/kartu tampak dicentang pada screenshot | **Usulan** persetujuan awal kosong; kartu opt-in. Tidak menganggap state pada screenshot sebagai default bisnis. | Dapat diterapkan sebagai keputusan UX; bukan integrasi yang sudah ada. |
| Copy Figma dan §10.4 terlalu mutlak tentang refund | Gunakan rincian lebih lengkap §10.6–10.7 yang mempertimbangkan penyebab/bukti. Ringkasan di §7 ditandai usulan redaksi. | Redaksi final kebijakan perlu penetapan sebelum rilis; tidak mengubah hak/kebijakan melalui copy UI sendiri. |
| Biaya layanan Gratis, logo, tarif dan ETA contoh | Total baseline subtotal + ongkir, tanpa baris fee baru. Tampilkan vendor/ETA/COD hanya dari kemampuan layanan nyata. | Tidak mengaktifkan fitur berdasarkan gambar. |
| P-01 60 menit vs P-40 per metode | Frontend memakai batas server, tanpa timer praorder. Backend perlu menyelaraskan batas order/attempt/reservasi dan handoff Pembayaran. | Asumsi perlu dikonfirmasi pada kontrak server; menghalangi rilis pembayaran nyata. |
| Kartu `Kepada`, catatan per produk dan batasnya | Pertahankan kebutuhan visual; tetapkan field/penyimpanan/snapshot. UI catatan 200 adalah usulan dari Figma, bukan P-10 baru untuk item. | Asumsi perlu dikonfirmasi sebelum formulir diklaim tersimpan end-to-end. |
| Kartu pesanan vs kartu per buket | Tampilkan yang telah dikonfigurasi, jangan timpa. Tetapkan prioritas, jumlah kartu dan tujuan cetak. | Asumsi perlu dikonfirmasi; memengaruhi buket yang memakai kedua tingkat kartu. |
| Identitas item API memakai productId; beberapa varian/configuration mungkin ada | Butuh kontrak baris stabil, agregasi batas P-05, subset pilihan dan mutasi aman. Usulan produk yang tidak dipilih tetap berada di keranjang; pengeluaran item terkonversi hanya setelah order sukses dipastikan. | Belum rinci di A.7; perlu kontrak backend dan konsistensi Keranjang. |
| Pemilihan alamat tidak menunjukkan tombol komit di Figma | **Usulan** kartu radio + Gunakan Alamat, tanpa memilih otomatis setelah sekadar edit. | Tambahan interaksi yang diperlukan agar efek ongkir jelas. |
| `Tambah` pada e-wallet | **Usulan** pilih penyedia, tanpa fitur mengaitkan akun, saldo atau menyimpan kredensial. | Pengaitan akun tidak ditemukan sebagai kemampuan tersedia. |
| A.7 POST /orders berlabel T-01, bisnis juga mengharuskan T-20 | Kontrak harus membedakan online/COD, hasil dan komit stok secara benar melalui alur bisnis yang ada. | Asumsi teknis perlu diselaraskan; bukan alasan mengubah COD menjadi paid. |
| Quote TTL/revisi dan kemampuan slot tidak didefinisikan rinci | Usulkan konteks quote terversi, waktu server dan validasi akhir. Jangan menetapkan TTL, kuota atau endpoint slot sendiri. | Kontrak integrasi belum lengkap. |
| Header/unique key idempotensi ada; recovery hasil timeout belum rinci | Butuh replay, scope/retensi, pemeriksaan hasil niat dan persistensi aman lintas reload. Tidak mengarang endpoint status atau membuat key baru saat hasil lama belum diketahui. | Wajib diselesaikan sebelum POST order produksi. |
| Simpan alamat timeout/duplikasi | Aturan deduplikasi alamat tidak ditemukan. Periksa buku alamat/hasil request sebelum mengulang create; jangan menyamakan label Rumah dengan identitas unik. | Kontrak recovery CRUD perlu ditetapkan. |
| Pilihan metode produksi, vendor kurir/gateway dan area tepat | Daftar kemampuan aktual menentukan radio, COD, tarif/ETA dan batas reservasi. Target kota pada PRODUCT bukan jaminan layanan. | Belum tersedia bukti integrasi; tidak perlu menebak vendor untuk menyusun UI. |

Bagian yang belum pasti di atas tidak menghalangi penyusunan desain dan UI
pratinjau yang jujur. Integrasi dan klaim transaksi nyata harus menunggu kontrak
yang bersangkutan. Tidak diperlukan pertanyaan tambahan untuk menyelesaikan
spesifikasi tertulis ini; keputusan bisnis/penyimpanan yang belum tersedia
dicatat terbuka untuk ditetapkan sebelum rilis, tanpa mengganti kebutuhan
tersebut dengan perilaku palsu.
