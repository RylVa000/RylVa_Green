# Cakupan Bahan Produksi

Target: `public/pages/staff/production-materials.html`. Prototipe HTML/CSS/Vanilla JavaScript ini memperluas admin incumbent; semua data dan transaksi hanya berada di memori tab. Snapshot sintetis 4 November 2026 memuat 10 jenis bahan (9 aktif), 2 lokasi, 3 referensi pekerjaan produksi, 4 alokasi, dan 1 pengajuan awal menunggu. Refresh mengembalikan fixture.

## Alur yang tersedia

| Alur | Perilaku prototipe | Kebutuhan integrasi produksi |
| --- | --- | --- |
| Daftar dan perhatian | Pencarian nama/kode, filter jenis/status/kondisi, urutan, halaman, serta penanda habis/menipis/batch bermasalah. Saldo fisik, alokasi, dan bebas digunakan terpisah; hitungan dihitung dari data lokal. | Daftar dan saldo terotorisasi per lokasi; waktu server untuk batas pakai. |
| Navigasi dan rincian | Lokasi, peran pratinjau, workspace, pencarian, filter, halaman, bahan, dan tab tersimpan di URL. Info, Batch, Pemakaian, dan Aktivitas memiliki jalur kembali serta pemulihan tautan tidak valid. | Rute dan referensi nyata; penyaringan data sebelum dikirim. |
| Tambah/edit bahan | Nama, kode unik tanpa membedakan kapital, jenis, satuan kontekstual, minimum, batch, penyimpanan, catatan, dan kemasan. Bahan baru bersaldo 0. | Penyimpanan master bahan, keunikan kode, dan audit perubahan di server. Minimum saat ini lokal per bahan, bukan editor Register Parameter global. |
| Satuan dan kemasan | Bunga/filler memakai batang; pembungkus lembar/rol; pita meter/rol; pilihan lain mengikuti jenis. Penerimaan mengonversi kemasan terkonfigurasi, misalnya 2 ikat = 20 batang. Riwayat/referensi mengunci satuan, batch, dan konversi. | Definisi satuan/konversi terversi; pelarangan konversi diam-diam dan perubahan historis di layanan. |
| Penerimaan | Jumlah positif, kemasan relevan, referensi/alasan, konfirmasi, dan ringkasan satuan dasar. Batch baru menyimpan tanggal terima/batas pakai; batch sama harus memakai batas pakai yang sama. | Bukti penerimaan nyata, transaksi atomik, dan audit tahan lama. |
| Penyesuaian dan rusak/buang | Penyesuaian bertanda; kerusakan berupa besaran positif. Batas langsung, preview, dan validasi ulang sebelum komit melindungi saldo bebas/alokasi; stok 0 memblokir pengurangan. | Kunci saldo terbaru dan validasi independen pada server. |
| Transfer | Pasangan mutasi keluar/masuk menjaga jumlah total, nomor batch, serta tanggal batch. Batas mengikuti stok bebas lokasi/batch asal. | Komit atomik dua lokasi, izin lokasi, dan pemulihan kegagalan. |
| Batas pakai | Batch lewat batas pakai dikeluarkan dari stok bebas; alokasi, pemakaian, dan transfer diblokir. Rusak/buang atau penyesuaian yang sah tetap dapat menangani saldo yang tidak dialokasikan. | Kebijakan tanggal dan penanganan yang ditegakkan menggunakan waktu server. |
| Alokasi produksi | Menyimpan alokasi ke referensi pekerjaan fixture tanpa memotong saldo fisik. Pelepasan memerlukan alasan, mengurangi sisa alokasi, dan membebaskan stok tanpa mutasi fisik. | Pekerjaan/rencana produksi nyata, penguncian reservasi, dan sinkronisasi lintas pengguna. |
| Pemakaian parsial | Konfirmasi Catat pemakaian mengurangi saldo fisik dan sisa alokasi sekali. Jumlah dibatasi sisa terbaru; alokasi selesai tidak dapat dipakai ulang. | Titik komit produksi yang disepakati, transaksi atomik/idempotensi, dan hubungan pesanan nyata. |
| Persetujuan | Penyesuaian Admin dengan nilai absolut lebih dari 20 satuan dasar membuat pengajuan tanpa perubahan stok. SuperAdmin berbeda memeriksa status menunggu dan saldo/batch terbaru; setujui diterapkan sekali, tolak tidak mengubah stok. | Identitas/izin terautentikasi, pemisahan pengaju/penyetuju, dan keputusan atomik di server. |
| Nonaktif/hapus | Penonaktifan mempertahankan riwayat dan diblokir saat ada alokasi aktif. Hapus permanen khusus SuperAdmin untuk bahan tanpa referensi buku besar, alokasi, atau pengajuan. | Pemeriksaan seluruh referensi dan kebijakan retensi di server. |
| Pemulihan form/data | Loading, kosong, gagal muat/coba lagi, validasi langsung, konfirmasi, saving, sukses, gagal simpan dengan isian terjaga, serta guard perubahan belum disimpan. Pilihan panjang mendukung pencarian dan keyboard. | Kegagalan jaringan nyata, konflik lintas sesi, dan persistensi draf bila diperlukan. |

