"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "../..");
const manifestPath = "docs/architecture/directory-migration.json";
const applyChanges = process.argv.includes("--apply");
const moves = [];
const excludedDirectories = new Set(
[
  ".git", ".agents", ".codex", ".aws",
  "vendor", "node_modules", "runtime"
]);
const textExtensions = new Set(
[
  ".html", ".css", ".js", ".cjs", ".mjs", ".php",
  ".md", ".txt", ".json", ".xml", ".ps1"
]);

function absolute(relative)
{
  const resolved = path.resolve(root, relative);
  if (!resolved.startsWith(`${root}${path.sep}`))
  {
    throw new Error(`Path outside project: ${relative}`);
  }
  let existing = resolved;
  while (!fs.existsSync(existing))
  {
    existing = path.dirname(existing);
  }
  const realRoot = fs.realpathSync(root).toLocaleLowerCase();
  const realExisting = fs.realpathSync(existing).toLocaleLowerCase();
  if (realExisting !== realRoot && !realExisting.startsWith(`${realRoot}${path.sep}`))
  {
    throw new Error(`Resolved path outside project: ${relative}`);
  }
  return resolved;
}

function addMove(from, to)
{
  if (fs.existsSync(absolute(from)))
  {
    if (fs.existsSync(absolute(to)))
    {
      throw new Error(`Destination already exists: ${to}`);
    }
    const source = fs.lstatSync(absolute(from));
    if (!source.isFile() || source.isSymbolicLink())
    {
      throw new Error(`Expected ordinary file: ${from}`);
    }
    moves.push({ from, to });
  }
}

function classifyAsset(name, extension)
{
  if (/^(admin-controls|admin-audit-nav|admin-settings-nav|admin-shell|app|components|design-system|staff-panel)\./.test(name))
  {
    return "shared";
  }
  if (/^(public-storefront|bouquet-customizer|catalog-filter|checkout-map-slot|guest-cart|payment-countdown|product-variant)\./.test(name))
  {
    return "storefront";
  }
  const groups =
  [
    [/^(orders-queue|order-workflows|order-corrections)\./, "orders"],
    [/^(products|taxonomy)(-|\.)/, "catalog"],
    [/^materials(-|\.)/, "inventory"],
    [/^bouquet-(data|editor|production)\./, "production"],
    [/^closure-calendar(-|\.)/, "calendar"],
    [/^customers(-|\.)/, "customers"],
    [/^operational-report(-|\.)/, "reports"],
    [/^staff-accounts(-|\.)/, "accounts"],
    [/^staff-auth\./, "auth"],
    [/^staff-(support|help|notifications|profile|status)(-|\.)/, "support"],
    [/^(audit|superadmin-review|system-parameters)(-|\.)/, "superadmin"],
    [/^staff-dashboard\./, "dashboard"]
  ];
  const match = groups.find(([pattern]) => pattern.test(name));
  if (!match)
  {
    throw new Error(`Unclassified ${extension} asset: ${name}`);
  }
  return `staff/${match[1]}`;
}

for (const extension of ["css", "js"])
{
  const directory = `public/assets/${extension}`;
  for (const entry of fs.readdirSync(absolute(directory), { withFileTypes: true }))
  {
    if (entry.isFile() && entry.name.endsWith(`.${extension}`))
    {
      addMove(`${directory}/${entry.name}`, `${directory}/${classifyAsset(entry.name, extension)}/${entry.name}`);
    }
  }
}
addMove("public/assets/css/admin-dashboard/tokens.css", "public/assets/css/shared/tokens.css");
addMove("public/assets/css/admin-dashboard/base.css", "public/assets/css/shared/base.css");
addMove("public/assets/css/admin-dashboard/dashboard.css", "public/assets/css/staff/dashboard/dashboard.css");
addMove("spesifikasi-proyek.md.md", "docs/specifications/spesifikasi-proyek-v2.6.md");
addMove("DESIGN.txt", "docs/design/archive/DESIGN.txt");
addMove("public/g1.html", "tools/archive/prototypes/g1.html");
addMove("public/tes.html", "tools/archive/prototypes/tes.html");

for (const entry of fs.readdirSync(absolute("docs"), { withFileTypes: true }))
{
  if (!entry.isFile())
  {
    continue;
  }
  if (entry.name.endsWith("-surface.md"))
  {
    addMove(`docs/${entry.name}`, `docs/design/surfaces/${entry.name}`);
  }
  else if (entry.name.endsWith("-coverage.md") || entry.name === "staff-ui-completion.md")
  {
    addMove(`docs/${entry.name}`, `docs/coverage/${entry.name}`);
  }
  else if (entry.name === "admin-dashboard-role-changes.md")
  {
    addMove(`docs/${entry.name}`, `docs/design/decisions/${entry.name}`);
  }
}

for (const entry of fs.readdirSync(absolute(".hallmark"), { withFileTypes: true }))
{
  if (!entry.isFile() || [".gitignore", "log.json", "preflight.json"].includes(entry.name))
  {
    continue;
  }
  const name = entry.name;
  let destination = "";
  if (name.startsWith("verify-") && name.endsWith(".cjs"))
  {
    destination = `tests/e2e/browser/${name}`;
  }
  else if (name.endsWith(".cjs"))
  {
    const group = name.startsWith("capture-") || name.startsWith("serve-") ? "preview" : "archive/generators";
    destination = `tools/${group}/${name}`;
  }
  else if (name.endsWith(".png"))
  {
    destination = `storage/reports/hallmark/screenshots/${name}`;
  }
  else if (name.endsWith(".log"))
  {
    destination = `storage/logs/development/${name}`;
  }
  else if (name.endsWith("-log-entry.json"))
  {
    destination = `.hallmark/entries/${name}`;
  }
  else if (name.includes("preflight") && name.endsWith(".json"))
  {
    destination = `.hallmark/preflights/${name}`;
  }
  else if (name.includes("verification") || name === "system-parameter-effects.json")
  {
    destination = `storage/reports/hallmark/reports/${name}`;
  }
  else
  {
    destination = `tools/archive/design-workbench/${name}`;
  }
  addMove(`.hallmark/${name}`, destination);
}

