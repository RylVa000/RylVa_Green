# Spesifikasi Halaman Pembayaran — RylVa Green

Tanggal pemeriksaan: 12 November 2026. Status: **spesifikasi acuan dengan implementasi UI pratinjau terpisah; belum terhubung ke pembayaran produksi dan tidak mengubah Figma**.

Nama permukaan: Pembayaran / Status Pembayaran dan Hasil Checkout.

**Penanda:** **Fakta** berarti ditemukan dalam sumber; **Usulan** berarti keputusan rancangan yang diajukan; **Belum pasti** berarti kontrak atau bukti implementasinya belum lengkap. Persyaratan dalam spesifikasi utama tidak otomatis berarti fiturnya sudah berjalan.

Sumber pemeriksaan:

- **S1 — sumber bisnis utama:** [spesifikasi-proyek-v2.6.md](D:/rylva-green/docs/specifications/spesifikasi-proyek-v2.6.md), terutama Bagian 7, 8, 11.A, 15, 19, 20, A.7–A.9, 26.5, dan 27.6.
- **S2 — konteks produk:** [PRODUCT.md](D:/rylva-green/PRODUCT.md), terutama pengguna, mobile-first, transaksi, dan batasan implementasi.
- **S3 — identitas visual:** [DESIGN.md](D:/rylva-green/DESIGN.md), terutama token brand, Feedback & Empty State, hasil checkout, dan aksesibilitas; serta [tokens.css](D:/rylva-green/public/assets/css/shared/tokens.css).
- **S4 — desain terkini:** Figma, halaman 00 Public: [Checkout 375:108](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=375-108) dan [Notifikasi 336:414](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=336-414). Struktur diperiksa dan checkout ditinjau sebagai gambar pada tanggal pemeriksaan.
- **S5 — kondisi kode pada analisis awal:** template PHP, controller pelanggan/webhook, adapter gateway dan hitung mundur masih kerangka. UI HTML dan hitung mundur kemudian diimplementasikan sebagai pratinjau frontend; backend pembayaran tetap belum berfungsi. Status implementasi terkini dijelaskan di [cakupan UI Pembayaran](D:/rylva-green/docs/coverage/payment-ui.md).
- **S6 — struktur data:** [DB_RylVa_Green.sql](D:/rylva-green/database/schema/DB_RylVa_Green.sql), terutama pesanan, percobaan_pembayaran_pesanan, peristiwa_pembayaran, dan reservasi_stok_pesanan. Keberadaan SQL tidak membuktikan database telah diimpor atau integrasi telah diuji.

Arahan skill disatukan sesuai fungsi halaman: Impeccable untuk penyelesaian tugas dan pemulihan, UI/UX Pro Max untuk formulir serta umpan balik aksesibel, Taste dan Hallmark untuk hierarki, konsistensi, tepi sejajar, dan kualitas komposisi. Identitas RylVa Green tetap mengikat. Pola hero, fotografi dekoratif, serta animasi halaman pemasaran tidak diterapkan pada transaksi ini. Preferensi Tokopedia/Blibli diterjemahkan sebagai usulan instruksi yang mudah dipindai dan nominal yang jelas, tanpa mengganti brand atau mengklaim kesamaan dengan UI terbaru kedua layanan.

## 1. Pemahaman dan cakupan halaman

**Fakta.** Halaman termasuk area **pelanggan terautentikasi**, bukan halaman publik dan bukan panel rekonsiliasi Admin/SuperAdmin. Checkout memerlukan akun pelanggan terverifikasi. Akun staf terpisah dari akun belanja. Hanya pemilik pesanan yang boleh melihat instruksi dan bukti pelunasannya. [S1, S2]

Tujuannya membantu pelanggan menjawab empat pertanyaan: pesanan mana yang dibuat, berapa dan bagaimana harus membayar, apakah dana sudah diverifikasi, dan apa tindakan berikutnya. Halaman mendukung pembelian florist, buket kustom, tanaman, serta gardening goods tanpa mengubah snapshot pesanan.

**Usulan cakupan:** satu halaman setelah checkout dengan beberapa kondisi, bukan checkout kedua atau layar sukses statis. Pembayaran online menampilkan instruksi selama masih berlaku; hasil terverifikasi menggantikannya pada halaman yang sama. COD langsung menampilkan hasil pemesanan dengan kewajiban bayar saat diterima. Kunjungan dari riwayat pesanan memakai halaman yang sama.

| Termasuk halaman ini | Diteruskan ke bagian terkait |
| --- | --- |
| Instruksi dan status pembayaran, tenggat server, nominal, hasil COD, ringkasan pesanan, percobaan ulang yang sah, akses bukti pelunasan | Penyuntingan barang/alamat/jadwal sebelum order: checkout; pemenuhan, pelacakan, pembatalan pascabayar, keputusan penanganan, komplain dan pengajuan refund: detail pesanan/alur terkait |
| Penjelasan singkat dana ditinjau, terlambat, refund, dan sengketa | Verifikasi uang COD, rekonsiliasi, persetujuan refund, koreksi status: panel staf sesuai kewenangan |

**Fakta kondisi saat ini.** Figma checkout sudah memiliki identitas hijau–sage–krem, Poppins, panel berbingkai, ringkasan biaya, dan pilihan metode. Belum ditemukan frame lengkap untuk halaman pembayaran pascacheckout. Teks “Detail Pesanan” di halaman Public belum membuktikan tersedianya layar detail. Template pembayaran dan layanan yang diperiksa masih placeholder. Pola dapat digunakan kembali; fungsi dan pustaka komponennya belum boleh dianggap tersedia. [S4, S5]

Cakupan perangkat mengikuti ketentuan **mobile-first, tablet, dan desktop**, meskipun contoh checkout Figma yang diperiksa berupa desktop. Dalam prioritas proyek, halaman ini termasuk **P1** pada Bagian 27.6; kata “wajib” di daftar pekerjaan dokumen ini berarti wajib sebelum halaman Pembayaran dirilis.

## 2. Struktur dan isi halaman

**Usulan susunan atas ke bawah:**

| Urutan | Isi | Ketentuan |
| --- | --- | --- |
| 1 | Header dan navigasi storefront yang sudah disepakati | Gunakan pola logo, pencarian, akun, keranjang, dan kategori dari shell saat ini; jangan merombak desain global. |
| 2 | Lokasi halaman dan judul “Pembayaran” | Tautan kembali utama “Detail Pesanan”; nomor pesanan terlihat. Breadcrumb tidak menjadikan checkout pesanan lama sebagai formulir yang masih bisa diedit. |
| 3 | Ringkasan status utama | Judul sesuai kondisi, satu kalimat penjelasan, label “Status pesanan” dan “Status pembayaran” terpisah, serta waktu pembaruan terakhir. Tidak perlu progress bar yang menyamakan pembayaran dengan pengiriman. |
| 4 | Jumlah dan tenggat | “Total pembayaran” atau “Bayar saat pesanan diterima” untuk COD; nomor pesanan dapat disalin. Online aktif menampilkan tanggal/jam WIB dan hitung mundur dari server. |
| 5 | Panel instruksi atau hasil | QRIS, VA/transfer, e-wallet, COD, berhasil, atau penanganan sesuai data. Hanya instruksi percobaan aktif yang dapat digunakan untuk membayar. |
| 6 | Tindakan kontekstual | Satu tindakan utama sesuai kondisi; tindakan salin, perbarui status, bantuan, metode lain, dan pembatalan tampil sebagai pendukung jika diizinkan server. |
| 7 | Ringkasan pesanan | Item snapshot, varian/satuan, kuantitas, konfigurasi buket secara ringkas, subtotal, ongkir, total; tanggal/slot dan kurir sebagai konteks. Detail alamat serta kartu ucapan tersedia melalui detail pesanan. |
| 8 | Riwayat pembayaran ringkas | Percobaan aktif terlihat langsung; percobaan lama dalam bagian yang dapat dibuka, menampilkan metode, waktu, dan hasil. Nomor bayar lama tidak diberi aksi bayar/salin. |
| 9 | Bantuan dan footer | Bantuan memakai kanal yang benar-benar tersedia. Gunakan footer yang sudah ada; jangan menciptakan nomor kontak, jam dukungan, atau janji respons. |

Desktop menggunakan dua kolom: instruksi/status lebih lebar di kiri, ringkasan di kanan. Area status, total, dan instruksi harus terlihat sebelum rincian barang yang panjang. Mobile memakai satu kolom: status → total/tenggat → instruksi → tindakan → ringkasan. Jangan membuat pelanggan menggulir daftar barang panjang sebelum mengetahui cara membayar.

**Isi panel per metode:**

| Metode/kondisi | Isi wajib | Batasan |
| --- | --- | --- |
| QRIS | QR asli penyedia, identitas merchant jika tersedia, nominal, tenggat, langkah pembayaran | QR tidak digambar sendiri, diberi dekorasi, atau dipakai ulang setelah kedaluwarsa. Tombol unduh/impor hanya jika didukung penyedia. |
| Virtual Account / transfer bank | Nama bank/penyedia, nama penerima bila tersedia, nomor/kode bayar, nominal dan tombol salin terpisah, tenggat, langkah | Hanya kanal yang diaktifkan server. Tidak membuat rekening toko atau digit kode unik. |
| E-wallet | Penyedia terpilih, nominal, petunjuk, tenggat, tautan aplikasi/halaman pembayaran jika disediakan gateway | Tautan harus tervalidasi. Kembali dari aplikasi belum berarti berhasil. |
| COD belum dibayar | “Pesanan COD berhasil dibuat”, “Pembayaran: Menunggu”, jumlah yang ditagih saat diterima, konteks pengiriman, “Lihat Detail Pesanan” | Tidak ada QR, rekening bayar online, hitung mundur pembayaran, atau bukti pelunasan. |
| Berhasil terverifikasi | “Pembayaran berhasil”, jumlah terverifikasi, metode, waktu bayar, status pesanan, akses bukti pelunasan | Teks pesanan tetap mengikuti status aktual; PH-01 tidak boleh ditulis “sedang diproses normal”. |
| Ditinjau / refund / sengketa | Fakta dana yang diketahui, status, alasan ramah pelanggan, tindakan berikutnya dan tautan detail | Jangan membuka catatan internal, payload gateway, atau meminta bayar ulang. |

