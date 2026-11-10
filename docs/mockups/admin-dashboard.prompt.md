# Prompt mockup Dashboard Admin RylVa Green

Mode: built-in image_gen. Referensi: DESIGN.md dan docs/specifications/spesifikasi-proyek-v2.6.md, terutama bagian 12.1, 12.5, 12.7, 8.5, dan P-22. Seluruh isi transaksi dan persediaan adalah data ilustrasi.

```text
Use case: ui-mockup
Create one polished, high-fidelity desktop Admin dashboard IMAGE for RylVa Green, an Indonesian florist, custom-bouquet, indoor-plant and gardening-goods store. Flat front-on UI screenshot, wide 16:10 composition, approximately 1920 x 1200 proportions, all content visible and carefully typeset. No laptop frame, no perspective, no photographic scene. This is a design mockup, not an actual operational screenshot.

PRIMARY DESIGN AUTHORITY: RylVa Green DESIGN.md.
Use Poppins for EVERY text element, weights 400, 500, 600, 700. Geometric rounded Poppins letterforms, no serif or secondary font.
Exact brand palette: primary-dark #0F2A1D; primary #375534; primary-light #6B9071; neutral-soft #AEC3B0; page background #FBF7F4; panel background #F8F9FA; secondary metadata #718096; product-image background #CDCFCC. White #FFFFFF for text on dark surfaces. Important small text must be dark green. Botanical, clean, calm, modern and highly usable. Flat quiet panels, thin sage dividers, 12px panel corners, 8px inputs, very restrained shadows. No gradients, purple, neon, glossy effects, decorative graphs, oversized leaves or revenue charts. Botanical character comes from the greens and restrained leaf linework, not decoration crowding the workspace. Use consistent simple outline icons, not emoji.

LAYOUT:
A 232px deep forest-green sidebar with wordmark "RylVa Green" and secondary label "Panel Admin". Sidebar navigation in Indonesian: active "Dashboard" highlighted with a sage background AND slim active indicator; then "Pesanan", "Pengiriman", "Produk & Varian", "Stok & Bahan", "Komplain & Refund", "Laporan Operasional", "Kalender Tutup". Bottom account label "Admin Demo", role "Admin", and "Keluar". No SuperAdmin-only settings, financial reports or account management.
Main area on warm cream background, comfortable 32px padding and consistent 20-24px gaps. Top bar with breadcrumb "Admin / Dashboard", labeled search field "Cari pesanan atau produk", notification icon, and small account initials "AD". No actual personal names or customer details.
Header "Dashboard Admin" in 32px semibold dark green. Subtitle "Pantau pesanan dan tindak lanjut operasional." On right a small period control "Hari ini · WIB" with calendar icon, clearly part of the demonstration.

MANDATORY DEMO DISCLOSURE:
Directly under heading, a full-width highly readable notice with exact text "MOCKUP · DATA ILUSTRASI" and below "Seluruh angka, produk, dan pesanan di layar ini hanya contoh, bukan data toko sebenarnya." Always visible. The footer repeats "Pratinjau desain • Data ilustrasi". All IDs start with DEMO. No growth metrics, no sales claims, no customer counts, no verified-service claims.

FOUR SUMMARY PANELS in one row below disclosure:
1. "Siap Diproses", large "12", supporting text "pesanan contoh", small link "Buka antrean".
2. "Perlu dikirim hari ini", large "8", supporting text "pesanan contoh", small link "Lihat jadwal".
3. "Pembayaran perlu ditinjau", large "3", supporting text "kasus contoh", small link "Lihat kasus".
4. "Stok rendah", large "4", supporting text "SKU contoh · ambang ≤ 5 unit", small link "Periksa stok".
Numbers aligned, labels readable, no little icon tiles above every card. First panel may use dark-green fill with white text for visual hierarchy; others quiet light panels.

CONTENT:
Below, use two main columns, roughly 64% / 36%.

Left upper panel:
Heading "Pesanan perlu diproses", small secondary "Cuplikan data ilustrasi", link "Lihat semua".
A practical spacious 3-row table with headers "Pesanan", "Jadwal kirim", "Status pesanan", "Pembayaran", "Aksi".
Row 1: "DEMO-001" with sublabel "Buket kustom"; "Siang · 12–16 WIB"; badge "Siap Diproses"; badge "Berhasil"; action "Proses".
Row 2: "DEMO-002" with sublabel "Monstera"; "Sore · 16–20 WIB"; badge "Siap Diproses"; text "COD · Menunggu"; action "Proses".
Row 3: "DEMO-003" with sublabel "Paket berkebun"; "Sore · 16–20 WIB"; badge "Siap Diproses"; badge "Berhasil"; action "Proses".
Keep separate column headers for order versus payment. The COD order remains UNPAID despite being ready to process. Use label text and line icons to distinguish status, not color alone.

Left lower panel:
Heading "Pembayaran perlu ditinjau", small label "3 kasus ilustrasi".
Three compact actionable rows:
"DEMO-004" — "PH-03 · Nominal tidak cocok"
"DEMO-005" — "PH-02 · Pembayaran terlambat"
"DEMO-006" — "Selisih rekonsiliasi"
Use a subtle instruction "Penyelesaian rekonsiliasi oleh SuperAdmin." Each row has only "Lihat kasus"; never show a button to mark payment successful, approve reconciliation, or access revenue reports.

Right upper panel:
Heading "Perlu ditindaklanjuti", small label "Contoh antrean".
Four clean stacked task rows with clear task title, owner and time/action:
"PH-06 · Selisih stok" / "Admin Demo · sisa 45 menit" / "Tangani"
"Pengiriman terkendala" / "Admin Demo · sisa 1 jam" / "Lihat"
"Komplain terbuka" / "Admin Demo · sisa 2 jam" / "Tinjau"
"Pembatalan / refund" / "Menunggu keputusan" / "Lihat"
Outline clock or warning icons plus readable text. Do not invent a red brand token. No approval of one's own refund.

Right lower panel:
Heading "Stok rendah", link "Lihat stok".
Compact list/table with "Produk / SKU" and right-aligned "Tersedia".
"Monstera · DEMO-M01" — "2 pot"
"Sirih gading · DEMO-S01" — "3 pot"
"Pot terakota · DEMO-P01" — "4 unit"
"Media tanam · DEMO-T01" — "1 sak"
Bottom caption "Contoh ambang per SKU: 5 unit". All four quantities are <=5. No product photographs are necessary; keep this panel an operational inventory list.

FINISH:
Crisp coherent UI with accurate Indonesian spelling, complete unclipped text, generous but efficient spacing, strong horizontal alignment, useful density, legible tables and obvious actions. Maintain the exact brand colors and Poppins look. The dashboard must feel like practical botanical retail operations, not a marketing landing page. A single finished desktop image, no external annotations or presentation-board title.
```

## Prompt koreksi akhir

Mode: built-in image_gen, edit terhadap hasil pertama. Hasil yang dipilih: `admin-dashboard-desktop.png`.

```text
Edit this RylVa Green dashboard mockup with ONE narrowly scoped color correction. Preserve exactly the entire existing composition, layout, all Indonesian text, all numbers, Poppins typography, icons, spacing, sizes, panels, sidebar, demonstration disclosure, and account information. Change only status accent colors that are outside the approved palette: replace the yellow background of the 'COD · Menunggu' badge with approved neutral-soft #AEC3B0 or panel #F8F9FA, and make its clock icon and text primary-dark #0F2A1D. Replace the amber/orange warning triangle beside 'PH-06 · Selisih stok' and the amber clock beside 'Pengiriman terkendala' with primary-dark #0F2A1D. Replace the small red notification dot near the top-right bell with primary #375534. Status labels and icon shapes remain unchanged so status is still clear. The only UI colors allowed anywhere are #0F2A1D, #375534, #6B9071, #AEC3B0, #FBF7F4, #F8F9FA, #718096, #CDCFCC and white #FFFFFF. Keep every other element unchanged. Output the same single flat wide desktop screenshot with the complete screen visible, no cropping, no outer scene, no additional elements.
```
