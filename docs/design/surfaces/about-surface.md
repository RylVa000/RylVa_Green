# Tentang Kami

19 November 2026. **Read**, ekstensi halaman informasi storefront dalam dunia visual yang sudah ditetapkan. Jenis bisnis **place**, toko tanaman/florist RylVa Green. Aksi utama **Jelajahi Katalog**. Publik dapat membaca tanpa akun; kewenangan halaman tujuan tetap berlaku.

## Sumber dan batas fakta

PRODUCT.md: nama, tujuan, pengguna pemula/pecinta tanaman, florist, buket kustom dan perlengkapan berkebun; komitmen informasi yang mudah dipahami. DESIGN.md serta halaman informasi aktif menetapkan Poppins, hijau/cream, header/footer, banner terpusat dan pola baca. Kategori dan route mengikuti Katalog serta peracik buket yang tersedia.

Tidak ditemukan naskah Tentang Kami, frame khusus, tanggal pendirian, profil pendiri/tim, alamat nursery terverifikasi, metrik, testimoni, sertifikasi, atau fotografi tempat/tim milik merek. Tidak membuat sejarah, klaim jaminan, statistik maupun foto representasi toko palsu. Copy profil ditulis dari tujuan produk; komitmen yang belum terbukti dinyatakan sebagai tujuan, bukan prestasi operasional. Tidak menggunakan foto contoh produk sebagai bukti kebun/tim. Tidak ada kebutuhan raster baru untuk artikel profil ini.

## Direction contract

**THESIS:** Pengunjung mengenali apa itu RylVa Green, untuk siapa pilihannya, dan ke mana harus menuju untuk menjelajah atau bertanya. Isi mendahulukan profil faktual dan bantuan memilih.

**OWN-WORLD:** Sistem informasi existing: Poppins, kanvas cream, banner hijau dengan teks putih, breadcrumb kiri, tombol pill putih/outline di tengah banner. Sidebar tenang dan artikel berlebar baca yang sama dengan panduan lain; koleksi berupa daftar deskripsi bergaris, tanpa kartu ikon dekoratif.

**STORY:** Kenali merek, temukan kebutuhan yang sesuai, jelajahi koleksi, pahami informasi belanja, dan akses bantuan. Tidak ada angka pencapaian, janji cakupan pengiriman atau klaim produksi yang dibuat-buat.

**FIRST VIEWPORT:** Shell tetap, breadcrumb Beranda/Tentang Kami, H1 putih di tengah, pengantar singkat serta Jelajahi Katalog dan Hubungi Kami di tengah dalam banner. Daftar isi dan profil mengikuti di bawah. Mobile memakai satu kolom, disclosure dan tombol bertumpuk.

**FORM:** Ekstensi Read dalam pola yang sudah dipilih, `seed: none (pinned)`. Pengguna meminta “Pertahankan header, footer, sidebar, navigasi, dan bagian lain di luar cakupan” serta sebelumnya “tombolnya ditengah dan masuk container hijau”. Tidak mengganti tema atau menjalankan pemilihan konsep baru untuk pola yang sudah ditetapkan.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

DESIGN.md dipertahankan, dokumentasi cakupan mencatat kecocokan sistem. Tidak ada aset raster baru yang memerlukan provenance.

## Copy dan struktur yang akan diimplementasikan

Banner: **Tentang Kami**. “Kenali RylVa Green, pilihan tanaman, bunga, dan perlengkapan berkebun untuk ruang serta momen Anda.” Aksi Jelajahi Katalog dan Hubungi Kami.

1. **Tanaman, bunga, dan kebutuhan berkebun** (`kenali-rylva`). RylVa Green adalah ruang belanja tanaman hias, florist, buket kustom dan perlengkapan berkebun. Tujuannya membantu orang memilih produk yang sesuai, memahami perawatan dan memesan dengan informasi yang jelas. Tidak mengklaim umur usaha atau pencapaian.
2. **Untuk ruang dan momen Anda** (`untuk-anda`). Pecinta tanaman, pemula, serta pengguna yang ingin menghadirkan tanaman indoor pada ruang tinggal/kerja; pilihan bunga/buket sebagai hadiah. Periksa informasi tiap produk terhadap kebutuhan dan kondisi ruang, tanpa klaim kesehatan atau keamanan hewan.
3. **Pilihan di RylVa Green** (`pilihan-koleksi`). Enam baris deskripsi: Tanaman Hias → Katalog category=plants; Buket Bunga → category=bouquet; Buket Kustom → route peracik; Pot & Vas → category=pots; Media Tanam → category=media; Alat Berkebun → category=tools. Tidak memuat jumlah, stok atau harga statis buatan.
4. **Informasi sebelum Anda memilih** (`informasi-belanja`). Fokus merek pada informasi produk/perawatan yang dapat dipahami, rincian pilihan/harga/satuan sebelum pembelian, serta pengiriman sesuai karakter produk dan layanan yang tersedia. Tautan Cara Memesan serta Informasi Pengiriman.
5. **Terhubung dengan RylVa Green** (`bantuan-rylva`). Tautan Kontak dan FAQ nyata, serta Privasi/Syarat/Refund untuk memahami kebijakan. Tidak membuka formulir palsu atau mengirim pesan dari halaman profil.

## Interaksi, state dan akses

Gunakan pembaca `information-article.js`, TOC responsif, anchor/fokus, Back memulihkan posisi serta sumber kembali Katalog same-origin tervalidasi. Tambahkan wrapper `about.js`, CSS target `about.css`, route `/pages/public/about.html`, alias about-us.html/tentang-kami.html dan pemetaan footer. Current footer native pada halaman sendiri, tetap dapat dipakai tanpa JavaScript.

| State | Pemicu/tampilan | Pemulihan dan konteks |
| --- | --- | --- |
| Default/guest | Profil publik, seluruh isi dan tautan | Tidak memerlukan login untuk membaca |
| Bagian aktif | Scroll dua arah, satu link aktif dengan bobot/warna | Tidak mengubah fokus, URL atau history |
| TOC mobile | Native disclosure collapsed/expanded | Keyboard dan pulih setelah Back |
| Anchor | Klik/Enter/direct link | Heading fokus dengan ruang header |
| Fragmen lama | ID tak dikenal | Pembuka dan navigasi berikutnya tetap tersedia |
| Hover/fokus/active | Link dan tombol berlabel | Ring terlihat; reduced motion existing |
| Konten panjang | Heading/label/daftar panjang | Membungkus pada 320 px, tidak clipping |
| Tanpa script | Pembaca JS tidak tersedia | Teks, link dan anchor native tetap dapat dipakai |
| Kembali Katalog | Sumber sesuai allowlist | Pulih query/kategori/urutan/posisi melalui history |
| Tujuan akun | Guest menuju peracik | Guard tujuan dipertahankan, tanpa parameter bypass |

Tidak memaksakan error API, data kosong, loading palsu, formulir, rekening, konflik penyimpanan atau proses finansial pada artikel statis. Workbench dev terpisah menyediakan normal, anchor, fragmen lama, tanpa script dan teks panjang. Uji lima ukuran 1440/1024/768/390/320, link/footer, konteks, keyboard dan no-JS; review visual serta regresi reader. Label pratinjau tetap menjelaskan alur belanja contoh. Tidak ada commit/push/publikasi.
