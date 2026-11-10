# Pratinjau akses staf

`public/pages/auth/staff-login.html` adalah prototipe UI lokal untuk login, verifikasi MFA, bantuan akses, undangan, aktivasi, pemulihan kata sandi, dan sejumlah keadaan gagal. Tampilan memakai token, Poppins, ikon, dan tombol yang sudah digunakan panel staf. Menu **Pilihan pratinjau** membuka state contoh secara langsung.

Form hanya memvalidasi format contoh di browser, lalu menampilkan langkah berikutnya. Form tidak mengirim permintaan, membuat sesi, memverifikasi token atau kode, mengubah kata sandi, mengirim email, atau mendaftarkan MFA. Semua akhir alur menyebutkan bahwa perubahan tidak terjadi; pengunjung diminta menggunakan data contoh. QR dan kunci MFA asli tidak dibuat maupun disimulasikan.

## Cakupan

- Email dan kata sandi dengan validasi, tampilan/sembunyi, dan bantuan pemulihan.
- Kode autentikator enam digit dan layar kode cadangan SuperAdmin, keduanya hanya validasi tampilan.
- Aktivasi dua tahap: kata sandi minimal 12 karakter dan contoh verifikasi MFA; undangan kedaluwarsa dan tidak tersedia dapat ditinjau terpisah.
- Bantuan pemulihan yang membedakan Admin dan SuperAdmin, serta tampilan permintaan dan penggantian kata sandi contoh.
- State kredensial salah, kode MFA salah, percobaan ditunda, sesi berakhir, dan gangguan koneksi untuk pratinjau; belum ada pemeriksaan kredensial, penghitungan batas, maupun penundaan nyata.

## Integrasi yang dibutuhkan

Implementasi produksi memerlukan autentikasi dan otorisasi server, perlindungan sesi/CSRF dan pembatasan percobaan, token undangan dan reset sekali pakai, pengiriman email, pendaftaran/verifikasi MFA nyata, kode cadangan, audit, serta pemeriksaan status dan peran. Waktu, CAPTCHA, dan penundaan harus bersumber dari kebijakan server. Baseline P-31 menyebut jeda 15 menit, sedangkan RL-02 khusus staf menyebut 30 menit; perbedaan tersebut perlu direkonsiliasi sebelum penerapan.

Prototipe sengaja tidak mengaitkan layar ini ke dashboard sebagai bukti login. `config/routes.php` dan `StaffAuthController.php` saat ini masih kerangka. `?view=` hanya memilih state visual dan bukan bukti status, hak akses, atau token yang valid.
