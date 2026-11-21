# Pembatalan & Refund — spesifikasi halaman publik

Tanggal penyusunan: **18 November 2026**. Status: **acuan tertulis untuk desain dan implementasi berikutnya**. Mode: **Read**. Fokus desktop; alur membaca dan navigasi mobile tetap lengkap. Dokumen ini tidak mengubah UI, kebijakan, data pesanan, atau integrasi pembayaran.

Pembaruan implementasi 18 November 2026: frontend pratinjau kini tersedia pada `/pages/public/cancellation-refund.html`. [Cakupan UI](../../coverage/cancellation-refund-ui.md) mencatat hasil dan batas integrasinya. Temuan kondisi awal di bawah adalah rekam sebelum implementasi.

**Penanda:** **Fakta** ditemukan pada keputusan pengguna, baseline atau implementasi yang disebut; **Usulan** adalah rancangan halaman; **Asumsi perlu dikonfirmasi** adalah hal yang belum mempunyai bukti cukup. Prioritas **Wajib** berlaku pada halaman panduan; **Bersyarat** hanya berlaku bila sumber/integrasinya tersedia; **Tujuan** berarti state dikelola modul pesanan/pembayaran yang ditautkan, bukan dibangun ulang pada halaman ini.

## Sumber dan urutan keputusan

1. Keputusan pengguna: mempertahankan identitas, shell dan komponen proyek; ukuran komponen mempunyai hierarki; navbar sembunyi saat scroll turun dan muncul saat naik; daftar isi aktif otomatis mengikuti bagian bacaan; warna pembuka FAQ disamakan dengan Kontak.
2. [Baseline v2.6](../../specifications/spesifikasi-proyek-v2.6.md): D-05/D-08/D-10/D-11; §7.5/7.7; §8.2/8.4/8.8; §9.1/9.5/9.6; §10.1–10.7; P-11–P-21/P-27; kontrak A.7 dan penjelasan COD pada adendum §26. Ketentuan rinci, invariant dan adendum yang relevan mengungguli ringkasan yang bertentangan.
3. [PRODUCT.md](../../../PRODUCT.md), [DESIGN.md](../../../DESIGN.md), [shell storefront](storefront-shell.md), dan [inventaris halaman](../../coverage/storefront-page-inventory.md).
4. Implementasi dan cakupan terbaru: [Detail Pesanan](../../../public/assets/js/storefront/order-detail.js), [adapter contoh Detail Pesanan](../../../public/assets/js/storefront/order-detail-preview-data.js), [cakupan Detail Pesanan](../../coverage/order-detail-ui.md), [Pesanan Saya](my-orders-surface.md), [cakupan Pembayaran](../../coverage/payment-ui.md), [FAQ](../../../public/pages/public/faq.html), serta [Informasi Pengiriman](../../coverage/shipping-information-ui.md).
5. Panduan analisis/UX design-taste-frontend, Hallmark dan Impeccable diterapkan pada kejelasan naskah, hierarki, konsistensi dan pemulihan. Identitas proyek serta mode Read tidak diganti dengan struktur pemasaran atau tema baru.

Belum ditemukan referensi Figma khusus Pembatalan & Refund pada sumber lokal yang diperiksa. Pola visual berasal dari halaman informasi yang sudah tersedia; dokumen ini tidak mengklaim pemeriksaan ulang Figma atau pengukuran frame baru.

## 1. Pemahaman dan cakupan halaman

### Tujuan

Pengguna dapat menentukan langkah yang sesuai dengan tahap pesanannya, memahami apakah pengembalian dana mungkin dilakukan dan komponen apa yang dapat dikembalikan, lalu membuka pesanan untuk bertindak atau memantau hasil. Pembedaan utama: **pembatalan menghentikan pesanan, refund mengembalikan dana, komplain melaporkan masalah**. Ketiganya mempunyai status dan syarat berbeda.

**Fakta kondisi awal:** footer mempunyai pemicu `Pembatalan & Refund`, tetapi belum ada halaman panduan HTML dan pemetaan aktif untuk tujuan ini. Detail Pesanan sudah mempunyai formulir pembatalan/permintaan pembatalan, komplain, banding, serta tampilan progres refund sebagai pratinjau. Itu bukan bukti gateway atau pemrosesan dana produksi sudah terhubung. `config/routes.php` masih scaffold.

**Usulan route:** `/pages/public/cancellation-refund.html`; alias `/pembatalan-refund.html` dan `/cancellation-refund.html` mengikuti pola preview proyek. Semuanya calon route, belum aktif.

| Pengguna | Hak pada panduan | Batas saat membuka transaksi |
| --- | --- | --- |
| Guest | Membaca seluruh ketentuan, daftar isi, FAQ dan bantuan tanpa login. | Masuk diperlukan untuk membuka pesanan miliknya. Tidak mencari pesanan orang lain dari nomor publik. |
| Pelanggan | Hak baca sama dengan guest. | Melihat dan mengajukan tindakan pada pesanan sendiri, jika diizinkan status, tenggat dan otorisasi server. |
| Sesi berakhir/belum terverifikasi | Panduan tetap terbaca. | Guard tujuan menangani login/verifikasi sesuai pola proyek dan memulihkan tujuan internal yang aman. |
| Admin/SuperAdmin di storefront | Membaca panduan yang sama. | Persetujuan, eksekusi, retry refund dan penanganan sengketa berada di modul staf, bukan kontrol publik. |

### Cakupan

- Ketentuan pembatalan menurut tahap dan jenis penanganan produk.
- Perbedaan pembatalan langsung, permintaan yang menunggu keputusan, dan komplain pasca-penerimaan.
- Penyebab/komponen refund, metode pengembalian, biaya penyedia, target pemrosesan dan arti status.
- Petunjuk kasus khusus: COD, pembayaran terlambat/ganda/berlebih, barang dikembalikan, refund gagal dan sengketa pembayaran.
- Alur menuju Pesanan Saya/Detail Pesanan, bantuan, Informasi Pengiriman dan FAQ.
- Daftar isi otomatis, FAQ native, konteks kembali dan seluruh state bacaan yang relevan.

Tidak ada transaksi pembatalan, pengajuan nominal refund, unggahan bukti, formulir rekening atau persetujuan finansial pada halaman panduan. Menu header bersama tetap memakai perilaku existing.

## 2. Struktur dan isi halaman

### Susunan dari atas ke bawah

