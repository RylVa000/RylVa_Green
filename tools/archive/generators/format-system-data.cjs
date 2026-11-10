"use strict";

const fs = require("node:fs");
const vm = require("node:vm");
const path = "public/assets/js/staff/superadmin/system-parameters-data.js";
let source = fs.readFileSync(path, "utf8");
const context = vm.createContext({ window: {} });
vm.runInContext(source, context);
const data = JSON.parse(JSON.stringify(context.window.systemParameterData));
const original = JSON.stringify(data);
const effects = JSON.parse(fs.readFileSync("storage/reports/hallmark/reports/system-parameter-effects.json", "utf8"));

data.parameters.forEach((item) =>
{
  item.effect = effects[item.code] || item.effect;
});

function valueCode(value, depth)
{
  const spaces = " ".repeat(depth);

  if (typeof value === "string")
  {
    const chunks = [];
    let remainder = value;
    const limit = Math.max(60, 110 - depth);

    while (remainder.length > limit)
    {
      let split = remainder.lastIndexOf(" ", limit);

      if (split < 1)
      {
        break;
      }

      split++;
      chunks.push(JSON.stringify(remainder.slice(0, split)));
      remainder = remainder.slice(split);
    }

    chunks.push(JSON.stringify(remainder));
    return chunks.join(` +\n${spaces}`);
  }

  if (Array.isArray(value))
  {
    return `[\n${value.map((entry) => `${spaces}  ${valueCode(entry, depth + 2)}`).join(",\n")}\n${spaces}]`;
  }

  if (value && typeof value === "object")
  {
    const entries = Object.entries(value).map(([key, entry]) =>
    {
      return `${spaces}  ${key}: ${valueCode(entry, depth + 2)}`;
    });
    return `{\n${entries.join(",\n")}\n${spaces}}`;
  }

  return JSON.stringify(value);
}

function callCode(name, args, depth, multiline = false)
{
  const spaces = " ".repeat(depth);
  const compact = `${name}(${args.join(", ")})`;

  if (!multiline && !compact.includes("\n") && depth + compact.length <= 115)
  {
    return compact;
  }

  return `${name}(\n${args.map((argument) => `${spaces}  ${argument}`).join(",\n")}\n${spaces})`;
}

const parameterCode = data.parameters.map((item) =>
{
  const fields = item.fields.map((field) =>
  {
    const options = Object.fromEntries(Object.entries(field).filter(([key, value]) =>
    {
      return !["key", "label", "value", "unit"].includes(key)
        && !(key === "type" && value === "number")
        && !(key === "min" && value === 1)
        && !(key === "step" && value === 1);
    }));
    const args = [field.key, field.label, field.value, field.unit].map((value) => valueCode(value, 10));

    if (Object.keys(options).length)
    {
      args.push(valueCode(options, 10));
    }

    return `        ${callCode("field", args, 8)}`;
  });
  const args = [item.code, item.key, item.group, item.name, item.description].map((value) => valueCode(value, 6));
  args.push(`[\n${fields.join(",\n")}\n      ]`);
  const options = Object.fromEntries(Object.entries(item).filter(([key]) =>
  {
    return !["code", "key", "group", "name", "description", "fields"].includes(key);
  }));
  args.push(valueCode(options, 6));
  return `    ${callCode("parameter", args, 4, true)}`;
});
const start = source.indexOf("  const parameters =");
const end = source.indexOf("\n  parameters.forEach", start);
source = source.slice(0, start) + `  const parameters =\n  [\n${parameterCode.join(",\n")}\n  ];\n` + source.slice(end);
const groupStart = source.indexOf("  const groups =");
const groupEnd = source.indexOf("\n  function parameter", groupStart);
source = source.slice(0, groupStart) + `  const groups =\n  ${valueCode(data.groups, 2)};\n` + source.slice(groupEnd);
const formatted = vm.createContext({ window: {} });
vm.runInContext(source, formatted);

const expected = JSON.stringify(data);

if (JSON.stringify(formatted.window.systemParameterData) !== expected)
{
  throw new Error("Formatting altered parameter data");
}

fs.writeFileSync(path, source);
console.log(original === expected ? "Parameter data unchanged; declarations formatted for readability."
  : "Policy effect descriptions updated; parameter values and field schemas preserved.");
