# Informasi Pengiriman — spesifikasi halaman publik

Tanggal pemeriksaan: **18 November 2026**. Status: **spesifikasi tertulis untuk desain dan implementasi berikutnya**. Dokumen ini tidak membuat route, mengubah UI, mengaktifkan layanan kurir, atau memublikasikan kebijakan operasional baru.

Pembaruan implementasi 18 November 2026: frontend pratinjau kini tersedia pada `/pages/public/shipping-information.html`. [Cakupan UI dan pemeriksaan](../../coverage/shipping-information-ui.md) mencatat hasil implementasi serta bagian integrasi yang belum tersedia. Temuan kondisi awal di bawah merupakan bukti saat spesifikasi disusun, sebelum implementasi.

Mode permukaan: **Read**. Identitas visual mengikuti RylVa Green yang sudah digunakan. Fokus rancangan desktop, dengan perilaku mobile yang tetap lengkap.

**Penanda:** **Fakta** berarti ditemukan dalam sumber proyek atau keputusan pengguna; **Usulan** berarti keputusan rancangan halaman ini; **Asumsi perlu dikonfirmasi** berarti informasi operasional/integrasi yang belum terbukti tersedia. Prioritas **Wajib** adalah cakupan versi awal; **Bersyarat** diterapkan ketika ketergantungannya tersedia; **Opsional** dapat ditambahkan setelah kebutuhan utama selesai. Prioritas ini khusus halaman ini, bukan perubahan register prioritas baseline.

## Sumber dan urutan keputusan

1. Keputusan pengguna: identitas proyek dipertahankan; komponen tidak terlalu besar; cek ongkir guest cukup kode pos tanpa membuat/mengubah alamat utama; navbar sticky bersembunyi saat scroll turun dan muncul ketika scroll naik.
2. [Spesifikasi v2.6](../../specifications/spesifikasi-proyek-v2.6.md): D-06/D-07/D-08, §6.4, §8.3, §9.1–9.7, §10.4/10.6/10.7, P-06–P-09, P-11–P-14, P-27, A.7.
3. [PRODUCT.md](../../../PRODUCT.md), [DESIGN.md](../../../DESIGN.md), [shell storefront](storefront-shell.md), serta [inventaris halaman](../../coverage/storefront-page-inventory.md).
4. Implementasi aktif: [Detail Produk](../../../public/assets/js/storefront/product-detail.js), [adapter pratinjau Detail Produk](../../../public/assets/js/storefront/product-detail-preview-repository.js), [fixture pengiriman](../../../public/assets/js/storefront/storefront-shipping-preview-data.js), [Checkout](../../../public/assets/js/storefront/checkout.js), [FAQ](../../../public/pages/public/faq.html), dan [style halaman informasi](../../../public/assets/css/storefront/information-pages.css).
5. Skill design-taste-frontend, Hallmark dan Impeccable digunakan untuk copy yang konkret, hierarki membaca, konsistensi komponen, dan pemulihan state. Instruksi halaman dan fondasi proyek mengungguli pola halaman pemasaran/dekorasi pada skill. Tidak ada pemilihan tema, pembuatan mockup, atau audit render dalam pekerjaan spesifikasi ini.

Sumber Figma untuk shell telah tercatat pada inventaris. Belum ditemukan acuan khusus Informasi Pengiriman dalam inventaris tersebut; struktur di bawah adalah usulan, bukan hasil pengukuran frame Figma baru. Pemeriksaan kali ini memakai dokumen dan kode lokal, bukan pemeriksaan ulang file Figma.

## 1. Pemahaman dan cakupan

### Tujuan dan hasil yang diharapkan

Pengunjung memahami layanan yang sesuai dengan produknya, cara memastikan biaya/area, aturan tanggal dan slot, serta tindakan ketika pengiriman mengalami kendala. Pengguna dapat menuju pemeriksaan ongkir atau pesanan tanpa mengira halaman informasi sudah memesan kurir atau mengubah transaksi.

**Fakta kondisi saat ini:** belum ada halaman HTML Informasi Pengiriman. Footer sudah mempunyai pemicu `data-storefront-page="Informasi Pengiriman"`, tetapi tujuan tersebut belum berada dalam pemetaan halaman informasi aktif. Katalog, Detail Produk, Keranjang, Checkout, Pesanan Saya, Detail Pesanan, Kontak dan FAQ sudah tersedia sebagai frontend pratinjau.

**Usulan route pratinjau:** `/pages/public/shipping-information.html`, dengan alias `/informasi-pengiriman.html` bila mengikuti pola alias proyek. Ini calon route; belum tersedia.

### Pengguna dan kewenangan

| Pengguna | Kewenangan pada halaman |
| --- | --- |
| Guest | Membaca seluruh panduan dan FAQ; membuka Katalog, Detail Produk dan Kontak tanpa login. |
| Pelanggan, termasuk sesi berakhir/belum terverifikasi | Hak baca publik tetap sama. Akses pesanan/Checkout mengikuti guard di halaman tujuan. |
| Admin/SuperAdmin yang membuka storefront | Membaca konten yang sama. Tidak ada kontrol mengubah kebijakan di halaman publik. |

### Cakupan versi awal

- Ringkasan jenis penanganan dan perbandingan layanan.
- Penjelasan area layanan serta alur mengetahui ongkir.
- Ketentuan tanggal, slot, lead time dan kalender tutup.
- Panduan persiapan penerima dan penjelasan pengemasan yang didukung sumber.
- Alur pelacakan, kendala, perubahan alamat/jadwal dan ringkasan komplain.
- Daftar isi, FAQ terkait, dan tautan tindakan yang nyata.

**Batas rancangan:** halaman ini tidak membuat order, memilih kurir, memesan slot, menyimpan alamat, menerima unggahan bukti, mengajukan refund, atau menyediakan pencarian resi publik. Tindakan transaksi tetap berada di Checkout/Detail Pesanan.

## 2. Struktur dan isi halaman

### Urutan dari atas ke bawah

