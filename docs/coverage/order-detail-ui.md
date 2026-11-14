# Cakupan UI Detail Pesanan

13 November 2026. Frontend pratinjau pelanggan, bukan integrasi transaksi produksi.

## Halaman dan berkas

- `public/pages/customer/order-detail.html`, alias `order-detail.html`.
- `public/assets/css/storefront/order-detail.css` untuk perluasan khusus target.
- `public/assets/js/storefront/order-detail.js`: render, validasi, fokus, draft dan pemulihan.
- `public/assets/js/storefront/order-detail-preview-data.js`: read model contoh dan mutasi lokal.
- `docs/design/surfaces/order-detail-surface.md`: spesifikasi 12 bagian, matriks state dan direction contract.
- `tools/preview/order-detail-states.html`: workbench pengembangan di luar document root; disajikan Node pada `/__preview/order-detail`.
- `tests/e2e/browser/verify-order-detail.cjs`: pengujian browser dan tangkapan layar aktual.

## Yang tersedia

Ringkasan nomor/tanggal/status; snapshot produk/varian/harga/satuan/konfigurasi;
alamat dan jadwal kirim; kurir/resi; riwayat dengan disclosure; ringkasan biaya,
metode, dana terverifikasi dan dokumen contoh. Status pesanan, pembayaran,
pengiriman, pembatalan, komplain dan refund dibedakan.

Form alasan pembatalan, permintaan pembatalan, penerimaan dengan penjelasan
hak komplain berakhir, komplain berkategori dengan validasi foto, dan banding
satu kali tersedia sesuai read model. Komplain Tidak diterima tidak wajib foto.
Foto diperiksa tipe, keterbacaan, jumlah, ukuran dan dimensi; berkas asli hanya
berada dalam memori formulir. Adapter contoh menyimpan nama/ukuran/tipe sebagai
metadata ilustrasi, bukan mengunggah gambar. Draft dipertahankan saat gagal;
Escape/batal meminta keputusan bila ada perubahan. Double-submit dicegah.

Timeout/konflik/duplikat/CSRF meminta penyegaran sebelum submit berikutnya;
offline mempertahankan snapshot; sesi berakhir membersihkan detail dari DOM.
Loading lama menyediakan muat ulang. Gambar rusak mempunyai fallback. Refund
berhasil, diproses dan gagal tidak disamakan dengan pembatalan pesanan.

Navbar/footer menggunakan markup, CSS, SVG dan font yang sama dengan Pembayaran,
berdasarkan Figma. Tidak ada perubahan tema, token global atau halaman staf.
JavaScript shell hanya menyesuaikan nama halaman dalam pemberitahuan tujuan
yang belum tersedia. Tautan Detail Pesanan dari Pembayaran sekarang membuka
halaman lengkap dan mempertahankan snapshot contoh yang sama. Tindakan contoh
yang relevan diteruskan ketika kembali ke Pembayaran; pergantian metode dan
tenggat tidak dibuat ulang oleh navigasi detail.

## Penyesuaian referensi Tokopedia

Atas permintaan berikutnya “buat kaya UI tokped agar user tidak binggung”,
komposisi diperbarui mengikuti tiga screenshot pengguna. Detail menjadi satu
panel bersekat: status/nomor/tanggal, produk, pengiriman, pembayaran dan kasus
di kiri; tindakan utama/sekunder di kanan. Area kanan sticky pada desktop.
Tombol Selesaikan Pesanan memakai tindakan konfirmasi penerimaan yang sama,
termasuk penjelasan bahwa hak komplain berakhir. Lacak dan Lihat Detail
membuka dialog kurir/resi/riwayat, tanpa mengarang integrasi kurir.

