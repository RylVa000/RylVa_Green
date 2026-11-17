"use strict";

// Pointer dragging on the header; touch pulling at the top of a scrollable sheet.
window.RylvaCatalogSheetMotion = (() =>
{
  function init({ sheet, onDismiss, isClosing })
  {
    let gesture = null;
    let animation = null;
    let lastDragTarget = null;
    let suppressClickUntil = 0;

    function releaseGesture()
    {
      const previous = gesture;
      gesture = null;
      if (previous?.source === "pointer" && sheet.hasPointerCapture(previous.id))
      {
        sheet.releasePointerCapture(previous.id);
      }
      sheet.classList.remove("is-dragging");
      sheet.style.removeProperty("--catalog-sheet-offset");
    }

    async function animateTo(transform)
    {
      const from = getComputedStyle(sheet).transform;
      animation?.cancel();
      sheet.classList.add("is-interacting");
      releaseGesture();
      const tween = sheet.animate([{ transform: from }, { transform }],
      {
        duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "forwards"
      });
      animation = tween;
      try
      {
        await tween.finished;
      }
      catch
      {
        // A new gesture, history navigation or resize can interrupt settling.
      }
      if (animation === tween && transform === "none")
      {
        animation = null;
        tween.cancel();
      }
    }

    function reset()
    {
      animation?.cancel();
      animation = null;
      releaseGesture();
      sheet.getAnimations().forEach((item) => item.cancel());
      sheet.classList.remove("is-interacting", "is-dismissing");
    }

    function surfaceFor(target, headerOnly)
    {
      if (!(target instanceof Element))
      {
        return null;
      }
      const control = target.closest("input, select, textarea, button, a, [contenteditable]");
      if (control && !control.hasAttribute("data-filter-section"))
      {
        return null;
      }
      if (target.closest(".catalog-sheet-handle, .catalog-sheet-header"))
      {
        return { scroller: null };
      }
      const scroller = target.closest(".catalog-sheet-scroll, .catalog-filter-navigation, .catalog-sheet-sort-view");
      return !headerOnly && scroller && scroller.scrollTop <= 1 ? { scroller } : null;
    }

    function start(target, id, x, y, source)
    {
      if (!sheet.open || isClosing())
      {
        return false;
      }
      const surface = surfaceFor(target, source === "pointer");
      if (!surface)
      {
        return false;
      }
      gesture = { id, source, target, scroller: surface.scroller, startX: x, startY: y,
        lastY: y, lastTime: performance.now(), velocity: 0, offset: 0, active: false };
      return true;
    }

    function move(x, y, event)
    {
      if (!gesture || isClosing())
      {
        return;
      }
      const horizontal = Math.abs(x - gesture.startX);
      const vertical = y - gesture.startY;
      if (!gesture.active)
      {
        if (vertical < -8 || (horizontal > 8 && horizontal > Math.abs(vertical)))
        {
          releaseGesture();
          return;
        }
        if (vertical < 8 || vertical < horizontal)
        {
          return;
        }
        if (gesture.scroller && gesture.scroller.scrollTop > 1)
        {
          releaseGesture();
          return;
        }
        animation?.cancel();
        animation = null;
        gesture.active = true;
        sheet.classList.add("is-interacting", "is-dragging");
      }
      if (event.cancelable)
      {
        event.preventDefault();
      }
      const now = performance.now();
      gesture.velocity = (y - gesture.lastY) / Math.max(1, now - gesture.lastTime);
      gesture.lastY = y;
      gesture.lastTime = now;
      gesture.offset = Math.min(sheet.offsetHeight, Math.max(0, vertical));
      sheet.style.setProperty("--catalog-sheet-offset", gesture.offset + "px");
    }

    function finish(cancelled = false)
    {
      if (!gesture?.active)
      {
        releaseGesture();
        return;
      }
      const threshold = Math.min(120, Math.max(72, sheet.offsetHeight * 0.18));
      const velocity = performance.now() - gesture.lastTime > 100 ? 0 : gesture.velocity;
      const dismiss = !cancelled && (gesture.offset >= threshold || (gesture.offset >= 36 && velocity > 0.65));
      lastDragTarget = gesture.target.closest("label, button") || gesture.target;
      suppressClickUntil = performance.now() + 350;
      if (dismiss)
      {
        onDismiss();
      }
      else
      {
        animateTo("none");
      }
    }

    sheet.addEventListener("touchstart", (event) =>
    {
      if (event.touches.length !== 1)
      {
        finish(true);
        return;
      }
      const touch = event.touches[0];
      start(event.target, touch.identifier, touch.clientX, touch.clientY, "touch");
    }, { passive: true });
    sheet.addEventListener("touchmove", (event) =>
    {
      if (gesture?.source !== "touch")
      {
        return;
      }
      if (event.touches.length !== 1)
      {
        finish(true);
        return;
      }
      const touch = [...event.touches].find((item) => item.identifier === gesture.id);
      if (touch)
      {
        move(touch.clientX, touch.clientY, event);
      }
    }, { passive: false });
    sheet.addEventListener("touchend", (event) =>
    {
      if (gesture?.source === "touch" && [...event.changedTouches].some((touch) => touch.identifier === gesture.id))
      {
        finish();
      }
    }, { passive: true });
    sheet.addEventListener("touchcancel", () =>
    {
      if (gesture?.source === "touch")
      {
        finish(true);
      }
    }, { passive: true });
    sheet.addEventListener("pointerdown", (event) =>
    {
      if (event.pointerType !== "touch" && event.button === 0
        && start(event.target, event.pointerId, event.clientX, event.clientY, "pointer"))
      {
        sheet.setPointerCapture(event.pointerId);
      }
    });
    sheet.addEventListener("pointermove", (event) =>
    {
      if (gesture?.source === "pointer" && gesture.id === event.pointerId)
      {
        move(event.clientX, event.clientY, event);
      }
    });
    sheet.addEventListener("pointerup", (event) =>
    {
      if (gesture?.source === "pointer" && gesture.id === event.pointerId)
      {
        finish();
      }
    });
    ["pointercancel", "lostpointercapture"].forEach((name) => sheet.addEventListener(name, (event) =>
    {
      if (gesture?.source === "pointer" && gesture.id === event.pointerId)
      {
        finish(true);
      }
    }));
    sheet.addEventListener("click", (event) =>
    {
      if (performance.now() < suppressClickUntil && (event.target === sheet || lastDragTarget?.contains(event.target)))
      {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);

    return {
      reset,
      dismiss: () =>
      {
        sheet.classList.add("is-dismissing");
        return animateTo("translateY(100%)");
      }
    };
  }

  return { init };
})();
