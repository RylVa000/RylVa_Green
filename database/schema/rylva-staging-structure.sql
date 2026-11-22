-- RylVa Green: initial structure for an EMPTY selected database.
-- No fixture INSERTs, DROP, TRUNCATE, CREATE DATABASE, or USE statements.
-- DDL is not transactionally reversible. Stop and inspect any import error.
-- Source SHA-256: 86e33974d00a2afb27279fee70439766e80910bff4113c502133cb575846b503

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE `akun_pengguna` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal unik akun pengguna',
  `peran` enum('CUSTOMER','ADMIN','SUPERADMIN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CUSTOMER' COMMENT 'Peran tunggal pengguna sesuai BR-19 (satu akun satu peran)',
  `email` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Alamat email pengguna (disimpan huruf kecil, unik)',
  `hash_kata_sandi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Hash kata sandi Argon2id/bcrypt (NULL untuk akun Google-only atau Admin belum aktivasi)',
  `status_akun` enum('BELUM_TERVERIFIKASI','AKTIF','DITANGGUHKAN','DINONAKTIFKAN','DIANONIMKAN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BELUM_TERVERIFIKASI' COMMENT 'Status siklus hidup akun pengguna',
  `nama_lengkap` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama lengkap pengguna (2-100 karakter)',
  `nomor_telepon` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nomor telepon format +62 (9-15 digit)',
  `rahasia_mfa_terenkripsi` varbinary(512) DEFAULT NULL COMMENT 'Kunci rahasia TOTP MFA yang dienkripsi dengan APP_KEY (SEC-03, D-13)',
  `status_mfa_aktif` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Penanda apakah MFA sudah aktif (wajib 1 untuk ADMIN dan SUPERADMIN)',
  `hash_kode_cadangan_mfa` json DEFAULT NULL COMMENT 'Daftar hash kode pemulihan cadangan MFA untuk SuperAdmin (Bagian 13.2)',
  `versi_persetujuan_privasi` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Versi Syarat & Ketentuan serta Kebijakan Privasi yang disetujui saat registrasi',
  `waktu_persetujuan_privasi` datetime DEFAULT NULL COMMENT 'Waktu UTC saat pengguna menyetujui Kebijakan Privasi',
  `jumlah_gagal_login_berturut` int UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Penghitung kegagalan login berturut-turut untuk penguncian sementara P-31',
  `waktu_terkunci_hingga` datetime DEFAULT NULL COMMENT 'Batas waktu penundaan login akibat kegagalan berulang (P-31)',
  `alasan_penonaktifan` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Alasan wajib saat akun pelanggan/staf ditangguhkan atau dinonaktifkan',
  `dinonaktifkan_oleh_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun staf yang menonaktifkan akun ini',
  `waktu_login_terakhir` datetime DEFAULT NULL COMMENT 'Waktu UTC login terakhir yang berhasil',
  `waktu_aktivitas_terakhir` datetime DEFAULT NULL COMMENT 'Waktu UTC aktivitas terakhir untuk pemantauan akun tidak aktif (P-36)',
  `waktu_peringatan_anonimisasi` datetime DEFAULT NULL COMMENT 'Waktu pengiriman notifikasi N-20 (30 hari sebelum anonimisasi P-36)',
  `waktu_dianonimkan` datetime DEFAULT NULL COMMENT 'Waktu UTC saat data pribadi akun dianonimkan',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan akun pengguna (Pelanggan, Admin, SuperAdmin), kredensial, status MFA, dan persetujuan privasi';

CREATE TABLE `alamat_pengguna` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal alamat pengguna',
  `akun_pengguna_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi akun pelanggan pemilik alamat',
  `label_alamat` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Rumah' COMMENT 'Label penanda alamat (mis. Rumah, Kantor, Taman)',
  `nama_penerima` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama lengkap penerima paket',
  `nomor_telepon_penerima` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nomor telepon aktif penerima format +62',
  `alamat_lengkap` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama jalan, nomor rumah, RT/RW (10-255 karakter)',
  `kelurahan` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama kelurahan atau desa',
  `kecamatan` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama kecamatan',
  `kota_kabupaten` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama kota atau kabupaten',
  `provinsi` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama provinsi',
  `kode_pos` char(5) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode pos 5 digit',
  `patokan_lokasi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Catatan patokan lokasi untuk memudahkan kurir mencari alamat',
  `titik_lintang` decimal(10,7) DEFAULT NULL COMMENT 'Koordinat latitude peta (wajib diisi untuk pengiriman kurir instan/same-day)',
  `titik_bujur` decimal(10,7) DEFAULT NULL COMMENT 'Koordinat longitude peta (wajib diisi untuk pengiriman kurir instan/same-day)',
  `status_alamat_utama` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Penanda apakah alamat ini menjadi alamat utama default saat checkout',
  `status_aktif` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Status aktif alamat (1 = aktif, 0 = dihapus lembut)',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan buku alamat pengiriman pelanggan beserta titik koordinat peta untuk layanan kurir';

CREATE TABLE `antrean_keluar` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal baris antrean keluar (outbox)',
  `kode_templat_notifikasi` enum('N_01','N_02','N_03','N_04','N_05','N_06','N_07','N_08','N_09','N_10','N_11','N_12','N_13','N_14','N_15','N_16','N_17','N_18','N_19','N_20') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode katalog notifikasi N-01 s.d. N-20 sesuai Bagian 14',
  `kanal_pengiriman` enum('EMAIL','DASBOR_INTERNAL','WHATSAPP_OPSIONAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EMAIL' COMMENT 'Kanal pengiriman pesan (Email wajib sesuai D-10)',
  `akun_penerima_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun pengguna penerima pesan',
  `alamat_tujuan` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Alamat email atau nomor tujuan penerima',
  `subjek_pesan` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Subjek email atau judul pemberitahuan (bebas karakter CR/LF sesuai 15.4)',
  `muatan_data_json` json NOT NULL COMMENT 'Data variabel templat pesan (tanpa kata sandi atau data sensitif penuh)',
  `kunci_idempotensi_kirim` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Kunci unik agar pengingat/notifikasi yang sama tidak diantrekan dua kali',
  `status_pengiriman_pesan` enum('MENUNGGU_KIRIM','SEDANG_DIKIRIM','TERKIRIM','GAGAL_SEMENTARA','GAGAL_PERMANEN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MENUNGGU_KIRIM' COMMENT 'Status pemrosesan antrean keluar oleh pekerja notification-retry (A.8)',
  `jumlah_percobaan_kirim` tinyint UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Jumlah percobaan pengiriman yang telah dilakukan',
  `waktu_percobaan_berikutnya` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Jadwal pengiriman atau percobaan ulang berikutnya (dengan backoff)',
  `pesan_kesalahan_terakhir` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Catatan error SMTP/gateway terakhir bila pengiriman gagal',
  `waktu_terkirim` datetime DEFAULT NULL COMMENT 'Waktu UTC saat pesan berhasil dikirimkan',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pesan dimasukkan ke outbox dalam transaksi (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan antrean pesan keluar (transactional outbox) untuk menjamin pengiriman notifikasi N-01 s.d. N-20';

CREATE TABLE `atribut_produk` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal definisi atribut produk',
  `kode_atribut` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode unik atribut (mis. UKURAN_POT, VOLUME_MEDIA, WARNA, KEBUTUHAN_CAHAYA, LUBANG_DRAINASE)',
  `nama_atribut` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama tampilan atribut pada detail produk dan filter katalog',
  `tipe_data_atribut` enum('PILIHAN_TUNGGAL','PILIHAN_GANDA','ANGKA_DESIMAL','ANGKA_BULAT','TEKS_PENDEK','BOOLEAN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PILIHAN_TUNGGAL' COMMENT 'Tipe nilai atribut untuk validasi input server',
  `satuan_atribut` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Satuan ukur atribut bila relevan (mis. cm, liter, kg, butir)',
  `dapat_menjadi_pembeda_varian` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Penanda apakah atribut ini boleh dipakai sebagai pembentuk varian SKU',
  `dapat_difilter_di_katalog` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Penanda apakah atribut ini muncul sebagai faset filter di katalog publik',
  `urutan_tampil` int UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Urutan penampilan atribut pada filter dan tabel spesifikasi',
  `status_aktif` enum('AKTIF','NONAKTIF') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AKTIF' COMMENT 'Status aktif atribut',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan master definisi atribut fleksibel untuk produk florist dan gardening goods';

CREATE TABLE `bahan_produksi` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal bahan produksi buket',
  `kode_bahan` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode SKU unik bahan produksi florist (mis. BHN-MAWAR-MERAH, BHN-KERTAS-CELLO)',
  `nama_bahan` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama bahan produksi (bunga potong, filler, wrapping paper, pita, floral foam, kartu)',
  `kelompok_bahan` enum('BUNGA_UTAMA','BUNGA_PENDAMPING_FILLER','DAUN_HIAS_FOLIAGE','KERTAS_PEMBUNGKUS','PITA_DAN_TALI','MEDIA_RANGKAI_FOAM','KARTU_DAN_AKSESORI') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kelompok bahan produksi buket',
  `satuan_bahan` enum('TANGKAI','IKAT','LEMBAR','METER','PCS','BLOK','SET') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TANGKAI' COMMENT 'Satuan ukur pemakaian bahan dalam perangkaian buket',
  `jenis_ketahanan_bahan` enum('SEGAR_MUDAH_LAYU','KERING_AWET','BAHAN_PENDUKUNG_MATI') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SEGAR_MUDAH_LAYU' COMMENT 'Sifat ketahanan bahan untuk pemantauan kesegaran',
  `masa_simpan_hari` int UNSIGNED DEFAULT NULL COMMENT 'Perkiraan masa simpan bahan segar dalam hari',
  `biaya_pokok_satuan_rupiah` bigint UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Harga pokok rata-rata per satuan bahan dalam rupiah',
  `jumlah_stok_bahan` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Total saldo stok bahan produksi tersedia lintas lokasi (tidak boleh negatif)',
  `ambang_stok_rendah` decimal(12,2) NOT NULL DEFAULT '10.00' COMMENT 'Ambang peringatan stok bahan produksi menipis',
  `status_aktif` enum('AKTIF','NONAKTIF') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AKTIF' COMMENT 'Status ketersediaan bahan untuk kustomisasi dan produksi buket',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan master bahan baku produksi buket (terpisah dari stok barang dagangan sesuai Bagian 11.1 & 27.3)';

CREATE TABLE `batas_laju_permintaan` (
  `kunci_batas_laju` char(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Hash SHA-256 dari kombinasi kode endpoint RL-xx dan subjek (IP, email, akun, atau sesi)',
  `awal_jendela_waktu` int UNSIGNED NOT NULL COMMENT 'Detik epoch awal jendela waktu tetap (fixed window)',
  `kode_aturan_rl` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RL_GLOBAL' COMMENT 'Kode aturan rate limit (RL-01 s.d. RL-15)',
  `jumlah_permintaan` int UNSIGNED NOT NULL DEFAULT '1' COMMENT 'Jumlah hit permintaan dalam jendela waktu berjalan',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan hit terakhir (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan penghitung rate limiting terpusat berbasis MySQL untuk menangkal brute force, spam, dan scraping';

CREATE TABLE `batch_persediaan` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal batch persediaan',
  `produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi produk pemilik batch',
  `varian_produk_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi varian produk bila relevan',
  `lokasi_stok_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi lokasi penyimpanan batch',
  `nomor_kode_batch` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode batch/lot dari produsen atau penerimaan barang',
  `tanggal_produksi_atau_emas` date DEFAULT NULL COMMENT 'Tanggal produksi/pengemasan benih atau pupuk',
  `tanggal_kedaluwarsa` date DEFAULT NULL COMMENT 'Tanggal kedaluwarsa untuk pengurutan FEFO (First Expired First Out)',
  `jumlah_awal_batch` int UNSIGNED NOT NULL COMMENT 'Kuantitas awal saat batch diterima',
  `jumlah_tersisa_batch` int NOT NULL DEFAULT '0' COMMENT 'Kuantitas tersisa pada batch ini (tidak boleh negatif)',
  `status_batch` enum('AKTIF','HABIS','KEDALUWARSA_DITARIK') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AKTIF' COMMENT 'Status kelayakan jual batch persediaan',
  `catatan_batch` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Catatan kualitas atau uji daya tumbuh benih',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan informasi batch/lot dan tanggal kedaluwarsa (FEFO) untuk benih, pupuk, dan produk berkebun';

CREATE TABLE `catatan_pesanan` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal catatan pesanan',
  `pesanan_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi pesanan pemilik catatan',
  `penulis_akun_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi akun Admin/SuperAdmin penulis catatan',
  `jenis_catatan` enum('INTERNAL','PERSETUJUAN_PELANGGAN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INTERNAL' COMMENT 'Jenis catatan (INTERNAL tidak ditampilkan ke pelanggan; PERSETUJUAN_PELANGGAN mencatat kesepakatan jadwal/substitusi)',
  `kanal_komunikasi` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Kanal komunikasi kesepakatan pelanggan bila jenis = PERSETUJUAN_PELANGGAN (mis. Email, Telepon, WhatsApp)',
  `waktu_kesepakatan_pelanggan` datetime DEFAULT NULL COMMENT 'Waktu pelanggan memberikan persetujuan eksplisit (Bagian 7.5, 8.5, 9.7)',
  `isi_catatan` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Isi lengkap catatan (5-500 karakter, di-escape saat ditampilkan sesuai 15.4)',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan catatan (UTC, append-only)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan catatan operasional internal dan bukti kesepakatan pelanggan pada pesanan secara append-only';

CREATE TABLE `daftar_keinginan` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal daftar keinginan pelanggan',
  `akun_pengguna_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi akun pelanggan pemilik daftar keinginan',
  `nama_daftar` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Favorit Saya' COMMENT 'Nama koleksi daftar keinginan',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan koleksi daftar keinginan (wishlist) milik pelanggan';

CREATE TABLE `detail_resep_buket` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal detail resep buket',
  `resep_buket_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi resep buket induk',
  `bahan_produksi_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi bahan produksi yang digunakan',
  `kuantitas_bahan` decimal(10,2) NOT NULL COMMENT 'Kuantitas bahan yang dibutuhkan untuk 1 unit buket sesuai resep',
  `catatan_pemakaian` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Catatan posisi atau teknik rangkai komponen bahan',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan rincian kuantitas bahan produksi untuk setiap resep dasar buket';

CREATE TABLE `foto_komplain` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal foto bukti komplain',
  `komplain_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi komplain induk pemilik foto bukti',
  `kunci_penyimpanan_berkas` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kunci objek berkas gambar di storage luar docroot (Lampiran A.4)',
  `urutan_foto` tinyint UNSIGNED NOT NULL DEFAULT '1' COMMENT 'Nomor urut lampiran foto komplain (1 sampai 5 sesuai P-27 & P-42)',
  `keterangan_foto` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Keterangan bagian kerusakan atau kondisi produk pada foto',
  `ukuran_byte` int UNSIGNED DEFAULT NULL COMMENT 'Ukuran berkas foto dalam byte (maksimum 5 MB sesuai P-42)',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pengunggahan foto bukti (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan referensi berkas foto bukti komplain pelanggan (2-5 foto sesuai P-27)';

CREATE TABLE `foto_pengiriman` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal foto bukti pengiriman',
  `pengiriman_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi pengiriman induk pemilik foto',
  `jenis_foto_pengiriman` enum('BUKTI_SERAH_KE_KURIR','BUKTI_TERKIRIM_PENERIMA','BUKTI_KONDISI_PAKET_KEMBALI') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BUKTI_SERAH_KE_KURIR' COMMENT 'Kategori fungsi foto bukti pengiriman',
  `kunci_penyimpanan_berkas` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kunci objek berkas gambar di storage luar docroot (bukan path publik, Lampiran A.4)',
  `keterangan_foto` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Catatan singkat mengenai foto bukti pengiriman',
  `diunggah_oleh_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun Admin pengunggah foto',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pengunggahan foto (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan referensi berkas foto serah kurir (wajib untuk Mudah Layu) dan foto bukti terkirim';

CREATE TABLE `gambar_produk` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal gambar produk',
  `produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi produk pemilik gambar',
  `varian_produk_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi varian spesifik bila foto mewakili warna/ukuran varian tertentu',
  `kunci_penyimpanan_berkas` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kunci berkas gambar di storage luar docroot (nama acak hasil re-encode SEC-09)',
  `teks_alternatif_seo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Teks alt gambar untuk aksesibilitas WCAG 2.1 AA (NFR-06) dan SEO',
  `urutan_tampil` tinyint UNSIGNED NOT NULL DEFAULT '1' COMMENT 'Urutan foto pada galeri produk (1 sampai 8)',
  `status_gambar_utama` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Penanda foto sampul utama produk di katalog',
  `lebar_piksel` int UNSIGNED DEFAULT NULL COMMENT 'Lebar dimensi gambar dalam piksel (maksimum 4000 px sesuai P-42)',
  `tinggi_piksel` int UNSIGNED DEFAULT NULL COMMENT 'Tinggi dimensi gambar dalam piksel (maksimum 4000 px sesuai P-42)',
  `ukuran_byte` int UNSIGNED DEFAULT NULL COMMENT 'Ukuran berkas dalam byte (maksimum 5 MB sesuai P-42)',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan daftar foto galeri produk dan varian (1-8 foto per produk)';

CREATE TABLE `identitas_eksternal` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal identitas eksternal',
  `akun_pengguna_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi akun pengguna yang ditautkan',
  `nama_penyedia` enum('GOOGLE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'GOOGLE' COMMENT 'Nama penyedia identitas OAuth/OIDC',
  `subjek_penyedia_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ID unik sub (subject) dari penyedia OpenID Connect',
  `email_penyedia` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Alamat email terverifikasi dari penyedia identitas',
  `status_email_terverifikasi` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Penanda bahwa email telah diverifikasi oleh penyedia (wajib 1 sesuai SEC-05)',
  `waktu_ditautkan` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu UTC saat identitas eksternal berhasil ditautkan',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan penautan akun pelanggan dengan login eksternal Google OIDC setelah kepemilikan akun terverifikasi';

CREATE TABLE `item_daftar_keinginan` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal item daftar keinginan',
  `daftar_keinginan_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi daftar keinginan induk',
  `produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi produk yang disimpan',
  `varian_produk_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi varian produk bila pelanggan menyimpan varian spesifik',
  `catatan_keinginan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Catatan pribadi pelanggan mengenai produk tersebut',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu produk ditambahkan ke daftar keinginan (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan daftar produk dan varian di dalam daftar keinginan (wishlist) pelanggan';

CREATE TABLE `item_keranjang_belanja` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal baris item keranjang belanja',
  `keranjang_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi keranjang belanja induk',
  `produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi produk yang dimasukkan ke keranjang',
  `varian_produk_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi varian produk yang dipilih (wajib jika produk memiliki varian, Bagian 27.5)',
  `hash_sidik_konfigurasi` char(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'STANDAR' COMMENT 'Hash unik kombinasi varian + konfigurasi buket agar produk yang sama dengan kustomisasi berbeda tidak tertolak indeks unik (Bagian 26.2 & 26.8)',
  `kuantitas` int UNSIGNED NOT NULL DEFAULT '1' COMMENT 'Jumlah unit produk dalam satuan jual (maksimum 20 unit/produk sesuai P-05)',
  `satuan_jual_saat_ini` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PCS' COMMENT 'Satuan jual eksplisit yang tampil di keranjang (Bagian 27.2)',
  `catatan_item` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Catatan khusus pelanggan untuk baris item ini',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu penambahan item ke keranjang (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu perubahan kuantitas/konfigurasi terakhir (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan baris item produk dan varian di keranjang belanja dengan dukungan multi-konfigurasi buket kustom';

CREATE TABLE `item_pesanan` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal baris item pesanan',
  `pesanan_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi pesanan induk',
  `produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi produk katalog (tidak boleh dihapus permanen bila ada di tabel ini, BR-15)',
  `varian_produk_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi varian produk bila pelanggan membeli varian spesifik (Bagian 27.4)',
  `sku_snapshot` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Snapshot kode SKU produk/varian saat pesanan dibuat',
  `nama_produk_snapshot` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Snapshot nama produk saat pesanan dibuat (tidak berubah walau katalog diedit, BR-13)',
  `nama_varian_snapshot` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Snapshot nama varian (mis. Diameter 20 cm, Kemasan 5 Liter)',
  `atribut_varian_snapshot` json DEFAULT NULL COMMENT 'Snapshot rincian pasangan atribut varian dan spesifikasi penting saat pembelian (Bagian 27.4)',
  `satuan_jual_snapshot` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PCS' COMMENT 'Snapshot satuan jual eksplisit (PCS, POT, LITER, BUKET, dll., Bagian 27.2)',
  `jenis_produk_snapshot` enum('PRODUK_STANDAR','BUKET_KUSTOM','TANAMAN_HIAS','PERLENGKAPAN_BERKEBUN','BENIH_DAN_PUPUK','PAKET_BERKEBUN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PRODUK_STANDAR' COMMENT 'Snapshot klasifikasi jenis produk saat checkout',
  `jenis_penanganan_snapshot` enum('MUDAH_LAYU','TAHAN_LAMA') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Snapshot jenis penanganan produk (MUDAH_LAYU atau TAHAN_LAMA)',
  `deskripsi_penting_snapshot` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Snapshot ringkasan spesifikasi/isi paket penting saat pembelian (Bagian 27.4 & 27.5)',
  `harga_normal_satuan_snapshot` bigint UNSIGNED NOT NULL COMMENT 'Snapshot harga dasar satuan sebelum diskon produk (rupiah)',
  `harga_diskon_satuan_snapshot` bigint UNSIGNED DEFAULT NULL COMMENT 'Snapshot harga diskon satuan bila produk sedang promo saat checkout',
  `tambahan_harga_kustomisasi_satuan` bigint NOT NULL DEFAULT '0' COMMENT 'Tambahan harga per unit dari opsi kustomisasi buket bila jenis_produk = BUKET_KUSTOM',
  `harga_satuan_final_snapshot` bigint UNSIGNED NOT NULL COMMENT 'Harga satuan final terkunci (setelah diskon + kustomisasi buket) dalam rupiah',
  `berat_satuan_gram_snapshot` int UNSIGNED NOT NULL DEFAULT '100' COMMENT 'Snapshot berat per unit dalam gram',
  `kuantitas` int UNSIGNED NOT NULL COMMENT 'Kuantitas unit yang dipesan dalam satuan_jual_snapshot (1-20 sesuai P-05)',
  `subtotal_baris_rupiah` bigint UNSIGNED NOT NULL COMMENT 'Total harga baris (harga_satuan_final_snapshot * kuantitas) dalam bilangan bulat rupiah',
  `produk_pengganti_substitusi_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi produk asli sebelum substitusi bila terjadi penggantian item yang disetujui pelanggan pada T-15 (PH-01/PH-06)',
  `catatan_substitusi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Catatan kesepakatan substitusi produk bila baris ini diubah melalui transisi T-15',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan baris (hanya diizinkan saat substitusi T-15)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan baris item pesanan beserta snapshot permanen nama, SKU, varian, satuan, dan harga saat pembelian';

CREATE TABLE `kategori_pilihan_buket` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal kategori pilihan kustomisasi buket',
  `kode_kategori_pilihan` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode unik kelompok pilihan (mis. BUNGA_UTAMA, WARNA_WRAP, PITA, HIASAN_TAMBAHAN)',
  `nama_kategori_pilihan` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama kelompok opsi yang tampil di layar kustomisasi buket',
  `deskripsi_panduan_pilih` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Petunjuk pemilihan opsi bagi pelanggan',
  `jenis_pemilihan` enum('PILIH_SATU','PILIH_BANYAK') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PILIH_SATU' COMMENT 'Apakah pelanggan memilih tepat satu opsi atau kombinasi beberapa opsi',
  `wajib_dipilih_default` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Penanda default apakah kategori opsi ini wajib diisi',
  `batas_minimum_pilihan_default` int UNSIGNED NOT NULL DEFAULT '1' COMMENT 'Jumlah minimum kuantitas/opsi yang dipilih pada kelompok ini',
  `batas_maksimum_pilihan_default` int UNSIGNED NOT NULL DEFAULT '1' COMMENT 'Jumlah maksimum kuantitas/opsi yang boleh dipilih pada kelompok ini',
  `urutan_tampil` int UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Urutan langkah pemilihan pada antarmuka kustomisasi buket',
  `status_aktif` enum('AKTIF','NONAKTIF') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AKTIF' COMMENT 'Status aktif kategori pilihan buket',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan kelompok/kategori opsi kustomisasi buket (bunga utama, pembungkus, pita, tambahan)';

CREATE TABLE `kategori_pilihan_produk` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal pemetaan kategori pilihan ke produk',
  `produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi produk buket yang mendukung kustomisasi',
  `kategori_pilihan_buket_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi kategori pilihan buket yang diizinkan (sesuai Bagian 26.4)',
  `wajib_dipilih` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Apakah kategori opsi ini wajib dipilih pada produk tersebut',
  `batas_minimum_pilihan` int UNSIGNED NOT NULL DEFAULT '1' COMMENT 'Jumlah minimum pilihan/kuantitas untuk produk ini',
  `batas_maksimum_pilihan` int UNSIGNED NOT NULL DEFAULT '1' COMMENT 'Jumlah maksimum pilihan/kuantitas untuk produk ini',
  `urutan_tampil` int UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Urutan langkah kustomisasi khusus pada produk ini',
  `status_aktif` enum('AKTIF','NONAKTIF') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AKTIF' COMMENT 'Status aktif keterkaitan kategori opsi dengan produk',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menghubungkan produk buket kustom dengan kategori pilihan yang boleh dikonfigurasi pelanggan';

CREATE TABLE `kategori_produk` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal kategori produk',
  `kategori_induk_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi kategori induk untuk mendukung struktur pohon subkategori',
  `kode_kategori` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode unik kategori untuk referensi sistem',
  `nama_kategori` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama tampilan kategori (mis. Buket & Florist, Pot & Vas, Media Tanam, Benih)',
  `slug_kategori` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Slug URL bersih untuk SEO dan halaman kategori publik (NFR-07)',
  `kelompok_domain` enum('FLORIST_DAN_BUKET','POT_DAN_VAS','MEDIA_TANAM','TANAH_DAN_KOMPOS','PUPUK_DAN_PERAWATAN','ALAT_BERKEBUN','BENIH_DAN_BIJI','TANAMAN_HIAS','PERLENGKAPAN_DEKORASI','PAKET_BERKEBUN') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kelompok besar domain produk sesuai Bagian 27.1',
  `deskripsi_kategori` text COLLATE utf8mb4_unicode_ci COMMENT 'Deskripsi kategori untuk landing page kategori dan meta SEO',
  `url_gambar_banner` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Kunci/path gambar banner kategori',
  `urutan_tampil` int UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Urutan penampilan kategori di navigasi dan beranda',
  `status_aktif` enum('AKTIF','NONAKTIF') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AKTIF' COMMENT 'Status tampil kategori di katalog publik',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan master kategori dan subkategori produk florist serta perlengkapan berkebun (gardening goods)';

CREATE TABLE `kebutuhan_bahan_buket_pesanan` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal kebutuhan bahan buket pesanan',
  `pesanan_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi pesanan terkait',
  `konfigurasi_buket_pesanan_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi konfigurasi buket pesanan (sesuai Bagian 26.4)',
  `bahan_produksi_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi bahan produksi yang dibutuhkan (sesuai Bagian 26.4)',
  `nama_bahan_snapshot` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Snapshot nama bahan produksi saat pesanan dihitung',
  `satuan_bahan_snapshot` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Snapshot satuan bahan produksi (TANGKAI, LEMBAR, METER, dll.)',
  `kuantitas_per_unit_buket` decimal(10,2) NOT NULL COMMENT 'Kebutuhan bahan untuk 1 unit buket kustom',
  `kuantitas_buket_dipesan` int UNSIGNED NOT NULL DEFAULT '1' COMMENT 'Jumlah unit buket pada baris item pesanan tersebut',
  `total_kuantitas_bahan_dibutuhkan` decimal(12,2) NOT NULL COMMENT 'Total bahan yang dibutuhkan (kuantitas_per_unit_buket * kuantitas_buket_dipesan)',
  `total_kuantitas_bahan_terpakai_aktual` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Jumlah bahan yang benar-benar telah dipotong dari stok bahan produksi',
  `status_alokasi_bahan` enum('DIHITUNG','DIALOKASIKAN','TERPAKAI_PRODUKSI','DIBATALKAN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DIHITUNG' COMMENT 'Status pemenuhan bahan baku untuk buket pesanan ini',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu perhitungan kebutuhan bahan (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan status alokasi bahan (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mencatat perhitungan kebutuhan bahan produksi untuk merangkai buket dalam pesanan';

CREATE TABLE `kebutuhan_bahan_opsi_buket` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal pemetaan kebutuhan bahan opsi buket',
  `opsi_pilihan_buket_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi opsi pilihan buket (sesuai Bagian 26.4)',
  `bahan_produksi_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi bahan produksi yang dibutuhkan oleh opsi ini (sesuai Bagian 26.4)',
  `kuantitas_bahan_per_opsi` decimal(10,2) NOT NULL DEFAULT '1.00' COMMENT 'Jumlah bahan produksi yang terpakai setiap 1 unit opsi dipilih',
  `persentase_cadangan_susut` decimal(5,2) NOT NULL DEFAULT '0.00' COMMENT 'Persentase toleransi susut bahan bila diperlukan',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Memetakan setiap opsi pilihan buket ke jenis dan kuantitas bahan produksi yang diperlukan';

CREATE TABLE `keranjang` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal keranjang belanja',
  `akun_pengguna_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun pelanggan pemilik keranjang (nullable untuk sinkronisasi keranjang tamu sebelum digabung, Bagian 26.5)',
  `token_keranjang_tamu` char(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Hash pengenal sesi keranjang tamu sebelum digabung ke akun saat login',
  `status_keranjang` enum('AKTIF','DIGABUNGKAN','DIKONVERSI_PESANAN','KEDALUWARSA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AKTIF' COMMENT 'Status siklus hidup keranjang belanja',
  `waktu_aktivitas_terakhir` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu perubahan isi keranjang terakhir untuk pembersihan otomatis P-25',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan header keranjang belanja pelanggan (harga tidak disimpan permanen dan stok tidak dicadangkan di keranjang)';

CREATE TABLE `kode_verifikasi` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal kode verifikasi',
  `akun_pengguna_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi akun pengguna pemilik kode/token',
  `tujuan_verifikasi` enum('VERIFIKASI_EMAIL_REGISTRASI','VERIFIKASI_PERUBAHAN_EMAIL','PEMULIHAN_KATA_SANDI','AKTIVASI_AKUN_ADMIN','TAUTAN_AKUN_GOOGLE') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tujuan penggunaan kode atau token verifikasi',
  `email_tujuan` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Alamat email tujuan pengiriman kode (penting saat perubahan email baru)',
  `hash_kode_atau_token` char(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Hash SHA-256 dari kode 6 digit atau token pemulihan/aktivasi sekali pakai',
  `jumlah_percobaan_salah` int UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Jumlah kesalahan input kode (maksimum 5 kali sesuai P-29 dan RL-06)',
  `batas_maksimum_percobaan` int UNSIGNED NOT NULL DEFAULT '5' COMMENT 'Batas maksimum kesalahan sebelum kode otomatis dibatalkan',
  `waktu_kedaluwarsa` datetime NOT NULL COMMENT 'Batas waktu berlaku kode (10 menit P-29, 15 menit P-30, 24 jam P-33)',
  `waktu_digunakan` datetime DEFAULT NULL COMMENT 'Waktu UTC saat kode/token berhasil dipakai (sekali pakai)',
  `waktu_dibatalkan` datetime DEFAULT NULL COMMENT 'Waktu UTC saat kode dibatalkan karena melampaui batas salah atau diganti kode baru',
  `alamat_ip_peminta` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Alamat IP klien saat meminta pembuatan kode',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan hash kode OTP verifikasi email, token lupa kata sandi, dan tautan aktivasi akun staf';

CREATE TABLE `komplain` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal komplain pesanan',
  `nomor_tiket_komplain` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nomor referensi tiket komplain pelanggan',
  `pesanan_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi pesanan yang dikomplain',
  `item_pesanan_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi item pesanan spesifik yang terdampak bila komplain bersifat per item',
  `akun_pengguna_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi akun pelanggan pengaju komplain (sesuai Bagian 26.4)',
  `kategori_komplain` enum('LAYU','RUSAK','SALAH_PESANAN','KURANG_ITEM','TERLAMBAT','TIDAK_DITERIMA') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kategori komplain sesuai Bagian 10.4 dan Lampiran A.3',
  `deskripsi_keluhan` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Penjelasan rinci keluhan dari pelanggan (wajib diisi)',
  `status_komplain` enum('DIAJUKAN','DALAM_TINJAUAN','DISETUJUI','DITOLAK','DIESKALASI','SELESAI') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DIAJUKAN' COMMENT 'Status alur penanganan komplain sesuai Bagian 8.4 dan Lampiran A.3',
  `pihak_bertanggung_jawab` enum('BELUM_DITETAPKAN','TOKO_PEMENUHAN','KURIR_PENGIRIMAN','PELANGGAN','KEADAAN_LUAR_KENDALI') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BELUM_DITETAPKAN' COMMENT 'Penetapan matriks tanggung jawab kegagalan sesuai Bagian 10.7',
  `jenis_resolusi` enum('BELUM_DIPUTUSKAN','KIRIM_PENGGANTI_TANPA_BIAYA','REFUND_SEBAGIAN','REFUND_PENUH','DITOLAK_DENGAN_ALASAN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BELUM_DIPUTUSKAN' COMMENT 'Bentuk keputusan penyelesaian komplain (Bagian 10.4)',
  `nominal_refund_disetujui_rupiah` bigint UNSIGNED DEFAULT NULL COMMENT 'Nominal refund yang disetujui bila resolusi adalah REFUND_SEBAGIAN atau REFUND_PENUH',
  `diputuskan_oleh_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun Admin yang memberikan keputusan awal komplain',
  `alasan_keputusan_admin` text COLLATE utf8mb4_unicode_ci COMMENT 'Penjelasan tertulis keputusan Admin kepada pelanggan',
  `jumlah_pengajuan_banding` tinyint UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Jumlah banding yang diajukan pelanggan (maksimum 1 kali dalam 24 jam sesuai P-17)',
  `alasan_banding_pelanggan` text COLLATE utf8mb4_unicode_ci COMMENT 'Alasan tertulis pelanggan saat mengajukan banding atas penolakan komplain',
  `waktu_banding_diajukan` datetime DEFAULT NULL COMMENT 'Waktu UTC pelanggan mengajukan banding (dalam batas P-17 = 24 jam sejak ditolak)',
  `pemutus_banding_superadmin_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun SuperAdmin pemutus akhir banding (keputusan bersifat final, Bagian 10.4)',
  `keputusan_akhir_banding` text COLLATE utf8mb4_unicode_ci COMMENT 'Alasan tertulis keputusan final banding oleh SuperAdmin',
  `batas_waktu_respons_awal` datetime NOT NULL COMMENT 'Batas waktu respons pertama Admin maksimum 24 jam sejak diajukan (P-12)',
  `waktu_respons_pertama` datetime DEFAULT NULL COMMENT 'Waktu UTC Admin pertama kali merespons komplain',
  `waktu_ditolak_awal` datetime DEFAULT NULL COMMENT 'Waktu UTC saat komplain ditolak Admin (awal jendela banding 24 jam P-17)',
  `waktu_selesai_komplain` datetime DEFAULT NULL COMMENT 'Waktu UTC komplain dinyatakan SELESAI (memicu pesanan menjadi SELESAI sesuai T-13)',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pengajuan komplain (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir komplain (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan komplain pasca-penerimaan (jendela P-11), penetapan tanggung jawab 10.7, dan banding satu kali (P-17)';

CREATE TABLE `komponen_paket_berkebun` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal komponen paket berkebun',
  `produk_paket_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi produk induk yang berjenis PAKET_BERKEBUN',
  `produk_komponen_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi produk penyusun di dalam paket (mis. pot, media tanam, benih)',
  `varian_komponen_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi varian spesifik komponen bila produk komponen memiliki varian',
  `kuantitas_komponen` int UNSIGNED NOT NULL DEFAULT '1' COMMENT 'Jumlah unit komponen yang dibutuhkan dalam 1 paket berkebun',
  `satuan_komponen` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PCS' COMMENT 'Satuan komponen penyusun paket',
  `catatan_komponen` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Keterangan peran komponen dalam paket starter kit',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan rincian komponen penyusun paket berkebun (starter kit) untuk alokasi stok komponen secara atomik';

CREATE TABLE `konfigurasi_buket_keranjang` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal konfigurasi buket di keranjang',
  `item_keranjang_belanja_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi baris item keranjang belanja (sesuai Bagian 26.4)',
  `nama_label_buket_pelanggan` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nama julukan buket kustom yang diberikan pelanggan bila ada',
  `tema_warna_dominan` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tema nuansa warna pilihan pelanggan (mis. Pastel Pink, Sage Botanical)',
  `pesan_kartu_ucapan_buket` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Isi kartu ucapan khusus untuk buket ini (maks 200 karakter, P-10)',
  `nama_pengirim_kartu_buket` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nama pengirim pada kartu ucapan buket (boleh kosong untuk anonim)',
  `catatan_perangkai` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Instruksi preferensi rangkaian untuk florist',
  `estimasi_tambahan_harga_opsi_rupiah` bigint NOT NULL DEFAULT '0' COMMENT 'Total tambahan harga opsi saat terakhir dihitung server (wajib dihitung ulang saat checkout)',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan header konfigurasi buket kustom yang masih berada di dalam keranjang belanja';

CREATE TABLE `konfigurasi_buket_pesanan` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal konfigurasi buket pada pesanan',
  `item_pesanan_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi baris item pesanan induk',
  `nama_label_buket_snapshot` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Snapshot nama label buket kustom dari pelanggan',
  `tema_warna_dominan_snapshot` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Snapshot tema warna pilihan pelanggan',
  `pesan_kartu_ucapan_buket_snapshot` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Snapshot pesan kartu ucapan khusus buket',
  `nama_pengirim_kartu_buket_snapshot` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Snapshot nama pengirim kartu ucapan buket',
  `catatan_perangkai_snapshot` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Snapshot instruksi khusus untuk staf perangkai florist',
  `harga_dasar_buket_snapshot_rupiah` bigint UNSIGNED NOT NULL COMMENT 'Snapshot harga dasar produk buket sebelum tambahan opsi (rupiah)',
  `total_tambahan_opsi_snapshot_rupiah` bigint NOT NULL DEFAULT '0' COMMENT 'Snapshot total tambahan harga seluruh opsi buket per 1 unit buket (rupiah)',
  `harga_akhir_per_buket_snapshot_rupiah` bigint UNSIGNED NOT NULL COMMENT 'Snapshot harga final 1 unit buket kustom (rupiah)',
  `ringkasan_konfigurasi_json` json DEFAULT NULL COMMENT 'Snapshot JSON utuh seluruh konfigurasi untuk kemudahan audit dan cetak instruksi kerja',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan snapshot (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan snapshot permanen konfigurasi buket kustom pada item pesanan';

CREATE TABLE `kunci_pekerjaan_terjadwal` (
  `nama_pekerjaan` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama unik pekerjaan terjadwal sesuai Lampiran A.8 (mis. expire-orders, expire-stock-reservations)',
  `jadwal_cron_ekspresi` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Deskripsi jadwal eksekusi cron (mis. Tiap menit, Tiap 5 menit, 02:00 WIB)',
  `status_eksekusi_terakhir` enum('IDLE','SEDANG_BERJALAN','BERHASIL','GAGAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IDLE' COMMENT 'Status eksekusi terakhir untuk pemantauan NFR-09 dan 15.10',
  `dikunci_oleh_instance` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Identitas host/PID worker PHP CLI yang sedang memegang kunci eksekusi',
  `waktu_mulai_kunci` datetime DEFAULT NULL COMMENT 'Waktu UTC pekerjaan mulai dikunci',
  `waktu_kedaluwarsa_kunci` datetime DEFAULT NULL COMMENT 'Batas waktu kunci otomatis lepas bila proses worker mati mendadak',
  `waktu_berhasil_terakhir` datetime DEFAULT NULL COMMENT 'Waktu UTC terakhir kali pekerjaan selesai dengan sukses',
  `waktu_gagal_terakhir` datetime DEFAULT NULL COMMENT 'Waktu UTC terakhir kali pekerjaan mengalami kegagalan',
  `ringkasan_hasil_terakhir` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Ringkasan jumlah item yang diproses atau pesan error terakhir',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan status terakhir (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan penguncian eksekusi (job lock) dan status kesehatan 21 pekerjaan terjadwal (cron PHP CLI Lampiran A.8)';

CREATE TABLE `log_audit` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID monoton urut entri audit log',
  `waktu_kejadian` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu UTC tindakan terjadi',
  `jenis_pelaku` enum('PENGGUNA','SISTEM','GATEWAY_PEMBAYARAN','KURIR') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENGGUNA' COMMENT 'Kategori pelaku tindakan',
  `pelaku_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun pengguna/staf pelaku tindakan (NULL bila Sistem/Gateway)',
  `peran_pelaku` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Peran pelaku saat tindakan dilakukan (CUSTOMER, ADMIN, SUPERADMIN, SYSTEM, GATEWAY)',
  `kode_tindakan` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode tindakan yang dilakukan (mis. TRANSISI_STATUS_PESANAN, UBAH_HARGA_PRODUK, KEPUTUSAN_REFUND, UBAH_PARAMETER, AKSES_AUDIT_LOG)',
  `jenis_objek` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama entitas/tabel objek yang terdampak',
  `id_objek` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ID objek yang terdampak',
  `nilai_sebelum_json` json DEFAULT NULL COMMENT 'Snapshot nilai objek sebelum perubahan (JSON)',
  `nilai_sesudah_json` json DEFAULT NULL COMMENT 'Snapshot nilai objek sesudah perubahan (JSON)',
  `alasan_tindakan` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Alasan tertulis yang disertakan saat melakukan tindakan',
  `hasil_tindakan` enum('BERHASIL','GAGAL','DITOLAK') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BERHASIL' COMMENT 'Hasil eksekusi tindakan',
  `alamat_ip_pelaku` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '127.0.0.1' COMMENT 'Alamat IP klien pelaku tindakan (client_ip)',
  `id_permintaan` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ID korelasi request HTTP bila berasal dari permintaan web/API',
  `hash_sebelumnya` char(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Hash SHA-256 dari baris log_audit sebelumnya (GENESIS_000... untuk baris pertama)',
  `hash_entri` char(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Hash SHA-256 rantai integritas: SHA2(CONCAT(hash_sebelumnya, isi_entri), 256) (Bagian 13.3 & A.4)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catatan audit append-only berantai hash SHA-256 yang tidak boleh diubah atau dihapus oleh siapa pun (BR-12, SEC-14)';

CREATE TABLE `log_peristiwa_keamanan` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal catatan peristiwa keamanan',
  `id_permintaan` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ID korelasi permintaan HTTP (request_id) untuk penelusuran insiden',
  `tingkat_keparahan` enum('INFO','WARNING','ERROR','CRITICAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WARNING' COMMENT 'Tingkat keparahan peristiwa keamanan',
  `jenis_peristiwa` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode jenis peristiwa (LOGIN_GAGAL, BATAS_LAJU_TERLAMPAUI, CSRF_GAGAL, AKSES_DITOLAK_403, PERCOBAAN_IDOR_404, WEBHOOK_TIDAK_VALID, UNGGAH_DITOLAK)',
  `akun_pengguna_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun pengguna bila permintaan terautentikasi',
  `peran_pengguna` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Peran pengguna saat peristiwa terjadi',
  `alamat_ip_klien` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Alamat IP klien asli hasil evaluasi fungsi client_ip() (BR-32)',
  `rute_atau_endpoint` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Path URL atau rute endpoint tempat peristiwa terjadi',
  `metode_http` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Metode HTTP permintaan (GET, POST, PUT, PATCH, DELETE)',
  `rincian_konteks` json DEFAULT NULL COMMENT 'Metadata non-sensitif peristiwa (tanpa kata sandi, token, atau nomor rekening)',
  `waktu_kejadian` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu UTC terjadinya peristiwa keamanan'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan log peristiwa keamanan terstruktur untuk pemantauan serangan dan pemicu peringatan N-18';

CREATE TABLE `lokasi_stok` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal lokasi stok',
  `kode_lokasi` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode unik lokasi penyimpanan (mis. TOKO-UTAMA, GUDANG-KEBUN, NURSERY-01)',
  `nama_lokasi` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama lengkap lokasi penyimpanan stok',
  `jenis_lokasi` enum('TOKO_UTAMA','GUDANG_PENYIMPANAN','RUMAH_KACA_NURSERY','STUDIO_FLORIST') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TOKO_UTAMA' COMMENT 'Jenis fungsi lokasi persediaan',
  `alamat_lokasi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Alamat fisik lokasi penyimpanan',
  `status_lokasi_default_jual` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Penanda lokasi utama pemenuhan pesanan pelanggan',
  `status_aktif` enum('AKTIF','NONAKTIF') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AKTIF' COMMENT 'Status operasional lokasi stok',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan master lokasi penyimpanan stok barang dagangan dan bahan produksi buket';

CREATE TABLE `nilai_atribut_produk` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal nilai atribut produk',
  `produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi produk pemilik spesifikasi',
  `atribut_produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi definisi atribut',
  `pilihan_atribut_produk_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi opsi pilihan bila atribut bertipe pilihan terkontrol',
  `nilai_teks` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nilai teks bebas bila atribut bertipe TEKS_PENDEK',
  `nilai_angka` decimal(12,2) DEFAULT NULL COMMENT 'Nilai numerik bila atribut bertipe ANGKA_DESIMAL atau ANGKA_BULAT',
  `nilai_boolean` tinyint(1) DEFAULT NULL COMMENT 'Nilai 1/0 bila atribut bertipe BOOLEAN (mis. Memiliki Lubang Drainase = 1)',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan nilai atribut spesifikasi deskriptif pada tingkat produk';

CREATE TABLE `nilai_atribut_varian` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal nilai atribut varian',
  `varian_produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi varian produk',
  `atribut_produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi atribut pembeda varian (mis. Ukuran, Warna, Volume)',
  `pilihan_atribut_produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi nilai pilihan atribut untuk varian ini',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan kombinasi atribut yang membedakan satu varian produk dari varian lainnya';

CREATE TABLE `notifikasi` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal notifikasi pengguna',
  `akun_pengguna_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi akun penerima notifikasi (sesuai Bagian 26.4)',
  `antrean_keluar_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi baris antrean keluar sumber notifikasi',
  `kode_notifikasi` enum('N_01','N_02','N_03','N_04','N_05','N_06','N_07','N_08','N_09','N_10','N_11','N_12','N_13','N_14','N_15','N_16','N_17','N_18','N_19','N_20') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode jenis notifikasi N-01 s.d. N-20 (Bagian 14)',
  `kanal_notifikasi` enum('EMAIL','DASBOR_INTERNAL','WHATSAPP_OPSIONAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EMAIL' COMMENT 'Kanal pengiriman notifikasi',
  `judul_notifikasi` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Judul ringkas notifikasi',
  `isi_ringkasan` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ringkasan isi pemberitahuan yang aman ditampilkan di dasbor/aplikasi',
  `tautan_tujuan_internal` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Path internal terkait objek notifikasi (mis. detail pesanan atau antrean PH)',
  `status_kirim` enum('DIANTREKAN','TERKIRIM','GAGAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TERKIRIM' COMMENT 'Status pengiriman notifikasi',
  `status_sudah_dibaca` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Penanda apakah penerima sudah membaca notifikasi di dasbor',
  `waktu_dibaca` datetime DEFAULT NULL COMMENT 'Waktu UTC saat notifikasi dibaca',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan notifikasi (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan riwayat notifikasi transaksional pelanggan dan peringatan internal dasbor staf (N-01 s.d. N-20)';

CREATE TABLE `opsi_pilihan_buket` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal opsi pilihan buket',
  `kategori_pilihan_buket_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi kategori pilihan buket induk (sesuai Bagian 26.4)',
  `kode_opsi` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode unik opsi pilihan buket',
  `nama_opsi` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama opsi pilihan (mis. Mawar Merah Premium, Kertas Cellophane Sage Green)',
  `deskripsi_opsi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Keterangan singkat karakteristik opsi buket',
  `tambahan_harga_rupiah` bigint NOT NULL DEFAULT '0' COMMENT 'Penyesuaian harga per unit opsi dalam bilangan bulat rupiah (dihitung di server, Bagian 26.2)',
  `batas_maksimum_kuantitas_per_buket` int UNSIGNED NOT NULL DEFAULT '10' COMMENT 'Batas maksimum kuantitas opsi ini di dalam satu buket kustom',
  `kunci_gambar_pratinjau` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Kunci berkas gambar untuk pratinjau visual kustomisasi buket',
  `urutan_tampil` int UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Urutan tampil opsi di dalam kategorinya',
  `status_aktif` enum('AKTIF','NONAKTIF') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AKTIF' COMMENT 'Status aktif opsi pilihan buket',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan daftar pilihan opsi kustomisasi buket beserta tambahan harga satuannya';

CREATE TABLE `pengaturan_sistem` (
  `kunci_parameter` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kunci stabil parameter pada kode (mis. payment.window_minutes, sesuai catatan Lampiran A.3)',
  `kode_register_parameter` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode identifikasi dokumen (P-01 s.d. P-46 pada Bagian 19)',
  `nama_parameter` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama deskriptif parameter sistem',
  `nilai_parameter_json` json NOT NULL COMMENT 'Nilai konfigurasi aktif dalam format JSON terstruktur',
  `deskripsi_aturan` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Penjelasan fungsi, satuan, dan batasan invariant parameter',
  `dapat_diubah_saat_runtime` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Apakah parameter dapat diubah melalui panel SuperAdmin (BR-29)',
  `diperbarui_oleh_superadmin_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun SuperAdmin pengubah terakhir',
  `alasan_perubahan_terakhir` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Alasan tertulis perubahan parameter terakhir',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir parameter (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan konfigurasi baseline Register Parameter P-01 sampai P-46 yang dikelola oleh SuperAdmin';

CREATE TABLE `pengembalian_dana` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal pengembalian dana (refund)',
  `nomor_referensi_refund` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nomor dokumen internal pengembalian dana',
  `pesanan_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi pesanan terkait',
  `percobaan_pembayaran_pesanan_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi transaksi pembayaran asal yang dananya dikembalikan (sesuai Bagian 26.4)',
  `komplain_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi komplain terkait bila refund berasal dari resolusi komplain',
  `sebab_refund` enum('BATAL_SIAP_DIPROSES','BATAL_DISETUJUI','BATAL_TOKO','PH_PENUH','PH_SEBAGIAN','PH_TIMEOUT','PEMBAYARAN_GANDA','KELEBIHAN_BAYAR','HILANG_RUSAK','KOMPLAIN','RETUR_LAYAK','PEMBAYARAN_TERLAMBAT') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode penyebab refund sesuai Lampiran A.3 dan tabel Bagian 10.3',
  `nominal_refund_produk_rupiah` bigint UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Komponen nominal pengembalian harga produk dalam rupiah',
  `nominal_refund_ongkir_rupiah` bigint UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Komponen nominal pengembalian ongkos kirim dalam rupiah',
  `total_nominal_refund_rupiah` bigint UNSIGNED NOT NULL COMMENT 'Total dana yang dikembalikan (nominal_refund_produk_rupiah + nominal_refund_ongkir_rupiah > 0)',
  `status_refund` enum('DIAJUKAN','DITOLAK','DISETUJUI','DIPROSES','BERHASIL','GAGAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DIAJUKAN' COMMENT 'Status alur refund sesuai Bagian 8.4 dan Lampiran A.3',
  `jenis_persetujuan` enum('OTOMATIS_SISTEM','MANUAL_MAKER_CHECKER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MANUAL_MAKER_CHECKER' COMMENT 'Apakah refund disetujui otomatis oleh aturan sistem atau manual oleh staf berwenang',
  `diajukan_oleh_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun staf/pelanggan pengaju refund (NULL bila diajukan otomatis oleh Sistem)',
  `disetujui_oleh_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun Admin/SuperAdmin penyetuju (wajib berbeda dari pengaju sesuai BR-17; > Rp500.000 P-18 wajib SuperAdmin)',
  `dasar_atau_alasan_keputusan` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Dasar aturan otomatis atau alasan tertulis persetujuan/penolakan refund',
  `metode_pengembalian` enum('METODE_ASAL_GATEWAY','TRANSFER_BANK_MANUAL','E_WALLET_MANUAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'METODE_ASAL_GATEWAY' COMMENT 'Metode penyaluran dana refund kepada pelanggan',
  `referensi_refund_gateway` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ID referensi transaksi refund dari payment gateway atau bukti transfer bank',
  `info_rekening_terenkripsi` varbinary(1024) DEFAULT NULL COMMENT 'Data rekening/e-wallet tujuan refund yang dienkripsi dengan APP_KEY (SEC-12, Bagian 15.7)',
  `waktu_hapus_info_rekening` datetime DEFAULT NULL COMMENT 'Jadwal penghapusan otomatis data rekening 30 hari setelah refund berhasil (P-21 & BR-28)',
  `jumlah_percobaan_eksekusi` tinyint UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Jumlah percobaan pengiriman instruksi refund ke gateway (maksimum 3 kali otomatis sesuai P-20)',
  `waktu_percobaan_berikutnya` datetime DEFAULT NULL COMMENT 'Jadwal percobaan ulang otomatis refund gagal (backoff dalam 24 jam, P-20)',
  `masuk_antrean_manual` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Penanda bahwa refund gagal 3x dan masuk antrean penyelesaian manual Admin/SuperAdmin (EX-27)',
  `batas_waktu_target_selesai` datetime DEFAULT NULL COMMENT 'Target penyelesaian pemrosesan refund maksimum 3 hari kerja sejak disetujui (P-19)',
  `waktu_disetujui` datetime DEFAULT NULL COMMENT 'Waktu UTC refund disetujui',
  `waktu_berhasil_atau_selesai` datetime DEFAULT NULL COMMENT 'Waktu UTC dana refund terkonfirmasi berhasil dikembalikan',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan pengajuan refund (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir refund (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan transaksi pengembalian dana (refund), validasi maker-checker (BR-17), dan enkripsi rekening tujuan';

CREATE TABLE `pengiriman` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal pengiriman paket',
  `pesanan_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi pesanan yang dikirim',
  `nomor_urut_pengiriman` tinyint UNSIGNED NOT NULL DEFAULT '1' COMMENT 'Nomor urut pengiriman (1 = pengiriman awal, >1 = pengiriman ulang T-16 / PH-04 / PH-05)',
  `kode_kurir` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode penyedia kurir (mis. GOSEND, GRABEXPRESS, JNE)',
  `nama_layanan_kurir` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Layanan kurir yang digunakan',
  `nomor_resi_atau_referensi` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nomor resi ekspedisi atau kode order/URL pelacakan kurir instan (wajib saat T-09 sesuai BR-26)',
  `tautan_pelacakan_langsung` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'URL live tracking kurir instan bila tersedia',
  `status_pengiriman` enum('BELUM_DISERAHKAN','DALAM_PENGIRIMAN','TERKENDALA','TERKIRIM','DIKEMBALIKAN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BELUM_DISERAHKAN' COMMENT 'Status dimensi pengiriman sesuai Bagian 8.3 dan Lampiran A.3',
  `alasan_kendala_pengiriman` enum('ALAMAT_TIDAK_DITEMUKAN','PENERIMA_TIDAK_ADA','KURIR_GAGAL','BARANG_RUSAK','BARANG_HILANG') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Alasan wajib saat status_pengiriman = TERKENDALA (Bagian 8.3 & A.3)',
  `keterangan_kendala` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Catatan detail kendala pengantaran atau hasil investigasi kurir (PH-04 / PH-05)',
  `jumlah_percobaan_antar` tinyint UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Jumlah upaya pengantaran (untuk Mudah Layu maksimum P-14 = 1 kali ulang di hari yang sama)',
  `diserahkan_oleh_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun Admin yang menyerahkan paket kepada kurir (T-09)',
  `waktu_diserahkan_ke_kurir` datetime DEFAULT NULL COMMENT 'Waktu UTC paket diserahkan ke kurir (T-09)',
  `kunci_foto_serah_utama` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Kunci berkas foto utama kondisi paket saat diserahkan ke kurir (wajib untuk Mudah Layu, P-27 & BR-26)',
  `waktu_terkirim` datetime DEFAULT NULL COMMENT 'Waktu UTC paket tiba di tangan penerima (T-12)',
  `nama_penerima_aktual` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nama penerima paket di lokasi tujuan',
  `kunci_bukti_terkirim_utama` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Kunci berkas foto bukti paket diterima dari kurir atau Admin',
  `waktu_dikembalikan_ke_toko` datetime DEFAULT NULL COMMENT 'Waktu UTC paket retur tiba kembali di toko',
  `hasil_inspeksi_paket_kembali` enum('BELUM_DIPERIKSA','LAYAK_JUAL_RESTOK','RUSAK_ATAU_LAYU_BUANG') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Hasil checklist pemeriksaan fisik paket kembali oleh Admin (Bagian 11.4)',
  `diperiksa_oleh_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun Admin pemeriksa kelayakan paket kembali',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris pengiriman (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir pengiriman (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan data pengiriman paket, kurir, nomor resi, bukti serah terima, dan penanganan retur (Bagian 9)';

CREATE TABLE `percobaan_pembayaran_pesanan` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal percobaan pembayaran pesanan',
  `pesanan_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi pesanan yang dibayar',
  `nomor_urut_percobaan` tinyint UNSIGNED NOT NULL DEFAULT '1' COMMENT 'Nomor urut percobaan pembayaran pada pesanan ini (1 sampai P-03 = 5)',
  `metode_pembayaran` enum('QRIS','E_WALLET','TRANSFER_BANK','VIRTUAL_ACCOUNT','KARTU_KREDIT_DEBIT','COD') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Metode pembayaran yang digunakan pada percobaan ini',
  `nama_penyedia_gateway` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'GATEWAY_UTAMA' COMMENT 'Nama penyedia payment gateway atau COD_INTERNAL',
  `id_transaksi_gateway` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ID transaksi unik dari payment gateway (kunci idempotensi konfirmasi pembayaran, Bagian 5 & A.4)',
  `nominal_tagihan_rupiah` bigint UNSIGNED NOT NULL COMMENT 'Nominal yang ditagihkan pada percobaan pembayaran ini (rupiah)',
  `nominal_dibayar_terverifikasi_rupiah` bigint UNSIGNED DEFAULT NULL COMMENT 'Nominal aktual yang diterima berdasarkan verifikasi API gateway',
  `mata_uang` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IDR' COMMENT 'Kode mata uang transaksi (wajib IDR sesuai A.6)',
  `status_percobaan` enum('DIBUAT','MENUNGGU','BERHASIL','GAGAL','KEDALUWARSA','DIBATALKAN','PERLU_DITINJAU') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DIBUAT' COMMENT 'Status per percobaan pembayaran sesuai Bagian 8.2 dan Lampiran A.3',
  `kode_atau_nomor_bayar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nomor Virtual Account, string QRIS, atau referensi instruksi bayar non-sensitif',
  `instruksi_pembayaran_json` json DEFAULT NULL COMMENT 'Rincian instruksi cara membayar untuk ditampilkan kepada pelanggan (Bagian 7.8)',
  `payload_mentah_gateway` json DEFAULT NULL COMMENT 'Salinan respons mentah pembuatan/pengecekan transaksi dari gateway (A.4)',
  `waktu_kedaluwarsa_percobaan` datetime NOT NULL COMMENT 'Batas waktu kedaluwarsa transaksi di gateway (selaras P-40)',
  `waktu_berhasil_dibayar` datetime DEFAULT NULL COMMENT 'Waktu UTC transaksi dinyatakan berhasil oleh gateway atau konfirmasi kurir COD',
  `dikonfirmasi_cod_oleh_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun Admin yang mengonfirmasi penerimaan uang COD beserta bukti audit (Bagian 11.A.1)',
  `bukti_setor_cod_kunci_berkas` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Kunci berkas bukti setoran tunai COD dari kurir bila metode = COD',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan percobaan pembayaran (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan setiap percobaan pembayaran pesanan ke payment gateway maupun konfirmasi pembayaran COD';

CREATE TABLE `peristiwa_pembayaran` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal peristiwa webhook pembayaran',
  `percobaan_pembayaran_pesanan_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi percobaan pembayaran terkait bila ditemukan di database (sesuai Bagian 26.4)',
  `id_transaksi_gateway` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ID transaksi dari payload webhook payment gateway',
  `jenis_peristiwa` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Jenis event webhook (mis. payment.succeeded, payment.expired, chargeback.opened)',
  `status_tanda_tangan_valid` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Hasil verifikasi signature kriptografi webhook dari raw body (SEC-06)',
  `alamat_ip_pengirim` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Alamat IP server pengirim webhook',
  `isi_mentah_webhook` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Payload mentah (raw body) webhook asli untuk audit dan pembuktian chargeback (A.9)',
  `header_mentah_webhook` json DEFAULT NULL COMMENT 'Header relevan dari permintaan webhook (timestamp, signature)',
  `hasil_pemrosesan` enum('BERHASIL_DIPROSES','DIABAIKAN_DUPLIKAT','DITOLAK_TANDA_TANGAN','DITOLAK_REPLAY_WAKTU','PERLU_DITINJAU_PH03','PEMBAYARAN_TERLAMBAT_PH02','PEMBAYARAN_GANDA_REFUND') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BERHASIL_DIPROSES' COMMENT 'Hasil eksekusi algoritma konfirmasi pembayaran 7.3',
  `waktu_diterima` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu UTC saat server menerima webhook',
  `waktu_selesai_diproses` datetime DEFAULT NULL COMMENT 'Waktu UTC saat transaksi database pemrosesan webhook selesai di-commit'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan log mentah webhook pembayaran dan kunci idempotensi (id_transaksi_gateway, jenis_peristiwa)';

CREATE TABLE `peristiwa_pengiriman` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal peristiwa pelacakan pengiriman',
  `pengiriman_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi pengiriman yang dilacak',
  `id_peristiwa_eksternal_kurir` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ID event unik dari penyedia kurir untuk idempotensi webhook kurir',
  `status_pelacakan_kurir` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode status pelacakan dari kurir (mis. PICKED_UP, IN_TRANSIT, ON_HOLD, DELIVERED, RETURNED)',
  `lokasi_titik_lacak` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Lokasi hub atau posisi kurir saat pembaruan status',
  `deskripsi_peristiwa` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Keterangan perjalanan paket untuk ditampilkan pada garis waktu pelacakan pelanggan',
  `sumber_pembaruan` enum('WEBHOOK_KURIR','POLLING_API_KURIR','MANUAL_ADMIN','KONFIRMASI_PELANGGAN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WEBHOOK_KURIR' COMMENT 'Sumber informasi pembaruan pelacakan',
  `pelaku_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun Admin atau Pelanggan bila pembaruan dilakukan manual',
  `payload_mentah_kurir` json DEFAULT NULL COMMENT 'Payload mentah dari webhook atau respons API kurir',
  `waktu_peristiwa_kurir` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu UTC terjadinya peristiwa pelacakan',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pencatatan baris di server (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan riwayat pembaruan pelacakan paket dari webhook/API kurir maupun input manual Admin';

CREATE TABLE `permintaan_pembatalan` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal permintaan pembatalan',
  `pesanan_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi pesanan yang diajukan untuk dibatalkan',
  `diajukan_oleh_akun_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi akun pelanggan atau Admin yang mengajukan pembatalan',
  `tahap_pesanan_saat_diajukan` enum('SIAP_DIPROSES','SEDANG_DISIAPKAN','DIKIRIM') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Status pesanan pada saat permintaan pembatalan diajukan (menentukan matriks kelayakan 10.1)',
  `alasan_pengajuan` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Alasan tertulis pengajuan pembatalan pesanan (wajib diisi)',
  `status_permintaan` enum('DIAJUKAN','DISETUJUI','DITOLAK') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DIAJUKAN' COMMENT 'Status keputusan permintaan pembatalan sesuai Lampiran A.3',
  `diputuskan_oleh_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun Admin/SuperAdmin pemutus (NULL bila otomatis disetujui pada tahap SIAP_DIPROSES)',
  `alasan_keputusan` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Alasan tertulis persetujuan atau penolakan pembatalan untuk diberitahukan ke pelanggan',
  `batas_waktu_keputusan` datetime NOT NULL COMMENT 'Batas waktu Admin mengambil keputusan (P-15 = 2 jam operasional)',
  `waktu_diputuskan` datetime DEFAULT NULL COMMENT 'Waktu UTC keputusan diambil',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pengajuan pembatalan (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan pengajuan dan keputusan pembatalan pesanan pasca-pembayaran sesuai matriks Bagian 10.1';

CREATE TABLE `persetujuan_operasi_sensitif` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal permintaan operasi sensitif',
  `jenis_operasi` enum('KOREKSI_STATUS_TERMINAL_T19','RESET_MFA_SUPERADMIN','REKONSILIASI_TANPA_API','PENYESUAIAN_STOK_DI_ATAS_P23','PROSEDUR_DARURAT_SISTEM') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kategori operasi sensitif yang mewajibkan penyetuju kedua berbeda orang (D-18)',
  `jenis_objek_target` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Entitas target operasi (mis. pesanan, akun_pengguna, riwayat_perubahan_stok_produk)',
  `id_objek_target` bigint UNSIGNED NOT NULL COMMENT 'ID baris objek target yang akan dikoreksi/dieksekusi',
  `pengaju_akun_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi akun SuperAdmin/Admin pengaju operasi',
  `alasan_tertulis_pengajuan` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Alasan tertulis, analisis dampak, dan rincian perubahan yang diajukan',
  `usulan_perubahan_json` json NOT NULL COMMENT 'Payload parameter perubahan yang akan dijalankan setelah disetujui',
  `status_persetujuan` enum('MENUNGGU_PERSETUJUAN_KEDUA','DISETUJUI_DAN_DIEKSEKUSI','DITOLAK','KEDALUWARSA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MENUNGGU_PERSETUJUAN_KEDUA' COMMENT 'Status persetujuan dual-control',
  `penyetuju_kedua_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun SuperAdmin penyetuju kedua (wajib berbeda dari pengaju_akun_id sesuai D-18)',
  `catatan_penyetuju_kedua` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Catatan tertulis dari pejabat penyetuju kedua',
  `waktu_diputuskan` datetime DEFAULT NULL COMMENT 'Waktu UTC persetujuan kedua diberikan atau ditolak',
  `waktu_dieksekusi` datetime DEFAULT NULL COMMENT 'Waktu UTC perubahan diterapkan ke sistem',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan pengajuan (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan catatan persetujuan kedua (dual-control D-18) untuk koreksi status terminal 8.9 dan prosedur darurat 13.6';

CREATE TABLE `pesanan` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal pesanan',
  `nomor_pesanan` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nomor pesanan unik acak format RV-YYMMDD-XXXXXX (BR-22, Bagian 6.4)',
  `kunci_idempotensi_checkout` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Header Idempotency-Key saat pembuatan pesanan POST /orders (Lampiran A.7 & A.11)',
  `akun_pengguna_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi akun pelanggan pemilik pesanan (sesuai Bagian 26.4)',
  `status_pesanan` enum('MENUNGGU_PEMBAYARAN','SIAP_DIPROSES','SEDANG_DISIAPKAN','DIKIRIM','TERKIRIM','SELESAI','DIBATALKAN','PERLU_PENANGANAN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MENUNGGU_PEMBAYARAN' COMMENT 'Status dimensi pesanan sesuai Lampiran A.3 dan tabel transisi 8.7',
  `status_pembayaran` enum('MENUNGGU','BERHASIL','PERLU_DITINJAU','GAGAL','KEDALUWARSA','DIBATALKAN','REFUND_DIPROSES','DIKEMBALIKAN_SEBAGIAN','DIKEMBALIKAN_PENUH','SENGKETA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MENUNGGU' COMMENT 'Status dimensi pembayaran tingkat pesanan (Bagian 8.2 & A.3)',
  `metode_pembayaran_utama` enum('QRIS','E_WALLET','TRANSFER_BANK','VIRTUAL_ACCOUNT','KARTU_KREDIT_DEBIT','COD') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'QRIS' COMMENT 'Metode pembayaran yang dipilih pelanggan saat checkout (D-16, P-40)',
  `status_adalah_cod` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Penanda apakah pesanan menggunakan metode COD (T-20, Bagian 11.A.1)',
  `alasan_pembatalan_kode` enum('KEDALUWARSA','PELANGGAN','ADMIN','TOKO') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Kode alasan pembatalan wajib saat status_pesanan = DIBATALKAN (Lampiran A.3)',
  `keterangan_pembatalan` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Penjelasan tertulis alasan pembatalan pesanan',
  `kode_perlu_penanganan` enum('PH_01','PH_02','PH_03','PH_04','PH_05','PH_06','PH_07') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Kode alasan wajib saat status_pesanan = PERLU_PENANGANAN (Bagian 8.5 & BR-24)',
  `status_sebelum_penanganan` enum('MENUNGGU_PEMBAYARAN','SIAP_DIPROSES','SEDANG_DISIAPKAN','DIKIRIM','TERKIRIM','SELESAI','DIBATALKAN') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Status pesanan sebelum masuk ke PERLU_PENANGANAN untuk keperluan transisi T-14/T-18',
  `pemilik_penanganan_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun Admin yang bertanggung jawab menangani kasus PH-xx (BR-24)',
  `batas_waktu_tindakan_awal_ph` datetime DEFAULT NULL COMMENT 'Batas waktu mulai penanganan awal oleh Admin (P-15 = 2 jam operasional)',
  `batas_waktu_keputusan_ph` datetime DEFAULT NULL COMMENT 'Batas waktu respons pelanggan atau keputusan pemulihan sebelum refund otomatis (P-16 = 24 jam)',
  `snapshot_alamat_pengiriman` json NOT NULL COMMENT 'Snapshot lengkap alamat penerima (nama, telepon, jalan, kelurahan, kecamatan, kota, provinsi, kode pos, patokan, lat, lng) saat pesanan dibuat (BR-13)',
  `mengandung_produk_mudah_layu` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Penanda apakah pesanan berisi minimal satu Produk Mudah Layu (wajib slot & kurir instan/same-day)',
  `tanggal_pengiriman` date DEFAULT NULL COMMENT 'Tanggal pengiriman yang dipilih pelanggan (wajib untuk Produk Mudah Layu)',
  `slot_pengiriman_kode` enum('PAGI','SIANG','SORE') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Slot waktu pengiriman (PAGI, SIANG, SORE sesuai P-08)',
  `kode_kurir_pilihan` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode penyedia kurir yang dipilih saat checkout',
  `layanan_kurir_pilihan` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama/kode layanan kurir yang dipilih (mis. GOSEND-INSTANT, JNE-REG)',
  `pesan_kartu_ucapan` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Teks biasa pesan kartu ucapan tingkat pesanan (maksimum 200 karakter sesuai P-10)',
  `nama_pengirim_kartu` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nama pengirim pada kartu ucapan (NULL jika pengirim memilih anonim)',
  `status_kartu_ucapan_ditolak` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Penanda bila Admin menolak isi kartu ucapan yang melanggar ketentuan (Bagian 6.4)',
  `subtotal_produk_rupiah` bigint UNSIGNED NOT NULL COMMENT 'Total harga seluruh item pesanan setelah diskon produk dalam bilangan bulat rupiah',
  `biaya_pengiriman_rupiah` bigint UNSIGNED NOT NULL COMMENT 'Ongkos kirim kurir yang terkunci saat checkout dalam bilangan bulat rupiah',
  `total_tagihan_rupiah` bigint UNSIGNED NOT NULL COMMENT 'Total akhir yang harus dibayar (subtotal_produk_rupiah + biaya_pengiriman_rupiah)',
  `total_dana_dikembalikan_rupiah` bigint UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Akumulasi nominal refund yang telah berhasil/disetujui (tidak boleh melebihi total_tagihan_rupiah, BR-16)',
  `nomor_bukti_pelunasan` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nomor dokumen bukti pelunasan resmi (diterbitkan hanya setelah pembayaran terverifikasi, BR-06)',
  `waktu_batas_pembayaran` datetime DEFAULT NULL COMMENT 'Batas waktu pembayaran online (selaras jendela reservasi P-40 / P-01)',
  `waktu_pengingat_bayar_terkirim` datetime DEFAULT NULL COMMENT 'Waktu pengiriman notifikasi pengingat N-04 (15 menit sebelum batas bayar)',
  `waktu_pembayaran_terverifikasi` datetime DEFAULT NULL COMMENT 'Waktu UTC saat pembayaran online atau COD terverifikasi lunas',
  `waktu_siap_diproses` datetime DEFAULT NULL COMMENT 'Waktu UTC pesanan masuk status SIAP_DIPROSES (T-02 / T-15 / T-20)',
  `waktu_mulai_disiapkan` datetime DEFAULT NULL COMMENT 'Waktu UTC Admin menekan tombol mulai siapkan (T-07)',
  `waktu_dikirim` datetime DEFAULT NULL COMMENT 'Waktu UTC paket diserahkan ke kurir (T-09 / T-16)',
  `waktu_terkirim` datetime DEFAULT NULL COMMENT 'Waktu UTC paket tiba di tujuan (T-12, menjadi awal jendela komplain P-11)',
  `waktu_batas_jendela_komplain` datetime DEFAULT NULL COMMENT 'Batas akhir pengajuan komplain 24 jam sejak waktu_terkirim (P-11)',
  `waktu_selesai` datetime DEFAULT NULL COMMENT 'Waktu UTC pesanan dinyatakan SELESAI oleh pelanggan atau sistem otomatis (T-13)',
  `waktu_dibatalkan` datetime DEFAULT NULL COMMENT 'Waktu UTC pesanan masuk status DIBATALKAN',
  `versi_kunci_optimis` int UNSIGNED NOT NULL DEFAULT '1' COMMENT 'Nomor versi baris untuk optimistic locking pencegahan perubahan ganda (HTTP 409, Lampiran A.4 & A.5)',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan pesanan (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir pesanan (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan transaksi pesanan pelanggan, status 3 dimensi, snapshot alamat, biaya, jadwal kirim, dan penanganan PH-xx';

CREATE TABLE `pilihan_atribut_produk` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal pilihan atribut',
  `atribut_produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi atribut induk pemilik opsi pilihan',
  `kode_pilihan` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode mesin pilihan atribut',
  `nilai_tampil_pilihan` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Label nilai yang ditampilkan kepada pengguna (mis. Diameter 15 cm, 5 Liter, Indoor Teduh)',
  `urutan_tampil` int UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Urutan tampilan opsi dalam atribut',
  `status_aktif` enum('AKTIF','NONAKTIF') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AKTIF' COMMENT 'Status aktif opsi atribut',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan daftar pilihan nilai terkontrol untuk atribut produk seperti ukuran, warna, bahan, dan tingkat cahaya';

CREATE TABLE `pilihan_buket_keranjang` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal pilihan opsi buket di keranjang',
  `konfigurasi_buket_keranjang_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi konfigurasi buket keranjang (sesuai Bagian 26.4)',
  `kategori_pilihan_buket_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi kategori pilihan buket (sesuai Bagian 26.4)',
  `opsi_pilihan_buket_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi opsi pilihan buket yang dipilih pelanggan (sesuai Bagian 26.4)',
  `kuantitas_opsi` int UNSIGNED NOT NULL DEFAULT '1' COMMENT 'Jumlah unit opsi yang dipilih di dalam satu buket',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan daftar rincian opsi kustomisasi buket yang dipilih pelanggan saat masih di keranjang';

CREATE TABLE `pilihan_buket_pesanan` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal snapshot opsi buket pesanan',
  `konfigurasi_buket_pesanan_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi konfigurasi buket pesanan induk (sesuai Bagian 26.4)',
  `kategori_pilihan_buket_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi kategori pilihan buket (sesuai Bagian 26.4)',
  `opsi_pilihan_buket_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi opsi pilihan buket (sesuai Bagian 26.4)',
  `nama_kategori_pilihan_snapshot` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Snapshot nama kelompok pilihan saat pesanan dibuat',
  `kode_opsi_snapshot` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Snapshot kode opsi pilihan buket',
  `nama_opsi_snapshot` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Snapshot nama opsi pilihan buket saat pesanan dibuat',
  `kuantitas_opsi` int UNSIGNED NOT NULL DEFAULT '1' COMMENT 'Jumlah unit opsi dalam satu buket',
  `tambahan_harga_satuan_snapshot_rupiah` bigint NOT NULL DEFAULT '0' COMMENT 'Snapshot tambahan harga per unit opsi saat pesanan dibuat (rupiah)',
  `subtotal_tambahan_opsi_rupiah` bigint NOT NULL DEFAULT '0' COMMENT 'Subtotal tambahan harga opsi (kuantitas_opsi * tambahan_harga_satuan_snapshot_rupiah)',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan snapshot (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan snapshot rincian opsi pilihan buket dan harga tambahannya pada pesanan';

CREATE TABLE `poin_informasi_produk` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal poin informasi accordion produk',
  `produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi produk pemilik poin informasi',
  `kode_ikon` enum('PENYIRAMAN','CAHAYA_MATAHARI','KELEMBAPAN','MEDIA_DAN_PUPUK','RAMAH_HEWAN','PERINGATAN_TOKSIK','COCOK_PEMULA','TIPS_KESEGARAN_BUKET','INFO_UMUM') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INFO_UMUM' COMMENT 'Kode ikon SVG yang ditampilkan di sebelah kiri judul poin',
  `judul_poin` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Judul singkat baris accordion (mis. Siram 1-2 Kali Seminggu / Water Once A Week)',
  `isi_penjelasan` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Penjelasan lengkap yang tampil saat baris accordion dibuka oleh pelanggan',
  `terbuka_default` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Penanda apakah baris accordion langsung terbuka saat halaman dibuka (1 = terbuka, 0 = tertutup)',
  `urutan_tampil` tinyint UNSIGNED NOT NULL DEFAULT '1' COMMENT 'Urutan tampilan poin dari atas ke bawah (1, 2, 3, dst.)',
  `status_aktif` enum('AKTIF','NONAKTIF') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AKTIF' COMMENT 'Status tampil poin informasi pada halaman detail produk',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan daftar poin accordion berikon (perawatan & karakteristik cepat) untuk halaman detail produk';

CREATE TABLE `produk` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal produk',
  `sku` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode SKU unik tingkat produk induk',
  `nama_produk` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama lengkap produk yang tampil di katalog',
  `slug_produk` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Slug URL unik untuk halaman detail produk (NFR-07)',
  `kategori_utama_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi kategori utama untuk breadcrumb dan SEO (Bagian 27.2)',
  `jenis_produk` enum('PRODUK_STANDAR','BUKET_KUSTOM','TANAMAN_HIAS','PERLENGKAPAN_BERKEBUN','BENIH_DAN_PUPUK','PAKET_BERKEBUN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PRODUK_STANDAR' COMMENT 'Klasifikasi perilaku produk (mendukung kustomisasi buket v2.5 dan gardening goods v2.6)',
  `jenis_penanganan` enum('MUDAH_LAYU','TAHAN_LAMA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TAHAN_LAMA' COMMENT 'Atribut penanganan pengiriman (MUDAH_LAYU wajib tanggal+slot dan kurir instan/same-day, D-06 & D-07)',
  `kebijakan_stok_paket` enum('BUKAN_PAKET','STOK_PAKET_MANDIRI','STOK_DARI_KOMPONEN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BUKAN_PAKET' COMMENT 'Kebijakan perhitungan stok khusus untuk jenis PAKET_BERKEBUN (Bagian 27.2)',
  `merek` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nama merek produk bila relevan (mis. alat berkebun, pupuk, pot)',
  `bahan_utama` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Bahan utama produk (mis. keramik, terakota, cocopeat, mawar segar)',
  `satuan_jual` enum('PCS','POT','BATANG','BUKET','GRAM','KILOGRAM','MILILITER','LITER','PAK','SET') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PCS' COMMENT 'Satuan jual eksplisit yang ditampilkan di katalog, keranjang, dan pesanan (Bagian 27.2)',
  `catatan_kelengkapan_jual` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Keterangan kelengkapan satuan jual (mis. Pot keramik pada foto dijual terpisah)',
  `deskripsi_produk` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Deskripsi lengkap produk (teks biasa, di-escape saat tampil sesuai 15.4)',
  `panduan_perawatan_dan_penggunaan` text COLLATE utf8mb4_unicode_ci COMMENT 'Informasi kebutuhan cahaya/air, petunjuk semai, atau cara pakai pupuk/media tanam (Bagian 27.1)',
  `peringatan_penanganan_produk` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Peringatan keamanan penggunaan atau penanganan khusus pengiriman (Bagian 27.1 & 27.3)',
  `nama_spesies_tanaman` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nama ilmiah/spesies khusus untuk kelompok tanaman hias atau benih (Bagian 27.1)',
  `subjudul_singkat` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Subjudul kondisi singkat di bawah nama produk (mis. Kondisi Lembap / Humid Condition)',
  `ringkasan_singkat` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Ringkasan produk 2-4 kalimat pada bagian Product Overview di halaman detail produk',
  `memiliki_varian` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Penanda apakah produk memiliki beberapa varian komersial/SKU di tabel varian_produk',
  `wajib_pencatatan_batch` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Penanda apakah mutasi stok wajib merujuk batch/kedaluwarsa FEFO (benih/pupuk, Bagian 27.2)',
  `harga_dasar_rupiah` bigint UNSIGNED NOT NULL COMMENT 'Harga jual normal dalam bilangan bulat rupiah (BR-13, NFR-08)',
  `harga_diskon_rupiah` bigint UNSIGNED DEFAULT NULL COMMENT 'Harga setelah diskon tingkat produk bila sedang promo (D-09)',
  `waktu_mulai_diskon` datetime DEFAULT NULL COMMENT 'Waktu UTC mulai berlakunya harga diskon produk (D-09)',
  `waktu_selesai_diskon` datetime DEFAULT NULL COMMENT 'Waktu UTC berakhirnya harga diskon produk (D-09)',
  `berat_gram` int UNSIGNED NOT NULL COMMENT 'Berat produk dalam gram (wajib untuk perhitungan tarif kurir, Bagian 5)',
  `panjang_milimeter` int UNSIGNED NOT NULL COMMENT 'Panjang dimensi kemasan dalam milimeter (wajib untuk kurir)',
  `lebar_milimeter` int UNSIGNED NOT NULL COMMENT 'Lebar dimensi kemasan dalam milimeter (wajib untuk kurir)',
  `tinggi_milimeter` int UNSIGNED NOT NULL COMMENT 'Tinggi dimensi kemasan dalam milimeter (wajib untuk kurir)',
  `waktu_persiapan_tambahan_menit` int UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Tambahan lead time persiapan khusus produk dalam menit bila diperlukan',
  `jumlah_stok_jual` int NOT NULL DEFAULT '0' COMMENT 'Total saldo stok jual produk (turunan buku besar stok, tidak boleh negatif, BR-05)',
  `ambang_stok_rendah` int UNSIGNED NOT NULL DEFAULT '5' COMMENT 'Ambang peringatan stok terbatas per produk (default P-22 = 5 unit)',
  `jumlah_unit_terjual` bigint UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Akumulasi unit terjual dari pesanan berstatus SELESAI (Bagian 6.1)',
  `status_produk` enum('AKTIF','NONAKTIF') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AKTIF' COMMENT 'Status aktif produk (produk bertransaksi tidak boleh dihapus permanen, BR-15)',
  `dibuat_oleh_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun Admin/SuperAdmin pembuat produk',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  `periode_mulai_tayang` datetime DEFAULT NULL COMMENT 'Waktu mulai produk ditampilkan di katalog (Limited Items)',
  `periode_akhir_tayang` datetime DEFAULT NULL COMMENT 'Waktu otomatis produk disembunyikan dari katalog (Limited Items)',
  `label_promosi` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Teks badge visual, misal: Limited Edition, Spring Collection (Limited Items Label)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan master produk florist, buket kustom, tanaman hias, gardening goods, dan paket berkebun';

CREATE TABLE `produksi_buket_pesanan` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal pekerjaan produksi buket',
  `pesanan_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi pesanan induk',
  `item_pesanan_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi baris item pesanan buket yang diproduksi',
  `konfigurasi_buket_pesanan_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi konfigurasi buket kustom bila merupakan buket kustom',
  `lokasi_stok_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi lokasi studio florist tempat perangkaian dilakukan',
  `nomor_instruksi_kerja` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nomor tiket kerja perangkaian untuk meja produksi florist',
  `status_produksi_buket` enum('MENUNGGU_JADWAL','BAHAN_DISIAPKAN','SEDANG_DIRANGKAI','PEMERIKSAAN_KUALITAS','SELESAI_DIRANGKAI','TERKENDALA_BAHAN','DIBATALKAN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MENUNGGU_JADWAL' COMMENT 'Status independen pekerjaan produksi buket (Bagian 26.5 & 26.6)',
  `perangkai_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun staf/Admin yang merangkai buket',
  `kunci_foto_hasil_rangkaian` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Kunci berkas foto dokumentasi buket setelah selesai dirangkai',
  `catatan_produksi` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Catatan hasil pemeriksaan kesegaran atau kendala bahan saat produksi',
  `waktu_target_selesai` datetime DEFAULT NULL COMMENT 'Target waktu selesai rangkai sebelum jadwal serah ke kurir',
  `waktu_mulai_rangkai` datetime DEFAULT NULL COMMENT 'Waktu aktual staf mulai merangkai buket (UTC)',
  `waktu_selesai_rangkai` datetime DEFAULT NULL COMMENT 'Waktu aktual buket selesai dirangkai dan lolos QC (UTC)',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan tiket produksi (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mencatat pekerjaan produksi/perangkaian buket yang terkait dengan pesanan pelanggan';

CREATE TABLE `rekonsiliasi_pembayaran_harian` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal item rekonsiliasi pembayaran',
  `tanggal_periode_transaksi` date NOT NULL COMMENT 'Tanggal transaksi yang direkonsiliasi',
  `pesanan_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi pesanan di sistem (NULL bila transaksi ada di gateway tetapi pesanan tidak ditemukan)',
  `percobaan_pembayaran_pesanan_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi percobaan pembayaran di sistem (sesuai Bagian 26.4)',
  `id_transaksi_gateway` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ID referensi transaksi pada laporan payment gateway',
  `nominal_menurut_gateway_rupiah` bigint UNSIGNED DEFAULT NULL COMMENT 'Nominal transaksi yang tercatat di payment gateway',
  `nominal_menurut_sistem_rupiah` bigint UNSIGNED DEFAULT NULL COMMENT 'Nominal transaksi yang tercatat di database sistem',
  `status_menurut_gateway` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Status transaksi pada laporan gateway',
  `status_menurut_sistem` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Status pembayaran pada database sistem saat rekonsiliasi berjalan',
  `jenis_selisih` enum('COCOK','ADA_DI_GATEWAY_TIDAK_DI_SISTEM','ADA_DI_SISTEM_TIDAK_DI_GATEWAY','SELISIH_NOMINAL','SELISIH_STATUS') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'COCOK' COMMENT 'Kategori hasil perbandingan rekonsiliasi harian 7.9',
  `status_penyelesaian` enum('OTOMATIS_COCOK','PERLU_DITINJAU_SUPERADMIN','DISELESAIKAN_VIA_API','DISELESAIKAN_DENGAN_BUKTI_DASBOR') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OTOMATIS_COCOK' COMMENT 'Status tindak lanjut rekonsiliasi (Bagian 13.5)',
  `kunci_berkas_bukti_dasbor` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Bukti tangkapan layar/ekspor dasbor resmi gateway bila API tidak terjangkau (Bagian 13.5)',
  `diselesaikan_oleh_superadmin_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun SuperAdmin yang melakukan rekonsiliasi manual',
  `disetujui_kedua_oleh_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi penyetuju kedua bila rekonsiliasi manual dilakukan tanpa API (Bagian 13.5 & D-18)',
  `catatan_penyelesaian` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Alasan dan hasil verifikasi rekonsiliasi manual',
  `waktu_diselesaikan` datetime DEFAULT NULL COMMENT 'Waktu UTC penyelesaian selisih rekonsiliasi',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pekerjaan rekonsiliasi mencatat baris ini (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan hasil rekonsiliasi pembayaran harian dan penyelesaian manual oleh SuperAdmin (Bagian 7.9 & 13.5)';

CREATE TABLE `relasi_produk_kategori` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal relasi produk-kategori',
  `produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi produk yang dihubungkan ke kategori',
  `kategori_produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi kategori produk',
  `status_kategori_utama` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Penanda apakah kategori ini adalah kategori utama produk tersebut',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan relasi multi-kategori agar satu produk dapat tampil pada beberapa kategori florist maupun gardening goods';

CREATE TABLE `relasi_rekomendasi_produk` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal relasi rekomendasi produk',
  `produk_sumber_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi produk utama yang sedang dilihat pelanggan',
  `produk_rekomendasi_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi produk pelengkap/serupa yang direkomendasikan',
  `jenis_rekomendasi` enum('PELENGKAP_SILANG','SERUPA_ALTERNATIF','PASANGAN_BUNDLING') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PELENGKAP_SILANG' COMMENT 'Kategori alasan rekomendasi (Cross-Sell pelengkap, produk serupa, atau pasangan bundling)',
  `label_alasan_rekomendasi` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Teks badge singkat pada kartu rekomendasi (mis. Cocok untuk Pot Monstera, Media Poros Aroid)',
  `urutan_tampil` tinyint UNSIGNED NOT NULL DEFAULT '1' COMMENT 'Urutan prioritas tampil pada bagian rekomendasi halaman detail produk (1, 2, 3, dst.)',
  `status_aktif` enum('AKTIF','NONAKTIF') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AKTIF' COMMENT 'Status aktif penayangan rekomendasi',
  `dibuat_oleh_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun Admin/SuperAdmin yang menetapkan relasi rekomendasi',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan pemetaan produk rekomendasi lintas kategori (ADR-001-CROSS-SELL-RECOMMENDATION)';

CREATE TABLE `resep_buket` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal resep dasar buket',
  `produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi produk buket',
  `varian_produk_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi varian ukuran buket (mis. Small, Medium, Large) bila ada',
  `kode_resep` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode unik resep buket',
  `nama_resep` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama resep perangkaian buket untuk panduan staf florist',
  `estimasi_waktu_rangkai_menit` int UNSIGNED NOT NULL DEFAULT '30' COMMENT 'Estimasi durasi perangkaian satu buket dalam menit',
  `instruksi_perangkaian` text COLLATE utf8mb4_unicode_ci COMMENT 'Langkah teknis standar perangkaian bagi staf produksi',
  `status_aktif` enum('AKTIF','NONAKTIF') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AKTIF' COMMENT 'Status aktif resep buket',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan master resep dasar komposisi buket per produk/varian untuk perhitungan bahan produksi';

CREATE TABLE `reservasi_stok_pesanan` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal reservasi stok pesanan',
  `pesanan_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi pesanan yang mencadangkan stok',
  `item_pesanan_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi baris item pesanan terkait',
  `produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi produk yang direservasi (termasuk komponen bila paket berbasis komponen)',
  `varian_produk_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi varian produk yang direservasi',
  `lokasi_stok_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi lokasi penyimpanan stok tempat reservasi dikunci',
  `metode_pembayaran` enum('QRIS','E_WALLET','TRANSFER_BANK','VIRTUAL_ACCOUNT','KARTU_KREDIT_DEBIT','COD') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Metode pembayaran penentu durasi jendela reservasi P-40',
  `kuantitas_direservasi` int UNSIGNED NOT NULL COMMENT 'Jumlah unit stok yang dicadangkan',
  `status_reservasi` enum('ACTIVE','COMMITTED','EXPIRED','RELEASED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE' COMMENT 'Status siklus hidup reservasi stok sesuai Lampiran A.3',
  `kunci_idempotensi` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kunci idempotensi unik untuk mencegah reservasi atau komit ganda',
  `waktu_direservasi` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu UTC saat reservasi dibuat atomik di InnoDB',
  `waktu_kedaluwarsa` datetime NOT NULL COMMENT 'Waktu kedaluwarsa resmi reservasi sesuai metode pembayaran P-40',
  `waktu_dikomit` datetime DEFAULT NULL COMMENT 'Waktu UTC saat pembayaran terverifikasi dan reservasi dikomit ke buku besar stok',
  `waktu_dilepas` datetime DEFAULT NULL COMMENT 'Waktu UTC saat reservasi dilepas karena kedaluwarsa atau pesanan dibatalkan sebelum bayar',
  `alasan_pelepasan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Alasan pelepasan reservasi (mis. BATAS_WAKTU_HABIS_TERKONFIRMASI_GATEWAY, DIBATALKAN_PELANGGAN)',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan reservasi stok sementara per metode pembayaran (P-40) untuk mencegah overselling saat checkout';

CREATE TABLE `riwayat_perubahan_stok_bahan` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID urut entri buku besar stok bahan produksi',
  `bahan_produksi_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi bahan produksi yang mengalami perubahan stok',
  `lokasi_stok_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi lokasi penyimpanan bahan',
  `jenis_mutasi_bahan` enum('PENERIMAAN_BAHAN','ALOKASI_PRODUKSI_BUKET','PEMAKAIAN_PRODUKSI_BUKET','PEMBATALAN_ALOKASI_BUKET','BAHAN_LAYU_RUSAK_BUANG','PENYESUAIAN_OPNAME_BAHAN','KONVERSI_DARI_BARANG_DAGANGAN') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Jenis transaksi perubahan stok bahan produksi',
  `perubahan_kuantitas` decimal(12,2) NOT NULL COMMENT 'Nilai perubahan kuantitas bahan (+ atau -, tidak boleh 0)',
  `saldo_setelah_mutasi` decimal(12,2) NOT NULL COMMENT 'Snapshot saldo stok bahan pada lokasi tersebut setelah mutasi',
  `jenis_referensi` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Jenis objek pemicu (PESANAN, PRODUKSI_BUKET, PENERIMAAN_SUPPLIER, OPNAME_BAHAN)',
  `referensi_id` bigint UNSIGNED DEFAULT NULL COMMENT 'ID objek referensi terkait (mis. pesanan.id atau produksi_buket_pesanan.id)',
  `kunci_idempotensi` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Kunci idempotensi pencegah pengurangan stok bahan ganda',
  `pelaku_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun staf/sistem yang mencatat mutasi bahan',
  `alasan_mutasi` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Alasan wajib mutasi atau catatan kondisi kesegaran bahan',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pencatatan mutasi bahan (UTC, append-only)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Buku besar (ledger append-only) untuk seluruh mutasi stok bahan produksi buket';

CREATE TABLE `riwayat_perubahan_stok_produk` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID urut entri buku besar stok produk',
  `produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi produk yang mengalami perubahan stok',
  `varian_produk_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi varian produk yang mengalami mutasi stok',
  `lokasi_stok_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi lokasi penyimpanan tempat mutasi terjadi',
  `batch_persediaan_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi batch persediaan bila produk memakai pelacakan FEFO',
  `jenis_mutasi_stok` enum('PENJUALAN','KOMIT_COD','PEMBATALAN_RESTOK','RETUR_LAYAK','BARANG_MASUK','PENYESUAIAN','BARANG_RUSAK_BUANG','TRANSFER_KELUAR','TRANSFER_MASUK','KONVERSI_KE_BAHAN_PRODUKSI') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Jenis entri buku besar stok sesuai Bagian 11.2 dan perluasan v2.6',
  `perubahan_kuantitas` int NOT NULL COMMENT 'Jumlah perubahan stok (+ untuk penambahan, - untuk pengurangan, tidak boleh 0)',
  `saldo_setelah_mutasi` int NOT NULL COMMENT 'Snapshot saldo stok produk/varian di lokasi tersebut tepat setelah mutasi',
  `jenis_referensi` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Jenis sumber transaksi (PESANAN, PENGEMBALIAN_BARANG, PENERIMAAN_STOK, STOK_OPNAME, PEMUSNAHAN, TRANSFER_LOKASI)',
  `referensi_id` bigint UNSIGNED DEFAULT NULL COMMENT 'ID entitas sumber referensi (mis. pesanan.id)',
  `kunci_idempotensi` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Kunci unik penangkal pencatatan ganda mutasi stok pada satu peristiwa',
  `pelaku_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun staf/pengguna pemicu mutasi (NULL jika oleh Sistem otomatis)',
  `disetujui_oleh_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun SuperAdmin penyetuju untuk penyesuaian stok manual di atas P-23 (20 unit)',
  `alasan_mutasi` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Alasan wajib setiap perubahan stok atau hasil checklist kelayakan retur (Bagian 11.4)',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pencatatan mutasi (UTC, append-only)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Buku besar (ledger append-only) untuk seluruh perubahan stok barang dagangan florist dan gardening goods';

CREATE TABLE `riwayat_status_pesanan` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal riwayat transisi status pesanan',
  `pesanan_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi pesanan yang mengalami perubahan status',
  `kode_transisi` enum('T_01','T_02','T_03','T_04','T_05','T_06','T_07','T_08','T_09','T_10','T_11','T_12','T_13','T_14','T_15','T_16','T_17','T_18','T_19','T_20') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode transisi formal sesuai Tabel Transisi 8.7 (T-01 s.d. T-20)',
  `status_pesanan_asal` enum('MENUNGGU_PEMBAYARAN','SIAP_DIPROSES','SEDANG_DISIAPKAN','DIKIRIM','TERKIRIM','SELESAI','DIBATALKAN','PERLU_PENANGANAN') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Status pesanan sebelum transisi (NULL untuk T-01 dan T-20 saat pesanan baru dibuat)',
  `status_pesanan_tujuan` enum('MENUNGGU_PEMBAYARAN','SIAP_DIPROSES','SEDANG_DISIAPKAN','DIKIRIM','TERKIRIM','SELESAI','DIBATALKAN','PERLU_PENANGANAN') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Status pesanan baru hasil transisi',
  `status_pembayaran_saat_itu` enum('MENUNGGU','BERHASIL','PERLU_DITINJAU','GAGAL','KEDALUWARSA','DIBATALKAN','REFUND_DIPROSES','DIKEMBALIKAN_SEBAGIAN','DIKEMBALIKAN_PENUH','SENGKETA') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Snapshot status pembayaran pada saat transisi terjadi',
  `kode_ph_terkait` enum('PH_01','PH_02','PH_03','PH_04','PH_05','PH_06','PH_07') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Kode alasan Perlu Penanganan bila transisi menuju atau keluar dari PERLU_PENANGANAN',
  `jenis_pelaku` enum('PELANGGAN','ADMIN','SUPERADMIN','SISTEM','GATEWAY_PEMBAYARAN','KURIR') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kategori aktor pemicu transisi',
  `pelaku_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun pengguna/staf pemicu bila dilakukan oleh manusia',
  `referensi_koreksi_riwayat_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Tautan ke entri riwayat asli bila baris ini adalah koreksi status terminal T-19 (Bagian 8.9)',
  `alasan_transisi` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Alasan atau keterangan transisi untuk ditampilkan pada garis waktu pesanan',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu transisi terjadi (UTC, append-only)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan garis waktu seluruh transisi status pesanan (T-01 s.d. T-20) secara imutabel (append-only)';

CREATE TABLE `riwayat_status_produksi_buket` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal riwayat status produksi buket',
  `produksi_buket_pesanan_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi pekerjaan produksi buket induk',
  `status_sebelumnya` enum('MENUNGGU_JADWAL','BAHAN_DISIAPKAN','SEDANG_DIRANGKAI','PEMERIKSAAN_KUALITAS','SELESAI_DIRANGKAI','TERKENDALA_BAHAN','DIBATALKAN') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Status produksi sebelum perubahan',
  `status_baru` enum('MENUNGGU_JADWAL','BAHAN_DISIAPKAN','SEDANG_DIRANGKAI','PEMERIKSAAN_KUALITAS','SELESAI_DIRANGKAI','TERKENDALA_BAHAN','DIBATALKAN') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Status produksi baru setelah perubahan',
  `pelaku_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun staf yang memperbarui status produksi',
  `catatan_perubahan` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Catatan atau alasan perubahan status produksi buket',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu perubahan status dicatat (UTC, append-only)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan jejak waktu perubahan status pekerjaan produksi buket secara append-only';

CREATE TABLE `sesi_login` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal baris sesi login',
  `hash_id_sesi` char(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Hash SHA-256 dari ID sesi cookie (__Host-rg_sid / __Host-rg_staff)',
  `akun_pengguna_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun pengguna yang sedang login (NULL untuk sesi pra-login CSRF)',
  `jenis_kanal_sesi` enum('PELANGGAN','STAF') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PELANGGAN' COMMENT 'Pemisahan sesi portal pelanggan dan panel staf',
  `token_csrf_sesi` char(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Token anti-CSRF unik per sesi (32 byte hex sesuai Bagian 15.5)',
  `alamat_ip_awal` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Alamat IP klien saat sesi dibuat (hasil fungsi client_ip)',
  `prefiks_ip_terakhir` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Prefiks IP terakhir untuk deteksi anomali perpindahan jaringan',
  `hash_agen_pengguna` char(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Hash SHA-256 dari header User-Agent peramban',
  `info_agen_pengguna` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Ringkasan User-Agent untuk ditampilkan pada daftar sesi aktif',
  `status_mfa_terverifikasi` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Penanda apakah sesi staf telah lulus verifikasi MFA',
  `waktu_konfirmasi_ulang_terakhir` datetime DEFAULT NULL COMMENT 'Waktu terakhir staf melakukan autentikasi ulang untuk aksi sensitif (Bagian 13.1)',
  `waktu_dibuat` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu mulai sesi untuk perhitungan batas absolut P-32',
  `waktu_terlihat_terakhir` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu aktivitas terakhir untuk perhitungan batas idle P-32',
  `waktu_kedaluwarsa` datetime NOT NULL COMMENT 'Waktu kedaluwarsa sesi resmi di server',
  `waktu_dicabut` datetime DEFAULT NULL COMMENT 'Waktu sesi dicabut (logout, ganti sandi, batas sesi P-44, atau akun dinonaktifkan)',
  `alasan_pencabutan` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Alasan pencabutan sesi (LOGOUT, GANTI_SANDI, AKUN_NONAKTIF, BATAS_SESI_P44, KEDALUWARSA)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan sesi login server-side untuk pelanggan dan staf guna mendukung pencabutan sesi instan dan multi-server';

CREATE TABLE `slot_pengiriman` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal slot pengiriman',
  `kode_slot` enum('PAGI','SIANG','SORE') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode mesin slot pengiriman sesuai Lampiran A.3',
  `nama_tampil_slot` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Label tampilan slot pengiriman (mis. Pagi 08:00 - 12:00 WIB)',
  `jam_mulai_wib` time NOT NULL COMMENT 'Jam mulai slot dalam Waktu Indonesia Barat (WIB)',
  `jam_selesai_wib` time NOT NULL COMMENT 'Jam berakhir slot dalam Waktu Indonesia Barat (WIB)',
  `lead_time_minimum_jam` int UNSIGNED NOT NULL DEFAULT '4' COMMENT 'Batas waktu pemesanan minimum sebelum jam mulai slot (default P-06 = 4 jam)',
  `kuota_maksimum_pesanan_harian` int UNSIGNED NOT NULL DEFAULT '50' COMMENT 'Kapasitas maksimum pesanan mudah layu pada slot ini per hari (D-07)',
  `urutan_tampil` tinyint UNSIGNED NOT NULL DEFAULT '1' COMMENT 'Urutan penampilan slot saat checkout',
  `status_aktif` enum('AKTIF','NONAKTIF') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AKTIF' COMMENT 'Status aktif slot pengiriman',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan konfigurasi slot waktu pengiriman harian (PAGI, SIANG, SORE) beserta kuota dan lead time';

CREATE TABLE `stok_bahan_produksi` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal saldo bahan per lokasi',
  `bahan_produksi_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi bahan produksi buket',
  `lokasi_stok_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi lokasi penyimpanan bahan (mis. Studio Florist)',
  `jumlah_stok_saldo` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Saldo fisik bahan produksi pada lokasi ini',
  `jumlah_stok_dialokasikan` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Jumlah bahan yang telah dialokasikan untuk produksi buket pesanan aktif',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan saldo bahan terakhir (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan saldo stok bahan produksi buket pada setiap lokasi penyimpanan';

CREATE TABLE `stok_varian_produk` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal baris saldo stok lokasi',
  `produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi produk barang dagangan',
  `varian_produk_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi varian produk (NULL bila produk tunggal tanpa varian)',
  `lokasi_stok_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi lokasi penyimpanan stok',
  `jumlah_stok_saldo` int NOT NULL DEFAULT '0' COMMENT 'Saldo fisik stok jual pada lokasi ini (konsisten dengan buku besar, tidak boleh negatif)',
  `jumlah_stok_direservasi` int NOT NULL DEFAULT '0' COMMENT 'Jumlah unit yang sedang direservasi aktif (ACTIVE) untuk checkout online',
  `titik_pesan_ulang` int UNSIGNED NOT NULL DEFAULT '5' COMMENT 'Ambang stok minimum lokasi sebelum perlu pengisian ulang',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan saldo terakhir dalam transaksi InnoDB (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan saldo stok jual dan stok tercadang per produk/varian pada setiap lokasi penyimpanan';

CREATE TABLE `tanggal_tutup` (
  `tanggal_libur` date NOT NULL COMMENT 'Tanggal toko tutup (Primary Key sesuai Lampiran A.4 closed_dates)',
  `keterangan_tutup` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Alasan atau nama hari libur tutup operasional toko',
  `ditetapkan_oleh_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun Admin/SuperAdmin yang menetapkan tanggal tutup',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan kalender tanggal tutup toko untuk memblokir pemilihan jadwal pengiriman saat checkout';

CREATE TABLE `ulasan_produk` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal ulasan produk',
  `pesanan_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi pesanan yang telah selesai',
  `item_pesanan_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi baris item pesanan yang diulas',
  `produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi produk yang diulas',
  `varian_produk_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi varian produk yang diulas',
  `akun_pengguna_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi akun pelanggan pemberi ulasan (sesuai Bagian 26.4)',
  `nilai_bintang` tinyint UNSIGNED NOT NULL COMMENT 'Penilaian bintang dari 1 sampai 5',
  `isi_ulasan` text COLLATE utf8mb4_unicode_ci COMMENT 'Teks ulasan pengalaman pembelian pelanggan (di-escape saat tampil)',
  `status_tampil` enum('MENUNGGU_MODERASI','DITAMPILKAN','DISEMBUNYIKAN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DITAMPILKAN' COMMENT 'Status moderasi tampilan ulasan di halaman produk',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan ulasan (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir ulasan (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan ulasan dan penilaian produk dari pelanggan yang telah menyelesaikan pesanan';

CREATE TABLE `varian_produk` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal varian produk',
  `produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi produk induk pemilik varian',
  `sku_varian` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode SKU unik untuk varian komersial ini (mis. POT-KRM-15CM, MEDIA-5L)',
  `nama_varian` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama pembeda varian (mis. Ukuran 15 cm - Putih, Kemasan 5 Liter)',
  `satuan_jual_varian` enum('PCS','POT','BATANG','BUKET','GRAM','KILOGRAM','MILILITER','LITER','PAK','SET') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PCS' COMMENT 'Satuan jual spesifik varian ini',
  `rasio_konversi_satuan_stok` decimal(12,4) NOT NULL DEFAULT '1.0000' COMMENT 'Rasio konversi eksplisit terhadap satuan stok dasar bila berlaku (Bagian 27.2)',
  `harga_rupiah` bigint UNSIGNED NOT NULL COMMENT 'Harga jual normal varian dalam bilangan bulat rupiah',
  `harga_diskon_rupiah` bigint UNSIGNED DEFAULT NULL COMMENT 'Harga diskon varian bila sedang dalam periode promo',
  `waktu_mulai_diskon` datetime DEFAULT NULL COMMENT 'Waktu mulai diskon varian (UTC)',
  `waktu_selesai_diskon` datetime DEFAULT NULL COMMENT 'Waktu selesai diskon varian (UTC)',
  `berat_gram` int UNSIGNED NOT NULL COMMENT 'Berat spesifik varian dalam gram untuk tarif kurir',
  `panjang_milimeter` int UNSIGNED NOT NULL COMMENT 'Panjang varian dalam milimeter',
  `lebar_milimeter` int UNSIGNED NOT NULL COMMENT 'Lebar varian dalam milimeter',
  `tinggi_milimeter` int UNSIGNED NOT NULL COMMENT 'Tinggi varian dalam milimeter',
  `jumlah_stok_varian` int NOT NULL DEFAULT '0' COMMENT 'Total saldo stok jual varian lintas lokasi (tidak boleh negatif)',
  `ambang_stok_rendah` int UNSIGNED NOT NULL DEFAULT '5' COMMENT 'Ambang peringatan stok rendah untuk varian ini',
  `status_varian_utama` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Penanda varian default saat halaman detail produk dibuka',
  `urutan_tampil` int UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Urutan penampilan pilihan varian pada halaman produk',
  `status_varian` enum('AKTIF','NONAKTIF') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AKTIF' COMMENT 'Status aktif penjualan varian',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan varian komersial/SKU produk (ukuran pot, volume media tanam, ukuran tanaman) beserta harga dan stoknya';

CREATE TABLE `zona_layanan_kurir` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal zona dan layanan kurir',
  `kode_kurir` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode penyedia kurir (mis. GOSEND, GRABEXPRESS, JNE, SICEPAT)',
  `nama_kurir` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama perusahaan kurir pengiriman',
  `kode_layanan` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode layanan spesifik kurir (mis. INSTANT, SAME_DAY, REG)',
  `nama_layanan` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama layanan pengiriman yang ditampilkan saat checkout',
  `kategori_kecepatan_layanan` enum('INSTAN','SAME_DAY','REGULER_EKSPEDISI') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kategori layanan untuk validasi produk MUDAH_LAYU (wajib INSTAN/SAME_DAY sesuai D-06 & BR-14)',
  `mendukung_produk_mudah_layu` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Penanda apakah layanan ini boleh membawa Produk Mudah Layu',
  `mendukung_pembayaran_cod` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Penanda apakah layanan kurir di zona ini mendukung metode COD (D-16)',
  `provinsi_tujuan` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Provinsi cakupan wilayah pengiriman',
  `kota_kabupaten_tujuan` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kota atau kabupaten cakupan pengiriman',
  `kecamatan_tujuan` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Kecamatan spesifik (NULL bila berlaku untuk seluruh kota/kabupaten)',
  `kode_pos_tujuan` char(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Kode pos spesifik bila pembatasan dilakukan per kode pos',
  `tarif_dasar_per_kg_rupiah` bigint UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Tarif dasar pengiriman per kilogram dalam bilangan bulat rupiah',
  `berat_maksimum_gram` int UNSIGNED NOT NULL DEFAULT '20000' COMMENT 'Batas berat paket maksimum yang diizinkan layanan kurir (gram)',
  `estimasi_waktu_tiba` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1-2 Hari' COMMENT 'Informasi estimasi waktu pengantaran (mis. 2-4 Jam, Hari yang Sama, 1-3 Hari)',
  `status_aktif` enum('AKTIF','NONAKTIF') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AKTIF' COMMENT 'Status aktif layanan kurir pada zona ini',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan cakupan wilayah layanan kurir, kelayakan untuk Produk Mudah Layu, dukungan COD, dan tarif dasar';

ALTER TABLE `akun_pengguna`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_akun_pengguna_email` (`email`),
  ADD KEY `idx_akun_pengguna_status_peran` (`status_akun`,`peran`),
  ADD KEY `idx_akun_pengguna_aktivitas_terakhir` (`status_akun`,`waktu_aktivitas_terakhir`),
  ADD KEY `fk_akun_pengguna_dinonaktifkan_oleh` (`dinonaktifkan_oleh_akun_id`);

ALTER TABLE `alamat_pengguna`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_alamat_pengguna_akun_aktif` (`akun_pengguna_id`,`status_aktif`,`status_alamat_utama`),
  ADD KEY `idx_alamat_pengguna_kode_pos` (`kode_pos`);

ALTER TABLE `antrean_keluar`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_antrean_keluar_idempotensi` (`kunci_idempotensi_kirim`),
  ADD KEY `idx_antrean_keluar_jadwal_proses` (`status_pengiriman_pesan`,`waktu_percobaan_berikutnya`),
  ADD KEY `fk_antrean_keluar_penerima` (`akun_penerima_id`);

ALTER TABLE `atribut_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_atribut_produk_kode` (`kode_atribut`),
  ADD KEY `idx_atribut_produk_filter` (`status_aktif`,`dapat_difilter_di_katalog`,`urutan_tampil`);

ALTER TABLE `bahan_produksi`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_bahan_produksi_kode` (`kode_bahan`),
  ADD KEY `idx_bahan_produksi_kelompok_status` (`kelompok_bahan`,`status_aktif`);

ALTER TABLE `batas_laju_permintaan`
  ADD PRIMARY KEY (`kunci_batas_laju`,`awal_jendela_waktu`),
  ADD KEY `idx_batas_laju_awal_jendela` (`awal_jendela_waktu`);

ALTER TABLE `batch_persediaan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_batch_persediaan_kode_lokasi` (`produk_id`,`varian_produk_id`,`lokasi_stok_id`,`nomor_kode_batch`),
  ADD KEY `idx_batch_persediaan_fefo` (`produk_id`,`status_batch`,`tanggal_kedaluwarsa`),
  ADD KEY `fk_batch_persediaan_varian` (`varian_produk_id`),
  ADD KEY `fk_batch_persediaan_lokasi` (`lokasi_stok_id`);

ALTER TABLE `catatan_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_catatan_pesanan_waktu` (`pesanan_id`,`jenis_catatan`,`dibuat_pada`),
  ADD KEY `fk_catatan_pesanan_penulis` (`penulis_akun_id`);

ALTER TABLE `daftar_keinginan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_daftar_keinginan_akun_nama` (`akun_pengguna_id`,`nama_daftar`);

ALTER TABLE `detail_resep_buket`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_detail_resep_buket_bahan` (`resep_buket_id`,`bahan_produksi_id`),
  ADD KEY `fk_detail_resep_buket_bahan` (`bahan_produksi_id`);

ALTER TABLE `foto_komplain`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_foto_komplain_urutan` (`komplain_id`,`urutan_foto`);

ALTER TABLE `foto_pengiriman`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_foto_pengiriman_jenis` (`pengiriman_id`,`jenis_foto_pengiriman`),
  ADD KEY `fk_foto_pengiriman_pengunggah` (`diunggah_oleh_akun_id`);

ALTER TABLE `gambar_produk`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_gambar_produk_urutan` (`produk_id`,`status_gambar_utama`,`urutan_tampil`),
  ADD KEY `fk_gambar_produk_varian` (`varian_produk_id`);

ALTER TABLE `identitas_eksternal`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_identitas_eksternal_penyedia_subjek` (`nama_penyedia`,`subjek_penyedia_id`),
  ADD UNIQUE KEY `uk_identitas_eksternal_akun_penyedia` (`akun_pengguna_id`,`nama_penyedia`);

ALTER TABLE `item_daftar_keinginan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_item_daftar_keinginan_unik` (`daftar_keinginan_id`,`produk_id`,`varian_produk_id`),
  ADD KEY `fk_item_daftar_keinginan_produk` (`produk_id`),
  ADD KEY `fk_item_daftar_keinginan_varian` (`varian_produk_id`);

ALTER TABLE `item_keranjang_belanja`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_item_keranjang_produk_varian_konfigurasi` (`keranjang_id`,`produk_id`,`varian_produk_id`,`hash_sidik_konfigurasi`),
  ADD KEY `fk_item_keranjang_produk` (`produk_id`),
  ADD KEY `fk_item_keranjang_varian` (`varian_produk_id`);

ALTER TABLE `item_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_item_pesanan_pesanan` (`pesanan_id`),
  ADD KEY `idx_item_pesanan_produk` (`produk_id`,`varian_produk_id`),
  ADD KEY `fk_item_pesanan_varian` (`varian_produk_id`),
  ADD KEY `fk_item_pesanan_substitusi` (`produk_pengganti_substitusi_id`);

ALTER TABLE `kategori_pilihan_buket`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_kategori_pilihan_buket_kode` (`kode_kategori_pilihan`),
  ADD KEY `idx_kategori_pilihan_buket_urutan` (`status_aktif`,`urutan_tampil`);

ALTER TABLE `kategori_pilihan_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_kategori_pilihan_produk_pasangan` (`produk_id`,`kategori_pilihan_buket_id`),
  ADD KEY `fk_kategori_pilihan_produk_kategori_buket` (`kategori_pilihan_buket_id`);

ALTER TABLE `kategori_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_kategori_produk_kode` (`kode_kategori`),
  ADD UNIQUE KEY `uk_kategori_produk_slug` (`slug_kategori`),
  ADD KEY `idx_kategori_produk_induk_status` (`kategori_induk_id`,`status_aktif`,`urutan_tampil`);

ALTER TABLE `kebutuhan_bahan_buket_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_kebutuhan_bahan_buket_pesanan_unik` (`konfigurasi_buket_pesanan_id`,`bahan_produksi_id`),
  ADD KEY `idx_kebutuhan_bahan_pesanan_status` (`pesanan_id`,`status_alokasi_bahan`),
  ADD KEY `fk_kebutuhan_bahan_pesanan_bahan` (`bahan_produksi_id`);

ALTER TABLE `kebutuhan_bahan_opsi_buket`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_kebutuhan_bahan_opsi_pasangan` (`opsi_pilihan_buket_id`,`bahan_produksi_id`),
  ADD KEY `fk_kebutuhan_bahan_opsi_bahan` (`bahan_produksi_id`);

ALTER TABLE `keranjang`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_keranjang_token_tamu` (`token_keranjang_tamu`),
  ADD KEY `idx_keranjang_akun_status` (`akun_pengguna_id`,`status_keranjang`),
  ADD KEY `idx_keranjang_retensi` (`status_keranjang`,`waktu_aktivitas_terakhir`);

ALTER TABLE `kode_verifikasi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_kode_verifikasi_akun_tujuan` (`akun_pengguna_id`,`tujuan_verifikasi`,`waktu_kedaluwarsa`),
  ADD KEY `idx_kode_verifikasi_hash` (`hash_kode_atau_token`);

ALTER TABLE `komplain`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_komplain_nomor_tiket` (`nomor_tiket_komplain`),
  ADD KEY `idx_komplain_pesanan_status` (`pesanan_id`,`status_komplain`),
  ADD KEY `idx_komplain_sla_respons` (`status_komplain`,`batas_waktu_respons_awal`),
  ADD KEY `fk_komplain_item_pesanan` (`item_pesanan_id`),
  ADD KEY `fk_komplain_akun_pengguna` (`akun_pengguna_id`),
  ADD KEY `fk_komplain_pemutus_admin` (`diputuskan_oleh_akun_id`),
  ADD KEY `fk_komplain_pemutus_superadmin` (`pemutus_banding_superadmin_id`);

ALTER TABLE `komponen_paket_berkebun`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_komponen_paket_berkebun_item` (`produk_paket_id`,`produk_komponen_id`,`varian_komponen_id`),
  ADD KEY `fk_komponen_paket_produk_komponen` (`produk_komponen_id`),
  ADD KEY `fk_komponen_paket_varian_komponen` (`varian_komponen_id`);

ALTER TABLE `konfigurasi_buket_keranjang`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_konfigurasi_buket_keranjang_item` (`item_keranjang_belanja_id`);

ALTER TABLE `konfigurasi_buket_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_konfigurasi_buket_pesanan_item` (`item_pesanan_id`);

ALTER TABLE `kunci_pekerjaan_terjadwal`
  ADD PRIMARY KEY (`nama_pekerjaan`);

ALTER TABLE `log_audit`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_log_audit_hash_entri` (`hash_entri`),
  ADD KEY `idx_log_audit_waktu` (`waktu_kejadian`),
  ADD KEY `idx_log_audit_objek` (`jenis_objek`,`id_objek`,`waktu_kejadian`),
  ADD KEY `idx_log_audit_pelaku` (`pelaku_akun_id`,`waktu_kejadian`),
  ADD KEY `idx_log_audit_tindakan` (`kode_tindakan`,`waktu_kejadian`);

ALTER TABLE `log_peristiwa_keamanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_log_keamanan_jenis_waktu` (`jenis_peristiwa`,`waktu_kejadian`),
  ADD KEY `idx_log_keamanan_ip_waktu` (`alamat_ip_klien`,`waktu_kejadian`),
  ADD KEY `idx_log_keamanan_akun_waktu` (`akun_pengguna_id`,`waktu_kejadian`);

ALTER TABLE `lokasi_stok`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_lokasi_stok_kode` (`kode_lokasi`);

ALTER TABLE `nilai_atribut_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_nilai_atribut_produk_unik` (`produk_id`,`atribut_produk_id`,`pilihan_atribut_produk_id`),
  ADD KEY `idx_nilai_atribut_produk_filter_opsi` (`atribut_produk_id`,`pilihan_atribut_produk_id`),
  ADD KEY `fk_nilai_atribut_produk_pilihan` (`pilihan_atribut_produk_id`);

ALTER TABLE `nilai_atribut_varian`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_nilai_atribut_varian_unik` (`varian_produk_id`,`atribut_produk_id`),
  ADD KEY `idx_nilai_atribut_varian_pilihan` (`atribut_produk_id`,`pilihan_atribut_produk_id`),
  ADD KEY `fk_nilai_atribut_varian_pilihan` (`pilihan_atribut_produk_id`);

ALTER TABLE `notifikasi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifikasi_akun_belum_dibaca` (`akun_pengguna_id`,`status_sudah_dibaca`,`dibuat_pada`),
  ADD KEY `idx_notifikasi_kode_status` (`kode_notifikasi`,`status_kirim`),
  ADD KEY `fk_notifikasi_antrean_keluar` (`antrean_keluar_id`);

ALTER TABLE `opsi_pilihan_buket`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_opsi_pilihan_buket_kode` (`kode_opsi`),
  ADD KEY `idx_opsi_pilihan_buket_kategori` (`kategori_pilihan_buket_id`,`status_aktif`,`urutan_tampil`);

ALTER TABLE `pengaturan_sistem`
  ADD PRIMARY KEY (`kunci_parameter`),
  ADD UNIQUE KEY `uk_pengaturan_sistem_kode_p` (`kode_register_parameter`),
  ADD KEY `fk_pengaturan_sistem_superadmin` (`diperbarui_oleh_superadmin_id`);

ALTER TABLE `pengembalian_dana`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_pengembalian_dana_nomor_ref` (`nomor_referensi_refund`),
  ADD KEY `idx_pengembalian_dana_pesanan_status` (`pesanan_id`,`status_refund`),
  ADD KEY `idx_pengembalian_dana_retry` (`status_refund`,`masuk_antrean_manual`,`waktu_percobaan_berikutnya`),
  ADD KEY `idx_pengembalian_dana_hapus_rekening` (`waktu_hapus_info_rekening`),
  ADD KEY `fk_pengembalian_dana_percobaan` (`percobaan_pembayaran_pesanan_id`),
  ADD KEY `fk_pengembalian_dana_pengaju` (`diajukan_oleh_akun_id`),
  ADD KEY `fk_pengembalian_dana_penyetuju` (`disetujui_oleh_akun_id`),
  ADD KEY `fk_pengembalian_dana_komplain` (`komplain_id`);

ALTER TABLE `pengiriman`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_pengiriman_pesanan_urut` (`pesanan_id`,`nomor_urut_pengiriman`),
  ADD KEY `idx_pengiriman_resi` (`nomor_resi_atau_referensi`),
  ADD KEY `idx_pengiriman_status_polling` (`status_pengiriman`,`diperbarui_pada`),
  ADD KEY `fk_pengiriman_diserahkan_oleh` (`diserahkan_oleh_akun_id`),
  ADD KEY `fk_pengiriman_diperiksa_oleh` (`diperiksa_oleh_akun_id`);

ALTER TABLE `percobaan_pembayaran_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_percobaan_pembayaran_id_gateway` (`id_transaksi_gateway`),
  ADD UNIQUE KEY `uk_percobaan_pembayaran_pesanan_urut` (`pesanan_id`,`nomor_urut_percobaan`),
  ADD KEY `idx_percobaan_pembayaran_status` (`pesanan_id`,`status_percobaan`),
  ADD KEY `fk_percobaan_pembayaran_konfirmasi_cod` (`dikonfirmasi_cod_oleh_akun_id`);

ALTER TABLE `peristiwa_pembayaran`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_peristiwa_pembayaran_idempotensi` (`id_transaksi_gateway`,`jenis_peristiwa`),
  ADD KEY `idx_peristiwa_pembayaran_percobaan` (`percobaan_pembayaran_pesanan_id`),
  ADD KEY `idx_peristiwa_pembayaran_waktu` (`waktu_diterima`,`status_tanda_tangan_valid`);

ALTER TABLE `peristiwa_pengiriman`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_peristiwa_pengiriman_idempotensi` (`pengiriman_id`,`id_peristiwa_eksternal_kurir`),
  ADD KEY `idx_peristiwa_pengiriman_garis_waktu` (`pengiriman_id`,`waktu_peristiwa_kurir`),
  ADD KEY `fk_peristiwa_pengiriman_pelaku` (`pelaku_akun_id`);

ALTER TABLE `permintaan_pembatalan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_permintaan_pembatalan_pesanan_status` (`pesanan_id`,`status_permintaan`),
  ADD KEY `idx_permintaan_pembatalan_antrean` (`status_permintaan`,`batas_waktu_keputusan`),
  ADD KEY `fk_permintaan_pembatalan_pengaju` (`diajukan_oleh_akun_id`),
  ADD KEY `fk_permintaan_pembatalan_pemutus` (`diputuskan_oleh_akun_id`);

ALTER TABLE `persetujuan_operasi_sensitif`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_persetujuan_sensitif_status` (`status_persetujuan`,`jenis_operasi`),
  ADD KEY `fk_persetujuan_sensitif_pengaju` (`pengaju_akun_id`),
  ADD KEY `fk_persetujuan_sensitif_penyetuju` (`penyetuju_kedua_akun_id`);

ALTER TABLE `pesanan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_pesanan_nomor_pesanan` (`nomor_pesanan`),
  ADD UNIQUE KEY `uk_pesanan_idempotensi_checkout` (`kunci_idempotensi_checkout`),
  ADD UNIQUE KEY `uk_pesanan_nomor_bukti_pelunasan` (`nomor_bukti_pelunasan`),
  ADD KEY `idx_pesanan_akun_waktu` (`akun_pengguna_id`,`dibuat_pada`),
  ADD KEY `idx_pesanan_antrean_jadwal` (`status_pesanan`,`tanggal_pengiriman`,`slot_pengiriman_kode`,`waktu_pembayaran_terverifikasi`),
  ADD KEY `idx_pesanan_kedaluwarsa` (`status_pesanan`,`waktu_batas_pembayaran`),
  ADD KEY `idx_pesanan_perlu_penanganan` (`status_pesanan`,`kode_perlu_penanganan`,`batas_waktu_keputusan_ph`),
  ADD KEY `idx_pesanan_selesai_otomatis` (`status_pesanan`,`waktu_batas_jendela_komplain`),
  ADD KEY `fk_pesanan_pemilik_penanganan` (`pemilik_penanganan_akun_id`);

ALTER TABLE `pilihan_atribut_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_pilihan_atribut_kode` (`atribut_produk_id`,`kode_pilihan`),
  ADD KEY `idx_pilihan_atribut_urutan` (`atribut_produk_id`,`status_aktif`,`urutan_tampil`);

ALTER TABLE `pilihan_buket_keranjang`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_pilihan_buket_keranjang_opsi` (`konfigurasi_buket_keranjang_id`,`opsi_pilihan_buket_id`),
  ADD KEY `fk_pilihan_buket_keranjang_kategori` (`kategori_pilihan_buket_id`),
  ADD KEY `fk_pilihan_buket_keranjang_opsi` (`opsi_pilihan_buket_id`);

ALTER TABLE `pilihan_buket_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pilihan_buket_pesanan_konfigurasi` (`konfigurasi_buket_pesanan_id`),
  ADD KEY `fk_pilihan_buket_pesanan_kategori` (`kategori_pilihan_buket_id`),
  ADD KEY `fk_pilihan_buket_pesanan_opsi` (`opsi_pilihan_buket_id`);

ALTER TABLE `poin_informasi_produk`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_poin_informasi_produk_urutan` (`produk_id`,`status_aktif`,`urutan_tampil`);

ALTER TABLE `produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_produk_sku` (`sku`),
  ADD UNIQUE KEY `uk_produk_slug` (`slug_produk`),
  ADD KEY `idx_produk_status_kategori` (`status_produk`,`kategori_utama_id`),
  ADD KEY `idx_produk_jenis_penanganan` (`status_produk`,`jenis_produk`,`jenis_penanganan`),
  ADD KEY `idx_produk_harga_terlaris` (`status_produk`,`harga_dasar_rupiah`,`jumlah_unit_terjual`),
  ADD KEY `fk_produk_dibuat_oleh` (`dibuat_oleh_akun_id`),
  ADD KEY `fk_produk_kategori_utama` (`kategori_utama_id`);

ALTER TABLE `produksi_buket_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_produksi_buket_nomor_instruksi` (`nomor_instruksi_kerja`),
  ADD KEY `idx_produksi_buket_pesanan_status` (`pesanan_id`,`status_produksi_buket`),
  ADD KEY `idx_produksi_buket_target` (`status_produksi_buket`,`waktu_target_selesai`),
  ADD KEY `fk_produksi_buket_item` (`item_pesanan_id`),
  ADD KEY `fk_produksi_buket_konfigurasi` (`konfigurasi_buket_pesanan_id`),
  ADD KEY `fk_produksi_buket_lokasi` (`lokasi_stok_id`),
  ADD KEY `fk_produksi_buket_perangkai` (`perangkai_akun_id`);

ALTER TABLE `rekonsiliasi_pembayaran_harian`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_rekonsiliasi_tanggal_txn` (`tanggal_periode_transaksi`,`id_transaksi_gateway`),
  ADD KEY `idx_rekonsiliasi_status_tinjau` (`status_penyelesaian`,`tanggal_periode_transaksi`),
  ADD KEY `fk_rekonsiliasi_pesanan` (`pesanan_id`),
  ADD KEY `fk_rekonsiliasi_percobaan` (`percobaan_pembayaran_pesanan_id`),
  ADD KEY `fk_rekonsiliasi_superadmin` (`diselesaikan_oleh_superadmin_id`),
  ADD KEY `fk_rekonsiliasi_penyetuju_kedua` (`disetujui_kedua_oleh_akun_id`);

ALTER TABLE `relasi_produk_kategori`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_relasi_produk_kategori_pasangan` (`produk_id`,`kategori_produk_id`),
  ADD KEY `idx_relasi_produk_kategori_filter` (`kategori_produk_id`,`produk_id`);

ALTER TABLE `relasi_rekomendasi_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_relasi_rekomendasi_pasangan` (`produk_sumber_id`,`produk_rekomendasi_id`),
  ADD KEY `idx_rekomendasi_sumber_aktif_urutan` (`produk_sumber_id`,`status_aktif`,`urutan_tampil`),
  ADD KEY `fk_rekomendasi_produk_target` (`produk_rekomendasi_id`),
  ADD KEY `fk_rekomendasi_dibuat_oleh` (`dibuat_oleh_akun_id`);

ALTER TABLE `resep_buket`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_resep_buket_kode` (`kode_resep`),
  ADD UNIQUE KEY `uk_resep_buket_produk_varian` (`produk_id`,`varian_produk_id`),
  ADD KEY `fk_resep_buket_varian` (`varian_produk_id`);

ALTER TABLE `reservasi_stok_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_reservasi_stok_idempotensi` (`kunci_idempotensi`),
  ADD KEY `idx_reservasi_stok_status_kedaluwarsa` (`status_reservasi`,`waktu_kedaluwarsa`),
  ADD KEY `idx_reservasi_stok_pesanan` (`pesanan_id`,`status_reservasi`),
  ADD KEY `idx_reservasi_stok_produk_aktif` (`produk_id`,`varian_produk_id`,`status_reservasi`),
  ADD KEY `fk_reservasi_stok_item_pesanan` (`item_pesanan_id`),
  ADD KEY `fk_reservasi_stok_varian` (`varian_produk_id`),
  ADD KEY `fk_reservasi_stok_lokasi` (`lokasi_stok_id`);

ALTER TABLE `riwayat_perubahan_stok_bahan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_riwayat_stok_bahan_idempotensi` (`kunci_idempotensi`),
  ADD KEY `idx_riwayat_stok_bahan_waktu` (`bahan_produksi_id`,`dibuat_pada`),
  ADD KEY `idx_riwayat_stok_bahan_referensi` (`jenis_referensi`,`referensi_id`),
  ADD KEY `fk_riwayat_stok_bahan_lokasi` (`lokasi_stok_id`),
  ADD KEY `fk_riwayat_stok_bahan_pelaku` (`pelaku_akun_id`);

ALTER TABLE `riwayat_perubahan_stok_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_riwayat_stok_produk_idempotensi` (`kunci_idempotensi`),
  ADD KEY `idx_riwayat_stok_produk_waktu` (`produk_id`,`varian_produk_id`,`dibuat_pada`),
  ADD KEY `idx_riwayat_stok_referensi` (`jenis_referensi`,`referensi_id`),
  ADD KEY `fk_riwayat_stok_produk_varian` (`varian_produk_id`),
  ADD KEY `fk_riwayat_stok_produk_lokasi` (`lokasi_stok_id`),
  ADD KEY `fk_riwayat_stok_produk_batch` (`batch_persediaan_id`),
  ADD KEY `fk_riwayat_stok_produk_pelaku` (`pelaku_akun_id`),
  ADD KEY `fk_riwayat_stok_produk_penyetuju` (`disetujui_oleh_akun_id`);

ALTER TABLE `riwayat_status_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_riwayat_status_pesanan_garis_waktu` (`pesanan_id`,`dibuat_pada`),
  ADD KEY `fk_riwayat_status_pesanan_pelaku` (`pelaku_akun_id`),
  ADD KEY `fk_riwayat_status_pesanan_koreksi` (`referensi_koreksi_riwayat_id`);

ALTER TABLE `riwayat_status_produksi_buket`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_riwayat_status_produksi_waktu` (`produksi_buket_pesanan_id`,`dibuat_pada`),
  ADD KEY `fk_riwayat_status_produksi_pelaku` (`pelaku_akun_id`);

ALTER TABLE `sesi_login`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_sesi_login_hash_id_sesi` (`hash_id_sesi`),
  ADD KEY `idx_sesi_login_akun_aktif` (`akun_pengguna_id`,`waktu_dicabut`,`waktu_kedaluwarsa`),
  ADD KEY `idx_sesi_login_kedaluwarsa` (`waktu_kedaluwarsa`);

ALTER TABLE `slot_pengiriman`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_slot_pengiriman_kode` (`kode_slot`);

ALTER TABLE `stok_bahan_produksi`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_stok_bahan_produksi_lokasi` (`bahan_produksi_id`,`lokasi_stok_id`),
  ADD KEY `fk_stok_bahan_produksi_lokasi` (`lokasi_stok_id`);

ALTER TABLE `stok_varian_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_stok_varian_produk_lokasi` (`produk_id`,`varian_produk_id`,`lokasi_stok_id`),
  ADD KEY `idx_stok_varian_lokasi` (`lokasi_stok_id`,`jumlah_stok_saldo`),
  ADD KEY `fk_stok_varian_produk_varian` (`varian_produk_id`);

ALTER TABLE `tanggal_tutup`
  ADD PRIMARY KEY (`tanggal_libur`),
  ADD KEY `fk_tanggal_tutup_ditetapkan_oleh` (`ditetapkan_oleh_akun_id`);

ALTER TABLE `ulasan_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_ulasan_produk_item_pesanan` (`item_pesanan_id`),
  ADD KEY `idx_ulasan_produk_tampil` (`produk_id`,`status_tampil`,`nilai_bintang`),
  ADD KEY `fk_ulasan_produk_pesanan` (`pesanan_id`),
  ADD KEY `fk_ulasan_produk_varian` (`varian_produk_id`),
  ADD KEY `fk_ulasan_produk_akun` (`akun_pengguna_id`);

ALTER TABLE `varian_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_varian_produk_sku` (`sku_varian`),
  ADD KEY `idx_varian_produk_induk_status` (`produk_id`,`status_varian`,`urutan_tampil`);

ALTER TABLE `zona_layanan_kurir`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_zona_layanan_kurir_wilayah` (`kode_kurir`,`kode_layanan`,`provinsi_tujuan`,`kota_kabupaten_tujuan`,`kecamatan_tujuan`,`kode_pos_tujuan`),
  ADD KEY `idx_zona_kurir_pencarian` (`status_aktif`,`kota_kabupaten_tujuan`,`mendukung_produk_mudah_layu`);

ALTER TABLE `akun_pengguna`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal unik akun pengguna';

ALTER TABLE `alamat_pengguna`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal alamat pengguna';

ALTER TABLE `antrean_keluar`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal baris antrean keluar (outbox)';

ALTER TABLE `atribut_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal definisi atribut produk';

ALTER TABLE `bahan_produksi`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal bahan produksi buket';

ALTER TABLE `batch_persediaan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal batch persediaan';

ALTER TABLE `catatan_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal catatan pesanan';

ALTER TABLE `daftar_keinginan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal daftar keinginan pelanggan';

ALTER TABLE `detail_resep_buket`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal detail resep buket';

ALTER TABLE `foto_komplain`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal foto bukti komplain';

ALTER TABLE `foto_pengiriman`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal foto bukti pengiriman';

ALTER TABLE `gambar_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal gambar produk';

ALTER TABLE `identitas_eksternal`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal identitas eksternal';

ALTER TABLE `item_daftar_keinginan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal item daftar keinginan';

ALTER TABLE `item_keranjang_belanja`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal baris item keranjang belanja';

ALTER TABLE `item_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal baris item pesanan';

ALTER TABLE `kategori_pilihan_buket`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal kategori pilihan kustomisasi buket';

ALTER TABLE `kategori_pilihan_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pemetaan kategori pilihan ke produk';

ALTER TABLE `kategori_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal kategori produk';

ALTER TABLE `kebutuhan_bahan_buket_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal kebutuhan bahan buket pesanan';

ALTER TABLE `kebutuhan_bahan_opsi_buket`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pemetaan kebutuhan bahan opsi buket';

ALTER TABLE `keranjang`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal keranjang belanja';

ALTER TABLE `kode_verifikasi`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal kode verifikasi';

ALTER TABLE `komplain`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal komplain pesanan';

ALTER TABLE `komponen_paket_berkebun`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal komponen paket berkebun';

ALTER TABLE `konfigurasi_buket_keranjang`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal konfigurasi buket di keranjang';

ALTER TABLE `konfigurasi_buket_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal konfigurasi buket pada pesanan';

ALTER TABLE `log_audit`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID monoton urut entri audit log';

ALTER TABLE `log_peristiwa_keamanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal catatan peristiwa keamanan';

ALTER TABLE `lokasi_stok`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal lokasi stok';

ALTER TABLE `nilai_atribut_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal nilai atribut produk';

ALTER TABLE `nilai_atribut_varian`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal nilai atribut varian';

ALTER TABLE `notifikasi`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal notifikasi pengguna';

ALTER TABLE `opsi_pilihan_buket`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal opsi pilihan buket';

ALTER TABLE `pengembalian_dana`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pengembalian dana (refund)';

ALTER TABLE `pengiriman`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pengiriman paket';

ALTER TABLE `percobaan_pembayaran_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal percobaan pembayaran pesanan';

ALTER TABLE `peristiwa_pembayaran`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal peristiwa webhook pembayaran';

ALTER TABLE `peristiwa_pengiriman`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal peristiwa pelacakan pengiriman';

ALTER TABLE `permintaan_pembatalan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal permintaan pembatalan';

ALTER TABLE `persetujuan_operasi_sensitif`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal permintaan operasi sensitif';

ALTER TABLE `pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pesanan';

ALTER TABLE `pilihan_atribut_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pilihan atribut';

ALTER TABLE `pilihan_buket_keranjang`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pilihan opsi buket di keranjang';

ALTER TABLE `pilihan_buket_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal snapshot opsi buket pesanan';

ALTER TABLE `poin_informasi_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal poin informasi accordion produk';

ALTER TABLE `produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal produk';

ALTER TABLE `produksi_buket_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pekerjaan produksi buket';

ALTER TABLE `rekonsiliasi_pembayaran_harian`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal item rekonsiliasi pembayaran';

ALTER TABLE `relasi_produk_kategori`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal relasi produk-kategori';

ALTER TABLE `relasi_rekomendasi_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal relasi rekomendasi produk';

ALTER TABLE `resep_buket`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal resep dasar buket';

ALTER TABLE `reservasi_stok_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal reservasi stok pesanan';

ALTER TABLE `riwayat_perubahan_stok_bahan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID urut entri buku besar stok bahan produksi';

ALTER TABLE `riwayat_perubahan_stok_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID urut entri buku besar stok produk';

ALTER TABLE `riwayat_status_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal riwayat transisi status pesanan';

ALTER TABLE `riwayat_status_produksi_buket`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal riwayat status produksi buket';

ALTER TABLE `sesi_login`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal baris sesi login';

ALTER TABLE `slot_pengiriman`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal slot pengiriman';

ALTER TABLE `stok_bahan_produksi`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal saldo bahan per lokasi';

ALTER TABLE `stok_varian_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal baris saldo stok lokasi';

ALTER TABLE `ulasan_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal ulasan produk';

ALTER TABLE `varian_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal varian produk';

ALTER TABLE `zona_layanan_kurir`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal zona dan layanan kurir';

ALTER TABLE `akun_pengguna`
  ADD CONSTRAINT `fk_akun_pengguna_dinonaktifkan_oleh` FOREIGN KEY (`dinonaktifkan_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `alamat_pengguna`
  ADD CONSTRAINT `fk_alamat_pengguna_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `antrean_keluar`
  ADD CONSTRAINT `fk_antrean_keluar_penerima` FOREIGN KEY (`akun_penerima_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `batch_persediaan`
  ADD CONSTRAINT `fk_batch_persediaan_lokasi` FOREIGN KEY (`lokasi_stok_id`) REFERENCES `lokasi_stok` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_batch_persediaan_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_batch_persediaan_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `catatan_pesanan`
  ADD CONSTRAINT `fk_catatan_pesanan_penulis` FOREIGN KEY (`penulis_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_catatan_pesanan_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `daftar_keinginan`
  ADD CONSTRAINT `fk_daftar_keinginan_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `detail_resep_buket`
  ADD CONSTRAINT `fk_detail_resep_buket_bahan` FOREIGN KEY (`bahan_produksi_id`) REFERENCES `bahan_produksi` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detail_resep_buket_resep` FOREIGN KEY (`resep_buket_id`) REFERENCES `resep_buket` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `foto_komplain`
  ADD CONSTRAINT `fk_foto_komplain_komplain` FOREIGN KEY (`komplain_id`) REFERENCES `komplain` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `foto_pengiriman`
  ADD CONSTRAINT `fk_foto_pengiriman_pengiriman` FOREIGN KEY (`pengiriman_id`) REFERENCES `pengiriman` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_foto_pengiriman_pengunggah` FOREIGN KEY (`diunggah_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `gambar_produk`
  ADD CONSTRAINT `fk_gambar_produk_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_gambar_produk_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `identitas_eksternal`
  ADD CONSTRAINT `fk_identitas_eksternal_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `item_daftar_keinginan`
  ADD CONSTRAINT `fk_item_daftar_keinginan_daftar` FOREIGN KEY (`daftar_keinginan_id`) REFERENCES `daftar_keinginan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_item_daftar_keinginan_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_item_daftar_keinginan_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `item_keranjang_belanja`
  ADD CONSTRAINT `fk_item_keranjang_keranjang` FOREIGN KEY (`keranjang_id`) REFERENCES `keranjang` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_item_keranjang_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_item_keranjang_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `item_pesanan`
  ADD CONSTRAINT `fk_item_pesanan_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_item_pesanan_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_item_pesanan_substitusi` FOREIGN KEY (`produk_pengganti_substitusi_id`) REFERENCES `produk` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_item_pesanan_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `kategori_pilihan_produk`
  ADD CONSTRAINT `fk_kategori_pilihan_produk_kategori_buket` FOREIGN KEY (`kategori_pilihan_buket_id`) REFERENCES `kategori_pilihan_buket` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kategori_pilihan_produk_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `kategori_produk`
  ADD CONSTRAINT `fk_kategori_produk_induk` FOREIGN KEY (`kategori_induk_id`) REFERENCES `kategori_produk` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `kebutuhan_bahan_buket_pesanan`
  ADD CONSTRAINT `fk_kebutuhan_bahan_pesanan_bahan` FOREIGN KEY (`bahan_produksi_id`) REFERENCES `bahan_produksi` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kebutuhan_bahan_pesanan_konfigurasi` FOREIGN KEY (`konfigurasi_buket_pesanan_id`) REFERENCES `konfigurasi_buket_pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kebutuhan_bahan_pesanan_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `kebutuhan_bahan_opsi_buket`
  ADD CONSTRAINT `fk_kebutuhan_bahan_opsi_bahan` FOREIGN KEY (`bahan_produksi_id`) REFERENCES `bahan_produksi` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kebutuhan_bahan_opsi_opsi` FOREIGN KEY (`opsi_pilihan_buket_id`) REFERENCES `opsi_pilihan_buket` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `keranjang`
  ADD CONSTRAINT `fk_keranjang_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `kode_verifikasi`
  ADD CONSTRAINT `fk_kode_verifikasi_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `komplain`
  ADD CONSTRAINT `fk_komplain_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_komplain_item_pesanan` FOREIGN KEY (`item_pesanan_id`) REFERENCES `item_pesanan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_komplain_pemutus_admin` FOREIGN KEY (`diputuskan_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_komplain_pemutus_superadmin` FOREIGN KEY (`pemutus_banding_superadmin_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_komplain_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `komponen_paket_berkebun`
  ADD CONSTRAINT `fk_komponen_paket_produk_komponen` FOREIGN KEY (`produk_komponen_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_komponen_paket_produk_paket` FOREIGN KEY (`produk_paket_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_komponen_paket_varian_komponen` FOREIGN KEY (`varian_komponen_id`) REFERENCES `varian_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `konfigurasi_buket_keranjang`
  ADD CONSTRAINT `fk_konfigurasi_buket_keranjang_item` FOREIGN KEY (`item_keranjang_belanja_id`) REFERENCES `item_keranjang_belanja` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `konfigurasi_buket_pesanan`
  ADD CONSTRAINT `fk_konfigurasi_buket_pesanan_item` FOREIGN KEY (`item_pesanan_id`) REFERENCES `item_pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `log_peristiwa_keamanan`
  ADD CONSTRAINT `fk_log_peristiwa_keamanan_akun` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `nilai_atribut_produk`
  ADD CONSTRAINT `fk_nilai_atribut_produk_atribut` FOREIGN KEY (`atribut_produk_id`) REFERENCES `atribut_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_nilai_atribut_produk_pilihan` FOREIGN KEY (`pilihan_atribut_produk_id`) REFERENCES `pilihan_atribut_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_nilai_atribut_produk_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `nilai_atribut_varian`
  ADD CONSTRAINT `fk_nilai_atribut_varian_atribut` FOREIGN KEY (`atribut_produk_id`) REFERENCES `atribut_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_nilai_atribut_varian_pilihan` FOREIGN KEY (`pilihan_atribut_produk_id`) REFERENCES `pilihan_atribut_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_nilai_atribut_varian_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `notifikasi`
  ADD CONSTRAINT `fk_notifikasi_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notifikasi_antrean_keluar` FOREIGN KEY (`antrean_keluar_id`) REFERENCES `antrean_keluar` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `opsi_pilihan_buket`
  ADD CONSTRAINT `fk_opsi_pilihan_buket_kategori` FOREIGN KEY (`kategori_pilihan_buket_id`) REFERENCES `kategori_pilihan_buket` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `pengaturan_sistem`
  ADD CONSTRAINT `fk_pengaturan_sistem_superadmin` FOREIGN KEY (`diperbarui_oleh_superadmin_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `pengembalian_dana`
  ADD CONSTRAINT `fk_pengembalian_dana_komplain` FOREIGN KEY (`komplain_id`) REFERENCES `komplain` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pengembalian_dana_pengaju` FOREIGN KEY (`diajukan_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pengembalian_dana_penyetuju` FOREIGN KEY (`disetujui_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pengembalian_dana_percobaan` FOREIGN KEY (`percobaan_pembayaran_pesanan_id`) REFERENCES `percobaan_pembayaran_pesanan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pengembalian_dana_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `pengiriman`
  ADD CONSTRAINT `fk_pengiriman_diperiksa_oleh` FOREIGN KEY (`diperiksa_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pengiriman_diserahkan_oleh` FOREIGN KEY (`diserahkan_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pengiriman_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `percobaan_pembayaran_pesanan`
  ADD CONSTRAINT `fk_percobaan_pembayaran_konfirmasi_cod` FOREIGN KEY (`dikonfirmasi_cod_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_percobaan_pembayaran_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `peristiwa_pembayaran`
  ADD CONSTRAINT `fk_peristiwa_pembayaran_percobaan` FOREIGN KEY (`percobaan_pembayaran_pesanan_id`) REFERENCES `percobaan_pembayaran_pesanan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `peristiwa_pengiriman`
  ADD CONSTRAINT `fk_peristiwa_pengiriman_pelaku` FOREIGN KEY (`pelaku_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_peristiwa_pengiriman_pengiriman` FOREIGN KEY (`pengiriman_id`) REFERENCES `pengiriman` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `permintaan_pembatalan`
  ADD CONSTRAINT `fk_permintaan_pembatalan_pemutus` FOREIGN KEY (`diputuskan_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_permintaan_pembatalan_pengaju` FOREIGN KEY (`diajukan_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_permintaan_pembatalan_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `persetujuan_operasi_sensitif`
  ADD CONSTRAINT `fk_persetujuan_sensitif_pengaju` FOREIGN KEY (`pengaju_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_persetujuan_sensitif_penyetuju` FOREIGN KEY (`penyetuju_kedua_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `pesanan`
  ADD CONSTRAINT `fk_pesanan_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pesanan_pemilik_penanganan` FOREIGN KEY (`pemilik_penanganan_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `pilihan_atribut_produk`
  ADD CONSTRAINT `fk_pilihan_atribut_atribut` FOREIGN KEY (`atribut_produk_id`) REFERENCES `atribut_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `pilihan_buket_keranjang`
  ADD CONSTRAINT `fk_pilihan_buket_keranjang_kategori` FOREIGN KEY (`kategori_pilihan_buket_id`) REFERENCES `kategori_pilihan_buket` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pilihan_buket_keranjang_konfigurasi` FOREIGN KEY (`konfigurasi_buket_keranjang_id`) REFERENCES `konfigurasi_buket_keranjang` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pilihan_buket_keranjang_opsi` FOREIGN KEY (`opsi_pilihan_buket_id`) REFERENCES `opsi_pilihan_buket` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `pilihan_buket_pesanan`
  ADD CONSTRAINT `fk_pilihan_buket_pesanan_kategori` FOREIGN KEY (`kategori_pilihan_buket_id`) REFERENCES `kategori_pilihan_buket` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pilihan_buket_pesanan_konfigurasi` FOREIGN KEY (`konfigurasi_buket_pesanan_id`) REFERENCES `konfigurasi_buket_pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pilihan_buket_pesanan_opsi` FOREIGN KEY (`opsi_pilihan_buket_id`) REFERENCES `opsi_pilihan_buket` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `poin_informasi_produk`
  ADD CONSTRAINT `fk_poin_informasi_produk_induk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `produk`
  ADD CONSTRAINT `fk_produk_dibuat_oleh` FOREIGN KEY (`dibuat_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_produk_kategori_utama` FOREIGN KEY (`kategori_utama_id`) REFERENCES `kategori_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `produksi_buket_pesanan`
  ADD CONSTRAINT `fk_produksi_buket_item` FOREIGN KEY (`item_pesanan_id`) REFERENCES `item_pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_produksi_buket_konfigurasi` FOREIGN KEY (`konfigurasi_buket_pesanan_id`) REFERENCES `konfigurasi_buket_pesanan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_produksi_buket_lokasi` FOREIGN KEY (`lokasi_stok_id`) REFERENCES `lokasi_stok` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_produksi_buket_perangkai` FOREIGN KEY (`perangkai_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_produksi_buket_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `rekonsiliasi_pembayaran_harian`
  ADD CONSTRAINT `fk_rekonsiliasi_penyetuju_kedua` FOREIGN KEY (`disetujui_kedua_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rekonsiliasi_percobaan` FOREIGN KEY (`percobaan_pembayaran_pesanan_id`) REFERENCES `percobaan_pembayaran_pesanan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rekonsiliasi_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rekonsiliasi_superadmin` FOREIGN KEY (`diselesaikan_oleh_superadmin_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `relasi_produk_kategori`
  ADD CONSTRAINT `fk_relasi_produk_kategori_kategori` FOREIGN KEY (`kategori_produk_id`) REFERENCES `kategori_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_relasi_produk_kategori_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `relasi_rekomendasi_produk`
  ADD CONSTRAINT `fk_rekomendasi_dibuat_oleh` FOREIGN KEY (`dibuat_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rekomendasi_produk_sumber` FOREIGN KEY (`produk_sumber_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rekomendasi_produk_target` FOREIGN KEY (`produk_rekomendasi_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `resep_buket`
  ADD CONSTRAINT `fk_resep_buket_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_resep_buket_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `reservasi_stok_pesanan`
  ADD CONSTRAINT `fk_reservasi_stok_item_pesanan` FOREIGN KEY (`item_pesanan_id`) REFERENCES `item_pesanan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reservasi_stok_lokasi` FOREIGN KEY (`lokasi_stok_id`) REFERENCES `lokasi_stok` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reservasi_stok_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reservasi_stok_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reservasi_stok_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `riwayat_perubahan_stok_bahan`
  ADD CONSTRAINT `fk_riwayat_stok_bahan_bahan` FOREIGN KEY (`bahan_produksi_id`) REFERENCES `bahan_produksi` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_stok_bahan_lokasi` FOREIGN KEY (`lokasi_stok_id`) REFERENCES `lokasi_stok` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_stok_bahan_pelaku` FOREIGN KEY (`pelaku_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `riwayat_perubahan_stok_produk`
  ADD CONSTRAINT `fk_riwayat_stok_produk_batch` FOREIGN KEY (`batch_persediaan_id`) REFERENCES `batch_persediaan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_stok_produk_lokasi` FOREIGN KEY (`lokasi_stok_id`) REFERENCES `lokasi_stok` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_stok_produk_pelaku` FOREIGN KEY (`pelaku_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_stok_produk_penyetuju` FOREIGN KEY (`disetujui_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_stok_produk_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_stok_produk_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `riwayat_status_pesanan`
  ADD CONSTRAINT `fk_riwayat_status_pesanan_koreksi` FOREIGN KEY (`referensi_koreksi_riwayat_id`) REFERENCES `riwayat_status_pesanan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_status_pesanan_pelaku` FOREIGN KEY (`pelaku_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_status_pesanan_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `riwayat_status_produksi_buket`
  ADD CONSTRAINT `fk_riwayat_status_produksi_induk` FOREIGN KEY (`produksi_buket_pesanan_id`) REFERENCES `produksi_buket_pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_status_produksi_pelaku` FOREIGN KEY (`pelaku_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `sesi_login`
  ADD CONSTRAINT `fk_sesi_login_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `stok_bahan_produksi`
  ADD CONSTRAINT `fk_stok_bahan_produksi_bahan` FOREIGN KEY (`bahan_produksi_id`) REFERENCES `bahan_produksi` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_stok_bahan_produksi_lokasi` FOREIGN KEY (`lokasi_stok_id`) REFERENCES `lokasi_stok` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `stok_varian_produk`
  ADD CONSTRAINT `fk_stok_varian_produk_lokasi` FOREIGN KEY (`lokasi_stok_id`) REFERENCES `lokasi_stok` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_stok_varian_produk_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_stok_varian_produk_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `tanggal_tutup`
  ADD CONSTRAINT `fk_tanggal_tutup_ditetapkan_oleh` FOREIGN KEY (`ditetapkan_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `ulasan_produk`
  ADD CONSTRAINT `fk_ulasan_produk_akun` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ulasan_produk_item` FOREIGN KEY (`item_pesanan_id`) REFERENCES `item_pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ulasan_produk_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ulasan_produk_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ulasan_produk_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `varian_produk`
  ADD CONSTRAINT `fk_varian_produk_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE ALGORITHM=UNDEFINED SQL SECURITY INVOKER VIEW `bahan_florist`  AS SELECT `bahan_produksi`.`id` AS `id`, `bahan_produksi`.`kode_bahan` AS `kode_bahan`, `bahan_produksi`.`nama_bahan` AS `nama_bahan`, `bahan_produksi`.`kelompok_bahan` AS `kelompok_bahan`, `bahan_produksi`.`satuan_bahan` AS `satuan_bahan`, `bahan_produksi`.`jenis_ketahanan_bahan` AS `jenis_ketahanan_bahan`, `bahan_produksi`.`masa_simpan_hari` AS `masa_simpan_hari`, `bahan_produksi`.`biaya_pokok_satuan_rupiah` AS `biaya_pokok_satuan_rupiah`, `bahan_produksi`.`jumlah_stok_bahan` AS `jumlah_stok_bahan`, `bahan_produksi`.`ambang_stok_rendah` AS `ambang_stok_rendah`, `bahan_produksi`.`status_aktif` AS `status_aktif`, `bahan_produksi`.`dibuat_pada` AS `dibuat_pada`, `bahan_produksi`.`diperbarui_pada` AS `diperbarui_pada` FROM `bahan_produksi` ;

CREATE ALGORITHM=UNDEFINED SQL SECURITY INVOKER VIEW `kategori`  AS SELECT `kategori_produk`.`id` AS `id`, `kategori_produk`.`kategori_induk_id` AS `kategori_induk_id`, `kategori_produk`.`kode_kategori` AS `kode_kategori`, `kategori_produk`.`nama_kategori` AS `nama_kategori`, `kategori_produk`.`slug_kategori` AS `slug_kategori`, `kategori_produk`.`kelompok_domain` AS `kelompok_domain`, `kategori_produk`.`deskripsi_kategori` AS `deskripsi_kategori`, `kategori_produk`.`url_gambar_banner` AS `url_gambar_banner`, `kategori_produk`.`urutan_tampil` AS `urutan_tampil`, `kategori_produk`.`status_aktif` AS `status_aktif`, `kategori_produk`.`dibuat_pada` AS `dibuat_pada`, `kategori_produk`.`diperbarui_pada` AS `diperbarui_pada` FROM `kategori_produk` ;

CREATE ALGORITHM=UNDEFINED SQL SECURITY INVOKER VIEW `mutasi_stok_bahan`  AS SELECT `riwayat_perubahan_stok_bahan`.`id` AS `id`, `riwayat_perubahan_stok_bahan`.`bahan_produksi_id` AS `bahan_produksi_id`, `riwayat_perubahan_stok_bahan`.`lokasi_stok_id` AS `lokasi_stok_id`, `riwayat_perubahan_stok_bahan`.`jenis_mutasi_bahan` AS `jenis_mutasi_bahan`, `riwayat_perubahan_stok_bahan`.`perubahan_kuantitas` AS `perubahan_kuantitas`, `riwayat_perubahan_stok_bahan`.`saldo_setelah_mutasi` AS `saldo_setelah_mutasi`, `riwayat_perubahan_stok_bahan`.`jenis_referensi` AS `jenis_referensi`, `riwayat_perubahan_stok_bahan`.`referensi_id` AS `referensi_id`, `riwayat_perubahan_stok_bahan`.`kunci_idempotensi` AS `kunci_idempotensi`, `riwayat_perubahan_stok_bahan`.`pelaku_akun_id` AS `pelaku_akun_id`, `riwayat_perubahan_stok_bahan`.`alasan_mutasi` AS `alasan_mutasi`, `riwayat_perubahan_stok_bahan`.`dibuat_pada` AS `dibuat_pada` FROM `riwayat_perubahan_stok_bahan` ;

CREATE ALGORITHM=UNDEFINED SQL SECURITY INVOKER VIEW `mutasi_stok_produk`  AS SELECT `riwayat_perubahan_stok_produk`.`id` AS `id`, `riwayat_perubahan_stok_produk`.`produk_id` AS `produk_id`, `riwayat_perubahan_stok_produk`.`varian_produk_id` AS `varian_produk_id`, `riwayat_perubahan_stok_produk`.`lokasi_stok_id` AS `lokasi_stok_id`, `riwayat_perubahan_stok_produk`.`batch_persediaan_id` AS `batch_persediaan_id`, `riwayat_perubahan_stok_produk`.`jenis_mutasi_stok` AS `jenis_mutasi_stok`, `riwayat_perubahan_stok_produk`.`perubahan_kuantitas` AS `perubahan_kuantitas`, `riwayat_perubahan_stok_produk`.`saldo_setelah_mutasi` AS `saldo_setelah_mutasi`, `riwayat_perubahan_stok_produk`.`jenis_referensi` AS `jenis_referensi`, `riwayat_perubahan_stok_produk`.`referensi_id` AS `referensi_id`, `riwayat_perubahan_stok_produk`.`kunci_idempotensi` AS `kunci_idempotensi`, `riwayat_perubahan_stok_produk`.`pelaku_akun_id` AS `pelaku_akun_id`, `riwayat_perubahan_stok_produk`.`disetujui_oleh_akun_id` AS `disetujui_oleh_akun_id`, `riwayat_perubahan_stok_produk`.`alasan_mutasi` AS `alasan_mutasi`, `riwayat_perubahan_stok_produk`.`dibuat_pada` AS `dibuat_pada` FROM `riwayat_perubahan_stok_produk` ;

CREATE ALGORITHM=UNDEFINED SQL SECURITY INVOKER VIEW `snapshot_produk_pesanan`  AS SELECT `item_pesanan`.`id` AS `snapshot_produk_pesanan_id`, `item_pesanan`.`pesanan_id` AS `pesanan_id`, `item_pesanan`.`id` AS `item_pesanan_id`, `item_pesanan`.`produk_id` AS `produk_id`, `item_pesanan`.`varian_produk_id` AS `varian_produk_id`, `item_pesanan`.`sku_snapshot` AS `sku_snapshot`, `item_pesanan`.`nama_produk_snapshot` AS `nama_produk_snapshot`, `item_pesanan`.`nama_varian_snapshot` AS `nama_varian_snapshot`, `item_pesanan`.`atribut_varian_snapshot` AS `atribut_varian_snapshot`, `item_pesanan`.`satuan_jual_snapshot` AS `satuan_jual_snapshot`, `item_pesanan`.`jenis_produk_snapshot` AS `jenis_produk_snapshot`, `item_pesanan`.`jenis_penanganan_snapshot` AS `jenis_penanganan_snapshot`, `item_pesanan`.`deskripsi_penting_snapshot` AS `deskripsi_penting_snapshot`, `item_pesanan`.`harga_normal_satuan_snapshot` AS `harga_normal_satuan_snapshot`, `item_pesanan`.`harga_diskon_satuan_snapshot` AS `harga_diskon_satuan_snapshot`, `item_pesanan`.`tambahan_harga_kustomisasi_satuan` AS `tambahan_harga_kustomisasi_satuan`, `item_pesanan`.`harga_satuan_final_snapshot` AS `harga_satuan_final_snapshot`, `item_pesanan`.`berat_satuan_gram_snapshot` AS `berat_satuan_gram_snapshot`, `item_pesanan`.`kuantitas` AS `kuantitas`, `item_pesanan`.`subtotal_baris_rupiah` AS `subtotal_baris_rupiah`, `item_pesanan`.`dibuat_pada` AS `dibuat_pada` FROM `item_pesanan` ;

CREATE ALGORITHM=UNDEFINED SQL SECURITY INVOKER VIEW `stok_bahan_florist`  AS SELECT `stok_bahan_produksi`.`id` AS `id`, `stok_bahan_produksi`.`bahan_produksi_id` AS `bahan_produksi_id`, `stok_bahan_produksi`.`lokasi_stok_id` AS `lokasi_stok_id`, `stok_bahan_produksi`.`jumlah_stok_saldo` AS `jumlah_stok_saldo`, `stok_bahan_produksi`.`jumlah_stok_dialokasikan` AS `jumlah_stok_dialokasikan`, `stok_bahan_produksi`.`diperbarui_pada` AS `diperbarui_pada` FROM `stok_bahan_produksi` ;

CREATE ALGORITHM=UNDEFINED SQL SECURITY INVOKER VIEW `vw_ringkasan_dasbor_admin`  AS SELECT (select count(0) from `pesanan` where (`pesanan`.`status_pesanan` = 'SIAP_DIPROSES')) AS `jumlah_pesanan_siap_diproses`, (select count(0) from `pesanan` where ((`pesanan`.`status_pesanan` in ('SIAP_DIPROSES','SEDANG_DISIAPKAN')) and (`pesanan`.`tanggal_pengiriman` = curdate()))) AS `jumlah_perlu_dikirim_hari_ini`, (select count(0) from `pesanan` where (`pesanan`.`status_pesanan` = 'PERLU_PENANGANAN')) AS `jumlah_pesanan_perlu_penanganan`, (select count(0) from `pesanan` where ((`pesanan`.`status_pembayaran` = 'PERLU_DITINJAU') or (`pesanan`.`kode_perlu_penanganan` in ('PH_02','PH_03')))) AS `jumlah_pembayaran_perlu_ditinjau`, ((select count(0) from `permintaan_pembatalan` where (`permintaan_pembatalan`.`status_permintaan` = 'DIAJUKAN')) + (select count(0) from `pengembalian_dana` where (`pengembalian_dana`.`status_refund` = 'DIAJUKAN'))) AS `jumlah_batal_dan_refund_menunggu`, (select count(0) from `komplain` where (`komplain`.`status_komplain` in ('DIAJUKAN','DALAM_TINJAUAN','DIESKALASI'))) AS `jumlah_komplain_terbuka`, (select count(0) from `produk` where ((`produk`.`status_produk` = 'AKTIF') and (`produk`.`jumlah_stok_jual` <= `produk`.`ambang_stok_rendah`))) AS `jumlah_produk_stok_rendah`, (select count(0) from `pengiriman` where (`pengiriman`.`status_pengiriman` in ('TERKENDALA','DIKEMBALIKAN'))) AS `jumlah_pengiriman_terkendala` ;

CREATE ALGORITHM=UNDEFINED SQL SECURITY INVOKER VIEW `vw_ringkasan_detail_produk`  AS SELECT `p`.`id` AS `produk_id`, `p`.`sku` AS `sku`, `p`.`nama_produk` AS `nama_produk`, `p`.`slug_produk` AS `slug_produk`, `p`.`nama_spesies_tanaman` AS `nama_spesies_tanaman`, `p`.`subjudul_singkat` AS `subjudul_singkat`, `p`.`ringkasan_singkat` AS `ringkasan_singkat`, `p`.`deskripsi_produk` AS `deskripsi_produk`, `p`.`kategori_utama_id` AS `kategori_utama_id`, `kp`.`nama_kategori` AS `nama_kategori_utama`, `kp`.`slug_kategori` AS `slug_kategori_utama`, `p`.`jenis_produk` AS `jenis_produk`, `p`.`jenis_penanganan` AS `jenis_penanganan`, `p`.`satuan_jual` AS `satuan_jual`, `p`.`catatan_kelengkapan_jual` AS `catatan_kelengkapan_jual`, `p`.`memiliki_varian` AS `memiliki_varian`, `p`.`harga_dasar_rupiah` AS `harga_dasar_rupiah`, `p`.`harga_diskon_rupiah` AS `harga_diskon_rupiah`, (case when ((`p`.`harga_diskon_rupiah` is not null) and ((`p`.`waktu_mulai_diskon` is null) or (`p`.`waktu_mulai_diskon` <= utc_timestamp())) and ((`p`.`waktu_selesai_diskon` is null) or (`p`.`waktu_selesai_diskon` >= utc_timestamp()))) then `p`.`harga_diskon_rupiah` else `p`.`harga_dasar_rupiah` end) AS `harga_efektif_rupiah`, (select `gp`.`kunci_penyimpanan_berkas` from `gambar_produk` `gp` where (`gp`.`produk_id` = `p`.`id`) order by `gp`.`status_gambar_utama` desc,`gp`.`urutan_tampil` limit 1) AS `kunci_gambar_utama`, (select count(0) from `gambar_produk` `gp2` where (`gp2`.`produk_id` = `p`.`id`)) AS `jumlah_total_gambar`, (select count(0) from `poin_informasi_produk` `pip` where ((`pip`.`produk_id` = `p`.`id`) and (`pip`.`status_aktif` = 'AKTIF'))) AS `jumlah_poin_accordion`, `p`.`jumlah_stok_jual` AS `jumlah_stok_jual`, `p`.`ambang_stok_rendah` AS `ambang_stok_rendah`, (case when (`p`.`jumlah_stok_jual` <= 0) then 'STOK_HABIS' when (`p`.`jumlah_stok_jual` <= `p`.`ambang_stok_rendah`) then 'STOK_TERBATAS' else 'TERSEDIA' end) AS `status_ketersediaan_stok`, `p`.`jumlah_unit_terjual` AS `jumlah_unit_terjual`, coalesce((select round(avg(`up`.`nilai_bintang`),1) from `ulasan_produk` `up` where ((`up`.`produk_id` = `p`.`id`) and (`up`.`status_tampil` = 'DITAMPILKAN'))),0.0) AS `rata_rata_bintang`, (select count(0) from `ulasan_produk` `up2` where ((`up2`.`produk_id` = `p`.`id`) and (`up2`.`status_tampil` = 'DITAMPILKAN'))) AS `jumlah_ulasan_tampil`, `p`.`status_produk` AS `status_produk` FROM (`produk` `p` join `kategori_produk` `kp` on((`kp`.`id` = `p`.`kategori_utama_id`))) ;

CREATE ALGORITHM=UNDEFINED SQL SECURITY INVOKER VIEW `vw_stok_tersedia_checkout`  AS SELECT `p`.`id` AS `produk_id`, `v`.`id` AS `varian_produk_id`, coalesce(`v`.`sku_varian`,`p`.`sku`) AS `sku_aktif`, `p`.`nama_produk` AS `nama_produk`, `v`.`nama_varian` AS `nama_varian`, coalesce(`v`.`satuan_jual_varian`,`p`.`satuan_jual`) AS `satuan_jual`, `p`.`jenis_produk` AS `jenis_produk`, `p`.`jenis_penanganan` AS `jenis_penanganan`, coalesce(`v`.`jumlah_stok_varian`,`p`.`jumlah_stok_jual`) AS `saldo_stok_buku_besar`, coalesce((select sum(`r`.`kuantitas_direservasi`) from `reservasi_stok_pesanan` `r` where ((`r`.`produk_id` = `p`.`id`) and ((`v`.`id` is null) or (`r`.`varian_produk_id` = `v`.`id`)) and (`r`.`status_reservasi` = 'ACTIVE') and (`r`.`waktu_kedaluwarsa` > utc_timestamp()))),0) AS `jumlah_reservasi_aktif`, greatest(0,(coalesce(`v`.`jumlah_stok_varian`,`p`.`jumlah_stok_jual`) - coalesce((select sum(`r`.`kuantitas_direservasi`) from `reservasi_stok_pesanan` `r` where ((`r`.`produk_id` = `p`.`id`) and ((`v`.`id` is null) or (`r`.`varian_produk_id` = `v`.`id`)) and (`r`.`status_reservasi` = 'ACTIVE') and (`r`.`waktu_kedaluwarsa` > utc_timestamp()))),0))) AS `stok_tersedia_untuk_checkout`, coalesce(`v`.`ambang_stok_rendah`,`p`.`ambang_stok_rendah`) AS `ambang_stok_rendah` FROM (`produk` `p` left join `varian_produk` `v` on(((`v`.`produk_id` = `p`.`id`) and (`v`.`status_varian` = 'AKTIF')))) WHERE (`p`.`status_produk` = 'AKTIF') ;

CREATE ALGORITHM=UNDEFINED SQL SECURITY INVOKER VIEW `vw_rekomendasi_produk_aktif`  AS SELECT `rrp`.`id` AS `relasi_id`, `rrp`.`produk_sumber_id` AS `produk_sumber_id`, `rrp`.`produk_rekomendasi_id` AS `produk_rekomendasi_id`, `rrp`.`jenis_rekomendasi` AS `jenis_rekomendasi`, `rrp`.`label_alasan_rekomendasi` AS `label_alasan_rekomendasi`, `rrp`.`urutan_tampil` AS `urutan_tampil`, `vrd`.`sku` AS `sku`, `vrd`.`nama_produk` AS `nama_produk`, `vrd`.`slug_produk` AS `slug_produk`, `vrd`.`nama_spesies_tanaman` AS `nama_spesies_tanaman`, `vrd`.`nama_kategori_utama` AS `nama_kategori_utama`, `vrd`.`slug_kategori_utama` AS `slug_kategori_utama`, `vrd`.`jenis_produk` AS `jenis_produk`, `vrd`.`jenis_penanganan` AS `jenis_penanganan`, `vrd`.`satuan_jual` AS `satuan_jual`, `vrd`.`memiliki_varian` AS `memiliki_varian`, `vrd`.`harga_dasar_rupiah` AS `harga_dasar_rupiah`, `vrd`.`harga_diskon_rupiah` AS `harga_diskon_rupiah`, `vrd`.`harga_efektif_rupiah` AS `harga_efektif_rupiah`, `vrd`.`kunci_gambar_utama` AS `kunci_gambar_utama`, `vrd`.`jumlah_stok_jual` AS `jumlah_stok_jual`, `vrd`.`status_ketersediaan_stok` AS `status_ketersediaan_stok`, `vrd`.`jumlah_unit_terjual` AS `jumlah_unit_terjual`, `vrd`.`rata_rata_bintang` AS `rata_rata_bintang`, `vrd`.`jumlah_ulasan_tampil` AS `jumlah_ulasan_tampil` FROM (`relasi_rekomendasi_produk` `rrp` join `vw_ringkasan_detail_produk` `vrd` on((`vrd`.`produk_id` = `rrp`.`produk_rekomendasi_id`))) WHERE ((`rrp`.`status_aktif` = 'AKTIF') AND (`vrd`.`status_produk` = 'AKTIF') AND (`vrd`.`jumlah_stok_jual` > 0)) ;

DELIMITER $$
CREATE TRIGGER `trg_catatan_pesanan_cegah_hapus` BEFORE DELETE ON `catatan_pesanan` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_CATATAN_PESANAN: Catatan pesanan tidak boleh dihapus.';
END
$$

CREATE TRIGGER `trg_catatan_pesanan_cegah_ubah` BEFORE UPDATE ON `catatan_pesanan` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_CATATAN_PESANAN: Catatan pesanan dan bukti kesepakatan pelanggan bersifat append-only.';
END
$$

CREATE TRIGGER `trg_komponen_paket_validasi_insert` BEFORE INSERT ON `komponen_paket_berkebun` FOR EACH ROW BEGIN
  IF NEW.`produk_paket_id` = NEW.`produk_komponen_id` THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'VALIDASI_PAKET_BERKEBUN: Produk paket tidak boleh merujuk dirinya sendiri sebagai komponen.';
  END IF;
  IF NEW.`kuantitas_komponen` = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'VALIDASI_PAKET_BERKEBUN: Kuantitas komponen dalam paket wajib lebih besar dari 0.';
  END IF;
END
$$

CREATE TRIGGER `trg_komponen_paket_validasi_update` BEFORE UPDATE ON `komponen_paket_berkebun` FOR EACH ROW BEGIN
  IF NEW.`produk_paket_id` = NEW.`produk_komponen_id` THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'VALIDASI_PAKET_BERKEBUN: Produk paket tidak boleh merujuk dirinya sendiri sebagai komponen.';
  END IF;
  IF NEW.`kuantitas_komponen` = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'VALIDASI_PAKET_BERKEBUN: Kuantitas komponen dalam paket wajib lebih besar dari 0.';
  END IF;
END
$$

CREATE TRIGGER `trg_log_audit_cegah_hapus` BEFORE DELETE ON `log_audit` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_KEAMANAN_BR12: Entri log_audit bersifat append-only dan tidak boleh dihapus oleh siapa pun.';
END
$$

CREATE TRIGGER `trg_log_audit_cegah_ubah` BEFORE UPDATE ON `log_audit` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_KEAMANAN_BR12: Entri log_audit bersifat append-only dan tidak boleh diubah oleh siapa pun.';
END
$$

CREATE TRIGGER `trg_log_audit_sebelum_insert` BEFORE INSERT ON `log_audit` FOR EACH ROW BEGIN
  DECLARE v_hash_terakhir CHAR(64);
  SELECT `hash_entri` INTO v_hash_terakhir
  FROM `log_audit`
  ORDER BY `id` DESC
  LIMIT 1;
  IF v_hash_terakhir IS NULL THEN
    SET v_hash_terakhir = REPEAT('0', 64);
  END IF;
  SET NEW.`hash_sebelumnya` = v_hash_terakhir;
  SET NEW.`hash_entri` = SHA2(
    CONCAT(
      v_hash_terakhir, '|',
      COALESCE(DATE_FORMAT(NEW.`waktu_kejadian`, '%Y-%m-%d %H:%i:%s'), ''), '|',
      COALESCE(NEW.`jenis_pelaku`, ''), '|',
      COALESCE(CAST(NEW.`pelaku_akun_id` AS CHAR), 'SISTEM'), '|',
      COALESCE(NEW.`peran_pelaku`, ''), '|',
      COALESCE(NEW.`kode_tindakan`, ''), '|',
      COALESCE(NEW.`jenis_objek`, ''), '|',
      COALESCE(NEW.`id_objek`, ''), '|',
      COALESCE(CAST(NEW.`nilai_sebelum_json` AS CHAR), 'NULL'), '|',
      COALESCE(CAST(NEW.`nilai_sesudah_json` AS CHAR), 'NULL'), '|',
      COALESCE(NEW.`hasil_tindakan`, ''), '|',
      COALESCE(NEW.`alamat_ip_pelaku`, '')
    ),
    256
  );
END
$$

CREATE TRIGGER `trg_pengembalian_dana_maker_checker_insert` BEFORE INSERT ON `pengembalian_dana` FOR EACH ROW BEGIN
  IF NEW.`total_nominal_refund_rupiah` = 0 OR NEW.`total_nominal_refund_rupiah` <> (NEW.`nominal_refund_produk_rupiah` + NEW.`nominal_refund_ongkir_rupiah`) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'VALIDASI_REFUND_BR16: Total nominal refund wajib positif dan sama dengan jumlah refund produk + ongkir.';
  END IF;
  IF NEW.`jenis_persetujuan` <> 'OTOMATIS_SISTEM'
     AND NEW.`diajukan_oleh_akun_id` IS NOT NULL
     AND NEW.`disetujui_oleh_akun_id` IS NOT NULL
     AND NEW.`diajukan_oleh_akun_id` = NEW.`disetujui_oleh_akun_id` THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PELANGGARAN_MAKER_CHECKER_BR17: Pengaju refund tidak boleh menyetujui refund yang diajukannya sendiri.';
  END IF;
END
$$

CREATE TRIGGER `trg_pengembalian_dana_maker_checker_update` BEFORE UPDATE ON `pengembalian_dana` FOR EACH ROW BEGIN
  IF NEW.`total_nominal_refund_rupiah` = 0 OR NEW.`total_nominal_refund_rupiah` <> (NEW.`nominal_refund_produk_rupiah` + NEW.`nominal_refund_ongkir_rupiah`) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'VALIDASI_REFUND_BR16: Total nominal refund wajib positif dan sama dengan jumlah refund produk + ongkir.';
  END IF;
  IF NEW.`jenis_persetujuan` <> 'OTOMATIS_SISTEM'
     AND NEW.`diajukan_oleh_akun_id` IS NOT NULL
     AND NEW.`disetujui_oleh_akun_id` IS NOT NULL
     AND NEW.`diajukan_oleh_akun_id` = NEW.`disetujui_oleh_akun_id` THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PELANGGARAN_MAKER_CHECKER_BR17: Pengaju refund tidak boleh menyetujui refund yang diajukannya sendiri.';
  END IF;
END
$$

CREATE TRIGGER `trg_persetujuan_sensitif_dual_control` BEFORE UPDATE ON `persetujuan_operasi_sensitif` FOR EACH ROW BEGIN
  IF NEW.`penyetuju_kedua_akun_id` IS NOT NULL AND NEW.`penyetuju_kedua_akun_id` = NEW.`pengaju_akun_id` THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PELANGGARAN_DUAL_CONTROL_D18: Penyetuju kedua wajib orang yang berbeda dari pengaju operasi sensitif.';
  END IF;
END
$$

CREATE TRIGGER `trg_produk_cegah_hapus_bertransaksi` BEFORE DELETE ON `produk` FOR EACH ROW BEGIN
  DECLARE v_jumlah_transaksi INT DEFAULT 0;
  SELECT COUNT(*) INTO v_jumlah_transaksi FROM `item_pesanan` WHERE `produk_id` = OLD.`id`;
  IF v_jumlah_transaksi > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PELANGGARAN_BR15: Produk yang memiliki riwayat pesanan tidak boleh dihapus permanen; ubah status_produk menjadi NONAKTIF.';
  END IF;
END
$$

CREATE TRIGGER `trg_produk_cegah_stok_negatif` BEFORE UPDATE ON `produk` FOR EACH ROW BEGIN
  IF NEW.`jumlah_stok_jual` < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PELANGGARAN_STOK_BR05: Saldo jumlah_stok_jual pada produk tidak boleh bernilai negatif.';
  END IF;
END
$$

CREATE TRIGGER `trg_rekomendasi_cegah_diri_sendiri_insert` BEFORE INSERT ON `relasi_rekomendasi_produk` FOR EACH ROW BEGIN
  IF NEW.`produk_sumber_id` = NEW.`produk_rekomendasi_id` THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'VALIDASI_REKOMENDASI_ADR001: Produk tidak boleh merekomendasikan dirinya sendiri.';
  END IF;
END
$$

CREATE TRIGGER `trg_rekomendasi_cegah_diri_sendiri_update` BEFORE UPDATE ON `relasi_rekomendasi_produk` FOR EACH ROW BEGIN
  IF NEW.`produk_sumber_id` = NEW.`produk_rekomendasi_id` THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'VALIDASI_REKOMENDASI_ADR001: Produk tidak boleh merekomendasikan dirinya sendiri.';
  END IF;
END
$$

CREATE TRIGGER `trg_riwayat_stok_bahan_cegah_hapus` BEFORE DELETE ON `riwayat_perubahan_stok_bahan` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_BUKU_BESAR_BAHAN: Buku besar riwayat_perubahan_stok_bahan tidak boleh dihapus.';
END
$$

CREATE TRIGGER `trg_riwayat_stok_bahan_cegah_ubah` BEFORE UPDATE ON `riwayat_perubahan_stok_bahan` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_BUKU_BESAR_BAHAN: Buku besar riwayat_perubahan_stok_bahan bersifat append-only; gunakan entri koreksi baru.';
END
$$

CREATE TRIGGER `trg_riwayat_stok_produk_cegah_hapus` BEFORE DELETE ON `riwayat_perubahan_stok_produk` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_BUKU_BESAR_STOK: Buku besar riwayat_perubahan_stok_produk tidak boleh dihapus.';
END
$$

CREATE TRIGGER `trg_riwayat_stok_produk_cegah_ubah` BEFORE UPDATE ON `riwayat_perubahan_stok_produk` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_BUKU_BESAR_STOK: Buku besar riwayat_perubahan_stok_produk bersifat append-only; gunakan entri koreksi baru.';
END
$$

CREATE TRIGGER `trg_riwayat_status_pesanan_cegah_hapus` BEFORE DELETE ON `riwayat_status_pesanan` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_RIWAYAT_PESANAN: Riwayat transisi status pesanan tidak boleh dihapus.';
END
$$

CREATE TRIGGER `trg_riwayat_status_pesanan_cegah_ubah` BEFORE UPDATE ON `riwayat_status_pesanan` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_RIWAYAT_PESANAN: Riwayat transisi status pesanan bersifat append-only; koreksi wajib melalui T-19.';
END
$$

CREATE TRIGGER `trg_riwayat_status_produksi_cegah_hapus` BEFORE DELETE ON `riwayat_status_produksi_buket` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_RIWAYAT_PRODUKSI: Riwayat status produksi buket tidak boleh dihapus.';
END
$$

CREATE TRIGGER `trg_riwayat_status_produksi_cegah_ubah` BEFORE UPDATE ON `riwayat_status_produksi_buket` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_RIWAYAT_PRODUKSI: Riwayat status produksi buket bersifat append-only.';
END
$$

CREATE TRIGGER `trg_varian_produk_cegah_stok_negatif` BEFORE UPDATE ON `varian_produk` FOR EACH ROW BEGIN
  IF NEW.`jumlah_stok_varian` < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PELANGGARAN_STOK_BR05: Saldo jumlah_stok_varian tidak boleh bernilai negatif.';
  END IF;
END
$$
DELIMITER ;
