"use strict";

// The banner remains a local collection preview; it does not create an offer.
window.RylvaHomepageHero = (() =>
{
  const SLIDE_INTERVAL = 6500;
  const hero = document.querySelector(".home-hero");
  const image = document.getElementById("home-hero-image");
  const playback = document.getElementById("home-hero-playback");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const slides =
  [
    {
      title: "MONSTERA", theme: "monstera", image: "hero-monstera.webp",
      description: "Sempurnakan estetika interior Anda dengan koleksi Monstera premium. Hadirkan nuansa alam yang hidup dan bernapas ke dalam rumah.",
      action: "Belanja Koleksi Indoor", category: "indoor", alt: "Monstera dalam pot anyaman"
    },
    {
      title: "CALATHEA", theme: "calathea", image: "hero-calathea-v2.webp",
      description: "Pola daun yang khas untuk melengkapi koleksi tanaman hias di rumah Anda.",
      action: "Jelajahi Koleksi Calathea", category: "indoor", alt: "Calathea dengan daun berpola dalam pot putih"
    },
    {
      title: "PETUNIA", theme: "petunia", image: "hero-petunia-v2.webp",
      description: "Beri warna pada sudut taman dengan bunga Petunia dan pilihan koleksi tanaman berbunga RylVa.",
      action: "Jelajahi Koleksi Bunga", category: "outdoor", alt: "Bunga Petunia ungu dan merah muda dalam pot"
    },
    {
      title: "MARIGOLD", theme: "marigold", image: "hero-marigold.webp",
      description: "Jingga yang hangat, kuning yang cerah. Kelopak Marigold yang rimbun memberi sentuhan ceria pada teras dan sudut taman Anda.",
      action: "Jelajahi Koleksi Bunga", category: "outdoor", alt: "Marigold jingga, kuning dan merah dalam pot terakota"
    }
  ];
  let activeIndex = 0;
  let timer = null;
  let pausedByUser = false;
  let focused = false;
  let resumeThroughInteraction = false;
  let visible = true;
  let changing = false;
  let changeVersion = 0;
  let imageAnimation = null;

  function schedule()
  {
    clearTimeout(timer);
    timer = null;
    const interactionBlocked = focused && !resumeThroughInteraction;
    const blocked = pausedByUser || reducedMotion.matches || interactionBlocked
      || !visible || document.hidden || document.querySelector("dialog[open], .home-header-panel:not([hidden])");
    hero.dataset.autoplay = blocked ? "paused" : "playing";
    playback.hidden = reducedMotion.matches;
    if (!blocked && !changing)
    {
      timer = setTimeout(() => select((activeIndex + 1) % slides.length), SLIDE_INTERVAL);
    }
  }

  async function select(index, manual = false)
  {
    if (!Number.isInteger(index) || !slides[index])
    {
      return;
    }
    if (manual)
    {
      // Choosing a slide restarts the interval, even while its button keeps focus.
      // Keep an explicit user pause intact; visibility and motion preferences still apply.
      resumeThroughInteraction = !pausedByUser;
    }
    clearTimeout(timer);
    const version = ++changeVersion;
    const next = slides[index];
    changing = true;
    const nextImage = new Image();
    nextImage.src = "/assets/images/homepage/" + next.image;
    try
    {
      await nextImage.decode();
    }
    catch
    {
      changing = false;
      if (manual)
      {
        document.getElementById("home-hero-announcement").textContent = "Gambar banner belum dapat dimuat. Banner sebelumnya tetap ditampilkan.";
      }
      schedule();
      return;
    }
    if (version !== changeVersion)
    {
      return;
    }
    activeIndex = index;
    hero.dataset.heroTheme = next.theme;
    document.getElementById("home-title").textContent = next.title;
    document.getElementById("home-hero-description").textContent = next.description;
    const action = hero.querySelector("[data-home-collection]");
    action.textContent = next.action;
    action.dataset.homeCollection = next.category;
    image.hidden = false;
    delete image.parentElement.dataset.imageFailed;
    image.src = nextImage.src;
    image.alt = next.alt;
    image.parentElement.classList.toggle("is-alternate", index !== 0);
    hero.querySelectorAll("[data-home-slide]").forEach((button) =>
      button.setAttribute("aria-pressed", String(Number(button.dataset.homeSlide) === index)));
    imageAnimation?.cancel();
    if (!reducedMotion.matches)
    {
      imageAnimation = image.animate(
        [{ opacity: 0.35, translate: "-12px 0" }, { opacity: 1, translate: "0 0" }],
        { duration: 650, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
      );
    }
    if (manual)
    {
      document.getElementById("home-hero-announcement").textContent = "Banner " + next.title + " dipilih.";
    }
    changing = false;
    schedule();
  }

  playback.addEventListener("click", () =>
  {
    pausedByUser = !pausedByUser;
    resumeThroughInteraction = !pausedByUser;
    playback.setAttribute("aria-pressed", String(pausedByUser));
    playback.setAttribute("aria-label", pausedByUser ? "Lanjutkan pergantian banner otomatis" : "Jeda pergantian banner otomatis");
    playback.querySelector("use").setAttribute("href", pausedByUser ? "#home-play-icon" : "#home-pause-icon");
    schedule();
  });
  hero.addEventListener("focusin", () =>
  {
    resumeThroughInteraction = false;
    focused = true;
    schedule();
  });
  hero.addEventListener("focusout", (event) =>
  {
    focused = hero.contains(event.relatedTarget);
    schedule();
  });
  document.addEventListener("visibilitychange", schedule);
  document.addEventListener("rylva:header-panel", schedule);
  new MutationObserver(schedule).observe(document.getElementById("home-dialog"), { attributes: true, attributeFilter: ["open"] });
  new IntersectionObserver(([entry]) =>
  {
    visible = entry.isIntersecting;
    schedule();
  }, { threshold: 0.1 }).observe(hero);
  reducedMotion.addEventListener("change", () =>
  {
    if (reducedMotion.matches)
    {
      imageAnimation?.cancel();
    }
    schedule();
  });
  window.addEventListener("pagehide", () => clearTimeout(timer));
  window.addEventListener("pageshow", schedule);
  schedule();
  return { select };
})();