Total baseline adalah **subtotal produk setelah diskon yang sah + ongkir**. Baris “Biaya Layanan Gratis” di mockup bukan bukti adanya komponen biaya layanan dalam aturan/skema. Jangan menambah biaya, voucher, atau metode kartu hanya karena muncul dalam desain atau enum. BCA dan DANA pada Figma adalah contoh visual; vendor dan kanal aktif belum terbukti. [S1, S4, S6]

## 3. Alur penggunaan

### Titik masuk

- Hasil checkout yang telah menghasilkan satu pesanan valid.
- Riwayat/detail pesanan milik pelanggan.
- Tautan pemberitahuan yang sah; autentikasi tetap diperiksa.
- Kembali dari gateway/aplikasi pembayaran.

**Usulan URL HTML:** /pesanan/{nomorPesanan}/pembayaran. Ini belum merupakan rute yang diimplementasikan. Nomor pesanan bukan pengganti pemeriksaan kepemilikan. Redirect setelah login hanya menuju tujuan internal yang diizinkan.

### Alur utama online

1. Checkout divalidasi server, snapshot dan reservasi dibuat atomik, lalu percobaan pembayaran dibuat sesuai kontrak gateway.
2. Halaman mengambil pesanan dan percobaan aktif yang sama. Membuka, memuat ulang, atau kembali ke URL tidak membuat order maupun transaksi baru.
3. Pelanggan mengikuti instruksi atau membuka penyedia pembayaran. Ringkasan tidak dapat diedit di halaman ini.
4. Saat kembali, tampilkan status server. Jika belum terverifikasi, tetap “Menunggu”; penjelasan menyatakan bahwa konfirmasi belum diterima, bukan bahwa transaksi pasti gagal.
5. Server memverifikasi sumber, nominal, mata uang, dan identitas transaksi; konfirmasi idempoten mengomit stok yang sah sekali.
6. Halaman memperbarui status. Jika normal: pembayaran Berhasil dan pesanan Siap Diproses. Jika pengecualian: tampilkan status dana dan penanganannya secara terpisah.
7. Pelanggan membuka detail pesanan atau bukti pelunasan yang tersedia.

### Alur COD

Checkout COD tervalidasi → order Siap Diproses dan stok dikomit → halaman konfirmasi COD → pelanggan mengikuti pemenuhan melalui detail pesanan → pembayaran menjadi Berhasil hanya setelah penerimaan uang dikonfirmasi melalui proses yang dapat diaudit. Tidak ada tindakan pelanggan “Tandai Lunas”. [S1: T-20, AC-41, AC-45]

### Alur alternatif dan kembali

| Situasi | Alur dan hasil |
| --- | --- |
| Gateway gagal membuat instruksi | Pertahankan pesanan/reservasi menurut server. Jika hasil panggilan belum pasti, cari transaksi lewat idempotensi sebelum menawarkan pembuatan baru. Tampilkan coba lagi hanya bila aman. |
| Percobaan gagal atau dibatalkan di penyedia | Pesanan dapat tetap aktif. Jika diizinkan, pelanggan mencoba lagi atau memilih metode lain; bukan membuat order baru. |
| Ganti metode | Buka pemilih kanal aktif → tunjukkan metode dan tenggat hasil server → server menyelesaikan percobaan lama sesuai kemampuan gateway → tampilkan satu instruksi aktif. Tidak menjanjikan penambahan waktu. |
| Hitung mundur nol | Ganti area tenggat menjadi “Memeriksa status pembayaran”. Ambil status terbaru; server memeriksa gateway sebelum menetapkan kedaluwarsa/pembatalan. |
| Pesanan benar-benar kedaluwarsa | Hentikan instruksi bayar lama. “Lihat Detail Pesanan” dan kembali berbelanja; order baru harus melewati validasi checkout baru. Jangan menghidupkan order lama dari browser. |
| Pelanggan membatalkan online sebelum bayar | Konfirmasi eksplisit → server menutup transaksi gateway dan menjalankan pembatalan yang sah → tampilkan hasil aktual. Jika status belum pasti, tampilkan pemeriksaan tanpa mengklaim pembatalan berhasil. |
| Pembayaran masuk setelah order ditutup | Berhasil pada dimensi pembayaran; PH-02 pada pesanan. Tidak meminta pembayaran kedua; arahkan ke informasi penanganan/refund. |
| Sesi habis | Minta login; setelah login dan otorisasi berhasil kembali ke order yang sama. Tidak mengulangi checkout. |
| Tombol browser kembali / beberapa tab | Muat ulang status otoritatif saat halaman aktif kembali. Tidak mengirim ulang POST checkout atau memakai QR yang telah diganti. |

Pembatalan setelah bayar dan COD diarahkan ke alur pembatalan pada detail pesanan menurut tahap aktual. Jangan memakai aturan pembatalan online belum bayar untuk COD yang sudah Siap Diproses.

## 4. Komponen dan interaksi

**Fakta reuse:** token CSS dan pola visual checkout tersedia. Namun components.css, checkout_layout.php dan payment_status.php yang diperiksa belum menyediakan komponen pembayaran fungsional. “Gunakan kembali” di sini berarti menggunakan token, shell, dan anatomi desain; ekstraksi komponen bersama dilakukan saat implementasi jika belum tersedia. Jangan mengimpor sidebar operasional ke halaman pelanggan. [S3–S5]

| Komponen | Rencana penggunaan / perilaku |
| --- | --- |
| Shell storefront, breadcrumb, tombol pill | Ikuti desain yang ada, status aktif terbaca, tautan navigasi berbeda dari tombol aksi. |
| Panel berbingkai dan baris ringkasan biaya | Gunakan pola checkout, tepi sejajar, harga rata kanan, nama/label rata kiri. |
| Badge status | Dua label utama selalu jelas. Ikon jam, centang, peringatan atau silang melengkapi teks; tidak menggantikan teks. |
| Panel instruksi pembayaran | Komponen baru per jenis instruksi, satu sumber data percobaan aktif. Petunjuk metode dapat berupa accordion dengan kontrol keyboard yang benar. |
| Nominal / nomor pesanan / nomor bayar + Salin | Salin nilai yang tepat, bukan teks berformat tambahan. Konfirmasi “Nomor pembayaran disalin”; saat clipboard gagal tampilkan teks yang bisa dipilih dan cara menyalin manual. |
| Hitung mundur | Komponen baru, hanya online dan berdasarkan waktu server. Tetap menampilkan tanggal/jam WIB. Tidak mereset ketika reload. |
| “Perbarui Status” | Mengambil snapshot status dari server; tidak mengonfirmasi dana dan tidak membuat percobaan. Loading hanya pada kontrol/area relevan; cegah klik berulang selama permintaan berjalan. |
| “Buka Aplikasi Pembayaran” / tautan penyedia | Hanya jika URL sah tersedia dan instruksi masih aktif. Beri penjelasan bila membuka aplikasi/tab lain. |
| “Coba Pembayaran Lagi” / “Ganti Metode” | Hanya muncul menurut kemampuan yang dikembalikan server; tidak aktif saat hasil transaksi lama belum pasti, limit habis, order tutup, atau sudah ada dana yang perlu ditangani. |
| Dialog konfirmasi pembatalan | Sebut nomor pesanan dan dampak, tombol “Kembali” serta “Batalkan Pesanan”. Fokus terkelola dan kembali ke pemicu setelah tutup. |
| Hasil transaksi dan pesan pemulihan | Panel yang tetap terlihat, bukan toast satu-satunya. Pola ikon/notifikasi Figma dapat dirujuk; copy langganan premium pada template notifikasi harus diganti untuk halaman ini. |
| Bukti pelunasan | Tautan ke dokumen yang diotorisasi. Tampilkan “Bukti pelunasan belum tersedia” bila syarat belum terpenuhi; jangan menawarkan file kosong. |
| Ringkasan item dan riwayat percobaan | Snapshot ringkas; item/configuration panjang dapat dibuka. Tidak menghilangkan jumlah, satuan, atau nilai penting saat mobile. |

Saat data belum sinkron, jangan tampilkan tombol bayar baru atau hasil optimistis. Ketidakaktifan tombol yang perlu dipahami harus disertai alasan, misalnya “Status pembayaran sebelumnya sedang diperiksa”. Batasi satu tindakan utama per kondisi; COD/berhasil mengutamakan detail pesanan, gagal yang masih dapat dicoba mengutamakan percobaan ulang.

## 5. Status dan penanda penting

**Fakta.** Status pesanan, pembayaran tingkat pesanan, percobaan pembayaran, pengiriman, dan refund adalah dimensi berbeda. Percobaan lama yang gagal tidak boleh menimpa pembayaran lain yang telah berhasil. Status pengiriman/produksi bukan syarat untuk mengklaim uang telah diterima. [S1: Bagian 7–8]

