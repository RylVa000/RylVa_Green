# Menjalankan fondasi PHP dan MySQL lokal

Diverifikasi 21 November 2026 pada Windows, PowerShell 7, PHP 8.3.36 dan MySQL 8.4.3 dari Laragon. Jalankan perintah dari root proyek. Document root aplikasi tetap `public/`.

## Persiapan

PHP memerlukan PDO MySQL, JSON dan mbstring, di samping kebutuhan Composer yang tercatat. Jalur instalasi berikut adalah jalur yang ditemukan pada mesin ini; sesuaikan bila instalasinya berbeda.

```powershell
Set-Location D:/rylva-green
$phpPath = 'C:/laragon/bin/php/php-8.3.36-Win32-vs16-x64/php.exe'
$composerPath = 'C:/laragon/bin/composer/composer.phar'
& $phpPath $composerPath install --no-interaction
& $phpPath $composerPath check-platform-reqs
```

`composer install` menggunakan dependensi proyek; tidak diperlukan penggantian framework. Pada mesin ini `vendor/` sudah tersedia.

## Database uji terpisah

```powershell
pwsh -NoProfile -File tools/testing/start-foundation-mysql.ps1
& $phpPath bin/database.php check
& $phpPath bin/database.php migrate
```

Skrip membuat instance **127.0.0.1:13367**, database `rylva_green_m0_test` dan akun aplikasi khusus schema tersebut. Data berada di `storage/cache/foundation-mysql/data/`; kredensial acak disimpan dalam berkas lokal yang diabaikan Git. `config/.env` tidak diubah. Admin lokal menggunakan shared memory; aplikasi menggunakan PDO TCP loopback.

Jika binari MySQL berada di lokasi lain:

```powershell
pwsh -NoProfile -File tools/testing/start-foundation-mysql.ps1 `
  -mysqlBinPath 'C:/path/to/mysql/bin' -port 13367
