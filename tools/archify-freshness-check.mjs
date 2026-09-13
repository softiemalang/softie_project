#!/usr/bin/env node

/* Deterministic, repository-local Archify freshness check. Read-only by design. */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARTIFACT_ROOT = path.join(REPOSITORY_ROOT, "docs", "architecture", "archify");
const ARCHIFY_PIN = Object.freeze({
  version: "2.16.0",
  revision: "c826e6c3a7abad19c0f3cd1ca57207d54b1ad8de",
});
const ARTIFACT_DEFINITIONS = Object.freeze({
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
});
const REVISION_PATTERN = /^[0-9a-f]{40}$/;
const HASH_PATTERN = /^[0-9a-f]{64}$/;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
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

function fingerprintBytes(bytes) {
  return { sha256: sha256(bytes), bytes: bytes.length };
}

function readRegularFile(file) {
  try {
    const stat = fs.lstatSync(file);
    if (!stat.isFile()) return { kind: "unknown", reason: "not_a_regular_file" };
    const bytes = fs.readFileSync(file);
    return { kind: "ok", bytes, fingerprint: fingerprintBytes(bytes) };
  } catch (error) {
    return error?.code === "ENOENT"
      ? { kind: "missing", reason: "missing" }
      : { kind: "unknown", reason: "file_unreadable" };
  }
}

function parseJson(bytes) {
  try {
    return { kind: "ok", value: JSON.parse(bytes.toString("utf8")) };
  } catch {
    return { kind: "unknown", reason: "invalid_json" };
  }
}

function isSafeRepositoryRelativePath(value) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0")) return false;
  if (path.posix.isAbsolute(value) || value.includes("\\")) return false;
  return !value.split("/").some((segment) => segment === "..");
}

function validLine(value) {
  return Number.isInteger(value) && value >= 1;
}

function normalizeRepositoryUrl(value) {
  return typeof value === "string" ? value.replace(/\/$/, "").replace(/\.git$/, "") : null;
}

function lineRangeBytes(bytes, start, end) {
  const lineStarts = [0];
  for (let index = 0; index < bytes.length; index += 1) {
    if (bytes[index] === 0x0a) lineStarts.push(index + 1);
  }
  const resolvedEnd = end ?? lineStarts.length;
  if (!validLine(start) || !validLine(resolvedEnd) || resolvedEnd < start || resolvedEnd > lineStarts.length) return null;
  const startOffset = lineStarts[start - 1];
  const endOffset = resolvedEnd < lineStarts.length ? lineStarts[resolvedEnd] : bytes.length;
  return bytes.subarray(startOffset, endOffset);
}

