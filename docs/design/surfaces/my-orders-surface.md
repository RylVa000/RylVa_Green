# Pesanan Saya — spesifikasi halaman pelanggan

13 November 2026. Spesifikasi menjadi acuan implementasi frontend atas permintaan eksekusi pengguna. Backend transaksi belum terintegrasi.
Nama halaman: **Pesanan Saya**. Lokasi frontend pratinjau:
`public/pages/customer/my-orders.html`; template PHP yang sudah ada:
`templates/customer/orders_list.php`. Route HTML aktif pada server pratinjau;
template dan router PHP produksi masih scaffold. Status implementasi serta
bukti pemeriksaan ada pada [cakupan UI](../../coverage/my-orders-ui.md).

**Penanda sumber:** **Fakta** = ditemukan pada dokumen/kode/keputusan pengguna;
**Rancangan** = keputusan UX/teknis yang diusulkan untuk halaman ini;
**Asumsi perlu dikonfirmasi** = kontrak/informasi yang belum ditemukan, bukan aturan bisnis yang telah disahkan.

## Sumber dan batas pemeriksaan

- [Spesifikasi v2.6](../../specifications/spesifikasi-proyek-v2.6.md): §3 hak akses,
  §6.4 nomor dan kepemilikan, §7–10 pembayaran/status/pengiriman/komplain,
  §15 keamanan, A.7 kontrak API, A.11 pagination, §27.6 prioritas desain.
- [PRODUCT.md](../../../PRODUCT.md) dan [DESIGN.md](../../../DESIGN.md), terutama
  status transaksi, filter/pagination, dialog dan alur pesanan.
- [Shell Figma](storefront-shell.md), [Detail Pesanan](order-detail-surface.md),
  [cakupan Detail Pesanan](../../coverage/order-detail-ui.md), serta implementasi
  Pembayaran/Detail Pesanan dan skema `database/schema/DB_RylVa_Green.sql`.
- Preferensi pengguna: pola UI Tokopedia yang mudah dikenali; identitas RylVa
  dipertahankan; navbar dan footer wajib sama dengan Figma.
- Tiga screenshot Tokopedia sebelumnya terutama memperlihatkan **detail transaksi**.
  Daftar di belakang modal hanya terlihat sebagian. Kartu, total, tombol detail
  dan filter tanggal menjadi referensi yang dapat diamati; perilaku daftar,
  pencarian dan pagination di bawah ini merupakan rancangan, bukan hasil pengujian Tokopedia.
- Skill design-taste-frontend, Hallmark, Impeccable dan UI/UX Pro Max digunakan
  untuk konsistensi, hierarki, UX mode Operate dan pemulihan error. Implementasi
  berikutnya mempertahankan dunia visual RylVa; hasil render, detector dan review
  dicatat terpisah pada cakupan UI, bukan dianggap bukti integrasi produksi.

## 1. Pemahaman dan cakupan halaman

**Fakta.** Pesanan Saya merupakan halaman akun/transaksi milik **pelanggan**, bukan
halaman publik atau antrean staf. Baseline mendefinisikan pelanggan sebagai akun
terverifikasi; autentikasi, peran dan kepemilikan diperiksa server. Akun Admin dan
SuperAdmin memakai alur staf yang terpisah.

Pekerjaan utama pengguna:

1. Menemukan pesanan tanpa mengingat tautan detailnya.
2. Memahami status pesanan, dana dan pengiriman secara benar.
3. Melanjutkan pembayaran atau membuka pelacakan/detail yang sesuai.
4. Mengenali komplain, pembatalan atau refund yang sedang ditangani.
5. Kembali dari detail/pembayaran tanpa kehilangan konteks daftar.

**Cakupan rancangan:** daftar kartu, pencarian, filter status/tanggal, urutan,
pagination terbatas, ringkasan status, konteks kasus, navigasi dan pemulihan state.
Form pembatalan, konfirmasi penerimaan, komplain, banding dan dokumen tetap
ditangani oleh Detail Pesanan/Pembayaran yang sudah tersedia. Ini menghindari
dua implementasi tindakan yang bisa berbeda aturan atau pesan dampaknya.

Tidak termasuk ulasan, beli ulang, chat penjual, wishlist, voucher, program PLUS,
bulk action, penghapusan riwayat, persetujuan refund, atau perubahan snapshot.
Fitur tersebut tidak ditambahkan hanya karena terlihat pada referensi marketplace.

**Kondisi implementasi 13 November 2026:** `orders_list.php` masih scaffold.
Halaman HTML Pesanan Saya, Pembayaran dan Detail Pesanan tersedia dengan data
contoh bersama berdasarkan orderId. GET daftar pesanan tercatat di A.7,
tetapi layanan aktif belum tersedia.
Produk menetapkan mobile-first; spesifikasi mencakup desktop, tablet dan ponsel.

## 2. Struktur dan isi halaman

| Urutan | Bagian | Isi dan alasan |
| --- | --- | --- |
| 1 | Navbar Figma | Utility, logo/pencarian global, akun/wishlist/keranjang dan kategori tetap sama. Pencarian global tidak diubah menjadi pencarian pesanan. |
| 2 | Judul | H1 Pesanan Saya; penjelasan singkat “Pantau status pesanan Anda.” Penanda data contoh hanya pada pratinjau. |
| 3 | Pencarian pesanan | Label “Cari pesanan”; placeholder “Cari nomor pesanan atau nama produk”. Sumber pencarian adalah snapshot pesanan milik akun. |
| 4 | Filter status | Pilihan tunggal Semua, Menunggu Pembayaran, Diproses, Dikirim, Terkirim, Selesai, Dibatalkan, Perlu Penanganan. Pemetaan pada §5. |
| 5 | Tanggal dan urutan | Rentang tanggal pembelian, default semua tanggal. Urutan Terbaru/Terlama, default Terbaru. Bukan tanggal kirim. |
| 6 | Konteks hasil | Filter aktif, Reset, jumlah/rentang hasil bila benar-benar disediakan server, dan pemberitahuan refresh/error yang terkait daftar. |
| 7 | Daftar kartu | Satu kartu per pesanan; hierarki identitas → produk/biaya → status/kasus → tindakan. Tidak berupa tabel operasional staf. |
| 8 | Pagination | Sebelumnya/Berikutnya sesuai metadata server. Tidak mengambil seluruh tabel untuk disaring di browser. |
| 9 | Footer Figma | Gunakan markup, aset, tipografi dan susunan yang sama dengan storefront terkini. |

