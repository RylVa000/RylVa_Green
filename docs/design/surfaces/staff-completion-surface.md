# Penyelesaian permukaan staf

Mode **Operate**. Ini perluasan dunia visual incumbent, bukan penggantian desain. DESIGN.md, Poppins lokal, krem/hijau botani serta arah Framed sheet yang sudah dipakai pada review SuperAdmin dipertahankan. Tidak ada redraw, foto, ilustrasi atau data produksi baru.

## Pertanyaan utama

Koreksi: catatan status akhir mana yang salah, apa usulan yang benar, dan siapa yang boleh menyetujuinya? Gangguan: apa yang terjadi dan bagaimana melanjutkan dengan aman tanpa mengulang transaksi yang belum pasti hasilnya?

## Kontrak arah

- **Thesis:** catatan asli tetap terbaca; koreksi merupakan catatan baru yang tertaut, dengan pengaju dan penyetuju berbeda. Pembayaran, pengiriman dan stok tidak berubah otomatis.
- **Own-world:** gunakan shell, badge, banner, definition list, tab, tabel, pagination, form dan dialog bersama. Mobile memakai banner utuh dan tombol ringkas; tidak ada kartu mengambang atau tabel terpotong.
- **Story:** detail pesanan terminal → sumber/riwayat asli → usulan koreksi → tinjauan dampak → keputusan kedua → catatan koreksi lokal yang terhubung kembali ke sumber.
- **Signature:** status asli, status usulan dan hasil keputusan terlihat bersama; riwayat lama tidak ditimpa. Keputusan mengubah contoh catatan koreksi saja, bukan memanggil transisi transaksi nyata.
- **States:** usulan kosong/valid/tidak sah, duplikat aktif, pengaju sendiri, revisi berubah, disetujui/ditolak, simpan gagal, keluar dengan form kotor dan sumber hilang. Error 500/429 memiliki kode, dampak dan tindakan pemulihan; tanpa waktu tunggu rekaan.
- **Boundary:** frontend lokal; prototipe pengelolaan koreksi berbagi sessionStorage dengan halaman review. Detail pesanan menampilkan catatan terpisah; snapshot dan workflow pesanan lama tidak ditulis ulang. Kode MFA dan identitas kedua tetap contoh.

## Berkas

Perluas `staff-status.html`, `staff-status.js`, `staff-support.js`, tiga berkas `superadmin-review` dan stylesheet review. Hubungkan `orders-queue.html` / `order-workflows.js` melalui helper `order-corrections.js`. Dokumentasi dan pengujian mencatat batas state, integrasi serta cakupan UI.

## Material

Objek: pesanan, snapshot status, referensi riwayat, usulan, pelaku dan keputusan. Sumber nyata: spesifikasi 8.9, status/kewenangan proyek dan komponen incumbent. Data tampil: fixture sintetis yang jelas ditandai contoh, ditambah snapshot lokal dari pesanan yang sedang dibuka. Tidak ada hasil server, bukti gateway, nomor tiket, waktu tunggu atau klaim audit produksi yang direka.
