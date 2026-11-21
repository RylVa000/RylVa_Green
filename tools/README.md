# Alat pengembangan

- `maintenance/`: audit struktur dan utilitas reorganisasi.
- `preview/`: utilitas pratinjau/capture yang dipindahkan dari workbench desain.
- `testing/`: dependensi bersama untuk pengujian browser.
- `archive/`: generator, formatter, snapshot dan percobaan historis; jangan menjalankannya untuk membangun ulang proyek saat ini.

Pemeriksaan UI berada di `tests/e2e/browser/`. Fondasi PHP diperiksa melalui `tests/foundation.php` dan `tools/testing/verify-foundation-http.cjs`. Semua perintah dijalankan dari root proyek. Aplikasi tidak memuat JavaScript dari direktori `tools/`.

Lingkungan backend lokal: `testing/start-foundation-mysql.ps1` menyiapkan instance database uji terpisah; `preview/serve-php.ps1` menjalankan aplikasi melalui `public/index.php`. Audit kode dan metadata skema tersedia pada `maintenance/audit-backend.php` dan `maintenance/audit-testing-schema.php`. Lihat [runbook](../docs/runbook/local-foundation.md) untuk urutan perintah, kebutuhan runtime dan pemulihan.

CI/staging: `testing/php-lint.php`, `testing/verify-ci-workflow.cjs`, `preview/start-staging-apache.ps1`, `testing/verify-staging.cjs` dan `maintenance/build-staging.php`. Dependensi alat browser/YAML dikunci pada `testing/package-lock.json`; instal dengan `npm ci --prefix tools/testing --ignore-scripts`. [Runbook CI/staging](../docs/runbook/ci-and-staging.md) membedakan bukti lokal dari eksekusi/deployment remote.

Hosting FTP Dza: `maintenance/prepare-ftp-deployment.php` menyiapkan rilis privat dan aset tanpa rahasia publik; `maintenance/prepare-query-routing.cjs` memakai Acorn/eslint-scope yang dikunci untuk menyesuaikan salinan rilis ke URL query tanpa perubahan Nginx. `maintenance/deploy-ftp-staging.php` menjalankan tahap `private`, `assets`, lalu `activate` dengan checksum serta jurnal lokal. Tidak ada installer/probe PHP sementara atau impor database. `testing/verify-ftp-staging.cjs` memeriksa HTTPS, akses peninjau, 54 dokumen dan render; `testing/verify-query-navigation.cjs` memeriksa alur navigasi, konteks kembali, fragmen dan route invalid. Lihat [routing query](../docs/runbook/dza-nginx-routing.md).
