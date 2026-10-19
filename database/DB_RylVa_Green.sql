-- =====================================================================================
-- SKEMA BASIS DATA LENGKAP RYLVA GREEN VERSI 2.6 FINAL (EDISI PHP NATIVE & MYSQL/INNODB)
-- Aplikasi Web Penjualan Florist, Buket Kustom, Tanaman Hias, dan Perlengkapan Berkebun
-- =====================================================================================
-- Penamaan Database, Tabel, Kolom, Indeks, Constraint, Trigger, View, dan Data Awal
-- menggunakan Bahasa Indonesia yang deskriptif dan merepresentasikan fungsi bisnisnya,
-- menyelaraskan Spesifikasi Workflow v2.4, Adendum v2.5 (Kustomisasi Buket), dan
-- Adendum v2.6 (Gardening Goods, Varian, Multi-Kategori, Lokasi Stok, Batch/FEFO).
-- =====================================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -------------------------------------------------------------------------------------
-- 0. PEMBUATAN BASIS DATA (DATABASE)
-- -------------------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `RylVa_Green`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `RylVa_Green`;

-- =====================================================================================
-- DOMAIN 1: AKUN PENGGUNA, AUTENTIKASI, SESI, ALAMAT & KEAMANAN AKSES (BAGIAN 3, 6.3, 15)
-- =====================================================================================

