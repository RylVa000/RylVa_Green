# RylVa Green

<!-- impeccable:product-schema 1 -->

## Platform

web

## Sumber dan Status

- `docs/specifications/spesifikasi-proyek-v2.6.md`, versi 2.6 Final tanggal 19 Oktober 2026, adalah acuan ruang lingkup dan aturan bisnis. Pengguna mengonfirmasi acuan ini pada 28 Oktober 2026.
- Konteks pelanggan, cakupan layanan yang dituju, pembeda, dan komitmen merek di bawah dikonfirmasi langsung oleh pengguna pada 28 Oktober 2026.
- Dokumen ini merangkum konteks produk; rincian keputusan D-01–D-20, parameter P-01–P-46, serta kriteria penerimaan tetap mengikuti spesifikasi. Perubahan baseline mengikuti change request/ADR dan pengujian regresi.
- Persyaratan dan tujuan produk tidak berarti fitur sudah diimplementasikan atau klaim operasional sudah terbukti.

## Users

- Pelanggan utama: pecinta tanaman hias, pemula yang ingin merawat tanaman di rumah, serta anak muda dan pekerja kantoran yang mencari tanaman indoor untuk dekorasi estetis.
- Pekerjaan utama pelanggan: menemukan tanaman yang sesuai kebutuhan, memahami cara perawatannya sebelum membeli, memilih produk atau varian, dan memesan dengan informasi pengiriman yang jelas.
- Pelanggan juga dapat membeli florist, buket kustom, serta gardening goods sesuai ruang lingkup v2.6.
- Pengunjung dapat menjelajah katalog, mencari produk, dan mengisi keranjang tanpa login. Checkout membutuhkan akun pelanggan terverifikasi.
- Admin menangani katalog, stok, produksi buket, pesanan, pengiriman, komplain, dan refund sesuai kewenangan.
- SuperAdmin mengelola akun staf, parameter, rekonsiliasi, audit, laporan keuangan, dan tindakan sensitif. Akun staf terpisah dari akun belanja pelanggan.

## Product Purpose

RylVa Green adalah aplikasi penjualan florist, buket kustom, tanaman hias, dan perlengkapan berkebun. Produk membantu pelanggan memilih dengan informasi yang cukup, melakukan transaksi, serta mengikuti pemenuhan dan pengiriman pesanannya.

Keberhasilan berarti pelanggan dapat memahami produk dan perawatannya, memesan produk yang tersedia dengan harga serta ongkos kirim yang jelas, dan melihat status transaksi. Staf dapat memenuhi pesanan dengan stok yang konsisten dan tindakan yang dapat diaudit. Target numerik tambahan terkait konversi atau pertumbuhan belum ditetapkan.

## Positioning

Pembeda yang ditetapkan pemilik adalah kurasi tanaman hias berkualitas premium dan panduan perawatan lengkap langsung di halaman detail produk, didukung pengalaman belanja yang mudah digunakan, termasuk bagi pemula.

Ini merupakan posisi produk yang ingin diwujudkan. Jangan mengubahnya menjadi klaim keunggulan terukur, sertifikasi, jaminan kualitas tertentu, atau perbandingan yang telah terbukti terhadap toko lain tanpa bukti pendukung.

## Operating Context

- Cakupan layanan yang dituju: Jabodetabek dan kota-kota besar di Indonesia, dengan penanganan pengiriman tanaman yang aman serta layanan same-day/instant sesuai ketersediaan area dan kurir.
- Cakupan kota, radius, tarif, ketersediaan layanan, dan janji waktu tiba yang terperinci belum dikonfirmasi. Jangan mengartikan target cakupan sebagai jaminan same-day/instant untuk seluruh kota.
- Bahasa antarmuka: Bahasa Indonesia. Harga menggunakan rupiah dalam bilangan bulat tanpa desimal. Waktu ditampilkan dalam WIB dan disimpan dalam UTC.
- Situs bersifat mobile-first dan mendukung desktop serta perangkat seluler. Spesifikasi mencakup lonjakan kebutuhan musiman, termasuk Valentine, Hari Ibu, dan wisuda.
- Alur pelanggan mencakup katalog/kategori/pencarian, detail produk dan perawatan, keranjang, autentikasi, checkout, pembayaran, status pesanan/pengiriman, serta pembatalan, refund, dan komplain sesuai aturan.

## Capabilities and Constraints

### Katalog dan pemesanan

- Ruang lingkup mencakup florist, buket kustom, tanaman hias, pot/vas, media tanam, tanah/kompos, pupuk, alat berkebun, benih/biji, perlengkapan/dekorasi, serta paket berkebun.
- Kategori, atribut, varian/SKU, satuan jual, harga, dan ketersediaan harus jelas serta konsisten dari katalog sampai pesanan. Produk dapat memiliki lebih dari satu kategori.
- Detail produk tanaman harus menyertakan panduan perawatan yang relevan dan dapat dipahami pemula; isi faktualnya memerlukan data produk yang nyata.
- Kustomisasi buket mengikuti opsi, kompatibilitas, tambahan harga, validasi server, dan snapshot konfigurasi menurut spesifikasi.
- Keranjang dan checkout memvalidasi ulang harga, status produk, varian, stok, serta aturan pengiriman. Perubahan harga membutuhkan persetujuan ulang pelanggan.
- Checkout mencakup alamat, kurir, tanggal/slot kirim dan kartu ucapan bila berlaku, ringkasan biaya, serta persetujuan yang diperlukan.

### Pembayaran, stok, dan pemenuhan

