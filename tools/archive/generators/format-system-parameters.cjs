"use strict";

const fs = require("node:fs");
const vm = require("node:vm");
const formatter = fs.readFileSync("tools/archive/generators/format-audit.cjs", "utf8");
const wrapSource = formatter.slice(formatter.indexOf("function wrapLine"), formatter.indexOf("for (const path of"));
const context = vm.createContext({});
vm.runInContext(wrapSource, context);

for (const path of
[
  "public/assets/js/staff/superadmin/system-parameters.js",
  "public/assets/js/staff/superadmin/system-parameters-data.js",
  "public/assets/js/shared/admin-settings-nav.js"
])
{
  const text = fs.readFileSync(path, "utf8");
  fs.writeFileSync(path, text.split(/\r?\n/).map(context.wrapLine).join("\n"));
}

const path = "public/system-parameters.html";
const source = fs.readFileSync(path, "utf8").replace(/>\s*</g, ">\n<");
const voidTags = new Set(["meta", "link", "input", "img", "br", "hr", "source", "wbr"]);
let depth = 0;
const lines = source.split(/\r?\n/).map((line) =>
{
  const text = line.trim();
  const startsClosing = text.startsWith("</");

  if (startsClosing)
  {
    depth--;
  }

  const formatted = "  ".repeat(Math.max(0, depth)) + text;
  const tags = [...text.matchAll(/<(\/?)([a-z][a-z0-9-]*)\b[^>]*>/gi)];

  tags.forEach(([tag, closing, name], index) =>
  {
    if (index === 0 && startsClosing)
    {
      return;
    }

    if (!voidTags.has(name.toLowerCase()) && !tag.endsWith("/>"))
    {
      depth += closing ? -1 : 1;
    }
  });

  return formatted;
});
fs.writeFileSync(path, lines.join("\n"));
