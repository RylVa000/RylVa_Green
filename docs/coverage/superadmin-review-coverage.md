# Rekonsiliasi pembayaran dan persetujuan sensitif

Dua halaman frontend melengkapi ruang kerja SuperAdmin:

- `public/pages/superadmin/payment-reconciliation.html`: antrean dan rincian kasus rekonsiliasi pembayaran.
- `public/pages/superadmin/sensitive-approvals.html`: antrean persetujuan refund, koreksi stok produk, koreksi bahan produksi dan bukti pembayaran manual.
- Tambahan 10 November: sumber dan pengajuan koreksi status akhir, tersambung ke panel catatan terpisah di detail pesanan. Rincian ada di `docs/coverage/staff-ui-completion.md`; ini tidak menjalankan ulang workflow atau transaksi pesanan.

Keduanya memakai shell, tipografi, tombol, badge, tab, catalog-stat, tabel responsif, pagination dan dialog yang sudah tersedia. Menu ditambahkan melalui `admin-settings-nav.js`; laporan keuangan dan notifikasi memiliki tautan menuju rekonsiliasi. Parameter `role` hanya memilih pratinjau, bukan autentikasi atau otorisasi server.

## Daftar dan navigasi

Ringkasan dihitung dari data contoh sebelum filter daftar. Pencarian, kondisi, jenis pengajuan dan urutan langsung memperbarui hasil; hanya ada tombol Reset filter. Pagination berisi lima baris. Pencarian/filter/halaman/detail/tab dan pelaku contoh disimpan di URL, sehingga kembali dari detail mempertahankan konteks daftar.

Detail yang dibuka dari daftar selalu dimulai di atas dengan tab Ringkasan. Tab Perbandingan atau Dampak, Bukti dan Aktivitas memakai seluruh lebar konten. Mobile menggunakan baris berlabel, banner utuh, kartu ringkasan sama tinggi serta tombol detail kecil di kanan bawah. Tidak ada tabel yang dipaksa bergulir horizontal.

Menu dua halaman hanya tersedia pada pratinjau SuperAdmin. Pratinjau Admin, termasuk tautan detail langsung, menampilkan akses ditolak tanpa statistik atau data tabel. Pelaku SuperAdmin Kedua merupakan identitas sintetis untuk mencoba pemisahan pengaju dan penyetuju, bukan akun yang dibuat pada server.

## Rekonsiliasi pembayaran

Fixture memuat enam kasus: webhook belum tercatat, API tidak tersedia, nominal berbeda, usulan manual aktif, transaksi menunggu dan pemeriksaan selesai. Nominal, referensi gateway dan hasil pemeriksaan adalah data contoh, bukan transaksi yang diverifikasi.

1. Staf membuka Ringkasan, lalu membandingkan pesanan, nominal, mata uang dan status pada tab Perbandingan.
2. Periksa gateway meminta referensi yang sesuai, alasan dan autentikasi ulang contoh. Pemeriksaan tidak memanggil API.
3. Hanya contoh dengan seluruh bidang cocok dan status gateway berhasil yang menyelesaikan kasus lokal. Selisih nominal atau status menunggu tetap perlu ditinjau dan tidak membuka jalan pintas manual.
4. Setelah contoh API tidak tersedia, Ajukan bukti manual dibuka. Pengajuan membutuhkan alasan dan 1–5 berkas JPG, PNG atau WebP, berukuran lebih dari nol dan maksimum 5 MB per berkas.
5. Pengajuan membuat permintaan terkait pada halaman Persetujuan Sensitif. Kasus menjadi Menunggu keputusan; pembayaran belum dinyatakan berhasil.
6. Pengaju tidak dapat memutuskan permintaannya sendiri. SuperAdmin berbeda memeriksa bukti dan dampak sebelum menyetujui atau menolak. Persetujuan menyelesaikan kasus lokal; penolakan mengembalikannya untuk ditinjau.

Nama, ukuran dan jenis berkas disimpan sebagai metadata saja. Isi berkas tidak dibaca, diunggah atau disimpan. Lampiran awal hanya nama contoh dan tidak mempunyai berkas transaksi asli. Nama berkas tidak dianggap bukti pembayaran terverifikasi.

## Persetujuan sensitif

