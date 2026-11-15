disposition: ship

Input terbatas: tidak ada QUALITY BAR terpisah. Peninjauan dilakukan inline,
melanjutkan fallback setelah reviewer terpisah sebelumnya mencapai batas
penggunaan. Ini bukan penilaian independen atau audit ulang quality gates.

## persistence

Pass pada ruang lingkup koreksi Homepage dan tambahan mobile hero slider.
PRODUCT.md tetap menjadi acuan produk; DESIGN.md mencatat varian logo terang
yang diminta pengguna. Surface brief mencatat perubahan kartu, kategori,
foto, breakpoint dan kontrol hero. Katalog, harga dan stok tidak ditambah
klaim baru. Sumber tetap Figma Home page rev 466:386 dengan koreksi pengguna
sebagai otoritas terbaru. Build code-led, FORM `seed: none (pinned)`;
comp round dan comp-diff baru tidak berlaku.

Capture valid pada `.impeccable/review/homepage-hierarchy/`: desktop.png,
mobile.png, user-320.png, laptop.png, mobile-products.png, wishlist-filled.png,
hero-calathea-mobile.png, hero-petunia-mobile.png, cart-header.png dan
account-footer.png. Capture penuh dimulai dari atas; capture bagian menampilkan
area yang dinamai. Tidak ada area hitam, placeholder atau gambar gagal pada
bukti normal. Sebelas screenshot pengguna disimpan sebagai user-01 sampai
user-11; yang terakhir meminta CTA penuh, pause kanan atas dan titik di tengah.

Inventaris acuan: identitas botani krem/hijau; kartu desktop dengan foto di
kiri dan nama/status di kanan; kartu ponsel dua kolom; status di sudut foto;
harga dengan satuan; wishlist dan keranjang; serta hero dengan logo, nama,
bidang berwarna dan tanaman, CTA pill dan kontrol pergantian. Acuan terbaru
mengganti penempatan hati/detail dan kontrol hero dari hasil sebelumnya.

Sumber yang disampel: homepage.css, homepage.js, homepage-hero.js serta dua
SVG logo. Laporan browser refinements delapan kelompok dan regresi dasar
enam kelompok memiliki errors kosong. asset-layout.json memuat pemeriksaan
batas foto, tiga hero terpusat, dua harga ekstrem dan logo pada dua halaman
lain. Screenshot akhir memakai motion normal untuk memperlihatkan pause;
prefers-reduced-motion memiliki pemeriksaan sendiri. Tidak ada detector kedua.

## fidelity