| Urutan | Bagian dan isi | Tujuan/hierarki |
| --- | --- | --- |
| 1 | Header bersama: logo, pencarian, akun, Wishlist/Keranjang beserta count/preview dan kategori. | Mempertahankan navigasi yang sudah dikenal. Pencarian menuju Katalog. |
| 2 | Breadcrumb `Beranda / Pembatalan & Refund`; H1; pembuka singkat. | Menyebut kebutuhan pembaca tanpa hero besar. Usulan naskah: “Ketahui kapan pesanan dapat dibatalkan, bagaimana refund diproses, dan langkah yang sesuai dengan status pesanan Anda.” |
| 3 | Ringkasan **Pembatalan pesanan** dan **Pengembalian dana**; penjelasan “Pesanan Dibatalkan belum berarti dana sudah kembali.” | Menjawab perbedaan terpenting sebelum rincian. Dua kelompok desktop; satu kolom mobile. |
| 4 | CTA utama **Buka Pesanan Saya**; tautan **Kembali ke Detail Pesanan** hanya bila konteks asal aman diketahui. | Menyediakan jalur nyata menuju status/tindakan individual. Bukan tombol langsung membatalkan. |
| 5 | Daftar isi dan artikel: Pembatalan; Nominal & ongkir; Metode & waktu; Status refund; Komplain; Kasus khusus; Pertanyaan. | Desktop daftar isi di samping, aktif otomatis saat scroll; mobile disclosure dalam alur biasa. |
| 6 | Tabel pembatalan per tahap. | Pertanyaan “masih bisa dibatalkan?” dijawab dengan tahap dan syarat, bukan warna saja. |
| 7 | Tabel penyebab/komponen dana yang dikembalikan. | Memisahkan produk, ongkir, selisih pembayaran dan potongan yang tidak berlaku. |
| 8 | Metode, target waktu, biaya, penanganan gagal. | Menyatakan awal perhitungan waktu serta tindakan berikutnya. |
| 9 | Penjelasan alur/status refund dan permintaan pembatalan. | Panduan arti label, bukan status aktual akun. |
| 10 | Komplain, batas waktu, bukti, dampak konfirmasi penerimaan dan banding. | Mencegah pengguna kehilangan jalur yang tersedia karena salah tindakan. |
| 11 | Kasus khusus dan bantuan. | Membahas COD, dana terlambat/ganda, pengiriman gagal dan sengketa secara singkat; rincian tetap di pesanan. |
| 12 | FAQ, tautan Informasi Pengiriman/Kontak, footer bersama. | Pertanyaan cepat serta pemulihan tanpa tujuan buntu. Link Syarat & Ketentuan baru dipasang setelah route-nya tersedia. |

### Tabel pembatalan untuk konten publik

| Tahap/kondisi | Yang dapat dilakukan pelanggan | Syarat dan keputusan | Dampak dana |
| --- | --- | --- | --- |
| Menunggu Pembayaran | Batalkan melalui pesanan. | Sistem terlebih dahulu menutup/memeriksa transaksi pembayaran aktif. Jangan mengasumsikan pembatalan selesai saat status penyedia belum pasti. | Jika belum ada dana diterima, tidak ada refund. Pembayaran yang masuk kemudian ditangani sebagai pembayaran terlambat. |
| Siap Diproses | Pembatalan mandiri, disetujui otomatis sesuai validasi. | Pesanan belum disiapkan. COD tetap dapat berada di tahap ini walau belum dibayar. | Dana yang sudah terverifikasi diterima dikembalikan penuh, termasuk ongkir. COD belum dibayar tidak menghasilkan pengembalian dana. |
| Sedang Disiapkan — Tahan Lama | Ajukan pembatalan. | Toko meninjau; dapat disetujui bila belum dikemas/diserahkan. Pengajuan belum membatalkan pesanan. | Jika disetujui dan ada dana diterima: penuh, termasuk ongkir. |
| Sedang Disiapkan — Mudah Layu | Ikuti kelayakan yang ditampilkan pesanan; hubungi toko bila ada kesalahan pemenuhan. | Pembatalan ditolak kecuali kesalahan toko. Jangan menjanjikan tombol pengajuan selalu tersedia. | Penyelesaian mengikuti keputusan dan tanggung jawab atas kejadian. |
| Dikirim | Ajukan permintaan melalui alur yang tersedia; pembatalan mandiri tidak tersedia. | Penghentian pengiriman diupayakan tanpa jaminan. Untuk Tahan Lama, paket harus kembali dan dinilai layak. | Tahan Lama yang memenuhi syarat: nilai produk, ongkir tidak dikembalikan. Mudah Layu serta kesalahan toko/kurir mengikuti penilaian sebab/bukti. |
| Terkirim | Gunakan jalur komplain bila masih memenuhi syarat. | Bukan pembatalan. Batas dan bukti mengikuti bagian Komplain. | Resolusi bisa pengganti/kirim ulang/refund sebagian/penuh atau penolakan dengan alasan. |
| Selesai | Lihat riwayat kasus/refund; hubungi bantuan jika perlu penjelasan. | Tidak membuka hak komplain baru setelah jendelanya ditutup atau penerimaan dikonfirmasi. Kasus/refund yang sudah ada tetap dapat dipantau. | Status pesanan selesai tidak membuktikan refund telah berhasil. |
| Pembatalan oleh toko karena stok fisik habis/kesalahan toko | Baca pemberitahuan dan hasil pada pesanan. | Pembatalan dan refund penuh mengikuti keputusan otomatis kategori ini. | Penuh untuk dana yang telah diterima. Tidak menyatakan refund untuk COD yang belum dibayar. |

Istilah Mudah Layu/Tahan Lama mengikuti atribut produk. Tabel tidak menambahkan pembatalan per item atau pemisahan pesanan otomatis. Kasus campuran yang sedang disiapkan harus mengikuti kelayakan server/peninjauan toko; rincian yang belum pasti dicatat pada bagian 12.

### Tabel komponen refund

| Penyebab | Dana yang dapat dikembalikan menurut baseline | Catatan publik |
| --- | --- | --- |
| Pembatalan sebelum penyiapan, pembatalan tahap persiapan yang disetujui, atau pembatalan karena kesalahan toko | Dana terverifikasi yang relevan, penuh termasuk ongkir. | Persetujuan otomatis hanya untuk kategori yang memang otomatis; bukan semua permintaan. |
| Pemenuhan sebagian karena stok atau substitusi lebih murah yang disetujui pelanggan | Nilai item yang tidak dipenuhi atau selisih harga; ongkir tetap. | Perlu keputusan dan persetujuan yang tercatat. Tidak memberikan hak mengurangi item sendiri pada pesanan aktif. |
| Pembayaran ganda atau kelebihan bayar | Seluruh dana ganda atau selisih pembayaran. | Berdasarkan hasil verifikasi pembayaran; jangan meminta pelanggan membayar ulang. |
| Barang hilang/rusak akibat toko atau kurir | Baseline menyediakan refund penuh produk/ongkir atau pengganti sesuai kasus. | Toko meninjau bukti dan tanggung jawab; klaim ke kurir ditangani toko. |
| Komplain disetujui | Penuh atau sebagian sesuai resolusi; nominal sebagian tidak melebihi nilai item terdampak. | Tidak ada janji penggantian/refund otomatis 100% untuk semua laporan. |
| Tahan Lama kembali dalam kondisi layak akibat pembatalan/kegagalan yang memenuhi aturan | Nilai produk; ongkir tidak dikembalikan. | Jangan menerapkan pengecualian ongkir ini pada kesalahan toko/kurir secara menyeluruh. |

Jumlah refund mengikuti snapshot transaksi, dana yang benar-benar diterima dan refund sebelumnya, bukan harga katalog terbaru. Biaya penyedia pembayaran untuk refund **ditanggung toko**, tidak dipotong dari pelanggan (§10.3).

### Naskah FAQ yang diusulkan

