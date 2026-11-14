# Review revisi pelanggan — 13 November 2026

Revisi berdasarkan bukti penolakan pengguna: aktivitas login, kartu/form alamat,
detail wilayah, pelacakan, posisi harga, warna status, dropdown dan shell ringkas.
Mode Operate, code-led refinement. Tidak ada comp baru atau perubahan tema global.
Instruksi ukuran shell terbaru mengesampingkan pin ukuran persis Figma awal.

## Bukti dan batas

Capture akhir: `storage/reports/customer-refinements/`, 36 PNG pada desktop
1440 px, tablet 1024/768 px, dan ponsel 390/320 px. Ada bukti pertama halaman,
daftar sesi, footer, bagian atas/bawah form, peta dengan tile nyata, hasil lokasi
lengkap/parsial, fallback manual, dropdown dan timeline. Pengujian menggunakan
Chrome headless dengan emulasi viewport; tidak mencakup perangkat fisik/Safari.

Peninjau Impeccable fresh menerima sembilan gambar pengguna, kontrak revisi,
PRODUCT.md, DESIGN.md, craft floor, source target, laporan pengujian dan seluruh
36 capture. Capture lama yang ditolak tidak dianggap sebagai acuan persetujuan.
Peninjau tidak menjalankan browser atau detector sendiri. Seluruh 36 capture
dan sembilan gambar pengguna dibuka; PRODUCT.md, kontrak, coverage, craft floor
dan verification.json dibaca. DESIGN.md serta HTML/CSS/JS disampel. Sumber lain
dan backend tidak diaudit.

## Review awal — disposition: fix

### persistence

Pass. Konteks, dunia incumbent dan kontrak tersedia. Refinement code-led ini
tidak memerlukan approved comp baru. Seed none/pinned didukung arahan pengguna.
Seluruh capture valid; tidak perlu recapture karena bukti cacat.

### fidelity

| Elemen | Penilaian peninjau |
| --- | --- |
| Type/material/ground | Match: Poppins, ikon, peta nyata dan dunia krem/sage/hijau. Bukan pengukuran persamaan RGB. |
| Aktivitas Login | Adaptation: perangkat/IP/waktu/perangkat aktif dan aksi sesi mengikuti referensi; tombol nyata dan aktivitas di atas pada layar kecil sesuai kebutuhan. |
| Kartu alamat | Match: badge solid, penerima/telepon, wilayah, PinPoint dan divider tindakan mengikuti Figma. |
| Form/wilayah | Adaptation: urutan field, disclosure, autofill lengkap dan fallback parsial/gagal didukung capture. Ringkasan lokasi tetap sesuai data yang tersedia. |
| Ringkasan lokasi 320 px | Contradicted pada review awal: sekitar 250 px tinggi akibat teks terdesak tombol; sifat strip ringkas Figma belum tercapai. |
| Kartu pesanan | Adaptation: harga dipusatkan di desktop, stack ponsel, warna status dan dropdown terlihat. |
| Pelacakan | Match: dua kolom desktop, salin/resi sejajar, timestamp–titik–peristiwa terpisah; stack ponsel sesuai ruang. |
| Navbar/footer | Adaptation: dipadatkan dan footer dapat ditutup sesuai instruksi yang menggantikan ukuran lama. |

### ceiling

Belum tercapai pada ringkasan lokasi 320 px. Di luar itu, divider, tipografi,
status, tombol dan disclosure cukup untuk mode Operate; dekorasi/motion baru
tidak diperlukan. Batas kontras/spacing shell tetap tercatat, bukan klaim AA.

### material_fixes

1. Padatkan `.account-location-summary` pada ponsel. Teks perlu lebar yang cukup
   dan alamat/wilayah hanya sebagai preview ringkas; pertahankan Ubah, alamat
   lengkap, target sentuh, serta akses Simpan. Ambil ulang form atas/bawah
   pada 320 dan 390 px.

### keep

Pertahankan Poppins, palet/aset, kartu alamat Figma, tombol sesi, dropdown,
timeline, wilayah tersembunyi yang tetap divalidasi, fallback dan label contoh.

## Perbaikan dan verdict pass — disposition: ship

Pada <=600 px, kolom teks dapat menyusut tanpa mendesak tombol; label menjadi
Lokasi Pengiriman. Street preview dibatasi dua baris dan wilayah satu baris
dengan ellipsis. Alamat lengkap tetap ada di textarea, wilayah lengkap terbaca
di bantuan dan disclosure dapat dibuka. Tidak ada data yang dipotong/disimpan
dari preview tersebut. Tombol Ubah tetap mempunyai tinggi sentuh 44 px.

Seluruh 36 capture diambil ulang pada path yang sama. Suite revisi kembali
lulus 8 kelompok pemeriksaan, 36 capture, 0 error JavaScript; batas tinggi
preview <=140 px pada 320/390 juga lulus. Peninjau yang sama memeriksa empat
capture atas/bawah form dan mengembalikan:

| Temuan | Nilai | Bukti |
| --- | --- | --- |
| Ringkasan lokasi terlalu tinggi | Resolved | Preview ringkas pada 320/390, Ubah jelas, alamat/wilayah lengkap tersedia dan capture bawah membuktikan Simpan terjangkau; tidak terlihat regresi dari perbaikan. |

Disposition **ship** mencakup perbaikan yang dinilai, bukan audit ulang seluruh
permukaan. Tidak ada temuan dalam daftar perbaikan yang tersisa. Tidak ada
perubahan UI setelah capture/verdict tersebut.

## Verifikasi yang dijalankan

| Pemeriksaan | Hasil |
| --- | --- |
| Revisi khusus | PASS: 8 kelompok pemeriksaan, 36 capture, 0 error JavaScript. |
| Akun | PASS: 40 skenario, 18 kelompok pemeriksaan, 35 capture, 0 error JavaScript. |
| Pesanan Saya | PASS: 29 skenario, 22 pemeriksaan, 22 capture, 0 error JavaScript. |
| Detail Pesanan | PASS: 50 skenario, 34 pemeriksaan, 29 capture, 0 error JavaScript. |
| Pembayaran | PASS: 50 skenario, 73 pemeriksaan, 16 capture, 0 error JavaScript. |
| Shell | PASS: 11 kelompok pemeriksaan, 11 aset asli; layout 320–1920 px. |
| Struktur | PASS: 24 halaman, 30 CSS, 61 JS, 539 referensi, tidak ada yang hilang. |
| Syntax/whitespace | JS terkait lulus node --check; git diff --check tanpa error whitespace. |
| Provenance | SCAN: 0 rasters, 0 missing untuk aset SVG storefront; tile peta dinamis bukan raster shipping lokal. |

Satu lookup nyata kota publik Bandung mengembalikan lima hasil melalui adapter
map. Ini bukti koneksi, bukan ketepatan semua tingkat wilayah. Pengujian input
lengkap dan parsial memakai respons Photon terkontrol; Leaflet/CDN/tile peta
yang dirender benar dimuat. Sesi login dan pencabutannya masih data sintetis.

## Perubahan yang diperiksa

Pencabutan sesi lain memiliki konfirmasi, mempertahankan perangkat ini dan
tidak mengaku sebagai pencabutan server produksi. Perubahan sandi contoh
menghapus sesi lain. Daftar kosong/satu perangkat dan gagal memuat tersedia.

Alamat menggunakan ringkasan lokasi, isian utama satu kolom dan disclosure
wilayah. Field tetap mempunyai nilai dan ikut validasi walaupun tersembunyi.
Kegagalan map, hasil parsial dan kode pos invalid membuka rincian. Geocoding
tidak menghasilkan nama/HP penerima atau mengarang field kosong. Loader peta
menunggu CSS dan JavaScript, mempunyai timeout/retry dan fallback manual.

Harga disejajarkan di tengah baris produk. Menu lain menangani Escape/klik luar,
satu menu aktif dan pembalikan posisi bila ruang bawah kurang. COD atau data
offline/stale menuju rincian pembayaran read-only di Detail, bukan CTA Bayar
online. Dialog aksi tetap memeriksa capability terbaru; tautan menu tidak
langsung melakukan mutasi.

Timeline pelacakan memisahkan timestamp, titik dan isi, dengan informasi kurir,
resi serta penerima di kolom lain. Ponsel menampilkan riwayat lebih dahulu.
Kontrol copy dan teks resi sejajar. Tombol tutup/form memiliki jalur kembali.

Header ponsel sekitar 201 px, dibanding sekitar 293 px pada versi sebelumnya di
390 px. Footer tertutup sekitar 450 px pada ponsel, dengan tiga kelompok menu
yang dapat dibuka. Angka footprint adalah pengukuran viewport emulasi dan
bukan jaminan ukuran pada semua font/perangkat. Warna/aset sumber tetap.

## Detector dan dokumentasi

Hallmark render revisi: 29 FAIL, 16 REFLEX, 6 WARN, termasuk temuan URL/file yang
berulang. Satu owned control “Kelola Keamanan” membungkus telah dipersingkat
menjadi “Atur Keamanan” sebelum capture final. Log bukan PASS dan tidak
diklaim sweep baru sesudah perbaikan tersebut. Batas tersisa mencakup kontras,
spacing, pencarian header tanpa border visual, HOT 9 px, bobot font dan label
footer sumber. Tidak dilakukan perubahan brand warna untuk menghilangkan log.

Impeccable detector tidak diulang; log build akun sebelumnya tetap 2 warning/
6 advisory. Taste build sebelumnya berakhir OPEN 50 untuk heuristik marketing
dan shell; hasil itu tidak digunakan sebagai PASS revisi ini. Tidak ada waiver
baru atau perubahan alat. Seluruh temuan dicatat dengan batas cakupannya.

PRODUCT.md, DESIGN.md dan sidecar global dipertahankan. Kontrak lokal tersimpan
pada `.impeccable/surfaces/customer-refinements.md`; keputusan serta integrasi
yang tersisa tercantum dalam [cakupan revisi](../../coverage/customer-refinements.md).
