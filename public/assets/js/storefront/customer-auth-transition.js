"use strict";

// Loaded in the head so a destination can keep the tide visible before first paint.
window.RylvaCustomerAuthTransition = (() =>
{
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const compactScreen = matchMedia("(max-width: 1100px)");
  const storageKey = "rylva-auth-arrival";
  const routes = { "customer-login.html": "login", "customer-register.html": "register" };
  let arrival = null;
  let veil = null;
  let skipAnimation = null;
  let drift = null;
  let watchdog = null;

  function clearArrival()
  {
    try
    {
      sessionStorage.removeItem(storageKey);
    }
    catch
    {
      // Navigation works normally when storage is restricted.
    }
  }

  function motionAllowed()
  {
    try
    {
      return !preference.matches && !document.hidden
        && sessionStorage.getItem("rylva-auth-motion-paused") !== "true";
    }
    catch
    {
      return false;
    }
  }

  function cleanup()
  {
    clearTimeout(watchdog);
    skipAnimation?.();
    skipAnimation = null;
    drift?.cancel();
    drift = null;
    veil?.remove();
    veil = null;
    delete document.documentElement.dataset.authArrival;
    const root = document.getElementById("customer-auth-root");
    if (root)
    {
      root.inert = false;
    }
  }

  try
  {
    const stored = JSON.parse(sessionStorage.getItem(storageKey));
    const path = location.pathname + location.search;
    if (stored && stored.destination === path && [1, -1].includes(stored.direction)
      && Date.now() - stored.createdAt >= 0 && Date.now() - stored.createdAt < 10000
      && Object.hasOwn(routes, location.pathname.split("/").at(-1)) && motionAllowed())
    {
      arrival = stored;
      document.documentElement.dataset.authArrival = "pending";
      // A failed script or service must never leave the page hidden behind the tide.
      watchdog = setTimeout(() =>
      {
        arrival = null;
        cleanup();
      }, 5000);
    }
  }
  catch
  {
    arrival = null;
  }
  clearArrival();

  function isSwitch(destination)
  {
    const target = new URL(destination, location.href);
    const name = target.pathname.split("/").at(-1);
    const nextView = Object.hasOwn(routes, name) ? routes[name] : null;
    const view = document.body.dataset.authView;
    return target.origin === location.origin && ["login", "register"].includes(view)
      && Boolean(nextView) && nextView !== view;
  }

  function createVeil()
  {
    veil = document.createElement("div");
    veil.className = "auth-tide-veil";
    veil.setAttribute("aria-hidden", "true");
    veil.innerHTML = `
      <svg viewBox="0 0 1 1" preserveAspectRatio="none" focusable="false">
        <path></path>
      </svg>`;
    document.body.append(veil);
    document.getElementById("customer-auth-root").inert = true;
    return veil.querySelector("path");
  }

  function tide(path, direction, revealing)
  {
    const duration = revealing ? 460 : 380;
    const compact = compactScreen.matches;
    const shape = window.RylvaCustomerAuthMotion.tidePath;
    return new Promise((resolve) =>
    {
      let startedAt = null;
      let frameId = null;
      const finish = () =>
      {
        cancelAnimationFrame(frameId);
        path.setAttribute("d", shape(1, direction, revealing, compact));
        skipAnimation = null;
        resolve();
      };
      skipAnimation = finish;
      path.setAttribute("d", shape(0, direction, revealing, compact));
      function frame(timestamp)
      {
        startedAt ??= timestamp;
        const progress = Math.min(1, (timestamp - startedAt) / duration);
        const eased = progress * progress * (3 - 2 * progress);
        path.setAttribute("d", shape(eased, direction, revealing, compact));
        if (progress === 1 || !motionAllowed())
        {
          finish();
          return;
        }
        frameId = requestAnimationFrame(frame);
      }
      frameId = requestAnimationFrame(frame);
    });
  }

  async function leave(destination)
  {
    if (!isSwitch(destination) || !motionAllowed())
    {
      return;
    }
    const target = new URL(destination, location.href);
    const direction = routes[target.pathname.split("/").at(-1)] === "register" ? 1 : -1;
    try
    {
      sessionStorage.setItem(storageKey, JSON.stringify(
      {
        destination: target.pathname + target.search,
        direction,
        createdAt: Date.now()
      }));
      const path = createVeil();
      const form = document.querySelector(".auth-form-area");
      drift = form?.animate(
      [
        { transform: "translate(0, 0)", opacity: 1 },
        { transform: compactScreen.matches ? `translateY(${-direction * 18}px)` : `translateX(${-direction * 20}px)`, opacity: 0.35 }
      ], { duration: 380, easing: "cubic-bezier(0.4, 0, 0.6, 1)", fill: "forwards" });
      await tide(path, direction, false);
    }
    catch
    {
      clearArrival();
      cleanup();
    }
  }

  async function arrive()
  {
    if (!arrival)
    {
      return;
    }
    const direction = arrival.direction;
    arrival = null;
    clearTimeout(watchdog);
    if (!motionAllowed())
    {
      cleanup();
      return;
    }
    try
    {
      const path = createVeil();
      path.setAttribute("d", window.RylvaCustomerAuthMotion.tidePath(0, direction, true, compactScreen.matches));
      delete document.documentElement.dataset.authArrival;
      const form = document.querySelector(".auth-form-area");
      drift = form?.animate(
      [
        { transform: compactScreen.matches ? `translateY(${direction * 18}px)` : `translateX(${direction * 20}px)`, opacity: 0.35 },
        { transform: "translate(0, 0)", opacity: 1 }
      ], { duration: 460, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
      await tide(path, direction, true);
    }
    catch
    {
      // A missing animation API must not prevent using the destination form.
    }
    finally
    {
      cleanup();
      document.getElementById("auth-title")?.focus({ preventScroll: true });
    }
  }

  document.addEventListener("visibilitychange", () =>
  {
    if (document.hidden)
    {
      skipAnimation?.();
    }
  });
  preference.addEventListener("change", () =>
  {
    if (preference.matches)
    {
      skipAnimation?.();
    }
  });
  window.addEventListener("pageshow", (event) =>
  {
    if (event.persisted)
    {
      arrival = null;
      cleanup();
    }
  });

  return { isSwitch, leave, arrive };
})();
