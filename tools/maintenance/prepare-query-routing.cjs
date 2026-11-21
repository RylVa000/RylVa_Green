"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const acorn = require("../testing/node_modules/acorn");
const eslintScope = require("../testing/node_modules/eslint-scope");

function adaptJavaScript(source)
{
  const ast = acorn.parse(source, { ecmaVersion: "latest", sourceType: "script", ranges: true });
  const parents = new Map();
  function visit(node, parent)
  {
    if (!node || typeof node.type !== "string")
    {
      return;
    }
    parents.set(node, parent);
    for (const value of Object.values(node))
    {
      if (Array.isArray(value))
      {
        value.forEach((child) => visit(child, node));
      }
      else if (value && typeof value === "object")
      {
        visit(value, node);
      }
    }
  }
  visit(ast, null);
  const scopes = eslintScope.analyze(ast, { ecmaVersion: 2025, sourceType: "script", optimistic: true });
  const edits = new Map();
  const targets = ["location", "history", "URL"];
  for (const reference of scopes.globalScope.through)
  {
    const identifier = reference.identifier;
    let target = identifier;
    let property = identifier.name;
    const parent = parents.get(identifier);
    if (["window", "document", "globalThis"].includes(identifier.name) && parent?.type === "MemberExpression"
      && parent.object === identifier && !parent.computed)
    {
      target = parent;
      property = parent.property.name;
      if (identifier.name === "document" && property !== "referrer")
      {
        continue;
      }
    }
    else if (!targets.includes(property))
    {
      continue;
    }
    if (!targets.includes(property) && property !== "referrer")
    {
      continue;
    }
    const replacement = "window.RylvaQueryRouting." + property;
    edits.set(target.start, { start: target.start, end: target.end, replacement });
  }
  let result = source;
  for (const edit of [...edits.values()].sort((left, right) => right.start - left.start))
  {
    result = result.slice(0, edit.start) + edit.replacement + result.slice(edit.end);
  }
  acorn.parse(result, { ecmaVersion: "latest", sourceType: "script" });
  return result;
}

function adaptHtml(source, logicalPath, origin)
{
  let result = source.replace(/<base\b[^>]*>/gi, "");
  result = result.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi, (match, opening, body, closing) =>
  {
    return /\bsrc\s*=|\btype\s*=\s*["'](?:application|text)\/(?:ld\+)?json/i.test(opening)
      ? match : opening + adaptJavaScript(body) + closing;
  });
  result = result.replace(/\bhref=(['"])([^'"<>]*)\1/gi, (match, quote, href) =>
  {
    if (!href || href.startsWith("#"))
    {
      return match;
    }
    const url = new URL(href.replaceAll("&amp;", "&"), new URL(logicalPath, origin));
    if (url.origin !== origin || (!url.pathname.endsWith(".html") && !["/", "/index.php"].includes(url.pathname)))
    {
      return match;
    }
    const query = new URLSearchParams({ route: url.pathname });
    url.searchParams.forEach((value, key) => query.append(key, value));
    return "href=" + quote + ("/index.php?" + query + url.hash).replaceAll("&", "&amp;") + quote;
  });
  return result.replace(/<head>/i, '<head>\n  <script src="/assets/js/shared/query-routing.js" data-logical-page="'
    + logicalPath + '"></script>');
}

function prepare(planPath)
{
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  let scripts = 0;
  let documents = 0;
  for (const file of plan.files)
  {
    let content;
    if (file.area === "assets" && file.remote.endsWith(".js") && !file.remote.endsWith("/shared/query-routing.js"))
    {
      content = adaptJavaScript(fs.readFileSync(file.local, "utf8"));
      scripts++;
    }
    else if (file.area === "private" && file.remote.endsWith(".html"))
    {
      const logicalPath = file.remote.slice(file.remote.indexOf("/public/") + 7);
      content = adaptHtml(fs.readFileSync(file.local, "utf8"), logicalPath, "https://rylvagreen.biz.id");
      documents++;
    }
    if (content !== undefined)
    {
      fs.writeFileSync(file.local, content);
      file.sha256 = crypto.createHash("sha256").update(content).digest("hex");
    }
  }
  plan.routingMode = "query";
  plan.adaptedScripts = scripts;
  plan.adaptedDocuments = documents;
  fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
  console.log(JSON.stringify({ routingMode: "query", scripts, documents }));
}

module.exports = { adaptJavaScript, adaptHtml };
if (require.main === module)
{
  prepare(path.resolve(process.argv[2]));
}
