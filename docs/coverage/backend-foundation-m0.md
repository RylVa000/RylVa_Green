# Fondasi backend M0 — 21 November 2026

Lima pekerjaan lokal yang diminta telah dilaksanakan berurutan. Perkembangan berikutnya: [CI, kontrak/mock adapter dan staging Apache lokal](m0-ci-adapters-staging.md) telah tersedia. M0 secara keseluruhan masih **Dikerjakan** sampai eksekusi GitHub dan staging online terverifikasi. UI transaksi tetap menggunakan repository contoh sampai layanan bisnis dihubungkan.

## Hasil pekerjaan

| Urutan | Pekerjaan | Hasil yang dapat diperiksa |
| --- | --- | --- |
| 1 | Audit backend aktual | Inventaris PHP sebelum perubahan dari Git HEAD dan sesudah perubahan dari working tree. Kode yang terisi dibedakan dari kerangka, tanpa menganggapnya sebagai fitur selesai. |
| 2 | Periksa skema v2.6 | Impor SQL asli berhasil pada MySQL uji; nama kanonis, view kompatibilitas, relasi, tipe kolom dan risiko stok dipetakan di bawah. |
| 3 | Lingkungan PHP/MySQL | PHP 8.3.36 dan MySQL 8.4.3 lokal; instance database khusus pada loopback port 13367, terpisah dari database pengguna. |
| 4 | Bootstrap dan routing | Autoload → konfigurasi → Request → Kernel → controller → Response berjalan. Halaman/aset lama dan alias HTML dipertahankan. |
| 5 | Pengujian dasar | Tes konfigurasi, JSON, routing, error, PDO, transaksi dan migrasi berulang dijalankan; tes HTTP dan render memakai server PHP nyata. |

## Audit kode

Inventaris menggunakan tokenizer PHP. Status `scaffold` berarti hanya berisi deklarasi/comment; `code_present` berarti ditemukan kode, bukan penilaian bahwa implementasinya lengkap atau aman untuk produksi. Tabel berikut merupakan snapshot setelah fondasi lokal awal, sebelum adapter ditambahkan. Laporan working tree yang dibangun ulang dapat mencerminkan perkembangan berikutnya.

| Area | Sebelum: kode terisi | Sebelum: kerangka | Sesudah: kode terisi | Sesudah: kerangka |
| --- | ---: | ---: | ---: | ---: |
| `src/` | 3 | 93 | 12 | 89 |
| `config/` | 2 | 3 | 4 | 1 |
| `tests/` — PHP | 0 | 8 | 3 | 7 |
| `bin/` | 0 | 22 | 1 | 22 |

Kode awal yang terisi di `src/` adalah `DatabaseConnection`, `PdoConnectionFactory` dan `ClientIpResolver`. Controller bisnis, autentikasi, middleware keamanan, state machine, reservasi/komit stok, adapter vendor dan cron sebagian besar masih kerangka. Tujuh berkas tes bisnis PHP yang tersisa juga belum merupakan tes yang berjalan.

Inventaris lengkap, hash dan referensi Git tersedia secara lokal di `storage/reports/foundation/backend-inventory-baseline.json` dan `backend-inventory.json`. Jalankan ulang melalui:

```powershell
& $phpPath tools/maintenance/audit-backend.php --baseline
& $phpPath tools/maintenance/audit-backend.php
```

`--baseline` membaca HEAD saat perintah dijalankan. Laporan sebelum perubahan yang dibuat pada sesi ini menyimpan hash HEAD acuannya; setelah commit baru, HEAD tidak lagi berarti kondisi sebelum M0.

## Rekonsiliasi skema

Acuan: [spesifikasi 27.4](../specifications/spesifikasi-proyek-v2.6.md) dan `database/schema/DB_RylVa_Green.sql`. SQL asli tidak diubah. Manifest bernomor `database/migrations/0001_initial_schema.php` mengunci checksum sumber.

Impor terverifikasi menghasilkan **68 tabel bisnis InnoDB, 10 view, 136 foreign key dan 23 trigger**. Tabel jurnal baru `migrasi_skema` membuat total tabel fisik menjadi **69**. Pemeriksaan metadata tidak menemukan perbedaan tipe kolom pada pasangan foreign key. Ini memeriksa struktur impor, bukan kelulusan seluruh aturan bisnis.

