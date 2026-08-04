import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { buildOccurrenceProvenance, canonicalJson, SCHEMA, BASIS_HEAD } from '../scripts/materialize-ziwei-occurrence-provenance-v0.mjs'
import { checkOccurrenceProvenance } from '../scripts/check-ziwei-occurrence-provenance-v0.mjs'

test('occurrence provenance preserves 19 raw occurrences and reverse evidence paths', async () => {
  const artifact = await buildOccurrenceProvenance()
  assert.equal(artifact.schemaVersion, SCHEMA)
  assert.equal(artifact.basisHead, BASIS_HEAD)
  assert.equal(artifact.occurrences.length, 19)
  assert.equal(new Set(artifact.occurrences.map(x => x.occurrenceId)).size, 19)
  assert.equal(artifact.stableClaimBoundary.count, 0)
  assert.equal(artifact.conflationRisk.count, 19)
  for (const occurrence of artifact.occurrences) {
    assert.ok(occurrence.rawText.text)
    assert.equal(occurrence.rawText.isVerifiedFact, false)
    assert.ok(occurrence.source.location)
    assert.equal(occurrence.sourceIdentity.status, 'unresolved_source_identity')
    assert.equal(occurrence.claimBoundary.stableClaimId, null)
    assert.ok(occurrence.conflationProhibition.prohibited)
  }
  assert.ok(Object.values(artifact.evidenceIndex).every(x => x.occurrenceIds.length > 0))
  assert.deepEqual(await checkOccurrenceProvenance(artifact), [])
})

test('materialization is byte deterministic and identity checker is fail-closed', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ziwei-occurrence-v0-'))
  try {
    const a = join(dir, 'a.json'); const b = join(dir, 'b.json')
    for (const target of [a, b]) assert.equal(spawnSync(process.execPath, ['scripts/materialize-ziwei-occurrence-provenance-v0.mjs', target], { cwd: process.cwd(), encoding: 'utf8' }).status, 0)
    assert.deepEqual(await readFile(a), await readFile(b))
    assert.equal(canonicalJson(await buildOccurrenceProvenance()), canonicalJson(JSON.parse(await readFile(a, 'utf8'))))
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('negative fixture detects every prohibited shortcut', () => {
  const result = spawnSync(process.execPath, ['scripts/check-ziwei-occurrence-provenance-negative-v0.mjs'], { cwd: process.cwd(), encoding: 'utf8' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(JSON.parse(result.stdout).findings.length, 10)
})
