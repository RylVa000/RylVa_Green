# Buket Kustom — spesifikasi halaman pelanggan

Tanggal: 17 November 2026. Nama permintaan: **Buket Costum**. Istilah UI yang disarankan: **Buket Kustom**, mengikuti header dan dokumen bisnis proyek.

**Status:** spesifikasi untuk desain dan implementasi berikutnya; halaman belum dibangun dalam pekerjaan ini. **Keputusan pengguna:** pratinjau tersusun otomatis berdasarkan pilihan. Drag & drop tidak masuk versi awal.

Penanda: **Fakta** berasal dari sumber yang diperiksa; **Keputusan pengguna** sudah dikonfirmasi; **Usulan** adalah rancangan yang belum diimplementasikan; **Asumsi perlu dikonfirmasi** menandai dependensi/ketidakpastian.


## Status implementasi UI — 17 November 2026

UI tersedia pada `/pages/customer/bouquet-customizer.html`, menggunakan susunan frame Figma 454:1201 dan shell RylVa. Detail implementasi, sumber fixture, pengujian, serta batas backend dicatat di [cakupan UI](../../coverage/bouquet-customizer-ui.md). Informasi kondisi awal dalam tabel sumber di bawah adalah hasil pemeriksaan sebelum implementasi; kini kontrak keranjang pratinjau telah mendukung konfigurasi dan edit. Tidak ada klaim layanan produksi sudah aktif.

## Direction contract

THESIS: Pilihan bunga langsung membentuk komposisi ilustratif dan harga yang dapat diperiksa, tanpa kanvas drag manual.

OWN-WORLD: Fondasi RylVa terkunci: Poppins, krem dan hijau botani, shell yang sama, kontrol membulat 44–48 px. Panel sage menampung pilihan dan harga, bukan identitas baru.

STORY: Pelanggan masuk, meracik bunga/pembungkus/pita, memeriksa paket dan jumlah buket secara terpisah, lalu menyimpan konfigurasi ke keranjang.

FIRST VIEWPORT: Desktop tiga kolom: rail kategori 182 px, preview tengah yang fleksibel, panel pilihan maksimal 354 px. Judul 28–36 px, section 18 px. Ringkasan pilihan di bawah preview, rincian harga dapat dibuka, aksi utama melekat pada panel; mobile memakai node aksi yang sama di bawah layar.

FORM: seed: none (pinned), “Samakan dengan desain figma” dan “Otomatis dari pilihan”. Struktur frame 454:1201 diterjemahkan ke layout native dan data master yang tersedia.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## 1. Pemahaman dan cakupan halaman

### Tujuan dan pengguna

Pelanggan meracik produk yang mendukung kustomisasi, memahami komposisi dan tambahan harganya, melihat preview otomatis, lalu menambah konfigurasi sah ke keranjang. Saat dibuka dari keranjang, pelanggan mengubah konfigurasi item yang tepat.

Hasil berhasil adalah **konfigurasi masuk/diperbarui di keranjang**, bukan pesanan dibuat, stok dicadangkan, pembayaran berhasil, atau produksi dimulai.

Jenis halaman: **area pelanggan, mode Operate**. Desktop menjadi fokus rincian workspace; tablet/mobile tetap direncanakan karena PRODUCT.md menetapkan web yang mendukung perangkat seluler. Tidak meredesain halaman lain.

### Sumber dan kondisi yang ditemukan

| Sumber | Bukti dan kedudukannya |
| --- | --- |
| [Spesifikasi v2.6](../../specifications/spesifikasi-proyek-v2.6.md), 6.1–6.4, 19, 26.1–26.8, 27.2–27.8 | Otoritas bisnis: login, pilihan/harga/material, keranjang, snapshot, kuantitas, pengiriman dan prioritas modul. Bagian 26 khusus buket; bagian 27 memperjelas varian/satuan/persediaan. |
| [PRODUCT.md](../../../PRODUCT.md), [DESIGN.md](../../../DESIGN.md) | Pengguna, Bahasa Indonesia, Poppins, krem/hijau, perangkat dan fondasi interaksi. |
| [Figma, frame 454:1201 dalam Costum Buket 454:1347](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU?node-id=454-1201) | Screenshot dan metadata diperiksa: frame 1920×1200, navigasi kategori kiri, preview tengah, opsi/harga/CTA kanan, ringkasan bawah. |
| [SQL aktual](../../../database/schema/DB_RylVa_Green.sql) | Model kategori/opsi, kuantitas, metadata, hash, snapshot dan enam seed opsi. Teks SQL bukan bukti database sudah diimpor/layanan aktif. |
| [Modul Buket & Produksi](../../coverage/bouquet-production-coverage.md), [fixture admin](../../../public/assets/js/staff/production/bouquet-data.js) | Editor/simulasi admin sudah ada, tetapi data serta mutasi contoh per tab belum terhubung ke storefront. |
| [Template pelanggan](../../../templates/customer/bouquet_customizer.php), bouquet-customizer.js/css, layanan PHP buket | Masih scaffold/komentar; belum ada halaman pelanggan aktif atau kalkulator/server customer yang dapat dinyatakan berfungsi. |
| [Konva arsip](../../../tools/archive/prototypes/tes.html) | Eksperimen drag bunga berbentuk sederhana; bukan keputusan editor produksi. |
| Katalog, Detail Produk, Keranjang, Checkout dan autentikasi aktif | Shell dan UI pratinjau dapat dipakai ulang. Adapter keranjang belum mendukung tambah/edit konfigurasi buket nyata. |

### Hak akses

**Fakta:** bagian 26.1 mensyaratkan pelanggan sudah login untuk memilih/menyimpan konfigurasi. Bagian6.3.2 hanya mengizinkan akun Aktif untuk login. Katalog/detail tetap publik. Cek ongkir guest pada Detail Produk tidak memperluas akses konfigurator.

| Pengguna/kondisi | Melihat konteks publik | Mengubah/menyimpan konfigurasi |
| --- | --- | --- |
| Guest | Katalog/detail; gate singkat saat masuk editor | Tidak sebelum masuk; returnTo internal yang aman |
| Pelanggan aktif terautentikasi | Ya | Ya, untuk produk/pilihan yang sah dan keranjang miliknya |
| Belum terverifikasi/nonaktif | Mengikuti akses publik | Ikuti alur verifikasi/login/penanganan akun yang ada; bukan OTP tambahan buatan editor |
| Sesi staf saja | Akses publik | Tidak dianggap sesi pelanggan; namespace akun terpisah |
| Konfigurasi bukan milik akun | Tidak menerima isi privatnya | Ditolak server, bukan sekadar tombol disembunyikan |

**Termasuk:** produk dasar/varian bila diperlukan, kelompok dinamis, pilihan dan jumlah opsi, jumlah buket, preview otomatis, ringkasan/harga, validasi, kartu/catatan yang didukung, tambah/edit keranjang, navigasi dan pemulihan.

