# Login dan Registrasi pelanggan

Pembaruan 15 November 2026. UI HTML/CSS/JavaScript pratinjau tersedia untuk
Login, Registrasi, Verifikasi Email, Lupa Kata Sandi dan Kata Sandi Baru.
Controller autentikasi PHP masih scaffold. Dokumen ini tidak menyatakan
autentikasi produksi sudah berjalan.

## Route dan komponen

| Halaman | Route |
| --- | --- |
| Masuk | `/pages/auth/customer-login.html` |
| Registrasi | `/pages/auth/customer-register.html` |
| Kode verifikasi | `/pages/auth/verify-email.html` |
| Lupa kata sandi | `/pages/auth/forgot-password.html` |
| Kata sandi baru | `/pages/auth/reset-password.html` |
| Workbench pengembangan | `/__preview/customer-auth` pada server Node lokal |

Alias HTML root tersedia di manifest pratinjau dan Apache. Halaman staf tetap
terpisah. Shell storefront meneruskan akun contoh yang sudah keluar ke Login;
tindakan masuk pada Checkout serta pemulihan/akses pada Akun juga terhubung.

Komponen bersama: token RylVa, Poppins lokal, logo navbar Figma, warna status
pelanggan, dan validasi nama/telepon akun. Komponen khusus: formulir autentikasi,
toggle kata sandi, satu input OTP dengan enam slot visual, hasil inline, dan
dialog kebijakan/perubahan belum disimpan. Gambar memakai aset sumber Figma;
kontur organik awal kemudian direvisi sesuai permintaan pengguna. Seluruh
kontrol tetap HTML yang dapat diakses.

## Alur dan state

| Area/state | Pemicu dan isi | Tindakan/pemulihan | Data yang dipertahankan |
| --- | --- | --- | --- |
| Normal, hover, fokus | Formulir siap; fokus terlihat, label tetap tampil | Keyboard, autofill, lihat/sembunyikan kata sandi | Isian selama dokumen terbuka |
| Loading awal | Konfigurasi belum diterima | Tunggu; gagal memuat menawarkan Coba Lagi | Tidak ada kredensial dikirim |
| Mengirim | Permintaan berjalan; tombol/input nonaktif | Tunggu hasil; pengiriman ulang dicegah | Isian tetap di dokumen |
| Validasi | Nama/email/telepon/password/konfirmasi/persetujuan belum benar | Pesan per bidang, fokus ke kesalahan pertama | Seluruh isian |
| Kredensial salah/belum verifikasi/dibatasi | Pesan generik sesuai v2.6 | Periksa isian, verifikasi email atau pulihkan kata sandi | Email dan kata sandi |
| Registrasi/duplikat | Respons identik “Jika email belum terdaftar, kode verifikasi telah dikirim” | Lanjut ke formulir kode | Hanya metadata tantangan dan email tersamar |
| Verifikasi tanpa konteks | Tautan langsung tanpa tantangan | Minta kode lewat email tanpa mendaftar ulang | Email hanya di memori dokumen |
| Kode salah | Kode enam digit tidak cocok | Perbaiki kode | Metadata jumlah kesalahan; kode tidak disimpan |
| Kedaluwarsa/5 kesalahan | Kode 10 menit habis atau dibatalkan | Minta kode baru setelah cooldown | Email tersamar dan konteks tantangan |
| Resend cooldown/batas jam | 60 detik; paling banyak 5 pengiriman/jam | Countdown; tunggu atau gunakan email lain | Kode valid tetap dapat diverifikasi walau resend dibatasi |
| Lupa kata sandi berhasil | Pesan generik, tanpa mengungkap keberadaan akun | Kembali ke Masuk atau Ubah Email | Email pada dokumen yang sama |
| Reset tidak valid/kedaluwarsa/digunakan | Tautan tidak dapat dipakai | Minta tautan baru | Tidak ada kata sandi dipersistenkan |
| Reset berhasil | Hasil contoh dijelaskan sebagai pratinjau | Kembali ke Masuk | Tidak ada kata sandi disimpan |
| Gagal layanan/timeout | Pesan gagal dan langkah berikutnya | Coba kembali; pada timeout periksa email dahulu | Isian formulir |
| Offline/pemeliharaan | Formulir gagal dimuat atau kirim terputus | Sambungkan kembali/Coba Lagi, atau tunggu layanan pulih | Isian jika formulir telah terbuka |
| CSRF/sesi formulir berakhir | Tindakan kirim diblokir | Muat Ulang Formulir memperbarui konfigurasi di dokumen yang sama | Isian tetap tersedia |
| Pembatasan percobaan | Tunggu 15 menit; tombol dinonaktifkan | Otomatis tersedia setelah batas berlalu | Isian tetap tersedia |
| Perlu CAPTCHA | Pemeriksaan keamanan diperlukan | Layanan nyata belum tersedia; tersedia jalur pemulihan | Isian; tidak ada tantangan palsu |
| Google batal/gagal/perlu penautan | Pesan umum dan kebutuhan bukti akun lokal | Gunakan email/password atau verifikasi email | Tidak ada penautan otomatis |
| Penyimpanan diblokir | Metadata hanya tersedia di memori | Registrasi tetap dapat berlanjut ke OTP dalam dokumen; reload memerlukan kode baru | Tidak ada password/email mentah dalam storage |
| Gambar gagal/konten panjang | Foto disembunyikan; konten membungkus | Formulir dan kontrol tetap dapat digunakan | Seluruh isian |
| Belum disimpan/meninggalkan | Registrasi atau reset telah diisi | Tetap Mengisi atau Tinggalkan Formulir; Escape mengembalikan fokus | Seluruh isian bila dibatalkan |

