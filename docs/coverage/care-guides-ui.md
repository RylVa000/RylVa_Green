# Daftar Panduan Perawatan

19 November 2026. Halaman publik dalam sistem storefront RylVa Green; native
HTML/CSS/JavaScript, tanpa perubahan framework atau layanan transaksi.

## Route, isi dan sumber

- `/pages/public/care-guides.html`; alias `/care-guides.html` dan
  `/panduan-perawatan.html` mempertahankan query.
- Entri navigasi **Panduan Perawatan** pada footer Jelajahi RylVa.
- Workbench lokal `/__preview/care-guides`, sebelas skenario adapter terpisah.
- Enam ringkasan: Monstera, Peace Lily, Lidah Mertua, Aglaonema,
  Dracaena sanderiana dan Petunia. Setiap ringkasan menyebut sumber, bahasa
  Inggris dan perilaku membuka tab baru.

Ringkasan ditulis ulang dari sumber primer dan diperiksa 19 November 2026:

| Tanaman | Sumber |
| --- | --- |
| Monstera | [NC State Extension](https://plants.ces.ncsu.edu/plants/monstera-deliciosa/) |
| Peace Lily | [NC State Extension](https://plants.ces.ncsu.edu/plants/spathiphyllum/) |
| Lidah Mertua | [NC State Extension](https://plants.ces.ncsu.edu/plants/dracaena-trifasciata/) |
| Aglaonema | [UF/IFAS Extension](https://gardeningsolutions.ifas.ufl.edu/plants/houseplants/aglaonema/) |
| Dracaena sanderiana | [NC State Extension](https://plants.ces.ncsu.edu/plants/dracaena-sanderiana/) |
| Petunia | [NC State Extension](https://plants.ces.ncsu.edu/plants/petunia-x-hybrida/) |

Panduan bersifat umum untuk spesies/genus. Pengelompokan indoor/outdoor dan
asosiasi produk mengikuti katalog contoh, bukan klaim varietas tanaman tertentu.
Tidak menambah dosis pupuk, diagnosis penyakit, jadwal penyiraman tetap,
nama penulis, tanggal terbit, metrik atau ulasan. Foto memakai enam aset katalog
existing yang sesuai; tidak menambah atau mengubah raster. Foto Sirih Gading
yang menyerupai Calathea tidak digunakan untuk mengidentifikasi panduan.

## Struktur dan interaksi

Banner hijau/judul putih terpusat dan breadcrumb kiri mengikuti koreksi pengguna
pada halaman informasi. Lebar konten 1180 px dibatasi dan terpusat. Berdasarkan
koreksi eksplisit pengguna 20 November 2026, desktop kembali memakai dua kartu
per baris. Tinggi, posisi foto/judul dan kontrol disclosure disamakan dalam setiap
pasangan melalui subgrid; baris selanjutnya tetap berjarak 24px. Ringkasan terbuka
menambah tinggi kedua permukaan kartu dalam pasangan itu, sehingga tepi dan tombol
tetap sejajar. Native disclosure tetap dapat dibuka sendiri-sendiri. Browser tanpa
subgrid memakai fallback grid biasa; isi tetap dapat dibaca. Pada lebar hingga
800px, daftar satu kolom. Isi ringkasan dibatasi 75ch. Pada ponsel, deskripsi memakai
seluruh lebar kartu; foto dan identitas tanaman tetap di atasnya.
Sesuai koreksi pengguna, bagian “Belum menemukan tanaman Anda?” menempatkan
judul, penjelasan dan tombol di tengah; panjang penjelasan dibatasi 65ch.

Pencarian nama umum, nama ilmiah dan topik, pilihan indoor/outdoor, topik tunggal,
urutan awal/A–Z/Z–A langsung memperbarui hasil. Reset membersihkan pencarian,
jenis, topik, urutan serta ringkasan terbuka dan mengembalikan fokus ke pencarian.
Keenam panduan ditampilkan sekaligus; tidak menambah pagination palsu.

Ringkasan menggunakan `details/summary` native, dapat dibuka dengan Enter/Space,
tanpa dialog. Beberapa ringkasan dapat dibaca bersamaan. Tiap ringkasan memuat
topik dasar, sumber dan produk terkait yang benar-benar ada dalam fixture.
Tautan produk menggunakan navigasi Detail/Back existing; pencarian, filter,
urutan, ringkasan terbuka, posisi gulir dan fokus dipulihkan.

URL menyimpan `q`, `type`, `topic`, `sort` dan `guide` (dapat berulang).
`#guide-petunia` membuka ringkasan dan memindahkan fokus ke summary. Parameter
asing memakai nilai aman; input tampil melalui escaping. Search header tetap
membuka Katalog produk, terpisah dari search panduan.

## Matriks state

| Area | State/pemicu | Tampilan dan tindakan | Konteks dipertahankan/pemulihan |
| --- | --- | --- | --- |
| Halaman | Normal | Enam panduan bersumber, jumlah hasil, kontrol | URL dan konteks baca |
| Daftar | Loading | Skeleton, `aria-busy`, status memuat; kontrol tetap tersedia | Query/filter yang dimasukkan selama memuat diterapkan setelah selesai |
| Pencarian | Tanpa hasil | Penjelasan dan Reset Pencarian & Filter | Input tetap terlihat sampai Reset; fokus kembali ke search |
| Koleksi | Belum ada data | Panduan belum tersedia, Hubungi Kami | Tidak mengganti dengan panduan buatan |
| Koleksi | Data sebagian | Pemberitahuan dan data yang dapat dibaca | Filter bekerja pada entri tersedia |
| Data | Tidak valid/duplikat | Entri tidak valid dilewati, pemberitahuan | Entitas valid tetap dapat dibaca; sumber dibatasi HTTPS dan domain primer |
| Daftar | Gagal/offline/timeout/maintenance | Penjelasan, Coba Lagi dan Kontak | Search/filter tetap; retry dijaga agar tidak diproses ganda |
| Halaman | Offline setelah termuat | Pemberitahuan koneksi; ringkasan tetap terbuka/dapat dibaca | Tidak menghapus konten; pemberitahuan hilang setelah online |
| Panduan | ID tidak ditemukan | Pemberitahuan, daftar lain tetap tersedia | Pilih ringkasan lain atau Reset bila pencarian aktif |
| Ringkasan | Expanded/collapsed | Native disclosure dan fokus jelas | Disimpan dalam query; kembali dari produk mempertahankan konteks |
| Gambar | Gagal dimuat | Foto belum tersedia; nama/panduan tetap terbaca | Tidak menghalangi sumber atau produk terkait |
| Konten | Nama/deskripsi panjang | Membungkus tanpa menyembunyikan isi | Tidak memotong tindakan atau menambah overflow |
| Kontrol | Hover/focus/pressed | Warna/ring native yang terbaca | Informasi utama selalu terlihat tanpa hover |
| Gerak | Reduced motion | Transisi berhenti | Konten tetap terlihat |
| Halaman | JavaScript mati | Daftar enam tautan sumber native | Search/ringkasan dinamis tidak ditawarkan sebagai kontrol mati |

Tidak menambahkan state simpan, persetujuan, login, sesi atau konflik edit karena
halaman ini publik dan read-only. Tidak ada permintaan tulis ke backend.

## Berkas dan batas perubahan bersama

| Berkas | Peran |
| --- | --- |
| `public/pages/public/care-guides.html` | Shell existing, banner, form, daftar dan fallback native |
| `public/assets/css/storefront/care-guides.css` | Gaya target mengikuti token; tidak mengubah halaman lain |
| `public/assets/js/storefront/care-guides-data.js` | Konten dan sumber editorial, terpisah dari adapter |
| `public/assets/js/storefront/care-guides-repository.js` | Pembacaan lokal serta skenario loopback |
| `public/assets/js/storefront/care-guides.js` | Filter, URL, disclosure, state/retry dan navigasi produk |
| `storefront-shell.js` | Satu tautan native footer dan pemetaan route |
| `storefront-product-navigation.js`, `product-detail.js` | Allowlist sumber kembali dan label Panduan Perawatan |
| `information-pages.css` | Hanya menambah selector banner target pada aturan existing |
| `config/preview-pages.json`, server preview | Dua alias dan workbench lokal |
| `tests/e2e/browser/verify-care-guides.cjs` | Pemeriksaan fungsi, state dan capture |

## Verifikasi

Laporan terperinci pada `storage/reports/care-guides/`. Pemeriksaan awal dan
pengulangan setelah perbaikan lebar deskripsi/fallback gambar lulus 13 kelompok
fungsi. Pemeriksaan terakhir setelah penggantian nilai jarak dengan token
bernilai sama serta pelengkapan state disabled dicatat pada `verification.json`.
Array page errors, failed resources tak terduga dan request tulis kosong.

Bukti awal sebelum koreksi layout mencakup 15 capture: enam viewport
1920/1440/1024/768/390/320; tanpa hasil, ringkasan
terbuka, loading, error, koleksi kosong, parsial, gambar gagal, teks panjang dan
no-JS. Capture menunggu Poppins 400/500/600/700, decoding gambar dan transisi
selesai, dimulai dari puncak dokumen. Gambar gagal merupakan skenario sengaja.

Regresi Detail Produk, halaman informasi dan navigasi kategori dijalankan karena
perubahan berada pada shell serta pemulihan navigasi bersama. Hasil desain
otomatis dan review independen dilaporkan terpisah dari uji fungsi; keberhasilan
fungsi tidak berarti seluruh aturan desain atau aksesibilitas situs telah lulus.

| Pemeriksaan | Hasil |
| --- | --- |
| Target `verify-care-guides.cjs` | 13 kelompok lulus setelah perubahan terakhir |
| Regresi Detail Produk | 13 kelompok lulus |
| Regresi halaman informasi | 7 kelompok lulus |
| Regresi navigasi kategori | 4 kelompok lulus; termasuk guard perubahan Keranjang/Buket |
| Statis HTML | Satu H1, tidak ada ID duplikat, 47 referensi lokal valid |
| `node --check` | Tiga JS target, tiga JS bersama, test baru dan server preview lulus |
| `git diff --check` | Lulus; peringatan LF/CRLF existing tidak dianggap kegagalan whitespace |
| Provenance | 28 raster existing diperiksa, 0 missing; tidak menambah/mengubah aset |

Total **37 kelompok**. Tidak ada pipeline build frontend; hasil dijalankan pada
server preview proyek. Uji mencakup pemulihan URL/ringkasan/fokus setelah Detail,
filter silang tanpa hasil, empat jalur error/retry, no-JS dan sumber yang aman.

## Pemeriksa desain

Impeccable detect dijalankan sekali pada URL aktual dan CSS target: enam warning
(cream palette yang dipin, empat temuan kontras komponen bersama, satu HOT kecil)
dan satu advisory straggler pada deskripsi Peace Lily. Tidak membuat ignore
baru. Body/kontrol target memakai primary-dark/primary yang terbaca; penilaian
ini tidak mengubah temuan aksesibilitas header/footer existing menjadi lulus.

Hallmark render benar-benar dijalankan: **140 FAIL, 77 REFLEX, 13 WARN** secara
mentah untuk dua berkas beserta render shell. CSS target tidak lagi memiliki
FAIL setelah lima penggantian nilai jarak dengan token setara dan pelengkapan
gaya disabled. Dua REFLEX CSS mengenai warna putih pada fokus banner dan label
terpilih mengikuti token serta desain yang dipin; WARN transform foto mengikuti
micro-interaction dan WARN numerik `h2` bukan angka yang ditampilkan. Raw report
tetap disimpan. Runtime awal tidak ditemukan, lalu render dijalankan dengan
runtime Puppeteer proyek; percobaan awal tidak disebut sebagai render lulus.

Taste: **GATE: OPEN 47 (rounds used up)**. `--start` mempertahankan budget build
existing yang memiliki satu round kategori; pekerjaan ini memakai round kedua
dan ketiga tanpa reset. Tidak ada waiver dan checker tidak diubah. Temuan mentah
meliputi `.wrap`, hero/satu section per layar, signature moment dan navigasi
kategori yang dapat digulir, selain kontras/fokus/ukuran kontrol shell existing.
Aturan marketing tidak digunakan untuk mengganti struktur daftar Read atau
mendesain ulang shell yang diminta dipertahankan. OPEN bukan PASS. Rincian setiap
FAIL ada pada `taste-gate-final.txt` dan `taste-gate.json`.

Artefak Hallmark dipindahkan dari direktori publik ke
`storage/reports/care-guides/hallmark-artifacts/`. Capture final untuk review
tersimpan pada `.impeccable/review/care-guides/`; seluruh 15 hash identik dengan
capture yang diperiksa setelah perubahan mekanis terakhir. Review independen
dicatat terpisah dalam `finish-review.md`.

Review awal meminta satu koreksi semantik: tautan Tentang Kami di footer masih
membawa penanda current-page dari markup sumber. Atribut itu dihapus pada target.
Suite target kembali lulus 13 kelompok, termasuk assertion hanya Panduan
Perawatan yang aktif pada footer enam viewport dan no-JS. Semua 15 capture
diambil ulang; hash tidak berubah. Verdict pass reviewer menyatakan koreksi
tersebut **resolved**, `disposition: ship` untuk koreksi yang dinilai. Putusan
terbatas ini mempertahankan batas review awal serta temuan gate/aksesibilitas;
tidak mengklaim seluruh situs atau semua pemeriksa lulus.

Pemeriksa layout Taste terpisah gagal secara operasional: `Cannot read properties
of undefined (reading 'map')`, kemudian `r.sections is not iterable` pada skrip kit.
Pemeriksaan ini tidak dinyatakan lulus dan kit tidak diubah. Overflow/posisi pada
enam viewport tetap diperiksa melalui browser harness proyek dan capture nyata.

Pemeriksa performa Taste dijalankan pada 1440/390: **4 FAIL, 6 WARN**, terutama
font existing 1600,1 KiB dan ikon shell yang tidak lazy. Kedua font family terdeteksi
karena shell memuat Inter walaupun teks antarmuka memakai Poppins. Tidak mengubah
font/header global di luar scope. Aset gambar total 140,3 KiB, tidak ada request
rusak; CLS terukur 0,036 desktop dan 0,000 mobile. Angka lokal ini bukan metrik
produksi atau jaminan performa pengguna.

## Riwayat koreksi susunan saat ringkasan dibuka

Screenshot pengguna menunjukkan state `type=indoor&guide=peace-lily`: grid dua
kolom membuat baris mengikuti tinggi kartu Peace Lily yang terbuka, meninggalkan
ruang kosong di bawah kartu sebelahnya. Review independen baru menilai screenshot
pengguna sebagai bukti utama; capture awal dengan satu hasil pencarian tidak
mencakup kasus ini.

Perbaikan pertama memakai daftar satu kolom horizontal, kelompok nama/nama ilmiah/deskripsi
dengan jarak eksplisit, serta lebar baca maksimal 75ch. Tidak memakai masonry,
urutan visual yang berbeda dari DOM, atau pemindahan ringkasan ke dialog. Bantuan
yang sudah ditengahkan tetap di tengah. Sumber dan perilaku perawatan tidak diubah.

Verifikasi terbaru pada `storage/reports/care-guides/layout-correction/`:

- Empat kelompok uji layout lulus pada 1440/1578/390/320 px. Dalam keadaan
  tertutup, kartu kedua terbuka, beberapa kartu terbuka dan penutupan kembali,
  setiap pasangan kartu berjarak 24px tanpa lubang grid atau overflow.
- 13 kelompok fungsi target kembali lulus; errors, failedResources dan writes
  kosong. Pengujian ini meliputi pencarian, filter, Reset, keyboard, konteks
  Detail/Back, loading, retry, data sebagian, foto gagal, teks panjang dan no-JS.
- 12 capture baru (tiga state pada empat ukuran) dibuka dan dinilai valid oleh
  pembuat serta reviewer. Bukti ada di `.impeccable/review/care-guides-layout/`.
- `node --check` dan `git diff --check` lulus. Uji regresi halaman lain tidak
  diulang karena perbaikan tidak menyentuh komponen atau logika bersama.

Review baru pada `layout-finish-review.md` menilai ketiga koreksi **resolved**,
`disposition: ship` pada scope perbaikan layout. Verdict itu tidak mengubah
temuan pemeriksa desain/performa awal menjadi lulus. PRODUCT.md dan DESIGN.md
dipertahankan; surface brief dan dokumentasi target diperbarui sesuai hasil.

Pada 20 November pengguna memperjelas bahwa dua kartu per baris harus
dipertahankan. Keputusan satu kolom desktop di atas digantikan oleh dua kolom
dengan tinggi pasangan dan track intro/disclosure yang konsisten. Konten masih
dikelompokkan dengan jarak eksplisit; tidak mengembalikan foto yang membentangkan
dua auto-row di dalam intro. Wrapper artikel dilepas agar dua anak kartu langsung
mengikuti track subgrid; label kartu tetap merujuk pada heading yang terlihat.

Bukti terbaru berada di `storage/reports/care-guides/two-column-correction/` dan
`.impeccable/review/care-guides-paired/`. Lima kelompok layout memeriksa pasangan
desktop pada 1440/1578/1024 serta satu kolom pada 390/320, dalam keadaan tertutup,
kartu kedua terbuka, beberapa ringkasan terbuka, dan penutupan kembali. Posisi foto,
judul, tombol, tepi atas/bawah dan jarak antarbaris diperiksa secara numerik.

Hasil akhir koreksi dua kolom:

- Lima kelompok layout dan 13 kelompok fungsi target lulus. Tidak ada error,
  resource gagal yang tidak diharapkan, atau write pada laporan pengujian.
- Seluruh 15 capture dibuka dan diperiksa oleh pembuat serta reviewer independen.
  Pasangan kartu desktop sejajar; ponsel tetap satu kolom tanpa overflow.
- Review `paired-finish-review.md` memberi `disposition: ship` tanpa perbaikan
  material untuk koreksi ini. Kartu tertutup mengikuti tinggi pasangannya ketika
  ringkasan sebelah dibuka; ruang di dalam kartu merupakan konsekuensi tinggi
  pasangan yang sama, sementara masing-masing ringkasan tetap independen.
- `node --check` dan `git diff --check` lulus. Temuan desain, kontras, dan performa
  awal tetap tercatat; hasil ini tidak menyatakan pemeriksaan seluruh situs lulus.

## Integrasi tersisa

Konten dibaca lokal; CMS, penerbitan/revisi panduan dan endpoint produksi belum
ada. Halaman Detail Panduan mandiri ditambahkan pada 20 November 2026;
lihat [cakupan detail](care-guide-detail-ui.md). Ringkasan inline dan dua kartu
per baris dipertahankan. Produk terkait serta
Keranjang/Wishlist di header mengikuti sistem pratinjau existing. Validasi
produk, otorisasi transaksi dan persistence produksi tetap membutuhkan backend.
