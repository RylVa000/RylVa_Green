"use strict";

// Explicit preview fixtures. No live catalog, rates, account or order service.
window.RylvaCheckoutPreviewData = (() =>
{
  const scenarios =
  {
    normal: "Normal — contoh Figma", loading: "Loading awal", loadError: "Gagal memuat",
    partial: "Data sebagian", empty: "Keranjang kosong", unselected: "Pilihan hilang",
    login: "Perlu masuk", verification: "Verifikasi akun", session: "Sesi berakhir",
    denied: "Akses ditolak", notFound: "Data tidak ditemukan", offline: "Offline",
    maintenance: "Maintenance", rateLimited: "Pembatasan sementara", csrf: "CSRF ditolak",
    unavailable: "Produk nonaktif", stockChanged: "Stok berubah saat submit",
    invalidData: "Harga tidak lengkap", brokenImage: "Gambar gagal", longContent: "Konten panjang",
    perishable: "Mudah Layu — jadwal wajib", mixed: "Campuran tanpa kurir bersama",
    configuration: "Konfigurasi buket", componentUnavailable: "Bahan buket tidak tersedia",
    noAddress: "Belum ada alamat", addressLimit: "Lima alamat", addressPartial: "Wilayah tidak lengkap",
    addressChanged: "Alamat berubah saat submit", addressSaveError: "Gagal simpan alamat",
    addressConflict: "Konflik simpan alamat", addressUncertain: "Simpan alamat timeout",
    noPin: "Koordinat belum ada", mapUnavailable: "Peta tidak tersedia", geocoderPartial: "Geocoder parsial",
    noSlots: "Slot penuh", calendarClosed: "Kalender tutup", cutoffChanged: "Cutoff berubah",
    noCourier: "Area tidak dilayani", courierError: "Kurir gagal dimuat", noEta: "ETA belum tersedia",
    noCod: "COD tidak tersedia", noMethods: "Metode tidak tersedia", methodError: "Layanan bayar terganggu",
    providerUnavailable: "Pilihan bank tidak tersedia", noBankProviders: "Daftar bank kosong",
    priceChanged: "Harga berubah saat submit", quoteError: "Quote gagal", stale: "Quote sudah lama",
    policyChanged: "Kebijakan berubah", orderLimit: "Tiga order menunggu",
    createError: "Order gagal dibuat", uncertain: "Respons order terputus", slowCreate: "Pembuatan lama",
    paymentInitError: "Order dibuat, instruksi bayar gagal", conflict: "Konflik saat submit",
    storageBlocked: "Storage ditolak", cod: "Pesanan COD", success: "Hasil online",
    alreadyCreated: "Order sudah dibuat di tab lain"
  };

  const services = window.RylvaShippingPreviewData.createServices();
  const methods =
  [
    { id: "qris", name: "QRIS", detail: "Pindai melalui aplikasi pembayaran", image: "qris.svg" },
    {
      id: "va", name: "Virtual Account", detail: "Bank BCA", image: "bca.png",
      providers: window.RylvaPaymentProviderCatalog.providersFor("va")
    },
    {
      id: "wallet", name: "E-Wallet", detail: "DANA", image: "dana.png",
      providers: window.RylvaPaymentProviderCatalog.providersFor("wallet")
    },
    { id: "cod", name: "Bayar di tempat", detail: "Bayar saat pesanan diterima", image: "cod.png" }
  ];

  function dateInWib(time = Date.now())
  {
    return new Date(time + 7 * 3600000).toISOString().slice(0, 10);
  }

  function create(scenario)
  {
    const items = window.RylvaCartPreviewData.createItems("allSelected");
    items.forEach((item) =>
    {
      item.handling = "durable";
      item.note = "";
    });
    const address =
    {
      id: "checkout-address-example", label: "Rumah", recipient: "Penerima Contoh",
      recipientPhone: "+6281200000001", street: "Jalan Taman Contoh Nomor 12",
      village: "Kelurahan Contoh", district: "Kecamatan Contoh", city: "Bandung",
      province: "Jawa Barat", postcode: "40123", note: "Pagar hijau", primary: true,
      point: { latitude: -6.9175, longitude: 107.6191 }
    };
    const state =
    {
      items, addresses: [address], addressId: address.id,
      date: "", slot: "", serviceId: "instant", method: scenario === "cod" ? "cod" : "",
      paymentProviderId: null,
      gift: { enabled: false, message: "", from: "", to: "", anonymous: false },
      services: structuredClone(services), methods: structuredClone(methods),
      limits: { perProduct: 20, total: 50, addresses: 5, gift: 200, itemNote: 200 },
      serverNow: Date.now(), revision: 1
    };
    if (["empty", "unselected"].includes(scenario))
    {
      state.items = [];
    }
    if (["perishable", "configuration", "componentUnavailable", "mixed", "noSlots", "calendarClosed", "cutoffChanged"].includes(scenario))
    {
      items[0].handling = "perishable";
    }
    if (["configuration", "componentUnavailable"].includes(scenario))
    {
      items[0].configuration = "Buket kustom: bunga dan pembungkus pilihan — konfigurasi contoh";
      items[0].configurationValid = scenario !== "componentUnavailable";
    }
    if (scenario === "unavailable")
    {
      items[0].available = false;
    }
    if (scenario === "invalidData")
    {
      items[0].price = null;
    }
    if (scenario === "brokenImage")
    {
      items[0].image = "../../assets/images/cart/missing-example.png";
    }
    if (scenario === "longContent")
    {
      items[0].name = "Monstera Deliciosa dengan pilihan pot dan paket perawatan untuk dekorasi ruang keluarga berukuran besar";
      items[0].price = 1250000000;
      address.street = "Jalan Taman Contoh Nomor 12, bangunan di bagian belakang kompleks, pintu masuk melalui gerbang samping dan pos penerima paket";
    }
    if (scenario === "noAddress")
    {
      state.addresses = [];
    }
    if (scenario === "addressLimit")
    {
      state.addresses = Array.from({ length: 5 }, (_, index) =>
      ({ ...structuredClone(address), id: "example-address-" + index, label: index ? "Alamat " + (index + 1) : "Rumah", primary: index === 0 }));
      state.addressId = state.addresses[0].id;
    }
    if (scenario === "addressPartial")
    {
      address.postcode = "";
    }
    if (scenario === "noPin")
    {
      address.point = null;
    }
    if (["mixed", "noCourier"].includes(scenario))
    {
      state.services = [];
    }
    if (scenario === "noCod")
    {
      state.services.forEach((service) => service.cod = false);
    }
    if (scenario === "noEta")
    {
      state.services.forEach((service) => service.eta = "");
    }
    if (["noMethods", "methodError"].includes(scenario))
    {
      state.methods = [];
    }
    if (scenario === "providerUnavailable")
    {
      const provider = state.methods.find((method) => method.id === "va").providers.find((candidate) => candidate.id === "bni");
      provider.available = false;
      provider.unavailableReason = "Bank ini belum tersedia. Pilih bank lain.";
      state.method = "va";
      state.paymentProviderId = "bni";
    }
    if (scenario === "noBankProviders")
    {
      state.methods.find((method) => method.id === "va").providers = [];
    }
    return state;
  }

  return { scenarios, create, dateInWib };
})();
