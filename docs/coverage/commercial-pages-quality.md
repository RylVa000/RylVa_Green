# Pemeriksaan kualitas halaman komersial

GATE: FAIL 42 (round 2 of 3). Pemeriksaan Taste mewakili Koleksi Baru; tidak ada waiver, perubahan checker, atau klaim lulus visual otomatis.

Tanggal: 20 November 2026. Ketiga halaman merupakan perluasan Catalog/informasi existing. Banner, header/footer, Poppins, kartu produk, dan perilaku responsif dipertahankan sesuai permintaan pengguna.

## Hasil dan batas pemeriksaan

- Fungsional: 14 kelompok pemeriksaan target lulus, 19 Katalog, 13 Detail Produk, 7 halaman informasi, 17 Buket Kustom; total 70. Tidak ada pageerror atau request mutasi pada pengujian target.
- Dua puluh capture pada lima lebar dan state tambahan dibuka satu per satu. Reviewer awal meminta satu perbaikan keterbacaan harga panjang. Setelah koreksi CSS lokal, pengujian target kembali lulus dan menghasilkan 20 capture; tiga bukti yang diminta reviewer (harga panjang dan dua daftar normal pada 320px) diperiksa kembali. Harga panjang minimal 14px, unit 12px pada baris berikutnya, nilai lengkap dan tidak overflow.
- Impeccable detect sekali: 28 temuan (14 advisory warna, 8 advisory radius, 3 warning font, 3 warning HOT 9px). Warning font mentah menyebut `Primary font: inter`, sedangkan sumber, DESIGN.md dan capture memakai Poppins: perbedaan detector dicatat, bukan dinyatakan lulus. Drift bawaan dilaporkan tanpa mengubah DESIGN.md.
- Hallmark render pada tiga URL dan CSS baru: 29 FAIL, 16 REFLEX, 10 WARN. Laporan mentah hallmark-render.txt tetap terbuka. Tidak dinyatakan lulus.
- Copy lint pada ketiga route: 0 FAIL, 0 WARN. Nada: instruksi belanja dan kontak singkat, langsung, tanpa janji program atau promosi produksi.
- Performance tiga route, masing-masing desktop/mobile dengan tiga sampel: masing-masing 38 PASS, 4 FAIL, 6 WARN. FAIL adalah sekitar 1600 KiB enam font Poppins existing serta aset footer/logo/social di bawah layar yang belum lazy. WARN mencakup transfer, jumlah font dan dimensi logo. Ini pengukuran headless lokal, bukan data lapangan.
- Provenance scan direktori aset produk dan storefront: 28 raster, 0 metadata hilang. Tidak membuat raster/placeholder/foto/mitra buatan.
- Syntax 11 file JS/CJS dan git diff --check lulus.
- Review awal independen menemukan satu masalah harga panjang. Verdict pass setelah koreksi: `ship`, satu temuan dinilai `Resolved`. Verdict ini mencakup perbaikan yang dinilai, bukan sertifikasi seluruh storefront atau penutupan raw gate.

## Mengapa raw gate belum hijau

Aturan marketing seperti hero satu layar penuh, heading rata kiri, .wrap tunggal, larangan kartu dan dua CTA tidak sesuai kontrak perluasan katalog/task dan artikel Read. Hasil tersebut dipertahankan sebagai temuan mentah, bukan dihapus atau di-waive. Sidebar yang dapat digulir dan dialog yang tertutup juga memicu heuristik layout.

Kontras teks kecil di header/footer, badge HOT kecil, batas search field dan navigasi kategori horizontal adalah kekhawatiran nyata pada komponen shared incumbent. Pengguna meminta header/footer dan identitas di luar cakupan dipertahankan; laporan ini tidak menyatakan seluruh storefront aksesibel atau siap produksi. Perbaikan sistem bersama perlu cakupan tersendiri.

## Semua temuan Taste yang masih terbuka

