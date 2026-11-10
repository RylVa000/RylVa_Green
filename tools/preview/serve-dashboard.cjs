"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../../public");
const routes = require("../../config/preview-pages.json");
const port = Number(process.env.RYLVA_PREVIEW_PORT || 4178);
const types =
{
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ttf": "font/ttf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

const server = http.createServer((request, response) =>
{
  if (!["GET", "HEAD"].includes(request.method))
  {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }
  let url;
  let pathname;
  try
  {
    url = new URL(request.url, "http://127.0.0.1");
    pathname = decodeURIComponent(url.pathname);
  }
  catch
  {
    response.writeHead(400);
    response.end("Invalid address");
    return;
  }
  const pageName = pathname.slice(1);
  const legacy = Object.hasOwn(routes, pageName) ? routes[pageName] : null;
  if (legacy || pathname === "/")
  {
    response.writeHead(302,
    {
      Location: `/${legacy || routes["admin-dashboard.html"]}${url.search}`,
      "Cache-Control": "no-store"
    });
    response.end();
    return;
  }
  const target = path.resolve(root, `.${pathname}`);
  if (!target.startsWith(`${root}${path.sep}`) || pathname.split("/").some((part) => part.startsWith(".")))
  {
    response.writeHead(403);
    response.end("Access denied");
    return;
  }
  if (!Object.hasOwn(types, path.extname(target)))
  {
    response.writeHead(404);
    response.end("Page not found");
    return;
  }
  fs.readFile(target, (error, data) =>
  {
    if (error)
    {
      response.writeHead(404);
      response.end("Page not found");
      return;
    }
    response.writeHead(200,
    {
      "Content-Type": types[path.extname(target)],
      "Cache-Control": "no-store"
    });
    response.end(request.method === "HEAD" ? undefined : data);
  });
});

server.listen(port, "127.0.0.1", () =>
{
  console.log(`Staff preview: http://127.0.0.1:${port}/pages/staff/admin-dashboard.html`);
});
