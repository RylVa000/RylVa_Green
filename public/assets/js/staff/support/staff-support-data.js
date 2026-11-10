"use strict";

window.staffSupportFixture =
{
  accounts:
  {
    admin:
    {
      id: "admin-01",
      name: "Nadia Putri",
      email: "nadia.putri@rylva.green",
      phone: "+6281398765432",
      role: "Admin",
      passwordUpdated: "2026-10-21T09:00:00+07:00",
      sessions:
      [
        { id: "current", device: "Chrome di Windows", location: "Jakarta", current: true, at: "2026-11-05T08:15:00+07:00" },
        { id: "mobile", device: "Chrome di Android", location: "Jakarta", current: false, at: "2026-11-05T07:40:00+07:00" }
      ],
      activity:
      [
        { title: "Login dengan MFA", description: "Sesi contoh Chrome di Windows dibuka.", at: "2026-11-05T07:56:00+07:00" },
        { title: "Akun diaktifkan", description: "Kata sandi dan pendaftaran MFA selesai pada data contoh.", at: "2026-10-21T09:00:00+07:00" }
      ]
    },
    superadmin:
    {
      id: "superadmin-01",
      name: "SuperAdmin RylVa",
      email: "superadmin@rylva.green",
      phone: "+6281212345678",
      role: "SuperAdmin",
      passwordUpdated: "2026-10-01T08:00:00+07:00",
      sessions:
      [
        { id: "current", device: "Chrome di Windows", location: "Jakarta", current: true, at: "2026-11-05T09:18:00+07:00" }
      ],
      activity:
      [
        { title: "Login dengan MFA", description: "Sesi contoh Chrome di Windows dibuka.", at: "2026-11-05T08:42:00+07:00" },
        { title: "Akun awal disiapkan", description: "Contoh akun dari prosedur peluncuran.", at: "2026-10-01T08:00:00+07:00" }
      ]
    }
  },
  notifications:
  [
    {
      id: "payment-review", type: "orders", title: "Pembayaran perlu ditinjau", read: false, attention: true,
      description: "Periksa kecocokan pembayaran dan alasan penanganan sebelum mengambil keputusan.",
      detail: "Membaca pemberitahuan ini tidak mengubah status pembayaran. Buka antrean penanganan untuk memeriksa bukti, nominal, dan kewenangan keputusan.",
      at: "2026-11-05T09:15:00+07:00", target: "../staff/orders-queue.html?tab=attention", targetLabel: "Buka penanganan pesanan"
    },
    {
      id: "stock-low", type: "stock", title: "Periksa stok produk yang menipis", read: false, attention: true,
      description: "Stok tersedia berbeda dari saldo fisik ketika ada reservasi aktif.",
      detail: "Periksa SKU, lokasi dan reservasi pada modul produk. Penyesuaian stok memerlukan referensi dan alasan; pemberitahuan ini tidak menambah stok.",
      at: "2026-11-05T09:00:00+07:00", target: "../staff/products.html", targetLabel: "Buka Produk & Varian"
    },
    {
      id: "security-login", type: "security", title: "Aktivitas masuk pada perangkat contoh", read: false, attention: false,
      description: "Tinjau daftar perangkat jika aktivitas masuk tidak Anda kenali.",
      detail: "Daftar perangkat di halaman ini adalah contoh. Pada aplikasi nyata, periksa sesi akun dan akhiri sesi yang tidak dikenal melalui alur autentikasi ulang.",
      at: "2026-11-05T08:42:00+07:00", target: "../staff/staff-profile.html?tab=sessions", targetLabel: "Periksa perangkat & sesi"
    },
    {
      id: "material-batch", type: "stock", title: "Batch bahan perlu diperiksa", read: true, attention: true,
      description: "Bahan lewat batas pakai tidak dihitung sebagai stok bebas yang dapat dipakai.",
      detail: "Buka Bahan Produksi untuk melihat lokasi dan batch. Alokasi tidak boleh memakai batch yang tidak layak. Kondisi pada modul tujuan mengikuti fixture modul tersebut.",
      at: "2026-11-05T08:20:00+07:00", target: "../staff/production-materials.html", targetLabel: "Periksa bahan produksi"
    },
    {
      id: "catalog-guide", type: "system", title: "Panduan kategori dan atribut tersedia", read: true, attention: false,
      description: "Pisahkan atribut deskriptif dari pilihan pembeda SKU.",
      detail: "Definisi atribut tidak otomatis membuat kombinasi varian. Periksa pemakaian sebelum menonaktifkan atau menghapus kategori dan pilihan atribut.",
      at: "2026-11-04T16:10:00+07:00", target: "../staff/staff-help.html?article=catalog", targetLabel: "Baca panduan katalog"
    },
    {
      id: "production-check", type: "orders", title: "Periksa kesiapan pekerjaan buket", read: false, attention: true,
      description: "Kesiapan bahan dan tahap produksi merupakan dua kondisi yang berbeda.",
      detail: "Periksa kekurangan bahan, alokasi dan kebutuhan snapshot sebelum mulai merangkai. Perubahan definisi buket tidak menghitung ulang pekerjaan yang sudah ada.",
      at: "2026-11-04T15:30:00+07:00", target: "../staff/bouquet-production.html", targetLabel: "Buka Buket & Produksi"
    },
    {
      id: "password-guide", type: "security", title: "Kenali pemulihan akses staf", read: true, attention: false,
      description: "Admin dan SuperAdmin memiliki jalur pemulihan MFA yang berbeda.",
      detail: "Jangan membagikan kata sandi, kode autentikator atau kode cadangan. Gunakan prosedur verifikasi identitas dan persetujuan yang berlaku.",
      at: "2026-11-04T11:00:00+07:00", target: "../staff/staff-help.html?article=mfa", targetLabel: "Baca bantuan MFA"
    },
    {
      id: "finance-review", type: "finance", title: "Tinjau selisih rekonsiliasi", read: false, attention: true, superadminOnly: true,
      description: "Periksa transaksi dan bukti sebelum menyelesaikan selisih.",
      detail: "Penyelesaian manual harus mengikuti pemisahan pengaju dan penyetuju. Status dibaca tidak menyelesaikan selisih atau memindahkan dana.",
      at: "2026-11-05T09:25:00+07:00", target: "../superadmin/payment-reconciliation.html", targetLabel: "Buka rekonsiliasi"
    }
  ],
  articles:
  [
    {
      id: "login", category: "access", title: "Masuk & pemulihan kata sandi",
      summary: "Gunakan login staf, kata sandi dan aplikasi autentikator.",
      steps:
      [
        "Buka halaman login staf. Akun belanja pelanggan tidak digunakan untuk mengakses ruang kerja ini.",
        "Masukkan email staf dan kata sandi, lalu verifikasi kode dari aplikasi autentikator.",
        "Jika lupa kata sandi, gunakan Lupa kata sandi. Kata sandi Admin dan SuperAdmin sedikitnya 12 karakter.",
        "Jika undangan belum aktif atau sudah kedaluwarsa, minta SuperAdmin memeriksa akun dan menerbitkan ulang undangan."
      ],
      important: "Jangan mengirim kata sandi atau kode MFA kepada orang lain. Pemulihan harus melalui prosedur verifikasi.",
      target: "../auth/staff-login.html?view=recovery", targetLabel: "Buka pemulihan akses", related: ["mfa", "sessions"]
    },
    {
      id: "mfa", category: "access", title: "Akses autentikator hilang",
      summary: "Pilih jalur pemulihan sesuai peran tanpa menonaktifkan kewajiban MFA.",
      steps:
      [
        "Pastikan waktu perangkat autentikator benar dan periksa apakah akses masih tersedia pada perangkat yang sah.",
        "Admin menghubungi SuperAdmin melalui kanal internal yang disepakati untuk pemeriksaan identitas dan reset MFA.",
        "SuperAdmin menggunakan kode cadangan yang disimpan aman, atau menjalankan pemulihan dengan persetujuan SuperAdmin kedua.",
        "Setelah pemulihan, daftarkan ulang autentikator melalui alur yang sah dan periksa sesi akun."
      ],
      important: "Halaman profil tidak menyediakan tombol mematikan MFA. Jangan membagikan secret, QR autentikator, kode OTP atau kode cadangan.",
      target: "../auth/staff-login.html?view=help", targetLabel: "Buka bantuan akses staf", related: ["login", "sessions"]
    },
    {
      id: "sessions", category: "access", title: "Memeriksa perangkat & sesi",
      summary: "Bedakan sesi saat ini dari perangkat lain sebelum mengakhirinya.",
      steps:
      [
        "Buka Profil & Keamanan, lalu pilih Perangkat & sesi.",
        "Periksa perangkat, aktivitas terakhir dan penanda Sesi ini. Lokasi perangkat hanya membantu pemeriksaan dan bukan bukti identitas.",
        "Akhiri sesi lain yang tidak diperlukan melalui konfirmasi dan autentikasi ulang.",
        "Bila aktivitas mencurigakan berlanjut, ubah kata sandi dan ikuti prosedur pelaporan internal."
      ],
      important: "Admin: idle 30 menit, maksimum 8 jam. SuperAdmin: idle 15 menit, maksimum 4 jam. Batas baseline keduanya 2 sesi aktif; penerapan nyata menggunakan waktu server.",
      target: "../staff/staff-profile.html?tab=sessions", targetLabel: "Periksa sesi saya", related: ["mfa", "login"]
    },
    {
      id: "orders", category: "orders", title: "Status pesanan & pengiriman",
      summary: "Status pesanan, pembayaran dan pengiriman harus diperiksa terpisah.",
      steps:
      [
        "Buka Manajemen Pesanan dan periksa penanda perhatian serta batas waktu tindakan.",
        "Buka Ringkasan untuk melihat pembayaran, snapshot item, penerima dan jadwal kirim.",
        "Gunakan tab Pemenuhan atau Penanganan sesuai kondisi. Periksa bukti dan prasyarat sebelum mengganti status.",
        "Untuk COD, barang terkirim tidak otomatis berarti uang telah diterima. Konfirmasi penerimaan uang dilakukan melalui alur pembayaran yang sesuai."
      ],
      important: "Membaca notifikasi atau membuka detail tidak menyelesaikan kasus. Penyelesaian harus dilakukan di modul pesanan.",
      target: "../staff/orders-queue.html?tab=attention", targetLabel: "Buka Manajemen Pesanan", related: ["refund", "outage"]
    },
    {
      id: "refund", category: "orders", title: "Pembatalan, komplain & refund",
      summary: "Periksa hak, bukti dan pemisahan pengaju dari penyetuju.",
      steps:
      [
        "Buka pesanan terkait dan periksa permintaan pada tab Purnajual.",
        "Pembatalan pesanan dan pengembalian dana merupakan proses terpisah. Periksa status pembayaran dan sisa hak refund.",
        "Pengaju refund tidak boleh menyetujui pengajuannya sendiri. Nominal di atas Rp 500.000 memerlukan SuperAdmin.",
        "Periksa hasil sebelum mencoba ulang refund gagal. Catat alasan, referensi dan bukti melalui formulir yang sesuai."
      ],
      important: "Jangan menjanjikan refund berhasil hanya karena permintaan telah disetujui. Gunakan status hasil transaksi yang terverifikasi.",
      target: "../staff/orders-queue.html?workspace=aftercare", targetLabel: "Buka Purnajual", related: ["orders", "outage"]
    },
    {
      id: "catalog", category: "catalog", title: "Kategori, atribut & varian",
      summary: "Kelompokkan produk tanpa membuat atau mengubah SKU secara tidak sengaja.",
      steps:
      [
        "Gunakan Kategori & Atribut untuk mengelola definisi dan pilihan katalog. Satu produk dapat memiliki beberapa kategori.",
        "Periksa tab Pemakaian sebelum menonaktifkan atau menghapus definisi.",
        "Atribut deskriptif menjelaskan produk. Pembeda varian digunakan melalui editor Produk & Varian; definisi atribut tidak otomatis membuat SKU.",
        "Periksa keunikan SKU dan kombinasi varian, harga, satuan dan stok sebelum mengaktifkan produk."
      ],
      important: "Data contoh antarhalaman belum tersinkron. Perubahan definisi pada pratinjau ini tidak mengubah katalog produksi.",
      target: "../staff/categories-attributes.html", targetLabel: "Buka Kategori & Atribut", related: ["stock", "production"]
    },
    {
      id: "stock", category: "catalog", title: "Stok, reservasi & batch",
      summary: "Baca saldo per lokasi dan periksa kelayakan batch sebelum memakai stok.",
      steps:
      [
        "Buka produk atau bahan, lalu pilih lokasi dan bagian stok/batch yang sesuai.",
        "Bedakan saldo fisik dari stok bebas setelah reservasi atau alokasi. Jangan menganggap seluruh saldo dapat digunakan.",
        "Batch lewat batas pakai tidak boleh dipakai sebagai stok bebas untuk pemenuhan atau produksi.",
        "Penerimaan, koreksi, kerusakan dan transfer dicatat melalui tindakan masing-masing dengan referensi serta alasan."
      ],
      important: "Satuan berbeda tidak dijumlahkan. Perubahan stok nyata harus menjaga saldo dan referensi transaksi pada server.",
      target: "../staff/production-materials.html", targetLabel: "Buka Bahan Produksi", related: ["catalog", "production"]
    },
    {
      id: "production", category: "production", title: "Menyiapkan produksi buket",
      summary: "Periksa kebutuhan snapshot, alokasi dan pemakaian sebelum menandai selesai.",
      steps:
      [
        "Buka Buket & Produksi dan pilih pekerjaan sesuai tenggat.",
        "Periksa kekurangan serta kendala sebelum mulai merangkai. Kebutuhan mengikuti snapshot pekerjaan, bukan perubahan master terbaru.",
        "Alokasi menahan stok untuk pekerjaan; pencatatan pemakaian merupakan tindakan terpisah pada prototipe.",
        "Selesaikan produksi setelah kebutuhan tercatat dan kendala diselesaikan. Status produksi tidak menggantikan status pengiriman."
      ],
      important: "Jangan mengganti bahan atau desain otomatis saat stok kurang. Ikuti persetujuan dan aturan penanganan pesanan.",
      target: "../staff/bouquet-production.html", targetLabel: "Buka Buket & Produksi", related: ["stock", "orders"]
    },
    {
      id: "outage", category: "system", title: "Akses & gangguan layanan",
      summary: "Pilih pemulihan sesuai kondisi tanpa mengulang tindakan transaksi secara membabi buta.",
      steps:
      [
        "Periksa apakah pesan menunjukkan sesi berakhir, izin terbatas, halaman hilang atau gangguan layanan.",
        "Jika sesi berakhir, masuk kembali melalui halaman staf. Jika akses ditolak, minta pengelola memeriksa kewenangan Anda.",
        "Setelah gangguan saat menyimpan, periksa hasil tindakan di modul terkait sebelum mengirim permintaan yang sama lagi.",
        "Catat waktu, halaman, langkah dan pesan kesalahan untuk kanal bantuan internal. Jangan menyertakan kata sandi, OTP atau data pelanggan yang tidak diperlukan."
      ],
      important: "Jangan mengubah parameter peran pada URL untuk mencoba mendapatkan akses. Pemeriksaan hak akses aplikasi nyata harus dilakukan server.",
      target: "../staff/staff-status.html?state=unavailable", targetLabel: "Lihat kondisi sistem", related: ["login", "orders"]
    }
  ]
};
