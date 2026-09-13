import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chmod, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  PORTABLE_SNAPSHOT_ALLOWLIST,
  PORTABLE_SNAPSHOT_MAX_FILE_BYTES,
  assertRepositoryRelativePath,
  buildSanitizedRepositoryManifest,
  mergePortableSnapshot,
  serializeSanitizedManifest,
} from "../tools/sanitized-repository-metadata.mjs";

const hash = (data) => createHash("sha256").update(data).digest("hex");

test("portable snapshot allowlist is exactly the reviewed eight paths", () => {
  assert.deepEqual([...PORTABLE_SNAPSHOT_ALLOWLIST], [
    ".github/workflows/astrology-jplephem-equivalence-v1.yml",
    ".github/workflows/de405-legacy-native-matrix.yml",
    ".github/workflows/de405-linux-architecture-evidence.yml",
    ".github/workflows/de405-linux-producer-v0.yml",
    "api/provider/asia-seoul.tzif",
    "src/interpretationPrep/sajuFiveClassicsSourceIdentityFrontier.js",
    "src/interpretationPrep/sajuLineageReadingGrammar.js",
    "src/scheduler/assets/scheduler-atmosphere-v4.jpg",
  ]);
});

async function writeRelative(root, relativePath, data) {
  const destination = path.join(root, ...relativePath.split("/"));
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, data);
  await chmod(destination, 0o644);
}

function manifestItem(manifest, relativePath) {
  const item = manifest.items.find((candidate) => candidate.path === relativePath);
  assert.ok(item, `missing manifest item: ${relativePath}`);
  return item;
}

test("sanitized manifest keeps the portable exception narrow and content-free", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "softie-sanitized-manifest-"));
  const secret = Buffer.from("manifest-must-not-carry-file-content");
  const portableSource = Buffer.alloc(PORTABLE_SNAPSHOT_MAX_FILE_BYTES, 0x70);
  try {
    await writeRelative(root, "safe.txt", Buffer.from("safe"));
    await symlink("safe.txt", path.join(root, "safe-link"));
    await writeRelative(root, "src/large.js", Buffer.alloc(PORTABLE_SNAPSHOT_MAX_FILE_BYTES + 1, 0x6c));
    await writeRelative(root, "assets/preview.jpg", Buffer.from([0, 1, 2]));
    await writeRelative(root, ".gitignore", Buffer.from("ignored metadata"));
    await writeRelative(root, ".env.local", secret);
    await writeRelative(root, "cache/ignored.txt", Buffer.from("ignored"));
    await writeRelative(root, "dist/generated.js", Buffer.from("generated"));
    await writeRelative(root, "supabase/functions/project-brain-answer/index.ts", secret);
    await writeRelative(root, "src/interpretationPrep/sajuLineageReadingGrammar.js", portableSource);
    await writeRelative(root, "api/provider/asia-seoul.tzif", Buffer.from([0, 1, 2]));
    await writeRelative(root, ".github/workflows/astrology-jplephem-equivalence-v1.yml", Buffer.from("workflow"));

    const gitStatuses = new Map([
      ["safe.txt", "tracked"],
      ["safe-link", "tracked"],
      ["src/large.js", "tracked"],
      ["assets/preview.jpg", "tracked"],
      [".gitignore", "tracked"],
      [".env.local", "ignored"],
      ["cache/ignored.txt", "ignored"],
      ["dist/generated.js", "ignored"],
      ["supabase/functions/project-brain-answer/index.ts", "tracked"],
      ["src/interpretationPrep/sajuLineageReadingGrammar.js", "tracked"],
      ["api/provider/asia-seoul.tzif", "tracked"],
      [".github/workflows/astrology-jplephem-equivalence-v1.yml", "tracked"],
    ]);
    const manifest = buildSanitizedRepositoryManifest(root, {
      candidatePaths: [...gitStatuses.keys()],
      gitStatuses,
    });

    assert.deepEqual(Object.keys(manifest).sort(), ["items", "path_basis", "schema_version"]);
    const safe = manifestItem(manifest, "safe.txt");
    assert.equal(safe.snapshot_exclusion_reason, null);
    assert.equal(safe.sha256, hash(Buffer.from("safe")));
    assert.equal(safe.mode, 0o644);

    const link = manifestItem(manifest, "safe-link");
    assert.equal(link.exists, true);
    assert.equal(link.snapshot_exclusion_reason, "symlink");
    assert.equal(link.sha256, null);

    const large = manifestItem(manifest, "src/large.js");
    assert.equal(large.snapshot_exclusion_reason, "too_large");
    assert.equal(large.sha256, null);

    const portableSourceItem = manifestItem(manifest, "src/interpretationPrep/sajuLineageReadingGrammar.js");
    assert.equal(portableSourceItem.snapshot_exclusion_reason, null);
    assert.equal(portableSourceItem.size, PORTABLE_SNAPSHOT_MAX_FILE_BYTES);
    assert.equal(portableSourceItem.sha256, hash(portableSource));

    const portableBinary = manifestItem(manifest, "api/provider/asia-seoul.tzif");
    assert.equal(portableBinary.snapshot_exclusion_reason, null);
    assert.match(portableBinary.sha256, /^[a-f0-9]{64}$/);

    const portableWorkflow = manifestItem(manifest, ".github/workflows/astrology-jplephem-equivalence-v1.yml");
    assert.equal(portableWorkflow.snapshot_exclusion_reason, null);
    assert.equal(portableWorkflow.sha256, hash(Buffer.from("workflow")));

    assert.equal(manifestItem(manifest, "assets/preview.jpg").snapshot_exclusion_reason, "binary");
    assert.equal(manifestItem(manifest, ".gitignore").snapshot_exclusion_reason, "invalid_path");
    assert.equal(manifestItem(manifest, ".env.local").snapshot_exclusion_reason, "protected_or_generated");
    assert.equal(manifestItem(manifest, "supabase/functions/project-brain-answer/index.ts").snapshot_exclusion_reason, "credential_material");
    assert.equal(manifestItem(manifest, "cache/ignored.txt").snapshot_exclusion_reason, "git_ignored");
    assert.equal(manifestItem(manifest, "dist/generated.js").snapshot_exclusion_reason, "protected_or_generated");

    const serialized = serializeSanitizedManifest(manifest).toString("utf8");
    assert.doesNotMatch(serialized, /manifest-must-not-carry-file-content/);
    assert.deepEqual(JSON.parse(serialized), manifest);
    assert.throws(() => assertRepositoryRelativePath("../outside"), /invalid_repository_relative_path/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("mergePortableSnapshot adds only the exact reviewed paths", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "softie-portable-snapshot-"));
  try {
    for (const relativePath of PORTABLE_SNAPSHOT_ALLOWLIST) {
      await writeRelative(root, relativePath, Buffer.from(`portable:${relativePath}`));
    }
    const omittedPath = PORTABLE_SNAPSHOT_ALLOWLIST[0];
    const merged = mergePortableSnapshot({
      files: [],
      omitted: [
        { path: omittedPath, reason: "too_large" },
        { path: "src/other.js", reason: "too_large" },
      ],
    }, root);

    assert.deepEqual(merged.files.map((entry) => entry.path), [...PORTABLE_SNAPSHOT_ALLOWLIST].sort());
    assert.deepEqual(merged.omitted, [{ path: "src/other.js", reason: "too_large" }]);
    assert.equal(merged.files.every((entry) => /^[a-f0-9]{64}$/.test(entry.hash)), true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
