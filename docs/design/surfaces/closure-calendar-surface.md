# Kalender Tutup

Mode: Operate. Target `public/pages/staff/closure-calendar.html`; prototipe HTML, CSS, dan Vanilla JavaScript dalam shell admin RylVa Green yang sudah disepakati.

## Direction contract

WORLD: Poppins, krem/sage, sidebar, framed sheet, tab, tombol, badge, dan dialog dari Antrean Pesanan/Produk/Pelanggan. Taste seed 1683893219 diwarisi; komposisi mengikuti rincian yang sudah diminta pengguna, tanpa redraw identitas atau comp baru.

QUESTION: Tanggal mana yang tutup dan pesanan mana yang perlu segera ditangani?

FIRST VIEWPORT: Judul dan tindakan menandai tanggal tutup; ringkasan bulan berupa kartu terpisah; peringatan dengan aksi menuju pesanan terdampak; tab Kalender/Tanggal tutup/Riwayat; kalender bulanan dan detail tanggal berdampingan pada desktop.

SIGNATURE: Tanggal tutup dengan pesanan tampil dengan penanda khusus, jumlah terhitung, dan jalur ke setiap pesanan. Form menampilkan pesanan terdampak sebelum penyimpanan; tidak memindahkan jadwal secara otomatis.

INTERACTION: Tombol hari dengan navigasi tombol panah, kontrol bulan, tanggal dipilih, ringkasan, daftar dan riwayat. Tambah, edit keterangan, dan buka kembali dilakukan dengan alasan, validasi, pencegahan duplikat, serta pemulihan gagal simpan. Preview kosong/loading/error dan peran Admin/SuperAdmin disediakan.

FORM: Arah visual dan komponen diwarisi; rincian kalender, peringatan, riwayat, dan tindakan sudah ditetapkan dalam percakapan. Undian konsep Impeccable dijalankan setelah implementasi untuk mencatat referensi yang diminta reviewer: `seed:959af7aa71fb83ba`, output tersimpan di `.impeccable/review/closure-calendar/concept-seed.txt`. Undian ini tidak digunakan untuk memilih atau menyetujui desain; tidak ada comp atau pilihan baru dari pengguna. Tata letak mengikuti rincian percakapan dan komponen yang telah disepakati. Seed Taste di atas tetap referensi gaya yang terpisah.

## Quality bar

Gunakan kontrol dan token incumbent, label status bersama ikon, target minimal 44 px, proporsi sel dalam minggu yang sama, kontras dan fokus keyboard. Detail tanggal memisahkan status pesanan, pembayaran, dan pengiriman. Pada layar sempit kalender dapat digeser di dalam panel tanpa scroll horizontal halaman; setiap sel memiliki label aksesibel lengkap.

## Aturan dan batas

Atas permintaan pengguna, tanggal sebelum hari ini hanya dapat dilihat: penandaan, perubahan keterangan, dan pembukaan kembali diblokir. Prototipe menghitung hari ini dari jam perangkat dalam zona WIB; integrasi produksi perlu memakai tanggal server dalam zona WIB.

Spesifikasi v2.6 12.6: Admin dan SuperAdmin dapat menandai tanggal tutup; tanggal itu tidak dapat dipilih sebagai tanggal kirim. Pesanan yang sudah terjadwal ditampilkan untuk dihubungi dan dijadwalkan ulang mengikuti 9.7. Perubahan 9.7 harus mempertahankan layanan kurir dan ongkir serta memenuhi lead time; perubahan dicatat dan dikonfirmasi kepada pelanggan. Modul ini tidak melakukan perubahan jadwal atau mengirim pesan.

Data 3 November 2026 adalah contoh: dua tanggal tutup dan enam pesanan merujuk pada fixture Antrean. Semua perhitungan diturunkan dari contoh; perubahan hanya di memori tab, hilang ketika refresh dan tidak tersinkronisasi dengan checkout atau Antrean. Tidak ada database, API, otorisasi, audit permanen, notifikasi, atau validasi jadwal server. Profil Admin melihat riwayatnya sendiri; SuperAdmin melihat seluruh aktor contoh. Slot P-08 ditampilkan sesuai fixture; perubahan jam dan kapasitas bukan fungsi halaman ini. Tidak ada raster baru.