### Anatomi kartu

| Area | Data | Perilaku |
| --- | --- | --- |
| Header | Nomor pesanan, tanggal pembelian, status pesanan | Nomor terbaca dan dapat dipilih/disalin secara native; tidak diperlakukan sebagai bukti kepemilikan. |
| Produk | Foto item pertama, nama snapshot, varian, kuantitas dan satuan | Nama panjang membungkus. Konfigurasi buket diringkas tanpa mengubah snapshot. Foto gagal tidak menghilangkan teks. |
| Banyak item | “+N jenis produk lainnya” bila lebih dari satu baris item | N dihitung dari jumlah baris item tersisa, bukan jumlah unit. Detail menampilkan seluruh item. |
| Biaya | Total belanja historis | Integer rupiah, angka tabular, tidak pecah di tengah nominal. Bukan saldo setelah refund. |
| Status pendukung | Pembayaran dan pengiriman dengan nama dimensinya; COD bila berlaku | Pisahkan dari status pesanan. Resi/alamat lengkap tetap di detail. |
| Perhatian | Batas bayar/jendela komplain yang relevan; ringkasan kasus publik | Jangan menampilkan tenggat kerja Admin sebagai tenggat pelanggan. Jangan menyatakan dana kembali sebelum refund berhasil. |
| Tindakan | Maksimal satu utama dan satu tautan detail pendukung bila tujuannya berbeda | Bayar → Pembayaran; Lacak → pelacakan untuk pesanan sama; kondisi lain → Detail Pesanan. Tidak menggandakan dua tombol ke detail yang sama. |

**Rancangan visual:** pola kartu transaksi Tokopedia diterjemahkan ke Poppins,
krem/sage/hijau RylVa, badge dan tombol yang sudah digunakan. Total berada di kanan
pada desktop dan turun ke bagian bawah informasi produk pada ponsel. Metadata dan
tindakan membungkus; tidak ada garis pemotong angka atau tombol yang saling menimpa.
Tidak ditambahkan sidebar profil, poin, promo langganan atau penjual berbeda yang
belum tersedia. Filter status dapat digulir horizontal pada lebar sempit; fokus
keyboard membawa pilihan yang aktif ke area terlihat.

## 3. Alur penggunaan

### Titik masuk dan alur utama

**Implementasi pratinjau:** akses langsung melalui route halaman; tombol kembali
Pesanan Saya dari Detail Pesanan; tautan Lacak Pesanan di navbar menuju daftar.
Akses melalui menu akun/notifikasi mengikuti
route yang benar-benar tersedia, bukan membuat tujuan fiktif.

Alur: cek sesi/peran → loading → Semua/Terbaru → cari atau filter bila perlu →
pilih Bayar/Lacak/Lihat Detail → baca tujuan dengan identitas pesanan sama →
kembali ke daftar dengan pencarian/filter/urutan/cursor dan posisi sebelumnya.

Detail biasa selalu dibuka dari ringkasan di bagian atas. **Rancangan Lacak:**
buka Detail Pesanan dengan identitas dan intent pelacakan, muat ringkasan dari atas,
lalu buka dialog Lacak yang sudah ada setelah data/hak baca valid. Menutup dialog
meninggalkan pengguna di Detail Pesanan; Kembali memulihkan daftar asal. Intent
ini hanya permintaan tampilan baca, bukan izin mutasi atau konfirmasi tiba.
Form berdampak tetap memerlukan konfirmasi dan validasi yang sudah ditetapkan
pada Detail Pesanan. Mengunjungi Pembayaran tidak membuat percobaan bayar baru.

### Pencarian, filter dan halaman

- Pencarian diperbarui otomatis setelah jeda singkat; **usulan teknis 300 ms**.
  Enter menjalankan pencarian segera tanpa permintaan ganda; tombol hapus langsung
  mengosongkan pencarian. Kueri kosong berarti tanpa pencarian.
- Status, tanggal valid dan urutan langsung memperbarui hasil. Tidak ada tombol
  Terapkan. Tanggal akhir sebelum awal menampilkan error dan tidak menjalankan
  permintaan invalid; daftar tetap menunjukkan konteks valid terakhir yang diberi label jelas.
- Perubahan pencarian/status/tanggal/urutan memulai pagination dari awal dan
  menggulir ke awal wilayah hasil, tanpa memindahkan fokus dari kontrol aktif.
- Reset mengosongkan pencarian/tanggal, memilih Semua dan Terbaru, serta kembali
  ke halaman awal. Reset tidak memengaruhi pencarian katalog global.
- Klik pagination mempertahankan semua filter dan urutan, kemudian memindahkan
  fokus secara terarah ke ringkasan hasil yang baru dimuat.

### Kembali, refresh dan pemulihan

- Simpan kueri daftar dalam URL; simpan posisi gulir, ID kartu yang difokuskan
  dan metadata asal dalam history/session per tab dan per akun. Tidak menyimpan
  alamat, dokumen, foto bukti atau payload penuh pesanan sebagai konteks navigasi.
- Kembali dari detail: pulihkan kontrol dan halaman yang sama, baca ulang data
  sesuai konteks, lalu pulihkan posisi berdasarkan ID kartu; offset gulir menjadi
  cadangan. Pembayaran lewat detail mempertahankan konteks asal daftar secara transitif.
- Jika status berubah dan kartu tidak lagi cocok dengan filter, jangan mengubah
  filter diam-diam. Tampilkan “Status pesanan diperbarui; hasil daftar disesuaikan”
  dan fokuskan kartu terdekat/ringkasan hasil.
- Jika halaman menjadi kosong, coba posisi halaman sebelumnya yang masih sah;
  jika cursor kedaluwarsa, mulai dari awal dengan filter tetap dan jelaskan pemulihannya.
