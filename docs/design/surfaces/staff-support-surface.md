# Halaman pendukung staf

Mode: **Operate** untuk Profil & Keamanan, Notifikasi dan kondisi sistem; **Read** untuk panduan operasional di dalam shell yang sama. Lingkup melengkapi empat halaman pendukung yang belum ada tanpa mengganti modul operasional.

## Direction contract

THESIS: staf melihat kondisi akun, pesan dan langkah berikutnya dengan batas tindakan yang jelas. “Dibaca” tidak disamakan dengan masalah selesai, dan pengelolaan akun sendiri terpisah dari Manajemen Akun Staf.

OWN-WORLD: perluasan RylVa Green incumbent, Poppins lokal, krem dan hijau botani. Shell, catalog-stat, tab, tombol, badge, filter dan pagination dipakai kembali. Taste Accent ladder, seed 202880260, mempertahankan palet dan tipografi proyek. Tidak ada kebutuhan foto atau ilustrasi.

STORY: Profil → keamanan dan sesi sendiri; Notifikasi → baca konteks lalu buka modul terkait; Bantuan → cari panduan dan langkah eskalasi; kondisi sistem → memahami batas akses atau gangguan lalu memilih jalur pemulihan yang aman.

FIRST VIEWPORT: judul tugas, penanda status yang ditulis, banner penting dan tindakan utama. Detail memakai lebar penuh; di mobile banner bertumpuk dan tindakan baris berada di kanan bawah.

SIGNATURE: status selalu dipasangkan dengan dampak dan langkah berikutnya. Form sensitif mempertahankan isian saat gagal, melindungi perubahan belum disimpan, dan memisahkan tombol dari isi bergulir.

BOUNDARIES: semua data contoh berada di memori halaman. Tidak ada perubahan kredensial, pendaftaran MFA, pencabutan sesi server, pengiriman pesan, otorisasi, atau audit permanen. Profil memakai akun contoh yang sudah ada; kebijakan kata sandi/sesi mengikuti baseline P-28/P-32/P-44. Tidak meminta pengguna memasukkan kredensial asli.

## Rencana berkas

Tambahkan `staff-profile.html`, `staff-notifications.html`, `staff-help.html`, `staff-status.html`, stylesheet dan helper pendukung bersama serta modul per halaman. Perbarui `admin-settings-nav.js` untuk akses lintas halaman dengan komponen shell yang ada. Rute dan komponen lama dipertahankan.
