# Detail Pesanan — spesifikasi dan acuan implementasi

13 November 2026. Target: `public/pages/customer/order-detail.html`.

**Penanda:** **Fakta** berasal dari sumber yang diperiksa; **Rancangan** adalah keputusan UI dalam cakupan tugas; **Asumsi perlu dikonfirmasi** adalah kebutuhan yang belum memiliki kontrak operasional. Data pada implementasi HTML merupakan **contoh lokal**, bukan transaksi produksi.

## Sumber dan prioritas

1. Instruksi pengguna: pertahankan identitas proyek, gunakan kembali komponen, navbar dan footer wajib sama dengan Figma; spesifikasi tertulis dilanjutkan implementasi pada permintaan ini.
2. [Spesifikasi v2.6](../../specifications/spesifikasi-proyek-v2.6.md), terutama §3, §8–10, §15, §19, A.7, §27.6; [PRODUCT.md](../../../PRODUCT.md) dan [DESIGN.md](../../../DESIGN.md).
3. [Shell Figma yang telah diverifikasi](storefront-shell.md), [Pembayaran](payment-surface.md), HTML/CSS/JS Pembayaran, skema SQL, serta template pelanggan.
4. Audit Figma sebelumnya menemukan teks “Detail Pesanan”, belum frame detail pelanggan lengkap. Tidak ada layout detail Figma baru yang dianggap telah disetujui. Shell memakai ekspor dan ukuran asli yang sudah tersedia; konten detail mengikuti spesifikasi, bukan fitur marketplace lain.

Panduan empat skill diselaraskan dalam mode **Operate**: hierarki transaksi, komponen konsisten, fokus/validasi, dan pemulihan. Rekomendasi hero pemasaran, foto dekoratif, font atau tema baru tidak diterapkan karena bertentangan dengan fungsi halaman dan instruksi mempertahankan desain.

## 1. Pemahaman dan cakupan halaman

**Fakta.** Halaman pelanggan terautentikasi untuk satu pesanan miliknya. Tujuan: memahami posisi pesanan, memeriksa snapshot pembelian, melacak pengiriman, dan menyelesaikan tindakan yang memang diizinkan. Bukan halaman publik atau konsol Admin. Pembayaran, pengiriman, komplain, permintaan pembatalan dan refund mempunyai status tersendiri.

**Cakupan UI:** ringkasan/status; item dan konfigurasi; alamat/jadwal/kurir; riwayat; ringkasan biaya; akses Pembayaran/bukti pelunasan; pembatalan atau permintaan pembatalan; konfirmasi penerimaan; formulir komplain dan banding; informasi penanganan/refund. Keputusan refund, persetujuan komplain, koreksi terminal, perubahan alamat, dan perubahan jadwal tetap kewenangan staf. Pelanggan tidak mengubah snapshot sendiri.

**Kondisi awal.** `templates/customer/order_detail_tracking.php` masih komentar scaffold; belum route pelanggan PHP yang berfungsi. Pembayaran tersedia sebagai pratinjau HTML interaktif; tombol detail sebelumnya membuka ringkasan dialog. Daftar pesanan dan login pelanggan belum tersedia sebagai halaman storefront. Tidak dibuat daftar palsu untuk mengisi tujuan navigasi.

Produk menetapkan mobile-first. Implementasi diperiksa pada desktop 1440 px, tablet 768 px, dan ponsel 390/320 px; shell desktop juga tetap mengikuti referensi 1920 px.

## 2. Struktur dan isi halaman

| Urutan | Isi | Keputusan dan alasan |
| --- | --- | --- |
| 1 | Navbar tiga baris Figma; pemberitahuan pratinjau | Aset, warna, menu, pencarian dan proporsi mengikuti shell Pembayaran; penanda contoh terlihat. |
| 2 | Breadcrumb, header panel Detail Pesanan, kembali | Asal nyata bila masuk dari Pembayaran; route dan navigasi lama tetap digunakan. |
| 3 kiri | Status, nomor pesanan, tanggal pembelian, batas komplain bila berlaku | Mengikuti ringkasan detail transaksi referensi. Status uang/pesanan/pengiriman tetap terpisah. Nomor dapat disalin. |
| 3 kanan | Area tindakan vertikal | Satu tombol utama Selesaikan Pesanan / Lanjutkan Pembayaran sesuai kelayakan. Lacak, Bantuan, komplain atau banding mengikuti status. Tetap terlihat saat halaman desktop digulir. |
| 4 kiri | Detail Produk | Nama, SKU, varian, satuan, kuantitas, harga dan konfigurasi snapshot. RylVa Green ditampilkan sebagai identitas toko; tidak mengarang marketplace multivendor. |
| 5 kiri | Info Pengiriman | Kurir, resi yang dapat disalin, penerima/alamat, tanggal/slot. Lihat Detail dan Lacak membuka informasi serta riwayat yang tersedia; URL resmi tampil hanya bila ada. |
| 6 kiri | Rincian Pembayaran | Metode, subtotal, ongkir, total belanja, dana terverifikasi dan status. Akses dokumen/pembayaran berada di konteks biaya, tanpa mengisi kolom tindakan dengan semua tautan. |
| 7 kiri | Penanganan, pembatalan, komplain dan refund bila ada | Alasan publik, tenggat, keputusan dan tindak lanjut; tidak ada catatan staf rahasia. |
| 8 kiri | Riwayat Pesanan | Kejadian tercatat terbaru dahulu; disclosure untuk riwayat panjang. |
| 9 | Footer Figma | Lima kelompok dan copyright tetap sama dengan referensi. |