- Kembali dari tab baru/direct link tanpa konteks memakai Semua/Terbaru di awal daftar.
- Tidak ada form mutasi di daftar, sehingga tidak perlu dialog “perubahan belum
  disimpan” ketika meninggalkan pencarian/filter. Perlindungan draft tetap milik
  form Detail Pesanan yang ditinggalkan pengguna.

## 4. Komponen dan interaksi

| Komponen | Penggunaan kembali / kebutuhan | State dan perilaku |
| --- | --- | --- |
| Navbar/footer | HTML/CSS/SVG storefront yang sudah diverifikasi | Identitas dan geometri dipertahankan; perubahan hanya pengaitan tujuan yang sekarang sudah tersedia. |
| Tipografi, button, badge, ikon, notice | Fondasi Pembayaran/Detail Pesanan | Hover/focus/disabled/loading konsisten; jangan mengimpor seluruh script halaman lama sebagai komponen generik. |
| Pencarian pesanan | Kontrol baru, pola input proyek | Label permanen, clear, debounce dan pengumuman jumlah hasil. |
| Pilihan status | Baru, gaya filter yang konsisten | Single-select; label dan selected state terlihat. Gunakan tombol filter yang aksesibel, bukan tab ARIA jika tidak ada tabpanel. |
| Rentang tanggal | Pola form/date proyek | Kedua batas opsional, validasi urutan; format input tidak mengubah zona waktu server. |
| Pengurutan | Native select/pola kontrol yang sudah sesuai | Terbaru/Terlama; perubahan mengulang hasil dari awal. |
| Kartu pesanan | Komponen baru | Data terikat orderId yang stabil; navigasi eksplisit, bukan kartu klik besar yang membungkus tombol lain. |
| Pagination | Pola Sebelumnya/Berikutnya proyek | Backend daftar boleh memakai cursor; status tombol mengikuti metadata, bukan tebakan dari jumlah kartu. |
| Empty/error/skeleton | Pola pesan yang sudah ada | Bedakan belum ada pesanan dari filter tanpa hasil dan layanan gagal. |
| Pelacakan, panduan dan form transaksi | Perilaku dari Detail Pesanan | Logika saat ini masih scoped ke halaman. Jika perlu dipakai lintas halaman, ekstraksi dilakukan terarah dengan regresi; jangan menyebutnya komponen import siap pakai. |

Pencarian/status/tanggal/urutan menjadi satu konteks kueri. Permintaan terdahulu
dibatalkan atau diabaikan ketika responsnya tidak lagi cocok dengan kueri terbaru.
Cache hasil harus menyimpan konteks kueri yang menghasilkan data tersebut.
Jangan menempelkan jumlah/kartu hasil lama pada label filter baru seolah hasilnya sudah mutakhir.

## 5. Status dan penanda penting

### Kelompok filter pesanan

| Label filter | Status pesanan yang masuk | Penjelasan |
| --- | --- | --- |
| Semua | Semua status yang sah | Bukan semua pesanan seluruh pelanggan. |
| Menunggu Pembayaran | Menunggu Pembayaran | Tidak ditentukan hanya oleh status dana Menunggu. |
| Diproses | Siap Diproses; Sedang Disiapkan | Kartu tetap menampilkan label tahap sebenarnya agar aturan pembatalan tidak tersamarkan. |
| Dikirim | Dikirim | Sudah diserahkan ke kurir. |
| Terkirim | Terkirim | Paket tercatat tiba, belum tentu Selesai; jendela komplain dapat berjalan. |
| Selesai | Selesai | Status terminal; tidak mengaktifkan komplain baru. |
| Dibatalkan | Dibatalkan | Alasan pembatalan dan progres refund tetap terpisah. |
| Perlu Penanganan | Perlu Penanganan | PH-01–07 sesuai data, bukan kelompok otomatis untuk semua komplain/refund. |

**Fakta penting:** COD dapat Siap Diproses/Dikirim dengan pembayaran Menunggu.
Pesanan tersebut masuk kelompok status pemenuhannya, bukan otomatis Menunggu
Pembayaran. Komplain aktif pada pesanan Terkirim tidak berarti status pesanan
harus dipaksa menjadi Perlu Penanganan. Refund Diproses juga dapat ada pada
pesanan Dibatalkan. Penyelesaian otomatis ditunda selama komplain terbuka.

Dimensi pembayaran, pengiriman, refund, komplain dan permintaan pembatalan
mengikuti nilai resmi v2.6 serta Detail Pesanan. Warna hijau menandai keberhasilan
terverifikasi; status menunggu/perhatian memakai label dan ikon jam/peringatan;
gagal/ditolak memiliki teks alasan dan langkah berikutnya. Ikuti pengecualian
lokal yang sudah ada tanpa mengganti palet global. Loading/offline/stale bukan
status bisnis dan tidak mengubah badge pesanan historis.

Pengguna tidak mengubah status melalui filter atau navigasi. Perubahan bisnis
tetap melalui transisi §8.7 di server, gateway/kurir atau tindakan berwenang.

## 6. Tindakan dan dampaknya

**Rancangan pemilihan tombol kartu:** gunakan satu tindakan utama yang paling
sesuai, bukan menampilkan semua tombol pada setiap status.

| Kondisi kartu | Tindakan utama | Tindakan pendukung |
| --- | --- | --- |
| Online Menunggu Pembayaran, masih layak membayar | Bayar | Lihat Detail Pesanan |
| Tenggat/hasil pembayaran belum pasti | Periksa Pembayaran | Lihat Detail Pesanan |
| Siap Diproses / Sedang Disiapkan, termasuk COD belum lunas | Lihat Detail Pesanan | Tidak perlu tautan duplikat |
| Dikirim | Lacak | Lihat Detail Pesanan |
| Terkirim tanpa kasus aktif | Lihat Detail Pesanan; pengingat periksa paket dan batas komplain | Lacak bila tersedia |
| Perlu Penanganan / komplain / refund yang membutuhkan perhatian | Lihat Penanganan / Komplain / Refund sesuai ringkasan publik, menuju detail | Pelacakan hanya bila relevan |
| Selesai / Dibatalkan tanpa kasus aktif | Lihat Detail Pesanan | Tidak perlu tautan duplikat |
| Status/identitas tidak dapat dipastikan | Perbarui atau bantuan | Detail hanya jika ID dan hak baca sah |

