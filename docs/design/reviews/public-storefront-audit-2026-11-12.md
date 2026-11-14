# Audit desain publik dan pelanggan RylVa Green

Tanggal: 12 November 2026 (WIB).

## Lingkup dan dasar pemeriksaan

Pemeriksaan baca saja terhadap halaman `00 Public` pada [Figma RylVa Green](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=0-1). Acuan utama adalah [spesifikasi v2.6](../../specifications/spesifikasi-proyek-v2.6.md), disertai [PRODUCT.md](../../../PRODUCT.md) dan [DESIGN.md](../../../DESIGN.md).

Beranda yang dipakai untuk penilaian adalah frame `Home page rev` (`466:386`). Frame `Landing Page` dan `home page` diperlakukan sebagai alternatif/versi terdahulu untuk keperluan audit ini; pemilik desain belum menetapkan penandaan arsipnya secara eksplisit.

Metode: inventaris struktur halaman, pemeriksaan visual 13 frame, pembacaan teks dan properti terpilih, pemeriksaan aritmetika harga, serta penghitungan kontras dari warna desain. Frame yang dirender: beranda revisi, katalog, detail produk, keranjang, checkout, buket kustom, login, registrasi, OTP, form alamat tahap kedua, keranjang kosong, kontak, dan template notifikasi. Tahap pertama pemilihan titik peta, daftar alamat, serta lupa/reset kata sandi juga diperiksa melalui struktur dan teks.

Hasil ini menilai rancangan yang tersedia. Interaksi prototype belum diuji dengan klik, dan pemeriksaan ini tidak membuktikan perilaku aplikasi, aksesibilitas implementasi, integrasi server, atau kelulusan seluruh flow. Istilah **belum ditemukan** berarti belum ditemukan pada struktur/desain yang ditinjau, bukan kepastian fitur tersebut tidak pernah dibuat di tempat lain. Panel Admin/SuperAdmin berada di luar lingkup audit ini.

## Penilaian keseluruhan

Identitas botani, hierarki beranda, dan susunan awal alur belanja sudah dapat dipertahankan. Desain belum lengkap untuk menjadi acuan implementasi seluruh perjalanan pelanggan. Pekerjaan berikutnya paling bernilai adalah memperbaiki kebenaran informasi, menyelesaikan checkout dan pascatransaksi, lalu melengkapi responsif dan kondisi UI.

## Bagian yang sudah kuat

| Area | Bukti dan nilai yang perlu dipertahankan |
| --- | --- |
| [Beranda revisi](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=466-386) | Palet hijau/krem dan fotografi membentuk identitas yang jelas. Hero memiliki satu CTA yang mudah dikenali. Kategori, promosi, produk, dan footer membentuk urutan penjelajahan yang masuk akal. |
| [Detail produk](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=282-838) | Sudah ada galeri, SKU, nama produk, harga per pot, varian ukuran, jumlah stok, kuantitas, info isi pembelian, cek ongkir, dan panel perawatan. Ini lebih lengkap daripada sekadar foto dan tombol beli. |
| [Keranjang](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=335-251) | Identitas item, varian, jumlah, harga, pemilihan item, dan hapus item sudah terlihat. Ringkasan serta CTA checkout berada dalam kelompok yang mudah dikenali. |
| [Checkout](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=375-108) | Alamat, jadwal, item, kartu ucapan, kurir, pilihan pembayaran, dan ringkasan biaya sudah mendapat tempat. Jumlah contoh checkout benar: Rp364.000 + Rp25.000 = Rp389.000. |
| [Alamat](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=435-130) | Pemilihan titik lokasi dilanjutkan rincian penerima, nomor HP, alamat, label, catatan, dan alamat utama. Pembagian ini mendukung kebutuhan kurir instan. |
| [Keranjang kosong](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=360-372) | Sudah memiliki ilustrasi yang sesuai, penjelasan singkat, dan CTA Mulai Belanja. Kondisi kosong ini sudah dibuat dan tidak perlu dianggap hilang. |
| Autentikasi | Login Google, login lokal, registrasi, OTP enam posisi, serta lupa/reset kata sandi sudah memiliki rancangan awal. Registrasi juga sudah memuat persetujuan syarat dan privasi. |
| [Buket kustom](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=454-1201) | Pemisahan kategori opsi, preview, item terpilih, dan harga total merupakan fondasi interaksi yang baik. Total contoh Rp140.000 + Rp45.000 + Rp25.000 + Rp15.000 = Rp225.000 sudah benar. |