**Di luar versi awal:** drag/rotasi objek, unggah foto pelanggan, AI generator, share/download desain, wishlist desain, penyimpanan desain permanen, jadwal/kapasitas produksi baru, pembayaran langsung, dan pengelolaan master admin.

### Konflik sumber dan keputusan

| Perbedaan | Dampak rancangan |
| --- | --- |
| Figma memakai “floret.”, Inggris dan shell sendiri | Ikuti komposisi kerja yang relevan; gunakan RylVa, Bahasa Indonesia dan shell aktif. |
| Preview/thumbnail Figma berupa bidang abu-abu | Jangan menganggap aset komposisi tersedia. Paket aset/renderer menjadi dependensi; fallback teks wajib. |
| Figma memiliki Flowers/Foliage/Wrapping/Ribbon/Vase dan lima warna | Kelompok/warna harus berasal dari relasi produk aktif; tidak menambahkan vas/palet yang datanya belum ada. |
| Figma memakai harga per batang; SQL memiliki paket lima tangkai | Jumlah opsi harus mengikuti kemasannya; jumlah buket dipisahkan. |
| Seed opsi ada, relasi kategori_pilihan_produk dan produk publik BUKET_KUSTOM belum ditemukan siap pakai | Jangan memuat semua opsi global untuk setiap produk atau mengklaim konfigurasi publik sudah siap jual. |
| Harga/aturan demo admin berbeda dari seed SQL | Jangan menggabungkan sumber menjadi master baru secara diam-diam. Fixture frontend berikutnya harus konsisten dan diberi label contoh. |
| Keranjang mengenal ringkasan konfigurasi tetapi adapter menyamakan produk/varian | Perlu jalur item berkonfigurasi dan hash kanonis; add produk standar belum cukup. |

## 2. Struktur dan isi halaman

### Susunan desktop

**Usulan:** shell yang sama, container dibatasi dan terpusat, kanvas krem. Frame1920 tidak disalin sebagai lebar tetap.

1. Header/navigasi storefront yang ada.
2. Breadcrumb dan kembali sesuai titik masuk.
3. Judul “Buket Kustom”, nama produk dasar, instruksi singkat, varian/satuan dan ketentuan penanganan.
4. “Pilih dasar buket” bila masuk dari menu umum dan terdapat beberapa produk. Jika konteks produk sudah diketahui, langsung ke workspace. Ganti produk tidak membuang draft tanpa konfirmasi.
5. Tiga zona: navigasi kelompok kiri; preview otomatis tengah; opsi dan ringkasan tindakan kanan.
6. Ringkasan **semua** opsi terpilih di bawah preview.
7. Kartu/catatan yang didukung, jumlah buket, rincian harga dan CTA mudah dijangkau. Panel panjang dibagi section/accordion; tindakan boleh sticky dalam batas workspace.
8. Footer tetap dapat dicapai tanpa tertutup panel.

Proporsi awal untuk diuji: kiri sekitar 180–200 px, kanan 320–360 px, tengah memakai sisa. Turun menjadi dua kolom sebelum teks/target klik terpaksa mengecil.

| Bagian | Isi minimum | Alasan penempatan |
| --- | --- | --- |
| Konteks produk | Nama, produk/varian, gambar dasar bila ada, satuan, harga dasar dan penanganan | Dasar harga dan barang yang diracik jelas |
| Navigasi kelompok | Nama, wajib/opsional, ringkasan pilihan, belum lengkap/bermasalah | Progres terlihat tanpa membuka semua panel |
| Opsi | Nama, deskripsi pendek, gambar bila ada, unit, tambahan harga, batas dan alasan unavailable yang aman | Tidak salah menafsirkan paket/batang atau ketersediaan |
| Pilihan tunggal/banyak | Radio atau checkbox semantik; qty terpisah jika diizinkan | Mengikuti aturan efektif, bukan bentuk kartu semata |
| Preview | Komposisi otomatis dan ringkasan teks setara | Visual bukan sumber harga atau janji susunan persis |
| Ringkasan pilihan | Kelompok, opsi, kuantitas/unit, tambahan/subtotal, ubah/hapus | Pemeriksaan keseluruhan konfigurasi |
| Harga | Dasar, tambahan, harga per buket, jumlah buket, subtotal produk | Tidak disalahartikan sudah termasuk ongkir |
| Pengiriman | Ketentuan dari jenis_penanganan | Alamat/kurir/jadwal tetap di Checkout; tidak membuat alamat utama |
| Tindakan | Reset Buket, kembali, Tambah ke Keranjang atau Simpan Perubahan | Satu CTA utama sesuai konteks |

Nama panjang membungkus. Harga hilang bukan nol. Kelompok kosong dibedakan dari gagal memuat. Gambar gagal tidak menghilangkan nama/harga atau alasan unavailable.

### Preview otomatis

**Keputusan pengguna:** pilihan langsung memperbarui preview, tanpa menyusun objek secara manual.

**Usulan:** renderer deterministik berdasarkan template produk dan aset yang diizinkan. Bila berupa komposit, layer/anchor serta pemetaan opsi didokumentasikan. Kuantitas mengubah visual hanya jika metadata kemasan/unit tersedia; jangan menebak isi paket dari nama.

Kunci gambar pada enam seed opsi bernilai NULL. Sebelum aset tersedia, tampilkan ringkasan teks dan “Pratinjau visual belum tersedia untuk pilihan ini”. Foto produk dasar boleh menjadi ilustrasi dengan keterangan. Bentuk lingkaran/bintang Konva bukan foto buket yang dijual. Kegagalan renderer tidak mengubah pilihan/harga.

### Tablet/mobile

**Usulan:** tablet dua kolom dan navigasi kelompok ringkas. Mobile: konteks → preview → kelompok/opsi → ringkasan → catatan → jumlah buket. Accordion dapat dipakai; urutan fokus mengikuti urutan visual.

Bar bawah memakai subtotal dan **CTA yang sama**, bukan duplikat handler. Perhitungkan tinggi aktual/safe area untuk ruang halaman. Rincian panjang boleh dibuka melalui ringkasan, tetapi pengguna tidak dipaksa membuka dialog untuk setiap pilihan.

## 3. Alur penggunaan

### Titik masuk

Menu Buket Kustom, koleksi florist, detail produk BUKET_KUSTOM, tautan produk/varian sah, Ubah Konfigurasi dari keranjang, dan kembali dari autentikasi/pemulihan.

**Route UI usulan:** /pages/customer/bouquet-customizer.html. Alias/parameter diselesaikan saat implementasi; route belum tersedia. Dokumen tidak mengarang endpoint HTTP.

