# Pemasangan staging melalui FTP

Diperbarui 21 November 2026. Tujuan: `https://rylvagreen.biz.id` pada Dza Software, memakai FTP port 21 sesuai izin eksplisit pengguna. Docker tidak diperlukan.

## Tata letak

Path virtual FTP `/rylvagreen.biz.id` adalah document root domain. Kode internal, vendor, HTML, konfigurasi database dan hash peninjau disimpan pada `/_rylva_green_private/releases/<releaseId>`, di sebelah folder domain. Public root hanya memuat entry point permanen `index.php`, aset statis, `.htaccess`, dan `.user.ini`. Dua folder domain lainnya serta direktori `.well-known` dipertahankan.

Jangan memakai path absolut `/home/berryl/...` sebagai path virtual FTP. Jangan menempatkan `.env`, kode internal atau HTML staf di document root untuk mengatasi keterbatasan hosting.

## Routing tanpa perubahan Nginx

Admin hosting tidak mengizinkan perubahan Nginx. Pengguna meminta fallback `/index.php/...` atau query string; implementasi memilih query karena entry point PHP sudah terbukti berjalan tanpa dukungan PATH_INFO.

Contoh: `/index.php?route=%2Fpages%2Fpublic%2Fhome.html`. Filter tetap menjadi parameter tersendiri, misalnya `&q=monstera&page=2`. Fragmen artikel tetap `#pemesanan`. Jalur aset tetap `/assets/...`.

`deploy/php/StagingQueryRouting.php` memvalidasi route dan menyesuaikan redirect serta base HTML. Adapter hosting mengubah referensi URL JavaScript berdasarkan AST pada salinan paket, mempertahankan variabel lokal, string, serta nama kolom data. Kode UI sumber tetap memakai URL logis. Tautan HTML awal dan dinamis diarahkan ke entry point, termasuk tautan yang dibuka pada tab baru. Tidak mengubah framework atau aturan bisnis.

## Perintah dan bukti

1. `tools/maintenance/build-staging.php` membuat ZIP working tree dengan manifest SHA-256; kredensial tidak ikut dikemas.
2. `tools/maintenance/prepare-ftp-deployment.php` menyiapkan rilis privat, konfigurasi dan aset. Adapter `prepare-query-routing.cjs` hanya mengubah salinan rilis, lalu memperbarui checksum transfer.
3. `tools/maintenance/deploy-ftp-staging.php private` mengunggah aplikasi privat. Berkas dibaca kembali melalui FTP dan checksum dicocokkan sebelum rename.
4. Tahap `assets` memasang aset sebelum entry point baru diaktifkan; tahap `activate` memasang gateway. Jurnal rilis lama dipertahankan pada `storage/reports/staging/history/`.
5. `tools/testing/verify-ftp-staging.cjs` memeriksa 54 dokumen, akses peninjau, status HTTP, larangan berkas privat dan render desktop/ponsel.
6. `tools/testing/verify-query-navigation.cjs` memeriksa pencarian–detail–kembali, filter/reload, panduan, masuk/daftar, fragmen, tautan native, mode tanpa JavaScript dan penolakan route tidak valid.

Kredensial peninjau dibaca dari `config/staging-review.local.json`, yang diabaikan Git. Jangan mencetak atau menyalin sandinya ke chat/laporan. Akses Basic ini hanya pembatasan peninjauan, bukan autentikasi bisnis pelanggan/staf. Aset statis tidak mengandung rahasia dan dapat dilayani langsung oleh Nginx.

## Pemulihan dan batas

Backup entry point lama tersimpan lokal sebelum ditimpa. Pemulihan memakai entry point/rilis terdahulu dan aset yang sesuai; siapkan backup aset lengkap sebelum pembaruan terhadap situs yang sudah berisi aplikasi. Skrip tidak menghapus rilis, domain lain, atau database. Jurnal rilis berbeda tidak dapat dilanjutkan tanpa pengarsipan yang disengaja.

Probe/installer PHP sementara sebelumnya ditolak pemeriksaan persetujuan otomatis; pengguna memilih menyediakan folder privat. Pemasangan ini memakai transfer langsung dan entry point aplikasi permanen. Tidak ada installer/probe sementara yang digunakan atau SQL yang dijalankan di hosting.

PHP 8.2 telah diuji langsung secara lokal. HTTPS domain valid dan PHP dapat membaca rilis privat. Koneksi PDO/versi MySQL online belum diverifikasi. UI bisnis masih pratinjau; transaksi nyata dan eksekusi CI GitHub belum menjadi selesai karena deployment ini. Tidak ada commit/push pada tugas ini.
