# Skema awal database hosting

Diperiksa 22 November 2026. Pengguna menjalankan pemeriksaan metadata melalui phpMyAdmin setelah `USE berryl_rylva_green`. Hasil: MariaDB 11.8.6, nol tabel/view/trigger dan nol dari tujuh tabel inti. Ini membuktikan database terpilih masih kosong; belum membuktikan koneksi PDO dari aplikasi hosting.

Koneksi MySQL langsung dari komputer pengembangan gagal dengan kode 2002. URL phpMyAdmin yang diberikan tersedia lewat HTTP; HTTPS tidak lolos verifikasi nama sertifikat. Alat kontrol desktop gagal dengan kesalahan setup sandbox. Tidak ada kredensial yang dimasukkan melalui HTTP oleh agen dan tidak ada pengabaian verifikasi sertifikat.

## Artefak siap diimpor

`database/schema/rylva-staging-structure.sql` dibuat oleh `tools/maintenance/build-hosting-schema.php` dari sumber baseline yang checksum-nya dikunci. Paket hanya berisi struktur: 68 tabel, 10 view, 23 trigger dan 136 foreign key. Tidak memuat akun awal, katalog, stok, transaksi, INSERT fixture, DROP, TRUNCATE, CREATE DATABASE atau USE.

Placeholder tabel view dihilangkan; view disusun berdasarkan ketergantungan dan memakai `SQL SECURITY INVOKER`. Definer `root@localhost` serta nilai auto increment bawaan fixture tidak dibawa ke hosting. SQL sumber asli tetap dipertahankan.

Pengujian impor dijalankan pada database lokal baru yang terisolasi:

| Server | Hasil |
| --- | --- |
| MariaDB 11.8.6 | 68 tabel, 10 view, 23 trigger, 136 relasi; semua tabel kosong; sepuluh view memakai INVOKER. |
| MySQL 8.4.3 | Inventaris dan pemeriksaan yang sama lulus. |

Laporan: `storage/reports/staging/schema-mariadb.json`, `schema-mysql.json` dan `schema-package.json`. Port lokal 13368/13367 dibatasi loopback; identitas data directory diperiksa sebelum pembuatan database uji.

## Langkah phpMyAdmin

1. Pilih database RylVa yang sudah dikonfirmasi kosong.
2. Gunakan tab Import untuk `database/schema/rylva-staging-structure.sql`.
3. Jika ada error, hentikan dan catat pesan serta nama objeknya. Jangan mengulang atau menghapus objek secara otomatis: DDL tidak dapat di-rollback sebagai satu transaksi.
4. Jalankan kembali `docs/runbook/hosting-database-readonly.sql`. Hasil yang diharapkan: 68 tabel, 10 view, 23 trigger dan tujuh tabel inti.
5. Pemeriksaan PDO aplikasi menyusul setelah koneksi dari lingkungan hosting tersedia; akses phpMyAdmin bukan bukti sesi aplikasi dapat terhubung.

MariaDB adalah temuan hosting aktual, sedangkan fondasi sebelumnya memakai MySQL 8.4. Pengujian ini memverifikasi artefak struktur pada kedua engine; tidak menyatakan semua layanan bisnis sudah diuji kompatibel. Perbedaan JSON/SQL lanjutan perlu diuji pada layanan terkait.
