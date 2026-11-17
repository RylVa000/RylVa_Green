# Wishlist — spesifikasi halaman

Tanggal: 17 November 2026. Status: **spesifikasi acuan; frontend pratinjau kini diimplementasikan, layanan akun produksi belum terhubung**.

Implementasi berikutnya dicatat pada [cakupan UI Wishlist](../../coverage/wishlist-ui.md). Bagian fakta kode dan gap dalam dokumen ini merekam pemeriksaan sebelum pengerjaan; lihat laporan cakupan untuk kondisi implementasi terbaru, hasil pemeriksaan, dan integrasi yang masih tersisa.

## Ringkasan keputusan

- **Keputusan pengguna:** guest boleh menyimpan sementara di browser; pelanggan yang masuk memiliki Wishlist permanen di akun. Daftar sementara perlu digabung setelah masuk.
- **Fakta proyek:** ikon hati sudah ada pada Beranda, Katalog dan Detail Produk, tetapi state masih terpisah dalam memori setiap halaman. Halaman Wishlist aktif, penyimpanan bersama, serta sinkronisasi akun belum tersedia.
- **Usulan versi awal:** satu daftar privat, istilah utama **Wishlist**, menyimpan produk induk. Varian dipilih sebelum menambah ke Keranjang. Tidak menyimpan snapshot racikan Buket Kustom.
- **Asumsi perlu dikonfirmasi:** penyimpanan guest menggunakan sessionStorage per tab, sehingga tetap ada saat berpindah halaman/reload pada tab yang sama; tidak menjanjikan bertahan setelah sesi tab berakhir. Penyimpanan guest lintas tab atau lintas sesi memerlukan kebijakan retensi tambahan.
- **Acuan visual:** sistem RylVa, kartu Homepage, kontrol Katalog dan Detail Produk; Poppins, krem/hijau dan ikon hati yang sama. Bukan rancangan identitas baru.
- **Batas tahap ini:** dokumen spesifikasi; tidak membuat route, mengaktifkan fitur produksi, mengubah skema, atau mengklaim API tersedia.

Prioritas pada dokumen ini: **P0** wajib untuk versi awal, **P1** penyempurnaan setelah alur inti lengkap, **P2** lanjutan bersyarat. Prioritas ini adalah urutan implementasi Wishlist, bukan penggantian register prioritas proyek.

## 1. Pemahaman dan cakupan halaman

### 1.1 Tujuan dan pekerjaan pengguna

Pengguna mengingat produk yang menarik, menemukannya kembali, memeriksa harga/ketersediaan terbaru, lalu membuka detail, memilih varian atau meracik buket, dan menambah produk yang sah ke Keranjang. Menyimpan ke Wishlist tidak memesan, menahan stok, menjamin harga, atau melakukan pembayaran.

Keberhasilan utama: produk yang disimpan terlihat kembali di konteks pemilik yang benar; perubahan hati konsisten antarlaman; guest dapat melanjutkan sebagai pelanggan tanpa kehilangan pilihan yang belum berhasil digabung.

### 1.2 Jenis halaman, pengguna dan kewenangan

Halaman storefront personal, untuk mengelola produk tersimpan, dengan dua mode data. Usulan route `/pages/customer/wishlist.html` dapat diakses guest maupun pelanggan; nama folder customer bukan alasan untuk mewajibkan login untuk seluruh halaman.

| Pengguna | Boleh melihat/melakukan | Pembatasan |
| --- | --- | --- |
| Guest | Daftar sementara milik tabnya; simpan/hapus lokal; cari/filter; buka detail; tambah produk standar ke keranjang guest sesuai aturan yang ada | Tidak mengakses daftar akun, tidak menjanjikan sinkronisasi/permanensi |
| Pelanggan dengan sesi sah | Daftar privat milik akun; simpan/hapus; gabungkan guest; lanjut belanja | Owner ditentukan server; tidak menerima owner dari parameter klien |
| Pelanggan setelah sesi berakhir | Memulihkan akses, melanjutkan penjelajahan publik atau daftar guest yang memang tidak terikat akun | Daftar akun lama dan buffer merge milik akun tidak ditampilkan sebagai data guest |
| Staf/Admin/SuperAdmin | Boleh menjelajah storefront publik | Sesi staf tidak memberi hak mengakses atau mengubah Wishlist pelanggan |
| Akun lain | Daftarnya sendiri setelah autentikasi | Tidak boleh menerima cache, undo atau pending operation dari pemilik sebelumnya |

Aturan login/akun aktif tetap mengikuti proyek. Tidak menambah syarat MFA/verifikasi khusus Wishlist. Bila server memang mewajibkan verifikasi atau membatasi akun, UI mengikuti respons tersebut.

### 1.3 Cakupan P0

1. Halaman daftar dan entry point dari ikon Wishlist/header.
2. Penyimpanan guest bersama antarlaman dalam tab yang sama.
3. Wishlist privat akun, state sinkronisasi dan penggabungan guest yang aman.
4. Simpan/hapus dari Beranda, Katalog, Detail Produk dan Wishlist.
5. Pencarian nama produk, filter kategori/ketersediaan, urutan dan pemuatan bertahap.
6. Detail, pilih varian/racik buket, tambah ke Keranjang, umpan balik dan pemulihan.
7. Empty/error/partial/access/data-change states serta navigasi kembali.
8. Sumber data pratinjau terisolasi bila backend belum tersedia.

Di luar versi awal: multi-koleksi/rename koleksi, bagikan daftar publik, daftar hadiah, impor file, rekomendasi baru, tambah/hapus massal, riwayat harga, notifikasi stok/harga, simpan desain buket, dan checkout langsung dari Wishlist. Catatan pribadi per item diposisikan P2 karena SQL mendukung tetapi kebutuhan UI belum diputuskan.

### 1.4 Hubungan halaman

- Beranda/Katalog/Detail: sumber simpan dan pembuka Wishlist.
- Detail Produk: ringkasan pertama, pemilihan varian, pengecekan informasi/perawatan.
- Buket Kustom: meracik dari produk dasar yang disimpan; tetap mengikuti syarat login konfigurator.
- Keranjang: menerima penambahan yang divalidasi; item tetap tersimpan di Wishlist.
- Login/Registrasi: menyimpan sementara konteks dan menggabungkan guest setelah sesi pelanggan benar-benar sah.
- Akun: opsional entry point navigasi, bukan tempat membuat ulang daftar.
- Checkout: hanya melalui Keranjang/alur yang tersedia; tidak menambahkan jalan pintas baru.

### 1.5 Sumber, bukti dan kondisi terkini

| Sumber | Fakta yang diperiksa | Implikasi |
| --- | --- | --- |
| [Spesifikasi v2.6](../../specifications/spesifikasi-proyek-v2.6.md), 1.2 dan 27.6 | Wishlist termasuk pengecualian historis v1; addendum halaman menyebut Wishlist jika diaktifkan | Permintaan dan keputusan pengguna menjadi dasar rancangan ini; keberadaan fitur produksi tidak diasumsikan |
| [PRODUCT.md](../../../PRODUCT.md) dan [DESIGN.md](../../../DESIGN.md) | Stack native HTML/CSS/JS, PHP, MySQL/PDO; sistem Poppins dan warna RylVa | Pertahankan stack, shell dan komponen yang cocok |
| [Figma Public](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU?node-id=0-1) | Metadata page 0:1 diperiksa kembali; tidak ditemukan node bernama Wishlist/Favorit. Ada Home page rev 466:386, Katalog 267:297 dan Detail Produk 282:838 | Tidak ada klaim screenshot Wishlist sudah disepakati. Komposisi baru diturunkan dari pola yang ada; ketiadaan nama tidak membuktikan semua node tanpa label telah diperiksa visual |
| [Kartu produk bersama](../../../public/assets/js/storefront/storefront-product-card.js) | Sudah dipakai Homepage/Katalog; heart menggunakan savedProducts berdasarkan slug; harga/satuan masih mempunyai suffix pot | Pakai ulang visualnya, perlu penyesuaian identitas simpan dan satuan untuk domain selain tanaman |
| homepage.js, catalog-filter.js, product-detail.js | Set/boolean favorit lokal; copy “selama halaman ini terbuka”; tidak terhubung ke penyimpanan akun | Ini simulasi UI yang perlu diganti oleh kontrak store bersama, bukan bukti persistence |
| [SQL](../../../database/schema/DB_RylVa_Green.sql), daftar_keinginan dan item_daftar_keinginan | Daftar milik akun, nama default Favorit Saya, produk, varian nullable, catatan 255, waktu UTC | Model akun ada dalam skema; belum berarti tabel/layanan sudah dioperasikan |
| [Template](../../../templates/customer/wishlist.php), [controller](../../../src/Http/Controllers/Customer/WishlistController.php), config/routes.php | Masih scaffold/komentar | Route HTML yang diusulkan dan layanan Wishlist belum ada |
| storefront-product-navigation.js dan customer-auth.js | Allowlist list/detail hanya Home/Katalog; returnTo login belum memasukkan Wishlist | Integrasi navigasi perlu ditambah secara terbatas dan diuji |
| Keranjang/Checkout aktif | Masih adapter preview; add saat ini menerima productId dan memilih record SKU fixture | Tidak boleh menganggap adapter sudah mendukung pemilihan varian produksi secara lengkap |

