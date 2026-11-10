# Cakupan Audit Log dan Aktivitas Saya

Target: `public/pages/superadmin/audit-log.html`. Prototipe HTML/CSS/Vanilla JavaScript memperluas shell admin incumbent. Dataset sintetis 4 November 2026 memuat 17 peristiwa awal yang dibekukan dan riwayat akses lokal yang ditambahkan oleh alur UI. Semua data berada di memori tab dan kembali ke fixture awal saat refresh.

## Alur dan persyaratan integrasi

| Alur | Perilaku prototipe | Kebutuhan aplikasi produksi |
| --- | --- | --- |
| Daftar dan ringkasan | Daftar terbaru lebih dahulu; empat kartu Semua aktivitas, Tindakan gagal, Tindakan sensitif dan Akses & akun. Hitungan mengikuti filter lain sebelum kartu; kategori dapat bertumpang tindih. | Data terotorisasi dari server, waktu server, hitungan dan pagination dengan cakupan akses yang sama. |
| Pencarian dan filter | Pencarian ID/peristiwa/pelaku/objek/alasan; periode contoh, tanggal khusus, pelaku, modul, jenis tindakan dan hasil. Combobox bersama mendukung pencarian keyboard; tanggal tidak sah atau terbalik diblokir. | Validasi parameter dan tanggal di server, indeks, batas permintaan dan kebijakan pencarian data sensitif. |
| Konteks URL | Filter, kartu, halaman dan detail disimpan di URL; panah sebelumnya/berikutnya menampilkan lima baris dan `n dari total`. Kembali serta riwayat browser memulihkan konteks. | Rute terotorisasi, pagination stabil dan validasi objek pada setiap permintaan. |
| Detail hanya baca | Waktu WIB, pelaku, peran saat tindakan, sumber staf/sistem/gateway, IP dokumentasi contoh, tindakan, objek dan alasan; pengaju/penyetuju muncul bila tersedia. Tidak ada tambah/edit/hapus catatan. | Identitas/sumber/IP tepercaya, penyamaran data, penyimpanan snapshot permanen dan pembatasan detail sebelum dikirim. |
| Sebelum/sesudah | Bidang berubah diberi penanda. Peristiwa tanpa perbandingan dijelaskan. Penolakan pengurangan 19 pak menampilkan saldo 18 pak sebelum dan sesudah; tidak ada mutasi yang diterapkan. | Nilai dan hasil dari transaksi server, termasuk penolakan/konflik, dengan audit atomik yang tidak mengarang perubahan. |
| Hasil versus status objek | Pencatatan hasil pembayaran gagal mempunyai hasil tindakan Berhasil dan status pembayaran Gagal di detail. Hasil audit tidak menggantikan status pembayaran/pesanan. | Peristiwa gateway dan transisi status terverifikasi; dimensi hasil tindakan serta status objek tetap terpisah. |
| Modul asal dan keterkaitan | Tautan mempertahankan peran pratinjau dan membuka fixture/detail atau daftar modul yang ada; aktivitas pada objek yang sama ditampilkan bila tersedia dalam cakupan peran. | Referensi stabil, pemeriksaan izin modul/objek dan pemuatan data nyata. Tidak ada sinkronisasi lintas halaman pada prototipe. |
| Akses riwayat | Pembukaan awal, detail yang dapat dilihat, pergantian profil dan muat ulang sukses menambah objek riwayat akses lokal yang dibekukan; catatan awal tidak diubah. | Audit setiap akses yang relevan di server, termasuk akses ditolak, dengan identitas, waktu/IP dan hasil tepercaya. Riwayat browser lokal bukan cakupan audit server lengkap. |
| Integritas | Default Belum ada hasil pemeriksaan. Hasil sesuai dan ketidaksesuaian diberi label simulasi; ketidaksesuaian menampilkan peringatan untuk SuperAdmin. | Penyimpanan append-only terpisah, rantai hash, pemeriksaan terjadwal dan hasil terverifikasi. Tidak ada perhitungan atau verifikasi hash di prototipe. |
| Kondisi dan pemulihan | Loading, gagal muat/coba lagi, belum ada data, hasil filter kosong, catatan tidak tersedia/di luar cakupan, tanggal tidak sah dan simulasi gagal muat berikutnya. Filter dipertahankan saat mencoba lagi. | Kondisi layanan nyata, penanganan sesi/izin, pemulihan jaringan serta observabilitas. |
| Adaptasi dan keyboard | Baris berlabel di bawah 1200 px, form satu kolom dan Terapkan filter setelah isian di bawah 768 px; fokus terlihat, skip link, menu ponsel dan panah berlabel. | Pengujian perangkat fisik, pembaca layar dan browser target serta validasi aksesibilitas yang lebih luas. |

## Peran dan navigasi

| Area | Admin | SuperAdmin | Batas bukti |
| --- | --- | --- | --- |
| Menu dan judul | Aktivitas Saya. | Audit Log. | `admin-audit-nav.js` memperbarui label/tautan bersama dan mempertahankan peran pratinjau. |
| Cakupan catatan | Hanya `actorId=admin`, termasuk akses lokal miliknya; filter pelaku dikunci. | Seluruh aktor sintetis: tiga Admin, satu SuperAdmin, Sistem dan Gateway contoh. | Seluruh fixture tetap berada di browser; ini penyaringan UI, bukan kerahasiaan atau otorisasi server. |
| Detail aktor lain | Pesan aman Catatan tidak tersedia tanpa isi catatan. | Dapat membuka detail seluruh contoh. | Pergantian dari SuperAdmin ke Admin segera membatasi detail yang terlihat. Parameter `role` dapat diganti dan bukan autentikasi. |
| Integritas | Informasi hanya baca umum. | Penjelasan hasil belum tersedia atau simulasi serta peringatan ketidaksesuaian. | Tidak ada pemeriksaan integritas server. |
| Tambah/edit/hapus catatan | Tidak tersedia. | Tidak tersedia. | Pembekuan JavaScript bukan jaminan append-only permanen. Koreksi harus berasal dari modul operasional dan menghasilkan peristiwa baru pada backend kelak. |
| Tautan lintas admin | Menu Aktivitas Saya tersedia. | Menu Audit Log tersedia. | Delapan halaman asal: dashboard, laporan keuangan, pesanan, produk, bahan produksi, buket, pelanggan dan kalender tutup. Laporan keuangan tetap halaman SuperAdmin. |

