-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 18, 2026 at 02:13 PM
-- Server version: 8.4.3
-- PHP Version: 8.3.33

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
  `id` bigint UNSIGNED NOT NULL,
  `peran` enum('CUSTOMER','ADMIN','SUPERADMIN') NOT NULL DEFAULT 'CUSTOMER',
  `email` varchar(254) NOT NULL,
  `email_normalisasi` varchar(254) NOT NULL,
  `hash_kata_sandi` varchar(255) DEFAULT NULL,
  `status` enum('PENDING_VERIFICATION','ACTIVE','SUSPENDED','ANONYMIZED') NOT NULL DEFAULT 'PENDING_VERIFICATION',
  `nama` varchar(150) NOT NULL,
  `telepon` varchar(30) DEFAULT NULL,
  `rahasia_mfa_terenkripsi` varbinary(512) DEFAULT NULL,
  `mfa_aktif` tinyint(1) NOT NULL DEFAULT '0',
  `versi_persetujuan` varchar(40) DEFAULT NULL,
  `persetujuan_pada` datetime(3) DEFAULT NULL,
  `login_terakhir_pada` datetime(3) DEFAULT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `diperbarui_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `alamat_pengguna`
--

CREATE TABLE `alamat_pengguna` (
  `id` bigint UNSIGNED NOT NULL,
  `akun_pengguna_id` bigint UNSIGNED NOT NULL,
  `label_alamat` varchar(60) DEFAULT NULL,
  `nama_penerima` varchar(150) NOT NULL,
  `telepon` varchar(30) NOT NULL,
  `jalan` varchar(500) NOT NULL,
  `kelurahan` varchar(120) DEFAULT NULL,
  `kecamatan` varchar(120) DEFAULT NULL,
  `kota` varchar(120) NOT NULL,
  `provinsi` varchar(120) NOT NULL,
  `kode_pos` varchar(12) DEFAULT NULL,
  `patokan_lokasi` varchar(255) DEFAULT NULL,
  `lintang` decimal(10,7) DEFAULT NULL,
  `bujur` decimal(10,7) DEFAULT NULL,
  `utama` tinyint(1) NOT NULL DEFAULT '0',
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `diperbarui_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `antrean_keluar`
--