function gitRevisionExists(repositoryRoot, revision) {
  try {
    execFileSync("git", ["cat-file", "-e", `${revision}^{commit}`], {
      cwd: repositoryRoot,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function currentHead(repositoryRoot) {
  const revision = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  }).trim();
  if (!REVISION_PATTERN.test(revision)) throw new Error("repository_head_invalid");
  return revision;
}

function gitFileBytes(repositoryRoot, revision, relativePath) {
  try {
    return execFileSync("git", ["show", `${revision}:${relativePath}`], {
      cwd: repositoryRoot,
      encoding: null,
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch {
    return null;
  }
}

function artifactPaths(repositoryRoot, definition) {
  const root = path.join(repositoryRoot, "docs", "architecture", "archify");
  return {
    sourceFile: path.join(root, definition.sourceName),
    artifactFile: path.join(root, definition.artifactName),
    receiptFile: path.join(root, definition.receiptName),
  };
}

function collectSourceReferences(source) {
  if (!isObject(source) || !Array.isArray(source.components)) throw new Error("source_components_invalid");
  const references = [];
  source.components.forEach((component, componentIndex) => {
    if (!isObject(component) || !Array.isArray(component.sources)) throw new Error(`source_component_sources_invalid:${componentIndex}`);
    component.sources.forEach((reference, sourceIndex) => {
      if (!isObject(reference) || !isSafeRepositoryRelativePath(reference.path)) {
        throw new Error(`source_reference_path_invalid:${componentIndex}:${sourceIndex}`);
      }
      if (reference.line !== undefined && !validLine(reference.line)) {
        throw new Error(`source_reference_line_invalid:${componentIndex}:${sourceIndex}`);
      }
      if (reference.end_line !== undefined && !validLine(reference.end_line)) {
        throw new Error(`source_reference_end_line_invalid:${componentIndex}:${sourceIndex}`);
      }
      if (reference.line !== undefined && reference.end_line !== undefined && reference.end_line < reference.line) {
        throw new Error(`source_reference_range_invalid:${componentIndex}:${sourceIndex}`);
      }
      references.push({
        path: reference.path,
        line: reference.line ?? 1,
        endLine: reference.end_line ?? (reference.line ?? null),
      });
    });
  });
  if (references.length === 0) throw new Error("source_references_missing");
  return references;
}

function compareEvidenceScope({ repositoryRoot, basisRevision, references }) {
  const currentCache = new Map();
  const basisCache = new Map();
  const result = {
    references: references.length,
    unchanged: 0,
    changed: 0,
    unknown: 0,
    changedReferences: [],
    unknownReferences: [],
  };

  for (const reference of references) {
    if (!currentCache.has(reference.path)) {
      const absolutePath = path.join(repositoryRoot, reference.path);
      const read = readRegularFile(absolutePath);
      currentCache.set(reference.path, read.kind === "ok" ? read.bytes : null);
    }
    if (!basisCache.has(reference.path)) basisCache.set(reference.path, gitFileBytes(repositoryRoot, basisRevision, reference.path));
    const currentBytes = currentCache.get(reference.path);
    const basisBytes = basisCache.get(reference.path);
    const currentSlice = currentBytes ? lineRangeBytes(currentBytes, reference.line, reference.endLine) : null;
    const basisSlice = basisBytes ? lineRangeBytes(basisBytes, reference.line, reference.endLine) : null;
    const label = reference.endLine === null
      ? `${reference.path}:${reference.line}-EOF`
      : `${reference.path}:${reference.line}-${reference.endLine}`;

    if (!currentSlice || !basisSlice) {
      result.unknown += 1;
      result.unknownReferences.push(label);
    } else if (currentSlice.equals(basisSlice)) {
      result.unchanged += 1;
    } else {
      result.changed += 1;
      result.changedReferences.push(label);
    }
  }
  return result;
}

function baseReport(id, definition, currentRevision) {
  return {
    id,
    status: "unknown",
    source: definition.sourceName,
    artifact: definition.artifactName,
    receipt: definition.receiptName,
    basisRevision: null,
    currentHead: currentRevision,
    basisRevisionMatchesHead: null,
    evidenceScope: null,
    integrity: null,
    reasons: [],
    notes: [],
    canonicalFallback: "canonical_code_contracts_tests",
  };
}

function evaluateArtifact(id, repositoryRoot = REPOSITORY_ROOT, repositoryRevision = null) {
  const definition = ARTIFACT_DEFINITIONS[id];
  if (!definition) {
    return {
      id,
      status: "unknown",
      source: null,
      artifact: null,
      receipt: null,
      basisRevision: null,
      currentHead: repositoryRevision,
      basisRevisionMatchesHead: null,
      evidenceScope: null,
      integrity: null,
      reasons: ["artifact_definition_unknown"],
      notes: [],
      canonicalFallback: "canonical_code_contracts_tests",
    };
  }

  const report = baseReport(id, definition, repositoryRevision);
  const paths = artifactPaths(repositoryRoot, definition);
  const sourceRead = readRegularFile(paths.sourceFile);
  const receiptRead = readRegularFile(paths.receiptFile);
  if (sourceRead.kind !== "ok" || receiptRead.kind !== "ok") {
    report.reasons.push(sourceRead.kind !== "ok" ? `source_${sourceRead.reason}` : null);
    report.reasons.push(receiptRead.kind !== "ok" ? `receipt_${receiptRead.reason}` : null);
    report.reasons = report.reasons.filter(Boolean);
    return report;
  }

  const sourceJson = parseJson(sourceRead.bytes);
  const receiptJson = parseJson(receiptRead.bytes);
  if (sourceJson.kind !== "ok" || receiptJson.kind !== "ok") {
    report.reasons.push(sourceJson.kind !== "ok" ? "source_invalid_json" : null);
    report.reasons.push(receiptJson.kind !== "ok" ? "receipt_invalid_json" : null);
    report.reasons = report.reasons.filter(Boolean);
    return report;
  }

  const source = sourceJson.value;
  const receipt = receiptJson.value;
  if (!isObject(source)) report.reasons.push("source_shape_invalid");
  if (!isObject(receipt)) report.reasons.push("receipt_shape_invalid");
  if (report.reasons.length > 0) return report;
  const staleReasons = [];
  const unknownReasons = [];
  let references;
  try {
    references = collectSourceReferences(source);
  } catch (error) {
    unknownReasons.push(error instanceof Error ? error.message : "source_references_invalid");
  }

  const repositoryMeta = source.meta?.repository;
  const receiptBasis = receipt.repository_evidence;
  const basisRevision = receiptBasis?.revision;
  report.basisRevision = typeof basisRevision === "string" ? basisRevision : null;
  report.basisRevisionMatchesHead = report.basisRevision && repositoryRevision
    ? report.basisRevision === repositoryRevision
    : null;

  if (source.schema_version !== 1 || source.diagram_type !== "architecture") unknownReasons.push("source_identity_invalid");
  if (!isObject(repositoryMeta) || typeof repositoryMeta.url !== "string" || !REVISION_PATTERN.test(repositoryMeta.revision || "")) {
    unknownReasons.push("source_repository_basis_invalid");
  }
  if (!isObject(receiptBasis) || typeof receiptBasis.url !== "string" || !REVISION_PATTERN.test(basisRevision || "")) {
    unknownReasons.push("receipt_repository_basis_invalid");
  }
  if (normalizeRepositoryUrl(repositoryMeta?.url) !== normalizeRepositoryUrl(receiptBasis?.url) || repositoryMeta?.revision !== basisRevision) {
    unknownReasons.push("source_receipt_basis_mismatch");
  }
  if (receipt.source !== definition.sourceName || receipt.artifact !== definition.artifactName) {
    unknownReasons.push("receipt_artifact_identity_mismatch");
  }
  if (!isObject(receipt.tool) || receipt.tool.name !== "Archify") unknownReasons.push("receipt_tool_identity_invalid");
  if (receipt.tool?.package_version !== ARCHIFY_PIN.version || receipt.tool?.revision !== ARCHIFY_PIN.revision) {
    staleReasons.push("archify_pin_mismatch");
  }
  if (receipt.drift_sync?.detector !== "canonical-architecture-json-v1") unknownReasons.push("receipt_drift_detector_invalid");

  const sourceFingerprint = sourceRead.fingerprint;
  const artifactRead = readRegularFile(paths.artifactFile);
  const artifactFingerprint = artifactRead.kind === "ok" ? artifactRead.fingerprint : null;
  report.integrity = {
    source: sourceFingerprint,
    artifact: artifactFingerprint,
    receipt: receiptRead.fingerprint,
    recordedSource: receipt.specification || null,
    recordedArtifact: receipt.delivered_artifact || null,
    recordedValidation: receipt.validation || null,
  };

  if (!isObject(receipt.specification) || !HASH_PATTERN.test(receipt.specification.sha256 || "") || !Number.isInteger(receipt.specification.bytes)) {
    unknownReasons.push("receipt_source_integrity_invalid");
  } else if (receipt.specification.sha256 !== sourceFingerprint.sha256 || receipt.specification.bytes !== sourceFingerprint.bytes) {
    staleReasons.push("source_bytes_changed_since_receipt");
  }
  if (!isObject(receipt.delivered_artifact) || !HASH_PATTERN.test(receipt.delivered_artifact.sha256 || "") || !Number.isInteger(receipt.delivered_artifact.bytes)) {
    unknownReasons.push("receipt_artifact_integrity_invalid");
  } else if (artifactRead.kind === "missing") {
    staleReasons.push("artifact_missing");
  } else if (artifactRead.kind !== "ok") {
    unknownReasons.push(`artifact_${artifactRead.reason}`);
  } else if (receipt.delivered_artifact.sha256 !== artifactFingerprint.sha256 || receipt.delivered_artifact.bytes !== artifactFingerprint.bytes) {
    staleReasons.push("artifact_bytes_changed_since_receipt");
  }
  if (receipt.drift_sync?.source_input_sha256 !== receipt.specification?.sha256 || receipt.drift_sync?.source_input_bytes !== receipt.specification?.bytes) {
    unknownReasons.push("receipt_source_attestation_mismatch");
  }
  const meaningfulHash = meaningfulArchitectureHash(source);
  if (!HASH_PATTERN.test(receipt.drift_sync?.meaningful_sha256 || "")) unknownReasons.push("receipt_meaningful_hash_invalid");
  else if (receipt.drift_sync.meaningful_sha256 !== meaningfulHash) staleReasons.push("meaningful_architecture_changed");

  const validation = receipt.validation;
  if (!isObject(validation) || !Number.isInteger(validation.checks_passed) || !Number.isInteger(validation.check_count)) {
    unknownReasons.push("receipt_validation_invalid");
  } else if (
    validation.checks_passed !== validation.check_count ||
    validation.check_count < 1 ||
    validation.errors !== 0 ||
    validation.warnings !== 0 ||
    validation.composition_status !== "pass" ||
    validation.static_html_check !== "pass"
  ) {
    staleReasons.push("recorded_validation_not_verified");
  }
  if (!Number.isInteger(receiptBasis?.source_references) || receiptBasis.source_references !== references?.length) {
    staleReasons.push("source_reference_count_changed");
  }

  if (!REVISION_PATTERN.test(basisRevision || "") || !gitRevisionExists(repositoryRoot, basisRevision)) {
    unknownReasons.push("basis_revision_unavailable");
  } else if (references) {
    report.evidenceScope = compareEvidenceScope({ repositoryRoot, basisRevision, references });
    if (report.evidenceScope.unknown > 0) unknownReasons.push("evidence_scope_unavailable");
    if (report.evidenceScope.changed > 0) staleReasons.push("evidence_scope_changed");
  }

  report.reasons = [...new Set([...unknownReasons, ...staleReasons])];
  report.status = unknownReasons.length > 0 ? "unknown" : staleReasons.length > 0 ? "stale" : "current";
  if (report.status === "current" && report.basisRevisionMatchesHead === false) {
    report.notes.push("basis_revision_advanced_evidence_scope_unchanged");
  }
  return report;
}

export function runFreshnessCheck(repositoryRoot = REPOSITORY_ROOT) {
  let repositoryRevision = null;
  let repositoryError = null;
  try {
    repositoryRevision = currentHead(repositoryRoot);
  } catch {
    repositoryError = "repository_head_unavailable";
  }

  const artifacts = Object.keys(ARTIFACT_DEFINITIONS).map((id) => {
    if (repositoryError) {
      const report = baseReport(id, ARTIFACT_DEFINITIONS[id], null);
      report.reasons.push(repositoryError);
      return report;
    }
    return evaluateArtifact(id, repositoryRoot, repositoryRevision);
  });
  const status = artifacts.some((artifact) => artifact.status === "unknown")
    ? "unknown"
    : artifacts.some((artifact) => artifact.status === "stale")
      ? "stale"
      : "current";
  return {
    ok: status === "current",
    status,
    method: "deterministic-local-read-only",
    repository: {
      currentHead: repositoryRevision,
      error: repositoryError,
    },
    artifacts,
    authority: {
      freshnessOnly: true,
      canonicalPrecedence: "canonical_code_contracts_tests",
      unknownNeverPromoted: true,
      artifactMutation: "none",
      autoRegeneration: "forbidden",
      externalApiCalls: 0,
    },
  };
}

function main() {
  const report = runFreshnessCheck();
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) main();
