# Renderer komposisi Korean Bouquet

Renderer DOM 2D untuk `/pages/customer/bouquet-customizer.html`. Implementasi: `public/assets/js/storefront/bouquet-composition.js`; gaya berada dalam `bouquet-customizer.css`.

## Kontrak

`createLayout(options, selections)` mengembalikan posisi bunga, daun belakang, filler, daun depan, lebar pembungkus, posisi kerah/pita dan faktor penyesuaian bidang. Fungsi ini tidak menghitung harga, mengubah jumlah pesanan, atau menyimpan konfigurasi.

`render(options, selections, sprite)` menghasilkan markup enam kelompok DOM. Helper sprite lama digunakan untuk daun dan baby's breath; bunga utama dan kemasan menggunakan aset transparan terpisah.

Bidang koordinat virtual berukuran **420 × 600**. CSS menskalakannya ke stage desktop/mobile/zoom. Track grid stage menggunakan `minmax(0, 1fr)` agar ukuran virtual tidak memperbesar baris dan memotong ekor pita. Komposisi paling tinggi mendapat faktor fit tambahan.

## Enam lapisan

| Z-index | Kelompok | Material dan perilaku |
| --- | --- | --- |
| 1 | Back wrapper | Foto kertas sage berbentuk kipas dengan puncak tidak sejajar; lebar mengikuti kepadatan bunga. Brightness 0,94. |
| 2 | Back foliage | Eucalyptus mengarah ke kiri, kanan dan atas, dengan bagian ujung melewati siluet kertas. Brightness 0,92. |
| 3 | Focal flowers | Mawar merah/putih dari tiga sudut pandang per warna. Diurutkan menurut Y sehingga bagian lebih rendah berada di depan. |
| 4 | Filler & front foliage | Baby's breath ditempatkan di kandidat celah antar bunga terdekat; eucalyptus depan diselipkan di tepi rangkaian. |
| 5 | Front collar & tissue | Foto lipatan sage dan tisu putih yang independen dari kertas belakang. Menutupi pangkal bunga bawah dan memberi bayangan ke bidang di belakangnya. |
| 6 | Ribbon | Pita satin krem dengan dua juntaian tidak sama panjang, mengikuti titik ikatan di bawah kerah. |

Kelompok daun/filler/pita tidak menggambar bahan yang belum dipilih. Tisu putih merupakan bagian ilustrasi kemasan yang diminta pengguna; tidak dibuat sebagai pilihan berbayar atau konsumsi material baru.

## Penempatan organik

- Tidak memakai grid, lingkaran atau golden-angle spiral. Slot adalah koordinat kubah melebar yang dikurasi secara asimetris, dengan variasi horizontal/vertikal terkontrol.
- Hash deterministik per ID opsi dan urutan visual menentukan jitter, pose, ukuran dan rotasi. Susunan yang sama tidak berubah saat jumlah buket, catatan, harga atau kategori yang dibuka berubah.
- Rotasi berada dalam **−25° sampai +25°**. Sisi kiri condong ke kiri, sisi kanan ke kanan; bagian tengah memiliki variasi kecil.
- Skala berada dalam **0,85 sampai 1,15**. Bunga lebih rendah mendapat kecenderungan skala lebih besar untuk perspektif.
- Z-index lokal bunga mengikuti koordinat Y; warna tidak digambar dalam dua blok terpisah.
- Kepadatan vertikal disesuaikan ketika bunga bertambah agar pangkal tetap bertemu kerah.
- Kandidat filler berasal dari titik tengah pasangan bunga terdekat dan diberi jitter. Filler tidak ditambahkan jika bahan tersebut tidak dipilih.
- Posisi kerah mengikuti tepi bunga terendah. Kertas belakang diskalakan pada jangkar leher aset0,76 dan pita pada jangkar simpul0,20 agar keduanya bertemu di tieY yang sama. Lipatan bawah kertas belakang tetap terlihat melewati ujung kerah depan; tinggi bidang600 memberi ruang bagi ujung pembungkus serta juntaian pita.
- Batas visual tetap maksimal 12 kepala per opsi dan 24 kepala total. Ini pembatasan ilustrasi, bukan perubahan jumlah paket/tangkai yang dibeli; ringkasan pilihan adalah sumber kuantitas.

