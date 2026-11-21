# Cakupan UI error publik

19 November 2026. Empat halaman pemulihan publik mengikuti PRODUCT.md,
DESIGN.md, shell storefront dan koreksi ilustrasi pengguna. Tidak mengganti
halaman kondisi staf, izin akses atau alur transaksi. Tidak commit, push atau deploy.

## Halaman dan route

| Kondisi | Route kanonis | Alias preview | Tindakan utama / pendukung |
| --- | --- | --- | --- |
| 404 | `/pages/public/error-404.html` | `/404.html` | Jelajahi Katalog / Kembali ke Beranda |
| 403 | `/pages/public/error-403.html` | `/403.html` | Kembali ke Beranda / Hubungi Kami |
| 500 | `/pages/public/error-500.html` | `/500.html` | Buka Beranda / Hubungi Kami; arahan periksa Pesanan Saya |
| 503 | `/pages/public/maintenance.html` | `/503.html`, `/maintenance.html` | Periksa Beranda / Hubungi Kami |

Judul, penjelasan dan kode kondisi merupakan HTML yang dapat dibaca tanpa
JavaScript. Hanya ilustrasi 404 yang tidak mempunyai angka; kode status tetap
tersedia sebagai teks antarmuka. Desktop memakai dua kolom di container terpusat,
ponsel menumpuk gambar dan isi dengan dua tombol selebar konten. Gambar memakai
`object-fit: contain` dalam bidang 4:3 sehingga tidak dipotong.

## Komponen dan perilaku

- Menggunakan kembali header/footer, Poppins lokal, tombol informasi, ikon,
  fokus, pencarian, panel Wishlist dan Keranjang serta navigasi proyek.
- Gaya khusus dibatasi ke `public-errors.css`; tidak mengubah stylesheet global.
- `public-errors.js` menangani notifikasi offline/online, gambar gagal dan
  konteks kembali yang aman. Tidak mempunyai API, formulir, penyimpanan atau
  tindakan finansial.
- Gambar gagal menampilkan logo botanical existing. Judul, isi dan kedua
  tindakan tetap tersedia. Tanpa JavaScript, gambar dan tautan native tetap bekerja.
- Offline menampilkan cara menyambungkan kembali. Koneksi kembali tidak memicu
  reload atau pengulangan transaksi; pengunjung memilih tindakan sendiri.
- Parameter `returnTo` hanya menerima path Katalog same-origin. Query yang
  dipertahankan: `q`, `category`, `min_price`, `max_price`, `discount`, `available`,
  `saved`, `sort`, `page`, `loaded`. Query lain, fragment dan tujuan eksternal,
  Checkout atau staf dibuang. 403 mengabaikan seluruh konteks kembali.
- Semua tombol pemulihan melakukan navigasi GET. 500 mengarahkan pengunjung
  memeriksa Pesanan Saya sebelum mengulang pesanan atau pembayaran. Tidak
  mengasumsikan login mengatasi 403 dan tidak membuat ETA maintenance.

## Aset dan sumber

| Aset di `public/assets/images/public-errors/` | Sumber pengguna | Penyesuaian |
| --- | --- | --- |
| `not-found.jpg` | `Gemini_Generated_Image.jpeg` | image_gen menghapus angka, lalu memusatkan pot/tanaman di dalam bentuk abstrak. JPEG quality 90; tidak di-crop atau di-resize saat encoding. |
| `maintenance.jpg` | `Gemini_Generated_Image (1).jpeg` | Komposisi dan payload gambar JPEG asli dipertahankan. |
| `server-error.jpg` | `Gemini_Generated_Image (2).jpeg` | Komposisi dan payload gambar JPEG asli dipertahankan. |
| `forbidden.jpg` | `Gemini_Generated_Image_5alv7q5alv7q5alv.jpg` | JPEG quality 90; dimensi dan komposisi tetap. |

Semua JPEG memiliki metadata provenance COM. Penambahan metadata mengubah byte
file tanpa mengubah piksel. Sidecar `.jpg.json` menyimpan sumber, hash sumber,
dimensi dan encoding. Dua prompt edit persis beserta mapping ada di
`docs/design/assets/public-error-illustrations.json`. Pemindaian provenance
menghasilkan **4 raster, 0 missing**. File Downloads asli tidak diubah.
Aset generasi awal asisten yang digantikan pilihan pengguna tidak dikirim.

## Integrasi server dan batas produksi