| Pertanyaan | Jawaban awal |
| --- | --- |
| Pesanan dibatalkan, apakah dana langsung kembali? | Belum tentu. Pembatalan pesanan dan pengembalian dana mempunyai proses berbeda. Pantau status refund pada Detail Pesanan. |
| Apakah COD yang belum dibayar mendapat refund? | Tidak ada dana yang perlu dikembalikan jika pembayaran belum diterima. Jika dana COD sudah terverifikasi diterima, kelayakan refund mengikuti kasus pesanan. |
| Apakah semua pesanan dapat dibatalkan? | Kelayakan bergantung tahap dan jenis produk. Sebelum disiapkan pembatalan dapat dilakukan sendiri; setelahnya berlaku peninjauan dan pembatasan sesuai tabel. |
| Berapa lama refund diproses? | Target pemrosesan maksimal 3 hari kerja sejak disetujui. Waktu dana masuk bergantung bank atau penyedia pembayaran, bukan dihitung sejak permintaan pertama dibuat. |
| Apakah ongkir ikut dikembalikan? | Bergantung penyebab dan tahap. Pembatalan sebelum penyiapan yang memenuhi aturan termasuk ongkir; Tahan Lama yang kembali dalam kondisi layak pada kasus tertentu hanya nilai produk. Kesalahan toko/kurir dinilai sesuai tanggung jawabnya. |
| Refund dikirim ke mana dan apakah ada biaya? | Ke metode pembayaran asal bila didukung. Jika tidak, diperlukan rekening/e-wallet atas nama pelanggan melalui proses yang terverifikasi. Biaya penyedia untuk refund ditanggung toko. |
| Apa yang dilakukan jika refund gagal? | Kegagalan dipantau dan ditindaklanjuti toko melalui retry atau penanganan manual. Periksa petunjuk kasus pada pesanan atau hubungi bantuan; jangan membuat pengajuan duplikat. |
| Apakah komplain harus memakai video buka paket? | Video bukan syarat wajib. Ajukan dari Detail Pesanan maksimal 24 jam sejak Terkirim dan sebelum konfirmasi penerimaan, dengan kategori, deskripsi dan 2–5 foto; kategori Tidak diterima tidak wajib foto. |

Parameter FAQ harus selaras dengan konfigurasi/ketentuan yang dipakai transaksi. Form rekening aman belum tersedia pada UI pelanggan saat pemeriksaan; penjelasan metode di atas adalah ketentuan baseline, bukan bukti kanal pengumpulan data telah diimplementasikan.

Konten panjang membungkus; nominal, syarat dan alasan keputusan tidak dipotong. Metadata opsional yang kosong disembunyikan. Tanggal dokumen ini tidak dipakai sebagai tanggal penerbitan kebijakan tanpa metadata yang sah.

## 3. Alur penggunaan

### Alur utama

1. Guest/pelanggan membuka footer Pembatalan & Refund, tautan dari panduan pengiriman/FAQ, atau bantuan pada pesanan yang nanti dihubungkan.
2. Membaca ringkasan perbedaan proses dan menentukan tahap pesanannya dari tabel.
3. Menggunakan daftar isi untuk menemukan nominal, tenggat, metode atau kendala yang relevan.
4. Memilih **Buka Pesanan Saya**; jika perlu login/verifikasi, tujuan pesanan dipertahankan melalui mekanisme internal existing.
5. Membuka Detail Pesanan. Halaman tujuan menampilkan tindakan yang benar-benar diizinkan, status kasus, tenggat serta dampaknya.
6. Pembatalan/komplain diproses pada modul tujuan; hasil dan progres refund dipantau di sana. Halaman panduan tidak menampilkan sukses transaksi.

### Alternatif dan pemulihan

- Dari Detail Pesanan/Pembayaran: tautan kembali kontekstual hanya jika asal dapat divalidasi. Kembali mengembalikan pesanan yang sama dan posisi sebelumnya; perpindahan anchor panduan tidak boleh membuat tombol kembali berhenti di fragmen panduan.
- Dari Pesanan Saya: browser Back/tautan kembali mempertahankan pencarian, status/tab, tanggal, urutan, halaman dan scroll melalui mekanisme daftar existing. Membuka detail pesanan baru dimulai dari ringkasan atas, tanpa membawa scroll pesanan lain.
- Jika konteks asal hilang atau tidak aman: sediakan Pesanan Saya dan Kontak sebagai tujuan nyata; jangan menyisipkan ID pesanan contoh.
- Kasus sudah diajukan: buka dan pantau kasus existing, bukan mengajukan ulang. Pengajuan menunggu keputusan tidak otomatis menghentikan pesanan atau menandakan dana dikembalikan.
- Permintaan ditolak: baca alasan; pesanan dapat berlanjut. Banding satu kali adalah aturan **penolakan komplain**, bukan fitur banding otomatis untuk semua penolakan pembatalan/refund.
- Terkirim: pengguna mengajukan komplain hanya bila jendela masih berlaku dan belum mengonfirmasi penerimaan. Komplain terbuka menunda penyelesaian otomatis; refund tetap dapat berlanjut setelah kasus/pesanan selesai sesuai validasi dimensi status.
- Refund gagal/proses lama: buka status dan bantuan; retry finansial tetap kewenangan sistem/staf. Tidak ada tombol pelanggan yang mengeksekusi refund ulang.
- Tidak mempunyai pesanan: state kosong ditangani Pesanan Saya, dengan jalur belanja existing; panduan tetap berisi informasi lengkap.

Tidak ada draft pada panduan. Guard formulir yang berubah pada halaman asal tetap berlaku saat pengguna membukanya; jangan menghapus isian/bukti. Masuk ke panduan bukan persetujuan pembatalan, refund, kebijakan Checkout, atau pelepasan hak komplain.

## 4. Komponen dan interaksi

| Komponen | Pemakaian/penyesuaian | Perilaku |
| --- | --- | --- |
| Shell, logo, pencarian, count dan preview header | Pakai ulang komponen storefront. | Navbar mengikuti arah gulir; pencarian menuju Katalog. Tidak membuat versi navigasi baru. |
| Pembuka halaman | Adaptasi banner hijau/teks putih FAQ dan Kontak terbaru; ukuran ringkas sesuai mode Read. | Identitas halaman jelas; ringkasan/CTA tidak terdorong jauh ke bawah. |
| Ringkasan dua proses | Komposisi ringkasan yang konsisten dengan halaman informasi. | Read-only; tidak berisi status aktual akun atau persetujuan palsu. |
| Tabel aturan/nominal | Pola tabel artikel, reflow layanan dari Informasi Pengiriman. | Header/label jelas; mobile kelompok berlabel bila tabel penuh sulit dibaca. |
| Daftar isi | Gunakan pola scroll spy Informasi Pengiriman. | Tepat satu penanda aktif mengikuti posisi artikel, dua arah; hover berupa affordance berbeda; scroll tidak menulis URL/riwayat atau memindahkan fokus. |
| Anchor | Link HTML nyata. | Klik/keyboard memfokuskan target yang valid dengan offset header; fragmen tak dikenal kembali ke pembuka tanpa memblokir scroll berikutnya. Skip link tetap sah walau bukan item daftar isi. |
| FAQ | `details/summary` native, single-open seperti halaman FAQ. | Default tertutup; keyboard, fokus dan tanpa JavaScript tetap bekerja. |
| CTA dan tautan kembali | Tombol/link existing dengan label tujuan konkret. | Gunakan anchor untuk navigasi. Konteks aman dipertahankan; modifier/new-tab tetap mengikuti browser. |
| Notice | Pola informasi/status proyek. | Dipakai untuk ketentuan penting atau sumber dinamis yang gagal; tanpa dekorasi status palsu. |

Tidak memerlukan filter, pengurutan, pagination, pencarian dalam kebijakan, tab transaksi, checkbox persetujuan, kalkulator refund atau dialog baru. Form/modal pesanan yang sudah ada digunakan pada halaman tujuan.

## 5. Status dan penanda penting

### Proses bisnis yang dijelaskan