Pada lebar sampai 860 px, urutan menjadi ringkasan → tindakan → rincian,
sesuai DOM dan urutan fokus keyboard. Komplain yang sudah ada dapat dibuka
dengan Lihat Komplain yang menggulir serta memfokuskan bagian penyelesaian.
Bukti pelunasan dan akses Pembayaran berada dalam Rincian Pembayaran;
kolom tindakan tidak diisi semua tautan pendukung. Tidak ada duplikasi tombol
banding pada panel kasus.

Referensi modal diadaptasi ke route halaman yang sudah tersedia. Tidak dibuat
daftar transaksi/backdrop palsu; navbar/footer Figma dan tautan langsung tetap
berfungsi. Logo, maskot, chat penjual, biaya/voucher serta data pribadi dari
Tokopedia tidak disalin. Tidak ada data atau aturan transaksi baru.

## Adapter dan batas integrasi

`window.RylvaOrderDetailAdapter` dapat menggantikan adapter contoh dengan:

- `getSnapshot()` → read model detail yang telah dinormalisasi, termasuk `serverNow`,
  `version`, semua dimensi status, `allowedActions`, snapshot dan kasus publik.
- `perform(action, payload, expectedVersion, requestKey)` → snapshot terbaru.
  Action semantik: `cancel`, `requestCancel`, `confirmReceipt`, `complain`, `appeal`.
  Payload foto berisi objek File; integrator mengirimnya melalui mekanisme upload
  backend yang sah. Preview hanya mempertahankan metadata contoh.
- `getReceipt()` → data dokumen yang diizinkan; renderer dokumen produksi perlu
  diselaraskan sebelum penggunaan nyata.
- `paymentUrl()` opsional → URL internal pembayaran pesanan yang sama.

Ini antarmuka adapter frontend, bukan endpoint baru. Kontrak API baseline A.7
belum aktif: auth/ownership/CSRF/idempotensi/audit/gateway/kurir/unggahan dan
penyimpanan server belum terhubung. Mock tidak boleh dibawa ke jalur produksi
sebagai bukti otorisasi atau keberhasilan finansial. Tampilan menyatakan data
contoh secara jelas; kode tidak mengirim uang/pesan atau mengubah stok.

Pesanan Saya kini tersedia sebagai pratinjau dengan repository contoh bersama.
Tautan berdasarkan orderId mempertahankan pesanan yang sama; kembali memulihkan
filter, cursor, fokus dan gulir. Tujuan internal divalidasi tanpa menerima
return URL eksternal. Lacak dari daftar membuka dialog sesudah snapshot valid.
Login pelanggan/kontak produksi belum terhubung dan tetap memberi panduan.
Lihat [cakupan Pesanan Saya](my-orders-ui.md).
Persetujuan penawaran PH hanya informasi/panduan karena kontrak pelanggan
belum ditemukan. Data rekening refund tidak diminta lewat form contoh ini.

Konflik P-42 (maksimal 5 berkas × 5 MB vs `post_max_size` 8 MB), COD pada matriks
status, tenggat per metode, dan copy utility Figma “7 hari” terhadap jendela
komplain 24 jam dicatat dalam spesifikasi; UI tidak menetapkan kebijakan baru.

## Cara memeriksa

Jalankan `node tools/preview/serve-dashboard.cjs`; port default 4178.
Untuk port lain gunakan variabel `RYLVA_PREVIEW_PORT`. Pemeriksaan sesi ini
memakai port 4179 karena 4178 sudah digunakan server pratinjau sebelumnya.

Jalankan `node tests/e2e/browser/verify-order-detail.cjs`; URL default pengujian
4179, dapat diganti melalui `RYLVA_ORDER_PREVIEW_URL`. Regresi Pembayaran menerima
`RYLVA_PAYMENT_PREVIEW_URL`. Browser memakai runtime Puppeteer/Chrome yang sama
dengan pengujian proyek lainnya.

Skenario ada di workbench: status utama, COD, kasus PH-01–07, pembatalan,
komplain/banding, refund, metadata kosong, aset gagal, nama panjang, akses,
loading, offline dan kegagalan layanan. Parameter simulasi hanya pada preview
HTML, bukan pemeriksaan izin produksi. Reset workbench menghapus fixture skenario.

