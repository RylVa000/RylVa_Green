# Detail Panduan Perawatan

Jenis bisnis: place, toko tanaman. Mode: Read. Ekstensi pola baca daftar panduan
dan halaman informasi yang sudah disepakati. Publik, tanpa login.

## Direction contract

**THESIS:** Pembaca memahami kebutuhan tanaman dari ringkasan terlebih dahulu,
lalu membaca penanganan yang sesuai tanpa kehilangan konteks daftar.

**OWN-WORLD:** Identitas Poppins, hijau/krem, foto katalog utuh, banner hijau
berjudul putih di tengah dan breadcrumb kiri dipertahankan. Header/footer sama.

**STORY:** Breadcrumb dan nama; foto/identitas dan ringkasan kebutuhan; daftar isi
otomatis; isi perawatan dan pengamatan; sumber; produk terkait; bantuan di tengah.

**FIRST VIEWPORT:** Banner ringkas seperti halaman informasi. Pembaca melihat
nama tanaman dan pengantar lalu awal ringkasan bergambar. Desktop memakai foto
di kiri dan ringkasan di kanan; bacaan memakai daftar isi kiri dan artikel kanan.
Ponsel menyusun foto, ringkasan, daftar isi disclosure lalu isi. Tidak memaksa
artikel menjadi rangkaian layar marketing atau membuat foto produk baru.

**FORM:** seed: none (pinned extension). Pengguna meminta "Gunakan kembali
komponen yang sama atau serupa" dan menerima "Foto, nama tanaman, dan ringkasan
kebutuhan", "Panduan cahaya, penyiraman, media, serta masalah umum", sumber,
produk terkait, serta kembali dengan filter dan gulir dipertahankan. Komposisi
mengembangkan pembaca halaman informasi; tidak mengganti dunia visual.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Cakupan, data dan perilaku

Route `/pages/public/care-guide-detail.html?guide=monstera`, enam ID sesuai daftar.
Data ringkasan dan asosiasi produk existing dipakai kembali. Artikel tambahan
dipisah dari adapter baca lokal; sumber NC State Extension dan UF/IFAS dibaca
ulang 20 November 2026. Tidak menambahkan penulis, tanggal publikasi, rating,
diagnosis pasti, jadwal penyiraman universal, atau klaim kemudahan/jaminan.

Native link dari kartu; ringkasan inline dan dua kartu per baris tetap tersedia.
Klik normal menyimpan URL daftar, ringkasan terbuka, gulir dan fokus tautan pada
history. Back eksplisit melewati anchor artikel melalui pembaca existing.
Tautan langsung memakai fallback daftar yang tervalidasi; tidak menerima origin
atau route return arbitrer. Artikel dibuka dari atas; hash langsung dibolehkan.

State: loading; ready/read-only; toc aktif/terbuka/tertutup; offline setelah
loaded; loadError/offline/timeout/maintenance dengan retry; ID hilang/tidak sah/
tidak ditemukan; data inti tidak valid; bagian artikel sebagian; foto gagal;
teks panjang; no-JS dengan sumber universitas dan jalur daftar. Tidak ada mutasi,
form, akses privat, perubahan belum tersimpan atau konfirmasi transaksi.
Workbench loopback terpisah menguji state; tidak menyediakan kontrol di UI publik.

## Pemeriksaan dan batas

1440/1024/820/768/390/320; enam artikel; daftar/detail/produk/Back; filter dan
ringkasan terpelihara; scrollspy dua arah; keyboard dan fokus; sumber aman;
kegagalan/retry; gambar; no-JS; reduced motion; global search tetap Katalog.
DESIGN.md dan PRODUCT.md dipertahankan. CMS/endpoint publikasi produksi belum ada.
