# Informasi Pengiriman — cakupan UI

Implementasi frontend 18 November 2026 mengikuti [spesifikasi halaman](../design/surfaces/shipping-information-surface.md), baseline v2.6, DESIGN.md dan shell storefront yang sudah tersedia. Mode **Read**; tidak ada perubahan identitas visual atau framework.

## Route dan penautan

- Halaman: `/pages/public/shipping-information.html`.
- Alias preview: `/shipping-information.html` dan `/informasi-pengiriman.html`.
- Pemetaan footer bersama mengarah ke halaman ini dari seluruh route yang menggunakan `storefront-shell.js`.
- Detail Produk mempunyai tautan pada bantuan Cek biaya pengiriman. Jika halaman dibuka dari produk yang sama origin-nya, **Kembali ke Produk** memakai riwayat browser. Varian/jumlah mengikuti URL existing; kode pos disimpan hanya pada history entry produk, tanpa mutasi alamat atau penyimpanan ke akun.
- **Pilih Produk untuk Cek Ongkir** menuju Katalog; **Lihat Pesanan Saya** mengikuti guard akun pada tujuan. Pencarian header tetap menuju Katalog dengan parameter `q`.

## Komponen, isi dan state

Revisi 19 November: pembuka dipindahkan ke banner hijau selebar halaman dengan teks putih. Breadcrumb tetap di kiri; judul/deskripsi dipusatkan dalam container yang sama seperti Syarat dan Ketentuan dan Refund, memakai `information-policy.css`. Ringkasan jenis penanganan, artikel, data dan alur kembali ke produk tetap dipertahankan. Fallback native anchor tanpa JavaScript memakai stylesheet kebijakan yang sudah ada.

Perbaikan tindakan bantuan: kedua tombol di `.shipping-help-actions` kini sama-sama mempunyai margin nol. Margin atas 24 px milik tombol artikel sebelumnya hanya dibatalkan pada tombol utama, sehingga tombol sekunder tampak turun. Desktop kini satu garis; mobile tetap bertumpuk dengan gap kelompok, tanpa margin tambahan per tombol. Perbaikan komponen ini juga berlaku pada Syarat dan Ketentuan dan Refund.

Revisi daftar isi: penanda aktif mengikuti posisi bagian artikel saat scroll ke dua arah, termasuk setelah anchor, Back, pemulihan posisi baca, dan perubahan ukuran layar. Garis baca mempertahankan ruang header penuh agar transisi navbar tidak membuat pilihan berkedip. Handler scroll pasif dijadwalkan melalui `requestAnimationFrame`; pembaruan tidak mengubah fragmen URL, riwayat, fokus atau jumlah langkah kembali ke produk. Hover hanya menambah underline, sehingga latar hijau menandai satu bagian aktif. Pemeriksaan halaman kini mencakup 18 kelompok, termasuk perpindahan otomatis seluruh bagian dan pemisahan hover/aktif.

Header, footer, panel Akun/Wishlist/Keranjang, count, font, warna, tombol dan FAQ dipakai ulang. Style baru dibatasi pada kelas `shipping-*`; konten meliputi jenis penanganan, perbandingan layanan, area/ongkir, slot dan lead time, kesiapan penerima, status/pelacakan, kendala/perubahan, enam FAQ dan bantuan.

Daftar isi desktop sticky mengikuti tinggi navbar yang terlihat. Mobile menggunakan disclosure dalam alur halaman. Anchor dan fokus keyboard bekerja dengan jarak header penuh; hanya fragmen yang tidak memiliki target DOM kembali ke pembuka, sehingga skip link tetap menuju `main`. FAQ single-open memakai `details/summary` native. Browser Back memulihkan FAQ, keadaan daftar isi dan posisi baca. Riwayat bagian panduan dicatat agar Kembali ke Produk tetap menuju produk asal setelah perpindahan anchor dan Back. Artikel, daftar isi, FAQ dan tautan utama tetap dapat dipakai tanpa JavaScript. Tabel layanan berubah menjadi kelompok berlabel pada mobile.

Saat menambahkan Pembatalan & Refund, perilaku pembaca tersebut diekstrak ke `information-article.js`. Wrapper `shipping-information.js`, ID, key riwayat, validasi sumber dan konteks kembali ke produk dipertahankan; 18 kelompok regresi Informasi Pengiriman kembali lulus setelah ekstraksi.

Konten artikel statis tidak menambah permintaan layanan. Tidak ada loading, kegagalan API, login gate, formulir alamat atau kalkulator ongkir buatan pada halaman panduan. State jaringan/transaksi bersyarat pada spesifikasi tetap menjadi tanggung jawab integrasi yang kelak tersedia serta alur Detail Produk/Checkout/Pesanan.

## Penyelarasan konten terkait

