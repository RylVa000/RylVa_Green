"use strict";

const fs = require("node:fs");
const entry = JSON.parse(fs.readFileSync(".hallmark/entries/system-parameters-log-entry.json", "utf8"));
const path = ".hallmark/log.json";
const existing = JSON.parse(fs.readFileSync(path, "utf8"));
const entries = existing.filter((item) => item.fingerprint !== entry.fingerprint);
fs.writeFileSync(path, JSON.stringify([entry, ...entries], null, 2) + "\n");