Panel tunggal memakai Poppins, krem dan hijau botani proyek. Referensi Tokopedia diterapkan pada pemisah section, susunan rincian kiri/tindakan kanan, dan tombol persegi membulat pada area tindakan; dialog memakai komponen lama. Desktop memakai panel maksimum 1120 px dan kolom tindakan 304 px (272 px pada desktop kecil). Pada lebar sampai 860 px urutannya menjadi ringkasan → tindakan → rincian, sama dengan urutan DOM/fokus keyboard. Nominal tetap utuh; label turun baris bila perlu. Riwayat panjang memakai disclosure, tanpa filter/pagination daftar.

**Referensi pengguna, 13 November 2026:** tiga screenshot Detail Transaksi Tokopedia. Yang diikuti: hierarki status di atas, nomor/tanggal, produk, pengiriman, rincian pembayaran dan area tombol yang konsisten. Yang disesuaikan: route tetap halaman Detail Pesanan dengan panel dan scroll halaman, agar tautan langsung serta navbar/footer Figma tetap berfungsi; tidak menambahkan backdrop/daftar transaksi yang belum ada. Tampilan modal dan maskot pada gambar bukan persyaratan fitur baru. Warna hijau Tokopedia, logo/karakter, chat penjual, voucher, diskon, asuransi, biaya COD/aplikasi, nominal, nomor pesanan dan data pribadi pada screenshot tidak disalin. Tidak ada dasar fitur atau kebijakan untuk menambahkannya ke transaksi RylVa.

## 3. Alur penggunaan

**Utama:** masuk dari Pembayaran/daftar/notifikasi → server memeriksa pemilik → loading → ringkasan terbaru → baca item/pengiriman → lakukan tindakan yang diizinkan → konfirmasi bila berdampak → kirim satu kali → hasil terverifikasi → ringkasan dan riwayat diperbarui.

**Alternatif:** belum bayar → lanjut ke Pembayaran dengan pesanan yang sama; dalam pengiriman → tracking resmi atau salin resi; terkirim → komplain dalam jendela atau konfirmasi setelah membaca dampak; permintaan pembatalan menunggu → baca keputusan, tanpa permintaan kedua; komplain ditolak → banding satu kali dalam tenggat; refund berjalan → baca progres tanpa mengulangi pembatalan.

**Kembali:** detail baru mulai di atas. Asal Pembayaran kembali ke pesanan/metode yang sama. Kontrak daftar masa depan menyimpan kata kunci, filter, urutan, halaman, dan posisi gulir di URL/history asal; detail hanya menerima alamat lokal yang diizinkan. Saat daftar belum tersedia, tampilkan panduan alih-alih link mati. URL eksternal dari parameter kembali ditolak. Tombol browser tetap berfungsi.

**Form belum dikirim:** batal/Escape meminta keputusan “Lanjut mengisi” atau “Buang isian” bila formulir telah berubah. Menutup setelah sukses tidak meminta lagi. `beforeunload` melindungi draft selama halaman terbuka; browser menentukan dialog native. Koneksi putus/gagal validasi mempertahankan teks dan pilihan; foto hanya di memori tab, tidak di localStorage. Hasil timeout tidak langsung dikirim ulang: perbarui status dahulu. Setelah refresh yang menyatakan belum tercatat, tindakan dapat ditinjau dan dicoba kembali.

## 4. Komponen dan interaksi

