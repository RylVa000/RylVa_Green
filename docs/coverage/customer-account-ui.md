# Cakupan UI Profil & Pengaturan Akun Pelanggan

> **Revisi terbaru 13 November 2026:** Aktivitas Login, tombol penting, alamat
> sesuai referensi, Leaflet/geocoding, detail wilayah tersembunyi dan shell
> ringkas ditambahkan setelah cakupan awal di bawah. Lihat
> [revisi pelanggan](customer-refinements.md) untuk perilaku serta integrasi terkini.

13 November 2026. Frontend pratinjau dengan data sintetis. Tidak melakukan
autentikasi, pengiriman email, pengubahan kredensial atau anonimisasi produksi.

## Halaman dan struktur

- `public/pages/customer/account.html`, alias `/account.html`.
- `public/assets/css/storefront/account.css`: perluasan khusus akun.
- `public/assets/js/storefront/account.js`: presentasi, dialog, draft, fokus dan navigasi.
- `public/assets/js/storefront/account-validation.js`: validasi kenyamanan/normalisasi frontend.
- `public/assets/js/storefront/account-preview-data.js`: fixture/read model/mutasi lokal.
- `tools/preview/account-states.html`: workbench pada `/__preview/account`,
  di luar document root; menyediakan state halaman, gangguan tindakan dan Reset.
- `tests/e2e/browser/verify-account.cjs`: alur browser dan capture aktual.
- [Spesifikasi](../design/surfaces/customer-account-surface.md) memuat aturan,
  57 state konseptual dan kriteria penerimaan. Status native/aksi tidak semuanya
  menjadi parameter fixture tersendiri.

## Yang diimplementasikan

Empat panel: Profil, Daftar Alamat, Keamanan, serta Privasi & Akun. Referensi
Tokopedia digunakan untuk ringkasan pelanggan, navigasi horizontal dan baris
informasi dengan aksi Ubah. Sidebar hanya berisi akun dan Pesanan Saya; tidak
menambahkan program PLUS, dompet, rekening, foto unggahan, gender atau tanggal
lahir dari gambar. Identitas menggunakan inisial, bukan foto contoh yang
dianggap foto pelanggan. Navbar/footer memakai markup/aset/font Figma yang sama.

Profil menampilkan nama, email/verifikasi dan nomor HP secara terpisah. Dialog
profil mengubah nama/telepon; email mempunyai proses sendiri sehingga tidak
berganti sebelum kode berhasil. Kata sandi memakai reautentikasi, konfirmasi,
tampilkan/sembunyikan dan validasi. Isian tidak di-trim untuk sandi dan rahasia
tidak disimpan dalam fixture, URL atau sessionStorage. Pemeriksaan kata sandi
contoh hanya pemeriksaan ilustrasi panjang dan pola umum; bukan hashing,
verifikasi kredensial atau basis data sandi bocor.

Buku alamat mempunyai cari/reset, kosong/tanpa hasil, tambah/edit/hapus, satu
alamat utama dan limit lima pada fixture. Form dua tahap memakai pola Figma
lokasi/rincian, dengan data wilayah terstruktur dan alamat multiline. Manual
tersedia; titik tersimpan dapat dipakai ulang. Tidak ada peta/geocoding vendor
aktif atau peta palsu. Konteks instan/same-day contoh memerlukan titik sebelum
simpan. Mengubah buku alamat tidak mengubah data snapshot pesanan.

Permintaan penghapusan hanya mencatat request contoh, menampilkan penantian
transaksi/pemrosesan dan tidak mengaku akun sudah dianonimkan. Google-only tidak
dipaksa memasukkan sandi lama; penambahan sandi membuka penjelasan alur pemulihan
yang belum tersambung. Ubah email dan pengajuan sensitif Google-only tidak
diaktifkan tanpa kontrak reautentikasinya. Tidak ada auto-link/unlink Google.

Logout contoh membersihkan konteks privat dan menyimpan penanda signed-out
nonpribadi. Pembacaan tiga adapter transaksi contoh menghormati penanda itu agar
data tidak muncul kembali lewat tautan setelah logout. Ini konsistensi demo,
bukan kontrol autentikasi produksi. Reset pada workbench Akun menghapus penanda
dan menyiapkan ulang fixture. Sesi aktif/ownership nyata tetap kewajiban server.

## State dan interaksi

- Normal, read-only, capability tidak tersedia, Google-only/tertaut, telepon kosong.
- Loading awal/lama, retry, partial section dan refresh gagal; data lama diberi
  label dan tindakan dibatasi sampai sumber diperbarui.
- Data inti tidak valid, nama/email/alamat panjang, alamat kosong, pencarian
  tanpa hasil, limit, alamat tidak tersedia, perubahan revisi dan data stale.
