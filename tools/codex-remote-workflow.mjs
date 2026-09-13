#!/usr/bin/env node

/* Mac-first, fail-closed workflow for Codex Desktop Remote SSH. */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";

import {
  PORTABLE_SNAPSHOT_ALLOWLIST,
  PORTABLE_SNAPSHOT_MAX_FILE_BYTES,
  assertRepositoryRelativePath,
  buildSanitizedRepositoryManifest,
  isPortableSnapshotAllowlisted,
  mergePortableSnapshot,
  serializeSanitizedManifest,
} from "./sanitized-repository-metadata.mjs";

const DEFAULT_ACTIVE_BOUNDARY_MODULE =
  "/Users/hangyukim/.local/share/tab-worker-mac/current/tools/development-console.mjs";
const ACTIVE_BOUNDARY_MODULE = DEFAULT_ACTIVE_BOUNDARY_MODULE;
let boundary = null;
if (process.platform === "darwin") {
  try {
    boundary = await import(pathToFileURL(ACTIVE_BOUNDARY_MODULE).href);
  } catch {
    boundary = null;
  }
}
const repositorySnapshot = boundary?.repositorySnapshot;
const repositoryContractStatus = boundary?.repositoryContractStatus;
const relativeFile = boundary?.relativeFile;
const safeFile = boundary?.safeFile;
const snapshotExcluded = boundary?.snapshotExcluded;

export const WORKFLOW_VERSION = 1;
export const DEFAULT_SOURCE_ROOT = "/Users/hangyukim/Documents/softie_project";
export const DEFAULT_TARGET =
  "/data/data/com.termux/files/home/codex-remote-development/softie_project";
export const DEFAULT_SSH_HOST = "tab-worker";
export const DEFAULT_STATE_ROOT =
  "/Users/hangyukim/.local/share/tab-worker-mac/remote-development/softie_project";
export const DEFAULT_METADATA_TARGET =
  "/data/data/com.termux/files/home/codex-remote-development/mac-softie-candidates.manifest.json";
export const REMOTE_INTERFACE_COMMANDS = Object.freeze([
  "metadata",
  "refresh",
  "setup",
  "status",
  "verify",
  "apply",
]);
export const REMOTE_TMP_ROOT = "/data/data/com.termux/files/usr/tmp";
export const MAX_CHANGED_FILES = 30;
export const MAX_CHANGED_BYTES = 12 * 1024 * 1024;
export const MAX_CHANGED_FILE_BYTES = 256000;

const GIT = "/usr/bin/git";
const TAR = "/usr/bin/tar";
const MAX_SNAPSHOT_FILES = 6000;
const MAX_SNAPSHOT_BYTES = 64 * 1024 * 1024;
const GENERATED_EXCLUDES = [
  "node_modules/",
  "dist/",
  "coverage/",
  "build/",
  ".cache/",
  "__pycache__/",
  "*.pyc",
];

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonBytes = (value) => Buffer.from(JSON.stringify(value));
const now = () => new Date().toISOString();
const token = () => randomUUID().replaceAll("-", "");

function fail(code) {
  throw new Error(code);
}

function coordinatorRelativeFile(value) {
  const candidate = assertRepositoryRelativePath(value);
  return isPortableSnapshotAllowlisted(candidate) ? candidate : relativeFile(candidate);
}

function coordinatorSafeFile(root, value, missing = false) {
  const candidate = coordinatorRelativeFile(value);
  if (!isPortableSnapshotAllowlisted(candidate)) return safeFile(root, candidate, missing);

  const destination = path.resolve(root, ...candidate.split("/"));
  if (destination !== root && !destination.startsWith(`${root}${path.sep}`)) fail("repository_path_escape");
  let current = root;
  for (const part of candidate.split("/")) {
    current = path.join(current, part);
    let stat;
    try {
      stat = fs.lstatSync(current);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      if (!missing) fail("file_not_found");
      continue;
    }
    if (stat.isSymbolicLink()) fail("symlink_not_allowed");
  }
  return destination;
}

function assertMacCoordinator() {
  // Boundary replacement is forbidden on every host; reject it before the
  // platform gate so a Linux worker cannot mask the stronger boundary error.
  if (process.env.SOFTIE_REMOTE_BOUNDARY_MODULE) fail("boundary_override_forbidden");
  if (process.platform !== "darwin") fail("mac_coordinator_required");
  if (ACTIVE_BOUNDARY_MODULE !== DEFAULT_ACTIVE_BOUNDARY_MODULE || !boundary) {
    fail("active_snapshot_boundary_unavailable");
  }
  for (const name of ["repositorySnapshot", "repositoryContractStatus", "relativeFile", "safeFile", "snapshotExcluded"]) {
    if (typeof boundary[name] !== "function") fail("active_snapshot_boundary_incomplete");
  }
}

function ensureAbsolute(value, code) {
  if (typeof value !== "string" || !path.isAbsolute(value) || /[\0\r\n]/.test(value)) fail(code);
  return path.resolve(value);
}

function ensureRemotePath(value) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/data/data/com.termux/files/") ||
    /[\0\r\n]/.test(value) ||
    value.includes(" ")
  ) fail("invalid_remote_path");
  return value;
}

function mkdirPrivate(directory) {
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  fs.chmodSync(directory, 0o700);
}

