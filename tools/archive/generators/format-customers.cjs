const fs = require("node:fs");

function wrapLine(line)
{
  if (line.length <= 125)
  {
    return line;
  }
  let quote = "";
  let escaped = false;
  const stack = [];
  const groups = [];
  for (let index = 0; index < line.length; index++)
  {
    const character = line[index];
    if (quote)
    {
      if (escaped)
      {
        escaped = false;
      }
      else if (character === "\\")
      {
        escaped = true;
      }
      else if (character === quote)
      {
        quote = "";
      }
      continue;
    }
    if (["\"", "'", "`"].includes(character))
    {
      quote = character;
    }
    else if (["(", "[", "{"].includes(character))
    {
      stack.push({ start: index, commas: [] });
    }
    else if (character === "," && stack.length)
    {
      stack.at(-1).commas.push(index);
    }
    else if ([")", "]", "}"].includes(character) && stack.length)
    {
      const group = stack.pop();
      group.end = index;
      if (group.commas.length && group.end - group.start > 65)
      {
        groups.push(group);
      }
    }
  }
  const group = groups.sort((left, right) => left.start - right.start)[0];
  if (!group)
  {
    return line;
  }
  const indentation = line.match(/^ */)[0];
  const parts = [];
  let start = group.start + 1;
  for (const comma of group.commas)
  {
    parts.push(line.slice(start, comma + 1).trim());
    start = comma + 1;
  }
  parts.push(line.slice(start, group.end).trim());
  const prefix = line.slice(0, group.start + 1).trimEnd();
  const suffix = indentation + line.slice(group.end);
  return [prefix, ...parts.map((part) => wrapLine(indentation + "  " + part)), suffix].join("\n");
}

for (const path of ["public/assets/js/staff/customers/customers.js", "public/assets/js/staff/customers/customers-data.js"])
{
  const text = fs.readFileSync(path, "utf8");
  fs.writeFileSync(path, text.split(/\r?\n/).map(wrapLine).join("\n"));
}
