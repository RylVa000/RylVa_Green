"use strict";

const fs = require("node:fs");
const path = require("node:path");
const runtime = require("./browser-runtime.cjs");
const BASE_URL = process.env.RYLVA_AUDIT_URL || "http://127.0.0.1:4185";
const OUTPUT = path.resolve(process.env.RYLVA_AUDIT_OUTPUT || "storage/reports/public-ui-audit-2026-11-20");
const WIDTHS = [1440, 768, 390, 320];
const QUERY_BY_NAME =
{
  "category": "category=plants",
  "product-detail": "product=monstera",
  "care-guide-detail": "guide=monstera",
  "cart": "preview=cart&state=normal",
  "checkout": "preview=checkout&state=normal",
  "wishlist": "preview=wishlist&state=ready",
  "bouquet-customizer": "preview=bouquet&state=normal",
  "account": "state=normal",
  "my-orders": "state=normal",
  "order-detail": "state=shipping",
  "payment": "state=pending"
};

function inspectDocument()
{
  function visible(element)
  {
    return element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
      && element.getBoundingClientRect().width > 0
      && element.getBoundingClientRect().height > 0;
  }

  function selector(element)
  {
    return element.id ? "#" + element.id
      : element.tagName.toLowerCase() + [...element.classList].slice(0, 3).map((name) => "." + name).join("");
  }

  function label(element)
  {
    const labelled = (element.getAttribute("aria-labelledby") || "").split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent || "").join(" ");
    return (element.getAttribute("aria-label") || labelled.trim()
      || [...(element.labels || [])].map((item) => item.textContent).join(" ")
      || element.textContent || element.getAttribute("alt") || element.title || "")
      .replace(/\s+/g, " ").trim();
  }

  function color(value)
  {
    const values = value.match(/[\d.]+/g)?.map(Number);
    return values?.length >= 3 ? [...values.slice(0, 3), values[3] ?? 1] : null;
  }

  function composite(front, back)
  {
    const alpha = front[3] + back[3] * (1 - front[3]);
    if (alpha === 0)
    {
      return [0, 0, 0, 0];
    }
    return [...front.slice(0, 3).map((part, index) =>
      (part * front[3] + back[index] * back[3] * (1 - front[3])) / alpha), alpha];
  }

  function luminance(value)
  {
    const parts = value.slice(0, 3).map((part) =>
    {
      const normalized = part / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return parts[0] * 0.2126 + parts[1] * 0.7152 + parts[2] * 0.0722;
  }

  function background(element)
  {
    let result = [0, 0, 0, 0];
    for (let parent = element; parent; parent = parent.parentElement)
    {
      const style = getComputedStyle(parent);
      if (style.backgroundImage !== "none" || Number(style.opacity) < 1)
      {
        return null;
      }
      const fill = color(style.backgroundColor);
      if (fill)
      {
        result = composite(result, fill);
      }
      if (result[3] >= 0.999)
      {
        return result;
      }
    }
    return composite(result, [255, 255, 255, 1]);
  }

  const elements = [...document.body.querySelectorAll("*")].filter(visible);
  const textElements = elements.filter((element) => [...element.childNodes]
    .some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()));
  const contrast = [];
  const tinyText = [];
  const fontCounts = {};
  for (const element of textElements)
  {
    const style = getComputedStyle(element);
    const size = parseFloat(style.fontSize);
    const text = element.textContent.trim().replace(/\s+/g, " ").slice(0, 110);
    fontCounts[style.fontFamily] = (fontCounts[style.fontFamily] || 0) + 1;
    if (size < 11 && !element.closest(".storefront-copyright"))
    {
      tinyText.push({ selector: selector(element), text, size });
    }
    const back = background(element);
    const foreground = color(style.color);
    if (!back || !foreground || element.closest("button:disabled, [aria-disabled='true']"))
    {
      continue;
    }
    const front = composite(foreground, back);
    const values = [luminance(front), luminance(back)].sort((a, b) => b - a);
    const ratio = (values[0] + 0.05) / (values[1] + 0.05);
    const threshold = size >= 24 || size >= 18.66 && Number(style.fontWeight) >= 700 ? 3 : 4.5;
    if (ratio + 0.01 < threshold)
    {
      contrast.push({ selector: selector(element), text, size, ratio: +ratio.toFixed(2), threshold,
        foreground: style.color, background: back.slice(0, 3).map(Math.round) });
    }
  }

  const controls = elements.filter((element) =>
    element.matches("a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button]")
    && !element.matches(":disabled"));
  const touchTargets = controls.map((element) =>
  {
    let bounds = element.getBoundingClientRect();
    if (element.matches("input[type=checkbox], input[type=radio]") && element.labels?.length)
    {
      const labelBounds = element.labels[0].getBoundingClientRect();
      bounds = { left: Math.min(bounds.left, labelBounds.left), right: Math.max(bounds.right, labelBounds.right),
        top: Math.min(bounds.top, labelBounds.top), bottom: Math.max(bounds.bottom, labelBounds.bottom) };
      bounds.width = bounds.right - bounds.left;
      bounds.height = bounds.bottom - bounds.top;
    }
    const inline = getComputedStyle(element).display === "inline" && Boolean(element.closest("p, li"));
    return { selector: selector(element), label: label(element).slice(0, 100),
      width: +bounds.width.toFixed(1), height: +bounds.height.toFixed(1), inline,
      left: bounds.left, top: bounds.top, right: bounds.right, bottom: bounds.bottom };
  }).filter((item) => !item.inline && (item.width < 44 || item.height < 44));

  const overflow = elements.filter((element) =>
  {
    const rect = element.getBoundingClientRect();
    return (rect.left < -2 || rect.right > innerWidth + 2)
      && !element.closest(".storefront-category-links, .home-hero-track, .home-hero-slide, .home-category-track")
      && !element.matches(".skip-link, svg, svg *")
      && !element.closest("[aria-hidden=true]");
  }).map((element) => ({ selector: selector(element), text: label(element).slice(0, 70),
    left: Math.round(element.getBoundingClientRect().left), right: Math.round(element.getBoundingClientRect().right) }));

  const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(visible).map((element) =>
  {
    const style = getComputedStyle(element);
    return { level: Number(element.tagName[1]), text: element.textContent.trim(), selector: selector(element),
      size: style.fontSize, weight: style.fontWeight, lineHeight: style.lineHeight,
      color: style.color, align: style.textAlign, font: style.fontFamily };
  });
  const duplicateIds = [...new Set([...document.querySelectorAll("[id]")].map((item) => item.id))]
    .filter((id) => document.querySelectorAll("[id='" + CSS.escape(id) + "']").length > 1);
  const images = [...document.images].map((element) =>
    ({ src: element.getAttribute("src"), alt: element.getAttribute("alt"), loaded: element.complete && element.naturalWidth > 0,
      lazy: element.loading === "lazy", width: element.getAttribute("width"), height: element.getAttribute("height") }));
  const banner = document.querySelector(".policy-banner, .info-header, .info-headerkontak");
  const main = document.querySelector("main");
  return {
    title: document.title, lang: document.documentElement.lang,
    documentWidth: document.documentElement.scrollWidth, width: innerWidth,
    height: document.documentElement.scrollHeight, mainCount: document.querySelectorAll("main").length,
    headings, duplicateIds, contrast, tinyText, touchTargets, overflow, fontCounts, images,
    missingControlNames: controls.filter((element) => !label(element)).map(selector),
    missingLabels: controls.filter((element) => element.matches("input:not([type=submit]):not([type=button]),textarea,select")
      && !label(element)).map(selector),
    links: [...document.querySelectorAll("a[href]")].map((element) =>
      ({ href: element.href, text: label(element), target: element.target, rel: element.rel })),
    headerLinks: [...document.querySelectorAll("header a[href],header button[data-storefront-page]")]
      .map((element) => ({ text: label(element), href: element.getAttribute("href"), legacy: element.dataset.storefrontPage })),
    banner: banner ? { selector: selector(banner), background: getComputedStyle(banner).background,
      height: banner.getBoundingClientRect().height } : null,
    mainBounds: main ? { left: main.getBoundingClientRect().left, right: main.getBoundingClientRect().right } : null,
    resources: performance.getEntriesByType("resource").map((entry) =>
      ({ url: entry.name, type: entry.initiatorType, transfer: entry.transferSize, decoded: entry.decodedBodySize })),
    loadingRegions: [...document.querySelectorAll("main [aria-busy=true]")].map(selector)
  };
}