| Status pembayaran tingkat pesanan | Pemicu dan dampak | Tampilan dan tindakan |
| --- | --- | --- |
| Menunggu | Belum ada pembayaran sukses; COD dapat sudah Siap Diproses | Ikon jam + label. Online: instruksi aktif bila ada. COD: instruksi bayar saat diterima. |
| Berhasil | Verifikasi online sah atau penerimaan uang COD yang diaudit | Centang + “Pembayaran berhasil”; nominal, metode, waktu. Bukti pelunasan sesuai ketersediaan; tetap tampilkan status pesanan aktual. |
| Gagal | Percobaan terakhir gagal dan tidak ada percobaan aktif | Silang + penjelasan. Coba lagi hanya selama order aktif dan server mengizinkan. |
| Kedaluwarsa | Server memastikan batas berakhir tanpa sukses setelah pemeriksaan yang diwajibkan | Ikon waktu + label. Hapus aksi bayar; arahkan detail/berbelanja. |
| Dibatalkan | Order dibatalkan sebelum pembayaran sukses | Label dan alasan aman untuk pelanggan; tidak menampilkan instruksi aktif. |
| Perlu Ditinjau | Dana tidak cocok; PH-03 | Peringatan + “Pembayaran perlu ditinjau”. Jelaskan dana sedang diperiksa; tidak meminta melengkapi kekurangan melalui transfer baru. |
| Refund Diproses | Refund Disetujui/Diproses | Label refund, nominal yang diproses, pembaruan terakhir. Jangan menulis dana telah kembali. |
| Dikembalikan Sebagian | Pengembalian sebagian terkonfirmasi | Jumlah yang benar-benar kembali dan rincian refund, terpisah dari total pesanan. |
| Dikembalikan Penuh | Seluruh pengembalian yang relevan terkonfirmasi | Konfirmasi jumlah aktual. Riwayat pembayaran tetap ada. |
| Sengketa | Chargeback terbuka | Peringatan, penjelasan singkat dan bantuan. Tidak ada aksi refund atau perubahan nominal selama sengketa. |

Status percobaan yang harus dipetakan: **Dibuat, Menunggu, Berhasil, Gagal, Kedaluwarsa, Dibatalkan, Perlu Ditinjau**. “Memuat”, “Memeriksa status”, “Koneksi terputus”, dan “Membuat instruksi” adalah **kondisi UI**, bukan enum bisnis baru.

Pengecualian yang wajib dibedakan:

- **PH-01:** dana berhasil diterima, stok bermasalah. Tulis “Pembayaran diterima. Pesanan memerlukan penanganan”; pemenuhan tidak berjalan otomatis, dan pelanggan tidak perlu membayar ulang.
- **PH-02:** pembayaran terverifikasi setelah order ditutup. Pemulihan membutuhkan pemeriksaan/keputusan yang sah. Jika sebelumnya dibatalkan pelanggan, refund penuh dibuat otomatis sesuai Bagian 7.5; jangan menjanjikan pemulihan otomatis.
- **PH-03:** nominal, mata uang, atau referensi tidak cocok. Tidak dipenuhi sebelum rekonsiliasi sah. Jangan menyediakan fitur “tambah kekurangan” yang tidak ada di baseline.
- **Pembayaran ganda:** transaksi pertama diproses normal, transaksi kedua dibuat refund penuh otomatis; tampilkan riwayat dua transaksi dan status refund yang benar. Bukan dua order atau komit stok kedua.
- **Kelebihan pembayaran:** pesanan diproses berdasarkan totalnya dan selisih dibuat refund; dana lebih tidak menjadi saldo belanja.

**Usulan visual:** gunakan resep semantik S3 dengan delapan token brand yang ada: ikon, judul, label, dan bentuk pembeda. Hijau positif setelah uji kontras; peringatan dan error tetap eksplisit dengan ikon/teks/batas. Jangan mengimpor warna merah promosi sebagai token error global atau membuat status hanya berbeda warna.

## 6. Tindakan dan dampaknya

Seluruh perilaku UI di bawah adalah **usulan**, sedangkan perubahan bisnis harus mengikuti S1. Kemampuan tindakan harus diberikan dan diperiksa ulang oleh server; menyembunyikan tombol bukan kontrol otorisasi.

| Tindakan | Syarat / ketersediaan | Konfirmasi dan dampak | Umpan balik, pemulihan, pencegahan ganda |
| --- | --- | --- | --- |
| Salin nomor / nominal | Data valid telah dimuat; nomor bayar hanya dari percobaan aktif | Tidak perlu dialog; tidak mengubah data transaksi | Pesan spesifik setelah salin; kegagalan clipboard menyediakan salin manual. |
| Buka penyedia pembayaran | Online, percobaan masih aktif, URL tervalidasi tersedia | Jelaskan perpindahan aplikasi/tab; tidak mengubah status menjadi Berhasil | Saat kembali ambil status server. Jangan otomatis membuat percobaan baru jika aplikasi gagal dibuka. |
| Perbarui status | Order milik pelanggan, sesi valid; dibatasi selama request berlangsung | Tidak perlu konfirmasi; hanya membaca snapshot server | Indikator lokal dan waktu pembaruan data; status belum berubah tetap dijelaskan. Tidak mengklaim gateway baru diperiksa bila hanya membaca database. |
| Coba pembayaran lagi | Order online aktif, hasil sebelumnya pasti, belum lunas, limit tersedia, diizinkan server | Buat percobaan baru melalui mutasi sah; tampilkan metode dan tenggat sebelum konfirmasi bila berubah | Loading pada aksi, tahan klik ganda, gunakan idempotensi usulan. Timeout diselesaikan dengan lookup hasil, bukan langsung mengirim transaksi kedua. |
| Ganti metode | Sama seperti retry; kanal pengganti aktif; percobaan lama dapat diselesaikan dengan aman | Pemilih metode → ringkasan pilihan → konfirmasi. Transaksi lama tidak lagi menjadi instruksi yang dapat dibayar; tenggat hasil server ditampilkan | Jika penutupan transaksi lama belum pasti, tahan tindakan dan periksa. Pilihan lokal dipertahankan saat error sepanjang masih valid; tidak memperpanjang waktu sendiri. |
| Batalkan online sebelum bayar | Status dan kemampuan pembatalan masih sah saat submit | Dialog eksplisit; server menutup transaksi gateway lalu menjalankan pembatalan | Tidak ada optimisme “Dibatalkan” sebelum hasil pasti. Pembatalan final tidak memiliki undo di browser; pembayaran terlambat ditangani PH-02. |
| Lihat detail pesanan | Data dan kepemilikan valid | Navigasi, tanpa mutasi | Bawa identitas order; detail dimulai dari ringkasan. Kembali ke pembayaran membaca status terbaru. |
| Lihat bukti pelunasan | Dokumen pembayaran sah tersedia untuk pemilik | Tidak mengubah status; server mengotorisasi dokumen | Bila dokumen gagal dimuat, coba ulang dokumen tanpa mengulangi pembayaran. Jika pembayarannya sah tetapi file belum siap, pertahankan hasil pembayaran. |
| Hubungi bantuan | Kanal bantuan telah diverifikasi tersedia | Navigasi melalui kanal yang disediakan; sertakan nomor order seperlunya | Jangan mengirim rahasia/kode bayar otomatis ke pihak lain. Bila belum ada kanal aktif, tautkan halaman Kontak yang tersedia dan jelaskan kebutuhannya. |
| Kembali / tutup pemilih / tinggalkan halaman | Selalu dapat meninggalkan tampilan, kecuali pengelolaan fokus dialog | Menutup pemilih membuang pilihan yang belum dikonfirmasi; tidak membatalkan order atau transaksi gateway | Tidak perlu peringatan perubahan belum disimpan pada halaman baca. Selama hasil mutasi belum pasti, jelaskan bahwa proses mungkin tetap berjalan; saat kembali cari hasilnya. |

Tidak ada tindakan pelanggan untuk mengubah nominal, memaksa lunas, menyetujui refund, mengomit stok, atau memulihkan order terminal. Tindakan ini berada pada layanan sistem atau panel staf yang berwenang.

## 7. Aturan bisnis, validasi, dan hak akses

