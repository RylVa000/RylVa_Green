# Homepage RylVa Green

Implementasi 15 November 2026, berdasarkan pembacaan langsung Home page rev
`466:386` pada Figma `LcUKB3k9C38G0g6KWo5zIU`. Route:
`/pages/public/home.html`; alias `/home.html` dan `/homepage.html`.
Root server Node pratinjau sekarang menuju Beranda. Route staf tetap tersedia.
PHP/front controller dan katalog produksi belum dihubungkan.

Revisi aktif terbaru: [autoplay setelah pemilihan manual dan Marigold](#revisi-autoplay-manual-dan-marigold).
Bagian bukti awal dipertahankan sebagai riwayat, bukan audit revisi terbaru.

## Cakupan yang tersedia

- Hero Monstera, logo asli dan tiga indikator; revisi terbaru menambahkan
  pergantian otomatis gambar/palet, kontrol jeda dan pemilihan manual.
- Delapan kategori, tiga kartu penawaran, empat koleksi trending, empat benefit,
  empat rekomendasi berfilter, serta ilustrasi lima kota dari frame.
- Navigasi/footer memakai markup, aset dan CSS shell existing. Gaya homepage
  dibatasi dengan class home-page; footer mobile tetap accordion ringkas.
- Dialog koleksi dengan pencarian langsung, jumlah hasil, kosong dan Reset;
  dialog detail contoh dimulai dari ringkasan produk, harga dan pilihan.
- Kembali ke koleksi mempertahankan teks pencarian dan posisi gulir dialog.
  Escape/Tutup mengembalikan fokus pemicu. Form pencarian header benar-benar
  menyaring fixture. Filter rekomendasi langsung memperbarui hasil dan URL.
- Tambah produk menggabungkan SKU yang sama melalui adapter keranjang contoh,
  memperbarui badge, mencegah pengiriman ganda dan membatasi jumlah/stok.
  Katalog fixture keranjang diperluas tanpa mengubah dua item default existing.
  Handoff Checkout mengenali produk tambahan; pelanggan tamu tetap diminta masuk.
- Gambar disiapkan sebagai 24 WebP, total sekitar 965 KB sebelum metadata,
  ditambah sepuluh SVG asli. Dua WebP ilustratif tambahan untuk hero Calathea
  dan Petunia berukuran sekitar 241 KB dan 559 KB, dimuat saat slide dipilih.
  Sumber PNG dan SVG tidak terpakai disimpan sebagai
  bukti lokal di storage/reports/homepage-source-assets. Provenance: 26 raster,
  0 missing; engine memakai sidecar JSON untuk format WebP.

## Perbedaan sumber dan keputusan

| Sumber/ketidakpastian | Implementasi dan dampak |
| --- | --- |
| Figma Calathea Rp110.000; keranjang Rp75.000 | Mengikuti keranjang Rp75.000 agar nominal tidak berubah lintas halaman. |
| Persentase diskon Figma tidak selalu sesuai nominal | Diskon dihitung dari harga awal dan harga saat ini. |
| Garansi/paten/konsultasi seumur hidup/pengiriman seluruh Indonesia belum didukung baseline | Struktur benefit dan ilustrasi dipertahankan; teks diganti menjadi kemampuan penanganan, informasi produk, pelacakan dan bantuan pesanan. |
| Header lama mengandung janji gratis ongkir/retur | Homepage memakai informasi netral di slot yang sama. Halaman lain tidak diubah teksnya. |
| Foto pada node Sirih Gading 496:306 merupakan Calathea | Diperiksa ulang melalui konteks node tersebut; pratinjau tetap mengikuti aset frame. Detail menyatakan produk/foto contoh. Foto Sirih Gading yang benar masih diperlukan untuk katalog produksi. |
| Metadata perawatan/kecocokan hewan/pembersih udara belum terverifikasi | Filter tetap dapat digunakan; hasil kosong menjelaskan atribut belum terverifikasi dan menyediakan Reset. Tidak membuat klaim kesehatan atau keamanan hewan. |
| Katalog/detail belum memiliki halaman aktif | Dialog pratinjau homepage memenuhi interaksi sementara; bukan klaim route katalog produksi selesai. |
| Penawaran paket/buket belum ada layanan pemesanan | Tombol membuka ringkasan contoh dan jalur ke koleksi; tidak membuat transaksi palsu. |
| Tujuan bantuan/kebijakan belum tersedia | Dialog menjelaskan ketersediaan dan menawarkan koleksi; isi kebijakan dan integrasi tidak dibuat-buat. |

## State dan pemulihan

| Area | State/pemicu | Isi/tindakan | Konteks dipertahankan |
| --- | --- | --- | --- |
| Halaman/kontrol | Normal, hover, fokus, selected | Fokus terlihat, tombol berlabel, status aktif beserta teks | Filter/posisi halaman |
| Produk | Loading atau pemuatan ulang | aria-busy dan pesan pemuatan; retry ganda dicegah | Hero/kategori dan pilihan pencarian |
| Koleksi | Kosong atau pencarian tanpa hasil | Pesan spesifik, Reset, atau Coba Lagi | Teks pencarian sampai Reset |
| Rekomendasi | Filter tanpa data sah | Penjelasan atribut belum terverifikasi, Reset | Filter aktif dalam URL |
| Produk | Habis, stok 0, harga tidak valid | Label Habis/Harga Belum Tersedia; tambah nonaktif | Detail masih dapat dibuka |
| Gambar | Aset gagal | Bidang Foto Belum Tersedia; nama/harga/tindakan tetap ada | Seluruh kontrol |
| Data | Sebagian tersedia atau konten panjang | Kartu yang tersedia tetap tampil, teks membungkus | Koleksi dan pilihan |
| Layanan | Gagal, offline, timeout, maintenance | Pesan dan Coba Lagi; bagian statis tetap tersedia | Pilihan dan hasil yang sudah dimuat |
| Tambah | Mengirim/berhasil | Semua tombol tambah terkunci sementara; hasil menyebut keranjang contoh | Dialog/posisi/pencarian |
| Tambah | Gagal/pembatasan contoh | Pesan kegagalan, dapat mencoba kembali | Produk yang dilihat |
| Keranjang | Konflik tab atau batas jumlah | Data terbaru dimuat pada konflik; batas menawarkan penyesuaian di Keranjang | Konteks homepage |
| Storage | Ditolak/tidak tersedia | Hasil menjelaskan data tidak tersimpan permanen | Snapshot di memori tab |
| Dialog | Tutup, Escape, kembali ke hasil | Fokus dipulihkan; detail baru dimulai dari atas | Query dan scroll koleksi |
| Motion | Kurangi gerakan | Entrance dan transisi dinonaktifkan | Konten tetap terlihat |

Halaman publik tidak memerlukan sesi, OTP atau MFA. Aturan tersebut tetap
berlaku pada jalur Akun/Checkout yang sudah ada; tidak dibuat state akses palsu
untuk Beranda.

## Data dan integrasi

Data delapan produk, harga dan stok adalah fixture. Interface UI menggunakan
`RylvaHomepageAdapter` bila disediakan, selain itu adapter homepage contoh.
Kontraknya load({recover}) menghasilkan products/cart; add(productId) menghasilkan
snapshot cart. Ini seam frontend, bukan endpoint produksi yang sudah ada.
Katalog nyata, validasi server, harga/stock terkini, konten perawatan dan foto
produk yang benar masih memerlukan integrasi dan verifikasi.

Kontrol pengembangan berada pada `/__preview/homepage`; parameter
`?preview=home&state=...` hanya aktif pada hostname lokal. Lima belas skenario
terpisah dari alur produksi. Tidak mengirim kredensial atau data pelanggan.
DESIGN.md dipertahankan; .impeccable/design.json belum tersedia sebelum tugas.

## Bukti pemeriksaan

Tes: tests/e2e/browser/verify-homepage.cjs. Capture dan verification.json berada
di storage/reports/homepage. Cakupan: enam ukuran 320–1920px, aset, overflow,
aksi kartu, shell mobile, pencarian/detail/return/fokus, filter/Reset, hero,
duplikasi tambah, persistence/handoff serta pembatasan Checkout tamu, state
kesalahan/pemulihan dan kurangi gerakan. Hasil akhir: enam kelompok lulus,
15 skenario terjangkau dan tidak ada error JavaScript. Pencarian nama kategori
Tanaman Indoor menghasilkan tujuh produk; fokus keyboard pada CTA bidang
hijau tua memakai ring putih 3px. Detail kembali ke query sebelumnya.

Regresi Keranjang: 19 kelompok / 49 skenario lulus. Regresi Checkout:
17 kelompok / 34 state lulus. Node --check modul yang disentuh dan
git diff --check lulus. Tidak ada framework atau proses build baru.
Route root, kedua alias, halaman utama dan workbench juga diperiksa: HTTP 200
dengan isi halaman yang sesuai pada server pratinjau port 4185.

Review awal memperbaiki pencarian kategori, menghapus tiga label tambahan di atas
judul penawaran, mengganti glyph tindakan dengan ikon SVG dan memberi ruang
tombol paket pada tablet agar satu baris. Outline heading dialog tidak dihapus.

Quality gate tidak semuanya lulus. Taste berakhir OPEN 69 setelah tiga round;
Hallmark mencatat 29 FAIL / 45 REFLEX / 13 WARN, dan performance lokal
6 FAIL / 7 WARN. Perbedaan aturan generik dengan Figma, temuan shell existing,
batas optimasi aset dan dua temuan fokus yang telah diperbaiki setelah round
terakhir dijabarkan lengkap pada
[laporan quality gates](../design/reviews/homepage-quality-gates.md).
Berat gambar lulus, CLS 0 dan broken requests 0 pada pengukuran lokal tersebut;
ini bukan klaim performa lapangan atau aksesibilitas penuh.

[Review awal](../design/reviews/homepage-review.md) menghasilkan lima perbaikan.
[Verdict akhir](../design/reviews/homepage-verdict.md) menyatakan ship untuk
kelima perbaikan tersebut: seluruhnya terselesaikan dan delapan capture akhir
valid. Verdict tidak mengubah status quality gate yang masih OPEN.

## Revisi kartu, hero dan panel header

Permintaan pengguna berikutnya mengoreksi bukti hasil awal. Revisi ini memakai
pembacaan ulang Figma 466:386 dan tujuh screenshot pengguna, termasuk panel
Keranjang/Akun Blibli sebagai referensi perilaku. Review/verdict sebelumnya
merupakan riwayat; tidak dipakai untuk menyatakan revisi baru sudah lulus.

- Kartu mengikuti rasio sekitar 412:244 pada desktop lebar: nama/status sejajar,
  deskripsi ringkas, harga dan hati di atas divider, detail/keranjang di bawah.
  Foto memakai aset asli Figma; kartu responsif mempertahankan teks dan target
  yang dapat digunakan. Status Calathea kuning memakai label contoh Hampir Habis
  dari Figma, tanpa mengarang ambang stok produksi. Harga tetap Rp75.000 sesuai
  Keranjang. Stok/label/status pratinjau harus diganti dengan satu sumber server
  yang konsisten sebelum produksi; batas jumlah adapter existing tidak diubah.
- Tiga badge promosi asli dan label tindakan dipulihkan atas revisi eksplisit
  pengguna. HEMAT 25% dan EDISI TERBATAS adalah desain promosi contoh, belum
  kampanye aktif. Pemesanan paket/buket/workshop belum terhubung.
- Hero Monstera hijau, Calathea krem/olive, Petunia pink berganti setiap 6,5 detik.
  Gambar, latar, arch, warna teks, CTA dan indikator mengikuti slide. Aset baru
  selesai decode sebelum mengganti slide. Jeda saat fokus keyboard, offscreen,
  tab tersembunyi, dialog/panel terbuka atau preferensi kurangi gerak. Pemilih
  manual dan kontrol Jeda/Lanjutkan tetap dapat digunakan.
- Keranjang/Akun mempunyai panel hover dengan backdrop. Klik/touch dan
  ArrowDown juga membuka panel; Escape, tombol tutup dan klik luar menutup,
  fokus kembali ke pemicu. Perpindahan pointer dari ikon ke panel tidak menutup
  panel secara langsung. Panel dibatasi viewport dan daftar dapat digulir.
- Ringkasan keranjang membaca snapshot adapter yang sama, menampilkan unit,
  varian, harga, total sebelum ongkir dan akses ke Keranjang. Hapus memakai
  konfirmasi inline dengan Batal, mengunci pengiriman ganda, menyimpan melalui
  adapter existing dan memperbarui badge. Offline/konflik mempertahankan data.
- Panel Akun menyediakan Profil, Pesanan, Alamat, Keamanan dan Privasi melalui
  route existing. State signed-out menyediakan Masuk/Daftar. Tidak menambah
  saldo, poin, PayLater, atau identitas pelanggan nyata.
- Ikon hati bekerja sebagai wishlist contoh dalam memori halaman. Header dan
  panel Akun dapat membuka koleksi tersimpan. Tidak ada route wishlist produksi,
  persistence akun atau sinkronisasi lintas perangkat yang diklaim.

Modul baru `homepage-hero.js`, `homepage-header.js`, `homepage-header.css` hanya
diikutkan pada Homepage. Markup/geometri shell dan perilaku halaman lain tetap
dipertahankan. `readCart/remove` adalah ekstensi adapter contoh ke load/mutate
keranjang existing, bukan endpoint baru.

Pemeriksaan revisi: `tests/e2e/browser/verify-homepage-refinements.cjs`;
bukti pada `storage/reports/homepage-revision`. Pemeriksaan mencakup rasio
kartu, promosi, tiga tema dan autoplay/jeda nyata, hover/klik/keyboard,
konfirmasi/batal/hapus, persistence, total, sinkronisasi tambah, wishlist,
signed-out, pembatasan panel, kurangi gerak serta offline/retry.
Pada revisi awal, enam kelompok pemeriksaan lulus tanpa error JavaScript pada
enam viewport 320–1920px. Temuan review awal disimpan pada
[review refinements](../design/reviews/homepage-refinements-review.md);
hasil revisi lanjutan dicatat di bagian berikutnya.
Pemeriksaan dasar Homepage juga lulus enam kelompok/15 skenario setelah revisi.
Review baru memakai screenshot pengguna sebagai acuan dan menghasilkan dua
perbaikan: tombol Lanjutkan harus bekerja saat tetap fokus/hover, dan umpan
balik wishlist harus menuju wishlist. Keduanya sudah diuji setelah diperbaiki;
timer benar-benar berpindah slide dan tombol Lihat Wishlist membuka koleksi
tersimpan, sementara tindakan tambah tetap mengarah ke Keranjang.

### Asal dua aset hero tambahan

`public/assets/images/homepage/hero-petunia-v2.webp` dan
`hero-calathea-v2.webp` dibuat dengan built-in imagegen sebagai rekonstruksi
ilustratif tajam dari aset Figma beresolusi kecil. Foto kartu tidak diganti.
Prompt lengkap yang benar-benar dikirim tersimpan pada sidecar JSON masing-masing
aset; PNG asli dan salinan prompt juga ada pada storage/reports/homepage-revision.
Keduanya mempertahankan alpha dan dioptimalkan menjadi WebP. Aset ini bukan
foto inventaris produksi dan tidak boleh dipakai sebagai bukti produk nyata.

## Revisi kepadatan ponsel dan wishlist terisi

Arahan terbaru dari delapan screenshot pengguna:

- Hati aktif diisi warna, bukan sekadar latar lingkaran. SVG baru mempertahankan
  keluarga stroke UI dan target lingkaran 44×44px. Lebar target hati/keranjang
  sama dan pusat horizontal keduanya sejajar.
- Tombol promosi mengikuti isi label; lebar paket 316px yang dipaksakan dihapus.
- Hero ponsel menampilkan gambar sebelum CTA. Ruang kosong minimum deskripsi
  dan tinggi 630px yang dipaksakan dihapus, dengan urutan grid yang jelas.
- Promosi ponsel menjadi rail horizontal kartu 230–320px dengan tinggi minimum
  218px, dapat digeser dan menampilkan bagian kartu berikutnya. Ini menggantikan
  tiga kartu besar bertumpuk.
- Grid produk ponsel menampilkan dua kolom, termasuk koleksi dalam dialog.
  Kartu menjadi vertikal; deskripsi panjang dipindahkan dari tampilan ringkas
  ke detail yang sudah tersedia. Nama, status, harga, hati, Detail dan keranjang
  tetap tersedia; nama penuh berada pada aria-label tindakan detail.
- Autoplay 6,5 detik tetap aktif saat pointer berada di gambar hero. Jeda
  eksplisit, fokus keyboard, offscreen, tab tersembunyi, dialog/panel dan
  prefers-reduced-motion tetap ditangani. Tidak memakai autoplay promosi.

Pemeriksaan revisi memperluas verify-homepage-refinements.cjs dengan ukuran
44×44px, isi hati aktif, pusat hati/keranjang, dua produk pada koordinat baris
yang sama, urutan gambar/CTA, tinggi promosi <280px dan autoplay ponsel nyata.
Tujuh kelompok pemeriksaan revisi lulus, termasuk perpindahan slide nyata
setelah 6,5 detik pada desktop dan ponsel. Pemeriksaan dasar Homepage juga
lulus enam kelompok/15 skenario setelah perubahan ini. Kedua laporan memiliki
daftar error JavaScript kosong. Enam ukuran yang diperiksa: 1920, 1440, 1024,
768, 390 dan 320px. Pemeriksaan sintaks tiga berkas JS yang terdampak lulus.

Screenshot wishlist aktif diambil setelah kartu digulir ke dalam viewport,
sehingga bukti benar-benar memperlihatkan hati terisi. Peninjauan visual
terakhir tersedia pada [review revisi ponsel](../design/reviews/homepage-mobile-review.md).

Reviewer terpisah menyelesaikan review awal dan menemukan dua masalah yang
sudah diperbaiki, tetapi proses verdict terpisah berhenti karena batas penggunaan
layanan. Revisi terbaru diperiksa langsung melalui browser dan pass peninjauan
manual; hasilnya tidak dinyatakan sebagai persetujuan reviewer independen.
Disposition manual `ship` hanya berlaku pada revisi UI ini, bukan penutupan
temuan quality gates historis atau kesiapan integrasi produksi.

## Revisi hierarki kartu, logo terang dan gambar

- Logo navigasi/footer memakai daun krem pada dua SVG storefront bersama.
  Gambar logo hero dan tata letak shell dipertahankan.
- Nama desktop lebih besar/bold, seluruh nama dari data tetap tersedia dan
  membungkus per kata; badge stok berada di kanan atas heading. Grid hingga
  1400px memakai dua kolom agar kata dan badge tidak berebut ruang dan empat
  produk tetap terbagi rata dalam dua baris.
- Nama ponsel 17px/bold; badge stok diposisikan di kanan atas foto. Diskon
  tetap di kiri atas. Harga utama lebih tebal; harga lama/coretan merah pada
  kedua ukuran perangkat. Harga dan / pot sebaris pada ponsel.
- Wishlist desktop 36px agar keranjang 44px lebih dominan. Pada ponsel,
  kedua kontrol sama-sama 44px pada baris tindakan. Seluruh kartu merupakan
  target tombol detail berlabel lengkap; kontrol wishlist/keranjang memiliki
  target tersendiri. Tidak membuat tombol bersarang atau listener navigasi
  pada elemen article yang tidak semantik.
- Nama/keterangan kategori satu baris. Rail kategori ponsel mempertahankan
  nama lengkap; interaksi keyboard native tetap menggulir kontrol ke tampilan.
- Logo hero sejajar dengan teks. Arch ponsel menjadi latar lebar dan tanaman
  dipusatkan berdasarkan batas transparansinya. Foto kartu juga menggunakan
  normalisasi batas objek; tidak mengganti aset, mengubah proporsi, atau
  memotong tanaman. Calathea menjadi acuan pengisian bingkai.

Bukti revisi ini berada pada `storage/reports/homepage-hierarchy`, terpisah
dari revisi sebelumnya. Pengujian mencakup input sentuh emulasi, keyboard,
detail dari kartu, wishlist/keranjang terpisah, nama antar kata, harga/satuan,
warna coretan, kategori, overlay, keadaan gagal serta timer nyata. Data katalog, harga, stok dan
wishlist tetap mengikuti batas pratinjau yang sudah dijelaskan di atas.

Tambahan slider mobile: CTA penuh selebar gambar/minimal 48px, pause kanan
atas pada baris logo, dan tiga titik terpusat dengan jarak visual 20px dari CTA.
Ketiga tema memakai aturan tersebut, dengan target kontrol 44px dan autoplay
serta preferensi kurangi gerak tetap berfungsi.

Hasil akhir: delapan kelompok verifikasi refinements lulus pada tujuh lebar
1920, 1440, 1366, 1024, 768, 390 dan 320px, dengan errors kosong. Ini termasuk
tap pada emulasi perangkat sentuh, keyboard, ukuran/posisi CTA/pause/dots,
nama yang membungkus antar kata dan perpindahan slide 6,5 detik yang nyata.
Enam kelompok regresi dasar Homepage/15 skenario juga lulus pada tahap revisi
ini; penyesuaian akhir jarak/kontrol slider diperiksa oleh suite refinements.

Pemeriksaan gambar tambahan pada `asset-layout.json` membuktikan delapan
objek foto tetap dalam bingkai, terpusat dengan selisih <1px dan mengisi >85%
dari salah satu dimensi bingkai. Tiga hero ponsel juga terpusat berdasarkan
batas objeknya. Harga Rp1.250.000.000 dan Harga belum tersedia tidak melampaui
kartu 320px. Logo navigasi/footer berhasil dirender di Keranjang dan Akun.
Screenshot tiga hero memakai motion normal sehingga kontrol pause terlihat;
state reduced-motion diperiksa terpisah oleh suite utama.

[Review manual revisi ini](../design/reviews/homepage-hierarchy-review.md)
merupakan peninjauan inline; tidak mengklaim reviewer independen atau menutup
quality gates historis. Pratinjau diuji di Chromium, bukan perangkat fisik.

## Revisi jarak kartu dan badge navigasi

- Desktop: judul maksimal dua baris pada tinggi konsisten; deskripsi sejajar.
  Kartu lebih rapat, minimum 218px mengikuti kebutuhan isi. Wishlist dan
  keranjang sebaris di kanan bawah, gap 8px. Hierarki 36px/44px dipertahankan.
- Mobile: nama rata tengah, judul tidak memaksakan satu baris kosong. Subgrid
  menyamakan tinggi baris foto/judul/harga/tindakan per pasangan kartu.
  Jarak judul ke harga 10px, slot harga lama 18px, harga lama merah 12px.
  Produk tanpa diskon memiliki slot kosong yang tidak diumumkan ke pembaca
  layar. Harga utama dan divider sejajar; jarak/padding bagian bawah 10px.
- Urutan foto, judul, harga dan tindakan diperiksa dari posisi render.
  Konflik subgrid dengan container query kartu telah diperbaiki; container
  foto tetap dipertahankan agar normalisasi gambar tidak berubah.
- Logo bersama kini memiliki kelopak dan daun krem dengan garis pemisah sage.
  Ini melengkapi revisi sebelumnya yang baru mencerahkan daun. Foto produk,
  logo hero, wordmark, palet, keluarga font dan badge existing dipertahankan.
- Badge jumlah keranjang mobile sekarang top/right 2px di dalam tombol 44px,
  dengan lebar mengikuti teks. Pengujian angka 2 dan 99+ memastikan badge
  tetap bertumpang pada sudut ikon dan tidak melayang di atas tombol.

Bukti baru: `storage/reports/homepage-card-spacing`.
`verify-homepage-card-spacing.cjs` memeriksa posisi dan ukuran aktual pada
1920, 1440, 1366, 1024, 768, 390, 360 dan 320px, empat state data ekstrem/tidak
lengkap pada mobile, serta logo/badge di Keranjang, Akun dan Pesanan Saya.
Empat kelompok pemeriksaan geometri lulus dengan errors kosong. Hasil
regresi interaksi juga lulus delapan kelompok, dan regresi dasar Homepage
lulus enam kelompok/15 skenario. Ketiga laporan memiliki errors kosong.
Label Detail Produk tetap satu baris pada kartu desktop sempit; ikon panah
pendamping disembunyikan hanya ketika container kartu kurang dari 300px.

Pemeriksaan visual memakai render desktop/mobile, rekomendasi 1920/1440/390/320px
serta header ponsel. [Review manual revisi ini](../design/reviews/homepage-card-spacing-review.md)
dicatat terpisah sebagai pass inline, bukan persetujuan reviewer independen
atau penutupan quality gates historis. Tidak ada integrasi produksi baru.

## Revisi hero, logo Figma dan hover wishlist

- Hero desktop/tablet memakai anchor pada bagian bawah pot. Tiga foto tetap
  memiliki rasio asli dan menutup sudut kiri bawah bidang sampai melampauinya,
  mengikuti screenshot 4. Warna, konten dan pergantian slide dipertahankan.
  Komposisi mobile yang sudah ditinjau tetap di tengah bidang lebar.
- Logo navigasi/footer memakai ekspor lengkap Figma `649:197`, bukan simbol
  lama yang dipipihkan. Simbol `649:199` sesuai gambar 6. Semua geometri path,
  lettering dan warna botani dipertahankan; hanya tulisan memakai krem existing
  untuk latar hijau. Root 161×60 tetap utuh dan render memakai tinggi otomatis.
  Ekspor sumber asli serta metadata disimpan bersama aset SVG lokal. Tidak
  ada URL Figma sementara yang menjadi sumber gambar saat halaman dijalankan.
- Hover wishlist hanya mengubah border lingkaran. Hati tetap kosong sebelum
  disimpan, lalu mengikuti state terisi existing setelah disimpan. Isi lingkaran
  tidak berubah karena hover. Fokus keyboard dan aria-pressed tetap berfungsi.

Bukti baru pada `storage/reports/homepage-hero-logo-final`.
`verify-homepage-hero-logo.cjs` memeriksa 15 kombinasi foto/ukuran desktop,
piksel sudut kiri bawah dan sekitarnya, rasio foto, empat state wishlist,
komposisi mobile 320/390px, serta path/warna logo pada tiga halaman pelanggan.
Perbedaan tinggi SVG <0,1px diperbolehkan untuk pembulatan layout subpiksel.
Pemeriksaan akhir lulus: empat kelompok hero/logo, delapan kelompok
refinements/interaksi, empat kelompok alignment kartu pada delapan ukuran,
serta 11 pemeriksaan shell dan 11 aset. Semua laporan memiliki errors kosong.
Capture desktop/mobile, tiga slide, logo bersama dan state wishlist diperiksa
secara visual. [Review revisi ini](../design/reviews/homepage-hero-logo-review.md)
berdisposisi `ship` untuk cakupan UI ini. Review dilakukan inline karena
reviewer independen sebelumnya mencapai batas penggunaan; quality gates
historis tidak dinyatakan selesai. Integrasi produksi tidak ditambahkan.

## Revisi autoplay manual dan Marigold

- Pemilihan titik manual kini memulai ulang interval 6,5 detik meski fokus
  tetap pada tombol. Pause eksplisit tidak dibatalkan oleh pemilihan manual.
  Keyboard, sentuhan, reduced motion dan aturan jeda existing tetap didukung.
- Marigold ditambahkan sebagai slide keempat dengan palet jingga, foto
  transparan berdasarkan kiriman pengguna, deskripsi visual dan CTA koleksi
  bunga existing. Tidak mengarang produk, harga, stok atau endpoint baru.
- `hero-marigold.webp` serta sidecar menyimpan aset dan provenance lokal.
  Penyusunan foto mengikuti anchor desktop serta komposisi mobile existing.

Bukti baru: `storage/reports/homepage-marigold`. Pemeriksaan yang dijalankan:

| Pemeriksaan | Hasil |
| --- | --- |
| verify-homepage-autoplay.cjs | Lulus empat kelompok: klik nyata dengan jeda 6,5 detik; keyboard/sentuhan dan wrap empat slide; Pause/Resume serta reduced motion; render/CTA Marigold pada enam ukuran 320–1920px. Timer dipercepat hanya dalam harness untuk skenario tambahan. |
| verify-homepage-hero-logo.cjs | Lulus empat kelompok; kini mencakup 20 kombinasi empat foto pada lima lebar desktop/tablet, state wishlist, komposisi mobile dan logo bersama. |
| verify-homepage-refinements.cjs | Lulus delapan kelompok interaksi/layout, empat palet slide, kontrol autoplay, kartu, overlay, dialog dan pemulihan offline. |
| Syntax dan whitespace | JavaScript yang disentuh serta git diff --check diperiksa. |

Semua laporan browser memiliki errors kosong. Capture Marigold desktop,
tablet, 390px dan 320px diperiksa secara visual. Kontras slide: teks terhadap
permukaan 8,66:1, CTA terhadap tulisan terang sekitar 6,72:1, serta kontrol
terhadap permukaan 6,43:1. Ini pemeriksaan kombinasi Marigold saja.
[Review revisi ini](../design/reviews/homepage-marigold-review.md) dilakukan
inline, berdisposisi `ship` untuk cakupan revisi. Quality gates global historis
dan batas integrasi pratinjau tetap tercatat pada bagian sebelumnya.
