# Koleksi Baru, Promo Spesial, Mitra Florist

Jenis bisnis: place, toko tanaman. Ekstensi sistem storefront yang dipin.
Koleksi/promo: mode Operate; Mitra Florist: mode Read. Publik tanpa akun.

## Direction contract

**THESIS:** Temukan produk dalam koleksi yang dipilih; pembaca kemitraan
memahami informasi yang perlu disampaikan lalu menghubungi RylVa Green.

**OWN-WORLD:** Poppins dan token hijau/krem existing, shell dan kartu Katalog,
native filter/sort sheet, tombol pil dan banner informasi berjudul di tengah.

**STORY:** Koleksi/promo: breadcrumb/judul/keterangan, filter dan urutan, hasil,
produk serta pemulihan. Mitra: breadcrumb/judul, maksud halaman, informasi usaha
yang dapat disiapkan, cara menghubungi, FAQ, jalur kontak di tengah.

**FIRST VIEWPORT:** Koleksi/promo memakai banner hijau dan awal Katalog existing,
bukan hero iklan penuh layar. Filter desktop dan dua kartu horizontal per baris
pada layar besar; ponsel memakai sheet existing. Mitra mengikuti artikel informasi
dengan daftar isi desktop dan disclosure mobile, tanpa foto mitra atau logo buatan.

**FORM:** seed: none (pinned extension). Pengguna meminta mempertahankan
"identitas visual, tipografi, warna, spacing, ikon, dan pola interaksi" serta
memakai kembali komponen. Untuk Mitra pengguna memilih "Informasi kerja sama
dan kontak" pada 20 November 2026. Tidak ada konsep/tema/comp baru.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Kebenaran data dan batas

Baseline D-09 hanya mengizinkan diskon produk dengan periode, tanpa voucher.
Harga contoh existing bukan bukti promo produksi aktif. Koleksi baru belum
memiliki metadata tanggal penambahan/kurasi produksi. Adapter contoh memilih
anggota koleksi secara eksplisit tanpa tanggal/urutan terbaru fiktif. Promo
menampilkan harga contoh yang lebih rendah daripada harga dasar, tanpa periode
atau countdown buatan. Keterangan pratinjau jelas di setiap halaman.

Mitra memakai jalur email/Kontak existing. Tidak menambah biaya, syarat program,
daftar mitra, benefit, jaminan penerimaan, tenggat balasan atau endpoint pengajuan.
Email membuka aplikasi pengguna untuk menyiapkan pesan, bukan bukti terkirim.

## Perilaku dan pemeriksaan

Reset tetap dalam koleksi/promo; filter tidak mengubah identitas halaman.
Harga/stock/Wishlist/cart, Detail/Back dan konteks memakai Katalog existing.
Navigasi ketiga tujuan menjadi tautan native dari shell; global search pada
Mitra tetap Katalog, search koleksi/promo mencari koleksi yang sedang dibuka.

State: loading/error/retry/offline/timeout/maintenance, kosong vs tanpa hasil,
harga invalid/partial, foto gagal/teks panjang, produk tidak tersedia, aksi
keranjang gagal/konflik/rate limit sesuai adapter existing; promo tanpa periode
aktif diuji di workbench terpisah. Mitra native/read-only/FAQ tanpa proses data.
Tidak membuat state login/mutasi/simpan/konflik palsu pada halaman informasi.

Target 1440/1024/768/390/320, keyboard/sheet/fokus, search/filter/Reset, navigasi
lintas halaman, shopping dan Back. PRODUCT.md dan DESIGN.md dipertahankan.
