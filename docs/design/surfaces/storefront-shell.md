# Navbar dan Footer Storefront — Acuan Figma

> **Revisi ukuran terbaru, 13 November 2026:** pengguna meminta navbar/footer
> lebih kecil, khususnya ponsel. Identitas/aset/warna tetap; tinggi bar utama,
> logo/footer dan struktur buka-tutup ponsel kini mengikuti
> [revisi pelanggan](../../coverage/customer-refinements.md). Ukuran persis
> yang tercantum di bawah adalah rekam acuan awal, bukan kriteria ukuran terbaru.

13 November 2026. Instruksi pengguna yang mengikat:
“untuk nav dan footernya wajib sama dengan yang sudah saya buat di figma”.
Acuan ini menggantikan adaptasi shell ringkas pada implementasi Pembayaran awal.
Isi dan aturan bisnis pembayaran dipertahankan. Uji regresi juga memperbaiki
pemicu timeout yang sesekali berjalan sebelum deadline pecahan milidetik;
pemeriksaan dijadwalkan ulang tanpa mengubah status uang atau pesanan di browser.

## Sumber dan batas perubahan

File Figma: LcUKB3k9C38G0g6KWo5zIU, halaman 00 Public, Checkout 375:108.
Gambar lampiran pengguna menjadi pembanding visual. Desain dibaca melalui
Figma design context dan screenshot, bukan dipasang sebagai gambar satu halaman.

| Bagian | Node | Ukuran / posisi pada frame 1920 px |
| --- | --- | --- |
| Utility navigation | 473:1741 | Tinggi 36 px |
| Main navigation | 473:1749 | Tinggi 104 px, latar #6B9071 |
| Search | 473:1752 | x 401,5 px, lebar 960 px, tinggi 52 px |
| Logo navbar | 473:1792 | x 102 px, 162 × 36,7138 px |
| Category navigation | 473:1772 | Tinggi 52 px, latar #375534 |
| Footer | 375:185 | Tinggi 251 px: isi 211 px dan copyright 40 px |
| Logo footer | 375:230 | x 102 px, y lokal 22 px, 203 × 61 px |

Logo navbar dan footer memiliki proporsi yang berbeda pada sumber; keduanya
memakai ekspor aslinya masing-masing. Ikon akun, wishlist, keranjang, pencarian,
Facebook, Instagram, TikTok, serta dua lapis ikon YouTube juga memakai ekspor
asli. Ukuran intrinsik SVG dan slot tampilannya diperiksa.

## Implementasi

- Markup semantik: public/pages/customer/payment.html.
- CSS khusus: public/assets/css/storefront/storefront-shell.css.
- Interaksi pratinjau: public/assets/js/storefront/storefront-shell.js.
- Aset lokal: public/assets/images/storefront/.
- Body, tombol, menu, dan deskripsi memakai Poppins. Empat judul kelompok
  footer memakai Inter Bold seperti node Figma; pengecualian ini terbatas pada
  footer atas instruksi pengguna agar mengikuti referensi. Font Inter berasal
  dari [Google Fonts](https://github.com/google/fonts/tree/main/ofl/inter),
  dengan OFL.txt disertakan di public/assets/fonts/inter/.
- Warna lokal pencarian, label, tombol pencarian, dan promo mengikuti nilai
  Figma. Token global dan halaman staf tidak diubah.
- Teks utility bar, nama menu, “Buket Costum” pada footer, handle sosial,
  dan copyright dipertahankan dari referensi; bukan keputusan baru atas
  aturan ongkir, pengembalian, atau integrasi media sosial.

## Responsif dan interaksi

Figma yang diberikan berupa desktop. Pada lebar lebih kecil, isi dan aset tetap
dipertahankan: pencarian turun ke baris berikutnya, kategori dapat digulir
horizontal, dan kelompok footer tersusun ulang tanpa terpotong.
Pada ponsel, target utility dan footer dibuat setinggi minimal 44 px.
Pada desktop, utility dan tautan footer mempertahankan ritme referensi dengan
target minimal 24 px; pengecualian uji ini dibatasi pada kedua kelompok tersebut.

Halaman katalog, wishlist, keranjang dan tujuan footer belum tersedia
sebagai implementasi storefront. Menekan kontrolnya menyampaikan tujuan yang
belum terhubung melalui pemberitahuan pratinjau, mempertahankan konteks pesanan.
Form pencarian mempertahankan kata kunci dan tidak berpura-pura memuat hasil.
Tidak ada URL profil sosial atau endpoint produksi yang dikarang.

Pada perluasan Pesanan Saya, tombol utility “Lacak Pesanan” membuka
`public/pages/customer/my-orders.html`. Markup, aset, geometri dan tipografi
navbar/footer tetap sama; tujuan tersebut sekarang tersedia sebagai pratinjau
daftar, tanpa mengklaim layanan pelacakan produksi telah aktif.

Pada perluasan Profil & Pengaturan Akun, kontrol “Akun” membuka
`public/pages/customer/account.html`. Konteks daftar dipulihkan saat kembali;
dari Detail/Pembayaran, tujuan kembali tetap internal dan diberi label sesuai
halamannya. Markup dan CSS shell tidak berubah. Penanda logout nonpribadi pada
fixture akun juga dibaca adapter transaksi sintetis, sehingga data contoh tidak
muncul kembali sesudah logout. Ini konsistensi pratinjau per tab, bukan
autentikasi atau otorisasi server produksi.

Warna serta tipografi referensi dipertahankan sesuai permintaan. Pemeriksaan
perbandingan visual dan keyboard ini bukan klaim audit WCAG AA menyeluruh
terhadap seluruh warna dan teks kecil pada desain sumber.

## Verifikasi

    node tests/e2e/browser/verify-storefront-shell.cjs
    node tests/e2e/browser/verify-payment.cjs
    node tools/maintenance/check-project-structure.cjs

Bukti navbar/footer dan ukuran tampilannya tersimpan pada
storage/reports/payment-shell/. Pemeriksaan mencakup geometri sumber pada
1920 px, 11 aset asli, font, kelompok menu, layout 320–1920 px, serta kejujuran
interaksi tujuan pratinjau. Regresi pembayaran memeriksa 50 skenario yang sama
dengan implementasi sebelumnya.

Hasil akhir: pemeriksaan navbar/footer lulus untuk 11 kelompok pemeriksaan dan
11 aset asli; regresi pembayaran lulus untuk 50 skenario, 73 pemeriksaan,
16 tangkapan layar, tanpa kesalahan JavaScript. Screenshot potongan navbar dan
footer pada 1920 px dibandingkan dengan referensi; versi 1440 dan 390 px juga
dibuka untuk pemeriksaan visual. Pemeriksaan layout mencakup 320–1920 px.
