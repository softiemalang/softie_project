import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

export const SANITIZED_MANIFEST_SCHEMA_VERSION = 1;
export const SANITIZED_MANIFEST_PATH_BASIS = "repository-relative";

// Exact, reviewable exceptions to the normal snapshot size/binary/path
// filters.  No credential, generated, ignored, native-output, or evidence
// path is allowed here.
export const PORTABLE_SNAPSHOT_ALLOWLIST = Object.freeze([
  ".github/workflows/astrology-jplephem-equivalence-v1.yml",
  ".github/workflows/de405-legacy-native-matrix.yml",
  ".github/workflows/de405-linux-architecture-evidence.yml",
  ".github/workflows/de405-linux-producer-v0.yml",
  "api/provider/asia-seoul.tzif",
  "src/interpretationPrep/sajuFiveClassicsSourceIdentityFrontier.js",
  "src/interpretationPrep/sajuLineageReadingGrammar.js",
  "src/scheduler/assets/scheduler-atmosphere-v4.jpg",
]);

export const PORTABLE_SNAPSHOT_MAX_FILE_BYTES = 512000;
const SNAPSHOT_DEFAULT_MAX_FILE_BYTES = 256000;

const ENTRY_KEYS = Object.freeze([
  "path",
  "exists",
  "git_status",
  "mode",
  "size",
  "sha256",
  "snapshot_exclusion_reason",
]);

const GENERATED_SEGMENTS = new Set([
  ".cache",
  ".codex",
  ".git",
  ".vercel",
  "__pycache__",
  "build",
  "coverage",
  "dist",
  "node_modules",
]);

const BINARY_EXTENSIONS = new Set([
  ".app",
  ".bsp",
  ".dmg",
  ".ico",
  ".jpg",
  ".jpeg",
  ".mobileprovision",
  ".png",
  ".tzif",
  ".wasm",
]);

const CREDENTIAL_FILE_NAMES = new Set([".env", ".env.local", ".env.production", ".env.development"]);

const KNOWN_CREDENTIAL_PATHS = new Set([
  "supabase/functions/_shared/saju-evaluator-logic.ts",
  "supabase/functions/_shared/saju-knowledge-logic.ts",
  "supabase/functions/generate-fortune-report/index.ts",
  "supabase/functions/project-brain-answer/index.ts",
]);

function fail(code) {
  throw new Error(code);
}

function comparePath(left, right) {
  return left.localeCompare(right, "en");
}

export function assertRepositoryRelativePath(value) {
  if (
    typeof value !== "string" ||
    !value ||
    value.includes("\\") ||
    value.startsWith("/") ||
    /^[A-Za-z]:/.test(value) ||
    value.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    fail("invalid_repository_relative_path");
  }
  return value;
}

function safePath(root, relativePath) {
  const safeRelativePath = assertRepositoryRelativePath(relativePath);
  const destination = path.resolve(root, ...safeRelativePath.split("/"));
  if (destination !== root && !destination.startsWith(`${root}${path.sep}`)) fail("repository_path_escape");
  return destination;
}

function statRelative(root, relativePath) {
  const destination = safePath(root, relativePath);
  let current = root;
  let stat = null;
  for (const part of relativePath.split("/")) {
    current = path.join(current, part);
    try {
      stat = fs.lstatSync(current);
    } catch (error) {
      if (error.code === "ENOENT" || error.code === "ENOTDIR") {
        return { destination, stat: null, symlink: false };
      }
      throw error;
    }
    if (stat.isSymbolicLink()) return { destination, stat, symlink: true };
  }
  return { destination, stat, symlink: false };
}

function gitList(root, args) {
  return execFileSync("git", ["-C", root, ...args], { encoding: "buffer", stdio: ["ignore", "pipe", "pipe"] })
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .map((value) => value.endsWith("/") ? value.slice(0, -1) : value);
}