## Temuan yang perlu dibenahi pada desain yang ada

### F-01 — Harga dan diskon tidak konsisten

Prioritas: tinggi. Frame: detail produk, katalog, keranjang, dan beranda.

- Harga Monstera berubah dari Rp350.000 menjadi Rp289.000, tetapi badge menampilkan `-6%`. Selisih Rp61.000 setara sekitar **17,43%** dari harga awal.
- Keranjang menampilkan Rp350.000 dikurangi Rp61.000, tetapi total menjadi **Rp290.000**. Hasilnya seharusnya **Rp289.000** untuk item terpilih pada contoh tersebut.
- Contoh lain juga perlu dicocokkan: Peace Lily Rp130.000 menjadi Rp128.999 dengan badge `-6%`; Lidah Mertua Rp95.000 menjadi Rp79.000 dengan badge `-7%`.

Perbaikan: gunakan satu set data contoh yang konsisten lintas frame dan tetapkan cara pembulatan persentase. Harga, subtotal, jumlah item terpilih, dan diskon harus saling cocok. Rujukan: SEC-07, bagian 6.2/6.4, dan 27.5.

### F-02 — Informasi perawatan Monstera perlu koreksi faktual

Prioritas: tinggi. Frame: [Detail Produk](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=282-838).

- Label `Aman untuk hewan peliharaan` muncul pada produk Monstera deliciosa. [ASPCA mencatat Monstera deliciosa sebagai tanaman toksik bagi anjing dan kucing](https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/swiss-cheese-plant).
- Teks panel penyiraman menyebut tanaman sukulen pada halaman Monstera. Ini menunjukkan isi contoh belum disesuaikan per produk.

Perbaikan: pertahankan panel perawatan, isi dengan informasi yang diverifikasi untuk spesies terkait, dan tampilkan peringatan yang tepat. Rujukan: PRODUCT.md, bagian 6.1 dan 27.5.

### F-03 — Klaim layanan dan kebijakan belum selaras dengan baseline

Prioritas: tinggi. Frame: beranda dan header bersama, checkout, kontak.

- Header menjanjikan `Pengembalian mudah 7 hari`; spesifikasi menetapkan jendela komplain P-11 selama 24 jam sejak Terkirim dan keputusan berdasarkan tahap, jenis barang, penyebab, serta bukti.
- Beranda mencantumkan `Gratis ongkir min. Rp200.000`, `Jaminan Kesegaran Tanaman 100%`, `Garansi Hidup 7 Hari Sejak Pemesanan`, `Konsultasi Seumur Hidup`, dan kemasan yang `dipatenkan`. Dasar operasional/kebijakannya belum tercatat pada konteks produk yang diperiksa.
- `Pengiriman ke Seluruh Indonesia` lebih luas daripada cakupan yang dikonfirmasi dalam PRODUCT.md; ketersediaan area dan layanan tetap bergantung jenis barang serta kurir.
- Checkout memakai ringkasan umum `non-refundable jika sudah dirakit`; perlu tetap menjelaskan penanganan kesalahan toko/kurir sesuai bagian 10.6–10.7.
- Kontak menampilkan Senin–Jumat 08.00–17.00, Sabtu 09.00–15.00, Minggu tutup. Baseline P-09 adalah 08.00–20.00 WIB setiap hari dengan kalender tutup. Jika waktu dukungan berbeda dari operasional toko, bedakan labelnya dan konfirmasikan sumber nilainya.

