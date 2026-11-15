"use strict";

// Checkout-specific composition of the existing account map and validator.
window.RylvaCheckoutAddress = (options) =>
{
  const { dialog, content, repository, escapeHtml: escape, icon } = options;
  let addresses = [];
  let selectedId = null;
  let search = "";
  let draft = null;
  let original = "";
  let stage = "picker";
  let errors = {};
  let busy = false;
  let manual = false;
  let map = null;
  let controller = null;
  let mapRevision = 0;
  let viewRevision = 0;
  let message = "";
  let results = [];

  function fullAddress(address)
  {
    return [address.street, address.village, address.district, address.city, address.province, address.postcode].filter(Boolean).join(", ");
  }

  function dispose()
  {
    mapRevision++;
    viewRevision++;
    controller?.abort();
    map?.destroy();
    map = null;
  }

  function validPoint(point)
  {
    return point && Number.isFinite(point.latitude) && Math.abs(point.latitude) <= 90
      && Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180;
  }

  function complete()
  {
    return draft && validPoint(draft.point)
      && ["village", "district", "city", "province"].every((key) => String(draft[key] || "").trim())
      && /^\d{5}$/.test(draft.postcode || "");
  }

  function field(name, label, maximum = 100, type = "text")
  {
    const error = errors[name];
    return `
      <div class="checkout-field">
        <label for="address-${name}">${label}</label>
        <input id="address-${name}" name="${name}" type="${type}"
          value="${escape(draft[name] || "")}" maxlength="${maximum}"
          ${type === "tel" ? 'autocomplete="tel" inputmode="tel"' : 'autocomplete="off"'}
          ${name === "postcode" ? 'inputmode="numeric"' : ""}
          aria-invalid="${Boolean(error)}" ${error ? `aria-describedby="error-${name}"` : ""}>
        ${error ? `<p class="checkout-error" id="error-${name}">${escape(error)}</p>` : ""}
      </div>`;
  }

  function picker()
  {
    stage = "picker";
    draft = null;
    dispose();
    options.show("Pilih Alamat", `
      <div class="checkout-address-tools">
        <label class="checkout-address-search">
          ${icon("search")}
          <span class="visually-hidden">Cari alamat</span>
          <input id="address-search" type="search" placeholder="Cari alamat"
            value="${escape(search)}" autocomplete="off">
        </label>
        <button class="button button-primary" type="button" data-address-action="new"
          ${addresses.length >= 5 ? "disabled" : ""}>Buat Alamat Baru</button>
      </div>
      ${message ? `<p class="checkout-feedback" role="status">${escape(message)}</p>` : ""}
      ${addresses.length >= 5 ? '<p class="checkout-helper">Maksimum 5 alamat. Ubah atau hapus alamat yang ada.</p>' : ""}
      <div id="address-results"></div>
      <div class="checkout-dialog-actions">
        <button class="button button-secondary" type="button" data-address-action="cancel">Batal</button>
        <button class="button button-primary" id="use-address" type="button"
          data-address-action="use" ${!selectedId ? "disabled" : ""}>Gunakan Alamat</button>
      </div>`);
    renderResults();
  }

  function renderResults()
  {
    const visible = addresses.filter((address) =>
      [address.label, address.recipient, fullAddress(address)].join(" ").toLocaleLowerCase("id").includes(search.toLocaleLowerCase("id")));
    const container = content.querySelector("#address-results");
    container.innerHTML = visible.map((address) => `
      <article class="checkout-address-card ${address.id === selectedId ? "is-selected" : ""}">
        <label class="checkout-address-choice">
          <input type="radio" name="shippingAddress" value="${escape(address.id)}"
            ${address.id === selectedId ? "checked" : ""}>
          <span>
            <span class="checkout-address-label">${escape(address.label)}
              ${address.primary ? '<span class="checkout-primary-tag">Alamat utama</span>' : ""}
            </span>
            <span class="checkout-recipient"><strong>${escape(address.recipient)}</strong>
              <span>${escape(address.recipientPhone)}</span>
            </span>
            <span>${escape(address.street)}</span>
            <span class="checkout-helper">${escape([address.village, address.district, address.city, address.province, address.postcode].filter(Boolean).join(" – "))}</span>
            <span class="checkout-pin">${icon("pin")}${validPoint(address.point) ? "Sudah PinPoint" : "Titik lokasi belum ditambahkan"}</span>
          </span>
        </label>
        <div class="checkout-address-card-actions">
          <button class="checkout-text-button" type="button" data-address-action="edit" data-id="${escape(address.id)}">Ubah</button>
          <button class="checkout-text-button" type="button" data-address-action="remove" data-id="${escape(address.id)}">Hapus</button>
        </div>
      </article>`).join("") || `
        <div class="checkout-empty-section">
          <p>${addresses.length ? "Tidak ada alamat yang sesuai pencarian." : "Belum ada alamat tersimpan."}</p>
          ${addresses.length ? '<button class="button button-secondary" type="button" data-address-action="reset">Hapus Pencarian</button>' : ""}
        </div>`;
  }

  function readForm()
  {
    const form = content.querySelector("#checkout-address-form");
    if (!form || !draft)
    {
      return;
    }
    const values = Object.fromEntries(new FormData(form));
    Object.keys(draft).forEach((key) =>
    {
      if (Object.hasOwn(values, key))
      {
        draft[key] = values[key];
      }
    });
    draft.primary = Boolean(values.primary);
  }

  function form()
  {
    dispose();
    stage = "form";
    manual = manual || !complete() || Boolean(Object.keys(errors).length);
    options.show(draft.id ? "Ubah Alamat" : "Tambah Alamat", `
      <form id="checkout-address-form" novalidate>
        <div class="checkout-location-strip">
          ${icon("pin")}
          <div><span class="checkout-helper">${draft.point ? "Alamat berdasar titik lokasi" : "Titik lokasi belum dipilih"}</span>
            <p>${escape(fullAddress(draft) || "Pilih lokasi untuk melengkapi alamat")}</p>
          </div>
          <button class="button button-primary" type="button" data-address-action="map">Ubah</button>
        </div>
        ${message ? `<p class="checkout-feedback" role="status">${escape(message)}</p>` : ""}
        ${field("recipient", "Nama penerima", 100)}
        ${field("recipientPhone", "Nomor HP", 20, "tel")}
        <div class="checkout-field">
          <label for="address-street">Alamat lengkap</label>
          <textarea id="address-street" name="street" rows="2" maxlength="255"
            aria-invalid="${Boolean(errors.street)}" aria-describedby="address-street-help${errors.street ? " error-street" : ""}">${escape(draft.street || "")}</textarea>
          <p id="address-street-help" class="checkout-helper">Nama jalan, nomor rumah, RT/RW atau rincian bangunan. Pastikan sudah benar.</p>
          ${errors.street ? `<p id="error-street" class="checkout-error">${escape(errors.street)}</p>` : ""}
        </div>
        <button class="checkout-text-button" type="button" data-address-action="details"
          aria-controls="address-administrative" aria-expanded="${manual}">${manual ? "Sembunyikan" : "Lihat"} Detail Alamat</button>
        <div class="checkout-form-grid" id="address-administrative" ${manual ? "" : "hidden"}>
          ${field("village", "Kelurahan/Desa")}${field("district", "Kecamatan")}
          ${field("city", "Kota/Kabupaten")}${field("province", "Provinsi")}
          ${field("postcode", "Kode pos", 5)}
        </div>
        ${errors.point ? `<p class="checkout-error" role="alert">${escape(errors.point)}</p>` : ""}
        ${field("label", "Label alamat", 50)}
        <p class="checkout-helper">Contoh: Rumah, Kantor, dan lainnya.</p>
        ${field("note", "Catatan alamat (opsional)", 50)}
        <p class="checkout-helper checkout-counter"><span>Contoh: warna rumah, nomor unit</span><span id="address-note-count">${Array.from(draft.note || "").length}/50</span></p>
        <label class="checkout-check"><input type="checkbox" name="primary" ${draft.primary ? "checked" : ""}>Jadikan Alamat Utama</label>
        <div class="checkout-dialog-actions">
          <button class="button button-secondary" type="button" data-address-action="back">Batal</button>
          <button class="button button-primary checkout-save-address" type="submit" ${busy ? "disabled" : ""}>${busy ? "Menyimpan…" : "Simpan"}</button>
        </div>
      </form>`);
  }

  async function selectPoint(point, resolved = null)
  {
    controller?.abort();
    controller = new AbortController();
    const requestRevision = ++mapRevision;
    draft.point = point;
    ["street", "village", "district", "city", "province", "postcode"].forEach((key) => draft[key] = "");
    map?.select(point);
    const status = content.querySelector("#location-status");
    const useButton = content.querySelector('[data-address-action="map-use"]');
    useButton.disabled = true;
    status.textContent = "Memuat rincian lokasi…";
    try
    {
      const address = resolved || (await window.RylvaAccountMap.reverse(point, controller.signal))[0];
      if (requestRevision !== mapRevision || !dialog.open)
      {
        return;
      }
      for (const fieldName of ["street", "village", "district", "city", "province", "postcode"])
      {
        draft[fieldName] = address?.[fieldName] || "";
      }
      if (repository.scenario === "geocoderPartial")
      {
        draft.postcode = "";
      }
      status.textContent = fullAddress(draft) || "Rincian belum tersedia. Lengkapi alamat secara manual.";
      message = complete() ? "" : "Sebagian rincian lokasi belum tersedia. Lengkapi detail alamat.";
      manual = !complete();
    }
    catch (error)
    {
      if (error.name === "AbortError" || requestRevision !== mapRevision)
      {
        return;
      }
      ["village", "district", "city", "province", "postcode"].forEach((key) => draft[key] = "");
      status.textContent = "Rincian lokasi belum dapat dimuat. Lengkapi detail alamat secara manual.";
      manual = true;
      message = status.textContent;
    }
    finally
    {
      if (requestRevision === mapRevision && stage === "map")
      {
        useButton.disabled = false;
      }
    }
  }

  async function mapView()
  {
    readForm();
    dispose();
    stage = "map";
    options.show("Pilih Titik Lokasi", `
      <div class="checkout-map-layout">
        <div class="checkout-map-search">
          <form id="checkout-location-search">
            <label for="location-query">Cari lokasi</label>
            <div class="checkout-search-row">
              <input id="location-query" type="search" placeholder="Nama jalan atau lokasi" required>
              <button class="button button-primary" type="submit">Cari</button>
            </div>
          </form>
          <div id="location-results"></div>
          <p id="location-status" role="status">${escape(fullAddress(draft) || "Cari lokasi atau pilih titik pada peta.")}</p>
          <button class="button button-secondary" type="button" data-address-action="center">Pilih Titik Tengah Peta</button>
        </div>
        <div id="checkout-location-map" class="checkout-map" aria-label="Peta lokasi"></div>
      </div>
      <div class="checkout-dialog-actions">
        <button class="button button-secondary" type="button" data-address-action="manual">Isi Alamat Manual</button>
        <button class="button button-primary" type="button" data-address-action="map-use">Pilih Lokasi Ini</button>
      </div>`);
    const revision = viewRevision;
    function fallback()
    {
      if (revision !== viewRevision || stage !== "map")
      {
        return;
      }
      manual = true;
      message = "Peta belum dapat digunakan. Detail alamat terbuka untuk dilengkapi. Layanan instan/same-day tetap membutuhkan titik lokasi yang valid.";
      form();
    }
    try
    {
      if (repository.scenario === "mapUnavailable")
      {
        throw new Error("Map unavailable fixture");
      }
      const instance = await window.RylvaAccountMap.mount(content.querySelector("#checkout-location-map"), draft.point,
        (point) => selectPoint(point), fallback);
      if (revision !== viewRevision || stage !== "map")
      {
        instance?.destroy();
        return;
      }
      map = instance;
    }
    catch
    {
      fallback();
    }
  }

  async function submit(formElement)
  {
    if (formElement.id === "checkout-location-search")
    {
      controller?.abort();
      controller = new AbortController();
      const query = content.querySelector("#location-query").value.trim();
      const revision = ++mapRevision;
      const status = content.querySelector("#location-status");
      status.textContent = "Mencari lokasi…";
      try
      {
        results = await window.RylvaAccountMap.search(query, controller.signal);
        if (revision !== mapRevision || stage !== "map")
        {
          return true;
        }
        content.querySelector("#location-results").innerHTML = results.map((result, index) => `
          <button class="checkout-location-result" type="button" data-address-action="result" data-index="${index}">${escape(result.title)}</button>`).join("");
        status.textContent = results.length ? "Pilih hasil lokasi di atas." : "Lokasi tidak ditemukan. Ubah kata pencarian atau isi manual.";
      }
      catch (error)
      {
        if (revision === mapRevision && error.name !== "AbortError")
        {
          manual = true;
          message = "Pencarian lokasi gagal. Lengkapi detail alamat atau coba peta kembali.";
          form();
        }
      }
      return true;
    }
    if (formElement.id !== "checkout-address-form" || busy)
    {
      return false;
    }
    readForm();
    draft.recipientPhone = window.RylvaAccountValidation.normalizePhone(draft.recipientPhone);
    errors = window.RylvaAccountValidation.validate("address", draft, { addressNote: 50 });
    if (draft.point && !validPoint(draft.point))
    {
      errors.point = "Titik lokasi tidak valid. Pilih kembali melalui peta.";
    }
    if (Object.keys(errors).length)
    {
      manual = true;
      message = "Periksa isian alamat yang ditandai.";
      form();
      content.querySelector('[aria-invalid="true"]')?.focus();
      return true;
    }
    busy = true;
    form();
    try
    {
      const saved = await repository.saveAddress(draft);
      addresses = repository.addressBook();
      selectedId = saved.id;
      options.addressesChanged(addresses);
      busy = false;
      message = "Alamat contoh tersimpan. Pilih Gunakan Alamat untuk menggunakannya.";
      picker();
      options.announce(message);
    }
    catch (error)
    {
      busy = false;
      if (error.code === "addressUncertain")
      {
        addresses = repository.addressBook();
        selectedId = error.savedId;
        options.addressesChanged(addresses);
        picker();
        options.announce("Hasil diperiksa: alamat contoh sudah tersimpan satu kali. Pilih Gunakan Alamat.");
      }
      else
      {
        message = error.message;
        form();
      }
    }
    return true;
  }

  function dirty()
  {
    readForm();
    return stage !== "picker" && draft && JSON.stringify(draft) !== original;
  }

  function confirmBack(callback)
  {
    if (!dirty())
    {
      callback();
      return;
    }
    options.confirm("Buang perubahan alamat?", "Perubahan yang belum disimpan akan dibuang.", callback, form);
  }

  async function action(name, element)
  {
    if (busy)
    {
      return;
    }
    if (name === "new" || name === "edit")
    {
      draft = name === "edit" ? structuredClone(addresses.find((address) => address.id === element.dataset.id))
        : { id: null, label: "", recipient: "", recipientPhone: "", street: "", village: "", district: "", city: "", province: "", postcode: "", note: "", primary: false, point: null };
      original = JSON.stringify(draft);
      errors = {};
      manual = !complete();
      message = "";
      form();
    }
    else if (name === "map")
    {
      await mapView();
    }
    else if (name === "center" && map)
    {
      await selectPoint(map.center());
    }
    else if (name === "result")
    {
      const result = results[Number(element.dataset.index)];
      await selectPoint(result.point, result);
    }
    else if (name === "manual" || name === "map-use")
    {
      manual = name === "manual" || !complete();
      form();
    }
    else if (name === "details")
    {
      readForm();
      manual = !manual;
      const administrative = content.querySelector("#address-administrative");
      administrative.hidden = !manual;
      element.setAttribute("aria-expanded", String(manual));
      element.textContent = (manual ? "Sembunyikan" : "Lihat") + " Detail Alamat";
    }
    else if (name === "use")
    {
      const selected = addresses.find((address) => address.id === selectedId);
      if (selected)
      {
        options.select(selected.id);
        options.close();
      }
    }
    else if (name === "back" || name === "cancel")
    {
      confirmBack(name === "cancel" ? options.close : picker);
    }
    else if (name === "reset")
    {
      search = "";
      picker();
    }
    else if (name === "remove")
    {
      options.confirm("Hapus alamat?", "Alamat akan dihapus dari buku alamat contoh. Pesanan yang sudah dibuat tidak berubah.", async () =>
      {
        addresses = await repository.removeAddress(element.dataset.id);
        if (selectedId === element.dataset.id)
        {
          selectedId = null;
        }
        options.addressesChanged(addresses);
        picker();
      }, picker);
    }
  }

  content.addEventListener("input", (event) =>
  {
    if (event.target.id === "address-search")
    {
      search = event.target.value;
      renderResults();
    }
    if (event.target.id === "address-note")
    {
      content.querySelector("#address-note-count").textContent = Array.from(event.target.value).length + "/50";
    }
  });
  content.addEventListener("change", (event) =>
  {
    if (event.target.name === "shippingAddress")
    {
      selectedId = event.target.value;
      content.querySelector("#use-address").disabled = false;
      content.querySelectorAll(".checkout-address-card").forEach((card) =>
      {
        card.classList.toggle("is-selected", card.querySelector('input[name="shippingAddress"]').value === selectedId);
      });
    }
  });

  return {
    action, submit, dirty, dispose, fullAddress,
    get busy()
    {
      return busy;
    },
    open(context)
    {
      addresses = structuredClone(context.addresses);
      selectedId = context.addressId;
      search = "";
      picker();
    },
    reset()
    {
      dispose();
      draft = null;
      stage = "picker";
    },
    requestClose()
    {
      confirmBack(options.close);
    }
  };
};
