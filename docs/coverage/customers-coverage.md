# Cakupan Pelanggan

Target: `public/pages/staff/customers.html`. Prototipe HTML/CSS/Vanilla JavaScript memakai shell admin incumbent. Snapshot sintetis 4 November 2026 pukul 10.00 WIB memuat 9 profil, 6 referensi pesanan, 2 kasus pesanan, dan 2 catatan awal. Semua perubahan berada di memori tab; refresh mengembalikan fixture.

## Alur yang tersedia

| Alur | Perilaku prototipe | Kebutuhan integrasi produksi |
| --- | --- | --- |
| Daftar pelanggan | Empat kartu filter mengikuti Antrean Pesanan; cari nama/ID/kontak/nomor pesanan, filter status, urutan, hapus filter, dan pagination 5 baris. Konteks daftar/rincian disimpan pada URL. | Pencarian, filter, jumlah, serta pagination dari layanan terotorisasi dan data nyata. |
| Ringkasan operasional | Periode 6 Okt–4 Nov 2026 memisahkan pelanggan bertransaksi, pelanggan baru, dan kebutuhan tindak lanjut. Pembayaran bersih menghitung pembayaran berhasil dikurangi refund berhasil; COD belum dibayar dikecualikan. | Periode dari waktu server dan definisi transaksi terverifikasi; angka ini tidak menggantikan laporan pendapatan. |
| Profil dan alamat | Informasi baca-saja; email tersamarkan. Tidak ada editor profil, alamat, kata sandi, atau akun staf, sesuai matriks v2.6 bagian 3.2. | Pelanggan mengelola profil/alamat melalui alur tersendiri yang terautentikasi; perbaikan data staf memerlukan kewenangan yang ditetapkan terpisah. |
| Pesanan dan kasus | Enam tautan membuka fixture Antrean yang sesuai, membawa peran; status pesanan/pembayaran/pengiriman berdiri sendiri. Kasus terbuka mengarahkan penanganan ke modul Pesanan. | Pemetaan ke ID pesanan nyata, izin akses, dan pembacaan status terkini. Belum ada tautan Antrean ke pelanggan atau sinkronisasi antarmodul. |
| Catatan operasional | Tambah catatan dan pilihan tindak lanjut; catatan tidak diedit/dihapus. Hasil penyelesaian wajib 5–500 karakter; tidak menyelesaikan komplain/status pesanan. Guard draf, validasi, saving, dan pemulihan gagal simpan tersedia. | Penyimpanan catatan, pelaku/waktu server, pencegahan duplikasi, retensi, dan audit permanen. |
| Nonaktifkan sementara | Kedua peran memberi alasan; akun berubah menjadi Dinonaktifkan tanpa mengubah pesanan atau riwayat transaksi. | Otorisasi server, pencabutan sesi, kebijakan login, serta audit dan notifikasi nyata. |
| Aktifkan kembali | Khusus SuperAdmin; alasan dan kode simulasi 123456, lalu status kembali sesuai verifikasi sebelumnya. | Verifikasi staf/MFA nyata, pemeriksaan ulang status, otorisasi, dan audit. |
| Anonimisasi | Khusus SuperAdmin; alasan, kode simulasi, dan frasa ANONIMKAN. Diblokir oleh pesanan aktif, refund berjalan, kasus/catatan terbuka, legal hold, atau tidak ada permintaan penghapusan. Yuni Wulandari memenuhi syarat fixture. Referensi transaksi dipertahankan; tidak ada hard delete. | Evaluasi retensi dan dasar permintaan, guard atomik pada data terkini, anonimisasi lintas penyimpanan, serta audit. P-36 akun tidak aktif belum dievaluasi. |
| Ekspor | Khusus SuperAdmin; semua hasil filter diekspor ke CSV dengan email tersamarkan, alasan, dan kode simulasi. Aktivitas lokal dicatat per pelanggan. | Penyaringan server, kontrol unduhan, verifikasi staf/MFA nyata, dan audit tahan lama. |
| Aktivitas | Admin melihat aktivitas aktornya sendiri; SuperAdmin melihat seluruh aktor lokal. | Filter otorisasi server dan Audit Log permanen. Daftar lokal ini bukan Audit Log produksi. |
| Kondisi antarmuka | Pilihan pratinjau terlihat untuk data tersedia/loading/error/kosong dan gagal simpan berikutnya; pencarian tanpa hasil serta pelanggan tidak ditemukan dapat dipulihkan. | Status permintaan jaringan nyata, penanganan konflik, percobaan ulang, dan pesan kegagalan layanan. |

