# Manajemen Akun Staf — 5 November 2026

`public/pages/superadmin/staff-accounts.html` membantu SuperAdmin menemukan akun yang memerlukan perhatian, memeriksa kesiapan aktivasi/MFA, mengundang Admin, menerbitkan ulang undangan, menandai reset MFA, dan menonaktifkan akses. Implementasi memakai `public/assets/js/staff/accounts/staff-accounts-data.js`, `staff-accounts.js`, dan `public/assets/css/staff/accounts/staff-accounts.css`, dengan shell serta komponen admin incumbent.

Acuan: `docs/specifications/spesifikasi-proyek-v2.6.md` bagian 3.1–3.3, 13.1–13.3, D-13/D-18, serta parameter P-28, P-32, P-33, dan P-44. Halaman ini adalah **prototipe lokal**, bukan layanan pengelolaan akun produksi. `role=superadmin` memilih pratinjau pengelola; `role=admin` menampilkan akses ditolak. Parameter URL dan pemilih profil bukan otorisasi.

## Pekerjaan pengguna dan susunan layar

Pertanyaan utama: akun mana yang belum siap dipakai, apa penyebabnya, dan tindakan berikutnya apa? Dua pintasan perhatian/undangan, empat filter ringkasan, pencarian, filter lanjutan, dan daftar lima baris per halaman mendukung pemindaian. Hitungan ringkasan berasal dari seluruh fixture, sedangkan daftar mengikuti pencarian/filter aktif. Fixture awal memuat enam akun contoh: lima Admin dan satu SuperAdmin; ini bukan register akses deployment dan belum membuktikan minimum dua SuperAdmin pada D-18.

Daftar memisahkan identitas/peran, **status akun**, **aktivasi**, dan **MFA**. Contohnya, akun Aktif masih dapat memerlukan pendaftaran ulang MFA. Aktif & siap menghitung akun berstatus Aktif dengan MFA Aktif; Perlu perhatian mencakup akun belum aktif/ditangguhkan, aktivasi tertunda, atau MFA perlu daftar ulang. Badge menyertakan teks dan ikon, bukan warna saja.

Pencarian mencocokkan nama, email, peran, dan keterangan perhatian. Filter tersedia untuk peran, status akun, dan MFA; urutan mencakup perhatian, terbaru, login terakhir, dan nama. URL merekam peran pratinjau, detail `view=detail&user=...`, pencarian `q`, segmen, filter, urutan, halaman, serta keterbukaan panel filter. Tombol Kembali ke daftar mempertahankan konteks tersebut. Isi dialog dan perubahan akun lokal tidak tersimpan pada URL.

Detail menyatukan identitas, ringkasan akses, linimasa aktivasi, batas/sesi contoh, dan aktivitas hanya baca. Panel tidak menampilkan kata sandi, secret MFA, token, atau backup code. Tautan Audit Log membuka halaman pratinjau terpisah; aktivitas lokal di sini belum dikirim ke modul itu.

Detail dibagi melalui navigasi Ringkasan, Hak akses, Aktivasi, Keamanan & sesi, dan Aktivitas. Membuka akun dari daftar memulai di Ringkasan pada bagian atas halaman; bagian yang dipilih juga tercatat pada URL. Tombol kembali mempertahankan konteks filter daftar.

Pada desktop, tab selain Ringkasan memakai seluruh lebar area detail. Di mobile, pintasan perhatian ditampilkan sebagai banner bertumpuk dan tombol detail berada di kanan bawah setiap akun.

## Alur yang tersedia

- **Undang Admin:** dialog meminta nama, email, dan telepon opsional dalam format +62 diikuti 9–15 digit; peran dikunci ke Admin. Nama 2–100 karakter, format/panjang email, dan duplikasi email antarfixture diperiksa. Berhasil membuat baris lokal Belum aktif / Menunggu aktivasi / MFA Belum siap, dengan masa undangan 24 jam. Tidak ada kata sandi awal, email terkirim, token aktivasi, atau alur penerima nyata.
- **Kirim ulang aktivasi:** tersedia untuk status aktivasi PENDING/EXPIRED. Konfirmasi memperbarui waktu undangan dan masa 24 jam, mengembalikan keadaan lokal ke menunggu, lalu menambah aktivitas. Simulasi email gagal mempertahankan undangan lama dan dialog untuk retry. Pembatalan token lama dan penggunaan sekali pakai masih berupa aturan yang dijelaskan; tidak ada token server. Status kedaluwarsa belum dihitung otomatis dari jam berjalan.
- **Reset MFA:** pada UI saat ini tindakan muncul untuk Admin Aktif yang sudah bertanda MFA Daftar ulang. Dialog memerlukan alasan 5–500 karakter dan pengakuan dampak. Berhasil mempertahankan MFA RESET_REQUIRED, mengosongkan hitungan sesi lokal, dan menambah aktivitas. Tidak ada pemeriksaan identitas, konfirmasi ulang kata sandi/MFA, atau pendaftaran ulang autentikator nyata. Pemulihan SuperAdmin tidak dijalankan dari layar ini.
- **Nonaktifkan akun:** tersedia untuk Admin Aktif, dengan alasan dan pengakuan dampak. Akun lokal menjadi Dinonaktifkan, hitungan sesi menjadi nol, waktu/alasan disimpan dalam objek tab, dan aktivitas lama tetap ada. Pernyataan pencabutan maksimal satu menit/pengembalian pesanan menjelaskan target spesifikasi; kode ini tidak mencabut sesi server atau memindahkan pesanan pada modul antrean.
- **Pemulihan:** kesalahan dialog memfokuskan ringkasan; simulasi email gagal pada pembuatan undangan mempertahankan isian tanpa membuat akun. Simulasi sesi berakhir memblokir tindakan reset/nonaktifkan/kirim ulang tanpa perubahan. Daftar menyediakan loading, gagal muat/retry, placeholder kosong, hasil pencarian kosong/reset, dan detail tidak dikenal/kembali. Muat ulang memulihkan tampilan data lokal, bukan mengambil akun server.

