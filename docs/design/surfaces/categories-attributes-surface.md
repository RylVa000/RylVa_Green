# Kategori & Atribut

Mode: **Operate**. Admin dan SuperAdmin mengelompokkan katalog, mengelola definisi informasi produk, dan memeriksa dampak perubahan sebelum bertindak.

Pertanyaan utama: definisi mana yang aktif, dipakai oleh apa, dan perubahan apa yang boleh dilakukan? Signature layar adalah pemakaian yang terlihat bersama status serta alasan penguncian. Data awal bersumber dari salinan fixture produk, bukan metrik rekaan atau data produksi.

Gunakan dunia visual RylVa Green yang sudah ada dalam DESIGN.md: Poppins lokal, krem, hijau botani, permukaan putih, garis tabel tenang, dan radius yang sama. Arah app dari Taste adalah Accent ladder, seed 637550350, dengan palet dan tipografi incumbent dipertahankan. Halaman tidak membutuhkan foto atau ilustrasi.

Komponen yang dipakai kembali: shell/sidebar, `catalog-stat`, `product-detail-tabs`, tombol dan badge antrean, serta tabel, filter dan pagination laporan. CSS khusus hanya melengkapi definisi, daftar pilihan, formulir dan dialog. Tambahan navigasi dikelola oleh `admin-settings-nav.js` agar tampil pada halaman staf lainnya.

Daftar memakai tab Kategori/Atribut; detail memakai Informasi/Pemakaian/Aktivitas. Detail memenuhi lebar konten dan membuka bagian atas. Status ditulis dengan ikon serta teks. Notifikasi menjadi banner lebar penuh. Tabel mobile menjadi baris berlabel dengan tombol detail kecil di kanan bawah; kartu ringkasan tetap sama tinggi.

Formulir memakai dialog native dengan header dan tombol pada baris terpisah dari isi yang bergulir. Kategori terkait merupakan bagian opsional yang bisa dibuka. Escape, tombol tutup, Kembali browser dan keluar halaman melindungi isian belum disimpan. Kembali browser saat dialog terbuka menutup atau meminta pembatalan edit terlebih dahulu, sebelum mengubah halaman di belakangnya.

Kondisi data tersedia, loading, kosong, gagal/coba lagi, hasil kosong, definisi tidak ditemukan dan simpan gagal dicakup. Aturan serta batas integrasi dirinci dalam `categories-attributes-coverage.md`.