Jika beberapa kondisi bertemu, kasus publik yang membutuhkan tindak lanjut
didahulukan. Label kasus tidak memberi kewenangan memutuskan refund atau
menyatakan pelanggan wajib merespons bila server belum menyediakan informasi itu.

| Tindakan | Syarat / ketersediaan | Dampak, umpan balik dan pemulihan |
| --- | --- | --- |
| Cari / ubah filter / urutkan | Sesi berhak; nilai valid | Hanya membaca; reset cursor. Tampilkan loading wilayah hasil dan abaikan respons usang. |
| Reset | Ada nilai nondefault | Kembali Semua/Terbaru tanpa tanggal/kueri; tidak mengubah pesanan. |
| Sebelumnya / Berikutnya | Metadata halaman tersedia | Muat bagian lain dengan kueri sama. Tombol diblokir saat permintaan sama berjalan. |
| Perbarui daftar | Tidak ada permintaan identik; tidak sedang rate limited | Baca ulang konteks saat ini. Jika gagal, jangan menyatakan status baru berhasil. |
| Bayar | Online, order Menunggu Pembayaran, server mengizinkan; tidak dalam peninjauan/hasil tak pasti | Navigasi ke Pembayaran order sama. Tidak membuat payment attempt atau mengubah tenggat. |
| Periksa Pembayaran | Tenggat lewat/hasil pembayaran perlu dipastikan | Buka status/instruksi Pembayaran; bukan ajakan membayar ulang. |
| Lacak | Identitas dan hak baca valid; data tahap tersedia | Buka Detail Pesanan dengan dialog pelacakan order sama setelah data valid. Belum ada resi ditampilkan sebagai informasi, bukan link kurir rekaan. |
| Lihat Detail Pesanan | Milik akun dan tersedia | Buka ringkasan teratas; simpan konteks asal. Untuk Terkirim, microcopy mengingatkan memeriksa paket dan tenggat komplain. |
| Lihat Penanganan / Komplain / Refund | Ada kasus publik terkait | Buka Detail Pesanan order sama; keputusan dan formulir berada di sana. |
| Masuk / verifikasi kembali | Respons autentikasi memerlukannya | Pertahankan tujuan aman; bersihkan data pemilik sebelumnya. Tujuan akun harus benar-benar tersedia saat integrasi. |
| Mulai Belanja | Daftar benar-benar kosong dan tujuan katalog sudah tersedia | Navigasi ke katalog yang terkonfigurasi; tidak membuat pesanan otomatis. |

Navigasi tidak membutuhkan konfirmasi. Konfirmasi penerimaan, pembatalan dan
pengiriman komplain tetap membutuhkan validasi/konfirmasi pada halaman tujuan.
Daftar tidak memberi tombol yang tampak langsung menyelesaikan pesanan tetapi
diam-diam hanya berpindah halaman. Tidak ada bulk action, hapus riwayat atau
tombol Tandai Lunas. Cegah klik navigasi ganda tanpa mematikan Ctrl/Cmd+klik
atau pembukaan tautan pada tab baru.

## 7. Aturan bisnis, validasi dan hak akses

- Server membatasi daftar berdasarkan akun dalam sesi, sebelum pencarian,
  filter, total/count atau pagination. ID pelanggan dari URL bukan otorisasi.
- Pelanggan hanya melihat miliknya. Peran staf memakai halaman operasional;
  permintaan objek milik akun lain memberi 404 tanpa bocoran. Verifikasi akun
  mengikuti kebijakan server; tidak disimulasikan sebagai proses verifikasi nyata.
- Pencarian diusulkan cocok sebagian dan tidak peka kapital untuk nomor pesanan
  atau nama produk snapshot. Tidak mencari nomor telepon/alamat pelanggan.
  **Usulan batas defensif UI: 100 karakter**, perlu dicocokkan dengan kontrak API.
  Kueri dari URL yang melebihi batas diberi pesan untuk diperpendek; tidak dipotong
  diam-diam atau diteruskan mentah ke backend.
- Jangan memaksa nomor lengkap yang valid untuk pencarian; pelanggan boleh
  memasukkan potongan nomor atau nama. Validasi format nomor berlaku saat
  pembuatan order di server, bukan alasan menolak pencarian parsial.
- Tanggal awal/akhir opsional. Jika keduanya ada, awal ≤ akhir. Rentang diterapkan
  pada waktu pembelian dalam WIB; akhir tanggal mencakup seluruh hari, dengan
  batas UTC eksklusif pada awal hari berikutnya. Tidak menetapkan maksimal
  rentang hari atau menutup riwayat lama tanpa dasar spesifikasi.
- Status dan urutan memakai daftar nilai yang diizinkan. Parameter URL yang
  tidak sah dinormalisasi ke default dengan pemberitahuan bila memengaruhi hasil;
  parameter invalid tidak diteruskan mentah ke SQL.
- Pengurutan stabil berdasarkan dibuat_pada dan ID sebagai pemecah waktu yang sama.
- Deadline mengikuti server. Tanggal perangkat hanya membantu tampilan;
  tenggat habis tidak membatalkan order, melepas stok atau menandai dana gagal di browser.
- Snapshot item/harga/satuan tidak diganti data katalog terbaru. Barang nonaktif
  atau terhapus dari katalog tidak menghapus riwayat pembeliannya.
- Status/tindakan ditinjau ulang saat membuka tujuan; hasil daftar lama tidak
  mengesahkan mutasi. Double-click GET tidak boleh membuat mutasi backend.

## 8. Matriks state

Prioritas: **W** wajib untuk UI/alur inti; **L** lanjutan bersyarat integrasi.
Fakta bisnis mengikuti baseline; rincian pesan dan pemulihan di tabel merupakan rancangan.

