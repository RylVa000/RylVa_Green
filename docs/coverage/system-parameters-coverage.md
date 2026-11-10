# Cakupan UI Pengaturan Sistem — 5 November 2026

Acuan: `docs/specifications/spesifikasi-proyek-v2.6.md` bagian 3, 13.4, dan 19. Implementasi: `public/pages/superadmin/system-parameters.html`, `public/assets/js/staff/superadmin/system-parameters.js`, `system-parameters-data.js`, `admin-settings-nav.js`, dan `public/assets/css/staff/superadmin/system-parameters.css`, dengan komponen admin bersama. Seluruh perubahan adalah simulasi memori tab, hilang saat refresh, dan tidak disinkronkan ke halaman/modul lain.

## Cakupan alur dan integrasi yang diperlukan

| Area | Perilaku UI yang tersedia | Kebutuhan produksi |
| --- | --- | --- |
| Akses dan navigasi | Menu khusus pratinjau SuperAdmin pada sembilan halaman incumbent; `role=admin` dan pergantian profil menampilkan akses ditolak tanpa daftar/editor. | Identitas/sesi terautentikasi, pemeriksaan peran pada setiap rute/API, dan penyaringan data di server. Parameter URL serta menyembunyikan menu bukan otorisasi. |
| Register | Seluruh 46 parameter, tujuh kelompok, pencarian kode/key/nama/deskripsi, hitungan terhitung, filter semua/draf/sensitif/hanya baca, dan pagination enam baris. Filter/tampilan/editor tercermin pada URL. | Pembacaan konfigurasi terotorisasi, versi skema, query/pagination layanan, dan sumber baseline yang tervalidasi. |
| Editor | Field bertipe angka/jam/boolean, satuan, nilai aktif, usulan, baseline terpisah, pratinjau, batas isian, dan ketentuan tetap. P-45/P-46 hanya baca. | Skema validasi server yang ditinjau, aturan unit/rentang, pemilik kebijakan, dan kontrak penerapan tiap layanan. Guard frontend saat ini konservatif dan bukan keputusan bisnis baru. |
| Draf dan baseline | Tambah/edit/hapus usulan; nilai aktif belum berubah. Baseline mengisi usulan, lalu mengikuti draf dan review biasa. | Penyimpanan draf bila diperlukan serta validasi versi dan nilai terkini di server. Tidak ada reset produksi langsung melalui tombol baseline. |
| Review dan simpan | Perbandingan aktif/usulan, penanda field berubah, dampak khusus kebijakan, alasan dan CR/ADR wajib; acknowledgement bila bertanda review; demo 123456 untuk perubahan sensitif. Seluruh draf disimpan bersama. | Otorisasi ulang tindakan sensitif, MFA nyata, referensi perubahan/pengujian yang dapat diverifikasi, transaksi atomik, idempotensi, dan proses persetujuan sesuai kebijakan. Checkbox/kode demo bukan bukti proses tersebut. |
| Konflik, kegagalan, dan sesi | Simulasi revisi usang memblokir simpan sampai ditinjau ulang. Gagal simpan atau sesi berakhir mempertahankan draf tanpa mutasi nilai aktif/riwayat. | Optimistic locking/transaksi database, waktu dan sesi server, respons error layanan, retry aman, serta penanganan penulis bersamaan nyata. |
| Riwayat | Entri hanya baca per batch: ID lokal, pelaku contoh, waktu WIB, alasan, CR/ADR, snapshot sebelum/sesudah; pencarian dan pagination tab-lokal. Disclosure native memakai SVG plus/minus. | Audit tahan lama, append-only dan hash/integritas sesuai spesifikasi, identitas server, retensi/hak baca, serta penulisan audit dalam transaksi yang sama. Tidak ada audit produksi pada halaman ini. |
| State dan perubahan belum disimpan | Loading, gagal muat/retry, register kosong, pencarian kosong, riwayat kosong, parameter tidak dikenal, fokus kesalahan, saving/sukses, konfirmasi meninggalkan isian, meninggalkan halaman, dan membuang draf. | Rute/data/error nyata, pemulihan jaringan dan sesi yang terintegrasi, serta pemeriksaan akses ulang pada mutasi. |
| Responsive dan keyboard | Sidebar drawer, kelompok berupa combobox bersama, filter ponsel 2 × 2, baris berlabel, perbandingan bertumpuk, fokus terlihat, dan target tindakan 44 px. | Uji perangkat fisik, pembaca layar, serta matriks browser yang disepakati. Bukti saat ini berasal dari Chrome/Puppeteer dan input sintetis. |