Perbaikan: selaraskan teks dengan kebijakan yang berlaku. Klaim tambahan memerlukan keputusan dan bukti operasional. Persetujuan checkout perlu memiliki tautan kebijakan dan keadaan awal yang belum dicentang. Rujukan: D-06/D-08/D-09, P-09/P-11, bagian 10.6–10.7, PRODUCT.md.

### F-04 — Label penting checkout terlepas dari frame

Prioritas: tinggi. Frame: [Checkout](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=375-108).

Layer `PILIH JADWAL & SLOT PENGIRIMAN` (`397:232`), `Pilih Tanggal` (`398:237`), `Pilih Slot Pengiriman` (`401:243`), `METODE PENGIRIMAN` (`401:248`), `Metode Pembayaran` (`403:338`), dan `Detail Pembayaran` (`405:401`) memiliki parent halaman `0:1`, bukan frame checkout. Hasil render frame memperlihatkan dropdown jadwal kosong dan beberapa kelompok tanpa judul.

Perbaikan: masukkan label ke wadah field/kelompok terkait, beri contoh keadaan terpilih dan belum terpilih, serta tampilkan label yang tetap ada setelah isian diisi. Lengkapi tanggal tutup/slot penuh, wilayah tak dilayani, kegagalan kurir, dan perubahan harga/stok. Rujukan: bagian 6.4 dan 27.6.

Untuk COD, sediakan contoh terpilih yang menjelaskan bayar saat diterima, label tombol yang sesuai, dan hasil pesanan Siap Diproses dengan pembayaran tetap Menunggu/UNPAID. Ini tidak perlu mengubah struktur utama checkout.

### F-05 — Katalog belum konsisten dan kontrol penelusuran belum lengkap

Prioritas: sedang–tinggi. Frame: [Katalog](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=267-297).

- Kartu Peace Lily jauh lebih kecil daripada kartu lain; ukuran judul yang dibaca sekitar 25,82 px dibanding 36 px pada Monstera/Calathea.
- Badge Tersedia bertabrakan dengan judul Calathea pada render.
- Penerapan badge, satuan jual, ikon favorit, dan letak harga belum seragam.
- Belum terlihat jumlah hasil, pengurutan yang terpasang pada halaman, pagination, filter ketersediaan, maupun atribut kontekstual. Objek `Urutan` (`271:566`) ada di kanvas sebagai objek terpisah, belum menjadi bagian frame katalog.
- Filter aktif berupa Tanaman Hias dan Buket Bunga, tetapi contoh hasil hanya menampilkan tanaman. Beri contoh yang menjelaskan hasil multi-kategori dengan benar.

Perbaikan: buat kartu produk reusable dengan ukuran dan slot konten konsisten; letakkan badge pada area yang tidak menutupi nama. Lengkapi kontrol hasil dan kondisi tanpa hasil/reset filter. Rujukan: bagian 6.1, 27.2, dan 27.6.

### F-06 — Buket kustom masih berupa konsep yang belum menyatu

Prioritas: tinggi. Frame: [1920w light](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=454-1201).

- Merek masih `floret.` / `Floret Custom Bouquet`, bahasa antarmuka Inggris, dan seluruh 49 layer teks yang dibaca memakai Segoe UI. Acuan proyek menggunakan RylVa Green, Bahasa Indonesia, dan Poppins.
- Preview utama serta thumbnail item masih berupa bidang abu-abu.
- Baru ada satu layar kategori bunga; keadaan kategori lain, opsi tidak kompatibel/tidak tersedia, batas pilihan, dan validasi belum ditemukan sebagai desain tersendiri.

Perbaikan: pertahankan pola pemilihan opsi dan ringkasan, satukan merek/bahasa/font, isi preview yang representatif, dan lengkapi tiap tahap serta pesan validasinya. Tunjukkan ringkasan konfigurasi yang nantinya tersimpan di keranjang. Rujukan: bagian 26.1–26.2 dan 27.6.

### F-07 — Autentikasi perlu pelengkapan isi dan validasi

Prioritas: sedang–tinggi. Frame: [Registrasi](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=72-136), [Login](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=428-264), [OTP](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=90-220).

