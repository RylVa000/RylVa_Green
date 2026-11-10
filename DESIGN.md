---
version: 1.1
name: RylVa Green
description: Sistem desain toko botani yang hangat, jelas, dan mudah digunakan; menggunakan Poppins di seluruh antarmuka serta palet hijau dan krem RylVa Green.
colors:
  primary-dark: "#0F2A1D"
  primary: "#375534"
  primary-light: "#6B9071"
  neutral-soft: "#AEC3B0"
  background: "#FBF7F4"
  card-background: "#F8F9FA"
  text-secondary: "#718096"
  product-card-background: "#CDCFCC"
typography:
  family: '"Poppins", Arial, sans-serif'
  hero: {fontSize: 48px, fontWeight: 700, lineHeight: 1.15}
  heading-lg: {fontSize: 36px, fontWeight: 700, lineHeight: 1.2}
  heading-md: {fontSize: 28px, fontWeight: 600, lineHeight: 1.25}
  heading-sm: {fontSize: 20px, fontWeight: 600, lineHeight: 1.3}
  body-lg: {fontSize: 18px, fontWeight: 400, lineHeight: 1.6}
  body: {fontSize: 16px, fontWeight: 400, lineHeight: 1.5}
  body-sm: {fontSize: 14px, fontWeight: 400, lineHeight: 1.5}
  caption: {fontSize: 12px, fontWeight: 500, lineHeight: 1.4}
  button: {fontSize: 14px, fontWeight: 600, lineHeight: 1.25}
rounded:
  sm: 8px
  md: 12px
  lg: 20px
  pill: 9999px
---

# RylVa Green

## Overview

RylVa Green adalah pengalaman belanja tanaman dan kebutuhan botani yang terasa alami, hangat, dan mudah dipahami. Latar krem `background` memberi ruang untuk fotografi tanaman; hijau `primary-dark` membentuk judul dan navigasi, sementara `primary` menuntun pengguna ke tindakan utama. Gunakan satu keluarga huruf Poppins untuk semua teks, dari judul hingga formulir.

Referensi visual mencakup halaman promosi, kontak, autentikasi, katalog, detail produk, keranjang, checkout, dan dialog alamat. Kartu produk khusus menampilkan foto di kiri dan informasi di kanan, dengan badge diskon, status tersedia, harga, favorit, tautan detail, dan aksi tambah keranjang. Dokumen ini menerjemahkan karakter dan susunan tersebut menjadi pedoman global, bukan mengklaim pengukuran persis dari berkas desain.

**Karakteristik utama:**
- Kanvas krem, hijau botani, fotografi produk nyata, dan bentuk membulat yang ramah.
- Hierarki jelas melalui ukuran, ketebalan, jarak, dan warna; tidak mengandalkan dekorasi berlebihan.
- Produk dan informasi perawatannya tetap menjadi fokus; setiap tindakan belanja diberi label yang jelas.
- Antarmuka menggunakan Bahasa Indonesia dan harga rupiah, misalnya `Rp 128.999 / pot`.
- Semua ukuran, breakpoint, state, dan resep yang tidak diberikan secara eksplisit di bawah adalah **usulan awal**, perlu diperiksa terhadap desain asli dan perangkat nyata.

## Colors

Delapan nilai ini adalah token warna brand yang mengikat. Gunakan nama token, bukan warna yang mirip atau nilai lama di `docs/design/archive/DESIGN.txt`. Warna teks di atas permukaan gelap memerlukan putih; merah pada contoh badge diskon adalah warna fungsional terbatas, bukan warna brand tambahan.

### Brand & Accent

- **Primary Dark** (`primary-dark`, `#0F2A1D`): judul utama, teks penting, navbar utama dan komponen solid yang membutuhkan warna paling gelap.
- **Primary** (`primary`, `#375534`): CTA, navigasi aktif, tautan penting dan aksen brand.
- **Primary Light** (`primary-light`, `#6B9071`): garis komponen, hover ringan, ikon dan badge sekunder. Jangan menggunakannya sebagai teks kecil di atas latar terang tanpa menguji kontras.
- **Neutral Soft** (`neutral-soft`, `#AEC3B0`): divider, batas tenang, dan ikon sekunder yang tidak membawa informasi sendirian.

### Surface

