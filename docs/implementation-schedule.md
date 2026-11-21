# Rencana pengerjaan RylVa Green

Disusun 21 November 2026 setelah audit UI publik. Tahap berikutnya adalah menghubungkan UI yang tersedia dengan backend PHP Native dan database, lalu menyelesaikan transaksi, operasional staf, dan kesiapan rilis.

## Kondisi awal

- UI publik, pelanggan, dan autentikasi tersedia pada 34 route. Audit terakhir mencatat 29 suite frontend lulus; ini belum membuktikan integrasi backend.
- Dua puluh halaman utama dan pendukung staf tersedia sebagai prototipe. Gunakan kembali tampilan tersebut saat menghubungkan layanan.
- Pemeriksaan `config/routes.php`, `src/Bootstrap.php`, contoh controller Cart/webhook pembayaran, layanan reservasi stok, dan tes konkurensi stok menemukan bagian yang masih berupa kerangka. Sebagian utilitas, seperti pembuat koneksi PDO, sudah memiliki implementasi. Kesiapan tiap bagian dipetakan pada M0.
- Stack tetap HTML/CSS/JavaScript, PHP Native, MySQL/InnoDB, dan PDO. Urutan mengikuti M0–M8 pada Lampiran A.12 spesifikasi v2.6.

## Kemajuan awal — 21 November 2026

Pekerjaan lokal M0 sudah dimulai lebih awal atas permintaan pengguna. Rentang kalender di bawah tetap merupakan alokasi rencana; kemajuan ini belum menjadi dasar untuk mempercepat tanggal fase berikutnya.

| Pekerjaan | Status | Bukti / sisa pekerjaan |
| --- | --- | --- |
| Inventaris backend | Selesai untuk audit awal | Inventaris sebelum/sesudah tersedia; mayoritas layanan bisnis masih kerangka. |
| Rekonsiliasi struktur dan impor database uji | Selesai untuk fondasi lokal | 68 tabel bisnis, 10 view dan 23 trigger terimpor. Risiko sinkronisasi stok dan validasi varian masuk backlog M2. |
| Lingkungan PHP/MySQL terpisah | Selesai lokal | PHP pada 4186, MySQL uji pada 13367; konfigurasi pengguna dipertahankan. |
| Bootstrap/routing/respons/PDO | Selesai untuk fondasi | Beranda/aset/alias lama, error HTTP dan koneksi diagnosis lokal berjalan. API bisnis belum terhubung. |
| Tes dasar | Selesai untuk fondasi | 61 pemeriksaan PHP, pemeriksaan HTTP/render serta lint lulus; rincian pada laporan M0. |
| CI | Siap diperiksa di GitHub | Workflow dan perintah lokal lulus, termasuk database baru dan audit dependensi. Matrix GitHub-hosted menunggu commit/push yang diminta pengguna. |
| Kontrak/mock adapter | Selesai untuk M0 | Pembayaran/kurir memiliki kontrak serta 59 pemeriksaan; mock terpisah dari staging/production dan tidak mengubah database bisnis. |
| Paket dan Apache staging lokal | Selesai lokal | Paket ZIP berintegritas dan Apache terlindungi lulus 9 kelompok pemeriksaan. |
| Staging online | Selesai untuk peninjauan UI/fondasi | [Domain HTTPS](coverage/hosting-staging-online.md) berjalan dengan mode query tanpa perubahan Nginx. 54 dokumen, 9 kelompok HTTP/render dan 10 kelompok navigasi lulus online; rilis 604 berkas terverifikasi. Koneksi database/ekstensi MySQL online belum diperiksa; tidak ada SQL hosting. |

Status fase: **M0 Dikerjakan**; **M1–M8 Belum dimulai**. Lihat [bukti fondasi M0](coverage/backend-foundation-m0.md), [lanjutan CI/adapter/staging](coverage/m0-ci-adapters-staging.md), [backlog terurut](implementation-backlog.md) dan [runbook CI/staging](runbook/ci-and-staging.md).

## Asumsi jadwal

Mulai yang diusulkan adalah **Senin, 23 November 2026**, dengan alokasi awal **15 minggu**. Kapasitas tim dan hari libur belum ditetapkan; rentang berikut adalah alokasi kalender, bukan janji tanggal selesai. Estimasi diperbarui setelah M0 berdasarkan kondisi backend yang terverifikasi. Kapasitas akhir tahun perlu diperhitungkan khususnya pada M2–M3.

Setiap fase mencakup implementasi, pengujian, dan perbaikan. Fase selesai ketika kriteria penerimaannya terpenuhi; keterlambatan prasyarat menggeser fase berikutnya.

## Jadwal utama

