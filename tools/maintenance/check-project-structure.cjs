"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "../..");
const publicRoot = path.join(root, "public");
const reportDirectory = path.join(root, "storage/reports/project-structure");
const missing = [];
let checkedReferences = 0;

function filesIn(directory)
{
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
  {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(target) : [target];
  });
}

function checkReference(file, reference)
{
  if (!reference || /^(#|[a-z][a-z\d+.-]*:|\/\/)/i.test(reference) || reference.includes("${"))
  {
    return;
  }
  const clean = decodeURIComponent(reference.split(/[?#]/)[0]);
  if (!clean)
  {
    return;
  }
  const target = clean.startsWith("/")
    ? path.resolve(publicRoot, `.${clean}`)
    : path.resolve(path.dirname(file), clean);
  checkedReferences += 1;
  if (!fs.existsSync(target))
  {
    missing.push({ file: path.relative(root, file), reference });
  }
}

const publicFiles = filesIn(publicRoot);
const htmlFiles = publicFiles.filter((file) => file.endsWith(".html"));
const cssFiles = publicFiles.filter((file) => file.endsWith(".css"));
const jsFiles = publicFiles.filter((file) => file.endsWith(".js"));
for (const file of htmlFiles)
{
  const content = fs.readFileSync(file, "utf8");
  for (const match of content.matchAll(/\b(?:src|href)\s*=\s*(["'])(.*?)\1/g))
  {
    checkReference(file, match[2]);
  }
}
for (const file of cssFiles)
{
  const content = fs.readFileSync(file, "utf8");
  for (const match of content.matchAll(/url\((['"]?)([^'"()]+)\1\)/g))
  {
    checkReference(file, match[2]);
  }
}
assert.equal(missing.length, 0, `Missing references: ${JSON.stringify(missing)}`);
for (const file of jsFiles)
{
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
}
const manifestFile = path.join(root, "docs/architecture/directory-migration.json");
const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
const refreshManifest = process.argv.includes("--refresh-manifest");
const verifyMigration = process.argv.includes("--verify-migration");
for (const item of manifest.moved)
{
  assert(!fs.existsSync(path.join(root, item.from)), `Old file still exists: ${item.from}`);
  if (!verifyMigration && !refreshManifest && item.to.startsWith("storage/"))
  {
    continue;
  }
  const destination = path.join(root, item.to);
  assert(fs.existsSync(destination), `Moved file missing: ${item.to}`);
  const actualHash = crypto.createHash("sha256").update(fs.readFileSync(destination)).digest("hex");
  if (verifyMigration && /\.(png|jpg|jpeg|webp|ttf|woff2?)$/i.test(item.to))
  {
    assert.equal(actualHash, item.sha256Before, `Binary changed: ${item.to}`);
  }
  if (refreshManifest)
  {
    item.sha256After = actualHash;
  }
  else if (verifyMigration)
  {
    assert.equal(actualHash, item.sha256After, `Moved file changed since manifest: ${item.to}`);
  }
}
if (refreshManifest)
{
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
}
const coverage = fs.readFileSync(path.join(root, "docs/coverage/staff-ui-completion.md"), "utf8");
for (const match of coverage.matchAll(/`([a-z/.-]+\.html)`/g))
{
  assert(fs.existsSync(path.join(publicRoot, match[1])), `Staff page missing: ${match[1]}`);
}
const pageRoutes = require("../../config/preview-pages.json");
assert.equal(Object.values(pageRoutes).length, htmlFiles.length, "Page map and public HTML inventory differ.");
const apacheRules = [...fs.readFileSync(path.join(publicRoot, ".htaccess"), "utf8")
  .matchAll(/^RewriteRule\s+(\S+)\s+(\S+)\s+\[R=302[^\]]*\]/gm)];
for (const [legacy, current] of Object.entries(pageRoutes))
{
  assert(!fs.existsSync(path.join(publicRoot, legacy)), `Root HTML was not moved: ${legacy}`);
  assert(fs.existsSync(path.join(publicRoot, current)), `Page route missing: ${current}`);
  const redirect = apacheRules.find((rule) => new RegExp(rule[1]).test(legacy));
  assert(redirect && legacy.replace(new RegExp(redirect[1]), redirect[2]) === current, `Apache redirect missing: ${legacy}`);
}
assert(!fs.existsSync(path.join(publicRoot, ".hallmark")), "Development evidence is still in public.");
const report =
{
  passed: true,
  publicPages: htmlFiles.length,
  stylesheets: cssFiles.length,
  javascriptFiles: jsFiles.length,
  checkedReferences,
  movedFiles: manifest.moved.length,
  missingReferences: missing
};
fs.mkdirSync(reportDirectory, { recursive: true });
fs.writeFileSync(path.join(reportDirectory, "static-check.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
