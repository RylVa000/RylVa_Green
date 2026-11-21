# Detail Panduan Perawatan

Tanggal: 20 November 2026. Status: frontend publik dengan data editorial lokal;
CMS dan penerbitan produksi belum terhubung.

## Cakupan dan keputusan

- Route `/pages/public/care-guide-detail.html?guide=<id>`, dengan ID enam tanaman
  pada daftar existing. Alias `care-guide-detail.html` dan
  `detail-panduan-perawatan.html` mempertahankan query.
- Identitas, Poppins, token, banner hijau/teks putih, breadcrumb, shell dan footer
  mengikuti DESIGN.md. Tidak mengubah PRODUCT.md atau dunia visual proyek.
- Ringkasan kebutuhan muncul sebelum artikel. Foto utuh memakai aset existing;
  Monstera memakai `product-detail/monstera-main.png` yang lebih rinci daripada
  thumbnail daftar. Tidak menambah ilustrasi, stok foto atau gambar generatif.
- Artikel memisahkan perawatan, tempat tumbuh/pertumbuhan, pengamatan kondisi,
  sumber dan produk terkait. Tidak menampilkan penulis/tanggal/rating buatan atau
  menetapkan diagnosis dari satu gejala. Tidak membuat jadwal siram universal.
- Data tambahan berada di `care-guide-detail-data.js`; adapter detail membungkus
  repository daftar lokal. Pembaca `information-article.js`, navigasi produk,
  gaya daftar isi, tombol dan bantuan existing digunakan kembali.
- Daftar tetap dua kartu per baris desktop dengan ringkasan native inline.
  Tautan Baca panduan lengkap tersedia tanpa harus membuka ringkasan terlebih dulu.

## Sumber editorial

Sumber primer diperiksa ulang pada 20 November 2026. Tanggal pemeriksaan ini
bukan tanggal terbit artikel dan tidak ditampilkan sebagai tanggal publikasi.
Naskah diparafrasekan; angka musiman iklim North Carolina tidak diterapkan
sebagai jadwal penyiraman tetap untuk Indonesia.