| Pekan | Tanggal | Tahap | Pekerjaan utama | Kriteria selesai |
| --- | --- | --- | --- | --- |
| 1 | 23–29 Nov 2026 | M0 Persiapan | Inventaris backend; routing/bootstrap; konfigurasi lingkungan; rekonsiliasi skema v2.6 dan migrasi; database pengujian; CI dan kontrak adapter. | Aplikasi PHP berjalan, koneksi database pengujian terverifikasi, migrasi dapat diulang, serta backlog dan estimasi diperbarui. Staging berjalan setelah akses tersedia. |
| 2–3 | 30 Nov–13 Des 2026 | M1 Keamanan dan akun | Autentikasi pelanggan/staf, verifikasi dan pemulihan, sesi, CSRF, pembatasan percobaan, MFA staf, otorisasi server, profil akun, fondasi audit dan parameter. | Akun dan sesi bekerja melalui server; kepemilikan data, peran, dan MFA diuji. Email/OAuth diuji setelah konfigurasi tersedia. |
| 4–5 | 14–27 Des 2026 | M2 Katalog dan stok | Produk, kategori, atribut, varian, satuan, panduan; panel produk/bahan; buku besar stok, batch/FEFO, kalender tutup, penanganan dan kebutuhan bahan buket. | Storefront dan panel staf memakai data database yang sama. Uji stok terakhir dan transaksi atomik benar-benar berjalan terhadap database. |
| 6–7 | 28 Des 2026–10 Jan 2027 | M3 Keranjang dan checkout | Keranjang tamu/akun dan penggabungan, Wishlist akun, alamat, validasi harga/konfigurasi buket di server, kuotasi kurir, tanggal/slot, validasi ulang dan pembuatan pesanan. | Alur pelanggan menghasilkan pesanan tersimpan dengan rincian yang benar. Pengulangan permintaan tidak membuat pesanan ganda. |
| 8–9 | 11–24 Jan 2027 | M4 Pembayaran dan status | Gateway sandbox, webhook terverifikasi, mesin status, reservasi/kedaluwarsa stok, commit COD, pembayaran terlambat/ganda/selisih, rekonsiliasi dan bukti pembayaran. | Pembayaran sandbox mengubah status lewat verifikasi server. Webhook ulang, COD, kedaluwarsa dan konkurensi diuji; status pesanan/pembayaran/pengiriman tetap terpisah. |
| 10 | 25–31 Jan 2027 | M5 Pemenuhan dan pengiriman | Antrean Admin, produksi buket, pengemasan, resi/foto, pelacakan, kendala kirim dan penyelesaian sesuai baseline. | Pesanan dapat dipenuhi staf dan dilacak pelanggan; tindakan ilegal ditolak server dan perubahan tercatat. |
| 11–12 | 1–14 Feb 2027 | M6 Pembatalan dan purnajual | Pembatalan, refund, komplain, banding, persetujuan dua pihak, lampiran, tenggat dan pemulihan kegagalan. | Pengajuan–keputusan–hasil terhubung dengan otorisasi, audit dan pencegahan pemrosesan ganda. Refund gagal memiliki tindak lanjut. |
| 13–14 | 15–28 Feb 2027 | M7 Notifikasi dan pengerasan | Notifikasi, pekerjaan terjadwal aplikasi, dashboard/laporan, parameter/persetujuan sensitif, keamanan, beban, konkurensi, backup/restore dan regresi seluruh peran. | Kriteria terkait lulus; temuan keamanan berat ditutup; pemulihan backup diuji; monitoring, runbook dan antrean kegagalan tersedia. |
| 15 | 1–7 Mar 2027 | M8 UAT dan keputusan rilis | UAT pemilik/staf, data produk awal final, kebijakan publik, latihan operasional, pemeriksaan kesiapan dan rencana peluncuran bertahap. | UAT disetujui dan gerbang produksi terpenuhi. Peluncuran dilaksanakan setelah persetujuan pengguna. |

## Sasaran antara

- **29 November:** fondasi aplikasi dan database pengujian dapat dijalankan ulang.
- **13 Desember:** akun, kepemilikan data, peran staf dan MFA bekerja melalui server.
- **27 Desember:** produk, varian, bahan dan stok dipakai bersama oleh storefront dan panel staf.
- **24 Januari:** demo staging Katalog → Akun → Keranjang → Checkout → Pembayaran sandbox → Pesanan, termasuk kegagalan dan pemulihannya.
- **14 Februari:** pemenuhan, pengiriman dan purnajual terhubung sesuai kewenangan.
- **28 Februari:** kandidat aplikasi siap diperiksa dalam UAT.
- **7 Maret:** target keputusan kesiapan rilis, bergantung pada hasil UAT dan gerbang produksi.

## Pekerjaan pekan pertama

