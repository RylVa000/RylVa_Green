# Syarat dan Ketentuan

19 November 2026. Mode **Read**, perluasan sistem informasi storefront yang sudah ada. Permintaan implementasi pengguna menetapkan tema, navigasi dan kontrak existing tetap. Sumber: PRODUCT.md, DESIGN.md, baseline `docs/specifications/spesifikasi-proyek-v2.6.md` khusus §6.1–6.4, §7, §9, §10.3–10.7 dan §15.1, serta implementasi Checkout, autentikasi, Informasi Pengiriman dan Pembatalan & Refund.

## Batas isi dan visual

Halaman publik menjelaskan penggunaan akun, informasi produk/harga/stok, pemesanan dan buket kustom, pembayaran, pengiriman/penerima, pembatalan/refund/komplain, data pribadi serta bantuan/pembaruan ketentuan. Tidak membuat kontrak finansial, hukum yurisdiksi, denda, batas usia, pelepasan tanggung jawab, alamat retur, klaim sertifikasi atau tanggal berlaku yang belum disahkan. Ini pratinjau ketentuan operasional dari baseline, bukan dokumen legal produksi yang sudah diterbitkan.

Komposisi mengikuti halaman Pembatalan & Refund: banner hijau/putih existing, breadcrumb, pengantar ringkas, daftar isi di kiri dan artikel di kanan; daftar isi mobile menjadi disclosure dalam alur. Tidak ada konsep visual baru, foto dekoratif atau kebutuhan persetujuan konsep. Poppins, token, radius, ikon, header/footer, pencarian, Wishlist dan Keranjang diwarisi. CSS dan perilaku pembaca dipakai bersama; CSS penyesuaian banner baru dibatasi pada target agar stylesheet panduan lama tetap utuh. Delapan bagian bertajuk kalimat biasa; tidak ada modal atau tab tambahan di artikel.

## Ketentuan yang dipertahankan

- Guest dapat menjelajah dan mengisi keranjang; Checkout membutuhkan akun pelanggan terverifikasi. Persetujuan registrasi dan pembelian tetap eksplisit di formulir asal, bukan saat membaca atau menggulir dokumen.
- Keranjang tidak mencadangkan stok. Harga, produk, varian, stok, kuantitas dan layanan diperiksa ulang; total yang berubah memerlukan persetujuan ulang. Reservasi pembayaran online berbeda dari komit COD.
- Konfigurasi buket harus valid; ilustrasi otomatis bukan janji susunan fisik identik. Ringkasan pilihan serta biaya diperiksa sebelum membuat pesanan; tidak mengarang pengganti tanpa persetujuan.
- Pembayaran online dinyatakan berhasil setelah verifikasi; COD tetap Menunggu sampai pembayaran dikonfirmasi. Pembayaran terlambat diperiksa, bukan otomatis mengaktifkan ulang pesanan.
- Produk Mudah Layu memakai tanggal/slot dan layanan instan/same-day yang tersedia. Layanan keranjang campuran harus sesuai seluruh isi. Alamat dan kesiapan penerima penting; perubahan diajukan ke toko sebelum Dikirim dan mengikuti kelayakan layanan/biaya/lead time.
- Risiko alamat salah/penerima tidak tersedia mengikuti §10.6–10.7 yang berbasis sebab dan bukti; §9.6 mempunyai redaksi lebih absolut. Ikuti keputusan halaman pengiriman/refund yang sudah disepakati, bukan penolakan otomatis seluruh refund berdasarkan kategori produk.
- Pembatalan sebelum disiapkan memberi refund penuh hanya atas dana terverifikasi; COD belum dibayar tidak menghasilkan refund. Saat mulai disiapkan memerlukan persetujuan toko, dengan batas khusus Mudah Layu. Komplain maksimal 24 jam sejak Terkirim sebelum konfirmasi penerimaan; 2 sampai 5 foto kecuali Tidak diterima, video bukan syarat. Pemrosesan refund maksimal 3 hari kerja sejak persetujuan, waktu dana masuk bergantung penyedia.
- Data minimum untuk transaksi/pengiriman, akses/perbaikan data dan permintaan penghapusan mengikuti baseline. Kebijakan Privasi existing ditautkan tanpa mengubah seluruh kontennya atau mengklaim provider/fitur produksi aktif.

## Navigasi dan integrasi

