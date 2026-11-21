# ADR-002 — Fondasi backend dan impor database uji lokal

Tanggal: 21 November 2026. Status: diterapkan untuk pengembangan lokal dalam pekerjaan M0. Tidak mengubah aturan bisnis v2.6 atau menetapkan topologi produksi.

## Konteks

UI publik/staf telah tersedia sebagai prototipe, sementara bootstrap, routing dan sebagian besar layanan PHP masih kerangka. Spesifikasi A.12 meminta lingkungan pengembangan, migrasi dan pemeriksaan otomatis; 27.4 meminta pemetaan nama kanonis sebelum membuat master paralel.

Mesin ini mempunyai PHP 8.3.36/MySQL 8.4.3 Laragon tanpa binari pada PATH. Memakai database yang sudah ada akan mencampur data pengujian dengan data pengguna. Dump menyediakan view kompatibilitas dan definer eksplisit yang memerlukan penanganan saat impor dengan akun terbatas.

## Keputusan

1. Tetap memakai PHP Native, PDO dan MySQL/InnoDB. Kelas konfigurasi berada dalam namespace PSR-4 `src/Config/`; berkas `config/` mengembalikan pengaturan, bukan menjadi tempat kelas aplikasi.
2. Jalankan instance MySQL khusus workspace pada loopback 13367 dan database `rylva_green_m0_test`. Buat kredensial acak; jangan ubah `config/.env`. Starter mengenali instance dari datadir/port dan tidak mereset data secara otomatis.
3. Impor baseline melalui klien MySQL asli dengan manifest bernomor, checksum, advisory lock dan jurnal. Normalisasi definer hanya pada salinan sementara. Batasi perintah pada database uji lokal; impor yang gagal harus diinspeksi karena DDL tidak diperlakukan sebagai transaksi yang dapat dipulihkan seluruhnya.
4. Pakai nama kanonis yang sudah ada; pertahankan alias sebagai view. Sinkronisasi counter stok/lokasi/buku besar ditetapkan sebagai pekerjaan layanan M2 dengan tes konkurensi, bukan perubahan SQL tanpa bukti alur bisnis.
5. Aplikasi masuk melalui `public/index.php`. Error memakai format JSON terkontrol atau halaman ilustrasi yang sudah tersedia. Tambahkan diagnosis `GET /health` hanya pada development/testing dan gunakan manifest alias HTML bersama untuk kompatibilitas.
6. Kredensial lokal berada pada berkas opsi/env yang diabaikan Git. Admin MySQL memakai shared memory; tidak menurunkan metode autentikasi root agar bisa dipakai lewat TCP. Binary logging dimatikan khusus instance pengujian, tanpa mengubah server lain.

## Konsekuensi

- Pengujian dapat diulang tanpa menimpa konfigurasi/database pengguna; impor sukses tidak dijalankan dua kali.
- Tes fondasi memberi bukti koneksi, respons HTTP, kesalahan dan transaksi database; bukan bukti integrasi stok/pembayaran/auth.
- Prosedur ini belum mencakup upgrade database berisi data, migrasi produksi atau deploy. Staging/proxy/CI dan kontrak adapter masih perlu diselesaikan pada M0.
- Keterbatasan/hasil aktual dicatat di [cakupan M0](../coverage/backend-foundation-m0.md), dengan cara menjalankan di [runbook](../runbook/local-foundation.md).

Referensi transport lokal: [dokumentasi pengujian MySQL Windows](https://dev.mysql.com/doc/refman/8.4/en/windows-testing.html), [opsi koneksi MySQL](https://dev.mysql.com/doc/refman/8.4/en/connection-options.html).
