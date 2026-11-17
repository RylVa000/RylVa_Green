# Integrasi halaman informasi

Tanggal: 17 November 2026. Cakupan: menyatukan halaman yang diberikan pengguna ke direktori dan navigasi storefront aktif, tanpa mengubah backend.

## Sumber dan lokasi baru

| Berkas pengguna | Hasil integrasi |
| --- | --- |
| `Contact.html` | `public/pages/public/contact.html` |
| `FAQ.html` | `public/pages/public/faq.html` |
| `PrivacyPolicy.html` | `public/pages/public/privacy-policy.html` |
| `tanaman.css` | Style yang relevan dipisahkan ke `public/assets/css/storefront/information-pages.css`, memakai token dan Poppins lokal |
| `tanaman.js` | Perilaku FAQ dipindahkan ke native details/summary dan fallback single-open pada `public/assets/js/storefront/information-pages.js`; animasi halaman lama tidak dibawa secara global |

Berkas asli pada Downloads tidak diubah atau dipindahkan secara destruktif. Alias nama berkas asli dan versi huruf kecil tercatat pada `config/preview-pages.json` untuk server pratinjau.

## Yang disatukan

- Header/footer memakai markup shell yang sudah ada; logo dan ikon lokal menggantikan referensi `img/flower.svg` serta Font Awesome dari CDN.
- `img/contact-bg.jpg` tidak tersedia pada berkas kiriman. Banner memakai fallback hijau proyek agar tidak memuat aset yang rusak.
- Follow-up referensi 17 November: Kontak memakai kembali palet `tanaman.css` pengguna—hijau `#4E694B`, teks `#4F504B`, kartu krem `#FDFAF5`, latar isi putih, dan gradient sage dengan teks putih pada banner. Proporsi banner, lebar kartu, padding serta radius mengikuti referensi sumber. Variant ini dibatasi pada `.information-contact .information-main`; navigasi utama dan halaman lain tidak berubah.
- Garis putus-putus kartu terang dan input Kontak dipertebal menjadi 2 px. Fokus input mengubah border menjadi solid dengan ring yang tetap terlihat. FAQ dan Kebijakan Privasi mempertahankan banner sage muda dari perbaikan sebelumnya.
- Pusat Bantuan, Hubungi Kami dan Kebijakan Privasi pada shell menjadi tautan navigasi biasa ke route aktif. Penjaga perubahan belum disimpan pada Akun, Keranjang dan Buket tetap menerima anchor tersebut.
- Tiga halaman memakai panel Keranjang/Wishlist/Akun bersama dan pencarian yang menuju Katalog.
- Struktur Kontak dipertahankan: banner, tiga kanal kontak, jam kerja, peta dan formulir. Link WhatsApp, email dan Maps berasal dari sumber pengguna. Peta tetap memakai iframe Google Maps sumber dan mempunyai tautan alternatif yang terlihat; ketersediaan layanan Google tidak dijamin oleh frontend.
- Delapan pertanyaan dan jawaban FAQ dipertahankan. Keyboard, buka/tutup, satu pertanyaan terbuka, serta pembacaan tanpa JavaScript tersedia melalui elemen native.
- Delapan bagian isi Kebijakan Privasi dan tanggal 18 Oktober 2026 dipertahankan. Perapian markup tidak mengubah substansi teks sumber.
- Label dekoratif blog pada Kontak dan badge berulang di atas judul dihapus; identitas halaman tetap melalui judul. Konten Kontak berbahasa Inggris dari sumber dipertahankan, dengan label formulir Indonesia.

## Formulir Kontak

Sumber pengguna memiliki `action="#"` tanpa handler pengiriman. Integrasi ini tidak menampilkan sukses pengiriman palsu: tombol **Buka draf email** memvalidasi kolom wajib, menyusun mailto yang mengodekan nama/email/pesan, lalu membuka aplikasi email pengguna. Input tetap berada di formulir, status menjelaskan handoff, dan tautan email/WhatsApp tetap tersedia. Tidak ada POST, pengiriman email oleh aplikasi, penyimpanan pesan atau endpoint baru. Tanpa JavaScript, tersedia tautan email langsung.

## Batas konten dan integrasi

Isi FAQ dan kebijakan adalah konten yang diberikan pengguna, bukan hasil verifikasi layanan produksi. Beberapa pernyataan sumber belum sesuai bukti implementasi saat ini: kanal SMS/WhatsApp OTP pada kebijakan berbeda dari alur verifikasi email proyek; nama mitra/sertifikasi gateway, cookies analitik, kartu ucapan gratis, garansi 100% dan batas 1×24 jam belum dibuktikan oleh integrasi frontend. Pernyataan tersebut dipertahankan sebagai isi impor, bukan diterapkan sebagai aturan bisnis baru. Penyelarasan substantif dokumen memerlukan pekerjaan konten tersendiri sebelum publikasi. Tidak ada klaim bahwa impor ini mengaktifkan layanan tersebut.

Cara Memesan, Informasi Pengiriman, Pembatalan & Refund, Tentang Kami serta Syarat & Ketentuan sebagai halaman lengkap tidak dibuat dari asumsi tambahan.

## Pemeriksaan

`tests/e2e/browser/verify-information-pages.cjs` mencakup layout tiga halaman pada 1440, 1024, 768, 390 dan 320 px; FAQ keyboard/no-JS; required fields dan handoff email; navigasi shell; pencarian; panel Keranjang/Wishlist; serta alias berkas lama. Opsi `RYLVA_INFORMATION_SOURCE_DIR` membandingkan seluruh teks isi kebijakan dan pertanyaan/jawaban FAQ dengan berkas kiriman, mengabaikan whitespace perapian markup.

Hasil: tujuh kelompok pengujian halaman informasi lulus, termasuk perbandingan teks sumber; regresi shell lulus 11 pemeriksaan dan 11 aset. Follow-up warna Kontak diperiksa pada 1440/1024/768/390/320 px, termasuk palet kartu, border dashed 2 px serta kontras teks banner minimal 4,5:1 terhadap kedua ujung gradient. Tidak ada pageerror pada skenario yang diuji. Pemeriksaan sintaks JavaScript dan whitespace diff juga dijalankan.

Suite menolak request eksternal untuk hasil yang terukur; karena itu render peta Google tidak termasuk klaim kelulusan. Request favicon.ico implisit browser pada halaman konsumen lama dikecualikan dari daftar aset baru; ketiga halaman impor menyatakan favicon SVG lokal. Capture lokal berada pada `storage/reports/information-pages/` dan hasil regresi shell pada `storage/reports/payment-shell/`.

Tidak ada commit, push, publikasi atau deployment.