## Register lengkap

**Edit** berarti parameter dapat dimasukkan ke draf, bukan semua ketentuannya dapat dilonggarkan. **Baca** berarti tidak ada kontrol edit. Baseline di bawah menggambarkan data awal UI; tidak membuktikan konfigurasi tersebut sudah diterapkan pada layanan nyata.

| Kode | Kebijakan | Baseline yang ditampilkan | Akses UI |
| --- | --- | --- | --- |
| P-01 | Batas waktu pembayaran | Default 60 menit; jendela khusus mengikuti P-40. | Edit |
| P-02 | Toleransi sinkronisasi kedaluwarsa | 5 menit. | Edit |
| P-03 | Percobaan pembayaran | 5 kali per pesanan. | Edit |
| P-04 | Pesanan menunggu pembayaran | 3 pesanan per akun. | Edit |
| P-05 | Batas kuantitas belanja | 20 unit per produk; 50 unit per pesanan. | Edit |
| P-06 | Waktu persiapan pengiriman | Mudah Layu 4 jam sebelum awal slot; Tahan Lama 1 hari. | Edit |
| P-07 | Batas pemesanan di muka | 30 hari. | Edit |
| P-08 | Slot pengiriman | Pagi 08.00–12.00, siang 12.00–16.00, sore 16.00–20.00 WIB. | Edit |
| P-09 | Jam operasional toko | 08.00–20.00 WIB. | Edit |
| P-10 | Pesan kartu ucapan | Maksimum 200 karakter. | Edit |
| P-11 | Jendela pengajuan komplain | 24 jam. | Edit |
| P-12 | Respons pertama komplain | Maksimum 24 jam. | Edit |
| P-13 | Investigasi barang hilang | Maksimum 3 hari kerja. | Edit |
| P-14 | Kirim ulang Mudah Layu | 1 kali; wajib pada hari yang sama. | Edit |
| P-15 | Mulai penanganan pesanan | Maksimum 2 jam operasional. | Edit |
| P-16 | Respons pelanggan atas penyelesaian | Maksimum 24 jam; refund penuh saat tenggat terlewati. | Edit |
| P-17 | Banding penolakan komplain | 1 kali dalam 24 jam sejak penolakan. | Edit |
| P-18 | Batas persetujuan refund Admin | Rp500.000 per permintaan. | Edit |
| P-19 | Target pemrosesan refund | Maksimum 3 hari kerja. | Edit |
| P-20 | Percobaan ulang refund gagal | 3 kali otomatis dalam 24 jam. | Edit |
| P-21 | Retensi rekening refund | 30 hari setelah refund berhasil. | Edit |
| P-22 | Ambang stok rendah | Pada atau di bawah 5 unit. | Edit |
| P-23 | Batas penyesuaian stok Admin | 20 unit per tindakan. | Edit |
| P-24 | Konfirmasi perubahan harga | Perubahan lebih dari 50% terhadap harga sebelumnya. | Edit |
| P-25 | Retensi keranjang | Tamu 7 hari; akun tanpa aktivitas 30 hari. | Edit |
| P-26 | Alamat tersimpan | 5 alamat aktif per akun. | Edit |
| P-27 | Jumlah foto bukti | Komplain 2–5 foto; serah kurir minimum 1 foto. | Edit |
| P-28 | Kata sandi | Minimum pelanggan 8, staf 12; maksimum 128 karakter. | Edit |
| P-29 | Kode verifikasi email | 6 digit; 10 menit; 5 kode salah; jeda kirim ulang 60 detik; 5 kiriman/jam. | Edit |
| P-30 | Token pemulihan kata sandi | 15 menit; sekali pakai. | Edit |
| P-31 | Pembatasan login pelanggan | 5 kegagalan per akun dalam 15 menit; tunda 15 menit; CAPTCHA mulai kegagalan ke-3. | Edit |
| P-32 | Masa berlaku sesi | Pelanggan idle 14 hari; Admin idle 30 menit/maksimum 8 jam; SuperAdmin idle 15 menit/maksimum 4 jam. | Edit |
| P-33 | Tautan aktivasi Admin | 24 jam; sekali pakai. | Edit |
| P-34 | Retensi transaksi dan audit terkait | 10 tahun. | Edit |
| P-35 | Retensi audit nontransaksi | 5 tahun. | Edit |
| P-36 | Anonimisasi akun tidak aktif | 24 bulan tanpa aktivitas; pemberitahuan 30 hari sebelumnya. | Edit |
| P-37 | Target ketersediaan layanan | 99,5% bulanan. | Edit |
| P-38 | Target pemulihan data | RPO maksimum 1 jam; RTO maksimum 4 jam. | Edit |
| P-39 | Target kecepatan katalog | LCP 2,5 detik. | Edit |
| P-40 | Reservasi stok per metode | QRIS/e-wallet 10, transfer bank/kartu 15, virtual account 30 menit; COD 0 menit dan langsung komit setelah validasi. | Edit |
| P-41 | Pembatasan permintaan | 15 aturan RL-01–RL-15, dengan 22 isian batas akun/IP, jendela, CAPTCHA, MFA, dan penundaan. Nilai rincinya tampil berlabel di editor. | Edit |
| P-42 | Batas unggahan | 5 MB per berkas; 5 berkas per komplain; dimensi maksimum 4000 px; total request server 8 MB. | Edit |
| P-43 | Retensi log aplikasi/keamanan | Aplikasi 90 hari; keamanan 12 bulan. | Edit |
| P-44 | Sesi aktif bersamaan | Pelanggan 5; Admin 2; SuperAdmin 2. | Edit |
| P-45 | Pemicu peningkatan kapasitas | CPU di atas 70% selama 15 menit berulang pada jam sibuk; p95 di atas 1 detik; worker PHP-FPM penuh berulang. | Baca |
| P-46 | Target pembaruan keamanan | Kritis 7 hari; tinggi 14 hari sejak perbaikan tersedia. | Baca |