Guest melihat “Masuk untuk meracik buket”, konteks publik aman, Masuk dan Kembali ke Produk/Katalog. Gunakan autentikasi yang ada, tanpa meminta alamat.

### Alur baru

1. Validasi sesi dan produk; muat varian, kelompok, opsi serta aturan yang benar-benar terkait.
2. Gunakan default hanya jika berasal dari master yang sah. Jika tidak, mulai kosong; jangan otomatis memilih opsi berbayar pertama.
3. Pilih opsi: preview/ringkasan langsung berubah; harga server diperbarui tanpa Terapkan.
4. Panduan wajib/minimum tampil sejak awal; error ditegaskan setelah interaksi atau percobaan melanjutkan.
5. Lengkapi metadata yang didukung dan jumlah **buket**.
6. Quote terbaru menampilkan harga/ketersediaan; CTA belum aktif jika quote tidak sesuai draft.
7. Add memvalidasi ulang kepemilikan, aturan, versi, bahan, harga dan batas jumlah.
8. Sukses menampilkan jumlah/ringkasan/subtotal yang diterima server serta Lihat Keranjang. Tidak membuat pesanan atau reservasi.

### Edit dari keranjang

Muat item milik akun dan revisinya. Perubahan tetap draft sampai Simpan Perubahan. Batal tidak mengubah item tersimpan. Jika konfigurasi hasil edit sama dengan item lain, merge dilakukan atomik sesuai hash/batas; UI menjelaskan baris dan jumlah akhirnya.

Item dihapus/berubah di tab lain tidak boleh ditimpa atau dibuat ulang sebagai item baru diam-diam. Tawarkan muat terbaru/tinjau atau mulai konfigurasi baru secara eksplisit.

### Kembali dan pemulihan

- Simpan konteks asal yang aman: produk, filter/pencarian, urutan, loaded count, gulir dan fokus yang relevan.
- Ikuti pola Detail Produk; helper navigasi saat ini khusus katalog/detail dan perlu perluasan whitelist yang disengaja untuk editor/keranjang.
- Berpindah kelompok/pencarian tidak menghapus pilihan.
- Kembali saat kotor: “Perubahan buket belum dimasukkan ke keranjang.” Tindakan Lanjut Mengedit dan Buang Perubahan.
- Reset Buket/ganti dasar meminta konfirmasi bila membuang pilihan/catatan. Reset Filter hanya mengubah hasil pencarian.
- Offline/gagal quote/add mempertahankan seluruh draft di tab. Jangan mengklaim tersimpan tanpa respons sah.
- Sesi habis memblokir mutasi dan mempertahankan editor. Pemulihan lintas login perlu mekanisme bagian 10/12.
- Tidak menjanjikan tab tertutup selalu pulih. Guard internal/beforeunload tidak boleh menjebak Back.

## 4. Komponen dan interaksi

| Komponen | Perilaku/state | Pemakaian kembali/baru |
| --- | --- | --- |
| Shell/breadcrumb/kembali | Navigasi aman, konteks/fokus pulih | Storefront aktif; shell tidak diganti |
| Pemilih dasar/varian | Produk eligible; perubahan yang membuang draft dikonfirmasi | Pola katalog/detail; jangan memakai canBuy berbasis stok SKU langsung untuk bahan buket |
| Navigasi kelompok | Memilih section, ringkasan dan status tetap ada | Pola section/accordion; isi dari master |
| Kartu opsi | Radio/checkbox, nama/unit/harga/alasan selalu terbaca | Komponen opsi baru karena kontraknya bukan produk standar |
| Stepper opsi | Integer per opsi dalam satu buket, max dari data | Perilaku stepper Detail Produk; label/unit berbeda |
| Jumlah buket | Integer terpisah; batas agregat | Format/stepper bersama |
| Ringkasan pilihan | Ubah membuka kelompok; hapus memperbarui draft | Pola daftar/detail/accordion |
| Harga | Read-only; menghitung/terbaru/berubah jelas | Rupiah dan feedback yang ada |
| Preview | Otomatis, loading/fallback lokal, alternatif teks | Renderer/aset baru; Konva bukan kewajiban |
| Kartu/catatan | Plain text, counter, validasi dekat field | Pola field Checkout; data per buket tidak disamakan dengan kartu pesanan |
| Dialog reset/harga/konflik | Fokus masuk, batal/Escape aman, fokus kembali | Dialog native/pola proyek |
| CTA | Disabled saat invalid/quote usang, pending mencegah ganda | Tombol rounded sekitar 48 px |

Pencarian/filter opsi adalah peningkatan bila skala daftar memerlukannya, bukan fitur yang terlihat pada Figma. Jika dipakai: perubahan langsung memfilter, Reset hanya menghapus pencarian/filter, pilihan di luar hasil tetap ada di ringkasan. Load-more/pagination hanya bila sumber mempunyai cursor/pagination; jangan menciptakan hitungan hasil.

## 5. Status dan penanda penting

**Status bisnis/data:** produk, hubungan dan opsi AKTIF/NONAKTIF; ketersediaan konfigurasi dari aturan/bahan terkini; konfigurasi keranjang milik pelanggan; snapshot pesanan yang tidak berubah akibat edit master. Pesanan, pembayaran, pengiriman dan produksi tetap independen.

**State UI usulan:** Belum Lengkap → Menghitung → Siap Ditambahkan → Menambahkan → Berhasil. Perubahan draft mengusangkan quote. Error kembali ke state yang sesuai setelah diperbaiki. Harga Berubah/Konflik memerlukan tinjauan. Hasil Tidak Pasti direkonsiliasi sebelum Add diulang.

Wajib/opsional, unavailable, menghitung, berubah dan sukses menggunakan teks bersama ikon/gaya proyek. Merah diskon khusus diskon sah. Tidak menampilkan “Sedang Dirangkai” atau stok bahan pasti setelah Add.

## 6. Tindakan dan dampaknya

| Tindakan | Syarat aktif | Dampak/umpan balik | Konfirmasi/pemulihan |
| --- | --- | --- | --- |
| Pilih/ganti opsi | Aktif, terkait, diizinkan | Draft/preview/ringkasan/quote berubah | Tanpa modal rutin; ketidakcocokan dijelaskan |
| Ubah qty opsi/buket | Dalam batas; tidak sedang komit | Quote lama dibatalkan | Nilai invalid dipertahankan untuk koreksi; tidak clamp diam-diam |
| Hapus opsi | Sudah dipilih | Draft dapat menjadi belum lengkap | Pada edit belum mengubah item sampai Save |
| Reset Filter | Ada pencarian/filter | Hasil daftar berubah | Konfigurasi tetap |
| Reset Buket/ganti dasar | Ada perubahan | Kembali ke default sah/kosong | Konfirmasi kehilangan pilihan/catatan |
| Tambah | Sesi, draft, quote dan bahan sah | Simpan item/config atomik; count setelah sukses | Tidak perlu konfirmasi rutin; idempotensi/rekonsiliasi |
| Simpan Perubahan | Item milik akun, revisi sah, ada perubahan | Ubah item tepat atau merge sah | Konflik tidak overwrite otomatis |
| Tinjau harga baru | Server menemukan perubahan | Bandingkan sebelumnya/terbaru | Komit ulang eksplisit, bukan auto-submit |
| Lihat Keranjang | Sukses/ingin memeriksa hasil | Navigasi item relevan | Tidak membuat transaksi baru |
| Coba Lagi | Gangguan dapat dipulihkan | Baca/quote atau mutasi dengan key tepat | Hasil tidak pasti diperiksa dulu |
| Kembali/Batal | Status pemrosesan dipahami | Pulihkan asal | Guard draft; tutup tunggu bukan membatalkan mutasi server |

