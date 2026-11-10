# Buket & Produksi

Mode: Operate. Target `public/pages/staff/bouquet-production.html`. HTML, CSS, dan Vanilla JavaScript; perluasan shell admin RylVa Green.

## Direction contract

WORLD: Poppins lokal, krem/sage, sidebar, framed sheet, kartu ringkasan terpisah, badge berikon, tombol, combobox, dan dialog incumbent. Taste framed-sheet seed 1683893219 diwarisi; sistem global tidak diganti.

QUESTION: Pekerjaan buket mana yang perlu dikerjakan dan apakah bahannya siap?

FIRST VIEWPORT: Antrean produksi sebagai awal, empat filter tahap, peringatan kekurangan bahan, pencarian dan tabel pekerjaan. Konfigurasi buket menjadi ruang kerja kedua dengan tambah/detail/editor, kelompok pilihan, aturan kompatibilitas, harga, pemetaan bahan dan simulasi.

SIGNATURE: Kesiapan bahan terlihat terpisah dari tahap produksi. Detail memperlihatkan kebutuhan snapshot, stok bebas, alokasi pekerjaan, pemakaian dan tindakan berikutnya. Pada ponsel konteks dan tindakan mendahului rincian bahan.

INTERACTION: Mulai mengalokasikan bahan contoh berdasarkan batch layak pakai terdekat; Catat pemakaian mengurangi saldo fisik contoh dan alokasi. Pemakaian dibatasi sisa alokasi, penyelesaian mensyaratkan seluruh kebutuhan tercatat. Kendala, penyelesaian kendala dan pelepasan alokasi sebelum pemakaian meminta alasan. Editor menggunakan satu opsi terbuka, navigasi bagian dan bar simpan sticky, combobox bahan, ringkasan validasi dan pemulihan gagal simpan.

FORM: Konsep Impeccable dijalankan sebelum implementasi, `seed:e3bc5711e3a79785`, output `.impeccable/review/bouquet-production/concept-seed.txt`. Referensi ini dicatat tanpa mengklaim persetujuan comp. Komposisi fungsional mengikuti rincian percakapan dan instruksi memakai ulang komponen; tidak ada comp baru atau pemilihan visual baru oleh pengguna.

## Quality bar

Kontrol minimal 44 px, fokus keyboard, label status plus ikon dan warna semantik bersama, jarak teratur, tombol tindakan berkolom sendiri. Tabel berubah menjadi baris berlabel pada layar sempit. Editor mempertahankan isian gagal simpan, melindungi perubahan belum disimpan, memvalidasi kode unik, jumlah positif sesuai satuan, harga rupiah bulat, batas pilihan, bahan aktif dan kompatibilitas. Simulasi menghitung harga serta kebutuhan untuk 1–20 buket tanpa mengubah stok atau konfigurasi.

## Aturan dan batas

Spesifikasi v2.6 bagian 26 dan 27: konfigurasi/harga/kebutuhan pesanan adalah snapshot; perubahan master tidak mengubah pekerjaan lama. Persediaan barang dagangan dan bahan produksi terpisah. Master bahan memakai `materials-data.js` yang sudah ada, bukan master paralel. Produk kustom contoh tidak mengambil stok SKU buket siap jual.

Titik reservasi/komit/pemakaian otomatis produksi belum ditetapkan sebagai integrasi backend. Alur alokasi dan Catat pemakaian di halaman ini adalah simulasi manual yang eksplisit, bukan klaim pengurangan otomatis saat checkout. Pesanan, pembayaran, pengiriman, pelanggan, checkout dan halaman Bahan Produksi lain belum tersinkronisasi. Tautan memakai pesanan contoh yang sudah tersedia dan tidak menyatakan komposisi katalog sama dengan pesanan nyata.

Data sintetis pada snapshot 4 November 2026 pukul 10.20 WIB; perubahan tersimpan di memori tab dan hilang saat refresh. Peran Admin/SuperAdmin merupakan pratinjau, bukan otorisasi. Tidak ada database, API, log audit permanen, notifikasi atau pembayaran nyata. Angka ringkasan diturunkan dari tiga pekerjaan contoh.

