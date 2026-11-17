# Cakupan UI Detail Produk

Diperbarui 17 November 2026. Route: /pages/public/product-detail.html?product=monstera. Alias /product-detail.html dan /detail-produk.html. Detail dibuka dari kartu katalog; header/footer dan kartu bersama tetap dipakai. Homepage mempertahankan quick preview sebelumnya.

## Selesai

- Layout Figma 282:838 dengan skala judul, harga, section dan kontrol yang lebih proporsional; desktop dua kolom, mobile galeri lebih dahulu.
- Galeri tiga foto Monstera, thumbnail selected, zoom dialog native, Escape/fokus kembali, fallback gambar gagal dan retry.
- Nama, kategori, harga/coret/diskon terhitung, SKU bila tersedia, ringkasan, satuan, ukuran, stok dan catatan pot nursery.
- Jumlah dengan validasi integer1–stok/batas produk, subtotal, +/- dan pembatasan total produk di keranjang. Pilihan valid tersimpan pada URL.
- Tambah quantity secara atomik melalui adapter keranjang bersama. Signature add(productId, expectedRevision, quantity=1) mempertahankan pemanggil dua argumen.
- Beli Sekarang mengirim hanya pilihan jumlah ke handoff Checkout, tanpa mengubah barang yang telah ada di keranjang. sourceScenario product-direct mencegah pembaruan Checkout langsung menghapus cart normal. Mode guest diteruskan sehingga guard login Checkout tetap berlaku.
- Wishlist selama halaman terbuka dan ringkasan header yang jujur tentang cakupannya.
- Cek ongkir dengan kode pos lima angka untuk guest, tanpa membuat/mengubah alamat. Hasil langsung menampilkan layanan, tarif contoh dan estimasi yang sudah tersedia pada fixture Checkout; loading, validasi, error, retry, data sebagian dan hasil kedaluwarsa dilengkapi.
- Accordion perawatan native beserta sumber, harga tidak tersedia, stok habis, tidak aktif, not-found, data sebagian, teks panjang, offline/timeout/maintenance, kegagalan tindakan dan konflik keranjang.
- Kembali ke katalog memulihkan URL/filter/search/sort/loaded serta scroll/fokus, baik tombol Katalog maupun history browser.

## Batas integrasi

Semua produk/harga/stok adalah contoh. Tidak ada katalog, reservasi stok, wishlist akun, quote kurir atau pesanan produksi. Adapter dapat diganti melalui window.RylvaProductDetailAdapter: load(slug,{recover}) mengembalikan {product,cart,preview}; inspect(product,variantId,quantity), add(product,variantId,quantity), readCart(), remove(lineId), quote(postcode, context). Perubahan harga/stok produksi perlu divalidasi adapter sebelum mutasi. Context ongkir berisi productId, variantId dan quantity; respons { services, preview } berisi layanan dengan name, price (integer rupiah) dan eta opsional. preview:true wajib dipakai untuk fixture. quote tidak membuat atau mengubah alamat, cart, maupun handoff Checkout. Integrasi ongkir nyata dari kode pos masih perlu dihubungkan melalui adapter.

Perawatan khusus baru diisi untuk Monstera. Produk lain memakai gambar/ringkasan nyata dari fixture yang tersedia dan pesan panduan belum tersedia. Tidak mengarang metadata yang hilang. Pembayaran, autentikasi dan backend PHP tidak diganti.

## Pemeriksaan lokal

- node tests/e2e/browser/verify-product-detail.cjs: 13 kelompok pemeriksaan browser, termasuk 1920/1440/1024/768/390/320, keyboard, state, limit atomik, storage, handoff dan offline.
- node tests/e2e/browser/verify-catalog.cjs: regresi konteks dan navigasi detail.
- Workbench /__preview/product-detail (server tools/preview/serve-dashboard.cjs); parameter preview=product-detail&state=... aktif hanya pada localhost. Seluruh mutasi workbench diisolasi di memori, tidak menulis keranjang normal.
- Bukti render/hasil otomatis: storage/reports/product-detail (lokal, gitignored).

## Asal aset dan informasi perawatan

Seluruh aset di public/assets/images/product-detail disalin tanpa generasi gambar dari Figma pengguna, file LcUKB3k9C38G0g6KWo5zIU node282:838:

| Berkas | Asset ID Figma |
| --- | --- |
| monstera-main.png | bd0acdc6-4938-4324-9f65-8822e80834dd |
| monstera-room.png | 044d42f4-cfa1-403b-ab5d-746eb27b8a9e |
| monstera-close.png | e7113f0a-68d0-46c7-a183-3e5ba5ab8fb7 |
| water.svg | 31a6fc0b-832a-476e-8814-de2dd41d12b5 |
| sun.svg | e0ec12cf-2811-43bd-b89d-26db52f86bed |
| pets.svg | 268392e2-c9dd-45d5-b827-192b2ae221b8 |
| beginner.svg | 5c70ac36-474b-4f97-b292-ef78416e6f6a |
| chevron.svg | 9d619601-c8a0-49d6-a1d0-33547de11023 |