- [Monstera — NC State Extension](https://plants.ces.ncsu.edu/plants/monstera-deliciosa/)
- [Peace Lily — NC State Extension](https://plants.ces.ncsu.edu/plants/spathiphyllum/)
- [Lidah Mertua — NC State Extension](https://plants.ces.ncsu.edu/plants/dracaena-trifasciata/)
- [Aglaonema — UF/IFAS](https://gardeningsolutions.ifas.ufl.edu/plants/houseplants/aglaonema/)
- [Dracaena sanderiana — NC State Extension](https://plants.ces.ncsu.edu/plants/dracaena-sanderiana/)
- [Petunia — NC State Extension](https://plants.ces.ncsu.edu/plants/petunia-x-hybrida/)

## State dan pemulihan

| Area | State/pemicu | Perilaku dan pemulihan |
| --- | --- | --- |
| Artikel | Loading awal | Pesan status dan aria-busy; tautan kembali tetap tersedia. |
| Artikel | Ready | Informasi hanya baca, tanpa login atau mutasi. |
| Daftar isi | Expanded/collapsed, hover/fokus/aktif | Native disclosure; section aktif mengikuti gulir dua arah. Klik memindahkan fokus ke section. |
| Data | ID hilang/tidak sah/tidak ditemukan | Penjelasan, daftar panduan, Kontak; tidak menebak tanaman. |
| Data | Sumber/identitas inti tidak valid | Isi tidak diterbitkan, jalur daftar/Kontak tersedia; tautan tidak aman tidak dirender. |
| Data | Sebagian section tidak tersedia | Pemberitahuan; bagian yang sah dan sumber tetap bisa dibaca, tautan ke bagian kosong dihilangkan. |
| Foto | Gagal dimuat | Fallback teks; identitas dan semua bacaan dipertahankan. |
| Jaringan | Gagal/timeout/offline/maintenance saat load | Pesan spesifik dan Coba Lagi/Kontak; ID dan konteks URL tetap ada. |
| Jaringan | Offline setelah loaded | Isi tetap dibaca; pesan koneksi hilang ketika tersambung. |
| Navigasi | Kembali ke daftar | URL pencarian/jenis/topik/urutan serta ringkasan terbuka dipertahankan; klik normal mengembalikan gulir/fokus melalui history. |
| Navigasi | Produk terkait/Back | Pembaca kembali ke posisi artikel dan tautan produk yang sama. |
| Navigasi | Masuk langsung atau tab baru | Kembali native ke daftar, atau returnTo lokal yang tervalidasi; origin/route arbitrer ditolak. |
| Akses | JavaScript mati | Direktori enam sumber native dan tautan daftar; tidak berpura-pura memuat artikel. |
| Responsif | Teks panjang, 320px, reduced motion | Konten membungkus, susunan satu kolom dan tidak bergantung animasi. |

Tidak ada formulir, penyimpanan, konflik perubahan, login, hak staf, persetujuan,
pagination atau proses finansial pada halaman baca ini. State tersebut tidak
ditambahkan. Workbench loopback `/__preview/care-guide-detail` menyediakan 13
skenario melalui adapter, terpisah dari alur publik. Tidak membuat endpoint.

## Pemeriksaan

Laporan dan capture berada pada `storage/reports/care-guide-detail/` serta
`.impeccable/review/care-guide-detail/`.

- `verify-care-guide-detail.cjs`: **12 kelompok lulus**, mencakup enam viewport
  1440/1024/820/768/390/320, enam artikel, TOC keyboard/gulir, kembali dari daftar
  dan produk, sumber aman, alias, 13 skenario workbench, loading, retry,
  data invalid/sebagian, foto gagal, teks panjang, offline, reduced motion dan
  no-JS. Setelah koreksi foto, pemeriksaan batas gambar di setiap lebar ikut lulus.
  Tidak ada pageerror atau request yang menulis data.
- Regresi daftar **13 kelompok**, layout dua kartu **5 kelompok**, dan Detail
  Produk **13 kelompok** lulus. Total target/regresi **43 kelompok**. Koreksi
  foto terakhir hanya menyentuh CSS detail; target dijalankan ulang sesudahnya.
- Seluruh 12 capture final dibuka pembuat dan reviewer. Review awal menemukan
  pot/penyangga keluar dari bidang foto dan bertabrakan dengan judul di 320px.
  CSS kini memberi bidang gambar batas ukuran pasti dan `object-fit: contain`;
  foto utuh tanpa crop. `finish-verdict.md` menilai temuan itu **resolved**, dengan
  `disposition: ship` untuk perbaikan yang dinilai, bukan sertifikasi seluruh situs.
- `node --check` pada sumber/tes yang diubah dan `git diff --check` lulus.
  Scan provenance: **30 raster, 0 missing**; tidak ada aset baru atau diganti.

## Hasil pemeriksa desain yang tetap terbuka

**GATE: OPEN 45 (rounds used up)**, dengan 22 WARN. Tiga ronde dipertahankan;
percobaan sebelum perubahan CSS terakhir memakai ulang hasil ronde dua dan
tidak dihitung sebagai ronde baru. Tidak mengubah kit, menghapus temuan, atau
menambah waiver. Semua 45 temuan beserta lokasi, ukuran dan saran mentah ada di
`storage/reports/care-guide-detail/taste-gate-final.txt`.

Sebagian aturan mengharuskan hero marketing satu layar, moment, satu heading,
foto di setiap bagian, serta nama class `.wrap`; ini berbeda dari komposisi
artikel/daftar isi dan shell yang diminta dipertahankan pengguna. Temuan nyata
kontras ikon/teks header/footer, fokus pencarian, label dan navigasi bersama
tetap terbuka. Tidak mengubah bagian tersebut dalam ekstensi ini. Temuan
photo-upscale awal diselesaikan memakai aset Monstera existing yang lebih besar.

Hallmark source + URL sebelum koreksi containment: **141 FAIL, 71 REFLEX,
14 WARN**, pada `hallmark-render-final.txt`. Setelah koreksi, pemeriksaan URL
live saja: **11 FAIL, 5 REFLEX, 3 WARN**, pada `hallmark-live-after-fix.txt`.
Input kedua pemeriksaan berbeda, sehingga selisihnya bukan klaim 130 masalah
telah diselesaikan. Temuan live meliputi shell/kontras, skala judul dan label
daftar isi/sumber yang membungkus. Tidak menyembunyikan label agar tes lulus.
Percobaan render awal belum menemukan Puppeteer; percobaan berikut memakai
runtime proyek dan berhasil memeriksa URL yang dijalankan.

Impeccable detector dijalankan sekali: **8 temuan** (2 warning, 6 advisory) pada
`impeccable-detect.json`. HOT kecil dan nilai shell tetap tercatat. Laporan
menyebut Inter dan banner putih pada pembacaan file, sementara capture live
memperlihatkan Poppins dan banner hijau dari CSS existing; perbedaan bukti ini
diteruskan ke reviewer tanpa mengubah laporan atau mengulang detector.

Performance final: **4 FAIL, 8 WARN**, pada `taste-perf-final.txt`. Dua ukuran
masing-masing menandai font existing sekitar 1600 KiB dan 11 gambar/ikon shell
tanpa lazy sebagai FAIL. Foto Monstera existing sekitar 504 KiB memberi WARN.
Broken requests 0; CLS 0,009 desktop dan 0 mobile. Tidak mengklaim gate performa
lulus atau merombak aset/font bersama di luar cakupan.

Jenis: place, mode Read. Palet, pairing Poppins, banner, foto dan ground diwarisi
dari sistem yang dipin; tidak menjalankan undian tema atau menambah moment
marketing ke artikel. Voice: Bahasa Indonesia untuk pemula, kata kerja konkret,
kebutuhan tanaman dan langkah pengamatan, tanpa metrik/penulis/tanggal buatan.
Tidak ada fakta operasional yang diasumsikan, formulir baru, stand-in baru,
domain/kontak baru, atau kebutuhan aset yang ditutupi placeholder.

## Batas integrasi

Artikel lokal merupakan konten editorial; hubungan dan foto produk mengikuti
katalog pratinjau existing. CMS, otorisasi penerbitan/revisi, endpoint baca dan
status HTTP berbasis ketersediaan artikel belum tersedia. Navigasi UI tidak
mengubah stok, akun, keranjang atau data transaksi produksi.
