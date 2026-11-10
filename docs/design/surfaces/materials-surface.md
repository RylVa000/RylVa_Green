# Bahan Produksi

Mode: Operate. Target `public/pages/staff/production-materials.html`. Ekstensi HTML, CSS, dan Vanilla JavaScript pada dunia visual admin yang sudah disetujui. Tidak mengganti sidebar atau sistem global. Semua transaksi adalah simulasi memori tab dengan data ilustrasi bertanggal 4 November 2026.

## Direction contract

THESIS: Bahan yang bisa dipakai dibedakan dari saldo fisik, alokasi produksi, dan batch yang melewati batas pakai. Daftar bahan menjadi bidang terbesar; setiap penanda perhatian membuka bahan atau filter terkait.

OWN-WORLD: Poppins lokal, kanvas krem, sidebar sage, permukaan datar, radius kontrol 8 px dan sheet 12 px mengikuti Produk & Varian. Warna semantik yang telah disetujui memakai ikon dan label, bukan warna saja. Tidak ada aset foto atau grafik dekoratif baru.

STORY: Admin memindai bahan habis, menipis, dan batch yang perlu ditangani; mencari nama/kode; melihat saldo dan batch; menerima bahan, mengalokasikan, mencatat pemakaian, kerusakan, transfer, atau penyesuaian. SuperAdmin meninjau pengajuan besar. Riwayat tidak dapat diedit atau dihapus.

FIRST VIEWPORT: Judul, lokasi, Catat barang masuk dan Tambah bahan; tab Daftar bahan/Mutasi/Pemakaian/Persetujuan; ringkasan hitungan jenis bahan dan penanda mendesak; tabel enam kolom yang memisahkan saldo, alokasi, tersedia, dan kondisi. Pada ponsel baris menjadi nilai berlabel tanpa menghilangkan tindakan.

FORM: Sistem incumbent framed sheet, Taste seed 1683893219 diwarisi. Komposisi telah ditetapkan bersama pengguna, sehingga tidak ada pemilihan tema atau konsep baru. Form penuh memakai breadcrumb nyata, bagian sticky, isian bersatuan, pencarian pilihan panjang, validasi langsung, dan guard perubahan belum disimpan.

FINISH: Pemeriksaan alur dan responsif, satu detector, screenshot yang dibuka, tinjauan independen, dan dokumentasi hasil nyata sebelum penyerahan. Hasil browser tidak menyatakan backend selesai.

## Kontrak perilaku

- Persediaan bahan terpisah dari SKU barang dagangan. Saldo dihitung dari mutasi; alokasi aktif dan batch melewati batas pakai tidak dihitung sebagai bahan bebas digunakan. Satuan tidak dijumlahkan lintas jenis.
- Batang, lembar, balok, pcs, dan rol adalah bilangan bulat. Meter mendukung dua desimal. Perhitungan disimpan sebagai satuan terkecil integer untuk mencegah selisih floating point.
- Penerimaan positif, pengurangan berupa besaran positif, penyesuaian dapat bertanda. Batas input mengikuti bahan, batch, alokasi, dan ketelitian satuan. Stok 0 memblokir pengurangan; preview tidak menghitung saldo negatif.
- Konversi penerimaan hanya menggunakan kemasan dan faktor yang dikonfigurasi untuk bahan itu; ringkasan selalu menunjukkan jumlah dalam satuan dasar. Satuan dengan riwayat dikunci.
- Pemakaian mengacu alokasi produksi lokal. Pemakaian parsial mengurangi sisa alokasi, pelepasan membebaskan sisa, dan pencatatan berulang tidak boleh melebihi sisa. Titik komit prototipe adalah konfirmasi Catat pemakaian; belum ada sinkronisasi dengan pesanan, resep, atau layanan stok lain.
- Penyesuaian Admin lebih dari 20 satuan dasar menjadi pengajuan tanpa mengubah saldo. Keputusan SuperAdmin memvalidasi ulang saldo dan batch; satu pengajuan tidak diterapkan dua kali, dan pengaju tidak menyetujui sendiri.
- Bahan bersejarah dinonaktifkan tanpa menghapus riwayat. Hapus permanen hanya SuperAdmin untuk bahan tanpa referensi. Batch melewati batas pakai diblokir untuk alokasi, pemakaian, dan transfer, tetapi dapat ditangani lewat pencatatan rusak/penyesuaian yang sah.
- State URL menyimpan lokasi, peran pratinjau, ruang kerja, pencarian, filter, halaman, bahan, dan tab. Loading/error/empty, validasi, konfirmasi, saving, sukses dan gagal simpan memiliki jalur pemulihan.

## Quality bar

Pertahankan kepadatan layar kerja yang sudah disetujui; kontrol minimal 44 px, jarak kelompok 16/24 px, status berlabel, angka tabular, dan tombol Buka memiliki kolom sendiri. Pilihan panjang harus bisa dicari tanpa menggulir, popup tidak terpotong, navigasi sticky tidak menutupi isian, dan tabel tetap terbaca pada tablet serta ponsel.

## Implementasi tercatat — 4 November 2026

