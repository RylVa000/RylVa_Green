# Halaman error publik

19 November 2026. Jenis bisnis **place**, toko tanaman/florist. Mode **Operate — pemulihan**. Empat halaman publik: 404, 403, 500 dan maintenance/503. Tidak mengganti halaman kondisi staf atau otorisasi produksi.

## Keputusan dan sumber

PRODUCT.md, DESIGN.md dan komponen storefront tetap menjadi dasar Poppins, warna antarmuka, tombol, header/footer serta hak akses tujuan. Pengguna memberikan empat gambar dan menetapkan: gambar 1 untuk 404, gambar 2 maintenance, gambar 3 untuk 500, gambar 4 akses ditolak. Instruksi lanjutan pada 404: hilangkan angka dan tempatkan pot/tanaman di tengah bidang ilustrasi. Hanya 404 diedit memakai image_gen; tiga gambar lain mempertahankan isi dan komposisi sumber. Aset generasi awal asisten telah digantikan pilihan pengguna dan tidak dikirim.

## Direction contract

**THESIS:** Pengunjung memahami kondisi halaman dan bisa memilih langkah pemulihan yang aman dalam beberapa detik. Ilustrasi botanical mendukung penjelasan, bukan menggantikan teks atau menyembunyikan tindakan.

**OWN-WORLD:** Header/footer, Poppins, tombol hijau/pill dan fokus dari proyek. Bidang utama putih menyatu dengan latar ilustrasi pengguna; sage, terracotta, cream dan charcoal di dalam gambar dipertahankan. Tidak mengubah palet global atau memakai banner marketing tambahan.

**STORY:** Tampilkan satu ilustrasi sesuai kondisi, judul dan penjelasan, kode status sebagai teks antarmuka, lalu dua tindakan. 500 juga mengarahkan pemeriksaan Pesanan Saya sebelum mengulang transaksi. Tidak membuat jaminan waktu pemulihan.

**FIRST VIEWPORT:** Desktop dua kolom terpusat dalam container: ilustrasi kiri, penjelasan serta tindakan kanan. Gambar utuh dalam bingkai 4:3 dengan object-fit contain. Tablet/ponsel menumpuk ilustrasi lalu teks dan tindakan; tombol ponsel selebar konten. Tidak ada kode/teks yang dibakar ke gambar 404.

**FORM:** Ekstensi keluarga kondisi storefront dengan visual yang ditentukan, `seed: none (pinned)`. Pengguna meminta “gambar 1 404 ... cuma sisa ilustrasi, gambar 2 maintenance, gambar 3 500, gambar 4 akses denied”, “pot tanaman di tengah dalam bentuk”, serta “disertai button dan penjelasan pendukung”. Tidak perlu memilih dunia visual baru.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

DESIGN.md dipertahankan. Sumber, hash dan prompt edit dicatat pada metadata aset dan `docs/design/assets/public-error-illustrations.json`. Tidak mengubah file Downloads asli.

## Copy dan tindakan

| Kondisi | Judul | Penjelasan | Tindakan native |
| --- | --- | --- | --- |
| 404 | Halaman tidak ditemukan | Halaman yang Anda cari mungkin sudah dipindahkan atau alamatnya tidak tepat. Temukan pilihan Anda kembali melalui Katalog. | Jelajahi Katalog; Kembali ke Beranda |
| 403 | Akses tidak diizinkan | Anda tidak memiliki izin untuk membuka halaman ini. Kembali ke Beranda atau hubungi kami jika Anda memerlukan bantuan. | Kembali ke Beranda; Hubungi Kami |
| 500 | Terjadi gangguan sementara | Halaman belum dapat ditampilkan. Anda dapat mencoba membuka Beranda atau menghubungi kami jika kendala berlanjut. | Buka Beranda; Hubungi Kami |
| 503 | Kami sedang merawat situs | Situs sedang dalam pemeliharaan. Silakan periksa kembali nanti. Untuk pertanyaan mengenai pesanan, Anda tetap dapat menghubungi kami. | Periksa Beranda; Hubungi Kami |

500 menambahkan: “Jika gangguan muncul setelah membuat pesanan atau membayar, periksa Pesanan Saya sebelum mengulang tindakan.” Tautan menuju daftar pesanan yang memakai guard existing. Tidak memakai reload yang dapat memicu pengiriman ulang POST.

## State, keamanan dan integrasi

Empat HTML mandiri tetap menampilkan gambar, isi dan tindakan tanpa JavaScript. CSS dan aset menggunakan path absolut agar halaman fallback pada URL dalam tetap berfungsi. Script bersama hanya menangani koneksi, kegagalan gambar dan konteks kembali yang aman; tidak memanggil API atau menulis transaksi.

| State | Tampilan | Pemulihan / konteks |
| --- | --- | --- |
| Default 4 kondisi | Gambar, judul, penjelasan dan kode yang tepat | Dua tautan eksplisit tersedia |
| Hover/focus/active | Pola tombol/fokus proyek | Keyboard dan reduced motion; tidak bergantung hover |
| Tanpa script | Tautan native dan gambar tetap tampil | Tujuan fallback tetap Beranda/Katalog/Kontak |
| Offline | Pesan koneksi terputus | Sambungkan kembali, lalu pilih tautan; tidak auto-retry |
| Online kembali | Pesan koneksi tersedia | Pengunjung memilih membuka halaman sendiri |
| Gambar gagal | Fallback botanical logo existing | Penjelasan serta tindakan tetap lengkap |
| Konteks Katalog | returnTo tervalidasi, hanya route Katalog same-origin | Pertahankan hanya query filter/pencarian yang diizinkan; navigasi GET |
| Target tidak aman | Query eksternal, kredensial, URL staf/Checkout ditolak | Gunakan tautan default tanpa menampilkan query mentah |
| Konten panjang | Membungkus pada 320 px | Tidak clipping/menutupi tindakan |

403 tidak menganggap login otomatis mengatasi penolakan. Tidak menampilkan nama file internal, stack trace, akun lain, countdown/ETA atau status “pulih” buatan. Query tidak menetapkan kewenangan. Halaman tidak mempunyai formulir atau draft baru.

Server preview memetakan halaman kanonis ke HTTP 403/404/500/503 dan dokumen publik tidak ditemukan ke UI 404, tanpa mengubah URL asal atau mengubah status menjadi 200. Aset hilang tetap respons resource biasa; area staf mempertahankan fallback sebelumnya. HEAD tidak mengirim body. Tidak mengaktifkan maintenance global atau mengklaim middleware PHP telah terpasang; front controller/backend produksi masih scaffold dan memerlukan binding handler terpisah.

Workbench dev `/__preview/public-errors` menyediakan pilihan kondisi, lima ukuran, gambar gagal, offline, teks panjang dan konteks kembali. Kontrol tidak masuk alur produksi. Uji semua kondisi pada 1440/1024/768/390/320, status HTTP/HEAD, path dalam, keyboard, tautan, gambar/fallback, koneksi, query aman/tidak aman dan tanpa JavaScript. Pertahankan seluruh pekerjaan pengguna sebelumnya. Tidak commit/push/deploy.