function atomicJson(file, value) {
  mkdirPrivate(path.dirname(file));
  const temporary = `${file}.${token()}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  fs.renameSync(temporary, file);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function runProcess(file, args, { cwd = process.cwd(), env = {}, input, timeout = 120000, maxOutput = 64 * 1024 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
    let stdout = Buffer.alloc(0);
    let stderr = Buffer.alloc(0);
    let stopped = false;
    const child = spawn(file, args, {
      cwd,
      env: { ...process.env, ...env },
      detached: true,
      stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
    });
    const stop = () => {
      stopped = true;
      try { process.kill(-child.pid, "SIGTERM"); } catch { try { child.kill("SIGTERM"); } catch {} }
    };
    const timer = setTimeout(stop, timeout);
    if (input !== undefined) { child.stdin.on("error", () => {}); child.stdin.end(input); }
    child.stdout.on("data", (chunk) => { stdout = Buffer.concat([stdout, chunk]); if (stdout.length > maxOutput) stop(); });
    child.stderr.on("data", (chunk) => { stderr = Buffer.concat([stderr, chunk]); if (stderr.length > maxOutput) stop(); });
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code, signal) => { clearTimeout(timer); resolve({ code: stopped ? 124 : code ?? 1, signal, stdout, stderr }); });
  });
}

function hostEnv(stateRoot) {
  mkdirPrivate(stateRoot);
  return {
    HOME: stateRoot,
    LANG: "C.UTF-8",
    PATH: "/usr/bin:/bin:/opt/homebrew/bin",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_TERMINAL_PROMPT: "0",
    GIT_OPTIONAL_LOCKS: "0",
  };
}

async function gitBytes(root, args, stateRoot, maxOutput = 16 * 1024 * 1024) {
  const result = await runProcess(GIT, [
    "-c", "core.fsmonitor=false", "-c", "diff.autoRefreshIndex=false", "-C", root, ...args,
  ], { cwd: root, env: hostEnv(stateRoot), maxOutput });
  if (result.code !== 0) fail("mac_git_operation_failed");
  return result.stdout;
}

async function gitText(root, args, stateRoot) {
  return (await gitBytes(root, args, stateRoot)).toString("utf8").trim();
}

function summarizeOmissions(omitted) {
  const summary = {};
  for (const entry of omitted) summary[entry.reason] = (summary[entry.reason] || 0) + 1;
  return summary;
}

function sortedManifest(files) {
  return files.map(({ path: filePath, hash, mode }) => ({ path: filePath, hash, mode }))
    .sort((a, b) => a.path.localeCompare(b.path, "en"));
}

function manifestMap(manifest) { return new Map(manifest.map((entry) => [entry.path, entry])); }

function sameManifest(left, right) {
  if (left.length !== right.length) return false;
  const a = sortedManifest(left); const b = sortedManifest(right);
  return a.every((entry, index) => entry.path === b[index].path && entry.hash === b[index].hash && entry.mode === b[index].mode);
}

function parseNameStatusZ(buffer) {
  const tokens = buffer.toString("utf8").split("\0").filter(Boolean);
  const changes = [];
  for (let index = 0; index < tokens.length;) {
    const statusToken = tokens[index++];
    const status = statusToken.slice(0, 1);
    const filePath = statusToken.includes("\t")
      ? statusToken.slice(statusToken.indexOf("\t") + 1)
      : tokens[index++];
    if (!status || !filePath) fail("remote_change_path_invalid");
    if (status === "R" || status === "C") fail("remote_rename_not_supported");
    if (!["A", "M", "D", "T"].includes(status)) fail("remote_change_type_invalid");
    const safePath = coordinatorRelativeFile(filePath);
    if (snapshotExcluded(safePath) && !isPortableSnapshotAllowlisted(safePath)) fail("remote_change_protected_path");
    changes.push({ status, path: safePath });
  }
  changes.sort((a, b) => a.path.localeCompare(b.path, "en"));
  if (changes.length > MAX_CHANGED_FILES) fail("remote_change_count_exceeded");
  if (new Set(changes.map((entry) => entry.path)).size !== changes.length) fail("remote_change_duplicate_path");
  return changes;
}

function parseKeyValueOutput(buffer) {
  const result = {};
  for (const line of buffer.toString("utf8").split("\n")) {
    if (!line) continue;
    const separator = line.indexOf("=");
    if (separator > 0) result[line.slice(0, separator)] = line.slice(separator + 1);
  }
  return result;
}

function decodeB64(value) { return Buffer.from(value || "", "base64"); }

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

function parseDirtyStatusZ(buffer) {
  const paths = [];
  for (const tokenValue of buffer.toString("utf8").split("\0").filter(Boolean)) {
    const filePath = tokenValue.length > 3 ? tokenValue.slice(3) : "";
    if (filePath) paths.push(coordinatorRelativeFile(filePath));
  }
  return [...new Set(paths)].sort((a, b) => a.localeCompare(b, "en"));
}

async function captureSource(root, stateRoot) {
  const head = await gitText(root, ["rev-parse", "HEAD"], stateRoot);
  const branch = await gitText(root, ["rev-parse", "--symbolic-full-name", "HEAD"], stateRoot);
  const status = await gitBytes(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"], stateRoot);
  const indexListing = await gitBytes(root, ["ls-files", "--stage", "-z"], stateRoot);
  const allowedListing = await gitBytes(root, ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], stateRoot);
  const allowedPaths = new Set(allowedListing.toString("utf8").split("\0").filter(Boolean));
  const baseSnapshot = repositorySnapshot(root, {}, { allowedPaths, maxFiles: MAX_SNAPSHOT_FILES, maxBytes: MAX_SNAPSHOT_BYTES });
  const snapshot = mergePortableSnapshot(baseSnapshot, root);
  const files = snapshot.files.map((entry) => {
    const stat = fs.lstatSync(coordinatorSafeFile(root, entry.path));
    return { path: entry.path, data: entry.data, hash: sha256(entry.data), mode: stat.mode & 0o777 };
  });
  const manifest = sortedManifest(files);
  const contract = repositoryContractStatus(root, snapshot);
  const index = sha256(indexListing);
  const statusB64 = status.toString("base64");
  const dirtyPaths = parseDirtyStatusZ(status);
  const fingerprint = sha256(JSON.stringify({ head, branch, index, statusB64, manifest, contract }));
  return { head, branch, index, statusB64, dirtyPaths, files, manifest, fingerprint, omitted: summarizeOmissions(snapshot.omitted), repositoryContract: contract, allowedPathCount: allowedPaths.size };
}

function sourceRecordView(source) {
  return {
    head: source.head, branch: source.branch, index: source.index, statusB64: source.statusB64, dirtyPaths: source.dirtyPaths,
    manifest: source.manifest, fingerprint: source.fingerprint, omitted: source.omitted,
    repositoryContract: source.repositoryContract, allowedPathCount: source.allowedPathCount,
  };
}

function buildLocalStage(snapshotFiles) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "softie-remote-snapshot-"));
  for (const entry of snapshotFiles) {
    const safePath = coordinatorRelativeFile(entry.path);
    if (snapshotExcluded(safePath) && !isPortableSnapshotAllowlisted(safePath)) fail("local_stage_protected_path");
    const destination = path.join(directory, ...safePath.split("/"));
    fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
    fs.writeFileSync(destination, entry.data, { flag: "wx", mode: entry.mode });
    fs.chmodSync(destination, entry.mode);
  }
  return directory;
}

function collectRegularFiles(root) {
  const result = new Map();
  const visit = (directory, prefix = "") => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolute = path.join(directory, entry.name);
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) fail("archive_symlink_not_allowed");
      if (stat.isDirectory()) { visit(absolute, rel); continue; }
      if (!stat.isFile()) fail("archive_non_regular_file");
      const data = fs.readFileSync(absolute);
      result.set(rel, { path: rel, data, hash: sha256(data), mode: stat.mode & 0o777 });
    }
  };
  visit(root);
  return result;
}

function compareStageToSnapshot(root, snapshotFiles) {
  const actual = collectRegularFiles(root);
  const expected = new Map(snapshotFiles.map((entry) => [entry.path, entry]));
  if (actual.size !== expected.size) fail("snapshot_roundtrip_file_count_mismatch");
  for (const [filePath, expectedEntry] of expected) {
    const entry = actual.get(filePath);
    if (!entry || entry.hash !== expectedEntry.hash || entry.mode !== expectedEntry.mode) fail("snapshot_roundtrip_content_mismatch");
  }
}

const REMOTE_EXTRACT = `
set -euo pipefail
stage=$1
test ! -e "$stage"
umask 077
mkdir -m 700 -p "$stage"
tar -p -xf - -C "$stage"
`;

const REMOTE_INSPECT = `
set -euo pipefail
target=$1
baseline=\${2-}
line() {
  printf '%s=' "$1"
  printf '%s' "$2" | base64 | tr -d '\\n'
  printf '\\n'
}
if test -e "$target"; then line EXISTS 1; else line EXISTS 0; exit 0; fi
if test -d "$target/.git"; then
  line ROOT "$(git -C "$target" rev-parse --show-toplevel 2>/dev/null || true)"
  line HEAD "$(git -C "$target" rev-parse HEAD 2>/dev/null || true)"
  line TREE "$(git -C "$target" rev-parse HEAD^{tree} 2>/dev/null || true)"
  line BRANCH "$(git -C "$target" symbolic-ref --short -q HEAD 2>/dev/null || true)"
  root_commit=$(git -C "$target" rev-list --max-parents=0 HEAD 2>/dev/null | tail -n 1 || true)
  line ROOT_COMMIT "$root_commit"
  line ROOT_SUBJECT "$(test -n "$root_commit" && git -C "$target" log -1 --format=%s "$root_commit" 2>/dev/null || true)"
  line REMOTES "$(git -C "$target" remote -v 2>/dev/null || true)"
  printf 'STATUS_B64='
  git -C "$target" status --porcelain=v1 -z --untracked-files=all | base64 | tr -d '\\n'
  printf '\\n'
  if test -n "$baseline"; then
    if git -C "$target" merge-base --is-ancestor "$baseline" HEAD 2>/dev/null; then line ANCESTOR 1; else line ANCESTOR 0; fi
    printf 'CHANGED_B64='
    git -c diff.renames=false -C "$target" diff --name-status -z "$baseline" HEAD -- | base64 | tr -d '\\n'
    printf '\\n'
  fi
else
  line ROOT ""; line HEAD ""; line TREE ""; line BRANCH ""; line ROOT_COMMIT ""; line ROOT_SUBJECT ""; line REMOTES ""; line ANCESTOR 0
  printf 'STATUS_B64=\nCHANGED_B64=\n'
fi
`;

async function remoteBashResult(config, script, args = [], input, maxOutput = 64 * 1024 * 1024) {
  const remoteScript = Buffer.from(script).toString("base64");
  const scriptPath = `${REMOTE_TMP_ROOT}/softie-workflow-script-${token()}.sh`;
  const remoteCommand = [
    "set -eu",
    `script=${shellQuote(scriptPath)}`,
    `trap 'rm -f -- "$script"' EXIT`,
    `printf '%s' ${shellQuote(remoteScript)} | base64 -d > "$script"`,
    `bash "$script" ${args.map(shellQuote).join(" ")}`,
  ].join("; ");
  return runProcess("/usr/bin/ssh", [config.sshHost, remoteCommand], {
    input, env: { LC_ALL: "C", LANG: "C.UTF-8" }, timeout: 180000, maxOutput,
  });
}

async function remoteBash(config, script, args = [], input, maxOutput = 64 * 1024 * 1024) {
  const result = await remoteBashResult(config, script, args, input, maxOutput);
  if (result.code !== 0) {
    if (process.env.SOFTIE_REMOTE_DEBUG === "1") {
      process.stderr.write(`REMOTE_DEBUG_EXIT=${result.code}\n${result.stderr.toString("utf8").slice(-4000)}\n`);
    }
    fail("remote_command_failed");
  }
  return result.stdout;
}

async function remoteInspect(config, baseline = "") {
  const values = parseKeyValueOutput(await remoteBash(config, REMOTE_INSPECT, [config.target, baseline]));
  return {
    exists: decodeB64(values.EXISTS).toString() === "1",
    root: decodeB64(values.ROOT).toString(), head: decodeB64(values.HEAD).toString(),
    tree: decodeB64(values.TREE).toString(),
    branch: decodeB64(values.BRANCH).toString(), rootCommit: decodeB64(values.ROOT_COMMIT).toString(),
    rootSubject: decodeB64(values.ROOT_SUBJECT).toString(), remotes: decodeB64(values.REMOTES).toString(),
    status: decodeB64(values.STATUS_B64), ancestor: decodeB64(values.ANCESTOR).toString() === "1",
    changed: decodeB64(values.CHANGED_B64),
  };
}

function assertRemoteClean(inspect, target) {
  if (!inspect.exists) fail("remote_target_missing");
  if (inspect.root !== target) fail("remote_git_root_mismatch");
  if (inspect.remotes) fail("remote_git_remote_forbidden");
  if (inspect.status.length) fail("remote_worktree_dirty");
}

function recordFile(stateRoot) { return path.join(stateRoot, "record.json"); }
function metadataFile(stateRoot) { return path.join(stateRoot, "metadata.json"); }
function loadRecord(stateRoot) {
  const record = readJson(recordFile(stateRoot));
  if (!record) return null;
  if (record.version !== WORKFLOW_VERSION) fail("workflow_record_version_unsupported");
  return record;
}
function saveRecord(stateRoot, record) { atomicJson(recordFile(stateRoot), record); }
function loadMetadata(stateRoot) {
  const metadata = readJson(metadataFile(stateRoot));
  if (!metadata) return null;
  if (metadata.version !== WORKFLOW_VERSION || metadata.workflow !== "codex-remote-development") {
    fail("workflow_metadata_version_unsupported");
  }
  return metadata;
}
function saveMetadata(stateRoot, metadata) { atomicJson(metadataFile(stateRoot), metadata); }

function assertMetadataAdmission(config, source) {
  const metadata = loadMetadata(config.stateRoot);
  if (!metadata) fail("metadata_required");
  if (
    metadata.sourceRoot !== config.sourceRoot ||
    metadata.target !== config.target ||
    metadata.sshHost !== config.sshHost
  ) fail("workflow_metadata_scope_mismatch");
  if (metadata.sourceFingerprint !== source.fingerprint) fail("metadata_source_changed");
  return metadata;
}

function configFrom() {
  assertMacCoordinator();
  const sourceRoot = fs.realpathSync(ensureAbsolute(DEFAULT_SOURCE_ROOT, "invalid_source_root"));
  if (sourceRoot !== DEFAULT_SOURCE_ROOT) fail("mac_source_root_mismatch");
  const target = ensureRemotePath(DEFAULT_TARGET);
  const stateRoot = ensureAbsolute(DEFAULT_STATE_ROOT, "invalid_state_root");
  const sshHost = DEFAULT_SSH_HOST;
  if (!fs.existsSync(path.join(sourceRoot, ".git"))) fail("mac_repository_git_missing");
  return { sourceRoot, target, stateRoot, sshHost };
}

const REMOTE_CLEAN_EXCLUDES = `
set -euo pipefail
target=$1
exclude="$target/.git/info/exclude"
grep -qxF 'node_modules/' "$exclude" || printf '%s\\n' 'node_modules/' >> "$exclude"
grep -qxF 'dist/' "$exclude" || printf '%s\\n' 'dist/' >> "$exclude"
grep -qxF 'coverage/' "$exclude" || printf '%s\\n' 'coverage/' >> "$exclude"
grep -qxF 'build/' "$exclude" || printf '%s\\n' 'build/' >> "$exclude"
grep -qxF '.cache/' "$exclude" || printf '%s\\n' '.cache/' >> "$exclude"
grep -qxF '__pycache__/' "$exclude" || printf '%s\\n' '__pycache__/' >> "$exclude"
grep -qxF '*.pyc' "$exclude" || printf '%s\\n' '*.pyc' >> "$exclude"
`;

const REMOTE_INSTALL = `
set -euo pipefail
target=$1
stage=$2
quarantine=$3
expected_head=$4
expected_exists=$5
snapshot_id=$6
old_present=0
installed=0
rollback() {
  if test "$installed" -eq 1 && test -e "$target"; then rm -rf -- "$target"; fi
  if test "$old_present" -eq 1 && test -e "$quarantine" && test ! -e "$target"; then mv -- "$quarantine" "$target"; fi
}
trap rollback ERR
if test "$expected_exists" = 1; then
  test -d "$target/.git"
  test "$(git -C "$target" rev-parse HEAD)" = "$expected_head"
  test -z "$(git -C "$target" status --porcelain=v1 --untracked-files=all)"
  test -z "$(git -C "$target" remote -v)"
else
  test ! -e "$target"
fi
test ! -e "$quarantine"
if test "$expected_exists" = 1; then mv -- "$target" "$quarantine"; old_present=1; fi
mv -- "$stage" "$target"
installed=1
git -C "$target" init --initial-branch=main >/dev/null
git -C "$target" config --local user.name 'Codex Remote Workflow'
git -C "$target" config --local user.email 'codex-remote-workflow@localhost'
git -C "$target" add --all
git -C "$target" commit --no-verify -m "baseline: delivered snapshot $snapshot_id" >/dev/null
${REMOTE_CLEAN_EXCLUDES}
test -z "$(git -C "$target" status --porcelain=v1 --untracked-files=all)"
test -z "$(git -C "$target" remote -v)"
printf 'HEAD=%s\\n' "$(git -C "$target" rev-parse HEAD)"
printf 'TREE=%s\\n' "$(git -C "$target" rev-parse HEAD^{tree})"
printf 'QUARANTINE=%s\\n' "$([ "$old_present" -eq 1 ] && printf '%s' "$quarantine" || true)"
trap - ERR
`;

const REMOTE_SETUP = `
set -u
target=$1
cd "$target"
log=$(mktemp /data/data/com.termux/files/usr/tmp/softie-workflow-setup.XXXXXX.log)
trap 'rm -f -- "$log"' EXIT
status=0
npm ci --no-audit --no-fund >"$log" 2>&1 || status=$?
printf 'SETUP_EXIT=%s\\n' "$status"
tail -n 30 "$log"
exit "$status"
`;

const REMOTE_VERIFY = `
set -u
target=$1
overall=0
run_check() {
  name=$1
  shift
  log=$(mktemp /data/data/com.termux/files/usr/tmp/softie-workflow-check.XXXXXX.log)
  status=0
  "$@" >"$log" 2>&1 || status=$?
  printf 'CHECK=%s EXIT=%s\\n' "$name" "$status"
  tail -n 40 "$log"
  rm -f -- "$log"
  if test "$status" -ne 0; then overall=1; fi
}
cd "$target"
run_check npm-test-source-local npm run test:source-local
run_check npm-build npm run build
dev_log=$(mktemp /data/data/com.termux/files/usr/tmp/softie-workflow-dev.XXXXXX.log)
dev_pid=
cleanup_dev() {
  if test -n "\${dev_pid:-}"; then
    kill -TERM -- "-$dev_pid" 2>/dev/null || true
    kill -TERM "$dev_pid" 2>/dev/null || true
    wait "$dev_pid" 2>/dev/null || true
  fi
  rm -f -- "$dev_log"
}
trap cleanup_dev EXIT
setsid npm run dev -- --host 127.0.0.1 --port 5173 --strictPort >"$dev_log" 2>&1 &
dev_pid=$!
http_code=000
attempt=0
while test "$attempt" -lt 35; do
  http_code=$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:5173/ 2>/dev/null || true)
  test "$http_code" = 200 && break
  sleep 1
  attempt=$((attempt + 1))
