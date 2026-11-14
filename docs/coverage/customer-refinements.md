# Revisi akun, alamat, pesanan dan shell pelanggan

13 November 2026. Revisi lanjutan berdasarkan screenshot dan permintaan pengguna
setelah implementasi awal akun. Dokumen ini memperbarui cakupan awal, terutama
larangan mengubah ukuran shell dan status integrasi peta.

## Keputusan yang diterapkan

| Area | Hasil |
| --- | --- |
| Keamanan akun | Aktivitas Login dengan perangkat, IP contoh, waktu WIB, perangkat ini dan tombol Akhiri Sesi. Konfirmasi, kunci pengiriman ganda dan pencabutan sesi lain disediakan melalui adapter contoh. |
| Tindakan penting | Ubah profil/email, keamanan, simpan, refresh, rincian dan aksi kartu menggunakan tombol. Tautan navigasi biasa tetap dapat berupa tautan. |
| Buku alamat | Warna krem, batas hijau, label utama solid, nama/telepon satu kelompok, baris wilayah, ikon PinPoint dan divider tindakan mengikuti gambar Figma. Tindakan tetap tombol sesuai permintaan. |
| Form alamat | Ringkasan lokasi dan Ubah di atas; penerima, HP, alamat, label, catatan, utama, lalu Simpan. Wilayah tersimpan tetap terisi walaupun disclosure ditutup. |
| Rincian wilayah | Kelurahan/desa, kecamatan, kota/kabupaten, provinsi dan kode pos disembunyikan ketika lengkap/valid dan mempunyai titik. Pengguna dapat membuka Lihat Detail Alamat. Hasil parsial, kode pos invalid, isian manual atau kegagalan peta membukanya otomatis. Validasi gagal juga membuka section yang memiliki error. |
| Peta | Leaflet 1.9.4 stabil dimuat saat pengguna membuka pemilih lokasi, memakai tile OpenStreetMap. Klik peta atau tombol Pilih Titik Tengah Peta untuk keyboard, pencarian eksplisit dan reverse geocoding tersedia. |
| Pesanan Saya | Harga di tengah tinggi baris produk; badge berwarna sesuai status; dropdown tindakan lain, klik luar/Escape, hanya satu menu terbuka dan posisi ke atas bila bagian bawah viewport tidak cukup. |
| Pelacakan | Dua kolom desktop: informasi kurir/resi/penerima dan riwayat. Timeline memisahkan waktu, titik dan peristiwa; resi serta salin sejajar. Pada ponsel, riwayat tampil lebih dahulu. |
| Navbar/footer | Identitas, warna, logo dan tujuan tautan sumber dipertahankan. Ukuran dipadatkan atas instruksi terbaru. Footer ponsel mempunyai tiga kelompok buka-tutup; kontak tetap terlihat. Header ponsel memakai ikon dengan nama aksesibel. |

Perubahan ukuran terbaru mengesampingkan permintaan sebelumnya agar geometri
navbar/footer sama persis dengan screenshot Figma desktop. Tidak mengganti
brand, jenis huruf atau aset. Semantic colors baru dibatasi pada status transaksi
di `customer-status.css`; tidak mengubah palet global atau warna status bisnis.

Warna bermakna: amber untuk menunggu/perlu perhatian, biru untuk proses/kirim,
hijau untuk berhasil/selesai, merah untuk gagal/batal/sengketa, netral untuk
informasi lainnya. Status pesanan, pembayaran dan pengiriman tetap konsep yang
terpisah, dengan teks/ikon; warna tidak menjadi satu-satunya penanda.

## Integrasi dan batas yang sebenarnya

**Aktivitas Login masih pratinjau sintetis.** Sesi perangkat/IP bukan hasil
pembacaan browser pengguna atau database. `sesi_login` sudah memuat ringkasan
User-Agent, IP awal, waktu terakhir aktif, kedaluwarsa dan pencabutan. Controller
akun/auth yang tersedia belum menjalankan layanan ini. Produksi memerlukan read
model sesi milik akun dan pencabutan server dengan sesi sah, ownership, CSRF,
revisi serta audit. Tidak dibuat endpoint fiktif atau token sesi di frontend.

Adapter akun memperluas DTO dengan `sessionsAvailable`, `sessions` dan capability
`revokeSession`. `perform("revokeSession", { id }, expectedVersion)` adalah
kontrak adapter frontend, bukan endpoint aktif. Perangkat ini tidak dicabut lewat
aksi sesi lain; gunakan Keluar dari Akun. Ganti sandi contoh menghapus sesi lain.
Ada fixture hanya perangkat ini dan gagal memuat aktivitas, serta fixture error
mutasi yang sudah tersedia. Penyimpanan contoh per tab tidak mengamankan sesi
produksi dan tidak menyinkronkan pencabutan antarperangkat.

