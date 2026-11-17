# Cakupan UI Wishlist

Tanggal: 17 November 2026. Status: **frontend pratinjau selesai; penyimpanan akun produksi belum terhubung**.

## Route dan acuan

- Halaman: `/pages/customer/wishlist.html`; alias `/wishlist.html`.
- Pratinjau berisi contoh: `/pages/customer/wishlist.html?preview=wishlist&state=ready`.
- Workbench lokal: `/__preview/wishlist`. Kontrol pengujian berada di luar alur pengguna.
- [Spesifikasi halaman](../design/surfaces/wishlist-surface.md) dan keputusan pengguna: guest sementara, akun permanen.
- Referensi Figma: Katalog `267:297` pada file `LcUKB3k9C38G0g6KWo5zIU`, kartu Homepage, dan DESIGN.md. Tidak ditemukan frame khusus Wishlist; implementasi ini mengikuti sistem storefront yang ada, bukan mengklaim kecocokan terhadap frame Wishlist yang belum tersedia.

## Hasil implementasi

- Shell, header, footer, foto, Poppins, dan kartu horizontal yang ada digunakan kembali.
- Ikon hati memakai warna selected kartu Homepage, termasuk fill rose yang sama.
- Hierarki ringkas: breadcrumb, judul 28–36 px, keterangan penyimpanan, toolbar, jumlah hasil, kartu dan pemuatan berikutnya.
- Grid mengikuti ruang nyata: tiga kolom desktop lebar, dua menengah, satu pada ruang sempit. Toolbar tablet memakai dua baris agar nilai select terbaca.
- Pencarian nama, kategori dari data, ketersediaan, pengurutan, filter aktif yang dapat dilepas, dan Reset bekerja langsung.
- Enam item awal, infinite scroll, tombol pemuatan manual, retry batch, dan akhir daftar.
- Simpan/hapus lintas Beranda, Katalog, Detail dan Wishlist; guest bertahan saat navigasi/reload dalam tab yang sama.
- Hapus mempunyai tindakan Simpan kembali yang terikat pemilik; fokus berpindah ke produk berikutnya/terdekat.
- Detail dibuka dari atas. Kembali memulihkan pencarian/filter/urutan/jumlah dimuat/gulir dan fokus; item yang hilang mempunyai fallback ke kartu terdekat atau pencarian.
- Produk standar menambah satu unit melalui adapter Keranjang yang sudah ada. Monstera/Calathea pada fixture memerlukan pilihan varian melalui Detail. Item tetap berada di Wishlist setelah ditambah.
- Sheet filter/sort mobile memakai native dialog dan motion Katalog: hasil langsung, X, Escape, backdrop, drag turun, fokus tertahan/dikembalikan, serta reduced motion.

## Komponen dan area kode

| Area | Berkas/peran |
| --- | --- |
| Halaman dan style | `public/pages/customer/wishlist.html`, `public/assets/css/storefront/wishlist.css` |
| Controller | `public/assets/js/storefront/wishlist.js` |
| Keanggotaan bersama | `public/assets/js/storefront/wishlist-store.js` |
| Fixture dan simulasi akun | `public/assets/js/storefront/wishlist-preview-repository.js` |
| Komponen lama | `RylvaProductCard`, `RylvaHomepageHeader`, `RylvaProductNavigation`, `RylvaCatalogSheetMotion`, shell dan adapter Keranjang |
| Integrasi | Beranda/Katalog/Detail, tujuan header, allowlist returnTo, kelanjutan login pratinjau, logout, dan header Buket Kustom |
| Alat pengembangan | `tools/preview/wishlist-states.html`, pendaftaran route preview dan alias |

Kartu bersama kini memakai satuan dari data. Opsi aksi varian dipakai Wishlist; konsumen lama mempertahankan aksi yang sudah ada. Perubahan visual halaman lain tidak diperluas.

## Follow-up kartu, panel header, dan tautan

Perbaikan berdasarkan screenshot pengguna pada 17 November 2026:

- Kartu Wishlist desktop memakai style kartu Homepage secara langsung. Nama dan badge ketersediaan kembali sejajar; override yang menumpuk badge di bawah nama dihapus. Layout kartu mobile yang sudah ada dipertahankan.
- Ikon Wishlist pada header menampilkan panel yang sama polanya dengan Keranjang: hover pada pointer desktop, klik pada mobile, ArrowDown untuk masuk, serta Escape/X/backdrop untuk menutup dan mengembalikan fokus.
- Panel memperlihatkan lima produk terakhir disimpan beserta jumlah seluruh daftar, nama, foto, harga/satuan, tindakan hapus, dan tautan **Lihat Semua Wishlist**. Keanggotaan mengikuti store bersama; loading, kosong, kegagalan, retry dan pemeriksaan hasil tidak pasti disediakan. Respons pemilik lama tidak menulis feedback pada pemilik baru.
- Panel tersedia di Beranda, Katalog, Detail Produk, Wishlist dan Buket Kustom. Baris mobile memakai tiga kolom agar gambar, teks dan tombol hapus tetap sejajar pada 320/390 px; isi panjang dapat digulir tanpa menyembunyikan tautan daftar lengkap.
- **Lihat Semua Koleksi**, kategori dan pencarian header Beranda membuka Katalog dengan parameter yang didukung. Kategori indoor/outdoor dipetakan ke kategori tanaman yang tersedia pada Katalog.
- Detail produk dari kartu dan panel header membuka halaman Detail Produk yang sudah ada, mulai dari atas. Kembali ke Beranda memulihkan gulir dan fokus kartu. Navigasi keluar dari racikan buket tetap melalui perlindungan perubahan belum disimpan.
- Foto Sirih Gading pada sumber kartu Beranda menggunakan aset Sirih Gading yang sama dengan Katalog/Detail; tidak lagi memakai foto Calathea.
- Navbar seluruh 14 halaman storefront kini menampilkan badge jumlah dari store Wishlist yang sama. Badge mengikuti save/remove, disembunyikan saat kosong/loading/error, dan memakai nama aksesibel dengan jumlah lengkap. Halaman transaksi memuat adapter/store yang sama; logika penyimpanan tidak diduplikasi. Pintasan Wishlist pada halaman yang mempunyai draf tetap melewati guard navigasi halaman.

Bukti follow-up: `storage/reports/wishlist-links/verification.json`, capture panel desktop/mobile dan kartu pada 1920/1440/1024 px. `verify-wishlist-links.cjs` lulus tujuh kelompok; regresi Katalog 19, Detail Produk 13, Buket Kustom 17 dan refinements Homepage delapan kelompok lulus tanpa pageerror. Tes touch setelah Back kini menunggu pemulihan Wishlist selesai sebelum menekan hati. Review independen menyatakan **ship** untuk frontend preview setelah baris hapus mobile diperbaiki; hasil ini tidak menutup temuan global shell yang dicatat di bawah.

## Penyimpanan dan integrasi

Guest memakai sessionStorage per tab, key `rylva-wishlist-guest-v1`. Payload hanya versi, productId string, dan waktu simpan lokal; harga/stok selalu berasal dari data produk. Storage rusak/diblokir mempunyai pesan dan fallback memori yang jujur.

Kontrak akun disediakan melalui `RylvaWishlistAdapter`: pemeriksaan sesi, baca daftar, desired-state save/remove, merge dan rekonsiliasi operasi. Identitas BIGINT tetap string. Revisi dan generation guard mencegah respons lama menimpa akun atau snapshot lebih baru.

**Adapter yang berjalan saat ini adalah simulasi akun lokal, bukan autentikasi atau persistence server.** Pada localhost, kelanjutan login pratinjau memilih akun contoh dan data simulasi disimpan terpisah di localStorage. UI menampilkan keterangan akun pratinjau. Di luar localhost, marker ini tidak menjadi akses akun. Tidak ada endpoint yang dikarang, kredensial disimpan, atau mutasi produksi yang diklaim berhasil.

Merge membekukan sumber, menggabungkan tanpa duplikasi, dan membersihkan hanya item guest yang telah dikonfirmasi serta belum diganti oleh pilihan lebih baru. Partial/error mempertahankan sisa; timeout diperiksa sebelum pengiriman ulang. Hanya produk dalam snapshot merge yang dikunci. Data/pesan/undo akun lama tidak digunakan untuk pemilik berikutnya.

Yang masih memerlukan backend: autentikasi/otorisasi pemilik yang sebenarnya, API dan persistence akun, idempotency/reconciliation yang bertahan di server, validasi visibilitas produk/SKU/stock, serta perbaikan keunikan atomik produk dengan varian NULL sebagaimana dijelaskan pada spesifikasi. Controller/template PHP dan skema tidak diaktifkan melalui pekerjaan UI ini.

## State dan pemulihan

| Kelompok | Implementasi/pemeriksaan |
| --- | --- |
| Dasar | Unsaved/saved, pending/unknown, focus/hover/disabled; sinkron semua instance produk |
| Pemuatan | Skeleton awal, pembaruan, memuat berikutnya, append gagal/retry, akhir daftar |
| Kosong | Daftar kosong, pencarian tanpa hasil, kombinasi filter tanpa hasil; kembali Katalog/Reset |
| Data | Partial hydration, referensi tidak ditemukan, nonaktif, stok habis, harga tidak valid, gambar gagal, konten panjang dan data usang |
| Mutasi | Berhasil, gagal definitif, rate limit berdasarkan retryAt, hasil tidak pasti dan Periksa hasil |
| Merge | Berlangsung, sukses, parsial, gagal, timeout; sumber dipertahankan dan retry selektif |
| Akses | Perlu masuk kembali, denied, verifikasi bersyarat, pergantian pemilik/logout |
| Koneksi/storage | Offline, timeout, maintenance, storage guest diblokir/rusak; retry tanpa membuang pilihan yang masih sah |
| Keranjang | Pending, sukses satu unit, gagal/konflik, serta guard hasil tidak pasti agar tidak menambah dua kali |
| Navigasi | Return context, nearest-card focus, native dialog close/focus, BFCache revalidasi |

