import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const materializer = join(root, 'scripts/materialize-ziwei-fixture-reconciliation-v1.mjs')
const checker = join(root, 'scripts/check-ziwei-fixture-reconciliation-v1.mjs')
const negative = join(root, 'scripts/check-ziwei-fixture-reconciliation-negative-v1.mjs')

test('six pending Ziwei fixtures reconcile deterministically and fail closed', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ziwei-reconciliation-'))
  try {
    const a = join(dir, 'a.json'); const b = join(dir, 'b.json')
    assert.equal(spawnSync(process.execPath, [materializer, a], { cwd: root, encoding: 'utf8' }).status, 0)
    assert.equal(spawnSync(process.execPath, [materializer, b], { cwd: root, encoding: 'utf8' }).status, 0)
    assert.deepEqual(await readFile(a), await readFile(b))
    const checked = spawnSync(process.execPath, [checker, a], { cwd: root, encoding: 'utf8' })
    assert.equal(checked.status, 0, checked.stdout + checked.stderr)
    const result = JSON.parse(checked.stdout)
    assert.equal(result.fixtureCount, 6)
    assert.equal(result.independentlyVerified, 0)
    assert.equal(JSON.parse(await readFile(a, 'utf8')).artifactIdentity.contractVersion, 'artifact-identity-v1')
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('negative reconciliation contract detects every prohibited shortcut', () => {
  const result = spawnSync(process.execPath, [negative], { cwd: root, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(JSON.parse(result.stdout).findings.length, 7)
})
