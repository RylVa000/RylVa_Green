# Profil & Pengaturan Akun — spesifikasi pelanggan

> **Revisi lanjutan dari pengguna:** Aktivitas Login menjadi bagian UI Keamanan;
> alamat mengikuti gambar Figma, dengan Leaflet/geocoding dan detail wilayah
> tersembunyi bila lengkap; tombol serta shell ponsel dipadatkan. Ketentuan
> terbaru dan batas integrasinya tercantum pada
> [revisi pelanggan](../../coverage/customer-refinements.md), mengesampingkan
> keterangan “opsional/belum terhubung” awal untuk UI sesi dan peta di bawah.

13 November 2026. Spesifikasi menjadi acuan implementasi frontend pratinjau atas
permintaan eksekusi pengguna. Backend akun produksi belum terintegrasi.

## Direction contract

**THESIS:** pelanggan mengelola identitas, alamat dan keamanan melalui baris
informasi dengan tindakan Ubah yang jelas, tanpa mencampur data pesanan historis.

**OWN-WORLD:** shell Figma asli, Poppins, krem/sage/hijau RylVa; tombol, badge,
dialog dan form storefront digunakan kembali. Tidak ada tema atau font baru.

**STORY:** baca identitas → pilih bagian akun → ubah dengan validasi → tinjau
hasil → kembali ke konteks asal, dengan draft terlindungi dan rahasia tidak disimpan.

**FIRST VIEWPORT:** navbar/footer Figma, judul akun, ringkasan pelanggan di kiri,
panel kanan dengan navigasi Profil/Daftar Alamat/Keamanan/Privasi & Akun, serta
baris nama/email/telepon dan aksi Ubah. Ponsel menumpuk tanpa kehilangan navigasi.
Screenshot Tokopedia pengguna menjadi referensi struktur; foto unggahan, tanggal
lahir, gender, dompet dan rekening tidak ditambahkan dari gambar.

**FORM:** Operate, code-led, `seed: none (pinned)`; pengguna meminta implementasi
spesifikasi yang disepakati dengan referensi UI Tokopedia serta navbar/footer
yang wajib sama dengan Figma. Penyempurnaan topologi navigasi mengikuti gambar
terbaru; identitas visual dan aturan bisnis tetap.

**QUALITY BAR:** empat panel lengkap, aksi berbasis capability, state pemulihan,
draft/fokus aman, identitas akun tidak bocor saat sesi berakhir, alamat tidak
mengubah snapshot pesanan, dan render desktop/tablet/ponsel diuji.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

**Fakta** berarti ditemukan pada sumber proyek atau keputusan pengguna.
**Usulan** berarti keputusan rancangan untuk halaman ini, belum bukti fitur aktif.
**Asumsi perlu dikonfirmasi** berarti kontrak atau kebijakan belum ditetapkan;
implementasi tidak boleh mengubahnya menjadi aturan bisnis secara diam-diam.

## Sumber dan batas pemeriksaan

- **S1 — sumber utama:** [spesifikasi v2.6](../../specifications/spesifikasi-proyek-v2.6.md),
  §3 peran/hak akses; §5 model data; §6.3 autentikasi dan perubahan akun;
  §9.7 perubahan alamat pesanan; §13.3 audit; §15.3–15.6 validasi, CSRF dan sesi;
  P-26/P-28/P-29/P-30/P-32/P-34–36/P-44; A.7 API; §27.6 prioritas halaman.
- **S2:** [PRODUCT.md](../../../PRODUCT.md) dan [DESIGN.md](../../../DESIGN.md),
  termasuk mobile-first, Bahasa Indonesia, Poppins, hijau/krem, dialog dan form.
