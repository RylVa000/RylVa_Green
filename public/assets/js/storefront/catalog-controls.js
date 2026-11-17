"use strict";

// One filter form moves between the sticky rail and the mobile sheet.
window.RylvaCatalogControls = (() =>
{
  function init({ beforeNavigate, onSort, onReset })
  {
    const sheet = document.getElementById("catalog-sheet");
    const title = document.getElementById("catalog-sheet-title");
    const form = document.getElementById("catalog-filters");
    const rail = document.getElementById("catalog-filter-panel");
    const slot = document.getElementById("catalog-sheet-form-slot");
    const filterView = document.getElementById("catalog-sheet-filter-view");
    const sortView = document.getElementById("catalog-sheet-sort-view");
    const footer = document.getElementById("catalog-sheet-footer");
    const search = document.getElementById("catalog-filter-search");
    const scrollArea = document.getElementById("catalog-sheet-scroll");
    const empty = document.getElementById("catalog-filter-search-empty");
    const resultButton = document.getElementById("catalog-sheet-results");
    const compact = matchMedia("(max-width: 700px)");
    const sections = [...form.querySelectorAll("[data-filter-group]")];
    const sectionButtons = [...sheet.querySelectorAll("[data-filter-section]")];
    let opener = null;
    let closing = false;
    let activeUrl = location.href;
    let currentSort = "featured";
    let dismissalVersion = 0;
    const motion = window.RylvaCatalogSheetMotion.init(
    {
      sheet,
      onDismiss: () => close(),
      isClosing: () => closing
    });
    // A reloaded document starts with its native dialog closed.
    if (history.state?.catalogSheet)
    {
      const previousState = { ...history.state };
      delete previousState.catalogSheet;
      history.replaceState(Object.keys(previousState).length ? previousState : null, "", location.href);
    }

    function rememberUrl()
    {
      if (sheet.open)
      {
        activeUrl = location.href;
      }
    }

    function setActiveSection(key)
    {
      sectionButtons.forEach((button) =>
      {
        if (button.dataset.filterSection === key)
        {
          button.setAttribute("aria-current", "true");
        }
        else
        {
          button.removeAttribute("aria-current");
        }
      });
    }

    function searchFilters()
    {
      const query = search.value.trim().toLocaleLowerCase("id");
      sections.forEach((section) =>
      {
        const label = section.querySelector("legend").textContent.toLocaleLowerCase("id");
        const titleMatches = label.includes(query)
          || (section.dataset.filterGroup === "availability" && "stok produk".includes(query));
        const choices = [...section.querySelectorAll(".catalog-choice")];
        choices.forEach((choice) =>
        {
          choice.hidden = !titleMatches && !choice.textContent.toLocaleLowerCase("id").includes(query);
        });
        section.hidden = query !== "" && !titleMatches && (choices.length
          ? choices.every((choice) => choice.hidden)
          : !section.textContent.toLocaleLowerCase("id").includes(query));
        const button = sectionButtons.find((item) => item.dataset.filterSection === section.dataset.filterGroup);
        button.hidden = section.hidden;
      });
      const visible = sections.filter((section) => !section.hidden);
      empty.hidden = visible.length > 0;
      setActiveSection(visible[0]?.dataset.filterGroup);
      scrollArea.scrollTop = 0;
    }

    function update({ count, filterCount, sortValue })
    {
      currentSort = sortValue;
      resultButton.textContent = `Lihat ${count} Produk`;
      const badge = document.getElementById("catalog-filter-count");
      badge.hidden = filterCount === 0;
      badge.textContent = filterCount;
      const selected = document.querySelector(`#catalog-sort option[value="${sortValue}"]`);
      document.getElementById("catalog-mobile-sort-label").textContent = selected.textContent;
      sortView.querySelectorAll("input").forEach((input) => input.checked = input.value === sortValue);
    }

    function finishClose()
    {
      dismissalVersion++;
      closing = false;
      if (sheet.open)
      {
        sheet.close();
      }
      motion.reset();
      document.body.classList.remove("catalog-sheet-open");
      rail.append(form);
      search.value = "";
      searchFilters();
      document.querySelectorAll("[data-catalog-sheet]").forEach((button) => button.setAttribute("aria-expanded", "false"));
      const target = opener?.isConnected && opener.getClientRects().length
        ? opener : document.getElementById("storefront-search-input");
      target.focus({ preventScroll: true });
      document.dispatchEvent(new CustomEvent("rylva:catalog-sheet-closed"));
    }

    async function close()
    {
      if (!sheet.open || closing)
      {
        return;
      }
      closing = true;
      const version = ++dismissalVersion;
      beforeNavigate();
      rememberUrl();
      await motion.dismiss();
      if (version !== dismissalVersion || !sheet.open)
      {
        return;
      }
      if (history.state?.catalogSheet)
      {
        history.back();
      }
      else
      {
        finishClose();
      }
    }

    function open(view, pushHistory = true)
    {
      if (!compact.matches || sheet.open)
      {
        return;
      }
      opener = document.activeElement;
      beforeNavigate();
      sheet.dataset.view = view;
      title.textContent = view === "sort" ? "Urutkan" : "Filter";
      filterView.hidden = view !== "filter";
      sortView.hidden = view !== "sort";
      footer.hidden = view !== "filter";
      if (view === "filter")
      {
        slot.append(form);
      }
      sortView.querySelectorAll("input").forEach((input) => input.checked = input.value === currentSort);
      if (pushHistory)
      {
        history.pushState({ catalogSheet: view }, "", location.href);
      }
      activeUrl = location.href;
      sheet.showModal();
      document.body.classList.add("catalog-sheet-open");
      search.value = "";
      searchFilters();
      scrollArea.scrollTop = 0;
      document.querySelectorAll("[data-catalog-sheet]").forEach((button) =>
        button.setAttribute("aria-expanded", String(button.dataset.catalogSheet === view)));
      title.focus({ preventScroll: true });
    }

    document.addEventListener("click", (event) =>
    {
      const control = event.target.closest("button");
      if (!control || control.disabled)
      {
        return;
      }
      if (control.dataset.catalogSheet)
      {
        open(control.dataset.catalogSheet);
      }
      else if (control.hasAttribute("data-catalog-sheet-close"))
      {
        close();
      }
      else if (control.hasAttribute("data-catalog-sheet-results"))
      {
        const invalid = form.querySelector('[aria-invalid="true"]');
        if (invalid)
        {
          invalid.focus();
          return;
        }
        close();
      }
      else if (control.hasAttribute("data-catalog-sheet-reset"))
      {
        if (sheet.dataset.view === "sort")
        {
          onSort("featured");
        }
        else
        {
          onReset();
          search.value = "";
          searchFilters();
        }
      }
      else if (control.dataset.filterSection)
      {
        const section = sections.find((item) => item.dataset.filterGroup === control.dataset.filterSection);
        section.tabIndex = -1;
        section.focus({ preventScroll: true });
        const top = scrollArea.scrollTop + section.getBoundingClientRect().top - scrollArea.getBoundingClientRect().top;
        scrollArea.scrollTo({ top, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
        setActiveSection(control.dataset.filterSection);
      }
    });
    search.addEventListener("input", searchFilters);
    sortView.addEventListener("change", (event) =>
    {
      onSort(event.target.value);
      close();
    });
    scrollArea.addEventListener("scroll", () =>
    {
      const boundary = scrollArea.getBoundingClientRect().top + 40;
      const visible = sections.filter((section) => !section.hidden);
      const reached = visible.filter((section) => section.getBoundingClientRect().top <= boundary);
      setActiveSection((reached.at(-1) || visible[0])?.dataset.filterGroup);
    }, { passive: true });
    sheet.addEventListener("keydown", (event) =>
    {
      if (event.key !== "Tab")
      {
        return;
      }
      const candidates = [...sheet.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])')];
      const focusable = candidates.filter((element) =>
      {
        if (!element.getClientRects().length)
        {
          return false;
        }
        if (element.type !== "radio")
        {
          return true;
        }
        const group = [...sheet.querySelectorAll('input[type="radio"]')].filter((input) => input.name === element.name);
        return element === (group.find((input) => input.checked) || group[0]);
      });
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!event.shiftKey && document.activeElement === last)
      {
        event.preventDefault();
        first?.focus();
      }
      else if (event.shiftKey && document.activeElement === first)
      {
        event.preventDefault();
        last?.focus();
      }
    });
    sheet.addEventListener("cancel", (event) =>
    {
      event.preventDefault();
      close();
    });
    sheet.addEventListener("click", (event) =>
    {
      if (event.target !== sheet)
      {
        return;
      }
      const bounds = sheet.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right
        || event.clientY < bounds.top || event.clientY > bounds.bottom)
      {
        close();
      }
    });
    window.addEventListener("popstate", (event) =>
    {
      if ((sheet.open || closing) && !event.state?.catalogSheet)
      {
        beforeNavigate();
        history.replaceState(null, "", activeUrl);
        finishClose();
        event.stopImmediatePropagation();
      }
      else if (event.state?.catalogSheet && compact.matches)
      {
        open(event.state.catalogSheet, false);
        event.stopImmediatePropagation();
      }
      else if (event.state?.catalogSheet && !compact.matches)
      {
        history.replaceState(null, "", location.href);
      }
    }, true);
    compact.addEventListener("change", () =>
    {
      if (!compact.matches && sheet.open)
      {
        close();
      }
    });
    return { update, rememberUrl, isOpen: () => sheet.open };
  }

  return { init };
})();