| Bagian | Isi dan hierarki | Alasan penempatan |
| --- | --- | --- |
| Header bersama | Logo, pencarian global, akun, Wishlist dan Keranjang beserta count/preview, kategori. | Mengikuti shell dan perilaku navigasi yang sudah disepakati. |
| Breadcrumb dan pembuka | `Beranda / Informasi Pengiriman`; H1 **Informasi Pengiriman**; intro: “Pahami pilihan layanan, jadwal kirim, dan cara memeriksa ongkir sesuai produk serta alamat tujuan.” | Menyatakan tujuan tanpa banner besar yang mendorong informasi utama terlalu jauh. |
| Ringkasan cepat | Dua kelompok: **Mudah Layu** dan **Tahan Lama**, masing-masing menjelaskan layanan dan kebutuhan jadwal. | Menjawab pembeda terpenting sebelum pengguna membaca rincian. |
| Daftar isi dan artikel | Anchor Layanan, Area & ongkir, Jadwal, Pengemasan & penerima, Pelacakan, Kendala, Pertanyaan pengiriman. | Membantu pembaca langsung menuju pertanyaannya. |
| Layanan pengiriman | Tabel Instan, Same-day, Reguler: jenis penanganan yang dapat memakai, kebutuhan tanggal/slot, dan cara memastikan ketersediaan. Tidak memuat harga atau ETA generik. | Nama layanan mudah dibandingkan, tanpa menyiratkan vendor/layanan telah aktif. |
| Area dan ongkir | Ketersediaan ditentukan alamat, jenis produk, varian/jumlah, tanggal dan kurir; langkah cek ongkir; biaya akhir diverifikasi di Checkout. | Menempatkan pertanyaan biaya setelah kecocokan layanan. |
| Jadwal pengiriman | Lead time, slot WIB, batas pemesanan di muka dan kalender tutup sesuai konfigurasi. Jadwal kirim dipisahkan dari estimasi tiba. | Menghindari salah mengartikan H+1 sebagai janji tiba. |
| Pengemasan dan penerima | Pengemasan mengikuti jenis produk; alamat/nomor penerima harus lengkap; penerima perlu dapat dihubungi dan siap menerima. Instruksi fisik spesifik hanya jika disahkan operasional. | Memberi tindakan pencegahan yang dapat dilakukan pelanggan. |
| Pelacakan | Ringkasan proses pesanan → penyiapan → serah ke kurir → penerimaan; penjelasan status pengiriman dan tautan **Lihat Pesanan Saya**. | Menghubungkan panduan dengan fitur yang sudah tersedia. |
| Kendala dan perubahan | Alamat/penerima bermasalah, keterlambatan, rusak/hilang, permintaan ubah alamat/jadwal dan cara mengajukan komplain melalui Detail Pesanan. | Masalah memperoleh langkah berikutnya yang jelas. |
| FAQ pengiriman | Pertanyaan singkat yang jawabannya sudah dijelaskan pada artikel; accordion mengikuti pola FAQ existing. | Mempermudah pemindaian tanpa menyembunyikan ketentuan utama. |
| Bantuan dan footer | **Hubungi Kami**, tautan FAQ, footer bersama. Tautan halaman Pembatalan & Refund/Syarat & Ketentuan ditambahkan setelah route tersebut tersedia. | Tidak membuat tujuan buntu atau tautan semu. |

### Isi ringkasan dan perbandingan layanan

| Jenis penanganan | Layanan | Jadwal |
| --- | --- | --- |
| Mudah Layu | Instan atau same-day saja; ketersediaan tetap harus diperiksa. | Tanggal dan slot wajib. |
| Tahan Lama | Reguler dapat dipakai; instan/same-day mengikuti ketersediaan dan kecocokan produk/alamat. | Tanggal opsional; jika dipilih, memenuhi ketentuan tanggal kirim. |
| Keranjang campuran | Hanya layanan yang valid untuk seluruh isinya. | Kebutuhan Mudah Layu tetap berlaku; jika tidak ada layanan bersama, pelanggan dapat memisahkan pesanan melalui alur belanja. |

Klasifikasi berasal dari atribut produk, bukan dugaan dari kategori/foto. Tanaman hidup tidak otomatis seluruhnya Mudah Layu atau seluruhnya Tahan Lama.

### Naskah FAQ yang diusulkan

Pertanyaan berikut memakai aturan yang sudah ditemukan. Redaksi publik tetap mengikuti parameter aktif saat integrasi; pertanyaan dan jawaban tidak menambah pengecualian bisnis.

| Pertanyaan | Jawaban awal untuk desain/implementasi |
| --- | --- |
| Apakah saya harus masuk untuk cek ongkir? | Tidak. Buka produk, pilih varian dan jumlah, lalu masukkan kode pos lima angka. Estimasi ini tidak membuat atau mengubah alamat utama. |
| Apakah biaya di Detail Produk sudah final? | Biaya tersebut merupakan estimasi untuk konteks produk yang dipilih. Pilihan layanan dan biaya akhir diperiksa kembali di Checkout menggunakan alamat lengkap serta isi pesanan. |
| Apakah semua produk dapat memakai pengiriman reguler? | Tidak. Produk berlabel Mudah Layu hanya dapat menggunakan instan atau same-day dan memerlukan tanggal serta slot. Produk Tahan Lama dapat memakai reguler sesuai ketersediaan layanan. |
| Apakah H+1 berarti barang tiba besok? | H+1 adalah tanggal pengiriman paling cepat untuk produk Tahan Lama. Waktu tiba mengikuti layanan dan tujuan yang tersedia; H+1 bukan jaminan tiba keesokan hari. |
| Bisakah alamat atau jadwal diubah setelah memesan? | Hubungi toko untuk mengajukan perubahan. Perubahan hanya dapat diproses sebelum status Dikirim, selama status pesanan dan persyaratan layanan, biaya serta lead time masih memenuhi ketentuan. Pengajuan belum berarti perubahan disetujui. |
| Di mana saya melacak paket atau melaporkan masalah? | Buka Pesanan Saya lalu Detail Pesanan untuk melihat pelacakan dan jalur komplain. Komplain diajukan maksimum 24 jam sejak status Terkirim, sesuai ketentuan bukti. Periksa barang sebelum mengonfirmasi penerimaan karena konfirmasi tersebut mengakhiri kesempatan komplain pada alur sistem. |

Jawaban terakhir ditampilkan bersama tautan ke bagian Kendala yang menjelaskan 2–5 foto, pengecualian kategori Tidak diterima, serta peninjauan berdasarkan sebab dan bukti. Tidak menambahkan syarat video atau janji refund otomatis.