Dua jawaban FAQ umum yang membahas pengiriman diperbarui sesuai baseline. Klaim cakupan Bandung, material pengemasan tertentu, garansi 100%, dan syarat video/WhatsApp diganti dengan jenis penanganan, pemeriksaan layanan di Checkout, komplain melalui Detail Pesanan, tenggat sejak Terkirim, ketentuan foto dan peninjauan berbasis sebab/bukti. Enam jawaban lainnya, layout, Kontak dan Kebijakan Privasi tetap mengikuti impor sebelumnya. Oleh karena itu, perbandingan seluruh teks FAQ terhadap berkas impor lama bukan lagi kriteria penerimaan versi ini.

## Pemeriksaan pengembangan

Workbench `/__preview/shipping-information` disajikan oleh server development `tools/preview/serve-dashboard.cjs`. Kondisi: normal, anchor langsung, fragmen tidak dikenal, FAQ terbuka, JavaScript dinonaktifkan, dan teks panjang; ukuran 1440/1024/768/390/320 px. Kontrol tidak dimuat pada halaman publik. Mode tanpa JavaScript menggunakan sandbox pada frame; teks panjang hanya mengubah DOM frame development.

`tests/e2e/browser/verify-shipping-information.cjs` memeriksa 18 kelompok: layout lima ukuran, keyboard/anchor/navbar, fragmen, skip link, FAQ, pemulihan baca, pencarian, konteks produk/kode pos setelah beberapa anchor dan Back, penautan footer enam route, guest/guard pesanan, alias, tanpa JavaScript dan teks panjang pada workbench. Seluruhnya lulus, tanpa pageerror atau resource lokal gagal pada skenario yang diuji. Hasil serta screenshot tersimpan di `storage/reports/shipping-information/`. Kasus fragmen lama, pemulihan kode pos, kembali melewati riwayat anchor, dan target skip link telah diperbaiki serta diperiksa.

Regresi `verify-information-pages.cjs` lulus 6 kelompok dan `verify-product-shipping.cjs` lulus 7 kelompok. Pemetaan 13 route workbench, dependensi lokal, ID unik, anchor, tautan dokumentasi, sintaks JavaScript dan whitespace diff juga diperiksa.

Review terpisah memeriksa kelima viewport dan capture seluruh artikel; tidak menemukan kebutuhan perubahan visual pada cakupan Read. Dua temuan navigasi dari pemeriksaan sumber—kembali setelah beberapa fragmen dan skip link—diperbaiki dalam satu batch. Verdict berikutnya menyatakan keduanya **resolved**, tanpa regresi material dari batch tersebut, dengan disposition **ship** khusus dua perbaikan yang dinilai. Ini bukan klaim bahwa seluruh temuan checker pada shell bersama telah ditutup.

### Catatan pemeriksa desain

- Hallmark pada CSS target: 0 FAIL, 0 REFLEX, 0 WARN; laporan `hallmark-target-css.json`.
- Impeccable pada halaman beserta dependensinya mencatat 20 temuan mengenai HOT 9 px, deklarasi font dan variasi radius/warna pada shell bersama yang sudah ada. Fondasi visual tersebut dipertahankan sesuai cakupan.
- Taste gate: **GATE: OPEN 46 (rounds used up)**. Laporan `taste-gate-final.txt` mencakup persyaratan template pemasaran seperti hero satu layar, foto/moment, kelas `.wrap`, grid dan heading, serta temuan navigasi/kontras/fokus pada shell existing. Halaman mengikuti kontrak Read dan komponen proyek; temuan ini tidak dianggap sebagai hasil pemeriksaan fungsi atau alasan untuk merombak header/footer.
- Hallmark render berhasil dijalankan dengan runtime lokal, tetapi laporan halaman gabungan masih memiliki 143 FAIL dari aturan warna putih/literal token, skala tipografi/spacing dan CSS bersama. Tidak ada klaim bahwa gate seluruh halaman lulus. Laporan lengkap ada di `hallmark-render.json`; capture tooling dipindahkan ke `hallmark-artifacts/` di direktori laporan, bukan disertakan dalam source publik.

## Batas integrasi

Tarif dan layanan pada alur belanja masih fixture pratinjau dan tetap diberi label. Halaman ini tidak menyatakan kurir, kota, radius, harga, ETA, pengemasan fisik, atau jaminan refund telah aktif. Parameter jadwal dan komplain memakai baseline; produksi memerlukan sumber konfigurasi yang sama dengan Checkout. Belum ada metadata kebijakan publik atau provider produksi. Kontrak guest untuk estimasi ongkir produksi masih perlu direkonsiliasi dengan kontrak pelanggan di baseline tanpa membuka akses alamat/pesanan akun. Route PHP/backend dan deployment tidak diaktifkan dalam perubahan ini.
