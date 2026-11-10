# Cakupan pratinjau Laporan Operasional

`public/pages/staff/operational-report.html` adalah prototipe UI untuk Admin dan SuperAdmin. Data pada `operational-report-data.js` bersifat sintetis, berdiri sendiri, dan tidak tersinkron dengan modul lainnya. Snapshot contoh bertanggal 5 November 2026; tanggal preset dihitung relatif terhadap snapshot tersebut agar pratinjau tetap dapat dicoba. Profil peran pada URL adalah pilihan tampilan, bukan otorisasi.

## Isi dan definisi

- **Ringkasan:** penanda kondisi saat snapshot untuk pesanan yang memerlukan penanganan, pengiriman terkendala, stok produk, dan bahan. Angka periode dan kondisi snapshot diberi label terpisah.
- **Pesanan:** ringkasan jadwal per tanggal kirim serta tabel status terkini. Pengguna dapat memilih dasar tanggal dibuat atau tanggal kirim. Ringkasan jadwal selalu berdasarkan tanggal kirim dan mengecualikan pesanan dibatalkan.
- **Produk terlaris:** jumlah per SKU dari pesanan yang dibuat dalam periode, kecuali pesanan dibatalkan. Ini definisi contoh yang masih perlu disepakati; satuan berbeda tidak dianggap setara. Belum ada pendapatan atau angka keuangan.
- **Stok & bahan:** kedua jenis persediaan dipisah; saldo tersedia dihitung dari saldo tercatat dikurangi reservasi atau alokasi. Ambang minimum pada fixture adalah contoh per baris, bukan penerapan parameter P-22. Riwayat mutasi adalah contoh terpisah dan belum membuktikan saldo atau buku besar nyata.
- **Pengiriman:** berdasarkan tanggal kirim dalam periode, tidak termasuk pesanan dibatalkan, dengan status terkini pada snapshot. Status pengiriman dipisahkan dari status pesanan.

Filter pencarian, status/kategori, lokasi, urutan dan periode langsung memperbarui data contoh; tombol reset mengembalikan pilihan awal. Rentang tanggal tidak valid mempertahankan periode sebelumnya dan menampilkan pesan. Pagination tersedia pada daftar. Tautan penanda perhatian membuka modul dengan filter yang relevan, tetapi karena fixture modul tidak tersinkron, hasil di modul tujuan tidak dijanjikan sama dengan angka laporan. Tautan baris membuka modul terkait, bukan detail objek yang sama. Loading, kosong, gagal dan coba lagi tersedia melalui pilihan pratinjau; fitur ekspor belum tersedia.

## Integrasi sebelum penggunaan nyata

Sumber pesanan, pengiriman, persediaan, reservasi, alokasi, dan buku besar harus dihubungkan ke server dengan definisi metrik serta waktu yang konsisten. Aturan agregasi P-22 per produk/varian/lokasi dan definisi produk terlaris perlu diputuskan sebelum dijadikan hasil produksi. Ekspor harus memakai data dan filter yang sama, membatasi data pribadi sesuai peran, serta mencatat ekspor data pribadi sesuai spesifikasi. Penghitungan dan otorisasi wajib ditegakkan di server; grafik dan data pada pratinjau bukan bukti laporan produksi.