function discoverGitCandidates(root) {
  const statuses = new Map();
  for (const relativePath of gitList(root, ["ls-files", "--cached", "-z"])) statuses.set(relativePath, "tracked");
  for (const relativePath of gitList(root, ["ls-files", "--others", "--exclude-standard", "-z"])) {
    if (!statuses.has(relativePath)) statuses.set(relativePath, "untracked");
  }
  for (const relativePath of gitList(root, ["ls-files", "--others", "--ignored", "--exclude-standard", "--directory", "-z"])) {
    if (!statuses.has(relativePath)) statuses.set(relativePath, "ignored");
  }
  return statuses;
}

function pathLooksCredentialMaterial(relativePath) {
  const parts = relativePath.split("/");
  const basename = parts.at(-1);
  if (KNOWN_CREDENTIAL_PATHS.has(relativePath)) return true;
  return parts.some((part) => /^(credentials?|secrets?|passwords?|private[-_]?keys?|ssh[-_]?keys?)$/i.test(part))
    || /\.(?:pem|p12|pfx)$/i.test(basename);
}

function pathLooksProtectedMaterial(relativePath) {
  const basename = relativePath.split("/").at(-1);
  return CREDENTIAL_FILE_NAMES.has(basename) || /^\.env\.[^.]+$/.test(basename);
}

function pathLooksGenerated(relativePath) {
  const parts = relativePath.split("/");
  if (parts.some((part) => GENERATED_SEGMENTS.has(part))) return true;
  if (parts.at(-1) === ".DS_Store" || /\.pyc$/i.test(parts.at(-1))) return true;
  if (relativePath === ".env.example") return true;
  return false;
}
function pathLooksInvalid(relativePath) {
  const parts = relativePath.split("/");
  const basename = parts.at(-1);
  return parts[0] === ".github" || basename === ".gitignore" || basename === ".gitattributes";
}

function isBinaryPath(relativePath) {
  return BINARY_EXTENSIONS.has(path.posix.extname(relativePath).toLowerCase());
}

export function isPortableSnapshotAllowlisted(relativePath) {
  return PORTABLE_SNAPSHOT_ALLOWLIST.includes(assertRepositoryRelativePath(relativePath));
}

function exclusionReason(relativePath, gitStatus, stat, symlink) {
  if (pathLooksCredentialMaterial(relativePath)) return "credential_material";
  if (pathLooksProtectedMaterial(relativePath)) return "protected_or_generated";
  if (pathLooksGenerated(relativePath)) return "protected_or_generated";
  if (gitStatus === "ignored") return "git_ignored";
  if (symlink) return "symlink";
  if (!stat || !stat.isFile()) return null;

  const baseReason = stat.size > SNAPSHOT_DEFAULT_MAX_FILE_BYTES
    ? "too_large"
    : isBinaryPath(relativePath)
      ? "binary"
      : pathLooksInvalid(relativePath)
        ? "invalid_path"
        : null;
  if (baseReason && isPortableSnapshotAllowlisted(relativePath)) return null;
  return baseReason;
}

function fileSha256(destination) {
  const hash = createHash("sha256");
  hash.update(fs.readFileSync(destination));
  return hash.digest("hex");
}

function manifestEntry(root, relativePath, gitStatus) {
  const { destination, stat, symlink } = statRelative(root, relativePath);
  const reason = exclusionReason(relativePath, gitStatus, stat, symlink);
  const included = Boolean(stat?.isFile() && !symlink && !reason);
  return {
    path: relativePath,
    exists: Boolean(stat),
    git_status: gitStatus ?? "unknown",
    mode: stat ? stat.mode & 0o777 : null,
    size: stat ? stat.size : null,
    sha256: included ? fileSha256(destination) : null,
    snapshot_exclusion_reason: reason,
  };
}