- **Background** (`background`, `#FBF7F4`): latar dasar halaman dan area konten umum.
- **Card Background** (`card-background`, `#F8F9FA`): permukaan kartu dan kontainer checkout.
- **Product Card Background** (`product-card-background`, `#CDCFCC`): bingkai foto produk, agar tanaman dan pot terlihat jelas.
- Putih (`#FFFFFF`): teks atau ikon pada permukaan gelap bila dibutuhkan untuk kontras. Foto dan logo mempertahankan warna aslinya.

### Text & Borders

- Gunakan `primary-dark` untuk teks utama, nama produk, harga, dan label penting.
- **Text Secondary** (`text-secondary`, `#718096`): deskripsi, metadata, dan placeholder. Untuk teks kecil atau informasi penting, periksa kontras; gunakan `primary-dark` bila kombinasi tidak memenuhi kebutuhan aksesibilitas.
- Gunakan `neutral-soft` sebagai divider dan `primary-light` untuk batas komponen. Batas input dan focus ring harus cukup terlihat terhadap latarnya.
- Jangan menyampaikan status hanya melalui warna; sertakan teks dan, jika sesuai, ikon.

### Component & State Colors

- CTA utama: `primary` dengan teks putih; hover menggunakan `primary-dark`. Status aktif memakai `primary-dark` atau penanda lain yang jelas.
- Badge tersedia: permukaan `primary` dengan teks putih. Warna `primary-light` dapat digunakan sebagai batas atau aksen, bukan sebagai pengganti teks status.
- Badge diskon: merah pada referensi (`#FF0000`) dibatasi untuk promosi. Teks putih pada merah ini hanya sekitar 4:1, sehingga gunakan teks besar minimal 18pt normal atau 14pt tebal dan uji kontras; untuk teks kecil pilih kombinasi yang memenuhi 4,5:1 setelah ditetapkan. Harga lama dicoret dan tetap dapat dibaca.
- Untuk pesan semantik, gunakan pola dan kombinasi warna terbatas pada bagian Feedback & Empty State. Warna diskon tetap khusus promosi.
- Status disabled harus jelas dan tidak menyerupai tombol aktif. Jangan mengandalkan opacity saja untuk menjelaskan alasan suatu aksi tidak tersedia.

### Gradients

Tidak ada gradien brand yang ditetapkan. Foto hero boleh memakai overlay bila diperlukan agar teks tetap terbaca; periksa kontras pada seluruh area teks.

## Typography

### Font Family

Gunakan `font-family: "Poppins", Arial, sans-serif` untuk seluruh teks, termasuk form, tombol, label, harga, navigasi, dan footer. Poppins adalah satu-satunya keluarga desain; Arial dan `sans-serif` hanya fallback saat font gagal dimuat. Sediakan Poppins dengan dukungan karakter Bahasa Indonesia dan bobot 400, 500, 600, serta 700. Hindari Inter dan Plus Jakarta Sans.

### Hierarchy

| Token | Ukuran | Bobot | Line height | Penggunaan |
|---|---:|---:|---:|---|
| `hero` | 48px | 700 | 1.15 | Judul utama hero desktop |
| `heading-lg` | 36px | 700 | 1.2 | Judul halaman atau bagian besar |
| `heading-md` | 28px | 600 | 1.25 | Judul bagian dan nama produk menonjol |
| `heading-sm` | 20px | 600 | 1.3 | Judul kartu atau kelompok formulir |
| `body-lg` | 18px | 400 | 1.6 | Pengantar atau deskripsi utama |
| `body` | 16px | 400 | 1.5 | Paragraf dan isian formulir |
| `body-sm` | 14px | 400 | 1.5 | Metadata, navigasi dan bantuan |
| `caption` | 12px | 500 | 1.4 | Badge dan keterangan pendek |
| `button` | 14px | 600 | 1.25 | Tombol dan aksi |

Skala ini adalah titik awal implementasi, bukan hasil pengukuran dari mockup. Di layar kecil, hero dapat turun ke 32px dan judul bagian ke 24px. Hindari teks panjang dalam ukuran caption. Harga harus lebih menonjol daripada harga lama dan satuan.

### Principles

- Gunakan bobot 700 untuk judul utama, 600 untuk penekanan atau label, dan 400 untuk bacaan.
- Gunakan line height yang nyaman; jangan memadatkan deskripsi agar muat pada kartu.
- Hindari huruf kapital seluruhnya untuk paragraf atau label panjang.
- Isi placeholder bukan pengganti label form. Teks, harga, dan status harus tetap terbaca saat font fallback digunakan.

