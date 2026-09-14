#!/usr/bin/env node

/* Minimal, repository-local Archify orientation-layer drift sync. */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARTIFACT_ROOT = path.join(REPOSITORY_ROOT, "docs", "architecture", "archify");
const DEFAULT_ARTIFACT_ID = "codex-remote-workflow";
const ARTIFACT_CONFIGS = Object.freeze({
  "codex-remote-workflow": Object.freeze({
    sourceName: "codex-remote-workflow.architecture.json",
    artifactName: "codex-remote-workflow.html",
    receiptName: "codex-remote-workflow.receipt.json",
  }),
  "deterministic-reading": Object.freeze({
    sourceName: "deterministic-reading.architecture.json",
    artifactName: "deterministic-reading.html",
    receiptName: "deterministic-reading.receipt.json",
  }),
  "opencode-lab": Object.freeze({
    sourceName: "opencode-lab.architecture.json",
    artifactName: "opencode-lab.html",
    receiptName: "opencode-lab.receipt.json",
  }),
});
const ARCHIFY_VERSION = "2.16.0";
const ARCHIFY_REVISION = "c826e6c3a7abad19c0f3cd1ca57207d54b1ad8de";
const ARCHIFY_SOURCE = "https://github.com/tt-a1i/archify";

function resolveArtifact(argv = []) {
  let id = DEFAULT_ARTIFACT_ID;
  if (argv.length) {
    if (argv.length !== 2 || argv[0] !== "--artifact") throw new Error("artifact_selector_invalid");
    id = argv[1];
  }
  const config = ARTIFACT_CONFIGS[id];
  if (!config) throw new Error("artifact_selector_unknown");
  return {
    id,
    ...config,
    sourceFile: path.join(ARTIFACT_ROOT, config.sourceName),
    artifactFile: path.join(ARTIFACT_ROOT, config.artifactName),
    receiptFile: path.join(ARTIFACT_ROOT, config.receiptName),
  };
}

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

function lastGoodSnapshot(artifact) {
  return {
    artifact: fileFingerprint(artifact.artifactFile),
    receipt: fileFingerprint(artifact.receiptFile),
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

function replaceVerified(artifact, candidateArtifact, candidateReceipt) {
  const rollbackRoot = fs.mkdtempSync(path.join(ARTIFACT_ROOT, ".archify-sync-"));
  const oldArtifact = path.join(rollbackRoot, "artifact.html");
  const oldReceipt = path.join(rollbackRoot, "receipt.json");
  const hadArtifact = fs.existsSync(artifact.artifactFile);
  const hadReceipt = fs.existsSync(artifact.receiptFile);
  if (hadArtifact) fs.copyFileSync(artifact.artifactFile, oldArtifact);
  if (hadReceipt) fs.copyFileSync(artifact.receiptFile, oldReceipt);
  let artifactInstalled = false;
  let receiptInstalled = false;
  try {
    fs.renameSync(candidateArtifact, artifact.artifactFile);
    artifactInstalled = true;
    fs.renameSync(candidateReceipt, artifact.receiptFile);
    receiptInstalled = true;
  } catch (error) {
    try {
      if (artifactInstalled) {
        if (hadArtifact) fs.copyFileSync(oldArtifact, artifact.artifactFile);
        else fs.rmSync(artifact.artifactFile, { force: true });
      }
      if (receiptInstalled) {
        if (hadReceipt) fs.copyFileSync(oldReceipt, artifact.receiptFile);
        else fs.rmSync(artifact.receiptFile, { force: true });
      }
    } catch {
      throw new Error("last_good_rollback_failed");
    }
    throw error;
  } finally {
    fs.rmSync(rollbackRoot, { recursive: true, force: true });
  }
}

function makeReceipt(artifact, previous, delivery, sourceBytes, meaningfulHash, reasons) {
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
    source: artifact.sourceName,
    artifact: artifact.artifactName,
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

function main(argv = process.argv.slice(2)) {
  let artifact = null;
  let before = { artifact: null, receipt: null };
  let temporaryRoot = null;
  try {
    artifact = resolveArtifact(argv);
    before = lastGoodSnapshot(artifact);
    const archifyRoot = assertStableArchify();
    const sourceBytes = fs.readFileSync(artifact.sourceFile);
    const source = JSON.parse(sourceBytes.toString("utf8"));
    const meaningfulHash = meaningfulArchitectureHash(source);
    const previous = fs.existsSync(artifact.receiptFile) ? readJson(artifact.receiptFile) : null;
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
      artifact.sourceFile,
      "--repo-root",
      REPOSITORY_ROOT,
      "--quality",
      "showcase",
      "--json",
    ], "archify_validate");
    if (!validation.ok) throw new Error("archify_validate_failed");

    temporaryRoot = fs.mkdtempSync(path.join(ARTIFACT_ROOT, ".archify-sync-"));
    const candidateArtifact = path.join(temporaryRoot, artifact.artifactName);
    const candidateReceipt = path.join(temporaryRoot, artifact.receiptName);
    const delivery = runArchify(archifyRoot, [
      "deliver",
      "architecture",
      artifact.sourceFile,
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

    writeJson(candidateReceipt, makeReceipt(artifact, previous, delivery, sourceBytes, meaningfulHash, reasons));
    replaceVerified(artifact, candidateArtifact, candidateReceipt);
    console.log(JSON.stringify({
      ok: true,
      status: "updated",
      meaningful_change: reasons.includes("meaningful_architecture_change"),
      reasons,
      preserved_last_good_until_verification: true,
      meaningful_sha256: meaningfulHash,
      artifact: fileFingerprint(artifact.artifactFile),
    }, null, 2));
  } catch (error) {
    const after = artifact ? lastGoodSnapshot(artifact) : before;
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
