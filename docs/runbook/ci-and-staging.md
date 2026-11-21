# CI dan staging M0

Status 21 November 2026: workflow dan pemeriksaan lokal tersedia, mock adapter diuji, Apache staging lokal terlindungi berjalan. Belum ada eksekusi GitHub-hosted atau deployment online yang diklaim.

## Pipeline GitHub Actions

Workflow `.github/workflows/backend-ci.yml` berjalan pada push, pull request dan pemicuan manual. Matrix memeriksa PHP 8.2/8.3 dengan MySQL 8.4 pada runner Ubuntu 24.04 dan Node 24.

Urutan pemeriksaan:

1. Instal dependensi terkunci dan periksa autoload/platform PHP.
2. Instal alat browser/YAML melalui lockfile terpisah di `tools/testing/`.
3. Periksa workflow dan lint PHP.
4. Audit dependensi Composer dan npm; temuan moderate atau lebih tinggi dari npm menggagalkan langkah tersebut.
5. Siapkan konfigurasi runner privat; impor skema ke database uji kosong, lalu jalankan migrasi lagi untuk memastikan idempotensi.
6. Jalankan tes fondasi, kontrak adapter, audit metadata schema serta pemeriksaan HTTP/browser nyata.
7. Simpan hanya JSON hasil tes dan screenshot yang disebut secara eksplisit selama tujuh hari.

Service MySQL dan kredensial pada workflow bersifat fixture sekali pakai, bukan secrets produksi. Pengaturan `log_bin_trust_function_creators` hanya diterapkan pada service tersebut untuk impor trigger. `prepare-ci.php` memerlukan penanda runner dan menolak menimpa konfigurasi yang sudah ada. Berkas berada di `storage/cache/ci/.env.testing`, bukan `config/.env`.

Workflow memakai izin `contents: read`, tidak memakai `pull_request_target`, tidak menyimpan kredensial checkout dan tidak melakukan deploy. Root runtime browser tidak lagi bergantung pada workbench desain `.hallmark`; lockfile alat dapat diinstal dengan `npm ci --prefix tools/testing --ignore-scripts`.

Pemeriksaan lokal yang tersedia:

```powershell
$phpPath = 'C:/laragon/bin/php/php-8.3.36-Win32-vs16-x64/php.exe'
node tools/testing/verify-ci-workflow.cjs
& $phpPath tools/testing/php-lint.php
& $phpPath tests/foundation.php
& $phpPath tests/integration/provider-contracts.php
node tools/testing/verify-foundation-http.cjs
```

Untuk suite foundation/HTTP, jalankan MySQL uji dahulu sesuai [runbook fondasi](local-foundation.md). Alat lint resmi `actionlint` juga telah dijalankan lokal; binary hasil unduhan berada di cache yang diabaikan Git. Pengecekan shellcheck tidak dijalankan pada Windows ini.

Verifikasi lokal memakai database uji baru dan konfigurasi berbentuk runner telah lulus, termasuk impor pertama, migrasi ulang, tes fondasi, adapter dan HTTP/browser. Ini membuktikan perintah lokal dapat dijalankan bersama; matrix Linux/PHP 8.2 dan status check GitHub belum dieksekusi. Workflow baru muncul di GitHub setelah berkas dikomit/didorong atas permintaan pengguna.

