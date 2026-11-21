-- Pilih database aplikasi di phpMyAdmin terlebih dahulu.
-- Hanya metadata: tidak membaca baris akun, produk, pesanan, atau kredensial.
SELECT
  VERSION() AS databaseVersion,
  (
    SELECT COUNT(*)
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_TYPE = 'BASE TABLE'
  ) AS baseTables,
  (
    SELECT COUNT(*)
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_TYPE = 'VIEW'
  ) AS views,
  (
    SELECT COUNT(*)
    FROM information_schema.TRIGGERS
    WHERE TRIGGER_SCHEMA = DATABASE()
  ) AS triggers,
  (
    SELECT COUNT(*)
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN (
        'akun_pengguna',
        'sesi_login',
        'kode_verifikasi',
        'batas_laju_permintaan',
        'produk',
        'varian_produk',
        'stok_varian_produk'
      )
  ) AS coreTablesPresent;
