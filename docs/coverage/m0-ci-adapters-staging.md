# Penyelesaian lokal CI, adapter dan staging M0

Tanggal: 21 November 2026. Pekerjaan melanjutkan [fondasi backend M0](backend-foundation-m0.md).

| Area | Hasil | Batas yang masih berlaku |
| --- | --- | --- |
| CI | Workflow GitHub Actions, lint portabel, konfigurasi runner privat, lockfile alat, pemeriksaan workflow dan audit dependensi tersedia. | GitHub-hosted Linux/PHP matrix belum berjalan karena belum ada commit/push pada tugas ini. |
| Pembayaran | Kontrak internal dan mock create/status/refund/webhook, error terstruktur dan idempotensi tersedia. | Tanpa vendor/API gateway dan tanpa perubahan database bisnis. |
| Kurir | Kontrak quote/create/track/webhook, tarif fixture eksplisit, kedaluwarsa quote dan penanganan gangguan tersedia. | Tidak membuktikan cakupan area/ongkir/SLA nyata. |
| Staging lokal | Apache 2.4.69/PHP 8.3.36 berjalan di loopback 4187 dengan akses peninjau, noindex dan document root `public/`. | Bukan deployment online; Linux FPM/proxy/TLS belum diuji. |
| Staging online | HTTPS Dza Software terpasang dengan rilis privat dan routing query; 54 dokumen serta 19 kelompok pemeriksaan HTTP/render/navigasi lulus. | Database online, transaksi dan CI GitHub-hosted tetap belum diverifikasi. |
| Paket | ZIP sumber aplikasi/aset/vendor dengan manifest SHA-256 dibuat dan diverifikasi; rilis privat sudah diunggah. | Konfigurasi rahasia ditambahkan hanya pada transfer privat, di luar document root. |
| Backlog | Prasyarat dan pekerjaan lanjutan M0–M4 dipetakan ke kode serta tes. | Estimasi kalender belum dipercepat tanpa bukti kapasitas tim/staging. |

## Bukti pengujian

- 61 pemeriksaan fondasi PHP lulus, termasuk setelah konfigurasi tes dibuat hermetis dari override environment runner.
- 59 pemeriksaan kontrak adapter lulus: validasi nominal/currency, COD di luar gateway, idempotensi dan konflik, timeout setelah hasil tersimpan, refund berulang/kelebihan nominal, signature rusak, timestamp replay, quote kosong/kedaluwarsa dan pelacakan terputus.
- 13 kelompok HTTP/browser lulus dengan konfigurasi runner dan database baru; impor pertama `applied`, pengulangan `already_applied`.
- 9 kelompok Apache staging lulus, termasuk penolakan akses anonim/salah kredensial, alias/query, error botani, berkas privat, HEAD dan render desktop/ponsel.
- 8 kelompok pemeriksaan workflow lulus; `actionlint` resmi v1.7.12 tidak menemukan masalah. Shellcheck tidak dijalankan.
- Lint 153 berkas PHP dan autoload PSR-4 lulus. Composer audit bersih. npm audit bersih setelah dependensi YAML diperbarui ke 2.9.1; pustaka 2.8.2 yang sempat diuji tidak dipertahankan.
- 10 pemeriksaan penjagaan konfigurasi deployment lulus tanpa panggilan jaringan: konfigurasi tidak lengkap/rusak, host/port invalid, URL non-HTTPS, traversal, direktori privat di dalam publik, newline, protokol tidak dikenal dan pin SSH yang hilang ditolak. FTP biasa kini didukung sesuai izin eksplisit pengguna untuk hosting ini.
- Paket staging memuat 593 berkas aplikasi sebelum manifest; integritas seluruh berkas dan keberadaan `.htaccess`, front controller serta autoload diperiksa ulang.

Laporan mesin tersimpan di `storage/reports/ci/`, `storage/reports/foundation/` dan `storage/reports/staging/`. Laporan lokal parity mencatat jumlah pemeriksaan saat rangkaian tersebut dijalankan (55 pemeriksaan adapter); suite adapter kemudian diperluas menjadi 59 dan dijalankan ulang tersendiri. Jangan menyamakan local parity dengan eksekusi GitHub-hosted.

Tidak ada perubahan visual UI atau penggantian repository data contoh. Staf, checkout dan pembayaran tetap prototipe sampai izin serta layanan bisnis diimplementasikan. Mock sengaja menolak lingkungan staging/production.

## Temuan yang diperbaiki

1. Probe konfigurasi tes sebelumnya mewarisi `APP_*`/`DB_*` dari proses. Nilai runner dapat menutupi fixture invalid. Probe kini membersihkan override tersebut dan hanya memakai override eksplisit milik skenario.
2. Jalur PHP/browser sebelumnya mengandalkan instalasi Windows dan `.hallmark`. Runner sekarang mendukung PHP di PATH, Chromium Linux, konfigurasi tes terpisah dan dependensi alat terkunci.
3. Akses `.htaccess` pada Apache memerlukan izin override opsi yang eksplisit. Masalah terlihat melalui request nyata dan diperbaiki dalam template staging.
4. Pustaka YAML awal terdeteksi memiliki advisory moderate. Versi yang dikunci telah diperbarui dan audit diulang hingga bersih.

## Pekerjaan tersisa

M0 tetap berstatus **Dikerjakan** sampai pipeline benar-benar hijau di GitHub dan staging online diuji. Pengguna memilih Dza Software dan domain utama `rylvagreen.biz.id`, lalu mengisi akses privat. Pengguna mengonfirmasi hosting hanya menyediakan FTP port 21 dan secara eksplisit mengizinkan deployment memakai FTP biasa. Setelah akses diperbarui, login berhasil (`230 Login successful`). Tidak ada permintaan ulang untuk izin transport yang sama.

Akses FTP telah diperluas hingga folder domain dan rilis privat di sebelahnya. Kode internal, konfigurasi dan HTML ditempatkan di luar document root; entry point serta aset berada di folder domain. Dua domain lain dan `.well-known` dipertahankan. Probe/installer PHP sementara yang ditolak sebelumnya tidak digunakan; pengguna memilih menyediakan akses privat.

PHP 8.2.36 telah diuji langsung secara lokal dan lulus pemeriksaan platform, lint, 61 tes fondasi, 59 tes provider, 10 tes validasi deployment dan 13 kelompok HTTP/browser. [Laporan kompatibilitas](php82-hosting-compatibility.md) membedakan hasil lokal dari kemampuan hosting yang belum diperiksa.

DNS/HTTPS domain sekarang valid. Admin tidak mengizinkan perubahan Nginx; pengguna meminta fallback aplikasi. Rilis memakai `/index.php?route=...`, dengan adapter URL pada salinan paket agar filter, navigasi kembali, tautan native dan fragmen tetap bekerja. Sembilan kelompok HTTP/render dan sepuluh kelompok navigasi lulus lokal serta online; [laporan hosting online](hosting-staging-online.md) mencatat rilis dan batasnya. Tidak ada perubahan database hosting, commit atau push. Koneksi PDO/versi MySQL online belum diverifikasi. Docker tidak diperlukan.

Implementasi berikutnya mengikuti [backlog terurut](../implementation-backlog.md), dimulai dari keamanan/sesi M1 setelah gerbang fondasi terkait terpenuhi. Kontrak ada di [arsitektur integrasi](../architecture/integration-contracts.md); perintah lengkap di [runbook CI/staging](../runbook/ci-and-staging.md).
