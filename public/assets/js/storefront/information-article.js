"use strict";

window.RylvaInformationArticle = (() =>
{
  function init(options)
  {
    const toc = document.getElementById(options.tocId);
    const returnLink = document.getElementById(options.returnId);
    if (!toc)
    {
      return;
    }
    const tocLinks = [...toc.querySelectorAll('a[href^="#"]')];
    const sections = tocLinks.map((link) => ({ link, heading: fragmentTarget(link.hash) }));
    const header = document.querySelector(".storefront-header");
    const compactScreen = window.matchMedia("(max-width: 760px)");
    let guideDepth = history.state?.[options.depthKey] || 0;
    let canReturnThroughHistory = true;
    let sectionFrame = null;
    let activeLink = null;

    function fragmentTarget(hash)
    {
      try
      {
        return document.getElementById(decodeURIComponent(hash.slice(1)));
      }
      catch
      {
        return null;
      }
    }

    function updateCurrentSection()
    {
      // Keep the reading line below the space reserved for the complete sticky header.
      // Its hide/show transition must not make the selected section flicker.
      const readingLine = Math.min((header?.offsetHeight || 0) + 32, innerHeight - 1);
      let selected = tocLinks[0];
      sections.forEach((section) =>
      {
        if (section.heading && section.heading.getBoundingClientRect().top <= readingLine)
        {
          selected = section.link;
        }
      });
      if (Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 1)
      {
        selected = tocLinks[tocLinks.length - 1];
      }
      if (activeLink === selected)
      {
        return;
      }
      activeLink = selected;
      tocLinks.forEach((link) =>
      {
        if (link === selected)
        {
          link.setAttribute("aria-current", "location");
        }
        else
        {
          link.removeAttribute("aria-current");
        }
      });
    }

    function scheduleSectionUpdate()
    {
      if (sectionFrame !== null)
      {
        return;
      }
      sectionFrame = requestAnimationFrame(() =>
      {
        sectionFrame = null;
        updateCurrentSection();
      });
    }

    function handleFragmentNavigation()
    {
      if (location.hash && !fragmentTarget(location.hash))
      {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
      scheduleSectionUpdate();
    }

    function restoreReadingState(event)
    {
      const navigation = performance.getEntriesByType("navigation")[0];
      const reading = history.state?.[options.readingKey];
      if (!reading || (!event.persisted && navigation?.type !== "back_forward"))
      {
        return;
      }
      toc.open = reading.tocOpen;
      document.querySelectorAll(".shipping-faq details").forEach((question) =>
      {
        question.open = question.id === reading.question;
      });
      requestAnimationFrame(() =>
      {
        window.scrollTo({ top: reading.scroll, behavior: "instant" });
        scheduleSectionUpdate();
      });
    }

    function saveReadingState()
    {
      const readingState =
      {
        tocOpen: toc.open,
        question: document.querySelector(".shipping-faq details[open]")?.id || null,
        scroll: window.scrollY
      };
      try
      {
        history.replaceState({ ...history.state, [options.readingKey]: readingState }, "", location.href);
      }
      catch
      {
        // Native browser history remains usable if state storage is restricted.
      }
    }

    function navigateToSection(event)
    {
      const link = event.target.closest('a[href^="#"]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey
        || event.shiftKey || event.altKey || link.hasAttribute("download")
        || (link.target && link.target !== "_self"))
      {
        return;
      }
      const target = fragmentTarget(link.hash);
      if (!target)
      {
        return;
      }
      const nextDepth = guideDepth + 1;
      try
      {
        saveReadingState();
        history.pushState({ ...history.state, [options.depthKey]: nextDepth }, "", link.href);
      }
      catch
      {
        canReturnThroughHistory = false;
        return;
      }
      event.preventDefault();
      guideDepth = nextDepth;
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: "start", behavior: "instant" });
      scheduleSectionUpdate();
    }

    function connectContextReturn()
    {
      if (!returnLink)
      {
        return;
      }
      try
      {
        const sourceKey = options.readingKey + "Source";
        const source = new URL(history.state?.[sourceKey] || document.referrer);
        const rule = options.returnSources.find((item) => item.path === source.pathname);
        if (source.origin !== location.origin || source.username || source.password || !rule
          || (options.validateSource && !options.validateSource(source)))
        {
          return;
        }
        returnLink.href = source.pathname + source.search + (options.returnHash || source.hash);
        returnLink.textContent = rule.label;
        returnLink.hidden = false;
        try
        {
          history.replaceState({ ...history.state, [sourceKey]: source.href }, "", location.href);
        }
        catch
        {
          // The validated native return link remains available without history storage.
        }
        returnLink.addEventListener("click", (event) =>
        {
          if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey
            && !event.altKey && canReturnThroughHistory && history.length > guideDepth + 1)
          {
            event.preventDefault();
            history.go(-(guideDepth + 1));
          }
        });
      }
      catch
      {
        // Direct or external entries keep the page's ordinary onward links.
      }
    }

    toc.open = !compactScreen.matches;
    try
    {
      history.replaceState({ ...history.state, [options.depthKey]: guideDepth }, "", location.href);
    }
    catch
    {
      canReturnThroughHistory = false;
    }
    compactScreen.addEventListener("change", () =>
    {
      toc.open = !compactScreen.matches;
    });
    handleFragmentNavigation();
    connectContextReturn();
    document.addEventListener("click", navigateToSection);
    window.addEventListener("popstate", () =>
    {
      const depth = history.state?.[options.depthKey];
      canReturnThroughHistory = Number.isInteger(depth) && depth >= 0;
      if (canReturnThroughHistory)
      {
        guideDepth = depth;
      }
      handleFragmentNavigation();
    });
    window.addEventListener("hashchange", handleFragmentNavigation);
    window.addEventListener("scroll", scheduleSectionUpdate, { passive: true });
    window.addEventListener("resize", scheduleSectionUpdate);
    window.addEventListener("pageshow", scheduleSectionUpdate);
    document.addEventListener("rylva:header-visibility", scheduleSectionUpdate);
    document.addEventListener("toggle", scheduleSectionUpdate, true);
    document.fonts.ready.then(scheduleSectionUpdate);
    window.addEventListener("pagehide", saveReadingState);
    window.addEventListener("pageshow", restoreReadingState);
  }

  return { init };
})();