### Konten panjang dan tidak lengkap

Artikel tetap dalam urutan linear. Nama layanan panjang membungkus; label dan tombol tidak menimpa isi. Informasi kritis tidak dipotong dengan elipsis. Bagian opsional tanpa data tidak membuat panel kosong. Jika tanggal pembaruan/penerbitan belum tersedia, label tanggal disembunyikan; tanggal dokumen ini tidak dipakai sebagai tanggal terbit kebijakan.

## 3. Alur penggunaan

### Alur utama

1. Pengunjung membuka tautan footer atau tautan informasi pengiriman dari alur belanja yang nanti dikaitkan.
2. Membaca ringkasan Mudah Layu/Tahan Lama dan membuka anchor yang relevan.
3. Untuk biaya, memilih **Pilih Produk untuk Cek Ongkir**, menuju Katalog dan membuka Detail Produk. Jika datang dari Detail Produk, tautan kontekstual dapat kembali ke produk yang sama.
4. Di Detail Produk, guest memasukkan kode pos lima angka dan melihat estimasi untuk produk/varian/jumlah tersebut. Tidak ada alamat yang dibuat/diubah.
5. Saat hendak membeli, pengguna melanjutkan alur Keranjang/Checkout existing; biaya dan ketersediaan final diperiksa dengan alamat lengkap dan konteks pesanan.

**Keputusan UX versi awal:** tidak menempatkan kalkulator ongkir umum dengan kode pos saja di halaman ini. Halaman belum mempunyai produk, ukuran, jumlah atau berat paket. Kalkulator tanpa konteks akan menyiratkan ketepatan yang tidak didukung sumber data. Gunakan kembali pemeriksaan Detail Produk yang sudah ada. Ini keputusan cakupan usulan, bukan pembatasan hak guest.

### Alur alternatif

- Sudah mempunyai pesanan: **Lihat Pesanan Saya** membuka route existing, lalu mengikuti autentikasi/kepemilikan di tujuan. Tidak menampilkan data pesanan pada halaman informasi.
- Pengiriman bermasalah: baca ringkasan, buka Detail Pesanan dari Pesanan Saya untuk status/bukti/komplain; Kontak tersedia sebagai bantuan.
- Guest belum masuk: halaman panduan tetap terbaca. Login hanya diminta oleh tindakan tujuan yang memerlukannya, dengan pemulihan tujuan melalui pola internal `returnTo` existing.
- Kembali dari panduan ke daftar/detail: pulihkan pencarian, filter, urutan, daftar yang sudah dimuat dan posisi gulir melalui mekanisme navigasi existing. Pembukaan Detail Produk baru dari ringkasan dimulai di atas.
- Anchor memakai fragmen URL; Back/Forward memulihkan bagian bacaan. Navigasi biasa tidak diubah menjadi modal.

Tidak ada formulir/draft baru pada halaman ini, sehingga tidak perlu konfirmasi meninggalkan halaman. Jika dibuka dari Checkout/Buket/form yang belum disimpan, guard halaman asal tetap berlaku dan isi asal tidak dihapus oleh tautan panduan.

## 4. Komponen dan interaksi

| Komponen | Pakai ulang/penyesuaian | Perilaku |
| --- | --- | --- |
| Header/footer storefront | Pakai ulang markup, aset, store dan controller existing. | Sticky mengikuti arah scroll, pencarian submit ke Katalog, Wishlist/Keranjang memakai preview dan count yang sama. |
| Breadcrumb dan tombol/link | Pakai ulang token dan affordance halaman informasi. | Tautan navigasi memakai anchor dengan tujuan nyata; fokus terlihat. |
| Ringkasan penanganan | Sesuaikan label penanganan Detail Produk. | Read-only; teks menjelaskan aturan bersama ikon, tanpa mengandalkan warna. |
| Tabel perbandingan | Komponen artikel baru yang terbatas pada target. | Desktop tabel semantik; mobile disusun sebagai kelompok informasi berlabel jika tabel tidak terbaca. |
| Daftar isi | Komponen ringan baru. | Link fragmen nyata. Sesuai keputusan terbaru pengguna, penanda aktif otomatis mengikuti bagian yang dibaca saat scroll ke bawah/atas, tanpa mengubah URL, riwayat atau fokus. Hover dibedakan dari pilihan aktif. |
| FAQ | Native `details/summary` dan pola single-open halaman informasi. | Enter/Space membuka/menutup; fokus tetap pada summary; jawaban tetap dapat diakses tanpa hover. |
| Notice/kegagalan | Gunakan gaya informasi/warning existing. | Pesan singkat, alasan dan satu tindakan pemulihan; bukan halaman kosong. |
| Cek ongkir | Gunakan alur Detail Produk. | Tidak menduplikasi input atau adapter pada halaman ini. |

Tidak memerlukan filter, tab hasil, pagination, infinite scroll, checkbox, dialog, date picker atau tombol Terapkan baru. Kalender/slot di sini menjelaskan ketentuan; pemilihan aktual tetap di Checkout.

## 5. Status dan penanda penting

### Status bisnis yang dijelaskan, bukan dimutasi

| Status pengiriman baseline | Arti untuk pembaca | Langkah pengguna |
| --- | --- | --- |
| Belum Diserahkan | Paket belum diterima kurir. | Periksa perkembangan pesanan. Jangan disamakan dengan pembayaran belum lunas. |
| Dalam Pengiriman | Paket sudah diterima kurir dan sedang diantar. | Buka pelacakan pada Detail Pesanan. |
| Terkendala | Ada masalah yang disertai alasan. | Baca instruksi di Detail Pesanan; hubungi toko bila perlu. |
| Terkirim | Ada bukti tiba menurut proses proyek. | Periksa barang sebelum mengonfirmasi penerimaan. |
| Dikembalikan | Paket kembali ke toko. | Pantau hasil peninjauan dan penyelesaian melalui pesanan. |

Transisi status dilakukan modul pesanan/pengiriman terotorisasi. Halaman ini tidak mempunyai tombol mengubah status. Status pesanan, pembayaran, pengiriman, komplain dan refund tetap dijelaskan sebagai hal yang berbeda.

