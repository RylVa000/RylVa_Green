-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Nov 10, 2026 at 03:25 PM
-- Server version: 8.4.3
-- PHP Version: 8.3.36

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `rylva_green`
--

-- --------------------------------------------------------

--
-- Table structure for table `akun_pengguna`
--

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

--
-- Dumping data for table `akun_pengguna`
--

INSERT INTO `akun_pengguna` (`id`, `peran`, `email`, `hash_kata_sandi`, `status_akun`, `nama_lengkap`, `nomor_telepon`, `rahasia_mfa_terenkripsi`, `status_mfa_aktif`, `hash_kode_cadangan_mfa`, `versi_persetujuan_privasi`, `waktu_persetujuan_privasi`, `jumlah_gagal_login_berturut`, `waktu_terkunci_hingga`, `alasan_penonaktifan`, `dinonaktifkan_oleh_akun_id`, `waktu_login_terakhir`, `waktu_aktivitas_terakhir`, `waktu_peringatan_anonimisasi`, `waktu_dianonimkan`, `dibuat_pada`, `diperbarui_pada`) VALUES
(1, 'SUPERADMIN', 'superadmin.utama@rylvagreen.id', '$2y$12$ContohHashArgon2AtauBcryptWajibDigantiSaatPeluncuran0001', 'AKTIF', 'SuperAdmin Utama RylVa Green', '+6281100000001', NULL, 1, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(2, 'SUPERADMIN', 'superadmin.cadangan@rylvagreen.id', '$2y$12$ContohHashArgon2AtauBcryptWajibDigantiSaatPeluncuran0002', 'AKTIF', 'SuperAdmin Cadangan (Penyetuju Kedua D-18)', '+6281100000002', NULL, 1, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(3, 'ADMIN', 'admin.operasional@rylvagreen.id', '$2y$12$ContohHashArgon2AtauBcryptWajibDigantiSaatPeluncuran0003', 'AKTIF', 'Admin Operasional Florist & Kebun', '+6281100000003', NULL, 1, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52');

-- --------------------------------------------------------

--
-- Table structure for table `alamat_pengguna`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `antrean_keluar`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `atribut_produk`
--

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

--
-- Dumping data for table `atribut_produk`
--

INSERT INTO `atribut_produk` (`id`, `kode_atribut`, `nama_atribut`, `tipe_data_atribut`, `satuan_atribut`, `dapat_menjadi_pembeda_varian`, `dapat_difilter_di_katalog`, `urutan_tampil`, `status_aktif`, `dibuat_pada`, `diperbarui_pada`) VALUES
(1, 'DIAMETER_POT', 'Diameter Pot', 'PILIHAN_TUNGGAL', 'cm', 1, 1, 1, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(2, 'VOLUME_KEMASAN', 'Volume Kemasan', 'PILIHAN_TUNGGAL', 'Liter', 1, 1, 2, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(3, 'WARNA_PRODUK', 'Warna', 'PILIHAN_TUNGGAL', NULL, 1, 1, 3, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(4, 'BAHAN_MATERIAL', 'Bahan Material', 'PILIHAN_TUNGGAL', NULL, 0, 1, 4, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(5, 'KEBUTUHAN_CAHAYA', 'Kebutuhan Cahaya Tanaman', 'PILIHAN_TUNGGAL', NULL, 0, 1, 5, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(6, 'FREKUENSI_PENYIRAMAN', 'Kebutuhan Air / Penyiraman', 'PILIHAN_TUNGGAL', NULL, 0, 1, 6, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(7, 'LUBANG_DRAINASE', 'Memiliki Lubang Drainase', 'BOOLEAN', NULL, 0, 1, 7, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52');

-- --------------------------------------------------------

--
-- Stand-in structure for view `bahan_florist`
-- (See below for the actual view)
--
CREATE TABLE `bahan_florist` (
`id` bigint unsigned
,`kode_bahan` varchar(50)
,`nama_bahan` varchar(150)
,`kelompok_bahan` enum('BUNGA_UTAMA','BUNGA_PENDAMPING_FILLER','DAUN_HIAS_FOLIAGE','KERTAS_PEMBUNGKUS','PITA_DAN_TALI','MEDIA_RANGKAI_FOAM','KARTU_DAN_AKSESORI')
,`satuan_bahan` enum('TANGKAI','IKAT','LEMBAR','METER','PCS','BLOK','SET')
,`jenis_ketahanan_bahan` enum('SEGAR_MUDAH_LAYU','KERING_AWET','BAHAN_PENDUKUNG_MATI')
,`masa_simpan_hari` int unsigned
,`biaya_pokok_satuan_rupiah` bigint unsigned
,`jumlah_stok_bahan` decimal(12,2)
,`ambang_stok_rendah` decimal(12,2)
,`status_aktif` enum('AKTIF','NONAKTIF')
,`dibuat_pada` datetime
,`diperbarui_pada` datetime
);

-- --------------------------------------------------------

--
-- Table structure for table `bahan_produksi`
--

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

--
-- Dumping data for table `bahan_produksi`
--

INSERT INTO `bahan_produksi` (`id`, `kode_bahan`, `nama_bahan`, `kelompok_bahan`, `satuan_bahan`, `jenis_ketahanan_bahan`, `masa_simpan_hari`, `biaya_pokok_satuan_rupiah`, `jumlah_stok_bahan`, `ambang_stok_rendah`, `status_aktif`, `dibuat_pada`, `diperbarui_pada`) VALUES
(1, 'BHN-MAWAR-MERAH', 'Bunga Mawar Merah Segar Grade A', 'BUNGA_UTAMA', 'TANGKAI', 'SEGAR_MUDAH_LAYU', 5, 8000, 200.00, 30.00, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(2, 'BHN-MAWAR-PUTIH', 'Bunga Mawar Putih Avalanche Segar', 'BUNGA_UTAMA', 'TANGKAI', 'SEGAR_MUDAH_LAYU', 5, 8500, 150.00, 25.00, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(3, 'BHN-BABY-BREATH', 'Bunga Baby Breath Putih Filler', 'BUNGA_PENDAMPING_FILLER', 'IKAT', 'SEGAR_MUDAH_LAYU', 7, 15000, 60.00, 10.00, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(4, 'BHN-EUCALYPTUS', 'Daun Eucalyptus Silver Dollar', 'DAUN_HIAS_FOLIAGE', 'IKAT', 'SEGAR_MUDAH_LAYU', 7, 18000, 50.00, 10.00, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(5, 'BHN-WRAP-SAGE', 'Kertas Wrapping Cellophane Sage Green', 'KERTAS_PEMBUNGKUS', 'LEMBAR', 'BAHAN_PENDUKUNG_MATI', NULL, 3500, 500.00, 50.00, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(6, 'BHN-PITA-SATIN-CREAM', 'Pita Satin Lebar 2.5cm Krem', 'PITA_DAN_TALI', 'METER', 'BAHAN_PENDUKUNG_MATI', NULL, 2000, 300.00, 30.00, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52');

-- --------------------------------------------------------

--
-- Table structure for table `batas_laju_permintaan`
--

CREATE TABLE `batas_laju_permintaan` (
  `kunci_batas_laju` char(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Hash SHA-256 dari kombinasi kode endpoint RL-xx dan subjek (IP, email, akun, atau sesi)',
  `awal_jendela_waktu` int UNSIGNED NOT NULL COMMENT 'Detik epoch awal jendela waktu tetap (fixed window)',
  `kode_aturan_rl` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RL_GLOBAL' COMMENT 'Kode aturan rate limit (RL-01 s.d. RL-15)',
  `jumlah_permintaan` int UNSIGNED NOT NULL DEFAULT '1' COMMENT 'Jumlah hit permintaan dalam jendela waktu berjalan',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan hit terakhir (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan penghitung rate limiting terpusat berbasis MySQL untuk menangkal brute force, spam, dan scraping';

-- --------------------------------------------------------

--
-- Table structure for table `batch_persediaan`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `catatan_pesanan`
--

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

--
-- Triggers `catatan_pesanan`
--
DELIMITER $$
CREATE TRIGGER `trg_catatan_pesanan_cegah_hapus` BEFORE DELETE ON `catatan_pesanan` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_CATATAN_PESANAN: Catatan pesanan tidak boleh dihapus.';
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_catatan_pesanan_cegah_ubah` BEFORE UPDATE ON `catatan_pesanan` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_CATATAN_PESANAN: Catatan pesanan dan bukti kesepakatan pelanggan bersifat append-only.';
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `daftar_keinginan`
--

CREATE TABLE `daftar_keinginan` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal daftar keinginan pelanggan',
  `akun_pengguna_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi akun pelanggan pemilik daftar keinginan',
  `nama_daftar` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Favorit Saya' COMMENT 'Nama koleksi daftar keinginan',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan koleksi daftar keinginan (wishlist) milik pelanggan';

-- --------------------------------------------------------

--
-- Table structure for table `detail_resep_buket`
--

CREATE TABLE `detail_resep_buket` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal detail resep buket',
  `resep_buket_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi resep buket induk',
  `bahan_produksi_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi bahan produksi yang digunakan',
  `kuantitas_bahan` decimal(10,2) NOT NULL COMMENT 'Kuantitas bahan yang dibutuhkan untuk 1 unit buket sesuai resep',
  `catatan_pemakaian` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Catatan posisi atau teknik rangkai komponen bahan',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan rincian kuantitas bahan produksi untuk setiap resep dasar buket';

-- --------------------------------------------------------

--
-- Table structure for table `foto_komplain`
--

CREATE TABLE `foto_komplain` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal foto bukti komplain',
  `komplain_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi komplain induk pemilik foto bukti',
  `kunci_penyimpanan_berkas` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kunci objek berkas gambar di storage luar docroot (Lampiran A.4)',
  `urutan_foto` tinyint UNSIGNED NOT NULL DEFAULT '1' COMMENT 'Nomor urut lampiran foto komplain (1 sampai 5 sesuai P-27 & P-42)',
  `keterangan_foto` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Keterangan bagian kerusakan atau kondisi produk pada foto',
  `ukuran_byte` int UNSIGNED DEFAULT NULL COMMENT 'Ukuran berkas foto dalam byte (maksimum 5 MB sesuai P-42)',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pengunggahan foto bukti (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan referensi berkas foto bukti komplain pelanggan (2-5 foto sesuai P-27)';

-- --------------------------------------------------------

--
-- Table structure for table `foto_pengiriman`
--

CREATE TABLE `foto_pengiriman` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal foto bukti pengiriman',
  `pengiriman_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi pengiriman induk pemilik foto',
  `jenis_foto_pengiriman` enum('BUKTI_SERAH_KE_KURIR','BUKTI_TERKIRIM_PENERIMA','BUKTI_KONDISI_PAKET_KEMBALI') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BUKTI_SERAH_KE_KURIR' COMMENT 'Kategori fungsi foto bukti pengiriman',
  `kunci_penyimpanan_berkas` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kunci objek berkas gambar di storage luar docroot (bukan path publik, Lampiran A.4)',
  `keterangan_foto` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Catatan singkat mengenai foto bukti pengiriman',
  `diunggah_oleh_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun Admin pengunggah foto',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pengunggahan foto (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan referensi berkas foto serah kurir (wajib untuk Mudah Layu) dan foto bukti terkirim';

-- --------------------------------------------------------

--
-- Table structure for table `gambar_produk`
--

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

--
-- Dumping data for table `gambar_produk`
--

INSERT INTO `gambar_produk` (`id`, `produk_id`, `varian_produk_id`, `kunci_penyimpanan_berkas`, `teks_alternatif_seo`, `urutan_tampil`, `status_gambar_utama`, `lebar_piksel`, `tinggi_piksel`, `ukuran_byte`, `dibuat_pada`) VALUES
(1, 101, NULL, 'produk/monstera-deliciosa-tampak-depan-utama.jpg', 'Monstera Deliciosa tampak depan dengan daun hijau segar', 1, 1, 1200, 1200, 245000, '2026-10-21 04:44:21'),
(2, 101, NULL, 'produk/monstera-deliciosa-detail-batang-samping.jpg', 'Monstera Deliciosa tampak samping dekat jendela ruangan', 2, 0, 1200, 1200, 210000, '2026-10-21 04:44:21'),
(3, 101, NULL, 'produk/monstera-deliciosa-inspirasi-ruang-tamu.jpg', 'Monstera Deliciosa ditempatkan pada penyangga kayu di ruang tamu', 3, 0, 1200, 1200, 230000, '2026-10-21 04:44:21'),
(4, 102, NULL, 'produk/pot-keramik-nordic-white-utama.jpg', 'Pot Keramik Nordic White Minimalis dengan tatakan drainase', 1, 1, 1200, 1200, 195000, '2026-10-22 05:35:10'),
(5, 103, NULL, 'produk/media-tanam-aroid-porous-mix-utama.jpg', 'Kemasan Media Tanam Aroid & Monstera Porous Mix RylVa Kebun', 1, 1, 1200, 1200, 220000, '2026-10-22 05:35:10'),
(6, 104, NULL, 'produk/buket-mawar-putih-eucalyptus-sage-utama.jpg', 'Buket Bunga Mawar Putih Avalanche dan Daun Eucalyptus Wrapping Sage', 1, 1, 1200, 1200, 260000, '2026-10-22 05:35:10');

-- --------------------------------------------------------

--
-- Table structure for table `identitas_eksternal`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `item_daftar_keinginan`
--

CREATE TABLE `item_daftar_keinginan` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal item daftar keinginan',
  `daftar_keinginan_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi daftar keinginan induk',
  `produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi produk yang disimpan',
  `varian_produk_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi varian produk bila pelanggan menyimpan varian spesifik',
  `catatan_keinginan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Catatan pribadi pelanggan mengenai produk tersebut',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu produk ditambahkan ke daftar keinginan (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan daftar produk dan varian di dalam daftar keinginan (wishlist) pelanggan';

-- --------------------------------------------------------

--
-- Table structure for table `item_keranjang_belanja`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `item_pesanan`
--

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

-- --------------------------------------------------------

--
-- Stand-in structure for view `kategori`
-- (See below for the actual view)
--
CREATE TABLE `kategori` (
`id` bigint unsigned
,`kategori_induk_id` bigint unsigned
,`kode_kategori` varchar(50)
,`nama_kategori` varchar(100)
,`slug_kategori` varchar(120)
,`kelompok_domain` enum('FLORIST_DAN_BUKET','POT_DAN_VAS','MEDIA_TANAM','TANAH_DAN_KOMPOS','PUPUK_DAN_PERAWATAN','ALAT_BERKEBUN','BENIH_DAN_BIJI','TANAMAN_HIAS','PERLENGKAPAN_DEKORASI','PAKET_BERKEBUN')
,`deskripsi_kategori` text
,`url_gambar_banner` varchar(255)
,`urutan_tampil` int unsigned
,`status_aktif` enum('AKTIF','NONAKTIF')
,`dibuat_pada` datetime
,`diperbarui_pada` datetime
);

-- --------------------------------------------------------

--
-- Table structure for table `kategori_pilihan_buket`
--

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

--
-- Dumping data for table `kategori_pilihan_buket`
--

INSERT INTO `kategori_pilihan_buket` (`id`, `kode_kategori_pilihan`, `nama_kategori_pilihan`, `deskripsi_panduan_pilih`, `jenis_pemilihan`, `wajib_dipilih_default`, `batas_minimum_pilihan_default`, `batas_maksimum_pilihan_default`, `urutan_tampil`, `status_aktif`, `dibuat_pada`, `diperbarui_pada`) VALUES
(1, 'PILIHAN_BUNGA_UTAMA', 'Pilihan Bunga Utama', 'Pilih jenis dan warna bunga utama untuk buket Anda', 'PILIH_BANYAK', 1, 1, 3, 1, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(2, 'PILIHAN_BUNGA_FILLER', 'Bunga Pendamping & Daun Hias', 'Pilih filler pemanis rangkaian buket', 'PILIH_BANYAK', 0, 0, 2, 2, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(3, 'PILIHAN_KERTAS_WRAP', 'Kertas Pembungkus (Wrapping)', 'Pilih warna kertas cellophane pembungkus buket', 'PILIH_SATU', 1, 1, 1, 3, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(4, 'PILIHAN_PITA', 'Pita Pengikat', 'Pilih jenis dan warna pita buket', 'PILIH_SATU', 1, 1, 1, 4, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52');

-- --------------------------------------------------------

--
-- Table structure for table `kategori_pilihan_produk`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `kategori_produk`
--

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

--
-- Dumping data for table `kategori_produk`
--

INSERT INTO `kategori_produk` (`id`, `kategori_induk_id`, `kode_kategori`, `nama_kategori`, `slug_kategori`, `kelompok_domain`, `deskripsi_kategori`, `url_gambar_banner`, `urutan_tampil`, `status_aktif`, `dibuat_pada`, `diperbarui_pada`) VALUES
(1, NULL, 'KAT-FLORIST-BUKET', 'Florist & Buket Bunga', 'florist-dan-buket-bunga', 'FLORIST_DAN_BUKET', 'Buket siap jual, buket kustom, rangkaian bunga meja, bunga potong segar, dan bunga kering.', NULL, 1, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(2, NULL, 'KAT-TANAMAN-HIAS', 'Tanaman Hias Indoor & Outdoor', 'tanaman-hias', 'TANAMAN_HIAS', 'Koleksi tanaman hias daun, sukulen, kaktus, dan tanaman berbunga.', NULL, 2, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(3, NULL, 'KAT-POT-DAN-VAS', 'Pot Tanaman & Vas Bunga', 'pot-dan-vas', 'POT_DAN_VAS', 'Pot keramik, terakota, plastik premium, pot gantung, dan vas kaca estetis.', NULL, 3, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(4, NULL, 'KAT-MEDIA-TANAM', 'Media Tanam', 'media-tanam', 'MEDIA_TANAM', 'Media tanam siap pakai, cocopeat, sekam bakar, perlit, pumice, dan campuran aroid.', NULL, 4, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(5, NULL, 'KAT-TANAH-KOMPOS', 'Tanah Subur & Kompos', 'tanah-dan-kompos', 'TANAH_DAN_KOMPOS', 'Tanah taman organik, kompos daun bambu, humus, dan pupuk kandang matang.', NULL, 5, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(6, NULL, 'KAT-PUPUK-PERAWATAN', 'Pupuk & Nutrisi Tanaman', 'pupuk-dan-perawatan', 'PUPUK_DAN_PERAWATAN', 'Pupuk organik, pupuk NPK, vitamin B1 tanaman, pengkilap daun, dan pengendali hama ramah lingkungan.', NULL, 6, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(7, NULL, 'KAT-ALAT-BERKEBUN', 'Alat Berkebun', 'alat-berkebun', 'ALAT_BERKEBUN', 'Sekop taman, gunting pangkas dahan, sprayer tekanan, sarung tangan kebun, dan gembor penyiram.', NULL, 7, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(8, NULL, 'KAT-BENIH-BIJI', 'Benih & Biji Tanaman', 'benih-dan-biji', 'BENIH_DAN_BIJI', 'Benih sayuran hidroponik/organik, biji bunga matahari, marigold, dan tanaman herbal.', NULL, 8, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(9, NULL, 'KAT-PERLENGKAPAN-DEKOR', 'Perlengkapan & Dekorasi Taman', 'perlengkapan-dan-dekorasi', 'PERLENGKAPAN_DEKORASI', 'Label nama tanaman, turus lumut, kawat bonsai, batu koral hias, dan dekorasi pot.', NULL, 9, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(10, NULL, 'KAT-PAKET-BERKEBUN', 'Paket Berkebun & Starter Kit', 'paket-berkebun', 'PAKET_BERKEBUN', 'Paket lengkap berkebun pemula (pot + media tanam + benih) dan paket kado berkebun.', NULL, 10, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52');

-- --------------------------------------------------------

--
-- Table structure for table `kebutuhan_bahan_buket_pesanan`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `kebutuhan_bahan_opsi_buket`
--

CREATE TABLE `kebutuhan_bahan_opsi_buket` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal pemetaan kebutuhan bahan opsi buket',
  `opsi_pilihan_buket_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi opsi pilihan buket (sesuai Bagian 26.4)',
  `bahan_produksi_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi bahan produksi yang dibutuhkan oleh opsi ini (sesuai Bagian 26.4)',
  `kuantitas_bahan_per_opsi` decimal(10,2) NOT NULL DEFAULT '1.00' COMMENT 'Jumlah bahan produksi yang terpakai setiap 1 unit opsi dipilih',
  `persentase_cadangan_susut` decimal(5,2) NOT NULL DEFAULT '0.00' COMMENT 'Persentase toleransi susut bahan bila diperlukan',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Memetakan setiap opsi pilihan buket ke jenis dan kuantitas bahan produksi yang diperlukan';

--
-- Dumping data for table `kebutuhan_bahan_opsi_buket`
--

INSERT INTO `kebutuhan_bahan_opsi_buket` (`id`, `opsi_pilihan_buket_id`, `bahan_produksi_id`, `kuantitas_bahan_per_opsi`, `persentase_cadangan_susut`, `dibuat_pada`, `diperbarui_pada`) VALUES
(1, 1, 1, 5.00, 0.00, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(2, 2, 2, 5.00, 0.00, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(3, 3, 3, 1.00, 0.00, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(4, 4, 4, 1.00, 0.00, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(5, 5, 5, 3.00, 0.00, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(6, 6, 6, 1.50, 0.00, '2026-10-19 16:20:52', '2026-10-19 16:20:52');

-- --------------------------------------------------------

--
-- Table structure for table `keranjang`
--

CREATE TABLE `keranjang` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal keranjang belanja',
  `akun_pengguna_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun pelanggan pemilik keranjang (nullable untuk sinkronisasi keranjang tamu sebelum digabung, Bagian 26.5)',
  `token_keranjang_tamu` char(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Hash pengenal sesi keranjang tamu sebelum digabung ke akun saat login',
  `status_keranjang` enum('AKTIF','DIGABUNGKAN','DIKONVERSI_PESANAN','KEDALUWARSA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AKTIF' COMMENT 'Status siklus hidup keranjang belanja',
  `waktu_aktivitas_terakhir` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu perubahan isi keranjang terakhir untuk pembersihan otomatis P-25',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan header keranjang belanja pelanggan (harga tidak disimpan permanen dan stok tidak dicadangkan di keranjang)';

-- --------------------------------------------------------

--
-- Table structure for table `kode_verifikasi`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `komplain`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `komponen_paket_berkebun`
--

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

--
-- Triggers `komponen_paket_berkebun`
--
DELIMITER $$
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
DELIMITER ;
DELIMITER $$
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
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `konfigurasi_buket_keranjang`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `konfigurasi_buket_pesanan`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `kunci_pekerjaan_terjadwal`
--

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

--
-- Dumping data for table `kunci_pekerjaan_terjadwal`
--

INSERT INTO `kunci_pekerjaan_terjadwal` (`nama_pekerjaan`, `jadwal_cron_ekspresi`, `status_eksekusi_terakhir`, `dikunci_oleh_instance`, `waktu_mulai_kunci`, `waktu_kedaluwarsa_kunci`, `waktu_berhasil_terakhir`, `waktu_gagal_terakhir`, `ringkasan_hasil_terakhir`, `diperbarui_pada`) VALUES
('anonymize-inactive-accounts', '45 19 * * * (Harian)', 'IDLE', NULL, NULL, NULL, NULL, NULL, 'Menganonimkan akun pelanggan tidak aktif 24 bulan setelah pemberitahuan N-20 (P-36)', '2026-10-19 16:20:52'),
('audit-chain-verify', '30 20 * * * (Harian)', 'IDLE', NULL, NULL, NULL, NULL, NULL, 'Memverifikasi keutuhan rantai hash SHA-256 pada tabel log_audit (13.3)', '2026-10-19 16:20:52'),
('auto-complete-orders', '*/15 * * * * (Tiap 15 menit)', 'IDLE', NULL, NULL, NULL, NULL, NULL, 'Menyelesaikan otomatis pesanan TERKIRIM setelah jendela komplain P-11 berakhir tanpa komplain (T-13)', '2026-10-19 16:20:52'),
('cart-retention', '15 19 * * * (Harian)', 'IDLE', NULL, NULL, NULL, NULL, NULL, 'Menghapus keranjang akun yang tidak aktif lebih dari 30 hari (P-25)', '2026-10-19 16:20:52'),
('cleanup-unverified-accounts', '0 * * * * (Tiap jam)', 'IDLE', NULL, NULL, NULL, NULL, NULL, 'Menghapus akun BELUM_TERVERIFIKASI yang berusia lebih dari 24 jam (6.3.1)', '2026-10-19 16:20:52'),
('daily-reconciliation', '0 19 * * * (02:00 WIB / 19:00 UTC)', 'IDLE', NULL, NULL, NULL, NULL, NULL, 'Membandingkan seluruh transaksi gateway hari sebelumnya dengan database (7.9)', '2026-10-19 16:20:52'),
('delete-refund-bank-info', '30 19 * * * (Harian)', 'IDLE', NULL, NULL, NULL, NULL, NULL, 'Menghapus info_rekening_terenkripsi 30 hari setelah refund berhasil (P-21)', '2026-10-19 16:20:52'),
('expire-orders', '* * * * * (Tiap menit)', 'IDLE', NULL, NULL, NULL, NULL, NULL, 'Menutup pesanan MENUNGGU_PEMBAYARAN kedaluwarsa setelah verifikasi API gateway (T-04)', '2026-10-19 16:20:52'),
('expire-stock-reservations', '* * * * * (Tiap menit)', 'IDLE', NULL, NULL, NULL, NULL, NULL, 'Melepas reservasi stok ACTIVE yang melewati waktu_kedaluwarsa setelah cek status gateway (11.A.2)', '2026-10-19 16:20:52'),
('log-retention', '40 20 * * * (Harian)', 'IDLE', NULL, NULL, NULL, NULL, NULL, 'Merotasi dan menghapus log aplikasi (90 hari) serta log keamanan (12 bulan) sesuai P-43', '2026-10-19 16:20:52'),
('notification-retry', '* * * * * (Tiap menit)', 'IDLE', NULL, NULL, NULL, NULL, NULL, 'Mengirim dan mencoba ulang antrean pesan keluar (outbox) yang tertunda', '2026-10-19 16:20:52'),
('payment-reminder', '* * * * * (Tiap menit)', 'IDLE', NULL, NULL, NULL, NULL, NULL, 'Mengirim pengingat N-04 untuk pesanan yang tersisa 15 menit sebelum batas bayar', '2026-10-19 16:20:52'),
('ph-timeout', '*/5 * * * * (Tiap 5 menit)', 'IDLE', NULL, NULL, NULL, NULL, NULL, 'Memproses refund penuh otomatis dan T-17 untuk pesanan PERLU_PENANGANAN yang melewati P-16', '2026-10-19 16:20:52'),
('poll-courier-status', '*/15 * * * * (Tiap 15 menit)', 'IDLE', NULL, NULL, NULL, NULL, NULL, 'Cadangan pengecekan status pengiriman DALAM_PENGIRIMAN ke API kurir (9.4)', '2026-10-19 16:20:52'),
('poll-pending-payments', '*/5 * * * * (Tiap 5 menit)', 'IDLE', NULL, NULL, NULL, NULL, NULL, 'Memeriksa status pembayaran aktif ke API gateway bila webhook belum diterima (EX-18)', '2026-10-19 16:20:52'),
('purge-rate-limits', '10 * * * * (Tiap jam)', 'IDLE', NULL, NULL, NULL, NULL, NULL, 'Menghapus penghitung batas_laju_permintaan yang jendela waktunya telah berakhir (15.3)', '2026-10-19 16:20:52'),
('refund-retry', '*/15 * * * * (Backoff 24 jam)', 'IDLE', NULL, NULL, NULL, NULL, NULL, 'Mencoba ulang eksekusi refund GAGAL maksimum 3 kali (P-20) sebelum masuk antrean manual', '2026-10-19 16:20:52'),
('restore-test-reminder', '0 0 1 */3 * (Per 3 bulan)', 'IDLE', NULL, NULL, NULL, NULL, NULL, 'Mengirim pengingat pengujian pemulihan backup database terenkripsi (13.7)', '2026-10-19 16:20:52'),
('security-monitor', '*/5 * * * * (Tiap 5 menit)', 'IDLE', NULL, NULL, NULL, NULL, NULL, 'Mengevaluasi ambang log_peristiwa_keamanan dan mengirim peringatan N-18 ke SuperAdmin (15.10)', '2026-10-19 16:20:52'),
('stock-consistency-check', '0 20 * * * (Harian)', 'IDLE', NULL, NULL, NULL, NULL, NULL, 'Membandingkan saldo stok produk/varian dengan SUM buku besar stok; selisih memicu N-18', '2026-10-19 16:20:52'),
('stock-reservation-reconciliation', '15 20 * * * (Harian)', 'IDLE', NULL, NULL, NULL, NULL, NULL, 'Mencocokkan reservasi stok, pesanan, buku besar, dan transaksi gateway (11.A.4)', '2026-10-19 16:20:52');

-- --------------------------------------------------------

--
-- Table structure for table `log_audit`
--

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

--
-- Dumping data for table `log_audit`
--

INSERT INTO `log_audit` (`id`, `waktu_kejadian`, `jenis_pelaku`, `pelaku_akun_id`, `peran_pelaku`, `kode_tindakan`, `jenis_objek`, `id_objek`, `nilai_sebelum_json`, `nilai_sesudah_json`, `alasan_tindakan`, `hasil_tindakan`, `alamat_ip_pelaku`, `id_permintaan`, `hash_sebelumnya`, `hash_entri`) VALUES
(1, '2026-10-19 16:20:52', 'SISTEM', 1, 'SUPERADMIN', 'INISIALISASI_SKEMA_DATABASE_V2_6', 'pengaturan_sistem', 'BASELINE_P01_P46', NULL, '{\"jumlah_parameter\": 46, \"versi_spesifikasi\": \"2.6 Final\"}', 'Inisialisasi skema basis data lengkap RylVa Green v2.6 (Florist, Kustomisasi Buket, dan Gardening Goods)', 'BERHASIL', '127.0.0.1', NULL, '0000000000000000000000000000000000000000000000000000000000000000', '6908cc0cb6561c11fd385c5444f6f7b8427a0f655ae028a69c9fd3d2f2c4592f'),
(2, '2026-10-22 05:35:10', 'SISTEM', 1, 'SUPERADMIN', 'MIGRASI_ADR_001_REKOMENDASI_PRODUK', 'relasi_rekomendasi_produk', 'TABEL_68', NULL, '{\"adr_id\": \"ADR-001-CROSS-SELL-RECOMMENDATION\", \"view_baru\": \"vw_rekomendasi_produk_aktif\", \"tabel_baru\": \"relasi_rekomendasi_produk\"}', 'Penambahan tabel relasi_rekomendasi_produk dan view vw_rekomendasi_produk_aktif sesuai persetujuan Change Control Bagian 25.3', 'BERHASIL', '127.0.0.1', NULL, '6908cc0cb6561c11fd385c5444f6f7b8427a0f655ae028a69c9fd3d2f2c4592f', '2df80d096b9c1d73709c06becf79fce73c47f51a05d9f8bf537787bc99b32f86');

--
-- Triggers `log_audit`
--
DELIMITER $$
CREATE TRIGGER `trg_log_audit_cegah_hapus` BEFORE DELETE ON `log_audit` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_KEAMANAN_BR12: Entri log_audit bersifat append-only dan tidak boleh dihapus oleh siapa pun.';
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_log_audit_cegah_ubah` BEFORE UPDATE ON `log_audit` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_KEAMANAN_BR12: Entri log_audit bersifat append-only dan tidak boleh diubah oleh siapa pun.';
END
$$
DELIMITER ;
DELIMITER $$
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
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `log_peristiwa_keamanan`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `lokasi_stok`
--

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

--
-- Dumping data for table `lokasi_stok`
--

INSERT INTO `lokasi_stok` (`id`, `kode_lokasi`, `nama_lokasi`, `jenis_lokasi`, `alamat_lokasi`, `status_lokasi_default_jual`, `status_aktif`, `dibuat_pada`, `diperbarui_pada`) VALUES
(1, 'TOKO-UTAMA', 'Toko Utama & Galeri RylVa Green', 'TOKO_UTAMA', 'Jl. Raya Kebun Bunga No. 10, Bandung', 1, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(2, 'STUDIO-FLORIST', 'Studio Perangkaian Buket & Pendingin Bunga', 'STUDIO_FLORIST', 'Jl. Raya Kebun Bunga No. 10 (Lantai 1), Bandung', 0, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(3, 'GUDANG-KEBUN', 'Gudang Media Tanam, Pot & Alat Berkebun', 'GUDANG_PENYIMPANAN', 'Jl. Raya Kebun Bunga No. 12, Bandung', 0, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(4, 'NURSERY-01', 'Rumah Kaca (Greenhouse) Tanaman Hias & Benih', 'RUMAH_KACA_NURSERY', 'Jl. Lembang Asri No. 45, Bandung Barat', 0, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52');

-- --------------------------------------------------------

--
-- Stand-in structure for view `mutasi_stok_bahan`
-- (See below for the actual view)
--
CREATE TABLE `mutasi_stok_bahan` (
`id` bigint unsigned
,`bahan_produksi_id` bigint unsigned
,`lokasi_stok_id` bigint unsigned
,`jenis_mutasi_bahan` enum('PENERIMAAN_BAHAN','ALOKASI_PRODUKSI_BUKET','PEMAKAIAN_PRODUKSI_BUKET','PEMBATALAN_ALOKASI_BUKET','BAHAN_LAYU_RUSAK_BUANG','PENYESUAIAN_OPNAME_BAHAN','KONVERSI_DARI_BARANG_DAGANGAN')
,`perubahan_kuantitas` decimal(12,2)
,`saldo_setelah_mutasi` decimal(12,2)
,`jenis_referensi` varchar(50)
,`referensi_id` bigint unsigned
,`kunci_idempotensi` varchar(100)
,`pelaku_akun_id` bigint unsigned
,`alasan_mutasi` varchar(500)
,`dibuat_pada` datetime
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `mutasi_stok_produk`
-- (See below for the actual view)
--
CREATE TABLE `mutasi_stok_produk` (
`id` bigint unsigned
,`produk_id` bigint unsigned
,`varian_produk_id` bigint unsigned
,`lokasi_stok_id` bigint unsigned
,`batch_persediaan_id` bigint unsigned
,`jenis_mutasi_stok` enum('PENJUALAN','KOMIT_COD','PEMBATALAN_RESTOK','RETUR_LAYAK','BARANG_MASUK','PENYESUAIAN','BARANG_RUSAK_BUANG','TRANSFER_KELUAR','TRANSFER_MASUK','KONVERSI_KE_BAHAN_PRODUKSI')
,`perubahan_kuantitas` int
,`saldo_setelah_mutasi` int
,`jenis_referensi` varchar(50)
,`referensi_id` bigint unsigned
,`kunci_idempotensi` varchar(100)
,`pelaku_akun_id` bigint unsigned
,`disetujui_oleh_akun_id` bigint unsigned
,`alasan_mutasi` varchar(500)
,`dibuat_pada` datetime
);

-- --------------------------------------------------------

--
-- Table structure for table `nilai_atribut_produk`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `nilai_atribut_varian`
--

CREATE TABLE `nilai_atribut_varian` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal nilai atribut varian',
  `varian_produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi varian produk',
  `atribut_produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi atribut pembeda varian (mis. Ukuran, Warna, Volume)',
  `pilihan_atribut_produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi nilai pilihan atribut untuk varian ini',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan kombinasi atribut yang membedakan satu varian produk dari varian lainnya';

-- --------------------------------------------------------

--
-- Table structure for table `notifikasi`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `opsi_pilihan_buket`
--

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

--
-- Dumping data for table `opsi_pilihan_buket`
--

INSERT INTO `opsi_pilihan_buket` (`id`, `kategori_pilihan_buket_id`, `kode_opsi`, `nama_opsi`, `deskripsi_opsi`, `tambahan_harga_rupiah`, `batas_maksimum_kuantitas_per_buket`, `kunci_gambar_pratinjau`, `urutan_tampil`, `status_aktif`, `dibuat_pada`, `diperbarui_pada`) VALUES
(1, 1, 'OPSI-MAWAR-MERAH-5', 'Paket 5 Tangkai Mawar Merah', '5 tangkai mawar merah segar grade A', 60000, 6, NULL, 1, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(2, 1, 'OPSI-MAWAR-PUTIH-5', 'Paket 5 Tangkai Mawar Putih', '5 tangkai mawar putih segar grade A', 65000, 6, NULL, 2, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(3, 2, 'OPSI-FILLER-BABYBREATH', 'Tambahan Baby Breath Putih', '1 ikat cabang baby breath segar', 25000, 3, NULL, 1, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(4, 2, 'OPSI-DAUN-EUCALYPTUS', 'Tambahan Daun Eucalyptus Harum', '1 ikat daun eucalyptus segar', 30000, 2, NULL, 2, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(5, 3, 'OPSI-WRAP-SAGE-BOTANICAL', 'Wrapping Cellophane Sage Green (3 Lembar)', 'Kertas pembungkus tahan air warna hijau sage', 15000, 2, NULL, 1, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(6, 4, 'OPSI-PITA-SATIN-CREAM', 'Pita Satin Krem Elegan', 'Pita satin panjang 1.5 meter', 5000, 1, NULL, 1, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52');

-- --------------------------------------------------------

--
-- Table structure for table `pengaturan_sistem`
--

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

--
-- Dumping data for table `pengaturan_sistem`
--

INSERT INTO `pengaturan_sistem` (`kunci_parameter`, `kode_register_parameter`, `nama_parameter`, `nilai_parameter_json`, `deskripsi_aturan`, `dapat_diubah_saat_runtime`, `diperbarui_oleh_superadmin_id`, `alasan_perubahan_terakhir`, `dibuat_pada`, `diperbarui_pada`) VALUES
('account.max_saved_addresses', 'P-26', 'Alamat tersimpan per akun', '{\"maks_alamat\": 5}', 'Maksimum 5 alamat aktif per akun pelanggan', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('auth.admin_activation_link_hours', 'P-33', 'Masa berlaku tautan aktivasi akun Admin', '{\"berlaku_jam\": 24, \"sekali_pakai\": true}', 'Berlaku 24 jam dan sekali pakai', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('auth.login_lockout_policy', 'P-31', 'Pembatasan login gagal', '{\"maks_gagal\": 5, \"tunda_menit\": 15, \"jendela_menit\": 15, \"captcha_mulai_gagal_ke\": 3}', '5 kegagalan dalam 15 menit menunda 15 menit', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('auth.max_concurrent_sessions', 'P-44', 'Batas sesi aktif bersamaan', '{\"admin\": 2, \"pelanggan\": 5, \"superadmin\": 2}', 'Pelanggan 5 sesi; Admin dan SuperAdmin 2 sesi', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('auth.password_min_length', 'P-28', 'Panjang minimum kata sandi', '{\"staf_min\": 12, \"maks_karakter\": 128, \"pelanggan_min\": 8}', 'Pelanggan 8 karakter; Admin & SuperAdmin 12 karakter', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('auth.password_reset_token_minutes', 'P-30', 'Masa berlaku token pemulihan kata sandi', '{\"sekali_pakai\": true, \"berlaku_menit\": 15}', 'Berlaku 15 menit dan sekali pakai', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('auth.session_lifetime', 'P-32', 'Masa berlaku sesi pengguna dan staf', '{\"admin_idle_menit\": 30, \"admin_absolut_jam\": 8, \"pelanggan_idle_hari\": 14, \"superadmin_idle_menit\": 15, \"superadmin_absolut_jam\": 4}', 'Durasi idle dan absolut sesi per peran', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('auth.verification_code_policy', 'P-29', 'Kebijakan kode verifikasi email', '{\"digit\": 6, \"maks_salah\": 5, \"berlaku_menit\": 10, \"maks_kirim_per_jam\": 5, \"jeda_kirim_ulang_detik\": 60}', '6 digit, berlaku 10 menit, maks 5 salah, jeda 60 detik, maks 5/jam', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('cart.max_qty_limits', 'P-05', 'Batas kuantitas pembelian', '{\"maks_unit_per_produk\": 20, \"maks_unit_per_pesanan\": 50}', '20 unit per produk per pesanan; 50 unit total per pesanan', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('cart.retention_days', 'P-25', 'Retensi keranjang belanja', '{\"akun_hari\": 30, \"tamu_hari\": 7}', 'Keranjang tamu 7 hari di peramban; keranjang akun 30 hari tanpa aktivitas', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('catalog.price_change_confirm_pct', 'P-24', 'Ambang perubahan harga yang butuh konfirmasi tambahan', '{\"persentase\": 50}', 'Perubahan lebih dari 50% dari harga sebelumnya memicu konfirmasi & N-19', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('complaint.appeal_limit', 'P-17', 'Batas banding atas penolakan komplain', '{\"jendela_jam\": 24, \"maks_banding\": 1}', '1 kali banding dalam 24 jam sejak penolakan Admin', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('complaint.first_response_hours', 'P-12', 'Respons pertama atas komplain', '{\"maks_jam\": 24}', 'Maksimum 24 jam sejak komplain diajukan', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('complaint.window_hours', 'P-11', 'Jendela komplain pasca-penerimaan', '{\"jam\": 24}', '24 jam sejak status Terkirim', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('evidence.photo_count_limits', 'P-27', 'Jumlah foto bukti wajib', '{\"komplain_min\": 2, \"komplain_maks\": 5, \"serah_kurir_mudah_layu_min\": 1}', 'Komplain: 2-5 foto; Serah kurir produk Mudah Layu: minimal 1 foto', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('infra.scale_out_triggers', 'P-45', 'Pemicu pertimbangan scale-out multi-server', '{\"cpu_persen_15m\": 70, \"p95_respons_detik\": 1.0}', 'CPU > 70% selama 15 menit berulang atau p95 > 1 detik', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('nfr.availability_target_pct', 'P-37', 'Target ketersediaan bulanan', '{\"persentase\": 99.5}', '99,5% per bulan di luar pemeliharaan terjadwal', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('nfr.catalog_lcp_seconds', 'P-39', 'Target kinerja halaman katalog', '{\"detik_4g\": 2.5}', 'Konten utama tampil dalam 2,5 detik pada jaringan 4G', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('nfr.recovery_targets', 'P-38', 'Target pemulihan bencana (RPO/RTO)', '{\"rpo_jam\": 1, \"rto_jam\": 4}', 'RPO maksimum 1 jam; RTO maksimum 4 jam', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('order.card_message_max_length', 'P-10', 'Panjang pesan kartu ucapan', '{\"maks_karakter\": 200}', 'Maksimum 200 karakter teks biasa', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('order.max_pending_per_account', 'P-04', 'Maksimum pesanan Menunggu Pembayaran per akun', '{\"maks_pesanan\": 3}', 'Maksimum 3 pesanan aktif berstatus Menunggu Pembayaran per pelanggan', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('order.ph_customer_response_hours', 'P-16', 'Batas respons pelanggan atas opsi penyelesaian PH', '{\"jam\": 24, \"aksi_lewat_batas\": \"REFUND_PENUH_OTOMATIS\"}', '24 jam untuk PH-01, PH-02, PH-05, PH-06; lewat batas refund penuh otomatis', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('order.ph_initial_action_hours', 'P-15', 'Mulai penanganan status Perlu Penanganan', '{\"jam_operasional\": 2}', 'Maksimum 2 jam operasional sejak pesanan masuk status Perlu Penanganan', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('payment.expiry_grace_minutes', 'P-02', 'Toleransi sinkronisasi kedaluwarsa', '{\"menit\": 5}', '5 menit pengecekan ke payment gateway sebelum pesanan ditutup', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('payment.max_attempts_per_order', 'P-03', 'Maksimum percobaan pembayaran per pesanan', '{\"maks_percobaan\": 5}', 'Maksimum 5 percobaan pembayaran per pesanan', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('payment.window_minutes', 'P-01', 'Batas waktu pembayaran default', '{\"menit\": 60}', '60 menit sejak pesanan dibuat', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('refund.admin_approval_max_idr', 'P-18', 'Batas persetujuan refund oleh Admin', '{\"batas_rupiah\": 500000}', 'Rp500.000 per permintaan refund; di atasnya wajib disetujui SuperAdmin', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('refund.auto_retry_policy', 'P-20', 'Percobaan ulang otomatis refund gagal', '{\"jendela_jam\": 24, \"maks_percobaan\": 3}', '3 kali dalam 24 jam, lalu masuk antrean manual', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('refund.bank_info_retention_days', 'P-21', 'Penyimpanan data rekening/e-wallet refund', '{\"hari_setelah_berhasil\": 30}', 'Dihapus otomatis 30 hari setelah refund berhasil', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('refund.processing_target_workdays', 'P-19', 'Target pemrosesan refund', '{\"hari_kerja\": 3}', 'Maksimum 3 hari kerja sejak refund disetujui', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('retention.inactive_customer_months', 'P-36', 'Anonimisasi akun pelanggan tidak aktif', '{\"bulan_tanpa_aktivitas\": 24, \"pemberitahuan_hari_sebelum\": 30}', 'Dianonimkan setelah 24 bulan tanpa login/pesanan aktif, N-20 H-30', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('retention.non_transaction_audit_years', 'P-35', 'Retensi audit log non-transaksi', '{\"tahun\": 5}', '5 tahun untuk log akses, akun, dan konfigurasi', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('retention.security_and_app_logs', 'P-43', 'Retensi log aplikasi dan log keamanan', '{\"log_aplikasi_hari\": 90, \"log_keamanan_bulan\": 12}', 'Log aplikasi 90 hari; log keamanan 12 bulan', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('retention.transaction_audit_years', 'P-34', 'Retensi riwayat transaksi dan audit log terkait transaksi', '{\"tahun\": 10}', '10 tahun sebagai baseline retensi transaksi', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('security.patch_sla_days', 'P-46', 'SLA pembaruan keamanan dependensi dan sistem', '{\"kritis_hari\": 7, \"tinggi_hari\": 14}', 'Kerentanan kritis maks 7 hari, tinggi maks 14 hari', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('security.rate_limits_config', 'P-41', 'Batas laju (rate limit) per endpoint RL-01 s.d. RL-15', '{\"RL_01_ip_15m\": 20, \"RL_03_ip_jam\": 5, \"RL_04_ip_jam\": 10, \"RL_01_akun_15m\": 5, \"RL_02_akun_15m\": 5, \"RL_07_ip_menit\": 30, \"RL_09_akun_jam\": 10, \"RL_15_ip_menit\": 300, \"RL_05_email_jam\": 3, \"RL_08_sesi_menit\": 60}', 'Konfigurasi batas laju permintaan sesuai Bagian 15.3', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('security.upload_limits', 'P-42', 'Batas unggahan berkas dan ukuran request', '{\"maks_berkas_mb\": 5, \"maks_dimensi_px\": 4000, \"post_max_size_mb\": 8, \"maks_berkas_komplain\": 5}', 'Maks 5 MB/berkas, 4000x4000 px, post_max_size 8 MB', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('shipping.delivery_slots_wib', 'P-08', 'Slot pengiriman harian WIB', '{\"PAGI\": \"08:00-12:00\", \"SORE\": \"16:00-20:00\", \"SIANG\": \"12:00-16:00\"}', 'Rentang waktu pengiriman Pagi, Siang, dan Sore dalam WIB', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('shipping.lost_investigation_workdays', 'P-13', 'Batas investigasi barang hilang', '{\"hari_kerja\": 3}', 'Maksimum 3 hari kerja investigasi bersama kurir', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('shipping.max_advance_days', 'P-07', 'Batas pemesanan di muka', '{\"maks_hari\": 30}', '30 hari dari tanggal pemesanan', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('shipping.min_lead_time', 'P-06', 'Lead time minimum pengiriman', '{\"tahan_lama_hari_minimum\": 1, \"mudah_layu_jam_sebelum_slot\": 4}', 'Produk Mudah Layu: 4 jam sebelum jam mulai slot; Produk Tahan Lama: H+1', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('shipping.perishable_redelivery_max', 'P-14', 'Percobaan ulang kirim produk Mudah Layu', '{\"hari_yang_sama\": true, \"maks_percobaan_ulang\": 1}', 'Maksimum 1 kali percobaan ulang pada hari yang sama', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('stock.admin_adjustment_max_units', 'P-23', 'Batas penyesuaian stok manual tanpa persetujuan SuperAdmin', '{\"unit\": 20}', 'Maksimum 20 unit per penyesuaian oleh Admin', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('stock.low_threshold_units', 'P-22', 'Ambang stok rendah default', '{\"unit\": 5}', '5 unit per produk untuk peringatan stok terbatas', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('stock.reservation_window_by_method', 'P-40', 'Jendela reservasi stok per metode pembayaran', '{\"COD\": 0, \"QRIS\": 10, \"E_WALLET\": 10, \"TRANSFER_BANK\": 15, \"VIRTUAL_ACCOUNT\": 30, \"KARTU_KREDIT_DEBIT\": 15}', 'Menit reservasi per metode pembayaran online; COD langsung komit saat order dibuat', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
('store.operating_hours_wib', 'P-09', 'Jam operasional toko', '{\"buka\": \"08:00\", \"tutup\": \"20:00\", \"zona_waktu\": \"Asia/Jakarta\"}', '08:00-20:00 WIB setiap hari kecuali tanggal tutup', 1, 1, NULL, '2026-10-19 16:20:52', '2026-10-19 16:20:52');

-- --------------------------------------------------------

--
-- Table structure for table `pengembalian_dana`
--

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

--
-- Triggers `pengembalian_dana`
--
DELIMITER $$
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
DELIMITER ;
DELIMITER $$
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
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `pengiriman`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `percobaan_pembayaran_pesanan`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `peristiwa_pembayaran`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `peristiwa_pengiriman`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `permintaan_pembatalan`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `persetujuan_operasi_sensitif`
--

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

--
-- Triggers `persetujuan_operasi_sensitif`
--
DELIMITER $$
CREATE TRIGGER `trg_persetujuan_sensitif_dual_control` BEFORE UPDATE ON `persetujuan_operasi_sensitif` FOR EACH ROW BEGIN
  IF NEW.`penyetuju_kedua_akun_id` IS NOT NULL AND NEW.`penyetuju_kedua_akun_id` = NEW.`pengaju_akun_id` THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PELANGGARAN_DUAL_CONTROL_D18: Penyetuju kedua wajib orang yang berbeda dari pengaju operasi sensitif.';
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `pesanan`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `pilihan_atribut_produk`
--

CREATE TABLE `pilihan_atribut_produk` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal pilihan atribut',
  `atribut_produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi atribut induk pemilik opsi pilihan',
  `kode_pilihan` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode mesin pilihan atribut',
  `nilai_tampil_pilihan` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Label nilai yang ditampilkan kepada pengguna (mis. Diameter 15 cm, 5 Liter, Indoor Teduh)',
  `urutan_tampil` int UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Urutan tampilan opsi dalam atribut',
  `status_aktif` enum('AKTIF','NONAKTIF') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AKTIF' COMMENT 'Status aktif opsi atribut',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan daftar pilihan nilai terkontrol untuk atribut produk seperti ukuran, warna, bahan, dan tingkat cahaya';

--
-- Dumping data for table `pilihan_atribut_produk`
--

INSERT INTO `pilihan_atribut_produk` (`id`, `atribut_produk_id`, `kode_pilihan`, `nilai_tampil_pilihan`, `urutan_tampil`, `status_aktif`, `dibuat_pada`) VALUES
(1, 1, 'POT_15CM', 'Diameter 15 cm', 1, 'AKTIF', '2026-10-19 16:20:52'),
(2, 1, 'POT_20CM', 'Diameter 20 cm', 2, 'AKTIF', '2026-10-19 16:20:52'),
(3, 1, 'POT_25CM', 'Diameter 25 cm', 3, 'AKTIF', '2026-10-19 16:20:52'),
(4, 2, 'VOL_1L', 'Kemasan 1 Liter', 1, 'AKTIF', '2026-10-19 16:20:52'),
(5, 2, 'VOL_5L', 'Kemasan 5 Liter', 2, 'AKTIF', '2026-10-19 16:20:52'),
(6, 2, 'VOL_10L', 'Kemasan 10 Liter', 3, 'AKTIF', '2026-10-19 16:20:52'),
(7, 3, 'WARNA_PUTIH', 'Putih Minimalis', 1, 'AKTIF', '2026-10-19 16:20:52'),
(8, 3, 'WARNA_TERAKOTA', 'Terakota Natural', 2, 'AKTIF', '2026-10-19 16:20:52'),
(9, 3, 'WARNA_SAGE', 'Hijau Sage', 3, 'AKTIF', '2026-10-19 16:20:52'),
(10, 4, 'BAHAN_KERAMIK', 'Keramik Glasir', 1, 'AKTIF', '2026-10-19 16:20:52'),
(11, 4, 'BAHAN_TANAH_LIAT', 'Tanah Liat / Terakota', 2, 'AKTIF', '2026-10-19 16:20:52'),
(12, 4, 'BAHAN_PLASTIK_TEBAL', 'Plastik PP Tebal', 3, 'AKTIF', '2026-10-19 16:20:52'),
(13, 5, 'CAHAYA_TEDUH', 'Indoor / Cahaya Tidak Langsung', 1, 'AKTIF', '2026-10-19 16:20:52'),
(14, 5, 'CAHAYA_SEDANG', 'Semi-Outdoor / Teduh Terang', 2, 'AKTIF', '2026-10-19 16:20:52'),
(15, 5, 'CAHAYA_PENUH', 'Outdoor / Sinar Matahari Penuh', 3, 'AKTIF', '2026-10-19 16:20:52'),
(16, 6, 'AIR_JARANG', 'Hemat Air (1-2 kali seminggu)', 1, 'AKTIF', '2026-10-19 16:20:52'),
(17, 6, 'AIR_SEDANG', 'Lembap Merata (2-3 kali seminggu)', 2, 'AKTIF', '2026-10-19 16:20:52'),
(18, 6, 'AIR_RUTIN', 'Setiap Hari Pagi/Sore', 3, 'AKTIF', '2026-10-19 16:20:52');

-- --------------------------------------------------------

--
-- Table structure for table `pilihan_buket_keranjang`
--

CREATE TABLE `pilihan_buket_keranjang` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal pilihan opsi buket di keranjang',
  `konfigurasi_buket_keranjang_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi konfigurasi buket keranjang (sesuai Bagian 26.4)',
  `kategori_pilihan_buket_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi kategori pilihan buket (sesuai Bagian 26.4)',
  `opsi_pilihan_buket_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi opsi pilihan buket yang dipilih pelanggan (sesuai Bagian 26.4)',
  `kuantitas_opsi` int UNSIGNED NOT NULL DEFAULT '1' COMMENT 'Jumlah unit opsi yang dipilih di dalam satu buket',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan daftar rincian opsi kustomisasi buket yang dipilih pelanggan saat masih di keranjang';

-- --------------------------------------------------------

--
-- Table structure for table `pilihan_buket_pesanan`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `poin_informasi_produk`
--

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

--
-- Dumping data for table `poin_informasi_produk`
--

INSERT INTO `poin_informasi_produk` (`id`, `produk_id`, `kode_ikon`, `judul_poin`, `isi_penjelasan`, `terbuka_default`, `urutan_tampil`, `status_aktif`, `dibuat_pada`, `diperbarui_pada`) VALUES
(1, 101, 'PENYIRAMAN', 'Siram 1-2 Kali Seminggu', 'Selalu periksa kelembapan media tanam sebelum menyiram. Siram saat lapisan atas media tanam (2-3 cm) terasa kering ketika disentuh, dan pastikan air tidak menggenang di dasar pot.', 1, 1, 'AKTIF', '2026-10-21 04:44:21', '2026-10-21 04:44:21'),
(2, 101, 'CAHAYA_MATAHARI', 'Cahaya Terang Tidak Langsung', 'Tempatkan di dekat jendela yang mendapatkan cahaya matahari pagi atau cahaya terang yang tersaring tirai. Hindari paparan sinar matahari terik siang hari secara langsung agar daun tidak terbakar.', 0, 2, 'AKTIF', '2026-10-21 04:44:21', '2026-10-21 04:44:21'),
(3, 101, 'PERINGATAN_TOKSIK', 'Perhatian untuk Hewan Peliharaan', 'Daun dan batang Monstera mengandung kristal kalsium oksalat alami yang dapat menyebabkan iritasi mulut ringan bila tertelan kucing atau anjing. Letakkan di tempat yang aman dari jangkauan kunyahan hewan.', 0, 3, 'AKTIF', '2026-10-21 04:44:21', '2026-10-21 04:44:21'),
(4, 101, 'COCOK_PEMULA', 'Cocok untuk Pemula (Beginner Friendly)', 'Tahan terhadap berbagai kondisi ruangan indoor, mudah beradaptasi di suhu ruang Indonesia, serta sudah dilengkapi media tanam porous siap rawat.', 0, 4, 'AKTIF', '2026-10-21 04:44:21', '2026-10-21 04:44:21');

-- --------------------------------------------------------

--
-- Table structure for table `produk`
--

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

--
-- Dumping data for table `produk`
--

INSERT INTO `produk` (`id`, `sku`, `nama_produk`, `slug_produk`, `kategori_utama_id`, `jenis_produk`, `jenis_penanganan`, `kebijakan_stok_paket`, `merek`, `bahan_utama`, `satuan_jual`, `catatan_kelengkapan_jual`, `deskripsi_produk`, `panduan_perawatan_dan_penggunaan`, `peringatan_penanganan_produk`, `nama_spesies_tanaman`, `subjudul_singkat`, `ringkasan_singkat`, `memiliki_varian`, `wajib_pencatatan_batch`, `harga_dasar_rupiah`, `harga_diskon_rupiah`, `waktu_mulai_diskon`, `waktu_selesai_diskon`, `berat_gram`, `panjang_milimeter`, `lebar_milimeter`, `tinggi_milimeter`, `waktu_persiapan_tambahan_menit`, `jumlah_stok_jual`, `ambang_stok_rendah`, `jumlah_unit_terjual`, `status_produk`, `dibuat_oleh_akun_id`, `dibuat_pada`, `diperbarui_pada`, `periode_mulai_tayang`, `periode_akhir_tayang`, `label_promosi`) VALUES
(101, 'TNM-MONSTERA-DEL', 'Monstera Deliciosa', 'monstera-deliciosa', 2, 'TANAMAN_HIAS', 'TAHAN_LAMA', 'BUKAN_PAKET', 'RylVa Nursery', 'Tanaman Hias Daun Tropis', 'POT', 'Dikirim menggunakan pot nursery standar beserta media tanam aroid. Pot keramik putih pada foto dijual terpisah.', 'Monstera Deliciosa adalah tanaman hias daun tropis dari keluarga Araceae yang dikenal karena bentuk daunnya yang lebar dan berlubang artistik (fenestrasi). Sangat cocok ditempatkan di ruang tamu, ruang kerja, maupun sudut ruangan berkonsep botanical.', 'Siram 1-2 kali seminggu saat permukaan media tanam setebal 2-3 cm terasa kering. Tempatkan di area dengan cahaya matahari terang tidak langsung.', 'Getah daun mengandung kalsium oksalat ringan; jauhkan dari jangkauan kunyahan hewan peliharaan.', 'Monstera deliciosa Liebm.', 'Kondisi Lembap (Humid Condition)', 'Tanaman hias tropis ikonik dengan belahan daun alami yang memberikan kesan segar dan modern di dalam ruangan. Tumbuh subur pada area teduh terang dengan perawatan mingguan yang praktis.', 1, 0, 150000, 125000, NULL, NULL, 1500, 250, 250, 450, 0, 24, 5, 0, 'AKTIF', 3, '2026-10-21 04:44:21', '2026-10-21 04:44:21', NULL, NULL, NULL),
(102, 'POT-KRM-NORDIC', 'Pot Keramik Nordic White Minimalis', 'pot-keramik-nordic-white-minimalis', 3, 'PERLENGKAPAN_BERKEBUN', 'TAHAN_LAMA', 'BUKAN_PAKET', 'RylVa Living', 'Keramik Stoneware Glasir Doff', 'PCS', 'Sudah dilengkapi lubang drainase di bagian bawah dan tatakan keramik senada. Tanaman dijual terpisah.', 'Pot keramik stoneware berkualitas tinggi dengan hasil akhir putih doff minimalis. Dirancang khusus untuk menonjolkan warna hijau daun tanaman tropis seperti Monstera dan Philodendron.', 'Bersihkan permukaan luar pot dengan kain lembap lembut. Pastikan lubang drainase tidak tersumbat akar saat melakukan repotting.', 'Barang pecah belah; dikemas wajib menggunakan bubble wrap berlapis dan kardus tebal.', NULL, 'Keramik Glasir Doff • Dengan Lubang Drainase', 'Pot keramik estetis bergaya Skandinavia yang serasi untuk tanaman indoor ukuran Small hingga Large.', 1, 0, 95000, 85000, NULL, NULL, 1800, 220, 220, 220, 0, 30, 5, 14, 'AKTIF', 3, '2026-10-22 05:35:10', '2026-10-22 05:35:10', NULL, NULL, NULL),
(103, 'MED-AROID-MIX', 'Media Tanam Khusus Aroid & Monstera Porous Mix', 'media-tanam-aroid-monstera-porous-mix', 4, 'PERLENGKAPAN_BERKEBUN', 'TAHAN_LAMA', 'BUKAN_PAKET', 'RylVa Kebun', 'Pakis Cacah, Perlit, Pumice, Sekam Bakar, Kompos Organik', 'LITER', 'Siap pakai langsung tanpa perlu dicampur tanah tambahan.', 'Campuran media tanam premium berpori tinggi (chunky aroid mix) yang diformulasikan agar akar Monstera mendapat sirkulasi oksigen optimal dan bebas risiko busuk akar.', 'Tuangkan langsung ke dalam pot saat repotting. Ganti atau tambahkan media setiap 6-8 bulan sekali.', 'Simpan sisa media di tempat teduh dan kering.', NULL, 'Porositas Tinggi • Anti Busuk Akar', 'Media tanam siap pakai bertekstur porous yang menjaga kelembapan ideal sekaligus mengalirkan kelebihan air dengan cepat.', 1, 0, 45000, 39000, NULL, NULL, 1200, 250, 180, 100, 0, 40, 5, 28, 'AKTIF', 3, '2026-10-22 05:35:10', '2026-10-22 05:35:10', NULL, NULL, NULL),
(104, 'BKT-SAGE-ROSE', 'Buket Bunga Mawar Putih & Eucalyptus Sage', 'buket-bunga-mawar-putih-eucalyptus-sage', 1, 'PRODUK_STANDAR', 'MUDAH_LAYU', 'BUKAN_PAKET', 'RylVa Florist', 'Mawar Putih Avalanche Segar & Daun Eucalyptus', 'BUKET', 'Sudah termasuk gratis Kartu Ucapan Kustom (maks. 200 karakter) dan kantong pelindung buket.', 'Rangkaian buket bunga segar bertema Botanical Modern yang memadukan mawar putih pilihan, baby breath, dan daun eucalyptus beraroma menenangkan dalam balutan wrapping sage green.', 'Potong ujung batang secara miring 1-2 cm dan segera masukkan ke vas berisi air bersih. Ganti air setiap hari.', 'Produk mudah layu; wajib menggunakan pengiriman Kurir Instan atau Same-Day dan memilih tanggal serta slot kirim.', NULL, 'Bunga Potong Segar • Harum Alami Eucalyptus', 'Buket mawar putih segar bernuansa hijau sage yang elegan untuk hadiah wisuda, ulang tahun, maupun ucapan spesial.', 1, 0, 285000, 249000, NULL, NULL, 1000, 350, 250, 500, 0, 15, 3, 19, 'AKTIF', 3, '2026-10-22 05:35:10', '2026-10-22 05:35:10', NULL, NULL, NULL);

--
-- Triggers `produk`
--
DELIMITER $$
CREATE TRIGGER `trg_produk_cegah_hapus_bertransaksi` BEFORE DELETE ON `produk` FOR EACH ROW BEGIN
  DECLARE v_jumlah_transaksi INT DEFAULT 0;
  SELECT COUNT(*) INTO v_jumlah_transaksi FROM `item_pesanan` WHERE `produk_id` = OLD.`id`;
  IF v_jumlah_transaksi > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PELANGGARAN_BR15: Produk yang memiliki riwayat pesanan tidak boleh dihapus permanen; ubah status_produk menjadi NONAKTIF.';
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_produk_cegah_stok_negatif` BEFORE UPDATE ON `produk` FOR EACH ROW BEGIN
  IF NEW.`jumlah_stok_jual` < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PELANGGARAN_STOK_BR05: Saldo jumlah_stok_jual pada produk tidak boleh bernilai negatif.';
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `produksi_buket_pesanan`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `rekonsiliasi_pembayaran_harian`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `relasi_produk_kategori`
--

CREATE TABLE `relasi_produk_kategori` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal relasi produk-kategori',
  `produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi produk yang dihubungkan ke kategori',
  `kategori_produk_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi kategori produk',
  `status_kategori_utama` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Penanda apakah kategori ini adalah kategori utama produk tersebut',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan relasi multi-kategori agar satu produk dapat tampil pada beberapa kategori florist maupun gardening goods';

--
-- Dumping data for table `relasi_produk_kategori`
--

INSERT INTO `relasi_produk_kategori` (`id`, `produk_id`, `kategori_produk_id`, `status_kategori_utama`, `dibuat_pada`) VALUES
(1, 101, 2, 1, '2026-10-21 04:44:21'),
(2, 102, 3, 1, '2026-10-22 05:35:10'),
(3, 103, 4, 1, '2026-10-22 05:35:10'),
(4, 104, 1, 1, '2026-10-22 05:35:10');

-- --------------------------------------------------------

--
-- Table structure for table `relasi_rekomendasi_produk`
--

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

--
-- Dumping data for table `relasi_rekomendasi_produk`
--

INSERT INTO `relasi_rekomendasi_produk` (`id`, `produk_sumber_id`, `produk_rekomendasi_id`, `jenis_rekomendasi`, `label_alasan_rekomendasi`, `urutan_tampil`, `status_aktif`, `dibuat_oleh_akun_id`, `dibuat_pada`, `diperbarui_pada`) VALUES
(1, 101, 102, 'PELENGKAP_SILANG', 'Pasangan Pot Keramik di Foto', 1, 'AKTIF', 3, '2026-10-22 05:35:10', '2026-10-22 05:35:10'),
(2, 101, 103, 'PELENGKAP_SILANG', 'Media Poros Khusus Monstera', 2, 'AKTIF', 3, '2026-10-22 05:35:10', '2026-10-22 05:35:10'),
(3, 101, 104, 'PASANGAN_BUNDLING', 'Jadikan Paket Hadiah Spesial', 3, 'AKTIF', 3, '2026-10-22 05:35:10', '2026-10-22 05:35:10'),
(4, 102, 101, 'PELENGKAP_SILANG', 'Tanaman Cocok untuk Pot Ini', 1, 'AKTIF', 3, '2026-10-22 05:35:10', '2026-10-22 05:35:10'),
(5, 102, 103, 'PELENGKAP_SILANG', 'Media Tanam Siap Pakai', 2, 'AKTIF', 3, '2026-10-22 05:35:10', '2026-10-22 05:35:10');

--
-- Triggers `relasi_rekomendasi_produk`
--
DELIMITER $$
CREATE TRIGGER `trg_rekomendasi_cegah_diri_sendiri_insert` BEFORE INSERT ON `relasi_rekomendasi_produk` FOR EACH ROW BEGIN
  IF NEW.`produk_sumber_id` = NEW.`produk_rekomendasi_id` THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'VALIDASI_REKOMENDASI_ADR001: Produk tidak boleh merekomendasikan dirinya sendiri.';
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_rekomendasi_cegah_diri_sendiri_update` BEFORE UPDATE ON `relasi_rekomendasi_produk` FOR EACH ROW BEGIN
  IF NEW.`produk_sumber_id` = NEW.`produk_rekomendasi_id` THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'VALIDASI_REKOMENDASI_ADR001: Produk tidak boleh merekomendasikan dirinya sendiri.';
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `resep_buket`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `reservasi_stok_pesanan`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `riwayat_perubahan_stok_bahan`
--

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

--
-- Triggers `riwayat_perubahan_stok_bahan`
--
DELIMITER $$
CREATE TRIGGER `trg_riwayat_stok_bahan_cegah_hapus` BEFORE DELETE ON `riwayat_perubahan_stok_bahan` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_BUKU_BESAR_BAHAN: Buku besar riwayat_perubahan_stok_bahan tidak boleh dihapus.';
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_riwayat_stok_bahan_cegah_ubah` BEFORE UPDATE ON `riwayat_perubahan_stok_bahan` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_BUKU_BESAR_BAHAN: Buku besar riwayat_perubahan_stok_bahan bersifat append-only; gunakan entri koreksi baru.';
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `riwayat_perubahan_stok_produk`
--

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

--
-- Triggers `riwayat_perubahan_stok_produk`
--
DELIMITER $$
CREATE TRIGGER `trg_riwayat_stok_produk_cegah_hapus` BEFORE DELETE ON `riwayat_perubahan_stok_produk` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_BUKU_BESAR_STOK: Buku besar riwayat_perubahan_stok_produk tidak boleh dihapus.';
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_riwayat_stok_produk_cegah_ubah` BEFORE UPDATE ON `riwayat_perubahan_stok_produk` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_BUKU_BESAR_STOK: Buku besar riwayat_perubahan_stok_produk bersifat append-only; gunakan entri koreksi baru.';
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `riwayat_status_pesanan`
--

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

--
-- Triggers `riwayat_status_pesanan`
--
DELIMITER $$
CREATE TRIGGER `trg_riwayat_status_pesanan_cegah_hapus` BEFORE DELETE ON `riwayat_status_pesanan` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_RIWAYAT_PESANAN: Riwayat transisi status pesanan tidak boleh dihapus.';
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_riwayat_status_pesanan_cegah_ubah` BEFORE UPDATE ON `riwayat_status_pesanan` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_RIWAYAT_PESANAN: Riwayat transisi status pesanan bersifat append-only; koreksi wajib melalui T-19.';
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `riwayat_status_produksi_buket`
--

CREATE TABLE `riwayat_status_produksi_buket` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal riwayat status produksi buket',
  `produksi_buket_pesanan_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi pekerjaan produksi buket induk',
  `status_sebelumnya` enum('MENUNGGU_JADWAL','BAHAN_DISIAPKAN','SEDANG_DIRANGKAI','PEMERIKSAAN_KUALITAS','SELESAI_DIRANGKAI','TERKENDALA_BAHAN','DIBATALKAN') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Status produksi sebelum perubahan',
  `status_baru` enum('MENUNGGU_JADWAL','BAHAN_DISIAPKAN','SEDANG_DIRANGKAI','PEMERIKSAAN_KUALITAS','SELESAI_DIRANGKAI','TERKENDALA_BAHAN','DIBATALKAN') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Status produksi baru setelah perubahan',
  `pelaku_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun staf yang memperbarui status produksi',
  `catatan_perubahan` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Catatan atau alasan perubahan status produksi buket',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu perubahan status dicatat (UTC, append-only)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan jejak waktu perubahan status pekerjaan produksi buket secara append-only';

--
-- Triggers `riwayat_status_produksi_buket`
--
DELIMITER $$
CREATE TRIGGER `trg_riwayat_status_produksi_cegah_hapus` BEFORE DELETE ON `riwayat_status_produksi_buket` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_RIWAYAT_PRODUKSI: Riwayat status produksi buket tidak boleh dihapus.';
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_riwayat_status_produksi_cegah_ubah` BEFORE UPDATE ON `riwayat_status_produksi_buket` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_RIWAYAT_PRODUKSI: Riwayat status produksi buket bersifat append-only.';
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `sesi_login`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `slot_pengiriman`
--

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

--
-- Dumping data for table `slot_pengiriman`
--

INSERT INTO `slot_pengiriman` (`id`, `kode_slot`, `nama_tampil_slot`, `jam_mulai_wib`, `jam_selesai_wib`, `lead_time_minimum_jam`, `kuota_maksimum_pesanan_harian`, `urutan_tampil`, `status_aktif`, `dibuat_pada`, `diperbarui_pada`) VALUES
(1, 'PAGI', 'Slot Pagi (08:00 - 12:00 WIB)', '08:00:00', '12:00:00', 4, 40, 1, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(2, 'SIANG', 'Slot Siang (12:00 - 16:00 WIB)', '12:00:00', '16:00:00', 4, 50, 2, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52'),
(3, 'SORE', 'Slot Sore (16:00 - 20:00 WIB)', '16:00:00', '20:00:00', 4, 40, 3, 'AKTIF', '2026-10-19 16:20:52', '2026-10-19 16:20:52');

-- --------------------------------------------------------

--
-- Stand-in structure for view `snapshot_produk_pesanan`
-- (See below for the actual view)
--
CREATE TABLE `snapshot_produk_pesanan` (
`snapshot_produk_pesanan_id` bigint unsigned
,`pesanan_id` bigint unsigned
,`item_pesanan_id` bigint unsigned
,`produk_id` bigint unsigned
,`varian_produk_id` bigint unsigned
,`sku_snapshot` varchar(64)
,`nama_produk_snapshot` varchar(150)
,`nama_varian_snapshot` varchar(150)
,`atribut_varian_snapshot` json
,`satuan_jual_snapshot` varchar(30)
,`jenis_produk_snapshot` enum('PRODUK_STANDAR','BUKET_KUSTOM','TANAMAN_HIAS','PERLENGKAPAN_BERKEBUN','BENIH_DAN_PUPUK','PAKET_BERKEBUN')
,`jenis_penanganan_snapshot` enum('MUDAH_LAYU','TAHAN_LAMA')
,`deskripsi_penting_snapshot` varchar(500)
,`harga_normal_satuan_snapshot` bigint unsigned
,`harga_diskon_satuan_snapshot` bigint unsigned
,`tambahan_harga_kustomisasi_satuan` bigint
,`harga_satuan_final_snapshot` bigint unsigned
,`berat_satuan_gram_snapshot` int unsigned
,`kuantitas` int unsigned
,`subtotal_baris_rupiah` bigint unsigned
,`dibuat_pada` datetime
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `stok_bahan_florist`
-- (See below for the actual view)
--
CREATE TABLE `stok_bahan_florist` (
`id` bigint unsigned
,`bahan_produksi_id` bigint unsigned
,`lokasi_stok_id` bigint unsigned
,`jumlah_stok_saldo` decimal(12,2)
,`jumlah_stok_dialokasikan` decimal(12,2)
,`diperbarui_pada` datetime
);

-- --------------------------------------------------------

--
-- Table structure for table `stok_bahan_produksi`
--

CREATE TABLE `stok_bahan_produksi` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'ID internal saldo bahan per lokasi',
  `bahan_produksi_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi bahan produksi buket',
  `lokasi_stok_id` bigint UNSIGNED NOT NULL COMMENT 'Referensi lokasi penyimpanan bahan (mis. Studio Florist)',
  `jumlah_stok_saldo` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Saldo fisik bahan produksi pada lokasi ini',
  `jumlah_stok_dialokasikan` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Jumlah bahan yang telah dialokasikan untuk produksi buket pesanan aktif',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan saldo bahan terakhir (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan saldo stok bahan produksi buket pada setiap lokasi penyimpanan';

--
-- Dumping data for table `stok_bahan_produksi`
--

INSERT INTO `stok_bahan_produksi` (`id`, `bahan_produksi_id`, `lokasi_stok_id`, `jumlah_stok_saldo`, `jumlah_stok_dialokasikan`, `diperbarui_pada`) VALUES
(1, 1, 2, 200.00, 0.00, '2026-10-19 16:20:52'),
(2, 2, 2, 150.00, 0.00, '2026-10-19 16:20:52'),
(3, 3, 2, 60.00, 0.00, '2026-10-19 16:20:52'),
(4, 4, 2, 50.00, 0.00, '2026-10-19 16:20:52'),
(5, 5, 2, 500.00, 0.00, '2026-10-19 16:20:52'),
(6, 6, 2, 300.00, 0.00, '2026-10-19 16:20:52');

-- --------------------------------------------------------

--
-- Table structure for table `stok_varian_produk`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `tanggal_tutup`
--

CREATE TABLE `tanggal_tutup` (
  `tanggal_libur` date NOT NULL COMMENT 'Tanggal toko tutup (Primary Key sesuai Lampiran A.4 closed_dates)',
  `keterangan_tutup` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Alasan atau nama hari libur tutup operasional toko',
  `ditetapkan_oleh_akun_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Referensi akun Admin/SuperAdmin yang menetapkan tanggal tutup',
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menyimpan kalender tanggal tutup toko untuk memblokir pemilihan jadwal pengiriman saat checkout';

-- --------------------------------------------------------

--
-- Table structure for table `ulasan_produk`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `varian_produk`
--

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

--
-- Dumping data for table `varian_produk`
--

INSERT INTO `varian_produk` (`id`, `produk_id`, `sku_varian`, `nama_varian`, `satuan_jual_varian`, `rasio_konversi_satuan_stok`, `harga_rupiah`, `harga_diskon_rupiah`, `waktu_mulai_diskon`, `waktu_selesai_diskon`, `berat_gram`, `panjang_milimeter`, `lebar_milimeter`, `tinggi_milimeter`, `jumlah_stok_varian`, `ambang_stok_rendah`, `status_varian_utama`, `urutan_tampil`, `status_varian`, `dibuat_pada`, `diperbarui_pada`) VALUES
(1001, 101, 'TNM-MONSTERA-DEL-S', 'Small (Tinggi 25-35 cm)', 'POT', 1.0000, 150000, 125000, NULL, NULL, 1500, 200, 200, 350, 10, 3, 1, 1, 'AKTIF', '2026-10-21 04:44:21', '2026-10-21 04:44:21'),
(1002, 101, 'TNM-MONSTERA-DEL-M', 'Medium (Tinggi 45-60 cm)', 'POT', 1.0000, 225000, 195000, NULL, NULL, 2500, 250, 250, 600, 9, 3, 0, 2, 'AKTIF', '2026-10-21 04:44:21', '2026-10-21 04:44:21'),
(1003, 101, 'TNM-MONSTERA-DEL-L', 'Large (Tinggi 70-90 cm)', 'POT', 1.0000, 350000, 310000, NULL, NULL, 4000, 300, 300, 900, 5, 2, 0, 3, 'AKTIF', '2026-10-21 04:44:21', '2026-10-21 04:44:21'),
(1004, 102, 'POT-KRM-NORDIC-15', 'Diameter 15 cm (Cocok Tanaman Small)', 'PCS', 1.0000, 95000, 85000, NULL, NULL, 1200, 160, 160, 160, 15, 3, 1, 1, 'AKTIF', '2026-10-22 05:35:10', '2026-10-22 05:35:10'),
(1005, 102, 'POT-KRM-NORDIC-20', 'Diameter 20 cm (Cocok Tanaman Medium)', 'PCS', 1.0000, 135000, 120000, NULL, NULL, 1800, 210, 210, 210, 10, 3, 0, 2, 'AKTIF', '2026-10-22 05:35:10', '2026-10-22 05:35:10'),
(1006, 102, 'POT-KRM-NORDIC-25', 'Diameter 25 cm (Cocok Tanaman Large)', 'PCS', 1.0000, 185000, 165000, NULL, NULL, 2600, 260, 260, 260, 5, 2, 0, 3, 'AKTIF', '2026-10-22 05:35:10', '2026-10-22 05:35:10'),
(1007, 103, 'MED-AROID-MIX-2L', 'Kemasan 2 Liter (1-2 Pot Small)', 'LITER', 1.0000, 45000, 39000, NULL, NULL, 800, 220, 160, 80, 25, 5, 1, 1, 'AKTIF', '2026-10-22 05:35:10', '2026-10-22 05:35:10'),
(1008, 103, 'MED-AROID-MIX-5L', 'Kemasan 5 Liter (Hemat Repotting)', 'LITER', 1.0000, 95000, 82000, NULL, NULL, 2000, 300, 220, 120, 15, 3, 0, 2, 'AKTIF', '2026-10-22 05:35:10', '2026-10-22 05:35:10'),
(1009, 104, 'BKT-SAGE-ROSE-CLS', 'Classic (5 Tangkai Mawar + Filler)', 'BUKET', 1.0000, 285000, 249000, NULL, NULL, 1000, 350, 250, 500, 8, 2, 1, 1, 'AKTIF', '2026-10-22 05:35:10', '2026-10-22 05:35:10'),
(1010, 104, 'BKT-SAGE-ROSE-DLX', 'Deluxe (10 Tangkai Mawar + Extra Eucalyptus)', 'BUKET', 1.0000, 420000, 385000, NULL, NULL, 1500, 400, 300, 550, 5, 2, 0, 2, 'AKTIF', '2026-10-22 05:35:10', '2026-10-22 05:35:10'),
(1011, 104, 'BKT-SAGE-ROSE-GRD', 'Grand (20 Tangkai Mawar Premium)', 'BUKET', 1.0000, 690000, 640000, NULL, NULL, 2200, 500, 350, 650, 2, 1, 0, 3, 'AKTIF', '2026-10-22 05:35:10', '2026-10-22 05:35:10');

--
-- Triggers `varian_produk`
--
DELIMITER $$
CREATE TRIGGER `trg_varian_produk_cegah_stok_negatif` BEFORE UPDATE ON `varian_produk` FOR EACH ROW BEGIN
  IF NEW.`jumlah_stok_varian` < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PELANGGARAN_STOK_BR05: Saldo jumlah_stok_varian tidak boleh bernilai negatif.';
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_rekomendasi_produk_aktif`
-- (See below for the actual view)
--
CREATE TABLE `vw_rekomendasi_produk_aktif` (
`relasi_id` bigint unsigned
,`produk_sumber_id` bigint unsigned
,`produk_rekomendasi_id` bigint unsigned
,`jenis_rekomendasi` enum('PELENGKAP_SILANG','SERUPA_ALTERNATIF','PASANGAN_BUNDLING')
,`label_alasan_rekomendasi` varchar(120)
,`urutan_tampil` tinyint unsigned
,`sku` varchar(64)
,`nama_produk` varchar(150)
,`slug_produk` varchar(180)
,`nama_spesies_tanaman` varchar(150)
,`nama_kategori_utama` varchar(100)
,`slug_kategori_utama` varchar(120)
,`jenis_produk` enum('PRODUK_STANDAR','BUKET_KUSTOM','TANAMAN_HIAS','PERLENGKAPAN_BERKEBUN','BENIH_DAN_PUPUK','PAKET_BERKEBUN')
,`jenis_penanganan` enum('MUDAH_LAYU','TAHAN_LAMA')
,`satuan_jual` enum('PCS','POT','BATANG','BUKET','GRAM','KILOGRAM','MILILITER','LITER','PAK','SET')
,`memiliki_varian` tinyint(1)
,`harga_dasar_rupiah` bigint unsigned
,`harga_diskon_rupiah` bigint unsigned
,`harga_efektif_rupiah` bigint unsigned
,`kunci_gambar_utama` varchar(255)
,`jumlah_stok_jual` int
,`status_ketersediaan_stok` varchar(13)
,`jumlah_unit_terjual` bigint unsigned
,`rata_rata_bintang` decimal(5,1)
,`jumlah_ulasan_tampil` bigint
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_ringkasan_dasbor_admin`
-- (See below for the actual view)
--
CREATE TABLE `vw_ringkasan_dasbor_admin` (
`jumlah_pesanan_siap_diproses` bigint
,`jumlah_perlu_dikirim_hari_ini` bigint
,`jumlah_pesanan_perlu_penanganan` bigint
,`jumlah_pembayaran_perlu_ditinjau` bigint
,`jumlah_batal_dan_refund_menunggu` bigint
,`jumlah_komplain_terbuka` bigint
,`jumlah_produk_stok_rendah` bigint
,`jumlah_pengiriman_terkendala` bigint
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_ringkasan_detail_produk`
-- (See below for the actual view)
--
CREATE TABLE `vw_ringkasan_detail_produk` (
`produk_id` bigint unsigned
,`sku` varchar(64)
,`nama_produk` varchar(150)
,`slug_produk` varchar(180)
,`nama_spesies_tanaman` varchar(150)
,`subjudul_singkat` varchar(150)
,`ringkasan_singkat` varchar(500)
,`deskripsi_produk` text
,`kategori_utama_id` bigint unsigned
,`nama_kategori_utama` varchar(100)
,`slug_kategori_utama` varchar(120)
,`jenis_produk` enum('PRODUK_STANDAR','BUKET_KUSTOM','TANAMAN_HIAS','PERLENGKAPAN_BERKEBUN','BENIH_DAN_PUPUK','PAKET_BERKEBUN')
,`jenis_penanganan` enum('MUDAH_LAYU','TAHAN_LAMA')
,`satuan_jual` enum('PCS','POT','BATANG','BUKET','GRAM','KILOGRAM','MILILITER','LITER','PAK','SET')
,`catatan_kelengkapan_jual` varchar(255)
,`memiliki_varian` tinyint(1)
,`harga_dasar_rupiah` bigint unsigned
,`harga_diskon_rupiah` bigint unsigned
,`harga_efektif_rupiah` bigint unsigned
,`kunci_gambar_utama` varchar(255)
,`jumlah_total_gambar` bigint
,`jumlah_poin_accordion` bigint
,`jumlah_stok_jual` int
,`ambang_stok_rendah` int unsigned
,`status_ketersediaan_stok` varchar(13)
,`jumlah_unit_terjual` bigint unsigned
,`rata_rata_bintang` decimal(5,1)
,`jumlah_ulasan_tampil` bigint
,`status_produk` enum('AKTIF','NONAKTIF')
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_stok_tersedia_checkout`
-- (See below for the actual view)
--
CREATE TABLE `vw_stok_tersedia_checkout` (
`produk_id` bigint unsigned
,`varian_produk_id` bigint unsigned
,`sku_aktif` varchar(64)
,`nama_produk` varchar(150)
,`nama_varian` varchar(150)
,`satuan_jual` varchar(9)
,`jenis_produk` enum('PRODUK_STANDAR','BUKET_KUSTOM','TANAMAN_HIAS','PERLENGKAPAN_BERKEBUN','BENIH_DAN_PUPUK','PAKET_BERKEBUN')
,`jenis_penanganan` enum('MUDAH_LAYU','TAHAN_LAMA')
,`saldo_stok_buku_besar` bigint
,`jumlah_reservasi_aktif` decimal(32,0)
,`stok_tersedia_untuk_checkout` decimal(33,0)
,`ambang_stok_rendah` bigint unsigned
);

-- --------------------------------------------------------

--
-- Table structure for table `zona_layanan_kurir`
--

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

--
-- Indexes for dumped tables
--

--
-- Indexes for table `akun_pengguna`
--
ALTER TABLE `akun_pengguna`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_akun_pengguna_email` (`email`),
  ADD KEY `idx_akun_pengguna_status_peran` (`status_akun`,`peran`),
  ADD KEY `idx_akun_pengguna_aktivitas_terakhir` (`status_akun`,`waktu_aktivitas_terakhir`),
  ADD KEY `fk_akun_pengguna_dinonaktifkan_oleh` (`dinonaktifkan_oleh_akun_id`);

--
-- Indexes for table `alamat_pengguna`
--
ALTER TABLE `alamat_pengguna`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_alamat_pengguna_akun_aktif` (`akun_pengguna_id`,`status_aktif`,`status_alamat_utama`),
  ADD KEY `idx_alamat_pengguna_kode_pos` (`kode_pos`);

--
-- Indexes for table `antrean_keluar`
--
ALTER TABLE `antrean_keluar`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_antrean_keluar_idempotensi` (`kunci_idempotensi_kirim`),
  ADD KEY `idx_antrean_keluar_jadwal_proses` (`status_pengiriman_pesan`,`waktu_percobaan_berikutnya`),
  ADD KEY `fk_antrean_keluar_penerima` (`akun_penerima_id`);

--
-- Indexes for table `atribut_produk`
--
ALTER TABLE `atribut_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_atribut_produk_kode` (`kode_atribut`),
  ADD KEY `idx_atribut_produk_filter` (`status_aktif`,`dapat_difilter_di_katalog`,`urutan_tampil`);

--
-- Indexes for table `bahan_produksi`
--
ALTER TABLE `bahan_produksi`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_bahan_produksi_kode` (`kode_bahan`),
  ADD KEY `idx_bahan_produksi_kelompok_status` (`kelompok_bahan`,`status_aktif`);

--
-- Indexes for table `batas_laju_permintaan`
--
ALTER TABLE `batas_laju_permintaan`
  ADD PRIMARY KEY (`kunci_batas_laju`,`awal_jendela_waktu`),
  ADD KEY `idx_batas_laju_awal_jendela` (`awal_jendela_waktu`);

--
-- Indexes for table `batch_persediaan`
--
ALTER TABLE `batch_persediaan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_batch_persediaan_kode_lokasi` (`produk_id`,`varian_produk_id`,`lokasi_stok_id`,`nomor_kode_batch`),
  ADD KEY `idx_batch_persediaan_fefo` (`produk_id`,`status_batch`,`tanggal_kedaluwarsa`),
  ADD KEY `fk_batch_persediaan_varian` (`varian_produk_id`),
  ADD KEY `fk_batch_persediaan_lokasi` (`lokasi_stok_id`);

--
-- Indexes for table `catatan_pesanan`
--
ALTER TABLE `catatan_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_catatan_pesanan_waktu` (`pesanan_id`,`jenis_catatan`,`dibuat_pada`),
  ADD KEY `fk_catatan_pesanan_penulis` (`penulis_akun_id`);

--
-- Indexes for table `daftar_keinginan`
--
ALTER TABLE `daftar_keinginan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_daftar_keinginan_akun_nama` (`akun_pengguna_id`,`nama_daftar`);

--
-- Indexes for table `detail_resep_buket`
--
ALTER TABLE `detail_resep_buket`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_detail_resep_buket_bahan` (`resep_buket_id`,`bahan_produksi_id`),
  ADD KEY `fk_detail_resep_buket_bahan` (`bahan_produksi_id`);

--
-- Indexes for table `foto_komplain`
--
ALTER TABLE `foto_komplain`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_foto_komplain_urutan` (`komplain_id`,`urutan_foto`);

--
-- Indexes for table `foto_pengiriman`
--
ALTER TABLE `foto_pengiriman`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_foto_pengiriman_jenis` (`pengiriman_id`,`jenis_foto_pengiriman`),
  ADD KEY `fk_foto_pengiriman_pengunggah` (`diunggah_oleh_akun_id`);

--
-- Indexes for table `gambar_produk`
--
ALTER TABLE `gambar_produk`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_gambar_produk_urutan` (`produk_id`,`status_gambar_utama`,`urutan_tampil`),
  ADD KEY `fk_gambar_produk_varian` (`varian_produk_id`);

--
-- Indexes for table `identitas_eksternal`
--
ALTER TABLE `identitas_eksternal`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_identitas_eksternal_penyedia_subjek` (`nama_penyedia`,`subjek_penyedia_id`),
  ADD UNIQUE KEY `uk_identitas_eksternal_akun_penyedia` (`akun_pengguna_id`,`nama_penyedia`);

--
-- Indexes for table `item_daftar_keinginan`
--
ALTER TABLE `item_daftar_keinginan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_item_daftar_keinginan_unik` (`daftar_keinginan_id`,`produk_id`,`varian_produk_id`),
  ADD KEY `fk_item_daftar_keinginan_produk` (`produk_id`),
  ADD KEY `fk_item_daftar_keinginan_varian` (`varian_produk_id`);

--
-- Indexes for table `item_keranjang_belanja`
--
ALTER TABLE `item_keranjang_belanja`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_item_keranjang_produk_varian_konfigurasi` (`keranjang_id`,`produk_id`,`varian_produk_id`,`hash_sidik_konfigurasi`),
  ADD KEY `fk_item_keranjang_produk` (`produk_id`),
  ADD KEY `fk_item_keranjang_varian` (`varian_produk_id`);

--
-- Indexes for table `item_pesanan`
--
ALTER TABLE `item_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_item_pesanan_pesanan` (`pesanan_id`),
  ADD KEY `idx_item_pesanan_produk` (`produk_id`,`varian_produk_id`),
  ADD KEY `fk_item_pesanan_varian` (`varian_produk_id`),
  ADD KEY `fk_item_pesanan_substitusi` (`produk_pengganti_substitusi_id`);

--
-- Indexes for table `kategori_pilihan_buket`
--
ALTER TABLE `kategori_pilihan_buket`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_kategori_pilihan_buket_kode` (`kode_kategori_pilihan`),
  ADD KEY `idx_kategori_pilihan_buket_urutan` (`status_aktif`,`urutan_tampil`);

--
-- Indexes for table `kategori_pilihan_produk`
--
ALTER TABLE `kategori_pilihan_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_kategori_pilihan_produk_pasangan` (`produk_id`,`kategori_pilihan_buket_id`),
  ADD KEY `fk_kategori_pilihan_produk_kategori_buket` (`kategori_pilihan_buket_id`);

--
-- Indexes for table `kategori_produk`
--
ALTER TABLE `kategori_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_kategori_produk_kode` (`kode_kategori`),
  ADD UNIQUE KEY `uk_kategori_produk_slug` (`slug_kategori`),
  ADD KEY `idx_kategori_produk_induk_status` (`kategori_induk_id`,`status_aktif`,`urutan_tampil`);

--
-- Indexes for table `kebutuhan_bahan_buket_pesanan`
--
ALTER TABLE `kebutuhan_bahan_buket_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_kebutuhan_bahan_buket_pesanan_unik` (`konfigurasi_buket_pesanan_id`,`bahan_produksi_id`),
  ADD KEY `idx_kebutuhan_bahan_pesanan_status` (`pesanan_id`,`status_alokasi_bahan`),
  ADD KEY `fk_kebutuhan_bahan_pesanan_bahan` (`bahan_produksi_id`);

--
-- Indexes for table `kebutuhan_bahan_opsi_buket`
--
ALTER TABLE `kebutuhan_bahan_opsi_buket`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_kebutuhan_bahan_opsi_pasangan` (`opsi_pilihan_buket_id`,`bahan_produksi_id`),
  ADD KEY `fk_kebutuhan_bahan_opsi_bahan` (`bahan_produksi_id`);

--
-- Indexes for table `keranjang`
--
ALTER TABLE `keranjang`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_keranjang_token_tamu` (`token_keranjang_tamu`),
  ADD KEY `idx_keranjang_akun_status` (`akun_pengguna_id`,`status_keranjang`),
  ADD KEY `idx_keranjang_retensi` (`status_keranjang`,`waktu_aktivitas_terakhir`);

--
-- Indexes for table `kode_verifikasi`
--
ALTER TABLE `kode_verifikasi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_kode_verifikasi_akun_tujuan` (`akun_pengguna_id`,`tujuan_verifikasi`,`waktu_kedaluwarsa`),
  ADD KEY `idx_kode_verifikasi_hash` (`hash_kode_atau_token`);

--
-- Indexes for table `komplain`
--
ALTER TABLE `komplain`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_komplain_nomor_tiket` (`nomor_tiket_komplain`),
  ADD KEY `idx_komplain_pesanan_status` (`pesanan_id`,`status_komplain`),
  ADD KEY `idx_komplain_sla_respons` (`status_komplain`,`batas_waktu_respons_awal`),
  ADD KEY `fk_komplain_item_pesanan` (`item_pesanan_id`),
  ADD KEY `fk_komplain_akun_pengguna` (`akun_pengguna_id`),
  ADD KEY `fk_komplain_pemutus_admin` (`diputuskan_oleh_akun_id`),
  ADD KEY `fk_komplain_pemutus_superadmin` (`pemutus_banding_superadmin_id`);

--
-- Indexes for table `komponen_paket_berkebun`
--
ALTER TABLE `komponen_paket_berkebun`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_komponen_paket_berkebun_item` (`produk_paket_id`,`produk_komponen_id`,`varian_komponen_id`),
  ADD KEY `fk_komponen_paket_produk_komponen` (`produk_komponen_id`),
  ADD KEY `fk_komponen_paket_varian_komponen` (`varian_komponen_id`);

--
-- Indexes for table `konfigurasi_buket_keranjang`
--
ALTER TABLE `konfigurasi_buket_keranjang`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_konfigurasi_buket_keranjang_item` (`item_keranjang_belanja_id`);

--
-- Indexes for table `konfigurasi_buket_pesanan`
--
ALTER TABLE `konfigurasi_buket_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_konfigurasi_buket_pesanan_item` (`item_pesanan_id`);

--
-- Indexes for table `kunci_pekerjaan_terjadwal`
--
ALTER TABLE `kunci_pekerjaan_terjadwal`
  ADD PRIMARY KEY (`nama_pekerjaan`);

--
-- Indexes for table `log_audit`
--
ALTER TABLE `log_audit`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_log_audit_hash_entri` (`hash_entri`),
  ADD KEY `idx_log_audit_waktu` (`waktu_kejadian`),
  ADD KEY `idx_log_audit_objek` (`jenis_objek`,`id_objek`,`waktu_kejadian`),
  ADD KEY `idx_log_audit_pelaku` (`pelaku_akun_id`,`waktu_kejadian`),
  ADD KEY `idx_log_audit_tindakan` (`kode_tindakan`,`waktu_kejadian`);

--
-- Indexes for table `log_peristiwa_keamanan`
--
ALTER TABLE `log_peristiwa_keamanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_log_keamanan_jenis_waktu` (`jenis_peristiwa`,`waktu_kejadian`),
  ADD KEY `idx_log_keamanan_ip_waktu` (`alamat_ip_klien`,`waktu_kejadian`),
  ADD KEY `idx_log_keamanan_akun_waktu` (`akun_pengguna_id`,`waktu_kejadian`);

--
-- Indexes for table `lokasi_stok`
--
ALTER TABLE `lokasi_stok`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_lokasi_stok_kode` (`kode_lokasi`);

--
-- Indexes for table `nilai_atribut_produk`
--
ALTER TABLE `nilai_atribut_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_nilai_atribut_produk_unik` (`produk_id`,`atribut_produk_id`,`pilihan_atribut_produk_id`),
  ADD KEY `idx_nilai_atribut_produk_filter_opsi` (`atribut_produk_id`,`pilihan_atribut_produk_id`),
  ADD KEY `fk_nilai_atribut_produk_pilihan` (`pilihan_atribut_produk_id`);

--
-- Indexes for table `nilai_atribut_varian`
--
ALTER TABLE `nilai_atribut_varian`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_nilai_atribut_varian_unik` (`varian_produk_id`,`atribut_produk_id`),
  ADD KEY `idx_nilai_atribut_varian_pilihan` (`atribut_produk_id`,`pilihan_atribut_produk_id`),
  ADD KEY `fk_nilai_atribut_varian_pilihan` (`pilihan_atribut_produk_id`);

--
-- Indexes for table `notifikasi`
--
ALTER TABLE `notifikasi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifikasi_akun_belum_dibaca` (`akun_pengguna_id`,`status_sudah_dibaca`,`dibuat_pada`),
  ADD KEY `idx_notifikasi_kode_status` (`kode_notifikasi`,`status_kirim`),
  ADD KEY `fk_notifikasi_antrean_keluar` (`antrean_keluar_id`);

--
-- Indexes for table `opsi_pilihan_buket`
--
ALTER TABLE `opsi_pilihan_buket`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_opsi_pilihan_buket_kode` (`kode_opsi`),
  ADD KEY `idx_opsi_pilihan_buket_kategori` (`kategori_pilihan_buket_id`,`status_aktif`,`urutan_tampil`);

--
-- Indexes for table `pengaturan_sistem`
--
ALTER TABLE `pengaturan_sistem`
  ADD PRIMARY KEY (`kunci_parameter`),
  ADD UNIQUE KEY `uk_pengaturan_sistem_kode_p` (`kode_register_parameter`),
  ADD KEY `fk_pengaturan_sistem_superadmin` (`diperbarui_oleh_superadmin_id`);

--
-- Indexes for table `pengembalian_dana`
--
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

--
-- Indexes for table `pengiriman`
--
ALTER TABLE `pengiriman`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_pengiriman_pesanan_urut` (`pesanan_id`,`nomor_urut_pengiriman`),
  ADD KEY `idx_pengiriman_resi` (`nomor_resi_atau_referensi`),
  ADD KEY `idx_pengiriman_status_polling` (`status_pengiriman`,`diperbarui_pada`),
  ADD KEY `fk_pengiriman_diserahkan_oleh` (`diserahkan_oleh_akun_id`),
  ADD KEY `fk_pengiriman_diperiksa_oleh` (`diperiksa_oleh_akun_id`);

--
-- Indexes for table `percobaan_pembayaran_pesanan`
--
ALTER TABLE `percobaan_pembayaran_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_percobaan_pembayaran_id_gateway` (`id_transaksi_gateway`),
  ADD UNIQUE KEY `uk_percobaan_pembayaran_pesanan_urut` (`pesanan_id`,`nomor_urut_percobaan`),
  ADD KEY `idx_percobaan_pembayaran_status` (`pesanan_id`,`status_percobaan`),
  ADD KEY `fk_percobaan_pembayaran_konfirmasi_cod` (`dikonfirmasi_cod_oleh_akun_id`);

--
-- Indexes for table `peristiwa_pembayaran`
--
ALTER TABLE `peristiwa_pembayaran`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_peristiwa_pembayaran_idempotensi` (`id_transaksi_gateway`,`jenis_peristiwa`),
  ADD KEY `idx_peristiwa_pembayaran_percobaan` (`percobaan_pembayaran_pesanan_id`),
  ADD KEY `idx_peristiwa_pembayaran_waktu` (`waktu_diterima`,`status_tanda_tangan_valid`);

--
-- Indexes for table `peristiwa_pengiriman`
--
ALTER TABLE `peristiwa_pengiriman`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_peristiwa_pengiriman_idempotensi` (`pengiriman_id`,`id_peristiwa_eksternal_kurir`),
  ADD KEY `idx_peristiwa_pengiriman_garis_waktu` (`pengiriman_id`,`waktu_peristiwa_kurir`),
  ADD KEY `fk_peristiwa_pengiriman_pelaku` (`pelaku_akun_id`);

--
-- Indexes for table `permintaan_pembatalan`
--
ALTER TABLE `permintaan_pembatalan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_permintaan_pembatalan_pesanan_status` (`pesanan_id`,`status_permintaan`),
  ADD KEY `idx_permintaan_pembatalan_antrean` (`status_permintaan`,`batas_waktu_keputusan`),
  ADD KEY `fk_permintaan_pembatalan_pengaju` (`diajukan_oleh_akun_id`),
  ADD KEY `fk_permintaan_pembatalan_pemutus` (`diputuskan_oleh_akun_id`);

--
-- Indexes for table `persetujuan_operasi_sensitif`
--
ALTER TABLE `persetujuan_operasi_sensitif`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_persetujuan_sensitif_status` (`status_persetujuan`,`jenis_operasi`),
  ADD KEY `fk_persetujuan_sensitif_pengaju` (`pengaju_akun_id`),
  ADD KEY `fk_persetujuan_sensitif_penyetuju` (`penyetuju_kedua_akun_id`);

--
-- Indexes for table `pesanan`
--
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

--
-- Indexes for table `pilihan_atribut_produk`
--
ALTER TABLE `pilihan_atribut_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_pilihan_atribut_kode` (`atribut_produk_id`,`kode_pilihan`),
  ADD KEY `idx_pilihan_atribut_urutan` (`atribut_produk_id`,`status_aktif`,`urutan_tampil`);

--
-- Indexes for table `pilihan_buket_keranjang`
--
ALTER TABLE `pilihan_buket_keranjang`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_pilihan_buket_keranjang_opsi` (`konfigurasi_buket_keranjang_id`,`opsi_pilihan_buket_id`),
  ADD KEY `fk_pilihan_buket_keranjang_kategori` (`kategori_pilihan_buket_id`),
  ADD KEY `fk_pilihan_buket_keranjang_opsi` (`opsi_pilihan_buket_id`);

--
-- Indexes for table `pilihan_buket_pesanan`
--
ALTER TABLE `pilihan_buket_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pilihan_buket_pesanan_konfigurasi` (`konfigurasi_buket_pesanan_id`),
  ADD KEY `fk_pilihan_buket_pesanan_kategori` (`kategori_pilihan_buket_id`),
  ADD KEY `fk_pilihan_buket_pesanan_opsi` (`opsi_pilihan_buket_id`);

--
-- Indexes for table `poin_informasi_produk`
--
ALTER TABLE `poin_informasi_produk`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_poin_informasi_produk_urutan` (`produk_id`,`status_aktif`,`urutan_tampil`);

--
-- Indexes for table `produk`
--
ALTER TABLE `produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_produk_sku` (`sku`),
  ADD UNIQUE KEY `uk_produk_slug` (`slug_produk`),
  ADD KEY `idx_produk_status_kategori` (`status_produk`,`kategori_utama_id`),
  ADD KEY `idx_produk_jenis_penanganan` (`status_produk`,`jenis_produk`,`jenis_penanganan`),
  ADD KEY `idx_produk_harga_terlaris` (`status_produk`,`harga_dasar_rupiah`,`jumlah_unit_terjual`),
  ADD KEY `fk_produk_dibuat_oleh` (`dibuat_oleh_akun_id`),
  ADD KEY `fk_produk_kategori_utama` (`kategori_utama_id`);

--
-- Indexes for table `produksi_buket_pesanan`
--
ALTER TABLE `produksi_buket_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_produksi_buket_nomor_instruksi` (`nomor_instruksi_kerja`),
  ADD KEY `idx_produksi_buket_pesanan_status` (`pesanan_id`,`status_produksi_buket`),
  ADD KEY `idx_produksi_buket_target` (`status_produksi_buket`,`waktu_target_selesai`),
  ADD KEY `fk_produksi_buket_item` (`item_pesanan_id`),
  ADD KEY `fk_produksi_buket_konfigurasi` (`konfigurasi_buket_pesanan_id`),
  ADD KEY `fk_produksi_buket_lokasi` (`lokasi_stok_id`),
  ADD KEY `fk_produksi_buket_perangkai` (`perangkai_akun_id`);

--
-- Indexes for table `rekonsiliasi_pembayaran_harian`
--
ALTER TABLE `rekonsiliasi_pembayaran_harian`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_rekonsiliasi_tanggal_txn` (`tanggal_periode_transaksi`,`id_transaksi_gateway`),
  ADD KEY `idx_rekonsiliasi_status_tinjau` (`status_penyelesaian`,`tanggal_periode_transaksi`),
  ADD KEY `fk_rekonsiliasi_pesanan` (`pesanan_id`),
  ADD KEY `fk_rekonsiliasi_percobaan` (`percobaan_pembayaran_pesanan_id`),
  ADD KEY `fk_rekonsiliasi_superadmin` (`diselesaikan_oleh_superadmin_id`),
  ADD KEY `fk_rekonsiliasi_penyetuju_kedua` (`disetujui_kedua_oleh_akun_id`);

--
-- Indexes for table `relasi_produk_kategori`
--
ALTER TABLE `relasi_produk_kategori`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_relasi_produk_kategori_pasangan` (`produk_id`,`kategori_produk_id`),
  ADD KEY `idx_relasi_produk_kategori_filter` (`kategori_produk_id`,`produk_id`);

--
-- Indexes for table `relasi_rekomendasi_produk`
--
ALTER TABLE `relasi_rekomendasi_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_relasi_rekomendasi_pasangan` (`produk_sumber_id`,`produk_rekomendasi_id`),
  ADD KEY `idx_rekomendasi_sumber_aktif_urutan` (`produk_sumber_id`,`status_aktif`,`urutan_tampil`),
  ADD KEY `fk_rekomendasi_produk_target` (`produk_rekomendasi_id`),
  ADD KEY `fk_rekomendasi_dibuat_oleh` (`dibuat_oleh_akun_id`);

--
-- Indexes for table `resep_buket`
--
ALTER TABLE `resep_buket`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_resep_buket_kode` (`kode_resep`),
  ADD UNIQUE KEY `uk_resep_buket_produk_varian` (`produk_id`,`varian_produk_id`),
  ADD KEY `fk_resep_buket_varian` (`varian_produk_id`);

--
-- Indexes for table `reservasi_stok_pesanan`
--
ALTER TABLE `reservasi_stok_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_reservasi_stok_idempotensi` (`kunci_idempotensi`),
  ADD KEY `idx_reservasi_stok_status_kedaluwarsa` (`status_reservasi`,`waktu_kedaluwarsa`),
  ADD KEY `idx_reservasi_stok_pesanan` (`pesanan_id`,`status_reservasi`),
  ADD KEY `idx_reservasi_stok_produk_aktif` (`produk_id`,`varian_produk_id`,`status_reservasi`),
  ADD KEY `fk_reservasi_stok_item_pesanan` (`item_pesanan_id`),
  ADD KEY `fk_reservasi_stok_varian` (`varian_produk_id`),
  ADD KEY `fk_reservasi_stok_lokasi` (`lokasi_stok_id`);

--
-- Indexes for table `riwayat_perubahan_stok_bahan`
--
ALTER TABLE `riwayat_perubahan_stok_bahan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_riwayat_stok_bahan_idempotensi` (`kunci_idempotensi`),
  ADD KEY `idx_riwayat_stok_bahan_waktu` (`bahan_produksi_id`,`dibuat_pada`),
  ADD KEY `idx_riwayat_stok_bahan_referensi` (`jenis_referensi`,`referensi_id`),
  ADD KEY `fk_riwayat_stok_bahan_lokasi` (`lokasi_stok_id`),
  ADD KEY `fk_riwayat_stok_bahan_pelaku` (`pelaku_akun_id`);

--
-- Indexes for table `riwayat_perubahan_stok_produk`
--
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

--
-- Indexes for table `riwayat_status_pesanan`
--
ALTER TABLE `riwayat_status_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_riwayat_status_pesanan_garis_waktu` (`pesanan_id`,`dibuat_pada`),
  ADD KEY `fk_riwayat_status_pesanan_pelaku` (`pelaku_akun_id`),
  ADD KEY `fk_riwayat_status_pesanan_koreksi` (`referensi_koreksi_riwayat_id`);

--
-- Indexes for table `riwayat_status_produksi_buket`
--
ALTER TABLE `riwayat_status_produksi_buket`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_riwayat_status_produksi_waktu` (`produksi_buket_pesanan_id`,`dibuat_pada`),
  ADD KEY `fk_riwayat_status_produksi_pelaku` (`pelaku_akun_id`);

--
-- Indexes for table `sesi_login`
--
ALTER TABLE `sesi_login`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_sesi_login_hash_id_sesi` (`hash_id_sesi`),
  ADD KEY `idx_sesi_login_akun_aktif` (`akun_pengguna_id`,`waktu_dicabut`,`waktu_kedaluwarsa`),
  ADD KEY `idx_sesi_login_kedaluwarsa` (`waktu_kedaluwarsa`);

--
-- Indexes for table `slot_pengiriman`
--
ALTER TABLE `slot_pengiriman`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_slot_pengiriman_kode` (`kode_slot`);

--
-- Indexes for table `stok_bahan_produksi`
--
ALTER TABLE `stok_bahan_produksi`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_stok_bahan_produksi_lokasi` (`bahan_produksi_id`,`lokasi_stok_id`),
  ADD KEY `fk_stok_bahan_produksi_lokasi` (`lokasi_stok_id`);

--
-- Indexes for table `stok_varian_produk`
--
ALTER TABLE `stok_varian_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_stok_varian_produk_lokasi` (`produk_id`,`varian_produk_id`,`lokasi_stok_id`),
  ADD KEY `idx_stok_varian_lokasi` (`lokasi_stok_id`,`jumlah_stok_saldo`),
  ADD KEY `fk_stok_varian_produk_varian` (`varian_produk_id`);

--
-- Indexes for table `tanggal_tutup`
--
ALTER TABLE `tanggal_tutup`
  ADD PRIMARY KEY (`tanggal_libur`),
  ADD KEY `fk_tanggal_tutup_ditetapkan_oleh` (`ditetapkan_oleh_akun_id`);

--
-- Indexes for table `ulasan_produk`
--
ALTER TABLE `ulasan_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_ulasan_produk_item_pesanan` (`item_pesanan_id`),
  ADD KEY `idx_ulasan_produk_tampil` (`produk_id`,`status_tampil`,`nilai_bintang`),
  ADD KEY `fk_ulasan_produk_pesanan` (`pesanan_id`),
  ADD KEY `fk_ulasan_produk_varian` (`varian_produk_id`),
  ADD KEY `fk_ulasan_produk_akun` (`akun_pengguna_id`);

--
-- Indexes for table `varian_produk`
--
ALTER TABLE `varian_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_varian_produk_sku` (`sku_varian`),
  ADD KEY `idx_varian_produk_induk_status` (`produk_id`,`status_varian`,`urutan_tampil`);

--
-- Indexes for table `zona_layanan_kurir`
--
ALTER TABLE `zona_layanan_kurir`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_zona_layanan_kurir_wilayah` (`kode_kurir`,`kode_layanan`,`provinsi_tujuan`,`kota_kabupaten_tujuan`,`kecamatan_tujuan`,`kode_pos_tujuan`),
  ADD KEY `idx_zona_kurir_pencarian` (`status_aktif`,`kota_kabupaten_tujuan`,`mendukung_produk_mudah_layu`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `akun_pengguna`
--
ALTER TABLE `akun_pengguna`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal unik akun pengguna', AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `alamat_pengguna`
--
ALTER TABLE `alamat_pengguna`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal alamat pengguna';

--
-- AUTO_INCREMENT for table `antrean_keluar`
--
ALTER TABLE `antrean_keluar`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal baris antrean keluar (outbox)';

--
-- AUTO_INCREMENT for table `atribut_produk`
--
ALTER TABLE `atribut_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal definisi atribut produk', AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `bahan_produksi`
--
ALTER TABLE `bahan_produksi`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal bahan produksi buket', AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `batch_persediaan`
--
ALTER TABLE `batch_persediaan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal batch persediaan';

--
-- AUTO_INCREMENT for table `catatan_pesanan`
--
ALTER TABLE `catatan_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal catatan pesanan';

--
-- AUTO_INCREMENT for table `daftar_keinginan`
--
ALTER TABLE `daftar_keinginan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal daftar keinginan pelanggan';

--
-- AUTO_INCREMENT for table `detail_resep_buket`
--
ALTER TABLE `detail_resep_buket`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal detail resep buket';

--
-- AUTO_INCREMENT for table `foto_komplain`
--
ALTER TABLE `foto_komplain`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal foto bukti komplain';

--
-- AUTO_INCREMENT for table `foto_pengiriman`
--
ALTER TABLE `foto_pengiriman`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal foto bukti pengiriman';

--
-- AUTO_INCREMENT for table `gambar_produk`
--
ALTER TABLE `gambar_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal gambar produk', AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `identitas_eksternal`
--
ALTER TABLE `identitas_eksternal`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal identitas eksternal';

--
-- AUTO_INCREMENT for table `item_daftar_keinginan`
--
ALTER TABLE `item_daftar_keinginan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal item daftar keinginan';

--
-- AUTO_INCREMENT for table `item_keranjang_belanja`
--
ALTER TABLE `item_keranjang_belanja`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal baris item keranjang belanja';

--
-- AUTO_INCREMENT for table `item_pesanan`
--
ALTER TABLE `item_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal baris item pesanan';

--
-- AUTO_INCREMENT for table `kategori_pilihan_buket`
--
ALTER TABLE `kategori_pilihan_buket`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal kategori pilihan kustomisasi buket', AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `kategori_pilihan_produk`
--
ALTER TABLE `kategori_pilihan_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pemetaan kategori pilihan ke produk';

--
-- AUTO_INCREMENT for table `kategori_produk`
--
ALTER TABLE `kategori_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal kategori produk', AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `kebutuhan_bahan_buket_pesanan`
--
ALTER TABLE `kebutuhan_bahan_buket_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal kebutuhan bahan buket pesanan';

--
-- AUTO_INCREMENT for table `kebutuhan_bahan_opsi_buket`
--
ALTER TABLE `kebutuhan_bahan_opsi_buket`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pemetaan kebutuhan bahan opsi buket', AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `keranjang`
--
ALTER TABLE `keranjang`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal keranjang belanja';

--
-- AUTO_INCREMENT for table `kode_verifikasi`
--
ALTER TABLE `kode_verifikasi`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal kode verifikasi';

--
-- AUTO_INCREMENT for table `komplain`
--
ALTER TABLE `komplain`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal komplain pesanan';

--
-- AUTO_INCREMENT for table `komponen_paket_berkebun`
--
ALTER TABLE `komponen_paket_berkebun`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal komponen paket berkebun';

--
-- AUTO_INCREMENT for table `konfigurasi_buket_keranjang`
--
ALTER TABLE `konfigurasi_buket_keranjang`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal konfigurasi buket di keranjang';

--
-- AUTO_INCREMENT for table `konfigurasi_buket_pesanan`
--
ALTER TABLE `konfigurasi_buket_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal konfigurasi buket pada pesanan';

--
-- AUTO_INCREMENT for table `log_audit`
--
ALTER TABLE `log_audit`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID monoton urut entri audit log', AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `log_peristiwa_keamanan`
--
ALTER TABLE `log_peristiwa_keamanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal catatan peristiwa keamanan';

--
-- AUTO_INCREMENT for table `lokasi_stok`
--
ALTER TABLE `lokasi_stok`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal lokasi stok', AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `nilai_atribut_produk`
--
ALTER TABLE `nilai_atribut_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal nilai atribut produk';

--
-- AUTO_INCREMENT for table `nilai_atribut_varian`
--
ALTER TABLE `nilai_atribut_varian`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal nilai atribut varian';

--
-- AUTO_INCREMENT for table `notifikasi`
--
ALTER TABLE `notifikasi`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal notifikasi pengguna';

--
-- AUTO_INCREMENT for table `opsi_pilihan_buket`
--
ALTER TABLE `opsi_pilihan_buket`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal opsi pilihan buket', AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `pengembalian_dana`
--
ALTER TABLE `pengembalian_dana`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pengembalian dana (refund)';

--
-- AUTO_INCREMENT for table `pengiriman`
--
ALTER TABLE `pengiriman`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pengiriman paket';

--
-- AUTO_INCREMENT for table `percobaan_pembayaran_pesanan`
--
ALTER TABLE `percobaan_pembayaran_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal percobaan pembayaran pesanan';

--
-- AUTO_INCREMENT for table `peristiwa_pembayaran`
--
ALTER TABLE `peristiwa_pembayaran`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal peristiwa webhook pembayaran';

--
-- AUTO_INCREMENT for table `peristiwa_pengiriman`
--
ALTER TABLE `peristiwa_pengiriman`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal peristiwa pelacakan pengiriman';

--
-- AUTO_INCREMENT for table `permintaan_pembatalan`
--
ALTER TABLE `permintaan_pembatalan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal permintaan pembatalan';

--
-- AUTO_INCREMENT for table `persetujuan_operasi_sensitif`
--
ALTER TABLE `persetujuan_operasi_sensitif`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal permintaan operasi sensitif';

--
-- AUTO_INCREMENT for table `pesanan`
--
ALTER TABLE `pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pesanan';

--
-- AUTO_INCREMENT for table `pilihan_atribut_produk`
--
ALTER TABLE `pilihan_atribut_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pilihan atribut', AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `pilihan_buket_keranjang`
--
ALTER TABLE `pilihan_buket_keranjang`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pilihan opsi buket di keranjang';

--
-- AUTO_INCREMENT for table `pilihan_buket_pesanan`
--
ALTER TABLE `pilihan_buket_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal snapshot opsi buket pesanan';

--
-- AUTO_INCREMENT for table `poin_informasi_produk`
--
ALTER TABLE `poin_informasi_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal poin informasi accordion produk', AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `produk`
--
ALTER TABLE `produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal produk', AUTO_INCREMENT=105;

--
-- AUTO_INCREMENT for table `produksi_buket_pesanan`
--
ALTER TABLE `produksi_buket_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pekerjaan produksi buket';

--
-- AUTO_INCREMENT for table `rekonsiliasi_pembayaran_harian`
--
ALTER TABLE `rekonsiliasi_pembayaran_harian`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal item rekonsiliasi pembayaran';

--
-- AUTO_INCREMENT for table `relasi_produk_kategori`
--
ALTER TABLE `relasi_produk_kategori`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal relasi produk-kategori', AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `relasi_rekomendasi_produk`
--
ALTER TABLE `relasi_rekomendasi_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal relasi rekomendasi produk', AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `resep_buket`
--
ALTER TABLE `resep_buket`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal resep dasar buket';

--
-- AUTO_INCREMENT for table `reservasi_stok_pesanan`
--
ALTER TABLE `reservasi_stok_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal reservasi stok pesanan';

--
-- AUTO_INCREMENT for table `riwayat_perubahan_stok_bahan`
--
ALTER TABLE `riwayat_perubahan_stok_bahan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID urut entri buku besar stok bahan produksi';

--
-- AUTO_INCREMENT for table `riwayat_perubahan_stok_produk`
--
ALTER TABLE `riwayat_perubahan_stok_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID urut entri buku besar stok produk';

--
-- AUTO_INCREMENT for table `riwayat_status_pesanan`
--
ALTER TABLE `riwayat_status_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal riwayat transisi status pesanan';

--
-- AUTO_INCREMENT for table `riwayat_status_produksi_buket`
--
ALTER TABLE `riwayat_status_produksi_buket`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal riwayat status produksi buket';

--
-- AUTO_INCREMENT for table `sesi_login`
--
ALTER TABLE `sesi_login`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal baris sesi login';

--
-- AUTO_INCREMENT for table `slot_pengiriman`
--
ALTER TABLE `slot_pengiriman`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal slot pengiriman', AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `stok_bahan_produksi`
--
ALTER TABLE `stok_bahan_produksi`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal saldo bahan per lokasi', AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `stok_varian_produk`
--
ALTER TABLE `stok_varian_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal baris saldo stok lokasi';

--
-- AUTO_INCREMENT for table `ulasan_produk`
--
ALTER TABLE `ulasan_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal ulasan produk';

--
-- AUTO_INCREMENT for table `varian_produk`
--
ALTER TABLE `varian_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal varian produk', AUTO_INCREMENT=1012;

--
-- AUTO_INCREMENT for table `zona_layanan_kurir`
--
ALTER TABLE `zona_layanan_kurir`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal zona dan layanan kurir';

-- --------------------------------------------------------

--
-- Structure for view `bahan_florist`
--
DROP TABLE IF EXISTS `bahan_florist`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `bahan_florist`  AS SELECT `bahan_produksi`.`id` AS `id`, `bahan_produksi`.`kode_bahan` AS `kode_bahan`, `bahan_produksi`.`nama_bahan` AS `nama_bahan`, `bahan_produksi`.`kelompok_bahan` AS `kelompok_bahan`, `bahan_produksi`.`satuan_bahan` AS `satuan_bahan`, `bahan_produksi`.`jenis_ketahanan_bahan` AS `jenis_ketahanan_bahan`, `bahan_produksi`.`masa_simpan_hari` AS `masa_simpan_hari`, `bahan_produksi`.`biaya_pokok_satuan_rupiah` AS `biaya_pokok_satuan_rupiah`, `bahan_produksi`.`jumlah_stok_bahan` AS `jumlah_stok_bahan`, `bahan_produksi`.`ambang_stok_rendah` AS `ambang_stok_rendah`, `bahan_produksi`.`status_aktif` AS `status_aktif`, `bahan_produksi`.`dibuat_pada` AS `dibuat_pada`, `bahan_produksi`.`diperbarui_pada` AS `diperbarui_pada` FROM `bahan_produksi` ;

-- --------------------------------------------------------

--
-- Structure for view `kategori`
--
DROP TABLE IF EXISTS `kategori`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `kategori`  AS SELECT `kategori_produk`.`id` AS `id`, `kategori_produk`.`kategori_induk_id` AS `kategori_induk_id`, `kategori_produk`.`kode_kategori` AS `kode_kategori`, `kategori_produk`.`nama_kategori` AS `nama_kategori`, `kategori_produk`.`slug_kategori` AS `slug_kategori`, `kategori_produk`.`kelompok_domain` AS `kelompok_domain`, `kategori_produk`.`deskripsi_kategori` AS `deskripsi_kategori`, `kategori_produk`.`url_gambar_banner` AS `url_gambar_banner`, `kategori_produk`.`urutan_tampil` AS `urutan_tampil`, `kategori_produk`.`status_aktif` AS `status_aktif`, `kategori_produk`.`dibuat_pada` AS `dibuat_pada`, `kategori_produk`.`diperbarui_pada` AS `diperbarui_pada` FROM `kategori_produk` ;

-- --------------------------------------------------------

--
-- Structure for view `mutasi_stok_bahan`
--
DROP TABLE IF EXISTS `mutasi_stok_bahan`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `mutasi_stok_bahan`  AS SELECT `riwayat_perubahan_stok_bahan`.`id` AS `id`, `riwayat_perubahan_stok_bahan`.`bahan_produksi_id` AS `bahan_produksi_id`, `riwayat_perubahan_stok_bahan`.`lokasi_stok_id` AS `lokasi_stok_id`, `riwayat_perubahan_stok_bahan`.`jenis_mutasi_bahan` AS `jenis_mutasi_bahan`, `riwayat_perubahan_stok_bahan`.`perubahan_kuantitas` AS `perubahan_kuantitas`, `riwayat_perubahan_stok_bahan`.`saldo_setelah_mutasi` AS `saldo_setelah_mutasi`, `riwayat_perubahan_stok_bahan`.`jenis_referensi` AS `jenis_referensi`, `riwayat_perubahan_stok_bahan`.`referensi_id` AS `referensi_id`, `riwayat_perubahan_stok_bahan`.`kunci_idempotensi` AS `kunci_idempotensi`, `riwayat_perubahan_stok_bahan`.`pelaku_akun_id` AS `pelaku_akun_id`, `riwayat_perubahan_stok_bahan`.`alasan_mutasi` AS `alasan_mutasi`, `riwayat_perubahan_stok_bahan`.`dibuat_pada` AS `dibuat_pada` FROM `riwayat_perubahan_stok_bahan` ;

-- --------------------------------------------------------

--
-- Structure for view `mutasi_stok_produk`
--
DROP TABLE IF EXISTS `mutasi_stok_produk`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `mutasi_stok_produk`  AS SELECT `riwayat_perubahan_stok_produk`.`id` AS `id`, `riwayat_perubahan_stok_produk`.`produk_id` AS `produk_id`, `riwayat_perubahan_stok_produk`.`varian_produk_id` AS `varian_produk_id`, `riwayat_perubahan_stok_produk`.`lokasi_stok_id` AS `lokasi_stok_id`, `riwayat_perubahan_stok_produk`.`batch_persediaan_id` AS `batch_persediaan_id`, `riwayat_perubahan_stok_produk`.`jenis_mutasi_stok` AS `jenis_mutasi_stok`, `riwayat_perubahan_stok_produk`.`perubahan_kuantitas` AS `perubahan_kuantitas`, `riwayat_perubahan_stok_produk`.`saldo_setelah_mutasi` AS `saldo_setelah_mutasi`, `riwayat_perubahan_stok_produk`.`jenis_referensi` AS `jenis_referensi`, `riwayat_perubahan_stok_produk`.`referensi_id` AS `referensi_id`, `riwayat_perubahan_stok_produk`.`kunci_idempotensi` AS `kunci_idempotensi`, `riwayat_perubahan_stok_produk`.`pelaku_akun_id` AS `pelaku_akun_id`, `riwayat_perubahan_stok_produk`.`disetujui_oleh_akun_id` AS `disetujui_oleh_akun_id`, `riwayat_perubahan_stok_produk`.`alasan_mutasi` AS `alasan_mutasi`, `riwayat_perubahan_stok_produk`.`dibuat_pada` AS `dibuat_pada` FROM `riwayat_perubahan_stok_produk` ;

-- --------------------------------------------------------

--
-- Structure for view `snapshot_produk_pesanan`
--
DROP TABLE IF EXISTS `snapshot_produk_pesanan`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `snapshot_produk_pesanan`  AS SELECT `item_pesanan`.`id` AS `snapshot_produk_pesanan_id`, `item_pesanan`.`pesanan_id` AS `pesanan_id`, `item_pesanan`.`id` AS `item_pesanan_id`, `item_pesanan`.`produk_id` AS `produk_id`, `item_pesanan`.`varian_produk_id` AS `varian_produk_id`, `item_pesanan`.`sku_snapshot` AS `sku_snapshot`, `item_pesanan`.`nama_produk_snapshot` AS `nama_produk_snapshot`, `item_pesanan`.`nama_varian_snapshot` AS `nama_varian_snapshot`, `item_pesanan`.`atribut_varian_snapshot` AS `atribut_varian_snapshot`, `item_pesanan`.`satuan_jual_snapshot` AS `satuan_jual_snapshot`, `item_pesanan`.`jenis_produk_snapshot` AS `jenis_produk_snapshot`, `item_pesanan`.`jenis_penanganan_snapshot` AS `jenis_penanganan_snapshot`, `item_pesanan`.`deskripsi_penting_snapshot` AS `deskripsi_penting_snapshot`, `item_pesanan`.`harga_normal_satuan_snapshot` AS `harga_normal_satuan_snapshot`, `item_pesanan`.`harga_diskon_satuan_snapshot` AS `harga_diskon_satuan_snapshot`, `item_pesanan`.`tambahan_harga_kustomisasi_satuan` AS `tambahan_harga_kustomisasi_satuan`, `item_pesanan`.`harga_satuan_final_snapshot` AS `harga_satuan_final_snapshot`, `item_pesanan`.`berat_satuan_gram_snapshot` AS `berat_satuan_gram_snapshot`, `item_pesanan`.`kuantitas` AS `kuantitas`, `item_pesanan`.`subtotal_baris_rupiah` AS `subtotal_baris_rupiah`, `item_pesanan`.`dibuat_pada` AS `dibuat_pada` FROM `item_pesanan` ;

-- --------------------------------------------------------

--
-- Structure for view `stok_bahan_florist`
--
DROP TABLE IF EXISTS `stok_bahan_florist`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `stok_bahan_florist`  AS SELECT `stok_bahan_produksi`.`id` AS `id`, `stok_bahan_produksi`.`bahan_produksi_id` AS `bahan_produksi_id`, `stok_bahan_produksi`.`lokasi_stok_id` AS `lokasi_stok_id`, `stok_bahan_produksi`.`jumlah_stok_saldo` AS `jumlah_stok_saldo`, `stok_bahan_produksi`.`jumlah_stok_dialokasikan` AS `jumlah_stok_dialokasikan`, `stok_bahan_produksi`.`diperbarui_pada` AS `diperbarui_pada` FROM `stok_bahan_produksi` ;

-- --------------------------------------------------------

--
-- Structure for view `vw_rekomendasi_produk_aktif`
--
DROP TABLE IF EXISTS `vw_rekomendasi_produk_aktif`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_rekomendasi_produk_aktif`  AS SELECT `rrp`.`id` AS `relasi_id`, `rrp`.`produk_sumber_id` AS `produk_sumber_id`, `rrp`.`produk_rekomendasi_id` AS `produk_rekomendasi_id`, `rrp`.`jenis_rekomendasi` AS `jenis_rekomendasi`, `rrp`.`label_alasan_rekomendasi` AS `label_alasan_rekomendasi`, `rrp`.`urutan_tampil` AS `urutan_tampil`, `vrd`.`sku` AS `sku`, `vrd`.`nama_produk` AS `nama_produk`, `vrd`.`slug_produk` AS `slug_produk`, `vrd`.`nama_spesies_tanaman` AS `nama_spesies_tanaman`, `vrd`.`nama_kategori_utama` AS `nama_kategori_utama`, `vrd`.`slug_kategori_utama` AS `slug_kategori_utama`, `vrd`.`jenis_produk` AS `jenis_produk`, `vrd`.`jenis_penanganan` AS `jenis_penanganan`, `vrd`.`satuan_jual` AS `satuan_jual`, `vrd`.`memiliki_varian` AS `memiliki_varian`, `vrd`.`harga_dasar_rupiah` AS `harga_dasar_rupiah`, `vrd`.`harga_diskon_rupiah` AS `harga_diskon_rupiah`, `vrd`.`harga_efektif_rupiah` AS `harga_efektif_rupiah`, `vrd`.`kunci_gambar_utama` AS `kunci_gambar_utama`, `vrd`.`jumlah_stok_jual` AS `jumlah_stok_jual`, `vrd`.`status_ketersediaan_stok` AS `status_ketersediaan_stok`, `vrd`.`jumlah_unit_terjual` AS `jumlah_unit_terjual`, `vrd`.`rata_rata_bintang` AS `rata_rata_bintang`, `vrd`.`jumlah_ulasan_tampil` AS `jumlah_ulasan_tampil` FROM (`relasi_rekomendasi_produk` `rrp` join `vw_ringkasan_detail_produk` `vrd` on((`vrd`.`produk_id` = `rrp`.`produk_rekomendasi_id`))) WHERE ((`rrp`.`status_aktif` = 'AKTIF') AND (`vrd`.`status_produk` = 'AKTIF') AND (`vrd`.`jumlah_stok_jual` > 0)) ;

-- --------------------------------------------------------

--
-- Structure for view `vw_ringkasan_dasbor_admin`
--
DROP TABLE IF EXISTS `vw_ringkasan_dasbor_admin`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_ringkasan_dasbor_admin`  AS SELECT (select count(0) from `pesanan` where (`pesanan`.`status_pesanan` = 'SIAP_DIPROSES')) AS `jumlah_pesanan_siap_diproses`, (select count(0) from `pesanan` where ((`pesanan`.`status_pesanan` in ('SIAP_DIPROSES','SEDANG_DISIAPKAN')) and (`pesanan`.`tanggal_pengiriman` = curdate()))) AS `jumlah_perlu_dikirim_hari_ini`, (select count(0) from `pesanan` where (`pesanan`.`status_pesanan` = 'PERLU_PENANGANAN')) AS `jumlah_pesanan_perlu_penanganan`, (select count(0) from `pesanan` where ((`pesanan`.`status_pembayaran` = 'PERLU_DITINJAU') or (`pesanan`.`kode_perlu_penanganan` in ('PH_02','PH_03')))) AS `jumlah_pembayaran_perlu_ditinjau`, ((select count(0) from `permintaan_pembatalan` where (`permintaan_pembatalan`.`status_permintaan` = 'DIAJUKAN')) + (select count(0) from `pengembalian_dana` where (`pengembalian_dana`.`status_refund` = 'DIAJUKAN'))) AS `jumlah_batal_dan_refund_menunggu`, (select count(0) from `komplain` where (`komplain`.`status_komplain` in ('DIAJUKAN','DALAM_TINJAUAN','DIESKALASI'))) AS `jumlah_komplain_terbuka`, (select count(0) from `produk` where ((`produk`.`status_produk` = 'AKTIF') and (`produk`.`jumlah_stok_jual` <= `produk`.`ambang_stok_rendah`))) AS `jumlah_produk_stok_rendah`, (select count(0) from `pengiriman` where (`pengiriman`.`status_pengiriman` in ('TERKENDALA','DIKEMBALIKAN'))) AS `jumlah_pengiriman_terkendala` ;

-- --------------------------------------------------------

--
-- Structure for view `vw_ringkasan_detail_produk`
--
DROP TABLE IF EXISTS `vw_ringkasan_detail_produk`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_ringkasan_detail_produk`  AS SELECT `p`.`id` AS `produk_id`, `p`.`sku` AS `sku`, `p`.`nama_produk` AS `nama_produk`, `p`.`slug_produk` AS `slug_produk`, `p`.`nama_spesies_tanaman` AS `nama_spesies_tanaman`, `p`.`subjudul_singkat` AS `subjudul_singkat`, `p`.`ringkasan_singkat` AS `ringkasan_singkat`, `p`.`deskripsi_produk` AS `deskripsi_produk`, `p`.`kategori_utama_id` AS `kategori_utama_id`, `kp`.`nama_kategori` AS `nama_kategori_utama`, `kp`.`slug_kategori` AS `slug_kategori_utama`, `p`.`jenis_produk` AS `jenis_produk`, `p`.`jenis_penanganan` AS `jenis_penanganan`, `p`.`satuan_jual` AS `satuan_jual`, `p`.`catatan_kelengkapan_jual` AS `catatan_kelengkapan_jual`, `p`.`memiliki_varian` AS `memiliki_varian`, `p`.`harga_dasar_rupiah` AS `harga_dasar_rupiah`, `p`.`harga_diskon_rupiah` AS `harga_diskon_rupiah`, (case when ((`p`.`harga_diskon_rupiah` is not null) and ((`p`.`waktu_mulai_diskon` is null) or (`p`.`waktu_mulai_diskon` <= utc_timestamp())) and ((`p`.`waktu_selesai_diskon` is null) or (`p`.`waktu_selesai_diskon` >= utc_timestamp()))) then `p`.`harga_diskon_rupiah` else `p`.`harga_dasar_rupiah` end) AS `harga_efektif_rupiah`, (select `gp`.`kunci_penyimpanan_berkas` from `gambar_produk` `gp` where (`gp`.`produk_id` = `p`.`id`) order by `gp`.`status_gambar_utama` desc,`gp`.`urutan_tampil` limit 1) AS `kunci_gambar_utama`, (select count(0) from `gambar_produk` `gp2` where (`gp2`.`produk_id` = `p`.`id`)) AS `jumlah_total_gambar`, (select count(0) from `poin_informasi_produk` `pip` where ((`pip`.`produk_id` = `p`.`id`) and (`pip`.`status_aktif` = 'AKTIF'))) AS `jumlah_poin_accordion`, `p`.`jumlah_stok_jual` AS `jumlah_stok_jual`, `p`.`ambang_stok_rendah` AS `ambang_stok_rendah`, (case when (`p`.`jumlah_stok_jual` <= 0) then 'STOK_HABIS' when (`p`.`jumlah_stok_jual` <= `p`.`ambang_stok_rendah`) then 'STOK_TERBATAS' else 'TERSEDIA' end) AS `status_ketersediaan_stok`, `p`.`jumlah_unit_terjual` AS `jumlah_unit_terjual`, coalesce((select round(avg(`up`.`nilai_bintang`),1) from `ulasan_produk` `up` where ((`up`.`produk_id` = `p`.`id`) and (`up`.`status_tampil` = 'DITAMPILKAN'))),0.0) AS `rata_rata_bintang`, (select count(0) from `ulasan_produk` `up2` where ((`up2`.`produk_id` = `p`.`id`) and (`up2`.`status_tampil` = 'DITAMPILKAN'))) AS `jumlah_ulasan_tampil`, `p`.`status_produk` AS `status_produk` FROM (`produk` `p` join `kategori_produk` `kp` on((`kp`.`id` = `p`.`kategori_utama_id`))) ;

-- --------------------------------------------------------

--
-- Structure for view `vw_stok_tersedia_checkout`
--
DROP TABLE IF EXISTS `vw_stok_tersedia_checkout`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_stok_tersedia_checkout`  AS SELECT `p`.`id` AS `produk_id`, `v`.`id` AS `varian_produk_id`, coalesce(`v`.`sku_varian`,`p`.`sku`) AS `sku_aktif`, `p`.`nama_produk` AS `nama_produk`, `v`.`nama_varian` AS `nama_varian`, coalesce(`v`.`satuan_jual_varian`,`p`.`satuan_jual`) AS `satuan_jual`, `p`.`jenis_produk` AS `jenis_produk`, `p`.`jenis_penanganan` AS `jenis_penanganan`, coalesce(`v`.`jumlah_stok_varian`,`p`.`jumlah_stok_jual`) AS `saldo_stok_buku_besar`, coalesce((select sum(`r`.`kuantitas_direservasi`) from `reservasi_stok_pesanan` `r` where ((`r`.`produk_id` = `p`.`id`) and ((`v`.`id` is null) or (`r`.`varian_produk_id` = `v`.`id`)) and (`r`.`status_reservasi` = 'ACTIVE') and (`r`.`waktu_kedaluwarsa` > utc_timestamp()))),0) AS `jumlah_reservasi_aktif`, greatest(0,(coalesce(`v`.`jumlah_stok_varian`,`p`.`jumlah_stok_jual`) - coalesce((select sum(`r`.`kuantitas_direservasi`) from `reservasi_stok_pesanan` `r` where ((`r`.`produk_id` = `p`.`id`) and ((`v`.`id` is null) or (`r`.`varian_produk_id` = `v`.`id`)) and (`r`.`status_reservasi` = 'ACTIVE') and (`r`.`waktu_kedaluwarsa` > utc_timestamp()))),0))) AS `stok_tersedia_untuk_checkout`, coalesce(`v`.`ambang_stok_rendah`,`p`.`ambang_stok_rendah`) AS `ambang_stok_rendah` FROM (`produk` `p` left join `varian_produk` `v` on(((`v`.`produk_id` = `p`.`id`) and (`v`.`status_varian` = 'AKTIF')))) WHERE (`p`.`status_produk` = 'AKTIF') ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `akun_pengguna`
--
ALTER TABLE `akun_pengguna`
  ADD CONSTRAINT `fk_akun_pengguna_dinonaktifkan_oleh` FOREIGN KEY (`dinonaktifkan_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `alamat_pengguna`
--
ALTER TABLE `alamat_pengguna`
  ADD CONSTRAINT `fk_alamat_pengguna_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `antrean_keluar`
--
ALTER TABLE `antrean_keluar`
  ADD CONSTRAINT `fk_antrean_keluar_penerima` FOREIGN KEY (`akun_penerima_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `batch_persediaan`
--
ALTER TABLE `batch_persediaan`
  ADD CONSTRAINT `fk_batch_persediaan_lokasi` FOREIGN KEY (`lokasi_stok_id`) REFERENCES `lokasi_stok` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_batch_persediaan_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_batch_persediaan_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `catatan_pesanan`
--
ALTER TABLE `catatan_pesanan`
  ADD CONSTRAINT `fk_catatan_pesanan_penulis` FOREIGN KEY (`penulis_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_catatan_pesanan_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `daftar_keinginan`
--
ALTER TABLE `daftar_keinginan`
  ADD CONSTRAINT `fk_daftar_keinginan_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `detail_resep_buket`
--
ALTER TABLE `detail_resep_buket`
  ADD CONSTRAINT `fk_detail_resep_buket_bahan` FOREIGN KEY (`bahan_produksi_id`) REFERENCES `bahan_produksi` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detail_resep_buket_resep` FOREIGN KEY (`resep_buket_id`) REFERENCES `resep_buket` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `foto_komplain`
--
ALTER TABLE `foto_komplain`
  ADD CONSTRAINT `fk_foto_komplain_komplain` FOREIGN KEY (`komplain_id`) REFERENCES `komplain` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `foto_pengiriman`
--
ALTER TABLE `foto_pengiriman`
  ADD CONSTRAINT `fk_foto_pengiriman_pengiriman` FOREIGN KEY (`pengiriman_id`) REFERENCES `pengiriman` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_foto_pengiriman_pengunggah` FOREIGN KEY (`diunggah_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `gambar_produk`
--
ALTER TABLE `gambar_produk`
  ADD CONSTRAINT `fk_gambar_produk_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_gambar_produk_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `identitas_eksternal`
--
ALTER TABLE `identitas_eksternal`
  ADD CONSTRAINT `fk_identitas_eksternal_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `item_daftar_keinginan`
--
ALTER TABLE `item_daftar_keinginan`
  ADD CONSTRAINT `fk_item_daftar_keinginan_daftar` FOREIGN KEY (`daftar_keinginan_id`) REFERENCES `daftar_keinginan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_item_daftar_keinginan_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_item_daftar_keinginan_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `item_keranjang_belanja`
--
ALTER TABLE `item_keranjang_belanja`
  ADD CONSTRAINT `fk_item_keranjang_keranjang` FOREIGN KEY (`keranjang_id`) REFERENCES `keranjang` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_item_keranjang_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_item_keranjang_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `item_pesanan`
--
ALTER TABLE `item_pesanan`
  ADD CONSTRAINT `fk_item_pesanan_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_item_pesanan_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_item_pesanan_substitusi` FOREIGN KEY (`produk_pengganti_substitusi_id`) REFERENCES `produk` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_item_pesanan_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `kategori_pilihan_produk`
--
ALTER TABLE `kategori_pilihan_produk`
  ADD CONSTRAINT `fk_kategori_pilihan_produk_kategori_buket` FOREIGN KEY (`kategori_pilihan_buket_id`) REFERENCES `kategori_pilihan_buket` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kategori_pilihan_produk_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `kategori_produk`
--
ALTER TABLE `kategori_produk`
  ADD CONSTRAINT `fk_kategori_produk_induk` FOREIGN KEY (`kategori_induk_id`) REFERENCES `kategori_produk` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `kebutuhan_bahan_buket_pesanan`
--
ALTER TABLE `kebutuhan_bahan_buket_pesanan`
  ADD CONSTRAINT `fk_kebutuhan_bahan_pesanan_bahan` FOREIGN KEY (`bahan_produksi_id`) REFERENCES `bahan_produksi` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kebutuhan_bahan_pesanan_konfigurasi` FOREIGN KEY (`konfigurasi_buket_pesanan_id`) REFERENCES `konfigurasi_buket_pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kebutuhan_bahan_pesanan_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `kebutuhan_bahan_opsi_buket`
--
ALTER TABLE `kebutuhan_bahan_opsi_buket`
  ADD CONSTRAINT `fk_kebutuhan_bahan_opsi_bahan` FOREIGN KEY (`bahan_produksi_id`) REFERENCES `bahan_produksi` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kebutuhan_bahan_opsi_opsi` FOREIGN KEY (`opsi_pilihan_buket_id`) REFERENCES `opsi_pilihan_buket` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `keranjang`
--
ALTER TABLE `keranjang`
  ADD CONSTRAINT `fk_keranjang_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `kode_verifikasi`
--
ALTER TABLE `kode_verifikasi`
  ADD CONSTRAINT `fk_kode_verifikasi_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `komplain`
--
ALTER TABLE `komplain`
  ADD CONSTRAINT `fk_komplain_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_komplain_item_pesanan` FOREIGN KEY (`item_pesanan_id`) REFERENCES `item_pesanan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_komplain_pemutus_admin` FOREIGN KEY (`diputuskan_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_komplain_pemutus_superadmin` FOREIGN KEY (`pemutus_banding_superadmin_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_komplain_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `komponen_paket_berkebun`
--
ALTER TABLE `komponen_paket_berkebun`
  ADD CONSTRAINT `fk_komponen_paket_produk_komponen` FOREIGN KEY (`produk_komponen_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_komponen_paket_produk_paket` FOREIGN KEY (`produk_paket_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_komponen_paket_varian_komponen` FOREIGN KEY (`varian_komponen_id`) REFERENCES `varian_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `konfigurasi_buket_keranjang`
--
ALTER TABLE `konfigurasi_buket_keranjang`
  ADD CONSTRAINT `fk_konfigurasi_buket_keranjang_item` FOREIGN KEY (`item_keranjang_belanja_id`) REFERENCES `item_keranjang_belanja` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `konfigurasi_buket_pesanan`
--
ALTER TABLE `konfigurasi_buket_pesanan`
  ADD CONSTRAINT `fk_konfigurasi_buket_pesanan_item` FOREIGN KEY (`item_pesanan_id`) REFERENCES `item_pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `log_peristiwa_keamanan`
--
ALTER TABLE `log_peristiwa_keamanan`
  ADD CONSTRAINT `fk_log_peristiwa_keamanan_akun` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `nilai_atribut_produk`
--
ALTER TABLE `nilai_atribut_produk`
  ADD CONSTRAINT `fk_nilai_atribut_produk_atribut` FOREIGN KEY (`atribut_produk_id`) REFERENCES `atribut_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_nilai_atribut_produk_pilihan` FOREIGN KEY (`pilihan_atribut_produk_id`) REFERENCES `pilihan_atribut_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_nilai_atribut_produk_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `nilai_atribut_varian`
--
ALTER TABLE `nilai_atribut_varian`
  ADD CONSTRAINT `fk_nilai_atribut_varian_atribut` FOREIGN KEY (`atribut_produk_id`) REFERENCES `atribut_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_nilai_atribut_varian_pilihan` FOREIGN KEY (`pilihan_atribut_produk_id`) REFERENCES `pilihan_atribut_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_nilai_atribut_varian_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `notifikasi`
--
ALTER TABLE `notifikasi`
  ADD CONSTRAINT `fk_notifikasi_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notifikasi_antrean_keluar` FOREIGN KEY (`antrean_keluar_id`) REFERENCES `antrean_keluar` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `opsi_pilihan_buket`
--
ALTER TABLE `opsi_pilihan_buket`
  ADD CONSTRAINT `fk_opsi_pilihan_buket_kategori` FOREIGN KEY (`kategori_pilihan_buket_id`) REFERENCES `kategori_pilihan_buket` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `pengaturan_sistem`
--
ALTER TABLE `pengaturan_sistem`
  ADD CONSTRAINT `fk_pengaturan_sistem_superadmin` FOREIGN KEY (`diperbarui_oleh_superadmin_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `pengembalian_dana`
--
ALTER TABLE `pengembalian_dana`
  ADD CONSTRAINT `fk_pengembalian_dana_komplain` FOREIGN KEY (`komplain_id`) REFERENCES `komplain` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pengembalian_dana_pengaju` FOREIGN KEY (`diajukan_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pengembalian_dana_penyetuju` FOREIGN KEY (`disetujui_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pengembalian_dana_percobaan` FOREIGN KEY (`percobaan_pembayaran_pesanan_id`) REFERENCES `percobaan_pembayaran_pesanan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pengembalian_dana_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `pengiriman`
--
ALTER TABLE `pengiriman`
  ADD CONSTRAINT `fk_pengiriman_diperiksa_oleh` FOREIGN KEY (`diperiksa_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pengiriman_diserahkan_oleh` FOREIGN KEY (`diserahkan_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pengiriman_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `percobaan_pembayaran_pesanan`
--
ALTER TABLE `percobaan_pembayaran_pesanan`
  ADD CONSTRAINT `fk_percobaan_pembayaran_konfirmasi_cod` FOREIGN KEY (`dikonfirmasi_cod_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_percobaan_pembayaran_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `peristiwa_pembayaran`
--
ALTER TABLE `peristiwa_pembayaran`
  ADD CONSTRAINT `fk_peristiwa_pembayaran_percobaan` FOREIGN KEY (`percobaan_pembayaran_pesanan_id`) REFERENCES `percobaan_pembayaran_pesanan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `peristiwa_pengiriman`
--
ALTER TABLE `peristiwa_pengiriman`
  ADD CONSTRAINT `fk_peristiwa_pengiriman_pelaku` FOREIGN KEY (`pelaku_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_peristiwa_pengiriman_pengiriman` FOREIGN KEY (`pengiriman_id`) REFERENCES `pengiriman` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `permintaan_pembatalan`
--
ALTER TABLE `permintaan_pembatalan`
  ADD CONSTRAINT `fk_permintaan_pembatalan_pemutus` FOREIGN KEY (`diputuskan_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_permintaan_pembatalan_pengaju` FOREIGN KEY (`diajukan_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_permintaan_pembatalan_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `persetujuan_operasi_sensitif`
--
ALTER TABLE `persetujuan_operasi_sensitif`
  ADD CONSTRAINT `fk_persetujuan_sensitif_pengaju` FOREIGN KEY (`pengaju_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_persetujuan_sensitif_penyetuju` FOREIGN KEY (`penyetuju_kedua_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `pesanan`
--
ALTER TABLE `pesanan`
  ADD CONSTRAINT `fk_pesanan_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pesanan_pemilik_penanganan` FOREIGN KEY (`pemilik_penanganan_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `pilihan_atribut_produk`
--
ALTER TABLE `pilihan_atribut_produk`
  ADD CONSTRAINT `fk_pilihan_atribut_atribut` FOREIGN KEY (`atribut_produk_id`) REFERENCES `atribut_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `pilihan_buket_keranjang`
--
ALTER TABLE `pilihan_buket_keranjang`
  ADD CONSTRAINT `fk_pilihan_buket_keranjang_kategori` FOREIGN KEY (`kategori_pilihan_buket_id`) REFERENCES `kategori_pilihan_buket` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pilihan_buket_keranjang_konfigurasi` FOREIGN KEY (`konfigurasi_buket_keranjang_id`) REFERENCES `konfigurasi_buket_keranjang` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pilihan_buket_keranjang_opsi` FOREIGN KEY (`opsi_pilihan_buket_id`) REFERENCES `opsi_pilihan_buket` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `pilihan_buket_pesanan`
--
ALTER TABLE `pilihan_buket_pesanan`
  ADD CONSTRAINT `fk_pilihan_buket_pesanan_kategori` FOREIGN KEY (`kategori_pilihan_buket_id`) REFERENCES `kategori_pilihan_buket` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pilihan_buket_pesanan_konfigurasi` FOREIGN KEY (`konfigurasi_buket_pesanan_id`) REFERENCES `konfigurasi_buket_pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pilihan_buket_pesanan_opsi` FOREIGN KEY (`opsi_pilihan_buket_id`) REFERENCES `opsi_pilihan_buket` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `poin_informasi_produk`
--
ALTER TABLE `poin_informasi_produk`
  ADD CONSTRAINT `fk_poin_informasi_produk_induk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `produk`
--
ALTER TABLE `produk`
  ADD CONSTRAINT `fk_produk_dibuat_oleh` FOREIGN KEY (`dibuat_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_produk_kategori_utama` FOREIGN KEY (`kategori_utama_id`) REFERENCES `kategori_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `produksi_buket_pesanan`
--
ALTER TABLE `produksi_buket_pesanan`
  ADD CONSTRAINT `fk_produksi_buket_item` FOREIGN KEY (`item_pesanan_id`) REFERENCES `item_pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_produksi_buket_konfigurasi` FOREIGN KEY (`konfigurasi_buket_pesanan_id`) REFERENCES `konfigurasi_buket_pesanan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_produksi_buket_lokasi` FOREIGN KEY (`lokasi_stok_id`) REFERENCES `lokasi_stok` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_produksi_buket_perangkai` FOREIGN KEY (`perangkai_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_produksi_buket_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `rekonsiliasi_pembayaran_harian`
--
ALTER TABLE `rekonsiliasi_pembayaran_harian`
  ADD CONSTRAINT `fk_rekonsiliasi_penyetuju_kedua` FOREIGN KEY (`disetujui_kedua_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rekonsiliasi_percobaan` FOREIGN KEY (`percobaan_pembayaran_pesanan_id`) REFERENCES `percobaan_pembayaran_pesanan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rekonsiliasi_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rekonsiliasi_superadmin` FOREIGN KEY (`diselesaikan_oleh_superadmin_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `relasi_produk_kategori`
--
ALTER TABLE `relasi_produk_kategori`
  ADD CONSTRAINT `fk_relasi_produk_kategori_kategori` FOREIGN KEY (`kategori_produk_id`) REFERENCES `kategori_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_relasi_produk_kategori_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `relasi_rekomendasi_produk`
--
ALTER TABLE `relasi_rekomendasi_produk`
  ADD CONSTRAINT `fk_rekomendasi_dibuat_oleh` FOREIGN KEY (`dibuat_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rekomendasi_produk_sumber` FOREIGN KEY (`produk_sumber_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rekomendasi_produk_target` FOREIGN KEY (`produk_rekomendasi_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `resep_buket`
--
ALTER TABLE `resep_buket`
  ADD CONSTRAINT `fk_resep_buket_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_resep_buket_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `reservasi_stok_pesanan`
--
ALTER TABLE `reservasi_stok_pesanan`
  ADD CONSTRAINT `fk_reservasi_stok_item_pesanan` FOREIGN KEY (`item_pesanan_id`) REFERENCES `item_pesanan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reservasi_stok_lokasi` FOREIGN KEY (`lokasi_stok_id`) REFERENCES `lokasi_stok` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reservasi_stok_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reservasi_stok_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reservasi_stok_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `riwayat_perubahan_stok_bahan`
--
ALTER TABLE `riwayat_perubahan_stok_bahan`
  ADD CONSTRAINT `fk_riwayat_stok_bahan_bahan` FOREIGN KEY (`bahan_produksi_id`) REFERENCES `bahan_produksi` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_stok_bahan_lokasi` FOREIGN KEY (`lokasi_stok_id`) REFERENCES `lokasi_stok` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_stok_bahan_pelaku` FOREIGN KEY (`pelaku_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `riwayat_perubahan_stok_produk`
--
ALTER TABLE `riwayat_perubahan_stok_produk`
  ADD CONSTRAINT `fk_riwayat_stok_produk_batch` FOREIGN KEY (`batch_persediaan_id`) REFERENCES `batch_persediaan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_stok_produk_lokasi` FOREIGN KEY (`lokasi_stok_id`) REFERENCES `lokasi_stok` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_stok_produk_pelaku` FOREIGN KEY (`pelaku_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_stok_produk_penyetuju` FOREIGN KEY (`disetujui_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_stok_produk_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_stok_produk_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `riwayat_status_pesanan`
--
ALTER TABLE `riwayat_status_pesanan`
  ADD CONSTRAINT `fk_riwayat_status_pesanan_koreksi` FOREIGN KEY (`referensi_koreksi_riwayat_id`) REFERENCES `riwayat_status_pesanan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_status_pesanan_pelaku` FOREIGN KEY (`pelaku_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_status_pesanan_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `riwayat_status_produksi_buket`
--
ALTER TABLE `riwayat_status_produksi_buket`
  ADD CONSTRAINT `fk_riwayat_status_produksi_induk` FOREIGN KEY (`produksi_buket_pesanan_id`) REFERENCES `produksi_buket_pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_status_produksi_pelaku` FOREIGN KEY (`pelaku_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `sesi_login`
--
ALTER TABLE `sesi_login`
  ADD CONSTRAINT `fk_sesi_login_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `stok_bahan_produksi`
--
ALTER TABLE `stok_bahan_produksi`
  ADD CONSTRAINT `fk_stok_bahan_produksi_bahan` FOREIGN KEY (`bahan_produksi_id`) REFERENCES `bahan_produksi` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_stok_bahan_produksi_lokasi` FOREIGN KEY (`lokasi_stok_id`) REFERENCES `lokasi_stok` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `stok_varian_produk`
--
ALTER TABLE `stok_varian_produk`
  ADD CONSTRAINT `fk_stok_varian_produk_lokasi` FOREIGN KEY (`lokasi_stok_id`) REFERENCES `lokasi_stok` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_stok_varian_produk_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_stok_varian_produk_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `tanggal_tutup`
--
ALTER TABLE `tanggal_tutup`
  ADD CONSTRAINT `fk_tanggal_tutup_ditetapkan_oleh` FOREIGN KEY (`ditetapkan_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `ulasan_produk`
--
ALTER TABLE `ulasan_produk`
  ADD CONSTRAINT `fk_ulasan_produk_akun` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ulasan_produk_item` FOREIGN KEY (`item_pesanan_id`) REFERENCES `item_pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ulasan_produk_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ulasan_produk_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ulasan_produk_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `varian_produk`
--
ALTER TABLE `varian_produk`
  ADD CONSTRAINT `fk_varian_produk_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
