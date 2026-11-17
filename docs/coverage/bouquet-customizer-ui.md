# Buket Kustom — cakupan UI

Pembaruan navbar 17 November 2026: kategori desktop mengimbangi tinggi header
sticky bersama. Selector tombol `.bouquet-page .bq-button` memastikan label tautan
primer tetap putih sebelum hover; `.bq-secondary` mempertahankan warna teksnya.
Regresi Buket 17 kelompok lulus, termasuk warna label masuk default. Alur
pencarian keluar tetap memakai konfirmasi rakitan belum disimpan.

Diperbarui 17 November 2026. Status: **UI pratinjau selesai; integrasi produksi belum tersedia**.

## Route dan acuan

- Halaman: `/pages/customer/bouquet-customizer.html`.
- Alias: `/bouquet-customizer.html`, `/buket-kustom.html`.
- Workbench lokal: `/__preview/bouquet` dengan 34 skenario; parameter `?preview=bouquet&state=...` hanya diaktifkan pada localhost.
- Acuan: [spesifikasi halaman](../design/surfaces/bouquet-customizer-surface.md), PRODUCT.md, DESIGN.md dan Figma `LcUKB3k9C38G0g6KWo5zIU`, frame `454:1201`.
- Keputusan pengguna: pratinjau **otomatis dari pilihan**, tanpa editor geser bunga.

## Implementasi

Desktop memakai tiga kolom: kategori, komposisi/ringkasan pilihan, serta opsi dan harga. Header, footer, font, dan warna mengikuti storefront yang ada. Judul 28–36 px, judul section 18 px, kontrol utama 48 px dan target interaksi sekurangnya 44 px. Pilihan bahan dan harga berada di dua panel terpisah tanpa scroll bertingkat. Daftar Pilihan Anda dibatasi dua baris; komponen kelima dan seterusnya diakses melalui geser horizontal atau tombol panah. Pada tablet rail menjadi horizontal; mobile menumpuk konten dan memakai node subtotal/CTA yang sama sebagai bar bawah. ResizeObserver mengukur ruang bar; fokus field tidak tertutup.

Digunakan kembali: shell storefront, header keranjang/akun, dialog native homepage, formatter dan escaping kartu produk, adapter keranjang, autentikasi pratinjau, dan checkout. Ditambahkan: DTO opsi buket, penyimpanan konfigurasi contoh, adapter konfigurator, renderer komposisi dengan susunan bervariasi yang deterministik, formulir pesan/catatan, dan workbench state.

Kategori dan opsi:
- Bunga utama: mawar merah/putih per paket 5 tangkai.
- Pendamping: baby's breath/eucalyptus per ikat.
- Pembungkus: sage per paket 3 lembar.
- Pita: satin krem 1,5 meter.
- Harga tambahan serta batas paket mengikuti enam seed SQL. Jumlah jenis terpilih dan jumlah paket merupakan dua nilai berbeda; jumlah buket juga terpisah.
- Tidak ada pilihan vas atau swatch warna baru karena master tidak menyediakan keduanya.

Harga dasar **Rp0** dan produk `preview-custom-bouquet` adalah fixture yang dinyatakan sebagai contoh, bukan produk/penawaran produksi. Hubungan produk–kategori, harga dasar dan stok produksi belum dapat ditarik dari layanan aktual. Pilihan berbayar tidak dipilih otomatis pada rakitan baru.

Komposisi otomatis menggunakan renderer DOM Korean Bouquet enam lapisan dengan empat aset transparan baru (kepala mawar multi-pose, kertas kipas belakang, kerah tisu/kertas depan, serta pita berjuntai). Atlas lama dipakai untuk thumbnail dan bahan daun/filler. Jumlah gambar dibatasi untuk keterbacaan; **ilustrasi ini bukan simulasi botanikal presisi atau janji jumlah visual produksi**. Ringkasan paket adalah sumber kuantitas yang ditampilkan. Aset dihasilkan saat implementasi dan membawa prompt provenance; ikon kategori/remove berasal dari frame Figma. Placeholder abu-abu Figma tidak dipakai sebagai komposisi akhir.