- **S3 — desain:** [file Figma](https://www.figma.com/design/LcUKB3k9C38G0g6KWo5zIU/Morkup-TA-Web-Berryl?node-id=0-1),
  diperiksa langsung pada inventaris 13 November 2026. Halaman profil pelanggan
  lengkap belum ditemukan. Referensi yang sudah dilihat: Pilih Alamat `409:107`,
  Tambah Alamat #1 `435:105`, Tambah Alamat #2 `435:130`, Login `428:264`,
  Register `72:136`, OTP `90:220`, Forget Pass `126:114`, New Pass `126:155`.
  [Inventaris](../../coverage/storefront-page-inventory.md) membedakan frame,
  komponen, teks lepas dan implementasi. Perilaku di bawah merupakan usulan
  kecuali dijelaskan eksplisit oleh S1; screenshot tidak membuktikan interaksi.
- **S4 — shell yang dipin:** [acuan navbar/footer](storefront-shell.md), sumber
  Checkout `375:108` dan gambar pengguna. Navbar/footer wajib tetap sama dengan
  Figma; tidak diganti oleh shell lama autentikasi/kontak atau shell panel staf.
- **S5 — kode:** `templates/customer/profile_addresses.php`,
  `src/Http/Controllers/Customer/ProfileAndAddressController.php`, validator
  Address/Auth, serta `config/routes.php` masih scaffold. Pembayaran, Detail
  Pesanan dan Pesanan Saya tersedia sebagai frontend data contoh. Profil staf
  merupakan modul berbeda, bukan implementasi akun pelanggan.
- **S6 — skema:** [DB_RylVa_Green.sql](../../../database/schema/DB_RylVa_Green.sql),
  tabel `akun_pengguna`, `alamat_pengguna`, `identitas_eksternal`, `sesi_login`.
  Kolom dan kapasitas penyimpanan adalah bukti data, bukan bukti endpoint aktif.
- **Skill:** design-taste-frontend, Hallmark, Impeccable dan UI/UX Pro Max
  digunakan sesuai mode **Operate**, identitas incumbent dan batas pengguna.
  Dokumen ini awalnya hasil spesifikasi; setelah permintaan eksekusi, frontend
  dan pemeriksaan render ditambahkan. Bukti aktual serta batas integrasinya
  dicatat dalam [cakupan implementasi](../../coverage/customer-account-ui.md).

## 1. Pemahaman dan cakupan halaman

**Tujuan:** pelanggan memperbarui data dirinya, mengelola alamat tersimpan,
memahami metode masuk, mengamankan akses dan meminta penghapusan akun tanpa
mengubah data historis pesanan atau kehilangan konteks belanja.

**Jenis halaman:** privat milik **pelanggan** yang sudah terautentikasi dan aktif.
Pengunjung diarahkan ke login dengan tujuan kembali internal yang aman. Akun
Belum Terverifikasi tidak dapat login menurut §6.3.1; verifikasi registrasi
berada di alur autentikasi. Admin/SuperAdmin memakai profil staf terpisah.
Semua akses serta kepemilikan alamat diperiksa server, bukan parameter role.

| Termasuk cakupan | Batas penting |
| --- | --- |
| Ringkasan nama, email akun, verifikasi dan metode masuk | Tidak menampilkan hash, token, rahasia MFA atau identitas internal Google. |
| Mengubah nama dan nomor telepon akun | Nomor akun berbeda dari nomor penerima pada tiap alamat. |
| Buku alamat: lihat, cari, tambah, ubah, hapus, jadikan utama | Maksimum P-26; memakai ulang desain alamat. Tidak mengubah snapshot pesanan. |
| Permintaan ubah email dan verifikasi email baru | Memerlukan autentikasi ulang; finalisasi menunggu kontrak perubahan email. |
| Ubah kata sandi; tambah kata sandi untuk Google-only melalui pemulihan | Batas pelanggan, bukan aturan staf/MFA staf. |
| Metode masuk dan keluar dari akun | Penautan Google tidak otomatis; tombol lepas Google tidak ditambahkan. |
| Permintaan penghapusan akun dan pembacaan hasilnya | Meminta bukan menghapus langsung atau menghapus riwayat transaksi. |

Tidak ditambahkan foto profil unggahan, tanggal lahir, jenis kelamin, rekening
refund, poin, dompet, langganan promo, preferensi notifikasi, atau MFA pelanggan
karena belum ada dasar kebutuhan/kontrak untuk halaman ini. Daftar sesi perangkat
dan aktivitas keamanan pelanggan adalah pengembangan lanjutan, bukan otomatis
wajib hanya karena tabel sesi atau profil staf memilikinya.

Hubungan utama: navbar Akun → halaman ini; bagian alamat dipakai Checkout;
Pesanan Saya tetap route tersendiri; login/verifikasi/pemulihan menangani
kredensial; permintaan privasi ditangani layanan akun dan kewenangan yang sah.
Produk mobile-first, sehingga spesifikasi mencakup desktop, tablet dan ponsel.

**Kondisi sebelum implementasi:** belum ada UI profil pelanggan aktif maupun
frame lengkap profil pelanggan. Tiga tampilan alamat sudah ada di Figma.
**Hasil perluasan 13 November 2026:** `public/pages/customer/account.html`
menyediakan empat panel, dialog dan adapter data sintetis. Frame profil lengkap
belum dibuat di Figma dan scaffold/backend akun belum diaktifkan. Aturan server
dalam dokumen ini tetap kebutuhan integrasi, bukan klaim layanan sudah tersedia.

## 2. Struktur dan isi halaman

### Urutan informasi

| Urutan | Bagian | Isi dan alasan |
| --- | --- | --- |
| 1 | Navbar Figma | Utility, pencarian global, akun/wishlist/keranjang dan kategori dipertahankan. Pencarian global tidak dialihkan menjadi pencarian alamat. |
| 2 | Judul dan konteks | H1 “Profil & Pengaturan Akun”, breadcrumb, penjelasan “Kelola informasi akun, alamat, dan keamanan Anda.” Kembali hanya jika ada asal internal yang nyata. |
| 3 | Ringkasan akun | Nama, email milik sendiri, label Terverifikasi bila sumber membuktikan, metode masuk. Tidak menampilkan statistik belanja atau data staf. |
| 4 | Navigasi isi | Profil, Alamat, Keamanan, Privasi & Akun. Usulan navigasi section dengan URL/konteks aktif, bukan tab ARIA tanpa panel yang sesuai. |
| 5 | Panel aktif | Satu pekerjaan utama per panel; urutkan informasi tersimpan sebelum kontrol ubah. Error section tetap berada dekat section yang terpengaruh. |
| 6 | Tindakan section | Tombol yang spesifik, misalnya Simpan Profil. Tidak ada satu Simpan global yang seolah menyimpan alamat, email dan sandi sekaligus. |
| 7 | Footer Figma | Markup, aset dan istilah sama dengan shell incumbent; bagian di luar target tidak dirombak. |

**Layout implementasi:** lebar konten mengikuti storefront yang sudah ada.
Desktop memakai ringkasan pelanggan dan tautan akun/pesanan di kiri, dengan empat
tautan section horizontal di atas panel kanan. Susunan ini mengikuti referensi
Tokopedia yang diberikan saat eksekusi. Tablet/ponsel menempatkan ringkasan di
atas panel; navigasi section dapat digulir horizontal dan pilihan yang difokuskan
tetap terlihat. Form satu kolom pada ponsel. Navbar global tetap dipertahankan.

### Isi tiap panel

| Panel | Informasi/form | Tindakan |
| --- | --- | --- |
| Profil | Nama lengkap; nomor telepon akun; email dan status verifikasi read-only sebagai ringkasan | Simpan Profil, Batal Perubahan; Ubah Email membuka alur terpisah bila diizinkan. |
| Alamat | Jumlah tersimpan dari server, pencarian alamat, kartu label/penerima/telepon/wilayah/alamat/patokan/titik lokasi; badge Alamat Utama | Tambah Alamat, Ubah, Jadikan Alamat Utama, Hapus. Tidak perlu pagination karena maksimum awal lima. |
| Keamanan | Metode masuk terkonfirmasi, status memiliki kata sandi, keterangan perubahan sandi memutus sesi lain | Ubah Kata Sandi untuk akun bersandi; Tambahkan Kata Sandi melalui pemulihan untuk Google-only. |
| Privasi & Akun | Penjelasan permintaan penghapusan, syarat pesanan/refund, status permintaan jika ada; keluar dari akun | Ajukan Penghapusan Akun, lihat pesanan yang relevan, Keluar. Konfirmasi dan reautentikasi sesuai dampak. |

Email/nomor/alamat panjang membungkus, tetap dapat dipilih/disalin secara native.
Data yang tidak ada ditulis “Belum ditambahkan”, bukan tanda terverifikasi atau
angka nol palsu. Tidak menampilkan foto profil kosong seolah unggahan diperlukan.

### Form alamat yang digunakan kembali

1. **Lokasi:** ambil pola Tambah Alamat #1—cari lokasi, peta/titik terpilih,
   ringkasan lokasi, Pilih Lokasi Ini. Gunakan hasil yang memang disediakan
   integrasi; gambar peta Figma bukan bukti Google Maps sudah terintegrasi.
2. **Rincian:** ambil pola Tambah Alamat #2—nama penerima, nomor HP, alamat
   lengkap, label, patokan, wilayah, kode pos, pilihan alamat utama dan Simpan.
3. Wilayah dan kode pos harus terbaca/tersedia sebagai data terstruktur, meski
   visual Figma saat ini lebih menonjolkan alamat gabungan. Prefill dari lokasi
   harus dapat diperiksa dan diperbaiki; tidak membuat data wilayah rekaan.
4. **Usulan:** “Isi Alamat Manual” tersedia jika titik bukan syarat alur asal.
   Alamat tanpa titik boleh disimpan bila valid untuk kontrak alamat umum;
   belum layak dipakai instan/same-day. Jika asal checkout membutuhkan titik,
   pemilihan alamat untuk layanan itu tetap diblokir sampai titik lengkap.

## 3. Alur penggunaan

### Masuk dan navigasi panel

1. Pengguna membuka Akun atau route halaman. Sistem memeriksa sesi/peran/status.
2. Tampilkan ringkasan akun, lalu panel tujuan; default Profil. Route frontend
   tersedia pada `public/pages/customer/account.html`, alias `/account.html`.
   Nama route backend tidak ditentukan dokumen ini.
3. Parameter section hanya menerima empat nilai yang ditetapkan. Nilai lain
   dinormalisasi ke Profil. Nama, email, telepon, kode, sandi dan token tidak
   dimasukkan ke query URL.
4. Pindah panel dengan draft membuka dialog Tetap Mengedit/Buang Perubahan.
   Simpan dan Lanjut hanya ditawarkan jika valid dan memang dapat diselesaikan;
   tidak otomatis mengirim perubahan ketika pengguna memilih menu lain.

### Ubah profil

1. Muat nama/telepon dan revisi terakhir yang diterima server.
2. Pengguna mengubah data. Simpan aktif jika ada perubahan yang valid.
3. Simpan mengirim satu operasi profil; tombol dikunci selama proses.
4. Berhasil: gunakan hasil normalisasi server, hapus tanda perubahan, umumkan
   “Profil berhasil diperbarui”, perbarui ringkasan nama yang relevan.
5. Gagal: pertahankan isian nonrahasia, fokuskan error. Konflik tidak menimpa
   perubahan server secara otomatis; tawarkan Muat Data Terbaru dan koreksi ulang.

### Ubah email

1. Pengguna memilih Ubah Email. Dialog menyebut email saat ini, email baru dan
   dampak identitas masuk; email historis penerima transaksi tidak diganti diam-diam.
2. Autentikasi ulang harus sesuai metode akun dan server. Jangan meminta kata
   sandi yang tidak dimiliki akun Google-only atau menyalin MFA staf ke pelanggan.
3. Server menerima permintaan, memeriksa format/keunikan tanpa membocorkan akun
   lain dan mengirim kode ke email baru; email lama menerima N-17 sesuai baseline.
4. **Usulan:** email lama tetap menjadi identitas aktif sampai kode email baru
   berhasil diverifikasi. Tampilkan kandidat email tersamarkan dan langkah
   Masukkan Kode, Kirim Ulang, atau Ubah Email Tujuan. Ini status permintaan,
   bukan menjadikan akun aktif kembali Belum Terverifikasi.
5. Kode valid: server mengonfirmasi email baru; UI baru mengubah ringkasan.
   Pembatalan sebelum verifikasi tidak boleh mengubah email aktif.
6. P-29 menjadi acuan verifikasi; penggunaan endpoint verifikasi registrasi untuk
   tujuan perubahan email dan kebijakan sesi setelah email berubah masih perlu
   dikontrak. Tidak membuat endpoint atau reset status akun sendiri.

### Kata sandi dan metode masuk

- Akun memiliki sandi: reautentikasi, sandi baru, konfirmasi; jelaskan dampak
  pencabutan sesi lain sebelum simpan. Jangan mengisi sandi lama dari data.
- Google-only: tampilkan “Masuk dengan Google” dan “Belum memiliki kata sandi”.
  Tambahkan Kata Sandi masuk melalui alur pemulihan §6.3.4 yang memang
  mengizinkan Google-only menambahkan sandi; bukan form sandi lama kosong.
- Reset lewat pemulihan mencabut **seluruh** sesi. Perubahan sandi dari akun
  mencabut sesi lain menurut §6.3.5; kelanjutan sesi saat ini mengikuti respons
  server. Bila sesi saat ini juga tidak berlaku, arahkan login tanpa submit ulang.
- Status Google hanya dibaca dari identitas tertaut. Tidak ada penautan otomatis
  karena email sama; fitur Tautkan/Lepas Google dari pengaturan belum dikontrak.

### Buku alamat

- Tambah: buka lokasi/rincian, validasi, simpan, kembali kartu yang baru dibuat.
  Draft kedua langkah tetap ada selama dialog yang sama dan akun tetap sah.
- Ubah: isi dari alamat milik sendiri; kembali dari rincian ke lokasi mempertahankan
  teks. Mengubah titik meminta pengguna meninjau lagi alamat/wilayah hasilnya.
- Jadikan Utama: jelaskan bahwa ini default untuk pemilihan berikutnya; simpan
  atomik oleh server. Respons menentukan badge; tidak mengubah pilihan checkout
  yang sudah dikonfirmasi secara diam-diam.
- Hapus: dialog menyebut label, penerima dan alamat. Setelah berhasil hapus kartu,
  pertahankan pencarian dan fokuskan kartu berikutnya atau Tambah Alamat.
  Jika yang dihapus utama, server mengembalikan default baru atau keadaan tanpa
  alamat utama; client tidak memilih alamat pengganti secara acak.
- Mengubah/menghapus buku alamat **tidak mengubah snapshot pesanan yang sudah dibuat**.
  Perubahan alamat pesanan mengikuti §9.7 melalui toko/Admin, bukan halaman ini.

### Kembali ke asal dan proses terputus

- Dari checkout: kembali membawa identitas pilihan alamat yang sah, bukan alamat
  mentah di URL; pertahankan keranjang, catatan, slot dan pilihan yang masih sah.
  Checkout membaca ulang alamat dan menghitung ulang layanan/ongkir bila berubah;
  total baru harus ditinjau pengguna. Jangan memakai kuotasi lama sebagai sah.
- Dari Pesanan Saya: pertahankan konteks daftar yang sudah ada; tidak membuka
  pesanan lain atau me-reset filter. Target kembali selalu origin/path internal
  yang diizinkan, bukan arbitrary return URL.
- Kembali dari alur detail/dialog dimulai dari ringkasan yang sesuai, mengembalikan
  fokus ke pemicu. Kembali dari halaman baru menuju profil memulihkan panel,
  pencarian alamat dan posisi gulir jika tersedia dan tidak membocorkan akun lama.
- Timeout mutasi bukan bukti gagal: periksa hasil terbaru/status operasi sebelum
  menawarkan kirim ulang. Jangan mengirim ulang permintaan penghapusan atau OTP
  secara otomatis. Guard revisi/mutasi aktif mencegah duplikat.

## 4. Komponen dan interaksi

| Komponen | Pakai ulang/baru | Perilaku |
| --- | --- | --- |
| Navbar/footer, font/SVG/token | Shell storefront yang sama | Akun menandai tujuan aktif; shell di luar target dipertahankan. |
| Breadcrumb/kembali, tombol, badge, notice, skeleton | Fondasi transaksi/Design | Disabled memiliki alasan; status tidak hanya warna. |
| Navigasi panel akun | Baru, memakai bahasa visual filter/navigasi incumbent | Link/nav berlabel, aria-current, URL panel sah; tidak perlu filter status/pagination akun. |
| Ringkasan identitas | Baru | Data diri milik sesi; tidak mengambil role/id dari query. |
| Form profil | Baru dengan pola form proyek | Label permanen, dirty state, inline error, Simpan/Batal per form. |
| Daftar/kartu alamat | Adaptasi dialog Pilih Alamat | Pencarian langsung nama/label/alamat dalam maksimum alamat tersedia; Reset saat tanpa hasil, tanpa tombol Terapkan/pagination. |
| Dialog lokasi dan rincian | Gunakan Figma #1/#2 | Dua tahap, tombol kembali/tutup, draft, focus trap dan scroll body terkelola. |
| Dialog konfirmasi hapus/utama | Pola dialog yang sudah ada | Nama objek/dampak nyata, Batal dan tindakan spesifik, tanpa checkbox persetujuan yang tidak perlu. |
| Reautentikasi dan ubah email/sandi | Baru dengan pola form/dialog | Hanya challenge yang server dukung; tidak menyimpan rahasia, double-submit guard. |
| Input kode verifikasi | Adaptasi OTP | Satu input logis enam digit atau enam sel dengan dukungan paste utuh, backspace, keyboard dan label kelompok; tidak bergantung enam fokus terpisah. |
| Status permintaan akun | Baru, jika read model mendukung | Menunggu verifikasi/penyelesaian bukan badge status akun baru. |
| Dialog perubahan belum disimpan | Pakai pola Detail Pesanan | Tetap Mengedit/Buang; Escape tidak membuang diam-diam. |

Tombol utama aktif hanya ketika operasi diizinkan, data valid, ada perubahan
yang relevan dan tidak ada proses konflik. Tindakan permanen ditampilkan dengan
nama/dampak yang jelas di area terpisah, bukan tombol dominan seluruh halaman.
Kontrol tersembunyi hanya jika tidak relevan (misalnya sandi lama Google-only);
larangan sementara memakai alasan yang terbaca, bukan tooltip saja.

## 5. Status dan penanda penting

### Status data akun dan permintaan

| Status | Sumber/pemicu | Dampak dan tindakan |
| --- | --- | --- |
| Aktif | Akun terautentikasi sah | Panel sesuai allowedActions; badge email terverifikasi membutuhkan bukti server/OIDC, bukan sekadar AKTIF di client. |
| Belum Terverifikasi | Registrasi belum menyelesaikan kode | Alur verifikasi registrasi di luar halaman privat; tidak menampilkan data profil penuh dari sesi tak sah. |
| Ditangguhkan/Dinonaktifkan | Keputusan berwenang | Tidak dapat mengubah akun; sesi dicabut/ditolak. Pelanggan tidak dapat mengaktifkan sendiri. |
| Dianonimkan | Proses privasi selesai | Tidak ada sesi privat/PII lama yang ditampilkan; bukan tombol undo. |
| Email baru menunggu verifikasi | Permintaan diterima, kode belum selesai | Email aktif belum berubah menurut usulan alur; tawarkan verifikasi/kirim ulang sesuai batas. |
| Kode salah/kedaluwarsa/dibatalkan | Respons verifikasi | Jangan mengganti email atau membuat akun baru; perbaiki kode atau minta kode baru. |
| Alamat Utama | Respons server | Penanda default, bukan status pengiriman; perubahan atomik dan maksimal satu utama adalah usulan invariant. |
| Titik lokasi ditambahkan | Koordinat valid tersimpan | Mengikuti penanda PinPoint Figma; bukan bukti kurir tersedia atau alamat telah diverifikasi secara fisik. |
| Permintaan penghapusan diterima/menunggu | Layanan akun membuktikan permintaan tercatat | Tampilkan syarat yang belum selesai jika diberikan server; tidak otomatis menyebut akun sudah dihapus. |
| Anonimisasi selesai | Hasil proses berwenang | Hapus konteks privat client dan arahkan tujuan publik yang sah. |

Jangan menyimpan status permintaan email/penghapusan ke enum `status_akun`
yang belum memilikinya. Memerlukan read model/proses tersendiri. Label hijau
dengan centang untuk hasil terkonfirmasi, jam dengan teks untuk menunggu,
peringatan/ikon silang dengan teks untuk masalah; gunakan token status yang
sudah ada, tanpa menambah warna merek.

State antarmuka seperti mengedit, menyimpan, loading atau gagal memuat tidak
boleh mengubah status bisnis akun/alamat. Counter resend hanya representasi
deadline server, bukan pemberi izin dari jam lokal.

## 6. Tindakan dan dampaknya

| Tindakan | Syarat/konfirmasi | Hasil, feedback dan pemulihan |
| --- | --- | --- |
| Simpan Profil | Pemilik aktif, form valid/berubah, revisi sesuai; tanpa konfirmasi tambahan | Nama/telepon tersimpan atomik; success inline; error mempertahankan draft. |
| Batal Perubahan | Ada draft | Kembali ke snapshot terakhir yang diterima; konfirmasi bila menutup/mengganti konteks akan membuang draft. |
| Ajukan/Ubah Email | Reautentikasi dan allowedActions | Membuat permintaan, bukan langsung mengganti email; verifikasi dan N-17; kegagalan tidak menghapus email aktif. |
| Verifikasi/Kirim Ulang | Challenge sah; P-29 dan Retry-After | Email berubah hanya setelah hasil sah; resend kode baru membatalkan kode lama. Busy mencegah kirim ganda. |
| Ubah Kata Sandi | Reautentikasi, sandi valid, konfirmasi cocok | Server menyimpan hash, mencabut sesi sesuai alur; feedback tidak memuat sandi; bersihkan input rahasia setelah selesai. |
| Tambahkan Kata Sandi | Google-only, alur pemulihan yang tersedia | Respons generik, reset P-30; seluruh sesi lama tidak sah setelah reset. Tidak menyatakan email terkirim bila layanan gagal. |
| Tambah/Ubah Alamat | Pemilik, limit/kelengkapan/titik sesuai konteks | Kartu diperbarui berdasarkan respons; input nonrahasia bertahan saat gagal dalam sesi sah. |
| Jadikan Utama | Alamat sah/aktif, belum utama | Jelaskan default berubah; server mengganti tanda utama secara atomik. Konflik memerlukan refresh. |
| Hapus Alamat | Milik sendiri, konfirmasi objek/dampak | Hapus dari buku alamat aktif sesuai skema; snapshot order tetap. Undo tidak ditawarkan karena kontrak pemulihan belum ada. |
| Ajukan Penghapusan Akun | Reautentikasi diusulkan, pemeriksaan server dan konfirmasi dampak | Catat permintaan; anonimisasi hanya setelah tidak ada pesanan aktif/refund berjalan. Tidak menghapus transaksi dan tidak menjalankan hard delete akun. |
| Keluar | Ada sesi; draft memerlukan keputusan sebelum keluar | Cabut sesi server, bersihkan konteks privat setelah terkonfirmasi; gagal logout tidak diberi pesan sukses palsu. |
| Coba Lagi/Muat Terbaru | Tidak ada mutasi ambigu yang belum direkonsiliasi | Hanya area yang perlu dimuat; kueri/panel dipertahankan, tidak ada transaksi otomatis. |

Kirim/mutasi yang sama dikunci selama berjalan. Permintaan yang sudah diterima
tetapi email notifikasi tertunda dibedakan dari perubahan gagal; jangan meminta
pengguna mengirim ulang perubahan yang sudah tersimpan. Pengajuan berulang,
alamat duplikat dan kode ganda harus dihadapi dengan respons server yang jelas;
alamat sama bukan otomatis terlarang hanya berdasarkan kesamaan teks client.

## 7. Aturan bisnis, validasi dan hak akses

### Field dan batas

| Data | Ketentuan yang ditemukan | Rancangan/pesan perbaikan |
| --- | --- | --- |
| Nama akun/penerima | §15.4: 2–100 karakter; Unicode huruf, angka, spasi dan tanda petik, tanda hubung, titik | Label Nama Lengkap/Nama Penerima. “Isi nama 2–100 karakter.” Jangan menolak nama sah dengan tanda petik atau aksen. |
| Email | Format sah, maksimal 254 karakter, lowercase, unik | Email saat ini read-only; ubah terpisah. Konflik email memakai respons aman yang tidak menyatakan email itu milik siapa/akun lain ada. |
| Nomor telepon | Normalisasi +62, 9–15 digit; skema varchar(20) | Boleh menerima input 08… lalu menunjukkan normalisasi yang jelas; hitungan digit persis pada format +62 perlu dipastikan pada validator. Tidak menambahkan OTP telepon yang belum disyaratkan. |
| Telepon akun | Registrasi meminta telepon, tetapi SQL mengizinkan NULL, termasuk akun Google | Tampilkan Belum Ditambahkan bila kosong. Kewajiban mengisi/mengosongkan saat edit profil perlu kontrak; tidak menganggap profil Google rusak hanya karena kosong. Nomor penerima tetap wajib. |
| Sandi pelanggan | Minimum P-28 = 8, maksimum 128 karakter, tidak di-trim; sandi umum/bocor ditolak server | Konfirmasi harus sama; izinkan paste/manajer sandi. Tidak memaksakan minimum 12 staf atau komposisi simbol tambahan tanpa aturan. |
| Kode email | P-29: 6 digit; 10 menit; 5 kesalahan; resend 60 detik; 5 kirim/jam; kode baru membatalkan lama | “Kode tidak valid atau sudah kedaluwarsa. Periksa kode terbaru atau minta kode baru.” Izin/deadline dari server. |
| Pemulihan sandi | P-30: 15 menit, sekali pakai; permintaan baru membatalkan token lama | Tautan/token lama ditolak; mulai pemulihan lagi. Tidak memperpanjang token lewat timer client. |
| Alamat lengkap | 10–255 karakter, teks biasa | Bidang wajib; sebut kebutuhan jalan/nomor/detail, bukan hanya pin peta. |
| Wilayah | SQL: kelurahan, kecamatan, kota/kabupaten, provinsi wajib; tiap varchar(100) | Tampilkan empat nilai, baik hasil lokasi maupun input yang divalidasi. Sumber daftar wilayah belum ditemukan. |
| Kode pos | Tepat 5 digit | Input teks dengan keyboard numerik; pertahankan nol di depan. “Masukkan kode pos 5 digit.” |
| Label alamat | SQL: varchar(50), NOT NULL/default Rumah | Label singkat, maksimal 50; default atau label pilihan harus terlihat, bukan asumsi tersembunyi. |
| Patokan/catatan alamat | SQL opsional, kapasitas 255; counter Figma menampilkan 0/50 | Batas UI efektif memerlukan penyelarasan. Jangan menyebut 50 sebagai aturan bisnis v2.6 atau mengizinkan melebihi kapasitas 255. |
| Titik peta | Latitude −90…90 dan longitude −180…180; pasangan lengkap; wajib untuk instan/same-day menurut konteks/skema | 0 adalah koordinat sah, bukan otomatis kosong. Pin tidak menjamin cakupan layanan. |
| Jumlah alamat | P-26 maksimum awal 5, dapat dikonfigurasi | Count/limit dari server; Tambah nonaktif pada batas dengan alasan; edit/hapus tetap tersedia. Definisi hitung alamat nonaktif perlu kontrak. |
| Alamat utama | Ada field `status_alamat_utama` | Usulan maksimal satu alamat utama per akun, atomik; aturan alamat pertama dan fallback saat utama dihapus belum eksplisit. |

### Kewenangan dan konsistensi

- Pelanggan hanya melihat/mengubah profil sendiri dan alamat sendiri. ID alamat
  dari client diperiksa ownership; milik akun lain dijawab 404 sesuai §15.4/A.7.
- Peran, status akun, verifikasi, limit, eligibility penghapusan dan kewenangan
  datang dari server. Field asing seperti role/status tidak boleh di-mass-assign.
- Endpoint pengubah data memerlukan sesi sah, CSRF dan validasi server. Ubah
  email/sandi memerlukan autentikasi ulang (§15.5); metode challenge pelanggan
  Google-only dan masa berlaku challenge belum dikontrak. MFA staf bukan default.
- Usulan update profil/alamat memakai revisi/ETag yang disepakati; konflik tidak
  menimpa perubahan dari tab lain. Kembali/refresh tidak boleh mengirim mutasi.
- Hapus/ubah alamat tidak menyentuh snapshot order. Jika pilihan checkout berubah,
  layanan dan ongkir wajib divalidasi ulang sebelum membuat pesanan.
- Pelanggan mengajukan penghapusan; bukan menyetujui atau menjalankan anonimisasi
  sendiri. Syarat eksplisit: tidak ada pesanan aktif dan tidak ada refund berjalan.
  Jangan menambah larangan berdasarkan saldo/komplain tanpa dasar kebijakan.
- Jangan memblokir pengajuan hanya karena eksekusi belum memenuhi syarat kecuali
  kontrak menyatakan begitu. **Usulan:** request boleh tercatat dan ditampilkan
  menunggu; definisi permintaan/duplikasi/pembatalan menunggu kontrak layanan.
- Pesan data umum boleh spesifik untuk field, tetapi respons pencarian email,
  pemulihan dan konflik identitas tidak membocorkan keberadaan akun lain.

## 8. Matriks seluruh state relevan

**W = wajib untuk alur yang masuk implementasi**, **L = lanjutan bergantung
kontrak/integrasi**, **O = opsional**. State yang kontraknya belum ada tetap
berlabel usulan; tidak disimulasikan sebagai layanan produksi. Tidak ada bulk
save/pagination alamat/unggah avatar yang perlu dipaksakan ke halaman ini.

| Area/komponen | Nama state | Pemicu | Isi tampilan/pesan | Tindakan tersedia | Data/input dipertahankan | Jalur pemulihan | Prioritas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Halaman | Normal | Akun aktif, data sah | Ringkasan dan panel terpilih | Navigasi/aksi sesuai izin | Snapshot terbaru | Alur utama | W |
| Kontrol | Hover/fokus | Pointer/keyboard | Perubahan visual dan fokus terlihat | Aktivasi keyboard | Semua input | Lanjut tanpa hover | W |
| Navigasi/disclosure | Selected/expanded/collapsed | Panel/tahap/lihat sandi dipilih | Penanda aktif dan label state | Ganti panel/buka/tutup | Draft sesuai guard | Kembali/pemicu fokus | W |
| Form | Pristine/disabled | Tidak ada perubahan, invalid atau dilarang sementara | Simpan nonaktif dengan alasan yang relevan | Edit/batal/panduan | Snapshot/draft | Lengkapi syarat | W |
| Data | Read-only | Identitas/Google/status tidak boleh diubah langsung | Nilai dan penjelasan singkat | Alur ubah terpisah jika diizinkan | Data sah | Verifikasi/izin server | W |
| Halaman | Loading awal | Pembacaan akun | Skeleton berstruktur, bukan nama contoh | Tunggu; retry bila lama | Tujuan panel aman | Data/timeout | W |
| Section | Memperbarui sebagian | Refresh alamat/metode masuk | Busy lokal; hasil lama berlabel | Tunggu/baca panel lain | Data sah dan draft tidak tertimpa | Respons terbaru | W |
| Form | Menyimpan | Submit valid | “Menyimpan…” dan tombol terkunci | Tunggu | Draft sementara; rahasia hanya memori | Hasil/rekonsiliasi | W |
| Proses | Lama/timeout baca | Permintaan belum selesai | “Data belum selesai dimuat” | Coba lagi/kembali | Panel/pencarian | Batalkan respons lama, baca ulang | W |
| Mutasi | Hasil belum pasti | Koneksi putus setelah submit | “Hasil perubahan belum dapat dipastikan” | Periksa perubahan terbaru | Draft nonrahasia selama sesi sah | Rekonsiliasi sebelum retry | W |
| Alamat | Belum ada data | Count sah nol | “Belum ada alamat tersimpan” | Tambah Alamat | Profil/panel | Buat alamat | W |
| Alamat | Pencarian tanpa hasil | Kata kunci tak cocok | “Alamat tidak ditemukan” dan kata kunci | Hapus pencarian/Reset | Query dan daftar sumber | Tampilkan kembali semua | W |
| Profil | Data opsional kosong | Telepon belum ditambahkan | “Belum ditambahkan” | Isi profil jika diizinkan | Identitas yang sah | Simpan data valid | W |
| Halaman | Data parsial | Profil terbaca, section lain gagal | Section gagal ditandai tanpa menyembunyikan profil | Retry section | Data valid/draft | Baca bagian gagal | W |
| Profil/alamat | Data inti tidak valid | Payload rusak/field wajib hilang | Bagian perlu diperiksa; jangan menebak alamat/email | Muat ulang/panduan | Nilai valid; jangan kirim snapshot rusak | Data sumber diperbaiki | W |
| Aset | Logo/ikon gagal | Aset tidak terunduh | Nama/label kontrol tetap terbaca | Aksi berlabel/kembali | Seluruh input | Muat ulang aset | W |
| Form | Berhasil | Commit server terkonfirmasi | “Profil/alamat berhasil diperbarui” | Lanjut/tutup | Snapshot hasil; rahasia dibersihkan | Kembali konteks | W |
| Proses | Sebagian hasil berhasil | Data tersimpan, pemberitahuan tertunda | Bedakan tersimpan dari email belum terkirim | Periksa status/panduan | Hasil tersimpan | Retry pengiriman oleh layanan; bukan mutasi ulang | W |
| Field/form | Validasi bermasalah | Input invalid/422 atau 400 terpetakan | Pesan dekat field dan ringkasan | Koreksi/simpan/batal | Input aman | Fokus field pertama; error hilang setelah koreksi sah | W |
| Email | Identitas konflik/duplikat | Email tidak dapat digunakan | Pesan aman tanpa identitas akun lain | Gunakan email lain/kembali | Email aktif; kandidat selama sesi sah | Verifikasi tujuan yang sah | W |
| Alamat | Kandidat duplikat | Server mendeteksi kemungkinan sama | Jelaskan kandidat; tidak auto-merge | Gunakan yang ada/perbaiki; lanjut hanya jika diizinkan | Form dan daftar | Keputusan server/pengguna | L |
| Halaman | Gagal memuat | Jaringan/5xx | “Informasi akun belum dapat dimuat” | Coba Lagi/kembali | Tujuan panel nonpribadi | Permintaan baru | W |
| Form | Gagal menyimpan | Penolakan aman sebelum commit | “Perubahan belum tersimpan” | Perbaiki/coba lagi/batal | Draft nonrahasia; jangan persist sandi/kode | Submit baru setelah pemeriksaan | W |
| Koneksi | Offline | Browser offline/permintaan gagal | “Koneksi terputus” | Baca data terakhir, kembali; simpan nonaktif | Draft nonrahasia dalam sesi sah | Online dan validasi ulang | W |
| Layanan | Gangguan/maintenance | 503/status layanan | Pesan layanan sementara tidak tersedia | Coba Lagi/kembali | Draft aman jika sesi masih sah | Pulih layanan; tidak memaksakan logout | W |
| Aksi | Dibatasi sementara | 429/Retry-After | Batas percobaan dan waktu tersedia dari server | Tunggu/panduan/batal | Data nonrahasia; kode tidak dianggap sah lagi tanpa sumber | Server mengizinkan retry | W |
| Akses | Perlu masuk | 401 belum login | “Masuk untuk mengelola akun Anda” | Masuk/kembali | Tujuan internal, bukan PII | Login pelanggan | W |
| Akses | Sesi berakhir/dicabut | Idle/reset/logout/tab lain/nonaktif | Bersihkan PII dari DOM/cache; jelaskan masuk ulang | Masuk/kembali | Panel tujuan nonprivat; rahasia dan draft privat dibuang | Akun sah dibaca ulang | W |
| Akses | Peran tidak sesuai | Staf membuka route pelanggan | “Halaman ini untuk akun pelanggan” | Kembali ke area yang sah | Tidak ada data pelanggan | Profil staf/login pelanggan terpisah | W |
| Akses | Akun ditangguhkan/nonaktif/anonim | Respons status/otorisasi server | Tidak ada form aktif atau PII lama | Panduan/kembali | Informasi publik minimal | Jalur akun yang diizinkan; tidak aktifkan sendiri | W |
| Reautentikasi | Verifikasi tambahan perlu | Ubah email/sandi/permintaan sensitif | Challenge sesuai metode akun | Verifikasi/batal | Draft nonrahasia bila sesi dasar masih sah | Challenge sah | W |
| Reautentikasi | Salah/kedaluwarsa/dibatalkan | Respons server/user batal | Pesan aman dan langkah berikutnya | Ulang sesuai batas/batal | Draft nonrahasia; rahasia dihapus | Autentikasi ulang baru | W |
| Form | CSRF tidak valid/kedaluwarsa | 403 dengan kode CSRF, sesi dasar mungkin masih sah | “Keamanan formulir perlu diperbarui” | Muat ulang keamanan form/batal; bukan submit ulang otomatis | Draft nonrahasia hanya selama sesi sah | Periksa sesi, token baru, pengguna mengirim ulang | W |
| Alamat | Tidak ditemukan/bukan milik/dihapus | ID tidak sah/404 | “Alamat tidak tersedia” tanpa membocorkan pemilik | Kembali Daftar/Muat Terbaru | Pencarian; draft tidak dikirim ke ID lain | Pilih alamat yang masih ada | W |
| Form | Perubahan belum disimpan | Tutup/pindah panel/kembali | Dialog Tetap Mengedit/Buang Perubahan | Tetap/buang; simpan jika tersedia | Draft hingga keputusan | Fokus kembali atau tujuan awal | W |
| Data | Berubah saat digunakan | Revisi server berbeda/409 | “Data ini sudah berubah” | Muat Terbaru/periksa ulang | Draft nonrahasia terpisah; tidak auto-overwrite | Terapkan ulang pada revisi sah | W |
| Aksi | Tidak lagi tersedia | Status akun/limit/alamat berubah | Jelaskan alasan aktual dari server | Perbarui/kembali | Konteks aman | Read model terbaru | W |
| Alamat | Batas tercapai | Count mencapai limit P-26 | “Batas alamat tersimpan tercapai” | Edit/hapus alamat yang ada | Seluruh data sah | Slot tersedia dari server | W |
| Lokasi | Mencari/pencarian kosong | Pencarian lokasi berjalan/tidak cocok | Indikator/“Lokasi tidak ditemukan” | Ubah kata kunci/isi manual bila sah | Kata kunci, form sebelumnya | Hasil lain/pin/manual | W |
| Peta | Gagal memuat/layanan tidak tersedia | Provider peta/geocode gagal | Bagian peta gagal, teks alamat tetap | Coba Lagi/isi manual bila sah | Form/alamat yang sudah dipilih | Provider pulih; titik tetap wajib bila konteks menuntut | W |
| Lokasi | Titik belum lengkap/tidak sesuai | Koordinat hilang/hasil pindah | “Periksa titik dan rincian alamat” | Pilih titik/ubah rincian | Draft dua tahap | Validasi pasangan/tinjau ulang | W |
| Alamat | Utama berubah | Commit Jadikan Utama | Badge pindah sesuai respons | Lanjut/ubah alamat | Query/fokus kartu | Refresh jika konflik | W |
| Alamat | Dihapus/utama dihapus | Commit hapus | Kartu hilang, default baru/nihil dijelaskan | Tambah/pilih utama bila sah | Query; snapshot pesanan tetap | Daftar terbaru; tanpa undo rekaan | W |
| Email | Menunggu kode | Permintaan tersimpan | Email tujuan tersamarkan, instruksi kode | Verifikasi/resend/ubah tujuan sesuai izin | Email aktif dan status permintaan | Kode terbaru | W |
| Email | Kode salah/kedaluwarsa/batas salah | P-29/server | Error kode, sisa percobaan hanya bila disediakan | Koreksi/minta baru | Email aktif; kode lama tidak dipersist | Challenge baru | W |
| Email | Cooldown/batas kirim | P-29/429 | Resend nonaktif, waktu server | Tunggu/ubah tujuan/batal jika sah | Kandidat tersamarkan/status | Server membuka kirim | W |
| Email | Pengiriman kode gagal | Layanan email menolak/gagal | Tidak mengaku kode telah terkirim | Coba kirim sesuai izin/kembali | Email aktif dan request jika tercatat | Hasil pengiriman terkonfirmasi | W |
| Email | Terverifikasi | Finalisasi server | Email baru aktif, success; sesi sesuai respons | Lanjut/masuk ulang bila diminta | Hasil terkonfirmasi | Akun dibaca ulang | W |
| Google-only | Tanpa sandi | Metode akun Google-only | “Belum memiliki kata sandi” | Tambahkan via pemulihan | Metode Google aktif | Alur reset sah | W |
| Sandi | Sandi salah/lemah/konfirmasi beda | Reauth/validator/server | Error field aman; sandi tidak dikutip | Isi ulang/perbaiki/batal | Nonrahasia saja; rahasia hanya selama form aktif | Submit valid | W |
| Pemulihan | Token habis/dipakai | Reset ditolak P-30 | “Tautan pemulihan tidak berlaku” | Minta pemulihan baru/masuk | Email aman; tidak mempertahankan token/sandi | Token baru | W |
| Sandi | Berhasil/sesi diputus | Commit perubahan/reset | Jelaskan sesi lain berakhir atau wajib login ulang | Lanjut/masuk | Rahasia dibersihkan; data terbaru bila sesi sah | Login ulang sesuai server | W |
| Privasi | Ada penghalang anonimisasi | Pesanan aktif/refund berjalan | Sebut syarat yang belum selesai dari server | Lihat Pesanan/panduan; ajukan jika diizinkan | Status permintaan/konteks | Transaksi selesai dan server mengecek ulang | W |
| Privasi | Permintaan diterima/duplikat | Request baru/masih ada | “Permintaan sudah tercatat”; bukan akun terhapus | Lihat status/kembali; batal hanya jika kontrak mengizinkan | Referensi permintaan aman | Proses berwenang; tanpa submit ganda | W |
| Privasi | Anonimisasi selesai | Hasil server | Halaman privat ditutup, PII/cache dibersihkan | Tujuan publik yang sah | Tidak ada data privat lama | Akhir proses; bukan undo | W |
| Logout | Berlangsung/gagal/berhasil | Keluar dipilih | Busy; pesan gagal atau sesi telah berakhir sesuai hasil | Coba Lagi setelah periksa sesi/kembali | Draft diputuskan sebelumnya; konteks privat dibersihkan saat akhir | Sesi server dan client selaras | W |
| Sesi perangkat | Daftar/pencabutan sesi lain | Fitur lanjutan dikontrak | Sesi milik sendiri dan perangkat secara minimal | Akhiri sesi hanya bila diizinkan | Konteks daftar; tanpa hash/token | Read model terbaru | L |

Tidak diterapkan: load-more/pagination untuk lima alamat, kombinasi filter status
alamat yang tidak diperlukan, formulir persetujuan staf, atau partial commit
nama/telepon dalam satu Simpan Profil. Bila satu section gagal sedangkan section
lain sudah tersimpan, komunikasikan hasil masing-masing tanpa “semua berhasil”.

## 9. UX dan aksesibilitas

- Hierarki ringkasan → panel → field → dampak → tindakan. Body/label mengikuti
  Poppins dan ukuran proyek; gunakan permukaan krem/hijau yang sudah disepakati.
  Tidak mengandalkan teks kecil/tooltip untuk dampak perubahan akun.
- Kelompok field berhubungan dekat; section dan baris tindakan mempunyai ruang
  cukup. Pada ponsel tombol utama satu baris penuh bila perlu; secondary tetap
  mudah ditemukan. Tidak membuat action bar menutup isian, error atau keyboard.
- Nomor/email/alamat panjang membungkus tanpa merusak grid. Teks penting tidak
  di-clamp; metode masuk/label badge tidak bertabrakan dengan tombol.
- Semua input punya label permanen dan bantuan terhubung. Gunakan autocomplete
  yang sesuai untuk nama, email, tel, current-password, new-password dan one-time-code.
  Kata sandi/kode tidak diisi dari fixture produksi atau dipersist di browser.
- Form dapat dikerjakan keyboard; urutan fokus mengikuti urutan visual, tombol
  lihat sandi mengumumkan Tampilkan/Sembunyikan tanpa menghilangkan fokus field.
  Paste/manajer sandi tidak diblokir. Tidak menyalin kode otomatis tanpa tindakan.
- Dialog memiliki judul/label, fokus awal yang sesuai, focus trap, Escape aman,
  tombol Batal/Tutup terlihat dan pengembalian fokus. Konfirmasi destruktif
  memulai fokus pada judul/Batal agar Enter tidak tanpa sengaja menyetujui.
- Input kode dapat menerima enam digit utuh; bila disajikan enam sel, semantik,
  paste/backspace dan pembaca layar tetap satu tugas yang jelas. Hitung mundur
  tidak diumumkan tiap detik; cukup perubahan izin dan saat kedaluwarsa.
- Error memakai teks dan ikon serta aria-invalid/describedby; ringkasan error
  membawa fokus ke field. Hasil simpan menggunakan live region yang tidak
  mengganggu. Jangan hanya toast yang hilang sebelum pengguna membacanya.
- Peta bukan satu-satunya cara membaca/mengisi alamat. Sediakan alamat tekstual,
  hasil lokasi berlabel dan kontrol pin keyboard bila integrasi mendukung.
  Browser lokasi saat ini bukan syarat default dan tidak diminta pada load.
- Target utama minimal 44 × 44 px, fokus terlihat, kontras form/teks baru diuji
  saat implementasi; informasi tanpa bergantung warna/hover. Hormati reduced-motion.
- Navbar/footer tetap dipin. Keterbatasan kontras sumber dicatat pada shell;
  tidak ada klaim semua warna Figma otomatis memenuhi AA.

## 10. Data, keamanan dan kebutuhan sistem

### Data minimum dan batas DTO

| Kelompok | Sumber yang ditemukan | Kebutuhan frontend/usulan read model |
| --- | --- | --- |
| Identitas | `akun_pengguna`: nama, email, telepon, status/peran, waktu pembaruan | id internal seperlunya, nama/email/telepon sendiri, bukti verifikasi, revisi dan allowedActions. Jangan mengirim hash/status MFA staf/lock counter penuh. |
| Metode masuk | `identitas_eksternal` dan keberadaan hash sandi | Flag hasPassword dan metode tertaut yang aman. Tidak mengirim hash sandi, provider sub, secret atau token. |
| Buku alamat | `alamat_pengguna` | Field alamat terstruktur, id pemilik tak perlu ditampilkan, flag utama/aktif, koordinat seperlunya, revisi, count/limit. |
| Email tertunda | Belum ada kontrak/read model terkonfirmasi | Kandidat tersamarkan, status verifikasi, challenge reference aman, serverNow/expiresAt/resendAvailableAt dan izin. Bukan kode atau token rahasia dalam DTO umum. |
| Permintaan penghapusan | Aturan §6.3.5; proses/data belum terdefinisi | Status request, eligibility, penghalang publik seperlunya, hasil; jangan menyalahgunakan enum akun. |
| Sesi | `sesi_login`, P-32/P-44 | Keabsahan sesi dan hasil pencabutan wajib di backend; daftar perangkat UI opsional butuh DTO/kontrak khusus. |
| Pengaturan/validasi | Register Parameter | Limit dan panjang/tenggat efektif; waktu disimpan UTC, ditampilkan WIB. Angka telepon/kode pos bukan angka matematika. |

Nama DTO frontend di atas konseptual; penamaan dan envelope disepakati saat
integrasi. Jangan mengirim seluruh baris SQL ke browser. Email penuh boleh
terlihat pada halaman privat pemilik sendiri; tantangan/notifikasi menampilkan
tujuan tersamarkan. Alamat penuh hanya terlihat pada buku alamat pemilik,
bukan bocor ke halaman publik atau akun staf lain.

### Kontrak yang benar-benar tercantum

Basis A.7 adalah `/api/v1`:

| Kontrak baseline | Status/kebutuhan |
| --- | --- |
| GET/PATCH/DELETE `/me` | Profil; DELETE berarti permintaan penghapusan. Handler aktif belum ada. |
| GET/POST/PATCH/DELETE `/me/addresses` | Buku alamat, P-26. Seleksi ID, bentuk payload/revisi dan mutasi utama belum dirinci. |
| POST `/auth/logout` | Logout server; belum terintegrasi. |
| POST `/auth/verify-email`, `/auth/resend-code` | Verifikasi registrasi ada pada baseline; penggunaan untuk ubah email perlu purpose/kontrak yang sah. |
| POST `/auth/forgot-password`, `/auth/reset-password` | Pemulihan P-30, termasuk menambahkan sandi Google-only. |
| GET `/auth/google/start`, `/auth/google/callback`; POST `/auth/link-google/confirm` | Alur autentikasi/penautan baseline; bukan bukti fitur Tautkan/Lepas dari pengaturan sudah ada. |

Tidak ditambahkan URL baru untuk ubah email, ubah sandi, autentikasi ulang,
status request, peta, wilayah atau sesi. Operasi itu memerlukan kontrak; keberadaan
PATCH `/me` tidak membuktikan semua body sensitif sudah didukung.

**Konflik respons:** A.7 menyebut 400 validasi, sementara §15.4 menyebut 422.
Mapper frontend harus menangani kedua bentuk aman yang disepakati; pilih standar
resmi sebelum integrasi, jangan mengubah kontrak tersembunyi. Respons 401/403/404/
409/429 harus dibedakan untuk akses, kepemilikan, konflik dan pembatasan.

### Pembagian tanggung jawab

- **Frontend:** presentasi, label, draft volatil, validasi awal, dialog/fokus,
  navigasi aman, state matrix, abort pembacaan lama dan guard submit. Tidak
  menentukan akun terverifikasi/eligibility/keberhasilan finansial dari timer.
- **Backend:** autentikasi/ownership/CSRF, field allowlist, validasi/keunikan,
  hashing, reautentikasi, pengiriman kode dan N-17, rate limit, sesi, versi,
  perubahan alamat utama atomik, request anonimisasi, audit dan notifikasi outbox.
- Hashing harus memenuhi panjang sandi yang dijanjikan: §15.4 mengingatkan batas
  bcrypt 72 byte dan menyarankan Argon2id bila tersedia. Jangan menerima sandi
  panjang di UI lalu memangkasnya diam-diam sebelum hashing; pilihan hashing
  dan kompatibilitas diuji backend, bukan dijelaskan sebagai beban kepada pengguna.
- Simpan profil/alamat dan status request secara konsisten. Pada timeout, baca
  status/revisi operasi, bukan melakukan retry mutasi membabi buta. Deduplikasi
  atau idempotensi yang dipakai perlu kontrak; tidak mengasumsikan semua endpoint
  A.7 telah mewajibkan Idempotency-Key seperti pembuatan pesanan.
- Kata sandi/kode/reauth token tidak ada di URL/log/storage/analytics. Jangan
  menyimpan draft berisi rahasia atau seluruh profil ke localStorage. Draft
  privat nonrahasia cukup memori selama sesi yang sama; sesi/akun berubah
  membersihkan data tersebut. Konteks panel nonpribadi dapat dipulihkan.
- Sesi pelanggan idle awal 14 hari (P-32); batas bersamaan lima (P-44), sesi
  tertua dicabut bila terlampaui. Jangan membawa waktu staf atau membuat batas
  absolut pelanggan baru yang tidak disebutkan. Penegakan selalu server.
- Perubahan profil/email/sandi/alamat, logout dan proses privasi dicatat sesuai
  audit/keamanan, tanpa nilai sandi/kode/token. Riwayat penuh audit SuperAdmin
  tidak ditampilkan pada akun pelanggan.
- Penghapusan berarti anonimisasi sesuai §6.3.5; data transaksi dipertahankan
  menurut P-34 dan kewajiban operator. Jangan menjalankan DELETE fisik akun
  beserta cascade alamat hanya karena skema mempunyai foreign key.
- Integrasi provider peta/geocoding/wilayah/email/OIDC belum aktif. Map visual
  Figma, logo Google dan seed database bukan bukti izin vendor atau layanan siap.

## 11. Daftar pekerjaan dan kriteria selesai

### Pekerjaan

| Prioritas | Pekerjaan | Ketergantungan |
| --- | --- | --- |
| Wajib | Susun read model akun, metode masuk dan alamat; kontrak revisi/allowedActions | S1/S6 dan layanan akun; jangan menerima seluruh row SQL. |
| Wajib | Buat frame/prototipe halaman profil dalam identitas storefront | Shell Figma dan keputusan layout panel; tidak mengubah desain publik lain. |
| Wajib | Gunakan ulang dialog Pilih/Tambah Alamat, tombol/badge/form/error/dialog | S3/S4 dan komponen storefront; lengkapi data wilayah/kode pos. |
| Wajib | Profil: load/edit/save/cancel, validasi, konflik dan draft | Kontrak GET/PATCH `/me`; handler masih scaffold. |
| Wajib | Buku alamat: list/search/empty/tambah/edit/utama/hapus/limit | Kepemilikan, P-26, semantik utama dan pin, validasi wilayah. |
| Wajib | Keamanan/email: challenge, OTP, retry/cooldown, ubah sandi, Google-only | Kontrak perubahan email/reauth/sandi dan layanan pengiriman. |
| Wajib | Privasi: pengajuan/eligibility/status/duplikasi/hasil; logout nyata | Proses anonimisasi, sesi dan audit; jangan membuat sukses palsu. |
| Wajib | Navigasi kembali, unsaved guard, fokus/keyboard/responsif/state W | Integrasi tujuan yang benar-benar tersedia. |
| Wajib | Saat implementasi, workbench dev terpisah dan adapter data contoh jujur jika backend belum ada | Fixture sintetis tanpa rahasia; tidak membawa kontrol skenario ke produksi. |
| Lanjutan | Daftar perangkat/sesi sendiri, pencabutan sesi, aktivitas keamanan ringkas | Kontrak UI/API pelanggan; skema saja belum cukup. |
| Lanjutan | Penautan Google dari pengaturan | Aturan pembuktian/reauth/lockout; pelepasan Google belum disahkan. |
| Opsional | Gunakan lokasi saya dan bantuan peta tambahan | Persetujuan pengguna, dukungan keyboard dan provider nyata; manual tetap tersedia sesuai kebutuhan. |

### Kriteria penerimaan

1. Navbar/footer dan identitas visual tetap mengikuti pin; halaman staf dan
   transaksi di luar cakupan tidak berubah. Desktop/tablet/ponsel diperiksa.
2. Pengunjung/staf/akun tidak aktif tidak melihat data privat pelanggan; ID
   alamat orang lain tidak mengungkap keberadaannya. Peran/status client diabaikan.
3. Nama/telepon tersimpan hanya setelah respons; pembatalan tidak menyimpan;
   nama Unicode/tanda petik sah tidak ditolak atau dieksekusi sebagai HTML.
4. Email aktif belum diganti sebelum verifikasi berhasil; email conflict tidak
   mengungkap akun lain. Token/challenge salah, kedaluwarsa, resend terlalu dini
   dan batas kirim/salah mengikuti sumber server serta P-29.
5. Akun lokal, Google-only, dan akun lokal+Google menampilkan tindakan yang sesuai;
   tidak ada sandi lama palsu, auto-link atau tombol lepas metode tanpa kontrak.
6. Sandi 8–128 sesuai parameter diterima bila aturan server terpenuhi; spasi tidak
   di-trim, paste/manajer sandi bekerja, konfirmasi diuji; sandi umum/bocor ditolak
   server. Perubahan/reset mencabut sesi sesuai alurnya, bukan sekadar toast.
7. Alamat 0–batas efektif, pencarian tanpa hasil dan limit berubah saat form
   terbuka mempunyai pemulihan. Server mencegah alamat keenam saat tab bersamaan.
8. Semua field alamat wajib benar; kode pos mempertahankan nol di depan;
   latitude/longitude nol valid dan pasangan/rentang diperiksa. Alamat manual
   tidak dinyatakan layak instan/same-day tanpa titik.
9. Peta gagal tidak menghilangkan draft; jalur manual tersedia bila sah. Lokasi
   yang dipindah tidak diam-diam meninggalkan rincian alamat yang tidak ditinjau.
10. Menjadikan utama konsisten/atomik; menghapus utama memberi hasil default yang
    nyata. Snapshot alamat pesanan lama tidak berubah setelah operasi buku alamat.
11. Kembali ke checkout mempertahankan konteks yang masih sah, lalu memperbarui
    layanan/ongkir bila alamat berubah. Tidak ada total/layanan lama dipakai diam-diam.
12. Permintaan penghapusan tidak disebut akun sudah terhapus. Pesanan aktif/refund
    diperiksa server; anonimisasi tidak dapat dikonfirmasi sendiri oleh pelanggan
    dan tidak menghapus riwayat transaksi yang wajib dipertahankan.
13. Mutasi ganda, kehilangan respons, konflik revisi dan request duplikat tidak
    menghasilkan perubahan ulang; timeout mempunyai Periksa Hasil/Muat Terbaru.
14. Offline/5xx/503/429/401/403/404 memiliki jalur berikutnya; draft aman bertahan
    jika sesi masih sah, tetapi PII/kredensial dibersihkan saat sesi/akun berakhir.
15. Focus trap, Escape dengan draft, pengembalian fokus, urutan keyboard, label,
    input kode/paste, pengumuman hasil dan reduced-motion diperiksa pada render.
16. Telepon/email/nama/alamat panjang, kosong dan payload parsial tidak clipping;
    bagian gagal tidak membuat hasil tersimpan lain disebut gagal atau sebaliknya.
17. Uji keamanan UI tidak diklaim membuktikan backend: AC-06/08/09/47/48/54,
    ownership/CSRF/session/rate limit dan outbox memerlukan pengujian server nyata.
18. Dokumentasi menyebut bagian yang masih simulasi, kontrak belum tersedia dan
    hasil pemeriksaan yang benar-benar dijalankan. Tugas spesifikasi ini belum
    menjalankan build/e2e/detector/visual QA implementasi baru.

## 12. Asumsi dan keputusan yang belum pasti

| Hal yang belum pasti/konflik | Sikap sementara dan dampak |
| --- | --- |
| Tidak ada frame profil pelanggan lengkap | Struktur empat panel adalah usulan dalam dunia RylVa, bukan salinan frame yang telah disetujui. Desain alamat yang ada dipakai ulang. |
| Telepon akun diminta registrasi tetapi nullable pada SQL/Google-only | Tampilkan data kosong secara sah. Tentukan kewajiban saat edit serta izin mengosongkan; jangan menyalin kewajiban telepon penerima ke profil secara otomatis. |
| Hitungan 9–15 digit pada normalisasi +62 belum dijelaskan rinci | Validator backend harus menetapkan cara hitung dan contoh kanonik; UI tidak membuat regex Indonesia lain sendiri. |
| Email baru, penyimpanan pending, purpose OTP dan keunikan belum terkontrak | Usulan email lama aktif sampai verifikasi; pending terpisah dari enum akun. Endpoint verify registrasi tidak langsung dianggap mendukung perubahan email. |
| Reauth akun Google-only/perubahan email akun tertaut belum ditentukan | Tantangan/aksi berdasarkan capability server. Jangan memaksa sandi lokal atau mengubah email identitas Google; operasi yang belum didukung tidak diaktifkan sebagai fitur produksi. |
| Kelanjutan sesi setelah ubah email/sandi | Perubahan sandi mencabut sesi lain; reset seluruh sesi. Respons server menentukan apakah sesi saat ini masih dapat dipakai; jelaskan login ulang bila diperlukan. |
| Alamat utama pertama/pengganti dan hitungan alamat soft-delete belum eksplisit | Usulan maksimal satu utama atomik dan count alamat aktif; pemilihan pertama/pengganti harus dinyatakan server. Tidak auto-pilih alamat lain di client. |
| Counter catatan Figma 50, kapasitas patokan SQL 255 | Konfirmasi batas input efektif; label maksimal 50 jelas dari skema, tetapi patokan tidak otomatis sama. Validasi server dan teks bantuan harus sama. |
| Provider peta, geocode, data wilayah dan cakupan kurir belum tersedia | Desain peta adalah referensi visual, bukan integrasi. Pisahkan alamat tersimpan, titik valid dan kelayakan layanan checkout. |
| Proses/status/duplikasi/pembatalan permintaan penghapusan belum ada read model | Usulan request bisa tercatat sambil menunggu transaksi. Jangan membuat status akun baru, jaminan durasi atau tombol Batalkan Permintaan tanpa kontrak. |
| 400 vs 422 validasi | A.7 vs §15.4 perlu diselaraskan saat integrasi; UI memetakan error aman, tidak membuat satu kode sebagai fakta tunggal. |
| Sesi/perangkat dan aktivitas ada pada skema/profil staf | Bukan bukti fitur pelanggan sudah ada; tetap lanjutan dan tidak menyalin MFA/limit staf. |
| Footer “pengembalian 7 hari” vs jendela komplain 24 jam | Shell dipertahankan sesuai pin; profil tidak membuat kebijakan baru. Penyelarasan copy pemasaran tetap pekerjaan terpisah. |
| Retensi/anonimisasi | Ikuti S1/P-34–36; tidak menjanjikan penghapusan seluruh data seketika. Peninjauan kewajiban operator tetap di luar keputusan desain ini. |

Tidak ada pertanyaan yang perlu menghambat penyusunan spesifikasi ini. Kontrak
sensitif pada tabel di atas harus diselesaikan sebelum fitur terkait diaktifkan
di produksi. Tahap berikutnya dapat memakai dokumen ini sebagai acuan desain
atau implementasi ketika pengguna memintanya; instruksi ini tidak mengubah Figma
atau kode aplikasi.
