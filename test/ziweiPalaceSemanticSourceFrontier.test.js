import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { buildArtifact, SCHEMA } from '../scripts/materialize-ziwei-palace-semantic-source-frontier-v1.mjs'
import { checkArtifact } from '../scripts/check-ziwei-palace-semantic-source-frontier-v1.mjs'

const root = process.cwd()
const materializer = `scripts/materialize-${SCHEMA}.mjs`

test('palace source frontier records direct source identity and preserves semantic blockers', async () => {
  const artifact = await buildArtifact()
  assert.equal(artifact.sourceWitnesses.find(item => item.editionId === 'nanbei').pageCount, 219)
  assert.equal(artifact.sourceWitnesses.find(item => item.editionId === 'nanyangtang').pageCount, 528)
  assert.equal(artifact.claims.find(item => item.id === 'scan_witness_identity').status, 'direct_within_scope')
  assert.equal(artifact.claims.find(item => item.id === 'palace_semantic_identity').status, 'blocked_semantic_identity_insufficient')
  assert.equal(artifact.claims.find(item => item.id === 'production_source_authority').status, 'blocked_source_authority_not_established')
})

test('palace source frontier materialization is byte deterministic and positive checker passes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ziwei-palace-source-frontier-'))
  try {
    const a = join(dir, 'a.json'); const b = join(dir, 'b.json')
    for (const target of [a, b]) assert.equal(spawnSync(process.execPath, [materializer, target], { cwd: root, encoding: 'utf8' }).status, 0)
    assert.deepEqual(await readFile(a), await readFile(b))
    const checked = spawnSync(process.execPath, [`scripts/check-${SCHEMA}.mjs`, a], { cwd: root, encoding: 'utf8' })
    assert.equal(checked.status, 0, checked.stdout + checked.stderr)
    assert.equal(JSON.parse(checked.stdout).pass, true)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('palace source frontier negative mutations fail closed', () => {
  const result = spawnSync(process.execPath, [`scripts/check-${SCHEMA}-negative.mjs`], { cwd: root, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.deepEqual(JSON.parse(result.stdout).findings, [])
})

test('checked repository artifact preserves its current contract', async () => {
  assert.deepEqual(await checkArtifact(), [])
})
