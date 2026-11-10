"use strict";

(() =>
{
  const instances = new Map();
  let opened = null;
  let controlSequence = 0;
  let scanQueued = false;

  function controlNode(tag, className = "", text = "")
  {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  }

  function normalizeSearch(value)
  {
    return value.normalize("NFKD").replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("id").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  }

  function createSearchableSelect(select)
  {
    select.id ||= `admin-select-${++controlSequence}`;
    const labels = [...select.labels];
    const wrapper = controlNode("div", "admin-combobox");
    wrapper.dataset.comboboxFor = select.id;
    const input = controlNode("input", "admin-combobox-input");
    input.id = `${select.id}-combobox`;
    input.type = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.placeholder = "Ketik untuk mencari…";
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-haspopup", "listbox");
    input.setAttribute("aria-expanded", "false");
    const toggle = controlNode("button", "admin-combobox-toggle");
    toggle.type = "button";
    toggle.tabIndex = -1;
    toggle.setAttribute("aria-label", "Buka pilihan");
    const arrow = controlNode("span", "admin-combobox-chevron");
    arrow.setAttribute("aria-hidden", "true");
    toggle.append(arrow);
    const popup = controlNode("div", "admin-combobox-popup");
    popup.hidden = true;
    const count = controlNode("p", "admin-combobox-count");
    count.setAttribute("role", "status");
    count.setAttribute("aria-live", "polite");
    const list = controlNode("ul", "admin-combobox-list");
    list.id = `${select.id}-options`;
    list.setAttribute("role", "listbox");
    input.setAttribute("aria-controls", list.id);
    popup.append(count, list);
    select.before(wrapper);
    wrapper.append(input, toggle);
    select.classList.add("admin-select-native");
    select.setAttribute("aria-hidden", "true");
    select.tabIndex = -1;
    const labelIds = labels.filter((label) => !label.contains(select)).map((label, index) =>
    {
      label.id ||= `${select.id}-label-${index}`;

      if (label.htmlFor === select.id)
      {
        label.htmlFor = input.id;
      }

      return label.id;
    });

    if (labelIds.length)
    {
      input.setAttribute("aria-labelledby", labelIds.join(" "));
    }
    else
    {
      const wrappingLabel = labels.find((label) => label.contains(select))?.cloneNode(true);
      wrappingLabel?.querySelectorAll("input, select, button, .admin-combobox").forEach((node) => node.remove());
      input.setAttribute("aria-label", select.getAttribute("aria-label")
        || wrappingLabel?.textContent.trim() || select.name || "Cari pilihan");
    }

    const instance =
    {
      select,
      input,
      toggle,
      wrapper,
      popup,
      list,
      count,
      options: [],
      activeIndex: -1,
      query: "",
      open: false
    };
    instances.set(select, instance);

    function selectedLabel()
    {
      return select.selectedOptions[0]?.textContent.trim() || "";
    }

    function sync()
    {
      input.disabled = select.disabled;
      toggle.disabled = select.disabled;
      input.setAttribute("aria-required", String(select.required));
      const describedBy = select.getAttribute("aria-describedby");
      const invalid = select.getAttribute("aria-invalid");

      if (describedBy)
      {
        input.setAttribute("aria-describedby", describedBy);
      }

      if (invalid)
      {
        input.setAttribute("aria-invalid", invalid);
      }
      else
      {
        input.removeAttribute("aria-invalid");
      }

      if (!instance.open)
      {
        input.value = selectedLabel();
      }

      if (select.disabled)
      {
        close();
      }
    }

    function close()
    {
      instance.open = false;
      instance.query = "";
      popup.hidden = true;
      input.value = selectedLabel();
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      wrapper.classList.remove("is-open");

      if (opened === instance)
      {
        opened = null;
      }
    }

    function position()
    {
      if (!instance.open || !select.isConnected)
      {
        return;
      }

      const anchor = wrapper.getBoundingClientRect();

      if (anchor.bottom < 0 || anchor.top > innerHeight)
      {
        close();
        return;
      }

      const width = Math.min(anchor.width, innerWidth - 24);
      const below = innerHeight - anchor.bottom - 12;
      const above = anchor.top - 12;
      const useAbove = below < 180 && above > below;
      const height = Math.min(300, useAbove ? above : below);
      popup.style.width = `${width}px`;
      popup.style.maxHeight = `${Math.max(100, height)}px`;
      popup.style.left = `${Math.max(12, Math.min(anchor.left, innerWidth - width - 12))}px`;
      popup.style.top = `${useAbove ? anchor.top - Math.min(popup.scrollHeight, height) - 4 : anchor.bottom + 4}px`;
    }

    function highlight(index, scroll = false)
    {
      instance.activeIndex = index;
      const options = [...list.querySelectorAll('[role="option"]')];
      options.forEach((option, optionIndex) => option.setAttribute("aria-selected", String(optionIndex === index)));
      const option = options[index];

      if (option)
      {
        input.setAttribute("aria-activedescendant", option.id);

        if (scroll)
        {
          option.scrollIntoView({ block: "nearest" });
        }
      }
      else
      {
        input.removeAttribute("aria-activedescendant");
      }
    }

    function choose(index)
    {
      const option = instance.options[index];

      if (!option || option.disabled || select.disabled)
      {
        return;
      }

      select.value = option.value;
      close();
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
      requestAnimationFrame(() =>
      {
        enhanceSelects();
        const nextInput = document.getElementById(input.id);
        nextInput?.focus({ preventScroll: true });
      });
    }

    function renderOptions()
    {
      const words = normalizeSearch(instance.query).split(" ").filter(Boolean);
      instance.options = [...select.options].filter((option) =>
      {
        const label = normalizeSearch(option.textContent);
        return !option.disabled && words.every((word) => label.includes(word));
      });
      list.replaceChildren();
      count.textContent = instance.options.length
        ? `${instance.options.length} pilihan. Ketik nama atau kode untuk mencari.`
        : "Tidak ada pilihan yang cocok.";
      instance.options.forEach((option, index) =>
      {
        const item = controlNode("li", "admin-combobox-option", option.textContent.trim());
        item.id = `${list.id}-${index}`;
        item.setAttribute("role", "option");
        item.setAttribute("aria-selected", "false");
        item.addEventListener("pointerdown", (event) => event.preventDefault());
        item.addEventListener("click", () => choose(index));
        list.append(item);
      });

      if (!instance.options.length)
      {
        list.append(controlNode("li", "admin-combobox-empty", "Coba kata kunci lain. Pilihan sebelumnya tetap tersimpan."));
      }

      const selectedIndex = instance.query ? 0 : instance.options.findIndex((option) => option.value === select.value);
      highlight(instance.options.length ? Math.max(0, selectedIndex) : -1);
      position();
    }

    function open()
    {
      if (select.disabled)
      {
        return;
      }

      if (opened && opened !== instance)
      {
        opened.close();
      }

      opened = instance;
      instance.open = true;
      (select.closest("dialog") || document.body).append(popup);
      popup.hidden = false;
      input.setAttribute("aria-expanded", "true");
      wrapper.classList.add("is-open");
      renderOptions();
    }

    input.addEventListener("focus", () => input.select());
    input.addEventListener("click", () =>
    {
      if (!instance.open)
      {
        instance.query = "";
        open();
      }
    });
    input.addEventListener("input", () =>
    {
      instance.query = input.value;
      open();
    });
    input.addEventListener("keydown", (event) =>
    {
      if (event.key === "ArrowDown" || event.key === "ArrowUp")
      {
        event.preventDefault();

        if (!instance.open)
        {
          open();
        }
        else
        {
          const direction = event.key === "ArrowDown" ? 1 : -1;
          highlight(Math.max(0, Math.min(instance.options.length - 1, instance.activeIndex + direction)), true);
        }
      }
      else if (event.key === "Enter" && instance.open)
      {
        event.preventDefault();
        choose(instance.activeIndex);
      }
      else if (event.key === "Escape" && instance.open)
      {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
      else if (event.key === "Tab" && instance.open)
      {
        close();
      }
    });
    input.addEventListener("blur", (event) =>
    {
      if (!wrapper.contains(event.relatedTarget))
      {
        close();
      }
    });
    toggle.addEventListener("pointerdown", (event) => event.preventDefault());
    toggle.addEventListener("click", () =>
    {
      input.focus();

      if (instance.open)
      {
        close();
      }
      else
      {
        instance.query = "";
        open();
      }
    });
    select.addEventListener("input", () =>
    {
      if (instance.open)
      {
        close();
      }

      sync();
    });
    select.addEventListener("change", sync);
    const observer = new MutationObserver(() =>
    {
      sync();

      if (instance.open)
      {
        renderOptions();
      }
    });
    observer.observe(select,
    {
      attributes: true,
      attributeFilter: ["disabled", "required", "aria-invalid", "aria-describedby"],
      childList: true,
      subtree: true
    });
    Object.assign(instance, { close, position, observer, sync });
    sync();
  }

  function enhanceSelects()
  {
    for (const [select, instance] of instances)
    {
      if (!select.isConnected)
      {
        instance.close();
        instance.observer.disconnect();
        instance.popup.remove();
        instances.delete(select);
      }
    }

    document.querySelectorAll("select:not([multiple])").forEach((select) =>
    {
      const searchable = select.dataset.searchable === "true" || select.options.length > 5;

      if (searchable && select.dataset.searchable !== "false" && !instances.has(select))
      {
        createSearchableSelect(select);
      }
    });
  }

  document.addEventListener("pointerdown", (event) =>
  {
    if (opened && !opened.wrapper.contains(event.target) && !opened.popup.contains(event.target))
    {
      opened.close();
    }
  });
  window.addEventListener("resize", () => opened?.position());
  window.addEventListener("scroll", () => opened?.position(), true);
  const observer = new MutationObserver(() =>
  {
    if (!scanQueued)
    {
      scanQueued = true;
      requestAnimationFrame(() =>
      {
        scanQueued = false;
        enhanceSelects();
      });
    }
  });

  function initialize()
  {
    enhanceSelects();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.adminControls =
  {
    enhanceSelects,
    getControl: (select) => instances.get(select)?.input || select
  };

  if (document.readyState === "loading")
  {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  }
  else
  {
    initialize();
  }
})();