## Sistem yang diterapkan

Ini perluasan biasa pada admin yang sudah ada, bukan identitas visual baru. `PRODUCT.md`, `DESIGN.md`, konfigurasi, dan status sidecar global dipertahankan. Poppins lokal memakai bobot 400/500/600/700; bukti Taste mencatat judul halaman 26 px, teks kerja 13 px, serta label 12 px. Kanvas krem, sidebar sage, permukaan putih datar, batas tipis, radius kontrol 8 px dan sheet 12 px mengikuti admin incumbent. Permukaan baru memakai kartu, badge berlabel dan SVG, tombol, dialog, tab workspace serta combobox bahan bersama. Tidak ada gambar raster baru atau dekorasi fotografis.

Antrean menempatkan hitungan tahap sebagai empat filter terpisah, peringatan kekurangan sebagai tindakan, lalu pencarian dan tabel pekerjaan. Tabel menyediakan kolom tindakan sendiri. Di bawah 1200 px tabel menjadi baris dengan label; konteks pekerjaan dan tindakan ditempatkan sebelum kebutuhan bahan. Di bawah 768 px formulir menjadi satu kolom, kartu tahap menjadi dua kolom, dan bar simpan menyesuaikan lebar. Editor mempunyai satu opsi terbuka, navigasi empat bagian dan bar simpan sticky. Dialog pemakaian bergulir dengan tindakan konfirmasi tetap terjangkau.

**Aturan kesiapan terpisah.** Tahap produksi tidak boleh menggantikan keterangan bahan. Detail mempertahankan kebutuhan snapshot, stok bebas, alokasi dan pemakaian sebagai angka berbeda dengan satuan yang sesuai.

**Aturan pemakaian eksplisit.** Mulai merangkai hanya mengalokasikan. Catat pemakaian mengurangi saldo fisik dan sisa alokasi; selesai produksi baru tersedia setelah semua kebutuhan tercatat. Selesai produksi tidak mengubah pesanan, pembayaran atau pengiriman.

**Aturan satu konteks editor.** Satu opsi terbuka serta navigasi bagian, alasan penyimpanan dan bar simpan menjaga formulir panjang tetap terbaca. Simulasi bekerja pada draf tanpa menyimpan konfigurasi atau mengubah stok.

Ketiga aturan ini mendeskripsikan permukaan buket, bukan penambahan token atau larangan global. Drift palet incumbent dan sidecar global yang belum ada tidak dinormalkan sebagai keputusan desain baru dan tidak diperbaiki dalam perluasan ini.

## Cakupan implementasi

