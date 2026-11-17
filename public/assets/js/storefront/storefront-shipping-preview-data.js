"use strict";

// Shared example rates for the Detail and Checkout previews. No courier request.
window.RylvaShippingPreviewData = (() =>
{
  const services =
  [
    {
      id: "instant",
      name: "Gosend Instant",
      kind: "instant",
      price: 25000,
      eta: "Estimasi tiba 2–4 jam",
      cod: true
    },
    {
      id: "sameDay",
      name: "Kurir same-day",
      kind: "sameDay",
      price: 20000,
      eta: "Dikirim pada jadwal yang dipilih",
      cod: true
    },
    {
      id: "regular",
      name: "Ekspedisi reguler",
      kind: "regular",
      price: 15000,
      eta: "Estimasi mengikuti layanan pengiriman",
      cod: false
    }
  ];

  function createServices()
  {
    return structuredClone(services);
  }

  return { createServices };
})();