| Kebutuhan | Nama kanonis / struktur aktual | Keputusan integrasi |
| --- | --- | --- |
| Kategori | `kategori_produk`, `relasi_produk_kategori` | `kategori` adalah view kompatibilitas; hindari master kategori kedua. |
| Atribut dan varian | `atribut_produk`, `pilihan_atribut_produk`, `nilai_atribut_produk`, `varian_produk`, `nilai_atribut_varian` | Gunakan identitas varian/SKU dan relasi yang tersedia; validasi kombinasi di server pada M2. |
| Saldo barang per lokasi | `stok_varian_produk`, `lokasi_stok` | Saldo lokasi dan counter ringkasan produk/varian perlu diperbarui secara atomik oleh layanan stok. |
| Mutasi barang | `riwayat_perubahan_stok_produk` | `mutasi_stok_produk` adalah view, bukan buku besar terpisah. |
| Batch dan paket | `batch_persediaan`, `komponen_paket_berkebun` | Alokasi FEFO, reservasi komponen dan pengujian atomisitas belum diimplementasikan. |
| Snapshot pembelian | Kolom snapshot pada `item_pesanan` | `snapshot_produk_pesanan` adalah view; jangan menyalin snapshot ke master kedua. |
| Master bahan | `bahan_produksi` | `bahan_florist` adalah view kompatibilitas. |
| Saldo bahan | `stok_bahan_produksi` | `stok_bahan_florist` adalah view; kuantitas bahan menggunakan desimal sesuai skema, berbeda dari kuantitas barang jual. |
| Mutasi bahan | `riwayat_perubahan_stok_bahan` | `mutasi_stok_bahan` adalah view. |
| Resep dan kebutuhan buket | `resep_buket`, `detail_resep_buket`, `kebutuhan_bahan_opsi_buket`, `kebutuhan_bahan_buket_pesanan` | Pisahkan resep dasar, tambahan kebutuhan opsi dan snapshot kebutuhan pesanan; kalkulator server perlu memastikan tidak dihitung dua kali. |
| Pilihan buket | `kategori_pilihan_buket`, `opsi_pilihan_buket`, konfigurasi/pilihan per keranjang dan pesanan | Gunakan struktur per tahap yang sudah tersedia; tidak membuat tabel generik paralel dari nama konseptual spesifikasi. |
| Reservasi | `reservasi_stok_pesanan`, `vw_stok_tersedia_checkout` | State dan kolom tersedia; layanan transisi, kedaluwarsa dan konkurensi masih belum terisi. |

Sebagian `CREATE TABLE` bernama alias dalam dump merupakan placeholder pembuatan view. Jenis objek setelah impor telah diperiksa melalui `information_schema`; jangan menyimpulkannya sebagai master ganda dari pencarian nama saja.

### Temuan yang harus diselesaikan sebelum integrasi stok

1. `produk.jumlah_stok_jual` dan `varian_produk.jumlah_stok_varian` merupakan ringkasan, sedangkan `stok_varian_produk` menyimpan saldo lokasi. View checkout saat ini membaca counter ringkasan lalu mengurangi reservasi aktif. Tidak ditemukan trigger sinkronisasi ketiga struktur tersebut. M2 perlu satu layanan penulisan stok dalam transaksi, disertai pemeriksaan kesesuaian saldo dan mutasi.
2. Foreign key produk dan varian pada saldo/reservasi berdiri sendiri. Layanan wajib memeriksa bahwa varian memang milik produk terkait, termasuk saat menerima ulang data dari UI.
3. `varian_produk_id` pada saldo lokasi dan resep boleh `NULL`, sementara menjadi bagian indeks unik gabungan. Uji kasus produk tanpa varian dan resep default sebelum menentukan migrasi penguatan keunikan; belum ada perubahan SQL untuk kasus ini.
4. Aturan paket, snapshot kebutuhan buket, pencegahan saldo negatif, idempotensi dan perebutan stok terakhir belum terbukti hanya dengan impor. Jalankan tes bisnis M2–M4 yang sekarang masih kerangka setelah layanan dibuat.

Dump mengandung data awal. Data tersebut dipakai hanya untuk pengujian struktur lokal dan tidak dinyatakan sebagai katalog, stok, akun atau kebijakan toko yang sudah terverifikasi.

Metadata dapat dibangun ulang dengan `tools/maintenance/audit-testing-schema.php`; hasilnya `storage/reports/foundation/schema-inventory.json`. Tidak ada nilai data pelanggan yang diekspor oleh audit tersebut.

## Kontrak fondasi HTTP

