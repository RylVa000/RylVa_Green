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
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

const publicErrorPages =
{
  "/pages/public/error-403.html": 403,
  "/pages/public/error-404.html": 404,
  "/pages/public/error-500.html": 500,
  "/pages/public/maintenance.html": 503
};

function sendPublicError(request, response, status, pathname)
{
  const isDocument = request.headers.accept?.includes("text/html")
    || !path.extname(pathname) || path.extname(pathname) === ".html";
  const isStaff = pathname.startsWith("/pages/staff/")
    || pathname.startsWith("/pages/superadmin/");
  if (!isDocument || isStaff || pathname.startsWith("/assets/")
    || pathname.startsWith("/__preview/"))
  {
    response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
    response.end(request.method === "HEAD" ? undefined
      : (status === 403 ? "Access denied" : "Page not found"));
    return;
  }
  const errorPath = Object.keys(publicErrorPages).find((route) => publicErrorPages[route] === status);
  fs.readFile(path.join(root, errorPath), (error, data) =>
  {
    response.writeHead(status,
    {
      "Content-Type": error ? "text/plain; charset=utf-8" : "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    });
    response.end(request.method === "HEAD" ? undefined : (error ? "Page unavailable" : data));
  });
}

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
      Location: `/${legacy || routes["home.html"]}${url.search}`,
      "Cache-Control": "no-store"
    });
    response.end();
    return;
  }
  const workbenchPages =
  {
    "/__preview/payment": "payment-states.html",
    "/__preview/order-detail": "order-detail-states.html",
    "/__preview/my-orders": "my-orders-states.html",
    "/__preview/account": "account-states.html",
    "/__preview/cart": "cart-states.html",
    "/__preview/checkout": "checkout-states.html",
    "/__preview/customer-auth": "customer-auth-states.html",
    "/__preview/catalog": "catalog-states.html",
    "/__preview/product-detail": "product-detail-states.html",
    "/__preview/homepage": "homepage-states.html",
    "/__preview/bouquet": "bouquet-states.html",
    "/__preview/wishlist": "wishlist-states.html",
    "/__preview/shipping-information": "shipping-information-states.html",
    "/__preview/cancellation-refund": "cancellation-refund-states.html",
    "/__preview/terms-conditions": "terms-conditions-states.html",
    "/__preview/how-to-order": "how-to-order-states.html",
    "/__preview/about": "about-states.html",
    "/__preview/public-errors": "public-error-states.html",
    "/__preview/category-products": "category-products-states.html",
    "/__preview/care-guides": "care-guides-states.html",
    "/__preview/care-guide-detail": "care-guide-detail-states.html",
    "/__preview/collections": "collections-states.html"
  };
  const workbenchFile = Object.hasOwn(workbenchPages, pathname) ? workbenchPages[pathname] : null;
  const isWorkbench = Boolean(workbenchFile);
  const target = isWorkbench
    ? path.resolve(__dirname, workbenchFile)
    : path.resolve(root, `.${pathname}`);
  if ((!isWorkbench && !target.startsWith(`${root}${path.sep}`))
    || pathname.split("/").some((part) => part.startsWith(".")))
  {
    sendPublicError(request, response, 403, pathname);
    return;
  }
  if (!Object.hasOwn(types, path.extname(target)))
  {
    sendPublicError(request, response, 404, pathname);
    return;
  }
  fs.readFile(target, (error, data) =>
  {
    if (error)
    {
      const status = error.code === "EACCES" ? 403
        : (["ENOENT", "ENOTDIR", "EISDIR"].includes(error.code) ? 404 : 500);
      sendPublicError(request, response, status, pathname);
      return;
    }
    response.writeHead(publicErrorPages[pathname] || 200,
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