| Elemen | Penilaian | Bukti dan otoritas |
| --- | --- | --- |
| TYPE | match | Poppins dipertahankan. Nama ponsel 17px/bold; desktop 18–23px/bold dengan nama yang tersedia tetap utuh dan membungkus antar kata. Harga utama lebih besar dan bold. Nama lengkap tetap ada pada label detail. |
| MATERIAL | adaptation | Aset foto existing dipertahankan. Ruang transparan dinormalisasi berdasarkan batas objek agar gambar tidak kecil akibat padding sumber. Tidak ada produk baru, distorsi atau pemotongan siluet; bentuk lebar/ramping tetap memiliki proporsi alami. Ini mengikuti permintaan menjadikan Calathea acuan. |
| GROUND | match | Krem RylVa, putih kartu, sage hero dan bidang pink Petunia tetap konsisten dengan sumber dan arahan sebelumnya. Ini penilaian visual; tidak ada klaim pengukuran pixel baru. |
| Logo navigasi/footer | adaptation | Bidang daun menjadi krem terang dalam dua SVG bersama, dengan garis dan geometri dipertahankan. cart-header.png dan account-footer.png menunjukkan penerapan pada halaman lain sesuai perubahan aset bersama yang diminta. Logo hero berwarna tetap tersendiri. |
| Nama dan stok desktop | match | Badge menempati kolom kanan atas heading dan tidak turun mengikuti judul. Nama dikenal dibungkus antar kata, diverifikasi pada tujuh viewport. Pada laptop hingga 1400px, dua kolom mencegah judul sempit serta menjaga empat kartu terbagi rata. |
| Hierarki hati/keranjang | match | Hati desktop 36px di atas keranjang 44px; warna solid keranjang tetap dominan. Di ponsel keduanya 44px pada baris tindakan. Hati aktif benar-benar terisi. |
| Detail kartu ponsel | match | Teks Detail dihilangkan; tombol detail berlabel meliputi kartu. Tap/Enter membuka detail, Escape memulihkan fokus. Wishlist dan keranjang berada di lapisan tersendiri dan tidak memicu detail. Tidak ada tombol bersarang. |
| Status ponsel | match | Badge stok berada di kanan atas foto dan diskon di kiri atas. Label teks tetap menyertai warna. Heading tidak lagi memuat badge di bawah nama. |
| Harga, satuan dan diskon | match | Harga/pot sebaris pada ponsel; harga lama dan garis coret merah pada kedua ukuran perangkat. Nilai ekstrem tetap dalam kartu, harga yang tidak tersedia dapat membungkus dan memiliki tindakan sesuai state. |
| Kategori | adaptation | Nama/keterangan desktop satu baris; ponsel memakai rail horizontal untuk mempertahankan nama utuh. Foto kategori dan tujuan kontrol dipertahankan. Ini menanggapi koreksi terhadap baris label yang tidak seragam. |
| Logo dan objek hero | match | Tepi grup logo sejajar dengan teks. Bidang arch ponsel melebar; objek berada di tengah berdasarkan batas transparansi. Tiga tema diperiksa, termasuk Calathea dan Petunia pada capture terpisah. |
| CTA hero ponsel | match | CTA pill selebar bidang gambar, rata kiri-kanan, dengan tinggi minimal 48px. Aturan berlaku untuk ketiga slide. |
| Pause dan titik indikator | match | Pause 44px berada di kanan atas pada baris logo tanpa bertabrakan. Tiga titik di tengah bawah dengan jarak visual 20px dari CTA; hit area titik tetap 44px. |
| Interaksi carousel | match | Timer 6,5 detik benar-benar berpindah, Jeda/Lanjutkan dan pemilihan manual berfungsi. Reduced motion, fokus keyboard, tab tersembunyi, offscreen dan panel/dialog tetap ditangani. Gerak masuk memakai translate terpisah agar posisi pusat objek tidak bergeser saat animasi. |
| Pola global dan data | match | Layout/routing shell, adapter keranjang, state gagal dan konteks koleksi dipertahankan. Wishlist tetap contoh dalam memori. Tidak ada endpoint atau integrasi produksi baru yang diklaim. |

THESIS, OWN-WORLD dan STORY tetap dipertahankan. FIRST VIEWPORT diadaptasi
pada ponsel menurut arahan terbaru: logo/pause, judul/deskripsi, objek dalam
bidang lebar, CTA penuh, lalu titik. Tidak ada kontradiksi material tersisa
dalam ruang lingkup revisi yang diperiksa.

## ceiling

Reached pada revisi yang dipin: hierarki nama/harga, target sentuh, kontrol
hero yang terpisah, konsistensi pengisian foto dan identitas botani terjaga.
Tanpa QUALITY BAR terpisah, ini bukan skor independen. Audit historis, data
produk produksi dan integrasi backend tetap memiliki batas yang dicatat
pada coverage; tidak dinyatakan lulus oleh review ini.

## material_fixes

Tidak ada pada ruang lingkup ini. Disposition `ship` berlaku untuk koreksi
UI yang diminta, bukan untuk kesiapan transaksi produksi atau penutupan
quality gates historis.

## keep

Pertahankan kartu ponsel dua kolom dengan detail melalui kartu, tindakan independen 44px, foto utuh terpusat, hierarki harga/nama, varian logo krem dan tiga hero dengan CTA penuh serta kontrol yang dapat dijeda.