| Dimensi | Status/transisi yang diketahui | Makna dan dampak |
| --- | --- | --- |
| Permintaan pembatalan | Diajukan → Disetujui atau Ditolak. | Diajukan belum berarti pesanan Dibatalkan. Disetujui menjalankan pembatalan/refund yang berlaku; penolakan disertai alasan dan pesanan berlanjut. |
| Refund | Diajukan → Disetujui atau Ditolak; Disetujui → Diproses → Berhasil atau Gagal. | Pembuatan permintaan, persetujuan dan eksekusi adalah kejadian berbeda. Gagal → Diproses melalui retry yang diizinkan atau penanganan manual → Berhasil. |
| Pembayaran | Refund Diproses; Dikembalikan Sebagian; Dikembalikan Penuh; Sengketa. | Tetap terpisah dari status refund individual dan pesanan. Akumulasi refund dan dana terverifikasi menentukan hasil, bukan perubahan nama status saja. |
| Komplain | Diajukan → Dalam Tinjauan → Disetujui dengan resolusi atau Ditolak; banding yang memenuhi syarat → Dieskalasi → Selesai. | Penyelesaian dapat berupa pengganti/kirim ulang/refund. Komplain bukan sengketa pembayaran penyedia. |
| Pesanan | Dibatalkan atau Selesai dapat berdampingan dengan refund yang masih Diproses. | Riwayat pesanan tidak ditulis ulang menjadi saldo neto. Kasus/refund tetap dipantau pada dimensinya. |

Status ditulis lengkap bersama nama dimensinya: **Refund Diproses**, **Permintaan Pembatalan Diajukan**, bukan “Berhasil” tanpa konteks. Penjelasan pada panduan adalah legenda/alur umum; jangan menampilkan badge seolah membaca kasus pengguna.

Gunakan gaya semantik existing: hasil terkonfirmasi berpenanda sukses; peninjauan/proses berlabel menunggu; gagal/penolakan memuat alasan dan tindakan. Warna tidak menjadi satu-satunya pembeda. Prioritas informasi: dampak tindakan/tenggat → syarat → progres → bantuan. State FAQ terbuka atau link aktif tidak menjadi status bisnis.

## 6. Tindakan dan dampaknya

| Tindakan pada panduan | Syarat/keadaan | Hasil, pembatalan dan pemulihan |
| --- | --- | --- |
| Buka Pesanan Saya | Route tujuan tersedia; baca panduan tidak membutuhkan akun. | Navigasi ke daftar; login/verifikasi ditangani tujuan. Tidak mengajukan kasus. |
| Kembali ke Detail Pesanan/Pembayaran | Hanya saat asal internal dan konteks aman diketahui. | Memulihkan objek/konteks yang sama, termasuk setelah beberapa anchor dan Back. Jika tidak diketahui, tampilkan Pesanan Saya. |
| Pilih bagian | Anchor valid. | Scroll dan fokus ke bagian; Back/Forward tetap masuk akal. Scroll manual hanya mengubah penanda aktif. |
| Buka/tutup FAQ/daftar isi mobile | Kontrol native tersedia. | Expanded/collapsed, fokus tetap pada kontrol; tanpa penyimpanan transaksi. |
| Informasi Pengiriman/FAQ/Kontak | Tujuan existing. | Buka halaman nyata, mempertahankan konteks baca saat kembali. Kontak tidak menerima data rekening otomatis. |
| Coba Lagi, bila ada sumber kebijakan dinamis | Permintaan sebelumnya gagal dan belum sedang diproses. | Hanya mengambil informasi; status busy/disabled mencegah pengulangan; bagian lain dan konteks dipertahankan. |

Tindakan pada Detail Pesanan tetap mempunyai dampak masing-masing: **Batalkan Pesanan** dapat menghentikan pemenuhan; **Ajukan Pembatalan** menunggu keputusan; **Konfirmasi Penerimaan** menutup kesempatan komplain; **Ajukan Komplain/Banding** membuat kasus sesuai syarat. Konfirmasi, validasi, draft, CSRF, versi data dan pencegahan submit ganda berada di modul tersebut. Panduan tidak menduplikasikan atau melewati pemeriksaan ini.

## 7. Aturan bisnis, validasi dan hak akses

### Ketentuan yang sudah diketahui

| Aturan | Nilai/ketentuan sumber | Implikasi UI/naskah |
| --- | --- | --- |
| Pemisahan proses | D-05/BR-09: pembatalan dan refund berbeda. | Selalu pisahkan status pesanan, pembayaran, refund, permintaan dan komplain. |
| Kelayakan | §10.1 dan penanganan produk. | Jangan menghitung hak aktual hanya dari judul status pada artikel. Server/read model tujuan menentukan tindakan. |
| COD | §9.1/adendum §26: dapat Siap Diproses sementara pembayaran Menunggu/UNPAID. | Tahap pesanan tidak membuktikan ada dana yang dapat dikembalikan. COD hanya dianggap dibayar setelah konfirmasi penerimaan uang yang diaudit. |
| Alasan | §10.2: alasan pembatalan wajib. UI contoh memakai textarea maksimum 2000 karakter untuk alasan/deskripsi. | Itu field milik Detail Pesanan. Jangan membuat aturan minimum karakter atau form baru pada panduan; samakan kontrak backend saat integrasi. |
| Batas dana | Refund harus didukung dana terverifikasi; akumulasi tidak boleh melebihi dana dibayar; tidak ada refund saat Sengketa aktif. | Nominal tidak diambil dari harga katalog atau ditentukan pelanggan pada panduan. Validasi atomik/idempoten di server. |
| Metode dan biaya | Kembali ke metode asal bila didukung; alternatif rekening/e-wallet atas nama pelanggan; biaya penyedia ditanggung toko. | Jangan menjanjikan semua kanal mendukung refund langsung atau memotong biaya gateway dari pelanggan. |
| Waktu refund | P-19: maksimum 3 hari kerja sejak disetujui; waktu dana masuk bergantung penyedia. | Pisahkan permintaan, persetujuan, pemrosesan dan waktu kredit. Jangan membuat countdown dari waktu pengajuan. |
| Gagal/refund ulang | P-20: 3 percobaan otomatis dalam 24 jam, lalu manual; §10.3 menyebut batas penanganan manual 2 hari kerja. | Aturan operasional sistem/staf, bukan tombol retry dana pelanggan atau janji total waktu kredit. |
| Mulai penanganan | P-15: maksimum 2 jam operasional mulai penanganan Perlu Penanganan. | Tidak menjanjikan semua pengajuan pasti diputus/disetujui dalam 2 jam; konflik redaksi dicatat di bagian 12. |
| Komplain | P-11: 24 jam sejak status Terkirim; §9.5 konfirmasi penerimaan menutup kesempatan komplain. | Sebut kedua syarat. Kasus yang sudah dibuka dapat tetap ditangani; jangan menawarkan komplain baru setelah ditutup. |
| Bukti komplain | P-27/§10.4: kategori, deskripsi, 2–5 foto; pengecualian Tidak diterima. | Video bukan syarat wajib; WhatsApp bukan kanal pengajuan wajib baseline. |
| Respons/banding | P-12: respons pertama maksimal 24 jam. P-17: banding komplain satu kali dalam 24 jam sejak penolakan. | Respons pertama bukan keputusan akhir; jangan memberikan hak banding umum untuk semua jenis penolakan. |
| Opsi penanganan khusus | P-16: respons pelanggan 24 jam pada opsi PH-01/PH-05/PH-06 yang diatur. | Bukan timer persetujuan otomatis semua permintaan. Jalur PH-02 mengikuti §7.5/§10.3 dan konteksnya. |
| Penilaian tanggung jawab | §10.7: sebab/bukti, kondisi produk dan tanggung jawab toko/kurir/pelanggan. | Tidak menolak otomatis hanya karena Mudah Layu; ongkir/refund mengikuti kasus. |
| Data tujuan alternatif | P-21: rekening/e-wallet diminta hanya saat diperlukan, terenkripsi, dihapus 30 hari setelah refund berhasil. | Tidak dikumpulkan pada artikel, query URL, Contact mailto, log biasa atau storage browser. |
| Stok | §10.5/§11.4: refund tidak otomatis menambah stok. | Panduan tidak menyatakan barang langsung dijual kembali karena dana dikembalikan. |

