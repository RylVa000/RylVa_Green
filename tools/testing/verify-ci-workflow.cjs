"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const yaml = require("yaml");
const root = path.resolve(__dirname, "../..");
const document = yaml.parseDocument(fs.readFileSync(path.join(root, ".github/workflows/backend-ci.yml"), "utf8"),
{
  uniqueKeys: true
});
assert.deepEqual(document.errors, [], "Workflow YAML must parse without duplicate keys");
const workflow = document.toJS();
assert.ok(Object.hasOwn(workflow.on, "push") && Object.hasOwn(workflow.on, "pull_request"));
assert.ok(!Object.hasOwn(workflow.on, "pull_request_target"), "Fork code must not run with elevated trigger permissions");
assert.deepEqual(workflow.permissions, { contents: "read" });
const job = workflow.jobs.foundation;
assert.match(job.env.DB_NAME, /^rylva_green_[a-z0-9_]+_test$/);
assert.ok(job["timeout-minutes"] > 0 && job["timeout-minutes"] <= 30);
assert.ok(job.strategy.matrix.php.includes("8.2"));
assert.ok(fs.existsSync(path.join(root, "tools/testing/package-lock.json")));
for (const step of job.steps)
{
  if (step.uses?.startsWith("actions/checkout@"))
  {
    assert.equal(step.with["persist-credentials"], false);
  }
  if (step.uses?.startsWith("actions/upload-artifact@"))
  {
    for (const artifactPath of step.with.path.trim().split("\n"))
    {
      assert.ok(artifactPath.startsWith("storage/reports/"), "Only explicit report paths may be uploaded");
      assert.doesNotMatch(artifactPath, /env|cache|migration-error/);
    }
  }
  for (const match of (step.run || "").matchAll(/(?:php|node) ((?:tests|tools|bin)\/[A-Za-z0-9_./-]+\.(?:php|cjs))/g))
  {
    assert.ok(fs.existsSync(path.join(root, match[1])), "Workflow references a missing script: " + match[1]);
  }
}
const report = { passed: true, checks: ["Unique YAML keys", "Read-only workflow permissions",
  "Safe PR trigger", "Isolated test database", "PHP minimum version", "Locked tools",
  "Referenced commands exist", "Report-only artifacts"] };
fs.mkdirSync(path.join(root, "storage/reports/ci"), { recursive: true });
fs.writeFileSync(path.join(root, "storage/reports/ci/workflow.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