1. **Identitas dan hak akses.** Server memeriksa sesi dan kepemilikan pada halaman, status, pembuatan percobaan, pembatalan, dan dokumen. Objek milik pelanggan lain dijawab 404 tanpa membocorkan data. Staf tidak memperoleh akses belanja dengan sesi staf.
2. **Kebenaran pembayaran.** Return URL, parameter browser, tombol perbarui, hitung mundur, gambar bukti transfer, dan perubahan localStorage tidak dapat membuat pembayaran Berhasil. Online harus diverifikasi server dari sumber sah; COD membutuhkan bukti/proses penerimaan uang yang dapat diaudit.
3. **Nominal dan snapshot.** Gunakan bilangan bulat IDR dari server; total tidak dihitung ulang dari harga katalog terbaru atau input browser. Nilai item, varian, dan konfigurasi buket mengikuti snapshot. Penyesuaian yang sah melalui alur substitusi/penanganan harus memiliki persetujuan dan jejaknya; halaman ini tidak menyuntingnya. Kasus penyesuaian tagihan COD perlu kontrak yang diselaraskan dengan baseline, bukan perhitungan baru di frontend.
4. **Percobaan pembayaran.** Maksimum P-03 awal **5 per order** dan RL-10 awal **10 per jam per akun**. Server menghitung serta menegakkan batas; frontend menampilkan tindakan yang diizinkan dan Retry-After jika menerima 429. Sisa percobaan hanya ditampilkan bila dikembalikan server.
5. **Metode.** Daftar pilihan berasal dari kanal aktif dan kelayakan order. Metode yang sudah dibayar, order terminal, sengketa, peninjauan dana, atau status lama yang belum pasti tidak dapat diganti lewat kontrol biasa. Kebijakan penggantian metode harus menutup/mengamankan percobaan lama dan menyelaraskan reservasi tanpa menjanjikan perpanjangan.
6. **Tenggat.** P-40 memberi awal QRIS/e-wallet 10 menit, transfer bank 15 menit, VA mengikuti gateway; angka ini bukan timer hardcoded. P-01 masih menyebut 60 menit, P-02 toleransi 5 menit. Kontrak backend harus menyelaraskannya dan mengirim batas efektif. UI tidak menambahkan toleransi sendiri atau menganggap stok lepas saat angka nol.
7. **Reservasi dan stok.** Keranjang tidak mereservasi. Checkout online mereservasi atomik; pembayaran sah mengomit sekali. COD mengomit saat checkout tervalidasi. Kegagalan membuat instruksi tidak otomatis menghapus/memperpanjang reservasi. Status gateway tidak pasti tidak boleh menyebabkan pelepasan buta.
8. **Idempotensi dan konflik.** Header Idempotency-Key wajib pada POST order menurut baseline. **Usulan tambahan:** kunci idempotensi untuk pembuatan percobaan/pembatalan yang rentan dikirim ulang. Setelah timeout, cari hasil operasi sebelumnya sebelum mengulang. Gunakan versi/state server; pada 409 muat ulang fakta dan minta pelanggan meninjau tindakan yang masih sah.
9. **Pembatalan.** Periksa ulang state saat submit. Online belum dibayar harus menutup transaksi gateway; hasil tak pasti ditangani melalui rekonsiliasi. COD dan order pascabayar mengikuti aturan tahapnya pada detail pesanan. Jangan menerbitkan refund COD yang dananya belum diterima.
10. **Bukti pelunasan.** Hanya setelah dana terverifikasi; berisi nomor pesanan, waktu bayar, metode, nominal dan rincian item. Ini **bukti pelunasan, bukan faktur pajak**. **Usulan:** hak melihat bukti diturunkan dari riwayat pembayaran sah, bukan hanya status agregat terakhir, sehingga bukti historis tetap dapat diakses setelah refund dengan konteks refund terpisah.
11. **Form yang benar-benar ada.** Halaman utama tidak memerlukan input rekening, kartu, OTP atau unggah bukti. Pemilih metode wajib memilih satu kanal sah. Jika alur pembatalan memerlukan alasan menurut kontrak, validasi teks/opsinya di server dan tampilkan error spesifik; jangan menambah kolom wajib tanpa aturan.
12. **Keamanan.** GET bersifat baca; mutasi memakai endpoint berwenang dan CSRF sesuai aturan. Escape teks snapshot; jangan mengekspos secret, tanda tangan, payload mentah gateway, detail audit internal, atau data kartu. Respons privat no-store. URL aplikasi/QR/aset dari penyedia divalidasi; kode bayar tidak dimasukkan ke log analitik atau query URL sembarang.

**Transisi yang berdampak pada halaman:** T-01 menampilkan order online Menunggu Pembayaran; T-20 menampilkan COD Siap Diproses/bayar Menunggu; T-02 mengubah hasil online menjadi Berhasil/Siap Diproses; T-03 menampilkan pengecualian PH-01/PH-03; T-04/T-05 menutup instruksi setelah keputusan server; T-18 menampilkan dana terlambat/PH-02. Retry bukan transisi langsung pesanan menjadi Berhasil. Keputusan pemulihan T-15 dan refund T-17 ditampilkan sebagai hasil server, bukan diaktifkan oleh pelanggan di halaman ini. Perubahan di luar tabel transisi formal ditolak backend dan dicatat sesuai aturan.

## 8. Seluruh state yang relevan

Matriks ini adalah **usulan perilaku UI** yang menurunkan kondisi bisnis S1. **Wajib** berarti harus ditangani sebelum halaman dirilis; **Lanjutan** berarti peningkatan yang tidak menghambat jalur dasar. Data yang dipertahankan di bawah berarti selama konteks sesi yang sah; bukan menyimpan instruksi/PII ke penyimpanan browser permanen. Setelah logout, ganti akun, atau akses ditolak, jangan biarkan data privat lama tetap terlihat.

### 8.1 Halaman, akses, dan pemuatan

| Area atau komponen | Nama state | Pemicu | Isi tampilan atau pesan | Tindakan yang tersedia | Data atau input yang dipertahankan | Jalur pemulihan | Prioritas pengerjaan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Halaman | Normal online | Order sah dan instruksi aktif tersedia | Status terpisah, total, tenggat, instruksi, ringkasan | Salin, buka penyedia jika ada, perbarui, aksi sah | Snapshot dan percobaan aktif | Jalur bayar normal | Wajib |
| Halaman | Loading awal | Status belum diterima | Skeleton struktur dan “Memuat pembayaran…”; tidak ada QR/angka rekaan | Navigasi kembali | Identitas tujuan internal | Render setelah data valid | Wajib |
| Halaman | Gagal memuat | Respons gagal sebelum ada data | “Pembayaran belum dapat dimuat” | Coba lagi, kembali | Identitas tujuan; jangan tampilkan data order lain | Ulangi GET yang sama | Wajib |
| Status | Memperbarui sebagian | Polling/klik perbarui berjalan | Status terakhir tetap terlihat, indikator lokal | Navigasi; perbarui ditahan sementara | Snapshot terakhir dengan penanda waktu | Ganti snapshot secara utuh setelah sukses | Wajib |
| Halaman | Offline / data lama | Jaringan putus atau kembali dari tab lama | “Koneksi terputus. Status terakhir diperbarui …” | Coba sambungkan/perbarui, kembali; jangan buat percobaan baru | Snapshot terbatas selama sesi, diberi label belum terbaru | Sinkronkan saat online/aktif lagi sebelum mutasi | Wajib |
| Halaman | Layanan bermasalah | API 5xx/gateway tidak tersedia | Jelaskan bagian yang terganggu; jangan menyimpulkan dana gagal | Perbarui nanti, detail, bantuan | Order dan operasi terakhir yang diketahui | Backoff; baca hasil operasi lama sebelum retry mutasi | Wajib |
| Halaman | Maintenance | Respons pemeliharaan terjadwal/tidak tersedia | Pemberitahuan sesuai respons, tanpa waktu pulih rekaan | Coba lagi atau kembali | Tujuan order; data privat tidak dicache permanen | Buka kembali order yang sama setelah layanan pulih | Wajib |
| Akses | Belum login / sesi habis | Tidak ada sesi atau 401 | Minta masuk untuk melihat transaksi | Masuk, kembali | Tujuan internal yang diizinkan; tidak menampilkan QR/PII | Login lalu periksa kepemilikan lagi | Wajib |
| Akses | Akun tidak memenuhi syarat | Server mensyaratkan verifikasi/status akun untuk tindakan | Penjelasan aman sesuai kode respons | Verifikasi akun bila tersedia, kembali, bantuan | Tujuan order yang aman | Ikuti alur akun; jangan menambah OTP pembayaran baru | Wajib |
| Akses | Ditolak / bukan pemilik | Peran tidak sesuai atau objek bukan milik | Pesan akses aman; objek orang lain tampil seperti tidak ditemukan | Kembali ke akun/pesanan sendiri | Tidak ada data transaksi yang ditolak | Autentikasi akun yang benar | Wajib |
| Halaman | Tidak ditemukan / tidak tersedia | Nomor salah, objek tidak ada, tautan tidak sah | “Pesanan tidak ditemukan atau tidak dapat diakses” | Riwayat pesanan, beranda | Tidak ada data privat | Pilih order yang sah | Wajib |
| Halaman | Order lama/diarsipkan | Server mengembalikan riwayat yang tetap boleh dibaca | Status final dan riwayat, read-only; bukan error kosong | Detail, bukti sah, bantuan | Snapshot historis yang diotorisasi | Tidak membuka ulang transaksi lama | Wajib |

### 8.2 Instruksi, kontrol, dan formulir kontekstual