| Hari | Pekerjaan | Keluaran |
| --- | --- | --- |
| Senin, 23 Nov | Petakan controller, service, middleware, adapter dan tes: berfungsi, sebagian, atau kerangka. Cocokkan dengan baseline dan kontrak UI. | Backlog terurut dan daftar komponen yang dapat digunakan kembali. |
| Selasa, 24 Nov | Rekonsiliasi SQL dan ekstensi v2.6 untuk varian, satuan, barang dagangan dan bahan buket; siapkan migrasi/data pengujian terisolasi. | Catatan skema dan cara membangun database pengujian. |
| Rabu, 25 Nov | Hubungkan bootstrap, konfigurasi, front controller, routing dan koneksi PDO. | Aplikasi PHP dapat melayani permintaan dan mengakses database pengujian; document root tetap `public/`. |
| Kamis, 26 Nov | Susun kontrak respons/error, validasi dan pola adapter; siapkan pemeriksaan otomatis PHP/database. | Pola layanan bersama dan pipeline awal. |
| Jumat, 27 Nov | Jalankan jalur dasar dan migrasi ulang, periksa kebutuhan staging/vendor, lalu hitung ulang beban pekerjaan. | Review M0, hambatan beserta tindak lanjut, dan pembaruan jadwal. |

## Ketergantungan

| Kebutuhan | Disiapkan paling lambat | Dampak bila belum siap |
| --- | --- | --- |
| Domain/staging, hosting, DNS email, topologi server, proxy dan pilihan CDN/WAF | Awal M0, 23 Nov | Pekerjaan lokal dapat berjalan; staging, email dan pengerasan lingkungan belum dapat diselesaikan. Catat pilihan sebagai ADR. |
| Google OAuth, CAPTCHA, layanan email, domain/path panel staf dan CORS bila diperlukan | Awal M1, 30 Nov | Autentikasi eksternal dan email belum dapat diuji menyeluruh. |
| Vendor pembayaran dan sandbox; kurir/agregator dan sandbox | Awal M3, 28 Des | Kuotasi nyata, pembayaran vendor dan pelacakan belum dapat diselesaikan. Mock tetap dibedakan dari integrasi nyata. |
| Syarat dan Ketentuan, Kebijakan Privasi final, serta versi persetujuan | Sebelum M3; disiapkan saat M1 | Registrasi/checkout produksi belum memenuhi kebutuhan persetujuan baseline. |
| Data produk, foto, varian, satuan, berat, dimensi, penanganan dan panduan | Mulai M2; lengkap sebelum M8 | Pengujian dapat memakai fixture bertanda; UAT data toko belum lengkap. |
| Penyetuju kedua dan pemegang akun SuperAdmin cadangan | Sebelum M7; disiapkan sejak M1 | Pengujian persetujuan dua pihak dan kesiapan operasional belum lengkap. |

Keputusan dan parameter baseline tetap menjadi acuan. Perbedaan yang dicatat pada cakupan autentikasi staf, termasuk P-31 dan RL-02, diperiksa terhadap aturan rinci pada M0–M1; jadwal ini tidak menetapkan kebijakan penggantinya.

## Review dan definisi selesai

- Awal pekan: pilih pekerjaan dengan prasyarat tersedia dan tentukan hasil yang dapat diperiksa.
- Setiap perubahan: jalankan tes sesuai dampak. Jalur baru memerlukan tes integrasi; perubahan komponen bersama memerlukan regresi UI terkait.
- Akhir pekan: demonstrasikan hasil dan catat bukti, hambatan, serta pekerjaan tersisa. Perbarui tanggal bila estimasi berubah.
- Status pekerjaan: **Belum dimulai**, **Dikerjakan**, **Menunggu ketergantungan**, **Siap diperiksa**, **Selesai**. Status aktual dicatat pada tabel kemajuan; keberadaan kode lama tidak otomatis memenuhi kriteria fase.
- Modul selesai ketika datanya tersimpan pada sumber yang benar, izin/validasi ditegakkan server, state UI terhubung, kegagalan dapat dipulihkan, tes terkait lulus, dan dokumentasi diperbarui.

Gerbang produksi mengikuti Bagian 25.6: kriteria penerimaan terkait, sandbox/webhook, pemulihan backup, MFA dan dua akun SuperAdmin aktif, monitoring/antrean kegagalan, kebijakan publik, serta kesiapan operasional. Hasil UAT menentukan kelayakan peluncuran.

## Acuan dan langkah berikutnya

- [Spesifikasi v2.6](specifications/spesifikasi-proyek-v2.6.md): A.12, A.13, 25.6 dan adendum v2.6.
- [Penyelesaian audit UI publik](coverage/public-ui-audit-fixes-2026-11-20.md).
- [Kelengkapan prototipe staf](coverage/staff-ui-completion.md).
- [Cakupan autentikasi staf](coverage/staff-auth-coverage.md).

Langkah berikutnya adalah menjalankan **workflow yang sudah tersedia di GitHub dan staging pada host tujuan** setelah akses/domain tersedia. Kontrak/mock adapter dan backlog telah disiapkan. Sesudah gerbang fondasi terkait terpenuhi, lanjutkan M1 untuk sesi, autentikasi, CSRF, MFA dan otorisasi server. Rencana ini tidak membuat pengingat otomatis; pekerjaan lokal yang sudah dilaksanakan dicatat pada tabel kemajuan.
