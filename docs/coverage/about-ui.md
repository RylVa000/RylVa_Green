# Cakupan UI Tentang Kami

19 November 2026. Halaman publik **Read**, diperluas dari sistem informasi storefront yang sudah ditetapkan. PRODUCT.md dan DESIGN.md dipertahankan; tidak mengganti tema, header/footer, kontrak data atau logika belanja.

## Halaman dan isi

- Route: `/pages/public/about.html`.
- Alias pratinjau: `/about.html`, `/about-us.html`, `/tentang-kami.html`.
- Footer Tentang Kami menjadi tautan nyata melalui pemetaan shell bersama. Halaman sendiri memakai anchor native dengan satu current footer, termasuk tanpa JavaScript.
- Lima bagian: pengenalan RylVa Green; kebutuhan pelanggan; pilihan koleksi; informasi sebelum membeli; kontak dan bantuan.
- Enam baris koleksi menuju lima filter katalog yang tersedia dan peracik Buket Kustom. Tidak menambah harga, stok, jumlah hasil atau produk buatan.
- Banner hijau, judul/deskripsi putih terpusat, breadcrumb kiri, CTA tengah di dalam banner. Desktop memakai sidebar sticky; mobile memakai disclosure dan tombol bertumpuk.

[Brief permukaan](../design/surfaces/about-surface.md) mencatat sumber, copy, kontrak visual serta batas fakta. Profil menggunakan tujuan, pengguna dan ruang lingkup yang tercatat pada PRODUCT.md. Tidak ditemukan naskah sejarah, pendiri/tim, tahun berdiri, prestasi, testimoni atau foto tempat milik merek; halaman tidak mengarangnya. Komitmen disampaikan sebagai tujuan merek, bukan bukti pencapaian atau jaminan layanan.

## Komponen dan perubahan

- Gunakan kembali shell, Poppins, token, banner kebijakan, breadcrumb, tombol inverse, container, sidebar, daftar isi, pembaca artikel, fokus dan fallback anchor tanpa script.
- `public/assets/js/storefront/about.js` mengonfigurasi lima bagian, history key tersendiri dan sumber kembali Katalog yang dibatasi same-origin.
- `public/assets/css/storefront/about.css` hanya menata halaman profil: aksi banner, jarak awal pembaca dan daftar deskripsi koleksi. Tidak ada perubahan nilai gaya global; selector banner bersama hanya diperluas ke `.information-about`.
- Tidak ada raster baru, foto stok yang dianggap foto toko, ikon dekoratif, framework, endpoint atau formulir baru.

## State dan pemulihan

| Area | State/perilaku | Pemulihan/konteks |
| --- | --- | --- |
| Profil | Publik, read-only, guest | Tetap dapat membaca tanpa akun |
| TOC | Satu bagian aktif saat scroll dua arah | Tidak mengubah URL, fokus atau history |
| Mobile TOC | Native collapsed/expanded, keyboard | Pulih setelah Back |
| Anchor | Link, keyboard dan direct fragment | Heading fokus dengan ruang header |
| Fragmen lama | Target tidak ada | Kembali ke pembuka, link tetap dapat dipakai |
| Tombol/link | Default, hover, fokus, active | Ring dan warna bermakna; motion existing menghormati reduced motion |
| Katalog | Lima tautan kategori aktif | Filter sesuai URL halaman tujuan |
| Buket Kustom | Guest mengikuti guard tujuan | Tidak menambahkan parameter bypass |
| Kembali | Sumber Katalog tervalidasi | Query, kategori, urutan dan scroll pulih melalui history |
| Tanpa script | Artikel, footer dan anchor native | Isi tetap lengkap; fallback offset header |
| Konten panjang | Heading/label membungkus | Tidak overflow di 320 px |

Halaman statis tidak mempunyai pengiriman data, loading layanan, hasil pencarian sendiri, konflik penyimpanan, formulir rahasia atau tindakan finansial. State tersebut tidak disimulasikan pada profil. Tautan bantuan menuju halaman yang tersedia.

## Pengembangan dan pemeriksaan

Workbench `tools/preview/about-states.html`, route `/__preview/about`, menyediakan normal, anchor koleksi, fragmen lama, tanpa JavaScript dan teks panjang. Lima pilihan lebar dipisahkan dari alur pengguna produksi.

`node tests/e2e/browser/verify-about.cjs`: **14 kelompok lulus**, sesuai `storage/reports/about/verification.json`. Termasuk lima ukuran 1440/1024/768/390/320, pemuatan empat bobot Poppins, satu H1/main, banner/dua CTA terpusat dan berada di dalam banner, tanpa clipping, lima bagian scroll dua arah, keyboard/skip/direct anchor, Back, konteks Katalog, footer enam halaman, lima kategori, guard Buket Kustom, pencarian global, alias, fallback tanpa JavaScript di lima ukuran dan teks panjang 320 px. Tidak ada pageerror, aset lokal gagal atau HTTP write dalam skenario tersebut.