| Area atau komponen | Nama state | Pemicu | Isi tampilan atau pesan | Tindakan yang tersedia | Data atau input yang dipertahankan | Jalur pemulihan | Prioritas pengerjaan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Instruksi | Belum ada percobaan | Order dibuat tetapi belum ada instruksi | “Instruksi pembayaran belum tersedia”; bedakan belum dibuat dan gagal | Buat/coba lagi hanya jika server mengizinkan, perbarui | Order dan tenggat yang sah | Endpoint pembuatan percobaan yang aman | Wajib |
| Instruksi | Membuat transaksi | Permintaan pembuatan sedang berjalan | “Menyiapkan instruksi pembayaran…” | Kembali; tahan submit lain | Pilihan metode dan identitas operasi | Tunggu hasil atau lookup jika timeout | Wajib |
| Instruksi | Timeout / hasil belum pasti | Koneksi hilang setelah mutasi dikirim | “Hasil permintaan sedang diperiksa. Jangan membayar ulang dahulu.” | Perbarui status, bantuan | Order, metode, kunci operasi | Cari transaksi yang sama; jangan langsung membuat baru | Wajib |
| Metode | Tidak ada kanal tersedia | Daftar kanal aktif kosong atau semua tidak layak | Jelaskan metode sedang tidak tersedia, tanpa daftar palsu | Perbarui, detail, bantuan; batal jika sah | Order dan reservasi menurut server | Cek layanan/kanal lagi tanpa memperpanjang otomatis | Wajib |
| Instruksi | Data sebagian / tidak valid | Nominal, QR, nomor bayar atau tenggat penting hilang/tidak cocok | Pesan instruksi belum lengkap; jangan tampilkan pembayaran yang meragukan | Perbarui, detail, bantuan | Ringkasan pesanan yang telah valid | Backend melengkapi/merekonsiliasi; tahan aksi bayar | Wajib |
| Ringkasan | Data pendukung kosong | Foto/metadata opsional tidak ada | Hilangkan bidang opsional atau gunakan label aman; nominal tidak diganti nol | Lihat detail | Field valid lain | Muat ulang bagian jika diperlukan | Wajib |
| QR | Gambar gagal dimuat | Aset QR rusak/tidak dapat diambil | “Kode QR belum dapat dimuat”; nominal dan tenggat tetap jelas | Muat ulang QR; jalur penyedia lain hanya bila tersedia | Percobaan dan nominal yang sama | Ambil aset transaksi yang sama, bukan buat transaksi baru | Wajib |
| Foto / logo metode | Aset gagal | Thumbnail/logo tidak tersedia | Placeholder teridentifikasi + nama produk/metode | Alur pembayaran tetap berjalan jika data utama valid | Nama, satuan, jumlah dan harga | Aset pulih terpisah | Wajib |
| Salin | Berhasil / gagal | Clipboard resolve/reject | “Nomor pembayaran disalin” atau petunjuk salin manual | Salin ulang / pilih teks | Nilai asli yang sama | Clipboard atau manual | Wajib |
| Kontrol | Hover / fokus / pressed | Pointer atau keyboard | Umpan balik jelas tanpa menggeser layout; fokus terlihat | Aktifkan dengan keyboard | Tidak berubah | Fokus tetap terbaca | Wajib |
| Pemilih / accordion | Selected / expanded / collapsed | Memilih kanal atau membuka petunjuk/riwayat | Label pilihan dan status buka/tutup aksesibel | Pilih kanal sah, buka/tutup, kembali | Pilihan lokal sampai ditutup/dikonfirmasi | Tidak ada mutasi sebelum konfirmasi | Wajib |
| Tindakan | Disabled / disembunyikan | Tidak diizinkan, sedang mengirim, atau hasil lama belum pasti | Alasan untuk aksi yang perlu dijelaskan; aksi tak relevan disembunyikan | Navigasi dan bantuan yang masih sah | Snapshot terakhir | Sinkronkan; aktifkan hanya atas izin server | Wajib |
| Pemilih / konfirmasi | Validasi bidang | Kanal belum dipilih atau sudah dinonaktifkan | Error pada bidang; ringkasan error bila submit gagal | Perbaiki, pilih ulang, kembali | Input lain yang masih valid | Fokus error submit; muat daftar kanal sah | Wajib |
| Pemilih / dialog | Ditinggalkan sebelum submit | Pelanggan menutup atau kembali | Tidak ada peringatan simpan pada halaman baca; pilihan belum dikirim boleh dibuang | Tutup/kembali | Order dan transaksi aktif tidak berubah | Buka pemilih lagi | Wajib |
| Percobaan | Gagal pasti | Penyedia/server mengonfirmasi gagal | Alasan ramah pelanggan; status order tetap aktual | Retry/ganti metode bila sah | Riwayat, order dan tenggat server | Buat percobaan berikutnya tanpa order baru | Wajib |
| Percobaan | Limit order habis | P-03 tercapai | “Batas percobaan pembayaran untuk pesanan ini tercapai” | Detail, bantuan; batal jika sah | Riwayat dan order | Tidak menawarkan retry tanpa izin server | Wajib |
| Permintaan | Pembatasan sementara | HTTP 429 / RL-10 | Jelaskan kapan boleh mencoba menurut Retry-After | Tunggu, kembali, bantuan | Pilihan lokal dan order | Aktifkan sesudah batas server, bukan timer buatan kebijakan | Wajib |

### 8.3 Hasil, pengecualian, dan konflik

| Area atau komponen | Nama state | Pemicu | Isi tampilan atau pesan | Tindakan yang tersedia | Data atau input yang dipertahankan | Jalur pemulihan | Prioritas pengerjaan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Online | Menunggu konfirmasi | Pelanggan kembali dari penyedia; belum terverifikasi | “Konfirmasi pembayaran belum diterima”; bukan kegagalan pasti | Perbarui, detail, bantuan | Percobaan aktif; tidak membuat duplikat | Webhook/pemeriksaan server memperbarui hasil | Wajib |
| Tenggat | Nol / pemeriksaan tertunda | Deadline tampilan terlewati | “Memeriksa status pembayaran”; instruksi yang kedaluwarsa tidak dapat dipakai | Perbarui, detail | Order dan referensi lama sebagai riwayat | Server cek gateway dan putuskan; bukan pembatalan browser | Wajib |
| Online | Berhasil normal | Pembayaran sah dan komit stok valid | “Pembayaran berhasil”; pesanan Siap Diproses sesuai data | Detail, bukti pelunasan | Snapshot, waktu dan nominal terverifikasi | Alur pemenuhan | Wajib |
| COD | Order terkonfirmasi, belum lunas | T-20 selesai | “Pesanan COD berhasil dibuat”; pembayaran Menunggu; bayar saat diterima | Detail, bantuan | Tagihan COD sah dan konteks kirim | Konfirmasi uang oleh kurir/Admin kelak | Wajib |
| COD | Lunas | Penerimaan uang diaudit | Pembayaran Berhasil; waktu/nominal aktual | Detail, bukti pelunasan | Riwayat penerimaan yang boleh ditampilkan | Alur pesanan normal | Wajib |
| Online | Kedaluwarsa / dibatalkan | Keputusan server final tanpa sukses | Status, alasan dan nomor order; tidak ada QR aktif | Detail, kembali berbelanja | Snapshot historis | Checkout baru tervalidasi jika ingin pesan ulang | Wajib |
| Penanganan | Dana berhasil, PH-01 | Dana sah, masalah stok | “Pembayaran diterima. Pesanan memerlukan penanganan” | Detail penanganan, bantuan, bukti jika sah | Dana dan order | Resolusi staf/persetujuan pelanggan di alur terkait | Wajib |
| Penanganan | Pembayaran terlambat, PH-02 | Dana masuk setelah order ditutup | Dana diterima; pemulihan/refund mengikuti pemeriksaan | Detail, bantuan | Pembayaran dan alasan order ditutup | Resolusi sesuai 7.5; tanpa bayar ulang | Wajib |
| Penanganan | Perlu Ditinjau, PH-03 | Nilai/mata uang/referensi tidak cocok | Jelaskan sedang ditinjau; jumlah terverifikasi hanya jika aman/tersedia | Detail, bantuan | Fakta transaksi; jangan mengklaim lunas | Rekonsiliasi/refund sah, tanpa fitur tambah kekurangan | Wajib |
| Pembayaran / refund | Ganda / kelebihan | Transaksi kedua sukses atau jumlah lebih | Riwayat penerimaan dan refund terkait; satu pesanan | Detail refund, bantuan | Setiap referensi transaksi dan refund | Sistem mengembalikan duplikat/selisih, komit sekali | Wajib |
| Refund | Diproses / sebagian / penuh | Status dan nominal refund berubah | Bedakan diproses dengan dana sudah kembali | Detail, bantuan | Bukti historis dan rincian refund | Pantau hasil aktual; jangan menawarkan bayar ulang | Wajib |
| Refund | Gagal / penanganan manual | Refund ditolak penyedia/retry habis | Dana belum diklaim kembali; status tindak lanjut sesuai server | Detail, bantuan | Pembayaran sah dan refund yang gagal | Retry sistem/penanganan staf menurut P-20 | Wajib |
| Sengketa | Terbuka | Chargeback dari penyedia | Status Sengketa dan penjelasan aman | Detail, bantuan | Riwayat sah yang boleh dilihat | Penanganan staf; tidak ada perubahan nominal/refund | Wajib |
| Hasil / dokumen | Sebagian berhasil | Pembayaran sah tetapi email/dokumen belum siap atau gagal dimuat | Status dana tetap Berhasil; kendala dokumen dinyatakan terpisah | Muat ulang dokumen, detail, bantuan | Bukti verifikasi pembayaran | Retry dokumen/outbox; tidak bayar ulang | Wajib |
| Pembatalan | Mengirim / gagal / belum pasti | Permintaan batal diproses atau respons hilang | Jelaskan proses dan hasil yang diketahui | Perbarui, kembali, bantuan; tahan submit ganda | Identitas operasi dan order | Periksa hasil server sebelum mengulang | Wajib |
| Data / aksi | Konflik versi atau state | Tab lain membayar, kanal berubah, atau 409 | “Status pesanan berubah. Tinjau informasi terbaru.” | Muat status, tinjau ulang tindakan | Input lokal yang masih valid; snapshot lama diberi penanda | Ganti dengan state server; jangan meneruskan aksi yang tidak sah | Wajib |
| Mutasi | CSRF tidak valid | Token kedaluwarsa/tidak cocok | Form perlu diperbarui; jangan mengklaim transaksi gagal di penyedia | Muat ulang sesi/form, kembali | Order dan pilihan sah dalam konteks aman | Token sah baru, verifikasi hasil operasi sebelum retry | Wajib |
| Status | Nilai tidak dikenal / kombinasi tidak sah | Kontrak data tidak dikenali atau tidak konsisten | “Status belum dapat ditampilkan”; jangan memetakan ke Berhasil | Perbarui, detail aman, bantuan | Hanya data valid | Alarm/rekonsiliasi backend; tidak membuka aksi finansial | Wajib |

