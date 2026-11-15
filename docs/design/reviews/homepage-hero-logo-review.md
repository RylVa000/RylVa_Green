disposition: ship

Review manual inline untuk revisi hero, logo dan hover wishlist tanggal
15 November 2026. Reviewer independen sebelumnya mencapai batas penggunaan;
fallback ini tidak merupakan persetujuan independen. Tidak ada QUALITY BAR
terpisah. Temuan quality gates historis tetap mengikuti coverage yang ada.

## persistence

Cakupan dipin pada tujuh screenshot terbaru pengguna: tiga posisi tanaman
sebelum revisi, komposisi Monstera yang diminta, perbandingan simbol lama
dan simbol Figma yang benar, serta kartu dengan wishlist. PRODUCT.md tetap
menjadi acuan produk. DESIGN.md dan surface brief mencatat sumber SVG,
adaptasi warna tulisan, anchor foto dan perbedaan komposisi mobile.
Build tetap code-led, `seed: none (pinned)`, tanpa comp round baru.

Bukti disalin ke `.impeccable/review/homepage-hero-logo-final/`. Desktop,
mobile dan user-320 merupakan capture halaman penuh dari bagian atas.
Capture per slide, header/footer dan state wishlist memperlihatkan area
revisi tanpa aset gagal atau konten salah. Referensi pengguna disimpan
sebagai reference-1 sampai reference-7. Logo diverifikasi melalui konteks
dan screenshot Figma `649:197`/`649:199`, lalu ekspor SVG read-only.

Pengujian yang dijalankan setelah perubahan akhir: empat kelompok hero/logo,
delapan kelompok refinements/interaksi, empat kelompok alignment kartu dan
11 pemeriksaan shell dengan 11 aset. Seluruh laporan memiliki errors kosong.
Lima lebar desktop/tablet dikalikan tiga slide menghasilkan 15 pemeriksaan
overlap foto, dengan alpha minimum 251 pada sudut dan piksel sekitarnya.
Delapan lebar 320–1920px, input ekstrem, jumlah keranjang 2/99+, serta tiga
halaman pelanggan juga diperiksa. Tidak ada detector tambahan atau uji
perangkat fisik yang diklaim.

## fidelity

| Elemen | Penilaian | Bukti dan keputusan |
| --- | --- | --- |
| TYPE | match | Poppins serta hierarki nama, harga, judul dan CTA existing dipertahankan. Lettering logo sekarang mengikuti path lengkap sumber Figma, bukan wordmark komposit lama. |
| MATERIAL | match | Tiga foto hero, foto kartu dan ikon dipertahankan. Sumber logo lengkap `649:197` memuat simbol `649:199` yang cocok dengan gambar 6. Semua path dan proporsi root 161×60 dipertahankan. |
| GROUND | match | Palet hijau, krem dan pink per slide tidak berubah. Hover hanya menambahkan warna plum pada border tipis, tanpa mengganti permukaan atau warna ikon. |
| Hero desktop | match | Bagian bawah kiri pot melampaui sudut kiri bawah arch, mengikuti gambar 4. Tidak ada strip tipis pada pertemuan pot dengan sisi/bawah bidang. Foto tidak didistorsi; area teks tetap bebas. |
| Hero tablet | adaptation | Anchor sudut yang sama mengikuti ukuran art container. Rasio foto dan bidang tetap terpisah; pada 768px gambar lebih kecil karena kolom artwork existing lebih sempit. Tidak ada overlap dengan teks atau overflow halaman. |
| Gerak pergantian slide | adaptation | Posisi awal foto datang sedikit dari kiri menuju anchor akhir agar tidak membuka strip di kiri saat pergantian. Autoplay 6,5 detik, pause/resume, kontrol manual dan reduced motion tetap lulus. |
| Hero mobile | keep | Foto tetap di tengah bidang lebar, CTA mengikuti lebar gambar, pause sejajar logo dan dots di bawah CTA. Referensi posisi terbaru adalah desktop; komposisi mobile yang sudah disepakati dipertahankan. |
| Logo navigasi/footer | adaptation | Ekspor utuh asli disimpan sebagai logo-figma-source.svg. Kedua varian memakai seluruh geometri asli dan warna botani yang sama. Hanya fill tulisan RylVa/GREEN menjadi krem existing #F7F2DF untuk latar hijau. Tinggi otomatis menjaga proporsi simbol dan lettering. |
| Hover wishlist | match | Border menjadi #963F5C. Hati tetap outline dan latar lingkaran tetap transparan sebelum disimpan, termasuk ketika hover. Hover tidak mengubah aria-pressed. |
| Wishlist tersimpan | keep | Konfirmasi simpan mengaktifkan aria-pressed dan mengisi hati. Warna latar state tersimpan existing dipertahankan; penghapusan mengembalikan ikon kosong. Fokus keyboard dan target tap tetap tersedia. |
| Konsistensi shell/kartu | match | Keranjang, Akun dan Pesanan Saya memakai aset bersama yang benar. Tidak ada perubahan kontrak data atau navigasi. Grid dua kolom ponsel, harga, divider, tombol, overlay dan badge tetap lulus regresi. |

THESIS, OWN-WORLD dan STORY tetap mengikuti toko botani serta Home page rev.
FIRST VIEWPORT kini menampilkan komposisi tanaman yang diminta dan logo
resmi dalam proporsi asli. Detail tidak diganti dengan logo atau bitmap
buatan. Perbandingan TYPE/MATERIAL/GROUND dilakukan secara visual dan
melalui path SVG; bukan klaim pengukuran pixel seluruh desain Figma.

## ceiling

Reached untuk koreksi yang dipin: overlap bawah/kiri hero, sumber dan rasio
logo yang benar, serta pembedaan hover dengan wishlist tersimpan. Tidak ada
penilaian world-ceiling independen. Quality gate historis OPEN/69 tidak
dijalankan ulang atau dianggap tertutup oleh pemeriksaan lokal ini.

## material_fixes

Tidak ada pada cakupan revisi ini. Data katalog dan wishlist masih pratinjau;
wishlist belum tersimpan ke akun produksi. `ship` berlaku untuk revisi UI
ini dan tidak menyatakan seluruh produk atau integrasi sudah selesai.

## keep

Pertahankan sumber SVG lokal beserta metadata, geometri dan warna botani
asli, foto dengan rasio natural, anchor per foto, komposisi mobile terpusat,
palet per slide dan border hover yang tidak mengubah state simpan.