```

Skrip memeriksa identitas `datadir` dan port sebelum menggunakan instance yang sudah berjalan. Port terpakai oleh instance lain atau data/kredensial yang tidak cocok akan menghentikan proses. Tidak ada penghapusan otomatis.

Perintah migrasi hanya menerima lingkungan `testing`, host lokal, serta nama `rylva_green_*_test`. Impor pertama memerlukan database kosong di luar tabel jurnal. Jalankan ulang setelah berhasil untuk memperoleh `already_applied`; impor dan data tidak digandakan.

Sumber SQL dikunci checksum. Klien MySQL asli menangani delimiter/trigger; salinan sementara menghilangkan definer `root@localhost` agar objek uji menggunakan akun pengimpor. SQL sumber tidak ditulis ulang. Binary logging dimatikan hanya untuk instance uji ini; konfigurasi tersebut bukan konfigurasi server produksi.

## Menjalankan aplikasi PHP

Pada terminal terpisah:

```powershell
pwsh -NoProfile -File tools/preview/serve-php.ps1
```

- [Beranda melalui PHP](http://127.0.0.1:4186/).
- [Pemeriksaan koneksi lokal](http://127.0.0.1:4186/health).
- [Contoh 404 bertingkat](http://127.0.0.1:4186/halaman/tidak-ada).

Launcher mengatur `RYLVA_ENV_FILE` ke `config/.env.testing` dan mencatat error PHP di `storage/logs/development/php-foundation.log`. Gunakan `-phpPath`, `-envFile` atau `-port` untuk jalur/port alternatif. Pengaturan lingkungan proses memiliki prioritas atas nilai berkas; periksa override proses bila nilai berkas seolah diabaikan.

Server Node tetap dapat dipakai untuk workbench state UI. Server Node tidak mengeksekusi PHP. Workbench `__preview` tidak disajikan oleh server aplikasi PHP. Menjalankan halaman HTML melalui PHP juga belum mengganti repository data contoh di JavaScript dengan layanan bisnis.

## Pemeriksaan yang dapat diulang

```powershell
& $phpPath tests/foundation.php
& $phpPath tools/maintenance/audit-backend.php
& $phpPath tools/maintenance/audit-testing-schema.php
$env:RYLVA_PHP_BIN = $phpPath
node tools/testing/verify-foundation-http.cjs
```

Tes HTTP menjalankan server PHP sementara pada port bebas, menggunakan database uji yang sama, lalu menutup server/browser miliknya. Untuk browser, gunakan Edge/Chrome dan runtime `puppeteer-core` melalui `tools/testing/browser-runtime.cjs`. Jalankan satu browser headless pada satu waktu. Laporan dan screenshot berada di `storage/reports/foundation/`.

Tes PHP tidak melakukan reset schema. Layanan MySQL harus sudah aktif dan migrasi berhasil sebelum tes dijalankan. Tes transaksi memakai tabel sementara. Tes konkurensi stok dan aturan transaksi bisnis belum termasuk suite fondasi.

## Kegagalan dan pemulihan

| Kondisi | Langkah berikutnya |
| --- | --- |
| Binari tidak ditemukan | Berikan `-phpPath` atau `-mysqlBinPath` sesuai instalasi; jangan mengganti dengan server statis untuk menguji PHP. |
| Port 13367/4186 terpakai | Periksa proses pemiliknya. Hanya hentikan proses yang diketahui milik pengujian ini, atau pilih port lain melalui launcher. |
| Bootstrap database terputus | Jalankan ulang starter. Kredensial yang disimpan sebelum perubahan akun digunakan kembali; konfigurasi yang sudah ada tidak ditimpa. Jika direktori baru hanya terinisialisasi sebagian atau kredensial rusak, skrip berhenti untuk inspeksi. |
| Konfigurasi tidak lengkap | Periksa nama kunci yang disebut CLI; jangan membagikan isi `.env` atau kredensial runtime. Setelah diperbaiki, jalankan `check` kembali. |
| Impor gagal / jurnal `gagal` atau `dijalankan` | Baca `storage/reports/foundation/migration-error.txt` dan jurnal database. DDL dapat terpasang sebagian. Jangan langsung mengulang dump atau menghapus database yang tidak terverifikasi; pemeriksaan dan pemulihan schema uji dilakukan secara sadar. |
| Checksum SQL berbeda | Rekonsiliasi perubahan dan buat migrasi bernomor berikutnya. Jangan mengganti checksum agar impor yang belum diperiksa lolos. |
| `/health` memberi 503 | Jalankan starter MySQL dan `bin/database.php check`, lalu coba ulang. Respons publik tidak memuat detail koneksi. |
| `/health` memberi 404 di staging/production | Ini sesuai cakupan: diagnosis tersebut hanya didaftarkan di development/testing. |
| Error bootstrap 500 | Periksa log lokal serta runtime/autoload/config. `APP_DEBUG=true` ditolak pada production; respons tidak menampilkan trace. |

Untuk menghentikan PHP foreground gunakan `Ctrl+C` pada terminal launchernya. Untuk mematikan **instance MySQL uji ini** secara terkontrol:

```powershell
& 'C:/laragon/bin/mysql/mysql-8.4.3-winx64/bin/mysqladmin.exe' `
  '--defaults-file=D:/rylva-green/storage/cache/foundation-mysql/admin.ini' shutdown
```

Perintah memakai berkas opsi privat; kata sandi tidak dikirim sebagai argumen. Data tetap ada untuk pemakaian berikutnya. Tidak ada prosedur hapus/reset otomatis dalam runbook ini.

## Batas produksi

Lingkungan ini menguji fondasi aplikasi lokal. Lanjutan [CI dan staging](ci-and-staging.md) menambahkan workflow, mock adapter dan pengujian Apache Windows sesungguhnya. Eksekusi GitHub-hosted, hosting online, autentikasi server, migrasi upgrade dan integrasi transaksi belum diselesaikan. Kredensial uji, data awal dump dan prototipe staf bukan konfigurasi rilis.
