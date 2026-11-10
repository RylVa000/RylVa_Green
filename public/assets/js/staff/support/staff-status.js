"use strict";

(() =>
{
  const hub = window.staffHub;
  const { node, link, banner } = hub;
  const destinations =
  {
    dashboard: "../staff/admin-dashboard.html",
    orders: "../staff/orders-queue.html",
    products: "../staff/products.html",
    materials: "../staff/production-materials.html"
  };
  const conditions =
  {
    forbidden:
    {
      title: "Akses tidak tersedia", label: "Kondisi 403",
      description: "Halaman atau tindakan ini memerlukan kewenangan yang sesuai.",
      steps: ["Kembali ke ruang kerja yang dapat diakses.", "Minta SuperAdmin memeriksa kewenangan melalui prosedur akun staf.", "Jangan mencoba mengganti peran sendiri melalui alamat halaman."]
    },
    "not-found":
    {
      title: "Halaman tidak ditemukan", label: "Kondisi 404",
      description: "Alamat mungkin berubah atau objek yang dituju sudah tidak tersedia.",
      steps: ["Periksa alamat atau buka kembali halaman dari menu.", "Cari objek melalui daftar pada modul terkait.", "Gunakan bantuan jika tautan yang sama terus bermasalah."]
    },
    "internal-error":
    {
      title: "Terjadi kesalahan sistem",
      label: "Kesalahan 500",
      description: "Halaman belum dapat diproses. Periksa hasil tindakan terakhir sebelum mencoba lagi.",
      steps:
      [
        "Jika gangguan terjadi saat menyimpan, buka daftar atau detail untuk memeriksa apakah perubahan sudah tercatat.",
        "Jangan mengulang pembayaran, refund atau perubahan stok sebelum hasil sebelumnya dipastikan.",
        "Catat halaman, waktu kejadian dan pesan kesalahan untuk penanggung jawab sistem. Jangan sertakan kata sandi atau kode MFA."
      ]
    },
    "rate-limited":
    {
      title: "Terlalu banyak percobaan",
      label: "Batas percobaan 429",
      description: "Percobaan sementara dibatasi. Tunggu petunjuk layanan sebelum mengulang tindakan.",
      steps:
      [
        "Hentikan percobaan berulang dan ikuti waktu tunggu yang diberikan layanan.",
        "Waktu coba lagi belum tersedia pada pratinjau ini. Tidak ada hitung mundur atau pembukaan akses otomatis.",
        "Jika batas tetap muncul setelah waktu tunggu layanan berakhir, gunakan panduan gangguan dan hubungi penanggung jawab melalui kanal internal."
      ]
    },
    unavailable:
    {
      title: "Layanan belum tersedia", label: "Kondisi 503",
      description: "Halaman tujuan belum dapat digunakan. Pilih langkah pemulihan yang sesuai.",
      steps: ["Buka ulang halaman tujuan saat Anda siap mencoba kembali.", "Jika gangguan terjadi saat menyimpan, periksa hasil sebelum mengulang tindakan.", "Catat waktu dan pesan kesalahan untuk penanggung jawab sistem."]
    },
    maintenance:
    {
      title: "Pemeliharaan sistem", label: "Pemeliharaan",
      description: "Layanan yang terdampak perlu ditunggu sampai pemeliharaan selesai.",
      steps: ["Ikuti informasi pemeliharaan melalui kanal internal.", "Jangan mengulang perubahan data selama layanan belum tersedia.", "Waktu selesai tidak ditampilkan sebelum dikonfirmasi penanggung jawab."]
    },
    "session-expired":
    {
      title: "Sesi telah berakhir", label: "Perlu masuk kembali",
      description: "Masuk melalui halaman staf untuk melanjutkan pekerjaan.",
      steps: ["Masuk kembali menggunakan akun staf dan MFA.", "Periksa kembali halaman serta hasil tindakan terakhir.", "Isian yang belum tersimpan perlu dimasukkan ulang jika tidak tersedia."]
    }
  };

  function render()
  {
    const condition = conditions[hub.state.condition];
    hub.heading(condition.title, condition.description);
    hub.demoNote();
    const area = hub.panel("Langkah berikutnya");
    area.append(hub.badge(condition.label, "warning"));
    const steps = node("ol", "support-prose");
    condition.steps.forEach((step) => steps.append(node("li", "", step)));
    area.append(steps);
    if (hub.state.condition === "rate-limited")
    {
      area.append(hub.definition([["Waktu coba lagi", "Belum tersedia dari layanan"]]));
    }
    const controls = node("div", "support-actions");
    if (hub.state.condition === "session-expired")
    {
      controls.append(link("Masuk kembali", "../auth/staff-login.html?view=login", "queue-button queue-button--primary"));
    }
    else if (["unavailable", "internal-error"].includes(hub.state.condition))
    {
      controls.append(link("Coba buka halaman tujuan", destinations[hub.state.destination], "queue-button queue-button--primary"));
    }
    else
    {
      controls.append(link("Kembali ke ruang kerja", destinations.dashboard, "queue-button queue-button--primary"));
    }
    controls.append(link("Buka bantuan", "../staff/staff-help.html?article=outage"));
    area.append(controls);
    hub.root.append(area, banner("Kondisi pratinjau", "Pilihan di bawah hanya menampilkan desain kondisi sistem. Tidak memeriksa ketersediaan layanan atau memberi izin akses."));
  }

  hub.start(render);
})();