**State yang tidak diterapkan pada halaman ini:** pencarian hasil pembayaran, filter transaksi, pagination, dan memuat halaman berikutnya belum memiliki kebutuhan pada sumber. Header pencarian tetap mengikuti perilaku global; tidak menyaring order ini. Riwayat percobaan dibatasi P-03 sehingga tidak membutuhkan pagination baru. Belum memiliki order ditangani oleh riwayat pesanan, sedangkan URL pembayaran tanpa order sah memakai state tidak ditemukan. Order yang dibatalkan bukan data yang dihapus. Jangan menambahkan hapus permanen transaksi sebagai aksi pelanggan.

## 9. UX dan aksesibilitas

**Usulan yang mengikuti S3 dan WCAG 2.1 AA proyek:**

- **Hierarki:** status dan tindakan berikutnya → nominal/tenggat → instruksi → ringkasan. Judul status tidak terlalu besar sehingga QR/tindakan terdorong jauh di bawah. Isi body awal 16 px, label pendukung 14 px; nilai bayar lebih menonjol, bukan seluruh paragraf bold.
- **Identitas:** Poppins 400/500/600/700, hijau gelap #0F2A1D, primary #375534, sage dan krem #FBF7F4 sesuai token. Permukaan datar, garis tipis, radius panel/input dan tombol pill mengikuti pola checkout. Tidak menambah hero, promo silang, ilustrasi besar, atau animasi perayaan yang mengganggu pembayaran.
- **Jarak:** gunakan token spacing incumbent. Awal panel 16–24 px dan jarak kontrol yang memadai, disesuaikan saat render; ikon dan label tidak bersentuhan, teks status panjang boleh membungkus. Harga, judul, dan panel mengikuti tepi dalam yang sama.
- **Responsif:** desktop dua kolom, tablet/ponsel satu kolom bila ruang tidak cukup; breakpoint awal usulan sekitar 1024 px harus diuji terhadap konten. Gunakan container shell yang berlaku; token kode saat ini 1440 px, sementara contoh batas 1200 px dalam DESIGN bersifat usulan. Jangan menetapkan dua lebar global baru sekaligus. Periksa lebar 320, 390, 768, 1024, 1440 dan 1920 px tanpa luapan halaman.
- **Konten panjang:** nomor bayar dapat membungkus tanpa memotong digit; tombol salin tetap terpisah. Nama produk/opsi buket panjang membungkus, jumlah dan harga tetap jelas. Riwayat/petunjuk dapat dilipat dengan judul berlabel. Instruksi inti, nominal, dan tenggat tidak disembunyikan dalam accordion.
- **Keyboard:** urutan DOM mengikuti urutan baca. Semua tombol dan accordion dapat dioperasikan keyboard; fokus terlihat, tidak hilang karena polling. Dialog menjebak fokus hanya selama terbuka, Escape untuk tutup bila tidak sedang melakukan keputusan yang memerlukan penanganan khusus, dan fokus kembali ke pemicu. Jika pemicu sudah hilang karena status berubah, fokus ke judul hasil yang relevan.
- **Label:** tombol salin membedakan “Salin nomor pembayaran”, “Salin nominal”, dan “Salin nomor pesanan”. Label form permanen, bantuan terkait secara programatis, error spesifik. Jangan menggunakan placeholder atau logo bank sebagai label tunggal.
- **Pembaca layar:** perubahan status penting diumumkan melalui live region yang tenang dan utuh. Jangan mengumumkan hitung mundur setiap detik atau memindahkan fokus karena pembaruan otomatis. Setelah submit form gagal, fokus ke ringkasan error dengan tautan ke bidang; jangan memindahkan fokus saat sekadar blur. Sukses clipboard memakai pesan status singkat.
- **Kontras dan target:** teks normal minimal 4,5:1, teks besar 3:1, indikator kontrol/fokus minimal 3:1; uji kombinasi aktual. Target interaktif minimal 44 × 44 px. Teks sekunder tidak otomatis aman hanya karena berasal dari token.
- **QR dan perangkat yang sama:** berikan nama gambar yang menerangkan fungsi QR dan petunjuk tekstual metode. QR mempertahankan proporsi dan ruang kosong penyedia. Untuk pembayaran dari ponsel yang sama, tawarkan jalur aplikasi/unduh hanya jika penyedia mendukung; jangan menjanjikan semua e-wallet dapat mengimpor QR.
- **Gerak dan pembaruan:** gunakan transisi fungsional singkat sesuai token, hormati reduced motion, tanpa loading minimum buatan. Indikator loading tidak menutup ringkasan yang sudah valid.

**Kembali ke daftar:** jika masuk dari riwayat pesanan, tautan kembali harus mempertahankan pencarian/filter, halaman, dan posisi gulir riwayat sejauh konteks aman tersedia; halaman Pembayaran tidak mereset daftar. Ini usulan kontrak navigasi lintas halaman, bukan bukti bahwa daftar tersebut sudah diimplementasikan. Membuka detail baru mulai dari ringkasan atas. Kembali dari aplikasi pembayaran menjaga konteks halaman tetapi menyegarkan status.

## 10. Data, keamanan, dan kebutuhan sistem

### Data minimum dan asalnya

Nama camelCase di bawah adalah **usulan kontrak frontend**, bukan kolom SQL baru atau endpoint yang sudah tersedia.

| Kelompok | Data minimum | Sumber / ketergantungan |
| --- | --- | --- |
| Identitas dan status order | orderId internal, orderNo publik, orderStatus, paymentStatus, isCod, version, alasan pelanggan yang aman | pesanan; ownership dari sesi server, bukan parameter akun dari klien |
| Nilai dan snapshot | subtotalAmount, shippingAmount, totalAmount, currency, items beserta varian/satuan/konfigurasi snapshot | pesanan, item pesanan, konfigurasi buket pesanan; integer IDR |
| Konteks kirim | deliveryDate, deliverySlot, courierName/service jika ada | Snapshot dan layanan terpilih; bukan tarif/jadwal yang dihitung ulang frontend |
| Percobaan | attemptId, attemptNumber, method/channel, attemptStatus, amount, verifiedPaidAmount bila ada, paidAt, expiresAt | percobaan_pembayaran_pesanan; satu order memiliki banyak percobaan |
| Instruksi | paymentCode, qrImage atau data terstruktur yang aman, paymentUrl, langkah, nama penyedia/merchant jika ada | Adapter gateway; hanya subset yang dibutuhkan pelanggan, bukan instruksi JSON mentah tanpa validasi |
| Waktu dan kemampuan | serverNow, effectivePaymentDeadlineAt, snapshotAt, lastGatewayCheckAt bila tersedia, allowedActions, retryAfter bila relevan | **Usulan read model server**; tenggat menyelaraskan order, attempt, reservasi dan kebijakan gateway |
| Refund dan penerimaan | Daftar refund dengan alasan aman, jumlah diminta/diproses/berhasil, referensi transaksi terkait | Entitas refund dan transaksi terverifikasi; jangan menyamakan jumlah disetujui dengan dana sudah kembali |
| Dokumen dan bantuan | receiptAvailable, receiptUrl sah, nomor bukti, kanal bantuan aktif | Order/riwayat pembayaran dan otorisasi dokumen; bukan URL publik permanen yang melewati izin |

Relasi penting: pelanggan → banyak pesanan; pesanan → item snapshot, percobaan, reservasi, refund dan riwayat; peristiwa gateway → referensi transaksi/percobaan. Keberhasilan transaksi, pelepasan/komit reservasi, ledger, perubahan order dan outbox harus konsisten serta idempoten. Dua transaksi sukses berbeda dipertahankan sebagai fakta terpisah, bukan digabungkan menjadi satu pembayaran palsu.

Format: rupiah bilangan bulat tanpa desimal, tampilan misalnya **Rp389.000** sebagai ilustrasi format, bukan tagihan default. Tanggal/waktu tampil WIB dengan nama bulan yang mudah dibaca; data tersimpan UTC. Tenggat memiliki waktu absolut dan hitung mundur; tanggal kirim tidak ditulis sebagai jaminan jam tiba. Nomor pesanan mengikuti format RV-YYMMDD-XXXXXX, tetap dianggap identitas publik yang membutuhkan otorisasi.

### API dan integrasi

**Fakta kontrak baseline S1 A.7, belum bukti implementasi:** basis /api/v1; GET /orders/:id dan /orders/:id/receipt; POST /orders/:id/payments; POST /orders/:id/cancel; POST /webhooks/payment dengan verifikasi penyedia. POST /orders memerlukan Idempotency-Key. Tidak ditemukan endpoint GET khusus status pembayaran dalam daftar tersebut.

**Usulan:** perluas respons GET detail order dengan read model pembayaran atau tetapkan endpoint baca khusus melalui keputusan teknis. Jangan mempresentasikan URL status baru sebagai API yang sudah tersedia. Tombol Perbarui Status membaca kontrak ini. Jika kelak perlu pemeriksaan gateway manual dari pelanggan, tentukan kontrak server terpisah dan rate limit; jangan menyelundupkan mutasi ke GET.