## 7. Aturan bisnis, validasi dan hak akses

### Aturan wajib

1. Server menentukan opsi, status, harga, batas, kompatibilitas dan kecukupan bahan; nilai harga browser tidak dipercaya.
2. Hanya kategori_pilihan_produk aktif berlaku. Wajib/min/max/urutan khusus produk mengalahkan default kelompok.
3. PILIH_SATU/PILIH_BANYAK menentukan opsi berbeda; arti hitung min/max perlu dinormalisasi eksplisit. Jangan mencampurnya dengan jumlah batang.
4. Kuantitas opsi integer per buket, dibatasi batas_maksimum_kuantitas_per_buket dan aturan efektif/ketersediaan.
5. P-05: **20 unit per produk per pesanan dijumlahkan lintas konfigurasi; total 50 unit per pesanan**. Bukan20 batang atau20 untuk setiap konfigurasi.
6. Semua harga integer rupiah. Dasar/total tidak negatif. tambahan_harga_rupiah pada SQL signed; penyesuaian negatif yang sah tidak ditolak hanya karena contoh semuanya positif.
7. Validasi ulang saat Add/Save dan Checkout; perubahan tidak ditutupi.
8. Produk/varian dan seluruh konfigurasi relevan menentukan merge. hash_sidik_konfigurasi sudah ada pada SQL item keranjang.
9. Hash dihitung server dari bentuk kanonis; urutan klik, filter/kelompok terbuka/zoom bukan pembeda. Pesan/catatan/warna relevan tidak hilang karena merge.
10. Keranjang tidak mereservasi stok. Bahan produksi bukan stok buket siap jual/SKU tanaman. Online/COD tetap mengikuti workflow proyek.
11. Opsi/bahan tidak cocok tidak diganti otomatis.
12. Jenis_penanganan dari master; Mudah Layu mewajibkan syarat kirim pada Checkout. Tidak semua buket diasumsikan sama.

### Bidang dan validasi

| Bidang | Ketentuan | Pesan/tindakan usulan |
| --- | --- | --- |
| Produk | Aktif, BUKET_KUSTOM, punya konfigurasi sah | “Produk ini belum dapat dikustomisasi. Pilih buket lain.” |
| Varian | Wajib jika memiliki_varian, aktif dan milik produk | “Pilih varian yang tersedia.” |
| Kelompok wajib | Penuhi aturan efektif | “Lengkapi pilihan [nama kelompok].” Buka kelompok |
| Opsi | ID/relasi/status/kompatibilitas sah | “Pilihan ini tidak tersedia untuk buket Anda.” |
| Qty opsi | Integer positif, dalam batas | Pesan menyebut opsi dan unit yang tepat |
| Jumlah buket | Integer1–batas efektif P-05 termasuk item lain | Jelaskan batas produk/pesanan dan tindakan sesuaikan Keranjang |
| Nama label buket | Opsional, maks 100 karakter (SQL) | Counter/error; bukan SKU/produk baru |
| Tema warna dominan | Opsional, maks 100 karakter (SQL) | Preferensi tidak membuka warna/bahan yang tidak dijual |
| Pesan kartu buket | Jika didukung, plain text maks 200 (P-10/SQL) | “Pesan kartu maksimal 200 karakter.” |
| Nama pengirim | Opsional, maks 100; kosong boleh anonim | Jangan otomatis memakai nama akun untuk pesan anonim |
| Catatan perangkai | Opsional, plain text maks 300 (SQL) | Bukan permintaan bahan di luar konfigurasi yang disepakati |
| Quote | Lengkap, integer, cocok dengan draft/versi | Harga belum tersedia, bukan Rp0 palsu |

Samakan penghitung karakter UTF-8 frontend/backend, termasuk emoji. Escape teks saat ditampilkan. Jangan menambah upload/HTML atau validasi teks yang tidak berdasar.

Kartu ucapan per buket tersimpan pada konfigurasi item; Checkout sudah memiliki kartu tingkat pesanan. Jangan menyalin pesan/menagih kartu dua kali. Kemampuan kartu dan bahan yang sudah termasuk dasar harus dipetakan; sembunyikan bagian yang tidak didukung.

### Contoh seed, bukan harga produksi

SQL memiliki empat kelompok aktif dan enam opsi; belum ditemukan seed hubungan produk–kelompok. Kunci gambar opsi NULL.

| Opsi seed | Tambahan/unit opsi | Max seed per buket | Makna unit |
| --- | --- | --- | --- |
| Paket 5 Tangkai Mawar Merah | Rp60.000 | 6 | Satu paket berisi 5 tangkai, bukan harga per tangkai |
| Paket 5 Tangkai Mawar Putih | Rp65.000 | 6 | Satu paket berisi 5 tangkai |
| Baby Breath Putih | Rp25.000 | 3 | Satu ikat menurut deskripsi seed |
| Daun Eucalyptus Harum | Rp30.000 | 2 | Satu ikat menurut deskripsi seed |
| Wrapping Sage Green (3 Lembar) | Rp15.000 | 2 | Satu paket 3 lembar |
| Pita Satin Krem | Rp5.000 | 1 | Satu opsi pita 1,5 m; qty opsi tetap integer |

Ilustrasi: satu paket mawar merah + satu wrapping + satu pita = **Rp80.000 tambahan per buket**. Jika dasar produk B, harga per buket B + Rp80.000; dua buket 2×(B + Rp80.000), sebelum ongkir. B belum dipastikan untuk produk publik terkait; jangan membuat total fiktif.

Rumus umum: hargaPerBuket = dasarSah + jumlah(qtyOpsi × tambahanSatuanSah); subtotalProduk = jumlahBuket × hargaPerBuket. Diskon hanya dari aturan sah. Kebutuhan bahan/susut/konversi/pembulatan ditentukan server, bukan perkiraan frontend.

## 8. Matriks state

