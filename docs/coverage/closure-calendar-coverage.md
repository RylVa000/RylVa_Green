# Cakupan Kalender Tutup

Target: `public/pages/staff/closure-calendar.html`. Prototipe admin berbahasa Indonesia memakai snapshot sintetis 3 November 2026: dua tanggal tutup, dua entri riwayat awal, dan enam referensi pesanan yang mencerminkan ID fixture Antrean. Perubahan hanya di memori tab dan hilang saat refresh.

## Alur dan kebutuhan integrasi

| Alur | Perilaku prototipe | Kebutuhan produksi |
| --- | --- | --- |
| Kalender dan ringkasan | Kartu ringkasan bulan, kontrol bulan, hari terpilih, snapshot hari ini, tombol hari dan navigasi panah keyboard. Status dan peringatan memakai label serta ikon. | Tanggal dan data operasional terkini dari layanan yang terotorisasi. |
| Konflik dan rincian | Tanggal tutup dengan pesanan ditandai; detail memisahkan status pesanan, pembayaran, dan pengiriman. Peringatan dan tautan membuka pesanan fixture terkait. COD menunggu tetap berbeda dari status pesanan. | Referensi pesanan nyata, status terkini dan akses terotorisasi. Tidak ada sinkronisasi perubahan lintas halaman. |
| Tambah dan edit | Kedua peran dapat menandai tanggal dan mengubah keterangan. Validasi memeriksa duplikasi dan alasan; pesanan pada tanggal tersebut ditampilkan dan memerlukan pengakuan sebelum simpan. Kegagalan simulasi dapat dicoba kembali dengan isian dipertahankan. | Validasi dan pemeriksaan konflik atomik di server, penyimpanan permanen, penanganan kegagalan dan konkurensi. |
| Tanggal lampau | Tanggal sebelum hari ini berdasarkan jam perangkat di WIB hanya dapat dilihat; aksi tambah, edit, dan buka kembali diblokir untuk kedua peran. | Tentukan hari ini dari waktu server di WIB dan validasi ulang pada setiap perubahan. |
| Buka kembali | Kedua peran dapat membuka kembali tanggal dengan alasan; pesanan tidak otomatis dijadwalkan ulang. | Otorisasi, validasi status terkini, dan pencatatan permanen. |
| Daftar dan riwayat | Daftar tanggal tutup bulanan dan riwayat lokal tersedia. Edit mencatat alasan lama dan baru; Admin melihat aktornya sendiri, SuperAdmin melihat kedua aktor contoh. | Filter akses dan audit permanen di server; pilihan profil bukan autentikasi. |
| Kondisi dan responsif | Pratinjau profil, loading, error dan kosong tersedia. Pada layar sempit hanya panel kalender bergeser horizontal dan petunjuk muncul jika ada overflow. | Integrasi kondisi layanan nyata dan pengujian aksesibilitas serta perangkat lebih luas. |

Spesifikasi v2.6 bagian 12.6 mengatur tanggal tutup dan pembatasan pilihan tanggal kirim; bagian 9.7 mengatur perubahan jadwal, termasuk layanan kurir, ongkir, lead time, pencatatan, dan konfirmasi kepada pelanggan. Prototipe menampilkan pesanan terdampak dan meminta pengakuan, tetapi tidak mengubah tanggal pesanan, membatasi checkout, mengirim pesan, atau menyediakan editor kapasitas slot terpisah. Tidak ada integrasi penjadwalan nyata.

## Verifikasi dan batas

- `.impeccable/review/closure-calendar/verification.json`: enam kelompok lulus, nol kesalahan browser; pengujian 320–1920 px mencakup penanda di dalam sel, petunjuk geser sesuai overflow, COD, dan tanggal pesanan tidak berubah otomatis. `links-verification.json` memverifikasi peran SuperAdmin pada enam halaman admin dan gaya menu keuangan.
- Lima belas PNG pada 390/768/1440 px dan enam JPG Taste final dibuka. Taste terakhir 0 FAIL / 3 WARN, kritik round 3 7,8; reviewer menerima bahwa angka tanggal adalah hari kalender, detail memanjang untuk seluruh pesanan, dan klasifikasi grafik pada tabel kalender merupakan salah deteksi.
- Hallmark render: 1 FAIL warisan gate 56 pada `products.css` bersama, 0 WARN, 1 WAIVED, 5 ANSWERED; lima PNG tersedia di `.hallmark/closure-calendar-shots`. Pemeriksa tidak diubah. Detector sekali mencatat tiga advisori warna incumbent, nol temuan primer.
- `finish-review.md` meminta tiga perbaikan: penanda ponsel di dalam sel, kualifikasi klaim checkout, dan asal seed. `finish-verdict.md` menyatakan tepat tiga temuan tersebut RESOLVED dan SHIP hanya untuk perbaikan yang dinilai, bukan sertifikasi seluruh permukaan.

FORM mencatat `seed:959af7aa71fb83ba` dan `.impeccable/review/closure-calendar/concept-seed.txt`: seed dibuat setelah implementasi semata untuk dokumentasi, tidak memandu atau menyetujui desain. Taste framed-sheet seed 1683893219 terpisah; tidak ada comp baru yang disetujui pengguna atau gambar baru.

Bukti memakai browser dengan input sintetis dan viewport emulasi; perangkat fisik dan pembaca layar belum diuji. Tidak ada backend, validasi server, autentikasi, otorisasi, audit permanen, pembatasan checkout, notifikasi atau pesan nyata. Fixture dan tindakan bukan data operasional nyata. Kontrak dan bukti visual ada di `docs/design/surfaces/closure-calendar-surface.md`.

Verifikasi dan seluruh 21 tangkapan diperbarui setelah perubahan format JavaScript yang hanya memecah label aksesibel yang sama ke beberapa baris; enam kelompok tetap lulus tanpa kesalahan browser. Putusan reviewer mendahului perubahan format itu dan hanya mencakup tiga perbaikan yang dinilai.