**Fakta pekerjaan server:** cadangan polling gateway untuk pending tiap 5 menit; pemeriksaan expiry order/reservasi tiap menit dengan verifikasi gateway sebelum melepas; rekonsiliasi harian pukul 02.00 WIB. Ini berbeda dari interval pembaruan UI. [S1 A.8]

**Usulan frontend:** polling snapshot sekitar 10–15 detik saat tab terlihat dan status relevan, dengan backoff pada gangguan/429; interval final mengikuti kapasitas layanan. Hentikan/jeda saat tab tersembunyi, lanjutkan dengan GET saat kembali aktif, dan kurangi polling pada status terminal. Polling browser tidak memanggil gateway langsung atau memperpanjang reservasi. Status refund/penanganan tetap dapat dimuat ulang meski instruksi bayar sudah tidak aktif.

**Pembagian kerja:** PHP native/PDO mengurus autentikasi, otorisasi, transaksi InnoDB, state machine, guard, reservasi, adapter gateway, signature, rekonsiliasi, outbox, dan audit. Template/JS mengurus presentasi, salin, accordion, dialog, hitung mundur dari server, pemuatan state, dan navigasi. Frontend tidak menjadi sumber saldo, stok, status atau kebijakan.

**Fakta kondisi implementasi:** payment_status.php, order_receipt.php, checkout_layout.php, CustomerPaymentController, PaymentWebhookController, PaymentConfirmationAlgorithm, adapter gateway, dan payment-countdown.js yang diperiksa belum berisi alur operasional. Belum ditemukan bukti vendor terpilih, kredensial sandbox, transaksi nyata, webhook terverifikasi, atau tes pembayaran yang berjalan. Prototipe staf memakai simulasi lokal; pola visualnya dapat dipelajari tetapi hasil simulasinya bukan bukti dana/otorisasi.

### Perlindungan dan audit

- Rahasia gateway, raw webhook/header/signature, catatan rekonsiliasi internal, dan bukti setor COD staf tidak dikirim ke halaman pelanggan.
- Batasi alamat/PII pada konteks yang perlu; dokumen dan aset privat tetap melewati otorisasi. Tidak menyimpan instruksi sensitif dalam cache publik atau penyimpanan browser permanen.
- Semua mutasi diverifikasi di server, CSRF sesuai baseline; webhook memakai autentikasi penyedia, bukan sesi pelanggan. Escape nama produk, catatan, alamat, dan pesan kartu; prepared statements dan validasi allowlist di backend.
- Catat kejadian bisnis, percobaan, pembatalan dan keputusan manual sesuai audit. Jangan menjadikan setiap klik salin sebagai kejadian finansial. Log teknis memakai identitas request yang aman dan tidak memuat secret.
- Webhook berulang menghasilkan efek satu kali; respons sukses dikirim setelah transaksi database commit. Lock/version mencegah perubahan yang saling menimpa; outbox menangani pengiriman bukti/email tanpa mengubah fakta pembayaran menjadi gagal jika notifikasi terlambat.

## 11. Daftar pekerjaan dan kriteria selesai

### Pekerjaan dan urutan ketergantungan

| Prioritas | Pekerjaan | Ketergantungan / hasil yang dapat ditinjau |
| --- | --- | --- |
| Wajib sebelum implementasi bisnis final | Selaraskan P-01/P-40/P-02, matriks COD, pergantian metode, dan kontrak read model/aksi | Keputusan tercatat di spesifikasi/ADR; backend dan UI memakai aturan sama |
| Wajib | Turunkan shell, panel, tombol, badge, format nilai, serta ringkasan dari desain incumbent | Inventaris membedakan pola Figma, token yang nyata, dan komponen kode yang belum dibuat |
| Wajib | Rancang halaman online pending per instruksi kanal aktif dan hasil COD | Layout desktop/tablet/mobile tanpa merombak checkout atau halaman lain |
| Wajib | Buat panel hasil verified, gagal, kedaluwarsa, dibatalkan, PH-01/02/03, refund dan sengketa | Seluruh status yang dapat dikembalikan kontrak memiliki pemetaan aman |
| Wajib | Buat salin, perbarui status, timer server, riwayat percobaan, pemilih metode, dan dialog batal yang diizinkan | State interaksi, timeout, limit, konflik dan pemulihan pada Bagian 8 |
| Wajib | Hubungkan backend, adapter mock/sandbox, webhook, transaksi stok, cron dan outbox | Kepemilikan, verifikasi dan idempotensi tidak digantikan simulasi frontend |
| Wajib | Sediakan akses bukti pelunasan dan tautan detail/bantuan yang sah | Dokumen tidak tersedia sebelum verifikasi; kegagalan dokumen tidak mengubah dana |
| Wajib | Verifikasi aksesibilitas, data panjang, semua state wajib, alur lintas halaman, dan rendering responsif | Saat implementasi diminta: bukti render dan skenario uji yang relevan, bukan hanya checklist tertulis |
| Lanjutan | Sinkronisasi tampilan antartab melalui sinyal lokal tanpa menyimpan instruksi sensitif | GET otoritatif saat tab aktif kembali tetap wajib sebagai jalur dasar |
| Opsional | Unduh QR atau deep link tambahan | Hanya jika dukungan vendor, keamanan aset, dan perilaku aplikasi terbukti; bukan penghambat kontrak dasar |

Urutan pelaksanaan setelah diminta implementasi: keputusan kontrak → komponen/state → koneksi mock yang jelas → integrasi sandbox → pengujian state dan rendering → koreksi → verifikasi bisnis menyeluruh. Kelengkapan visual tidak menggantikan validasi backend.

### Kriteria penerimaan yang dapat diperiksa

| ID | Skenario | Hasil yang harus dapat diamati |
| --- | --- | --- |
| PAY-01 | Checkout online valid lalu halaman dibuka, reload, kembali, dan dibuka di tab lain | Satu order; tidak otomatis membuat percobaan baru, timer tidak reset, snapshot sama. |
| PAY-02 | Checkout COD valid | Order Siap Diproses, pembayaran Menunggu; tagihan dan tindakan berikutnya jelas; tanpa QR/timer/bukti lunas. AC-41/45. |
| PAY-03 | Online sukses sah dengan reservasi/stok valid | Pembayaran Berhasil, order Siap Diproses; stok/ledger komit sekali; bukti pelunasan tersedia sesuai hasil server. AC-14/45. |
| PAY-04 | Return URL menyebut sukses tetapi belum ada verifikasi; webhook palsu | Tidak menjadi Berhasil; bukti pelunasan tidak dibuka; verifikasi sah berikutnya memperbarui hasil. AC-15/16. |
| PAY-05 | Clock browser diubah, halaman disegarkan, countdown nol, gateway lambat | UI tidak menentukan expiry/pelepasan stok; waktu server dipakai dan state pemeriksaan tampil. AC-43; AC-20 diselaraskan terhadap konflik waktu. |
| PAY-06 | Percobaan gagal, kemudian retry/ganti metode; klik berulang dan timeout | Tidak ada order baru/duplikasi transaksi akibat retry; percobaan lama aman; tenggat hasil server; kegagalan pembuatan tidak melepaskan reservasi sembarang. |
| PAY-07 | Batas P-03, RL-10, kanal tidak aktif, CSRF invalid atau 409 | Tindakan ditolak aman oleh server; penjelasan dan langkah pemulihan jelas; pilihan yang masih valid dipertahankan. |
| PAY-08 | Bayar sukses tetapi stok kurang; dana tidak cocok; pembayaran terlambat | PH-01/02/03 dipetakan berbeda; tidak ada pemenuhan/repay otomatis yang salah; tindakan sesuai server. AC-19/21/23. |
| PAY-09 | Webhook sama berulang dan dua transaksi sukses berbeda | Efek order/ledger satu kali; transaksi kedua tercatat dan dibuat refund; UI tidak menunjukkan dua order. AC-17/22/45. |
| PAY-10 | Kelebihan dana, refund diproses/gagal/sebagian/penuh dan sengketa | Nilai penerimaan/refund/status tidak dicampur; “dana kembali” hanya setelah terkonfirmasi; sengketa tidak membuka aksi terlarang. |
| PAY-11 | Batal sebelum bayar bersamaan dengan konfirmasi pembayaran | Hasil mengikuti transaksi server; transaksi aktif ditutup sesuai aturan; late payment ditangani PH-02, tanpa klaim final optimistis. AC-30. |
| PAY-12 | Pemilik lain, nomor acak, tanpa sesi, sesi habis, akun staf | Tidak ada kebocoran QR, data order, atau dokumen; 404 untuk objek milik orang lain; login kembali tidak membuat order. AC-37/57. |
| PAY-13 | Bukti/email gagal setelah pembayaran sah | Status dana tetap benar; dokumen dapat dicoba ulang tanpa membayar lagi; pesan email hanya menyatakan terkirim jika ada fakta pengiriman. |
| PAY-14 | Gagal GET, offline, timeout mutasi, maintenance, data tidak lengkap, QR gagal | Tiap state menawarkan langkah berikutnya; snapshot valid tidak diganti angka nol/status rekaan; setelah pulih mengambil order yang sama. |
| PAY-15 | Keyboard, pembaca layar, reduced motion, zoom 200%, layar 320–1920 px dan data panjang | Tidak ada luapan halaman/aksi tertutup, fokus terkelola, target dan kontras memenuhi syarat; countdown tidak diumumkan setiap detik. |
| PAY-16 | Masuk dari riwayat dengan filter/halaman/scroll lalu kembali; berpindah ke aplikasi gateway | Konteks daftar dipulihkan jika tersedia; detail baru mulai dari ringkasan; status pembayaran disinkronkan saat kembali. |
| PAY-17 | Katalog berubah setelah order dibuat, termasuk buket kustom | Harga/konfigurasi mengikuti snapshot; tidak ada penyuntingan diam-diam; perubahan sah hanya melalui alur persetujuan yang tercatat. AC-13. |
| PAY-18 | Status tak dikenal atau kombinasi order/payment tidak sah | Tidak dianggap sukses atau mengaktifkan pembayaran; error aman dan pemeriksaan backend tersedia. |