Semua state di atas wajib untuk cakupan UI ini. Pencarian, filter, pagination,
penghapusan data, dan konflik penyimpanan profil bukan bagian formulir ini.
Workbench berisi 31 skenario; parameter khusus hanya aktif di localhost.

## Transisi antara Masuk dan Registrasi

15 November 2026: tautan Daftar/Masuk menggunakan sapuan gelombang hijau dua
arah dan pergeseran ringan formulir. Desktop menyapu horizontal; ponsel/tablet
bergerak naik atau turun. Foto tetap diam. Skrip head
`customer-auth-transition.js` hanya dimuat pada kedua halaman tersebut, memakai
generator kurva dari `customer-auth-motion.js`, tanpa library atau aset baru.

Navigasi tetap dokumen HTML asli dan mempertahankan returnTo. Konfirmasi
perubahan belum disimpan muncul sebelum animasi; Batal mempertahankan isian.
Root inert selama transisi mencegah tindakan ganda, fokus kembali ke judul
tujuan setelah selesai, dan Browser Back membersihkan lapisan yang tersisa.
Penanda fokus judul menggunakan warna primary-dark dan mengikuti lebar teks;
bingkai bawaan browser yang melebar sepanjang kolom sudah diganti. Pemeriksaan
transisi juga mengukur fokus, warna outline dan batas lebar aktualnya.
Kurangi gerakan/Jeda menonaktifkan transisi. Gagal storage atau API animasi
tidak memblokir navigasi. Marker kedatangan hanya memuat rute, arah dan waktu,
dihapus saat dibaca, kedaluwarsa 10 detik; cover awal memiliki batas 5 detik.

`node tests/e2e/browser/verify-customer-auth-transition.cjs`: 8 kelompok lulus
tanpa error JavaScript. Meliputi dua arah desktop/mobile, fokus dan cleanup,
Browser Back, dialog isian belum disimpan, returnTo, kurangi gerakan, Jeda,
marker usang dan kegagalan storage. Capture parsial dan hasil akhir berada di
`storage/reports/customer-auth-transition/`. Regresi autentikasi 11 kelompok
dan 31 state juga dijalankan ulang dan lulus.

Detector dijalankan sekali untuk cakupan transisi: 0 temuan primer, 5 advisory
radius pada komponen yang sudah ada. Tidak ada radius baru pada lapisan transisi.
DESIGN.md tetap dipertahankan; Taste gate sebelumnya tetap OPEN. Tidak ada
raster baru atau perubahan integrasi autentikasi.

Finish review awal meminta perbaikan fokus judul. Verdict berikutnya **ship**:
temuan tersebut dinilai resolved pada empat capture hasil akhir desktop/mobile,
tanpa regresi terkait perbaikan. Cakupan verdict adalah temuan yang dinilai,
bukan klaim kesiapan autentikasi produksi. Laporan dan verdict:
`docs/design/reviews/customer-auth-transition-review.md` dan
`docs/design/reviews/customer-auth-transition-verdict.md`.

## Batas data dan integrasi

Adapter `RylvaCustomerAuthPreview` terpisah dari UI. Adapter produksi dapat
disediakan sebagai `window.RylvaCustomerAuthAdapter` sebelum skrip UI, dengan
`load(view, { token })` dan `request(action, values)`. Ini kontrak antarmuka
frontend, bukan endpoint yang sudah ada. Tindakan: login, register,
requestVerification, verify, resend, forgot, reset dan google. UI menerima
hasil produksi yang dikenal: authenticated, emailVerified, recoveryRequested,
passwordReset; respons lain tidak dianggap sukses.

