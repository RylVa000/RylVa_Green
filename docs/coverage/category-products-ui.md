# Cakupan UI Kategori Produk

19 November 2026. Ekstensi Katalog publik berdasarkan PRODUCT.md, DESIGN.md,
baseline v2.6 dan persetujuan pengguna untuk judul/deskripsi serta filter kategori.
Frontend pratinjau, bukan integrasi database atau transaksi produksi.

## Route dan kategori

- Direktori: `/pages/public/category.html`.
- Kategori: `/pages/public/category.html?category=plants`.
- Alias: `/category.html` dan `/kategori-produk.html`, mempertahankan query.
- Workbench lokal: `/__preview/category-products`, menggunakan skenario adapter
  Katalog existing, tanpa kontrol pengujian pada UI produksi.

Sembilan ID mengikuti Katalog existing: `plants`, `bouquet`, `custom`, `pots`,
`media`, `tools`, `seeds`, `accessories`, `terrarium`. Pengelompokan plants untuk
indoor/outdoor dan media untuk media/nutrients dipertahankan. Ini asumsi rutin
berdasarkan kontrak frontend existing, bukan perubahan taksonomi bisnis.

Registry bersama pada `storefront-shell.js` menyimpan nama, deskripsi, foto,
alias dan tujuan kategori. Delapan fixture produk saat ini semuanya tanaman.
Kategori lain sengaja kosong; tidak menambahkan produk, stok, harga, jumlah
terjual atau klaim perawatan baru.

## Tampilan dan komponen

Direktori berisi sembilan tautan dengan nama/deskripsi. Kategori terpilih memakai
breadcrumb, judul dan deskripsi ringkas, foto kategori existing, tautan kategori
aktif, filter harga/diskon/stok, urutan, chip, jumlah hasil dan kartu Katalog.
Judul sejajar dengan tepi daftar; foto dekoratif kecil di kanan memakai crop
persegi. Gambar produk dan komposisi kartu existing tidak diubah.

Menggunakan kembali kartu produk, sidebar sticky dengan area gulir, bottom sheet
filter/urutan dan gestur, checkbox membulat, pemuatan bertahap enam produk,
tombol muat berikutnya, Wishlist, Keranjang, navigasi Detail/Back, header dan
footer. Desktop mengikuti dua kolom kartu Katalog; tablet dan ponsel mengikuti
breakpoint existing. Tidak ada hero pemasaran atau identitas baru.

Gaya khusus berada pada `category-products.css`. Penyesuaian CSS shell hanya
menambahkan selector tautan kategori ke aturan ukuran tombol navigasi existing;
tidak mengubah ukuran, warna atau layout header/footer.

## Perilaku

- Kategori route tetap berlaku saat mencari, mengurutkan, menyaring dan Reset.
  Kategori tersebut bukan chip yang dapat dihapus. Katalog umum tetap mendukung
  checkbox multi-kategori seperti sebelumnya.
- Search pada kategori menyaring kategori itu. Search pada direktori/kategori
  tidak ditemukan membuka Katalog umum dengan kata kunci. Placeholder dan label
  aksesibel menjelaskan cakupan pencarian kategori.
- Berpindah kategori melalui tautan membuka kategori baru dengan filter bersih.
  URL dan riwayat sebelumnya tetap tersedia ketika kembali.
- Tautan kategori pada navigasi dan tile Beranda membuka halaman kategori.
  Semua Produk, Koleksi Baru, Promo dan editor Buket Kustom mempertahankan tujuan
  masing-masing. Halaman kategori custom yang kosong menyediakan tautan peracik.
- Tautan native tetap melewati guard draf pada Keranjang dan Buket Kustom,
  termasuk Tetap, Escape dan Buang Perubahan. Tidak melewati validasi atau izin.
- Detail menerima sumber kategori same-origin pada allowlist existing, dimulai
  dari atas, dan breadcrumb kembali memakai nama kategori. Back memulihkan query,
  urutan, batas termuat, gulir dan fokus produk.
- Panel Keranjang pada direktori dapat kembali ke Katalog umum ketika kosong;
  tidak mencoba memfokuskan daftar tersembunyi.

## State