| Komponen | Sumber / penyesuaian | Perilaku |
| --- | --- | --- |
| Navbar/footer, aset SVG/font | Gunakan ulang shell Figma | Tidak mengubah komposisi atau tema; tujuan yang belum tersedia diberi pemberitahuan jujur. |
| Panel, tombol, badge, ikon, skeleton, dialog | Gunakan ulang fondasi Pembayaran | Fokus terlihat; disabled punya penjelasan dalam konteks; aksi menunggu tidak bisa dikirim ulang. |
| Ringkasan status dan tindakan | Baru, khusus detail | Hak tindakan berasal dari snapshot server dan diperiksa kembali saat submit. |
| Snapshot item dan biaya | Pola Pembayaran | Gambar gagal menjadi placeholder berlabel; tidak mengganti harga dari katalog. |
| Alamat dan pelacakan | Baru | Data hanya untuk pemilik; resi dapat disalin; link hanya HTTPS dari sumber tervalidasi. |
| Timeline/disclosure | Baru | Terbaru dahulu, tampilkan kejadian tercatat; fokus summary terjaga. |
| Lacak / Lihat Detail pengiriman | Dialog memakai pola lama | Buka status, kurir, resi dan riwayat; tampilkan resi belum tersedia tanpa link fiktif. Escape mengembalikan fokus ke pemicu. |
| Form pembatalan, komplain, banding | Baru memakai dialog proyek | Label permanen, error per bidang, ringkasan error, konfirmasi dampak. |
| Panel komplain/refund/penanganan | Baru | Hanya keputusan publik; jumlah refund berhasil tidak disamakan dengan dana yang baru disetujui. |

Hover/focus menggunakan perubahan warna/outline, tanpa informasi tersembunyi yang hanya tersedia lewat hover. Dialog memakai elemen `dialog`, focus trap native, fokus awal ke judul/kolom pertama, Escape terlindungi untuk draft, dan fokus kembali ke pemicu atau ringkasan bila pemicu hilang setelah transisi.

## 5. Status dan penanda penting

| Dimensi | Nilai / pemicu | Dampak dan penanda |
| --- | --- | --- |
| Pesanan | Menunggu Pembayaran → Siap Diproses → Sedang Disiapkan → Dikirim → Terkirim → Selesai | Label eksplisit; ikon jam/truk/centang. Dibatalkan dan Perlu Penanganan adalah cabang, bukan langkah linear wajib. |
| Pembayaran | Menunggu, Berhasil, Gagal, Kedaluwarsa, Dibatalkan, Perlu Ditinjau, Refund Diproses, Dikembalikan Sebagian/Penuh, Sengketa | Selalu terpisah. COD Menunggu tidak memblokir pemenuhan yang telah valid. |
| Pengiriman | Belum Diserahkan, Dalam Pengiriman, Terkendala, Terkirim, Dikembalikan | Tampilkan alasan gangguan dan tindakan lanjutan; tidak menyimpulkan Selesai dari bukti kirim saja. |
| Pembatalan | Diajukan → Disetujui / Ditolak | Diajukan belum berarti dibatalkan; alasan penolakan harus terlihat. |
| Komplain | Diajukan → Dalam Tinjauan → Disetujui / Ditolak → Dieskalasi bila banding → Selesai | Komplain terbuka menunda penyelesaian otomatis. Banding final hanya oleh SuperAdmin. |
| Refund | Diajukan → Disetujui / Ditolak → Diproses → Berhasil / Gagal | Gagal memerlukan tindak lanjut toko, bukan tombol pelanggan untuk mentransfer dana sendiri. |
| Penanganan | PH-01/06 stok, PH-02 pembayaran terlambat, PH-03 nominal, PH-04 pengiriman, PH-05 hilang/rusak, PH-07 pembatalan saat dikirim | Teks manusia didahulukan, kode pendukung. Pilihan penyelesaian tidak diarang bila belum diberikan toko. |

Hijau untuk keberhasilan terverifikasi; amber untuk perhatian/menunggu; merah untuk gagal atau dampak destruktif; netral untuk histori/selesai tanpa aksi. Selalu sertakan teks/ikon. Loading/offline/error UI bukan status bisnis baru dan tidak mengganti status historis.

## 6. Tindakan dan dampaknya

