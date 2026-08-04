import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { buildHardeningArtifact, canonicalJson, SCHEMA, BASIS_HEAD } from '../scripts/materialize-ziwei-guarded-occurrence-source-evidence-hardening-v0.mjs'
import { checkHardeningArtifact } from '../scripts/check-ziwei-guarded-occurrence-source-evidence-hardening-v0.mjs'

test('hardening inventories exactly the four structural-guard occurrences', async () => {
  const artifact = await buildHardeningArtifact()
  assert.equal(artifact.schemaVersion, SCHEMA)
  assert.equal(artifact.basisHead, BASIS_HEAD)
  assert.deepEqual(artifact.targetSelection.occurrenceIds, ['ziwei-occ-2260aba6ed2163e3', 'ziwei-occ-a09e10a5495186b8', 'ziwei-occ-a72bdf60ef809b58', 'ziwei-occ-e73f469c5e35e072'])
  assert.deepEqual(artifact.distribution, { source_identity_resolved_and_independently_corrobated: 0, source_identity_resolved_evidence_partial: 0, source_identity_partial: 4, configuration_mismatch: 0, source_identity_unresolved: 0, evidence_conflict: 0, independentCorroborationInsufficient: 4, boundaryEvidenceCandidateCount: 4 })
  for (const record of artifact.records) {
    assert.equal(record.rawText.isVerifiedFact, false)
    assert.equal(record.guardPreservation.stableClaim, false)
    assert.equal(record.sourceIdentityAssessment.status, 'source_identity_partial')
    assert.equal(record.independentRuleCorroboration.status, 'insufficient_evidence')
    assert.equal(record.boundaryEvidenceCandidates[0].notAStableClaim, true)
  }
  assert.deepEqual(await checkHardeningArtifact(artifact), [])
})

test('hardening materialization is byte deterministic', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ziwei-source-evidence-v0-'))
  try {
    const a = join(dir, 'a.json'); const b = join(dir, 'b.json')
    for (const target of [a, b]) assert.equal(spawnSync(process.execPath, ['scripts/materialize-ziwei-guarded-occurrence-source-evidence-hardening-v0.mjs', target], { cwd: process.cwd(), encoding: 'utf8' }).status, 0)
    assert.deepEqual(await readFile(a), await readFile(b))
    assert.equal(canonicalJson(await buildHardeningArtifact()), canonicalJson(JSON.parse(await readFile(a, 'utf8'))))
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('negative fixture detects the hardening shortcuts', () => {
  const result = spawnSync(process.execPath, ['scripts/check-ziwei-guarded-occurrence-source-evidence-hardening-negative-v0.mjs'], { cwd: process.cwd(), encoding: 'utf8' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.deepEqual(JSON.parse(result.stdout).findings, [])
})