`tools/preview/serve-dashboard.cjs` menyajikan route kanonis dengan status HTTP
403/404/500/503 yang sesuai, termasuk HEAD tanpa body. Alias mengarah ke route
yang sama. Dokumen publik yang tidak ditemukan mempertahankan URL asal dan
status 404 sambil menampilkan UI 404; path aset absolut menjaga gambar/CSS/script
tetap dimuat pada URL dalam. Path terlarang memakai 403. Aset hilang, workbench
dan area staf tetap memakai fallback resource/plain yang terpisah.

Ini **binding server preview**, bukan middleware produksi. Front controller
PHP dan backend masih scaffold. Pemasangan handler produksi harus mempertahankan
status asli serta izin akses dan tidak bergantung pada JavaScript. Belum ada
health check, aktivasi maintenance global atau provider pembayaran/kurir baru.
Halaman error dapat dibuka untuk pratinjau tanpa menyatakan situs sedang gagal.

## State dan pemeriksaan

Workbench pengembangan: `/__preview/public-errors`. Pilihan empat kondisi,
lima lebar layar, offline, gambar gagal, teks panjang, return Katalog, tujuan
tidak aman dan tanpa script hanya berada pada iframe workbench. Kontrol tidak
disisipkan ke halaman produksi.

| Pemeriksaan yang dijalankan | Hasil |
| --- | --- |
| `node tests/e2e/browser/verify-public-errors.cjs` | 30 kelompok lulus: 4 halaman × 5 ukuran (1440/1024/768/390/320), status HTTP/HEAD, aset/FontFace, layout, navigasi, query aman/tidak aman, offline, fallback, keyboard/fokus, reduced motion, pencarian, no-JS dan alias/workbench. Tidak ada page error, resource lokal gagal tak terduga atau request tulis. |
| Pemeriksaan ulang capture teks panjang | Lulus pada 320 px; iframe diambil sepanjang dokumen agar kedua tindakan dan footer terlihat. Capture lama yang terpotong tidak dipakai dalam review. |
| `node tests/e2e/browser/verify-information-pages.cjs` | 7 kelompok regresi lulus; error dan resource lokal gagal kosong. |
| Audit statis 4 HTML | Tidak ada ID duplikat, fragment hilang atau aset/tujuan lokal hilang; JSON alias valid. |
| `node --check` JS target, server preview dan pengujian target | Lulus. |
| `git diff --check` | Lulus; peringatan konversi LF/CRLF pada pekerjaan lama bukan kesalahan whitespace. |

Laporan dan 18 capture tervalidasi ada di `storage/reports/public-errors/`.
Capture mencakup desktop/ponsel empat halaman, 404 pada tablet dan 320 px,
deep path, konteks Katalog, offline, fallback gambar, fokus, no-JS dan teks panjang.

## Hasil pemeriksa desain dan batas klaim

Detector Impeccable dijalankan sekali pada empat HTML dan CSS khusus. Ada
8 warning: HOT 9 px pada empat salinan shell dan deteksi Inter pada setiap
halaman. Pengujian FontFace aktual membuktikan Poppins 400/500/600/700 dimuat.
24 advisory menandai radius/warna shell. Laporan mentah tidak diubah atau diabaikan
melalui konfigurasi baru.

Taste menghasilkan **GATE: FAIL 34 (round 1 of 3)**. Temuan mencakup navigasi,
kontras, label/fokus pencarian dan footer existing, serta asumsi pemasaran
tentang satu section per layar, motion moment dan nama `.wrap`. Gate ini belum
lulus. Shell di luar cakupan dipertahankan sesuai instruksi pengguna; halaman
pemulihan tidak dijadikan landing page untuk memenuhi aturan pemasaran.

Hallmark mencatat **11 FAIL, 5 REFLEX, 2 WARN**. Tahap render menolak respons
HTTP 404 asli sebagai kegagalan pemuatan; hasilnya bukan bukti render lulus.
Verifikasi render target menggunakan suite browser dan capture yang disebut
di atas. Artefak Hallmark dipindahkan dari direktori publik ke
`storage/reports/public-errors/hallmark-artifacts/`.

Pemeriksaan fungsi/layout target yang lulus tidak menyatakan seluruh aksesibilitas
shell lama atau semua pemeriksa desain lulus. Review visual independen dicatat
terpisah di `storage/reports/public-errors/finish-review.md`.

Review independen menghasilkan **disposition: ship** untuk UI pemulihan publik
yang diperiksa. Seluruh 18 capture dinilai valid dan tidak ada perbaikan material
dalam cakupan. Putusan ini tidak menyatakan handler produksi, seluruh shell atau
gate mentah telah lulus. Tidak ada perubahan UI setelah capture dan review.