Seluruh sepuluh capture dibuka: lima viewport awal, artikel penuh desktop/mobile, pembaca aktif, bantuan mobile dan tanpa script. Tidak ada capture kosong atau tidak sesuai nama. Audit statis: **26 ID unik, 6 fragment, 36 aset lokal**, seluruh path link native dan JSON alias valid. Sintaks wrapper/shell/server/test serta `git diff --check` lulus.

Detector Impeccable dijalankan sekali pada HTML/CSS target. Dua peringatan berasal dari shell yang diwarisi: HOT 9 px dan deteksi Inter. Hasil verifikasi FontFace aktual menunjukkan Poppins 400/500/600/700 dimuat pada lima ukuran. Lihat `storage/reports/about/impeccable-detect.json`; ini bukan klaim semua pemeriksaan desain tanpa temuan.

`node tests/e2e/browser/verify-information-pages.cjs`: **7 kelompok regresi lulus**, mencakup Kontak/FAQ/Privasi pada lima ukuran, daftar isi Privasi, keyboard, fallback tanpa script, pencarian dan panel belanja bersama. Total **21 kelompok** pada target dan regresi informasi. Percobaan regresi awal setelah sesi terputus menemui server lokal yang berhenti; server dijalankan kembali dan suite berikutnya lulus. Tidak menganggap percobaan yang gagal itu sebagai kelulusan.

Gate Taste pertama pada halaman ini: **FAIL 43, ronde 2 dari anggaran aktif sebelumnya**, tercatat pada `storage/reports/about/taste-gate.txt`. Aturan hero satu layar, moment dan `.wrap` berbeda dengan pola baca yang dipertahankan, dan masih ada temuan shell bersama terkait navigasi, fokus serta kontras. Tidak ada waiver atau perubahan checker.

Hallmark pertama: **146 FAIL, 67 reflex, 13 WARN**, pada `storage/reports/about/hallmark-render.json`. Empat temuan milik CSS target adalah angka spacing yang memiliki token setara; sudah diganti dengan token proyek bernilai identik. Temuan lain mencakup CSS/header/footer bersama. Hasil fungsi tidak dianggap kelulusan gate marketing atau aksesibilitas seluruh storefront. Pemeriksaan setelah koreksi dan review independen dicatat setelah selesai.

Pemeriksaan akhir setelah koreksi token: suite Tentang Kami kembali **14 kelompok lulus**. Seluruh sepuluh capture mempunyai SHA256 identik sebelum/sesudah, sesuai `capture-token-comparison.json`; nilai serta tampilan jarak tidak berubah. Final Taste: **GATE: OPEN 43 (rounds used up)** dengan 17 WARN, pada `taste-gate-final.txt`. Anggaran gate aktif dipertahankan dari pemeriksaan halaman informasi sebelumnya, tidak direset atau diakali. Tidak ada waiver. Final Hallmark: **142 FAIL, 67 reflex, 13 WARN**, dengan **0 FAIL pada about.css**, pada `hallmark-render-final.json`. Empat temuan spacing target terselesaikan. Gate seluruh halaman tetap belum lulus; kontras/fokus serta navigasi shell yang diwarisi tetap terbuka. Artifak Hallmark awal/akhir dipindahkan keluar document root ke `storage/reports/about/hallmark-artifacts/` dan `hallmark-artifacts-final/`.

Review independen: **disposition: ship** untuk profil Tentang Kami terhadap kontrak Read dan sistem existing. Reviewer membuka seluruh sepuluh capture, memeriksa sumber, PRODUCT.md/DESIGN.md, batas fakta, state, navigasi serta laporan pemeriksaan. Tidak ditemukan perbaikan material dalam cakupan halaman. Laporan lima bagian tersedia pada `storage/reports/about/finish-review.md`. Tidak ada comp/kartu QUALITY BAR terpisah untuk ekstensi ini; penilaian memakai kontrak permukaan dan sistem yang dipertahankan. Verdict tidak menutup temuan shell atau mengklaim seluruh storefront lolos aksesibilitas.

## Integrasi dan batas publikasi

Label pratinjau tetap terlihat. Halaman tidak mengaktifkan database, akun, stok, tarif, pengiriman, gateway atau transaksi produksi. Riwayat usaha, biografi/foto tim, lokasi fisik dan bukti operasional hanya dapat ditambahkan dari materi terverifikasi berikutnya; tidak ada placeholder palsu dalam alur publik. Tidak ada commit, push, publikasi atau deployment dalam pekerjaan ini.