Meter disimpan sebagai integer per 0,01 meter; batang, lembar, balok, pcs, dan rol memakai integer utuh. Satuan berlainan tidak dijumlahkan. Semua guard browser adalah demonstrasi; backend harus memvalidasi ulang masukan dan saldo secara mandiri.

## Peran dan tautan

Admin dan SuperAdmin dapat mengelola informasi bahan, menerima, mengalokasikan, memakai, melepas, serta mencatat mutasi sesuai guard lokal. Keputusan pengajuan besar dan hapus permanen dibatasi pada pratinjau SuperAdmin. Pilihan profil serta parameter `role` bukan autentikasi atau kontrol akses produksi.

Menu Bahan Produksi dari Produk & Varian, Antrean Pesanan, Operasional, dan Laporan Keuangan membuka modul serta mempertahankan varian peran. Tautan bersama produk/antrean memakai `data-role-link`; dashboard memperbarui tautan pada varian SuperAdmin, sedangkan laporan memakai tautan SuperAdmin langsung. Pembagian menu keuangan, Audit Log penuh, dan Pengaturan Sistem tetap incumbent. Tidak ada nilai finansial bahan pada modul ini.

## Bukti dan batas verifikasi

- `.impeccable/review/materials/verification.json`: 13 kelompok alur lulus, 0 kesalahan browser; responsif pada 320/390/640/768/1024/1280/1440/1920 px.
- `edge-verification.json`: 4 kelompok tambahan lulus, 0 kesalahan browser; mencakup batas penyesuaian bertanda, penolakan persetujuan sendiri/saldo usang, klik lalu ketik tanpa Ctrl+A, popup, dan tautan SuperAdmin.
- `captures.json`: 20 kombinasi tampilan/lebar (daftar, batch, editor, penerimaan, pemakaian × 390/768/1440/1920 px), masing-masing tangkapan viewport/penuh, 0 overflow dan 0 kesalahan browser.
- `fix-verification.json`: 8 lebar 320/390/768/1024/1100/1280/1440/1920 px lulus untuk kata badge utuh, badge tetap di sel, label Batas pakai, perataan kiri responsif/kanan desktop; jarak riwayat minimal 24 px diperiksa pada workspace dan rincian bahan.
- Taste final: 0 FAIL / 0 WARN; kritik build 8,1. Sintaks JavaScript terkini lulus. Detector sekali: 3 advisori palet incumbent, 0 temuan primer. Hallmark statis tetap 1 FAIL / 0 WARN / 4 ANSWERED (F7); gate 56 pada CSS bersama tidak menunjukkan benturan pada tinjauan visual, dan pemeriksa/waiver tidak diubah.
- Tinjauan penuh segar membuka 65 gambar dan meminta 4 perbaikan. Putusan lanjutan membuka ulang 40 tangkapan utama beserta pasangan pemakaian selesai: keempat perbaikan yang dinilai RESOLVED, sisa CLEAR, disposisi SHIP untuk perbaikan yang dinilai; bukan tinjauan penuh baru atau sertifikasi produksi. Lihat `finish-review.md` dan `finish-verdict.md` pada folder bukti yang sama.

Seluruh bukti browser memakai Chrome/Puppeteer, masukan sintetis, dan viewport emulasi. Perangkat fisik serta pembaca layar belum diuji. Tidak ada database, API, autentikasi, audit tahan lama, atau sinkronisasi produk/pesanan. Resep/BOM, perencana produksi, dan modul produksi florist nyata belum dibuat/diintegrasikan; tiga pekerjaan hanyalah referensi fixture. Cakupan ini tidak menyatakan seluruh produksi florist selesai. Kontrak visual dan rincian bukti berada pada `docs/design/surfaces/materials-surface.md`.