Penanda **Wajib tanggal & slot** mendampingi Mudah Layu. **Estimasi** hanya dipakai pada hasil yang memang berasal dari layanan estimasi. **Tarif contoh** wajib tetap terlihat pada fixture Detail Produk/Checkout. Tidak memakai hijau “Tersedia” untuk menyatakan area/kurir aktif tanpa pemeriksaan aktual.

State UI seperti FAQ terbuka, loading informasi atau gagal memuat tidak menjadi status pengiriman. Warna penanda mengikuti token semantik existing dengan teks; tidak menambahkan warna merek baru.

## 6. Tindakan dan dampaknya

| Tindakan | Syarat dan ketersediaan | Dampak/umpan balik dan pemulihan |
| --- | --- | --- |
| Pilih bagian daftar isi | Bagian tujuan tersedia. | Scroll ke heading dengan offset navbar; fragmen bisa dibagikan dan dipulihkan. Tidak mengirim data. |
| Buka/tutup FAQ | Jawaban tersedia. | Expanded/collapsed native; tanpa konfirmasi. |
| Pilih Produk untuk Cek Ongkir | Tautan Katalog tersedia. | Buka Katalog. Belum ada tarif, alamat atau pilihan kurir yang diubah. |
| Kembali ke Produk | Hanya jika konteks produk asal valid dan diketahui. | Kembali ke detail dan konteks varian/jumlah menurut navigasi existing. Jika konteks hilang, tampilkan tautan Katalog. |
| Lihat Pesanan Saya | Route tujuan tersedia. | Ikuti guard tujuan; login bila perlu. Tidak melacak pesanan orang lain dari nomor publik. |
| Hubungi Kami | Route Kontak existing tersedia. | Buka Kontak. Tidak menyatakan pesan telah terkirim. |
| Coba Lagi | Hanya pada kegagalan permintaan informasi dinamis yang benar-benar ada. | Jalankan ulang permintaan yang gagal; nonaktif sementara/`aria-busy` mencegah pengiriman ganda; posisi dan konteks baca dipertahankan. |

Tidak ada tindakan destruktif atau perubahan transaksi sehingga tidak diperlukan dialog konfirmasi baru. Pembatalan, unggahan komplain, konfirmasi penerimaan dan perubahan alamat hanya dilakukan pada modul yang mempunyai validasi serta kewenangan tersebut.

## 7. Aturan bisnis, validasi dan hak akses

### Aturan yang sudah diketahui

| Ketentuan | Nilai/aturan baseline | Cara menyajikan |
| --- | --- | --- |
| Jenis layanan | Mudah Layu hanya instan/same-day; Tahan Lama dapat reguler. | Jangan menjanjikan seluruh kategori/daerah mendapat layanan yang sama. |
| Lead time Mudah Layu | Minimal 4 jam sebelum awal slot (P-06). | Jelaskan relatif terhadap awal slot, bukan 4 jam sejak tombol cek ongkir. |
| Tahan Lama | Tanggal kirim paling cepat H+1 (P-06). | Bukan janji barang tiba keesokan hari. |
| Pemesanan di muka | Maksimum 30 hari (P-07). | Ketersediaan tanggal juga bergantung kalender tutup/kapasitas. |
| Slot | Pagi 08:00–12:00, Siang 12:00–16:00, Sore 16:00–20:00 WIB (P-08). | Satu sumber konfigurasi dengan Checkout; tidak menjadi penghitung atau pemesanan slot di halaman ini. |
| Jam operasional | 08:00–20:00 WIB setiap hari, dengan pengecualian kalender tutup (P-09). | Tidak menampilkan “buka sekarang” tanpa sumber kalender dan waktu yang benar. |
| Jadwal/kurir campuran | Hanya layanan yang valid untuk semua isi keranjang. | Jelaskan pilihan memisahkan pesanan; tidak menjanjikan split otomatis dalam satu order. |
| Perubahan setelah order | Permintaan melalui toko, hanya Siap Diproses/Sedang Disiapkan sebelum Dikirim; layanan sama, ongkir tidak berubah, lead time terpenuhi (§9.7). | Tidak menyediakan edit mandiri. Bila syarat tidak terpenuhi, ikuti pembatalan/pemesanan ulang sesuai kebijakan. |
| Penyiapan online/COD | Online memerlukan pembayaran terverifikasi dan stok dikomit; COD dapat disiapkan setelah checkout valid dan komit stok, meskipun pembayaran Menunggu (§9.1). | Alur visual tidak menyatakan semua order harus lunas sebelum disiapkan. |
| Komplain | 24 jam sejak status Terkirim; minimum 2 dan maksimum 5 foto, kecuali kategori Tidak diterima; video bukan syarat wajib baseline (§10.4, P-11/P-27). | Arahkan ke Detail Pesanan, jangan mengalihkan proses wajib ke WhatsApp. |
| Penerimaan | Konfirmasi penerimaan mengakhiri kesempatan komplain di alur sistem (§9.5). | Jelaskan agar pengguna memeriksa barang dahulu; tindakan dan konfirmasi dampak tetap di Detail Pesanan. |
| Kendala Mudah Layu | Percobaan ulang maksimum 1 kali pada hari yang sama (P-14), jika layak/memungkinkan. | Bukan jaminan pengantaran ulang selalu tersedia. Penyelesaian mempertimbangkan sebab dan bukti. |

Nilai di atas adalah nilai awal final pada baseline, dapat berubah melalui pengaturan yang diizinkan. Saat terintegrasi, nilai tampil harus konsisten dengan konfigurasi yang dipakai Checkout; jangan menyalin angka berbeda ke artikel, FAQ dan form.

### Validasi dan pembatasan

- Halaman publik tidak meminta login, lokasi otomatis, kode pos, alamat, nomor HP atau nomor pesanan.
- Di Detail Produk, kode pos tetap string tepat lima digit, termasuk nol di depan. Pesan existing: **Masukkan kode pos yang terdiri dari 5 angka.**
- Tarif estimasi memerlukan konteks produk/varian/jumlah. Kode pos saja tidak membuktikan jangkauan instan atau mengubah alamat tersimpan. Titik/alamat lengkap dapat diperlukan di Checkout.
- Server tetap menentukan layanan yang valid, wilayah, tanggal, kalender tutup, kapasitas, biaya dan perubahan konfigurasi. Teks panduan/validasi frontend tidak menjadi izin transaksi.
- Tautan kembali/`returnTo` hanya tujuan internal yang diizinkan. Tidak menerima URL eksternal atau data alamat dari parameter navigasi.
- Tidak ada objek baru yang dapat dibuat ganda, disimpan atau dihapus oleh halaman ini. Tindakan transaksi mengikuti pengendalian ganda/idempotensi modul asal.

