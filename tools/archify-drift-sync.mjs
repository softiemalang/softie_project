#!/usr/bin/env node

/* Minimal, repository-local Archify orientation-layer drift sync. */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARTIFACT_ROOT = path.join(REPOSITORY_ROOT, "docs", "architecture", "archify");
const SOURCE_FILE = path.join(ARTIFACT_ROOT, "codex-remote-workflow.architecture.json");
const ARTIFACT_FILE = path.join(ARTIFACT_ROOT, "codex-remote-workflow.html");
const RECEIPT_FILE = path.join(ARTIFACT_ROOT, "codex-remote-workflow.receipt.json");
const ARCHIFY_VERSION = "2.16.0";
const ARCHIFY_REVISION = "c826e6c3a7abad19c0f3cd1ca57207d54b1ad8de";
const ARCHIFY_SOURCE = "https://github.com/tt-a1i/archify";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort((left, right) => left.localeCompare(right, "en"))
      .map((key) => [key, canonicalize(value[key])]),
  );
}

function meaningfulArchitectureHash(source) {
  return sha256(Buffer.from(JSON.stringify(canonicalize(source))));
}

function fileFingerprint(file) {
  if (!fs.existsSync(file)) return null;
  const data = fs.readFileSync(file);
  return { sha256: sha256(data), bytes: data.length };
}

function lastGoodSnapshot() {
  return {
    artifact: fileFingerprint(ARTIFACT_FILE),
    receipt: fileFingerprint(RECEIPT_FILE),
  };
}

function assertStableArchify() {
  const configuredRoot = process.env.ARCHIFY_ROOT;
  if (!configuredRoot) throw new Error("archify_root_required");
  const root = fs.realpathSync(configuredRoot);
  const packageJson = readJson(path.join(root, "package.json"));
  if (packageJson.version !== ARCHIFY_VERSION) throw new Error("archify_version_mismatch");
  const revision = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  if (revision !== ARCHIFY_REVISION) throw new Error("archify_revision_mismatch");
  return root;
}

function runArchify(archifyRoot, args, label) {
  const cli = path.join(archifyRoot, "bin", "archify.mjs");
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(`${label}_failed`);
  try {
    return JSON.parse(result.stdout.trim());
  } catch {
    throw new Error(`${label}_invalid_result`);
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o644 });
}

function replaceVerified(candidateArtifact, candidateReceipt) {
  const rollbackRoot = fs.mkdtempSync(path.join(ARTIFACT_ROOT, ".archify-sync-"));
  const oldArtifact = path.join(rollbackRoot, "artifact.html");
  const oldReceipt = path.join(rollbackRoot, "receipt.json");
  const hadArtifact = fs.existsSync(ARTIFACT_FILE);
  const hadReceipt = fs.existsSync(RECEIPT_FILE);
  if (hadArtifact) fs.copyFileSync(ARTIFACT_FILE, oldArtifact);
  if (hadReceipt) fs.copyFileSync(RECEIPT_FILE, oldReceipt);
  let artifactInstalled = false;
  let receiptInstalled = false;
  try {
    fs.renameSync(candidateArtifact, ARTIFACT_FILE);
    artifactInstalled = true;
    fs.renameSync(candidateReceipt, RECEIPT_FILE);
    receiptInstalled = true;
  } catch (error) {
    try {
      if (artifactInstalled) {
        if (hadArtifact) fs.copyFileSync(oldArtifact, ARTIFACT_FILE);
        else fs.rmSync(ARTIFACT_FILE, { force: true });
      }
      if (receiptInstalled) {
        if (hadReceipt) fs.copyFileSync(oldReceipt, RECEIPT_FILE);
        else fs.rmSync(RECEIPT_FILE, { force: true });
      }
    } catch {
      throw new Error("last_good_rollback_failed");
    }
    throw error;
  } finally {
    fs.rmSync(rollbackRoot, { recursive: true, force: true });
  }
}

