# Pengaturan Sistem SuperAdmin — 5 November 2026

Halaman `public/pages/superadmin/system-parameters.html` melengkapi pratinjau admin statis dengan register **46 parameter**: **44 dapat diusulkan perubahannya**, sedangkan **P-45 dan P-46 hanya baca**. Acuan bisnisnya `docs/specifications/spesifikasi-proyek-v2.6.md` bagian 3, 13.4, dan 19. Ini adalah demonstrasi UI lokal; nilai, draf, serta riwayat berada di memori tab dan hilang saat refresh.

Pratinjau tersedia di `http://127.0.0.1:4178/system-parameters.html?role=superadmin`. `role=admin` menampilkan akses ditolak tanpa daftar parameter atau editor. Pemilih profil dan parameter URL hanya mengendalikan pratinjau, bukan autentikasi atau otorisasi.

## Arah dan komponen incumbent

Pertanyaan utama layar: kebijakan mana yang aktif, apa yang akan berubah, dan apa yang perlu diperiksa sebelum disimpan? Nilai aktif tetap terlihat di samping usulan; perubahan masuk draf sebelum ditinjau sebagai satu kelompok.

- Shell, sidebar sage, kanvas krem, Poppins lokal, kepadatan admin, dan radius 8/12 px meneruskan antarmuka yang sudah ada. Referensi framed sheet memakai seed incumbent **1683893219**; tidak ada undian arah visual baru atau comp yang disetujui terpisah.
- Tombol dan badge memakai komponen antrean pesanan; panel, field, pesan, dan dialog memakai komponen produk. Pilihan kelompok di ponsel memakai combobox pencarian `admin-controls.js`/`admin-controls.css` yang sama.
- Judul halaman mengikuti skala admin 26 px; teks daftar dan bantuan memakai skala 13 px yang diwarisi. Ruang kerja dibatasi 1380 px, dengan rail kelompok 218 px, jarak 24 px, dan konteks editor 320 px saat ruang tersedia. Angka ini menggambarkan permukaan ini, bukan token global baru.
- Status Baseline, Berubah, Draf, Sensitif, dan Hanya baca mempunyai teks dan ikon SVG. Nilai yang berubah diberi label, sehingga makna tidak bergantung pada warna saja. Riwayat memakai elemen native `details`/`summary` dengan ikon SVG plus/minus.
- Pada layar sempit, sidebar menjadi drawer, empat filter ringkasan tetap terlihat dalam kisi 2 × 2, kelompok menjadi pilihan yang dapat dicari, baris mempunyai label, serta editor dan perbandingan ditumpuk. Kontrol tindakan mempertahankan target 44 px.

`PRODUCT.md`, `DESIGN.md`, dan `.impeccable/config.json` dipertahankan. `.impeccable/design.json` yang sebelumnya tidak ada tidak dibuat. Pengecualian palet, kepadatan, dan shell incumbent tidak dijadikan aturan desain global baru. Tidak ada aset raster baru untuk produk; tangkapan layar hanya bukti pemeriksaan.

## Daftar, editor, dan navigasi

Tampilan awal menyediakan tindakan Tinjau perubahan, tab Parameter/Riwayat, empat filter hitungan, navigasi tujuh kelompok, pencarian, serta daftar enam baris per halaman. Hitungan mengikuti pencarian dan kelompok yang dipilih. Pada baseline tanpa filter: 46 parameter, 0 draf, 40 parameter sensitif, dan 2 hanya baca. Subset tersebut dapat saling mencakup; dua parameter hanya baca juga ditandai sensitif.

Pencarian mencocokkan kode, key, nama, dan deskripsi parameter. URL menyimpan `role`, `view`, `group`, `segment`, `search`, `page`, dan `parameter` saat editor terbuka. Kembali ke daftar mempertahankan konteks filter. Pencarian dan halaman riwayat hanya disimpan dalam tab, bukan URL; URL juga tidak menyimpan isi draf atau nilai aktif lokal.