### Hak akses dan integritas

- Semua orang dapat membaca panduan. Detail transaksi dan tindakan hanya untuk pemilik pesanan yang terautentikasi/berwenang.
- Keputusan staf mengikuti maker-checker: pengaju tidak menyetujui refund yang sama; P-18 sampai Rp500.000 oleh Admin lain/SuperAdmin, di atasnya SuperAdmin. Ini aturan sistem, tidak perlu dipajang sebagai informasi internal pada artikel publik.
- Refund otomatis hanya pada sebab yang ditetapkan baseline dan dicatat dengan dasar aturan. Artikel tidak dapat memberi kewenangan baru.
- Sengketa penyedia ditangani melalui rekonsiliasi berwenang; jangan menyamakan dengan komplain kondisi barang atau memberi CTA mengirim refund lain.
- `returnTo`/referrer dibatasi tujuan internal yang diizinkan. Jangan memuat alamat, nomor rekening, token, order milik pihak lain atau catatan staf dari parameter halaman.
- Tindakan tidak tersedia dijelaskan pada halaman pesanan dengan sebab nyata; jangan menggantinya dengan tombol palsu pada panduan.

## 8. Matriks state

### State halaman, bagian dan kontrol

Artikel HTML langsung terbaca adalah rancangan versi awal. Loading/refresh API tidak dibuat bila tidak ada sumber dinamis. Prioritas Bersyarat bukan kewajiban menambah layanan atau simulasi.

| Area/komponen | Nama state | Pemicu | Isi tampilan/pesan | Tindakan tersedia | Data/input dipertahankan | Jalur pemulihan | Prioritas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Halaman | Default/read-only | Artikel tersedia. | Pembuka, ringkasan, tabel, panduan, FAQ dan tujuan nyata. | Baca; buka pesanan/bantuan. | Konteks asal dan fragmen. | Tidak diperlukan. | Wajib |
| Kontrol | Hover/focus/active | Pointer, keyboard atau penekanan. | Fokus instan dan affordance jelas; hover berbeda dari bagian aktif. | Aktivasi native. | Posisi baca/fokus. | Fokus tetap dapat ditelusuri. | Wajib |
| Daftar isi | Selected saat scroll | Bagian melewati garis baca yang memperhitungkan header. | Satu link aktif dengan teks/penanda, dua arah. | Pindah bagian lain. | URL, riwayat dan fokus tidak diubah scroll manual. | Sesuaikan saat resize, Back dan restore. | Wajib |
| Daftar isi mobile | Collapsed/expanded | Summary diaktifkan. | Kelompok link terlihat/tertutup; keadaan native. | Buka/tutup. | Pilihan bagian dan posisi. | Tidak menutupi artikel dengan overlay baru. | Wajib |
| FAQ | Collapsed/expanded | Pertanyaan ditekan. | Jawaban lengkap; single-open. | Buka/tutup pertanyaan. | Fokus summary. | Native tanpa JS. | Wajib |
| Anchor/skip link | Target valid | Link/fragmen dibuka. | Bagian yang dimaksud dan fokus yang sesuai. | Lanjut baca; Back/Forward. | Fragmen dan urutan navigasi. | Target tidak tertutup header. | Wajib |
| Fragmen | Tidak ditemukan | Fragmen lama/tidak sah. | Halaman tetap utuh, mulai pembuka. | Daftar isi valid. | Route dan konteks aman. | Pembaca tetap dapat scroll sesudah fallback. | Wajib |
| Navigasi kembali | Konteks tersedia | Kembali dari panduan atau halaman bantuan. | Objek/posisi/FAQ sesuai riwayat. | Lanjutkan alur sebelumnya. | Filter/halaman/scroll daftar; draft pada modul asal. | Lewati riwayat fragmen panduan saat kembali ke objek asal. | Wajib |
| Navigasi kembali | Konteks hilang/tidak aman | Direct entry, referrer luar atau state tidak tersedia. | Link Pesanan Saya/Kontak, tanpa detail contoh. | Tujuan umum yang valid. | Konten publik. | Pengguna memilih pesanan di daftar. | Wajib |
| Metadata opsional | Kosong/sebagian tersedia | Tanggal terbit/kanal pendukung tidak ada. | Hilangkan field kosong; ketentuan valid tetap ada. | Baca; bantuan. | Posisi baca. | Lengkapi metadata dari sumber nyata. | Wajib |
| Konten | Panjang/zoom | Jawaban/nama status panjang atau teks diperbesar. | Membungkus; syarat/nominal tidak terpotong. | Semua kontrol terjangkau. | Urutan dan isi bacaan. | Reflow tanpa overflow halaman. | Wajib |
| Aset | Ikon/logo gagal | Aset tidak termuat. | Teks tetap menjelaskan fungsi; fallback mengikuti shell. | Tautan tetap tersedia. | Artikel dan konteks. | Aset lokal/fallback yang ada. | Wajib bila memakai aset |
| JavaScript | Tidak tersedia | Script gagal/dinonaktifkan. | Artikel, link, anchor, tabel dan FAQ native tetap terbaca. | Navigasi HTML biasa. | Fragmen URL. | Fungsi tambahan boleh berkurang, isi inti tetap ada. | Wajib |
| Akses publik | Guest/sesi berakhir | Tidak ada sesi pelanggan. | Panduan tetap normal, tanpa login gate. | Baca; buka tujuan yang memerlukan login. | Konteks publik. | Guard hanya pada tujuan transaksi. | Wajib |
| Kebijakan dinamis | Loading/refresh | Sumber parameter nyata diminta. | Placeholder hanya bagian belum diketahui; bagian stabil tetap tampil. | Baca bagian lain. | Scroll, FAQ dan konteks. | Tampilkan versi valid. | Bersyarat |
| Kebijakan dinamis | Parsial/tidak valid/tidak berlaku | Bagian gagal atau sumber menolak versi. | Jangan menyajikan angka lama sebagai aturan berlaku; jelaskan bagian belum terkonfirmasi. | Coba Lagi; bantuan; periksa pada pesanan. | Konten valid lain dan posisi. | Muat versi yang sah. | Bersyarat |
| Kebijakan dinamis | Offline/timeout/gagal memuat | Permintaan nyata gagal. | Pesan penyebab yang diketahui; tidak menyatakan hak refund ditolak. | Retry saat tersambung; bantuan jika dapat dibuka. | Artikel yang sudah termuat dan konteks. | Pulihkan koneksi/sumber; jangan menjamin offline awal tanpa cache. | Bersyarat |
| Kebijakan dinamis | Maintenance/rate-limited | Layanan menyatakan kondisi ini. | Pesan sementara dan waktu retry hanya jika berasal dari server. | Baca bagian statis; ikuti retry yang diizinkan. | Konten valid dan posisi. | Tanpa loop retry otomatis. | Bersyarat |
| Coba Lagi | Disabled/busy | Permintaan informasi masih berlangsung. | Label proses/aria-busy; tindakan ganda dinonaktifkan. | Baca bagian lain. | Konteks baca. | Aktif kembali setelah hasil, termasuk gagal. | Bersyarat |
| Route | Artikel/route tidak tersedia | Route dihapus, publikasi ditarik atau server gagal. | Fallback sistem proyek, judul jelas dan link Beranda/Kontak bila dapat ditampilkan. | Kembali; retry bila relevan. | URL tanpa data sensitif. | Integrasi route/sistem yang sah; jangan bocorkan stack trace. | Wajib pada integrasi route |

