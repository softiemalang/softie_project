import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { REMOTE_INTERFACE_COMMANDS } from "../tools/codex-remote-workflow.mjs";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const workflow = path.join(repositoryRoot, "tools/codex-remote-workflow.mjs");

function runWorkflow(args, extraEnv = {}) {
  return spawnSync(process.execPath, [workflow, ...args], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: { ...process.env, ...extraEnv },
  });
}

function runWorkflowOnPlatform(platform, args, extraEnv = {}) {
  const script = `
Object.defineProperty(process, "platform", { value: ${JSON.stringify(platform)} });
const { execute } = await import(${JSON.stringify(workflow)});
try {
  await execute(${JSON.stringify(args)});
} catch (error) {
  process.stderr.write("ERROR=" + error.message + "\\n");
  process.exitCode = 1;
}
`;
  return spawnSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: { ...process.env, ...extraEnv },
  });
}

test("public remote interface is the fixed metadata-to-apply sequence", () => {
  assert.deepEqual([...REMOTE_INTERFACE_COMMANDS], [
    "metadata",
    "refresh",
    "setup",
    "status",
    "verify",
    "apply",
  ]);
});

test("public interface rejects path and host overrides", () => {
  for (const argument of [
    "--source-root=/tmp/other-repository",
    "--target=/data/data/com.termux/files/home/other-target",
    "--state-root=/tmp/other-state",
    "--ssh-host=other-host",
    "--metadata-output=/data/data/com.termux/files/home/other.json",
  ]) {
    const result = runWorkflow(["status", argument]);
    assert.equal(result.status, 1, argument);
    assert.match(result.stderr, /ERROR=invalid_argument/);
  }
});

test("boundary module override is rejected before any remote operation", () => {
  const result = runWorkflow(["status"], { SOFTIE_REMOTE_BOUNDARY_MODULE: "/tmp/other-boundary.mjs" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /ERROR=boundary_override_forbidden/);
});

test("Linux worker reports boundary override before the Mac coordinator requirement", () => {
  const linux = runWorkflowOnPlatform("linux", ["status"]);
  assert.equal(linux.status, 1);
  assert.match(linux.stderr, /ERROR=mac_coordinator_required/);

  const linuxOverride = runWorkflowOnPlatform("linux", ["status"], {
    SOFTIE_REMOTE_BOUNDARY_MODULE: "/tmp/other-boundary.mjs",
  });
  assert.equal(linuxOverride.status, 1);
  assert.match(linuxOverride.stderr, /ERROR=boundary_override_forbidden/);
});

test("workflow entrypoint does not expose repository contents through the interface", () => {
  const source = fs.readFileSync(workflow, "utf8");
  assert.match(source, /REMOTE_INTERFACE_COMMANDS/);
  assert.doesNotMatch(source, /metadataOutput/);
});