## 8. Matriks state

Versi awal mengutamakan artikel HTML yang langsung terbaca. Skeleton, retry jaringan dan status data berikutnya hanya diperlukan bila bagian kebijakan benar-benar dimuat secara asinkron; jangan menambah API atau penundaan buatan agar state tersebut dapat ditampilkan.

| Area/komponen | Nama state | Pemicu | Isi tampilan/pesan | Tindakan tersedia | Data/konteks dipertahankan | Jalur pemulihan | Prioritas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Halaman | Normal/read-only | Konten berhasil tersedia. | Judul, ringkasan, artikel, daftar isi, FAQ dan tautan nyata. | Baca, pindah bagian, menuju produk/pesanan/bantuan. | Fragmen dan konteks asal. | Tidak diperlukan. | Wajib |
| Link/kontrol | Hover/focus/active | Pointer, keyboard atau penekanan. | Affordance dan ring fokus terlihat; isi tidak hanya muncul saat hover. | Aktifkan dengan mekanisme native. | Posisi baca. | Fokus tidak hilang sesudah aktivasi lokal. | Wajib |
| Daftar isi | Bagian terpilih | Anchor diaktifkan/fragmen dibuka. | Penanda bagian aktif dengan teks/bentuk. | Pindah bagian lain. | Fragmen URL. | Back/Forward. | Wajib |
| Anchor | Fragmen tidak dikenal | URL lama/fragmen salah. | Halaman tetap normal, mulai dari pembuka; tidak menampilkan error seluruh halaman. | Daftar isi yang valid. | Route dan konteks asal. | Pilih bagian. | Wajib |
| FAQ | Collapsed/expanded | Summary ditekan. | Pertanyaan dan jawaban sesuai keadaan; ikon pendamping. | Buka/tutup. | Fokus summary. | Tutup atau pilih pertanyaan lain. | Wajib |
| Navigasi | Kembali dari produk/pesanan | Browser Back atau tautan kembali yang valid. | Bagian/posisi baca sebelumnya pulih jika tersedia. | Lanjut membaca. | Scroll, fragmen dan state halaman asal melalui pola existing. | Jika konteks hilang, kembali ke pembuka. | Wajib |
| Isi nonkritis | Data sebagian | ETA, vendor, tanggal terbit atau detail opsional belum ada. | Sembunyikan bidang kosong; tetap tampilkan aturan umum yang valid. | Produk/Checkout atau Kontak. | Bagian bacaan. | Lengkapi dari sumber aktual kelak. | Wajib |
| Area layanan | Belum dapat dipastikan | Belum ada alamat/produk atau sumber cakupan aktual. | “Ketersediaan layanan diperiksa sesuai produk dan alamat saat Checkout.” | Pilih produk; bantuan. | Konteks asal. | Jalur Detail Produk/Checkout. | Wajib |
| Konten | Teks panjang | Nama layanan/jawaban panjang atau ukuran teks diperbesar. | Membungkus tanpa memotong ketentuan penting. | Semua tautan tetap dapat dijangkau. | Posisi baca. | Layout mengalir; tanpa overflow halaman. | Wajib |
| Aset pendamping | Ikon/gambar gagal | Aset tidak termuat. | Label teks tetap lengkap; hilangkan slot dekorasi rusak. | Tindakan tetap berfungsi. | Seluruh konten. | Fallback teks/aset lokal. | Wajib bila memakai aset |
| Halaman | JavaScript tidak berjalan | Script diblokir/gagal. | Artikel, anchor, FAQ native dan link utama tetap terbaca/dapat dipakai. | Navigasi HTML biasa. | Fragmen. | Muat ulang bila diperlukan; tidak memblokir bacaan. | Wajib |
| Kebijakan dinamis | Loading awal/refresh | Permintaan konfigurasi nyata berlangsung. | Placeholder hanya di area yang belum diketahui; artikel stabil tetap ada; “Memuat ketentuan terbaru…” | Baca bagian lain. | Posisi, FAQ dan bagian aktif. | Tampilkan respons valid. | Bersyarat |
| Kebijakan dinamis | Berhasil diperbarui | Versi valid diterima. | Nilai terbaru; pemberitahuan singkat bila isi yang sedang dibaca berubah. | Lanjut membaca. | Posisi dan FAQ sejauh masih relevan. | Tidak melempar pengguna ke atas. | Bersyarat |
| Kebijakan dinamis | Sebagian gagal/tidak lengkap | Satu bagian gagal, lainnya valid. | Bagian valid tetap terlihat; bagian gagal menjelaskan “Ketentuan bagian ini belum dapat dimuat.” | Coba lagi untuk bagian itu; Kontak. | Artikel lain dan konteks. | Muat ulang bagian gagal. | Bersyarat |
| Kebijakan dinamis | Data tidak valid/kedaluwarsa | Validasi gagal atau sumber menyatakan masa berlaku habis. | Jangan tampilkan angka tidak sah/nilai lama sebagai aturan berlaku; tampilkan penjelasan umum dan status belum terkonfirmasi. | Coba Lagi; periksa saat Checkout; Kontak. | Bagian dan posisi baca. | Ambil versi valid. | Bersyarat |
| Kebijakan dinamis | Load error/timeout/offline | Permintaan gagal atau jaringan terputus. | Pesan penyebab yang diketahui; jangan menyatakan area tidak terlayani. | Coba Lagi setelah tersambung; Kontak bila route dapat dibuka. | Konten valid yang sudah ada, fragmen dan posisi. | Pulihkan koneksi/permintaan; konten lokal tetap terbaca bila tersedia. | Bersyarat |
| Kebijakan dinamis | Maintenance/rate-limited | Respons layanan menyatakan kondisi tersebut. | Pesan sementara; waktu mencoba lagi hanya bila berasal dari server. | Baca bagian statis; retry sesuai petunjuk server. | Bagian aktif dan konten valid. | Tidak melakukan retry loop otomatis. | Bersyarat |
| Coba Lagi | Disabled/pending | Permintaan pemulihan masih aktif. | Label proses dan busy pada area terkait; tindakan ganda dinonaktifkan. | Baca area lain. | Konteks baca. | Aktif kembali setelah hasil, termasuk kegagalan. | Bersyarat |
| Route/konten utama | Tidak ditemukan/gagal render server | Route dihapus, artikel tidak tersedia, atau server gagal. | Gunakan fallback halaman sistem proyek dengan judul jelas dan link Beranda/Kontak. | Kembali; coba lagi bila relevan. | URL untuk retry; jangan bocorkan stack trace. | Route valid atau halaman sistem yang tersedia pada implementasi. | Wajib untuk integrasi route |
| Tujuan pesanan | Perlu login/sesi berakhir | Pengguna membuka Pesanan Saya tanpa sesi yang berlaku. | Guard pada halaman tujuan menampilkan Masuk dan jalur kembali. Panduan tetap publik. | Masuk; kembali ke panduan. | Tujuan internal yang aman. | Login lalu lanjut ke tujuan yang diizinkan. | Wajib untuk tautan tujuan |
| Tujuan pesanan | Tidak diizinkan/tidak tersedia | Pengguna tidak mempunyai akses ke objek tujuan. | State akses/ketersediaan milik modul pesanan; tidak mengungkap data orang lain. | Kembali ke daftar/panduan; bantuan. | Konteks publik yang aman. | Guard otorisasi tujuan. | Wajib untuk integrasi tujuan |
| Layanan pada pesanan | Pilihan berubah/tidak lagi tersedia | Pengguna menuju Checkout dan data layanan sudah berubah. | Checkout menampilkan hasil validasi terbaru dan meminta pilihan/persetujuan ulang bila diperlukan. | Sesuaikan alamat/jadwal/layanan di Checkout. | Data Checkout yang masih valid. | Mengikuti pemulihan Checkout; halaman panduan tidak memilih pengganti otomatis. | Wajib pada integrasi alur |