| Area/state | Tampilan dan pemulihan | Konteks dipertahankan |
| --- | --- | --- |
| Kategori normal | Judul/deskripsi, pilihan aktif, jumlah dan kartu | Satu kategori route serta filter |
| Tanpa kategori | Direktori sembilan kategori | Tautan native; tidak menebak kategori default |
| Kategori asing/parameter bertentangan | Kategori tidak ditemukan, tautan Katalog dan direktori | Query tidak disisipkan mentah ke HTML |
| Kategori kosong | Belum ada produk di kategori ini; pilih kategori lain/Katalog | Identitas kategori; tidak membuat fixture tambahan |
| Filter tanpa hasil | Pesan hasil kosong dan Reset Pilihan | Reset membersihkan refinements, mempertahankan kategori |
| Rentang harga tidak valid | Pesan inline, `aria-invalid`, nilai valid terakhir untuk hasil | Input pengguna tetap terlihat untuk diperbaiki |
| Loading/update/append/end | State Katalog existing, busy flag, batch nyata dan akhir koleksi | Filter dan jumlah termuat di URL |
| Gagal/offline/timeout/maintenance | Pesan dan Coba Lagi existing | Kategori serta pilihan tidak hilang |
| Harga tidak lengkap/stok habis | Informasi status, aksi beli nonaktif | Detail dan Wishlist tetap mengikuti aturan existing |
| Foto produk gagal | Fallback Foto belum tersedia existing | Informasi produk dan tindakan |
| Foto kategori gagal | Foto dekoratif disembunyikan | Judul/deskripsi tetap lengkap |
| Konten panjang/angka besar | Wrap/clamp dan label aksesibel kartu existing | Detail dapat dibuka |
| Pending/hasil/gagal Keranjang | Cegah ganda, feedback dan pemulihan repository existing | Produk/kategori tidak diganti |
| Fokus/hover/selected/reduced motion | Gaya Katalog, current link dan sheet existing | Escape mengembalikan fokus pemicu |
| Tanpa JavaScript | Direktori native dan penjelasan kebutuhan JS pratinjau | Tidak meninggalkan spinner produk palsu |

Tidak membuat state login, MFA, persetujuan, formulir produksi atau draft baru
pada halaman publik ini. State yang mensyaratkan layanan backend tidak dipalsukan.

## Berkas

| Area | Berkas |
| --- | --- |
| Halaman | `public/pages/public/category.html` |
| Tampilan/identitas kategori | `public/assets/css/storefront/category-products.css`, `public/assets/js/storefront/category-products.js` |
| Registry/tautan shell | `storefront-shell.js`, selector tambahan di `storefront-shell.css` |
| Mesin daftar bersama | `catalog-filter.js`, kontrol/sheet/kartu/repository existing tanpa duplikasi |
| Entry dan kembali | `homepage.js`, `storefront-product-navigation.js`, breadcrumb `product-detail.js` |
| Preview | `config/preview-pages.json`, `tools/preview/serve-dashboard.cjs`, `category-products-states.html` |
| Acuan | `docs/design/surfaces/category-products-surface.md`; PRODUCT.md/DESIGN.md dipertahankan |

Seluruh JS/CSS di tabel berada pada `public/assets/js/storefront/` atau
`public/assets/css/storefront/` sesuai ekstensinya. Seluruh perubahan pengguna
sebelumnya tetap dipertahankan; tidak ada commit/push/deploy.

## Pemeriksaan yang dijalankan

| Pemeriksaan | Hasil |
| --- | --- |
| `verify-category-products.cjs` | 16 kelompok lulus; enam viewport 1920/1440/1024/768/390/320, identitas/gambar/font, filter/Reset/harga, Detail/Back, delapan kategori kosong, parameter asing, sheet/fokus, kegagalan/retry, Wishlist/Keranjang, navigasi dan no-JS. Errors, failedResources dan writes kosong. |
| `verify-category-navigation.cjs` | 4 kelompok lulus; guard draf Keranjang dan Buket (batal/buang), dua capture sheet viewport, pemulihan panel Keranjang direktori dan search kategori tidak ditemukan. Errors kosong. |
| Regresi Katalog | 19 kelompok lulus. Selector navigasi disesuaikan dengan tautan native dan route kategori baru. |
| Regresi Detail Produk | 13 kelompok lulus. |
| Regresi halaman informasi | 7 kelompok lulus. |
| Audit statis HTML/alias | Satu H1, tidak ada ID duplikat, fragment/aset/tujuan lokal hilang; 64 referensi diperiksa; JSON alias valid. |
| Smoke check workbench/alias | 15 skenario dapat dipilih, perubahan kategori memperbarui tujuan, kedua alias mempertahankan query dan merender Pot & Vas; nol page error. |
| `node --check` | JS target, JS bersama yang disentuh, dua pengujian baru serta server preview lulus. |
| `git diff --check` | Lulus; peringatan konversi LF/CRLF dicatat, bukan kegagalan whitespace. |
| Provenance | 28 raster existing pada direktori homepage/catalog, 0 missing; tidak mengubah piksel atau menciptakan aset baru. |

