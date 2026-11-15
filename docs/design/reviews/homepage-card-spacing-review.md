disposition: ship

Input terbatas: tidak ada QUALITY BAR terpisah. Review dilakukan inline,
melanjutkan fallback reviewer sebelumnya yang mencapai batas penggunaan.
Ini bukan audit independen atau penutupan quality gates historis.

## persistence

Pass untuk koreksi kartu desktop/mobile, logo terang dan badge keranjang
ponsel. PRODUCT.md tetap menjadi acuan produk. DESIGN.md mencatat daun dan
kelopak krem serta posisi badge; surface brief mencatat alignment dan ruang
yang diminta. Sumber desain tetap Home page rev, dengan empat screenshot
pengguna terbaru sebagai otoritas koreksi. Build code-led dan FORM tetap
`seed: none (pinned)`; tidak ada comp round baru yang diklaim.

Bukti berada di `.impeccable/review/homepage-card-spacing/`: desktop.png,
mobile.png dan user-320.png merupakan render penuh yang dimulai dari atas.
Capture rekomendasi desktop/mobile dan header menunjukkan area yang dinamai,
tanpa area hitam, aset gagal atau konten salah. Inventaris acuan pengguna:
kartu horizontal desktop dengan foto kiri, judul/status/deskripsi kanan,
harga dan tindakan bawah; grid vertikal dua kolom pada ponsel; label harga
lama merah; ikon hati/keranjang; logo serta jumlah keranjang pada navigasi.

Pemeriksaan yang tersedia: empat kelompok geometri pada delapan lebar
320–1920px, delapan kelompok refinements/interaksi dan enam kelompok regresi
dasar/15 skenario. Seluruh laporan memiliki errors kosong. Pemeriksaan
geometri mencakup urutan konten, posisi harga/divider, jarak, input ekstrem,
logo yang benar-benar dilayani server, serta badge pada tiga halaman lain.
Tidak ada detector kedua atau pemeriksaan perangkat fisik yang diklaim.

## fidelity

| Elemen | Penilaian | Bukti dan otoritas |
| --- | --- | --- |
| TYPE | match | Keluarga Poppins, ukuran/bobot nama dan harga utama dipertahankan. Harga coret menjadi 12px sesuai permintaan. Judul desktop maksimal dua baris; nama ponsel rata tengah. |
| MATERIAL | match | Foto produk dan normalisasi existing tetap dipakai. Badge -17%/Tersedia, ikon hati dan keranjang mempertahankan bentuk serta warna. Tidak ada bitmap produk baru. |
| GROUND | match | Palet krem/hijau, putih kartu, merah diskon dan garis netral dipertahankan; tidak ada gradien atau perubahan suhu permukaan. Penilaian visual, bukan pengukuran pixel baru. |
| Judul/deskripsi desktop | match | Area judul dua baris menghasilkan titik awal deskripsi yang sejajar, termasuk Lidah Mertua, Aglaonema dan Dracaena. Teks panjang dibatasi tanpa mengubah isi pada label/detail. |
| Tindakan desktop | adaptation | Hati 36px dan keranjang 44px sebaris di kanan bawah dengan gap 8px. Ini menerapkan koreksi jarak dan mengurangi susunan bertumpuk. Label Detail Produk tetap lengkap; pada container sempit ikon pendamping disembunyikan agar label tidak terbungkus. |
| Harga lama | match | Teks merah 12px, line-height 18px dan garis coret merah. Slot 18px juga ada pada produk tanpa diskon, kosong dan aria-hidden, tanpa menambahkan harga fiktif. |
| Nama dan harga ponsel | match | Nama di tengah, tinggi mengikuti isi hingga dua baris. Jarak area judul ke harga 10px; harga utama dan divider sejajar pada setiap pasangan kartu. Slot harga lama dan subgrid menjaga alignment saat satu nama membungkus. |
| Kepadatan/tindakan ponsel | match | Foto, judul, harga dan tombol tersusun berurutan tanpa tumpang tindih. Jarak harga ke divider, padding divider ke tombol dan padding bawah masing-masing 10px. Kedua target tindakan tetap 44px dan dapat dipakai terpisah. |
| Logo terang | adaptation | Kelopak yang sebelumnya gelap kini krem bersama daun; garis sage mempertahankan detail kelopak. Wordmark dan path asli tidak diganti. Varian diterapkan pada dua SVG bersama, sesuai permintaan navigasi/footer. Logo hero tetap tersendiri. |
| Badge jumlah keranjang | match | Pada ponsel, badge berada di dalam tombol dengan offset top/right 2px dan bertumpang di sudut ikon. Angka 2 dan 99+ lolos pemeriksaan posisi; tidak ada offset negatif desktop yang terbawa. |
| Komponen bersama dan interaksi | match | Keranjang, Akun dan Pesanan Saya menampilkan logo terang serta badge yang melekat. Tap kartu, wishlist/keranjang, keyboard, pemulihan fokus, overlay dan autoplay tetap lulus. Tidak ada endpoint baru atau perubahan data bisnis. |

THESIS, OWN-WORLD dan STORY dipertahankan. FIRST VIEWPORT tetap hero yang
disepakati; perubahan terbaru berada pada kartu dan aset/posisi header yang
diminta. Pada layar sempit, pasangan dengan satu nama dua baris tetap berbagi
tinggi baris judul; ruang tersebut diperlukan untuk harga sejajar dan tidak
berasal dari margin kosong tambahan. Slot harga lama kosong juga disengaja
sesuai permintaan alignment. Tidak ada kontradiksi material tersisa dalam
ruang lingkup ini.

## ceiling

Reached untuk koreksi komponen yang dipin: deskripsi dan harga rata, jarak
terukur, nama ponsel terpusat, label harga lama terbaca, logo terang dan badge
terikat pada ikon. Tidak ada penilaian world-ceiling independen tanpa QUALITY
BAR. Data katalog/wishlist tetap pratinjau; temuan global historis tetap
mengikuti coverage dan homepage-quality-gates.md.

## material_fixes

Tidak ada pada ruang lingkup revisi ini. `ship` tidak menyatakan backend,
transaksi produksi atau seluruh quality gates telah selesai.

## keep

Pertahankan foto/palet/tipografi/badge existing, alignment berbasis baris, slot harga lama yang jujur, target tindakan yang terpisah, logo krem dan badge jumlah yang melekat di dalam tombol.