done
if test "$http_code" = 200; then
  printf 'CHECK=dev-server EXIT=0 HTTP=%s\\n' "$http_code"
else
  printf 'CHECK=dev-server EXIT=1 HTTP=%s\\n' "$http_code"
  tail -n 40 "$dev_log"
  overall=1
fi
cleanup_dev
dev_pid=
status_b64=$(git status --porcelain=v1 -z --untracked-files=all | base64 | tr -d '\\n')
printf 'POST_STATUS_B64=%s\\n' "$status_b64"
exit "$overall"
`;

const REMOTE_ARCHIVE = `
set -euo pipefail
target=$1
head=$2
shift 2
test "$#" -gt 0
git -c diff.renames=false -C "$target" archive --format=tar "$head" -- "$@"
`;

const REMOTE_TAR_PATH = `
set -euo pipefail
target=$1
test -d "$target"
test ! -L "$target"
tar -cf - -C "$target" .
`;

const REMOTE_WRITE_METADATA = `
set -euo pipefail
output=$1
case "$output" in
  /data/data/com.termux/files/home/codex-remote-development/mac-softie-candidates.manifest.json) ;;
  *)
    printf '%s\\n' invalid_metadata_output >&2
    exit 64
    ;;
esac
umask 077
temporary=$(mktemp "$output.tmp.XXXXXX")
cleanup() { rm -f -- "$temporary"; }
trap cleanup EXIT
cat > "$temporary"
chmod 600 "$temporary"
mv -f -- "$temporary" "$output"
trap - EXIT
printf 'BYTES=%s\\n' "$(wc -c < "$output" | tr -d ' ')"
printf 'SHA256=%s\\n' "$(sha256sum "$output" | awk '{print $1}')"
printf 'MODE=%s\\n' "$(stat -c '%a' "$output")"
`;

const REMOTE_REMOVE = `
set -euo pipefail
target=$1
case "$target" in
  /data/data/com.termux/files/home/codex-remote-development/.softie_project.workflow-stage-*|/data/data/com.termux/files/home/codex-remote-development/.softie_project.workflow-previous-*|/data/data/com.termux/files/home/codex-remote-development/.softie_project.workflow-cycle-*)
    rm -rf -- "$target"
    ;;
  *)
    printf '%s\\n' invalid_cleanup_path >&2
    exit 64
    ;;