## Layout

### Spacing System

Sebagai usulan, gunakan kelipatan 4px: `4`, `8`, `12`, `16`, `24`, `32`, `48`, dan `64px`. Jarak antarkelompok informasi lebih besar daripada jarak di dalam kelompok. Padding kartu awal 16–24px; jarak antarbagian desktop 48–64px dan mobile 32–48px. Ukuran ini perlu disesuaikan setelah diuji pada desain dan isi nyata.

### Grid & Container

- **Desktop:** konten terpusat dengan lebar maksimum usulan 1200px, margin samping 24–32px, dan jarak grid 24px. Katalog dapat menggabungkan sidebar filter dengan grid kartu.
- **Tablet:** kurangi jumlah kolom dan pindahkan filter ke panel yang bisa dibuka bila ruang tidak cukup.
- **Mobile:** margin samping 16px, susunan satu kolom untuk konten yang kompleks, serta kontrol yang mudah dijangkau. Jangan memaksa kartu horizontal bila teks atau tombol menjadi terlalu sempit.
- Hero dan banner memadukan foto tanaman dengan judul dan CTA. Bagian kategori, keunggulan, dan produk populer mengikuti urutan visual mockup.
- Detail produk menempatkan galeri dan informasi pembelian berdampingan di desktop; pada mobile ditumpuk. Keranjang dan checkout menempatkan ringkasan di samping pada desktop dan dalam alur baca pada mobile.

### Whitespace Philosophy

Gunakan ruang kosong untuk membedakan navigasi, konten, dan aksi tanpa memisahkan informasi yang saling berkaitan. Pertahankan kepadatan yang cukup untuk katalog dan checkout; jangan membuat pengguna harus menggulir berlebihan untuk melihat harga dan tindakan.

## Elevation & Depth

Utamakan permukaan datar, perbedaan warna, dan batas tipis. Hindari bayangan berat dan efek blur dekoratif. Dialog dapat memakai overlay gelap yang cukup untuk membedakan latar, dengan kontras teks tetap terjaga. Hierarki bukan bergantung pada bayangan.

## Shapes

### Border Radius Scale

| Token | Usulan | Penggunaan |
|---|---:|---|
| `sm` | 8px | Input, badge diskon, bidang kecil |
| `md` | 12px | Foto produk, panel, dan kartu umum |
| `lg` | 20px | Kartu produk utama dan panel besar |
| `pill` | 9999px | Badge ketersediaan dan tombol berbentuk pil |
| Circle | 50% | Tombol ikon favorit dan keranjang |

Kartu khusus pada referensi memakai sudut luar yang lebih besar daripada bidang gambar. Nilai di atas adalah usulan, bukan hasil ukur sumber.

## Components

### Button

**Anatomi:** label singkat, ikon opsional, dan area klik yang cukup besar. Gunakan elemen `<button>` untuk aksi dan `<a>` untuk navigasi.

- **Primary:** latar `primary`, teks putih, radius pil atau 12px sesuai konteks; hover `primary-dark`.
- **Secondary:** latar transparan atau `card-background`, batas dan teks `primary`; hover dengan batas atau latar yang tetap menjaga kontras.
- **Icon:** lingkaran untuk favorit dan tambah keranjang. Beri nama aksesibel seperti “Tambah ke keranjang” atau “Tambah ke favorit”; ikon hati yang aktif harus memiliki state yang jelas.
- **Focus:** tampilkan ring yang terlihat, termasuk saat digunakan dengan keyboard. **Disabled:** tampilkan label dan alasan yang relevan; jangan membuat aksi terlihat aktif.
- Ukuran awal tombol minimal 44 × 44px untuk area sentuh; tombol utama dapat setinggi 48px.

### Product Card — kartu khusus

**Anatomi desktop:**
1. Container membulat dengan latar `card-background`.
2. Frame gambar di kiri dengan `product-card-background`; foto produk menggunakan `object-fit: contain` agar tanaman dan pot utuh. Badge diskon berada di kiri atas gambar jika ada diskon.
3. Kolom kanan: nama produk dan badge ketersediaan di baris atas; deskripsi ringkas di bawahnya.
4. Harga lama dicoret jika ada diskon, lalu harga saat ini dan satuan; ikon favorit sejajar dengan area harga.
5. Divider di atas baris aksi. Tautan “Detail Produk” berada di kiri, tombol tambah keranjang berbentuk lingkaran di kanan.

