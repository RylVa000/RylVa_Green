# Cakupan halaman pendukung staf

Empat halaman baru melengkapi prototipe Admin/SuperAdmin: `public/pages/staff/staff-profile.html`, `public/pages/staff/staff-notifications.html`, `public/pages/staff/staff-help.html` dan `public/pages/staff/staff-status.html`. Semua memakai shell, tombol, badge, tab, kartu ringkasan, filter dan pagination incumbent. `admin-settings-nav.js` menyediakan menu dan pintasan profil/bantuan lintas modul; menu halaman aktif digulir ke area yang terlihat.

## Profil & Keamanan

- Tab Profil, Keamanan, Perangkat & sesi, dan Aktivitas menggunakan seluruh lebar konten. Profil menampilkan identitas sendiri, status aktif, peran serta verifikasi email contoh. Ini terpisah dari pengelolaan akun staf oleh SuperAdmin.
- Nama dapat diubah dengan batas 2–100 karakter. Telepon opsional harus memakai +62 diikuti 9–15 digit. Email dan peran tidak dapat diganti sendiri; perubahan email nyata membutuhkan verifikasi.
- Form kata sandi meminta kata sandi saat ini, kode MFA contoh, sandi baru dan konfirmasi. Format baru 12–128 karakter, tidak di-trim, berbeda dari input lama dan sesuai konfirmasi. Dua contoh kata sandi umum ditolak; ini bukan pemeriksaan basis kata sandi bocor.
- Tidak ada pemeriksaan kata sandi lama atau kode MFA nyata, hashing, pendaftaran autentikator, kode cadangan, token atau pengiriman email. Kredensial hanya berada pada isian form, tidak ditulis ke fixture/aktivitas/penyimpanan, lalu dihapus dari DOM saat dialog ditutup. Pengguna diminta memakai data contoh.
- Perubahan sandi yang disimulasikan memperbarui waktu dan menghapus sesi contoh lain; sesi saat ini tetap. Akhiri sesi tunggal/semua sesi lain memakai konfirmasi dan validasi format autentikasi ulang. Tidak ada sesi server yang dicabut.
- Baseline P-32 ditampilkan sesuai peran: Admin idle 30 menit/maksimum 8 jam; SuperAdmin idle 15 menit/maksimum 4 jam. Batas P-44 adalah 2 sesi staf. Tidak ada timer sesi nyata.
- MFA wajib dan tidak dapat dimatikan. Ganti perangkat diarahkan ke panduan pemulihan: Admin melalui SuperAdmin, SuperAdmin melalui kode cadangan atau persetujuan kedua. Tidak ada alur bypass MFA.
- Keluar mengarahkan ke login staf; dialog menyatakan bahwa ini pengalihan pratinjau, bukan logout server.

## Pusat Notifikasi

- Fixture memuat 8 pesan; Admin melihat 7 pesan yang relevan, SuperAdmin juga melihat contoh keuangan. Angka ringkasan dihitung dari pesan sesuai profil, sebelum filter daftar.
- Pencarian judul/isi, kondisi dibaca/tindak lanjut, jenis, urutan dan pagination langsung bekerja. Reset mengembalikan filter awal. Tidak ada tombol Terapkan.
- Membuka detail menandai dibaca pada contoh. Penanda bisa diubah kembali. Tandai hasil dibaca berlaku pada seluruh hasil filter, termasuk halaman lain, bukan seluruh pesan di luar filter.
- Dibaca dan perlu tindak lanjut merupakan kondisi terpisah. Tidak ada penyelesaian kasus, perubahan stok, pengiriman pesan/email, maupun penjadwalan notifikasi.
- Pesan keuangan tidak ditampilkan pada pratinjau Admin, termasuk tautan detail langsung. Ini penyaringan UI contoh dan bukan otorisasi server.
- Tautan menuju modul yang sudah tersedia. Fixture modul tujuan dapat berbeda; angka dan kondisi tidak dianggap tersinkron.

## Pusat Bantuan

- Sembilan panduan mencakup login/pemulihan, MFA, sesi, pesanan, refund, kategori/atribut, stok, produksi dan gangguan. Konten mengikuti baseline proyek, bukan dokumentasi layanan produksi yang sudah berjalan.
- Pencarian menelusuri judul, ringkasan, langkah dan catatan penting; filter topik serta pagination tersedia. Detail mempertahankan konteks daftar dan membuka bagian atas.
- Artikel menyediakan langkah, catatan penting, modul tujuan dan panduan terkait. Salin format laporan memakai clipboard browser; bila ditolak, teks ditampilkan dan dipilih untuk salin manual.
- Tidak ada chat, tiket, email, kontak dukungan rekaan atau pesan yang dikirim. Staf menggunakan kanal internal yang disepakati.

## Kondisi sistem

- `staff-status.html?state=` menampilkan `forbidden`, `not-found`, `unavailable`, `maintenance`, atau `session-expired`.
- Tambahan 10 November: `internal-error` (500) dan `rate-limited` (429). Gangguan simpan meminta pemeriksaan hasil sebelum mengulang; batas percobaan tidak mengarang waktu tunggu atau membuka akses otomatis. Rincian pada `docs/coverage/staff-ui-completion.md`.
- Akses ditolak/halaman hilang menawarkan ruang kerja dan bantuan. Gangguan menyediakan tautan membuka ulang tujuan yang diizinkan. Pemeliharaan tidak mengarang waktu selesai. Sesi berakhir menuju login staf.
- Parameter tujuan dibatasi ke dashboard, pesanan, produk atau bahan. Tidak ada pengalihan ke alamat luar dari parameter.
- Ini desain kondisi pada halaman statis yang disajikan biasa; belum ada pemetaan status HTTP, middleware otorisasi, pemeliharaan global atau pemeriksaan kesehatan layanan.

## Ketahanan dan integrasi

State tab/filter/detail/halaman ada pada URL. Daftar mendukung loading, kosong, hasil tidak cocok, gagal/coba lagi dan kondisi penuh. Form memakai dialog native dengan header/tombol terpisah dari isi bergulir. Escape, tombol tutup, Kembali browser dan keluar halaman melindungi edit kotor. Simulasi gagal mempertahankan input dan tidak memutasi data.

Semua perubahan berada di memori halaman, hilang saat refresh dan tidak berbagi state dengan halaman staf lain. Parameter `role` hanya memilih pratinjau. Produksi membutuhkan autentikasi, CSRF, otorisasi setiap tindakan, kebijakan sesi/password/MFA, validasi dan penyimpanan server, audit, outbox notifikasi, waktu server dan penanganan konflik. Rute/controller PHP lama tidak dinyatakan selesai oleh penambahan desain ini.

Pemeriksaan, screenshot dan penilaian akhir dicatat di `storage/reports/hallmark/reports/staff-support-verification.md`. Suite `tests/e2e/browser/verify-staff-support.cjs` mencakup layout, alur, kegagalan, navigasi dan dua profil. Perangkat fisik serta pembaca layar belum diuji.