Prioritas **lokal modul**: P0 wajib agar modul aman, P1 peningkatan sesuai kebutuhan sumber, P2 opsional. Kustomisasi Buket tetap P1 pada roadmap global 27.6.

| Area/komponen | Nama state | Pemicu | Isi tampilan/pesan | Tindakan tersedia | Input dipertahankan | Jalur pemulihan | Prioritas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Halaman | S01 Normal | Sesi/produk/aturan sah | Workspace dan ringkasan terkini | Pilih, ubah, kembali | Draft | Tidak diperlukan | P0 |
| Halaman | S02 Guest | Tidak ada sesi pelanggan | Masuk untuk meracik buket | Masuk, kembali | Produk/tujuan aman | Login lalu returnTo internal | P0 |
| Halaman | S03 Akun belum layak | Belum verifikasi/nonaktif | Pesan sesuai guard akun | Verifikasi/login bila sesuai, katalog | Tujuan aman | Alur akun yang ada | P0 |
| Halaman | S04 Sesi berakhir | Sesi habis saat bekerja | Masuk ulang; mutasi diblokir | Pulihkan sesi, tetap/kembali dengan guard | Seluruh draft dalam tab | Reautentikasi/revalidasi; dependensi bagian 10 | P0 |
| Konfigurasi | S05 Denied | Bukan pemilik/peran sah | Tidak dapat diakses; tanpa data privat | Keranjang/katalog | Draft akun sah saja | Ambil item milik sendiri | P0 |
| Halaman | S06 Loading awal | Muat sesi/opsi | Skeleton berlabel; CTA disabled | Kembali | Produk/tujuan | Selesai atau error | P0 |
| Halaman | S07 Gagal muat | Layanan gagal | Pilihan belum dapat dimuat | Coba Lagi, kembali | Draft pemulihan/tujuan | Baca ulang tanpa reset | P0 |
| Halaman | S08 Offline awal | Koneksi tidak ada | Sambungkan kembali | Coba Lagi, kembali | Draft lokal/referensi | Reconnect lalu muat | P0 |
| Halaman | S09 Timeout/maintenance | Lambat/perawatan | Pesan kondisi, tanpa harga/stok palsu | Retry sesuai kondisi, kembali | Draft | Pulih layanan dan validasi | P0 |
| Produk | S10 Tidak ditemukan | ID salah/dihapus | Produk tidak ditemukan | Katalog/pilih lain | Asal | Pilih produk sah | P0 |
| Produk | S11 Nonaktif/arsip | Master dinonaktifkan | Produk tidak tersedia | Kembali/pilih lain | Draft ditinjau, tidak ditransfer otomatis | Pilih dasar lain eksplisit | P0 |
| Produk | S12 Bukan kustom | Jenis/dukungan salah | Tidak mendukung kustomisasi | Detail/katalog | Produk asal | Jalur standar yang sesuai | P0 |
| Produk | S13 Belum dikonfigurasi | Relasi kelompok tidak ada | Pilihan produk belum tersedia | Pilih lain/kembali | Produk asal | Master dilengkapi; bukan user membuat relasi | P0 |
| Data | S14 Esensial invalid | ID/harga/aturan wajib/satuan tidak sah | Informasi wajib belum tersedia | Retry/kembali | Pilihan teridentifikasi | Muat/quote lengkap sebelum komit | P0 |
| Data | S15 Sebagian nonesensial | Foto/deskripsi opsional gagal | Fallback bagian; form sah tetap berjalan | Retry bagian/lanjut bila sah | Semua pilihan | Pemulihan parsial | P0 |
| Pemilih dasar | S16 Belum/tidak ada produk | Masuk dari menu umum | Pilih dasar atau belum ada yang tersedia | Pilih/kembali | Draft lain dilindungi | Pilih produk eligible | P0 |
| Kelompok | S17 Belum lengkap | Minimum/wajib belum terpenuhi | Petunjuk dan Belum Dipilih | Pilih kelompok terkait | Pilihan lain/teks | Lengkapi syarat | P0 |
| Kelompok | S18 Gagal muat bagian | Opsi gagal dibaca | Kelompok belum dapat dimuat | Retry bagian | Semua pilihan lama | Muat/revalidasi kelompok | P0 |
| Kelompok | S19 Kosong | Tidak ada opsi aktif | Tidak ada pilihan tersedia | Kelompok lain/kembali | Draft | Kelompok wajib blok komit sampai pulih | P0 |
| Opsi | S20 Default/hover/fokus | Kontrol operabel | Nama/unit/harga; fokus segera terlihat | Pilih/toggle | Draft | Tidak diperlukan | P0 |
| Opsi | S21 Selected | Opsi dipilih | Checked dan penanda teks | Ubah/hapus/qty sah | ID/qty | Quote ulang | P0 |
| Kelompok | S22 Expanded/collapsed | Section dibuka/ditutup | Ringkasan tetap terlihat | Buka/tutup via keyboard | Pilihan/konteks | Buka kelompok bermasalah | P0 |
| Opsi | S23 Tidak tersedia | Nonaktif/bahan kurang | Alasan aman terlihat | Pilih alternatif sendiri | Pilihan lama ditandai | Ganti/hapus, quote ulang | P0 |
| Opsi | S24 Inkompatibel | Kombinasi tidak sah | Tidak cocok dengan pilihan terkait | Pilih kombinasi lain | Draft lain | Perubahan eksplisit, tanpa substitusi | P0 |
| Kelompok | S25 Batas tercapai | Maksimum efektif terpenuhi | Batas dan alasan disabled | Kurangi/ganti | Semua pilihan | Penuhi batas | P0 |
| Kuantitas | S26 Invalid | Kosong/negatif/pecahan/nonangka/berlebih | Pesan field; harga bukan final | Koreksi/kembali | Input yang diketik | Validasi lalu quote | P0 |
| Jumlah buket | S27 Batas agregat | Total lintas konfigurasi/order berlebih | Batas produk/pesanan tercapai | Sesuaikan jumlah/Keranjang | Draft | Validasi keranjang terbaru | P0 |
| Preview | S28 Belum ada pilihan | Draft awal | Pilih bunga untuk memulai | Pilih opsi | Draft awal | Bentuk preview sah | P0 |
| Preview | S29 Memperbarui | Renderer/aset berubah | Loading lokal; form tidak hilang | Tetap memilih | Draft terbaru | Hanya versi terbaru tampil | P0 |
| Preview | S30 Aset gagal | Key NULL/404/renderer gagal | Visual belum tersedia; teks tetap ada | Retry gambar/lanjut bila sah | Semua konfigurasi | Pulih aset tanpa ubah harga | P0 |
| Harga | S31 Menghitung | Pilihan/jumlah berubah | Menghitung; komit belum aktif | Tetap edit | Draft terakhir | Quote versi terbaru | P0 |
| Harga | S32 Siap | Quote sah untuk draft sama | Dasar/tambahan/unit/subtotal | Tambah/Simpan bila valid | Draft/quote terkait | Tidak diperlukan | P0 |
| Harga | S33 Gagal/invalid | Quote gagal/total tidak sah | Harga belum tersedia, bukan nol | Hitung ulang/kembali | Seluruh input | Quote ulang | P0 |
| Harga | S34 Lama/kedaluwarsa | Draft berubah/server menyatakan usang | Quote lama tidak dipakai | Perbarui quote | Draft terbaru | Abaikan respons lama | P0 |
| Harga | S35 Berubah saat komit | Nominal/versi berubah | Bandingkan lama/baru | Tinjau, komit ulang, batal | Draft | Penerimaan eksplisit | P0 |
| Kartu/catatan | S36 Validasi gagal | Panjang/format tidak sah | Counter dan pesan field | Koreksi | Seluruh isi | Koreksi tanpa reset | P0 |
| Kartu/catatan | S37 Tidak didukung | Kemampuan produk tidak ada | Bagian tidak tampil; metadata lama dijelaskan saat edit | Tinjau/hapus yang tidak berlaku | Tidak dialihkan diam-diam | Sinkron dengan kemampuan produk | P0 |
| Komit | S38 Pending/read-only | Add/Save berlangsung | Menambahkan/Menyimpan; mutasi disabled | Baca; navigasi dengan guard | Payload/key | Tunggu, tanpa kirim ganda | P0 |
| Komit | S39 Berhasil tambah | Commit dikonfirmasi | Ringkasan/jumlah/subtotal diterima | Lihat Keranjang/lanjut | Hasil tersimpan/draft bersih | Tidak diperlukan | P0 |
| Komit | S40 Berhasil edit | Revisi diterima | Item diperbarui/merge dijelaskan | Kembali ke item | Hasil kanonis | Tidak diperlukan | P0 |
| Komit | S41 Gagal atomik | Tolak validasi/save sebelum commit | Buket belum disimpan | Koreksi/retry | Seluruh draft | Ulangi setelah sebab jelas | P0 |
| Komit | S42 Hasil tidak pasti/lama | Respons hilang/koneksi putus sesudah request | Hasil belum pasti; jangan Add lagi | Periksa Hasil/Keranjang | Key dan draft | Rekonsiliasi/key sama bila aman | P0 |
| Komit | S43 Sukses, header gagal | Item tersimpan/count gagal | Sudah ditambahkan, header belum diperbarui | Keranjang/retry baca | ID/hasil sukses | Jangan mengulang Add | P0 |
| Komit | S44 Rate limited | Pembatasan server | Tunggu retry-after yang sah | Kembali/retry setelah diizinkan | Draft/key | Tunggu server; tanpa kuota/waktu rekaan | P0 |
| Keamanan | S45 CSRF/sesi invalid | Guard menolak mutasi | Perbarui sesi; tanpa sukses palsu | Pulihkan, kirim ulang eksplisit | Draft, bukan token browser | Sesi sah/rekonsiliasi bila perlu | P0 |
| Perubahan | S46 Draft kotor | Beda dari baseline | Belum dimasukkan ke keranjang | Tambah/Save/edit/buang | Draft | Commit atau buang eksplisit | P0 |
| Perubahan | S47 Meninggalkan | Back/reset/ganti dasar saat kotor | Dampak kehilangan dijelaskan | Lanjut Edit/Buang | Draft sampai keputusan | Tetap atau kembali aman | P0 |
| Perubahan | S48 Konflik revisi | Item/master berubah di tab lain | Data berubah, perbedaan aman | Muat Terbaru/tinjau/batal | Draft lokal terpisah | Rekonsiliasi tanpa overwrite | P0 |
| Perubahan | S49 Opsi/bahan berubah | Pilihan dicabut/kekurangan saat komit | Sorot terdampak; komit blok | Ganti/hapus/quote | Pilihan lain/catatan | Pengganti dipilih user | P0 |
| Edit | S50 Item hilang/tidak editable | Dihapus/sudah menjadi pesanan | Tidak dapat diubah lagi | Keranjang/mulai baru eksplisit | Draft relevan | Tidak otomatis membuat item baru | P0 |
| Recovery | S51 Draft pulih | Recovery sah untuk akun/produk | Sementara dipulihkan, belum masuk keranjang | Tinjau/quote/buang | Data yang benar-benar pulih | Validasi ulang referensi | P0 jika recovery ada |
| Recovery | S52 Akun beda/draft expired | Identitas berganti/ref hilang/expired server | Tidak dapat dipulihkan untuk akun ini | Akun asal/mulai baru | Tanpa bocoran pesan akun lain | Bersihkan/refetch aman | P0 jika recovery ada |
| Daftar opsi | S53 Pencarian tanpa hasil | Fitur pencarian digunakan | Tidak ada hasil sesuai pencarian | Ubah/Reset Filter | Opsi terpilih | Reset pencarian saja | P1 |
| Daftar opsi | S54 Loading/gagal append | Sumber punya cursor | Loading lokal/retry; tanpa duplikasi | Retry cursor/lanjut editor | Daftar/filter/pilihan | Muat cursor benar | P1 jika pagination ada |
| Detail pesanan | S55 Snapshot read-only | Sudah menjadi pesanan | Snapshot di Detail Pesanan | Navigasi sesuai izin | Snapshot asli | Bukan edit melalui builder | P0 batas antar modul |