- Pembayaran online menggunakan reservasi stok sesuai metode pembayaran; komit stok mengikuti pembayaran terverifikasi. COD yang valid dikonfirmasi dan mengomit stok setelah checkout, sementara status pembayaran tetap menunggu/UNPAID.
- Status pesanan, pembayaran, pengiriman, refund, dan komplain adalah konsep terpisah. Jangan menyederhanakan tampilan dengan menyamakan status-status ini.
- Stok barang dagangan terpisah dari bahan produksi buket; perubahan dicatat dalam buku besar yang dapat diaudit. Reservasi/komit paket berbasis komponen harus atomik.
- Produk mudah layu wajib menggunakan tanggal/slot kirim dan layanan instan/same-day. Produk tahan lama dapat memakai ekspedisi reguler jika memenuhi aturan spesifikasi. Target pengiriman tanaman yang aman tidak menghapus aturan per kategori ini.
- Pembatalan, refund, komplain, perubahan status, dan tindakan staf mengikuti otorisasi, bukti, tenggat, dan audit yang ditetapkan spesifikasi.

### Implementasi

- Stack ditetapkan: HTML5, CSS3, JavaScript sesuai kebutuhan, PHP Native tanpa framework backend, MySQL/InnoDB, dan PDO dengan prepared statements. Jangan mengganti stack sebagai bagian dari pekerjaan desain.
- `composer.json` menetapkan PHP `^8.2` dan autoload PSR-4 `RylvaGreen\\` ke `src/`.
- Validasi dan otorisasi wajib ditegakkan di server. Staf wajib MFA; keamanan, privasi, sesi, dan kontrol tindakan sensitif mengikuti baseline v2.6.
- Document root adalah `public/`; konfigurasi, rahasia, dan kode internal tidak boleh diekspos melalui document root.
- Pada pemeriksaan init, `src/Bootstrap.php` kosong; `config/routes.php` dan template storefront masih berupa placeholder. Struktur direktori bukan bukti fitur telah berfungsi.
- Ekstensi skema database memerlukan rekonsiliasi, migrasi, dan pengujian sesuai spesifikasi; keberadaan berkas SQL tidak membuktikan impor atau integrasi telah lulus.

## Brand Commitments

- Nama produk: **RylVa Green**.
- Arahan yang mengikat dari pemilik: antarmuka bertema botani organik yang bersih, modern, dan sangat mudah digunakan.
- Komunikasi harus membantu pemula memahami pilihan tanaman dan perawatannya dengan jelas. Panduan suara merek yang lebih rinci belum ditetapkan.
- Palet, tipografi, sistem komponen, serta konsep visual per halaman belum ditetapkan melalui init.

## Evidence on Hand

- `docs/specifications/spesifikasi-proyek-v2.6.md`: baseline bisnis, kebutuhan fungsional/nonfungsional, keamanan, prioritas halaman, serta kriteria penerimaan v2.6.
- `composer.json`: ketentuan runtime dan dependensi yang tercatat.
- `database/schema/DB_RylVa_Green.sql`: berkas skema untuk diperiksa terhadap baseline, bukan bukti deployment atau validasi database.
- `src/`, `templates/`, `public/assets/`, dan `tests/`: struktur implementasi dan pengujian yang tersedia; keberadaan berkas tidak membuktikan kelengkapan atau kelulusan tes.
- Pada area aset publik yang diperiksa, belum ditemukan foto produk, logo final, atau konten perawatan tanaman yang siap digunakan. Aset final dan konten produk harus dipasok atau diverifikasi sebelum dipublikasikan.
- Belum ada bukti yang dikonfirmasi untuk testimoni, jumlah pelanggan, sertifikasi, metrik kualitas, keunggulan terhadap pesaing, atau jaminan pengiriman. Jangan membuatnya seolah-olah fakta.

## Product Principles

1. Bantu pelanggan memilih dan merawat tanaman, bukan sekadar menyelesaikan pembelian.
2. Tampilkan varian, satuan, stok, biaya, serta syarat pengiriman dengan jelas sebelum pelanggan berkomitmen.
3. Pertahankan kebenaran transaksi dan stok; perubahan harga, pembayaran, atau ketersediaan harus dapat dipahami pelanggan.
4. Sesuaikan informasi dan pengiriman dengan karakter produk, terutama tanaman hidup dan bunga mudah layu.
5. Buat pekerjaan staf dapat ditindaklanjuti sesuai kewenangan, dengan jejak audit dan pemisahan status yang akurat.

## Accessibility & Inclusion

- Alur katalog, keranjang, checkout, dan pembayaran mengikuti prinsip dasar WCAG 2.1 tingkat AA sebagaimana NFR-06: kontras, navigasi papan ketik, dan label formulir.
- Ikuti NFR-05 untuk antarmuka mobile-first dan dukungan dua versi terakhir Chrome, Safari, Edge, serta Firefox.
- Informasi produk dan perawatan perlu dapat dipahami pelanggan pemula. Jangan mengandalkan pengetahuan botani khusus untuk melakukan pembelian dasar.

## Keputusan yang Masih Terbuka

- Daftar kota/radius layanan, kurir yang dipilih, tarif, dan komitmen same-day/instant per area serta jenis produk.
- Daftar tanaman/produk nyata, harga, stok, bukti kurasi premium, konten perawatan, foto, dan logo final.
- Penyedia payment gateway dan kurir yang akan dioperasikan beserta bukti integrasi dan kesiapan peluncuran.
- Panduan suara merek yang lebih rinci dan target keberhasilan bisnis tambahan.