Nama, harga, satuan, dan ketersediaan berasal dari data produk aktual. Jangan menampilkan harga lama, diskon, atau badge tersedia jika data tidak mendukungnya. Gambar memiliki teks alternatif yang menjelaskan produk; ikon dekoratif disembunyikan dari pembaca layar. Nama produk dapat membungkus tanpa menindih badge. Tombol terpisah tidak boleh ditempatkan di dalam tautan lain.

**State:** tanpa diskon menyembunyikan badge dan harga lama; produk habis stok menampilkan teks status dan menonaktifkan pembelian dengan penjelasan; favorit memiliki state terpilih; gambar gagal dimuat menampilkan placeholder yang teridentifikasi. Pada lebar sempit, ubah ke susunan vertikal jika diperlukan, pertahankan urutan informasi serta area sentuh.

**Resep awal CSS:**

```css
:root {
  --primary-dark: #0F2A1D;
  --primary: #375534;
  --primary-light: #6B9071;
  --neutral-soft: #AEC3B0;
  --background: #FBF7F4;
  --card-background: #F8F9FA;
  --text-secondary: #718096;
  --product-card-background: #CDCFCC;
  --font-sans: "Poppins", Arial, sans-serif;
}
.product-card {
  display: grid;
  grid-template-columns: minmax(140px, 36%) minmax(0, 1fr);
  gap: 24px;
  padding: 20px;
  border-radius: 20px;
  background: var(--card-background);
  color: var(--primary-dark);
  font-family: var(--font-sans);
}
.product-card__media {
  position: relative;
  border-radius: 12px;
  background: var(--product-card-background);
}
.product-card__image { display: block; width: 100%; height: 100%; object-fit: contain; }
.product-card__actions { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--neutral-soft); }
@media (max-width: 480px) {
  .product-card { grid-template-columns: 1fr; gap: 16px; }
  .product-card__media { aspect-ratio: 4 / 3; }
}
```

Resep ini menggambarkan susunan, bukan ukuran terverifikasi atau implementasi lengkap. Aksi, label aksesibel, state, dan data tetap harus diterapkan dalam markup aplikasi.

### Navigation & Header

Header menampilkan logo RylVa Green, tautan utama, dan akses ke akun atau belanja. Storefront pada mockup memakai navbar hijau dengan pencarian, menu kategori, serta ikon belanja. Gunakan `primary-dark` untuk area navigasi solid dengan teks dan ikon putih; tampilkan indikator halaman aktif selain perubahan warna. Pada mobile, ringkas navigasi menjadi menu yang berlabel, sambil mempertahankan akses pencarian dan keranjang. Logo harus memiliki teks alternatif yang sesuai dan menuju halaman utama.

### Footer

Footer adalah bidang hijau dengan identitas brand, kelompok tautan, dan informasi kontak yang tersedia. Teks pada bidang gelap berwarna putih dan harus terbaca. Kelompokkan tautan secara logis; pada layar kecil susun vertikal. Jangan membuat alamat, jam operasional, atau tautan sosial yang belum diverifikasi.

### Forms & Authentication

Form memakai label permanen, input yang dapat dikenali, teks bantuan, dan pesan kesalahan dekat field. Input berukuran sentuh, memiliki focus ring, dan tetap terbaca saat terisi. Halaman login dan daftar dalam mockup memadukan blok hijau dengan foto tanaman; alur lupa kata sandi memakai panel terpusat. Sertakan opsi melihat kata sandi dengan label aksesibel bila fitur tersedia. Jangan mengandalkan placeholder sebagai instruksi.

### Catalog & Product Detail

Katalog menyediakan pencarian, kategori, filter, dan pengurutan sesuai fitur yang benar-benar tersedia. Tampilkan jumlah atau kondisi kosong secara jelas; filter aktif harus dapat dihapus. Detail produk menampilkan galeri, nama, harga, pilihan varian, stok, deskripsi, panduan perawatan, pengiriman, dan CTA sesuai data. Komponen accordion harus memiliki label dan state terbuka yang dapat dikenali keyboard dan pembaca layar.

### Cart, Checkout & Dialog

Keranjang menampilkan produk, varian, harga, kuantitas, dan ringkasan; kondisi kosong memberi jalan kembali ke katalog. Checkout mengelompokkan alamat, pengiriman, produk, pembayaran, dan rincian biaya. Jelaskan perubahan harga atau stok sebelum pelanggan melanjutkan. Dialog alamat memiliki judul, tombol tutup, kontrol keyboard, focus yang terkelola, serta kembali ke pemicu saat ditutup. Data biaya dan ketersediaan harus diperbarui dari sistem, bukan contoh statis.

