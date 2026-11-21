# Syarat dan Ketentuan — cakupan UI

19 November 2026. Implementasi mengikuti [spesifikasi permukaan](../design/surfaces/terms-conditions-surface.md), baseline v2.6 dan sistem informasi existing. Mode **Read**; tidak ada perubahan tema, framework, kontrak pembayaran atau hak akses.

## Halaman dan penautan

- Route `/pages/public/terms-conditions.html`; alias `/terms-conditions.html` dan `/syarat-ketentuan.html`.
- Delapan bagian: layanan/akun; produk/harga/stok; pemesanan/buket; pembayaran; pengiriman/penerima; pembatalan/refund/komplain; data/privasi; bantuan/pembaruan ketentuan. Tautan mengarah ke Informasi Pengiriman, Pembatalan & Refund, Kebijakan Privasi, Kontak dan FAQ yang sudah ada.
- Footer bersama menuju route ini. Registrasi mempertahankan dialog existing dan menambahkan tautan dokumen asli di tab baru. Tautan Kebijakan Privasi pada dialog juga menuju halaman yang tersedia. Disclosure risiko Checkout mempunyai tautan Syarat dan Ketentuan serta Pembatalan & Refund di tab baru.
- Link tab baru menyebut perilakunya dan memakai `noopener`. Formulir asal tidak ditinggalkan, kata sandi tidak diserialisasi untuk membaca dokumen, dan persetujuan tidak dicentang otomatis. Refresh quote saat tab Checkout kembali terlihat tetap mengikuti perilaku existing, termasuk persetujuan ulang jika rincian berubah.

## Komponen dan interaksi

Header/footer, logo/ikon, pencarian Katalog, panel akun/Wishlist/Keranjang, Poppins dan token existing dipertahankan. Artikel, callout, navigasi, spacing pembaca dan fokus menggunakan `shipping-information.css` serta `information-article.js`. Wrapper baru hanya menetapkan ID/key konteks dan sumber kembali yang diizinkan. `information-policy.css` membatasi penyesuaian banner/heading pada target. Stylesheet Pembatalan & Refund tetap utuh; percobaan penggantian penuh ditolak review persetujuan otomatis dan ditinggalkan, diganti pendekatan target yang lebih terbatas.

Daftar isi sticky desktop mengikuti header; mobile memakai disclosure dalam alur. Penanda aktif mengikuti scroll dua arah dengan tepat satu `aria-current`, tanpa mengubah URL/fokus/history. Anchor keyboard memfokuskan heading dengan jarak navbar. Fragmen tak dikenal kembali ke pembuka; skip link yang sah tetap dihormati. Browser Back dari bantuan memulihkan posisi dan disclosure. Kembali ke sumber Keranjang/Checkout dibatasi same-origin/path yang diizinkan dan history yang cukup; tab dokumen baru tidak menampilkan kontrol kembali yang berpura-pura memulihkan formulir asal.

Artikel, anchor dan link inti tersedia tanpa JavaScript. Pemeriksaan render menemukan judul native anchor sedikit tertutup header pada mobile tanpa pengukuran JavaScript; fallback `information-policy-no-script.css` khusus target menyediakan ruang header responsif, mempertahankan sticky header existing. Tidak membuat state loading/kegagalan API, pengajuan transaksi, form rekening, unggahan atau kontrol persetujuan di artikel statis ini. Workbench `/__preview/terms-conditions` berada di `tools/preview/`, terpisah dari source publik, untuk kondisi normal, anchor langsung, fragmen lama, tanpa JavaScript dan teks panjang pada lima ukuran layar.

## Pemeriksaan implementasi

`verify-terms-conditions.cjs` lulus 14 kelompok: layout dan empat font Poppins yang benar-benar loaded pada 1440/1024/768/390/320 px; seluruh delapan bagian scroll dua arah tanpa perubahan history; anchor/skip/fallback; disclosure mobile dan pemulihan baca; pembukaan dokumen registrasi tanpa kehilangan isian/menulis kata sandi ke storage/mencentang consent; Checkout mempertahankan quote setelah revalidasi tab dan consent yang belum dicentang; konteks kembali satu tab setelah beberapa anchor; footer enam halaman; pencarian Katalog; dua alias; native anchor melewati header tanpa JavaScript pada kelima ukuran; serta workbench teks panjang 320 px. Tidak ada pageerror, resource lokal gagal atau permintaan HTTP yang menulis data pada skenario tersebut.

Regresi `verify-customer-auth.cjs` lulus 11 kelompok termasuk 31 state pengembangan, validasi, OTP, pencegahan submit ganda, penjaga perubahan belum disimpan, dialog/fokus dan penyimpanan rahasia. Hasil browser dan capture target berada di `storage/reports/terms-conditions/`.

Regresi `verify-checkout.cjs` lulus 17 kelompok/34 state, termasuk perubahan harga dan consent, submit/idempotensi, COD belum dibayar, input yang dipertahankan saat gagal serta sembilan lebar viewport. `verify-information-pages.cjs` lulus 6 kelompok untuk Kontak/FAQ/Privasi dan interaksi shell.

