# Homepage · Home page rev

Jenis: toko botani (place), halaman publik untuk menjelajah dan mulai belanja.
Mode Impeccable: Persuade. Stack HTML/CSS/JavaScript native yang sudah ada.
Sumber visual: Figma LcUKB3k9C38G0g6KWo5zIU, Home page rev 466:386,
dibaca langsung 15 November 2026. Tidak mengubah file Figma.

## Direction contract

**THESIS:** halaman belanja yang memulai dari Monstera, lalu kategori dan produk.
**OWN-WORLD:** Poppins, krem/hijau RylVa, foto dan ilustrasi asli frame; shell
navigasi/footer existing, termasuk versi mobile yang sudah diringkas.
**STORY:** pengunjung mengenali koleksi, menelusuri kategori, meninjau produk,
menambah produk contoh ke keranjang, lalu melanjutkan alur yang tersedia.
**FIRST VIEWPORT:** hero membulat dengan logo dan judul Monstera besar di kiri,
tanaman berpot anyaman di kanan di depan bidang hijau melengkung; CTA koleksi
indoor di bawah deskripsi. Kategori berada tepat sesudah hero sesuai frame.
**FORM:** seed: none (pinned). Pengguna: “Ambil Desain dari Fima dengan halaman
homepage rev”. Code-led reproduction; tidak mengganti tema atau menawarkan comp.
**SIGNATURE:** tanaman hero dan kartu produk horizontal sesuai Figma; hover
ringan, entrance satu kali. Revisi pengguna menambahkan pergantian otomatis
gambar/palet hero, lengkap dengan jeda dan pemilih manual.
**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Rencana implementasi

1. Buat public/pages/public/home.html, CSS/JS homepage dan data produk contoh
   terpisah. Gunakan shell existing tanpa mengubah desain halaman lainnya.
2. Susunan: hero, delapan kategori, tiga penawaran, empat produk koleksi,
   empat benefit, empat rekomendasi dengan filter, ilustrasi kota, footer.
   Grid menyesuaikan ruang, bukan mengecilkan kanvas Figma pada ponsel.
3. Katalog/detail belum memiliki route. Sediakan dialog pratinjau koleksi/detail
   di homepage, pencarian lokal, filter langsung, tanpa berpura-pura menjadi
   katalog produksi. Tombol tambah memakai adapter keranjang contoh existing.
4. Perluas katalog fixture keranjang dan resolusi handoff Checkout agar produk
   homepage tidak hilang ketika berpindah ke alur yang sudah tersedia.
5. Tambah alias home.html/homepage.html dan jadikan root server pratinjau
   membuka Beranda. PHP/front controller produksi tetap di luar integrasi UI.
6. Uji render 1920, 1440, 1024, 768, 390 dan 320px, aset, keyboard/dialog,
   pencarian/filter, keranjang, pemulihan gagal/offline dan regresi shell/cart.

## Keputusan data dan adaptasi

- Semua harga, stok, promosi dan produk adalah contoh dari desain/fixture.
  Monstera Rp289.000; Calathea mengikuti adapter keranjang Rp75.000, berbeda
  dari Rp110.000 pada frame. Diskon dihitung dari harga, bukan label salah.
- Tidak mengklaim paten, kesegaran 100%, garansi 7 hari, konsultasi seumur hidup
  atau pengiriman seluruh Indonesia. Ganti teks dengan kemampuan yang ada di
  baseline: penanganan, informasi produk, pelacakan dan bantuan pesanan.
- Header homepage memakai teks informasi layanan yang netral; struktur/logo/
  kategori tetap shell yang dipin. Kebijakan footer tidak dibuat-buat.
- Filter Ramah Hewan/Pembersih Udara tidak mengasumsikan kecocokan yang belum
  terverifikasi. Tanpa atribut yang sah tampilkan kondisi kosong dan Reset.
- Revisi 15 November: tiga indikator dan autoplay 6,5 detik untuk Monstera
  hijau, Calathea krem/olive dan Petunia pink. Contoh Sakura pengguna merupakan
  arahan hubungan bunga/palet; tidak menyatakan Sakura sudah ada di katalog.
- Revisi kartu mengembalikan ikon hati Figma. Wishlist contoh hanya berlaku
  selama halaman terbuka dan diberi label; fitur akun/backend tetap belum ada.
- Data pribadi tidak diperlukan. Gagal storage tidak dilaporkan sebagai sukses
  tersimpan permanen. Konflik tab dan offline mempertahankan konteks koleksi.

## State wajib

