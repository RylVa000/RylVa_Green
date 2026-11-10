# Pelanggan

Mode: Operate. Target: `public/pages/staff/customers.html`. Ekstensi prototipe admin HTML/CSS/Vanilla JavaScript dalam sistem RylVa Green yang sudah disepakati.

## Direction contract

WORLD: Poppins lokal, krem/sage, sidebar incumbent, permukaan datar, radius 8/12 px, token semantik Antrean Pesanan. Taste framed-sheet seed 1683893219 diwarisi; tidak ada redraw atau perubahan identitas.

QUESTION: Pelanggan mana yang perlu ditindaklanjuti, dan pesanan apa yang menjadi konteksnya?

STORY: Cari pelanggan melalui nama, kontak, atau nomor pesanan; periksa status akun dan kebutuhan tindak lanjut; buka riwayat pesanan; catat hasil penanganan. Akun, pembayaran, pengiriman, dan tindak lanjut adalah konsep terpisah.

FIRST VIEWPORT: Judul dan konteks, empat kartu filter terpisah mengikuti Antrean Pesanan, pencarian dan filter, lalu tabel pelanggan dengan penanda akun dan tindak lanjut serta kolom Buka khusus. Rincian memakai identitas, kondisi, tindakan sesuai peran, dan lima tab.

SIGNATURE: Catatan tindak lanjut dan kasus pesanan tampil dengan konteks dan tindakan berikutnya. Kasus pesanan dibuka pada modul Antrean; menyelesaikan catatan tidak menyelesaikan komplain.

FORM: Kontrol shared 44 px, combobox dari admin-controls untuk pilihan panjang, dialog hanya untuk tindakan sensitif dan konfirmasi hasil. Alasan wajib, error dekat isian, gagal simpan mempertahankan input, guard catatan belum tersimpan, lock selama saving.

## Quality bar

Gunakan kembali shell, queue-button, queue-tab, queue-badge, product-panel, product-detail-tabs, product-dialog, dan admin-controls. Ringkasan mengikuti kartu terpisah yang diminta pengguna, label kiri/angka kanan. Tabel responsif menjadi kelompok berlabel; jangan menghilangkan status atau tindakan. Nama panjang dan badge tidak terpotong, email tersamarkan, tidak ada scroll halaman horizontal, target kontrol minimal 44 px dan fokus keyboard jelas.

## Aturan bisnis

- Baseline v2.6 matriks akses 3.2: staf melihat data operasional; pelanggan mengelola profil/alamat. Tidak ada editor profil, alamat, kata sandi, atau akun staf pada modul ini.
- Admin dan SuperAdmin dapat menonaktifkan sementara akun dengan alasan. Pengaktifan kembali, anonimisasi, dan ekspor khusus SuperAdmin.
- Status akun: Belum Terverifikasi, Aktif, Ditangguhkan, Dinonaktifkan, Dianonimkan. Status ini tidak mengubah pesanan yang telah dibuat.
- Anonimisasi diblokir oleh pesanan aktif, refund berjalan, penanganan/catatan terbuka, legal hold, atau ketiadaan permintaan penghapusan yang tercatat. Evaluasi akun tidak aktif P-36 belum diimplementasikan. Referensi transaksi dipertahankan; tidak ada hapus transaksi.
- Email selalu tersamarkan pada UI dan CSV. Ekspor memerlukan alasan serta verifikasi simulasi dan tercatat dalam aktivitas lokal. Kode 123456 adalah fixture, bukan MFA nyata.
- Pelanggan bertransaksi 30 hari dihitung dari contoh pesanan 6 Okt–4 Nov 2026. Pelanggan baru dihitung berdasarkan tanggal bergabung pada periode yang sama. Pembayaran bersih = pembayaran berhasil minus refund berhasil, bukan laporan pendapatan.

## Implementasi yang tersedia