| Permintaan | Hasil |
| --- | --- |
| `GET /`, `GET /index.php` | 302 menuju halaman Beranda yang sudah tersedia. |
| Alias HTML dalam `config/preview-pages.json` | 302 ke tujuan yang sama seperti pratinjau Node; parameter query dibawa. |
| `GET /health` pada development/testing | 200 setelah `SELECT 1` berhasil; 503 terkontrol bila PDO tidak tersedia. Tidak didaftarkan pada staging/production. |
| API yang belum diimplementasikan | 404 JSON; tidak membuat respons transaksi sukses palsu. |
| Metode yang tidak didukung | 405 dengan header `Allow`; HEAD memakai rute GET tanpa body. |
| Error publik 403/404/500/503 | Memakai halaman ilustrasi botani yang tersedia dengan status HTTP sebenarnya. `<base>` menjaga aset pada URL bertingkat; respons error tidak di-cache. |

Format error JSON: objek `error` berisi `code`, `message` dan `requestId`. Header `X-Request-Id` mengacu pada ID yang sama untuk error yang diproses Kernel. Error tidak menampilkan detail PDO, stack trace atau nilai konfigurasi. ID dan kelas exception dicatat untuk error internal.

`Request::jsonObject()` membedakan Content-Type salah (415), JSON rusak (400), dan payload bukan objek (422). Ini validasi protokol dasar; validasi bidang bisnis, CSRF, sesi dan peran belum dihubungkan. PHP router pengembangan menolak path tidak valid, dotfile, daftar direktori dan berkas di luar `public/`.

## Bukti pemeriksaan

| Pemeriksaan | Hasil |
| --- | --- |
| `tests/foundation.php` | 61 pemeriksaan lulus, termasuk PDO nyata, prepared statements, UTC, commit/rollback, idempotensi migrasi dan penjagaan target uji. |
| `verify-foundation-http.cjs` | 13 kelompok pemeriksaan lulus. Laporan `storage/reports/foundation/http-tests.json` mencakup respons nyata, kegagalan koneksi/startup, pembatasan diagnosis produksi, alias dan render. |
| Render melalui PHP | Beranda, Akun dan 404 bertingkat diperiksa pada 1440 dan 390 px. Tidak ada overflow horizontal, error halaman atau aset gagal pada pemeriksaan; screenshot tersedia dalam laporan lokal. |
| Pemulihan lingkungan | Instance yang sama digunakan ulang; marker bootstrap terputus dapat dilanjutkan; berkas konfigurasi yang ada dipertahankan. |
| PHP lint | 143 berkas PHP lulus; termasuk scaffold, sehingga lint bukan bukti kelengkapan fitur. |
| Composer | Validasi, autoload `--strict-psr` dan platform requirements lulus. Validasi mencatat metadata lisensi belum ditentukan; lisensi tidak dipilih otomatis. |
| Git | `diff --check` lulus; konfigurasi uji, kredensial runtime dan laporan dikecualikan dari Git. |

Tes transaksi menggunakan tabel **TEMPORARY** InnoDB dan tidak mengubah transaksi/produk dari dump. Suite frontend penuh dari audit UI sebelumnya tidak dijalankan ulang pada tugas fondasi ini; pemeriksaan regresi dibatasi pada jalur PHP dan tampilan terkait.

## Batas dan pekerjaan berikutnya

- Selesai secara lokal: inventaris awal, rekonsiliasi struktur, database uji, bootstrap/routing/PDO dan tes fondasi.
- Kemajuan M0 lanjutan: workflow lint/tes/dependency scan, kontrak/mock adapter, backlog terurut dan staging Apache lokal tersedia. Sisa M0 adalah eksekusi workflow GitHub serta staging online/topologi/proxy setelah akses infrastruktur tersedia; lihat laporan lanjutan.
- M1: sesi dan autentikasi pelanggan/staf, verifikasi/pemulihan, CSRF, rate limit, MFA dan otorisasi server. Halaman staf yang tersedia masih prototipe.
- M2–M4: layanan katalog/stok, validasi keranjang/checkout dan pembayaran. Storefront belum membaca database ini untuk transaksi.
- Migrasi baru hanya mendukung pembangunan database uji lokal kosong. Pemutakhiran database berisi data dan rencana produksi belum dikerjakan. Apache Windows telah diuji pada pekerjaan lanjutan; Linux FPM/hosting online belum. DDL yang gagal tidak diklaim dapat di-rollback; jurnal kegagalan memerlukan inspeksi sebelum melanjutkan.

Cara menjalankan dan pemulihan: [runbook lingkungan lokal](../runbook/local-foundation.md). Keputusan teknis: [ADR-002](../adr/ADR-002-local-backend-foundation.md).
