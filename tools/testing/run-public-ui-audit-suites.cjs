"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const OUTPUT = path.resolve(process.env.RYLVA_AUDIT_OUTPUT || "storage/reports/public-ui-audit-2026-11-20");
const BASE_URL = process.env.RYLVA_AUDIT_URL || "http://127.0.0.1:4185";
const SUITES = ["homepage", "catalog", "product-detail", "information-pages", "shipping-information",
  "cancellation-refund", "terms-conditions", "how-to-order", "about", "public-errors",
  "category-products", "category-navigation", "care-guides", "care-guide-detail", "commercial-pages",
  "storefront-sticky", "shared-checkbox", "catalog-gestures", "customer-auth", "wishlist", "cart",
  "checkout", "my-orders", "order-detail", "payment", "account", "bouquet-customizer"];
const SUITE_ENVIRONMENT =
{
  ...process.env,
  RYLVA_INFORMATION_URL: BASE_URL,
  RYLVA_HOME_URL: BASE_URL,
  RYLVA_CATALOG_URL: BASE_URL,
  RYLVA_PRODUCT_DETAIL_URL: BASE_URL,
  RYLVA_STICKY_URL: BASE_URL,
  RYLVA_CHECKBOX_URL: BASE_URL,
  RYLVA_AUTH_URL: BASE_URL,
  RYLVA_WISHLIST_URL: BASE_URL,
  RYLVA_BOUQUET_URL: BASE_URL,
  RYLVA_CART_URL: BASE_URL + "/pages/customer/cart.html",
  RYLVA_CHECKOUT_URL: BASE_URL + "/pages/customer/checkout.html",
  RYLVA_MY_ORDERS_URL: BASE_URL + "/pages/customer/my-orders.html",
  RYLVA_ORDER_PREVIEW_URL: BASE_URL + "/pages/customer/order-detail.html",
  RYLVA_PAYMENT_PREVIEW_URL: BASE_URL + "/pages/customer/payment.html",
  RYLVA_ACCOUNT_URL: BASE_URL + "/pages/customer/account.html",
  RYLVA_SKIP_CAPTURES: "1",
  RYLVA_CARE_SKIP_CAPTURES: "1"
};
fs.mkdirSync(OUTPUT, { recursive: true });
const results = [];
for (const suite of SUITES)
{
  const started = new Date().toISOString();
  const result = spawnSync(process.execPath, ["tests/e2e/browser/verify-" + suite + ".cjs"],
    { cwd: process.cwd(), env: SUITE_ENVIRONMENT, encoding: "utf8", timeout: 300000 });
  const text = result.stdout + result.stderr;
  fs.writeFileSync(path.join(OUTPUT, "suite-" + suite + ".txt"), text);
  const entry = { suite, started, ended: new Date().toISOString(), exit: result.status,
    error: result.error?.message || null, passLines: text.split("\n").filter((line) => line.startsWith("PASS ")).length };
  try
  {
    const parsed = JSON.parse(result.stdout);
    entry.checks = Array.isArray(parsed.checks) ? parsed.checks.length
      : typeof parsed.checks === "number" ? parsed.checks
      : typeof parsed.passed === "number" ? parsed.passed : null;
  }
  catch
  {
    entry.checks = entry.passLines || null;
  }
  results.push(entry);
  fs.writeFileSync(path.join(OUTPUT, "suites.json"), JSON.stringify(results, null, 2));
  console.log(suite + ": " + (result.status === 0 ? "PASS" : "FAIL") + "; " + (entry.checks || "see report") + " groups");
}