| Tindakan | Syarat / konfirmasi | Hasil dan pemulihan |
| --- | --- | --- |
| Perbarui status | Boleh membaca; tidak sedang submit | Pertahankan data terakhir, waktu pembaruan dan fokus; gagal tampilkan retry. |
| Lanjutkan pembayaran | Online, Menunggu Pembayaran, tindakan diizinkan | Buka Pembayaran pesanan sama. Tidak membuat transaksi atau mengganti deadline dari detail. |
| Batalkan pesanan | Menunggu Pembayaran atau Siap Diproses; alasan wajib untuk pascapembayaran | Dialog objek/alasan/dampak; backend memeriksa gateway/versi. Paid siap diproses: refund penuh otomatis; COD belum lunas: tidak ada refund. UI tidak melepas stok. |
| Ajukan pembatalan | Sedang Disiapkan atau Dikirim dan diizinkan server | Alasan wajib; belum membatalkan. Saat disiapkan jelaskan batas produk mudah layu/kesalahan toko; saat dikirim jelaskan upaya penghentian tanpa jaminan dan refund bersyarat. |
| Konfirmasi diterima | Dikirim/Terkirim, belum Selesai; tak ada komplain terbuka | Konfirmasi eksplisit: “Pesanan menjadi Selesai dan Anda tidak dapat mengajukan komplain lagi.” Tidak dipilih otomatis. Jika COD belum lunas, konfirmasi tidak menandai pembayaran Berhasil. |
| Ajukan komplain | Terkirim, belum Selesai, masih dalam P-11; server menentukan tenggat | Kategori, deskripsi, foto kecuali Tidak diterima. Berhasil: Diajukan; auto-complete ditunda. |
| Ajukan banding | Ditolak, belum pernah banding, dalam P-17 | Alasan wajib; satu kali; Dieskalasi. Keputusan final bukan tombol pelanggan. |
| Lihat bukti pelunasan | Pembayaran terverifikasi dan dokumen tersedia | Pratinjau contoh ditandai; gagal memuat tidak mengubah status bayar. Jangan klaim email/PDF produksi tersedia. |
| Salin nomor/resi | Nilai tersedia | Pengumuman inline; jika clipboard ditolak sediakan nilai yang bisa dipilih/disalin manual. |
| Lacak pengiriman | URL HTTPS tervalidasi tersedia | Buka tab baru `noopener noreferrer`; jika hanya resi, salin resi tanpa mengarang domain kurir. |

Semua mutasi memakai kunci idempotensi yang sama saat merekonsiliasi hasil permintaan yang belum pasti. Tombol ganda/pintasan submit kedua tidak membuat permintaan baru. Pelanggan tidak menghapus pesanan, mengubah harga/status, menyetujui refund sendiri atau membatalkan refund yang sedang dieksekusi.

## 7. Aturan bisnis, validasi, dan hak akses

- **Fakta:** hanya pemilik; autentikasi server, CSRF untuk POST, escaping output, pengecekan versi dan status terakhir. Pesanan akun lain merespons 404, tanpa bocoran penerima atau item. Akun staf bukan akun pelanggan.
- Penerimaan sejak Dikirim/Terkirim menutup komplain (§9.5). Komplain hanya dalam 24 jam sejak Terkirim (P-11), tidak setelah Selesai. Deadline ditentukan server, termasuk bila tab lama tidak aktif.
- Kategori komplain: Layu/tidak segar; Rusak (produk/kemasan); Salah/tidak sesuai; Kurang item; Terlambat >2 jam dari slot untuk produk mudah layu; Tidak diterima. Jangan menjadikan semua produk berhak pada aturan keterlambatan mudah layu.
- Deskripsi/kategori wajib. Foto 2–5, maksimum 5 MB per berkas dan 4000×4000 px (P-27/P-42); Tidak diterima tidak wajib foto. **Rancangan:** format JPEG/PNG/WebP pada pratinjau; format final mengikuti allowlist backend, bukan bukti semua format telah disetujui. File rusak/tipe tersamar ditolak; backend wajib memverifikasi ulang.
- Alasan pembatalan dan banding wajib. Batas panjang alasan/deskripsi pada pratinjau 2.000 karakter merupakan batas UI defensif, **Asumsi perlu dikonfirmasi** terhadap kontrak backend, bukan aturan bisnis baru.
- Perubahan alamat/jadwal hanya oleh Admin pada Siap Diproses/Sedang Disiapkan, kurir dan ongkir tetap serta lead time terpenuhi. UI hanya menjelaskan cara meminta bantuan, tanpa formulir edit snapshot.
- Refund tidak melebihi uang diterima, tidak memulihkan stok otomatis, tidak diproses ketika Sengketa. Waktu target 3 hari kerja sejak disetujui; waktu dana tiba tergantung penyedia. Jangan mengartikan penanda refund sebagai dana sudah masuk.
- Server memeriksa tenggat, kepemilikan, duplikasi komplain/permintaan, total, bukti, versi, sesi dan hak tindakan. Guard frontend membantu UX, tidak menggantikan pemeriksaan server.

## 8. Matriks state

Prioritas **W** wajib; **L** lanjutan integrasi; **O** opsional. Skenario preview dipisahkan di workbench pengembangan. State bersyarat hanya berlaku jika server mengembalikan kondisi tersebut.