function makeReceipt(previous, delivery, sourceBytes, meaningfulHash, reasons) {
  const previousValidation = previous?.validation || {};
  return {
    schema_version: 1,
    tool: {
      name: "Archify",
      source: ARCHIFY_SOURCE,
      revision: ARCHIFY_REVISION,
      package_version: ARCHIFY_VERSION,
    },
    diagram_type: "architecture",
    quality_profile: "showcase",
    source: "codex-remote-workflow.architecture.json",
    artifact: "codex-remote-workflow.html",
    specification: delivery.specification,
    delivered_artifact: delivery.artifact,
    validation: {
      checks_passed: delivery.validation.checksPassed,
      check_count: delivery.validation.checkCount,
      composition_status: delivery.validation.compositionStatus,
      errors: delivery.validation.errors,
      warnings: delivery.validation.warnings,
      static_html_check: "pass",
      browser_visual_check: previousValidation.browser_visual_check || "not_run_by_drift_sync",
    },
    repository_evidence: {
      url: delivery.evidence.repository,
      revision: delivery.evidence.revision,
      source_references: delivery.evidence.references,
    },
    drift_sync: {
      detector: "canonical-architecture-json-v1",
      meaningful_sha256: meaningfulHash,
      source_input_sha256: sha256(sourceBytes),
      source_input_bytes: sourceBytes.length,
      reasons,
      archify_pin: {
        version: ARCHIFY_VERSION,
        revision: ARCHIFY_REVISION,
      },
    },
  };
}

function main() {
  const before = lastGoodSnapshot();
  let temporaryRoot = null;
  try {
    const archifyRoot = assertStableArchify();
    const sourceBytes = fs.readFileSync(SOURCE_FILE);
    const source = JSON.parse(sourceBytes.toString("utf8"));
    const meaningfulHash = meaningfulArchitectureHash(source);
    const previous = fs.existsSync(RECEIPT_FILE) ? readJson(RECEIPT_FILE) : null;
    const reasons = [];
    if (previous?.drift_sync?.meaningful_sha256 !== meaningfulHash) reasons.push("meaningful_architecture_change");
    if (previous?.tool?.revision !== ARCHIFY_REVISION || previous?.tool?.package_version !== ARCHIFY_VERSION) {
      reasons.push("archify_pin_changed");
    }
    if (!before.artifact || !before.receipt) reasons.push("last_good_artifact_missing");

    if (!reasons.length) {
      console.log(JSON.stringify({
        ok: true,
        status: "unchanged",
        meaningful_change: false,
        preserved_last_good: true,
        meaningful_sha256: meaningfulHash,
        artifact: before.artifact,
      }, null, 2));
      return;
    }

    const validation = runArchify(archifyRoot, [
      "validate",
      "architecture",
      SOURCE_FILE,
      "--repo-root",
      REPOSITORY_ROOT,
      "--quality",
      "showcase",
      "--json",
    ], "archify_validate");
    if (!validation.ok) throw new Error("archify_validate_failed");

    temporaryRoot = fs.mkdtempSync(path.join(ARTIFACT_ROOT, ".archify-sync-"));
    const candidateArtifact = path.join(temporaryRoot, "codex-remote-workflow.html");
    const candidateReceipt = path.join(temporaryRoot, "codex-remote-workflow.receipt.json");
    const delivery = runArchify(archifyRoot, [
      "deliver",
      "architecture",
      SOURCE_FILE,
      candidateArtifact,
      "--repo-root",
      REPOSITORY_ROOT,
      "--quality",
      "showcase",
      "--json",
    ], "archify_deliver");
    if (!delivery.ok || delivery.validation?.errors !== 0 || delivery.validation?.warnings !== 0) {
      throw new Error("archify_delivery_not_verified");
    }

    const staticCheck = runArchify(archifyRoot, ["check", candidateArtifact], "archify_check");
    if (!staticCheck.ok || staticCheck.composition?.status !== "pass") throw new Error("archify_static_check_failed");
    const candidateFingerprint = fileFingerprint(candidateArtifact);
    if (
      !candidateFingerprint ||
      candidateFingerprint.sha256 !== delivery.artifact.sha256 ||
      candidateFingerprint.bytes !== delivery.artifact.bytes
    ) throw new Error("archify_artifact_attestation_mismatch");

    writeJson(candidateReceipt, makeReceipt(previous, delivery, sourceBytes, meaningfulHash, reasons));
    replaceVerified(candidateArtifact, candidateReceipt);
    console.log(JSON.stringify({
      ok: true,
      status: "updated",
      meaningful_change: reasons.includes("meaningful_architecture_change"),
      reasons,
      preserved_last_good_until_verification: true,
      meaningful_sha256: meaningfulHash,
      artifact: fileFingerprint(ARTIFACT_FILE),
    }, null, 2));
  } catch (error) {
    const after = lastGoodSnapshot();
    const preserved = JSON.stringify(after) === JSON.stringify(before);
    console.error(JSON.stringify({
      ok: false,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      preserved_last_good: preserved,
      last_good: before,
    }, null, 2));
    process.exitCode = 1;
  } finally {
    if (temporaryRoot) fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

main();
