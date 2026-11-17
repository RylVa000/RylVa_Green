"use strict";

(() =>
{
  const repository = window.RylvaHomepagePreviewRepository;

  function updateCart(snapshot)
  {
    const count = snapshot.items.reduce((total, item) => total + item.quantity, 0);
    const badge = document.querySelector(".storefront-cart-count");
    badge.hidden = count === 0;
    badge.textContent = String(count);
    document.querySelector('header [data-storefront-page="Keranjang"]')
      .setAttribute("aria-label", `Keranjang, ${count} unit produk contoh`);
  }

  window.RylvaHomepageHeader.init(
  {
    readCart: () => repository.readCart(),
    removeItem: (lineId) => repository.remove(lineId),
    onCartChange: updateCart,
    openDetail: (slug) => window.RylvaProductNavigation.open(slug),
    openSaved: () => location.assign(window.RylvaWishlistStore.pageUrl()),
    browseCollection: () => location.assign("/pages/public/catalog.html")
  });

  repository.readCart().then(updateCart).catch(() =>
  {
    document.querySelector(".storefront-cart-count").hidden = true;
  });

  const categories =
  {
    "Koleksi Baru": "",
    "Promo Spesial": "discount=5",
    "Tanaman Hias": "category=plants",
    "Terrarium & Moss": "category=terrarium",
    "Media Tanam": "category=media",
    "Pot & Vas": "category=pots",
    "Alat Berkebun": "category=tools",
    "Pupuk & Nutrisi": "category=media",
    "Perlengkapan Berkebun": "category=tools"
  };
  document.addEventListener("click", (event) =>
  {
    const destination = event.target.closest("[data-storefront-page]")?.dataset.storefrontPage;
    if (Object.hasOwn(categories, destination))
    {
      event.preventDefault();
      event.stopImmediatePropagation();
      const parameters = categories[destination];
      location.assign("/pages/public/catalog.html" + (parameters ? "?" + parameters : ""));
    }
  }, true);

  document.getElementById("storefront-search").addEventListener("submit", (event) =>
  {
    event.preventDefault();
    event.stopImmediatePropagation();
    const query = document.getElementById("storefront-search-input").value.trim();
    location.assign("/pages/public/catalog.html" + (query ? "?q=" + encodeURIComponent(query) : ""));
  }, true);

  const questions = [...document.querySelectorAll(".info-itemfaq")];
  questions.forEach((question) =>
  {
    question.addEventListener("toggle", () =>
    {
      if (question.open)
      {
        questions.filter((item) => item !== question).forEach((item) => item.open = false);
      }
    });
  });

  const contactForm = document.getElementById("contact-form");
  if (contactForm)
  {
    const compose = document.getElementById("contact-compose");
    const status = document.getElementById("contact-form-status");
    const fallback = document.getElementById("contact-email-fallback");
    compose.disabled = false;
    contactForm.addEventListener("submit", (event) =>
    {
      event.preventDefault();
      if (!contactForm.reportValidity())
      {
        return;
      }
      const fields = new FormData(contactForm);
      const name = String(fields.get("name")).trim();
      const email = String(fields.get("email")).trim();
      const message = String(fields.get("message")).trim();
      const body = `Nama: ${name}\nEmail: ${email}\n\n${message}`;
      fallback.href = "mailto:rylvagreen@gmail.com?subject=" + encodeURIComponent("Pertanyaan untuk RylVa Green")
        + "&body=" + encodeURIComponent(body);
      status.textContent = "Draf email disiapkan. Jika aplikasi email tidak terbuka, gunakan tautan email di bawah atau WhatsApp. Isi formulir Anda tetap tersedia.";
      status.hidden = false;
      fallback.click();
    });
  }
})();