| Area / komponen | Nama state | Pemicu | Isi tampilan / pesan | Tindakan tersedia | Data / input dipertahankan | Jalur pemulihan | Prioritas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Halaman | Loading awal | Baca pertama | Skeleton ringkasan, item dan biaya; aria-busy | Kembali | Asal navigasi | Hasil baca / pesan proses lama | W |
| Halaman | Proses lama | Baca belum selesai | “Masih memuat pesanan” | Muat ulang / kembali | Identitas pesanan | Permintaan baca baru | W |
| Halaman | Normal | Snapshot valid | Ringkasan dan section relevan | Sesuai hak | Snapshot | — | W |
| Kontrol | Hover / focus | Pointer / keyboard | Warna dan outline terlihat | Aktivasi biasa | Nilai | Blur / pindah fokus | W |
| Riwayat | Collapsed / expanded | Summary ditekan | Empat kejadian / seluruh riwayat | Buka / tutup | Posisi gulir | Summary yang sama | W |
| Halaman | Read-only | Diarsipkan / snapshot historis | “Riwayat hanya dapat dilihat” | Baca / kembali | Snapshot | Bantuan | W |
| Ringkasan | Pembaruan sebagian | Perbarui ditekan | “Memperbarui…”; data lama tetap | Baca | Snapshot / draft | Hasil baca | W |
| Mutasi | Mengirim | Submit valid | Tombol “Mengirim…”; form terkunci | Tunggu | Semua isian | Hasil / timeout | W |
| Mutasi | Hasil belum pasti | Timeout / putus setelah kirim | “Periksa status sebelum mengirim lagi” | Perbarui status | Draft dan request key | Rekonsiliasi dahulu | W |
| Pesanan | Menunggu bayar | Status server | Instruksi langkah bayar, deadline referensi | Lanjut bayar / batal | Snapshot | Pembayaran | W |
| Pesanan | COD belum lunas | COD valid | “Bayar saat diterima”; nilai belum lunas | Sesuai tahap | Status terpisah | Konfirmasi uang oleh sistem berwenang | W |
| Pesanan | Siap / disiapkan | Status server | Langkah pemenuhan | Batal / ajukan sesuai tahap | Snapshot | Tunggu keputusan | W |
| Pengiriman | Dalam pengiriman | Serah tercatat | Kurir, resi, timeline | Lacak / terima / ajukan batal | Snapshot | Toko bila kendala | W |
| Pengiriman | Terkendala / dikembalikan | Event kurir / staf | Alasan publik, langkah tindak lanjut | Baca penanganan | Snapshot | Toko meninjau | W |
| Penerimaan | Terkirim, jendela terbuka | T-12 | Batas komplain WIB dan dampak terima | Komplain / terima | Snapshot | Form / konfirmasi | W |
| Penerimaan | Jendela berakhir | Waktu server melewati batas | Komplain tidak tersedia; cek status terbaru | Perbarui | Snapshot | Auto-complete server | W |
| Pesanan | Selesai | T-13 | Ringkasan final; komplain ditutup | Baca dokumen | Snapshot | Bantuan untuk koreksi berwenang | W |
| Pesanan | Dibatalkan | T-08/T-10 | Alasan dan refund terpisah | Lihat refund / pembayaran | Snapshot | Tindak lanjut dana | W |
| Penanganan | PH-01–07 | Case aktif | Alasan, tenggat, penawaran toko bila ada | Baca / bantuan | Snapshot | Kontrak persetujuan perlu backend | W/L |
| Pembatalan | Diajukan / ditolak | Permintaan tercatat | Status, waktu, alasan keputusan | Baca / perbarui | Alasan | Keputusan toko | W |
| Komplain | Belum ada | Tak ada komplain | Tidak ada kartu kosong berlebihan | Ajukan bila layak | Snapshot | Form | W |
| Komplain | Terbuka / dieskalasi | Pengajuan / banding | Status, bukti, deskripsi, respons publik | Baca / perbarui | Isi terkirim | Tunggu keputusan | W |
| Komplain | Ditolak, dapat banding | Keputusan, belum P-17 | Alasan dan batas banding | Banding | Komplain | Form banding | W |
| Komplain | Banding ditutup | Sudah banding / tenggat habis | Alasan tidak tersedia | Baca / bantuan | Komplain | Putusan final | W |
| Pelacakan | Detail dibuka / ditutup | Lacak atau Lihat Detail ditekan | Status, kurir, resi, riwayat tersedia | Salin / URL resmi bila ada / tutup | Snapshot pesanan | Escape / tutup, fokus kembali | W |
| Refund | Diajukan / diproses | Refund tercatat | Status, nominal, target bersyarat | Perbarui | Riwayat dana | Tunggu penyedia | W |
| Refund | Sebagian / penuh berhasil | Konfirmasi dana | Nominal berhasil; total historis tetap | Baca | Riwayat dana | — | W |
| Refund | Gagal / ditolak | Hasil server | Alasan publik; toko menindaklanjuti | Perbarui / panduan | Riwayat dana | Retry sistem / antrean manual | W |
| Pengiriman | Belum ada resi | Belum serah | “Resi tersedia setelah diserahkan” | Baca | Jadwal | Penyegaran nanti | W |
| Riwayat | Kosong | Belum ada event publik | “Riwayat belum tersedia” | Perbarui | Snapshot | Muat ulang section | W |
| Snapshot | Sebagian data hilang | Metadata opsional kosong | “Belum tersedia” per bidang | Baca / perbarui | Bagian valid | Penyegaran | W |
| Snapshot | Tidak valid / status asing | Nilai inti tak valid | Jangan tampilkan nominal/tindakan menyesatkan | Muat lagi / panduan | Identitas non-sensitif | Server memperbaiki | W |
| Gambar | Gagal dimuat | Image error | Placeholder “Foto belum tersedia” | Baca item | Teks dan harga | Aset diperbaiki | W |
| Form | Belum valid | Wajib kosong | Error dekat bidang + ringkasan | Perbaiki | Semua isian | Fokus error pertama | W |
| Foto | Kurang / terlalu banyak / rusak | Validasi file | Batas dan cara memperbaiki | Pilih ulang / hapus | Teks dan file valid | Validasi ulang | W |
| Form | Duplikat | Server menemukan kasus sama | Kasus yang sudah tercatat | Perbarui / lihat kasus | Draft sampai dipastikan | Baca versi terbaru | W |
| Mutasi | Berhasil | Respons terkonfirmasi | “Pratinjau: … tercatat”; status baru | Tutup / baca | Snapshot baru | — | W |
| Mutasi | Gagal | Respons pasti gagal | Alasan dan perbaikan | Kirim ulang setelah koreksi | Draft | Ulang tindakan | W |
| Halaman | Gagal memuat | Baca gagal | “Pesanan belum dapat dimuat” | Coba lagi / panduan | Asal | Baca ulang | W |
| Koneksi | Offline | Browser offline | Banner; data terakhir hanya baca | Sambungkan / perbarui | Snapshot / draft | Online lalu baca | W |
| Layanan | Gangguan / maintenance | Respons layanan | Penjelasan tanpa klaim transaksi berubah | Muat lagi / kembali | Konteks | Coba setelah layanan pulih | W |
| Layanan | Rate limit | 429 | Durasi Retry-After; tidak kirim ulang | Tunggu lalu baca | Draft | Batas berakhir | W |
| Akses | Perlu masuk / sesi habis | 401 | Data pesanan dibersihkan dari DOM | Panduan masuk | Return context; bukan PII | Login pelanggan saat tersedia | W/L |
| Akses | Denied / bukan pemilik | 403/404 | Pesanan tidak ditemukan/dapat diakses | Kembali / panduan | Tidak ada detail sensitif | Akun pemilik | W |
| Akses | Perlu verifikasi | Server mensyaratkan | Penjelasan verifikasi | Panduan verifikasi | Return context | Alur akun | L |
| Ketersediaan | Tidak ditemukan / tidak tersedia | 404/410 | Pesan tanpa bocoran | Kembali / panduan | Konteks asal | Tujuan valid | W |
| Form | Perubahan belum disimpan | Batal / Escape / leave | Konfirmasi buang isian | Lanjut isi / buang | Draft sampai dibuang | Kembali ke form | W |
| Konflik | Status/versi berubah | 409 | Tindakan lama tidak dikirim ulang | Perbarui dan tinjau | Draft | Versi terbaru + kelayakan ulang | W |
| Konflik | Tampilan lama | Refresh gagal / tab kembali | Waktu snapshot dan peringatan | Perbarui | Data lama | Baca terbaru | W |
| Konflik | Tenggat lewat saat form terbuka | Server menolak | Komplain/banding tak lagi tersedia | Tutup / perbarui | Draft sampai ditutup | Ringkasan terbaru | W |
| Dokumen | Gagal dimuat | Receipt error | “Bukti belum dapat dimuat”; bayar tetap | Coba lagi / tutup | Snapshot | Baca dokumen ulang | W |
| Clipboard | Izin ditolak | Clipboard gagal | Nilai dan instruksi salin manual | Pilih teks | Nomor / resi | Salin manual | W |

