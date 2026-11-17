# Detail Produk

Mode: Operate. Pengunjung meninjau produk, memilih jumlah, lalu menambah ke keranjang atau melanjutkan ke Checkout.

Visual authority: Figma Detail Produk 282:838 pada file LcUKB3k9C38G0g6KWo5zIU, diperiksa 17 November 2026. Pengguna meminta komponen yang lebih kecil dengan hierarki jelas. Susunan desktop dipertahankan: informasi/pembelian kiri, galeri dan perawatan kanan. Judul maksimal 36px, judul bagian 18px, kontrol utama 48px dan target sentuh minimal44px. Mobile menampilkan galeri sebelum informasi dan panduan setelah pembelian.

Fondasi tetap DESIGN.md: Poppins, krem, hijau RylVa, shell header/footer yang sudah tersedia. Tidak membuat identitas atau tema baru. Data delapan produk memakai fixture storefront dan keranjang; hanya pilihan varian yang benar-benar tersedia ditampilkan.

Tiga gambar Monstera dan lima ikon disalin dari aset Figma ke public/assets/images/product-detail. Sumber sementara dan perannya dicatat di ../../coverage/product-detail-ui.md. Label aman untuk hewan pada Figma dikoreksi berdasarkan ASPCA. Perawatan Monstera bersumber UW–Madison Extension, bukan aturan penyiraman mingguan tetap.

Asumsi: halaman frontend pratinjau mengikuti pola proyek; backend PHP masih scaffold. Harga/stok contoh mengikuti keranjang (stok20, bukan24 pada Figma); diskon dihitung dari harga (17%). Hanya satu varian Monstera Besar70–90cm tersedia. Tidak mengarang ukuran, SKU produk lain, dimensi kemasan, tarif kurir atau endpoint.

## Revisi pengguna — rounded, zoom dan mobile

Pengguna memberikan screenshot Figma dan hasil implementasi untuk revisi17 November 2026: radius tombol/input lebih membulat, badge diskon merah, harga lama abu-abu dengan coretan merah, zoom otomatis ketika hover pada desktop, tombol Perbesar tetap pada mobile, serta kolom Cek Ongkir dan kuantitas yang sejajar. Desain mobile diminta disusun ulang melalui Hallmark dalam tema yang sama.

Desktop mempertahankan dua kolom Figma. Seluruh kontrol utama48px. Cek Ongkir dan stepper memakai variabel lebar yang sama144px (132px pada tablet), dengan tepi kiri/kanan tepat sejajar. Field kode pos menjadi satu kapsul dengan tombol hijau. Border radius pilihan20px, galeri28px, panel perawatan36px dan tombol kapsul. Diskon tetap dihitung dari fixture (17%), tanpa menyalin angka6% yang tidak sesuai di screenshot Figma. Merah fungsional#FF0000 dan text-secondary dipakai sesuai referensi; teks badge putih memakai19px bold agar cukup terbaca di atas merah.

Mobile disusun sebagai galeri lebar dengan thumbnail horizontal, informasi serta form berurutan, dan subtotal/tindakan tetap di bawah. Tombol zoom tetap terlihat dan bekerja dengan sentuhan. Tinggi bar bawah diukur memakai ResizeObserver untuk menyediakan ruang yang sama di akhir halaman; footer tetap dapat diakses meskipun umpan balik menambah tinggi bar. Tombol pembelian yang sama dipakai, bukan duplikat dengan handler terpisah. Label mobile Tambah dilengkapi ikon keranjang dan nama aksesibel Tambah ke Keranjang.

Hover zoom hanya untuk mouse/fine pointer pada>=768px, mengikuti titik kursor, berhenti ketika keluar, dan tetap menyediakan dialog melalui keyboard. Pada reduced-motion pembesaran berlangsung tanpa transisi. Header/footer, data, stok, varian, harga, akses dan handoff Checkout tidak diganti.

## Cek ongkir tanpa alamat akun

Koreksi pengguna17November2026: guest cukup mengisi kode pos tujuan untuk melihat estimasi, tanpa menyimpan atau mengganti alamat utama. Hasil ditempatkan di bawah form sebagai daftar layanan dengan harga di kanan, ETA, kode pos/jumlah yang dicek, label Tarif contoh bila masih fixture, serta catatan bahwa ongkir akhir dikonfirmasi di Checkout. Ini bukan pemilih layanan atau perubahan alamat Checkout.

Sumber harga contoh dipakai bersama Checkout; belum ada panggilan kurir produksi. Loading, error/timeout/retry, tidak ada layanan, sebagian tarif hilang dan konteks yang berubah memakai panel yang sama. Kode pos tetap ada untuk pemulihan, hasil yang sudah tidak sesuai jumlah/ukuran tidak dipertahankan. Respons lama diabaikan berdasarkan versi permintaan.