**Konflik yang diselesaikan:** keberadaan ikon dan tabel tidak berarti Wishlist sudah lengkap. Permintaan ini memperluas rancangan fitur opsional; tidak mengubah status simulasi menjadi layanan produksi. Catatan aset/tema pada PRODUCT merupakan bukti pemeriksaan awal; DESIGN dan aset kode terkini menjadi acuan visual yang lebih mutakhir.

## 2. Struktur dan isi halaman

### 2.1 Susunan atas ke bawah

1. **Header dan navigasi storefront yang sama.** Ikon Wishlist mengarah ke halaman ini dari seluruh storefront. Akun/keranjang tetap memakai pola yang ada. Pencarian header tetap mencari katalog, bukan diam-diam berubah menjadi pencarian Wishlist.
2. **Breadcrumb:** Beranda / Wishlist. Bila masuk dari katalog/detail, tindakan Kembali ke halaman sebelumnya boleh ditampilkan dengan tujuan internal tervalidasi.
3. **Judul Wishlist** dan jumlah produk tersimpan. Gunakan jumlah unik yang sudah diketahui; tidak menghitung pending gagal, skeleton atau placeholder.
4. **Keterangan mode data:**
   - Guest: “Disimpan sementara di tab ini. Masuk untuk menyimpannya di akun.” CTA Masuk.
   - Akun normal: keterangan singkat bahwa daftar tersimpan di akun, bila dibutuhkan; tidak perlu banner besar terus-menerus.
   - Merge/error: banner kontekstual dengan status dan tindakan pemulihan.
5. **Toolbar:** Cari di Wishlist, kategori, Semua/Tersedia/Stok habis, urutan. Label pencarian harus berbeda dari pencarian katalog di header.
6. **Filter aktif dan Reset.** Memperbarui hasil langsung tanpa tombol Terapkan.
7. **Jumlah hasil dan daftar produk.** Contoh format tampilan dinamis: Menampilkan 6 dari 12 produk. Angka pada contoh bukan data produksi.
8. **Pemuatan berikutnya/akhir daftar** dengan tombol fallback dan pesan status.
9. **Feedback tindakan:** hasil simpan/hapus/tambah, serta Simpan kembali untuk penghapusan terakhir.
10. **Footer storefront yang sama.** Jangan membuat footer atau sidebar akun baru hanya untuk halaman ini.

### 2.2 Kartu produk

Pakai kembali **RylvaProductCard**, tata letak foto + informasi Homepage, serta status dan aksi yang sama. Data minimum:

- Foto, nama dan slug/ID produk untuk navigasi.
- Ringkasan singkat; tidak memaksa placeholder bila deskripsi kosong.
- Ketersediaan yang sudah dihidrasi dari katalog.
- Harga saat ini, harga lama/diskon hanya jika valid, periode promo yang masih berlaku.
- Satuan jual aktual: pot, buket, pcs, set, dan satuan lain yang memang ada di data.
- Tombol Detail Produk, hati tersimpan, dan aksi Keranjang/Pilih varian/Racik buket sesuai jenis produk.

Tidak menampilkan alamat pelanggan, identitas pemilik, estimasi ongkir palsu, rating/ulasan yang tidak tersedia, jumlah pembeli, atau klaim promosi buatan. Waktu disimpan dipakai untuk urutan, bukan metadata wajib di setiap kartu.

### 2.3 Layout dan hierarki

**Usulan:** tanpa sidebar filter besar karena pengguna meninjau koleksinya sendiri. Toolbar horizontal di desktop. Tiga kartu per baris pada desktop lebar hanya bila lebar kartu sekitar 420 px atau lebih; dua pada desktop menengah, satu pada mobile. Pertahankan bentuk kartu horizontal; jangan mengganti dengan kartu produk vertikal baru. Pengukuran ini adalah usulan layout yang harus dibuktikan ketika implementasi, bukan ukuran Figma Wishlist.

Kontainer mengikuti token/global max-width proyek. Judul sekitar 32–36 px desktop dan 28 px mobile; section 18–20 px; body 14–16 px. Harga lebih dominan daripada ringkasan/harga coret. Foto mempertahankan rasio dan menyediakan fallback, tanpa zoom dekoratif wajib.

Mobile menggunakan ikon filter/urut dan bottom sheet pola Katalog bila kontrol tidak cukup dalam satu baris. Filter langsung bekerja; tombol Lihat hasil hanya menutup sheet dan menampilkan jumlah, bukan menyimpan filter tertunda. Sheet mendukung Escape/X, backdrop, drag turun bila komponen bersama mendukungnya, fokus tertahan dan dikembalikan.

### 2.4 Konten panjang dan data tidak lengkap

- Nama panjang boleh dua baris dengan nama lengkap tetap tersedia bagi pembaca layar dan pada Detail. Jangan mengandalkan tooltip hover.
- Harga besar memakai formatter dan penyesuaian yang sama dengan kartu proyek; tidak menabrak tombol.
- Harga hilang bukan Rp0. Tampilkan Harga belum tersedia dan nonaktifkan pembelian.
- Satuan hilang tidak diganti otomatis menjadi pot; hilangkan suffix dan tandai kebutuhan data bila memengaruhi pembelian.
- Gambar gagal memakai placeholder proyek dan nama produk; daftar tetap dapat digunakan.
- Data produk yang tidak boleh dipublikasikan tidak dibocorkan lewat cache, nama internal atau rincian SKU.
- State pencarian kosong berbeda dari daftar benar-benar kosong.

## 3. Alur penggunaan

### 3.1 Guest menyimpan dan membuka kembali

1. Guest menekan hati pada produk yang memang dapat dilihat.
2. Store bersama menulis ke storage sementara; UI mengonfirmasi simpan lokal setelah penulisan berhasil.
3. Hati berubah mengikuti komponen yang sama pada semua instance produk di tab tersebut.
4. Guest membuka Wishlist; daftar memuat keanggotaan lokal dan menghidrasi informasi produk terkini.
5. Berpindah ke Detail atau reload pada tab sama tetap menemukan item selama storage sesi tersedia.
6. CTA Masuk menjelaskan manfaat permanensi tanpa memaksa login untuk simpan sementara.

Jika storage tidak dapat ditulis, daftar boleh berjalan dalam memori dengan pesan jelas bahwa data hanya bertahan pada halaman saat ini. Jangan menampilkan janji antarlaman dalam mode fallback tersebut.

### 3.2 Akun menyimpan

1. Identitas pelanggan divalidasi sebelum cache akun ditampilkan.
2. Operasi meminta keadaan akhir tersimpan/tidak tersimpan, bukan toggle tanpa versi.
3. Satu produk yang sedang diproses tidak menerima pengiriman ganda; produk lain tetap dapat digunakan.
4. Setelah server mengonfirmasi, store bersama memperbarui kartu, jumlah, dan daftar.
5. Kegagalan mempertahankan keadaan terakhir yang terkonfirmasi dan menyediakan Coba lagi.

### 3.3 Penggabungan guest setelah masuk

Urutan konseptual: **sementara → menunggu penggabungan → menggabungkan → berhasil / sebagian berhasil / hasil belum pasti / gagal**.