### Feedback & Empty State

Sediakan pesan sukses, kesalahan, loading, dan keadaan kosong dengan bahasa singkat dan tindakan selanjutnya yang relevan. Status pemesanan, pembayaran, dan pengiriman ditampilkan terpisah sesuai data aktual. Jangan memakai warna atau ikon sebagai satu-satunya petunjuk.

### Feedback & Empty State — resep semantik

Gunakan delapan token brand yang ada, tanpa menambah warna brand baru. Varian berikut sengaja memakai bentuk, ikon, judul, dan label yang berbeda sehingga makna tetap jelas meskipun warnanya serupa. Ukuran dan komposisi merupakan usulan awal.

| Varian | Tampilan pada `card-background` | Isi dan tindakan |
|---|---|---|
| Sukses | Ikon centang dan garis `primary`; teks `primary-dark` | Jelaskan hasil yang benar-benar terkonfirmasi, misalnya “Alamat berhasil disimpan”. |
| Informasi / menunggu | Ikon informasi atau jam, garis `neutral-soft`, teks `primary-dark` | Jelaskan apa yang sedang terjadi dan langkah selanjutnya; jangan menyebut transaksi berhasil sebelum terverifikasi. |
| Peringatan | Ikon segitiga, garis `primary-dark`, judul “Perlu perhatian” | Jelaskan dampak dan tindakan, misalnya stok berubah. Gunakan teks eksplisit, bukan warna saja. |
| Kesalahan | Ikon silang, garis `primary-dark`, judul yang menyebut masalah | Jelaskan cara memperbaiki dan pertahankan input. Pesan server harus aman dan tidak menampilkan detail teknis. |
| Kosong | Ikon atau ilustrasi sederhana, judul dan penjelasan | Bila relevan, sediakan satu tindakan yang masuk akal. Bedakan data kosong dari hasil filter kosong. |
| Memuat | Placeholder atau indikator dan teks “Memuat…” | Jangan tampilkan informasi rekaan; umumkan perubahan status yang relevan kepada pembaca layar. |

Pesan kesalahan field muncul tepat di bawah field dan terhubung secara aksesibel; jika banyak kesalahan, tampilkan ringkasan yang dapat membawa fokus ke field. Pesan penting tetap terlihat sampai diselesaikan. Notifikasi singkat boleh hilang otomatis hanya jika informasi dan tindakannya tetap tersedia di tempat lain. Gunakan `role="alert"` untuk kesalahan mendesak dan `aria-live="polite"` untuk pembaruan biasa, tanpa mengganggu pembaca layar secara berlebihan.

### Status dan Badge Transaksi

Badge status memakai label teks, bentuk pil, padding awal 4px 8px, dan bobot 600. Teks `primary-dark` pada `card-background` dengan batas `neutral-soft` adalah pilihan dasar; untuk status positif, `primary` dengan teks putih dapat digunakan setelah kontras diuji. Ikon melengkapi label, bukan menggantikannya. Nama status berikut adalah contoh tampilan, bukan daftar lengkap atau aturan transisi.

| Dimensi | Contoh label | Penyajian |
|---|---|---|
| Pesanan | Menunggu, diproses, selesai, dibatalkan | Badge dengan nama dimensi “Pesanan”; tampilkan tindakan yang diizinkan oleh server. |
| Pembayaran | Menunggu, berhasil, gagal, kedaluwarsa, perlu ditinjau | Badge terpisah berlabel “Pembayaran”; informasi metode dan batas waktu berada di dekatnya. |
| Pengiriman | Menunggu, dalam pengiriman, terkirim, terkendala | Badge berlabel “Pengiriman” dan tautan ke linimasa bila tersedia. |
| Refund | Diajukan, diproses, selesai, ditolak | Tampilkan status refund dan nominal secara terpisah dari pembatalan. |
| Stok | Tersedia, stok terbatas, habis | Untuk stok terbatas tampilkan jumlah sesuai spesifikasi; untuk habis jelaskan bahwa pembelian tidak tersedia. |
| Komplain | Diajukan, ditinjau, selesai | Tampilkan status dan tindakan berikutnya berdasarkan data aktual. |

