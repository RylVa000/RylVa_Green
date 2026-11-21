# Cara Memesan

19 November 2026. Mode **Read**, perluasan pembaca informasi storefront existing. Halaman publik membantu pembeli pertama memahami urutan dari memilih produk sampai menerima pesanan. Pengunjung dapat membaca tanpa akun; Checkout tetap membutuhkan akun pelanggan terverifikasi. Pengguna meminta eksekusi dalam tema yang sudah disepakati, bukan identitas baru.

## Sumber dan batas

PRODUCT.md, DESIGN.md, baseline `docs/specifications/spesifikasi-proyek-v2.6.md` §6–10, implementasi Katalog/Detail Produk/Keranjang/autentikasi/Checkout/Pembayaran/Pesanan Saya, serta panduan Pengiriman dan Refund menjadi acuan. Tidak ditemukan halaman atau spesifikasi Cara Memesan tersendiri. Keputusan rutin mengikuti alur yang nyata; jangan membuat pesanan, mengisi keranjang otomatis, membuka transaksi tertentu dengan ID buatan, atau mengklaim integrasi produksi dari panduan.

Kind bisnis **place**, florist/toko tanaman; permukaan ini Read. Aksi utama **Mulai dari Katalog**. Warna, Poppins, ikon, radius, header/footer dan motion mengikuti proyek. Struktur sudah ditetapkan oleh rangkaian halaman informasi dan revisi pengguna: banner hijau penuh, teks putih di tengah, breadcrumb kiri dalam container; sidebar daftar isi aktif saat scroll, artikel di kanan; disclosure pada mobile. Tidak membutuhkan comp baru, foto dekoratif, perubahan DESIGN.md atau pemilihan tema.

## Direction contract

**THESIS:** Pembeli pertama memahami urutan belanja yang benar dan tahu tindakan pemulihan saat pilihan, harga atau pembayaran belum jelas. Enam nomor menunjukkan urutan kerja, bukan progres transaksi.

**OWN-WORLD:** Poppins, hijau/cream RylVa, banner putih di atas hijau, tombol pill dan garis pemisah existing. Container 1180 px, sidebar tenang dan artikel dengan lebar baca yang sama dengan panduan sebelumnya.

**STORY:** Pahami pilihan produk, periksa Keranjang, masuk/verifikasi, atur pengiriman, tinjau/bayar, lalu pantau/terima. Buket Kustom dan empat FAQ melengkapi alur tanpa membuat transaksi baru.

**FIRST VIEWPORT:** Shell tetap, breadcrumb kiri, H1 putih terpusat, deskripsi ringkas. Revisi pengguna 19 November: Mulai dari Katalog dan Buka Keranjang berada di tengah, di dalam banner hijau di bawah deskripsi. Aksi utama putih dengan teks hijau, aksi sekunder transparan dengan border/teks putih. Daftar isi dan langkah pertama menyusul. Mobile memakai satu kolom dan disclosure; kedua tombol bertumpuk di dalam banner.

**FORM:** Ekstensi Read dari pola panduan yang sudah ditetapkan, `seed: none (pinned)`. Instruksi pengguna: “Pertahankan header, footer, sidebar, navigasi, dan bagian lain di luar cakupan” serta “Gunakan kembali komponen yang sama atau serupa sebelum membuat komponen baru.” Tidak ada konsep visual terbuka atau comp baru.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Untuk ekstensi ini, DESIGN.md dan aset existing dipertahankan; dokumentasi cakupan mencatat pemeriksaan kecocokan terhadap sistem tersebut. Tidak ada raster baru yang dikirimkan.

## Isi dan urutan

