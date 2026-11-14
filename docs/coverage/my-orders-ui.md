# Cakupan UI Pesanan Saya

13 November 2026. Implementasi frontend pratinjau pelanggan dengan data sintetis;
bukan backend transaksi atau autentikasi produksi.

## Halaman dan berkas

- Halaman: `public/pages/customer/my-orders.html`; alias `/my-orders.html`.
- CSS khusus: `public/assets/css/storefront/my-orders.css`.
- Presentasi/interaksi: `public/assets/js/storefront/my-orders.js`.
- Adapter contoh: `public/assets/js/storefront/my-orders-preview-data.js`.
- Snapshot bersama: `public/assets/js/storefront/orders-preview-repository.js`.
- Konteks navigasi: `public/assets/js/storefront/order-navigation.js`.
- Workbench: `tools/preview/my-orders-states.html`, disajikan hanya server
  pengembangan pada `/__preview/my-orders`, di luar document root.
- Spesifikasi: [my-orders-surface.md](../design/surfaces/my-orders-surface.md).
- Pengujian: `tests/e2e/browser/verify-my-orders.cjs`.

## Yang selesai

Kartu transaksi memakai identitas, tanggal WIB, produk/varian/satuan snapshot,
jumlah jenis produk lain, total historis serta status dana dan pengiriman yang
terpisah. Tindakan mengikuti status dan allowedActions. COD belum lunas dalam
pemenuhan tidak diberi tombol bayar online. Refund diproses tidak disebut berhasil.
Data inti rusak atau tidak terbaru membatasi tindakan dan menyediakan pemulihan.

Pencarian nomor/nama produk, delapan filter status, rentang tanggal pembelian
WIB inklusif, urutan terbaru/terlama dan Reset langsung memperbarui hasil.
Pencarian diberi debounce 300 ms dan batas 100 karakter. Semua ini keputusan
teknis pratinjau, bukan parameter bisnis baru. Cursor terikat akun/kueri/urutan;
halaman dibatasi sepuluh baris. Jumlah total hanya muncul bila adapter menyediakannya.
Respons lama dibatalkan dan tidak boleh menimpa pencarian terbaru.

Bayar, Lacak dan Detail memakai orderId yang sama. Detail dimulai dari ringkasan;
Lacak membuka dialog setelah snapshot lolos pemeriksaan. Data contoh berubah di
halaman tujuan dan dibaca ulang saat kembali. Daftar memulihkan kueri, cursor,
fokus kartu dan posisi gulir; jika pesanan keluar dari filter, filter tetap sama
dan fokus kembali ke ringkasan hasil. Tidak ada transaksi yang dimutasi dari daftar.

Navbar/footer, SVG dan font menggunakan shell Figma yang sudah ada. Tautan
utility Lacak Pesanan kini membuka daftar. Dialog, tombol, badge, format rupiah,
fallback gambar dan pola error menggunakan fondasi storefront. Tidak ada tema,
font atau layout global baru. `PRODUCT.md`, `DESIGN.md` dan sidecar desain global
dipertahankan; perluasan target dicatat pada surface brief.

## State dan cara memeriksa

Workbench menyediakan 29 skenario. Hover, fokus, filter terpilih, disclosure
tanggal, disabled, dialog, pagination dan pengumuman hasil memakai kontrol nyata.

| Kelompok | Skenario workbench | Pemulihan |
| --- | --- | --- |
| Normal dan kosong | normal, empty | Buka detail atau panduan pesanan; tidak membuat tautan katalog palsu. |
| Loading dan respons lama | loading, slow, race | Indikator, retry proses lama, AbortController dan penjagaan urutan respons. |
| Kegagalan baca | loadError, refreshError, offline, service, maintenance, rateLimit | Coba lagi/panduan; hasil lama diberi label; cooldown sementara untuk 429. |
| Akses | login, session, denied, verification, unavailable | Bersihkan kartu/count/konteks privat saat akses hilang; panduan karena autentikasi belum tersedia. |
| Data | partial, partialPage, invalid, unknown, imageError, long, archived, duplicate | Pertahankan baris valid, batasi aksi, fallback aset, read-only dan deduplikasi. |
| Konsistensi | stale, changed, expired, cursorExpired, noCount | Perbarui data, pertahankan filter, kembali halaman awal, periksa pembayaran tanpa membatalkan order dari timer. |

Tanpa hasil pencarian/filter diperiksa melalui kontrol biasa, bukan skenario
bisnis baru. Kegagalan pembacaan tidak menghapus input yang masih diperlukan.
Login/verifikasi hanya memberi panduan; tidak berpura-pura masuk ke akun.

## Pemisahan data dan kebutuhan integrasi

Adapter `window.RylvaMyOrdersAdapter` opsional menyediakan
`getPage(query, { signal })`. Fixture menyediakan records, kueri yang dipakai,
metadata pagination, count opsional, serverNow/snapshotAt serta tanda stale.
Ini sambungan frontend; bukan endpoint API yang telah diimplementasikan.

Repository bersama menyimpan 27 pesanan sintetis milik akun contoh dan satu
pesanan akun lain untuk pengecekan penolakan. Snapshot disimpan di sessionStorage
per tab, dengan fallback memori bila penyimpanan tidak tersedia. Nomor baru
mengikuti format baseline; skenario legacy Detail/Pembayaran tetap dipertahankan.
Reload tidak membuat tenggat baru. Data contoh mencakup status dan nominal
historis, bukan bukti stok, foto inventaris atau transaksi nyata.