**Peta dan lookup lokasi terhubung di browser.** [Leaflet stabil](https://leafletjs.com/reference-1.9.4.html)
dipakai sebagai renderer; pengisian alamat berasal dari adapter geocoder
[Photon](https://github.com/komoot/photon), bukan dari Leaflet sendiri. Search dan
reverse mengikuti [kontrak API Photon](https://github.com/komoot/photon/blob/master/docs/api-v1.md).
Hasil geocoder tidak dijamin mempunyai semua tingkat wilayah Indonesia. Data
yang tidak diberikan tetap kosong dan dibuka untuk diperiksa/diisi; tidak
mengarang kelurahan, kode pos atau akurasi alamat.

Pencarian dilakukan lewat tombol, dengan antrean, cache memori dan jeda minimal
1,1 detik. Reverse dipicu pilihan pengguna; respons lama dibatalkan/diabaikan.
Nama, HP dan catatan penerima tidak ditambahkan ke permintaan geocoding.
Attribution OpenStreetMap/Photon terlihat; gerakan peta menghormati preferensi
pengurangan animasi. Timeout, tile gagal, CDN gagal dan hasil kosong memiliki
jalur ke pengisian manual. Input penerima/catatan dipertahankan ketika pindah
antara map dan rincian.

`window.RylvaMapConfig` dapat mengubah `geocoderBaseUrl` dan `tileUrl` sebelum
script map dimuat. Server demo Photon membatasi pemakaian wajar dan tidak
menjamin ketersediaan; kapasitas/provider operasional dan validasi wilayah server
tetap perlu ditetapkan sebelum produksi. Tidak ada ketergantungan Nominatim
publik yang ditambahkan. Leaflet dari CDN memakai versi tetap dan integrity.

Satu pencarian nyata untuk nama kota publik Bandung berhasil mengembalikan lima
hasil. Bukti ini menunjukkan koneksi layanan, bukan jaminan semua rincian
administratif benar/lengkap. Alur lengkap/parsial juga diuji dengan respons
geocoder terkontrol yang diberi label uji dalam skrip browser.

## Berkas dan pemeriksaan

- Akun: `account.html`, `account.css`, `account.js`, `account-preview-data.js`.
- Map baru: `public/assets/js/storefront/account-map.js`.
- Pesanan: `my-orders.html`, `my-orders.js`, `my-orders.css`.
- Detail: `order-detail.html`, `order-detail.js`, `order-detail.css`.
- Status bersama: `public/assets/css/storefront/customer-status.css`.
- Shell: `storefront-shell.js` dan `storefront-shell.css`; memengaruhi empat
  halaman pelanggan yang memakai shell ini.
- Workbench akun memperlihatkan dua state aktivitas baru langsung pada Keamanan.

Pengujian browser: `tests/e2e/browser/verify-customer-refinements.cjs`, laporan
dan capture pada `storage/reports/customer-refinements/`. Ponsel/tablet adalah
viewport emulasi Chrome; bukan pengujian perangkat iOS/Android fisik atau Safari.
Pengujian perubahan mencakup sesi/pencabutan, field tersembunyi tetap terisi,
fallback map, Leaflet/tile nyata, geocoding lengkap/parsial dengan respons uji,
dropdown/keyboard, resi, posisi harga dan footprint shell pada 320/390 px.
Capture tablet juga disediakan pada 768/1024 px; desktop pada 1440 px.

Regresi awal setelah revisi: Akun 40 skenario/18 pemeriksaan/35 capture,
Pesanan Saya 29/22/22, Detail Pesanan 50/34/29 dan Pembayaran 50/73/16,
tanpa error JavaScript. Shell 11 pemeriksaan/11 aset lulus pada 320–1920 px.
Hasil revisi akhir dan tinjauan independen dicatat dalam
[review revisi pelanggan](../design/reviews/customer-refinements-review-2026-11-13.md).

Hasil akhir suite revisi: **8 kelompok pemeriksaan, 36 capture, tanpa error
JavaScript**. Reviewer fresh membuka seluruh bukti serta gambar pengguna dan
menemukan satu masalah ringkasan lokasi 320 px. Setelah perbaikan dan recapture,
reviewer yang sama menilainya resolved, disposition ship pada perbaikan yang
dinilai. Syntax 12 berkas terkait dan pemeriksaan struktur/whitespace lulus.

Tidak ada perubahan schema, framework, autentikasi produksi, commit, push atau
deployment. DESIGN.md/PRODUCT.md global dipertahankan; keputusan lokal tercatat
di dokumen ini dan surface brief.