Definisi selesai implementasi kelak: kriteria di atas lulus sesuai kontrak yang disepakati, seluruh state Wajib memiliki tampilan dan jalur pemulihan, tidak ada perubahan desain di luar lingkup, serta hasil render benar-benar diperiksa pada perangkat dalam cakupan. Dokumen ini sendiri belum mengklaim kelulusan tes atau kesiapan produksi.

## 12. Asumsi dan keputusan yang belum pasti

| Temuan / konflik | Fakta sumber dan dampak | Arah sementara / keputusan yang dibutuhkan |
| --- | --- | --- |
| Makna nama “Pembayaran” | Tidak ada frame pascacheckout lengkap; Bagian 27.6 menyebut status pembayaran dan hasil checkout | **Usulan:** cakupan pascacheckout pada dokumen ini. Tidak mendesain ulang pemilihan metode di checkout yang sudah disukai. |
| P-01 vs P-40 vs P-02 | 60 menit umum berbeda dengan 10/15 menit dan masa VA; AC-12/20/40 serta reminder N-04 15 menit masih memakai asumsi lama | **Keputusan wajib sebelum final kontrak:** satu aturan batas efektif order/attempt/reservasi, toleransi serta reminder. UI selalu menerima deadline server, bukan memilih angka sendiri. |
| BR-03/05/07 lama vs reservasi/COD | Sebagian redaksi lama mengaitkan stok hanya dengan bayar; Bagian 11.A, T-20 dan adendum 26.5 mengatur reservasi online dan komit COD | Gunakan aturan khusus yang lebih eksplisit sebagai dasar rancangan; rapikan konflik dokumen sebelum implementasi final. Tidak menampilkan “lunas” saat COD dikomit. |
| Matriks 8.8 belum lengkap untuk COD | Baris COD Menunggu hanya eksplisit untuk Siap Diproses, sedangkan T-07 dan alur COD mengizinkan persiapan sebelum uang diterima | **Keputusan wajib:** lengkapi matriks kombinasi formal di backend untuk seluruh tahap COD yang sah; UI jangan mengubah pembayaran menjadi Berhasil untuk lolos matriks. |
| Vendor dan kanal produksi | Figma menampilkan QRIS/VA/e-wallet/COD; enum SQL lebih luas; belum ada bukti vendor/sandbox aktif | **Belum pasti:** vendor, bank/e-wallet aktif, deep link, aset QR, biaya dan kemampuan cancel/refund. Layout bersifat data-driven; tidak mengunci BCA/DANA atau mengaktifkan kartu. |
| Pergantian metode dan reservasi | Retry/metode lain diperbolehkan saat order aktif, tetapi detail penggantian transaksi dan pengaruh batas waktunya belum lengkap | **Keputusan teknis wajib:** prosedur penutupan/lookup percobaan lama, satu instruksi aktif, kunci idempotensi dan deadline baru bila memang diizinkan. Tidak memberi perpanjangan gratis. |
| Rute dan read model | Endpoint baseline tercatat; implementasi routing/controller masih placeholder; endpoint khusus status belum ditetapkan | **Usulan:** respons order diperluas atau endpoint baca baru melalui keputusan teknis; route HTML dan field frontend dalam dokumen bukan fakta implementasi. |
| Representasi COD dalam SQL | Kolom transaksi gateway dan expiry percobaan bersifat wajib, tetapi bisnis COD tidak membuat transaksi gateway online | **Keputusan data:** tentukan apakah COD tidak punya attempt online atau menggunakan referensi internal yang jelas; migrasikan bila perlu. Jangan membuat rekening/tenggat online palsu untuk memenuhi NOT NULL. |
| Refund dan jumlah tagihan COD | Penamaan/comment agregat refund dapat mencampur disetujui dengan berhasil; prototipe staf juga sudah memiliki simulasi penyesuaian COD | **Keputusan kontrak:** pisahkan jumlah benar-benar dikembalikan dan sedang diproses; sahkan pemetaan penyesuaian COD/persetujuan terhadap baseline. Frontend tidak menghitung kebijakan dari simulasi. |
| Bukti historis setelah refund | S1 menetapkan bukti setelah verifikasi; aturan akses sepanjang siklus refund belum dirinci | **Usulan perlu disahkan:** bukti penerimaan historis tetap tersedia, refund ditampilkan terpisah. Jangan memeriksa status agregat Berhasil saja. |
| SLA penanganan PH-02 | 7.5, 8.5 dan cron mengacu P-16 untuk PH-02, tetapi daftar kode pada baris parameter P-16 tidak mencantumkannya | **Keputusan konsistensi:** selaraskan register; tampilkan tenggat penanganan hanya bila diberikan server. Tidak membuat janji respons baru. |
| Respons error validasi | A.7 menyebut 400 untuk validasi, sementara AC-57 memakai 422 untuk nilai di luar batas | **Keputusan kontrak:** seragamkan pemetaan kode; UI membaca kode bisnis/detail yang sah dan menangani kedua respons tanpa kehilangan input. |
| Ukuran layout dan status komponen | DESIGN memuat ukuran usulan, token kode memiliki container 1440 px; markup storefront dan komponen bersama belum lengkap | Ikuti shell incumbent dan buktikan ukuran saat implementasi/render. Jangan menganggap pengukuran Figma desktop langsung sesuai mobile atau komponen telah berfungsi. |
| PRODUCT vs bukti visual terbaru | PRODUCT memuat catatan bahwa visual belum ditetapkan pada saat init; DESIGN dan Figma kini menyediakan identitas yang lebih baru | Identitas visual mengikuti DESIGN/Figma terkini; PRODUCT tetap sumber konteks, bukan alasan mengganti brand. |
| Kontak, dokumen, dan halaman terkait | Pola Kontak tersedia di Figma; kanal operasional dan halaman pelanggan terkait belum terbukti terhubung | Jangan mengarang chat/nomor/jam bantuan; tautan produksi memerlukan tujuan valid. Ukuran/format dokumen dan pengiriman email perlu diverifikasi saat integrasi. |

Ketidakpastian di atas tidak menghalangi spesifikasi struktur, state, dan UX ini. Keputusan tenggat, vendor, matriks COD, serta kontrak pergantian metode menentukan integrasi final dan harus diselesaikan sebelum perilaku pembayaran diproduksikan. Tidak diperlukan pengulangan pertanyaan tentang preferensi visual yang sudah disepakati.

## Direction contract

**Mode / build path:** Operate / code-led. Ini kelanjutan permukaan checkout yang telah ditentukan, bukan pergantian identitas atau halaman dengan konsep terbuka.

**THESIS:** pelanggan melihat apa yang harus dibayar dan hasil yang benar; konfirmasi pesanan tidak menyamar sebagai pelunasan.

**OWN-WORLD:** isi pembayaran memakai Poppins, token hijau–sage–krem incumbent, permukaan datar berbingkai, tombol pill, label status berikon. Navbar dan footer mengikuti Figma asli menurut koreksi pengguna 13 November 2026; rincian serta pengecualian font footer ada pada [acuan shell](D:/rylva-green/docs/design/surfaces/storefront-shell.md). Halaman lain tidak diubah.

**STORY:** pelanggan mengenali order dan nominal, mengikuti instruksi, lalu membaca hasil verifikasi atau langkah pemulihan. COD, penanganan dan refund tetap memiliki makna masing-masing.

**FIRST VIEWPORT:** judul dan status order di atas, nominal/deadline/instruksi pada kolom kiri yang lebih lebar, ringkasan barang di kanan. Mobile satu kolom dengan instruksi mendahului ringkasan. Aksi pembaruan mengikuti instruksi; hasil verified/COD mengutamakan detail pesanan.

**FORM:** seed: none (pinned). Instruksi eksekusi pengguna: “Gunakan spesifikasi terbaru yang sudah disepakati sebagai cakupan pengerjaan.” Bentuk yang dirujuk pada Bagian 2: “Desktop menggunakan dua kolom: instruksi/status lebih lebar di kiri, ringkasan di kanan” dan susunan mobile status → total/tenggat → instruksi → tindakan → ringkasan. Tidak ada concept tournament atau comp generatif untuk bentuk yang sudah ditentukan ini.

**QUALITY BAR:** instruksi dan jumlah mudah dipindai, tidak ada angka/tagihan rekaan dalam mode integrasi, status terpisah, semua kegagalan mempunyai pemulihan, fokus terbaca, dan tidak ada clipping pada 320–1920 px. Fixture pratinjau diberi penanda; uji UI tidak mengklaim verifikasi transaksi produksi.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

DESIGN.md dipertahankan sebagai otoritas incumbent. Tidak ada raster baru yang dibuat; foto fixture menggunakan aset proyek yang sudah ada, QR adalah SVG non-pembayaran dari generator yang disertakan.