Total 59 kelompok uji fungsi/regresi. Pemeriksaan target awal berhenti karena
selector judul Detail pada test salah, kemudian penantian navigasi Back diganti
menjadi pemeriksaan URL/fokus yang sesuai BFCache. Percobaan tersebut tidak
diklaim lulus. Perbaikan terakhir pada pemulihan direktori dan pencarian tanpa
kategori aktif diuji ulang melalui suite navigasi empat kelompok. Mengetik pada
kategori tidak ditemukan tidak mengubah URL sebelum submit; default UI dan
piksel capture tidak berubah.

Suite navigasi memakai browser context baru pada setiap run agar fixture Keranjang
tidak dipengaruhi penyimpanan dari run sebelumnya. Tidak menghapus penyimpanan
browser pengguna.

19 capture final tersedia di `storage/reports/category-products/` dan
`.impeccable/review/category-products/`. Semuanya dibuka dan dinilai valid:
enam ukuran normal, hasil filter, direktori desktop/mobile, kategori kosong
desktop/mobile, kategori tidak ditemukan, dua sheet viewport, loading/error,
foto gagal, teks panjang dan no-JS. Dua capture modal full-page awal ditimpa
capture viewport yang menunjukkan keadaan layar sebenarnya.

Font pada capture menunggu `document.fonts.ready` dan memeriksa Poppins
400/500/600/700 pada setiap viewport. Resource lokal yang gagal tak terduga
tidak ditemukan. Tidak ada pipeline build frontend; proyek memakai HTML/CSS/JS native.

## Pemeriksa desain dan review

Detector Impeccable sekali pada URL kategori aktual dan CSS target menghasilkan
30 warning serta 9 advisory. Warn mencakup cream palette yang dipin proyek,
kontras dan teks kecil komponen yang digunakan bersama. Tidak mengklaim seluruh
aksesibilitas atau semua aturan desain telah lulus.

Taste: **GATE: FAIL 43 (round 1 of 3)**. Temuan lengkap ada pada
`taste-gate.txt` dan `taste-gate.json`; termasuk navigasi/kontras/fokus shell,
penghitungan area gulir sidebar, dan asumsi hero/satu section per layar,
moment, CTA tunggal serta `.wrap` yang berbeda dari halaman daftar produk.
Gate belum lulus. Tidak membuat waiver atau mengubah checker. Tugas baru ini
memulai build kategori tersendiri; laporan error publik sebelumnya diarsipkan
pada `previous-public-errors-gate.json`, tidak diubah menjadi lulus.

Hallmark: **84 FAIL, 64 REFLEX, 16 WARN**, render dijalankan pada kategori plants.
Flag statis CSS khusus menyebut tidak ada fokus/active/balance; fokus nyata
diwarisi dari aturan `catalog-main :focus-visible` dan `catalog-sheet :focus-visible`.
Peringatan fallback font Hallmark tetap dicatat sebagai perbedaan terhadap
harness capture yang memeriksa Poppins; tidak dianggap bukti semua font gagal.
Laporan mentah tetap tersedia. Artefak renderer dipindahkan keluar direktori
publik ke `storage/reports/category-products/hallmark-artifacts/`.

Review visual independen: **disposition: ship** pada cakupan ekstensi kategori
dalam sistem existing, setelah membuka 19 capture final dan dua baseline Katalog.
Tidak ditemukan kegagalan material dalam cakupan. Lihat `finish-review.md` untuk
lima bagian penilaian dan batasnya. Putusan ini tidak menutup raw gate atau utang
kontras/teks kecil komponen lama, dan tidak menyatakan backend produksi siap.
Verdict terbatas untuk guard pencarian terakhir juga menyatakan resolved setelah
empat kelompok uji navigasi lulus; hash 19 capture tetap identik dengan yang direview.

## Batas integrasi

Kategori, produk, harga/stok dan tindakan belanja masih memakai repository
pratinjau existing. Layanan kategori/produk, persistence Admin, pagination server,
validasi stok/harga dan otorisasi produksi belum dihubungkan. Kategori tidak
ditemukan saat ini adalah state frontend pada HTML statis, bukan handler HTTP404
kategori produksi. Backend/SSR perlu menyediakan metadata dan status yang tepat
ketika integrasi dilakukan. Tidak mengarang endpoint baru.