Tidak menerapkan persetujuan Admin, upload, AI atau reservasi bahan oleh builder tanpa dasar baru. Sebagian sukses hanya untuk UI pendamping yang gagal sesudah commit yang sudah dipastikan; menyimpan sebagian pilihan ke keranjang bukan hasil yang diperbolehkan.

## 9. UX dan aksesibilitas

- Poppins, token krem/hijau, rounded/ikon proyek. Usulan skala: judul 32–36 px, section 18–20 px, body 14–16 px, CTA sekitar 48 px; diuji terhadap layout, bukan dianggap pengukuran Figma.
- Prioritas: komposisi/pilihan → masalah yang perlu diperbaiki → subtotal/tindakan. Tidak memakai hero promosi besar.
- Target sentuh minimal 44×44 px; nama panjang membungkus; nominal besar tidak bertabrakan.
- Swatch mempunyai nama teks dan checked state. Tidak menawarkan warna yang tidak terhubung ke opsi sah.
- Label, fieldset/legend, radio/checkbox dan accordion semantik; fokus mengikuti visual di semua ukuran.
- Preview mempunyai alternatif teks dan tidak mengambil fokus saat berubah. Semua pilihan bisa dilakukan dengan keyboard.
- Pengumuman harga tidak membacakan setiap ketikan berlebihan. Error dihubungkan aria-describedby; ringkasan error menuju field/kelompok pertama.
- Dialog fokus terkelola, Escape/batal aman dan fokus kembali. Status/sukses tidak mengambil fokus tanpa alasan.
- Informasi esensial tidak bergantung hover; focus ring segera terlihat. Hormati reduced motion.
- Sticky tidak menutup field, error, fokus/footer. “Subtotal produk” dipakai sebelum ongkir. Tambahan signed memakai tanda jelas; nilai nol bukan klaim promo gratis.