## Interaksi dan state

- Guest melihat gate masuk; pelanggan contoh yang melanjutkan dari UI login dapat membuka editor. Tidak ada klaim autentikasi nyata.
- Checkbox/radio mengikuti mode kategori; pilih/hapus/edit kelompok, jumlah paket, jumlah buket, pencarian langsung dan Reset pencarian berfungsi.
- Reset rakitan berbeda dari Reset pencarian dan memiliki penjaga perubahan.
- Ringkasan pilihan, rincian harga, subtotal, validasi kelompok dan karakter langsung diperbarui. Penghitungan mengabaikan respons yang sudah tertinggal.
- Pesan kartu 200 karakter, label/tema/pengirim 100, catatan florist 300; panjang dihitung berdasarkan Unicode code points dan ditampilkan sebagai teks biasa.
- Perbesar memakai dialog native: Escape/X, fokus tertahan dan dikembalikan ke pemicu.
- Simpan mencegah klik ganda. Rakitan identik digabung berdasarkan hash kanonis; beda konfigurasi tetap terpisah. Batas 20 buket berlaku terhadap agregat produk, batas 50 terhadap total isi keranjang.
- Edit dari Keranjang mengembalikan metadata; simpan mengganti konfigurasi yang tepat. Pembatalan kembali ke Keranjang melalui penjaga perubahan.
- Harga berubah wajib disetujui, termasuk setelah dialog ditutup lalu aksi diulang. Hasil tidak pasti diperiksa memakai request yang sama.
- Konflik tidak menimpa konfigurasi lain: muat keranjang terbaru dan tambahkan sebagai rakitan baru bila diperlukan.
- Kegagalan memuat, menghitung, menyimpan, offline, maintenance, sesi/formulir, pembatasan percobaan, batas jumlah, dan penyimpanan memiliki pesan dan pemulihan.
- Kosong, pencarian kosong, opsi tidak tersedia, data sebagian, gambar gagal, konten panjang, dan konfigurasi lokal rusak memiliki tampilan yang dapat digunakan.
- Workbench termasuk panel header terisolasi dari keranjang biasa. State produksi tidak menerima parameter pengujian di host publik.

## Keranjang, sesi, dan Checkout

Konfigurasi, pesan kartu dan catatan disimpan di **sessionStorage**, bukan localStorage atau URL. Keranjang produk standar tetap menyimpan ID/varian/jumlah melalui kontrak sebelumnya. Harga konfigurasi dibangun ulang dari fixture; nilai harga yang disimpan tidak dianggap sumber kebenaran.

Sesi ini hanya mengenal identitas sintetis `customer-example`. Handoff pemulihan menyimpan draft sementara selama 30 menit pada tab dan identitas contoh yang sama, dengan ID acak di returnTo. Draft pulihan tetap dianggap belum disimpan. Ini bukan implementasi kepemilikan akun produksi atau penyimpanan desain permanen.

Checkout menyelesaikan referensi konfigurasi dari keranjang contoh, menampilkan ringkasan dan meneruskan referensi/revisi. Pesan kartu buket tidak disalin otomatis ke kartu pesanan; UI menjelaskan keduanya terpisah sehingga tidak mengirim duplikat tanpa pilihan pengguna. Penanganan buket contoh adalah perishable; aturan jadwal Checkout yang ada tetap berjalan.

## Pemeriksaan yang dijalankan

