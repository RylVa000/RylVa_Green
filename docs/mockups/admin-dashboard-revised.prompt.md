# Revisi empat temuan critique

Hasil akhir: `admin-dashboard-desktop-revised.png`. Pemeriksaan visual mengonfirmasi informasi pesanan tertua dan usia antrean, penanda Hari ini, pemilik/tenggat refund, tiga kelompok navigasi, dan pengungkapan ilustrasi global. Versi sebelumnya dipertahankan sebagai riwayat. Seluruh perbaikan berlaku pada mockup raster desktop; interaksi dan aksesibilitas implementasi belum diuji.

Mode: built-in image_gen, edit. Sumber: admin-dashboard-desktop-polished.png. Seluruh angka dan waktu tetap ilustrasi. Asumsi urutan antrean: tenggat kirim terdekat, lalu usia menunggu. Lingkup: keempat temuan snapshot 2026-10-28T10-59-58Z.

```text
Use case: ui-mockup edit, RylVa Green Admin dashboard.
EDIT TARGET: supplied polished desktop dashboard image. Address four critique findings while preserving its established visual identity and content. Output one high-resolution flat desktop screenshot, same wide aspect ratio, fully visible without cropping. No browser/device frame or surrounding scene.

PRESERVE: Poppins typography throughout; botanical green/cream identity; sidebar wordmark and plant icon; title "Dashboard Admin"; subtitle "Pantau pesanan dan tindak lanjut operasional."; header search and account; four metric panels with values 12, 8, 3, 4; order IDs DEMO-001 through DEMO-006; products, stock quantities and payment-review cases; separate order/payment columns; COD remains unpaid; roles and all eight existing navigation destinations. Keep all artwork and alignments crisp, text legible, no clipped words.

COLOR AUTHORITY DESIGN.md: primary-dark #0F2A1D, primary #375534, primary-light #6B9071, neutral-soft #AEC3B0, warm background #FBF7F4, panels #F8F9FA, optional metadata #718096, product frame #CDCFCC, white #FFFFFF. Important small metadata is dark green. No additional red/amber/yellow/blue/purple accents, no gradients, no charts. Rounded 12px panels, fine dividers, quiet flat fills. Keep all other composition choices from reference.

REQUIRED CHANGE 1 — VISIBLE QUEUE PRIORITY:
Top first metric remains "Siap Diproses", number "12"; replace its "pesanan contoh" descriptor with "Tertua: DEMO-001 · 4 jam". Put this descriptor on a clean separate line beneath the number, with its action "Buka antrean" below. Make all metric number baselines and action baselines align.
Second metric: "Perlu dikirim hari ini", number "8", descriptor "Jatuh tempo hari ini", action "Lihat jadwal".
Third: "Pembayaran perlu ditinjau", number "3", descriptor "Kasus perlu diperiksa", action "Lihat kasus".
Fourth: "Stok rendah", number "4", descriptor "SKU perlu diperiksa", action "Periksa stok".

Main order panel keeps heading "Pesanan perlu diproses". Replace subtitle "Cuplikan data ilustrasi" with "Cuplikan · urut tenggat kirim, lalu usia antrean".
Keep five columns "Pesanan", "Jadwal kirim", "Status pesanan", "Pembayaran", "Aksi", with 3 rows:
Row 1 order cell: bold "DEMO-001", then "Buket kustom", then "Menunggu 4 jam". Schedule cell: clear bold outlined label "Hari ini", below "Siang · 12–16 WIB". Order state "Siap Diproses"; payment "Berhasil"; action "Proses".
Row 2 order cell: bold "DEMO-002", then "Monstera", then "Menunggu 2 jam". Schedule cell "Hari ini", then "Sore · 16–20 WIB". Order state "Siap Diproses"; payment "COD · Menunggu"; action "Proses".
Row 3 order cell: bold "DEMO-003", then "Paket berkebun", then "Menunggu 1 jam". Schedule "Hari ini", then "Sore · 16–20 WIB". Order state "Siap Diproses"; payment "Berhasil"; action "Proses".
Provide row height for these extra metadata lines; increase upper row of main content if necessary, reduce nonessential white space elsewhere, while fitting all panels. Prioritize readable text over shrinking it. Three rows stay ordered nearest shipping deadline first, then longest waiting. No customer data is needed.

REQUIRED CHANGE 2 — COMPLETE REFUND DEADLINE, VISIBLE OVERDUE EXAMPLE:
Keep right panel "Perlu ditindaklanjuti". Replace subtitle "Contoh antrean" with "Terlambat didahulukan".
Reorder the SAME four tasks by urgency and show every owner/deadline:
First task "Pembatalan / refund"; subline "Admin Demo · Lewat 15 menit"; a distinct outlined warning/clock icon plus bold text "Lewat 15 menit", action "Lihat". It is an illustrative overdue decision; never add automatic approval or mark payment paid.
Second task "PH-06 · Selisih stok"; "Admin Demo · sisa 45 menit"; action "Tangani".
Third task "Pengiriman terkendala"; "Admin Demo · sisa 1 jam"; action "Lihat".
Fourth task "Komplain terbuka"; "Admin Demo · sisa 2 jam"; action "Tinjau".
Use flat rows with fine sage separators, consistent outlined icons, aligned buttons. Make overdue meaning explicit in words and icon, using the approved green palette only. All displayed owners and times are illustrative.

REQUIRED CHANGE 3 — GROUP EXISTING SIDEBAR MENU:
Keep "Dashboard" first and active. Under it, divide the existing destinations with readable, restrained navigation group labels and spacing:
Group "Operasional": "Pesanan", "Pengiriman", "Komplain & Refund".
Group "Katalog & stok": "Produk & Varian", "Stok & Bahan".
Group "Laporan & jadwal": "Laporan Operasional", "Kalender Tutup".
Do not add destinations. Keep bottom account "Admin Demo", role "Admin", and "Keluar". Group labels are functional navigation labels, not decorative numbered headings. Fit all navigation above account footer.

REQUIRED CHANGE 4 — ONE STRONG DEMO DISCLOSURE, CLEANER LOCAL LABELS:
Preserve the prominent global banner exactly:
"MOCKUP · DATA ILUSTRASI"
"Seluruh angka, produk, dan pesanan di layar ini hanya contoh, bukan data toko sebenarnya."
Keep all DEMO IDs and footer "Pratinjau desain • Data ilustrasi".
Remove repetitive local words "pesanan contoh", "kasus contoh", "SKU contoh", "Cuplikan data ilustrasi", and "Contoh antrean", using the replacement labels specified above.
Payment-review panel remains "Pembayaran perlu ditinjau"; change subtitle to "3 kasus perlu ditinjau". Preserve its 3 cases:
DEMO-004 PH-03 · Nominal tidak cocok
DEMO-005 PH-02 · Pembayaran terlambat
DEMO-006 Selisih rekonsiliasi
Preserve "Lihat kasus" actions and note "Penyelesaian rekonsiliasi oleh SuperAdmin."
Low-stock panel preserves 4 rows with quantities "2 pot", "3 pot", "4 unit", "1 sak" and existing product names and DEMO SKUs. Refine footnote to "Ambang: 5 per SKU, sesuai satuan jual" for clarity.

No invented actual store records or claims. These new example times remain covered by the prominent global disclosure. This is a static desktop mockup only. Final polish must preserve accurate Indonesian spelling, align all columns, avoid overly faint metadata and ensure every requested change is visible in one complete screen.
```

## Koreksi akhir palet dan duplikasi tenggat

```text
Make a tightly scoped correction to the provided revised RylVa Green dashboard image. Preserve absolutely everything else: desktop layout, all panels and numbers, priority order table, Hari ini labels, waiting ages, grouped sidebar, Poppins, botanical identity, demo disclosure, stock rows, all existing text and icons. Only correct the first row in Perlu ditindaklanjuti, titled Pembatalan / refund: replace the pale pink/red overdue badge 'Lewat 15 menit' with approved neutral-soft #AEC3B0 background and primary-dark #0F2A1D text and clock outline. It must contain no red, pink, amber, yellow or other unapproved accent. Keep the badge words exactly 'Lewat 15 menit'. In that row's secondary owner line replace 'Admin Demo · Lewat 15 menit' with just 'Admin Demo', so the deadline appears only once, in the badge. Keep the 'Lihat' action and warning/clock icon. Do not alter any other text, alignment, palette, UI element or image dimensions. Output the same complete flat desktop screenshot, all edges visible, no crop.
```
