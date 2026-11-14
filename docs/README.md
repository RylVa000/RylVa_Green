# Dokumentasi RylVa Green

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
