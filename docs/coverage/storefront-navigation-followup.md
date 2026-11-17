# Follow-up navbar storefront — 17 November 2026

Permintaan: sticky navbar pada semua halaman storefront, badge jumlah Wishlist,
pencarian dari halaman lain menuju Katalog, label tombol masuk Buket selalu
terlihat, dan checkbox kategori yang lebih lembut. Penyempurnaan berikutnya:
badge Wishlist digeser ke kanan, checkbox disamakan di seluruh halaman, serta
navbar menyembunyikan diri saat scroll turun dan muncul ketika scroll naik.

## Perubahan

- Header bersama memakai CSS sticky tanpa mengeluarkan elemen dari alur halaman.
  Tinggi aktual diukur melalui ResizeObserver untuk offset filter Katalog,
  toolbar mobile, ringkasan Keranjang, panel aksi Detail Pesanan dan kategori
  Buket. Scroll anchor menyisakan ruang di bawah header. Saat turun 24 px header
  tersembunyi, saat naik 12 px muncul dengan transisi 360 ms; offset panel
  menyesuaikan ruang yang tersedia. Dekat atas halaman, pencarian aktif,
  fokus keyboard dan dropdown terbuka menjaga header terlihat. Reduced motion
  menonaktifkan transisi. Perilaku navbar staf/autentikasi tetap terpisah.
- Badge Wishlist mengikuti snapshot store bersama pada 14 route. Angka kosong
  disembunyikan; count tidak ditampilkan saat loading/error. Label aksesibel
  menyebut jumlah penuh, sementara tampilan di atas 99 diringkas menjadi `99+`.
  Badge desktop digeser sedikit ke kanan dari ikon hati. Badge mobile sejajar
  dengan badge Keranjang.
- Submit pencarian non-Katalog membuka `/pages/public/catalog.html?q=...`.
  Input tidak menavigasi hanya karena sedang diketik. Katalog tetap memakai
  filter pencarian langsung yang sudah ada. Hasil saat ini berasal dari data
  contoh Katalog; tidak ada endpoint pencarian baru.
- Submit bersama mendispatch `rylva:before-search` yang dapat dibatalkan.
  Keranjang, Akun dan Checkout memakai konfirmasi/guard yang sudah ada; Buket
  mempertahankan confirmLeave-nya. Batal mempertahankan input yang masih relevan.
- Warna label tombol primer Buket tidak lagi dikalahkan selector tautan umum.
- Checkbox memakai `shared/checkbox.css` melalui fondasi token: radius 6 px,
  garis centang dengan ujung bulat, state indeterminate, disabled, fokus
  terlihat dan fallback native pada forced colors. Dimensi formulir setempat
  dipertahankan dan padding bidang teks tidak lagi memperbesar checkbox alamat.
  Input tetap checkbox HTML dengan label, klik dan Space. Radio dan switch
  mempertahankan desainnya. Audit dependensi mencakup 25 route yang memuat
  checkbox langsung atau melalui modul formulir, termasuk autentikasi dan staf.

## Bukti aktual

| Pemeriksaan | Hasil |
| --- | --- |
| `verify-storefront-sticky.cjs` | 7 kelompok lulus; arah scroll 14 halaman pada 1440/390 px, resize 320 px, sidebar, dropdown, fokus, sheet, anchor dan reduced motion |
| `verify-shared-checkbox.cjs` | 8 kelompok lulus; dependensi style 25 route, interaksi Katalog/Keranjang/Checkout/Akun/Registrasi/Staf, keyboard, disabled, forced colors dan sheet mobile |
| `verify-navigation-updates.cjs` | 7 kelompok lulus; offset badge desktop, count semua route, pencarian non-Katalog, batal/lanjut draf Keranjang dan Checkout, mobile badge, tombol Buket dan checkbox desktop/mobile |
| `wishlist-store.cjs` | 6 kelompok unit lulus |
| `verify-wishlist.cjs` | 15 kelompok lulus |
| `verify-catalog.cjs` | 19 kelompok lulus setelah perubahan offset sticky |
| `verify-order-detail.cjs` | 50 skenario, 34 pemeriksaan lulus setelah perubahan offset sticky |
| `verify-bouquet-customizer.cjs` | 17 kelompok lulus, termasuk label masuk sebelum hover |
| `verify-storefront-shell.cjs` | 11 pemeriksaan, 11 aset lulus; pencarian dari Pembayaran menuju Katalog dan Back mempertahankan konteks |

Tidak ada pageerror pada suite browser yang tercatat. Capture dan hasil berada
di `storage/reports/storefront-sticky/`, `storage/reports/shared-checkbox/`
serta `storage/reports/navigation-updates/`.
Pemeriksaan sintaks dan whitespace diff dijalankan pada berkas yang terdampak.
Pemeriksaan struktur umum melewati referensi aset dan sintaks JavaScript, lalu
terhenti pada artefak lama `.hallmark/before.json` yang dilarang manifest migrasi.
Artefak tersebut tidak dihapus sebagai bagian perubahan UI ini.
Penyimpanan akun, transaksi dan autentikasi tetap mengikuti batas pratinjau
proyek; perubahan navbar tidak mengaktifkan backend produksi.

Tidak ada commit, push, publikasi atau deployment.