## Hasil pemeriksaan

Putaran penyesuaian Tokopedia lulus: **50 skenario, 34 kelompok pemeriksaan,
29 tangkapan layar, tanpa kesalahan JavaScript**. Bukti tambahan:
`delivered-viewport.png` untuk susunan yang mengikuti referensi,
`payment-sticky.png` untuk posisi tombol saat membaca pembayaran, dan
`tracking-dialog.png` untuk pelacakan. Pemeriksaan menguji geometri kolom,
sticky tanpa menutup konten, urutan visual/DOM pada ponsel, pemulihan fokus
Lacak, Lihat Komplain, dan fallback sebelum resi tersedia. Regresi Pembayaran
dijalankan ulang dan tetap lulus 50 skenario/73 pemeriksaan/16 capture.

Review visual fresh terhadap ketiga referensi dan ke-29 capture memberi
disposition **ship** untuk penyesuaian UI ini, tanpa temuan material pada
cakupan yang diperiksa. Adaptasi modal referensi menjadi route halaman
dinyatakan secara eksplisit. Lihat
`docs/design/reviews/order-detail-tokopedia-review-2026-11-13.md`.

Pada putaran sebelum penyesuaian referensi, pengujian browser lulus:
**50 skenario, 31 kelompok pemeriksaan, 26 tangkapan layar, 0 kesalahan JavaScript**.
Bukti tersimpan di `storage/reports/order-detail/verification.json` dan PNG
pada direktori yang sama. Uji mencakup alur tindakan, validasi foto rusak/terlalu
besar, draft, keyboard/fokus, rekonsiliasi, snapshot bersama, dan layout
1440/768/390/320 px. Nominal panjang diperiksa tetap satu baris; pesan dan
aria-invalid diperiksa bersih setelah koreksi input. Regresi Pembayaran:
50 skenario/73 pemeriksaan/16 capture lulus. Shell: 11 kelompok/11 aset lulus.
Pengujian struktur: 22 halaman, 27 CSS, 53 JavaScript, 491 referensi,
tanpa referensi hilang; `git diff --check` lulus.

Peninjau akhir independen meminta empat perbaikan: status PH-03, digit nominal
panjang, konsistensi snapshot buket dan error validasi yang tertinggal.
Semuanya diperbaiki dan dinilai ulang **resolved**, disposition **ship**
pada cakupan empat temuan itu. Semua 26 recapture valid. Lihat
`docs/design/reviews/order-detail-review-2026-11-13.md`; ini bukan sertifikasi
seluruh sistem atau kesiapan backend produksi. `DESIGN.md` dipertahankan.

Hallmark statis mode app juga dijalankan untuk penyesuaian Tokopedia, dengan
laporan `storage/reports/order-detail/hallmark-tokopedia.json`. CSS khusus Detail Pesanan
tidak memiliki temuan pada sweep tersebut; hasil gabungan mencatat
**9 FAIL, 11 REFLEX, 4 WARN** pada shell
Figma asli yang dipertahankan atas instruksi pengguna: ukuran/jarak presisi,
warna referensi, serta copyright. Hasil gabungan tidak disebut PASS. Kontras
utility/promo/footer mengikuti sumber dan tetap menjadi keterbatasan aksesibilitas
referensi. Tidak ada klaim seluruh halaman memenuhi AA.

Taste digunakan untuk keterbacaan, kesetaraan tepi, aset nyata proyek dan pemeriksaan
render; aturan hero/section setinggi layar, creative moment dan foto pemasaran
tidak diterapkan pada transaksi. Tidak ada klaim gate Taste baru lulus.
Empat raster produk lama diperiksa provenance: 4 raster, 0 metadata asal hilang.
Tidak ada raster baru atau foto produk terverifikasi baru yang dibuat.
