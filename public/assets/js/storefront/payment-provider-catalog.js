"use strict";

// Shared illustrative providers. Live adapters supply their own active channels.
window.RylvaPaymentProviderCatalog = (() =>
{
  const providers =
  {
    va:
    [
      { id: "bca", name: "Bank BCA", image: "bca.png" },
      { id: "mandiri", name: "Bank Mandiri", image: "mandiri.png" },
      { id: "bni", name: "Bank BNI", image: "bni.png" },
      { id: "bri", name: "Bank BRI", image: "bri.png" },
      { id: "danamon", name: "Bank Danamon", image: "danamon.png" },
      { id: "permata", name: "Bank Permata", image: "permata.png" },
      { id: "bsi", name: "Bank BSI", image: "bsi.png" }
    ],
    wallet:
    [
      { id: "dana", name: "DANA", image: "dana.png" },
      { id: "gopay", name: "GoPay", image: "gopay.png" },
      { id: "ovo", name: "OVO", image: "ovo.png", inverseLogo: true },
      { id: "linkaja", name: "LinkAja", image: "linkaja.svg", inverseLogo: true },
      { id: "shopeepay", name: "ShopeePay", image: "shopeepay.png" }
    ]
  };

  function providersFor(methodId)
  {
    return providers[methodId] ? structuredClone(providers[methodId]) : undefined;
  }

  return { providersFor };
})();