Fixture awal memuat enam pengajuan, dua objek stok dan sisa hak refund contoh. Ringkasan membedakan seluruh permintaan aktif, yang memenuhi prasyarat bagi pelaku saat ini, pengajuan sendiri dan yang sudah diputuskan. Status pengajuan, pembayaran serta pelaksanaan tetap terpisah.

| Jenis | Prasyarat persetujuan | Hasil pada contoh |
| --- | --- | --- |
| Refund | Nominal bulat positif, tidak melebihi sisa hak dan pelaku berbeda dari pengaju | Hak contoh dialokasikan sekali; dana belum dicairkan |
| Stok produk | Revisi stok sama, perubahan bulat bukan nol, saldo akhir tidak kurang dari reservasi | Saldo contoh dua halaman diperbarui sekali |
| Bahan produksi | Revisi dan saldo bebas memenuhi pemeriksaan yang sama | Alokasi bahan tetap dilindungi |
| Rekonsiliasi manual | Kasus masih menunggu permintaan yang sama, revisi/nominal cocok, hasil API tidak tersedia dan ada metadata lampiran | Kasus serta status pembayaran lokal diperbarui |

Tombol yang tidak tersedia disertai alasan terlihat. Pengaju juga tidak dapat menolak pengajuannya sendiri. Pengajuan yang tidak memenuhi prasyarat penerapan masih dapat ditolak oleh pelaku berbeda tanpa mengubah saldo. Keputusan yang sudah selesai tidak dapat diterapkan ulang.

Tab Dampak stok menyimpan saldo sebelum dan sesudah keputusan, sehingga tampilan tidak menghitung koreksi dua kali. Tab Dampak refund tetap menyatakan persetujuan berbeda dari pencairan. Pengajuan stok menampilkan objek stok; pengajuan rekonsiliasi menampilkan pesanan yang sama dengan kasus terkait.

## Dialog dan pemulihan

Keputusan meminta alasan 5–500 karakter, kode MFA contoh `123456` serta konfirmasi pemahaman dampak simulasi. Kode ini bukan MFA, verifikasi identitas atau perlindungan produksi. Input autentikasi tidak ditulis ke riwayat atau penyimpanan.

Versi target dan prasyarat diperiksa lagi saat menyimpan. Simulasi konflik/simpan gagal mempertahankan isian, membuka kembali kesempatan memperbaiki form dan tidak mengubah data. Escape, tutup, Kembali browser dan keluar halaman melindungi form yang belum selesai. Header dan footer dialog terpisah dari isi yang bergulir, termasuk pada mobile.

Pratinjau menyediakan loading, kosong, gagal/coba lagi, data tidak ditemukan, hasil pencarian kosong dan reset data contoh. Reset mengembalikan kedua halaman review saja, melalui konfirmasi.

## Penyimpanan dan batas integrasi

Kedua halaman berbagi fixture melalui `sessionStorage` dengan kunci `rylva.superadminReview.demo.v2`. Perubahan bertahan saat refresh dan navigasi pada tab yang sama sampai data direset atau sesi tab berakhir. Tidak ada sinkronisasi lintas tab, pengguna, perangkat, modul pesanan/produk/bahan lama, database atau API.

Jika pembacaan penyimpanan tidak tersedia, halaman menyatakan perubahan hanya berada di memori. Jika penulisan gagal, keputusan tidak dianggap tersimpan dan form tetap terbuka. Riwayat lokal berisi alasan, pelaku contoh dan waktu browser; ini bukan audit server.

Halaman ini tidak melakukan pemeriksaan gateway nyata, pencairan refund, mutasi stok server, pengiriman pesan, pembuatan akun, MFA atau autentikasi. Controller/template PHP yang sebelumnya berupa kerangka tidak dinyatakan selesai oleh penambahan prototipe ini.

Produksi masih memerlukan endpoint rekonsiliasi dan keputusan, otorisasi server, autentikasi ulang, verifikasi bukti, validasi transaksi gateway, transaksi database dan kontrol konflik, idempotensi, penyimpanan lampiran dengan akses terbatas, audit server, serta pemisahan persetujuan dan pelaksanaan refund. Pemeriksaan klien pada prototipe merupakan demonstrasi alur.

Pemeriksaan layout, alur dan hasil penilaian tercatat dalam `storage/reports/hallmark/reports/superadmin-review-verification.md`. Browser memakai input sintetis dan viewport emulasi; perangkat fisik, pembaca layar dan layanan produksi belum diuji.