### State tujuan transaksi yang harus dipertahankan, bukan diduplikasi

| Area/komponen | Nama state | Pemicu | Isi tampilan/pesan | Tindakan tersedia | Data/input dipertahankan | Jalur pemulihan | Prioritas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pesanan Saya | Belum ada pesanan | Daftar pemilik kosong. | Empty state daftar existing. | Belanja; kembali ke panduan. | Konteks publik. | Alur daftar, tidak membuat order contoh. | Tujuan |
| Login/akses pesanan | Perlu login/verifikasi/sesi berakhir | Sesi tidak memenuhi syarat tujuan. | Guard yang sesuai; detail privat tidak ditampilkan. | Masuk/verifikasi; kembali. | Tujuan internal aman; draft sesuai kebijakan keamanan asal. | Lanjut setelah otorisasi. | Tujuan |
| Pesanan | Denied/tidak ditemukan/diarsipkan | Bukan milik pengguna atau objek tidak tersedia. | Pesan ketersediaan tanpa membocorkan data; read-only jika arsip masih boleh dilihat. | Daftar pesanan; bantuan. | Konteks aman. | Guard/server/read model tujuan. | Tujuan |
| Tindakan | Tenggat lewat/status berubah | Pesanan mulai disiapkan/dikirim, konfirmasi penerimaan atau jendela habis. | Alasan tindakan tidak tersedia dan data terbaru. | Langkah lain yang masih sah; bantuan. | Isian relevan yang masih aman. | Validasi ulang; jangan paksa aksi lama. | Tujuan |
| Permintaan | Diajukan/menunggu keputusan | Pengajuan diterima. | Status kasus dan penjelasan pesanan belum otomatis batal/refund. | Lihat kasus; bantuan. | Alasan/referensi pengajuan. | Pantau keputusan, bukan kirim duplikat. | Tujuan |
| Permintaan/komplain | Ditolak | Keputusan dengan alasan diterima. | Alasan publik dan opsi yang sah. | Banding hanya untuk komplain yang memenuhi P-17; bantuan. | Bukti dan keputusan kasus. | Sesuaikan jalur, jangan menjanjikan banding umum. | Tujuan |
| Refund | Diproses/proses lama | Refund disetujui dan belum terkonfirmasi berhasil. | Nominal, status dan waktu relevan dari data aktual; waktu dana masuk tidak dijamin. | Pantau; hubungi bantuan. | Referensi/refund dan riwayat. | Sistem/staf menindaklanjuti. | Tujuan |
| Refund | Berhasil penuh/sebagian | Konfirmasi hasil sah. | Label hasil dan nominal aktual; riwayat total belanja tetap utuh. | Lihat rincian/riwayat. | Snapshot dan akumulasi refund. | Pertanyaan melalui bantuan bila perlu. | Tujuan |
| Refund | Gagal | Penyedia/penanganan menolak eksekusi. | Refund belum berhasil; petunjuk tindak lanjut toko. | Lihat status; bantuan. | Nominal, alasan publik dan referensi. | Retry sistem/staf atau manual, bukan retry uang pelanggan. | Tujuan |
| Form kasus | Validasi gagal/draft berubah | Alasan/kategori/bukti kurang atau pengguna menutup form. | Pesan per bidang; konfirmasi meninggalkan jika berubah. | Perbaiki; lanjut; batalkan sesuai keputusan pengguna. | Input/bukti selama aman dan masih valid. | Fokus kesalahan pertama; tidak menghapus draft diam-diam. | Tujuan |
| Pengajuan | Timeout/konflik/hasil belum pasti/duplikat | Respons aksi tidak dapat dipastikan atau versi berubah. | Jangan mengklaim sukses/gagal finansial tanpa verifikasi. | Muat status terbaru sesuai pola existing; ulangi hanya setelah aman. | Draft dan request context yang masih berlaku. | Idempotensi/verifikasi server sebelum submit baru. | Tujuan |
| Pembayaran | Sengketa | Penyedia mencatat sengketa aktif. | Status dimensi pembayaran dan instruksi kasus. | Baca riwayat/bantuan. | Bukti/referensi yang boleh dilihat. | Rekonsiliasi staf; tidak membuka refund paralel. | Tujuan |
| Tujuan refund alternatif | Data metode diperlukan | Metode asal tidak mendukung pengembalian dan proses aman tersedia. | Permintaan data yang benar-benar dibutuhkan, pada kanal terotorisasi. | Isi pada alur aman; tanya bantuan. | Data dibatasi dan terenkripsi menurut sumber. | Integrasi ini belum ada pada UI pelanggan; jangan menggantinya dengan form publik/Contact mailto. | Bersyarat di tujuan |

Tidak memerlukan state hasil pencarian/filter/pagination kosong, simpan artikel, konflik edit kebijakan, upload rekening pada panduan, OTP membaca artikel, persetujuan staf di halaman publik, atau “refund berhasil” simulasi pada panduan. State tersebut tidak diciptakan untuk memenuhi checklist.

## 9. UX dan aksesibilitas

- **Usulan visual:** pembuka hijau/putih sesuai revisi FAQ/Kontak, konten artikel krem dan hijau botani, Poppins, radius serta tombol proyek. Tetap ringkas; tidak menyalin tinggi hero Kontak atau menambah foto refund/mitra fiktif.
- Desktop mengikuti ukuran kontainer halaman informasi sekitar 1180 px; daftar isi sekitar 220–240 px; bacaan sekitar 65–75ch. H1 sekitar 36 px, H2 28 px, H3 20 px, isi 16 px/line-height 1,6–1,7. Angka adalah usulan proporsi, bukan hasil pengukuran Figma.
- Daftar isi desktop sticky memakai tinggi navbar yang terlihat; aktivasi bagian mempertahankan garis baca yang stabil saat navbar bertransisi. Anchor menyisakan ruang header penuh. Mobile satu kolom, judul sekitar 28 px dan H2 22–24 px, daftar isi disclosure; tidak menambah sticky bar/bottom sheet.
- Tabel mempunyai caption/header/relasi semantik. Reflow mobile tetap menyertakan nama kolom; tidak memotong nominal atau menuntut scroll horizontal seluruh halaman.
- Satu H1, heading berurutan, landmark bernama, skip link berfungsi, fokus keyboard terlihat. Link menavigasi; tombol hanya untuk tindakan/disclosure sesuai native.
- FAQ dapat dipakai Enter/Space dan tanpa JS. Informasi tenggat/pengecualian utama tetap di artikel, bukan hanya jawaban tertutup atau tooltip.
- Penanda aktif berbeda dari hover/fokus. Scroll spy hanya mengubah presentasi/aria-current, tidak memindahkan fokus, membuka dialog atau menambah history entry.
- Kontras isi minimal 4,5:1 dan teks besar 3:1 diperiksa saat implementasi. Hormati reduced motion, zoom dan target kontrol 44–48 px. Jangan membuat tampilan seluruhnya tampak disabled karena read-only.
- Penjelasan kegagalan dinamis mengumumkan area/status singkat melalui pola aria-live existing, bukan membaca ulang artikel. Tidak ada dialog target baru; dialog di tujuan mempertahankan fokus, Escape, batal dan pemulihan draft.

## 10. Data, keamanan dan kebutuhan sistem

