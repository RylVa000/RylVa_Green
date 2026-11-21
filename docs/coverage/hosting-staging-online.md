# Staging online Dza Software

Tanggal: 21 November 2026. Status: **siap untuk peninjauan UI/fondasi** di [rylvagreen.biz.id](https://rylvagreen.biz.id). Modul bisnis tetap pratinjau.

## Hasil pemasangan

| Area | Bukti |
| --- | --- |
| Rilis | `20261121_153053_d452a930`; ZIP sumber 599 berkas, transfer final 604 berkas termasuk konfigurasi privat dan entry point. |
| Integritas | Manifest sumber diperiksa; setiap transfer diverifikasi dengan SHA-256 melalui FTP sebelum rename. Jurnal akhir mencocokkan seluruh checksum rencana. |
| Routing | `/index.php?route=/pages/public/home.html`; root domain dan `/index.php` mengarahkan peninjau ke beranda dengan mode query. Tidak memerlukan rewrite Nginx atau PATH_INFO. |
| Penyimpanan | HTML, source, vendor, konfigurasi database dan hash peninjau berada pada rilis privat di luar folder domain. Public root memuat entry point permanen serta aset statis. |
| Akses | Dokumen storefront/staf memerlukan akun peninjau Basic; kredensial salah ditolak. HTML diberi noindex dan no-store. Aset tidak mengandung rahasia dan dapat diakses langsung. |
| Domain | DNS/HTTPS domain nyata berhasil; verifikasi TLS tidak dimatikan dan IP FTP tidak dipakai sebagai pengganti origin HTTPS. |
| Pelestarian | Dua domain lain dan `.well-known` dipertahankan; entry point lama dicadangkan lokal dan jurnal/rilis awal disimpan untuk riwayat. |

Admin hosting menolak perubahan Nginx. Atas permintaan pengguna, mode query menggantikan rencana rewrite. Adapter AST menyesuaikan 112 skrip pada salinan paket, sementara kode UI sumber tetap menggunakan URL logis. Tautan HTML awal/dinamis, redirect, history dan fragmen memakai jalur yang sama. Tidak ada installer/probe PHP sementara, perubahan SQL hosting, commit atau push.

## Pemeriksaan yang dijalankan

- **9 kelompok HTTP/render online lulus**, mencakup seluruh 54 dokumen HTML dengan status yang sesuai, akses anonim/salah kredensial, alias/query, error botani, berkas privat/dotfile, HEAD, penolakan POST pada dokumen statis, dan aset.
- **10 kelompok navigasi lulus online**: AST mempertahankan string/binding lokal/kolom stok, route invalid ditolak, pencarian → katalog → produk → kembali memulihkan query, filter/reload, panduan/Back, masuk/daftar/returnTo, fragmen/reload, tautan native dan mode tanpa JavaScript.
- Beranda, pratinjau Akun dan 404 dirender pada 1440 serta 390 px tanpa overflow, JavaScript error atau respons aset gagal. Screenshot online diperiksa untuk kesesuaian tampilan.
- Kedua suite tersebut juga lulus lokal pada PHP 8.2.36 dengan server tanpa rewrite. Lint 158 berkas PHP, 61 pemeriksaan fondasi lokal, 10 penjagaan deployment, pemeriksaan sintaks JavaScript dan npm audit lulus. Tes database fondasi memakai database uji lokal terisolasi.

Laporan mesin: `storage/reports/staging/ftp-deployment.json`, `package.json`, `online/tests.json`, dan `online/navigation.json`. Screenshot: `storage/reports/staging/online/`. Jurnal berstatus `review-ready`; paket berstatus `deployed: true` setelah bukti transfer dan pengujian online dicocokkan.

## Akses dan batas

Pemilik membaca akun peninjau dari `config/staging-review.local.json`, yang dikecualikan dari Git dan paket sumber. Jangan menaruh sandinya di chat/dokumentasi. Akun ini tidak menggantikan autentikasi pelanggan/staf yang direncanakan pada M1.

URL lama yang langsung menuju `.html` dapat tetap 404 di Nginx; tautan aplikasi menggunakan entry point query. Tidak diperlukan perubahan konfigurasi hosting untuk mode ini. Perintah, tata letak dan batas rollback ada pada [runbook pemasangan](../runbook/hosting-installation-plan.md) serta [routing query](../runbook/dza-nginx-routing.md).

**Belum dibuktikan:** koneksi PDO/ekstensi database/versi MySQL online, eksekusi CI GitHub-hosted, dan layanan bisnis M1–M8. Database hosting tidak diubah. Staging yang dapat dibuka tidak berarti checkout, autentikasi atau pembayaran sudah memproses data produksi.