- Sumber permukaan: `public/pages/staff/customers.html`, `public/assets/css/staff/customers/customers.css`, `public/assets/js/staff/customers/customers-data.js`, dan `public/assets/js/staff/customers/customers.js`. CSS Antrean Pesanan, workflow pesanan, Produk & Varian, serta admin-controls dipakai kembali bersama `admin-controls.js` dan `admin-shell.js`.
- Empat kartu ringkasan memakai pola queue-tab terpisah: Semua pelanggan, Bertransaksi 30 hari, Pelanggan baru 30 hari, dan Perlu tindak lanjut. Pencarian mencakup nama, ID, kontak, dan nomor pesanan; filter status memakai combobox bersama, dengan urutan dan pagination lima baris. Konteks daftar, peran, pelanggan, dan tab tersimpan pada URL.
- Rincian memiliki tab Ringkasan, Pesanan, Alamat, Catatan & penanganan, serta Aktivitas. Profil dan alamat baca-saja. Status akun, pesanan aktif, dan tindak lanjut memiliki label/ikon terpisah; tab Pesanan juga memisahkan status pesanan, pembayaran, dan pengiriman.
- Catatan operasional ditambahkan tanpa editor/hapus catatan, dengan pilihan tindak lanjut. Penyelesaian meminta hasil wajib dan tidak menutup komplain atau pesanan. Isian divalidasi, disimpan sekali saat saving, dipertahankan setelah kegagalan simulasi, dan dilindungi saat meninggalkan draf.
- Nonaktifkan sementara tersedia bagi kedua peran; aktifkan kembali, anonimisasi, dan ekspor hanya bagi SuperAdmin. Dialog mencatat alasan 5–500 karakter; tiga tindakan khusus SuperAdmin memakai kode simulasi 123456. Anonimisasi menambahkan frasa persis ANONIMKAN serta memeriksa ulang penghalang sebelum komit. Yuni Wulandari adalah fixture yang memenuhi syarat; tidak ada hapus permanen pelanggan atau transaksi.
- Ekspor CSV mencakup semua hasil filter, bukan hanya halaman aktif; email tetap tersamarkan dan alasan tercatat per pelanggan pada aktivitas lokal. Aktivitas Admin hanya menampilkan aktor Admin yang sedang dipratinjau; SuperAdmin melihat seluruh aktor lokal, bukan Audit Log produksi.
- Navigasi tab sticky berada 4 px dari atas. Pilihan aktif ditampilkan kembali setelah render, font siap, dan resize; fokus dipertahankan setelah pergantian tab. Toolbar tablet menempatkan pencarian di atas dua filter, lalu bertumpuk pada ponsel. Tabel menjadi kelompok nilai berlabel tanpa membuang status atau tindakan. Skip link memindahkan fokus ke wilayah utama yang benar.
- Pilihan pratinjau yang terlihat menyediakan Admin/SuperAdmin, data tersedia/loading/error/kosong, serta kegagalan simpan berikutnya. Validasi, saving, konfirmasi, sukses, pencarian tanpa hasil, dan pelanggan tidak ditemukan mempunyai umpan balik serta pemulihan yang sesuai.
- Tautan Pelanggan dari dashboard, laporan keuangan, pesanan, produk, dan bahan produksi membuka modul dengan varian peran tetap terbawa. Enam referensi pesanan membuka fixture Antrean yang sesuai. Tautan balik Antrean ke pelanggan dan sinkronisasi lintas halaman belum dibuat.

## Bukti dan putusan tinjauan

- `.impeccable/review/customers/verification.json`: 8 kelompok lulus, 0 kesalahan; mencakup pencarian/angka/pagination, status dan tautan pesanan, catatan serta pemulihan gagal simpan, batas peran, guard anonimisasi, ekspor, kondisi data, dan batas halaman pada 320/390/640/768/1024/1280/1440/1920 px.
- `fix-verification.json`: 5 kelompok terfokus lulus, 0 kesalahan. Semua pilihan status/urutan muat pada 320/390/768/1440 px, tab Catatan/Aktivitas aktif terlihat, skip link memindahkan fokus, fokus tab bertahan, serta tautan Pelanggan dan Bahan Produksi SuperAdmin tetap berbeda.
- `final-captures.json`: 24 PNG final, 0 kesalahan; daftar, lima tab rincian, dan konfirmasi pada 390/768/1440 px, ditambah kosong/loading/error pada 390 px. Enam JPG Taste final pada 390/768/1440 px dibuka kembali setelah koreksi sumber terakhir. Taste: 0 FAIL / 0 WARN; kritik round 2 7,8, pascaperbaikan round 3 7,9.
- Detector dijalankan sekali: 3 advisori warna incumbent, 0 temuan primer. Hallmark merender 5 PNG final; pemeriksaan statis tetap 1 FAIL / 0 WARN / 4 ANSWERED (F7). Gate 56 berada pada navigasi editor sticky dalam `products.css` bersama; tidak ada benturan yang terlihat pada Customers. Pemeriksa dan waiver tidak diubah; hasil ini bukan 0 Hallmark.
- Tinjauan penuh segar `finish-review.md` membuka 24 PNG dan 6 JPG serta meminta 3 perbaikan: tab aktif tersembunyi, nilai filter terpotong, dan skip link salah tujuan. `finish-verdict.md` membuka ulang seluruh 30 gambar, menilai tepat 3 perbaikan RESOLVED dan sisa CLEAR. Disposisi SHIP hanya mencakup perbaikan yang dinilai, bukan audit penuh baru atau sertifikasi produksi.

Semua bukti browser memakai Chrome/Puppeteer, input sintetis, dan viewport emulasi; perangkat fisik serta pembaca layar belum diuji. Kontrak dan Quality bar di atas dipertahankan. Poppins, krem/sage, framed sheet, radius 8/12 px, dan kepadatan admin diwarisi tanpa redraw, comp, atau pemilihan konsep baru. `PRODUCT.md` dan `DESIGN.md` tidak diubah; `.impeccable/design.json` yang sebelumnya tidak ada tidak dibuat. Advisori palet dan drift CSS bersama dicatat, bukan dibakukan sebagai aturan baru. Rincian integrasi berada pada `docs/coverage/customers-coverage.md`.

## Batas prototipe

Identitas, alamat, dan statistik adalah sintetis, snapshot 4 November 2026 pukul 10.00 WIB: sembilan profil, enam referensi pesanan, dua kasus pesanan, dan dua catatan awal. Data ada di memori tab dan refresh mengembalikan fixture. Belum ada autentikasi, MFA nyata, pencabutan sesi, database/API, audit permanen, pengiriman notifikasi, penegakan akses server, atau sinkronisasi lintas halaman. Parameter peran hanya pratinjau. Evaluasi akun tidak aktif P-36 dan pengelolaan profil/alamat oleh pelanggan belum dibuat. Sebelum produksi, fixture perlu diganti data yang sah serta tautan referensi perlu dipetakan ke rekaman nyata. Profil, catatan, angka pembelian, dan tindakan lokal bukan bukti kegiatan pelanggan nyata atau laporan pendapatan. Tidak ada raster baru.