Route `/pages/public/terms-conditions.html`, alias Inggris/Indonesia. Footer bersama menuju halaman ini. Registrasi mempertahankan dialog/pengelolaan fokusnya, menambahkan tautan dokumen di tab baru dengan `noopener`; isian termasuk kata sandi tetap di formulir asal dan tidak diserialisasi untuk membaca kebijakan. Tautan Kebijakan Privasi pada dialog sama juga menuju halaman yang sudah ada. Checkout menambahkan tautan dokumen di tab baru di dalam disclosure risiko yang sudah ada; status quote, persetujuan, submit dan aturan transaksi tidak diubah. Label memberitahu pembukaan tab baru.

Pembaca bersama mempertahankan penanda aktif saat scroll tanpa menambah history; anchor keyboard memindahkan fokus. Tautan kembali kontekstual hanya untuk navigasi satu tab dari Keranjang/Checkout, dengan asal same-origin/path yang diizinkan dan history yang cukup. Tab dokumen baru tidak berpura-pura memulihkan formulir asal. Back dari halaman bantuan memulihkan posisi baca/disclosure. Artikel dan anchor tersedia tanpa JavaScript; fragmen tak dikenal kembali ke pembuka. Stylesheet `noscript` khusus target menyediakan ruang anchor untuk tinggi header responsif ketika pengukuran JavaScript tidak tersedia, tanpa mengubah sticky header halaman lain.

## State wajib dan penerimaan

| Area | State/pemicu | Tampilan dan tindakan | Konteks/pemulihan |
| --- | --- | --- | --- |
| Artikel | Default / guest | Isi publik lengkap, label pratinjau; tidak meminta login | Tautan ke bantuan dan panduan lain |
| Daftar isi | Scroll ke dua arah | Tepat satu bagian aktif, warna dan `aria-current` | Tidak mengubah URL/fokus/history |
| Daftar isi | Mobile collapsed/expanded | Disclosure native, seluruh link dapat dicapai | Pilihan dipulihkan setelah Back |
| Anchor | Klik / Enter / tautan langsung | Fokus heading dan jarak navbar cukup | Back bekerja; tidak terlempar ke tengah detail baru |
| Anchor | Fragmen lama / rusak | Kembali ke pembuka tanpa error | Scroll dan tautan valid tetap berfungsi |
| Kontrol | Hover / focus / active | Feedback dan fokus instan dari sistem | Keyboard tanpa hover; reduced motion |
| Pembaca | Tanpa JavaScript | Artikel, anchor dan link inti native tetap tersedia | Tidak memerlukan retry layanan palsu |
| Isi | Judul panjang / layar 320 px | Membungkus, tanpa clipping/overflow | Semua bagian/tindakan tersedia |
| Registrasi | Baca kebijakan | Dialog existing dengan tautan dokumen, Escape/fokus kembali | Isian dan checkbox tidak berubah; tidak menulis rahasia ke storage |
| Checkout | Baca kebijakan | Link tab baru di disclosure existing | Quote, input dan consent tetap pada tab asal |
| Konteks | Kembali dari bantuan / sumber belanja | Posisi/disclosure dipulihkan atau kembali ke sumber valid | Tidak menerima URL tujuan arbitrary dari query |
| Persetujuan | Belum dicentang / kebijakan berubah | Tetap tanggung jawab formulir asal | Membaca tidak dianggap persetujuan; invalidasi existing dipertahankan |

Tidak ada loading API, empty search, unggahan, simpan draft, pembayaran atau refund pada halaman statis ini. State jaringan/akses/transaksi tetap milik alur tujuan, bukan simulasi pada artikel. Workbench dev terpisah menampilkan kondisi normal, anchor, fragmen lama, tanpa JavaScript dan teks panjang. Uji 1440/1024/768/390/320 px, scroll spy, keyboard, no-JS, footer lintas halaman, integrasi registrasi/Checkout dan regresi halaman informasi.

## Asumsi perlu dikonfirmasi sebelum produksi

Naskah final dan versi/tanggal berlaku belum diberikan. Review kebijakan publik dan konsistensi dokumen Privasi impor dengan implementasi produksi belum selesai. Layanan pembayaran, kurir, consent-version dari server dan persetujuan legal produksi belum terhubung. Tidak menjadikan tanggal implementasi sebagai tanggal efektif, dan tidak menerapkan ketentuan baru secara retroaktif pada pesanan yang sudah ada.
