import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { BASIS_HEAD, buildArtifact, canonicalJson, SCHEMA, validateObservedHead } from '../scripts/materialize-ziwei-palace-coordinate-semantic-identity-v0.mjs'
import { checkArtifact } from '../scripts/check-ziwei-palace-coordinate-semantic-identity-v0.mjs'

test('palace coordinate packet preserves semantic blocker and exhaustive candidate result', async () => {
  const artifact = await buildArtifact({ observedHead: BASIS_HEAD })
  assert.equal(artifact.verdictToken, 'complete_ziwei_palace_coordinate_semantic_identity_evidence_uncommitted')
  assert.equal(artifact.sourceWitnessIndex.source.pages, 219)
  assert.equal(artifact.rows.length, 150)
  assert.equal(artifact.candidateMatrix.candidateCount, 170)
  assert.deepEqual(artifact.candidateMatrix.exactFitIds, [
    'rotation-06',
    'enum-relabel-in-00-out-06', 'enum-relabel-in-01-out-07', 'enum-relabel-in-02-out-08', 'enum-relabel-in-03-out-09', 'enum-relabel-in-04-out-10', 'enum-relabel-in-05-out-11', 'enum-relabel-in-06-out-00', 'enum-relabel-in-07-out-01', 'enum-relabel-in-08-out-02', 'enum-relabel-in-09-out-03', 'enum-relabel-in-10-out-04', 'enum-relabel-in-11-out-05',
    'source-base-direction',
  ])
  assert.equal(artifact.rows.filter(x => x.rawEquality).length, 0)
  assert.equal(artifact.claims.find(x => x.id === 'semantic_identity').status, 'blocked_semantic_identity_insufficient')
  assert.deepEqual(await checkArtifact(artifact), [])
})

test('palace coordinate packet materialization is byte deterministic', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ziwei-palace-coordinate-'))
  try {
    const a = join(dir, 'a.json'); const b = join(dir, 'b.json')
    for (const target of [a, b]) assert.equal(spawnSync(process.execPath, [`scripts/materialize-${SCHEMA}.mjs`, '--observed-head', BASIS_HEAD, target], { cwd: process.cwd(), encoding: 'utf8' }).status, 0)
    assert.deepEqual(await readFile(a), await readFile(b))
    assert.equal(canonicalJson(await buildArtifact({ observedHead: BASIS_HEAD })), await readFile(a, 'utf8'))
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('palace coordinate negative inventory is fail closed', () => {
  const result = spawnSync(process.execPath, ['scripts/check-ziwei-palace-coordinate-semantic-identity-negative-v0.mjs'], { cwd: process.cwd(), encoding: 'utf8' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.deepEqual(JSON.parse(result.stdout).findings, [])
})

test('observedHead is mandatory, resolvable, and ancestry-bounded', () => {
  const missing = spawnSync(process.execPath, ['scripts/materialize-ziwei-palace-coordinate-semantic-identity-v0.mjs'], { cwd: process.cwd(), encoding: 'utf8' })
  assert.notEqual(missing.status, 0)
  const malformed = spawnSync(process.execPath, ['scripts/materialize-ziwei-palace-coordinate-semantic-identity-v0.mjs', '--observed-head', 'bad'], { cwd: process.cwd(), encoding: 'utf8' })
  assert.notEqual(malformed.status, 0)
  assert.throws(() => validateObservedHead({ root: process.cwd(), observedHead: '0'.repeat(40) }), /not a resolvable commit/)
  assert.throws(() => validateObservedHead({ root: process.cwd(), observedHead: process.execPath, currentHead: BASIS_HEAD }), /explicit 40-hex/)
  const currentHead = process.execPath && requireCurrentHead()
  assert.throws(() => validateObservedHead({ root: process.cwd(), observedHead: currentHead, currentHead: BASIS_HEAD }), /observedHead must be an ancestor/)
})

function requireCurrentHead() {
  return spawnSync('git', ['rev-parse', 'HEAD'], { cwd: process.cwd(), encoding: 'utf8' }).stdout.trim()
}