Label dan nilai status yang sah mengikuti spesifikasi dan data server, bukan tabel contoh ini. Jangan menyamakan pesanan dikonfirmasi dengan pembayaran berhasil: pada COD pembayaran tetap menunggu sampai terkonfirmasi. Jangan memberi pengguna kendali mengubah status pembayaran hanya dengan mengedit badge. Tanggal dan waktu tampil dalam WIB, harga dalam rupiah tanpa desimal.

### Shell Admin dan SuperAdmin

Desktop menggunakan sidebar navigasi, header berisi identitas peran dan akses akun, serta area konten utama. Kelompokkan menu berdasarkan pekerjaan: ringkasan, katalog, pesanan/pengiriman, stok/bahan, laporan, dan pengaturan sesuai kewenangan. Tandai lokasi aktif dengan teks, bentuk atau garis selain warna. Pada mobile, sidebar menjadi menu yang dapat dibuka dengan keyboard dan memiliki tombol tutup serta focus yang terkelola; jangan menyembunyikan akses ke tugas utama.

Dashboard menampilkan judul, periode bila relevan, kartu ringkasan pesanan, pembayaran, stok rendah, dan daftar tugas yang perlu tindakan. Setiap angka harus memiliki label, konteks periode, dan tautan ke rincian bila tersedia. Tampilkan kosong atau gagal dimuat secara jelas; jangan membuat angka contoh sebagai data operasional. Hindari grafik dekoratif yang tidak membantu tindakan.

Login staf terpisah dari pelanggan dan tanpa login Google. Sediakan layar kata sandi, verifikasi MFA, kesalahan, serta pemulihan sesuai prosedur yang ditetapkan spesifikasi. Tampilkan fitur SuperAdmin hanya sesuai kewenangan; penyembunyian kontrol di UI tidak menggantikan otorisasi server.

### Tabel, Filter & Pagination

**Anatomi:** judul dan penjelasan singkat, aksi utama, pencarian dan filter berlabel, ringkasan filter aktif, tabel dengan header kolom, lalu pagination. Untuk daftar produk, tampilkan identitas produk/SKU, kategori, harga, stok, status, dan aksi yang sesuai. Untuk pesanan, tampilkan nomor, waktu, pelanggan seperlunya, total, serta status terpisah. Gunakan elemen tabel semantik, header kolom yang benar, dan label untuk setiap tombol ikon.

- Desktop: kolom penting terbaca, angka dan harga sejajar kanan, nama serta status sejajar kiri. Urutkan hanya kolom yang didukung; tunjukkan arah urutan secara tekstual atau aksesibel.
- Tablet/mobile: gunakan kartu per baris untuk daftar yang lebih sederhana, atau wadah tabel dengan scroll horizontal yang terlihat dan dapat digunakan keyboard. Pertahankan relasi label dan nilai; jangan menghilangkan informasi atau aksi penting.
- Filter menyediakan nilai saat ini, tombol terapkan jika tidak otomatis, dan hapus filter. Bedakan “belum ada data” dari “tidak ada hasil filter”.
- Pagination menyebut halaman saat ini dan menyediakan tombol sebelumnya/berikutnya dengan state disabled yang jelas. Jumlah total ditampilkan hanya jika tersedia dan akurat.
- Sediakan loading, kosong, gagal, dan hasil pencarian. Setelah perubahan data, pertahankan konteks pengguna bila memungkinkan dan umumkan hasil.

### Form Produk dan Varian

Kelompokkan form menjadi data dasar; kategori dan atribut; varian/SKU dan satuan; harga; gambar; berat dan dimensi; status; serta stok atau bahan sesuai kewenangan. Setiap kelompok punya judul, label permanen, bantuan satuan dan format, penanda wajib, serta pesan validasi yang spesifik. Gunakan kontrol yang sesuai untuk angka, pilihan kategori, dan unggah gambar; tampilkan pratinjau gambar, alternatif teks, dan cara menghapus atau mengganti.

Varian harus mudah dibedakan dengan kombinasi atribut dan SKU; tampilkan harga, satuan, dan stok yang relevan per varian tanpa mengasumsikan semua varian sama. Perubahan yang memengaruhi produk aktif memerlukan penjelasan dampak sesuai data dan aturan sistem. Validasi server tetap menentukan hasil; bila penyimpanan gagal, pertahankan masukan dan tampilkan kesalahan. Jika pengguna meninggalkan form yang berubah dan belum tersimpan, minta konfirmasi kehilangan perubahan. Jangan menjanjikan penyimpanan otomatis bila fitur belum ada.