| Area / komponen | Nama state | Pemicu | Isi tampilan / pesan | Tindakan tersedia | Data / input dipertahankan | Jalur pemulihan | Prioritas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Halaman | Normal | Sesi dan respons valid | Kartu, kueri aktif, metadata halaman | Baca, filter, navigasi | Konteks daftar | — | W |
| Kontrol | Hover / focus | Pointer / keyboard | Outline/warna dan label terlihat | Aktivasi | Nilai kontrol | Pindah fokus | W |
| Status | Selected | Satu filter dipilih | Penanda selain warna; Semua hanya satu pilihan | Ganti status | Kueri lain | Baca hasil baru | W |
| Tanggal / disclosure | Expanded / collapsed | Buka/tutup kontrol | Bidang tanggal/petunjuk terlihat sesuai kebutuhan | Pilih, tutup | Nilai tanggal | Escape/fokus kembali jika popover | W |
| Pagination / CTA | Disabled | Tak ada halaman, loading atau hak aksi tidak sah | Tampilan nonaktif; alasan bila perlu | Tindakan sah lainnya | Kueri | Hasil baca / perubahan kondisi | W |
| Kartu | Read-only | Arsip/histori hanya baca | Snapshot dan label historis | Lihat detail yang diizinkan | Snapshot | Bantuan | L |
| Halaman | Loading awal | Permintaan pertama | Skeleton berbentuk kartu, “Memuat pesanan…” | Kembali | URL/asal | Hasil / error | W |
| Daftar | Memperbarui hasil | Kueri/refresh berubah | Loading hanya wilayah hasil; kontrol tetap | Ubah/batalkan kueri berikutnya | Kueri terbaru; hasil terakhir terikat kuerinya | Respons terbaru | W |
| Pagination | Memuat halaman berikutnya | Berikutnya/Sebelumnya | Indikator dan kontrol terkunci sementara | Tunggu | Filter/cursor/posisi sebelumnya | Hasil / retry | W |
| Permintaan | Dibatalkan karena kueri baru | Pengguna mengetik/memilih cepat | Tanpa banner error untuk abort normal | Lanjut mengubah | Kueri terakhir | Abaikan respons lama | W |
| Halaman | Proses lama / timeout | Baca belum selesai | “Pesanan belum selesai dimuat” | Coba lagi / kembali | Semua kontrol | Permintaan baru, hasil lama diabaikan | W |
| Akun | Belum punya pesanan | Respons kosong pada kueri default | “Belum ada pesanan. Pesanan akan muncul setelah checkout.” | Mulai Belanja jika tujuan tersedia; panduan | Akun | Katalog nyata / kembali | W |
| Pencarian | Tanpa hasil | Kueri valid tidak cocok | “Pesanan tidak ditemukan untuk pencarian ini” | Hapus kata kunci / Reset | Kueri dan filter | Baca ulang | W |
| Filter | Tanpa hasil | Kombinasi status/tanggal kosong | Sebut filter aktif, tanpa menyiratkan akun belum pernah belanja | Hapus filter / Reset | Semua pilihan | Longgarkan filter | W |
| Data opsional | Belum lengkap | Varian/jadwal/resi belum tersedia | Placeholder per bidang, bukan angka nol palsu | Detail / perbarui | Bagian valid | Data terbaru | W |
| Respons | Sebagian baris tidak valid | Satu ringkasan rusak | Placeholder kartu bermasalah; beri tahu sebagian detail belum tersedia | Detail hanya jika ID/hak valid; retry | Kartu valid dan kueri | Perbaikan sumber / muat ulang | W |
| Nominal / identitas | Data inti tidak valid | Total/ID/status tak dikenali | Jangan menebak harga/status atau mengaktifkan Bayar | Perbarui / bantuan | Konteks aman | Normalisasi backend | W |
| Produk | Gambar gagal | Image error / URL tak tersedia | Placeholder “Foto belum tersedia”; nama tetap ada | Detail | Teks/snapshot | Aset diperbaiki | W |
| Konten | Nama/nominal panjang | Stress data | Membungkus nama, angka utuh, tombol turun baris | Normal | Isi lengkap | Tidak perlu recovery | W |
| Hasil | Daftar diperbarui | Respons baca terbaru berhasil | Pengumuman ringkas; timestamp aktual | Baca | Konteks | — | W |
| Sinkronisasi | Sebagian pembaruan gagal | Penyegaran metadata tambahan gagal | Kartu inti tetap; bagian tambahan ditandai belum diperbarui | Retry bagian / refresh | Data valid | Tidak mengklaim semua berhasil | L |
| Tanggal | Validasi bermasalah | Awal > akhir / tanggal tidak sah | “Tanggal akhir harus sama atau setelah tanggal awal” dekat bidang | Perbaiki / hapus tanggal | Isian dan hasil valid terakhir | Kueri valid baru | W |
| URL / pencarian | Parameter tidak sah | Status/urut/tanggal/cursor rusak atau kueri terlalu panjang | Default aman atau pesan bidang yang spesifik, termasuk “Perpendek pencarian hingga 100 karakter” | Reset / perbaiki | Nilai sah dan isian yang perlu diperbaiki | URL/kueri valid | W |
| Respons | Duplikasi kartu | ID yang sama muncul lebih sekali | Jangan menggandakan kartu; deduplikasi berdasarkan ID/versi | Perbarui | Kueri dan kartu terbaru yang sah | Perbaiki respons server | W |
| Daftar | Gagal memuat | 5xx / jaringan | “Pesanan belum dapat dimuat” | Coba lagi / panduan | Kueri | Muat ulang wilayah hasil | W |
| Refresh | Gagal memperbarui | Gagal sesudah data pernah tampil | “Data terakhir belum diperbarui”; label konteks hasil sebelumnya | Retry; detail baca jika aman | Data/kueri terakhir dan kueri yang diminta | Respons terbaru | W |
| Koneksi | Offline | Browser/jaringan terputus | Data terakhir dan waktu snapshot, tanpa klaim status terbaru | Sambungkan; retry | Konteks dan cache milik akun aktif | Baca setelah online | W |
| Layanan | Maintenance / gangguan | Respons layanan | Pesan pemeliharaan/layanan bermasalah tanpa detail internal | Coba nanti / kembali | Kueri | Layanan pulih | W |
| Layanan | Rate limited | 429 | Waktu tunggu Retry-After bila ada | Tunggu lalu coba lagi | Kueri | Tombol aktif setelah batas | W |
| Akses | Belum masuk | 401 awal | “Masuk untuk melihat pesanan Anda” | Login saat route tersedia | Tujuan aman | Login lalu baca | W |
| Akses | Sesi berakhir | 401 saat refresh | Bersihkan kartu/count privat dari DOM | Masuk kembali | Tujuan/kueri aman, bukan data akun | Verifikasi ulang sesi | W |
| Akses | Denied / akun staf | 403 atau peran salah | Halaman khusus akun pelanggan | Kembali / panduan | Tidak ada data pesanan | Akun pelanggan | W |
| Akses | Verifikasi diperlukan | Server mensyaratkan | Instruksi verifikasi; tidak berpura-pura mengirim kode | Verifikasi melalui alur akun | Tujuan aman | Akun tervalidasi | L |
| Detail tujuan | Tidak ditemukan / tidak tersedia | 404/410 saat membuka order | Pesanan tidak ditemukan atau tak dapat diakses; tidak membocorkan pemilik | Kembali daftar / perbarui | Konteks daftar asal | Daftar terbaru | W |
| Katalog | Produk nonaktif / terhapus | Katalog berubah | Snapshot pembelian tetap tampil | Detail pesanan | Nama/varian/harga historis | Tidak perlu membeli ulang | W |
| Pagination | Cursor kedaluwarsa | Server menolak token | “Posisi daftar perlu diperbarui” | Mulai dari awal dengan filter sama | Kueri/status/tanggal/urut | Cursor awal baru | W |
| Navigasi | Membuka tujuan | Klik Bayar/Lacak/Detail | Indikator singkat bila lambat; cegah klik ganda biasa | Tunggu / kembali | Order ID dan konteks asal | Tujuan / pesan gagal | W |
| Tujuan | Gagal membuka aksi | Jaringan/layanan tujuan gagal | Kesalahan di tujuan; tidak mengubah status di daftar | Coba lagi / kembali daftar | Asal dan identitas sah | Recovery tujuan | W |
| Sinkronisasi | Status berubah | Kembali dari detail / refresh | Badge dan CTA terbaru; jika keluar filter, jelaskan hasil disesuaikan | Baca hasil baru | Filter dan posisi paling dekat | Revalidasi | W |
| Sinkronisasi | Tampilan usang | Cache lama / tab kembali aktif | Timestamp + “Perbarui untuk memastikan status terbaru” | Refresh / baca detail | Konteks | Baca server, bukan asumsi lokal | W |
| Pembayaran | Tenggat baru lewat | Waktu server mencapai deadline | “Batas waktu tercapai; periksa status pembayaran” | Periksa Pembayaran | Snapshot | Pemeriksaan server/gateway | W |
| Pengiriman | Belum ada resi | Belum diserahkan | Informasi belum tersedia, tanpa URL rekaan | Detail / panduan | Snapshot | Event pengiriman terbaru | W |
| Proses bisnis | Menunggu keputusan | Komplain/pembatalan/refund berjalan | Status dan langkah berikutnya; belum disetujui/berhasil | Lihat Detail | Ringkasan kasus | Keputusan berwenang | W |
| Akun / tab | Akun berubah | Logout / akun lain / sesi dicabut | Hapus cache/count/kartu akun sebelumnya | Login / baca ulang | Preferensi nonprivat saja | Konteks akun baru | W |