1. Bekukan snapshot guest dengan ID operasi dan revisi sumber; jangan menghapusnya saat tombol Masuk ditekan.
2. Lanjutkan hanya setelah sesi pelanggan benar-benar sah. Respons mock login tidak diperlakukan sebagai autentikasi produksi.
3. Resolve daftar default pemilik pada server; deduplikasi produk secara atomik.
4. Item yang sudah ada pada akun dihitung sebagai selesai, tanpa menggandakan baris atau jumlah.
5. Hapus dari guest hanya identitas dalam snapshot yang dikonfirmasi telah tersimpan/sudah ada. Penambahan baru setelah snapshot tidak ikut dibuang.
6. Bila sebagian gagal, tampilkan hasil gabungan dan sisa item yang belum berhasil. Sediakan Coba lagi untuk sisa tersebut.
7. Timeout/putus respons: periksa hasil ID operasi yang sama; jangan mengirim merge baru yang berpotensi menggandakan.
8. Bila data sudah tersimpan tetapi metadata gagal dimuat, ulangi pemuatan metadata, bukan mutasi.
9. Operasi dan buffer yang terikat akun A tidak diterapkan ke akun B setelah logout/login.

Hati untuk item yang sedang digabung dinonaktifkan sementara agar hapus tidak berlomba dengan merge. Pengguna tetap dapat menjelajah; simpan baru setelah login diarahkan ke akun. Tidak ada tombol Batalkan yang mengklaim rollback jika server tidak mendukung pembatalan proses.

### 3.4 Membuka detail dan kembali

Buka Detail dari ringkasan produk di kartu. Detail dimulai dari bagian atas, bukan posisi gulir produk sebelumnya. Simpan konteks pencarian, kategori, ketersediaan, urutan, jumlah item yang sudah dimuat, posisi gulir dan pemicu fokus.

Kembali menggunakan history bila sumber cocok, dengan fallback ke Wishlist internal yang tervalidasi. Allowlist navigasi perlu ditambah untuk route Wishlist. Bila produk telah dihapus dari Wishlist saat berada di Detail, saat kembali fokus ke item berikutnya/posisi terdekat; jangan memunculkan kembali produk lama dari cache.

### 3.5 Menuju keranjang

- Produk standar tanpa pilihan varian wajib dan dengan data lengkap: Tambah ke Keranjang menambah 1 unit.
- Produk dengan varian atau informasi SKU belum cukup: Pilih varian membuka Detail; jangan memilih record pertama secara diam-diam.
- Buket kustom: Racik buket membuka konfigurator dari produk dasar, mengikuti guard login konfigurator. Wishlist tidak membawa pesan kartu/racikan sebagai konfigurasi tersimpan.
- Setelah berhasil: produk tetap di Wishlist. Tampilkan hasil dan tautan Lihat Keranjang.
- Stok/harga/SKU berubah: tampilkan informasi terbaru dan minta tindakan yang sesuai; tidak menampilkan keberhasilan sebelum validasi.

### 3.6 Menghapus dan menyimpan kembali

Satu item dapat dihapus lewat hati tanpa dialog konfirmasi yang mengganggu karena pengguna dapat menyimpannya lagi. Selama permintaan akun berlangsung, pertahankan kartu dengan status Menghapus. Setelah berhasil, pindahkan fokus secara masuk akal dan tawarkan **Simpan kembali** untuk item terakhir.

Simpan kembali adalah operasi simpan baru, dapat mengubah waktu urut, dan tetap memerlukan validasi produk/pemilik. Tidak menjanjikan rollback historis atau pengembalian catatan P2 yang tidak didukung. Feedback terakhir dapat diganti oleh tindakan berikutnya atau ditutup pengguna; produk selalu dapat disimpan kembali dari Detail jika masih tersedia.

### 3.7 Navigasi dan perubahan belum selesai

Tidak ada formulir draft utama pada P0. Jangan membuat konfirmasi Tinggalkan halaman hanya karena query/filter berubah. Jika mutasi belum selesai, kunci tindakan terkait dan sediakan pemeriksaan hasil bila respons tidak pasti; navigasi tidak mengklaim tindakan dibatalkan.

Bila editor catatan P2 diaktifkan, gunakan penjaga perubahan khusus formulir catatan dan simpan input saat validasi/penyimpanan gagal. Syarat ini tidak dipaksakan pada semua halaman.

## 4. Komponen dan interaksi

| Komponen | Pakai ulang/penyesuaian | Perilaku |
| --- | --- | --- |
| Shell/header/footer | Komponen storefront yang ada | Tujuan Wishlist disamakan; header search tetap ke Katalog |
| Product card | RylvaProductCard | Pertahankan foto kiri, informasi, badge, harga, Detail dan hati; perbaiki pemetaan unit/ID secara teruji |
| Hati | home-favorite-button dan home-heart-icon | Default outline gelap; selected mengikuti warna/fill kartu yang sudah disepakati; aria-pressed dan label Simpan/Hapus yang spesifik |
| Toolbar/search | Pola Katalog | Cari nama produk; kategori/ketersediaan; urutan; filter langsung dan Reset |
| Filter/urut mobile | Catalog controls/sheet/motion jika cocok | Satu sumber state, tidak menduplikasi form; keyboard dan penutupan/drag sama dengan pola bersama |
| Grid dan load-more | Pola daftar Katalog | Enam item awal sebagai batch UX yang sudah digunakan, append tanpa duplikat; tombol manual fallback |
| Membership store | Baru, shared antarlaman | has/isPending/setSaved/subscribe berdasarkan productId dan owner scope |
| Banner guest/merge | Baru, gaya feedback proyek | Mode sementara jelas; hasil, sisa dan pemulihan sinkronisasi |
| Empty/error/partial | Pola storefront | Pesan sesuai pemicu; tindak lanjut yang mempertahankan konteks |
| Feedback hapus/simpan/keranjang | Toast/status yang ada, disesuaikan | Fokus tetap pada tugas; Simpan kembali atau Lihat Keranjang bila relevan |
| Editor catatan P2 | Baru hanya bila diaktifkan | Maksimal 255 karakter sesuai SQL, validasi Unicode, draft/konflik terpisah |

### 4.1 Status hati dan sinkronisasi

Gunakan state **unknown, unsaved, saved, saving, removing, error**. Unknown bukan false: jangan menampilkan seolah belum tersimpan lalu mengizinkan toggle sebelum membership selesai dimuat. Untuk unknown, skeleton/disabled dengan label Memeriksa Wishlist.

Hanya perubahan terkonfirmasi atau penulisan guest lokal yang berhasil yang boleh menghasilkan pesan tersimpan. Seluruh instance productId yang sama mengikuti event store. Loading pada satu item tidak mematikan seluruh grid.

Warna selected yang ditemukan pada komponen: teks/border rose #963f5c dan permukaan #fbecef, fill currentColor. Ini bukti kode yang harus digunakan ulang, bukan palet baru untuk semua tombol. Jangan mengembalikan hati selected menjadi hijau yang berbeda dari kartu. Area interaksi minimum 44 px dapat disediakan tanpa membesarkan ikon atau mengubah warna shared secara global.

### 4.2 Filter dan urutan

- Search nama produk saja pada P0; tidak mencari catatan pribadi.
- Kategori berasal dari master dan diterapkan hanya pada keanggotaan Wishlist.
- Ketersediaan: Semua, Tersedia, Stok habis. Produk nonaktif/not-found tidak disamakan dengan stok habis.
- Urutan usulan: Terakhir disimpan (default), Harga terendah, Harga tertinggi, Nama A–Z.
- Produk dengan harga tidak diketahui ditempatkan setelah harga valid pada urutan harga, dengan hasil stabil.
- Search/category/availability/sort berubah: reset cursor/batch ke awal dan hentikan append usang; tetap pertahankan fokus kontrol.
- Membership tidak berubah karena filter. Reset hasil tidak menghapus Wishlist.
- Jika jumlah total belum diketahui, jangan mengarang total: tampilkan jumlah yang sudah dimuat dan status Masih ada produk.
- Batch 6 adalah pola presentasi, bukan batas maksimal jumlah produk yang boleh disimpan.

### 4.3 Infinite scroll dan kembali

Ikuti pola Katalog: pemuatan bertahap, indikator Memuat berikutnya, tombol fallback, akhir daftar. Cursor harus terikat owner + filter + sort/revisi daftar; respons lama tidak boleh masuk ke konteks baru.

