# Perbaikan gestur panel Katalog, 16 November 2026

## Perilaku

Panel Filter/Urutkan dapat ditarik turun dari pegangan atau judul. Touch pada
isi filter dan navigasi Kategori dapat menarik panel jika area itu sudah di
posisi paling atas. Saat isi sedang digulir, gerakan tetap menjadi scroll.
Input tidak direbut dari kontrol formulir; tarikan pendek atau terputus kembali
ke posisi awal. Mouse drag pada header mendukung pratinjau ukuran HP.

Keluar memakai animasi turun sebelum menutup native dialog. Versi dismissal
mencegah completion animasi yang terputus memicu Back kedua kali. Reset gerak
membersihkan capture/animasi/style sebelum reopen. Pilihan, URL, fokus pemicu,
form tunggal serta X/Back/Escape dipertahankan. Reduced motion dihormati.

## Berkas

- public/assets/js/storefront/catalog-sheet-motion.js: recognizer touch/pointer,
  batas scroll, springback/dismiss, click suppression dan pembersihan gerak.
- public/assets/js/storefront/catalog-controls.js: animasi close/history guard.
- public/pages/public/catalog.html: memuat modul motion sebelum controls.
- public/assets/css/storefront/catalog.css: hit area pegangan dan state drag.
- tests/e2e/browser/verify-catalog-gestures.cjs: input touch/mouse CDP.

## Verifikasi

Sembilan kelompok tes gestur lulus dengan nol page error: panel mengikuti jari,
retensi pilihan/fokus, springback, touchcancel, scroll asli, pull konten di top,
area navigasi Kategori, panel Urutkan, mouse, 320px/reduced motion/reopen/X.
Sembilan belas kelompok regresi Katalog lulus kembali dengan nol page error.
Assertion Browse yang mengunci enam kartu diperbaiki untuk mengizinkan batch
awal atau delapan hasil setelah auto-append, dengan pemeriksaan keunikan tetap.
node --check pada kedua controller dan tes, serta git diff --check lulus.

Bukti lokal: storage/reports/catalog-gestures/verification.json,
filter-mid-drag.png dan filter-reopened-320.png; regresi tetap di
storage/reports/catalog-interactions/verification.json. Touch/mouse diuji lewat
Chrome mobile emulation; perangkat iOS fisik belum diuji.

Review independen disposition ship pada source/capture yang ditinjau; tidak
menemukan perbaikan material tambahan. Ini batas scope gestur, bukan klaim
semua gate marketing, aksesibilitas atau integrasi produksi telah lulus.