Tidak dipaksakan pada daftar ini: penyimpanan form, perubahan belum disimpan,
upload parsial, konflik mutasi, persetujuan/refund manual atau bulk success.
Daftar hanya melakukan pembacaan dan navigasi; state tindakan bisnis tersebut
tetap wajib ditangani pada Detail Pesanan/Pembayaran.

## 9. UX dan aksesibilitas

- Hierarki: judul → kontrol → konteks hasil → identitas pesanan → snapshot/total
  → tindakan. Hindari empat kartu statistik atau banner promosi sebelum daftar.
- Nama/varian panjang membungkus; nominal satu unit, tidak terpotong atau
  memisahkan digit. Status tidak boleh menimpa nomor/tanggal. Aksi sejenis sejajar.
- Semua kontrol berlabel dan dapat dipakai keyboard. Selected memakai teks/bentuk
  serta `aria-pressed` pada filter; fokus terlihat dan tidak tertutup bagian sticky.
- Pengumuman hasil menggunakan live polite; error penting memakai alert yang
  proporsional. Jangan mengumumkan setiap karakter pencarian atau semua kartu ulang.
- Loading wilayah hasil memakai aria-busy. Saat mengetik/ubah filter, fokus tetap
  pada kontrol; saat pagination selesai fokus ke ringkasan hasil. Kembali dari
  detail mengembalikan fokus ke kartu/pemicu yang sama atau lokasi terdekat.
- Target utama minimal 44×44 px. Shell Figma mengikuti pengecualian presisi
  desktop yang sudah dicatat; keterbatasan kontras utility/promo/footer sumber
  tidak diubah diam-diam dan tidak menjadi klaim seluruh halaman lolos AA.
- Desktop memakai kartu lebar; tablet/mobile menumpuk isi tanpa scroll halaman
  horizontal. Baris filter status boleh bergulir horizontal secara terlihat.
  Periksa 1440, 1024, 768, 390 dan 320 px ketika implementasi; zoom dan reduced-motion juga diperiksa.

## 10. Data, keamanan dan kebutuhan sistem

### Read model yang diusulkan