| Pemeriksaan | Hasil |
| --- | --- |
| `verify-bouquet-customizer.cjs` | **17 kelompok lulus**, tanpa pageerror; 8 lebar 320–1920 px |
| `verify-bouquet-composition.cjs` | **5 kelompok lulus**, termasuk 24 kepala, alpha aset dan pemulihan gambar |
| `verify-cart.cjs` | **19 kelompok lulus**, termasuk 49 skenario dev |
| `verify-checkout.cjs` | **17 kelompok lulus**, 34 state dan 9 lebar |
| `verify-customer-auth.cjs` | **11 kelompok lulus**, 31 state |
| `verify-homepage.cjs` | **6 kelompok lulus** |
| `verify-catalog.cjs` | **19 kelompok lulus** |
| Node syntax checks | Seluruh modul baru dan modul integrasi yang disentuh valid |
| Alias/workbench HTTP | Ketiga URL berhasil dengan status 200 setelah server dimulai ulang |
| Raster provenance scan | 6 raster, 0 tanpa provenance |

Suite buket memeriksa gate/login return, paket vs buket, komposisi otomatis, filter/reset, validasi Unicode, zoom/fokus, draft pulihan, kegagalan/pemulihan, persetujuan harga berulang, rekonsiliasi timeout, workbench header, klik ganda, merge, batas agregat, edit, Checkout, dan data rusak.

Bukti lokal yang tidak masuk git: `storage/reports/bouquet-customizer/verification.json`, screenshot desktop/mobile/checkout, serta `audit-final.json`.

Audit Hallmark source + render dijalankan, lalu perbaikan di area buket diterapkan. Hasil akhir **bukan lulus penuh**: tersisa 8 FAIL pada shell bersama (kontras teks/header/footer, batas input pencarian komposit, dan label footer yang membungkus), 2 REFLEX pada shell/proporsi warna, serta 2 WARN heuristik (heading nonnumerik dan bobot font global). Fondasi shell di luar cakupan dipertahankan sesuai instruksi pengguna. Tidak ada temuan FAIL akhir yang menunjuk kontrol atau gaya buket baru. Smoke test terakhir juga memeriksa alias, 33 tautan workbench, live region subtotal, padding halaman guest, render desktop/mobile dan entry point Detail Produk; seluruhnya lulus tanpa pageerror.

Review independen telah melihat screenshot desktop/mobile dan menemukan celah persetujuan harga, baseline recovery, isolasi header workbench, parameter navigasi, jalur batal edit dan fokus kategori. Temuan tersebut diperbaiki; skenario yang relevan masuk suite browser. Pembacaan ulang reviewer atas perbaikan terakhir ditolak auto-review karena kuota layanan habis; tidak dinyatakan sudah disetujui ulang secara independen. Lihat [catatan review](../design/reviews/bouquet-customizer-review-2026-11-17.md).

## Batas integrasi dan pekerjaan produksi tersisa

- Middleware akun aktif/terverifikasi dan otorisasi pelanggan harus berasal dari server; marker contoh bukan kontrol akses produksi.
- API produk buket, asosiasi kelompok/opsi, aset per opsi, availability/compatibility, varian dan harga dasar aktual belum tersedia.
- Server perlu menormalisasi kontrak jenis vs paket, menghitung signed delta, memvalidasi material/stock, revision dan harga akhir, serta menegakkan batas 20/50.
- Penyimpanan keranjang akun, snapshot order, draft milik akun, idempotency/reconciliation lintas proses, CSRF, dan transaksi basis data belum diimplementasikan oleh pekerjaan UI ini.
- Tidak ada reservasi/pengurangan stok, pesanan produksi, pembayaran nyata, unggah gambar, drag/drop, atau penyimpanan desain permanen yang diklaim.
- Tidak dilakukan commit, push, publikasi atau deployment.


## Perbaikan berdasarkan tangkapan layar pengguna — 17 November 2026

