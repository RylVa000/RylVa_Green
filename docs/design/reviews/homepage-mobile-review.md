disposition: ship

Input terbatas: tidak ada QUALITY BAR terpisah. Reviewer independen berhenti
karena batas penggunaan layanan; pass ini memakai reviewer inline berdasarkan
panduan degraded/finish-reviewer.md, bukan persetujuan independen. Quality gates
historis tidak dijalankan ulang atau dinyatakan lulus oleh pass ini.

## persistence

Pass untuk revisi Homepage 15 November 2026. PRODUCT.md dan DESIGN.md tetap
menjadi acuan. Surface brief mencatat sumber Home page rev 466:386, kontrak
arah, delapan screenshot koreksi pengguna, serta keputusan dua kolom ponsel
yang menggantikan susunan satu kolom sebelumnya. Ini reproduksi code-led dari
desain yang dipin, bukan comp-led build baru; tidak ada comp round atau
comp-diff yang diklaim.

Bukti tersimpan di `.impeccable/review/homepage-mobile/`: desktop.png (1440px),
mobile.png (390px), user-320.png, wishlist-filled.png, hero-pink-mobile.png dan
product-cards.png. Seluruh capture tersebut dibuka: full-page mulai dari atas,
capture bagian memperlihatkan bagian yang dinamai, tidak ada area hitam atau
aset gagal. Delapan referensi pengguna disimpan sebagai user-01.png sampai
user-08.png; frame awal sebagai figma-reference.png. Screenshot pengguna adalah
otoritas koreksi utama.

Inventaris referensi: hero botani dengan judul besar, foto tanaman dan bidang
arch; promosi sage/oranye/hijau dengan gambar di kanan bawah; kartu produk
desktop horizontal; hati di atas keranjang. Koreksi ponsel meminta foto hero
sebelum tombol, promosi yang ringkas, serta dua produk per baris. Blibli memberi
acuan kepadatan ponsel, tanpa mengganti identitas visual RylVa.

Dua laporan browser disertakan: verification-refinements.json berisi tujuh
kelompok lulus; verification-base.json berisi enam kelompok lulus/15 skenario.
Keduanya memiliki errors kosong dan mencakup enam lebar 320–1920px. Timer
autoplay diuji dengan menunggu perpindahan nyata, termasuk setelah Lanjutkan
ketika kontrol tetap fokus dan ketika pointer berada pada gambar. Pass review
ini sendiri hanya membaca bukti dan sumber; tidak menjalankan detector kedua.

## fidelity

| Elemen | Penilaian | Bukti dan dasar keputusan |
| --- | --- | --- |
| TYPE | match | Poppins dan hirarki tebal tetap dipakai. Nama produk ponsel dibatasi dua baris; teks lengkap tersedia melalui detail dan label tindakan. Tidak mengganti keluarga font. |
| MATERIAL | match | Foto produk, promosi dan tanaman hero tetap berupa aset gambar; SVG hanya menggambar ikon hati. Tidak mengganti tanaman dengan bentuk CSS. Dua rekonstruksi hero tambahan tetap berstatus ilustrasi pratinjau seperti dicatat pada coverage. |
| GROUND | match | Latar krem lembut, hero near-white, kartu putih serta tiga bidang promosi mempertahankan suhu dan hubungan warna sumber. Palet Petunia pink adalah arahan pengguna sebelumnya. Penilaian visual; tidak mengklaim pengukuran pixel baru. |
| Hati wishlist aktif | match | wishlist-filled.png memperlihatkan isi hati berwarna, bukan hanya latar atau lingkaran. aria-pressed dan label Simpan/Hapus ikut diperbarui; umpan balik membuka Wishlist Contoh. |
| Geometri hati/keranjang | match | Kedua target tetap 44×44px dan bulat. Pusat horizontal hati berada tepat di atas keranjang, terlihat pada desktop/mobile dan dibuktikan pengukuran browser dengan selisih <1px. |
| Tombol promosi | match | Lebar mengikuti label; lebar paket 316px yang dipaksakan sudah dihapus. Tombol tidak membentang menutup foto promosi. |
| Promosi ponsel | adaptation | mobile.png dan user-320.png memperlihatkan rail horizontal dengan petunjuk kartu berikutnya. Tinggi seluruh kartu <280px; ini mengikuti koreksi pengguna terhadap tiga promosi tinggi bertumpuk. Warna, badge, teks dan foto Figma tetap ada. |
| Produk ponsel | adaptation | Dua kolom pada 320/390px menggantikan kartu horizontal satu kolom atas permintaan pengguna. Foto berada di atas, lalu nama/status/harga dan tindakan. Deskripsi tersedia di detail; Detail Produk dipersingkat menjadi Detail pada tampilan ringkas. |
| Produk desktop | match | product-cards.png mempertahankan foto kiri, nama/status, harga/hati, divider dan detail/keranjang. Jarak dan tindakan tidak bertabrakan. |
| Hero ponsel | adaptation | Foto berada sebelum CTA, tanpa ruang kosong minimum deskripsi yang lama. Logo, judul, deskripsi, gambar, CTA dan indikator mengikuti urutan baca yang diminta. hero-pink-mobile.png membuktikan urutan juga berlaku pada slide alternatif. |
| Autoplay dan pemulihan | match | Interval 6,5 detik, Jeda/Lanjutkan dan pemilih manual berfungsi. Hover gambar tidak menghentikan autoplay. Fokus keyboard, reduced motion, tab tersembunyi, offscreen dan panel/dialog tetap dilindungi. Ini dibuktikan laporan browser dan sampel homepage-hero.js, bukan disimpulkan dari screenshot statis. |
| Shell dan alur existing | match | Navbar/footer, pratinjau koleksi/detail, keranjang, overlay akun dan jalur pemulihan tetap tersedia. CSS perubahan dibatasi Homepage. Tidak menambah endpoint atau klaim transaksi produksi. |

THESIS, OWN-WORLD, STORY dan FIRST VIEWPORT tetap mengikuti desain RylVa yang
dipin; adaptasi mobile di atas memiliki arahan pengguna yang eksplisit. FORM
tetap `seed: none (pinned)`. Tidak ditemukan kontradiksi material baru pada
ruang lingkup revisi dari bukti yang dibaca.

## ceiling

Reached untuk revisi yang dipin: foto tanaman, bidang arch, promosi berwarna,
kontrol bulat yang sejajar, serta kepadatan dua kolom kini diterapkan konsisten.
Tidak ada QUALITY BAR terpisah sehingga ini bukan skor visual independen.
Temuan shell/performa historis serta kebutuhan data produksi tetap terbuka
sebagaimana dicatat dalam homepage-quality-gates.md dan coverage.

## material_fixes

Tidak ada pada ruang lingkup revisi ini. Disposition `ship` tidak menutup
quality gates historis atau menyatakan backend katalog/wishlist siap produksi.

## keep

Pertahankan dua kolom ponsel, foto sebelum CTA, promosi ringkas, hati terisi dengan target bulat 44px, autoplay yang dapat dijeda, identitas Figma dan kejujuran data pratinjau.