| Data | Sumber/bukti | Pemakaian dan batas |
| --- | --- | --- |
| Matriks/ketentuan publik | Baseline dan naskah yang diselaraskan. | Teks umum; tidak menghitung kelayakan kasus individual dari browser. |
| Parameter waktu/bukti | P-11–P-21/P-27; nilai baseline tersedia. | Pada integrasi harus sama dengan konfigurasi dan validasi transaksi; tidak menggandakan nilai berbeda antar FAQ/Checkout/panduan. |
| Versi/tanggal berlaku | Metadata kebijakan publik jika tersedia. | Belum terhubung; jangan menciptakan tanggal berlaku dari tanggal build/dokumen. |
| Status, nominal, allowedActions, tenggat | Read model Detail Pesanan/adapter; saat ini frontend pratinjau. | Hanya di halaman pemilik yang terotorisasi. Panduan tidak memanggilnya untuk personalisasi. |
| Dana terverifikasi/refund aktual | Gateway/rekonsiliasi berwenang yang kelak terintegrasi. | Fixture bukan bukti dana bergerak. Status terminal menunggu konfirmasi yang sah. |
| Rekening/e-wallet alternatif | Alur refund aman yang belum tersedia di UI pelanggan. | Hanya bila perlu, pemilik sesuai, terenkripsi dan retensi P-21. Jangan mengumpulkan lewat artikel. |
| Riwayat keputusan | Audit transaksi/modul staf. | Pelanggan melihat alasan/progres publik; catatan internal dan data petugas sensitif dibatasi. |

Format mengikuti proyek: Bahasa Indonesia, rupiah bilangan bulat, waktu tampil WIB dan penyimpanan UTC. Target 3 hari kerja tidak diterjemahkan menjadi estimasi tanggal pasti tanpa kalender kerja dan data yang sah.

### Pembagian frontend dan backend

**Frontend panduan:** artikel, perbandingan, FAQ, scroll spy, navigasi/restore, reflow, fallback dan label preview yang sesuai. Tidak memutasi pesanan/refund atau menampilkan nominal contoh sebagai milik pengguna. Adopsi logika Informasi Pengiriman sebelum membuat komponen paralel; ekstraksi helper hanya jika memang mengurangi duplikasi, dengan regresi halaman asal.

**Modul tujuan/backend:** autentikasi/kepemilikan, validasi tahap/tenggat/jenis produk, versi data, CSRF, request idempotent, pembayaran terverifikasi, akumulasi refund, gateway/manual, maker-checker, sengketa, audit, notifikasi dan stok. Perubahan kebijakan melalui modul berwenang, tidak dari artikel publik. Rendering server/static tidak wajib menambah API publik hanya untuk bacaan.

Kontrak A.7 mencantumkan tindakan pelanggan `/orders/:id/cancel`, `/orders/:id/cancellation-requests`, `/orders/:id/complaints`, `/complaints/:id/appeal`, serta tindakan refund staf. Ini referensi kontrak baseline, **bukan endpoint aktif yang sudah diuji**. Pada frontend Detail Pesanan, adapter saat ini menyediakan `perform(action, payload, expectedVersion, requestKey)` untuk cancel/requestCancel/confirmReceipt/complain/appeal; tidak ada action pelanggan terpisah untuk mengisi nominal refund/rekening. Jangan mengarang endpoint atau membuka endpoint staf untuk mengisi celah tersebut.

Alamat, nomor rekening, token, data pembayaran dan bukti tidak dimasukkan ke URL, browser storage artikel atau log biasa. Tautan ke Kontak tidak memuat data finansial otomatis. Konfirmasi penerimaan bukan konfirmasi pembayaran COD atau persetujuan nominal refund baru.

## 11. Daftar pekerjaan dan kriteria selesai

### Pekerjaan wajib untuk implementasi berikutnya

1. Tetapkan naskah mengikuti bagian 2/7, dengan pengecualian COD, sebab pengiriman dan tenggat yang jelas; catat konflik sumber pada bagian 12.
2. Buat halaman HTML publik target memakai shell, aset, token dan CSS halaman informasi existing; style tambahan dibatasi pada target.
3. Tambahkan tujuan footer pada pemetaan pusat `storefront-shell.js` dan alias preview. Jangan menambal footer tiap halaman secara terpisah.
4. Gunakan daftar isi otomatis dan pola riwayat yang sudah diperbaiki pada Informasi Pengiriman. Regresikan scroll dua arah, hover, deep link, skip link, Back/Forward serta kembali ke pesanan setelah beberapa anchor.
5. Susun ringkasan, tabel, FAQ, bantuan dan tautan Pesanan Saya/Kontak/Informasi Pengiriman. Tautan Syarat & Ketentuan menunggu route nyata.
6. Kaitkan panduan dengan bagian kendala pengiriman, FAQ relevan serta bantuan pesanan bila sesuai. Pertahankan guard form/draft asal dan status kasus.
7. Siapkan workbench development mengikuti `tools/preview/`; calon `/__preview/cancellation-refund`, belum aktif. Kontrol layout/state tidak masuk alur produksi.
8. Perbarui inventaris dan cakupan setelah implementasi; jelaskan sumber konten dan batas integrasi secara terpisah dari kelulusan UI.

**Bersyarat:** kebijakan dinamis/versi, retry informasi, alur data rekening aman, gateway/notifikasi dan integrasi produksi ketika tersedia. Ini tidak dibangun sebagai simulasi sukses pada panduan. **Di luar versi awal:** kalkulator nominal, formulir refund mandiri baru, dashboard staf, CMS kebijakan, filter artikel atau unggahan bukti publik.

### Area berkas yang diperkirakan

- Baru: `public/pages/public/cancellation-refund.html`.
- Style target memakai basis `public/assets/css/storefront/information-pages.css`, dengan ekstensi scoped seperlunya.
- Pemetaan navigasi/alias: `public/assets/js/storefront/storefront-shell.js` dan `config/preview-pages.json`.
- Script artikel hanya untuk scroll spy/restore yang diperlukan; FAQ/isi tetap native. Helper bersama tidak diekstrak tanpa kebutuhan nyata dan regresi.
- Penautan relevan: Informasi Pengiriman, FAQ dan bantuan pesanan; perubahan kontrak/tindakan finansial existing bukan konsekuensi otomatis pekerjaan halaman panduan.

### Kriteria penerimaan