Referensi: [GitHub service containers](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers), [setup PHP](https://github.com/shivammathur/setup-php), [Composer audit](https://getcomposer.org/doc/03-cli.md#audit).

## Apache staging lokal

```powershell
pwsh -NoProfile -File tools/preview/start-staging-apache.ps1
node tools/testing/verify-staging.cjs
```

Alamat: `http://127.0.0.1:4187`. Server hanya mendengarkan loopback dan memakai autentikasi Basic untuk seluruh storefront, prototipe staf serta aset. Kredensial acak dan hash bcrypt berada di `storage/cache/apache-staging/`; jangan bagikan/commit berkas tersebut. Penguji membaca kredensial dari berkas privat tanpa mencetaknya. Untuk peninjauan manual, pemilik dapat membaca `review-credentials.json` lokal dan memasukkannya pada dialog browser.

Launcher memakai Apache/PHP Laragon yang tersedia dan konfigurasi terpisah; tidak mengubah `httpd.conf` Laragon atau memasang Windows service. Override environment menetapkan `APP_ENV=staging` dan debug nonaktif. Database yang digunakan untuk pemeriksaan lokal tetap database uji terisolasi; tidak ada layanan bisnis yang menulis data melalui halaman prototipe.

Template secara eksplisit mengizinkan override `Indexes`, `MultiViews` dan `FollowSymLinks` yang diperlukan `.htaccess`. Hasil `httpd -t` saja tidak cukup: tes request nyata diperlukan karena kesalahan override baru muncul saat `.htaccess` diproses. Pemeriksaan telah mencakup auth, alias/query, larangan berkas privat/direktori, status error, HEAD, noindex dan render 1440/390 px.

Untuk menghentikan instance, baca PID/konfigurasi pada `storage/cache/apache-staging/process.json`, cocokkan command line proses dengan `httpd.conf` runtime workspace, lalu hentikan hanya proses Apache tersebut beserta anaknya. Jangan menghentikan semua proses Apache di mesin atau memakai nama service Laragon yang berbeda.

## Paket staging yang dapat ditinjau

```powershell
& $phpPath tools/maintenance/build-staging.php
```

Builder membuat ZIP baru di `storage/reports/staging/`, berisi `public/`, `src/`, konfigurasi kode, dependensi vendor, template deploy dan metadata Composer. `.htaccess` wajib ada. `.env`, kredensial, cache/log, workbench tersembunyi dan alat pengujian tidak ikut dikemas. Paket menggunakan working tree saat ini; setiap berkas dicatat dalam `release-manifest.json` dan hash isinya diperiksa ulang setelah ZIP ditulis.

Laporan `storage/reports/staging/package.json` menyimpan lokasi ZIP, SHA-256 dan `deployed: false`. Builder tidak mengunggah apa pun, mengubah symlink server atau mengimpor database. Paket tetap prototipe untuk peninjauan terlindungi; bukan rilis transaksi produksi.

## Menjalankan pada hosting yang dipilih

Pengguna menetapkan **Dza Software** dan **domain utama `rylvagreen.biz.id`** sebagai tujuan staging. Docker tidak diperlukan untuk stack PHP Native ini; penyesuaian mengikuti fasilitas PHP/MySQL dan document root hosting. Akses privat telah diisi pada `config/deployment.local.json`, yang dikecualikan dari Git dan paket. Jangan mengirim kata sandi melalui chat.

Template nonrahasia: `config/deployment.example.json`. Host/port, akun dan sandi diisi dari informasi hosting. Jika folder belum diketahui, kolom path boleh dikosongkan untuk pemeriksaan koneksi baca saja; tata letak wajib ditentukan sebelum upload. Penguji koneksi tidak mengunggah, menghapus atau mengganti berkas:

```powershell
& $phpPath tools/maintenance/check-ftp-staging.php
```

Probe mendukung FTP, FTPS dengan verifikasi sertifikat, dan SFTP dengan kunci host yang dipin. Pengguna kemudian mengonfirmasi paket hosting hanya menyediakan FTP port 21 dan secara eksplisit mengizinkan deployment melalui FTP biasa. Konfigurasi lokal telah disesuaikan ke `protocol: ftp`, port 21, tanpa mengubah nilai kredensial. Jangan meminta persetujuan transport yang sama lagi untuk deployment ini.

Root virtual FTP sekarang memuat `/rylvagreen.biz.id` dan direktori privat baru di sebelahnya. Domain lain dan `.well-known` dipertahankan. HTTPS valid dan entry point dapat membaca rilis privat. [Pengujian PHP 8.2.36](../coverage/php82-hosting-compatibility.md) lulus lokal; Docker tidak diperlukan.

Admin hosting tidak mengizinkan perubahan Nginx. Sesuai permintaan pengguna, [mode query](dza-nginx-routing.md) memakai `/index.php?route=/pages/public/home.html`, tanpa mengandalkan rewrite atau PATH_INFO. HTML, kode internal dan konfigurasi tetap privat; aset statis dapat dibaca langsung oleh Nginx. Basic hanya membatasi peninjauan staging, bukan autentikasi bisnis.

```powershell
& $phpPath tools/maintenance/build-staging.php
& $phpPath tools/maintenance/prepare-ftp-deployment.php
& $phpPath tools/maintenance/deploy-ftp-staging.php private
& $phpPath tools/maintenance/deploy-ftp-staging.php assets
& $phpPath tools/maintenance/deploy-ftp-staging.php activate
node tools/testing/verify-ftp-staging.cjs
node tools/testing/verify-query-navigation.cjs
```

Simpan jurnal rilis lama sebelum menyiapkan rilis baru; skrip menolak jurnal milik rilis berbeda. Berkas sementara dibaca kembali lewat FTP dan checksum-nya diperiksa sebelum rename. Adapter routing mengubah salinan paket berdasarkan AST; kode UI sumber tetap menggunakan URL logis. Kredensial peninjau hanya berada di `config/staging-review.local.json` yang diabaikan Git. [Catatan pemasangan](hosting-installation-plan.md) menjelaskan tata letak, backup dan batas rollback.

Probe/installer PHP sementara yang ditolak sebelumnya tidak digunakan. Pengguna memilih akses folder privat; pemasangan langsung tidak menjalankan SQL atau mengubah data hosting. Koneksi PDO, ekstensi database dan versi MySQL online belum diverifikasi; **jangan menjalankan importer uji pada database staging/produksi**.

Eksekusi CI GitHub, vendor/sandbox, kebijakan publik final, email, OAuth, MFA dan transaksi tetap pekerjaan berikutnya. Pemasangan staging tidak menjadikan alur bisnis prototipe sebagai transaksi produksi.