**State yang tidak relevan pada versi awal:** hasil pencarian/filter kosong, pagination/load-more, validasi formulir baru, simpan berhasil/sebagian berhasil, konflik penyimpanan, draft belum disimpan, persetujuan staf, proses pengiriman/refund sedang berjalan, dan duplikasi submit order. Tidak ada tindakan semacam itu di halaman ini. Tidak ada OTP/verifikasi/akses ditolak untuk membaca panduan publik. State tersebut tetap dimiliki modul yang menjalankan prosesnya.

## 9. UX dan aksesibilitas

### Layout dan identitas

- **Usulan desktop:** area maksimal sekitar 1180 px mengikuti halaman informasi; daftar isi sekitar 220–240 px dan artikel fleksibel dengan panjang baris sekitar 65–75 karakter. Gunakan track `minmax(0, 1fr)` untuk konten yang dapat menyempit.
- H1 sekitar 36 px, heading bagian 28 px, subheading 20 px, isi 16 px dengan line-height sekitar 1,6–1,7; semuanya memakai keluarga Poppins/token proyek. Nilai ini arahan proporsi target, bukan pengukuran Figma khusus halaman.
- Krem, hijau dan sage dari sistem dipertahankan. Header pembuka memakai gaya tenang halaman informasi; variant warna Kontak yang khusus tidak disebarkan menjadi tema semua halaman.
- Radius mengikuti token 8/12/20 px dan kapsul tombol. Tidak membungkus setiap paragraf dalam kartu atau membuat nested card.
- Tidak perlu foto dekoratif, logo mitra kurir atau mockup paket. Foto pengemasan hanya boleh dipakai sebagai bukti bila aset dan prosedurnya benar-benar tersedia.
- Daftar isi desktop boleh sticky, dibatasi tinggi viewport dan memakai offset `--storefront-sticky-height`. Anchor menyisakan ruang penuh header melalui pola scroll-padding existing. Kontrol/heading tidak boleh tertutup saat navbar muncul kembali.
- Mobile menjadi satu kolom; daftar isi berupa kelompok link ringkas atau disclosure native dalam alur biasa. Tidak menambah toolbar sticky/bottom sheet baru. Tabel menjadi kelompok layanan berlabel bila diperlukan, tanpa menggulir seluruh halaman ke samping.
- Uji proporsi utama pada desktop 1440 px; pertahankan keterbacaan pada 1024, 768, 390 dan 320 px.

### Aksesibilitas

- Satu H1, heading berurutan, `main`/`article`/`nav` dengan nama yang jelas, dan tautan lompat ke isi mengikuti shell.
- Header tabel mempunyai relasi semantik. Alternatif mobile tetap menjelaskan label setiap nilai.
- Link dan summary dapat dipakai keyboard; fokus terlihat seketika; target tindakan utama mengikuti ukuran minimal 44–48 px yang sudah dipakai proyek.
- Anchor yang diaktifkan keyboard membawa fokus/posisi ke heading tujuan dengan pola yang tidak mengganggu pembaca layar. Jangan memindahkan fokus hanya karena scroll biasa.
- Pembaruan asinkron menggunakan pengumuman singkat `aria-live="polite"` pada area status, bukan membaca ulang seluruh artikel. Error memuat menyebut bagian yang gagal.
- Penanda tidak bergantung pada warna/ikon. Informasi penting tidak bergantung pada hover. Hormati reduced motion dan pembesaran teks; artikel tetap mengalir pada zoom.
- Tidak ada dialog baru. Fokus, Escape dan pengembalian fokus pada preview header mengikuti komponen bersama existing.

## 10. Data, keamanan dan kebutuhan sistem

### Sumber minimum

