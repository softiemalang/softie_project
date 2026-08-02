import test from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
const run = promisify(execFile); const root = process.cwd(); const samples = join(root, 'artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl')
test('DE405 sample-only release asset materializes byte-identically twice and excludes redistribution inputs', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'de405-input-bundle-test-')); const one = join(dir, 'one'); const two = join(dir, 'two')
  await run('node', ['scripts/materialize-de405-input-bundle.mjs', '--samples', samples, '--output', one], { cwd: root, maxBuffer: 1024 * 1024 })
  await run('node', ['scripts/materialize-de405-input-bundle.mjs', '--samples', samples, '--output', two], { cwd: root, maxBuffer: 1024 * 1024 })
  assert.deepEqual(await readFile(join(one, 'de405-sample-asset.zip')), await readFile(join(two, 'de405-sample-asset.zip')))
  const check = await run('node', ['scripts/check-de405-input-bundle.mjs', '--archive', join(one, 'de405-sample-asset.zip')], { cwd: root, maxBuffer: 1024 * 1024 })
  assert.match(check.stdout, /sample_only/)
})