esac
`;

const REMOTE_ROLLBACK_INSTALL = `
set -euo pipefail
target=$1
quarantine=$2
expected_head=$3
old_present=$4
test -d "$target/.git"
test "$(git -C "$target" rev-parse HEAD)" = "$expected_head"
test -z "$(git -C "$target" status --porcelain=v1 --untracked-files=all)"
rm -rf -- "$target"
if test "$old_present" = 1; then
  test -d "$quarantine/.git"
  mv -- "$quarantine" "$target"
fi
`;

function archiveDirectory(directory) {
  const result = runProcess(TAR, [
    "--no-xattrs", "--no-mac-metadata", "-cf", "-", "-C", directory, ".",
  ], { maxOutput: MAX_SNAPSHOT_BYTES });
  return result.then((value) => {
    if (value.code !== 0) fail("local_snapshot_archive_failed");
    return value.stdout;
  });
}

async function extractArchive(archive, directory) {
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const result = await runProcess(TAR, ["-p", "-xf", "-", "-C", directory], {
    input: archive, maxOutput: 1024 * 1024,
  });
  if (result.code !== 0) fail("local_snapshot_extract_failed");
}

function removeLocalTemporary(directory) {
  if (directory) fs.rmSync(directory, { recursive: true, force: true });
}

async function removeRemotePath(config, remotePath) {
  try {
    await remoteBash(config, REMOTE_REMOVE, [remotePath], undefined, 1024 * 1024);
  } catch {
    return false;
  }
  return true;
}

async function rollbackRemoteInstall(config, target, quarantine, expectedHead, oldPresent) {
  await remoteBash(config, REMOTE_ROLLBACK_INSTALL, [target, quarantine, expectedHead, oldPresent ? "1" : "0"], undefined, 1024 * 1024);
}

function plainKeyValue(buffer) {
  const result = {};
  for (const line of buffer.toString("utf8").split("\n")) {
    const separator = line.indexOf("=");
    if (separator > 0) result[line.slice(0, separator)] = line.slice(separator + 1);
  }
  return result;
}

function assertInitialRemoteSafe(inspect, config, record) {
  if (!inspect.exists) return { exists: false, head: "" };
  assertRemoteClean(inspect, config.target);
  if (record?.status === "verified") fail("remote_verified_changes_pending_apply");
  if (record?.status === "applied") {
    if (inspect.head !== record.remote.head) fail("remote_target_drift_after_apply");
    return { exists: true, head: inspect.head };
  }
  if (inspect.rootCommit !== inspect.head || !inspect.rootSubject.startsWith("baseline:")) {
    fail("remote_baseline_commit_required");
  }
  if (record && inspect.head !== record.remote.baselineHead) fail("remote_target_drift");
  return { exists: true, head: inspect.head };
}

async function transferToRemoteStage(config, source, stage) {
  const localStage = buildLocalStage(source.files);
  let roundTrip;
  try {
    const archive = await archiveDirectory(localStage);
    await remoteBash(config, REMOTE_EXTRACT, [stage], archive, MAX_SNAPSHOT_BYTES + 1024 * 1024);
    const remoteArchive = await remoteBash(config, REMOTE_TAR_PATH, [stage], undefined, MAX_SNAPSHOT_BYTES + 1024 * 1024);
    roundTrip = fs.mkdtempSync(path.join(os.tmpdir(), "softie-remote-roundtrip-"));
    await extractArchive(remoteArchive, roundTrip);
    compareStageToSnapshot(roundTrip, source.files);
  } finally {
    removeLocalTemporary(localStage);
    removeLocalTemporary(roundTrip);
  }
}

function validateDeltaFiles(deltaRoot, changes) {
  const expectedPaths = changes.filter((entry) => entry.status !== "D").map((entry) => entry.path);
  const expected = new Set(expectedPaths);
  const actual = collectRegularFiles(deltaRoot);
  if (actual.size !== expected.size || [...actual.keys()].some((filePath) => !expected.has(filePath))) {
    fail("remote_delta_file_set_mismatch");
  }
  const snapshot = repositorySnapshot(deltaRoot, {}, {
    allowedPaths: expected,
    maxFiles: MAX_CHANGED_FILES,
    maxBytes: MAX_CHANGED_BYTES,
  });
  if (snapshot.omitted.some((entry) => !isPortableSnapshotAllowlisted(entry.path))) fail("remote_delta_snapshot_rejected");
  const files = [];
  let totalBytes = 0;
  for (const filePath of expectedPaths) {
    const entry = actual.get(filePath);
    if (!entry) fail("remote_delta_file_missing");
    coordinatorRelativeFile(filePath);
    const portableAllowlisted = isPortableSnapshotAllowlisted(filePath);
    if (snapshotExcluded(filePath) && !portableAllowlisted) fail("remote_delta_protected_path");
    const maxFileBytes = portableAllowlisted ? PORTABLE_SNAPSHOT_MAX_FILE_BYTES : MAX_CHANGED_FILE_BYTES;
    if (entry.data.length > maxFileBytes) fail("remote_delta_file_too_large");
    if (entry.data.includes(0) && !portableAllowlisted) fail("remote_delta_binary");
    totalBytes += entry.data.length;
    files.push({ path: filePath, data: entry.data, hash: entry.hash, mode: entry.mode });
  }
  if (totalBytes > MAX_CHANGED_BYTES) fail("remote_delta_too_large");
  return files.sort((a, b) => a.path.localeCompare(b.path, "en"));
}

function deltaDigest(baseHead, head, changes, files) {
  return sha256(JSON.stringify({
    baseHead,
    head,
    changes,
    files: files.map(({ path: filePath, hash, mode }) => ({ path: filePath, hash, mode })),
  }));
}

function parseChecks(output) {
  const checks = [];
  for (const line of output.toString("utf8").split("\n")) {
    const match = /^CHECK=([^ ]+) EXIT=(\d+)(?: HTTP=(\d+))?$/.exec(line.trim());
    if (match) checks.push({ name: match[1], exit: Number(match[2]), ...(match[3] ? { http: Number(match[3]) } : {}) });
  }
  return checks;
}

async function withStateLockAsync(config, operation) {
  mkdirPrivate(config.stateRoot);
  const lock = path.join(config.stateRoot, "lock");
  try {
    fs.mkdirSync(lock, { mode: 0o700 });
  } catch (error) {
    if (error.code === "EEXIST") fail("workflow_busy");
    throw error;
  }
  try {
    return await operation();
  } finally {
    fs.rmSync(lock, { recursive: true, force: true });
  }
}

async function refresh(config) {
  return withStateLockAsync(config, async () => {
    const record = loadRecord(config.stateRoot);
    if (record && record.sourceRoot !== config.sourceRoot) fail("workflow_source_mismatch");
    if (record?.status === "verified") fail("remote_verified_changes_pending_apply");
    const source = await captureSource(config.sourceRoot, config.stateRoot);
    assertMetadataAdmission(config, source);
    const existing = await remoteInspect(config);
    const oldState = assertInitialRemoteSafe(existing, config, record);
    const snapshotId = `${now().replace(/[-:.TZ]/g, "").slice(0, 14)}-${source.fingerprint.slice(0, 16)}`;
    const stage = `${path.posix.dirname(config.target)}/.softie_project.workflow-stage-${token()}`;
    const quarantine = `${path.posix.dirname(config.target)}/.softie_project.workflow-previous-${token()}`;
    let installed = false;
    let recordSaved = false;
    let baselineHead = "";
    try {
      await transferToRemoteStage(config, source, stage);
      const sourceDuring = await captureSource(config.sourceRoot, config.stateRoot);
      if (sourceDuring.fingerprint !== source.fingerprint) {
        await removeRemotePath(config, stage);
        fail("mac_changed_during_refresh");
      }
      const installOutput = await remoteBash(config, REMOTE_INSTALL, [
        config.target,
        stage,
        quarantine,
        oldState.head || "-",
        oldState.exists ? "1" : "0",
        snapshotId,
      ], undefined, 4 * 1024 * 1024);
      installed = true;
      const installValues = plainKeyValue(installOutput);
      baselineHead = installValues.HEAD;
      const baselineTree = installValues.TREE;
      if (!/^[0-9a-f]{40}$/.test(baselineHead || "") || !/^[0-9a-f]{40}$/.test(baselineTree || "")) {
        fail("remote_install_result_invalid");
      }
      const afterInstall = await captureSource(config.sourceRoot, config.stateRoot);
      if (afterInstall.fingerprint !== source.fingerprint) {
        await rollbackRemoteInstall(config, config.target, quarantine, baselineHead, oldState.exists);
        installed = false;
        fail("mac_changed_during_refresh");
      }
      const remote = await remoteInspect(config);
      assertRemoteClean(remote, config.target);
      if (remote.head !== baselineHead || remote.tree !== baselineTree || remote.rootCommit !== baselineHead) {
        fail("remote_baseline_verification_failed");
      }
      const nextRecord = {
        version: WORKFLOW_VERSION,
        workflow: "codex-remote-development",
        status: "refreshed",
        refreshedAt: now(),
        sourceRoot: config.sourceRoot,
        target: config.target,
        sshHost: config.sshHost,
        snapshotId,
        source: sourceRecordView(source),
        remote: {
          baselineHead,
          baselineTree,
          head: baselineHead,
          tree: baselineTree,
          quarantine: installValues.QUARANTINE || null,
        },
        policy: {
          snapshotExclusion: "active-development-console-boundary",
          portableSnapshotAllowlist: [...PORTABLE_SNAPSHOT_ALLOWLIST],
          credentialsAndOperatingState: "excluded",
          macMutation: "guarded",
          targetGit: "local-only-no-remote",
        },
      };
      saveRecord(config.stateRoot, nextRecord);
      recordSaved = true;
      return { ok: true, command: "refresh", record: nextRecord };
    } catch (error) {
      if (installed && !recordSaved && baselineHead) {
        try { await rollbackRemoteInstall(config, config.target, quarantine, baselineHead, oldState.exists); } catch {}
      } else if (!installed) {
        await removeRemotePath(config, stage);
      }
      throw error;
    }
  });
}

async function setup(config) {
  return withStateLockAsync(config, async () => {
    const record = loadRecord(config.stateRoot);
    if (!record || !["refreshed", "setup"].includes(record.status)) fail("refresh_required");
    if (record.sourceRoot !== config.sourceRoot) fail("workflow_source_mismatch");
    if (record.target !== config.target || record.sshHost !== config.sshHost) fail("workflow_target_mismatch");
    const remote = await remoteInspect(config, record.remote.baselineHead);
    assertRemoteClean(remote, config.target);
    if (remote.head !== record.remote.baselineHead || !remote.ancestor) fail("remote_baseline_drift");
    const result = await remoteBashResult(config, REMOTE_SETUP, [config.target], undefined, 4 * 1024 * 1024);
    const output = result.stdout;
    if (result.code !== 0) fail("remote_setup_failed");
    const setupExit = /SETUP_EXIT=(\d+)/.exec(output.toString("utf8"));
    if (!setupExit || Number(setupExit[1]) !== 0) fail("remote_setup_failed");
    const after = await remoteInspect(config, record.remote.baselineHead);
    assertRemoteClean(after, config.target);
    const nextRecord = {
      ...record,
      status: "setup",
      setupAt: now(),
      setup: { exit: 0, outputSha256: sha256(output) },
    };
    saveRecord(config.stateRoot, nextRecord);
    return { ok: true, command: "setup", record: nextRecord };
  });
}

async function collectRemoteDelta(config, record, inspect) {
  const changes = parseNameStatusZ(inspect.changed);
  if (!changes.length) fail("remote_no_committed_changes");
  const nonDeleted = changes.filter((entry) => entry.status !== "D");
  const deltaRoot = fs.mkdtempSync(path.join(os.tmpdir(), "softie-remote-delta-"));
  try {
    if (nonDeleted.length) {
      const archive = await remoteBash(config, REMOTE_ARCHIVE, [
        config.target,
        inspect.head,
        ...nonDeleted.map((entry) => entry.path),
      ], undefined, MAX_CHANGED_BYTES + 1024 * 1024);
      await extractArchive(archive, deltaRoot);
    }
    const files = validateDeltaFiles(deltaRoot, changes);
    const digest = deltaDigest(record.remote.baselineHead, inspect.head, changes, files);
    return { changes, files, deltaSha256: digest };
  } finally {
    removeLocalTemporary(deltaRoot);
  }
}

async function verify(config) {
  return withStateLockAsync(config, async () => {
    const record = loadRecord(config.stateRoot);
    if (!record || record.status !== "setup") fail("setup_required");
    if (record.sourceRoot !== config.sourceRoot) fail("workflow_source_mismatch");
    if (record.target !== config.target || record.sshHost !== config.sshHost) fail("workflow_target_mismatch");
    const sourceBefore = await captureSource(config.sourceRoot, config.stateRoot);
    if (sourceBefore.fingerprint !== record.source.fingerprint) fail("mac_changed_since_refresh_verify_aborted");
    const before = await remoteInspect(config, record.remote.baselineHead);
    assertRemoteClean(before, config.target);
    if (before.head === record.remote.baselineHead || !before.ancestor) fail("remote_baseline_or_ancestor_invalid");
    const checkResult = await remoteBashResult(config, REMOTE_VERIFY, [config.target], undefined, 8 * 1024 * 1024);
    const checks = parseChecks(checkResult.stdout);
    if (checkResult.code !== 0 || checks.some((check) => check.exit !== 0)) {
      if (process.env.SOFTIE_REMOTE_DEBUG === "1") {
        process.stderr.write(`REMOTE_VERIFY_EXIT=${checkResult.code}\n${checkResult.stdout.toString("utf8").slice(-8000)}\n${checkResult.stderr.toString("utf8").slice(-4000)}\n`);
      }
      fail("remote_verification_failed");
    }
    const after = await remoteInspect(config, record.remote.baselineHead);
    assertRemoteClean(after, config.target);
    if (after.head !== before.head || after.tree !== before.tree) fail("remote_changed_during_verify");
    const delta = await collectRemoteDelta(config, record, after);
    const sourceAfter = await captureSource(config.sourceRoot, config.stateRoot);
    if (sourceAfter.fingerprint !== record.source.fingerprint) fail("mac_changed_during_verify");
    const verification = {
      verifiedAt: now(),
      baseHead: record.remote.baselineHead,
      head: after.head,
      tree: after.tree,
      checks,
      changes: delta.changes,
      files: delta.files.map(({ path: filePath, hash, mode }) => ({ path: filePath, hash, mode })),
      deltaSha256: delta.deltaSha256,
    };
    const nextRecord = { ...record, status: "verified", verification, remote: { ...record.remote, head: after.head, tree: after.tree } };
    saveRecord(config.stateRoot, nextRecord);
    return { ok: true, command: "verify", record: nextRecord };
  });
}

function readCurrentFile(root, filePath) {
  const destination = coordinatorSafeFile(root, filePath, true);
  let stat;
  try {
    stat = fs.lstatSync(destination);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
  if (stat.isSymbolicLink()) fail("mac_apply_symlink_path");
  if (!stat.isFile()) fail("mac_apply_non_file_path");
  const data = fs.readFileSync(destination);
  return { path: filePath, data, hash: sha256(data), mode: stat.mode & 0o777 };
}

function ensureParentDirectories(root, filePath) {
  const parts = filePath.split("/");
  let current = root;
  for (const part of parts.slice(0, -1)) {
    current = path.join(current, part);
    let stat;
    try {
      stat = fs.lstatSync(current);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      fs.mkdirSync(current, { mode: 0o700 });
      stat = fs.lstatSync(current);
    }
    if (stat.isSymbolicLink() || !stat.isDirectory()) fail("mac_apply_parent_path_invalid");
  }
}

function writeAtomicFile(root, filePath, data, mode) {
  const destination = coordinatorSafeFile(root, filePath, true);
  ensureParentDirectories(root, filePath);
  const temporary = `${destination}.codex-remote-${token()}.tmp`;
  try {
    fs.writeFileSync(temporary, data, { flag: "wx", mode: mode & 0o777 });
    fs.chmodSync(temporary, mode & 0o777);
    fs.renameSync(temporary, destination);
  } finally {
    try { fs.unlinkSync(temporary); } catch {}
  }
}

function unlinkFile(root, filePath) {
  const destination = coordinatorSafeFile(root, filePath, true);
  let stat;
  try {
    stat = fs.lstatSync(destination);
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  if (stat.isSymbolicLink() || !stat.isFile()) fail("mac_apply_delete_path_invalid");
  fs.unlinkSync(destination);
}

function expectedSourceManifest(record, changes, files) {
  const expected = manifestMap(record.source.manifest);
  const fileMap = new Map(files.map((entry) => [entry.path, entry]));
  for (const change of changes) {
    if (change.status === "D") expected.delete(change.path);
    else {
      const file = fileMap.get(change.path);
      if (!file) fail("remote_delta_file_missing");
      expected.set(change.path, { path: change.path, hash: file.hash, mode: file.mode });
    }
  }
  return sortedManifest([...expected.values()]);
}

function assertMacApplyBase(config, record, changes, source) {
  const baseline = manifestMap(record.source.manifest);
  const dirtyPaths = new Set(record.source.dirtyPaths || []);
  for (const change of changes) {
    if (dirtyPaths.has(change.path)) fail("mac_dirty_apply_overlap");
    const expected = baseline.get(change.path);
    const current = readCurrentFile(config.sourceRoot, change.path);
    if (change.status === "D") {
      if (!expected || !current || current.hash !== expected.hash || current.mode !== expected.mode) {
        fail("mac_apply_base_conflict");
      }
    } else if (expected) {
      if (!current || current.hash !== expected.hash || current.mode !== expected.mode) fail("mac_apply_base_conflict");
    } else if (current) {
      fail("mac_apply_untracked_conflict");
    }
  }
  if (source.head !== record.source.head || source.branch !== record.source.branch || source.index !== record.source.index) {
    fail("mac_apply_git_base_conflict");
  }
}

function backupChangedFiles(config, changes, backupDirectory) {
  mkdirPrivate(backupDirectory);
  const backups = [];
  let index = 0;
  for (const change of changes) {
    const current = readCurrentFile(config.sourceRoot, change.path);
    if (!current) {
      backups.push({ path: change.path, existed: false });
      continue;
    }
    const backupFile = path.join(backupDirectory, `${String(index++).padStart(3, "0")}.bin`);
    const portableAllowlisted = isPortableSnapshotAllowlisted(change.path);
    const maxFileBytes = portableAllowlisted ? PORTABLE_SNAPSHOT_MAX_FILE_BYTES : MAX_CHANGED_FILE_BYTES;
    if (current.data.length > maxFileBytes || (current.data.includes(0) && !portableAllowlisted)) fail("mac_apply_backup_rejected");
    fs.writeFileSync(backupFile, current.data, { flag: "wx", mode: 0o600 });
    backups.push({ path: change.path, existed: true, file: backupFile, hash: current.hash, mode: current.mode });
  }
  return backups;
}

function restoreBackupEntry(config, backup) {
  if (!backup.existed) {
    unlinkFile(config.sourceRoot, backup.path);
    return;
  }
  const data = fs.readFileSync(backup.file);
  writeAtomicFile(config.sourceRoot, backup.path, data, backup.mode);
}

function assertExpectedAppliedPath(config, applied) {
  const current = readCurrentFile(config.sourceRoot, applied.path);
  if (!applied.existedAfter) {
    if (current) fail("apply_rollback_conflict");
    return;
  }
  if (!current || current.hash !== applied.hashAfter || current.mode !== applied.modeAfter) fail("apply_rollback_conflict");
}

async function applyVerified(config, dryRun = false) {
  return withStateLockAsync(config, async () => {
    const record = loadRecord(config.stateRoot);
    if (!record || record.status !== "verified") fail("verified_changes_required");
    if (record.sourceRoot !== config.sourceRoot) fail("workflow_source_mismatch");
    if (record.target !== config.target || record.sshHost !== config.sshHost) fail("workflow_target_mismatch");
    const source = await captureSource(config.sourceRoot, config.stateRoot);
    if (source.fingerprint !== record.source.fingerprint) fail("mac_changed_since_refresh_apply_aborted");
    const remote = await remoteInspect(config, record.remote.baselineHead);
    assertRemoteClean(remote, config.target);
    if (remote.head !== record.verification.head || remote.tree !== record.verification.tree || !remote.ancestor) {
      fail("remote_verified_target_drift");
    }
    const delta = await collectRemoteDelta(config, record, remote);
    if (delta.deltaSha256 !== record.verification.deltaSha256) fail("remote_verification_attestation_mismatch");
    if (JSON.stringify(delta.changes) !== JSON.stringify(record.verification.changes)) fail("remote_verification_change_set_mismatch");
    if (JSON.stringify(delta.files.map(({ path: filePath, hash, mode }) => ({ path: filePath, hash, mode }))) !== JSON.stringify(record.verification.files)) {
      fail("remote_verification_file_attestation_mismatch");
    }
    assertMacApplyBase(config, record, delta.changes, source);
    const expectedManifest = expectedSourceManifest(record, delta.changes, delta.files);
    const plan = {
      changes: delta.changes,
      files: delta.files.map(({ path: filePath, hash, mode }) => ({ path: filePath, hash, mode })),
      baseHead: record.source.head,
      remoteBaseHead: record.remote.baselineHead,
      remoteHead: remote.head,
      deltaSha256: delta.deltaSha256,
      sourceGuard: record.source.fingerprint,
      expectedManifest,
    };
    if (dryRun) return { ok: true, command: "apply", dryRun: true, plan };

    const backupDirectory = path.join(config.stateRoot, `backup-${token()}`);
    const backups = backupChangedFiles(config, delta.changes, backupDirectory);
    const applying = {
      ...record,
      status: "applying",
      applyStartedAt: now(),
      apply: { ...plan, backups },
    };
    saveRecord(config.stateRoot, applying);
    const applied = [];
    try {
      const fileMap = new Map(delta.files.map((entry) => [entry.path, entry]));
      for (const change of delta.changes) {
        if (change.status === "D") {
          unlinkFile(config.sourceRoot, change.path);
          applied.push({ path: change.path, existedAfter: false });
          continue;
        }
        const file = fileMap.get(change.path);
        if (!file) fail("remote_delta_file_missing");
        writeAtomicFile(config.sourceRoot, change.path, file.data, file.mode);
        applied.push({ path: change.path, existedAfter: true, hashAfter: file.hash, modeAfter: file.mode });
      }
      const afterSource = await captureSource(config.sourceRoot, config.stateRoot);
      if (afterSource.head !== source.head || afterSource.branch !== source.branch || afterSource.index !== source.index || !sameManifest(afterSource.manifest, expectedManifest)) {
        fail("mac_changed_during_apply");
      }
      const appliedRecord = {
        ...record,
        status: "applied",
        appliedAt: now(),
        apply: {
          ...plan,
          backups,
          postcondition: {
            head: afterSource.head,
            branch: afterSource.branch,
            index: afterSource.index,
            manifest: afterSource.manifest,
            fingerprint: afterSource.fingerprint,
          },
        },
        remote: { ...record.remote, head: remote.head, tree: remote.tree },
      };
      saveRecord(config.stateRoot, appliedRecord);
      return { ok: true, command: "apply", dryRun: false, plan, record: appliedRecord };
    } catch (error) {
      try {
        for (const entry of [...applied].reverse()) {
          assertExpectedAppliedPath(config, entry);
          const backup = backups.find((candidate) => candidate.path === entry.path);
          restoreBackupEntry(config, backup);
        }
        saveRecord(config.stateRoot, { ...record, status: "verified", applyRollbackAt: now(), applyRollbackReason: error.message });
      } catch {
        saveRecord(config.stateRoot, { ...applying, status: "apply_recovery_required", recoveryRequiredAt: now() });
        fail("apply_recovery_required");
      }
      throw error;
    }
  });
}

async function status(config) {
  const record = loadRecord(config.stateRoot);
  if (!record) return { ok: true, command: "status", status: "never_refreshed" };
  const expectedSourceFingerprint = record.status === "applied"
    ? record.apply?.postcondition?.fingerprint || record.source.fingerprint
    : record.source.fingerprint;
  let sourceGuard;
  try {
    const source = await captureSource(config.sourceRoot, config.stateRoot);
    sourceGuard = { match: source.fingerprint === expectedSourceFingerprint, head: source.head, branch: source.branch };
  } catch (error) {
    sourceGuard = { match: false, error: error.message };
  }
  let remoteState;
  try {
    const remote = await remoteInspect(config, record.remote?.baselineHead || "");
    remoteState = {
      exists: remote.exists,
      root: remote.root,
      head: remote.head,
      tree: remote.tree,
      branch: remote.branch,
      clean: remote.exists && remote.root === config.target && !remote.status.length && !remote.remotes,
      changedBytes: remote.changed.length,
    };
  } catch (error) {
    remoteState = { error: error.message };
  }
  return {
    ok: true,
    command: "status",
    status: record.status,
    snapshotId: record.snapshotId,
    target: record.target,
    sshHost: record.sshHost,
    sourceGuard,
    remote: remoteState,
    verification: record.verification ? {
      baseHead: record.verification.baseHead,
      head: record.verification.head,
      checks: record.verification.checks,
      changes: record.verification.changes,
      deltaSha256: record.verification.deltaSha256,
    } : null,
  };
}

async function metadata(config) {
  return withStateLockAsync(config, async () => {
    const record = loadRecord(config.stateRoot);
    if (record?.status === "verified") fail("remote_verified_changes_pending_apply");
    const source = await captureSource(config.sourceRoot, config.stateRoot);
    const manifest = buildSanitizedRepositoryManifest(config.sourceRoot);
    const payload = serializeSanitizedManifest(manifest);
    const output = DEFAULT_METADATA_TARGET;
    if (output !== `${path.posix.dirname(config.target)}/mac-softie-candidates.manifest.json`) {
      fail("invalid_metadata_output");
    }
    const result = await remoteBash(config, REMOTE_WRITE_METADATA, [output], payload, 8 * 1024 * 1024);
    const values = plainKeyValue(result);
    const byteCount = Number(values.BYTES);
    const expectedHash = sha256(payload);
    if (
      !Number.isSafeInteger(byteCount) ||
      byteCount !== payload.length ||
      values.SHA256 !== expectedHash ||
      values.MODE !== "600"
    ) fail("remote_metadata_result_invalid");
    const exclusionCounts = {};
    for (const item of manifest.items) {
      const reason = item.snapshot_exclusion_reason || "included";
      exclusionCounts[reason] = (exclusionCounts[reason] || 0) + 1;
    }
    saveMetadata(config.stateRoot, {
      version: WORKFLOW_VERSION,
      workflow: "codex-remote-development",
      deliveredAt: now(),
      sourceRoot: config.sourceRoot,
      target: config.target,
      sshHost: config.sshHost,
      sourceFingerprint: source.fingerprint,
      manifestSha256: expectedHash,
      itemCount: manifest.items.length,
    });
    return {
      ok: true,
      command: "metadata",
      status: "delivered",
      schemaVersion: manifest.schema_version,
      pathBasis: manifest.path_basis,
      itemCount: manifest.items.length,
      exclusionCounts,
      portableSnapshotAllowlist: [...PORTABLE_SNAPSHOT_ALLOWLIST],
      remote: { bytes: byteCount, sha256: values.SHA256, mode: values.MODE },
    };
  });
}

function parseCli(argv) {
  const [command, ...rest] = argv;
  let dryRun = false;
  for (const argument of rest) {
    if (argument === "--dry-run") { dryRun = true; continue; }
    if (argument === "--json") continue;
    fail("invalid_argument");
  }
  if (!REMOTE_INTERFACE_COMMANDS.includes(command)) fail("invalid_command");
  if (dryRun && command !== "apply") fail("invalid_argument");
  return { command, dryRun };
}

function summarizeResult(result) {
  if (result.command === "refresh") {
    const { record } = result;
    return {
      ok: true, command: result.command, status: record.status, snapshotId: record.snapshotId,
      source: { head: record.source.head, branch: record.source.branch, dirtyPaths: record.source.dirtyPaths, omitted: record.source.omitted },
      remote: { baselineHead: record.remote.baselineHead, baselineTree: record.remote.baselineTree, quarantine: record.remote.quarantine },
    };
  }
  if (result.command === "setup") {
    return { ok: true, command: result.command, status: result.record.status, setupAt: result.record.setupAt };
  }
  if (result.command === "verify") {
    return {
      ok: true, command: result.command, status: result.record.status,
      baseHead: result.record.verification.baseHead, head: result.record.verification.head,
      checks: result.record.verification.checks, changes: result.record.verification.changes,
      deltaSha256: result.record.verification.deltaSha256,
    };
  }
  if (result.command === "apply") {
    return {
      ok: true, command: result.command, dryRun: result.dryRun,
      status: result.dryRun ? "verified" : result.record.status,
      sourceGuard: result.plan.sourceGuard,
      baseHead: result.plan.remoteBaseHead, head: result.plan.remoteHead,
      changes: result.plan.changes, deltaSha256: result.plan.deltaSha256,
    };
  }
  if (result.command === "metadata") return result;
  return result;
}

export async function execute(argv = process.argv.slice(2)) {
  const parsed = parseCli(argv);
  const config = configFrom();
  let result;
  if (parsed.command === "refresh") result = await refresh(config);
  else if (parsed.command === "setup") result = await setup(config);
  else if (parsed.command === "verify") result = await verify(config);
  else if (parsed.command === "apply") result = await applyVerified(config, parsed.dryRun);
  else if (parsed.command === "metadata") result = await metadata(config);
  else result = await status(config);
  return summarizeResult(result);
}

if (import.meta.url === pathToFileURL(path.resolve(process.argv[1] || "")).href) {
  try {
    const result = await execute();
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`ERROR=${error.message}\n`);
    process.exitCode = 1;
  }
}
