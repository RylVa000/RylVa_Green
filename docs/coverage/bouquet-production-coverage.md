# Cakupan Buket & Produksi

Target: `public/pages/staff/bouquet-production.html`. Prototipe interaktif HTML/CSS/Vanilla JavaScript ini memperluas admin incumbent untuk konfigurasi buket kustom dan pekerjaan florist. Snapshot sintetis 4 November 2026 pukul 10.20 WIB memuat dua konfigurasi dan tiga pekerjaan. Master bahan memakai `materials-data.js` yang sudah ada; seluruh perubahan tetap di memori tab dan hilang saat refresh.

## Alur dan persyaratan integrasi

| Alur | Perilaku prototipe | Kebutuhan aplikasi produksi |
| --- | --- | --- |
| Antrean dan perhatian | Empat kartu filter tahap, pencarian, filter Tahap produksi, peringatan kekurangan, jadwal/tenggat, detail pekerjaan dan tautan pesanan. Hitungan serta tahap perhatian diturunkan dari pekerjaan lokal, kendala dan kekurangan; kesiapan bahan tetap ditampilkan terpisah dari tahap produksi. | Daftar pekerjaan dan status terkini dari layanan terotorisasi, waktu server dan sinkronisasi lintas pengguna. |
| Rincian pekerjaan | Detail menampilkan pilihan, jumlah buket, harga, versi konfigurasi dan kebutuhan snapshot bersama stok bebas, alokasi, pemakaian dan riwayat tindakan. Jadwal/slot dan tenggat ditampilkan di antrean. | Snapshot tersimpan permanen dengan referensi pesanan dan konfigurasi nyata. |
| Mulai merangkai | Kekurangan/kendala memblokir mulai. Konfirmasi beralasan mengalokasikan batch layak pakai dengan batas pakai terdekat di Gudang Pusat, tanpa mengurangi fisik. | Validasi server, kebijakan FEFO dan tanggal server, reservasi atomik, penguncian saldo serta titik komit produksi yang disepakati. |
| Catat pemakaian | Jumlah per bahan/batch dibatasi sisa alokasi. Konfirmasi menambah entri buku besar negatif dan pemakaian alokasi sekali; pemakaian parsial didukung. | Transaksi atomik/idempoten, validasi saldo terbaru, audit tahan lama dan pemulihan kegagalan. |
| Satuan dan batas jumlah | Meter disimpan sebagai integer per 0,01 meter; satuan diskret harus utuh. Masukan belum selesai tidak ditulis ulang saat mengetik; nilai di atas sisa dibatasi dan presisi diperiksa sebelum mutasi. Satuan berbeda tidak dijumlahkan. | Validasi jumlah dan satuan independen di server, penyimpanan tepat serta konversi yang terversi bila ditambahkan. |
| Selesai produksi | Hanya dapat dikonfirmasi tanpa kendala setelah semua kebutuhan snapshot tepat tercatat sebagai pemakaian. Tidak mengubah status pesanan, pembayaran atau pengiriman. | Mesin status produksi terpisah dan aturan transisi yang ditegakkan server; integrasi pemenuhan yang eksplisit. |
| Kendala dan penyelesaiannya | Kedua tindakan memerlukan alasan dan mencatat aktor/waktu dalam riwayat lokal; kendala menahan tindakan produksi berikutnya. | Otorisasi, data terbaru, audit permanen serta penanganan/escalation operasional nyata. |
| Lepas alokasi | Tersedia hanya sebelum ada pemakaian. Alasan wajib; sisa alokasi dibebaskan tanpa mutasi fisik, pekerjaan kembali siap dirangkai. | Kebijakan pembatalan/koreksi setelah pemakaian, transaksi atomik dan hubungan pembatalan pesanan. Tidak ada pembalikan pemakaian pada prototipe ini. |
| Daftar konfigurasi | Workspace kedua berisi pencarian, status aktif/nonaktif/belum lengkap, tambah, detail dan edit. Produk kustom contoh terpisah dari SKU buket siap jual. | Pengaitan produk/varian nyata, rute dan daftar terotorisasi, penyimpanan master di server. |
| Informasi dan bahan dasar | Nama, kode konfigurasi unik tanpa membedakan kapital, nama varian, harga dasar rupiah bulat, status serta kebutuhan bahan dasar per buket. | Keunikan, batas nominal, referensi bahan dan aturan produk yang divalidasi server. |
| Kelompok dan opsi | Kelompok memiliki nama dan minimum/maksimum sesuai opsi aktif. Opsi memiliki nama unik dalam kelompok, status aktif, harga tambahan dan bahan yang dibutuhkan. Satu opsi dapat menunjuk satu opsi tidak cocok pada kelompok lain. | Model kategori/opsi dan pemetaan bahan nyata; aturan kompatibilitas yang terversi dan divalidasi server. UI ini tidak mencakup ekspresi aturan umum atau banyak target per opsi. |
| Editor dan validasi | Satu editor opsi terbuka, navigasi empat bagian dan bar simpan sticky. Bahan dicari memakai combobox bersama. Ringkasan memblokir simpan untuk identitas, harga, batas pilihan, bahan tidak aktif, jumlah tidak sah, duplikasi dan referensi kompatibilitas tidak sah. | Validasi yang sama di server, pengelolaan konflik master serta aksesibilitas dan pengujian perangkat lebih luas. |
| Simpan dan versi | Alasan minimal lima karakter wajib; simpan menambah versi serta aktor/alasan/waktu lokal. Draf dipertahankan saat gagal simpan; guard melindungi perubahan belum disimpan. | Persistensi, audit permanen, versi/konkurensi dan penanganan kegagalan jaringan nyata. |
| Snapshot pekerjaan | Perubahan master/status/harga/bahan tidak menghitung ulang pilihan, harga, versi atau kebutuhan pekerjaan yang sudah ada. | Snapshot pesanan yang dibentuk dan disimpan oleh server sesuai bagian 26.2–26.6. |
| Simulasi konfigurasi | Perubahan pilihan dan jumlah 1–20 buket menampilkan harga dasar plus tambahan, kebutuhan teragregasi per bahan, stok bebas dan kekurangan. Peringatan minimum/maksimum atau ketidakcocokan ditampilkan bila tidak sah; total tetap dapat terlihat bersama peringatan. Tidak mengubah stok, menyimpan draf atau membuat pekerjaan baru. | Perhitungan harga/kebutuhan server saat keranjang dan checkout, penolakan konfigurasi tidak sah, persetujuan ulang harga bila berubah, serta validasi ketersediaan terbaru. |
| Kondisi dan pemulihan | Pilihan pratinjau memuat loading, gagal muat/coba lagi, kosong dan gagal simpan berikutnya; konfirmasi, saving, sukses dan kesalahan tersedia. | Kondisi layanan nyata, pemulihan sesi, konkurensi dan pemantauan kesalahan. |