| Data | Sumber yang diketahui | Batas pemakaian |
| --- | --- | --- |
| Isi ketentuan | Baseline dan naskah publik yang diselaraskan. | Konten harus diperiksa terhadap aturan, bukan menyalin klaim FAQ yang bertentangan. |
| Lead time, batas tanggal, slot, jam, batas komplain | Register parameter/config operasional; nilai baseline tersedia. | Pada pratinjau boleh menggunakan nilai baseline yang disebut jelas sebagai acuan. Produksi harus konsisten dengan Checkout. |
| Ketersediaan layanan/area | Integrasi kurir dan konfigurasi jenis produk/alamat. | Belum ada sumber produksi yang terhubung; tidak membuat daftar kota/radius aktif. |
| Tarif/ETA | Adapter Detail Produk dan Checkout; saat ini `storefront-shipping-preview-data.js`. | Angka Rp15.000/Rp20.000/Rp25.000, nama Gosend dan ETA pada fixture hanya contoh. Tidak disalin menjadi tarif/SLA umum pada artikel. |
| Jenis penanganan | Atribut produk/varian dari katalog yang berwenang. | Tidak dihitung dari nama kategori/foto. |
| Status/resi/bukti | Modul pesanan dan pengiriman milik pengguna. | Tidak dimuat ke halaman panduan publik. |
| Versi/tanggal terbit ketentuan | Metadata naskah/config terbit jika tersedia. | Tanggal valid; jangan memakai tanggal build/dokumen sebagai tanggal pembaruan palsu. |

**Format:** Bahasa Indonesia; rupiah bilangan bulat dengan formatter existing; waktu tampil WIB dan data waktu tersimpan UTC; tanggal manusiawi pada artikel. Identifier parameter internal, enum, URL provider, kredensial dan stack trace tidak ditampilkan dalam alur pengguna.

### Frontend

Menyediakan artikel semantik, navigasi bagian, FAQ, tautan alur nyata, responsif dan fallback. Gunakan dependensi shell yang sama agar pencarian, Wishlist dan Keranjang tetap sinkron. Cek ongkir tetap memakai adapter produk; halaman baru tidak menulis ke alamat, keranjang atau draft transaksi.

### Backend/integrasi berikutnya

- Menyediakan naskah/parameter publik yang aman, valid dan terversi; jika seluruh isi dirender server, tidak wajib menambah API publik khusus halaman.
- Menegakkan kalender, kapasitas, lead time, cakupan, jenis penanganan, tarif dan validasi ulang di Checkout.
- Kontrak baseline A.7 mencantumkan `GET /shipping/options` untuk **pelanggan**, bukan bukti endpoint aktif atau izin guest. Cek ongkir guest yang telah diputuskan pengguna masih memerlukan kontrak baca publik/adapter yang sesuai dan pembatasan permintaan saat integrasi; jangan diam-diam membuka endpoint milik pelanggan atau membuat akses alamat akun menjadi publik.
- Otorisasi kepemilikan berlaku di Pesanan Saya/Detail Pesanan; input navigasi tidak memberi akses ke pesanan orang lain.
- Validasi dan catat perubahan parameter melalui modul berwenang/audit existing. Halaman informasi tidak membuat audit transaksi pada setiap pembacaan.
- Konten dinamis dibersihkan/di-escape. Tautan eksternal kurir di Detail Pesanan divalidasi di modul asal. Tidak ada layanan lokasi/pelacakan pihak ketiga yang dimuat otomatis pada halaman informasi.

Belum tersedia kontrak khusus untuk metadata kebijakan publik, TTL/cache maupun provider produksi. Nama endpoint/angka timeout/cache baru tidak ditetapkan oleh dokumen ini.

## 11. Daftar pekerjaan dan kriteria selesai

### Pekerjaan wajib

1. Susun naskah publik sesuai bagian 2/7 dan selaraskan konflik FAQ pada bagian 12 sebelum rilis produksi.
2. Buat route HTML target dengan shell existing dan artikel yang dapat dibaca tanpa JavaScript.
3. Tambahkan tujuan Informasi Pengiriman ke pemetaan pusat `storefront-shell.js` dan alias pada `config/preview-pages.json`; hindari menambal footer satu per satu.
4. Gunakan base `information-pages.css`/token existing; tambahkan style target yang scoped bila diperlukan. Penyesuaian bersama harus diperiksa pada Kontak, FAQ dan Kebijakan Privasi.
5. Buat ringkasan penanganan, tabel layanan, daftar isi, FAQ dan pesan pemulihan yang relevan. Tidak membuat komponen transaksi duplikat.
6. Hubungkan Katalog/Detail Produk, Pesanan Saya, FAQ dan Kontak. Tautan dari alur ber-draft mempertahankan guard yang sudah ada.
7. Sediakan pemeriksaan development melalui fixture/workbench mengikuti pola `tools/preview/`; calon workbench `/__preview/shipping-information`, belum aktif. Kontrol state tidak ditempatkan pada alur produksi.
8. Catat cakupan UI, sumber naskah dan batas integrasi setelah implementasi; perbarui inventaris halaman.

**Bersyarat:** pemuatan parameter dinamis, state jaringan/busy/retry, versi kebijakan dan integrasi produksi ketika sumbernya tersedia. **Wajib sesuai revisi pengguna:** penanda bagian aktif otomatis saat scroll. Kalkulator ongkir di halaman ini bukan bagian versi awal; bila kelak dibutuhkan, harus menerima konteks produk dan memakai kontrak estimasi yang valid.

### Area berkas yang diperkirakan terpengaruh

- Baru: `public/pages/public/shipping-information.html`.
- Style tambahan target pada `public/assets/css/storefront/information-pages.css` atau berkas target tersendiri bila ukurannya membenarkan pemisahan.
- Penautan: `public/assets/js/storefront/storefront-shell.js`, `config/preview-pages.json`.
- Modul JS target hanya bila diperlukan untuk perilaku yang tidak dapat dipenuhi HTML native; artikel/FAQ tidak harus mempunyai modul baru.
- Dokumentasi: cakupan halaman baru dan inventaris. Koreksi copy FAQ terkait dicatat sebagai pekerjaan konten yang terdampak; tidak merombak layout FAQ.

### Kriteria penerimaan yang dapat diperiksa

