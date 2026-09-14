import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { runFreshnessCheck } from "../tools/archify-freshness-check.mjs";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const artifactFiles = [
  "docs/architecture/archify/codex-remote-workflow.architecture.json",
  "docs/architecture/archify/codex-remote-workflow.html",
  "docs/architecture/archify/codex-remote-workflow.receipt.json",
  "docs/architecture/archify/deterministic-reading.architecture.json",
  "docs/architecture/archify/deterministic-reading.html",
  "docs/architecture/archify/deterministic-reading.receipt.json",
  "docs/architecture/archify/opencode-lab.architecture.json",
  "docs/architecture/archify/opencode-lab.html",
  "docs/architecture/archify/opencode-lab.receipt.json",
];

function fileFingerprint(relativePath) {
  const bytes = fs.readFileSync(path.join(repositoryRoot, relativePath));
  return { bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
}

test("freshness check reports all Archify maps current without changing artifact bytes", () => {
  const before = artifactFiles.map(fileFingerprint);
  const report = runFreshnessCheck(repositoryRoot);
  const after = artifactFiles.map(fileFingerprint);

  assert.equal(report.ok, true);
  assert.equal(report.status, "current");
  assert.deepEqual(report.artifacts.map((artifact) => [artifact.id, artifact.status]), [
    ["codex-remote-workflow", "current"],
    ["deterministic-reading", "current"],
    ["opencode-lab", "current"],
  ]);
  assert.equal(report.artifacts[0].evidenceScope.unchanged, 29);
  assert.equal(report.artifacts[1].evidenceScope.unchanged, 33);
  assert.equal(report.artifacts[2].evidenceScope.unchanged, 37);
  assert.deepEqual(after, before);
  assert.equal(report.authority.artifactMutation, "none");
  assert.equal(report.authority.autoRegeneration, "forbidden");
  assert.equal(report.authority.externalApiCalls, 0);
});

test("freshness check fails safe as unknown when the repository basis cannot be read", () => {
  const report = runFreshnessCheck(path.join("/private/tmp", "archify-freshness-missing-repository"));

  assert.equal(report.ok, false);
  assert.equal(report.status, "unknown");
  assert.deepEqual(report.artifacts.map((artifact) => artifact.status), ["unknown", "unknown", "unknown"]);
  assert.ok(report.artifacts.every((artifact) => artifact.canonicalFallback === "canonical_code_contracts_tests"));
  assert.equal(report.authority.unknownNeverPromoted, true);
  assert.equal(report.authority.artifactMutation, "none");
});