## Peran, navigasi, dan tampilan

Admin dan SuperAdmin sama-sama membaca konteks operasional, menambah/menyelesaikan catatan, serta menonaktifkan sementara akun. Pengaktifan kembali, anonimisasi, dan ekspor hanya ditampilkan serta divalidasi untuk pratinjau SuperAdmin. Pilihan profil dan parameter `role` bukan autentikasi atau otorisasi produksi; semua guard browser harus ditegakkan ulang oleh layanan.

Tautan Pelanggan dari Operasional, Laporan Keuangan, Manajemen Pesanan, Produk & Varian, serta Bahan Produksi membuka modul dan mempertahankan varian peran. Tautan Pelanggan dan Bahan Produksi pada dashboard SuperAdmin tetap berbeda. Pembagian menu keuangan, Audit Log penuh, serta Pengaturan Sistem tetap incumbent.

Shell, Poppins lokal, krem/sage, kartu ringkasan terpisah, kontrol bersama 44 px, dan radius 8/12 px dipertahankan. Lima tab rincian sticky pada jarak atas 4 px; tab aktif diperlihatkan setelah render/font/resize dan fokus bertahan saat berpindah. Toolbar melebar pada tablet dan bertumpuk pada ponsel; tabel berubah menjadi kelompok nilai berlabel. Skip link memindahkan fokus ke wilayah utama. Tidak ada raster baru atau perubahan sistem desain global.

## Bukti dan batas verifikasi

- `.impeccable/review/customers/verification.json`: 8 kelompok lulus, 0 kesalahan; batas halaman diperiksa pada 320/390/640/768/1024/1280/1440/1920 px.
- `fix-verification.json`: 5 kelompok terfokus lulus, 0 kesalahan; semua opsi status/urutan muat, tab Catatan/Aktivitas terlihat, skip link memindahkan fokus, fokus tab bertahan, dan tautan dashboard SuperAdmin tepat pada 320/390/768/1440 px sesuai cakupan pemeriksaan.
- `final-captures.json`: 24 PNG final tanpa kesalahan, yaitu daftar, lima tab rincian, dan konfirmasi pada 390/768/1440 px, serta kosong/loading/error pada 390 px. Taste final: 6 JPG dibuka kembali setelah koreksi sumber terakhir, 0 FAIL / 0 WARN; kritik 7,8 pada round 2 dan 7,9 pascaperbaikan round 3.
- Detector sekali: 3 advisori warna incumbent, 0 temuan primer. Hallmark: 5 PNG final; statis tetap 1 FAIL / 0 WARN / 4 ANSWERED (F7). Gate 56 berada pada CSS navigasi editor sticky bersama, tanpa benturan Customers yang terlihat. Pemeriksa/waiver tidak diubah.
- `finish-review.md` membuka 30 gambar dan meminta 3 perbaikan. `finish-verdict.md` membuka ulang seluruh 30 gambar: tepat 3 perbaikan RESOLVED, sisa CLEAR, SHIP hanya untuk perbaikan yang dinilai. Ini bukan audit penuh baru atau sertifikasi produksi.

Bukti memakai Chrome/Puppeteer, input sintetis, dan viewport emulasi; perangkat fisik serta pembaca layar belum diuji. Tidak ada database/API, autentikasi, MFA nyata, pencabutan sesi, audit permanen, notifikasi nyata, atau sinkronisasi lintas halaman. Fixture bukan statistik atau aktivitas pelanggan nyata; produksi perlu menggantinya dengan data yang sah dan referensi nyata. `PRODUCT.md`, `DESIGN.md`, serta drift palet/CSS incumbent dipertahankan; sidecar global yang sebelumnya tidak ada tidak dibuat. Kontrak permukaan dan hasil akhir terdapat pada `docs/design/surfaces/customers-surface.md`.