Bagian 26.2–26.6 spesifikasi v2.6 menetapkan sumber kebenaran server, opsi/harga sah, validasi keranjang/checkout, snapshot, kebutuhan dan riwayat stok/status terpisah. Bagian 27.3 memisahkan stok varian barang dagangan dari bahan produksi buket. Prototipe mendemonstrasikan alur lokal; titik alokasi dan Catat pemakaian manual bukan klaim reservasi/komit otomatis saat checkout. Tidak ada penggantian bahan/desain otomatis bila stok kurang.

## Peran dan navigasi

| Area | Admin | SuperAdmin | Batas bukti |
| --- | --- | --- | --- |
| Antrean, detail dan simulasi | Tersedia. | Tersedia. | Kedua profil memakai fixture yang sama. |
| Tambah/edit/status konfigurasi | Tersedia dengan validasi dan alasan. | Operasi yang sama. | Tidak ada persetujuan atau hak khusus tambahan untuk konfigurasi pada prototipe. |
| Mulai/pemakaian/selesai/kendala/lepas | Tersedia sesuai tahap, saldo dan guard lokal. | Operasi yang sama. | Pilihan profil dan parameter `role` bukan autentikasi atau otorisasi. |
| Riwayat buket | Menampilkan riwayat pekerjaan/konfigurasi lokal. | Riwayat lokal yang sama. | Tidak ada log audit permanen atau klaim pembatasan aktor seperti modul lain. |
| Menu buket lintas admin | Tautan tersedia. | Tautan mempertahankan `role=superadmin`. | Tujuh halaman asal diperiksa: dashboard, laporan keuangan, pesanan, produk, bahan produksi, pelanggan dan kalender tutup. |
| Keuangan, Audit Log, Pengaturan | Mengikuti menu incumbent yang disembunyikan. | Mengikuti menu incumbent yang ditampilkan. | Perluasan buket tidak mengubah pembagian peran tersebut atau membuktikan kontrol akses server. |