-- 1. Tabel: akun_pengguna
-- Merepresentasikan data induk seluruh akun pengguna (Pelanggan, Admin, SuperAdmin)
DROP TABLE IF EXISTS `akun_pengguna`;
CREATE TABLE `akun_pengguna` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal unik akun pengguna',
  `peran` ENUM('CUSTOMER', 'ADMIN', 'SUPERADMIN') NOT NULL DEFAULT 'CUSTOMER' COMMENT 'Peran tunggal pengguna sesuai BR-19 (satu akun satu peran)',
  `email` VARCHAR(254) NOT NULL COMMENT 'Alamat email pengguna (disimpan huruf kecil, unik)',
  `hash_kata_sandi` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Hash kata sandi Argon2id/bcrypt (NULL untuk akun Google-only atau Admin belum aktivasi)',
  `status_akun` ENUM('BELUM_TERVERIFIKASI', 'AKTIF', 'DITANGGUHKAN', 'DINONAKTIFKAN', 'DIANONIMKAN') NOT NULL DEFAULT 'BELUM_TERVERIFIKASI' COMMENT 'Status siklus hidup akun pengguna',
  `nama_lengkap` VARCHAR(100) NOT NULL COMMENT 'Nama lengkap pengguna (2-100 karakter)',
  `nomor_telepon` VARCHAR(20) NULL DEFAULT NULL COMMENT 'Nomor telepon format +62 (9-15 digit)',
  `rahasia_mfa_terenkripsi` VARBINARY(512) NULL DEFAULT NULL COMMENT 'Kunci rahasia TOTP MFA yang dienkripsi dengan APP_KEY (SEC-03, D-13)',
  `status_mfa_aktif` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Penanda apakah MFA sudah aktif (wajib 1 untuk ADMIN dan SUPERADMIN)',
  `hash_kode_cadangan_mfa` JSON NULL DEFAULT NULL COMMENT 'Daftar hash kode pemulihan cadangan MFA untuk SuperAdmin (Bagian 13.2)',
  `versi_persetujuan_privasi` VARCHAR(32) NULL DEFAULT NULL COMMENT 'Versi Syarat & Ketentuan serta Kebijakan Privasi yang disetujui saat registrasi',
  `waktu_persetujuan_privasi` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC saat pengguna menyetujui Kebijakan Privasi',
  `jumlah_gagal_login_berturut` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Penghitung kegagalan login berturut-turut untuk penguncian sementara P-31',
  `waktu_terkunci_hingga` DATETIME NULL DEFAULT NULL COMMENT 'Batas waktu penundaan login akibat kegagalan berulang (P-31)',
  `alasan_penonaktifan` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Alasan wajib saat akun pelanggan/staf ditangguhkan atau dinonaktifkan',
  `dinonaktifkan_oleh_akun_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun staf yang menonaktifkan akun ini',
  `waktu_login_terakhir` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC login terakhir yang berhasil',
  `waktu_aktivitas_terakhir` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC aktivitas terakhir untuk pemantauan akun tidak aktif (P-36)',
  `waktu_peringatan_anonimisasi` DATETIME NULL DEFAULT NULL COMMENT 'Waktu pengiriman notifikasi N-20 (30 hari sebelum anonimisasi P-36)',
  `waktu_dianonimkan` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC saat data pribadi akun dianonimkan',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_akun_pengguna_email` (`email`),
  KEY `idx_akun_pengguna_status_peran` (`status_akun`, `peran`),
  KEY `idx_akun_pengguna_aktivitas_terakhir` (`status_akun`, `waktu_aktivitas_terakhir`),
  KEY `fk_akun_pengguna_dinonaktifkan_oleh` (`dinonaktifkan_oleh_akun_id`),
  CONSTRAINT `fk_akun_pengguna_dinonaktifkan_oleh` FOREIGN KEY (`dinonaktifkan_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan akun pengguna (Pelanggan, Admin, SuperAdmin), kredensial, status MFA, dan persetujuan privasi';

-- 2. Tabel: identitas_eksternal
-- Merepresentasikan penautan akun pelanggan dengan penyedia identitas pihak ketiga (Google OIDC)
DROP TABLE IF EXISTS `identitas_eksternal`;
CREATE TABLE `identitas_eksternal` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal identitas eksternal',
  `akun_pengguna_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi akun pengguna yang ditautkan',
  `nama_penyedia` ENUM('GOOGLE') NOT NULL DEFAULT 'GOOGLE' COMMENT 'Nama penyedia identitas OAuth/OIDC',
  `subjek_penyedia_id` VARCHAR(255) NOT NULL COMMENT 'ID unik sub (subject) dari penyedia OpenID Connect',
  `email_penyedia` VARCHAR(254) NOT NULL COMMENT 'Alamat email terverifikasi dari penyedia identitas',
  `status_email_terverifikasi` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Penanda bahwa email telah diverifikasi oleh penyedia (wajib 1 sesuai SEC-05)',
  `waktu_ditautkan` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu UTC saat identitas eksternal berhasil ditautkan',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_identitas_eksternal_penyedia_subjek` (`nama_penyedia`, `subjek_penyedia_id`),
  UNIQUE KEY `uk_identitas_eksternal_akun_penyedia` (`akun_pengguna_id`, `nama_penyedia`),
  CONSTRAINT `fk_identitas_eksternal_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan penautan akun pelanggan dengan login eksternal Google OIDC setelah kepemilikan akun terverifikasi';

-- 3. Tabel: sesi_login
-- Merepresentasikan penyimpanan sesi login berbasis database MySQL untuk pelanggan dan staf (Bagian 15.2 & 15.6)
DROP TABLE IF EXISTS `sesi_login`;
CREATE TABLE `sesi_login` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal baris sesi login',
  `hash_id_sesi` CHAR(64) NOT NULL COMMENT 'Hash SHA-256 dari ID sesi cookie (__Host-rg_sid / __Host-rg_staff)',
  `akun_pengguna_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun pengguna yang sedang login (NULL untuk sesi pra-login CSRF)',
  `jenis_kanal_sesi` ENUM('PELANGGAN', 'STAF') NOT NULL DEFAULT 'PELANGGAN' COMMENT 'Pemisahan sesi portal pelanggan dan panel staf',
  `token_csrf_sesi` CHAR(64) NOT NULL COMMENT 'Token anti-CSRF unik per sesi (32 byte hex sesuai Bagian 15.5)',
  `alamat_ip_awal` VARCHAR(45) NOT NULL COMMENT 'Alamat IP klien saat sesi dibuat (hasil fungsi client_ip)',
  `prefiks_ip_terakhir` VARCHAR(45) NOT NULL COMMENT 'Prefiks IP terakhir untuk deteksi anomali perpindahan jaringan',
  `hash_agen_pengguna` CHAR(64) NOT NULL COMMENT 'Hash SHA-256 dari header User-Agent peramban',
  `info_agen_pengguna` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Ringkasan User-Agent untuk ditampilkan pada daftar sesi aktif',
  `status_mfa_terverifikasi` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Penanda apakah sesi staf telah lulus verifikasi MFA',
  `waktu_konfirmasi_ulang_terakhir` DATETIME NULL DEFAULT NULL COMMENT 'Waktu terakhir staf melakukan autentikasi ulang untuk aksi sensitif (Bagian 13.1)',
  `waktu_dibuat` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu mulai sesi untuk perhitungan batas absolut P-32',
  `waktu_terlihat_terakhir` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu aktivitas terakhir untuk perhitungan batas idle P-32',
  `waktu_kedaluwarsa` DATETIME NOT NULL COMMENT 'Waktu kedaluwarsa sesi resmi di server',
  `waktu_dicabut` DATETIME NULL DEFAULT NULL COMMENT 'Waktu sesi dicabut (logout, ganti sandi, batas sesi P-44, atau akun dinonaktifkan)',
  `alasan_pencabutan` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Alasan pencabutan sesi (LOGOUT, GANTI_SANDI, AKUN_NONAKTIF, BATAS_SESI_P44, KEDALUWARSA)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sesi_login_hash_id_sesi` (`hash_id_sesi`),
  KEY `idx_sesi_login_akun_aktif` (`akun_pengguna_id`, `waktu_dicabut`, `waktu_kedaluwarsa`),
  KEY `idx_sesi_login_kedaluwarsa` (`waktu_kedaluwarsa`),
  CONSTRAINT `fk_sesi_login_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan sesi login server-side untuk pelanggan dan staf guna mendukung pencabutan sesi instan dan multi-server';

-- 4. Tabel: kode_verifikasi
-- Merepresentasikan kode OTP verifikasi email, token reset kata sandi, aktivasi Admin, dan konfirmasi penautan Google
DROP TABLE IF EXISTS `kode_verifikasi`;
CREATE TABLE `kode_verifikasi` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal kode verifikasi',
  `akun_pengguna_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi akun pengguna pemilik kode/token',
  `tujuan_verifikasi` ENUM('VERIFIKASI_EMAIL_REGISTRASI', 'VERIFIKASI_PERUBAHAN_EMAIL', 'PEMULIHAN_KATA_SANDI', 'AKTIVASI_AKUN_ADMIN', 'TAUTAN_AKUN_GOOGLE') NOT NULL COMMENT 'Tujuan penggunaan kode atau token verifikasi',
  `email_tujuan` VARCHAR(254) NOT NULL COMMENT 'Alamat email tujuan pengiriman kode (penting saat perubahan email baru)',
  `hash_kode_atau_token` CHAR(64) NOT NULL COMMENT 'Hash SHA-256 dari kode 6 digit atau token pemulihan/aktivasi sekali pakai',
  `jumlah_percobaan_salah` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Jumlah kesalahan input kode (maksimum 5 kali sesuai P-29 dan RL-06)',
  `batas_maksimum_percobaan` INT UNSIGNED NOT NULL DEFAULT 5 COMMENT 'Batas maksimum kesalahan sebelum kode otomatis dibatalkan',
  `waktu_kedaluwarsa` DATETIME NOT NULL COMMENT 'Batas waktu berlaku kode (10 menit P-29, 15 menit P-30, 24 jam P-33)',
  `waktu_digunakan` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC saat kode/token berhasil dipakai (sekali pakai)',
  `waktu_dibatalkan` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC saat kode dibatalkan karena melampaui batas salah atau diganti kode baru',
  `alamat_ip_peminta` VARCHAR(45) NULL DEFAULT NULL COMMENT 'Alamat IP klien saat meminta pembuatan kode',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  PRIMARY KEY (`id`),
  KEY `idx_kode_verifikasi_akun_tujuan` (`akun_pengguna_id`, `tujuan_verifikasi`, `waktu_kedaluwarsa`),
  KEY `idx_kode_verifikasi_hash` (`hash_kode_atau_token`),
  CONSTRAINT `fk_kode_verifikasi_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan hash kode OTP verifikasi email, token lupa kata sandi, dan tautan aktivasi akun staf';

-- 5. Tabel: alamat_pengguna
-- Merepresentasikan daftar alamat pengiriman tersimpan milik pelanggan (maksimum P-26 = 5 alamat per akun)
DROP TABLE IF EXISTS `alamat_pengguna`;
CREATE TABLE `alamat_pengguna` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal alamat pengguna',
  `akun_pengguna_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi akun pelanggan pemilik alamat',
  `label_alamat` VARCHAR(50) NOT NULL DEFAULT 'Rumah' COMMENT 'Label penanda alamat (mis. Rumah, Kantor, Taman)',
  `nama_penerima` VARCHAR(100) NOT NULL COMMENT 'Nama lengkap penerima paket',
  `nomor_telepon_penerima` VARCHAR(20) NOT NULL COMMENT 'Nomor telepon aktif penerima format +62',
  `alamat_lengkap` VARCHAR(255) NOT NULL COMMENT 'Nama jalan, nomor rumah, RT/RW (10-255 karakter)',
  `kelurahan` VARCHAR(100) NOT NULL COMMENT 'Nama kelurahan atau desa',
  `kecamatan` VARCHAR(100) NOT NULL COMMENT 'Nama kecamatan',
  `kota_kabupaten` VARCHAR(100) NOT NULL COMMENT 'Nama kota atau kabupaten',
  `provinsi` VARCHAR(100) NOT NULL COMMENT 'Nama provinsi',
  `kode_pos` CHAR(5) NOT NULL COMMENT 'Kode pos 5 digit',
  `patokan_lokasi` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Catatan patokan lokasi untuk memudahkan kurir mencari alamat',
  `titik_lintang` DECIMAL(10,7) NULL DEFAULT NULL COMMENT 'Koordinat latitude peta (wajib diisi untuk pengiriman kurir instan/same-day)',
  `titik_bujur` DECIMAL(10,7) NULL DEFAULT NULL COMMENT 'Koordinat longitude peta (wajib diisi untuk pengiriman kurir instan/same-day)',
  `status_alamat_utama` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Penanda apakah alamat ini menjadi alamat utama default saat checkout',
  `status_aktif` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Status aktif alamat (1 = aktif, 0 = dihapus lembut)',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  PRIMARY KEY (`id`),
  KEY `idx_alamat_pengguna_akun_aktif` (`akun_pengguna_id`, `status_aktif`, `status_alamat_utama`),
  KEY `idx_alamat_pengguna_kode_pos` (`kode_pos`),
  CONSTRAINT `fk_alamat_pengguna_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan buku alamat pengiriman pelanggan beserta titik koordinat peta untuk layanan kurir';

-- 6. Tabel: batas_laju_permintaan
-- Merepresentasikan penghitung pembatasan laju (rate limiting RL-01 s.d. RL-15) berbasis MySQL (Bagian 15.3)
DROP TABLE IF EXISTS `batas_laju_permintaan`;
CREATE TABLE `batas_laju_permintaan` (
  `kunci_batas_laju` CHAR(64) NOT NULL COMMENT 'Hash SHA-256 dari kombinasi kode endpoint RL-xx dan subjek (IP, email, akun, atau sesi)',
  `awal_jendela_waktu` INT UNSIGNED NOT NULL COMMENT 'Detik epoch awal jendela waktu tetap (fixed window)',
  `kode_aturan_rl` VARCHAR(16) NOT NULL DEFAULT 'RL_GLOBAL' COMMENT 'Kode aturan rate limit (RL-01 s.d. RL-15)',
  `jumlah_permintaan` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Jumlah hit permintaan dalam jendela waktu berjalan',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan hit terakhir (UTC)',
  PRIMARY KEY (`kunci_batas_laju`, `awal_jendela_waktu`),
  KEY `idx_batas_laju_awal_jendela` (`awal_jendela_waktu`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan penghitung rate limiting terpusat berbasis MySQL untuk menangkal brute force, spam, dan scraping';

-- 7. Tabel: log_peristiwa_keamanan
-- Merepresentasikan pencatatan peristiwa keamanan aplikasi (login gagal, CSRF, rate limit, IDOR, webhook ditolak) sesuai Bagian 15.10
DROP TABLE IF EXISTS `log_peristiwa_keamanan`;
CREATE TABLE `log_peristiwa_keamanan` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal catatan peristiwa keamanan',
  `id_permintaan` VARCHAR(64) NOT NULL COMMENT 'ID korelasi permintaan HTTP (request_id) untuk penelusuran insiden',
  `tingkat_keparahan` ENUM('INFO', 'WARNING', 'ERROR', 'CRITICAL') NOT NULL DEFAULT 'WARNING' COMMENT 'Tingkat keparahan peristiwa keamanan',
  `jenis_peristiwa` VARCHAR(64) NOT NULL COMMENT 'Kode jenis peristiwa (LOGIN_GAGAL, BATAS_LAJU_TERLAMPAUI, CSRF_GAGAL, AKSES_DITOLAK_403, PERCOBAAN_IDOR_404, WEBHOOK_TIDAK_VALID, UNGGAH_DITOLAK)',
  `akun_pengguna_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun pengguna bila permintaan terautentikasi',
  `peran_pengguna` VARCHAR(32) NULL DEFAULT NULL COMMENT 'Peran pengguna saat peristiwa terjadi',
  `alamat_ip_klien` VARCHAR(45) NOT NULL COMMENT 'Alamat IP klien asli hasil evaluasi fungsi client_ip() (BR-32)',
  `rute_atau_endpoint` VARCHAR(255) NOT NULL COMMENT 'Path URL atau rute endpoint tempat peristiwa terjadi',
  `metode_http` VARCHAR(10) NOT NULL COMMENT 'Metode HTTP permintaan (GET, POST, PUT, PATCH, DELETE)',
  `rincian_konteks` JSON NULL DEFAULT NULL COMMENT 'Metadata non-sensitif peristiwa (tanpa kata sandi, token, atau nomor rekening)',
  `waktu_kejadian` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu UTC terjadinya peristiwa keamanan',
  PRIMARY KEY (`id`),
  KEY `idx_log_keamanan_jenis_waktu` (`jenis_peristiwa`, `waktu_kejadian`),
  KEY `idx_log_keamanan_ip_waktu` (`alamat_ip_klien`, `waktu_kejadian`),
  KEY `idx_log_keamanan_akun_waktu` (`akun_pengguna_id`, `waktu_kejadian`),
  CONSTRAINT `fk_log_peristiwa_keamanan_akun` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan log peristiwa keamanan terstruktur untuk pemantauan serangan dan pemicu peringatan N-18';

-- =====================================================================================
-- DOMAIN 2: KATALOG PRODUK, GARDENING GOODS, KATEGORI, ATRIBUT, VARIAN & PAKET (BAGIAN 27)
-- =====================================================================================

-- 8. Tabel: kategori_produk
-- Merepresentasikan master hierarki kategori florist dan gardening goods (Bagian 27.1, 27.2, 27.4)
DROP TABLE IF EXISTS `kategori_produk`;
CREATE TABLE `kategori_produk` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal kategori produk',
  `kategori_induk_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi kategori induk untuk mendukung struktur pohon subkategori',
  `kode_kategori` VARCHAR(50) NOT NULL COMMENT 'Kode unik kategori untuk referensi sistem',
  `nama_kategori` VARCHAR(100) NOT NULL COMMENT 'Nama tampilan kategori (mis. Buket & Florist, Pot & Vas, Media Tanam, Benih)',
  `slug_kategori` VARCHAR(120) NOT NULL COMMENT 'Slug URL bersih untuk SEO dan halaman kategori publik (NFR-07)',
  `kelompok_domain` ENUM('FLORIST_DAN_BUKET', 'POT_DAN_VAS', 'MEDIA_TANAM', 'TANAH_DAN_KOMPOS', 'PUPUK_DAN_PERAWATAN', 'ALAT_BERKEBUN', 'BENIH_DAN_BIJI', 'TANAMAN_HIAS', 'PERLENGKAPAN_DEKORASI', 'PAKET_BERKEBUN') NOT NULL COMMENT 'Kelompok besar domain produk sesuai Bagian 27.1',
  `deskripsi_kategori` TEXT NULL DEFAULT NULL COMMENT 'Deskripsi kategori untuk landing page kategori dan meta SEO',
  `url_gambar_banner` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Kunci/path gambar banner kategori',
  `urutan_tampil` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Urutan penampilan kategori di navigasi dan beranda',
  `status_aktif` ENUM('AKTIF', 'NONAKTIF') NOT NULL DEFAULT 'AKTIF' COMMENT 'Status tampil kategori di katalog publik',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_kategori_produk_kode` (`kode_kategori`),
  UNIQUE KEY `uk_kategori_produk_slug` (`slug_kategori`),
  KEY `idx_kategori_produk_induk_status` (`kategori_induk_id`, `status_aktif`, `urutan_tampil`),
  CONSTRAINT `fk_kategori_produk_induk` FOREIGN KEY (`kategori_induk_id`) REFERENCES `kategori_produk` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan master kategori dan subkategori produk florist serta perlengkapan berkebun (gardening goods)';

-- 9. Tabel: produk
-- Merepresentasikan data induk produk (florist siap jual, buket kustom, tanaman hias, gardening goods, paket berkebun)
DROP TABLE IF EXISTS `produk`;
CREATE TABLE `produk` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal produk',
  `sku` VARCHAR(64) NOT NULL COMMENT 'Kode SKU unik tingkat produk induk',
  `nama_produk` VARCHAR(150) NOT NULL COMMENT 'Nama lengkap produk yang tampil di katalog',
  `slug_produk` VARCHAR(180) NOT NULL COMMENT 'Slug URL unik untuk halaman detail produk (NFR-07)',
  `kategori_utama_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi kategori utama untuk breadcrumb dan SEO (Bagian 27.2)',
  `jenis_produk` ENUM('PRODUK_STANDAR', 'BUKET_KUSTOM', 'TANAMAN_HIAS', 'PERLENGKAPAN_BERKEBUN', 'BENIH_DAN_PUPUK', 'PAKET_BERKEBUN') NOT NULL DEFAULT 'PRODUK_STANDAR' COMMENT 'Klasifikasi perilaku produk (mendukung kustomisasi buket v2.5 dan gardening goods v2.6)',
  `jenis_penanganan` ENUM('MUDAH_LAYU', 'TAHAN_LAMA') NOT NULL DEFAULT 'TAHAN_LAMA' COMMENT 'Atribut penanganan pengiriman (MUDAH_LAYU wajib tanggal+slot dan kurir instan/same-day, D-06 & D-07)',
  `kebijakan_stok_paket` ENUM('BUKAN_PAKET', 'STOK_PAKET_MANDIRI', 'STOK_DARI_KOMPONEN') NOT NULL DEFAULT 'BUKAN_PAKET' COMMENT 'Kebijakan perhitungan stok khusus untuk jenis PAKET_BERKEBUN (Bagian 27.2)',
  `merek` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Nama merek produk bila relevan (mis. alat berkebun, pupuk, pot)',
  `bahan_utama` VARCHAR(150) NULL DEFAULT NULL COMMENT 'Bahan utama produk (mis. keramik, terakota, cocopeat, mawar segar)',
  `satuan_jual` ENUM('PCS', 'POT', 'BATANG', 'BUKET', 'GRAM', 'KILOGRAM', 'MILILITER', 'LITER', 'PAK', 'SET') NOT NULL DEFAULT 'PCS' COMMENT 'Satuan jual eksplisit yang ditampilkan di katalog, keranjang, dan pesanan (Bagian 27.2)',
  `deskripsi_produk` TEXT NOT NULL COMMENT 'Deskripsi lengkap produk (teks biasa, di-escape saat tampil sesuai 15.4)',
  `panduan_perawatan_dan_penggunaan` TEXT NULL DEFAULT NULL COMMENT 'Informasi kebutuhan cahaya/air, petunjuk semai, atau cara pakai pupuk/media tanam (Bagian 27.1)',
  `peringatan_penanganan_produk` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Peringatan keamanan penggunaan atau penanganan khusus pengiriman (Bagian 27.1 & 27.3)',
  `nama_spesies_tanaman` VARCHAR(150) NULL DEFAULT NULL COMMENT 'Nama ilmiah/spesies khusus untuk kelompok tanaman hias atau benih (Bagian 27.1)',
  `memiliki_varian` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Penanda apakah produk memiliki beberapa varian komersial/SKU di tabel varian_produk',
  `wajib_pencatatan_batch` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Penanda apakah mutasi stok wajib merujuk batch/kedaluwarsa FEFO (benih/pupuk, Bagian 27.2)',
  `harga_dasar_rupiah` BIGINT UNSIGNED NOT NULL COMMENT 'Harga jual normal dalam bilangan bulat rupiah (BR-13, NFR-08)',
  `harga_diskon_rupiah` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Harga setelah diskon tingkat produk bila sedang promo (D-09)',
  `waktu_mulai_diskon` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC mulai berlakunya harga diskon produk (D-09)',
  `waktu_selesai_diskon` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC berakhirnya harga diskon produk (D-09)',
  `berat_gram` INT UNSIGNED NOT NULL COMMENT 'Berat produk dalam gram (wajib untuk perhitungan tarif kurir, Bagian 5)',
  `panjang_milimeter` INT UNSIGNED NOT NULL COMMENT 'Panjang dimensi kemasan dalam milimeter (wajib untuk kurir)',
  `lebar_milimeter` INT UNSIGNED NOT NULL COMMENT 'Lebar dimensi kemasan dalam milimeter (wajib untuk kurir)',
  `tinggi_milimeter` INT UNSIGNED NOT NULL COMMENT 'Tinggi dimensi kemasan dalam milimeter (wajib untuk kurir)',
  `waktu_persiapan_tambahan_menit` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Tambahan lead time persiapan khusus produk dalam menit bila diperlukan',
  `jumlah_stok_jual` INT NOT NULL DEFAULT 0 COMMENT 'Total saldo stok jual produk (turunan buku besar stok, tidak boleh negatif, BR-05)',
  `ambang_stok_rendah` INT UNSIGNED NOT NULL DEFAULT 5 COMMENT 'Ambang peringatan stok terbatas per produk (default P-22 = 5 unit)',
  `jumlah_unit_terjual` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Akumulasi unit terjual dari pesanan berstatus SELESAI (Bagian 6.1)',
  `status_produk` ENUM('AKTIF', 'NONAKTIF') NOT NULL DEFAULT 'AKTIF' COMMENT 'Status aktif produk (produk bertransaksi tidak boleh dihapus permanen, BR-15)',
  `dibuat_oleh_akun_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun Admin/SuperAdmin pembuat produk',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_produk_sku` (`sku`),
  UNIQUE KEY `uk_produk_slug` (`slug_produk`),
  KEY `idx_produk_status_kategori` (`status_produk`, `kategori_utama_id`),
  KEY `idx_produk_jenis_penanganan` (`status_produk`, `jenis_produk`, `jenis_penanganan`),
  KEY `idx_produk_harga_terlaris` (`status_produk`, `harga_dasar_rupiah`, `jumlah_unit_terjual`),
  KEY `fk_produk_dibuat_oleh` (`dibuat_oleh_akun_id`),
  CONSTRAINT `fk_produk_kategori_utama` FOREIGN KEY (`kategori_utama_id`) REFERENCES `kategori_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_produk_dibuat_oleh` FOREIGN KEY (`dibuat_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan master produk florist, buket kustom, tanaman hias, gardening goods, dan paket berkebun';

-- 10. Tabel: relasi_produk_kategori
-- Merepresentasikan pemetaan banyak-ke-banyak (many-to-many) antara produk dan kategori (Bagian 27.2 & 27.4)
DROP TABLE IF EXISTS `relasi_produk_kategori`;
CREATE TABLE `relasi_produk_kategori` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal relasi produk-kategori',
  `produk_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi produk yang dihubungkan ke kategori',
  `kategori_produk_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi kategori produk',
  `status_kategori_utama` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Penanda apakah kategori ini adalah kategori utama produk tersebut',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_relasi_produk_kategori_pasangan` (`produk_id`, `kategori_produk_id`),
  KEY `idx_relasi_produk_kategori_filter` (`kategori_produk_id`, `produk_id`),
  CONSTRAINT `fk_relasi_produk_kategori_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_relasi_produk_kategori_kategori` FOREIGN KEY (`kategori_produk_id`) REFERENCES `kategori_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan relasi multi-kategori agar satu produk dapat tampil pada beberapa kategori florist maupun gardening goods';

-- 11. Tabel: varian_produk
-- Merepresentasikan SKU varian komersial produk yang memiliki harga, dimensi, satuan, atau stok tersendiri (Bagian 27.2 & 27.4)
DROP TABLE IF EXISTS `varian_produk`;
CREATE TABLE `varian_produk` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal varian produk',
  `produk_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi produk induk pemilik varian',
  `sku_varian` VARCHAR(64) NOT NULL COMMENT 'Kode SKU unik untuk varian komersial ini (mis. POT-KRM-15CM, MEDIA-5L)',
  `nama_varian` VARCHAR(150) NOT NULL COMMENT 'Nama pembeda varian (mis. Ukuran 15 cm - Putih, Kemasan 5 Liter)',
  `satuan_jual_varian` ENUM('PCS', 'POT', 'BATANG', 'BUKET', 'GRAM', 'KILOGRAM', 'MILILITER', 'LITER', 'PAK', 'SET') NOT NULL DEFAULT 'PCS' COMMENT 'Satuan jual spesifik varian ini',
  `rasio_konversi_satuan_stok` DECIMAL(12,4) NOT NULL DEFAULT 1.0000 COMMENT 'Rasio konversi eksplisit terhadap satuan stok dasar bila berlaku (Bagian 27.2)',
  `harga_rupiah` BIGINT UNSIGNED NOT NULL COMMENT 'Harga jual normal varian dalam bilangan bulat rupiah',
  `harga_diskon_rupiah` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Harga diskon varian bila sedang dalam periode promo',
  `waktu_mulai_diskon` DATETIME NULL DEFAULT NULL COMMENT 'Waktu mulai diskon varian (UTC)',
  `waktu_selesai_diskon` DATETIME NULL DEFAULT NULL COMMENT 'Waktu selesai diskon varian (UTC)',
  `berat_gram` INT UNSIGNED NOT NULL COMMENT 'Berat spesifik varian dalam gram untuk tarif kurir',
  `panjang_milimeter` INT UNSIGNED NOT NULL COMMENT 'Panjang varian dalam milimeter',
  `lebar_milimeter` INT UNSIGNED NOT NULL COMMENT 'Lebar varian dalam milimeter',
  `tinggi_milimeter` INT UNSIGNED NOT NULL COMMENT 'Tinggi varian dalam milimeter',
  `jumlah_stok_varian` INT NOT NULL DEFAULT 0 COMMENT 'Total saldo stok jual varian lintas lokasi (tidak boleh negatif)',
  `ambang_stok_rendah` INT UNSIGNED NOT NULL DEFAULT 5 COMMENT 'Ambang peringatan stok rendah untuk varian ini',
  `status_varian_utama` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Penanda varian default saat halaman detail produk dibuka',
  `urutan_tampil` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Urutan penampilan pilihan varian pada halaman produk',
  `status_varian` ENUM('AKTIF', 'NONAKTIF') NOT NULL DEFAULT 'AKTIF' COMMENT 'Status aktif penjualan varian',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_varian_produk_sku` (`sku_varian`),
  KEY `idx_varian_produk_induk_status` (`produk_id`, `status_varian`, `urutan_tampil`),
  CONSTRAINT `fk_varian_produk_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan varian komersial/SKU produk (ukuran pot, volume media tanam, ukuran tanaman) beserta harga dan stoknya';

-- 12. Tabel: gambar_produk
-- Merepresentasikan galeri foto produk (wajib 1 sampai 8 foto per produk sesuai Bagian 5 & 12.2)
DROP TABLE IF EXISTS `gambar_produk`;
CREATE TABLE `gambar_produk` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal gambar produk',
  `produk_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi produk pemilik gambar',
  `varian_produk_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi varian spesifik bila foto mewakili warna/ukuran varian tertentu',
  `kunci_penyimpanan_berkas` VARCHAR(255) NOT NULL COMMENT 'Kunci berkas gambar di storage luar docroot (nama acak hasil re-encode SEC-09)',
  `teks_alternatif_seo` VARCHAR(150) NOT NULL COMMENT 'Teks alt gambar untuk aksesibilitas WCAG 2.1 AA (NFR-06) dan SEO',
  `urutan_tampil` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Urutan foto pada galeri produk (1 sampai 8)',
  `status_gambar_utama` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Penanda foto sampul utama produk di katalog',
  `lebar_piksel` INT UNSIGNED NULL DEFAULT NULL COMMENT 'Lebar dimensi gambar dalam piksel (maksimum 4000 px sesuai P-42)',
  `tinggi_piksel` INT UNSIGNED NULL DEFAULT NULL COMMENT 'Tinggi dimensi gambar dalam piksel (maksimum 4000 px sesuai P-42)',
  `ukuran_byte` INT UNSIGNED NULL DEFAULT NULL COMMENT 'Ukuran berkas dalam byte (maksimum 5 MB sesuai P-42)',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  PRIMARY KEY (`id`),
  KEY `idx_gambar_produk_urutan` (`produk_id`, `status_gambar_utama`, `urutan_tampil`),
  KEY `fk_gambar_produk_varian` (`varian_produk_id`),
  CONSTRAINT `fk_gambar_produk_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_gambar_produk_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan daftar foto galeri produk dan varian (1-8 foto per produk)';

-- 13. Tabel: atribut_produk
-- Merepresentasikan definisi atribut fleksibel untuk filter, spesifikasi deskriptif, maupun pembentuk varian (Bagian 27.2 & 27.4)
DROP TABLE IF EXISTS `atribut_produk`;
CREATE TABLE `atribut_produk` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal definisi atribut produk',
  `kode_atribut` VARCHAR(50) NOT NULL COMMENT 'Kode unik atribut (mis. UKURAN_POT, VOLUME_MEDIA, WARNA, KEBUTUHAN_CAHAYA, LUBANG_DRAINASE)',
  `nama_atribut` VARCHAR(100) NOT NULL COMMENT 'Nama tampilan atribut pada detail produk dan filter katalog',
  `tipe_data_atribut` ENUM('PILIHAN_TUNGGAL', 'PILIHAN_GANDA', 'ANGKA_DESIMAL', 'ANGKA_BULAT', 'TEKS_PENDEK', 'BOOLEAN') NOT NULL DEFAULT 'PILIHAN_TUNGGAL' COMMENT 'Tipe nilai atribut untuk validasi input server',
  `satuan_atribut` VARCHAR(30) NULL DEFAULT NULL COMMENT 'Satuan ukur atribut bila relevan (mis. cm, liter, kg, butir)',
  `dapat_menjadi_pembeda_varian` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Penanda apakah atribut ini boleh dipakai sebagai pembentuk varian SKU',
  `dapat_difilter_di_katalog` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Penanda apakah atribut ini muncul sebagai faset filter di katalog publik',
  `urutan_tampil` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Urutan penampilan atribut pada filter dan tabel spesifikasi',
  `status_aktif` ENUM('AKTIF', 'NONAKTIF') NOT NULL DEFAULT 'AKTIF' COMMENT 'Status aktif atribut',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_atribut_produk_kode` (`kode_atribut`),
  KEY `idx_atribut_produk_filter` (`status_aktif`, `dapat_difilter_di_katalog`, `urutan_tampil`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan master definisi atribut fleksibel untuk produk florist dan gardening goods';

-- 14. Tabel: pilihan_atribut_produk
-- Merepresentasikan daftar opsi terkontrol untuk atribut bertipe pilihan (mis. 15 cm, 20 cm, Keramik, Teduh) (Bagian 27.4)
DROP TABLE IF EXISTS `pilihan_atribut_produk`;
CREATE TABLE `pilihan_atribut_produk` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pilihan atribut',
  `atribut_produk_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi atribut induk pemilik opsi pilihan',
  `kode_pilihan` VARCHAR(50) NOT NULL COMMENT 'Kode mesin pilihan atribut',
  `nilai_tampil_pilihan` VARCHAR(100) NOT NULL COMMENT 'Label nilai yang ditampilkan kepada pengguna (mis. Diameter 15 cm, 5 Liter, Indoor Teduh)',
  `urutan_tampil` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Urutan tampilan opsi dalam atribut',
  `status_aktif` ENUM('AKTIF', 'NONAKTIF') NOT NULL DEFAULT 'AKTIF' COMMENT 'Status aktif opsi atribut',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pilihan_atribut_kode` (`atribut_produk_id`, `kode_pilihan`),
  KEY `idx_pilihan_atribut_urutan` (`atribut_produk_id`, `status_aktif`, `urutan_tampil`),
  CONSTRAINT `fk_pilihan_atribut_atribut` FOREIGN KEY (`atribut_produk_id`) REFERENCES `atribut_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan daftar pilihan nilai terkontrol untuk atribut produk seperti ukuran, warna, bahan, dan tingkat cahaya';

-- 15. Tabel: nilai_atribut_produk
-- Merepresentasikan nilai atribut deskriptif (spesifikasi non-varian) yang melekat pada suatu produk (Bagian 27.4)
DROP TABLE IF EXISTS `nilai_atribut_produk`;
CREATE TABLE `nilai_atribut_produk` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal nilai atribut produk',
  `produk_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi produk pemilik spesifikasi',
  `atribut_produk_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi definisi atribut',
  `pilihan_atribut_produk_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi opsi pilihan bila atribut bertipe pilihan terkontrol',
  `nilai_teks` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Nilai teks bebas bila atribut bertipe TEKS_PENDEK',
  `nilai_angka` DECIMAL(12,2) NULL DEFAULT NULL COMMENT 'Nilai numerik bila atribut bertipe ANGKA_DESIMAL atau ANGKA_BULAT',
  `nilai_boolean` TINYINT(1) NULL DEFAULT NULL COMMENT 'Nilai 1/0 bila atribut bertipe BOOLEAN (mis. Memiliki Lubang Drainase = 1)',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_nilai_atribut_produk_unik` (`produk_id`, `atribut_produk_id`, `pilihan_atribut_produk_id`),
  KEY `idx_nilai_atribut_produk_filter_opsi` (`atribut_produk_id`, `pilihan_atribut_produk_id`),
  KEY `fk_nilai_atribut_produk_pilihan` (`pilihan_atribut_produk_id`),
  CONSTRAINT `fk_nilai_atribut_produk_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_nilai_atribut_produk_atribut` FOREIGN KEY (`atribut_produk_id`) REFERENCES `atribut_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_nilai_atribut_produk_pilihan` FOREIGN KEY (`pilihan_atribut_produk_id`) REFERENCES `pilihan_atribut_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan nilai atribut spesifikasi deskriptif pada tingkat produk';

-- 16. Tabel: nilai_atribut_varian
-- Merepresentasikan kombinasi nilai atribut pembeda untuk setiap varian produk (Bagian 27.4)
DROP TABLE IF EXISTS `nilai_atribut_varian`;
CREATE TABLE `nilai_atribut_varian` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal nilai atribut varian',
  `varian_produk_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi varian produk',
  `atribut_produk_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi atribut pembeda varian (mis. Ukuran, Warna, Volume)',
  `pilihan_atribut_produk_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi nilai pilihan atribut untuk varian ini',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_nilai_atribut_varian_unik` (`varian_produk_id`, `atribut_produk_id`),
  KEY `idx_nilai_atribut_varian_pilihan` (`atribut_produk_id`, `pilihan_atribut_produk_id`),
  KEY `fk_nilai_atribut_varian_pilihan` (`pilihan_atribut_produk_id`),
  CONSTRAINT `fk_nilai_atribut_varian_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_nilai_atribut_varian_atribut` FOREIGN KEY (`atribut_produk_id`) REFERENCES `atribut_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_nilai_atribut_varian_pilihan` FOREIGN KEY (`pilihan_atribut_produk_id`) REFERENCES `pilihan_atribut_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan kombinasi atribut yang membedakan satu varian produk dari varian lainnya';

-- 17. Tabel: komponen_paket_berkebun
-- Merepresentasikan susunan item komponen penyusun untuk produk berjenis PAKET_BERKEBUN / starter kit (Bagian 27.1, 27.2, 27.3)
DROP TABLE IF EXISTS `komponen_paket_berkebun`;
CREATE TABLE `komponen_paket_berkebun` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal komponen paket berkebun',
  `produk_paket_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi produk induk yang berjenis PAKET_BERKEBUN',
  `produk_komponen_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi produk penyusun di dalam paket (mis. pot, media tanam, benih)',
  `varian_komponen_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi varian spesifik komponen bila produk komponen memiliki varian',
  `kuantitas_komponen` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Jumlah unit komponen yang dibutuhkan dalam 1 paket berkebun',
  `satuan_komponen` VARCHAR(30) NOT NULL DEFAULT 'PCS' COMMENT 'Satuan komponen penyusun paket',
  `catatan_komponen` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Keterangan peran komponen dalam paket starter kit',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_komponen_paket_berkebun_item` (`produk_paket_id`, `produk_komponen_id`, `varian_komponen_id`),
  KEY `fk_komponen_paket_produk_komponen` (`produk_komponen_id`),
  KEY `fk_komponen_paket_varian_komponen` (`varian_komponen_id`),
  CONSTRAINT `fk_komponen_paket_produk_paket` FOREIGN KEY (`produk_paket_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_komponen_paket_produk_komponen` FOREIGN KEY (`produk_komponen_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_komponen_paket_varian_komponen` FOREIGN KEY (`varian_komponen_id`) REFERENCES `varian_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan rincian komponen penyusun paket berkebun (starter kit) untuk alokasi stok komponen secara atomik';

-- =====================================================================================
-- DOMAIN 3: PERSEDIAAN BARANG DAGANGAN, LOKASI STOK, BATCH/FEFO & BUKU BESAR STOK PRODUK
-- =====================================================================================

-- 18. Tabel: lokasi_stok
-- Merepresentasikan master lokasi fisik penyimpanan barang dagangan dan bahan florist (Bagian 27.3 & 27.4)
DROP TABLE IF EXISTS `lokasi_stok`;
CREATE TABLE `lokasi_stok` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal lokasi stok',
  `kode_lokasi` VARCHAR(32) NOT NULL COMMENT 'Kode unik lokasi penyimpanan (mis. TOKO-UTAMA, GUDANG-KEBUN, NURSERY-01)',
  `nama_lokasi` VARCHAR(100) NOT NULL COMMENT 'Nama lengkap lokasi penyimpanan stok',
  `jenis_lokasi` ENUM('TOKO_UTAMA', 'GUDANG_PENYIMPANAN', 'RUMAH_KACA_NURSERY', 'STUDIO_FLORIST') NOT NULL DEFAULT 'TOKO_UTAMA' COMMENT 'Jenis fungsi lokasi persediaan',
  `alamat_lokasi` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Alamat fisik lokasi penyimpanan',
  `status_lokasi_default_jual` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Penanda lokasi utama pemenuhan pesanan pelanggan',
  `status_aktif` ENUM('AKTIF', 'NONAKTIF') NOT NULL DEFAULT 'AKTIF' COMMENT 'Status operasional lokasi stok',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lokasi_stok_kode` (`kode_lokasi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan master lokasi penyimpanan stok barang dagangan dan bahan produksi buket';

-- 19. Tabel: stok_varian_produk
-- Merepresentasikan saldo stok barang dagangan per produk/varian dan per lokasi penyimpanan (Bagian 27.3 & 27.4)
DROP TABLE IF EXISTS `stok_varian_produk`;
CREATE TABLE `stok_varian_produk` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal baris saldo stok lokasi',
  `produk_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi produk barang dagangan',
  `varian_produk_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi varian produk (NULL bila produk tunggal tanpa varian)',
  `lokasi_stok_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi lokasi penyimpanan stok',
  `jumlah_stok_saldo` INT NOT NULL DEFAULT 0 COMMENT 'Saldo fisik stok jual pada lokasi ini (konsisten dengan buku besar, tidak boleh negatif)',
  `jumlah_stok_direservasi` INT NOT NULL DEFAULT 0 COMMENT 'Jumlah unit yang sedang direservasi aktif (ACTIVE) untuk checkout online',
  `titik_pesan_ulang` INT UNSIGNED NOT NULL DEFAULT 5 COMMENT 'Ambang stok minimum lokasi sebelum perlu pengisian ulang',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan saldo terakhir dalam transaksi InnoDB (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_stok_varian_produk_lokasi` (`produk_id`, `varian_produk_id`, `lokasi_stok_id`),
  KEY `idx_stok_varian_lokasi` (`lokasi_stok_id`, `jumlah_stok_saldo`),
  KEY `fk_stok_varian_produk_varian` (`varian_produk_id`),
  CONSTRAINT `fk_stok_varian_produk_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_stok_varian_produk_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_stok_varian_produk_lokasi` FOREIGN KEY (`lokasi_stok_id`) REFERENCES `lokasi_stok` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan saldo stok jual dan stok tercadang per produk/varian pada setiap lokasi penyimpanan';

-- 20. Tabel: batch_persediaan
-- Merepresentasikan pencatatan nomor lot/batch dan tanggal kedaluwarsa (FEFO) untuk benih, pupuk, dan media tanam (Bagian 27.2 & 27.4)
DROP TABLE IF EXISTS `batch_persediaan`;
CREATE TABLE `batch_persediaan` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal batch persediaan',
  `produk_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi produk pemilik batch',
  `varian_produk_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi varian produk bila relevan',
  `lokasi_stok_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi lokasi penyimpanan batch',
  `nomor_kode_batch` VARCHAR(64) NOT NULL COMMENT 'Kode batch/lot dari produsen atau penerimaan barang',
  `tanggal_produksi_atau_emas` DATE NULL DEFAULT NULL COMMENT 'Tanggal produksi/pengemasan benih atau pupuk',
  `tanggal_kedaluwarsa` DATE NULL DEFAULT NULL COMMENT 'Tanggal kedaluwarsa untuk pengurutan FEFO (First Expired First Out)',
  `jumlah_awal_batch` INT UNSIGNED NOT NULL COMMENT 'Kuantitas awal saat batch diterima',
  `jumlah_tersisa_batch` INT NOT NULL DEFAULT 0 COMMENT 'Kuantitas tersisa pada batch ini (tidak boleh negatif)',
  `status_batch` ENUM('AKTIF', 'HABIS', 'KEDALUWARSA_DITARIK') NOT NULL DEFAULT 'AKTIF' COMMENT 'Status kelayakan jual batch persediaan',
  `catatan_batch` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Catatan kualitas atau uji daya tumbuh benih',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_batch_persediaan_kode_lokasi` (`produk_id`, `varian_produk_id`, `lokasi_stok_id`, `nomor_kode_batch`),
  KEY `idx_batch_persediaan_fefo` (`produk_id`, `status_batch`, `tanggal_kedaluwarsa`),
  KEY `fk_batch_persediaan_varian` (`varian_produk_id`),
  KEY `fk_batch_persediaan_lokasi` (`lokasi_stok_id`),
  CONSTRAINT `fk_batch_persediaan_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_batch_persediaan_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_batch_persediaan_lokasi` FOREIGN KEY (`lokasi_stok_id`) REFERENCES `lokasi_stok` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan informasi batch/lot dan tanggal kedaluwarsa (FEFO) untuk benih, pupuk, dan produk berkebun';

-- 21. Tabel: riwayat_perubahan_stok_produk
-- Merepresentasikan buku besar (ledger append-only) seluruh mutasi stok barang dagangan (Bagian 11.2, A.4, 26.7, 27.4)
DROP TABLE IF EXISTS `riwayat_perubahan_stok_produk`;
CREATE TABLE `riwayat_perubahan_stok_produk` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID urut entri buku besar stok produk',
  `produk_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi produk yang mengalami perubahan stok',
  `varian_produk_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi varian produk yang mengalami mutasi stok',
  `lokasi_stok_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi lokasi penyimpanan tempat mutasi terjadi',
  `batch_persediaan_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi batch persediaan bila produk memakai pelacakan FEFO',
  `jenis_mutasi_stok` ENUM('PENJUALAN', 'KOMIT_COD', 'PEMBATALAN_RESTOK', 'RETUR_LAYAK', 'BARANG_MASUK', 'PENYESUAIAN', 'BARANG_RUSAK_BUANG', 'TRANSFER_KELUAR', 'TRANSFER_MASUK', 'KONVERSI_KE_BAHAN_PRODUKSI') NOT NULL COMMENT 'Jenis entri buku besar stok sesuai Bagian 11.2 dan perluasan v2.6',
  `perubahan_kuantitas` INT NOT NULL COMMENT 'Jumlah perubahan stok (+ untuk penambahan, - untuk pengurangan, tidak boleh 0)',
  `saldo_setelah_mutasi` INT NOT NULL COMMENT 'Snapshot saldo stok produk/varian di lokasi tersebut tepat setelah mutasi',
  `jenis_referensi` VARCHAR(50) NOT NULL COMMENT 'Jenis sumber transaksi (PESANAN, PENGEMBALIAN_BARANG, PENERIMAAN_STOK, STOK_OPNAME, PEMUSNAHAN, TRANSFER_LOKASI)',
  `referensi_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'ID entitas sumber referensi (mis. pesanan.id)',
  `kunci_idempotensi` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Kunci unik penangkal pencatatan ganda mutasi stok pada satu peristiwa',
  `pelaku_akun_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun staf/pengguna pemicu mutasi (NULL jika oleh Sistem otomatis)',
  `disetujui_oleh_akun_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun SuperAdmin penyetuju untuk penyesuaian stok manual di atas P-23 (20 unit)',
  `alasan_mutasi` VARCHAR(500) NOT NULL COMMENT 'Alasan wajib setiap perubahan stok atau hasil checklist kelayakan retur (Bagian 11.4)',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pencatatan mutasi (UTC, append-only)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_riwayat_stok_produk_idempotensi` (`kunci_idempotensi`),
  KEY `idx_riwayat_stok_produk_waktu` (`produk_id`, `varian_produk_id`, `dibuat_pada`),
  KEY `idx_riwayat_stok_referensi` (`jenis_referensi`, `referensi_id`),
  KEY `fk_riwayat_stok_produk_varian` (`varian_produk_id`),
  KEY `fk_riwayat_stok_produk_lokasi` (`lokasi_stok_id`),
  KEY `fk_riwayat_stok_produk_batch` (`batch_persediaan_id`),
  KEY `fk_riwayat_stok_produk_pelaku` (`pelaku_akun_id`),
  KEY `fk_riwayat_stok_produk_penyetuju` (`disetujui_oleh_akun_id`),
  CONSTRAINT `fk_riwayat_stok_produk_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_riwayat_stok_produk_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_riwayat_stok_produk_lokasi` FOREIGN KEY (`lokasi_stok_id`) REFERENCES `lokasi_stok` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_riwayat_stok_produk_batch` FOREIGN KEY (`batch_persediaan_id`) REFERENCES `batch_persediaan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_riwayat_stok_produk_pelaku` FOREIGN KEY (`pelaku_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_riwayat_stok_produk_penyetuju` FOREIGN KEY (`disetujui_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Buku besar (ledger append-only) untuk seluruh perubahan stok barang dagangan florist dan gardening goods';

-- =====================================================================================
-- DOMAIN 4: KUSTOMISASI BUKET, BAHAN PRODUKSI FLORIST & BUKU BESAR BAHAN (BAGIAN 26 & 27)
-- =====================================================================================

-- 22. Tabel: bahan_produksi
-- Merepresentasikan master bahan baku perangkai buket yang terpisah dari stok barang dagangan (Bagian 11.1, 26.3, 27.3)
DROP TABLE IF EXISTS `bahan_produksi`;
CREATE TABLE `bahan_produksi` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal bahan produksi buket',
  `kode_bahan` VARCHAR(50) NOT NULL COMMENT 'Kode SKU unik bahan produksi florist (mis. BHN-MAWAR-MERAH, BHN-KERTAS-CELLO)',
  `nama_bahan` VARCHAR(150) NOT NULL COMMENT 'Nama bahan produksi (bunga potong, filler, wrapping paper, pita, floral foam, kartu)',
  `kelompok_bahan` ENUM('BUNGA_UTAMA', 'BUNGA_PENDAMPING_FILLER', 'DAUN_HIAS_FOLIAGE', 'KERTAS_PEMBUNGKUS', 'PITA_DAN_TALI', 'MEDIA_RANGKAI_FOAM', 'KARTU_DAN_AKSESORI') NOT NULL COMMENT 'Kelompok bahan produksi buket',
  `satuan_bahan` ENUM('TANGKAI', 'IKAT', 'LEMBAR', 'METER', 'PCS', 'BLOK', 'SET') NOT NULL DEFAULT 'TANGKAI' COMMENT 'Satuan ukur pemakaian bahan dalam perangkaian buket',
  `jenis_ketahanan_bahan` ENUM('SEGAR_MUDAH_LAYU', 'KERING_AWET', 'BAHAN_PENDUKUNG_MATI') NOT NULL DEFAULT 'SEGAR_MUDAH_LAYU' COMMENT 'Sifat ketahanan bahan untuk pemantauan kesegaran',
  `masa_simpan_hari` INT UNSIGNED NULL DEFAULT NULL COMMENT 'Perkiraan masa simpan bahan segar dalam hari',
  `biaya_pokok_satuan_rupiah` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Harga pokok rata-rata per satuan bahan dalam rupiah',
  `jumlah_stok_bahan` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Total saldo stok bahan produksi tersedia lintas lokasi (tidak boleh negatif)',
  `ambang_stok_rendah` DECIMAL(12,2) NOT NULL DEFAULT 10.00 COMMENT 'Ambang peringatan stok bahan produksi menipis',
  `status_aktif` ENUM('AKTIF', 'NONAKTIF') NOT NULL DEFAULT 'AKTIF' COMMENT 'Status ketersediaan bahan untuk kustomisasi dan produksi buket',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_bahan_produksi_kode` (`kode_bahan`),
  KEY `idx_bahan_produksi_kelompok_status` (`kelompok_bahan`, `status_aktif`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan master bahan baku produksi buket (terpisah dari stok barang dagangan sesuai Bagian 11.1 & 27.3)';

-- 23. Tabel: stok_bahan_produksi
-- Merepresentasikan saldo stok bahan produksi buket per lokasi penyimpanan (penyelarasan Bagian 26.3 & 27.4)
DROP TABLE IF EXISTS `stok_bahan_produksi`;
CREATE TABLE `stok_bahan_produksi` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal saldo bahan per lokasi',
  `bahan_produksi_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi bahan produksi buket',
  `lokasi_stok_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi lokasi penyimpanan bahan (mis. Studio Florist)',
  `jumlah_stok_saldo` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Saldo fisik bahan produksi pada lokasi ini',
  `jumlah_stok_dialokasikan` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Jumlah bahan yang telah dialokasikan untuk produksi buket pesanan aktif',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan saldo bahan terakhir (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_stok_bahan_produksi_lokasi` (`bahan_produksi_id`, `lokasi_stok_id`),
  KEY `fk_stok_bahan_produksi_lokasi` (`lokasi_stok_id`),
  CONSTRAINT `fk_stok_bahan_produksi_bahan` FOREIGN KEY (`bahan_produksi_id`) REFERENCES `bahan_produksi` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_stok_bahan_produksi_lokasi` FOREIGN KEY (`lokasi_stok_id`) REFERENCES `lokasi_stok` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan saldo stok bahan produksi buket pada setiap lokasi penyimpanan';

-- 24. Tabel: riwayat_perubahan_stok_bahan
-- Merepresentasikan buku besar (ledger append-only) perubahan stok bahan produksi buket (Bagian 26.3, 26.6, 27.4)
DROP TABLE IF EXISTS `riwayat_perubahan_stok_bahan`;
CREATE TABLE `riwayat_perubahan_stok_bahan` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID urut entri buku besar stok bahan produksi',
  `bahan_produksi_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi bahan produksi yang mengalami perubahan stok',
  `lokasi_stok_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi lokasi penyimpanan bahan',
  `jenis_mutasi_bahan` ENUM('PENERIMAAN_BAHAN', 'ALOKASI_PRODUKSI_BUKET', 'PEMAKAIAN_PRODUKSI_BUKET', 'PEMBATALAN_ALOKASI_BUKET', 'BAHAN_LAYU_RUSAK_BUANG', 'PENYESUAIAN_OPNAME_BAHAN', 'KONVERSI_DARI_BARANG_DAGANGAN') NOT NULL COMMENT 'Jenis transaksi perubahan stok bahan produksi',
  `perubahan_kuantitas` DECIMAL(12,2) NOT NULL COMMENT 'Nilai perubahan kuantitas bahan (+ atau -, tidak boleh 0)',
  `saldo_setelah_mutasi` DECIMAL(12,2) NOT NULL COMMENT 'Snapshot saldo stok bahan pada lokasi tersebut setelah mutasi',
  `jenis_referensi` VARCHAR(50) NOT NULL COMMENT 'Jenis objek pemicu (PESANAN, PRODUKSI_BUKET, PENERIMAAN_SUPPLIER, OPNAME_BAHAN)',
  `referensi_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'ID objek referensi terkait (mis. pesanan.id atau produksi_buket_pesanan.id)',
  `kunci_idempotensi` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Kunci idempotensi pencegah pengurangan stok bahan ganda',
  `pelaku_akun_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun staf/sistem yang mencatat mutasi bahan',
  `alasan_mutasi` VARCHAR(500) NOT NULL COMMENT 'Alasan wajib mutasi atau catatan kondisi kesegaran bahan',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pencatatan mutasi bahan (UTC, append-only)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_riwayat_stok_bahan_idempotensi` (`kunci_idempotensi`),
  KEY `idx_riwayat_stok_bahan_waktu` (`bahan_produksi_id`, `dibuat_pada`),
  KEY `idx_riwayat_stok_bahan_referensi` (`jenis_referensi`, `referensi_id`),
  KEY `fk_riwayat_stok_bahan_lokasi` (`lokasi_stok_id`),
  KEY `fk_riwayat_stok_bahan_pelaku` (`pelaku_akun_id`),
  CONSTRAINT `fk_riwayat_stok_bahan_bahan` FOREIGN KEY (`bahan_produksi_id`) REFERENCES `bahan_produksi` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_riwayat_stok_bahan_lokasi` FOREIGN KEY (`lokasi_stok_id`) REFERENCES `lokasi_stok` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_riwayat_stok_bahan_pelaku` FOREIGN KEY (`pelaku_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Buku besar (ledger append-only) untuk seluruh mutasi stok bahan produksi buket';

-- 25. Tabel: kategori_pilihan_buket
-- Merepresentasikan kelompok/kategori opsi kustomisasi buket (Bagian 26.3 & 26.4)
DROP TABLE IF EXISTS `kategori_pilihan_buket`;
CREATE TABLE `kategori_pilihan_buket` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal kategori pilihan kustomisasi buket',
  `kode_kategori_pilihan` VARCHAR(50) NOT NULL COMMENT 'Kode unik kelompok pilihan (mis. BUNGA_UTAMA, WARNA_WRAP, PITA, HIASAN_TAMBAHAN)',
  `nama_kategori_pilihan` VARCHAR(100) NOT NULL COMMENT 'Nama kelompok opsi yang tampil di layar kustomisasi buket',
  `deskripsi_panduan_pilih` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Petunjuk pemilihan opsi bagi pelanggan',
  `jenis_pemilihan` ENUM('PILIH_SATU', 'PILIH_BANYAK') NOT NULL DEFAULT 'PILIH_SATU' COMMENT 'Apakah pelanggan memilih tepat satu opsi atau kombinasi beberapa opsi',
  `wajib_dipilih_default` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Penanda default apakah kategori opsi ini wajib diisi',
  `batas_minimum_pilihan_default` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Jumlah minimum kuantitas/opsi yang dipilih pada kelompok ini',
  `batas_maksimum_pilihan_default` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Jumlah maksimum kuantitas/opsi yang boleh dipilih pada kelompok ini',
  `urutan_tampil` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Urutan langkah pemilihan pada antarmuka kustomisasi buket',
  `status_aktif` ENUM('AKTIF', 'NONAKTIF') NOT NULL DEFAULT 'AKTIF' COMMENT 'Status aktif kategori pilihan buket',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_kategori_pilihan_buket_kode` (`kode_kategori_pilihan`),
  KEY `idx_kategori_pilihan_buket_urutan` (`status_aktif`, `urutan_tampil`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan kelompok/kategori opsi kustomisasi buket (bunga utama, pembungkus, pita, tambahan)';

-- 26. Tabel: opsi_pilihan_buket
-- Merepresentasikan daftar pilihan spesifik di dalam setiap kategori pilihan buket (Bagian 26.3 & 26.4)
DROP TABLE IF EXISTS `opsi_pilihan_buket`;
CREATE TABLE `opsi_pilihan_buket` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal opsi pilihan buket',
  `kategori_pilihan_buket_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi kategori pilihan buket induk (sesuai Bagian 26.4)',
  `kode_opsi` VARCHAR(50) NOT NULL COMMENT 'Kode unik opsi pilihan buket',
  `nama_opsi` VARCHAR(120) NOT NULL COMMENT 'Nama opsi pilihan (mis. Mawar Merah Premium, Kertas Cellophane Sage Green)',
  `deskripsi_opsi` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Keterangan singkat karakteristik opsi buket',
  `tambahan_harga_rupiah` BIGINT NOT NULL DEFAULT 0 COMMENT 'Penyesuaian harga per unit opsi dalam bilangan bulat rupiah (dihitung di server, Bagian 26.2)',
  `batas_maksimum_kuantitas_per_buket` INT UNSIGNED NOT NULL DEFAULT 10 COMMENT 'Batas maksimum kuantitas opsi ini di dalam satu buket kustom',
  `kunci_gambar_pratinjau` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Kunci berkas gambar untuk pratinjau visual kustomisasi buket',
  `urutan_tampil` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Urutan tampil opsi di dalam kategorinya',
  `status_aktif` ENUM('AKTIF', 'NONAKTIF') NOT NULL DEFAULT 'AKTIF' COMMENT 'Status aktif opsi pilihan buket',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_opsi_pilihan_buket_kode` (`kode_opsi`),
  KEY `idx_opsi_pilihan_buket_kategori` (`kategori_pilihan_buket_id`, `status_aktif`, `urutan_tampil`),
  CONSTRAINT `fk_opsi_pilihan_buket_kategori` FOREIGN KEY (`kategori_pilihan_buket_id`) REFERENCES `kategori_pilihan_buket` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan daftar pilihan opsi kustomisasi buket beserta tambahan harga satuannya';

-- 27. Tabel: kategori_pilihan_produk
-- Merepresentasikan penghubung antara produk buket dengan kategori pilihan yang diizinkan pada produk tersebut (Bagian 26.3)
DROP TABLE IF EXISTS `kategori_pilihan_produk`;
CREATE TABLE `kategori_pilihan_produk` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pemetaan kategori pilihan ke produk',
  `produk_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi produk buket yang mendukung kustomisasi',
  `kategori_pilihan_buket_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi kategori pilihan buket yang diizinkan (sesuai Bagian 26.4)',
  `wajib_dipilih` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Apakah kategori opsi ini wajib dipilih pada produk tersebut',
  `batas_minimum_pilihan` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Jumlah minimum pilihan/kuantitas untuk produk ini',
  `batas_maksimum_pilihan` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Jumlah maksimum pilihan/kuantitas untuk produk ini',
  `urutan_tampil` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Urutan langkah kustomisasi khusus pada produk ini',
  `status_aktif` ENUM('AKTIF', 'NONAKTIF') NOT NULL DEFAULT 'AKTIF' COMMENT 'Status aktif keterkaitan kategori opsi dengan produk',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_kategori_pilihan_produk_pasangan` (`produk_id`, `kategori_pilihan_buket_id`),
  KEY `fk_kategori_pilihan_produk_kategori_buket` (`kategori_pilihan_buket_id`),
  CONSTRAINT `fk_kategori_pilihan_produk_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_kategori_pilihan_produk_kategori_buket` FOREIGN KEY (`kategori_pilihan_buket_id`) REFERENCES `kategori_pilihan_buket` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menghubungkan produk buket kustom dengan kategori pilihan yang boleh dikonfigurasi pelanggan';

-- 28. Tabel: kebutuhan_bahan_opsi_buket
-- Merepresentasikan pemetaan setiap opsi pilihan buket ke kebutuhan bahan produksi dan kuantitasnya (Bagian 26.3 & 26.4)
DROP TABLE IF EXISTS `kebutuhan_bahan_opsi_buket`;
CREATE TABLE `kebutuhan_bahan_opsi_buket` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pemetaan kebutuhan bahan opsi buket',
  `opsi_pilihan_buket_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi opsi pilihan buket (sesuai Bagian 26.4)',
  `bahan_produksi_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi bahan produksi yang dibutuhkan oleh opsi ini (sesuai Bagian 26.4)',
  `kuantitas_bahan_per_opsi` DECIMAL(10,2) NOT NULL DEFAULT 1.00 COMMENT 'Jumlah bahan produksi yang terpakai setiap 1 unit opsi dipilih',
  `persentase_cadangan_susut` DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Persentase toleransi susut bahan bila diperlukan',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_kebutuhan_bahan_opsi_pasangan` (`opsi_pilihan_buket_id`, `bahan_produksi_id`),
  KEY `fk_kebutuhan_bahan_opsi_bahan` (`bahan_produksi_id`),
  CONSTRAINT `fk_kebutuhan_bahan_opsi_opsi` FOREIGN KEY (`opsi_pilihan_buket_id`) REFERENCES `opsi_pilihan_buket` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_kebutuhan_bahan_opsi_bahan` FOREIGN KEY (`bahan_produksi_id`) REFERENCES `bahan_produksi` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Memetakan setiap opsi pilihan buket ke jenis dan kuantitas bahan produksi yang diperlukan';

-- 29. Tabel: resep_buket
-- Merepresentasikan resep komposisi bahan dasar untuk produk buket standar maupun template buket per ukuran/varian (Bagian 27.3 & 27.4)
DROP TABLE IF EXISTS `resep_buket`;
CREATE TABLE `resep_buket` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal resep dasar buket',
  `produk_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi produk buket',
  `varian_produk_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi varian ukuran buket (mis. Small, Medium, Large) bila ada',
  `kode_resep` VARCHAR(50) NOT NULL COMMENT 'Kode unik resep buket',
  `nama_resep` VARCHAR(150) NOT NULL COMMENT 'Nama resep perangkaian buket untuk panduan staf florist',
  `estimasi_waktu_rangkai_menit` INT UNSIGNED NOT NULL DEFAULT 30 COMMENT 'Estimasi durasi perangkaian satu buket dalam menit',
  `instruksi_perangkaian` TEXT NULL DEFAULT NULL COMMENT 'Langkah teknis standar perangkaian bagi staf produksi',
  `status_aktif` ENUM('AKTIF', 'NONAKTIF') NOT NULL DEFAULT 'AKTIF' COMMENT 'Status aktif resep buket',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_resep_buket_kode` (`kode_resep`),
  UNIQUE KEY `uk_resep_buket_produk_varian` (`produk_id`, `varian_produk_id`),
  KEY `fk_resep_buket_varian` (`varian_produk_id`),
  CONSTRAINT `fk_resep_buket_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_resep_buket_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan master resep dasar komposisi buket per produk/varian untuk perhitungan bahan produksi';

-- 30. Tabel: detail_resep_buket
-- Merepresentasikan rincian bahan produksi dasar yang dibutuhkan oleh suatu resep buket (Bagian 27.4)
DROP TABLE IF EXISTS `detail_resep_buket`;
CREATE TABLE `detail_resep_buket` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal detail resep buket',
  `resep_buket_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi resep buket induk',
  `bahan_produksi_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi bahan produksi yang digunakan',
  `kuantitas_bahan` DECIMAL(10,2) NOT NULL COMMENT 'Kuantitas bahan yang dibutuhkan untuk 1 unit buket sesuai resep',
  `catatan_pemakaian` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Catatan posisi atau teknik rangkai komponen bahan',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_detail_resep_buket_bahan` (`resep_buket_id`, `bahan_produksi_id`),
  KEY `fk_detail_resep_buket_bahan` (`bahan_produksi_id`),
  CONSTRAINT `fk_detail_resep_buket_resep` FOREIGN KEY (`resep_buket_id`) REFERENCES `resep_buket` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detail_resep_buket_bahan` FOREIGN KEY (`bahan_produksi_id`) REFERENCES `bahan_produksi` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan rincian kuantitas bahan produksi untuk setiap resep dasar buket';

-- =====================================================================================
-- DOMAIN 5: KERANJANG BELANJA, KONFIGURASI BUKET KERANJANG, WISHLIST & JADWAL KURIR
-- =====================================================================================

-- 31. Tabel: keranjang
-- Merepresentasikan keranjang belanja pelanggan (tidak mengurangi stok, retensi 30 hari tanpa aktivitas sesuai P-25)
DROP TABLE IF EXISTS `keranjang`;
CREATE TABLE `keranjang` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal keranjang belanja',
  `akun_pengguna_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun pelanggan pemilik keranjang (nullable untuk sinkronisasi keranjang tamu sebelum digabung, Bagian 26.5)',
  `token_keranjang_tamu` CHAR(64) NULL DEFAULT NULL COMMENT 'Hash pengenal sesi keranjang tamu sebelum digabung ke akun saat login',
  `status_keranjang` ENUM('AKTIF', 'DIGABUNGKAN', 'DIKONVERSI_PESANAN', 'KEDALUWARSA') NOT NULL DEFAULT 'AKTIF' COMMENT 'Status siklus hidup keranjang belanja',
  `waktu_aktivitas_terakhir` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu perubahan isi keranjang terakhir untuk pembersihan otomatis P-25',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_keranjang_token_tamu` (`token_keranjang_tamu`),
  KEY `idx_keranjang_akun_status` (`akun_pengguna_id`, `status_keranjang`),
  KEY `idx_keranjang_retensi` (`status_keranjang`, `waktu_aktivitas_terakhir`),
  CONSTRAINT `fk_keranjang_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan header keranjang belanja pelanggan (harga tidak disimpan permanen dan stok tidak dicadangkan di keranjang)';

-- 32. Tabel: item_keranjang_belanja
-- Merepresentasikan baris item produk/varian di dalam keranjang belanja (mendukung satu produk dengan konfigurasi buket berbeda, Bagian 26.2 & 26.8)
DROP TABLE IF EXISTS `item_keranjang_belanja`;
CREATE TABLE `item_keranjang_belanja` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal baris item keranjang belanja',
  `keranjang_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi keranjang belanja induk',
  `produk_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi produk yang dimasukkan ke keranjang',
  `varian_produk_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi varian produk yang dipilih (wajib jika produk memiliki varian, Bagian 27.5)',
  `hash_sidik_konfigurasi` CHAR(64) NOT NULL DEFAULT 'STANDAR' COMMENT 'Hash unik kombinasi varian + konfigurasi buket agar produk yang sama dengan kustomisasi berbeda tidak tertolak indeks unik (Bagian 26.2 & 26.8)',
  `kuantitas` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Jumlah unit produk dalam satuan jual (maksimum 20 unit/produk sesuai P-05)',
  `satuan_jual_saat_ini` VARCHAR(30) NOT NULL DEFAULT 'PCS' COMMENT 'Satuan jual eksplisit yang tampil di keranjang (Bagian 27.2)',
  `catatan_item` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Catatan khusus pelanggan untuk baris item ini',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu penambahan item ke keranjang (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu perubahan kuantitas/konfigurasi terakhir (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_item_keranjang_produk_varian_konfigurasi` (`keranjang_id`, `produk_id`, `varian_produk_id`, `hash_sidik_konfigurasi`),
  KEY `fk_item_keranjang_produk` (`produk_id`),
  KEY `fk_item_keranjang_varian` (`varian_produk_id`),
  CONSTRAINT `fk_item_keranjang_keranjang` FOREIGN KEY (`keranjang_id`) REFERENCES `keranjang` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_item_keranjang_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_item_keranjang_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan baris item produk dan varian di keranjang belanja dengan dukungan multi-konfigurasi buket kustom';

-- 33. Tabel: konfigurasi_buket_keranjang
-- Merepresentasikan konfigurasi buket kustom yang sedang dirancang pada baris item keranjang belanja (Bagian 26.3 & 26.4)
DROP TABLE IF EXISTS `konfigurasi_buket_keranjang`;
CREATE TABLE `konfigurasi_buket_keranjang` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal konfigurasi buket di keranjang',
  `item_keranjang_belanja_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi baris item keranjang belanja (sesuai Bagian 26.4)',
  `nama_label_buket_pelanggan` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Nama julukan buket kustom yang diberikan pelanggan bila ada',
  `tema_warna_dominan` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Tema nuansa warna pilihan pelanggan (mis. Pastel Pink, Sage Botanical)',
  `pesan_kartu_ucapan_buket` VARCHAR(200) NULL DEFAULT NULL COMMENT 'Isi kartu ucapan khusus untuk buket ini (maks 200 karakter, P-10)',
  `nama_pengirim_kartu_buket` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Nama pengirim pada kartu ucapan buket (boleh kosong untuk anonim)',
  `catatan_perangkai` VARCHAR(300) NULL DEFAULT NULL COMMENT 'Instruksi preferensi rangkaian untuk florist',
  `estimasi_tambahan_harga_opsi_rupiah` BIGINT NOT NULL DEFAULT 0 COMMENT 'Total tambahan harga opsi saat terakhir dihitung server (wajib dihitung ulang saat checkout)',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_konfigurasi_buket_keranjang_item` (`item_keranjang_belanja_id`),
  CONSTRAINT `fk_konfigurasi_buket_keranjang_item` FOREIGN KEY (`item_keranjang_belanja_id`) REFERENCES `item_keranjang_belanja` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan header konfigurasi buket kustom yang masih berada di dalam keranjang belanja';

-- 34. Tabel: pilihan_buket_keranjang
-- Merepresentasikan rincian opsi kustomisasi buket yang dipilih pada konfigurasi keranjang (Bagian 26.3 & 26.4)
DROP TABLE IF EXISTS `pilihan_buket_keranjang`;
CREATE TABLE `pilihan_buket_keranjang` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pilihan opsi buket di keranjang',
  `konfigurasi_buket_keranjang_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi konfigurasi buket keranjang (sesuai Bagian 26.4)',
  `kategori_pilihan_buket_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi kategori pilihan buket (sesuai Bagian 26.4)',
  `opsi_pilihan_buket_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi opsi pilihan buket yang dipilih pelanggan (sesuai Bagian 26.4)',
  `kuantitas_opsi` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Jumlah unit opsi yang dipilih di dalam satu buket',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pilihan_buket_keranjang_opsi` (`konfigurasi_buket_keranjang_id`, `opsi_pilihan_buket_id`),
  KEY `fk_pilihan_buket_keranjang_kategori` (`kategori_pilihan_buket_id`),
  KEY `fk_pilihan_buket_keranjang_opsi` (`opsi_pilihan_buket_id`),
  CONSTRAINT `fk_pilihan_buket_keranjang_konfigurasi` FOREIGN KEY (`konfigurasi_buket_keranjang_id`) REFERENCES `konfigurasi_buket_keranjang` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pilihan_buket_keranjang_kategori` FOREIGN KEY (`kategori_pilihan_buket_id`) REFERENCES `kategori_pilihan_buket` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_pilihan_buket_keranjang_opsi` FOREIGN KEY (`opsi_pilihan_buket_id`) REFERENCES `opsi_pilihan_buket` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan daftar rincian opsi kustomisasi buket yang dipilih pelanggan saat masih di keranjang';

-- 35. Tabel: daftar_keinginan
-- Merepresentasikan daftar produk impian (wishlist) milik pelanggan terdaftar (Bagian 26.7 & 27.6 P3)
DROP TABLE IF EXISTS `daftar_keinginan`;
CREATE TABLE `daftar_keinginan` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal daftar keinginan pelanggan',
  `akun_pengguna_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi akun pelanggan pemilik daftar keinginan',
  `nama_daftar` VARCHAR(100) NOT NULL DEFAULT 'Favorit Saya' COMMENT 'Nama koleksi daftar keinginan',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_daftar_keinginan_akun_nama` (`akun_pengguna_id`, `nama_daftar`),
  CONSTRAINT `fk_daftar_keinginan_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan koleksi daftar keinginan (wishlist) milik pelanggan';

-- 36. Tabel: item_daftar_keinginan
-- Merepresentasikan produk/varian yang disimpan pelanggan di dalam daftar keinginan (Bagian 26.7)
DROP TABLE IF EXISTS `item_daftar_keinginan`;
CREATE TABLE `item_daftar_keinginan` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal item daftar keinginan',
  `daftar_keinginan_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi daftar keinginan induk',
  `produk_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi produk yang disimpan',
  `varian_produk_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi varian produk bila pelanggan menyimpan varian spesifik',
  `catatan_keinginan` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Catatan pribadi pelanggan mengenai produk tersebut',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu produk ditambahkan ke daftar keinginan (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_item_daftar_keinginan_unik` (`daftar_keinginan_id`, `produk_id`, `varian_produk_id`),
  KEY `fk_item_daftar_keinginan_produk` (`produk_id`),
  KEY `fk_item_daftar_keinginan_varian` (`varian_produk_id`),
  CONSTRAINT `fk_item_daftar_keinginan_daftar` FOREIGN KEY (`daftar_keinginan_id`) REFERENCES `daftar_keinginan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_item_daftar_keinginan_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_item_daftar_keinginan_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan daftar produk dan varian di dalam daftar keinginan (wishlist) pelanggan';

-- 37. Tabel: slot_pengiriman
-- Merepresentasikan jadwal rentang waktu pengiriman harian (PAGI 08-12, SIANG 12-16, SORE 16-20 WIB sesuai P-08)
DROP TABLE IF EXISTS `slot_pengiriman`;
CREATE TABLE `slot_pengiriman` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal slot pengiriman',
  `kode_slot` ENUM('PAGI', 'SIANG', 'SORE') NOT NULL COMMENT 'Kode mesin slot pengiriman sesuai Lampiran A.3',
  `nama_tampil_slot` VARCHAR(100) NOT NULL COMMENT 'Label tampilan slot pengiriman (mis. Pagi 08:00 - 12:00 WIB)',
  `jam_mulai_wib` TIME NOT NULL COMMENT 'Jam mulai slot dalam Waktu Indonesia Barat (WIB)',
  `jam_selesai_wib` TIME NOT NULL COMMENT 'Jam berakhir slot dalam Waktu Indonesia Barat (WIB)',
  `lead_time_minimum_jam` INT UNSIGNED NOT NULL DEFAULT 4 COMMENT 'Batas waktu pemesanan minimum sebelum jam mulai slot (default P-06 = 4 jam)',
  `kuota_maksimum_pesanan_harian` INT UNSIGNED NOT NULL DEFAULT 50 COMMENT 'Kapasitas maksimum pesanan mudah layu pada slot ini per hari (D-07)',
  `urutan_tampil` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Urutan penampilan slot saat checkout',
  `status_aktif` ENUM('AKTIF', 'NONAKTIF') NOT NULL DEFAULT 'AKTIF' COMMENT 'Status aktif slot pengiriman',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_slot_pengiriman_kode` (`kode_slot`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan konfigurasi slot waktu pengiriman harian (PAGI, SIANG, SORE) beserta kuota dan lead time';

-- 38. Tabel: tanggal_tutup
-- Merepresentasikan kalender hari tutup operasional toko yang tidak dapat dipilih sebagai tanggal kirim (Bagian 5, 12.6, A.4)
DROP TABLE IF EXISTS `tanggal_tutup`;
CREATE TABLE `tanggal_tutup` (
  `tanggal_libur` DATE NOT NULL COMMENT 'Tanggal toko tutup (Primary Key sesuai Lampiran A.4 closed_dates)',
  `keterangan_tutup` VARCHAR(255) NOT NULL COMMENT 'Alasan atau nama hari libur tutup operasional toko',
  `ditetapkan_oleh_akun_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun Admin/SuperAdmin yang menetapkan tanggal tutup',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  PRIMARY KEY (`tanggal_libur`),
  KEY `fk_tanggal_tutup_ditetapkan_oleh` (`ditetapkan_oleh_akun_id`),
  CONSTRAINT `fk_tanggal_tutup_ditetapkan_oleh` FOREIGN KEY (`ditetapkan_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan kalender tanggal tutup toko untuk memblokir pemilihan jadwal pengiriman saat checkout';

-- 39. Tabel: zona_layanan_kurir
-- Merepresentasikan jangkauan wilayah, penyedia kurir, kategori layanan (Instan/Same-Day vs Reguler), dan tarif (D-06, Bagian 26.7)
DROP TABLE IF EXISTS `zona_layanan_kurir`;
CREATE TABLE `zona_layanan_kurir` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal zona dan layanan kurir',
  `kode_kurir` VARCHAR(50) NOT NULL COMMENT 'Kode penyedia kurir (mis. GOSEND, GRABEXPRESS, JNE, SICEPAT)',
  `nama_kurir` VARCHAR(100) NOT NULL COMMENT 'Nama perusahaan kurir pengiriman',
  `kode_layanan` VARCHAR(50) NOT NULL COMMENT 'Kode layanan spesifik kurir (mis. INSTANT, SAME_DAY, REG)',
  `nama_layanan` VARCHAR(100) NOT NULL COMMENT 'Nama layanan pengiriman yang ditampilkan saat checkout',
  `kategori_kecepatan_layanan` ENUM('INSTAN', 'SAME_DAY', 'REGULER_EKSPEDISI') NOT NULL COMMENT 'Kategori layanan untuk validasi produk MUDAH_LAYU (wajib INSTAN/SAME_DAY sesuai D-06 & BR-14)',
  `mendukung_produk_mudah_layu` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Penanda apakah layanan ini boleh membawa Produk Mudah Layu',
  `mendukung_pembayaran_cod` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Penanda apakah layanan kurir di zona ini mendukung metode COD (D-16)',
  `provinsi_tujuan` VARCHAR(100) NOT NULL COMMENT 'Provinsi cakupan wilayah pengiriman',
  `kota_kabupaten_tujuan` VARCHAR(100) NOT NULL COMMENT 'Kota atau kabupaten cakupan pengiriman',
  `kecamatan_tujuan` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Kecamatan spesifik (NULL bila berlaku untuk seluruh kota/kabupaten)',
  `kode_pos_tujuan` CHAR(5) NULL DEFAULT NULL COMMENT 'Kode pos spesifik bila pembatasan dilakukan per kode pos',
  `tarif_dasar_per_kg_rupiah` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Tarif dasar pengiriman per kilogram dalam bilangan bulat rupiah',
  `berat_maksimum_gram` INT UNSIGNED NOT NULL DEFAULT 20000 COMMENT 'Batas berat paket maksimum yang diizinkan layanan kurir (gram)',
  `estimasi_waktu_tiba` VARCHAR(50) NOT NULL DEFAULT '1-2 Hari' COMMENT 'Informasi estimasi waktu pengantaran (mis. 2-4 Jam, Hari yang Sama, 1-3 Hari)',
  `status_aktif` ENUM('AKTIF', 'NONAKTIF') NOT NULL DEFAULT 'AKTIF' COMMENT 'Status aktif layanan kurir pada zona ini',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_zona_layanan_kurir_wilayah` (`kode_kurir`, `kode_layanan`, `provinsi_tujuan`, `kota_kabupaten_tujuan`, `kecamatan_tujuan`, `kode_pos_tujuan`),
  KEY `idx_zona_kurir_pencarian` (`status_aktif`, `kota_kabupaten_tujuan`, `mendukung_produk_mudah_layu`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan cakupan wilayah layanan kurir, kelayakan untuk Produk Mudah Layu, dukungan COD, dan tarif dasar';

-- =====================================================================================
-- DOMAIN 6: PESANAN, SNAPSHOT ITEM, RESERVASI STOK, PRODUKSI BUKET & RIWAYAT STATUS
-- =====================================================================================

-- 40. Tabel: pesanan
-- Merepresentasikan transaksi utama pesanan pelanggan, status pesanan/pembayaran, snapshot alamat, dan jadwal kirim (Bagian 5, 6.4, 8, A.4)
DROP TABLE IF EXISTS `pesanan`;
CREATE TABLE `pesanan` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pesanan',
  `nomor_pesanan` VARCHAR(20) NOT NULL COMMENT 'Nomor pesanan unik acak format RV-YYMMDD-XXXXXX (BR-22, Bagian 6.4)',
  `kunci_idempotensi_checkout` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Header Idempotency-Key saat pembuatan pesanan POST /orders (Lampiran A.7 & A.11)',
  `akun_pengguna_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi akun pelanggan pemilik pesanan (sesuai Bagian 26.4)',
  `status_pesanan` ENUM('MENUNGGU_PEMBAYARAN', 'SIAP_DIPROSES', 'SEDANG_DISIAPKAN', 'DIKIRIM', 'TERKIRIM', 'SELESAI', 'DIBATALKAN', 'PERLU_PENANGANAN') NOT NULL DEFAULT 'MENUNGGU_PEMBAYARAN' COMMENT 'Status dimensi pesanan sesuai Lampiran A.3 dan tabel transisi 8.7',
  `status_pembayaran` ENUM('MENUNGGU', 'BERHASIL', 'PERLU_DITINJAU', 'GAGAL', 'KEDALUWARSA', 'DIBATALKAN', 'REFUND_DIPROSES', 'DIKEMBALIKAN_SEBAGIAN', 'DIKEMBALIKAN_PENUH', 'SENGKETA') NOT NULL DEFAULT 'MENUNGGU' COMMENT 'Status dimensi pembayaran tingkat pesanan (Bagian 8.2 & A.3)',
  `metode_pembayaran_utama` ENUM('QRIS', 'E_WALLET', 'TRANSFER_BANK', 'VIRTUAL_ACCOUNT', 'KARTU_KREDIT_DEBIT', 'COD') NOT NULL DEFAULT 'QRIS' COMMENT 'Metode pembayaran yang dipilih pelanggan saat checkout (D-16, P-40)',
  `status_adalah_cod` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Penanda apakah pesanan menggunakan metode COD (T-20, Bagian 11.A.1)',
  `alasan_pembatalan_kode` ENUM('KEDALUWARSA', 'PELANGGAN', 'ADMIN', 'TOKO') NULL DEFAULT NULL COMMENT 'Kode alasan pembatalan wajib saat status_pesanan = DIBATALKAN (Lampiran A.3)',
  `keterangan_pembatalan` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Penjelasan tertulis alasan pembatalan pesanan',
  `kode_perlu_penanganan` ENUM('PH_01', 'PH_02', 'PH_03', 'PH_04', 'PH_05', 'PH_06', 'PH_07') NULL DEFAULT NULL COMMENT 'Kode alasan wajib saat status_pesanan = PERLU_PENANGANAN (Bagian 8.5 & BR-24)',
  `status_sebelum_penanganan` ENUM('MENUNGGU_PEMBAYARAN', 'SIAP_DIPROSES', 'SEDANG_DISIAPKAN', 'DIKIRIM', 'TERKIRIM', 'SELESAI', 'DIBATALKAN') NULL DEFAULT NULL COMMENT 'Status pesanan sebelum masuk ke PERLU_PENANGANAN untuk keperluan transisi T-14/T-18',
  `pemilik_penanganan_akun_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun Admin yang bertanggung jawab menangani kasus PH-xx (BR-24)',
  `batas_waktu_tindakan_awal_ph` DATETIME NULL DEFAULT NULL COMMENT 'Batas waktu mulai penanganan awal oleh Admin (P-15 = 2 jam operasional)',
  `batas_waktu_keputusan_ph` DATETIME NULL DEFAULT NULL COMMENT 'Batas waktu respons pelanggan atau keputusan pemulihan sebelum refund otomatis (P-16 = 24 jam)',
  `snapshot_alamat_pengiriman` JSON NOT NULL COMMENT 'Snapshot lengkap alamat penerima (nama, telepon, jalan, kelurahan, kecamatan, kota, provinsi, kode pos, patokan, lat, lng) saat pesanan dibuat (BR-13)',
  `mengandung_produk_mudah_layu` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Penanda apakah pesanan berisi minimal satu Produk Mudah Layu (wajib slot & kurir instan/same-day)',
  `tanggal_pengiriman` DATE NULL DEFAULT NULL COMMENT 'Tanggal pengiriman yang dipilih pelanggan (wajib untuk Produk Mudah Layu)',
  `slot_pengiriman_kode` ENUM('PAGI', 'SIANG', 'SORE') NULL DEFAULT NULL COMMENT 'Slot waktu pengiriman (PAGI, SIANG, SORE sesuai P-08)',
  `kode_kurir_pilihan` VARCHAR(50) NOT NULL COMMENT 'Kode penyedia kurir yang dipilih saat checkout',
  `layanan_kurir_pilihan` VARCHAR(100) NOT NULL COMMENT 'Nama/kode layanan kurir yang dipilih (mis. GOSEND-INSTANT, JNE-REG)',
  `pesan_kartu_ucapan` VARCHAR(200) NULL DEFAULT NULL COMMENT 'Teks biasa pesan kartu ucapan tingkat pesanan (maksimum 200 karakter sesuai P-10)',
  `nama_pengirim_kartu` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Nama pengirim pada kartu ucapan (NULL jika pengirim memilih anonim)',
  `status_kartu_ucapan_ditolak` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Penanda bila Admin menolak isi kartu ucapan yang melanggar ketentuan (Bagian 6.4)',
  `subtotal_produk_rupiah` BIGINT UNSIGNED NOT NULL COMMENT 'Total harga seluruh item pesanan setelah diskon produk dalam bilangan bulat rupiah',
  `biaya_pengiriman_rupiah` BIGINT UNSIGNED NOT NULL COMMENT 'Ongkos kirim kurir yang terkunci saat checkout dalam bilangan bulat rupiah',
  `total_tagihan_rupiah` BIGINT UNSIGNED NOT NULL COMMENT 'Total akhir yang harus dibayar (subtotal_produk_rupiah + biaya_pengiriman_rupiah)',
  `total_dana_dikembalikan_rupiah` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Akumulasi nominal refund yang telah berhasil/disetujui (tidak boleh melebihi total_tagihan_rupiah, BR-16)',
  `nomor_bukti_pelunasan` VARCHAR(40) NULL DEFAULT NULL COMMENT 'Nomor dokumen bukti pelunasan resmi (diterbitkan hanya setelah pembayaran terverifikasi, BR-06)',
  `waktu_batas_pembayaran` DATETIME NULL DEFAULT NULL COMMENT 'Batas waktu pembayaran online (selaras jendela reservasi P-40 / P-01)',
  `waktu_pengingat_bayar_terkirim` DATETIME NULL DEFAULT NULL COMMENT 'Waktu pengiriman notifikasi pengingat N-04 (15 menit sebelum batas bayar)',
  `waktu_pembayaran_terverifikasi` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC saat pembayaran online atau COD terverifikasi lunas',
  `waktu_siap_diproses` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC pesanan masuk status SIAP_DIPROSES (T-02 / T-15 / T-20)',
  `waktu_mulai_disiapkan` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC Admin menekan tombol mulai siapkan (T-07)',
  `waktu_dikirim` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC paket diserahkan ke kurir (T-09 / T-16)',
  `waktu_terkirim` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC paket tiba di tujuan (T-12, menjadi awal jendela komplain P-11)',
  `waktu_batas_jendela_komplain` DATETIME NULL DEFAULT NULL COMMENT 'Batas akhir pengajuan komplain 24 jam sejak waktu_terkirim (P-11)',
  `waktu_selesai` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC pesanan dinyatakan SELESAI oleh pelanggan atau sistem otomatis (T-13)',
  `waktu_dibatalkan` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC pesanan masuk status DIBATALKAN',
  `versi_kunci_optimis` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Nomor versi baris untuk optimistic locking pencegahan perubahan ganda (HTTP 409, Lampiran A.4 & A.5)',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan pesanan (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir pesanan (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pesanan_nomor_pesanan` (`nomor_pesanan`),
  UNIQUE KEY `uk_pesanan_idempotensi_checkout` (`kunci_idempotensi_checkout`),
  UNIQUE KEY `uk_pesanan_nomor_bukti_pelunasan` (`nomor_bukti_pelunasan`),
  KEY `idx_pesanan_akun_waktu` (`akun_pengguna_id`, `dibuat_pada`),
  KEY `idx_pesanan_antrean_jadwal` (`status_pesanan`, `tanggal_pengiriman`, `slot_pengiriman_kode`, `waktu_pembayaran_terverifikasi`),
  KEY `idx_pesanan_kedaluwarsa` (`status_pesanan`, `waktu_batas_pembayaran`),
  KEY `idx_pesanan_perlu_penanganan` (`status_pesanan`, `kode_perlu_penanganan`, `batas_waktu_keputusan_ph`),
  KEY `idx_pesanan_selesai_otomatis` (`status_pesanan`, `waktu_batas_jendela_komplain`),
  KEY `fk_pesanan_pemilik_penanganan` (`pemilik_penanganan_akun_id`),
  CONSTRAINT `fk_pesanan_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_pesanan_pemilik_penanganan` FOREIGN KEY (`pemilik_penanganan_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan transaksi pesanan pelanggan, status 3 dimensi, snapshot alamat, biaya, jadwal kirim, dan penanganan PH-xx';

-- 41. Tabel: item_pesanan
-- Merepresentasikan baris item pesanan sekaligus snapshot produk, varian, satuan, dan harga saat pembelian (Bagian 5, 26.7, 27.4)
DROP TABLE IF EXISTS `item_pesanan`;
CREATE TABLE `item_pesanan` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal baris item pesanan',
  `pesanan_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi pesanan induk',
  `produk_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi produk katalog (tidak boleh dihapus permanen bila ada di tabel ini, BR-15)',
  `varian_produk_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi varian produk bila pelanggan membeli varian spesifik (Bagian 27.4)',
  `sku_snapshot` VARCHAR(64) NOT NULL COMMENT 'Snapshot kode SKU produk/varian saat pesanan dibuat',
  `nama_produk_snapshot` VARCHAR(150) NOT NULL COMMENT 'Snapshot nama produk saat pesanan dibuat (tidak berubah walau katalog diedit, BR-13)',
  `nama_varian_snapshot` VARCHAR(150) NULL DEFAULT NULL COMMENT 'Snapshot nama varian (mis. Diameter 20 cm, Kemasan 5 Liter)',
  `atribut_varian_snapshot` JSON NULL DEFAULT NULL COMMENT 'Snapshot rincian pasangan atribut varian dan spesifikasi penting saat pembelian (Bagian 27.4)',
  `satuan_jual_snapshot` VARCHAR(30) NOT NULL DEFAULT 'PCS' COMMENT 'Snapshot satuan jual eksplisit (PCS, POT, LITER, BUKET, dll., Bagian 27.2)',
  `jenis_produk_snapshot` ENUM('PRODUK_STANDAR', 'BUKET_KUSTOM', 'TANAMAN_HIAS', 'PERLENGKAPAN_BERKEBUN', 'BENIH_DAN_PUPUK', 'PAKET_BERKEBUN') NOT NULL DEFAULT 'PRODUK_STANDAR' COMMENT 'Snapshot klasifikasi jenis produk saat checkout',
  `jenis_penanganan_snapshot` ENUM('MUDAH_LAYU', 'TAHAN_LAMA') NOT NULL COMMENT 'Snapshot jenis penanganan produk (MUDAH_LAYU atau TAHAN_LAMA)',
  `deskripsi_penting_snapshot` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Snapshot ringkasan spesifikasi/isi paket penting saat pembelian (Bagian 27.4 & 27.5)',
  `harga_normal_satuan_snapshot` BIGINT UNSIGNED NOT NULL COMMENT 'Snapshot harga dasar satuan sebelum diskon produk (rupiah)',
  `harga_diskon_satuan_snapshot` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Snapshot harga diskon satuan bila produk sedang promo saat checkout',
  `tambahan_harga_kustomisasi_satuan` BIGINT NOT NULL DEFAULT 0 COMMENT 'Tambahan harga per unit dari opsi kustomisasi buket bila jenis_produk = BUKET_KUSTOM',
  `harga_satuan_final_snapshot` BIGINT UNSIGNED NOT NULL COMMENT 'Harga satuan final terkunci (setelah diskon + kustomisasi buket) dalam rupiah',
  `berat_satuan_gram_snapshot` INT UNSIGNED NOT NULL DEFAULT 100 COMMENT 'Snapshot berat per unit dalam gram',
  `kuantitas` INT UNSIGNED NOT NULL COMMENT 'Kuantitas unit yang dipesan dalam satuan_jual_snapshot (1-20 sesuai P-05)',
  `subtotal_baris_rupiah` BIGINT UNSIGNED NOT NULL COMMENT 'Total harga baris (harga_satuan_final_snapshot * kuantitas) dalam bilangan bulat rupiah',
  `produk_pengganti_substitusi_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi produk asli sebelum substitusi bila terjadi penggantian item yang disetujui pelanggan pada T-15 (PH-01/PH-06)',
  `catatan_substitusi` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Catatan kesepakatan substitusi produk bila baris ini diubah melalui transisi T-15',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan baris (hanya diizinkan saat substitusi T-15)',
  PRIMARY KEY (`id`),
  KEY `idx_item_pesanan_pesanan` (`pesanan_id`),
  KEY `idx_item_pesanan_produk` (`produk_id`, `varian_produk_id`),
  KEY `fk_item_pesanan_varian` (`varian_produk_id`),
  KEY `fk_item_pesanan_substitusi` (`produk_pengganti_substitusi_id`),
  CONSTRAINT `fk_item_pesanan_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_item_pesanan_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_item_pesanan_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_item_pesanan_substitusi` FOREIGN KEY (`produk_pengganti_substitusi_id`) REFERENCES `produk` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan baris item pesanan beserta snapshot permanen nama, SKU, varian, satuan, dan harga saat pembelian';

-- 42. Tabel: konfigurasi_buket_pesanan
-- Merepresentasikan snapshot konfigurasi buket kustom yang melekat pada baris item pesanan (Bagian 26.3 & 26.4)
DROP TABLE IF EXISTS `konfigurasi_buket_pesanan`;
CREATE TABLE `konfigurasi_buket_pesanan` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal konfigurasi buket pada pesanan',
  `item_pesanan_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi baris item pesanan induk',
  `nama_label_buket_snapshot` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Snapshot nama label buket kustom dari pelanggan',
  `tema_warna_dominan_snapshot` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Snapshot tema warna pilihan pelanggan',
  `pesan_kartu_ucapan_buket_snapshot` VARCHAR(200) NULL DEFAULT NULL COMMENT 'Snapshot pesan kartu ucapan khusus buket',
  `nama_pengirim_kartu_buket_snapshot` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Snapshot nama pengirim kartu ucapan buket',
  `catatan_perangkai_snapshot` VARCHAR(300) NULL DEFAULT NULL COMMENT 'Snapshot instruksi khusus untuk staf perangkai florist',
  `harga_dasar_buket_snapshot_rupiah` BIGINT UNSIGNED NOT NULL COMMENT 'Snapshot harga dasar produk buket sebelum tambahan opsi (rupiah)',
  `total_tambahan_opsi_snapshot_rupiah` BIGINT NOT NULL DEFAULT 0 COMMENT 'Snapshot total tambahan harga seluruh opsi buket per 1 unit buket (rupiah)',
  `harga_akhir_per_buket_snapshot_rupiah` BIGINT UNSIGNED NOT NULL COMMENT 'Snapshot harga final 1 unit buket kustom (rupiah)',
  `ringkasan_konfigurasi_json` JSON NULL DEFAULT NULL COMMENT 'Snapshot JSON utuh seluruh konfigurasi untuk kemudahan audit dan cetak instruksi kerja',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan snapshot (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_konfigurasi_buket_pesanan_item` (`item_pesanan_id`),
  CONSTRAINT `fk_konfigurasi_buket_pesanan_item` FOREIGN KEY (`item_pesanan_id`) REFERENCES `item_pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan snapshot permanen konfigurasi buket kustom pada item pesanan';

-- 43. Tabel: pilihan_buket_pesanan
-- Merepresentasikan snapshot setiap opsi kustomisasi buket yang dipilih pelanggan pada pesanan (Bagian 26.3 & 26.4)
DROP TABLE IF EXISTS `pilihan_buket_pesanan`;
CREATE TABLE `pilihan_buket_pesanan` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal snapshot opsi buket pesanan',
  `konfigurasi_buket_pesanan_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi konfigurasi buket pesanan induk (sesuai Bagian 26.4)',
  `kategori_pilihan_buket_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi kategori pilihan buket (sesuai Bagian 26.4)',
  `opsi_pilihan_buket_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi opsi pilihan buket (sesuai Bagian 26.4)',
  `nama_kategori_pilihan_snapshot` VARCHAR(100) NOT NULL COMMENT 'Snapshot nama kelompok pilihan saat pesanan dibuat',
  `kode_opsi_snapshot` VARCHAR(50) NOT NULL COMMENT 'Snapshot kode opsi pilihan buket',
  `nama_opsi_snapshot` VARCHAR(120) NOT NULL COMMENT 'Snapshot nama opsi pilihan buket saat pesanan dibuat',
  `kuantitas_opsi` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Jumlah unit opsi dalam satu buket',
  `tambahan_harga_satuan_snapshot_rupiah` BIGINT NOT NULL DEFAULT 0 COMMENT 'Snapshot tambahan harga per unit opsi saat pesanan dibuat (rupiah)',
  `subtotal_tambahan_opsi_rupiah` BIGINT NOT NULL DEFAULT 0 COMMENT 'Subtotal tambahan harga opsi (kuantitas_opsi * tambahan_harga_satuan_snapshot_rupiah)',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan snapshot (UTC)',
  PRIMARY KEY (`id`),
  KEY `idx_pilihan_buket_pesanan_konfigurasi` (`konfigurasi_buket_pesanan_id`),
  KEY `fk_pilihan_buket_pesanan_kategori` (`kategori_pilihan_buket_id`),
  KEY `fk_pilihan_buket_pesanan_opsi` (`opsi_pilihan_buket_id`),
  CONSTRAINT `fk_pilihan_buket_pesanan_konfigurasi` FOREIGN KEY (`konfigurasi_buket_pesanan_id`) REFERENCES `konfigurasi_buket_pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pilihan_buket_pesanan_kategori` FOREIGN KEY (`kategori_pilihan_buket_id`) REFERENCES `kategori_pilihan_buket` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_pilihan_buket_pesanan_opsi` FOREIGN KEY (`opsi_pilihan_buket_id`) REFERENCES `opsi_pilihan_buket` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan snapshot rincian opsi pilihan buket dan harga tambahannya pada pesanan';

-- 44. Tabel: kebutuhan_bahan_buket_pesanan
-- Merepresentasikan rincian kebutuhan bahan produksi yang dihitung server untuk buket dalam pesanan (Bagian 26.3 & 26.6)
DROP TABLE IF EXISTS `kebutuhan_bahan_buket_pesanan`;
CREATE TABLE `kebutuhan_bahan_buket_pesanan` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal kebutuhan bahan buket pesanan',
  `pesanan_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi pesanan terkait',
  `konfigurasi_buket_pesanan_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi konfigurasi buket pesanan (sesuai Bagian 26.4)',
  `bahan_produksi_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi bahan produksi yang dibutuhkan (sesuai Bagian 26.4)',
  `nama_bahan_snapshot` VARCHAR(150) NOT NULL COMMENT 'Snapshot nama bahan produksi saat pesanan dihitung',
  `satuan_bahan_snapshot` VARCHAR(30) NOT NULL COMMENT 'Snapshot satuan bahan produksi (TANGKAI, LEMBAR, METER, dll.)',
  `kuantitas_per_unit_buket` DECIMAL(10,2) NOT NULL COMMENT 'Kebutuhan bahan untuk 1 unit buket kustom',
  `kuantitas_buket_dipesan` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Jumlah unit buket pada baris item pesanan tersebut',
  `total_kuantitas_bahan_dibutuhkan` DECIMAL(12,2) NOT NULL COMMENT 'Total bahan yang dibutuhkan (kuantitas_per_unit_buket * kuantitas_buket_dipesan)',
  `total_kuantitas_bahan_terpakai_aktual` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Jumlah bahan yang benar-benar telah dipotong dari stok bahan produksi',
  `status_alokasi_bahan` ENUM('DIHITUNG', 'DIALOKASIKAN', 'TERPAKAI_PRODUKSI', 'DIBATALKAN') NOT NULL DEFAULT 'DIHITUNG' COMMENT 'Status pemenuhan bahan baku untuk buket pesanan ini',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu perhitungan kebutuhan bahan (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan status alokasi bahan (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_kebutuhan_bahan_buket_pesanan_unik` (`konfigurasi_buket_pesanan_id`, `bahan_produksi_id`),
  KEY `idx_kebutuhan_bahan_pesanan_status` (`pesanan_id`, `status_alokasi_bahan`),
  KEY `fk_kebutuhan_bahan_pesanan_bahan` (`bahan_produksi_id`),
  CONSTRAINT `fk_kebutuhan_bahan_pesanan_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_kebutuhan_bahan_pesanan_konfigurasi` FOREIGN KEY (`konfigurasi_buket_pesanan_id`) REFERENCES `konfigurasi_buket_pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_kebutuhan_bahan_pesanan_bahan` FOREIGN KEY (`bahan_produksi_id`) REFERENCES `bahan_produksi` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Mencatat perhitungan kebutuhan bahan produksi untuk merangkai buket dalam pesanan';

-- 45. Tabel: produksi_buket_pesanan
-- Merepresentasikan pekerjaan perangkaian/produksi buket oleh staf florist untuk suatu pesanan (Bagian 26.3 & 26.6)
DROP TABLE IF EXISTS `produksi_buket_pesanan`;
CREATE TABLE `produksi_buket_pesanan` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pekerjaan produksi buket',
  `pesanan_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi pesanan induk',
  `item_pesanan_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi baris item pesanan buket yang diproduksi',
  `konfigurasi_buket_pesanan_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi konfigurasi buket kustom bila merupakan buket kustom',
  `lokasi_stok_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi lokasi studio florist tempat perangkaian dilakukan',
  `nomor_instruksi_kerja` VARCHAR(40) NOT NULL COMMENT 'Nomor tiket kerja perangkaian untuk meja produksi florist',
  `status_produksi_buket` ENUM('MENUNGGU_JADWAL', 'BAHAN_DISIAPKAN', 'SEDANG_DIRANGKAI', 'PEMERIKSAAN_KUALITAS', 'SELESAI_DIRANGKAI', 'TERKENDALA_BAHAN', 'DIBATALKAN') NOT NULL DEFAULT 'MENUNGGU_JADWAL' COMMENT 'Status independen pekerjaan produksi buket (Bagian 26.5 & 26.6)',
  `perangkai_akun_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun staf/Admin yang merangkai buket',
  `kunci_foto_hasil_rangkaian` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Kunci berkas foto dokumentasi buket setelah selesai dirangkai',
  `catatan_produksi` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Catatan hasil pemeriksaan kesegaran atau kendala bahan saat produksi',
  `waktu_target_selesai` DATETIME NULL DEFAULT NULL COMMENT 'Target waktu selesai rangkai sebelum jadwal serah ke kurir',
  `waktu_mulai_rangkai` DATETIME NULL DEFAULT NULL COMMENT 'Waktu aktual staf mulai merangkai buket (UTC)',
  `waktu_selesai_rangkai` DATETIME NULL DEFAULT NULL COMMENT 'Waktu aktual buket selesai dirangkai dan lolos QC (UTC)',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan tiket produksi (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_produksi_buket_nomor_instruksi` (`nomor_instruksi_kerja`),
  KEY `idx_produksi_buket_pesanan_status` (`pesanan_id`, `status_produksi_buket`),
  KEY `idx_produksi_buket_target` (`status_produksi_buket`, `waktu_target_selesai`),
  KEY `fk_produksi_buket_item` (`item_pesanan_id`),
  KEY `fk_produksi_buket_konfigurasi` (`konfigurasi_buket_pesanan_id`),
  KEY `fk_produksi_buket_lokasi` (`lokasi_stok_id`),
  KEY `fk_produksi_buket_perangkai` (`perangkai_akun_id`),
  CONSTRAINT `fk_produksi_buket_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_produksi_buket_item` FOREIGN KEY (`item_pesanan_id`) REFERENCES `item_pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_produksi_buket_konfigurasi` FOREIGN KEY (`konfigurasi_buket_pesanan_id`) REFERENCES `konfigurasi_buket_pesanan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_produksi_buket_lokasi` FOREIGN KEY (`lokasi_stok_id`) REFERENCES `lokasi_stok` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_produksi_buket_perangkai` FOREIGN KEY (`perangkai_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Mencatat pekerjaan produksi/perangkaian buket yang terkait dengan pesanan pelanggan';

-- 46. Tabel: riwayat_status_produksi_buket
-- Merepresentasikan catatan riwayat perubahan status pekerjaan produksi buket secara append-only (Bagian 26.3 & 26.6)
DROP TABLE IF EXISTS `riwayat_status_produksi_buket`;
CREATE TABLE `riwayat_status_produksi_buket` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal riwayat status produksi buket',
  `produksi_buket_pesanan_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi pekerjaan produksi buket induk',
  `status_sebelumnya` ENUM('MENUNGGU_JADWAL', 'BAHAN_DISIAPKAN', 'SEDANG_DIRANGKAI', 'PEMERIKSAAN_KUALITAS', 'SELESAI_DIRANGKAI', 'TERKENDALA_BAHAN', 'DIBATALKAN') NULL DEFAULT NULL COMMENT 'Status produksi sebelum perubahan',
  `status_baru` ENUM('MENUNGGU_JADWAL', 'BAHAN_DISIAPKAN', 'SEDANG_DIRANGKAI', 'PEMERIKSAAN_KUALITAS', 'SELESAI_DIRANGKAI', 'TERKENDALA_BAHAN', 'DIBATALKAN') NOT NULL COMMENT 'Status produksi baru setelah perubahan',
  `pelaku_akun_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun staf yang memperbarui status produksi',
  `catatan_perubahan` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Catatan atau alasan perubahan status produksi buket',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu perubahan status dicatat (UTC, append-only)',
  PRIMARY KEY (`id`),
  KEY `idx_riwayat_status_produksi_waktu` (`produksi_buket_pesanan_id`, `dibuat_pada`),
  KEY `fk_riwayat_status_produksi_pelaku` (`pelaku_akun_id`),
  CONSTRAINT `fk_riwayat_status_produksi_induk` FOREIGN KEY (`produksi_buket_pesanan_id`) REFERENCES `produksi_buket_pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_riwayat_status_produksi_pelaku` FOREIGN KEY (`pelaku_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan jejak waktu perubahan status pekerjaan produksi buket secara append-only';

-- 47. Tabel: reservasi_stok_pesanan
-- Merepresentasikan pencadangan stok sementara per metode pembayaran (P-40) dan status komitnya (D-02, D-17, Bagian 11.A, A.4)
DROP TABLE IF EXISTS `reservasi_stok_pesanan`;
CREATE TABLE `reservasi_stok_pesanan` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal reservasi stok pesanan',
  `pesanan_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi pesanan yang mencadangkan stok',
  `item_pesanan_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi baris item pesanan terkait',
  `produk_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi produk yang direservasi (termasuk komponen bila paket berbasis komponen)',
  `varian_produk_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi varian produk yang direservasi',
  `lokasi_stok_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi lokasi penyimpanan stok tempat reservasi dikunci',
  `metode_pembayaran` ENUM('QRIS', 'E_WALLET', 'TRANSFER_BANK', 'VIRTUAL_ACCOUNT', 'KARTU_KREDIT_DEBIT', 'COD') NOT NULL COMMENT 'Metode pembayaran penentu durasi jendela reservasi P-40',
  `kuantitas_direservasi` INT UNSIGNED NOT NULL COMMENT 'Jumlah unit stok yang dicadangkan',
  `status_reservasi` ENUM('ACTIVE', 'COMMITTED', 'EXPIRED', 'RELEASED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Status siklus hidup reservasi stok sesuai Lampiran A.3',
  `kunci_idempotensi` VARCHAR(100) NOT NULL COMMENT 'Kunci idempotensi unik untuk mencegah reservasi atau komit ganda',
  `waktu_direservasi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu UTC saat reservasi dibuat atomik di InnoDB',
  `waktu_kedaluwarsa` DATETIME NOT NULL COMMENT 'Waktu kedaluwarsa resmi reservasi sesuai metode pembayaran P-40',
  `waktu_dikomit` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC saat pembayaran terverifikasi dan reservasi dikomit ke buku besar stok',
  `waktu_dilepas` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC saat reservasi dilepas karena kedaluwarsa atau pesanan dibatalkan sebelum bayar',
  `alasan_pelepasan` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Alasan pelepasan reservasi (mis. BATAS_WAKTU_HABIS_TERKONFIRMASI_GATEWAY, DIBATALKAN_PELANGGAN)',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir baris (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_reservasi_stok_idempotensi` (`kunci_idempotensi`),
  KEY `idx_reservasi_stok_status_kedaluwarsa` (`status_reservasi`, `waktu_kedaluwarsa`),
  KEY `idx_reservasi_stok_pesanan` (`pesanan_id`, `status_reservasi`),
  KEY `idx_reservasi_stok_produk_aktif` (`produk_id`, `varian_produk_id`, `status_reservasi`),
  KEY `fk_reservasi_stok_item_pesanan` (`item_pesanan_id`),
  KEY `fk_reservasi_stok_varian` (`varian_produk_id`),
  KEY `fk_reservasi_stok_lokasi` (`lokasi_stok_id`),
  CONSTRAINT `fk_reservasi_stok_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reservasi_stok_item_pesanan` FOREIGN KEY (`item_pesanan_id`) REFERENCES `item_pesanan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_reservasi_stok_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_reservasi_stok_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_reservasi_stok_lokasi` FOREIGN KEY (`lokasi_stok_id`) REFERENCES `lokasi_stok` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan reservasi stok sementara per metode pembayaran (P-40) untuk mencegah overselling saat checkout';

-- 48. Tabel: riwayat_status_pesanan
-- Merepresentasikan catatan riwayat seluruh transisi status pesanan formal T-01 s.d. T-20 secara append-only (Bagian 8.7, 8.10, A.4)
DROP TABLE IF EXISTS `riwayat_status_pesanan`;
CREATE TABLE `riwayat_status_pesanan` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal riwayat transisi status pesanan',
  `pesanan_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi pesanan yang mengalami perubahan status',
  `kode_transisi` ENUM('T_01', 'T_02', 'T_03', 'T_04', 'T_05', 'T_06', 'T_07', 'T_08', 'T_09', 'T_10', 'T_11', 'T_12', 'T_13', 'T_14', 'T_15', 'T_16', 'T_17', 'T_18', 'T_19', 'T_20') NOT NULL COMMENT 'Kode transisi formal sesuai Tabel Transisi 8.7 (T-01 s.d. T-20)',
  `status_pesanan_asal` ENUM('MENUNGGU_PEMBAYARAN', 'SIAP_DIPROSES', 'SEDANG_DISIAPKAN', 'DIKIRIM', 'TERKIRIM', 'SELESAI', 'DIBATALKAN', 'PERLU_PENANGANAN') NULL DEFAULT NULL COMMENT 'Status pesanan sebelum transisi (NULL untuk T-01 dan T-20 saat pesanan baru dibuat)',
  `status_pesanan_tujuan` ENUM('MENUNGGU_PEMBAYARAN', 'SIAP_DIPROSES', 'SEDANG_DISIAPKAN', 'DIKIRIM', 'TERKIRIM', 'SELESAI', 'DIBATALKAN', 'PERLU_PENANGANAN') NOT NULL COMMENT 'Status pesanan baru hasil transisi',
  `status_pembayaran_saat_itu` ENUM('MENUNGGU', 'BERHASIL', 'PERLU_DITINJAU', 'GAGAL', 'KEDALUWARSA', 'DIBATALKAN', 'REFUND_DIPROSES', 'DIKEMBALIKAN_SEBAGIAN', 'DIKEMBALIKAN_PENUH', 'SENGKETA') NOT NULL COMMENT 'Snapshot status pembayaran pada saat transisi terjadi',
  `kode_ph_terkait` ENUM('PH_01', 'PH_02', 'PH_03', 'PH_04', 'PH_05', 'PH_06', 'PH_07') NULL DEFAULT NULL COMMENT 'Kode alasan Perlu Penanganan bila transisi menuju atau keluar dari PERLU_PENANGANAN',
  `jenis_pelaku` ENUM('PELANGGAN', 'ADMIN', 'SUPERADMIN', 'SISTEM', 'GATEWAY_PEMBAYARAN', 'KURIR') NOT NULL COMMENT 'Kategori aktor pemicu transisi',
  `pelaku_akun_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun pengguna/staf pemicu bila dilakukan oleh manusia',
  `referensi_koreksi_riwayat_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Tautan ke entri riwayat asli bila baris ini adalah koreksi status terminal T-19 (Bagian 8.9)',
  `alasan_transisi` VARCHAR(500) NOT NULL COMMENT 'Alasan atau keterangan transisi untuk ditampilkan pada garis waktu pesanan',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu transisi terjadi (UTC, append-only)',
  PRIMARY KEY (`id`),
  KEY `idx_riwayat_status_pesanan_garis_waktu` (`pesanan_id`, `dibuat_pada`),
  KEY `fk_riwayat_status_pesanan_pelaku` (`pelaku_akun_id`),
  KEY `fk_riwayat_status_pesanan_koreksi` (`referensi_koreksi_riwayat_id`),
  CONSTRAINT `fk_riwayat_status_pesanan_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_riwayat_status_pesanan_pelaku` FOREIGN KEY (`pelaku_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_riwayat_status_pesanan_koreksi` FOREIGN KEY (`referensi_koreksi_riwayat_id`) REFERENCES `riwayat_status_pesanan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan garis waktu seluruh transisi status pesanan (T-01 s.d. T-20) secara imutabel (append-only)';

-- 49. Tabel: catatan_pesanan
-- Merepresentasikan catatan internal staf maupun pencatatan bukti persetujuan pelanggan pada pesanan (Bagian 5, 9.7, A.4)
DROP TABLE IF EXISTS `catatan_pesanan`;
CREATE TABLE `catatan_pesanan` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal catatan pesanan',
  `pesanan_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi pesanan pemilik catatan',
  `penulis_akun_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi akun Admin/SuperAdmin penulis catatan',
  `jenis_catatan` ENUM('INTERNAL', 'PERSETUJUAN_PELANGGAN') NOT NULL DEFAULT 'INTERNAL' COMMENT 'Jenis catatan (INTERNAL tidak ditampilkan ke pelanggan; PERSETUJUAN_PELANGGAN mencatat kesepakatan jadwal/substitusi)',
  `kanal_komunikasi` VARCHAR(50) NULL DEFAULT NULL COMMENT 'Kanal komunikasi kesepakatan pelanggan bila jenis = PERSETUJUAN_PELANGGAN (mis. Email, Telepon, WhatsApp)',
  `waktu_kesepakatan_pelanggan` DATETIME NULL DEFAULT NULL COMMENT 'Waktu pelanggan memberikan persetujuan eksplisit (Bagian 7.5, 8.5, 9.7)',
  `isi_catatan` TEXT NOT NULL COMMENT 'Isi lengkap catatan (5-500 karakter, di-escape saat ditampilkan sesuai 15.4)',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan catatan (UTC, append-only)',
  PRIMARY KEY (`id`),
  KEY `idx_catatan_pesanan_waktu` (`pesanan_id`, `jenis_catatan`, `dibuat_pada`),
  KEY `fk_catatan_pesanan_penulis` (`penulis_akun_id`),
  CONSTRAINT `fk_catatan_pesanan_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_catatan_pesanan_penulis` FOREIGN KEY (`penulis_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan catatan operasional internal dan bukti kesepakatan pelanggan pada pesanan secara append-only';

-- =====================================================================================
-- DOMAIN 7: PEMBAYARAN, WEBHOOK GATEWAY & REKONSILIASI HARIAN (BAGIAN 7, 13.5, A.4)
-- =====================================================================================

-- 50. Tabel: percobaan_pembayaran_pesanan
-- Merepresentasikan setiap percobaan transaksi pembayaran pesanan ke payment gateway (maksimum P-03 = 5 percobaan per pesanan)
DROP TABLE IF EXISTS `percobaan_pembayaran_pesanan`;
CREATE TABLE `percobaan_pembayaran_pesanan` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal percobaan pembayaran pesanan',
  `pesanan_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi pesanan yang dibayar',
  `nomor_urut_percobaan` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Nomor urut percobaan pembayaran pada pesanan ini (1 sampai P-03 = 5)',
  `metode_pembayaran` ENUM('QRIS', 'E_WALLET', 'TRANSFER_BANK', 'VIRTUAL_ACCOUNT', 'KARTU_KREDIT_DEBIT', 'COD') NOT NULL COMMENT 'Metode pembayaran yang digunakan pada percobaan ini',
  `nama_penyedia_gateway` VARCHAR(50) NOT NULL DEFAULT 'GATEWAY_UTAMA' COMMENT 'Nama penyedia payment gateway atau COD_INTERNAL',
  `id_transaksi_gateway` VARCHAR(128) NOT NULL COMMENT 'ID transaksi unik dari payment gateway (kunci idempotensi konfirmasi pembayaran, Bagian 5 & A.4)',
  `nominal_tagihan_rupiah` BIGINT UNSIGNED NOT NULL COMMENT 'Nominal yang ditagihkan pada percobaan pembayaran ini (rupiah)',
  `nominal_dibayar_terverifikasi_rupiah` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Nominal aktual yang diterima berdasarkan verifikasi API gateway',
  `mata_uang` CHAR(3) NOT NULL DEFAULT 'IDR' COMMENT 'Kode mata uang transaksi (wajib IDR sesuai A.6)',
  `status_percobaan` ENUM('DIBUAT', 'MENUNGGU', 'BERHASIL', 'GAGAL', 'KEDALUWARSA', 'DIBATALKAN', 'PERLU_DITINJAU') NOT NULL DEFAULT 'DIBUAT' COMMENT 'Status per percobaan pembayaran sesuai Bagian 8.2 dan Lampiran A.3',
  `kode_atau_nomor_bayar` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Nomor Virtual Account, string QRIS, atau referensi instruksi bayar non-sensitif',
  `instruksi_pembayaran_json` JSON NULL DEFAULT NULL COMMENT 'Rincian instruksi cara membayar untuk ditampilkan kepada pelanggan (Bagian 7.8)',
  `payload_mentah_gateway` JSON NULL DEFAULT NULL COMMENT 'Salinan respons mentah pembuatan/pengecekan transaksi dari gateway (A.4)',
  `waktu_kedaluwarsa_percobaan` DATETIME NOT NULL COMMENT 'Batas waktu kedaluwarsa transaksi di gateway (selaras P-40)',
  `waktu_berhasil_dibayar` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC transaksi dinyatakan berhasil oleh gateway atau konfirmasi kurir COD',
  `dikonfirmasi_cod_oleh_akun_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun Admin yang mengonfirmasi penerimaan uang COD beserta bukti audit (Bagian 11.A.1)',
  `bukti_setor_cod_kunci_berkas` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Kunci berkas bukti setoran tunai COD dari kurir bila metode = COD',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan percobaan pembayaran (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_percobaan_pembayaran_id_gateway` (`id_transaksi_gateway`),
  UNIQUE KEY `uk_percobaan_pembayaran_pesanan_urut` (`pesanan_id`, `nomor_urut_percobaan`),
  KEY `idx_percobaan_pembayaran_status` (`pesanan_id`, `status_percobaan`),
  KEY `fk_percobaan_pembayaran_konfirmasi_cod` (`dikonfirmasi_cod_oleh_akun_id`),
  CONSTRAINT `fk_percobaan_pembayaran_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_percobaan_pembayaran_konfirmasi_cod` FOREIGN KEY (`dikonfirmasi_cod_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan setiap percobaan pembayaran pesanan ke payment gateway maupun konfirmasi pembayaran COD';

-- 51. Tabel: peristiwa_pembayaran
-- Merepresentasikan log penerimaan webhook payment gateway untuk penegakan idempotensi dan pembuktian sengketa (Bagian 7.3, SEC-06, A.4, A.6)
DROP TABLE IF EXISTS `peristiwa_pembayaran`;
CREATE TABLE `peristiwa_pembayaran` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal peristiwa webhook pembayaran',
  `percobaan_pembayaran_pesanan_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi percobaan pembayaran terkait bila ditemukan di database (sesuai Bagian 26.4)',
  `id_transaksi_gateway` VARCHAR(128) NOT NULL COMMENT 'ID transaksi dari payload webhook payment gateway',
  `jenis_peristiwa` VARCHAR(64) NOT NULL COMMENT 'Jenis event webhook (mis. payment.succeeded, payment.expired, chargeback.opened)',
  `status_tanda_tangan_valid` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Hasil verifikasi signature kriptografi webhook dari raw body (SEC-06)',
  `alamat_ip_pengirim` VARCHAR(45) NOT NULL COMMENT 'Alamat IP server pengirim webhook',
  `isi_mentah_webhook` MEDIUMTEXT NOT NULL COMMENT 'Payload mentah (raw body) webhook asli untuk audit dan pembuktian chargeback (A.9)',
  `header_mentah_webhook` JSON NULL DEFAULT NULL COMMENT 'Header relevan dari permintaan webhook (timestamp, signature)',
  `hasil_pemrosesan` ENUM('BERHASIL_DIPROSES', 'DIABAIKAN_DUPLIKAT', 'DITOLAK_TANDA_TANGAN', 'DITOLAK_REPLAY_WAKTU', 'PERLU_DITINJAU_PH03', 'PEMBAYARAN_TERLAMBAT_PH02', 'PEMBAYARAN_GANDA_REFUND') NOT NULL DEFAULT 'BERHASIL_DIPROSES' COMMENT 'Hasil eksekusi algoritma konfirmasi pembayaran 7.3',
  `waktu_diterima` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu UTC saat server menerima webhook',
  `waktu_selesai_diproses` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC saat transaksi database pemrosesan webhook selesai di-commit',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_peristiwa_pembayaran_idempotensi` (`id_transaksi_gateway`, `jenis_peristiwa`),
  KEY `idx_peristiwa_pembayaran_percobaan` (`percobaan_pembayaran_pesanan_id`),
  KEY `idx_peristiwa_pembayaran_waktu` (`waktu_diterima`, `status_tanda_tangan_valid`),
  CONSTRAINT `fk_peristiwa_pembayaran_percobaan` FOREIGN KEY (`percobaan_pembayaran_pesanan_id`) REFERENCES `percobaan_pembayaran_pesanan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan log mentah webhook pembayaran dan kunci idempotensi (id_transaksi_gateway, jenis_peristiwa)';

-- 52. Tabel: rekonsiliasi_pembayaran_harian
-- Merepresentasikan pencocokan transaksi harian pukul 02:00 WIB (Bagian 7.9) dan penyelesaian rekonsiliasi manual SuperAdmin (Bagian 13.5)
DROP TABLE IF EXISTS `rekonsiliasi_pembayaran_harian`;
CREATE TABLE `rekonsiliasi_pembayaran_harian` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal item rekonsiliasi pembayaran',
  `tanggal_periode_transaksi` DATE NOT NULL COMMENT 'Tanggal transaksi yang direkonsiliasi',
  `pesanan_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi pesanan di sistem (NULL bila transaksi ada di gateway tetapi pesanan tidak ditemukan)',
  `percobaan_pembayaran_pesanan_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi percobaan pembayaran di sistem (sesuai Bagian 26.4)',
  `id_transaksi_gateway` VARCHAR(128) NOT NULL COMMENT 'ID referensi transaksi pada laporan payment gateway',
  `nominal_menurut_gateway_rupiah` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Nominal transaksi yang tercatat di payment gateway',
  `nominal_menurut_sistem_rupiah` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Nominal transaksi yang tercatat di database sistem',
  `status_menurut_gateway` VARCHAR(50) NULL DEFAULT NULL COMMENT 'Status transaksi pada laporan gateway',
  `status_menurut_sistem` VARCHAR(50) NULL DEFAULT NULL COMMENT 'Status pembayaran pada database sistem saat rekonsiliasi berjalan',
  `jenis_selisih` ENUM('COCOK', 'ADA_DI_GATEWAY_TIDAK_DI_SISTEM', 'ADA_DI_SISTEM_TIDAK_DI_GATEWAY', 'SELISIH_NOMINAL', 'SELISIH_STATUS') NOT NULL DEFAULT 'COCOK' COMMENT 'Kategori hasil perbandingan rekonsiliasi harian 7.9',
  `status_penyelesaian` ENUM('OTOMATIS_COCOK', 'PERLU_DITINJAU_SUPERADMIN', 'DISELESAIKAN_VIA_API', 'DISELESAIKAN_DENGAN_BUKTI_DASBOR') NOT NULL DEFAULT 'OTOMATIS_COCOK' COMMENT 'Status tindak lanjut rekonsiliasi (Bagian 13.5)',
  `kunci_berkas_bukti_dasbor` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Bukti tangkapan layar/ekspor dasbor resmi gateway bila API tidak terjangkau (Bagian 13.5)',
  `diselesaikan_oleh_superadmin_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun SuperAdmin yang melakukan rekonsiliasi manual',
  `disetujui_kedua_oleh_akun_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi penyetuju kedua bila rekonsiliasi manual dilakukan tanpa API (Bagian 13.5 & D-18)',
  `catatan_penyelesaian` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Alasan dan hasil verifikasi rekonsiliasi manual',
  `waktu_diselesaikan` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC penyelesaian selisih rekonsiliasi',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pekerjaan rekonsiliasi mencatat baris ini (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rekonsiliasi_tanggal_txn` (`tanggal_periode_transaksi`, `id_transaksi_gateway`),
  KEY `idx_rekonsiliasi_status_tinjau` (`status_penyelesaian`, `tanggal_periode_transaksi`),
  KEY `fk_rekonsiliasi_pesanan` (`pesanan_id`),
  KEY `fk_rekonsiliasi_percobaan` (`percobaan_pembayaran_pesanan_id`),
  KEY `fk_rekonsiliasi_superadmin` (`diselesaikan_oleh_superadmin_id`),
  KEY `fk_rekonsiliasi_penyetuju_kedua` (`disetujui_kedua_oleh_akun_id`),
  CONSTRAINT `fk_rekonsiliasi_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_rekonsiliasi_percobaan` FOREIGN KEY (`percobaan_pembayaran_pesanan_id`) REFERENCES `percobaan_pembayaran_pesanan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_rekonsiliasi_superadmin` FOREIGN KEY (`diselesaikan_oleh_superadmin_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_rekonsiliasi_penyetuju_kedua` FOREIGN KEY (`disetujui_kedua_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan hasil rekonsiliasi pembayaran harian dan penyelesaian manual oleh SuperAdmin (Bagian 7.9 & 13.5)';

-- =====================================================================================
-- DOMAIN 8: PENGIRIMAN, PELACAKAN KURIR & BUKTI SERAH TERIMA (BAGIAN 8.3, 9.3, 9.4, 9.6)
-- =====================================================================================

-- 53. Tabel: pengiriman
-- Merepresentasikan setiap pengiriman paket pesanan (satu pesanan dapat memiliki lebih dari satu pengiriman bila kirim ulang T-16)
DROP TABLE IF EXISTS `pengiriman`;
CREATE TABLE `pengiriman` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pengiriman paket',
  `pesanan_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi pesanan yang dikirim',
  `nomor_urut_pengiriman` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Nomor urut pengiriman (1 = pengiriman awal, >1 = pengiriman ulang T-16 / PH-04 / PH-05)',
  `kode_kurir` VARCHAR(50) NOT NULL COMMENT 'Kode penyedia kurir (mis. GOSEND, GRABEXPRESS, JNE)',
  `nama_layanan_kurir` VARCHAR(100) NOT NULL COMMENT 'Layanan kurir yang digunakan',
  `nomor_resi_atau_referensi` VARCHAR(150) NULL DEFAULT NULL COMMENT 'Nomor resi ekspedisi atau kode order/URL pelacakan kurir instan (wajib saat T-09 sesuai BR-26)',
  `tautan_pelacakan_langsung` VARCHAR(500) NULL DEFAULT NULL COMMENT 'URL live tracking kurir instan bila tersedia',
  `status_pengiriman` ENUM('BELUM_DISERAHKAN', 'DALAM_PENGIRIMAN', 'TERKENDALA', 'TERKIRIM', 'DIKEMBALIKAN') NOT NULL DEFAULT 'BELUM_DISERAHKAN' COMMENT 'Status dimensi pengiriman sesuai Bagian 8.3 dan Lampiran A.3',
  `alasan_kendala_pengiriman` ENUM('ALAMAT_TIDAK_DITEMUKAN', 'PENERIMA_TIDAK_ADA', 'KURIR_GAGAL', 'BARANG_RUSAK', 'BARANG_HILANG') NULL DEFAULT NULL COMMENT 'Alasan wajib saat status_pengiriman = TERKENDALA (Bagian 8.3 & A.3)',
  `keterangan_kendala` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Catatan detail kendala pengantaran atau hasil investigasi kurir (PH-04 / PH-05)',
  `jumlah_percobaan_antar` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Jumlah upaya pengantaran (untuk Mudah Layu maksimum P-14 = 1 kali ulang di hari yang sama)',
  `diserahkan_oleh_akun_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun Admin yang menyerahkan paket kepada kurir (T-09)',
  `waktu_diserahkan_ke_kurir` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC paket diserahkan ke kurir (T-09)',
  `kunci_foto_serah_utama` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Kunci berkas foto utama kondisi paket saat diserahkan ke kurir (wajib untuk Mudah Layu, P-27 & BR-26)',
  `waktu_terkirim` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC paket tiba di tangan penerima (T-12)',
  `nama_penerima_aktual` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Nama penerima paket di lokasi tujuan',
  `kunci_bukti_terkirim_utama` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Kunci berkas foto bukti paket diterima dari kurir atau Admin',
  `waktu_dikembalikan_ke_toko` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC paket retur tiba kembali di toko',
  `hasil_inspeksi_paket_kembali` ENUM('BELUM_DIPERIKSA', 'LAYAK_JUAL_RESTOK', 'RUSAK_ATAU_LAYU_BUANG') NULL DEFAULT NULL COMMENT 'Hasil checklist pemeriksaan fisik paket kembali oleh Admin (Bagian 11.4)',
  `diperiksa_oleh_akun_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun Admin pemeriksa kelayakan paket kembali',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris pengiriman (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir pengiriman (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pengiriman_pesanan_urut` (`pesanan_id`, `nomor_urut_pengiriman`),
  KEY `idx_pengiriman_resi` (`nomor_resi_atau_referensi`),
  KEY `idx_pengiriman_status_polling` (`status_pengiriman`, `diperbarui_pada`),
  KEY `fk_pengiriman_diserahkan_oleh` (`diserahkan_oleh_akun_id`),
  KEY `fk_pengiriman_diperiksa_oleh` (`diperiksa_oleh_akun_id`),
  CONSTRAINT `fk_pengiriman_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_pengiriman_diserahkan_oleh` FOREIGN KEY (`diserahkan_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pengiriman_diperiksa_oleh` FOREIGN KEY (`diperiksa_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan data pengiriman paket, kurir, nomor resi, bukti serah terima, dan penanganan retur (Bagian 9)';

-- 54. Tabel: foto_pengiriman
-- Merepresentasikan berkas foto bukti kondisi paket saat diserahkan ke kurir maupun bukti tiba di tujuan (Bagian 9.3, P-27, A.4)
DROP TABLE IF EXISTS `foto_pengiriman`;
CREATE TABLE `foto_pengiriman` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal foto bukti pengiriman',
  `pengiriman_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi pengiriman induk pemilik foto',
  `jenis_foto_pengiriman` ENUM('BUKTI_SERAH_KE_KURIR', 'BUKTI_TERKIRIM_PENERIMA', 'BUKTI_KONDISI_PAKET_KEMBALI') NOT NULL DEFAULT 'BUKTI_SERAH_KE_KURIR' COMMENT 'Kategori fungsi foto bukti pengiriman',
  `kunci_penyimpanan_berkas` VARCHAR(255) NOT NULL COMMENT 'Kunci objek berkas gambar di storage luar docroot (bukan path publik, Lampiran A.4)',
  `keterangan_foto` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Catatan singkat mengenai foto bukti pengiriman',
  `diunggah_oleh_akun_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun Admin pengunggah foto',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pengunggahan foto (UTC)',
  PRIMARY KEY (`id`),
  KEY `idx_foto_pengiriman_jenis` (`pengiriman_id`, `jenis_foto_pengiriman`),
  KEY `fk_foto_pengiriman_pengunggah` (`diunggah_oleh_akun_id`),
  CONSTRAINT `fk_foto_pengiriman_pengiriman` FOREIGN KEY (`pengiriman_id`) REFERENCES `pengiriman` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_foto_pengiriman_pengunggah` FOREIGN KEY (`diunggah_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan referensi berkas foto serah kurir (wajib untuk Mudah Layu) dan foto bukti terkirim';

-- 55. Tabel: peristiwa_pengiriman
-- Merepresentasikan riwayat pelacakan perjalanan paket dari webhook kurir, polling berkala, atau pembaruan Admin (Bagian 9.4 & 26.7)
DROP TABLE IF EXISTS `peristiwa_pengiriman`;
CREATE TABLE `peristiwa_pengiriman` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal peristiwa pelacakan pengiriman',
  `pengiriman_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi pengiriman yang dilacak',
  `id_peristiwa_eksternal_kurir` VARCHAR(128) NULL DEFAULT NULL COMMENT 'ID event unik dari penyedia kurir untuk idempotensi webhook kurir',
  `status_pelacakan_kurir` VARCHAR(64) NOT NULL COMMENT 'Kode status pelacakan dari kurir (mis. PICKED_UP, IN_TRANSIT, ON_HOLD, DELIVERED, RETURNED)',
  `lokasi_titik_lacak` VARCHAR(150) NULL DEFAULT NULL COMMENT 'Lokasi hub atau posisi kurir saat pembaruan status',
  `deskripsi_peristiwa` VARCHAR(500) NOT NULL COMMENT 'Keterangan perjalanan paket untuk ditampilkan pada garis waktu pelacakan pelanggan',
  `sumber_pembaruan` ENUM('WEBHOOK_KURIR', 'POLLING_API_KURIR', 'MANUAL_ADMIN', 'KONFIRMASI_PELANGGAN') NOT NULL DEFAULT 'WEBHOOK_KURIR' COMMENT 'Sumber informasi pembaruan pelacakan',
  `pelaku_akun_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun Admin atau Pelanggan bila pembaruan dilakukan manual',
  `payload_mentah_kurir` JSON NULL DEFAULT NULL COMMENT 'Payload mentah dari webhook atau respons API kurir',
  `waktu_peristiwa_kurir` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu UTC terjadinya peristiwa pelacakan',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pencatatan baris di server (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_peristiwa_pengiriman_idempotensi` (`pengiriman_id`, `id_peristiwa_eksternal_kurir`),
  KEY `idx_peristiwa_pengiriman_garis_waktu` (`pengiriman_id`, `waktu_peristiwa_kurir`),
  KEY `fk_peristiwa_pengiriman_pelaku` (`pelaku_akun_id`),
  CONSTRAINT `fk_peristiwa_pengiriman_pengiriman` FOREIGN KEY (`pengiriman_id`) REFERENCES `pengiriman` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_peristiwa_pengiriman_pelaku` FOREIGN KEY (`pelaku_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan riwayat pembaruan pelacakan paket dari webhook/API kurir maupun input manual Admin';

-- =====================================================================================
-- DOMAIN 9: PEMBATALAN, PENGEMBALIAN DANA (REFUND), KOMPLAIN & ULASAN PRODUK (BAGIAN 10)
-- =====================================================================================

-- 56. Tabel: permintaan_pembatalan
-- Merepresentasikan pengajuan pembatalan pesanan pasca-pembayaran yang memerlukan keputusan Admin (Bagian 5, 10.1, 10.2, A.4)
DROP TABLE IF EXISTS `permintaan_pembatalan`;
CREATE TABLE `permintaan_pembatalan` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal permintaan pembatalan',
  `pesanan_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi pesanan yang diajukan untuk dibatalkan',
  `diajukan_oleh_akun_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi akun pelanggan atau Admin yang mengajukan pembatalan',
  `tahap_pesanan_saat_diajukan` ENUM('SIAP_DIPROSES', 'SEDANG_DISIAPKAN', 'DIKIRIM') NOT NULL COMMENT 'Status pesanan pada saat permintaan pembatalan diajukan (menentukan matriks kelayakan 10.1)',
  `alasan_pengajuan` VARCHAR(500) NOT NULL COMMENT 'Alasan tertulis pengajuan pembatalan pesanan (wajib diisi)',
  `status_permintaan` ENUM('DIAJUKAN', 'DISETUJUI', 'DITOLAK') NOT NULL DEFAULT 'DIAJUKAN' COMMENT 'Status keputusan permintaan pembatalan sesuai Lampiran A.3',
  `diputuskan_oleh_akun_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun Admin/SuperAdmin pemutus (NULL bila otomatis disetujui pada tahap SIAP_DIPROSES)',
  `alasan_keputusan` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Alasan tertulis persetujuan atau penolakan pembatalan untuk diberitahukan ke pelanggan',
  `batas_waktu_keputusan` DATETIME NOT NULL COMMENT 'Batas waktu Admin mengambil keputusan (P-15 = 2 jam operasional)',
  `waktu_diputuskan` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC keputusan diambil',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pengajuan pembatalan (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir (UTC)',
  PRIMARY KEY (`id`),
  KEY `idx_permintaan_pembatalan_pesanan_status` (`pesanan_id`, `status_permintaan`),
  KEY `idx_permintaan_pembatalan_antrean` (`status_permintaan`, `batas_waktu_keputusan`),
  KEY `fk_permintaan_pembatalan_pengaju` (`diajukan_oleh_akun_id`),
  KEY `fk_permintaan_pembatalan_pemutus` (`diputuskan_oleh_akun_id`),
  CONSTRAINT `fk_permintaan_pembatalan_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_permintaan_pembatalan_pengaju` FOREIGN KEY (`diajukan_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_permintaan_pembatalan_pemutus` FOREIGN KEY (`diputuskan_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan pengajuan dan keputusan pembatalan pesanan pasca-pembayaran sesuai matriks Bagian 10.1';

-- 57. Tabel: pengembalian_dana
-- Merepresentasikan transaksi refund yang terpisah dari pembatalan pesanan, dilengkapi kontrol maker-checker (Bagian 5, 10.3, BR-16, BR-17, A.4)
DROP TABLE IF EXISTS `pengembalian_dana`;
CREATE TABLE `pengembalian_dana` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal pengembalian dana (refund)',
  `nomor_referensi_refund` VARCHAR(40) NOT NULL COMMENT 'Nomor dokumen internal pengembalian dana',
  `pesanan_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi pesanan terkait',
  `percobaan_pembayaran_pesanan_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi transaksi pembayaran asal yang dananya dikembalikan (sesuai Bagian 26.4)',
  `komplain_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi komplain terkait bila refund berasal dari resolusi komplain',
  `sebab_refund` ENUM('BATAL_SIAP_DIPROSES', 'BATAL_DISETUJUI', 'BATAL_TOKO', 'PH_PENUH', 'PH_SEBAGIAN', 'PH_TIMEOUT', 'PEMBAYARAN_GANDA', 'KELEBIHAN_BAYAR', 'HILANG_RUSAK', 'KOMPLAIN', 'RETUR_LAYAK', 'PEMBAYARAN_TERLAMBAT') NOT NULL COMMENT 'Kode penyebab refund sesuai Lampiran A.3 dan tabel Bagian 10.3',
  `nominal_refund_produk_rupiah` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Komponen nominal pengembalian harga produk dalam rupiah',
  `nominal_refund_ongkir_rupiah` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Komponen nominal pengembalian ongkos kirim dalam rupiah',
  `total_nominal_refund_rupiah` BIGINT UNSIGNED NOT NULL COMMENT 'Total dana yang dikembalikan (nominal_refund_produk_rupiah + nominal_refund_ongkir_rupiah > 0)',
  `status_refund` ENUM('DIAJUKAN', 'DITOLAK', 'DISETUJUI', 'DIPROSES', 'BERHASIL', 'GAGAL') NOT NULL DEFAULT 'DIAJUKAN' COMMENT 'Status alur refund sesuai Bagian 8.4 dan Lampiran A.3',
  `jenis_persetujuan` ENUM('OTOMATIS_SISTEM', 'MANUAL_MAKER_CHECKER') NOT NULL DEFAULT 'MANUAL_MAKER_CHECKER' COMMENT 'Apakah refund disetujui otomatis oleh aturan sistem atau manual oleh staf berwenang',
  `diajukan_oleh_akun_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun staf/pelanggan pengaju refund (NULL bila diajukan otomatis oleh Sistem)',
  `disetujui_oleh_akun_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun Admin/SuperAdmin penyetuju (wajib berbeda dari pengaju sesuai BR-17; > Rp500.000 P-18 wajib SuperAdmin)',
  `dasar_atau_alasan_keputusan` VARCHAR(500) NOT NULL COMMENT 'Dasar aturan otomatis atau alasan tertulis persetujuan/penolakan refund',
  `metode_pengembalian` ENUM('METODE_ASAL_GATEWAY', 'TRANSFER_BANK_MANUAL', 'E_WALLET_MANUAL') NOT NULL DEFAULT 'METODE_ASAL_GATEWAY' COMMENT 'Metode penyaluran dana refund kepada pelanggan',
  `referensi_refund_gateway` VARCHAR(128) NULL DEFAULT NULL COMMENT 'ID referensi transaksi refund dari payment gateway atau bukti transfer bank',
  `info_rekening_terenkripsi` VARBINARY(1024) NULL DEFAULT NULL COMMENT 'Data rekening/e-wallet tujuan refund yang dienkripsi dengan APP_KEY (SEC-12, Bagian 15.7)',
  `waktu_hapus_info_rekening` DATETIME NULL DEFAULT NULL COMMENT 'Jadwal penghapusan otomatis data rekening 30 hari setelah refund berhasil (P-21 & BR-28)',
  `jumlah_percobaan_eksekusi` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Jumlah percobaan pengiriman instruksi refund ke gateway (maksimum 3 kali otomatis sesuai P-20)',
  `waktu_percobaan_berikutnya` DATETIME NULL DEFAULT NULL COMMENT 'Jadwal percobaan ulang otomatis refund gagal (backoff dalam 24 jam, P-20)',
  `masuk_antrean_manual` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Penanda bahwa refund gagal 3x dan masuk antrean penyelesaian manual Admin/SuperAdmin (EX-27)',
  `batas_waktu_target_selesai` DATETIME NULL DEFAULT NULL COMMENT 'Target penyelesaian pemrosesan refund maksimum 3 hari kerja sejak disetujui (P-19)',
  `waktu_disetujui` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC refund disetujui',
  `waktu_berhasil_atau_selesai` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC dana refund terkonfirmasi berhasil dikembalikan',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan pengajuan refund (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir refund (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pengembalian_dana_nomor_ref` (`nomor_referensi_refund`),
  KEY `idx_pengembalian_dana_pesanan_status` (`pesanan_id`, `status_refund`),
  KEY `idx_pengembalian_dana_retry` (`status_refund`, `masuk_antrean_manual`, `waktu_percobaan_berikutnya`),
  KEY `idx_pengembalian_dana_hapus_rekening` (`waktu_hapus_info_rekening`),
  KEY `fk_pengembalian_dana_percobaan` (`percobaan_pembayaran_pesanan_id`),
  KEY `fk_pengembalian_dana_pengaju` (`diajukan_oleh_akun_id`),
  KEY `fk_pengembalian_dana_penyetuju` (`disetujui_oleh_akun_id`),
  CONSTRAINT `fk_pengembalian_dana_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_pengembalian_dana_percobaan` FOREIGN KEY (`percobaan_pembayaran_pesanan_id`) REFERENCES `percobaan_pembayaran_pesanan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_pengembalian_dana_pengaju` FOREIGN KEY (`diajukan_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pengembalian_dana_penyetuju` FOREIGN KEY (`disetujui_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan transaksi pengembalian dana (refund), validasi maker-checker (BR-17), dan enkripsi rekening tujuan';

-- 58. Tabel: komplain
-- Merepresentasikan pengajuan komplain pasca-penerimaan dalam jendela 24 jam (P-11) beserta resolusi dan banding (Bagian 10.4, A.4)
DROP TABLE IF EXISTS `komplain`;
CREATE TABLE `komplain` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal komplain pesanan',
  `nomor_tiket_komplain` VARCHAR(30) NOT NULL COMMENT 'Nomor referensi tiket komplain pelanggan',
  `pesanan_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi pesanan yang dikomplain',
  `item_pesanan_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi item pesanan spesifik yang terdampak bila komplain bersifat per item',
  `akun_pengguna_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi akun pelanggan pengaju komplain (sesuai Bagian 26.4)',
  `kategori_komplain` ENUM('LAYU', 'RUSAK', 'SALAH_PESANAN', 'KURANG_ITEM', 'TERLAMBAT', 'TIDAK_DITERIMA') NOT NULL COMMENT 'Kategori komplain sesuai Bagian 10.4 dan Lampiran A.3',
  `deskripsi_keluhan` TEXT NOT NULL COMMENT 'Penjelasan rinci keluhan dari pelanggan (wajib diisi)',
  `status_komplain` ENUM('DIAJUKAN', 'DALAM_TINJAUAN', 'DISETUJUI', 'DITOLAK', 'DIESKALASI', 'SELESAI') NOT NULL DEFAULT 'DIAJUKAN' COMMENT 'Status alur penanganan komplain sesuai Bagian 8.4 dan Lampiran A.3',
  `pihak_bertanggung_jawab` ENUM('BELUM_DITETAPKAN', 'TOKO_PEMENUHAN', 'KURIR_PENGIRIMAN', 'PELANGGAN', 'KEADAAN_LUAR_KENDALI') NOT NULL DEFAULT 'BELUM_DITETAPKAN' COMMENT 'Penetapan matriks tanggung jawab kegagalan sesuai Bagian 10.7',
  `jenis_resolusi` ENUM('BELUM_DIPUTUSKAN', 'KIRIM_PENGGANTI_TANPA_BIAYA', 'REFUND_SEBAGIAN', 'REFUND_PENUH', 'DITOLAK_DENGAN_ALASAN') NOT NULL DEFAULT 'BELUM_DIPUTUSKAN' COMMENT 'Bentuk keputusan penyelesaian komplain (Bagian 10.4)',
  `nominal_refund_disetujui_rupiah` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Nominal refund yang disetujui bila resolusi adalah REFUND_SEBAGIAN atau REFUND_PENUH',
  `diputuskan_oleh_akun_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun Admin yang memberikan keputusan awal komplain',
  `alasan_keputusan_admin` TEXT NULL DEFAULT NULL COMMENT 'Penjelasan tertulis keputusan Admin kepada pelanggan',
  `jumlah_pengajuan_banding` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Jumlah banding yang diajukan pelanggan (maksimum 1 kali dalam 24 jam sesuai P-17)',
  `alasan_banding_pelanggan` TEXT NULL DEFAULT NULL COMMENT 'Alasan tertulis pelanggan saat mengajukan banding atas penolakan komplain',
  `waktu_banding_diajukan` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC pelanggan mengajukan banding (dalam batas P-17 = 24 jam sejak ditolak)',
  `pemutus_banding_superadmin_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun SuperAdmin pemutus akhir banding (keputusan bersifat final, Bagian 10.4)',
  `keputusan_akhir_banding` TEXT NULL DEFAULT NULL COMMENT 'Alasan tertulis keputusan final banding oleh SuperAdmin',
  `batas_waktu_respons_awal` DATETIME NOT NULL COMMENT 'Batas waktu respons pertama Admin maksimum 24 jam sejak diajukan (P-12)',
  `waktu_respons_pertama` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC Admin pertama kali merespons komplain',
  `waktu_ditolak_awal` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC saat komplain ditolak Admin (awal jendela banding 24 jam P-17)',
  `waktu_selesai_komplain` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC komplain dinyatakan SELESAI (memicu pesanan menjadi SELESAI sesuai T-13)',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pengajuan komplain (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir komplain (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_komplain_nomor_tiket` (`nomor_tiket_komplain`),
  KEY `idx_komplain_pesanan_status` (`pesanan_id`, `status_komplain`),
  KEY `idx_komplain_sla_respons` (`status_komplain`, `batas_waktu_respons_awal`),
  KEY `fk_komplain_item_pesanan` (`item_pesanan_id`),
  KEY `fk_komplain_akun_pengguna` (`akun_pengguna_id`),
  KEY `fk_komplain_pemutus_admin` (`diputuskan_oleh_akun_id`),
  KEY `fk_komplain_pemutus_superadmin` (`pemutus_banding_superadmin_id`),
  CONSTRAINT `fk_komplain_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_komplain_item_pesanan` FOREIGN KEY (`item_pesanan_id`) REFERENCES `item_pesanan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_komplain_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_komplain_pemutus_admin` FOREIGN KEY (`diputuskan_oleh_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_komplain_pemutus_superadmin` FOREIGN KEY (`pemutus_banding_superadmin_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan komplain pasca-penerimaan (jendela P-11), penetapan tanggung jawab 10.7, dan banding satu kali (P-17)';

-- Menambahkan Foreign Key komplain_id pada tabel pengembalian_dana setelah tabel komplain dibuat
ALTER TABLE `pengembalian_dana`
  ADD KEY `fk_pengembalian_dana_komplain` (`komplain_id`),
  ADD CONSTRAINT `fk_pengembalian_dana_komplain` FOREIGN KEY (`komplain_id`) REFERENCES `komplain` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 59. Tabel: foto_komplain
-- Merepresentasikan berkas foto bukti komplain dari pelanggan (minimal 2, maksimum 5 foto sesuai P-27, kecuali kategori TIDAK_DITERIMA)
DROP TABLE IF EXISTS `foto_komplain`;
CREATE TABLE `foto_komplain` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal foto bukti komplain',
  `komplain_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi komplain induk pemilik foto bukti',
  `kunci_penyimpanan_berkas` VARCHAR(255) NOT NULL COMMENT 'Kunci objek berkas gambar di storage luar docroot (Lampiran A.4)',
  `urutan_foto` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Nomor urut lampiran foto komplain (1 sampai 5 sesuai P-27 & P-42)',
  `keterangan_foto` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Keterangan bagian kerusakan atau kondisi produk pada foto',
  `ukuran_byte` INT UNSIGNED NULL DEFAULT NULL COMMENT 'Ukuran berkas foto dalam byte (maksimum 5 MB sesuai P-42)',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pengunggahan foto bukti (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_foto_komplain_urutan` (`komplain_id`, `urutan_foto`),
  CONSTRAINT `fk_foto_komplain_komplain` FOREIGN KEY (`komplain_id`) REFERENCES `komplain` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan referensi berkas foto bukti komplain pelanggan (2-5 foto sesuai P-27)';

-- 60. Tabel: ulasan_produk
-- Merepresentasikan ulasan dan penilaian bintang dari pelanggan atas item pesanan yang telah berstatus SELESAI (Bagian 26.7)
DROP TABLE IF EXISTS `ulasan_produk`;
CREATE TABLE `ulasan_produk` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal ulasan produk',
  `pesanan_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi pesanan yang telah selesai',
  `item_pesanan_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi baris item pesanan yang diulas',
  `produk_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi produk yang diulas',
  `varian_produk_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi varian produk yang diulas',
  `akun_pengguna_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi akun pelanggan pemberi ulasan (sesuai Bagian 26.4)',
  `nilai_bintang` TINYINT UNSIGNED NOT NULL COMMENT 'Penilaian bintang dari 1 sampai 5',
  `isi_ulasan` TEXT NULL DEFAULT NULL COMMENT 'Teks ulasan pengalaman pembelian pelanggan (di-escape saat tampil)',
  `status_tampil` ENUM('MENUNGGU_MODERASI', 'DITAMPILKAN', 'DISEMBUNYIKAN') NOT NULL DEFAULT 'DITAMPILKAN' COMMENT 'Status moderasi tampilan ulasan di halaman produk',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan ulasan (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir ulasan (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ulasan_produk_item_pesanan` (`item_pesanan_id`),
  KEY `idx_ulasan_produk_tampil` (`produk_id`, `status_tampil`, `nilai_bintang`),
  KEY `fk_ulasan_produk_pesanan` (`pesanan_id`),
  KEY `fk_ulasan_produk_varian` (`varian_produk_id`),
  KEY `fk_ulasan_produk_akun` (`akun_pengguna_id`),
  CONSTRAINT `fk_ulasan_produk_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ulasan_produk_item` FOREIGN KEY (`item_pesanan_id`) REFERENCES `item_pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ulasan_produk_produk` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ulasan_produk_varian` FOREIGN KEY (`varian_produk_id`) REFERENCES `varian_produk` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ulasan_produk_akun` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan ulasan dan penilaian produk dari pelanggan yang telah menyelesaikan pesanan';

-- =====================================================================================
-- DOMAIN 10: NOTIFIKASI, OUTBOX, PARAMETER SISTEM, AUDIT LOG, PERSETUJUAN & CRON (BAGIAN 13, 14, 19)
-- =====================================================================================

-- 61. Tabel: antrean_keluar
-- Merepresentasikan tabel transactional outbox untuk pengiriman email/pesan agar atomik dengan perubahan status (Lampiran A.4, A.8, A.11, 26.7)
DROP TABLE IF EXISTS `antrean_keluar`;
CREATE TABLE `antrean_keluar` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal baris antrean keluar (outbox)',
  `kode_templat_notifikasi` ENUM('N_01', 'N_02', 'N_03', 'N_04', 'N_05', 'N_06', 'N_07', 'N_08', 'N_09', 'N_10', 'N_11', 'N_12', 'N_13', 'N_14', 'N_15', 'N_16', 'N_17', 'N_18', 'N_19', 'N_20') NOT NULL COMMENT 'Kode katalog notifikasi N-01 s.d. N-20 sesuai Bagian 14',
  `kanal_pengiriman` ENUM('EMAIL', 'DASBOR_INTERNAL', 'WHATSAPP_OPSIONAL') NOT NULL DEFAULT 'EMAIL' COMMENT 'Kanal pengiriman pesan (Email wajib sesuai D-10)',
  `akun_penerima_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun pengguna penerima pesan',
  `alamat_tujuan` VARCHAR(254) NOT NULL COMMENT 'Alamat email atau nomor tujuan penerima',
  `subjek_pesan` VARCHAR(255) NOT NULL COMMENT 'Subjek email atau judul pemberitahuan (bebas karakter CR/LF sesuai 15.4)',
  `muatan_data_json` JSON NOT NULL COMMENT 'Data variabel templat pesan (tanpa kata sandi atau data sensitif penuh)',
  `kunci_idempotensi_kirim` VARCHAR(120) NULL DEFAULT NULL COMMENT 'Kunci unik agar pengingat/notifikasi yang sama tidak diantrekan dua kali',
  `status_pengiriman_pesan` ENUM('MENUNGGU_KIRIM', 'SEDANG_DIKIRIM', 'TERKIRIM', 'GAGAL_SEMENTARA', 'GAGAL_PERMANEN') NOT NULL DEFAULT 'MENUNGGU_KIRIM' COMMENT 'Status pemrosesan antrean keluar oleh pekerja notification-retry (A.8)',
  `jumlah_percobaan_kirim` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Jumlah percobaan pengiriman yang telah dilakukan',
  `waktu_percobaan_berikutnya` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Jadwal pengiriman atau percobaan ulang berikutnya (dengan backoff)',
  `pesan_kesalahan_terakhir` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Catatan error SMTP/gateway terakhir bila pengiriman gagal',
  `waktu_terkirim` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC saat pesan berhasil dikirimkan',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pesan dimasukkan ke outbox dalam transaksi (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir (UTC)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_antrean_keluar_idempotensi` (`kunci_idempotensi_kirim`),
  KEY `idx_antrean_keluar_jadwal_proses` (`status_pengiriman_pesan`, `waktu_percobaan_berikutnya`),
  KEY `fk_antrean_keluar_penerima` (`akun_penerima_id`),
  CONSTRAINT `fk_antrean_keluar_penerima` FOREIGN KEY (`akun_penerima_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan antrean pesan keluar (transactional outbox) untuk menjamin pengiriman notifikasi N-01 s.d. N-20';

-- 62. Tabel: notifikasi
-- Merepresentasikan kotak masuk notifikasi dan peringatan dasbor bagi pelanggan, Admin, dan SuperAdmin (Bagian 14, A.4, 26.7)
DROP TABLE IF EXISTS `notifikasi`;
CREATE TABLE `notifikasi` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal notifikasi pengguna',
  `akun_pengguna_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi akun penerima notifikasi (sesuai Bagian 26.4)',
  `antrean_keluar_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi baris antrean keluar sumber notifikasi',
  `kode_notifikasi` ENUM('N_01', 'N_02', 'N_03', 'N_04', 'N_05', 'N_06', 'N_07', 'N_08', 'N_09', 'N_10', 'N_11', 'N_12', 'N_13', 'N_14', 'N_15', 'N_16', 'N_17', 'N_18', 'N_19', 'N_20') NOT NULL COMMENT 'Kode jenis notifikasi N-01 s.d. N-20 (Bagian 14)',
  `kanal_notifikasi` ENUM('EMAIL', 'DASBOR_INTERNAL', 'WHATSAPP_OPSIONAL') NOT NULL DEFAULT 'EMAIL' COMMENT 'Kanal pengiriman notifikasi',
  `judul_notifikasi` VARCHAR(200) NOT NULL COMMENT 'Judul ringkas notifikasi',
  `isi_ringkasan` VARCHAR(500) NOT NULL COMMENT 'Ringkasan isi pemberitahuan yang aman ditampilkan di dasbor/aplikasi',
  `tautan_tujuan_internal` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Path internal terkait objek notifikasi (mis. detail pesanan atau antrean PH)',
  `status_kirim` ENUM('DIANTREKAN', 'TERKIRIM', 'GAGAL') NOT NULL DEFAULT 'TERKIRIM' COMMENT 'Status pengiriman notifikasi',
  `status_sudah_dibaca` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Penanda apakah penerima sudah membaca notifikasi di dasbor',
  `waktu_dibaca` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC saat notifikasi dibaca',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan notifikasi (UTC)',
  PRIMARY KEY (`id`),
  KEY `idx_notifikasi_akun_belum_dibaca` (`akun_pengguna_id`, `status_sudah_dibaca`, `dibuat_pada`),
  KEY `idx_notifikasi_kode_status` (`kode_notifikasi`, `status_kirim`),
  KEY `fk_notifikasi_antrean_keluar` (`antrean_keluar_id`),
  CONSTRAINT `fk_notifikasi_akun_pengguna` FOREIGN KEY (`akun_pengguna_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_notifikasi_antrean_keluar` FOREIGN KEY (`antrean_keluar_id`) REFERENCES `antrean_keluar` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan riwayat notifikasi transaksional pelanggan dan peringatan internal dasbor staf (N-01 s.d. N-20)';

-- 63. Tabel: pengaturan_sistem
-- Merepresentasikan konfigurasi Register Parameter P-01 s.d. P-46 yang hanya dapat diubah SuperAdmin (Bagian 13.4, 19, A.3, A.4)
DROP TABLE IF EXISTS `pengaturan_sistem`;
CREATE TABLE `pengaturan_sistem` (
  `kunci_parameter` VARCHAR(100) NOT NULL COMMENT 'Kunci stabil parameter pada kode (mis. payment.window_minutes, sesuai catatan Lampiran A.3)',
  `kode_register_parameter` VARCHAR(10) NOT NULL COMMENT 'Kode identifikasi dokumen (P-01 s.d. P-46 pada Bagian 19)',
  `nama_parameter` VARCHAR(150) NOT NULL COMMENT 'Nama deskriptif parameter sistem',
  `nilai_parameter_json` JSON NOT NULL COMMENT 'Nilai konfigurasi aktif dalam format JSON terstruktur',
  `deskripsi_aturan` VARCHAR(500) NOT NULL COMMENT 'Penjelasan fungsi, satuan, dan batasan invariant parameter',
  `dapat_diubah_saat_runtime` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Apakah parameter dapat diubah melalui panel SuperAdmin (BR-29)',
  `diperbarui_oleh_superadmin_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun SuperAdmin pengubah terakhir',
  `alasan_perubahan_terakhir` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Alasan tertulis perubahan parameter terakhir',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan baris (UTC)',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan terakhir parameter (UTC)',
  PRIMARY KEY (`kunci_parameter`),
  UNIQUE KEY `uk_pengaturan_sistem_kode_p` (`kode_register_parameter`),
  KEY `fk_pengaturan_sistem_superadmin` (`diperbarui_oleh_superadmin_id`),
  CONSTRAINT `fk_pengaturan_sistem_superadmin` FOREIGN KEY (`diperbarui_oleh_superadmin_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan konfigurasi baseline Register Parameter P-01 sampai P-46 yang dikelola oleh SuperAdmin';

-- 64. Tabel: log_audit
-- Merepresentasikan catatan audit imutabel (append-only) dengan rantai hash SHA-256 atas seluruh tindakan penting (Bagian 3.3, 13.3, SEC-14, A.4)
DROP TABLE IF EXISTS `log_audit`;
CREATE TABLE `log_audit` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID monoton urut entri audit log',
  `waktu_kejadian` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu UTC tindakan terjadi',
  `jenis_pelaku` ENUM('PENGGUNA', 'SISTEM', 'GATEWAY_PEMBAYARAN', 'KURIR') NOT NULL DEFAULT 'PENGGUNA' COMMENT 'Kategori pelaku tindakan',
  `pelaku_akun_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun pengguna/staf pelaku tindakan (NULL bila Sistem/Gateway)',
  `peran_pelaku` VARCHAR(32) NOT NULL COMMENT 'Peran pelaku saat tindakan dilakukan (CUSTOMER, ADMIN, SUPERADMIN, SYSTEM, GATEWAY)',
  `kode_tindakan` VARCHAR(100) NOT NULL COMMENT 'Kode tindakan yang dilakukan (mis. TRANSISI_STATUS_PESANAN, UBAH_HARGA_PRODUK, KEPUTUSAN_REFUND, UBAH_PARAMETER, AKSES_AUDIT_LOG)',
  `jenis_objek` VARCHAR(64) NOT NULL COMMENT 'Nama entitas/tabel objek yang terdampak',
  `id_objek` VARCHAR(64) NOT NULL COMMENT 'ID objek yang terdampak',
  `nilai_sebelum_json` JSON NULL DEFAULT NULL COMMENT 'Snapshot nilai objek sebelum perubahan (JSON)',
  `nilai_sesudah_json` JSON NULL DEFAULT NULL COMMENT 'Snapshot nilai objek sesudah perubahan (JSON)',
  `alasan_tindakan` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Alasan tertulis yang disertakan saat melakukan tindakan',
  `hasil_tindakan` ENUM('BERHASIL', 'GAGAL', 'DITOLAK') NOT NULL DEFAULT 'BERHASIL' COMMENT 'Hasil eksekusi tindakan',
  `alamat_ip_pelaku` VARCHAR(45) NOT NULL DEFAULT '127.0.0.1' COMMENT 'Alamat IP klien pelaku tindakan (client_ip)',
  `id_permintaan` VARCHAR(64) NULL DEFAULT NULL COMMENT 'ID korelasi request HTTP bila berasal dari permintaan web/API',
  `hash_sebelumnya` CHAR(64) NOT NULL COMMENT 'Hash SHA-256 dari baris log_audit sebelumnya (GENESIS_000... untuk baris pertama)',
  `hash_entri` CHAR(64) NOT NULL COMMENT 'Hash SHA-256 rantai integritas: SHA2(CONCAT(hash_sebelumnya, isi_entri), 256) (Bagian 13.3 & A.4)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_log_audit_hash_entri` (`hash_entri`),
  KEY `idx_log_audit_waktu` (`waktu_kejadian`),
  KEY `idx_log_audit_objek` (`jenis_objek`, `id_objek`, `waktu_kejadian`),
  KEY `idx_log_audit_pelaku` (`pelaku_akun_id`, `waktu_kejadian`),
  KEY `idx_log_audit_tindakan` (`kode_tindakan`, `waktu_kejadian`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Catatan audit append-only berantai hash SHA-256 yang tidak boleh diubah atau dihapus oleh siapa pun (BR-12, SEC-14)';

-- 65. Tabel: persetujuan_operasi_sensitif
-- Merepresentasikan mekanisme persetujuan kedua (dual-control D-18 & SEC-15) untuk koreksi status terminal 8.9, reset MFA SuperAdmin 13.2, dan operasi darurat 13.6
DROP TABLE IF EXISTS `persetujuan_operasi_sensitif`;
CREATE TABLE `persetujuan_operasi_sensitif` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID internal permintaan operasi sensitif',
  `jenis_operasi` ENUM('KOREKSI_STATUS_TERMINAL_T19', 'RESET_MFA_SUPERADMIN', 'REKONSILIASI_TANPA_API', 'PENYESUAIAN_STOK_DI_ATAS_P23', 'PROSEDUR_DARURAT_SISTEM') NOT NULL COMMENT 'Kategori operasi sensitif yang mewajibkan penyetuju kedua berbeda orang (D-18)',
  `jenis_objek_target` VARCHAR(64) NOT NULL COMMENT 'Entitas target operasi (mis. pesanan, akun_pengguna, riwayat_perubahan_stok_produk)',
  `id_objek_target` BIGINT UNSIGNED NOT NULL COMMENT 'ID baris objek target yang akan dikoreksi/dieksekusi',
  `pengaju_akun_id` BIGINT UNSIGNED NOT NULL COMMENT 'Referensi akun SuperAdmin/Admin pengaju operasi',
  `alasan_tertulis_pengajuan` TEXT NOT NULL COMMENT 'Alasan tertulis, analisis dampak, dan rincian perubahan yang diajukan',
  `usulan_perubahan_json` JSON NOT NULL COMMENT 'Payload parameter perubahan yang akan dijalankan setelah disetujui',
  `status_persetujuan` ENUM('MENUNGGU_PERSETUJUAN_KEDUA', 'DISETUJUI_DAN_DIEKSEKUSI', 'DITOLAK', 'KEDALUWARSA') NOT NULL DEFAULT 'MENUNGGU_PERSETUJUAN_KEDUA' COMMENT 'Status persetujuan dual-control',
  `penyetuju_kedua_akun_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Referensi akun SuperAdmin penyetuju kedua (wajib berbeda dari pengaju_akun_id sesuai D-18)',
  `catatan_penyetuju_kedua` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Catatan tertulis dari pejabat penyetuju kedua',
  `waktu_diputuskan` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC persetujuan kedua diberikan atau ditolak',
  `waktu_dieksekusi` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC perubahan diterapkan ke sistem',
  `dibuat_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan pengajuan (UTC)',
  PRIMARY KEY (`id`),
  KEY `idx_persetujuan_sensitif_status` (`status_persetujuan`, `jenis_operasi`),
  KEY `fk_persetujuan_sensitif_pengaju` (`pengaju_akun_id`),
  KEY `fk_persetujuan_sensitif_penyetuju` (`penyetuju_kedua_akun_id`),
  CONSTRAINT `fk_persetujuan_sensitif_pengaju` FOREIGN KEY (`pengaju_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_persetujuan_sensitif_penyetuju` FOREIGN KEY (`penyetuju_kedua_akun_id`) REFERENCES `akun_pengguna` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan catatan persetujuan kedua (dual-control D-18) untuk koreksi status terminal 8.9 dan prosedur darurat 13.6';

-- 66. Tabel: kunci_pekerjaan_terjadwal
-- Merepresentasikan kunci terdistribusi (job_locks Bagian 15.2) dan pemantauan 21 pekerjaan cron PHP CLI (Lampiran A.8)
DROP TABLE IF EXISTS `kunci_pekerjaan_terjadwal`;
CREATE TABLE `kunci_pekerjaan_terjadwal` (
  `nama_pekerjaan` VARCHAR(64) NOT NULL COMMENT 'Nama unik pekerjaan terjadwal sesuai Lampiran A.8 (mis. expire-orders, expire-stock-reservations)',
  `jadwal_cron_ekspresi` VARCHAR(64) NOT NULL COMMENT 'Deskripsi jadwal eksekusi cron (mis. Tiap menit, Tiap 5 menit, 02:00 WIB)',
  `status_eksekusi_terakhir` ENUM('IDLE', 'SEDANG_BERJALAN', 'BERHASIL', 'GAGAL') NOT NULL DEFAULT 'IDLE' COMMENT 'Status eksekusi terakhir untuk pemantauan NFR-09 dan 15.10',
  `dikunci_oleh_instance` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Identitas host/PID worker PHP CLI yang sedang memegang kunci eksekusi',
  `waktu_mulai_kunci` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC pekerjaan mulai dikunci',
  `waktu_kedaluwarsa_kunci` DATETIME NULL DEFAULT NULL COMMENT 'Batas waktu kunci otomatis lepas bila proses worker mati mendadak',
  `waktu_berhasil_terakhir` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC terakhir kali pekerjaan selesai dengan sukses',
  `waktu_gagal_terakhir` DATETIME NULL DEFAULT NULL COMMENT 'Waktu UTC terakhir kali pekerjaan mengalami kegagalan',
  `ringkasan_hasil_terakhir` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Ringkasan jumlah item yang diproses atau pesan error terakhir',
  `diperbarui_pada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu pembaruan status terakhir (UTC)',
  PRIMARY KEY (`nama_pekerjaan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menyimpan penguncian eksekusi (job lock) dan status kesehatan 21 pekerjaan terjadwal (cron PHP CLI Lampiran A.8)';

-- =====================================================================================
-- BAGIAN 11: TRIGGER IMUTABILITAS (APPEND-ONLY), RANTAI HASH AUDIT & PROTEKSI BISNIS
-- =====================================================================================

DELIMITER $$

-- 11.1 Trigger Otomatisasi Rantai Hash SHA-256 pada Tabel log_audit (Bagian 13.3 & A.4)
DROP TRIGGER IF EXISTS `trg_log_audit_sebelum_insert`$$
CREATE TRIGGER `trg_log_audit_sebelum_insert`
BEFORE INSERT ON `log_audit`
FOR EACH ROW
BEGIN
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
END$$

-- 11.2 Trigger Larangan UPDATE dan DELETE pada log_audit (Bagian 3.3, 13.3, BR-12, SEC-14)
DROP TRIGGER IF EXISTS `trg_log_audit_cegah_ubah`$$
CREATE TRIGGER `trg_log_audit_cegah_ubah`
BEFORE UPDATE ON `log_audit`
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_KEAMANAN_BR12: Entri log_audit bersifat append-only dan tidak boleh diubah oleh siapa pun.';
END$$

DROP TRIGGER IF EXISTS `trg_log_audit_cegah_hapus`$$
CREATE TRIGGER `trg_log_audit_cegah_hapus`
BEFORE DELETE ON `log_audit`
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_KEAMANAN_BR12: Entri log_audit bersifat append-only dan tidak boleh dihapus oleh siapa pun.';
END$$

-- 11.3 Trigger Larangan UPDATE dan DELETE pada riwayat_perubahan_stok_produk (Bagian 5, 11.1, A.4)
DROP TRIGGER IF EXISTS `trg_riwayat_stok_produk_cegah_ubah`$$
CREATE TRIGGER `trg_riwayat_stok_produk_cegah_ubah`
BEFORE UPDATE ON `riwayat_perubahan_stok_produk`
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_BUKU_BESAR_STOK: Buku besar riwayat_perubahan_stok_produk bersifat append-only; gunakan entri koreksi baru.';
END$$

DROP TRIGGER IF EXISTS `trg_riwayat_stok_produk_cegah_hapus`$$
CREATE TRIGGER `trg_riwayat_stok_produk_cegah_hapus`
BEFORE DELETE ON `riwayat_perubahan_stok_produk`
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_BUKU_BESAR_STOK: Buku besar riwayat_perubahan_stok_produk tidak boleh dihapus.';
END$$

-- 11.4 Trigger Larangan UPDATE dan DELETE pada riwayat_perubahan_stok_bahan (Bagian 26.6 & 27.3)
DROP TRIGGER IF EXISTS `trg_riwayat_stok_bahan_cegah_ubah`$$
CREATE TRIGGER `trg_riwayat_stok_bahan_cegah_ubah`
BEFORE UPDATE ON `riwayat_perubahan_stok_bahan`
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_BUKU_BESAR_BAHAN: Buku besar riwayat_perubahan_stok_bahan bersifat append-only; gunakan entri koreksi baru.';
END$$

DROP TRIGGER IF EXISTS `trg_riwayat_stok_bahan_cegah_hapus`$$
CREATE TRIGGER `trg_riwayat_stok_bahan_cegah_hapus`
BEFORE DELETE ON `riwayat_perubahan_stok_bahan`
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_BUKU_BESAR_BAHAN: Buku besar riwayat_perubahan_stok_bahan tidak boleh dihapus.';
END$$

-- 11.5 Trigger Larangan UPDATE dan DELETE pada riwayat_status_pesanan (Bagian 8.9, 8.10, A.4)
DROP TRIGGER IF EXISTS `trg_riwayat_status_pesanan_cegah_ubah`$$
CREATE TRIGGER `trg_riwayat_status_pesanan_cegah_ubah`
BEFORE UPDATE ON `riwayat_status_pesanan`
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_RIWAYAT_PESANAN: Riwayat transisi status pesanan bersifat append-only; koreksi wajib melalui T-19.';
END$$

DROP TRIGGER IF EXISTS `trg_riwayat_status_pesanan_cegah_hapus`$$
CREATE TRIGGER `trg_riwayat_status_pesanan_cegah_hapus`
BEFORE DELETE ON `riwayat_status_pesanan`
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_RIWAYAT_PESANAN: Riwayat transisi status pesanan tidak boleh dihapus.';
END$$

-- 11.6 Trigger Larangan UPDATE dan DELETE pada riwayat_status_produksi_buket (Bagian 26.6)
DROP TRIGGER IF EXISTS `trg_riwayat_status_produksi_cegah_ubah`$$
CREATE TRIGGER `trg_riwayat_status_produksi_cegah_ubah`
BEFORE UPDATE ON `riwayat_status_produksi_buket`
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_RIWAYAT_PRODUKSI: Riwayat status produksi buket bersifat append-only.';
END$$

DROP TRIGGER IF EXISTS `trg_riwayat_status_produksi_cegah_hapus`$$
CREATE TRIGGER `trg_riwayat_status_produksi_cegah_hapus`
BEFORE DELETE ON `riwayat_status_produksi_buket`
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_RIWAYAT_PRODUKSI: Riwayat status produksi buket tidak boleh dihapus.';
END$$

-- 11.7 Trigger Larangan UPDATE dan DELETE pada catatan_pesanan (Lampiran A.4)
DROP TRIGGER IF EXISTS `trg_catatan_pesanan_cegah_ubah`$$
CREATE TRIGGER `trg_catatan_pesanan_cegah_ubah`
BEFORE UPDATE ON `catatan_pesanan`
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_CATATAN_PESANAN: Catatan pesanan dan bukti kesepakatan pelanggan bersifat append-only.';
END$$

DROP TRIGGER IF EXISTS `trg_catatan_pesanan_cegah_hapus`$$
CREATE TRIGGER `trg_catatan_pesanan_cegah_hapus`
BEFORE DELETE ON `catatan_pesanan`
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'PELANGGARAN_CATATAN_PESANAN: Catatan pesanan tidak boleh dihapus.';
END$$

-- 11.8 Trigger Proteksi Penghapusan Produk yang Pernah Ditransaksikan (BR-15 & AC-39)
DROP TRIGGER IF EXISTS `trg_produk_cegah_hapus_bertransaksi`$$
CREATE TRIGGER `trg_produk_cegah_hapus_bertransaksi`
BEFORE DELETE ON `produk`
FOR EACH ROW
BEGIN
  DECLARE v_jumlah_transaksi INT DEFAULT 0;
  SELECT COUNT(*) INTO v_jumlah_transaksi FROM `item_pesanan` WHERE `produk_id` = OLD.`id`;
  IF v_jumlah_transaksi > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PELANGGARAN_BR15: Produk yang memiliki riwayat pesanan tidak boleh dihapus permanen; ubah status_produk menjadi NONAKTIF.';
  END IF;
END$$


-- 11.9 Trigger Validasi Komponen Paket Berkebun (Pengganti CHECK yang memicu MySQL #3823 pada Foreign Key)
DROP TRIGGER IF EXISTS `trg_komponen_paket_validasi_insert`$$
CREATE TRIGGER `trg_komponen_paket_validasi_insert`
BEFORE INSERT ON `komponen_paket_berkebun`
FOR EACH ROW
BEGIN
  IF NEW.`produk_paket_id` = NEW.`produk_komponen_id` THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'VALIDASI_PAKET_BERKEBUN: Produk paket tidak boleh merujuk dirinya sendiri sebagai komponen.';
  END IF;
  IF NEW.`kuantitas_komponen` = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'VALIDASI_PAKET_BERKEBUN: Kuantitas komponen dalam paket wajib lebih besar dari 0.';
  END IF;
END$$

DROP TRIGGER IF EXISTS `trg_komponen_paket_validasi_update`$$
CREATE TRIGGER `trg_komponen_paket_validasi_update`
BEFORE UPDATE ON `komponen_paket_berkebun`
FOR EACH ROW
BEGIN
  IF NEW.`produk_paket_id` = NEW.`produk_komponen_id` THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'VALIDASI_PAKET_BERKEBUN: Produk paket tidak boleh merujuk dirinya sendiri sebagai komponen.';
  END IF;
  IF NEW.`kuantitas_komponen` = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'VALIDASI_PAKET_BERKEBUN: Kuantitas komponen dalam paket wajib lebih besar dari 0.';
  END IF;
END$$

-- 11.10 Trigger Validasi Maker-Checker pada Pengembalian Dana / Refund (BR-17, bebas konflik FK #3823)
DROP TRIGGER IF EXISTS `trg_pengembalian_dana_maker_checker_insert`$$
CREATE TRIGGER `trg_pengembalian_dana_maker_checker_insert`
BEFORE INSERT ON `pengembalian_dana`
FOR EACH ROW
BEGIN
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
END$$

DROP TRIGGER IF EXISTS `trg_pengembalian_dana_maker_checker_update`$$
CREATE TRIGGER `trg_pengembalian_dana_maker_checker_update`
BEFORE UPDATE ON `pengembalian_dana`
FOR EACH ROW
BEGIN
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
END$$

-- 11.11 Trigger Validasi Dual-Control Persetujuan Kedua (D-18, bebas konflik FK #3823)
DROP TRIGGER IF EXISTS `trg_persetujuan_sensitif_dual_control`$$
CREATE TRIGGER `trg_persetujuan_sensitif_dual_control`
BEFORE UPDATE ON `persetujuan_operasi_sensitif`
FOR EACH ROW
BEGIN
  IF NEW.`penyetuju_kedua_akun_id` IS NOT NULL AND NEW.`penyetuju_kedua_akun_id` = NEW.`pengaju_akun_id` THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PELANGGARAN_DUAL_CONTROL_D18: Penyetuju kedua wajib orang yang berbeda dari pengaju operasi sensitif.';
  END IF;
END$$

-- 11.12 Trigger Proteksi Saldo Stok Produk Tidak Boleh Negatif (BR-05 & Bagian 11.1)
DROP TRIGGER IF EXISTS `trg_produk_cegah_stok_negatif`$$
CREATE TRIGGER `trg_produk_cegah_stok_negatif`
BEFORE UPDATE ON `produk`
FOR EACH ROW
BEGIN
  IF NEW.`jumlah_stok_jual` < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PELANGGARAN_STOK_BR05: Saldo jumlah_stok_jual pada produk tidak boleh bernilai negatif.';
  END IF;
END$$

DROP TRIGGER IF EXISTS `trg_varian_produk_cegah_stok_negatif`$$
CREATE TRIGGER `trg_varian_produk_cegah_stok_negatif`
BEFORE UPDATE ON `varian_produk`
FOR EACH ROW
BEGIN
  IF NEW.`jumlah_stok_varian` < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PELANGGARAN_STOK_BR05: Saldo jumlah_stok_varian tidak boleh bernilai negatif.';
  END IF;
END$$

DELIMITER ;

-- =====================================================================================
-- BAGIAN 12: VIEW PENYELARASAN KANONIS (v2.5 <-> v2.6) & VIEW OPERASIONAL (BAGIAN 11 & 27.4)
-- =====================================================================================

-- 12.1 View Kompatibilitas: kategori (merujuk ke kategori_produk untuk keselarasan daftar 26.7 & 27.4)
CREATE OR REPLACE VIEW `kategori` AS
SELECT
  `id`,
  `kategori_induk_id`,
  `kode_kategori`,
  `nama_kategori`,
  `slug_kategori`,
  `kelompok_domain`,
  `deskripsi_kategori`,
  `url_gambar_banner`,
  `urutan_tampil`,
  `status_aktif`,
  `dibuat_pada`,
  `diperbarui_pada`
FROM `kategori_produk`;

-- 12.2 View Kompatibilitas: mutasi_stok_produk (merujuk ke riwayat_perubahan_stok_produk sesuai 27.4)
CREATE OR REPLACE VIEW `mutasi_stok_produk` AS
SELECT * FROM `riwayat_perubahan_stok_produk`;

-- 12.3 View Kompatibilitas: bahan_florist (merujuk ke bahan_produksi sesuai peringatan anti-duplikasi 27.4)
CREATE OR REPLACE VIEW `bahan_florist` AS
SELECT * FROM `bahan_produksi`;

-- 12.4 View Kompatibilitas: stok_bahan_florist (merujuk ke stok_bahan_produksi sesuai 27.4)
CREATE OR REPLACE VIEW `stok_bahan_florist` AS
SELECT * FROM `stok_bahan_produksi`;

-- 12.5 View Kompatibilitas: mutasi_stok_bahan (merujuk ke riwayat_perubahan_stok_bahan sesuai 27.4)
CREATE OR REPLACE VIEW `mutasi_stok_bahan` AS
SELECT * FROM `riwayat_perubahan_stok_bahan`;

-- 12.6 View Kompatibilitas: snapshot_produk_pesanan (merujuk ke item_pesanan sesuai 27.4)
CREATE OR REPLACE VIEW `snapshot_produk_pesanan` AS
SELECT
  `id` AS `snapshot_produk_pesanan_id`,
  `pesanan_id`,
  `id` AS `item_pesanan_id`,
  `produk_id`,
  `varian_produk_id`,
  `sku_snapshot`,
  `nama_produk_snapshot`,
  `nama_varian_snapshot`,
  `atribut_varian_snapshot`,
  `satuan_jual_snapshot`,
  `jenis_produk_snapshot`,
  `jenis_penanganan_snapshot`,
  `deskripsi_penting_snapshot`,
  `harga_normal_satuan_snapshot`,
  `harga_diskon_satuan_snapshot`,
  `tambahan_harga_kustomisasi_satuan`,
  `harga_satuan_final_snapshot`,
  `berat_satuan_gram_snapshot`,
  `kuantitas`,
  `subtotal_baris_rupiah`,
  `dibuat_pada`
FROM `item_pesanan`;

-- 12.7 View Operasional: vw_stok_tersedia_checkout
-- Menghitung stok tersedia secara real-time: saldo_stok_jual - reservasi ACTIVE yang belum kedaluwarsa (Bagian 11.1 & 11.A)
CREATE OR REPLACE VIEW `vw_stok_tersedia_checkout` AS
SELECT
  p.`id` AS `produk_id`,
  v.`id` AS `varian_produk_id`,
  COALESCE(v.`sku_varian`, p.`sku`) AS `sku_aktif`,
  p.`nama_produk`,
  v.`nama_varian`,
  COALESCE(v.`satuan_jual_varian`, p.`satuan_jual`) AS `satuan_jual`,
  p.`jenis_produk`,
  p.`jenis_penanganan`,
  COALESCE(v.`jumlah_stok_varian`, p.`jumlah_stok_jual`) AS `saldo_stok_buku_besar`,
  COALESCE(
    (
      SELECT SUM(r.`kuantitas_direservasi`)
      FROM `reservasi_stok_pesanan` r
      WHERE r.`produk_id` = p.`id`
        AND (v.`id` IS NULL OR r.`varian_produk_id` = v.`id`)
        AND r.`status_reservasi` = 'ACTIVE'
        AND r.`waktu_kedaluwarsa` > UTC_TIMESTAMP()
    ),
    0
  ) AS `jumlah_reservasi_aktif`,
  GREATEST(
    0,
    COALESCE(v.`jumlah_stok_varian`, p.`jumlah_stok_jual`) - COALESCE(
      (
        SELECT SUM(r.`kuantitas_direservasi`)
        FROM `reservasi_stok_pesanan` r
        WHERE r.`produk_id` = p.`id`
          AND (v.`id` IS NULL OR r.`varian_produk_id` = v.`id`)
          AND r.`status_reservasi` = 'ACTIVE'
          AND r.`waktu_kedaluwarsa` > UTC_TIMESTAMP()
      ),
      0
    )
  ) AS `stok_tersedia_untuk_checkout`,
  COALESCE(v.`ambang_stok_rendah`, p.`ambang_stok_rendah`) AS `ambang_stok_rendah`
FROM `produk` p
LEFT JOIN `varian_produk` v ON v.`produk_id` = p.`id` AND v.`status_varian` = 'AKTIF'
WHERE p.`status_produk` = 'AKTIF';

-- 12.8 View Operasional: vw_ringkasan_dasbor_admin
-- Menyajikan metrik ringkasan 8 widget dasbor operasional Admin (Bagian 12.1)
CREATE OR REPLACE VIEW `vw_ringkasan_dasbor_admin` AS
SELECT
  (SELECT COUNT(*) FROM `pesanan` WHERE `status_pesanan` = 'SIAP_DIPROSES') AS `jumlah_pesanan_siap_diproses`,
  (SELECT COUNT(*) FROM `pesanan` WHERE `status_pesanan` IN ('SIAP_DIPROSES', 'SEDANG_DISIAPKAN') AND `tanggal_pengiriman` = CURRENT_DATE()) AS `jumlah_perlu_dikirim_hari_ini`,
  (SELECT COUNT(*) FROM `pesanan` WHERE `status_pesanan` = 'PERLU_PENANGANAN') AS `jumlah_pesanan_perlu_penanganan`,
  (SELECT COUNT(*) FROM `pesanan` WHERE `status_pembayaran` = 'PERLU_DITINJAU' OR `kode_perlu_penanganan` IN ('PH_02', 'PH_03')) AS `jumlah_pembayaran_perlu_ditinjau`,
  (SELECT COUNT(*) FROM `permintaan_pembatalan` WHERE `status_permintaan` = 'DIAJUKAN') +
  (SELECT COUNT(*) FROM `pengembalian_dana` WHERE `status_refund` = 'DIAJUKAN') AS `jumlah_batal_dan_refund_menunggu`,
  (SELECT COUNT(*) FROM `komplain` WHERE `status_komplain` IN ('DIAJUKAN', 'DALAM_TINJAUAN', 'DIESKALASI')) AS `jumlah_komplain_terbuka`,
  (SELECT COUNT(*) FROM `produk` WHERE `status_produk` = 'AKTIF' AND `jumlah_stok_jual` <= `ambang_stok_rendah`) AS `jumlah_produk_stok_rendah`,
  (SELECT COUNT(*) FROM `pengiriman` WHERE `status_pengiriman` IN ('TERKENDALA', 'DIKEMBALIKAN')) AS `jumlah_pengiriman_terkendala`;

-- =====================================================================================
-- BAGIAN 13: DATA AWAL (SEED BASELINE FINAL P-01 S.D. P-46, KATEGORI, LOKASI, CRON, SUPERADMIN)
-- =====================================================================================

-- 13.1 Data Awal: Dua Akun SuperAdmin Wajib Sesuai Keputusan D-18 (MFA Wajib Diaktifkan Saat Peluncuran 13.2)
INSERT INTO `akun_pengguna` (
  `id`, `peran`, `email`, `hash_kata_sandi`, `status_akun`, `nama_lengkap`, `nomor_telepon`, `status_mfa_aktif`
) VALUES
  (1, 'SUPERADMIN', 'superadmin.utama@rylvagreen.id', '$2y$12$ContohHashArgon2AtauBcryptWajibDigantiSaatPeluncuran0001', 'AKTIF', 'SuperAdmin Utama RylVa Green', '+6281100000001', 1),
  (2, 'SUPERADMIN', 'superadmin.cadangan@rylvagreen.id', '$2y$12$ContohHashArgon2AtauBcryptWajibDigantiSaatPeluncuran0002', 'AKTIF', 'SuperAdmin Cadangan (Penyetuju Kedua D-18)', '+6281100000002', 1),
  (3, 'ADMIN', 'admin.operasional@rylvagreen.id', '$2y$12$ContohHashArgon2AtauBcryptWajibDigantiSaatPeluncuran0003', 'AKTIF', 'Admin Operasional Florist & Kebun', '+6281100000003', 1);

-- 13.2 Data Awal: Register Parameter P-01 sampai P-46 (Bagian 19 & Lampiran A.3)
INSERT INTO `pengaturan_sistem` (
  `kunci_parameter`, `kode_register_parameter`, `nama_parameter`, `nilai_parameter_json`, `deskripsi_aturan`, `diperbarui_oleh_superadmin_id`
) VALUES
  ('payment.window_minutes', 'P-01', 'Batas waktu pembayaran default', JSON_OBJECT('menit', 60), '60 menit sejak pesanan dibuat', 1),
  ('payment.expiry_grace_minutes', 'P-02', 'Toleransi sinkronisasi kedaluwarsa', JSON_OBJECT('menit', 5), '5 menit pengecekan ke payment gateway sebelum pesanan ditutup', 1),
  ('payment.max_attempts_per_order', 'P-03', 'Maksimum percobaan pembayaran per pesanan', JSON_OBJECT('maks_percobaan', 5), 'Maksimum 5 percobaan pembayaran per pesanan', 1),
  ('order.max_pending_per_account', 'P-04', 'Maksimum pesanan Menunggu Pembayaran per akun', JSON_OBJECT('maks_pesanan', 3), 'Maksimum 3 pesanan aktif berstatus Menunggu Pembayaran per pelanggan', 1),
  ('cart.max_qty_limits', 'P-05', 'Batas kuantitas pembelian', JSON_OBJECT('maks_unit_per_produk', 20, 'maks_unit_per_pesanan', 50), '20 unit per produk per pesanan; 50 unit total per pesanan', 1),
  ('shipping.min_lead_time', 'P-06', 'Lead time minimum pengiriman', JSON_OBJECT('mudah_layu_jam_sebelum_slot', 4, 'tahan_lama_hari_minimum', 1), 'Produk Mudah Layu: 4 jam sebelum jam mulai slot; Produk Tahan Lama: H+1', 1),
  ('shipping.max_advance_days', 'P-07', 'Batas pemesanan di muka', JSON_OBJECT('maks_hari', 30), '30 hari dari tanggal pemesanan', 1),
  ('shipping.delivery_slots_wib', 'P-08', 'Slot pengiriman harian WIB', JSON_OBJECT('PAGI', '08:00-12:00', 'SIANG', '12:00-16:00', 'SORE', '16:00-20:00'), 'Rentang waktu pengiriman Pagi, Siang, dan Sore dalam WIB', 1),
  ('store.operating_hours_wib', 'P-09', 'Jam operasional toko', JSON_OBJECT('buka', '08:00', 'tutup', '20:00', 'zona_waktu', 'Asia/Jakarta'), '08:00-20:00 WIB setiap hari kecuali tanggal tutup', 1),
  ('order.card_message_max_length', 'P-10', 'Panjang pesan kartu ucapan', JSON_OBJECT('maks_karakter', 200), 'Maksimum 200 karakter teks biasa', 1),
  ('complaint.window_hours', 'P-11', 'Jendela komplain pasca-penerimaan', JSON_OBJECT('jam', 24), '24 jam sejak status Terkirim', 1),
  ('complaint.first_response_hours', 'P-12', 'Respons pertama atas komplain', JSON_OBJECT('maks_jam', 24), 'Maksimum 24 jam sejak komplain diajukan', 1),
  ('shipping.lost_investigation_workdays', 'P-13', 'Batas investigasi barang hilang', JSON_OBJECT('hari_kerja', 3), 'Maksimum 3 hari kerja investigasi bersama kurir', 1),
  ('shipping.perishable_redelivery_max', 'P-14', 'Percobaan ulang kirim produk Mudah Layu', JSON_OBJECT('maks_percobaan_ulang', 1, 'hari_yang_sama', true), 'Maksimum 1 kali percobaan ulang pada hari yang sama', 1),
  ('order.ph_initial_action_hours', 'P-15', 'Mulai penanganan status Perlu Penanganan', JSON_OBJECT('jam_operasional', 2), 'Maksimum 2 jam operasional sejak pesanan masuk status Perlu Penanganan', 1),
  ('order.ph_customer_response_hours', 'P-16', 'Batas respons pelanggan atas opsi penyelesaian PH', JSON_OBJECT('jam', 24, 'aksi_lewat_batas', 'REFUND_PENUH_OTOMATIS'), '24 jam untuk PH-01, PH-02, PH-05, PH-06; lewat batas refund penuh otomatis', 1),
  ('complaint.appeal_limit', 'P-17', 'Batas banding atas penolakan komplain', JSON_OBJECT('maks_banding', 1, 'jendela_jam', 24), '1 kali banding dalam 24 jam sejak penolakan Admin', 1),
  ('refund.admin_approval_max_idr', 'P-18', 'Batas persetujuan refund oleh Admin', JSON_OBJECT('batas_rupiah', 500000), 'Rp500.000 per permintaan refund; di atasnya wajib disetujui SuperAdmin', 1),
  ('refund.processing_target_workdays', 'P-19', 'Target pemrosesan refund', JSON_OBJECT('hari_kerja', 3), 'Maksimum 3 hari kerja sejak refund disetujui', 1),
  ('refund.auto_retry_policy', 'P-20', 'Percobaan ulang otomatis refund gagal', JSON_OBJECT('maks_percobaan', 3, 'jendela_jam', 24), '3 kali dalam 24 jam, lalu masuk antrean manual', 1),
  ('refund.bank_info_retention_days', 'P-21', 'Penyimpanan data rekening/e-wallet refund', JSON_OBJECT('hari_setelah_berhasil', 30), 'Dihapus otomatis 30 hari setelah refund berhasil', 1),
  ('stock.low_threshold_units', 'P-22', 'Ambang stok rendah default', JSON_OBJECT('unit', 5), '5 unit per produk untuk peringatan stok terbatas', 1),
  ('stock.admin_adjustment_max_units', 'P-23', 'Batas penyesuaian stok manual tanpa persetujuan SuperAdmin', JSON_OBJECT('unit', 20), 'Maksimum 20 unit per penyesuaian oleh Admin', 1),
  ('catalog.price_change_confirm_pct', 'P-24', 'Ambang perubahan harga yang butuh konfirmasi tambahan', JSON_OBJECT('persentase', 50), 'Perubahan lebih dari 50% dari harga sebelumnya memicu konfirmasi & N-19', 1),
  ('cart.retention_days', 'P-25', 'Retensi keranjang belanja', JSON_OBJECT('tamu_hari', 7, 'akun_hari', 30), 'Keranjang tamu 7 hari di peramban; keranjang akun 30 hari tanpa aktivitas', 1),
  ('account.max_saved_addresses', 'P-26', 'Alamat tersimpan per akun', JSON_OBJECT('maks_alamat', 5), 'Maksimum 5 alamat aktif per akun pelanggan', 1),
  ('evidence.photo_count_limits', 'P-27', 'Jumlah foto bukti wajib', JSON_OBJECT('komplain_min', 2, 'komplain_maks', 5, 'serah_kurir_mudah_layu_min', 1), 'Komplain: 2-5 foto; Serah kurir produk Mudah Layu: minimal 1 foto', 1),
  ('auth.password_min_length', 'P-28', 'Panjang minimum kata sandi', JSON_OBJECT('pelanggan_min', 8, 'staf_min', 12, 'maks_karakter', 128), 'Pelanggan 8 karakter; Admin & SuperAdmin 12 karakter', 1),
  ('auth.verification_code_policy', 'P-29', 'Kebijakan kode verifikasi email', JSON_OBJECT('digit', 6, 'berlaku_menit', 10, 'maks_salah', 5, 'jeda_kirim_ulang_detik', 60, 'maks_kirim_per_jam', 5), '6 digit, berlaku 10 menit, maks 5 salah, jeda 60 detik, maks 5/jam', 1),
  ('auth.password_reset_token_minutes', 'P-30', 'Masa berlaku token pemulihan kata sandi', JSON_OBJECT('berlaku_menit', 15, 'sekali_pakai', true), 'Berlaku 15 menit dan sekali pakai', 1),
  ('auth.login_lockout_policy', 'P-31', 'Pembatasan login gagal', JSON_OBJECT('maks_gagal', 5, 'jendela_menit', 15, 'tunda_menit', 15, 'captcha_mulai_gagal_ke', 3), '5 kegagalan dalam 15 menit menunda 15 menit', 1),
  ('auth.session_lifetime', 'P-32', 'Masa berlaku sesi pengguna dan staf', JSON_OBJECT('pelanggan_idle_hari', 14, 'admin_idle_menit', 30, 'admin_absolut_jam', 8, 'superadmin_idle_menit', 15, 'superadmin_absolut_jam', 4), 'Durasi idle dan absolut sesi per peran', 1),
  ('auth.admin_activation_link_hours', 'P-33', 'Masa berlaku tautan aktivasi akun Admin', JSON_OBJECT('berlaku_jam', 24, 'sekali_pakai', true), 'Berlaku 24 jam dan sekali pakai', 1),
  ('retention.transaction_audit_years', 'P-34', 'Retensi riwayat transaksi dan audit log terkait transaksi', JSON_OBJECT('tahun', 10), '10 tahun sebagai baseline retensi transaksi', 1),
  ('retention.non_transaction_audit_years', 'P-35', 'Retensi audit log non-transaksi', JSON_OBJECT('tahun', 5), '5 tahun untuk log akses, akun, dan konfigurasi', 1),
  ('retention.inactive_customer_months', 'P-36', 'Anonimisasi akun pelanggan tidak aktif', JSON_OBJECT('bulan_tanpa_aktivitas', 24, 'pemberitahuan_hari_sebelum', 30), 'Dianonimkan setelah 24 bulan tanpa login/pesanan aktif, N-20 H-30', 1),
  ('nfr.availability_target_pct', 'P-37', 'Target ketersediaan bulanan', JSON_OBJECT('persentase', 99.5), '99,5% per bulan di luar pemeliharaan terjadwal', 1),
  ('nfr.recovery_targets', 'P-38', 'Target pemulihan bencana (RPO/RTO)', JSON_OBJECT('rpo_jam', 1, 'rto_jam', 4), 'RPO maksimum 1 jam; RTO maksimum 4 jam', 1),
  ('nfr.catalog_lcp_seconds', 'P-39', 'Target kinerja halaman katalog', JSON_OBJECT('detik_4g', 2.5), 'Konten utama tampil dalam 2,5 detik pada jaringan 4G', 1),
  ('stock.reservation_window_by_method', 'P-40', 'Jendela reservasi stok per metode pembayaran', JSON_OBJECT('QRIS', 10, 'E_WALLET', 10, 'TRANSFER_BANK', 15, 'VIRTUAL_ACCOUNT', 30, 'KARTU_KREDIT_DEBIT', 15, 'COD', 0), 'Menit reservasi per metode pembayaran online; COD langsung komit saat order dibuat', 1),
  ('security.rate_limits_config', 'P-41', 'Batas laju (rate limit) per endpoint RL-01 s.d. RL-15', JSON_OBJECT('RL_01_akun_15m', 5, 'RL_01_ip_15m', 20, 'RL_02_akun_15m', 5, 'RL_03_ip_jam', 5, 'RL_04_ip_jam', 10, 'RL_05_email_jam', 3, 'RL_07_ip_menit', 30, 'RL_08_sesi_menit', 60, 'RL_09_akun_jam', 10, 'RL_15_ip_menit', 300), 'Konfigurasi batas laju permintaan sesuai Bagian 15.3', 1),
  ('security.upload_limits', 'P-42', 'Batas unggahan berkas dan ukuran request', JSON_OBJECT('maks_berkas_mb', 5, 'maks_berkas_komplain', 5, 'maks_dimensi_px', 4000, 'post_max_size_mb', 8), 'Maks 5 MB/berkas, 4000x4000 px, post_max_size 8 MB', 1),
  ('retention.security_and_app_logs', 'P-43', 'Retensi log aplikasi dan log keamanan', JSON_OBJECT('log_aplikasi_hari', 90, 'log_keamanan_bulan', 12), 'Log aplikasi 90 hari; log keamanan 12 bulan', 1),
  ('auth.max_concurrent_sessions', 'P-44', 'Batas sesi aktif bersamaan', JSON_OBJECT('pelanggan', 5, 'admin', 2, 'superadmin', 2), 'Pelanggan 5 sesi; Admin dan SuperAdmin 2 sesi', 1),
  ('infra.scale_out_triggers', 'P-45', 'Pemicu pertimbangan scale-out multi-server', JSON_OBJECT('cpu_persen_15m', 70, 'p95_respons_detik', 1.0), 'CPU > 70% selama 15 menit berulang atau p95 > 1 detik', 1),
  ('security.patch_sla_days', 'P-46', 'SLA pembaruan keamanan dependensi dan sistem', JSON_OBJECT('kritis_hari', 7, 'tinggi_hari', 14), 'Kerentanan kritis maks 7 hari, tinggi maks 14 hari', 1);

-- 13.3 Data Awal: Slot Pengiriman Harian Sesuai P-08
INSERT INTO `slot_pengiriman` (
  `kode_slot`, `nama_tampil_slot`, `jam_mulai_wib`, `jam_selesai_wib`, `lead_time_minimum_jam`, `kuota_maksimum_pesanan_harian`, `urutan_tampil`, `status_aktif`
) VALUES
  ('PAGI', 'Slot Pagi (08:00 - 12:00 WIB)', '08:00:00', '12:00:00', 4, 40, 1, 'AKTIF'),
  ('SIANG', 'Slot Siang (12:00 - 16:00 WIB)', '12:00:00', '16:00:00', 4, 50, 2, 'AKTIF'),
  ('SORE', 'Slot Sore (16:00 - 20:00 WIB)', '16:00:00', '20:00:00', 4, 40, 3, 'AKTIF');

-- 13.4 Data Awal: Master Lokasi Penyimpanan Stok (Bagian 27.3 & 27.4)
INSERT INTO `lokasi_stok` (
  `id`, `kode_lokasi`, `nama_lokasi`, `jenis_lokasi`, `alamat_lokasi`, `status_lokasi_default_jual`, `status_aktif`
) VALUES
  (1, 'TOKO-UTAMA', 'Toko Utama & Galeri RylVa Green', 'TOKO_UTAMA', 'Jl. Raya Kebun Bunga No. 10, Bandung', 1, 'AKTIF'),
  (2, 'STUDIO-FLORIST', 'Studio Perangkaian Buket & Pendingin Bunga', 'STUDIO_FLORIST', 'Jl. Raya Kebun Bunga No. 10 (Lantai 1), Bandung', 0, 'AKTIF'),
  (3, 'GUDANG-KEBUN', 'Gudang Media Tanam, Pot & Alat Berkebun', 'GUDANG_PENYIMPANAN', 'Jl. Raya Kebun Bunga No. 12, Bandung', 0, 'AKTIF'),
  (4, 'NURSERY-01', 'Rumah Kaca (Greenhouse) Tanaman Hias & Benih', 'RUMAH_KACA_NURSERY', 'Jl. Lembang Asri No. 45, Bandung Barat', 0, 'AKTIF');

-- 13.5 Data Awal: 10 Kelompok Kategori Produk Florist & Gardening Goods (Bagian 27.1)
INSERT INTO `kategori_produk` (
  `id`, `kategori_induk_id`, `kode_kategori`, `nama_kategori`, `slug_kategori`, `kelompok_domain`, `deskripsi_kategori`, `urutan_tampil`, `status_aktif`
) VALUES
  (1, NULL, 'KAT-FLORIST-BUKET', 'Florist & Buket Bunga', 'florist-dan-buket-bunga', 'FLORIST_DAN_BUKET', 'Buket siap jual, buket kustom, rangkaian bunga meja, bunga potong segar, dan bunga kering.', 1, 'AKTIF'),
  (2, NULL, 'KAT-TANAMAN-HIAS', 'Tanaman Hias Indoor & Outdoor', 'tanaman-hias', 'TANAMAN_HIAS', 'Koleksi tanaman hias daun, sukulen, kaktus, dan tanaman berbunga.', 2, 'AKTIF'),
  (3, NULL, 'KAT-POT-DAN-VAS', 'Pot Tanaman & Vas Bunga', 'pot-dan-vas', 'POT_DAN_VAS', 'Pot keramik, terakota, plastik premium, pot gantung, dan vas kaca estetis.', 3, 'AKTIF'),
  (4, NULL, 'KAT-MEDIA-TANAM', 'Media Tanam', 'media-tanam', 'MEDIA_TANAM', 'Media tanam siap pakai, cocopeat, sekam bakar, perlit, pumice, dan campuran aroid.', 4, 'AKTIF'),
  (5, NULL, 'KAT-TANAH-KOMPOS', 'Tanah Subur & Kompos', 'tanah-dan-kompos', 'TANAH_DAN_KOMPOS', 'Tanah taman organik, kompos daun bambu, humus, dan pupuk kandang matang.', 5, 'AKTIF'),
  (6, NULL, 'KAT-PUPUK-PERAWATAN', 'Pupuk & Nutrisi Tanaman', 'pupuk-dan-perawatan', 'PUPUK_DAN_PERAWATAN', 'Pupuk organik, pupuk NPK, vitamin B1 tanaman, pengkilap daun, dan pengendali hama ramah lingkungan.', 6, 'AKTIF'),
  (7, NULL, 'KAT-ALAT-BERKEBUN', 'Alat Berkebun', 'alat-berkebun', 'ALAT_BERKEBUN', 'Sekop taman, gunting pangkas dahan, sprayer tekanan, sarung tangan kebun, dan gembor penyiram.', 7, 'AKTIF'),
  (8, NULL, 'KAT-BENIH-BIJI', 'Benih & Biji Tanaman', 'benih-dan-biji', 'BENIH_DAN_BIJI', 'Benih sayuran hidroponik/organik, biji bunga matahari, marigold, dan tanaman herbal.', 8, 'AKTIF'),
  (9, NULL, 'KAT-PERLENGKAPAN-DEKOR', 'Perlengkapan & Dekorasi Taman', 'perlengkapan-dan-dekorasi', 'PERLENGKAPAN_DEKORASI', 'Label nama tanaman, turus lumut, kawat bonsai, batu koral hias, dan dekorasi pot.', 9, 'AKTIF'),
  (10, NULL, 'KAT-PAKET-BERKEBUN', 'Paket Berkebun & Starter Kit', 'paket-berkebun', 'PAKET_BERKEBUN', 'Paket lengkap berkebun pemula (pot + media tanam + benih) dan paket kado berkebun.', 10, 'AKTIF');

-- 13.6 Data Awal: Definisi Atribut Fleksibel & Pilihan Atribut (Bagian 27.2 & 27.4)
INSERT INTO `atribut_produk` (
  `id`, `kode_atribut`, `nama_atribut`, `tipe_data_atribut`, `satuan_atribut`, `dapat_menjadi_pembeda_varian`, `dapat_difilter_di_katalog`, `urutan_tampil`
) VALUES
  (1, 'DIAMETER_POT', 'Diameter Pot', 'PILIHAN_TUNGGAL', 'cm', 1, 1, 1),
  (2, 'VOLUME_KEMASAN', 'Volume Kemasan', 'PILIHAN_TUNGGAL', 'Liter', 1, 1, 2),
  (3, 'WARNA_PRODUK', 'Warna', 'PILIHAN_TUNGGAL', NULL, 1, 1, 3),
  (4, 'BAHAN_MATERIAL', 'Bahan Material', 'PILIHAN_TUNGGAL', NULL, 0, 1, 4),
  (5, 'KEBUTUHAN_CAHAYA', 'Kebutuhan Cahaya Tanaman', 'PILIHAN_TUNGGAL', NULL, 0, 1, 5),
  (6, 'FREKUENSI_PENYIRAMAN', 'Kebutuhan Air / Penyiraman', 'PILIHAN_TUNGGAL', NULL, 0, 1, 6),
  (7, 'LUBANG_DRAINASE', 'Memiliki Lubang Drainase', 'BOOLEAN', NULL, 0, 1, 7);

INSERT INTO `pilihan_atribut_produk` (
  `atribut_produk_id`, `kode_pilihan`, `nilai_tampil_pilihan`, `urutan_tampil`
) VALUES
  (1, 'POT_15CM', 'Diameter 15 cm', 1),
  (1, 'POT_20CM', 'Diameter 20 cm', 2),
  (1, 'POT_25CM', 'Diameter 25 cm', 3),
  (2, 'VOL_1L', 'Kemasan 1 Liter', 1),
  (2, 'VOL_5L', 'Kemasan 5 Liter', 2),
  (2, 'VOL_10L', 'Kemasan 10 Liter', 3),
  (3, 'WARNA_PUTIH', 'Putih Minimalis', 1),
  (3, 'WARNA_TERAKOTA', 'Terakota Natural', 2),
  (3, 'WARNA_SAGE', 'Hijau Sage', 3),
  (4, 'BAHAN_KERAMIK', 'Keramik Glasir', 1),
  (4, 'BAHAN_TANAH_LIAT', 'Tanah Liat / Terakota', 2),
  (4, 'BAHAN_PLASTIK_TEBAL', 'Plastik PP Tebal', 3),
  (5, 'CAHAYA_TEDUH', 'Indoor / Cahaya Tidak Langsung', 1),
  (5, 'CAHAYA_SEDANG', 'Semi-Outdoor / Teduh Terang', 2),
  (5, 'CAHAYA_PENUH', 'Outdoor / Sinar Matahari Penuh', 3),
  (6, 'AIR_JARANG', 'Hemat Air (1-2 kali seminggu)', 1),
  (6, 'AIR_SEDANG', 'Lembap Merata (2-3 kali seminggu)', 2),
  (6, 'AIR_RUTIN', 'Setiap Hari Pagi/Sore', 3);

-- 13.7 Data Awal: Master Bahan Produksi Buket & Kategori Pilihan Buket (Bagian 26.3 & 27.3)
INSERT INTO `bahan_produksi` (
  `id`, `kode_bahan`, `nama_bahan`, `kelompok_bahan`, `satuan_bahan`, `jenis_ketahanan_bahan`, `masa_simpan_hari`, `biaya_pokok_satuan_rupiah`, `jumlah_stok_bahan`, `ambang_stok_rendah`
) VALUES
  (1, 'BHN-MAWAR-MERAH', 'Bunga Mawar Merah Segar Grade A', 'BUNGA_UTAMA', 'TANGKAI', 'SEGAR_MUDAH_LAYU', 5, 8000, 200.00, 30.00),
  (2, 'BHN-MAWAR-PUTIH', 'Bunga Mawar Putih Avalanche Segar', 'BUNGA_UTAMA', 'TANGKAI', 'SEGAR_MUDAH_LAYU', 5, 8500, 150.00, 25.00),
  (3, 'BHN-BABY-BREATH', 'Bunga Baby Breath Putih Filler', 'BUNGA_PENDAMPING_FILLER', 'IKAT', 'SEGAR_MUDAH_LAYU', 7, 15000, 60.00, 10.00),
  (4, 'BHN-EUCALYPTUS', 'Daun Eucalyptus Silver Dollar', 'DAUN_HIAS_FOLIAGE', 'IKAT', 'SEGAR_MUDAH_LAYU', 7, 18000, 50.00, 10.00),
  (5, 'BHN-WRAP-SAGE', 'Kertas Wrapping Cellophane Sage Green', 'KERTAS_PEMBUNGKUS', 'LEMBAR', 'BAHAN_PENDUKUNG_MATI', NULL, 3500, 500.00, 50.00),
  (6, 'BHN-PITA-SATIN-CREAM', 'Pita Satin Lebar 2.5cm Krem', 'PITA_DAN_TALI', 'METER', 'BAHAN_PENDUKUNG_MATI', NULL, 2000, 300.00, 30.00);

INSERT INTO `stok_bahan_produksi` (`bahan_produksi_id`, `lokasi_stok_id`, `jumlah_stok_saldo`) VALUES
  (1, 2, 200.00),
  (2, 2, 150.00),
  (3, 2, 60.00),
  (4, 2, 50.00),
  (5, 2, 500.00),
  (6, 2, 300.00);

INSERT INTO `kategori_pilihan_buket` (
  `id`, `kode_kategori_pilihan`, `nama_kategori_pilihan`, `deskripsi_panduan_pilih`, `jenis_pemilihan`, `wajib_dipilih_default`, `batas_minimum_pilihan_default`, `batas_maksimum_pilihan_default`, `urutan_tampil`
) VALUES
  (1, 'PILIHAN_BUNGA_UTAMA', 'Pilihan Bunga Utama', 'Pilih jenis dan warna bunga utama untuk buket Anda', 'PILIH_BANYAK', 1, 1, 3, 1),
  (2, 'PILIHAN_BUNGA_FILLER', 'Bunga Pendamping & Daun Hias', 'Pilih filler pemanis rangkaian buket', 'PILIH_BANYAK', 0, 0, 2, 2),
  (3, 'PILIHAN_KERTAS_WRAP', 'Kertas Pembungkus (Wrapping)', 'Pilih warna kertas cellophane pembungkus buket', 'PILIH_SATU', 1, 1, 1, 3),
  (4, 'PILIHAN_PITA', 'Pita Pengikat', 'Pilih jenis dan warna pita buket', 'PILIH_SATU', 1, 1, 1, 4);

INSERT INTO `opsi_pilihan_buket` (
  `id`, `kategori_pilihan_buket_id`, `kode_opsi`, `nama_opsi`, `deskripsi_opsi`, `tambahan_harga_rupiah`, `batas_maksimum_kuantitas_per_buket`, `urutan_tampil`
) VALUES
  (1, 1, 'OPSI-MAWAR-MERAH-5', 'Paket 5 Tangkai Mawar Merah', '5 tangkai mawar merah segar grade A', 60000, 6, 1),
  (2, 1, 'OPSI-MAWAR-PUTIH-5', 'Paket 5 Tangkai Mawar Putih', '5 tangkai mawar putih segar grade A', 65000, 6, 2),
  (3, 2, 'OPSI-FILLER-BABYBREATH', 'Tambahan Baby Breath Putih', '1 ikat cabang baby breath segar', 25000, 3, 1),
  (4, 2, 'OPSI-DAUN-EUCALYPTUS', 'Tambahan Daun Eucalyptus Harum', '1 ikat daun eucalyptus segar', 30000, 2, 2),
  (5, 3, 'OPSI-WRAP-SAGE-BOTANICAL', 'Wrapping Cellophane Sage Green (3 Lembar)', 'Kertas pembungkus tahan air warna hijau sage', 15000, 2, 1),
  (6, 4, 'OPSI-PITA-SATIN-CREAM', 'Pita Satin Krem Elegan', 'Pita satin panjang 1.5 meter', 5000, 1, 1);

INSERT INTO `kebutuhan_bahan_opsi_buket` (
  `opsi_pilihan_buket_id`, `bahan_produksi_id`, `kuantitas_bahan_per_opsi`
) VALUES
  (1, 1, 5.00),
  (2, 2, 5.00),
  (3, 3, 1.00),
  (4, 4, 1.00),
  (5, 5, 3.00),
  (6, 6, 1.50);

-- 13.8 Data Awal: 21 Pekerjaan Terjadwal (Cron Jobs PHP CLI) Sesuai Lampiran A.8
INSERT INTO `kunci_pekerjaan_terjadwal` (`nama_pekerjaan`, `jadwal_cron_ekspresi`, `ringkasan_hasil_terakhir`) VALUES
  ('expire-orders', '* * * * * (Tiap menit)', 'Menutup pesanan MENUNGGU_PEMBAYARAN kedaluwarsa setelah verifikasi API gateway (T-04)'),
  ('poll-pending-payments', '*/5 * * * * (Tiap 5 menit)', 'Memeriksa status pembayaran aktif ke API gateway bila webhook belum diterima (EX-18)'),
  ('payment-reminder', '* * * * * (Tiap menit)', 'Mengirim pengingat N-04 untuk pesanan yang tersisa 15 menit sebelum batas bayar'),
  ('poll-courier-status', '*/15 * * * * (Tiap 15 menit)', 'Cadangan pengecekan status pengiriman DALAM_PENGIRIMAN ke API kurir (9.4)'),
  ('auto-complete-orders', '*/15 * * * * (Tiap 15 menit)', 'Menyelesaikan otomatis pesanan TERKIRIM setelah jendela komplain P-11 berakhir tanpa komplain (T-13)'),
  ('ph-timeout', '*/5 * * * * (Tiap 5 menit)', 'Memproses refund penuh otomatis dan T-17 untuk pesanan PERLU_PENANGANAN yang melewati P-16'),
  ('refund-retry', '*/15 * * * * (Backoff 24 jam)', 'Mencoba ulang eksekusi refund GAGAL maksimum 3 kali (P-20) sebelum masuk antrean manual'),
  ('daily-reconciliation', '0 19 * * * (02:00 WIB / 19:00 UTC)', 'Membandingkan seluruh transaksi gateway hari sebelumnya dengan database (7.9)'),
  ('cleanup-unverified-accounts', '0 * * * * (Tiap jam)', 'Menghapus akun BELUM_TERVERIFIKASI yang berusia lebih dari 24 jam (6.3.1)'),
  ('cart-retention', '15 19 * * * (Harian)', 'Menghapus keranjang akun yang tidak aktif lebih dari 30 hari (P-25)'),
  ('delete-refund-bank-info', '30 19 * * * (Harian)', 'Menghapus info_rekening_terenkripsi 30 hari setelah refund berhasil (P-21)'),
  ('anonymize-inactive-accounts', '45 19 * * * (Harian)', 'Menganonimkan akun pelanggan tidak aktif 24 bulan setelah pemberitahuan N-20 (P-36)'),
  ('stock-consistency-check', '0 20 * * * (Harian)', 'Membandingkan saldo stok produk/varian dengan SUM buku besar stok; selisih memicu N-18'),
  ('audit-chain-verify', '30 20 * * * (Harian)', 'Memverifikasi keutuhan rantai hash SHA-256 pada tabel log_audit (13.3)'),
  ('notification-retry', '* * * * * (Tiap menit)', 'Mengirim dan mencoba ulang antrean pesan keluar (outbox) yang tertunda'),
  ('restore-test-reminder', '0 0 1 */3 * (Per 3 bulan)', 'Mengirim pengingat pengujian pemulihan backup database terenkripsi (13.7)'),
  ('expire-stock-reservations', '* * * * * (Tiap menit)', 'Melepas reservasi stok ACTIVE yang melewati waktu_kedaluwarsa setelah cek status gateway (11.A.2)'),
  ('stock-reservation-reconciliation', '15 20 * * * (Harian)', 'Mencocokkan reservasi stok, pesanan, buku besar, dan transaksi gateway (11.A.4)'),
  ('purge-rate-limits', '10 * * * * (Tiap jam)', 'Menghapus penghitung batas_laju_permintaan yang jendela waktunya telah berakhir (15.3)'),
  ('security-monitor', '*/5 * * * * (Tiap 5 menit)', 'Mengevaluasi ambang log_peristiwa_keamanan dan mengirim peringatan N-18 ke SuperAdmin (15.10)'),
  ('log-retention', '40 20 * * * (Harian)', 'Merotasi dan menghapus log aplikasi (90 hari) serta log keamanan (12 bulan) sesuai P-43');

-- 13.9 Data Awal: Entri Genesis pada log_audit
INSERT INTO `log_audit` (
  `jenis_pelaku`, `pelaku_akun_id`, `peran_pelaku`, `kode_tindakan`, `jenis_objek`, `id_objek`,
  `nilai_sebelum_json`, `nilai_sesudah_json`, `alasan_tindakan`, `hasil_tindakan`, `alamat_ip_pelaku`,
  `hash_sebelumnya`, `hash_entri`
) VALUES (
  'SISTEM', 1, 'SUPERADMIN', 'INISIALISASI_SKEMA_DATABASE_V2_6', 'pengaturan_sistem', 'BASELINE_P01_P46',
  NULL, JSON_OBJECT('versi_spesifikasi', '2.6 Final', 'jumlah_parameter', 46),
  'Inisialisasi skema basis data lengkap RylVa Green v2.6 (Florist, Kustomisasi Buket, dan Gardening Goods)',
  'BERHASIL', '127.0.0.1',
  REPEAT('0', 64), SHA2('GENESIS_RYLVA_GREEN_V2_6', 256)
);

SET FOREIGN_KEY_CHECKS = 1;
-- =====================================================================================
-- AKHIR SKRIP SQL RYLVA GREEN VERSI 2.6 FINAL
-- =====================================================================================