- `public/pages/staff/bouquet-production.html` memuat shell, pilihan profil/kondisi data, dialog dan modul. `assets/css/staff/production/bouquet-production.css` menambahkan tata letak buket di atas stylesheet admin bersama.
- `assets/js/staff/production/bouquet-data.js` memuat dua konfigurasi kustom dan tiga pekerjaan sintetis. `assets/js/staff/production/bouquet-production.js` mengatur antrean, URL, detail, alokasi, pemakaian, tindakan, kondisi data dan pemulihan. `assets/js/staff/production/bouquet-editor.js` mengatur tambah/detail/edit konfigurasi serta simulasi.
- Master bahan, batch, buku besar dan alokasi memakai struktur `assets/js/staff/inventory/materials-data.js` yang telah ada dalam tab ini. Tidak ada master bahan paralel, dan perubahan tidak dikirim ke tab Bahan Produksi lain.
- Konfigurasi mencakup nama, kode unik, nama varian, harga dasar, status, bahan dasar, kelompok pilihan minimum/maksimum, opsi aktif, harga tambahan, pemetaan bahan per opsi dan ketidakcocokan terhadap satu opsi pada kelompok lain. Aturan ini bukan mesin aturan kompatibilitas umum.
- Setiap simpan memerlukan alasan, menambah versi dan riwayat lokal. Pekerjaan menyimpan pilihan, harga, versi dan kebutuhan sebagai snapshot; menyimpan master tidak menghitung ulang pekerjaan lama. Simulasi 1–20 buket menampilkan ulang harga, kebutuhan per satuan, stok bebas dan kekurangan, disertai peringatan batas pilihan atau kompatibilitas bila pilihan tidak sah. Total yang masih ditampilkan bersama peringatan bukan konfigurasi siap dipesan.
- Aksi produksi memerlukan catatan minimal lima karakter. Mulai memakai batch yang masih layak berdasarkan batas pakai terdekat; kekurangan memblokir mulai. Pemakaian parsial didukung, kendala dapat dicatat/diselesaikan, dan alokasi hanya dapat dilepas sebelum ada pemakaian.
- Meter memakai integer per 0,01 meter; batang, lembar, balok, pcs dan rol memakai jumlah utuh. Masukan pemakaian mempertahankan angka desimal yang belum selesai saat diketik, membatasi nilai di atas sisa alokasi, serta memvalidasi presisi dan jumlah sebelum mutasi.
- Navigasi Buket & Produksi tersedia pada tujuh halaman admin sebelumnya: Operasional, Laporan Keuangan, Manajemen Pesanan, Produk & Varian, Bahan Produksi, Pelanggan dan Kalender Tutup. Varian SuperAdmin tetap terbawa. Kedua peran mempunyai operasi buket yang sama; menu khusus keuangan/audit/pengaturan tetap mengikuti pembagian incumbent.

## Bukti dan batas penilaian

- `.impeccable/review/bouquet-production/verification.json`: tujuh kelompok alur, nol kesalahan; empat permukaan diperiksa pada delapan lebar 320–1920 px dan 13 tangkapan diperbarui setelah perbaikan masukan angka.
- `edge-verification.json`: tiga kelompok tambahan, nol kesalahan; pembuatan melalui formulir dan combobox keyboard, gagal simpan/coba lagi, presisi meter, penolakan satuan pecahan, pemakaian parsial dan tujuh tautan menu diperiksa.
- `decimal-verification.json`: tiga kelompok, nol kesalahan; pengetikan nyata `0.29`, penggantian isian awal, pencatatan tepat 29 unit, penolakan `1.5` batang tanpa mutasi, batas sisa 1,21 meter, serta normalisasi nilai negatif selesai diuji. `decimal-entry-390.png` menambah total menjadi 14 PNG alur.
- Taste final menyimpan enam JPG, 0 FAIL / 0 WARN dan kritik build 7,7. Lima PNG Hallmark tersimpan terpisah. Hallmark mentah tetap 1 FAIL / 0 WARN / 5 ANSWERED: gate 56 menggabungkan sidebar, navigasi editor produk yang tidak dipakai di halaman ini, dan navigasi editor buket. Reviewer tidak melihat benturan sticky pada tangkapan, tetapi hasil checker tidak diubah atau disebut bersih.
- Detector dijalankan sekali: tiga advisori warna incumbent, nol temuan primer. Tidak ada pengulangan detector atau perubahan pemeriksa/konfigurasi untuk menghapus temuan.
- `finish-review.md` adalah tinjauan penuh yang berhasil selesai setelah percobaan awal terhenti karena batas penggunaan. Tinjauan membuka 24 gambar dan meminta satu perbaikan masukan desimal. `finish-verdict.md` menilai tepat perbaikan itu RESOLVED, membuka `decimal-entry-390.png` dan seluruh 13 tangkapan yang diperbarui, serta mencatat sisa CLEAR dan SHIP untuk perbaikan yang dinilai. Putusan ini bukan tinjauan penuh baru atau sertifikasi produksi.

Bukti memakai Chrome/Puppeteer, masukan sintetis dan viewport emulasi. Perangkat fisik, pembaca layar, seluruh browser target, kondisi jaringan nyata, konkurensi dan persistensi backend belum diuji. Cakupan workflow, peran, persyaratan integrasi dan batasnya dipetakan pada `docs/coverage/bouquet-production-coverage.md`.
