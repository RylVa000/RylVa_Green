# Autentikasi pelanggan

14 November 2026. Implementasi UI pratinjau; controller PHP, email, Google OIDC,
CAPTCHA dan sesi produksi masih kerangka. Sumber bisnis: v2.6 §6.2–6.3,
P-28–P-32, RL-01/03/04/05 dan SEC-01/02/05/11. Sumber visual yang diperiksa:
Figma `428:264`, `72:136`, `90:220`, `126:114`, `126:155` pada file
`LcUKB3k9C38G0g6KWo5zIU`.

## Direction contract

**THESIS:** akses akun pelanggan yang jelas, mengikuti formulir botani Figma.
**OWN-WORLD:** Poppins, hijau RylVa, bidang organik dan aset asli Figma; formulir
berbentuk pil, tanpa perubahan sistem global.
**STORY:** masuk atau daftar, verifikasi dengan kode, pulihkan kata sandi bila
diperlukan, lalu kembali ke tujuan internal yang aman.
**FIRST VIEWPORT:** Login menempatkan formulir di kiri dan taman di kanan;
Registrasi membalik susunannya. Verifikasi/pemulihan memakai kartu di tengah
latar botani. Foto/panel tetap dekoratif; kontrol dan teks adalah HTML.
**SIGNATURE:** bidang organik asli memisahkan formulir dari fotografi, dengan
status inline dan tindakan yang tetap mudah ditemukan pada ponsel.
**CHOICE:** code-led, seed: none (pinned). Pengguna meminta “berdasarkan
spesifikasi, rancangan, dan keputusan yang telah disepakati” dan mempertahankan
desain proyek; lima frame autentikasi sudah tersedia, sehingga tidak ada
perancangan identitas atau pemilihan komposisi baru.
**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

Mode: **Operate**. DESIGN.md dipertahankan. Pengguna berada dalam alur akun di
layar desktop maupun ponsel, sehingga keterbacaan dan tugas mendahului animasi.

## Revisi gelombang · 15 November 2026

Pengguna meminta koreksi setelah melihat hasil: hilangkan sisa hijau di tepi
kanan layar lebar, ganti batas kotak pada foto mobile dengan gelombang natural,
haluskan kurva, tambahkan animasi pada gambar, dan terapkan pada lupa kata sandi.
Permintaan ini mengizinkan penyesuaian kontur dari SVG statis Figma sebelumnya.

Focal motion terbaru: bidang hijau memiliki tepi yang berubah secara kontinu;
foto dan formulir tetap diam. Kurva Bézier memakai tangent yang tersambung;
batas tidak memiliki sudut tajam. Tidak ada animasi zoom atau pergeseran foto.
Latar mengisi lebar viewport; kolom formulir tetap dibatasi agar mudah dibaca.
Mobile menggunakan gelombang horizontal dan buku halaman pemulihan menggunakan
artwork botani yang sama pada bagian atas. Tidak ada fitur akun yang diubah.

Budget: satu path hijau aktif diperbarui maksimal 30 fps, tanpa shader, filter
distorsi atau library baru. Tersedia kontrol Jeda/Putar (keyboard dan pointer),
preferensi kurangi gerakan, serta penghentian ketika dokumen tersembunyi atau
foto tidak terlihat. Preferensi jeda disimpan sebagai boolean sesi; tidak
berkaitan dengan data autentikasi.

Pengguna kemudian mengoreksi versi peningkatan intensitas: zoom foto terlalu
besar, gerak harus terjadi pada hijau, dan bentuk harus bervariasi secara natural.
Versi kini menggambar lapisan hijau di atas foto statis. Tiga gelombang berfase
dan berkecepatan berbeda menggeser puncak/lembah secara lokal, dengan fase awal
acak tiap halaman. Variasinya berkelanjutan, bukan bolak-balik dua bentuk atau
siklus pembesaran 12 detik. Sampel kurva dihubungkan secara halus dan dibatasi
agar tidak mengganggu kolom formulir. Waktu animasi ditahan saat jeda, tersembunyi,
atau di luar viewport, sehingga melanjutkan tidak membuat bentuk meloncat.

## Transisi Masuk ↔ Registrasi · 15 November 2026

Permintaan pengguna: perpindahan kedua halaman terasa hanyut, dengan gelombang
pasang. Fondasi warna, Poppins, foto statis dan gerak hijau sebelumnya tetap
dipertahankan. Transisi memakai path SVG hijau yang menyapu layar selama 380ms,
lalu membuka formulir tujuan selama 460ms. Tepi menggunakan kurva bersambung
dengan variasi lokal; formulir bergeser ringan 20px pada desktop atau 18px pada
ponsel dan berubah opasitas. Foto tidak diberi transform atau zoom.

