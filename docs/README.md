# Dokumentasi RylVa Green

[Rencana pengerjaan setelah audit UI](implementation-schedule.md) memuat jadwal awal M0–M8, ketergantungan, sasaran antara, dan rincian pekan pertama mulai 23 November 2026.

Kemajuan awal 21 November: [audit dan fondasi backend M0](coverage/backend-foundation-m0.md), [runbook PHP/MySQL lokal](runbook/local-foundation.md), serta [keputusan teknis ADR-002](adr/ADR-002-local-backend-foundation.md). Fondasi lokal terverifikasi; CI/adapter/staging dan integrasi bisnis tetap dicatat terpisah.

Lanjutan hari yang sama: [CI, kontrak/mock adapter dan Apache staging lokal](coverage/m0-ci-adapters-staging.md), [kontrak integrasi](architecture/integration-contracts.md), [runbook CI/staging](runbook/ci-and-staging.md), serta [backlog implementasi](implementation-backlog.md). Workflow remote dan hosting online tetap memerlukan bukti eksekusi tersendiri.

Hosting PHP 8.2: [hasil kompatibilitas yang dijalankan](coverage/php82-hosting-compatibility.md), [pemasangan langsung melalui FTP](runbook/hosting-installation-plan.md), dan [routing query Dza Software](runbook/dza-nginx-routing.md). Akses folder privat dan entry point PHP sudah berjalan; mode query mengatasi larangan perubahan Nginx. Installer/probe sementara tidak digunakan.

[Staging online siap ditinjau](coverage/hosting-staging-online.md): 54 dokumen dan 19 kelompok pemeriksaan HTTP/render/navigasi lulus pada domain HTTPS. Database hosting dan modul transaksi tetap belum diintegrasikan.

| Direktori | Isi |
| --- | --- |
| `specifications/` | Spesifikasi bisnis dan batas v2.6 |
| `architecture/` | Struktur direktori dan manifest pemindahan |
| `coverage/` | Cakupan implementasi/prototipe per modul |
| `design/surfaces/` | Brief, struktur, state dan keputusan desain tiap permukaan |
| `design/decisions/` | Catatan perubahan desain lintas peran |
| `design/archive/` | Acuan desain lama yang telah digantikan |
| `design/` | Referensi visual desain |
| `mockups/` | Prompt dan referensi mockup |
| `adr/` | Keputusan/perubahan baseline proyek |
| `runbook/` | Tempat panduan operasional/deployment |

Mulai dari [cakupan halaman staf](coverage/staff-ui-completion.md), [struktur proyek](architecture/project-structure.md), dan [spesifikasi v2.6](specifications/spesifikasi-proyek-v2.6.md). Acuan produk dan desain global tetap berada pada `PRODUCT.md` dan `DESIGN.md` di root proyek.

Dokumen coverage membedakan perilaku UI lokal dengan integrasi produksi yang masih diperlukan. Screenshot pengujian merupakan bukti pengerjaan, bukan aset halaman.

Alur pelanggan: [Pesanan Saya](coverage/my-orders-ui.md),
[Detail Pesanan](coverage/order-detail-ui.md) dan [Pembayaran](coverage/payment-ui.md).

Modul akun: [spesifikasi Profil & Pengaturan Akun pelanggan](design/surfaces/customer-account-surface.md).
Implementasi pratinjau dan batas integrasinya dicatat pada
[cakupan UI akun pelanggan](coverage/customer-account-ui.md).

Revisi terbaru: [aktivitas login, alamat dengan peta, pelacakan, dropdown/status
pesanan serta shell ringkas](coverage/customer-refinements.md).

Perencanaan Keranjang: [spesifikasi Lihat Keranjang berdasarkan Figma](design/surfaces/cart-surface.md),
termasuk alur tamu/pelanggan, matriks state, aturan bisnis dan kontrak yang belum pasti.
Implementasi serta batas integrasinya: [cakupan UI Keranjang](coverage/cart-ui.md).

Perencanaan Checkout: [spesifikasi Checkout berdasarkan Figma](design/surfaces/checkout-surface.md),
termasuk pemilihan alamat dan peta, jadwal, kurir, metode bayar, persetujuan,
matriks state dan pemulihan pembuatan pesanan. Dokumen ini belum merupakan
implementasi atau aktivasi integrasi transaksi.

Implementasi frontend Checkout dan batas layanan yang masih tersisa:
[cakupan UI Checkout](coverage/checkout-ui.md).

Autentikasi pelanggan: [arah desain](design/surfaces/customer-auth-surface.md),
[cakupan Login, Registrasi, OTP dan pemulihan](coverage/customer-auth-ui.md).

Homepage Home page rev: [arah dan adaptasi Figma](design/surfaces/homepage-surface.md),
[cakupan UI, state dan batas integrasi](coverage/homepage-ui.md).
Pemeriksaannya tersedia pada [review akhir](design/reviews/homepage-verdict.md)
dan [rincian quality gates yang masih terbuka](design/reviews/homepage-quality-gates.md).
Riwayat revisi: [hati wishlist, promosi ringkas, dua kolom ponsel dan autoplay](design/reviews/homepage-mobile-review.md).
Revisi lanjutan: [hierarki kartu, logo terang dan kontrol hero ponsel](design/reviews/homepage-hierarchy-review.md).
Revisi kartu terbaru: [alignment, jarak, logo terang dan badge keranjang ponsel](design/reviews/homepage-card-spacing-review.md).
Revisi berikutnya: [overlap foto hero, logo SVG lengkap Figma dan hover wishlist](design/reviews/homepage-hero-logo-review.md).
Revisi autoplay: [rotasi setelah pemilihan manual dan slide Marigold](design/reviews/homepage-marigold-review.md).