- Email pending/expired/batas kode/pengiriman gagal/konflik, resend/cooldown;
  kode belum terkirim atau tidak berlaku tidak dapat difinalisasi oleh UI.
- Gangguan mutasi: gagal simpan, timeout setelah commit, konflik, CSRF, 429,
  sesi berakhir, denied, validasi, duplikasi, sandi salah dan pemberitahuan tertunda.
- Periksa Hasil Terbaru untuk respons ambigu. Konflik/CSRF mempertahankan draft
  nonrahasia untuk ditinjau; timeout tidak otomatis mengirim mutasi ulang.
- Offline, gangguan/maintenance, login/verifikasi, akun nonaktif/tidak tersedia,
  anonimisasi, request penghapusan tertunda/layak diproses dan logout.
- Draft dilindungi saat Escape/meninggalkan formulir. Dialog mempunyai focus
  trap, tombol tutup/Batal, serta pemulihan fokus setelah hasil dirender ulang.
- Pengiriman ganda dikunci. Teks kontrol dan status tetap dapat dipahami tanpa
  hover/warna saja. Ponsel/tablet memakai urutan konten yang sama dan area sentuh
  fondasi storefront.

Fixture mempunyai 38 state halaman dan 13 gangguan tindakan selain mode normal.
Tidak semua state merupakan perbedaan bisnis: sebagian memeriksa data atau
jaringan. Workbench menjelaskan kode/isian contoh; kredensial pengguna asli
tidak diperlukan. Controls pengembangan tidak ditambahkan pada alur pelanggan.

## Navigasi dan integrasi

Tombol Akun pada shell membuka route baru. Dari Pesanan Saya, konteks daftar
disimpan melalui pola yang sudah ada, lalu kembali memulihkan pencarian,
filter/cursor dan gulir. Dari Detail/Pembayaran, tombol kembali diberi nama sesuai
tujuannya; tautan Pesanan Saya tetap menuju daftar. Return URL dibatasi origin
dan path internal. Tidak ada route checkout aktif untuk dihubungkan pada sesi ini.

Adapter lain dapat diberikan melalui `window.RylvaAccountAdapter`, dengan
`getSnapshot({ signal })` dan `perform(action, payload, expectedVersion)`.
Ini antarmuka frontend yang diusulkan, bukan endpoint baru atau layanan aktif.
DTO memakai data aman/metode masuk/capability/limit/revisi. Validasi klien tidak
menggantikan validasi, uniqueness, ownership, rate limit, CSRF atau reauth server.

Data contoh tersimpan per tab pada key `rylva-account-preview-v1:<scenario>`;
fallback memori dipakai jika storage ditolak. Hanya profil/alamat/status contoh
yang disimpan. Penanda akses memakai `rylva-account-preview-access-v1` tanpa PII.
Fixture bukan data produksi dan bukan sinkronisasi otorisasi lintas tab nyata.

Keputusan sementara yang dibatasi pada pratinjau:

- Telepon akun boleh kosong, sesuai nullable pada skema; nomor penerima wajib.
  Validasi memakai +62 dan total 9–15 digit termasuk kode negara, dengan
  normalisasi input 08. Kontrak backend tetap perlu menyatakan aturan final.
- Catatan alamat memakai 50 karakter mengikuti counter Figma; kapasitas SQL 255
  tidak diubah. Ini keputusan UI contoh, bukan perubahan parameter bisnis.
- Tidak otomatis menjadikan alamat pertama utama; checkbox menentukan pilihan.
  Menghapus alamat utama tidak memilih alamat lain secara acak.
- Email lama tetap aktif selama pending; status pending bukan enum akun baru.
  Penghapusan pending juga bukan akun Dinonaktifkan/Dianonimkan secara otomatis.

Masih memerlukan backend/auth/email/OIDC, hashing dan reautentikasi sesungguhnya,
proses verifikasi perubahan email, reset akun, request anonimisasi, audit/outbox,
CSRF/idempotensi/revisi, provider lokasi dan penghitungan ulang quote Checkout.
Baseline API hanya yang tercantum di A.7; tidak dibuat endpoint rekaan.

## Cara menjalankan dan bukti

Server sesi pengerjaan berjalan pada port 4180. Jalankan server baru atau restart
server pratinjau setelah mengubah manifest/route karena konfigurasi dibaca saat
startup. Node hanya menyajikan HTML/aset, tidak menjalankan PHP.

```powershell
$env:RYLVA_PREVIEW_PORT = '4180'
node tools/preview/serve-dashboard.cjs
```

Pada terminal lain:

```powershell
node tests/e2e/browser/verify-account.cjs
node tools/maintenance/check-project-structure.cjs
git diff --check
```

URL pengujian dapat diubah lewat `RYLVA_ACCOUNT_URL`. Chrome headless memakai
runtime Puppeteer proyek dan profil tersendiri, bukan profil browser pengguna.
Di lingkungan pengerjaan, peluncuran Chrome dilakukan melalui eksekusi di luar
sandbox yang diizinkan agar browser dapat tersambung.