Normal/hover/focus/selected, dialog terbuka/tertutup dan pemulihan fokus;
pemuatan bagian produk; data kosong, pencarian dan filter tanpa hasil;
gagal memuat/retry, offline, aset gagal, data harga tidak valid, produk habis;
penambahan sedang diproses/berhasil/gagal, batas jumlah dan konflik tab;
storage tidak tersedia serta konten panjang. Maintenance/timeout dapat diuji
melalui workbench lokal. Tidak memaksakan sesi/MFA/OTP pada halaman publik.
Kontrol pengujian hanya pada workbench/parameter localhost.

## Revisi pengguna setelah hasil awal

Referensi tambahan pengguna mengoreksi proporsi kartu dan promosi serta meminta
panel hover Keranjang/Akun seperti Blibli. Tangkapan pengguna mengungguli verdict
sebelumnya. Kartu mempertahankan posisi foto kiri, nama/status sebaris, harga
dan hati di atas divider, tindakan detail/keranjang di bawah. Gambar asli tetap
dipakai pada kartu. Nilai Calathea tetap mengikuti Keranjang agar konsisten.

Tiga badge promosi asli dan CTA kembali ditampilkan karena diminta pengguna.
Arahan ini mengungguli preferensi skill yang sebelumnya menghapus badge.
Label HEMAT 25%, EDISI TERBATAS dan WORKSHOP & DIY merupakan isi contoh frame;
belum merupakan kampanye yang aktif atau transaksi workshop.

Hero berhenti saat fokus keyboard, offscreen, tab tersembunyi, dialog/panel terbuka,
atau prefers-reduced-motion. Pemilihan manual tetap ada. Gambar berikutnya
selesai decode sebelum isi diganti; kegagalan mempertahankan banner sebelumnya.

Panel header hanya diaktifkan pada Homepage. Hover mouse, klik/touch, ArrowDown,
Escape, pemulihan fokus dan perpindahan pointer ke panel harus berfungsi.
Keranjang memakai adapter yang sama untuk baca/hapus/total, disertai konfirmasi
dan pembatalan. Akun menyediakan route yang tersedia; poin, PayLater, saldo
dan integrasi dari Blibli tidak disalin.

Dua foto hero tambahan merupakan rekonstruksi ilustratif resolusi tinggi
dengan imagegen berdasarkan aset kecil Calathea/Petunia Figma. File sumber
dan prompt dipertahankan; tidak dinyatakan sebagai foto stok produksi.
Navbar/footer dan sistem desain global tetap dipertahankan.

## Revisi lanjutan: kepadatan ponsel dan wishlist

Screenshot dan arahan terbaru pengguna menggantikan pilihan satu kolom produk
pada ponsel. Pada lebar 320–600px, tampilkan dua produk per baris dengan foto di
atas informasi, nama/status/harga tetap terlihat, deskripsi tersedia pada detail.
Label tindakan dipersingkat menjadi Detail dengan aria-label nama produk penuh.

Wishlist memakai ikon hati SVG yang benar-benar terisi ketika aktif. Target
44×44px berbentuk lingkaran, dengan pusat horizontal tepat di atas tombol
keranjang yang juga 44×44px. Tombol promosi mengikuti panjang labelnya.

Promosi ponsel menjadi deretan kartu ringkas yang dapat digeser, dengan sedikit
kartu berikutnya terlihat sebagai petunjuk. Hindari menumpuk tiga promosi tinggi.
Hero ponsel memakai urutan logo/judul/deskripsi, gambar, tombol, lalu kontrol.
Hapus ruang kosong buatan yang sebelumnya memisahkan deskripsi dan gambar.

Autoplay tetap 6,5 detik dan tetap berjalan ketika pointer berada di atas gambar
hero. Fokus keyboard dan preferensi kurangi gerak tetap dilindungi. Tombol
Lanjutkan mengizinkan pergantian ketika kontrol masih memegang fokus.

## Revisi hierarki kartu, logo dan gambar

Sepuluh screenshot dan arahan pengguna berikutnya menggantikan penempatan
kontrol sebelumnya. Hati desktop menjadi 36px dan tetap terpusat di atas
keranjang 44px. Pada ponsel, wishlist dan keranjang sama-sama 44px dalam satu
baris di bawah harga; teks Detail dihilangkan. Tombol detail yang sama
merentang pada kartu sehingga kartu dapat diketuk atau diaktifkan lewat
keyboard, sementara wishlist/keranjang memiliki lapisan klik tersendiri.