## 10. Data, keamanan dan kebutuhan sistem

### Data minimum

| Data | Isi minimum | Bukti/kesiapan |
| --- | --- | --- |
| Produk/varian | ID, nama, jenis/status, satuan, dasar, varian bila ada, penanganan | Model SQL ada; adapter pelanggan belum aktif |
| Kelompok efektif | ID/nama, wajib, mode, min/max, basis hitung, urutan, hubungan produk | Tabel ada; relasi belum di-seed |
| Opsi efektif | ID/kelompok, nama, tambahan, qty max, status, unit/kemasan publik, alasan unavailable | Enam seed; metadata unit terstruktur belum lengkap |
| Kompatibilitas | Aturan terversi/penjelasan konflik | Wajib secara bisnis; representasi backend eksplisit belum ditemukan. incompatible admin adalah simulasi |
| Ketersediaan | Hasil sah/tidak, batas boleh dipesan, versi | Server membaca BOM/bahan; tidak mengirim saldo gudang/BOM privat ke pelanggan |
| Draft | Produk/varian, opsi/qty, jumlah buket, metadata, mode/baseline | State frontend; recovery belum tersedia |
| Quote | Dasar/opsi/unit/subtotal, fingerprint/versi, penolakan/masa berlaku bila ada | Kalkulator PHP masih scaffold; jangan mengarang TTL |
| Item/config keranjang | Item/pemilik, hash, revisi, konfigurasi/qty diterima | SQL ada; adapter aktif masih fixture standar |
| Snapshot | Nama/opsi/qty/harga, metadata, kebutuhan bahan | Model ada; transaksi produksi belum terhubung |
| Aset preview | Key aman, template/layer, metadata kemasan | Key seed NULL; aset komposit belum siap |

### Batas frontend/backend

**Usulan frontend:** adapter terpisah untuk membaca konfigurasi produk, quote, tambah, muat item edit, simpan revisi dan periksa hasil request tidak pasti. Ini tanggung jawab yang diusulkan, bukan endpoint yang diklaim sudah ada. Data/simulasi preview dipisahkan dan dilabeli.

**Backend wajib:** sesi/otorisasi pemilik, CSRF, validasi kanonis, harga integer, batas agregat, kecukupan bahan, transaksi atomik, hash, revisi dan idempotensi. Client tidak menentukan harga/stock/status akun/hash/snapshot final.

Quote tidak mengubah stok atau item. Respons terikat versi draft; yang lama diabaikan. Saat Add/Save, payload/key/revisi dibekukan. Jangan memakai add(productId,revision,quantity) standar untuk menyimpan konfigurasi. Jalur konfigurasi baru harus diregresi terhadap barang standar/guest cart.

### Draft, privasi dan autentikasi

Draft lengkap dipertahankan di memori selama editor terbuka saat gagal/offline/sesi habis. URL hanya identitas/tujuan/ref opaque aman, bukan pesan kartu, catatan, harga atau alamat.

**Usulan arsitektur yang belum tersedia:** recovery penuh melewati redirect login menggunakan draft sementara terikat akun di server dan referensi opaque. TTL/retensi mengikuti keputusan keamanan server, bukan angka buatan UI. Ini bukan wishlist/simpan desain permanen.

Bila mekanisme belum tersedia, jangan mengklaim recovery lintas reload/login selesai. Pertahankan editor saat sesi habis dan jelaskan risiko sebelum meninggalkan. Dependensi recovery harus selesai sebelum syarat tanpa-kehilangan-input dinyatakan lulus. Preview mensimulasikannya secara terpisah tanpa menulis akun/draft produksi.

Pesan/catatan pribadi tidak dimasukkan ke raw log/analytics atau browser storage umum. Jangan menyimpan kredensial, token, cookie sesi, pembayaran atau alamat di localStorage draft. Akun berubah tidak memulihkan pesan akun lama. Teks plain/di-escape, CSP/URL aset tepercaya. CDN prototipe bukan dependensi produksi otomatis.

### Waktu, stok dan audit

UI memakai WIB; penyimpanan/audit UTC. Uang rupiah integer. Unit opsi dan buket dibedakan; angka desimal bahan bukan field jumlah buket. Susut/pembulatan harus sah dari server.

Edit master tidak menulis ulang snapshot pesanan. Server mencatat aktor, revisi, hasil komit dan korelasi request sesuai kebijakan, tanpa isi kartu/catatan pada log umum. Ledger/tahap produksi dikelola modul berwenang.

## 11. Daftar pekerjaan dan kriteria selesai

### Paket kerja

| Prioritas modul | Pekerjaan | Dependensi |
| --- | --- | --- |
| P0 | Produk kustom aktif, relasi dan fixture frontend yang konsisten | Master/fixture dinyatakan jelas |
| P0 | Kontrak aturan/unit/kompatibilitas/quote/hash/revisi | Keputusan teknis bagian 12 |
| P0 | Shell, guard, masuk dari menu/produk/keranjang, kembali aman | Auth/navigation yang ada |
| P0 | Kelompok, opsi, qty opsi dan jumlah buket | Aturan efektif |
| P0 | Preview otomatis/ringkasan dan fallback | Aset/manifest; teks tetap berfungsi |
| P0 | Harga/validasi live dan respons lama | Quote adapter |
| P0 | Kartu/catatan jika didukung, mapping Checkout | Kemampuan produk/snapshot item |
| P0 | Add/edit/merge atomik/idempoten | Jalur konfigurasi backend |
| P0 | State/error/dialog/pemulihan terkait | Matriks S01–S52 sesuai alur |
| P0 | Recovery autentikasi aman | Mekanisme benar-benar tersedia |
| P0 | Responsive/keyboard/fokus | Token/komponen storefront |
| P1 | Search/filter/pagination jika diperlukan | S53–S54 dan kapasitas sumber |
| P2 | Fitur di luar MVP setelah permintaan baru | Tidak otomatis memasukkan drag/share/AI |

### Kriteria penerimaan