Tidak relevan: pencarian/filter tanpa hasil, pagination daftar, bulk action dan keberhasilan sebagian unggahan produksi. Form komplain dikirim atomik; tidak menampilkan sukses bila sebagian bukti wajib gagal. Tidak membuat state verifikasi tambahan selain respons layanan.

## 9. UX dan aksesibilitas

- Ringkasan/status di atas, informasi item dan pengiriman berikutnya; satu tindakan utama. Pesan penting tidak hanya toast dan tidak menutup tombol. Tindakan berdampak memiliki dialog terarah.
- Target utama minimal 44×44 px; footer/utility desktop mengikuti pengecualian shell Figma yang telah didokumentasikan, ponsel minimal 44 px. Jangan menyebut seluruh shell lolos AA tanpa pengukuran; warna/ukuran kecil sumber tetap merupakan batas referensi.
- Heading berurutan, section bernama, alamat semantik, daftar item/timeline, `dl` biaya. Nomor/resi panjang membungkus, nama tidak dipotong tanpa cara membaca lengkap.
- Semua input berlabel; petunjuk/error memakai `aria-describedby`, invalid memakai `aria-invalid`. Error dibaca melalui region live; loading memakai aria-busy, perubahan hasil live polite tanpa membaca seluruh halaman ulang.
- Navigasi keyboard, focus-visible, dialog native, urutan DOM yang masuk akal, skip link ke isi; saat mutasi menghapus pemicu, fokus ke ringkasan terbaru.
- Tanpa animasi dekoratif; hormati reduced-motion. Native disclosure tidak membutuhkan hover. Fokus tidak tertutup panel sticky.

