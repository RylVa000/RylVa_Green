"use strict";

window.RylvaAccountValidation = (() =>
{
  function normalizePhone(value)
  {
    const number = String(value || "").replace(/[\s().-]/g, "");
    return number.startsWith("0") ? "+62" + number.slice(1)
      : (number.startsWith("62") ? "+" + number : number);
  }

  function validate(action, values, limits = {})
  {
    const errors = {};
    const namePattern = /^[\p{L}\p{N} '\-.]+$/u;
    function name(field)
    {
      const value = String(values[field] || "").trim();
      if (Array.from(value).length < 2 || Array.from(value).length > 100 || !namePattern.test(value))
      {
        errors[field] = "Isi nama 2–100 karakter dengan huruf, angka atau tanda petik, hubung dan titik.";
      }
    }
    function phone(field, required)
    {
      const value = normalizePhone(values[field]);
      if ((required || value) && !/^\+62\d{7,13}$/.test(value))
      {
        errors[field] = "Gunakan format +62 dengan total 9–15 digit, atau masukkan nomor berawalan 08.";
      }
    }
    if (action === "profile")
    {
      name("name");
      phone("phone", false);
    }
    if (["email", "password", "deletion"].includes(action) && values.requiresPassword)
    {
      if (!values.currentPassword)
      {
        errors.currentPassword = "Masukkan kata sandi saat ini untuk melanjutkan.";
      }
    }
    if (action === "email" && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email || "") || values.email.length > 254))
    {
      errors.email = "Masukkan alamat email yang valid, maksimal 254 karakter.";
    }
    if (action === "verifyEmail" && !/^\d{6}$/.test(values.code || ""))
    {
      errors.code = "Masukkan 6 digit kode verifikasi.";
    }
    if (action === "password")
    {
      const length = Array.from(values.newPassword || "").length;
      if (length < 8 || length > 128)
      {
        errors.newPassword = "Gunakan kata sandi 8–128 karakter.";
      }
      if (!values.confirmPassword || values.confirmPassword !== values.newPassword)
      {
        errors.confirmPassword = "Konfirmasi harus sama dengan kata sandi baru.";
      }
    }
    if (action === "address")
    {
      name("recipient");
      phone("recipientPhone", true);
      for (const field of ["label", "street", "village", "district", "city", "province"])
      {
        const value = String(values[field] || "").trim();
        const maximum = field === "label" ? 50 : (field === "street" ? 255 : 100);
        if (!value || Array.from(value).length > maximum || (field === "street" && value.length < 10))
        {
          errors[field] = field === "street" ? "Isi alamat lengkap 10–255 karakter." : "Lengkapi bidang ini sesuai batas karakter.";
        }
      }
      if (!/^\d{5}$/.test(values.postcode || ""))
      {
        errors.postcode = "Masukkan kode pos 5 digit.";
      }
      if (Array.from(values.note || "").length > (limits.addressNote || 50))
      {
        errors.note = "Catatan alamat maksimal " + (limits.addressNote || 50) + " karakter.";
      }
      if (values.requiresPoint && !values.point)
      {
        errors.point = "Pilih titik lokasi untuk layanan instan atau same-day.";
      }
    }
    return errors;
  }

  return { normalizePhone, validate };
})();