| Skenario | Hasil yang harus dapat diperiksa |
| --- | --- |
| Guest membaca | Tidak ada login gate, form rekening, nomor pesanan publik atau permintaan data pribadi pada panduan. |
| Footer dan alias | Mengarah ke halaman nyata; tidak ada notice “belum tersedia” untuk target yang sudah diimplementasikan. |
| Pembedaan proses | Dibatalkan tidak ditampilkan sebagai refund berhasil; pengajuan tidak disamakan dengan persetujuan. |
| Menunggu Pembayaran | Copy menjelaskan pemeriksaan/penutupan pembayaran aktif serta kemungkinan dana masuk terlambat; tidak menjanjikan hasil seketika. |
| Siap Diproses/COD | Hak pembatalan sebelum persiapan tidak berubah; dana hanya dikembalikan bila telah diterima, tanpa refund fiktif COD UNPAID. |
| Persiapan | Tahan Lama dan Mudah Layu dibedakan; tidak menjanjikan semua pengajuan dapat disetujui. |
| Sudah dikirim | Tidak ada pembatalan mandiri/penghentian terjamin. Syarat barang kembali/layak dan aturan ongkir dijelaskan sesuai sebab. |
| Nominal | Tidak menggunakan harga katalog terbaru atau mengarang potongan; biaya refund penyedia ditanggung toko. |
| Tenggat | 3 hari kerja dimulai dari persetujuan, bukan permintaan; waktu dana masuk tidak dijamin. P-15 tidak menjadi janji semua keputusan selesai 2 jam. |
| Komplain | 24 jam sejak Terkirim dan belum konfirmasi penerimaan; 2–5 foto kecuali Tidak diterima; video bukan wajib. |
| Selesai/banding | Tidak menawarkan komplain baru yang tertutup atau banding universal; kasus/refund existing tetap dapat dipantau. |
| Refund gagal/Sengketa | Tidak ada retry finansial pelanggan atau refund paralel ketika sengketa; petunjuk menuju kasus/bantuan jelas. |
| Navigasi tujuan | Login/verifikasi/kepemilikan diterapkan di tujuan; draft yang masih relevan dipertahankan sesuai keamanan asal. |
| Scroll/anchor | Satu bagian aktif dua arah, hover berbeda, tanpa perubahan URL/fokus/history dari scroll. Anchor/skip link valid tidak diperlakukan sebagai fragmen hilang. |
| Kembali | Kembali ke pesanan asal melewati fragmen panduan; daftar, filter, halaman dan scroll asal tidak hilang. Konteks hilang mendapat fallback nyata. |
| Responsif | 1440/1024/768/390/320 px, zoom dan konten panjang tidak bertabrakan; tabel/nominal tetap dapat dibaca. |
| Keyboard/no-JS/aset gagal | Konten, FAQ, anchor dan link inti tetap tersedia; fokus jelas dan header tidak menutupi tujuan. |
| Kebijakan dinamis, bila dipakai | Error/invalid/offline tidak menjadi penolakan hak; bagian valid dipertahankan dan retry tidak ganda. |
| Konsistensi | Navbar hide/show, pencarian Katalog, panel/count, Kontak/FAQ/Privasi/Pengiriman tidak mengalami regresi dari perubahan bersama. |
| Kejujuran hasil | Tidak ada refund produksi, saldo, riwayat kasus atau keberhasilan pengiriman uang yang dibuat oleh fixture artikel. |

Pemeriksaan development memakai kondisi artikel normal, bagian aktif saat scroll, FAQ/daftar isi terbuka, keyboard/hover, teks panjang, fragmen tidak sah, no-JS dan aset gagal bila digunakan. State transaksi sudah dapat dilihat melalui workbench Detail Pesanan existing (`/__preview/order-detail`): pending/ready/preparing/perishable/cod/cancelPending/cancelRejected/refund/refundFailed/fullRefund/completed/complaintRejected/appeal/dispute, sesuai fixture yang tersedia. Penggunaan fixture tidak membuktikan otorisasi, gateway, penyimpanan bukti atau pemindahan dana produksi.

Dokumen ini diperiksa terhadap sumber lokal dan kelengkapan spesifikasi. Build, render dan pengujian UI target baru dilakukan pada permintaan implementasi; tidak ada klaim pemeriksaan tersebut sudah lulus pada tahap ini.

## 12. Asumsi, konflik sumber dan keputusan terbuka

### Perbedaan yang perlu dipertahankan secara terbuka

| Sumber | Temuan | Keputusan rancangan/dampak |
| --- | --- | --- |
| §9.6 vs §10.6/10.7 | Redaksi kegagalan akibat pelanggan pada §9.6 lebih kategoris; §10.7 mewajibkan penilaian sebab/bukti dan tanggung jawab. | Naskah mengacu pada sebab/bukti dan tidak menolak otomatis karena Mudah Layu. Redaksi publik final diselaraskan pemilik menurut baseline, tanpa menciptakan hak/pengecualian baru. |
| §10.1 vs §9.5/§10.4 dan UI | Baris Terkirim/Selesai menunjuk komplain; ketentuan rinci dan UI menutup pengajuan baru setelah konfirmasi penerimaan/jendela berakhir. | Jelaskan hanya komplain yang masih memenuhi syarat; Selesai tidak membuka ulang hak. Riwayat/refund yang sudah ada tetap terlihat. |
| §10.1/10.2 vs register P-15 | Naskah pembatalan menyebut keputusan dalam P-15, sedangkan register mendefinisikan mulai penanganan, bukan keputusan akhir. | Jangan menjanjikan persetujuan/putusan final 2 jam. Penetapan SLA final khusus pembatalan perlu penyelarasan jika hendak dipublikasikan. |
| Ringkasan refund penuh vs COD | COD dapat Siap Diproses sebelum menerima dana; §10.3 mensyaratkan dana terverifikasi. | Frasa refund penuh selalu dikualifikasi terhadap dana yang diterima. Tidak memakai tahap pesanan sebagai bukti pembayaran. |
| §10.3 vs UI/kontrak A.7 | Baseline menyebut pelanggan dapat mengajukan refund, tetapi UI pelanggan hanya menyediakan jalur pembatalan/komplain dan tampilan refund; alur nominal/rekening mandiri belum ditemukan. | Versi panduan menautkan alur existing. Form refund mandiri/kanal rekening dan kontraknya memerlukan rancangan integrasi tersendiri, bukan endpoint rekaan. |
| Baseline vs redaksi preview Detail Pesanan | Copy refund existing memakai target 3 hari kerja; ada ringkasan jendela dan status yang tidak boleh dianggap menentukan hak semua kasus. | Selalu utamakan aturan rinci dan allowedActions yang berwenang; panduan tidak memperluas atau memotong hak berdasarkan fixture. |
| FAQ impor lama vs FAQ terkini | Klaim refund/penggantian 100%, video wajib dan WhatsApp berasal dari impor lama; dua jawaban terkait sudah diselaraskan saat implementasi Informasi Pengiriman. | Gunakan FAQ terkini. Jangan menyalin ulang klaim yang sudah diganti atau menganggap integrasi refund tersedia. |

### Asumsi perlu dikonfirmasi

1. **Metode refund produksi:** vendor aktif, kanal yang mendukung refund asal, proses rekening alternatif dan bukti keberhasilannya belum terhubung. Dampak: panduan menyebut prinsip umum; tidak menampilkan logo mitra, nomor rekening, formulir atau janji kanal yang belum tersedia.
2. **Kalender hari kerja:** definisi hari kerja untuk target refund/penanganan manual dan libur penyedia belum ditemukan sebagai konfigurasi aktif. Dampak: tidak menghitung estimasi tanggal dana masuk atau countdown sendiri.
3. **Keranjang campuran saat persiapan/pengiriman:** belum ditemukan aturan lengkap pembatalan parsial mandiri untuk kombinasi Mudah Layu/Tahan Lama. Dampak: tidak membuat selector item; ikuti peninjauan dan tindakan yang benar-benar diizinkan.
4. **Kebijakan publik terversi:** tanggal berlaku, riwayat versi, sumber parameter publik dan hubungan versi persetujuan Checkout belum terhubung. Dampak: tidak memalsukan tanggal update atau mencatat pembacaan artikel sebagai persetujuan.
5. **Logistik pengembalian:** alamat retur, prosedur pickup, tenggat mengirim balik, material yang harus disertakan dan biaya khusus belum ditemukan. Dampak: tidak mengarang batas 7/14 hari, label retur otomatis atau biaya; kasus diarahkan ke petunjuk pesanan/bantuan.
6. **Redaksi final:** perbedaan sumber di atas perlu diselaraskan sebelum publikasi operasional, terutama P-15, keranjang campuran dan tanggung jawab pengiriman. Ini tidak mengharuskan perubahan tema atau menghambat penyusunan halaman panduan berdasarkan bagian yang sudah jelas.

Keputusan versi awal yang diusulkan: panduan publik dengan ringkasan, matriks, daftar isi otomatis dan FAQ; tindakan individual tetap pada pesanan; tidak ada form refund/rekening baru, kalkulator atau integrasi finansial palsu. Tidak ada informasi tambahan dari pengguna yang diperlukan untuk menyelesaikan spesifikasi ini.