| No. | Check | Lebar | Target | Temuan mentah |
| --- | --- | --- | --- | --- |
| 1 | hero-fill | 1440 | aside#catalog-filter-panel "Filter Produk Reset Kategori Tanaman Hia" | the next section shows on the first screen: it starts at 474px on a 900px screen (the hero ends at 458px) |
| 2 | nav | 1440 | div.storefront-utility > div.storefront-shell-container.storefront-utility-inner > nav.storefront-utility-links > button "Lacak Pesanan" | "Lacak Pesanan" sits outside the nav bar header.storefront-shell.storefront-header > nav.storefront-categories (0-1440px) |
| 3 | nav | 1440 | div.storefront-utility > div.storefront-shell-container.storefront-utility-inner > nav.storefront-utility-links > a.storefront-page-link:nth-of-type(1) "Pusat Bantuan" | "Pusat Bantuan" sits outside the nav bar header.storefront-shell.storefront-header > nav.storefront-categories (0-1440px) |
| 4 | nav | 1440 | div.storefront-utility > div.storefront-shell-container.storefront-utility-inner > nav.storefront-utility-links > a.storefront-page-link:nth-of-type(2) "Mitra Florist" | "Mitra Florist" sits outside the nav bar header.storefront-shell.storefront-header > nav.storefront-categories (0-1440px) |
| 5 | nav | 1440 | header.storefront-shell.storefront-header > div.storefront-main > div.storefront-shell-container.storefront-main-inner > button.storefront-logo | "" sits outside the nav bar header.storefront-shell.storefront-header > nav.storefront-categories (0-1440px) |
| 6 | nav | 1440 | form#storefront-search > button.storefront-search-action | "" sits outside the nav bar header.storefront-shell.storefront-header > nav.storefront-categories (0-1440px) |
| 7 | nav | 1440 | div.storefront-main > div.storefront-shell-container.storefront-main-inner > nav.storefront-account-links > button.storefront-account-action:nth-of-type(1) "Akun" | "Akun" sits outside the nav bar header.storefront-shell.storefront-header > nav.storefront-categories (0-1440px) |
| 8 | nav | 1440 | div.storefront-main > div.storefront-shell-container.storefront-main-inner > nav.storefront-account-links > button.storefront-account-action:nth-of-type(2) "Wishlist" | "Wishlist" sits outside the nav bar header.storefront-shell.storefront-header > nav.storefront-categories (0-1440px) |
| 9 | nav | 1440 | div.storefront-main > div.storefront-shell-container.storefront-main-inner > nav.storefront-account-links > button.storefront-account-action:nth-of-type(3) "2 Keranjang" | "2 Keranjang" sits outside the nav bar header.storefront-shell.storefront-header > nav.storefront-categories (0-1440px) |
| 10 | overlap-text | 1440 | footer.storefront-shell.storefront-footer "Menghadirkan kesegaran alam dan keindaha" | lies over the text "Semua diskon" (label.catalog-choice:nth-of-type(1) > span) |
| 11 | cta | 1440, 390 | main#home-main > header.policy-banner | the hero has no button (the nav's does not count) |
| 12 | cta | 1440, 390 | main#home-main > div.home-main.catalog-main > section.catalog-content "Produk dalam koleksi" | the last section before the footer ends with no button |
| 13 | text-contrast | 1440 | div.storefront-shell-container.storefront-main-inner > nav.storefront-account-links > button.storefront-account-action:nth-of-type(1) > span "Akun" | a caption, label or muted line in #f8f9fa on #6b9071 reads 3.4:1 (needs 4.5:1); 3 like it, like "Wishlist", "Keranjang" |
| 14 | text-contrast | 1440, 390 | nav.storefront-categories > div.storefront-shell-container.storefront-category-links > a.storefront-promo.storefront-page-link > span:nth-of-type(1) "Promo Spesial" | a caption, label or muted line in #f44949 on #375534 reads 2.35:1 (needs 4.5:1) |
| 15 | text-contrast | 1440, 390 | nav.storefront-categories > div.storefront-shell-container.storefront-category-links > a.storefront-promo.storefront-page-link > span.storefront-hot "HOT" | a caption, label or muted line in #ffffff on #f44949 reads 3.56:1 (needs 4.5:1) |
| 16 | text-contrast | 1440 | footer.storefront-shell.storefront-footer > div.storefront-footer-container.storefront-footer-grid > div.storefront-footer-column.storefront-contact > h2 "Kontak RylVa" | a caption, label or muted line in #ffffff on #6b9071 reads 3.59:1 (needs 4.5:1); 18 like it, like "Menghadirkan kesegaran", "Beranda", "Semua Produk" |
| 17 | field-label | 1440 | input#storefront-search-input | a input[type=search] without a label you can see: its <label> is hidden |
| 18 | focus-visible | 1440 | form#storefront-search > button.storefront-search-action "Cari produk" | Tab stop 7, button "Cari produk": its focus change is faint: 1.03:1 against the ground, 3:1 needed |
| 19 | moment-none | 1440 | (the page) | a place page (--type) deals no moment: every kind carries one, two on a long page (moments.md) |
| 20 | hero-screen | 1440 | main#home-main > header.policy-banner "Beranda / Katalog / Koleksi Baru Koleksi" | the hero ends at 458px on a 900px screen, 442px above the fold: it ends at the fold, 1px either way (SR-1) |
| 21 | hero-screen | 1440 | main#home-main > div.home-main.catalog-main "Filter Produk Reset Kategori Tanaman Hia" | 442px of the next section shows on the first screen (from 458px on a 900px screen): nothing below the hero shows at load (SR-1) |
| 22 | section-height | 1440 | footer.storefront-shell.storefront-footer "Menghadirkan kesegaran alam dan keindaha" | the section is 233px tall (0.3 screens), 667px short of one screen (900px): every section after the hero is one screen or two, 2px either way (SR-2) |
| 23 | section-height | 1440 | main#home-main > div.home-main.catalog-main "Filter Produk Reset Kategori Tanaman Hia" | the section is 778px tall (0.9 screens), 122px short of one screen (900px): every section after the hero is one screen or two, 2px either way (SR-2) |
| 24 | one-section | 1440 | h1#catalog-title "Koleksi Baru" | the screen at scroll 0px (stride 0) shows 254px of section 1 and the heading of section 1 whole and the content of 2 sections, over 24px each beside section 2: a screen shows one section (another may peek 8px, 24px WARN) (SR-4) |
| 25 | one-section | 1440 | h2#footer-explore "Jelajahi RylVa" | the screen at scroll 458px (the top of section 2) shows 106px of section 3 and the heading of section 3 whole and the content of 2 sections, over 24px each beside section 2: a screen shows one section (another may peek 8px, 24px WARN) (SR-4) |
| 26 | one-section | 1440 | main#home-main > header.policy-banner "Beranda / Katalog / Koleksi Baru Koleksi" | the screen at scroll 204px (the top of section 1) shows 78px of section 1 and the content of 2 sections, over 24px each beside section 2: a screen shows one section (another may peek 8px, 24px WARN) (SR-4) |
| 27 | one-heading | 1440 | h2#footer-help "Bantuan RylVa" | the section holds 4 h2 headings: one per section, first in its .wrap (SR-5) |
| 28 | container-edges | 1440 | footer.storefront-shell.storefront-footer "Menghadirkan kesegaran alam dan keindaha" | the content of section 3 runs 48px from the left and 48px from the right (read from its outermost blocks: no .wrap): the page's container starts at 75px; the margin is 64-120px at 1440px (one container, equal margins, 2px either way) (SR-6) |
| 29 | container-edges | 1440 | header.storefront-shell.storefront-header "Pilihan kurir sesuai alamat Pantau statu" | the nav's content runs 72px from the left and 72px from the right (read from its outermost blocks: no .wrap): the page's container starts at 75px (one container, equal margins, 2px either way) (SR-6) |
| 30 | container-edges | 1440 | a.skip-link "Lewati ke isi utama" | a <a> at the top of the page, outside header.nav, main, footer.closing and nav.actionbar (SR-6) |
| 31 | container-edges | 1440 | header.storefront-shell.storefront-header > div.storefront-utility "Pilihan kurir sesuai alamat Pantau statu" | a box runs 0-1440px, outside the container lines of the nav at 75-1365px: full width is for background layers and grounds only (SR-6) |
| 32 | container-edges | 1440 | header.storefront-shell.storefront-header > div.storefront-main "Cari produk dalam Koleksi Baru Akun 0Wis" | a box runs 0-1440px, outside the container lines of the nav at 75-1365px: full width is for background layers and grounds only (and 4 more like it: "Koleksi Baru Promo Spesi", "© 2026 RylVa Green. All ", "Pupuk & Nutrisi") (SR-6) |
| 33 | container-edges | 1440 | footer.storefront-shell.storefront-footer > div.storefront-footer-container.storefront-footer-grid > div.storefront-footer-column.storefront-contact > h2 "Kontak RylVa" | the h2 starts 993px right of the container's left: every h1 and h2 starts on it, 2px either way (and 4 more like it: "Informasi RylVa", "Bantuan RylVa", "Jelajahi RylVa") (SR-6) |
| 34 | container-edges | 1440 | footer.storefront-shell.storefront-footer > div.storefront-copyright "© 2026 RylVa Green. All Rights Reserved" | a box over half the container wide runs 0-1440px, not on the container's lines at 48-1392px (SR-6) |
| 35 | row-lines | 1440 | div#catalog-products "-1% Peace Lily Tersedia Tanaman berbunga" | a row of 2 items: its first item starts at 416px, the container's left line at 75px (2px either way) (SR-7) |
| 36 | row-lines | 1440 | header.storefront-shell.storefront-header > nav.storefront-categories > div.storefront-shell-container.storefront-category-links "Koleksi Baru Promo Spesial HOT Buket Kus" | a sideways scroller: 5px of it hidden behind overflow-x: auto (SR-7) |
| 37 | hero-fill | 390 | main#home-main > div.home-main.catalog-main > section.catalog-content "Produk dalam koleksi" | the next section shows on the first screen: it starts at 476px on a 844px screen (the hero ends at 469px) |
| 38 | no-visual | 390 | main#home-main > div.home-main.catalog-main > section.catalog-content "Produk dalam koleksi" | pictures, effects and mocks cover 14% of this section; a feature section needs a visual (about 25% or more) |
| 39 | text-contrast | 390 | footer.storefront-shell.storefront-footer > div.storefront-footer-container.storefront-footer-grid > div.storefront-about > p.storefront-description "Menghadirkan kesegaran alam dan keindaha" | a caption, label or muted line in #ffffff on #6b9071 reads 3.59:1 (needs 4.5:1); 9 like it, like "Jelajahi RylVa", "Bantuan RylVa", "Informasi RylVa" |
| 40 | nav | 1280 | header.storefront-shell.storefront-header > nav.storefront-categories > div.storefront-shell-container.storefront-category-links > a.storefront-page-link:nth-of-type(8) "Pupuk & Nutrisi" | "Pupuk & Nutrisi" sits outside the nav bar header.storefront-shell.storefront-header > nav.storefront-categories |
| 41 | nav | 1152 | header.storefront-shell.storefront-header > nav.storefront-categories > div.storefront-shell-container.storefront-category-links > a.storefront-page-link:nth-of-type(7) "Alat Berkebun" | "Alat Berkebun" sits outside the nav bar header.storefront-shell.storefront-header > nav.storefront-categories |
| 42 | container | 1440, 390 | page | no .wrap |

## Berkas bukti

Seluruh laporan mentah tersedia di storage/reports/commercial-pages/: functional.txt, verification.json, catalog-regression.txt, product-regression.txt, information-regression.txt, bouquet-regression.txt, impeccable-detect.json, hallmark-render.txt, taste-gate.txt, perf-*.json, copy-*.txt, provenance.txt. Hasil reviewer independen dicatat di finish-review.md.