## Implementasi permukaan

Kalender memakai kartu ringkasan bersama, peringatan konflik dan tautan pesanan, tab Kalender/Tanggal tutup/Riwayat, serta detail tanggal dengan status pesanan, pembayaran, dan pengiriman yang dibedakan melalui label dan ikon. Tombol bulan dan hari mendukung navigasi; tombol panah berpindah hari, fokus tombol dipertahankan, dan tanggal terpilih serta snapshot hari ini ditandai. Pada layar sempit hanya panel kalender yang bergeser horizontal; petunjuk geser muncul ketika isinya melampaui panel.

Admin dan SuperAdmin dapat menambah tanggal tutup, mengubah keterangan, dan membuka kembali dengan alasan. Form memeriksa tanggal duplikat dan alasan; tanggal yang memiliki pesanan meminta pengakuan peringatan sebelum disimpan. Simulasi gagal simpan mempertahankan isian untuk dicoba kembali. Riwayat lokal menyimpan alasan lama dan baru saat edit; Admin melihat aktornya sendiri dan SuperAdmin melihat kedua aktor contoh. Pratinjau profil dan kondisi loading/error/kosong tersedia.

Halaman memuat gaya Antrean Pesanan, workflow, produk, kontrol bersama, dan shell admin, ditambah `closure-calendar.css`, `closure-calendar-data.js`, serta `closure-calendar.js`. Poppins dan krem/sage mengikuti token incumbent; tidak ada perubahan sistem desain global atau gambar baru.

## Bukti dan batas penilaian

- `.impeccable/review/closure-calendar/verification.json` mencatat enam kelompok alur lulus dan nol kesalahan browser, termasuk lebar 320–1920 px, penanda dalam sel, petunjuk geser, status COD, dan tidak adanya perubahan otomatis tanggal pesanan. `links-verification.json` mencatat peran SuperAdmin tetap terbawa pada enam halaman admin serta gaya menu keuangan.
- Lima belas PNG kalender, konflik, daftar tutup, riwayat, dan dialog pada 390/768/1440 px serta enam JPG Taste final dibuka. Taste terakhir mencatat 0 FAIL / 3 WARN, dengan kritik round 3 bernilai 7,8: reviewer menerima konteks bahwa angka tanggal adalah hari kalender, tinggi detail bertambah untuk menampilkan seluruh pesanan, dan deteksi grafik salah mengklasifikasikan tabel kalender.
- Hallmark render mencatat 1 FAIL warisan gate 56 di `products.css` bersama, 0 WARN, 1 WAIVED, dan 5 ANSWERED; lima PNG disimpan di `.hallmark/closure-calendar-shots`. Pemeriksa tidak diubah. Detector Impeccable sekali mencatat tiga advisori warna incumbent dan nol temuan primer.
- `finish-review.md` meminta tiga perbaikan: ikon sel ponsel tetap di dalam sel, klaim checkout diberi batas, dan asal seed dicatat. `finish-verdict.md` menilai tepat tiga perbaikan itu RESOLVED; SHIP hanya berlaku untuk perbaikan yang dinilai, bukan sertifikasi seluruh permukaan atau kesiapan produksi.

Bukti menggunakan browser dan viewport emulasi; perangkat fisik dan pembaca layar belum diuji. Pembatasan tanggal kirim pada v2.6 adalah kebutuhan integrasi, bukan perilaku checkout yang sudah tersambung dalam prototipe. Tidak ada editor kapasitas slot terpisah atau integrasi penjadwalan nyata. Rincian alur dan kebutuhan produksi ada di `docs/coverage/closure-calendar-coverage.md`.

Verifikasi dan seluruh 21 tangkapan diperbarui setelah perubahan format JavaScript yang hanya memecah label aksesibel yang sama ke beberapa baris; enam kelompok tetap lulus tanpa kesalahan browser. Putusan reviewer mendahului perubahan format tersebut dan tetap terbatas pada tiga perbaikan yang dinilai.
