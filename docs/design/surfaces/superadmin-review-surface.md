# Rekonsiliasi dan persetujuan SuperAdmin

Mode: **Operate**. Dua halaman terpusat melengkapi alur yang sebelumnya berada di rincian modul. Fokus: kasus mana yang tertahan, apa buktinya, siapa boleh memutuskan, dan apa hasil keputusan.

## Direction contract

THESIS: keputusan dimulai dari perbandingan dan batas kewenangan. Status pembayaran, pemeriksaan, persetujuan dan pelaksanaan tidak disamakan.

OWN-WORLD: pertahankan DESIGN.md RylVa Green, Poppins lokal, krem/hijau botani, shell serta helper `staff-support.js`. Pakai catalog-stat, tab, tabel, badge, dialog dan pagination yang sama. Tidak ada kebutuhan foto atau ilustrasi baru.

APP DRAW: Framed sheet, seed **1575130753**, tersimpan di `.taste-skill/superadmin-review/direction.json`. Palette/type tetap mengikuti DESIGN.md. Ambil lembar kerja yang tenang dan kedalaman satu tingkat; jangan mengganti sistem incumbent atau melakukan redraw.

STORY: daftar berpenanda prioritas → ringkasan → perbandingan/dampak → bukti → keputusan beralasan → aktivitas. Detail membuka Ringkasan di bagian atas; seluruh tab memakai lebar konten.

FIRST VIEWPORT: judul, identitas pelaku contoh, ringkasan terhitung, banner perhatian dan pencarian/filter langsung. Tabel berubah menjadi baris berlabel di mobile; tombol detail kecil di kanan bawah.

SIGNATURE: perbandingan sistem/gateway dan pemisahan pengaju–penyetuju terlihat sebelum keputusan. Usulan manual hanya tersedia setelah contoh API tidak tersedia; usulan yang usang atau melanggar batas tidak dapat disetujui.

BOUNDARIES: prototipe lokal tanpa gateway, transfer, perubahan pesanan/stok modul lama, MFA atau otorisasi nyata. Dua halaman baru berbagi data contoh sementara melalui sessionStorage pada tab yang sama agar alur manual dapat diikuti. Lampiran hanya metadata lokal; bukan unggahan atau bukti transaksi terverifikasi.

## Berkas

Tambahkan `payment-reconciliation.html`, `sensitive-approvals.html`, data/aturan/renderer dan CSS review bersama. Perluas helper support secara kompatibel untuk state review dan hasil simpan gagal. Tambahkan navigasi khusus SuperAdmin serta tautan kontekstual dari laporan keuangan/notifikasi. Pertahankan halaman dan komponen lama.
