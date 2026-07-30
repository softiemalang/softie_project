import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { inspectArtifactReadiness, resolveArtifactRoot } from '../scripts/lib/de405-artifact-contract.mjs'

const inventoryFor = (root, pendingRequired = false) => ({
  artifactRoot: 'artifacts',
  artifacts: [
    { path: 'artifacts/a.json', sizeBytes: 3, sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', storageClass: 'generated', producer: { type: 'script' } },
    { path: 'artifacts/b.json', sizeBytes: 3, sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', storageClass: pendingRequired ? 'pending' : 'generated', producer: { type: 'script' } }
  ]
})

async function fixture(pendingRequired = false) {
  const root = await mkdtemp(join(tmpdir(), 'de405-artifact-contract-'))
  const inventoryPath = join(root, 'inventory.json')
  await writeFile(inventoryPath, JSON.stringify(inventoryFor(root, pendingRequired)))
  const artifactRoot = join(root, 'artifacts')
  await mkdir(artifactRoot)
  return { root, inventoryPath, artifactRoot }
}

test('artifact root priority is CLI value, then environment, then repository default', () => {
  assert.equal(resolveArtifactRoot({ cliRoot: '/tmp/cli', env: { DE405_ARTIFACT_ROOT: '/tmp/env' }, cwd: '/repo' }), '/tmp/cli')
  assert.equal(resolveArtifactRoot({ env: { DE405_ARTIFACT_ROOT: '/tmp/env' }, cwd: '/repo' }), '/tmp/env')
  assert.equal(resolveArtifactRoot({ env: {}, cwd: '/repo' }), '/repo/artifacts')
})

test('empty artifact root reports deterministic missing status', async () => {
  const f = await fixture()
  const result = await inspectArtifactReadiness(f)
  assert.equal(result.status, 'blocked_missing_de405_artifacts')
  assert.deepEqual(result.missing, ['artifacts/a.json', 'artifacts/b.json'])
})

test('partial artifacts separate present and missing files', async () => {
  const f = await fixture()
  await writeFile(join(f.artifactRoot, 'a.json'), 'abc')
  const result = await inspectArtifactReadiness(f)
  assert.equal(result.presentGeneratedCount, 1)
  assert.deepEqual(result.missing, ['artifacts/b.json'])
})

test('complete generated fixture reports ready', async () => {
  const f = await fixture()
  await writeFile(join(f.artifactRoot, 'a.json'), 'abc')
  await writeFile(join(f.artifactRoot, 'b.json'), 'abc')
  const result = await inspectArtifactReadiness(f)
  assert.equal(result.status, 'ready')
  assert.equal(result.presentGeneratedCount, 2)
})

test('DS_Store does not affect a complete readiness result', async () => {
  const f = await fixture()
  await writeFile(join(f.artifactRoot, 'a.json'), 'abc')
  await writeFile(join(f.artifactRoot, 'b.json'), 'abc')
  const readyWithoutMetadata = await inspectArtifactReadiness(f)
  await writeFile(join(f.artifactRoot, '.DS_Store'), 'finder metadata')
  const readyWithMetadata = await inspectArtifactReadiness(f)
  assert.deepEqual(readyWithMetadata, readyWithoutMetadata)
})

test('size and hash mismatches never report ready', async () => {
  const f = await fixture()
  await writeFile(join(f.artifactRoot, 'a.json'), 'wrong')
  await writeFile(join(f.artifactRoot, 'b.json'), 'abc')
  const result = await inspectArtifactReadiness(f)
  assert.equal(result.status, 'blocked_missing_de405_artifacts')
  assert.deepEqual(result.mismatches, [{ path: 'artifacts/a.json', status: 'size_mismatch' }])
})

test('sha-256 mismatch never reports ready', async () => {
  const f = await fixture()
  await writeFile(join(f.artifactRoot, 'a.json'), 'abc')
  await writeFile(join(f.artifactRoot, 'b.json'), 'xyz')
  const result = await inspectArtifactReadiness(f)
  assert.equal(result.status, 'blocked_missing_de405_artifacts')
  assert.deepEqual(result.mismatches, [{ path: 'artifacts/b.json', status: 'sha256_mismatch' }])
})

test('missing pending artifact is blocked without changing its storage class', async () => {
  const f = await fixture(true)
  await writeFile(join(f.artifactRoot, 'a.json'), 'abc')
  const result = await inspectArtifactReadiness(f)
  assert.equal(result.status, 'blocked_pending_de405_artifact_contract')
  assert.deepEqual(result.pending, ['artifacts/b.json'])
})