Nama memakai seluruh nama yang tersedia dalam data, tanpa menambah nama ilmiah
atau informasi produk baru. Nama desktop minimal 18px/bold dan membungkus antar
kata; badge stok tetap sejajar di kanan atas heading. Pada laptop hingga 1400px,
grid dua kolom menyediakan ruang untuk nama dan badge tanpa menyisakan satu
kartu sendirian pada baris berikutnya. Ponsel memakai nama
17px/bold dengan maksimal dua baris dan label detail lengkap untuk aksesibilitas.
Badge stok ponsel berada di pojok kanan atas foto; diskon tetap di kiri atas.

Harga utama diperbesar dan ditebalkan. Harga normal ponsel dan satuan / pot
sebaris, sedangkan angka ekstrem pada workbench menggunakan ukuran adaptif
agar tidak keluar kartu. Harga yang belum tersedia tetap dapat membungkus.
Harga lama dan garis coret memakai merah fungsional yang sama dengan diskon.

Kategori memiliki nama dan keterangan satu baris. Layar kecil memakai rail
kategori horizontal untuk menjaga nama utuh. Logo hero digeser agar tepi grup
sejajar dengan judul dan paragraf. Pada ponsel, bidang arch mengisi lebar area
gambar dengan tinggi kira-kira sepertiga hero, dan objek tanaman berada di
tengah bidang. Autoplay 6,5 detik serta kontrol existing tetap dipertahankan.

Batas objek transparan tiap foto dipakai untuk mengisi bingkai secara konsisten,
dengan Calathea sebagai acuan. Proporsi tanaman tetap asli dan tidak dipotong;
tanaman yang lebar dan ramping memiliki ukuran siluet yang berbeda secara alami.
Normalisasi memakai CSS dan aset existing, bukan gambar produk baru.

Dua SVG logo storefront bersama memakai bidang daun krem sesuai permintaan
pengguna, sehingga navigasi/footer halaman lain yang menggunakan aset tersebut
ikut diperbarui. Geometri, layout dan routing shell tidak berubah. Logo hero
berwarna tetap memakai aset tersendiri.

Tambahan slider ponsel: CTA memenuhi lebar bidang gambar dan memiliki tinggi
minimal 48px dengan bentuk pill. Kontrol jeda 44px berada di kanan atas sejajar
logo, dengan ruang khusus agar tidak menimpa logo. Tiga titik berada tepat di
tengah bawah; jarak visual titik ke CTA 20px, dengan target sentuh 44px yang
tetap dipertahankan. Ketiga slide mengikuti aturan yang sama.

## Revisi terbaru: jarak kartu dan badge navigasi

Mengikuti koreksi pengguna berikutnya, desktop tetap horizontal dengan judul
maksimal dua baris pada area setinggi dua baris. Deskripsi dimulai sejajar.
Ruang antarkomponen dipadatkan; minimum tinggi kartu 218px, sementara isi
tetap menentukan tinggi akhirnya. Wishlist 36px dan keranjang 44px sekarang
sebaris di kanan bawah dengan gap 8px, menggantikan susunan vertikal sebelumnya.
Pada kartu desktop sempit, ikon pendamping Detail Produk dapat disembunyikan
agar label lengkap tetap satu baris tanpa mengurangi ukuran font.

Mobile tetap dua kolom dengan nama di tengah. Foto, judul, harga dan tindakan
berbagi baris melalui subgrid per pasangan kartu. Judul memakai tinggi sesuai
isi hingga dua baris, tanpa memaksa satu baris kosong ketika kedua nama pendek.
Area judul ke area harga berjarak 10px; slot harga lama selalu setinggi 18px,
termasuk kosong pada produk tanpa diskon. Tidak menampilkan harga palsu atau
angka nol di slot kosong. Harga lama merah 12px pada kedua perangkat.
Harga utama serta divider sejajar; jarak harga ke divider, padding divider
ke tombol dan padding bawah kartu masing-masing 10px. Target tindakan 44px
dan tombol detail seluruh kartu tetap berfungsi.

Container query pada kartu hanya dipakai desktop; kartu mobile memakai subgrid
tanpa size containment, sementara bingkai fotonya tetap memiliki container
sendiri. Pemisahan ini mencegah tinggi baris judul/harga runtuh. Ukuran harga
ponsel tetap mengikuti ruang melalui clamp berbasis viewport.

Varian logo terang mencakup daun dan kelopak krem, dengan pemisah kelopak sage.
Bentuk path dan wordmark tetap asli. Badge keranjang mobile berada di dalam
tombol, top/right 2px, dan bertumpang dengan pojok ikon. Lebarnya mengikuti
isi, minimal 16px; badge tidak menerima pointer sehingga sentuhan membuka
keranjang melalui tombolnya. Offset negatif desktop tidak dipakai pada mobile.