Laporan JSON dan capture: `storage/reports/account/`. Review akhir:
[customer-account-review-2026-11-13.md](../design/reviews/customer-account-review-2026-11-13.md).

Hasil browser akun akhir: **lulus 38 skenario, 18 kelompok pemeriksaan, 35
capture, tanpa kesalahan JavaScript**. Termasuk form, dua tahap alamat,
normalisasi telepon/kode pos, email lama selama verifikasi, sandi, 13 gangguan
mutasi, rekonsiliasi timeout, konflik/CSRF, pengiriman ganda, draft/Escape,
focus trap/pemulihan fokus, penutupan data setelah logout di tiga halaman
transaksi, return URL dan pemulihan kueri/gulir Pesanan Saya.

Pemeriksaan render memakai lebar 1440, 1024, 768, 390 dan 320 px. Nama/email,
label/alamat panjang, kosong, partial, pending, limit, login, loading dan dialog
dibuka dari hasil aktual. Form alamat diperiksa di bagian atas serta bawah,
melalui gulir dan keyboard. Perbaikan target mencakup nama panjang pada sidebar,
ruang label menu tablet, textarea alamat, dan fokus ke kontrol pengganti sesudah
render ulang. Navbar/footer mempertahankan geometri/aset sumber.

Pemeriksaan struktur lulus: 24 halaman, 29 stylesheet, 60 JavaScript, 536
referensi, tidak ada referensi hilang. Sembilan berkas JavaScript yang terkait
perubahan lulus `node --check`; `git diff --check` tidak menemukan error
whitespace. Proyek frontend ini tidak memiliki build bundler baru.

Regresi Pembayaran lulus 50 skenario/73 pemeriksaan/16 capture, Pesanan Saya
lulus 29/22/22, Detail Pesanan lulus 50/34/29, serta shell lulus 11
pemeriksaan/11 aset; tanpa kesalahan JavaScript.

Hallmark statis akhir: **9 FAIL, 11 REFLEX, 4 WARN**. Hallmark dengan render:
**27 FAIL, 15 REFLEX, 6 WARN**, termasuk temuan URL/file yang dihitung ulang.
Temuan layout sidebar akun telah diperbaiki; yang tersisa mencakup shell sumber
(spacing mentah, kontras, border pencarian, label/footer yang membungkus, HOT
9 px), area aksen dan jumlah bobot font warisan. Impeccable dijalankan sekali:
**2 warning, 6 advisory**, pada HOT, font footer dan nilai shell di luar sidecar.
Hasil tersebut bukan PASS detector dan bukan sertifikasi AA seluruh shell.

Taste mempunyai konflik heuristik dengan mode Operate dan pin sumber: hero
satu layar/foto/momen pemasaran, CTA penutup, satu section per layar, struktur
container, data kontak asli dan navigasi tanpa gulir. Akun memakai data sintetis
yang diberi label; navigasi section ponsel sengaja dapat digulir dengan pilihan
yang difokuskan tetap terlihat. Hasil gate asli beserta seluruh temuan tersimpan
di `storage/reports/account/taste-gate*.txt`; tidak ada waiver atau perubahan
alat agar hasil tampak lulus. Hasil final **GATE: OPEN 50 (rounds used up)**,
dengan 13 WARN; bukan PASS. Log lengkap disalin ke direktori review.

Review independen awal menemukan satu perbaikan placeholder akun. Warna telah
diubah ke token muted dengan opacity 1, dan seluruh capture diperbarui. Reviewer
yang sama menilai temuan **resolved**, disposition **ship pada perbaikan yang
dinilai**. Suite akhir tetap 38/18/35/0, termasuk computed style placeholder
pada lima ukuran layar. Cakupan review serta keterbatasan pembacaan sumber
dijelaskan dalam laporan review; tidak diklaim sebagai audit semua source.

## Konsistensi desain dan skill

`PRODUCT.md`, `DESIGN.md`, token dan sidecar desain global dipertahankan. Surface
brief akun mencatat perluasan ini. UI/UX Pro Max dipakai melalui panduan bawaan
label/error, keyboard, fokus, sentuhan dan navigasi kembali; pencarian database
Python tidak dijalankan karena runtime Python tidak ditemukan di PATH.

Tidak ada raster baru; logo/ikon menggunakan SVG incumbent dan identitas
pelanggan memakai inisial. Gambar referensi pengguna tidak dijadikan aset UI.
Aturan hero/foto/section pemasaran dari Taste tidak menggantikan tugas akun
mode Operate. Semua hasil gate/detector dilaporkan sesuai hasil sebenarnya,
termasuk keterbatasan navbar/footer Figma yang dipin pengguna.