function walk(directory, visit)
{
  if (!fs.existsSync(directory))
  {
    return;
  }
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }))
  {
    const target = path.join(directory, entry.name);
    if (entry.isSymbolicLink())
    {
      continue;
    }
    if (entry.isDirectory() && !excludedDirectories.has(entry.name))
    {
      walk(target, visit);
    }
    else if (entry.isFile())
    {
      visit(target);
    }
  }
}

walk(absolute("public/.hallmark"), (file) =>
{
  const relative = path.relative(absolute("public/.hallmark"), file).replaceAll(path.sep, "/");
  addMove(`public/.hallmark/${relative}`, `storage/reports/legacy-public-preview/${relative}`);
});

console.log(`Planned file moves: ${moves.length}`);
if (!applyChanges || moves.length === 0)
{
  console.log(moves.length ? "Review this script, then use --apply." : "Project is already organized; no changes made.");
  process.exit(0);
}

const movedPaths = new Map(moves.map((item) => [item.from, item.to]));
const replacements = new Map();
for (const { from, to } of moves)
{
  replacements.set(from, to);
  if (from.includes("/"))
  {
    replacements.set(from.replaceAll("/", "\\"), to.replaceAll("/", "\\"));
    replacements.set(from.replaceAll("/", "\\\\"), to.replaceAll("/", "\\\\"));
  }
  if (from.startsWith("public/assets/"))
  {
    replacements.set(from.slice(7), to.slice(7));
    replacements.set(from.slice(14), to.slice(14));
  }
}
const escapePattern = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const replacementPattern = new RegExp([...replacements.keys()]
  .sort((first, second) => second.length - first.length)
  .map((value) => value === "DESIGN.txt" ? `(?<![\\w/\\\\.-])${escapePattern(value)}` : escapePattern(value))
  .join("|"), "g");
const rewrittenFiles = [];

for (const item of moves)
{
  const source = absolute(item.from);
  const destination = absolute(item.to);
  item.sha256Before = crypto.createHash("sha256").update(fs.readFileSync(source)).digest("hex");
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.renameSync(source, destination);
}

const originalPaths = new Map(moves.map((item) => [item.to, item.from]));
walk(root, (file) =>
{
  const relative = path.relative(root, file).replaceAll(path.sep, "/");
  if (file === __filename || relative === manifestPath || !textExtensions.has(path.extname(file)) || fs.statSync(file).size > 12000000)
  {
    return;
  }
  const buffer = fs.readFileSync(file);
  if (buffer.includes(0))
  {
    return;
  }
  const original = buffer.toString("utf8");
  let content = original;
  if (path.extname(file) === ".css" && originalPaths.has(relative))
  {
    const oldFile = absolute(originalPaths.get(relative));
    content = content.replace(/url\((['"]?)([^'"()]+)\1\)/g, (match, quote, reference) =>
    {
      if (/^(data:|https?:|\/\/|#|\/)/.test(reference))
      {
        return match;
      }
      const oldTarget = path.relative(root, path.resolve(path.dirname(oldFile), reference)).replaceAll(path.sep, "/");
      const newTarget = absolute(movedPaths.get(oldTarget) || oldTarget);
      const next = path.relative(path.dirname(file), newTarget).replaceAll(path.sep, "/");
      return `url(${quote}${next}${quote})`;
    });
  }
  content = content.replace(replacementPattern, (match) => replacements.get(match));
  if (relative.startsWith("tests/e2e/browser/") || relative.startsWith("tools/preview/"))
  {
    const runtime = path.relative(path.dirname(file), absolute("tools/testing/browser-runtime.cjs")).replaceAll(path.sep, "/");
    const reference = runtime.startsWith(".") ? runtime : `./${runtime}`;
    content = content.replace(/require\((['"])\.\/runtime\/node_modules\/puppeteer-core\1\)/g, `require("${reference}")`);
  }
  if (content !== original)
  {
    fs.writeFileSync(file, content, "utf8");
    rewrittenFiles.push(relative);
  }
});

for (const item of moves)
{
  item.sha256After = crypto.createHash("sha256").update(fs.readFileSync(absolute(item.to))).digest("hex");
}
const sourceDirectories = [...new Set(moves.map((item) => path.dirname(absolute(item.from))))]
  .sort((first, second) => second.length - first.length);
for (const directory of sourceDirectories)
{
  if (fs.existsSync(directory) && fs.readdirSync(directory).length === 0)
  {
    fs.rmdirSync(directory);
  }
}
fs.mkdirSync(path.dirname(absolute(manifestPath)), { recursive: true });
fs.writeFileSync(absolute(manifestPath), `${JSON.stringify({ moved: moves, rewrittenFiles }, null, 2)}\n`, "utf8");
console.log(`Moved ${moves.length} files and updated ${rewrittenFiles.length} text references. Manifest: ${manifestPath}`);