async function audit()
{
  fs.mkdirSync(path.join(OUTPUT, "screenshots"), { recursive: true });
  const manifest = ["public", "customer", "auth"].flatMap((area) =>
    fs.readdirSync(path.resolve("public/pages", area)).filter((name) => name.endsWith(".html") && name !== "staff-login.html")
      .map((file) =>
      {
        const name = path.basename(file, ".html");
        const query = area === "auth" ? "preview=auth&state=normal" : QUERY_BY_NAME[name];
        return { area, name, path: "/pages/" + area + "/" + file + (query ? "?" + query : "") };
      }));
  const browser = await runtime.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true, pipe: true, userDataDir: path.join(OUTPUT, "chrome") });
  const results = [];
  try
  {
    for (const entry of manifest)
    {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      page.setDefaultTimeout(12000);
      const errors = [];
      const failedResources = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("dialog", (dialog) => dialog.dismiss());
      page.on("response", (response) =>
      {
        if (response.status() >= 400 && response.request().resourceType() !== "document")
        {
          failedResources.push({ url: response.url(), status: response.status() });
        }
      });
      const result = { ...entry, errors, failedResources, viewports: [] };
      try
      {
        await page.setViewport({ width: 1440, height: 1000 });
        const response = await page.goto(BASE_URL + entry.path, { waitUntil: "networkidle0" });
        result.status = response.status();
        await page.waitForFunction(() => !document.querySelector("main [aria-busy=true]"), { timeout: 10000 })
          .catch(() => undefined);
        await page.evaluate(() => document.fonts.ready);
        for (const width of WIDTHS)
        {
          await page.setViewport({ width, height: width < 700 ? 844 : 1000 });
          await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
          await new Promise((resolve) => setTimeout(resolve, 450));
          const snapshot = await page.evaluate(inspectDocument);
          snapshot.width = width;
          if (process.env.RYLVA_AUDIT_SKIP_CAPTURES !== "1" && [1440, 390].includes(width))
          {
            const prefix = path.join(OUTPUT, "screenshots", entry.name + "-" + width);
            await page.screenshot({ path: prefix + "-top.png" });
            for (let offset = 0; offset < snapshot.height; offset += 700)
            {
              await page.evaluate((value) => scrollTo({ top: value, behavior: "instant" }), offset);
              await new Promise((resolve) => setTimeout(resolve, 45));
            }
            await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
            await new Promise((resolve) => setTimeout(resolve, 450));
            await page.screenshot({ path: prefix + "-full.png", fullPage: true });
          }
          result.viewports.push(snapshot);
        }
        await page.setViewport({ width: 390, height: 844 });
        await page.goto(BASE_URL + entry.path, { waitUntil: "networkidle0" });
        await page.evaluate(() => document.fonts.ready);
        result.keyboard = [];
        for (let index = 0; index < 3; index++)
        {
          await page.keyboard.press("Tab");
          result.keyboard.push(await page.evaluate(() =>
          {
            const element = document.activeElement;
            const style = getComputedStyle(element);
            const bounds = element.getBoundingClientRect();
            return { tag: element.tagName, id: element.id, text: (element.textContent || element.getAttribute("aria-label") || "").trim().slice(0, 60),
              outline: style.outline, shadow: style.boxShadow, top: bounds.top, left: bounds.left, right: bounds.right };
          }));
        }
      }
      catch (error)
      {
        result.auditError = error.message;
      }
      results.push(result);
      fs.writeFileSync(path.join(OUTPUT, "observations.json"), JSON.stringify({ manifest, results }, null, 2));
      console.log(entry.name + ": " + result.status + "; " + result.viewports.length + " widths; " + errors.length + " errors");
      await context.close();
    }
  }
  finally
  {
    await browser.close();
  }
  const summary = results.map((entry) => ({ name: entry.name, status: entry.status, widths: entry.viewports.length,
    overflow: entry.viewports.filter((view) => view.documentWidth > view.width + 1).map((view) => view.width),
    h1: entry.viewports[0]?.headings.filter((item) => item.level === 1).length,
    contrasts: entry.viewports[0]?.contrast.length, errors: entry.errors, auditError: entry.auditError }));
  fs.writeFileSync(path.join(OUTPUT, "summary.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

module.exports = { inspectDocument };

if (require.main === module)
{
  audit().catch((error) =>
  {
    console.error(error);
    process.exitCode = 1;
  });
}
