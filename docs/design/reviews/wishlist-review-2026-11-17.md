# Review Wishlist — 17 November 2026

Scope: frontend pratinjau dan titik integrasi yang diperlukan; sistem visual RylVa, shell dan komponen Homepage dipertahankan.

## Temuan dan tindak lanjut

| Temuan reviewer | Perbaikan | Verifikasi |
| --- | --- | --- |
| Nilai select tablet terpotong pada 768/820 px | Toolbar dua baris pada 701–1040 px | Capture 768, 820 dan 1024 dibuka kembali; resolved |
| Fokus kembali hilang bila produk dihapus dari Detail | Simpan itemIndex; pilih slug asal atau kartu terdekat, lalu pencarian/empty action; restore setelah BFCache revalidasi | Pengujian Back setelah hapus di Detail dan pembacaan source; resolved |
| Semua hati terkunci saat merge | Snapshot mengekspos ID produk merge; renderer, sinkronisasi DOM dan mutation guard membatasi penguncian pada ID tersebut | Heart unrelated tetap aktif; simpan produk akun lain ketika merge berlangsung tetap dipertahankan; resolved |
| Capture partial merge belum memuat gambar | Tunggu state akhir dan decode gambar pada DOM terbaru sebelum capture | Capture partial merge baru dibuka reviewer; resolved |
| Capture konten panjang tidak memperlihatkan kartu lengkap | Full-page screenshot dan crop kartu 320 px termasuk harga, satuan dan seluruh aksi | Reviewer menilai unit harga membungkus dan aksi tetap terlihat; resolved |

## Disposisi akhir

Reviewer independen: **Ship the frontend preview.** Ini adalah verdict pass atas daftar temuan di atas, bukan klaim audit tanpa batas. Tidak ada temuan material yang tersisa dari daftar tersebut.

Reviewer membaca gambar dan source; pengujian browser dijalankan oleh thread implementasi. Hasil terbaru: 15 kelompok browser dan 6 kelompok unit lulus. Produksi akun, autentikasi dan persistence server tidak diverifikasi.

[Cakupan UI dan catatan alat desain](../../coverage/wishlist-ui.md) memisahkan hasil implementasi dari gap integrasi dan temuan otomatis yang tetap terbuka.