| Data | Sumber yang ditemukan / kebutuhan |
| --- | --- |
| orderId, orderNo, createdAt, version | `pesanan`, termasuk `versi_kunci_optimis`; mapper menyelaraskan DTO frontend. ID diperlakukan sebagai identitas, bukan kewenangan. |
| orderStatus, paymentStatus, isCod, metode | Enum/kolom pesanan dan data pembayaran; mapper mengubah kode mesin ke label konsisten. |
| shippingStatus, courierName, trackingAvailable | `pengiriman` dan relasi pesanan; list tidak perlu payload bukti/foto lengkap. |
| firstItem, itemLineCount, unitCount | Snapshot `item_pesanan` serta konfigurasi buket; bedakan jumlah jenis dan unit. |
| totalAmount, currency | Total historis integer IDR. Backend bertanggung jawab atas perhitungan; jangan mengurangi total dengan refund di UI. |
| paymentDeadline, complaintDeadline | Kolom tenggat server; serverNow/snapshotAt diperlukan untuk penanda waktu dan kesegaran. |
| caseSummary, refundStatus, complaintStatus, cancellationStatus | Relasi kasus; hanya teks publik dan nominal terkonfirmasi bila tersedia. |
| allowedActions, tujuan internal | **Usulan DTO**, bukan kontrak API aktif. Tujuan harus memuat orderId yang sama dan jalur yang diizinkan. |
| records + pagination + queryContext | **Usulan envelope daftar**; cursor berikut/sebelumnya, page size, optional exact count, waktu respons. Query/cursor harus terikat akun/filter/urutan. |

**Fakta:** A.7 menetapkan GET `/api/v1/orders` untuk daftar milik pelanggan;
detail dan receipt juga tercatat. Ini belum layanan aktif. Tidak ada endpoint
count/search pesanan terpisah yang dianggap tersedia. Parameter katalog `q`,
`page` di A.7 tidak otomatis menjadi kontrak pencarian daftar pesanan.

**Rancangan pagination:** cursor stabil berdasarkan waktu dibuat dan ID,
Sebelumnya/Berikutnya, **usulan awal 10 pesanan per halaman**. A.11 mengizinkan
cursor atau offset terbatas. Pilihan ini mengurangi pergeseran karena order baru
tanpa menjanjikan snapshot database lintas request. Jika kontrak backend memilih
offset, gunakan implementasi bounded yang disepakati tanpa mengubah prinsip
filter/restore. Nomor halaman/total halaman hanya ditampilkan jika metadata mendukung.

Nama parameter URL frontend yang diusulkan: q, status, dateFrom, dateTo, sort,
cursor. Ini state navigasi usulan; nama query API, batas maksimum dan bentuk
token belum disahkan. Respons kasus/status dapat tetap berubah di antara
halaman; deduplikasi dan revalidasi tetap diperlukan.

**Frontend:** kartu, kontrol, URL/history, pengabaian respons usang, pagination,
state, aksesibilitas dan navigasi terarah. **Backend:** autentikasi/peran/ownership,
query PDO, pencarian snapshot, filter/urut/pagination, count bila disediakan,
hak tindakan, konsistensi status, deadline dan minimisasi data.

Tidak mengirim alamat lengkap, telepon, data rekening refund, lampiran komplain,
catatan staf atau payload provider ke daftar bila tidak diperlukan. Cache privat
terikat akun dan dibersihkan saat logout/sesi berakhir. Tidak ada mutasi dengan
GET. CSRF/idempotensi/audit mutasi tetap dijalankan pada endpoint tindakan di
halaman tujuan, bukan dibuat ulang sebagai transaksi dari klik kartu.

**Implementasi identitas:** repository fixture bersama membaca orderId milik akun
contoh; list → detail → pembayaran tetap memakai snapshot yang sama. Parameter
scenario/paymentState lama tetap tersedia untuk regresi terisolasi. Konteks
kembali daftar menyimpan kueri, cursor, fokus dan posisi gulir; tujuan dibatasi
origin serta path daftar internal, tanpa menerima return URL eksternal.
Fixture pratinjau terpisah dari adapter layanan; seluruh data contoh ditandai,
kontrol skenario berada pada workbench di luar root publik.
Repository sintetis memakai sessionStorage per tab dengan fallback memori.
Pemeriksaan kepemilikan fixture bukan pengganti otorisasi server atau sinkronisasi
akun lintas tab pada produksi.

## 11. Daftar pekerjaan dan kriteria selesai

### Daftar pekerjaan

| Prioritas | Pekerjaan | Ketergantungan |
| --- | --- | --- |
| Wajib | Definisikan mapper/read model daftar dan identitas bersama | Enum/skema, DTO dan adapter yang disepakati; tidak membuat endpoint rekaan. |
| Wajib | Gunakan shell/aset/token/format data yang ada | Shell Figma dan fondasi storefront. |
| Wajib | Buat kartu, pencarian, filter status/tanggal/urutan dan pagination | Query dan metadata daftar; fixture terbatas bila backend belum ada. |
| Wajib | Hubungkan Bayar/Lacak/Detail dengan orderId sama | Penyesuaian adapter Detail/Pembayaran; sumber bersama, bukan menyalin data per tombol. |
| Wajib | Tambahkan konteks asal dan restore daftar | URL, history, anchor kartu, validasi tujuan internal. |
| Wajib | Lengkapi seluruh state W, keyboard dan layout data panjang | Fixture/workbench terpisah; tidak ada kontrol pengujian di UI pelanggan produksi. |
| Wajib | Periksa regresi shell, Detail dan Pembayaran | Perubahan bersama dibatasi dan diuji. |
| Lanjutan | Hubungkan backend/auth/katalog/notifikasi yang nyata | Modul-modul tersebut belum terintegrasi. |
| Opsional | Count tiap status, filter komplain/refund, pemilihan page size | Hanya jika kontrak backend mendukung dan kebutuhan terbukti; jangan hitung dari satu halaman. |

### Kriteria penerimaan yang dapat diperiksa saat implementasi