- Menghapus scroll bertingkat pada sisi kanan. Pilihan bahan, navigasi kelompok, serta ringkasan harga mempunyai batas panel dan jarak yang jelas; konten tidak tertutup oleh ringkasan harga.
- Membatasi Pilihan Anda pada maksimal dua baris di desktop dan mobile. Empat komponen dapat terlihat sekaligus; sisanya digeser. Tinggi rail sama untuk empat maupun enam komponen. Tersedia snap, tombol sebelumnya/berikutnya, scroll keyboard dan gesture sentuh native.
- Merapatkan kartu pilihan dan ukuran kontrol tanpa mengubah kontrak paket, jumlah buket, atau perhitungan harga.
- Menyusun bunga memakai distribusi spiral dengan variasi seeded pada posisi, ketinggian, sudut, ukuran dan kedalaman; warna tidak dikelompokkan menjadi barisan. Susunan yang sama tidak diacak ulang ketika jumlah buket atau harga berubah.
- Memisahkan kertas belakang dan depan sehingga tangkai terselip ke pembungkus. Semua foto tetap memakai atlas proyek yang sama; tidak ada aset komersial atau gambar pengguna yang dijadikan foto produk.
- Memakai siluet SVG kategori dengan warna currentColor: hijau pada permukaan terang dan putih pada kategori aktif. Ikon bunga juga terlihat saat kategori tidak aktif.
- Renderer komposisi dipisahkan ke public/assets/js/storefront/bouquet-composition.js agar penempatan botani tidak bercampur dengan alur penyimpanan.

Pemeriksaan lanjutan: verify-bouquet-customizer.cjs kembali lulus17 kelompok; verify-bouquet-refinement.cjs lulus5 kelompok, mencakup8 lebar320–1920px, batas dua baris, tinggi stabil4/6 komponen, navigasi geser, gesture sentuh CDP nyata, lapisan kertas, susunan deterministik, ikon aktif/nonaktif, dan zoom. Tidak ada pageerror atau overflow horizontal pada halaman. Node syntax checks dan git diff --check lulus. Screenshot serta JSON hasil berada di storage/reports/bouquet-refinement. Audit Hallmark8 FAIL yang dicatat sebelumnya adalah hasil putaran implementasi awal, bukan hasil audit baru untuk revisi ini.


## Renderer Korean Bouquet enam lapisan — 17 November 2026

Implementasi mengikuti permintaan lanjutan pengguna: kertas kipas belakang, daun belakang, bunga utama, filler/daun depan, kerah tisu/kertas depan, dan pita. Distribusi spiral diganti organic slot coordinates yang membentuk kubah asimetris. Rotasi dibatasi±25°, skala0,85–1,15, depth bunga mengikuti Y, brightness belakang0,90–0,95, dan drop-shadow diterapkan pada alpha kelopak serta lipatan depan.

Aset mawar mempunyai tiga pose per warna. Kertas belakang dan kerah depan adalah foto transparan terpisah; gambar depan benar-benar menutupi pangkal bunga. Seluruh aset dibaca sebelum rangkaian ditampilkan, dengan loading/fallback/retry yang mempertahankan pilihan. Bidang virtual dipusatkan pada track grid yang dibatasi agar ekor pita tidak terpotong. Skenario pengembangan fullComposition menampilkan enam bahan dan15 kepala mawar untuk peninjauan; state ini tetap terisolasi dari keranjang biasa.

Rincian algoritma, sumber aset, prompt lengkap dan pengujian: [renderer komposisi](../design/bouquet-composition-renderer.md). Renderer5 kelompok lulus pada snapshot akhir; suite alur17 dan layout5 merupakan regresi terpisah. Bukti: storage/reports/bouquet-korean. Riwayat distribusi spiral pada bagian sebelumnya menggambarkan iterasi awal dan telah digantikan renderer ini. Backend, harga, dan hak akses tidak berubah.


## Penyelesaian ujung bingkisan — 17 November 2026

Titik leher pembungkus belakang, kerah depan dan simpul pita diselaraskan. Kelanjutan lipatan bawah tidak lagi tertutup kerah; seluruh ujung kertas dan pita tetap berada di area gambar dengan ruang aman. Bidang komposisi600px menggantikan540px tanpa memperbesar panel halaman. Tidak ada perubahan aset, harga atau alur transaksi. Suite renderer5 dan layout5 kembali lulus; pemeriksaan baru mencakup hem kertas yang terlihat, keselarasan simpul, dan margin8px pada lima lebar layar.