1. **Pilih produk.** Katalog/pencarian/filter, buka Detail Produk, periksa varian/ukuran, satuan, harga, stok, perawatan dan jenis penanganan. Kode pos dapat dipakai sebagai estimasi awal ongkir tanpa mengubah alamat akun; keputusan akhir di Checkout.
2. **Periksa Keranjang.** Atur jumlah dan pilih produk untuk Checkout. Produk bermasalah harus diselesaikan sesuai UI. Keranjang tidak mencadangkan stok/harga; tidak membuat klaim stok terkunci.
3. **Masuk dan verifikasi.** Guest tetap dapat menjelajah/mengisi keranjang. Login/registrasi muncul ketika melanjutkan pembelian; jangan menganggap membaca panduan atau tombol login sebagai verifikasi berhasil.
4. **Alamat, jadwal dan kurir.** Data penerima lengkap, layanan yang tersedia, tanggal/slot wajib Mudah Layu, layanan sesuai semua produk pada keranjang campuran, kartu ucapan opsional. Tautkan panduan Pengiriman; jangan mengarang kota, tarif, provider, gratis ongkir atau waktu tiba.
5. **Tinjau dan bayar.** Subtotal/ongkir/total serta persetujuan eksplisit; perubahan rincian meminta persetujuan ulang. Tombol sesuai UI: Buat Pesanan & Bayar atau Buat Pesanan / Bayar di Tempat. Online terverifikasi berbeda dari COD Menunggu; ikuti batas waktu sebenarnya, jangan mengulang pembayaran saat status belum pasti.
6. **Pantau dan terima.** Pesanan Saya → pilih pesanan sendiri → detail/pelacakan. Konfirmasi penerimaan setelah memeriksa barang. Komplain maksimal 24 jam sejak Terkirim dan sebelum konfirmasi penerimaan; pembatalan/refund tetap mengikuti panduan terkait, bukan otomatis dari artikel.
7. **Buket kustom.** Alur alternatif pada peracik existing: login, lengkapi pilihan bunga/bahan/pembungkus/pita, pratinjau otomatis ilustratif, periksa jumlah/harga dan tambahkan ke Keranjang. Bukan editor manual susun tangkai baru.
8. **Pertanyaan memesan.** Empat FAQ praktis: perlu akun, Checkout belum aktif, perubahan harga/stok, pembayaran masih Menunggu. Ringkas dan gunakan tindakan pemulihan yang sudah ada; tautan bantuan/panduan terkait.

Nomor enam langkah membawa urutan kerja, bukan indikator langkah selesai atau progres transaksi. Setiap langkah mempunyai penjelasan serta informasi yang harus diperiksa. Tindakan utama Katalog dan Keranjang ada di pembuka, tidak ada tombol submit transaksi di artikel. Satu blok bantuan di akhir memakai pasangan tombol sejajar yang sudah diperbaiki.

## Komponen, state dan navigasi

Gunakan `shipping-information.css`, `information-policy.css`, `information-policy-no-script.css`, `information-article.js`, FAQ native existing dan shell yang sama. Wrapper target menetapkan ID, history key serta sumber kembali same-origin yang diizinkan: Katalog/Keranjang/Checkout. Tidak menerima `returnTo` arbitrary dari query. Browser Back memulihkan posisi baca, TOC dan FAQ; scroll spy tidak mengubah URL/fokus/history. Membuka detail dari daftar tetap menjadi alur halaman tujuan.

| Area/state | Pemicu dan tampilan | Tindakan/pemulihan |
| --- | --- | --- |
| Default / guest | Artikel lengkap, label pratinjau alur belanja | Buka Katalog atau Keranjang, baca tanpa login |
| Bagian aktif | Scroll dua arah | Tepat satu `aria-current`, warna serta bobot; tidak menambah history |
| TOC mobile | Collapsed/expanded | Native disclosure, keyboard, pulih setelah Back |
| Anchor | Klik / Enter / tautan langsung | Fokus heading dengan ruang header yang cukup |
| Anchor lama | Target tidak ditemukan | Kembali ke pembuka; link/scroll berikutnya tetap dapat dipakai |
| FAQ | Closed/open | Keyboard dan single-open; pilihan pulih setelah kembali |
| Hover/focus/active | Interaksi link/tombol | Feedback dan ring existing; reduced motion |
| Tanpa JavaScript | Script tidak berjalan | Artikel, tautan, anchor dan FAQ tetap native |
| Konten panjang | Judul/FAQ panjang atau lebar 320 px | Membungkus tanpa clipping/overflow; tidak menyembunyikan langkah |
| Konteks sumber | Masuk dari daftar/belanja yang diizinkan | Kembali melalui history melewati fragmen; fallback path tervalidasi |
| Akses tujuan | Guest membuka alur pelanggan | Guard halaman tujuan tetap berlaku, tidak diakali parameter preview |

Tidak menambah loading/error API, data kosong, form rekening, unggahan bukti atau pemrosesan pembayaran pada artikel statis. State tersebut tetap milik halaman tujuan. Workbench pengembangan terpisah memuat normal, anchor, fragmen lama, FAQ terbuka, tanpa JavaScript dan teks panjang; tanpa mutasi pesanan simulasi pada alur publik.

## Kriteria selesai dan batas produksi

Footer Cara Memesan menuju route aktif `/pages/public/how-to-order.html`; alias Inggris/Indonesia. Seluruh langkah, link, empat FAQ, current footer, skip link, state keyboard/no-JS dan konteks kembali berfungsi. Uji 1440/1024/768/390/320 px, semua bagian dua arah, pembukaan tujuan, guest guard dan sumber Katalog dengan query/filter. Pertahankan perubahan pengguna di halaman lain.

Konten adalah panduan alur yang direncanakan/diperagakan oleh frontend. Label pratinjau tetap terlihat; API transaksi, akun, stok, gateway, tarif dan pengiriman produksi tidak diaktifkan oleh halaman ini. Tidak ada commit, push atau publikasi tanpa permintaan pengguna.