Spesifikasi v2.6 bagian 3.2, 3.3 dan 13.3 memisahkan audit penuh SuperAdmin dari aktivitas milik Admin, melarang perubahan/penghapusan log dan mewajibkan pencatatan akses. Implementasi produksi perlu sesi staf terautentikasi, otorisasi rute/objek, MFA sesuai baseline, penyaringan data sebelum dikirim, akun audit terbatas, catatan tahan lama serta kebijakan retensi P-34/P-35. Tidak ada kontrol itu yang dibuktikan oleh pemilihan profil atau menu tersembunyi.

Dataset mendemonstrasikan peristiwa pesanan, pembayaran/refund, produk/harga, stok, bahan, buket, pelanggan, kalender, parameter, login, MFA, ekspor dan akses audit. Ini bukan cakupan lengkap seluruh peristiwa wajib bagian 13.3; rekonsiliasi manual, operasi darurat, pengelolaan hak akses dan tindakan modul nyata belum menghasilkan audit terpusat. IP `192.0.2.24` adalah contoh dokumentasi, bukan IP pengguna. Rahasia login dan data pribadi lengkap tidak dimuat.

## Matriks bukti

| Bukti | Hasil tercatat | Batas kesimpulan |
| --- | --- | --- |
| `.impeccable/review/audit-log/verification.json` | Delapan kelompok, nol kesalahan; peran/detail asing, filter/pagination/URL, nilai tetap, akses lokal, status pembayaran terpisah, tanggal/combobox, pemulihan, delapan menu dan empat tampilan pada delapan lebar 320–1920 px. | Fixture dan alur browser lokal; bukan uji server atau lintas sesi. |
| `state-verification.json` pada folder yang sama | Empat kelompok, nol kesalahan; pencarian pelaku dengan keyboard dan hasil dua catatan, enam kondisi pada 390/1440 px, menu ponsel/Escape/fokus/perubahan peran, hasil satu baris pada 1200/1240/1280/1366/1440 px serta Tab dari isian terakhir ke Terapkan filter dan pengiriman ponsel. | Verifikasi terfokus pada kondisi dan dua perbaikan tinjauan. |
| Tangkapan final | 24 PNG peran/detail/kondisi, enam JPG Taste dan lima PNG Hallmark diperbarui setelah perbaikan. | Menunjukkan keadaan dan posisi gulir yang ditangkap. |
| `.taste-skill/audit-log/final/report.json` dan `critique.md` pada folder induknya | Taste 0 FAIL / 0 WARN; kritik 7,8. | Kualitas visual pada viewport bukti, bukan sertifikasi produk. |
| `hallmark.txt` pada folder tinjauan | Mentah 1 FAIL / 0 WARN / 4 ANSWERED. Gate 56 pada sidebar dan `.product-editor-nav` dari CSS bersama; editor itu tidak digunakan halaman ini. | Reviewer tidak melihat benturan pada bukti. Checker/waiver tidak diubah dan laporan tidak dinyatakan nol FAIL. |
| `detector.json` | Satu kali pemeriksaan: tiga advisori palet incumbent, nol temuan primer. | Tidak diulang; drift palet dan sidecar global yang belum ada tidak diperbaiki atau dikanonisasi. |
| `finish-review.md` dan `finish-verdict.md` | Tinjauan penuh membuka 35 gambar dan meminta dua perbaikan. Putusan lanjutan membuka ulang 35 tangkapan terbaru; tepat dua RESOLVED, sisa CLEAR, SHIP untuk perbaikan yang dinilai. | Putusan lanjutan bukan tinjauan penuh baru atas seluruh permukaan atau kesiapan produksi. Laporan awal menyebut tiga kelompok kondisi; laporan terkini memuat empat. |

Konsep Impeccable `seed:1055e158a5da0bbc` dibuat sebelum implementasi dan tersimpan di `concept-seed.txt`; Taste framed-sheet seed 1683893219 diwarisi terpisah. Komposisi mengikuti kontrak fungsional dan komponen admin incumbent. Tidak ada comp baru yang disetujui atau pemilihan identitas baru. `PRODUCT.md`, `DESIGN.md`, konfigurasi dan ketiadaan sidecar global dipertahankan.

Seluruh bukti memakai Chrome/Puppeteer, input sintetis dan viewport emulasi. Perangkat fisik, pembaca layar, seluruh browser target, jaringan/server nyata dan konkurensi belum diuji. Tidak ada database/API, autentikasi/otorisasi nyata, audit akses permanen, penyimpanan append-only tahan lama, verifikasi hash atau retensi nyata. Semua perubahan reset saat refresh. ID fixture membuka modul yang tersedia, tetapi keadaan atau isi peristiwa audit tidak dinyatakan sama dengan keadaan/isi fixture saat ini; tidak ada sinkronisasi modul asal. Rincian visual dan kontrak ada di `docs/design/surfaces/audit-log-surface.md`.
