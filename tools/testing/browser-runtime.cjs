"use strict";

const path = require("node:path");
const fs = require("node:fs");
const runtimePath = process.env.RYLVA_PUPPETEER_PATH
  || path.resolve(__dirname, "../../.hallmark/runtime/node_modules/puppeteer-core");

fs.mkdirSync(path.resolve(__dirname, "../../storage/reports/hallmark/screenshots"), { recursive: true });
module.exports = require(runtimePath);