CREATE TABLE `antrean_keluar` (
  `id` bigint UNSIGNED NOT NULL,
  `kunci_peristiwa` varchar(191) NOT NULL,
  `jenis_peristiwa` varchar(100) NOT NULL,
  `aggregate_type` varchar(60) NOT NULL,
  `aggregate_id` bigint UNSIGNED NOT NULL,
  `muatan` json NOT NULL,
  `status` enum('QUEUED','PROCESSING','DONE','FAILED') NOT NULL DEFAULT 'QUEUED',
  `jumlah_percobaan` tinyint UNSIGNED NOT NULL DEFAULT '0',
  `next_attempt_at` datetime(3) DEFAULT NULL,
  `diproses_pada` datetime(3) DEFAULT NULL,
  `kesalahan_terakhir` varchar(1000) DEFAULT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bahan_produksi`
--

CREATE TABLE `bahan_produksi` (
  `id` bigint UNSIGNED NOT NULL,
  `kode_bahan` varchar(80) NOT NULL,
  `nama` varchar(180) NOT NULL,
  `satuan` enum('TANGKAI','LEMBAR','METER','PCS','PAKET') NOT NULL DEFAULT 'PCS',
  `stok_fisik` decimal(12,3) NOT NULL DEFAULT '0.000',
  `stok_dipesan` decimal(12,3) NOT NULL DEFAULT '0.000',
  `batas_stok_minimum` decimal(12,3) NOT NULL DEFAULT '0.000',
  `biaya_satuan` bigint UNSIGNED NOT NULL DEFAULT '0',
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `diperbarui_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `catatan_pesanan`
--

CREATE TABLE `catatan_pesanan` (
  `id` bigint UNSIGNED NOT NULL,
  `pesanan_id` bigint UNSIGNED NOT NULL,
  `penulis_id` bigint UNSIGNED DEFAULT NULL,
  `kind` enum('INTERNAL','PERSETUJUAN_PELANGGAN') NOT NULL,
  `isi` text NOT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `daftar_keinginan`
--

CREATE TABLE `daftar_keinginan` (
  `id` bigint UNSIGNED NOT NULL,
  `akun_pengguna_id` bigint UNSIGNED NOT NULL,
  `nama` varchar(100) NOT NULL DEFAULT 'Favorit',
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `foto_komplain`
--

CREATE TABLE `foto_komplain` (
  `id` bigint UNSIGNED NOT NULL,
  `komplain_id` bigint UNSIGNED NOT NULL,
  `kunci_penyimpanan` varchar(512) NOT NULL,
  `uploaded_by` bigint UNSIGNED DEFAULT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `foto_pengiriman`
--

CREATE TABLE `foto_pengiriman` (
  `id` bigint UNSIGNED NOT NULL,
  `pengiriman_id` bigint UNSIGNED NOT NULL,
  `kunci_penyimpanan` varchar(512) NOT NULL,
  `photo_type` enum('SERAH_TERIMA','BUKTI_TERKIRIM','KONDISI_KENDALA','RETUR') NOT NULL,
  `uploaded_by` bigint UNSIGNED DEFAULT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gambar_produk`
--

CREATE TABLE `gambar_produk` (
  `id` bigint UNSIGNED NOT NULL,
  `produk_id` bigint UNSIGNED NOT NULL,
  `kunci_penyimpanan` varchar(512) NOT NULL,
  `teks_alternatif` varchar(255) DEFAULT NULL,
  `urutan_tampil` int NOT NULL DEFAULT '0',
  `utama` tinyint(1) NOT NULL DEFAULT '0',
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `identitas_eksternal`
--

CREATE TABLE `identitas_eksternal` (
  `id` bigint UNSIGNED NOT NULL,
  `akun_pengguna_id` bigint UNSIGNED NOT NULL,
  `penyedia` enum('GOOGLE') NOT NULL,
  `subjek_penyedia` varchar(191) NOT NULL,
  `email_penyedia` varchar(254) DEFAULT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `item_daftar_keinginan`
--

CREATE TABLE `item_daftar_keinginan` (
  `id` bigint UNSIGNED NOT NULL,
  `daftar_keinginan_id` bigint UNSIGNED NOT NULL,
  `produk_id` bigint UNSIGNED NOT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `item_keranjang_belanja`
--

CREATE TABLE `item_keranjang_belanja` (
  `id` bigint UNSIGNED NOT NULL,
  `keranjang_id` bigint UNSIGNED NOT NULL,
  `produk_id` bigint UNSIGNED NOT NULL,
  `jumlah` int UNSIGNED NOT NULL,
  `ditambahkan_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `diperbarui_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `item_pesanan`
--

CREATE TABLE `item_pesanan` (
  `id` bigint UNSIGNED NOT NULL,
  `pesanan_id` bigint UNSIGNED NOT NULL,
  `produk_id` bigint UNSIGNED DEFAULT NULL,
  `snapshot_kode_sku` varchar(80) NOT NULL,
  `snapshot_nama_produk` varchar(180) NOT NULL,
  `snapshot_harga_satuan` bigint UNSIGNED NOT NULL,
  `jenis_penanganan` enum('MUDAH_LAYU','TAHAN_LAMA') NOT NULL,
  `jumlah` int UNSIGNED NOT NULL,
  `total_baris` bigint UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kategori`
--

CREATE TABLE `kategori` (
  `id` bigint UNSIGNED NOT NULL,
  `induk_id` bigint UNSIGNED DEFAULT NULL,
  `nama` varchar(120) NOT NULL,
  `slug` varchar(140) NOT NULL,
  `deskripsi` text,
  `urutan_tampil` int NOT NULL DEFAULT '0',
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `diperbarui_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kategori_pilihan_buket`
--

CREATE TABLE `kategori_pilihan_buket` (
  `id` bigint UNSIGNED NOT NULL,
  `kode` varchar(60) NOT NULL,
  `nama` varchar(120) NOT NULL,
  `deskripsi` varchar(500) DEFAULT NULL,
  `wajib_dipilih` tinyint(1) NOT NULL DEFAULT '0',
  `pilihan_minimum` smallint UNSIGNED NOT NULL DEFAULT '0',
  `pilihan_maksimum` smallint UNSIGNED NOT NULL DEFAULT '1',
  `urutan_tampil` int NOT NULL DEFAULT '0',
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `diperbarui_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `kategori_pilihan_buket`
--

INSERT INTO `kategori_pilihan_buket` (`id`, `kode`, `nama`, `deskripsi`, `wajib_dipilih`, `pilihan_minimum`, `pilihan_maksimum`, `urutan_tampil`, `aktif`, `dibuat_pada`, `diperbarui_pada`) VALUES
(1, 'UKURAN', 'Ukuran buket', 'Ukuran atau paket dasar buket', 1, 1, 1, 1, 1, '2026-10-18 20:51:39.221', '2026-10-18 20:51:39.221'),
(2, 'JENIS_BUNGA', 'Jenis bunga', 'Jenis bunga yang digunakan', 1, 1, 10, 2, 1, '2026-10-18 20:51:39.221', '2026-10-18 20:51:39.221'),
(3, 'WARNA_BUNGA', 'Warna bunga', 'Warna bunga yang dipilih', 0, 0, 10, 3, 1, '2026-10-18 20:51:39.221', '2026-10-18 20:51:39.221'),
(4, 'PEMBUNGKUS', 'Pembungkus', 'Jenis dan warna pembungkus', 1, 1, 1, 4, 1, '2026-10-18 20:51:39.221', '2026-10-18 20:51:39.221'),
(5, 'PITA', 'Pita', 'Jenis atau warna pita', 0, 0, 1, 5, 1, '2026-10-18 20:51:39.221', '2026-10-18 20:51:39.221'),
(6, 'DESAIN', 'Desain rangkaian', 'Gaya susunan buket', 1, 1, 1, 6, 1, '2026-10-18 20:51:39.221', '2026-10-18 20:51:39.221'),
(7, 'KARTU_UCAPAN', 'Kartu ucapan', 'Pilihan kartu ucapan', 0, 0, 1, 7, 1, '2026-10-18 20:51:39.221', '2026-10-18 20:51:39.221');

-- --------------------------------------------------------

--
-- Table structure for table `kategori_pilihan_produk`
--

CREATE TABLE `kategori_pilihan_produk` (
  `produk_id` bigint UNSIGNED NOT NULL,
  `kategori_pilihan_buket_id` bigint UNSIGNED NOT NULL,
  `urutan_tampil` int NOT NULL DEFAULT '0',
  `wajib` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kebutuhan_bahan_buket_pesanan`
--

CREATE TABLE `kebutuhan_bahan_buket_pesanan` (
  `id` bigint UNSIGNED NOT NULL,
  `item_pesanan_id` bigint UNSIGNED NOT NULL,
  `bahan_produksi_id` bigint UNSIGNED DEFAULT NULL,
  `snapshot_kode_bahan` varchar(80) NOT NULL,
  `snapshot_nama_bahan` varchar(180) NOT NULL,
  `jumlah_dibutuhkan` decimal(12,3) NOT NULL,
  `biaya_satuan_snapshot` bigint UNSIGNED NOT NULL DEFAULT '0',
  `status` enum('BELUM_DIALOKASIKAN','DIALOKASIKAN','DIGUNAKAN','DILEPAS') NOT NULL DEFAULT 'BELUM_DIALOKASIKAN'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kebutuhan_bahan_opsi_buket`
--

CREATE TABLE `kebutuhan_bahan_opsi_buket` (
  `opsi_pilihan_buket_id` bigint UNSIGNED NOT NULL,
  `bahan_produksi_id` bigint UNSIGNED NOT NULL,
  `jumlah_per_opsi` decimal(12,3) NOT NULL DEFAULT '1.000'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `keranjang`
--

CREATE TABLE `keranjang` (
  `id` bigint UNSIGNED NOT NULL,
  `akun_pengguna_id` bigint UNSIGNED DEFAULT NULL,
  `hash_token_tamu` char(64) DEFAULT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `diperbarui_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kode_verifikasi`
--

CREATE TABLE `kode_verifikasi` (
  `id` bigint UNSIGNED NOT NULL,
  `akun_pengguna_id` bigint UNSIGNED DEFAULT NULL,
  `email_normalisasi` varchar(254) DEFAULT NULL,
  `tujuan` enum('VERIFY_EMAIL','RESET_PASSWORD','LINK_GOOGLE') NOT NULL,
  `hash_kode` varchar(255) NOT NULL,
  `kedaluwarsa_pada` datetime(3) NOT NULL,
  `jumlah_percobaan` smallint UNSIGNED NOT NULL DEFAULT '0',
  `digunakan_pada` datetime(3) DEFAULT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `komplain`
--

CREATE TABLE `komplain` (
  `id` bigint UNSIGNED NOT NULL,
  `pesanan_id` bigint UNSIGNED NOT NULL,
  `category` enum('KUALITAS_PRODUK','PENGIRIMAN','BARANG_KURANG','BARANG_RUSAK','LAINNYA') NOT NULL,
  `deskripsi` text NOT NULL,
  `status` enum('DIAJUKAN','DITINJAU','MENUNGGU_PELANGGAN','DISELESAIKAN','DITOLAK','BANDING') NOT NULL DEFAULT 'DIAJUKAN',
  `resolution` text,
  `diputuskan_oleh` bigint UNSIGNED DEFAULT NULL,
  `jumlah_banding` tinyint UNSIGNED NOT NULL DEFAULT '0',
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `diperbarui_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `resolved_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `konfigurasi_buket_keranjang`
--

CREATE TABLE `konfigurasi_buket_keranjang` (
  `id` bigint UNSIGNED NOT NULL,
  `item_keranjang_belanja_id` bigint UNSIGNED NOT NULL,
  `harga_dasar_snapshot` bigint UNSIGNED NOT NULL,
  `biaya_kustomisasi_snapshot` bigint UNSIGNED NOT NULL DEFAULT '0',
  `total_harga_satuan_snapshot` bigint UNSIGNED NOT NULL,
  `catatan_rangkaian` varchar(1000) DEFAULT NULL,
  `nama_penerima_kartu` varchar(150) DEFAULT NULL,
  `pesan_kartu` varchar(1000) DEFAULT NULL,
  `konfigurasi_json` json NOT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `diperbarui_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `konfigurasi_buket_pesanan`
--

CREATE TABLE `konfigurasi_buket_pesanan` (
  `id` bigint UNSIGNED NOT NULL,
  `item_pesanan_id` bigint UNSIGNED NOT NULL,
  `harga_dasar_snapshot` bigint UNSIGNED NOT NULL,
  `biaya_kustomisasi_snapshot` bigint UNSIGNED NOT NULL DEFAULT '0',
  `total_harga_satuan_snapshot` bigint UNSIGNED NOT NULL,
  `catatan_rangkaian` varchar(1000) DEFAULT NULL,
  `nama_penerima_kartu` varchar(150) DEFAULT NULL,
  `pesan_kartu` varchar(1000) DEFAULT NULL,
  `konfigurasi_json` json NOT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `log_audit`
--

CREATE TABLE `log_audit` (
  `id` bigint UNSIGNED NOT NULL,
  `at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `jenis_aktor` enum('CUSTOMER','ADMIN','SUPERADMIN','SYSTEM','GATEWAY','COURIER') NOT NULL,
  `aktor_id` bigint UNSIGNED DEFAULT NULL,
  `peran` varchar(30) DEFAULT NULL,
  `aksi` varchar(100) NOT NULL,
  `jenis_objek` varchar(80) NOT NULL,
  `objek_id` varchar(100) DEFAULT NULL,
  `data_sebelum` json DEFAULT NULL,
  `data_sesudah` json DEFAULT NULL,
  `result` enum('SUCCESS','DENIED','FAILED') NOT NULL,
  `alamat_ip` varbinary(16) DEFAULT NULL,
  `prev_hash` binary(32) DEFAULT NULL,
  `row_hash` binary(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifikasi`
--

CREATE TABLE `notifikasi` (
  `id` bigint UNSIGNED NOT NULL,
  `akun_pengguna_id` bigint UNSIGNED DEFAULT NULL,
  `template_code` varchar(20) NOT NULL,
  `recipient` varchar(254) NOT NULL,
  `kanal` enum('EMAIL','WHATSAPP','SMS','IN_APP') NOT NULL,
  `muatan` json NOT NULL,
  `status` enum('QUEUED','SENDING','SENT','FAILED','CANCELLED') NOT NULL DEFAULT 'QUEUED',
  `jumlah_percobaan` tinyint UNSIGNED NOT NULL DEFAULT '0',
  `next_attempt_at` datetime(3) DEFAULT NULL,
  `dikirim_pada` datetime(3) DEFAULT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `opsi_pilihan_buket`
--

CREATE TABLE `opsi_pilihan_buket` (
  `id` bigint UNSIGNED NOT NULL,
  `kategori_pilihan_buket_id` bigint UNSIGNED NOT NULL,
  `kode` varchar(80) NOT NULL,
  `nama` varchar(150) NOT NULL,
  `deskripsi` varchar(500) DEFAULT NULL,
  `biaya_tambahan` bigint UNSIGNED NOT NULL DEFAULT '0',
  `warna_hex` char(7) DEFAULT NULL,
  `kunci_gambar` varchar(512) DEFAULT NULL,
  `urutan_tampil` int NOT NULL DEFAULT '0',
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `diperbarui_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pengaturan_sistem`
--

CREATE TABLE `pengaturan_sistem` (
  `setting_key` varchar(120) NOT NULL,
  `value_json` json NOT NULL,
  `diperbarui_oleh` bigint UNSIGNED DEFAULT NULL,
  `diperbarui_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pengembalian_dana`
--

CREATE TABLE `pengembalian_dana` (
  `id` bigint UNSIGNED NOT NULL,
  `pesanan_id` bigint UNSIGNED NOT NULL,
  `percobaan_pembayaran_pesanan_id` bigint UNSIGNED DEFAULT NULL,
  `penyebab` enum('PEMBATALAN','PEMBAYARAN_TERLAMBAT','STOK_TIDAK_CUKUP','KOMPLAIN','PENGIRIMAN_GAGAL','PEMBAYARAN_GANDA','SELISIH_NOMINAL','LAINNYA') NOT NULL,
  `nominal_produk` bigint UNSIGNED NOT NULL DEFAULT '0',
  `nominal_pengiriman` bigint UNSIGNED NOT NULL DEFAULT '0',
  `status` enum('DIAJUKAN','MENUNGGU_PERSETUJUAN','DISETUJUI','DIPROSES','BERHASIL','GAGAL','DITOLAK') NOT NULL DEFAULT 'DIAJUKAN',
  `diminta_oleh` bigint UNSIGNED DEFAULT NULL,
  `disetujui_oleh` bigint UNSIGNED DEFAULT NULL,
  `dasar_persetujuan` varchar(500) DEFAULT NULL,
  `method` enum('GATEWAY','TRANSFER_MANUAL','COD_CASH_RETURN') NOT NULL,
  `referensi_gateway` varchar(191) DEFAULT NULL,
  `info_bank_terenkripsi` varbinary(2048) DEFAULT NULL,
  `info_bank_dihapus_pada` datetime(3) DEFAULT NULL,
  `jumlah_percobaan` tinyint UNSIGNED NOT NULL DEFAULT '0',
  `kunci_idempotensi` varchar(191) NOT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `diperbarui_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `diselesaikan_pada` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pengiriman`
--

CREATE TABLE `pengiriman` (
  `id` bigint UNSIGNED NOT NULL,
  `pesanan_id` bigint UNSIGNED NOT NULL,
  `kode_kurir` varchar(80) NOT NULL,
  `nama_layanan` varchar(120) NOT NULL,
  `tracking_ref` varchar(191) DEFAULT NULL,
  `status` enum('BELUM_DISERAHKAN','DALAM_PENGIRIMAN','TERKENDALA','TERKIRIM','DIKEMBALIKAN') NOT NULL DEFAULT 'BELUM_DISERAHKAN',
  `masalah` enum('ALAMAT_TIDAK_DITEMUKAN','PENERIMA_TIDAK_ADA','KURIR_GAGAL','BARANG_RUSAK','BARANG_HILANG') DEFAULT NULL,
  `diserahkan_pada` datetime(3) DEFAULT NULL,
  `kunci_foto_serah_terima` varchar(512) DEFAULT NULL,
  `diterima_pada` datetime(3) DEFAULT NULL,
  `kunci_bukti_penerimaan` varchar(512) DEFAULT NULL,
  `receiver_name` varchar(150) DEFAULT NULL,
  `return_checked_at` datetime(3) DEFAULT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `diperbarui_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `percobaan_pembayaran_pesanan`
--

CREATE TABLE `percobaan_pembayaran_pesanan` (
  `id` bigint UNSIGNED NOT NULL,
  `pesanan_id` bigint UNSIGNED NOT NULL,
  `method` enum('QRIS','E_WALLET','VIRTUAL_ACCOUNT','TRANSFER','COD') NOT NULL,
  `id_transaksi_gateway` varchar(191) DEFAULT NULL,
  `referensi_gateway` varchar(191) DEFAULT NULL,
  `nominal` bigint UNSIGNED NOT NULL,
  `status` enum('DIBUAT','MENUNGGU','BERHASIL','GAGAL','KEDALUWARSA','DIBATALKAN','PERLU_DITINJAU') NOT NULL DEFAULT 'DIBUAT',
  `kedaluwarsa_pada` datetime(3) DEFAULT NULL,
  `raw_payload` json DEFAULT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `diperbarui_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `succeeded_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `peristiwa_pembayaran`
--

CREATE TABLE `peristiwa_pembayaran` (
  `id` bigint UNSIGNED NOT NULL,
  `percobaan_pembayaran_pesanan_id` bigint UNSIGNED DEFAULT NULL,
  `id_transaksi_gateway` varchar(191) NOT NULL,
  `jenis_peristiwa` varchar(100) NOT NULL,
  `received_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `raw_body` json DEFAULT NULL,
  `signature_ok` tinyint(1) NOT NULL DEFAULT '0',
  `diproses_pada` datetime(3) DEFAULT NULL,
  `processing_result` varchar(80) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `peristiwa_pengiriman`
--

CREATE TABLE `peristiwa_pengiriman` (
  `id` bigint UNSIGNED NOT NULL,
  `pengiriman_id` bigint UNSIGNED NOT NULL,
  `event_code` varchar(100) NOT NULL,
  `deskripsi` varchar(500) DEFAULT NULL,
  `peristiwa_pada` datetime(3) NOT NULL,
  `source` enum('COURIER_WEBHOOK','COURIER_POLL','ADMIN') NOT NULL,
  `raw_payload` json DEFAULT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permintaan_pembatalan`
--

CREATE TABLE `permintaan_pembatalan` (
  `id` bigint UNSIGNED NOT NULL,
  `pesanan_id` bigint UNSIGNED NOT NULL,
  `diminta_oleh` bigint UNSIGNED DEFAULT NULL,
  `alasan` varchar(500) NOT NULL,
  `status` enum('DIAJUKAN','DISETUJUI','DITOLAK','DIBATALKAN') NOT NULL DEFAULT 'DIAJUKAN',
  `diputuskan_oleh` bigint UNSIGNED DEFAULT NULL,
  `diputuskan_pada` datetime(3) DEFAULT NULL,
  `alasan_keputusan` varchar(500) DEFAULT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pesanan`
--

CREATE TABLE `pesanan` (
  `id` bigint UNSIGNED NOT NULL,
  `nomor_pesanan` varchar(40) NOT NULL,
  `akun_pengguna_id` bigint UNSIGNED DEFAULT NULL,
  `email_tamu` varchar(254) DEFAULT NULL,
  `telepon_tamu` varchar(30) DEFAULT NULL,
  `status_pesanan` enum('MENUNGGU_PEMBAYARAN','SIAP_DIPROSES','SEDANG_DISIAPKAN','DIKIRIM','TERKIRIM','SELESAI','DIBATALKAN','PERLU_PENANGANAN') NOT NULL,
  `alasan_pembatalan` enum('KEDALUWARSA','PELANGGAN','ADMIN','TOKO') DEFAULT NULL,
  `ph_code` enum('PH_01','PH_02','PH_03','PH_04','PH_05','PH_06','PH_07') DEFAULT NULL,
  `ph_prev_status` varchar(40) DEFAULT NULL,
  `ph_owner_id` bigint UNSIGNED DEFAULT NULL,
  `ph_deadline` datetime(3) DEFAULT NULL,
  `status_pembayaran` enum('MENUNGGU','BERHASIL','PERLU_DITINJAU','GAGAL','KEDALUWARSA','DIBATALKAN','REFUND_DIPROSES','DIKEMBALIKAN_SEBAGIAN','DIKEMBALIKAN_PENUH') NOT NULL DEFAULT 'MENUNGGU',
  `metode_pembayaran` enum('QRIS','E_WALLET','VIRTUAL_ACCOUNT','TRANSFER','COD') NOT NULL,
  `snapshot_alamat` json NOT NULL,
  `tanggal_pengiriman` date NOT NULL,
  `slot_pengiriman_id` bigint UNSIGNED DEFAULT NULL,
  `snapshot_slot_pengiriman` varchar(120) DEFAULT NULL,
  `kode_kurir` varchar(80) DEFAULT NULL,
  `layanan_kurir` varchar(120) DEFAULT NULL,
  `referensi_tarif_kurir` varchar(191) DEFAULT NULL,
  `subtotal` bigint UNSIGNED NOT NULL,
  `biaya_pengiriman` bigint UNSIGNED NOT NULL DEFAULT '0',
  `total` bigint UNSIGNED NOT NULL,
  `kedaluwarsa_pada` datetime(3) DEFAULT NULL,
  `pesan_kartu` varchar(1000) DEFAULT NULL,
  `pengirim_kartu` varchar(150) DEFAULT NULL,
  `versi_kebijakan_pelanggan` varchar(40) DEFAULT NULL,
  `versi` int UNSIGNED NOT NULL DEFAULT '1',
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `diperbarui_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `dibayar_pada` datetime(3) DEFAULT NULL,
  `disiapkan_pada` datetime(3) DEFAULT NULL,
  `dikirim_pada` datetime(3) DEFAULT NULL,
  `diterima_pada` datetime(3) DEFAULT NULL,
  `diselesaikan_pada` datetime(3) DEFAULT NULL,
  `dibatalkan_pada` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pilihan_buket_keranjang`
--

CREATE TABLE `pilihan_buket_keranjang` (
  `id` bigint UNSIGNED NOT NULL,
  `konfigurasi_buket_keranjang_id` bigint UNSIGNED NOT NULL,
  `opsi_pilihan_buket_id` bigint UNSIGNED DEFAULT NULL,
  `snapshot_kode_opsi` varchar(80) NOT NULL,
  `snapshot_nama_kelompok` varchar(120) NOT NULL,
  `snapshot_nama_opsi` varchar(150) NOT NULL,
  `jumlah_pilihan` decimal(12,3) NOT NULL DEFAULT '1.000',
  `biaya_tambahan_snapshot` bigint UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pilihan_buket_pesanan`
--

CREATE TABLE `pilihan_buket_pesanan` (
  `id` bigint UNSIGNED NOT NULL,
  `konfigurasi_buket_pesanan_id` bigint UNSIGNED NOT NULL,
  `opsi_pilihan_buket_id` bigint UNSIGNED DEFAULT NULL,
  `snapshot_kode_opsi` varchar(80) NOT NULL,
  `snapshot_nama_kelompok` varchar(120) NOT NULL,
  `snapshot_nama_opsi` varchar(150) NOT NULL,
  `jumlah_pilihan` decimal(12,3) NOT NULL DEFAULT '1.000',
  `biaya_tambahan_snapshot` bigint UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `produk`
--

CREATE TABLE `produk` (
  `id` bigint UNSIGNED NOT NULL,
  `kategori_id` bigint UNSIGNED DEFAULT NULL,
  `kode_sku` varchar(80) NOT NULL,
  `nama` varchar(180) NOT NULL,
  `jenis_produk` enum('STANDAR','BUKET_KUSTOM') NOT NULL DEFAULT 'STANDAR',
  `slug` varchar(200) NOT NULL,
  `merek` varchar(120) DEFAULT NULL,
  `bahan` varchar(180) DEFAULT NULL,
  `deskripsi` text,
  `harga` bigint UNSIGNED NOT NULL,
  `harga_promo` bigint UNSIGNED DEFAULT NULL,
  `mulai_promo_pada` datetime(3) DEFAULT NULL,
  `akhir_promo_pada` datetime(3) DEFAULT NULL,
  `berat_gram` int UNSIGNED DEFAULT NULL,
  `panjang_mm` int UNSIGNED DEFAULT NULL,
  `lebar_mm` int UNSIGNED DEFAULT NULL,
  `tinggi_mm` int UNSIGNED DEFAULT NULL,
  `jenis_penanganan` enum('MUDAH_LAYU','TAHAN_LAMA') NOT NULL DEFAULT 'TAHAN_LAMA',
  `status` enum('DRAFT','ACTIVE','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `jumlah_stok` int UNSIGNED NOT NULL DEFAULT '0',
  `jumlah_terjual` bigint UNSIGNED NOT NULL DEFAULT '0',
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `diperbarui_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `produksi_buket_pesanan`
--

CREATE TABLE `produksi_buket_pesanan` (
  `id` bigint UNSIGNED NOT NULL,
  `item_pesanan_id` bigint UNSIGNED NOT NULL,
  `status_produksi` enum('MENUNGGU','PERLU_KONFIRMASI_BAHAN','ANTRE','DIRANGKAI','PEMERIKSAAN_MUTU','SIAP_DIKEMAS','SELESAI','TERHAMBAT','DIBATALKAN') NOT NULL DEFAULT 'MENUNGGU',
  `prioritas` enum('RENDAH','NORMAL','TINGGI','MENDESAK') NOT NULL DEFAULT 'NORMAL',
  `tenggat_produksi` datetime(3) DEFAULT NULL,
  `perangkai_id` bigint UNSIGNED DEFAULT NULL,
  `catatan_produksi` varchar(1000) DEFAULT NULL,
  `mulai_pada` datetime(3) DEFAULT NULL,
  `selesai_pada` datetime(3) DEFAULT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `diperbarui_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reservasi_stok_pesanan`
--

CREATE TABLE `reservasi_stok_pesanan` (
  `id` bigint UNSIGNED NOT NULL,
  `pesanan_id` bigint UNSIGNED NOT NULL,
  `produk_id` bigint UNSIGNED NOT NULL,
  `kuantitas` int UNSIGNED NOT NULL,
  `status` enum('ACTIVE','COMMITTED','EXPIRED','RELEASED') NOT NULL DEFAULT 'ACTIVE',
  `direservasi_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `kedaluwarsa_pada` datetime(3) DEFAULT NULL,
  `dikomit_pada` datetime(3) DEFAULT NULL,
  `dilepas_pada` datetime(3) DEFAULT NULL,
  `alasan_pelepasan` varchar(255) DEFAULT NULL,
  `kunci_idempotensi` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `riwayat_perubahan_stok_bahan`
--

CREATE TABLE `riwayat_perubahan_stok_bahan` (
  `id` bigint UNSIGNED NOT NULL,
  `bahan_produksi_id` bigint UNSIGNED NOT NULL,
  `jenis_catatan` enum('STOK_AWAL','RESERVASI','KOMIT','PELEPASAN','RESTOK','PENYESUAIAN','RUSAK','DIGUNAKAN') NOT NULL,
  `perubahan_jumlah` decimal(12,3) NOT NULL,
  `jenis_referensi` varchar(40) DEFAULT NULL,
  `referensi_id` bigint UNSIGNED DEFAULT NULL,
  `aktor_id` bigint UNSIGNED DEFAULT NULL,
  `alasan` varchar(255) NOT NULL,
  `kunci_idempotensi` varchar(191) DEFAULT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `riwayat_perubahan_stok_produk`
--

CREATE TABLE `riwayat_perubahan_stok_produk` (
  `id` bigint UNSIGNED NOT NULL,
  `produk_id` bigint UNSIGNED NOT NULL,
  `jenis_catatan` enum('INITIAL','RESERVE','COMMIT','RELEASE','RESTOCK','ADJUSTMENT','RETURN','DAMAGE') NOT NULL,
  `perubahan_jumlah` int NOT NULL,
  `jenis_referensi` varchar(40) DEFAULT NULL,
  `referensi_id` bigint UNSIGNED DEFAULT NULL,
  `aktor_id` bigint UNSIGNED DEFAULT NULL,
  `alasan` varchar(255) NOT NULL,
  `kunci_idempotensi` varchar(191) DEFAULT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `riwayat_status_pesanan`
--

CREATE TABLE `riwayat_status_pesanan` (
  `id` bigint UNSIGNED NOT NULL,
  `pesanan_id` bigint UNSIGNED NOT NULL,
  `status_awal` varchar(40) DEFAULT NULL,
  `status_tujuan` varchar(40) NOT NULL,
  `transition_id` varchar(20) DEFAULT NULL,
  `jenis_aktor` enum('CUSTOMER','ADMIN','SUPERADMIN','SYSTEM','COURIER','GATEWAY') NOT NULL,
  `aktor_id` bigint UNSIGNED DEFAULT NULL,
  `alasan` varchar(500) DEFAULT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `riwayat_status_produksi_buket`
--

CREATE TABLE `riwayat_status_produksi_buket` (
  `id` bigint UNSIGNED NOT NULL,
  `produksi_buket_id` bigint UNSIGNED NOT NULL,
  `status_awal` varchar(40) DEFAULT NULL,
  `status_tujuan` varchar(40) NOT NULL,
  `aktor_id` bigint UNSIGNED DEFAULT NULL,
  `catatan` varchar(500) DEFAULT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sesi_login`
--

CREATE TABLE `sesi_login` (
  `id` char(64) NOT NULL,
  `akun_pengguna_id` bigint UNSIGNED NOT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `last_seen_at` datetime(3) DEFAULT NULL,
  `kedaluwarsa_pada` datetime(3) NOT NULL,
  `alamat_ip` varbinary(16) DEFAULT NULL,
  `agen_pengguna` varchar(512) DEFAULT NULL,
  `revoked_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `slot_pengiriman`
--

CREATE TABLE `slot_pengiriman` (
  `id` bigint UNSIGNED NOT NULL,
  `kode_slot` varchar(60) NOT NULL,
  `label_alamat` varchar(120) NOT NULL,
  `waktu_mulai` time NOT NULL,
  `waktu_selesai` time NOT NULL,
  `kapasitas` int UNSIGNED DEFAULT NULL,
  `aktif` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tanggal_tutup`
--

CREATE TABLE `tanggal_tutup` (
  `tanggal_tutup` date NOT NULL,
  `catatan` varchar(255) DEFAULT NULL,
  `dibuat_oleh` bigint UNSIGNED DEFAULT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ulasan_produk`
--

CREATE TABLE `ulasan_produk` (
  `id` bigint UNSIGNED NOT NULL,
  `produk_id` bigint UNSIGNED NOT NULL,
  `akun_pengguna_id` bigint UNSIGNED NOT NULL,
  `item_pesanan_id` bigint UNSIGNED DEFAULT NULL,
  `peringkat` tinyint UNSIGNED NOT NULL,
  `judul` varchar(150) DEFAULT NULL,
  `isi` text,
  `status` enum('PENDING','PUBLISHED','HIDDEN','REJECTED') NOT NULL DEFAULT 'PENDING',
  `dimoderasi_oleh` bigint UNSIGNED DEFAULT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `dimoderasi_pada` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `zona_layanan_kurir`
--

CREATE TABLE `zona_layanan_kurir` (
  `id` bigint UNSIGNED NOT NULL,
  `kode_kurir` varchar(80) NOT NULL,
  `kode_layanan` varchar(80) NOT NULL,
  `nama_layanan` varchar(120) NOT NULL,
  `provinsi` varchar(120) DEFAULT NULL,
  `kota` varchar(120) NOT NULL,
  `kecamatan` varchar(120) DEFAULT NULL,
  `jenis_penanganan` enum('MUDAH_LAYU','TAHAN_LAMA','SEMUA') NOT NULL DEFAULT 'SEMUA',
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `berlaku_mulai` datetime(3) DEFAULT NULL,
  `berlaku_sampai` datetime(3) DEFAULT NULL,
  `dibuat_pada` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `akun_pengguna`
--
ALTER TABLE `akun_pengguna`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_pengguna_email_normalized` (`email_normalisasi`),
  ADD KEY `ix_pengguna_status_role` (`status`,`peran`);

--
-- Indexes for table `alamat_pengguna`
--
ALTER TABLE `alamat_pengguna`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_alamat_user` (`akun_pengguna_id`);

--
-- Indexes for table `antrean_keluar`
--
ALTER TABLE `antrean_keluar`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_antrean_keluar_event_key` (`kunci_peristiwa`),
  ADD KEY `ix_antrean_keluar_queue` (`status`,`next_attempt_at`);

--
-- Indexes for table `bahan_produksi`
--
ALTER TABLE `bahan_produksi`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_bahan_baku_kode` (`kode_bahan`),
  ADD KEY `ix_bahan_baku_stok` (`aktif`,`stok_fisik`,`stok_dipesan`);

--
-- Indexes for table `catatan_pesanan`
--
ALTER TABLE `catatan_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_catatan_pesanan_order_date` (`pesanan_id`,`dibuat_pada`),
  ADD KEY `fk_catatan_pesanan_author` (`penulis_id`);

--
-- Indexes for table `daftar_keinginan`
--
ALTER TABLE `daftar_keinginan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_wishlist_user_name` (`akun_pengguna_id`,`nama`);

--
-- Indexes for table `foto_komplain`
--
ALTER TABLE `foto_komplain`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_foto_komplain_complaint` (`komplain_id`),
  ADD KEY `fk_foto_komplain_user` (`uploaded_by`);

--
-- Indexes for table `foto_pengiriman`
--
ALTER TABLE `foto_pengiriman`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_foto_pengiriman_shipment` (`pengiriman_id`),
  ADD KEY `fk_foto_pengiriman_user` (`uploaded_by`);

--
-- Indexes for table `gambar_produk`
--
ALTER TABLE `gambar_produk`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_gambar_produk_product` (`produk_id`,`urutan_tampil`);

--
-- Indexes for table `identitas_eksternal`
--
ALTER TABLE `identitas_eksternal`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_external_provider_subject` (`penyedia`,`subjek_penyedia`),
  ADD KEY `ix_external_user` (`akun_pengguna_id`);

--
-- Indexes for table `item_daftar_keinginan`
--
ALTER TABLE `item_daftar_keinginan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_wishlist_product` (`daftar_keinginan_id`,`produk_id`),
  ADD KEY `ix_item_daftar_keinginan_product` (`produk_id`);

--
-- Indexes for table `item_keranjang_belanja`
--
ALTER TABLE `item_keranjang_belanja`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_item_keranjang_product` (`produk_id`),
  ADD KEY `ix_item_keranjang_keranjang_produk` (`keranjang_id`,`produk_id`);

--
-- Indexes for table `item_pesanan`
--
ALTER TABLE `item_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_item_pesanan_order` (`pesanan_id`),
  ADD KEY `ix_item_pesanan_product` (`produk_id`);

--
-- Indexes for table `kategori`
--
ALTER TABLE `kategori`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_kategori_slug` (`slug`),
  ADD KEY `ix_kategori_parent` (`induk_id`,`aktif`);

--
-- Indexes for table `kategori_pilihan_buket`
--
ALTER TABLE `kategori_pilihan_buket`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_kelompok_kustomisasi_kode` (`kode`),
  ADD KEY `ix_kelompok_kustomisasi_aktif` (`aktif`,`urutan_tampil`);

--
-- Indexes for table `kategori_pilihan_produk`
--
ALTER TABLE `kategori_pilihan_produk`
  ADD PRIMARY KEY (`produk_id`,`kategori_pilihan_buket_id`),
  ADD KEY `fk_produk_kelompok_kelompok` (`kategori_pilihan_buket_id`);

--
-- Indexes for table `kebutuhan_bahan_buket_pesanan`
--
ALTER TABLE `kebutuhan_bahan_buket_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_kebutuhan_bahan_item_pesanan` (`item_pesanan_id`),
  ADD KEY `ix_kebutuhan_bahan_master` (`bahan_produksi_id`);

--
-- Indexes for table `kebutuhan_bahan_opsi_buket`
--
ALTER TABLE `kebutuhan_bahan_opsi_buket`
  ADD PRIMARY KEY (`opsi_pilihan_buket_id`,`bahan_produksi_id`),
  ADD KEY `fk_kebutuhan_bahan_opsi_bahan` (`bahan_produksi_id`);

--
-- Indexes for table `keranjang`
--
ALTER TABLE `keranjang`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_keranjang_guest_token` (`hash_token_tamu`),
  ADD KEY `ix_keranjang_user` (`akun_pengguna_id`);

--
-- Indexes for table `kode_verifikasi`
--
ALTER TABLE `kode_verifikasi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_verification_user_purpose` (`akun_pengguna_id`,`tujuan`),
  ADD KEY `ix_verification_expiry` (`kedaluwarsa_pada`),
  ADD KEY `ix_verification_email` (`email_normalisasi`,`tujuan`);

--
-- Indexes for table `komplain`
--
ALTER TABLE `komplain`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_komplain_order_status` (`pesanan_id`,`status`),
  ADD KEY `fk_komplain_decider` (`diputuskan_oleh`);

--
-- Indexes for table `konfigurasi_buket_keranjang`
--
ALTER TABLE `konfigurasi_buket_keranjang`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_kustomisasi_item_keranjang` (`item_keranjang_belanja_id`);

--
-- Indexes for table `konfigurasi_buket_pesanan`
--
ALTER TABLE `konfigurasi_buket_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_kustomisasi_item_pesanan` (`item_pesanan_id`);

--
-- Indexes for table `log_audit`
--
ALTER TABLE `log_audit`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_audit_at` (`at`),
  ADD KEY `ix_audit_object` (`jenis_objek`,`objek_id`),
  ADD KEY `ix_audit_actor` (`jenis_aktor`,`aktor_id`),
  ADD KEY `fk_audit_actor` (`aktor_id`);

--
-- Indexes for table `notifikasi`
--
ALTER TABLE `notifikasi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_notifikasi_queue` (`status`,`next_attempt_at`),
  ADD KEY `ix_notifikasi_user` (`akun_pengguna_id`);

--
-- Indexes for table `opsi_pilihan_buket`
--
ALTER TABLE `opsi_pilihan_buket`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_opsi_kustomisasi_kode` (`kategori_pilihan_buket_id`,`kode`),
  ADD KEY `ix_opsi_kustomisasi_aktif` (`kategori_pilihan_buket_id`,`aktif`,`urutan_tampil`);

--
-- Indexes for table `pengaturan_sistem`
--
ALTER TABLE `pengaturan_sistem`
  ADD PRIMARY KEY (`setting_key`),
  ADD KEY `fk_pengaturan_updater` (`diperbarui_oleh`);

--
-- Indexes for table `pengembalian_dana`
--
ALTER TABLE `pengembalian_dana`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_pengembalian_dana_idempotency` (`kunci_idempotensi`),
  ADD KEY `ix_pengembalian_dana_order_status` (`pesanan_id`,`status`),
  ADD KEY `ix_pengembalian_dana_attempt` (`percobaan_pembayaran_pesanan_id`),
  ADD KEY `fk_pengembalian_dana_requester` (`diminta_oleh`),
  ADD KEY `fk_pengembalian_dana_approver` (`disetujui_oleh`);

--
-- Indexes for table `pengiriman`
--
ALTER TABLE `pengiriman`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_pengiriman_order` (`pesanan_id`),
  ADD KEY `ix_pengiriman_tracking` (`tracking_ref`),
  ADD KEY `ix_pengiriman_status` (`status`);

--
-- Indexes for table `percobaan_pembayaran_pesanan`
--
ALTER TABLE `percobaan_pembayaran_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_payment_gateway_txn` (`id_transaksi_gateway`),
  ADD KEY `ix_percobaan_pembayaran_order` (`pesanan_id`),
  ADD KEY `ix_percobaan_pembayaran_status_expiry` (`status`,`kedaluwarsa_pada`);

--
-- Indexes for table `peristiwa_pembayaran`
--
ALTER TABLE `peristiwa_pembayaran`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_payment_event_idempotency` (`id_transaksi_gateway`,`jenis_peristiwa`),
  ADD KEY `ix_peristiwa_pembayaran_attempt` (`percobaan_pembayaran_pesanan_id`),
  ADD KEY `ix_peristiwa_pembayaran_received` (`received_at`);

--
-- Indexes for table `peristiwa_pengiriman`
--
ALTER TABLE `peristiwa_pengiriman`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_peristiwa_pengiriman_shipment_date` (`pengiriman_id`,`peristiwa_pada`);

--
-- Indexes for table `permintaan_pembatalan`
--
ALTER TABLE `permintaan_pembatalan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_cancel_order_status` (`pesanan_id`,`status`),
  ADD KEY `fk_cancel_requester` (`diminta_oleh`),
  ADD KEY `fk_cancel_decider` (`diputuskan_oleh`);

--
-- Indexes for table `pesanan`
--
ALTER TABLE `pesanan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_pesanan_order_no` (`nomor_pesanan`),
  ADD KEY `ix_pesanan_user_created` (`akun_pengguna_id`,`dibuat_pada`),
  ADD KEY `ix_pesanan_status_delivery` (`status_pesanan`,`tanggal_pengiriman`,`slot_pengiriman_id`),
  ADD KEY `ix_pesanan_expiry` (`status_pesanan`,`kedaluwarsa_pada`),
  ADD KEY `ix_pesanan_ph` (`status_pesanan`,`ph_deadline`),
  ADD KEY `fk_pesanan_ph_owner` (`ph_owner_id`),
  ADD KEY `fk_pesanan_delivery_slot` (`slot_pengiriman_id`);

--
-- Indexes for table `pilihan_buket_keranjang`
--
ALTER TABLE `pilihan_buket_keranjang`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_detail_kustomisasi_keranjang` (`konfigurasi_buket_keranjang_id`),
  ADD KEY `fk_detail_kustomisasi_opsi` (`opsi_pilihan_buket_id`);

--
-- Indexes for table `pilihan_buket_pesanan`
--
ALTER TABLE `pilihan_buket_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_detail_kustomisasi_pesanan` (`konfigurasi_buket_pesanan_id`),
  ADD KEY `fk_detail_kustomisasi_pesanan_opsi` (`opsi_pilihan_buket_id`);

--
-- Indexes for table `produk`
--
ALTER TABLE `produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_produk_sku` (`kode_sku`),
  ADD UNIQUE KEY `uq_produk_slug` (`slug`),
  ADD KEY `ix_produk_catalog` (`status`,`kategori_id`),
  ADD KEY `ix_produk_price` (`status`,`harga`),
  ADD KEY `fk_produk_category` (`kategori_id`);

--
-- Indexes for table `produksi_buket_pesanan`
--
ALTER TABLE `produksi_buket_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_produksi_buket_item` (`item_pesanan_id`),
  ADD KEY `ix_produksi_buket_antrian` (`status_produksi`,`prioritas`,`tenggat_produksi`),
  ADD KEY `fk_produksi_buket_perangkai` (`perangkai_id`);

--
-- Indexes for table `reservasi_stok_pesanan`
--
ALTER TABLE `reservasi_stok_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_stock_reservation_idempotency` (`kunci_idempotensi`),
  ADD KEY `ix_stock_res_status_expiry` (`status`,`kedaluwarsa_pada`),
  ADD KEY `ix_stock_res_order` (`pesanan_id`),
  ADD KEY `ix_stock_res_product_status` (`produk_id`,`status`);

--
-- Indexes for table `riwayat_perubahan_stok_bahan`
--
ALTER TABLE `riwayat_perubahan_stok_bahan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_riwayat_stok_bahan_idempotensi` (`kunci_idempotensi`),
  ADD KEY `ix_riwayat_stok_bahan_tanggal` (`bahan_produksi_id`,`dibuat_pada`),
  ADD KEY `fk_riwayat_stok_bahan_aktor` (`aktor_id`);

--
-- Indexes for table `riwayat_perubahan_stok_produk`
--
ALTER TABLE `riwayat_perubahan_stok_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_riwayat_stok_idempotency` (`kunci_idempotensi`),
  ADD KEY `ix_riwayat_stok_product_date` (`produk_id`,`dibuat_pada`),
  ADD KEY `ix_riwayat_stok_ref` (`jenis_referensi`,`referensi_id`),
  ADD KEY `fk_riwayat_stok_actor` (`aktor_id`);

--
-- Indexes for table `riwayat_status_pesanan`
--
ALTER TABLE `riwayat_status_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_riwayat_status_pesanan_order_date` (`pesanan_id`,`dibuat_pada`),
  ADD KEY `ix_riwayat_status_pesanan_transition` (`transition_id`),
  ADD KEY `fk_riwayat_status_pesanan_actor` (`aktor_id`);

--
-- Indexes for table `riwayat_status_produksi_buket`
--
ALTER TABLE `riwayat_status_produksi_buket`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_riwayat_produksi_tanggal` (`produksi_buket_id`,`dibuat_pada`),
  ADD KEY `fk_riwayat_produksi_aktor` (`aktor_id`);

--
-- Indexes for table `sesi_login`
--
ALTER TABLE `sesi_login`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_sesi_login_user` (`akun_pengguna_id`),
  ADD KEY `ix_sesi_login_expiry` (`kedaluwarsa_pada`);

--
-- Indexes for table `slot_pengiriman`
--
ALTER TABLE `slot_pengiriman`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_slot_pengiriman_code` (`kode_slot`);

--
-- Indexes for table `tanggal_tutup`
--
ALTER TABLE `tanggal_tutup`
  ADD PRIMARY KEY (`tanggal_tutup`),
  ADD KEY `ix_tanggal_tutup_created_by` (`dibuat_oleh`);

--
-- Indexes for table `ulasan_produk`
--
ALTER TABLE `ulasan_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_review_user_order_item` (`akun_pengguna_id`,`item_pesanan_id`),
  ADD KEY `ix_reviews_product_status` (`produk_id`,`status`),
  ADD KEY `fk_reviews_order_item` (`item_pesanan_id`),
  ADD KEY `fk_reviews_moderator` (`dimoderasi_oleh`);

--
-- Indexes for table `zona_layanan_kurir`
--
ALTER TABLE `zona_layanan_kurir`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_courier_service_zone` (`kode_kurir`,`kode_layanan`,`kota`,`kecamatan`,`jenis_penanganan`),
  ADD KEY `ix_courier_zone_lookup` (`aktif`,`kota`,`jenis_penanganan`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `akun_pengguna`
--
ALTER TABLE `akun_pengguna`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `alamat_pengguna`
--
ALTER TABLE `alamat_pengguna`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `antrean_keluar`
--
ALTER TABLE `antrean_keluar`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bahan_produksi`
--
ALTER TABLE `bahan_produksi`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `catatan_pesanan`
--
ALTER TABLE `catatan_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `daftar_keinginan`
--
ALTER TABLE `daftar_keinginan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `foto_komplain`
--
ALTER TABLE `foto_komplain`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `foto_pengiriman`
--
ALTER TABLE `foto_pengiriman`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gambar_produk`
--
ALTER TABLE `gambar_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `identitas_eksternal`
--
ALTER TABLE `identitas_eksternal`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `item_daftar_keinginan`
--
ALTER TABLE `item_daftar_keinginan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `item_keranjang_belanja`
--
ALTER TABLE `item_keranjang_belanja`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `item_pesanan`
--
ALTER TABLE `item_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kategori`
--
ALTER TABLE `kategori`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kategori_pilihan_buket`
--
ALTER TABLE `kategori_pilihan_buket`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `kebutuhan_bahan_buket_pesanan`
--
ALTER TABLE `kebutuhan_bahan_buket_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `keranjang`
--
ALTER TABLE `keranjang`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kode_verifikasi`
--
ALTER TABLE `kode_verifikasi`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `komplain`
--
ALTER TABLE `komplain`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `konfigurasi_buket_keranjang`
--
ALTER TABLE `konfigurasi_buket_keranjang`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `konfigurasi_buket_pesanan`
--
ALTER TABLE `konfigurasi_buket_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `log_audit`
--
ALTER TABLE `log_audit`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifikasi`
--
ALTER TABLE `notifikasi`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `opsi_pilihan_buket`
--
ALTER TABLE `opsi_pilihan_buket`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pengembalian_dana`
--
ALTER TABLE `pengembalian_dana`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pengiriman`
--
ALTER TABLE `pengiriman`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `percobaan_pembayaran_pesanan`
--
ALTER TABLE `percobaan_pembayaran_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `peristiwa_pembayaran`
--
ALTER TABLE `peristiwa_pembayaran`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `peristiwa_pengiriman`
--
ALTER TABLE `peristiwa_pengiriman`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `permintaan_pembatalan`
--
ALTER TABLE `permintaan_pembatalan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pesanan`
--
ALTER TABLE `pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pilihan_buket_keranjang`
--
ALTER TABLE `pilihan_buket_keranjang`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pilihan_buket_pesanan`
--
ALTER TABLE `pilihan_buket_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `produk`
--
ALTER TABLE `produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `produksi_buket_pesanan`
--
ALTER TABLE `produksi_buket_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reservasi_stok_pesanan`
--
ALTER TABLE `reservasi_stok_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `riwayat_perubahan_stok_bahan`
--
ALTER TABLE `riwayat_perubahan_stok_bahan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `riwayat_perubahan_stok_produk`
--
ALTER TABLE `riwayat_perubahan_stok_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `riwayat_status_pesanan`
--
ALTER TABLE `riwayat_status_pesanan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `riwayat_status_produksi_buket`
--
ALTER TABLE `riwayat_status_produksi_buket`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `slot_pengiriman`
--
ALTER TABLE `slot_pengiriman`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ulasan_produk`
--
ALTER TABLE `ulasan_produk`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `zona_layanan_kurir`
--
ALTER TABLE `zona_layanan_kurir`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `alamat_pengguna`
--
ALTER TABLE `alamat_pengguna`
  ADD CONSTRAINT `fk_alamat_user` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `catatan_pesanan`
--
ALTER TABLE `catatan_pesanan`
  ADD CONSTRAINT `fk_catatan_pesanan_author` FOREIGN KEY (`penulis_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_catatan_pesanan_order` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `daftar_keinginan`
--
ALTER TABLE `daftar_keinginan`
  ADD CONSTRAINT `fk_daftar_keinginan_user` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `foto_komplain`
--
ALTER TABLE `foto_komplain`
  ADD CONSTRAINT `fk_foto_komplain_complaint` FOREIGN KEY (`komplain_id`) REFERENCES `komplain` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_foto_komplain_user` FOREIGN KEY (`uploaded_by`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `foto_pengiriman`
--
ALTER TABLE `foto_pengiriman`
  ADD CONSTRAINT `fk_foto_pengiriman_shipment` FOREIGN KEY (`pengiriman_id`) REFERENCES `pengiriman` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_foto_pengiriman_user` FOREIGN KEY (`uploaded_by`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `gambar_produk`
--
ALTER TABLE `gambar_produk`
  ADD CONSTRAINT `fk_gambar_produk_product` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `identitas_eksternal`
--
ALTER TABLE `identitas_eksternal`
  ADD CONSTRAINT `fk_external_user` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `item_daftar_keinginan`
--
ALTER TABLE `item_daftar_keinginan`
  ADD CONSTRAINT `fk_item_daftar_keinginan_product` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_item_daftar_keinginan_wishlist` FOREIGN KEY (`daftar_keinginan_id`) REFERENCES `daftar_keinginan` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `item_keranjang_belanja`
--
ALTER TABLE `item_keranjang_belanja`
  ADD CONSTRAINT `fk_item_keranjang_cart` FOREIGN KEY (`keranjang_id`) REFERENCES `keranjang` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_item_keranjang_product` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `item_pesanan`
--
ALTER TABLE `item_pesanan`
  ADD CONSTRAINT `fk_item_pesanan_order` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_item_pesanan_product` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `kategori`
--
ALTER TABLE `kategori`
  ADD CONSTRAINT `fk_kategori_parent` FOREIGN KEY (`induk_id`) REFERENCES `kategori` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `kategori_pilihan_produk`
--
ALTER TABLE `kategori_pilihan_produk`
  ADD CONSTRAINT `fk_produk_kelompok_kelompok` FOREIGN KEY (`kategori_pilihan_buket_id`) REFERENCES `kategori_pilihan_buket` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_produk_kelompok_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `kebutuhan_bahan_buket_pesanan`
--
ALTER TABLE `kebutuhan_bahan_buket_pesanan`
  ADD CONSTRAINT `fk_kebutuhan_bahan_item_master` FOREIGN KEY (`bahan_produksi_id`) REFERENCES `bahan_produksi` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_kebutuhan_bahan_item_pesanan` FOREIGN KEY (`item_pesanan_id`) REFERENCES `item_pesanan` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `kebutuhan_bahan_opsi_buket`
--
ALTER TABLE `kebutuhan_bahan_opsi_buket`
  ADD CONSTRAINT `fk_kebutuhan_bahan_opsi_bahan` FOREIGN KEY (`bahan_produksi_id`) REFERENCES `bahan_produksi` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_kebutuhan_bahan_opsi_opsi` FOREIGN KEY (`opsi_pilihan_buket_id`) REFERENCES `opsi_pilihan_buket` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `keranjang`
--
ALTER TABLE `keranjang`
  ADD CONSTRAINT `fk_keranjang_user` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `kode_verifikasi`
--
ALTER TABLE `kode_verifikasi`
  ADD CONSTRAINT `fk_verification_user` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `komplain`
--
ALTER TABLE `komplain`
  ADD CONSTRAINT `fk_komplain_decider` FOREIGN KEY (`diputuskan_oleh`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_komplain_order` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `konfigurasi_buket_keranjang`
--
ALTER TABLE `konfigurasi_buket_keranjang`
  ADD CONSTRAINT `fk_kustomisasi_item_keranjang_item` FOREIGN KEY (`item_keranjang_belanja_id`) REFERENCES `item_keranjang_belanja` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `konfigurasi_buket_pesanan`
--
ALTER TABLE `konfigurasi_buket_pesanan`
  ADD CONSTRAINT `fk_kustomisasi_item_pesanan_item` FOREIGN KEY (`item_pesanan_id`) REFERENCES `item_pesanan` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `log_audit`
--
ALTER TABLE `log_audit`
  ADD CONSTRAINT `fk_audit_actor` FOREIGN KEY (`aktor_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `notifikasi`
--
ALTER TABLE `notifikasi`
  ADD CONSTRAINT `fk_notifikasi_user` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `opsi_pilihan_buket`
--
ALTER TABLE `opsi_pilihan_buket`
  ADD CONSTRAINT `fk_opsi_kustomisasi_kelompok` FOREIGN KEY (`kategori_pilihan_buket_id`) REFERENCES `kategori_pilihan_buket` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `pengaturan_sistem`
--
ALTER TABLE `pengaturan_sistem`
  ADD CONSTRAINT `fk_pengaturan_updater` FOREIGN KEY (`diperbarui_oleh`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `pengembalian_dana`
--
ALTER TABLE `pengembalian_dana`
  ADD CONSTRAINT `fk_pengembalian_dana_approver` FOREIGN KEY (`disetujui_oleh`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_pengembalian_dana_order` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_pengembalian_dana_payment_attempt` FOREIGN KEY (`percobaan_pembayaran_pesanan_id`) REFERENCES `percobaan_pembayaran_pesanan` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_pengembalian_dana_requester` FOREIGN KEY (`diminta_oleh`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `pengiriman`
--
ALTER TABLE `pengiriman`
  ADD CONSTRAINT `fk_pengiriman_order` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `percobaan_pembayaran_pesanan`
--
ALTER TABLE `percobaan_pembayaran_pesanan`
  ADD CONSTRAINT `fk_percobaan_pembayaran_order` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `peristiwa_pembayaran`
--
ALTER TABLE `peristiwa_pembayaran`
  ADD CONSTRAINT `fk_peristiwa_pembayaran_attempt` FOREIGN KEY (`percobaan_pembayaran_pesanan_id`) REFERENCES `percobaan_pembayaran_pesanan` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `peristiwa_pengiriman`
--
ALTER TABLE `peristiwa_pengiriman`
  ADD CONSTRAINT `fk_peristiwa_pengiriman_shipment` FOREIGN KEY (`pengiriman_id`) REFERENCES `pengiriman` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `permintaan_pembatalan`
--
ALTER TABLE `permintaan_pembatalan`
  ADD CONSTRAINT `fk_cancel_decider` FOREIGN KEY (`diputuskan_oleh`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_cancel_order` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_cancel_requester` FOREIGN KEY (`diminta_oleh`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `pesanan`
--
ALTER TABLE `pesanan`
  ADD CONSTRAINT `fk_pesanan_delivery_slot` FOREIGN KEY (`slot_pengiriman_id`) REFERENCES `slot_pengiriman` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_pesanan_ph_owner` FOREIGN KEY (`ph_owner_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_pesanan_user` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `pilihan_buket_keranjang`
--
ALTER TABLE `pilihan_buket_keranjang`
  ADD CONSTRAINT `fk_detail_kustomisasi_keranjang` FOREIGN KEY (`konfigurasi_buket_keranjang_id`) REFERENCES `konfigurasi_buket_keranjang` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_detail_kustomisasi_opsi` FOREIGN KEY (`opsi_pilihan_buket_id`) REFERENCES `opsi_pilihan_buket` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `pilihan_buket_pesanan`
--
ALTER TABLE `pilihan_buket_pesanan`
  ADD CONSTRAINT `fk_detail_kustomisasi_pesanan` FOREIGN KEY (`konfigurasi_buket_pesanan_id`) REFERENCES `konfigurasi_buket_pesanan` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_detail_kustomisasi_pesanan_opsi` FOREIGN KEY (`opsi_pilihan_buket_id`) REFERENCES `opsi_pilihan_buket` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `produk`
--
ALTER TABLE `produk`
  ADD CONSTRAINT `fk_produk_category` FOREIGN KEY (`kategori_id`) REFERENCES `kategori` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `produksi_buket_pesanan`
--
ALTER TABLE `produksi_buket_pesanan`
  ADD CONSTRAINT `fk_produksi_buket_item` FOREIGN KEY (`item_pesanan_id`) REFERENCES `item_pesanan` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_produksi_buket_perangkai` FOREIGN KEY (`perangkai_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `reservasi_stok_pesanan`
--
ALTER TABLE `reservasi_stok_pesanan`
  ADD CONSTRAINT `fk_stock_res_order` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_stock_res_product` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `riwayat_perubahan_stok_bahan`
--
ALTER TABLE `riwayat_perubahan_stok_bahan`
  ADD CONSTRAINT `fk_riwayat_stok_bahan_aktor` FOREIGN KEY (`aktor_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_riwayat_stok_bahan_master` FOREIGN KEY (`bahan_produksi_id`) REFERENCES `bahan_produksi` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `riwayat_perubahan_stok_produk`
--
ALTER TABLE `riwayat_perubahan_stok_produk`
  ADD CONSTRAINT `fk_riwayat_stok_actor` FOREIGN KEY (`aktor_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_riwayat_stok_product` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `riwayat_status_pesanan`
--
ALTER TABLE `riwayat_status_pesanan`
  ADD CONSTRAINT `fk_riwayat_status_pesanan_actor` FOREIGN KEY (`aktor_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_riwayat_status_pesanan_order` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `riwayat_status_produksi_buket`
--
ALTER TABLE `riwayat_status_produksi_buket`
  ADD CONSTRAINT `fk_riwayat_produksi_aktor` FOREIGN KEY (`aktor_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_riwayat_produksi_buket` FOREIGN KEY (`produksi_buket_id`) REFERENCES `produksi_buket_pesanan` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `sesi_login`
--
ALTER TABLE `sesi_login`
  ADD CONSTRAINT `fk_sesi_login_user` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tanggal_tutup`
--
ALTER TABLE `tanggal_tutup`
  ADD CONSTRAINT `fk_tanggal_tutup_actor` FOREIGN KEY (`dibuat_oleh`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `ulasan_produk`
--
ALTER TABLE `ulasan_produk`
  ADD CONSTRAINT `fk_reviews_moderator` FOREIGN KEY (`dimoderasi_oleh`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_reviews_order_item` FOREIGN KEY (`item_pesanan_id`) REFERENCES `item_pesanan` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_reviews_product` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_reviews_user` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE RESTRICT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