Editor memakai angka, jam WIB, dan ketentuan boolean sesuai skema. Setiap isian memiliki label, satuan, nilai aktif, batas yang relevan, dan pratinjau usulan. Nilai aktif, baseline v2.6, dan usulan adalah tiga keadaan terpisah. **Gunakan baseline sebagai usulan** hanya mengisi editor; nilai tersebut tetap perlu dimasukkan ke draf, ditinjau, dan disimpan melalui alur yang sama. P-45/P-46 menampilkan nilai dan pemilik kebijakan tanpa kontrol edit.

Helper `public/assets/js/shared/admin-settings-nav.js` menghubungkan menu Pengaturan Sistem untuk pratinjau SuperAdmin di sembilan halaman incumbent: dashboard, laporan keuangan, antrean pesanan, produk, pelanggan, produksi buket, bahan produksi, kalender tutup, dan Audit Log. Halaman-halaman tersebut hanya menerima tautan serta helper navigasi pengaturan dalam pekerjaan ini.

## Alur perubahan dan pemulihan

1. Editor memvalidasi nilai sebelum menambah atau memperbarui draf. Draf tidak mengubah nilai aktif. Isian tidak valid menampilkan ringkasan kesalahan dan hubungan ke field terkait; perubahan isian memperbarui pratinjau.
2. Tinjauan memperlihatkan nilai aktif dan usulan setiap parameter, field yang berubah, penjelasan dampak khusus kebijakan, serta tindakan edit atau hapus dari draf. Validasi antarparameter dapat mengharuskan perubahan terkait ditinjau bersama.
3. Setiap penyimpanan memerlukan alasan 5–500 karakter dan referensi CR/ADR minimal 3 karakter. Parameter bertanda review memerlukan pengakuan peninjauan dampak/pencatatan pengujian. Perubahan sensitif meminta kode demo **123456**; halaman menyatakan bahwa ini simulasi, bukan bukti MFA, persetujuan, atau pengujian produksi.
4. Simpan menerapkan seluruh draf sekaligus pada nilai aktif lokal dan menambahkan satu entri riwayat lokal. Entri berisi pelaku contoh, waktu yang ditampilkan dalam WIB, alasan, referensi, serta snapshot sebelum/sesudah. Riwayat hanya baca dan dapat dicari; tidak tersedia tindakan mengubah atau menghapus entri.
5. Simulasi gagal simpan, sesi berakhir, atau revisi usang tidak memutasi sebagian nilai aktif/riwayat. Draf tetap tersedia untuk retry atau peninjauan ulang. Konflik memakai nomor revisi lokal; tidak mewakili penulis bersamaan pada server.
6. Isian editor yang belum masuk draf, meninggalkan halaman dengan perubahan, dan membuang seluruh draf dilindungi konfirmasi. Loading, gagal muat/retry, register kosong, hasil pencarian kosong, riwayat kosong, parameter tidak dikenal, serta akses ditolak mempunyai pesan dan tindakan pemulihan yang sesuai.

Batas numerik dan ketentuan tetap pada frontend adalah guard prototipe yang konservatif. Produksi membutuhkan skema server yang telah ditinjau; rincian cakupan dan titik rekonsiliasi ada di `docs/coverage/system-parameters-coverage.md`.

## Batas integrasi

Nilai awal mengikuti register v2.6 atau seed SQL yang dirujuk implementasi. Tidak ada pembacaan/penulisan database/API, otorisasi server, MFA nyata, audit permanen append-only atau hash audit, notifikasi, gateway, perubahan konfigurasi PHP/web server, maupun sinkronisasi dengan modul lain. Tombol Muat ulang memulihkan tampilan data lokal, bukan mengambil konfigurasi produksi. Refresh browser menginisialisasi kembali baseline.

