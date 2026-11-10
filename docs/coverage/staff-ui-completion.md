# Kelengkapan desain staf Admin/SuperAdmin

Status 10 November 2026: halaman utama dan alur pendukung berikut tersedia sebagai **prototipe frontend**, bukan aplikasi produksi terintegrasi.

## Halaman utama

| Area | Berkas publik |
| --- | --- |
| Dashboard operasional | `pages/staff/admin-dashboard.html` |
| Pesanan, pemenuhan, pengiriman dan purnajual | `pages/staff/orders-queue.html` |
| Produk, varian dan stok barang | `pages/staff/products.html` |
| Kategori dan atribut | `pages/staff/categories-attributes.html` |
| Bahan produksi | `pages/staff/production-materials.html` |
| Buket dan produksi | `pages/staff/bouquet-production.html` |
| Pelanggan | `pages/staff/customers.html` |
| Kalender penutupan | `pages/staff/closure-calendar.html` |
| Laporan operasional | `pages/staff/operational-report.html` |
| Laporan keuangan | `pages/superadmin/financial-report.html` |
| Rekonsiliasi pembayaran | `pages/superadmin/payment-reconciliation.html` |
| Persetujuan sensitif, termasuk koreksi status akhir | `pages/superadmin/sensitive-approvals.html` |
| Audit log | `pages/superadmin/audit-log.html` |
| Parameter sistem | `pages/superadmin/system-parameters.html` |
| Manajemen akun staf | `pages/superadmin/staff-accounts.html` |
| Login, aktivasi dan pemulihan akses | `pages/auth/staff-login.html` |
| Profil dan keamanan sendiri | `pages/staff/staff-profile.html` |
| Pusat notifikasi | `pages/staff/staff-notifications.html` |
| Pusat bantuan | `pages/staff/staff-help.html` |
| Kondisi sistem dan pemulihan | `pages/staff/staff-status.html` |

Form tambah/edit, detail, tab, keputusan, pengiriman, pembatalan, refund dan komplain berada dalam modulnya. Kelengkapan ini tidak mengharuskan setiap langkah menjadi berkas halaman baru.

## Penambahan terakhir: koreksi status akhir

- Pintu masuk dari Ringkasan/Aktivitas pesanan Selesai atau Dibatalkan, khusus SuperAdmin, serta tombol Ajukan koreksi status pada Pusat Persetujuan Sensitif.
- Detail pesanan membawa snapshot lokal status, pembayaran, pengiriman dan referensi catatan ke pusat persetujuan. Jika tidak ditemukan catatan transisi terminal eksplisit, referensinya disebut snapshot contoh, bukan riwayat transaksi yang direka.
- Dua sumber `DEMO-COR-001/002` tersedia untuk mencoba alur tanpa membuka modul lain. Ini data sintetis, bukan pesanan pelanggan.
- Sumber menampilkan catatan asli, status tercatat dan hasil koreksi yang sudah disetujui. Usulan meminta status berbeda, rujukan pemeriksaan 5–160 karakter, alasan 5–500 karakter, MFA contoh `123456` dan pemahaman dampak.
- Pilihan status memakai status yang sudah ada dalam proyek; kelayakan transisi produksi tidak dinyatakan telah ditegakkan. Tidak ada input perubahan pembayaran atau eksekusi refund/stok melalui koreksi ini.
- Satu usulan aktif per sumber. Pengaju tidak dapat menyetujui atau menolak sendiri. Keputusan memeriksa lagi revisi sumber, referensi catatan dan snapshot pembayaran/pengiriman. Revisi berubah menahan persetujuan; penyetuju berbeda masih dapat menolak usulan yang usang.
- Persetujuan menambahkan satu catatan tertaut berisi sebelum/sesudah, alasan, rujukan, pengaju, penyetuju dan waktu browser. Catatan asli tidak ditimpa dan keputusan tidak diterapkan ulang. Penolakan tidak menambahkan catatan koreksi pada sumber.
- Detail pesanan menampilkan hasil koreksi sebagai panel terpisah. Snapshot, status, timeline, pembayaran, pengiriman, refund dan stok workflow pesanan lama tidak ditulis ulang atau dijalankan ulang.
- Fixture review lama tetap terbaca: objek sumber koreksi ditambahkan saat state lama tidak memilikinya. Penyimpanan mengikuti `sessionStorage` review pada tab yang sama. Reset contoh menghapus usulan/catatan contoh, bukan data server. Jika penyimpanan tidak tersedia, perpindahan snapshot antarhalaman ditahan dengan penjelasan.
- Prototipe Admin hanya melihat penjelasan status akhir terkunci, tanpa tindakan pengajuan atau data sumber persetujuan sensitif.

## Penambahan terakhir: error 500/429

`staff-status.html?state=internal-error` menjelaskan gangguan internal, pemeriksaan hasil simpan terakhir sebelum mengulang, tujuan pemulihan yang diizinkan dan bantuan. Tidak ada pengiriman ulang transaksi otomatis.

`staff-status.html?state=rate-limited` menjelaskan pembatasan percobaan, menampilkan waktu coba lagi sebagai belum tersedia, serta menawarkan ruang kerja dan bantuan. Tidak ada durasi tunggu rekaan, countdown, polling atau tombol yang mengaku membuka batas server.

Keduanya melengkapi 403, 404, 503, pemeliharaan dan sesi berakhir. Parameter tujuan tetap dibatasi ke dashboard/pesanan/produk/bahan. Ini tampilan kondisi, belum pemetaan HTTP atau middleware server.

## Batas kesiapan

Rute/controller PHP, database, autentikasi/MFA, verifikasi gateway, refund, kurir, penyimpanan lampiran, audit tahan lama dan sinkronisasi antarmodul masih memerlukan implementasi/integrasi produksi. Pilihan peran pada URL bukan izin akses nyata.

Cakupan per modul ada dalam dokumen `*-coverage.md`. Bukti penambahan terakhir dan penilaian visual berada di `storage/reports/hallmark/reports/staff-completion-verification.md`.