Pemulihan harus memuat kembali batch yang diperlukan sebelum memulihkan gulir/fokus. Jangan mengandalkan angka page saja bila list server sudah berubah. Wishlist juga memerlukan allowlist pada returnTo login dan kembali Detail. State lokasi tidak memuat ID akun, seluruh isi Wishlist, catatan pribadi, atau token autentikasi dalam URL.

## 5. Status dan penanda penting

| Kelompok | Status | Pemicu/dampak | Tampilan dan tindakan |
| --- | --- | --- | --- |
| Mode penyimpanan | Sementara | Guest; data lokal sesi | Keterangan mode + Masuk; simpan lokal tetap boleh |
| Mode penyimpanan | Tersimpan di akun | Sesi sah dan persistence server terkonfirmasi | Daftar privat; tidak menyebut permanen jika adapter hanya mock |
| Sinkronisasi | Menunggu/menggabungkan | Login sah dan snapshot guest belum diproses | Banner progres; hati item terkait pending |
| Sinkronisasi | Sebagian belum digabung | Server hanya mengonfirmasi sebagian | Jumlah selesai/sisa yang diketahui; Coba lagi sisa |
| Sinkronisasi | Belum pasti | Respons mutasi terputus | Periksa hasil, bukan tambah request baru |
| Produk | Tersedia | Aktif, harga/SKU valid dan stok cukup | Aksi beli sesuai jenis |
| Produk | Stok habis | Produk aktif, stok jual 0 | Label teks Stok habis; tetap boleh disimpan, beli nonaktif |
| Produk | Tidak tersedia | Produk nonaktif/tidak ditayangkan atau akses penayangan dibatasi | Beli nonaktif; hapus tetap tersedia bagi pemilik |
| Data | Belum diperbarui | Cache/offline/revalidasi gagal | Jangan tampilkan stok/harga cache sebagai jaminan saat ini |
| Data | Tidak ditemukan | ID produk tidak dapat diselesaikan | Baris minimal bila masih ada referensi lokal; hapus/coba sinkronisasi |
| Akses | Perlu masuk kembali | Sesi akun habis | Cache akun ditutup; login aman dan pemulihan konteks |

Status Wishlist tidak menambahkan status bisnis pesanan. Produk ditambahkan ke Keranjang tidak menjadi status Dibeli, stok tidak direservasi, dan item Wishlist tidak otomatis dihapus.

**Fakta SQL:** status produk yang ditemukan AKTIF/NONAKTIF, bukan enum Diarsipkan. Jangan menciptakan status Arsip baru hanya untuk memenuhi matriks. Untuk hard delete, FK item Wishlist memakai ON DELETE CASCADE; row server dapat hilang sehingga placeholder produk terhapus tidak bisa dijanjikan terus tersedia. Placeholder berlaku pada referensi lokal/cache atau respons tombstone yang benar-benar disediakan layanan.

## 6. Tindakan dan dampaknya

| Tindakan | Prasyarat/aktif | Dampak berhasil | Gagal/pembatalan/pemulihan |
| --- | --- | --- | --- |
| Simpan produk | Produk boleh dilihat; keanggotaan diketahui; tidak pending | Guest tulis lokal / akun upsert; semua hati tersinkron | Simpan gagal tidak mengklaim berhasil; retry idempotent |
| Hapus dari Wishlist | Pemilik yang sesuai; item ada; tidak pending | Hanya membership item itu dihapus; cart tidak berubah | Tetap/rollback ke keadaan terkonfirmasi; retry; setelah berhasil Simpan kembali |
| Simpan kembali | Item terakhir masih boleh disimpan dan owner sama | Keanggotaan ditambahkan lagi | Produk berubah/tidak tersedia: jelaskan dan buka pilihan lain |
| Lihat Detail | Tujuan produk dapat diakses | Detail dibuka dari atas, konteks list disimpan | Not-found punya Kembali ke Wishlist; tidak menghapus konteks |
| Tambah ke Keranjang | Standar, tidak memerlukan varian, harga/SKU/stok valid |1 unit ditambah sesuai kontrak; Wishlist tetap | Stok/limit/konflik/timeout ditangani dengan snapshot keranjang terbaru |
| Pilih varian | Produk memiliki varian atau SKU belum ditentukan | Buka Detail untuk memilih | Tidak pernah memilih varian pertama secara diam-diam |
| Racik buket | Produk dasar buket sah | Buka konfigurator dan guard-nya | Tidak dianggap menambahkan desain siap beli |
| Masuk | Guest/perlu sesi | Login aman dengan konteks; merge setelah sesi sah | Guest dipertahankan bila batal/gagal login |
| Coba gabungkan lagi | Ada sisa/hasil terverifikasi belum tersimpan | Hanya sisa diproses; dedupe | Snapshot dan ID operasi dipertahankan pada hasil belum pasti |
| Reset filter | Filter aktif | Hanya query/filter/cursor direset | Membership tidak berubah |
| Muat berikutnya | hasMore/cursor valid; tidak pending | Append unik sesuai query saat ini | Item lama dipertahankan; retry batch yang gagal |

Pencegahan ganda memakai pending per item dan operasi yang menyatakan keadaan akhir. Pada akun, UI pending saja tidak menggantikan idempotency dan pemeriksaan konkurensi server.

## 7. Aturan bisnis, validasi dan hak akses

### 7.1 Identitas item dan versi awal

**Usulan P0:** simpan produk induk, key kanonis productId dalam daftar default pemilik. varian_produk_id tetap NULL. Ini sesuai perilaku hati yang ada dan menghindari keputusan terselubung mengenai pilihan varian.

Produk yang sama hanya satu membership walaupun ditampilkan di beberapa kategori atau slug berubah. productId diperlakukan sebagai identifier string dalam JavaScript; jangan mengandalkan slug atau mengonversi BIGINT ke Number yang dapat kehilangan presisi.

SQL memungkinkan varian spesifik. Mengaktifkannya adalah P2/keputusan terpisah: perlu definisi key (productId, variantId), label varian dan semantik hati produk induk. Jika layanan nyata sudah mengembalikan item varian non-NULL, jangan menormalisasi/menghapusnya diam-diam; adapter harus mempertahankan referensi, menampilkan varian atau menandai dukungan belum lengkap dengan jalur Detail. Tidak boleh toggle product-level menghapus semua varian tanpa keputusan yang jelas.

### 7.2 Ketersediaan dan pembelian

- Produk aktif yang habis stok tetap boleh disimpan.
- Harga tidak valid tidak menghalangi mengingat produk yang boleh dilihat, tetapi menghalangi pembelian.
- Produk nonaktif/tidak dipublikasikan tidak ditambahkan baru melalui ID tebakan. Item yang sudah tersimpan dapat menampilkan status minimum yang diizinkan backend dan tetap dapat dihapus.
- Saving Wishlist tidak memerlukan alamat, kode pos, jadwal pengiriman atau pembayaran.
- Batas kuantitas P-05 (20 per produk, 50 total pesanan) berlaku saat masuk Keranjang/pesanan, **bukan batas jumlah item Wishlist**.
- Batas item/daftar Wishlist belum ditetapkan; jangan menciptakan maksimum 20/50 atau TTL permanen dari aturan keranjang.
- Menambah ke Keranjang tidak menghapus Wishlist atau menahan harga.
- Buket Kustom yang disimpan adalah produk dasar, bukan konfigurasi atau pesan pribadi.

### 7.3 Validasi dan integritas

- ID produk valid, dapat diakses dan bukan milik skenario palsu produksi.
- Jika varian didukung kelak, varian harus milik produk yang sama dan dapat dipilih.
- Produk baru harus divalidasi server untuk akun; data guest dianggap tidak tepercaya.
- Search dibatasi dan di-escape; mengikuti panjang 100 karakter yang sudah dipakai parser Katalog sebagai usulan konsistensi. Batas ini untuk input pencarian, bukan nama produk.
- Nama produk dalam SQL maksimal 150 karakter; UI tetap menangani data di luar ekspektasi tanpa overflow.
- catatan_keinginan maksimal 255 menurut SQL, hanya bila P2 diaktifkan; Unicode plain text, tidak HTML.
- Satu default list per akun diselesaikan secara idempotent; nama default Favorit Saya dari SQL tidak berarti user harus mengelola koleksi.
- DELETE/remove untuk item yang sudah hilang diperlakukan sebagai keadaan akhir sudah tidak tersimpan; jangan menampilkan error palsu yang tidak dapat dipulihkan.
- Aksi lintas akun harus ditolak server walaupun UI menyembunyikan tombol.