## Kedalaman dan pencahayaan

Setiap kepala mawar memakai PNG ber-alpha, bukan potongan persegi dari foto bertangkai. Tiga pose per warna membantu menghindari pengulangan satu sudut pandang. Filter brightness menggelapkan bagian belakang; drop-shadow ber-offset dan blur kecil memberi occlusion antarkelopak. Tisu dan kertas depan mempunyai bayangan tersendiri.

Animasi masuk hanya mengubah opacity sehingga tidak menimpa filter brightness/drop-shadow. Preferensi reduced motion menonaktifkan animasi. Tidak ada blur atau bayangan besar untuk menutupi kesalahan penempatan.

## Aset dan provenance

Aset dibuat memakai **built-in image_gen**, disimpan di `public/assets/images/bouquet/korean/`:

| Berkas | Isi |
| --- | --- |
| `rose-heads.png` | Atlas 3 kolom × 2 baris: tiga pose merah, tiga pose putih. |
| `back-wrapper.png` | Kertas belakang kipas tinggi. |
| `front-collar.png` | Lipatan depan sage dan kerah tisu putih. |
| `ribbon.png` | Pita krem dengan juntaian panjang. |
| `provenance.json` | Mode/tool dan prompt lengkap setiap aset. |

Prompt juga tertanam dalam metadata PNG. Pemindaian seluruh folder buket menemukan 6 raster dengan 0 provenance hilang. Pengujian membaca alpha raster aktual dan memastikan sudut transparan serta tisu putih tersedia pada aset depan.

Pratinjau bersifat ilustratif. Tidak ada foto referensi pengguna, identitas florist lain, atau klaim hasil produksi yang dimasukkan sebagai produk.

## Pemuatan dan pemulihan

Controller memuat semua aset yang diperlukan setelah editor boleh diakses. Saat menunggu, stage menyampaikan bahwa rangkaian sedang disiapkan. Kegagalan satu aset menampilkan fallback yang jujur; pilihan dan harga tetap dapat digunakan. Coba muat gambar mengulang seluruh aset komposisi tanpa menghapus input.

## Pemeriksaan

`verify-bouquet-composition.cjs` memeriksa urutan enam lapisan, alpha aset, tisu putih, arah kipas, batas rotasi/skala, tiga pose, sorting Y, perspektif, stabilitas seed, bahan opsional, filter yang benar-benar dirender, pertemuan bunga dengan kerah, kondisi 24 kepala pada lima lebar layar, ujung pita, kegagalan aset, retry, dan reduced motion.

Suite alur buket dan suite carousel tetap menjadi regresi terpisah. Bukti render dan hasil tersimpan di `storage/reports/bouquet-korean/`. Tidak ada perubahan pada harga, aturan akses, keranjang, checkout, atau backend produksi.


## Koreksi ujung pembungkus — 17 November 2026

Bagian bawah sebelumnya tampak terputus karena leher kertas belakang dan simpul pita memakai titik ikat yang berbeda, sehingga kerah depan menutup kelanjutan kertas. Kini tinggi kertas belakang dihitung dari tieY yang sama dengan simpul pita. Foto/aset tidak diubah. Bidang virtual diperpanjang ke600 dan skala disesuaikan; ukuran panel UI tetap sama.

Pengujian menegakkan bahwa bagian bawah kertas terlihat melewati kerah depan setidaknya20px pada ukuran layar yang diuji, simpul dan leher berimpit dalam toleransi1px, serta ujung kertas/pita mempunyai ruang aman8px dari batas stage. Pemeriksaan ini dijalankan pada komposisi maksimum di320/390/768/1440/1920px. Suite renderer dan layout masing-masing lulus5 kelompok tanpa pageerror. Bukti visual tambahan: storage/reports/bouquet-wrapper-finish.