Backend masih wajib menyediakan autentikasi pelanggan terverifikasi, ownership
sebelum filter/count, minimisasi DTO daftar, query/cursor stabil, validasi status
dan deadline, allowedActions, penanganan sesi lintas tab serta audit mutasi pada
halaman tujuan. UI daftar tidak memerlukan alamat penuh, telepon, rekening,
catatan staf atau lampiran komplain. CSRF/idempotensi/mutasi/gateway/kurir tetap
pekerjaan layanan tujuan. Template `orders_list.php` dan router PHP masih scaffold.

SessionStorage dan penolakan ID fixture hanya menguji alur tampilan. Jangan
menganggapnya kontrol akses produksi atau sinkronisasi lintas akun/tab yang nyata.
Tidak ada endpoint, login, notifikasi, chat, ulasan atau beli ulang yang dikarang.

## Pemeriksaan aktual

Server sesi pengerjaan menggunakan `RYLVA_PREVIEW_PORT=4179` dan perintah
`node tools/preview/serve-dashboard.cjs`. Skrip daftar menerima
`RYLVA_MY_ORDERS_URL`, skrip Detail menerima `RYLVA_ORDER_PREVIEW_URL`.
Skrip Pembayaran menerima `RYLVA_PAYMENT_PREVIEW_URL` (default 4178), sedangkan
workbench regresi Pembayaran dan skrip shell masih memakai 4178. Server lama
4178 tersedia saat regresi; kedua server membaca berkas proyek yang sama.

Perintah pengujian dari root proyek:

```powershell
node tools/maintenance/check-project-structure.cjs
node tests/e2e/browser/verify-my-orders.cjs
node tests/e2e/browser/verify-order-detail.cjs
node tests/e2e/browser/verify-payment.cjs
node tests/e2e/browser/verify-storefront-shell.cjs
git diff --check
```

Chrome headless memakai runtime Puppeteer lokal. Di lingkungan pengerjaan,
peluncuran Chrome memerlukan eksekusi di luar sandbox setelah percobaan di dalam
sandbox tidak tersambung. Profil browser pengguna tidak digunakan.

- Daftar: **29 skenario, 22 kelompok pemeriksaan, 22 tangkapan layar,
  0 kesalahan JavaScript**. Bukti: `storage/reports/my-orders/verification.json`.
- Alur silang: daftar → detail → kembali; daftar → bayar → detail → bayar →
  daftar; Lacak → penerimaan → daftar terfilter. Identitas, tenggat, kueri,
  cursor, fokus dan gulir diperiksa, termasuk penolakan order akun lain.
- Race, offline, cooldown, loading lama, invalid date, pencarian berspasi,
  cursor usang, 10/10/7 hasil dan aset/nominal panjang diperiksa.
- Layout 1440, 1024, 768, 390 dan 320 px diperiksa. Seluruh 22 capture dibuka;
  tangkapan viewport tersedia selain fullpage agar teks dapat ditinjau terbaca.
- Regresi Detail: **50 skenario / 34 pemeriksaan / 29 capture / 0 JS error**.
- Regresi Pembayaran: **50 skenario / 73 pemeriksaan / 16 capture / 0 JS error**.
- Shell: **11 kelompok pemeriksaan / 11 aset asli / 0 JS error**.
- Struktur dan sintaks: **23 halaman / 28 CSS / 57 JavaScript / 517 referensi /
  0 referensi hilang**. `git diff --check` lulus; Git hanya memberi pemberitahuan
  konversi LF ke CRLF untuk sebagian berkas kerja.
- Empat raster produk lama diperiksa provenance: **4 raster / 0 metadata hilang**.
  Tidak ada raster baru.

## Batas pemeriksaan visual

Hallmark statis mencatat **9 FAIL, 11 REFLEX, 4 WARN** pada shell/incumbent yang
dipertahankan. Sweep render aktual mencatat **27 FAIL, 15 REFLEX, 6 WARN**,
termasuk pencatatan URL dan berkas untuk temuan yang sama. Temuan mencakup
kontras utility/akun/HOT/footer, batas input pencarian global, pembungkusan
tautan footer pada 320 px, jarak presisi sumber, proporsi aksen dan bobot font.
CSS khusus Pesanan Saya tidak mempunyai temuan statis pada sweep ini.

Detector Impeccable sekali pada target akhir mencatat **2 warning dan 6 advisory**:
HOT 9 px, Inter pada judul footer, serta warna/radius Figma di luar token global.
Semua termasuk sumber navbar/footer yang dipin pengguna. Tidak ada klaim detector
gabungan PASS atau seluruh halaman memenuhi AA. Laporan mentah berada di
`storage/reports/my-orders/hallmark-static.json`, `hallmark-render.json` dan
`impeccable-detect.json`.

Taste dipakai untuk keterbacaan, tepi, penggunaan aset yang ada dan inspeksi
render. Aturan hero pemasaran, foto baru serta section setinggi layar tidak
diterapkan pada daftar transaksi. Tidak ada klaim gate Taste baru lulus.

Review akhir dicatat di
[my-orders-review-2026-11-13.md](../design/reviews/my-orders-review-2026-11-13.md).
Hasil review menilai frontend pratinjau pada bukti yang diperiksa, bukan kesiapan
transaksi atau keamanan backend produksi.

Review awal memberi disposition **fix** untuk satu masalah: ikon refresh ponsel
ikut tersembunyi oleh CSS Pembayaran. Override dibatasi pada target; uji area
44 × 44 px, ikon terlihat, nama aksesibel serta klik refresh ditambahkan pada
pemeriksaan responsif. Suite dan capture diulang. Peninjau yang sama menilai
temuan tersebut **resolved**, disposition **ship** khusus perbaikan itu.