export function validateSanitizedManifest(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) fail("manifest_shape_invalid");
  if (Object.keys(manifest).sort().join("\0") !== ["items", "path_basis", "schema_version"].join("\0")) {
    fail("manifest_keys_invalid");
  }
  if (manifest.schema_version !== SANITIZED_MANIFEST_SCHEMA_VERSION) fail("manifest_schema_version_invalid");
  if (manifest.path_basis !== SANITIZED_MANIFEST_PATH_BASIS || !Array.isArray(manifest.items)) fail("manifest_basis_invalid");

  for (const item of manifest.items) {
    if (!item || typeof item !== "object" || Object.keys(item).sort().join("\0") !== ENTRY_KEYS.slice().sort().join("\0")) {
      fail("manifest_entry_keys_invalid");
    }
    assertRepositoryRelativePath(item.path);
    if (typeof item.exists !== "boolean") fail("manifest_exists_invalid");
    if (!["tracked", "untracked", "ignored", "unknown"].includes(item.git_status)) fail("manifest_git_status_invalid");
    if (item.sha256 !== null && !/^[a-f0-9]{64}$/.test(item.sha256)) fail("manifest_hash_invalid");
    if (item.snapshot_exclusion_reason !== null && typeof item.snapshot_exclusion_reason !== "string") {
      fail("manifest_exclusion_reason_invalid");
    }
    if (item.snapshot_exclusion_reason && item.sha256 !== null) fail("excluded_manifest_hash_present");
  }
  return manifest;
}

export function buildSanitizedRepositoryManifest(repositoryRoot, { candidatePaths, gitStatuses } = {}) {
  const root = fs.realpathSync(repositoryRoot);
  const statuses = gitStatuses
    ? new Map(gitStatuses instanceof Map ? gitStatuses : Object.entries(gitStatuses))
    : discoverGitCandidates(root);
  const paths = candidatePaths
    ? [...new Set(candidatePaths.map(assertRepositoryRelativePath))]
    : [...statuses.keys()];

  const items = paths
    .sort(comparePath)
    .map((relativePath) => manifestEntry(root, relativePath, statuses.get(relativePath)));
  return validateSanitizedManifest({
    schema_version: SANITIZED_MANIFEST_SCHEMA_VERSION,
    path_basis: SANITIZED_MANIFEST_PATH_BASIS,
    items,
  });
}

export function serializeSanitizedManifest(manifest) {
  return Buffer.from(`${JSON.stringify(validateSanitizedManifest(manifest), null, 2)}\n`);
}

export function readPortableSnapshotFiles(repositoryRoot) {
  const root = fs.realpathSync(repositoryRoot);
  return PORTABLE_SNAPSHOT_ALLOWLIST.map((relativePath) => {
    const { destination, stat } = statRelative(root, relativePath);
    if (!stat?.isFile()) fail("portable_allowlist_path_missing");
    if (stat.size > PORTABLE_SNAPSHOT_MAX_FILE_BYTES) fail("portable_allowlist_file_too_large");
    if (pathLooksCredentialMaterial(relativePath) || pathLooksGenerated(relativePath)) {
      fail("portable_allowlist_protected_path");
    }
    const data = fs.readFileSync(destination);
    return {
      path: relativePath,
      data,
      hash: createHash("sha256").update(data).digest("hex"),
      mode: stat.mode & 0o777,
    };
  });
}

export function mergePortableSnapshot(snapshot, repositoryRoot) {
  const portableFiles = readPortableSnapshotFiles(repositoryRoot);
  const files = new Map((snapshot.files ?? []).map((entry) => [entry.path, entry]));
  for (const entry of portableFiles) files.set(entry.path, entry);
  const allowlistedPaths = new Set(PORTABLE_SNAPSHOT_ALLOWLIST);
  const omitted = (snapshot.omitted ?? []).filter((entry) => !allowlistedPaths.has(entry.path));
  return {
    ...snapshot,
    files: [...files.values()].sort((left, right) => comparePath(left.path, right.path)),
    omitted,
  };
}