P-45 dimiliki pengembang dan klien melalui review arsitektur/ADR. P-46 dimiliki pengembang melalui pemeliharaan dan bukti pengujian rilis. Keduanya mengikuti kepemilikan register rinci, bukan anggapan bahwa semua baris konfigurasi dapat diubah saat runtime.

## Validasi yang benar-benar tersedia

Angka wajib terisi, finite, memenuhi minimum/maksimum, berupa bilangan bulat untuk step 1, atau kelipatan step desimal yang ditetapkan. Jam wajib valid dalam WIB. Nilai nol yang sah, termasuk ambang stok P-22, tetap nol dalam draf dan perbandingan. Pemeriksaan diulang sebelum penerapan batch.

- Hubungan dalam parameter: P-05 per produk ≤ per pesanan; slot P-08 berurutan tanpa tumpang tindih; jam tutup P-09 setelah buka; foto minimum P-27 ≤ maksimum; minimum kata sandi staf P-28 ≥ pelanggan; pemicu CAPTCHA P-31 tidak melewati batas gagal; idle P-32 tidak melebihi durasi absolut dan sesi SuperAdmin tidak lebih longgar daripada Admin; batas registrasi per jam P-41 ≤ harian serta CAPTCHA staf tidak melewati batas gagal.
- Hubungan lintas parameter memakai gabungan nilai aktif dan draf: seluruh slot P-08 berada dalam jam toko P-09; lead time Tahan Lama P-06 ≤ batas pemesanan P-07; maksimum foto P-27 ≤ batas berkas komplain P-42; percobaan bayar P-03 ≤ batas pembayaran per akun/jam P-41. Perubahan terkait dapat dimasukkan ke satu batch.
- Ketentuan tetap: hari yang sama P-14, refund otomatis P-16, maksimum kata sandi 128 pada P-28, kode 6 digit P-29, sekali pakai P-30/P-33, COD 0 menit P-40, dan request server 8 MB P-42. Field tersebut dinonaktifkan dan tetap diperiksa terhadap baseline saat validasi.
- Guard konservatif antara lain: kartu ucapan ≤200; kirim ulang ≤1; banding 1; foto komplain ≤5; kata sandi pelanggan ≥8/staf ≥12 dan minimum tidak melampaui 128; percobaan kode/verifikasi/MFA tertentu ≤5; jeda kirim ulang ≥60 detik; unggahan ≤5 MB/5 berkas/4000 px; target ketersediaan ≤100%; P-37/P-39 memakai step 0,1. Ini **guard prototipe frontend** yang perlu disahkan atau direkonsiliasi lewat skema server, bukan aturan produksi baru.