## Revisi hero, logo Figma dan hover wishlist

Acuan terbaru mengganti varian logo hasil pewarnaan sebelumnya dengan logo
lengkap dari Figma `649:197`, termasuk simbol `649:199` pada gambar 6 pengguna.
Ekspor SVG utuh disimpan tanpa perubahan sebagai `logo-figma-source.svg`.
Varian navigasi/footer mempertahankan seluruh path serta ukuran root 161×60;
hanya warna tulisan RylVa/GREEN menjadi krem existing pada latar hijau.
Simbol dan lettering tidak digambar ulang. Tinggi render otomatis menjaga
proporsi sumber. Figma dibaca/diekspor tanpa perubahan pada desainnya.

Pada desktop/tablet, foto hero menutup tepi kiri bawah bidang seperti gambar 4.
Posisi memakai titik opak pada kaki pot, sehingga lengkungan bawah tidak
menyisakan strip bidang. Rasio foto, warna bidang dan konten slide dipertahankan.
Tiga pasangan anchor diukur pada foto existing, dengan acuan sudut kiri bawah
arch (left 36,7%, bottom 96% dari area gambar). Foto tetap utuh dan sedikit
melewati sisi/bawah bidang. Animasi masuk berasal dari kiri agar posisi awal
tidak membuka celah pada sudut tersebut.

Pada ponsel, komposisi tanaman di tengah bidang lebar, CTA penuh, pause atas
dan titik 20px yang sudah disepakati tetap dipertahankan. Koreksi overlap
mengikuti referensi desktop yang diberikan pengguna.

Wishlist pointer hover mengubah hanya border lingkaran menjadi `#963F5C`.
Ikon hati dan isi lingkaran mempertahankan state sebelum hover. Hati baru
terisi setelah produk disimpan; melepas hover tidak membatalkan pilihan.
Preferensi gerak dan fokus keyboard existing tetap berfungsi.

## Revisi autoplay manual dan Marigold

Pemilihan titik slide melalui pointer, sentuhan atau Enter memulai ulang jeda
6,5 detik dan mengizinkan autoplay berlanjut walaupun titik masih fokus.
Ini memperbaiki fokus sisa klik yang sebelumnya menghentikan rotasi terus.
Pause eksplisit tetap aktif saat pengguna memilih slide lain; tombol Resume
diperlukan untuk melanjutkannya. Fokus keyboard pada kontrol hero lainnya,
reduced motion, visibility, offscreen dan dialog tetap menjadi alasan jeda.
Pemilihan manual tidak memindahkan fokus dan tetap mengumumkan judul slide.

Focal motion tetap pergantian foto/palet yang sudah ada, tanpa animasi baru
di bagian lain. Pemilihan baru mereset timer; animasi foto sebelumnya dapat
diinterupsi dan aset selesai didekode sebelum mengganti konten. Budget tetap
satu transisi hero 650ms, lalu jeda 6,5 detik, tanpa dependensi animasi baru.

Slide keempat adalah MARIGOLD. Foto pengguna `4bf0ae30-27e8-4d8f-82da-8b1fc94bba06.png`
diedit Imagegen menjadi potongan transparan; bibir pot bawah yang semula
terpotong dilengkapi. Hasil WebP lokal mempertahankan rasio 1186×1327, dengan
sumber, prompt dan transformasi dicatat pada sidecar aset. Foto ini ilustrasi
hero dan tidak menambah produk, harga atau status stok ke katalog contoh.

Palet slide jingga hangat: `#FFF2DF` pada permukaan, `#F3BC70` pada bidang,
`#6C3718` pada teks dan `#8C441B` pada CTA/indikator. Deskripsi: “Jingga yang
hangat, kuning yang cerah. Kelopak Marigold yang rimbun memberi sentuhan ceria
pada teras dan sudut taman Anda.” Teks menjelaskan karakter visual foto tanpa
menambah klaim perawatan atau manfaat yang belum diverifikasi.

CTA “Jelajahi Koleksi Bunga” memakai dialog koleksi outdoor existing.
Empat titik sekarang mewakili Monstera, Calathea, Petunia dan Marigold,
masing-masing berlabel. Anchor Marigold menutup kiri/bawah bidang desktop;
ponsel tetap menempatkan foto di tengah bidang dengan CTA 48px selebar bidang,
pause di atas dan indikator di bawah. Logo, kartu dan navigasi dipertahankan.
