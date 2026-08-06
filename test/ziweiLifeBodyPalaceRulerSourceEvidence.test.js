import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { buildArtifact, canonicalJson, SCHEMA } from '../scripts/materialize-ziwei-life-body-palace-ruler-source-evidence-v0.mjs'
import { checkArtifact } from '../scripts/check-ziwei-life-body-palace-ruler-source-evidence-v0.mjs'

test('materializes exhaustive life/body evidence and blocked ruler comparison without promotion', async () => {
  const artifact = await buildArtifact()
  assert.equal(artifact.schemaVersion, SCHEMA)
  assert.equal(artifact.comparison.lifeBody.inputCount, 144)
  assert.equal(artifact.comparison.lifeBody.matchCount, 144)
  assert.equal(artifact.comparison.lifeBody.mismatchCount, 0)
  assert.equal(artifact.comparison.rulers.editions.nanyangtang.inputCount, 144)
  assert.equal(artifact.comparison.rulers.editions.nanbei.inputCount, 144)
  assert.equal(artifact.comparison.rulers.production.inputCount, 288)
  assert.equal(artifact.comparison.rulers.production.comparableCount, 0)
  assert.equal(artifact.boundaries.stableClaimCount, 0)
  assert.deepEqual(await checkArtifact(artifact), [])
})

test('materializer output is byte deterministic', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ziwei-life-body-ruler-evidence-'))
  try {
    const a = join(dir, 'a.json'); const b = join(dir, 'b.json')
    for (const target of [a, b]) {
      const result = spawnSync(process.execPath, ['scripts/materialize-ziwei-life-body-palace-ruler-source-evidence-v0.mjs', target], { cwd: process.cwd(), encoding: 'utf8' })
      assert.equal(result.status, 0, result.stdout + result.stderr)
    }
    assert.deepEqual(await readFile(a), await readFile(b))
    assert.equal(canonicalJson(await buildArtifact()), await readFile(a, 'utf8'))
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('negative checker rejects provenance, completeness, and promotion shortcuts', () => {
  const result = spawnSync(process.execPath, ['scripts/check-ziwei-life-body-palace-ruler-source-evidence-negative-v0.mjs'], { cwd: process.cwd(), encoding: 'utf8' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.deepEqual(JSON.parse(result.stdout).findings, [])
})