- Sumber utama: `public/pages/staff/production-materials.html`, `public/assets/js/staff/inventory/materials-data.js`, `materials.js`, `materials-forms.js`, `admin-shell.js`, dan `public/assets/css/staff/inventory/materials.css`. Modul memakai kembali shell, token, sheet, workflow, serta kontrol pencarian Produk & Varian/Antrean Pesanan.
- Fixture berisi 10 jenis bahan, 9 aktif, 2 lokasi, 3 referensi pekerjaan produksi, 4 alokasi, dan 1 pengajuan awal menunggu. Nama bahan, lot, pekerjaan, dan referensi bersifat sintetis. Hitungan kondisi serta saldo berasal dari buku besar dan alokasi lokal.
- Daftar, rincian Info/Batch/Pemakaian/Aktivitas, editor penuh, mutasi, alokasi, pemakaian parsial, pelepasan, dan keputusan pengajuan tersedia. Bahan baru dimulai dengan saldo 0; formulir informasi tidak mengubah saldo.
- Jenis bahan membatasi satuan dan kemasan. Contoh konversi penerimaan 2 ikat = 20 batang ditampilkan sebelum simpan; satuan dasar, pelacakan batch, dan konversi dengan referensi dikunci. Ambang minimum per bahan merupakan pengaturan prototipe lokal, bukan perubahan Register Parameter global.
- Tabel desktop meratakan angka ke kanan. Di bawah 1100 px, baris menjadi kelompok berlabel dan rata kiri, termasuk angka bersarang serta tindakan. Label Batas pakai tetap tampil, badge membungkus antarkata, dan kelompok riwayat pemakaian berjarak 24 px.
- Poppins lokal, krem/sage, permukaan datar, kontrol 44 px, radius 8/12 px, dan sidebar incumbent dipertahankan. Tidak ada raster baru; inventaris aset yang sudah ada mencatat 4 raster dan 0 aset hilang. `PRODUCT.md`, `DESIGN.md`, dan sidecar desain global tidak diubah.

## Bukti dan status tinjauan

| Bukti | Hasil dan cakupan |
| --- | --- |
| `.impeccable/review/materials/verification.json` | 13 kelompok alur lulus, 0 kesalahan browser; pemeriksaan responsif pada 320/390/640/768/1024/1280/1440/1920 px. |
| `.impeccable/review/materials/edge-verification.json` | 4 kelompok tambahan lulus, 0 kesalahan browser: penyesuaian bertanda, saldo terbaru/persetujuan sendiri, klik lalu ketik tanpa Ctrl+A dan popup, serta tautan SuperAdmin. |
| `.impeccable/review/materials/captures.json` | 20 kombinasi dari 5 tampilan × 4 lebar (390/768/1440/1920 px), dengan tangkapan viewport dan penuh; 0 overflow dan 0 kesalahan browser. |
| `.impeccable/review/materials/fix-verification.json` | Delapan lebar 320/390/768/1024/1100/1280/1440/1920 px: label tanggal, kata badge utuh dan tetap di sel, perataan responsif/desktop, serta halaman muat; 0 kesalahan browser. Jarak riwayat 24 px pada kedua konteks juga diperiksa. |
| `.taste-skill/materials/final/report.json` | Taste 0 FAIL / 0 WARN; kritik build 8,1. Pemeriksaan sintaks JavaScript terkini lulus. |
| `.impeccable/review/materials/detector.json` | Detector dijalankan sekali: 3 advisori warna incumbent, 0 temuan primer. |

Hallmark statis tetap **1 FAIL / 0 WARN / 4 ANSWERED (F7)**. Gate 56 membaca sidebar dan navigasi editor sticky `top: 0` pada CSS produk bersama. Navigasi form bahan memakai offset 4 px; sidebar berada di kolom terpisah atau di luar kanvas. Reviewer tidak melihat benturan. Temuan tetap dicatat; pemeriksa dan waiver tidak diubah, dan advisori incumbent tidak dijadikan aturan desain baru.

Tinjauan penuh segar pada `.impeccable/review/materials/finish-review.md` membuka 65 gambar dan meminta empat perbaikan: label Batas pakai, kata badge utuh, perataan baris responsif, serta jarak kelompok pemakaian. Keempatnya diperbaiki dalam satu batch. `.impeccable/review/materials/finish-verdict.md` membuka ulang seluruh 40 tangkapan utama dan pasangan pemakaian selesai, menilai **empat perbaikan yang dinilai RESOLVED**, sisa **CLEAR**, tanpa regresi terlihat; disposisi **SHIP mencakup perbaikan yang dinilai**. Putusan ini bukan tinjauan penuh baru atau sertifikasi produksi.

## Batas implementasi

Semua perubahan berada di memori tab dan hilang saat refresh. Pilihan peran/aktor adalah demonstrasi UI; belum ada autentikasi, otorisasi server, database/API, audit tahan lama, atau sinkronisasi stok dengan produk maupun pesanan. Semua angka memakai snapshot 4 November 2026. Pengujian memakai Chrome/Puppeteer, masukan mouse/keyboard sintetis, dan lebar layar emulasi; perangkat fisik serta pembaca layar belum diuji.

Tiga pekerjaan produksi hanya referensi fixture. Modul resep/BOM, perencana produksi, dan alur produksi florist lengkap belum dibuat atau diintegrasikan. Konfirmasi **Catat pemakaian** merupakan titik komit prototipe lokal, bukan pemotongan stok dari pesanan nyata. UI tidak menampilkan nilai finansial bahan. Matriks alur dan kebutuhan integrasi tercatat pada `docs/coverage/materials-coverage.md`.