Catatan pribadi, multi-koleksi, berbagi, notifikasi stok/harga dan penyimpanan racikan buket bukan bagian versi awal. State bisnis tambahan tidak dibuat untuk menampilkan fixture.

## Pemeriksaan yang dijalankan

| Pemeriksaan | Hasil |
| --- | --- |
| `node tests/unit/wishlist-store.cjs` | 6 kelompok lulus: identity/persistence, merge snapshot, uncertain mutation, isolasi owner, urutan revisi, payload tidak valid |
| `node tests/e2e/browser/verify-wishlist.cjs` | 15 kelompok lulus, tanpa pageerror; termasuk login dari Wishlist, merge selektif dan penyimpanan akun pratinjau saat reload |
| Layout browser | 1920, 1440, 1024, 820, 768, 390 dan 320 px; tidak ada overflow horizontal atau aksi terpotong pada skenario yang diuji |
| State browser | 18 state empty/error/access/data/storage beserta pemulihan yang relevan; skenario merge/mutasi diuji terpisah |
| Regresi Katalog | 19 kelompok lulus |
| Regresi Detail Produk | 13 kelompok lulus; ekspektasi favorit diperbarui dari dialog lokal ke route Wishlist |
| Regresi kartu Homepage | 4 kelompok lulus |
| Regresi navigasi autentikasi | 5 kelompok lulus pada `RYLVA_AUTH_URL=http://127.0.0.1:4185` |
| Regresi Buket Kustom | 17 kelompok lulus |
| Sintaks dan diff | Node syntax checks dan pemeriksaan whitespace pada berkas integrasi lulus |
| Copy lint design-taste | 0 FAIL, 0 WARN |
| Hallmark, stylesheet Wishlist | 0 FAIL, 0 WARN; gate 24b diwaive secara tercatat untuk spacing halus kartu dan alignment mobile |
| Hallmark render URL aktif | Berjalan dengan runtime lokal; 18 FAIL, 2 REFLEX, 1 WARN, 13 WAIVED. Temuan berasal dari kontrol/kontras shell bersama, ring fokus, footer, dan aturan jumlah bobot font; tidak diklaim lulus |
| Review independen | Putaran pertama meminta tiga perbaikan dan dua recapture; verdict pass menilai semua temuan itu resolved dan menyatakan ship untuk frontend preview |

Bukti lokal: `storage/reports/wishlist/verification.json`, screenshot `wishlist-<width>.png`, `wishlist-long-content-card-320.png`, dan packet `.impeccable/review/wishlist/`. Bukti ini tidak menyatakan layanan produksi, seluruh browser, atau seluruh backend telah lolos pengujian.

## Batas pemeriksaan desain otomatis

Impeccable detector dijalankan sekali pada target. Temuan yang tersisa merujuk HOT kecil dan palet/radius shell bersama; deteksi font Inter berasal dari analisis statis, sedangkan render mengikuti Poppins yang ditetapkan. Temuan ini tidak dipakai untuk merombak identitas atau shell di luar cakupan.

Hallmark render URL aktif mencatat 18 FAIL, termasuk ring fokus dan kontras header/footer, batas input native yang tidak diidentifikasi, serta label footer yang membungkus. Pemeriksaan ini tetap terbuka pada laporan `storage/reports/wishlist/hallmark-render-live.txt`. Style fokus baru dibatasi pada main dan sheet Wishlist agar tidak mengubah perlakuan shell bersama. Percobaan render sebelumnya sempat kehilangan koneksi server; server diaktifkan kembali dan pemeriksaan URL aktual berhasil dijalankan. Capture yang dipakai reviewer berasal dari pengujian browser proyek dengan gambar yang telah didekode, bukan percobaan render yang gagal terhubung.

Finish gate design-taste menghasilkan **GATE: FAIL 51 (round 1 of 3)**. Banyak kriteria mengasumsikan hero pemasaran setinggi layar, satu navigasi, `.wrap`, dan ritme section penuh; asumsi tersebut tidak sesuai halaman daftar personal dan shell storefront yang harus dipertahankan. Gate juga mencatat variasi tombol, skala heading panel, dan kontras pada shell bersama. Hasil ini tidak diklaim bersih atau diubah menjadi PASS; bukti `.taste-skill/gate.json` menyimpan temuan terbuka. Prioritas pengguna untuk mempertahankan pola proyek dan hasil browser/review spesifik Wishlist menjadi acuan penerimaan frontend ini.

Tidak ada commit, push, publikasi, deployment, migrasi atau perubahan data produksi.
