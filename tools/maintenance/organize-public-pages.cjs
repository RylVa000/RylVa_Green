"use strict";

const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const publicRoot = path.join(root, "public");
const groups =
{
  auth: ["staff-login"],
  staff:
  [
    "admin-dashboard", "orders-queue", "products", "categories-attributes",
    "production-materials", "bouquet-production", "customers", "closure-calendar",
    "operational-report", "staff-profile", "staff-notifications", "staff-help", "staff-status"
  ],
  superadmin:
  [
    "audit-log", "financial-report", "payment-reconciliation",
    "sensitive-approvals", "staff-accounts", "system-parameters"
  ]
};
const routes = {};
for (const [group, names] of Object.entries(groups))
{
  for (const name of names)
  {
    routes[`${name}.html`] = `pages/${group}/${name}.html`;
  }
}
const pending = Object.entries(routes).filter(([name]) => fs.existsSync(path.join(publicRoot, name)));
if (!pending.length || !process.argv.includes("--apply"))
{
  console.log(`Planned page moves: ${pending.length}`);
  process.exit(0);
}
for (const [name, destination] of pending)
{
  const source = path.resolve(publicRoot, name);
  const target = path.resolve(publicRoot, destination);
  if (!source.startsWith(`${publicRoot}${path.sep}`) || !target.startsWith(`${publicRoot}${path.sep}`)
    || fs.existsSync(target) || !fs.lstatSync(source).isFile() || fs.lstatSync(source).isSymbolicLink())
  {
    throw new Error(`Unsafe page move: ${name}`);
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (!fs.realpathSync(path.dirname(target)).startsWith(`${fs.realpathSync(publicRoot)}${path.sep}`))
  {
    throw new Error(`Target outside document root: ${destination}`);
  }
  fs.renameSync(source, target);
}

function walk(directory)
{
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
  {
    const target = path.join(directory, entry.name);
    if (entry.isSymbolicLink())
    {
      return [];
    }
    return entry.isDirectory() ? walk(target) : [target];
  });
}

const names = Object.keys(routes);
const escapePattern = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const namePattern = new RegExp(names.map(escapePattern).join("|"), "g");
const updated = [];
for (const file of [...walk(path.join(publicRoot, "pages")), ...walk(path.join(publicRoot, "assets/js"))])
{
  if (!/\.(html|js)$/.test(file))
  {
    continue;
  }
  const original = fs.readFileSync(file, "utf8");
  let content = original.replace(namePattern, (name, offset) =>
  {
    const preceding = original.slice(Math.max(0, offset - 80), offset);
    if (/[\w/\\.-]$/.test(preceding) || /\.(?:endsWith|includes)\(\s*["'`]$/.test(preceding))
    {
      return name;
    }
    return `../${routes[name].slice(6)}`;
  });
  content = content.replace(/(?<![\w/.])assets\//g, "../../assets/");
  if (content !== original)
  {
    fs.writeFileSync(file, content);
    updated.push(path.relative(root, file).replaceAll(path.sep, "/"));
  }
}

for (const directory of ["tests/e2e/browser", "docs/coverage", "docs/design/surfaces"])
{
  for (const file of walk(path.join(root, directory)))
  {
    if (!/\.(cjs|md)$/.test(file))
    {
      continue;
    }
    const original = fs.readFileSync(file, "utf8");
    let content = original;
    for (const [name, destination] of Object.entries(routes))
    {
      content = content.replaceAll(`public/${name}`, `public/${destination}`);
      if (directory === "docs/coverage")
      {
        content = content.replaceAll(`\`${name}\``, `\`${destination}\``);
      }
    }
    if (content !== original)
    {
      fs.writeFileSync(file, content);
      updated.push(path.relative(root, file).replaceAll(path.sep, "/"));
    }
  }
}
fs.writeFileSync(path.join(root, "config/preview-pages.json"), `${JSON.stringify(routes, null, 2)}\n`);
const manifest =
{
  moved: pending.map(([name, destination]) => ({ from: `public/${name}`, to: `public/${destination}` })),
  updated
};
fs.writeFileSync(path.join(root, "docs/architecture/page-directory-migration.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Organized ${pending.length} HTML pages; updated ${updated.length} files.`);
