"use strict";

(() =>
{
  function field(key, label, value, unit = "", options = {})
  {
    return {
      key,
      label,
      value,
      unit,
      type: "number",
      min: 1,
      step: 1,
      ...options
    };
  }

  const groups =
  [
    {
      id: "payment",
      label: "Checkout & pembayaran",
      icon: "orders",
      description: "Batas belanja, pembayaran, dan reservasi stok."
    },
    {
      id: "shipping",
      label: "Toko & pengiriman",
      icon: "truck",
      description: "Jam toko, slot kirim, dan waktu persiapan."
    },
    {
      id: "resolution",
      label: "Penanganan & refund",
      icon: "help",
      description: "Tenggat komplain, penanganan, dan pengembalian dana."
    },
    {
      id: "stock",
      label: "Stok & harga",
      icon: "layers",
      description: "Peringatan stok dan batas tindakan operasional."
    },
    {
      id: "security",
      label: "Akun & keamanan",
      icon: "shield",
      description: "Kebijakan login, sesi, bukti, dan unggahan."
    },
    {
      id: "privacy",
      label: "Privasi & retensi",
      icon: "audit",
      description: "Masa penyimpanan data dan anonimisasi akun."
    },
    {
      id: "service",
      label: "Layanan & infrastruktur",
      icon: "settings",
      description: "Target layanan serta kebijakan teknis yang ditinjau."
    }
  ];

  function parameter(code, key, group, name, description, fields, options = {})
  {
    return {
      code,
      key,
      group,
      name,
      description,
      fields,
      sensitive: ["payment", "resolution", "security", "privacy", "service"].includes(group),
      review: ["payment", "resolution", "security", "privacy", "service"].includes(group),
      readonly: false,
      effect: "Dampak penerapan perlu ditetapkan sesuai kebijakan dan diuji pada layanan yang menggunakan parameter ini.",
      ...options
    };
  }

  const parameters =
  [
    parameter(
      "P-01",
      "payment.window_minutes",
      "payment",
      "Batas waktu pembayaran",
      "Batas bayar default sejak pesanan dibuat. Metode dengan jendela khusus tetap mengikuti P-40.",
      [
        field("minutes", "Batas pembayaran default", 60, "menit")
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Batas bayar default untuk pesanan baru. Batas yang sudah tersimpan tidak diatur ulang; metode dengan " +
        "jendela khusus mengikuti P-40 dan hasil verifikasi gateway."
      }
    ),
    parameter(
      "P-02",
      "payment.expiry_grace_minutes",
      "payment",
      "Toleransi sinkronisasi kedaluwarsa",
      "Waktu pemeriksaan ke gateway sebelum menutup pesanan. Jangan melepas stok saat hasil pembayaran belum " +
      "pasti.",
      [
        field(
          "minutes",
          "Toleransi sinkronisasi",
          5,
          "menit",
          {
            min: 0
          }
        )
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Mengatur waktu pemeriksaan gateway sebelum penutupan pesanan. Penerapan terhadap pemeriksaan yang " +
        "sudah berjalan harus ditetapkan pada layanan pembayaran; perubahan ini tidak mengonfirmasi pembayaran."
      }
    ),
    parameter(
      "P-03",
      "payment.max_attempts_per_order",
      "payment",
      "Percobaan pembayaran",
      "Jumlah maksimum percobaan pembayaran untuk satu pesanan, terkait pembatasan RL-10.",
      [
        field("attempts", "Percobaan per pesanan", 5, "kali")
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Membatasi pembuatan percobaan pembayaran berikutnya, terkait RL-10. Percobaan lama tidak dihapus; " +
        "perlakuan pesanan aktif perlu ditetapkan pada validasi server."
      }
    ),
    parameter(
      "P-04",
      "order.max_pending_per_account",
      "payment",
      "Pesanan menunggu pembayaran",
      "Membatasi pesanan aktif berstatus Menunggu Pembayaran pada satu akun pelanggan.",
      [
        field("orders", "Pesanan per akun", 3, "pesanan")
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Diperiksa saat pembuatan pesanan berikutnya. Menurunkan batas tidak membatalkan pesanan tertunda yang " +
        "sudah ada; pelanggan menunggu sampai jumlahnya memenuhi batas."
      }
    ),
    parameter(
      "P-05",
      "cart.max_qty_limits",
      "payment",
      "Batas kuantitas belanja",
      "Batas per produk tidak boleh lebih besar daripada batas total dalam satu pesanan.",
      [
        field("perProduct", "Per produk dalam satu pesanan", 20, "unit"),
        field("perOrder", "Total dalam satu pesanan", 50, "unit")
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Batas kuantitas diperiksa pada keranjang dan checkout. Pesanan yang sudah terbentuk tetap memakai " +
        "snapshot item; perubahan ini tidak mengubah kuantitas pesanannya."
      }
    ),
    parameter(
      "P-06",
      "shipping.min_lead_time",
      "shipping",
      "Waktu persiapan pengiriman",
      "Produk Mudah Layu membutuhkan waktu sebelum awal slot. Produk Tahan Lama paling cepat dikirim H+1.",
      [
        field("perishableHours", "Mudah Layu, sebelum awal slot", 4, "jam"),
        field("durableDays", "Tahan Lama, setelah pemesanan", 1, "hari")
      ],
      {
        sensitive: false,
        review: true,
        readonly: false,
        effect: "Menentukan pilihan tanggal dan slot pada checkout baru. Perlu diselaraskan dengan lead time pada tabel " +
        "slot; pesanan terjadwal tidak dipindahkan otomatis."
      }
    ),
    parameter(
      "P-07",
      "shipping.max_advance_days",
      "shipping",
      "Batas pemesanan di muka",
      "Tanggal pengiriman paling jauh dari tanggal pemesanan, tetap mengikuti kalender tutup.",
      [
        field("days", "Pemesanan di muka", 30, "hari")
      ],
      {
        sensitive: false,
        review: false,
        readonly: false,
        effect: "Membatasi tanggal kirim yang ditawarkan pada checkout baru. Pesanan terjadwal tetap mengikuti tanggal " +
        "yang telah disepakati dan kalender tutup yang berlaku."
      }
    ),
    parameter(
      "P-08",
      "shipping.delivery_slots_wib",
      "shipping",
      "Slot pengiriman",
      "Tiga slot tetap menggunakan kode Pagi, Siang, dan Sore. Slot harus berurutan, tidak tumpang tindih, dan " +
      "berada dalam jam toko.",
      [
        field(
          "morningStart",
          "Pagi mulai",
          "08:00",
          "WIB",
          {
            type: "time"
          }
        ),
        field(
          "morningEnd",
          "Pagi selesai",
          "12:00",
          "WIB",
          {
            type: "time"
          }
        ),
        field(
          "afternoonStart",
          "Siang mulai",
          "12:00",
          "WIB",
          {
            type: "time"
          }
        ),
        field(
          "afternoonEnd",
          "Siang selesai",
          "16:00",
          "WIB",
          {
            type: "time"
          }
        ),
        field(
          "eveningStart",
          "Sore mulai",
          "16:00",
          "WIB",
          {
            type: "time"
          }
        ),
        field(
          "eveningEnd",
          "Sore selesai",
          "20:00",
          "WIB",
          {
            type: "time"
          }
        )
      ],
      {
        sensitive: false,
        review: true,
        readonly: false,
        effect: "Jadwal baru perlu diselaraskan dengan tabel slot. Pesanan yang sudah memilih slot tidak dipindahkan " +
        "otomatis; perubahan jadwalnya memakai alur pesanan."
      }
    ),
    parameter(
      "P-09",
      "store.operating_hours_wib",
      "shipping",
      "Jam operasional toko",
      "Jam operasional harian dalam WIB. Tanggal libur atau penutupan khusus dikelola di Kalender Tutup.",
      [
        field(
          "open",
          "Jam buka",
          "08:00",
          "WIB",
          {
            type: "time"
          }
        ),
        field(
          "close",
          "Jam tutup",
          "20:00",
          "WIB",
          {
            type: "time"
          }
        )
      ],
      {
        sensitive: false,
        review: true,
        readonly: false,
        effect: "Jam toko dipakai untuk pilihan jadwal dan perhitungan jam operasional penanganan. Dampaknya pada " +
        "tenggat berjalan harus ditetapkan dan diuji; tanggal libur tetap di Kalender Tutup.",
        related: "../staff/closure-calendar.html",
        relatedLabel: "Buka Kalender Tutup"
      }
    ),
    parameter(
      "P-10",
      "order.card_message_max_length",
      "shipping",
      "Pesan kartu ucapan",
      "Teks biasa. Kapasitas kolom saat ini 200 karakter; menambah kapasitas memerlukan perubahan database.",
      [
        field(
          "characters",
          "Panjang maksimum",
          200,
          "karakter",
          {
            max: 200
          }
        )
      ],
      {
        sensitive: false,
        review: false,
        readonly: false,
        effect: "Membatasi masukan kartu ucapan berikutnya sesuai kapasitas database. Pesan yang sudah menjadi snapshot " +
        "pesanan tidak dipotong atau ditulis ulang."
      }
    ),
    parameter(
      "P-11",
      "complaint.window_hours",
      "resolution",
      "Jendela pengajuan komplain",
      "Dihitung sejak pesanan berstatus Terkirim; digunakan pula dalam penyelesaian otomatis tanpa komplain " +
      "terbuka.",
      [
        field("hours", "Waktu pengajuan", 24, "jam")
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Mengatur jendela komplain dan penyelesaian otomatis. Penerapannya pada kiriman yang sudah Terkirim " +
        "harus ditetapkan di server; komplain terbuka tidak ditutup oleh perubahan ini."
      }
    ),
    parameter(
      "P-12",
      "complaint.first_response_hours",
      "resolution",
      "Respons pertama komplain",
      "Target waktu respons pertama staf sejak komplain diajukan.",
      [
        field("hours", "Respons pertama maksimal", 24, "jam")
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Target respons staf sejak komplain diajukan. Perlakuan tenggat komplain yang sudah terbuka perlu " +
        "ditetapkan; perubahan target tidak mengirim respons kepada pelanggan."
      }
    ),
    parameter(
      "P-13",
      "shipping.lost_investigation_workdays",
      "resolution",
      "Investigasi barang hilang",
      "Target investigasi bersama kurir menggunakan hari kerja, bukan hari kalender.",
      [
        field("workdays", "Investigasi maksimal", 3, "hari kerja")
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Target investigasi bersama kurir menggunakan hari kerja. Kalender kerja dan perlakuan investigasi " +
        "berjalan harus ditetapkan sebelum integrasi produksi."
      }
    ),
    parameter(
      "P-14",
      "shipping.perishable_redelivery_max",
      "resolution",
      "Kirim ulang produk Mudah Layu",
      "Baseline memperbolehkan paling banyak satu pengiriman ulang pada hari yang sama.",
      [
        field(
          "attempts",
          "Percobaan kirim ulang",
          1,
          "kali",
          {
            min: 0,
            max: 1
          }
        ),
        field(
          "sameDay",
          "Wajib pada hari yang sama",
          true,
          "",
          {
            type: "boolean",
            fixed: true
          }
        )
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Batas keputusan pengiriman ulang produk Mudah Layu. Tidak membuat pengiriman otomatis; kelayakan, hari " +
        "yang sama, tanggung jawab, dan bukti tetap mengikuti alur kasus."
      }
    ),
    parameter(
      "P-15",
      "order.ph_initial_action_hours",
      "resolution",
      "Mulai penanganan pesanan",
      "Waktu tindakan awal pada status Perlu Penanganan dihitung dalam jam operasional toko.",
      [
        field("hours", "Tindakan awal maksimal", 2, "jam operasional")
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Target tindakan awal dihitung dalam jam operasional toko. Hubungannya dengan P-09 dan tenggat " +
        "penanganan yang sudah berjalan harus ditetapkan dan diuji pada server."
      }
    ),
    parameter(
      "P-16",
      "order.ph_customer_response_hours",
      "resolution",
      "Respons pelanggan atas penyelesaian",
      "Tenggat keputusan sebelum refund otomatis sesuai jenis kasus. Cakupan kode PH perlu diselaraskan sebelum " +
      "produksi.",
      [
        field("hours", "Respons pelanggan maksimal", 24, "jam"),
        field(
          "autoRefund",
          "Refund penuh saat melewati tenggat",
          true,
          "",
          {
            type: "boolean",
            fixed: true
          }
        )
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Pemetaan PH-01/02/04/05/06 tidak sepenuhnya seragam pada dokumen. Produksi memerlukan aturan per " +
        "kasus, tanpa mengubah tenggat lama secara diam-diam."
      }
    ),
    parameter(
      "P-17",
      "complaint.appeal_limit",
      "resolution",
      "Banding penolakan komplain",
      "Banding hanya diputuskan SuperAdmin, setelah penolakan Admin.",
      [
        field(
          "appeals",
          "Jumlah banding",
          1,
          "kali",
          {
            max: 1
          }
        ),
        field("hours", "Jendela sejak penolakan", 24, "jam")
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Mengatur batas banding sejak penolakan komplain. Tenggat dan hak banding kasus yang sudah berjalan " +
        "harus ditetapkan; keputusan banding tetap khusus SuperAdmin."
      }
    ),
    parameter(
      "P-18",
      "refund.admin_approval_max_idr",
      "resolution",
      "Batas persetujuan refund Admin",
      "Di atas batas ini wajib SuperAdmin. Pengaju tetap tidak boleh menyetujui refund sendiri.",
      [
        field(
          "rupiah",
          "Batas nominal per permintaan",
          500000,
          "rupiah",
          {
            min: 0
          }
        )
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Batas kewenangan pada keputusan refund berikutnya. Keputusan lama tidak ditulis ulang; larangan " +
        "menyetujui pengajuan sendiri tetap berlaku pada setiap nominal."
      }
    ),
    parameter(
      "P-19",
      "refund.processing_target_workdays",
      "resolution",
      "Target pemrosesan refund",
      "Sejak refund disetujui. Waktu dana masuk tetap bergantung pada penyedia pembayaran.",
      [
        field("workdays", "Pemrosesan maksimal", 3, "hari kerja")
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Target sejak refund disetujui, bukan janji kapan dana masuk. Tenggat refund berjalan perlu ditetapkan " +
        "di layanan refund; perubahan target tidak menjalankan transfer dana."
      }
    ),
    parameter(
      "P-20",
      "refund.auto_retry_policy",
      "resolution",
      "Percobaan ulang refund gagal",
      "Setelah batas percobaan tercapai dalam jendela ini, refund masuk antrean manual.",
      [
        field("attempts", "Percobaan otomatis", 3, "kali"),
        field("hours", "Jendela percobaan", 24, "jam")
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Kebijakan percobaan ulang refund oleh pekerjaan terjadwal. Penghitung percobaan lama tidak dihapus; " +
        "perlakuan antrean yang sudah berjalan perlu ditetapkan sebelum produksi."
      }
    ),
    parameter(
      "P-21",
      "refund.bank_info_retention_days",
      "privacy",
      "Retensi rekening refund",
      "Data rekening atau e-wallet dihapus setelah refund berhasil dan masa retensi berakhir.",
      [
        field("days", "Retensi setelah refund berhasil", 30, "hari")
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Perubahan retensi memerlukan review kebijakan dan pengujian proses penghapusan. Halaman ini tidak " +
        "menjalankan penghapusan data rekening atau e-wallet."
      }
    ),
    parameter(
      "P-22",
      "stock.low_threshold_units",
      "stock",
      "Ambang stok rendah",
      "Peringatan berlaku ketika stok kurang dari atau sama dengan ambang. Satuan jual produk tetap ditampilkan " +
      "pada modul stok.",
      [
        field(
          "units",
          "Stok rendah pada atau di bawah",
          5,
          "unit",
          {
            min: 0
          }
        )
      ],
      {
        sensitive: false,
        review: false,
        readonly: false,
        effect: "Mengubah ambang peringatan; tidak mengubah saldo stok produk atau bahan produksi. Integrasi peringatan " +
        "mengikuti pembacaan stok pada modul terkait."
      }
    ),
    parameter(
      "P-23",
      "stock.admin_adjustment_max_units",
      "stock",
      "Batas penyesuaian stok Admin",
      "Penyesuaian di atas batas ini memerlukan persetujuan SuperAdmin. Alasan dan audit tetap wajib.",
      [
        field(
          "units",
          "Penyesuaian per tindakan",
          20,
          "unit",
          {
            min: 0
          }
        )
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Batas kewenangan untuk penyesuaian stok berikutnya. Catatan mutasi lama tetap utuh; tindakan di atas " +
        "batas memerlukan persetujuan SuperAdmin dan alasan."
      }
    ),
    parameter(
      "P-24",
      "catalog.price_change_confirm_pct",
      "stock",
      "Konfirmasi perubahan harga",
      "Perubahan lebih dari persentase ini memicu konfirmasi tambahan dan peringatan. Harga pesanan lama tetap " +
      "berupa snapshot.",
      [
        field(
          "percent",
          "Perubahan terhadap harga sebelumnya",
          50,
          "%",
          {
            min: 0
          }
        )
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Memicu konfirmasi tambahan pada perubahan harga berikutnya. Tidak mengubah harga otomatis atau " +
        "snapshot total pesanan yang sudah dibuat."
      }
    ),
    parameter(
      "P-25",
      "cart.retention_days",
      "payment",
      "Retensi keranjang belanja",
      "Keranjang tamu disimpan di browser; keranjang akun mengikuti waktu tanpa aktivitas.",
      [
        field("guestDays", "Keranjang tamu", 7, "hari"),
        field("accountDays", "Keranjang akun tanpa aktivitas", 30, "hari")
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Retensi keranjang tamu di browser dan keranjang akun tanpa aktivitas. Perlakuan keranjang yang sudah " +
        "ada perlu ditetapkan; pesanan tidak terhapus karena perubahan retensi keranjang."
      }
    ),
    parameter(
      "P-26",
      "account.max_saved_addresses",
      "payment",
      "Alamat tersimpan",
      "Batas alamat aktif per akun pelanggan. Menurunkan batas tidak menghapus alamat lama dari halaman ini.",
      [
        field("addresses", "Alamat aktif per akun", 5, "alamat")
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Batas penyimpanan alamat aktif berikutnya. Menurunkan batas tidak menghapus alamat lama atau snapshot " +
        "alamat pada pesanan; penanganan akun di atas batas perlu diatur di server."
      }
    ),
    parameter(
      "P-27",
      "evidence.photo_count_limits",
      "security",
      "Jumlah foto bukti",
      "Komplain membutuhkan bukti dalam rentang yang ditetapkan. Serah kurir Mudah Layu wajib minimal satu " +
      "foto.",
      [
        field("complaintMin", "Foto komplain minimum", 2, "foto"),
        field(
          "complaintMax",
          "Foto komplain maksimum",
          5,
          "foto",
          {
            max: 5
          }
        ),
        field("handoffMin", "Foto serah kurir minimum", 1, "foto")
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Batas bukti pada pengajuan komplain dan serah kurir berikutnya, terkait P-42. Bukti yang sudah " +
        "tersimpan tidak dihapus atau diubah oleh pengaturan ini."
      }
    ),
    parameter(
      "P-28",
      "auth.password_min_length",
      "security",
      "Kebijakan kata sandi",
      "Kata sandi umum atau bocor ditolak. Maksimum 128 karakter, tanpa menyimpan atau menampilkan kata sandi " +
      "pengguna.",
      [
        field(
          "customerMin",
          "Minimum pelanggan",
          8,
          "karakter",
          {
            min: 8,
            max: 128
          }
        ),
        field(
          "staffMin",
          "Minimum Admin dan SuperAdmin",
          12,
          "karakter",
          {
            min: 12,
            max: 128
          }
        ),
        field(
          "maximum",
          "Panjang maksimum",
          128,
          "karakter",
          {
            fixed: true
          }
        )
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Validasi kata sandi saat pendaftaran, aktivasi, perubahan, atau pemulihan akun. Perlakuan kata sandi " +
        "lama perlu kebijakan server; halaman ini tidak mengganti kata sandi pengguna."
      }
    ),
    parameter(
      "P-29",
      "auth.verification_code_policy",
      "security",
      "Kode verifikasi email",
      "Kode baru membatalkan kode lama. Format enam digit dikunci agar selaras dengan alur verifikasi.",
      [
        field(
          "digits",
          "Jumlah digit",
          6,
          "digit",
          {
            fixed: true
          }
        ),
        field("minutes", "Masa berlaku", 10, "menit"),
        field(
          "wrongAttempts",
          "Maksimum kode salah",
          5,
          "kali",
          {
            max: 5
          }
        ),
        field(
          "resendSeconds",
          "Jeda kirim ulang",
          60,
          "detik",
          {
            min: 60
          }
        ),
        field(
          "perHour",
          "Pengiriman per jam",
          5,
          "kali",
          {
            max: 5
          }
        )
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Kebijakan penerbitan dan pemeriksaan kode verifikasi email. Kode baru membatalkan kode lama; masa " +
        "berlaku kode yang sudah diterbitkan harus mengikuti aturan server yang ditetapkan."
      }
    ),
    parameter(
      "P-30",
      "auth.password_reset_token_minutes",
      "security",
      "Token pemulihan kata sandi",
      "Token sekali pakai. Pemulihan akun mengikuti alur pemilik akun, bukan perubahan kata sandi oleh staf.",
      [
        field("minutes", "Masa berlaku token", 15, "menit"),
        field(
          "singleUse",
          "Wajib sekali pakai",
          true,
          "",
          {
            type: "boolean",
            fixed: true
          }
        )
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Masa berlaku token pemulihan saat diterbitkan dan aturan sekali pakai. Token yang sudah ada perlu " +
        "mengikuti tenggat tersimpannya; halaman ini tidak menerbitkan token atau mereset akun."
      }
    ),
    parameter(
      "P-31",
      "auth.login_lockout_policy",
      "security",
      "Pembatasan login pelanggan",
      "Per akun dan IP diperiksa terpisah. Kebijakan khusus login staf tersedia pada P-41 / RL-02.",
      [
        field(
          "failures",
          "Kegagalan per akun",
          5,
          "kali",
          {
            max: 5
          }
        ),
        field("windowMinutes", "Jendela penghitungan", 15, "menit"),
        field("lockMinutes", "Penundaan login", 15, "menit"),
        field(
          "captchaAt",
          "CAPTCHA mulai kegagalan",
          3,
          "ke",
          {
            max: 5
          }
        )
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Batas login pelanggan per akun dan IP, terkait P-41. Penghitung kegagalan dan penguncian aktif tidak " +
        "boleh direset diam-diam; penerapan perubahan perlu diuji di server."
      }
    ),
    parameter(
      "P-32",
      "auth.session_lifetime",
      "security",
      "Masa berlaku sesi",
      "Batas idle dan durasi absolut berlaku terpisah. Perubahan sesi perlu pengujian pencabutan dan " +
      "penyesuaian pengguna aktif.",
      [
        field("customerIdleDays", "Pelanggan tanpa aktivitas", 14, "hari"),
        field("adminIdleMinutes", "Admin tanpa aktivitas", 30, "menit"),
        field("adminAbsoluteHours", "Admin maksimum", 8, "jam"),
        field("superadminIdleMinutes", "SuperAdmin tanpa aktivitas", 15, "menit"),
        field("superadminAbsoluteHours", "SuperAdmin maksimum", 4, "jam")
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Kebijakan idle dan durasi absolut per peran. Perlakuan sesi yang sudah aktif harus ditetapkan dan " +
        "diuji di server; menyimpan contoh ini tidak mencabut sesi."
      }
    ),
    parameter(
      "P-33",
      "auth.admin_activation_link_hours",
      "security",
      "Tautan aktivasi Admin",
      "Admin menetapkan kata sandi dan mendaftarkan MFA melalui tautan aktivasi. Tidak ada kata sandi awal yang " +
      "dikirim.",
      [
        field("hours", "Masa berlaku tautan", 24, "jam"),
        field(
          "singleUse",
          "Wajib sekali pakai",
          true,
          "",
          {
            type: "boolean",
            fixed: true
          }
        )
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Masa berlaku tautan aktivasi Admin saat diterbitkan. Tautan tetap sekali pakai; perlakuan tautan yang " +
        "sudah terbit mengikuti tenggat tersimpan dan alur penerbitan ulang."
      }
    ),
    parameter(
      "P-34",
      "retention.transaction_audit_years",
      "privacy",
      "Retensi transaksi dan audit terkait",
      "Baseline proyek sepuluh tahun. Kewajiban retensi harus diverifikasi operator sebelum produksi.",
      [
        field("years", "Retensi transaksi", 10, "tahun")
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Kebijakan retensi transaksi dan audit terkait memerlukan verifikasi kewajiban serta legal hold. Tidak " +
        "menghapus transaksi; pelaksanaan retensi harus melalui proses terkontrol yang terpisah."
      }
    ),
    parameter(
      "P-35",
      "retention.non_transaction_audit_years",
      "privacy",
      "Retensi audit nontransaksi",
      "Mencakup audit akses, akun, dan perubahan konfigurasi; berbeda dari log aplikasi biasa.",
      [
        field("years", "Retensi audit nontransaksi", 5, "tahun")
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Retensi audit akses, akun, dan konfigurasi. Append-only tetap berlaku; halaman ini tidak menghapus " +
        "catatan. Review kebijakan dan proses retensi server diperlukan sebelum produksi."
      }
    ),
    parameter(
      "P-36",
      "retention.inactive_customer_months",
      "privacy",
      "Anonimisasi akun tidak aktif",
      "Hanya akun tanpa login dan tanpa pesanan aktif. Pemberitahuan dikirim sebelum anonimisasi.",
      [
        field("inactiveMonths", "Tanpa aktivitas", 24, "bulan"),
        field("noticeDays", "Pemberitahuan sebelumnya", 30, "hari")
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Kebijakan anonimisasi akun tanpa aktivitas dan tanpa pesanan aktif, beserta pemberitahuan sebelumnya. " +
        "Akun yang sudah ada memerlukan evaluasi dan antrean server; perubahan ini tidak menjalankan " +
        "anonimisasi."
      }
    ),
    parameter(
      "P-37",
      "nfr.availability_target_pct",
      "service",
      "Target ketersediaan layanan",
      "Di luar pemeliharaan terjadwal. Nilai ini adalah target, bukan bukti ketersediaan yang sudah tercapai.",
      [
        field(
          "percent",
          "Target bulanan",
          99.5,
          "%",
          {
            step: 0.1,
            max: 100
          }
        )
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Target ketersediaan bulanan di luar pemeliharaan terjadwal. Mengubah angka tidak meningkatkan " +
        "ketersediaan otomatis dan tidak menyatakan target telah tercapai; perlu pemantauan layanan."
      }
    ),
    parameter(
      "P-38",
      "nfr.recovery_targets",
      "service",
      "Target pemulihan data",
      "RPO adalah toleransi kehilangan data; RTO adalah waktu pemulihan layanan. Mengubah target tidak membuat " +
      "backup otomatis.",
      [
        field("rpoHours", "RPO maksimum", 1, "jam"),
        field("rtoHours", "RTO maksimum", 4, "jam")
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Target kehilangan data dan waktu pemulihan untuk rencana backup serta uji restore. Tidak mengubah " +
        "jadwal backup atau memulihkan data; penerapannya membutuhkan pekerjaan operasional terpisah."
      }
    ),
    parameter(
      "P-39",
      "nfr.catalog_lcp_seconds",
      "service",
      "Target kecepatan katalog",
      "Target konten utama tampil pada jaringan 4G. Pencapaiannya memerlukan pengukuran dan optimasi terpisah.",
      [
        field(
          "seconds",
          "Konten utama tampil dalam",
          2.5,
          "detik",
          {
            min: 0.1,
            step: 0.1
          }
        )
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Target waktu tampil konten utama katalog pada jaringan 4G. Mengubah target tidak mempercepat halaman; " +
        "pencapaiannya perlu pengukuran dan optimasi yang dibuktikan."
      }
    ),
    parameter(
      "P-40",
      "stock.reservation_window_by_method",
      "payment",
      "Reservasi stok per metode",
      "Jendela khusus setiap metode pembayaran. Nilai harus sesuai kemampuan dan kedaluwarsa resmi gateway " +
      "sebelum produksi.",
      [
        field("qris", "QRIS", 10, "menit"),
        field("wallet", "E-wallet", 10, "menit"),
        field("transfer", "Transfer bank", 15, "menit"),
        field("virtualAccount", "Virtual account", 30, "menit"),
        field("card", "Kartu kredit / debit", 15, "menit"),
        field(
          "cod",
          "COD, langsung komit setelah validasi",
          0,
          "menit",
          {
            min: 0,
            fixed: true
          }
        )
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Nilai VA 30 menit dan kartu 15 menit berasal dari seed awal, perlu verifikasi vendor. COD tetap Siap " +
        "Diproses dengan pembayaran Menunggu sampai uang diterima; reservasi berjalan mengikuti tenggat " +
        "tersimpan."
      }
    ),
    parameter(
      "P-41",
      "security.rate_limits_config",
      "security",
      "Pembatasan permintaan",
      "Seluruh RL-01–RL-15 dari bagian 15.3. Penghitung akun dan IP terpisah; kegagalan penyimpanan menutup " +
      "endpoint autentikasi dan aksi staf.",
      [
        field("customerIp15m", "RL-01: login pelanggan per IP / 15 menit", 20, "gagal"),
        field(
          "staffAccount15m",
          "RL-02: login staf per akun / 15 menit",
          5,
          "gagal",
          {
            max: 5
          }
        ),
        field("staffIp15m", "RL-02: login staf per IP / 15 menit", 10, "gagal"),
        field(
          "mfaAttempts",
          "RL-02: MFA per percobaan login",
          5,
          "gagal",
          {
            max: 5
          }
        ),
        field("staffLockMinutes", "RL-02: penundaan login staf", 30, "menit"),
        field(
          "staffCaptchaAt",
          "RL-02: CAPTCHA mulai kegagalan",
          2,
          "ke",
          {
            max: 5
          }
        ),
        field("registerHour", "RL-03: registrasi per IP / jam", 5, "permintaan"),
        field("registerDay", "RL-03: registrasi per IP / hari", 20, "permintaan"),
        field("verifyIpHour", "RL-04: kirim kode per IP / jam", 10, "permintaan"),
        field("resetEmailHour", "RL-05: pemulihan per email / jam", 3, "permintaan"),
        field("resetIpHour", "RL-05: pemulihan per IP / jam", 10, "permintaan"),
        field(
          "tokenAttempts",
          "RL-06: percobaan per token",
          5,
          "kali",
          {
            max: 5
          }
        ),
        field("searchMinute", "RL-07: pencarian per IP / menit", 30, "permintaan"),
        field("cartMinute", "RL-08: keranjang per sesi dan IP / menit", 60, "permintaan"),
        field("checkoutHour", "RL-09: checkout per akun / jam", 10, "permintaan"),
        field("paymentHour", "RL-10: pembayaran per akun / jam", 10, "permintaan"),
        field("complaintHour", "RL-11: pembatalan dan komplain / jam", 10, "permintaan"),
        field("uploadHour", "RL-12: unggah per akun / jam", 20, "permintaan"),
        field("staffMinute", "RL-13: aksi sensitif per staf / menit", 30, "tindakan"),
        field("exportHour", "RL-13: ekspor per staf / jam", 5, "ekspor"),
        field("webhookMinute", "RL-14: webhook per IP / menit", 120, "permintaan"),
        field("globalMinute", "RL-15: halaman dinamis per IP / menit", 300, "permintaan")
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "RL-01 per akun mengikuti P-31; RL-04 per akun mengikuti P-29; RL-09 dibatasi P-04; RL-10 per pesanan " +
        "mengikuti P-03. Penerapan penghitung aktif perlu diuji; webhook tetap wajib diverifikasi.",
        linked: [
          "P-29",
          "P-31",
          "P-03",
          "P-04"
        ]
      }
    ),
    parameter(
      "P-42",
      "security.upload_limits",
      "security",
      "Batas unggahan berkas",
      "JPEG, PNG, dan WebP diperiksa dari isi. Batas aplikasi wajib selaras dengan PHP dan web server.",
      [
        field(
          "fileMb",
          "Ukuran maksimum per berkas",
          5,
          "MB",
          {
            max: 5
          }
        ),
        field(
          "complaintFiles",
          "Berkas per komplain",
          5,
          "berkas",
          {
            max: 5
          }
        ),
        field(
          "dimensionPx",
          "Lebar dan tinggi maksimum",
          4000,
          "piksel",
          {
            max: 4000
          }
        ),
        field(
          "requestMb",
          "Batas total request server",
          8,
          "MB",
          {
            fixed: true
          }
        )
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Batas request 8 MB hanya baca dan mengikuti konfigurasi server. Lima berkas berukuran 5 MB harus " +
        "diunggah bertahap; satu request tetap harus berada dalam batas server."
      }
    ),
    parameter(
      "P-43",
      "retention.security_and_app_logs",
      "privacy",
      "Retensi log aplikasi dan keamanan",
      "Log teknis berbeda dari Audit Log. Retensi audit tetap mengikuti P-34 dan P-35.",
      [
        field("applicationDays", "Log aplikasi", 90, "hari"),
        field("securityMonths", "Log keamanan", 12, "bulan")
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Retensi log aplikasi dan keamanan teknis, terpisah dari Audit Log P-34/P-35. Perubahan memerlukan " +
        "review serta pekerjaan retensi server; halaman ini tidak menghapus log."
      }
    ),
    parameter(
      "P-44",
      "auth.max_concurrent_sessions",
      "security",
      "Sesi aktif bersamaan",
      "Sesi tertua dicabut saat batas terlampaui. Pengujian wajib mencakup pencabutan sesi per peran.",
      [
        field("customer", "Pelanggan", 5, "sesi"),
        field("admin", "Admin", 2, "sesi"),
        field("superadmin", "SuperAdmin", 2, "sesi")
      ],
      {
        sensitive: true,
        review: true,
        readonly: false,
        effect: "Batas sesi aktif bersamaan per peran. Saat batas terlampaui, sesi tertua harus dicabut oleh server; " +
        "perlakuan sesi yang sudah aktif perlu ditetapkan dan diuji sebelum produksi."
      }
    ),
    parameter(
      "P-45",
      "infra.scale_out_triggers",
      "service",
      "Pemicu peningkatan kapasitas",
      "Keputusan arsitektur ditinjau pengembang dan klien. Nilai ini tidak diubah melalui editor operasional.",
      [
        field("cpuPercent", "CPU rata-rata di atas", 70, "%"),
        field("cpuMinutes", "Durasi berulang pada jam sibuk", 15, "menit"),
        field("p95Seconds", "p95 respons di atas", 1, "detik"),
        field(
          "workerSaturation",
          "Worker PHP-FPM penuh berulang",
          true,
          "",
          {
            type: "boolean"
          }
        )
      ],
      {
        sensitive: true,
        review: true,
        readonly: true,
        effect: "Hanya baca. Pemicu untuk review arsitektur oleh pengembang dan klien melalui ADR, bukan aturan " +
        "transaksi. Tidak menambah server, mengubah infrastruktur, atau diterapkan oleh editor operasional.",
        owner: "Pengembang dan klien"
      }
    ),
    parameter(
      "P-46",
      "security.patch_sla_days",
      "service",
      "Target pembaruan keamanan",
      "Tanggung jawab pengembang sejak perbaikan tersedia. Memerlukan pekerjaan pemeliharaan dan bukti " +
      "pengujian rilis.",
      [
        field("criticalDays", "Kerentanan kritis maksimal", 7, "hari"),
        field("highDays", "Kerentanan tinggi maksimal", 14, "hari")
      ],
      {
        sensitive: true,
        review: true,
        readonly: true,
        effect: "Hanya baca. Target pemeliharaan keamanan milik pengembang sejak perbaikan tersedia. Tidak memasang " +
        "pembaruan otomatis atau diterapkan oleh editor operasional; pelaksanaan dan hasil uji rilis dicatat " +
        "terpisah.",
        owner: "Pengembang"
      }
    )
  ];

  parameters.forEach((item) =>
  {
    item.fields.forEach(Object.freeze);
    Object.freeze(item.fields);
    Object.freeze(item);
  });

  window.systemParameterData = Object.freeze(
  {
    groups: Object.freeze(groups.map(Object.freeze)),
    parameters: Object.freeze(parameters)
  });
})();