| Skenario | Hasil yang harus terbukti |
| --- | --- |
| Guest membuka halaman | Panduan dapat dibaca tanpa login, permintaan alamat, izin lokasi atau nomor pesanan. |
| Footer di halaman storefront | Informasi Pengiriman membuka route nyata, bukan notice tujuan belum tersedia. |
| Ringkasan Mudah Layu/Tahan Lama | Layanan dan kebutuhan jadwal sesuai atribut serta aturan baseline; tidak menggeneralisasi seluruh tanaman. |
| Pemeriksaan angka | P-06/P-07/P-08/P-09 konsisten dengan sumber konfigurasi/fixture yang dipakai Checkout; H+1 tidak disebut ETA tiba. |
| Keranjang campuran | Copy menjelaskan validitas seluruh isi dan kemungkinan memisahkan pesanan, tanpa split otomatis. |
| Cek ongkir guest | Tautan menuju alur produk; kode pos lima digit dapat diperiksa tanpa login dan tanpa mutasi alamat utama. Tarif fixture tetap ditandai contoh. |
| Return/back | Konteks produk, filter/urutan/daftar/scroll asal dan fragmen baca pulih sesuai mekanisme existing. |
| Navigasi dari draft Checkout/Buket | Konfirmasi asal tetap bekerja; batal mempertahankan isian. Halaman panduan tidak menyimpan ulang draft. |
| Pesanan/privasi | Panduan tidak memuat data pesanan; navigasi pesanan mengikuti login/kepemilikan, termasuk sesi berakhir. |
| Online/COD | Penjelasan penyiapan tidak memblokir COD hanya karena status pembayaran masih Menunggu. |
| Kendala/refund/komplain | Penyelesaian berdasar sebab/bukti, tidak menjanjikan refund otomatis 100% atau mensyaratkan video/WhatsApp; jendela mengacu status Terkirim. |
| Anchor/FAQ/keyboard | Tidak tertutup navbar yang muncul; fokus jelas, urutan logis, Back/Forward dan FAQ native berfungsi. |
| Responsif/teks panjang | Desktop dan 320–390 px tidak mengalami tabrakan atau overflow halaman; tombol dan nilai tetap terbaca. |
| JavaScript/aset gagal | Artikel dan link inti tetap tersedia; ikon hilang tidak menghilangkan makna. |
| Data dinamis gagal, jika digunakan | Bagian valid tetap ada, kesalahan layanan tidak menjadi “wilayah tidak terlayani”, retry tidak ganda dan konteks baca dipertahankan. |
| Konsistensi shell | Pencarian menuju Katalog, count/preview Wishlist dan Keranjang sinkron; navbar hide/show serta reduced motion tidak rusak. |
| Integrasi/regresi | Bila shared style atau link berubah, periksa Kontak/FAQ/Privasi dan alur asal yang terkait; jalankan pemeriksaan sintaks/tautan/build yang memang tersedia. |

Pemeriksaan implementasi kelak harus mencakup hasil render desktop/mobile dan alur aktual. Dokumen ini hanya diperiksa terhadap sumber lokal dan kelengkapan rancangan; tidak mengklaim UI baru atau pengujian browser telah lulus.

## 12. Asumsi, konflik sumber dan keputusan terbuka

### Perbedaan yang ditemukan

| Sumber yang berbeda | Temuan | Keputusan rancangan/dampak |
| --- | --- | --- |
| FAQ pengguna vs PRODUCT/baseline | FAQ menyebut Bandung/sekitarnya dan pengemasan spesifik; PRODUCT menyebut target Jabodetabek/kota besar, tetapi cakupan aktual belum dibuktikan. | Tidak menyalin kota, radius atau prosedur fisik sebagai jaminan aktif. Tampilkan pemeriksaan sesuai alamat/produk. Cakupan nyata dan pengemasan perlu data operasional. |
| FAQ pengguna vs §10.4/10.7 | FAQ menjanjikan penggantian/refund 100% dan meminta video melalui WhatsApp; baseline memakai kategori, deskripsi, foto dan penilaian sebab/bukti di halaman pesanan. | Halaman baru mengikuti baseline dan keputusan alur pesanan. Selaraskan jawaban FAQ terkait sebelum peluncuran produksi; video bukan syarat wajib baru dan WhatsApp bukan kanal pengajuan wajib. |
| Redaksi §9.6 vs ringkasan §10.6/10.7 | §9.6 memakai redaksi lebih kategoris untuk kegagalan karena pelanggan; §10.6/10.7 mensyaratkan bukti dan penetapan tanggung jawab, bukan penolakan otomatis karena jenis produk. | Naskah publik mengikuti ringkasan bernuansa sebab/bukti pada §10.6/10.7. Redaksi kebijakan publik final perlu ditinjau pemilik sesuai arahan baseline, tanpa mengubah invariant. |
| Fixture vs layanan operasional | Fixture memuat harga, nama Gosend dan ETA. Belum ada integrasi provider produksi. | Itu contoh pengembangan, bukan bukti kemitraan, biaya tetap atau SLA. Tidak dimuat sebagai daftar tarif umum. |
| Kontrak A.7 vs keputusan cek ongkir guest | Kontrak `/shipping/options` tercatat untuk pelanggan; keputusan pengguna mengizinkan estimasi guest di Detail Produk. | Pertahankan keputusan UX guest. Rekonsiliasi kontrak baca publik saat integrasi, tanpa membuka alamat/pesanan akun. Tidak menghalangi halaman panduan statis. |

### Asumsi perlu dikonfirmasi sebelum rilis produksi

1. Vendor/layanan aktif, cakupan kota/radius, titik asal pengiriman dan dukungan aktual kurir belum ditemukan. Dampak: tidak menampilkan logo mitra, peta jangkauan, ETA universal atau daftar kota pasti.
2. Sumber publik parameter aktif dan metadata terbit belum terhubung. Dampak: versi awal pratinjau memakai baseline; produksi memerlukan satu sumber yang sama dengan Checkout.
3. Prosedur pengemasan fisik dan materi foto yang disahkan operasional belum diverifikasi. Dampak: naskah tidak menjanjikan material/prosedur tertentu atau hasil “pasti aman”.
4. Redaksi publik untuk kegagalan pengiriman, pembatalan dan refund perlu diselaraskan dengan ringkasan baseline serta halaman kebijakan berikutnya. Dampak: tidak menjanjikan persetujuan/refund otomatis di halaman ini.

Keputusan rutin yang ditetapkan sebagai **usulan versi awal**: halaman panduan publik tanpa kalkulator umum, layout artikel dengan daftar isi, tautan ke cek ongkir produk, serta FAQ native. Tidak ada pertanyaan pengguna yang menghalangi penyusunan spesifikasi ini. Rancangan dapat diimplementasikan sebagai frontend pratinjau tanpa mengarang integrasi produksi.