Efek kebijakan dijelaskan khusus untuk setiap parameter. Halaman tidak menjanjikan bahwa semua perubahan hanya berlaku untuk transaksi baru: waktu penerapan, sesi aktif, reservasi, retensi, target layanan, dan pekerjaan teknis harus ditetapkan serta diuji oleh layanan pemiliknya. P-45 adalah keputusan arsitektur pengembang/klien melalui ADR; P-46 adalah pekerjaan pemeliharaan keamanan pengembang, bukan penyimpanan operasional.

## Bukti dan status tinjauan

- `tests/e2e/browser/verify-system-parameters.cjs` dan `.impeccable/review/system-parameters/verification.json` mencatat **11 kelompok pemeriksaan, 0 kesalahan browser**, dengan 19 PNG. Cakupan meliputi pencarian/URL, draf, penyimpanan atomik dan retry, review sensitif, validasi antarparameter, konflik, sesi berakhir, guard perubahan, hanya baca/akses ditolak, recovery, viewport, dan sembilan tautan navigasi.
- `tests/e2e/browser/verify-system-edges.cjs` dan `edge-verification.json` mencatat **8 kelompok pemeriksaan, 0 kesalahan browser**. Seluruh 46 tautan editor/detail, skema berlabel, P-45/P-46 tanpa kontrol edit, batas keamanan, presisi desimal, nilai nol, perubahan peran, parameter tidak dikenal, dan lebar **320–1920 px** diperiksa; empat PNG tambahan melengkapi 23 tangkapan alur/batas.
- Kedua suite dan 23 tangkapan tersebut dibuat ulang setelah dua koreksi akhir: penjelasan efek khusus kebijakan pada seluruh 46 parameter dan disclosure riwayat berupa SVG. `correction-captures.json` menambah enam PNG kebijakan sesi P-32, retensi P-34, dan pemeliharaan P-46 pada 1440/390 px. Tangkapan P-45 desktop dan P-28 ponsel juga memperlihatkan copy yang diperbaiki. Builder/reviewer telah membuka bukti visual yang diserahkan.
- Taste final mencatat **0 FAIL / 0 WARN** dengan allowance incumbent eksplisit `palette-cream` untuk merek krem dan `icon-chips` untuk logo/workspace/avatar shell, bukan dekorasi KPI. Enam JPG final berada di `.taste-skill/system-parameters/final/`. Pemeriksaan format sumber mencatat **0 FAIL / 0 WARN**. Skor kritik **8,0/10** adalah penilaian internal, bukan penerimaan independen.
- Detector Impeccable dijalankan sekali: **0 temuan primer, 3 advisori palet incumbent**. Detector tidak dijalankan ulang dan advisori tidak diubah menjadi token baru.
- Hallmark render dijalankan; hasil mentah tetap **1 FAIL / 0 REFLEX / 0 WARN / 4 ANSWERED**. Gate 56 menggabungkan sidebar dengan selector `.product-editor-nav` yang diwarisi dari `products.css` tetapi tidak diinstansiasi pada DOM pengaturan. Reviewer menerima penjelasan ini berdasarkan source dan tangkapan yang tidak menunjukkan overlap; pemeriksa tidak diubah dan hasil tidak diklaim 0 FAIL. Lima PNG tersedia di `public/.hallmark/shots/system-parameters-*`.
- Tinjauan penuh pada `.impeccable/review/system-parameters/finish-review.md` merekam **disposition: fix** untuk tepat dua temuan tadi. Putusan lanjutan `finish-verdict.md` menilai keduanya **RESOLVED**, sisa **CLEAR**, tanpa regresi yang terkait kedua koreksi, dan memberi **disposition: ship**. SHIP ini hanya mencakup dua perbaikan yang dinilai; bukan persetujuan ulang seluruh permukaan atau kesiapan produksi. Batas tinjauan awal tetap berlaku.

Pemeriksaan memakai Chrome/Puppeteer, viewport emulasi, dan input sintetis. Tidak ada pembuktian perangkat fisik, pembaca layar, seluruh browser, backend, keamanan server, atau operasi produksi.
