# Kategori & Atribut — cakupan pratinjau

Halaman `public/pages/staff/categories-attributes.html` melengkapi area katalog untuk Admin dan SuperAdmin. Akses melalui menu **Kategori & Atribut** di bawah Produk & Varian. Profil pada URL hanya memilih tampilan; bukan otorisasi.

## Isi dan alur

- Daftar Kategori dan Atribut memakai tab, kartu ringkasan, banner penjelas, pencarian, filter status, urutan dan pagination. Filter langsung bekerja tanpa tombol Terapkan; Reset mengembalikan daftar awal.
- Detail selalu membuka Informasi di bagian atas. Tab Informasi, Pemakaian dan Aktivitas memakai lebar penuh. Kembali ke daftar mempertahankan pencarian dan halaman. Navigasi kembali browser mempertahankan perubahan selama dokumen tidak dimuat ulang.
- Kategori dapat ditambah, diedit, dinonaktifkan dan dihapus jika memenuhi batas pemakaian. Formulir mencakup nama, slug, induk, urutan dan deskripsi. Produk dapat memiliki beberapa kategori.
- Atribut mencakup nama, kode, tipe Teks/Angka/Pilihan, fungsi deskriptif/pembeda varian, kategori terkait dan status. Pilihan terkontrol dikelola dari detail atribut. Definisi pembeda varian tidak membuat SKU secara otomatis.
- Alasan perubahan wajib diisi saat mengubah atau menghapus definisi yang ada. Aktivitas lokal menampilkan alasan, waktu WIB dan aktor contoh. Ini bukan rekam audit produksi.
- Perubahan belum disimpan dilindungi saat menutup dialog, menekan Escape atau meninggalkan halaman. Kegagalan simpan contoh mempertahankan formulir dan tidak mengubah data.
- Menu Pilihan pratinjau menyediakan profil, loading, kosong, gagal/coba lagi dan simulasi simpan gagal. Loading berupa skeleton tanpa animasi. Setelah definisi baru disimpan, daftar kembali ke kondisi data tersedia.

## Aturan contoh

- Nama dan slug/kode unik, termasuk terhadap definisi nonaktif. Nama 2–80 karakter; slug/kode berupa huruf kecil, angka dan tanda hubung, maksimal 80 karakter; urutan berupa angka bulat 1–999; deskripsi dan alasan maksimal 500 karakter. Alasan sedikitnya 5 karakter.
- Induk kategori tidak boleh membentuk siklus. Kategori yang memiliki pemakaian produk, kategori anak atau relasi definisi atribut tidak dapat dihapus. Kategori/atribut yang dipakai produk aktif dan kategori dengan anak aktif tidak dapat dinonaktifkan.
- Identitas yang sudah dipakai dipertahankan. Nama, tipe dan fungsi atribut terpakai dikunci; tipe atribut yang sudah memiliki pilihan juga dikunci. Perubahan nama kategori tidak memutus relasi karena produk memakai ID kategori.
- Pilihan yang dipakai produk tidak dapat diganti namanya, dinonaktifkan atau dihapus. Atribut pilihan aktif harus memiliki setidaknya satu pilihan aktif; pilihan aktif terakhir tidak dapat dinonaktifkan/dihapus sebelum atribut dinonaktifkan atau pilihan aktif lain tersedia.

## Sumber data dan batas integrasi

Fixture berasal dari salinan data contoh `products-data.js`, ditambah satu kategori nonaktif dan satu atribut pembeda varian untuk mencoba kondisi belum dipakai. Pemakaian dihitung dari salinan produk contoh awal, termasuk produk nonaktif. Perubahan hanya berada di memori tab ini dan hilang saat refresh. Halaman Produk & Varian belum membaca perubahan di sini. Tautan pemakaian membuka detail produk contoh yang sesuai.

Sebelum digunakan dengan data nyata, hubungkan controller/template staf, basis data kategori/atribut/opsi, relasi produk, otorisasi peran, penyimpanan dan audit server. Unik, siklus, pemakaian, transaksi perubahan, konflik perubahan bersamaan dan dampak penonaktifan harus diperiksa ulang di server. Aturan penguncian prototipe ini konservatif dan perlu diselaraskan dengan kebutuhan migrasi data produksi.

## Verifikasi

`tests/e2e/browser/verify-taxonomy.cjs` memeriksa lima lebar 320–1920 px pada enam tampilan, keseragaman kartu, detail lebar penuh, pencarian/filter otomatis, pagination, CRUD, duplikasi, pemakaian, pilihan terkontrol, alasan perubahan, dirty guard, kegagalan simpan, kondisi data dan navigasi dua peran. Hasil akhir serta penilaian visual dicatat di `storage/reports/hallmark/reports/taxonomy-verification.md`.
