"use strict";

window.RylvaCustomerAuthMotion = (() =>
{
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const preferenceKey = "rylva-auth-motion-paused";
  const compactScreen = matchMedia("(max-width: 1100px)");
  const desktopProfile = [0.60, 0.58, 0.58, 0.63, 0.65, 0.63, 0.59, 0.59, 0.59, 0.50];
  const phases = Array.from({ length: 3 }, () => Math.random() * Math.PI * 2);
  const speeds = [0.27 + Math.random() * 0.08, 0.47 + Math.random() * 0.12, 0.15 + Math.random() * 0.06];
  let root = null;
  let observer = null;
  let artVisible = true;
  let userPaused = false;
  let frameId = null;
  let previousTime = null;
  let paintedTime = null;
  let elapsedSeconds = 0;
  let wavePaths = [];
  let recovery = false;

  try
  {
    userPaused = sessionStorage.getItem(preferenceKey) === "true";
  }
  catch
  {
    // Reduced motion still works when preference storage is unavailable.
  }

  function coordinate(value)
  {
    return value.toFixed(5);
  }

  function current(position, time)
  {
    return Math.sin(position * 5.3 - time * speeds[0] + phases[0]) * 0.52
      + Math.sin(position * 11.7 + time * speeds[1] + phases[1]) * 0.31
      + Math.sin(position * 18.1 - time * speeds[2] + phases[2]) * 0.17;
  }

  function boundaryPoints(orientation, side, time)
  {
    return Array.from({ length: 11 }, (_, index) =>
    {
      const position = index / 10;
      const edge = -0.04 + position * 1.08;
      if (orientation === "horizontal")
      {
        return { x: edge, y: 0.80 + current(position, time) * 0.17 };
      }
      const profilePosition = position * (desktopProfile.length - 1);
      const first = Math.floor(profilePosition);
      const blend = profilePosition - first;
      const base = desktopProfile[first] * (1 - blend) + desktopProfile[Math.min(first + 1, desktopProfile.length - 1)] * blend;
      const boundary = base + current(position, time) * 0.035;
      return { x: side === "right" ? 1 - boundary : boundary, y: edge };
    });
  }

  function curveThrough(points)
  {
    const first = points[0];
    let path = `M ${coordinate(first.x)} ${coordinate(first.y)}`;
    for (let index = 0; index < points.length - 1; index++)
    {
      const previous = points[Math.max(0, index - 1)];
      const start = points[index];
      const end = points[index + 1];
      const next = points[Math.min(points.length - 1, index + 2)];
      const firstControl = { x: start.x + (end.x - previous.x) / 6, y: start.y + (end.y - previous.y) / 6 };
      const secondControl = { x: end.x - (next.x - start.x) / 6, y: end.y - (next.y - start.y) / 6 };
      path += ` C ${coordinate(firstControl.x)} ${coordinate(firstControl.y)}`
        + ` ${coordinate(secondControl.x)} ${coordinate(secondControl.y)}`
        + ` ${coordinate(end.x)} ${coordinate(end.y)}`;
    }
    return path;
  }

  function wavePath(orientation, side, time)
  {
    const path = curveThrough(boundaryPoints(orientation, side, time));
    if (orientation === "horizontal")
    {
      return path + " L 1.04 1.04 L -.04 1.04 Z";
    }
    const outside = side === "right" ? "1.04" : "-.04";
    return path + ` L ${outside} 1.04 L ${outside} -.04 Z`;
  }

  function tidePath(progress, direction, revealing, compact)
  {
    const edge = -0.14 + progress * 1.28;
    const points = Array.from({ length: 17 }, (_, index) =>
    {
      const position = index / 16;
      const span = -0.04 + position * 1.08;
      const swell = current(position, elapsedSeconds + progress * 4) * 0.075;
      if (compact)
      {
        return { x: span, y: (direction === 1 ? 1 - edge : edge) + swell };
      }
      return { x: direction === 1 ? edge + swell : 1 - edge + swell, y: span };
    });
    const path = curveThrough(points);
    if (compact)
    {
      const below = direction === 1 ? !revealing : revealing;
      const outside = below ? "1.18" : "-.18";
      return path + ` L 1.04 ${outside} L -.04 ${outside} Z`;
    }
    const rightSide = direction === 1 ? revealing : !revealing;
    const outside = rightSide ? "1.18" : "-.18";
    return path + ` L ${outside} 1.04 L ${outside} -.04 Z`;
  }

  function greenWave(orientation, side)
  {
    return `
      <svg class="auth-green-wave auth-green-wave-${orientation}" viewBox="0 0 1 1"
        preserveAspectRatio="none" focusable="false" aria-hidden="true">
        <path data-orientation="${orientation}" data-side="${side}"
          d="${wavePath(orientation, side, elapsedSeconds)}"></path>
      </svg>`;
  }

  function photograph(view)
  {
    const login = view === "login";
    const image = login ? "login-garden.png" : "register-garden.png";
    const dimensions = login ? 'width="1185" height="896"' : 'width="736" height="1308"';
    const desktopCrop = login ? "620 113 477 712" : "0 0 736 1308";
    const mobileCrop = login ? "755 125 330 680" : "0 120 736 850";
    return ["desktop", "mobile"].map((size) => `
      <svg
        class="auth-photo-source auth-photo-source-${size}"
        viewBox="${size === "desktop" ? desktopCrop : mobileCrop}"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false">
        <image href="../../assets/images/auth/${image}" ${dimensions}></image>
      </svg>`).join("\n");
  }

  function artwork(view)
  {
    const recovery = !["login", "register"].includes(view);
    return `
      <div class="auth-art ${recovery ? "auth-recovery-art" : ""}" aria-hidden="true">
        <div class="auth-photo">
          ${recovery ? `<img class="auth-background" src="../../assets/images/auth/${view}-background.png" alt="">` : photograph(view)}
        </div>
        ${greenWave("vertical", view === "register" ? "right" : "left")}
        ${greenWave("horizontal", "bottom")}
      </div>
      <button
        class="auth-motion-toggle"
        type="button"
        data-auth-action="motion"
        aria-label="Animasi gelombang"
        aria-pressed="false">
        <svg class="auth-motion-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path class="auth-motion-pause" d="M8 5v14M16 5v14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"></path>
          <path class="auth-motion-play" d="m9 5 10 7-10 7Z" fill="currentColor"></path>
        </svg>
        <span class="auth-motion-text">Jeda animasi</span>
      </button>`;
  }

  function paintWaves(all = false)
  {
    const orientation = compactScreen.matches || recovery ? "horizontal" : "vertical";
    wavePaths.forEach((path) =>
    {
      if (all || path.dataset.orientation === orientation)
      {
        path.setAttribute("d", wavePath(path.dataset.orientation, path.dataset.side, elapsedSeconds));
      }
    });
  }

  function animateFrame(timestamp)
  {
    if (!root || root.dataset.motion !== "playing")
    {
      return;
    }
    if (previousTime !== null)
    {
      elapsedSeconds += Math.min((timestamp - previousTime) / 1000, 0.1);
    }
    previousTime = timestamp;
    if (paintedTime === null || timestamp - paintedTime >= 1000 / 30)
    {
      paintWaves();
      paintedTime = timestamp;
    }
    frameId = requestAnimationFrame(animateFrame);
  }

  function sync()
  {
    if (!root)
    {
      return;
    }
    const enabled = !userPaused && !preference.matches;
    const running = enabled && !document.hidden && artVisible;
    root.dataset.motion = running ? "playing" : "paused";
    if (running && frameId === null)
    {
      previousTime = null;
      paintedTime = null;
      frameId = requestAnimationFrame(animateFrame);
    }
    else if (!running && frameId !== null)
    {
      cancelAnimationFrame(frameId);
      frameId = null;
      previousTime = null;
    }
    const button = root.querySelector(".auth-motion-toggle");
    if (button)
    {
      button.setAttribute("aria-pressed", String(enabled));
      button.disabled = preference.matches || root.getAttribute("aria-busy") === "true";
      button.title = preference.matches ? "Animasi dinonaktifkan mengikuti pengaturan kurangi gerakan"
        : enabled ? "Jeda animasi gelombang" : "Putar animasi gelombang";
      button.querySelector(".auth-motion-text").textContent = enabled ? "Jeda animasi" : "Putar animasi";
    }
  }

  function mount(element)
  {
    observer?.disconnect();
    cancelAnimationFrame(frameId);
    frameId = null;
    root = element;
    artVisible = true;
    recovery = Boolean(root.querySelector(".auth-recovery-art"));
    wavePaths = [...root.querySelectorAll(".auth-green-wave path")];
    paintWaves(true);
    sync();
    if ("IntersectionObserver" in window && root.querySelector(".auth-art"))
    {
      observer = new IntersectionObserver(([entry]) =>
      {
        artVisible = entry.isIntersecting;
        sync();
      });
      observer.observe(root.querySelector(".auth-art"));
    }
  }

  document.addEventListener("click", (event) =>
  {
    if (!event.target.closest('[data-auth-action="motion"]') || preference.matches)
    {
      return;
    }
    userPaused = !userPaused;
    try
    {
      sessionStorage.setItem(preferenceKey, String(userPaused));
    }
    catch
    {
      // The in-document control remains usable without storage.
    }
    sync();
  });
  preference.addEventListener("change", sync);
  compactScreen.addEventListener("change", () => paintWaves(true));
  document.addEventListener("visibilitychange", sync);

  return { artwork, mount, sync, tidePath };
})();