Belum tersedia editor identitas/hak akses, pembuatan atau pemulihan SuperAdmin, aktivasi penerima, pengaktifan kembali, pembukaan penangguhan, atau pencabutan sesi individual. Tidak ada dirty-leave guard untuk isian dialog, state simpan asinkron, atau penanganan penulis bersamaan.

## Visual, responsive, dan keyboard

Poppins lokal, krem/sage, bidang putih berbingkai, radius 8/12 px, tombol/badge antrean, field produk, dialog native, dan shell admin dipakai ulang. Penanda `html.js` mengaktifkan drawer shell mobile; ikon dinamis dibuat dalam namespace SVG. Konten dibatasi 1400 px; judul/teks mengikuti skala admin 26/13 px. Detail desktop memakai kolom utama dan konteks keamanan; di bawah 1280 px detail menjadi satu kolom dan tabel menjadi baris berlabel. Di bawah 768 px toolbar/filter/form ditumpuk serta ringkasan memakai dua kolom; di bawah 400 px ringkasan/pintasan menjadi satu kolom.

Tombol, field, select, dan disclosure memakai elemen native dengan label, focus ring, serta target tindakan 44 px. Dialog memfokuskan field pertama; Escape membersihkan tindakan tertunda melalui event cancel native. Riwayat memakai `details`/`summary` dengan SVG plus/minus dan bagian pertama terbuka. Preferensi pengurangan gerak mematikan animasi/transisi. Ini deskripsi source, bukan hasil uji pembaca layar atau semua perangkat.

`PRODUCT.md`, `DESIGN.md`, konfigurasi Impeccable, dan dokumen modul lain dipertahankan; sidecar desain global yang tidak ada tidak dibuat. File arah Taste adalah keluaran alat, bukan persetujuan untuk mengganti identitas atau memperkenalkan aturan global. Tidak ada raster produk baru.

## Kebenaran data, batas, dan bukti

Fixture memakai tanggal contoh 5 November 2026; tindakan baru memakai waktu browser dan ditampilkan dalam WIB. Angka perangkat/sesi, peristiwa, serta linimasa berasal dari fixture atau nilai turunan, bukan telemetry/token registry. Linimasa pembuatan kata sandi menggunakan waktu undangan sebagai ilustrasi; tidak membuktikan waktu kejadian autentikasi sebenarnya. Semua mutasi berada di memori tab dan hilang saat refresh. Backend, database/API, email, autentikasi/MFA, otorisasi server, pekerjaan sesi, serta audit permanen append-only/hash belum terhubung.

Pada pemeriksaan source ini masih ada batas/copy yang tidak dijadikan aturan: ringkasan izin Admin masih terlalu umum dibanding matriks bagian 3.2; pesan deactivation/audit menyatakan hasil lintas modul yang belum dijalankan. Batas per alur dan integrasi yang diperlukan dicatat di `docs/coverage/staff-accounts-coverage.md`.

`tests/e2e/browser/verify-staff-accounts.cjs` dijalankan pada source final: **4 kelompok lulus, 0 kesalahan console**. Cakupannya daftar/filter perhatian, pembukaan dialog reset, validasi email undangan, dan akses ditolak Admin; ini tidak membuktikan seluruh mutasi atau backend. Pemeriksaan state tambahan gagal kirim ulang memastikan undangan sebelumnya tidak berubah. Taste terbaru `inspect-final-2/report.json` mencatat **0 FAIL / 1 WARN** (`palette-cream`) pada 1440/768/390 px, dengan luapan horizontal terukur nol dan enam JPG. Laporan detail sebelum koreksi (`detail-inspect/report.json`) mencatat **0 FAIL / 3 WARN** (`palette-cream`, `ragged-row`, `no-data-hue`) pada lebar yang sama; ini catatan historis, bukan hasil ulang detail final atau clearance detail.

Paket capture tersedia melalui `.impeccable/review/staff-accounts/captures.json`: **14 PNG** untuk daftar/detail pada 1440/768/390 px, empat bagian detail tambahan, dialog undangan, dialog reset MFA, dialog gagal kirim ulang, dan akses ditolak. Tinjauan awal meminta lima perbaikan: aktivasi shell mobile, namespace SVG dinamis, format telepon, recovery gagal kirim ulang, dan pembungkusan baris JavaScript. Putusan `finish-review.md`/`finish-verdict.md` menilai tepat kelimanya **RESOLVED** pada pemeriksaan sebelumnya. **SHIP hanya mencakup perbaikan yang dinilai, bukan seluruh permukaan atau kesiapan produksi.** Bukti inspeksi menggunakan browser/viewport emulasi; perangkat fisik, pembaca layar, lintas browser, dan backend/keamanan server belum dibuktikan.