Produksi membutuhkan identitas staf dari sesi terautentikasi, otorisasi tiap rute/tindakan, MFA sesuai baseline, penyaringan data sebelum dikirim, dan audit permanen. Menyembunyikan menu atau mengganti profil browser tidak memenuhi kebutuhan itu.

## Matriks bukti

| Bukti | Hasil tercatat | Batas kesimpulan |
| --- | --- | --- |
| `.impeccable/review/bouquet-production/verification.json` | Tujuh kelompok, nol kesalahan; ringkasan/kekurangan, alokasi FEFO tanpa mutasi fisik, gagal simpan atomik lokal, pemakaian/selesai, lepas/kendala, simulasi/snapshot, validasi/editor/combobox, profil dan pemulihan. Empat permukaan diperiksa pada delapan lebar 320–1920 px. | Hanya alur yang dicatat; bukan bukti integrasi server atau transaksi lintas sesi. |
| `edge-verification.json` pada folder yang sama | Tiga kelompok, nol kesalahan; buat melalui form/combobox keyboard, gagal simpan dan coba lagi, ketepatan meter, pecahan diskret ditolak, pemakaian parsial tidak dapat menyelesaikan, tujuh tautan menu mempertahankan SuperAdmin. | Masukan dan fixture sintetis. |
| `decimal-verification.json` | Tiga kelompok, nol kesalahan; pengetikan tombol demi tombol `0.29`, hapus/ganti isian awal, mutasi tepat 29 unit, `1.5` batang ditolak, batas sisa 1,21 meter dan normalisasi nilai negatif saat selesai. | Verifikasi terfokus pada satu perbaikan masukan pemakaian. |
| Tangkapan alur | 13 PNG antrean/detail/konfigurasi/editor pada 390/768/1440 px dan dialog pemakaian 390 px diperbarui sesudah perbaikan. `decimal-entry-390.png` menambah total menjadi 14. | Gambar menunjukkan keadaan yang ditangkap, bukan jaminan bebas tumpang tindih pada semua posisi gulir. |
| Taste final | Enam JPG, 0 FAIL / 0 WARN; kritik build 7,7. | Memeriksa kualitas visual pada viewport yang tersedia. |
| Hallmark | Lima PNG; laporan mentah 1 FAIL / 0 WARN / 5 ANSWERED. Gate 56 menggabungkan `.sidebar`, `.product-editor-nav` yang tidak dipakai di halaman ini dan `.bouquet-editor-nav`. Reviewer tidak melihat benturan sticky pada bukti. | Checker tidak diubah dan hasilnya tidak dinyatakan 0 FAIL. |
| Detector sekali | Tiga advisori palet incumbent, nol temuan primer. | Tidak dijalankan ulang; drift palet dan sidecar global yang belum ada tidak dikanonisasi atau diperbaiki. |
| `finish-review.md` dan `finish-verdict.md` | Percobaan awal terhenti karena batas penggunaan; tinjauan penuh berikutnya selesai dengan 24 gambar dan satu permintaan perbaikan masukan desimal. Putusan lanjutan membuka gambar desimal serta 13 tangkapan yang diperbarui, menilai satu perbaikan RESOLVED, sisa CLEAR dan SHIP untuk perbaikan yang dinilai. | Putusan lanjutan bukan tinjauan penuh baru atau sertifikasi produksi. |

Konsep Impeccable `seed:e3bc5711e3a79785` dibuat sebelum implementasi dan tersimpan di `concept-seed.txt`; Taste framed-sheet seed 1683893219 diwarisi secara terpisah. Implementasi mengikuti kontrak fungsional dan komponen incumbent. Tidak ada comp baru yang disetujui atau klaim alur comp-led.

Seluruh bukti browser memakai Chrome/Puppeteer dan viewport emulasi. Perangkat fisik, pembaca layar, semua browser target, jaringan nyata dan konkurensi belum diuji. Tidak ada database, API, backend, autentikasi/otorisasi nyata, audit permanen, notifikasi, pembayaran atau pengiriman nyata. Pesanan, checkout, keranjang, halaman bahan dan modul admin lain belum tersinkronisasi. Tautan memakai ID fixture pesanan yang sudah tersedia; komposisi kustom bersifat sintetis dan tidak dinyatakan sama dengan komposisi lama pada fixture pesanan tersebut. Tidak ada penjadwal/kapasitas produksi, pembuatan pekerjaan dari checkout, atau integrasi produksi florist operasional. Rincian visual ada pada `docs/design/surfaces/bouquet-production-surface.md`.