Server wajib mengimplementasikan hash password, validasi/password umum atau
bocor, status akun, OTP/token sekali pakai, pembatasan per akun/IP, CAPTCHA,
pengiriman email, CSRF, sesi HttpOnly/Secure/SameSite, Google OIDC state/nonce,
penautan dengan bukti kepemilikan, versi persetujuan, audit tanpa kredensial,
dan pencabutan sesi setelah reset. Semua pembatasan klien dapat dimanipulasi
dan tidak menggantikan pengamanan server.

Pratinjau selalu berlabel data contoh. Tidak ada email atau autentikasi nyata,
tidak ada token produksi, tidak ada kredensial dicatat/dipersistenkan. Tombol
Lanjutkan Pratinjau membuka data contoh secara eksplisit. ReturnTo dibatasi
route pelanggan pada origin yang sama; URL luar dan route staf ditolak.
Pemulihan/reset tidak memasukkan password ke URL. Dokumen hukum produksi belum
diterbitkan. Pembaruan 19 November: dialog kebijakan registrasi menautkan
pratinjau Syarat dan Ketentuan dan halaman Kebijakan Privasi yang sudah ada di
tab baru dengan `noopener`. Isian tetap di formulir asal; tidak ada password
yang disalin ke storage dan membaca dokumen tidak mencentang persetujuan.
Dialog, Escape dan pengembalian fokus existing dipertahankan.

Keranjang tamu dan kontrak merge autentikasi masih memerlukan backend.
Masuk dari Checkout tidak mengubah keranjang tamu menjadi akun terverifikasi.
Tidak ada transaksi nyata dibuat. Nilai masa berlaku dan rate limit mengikuti
v2.6 §6.2–6.3 dan P-28–P-32; pembersihan akun belum terverifikasi 24 jam adalah
pekerjaan server.

## Pemeriksaan

`node tests/e2e/browser/verify-customer-auth.cjs` memakai Chrome headless
terisolasi. Hasil lokal: 11 kelompok pemeriksaan lulus, 31 skenario dimuat,
tanpa error JavaScript. Termasuk validasi, fokus dialog/Escape, OTP paste,
5 kesalahan, invalidasi kode lama setelah resend, batas resend yang tidak
memblokir verifikasi, reset sekali pakai, input tetap tersedia, kredensial
tidak masuk storage, tujuan kembali aman dan navigasi Akun setelah keluar.

Lima tampilan diperiksa pada desktop, 390px, 320px, 768px dan 1024px. Tablet
memakai susunan vertikal agar teks/kontrol tidak menimpa bidang foto. Snapshot
utama mengikuti ukuran frame Figma; screenshot tersimpan di
`storage/reports/customer-auth/`. Jalankan dengan `--captures-only` untuk
mengambil ulang set tampilan setelah penyesuaian visual.

`node tests/e2e/browser/verify-customer-auth-navigation.cjs`: 5 kelompok lulus,
meliputi alias/workbench, masuk dari Akun/Checkout, retensi keranjang, pembatasan
fixture serta pemisahan login staf. Pemeriksaan sintaks JavaScript dan
`git diff --check` lulus. Proyek ini tidak menambahkan build framework baru.

`DESIGN.md` dipertahankan; `.impeccable/design.json` belum tersedia. Hasil dibandingkan
dengan Poppins lokal, token hijau/krem dan warna status yang sudah digunakan;
penyesuaian kontras hanya pada halaman autentikasi. Tidak ada selector baru
yang mengubah navbar, footer, sidebar atau layout halaman pelanggan lainnya.

Detector Impeccable: 0 temuan primer, 5 advisory radius pada state pemuatan;
bentuk kartu tetap mengikuti Figma. Taste gate berakhir **OPEN, 26 temuan**,
bukan PASS. Mayoritas menilai formulir ini sebagai halaman pemasaran (hero,
navbar, section layar penuh, headline kategori, momen animasi dan wrapper).
Tuntutan itu tidak diterapkan karena bertentangan dengan tugas autentikasi
serta komposisi Figma. Temuan resolusi foto sumber tetap merupakan batas aset
Figma yang diperbesar. Detail asli tersimpan pada `.taste-skill/gate/`;
tidak ada waiver tambahan atau pengubahan checker.

Review pertama menghasilkan **fix** untuk tiga temuan. Verdict setelah perbaikan
adalah **ship**, dengan ketiga temuan dinilai resolved dan tidak ditemukan
regresi visual pada batch tersebut. Cakupan verdict terbatas pada perbaikan
yang dinilai di frontend pratinjau; bukan persetujuan autentikasi produksi atau
klaim Taste gate lulus. Bukti review dan verdict tersimpan lokal di
`.impeccable/review/customer-auth/review.md` dan `verdict.md`.

