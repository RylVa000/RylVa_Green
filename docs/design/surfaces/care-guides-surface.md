# Daftar Panduan Perawatan

Jenis bisnis: place, toko tanaman. Mode: Read. Ekstensi daftar publik dalam
sistem storefront existing; dapat dibaca tanpa akun.

## Sumber dan keputusan

PRODUCT.md, DESIGN.md, katalog, Detail Produk dan halaman informasi aktif.
Pengguna menyetujui daftar panduan dengan pencarian berdasarkan tanaman atau
kebutuhan perawatan. Pertahankan identitas, header/footer, stack dan pola belanja.
Scope awal adalah daftar beserta ringkasan inline. Pada 20 November pengguna
meminta artikel detail mandiri; tautan pada kartu mengarah ke surface
`care-guide-detail-surface.md` tanpa menghilangkan disclosure atau dua kolom.
Tidak ada formulir penyimpanan, login, rating, penulis atau tanggal terbit buatan.

## Direction contract

**THESIS:** Pembaca menemukan kebutuhan dasar tanaman lalu membaca ringkasan
bersumber tanpa kehilangan hasil pencarian.

**OWN-WORLD:** Poppins, krem dan hijau RylVa; banner hijau dengan judul putih
di tengah serta breadcrumb kiri seperti halaman informasi yang telah dikoreksi.
Kontrol, radius, focus dan fotografi mengikuti token/aset existing.

**STORY:** Banner ringkas, pencarian panduan, jenis tanaman, topik, urutan,
jumlah hasil, daftar bergambar dengan ringkasan native disclosure, sumber,
produk terkait dan jalur bantuan.

**FIRST VIEWPORT:** Desktop memperlihatkan banner, kontrol dan awal daftar
dua kartu per baris, sesuai koreksi eksplisit pengguna 20 November 2026:
"seperti card yang sebaris 2 card tanaman"; masalah sebelumnya adalah penataan
yang tidak konsisten, bukan jumlah kolom. Kartu dalam satu baris memiliki tinggi
sama serta posisi foto, judul dan kontrol baca sejajar. Intro dan disclosure
memakai track bersama agar panjang deskripsi atau ringkasan tidak membuat
tepi kartu/tombol berpindah sendiri. Mobile tetap satu kolom dengan kontrol
bertumpuk, identitas di samping foto dan deskripsi selebar kartu. Hasil tidak
terhalang panel sticky tambahan; foto tidak dipotong.

**FORM:** seed: none (pinned). "Gunakan identitas visual, tipografi, warna,
spacing, ikon, dan pola interaksi yang sudah sesuai"; pengguna menerima daftar
panduan dengan pencarian/filter. Struktur daftar/disclosure mengembangkan pola
FAQ dan Katalog; bukan dunia atau komposisi marketing baru. Interaksi pengenal:
buka ringkasan inline, filter langsung, Reset, URL/Back memulihkan konteks.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Data dan state

Enam tanaman memakai aset katalog yang sesuai; tidak memakai foto Sirih Gading
yang saat ini menyerupai Calathea. Ringkasan disusun dari NC State Extension
dan UF/IFAS, diverifikasi 19 November 2026. Sumber terlihat pada tiap ringkasan.
Panduan bersifat umum untuk spesies/genus, bukan rekomendasi kultivar atau
jadwal penyiraman tetap. Konten ringkasan nyata terpisah dari adapter pratinjau.

Pencarian nama umum/ilmiah/topik, jenis indoor/outdoor, satu topik dan urutan
nama langsung memperbarui hasil. Keenam entri tampil sekaligus; pagination
belum diperlukan. URL menyimpan q/type/topic/sort/guide; hash menuju entri.
Global search tetap mencari produk di Katalog. Detail Produk memakai pemulihan
konteks existing. Detail Panduan kini memakai route tersendiri dan pemulihan
history daftar; tidak menambah kontrak backend.

State: loading skeleton; ready/read-only; expanded/collapsed; no results dengan
Reset; koleksi kosong dengan Kontak; partial/invalid records dengan sisa data;
error/offline/timeout/maintenance dengan retry yang mempertahankan filter;
koneksi terputus setelah loaded tetap membiarkan ringkasan dibaca; gambar gagal
dengan fallback; URL panduan tidak ditemukan dengan pemulihan; no-JS daftar
sumber native. Kontrol skenario hanya pada workbench loopback terpisah.

## Pemeriksaan dan batas

1440/1920/1024/768/390/320, pencarian/filter/Reset/URL/Back, disclosure keyboard,
tautan sumber aman, produk terkait, header search, kegagalan/retry, no-JS,
teks panjang, foto gagal dan navigasi bersama. Backend CMS/penerbitan belum ada.
DESIGN.md tidak diubah; tidak menambah aset raster.
