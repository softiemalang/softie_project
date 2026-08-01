import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lockfilePath = resolve(repositoryRoot, 'package-lock.json');
const scannerBinary = process.env.OSV_SCANNER_BIN || 'osv-scanner';

function fail(message) {
  console.error(`OSV audit wrapper error: ${message}`);
  process.exitCode = 2;
}

if (!existsSync(lockfilePath)) {
  fail(`package-lock.json not found at ${lockfilePath}`);
} else {
  try {
    JSON.parse(readFileSync(lockfilePath, 'utf8'));
  } catch (error) {
    fail(`package-lock.json is not valid JSON: ${error.message}`);
  }
}

if (process.exitCode) {
  process.exit();
}

const versionRun = spawnSync(scannerBinary, ['--version'], {
  cwd: repositoryRoot,
  encoding: 'utf8',
});

if (versionRun.error) {
  fail(`could not execute ${scannerBinary}: ${versionRun.error.message}`);
} else if (versionRun.stdout) {
  process.stdout.write(versionRun.stdout);
  if (versionRun.stderr) process.stderr.write(versionRun.stderr);
} else if (versionRun.stderr) {
  process.stderr.write(versionRun.stderr);
}

if (versionRun.error || versionRun.status !== 0 || versionRun.signal) {
  if (!versionRun.error && versionRun.signal) fail(`version check terminated by signal ${versionRun.signal}`);
  else if (!versionRun.error && versionRun.status !== 0) fail(`version check exited with status ${versionRun.status}`);
  process.exit();
}

const versionText = `${versionRun.stdout}\n${versionRun.stderr}`;
const majorMatch = versionText.match(/osv-scanner version:\s*(\d+)/i);
if (!majorMatch || majorMatch[1] !== '2') {
  fail(`OSV-Scanner major version 2 is required; received: ${versionText.trim()}`);
  process.exit();
}

console.error(`OSV-Scanner V2 verified: ${scannerBinary}`);
console.error(`Scanning package-lock.json: ${lockfilePath}`);

const scanRun = spawnSync(
  scannerBinary,
  ['scan', '-L', lockfilePath, '--format', 'table'],
  {
    cwd: repositoryRoot,
    stdio: 'inherit',
  },
);

if (scanRun.error) {
  fail(`could not execute scan: ${scanRun.error.message}`);
} else if (scanRun.signal) {
  fail(`scan terminated by signal ${scanRun.signal}`);
} else if (scanRun.status === 0) {
  console.error('OSV-Scanner completed: no known findings reported (scanner status 0).');
} else if (scanRun.status === 1) {
  console.error('OSV-Scanner completed: findings reported (scanner status 1).');
} else {
  fail(`scanner execution failed with status ${scanRun.status}`);
}

if (!scanRun.error && !scanRun.signal && (scanRun.status === 0 || scanRun.status === 1)) {
  console.error(`Original scanner exit code: ${scanRun.status}`);
  process.exitCode = 0;
}