Regresi Pembatalan & Refund lulus 14 kelompok. Stylesheet panduan tersebut tetap utuh; ID, history key dan perilaku pembacanya tidak diubah oleh penambahan halaman ini. Sintaks JavaScript, markup workbench, ID unik, aset/link lokal, fragmen, konfigurasi alias dan tautan dokumentasi turut diperiksa.

Review mandiri membuka 12 capture dan memeriksa sumber utama. Satu temuan material adalah penanda footer yang terbawa dari panduan Refund. Perbaikan menghapus penanda current pada Refund dan menulis link native Syarat dan Ketentuan dengan tujuan serta `aria-current="page"` yang benar. Pengujian target dijalankan ulang dan tetap lulus 14 kelompok, kini mencakup marker/link footer pada kelima ukuran dengan dan tanpa JavaScript. Semua capture disegarkan dan dibuka kembali. Verdict lanjutan **ship** berlaku untuk perbaikan footer yang dinilai, tanpa regresi dari batch tersebut; bukan klaim seluruh gate atau integrasi produksi lulus.

### Catatan gate desain

Impeccable dijalankan satu kali dan mencatat 9 temuan pada dependensi existing: HOT 9 px, deklarasi Inter, variasi radius/warna shell, latar banner dan warna bagian aktif. Empat Poppins FontFace benar-benar loaded pada lima viewport dalam pengujian browser; deklarasi Inter bukan bukti fallback yang terlihat. Identitas yang diminta tetap dipertahankan.

Hallmark render berhasil dijalankan: laporan `hallmark-render.json` mencatat **140 FAIL, 63 REFLEX, 13 WARN** dari gabungan halaman dan stylesheet bersama. Tidak ada FAIL yang menunjuk stylesheet target baru. Temuan mencakup literal warna/token, skala/spacing existing, kontras header/footer, field pencarian dan aturan global lain. Outline putih di banner hijau ditandai REFLEX dan dipertahankan untuk fokus yang terlihat. Peringatan preload font ditinjau terhadap bukti FontFace.loaded tersebut. Capture tooling dipindahkan ke direktori laporan `hallmark-artifacts/`, bukan source halaman publik.

Taste gate awal halaman ini mencatat **FAIL 43, round 2 of 3** pada `taste-gate.txt`: hero-fill, nav, no-visual, button-styles, cta, copy-fact, text-contrast, field-label, focus-visible, moment-none, hero-screen, section-height, one-section, one-heading, container-edges, row-lines, flush, off-grid dan container. Persyaratan foto/moment/hero satu layar dan kelas template pemasaran bertentangan dengan kontrak artikel Read dan pembatasan tema dari pengguna. Temuan shell tetap dicatat; tidak diklaim telah diperbaiki oleh penambahan artikel. Tidak ada waiver luas untuk menyembunyikan laporan.

Setelah koreksi semantik footer dan pemeriksaan target ulang, hasil akhirnya **GATE: OPEN 43 (rounds used up)** pada `taste-gate-final.txt`. Semua 43 temuan dan 22 WARN tetap ada pada laporan tersebut; tidak ada waiver baru. Ini bukan hasil gate hijau. Pemeriksaan fungsi, rendering target dan verdict footer dilaporkan terpisah pada cakupannya masing-masing.

## Batas isi dan integrasi

Revisi tampilan 19 November: judul dan deskripsi banner dipusatkan sesuai contoh pengguna, konsisten dengan Pembatalan & Refund. Breadcrumb tetap di kiri. Pemeriksaan render dua halaman pada 1440/1024/768/390/320 px lulus untuk pusat teks, warna, posisi breadcrumb dan tidak adanya overflow. Bukti `storage/reports/policy-banner-alignment/`; gate desain terdahulu tidak dijalankan ulang untuk koreksi alignment ini.

Revisi bantuan berikutnya: margin tombol sekunder yang diwarisi dari artikel dihapus khusus pada kelompok `.shipping-help-actions`, sama seperti tombol utama. Kedua tombol kini sejajar atas/bawah pada desktop dan sama lebar dengan gap kelompok pada mobile. Bukti geometris dan capture di `storage/reports/policy-consistency/`. Regresi halaman tetap lulus 14 kelompok setelah pembaca bersama mendukung daftar isi Privasi tanpa tautan kembali opsional.

Naskah memakai aturan proyek, termasuk keranjang tidak mencadangkan stok; validasi ulang harga/stok; verifikasi pembayaran; pemisahan COD/pesanan; risiko berbasis sebab dan bukti; pengecualian dana belum dibayar; komplain 24 jam sejak Terkirim sebelum konfirmasi penerimaan; foto 2 sampai 5 kecuali Tidak diterima; serta pemrosesan refund 3 hari kerja sejak persetujuan. Tidak membuat ketentuan hukum yurisdiksi, denda, batas usia, pembebasan tanggung jawab atau jaminan operasional baru.

Naskah diberi label **pratinjau**; versi dan tanggal efektif belum diterbitkan. Tanggal implementasi bukan tanggal berlaku. Persetujuan registrasi/Checkout pada UI contoh bukan perjanjian atau transaksi produksi. Publikasi naskah final, pencatatan versi/waktu persetujuan oleh server, backend transaksi, provider dan review konsistensi Privasi impor belum ditangani oleh perubahan ini. Tidak ada commit, push, deployment atau endpoint baru.