### Konfirmasi Tindakan dan Audit

Untuk tindakan yang berdampak seperti pembatalan, penyesuaian stok, refund, dan perubahan sensitif, tampilkan dialog dengan objek yang terpengaruh, dampak, alasan bila diwajibkan, serta tombol batal dan tindakan yang dinamai jelas. Konfirmasi ulang kata sandi atau MFA dilakukan bila diwajibkan spesifikasi; jangan menganggap dialog sebagai pengganti otorisasi server. Cegah pengiriman ganda dan tampilkan hasil sebenarnya, termasuk kegagalan atau konflik data.

Riwayat audit menampilkan waktu WIB, pelaku, tindakan, objek, dan rincian yang diizinkan. Sediakan filter yang relevan dan lindungi data sensitif; tidak ada kontrol edit atau hapus untuk audit log. Komplain dan refund menunjukkan bukti dan keputusan sesuai peran; jangan menyediakan persetujuan sendiri yang dilarang spesifikasi.

### Pembayaran, Pesanan & Pelacakan

**Hasil checkout:** tampilkan nomor pesanan, status pesanan dan pembayaran secara terpisah, nominal, metode, langkah berikutnya, serta akses ke detail pesanan. Untuk pembayaran menunggu, tampilkan instruksi dan batas waktu dari server. Hitung mundur hanya membantu visual; server menentukan kedaluwarsa. Sediakan keadaan berhasil terverifikasi, gagal, kedaluwarsa, dan perlu ditinjau tanpa mengklaim hasil sebelum konfirmasi. Bukti pelunasan hanya tersedia setelah pembayaran terverifikasi.

**Detail pesanan:** tampilkan snapshot item, varian, harga, alamat, pengiriman, total, serta status masing-masing. Tindakan seperti pembatalan atau komplain hanya muncul jika diizinkan, dengan alasan, lampiran, dan tenggat sesuai spesifikasi. Untuk COD, pesanan dapat dikonfirmasi saat pembayaran masih menunggu.

**Linimasa:** daftar vertikal berurutan berisi waktu WIB, nama kejadian, dan informasi kurir atau resi bila tersedia. Tandai kejadian saat ini secara visual dan teks; jangan membuat tahap yang belum terjadi sebagai fakta. Tampilkan kendala dan bukti serah/terima hanya bila tersedia dan sesuai hak akses. Linimasa tidak menggantikan label status saat ini.

### Kustomisasi Buket

Gunakan urutan yang jelas: pilih opsi per kategori, tinjau pilihan dan pratinjau jika tersedia, lihat rincian tambahan harga, lalu tambahkan konfigurasi yang valid ke keranjang. Tampilkan pilihan aktif, opsi tidak kompatibel beserta alasannya, satuan dan biaya tambahan berdasarkan data aktual. Ringkasan konfigurasi dan harga mengikuti produk sampai checkout sebagai snapshot sesuai spesifikasi. Sediakan state belum lengkap, tidak kompatibel, stok berubah, dan gagal menambahkan; jangan membuat pratinjau atau harga palsu.

### Profil, Bantuan & Error

Profil dan alamat memiliki label, validasi, pilihan alamat utama jika tersedia, serta konfirmasi sebelum tindakan yang berdampak. Wishlist hanya ditampilkan jika diaktifkan. FAQ dan panduan perawatan menggunakan struktur judul dan accordion yang dapat diakses; konten harus diverifikasi. Halaman 403, 404, 429, 500, dan produk tidak tersedia memberi penjelasan yang aman serta tindakan relevan tanpa stack trace atau detail internal. Halaman 429 mengikuti waktu coba kembali dari server bila tersedia.

### Pemeriksaan Implementasi dan Kontras

- Uji teks normal minimal 4,5:1, teks besar minimal 3:1, dan batas/indikator kontrol serta focus minimal 3:1 terhadap warna bersebelahan. Uji pada kombinasi aktual, termasuk overlay foto; nilai token tidak otomatis menjamin kontras.
- Jangan gunakan `text-secondary` atau `primary-light` untuk teks penting jika tidak lolos; gunakan `primary-dark` di permukaan terang atau putih di permukaan gelap. Placeholder bukan satu-satunya informasi.
- Uji focus terlihat, urutan keyboard, label ikon, state accordion/dialog, pengumuman error, dan kemampuan zoom. Setiap kontrol sentuh setidaknya 44 × 44px sebagai target desain.
- Untuk setiap layar P0, tinjau desktop, tablet, dan mobile serta state loading, kosong, validasi, sukses, error, dan data panjang. Uji alur transaksi dengan data sebenarnya dan aturan spesifikasi.