Perbaikan dari review pertama: tipografi tombol utama kembali memakai ukuran
dan bobot yang dinyatakan; garis input pada panel hijau memenuhi kontras 3:1
terhadap kedua permukaan; label persetujuan memiliki area klik minimal 44×44px.
Pengujian mengukur style/batas aktual dan memastikan klik label mengubah checkbox.
Pengambilan screenshot menunggu font serta decoding gambar sebelum menyimpan
bukti agar foto latar tidak tertangkap saat baru terisi sebagian.

## Revisi gelombang dan layar lebar

15 November 2026, setelah pengguna memeriksa tampilan sebelumnya:

- Latar memenuhi viewport hingga 2560px; batas 1440px pada scene dihapus.
  Lebar formulir tetap terkontrol supaya tidak melebar bersama foto.
- Login/Registrasi memakai kontur Bézier bersambung yang berubah pelan,
  menggantikan sambungan SVG statis yang tajam. Foto asli ditampilkan melalui
  crop SVG; bagian UI lama pada aset Login tidak ditampilkan.
- Pada mobile/tablet, gambar berakhir dengan gelombang horizontal. Pola ini
  diterapkan juga pada Verifikasi, Lupa Kata Sandi dan Kata Sandi Baru.
  Artwork botani pada pemulihan tetap aset yang sama.
- Modul `customer-auth-motion.js` mengelola dekorasi, kurva hijau dan jeda.
  Revisi terbaru menghapus siklus zoom 12 detik: foto statis dan bidang hijau
  sendiri yang berubah bentuk melalui tiga gelombang dengan fase/laju berbeda.
  Fase awal diacak per halaman; puncak/lembah bergeser secara lokal melalui
  kurva bersambung, bukan hanya membesarkan/mengecilkan satu bentuk.
  Pengguna dapat Jeda/Putar dengan
  pointer atau keyboard; preferensi sesi hanya menyimpan boolean.
- Gerak berhenti pada prefers-reduced-motion, dokumen tersembunyi, dan header
  foto yang keluar dari viewport. Formulir tetap dapat digunakan dalam keadaan
  jeda maupun gambar gagal.

`node tests/e2e/browser/verify-customer-auth-artwork.cjs`: 6 kelompok lulus,
mencakup lima tampilan, layar 320–2560px, lebar penuh/overflow, perubahan bentuk
kurva yang benar-benar berjalan, Jeda/Putar dan retensinya, kurangi gerakan,
  pause di luar viewport, serta submit pemulihan. Pengujian autentikasi lengkap
11 kelompok/31 state juga dijalankan ulang dan lulus tanpa error JavaScript.
Snapshot revisi: `storage/reports/customer-auth-wave/`.

Detector revisi dijalankan satu kali: 0 primer, 3 advisory radius. Provenance
tetap 6 raster/0 missing; tidak ada gambar baru atau library animasi tambahan.
Taste gate sebelumnya tetap OPEN, bukan PASS; tidak direset untuk revisi ini.

Review baru terhadap kedua screenshot pengguna, 14 capture terbaru dan integrasi
motion menghasilkan **ship** tanpa temuan material dalam cakupan revisi ini.
Hasil tidak menyatakan autentikasi produksi siap. Laporan:
`docs/design/reviews/customer-auth-wave-review.md`.

Koreksi berikutnya atas permintaan pengguna: seluruh animasi transform/zoom foto
dihapus. Tepi yang bergerak kini merupakan path SVG berwarna hijau di atas foto
statis. Tiga gelombang kontinu dengan fase/laju awal acak mengubah tiap bagian
tepi secara berbeda; sampel disambung halus, tidak mengulang dua bentuk yang sama.
Satu path aktif diperbarui maksimal 30fps dan berhenti pada jeda, offscreen atau
kurangi gerakan. Latar desktop pemulihan memakai tepi hijau yang sama di bawah.

Pemeriksaan browser terbaru mengukur gambar yang terlihat (bukan elemen
responsive yang disembunyikan): transform `none`, posisi dan ukuran tetap sama
selama beberapa sampel waktu, sementara koordinat tepi hijau bergerak ke dua
arah. Enam kelompok pemeriksaan motion lulus tanpa error JavaScript.
Sebelas kelompok/31 state autentikasi juga dijalankan ulang dan lulus. Review
baru menilai revisi foto statis/gelombang hijau **ship** tanpa temuan material
dalam cakupan tersebut; laporan `docs/design/reviews/customer-auth-green-wave-review.md`.