- Registrasi belum memuat nomor telepon yang diwajibkan bagian 6.3.1.
- Login, registrasi, OTP, lupa/reset kata sandi masih berbahasa Inggris.
- OTP memiliki enam kotak kode, tetapi instruksinya menyatakan email berisi tautan. Samakan instruksi dengan mekanisme kode enam digit P-29.
- Belum ditemukan contoh kode salah/kedaluwarsa, batas percobaan, gagal login generik, gagal Google, pembuktian akun lokal sebelum penautan Google, dan hasil reset berhasil.

Perbaikan: tambahkan field dan pesan yang diperlukan tanpa menghilangkan login Google, consent, atau alur pemulihan yang sudah ada. Rujukan: bagian 6.3, P-28–P-31, SEC-05.

### F-08 — Keterbacaan dan pemakaian ulang komponen perlu diperkuat

Prioritas: sedang–tinggi.

- Label registrasi Name/Email Address/Password berukuran 16 px memakai warna `#E3EED4` di atas `#6B9071`. Kontras yang dihitung dari nilai desain adalah sekitar **2,98:1**, di bawah 4,5:1 untuk teks biasa pada [WCAG SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Panel organik login juga memakai kombinasi warna ini.
- Beberapa deskripsi kartu produk beranda memakai 9,32–10 px. Pada halaman yang ditampilkan menyusut dari lebar 1920 px, keterbacaannya makin menurun. Ini temuan ukuran desain, bukan klaim bahwa semua teks di bawah 12 px otomatis melanggar WCAG.
- Form alamat menggunakan teks di dalam field sebagai label pada keadaan kosong. Rancang label yang tetap terlihat setelah pengguna mengetik.
- Pada tujuh frame utama yang dihitung, jumlah instance komponen Figma adalah nol. Komponen ikon/hover memang tersedia di halaman Public, tetapi kartu, header/footer, dan field utama belum terhubung sebagai instance reusable pada sampel layar tersebut.
- Frame utama katalog, detail produk, dan keranjang memakai layout tingkat atas `NONE`; beberapa bagian bertingkat sudah memakai frame. Perbaiki wadah dan auto-layout pada kelompok konten yang perlu merespons panjang teks serta perubahan ukuran.

Perbaikan: kuatkan kontras label, gunakan ukuran teks nyaman, dan buat komponen inti publik dengan keadaan default/focus/selected/disabled/error. Rujukan: NFR-05/NFR-06, bagian 27.6, DESIGN.md.

### F-09 — Halaman kontak dan teks belum konsisten dengan storefront

Prioritas: sedang. Frame: [Contact Page](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=137-311).

Kontak sudah memiliki kanal telepon/email/lokasi, peta, dan form. Header/footer berbeda dari storefront; teks mayoritas Inggris; tombol masih `Submit Button`; CTA `Learn More For Our Blog` tidak menjelaskan fungsi kontak. Samakan shell dan bahasa, gunakan CTA seperti Kirim Pesan, dan lengkapi keadaan terkirim/gagal. Jadwal serta janji respons mengikuti F-03.

Koreksi penamaan lintas layar: `Buket Bungga`, `Buket Kostum`, `Buket Costum`, `Tranding`, `Lidah Mentua`, `Aglaomena`, serta `Galathea`. Gunakan nama produk dan istilah kanonis secara konsisten. Bagian rekomendasi keranjang masih bertuliskan `Tempat rekomendasi produk` dan perlu diisi atau disembunyikan pada rancangan final.

## Bagian yang belum lengkap atau belum ditemukan

### G-01 — Pascacheckout dan akun pelanggan

Belum ditemukan layar pelanggan lengkap untuk:

- Instruksi pembayaran beserta nomor pesanan, metode, nominal, dan batas waktu yang mengikuti metode pembayaran.
- Menunggu, sedang diverifikasi, berhasil, gagal, kedaluwarsa, dan mencoba pembayaran ulang tanpa membuat pesanan ganda.
- Hasil checkout COD yang memisahkan status pesanan dan pembayaran.
- Riwayat pesanan, detail pesanan, timeline pengiriman, bukti pelunasan, dan bukti penerimaan.
- Pembatalan sesuai tahap, pengajuan refund, komplain dengan bukti, serta konfirmasi penerimaan dengan penjelasan konsekuensinya.
- Profil pelanggan dan pengelolaan alamat sebagai bagian akun.

Ada objek teks `Detail Pesanan` di kanvas, tetapi belum berupa halaman detail pelanggan lengkap. Ada pula [Template Nitof](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=336-414) yang memuat toast dan dialog berhasil/gagal. Jadi materi feedback **sudah tersedia**, tetapi belum menjadi flow pembayaran pesanan: teks masih menyebut layanan premium, langganan, dan biaya menambah admin. Adaptasikan komponen ini ke konteks transaksi toko.

Rujukan: bagian 7–10 dan 27.6, prioritas P1.

### G-02 — Kategori, jenis produk lain, dan kondisi UI

- Halaman kategori dengan judul/deskripsi, subkategori, filter relevan, dan daftar hasil belum ditemukan sebagai layar tersendiri. Variasi halaman katalog yang terdokumentasi dapat memenuhi kebutuhan ini; tidak harus membuat struktur UI yang berbeda.
- Contoh detail produk saat ini berfokus pada tanaman. Belum ditemukan rancangan yang menunjukkan perbedaan untuk florist Mudah Layu, pot/media/pupuk/benih, dan paket komponen.
- Belum ditemukan rangkaian kondisi publik lengkap untuk loading, hasil pencarian kosong, produk habis/nonaktif, perubahan harga, stok berkurang, alamat di luar cakupan, slot penuh/tutup, gagal menyimpan, serta gagal membuat pesanan.
- Keranjang kosong sudah ada; toast dan dialog dasar juga sudah ada. Keduanya dapat dikembangkan untuk memenuhi kekurangan tersebut.
- Tujuan tautan kebijakan, FAQ/pusat bantuan, serta status aktivasi wishlist perlu didokumentasikan. Wishlist bersifat kondisional menurut bagian 27.6, bukan kewajiban untuk mengerjakan semua fitur pendukung lebih dahulu.

Rujukan: bagian 6.1/6.4 dan 27.6–27.7.

### G-03 — Responsif publik

Frame utama publik yang diperiksa memiliki lebar desktop sekitar 1258–1920 px. Belum ditemukan rancangan layar utama khusus ponsel atau tablet. Frame berukuran sempit yang ditemukan pada inventaris awal adalah aset ikon, bukan layar belanja mobile.

Rancang sekurangnya katalog, detail produk, keranjang, checkout, autentikasi, dan kustomisasi buket pada ponsel/tablet. Pastikan navigasi, filter, pilihan varian, daftar opsi, ringkasan biaya, dan CTA tetap dapat digunakan tanpa memperkecil seluruh kanvas desktop. Rujukan: NFR-05/NFR-06, bagian 27.6–27.7.

## Urutan pengerjaan yang disarankan

1. Koreksi data harga/diskon, informasi tanaman, dan teks kebijakan/layanan (F-01–F-03).
2. Lengkapi checkout dan flow pembayaran hingga detail/pelacakan pesanan, termasuk COD (F-04, G-01).
3. Satukan komponen katalog, autentikasi, buket kustom, dan kontak (F-05–F-09).
4. Rancang variasi kategori/produk serta kondisi gagal, kosong, perubahan harga, dan perubahan stok (G-02).
5. Turunkan alur yang sama ke ponsel/tablet dan periksa keterbacaan, label, fokus, dan keadaan komponen (G-03, F-08).

Kriteria desain siap diimplementasikan: satu alur pelanggan dari katalog hingga pesanan dapat ditelusuri, angka dan kebijakan saling konsisten, seluruh CTA memiliki tujuan, varian COD/online jelas, kondisi utama tersedia, dan desain inti sudah ditinjau pada desktop/tablet/ponsel.