## Titik rekonsiliasi sebelum integrasi

| Parameter/area | Hal yang belum diterapkan atau perlu diputuskan |
| --- | --- |
| P-01 dan P-40 | Selaraskan default tenggat bayar, jendela per metode, reservasi stok, waktu gateway/webhook, serta perlakuan transaksi yang sedang berjalan. UI tidak menghitung kedaluwarsa produksi. |
| P-06/P-08/P-09 | Sinkronkan konfigurasi lead time, slot tersimpan, jam toko, kalender tutup, dan validasi checkout. Mengubah UI ini tidak menulis tabel slot atau kalender. |
| P-16 | Rekonsiliasi cakupan kode kasus dan timeout pada bagian spesifikasi yang merujuknya sebelum refund/penutupan otomatis dijalankan. UI tidak menjalankan pekerjaan terjadwal atau refund. |
| P-18/P-23/P-24 | Tegakkan nominal/kewenangan/konfirmasi dalam workflow pemiliknya. Modul refund, stok, dan produk tetap memakai fixture/aturan lokalnya sendiri. |
| P-21/P-34/P-35/P-36/P-43 | Pastikan dasar retensi, legal hold, anonimisasi, notifikasi, pekerjaan terjadwal, dan audit. Halaman ini tidak menghapus, menganonimkan, atau mengarsipkan data. |
| P-28–P-33/P-41/P-44 | Integrasikan autentikasi, pembatasan permintaan, verifikasi, sesi aktif, pencabutan sesi, dan log keamanan pada server. Kode 123456 hanya menguji form review lokal. |
| P-42 | Batas total request server 8 MB ditampilkan terkunci. Batas ini memerlukan konfigurasi PHP/web server yang ditinjau; editor tidak mengubahnya. Validasi unggahan nyata tetap harus berada di server. |
| P-37–P-39/P-45/P-46 | Target SLA, monitoring, backup/pemulihan, kapasitas, serta patch memerlukan proses teknis dan bukti operasional terpisah. Mengubah target lokal tidak membuktikan target tercapai. |
| Penyimpanan dan audit | Rancang skema parameter yang ditinjau, versi dan transaksi atomik, identitas serta waktu server, audit append-only berintegritas, dan aturan penerapan tiap pemilik layanan. Tidak ada persistence, hash audit, atau integrasi antarmodul sekarang. |

## Bukti dan batas pemeriksaan

`verification.json` mencatat **11 kelompok, 0 kesalahan browser**; `edge-verification.json` mencatat **8 kelompok, 0 kesalahan browser**, termasuk seluruh 46 editor/detail dan viewport 320–1920 px. Kedua suite dijalankan ulang setelah koreksi copy efek dan disclosure SVG. Ada 23 PNG alur/batas serta enam PNG tambahan pada `correction-captures.json`, enam JPG final Taste, dan lima PNG Hallmark. Rincian sumber bukti ada di `docs/design/surfaces/system-parameters-surface.md`.

Taste dan lint sumber masing-masing **0 FAIL / 0 WARN** dengan allowance incumbent yang dicatat. Detector sekali: **0 temuan primer, 3 advisori palet incumbent**. Hallmark mentah tetap **1 FAIL / 0 REFLEX / 0 WARN / 4 ANSWERED**; gate 56 mencakup selector navigasi produk yang tidak dipakai pada DOM halaman ini, sebagaimana diterima reviewer. Pemeriksa tidak diubah.

Tinjauan penuh `finish-review.md` merekam **FIX untuk dua temuan**. Putusan lanjutan `finish-verdict.md` menilai tepat dua perbaikan **RESOLVED**, sisa **CLEAR**, tanpa regresi terkait koreksi, dan memberi **SHIP hanya untuk perbaikan yang dinilai**. Ini bukan persetujuan ulang seluruh permukaan atau kesiapan produksi; batas tinjauan awal tetap berlaku. Bukti Chrome/Puppeteer dan input sintetis tidak mencakup perangkat fisik, pembaca layar, seluruh browser, backend, atau kesiapan produksi.