[UW–Madison Extension](https://hort.extension.wisc.edu/articles/monstera-deliciosa/) untuk penyiraman/cahaya/perawatan; [ASPCA](https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/cutleaf-philodendron) untuk toksisitas bagi kucing/anjing. Teks merupakan parafrasa singkat, bukan petunjuk medis.

## Hasil akhir

Kelima suite browser lulus: Detail Produk13, Katalog19, Homepage6, Keranjang19, Checkout17 kelompok; nol runtime error pada masing-masing suite. Detail diuji ulang setelah koreksi fokus, urutan DOM, kontrol320px, intent Checkout lama dan token/border input. Reviewer independen menilai tiga perbaikan resolved, disposition ship pada daftar tersebut. Audit stylesheet khusus target0 FAIL statis; audit render menyeluruh belum bersih karena aturan generik dan temuan shell yang dijelaskan dalam [catatan audit](../design/reviews/product-detail-review-2026-11-17.md). Tidak ada perintah build frontend karena proyek menggunakan HTML/CSS/JS native tanpa pipeline build. Pemeriksaan node --check dan git diff --check lulus.

## Revisi rounded dan mobile —17 November 2026

- Radius kapsul pada CTA, kode pos dan kuantitas; selector20px, galeri28px, perawatan36px sesuai proporsi Figma.
- Badge diskon merah, harga lama text-secondary dan coretan merah. Nilai diskon tetap bersumber perhitungan harga, bukan gambar.
- Hover zoom mouse desktop1.9x mengikuti kursor; hint disembunyikan pada desktop mouse dan tersedia ketika fokus keyboard. Mobile/coarse pointer tetap memakai tombol Perbesar dan dialog.
- Cek Ongkir dan stepper sejajar tepat pada768/1024/1280/1440/1920px. Lebar144px atau132px pada tablet, tinggi48px.
- Mobile galeri lebar, thumbnail horizontal, bar subtotal/aksi tetap dengan padding aman dinamis dan tombol tutup pemberitahuan. Tombol yang sama serta seluruh adapter/data/handoff lama dipertahankan.
-13 kelompok regresi Detail Produk dan7 kelompok khusus revisi lulus, nol runtime error. Script baru: tests/e2e/browser/verify-product-detail-redesign.cjs. Ukuran layar sentuh390/320 diuji, termasuk dialog, jumlah, feedback, footer, stok habis, teks panjang, gambar gagal dan reduced-motion.
- Audit dan screenshot sebelum/sesudah: storage/reports/product-detail-redesign. Tinjauan Hallmark oleh reviewer independen: ship pada revisi target; tidak menjalankan ulang tes browser sendiri. [Catatan revisi](../design/reviews/product-detail-redesign-review-2026-11-17.md).

## Cek ongkir guest dan koreksi Checkout — 17 November 2026

Pengguna menegaskan cek ongkir di Detail Produk cukup kode pos tujuan dan tidak menambah alamat utama. Form sekarang langsung menampilkan daftar tarif, bisa digunakan tanpa masuk. Tarif contoh yang sudah ada di Checkout (reguler Rp15.000, same-day Rp20.000, instant Rp25.000) dipindahkan tanpa perubahan nilai ke storefront-shipping-preview-data.js dan dibaca kedua halaman. Label Tarif contoh tetap terlihat; biaya final dikonfirmasi ulang saat Checkout dengan konteks alamat lengkap.

Hasil lama dibuang saat kode pos, ukuran atau jumlah berubah; kode pos tetap dipertahankan ketika jumlah/ukuran berubah. Respons terlambat tidak menimpa hasil permintaan terbaru. Data harga yang tidak valid tidak ditampilkan sebagai nol. Workbench menambahkan shippingRates (langsung menampilkan contoh40526), shippingLoading, shippingTimeout, shippingUnavailable dan shippingPartial; seluruhnya hanya aktif pada localhost.

Pratinjau tarif: /pages/public/product-detail.html?product=monstera&preview=product-detail&state=shippingRates. Pemeriksaan baru: node tests/e2e/browser/verify-product-shipping.cjs. Tujuh kelompok lulus, termasuk snapshot seluruh localStorage/sessionStorage yang tidak berubah selama cek guest, hasil/no-service/partial/error/loading/offline, hasil terlambat, 390/320px serta alignment tombol akses Checkout.

Pada Checkout, selector .checkout-page-state > .checkout-dialog-actions kini memusatkan kelompok tombol sesuai teks/ikon state. Footer tombol dialog/form lainnya tidak diubah. Login tetap mengarah ke halaman masuk dan menyimpan konteks returnTo Checkout; tidak ada bypass autentikasi.

Bukti screenshot dan hasil lokal: storage/reports/product-shipping. Tarif belum terhubung provider kurir produksi; tidak ada endpoint, pemetaan wilayah, berat paket atau ongkir per jumlah yang direkayasa.

Pemeriksaan akhir setelah koreksi ongkir: Detail Produk13 kelompok, revisi tampilan7, ongkir/akses Checkout7, dan regresi Checkout17 kelompok lulus tanpa runtime error. Workbench Checkout juga diuji ulang (59 tautan state), serta alur Beli Sekarang guest ditangkap pada state Masuk untuk Checkout yang sebenarnya. Respons tarif tidak berbentuk daftar diperlakukan sebagai gangguan data, bukan pernyataan wilayah tidak terlayani. URL preview shippingRates langsung menggulir ke contoh hasil tarif; perilaku otomatis ini hanya untuk workbench localhost.
