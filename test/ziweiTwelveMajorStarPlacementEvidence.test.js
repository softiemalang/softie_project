import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { buildArtifact, canonicalJson, SCHEMA } from '../scripts/materialize-ziwei-twelve-major-star-placement-evidence-v0.mjs'
import { checkArtifact } from '../scripts/check-ziwei-twelve-major-star-placement-evidence-v0.mjs'

test('twelve-star source/prod evidence preserves identity, roots, and occurrence provenance', async () => {
  const artifact = await buildArtifact()
  assert.equal(artifact.schemaVersion, SCHEMA)
  assert.equal(artifact.fixtureDomain.rows, 150)
  assert.equal(artifact.occurrences.length, 3600)
  assert.equal(artifact.comparison.bySeries.ziwei.rawMatchCount, 750)
  assert.equal(artifact.comparison.bySeries.tianfu.rawMatchCount, 0)
  assert.equal(artifact.comparison.bySeries.tianfu.normalizedMatchCount, 1050)
  assert.deepEqual(await checkArtifact(artifact), [])
})

test('twelve-star evidence materialization is byte deterministic', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ziwei-twelve-major-stars-'))
  try {
    const a = join(dir, 'a.json'); const b = join(dir, 'b.json')
    for (const target of [a, b]) assert.equal(spawnSync(process.execPath, ['scripts/materialize-ziwei-twelve-major-star-placement-evidence-v0.mjs', target], { cwd: process.cwd(), encoding: 'utf8' }).status, 0)
    assert.deepEqual(await readFile(a), await readFile(b))
    assert.equal(canonicalJson(await buildArtifact()), await readFile(a, 'utf8'))
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('twelve-star evidence negative checker rejects required-field mutations', () => {
  const result = spawnSync(process.execPath, ['scripts/check-ziwei-twelve-major-star-placement-evidence-negative-v0.mjs'], { cwd: process.cwd(), encoding: 'utf8' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.deepEqual(JSON.parse(result.stdout).findings, [])
})