Desktop bergerak kiri ke kanan menuju Registrasi dan sebaliknya menuju Masuk.
Pada ponsel/tablet, gelombang naik menuju Registrasi dan turun menuju Masuk.
Navigasi tetap menggunakan dokumen HTML asli. Hanya rute tujuan, arah dan waktu
transisi disimpan sementara, tanpa data formulir. Lapisan awal di tujuan
mencegah kilatan konten; batas 5 detik melepaskannya bila proses terhambat.

Konfirmasi isian Registrasi yang belum disimpan berjalan sebelum transisi.
Pembatalan mempertahankan isian. Root formulir menjadi inert selama sapuan;
setelah selesai fokus pindah ke judul dan lapisan dihapus. Browser Back tetap
memulihkan halaman yang dapat digunakan, termasuk saat memakai BFCache.
Kurangi gerakan atau Jeda menonaktifkan transisi. Storage gagal kembali ke
navigasi biasa; klik dengan modifier tetap memakai perilaku tautan browser.

## Keputusan implementasi

- Autentikasi menggunakan komposisi khusus Figma tanpa menambahkan navbar/footer
  belanja yang tidak ada pada frame. Shell storefront yang sudah ada tidak
  dirombak. Logo tetap aset RylVa, dengan jalur kembali ke halaman akun/tujuan.
- Teks antarmuka diterjemahkan ke Indonesia. Telepon ditambahkan pada Registrasi
  sesuai baseline. OTP dijelaskan sebagai kode 6 digit; teks “tautan verifikasi”
  pada frame diperbaiki. Lupa kata sandi memakai tautan pemulihan sekali pakai,
  bukan menyamakan masa berlaku token pemulihan dengan OTP registrasi.
- Label kecil/teks input pada panel hijau memakai tinta lebih gelap, heading
  besar memakai warna terang yang memenuhi kontras; bentuk dan aset dipertahankan.
- Logo transparan navbar yang sudah tersedia dipakai kembali untuk konsistensi
  identitas dan agar tidak ada kotak latar hijau pada foto. Ini penyesuaian dari
  logo gelap frame autentikasi, bukan penggantian merek. Tablet sampai 1100px
  memakai susunan vertikal supaya formulir panjang tidak melewati batas foto.
- Kata sandi tidak dipersistenkan, dicatat atau dimasukkan URL. Pratinjau tidak
  membuat sesi HttpOnly atau mengirim email. Sukses contoh disebut pratinjau;
  data contoh, batas UI dan kontrak adapter terpisah dari server produksi.
- OTP 10 menit, 5 kesalahan, resend 60 detik dan 5 pengiriman/jam. Token reset
  15 menit/sekali pakai. Rate limit produksi dan pencabutan sesi wajib di server.
- CAPTCHA/Google tidak dipalsukan. Ketika layanan belum tersedia, tindakan
  menjelaskan keadaan dan mempertahankan formulir; state khusus dapat diperiksa
  melalui workbench terpisah.
- Tujuan kembali memakai daftar route pelanggan internal. URL luar, protokol
  lain dan route staf ditolak. Email/data sensitif tidak dibawa di query.
- Kebijakan hukum belum dipublikasikan: tautan formulir membuka penjelasan
  ketersediaan dokumen, bukan teks kebijakan yang dikarang. Produksi perlu URL,
  versi dan pencatatan persetujuan yang nyata.

## Kriteria penerimaan

1. Lima tampilan dapat dibuka, tautan antaralur berfungsi dan tombol kembali jelas.
2. Label, autofill, password manager, paste OTP, tombol lihat kata sandi, fokus
   keyboard serta validasi inline bekerja tanpa menghapus input yang diperlukan.
3. Registrasi memvalidasi nama/email/telepon/password/konfirmasi/persetujuan.
4. Kredensial salah, registrasi duplikat dan lupa kata sandi tidak membocorkan akun.
5. Loading, kirim, gagal, offline, timeout, pembatasan, CSRF, kode kedaluwarsa,
   kode terkunci, resend, reset invalid/used/expired dan keberhasilan memiliki
   tindakan lanjut. Pengiriman ganda dicegah.
6. Tujuan kembali aman; autentikasi staf tetap terpisah dan tidak diubah.
7. Desktop, tablet, ponsel 320px dan landscape tidak overflow/menutup tindakan.
8. Semua gambar lokal benar-benar dirender; tidak ada URL aset Figma sementara.
