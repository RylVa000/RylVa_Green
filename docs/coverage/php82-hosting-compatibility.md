# Kompatibilitas PHP 8.2 untuk hosting

Diperiksa 21 November 2026. Hosting menurut pengguna menyediakan PHP 8.2. Proyek tetap kompatibel; tidak diperlukan perubahan framework atau peningkatan minimum PHP menjadi 8.3.

## Dasar dan pengujian

- `composer.json`/lock menetapkan PHP `^8.2`. Dependensi terkunci `paragonie/sodium_compat` v2.5.2 memerlukan PHP `^8.1` dan runtime 64-bit.
- Workflow CI sudah mencantumkan matrix PHP 8.2 dan 8.3. Status GitHub-hosted belum diklaim lulus; pemeriksaan langsung berikut dilakukan lokal.
- Paket PHP **8.2.36 x64** diambil dari [metadata rilis Windows resmi PHP](https://downloads.php.net/~windows/releases/releases.json), dengan SHA-256 yang cocok. Runtime hanya berada di cache workspace; instalasi Laragon pengguna tidak diubah.

| Pemeriksaan memakai PHP 8.2.36 | Hasil |
| --- | --- |
| Composer platform requirements | Lulus: PHP, runtime 64-bit, PDO, JSON dan mbstring. |
| Lint PHP | 155 berkas lulus pada pemeriksaan penuh; utilitas origin tambahan diperiksa tersendiri. |
| Fondasi PHP/PDO/database | 61 pemeriksaan lulus. |
| Kontrak pembayaran/kurir | 59 pemeriksaan lulus. |
| Validasi deployment | 10 pemeriksaan lulus. |
| Server PHP nyata dan browser | 13 kelompok lulus, termasuk render Beranda, Akun dan 404 pada desktop/ponsel. |

Laporan: `storage/reports/php82/`; metadata runtime: `storage/reports/staging/php82-runtime.json`. Hasil ini memverifikasi kode yang tersedia, bukan menyatakan modul bisnis yang masih kerangka sudah terimplementasi.

## Batas hosting

Entry point aplikasi sudah berjalan pada hosting setelah akses FTP diperluas: HTTPS valid, kode privat dapat dibaca PHP, dan pembatasan peninjau memberikan 401/302 sesuai kredensial. Karena admin tidak mengizinkan perubahan Nginx, aplikasi memakai [routing query](../runbook/dza-nginx-routing.md). Ekstensi database, versi MySQL dan koneksi PDO online belum diverifikasi. Tidak ada probe PHP sementara atau operasi database di hosting.

Login FTP port 21 sudah berhasil; path virtual `/rylvagreen.biz.id` berbeda dari path absolut yang diberikan. `.env`, `src/`, `vendor/` dan HTML disimpan pada rilis privat di sebelah folder domain. [Catatan pemasangan hosting](../runbook/hosting-installation-plan.md) menjelaskan tata letak dan batasnya.

Untuk perencanaan produksi, periksa lagi dukungan versi saat rilis: [jadwal resmi PHP](https://www.php.net/supported-versions.php) menetapkan dukungan keamanan 8.2 sampai 31 Desember 2026. Hal ini tidak menghalangi pengujian staging PHP 8.2 saat ini.