1. Navbar/footer identik dengan shell Figma yang sudah diverifikasi; UI di luar target tidak berubah.
2. Akun A tidak mendapat kartu, total/count atau tujuan pesanan akun B, termasuk setelah ganti akun/tab.
3. COD Siap Diproses/Dikirim dengan dana Menunggu tidak muncul sebagai order online yang wajib dibayar.
4. Terkirim, Selesai, Dibatalkan dan Perlu Penanganan tetap dapat dibedakan; refund/komplain tidak mengubahnya secara fiktif.
5. Search/status/tanggal/urut langsung memperbarui hasil; Reset dan clear bekerja; URL merepresentasikan kueri yang sah.
6. Tanggal WIB benar pada batas tengah malam; urutan awal/akhir invalid tidak dikirim dan error pulih setelah diperbaiki.
7. Respons pencarian lama tidak mengganti hasil terbaru saat jaringan lambat; loading/error tidak diberi label sebagai data baru.
8. Pagination tidak mengunduh seluruh riwayat. Batas awal/akhir, cursor usang, duplikat dan data yang pindah filter dipulihkan dengan jelas.
9. Kartu yang sama membuka detail/pembayaran/pelacakan yang sama. Klik Bayar tidak membuat payment attempt atau memperbarui stok.
10. Kembali memulihkan pencarian, filter, urutan, halaman, fokus dan posisi gulir; perubahan status direkonsiliasi tanpa reset diam-diam.
11. Belum punya pesanan, tanpa hasil, data parsial, aset gagal, offline, timeout, 429, maintenance, sesi habis dan 404 memiliki langkah berikutnya.
12. Nama panjang, multi-item, nominal besar dan gambar gagal tidak menyebabkan clipping/overlap pada ukuran sasaran.
13. Navigasi keyboard, fokus, label, pengumuman hasil, disabled dan reduced-motion diperiksa pada render nyata.
14. Workbench dan data contoh jelas terpisah; daftar tidak diklaim terhubung ke backend sebelum integrasinya benar-benar diuji.
15. Pemeriksaan struktur/syntax, e2e dan regresi lintas halaman mempunyai bukti aktual pada dokumen cakupan; tidak membuktikan backend produksi telah lulus.

## 12. Asumsi dan keputusan yang belum pasti

| Temuan | Dampak / sikap rancangan |
| --- | --- |
| Background daftar Tokopedia hanya terlihat sebagian | Anatomi kartu/filter yang diimplementasikan mengikuti pola familiar, bukan klaim menyalin frame daftar lengkap. |
| GET orders tercatat, query/filter/cursor/count belum dikontrak | Susun DTO dan adapter sebelum implementasi integrasi. Cursor, 10 per halaman, search 100 karakter/debounce 300 ms adalah usulan teknis, bukan parameter bisnis v2.6. |
| Sumber hanya mendefinisikan pelanggan terverifikasi; alur akun belum aktif | Server menentukan 401/403/verifikasi dan tujuan login; UI tidak mengarang proses verifikasi atau akses tanpa izin. |
| Adapter lama dipilih berdasarkan scenario | Dukungan orderId serta repository fixture bersama sudah ditambahkan. Data produksi dan otorisasi masih memerlukan backend. |
| Nomor contoh lama `RV-261112-PAY001` berbeda dari batas karakter suffix resmi | Anggap sebagai fixture lama, bukan format produksi yang sah. Saat membuat fixture bersama, selaraskan nomor dan seluruh tautannya sekaligus; pencarian parsial tidak diblokir regex nomor penuh. |
| SQL `total_dana_dikembalikan_rupiah` menyebut berhasil/disetujui sekaligus | Jangan menampilkan “dana telah kembali” dari agregat itu; gunakan refund berstatus Berhasil dan DTO yang tidak ambigu. |
| P-01 vs P-40 untuk tenggat pembayaran | Gunakan deadline server, bukan timer atau aturan baru pada daftar. |
| Matriks kombinasi status belum lengkap untuk COD dalam pemenuhan | Ikuti aturan eksplisit T-20/§9.1 yang mengizinkan COD belum lunas; tidak memalsukan pembayaran Berhasil. |
| Utility Figma “Pengembalian mudah 7 hari” vs jendela komplain P-11 24 jam | Shell tetap sesuai instruksi; isi transaksi mengikuti v2.6. Copy pemasaran perlu penyelarasan tersendiri sebelum rilis. |
| Header Figma/footer dan beberapa warna memiliki keterbatasan kontras | Pertahankan referensi yang dipin, dokumentasikan; jangan menyatakan seluruh shell lolos AA. |
| Katalog/login/notifikasi dan persetujuan penawaran PH belum tersedia penuh | Tautan/aksi hanya diaktifkan setelah tujuan benar tersedia; tidak mengisi kekosongan dengan perilaku palsu. |
| Tidak ada bukti endpoint cache/count/live update khusus | Tidak membuat badge jumlah rekaan atau mengasumsikan WebSocket/polling. Revalidasi pada kembali/visibility dan refresh manual menjadi dasar. |

Tidak ada keputusan tambahan yang menghambat implementasi frontend pratinjau.
Kontrak layanan yang belum ada tetap diselesaikan saat integrasi; perubahan
kebijakan mengikuti spesifikasi/change control. Implementasi tidak mengubah
aturan bisnis, tema global atau bagian storefront di luar cakupan.

## Direction contract

**THESIS:** daftar transaksi yang membantu pelanggan menemukan pesanan dan melanjutkan tindakan yang tepat, dengan status uang dan pengiriman tetap terpisah.

**OWN-WORLD:** navbar/footer Figma asli, Poppins, kanvas krem dan hijau botani; kartu transaksi berbingkai tipis dan tombol dari storefront terkini. Tidak ada tema baru.

**STORY:** pelanggan mengenali status, mempersempit daftar, membuka transaksi yang sama, kemudian kembali ke konteks semula.

**FIRST VIEWPORT:** shell Figma, judul Pesanan Saya, pencarian berlabel, filter status, tanggal/urutan dan daftar kartu. Identitas/tanggal di header kartu, produk di kiri, total di kanan; tindakan mengikuti status. Pada ponsel elemen menumpuk tanpa tumpang tindih.

**FORM:** Operate, code-led, `seed: none (pinned)` — “Implementasikan UI target ... berdasarkan spesifikasi ... yang telah disepakati”, “buat kaya UI tokped agar user tidak binggung”, dan “untuk nav dan footernya wajib sama dengan yang sudah saya buat di figma”.

**QUALITY BAR:** pencarian/filter/pagination jujur, setiap tautan membawa orderId yang sama, restore pencarian/fokus/gulir berfungsi, state dan data panjang terbaca, serta hasil dirender dan diperiksa.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