## 10. Data, keamanan, dan kebutuhan sistem

**Read model minimum:** ID/nomor/versi/serverNow/snapshotAt; status tiap dimensi dan allowedActions; tanggal dibuat; item snapshot (nama/SKU/varian/satuan/kuantitas/harga/konfigurasi); alamat snapshot; subtotal/ongkir/total/dana terverifikasi; metode; kurir/slot/resi/URL/event; deliveredAt/complaintDeadline; cancellationRequest, complaint (keputusan, appealDeadline, appealUsed), refunds, handling (teks publik), receiptAvailable, archived.

**Pemetaan tersedia:** SQL `pesanan`, `item_pesanan`, `konfigurasi_buket_pesanan`, `pengiriman`, `peristiwa_pengiriman`, `riwayat_status_pesanan`, `komplain`, refund dan percobaan pembayaran. Skema bukan bukti backend telah terhubung. Tanggal disimpan UTC, tampil WIB; harga integer IDR tanpa desimal. Alamat penerima hanya terlihat pada pemilik, log/request tidak menyimpan isi sensitif; data refund manual hanya diminta saat diperlukan melalui proses aman, tidak ditambahkan sebagai form bank pada pratinjau ini.

**Backend baseline A.7:** GET orders/:id dan receipt; POST cancel, confirm-receipt, complaints; POST complaints/:id/appeal. Ini kontrak spesifikasi, **belum endpoint aktif**. Integrator menyediakan adapter detail; frontend tidak memanggil URL rekaan. Server bertanggung jawab atas sesi, ownership, CSRF, idempotensi, konkurensi versi, tenggat, audit append-only, unggahan aman, gateway/kurir dan auto-complete. Persetujuan penawaran PH belum memiliki kontrak pelanggan eksplisit; jangan membuat endpoint baru diam-diam.

**Pratinjau:** adapter fixture terpisah, sessionStorage hanya data sintetis per skenario. Navigasi dari Pembayaran memakai snapshot contoh yang sama dan meneruskan perubahan contoh yang relevan; tidak mengaku mengubah database/stok/uang. Foto draft hanya memori dan object URL dibersihkan. Produksi tidak boleh menganggap state query sebagai otorisasi. Tautan tracking, aset dan isi respons harus divalidasi/di-escape; jangan menampilkan catatan staf, tanda tangan webhook, token atau payload provider.

## 11. Daftar pekerjaan dan kriteria selesai

**Wajib:** halaman/alias route; shell dan aset lama; CSS detail scoped; adapter/render terpisah; status, item, biaya, pengiriman/timeline; panel kasus; form batal/komplain/banding dan konfirmasi penerimaan; guard/validasi/draft/error/retry; state workbench di luar root publik; sambungan Pembayaran; dokumentasi serta uji browser/build struktur.

**Lanjutan bergantung backend:** auth/daftar riwayat nyata, gateway/kurir, bukti pelunasan riil, unggahan, penyimpanan keputusan/riwayat, notifikasi, bank refund terenkripsi, endpoint persetujuan penyelesaian PH. **Opsional:** tautan anchor antar-section bila data riil sangat panjang; tidak perlu tab untuk konten pendek saat ini.

Kriteria penerimaan:

1. Shell detail sama dengan Pembayaran/Figma, tanpa perubahan global tak terkait.
2. Snapshot pembayaran dan detail tidak berganti nomor/item/total saat navigasi pergi-pulang. COD tidak dipaksa lunas.
3. Setiap tahap menampilkan tindakan yang layak; tidak ada tombol Admin di halaman pelanggan.
4. Pembatalan langsung dan permintaan menunggu dibedakan; refund belum berhasil tidak diberi label dana kembali.
5. Konfirmasi diterima menjelaskan hak komplain berakhir, butuh tindakan eksplisit, dan menutup aksi komplain setelah berhasil.
6. Kategori/foto/tenggat komplain tervalidasi, Tidak diterima dapat tanpa foto; banding satu kali dan dalam tenggat.
7. Double-submit tidak menggandakan mutasi; offline/timeout/conflict/sesi habis mempunyai pemulihan dan mempertahankan draft yang aman.
8. Foto gagal, metadata kosong, status asing, nama panjang dan nominal besar tidak merusak layout atau mengaktifkan tindakan finansial.
9. Keyboard/fokus/dialog/Escape/buang draft berfungsi; tidak overflow pada 1440/768/390/320 px.
10. Dev workbench tidak menjadi kontrol produksi; seluruh contoh ditandai; tidak ada klaim endpoint atau integrasi riil yang belum tersedia.
11. Uji struktur/syntax, regresi Pembayaran/shell yang terdampak, dan matriks detail dijalankan; screenshot hasil aktual diperiksa dan temuan diperbaiki.

## 12. Asumsi dan keputusan yang belum pasti

| Temuan / konflik | Dampak dan keputusan sementara |
| --- | --- |
| Frame lengkap Detail Pesanan belum ditemukan dalam audit desain | Gunakan shell asli dan komposisi transaksi turunan Pembayaran; bukan klaim menyalin frame detail Figma. |
| Daftar pesanan/login pelanggan belum tersedia | Kembali memulihkan asal Pembayaran; panduan jujur untuk tujuan belum tersedia. Integrasi daftar tidak dianggap selesai. |
| P-42: 5×5 MB vs post_max_size 8 MB | UI memeriksa per file/jumlah/dimensi, menandai backend perlu menyelaraskan total request. Tidak mengarang batas total 25 MB sebagai konfigurasi server aktif. |
| Matriks §8.8 belum lengkap untuk COD belum lunas saat pemenuhan | Ikuti §9.1/T-07 yang eksplisit; pertahankan pembayaran Menunggu. Perlu rekonsiliasi backend. |
| Tenggat pembayaran P-01 vs per metode P-40 | Detail hanya memakai expiresAt server; tidak membuat deadline baru. |
| Utility Figma “Pengembalian mudah 7 hari” vs P-11 24 jam komplain | Shell dipertahankan atas instruksi; isi transaksi mengikuti v2.6, tanpa memperluas hak komplain. Copy pemasaran perlu keputusan pemilik sebelum rilis. |
| Alur persetujuan proposal PH dan kanal bantuan belum dikontrak | Informasi dan panduan tersedia; tidak membuat tindakan persetujuan atau kontak toko fiktif. |
| Pembatalan produk mudah layu saat disiapkan | Tampilkan syarat kesalahan toko dan permintaan untuk ditinjau; tidak auto-setuju atau auto-refund. Server menentukan kelayakan terakhir. |
| Format foto, panjang deskripsi, status/versi read model | Batas UI defensif didokumentasikan; wajib diselaraskan saat integrasi. |

Tidak perlu konfirmasi tambahan untuk membangun UI dalam cakupan ini. Keputusan operasional di atas menjadi pekerjaan integrasi/penyelarasan sumber, bukan aturan baru yang diam-diam disahkan oleh desain.

## Direction contract

**THESIS:** pola detail transaksi yang dikenali pelanggan Tokopedia: satu bidang rincian di kiri dan satu area tindakan di kanan; status dan ketentuan RylVa tetap menjadi sumber kebenaran.

**OWN-WORLD:** shell Figma asli, Poppins, krem dan hijau botani dipertahankan. Satu panel transaksi bersekat menggantikan kartu terpisah; tombol kanan berbentuk persegi membulat mengikuti referensi, dialog memakai komponen lama.

**STORY:** pelanggan mengenali pesanannya, memahami status dan batas tindakan, lalu melacak atau menyelesaikan masalah tanpa kehilangan konteks.

**FIRST VIEWPORT:** navbar tiga baris dan penanda contoh, breadcrumb, lalu panel dengan judul Detail Pesanan. Kolom kiri diawali status, nomor dan tanggal, lalu produk; tombol utama dan tindakan sekunder tersusun vertikal di kanan. Rincian pembayaran berada setelah info pengiriman. Area kanan sticky pada desktop dan menjadi area tindakan dalam alur halaman pada ponsel.

**FORM:** Operate, code-led, adaptasi komposisi tiga screenshot Tokopedia dari pengguna. `seed: none (pinned)` — “buat kaya UI tokped agar user tidak binggung” dan “untuk nav dan footernya wajib sama dengan yang sudah saya buat di figma”.

**QUALITY BAR:** uang/status benar dalam konteks contoh, tindakan beralasan, form dan pemulihan tuntas, fokus terjaga, layout panjang tidak terpotong, seluruh hasil diperiksa dalam browser.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