1. Guest tidak mengedit/menyimpan sebelum login; returnTo aman. Sesi staf bukan sesi pelanggan.
2. Hanya BUKET_KUSTOM aktif dengan relasi sah; tidak adanya relasi tidak diganti semua opsi global.
3. Kelompok/aturan efektif mengendalikan radio/checkbox, wajib dan batas.
4. Paket 5 mawar dihitung satu unit opsi; pita 1,5 m tetap satu opsi integer. Batas jumlah buket tidak menjadi batas batang.
5. Opsi/jumlah langsung memperbarui preview/ringkasan, tanpa Terapkan. Quote lama tidak menimpa draft baru.
6. Harga sah dari server; signed adjustment benar; total tidak negatif; harga kosong bukan nol.
7. Invalid tidak dikomit; input/field lain tetap ada; error menuju masalah pertama.
8. Kompatibilitas/bahan kurang diblokir tanpa substitusi. Meracik/Add tidak mencadangkan bahan.
9. Konfigurasi beda menghasilkan baris beda; sama di-merge kanonis; pesan/catatan relevan tidak hilang.
10. Batas 20 produk dan 50 total dihitung lintas konfigurasi, termasuk edit/merge.
11. Double click satu mutasi logis; hasil tidak pasti direkonsiliasi dengan key tepat.
12. Perubahan harga menunggu tinjauan/tindakan ulang eksplisit.
13. Edit menjaga kepemilikan/revisi; item berubah/hilang tidak ditimpa/dibuat ulang diam-diam.
14. Back/reset/ganti dasar melindungi draft dan memulihkan konteks asal.
15. Aset gagal tetap menyisakan konfigurasi teks/keyboard yang operabel.
16. Pesan 200, nama pengirim 100, label 100, tema 100, catatan 300 diuji multibyte dan plain text.
17. Pesan per buket tidak disalin/ditagih ulang sebagai kartu pesanan. Builder tidak membuat alamat/kode pos akun.
18. Sesi habis menjaga memory draft; recovery lintas login baru lulus setelah mekanisme aman tersedia.
19. Desktop/tablet/mobile tidak overflow; target 44 px; sticky tidak menutup field/error/fokus/footer.
20. Checkout membaca konfigurasi sama dan memvalidasi ulang. Master berubah tidak mengubah snapshot; online/COD/stok diregresi.
21. State dev terisolasi/dilabeli dan tidak menulis stok/akun/keranjang nyata; sakelar role bukan otorisasi.

### Pemeriksaan saat implementasi diminta

Sediakan workbench lokal terpisah mengikuti proyek, dengan fixture untuk data normal, opsi/bahan invalid, quote berubah, respons terlambat, konflik, sesi habis, rate limit dan hasil add tidak pasti.

Uji batas kuantitas/uang, pilihan lintas kelompok, dua konfigurasi produk sama, merge saat edit, keranjang hampir penuh, pemilik akun berbeda serta pemulihan input. Periksa render nyata desktop dan mobile/tablet. Backend memerlukan tes impor/migrasi, locking/rollback/idempotensi/reservasi/COD/snapshot terpisah.

**Pengujian halaman Buket Kustom tersebut belum dijalankan karena halamannya belum diimplementasikan.**

## 12. Asumsi dan keputusan yang belum pasti

| ID | Hal | Bukti/ketidakpastian | Rekomendasi/dampak |
| --- | --- | --- | --- |
| D01 | Bentuk preview | Pengguna memilih otomatis | **Sudah diputuskan.** Tidak menunggu drag & drop atau menyimpan posisi objek pada MVP |
| A01 | Produk dasar/relasi aktif | Opsi seed ada, produk publik/relasi belum siap ditemukan | Pasok master/fixture jelas; admin demo bukan produk publik otomatis |
| A02 | Makna min/max kelompok | SQL menyebut kuantitas/opsi; simulator memakai pilihan | **Asumsi perlu dikonfirmasi teknis:** hitung jenis opsi berbeda, qty dibatasi terpisah; kontrak server wajib menyebut basis hitung |
| A03 | Unit opsi/total batang | Paket/ikat ada, metadata terstruktur belum lengkap | Metadata eksplisit; jangan parse nama atau memakai satuan bahan privat untuk menjanjikan jumlah batang |
| A04 | Kompatibilitas | Aturan diwajibkan; representasi backend belum ditemukan | Tetapkan aturan terversi dan alasan publik; bukan integrasi yang sudah berjalan |
| A05 | Aset preview | Figma placeholder, key opsi NULL | Siapkan aset/manifest; fallback teks wajib |
| A06 | Harga dasar/diskon | Figma/SQL/admin berbeda konteks | Master terkait menjadi acuan; contoh opsi bukan total jual |
| A07 | Kartu per item/pesanan | Dua struktur ada | Pemetaan dan pencegahan duplikasi pesan/biaya sebelum integrasi |
| A08 | Draft lintas login/reload | Recovery pelanggan belum ada | Pertahankan memori, usulkan recovery akun; jangan klaim selesai tanpa dependensi |
| A09 | Varian/penanganan | Model ada, produk terkait belum siap | Kontrol/syarat hanya dari data nyata; bukan semua buket Mudah Layu/SKU siap jual |
| A10 | Route/kontrak/revisi | PHP route/service masih scaffold | Tetapkan kontrak implementasi; tidak mengarang endpoint/TTL aktif |
| A11 | Stok/susut/konversi | Model BOM ada, integrasi belum aktif | Server menetapkan aturan; frontend tidak menjanjikan stok atau mencadangkan bahan |

Tidak ada pertanyaan visual penghalang setelah keputusan preview otomatis. A01–A11 dilacak saat implementasi/integrasi. UI dapat dikerjakan memakai fixture yang jelas sebagai contoh tanpa mengklaim backend produksi tersedia.


## Keputusan lanjutan pengguna — perapian komposisi dan layout

Permintaan tangkapan layar17 November2026 memperjelas bahwa panel kanan tidak boleh menyatu atau memiliki scroll bertingkat, ikon harus terlihat di semua state, dan rangkaian perlu terlihat masuk ke pembungkus. Susunan bunga dibuat bervariasi dan natural, dengan seed stabil agar tidak berpindah ketika konteks harga/jumlah buket berubah. Pilihan Anda menggunakan rail maksimal dua baris pada kedua perangkat; empat item terlihat dan kelebihan digeser horizontal. Keputusan ini mengutamakan batas tinggi daftar dan keterpisahan panel dibanding aturan sticky/max-height pada konsep awal. Kontrak data, aturan jumlah dan hak akses tidak berubah.


## Keputusan renderer Korean Bouquet

Permintaan lanjutan pengguna menggantikan distribusi spiral dengan slot organik kubah asimetris dan menetapkan enam lapisan eksplisit. Rotasi±25°, skala0,85–1,15, pengurutan Y, filler celah, kertas kipas belakang dan kerah tisu depan menjadi kontrak visual terbaru. Gunakan docs/design/bouquet-composition-renderer.md sebagai acuan teknis. Seluruh pilihan tetap bersumber dari master/fixture sebelumnya; tidak menambah opsi komersial atau mengubah perhitungan harga.