## Do's and Don'ts

### Do

- Gunakan delapan token warna persis sesuai nilai yang ditetapkan dan Poppins untuk seluruh teks.
- Pertahankan susunan kartu produk khusus dan hierarki nama, status, harga, serta aksi.
- Gunakan fotografi tanaman yang jelas dan data produk yang benar.
- Jaga teks, kontrol, focus, dan pesan status tetap terbaca dan dapat digunakan dengan keyboard.
- Cocokkan harga, stok, pengiriman, dan status dengan data sistem serta spesifikasi produk.

### Don't

- Jangan gunakan Inter atau Plus Jakarta Sans, atau menambahkan keluarga huruf desain kedua.
- Jangan mengganti warna token dengan warna yang mendekati atau menggunakan nilai hitam dari panduan lama sebagai `primary-dark`.
- Jangan mengisi kartu dengan badge diskon, klaim, atau status ketersediaan yang tidak didukung data.
- Jangan menggunakan warna saja untuk mengomunikasikan stok, kesalahan, atau pilihan aktif.
- Jangan memaksakan ukuran mockup desktop pada layar kecil atau memotong informasi penting.

## Responsive Behavior

Breakpoint awal yang dapat diuji: hingga 480px untuk susunan kartu vertikal, sekitar 768px untuk perubahan grid dan navigasi, dan sekitar 1024px untuk sidebar serta layout desktop. Nilai ini usulan, bukan breakpoint yang terukur dari mockup.

- **Desktop:** navigasi penuh; filter dan produk berdampingan; detail dan ringkasan checkout dapat berada dalam dua kolom.
- **Tablet:** grid menyesuaikan lebar; filter dapat dibuka sebagai panel.
- **Mobile:** navigasi ringkas, kartu atau informasi bertumpuk, dan ringkasan mengikuti urutan baca. Pastikan tidak ada scroll horizontal.
- Semua kontrol interaktif memiliki target sentuh minimal 44 × 44px, focus terlihat, dan teks tetap dapat diperbesar tanpa kehilangan fungsi.

## Iteration Guide

1. Mulai dari token warna dan Poppins di front matter; jangan menyalin warna atau keluarga huruf dari contoh IKEA.
2. Pilih skala teks, jarak, dan radius sesuai hierarki konten; perlakukan ukuran yang diusulkan sebagai titik awal.
3. Susun halaman berdasarkan mockup, lalu utamakan kartu produk khusus untuk konteks katalog yang sesuai.
4. Uji data nyata: nama panjang, harga tanpa diskon, produk habis, foto gagal, dan keranjang kosong.
5. Periksa keyboard, label, kontras, ukuran sentuh, serta tampilan mobile dan desktop sebelum merilis perubahan.
6. Jika visual dan aturan bisnis bertentangan, ikuti spesifikasi bisnis proyek; catat keputusan desain baru di dokumen global ini.

## Known Gaps

- Mockup berupa gambar keseluruhan, bukan file desain dengan ukuran, token, atau state yang dapat diinspeksi; ukuran dan breakpoint belum terverifikasi.
- Kartu khusus ditampilkan sebagai contoh produk. Warna bidang gambar dan permukaan kartu mengikuti token eksplisit pengguna meskipun tampilan gambar referensi dapat terlihat berbeda.
- Merah badge diambil dari contoh visual dan dibatasi untuk diskon. Pola semantik menggunakan token brand dan label; warna khusus error dan warning belum ditetapkan sebagai token tambahan.
- Kontras `text-secondary` dan `primary-light` perlu diuji pada setiap kombinasi latar dan ukuran teks. Pilih `primary-dark` bila perlu agar teks memenuhi kontras.
- Aset final, logo, fotografi, isi produk dan perawatan, serta detail interaksi memerlukan verifikasi. Referensi ini tidak membuktikan fitur telah diimplementasikan.
- Dokumen ini adalah acuan desain global terbaru dan menggantikan nilai yang bertentangan dalam `docs/design/archive/DESIGN.txt`; spesifikasi bisnis tetap mengikuti `docs/specifications/spesifikasi-proyek-v2.6.md`.