### 7.4 Konflik indeks UNIQUE dan NULL

**Fakta:** SQL membuat UNIQUE pada (daftar_keinginan_id, produk_id, varian_produk_id), sedangkan varian_produk_id nullable. MySQL mengizinkan lebih dari satu NULL pada UNIQUE, sehingga indeks itu saja tidak menjamin satu item product-level saat request berlomba. [Dokumentasi resmi MySQL](https://dev.mysql.com/doc/refman/8.0/en/create-index.html).

**Kebutuhan backend:** pilih mekanisme keunikan atomik yang menormalkan key varian NULL, sesuai versi MySQL target; transaksi/upsert dan pengujian konkurensi wajib. SELECT lalu INSERT tanpa perlindungan unik bukan penyelesaian race. Dokumen ini tidak menulis atau menjalankan DDL/migrasi, dan tidak menganggap validasi DB sudah lulus.

### 7.5 Hak akses dan keamanan proses

Owner berasal dari sesi server, bukan query/body ownerId. Daftar privat tidak dapat diakses lewat mengganti ID. Aksi mutasi mengikuti proteksi CSRF, cookie/sesi, validasi dan rate-limit proyek; tidak menambah CAPTCHA/MFA Wishlist tanpa dasar.

Login returnTo dibatasi route internal yang terdaftar. Jangan memasukkan snapshot seluruh Wishlist, catatan, identitas akun atau kredensial ke URL. Sesi habis tidak otomatis menyalin data akun ke guest.

## 8. Matriks seluruh state yang relevan

P0 menyertakan state yang memang muncul dari alur utama dan integrasi; simulasi dev memakai adapter/workbench yang terpisah. State layanan bersyarat hanya dipicu oleh respons nyata atau fixture dev yang jelas, bukan oleh aturan bisnis buatan.

| Area/komponen | State | Pemicu | Isi tampilan/pesan | Tindakan tersedia | Data/input dipertahankan | Jalur pemulihan | Prioritas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Halaman | S01 Guest normal | Belum masuk, storage sesi berfungsi | Mode sementara di tab ini; daftar sendiri | Simpan/hapus, cari, detail, masuk | ID guest dan konteks | Masuk untuk permanensi | P0 |
| Halaman | S02 Akun normal | Sesi sah dan daftar berhasil dimuat | Daftar privat terkonfirmasi | Semua aksi yang valid | Membership akun dan konteks pemilik | Revalidasi saat kembali | P0 |
| Hati/kontrol | S03 Hover/focus | Pointer/keyboard | Fokus nyata, ikon dan label jelas | Aksi sesuai state | Fokus/pemicu | Fokus tidak hilang saat render | P0 |
| Hati/filter | S04 Selected/expanded | Item tersimpan atau sheet terbuka | Hati selected; filter aktif; aria state | Hapus/reset/tutup | Pilihan dan draft kontrol | Kembali ke kontrol asal | P0 |
| Hati | S05 Membership unknown | Status item belum diketahui | Memeriksa Wishlist; kontrol pending | Buka Detail/kontrol lain | Referensi produk | Muat keanggotaan, retry jika gagal | P0 |
| Halaman | S06 Loading awal | Daftar belum tersedia | Skeleton/status Memuat Wishlist | Navigasi umum yang aman | URL/konteks guest | Hasil/error yang sesuai | P0 |
| Daftar | S07 Memperbarui | Revalidasi setelah kembali/focus | Item lama tetap; Memperbarui | Filter/read; mutasi hanya data sah | Kartu dan scroll | Ganti snapshot terverifikasi | P0 |
| Daftar | S08 Memuat berikutnya | Sentinel/tombol, hasMore | Loading batch, kartu lama tetap | Navigasi/kartu lain | Batch/cursor/query lama | Append unik atau retry batch | P0 |
| Daftar | S09 Batch berikut gagal | Request append gagal | Belum dapat memuat produk berikutnya | Coba lagi | Semua kartu yang sudah dimuat | Ulangi cursor yang masih sah | P0 |
| Daftar | S10 Akhir daftar | hasMore false | Semua produk telah ditampilkan | Filter/navigasi | Daftar dan scroll | Tidak meminta batch lagi | P0 |
| Item | S11 Menyimpan | Tulis lokal/request akun berjalan | Menyimpan; hati item terkait nonaktif | Produk lain | Keadaan terakhir terkonfirmasi | Konfirmasi/retry/reconcile | P0 |
| Item | S12 Menghapus | Request hapus berjalan | Menghapus, kartu tetap sementara | Produk lain | Item dan konteks | Hapus setelah berhasil/pertahankan jika gagal | P0 |
| Item | S13 Simpan berhasil | Storage/server mengonfirmasi | Tersimpan sesuai mode | Detail/keranjang | ID, mode, savedAt sah | Sinkronisasi semua hati | P0 |
| Item | S14 Hapus berhasil | Keadaan akhir absent terkonfirmasi | Produk dihapus; Simpan kembali | Simpan kembali/navigasi | Referensi terakhir milik pemilik sama | Re-save dengan validasi baru | P0 |
| Daftar | S15 Benar-benar kosong | Tidak ada membership | Wishlist masih kosong; Jelajahi Katalog | Ke Katalog | Mode dan konteks asal | Simpan produk pertama | P0 |
| Daftar | S16 Search tanpa hasil | Query tidak cocok | Tidak ada produk yang cocok | Hapus query | Membership dan filter lain | Tampilkan hasil tanpa query | P0 |
| Daftar | S17 Filter tanpa hasil | Kombinasi filter menyingkirkan semua | Belum ada produk sesuai filter | Reset/kurangi filter | Seluruh Wishlist | Filter ulang tanpa menghapus item | P0 |
| Metadata | S18 Sebagian produk gagal | Hydration sebagian gagal | Kartu valid + item/ringkasan gagal terpisah | Retry metadata/hapus referensi | Membership/produk valid | Muat ulang bagian gagal, bukan seluruh mutasi | P0 |
| Foto | S19 Gambar gagal | Aset rusak/tidak ada | Placeholder proyek + nama | Detail/hati bila data lain sah | Identitas dan metadata | Coba muat bila relevan | P0 |
| Harga | S20 Harga belum tersedia | Nilai hilang/tidak valid | Harga belum tersedia | Detail, simpan/hapus | Membership | Perbarui data sebelum beli | P0 |
| Produk | S21 Stok habis | Produk aktif, stok 0 | Label Stok habis, beli nonaktif | Simpan/hapus/detail | Produk tersimpan | Revalidasi kemudian; tanpa notifikasi stok palsu | P0 |
| Produk | S22 Nonaktif/tidak ditayangkan | Katalog membatasi produk | Tidak tersedia; informasi minimum sah | Hapus; bantuan bila tersedia | Referensi owner yang diizinkan | Katalog/refresh; jangan substitusi otomatis | P0 |
| Produk | S23 Tidak ditemukan | ID lokal/cache tak dapat dihidrasi | Produk tidak ditemukan | Hapus referensi/coba sinkronisasi | ID lokal dan konteks | Bersihkan eksplisit atau terima snapshot server terbaru | P0 |
| Varian | S24 Perlu dipilih | hasVariants/SKU belum lengkap | Pilih varian | Ke Detail | Produk dan konteks kembali | Pilih secara eksplisit | P0 |
| Data | S25 Metadata wajib tidak lengkap | Unit/jenis/identitas pembelian belum jelas | Informasi belum lengkap | Detail/refresh; hapus tetap boleh | Wishlist | Lengkapi dari sumber sah sebelum beli | P0 |
| Konten | S26 Nama/harga panjang | Nilai ekstrem valid | Wrap/clamp yang tetap dapat dipahami | Aksi tetap terjangkau | Konten lengkap untuk aksesibilitas | Buka Detail | P0 |
| Duplikasi | S27 Sudah tersimpan | Add/merge ulang | Keadaan tersimpan, tanpa item ganda | Lanjut belanja/hapus | Satu membership kanonis | Idempotent success | P0 |
| Katalog | S28 Harga berubah | Revalidasi harga | Harga saat ini; pemberitahuan jika memengaruhi tindakan | Tinjau/tambah dengan harga terbaru yang tervalidasi | Membership dan pilihan | Validasi keranjang; jangan mengunci harga lama | P0 |
| Katalog | S29 Stok/status berubah saat add | Final validation menolak pembelian | Stok/jumlah terbaru, alasan | Sesuaikan di Detail/Keranjang | Wishlist tetap | Revalidasi dan ulangi tindakan sah | P0 |
| Simpan/hapus | S30 Gagal definitif | Respons jelas belum diterapkan | Perubahan belum tersimpan | Coba lagi | Keadaan terkonfirmasi dan intent | Ulangi idempotent | P0 |
| Mutasi | S31 Hasil belum pasti/timeout | Respons hilang setelah request | Hasil belum dapat dipastikan | Periksa hasil | ID operasi, intent, owner | Reconcile sebelum kirim baru | P0 |
| Proses | S32 Berlangsung lama | Belum selesai dalam waktu wajar | Masih memproses; tindakan terkait pending | Jelajah/periksa status | ID operasi/snapshot | Lanjut/retry sesuai status, bukan sukses palsu | P0 |
| Halaman | S33 Gagal memuat | Fetch daftar gagal sebelum ada data | Wishlist belum dapat dimuat | Coba lagi/ke katalog | Query dan guest lokal | Load ulang | P0 |
| Guest offline | S34 Simpan lokal offline | Produk sudah dikenal, storage berfungsi | Tersimpan sementara; data katalog belum diperbarui | Simpan/hapus lokal/detail cache | ID guest | Hydrate setelah online | P0 |
| Akun offline | S35 Mutasi memerlukan koneksi | Tidak ada jaringan | Sambungkan kembali; belum tersimpan | Retry saat online | Intent aman dan keadaan terakhir | Jangan klaim antrean sinkronisasi yang tidak ada | P0 |
| Layanan | S36 Maintenance/gangguan | Server memberi kondisi layanan | Sementara belum tersedia | Coba lagi/katalog | Guest dan konteks yang sah | Reconnect ketika layanan pulih | P0 |
| Layanan | S37 Rate-limited | Respons retryAt/Retry-After | Tunggu sesuai respons | Retry setelah boleh | Input/intent | Countdown berdasarkan server; tanpa batas buatan | P0 |
| Sesi | S38 Guest login dibatalkan | Kembali/batal dari auth | Tetap mode sementara | Lanjut guest/masuk lagi | Guest tidak dibuang | Coba login lagi | P0 |
| Sesi | S39 Sesi akun berakhir | Respons sesi/expiry | Masuk kembali; daftar akun ditutup | Login/katalog | Konteks aman dan pending owner-bound | Pulihkan setelah owner sah | P0 |
| Akses | S40 Denied/akun dibatasi | Server menolak | Akses tidak diizinkan | Akun/bantuan/katalog | Hanya konteks nonrahasia | Tidak bypass ke akun lain/guest | P0 |
| Akses | S41 Verifikasi diperlukan | Server benar-benar mensyaratkan | Lengkapi verifikasi | Ke alur verifikasi yang ada | Guest dan returnTo aman | Lanjut setelah akses sah | P0 bersyarat |
| Merge | S42 Menunggu merge | Sesi sah, guest belum diproses | Menyiapkan penggabungan | Lanjut menjelajah | Snapshot guest dan target owner | Mulai dengan ID operasi tetap | P0 |
| Merge | S43 Menggabungkan | Operasi berjalan | Sedang menggabungkan | Read/jelajah; hati terkait pending | Snapshot dan item akun sebelumnya | Konfirmasi hasil | P0 |
| Merge | S44 Berhasil | Semua diterima/sudah ada | Wishlist digabung | Lanjut belanja | Daftar akun | Hapus hanya guest yang terkonfirmasi | P0 |
| Merge | S45 Sebagian berhasil | Ada item sisa/ditolak | Yang selesai dan sisa diketahui | Coba lagi sisa/hapus referensi invalid | Sisa guest owner-bound | Retry selektif; tidak mengulang yang selesai | P0 |
| Merge | S46 Gagal sebelum commit | Kegagalan terkonfirmasi | Belum berhasil digabung | Coba lagi | Guest dan daftar akun | Jangan clear sumber | P0 |
| Merge | S47 Respons tidak pasti | Timeout/putus setelah kirim | Status penggabungan belum pasti | Periksa hasil | Snapshot/operationId | Reconcile request yang sama | P0 |
| Merge | S48 Commit sukses, render gagal | Membership tersimpan, hydration gagal | Tersimpan; rincian belum termuat | Muat rincian lagi | ID hasil yang terkonfirmasi | Retry data, bukan mutasi baru | P0 |
| Owner | S49 Akun berganti/logout | Scope autentikasi berubah | Cache akun lama ditutup | Daftar owner baru/guest baru | Buffer lama hanya jika tetap terikat owner asal | Tolak respons terlambat dari owner lama | P0 |
| Storage | S50 Storage guest diblokir | sessionStorage tidak dapat ditulis | Hanya bertahan pada halaman ini | Lanjut sementara/masuk | Memori yang masih hidup | Izinkan storage/retry; jangan janji persistence | P0 |
| Storage | S51 Payload rusak/versi tak dikenal | Parse/validasi storage gagal | Sebagian data sementara tidak dapat dibaca | Reset data rusak secara jelas/lanjut yang valid | ID valid, bukan harga/cache rusak | Migrasi versi yang dikenal atau bersihkan eksplisit | P0 |
| Konflik | S52 Membership diubah di tempat lain | Revisi akun berubah | Daftar sudah diperbarui | Muat terbaru/tinjau intent | Query/scroll/intent sesuai owner | Terapkan desired state setelah rekonsiliasi | P0 |
| Cursor | S53 Hasil lama/cursor usang | Filter/sort/owner/revisi berganti | Hasil terbaru dimuat | Coba muat ulang | Keanggotaan dan filter terbaru | Abaikan respons lama; reset batch seperlunya | P0 |
| Keranjang | S54 Add sedang berlangsung | Validasi/tambah 1 unit | Menambahkan; aksi item terkait pending | Produk lain | Wishlist dan konteks | Snapshot keranjang/hasil sesuai operasi | P0 |
| Keranjang | S55 Add berhasil | Keranjang mengonfirmasi | Ditambahkan; Lihat Keranjang | Lihat Keranjang/lanjut belanja | Wishlist tetap | Tidak menghapus produk favorit | P0 |
| Keranjang | S56 Limit/konflik/add gagal | Batas 20/50, stok, revisi atau kegagalan | Alasan spesifik dan tindakan | Tinjau Keranjang/Detail/retry | Wishlist dan intent | Jangan menambah otomatis setelah perubahan besar | P0 |
| Keranjang | S57 Add tidak pasti | Respons terputus | Periksa keranjang terbaru | Periksa hasil | OperationId/add context | Jangan double increment | P0 |
| Navigasi | S58 Kembali dari Detail | Back/returnTo sah | Query, filter, batch, scroll dipulihkan | Lanjut daftar | Konteks tanpa data akun lintas owner | Fokus item/posisi terdekat jika item hilang | P0 |
| Form catatan | S59 Draft belum disimpan | Editor P2 diedit | Penanda perubahan dan simpan/batal | Simpan/batal/tetap mengedit | Draft lokal owner-bound | Konfirmasi meninggalkan hanya editor ini | P2 bersyarat |
| Form catatan | S60 Validasi/konflik/simpan gagal | >255 atau revisi/layanan menolak | Error field atau versi berubah | Perbaiki/reload/batal | Teks draft dan versi | Tidak menimpa versi baru tanpa peninjauan | P2 bersyarat |

Catatan matriks:
- Tidak ada state persetujuan staf/produksi/pembayaran sebagai proses Wishlist.
- Status read-only hanya digunakan saat cache data belum dapat diverifikasi atau aksi sedang tidak diizinkan; bukan mode admin baru.
- Tautan Wishlist tidak berbagi isi atau otomatis kedaluwarsa sebagai undangan, karena fitur berbagi tidak termasuk versi awal.
- Catatan P2 dan verifikasi bersyarat bukan kewajiban membuat fitur bisnis tambahan.
- Akses per item, pending, offline dan fokus harus dapat diperiksa lewat fixture/workbench dev yang tidak aktif pada host produksi.
- Waktu tunggu/rate limit memakai respons layanan; tidak menambahkan angka percobaan/TTL akun yang tidak ditetapkan.

## 9. UX dan aksesibilitas

1. Gunakan HTML semantik: main, h1, toolbar berlabel, daftar/kartu article, status dan tombol nyata.
2. Hati mempunyai aria-pressed dan nama spesifik “Hapus Monstera Deliciosa dari Wishlist”, bukan hanya ikon tanpa label.
3. Hati dalam state unknown/pending tidak memberikan informasi saved/unsaved palsu. Gunakan aria-busy pada area yang diperbarui dan pesan singkat.
4. Kontras teks dan kontrol mengikuti standar aksesibilitas proyek; selected tetap ditunjukkan bentuk isi/aria selain warna.
5. Target minimum 44 px untuk kontrol penting; ikon dapat mempertahankan ukuran visual yang sama. Sisakan ruang antara hati, Detail, dan Keranjang.
6. Keyboard menjangkau header, toolbar, kartu dan load-more secara logis. Tidak membuat seluruh kartu sebagai link yang membungkus tombol lain.
7. Sheet/dialog memakai native dialog/pola yang ada: fokus awal, trap, Escape/X/backdrop, pengembalian fokus dan penanganan browser Back.
8. Filter tidak mengalihkan fokus saat mengetik. Perubahan jumlah hasil diumumkan dengan aria-live polite tanpa membaca semua kartu ulang.
9. Setelah item hilang, fokus ke kontrol sejenis item berikutnya, item sebelumnya, atau CTA empty. Jangan jatuh ke body atau header.
10. Produk tidak tersedia tetap mempunyai nama/status/action hapus yang dapat diakses.
11. Skeleton mengikuti proporsi kartu dan tidak memakai nama/harga palsu; kurangi animasi sesuai prefers-reduced-motion.
12. Mobile tidak mempunyai toolbar/footer yang menutupi tombol atau field. Label dan nilai harga tidak bertabrakan pada 320 px, zoom 200%, atau teks panjang.
13. Muat berikutnya memiliki tombol yang dapat digunakan tanpa IntersectionObserver; produk tambahan tidak menduplikasi ID/fokus.
14. Status sementara di tab dan permanen di akun harus mudah ditemukan. Jangan memakai copy “tersimpan” yang menyembunyikan mode dan keterbatasan adapter.
15. Halaman tetap menyediakan penjelasan/navigasi dasar bila scripting tidak aktif, tanpa berpura-pura fungsi simpan tersedia.

## 10. Data, keamanan dan kebutuhan sistem

### 10.1 Data minimum usulan frontend

Ini kontrak konseptual, bukan endpoint yang sudah tersedia.

| Kelompok | Data minimum |
| --- | --- |
| Scope | guest/account, opaque owner scope/revisi sesi; tidak dipaparkan sebagai ownerId yang dapat dipilih klien |
| Membership | productId string, saved state, savedAt sah, item/list revision; variantId nullable untuk kompatibilitas |
| Produk | slug, nama, gambar/alt, kategori, jenis, hasVariants, unit, harga normal/aktif, periode diskon, ketersediaan/stock snapshot |
| Daftar | items, total bila diketahui, nextCursor/hasMore, list revision, partial failures |
| Operasi | ID operasi/idempotency, desired state, target key, expected revision bila dipakai, outcome confirmed/rejected/unknown |
| Merge | source snapshot/revision, target scope, accepted/alreadySaved/remaining per identity dan alasan yang aman |
| Error | Kode aman, pesan tindakan, retryAt bila ada; tanpa stack trace, SQL atau data akun lain |

Harga rupiah integer dan formatter id-ID. Waktu server UTC, tampilan WIB. Guest savedAt berasal dari klien dan hanya urutan lokal; server tidak memercayainya sebagai waktu komit bisnis.

### 10.2 Penyimpanan guest dan akun

**Usulan P0:** sessionStorage per tab menyimpan version, productId unik dan waktu simpan lokal. Tidak menyimpan harga, stok, HTML, kredensial atau data akun. Cache metadata publik opsional terpisah dan ditandai usang setelah revalidasi gagal.

Jika mekanisme sessionStorage digunakan, copy menyebut “tab ini”. Jangan menjanjikan sinkronisasi lintas tab, perangkat atau sesi. Kebijakan retensi/lintas tab adalah asumsi terbuka yang dapat diubah sebelum implementasi tanpa mengganti UI inti.

Akun memakai server sebagai sumber kebenaran dan cache memori yang terikat identitas. Tidak menyalin seluruh Wishlist akun ke storage guest. Saat logout/owner berubah, bersihkan cache/undo/pending UI milik owner lama sebelum merender konteks baru. Buffer merge yang belum selesai tetap terikat target awal dan tidak dibuka oleh akun berikutnya.

Halaman akun privat tidak boleh dilayani dari cache publik. Revalidasi pada pageshow/focus atau perubahan sesi diperlukan agar kembali browser tidak menampilkan koleksi pemilik sebelumnya. Jangan mengandalkan localStorage marker sebagai otorisasi produksi.

### 10.3 Operasi adapter yang dibutuhkan

Operasi logis usulan: baca membership/daftar, hydrate katalog, setSaved(desired state), mergeGuest(snapshot), reconcile(operationId), serta delegasi add ke adapter Keranjang.

- Tidak menentukan route HTTP, URL endpoint, bentuk token produksi atau library baru.
- SetSaved(true/false) lebih aman daripada toggle saat retry.
- Tindakan server memeriksa owner, product visibility, uniqueness, versi dan CSRF.
- Merge harus aman terhadap request ganda dan respons terlambat.
- Daftar/cursor baru tidak boleh dicampur dengan respons query/owner lama.
- Preview harus bisa diganti melalui adapter tanpa membangun ulang layout.

### 10.4 Pembagian frontend/backend

| Frontend | Backend |
| --- | --- |
| Kartu/shell, store/subscription, filter dan presentasi | Otorisasi pemilik, daftar default dan persistence |
| Guest sementara dan validasi payload lokal | Validasi guest import sebagai input tidak tepercaya |
| Pending per item, feedback, fokus, sheet dan state | Mutasi idempotent/atomic, uniqueness NULL dan konflik |
| Context return, query invalidation dan skeleton | Katalog terhidrasi yang diizinkan, current price/status |
| Preview/workbench terisolasi | Merge hasil per item dan rekonsiliasi operasi |
| Memisahkan temporary vs confirmed UI | Validasi ulang Keranjang/SKU/stock/limit dan sesi |

Audit Wishlist tidak diinventarisasi sebagai log bisnis staf yang wajib untuk setiap klik. Log teknis mutasi/merge cukup untuk investigasi sesuai praktik proyek, dengan privasi dan retensi yang ditentukan. Catatan pribadi P2 tidak masuk analytics/log/URL tanpa dasar. Tidak menampilkan rahasia, session token atau identitas akun lain.

### 10.5 Gap integrasi yang nyata

- Belum ada halaman Wishlist HTML aktif, repository/store bersama, API atau controller yang berfungsi.
- Model SQL ada, tetapi impor/migrasi/layanan produksi tidak dinyatakan lulus.
- Favorit antar Beranda/Katalog/Detail belum tersinkron atau persistent.
- Heart membership saat ini berdasarkan slug/boolean, bukan canonical productId + owner.
- Formatter kartu masih mengandung suffix pot; perlu normalisasi satuan.
- Adapter add keranjang memilih SKU fixture dari productId; belum bukti mendukung varian produksi.
- Allowlist Detail dan auth returnTo perlu diperluas terbatas untuk Wishlist.
- Header dari Buket Kustom saat ini mengarah ke Katalog saved=1; tujuan ini harus disamakan ketika Wishlist aktif.
- Merge guest/permanensi akun memerlukan layanan nyata; marker auth preview tidak memenuhi keamanan/kepemilikan akun.

## 11. Daftar pekerjaan dan kriteria selesai

### 11.1 Wajib P0

1. Buat route Wishlist dan gunakan shell yang ada.
2. Definisikan DTO product-level, owner scope, kategori kesalahan dan kontrak adapter.
3. Implementasikan store bersama dan guest session storage dengan versi/validasi/fallback.
4. Sambungkan hati Beranda/Katalog/Detail/Wishlist tanpa mengubah warna atau komponen visualnya.
5. Buat list, toolbar, grid responsif, search, filter, sort, empty states dan incremental loading.
6. Terapkan akses akun privat, integrasi login returnTo dan merge yang dapat direkonsiliasi.
7. Sambungkan Detail/Keranjang/Buket Kustom sesuai jenis dan kebutuhan varian.
8. Terapkan states P0, fokus, reduced motion, respons terlambat dan pemulihan.
9. Siapkan workbench lokal dengan data contoh, state storage/access/merge, serta kontrol yang tidak masuk alur produksi.
10. Perbaiki keunikan server untuk product-level NULL sebelum persistence akun dinyatakan selesai.
11. Dokumentasikan mana preview dan mana integrasi, lalu jalankan pemeriksaan visual dan regresi ketika implementasi diminta.

### 11.2 P1/P2

- P1: penyempurnaan optimasi gambar, cache publik dan pengamatan sinkronisasi akun, setelah kontrak/sesi benar.
- P2: multi-koleksi/rename, varian spesifik, catatan 255 karakter, aksi massal, share, notifikasi harga/stok dan simpan desain buket. Masing-masing memerlukan keputusan ruang lingkup/kontrak sendiri.
- Tidak memasukkan fitur tersebut ke UI sebagai tombol mati atau “segera hadir” tanpa kebutuhan.

### 11.3 Ketergantungan

- Sumber identitas produk, kategori, satuan, varian dan visibilitas yang dapat dipercaya.
- Auth customer dan persistence Wishlist untuk klaim permanen.
- Deduplikasi DB yang aman pada NULL dan transaksi.
- Keranjang yang menerima identitas SKU yang benar.
- Allowlist navigasi dan return context yang sudah diperluas.
- Fixture preview konsisten antarlaman, bukan endpoint rekaan.

### 11.4 Kriteria penerimaan

| ID | Kriteria yang dapat diperiksa |
| --- | --- |
| W-01 | Guest simpan pada Katalog, buka Wishlist dan Detail pada tab sama, serta reload: item tetap ada selama session storage berfungsi |
| W-02 | Storage diblokir menampilkan batas mode memori; tidak mengklaim tersimpan antarlaman/akun |
| W-03 | Hati untuk productId yang sama konsisten pada semua halaman/instance; warna/fill cocok dengan kartu Homepage |
| W-04 | Produk yang sama tidak terduplikasi melalui klik cepat, dua request, merge ulang, pergantian kategori atau slug |
| W-05 | Login batal/gagal tidak menghapus guest; sesi sah menggabungkan tanpa menghilangkan item akun |
| W-06 | Merge partial hanya menghapus source yang dikonfirmasi; item baru setelah snapshot tidak ikut dibuang |
| W-07 | Timeout merge/setSaved diperiksa lewat operasi yang sama, tanpa menggandakan |
| W-08 | Logout akun A lalu masuk B, termasuk browser Back, tidak menunjukkan data/undo/respons lama A |
| W-09 | Search/filter/sort langsung, Reset hanya mengubah hasil, bukan membership |
| W-10 | Pencarian kosong dan Wishlist kosong mempunyai pesan/CTA berbeda |
| W-11 | Batch berikut tidak menggandakan kartu; kegagalan append mempertahankan daftar; fallback button bekerja |
| W-12 | Kembali dari Detail memulihkan query/filter/urutan/batch/scroll/fokus, termasuk saat item telah dihapus |
| W-13 | Produk ber-varian tidak ditambah menggunakan pilihan default diam-diam; custom bouquet membuka konfigurator dan guard yang ada |
| W-14 | Tambah standar menambah 1 unit dengan stok/revisi/limit divalidasi; Wishlist tetap tersimpan |
| W-15 | Stok habis tetap dapat disimpan; nonaktif/hard-deleted tidak dapat dibeli dan tidak membocorkan data nonpublik |
| W-16 | Harga/satuan hilang tidak menghasilkan Rp0 atau suffix pot palsu; angka besar/nama panjang/gambar rusak tidak merusak kartu |
| W-17 | Hapus/simpan kembali bekerja dengan scope owner yang sama; kegagalan tidak menampilkan keadaan berhasil palsu |
| W-18 | Offline guest lokal dapat bekerja pada produk yang sudah dikenal; akun offline tidak menjanjikan write server |
| W-19 | Akses owner/SKU/CSRF dan konflik divalidasi server; preview tidak dijadikan kontrol akses |
| W-20 | Indeks/operasi product-level NULL diuji dengan request bersamaan dan menghasilkan satu item |
| W-21 | Keyboard, fokus setelah hapus, trap/close sheet, target 44 px, kontras dan live status dapat digunakan |
| W-22 | Layout dirender dan diperiksa pada desktop lebar/menengah serta 320/390/768 px; tanpa overflow/aksi tertutup |
| W-23 | Semua entry point Wishlist menuju tujuan yang sama; pencarian header tetap ke Katalog |
| W-24 | Preview/workbench terisolasi; account sync/merge tidak dinyatakan produksi bila belum terhubung |
| W-25 | Regresi Homepage, Katalog, Detail, Login, Keranjang dan Buket Kustom tetap lulus setelah shared component/navigation diubah |

Untuk P2 catatan/varian, tambahkan acceptance terpisah sebelum mengaktifkan fiturnya. Dokumen ini belum menjalankan build/browser test Wishlist karena tahap yang diminta adalah spesifikasi, bukan implementasi.

## 12. Asumsi dan keputusan belum pasti

| ID | Status | Usulan/bukti | Dampak dan tindak lanjut |
| --- | --- | --- | --- |
| A-01 | Diputuskan pengguna | Guest sementara, akun permanen | Menjadi dasar dua mode dan alur merge; tidak perlu ditanyakan ulang |
| A-02 | Asumsi perlu dikonfirmasi | Guest sementara per tab memakai sessionStorage; lintas sesi/tab belum diminta | Copy harus jujur; jika diminta tahan lintas sesi, tentukan retensi dan sinkronisasi sebelum implementasi |
| A-03 | Usulan P0 | Satu daftar default, produk induk, variantId NULL | Menyelaraskan hati yang ada; varian spesifik perlu keputusan tambahan |
| A-04 | Fakta/gap | SQL mendukung banyak koleksi dan catatan, UI/kebutuhan belum ada | Tidak mengaktifkan otomatis semua kemampuan skema |
| A-05 | Fakta/gap | Tidak ditemukan frame Wishlist bernama demikian pada metadata Public; komponen sumber ada | Rancangan halaman baru mengikuti sistem existing, bukan klaim pixel-match screenshot Wishlist |
| A-06 | Belum ditetapkan | Batas jumlah item Wishlist dan retensi akun/guest lintas sesi | Tidak mengambil batas 20/50 Keranjang sebagai batas Wishlist |
| A-07 | Usulan UX | Tiga kartu bila cukup lebar, dua menengah, satu mobile; batch 6 | Diuji dengan kartu nyata/teks panjang saat implementasi; bukan ukuran Figma final |
| A-08 | Gap backend kritis | UNIQUE nullable, controller/route scaffold, auth/cart masih preview | Perlu layanan/DDL yang direkonsiliasi sebelum klaim permanensi produksi |
| A-09 | Usulan merge | Union idempotent; sumber hanya dibersihkan per hasil konfirmasi; sisa terikat owner | Perlu hasil per-item dan rekonsiliasi; jangan memakai clear-all lokal |
| A-10 | Batas domain | Wishlist tidak menyimpan racikan buket, stok, atau harga terkunci | Menjaga model SQL dan pesan pribadi konfigurator tidak disalin tanpa fitur baru |
| A-11 | Belum ada dasar | Notifikasi stock/price, share, aksi massal, catatan pengguna, koleksi publik | Tidak dimasukkan ke P0 atau dibuat seolah sudah aktif |
| A-12 | Batas tahap | Permintaan ini menyusun spesifikasi | Implementasi desain/kode, migrasi, aktivasi produksi, commit/push/deploy belum dilakukan |

Keputusan akses guest sudah terjawab. Asumsi teknis rutin di atas dapat dijadikan baseline implementasi berikutnya dengan penandaan yang jelas; dokumen ini tetap tidak mengubah desain atau kode aplikasi.
