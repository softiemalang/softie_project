import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { readFile, rm, mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { canonicalIdentityJson } from '../src/artifactIdentity.js'
import {
  BASIS_HEAD,
  CANDIDATE_NLC_1607,
  OBSERVATION_NLC_1607,
  ROOT,
  buildBundle,
  materializeBundle,
} from '../scripts/materialize-ziwei-p0-palace-branch-slot-composition-v13.mjs'
import { checkArtifact } from '../scripts/check-ziwei-p0-palace-branch-slot-composition-v13.mjs'

test('v13 records NLC 1607 institutional and derivative frontier without graph admission', async () => {
  const first = buildBundle(ROOT, { mode: 'historical_reference' })
  const second = buildBundle(ROOT, { mode: 'historical_reference' })
  assert.equal(canonicalIdentityJson(first), canonicalIdentityJson(second))
  assert.equal(first.artifact.basisHead, BASIS_HEAD)
  assert.deepEqual(first.artifact.graphImpact.successor, { claimCount: 30, sourceCount: 21, observationCount: 58, relationCount: 148, blockerCount: 11 })
  assert.deepEqual(first.artifact.graphImpact.additive, { claimCount: 0, sourceCount: 0, physicalWitnessCount: 0, observationCount: 0, relationCount: 0, blockerCount: 0 })
  assert.equal(first.artifact.lineageAssessment.researchFrontier.candidates.length, 17)
  const candidate = first.artifact.lineageAssessment.researchFrontier.candidates.find(item => item.candidateId === CANDIDATE_NLC_1607)
  assert.equal(candidate.doesNotEnterGraph, true)
  assert.equal(candidate.sourceIdentity.institutionalRecordStatus, 'verified_direct_catalog_html')
  assert.equal(candidate.locators.officialViewerPdfBytes.accessStatus, 'acquired_direct_official_range_stream')
  assert.equal(candidate.locators.officialViewerPdfBytes.derivativeToOfficialByteEquality, 'verified_exact_byte_compare')
  assert.equal(candidate.lineage.officialPdfBytesAcquired, true)
  assert.equal(candidate.lineage.derivativeToOfficialByteEqualityEstablished, true)
  assert.equal(candidate.bindingMatrix.fullBinding, false)
  assert.ok(first.artifact.lineageAssessment.researchFrontier.frontierOnlyObservations.some(item => item.observationId === OBSERVATION_NLC_1607))
  assert.equal(first.artifact.scope.heldOutResearchCandidateCount, 16)
  assert.equal(first.artifact.scope.heldOutDirectScanCandidateCount, 7)
  assert.equal(first.artifact.scope.physicalWitnessCandidatesAdded, 5)
  assert.equal(first.artifact.bindingMatrix.coverage.directSingleWitnessFullBindingCount, 0)
  assert.equal(first.artifact.bindingMatrix.coverage.productionOrdinalBindingCount, 0)
  assert.equal(first.artifact.bindingMatrix.coverage.semanticAuthorityCount, 0)
  assert.equal(first.artifact.readinessImpact.readiness, 'not_safe_to_start')
  assert.deepEqual(first.artifact.graphImpact.blockersClosed, [])

  const directory = await mkdtemp(join(tmpdir(), 'ziwei-palace-composition-v13-check-'))
  try {
    const target = join(directory, 'complete.json')
    await materializeBundle(target, { mode: 'historical_reference' })
    assert.deepEqual(checkArtifact(ROOT, target), [])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('v13 materialization is byte-identical on repeated writes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ziwei-palace-composition-v13-deterministic-'))
  try {
    const target = join(directory, 'complete.json')
    const first = await materializeBundle(target, { mode: 'historical_reference' })
    const firstBytes = {}
    for (const path of Object.values(first.outputs)) {
      firstBytes[path] = await readFile(path)
      firstBytes[path + '.integrity.json'] = await readFile(path + '.integrity.json')
    }
    const second = await materializeBundle(target, { mode: 'historical_reference' })
    for (const path of Object.values(second.outputs)) {
      assert.deepEqual(await readFile(path), firstBytes[path])
      assert.deepEqual(await readFile(path + '.integrity.json'), firstBytes[path + '.integrity.json'])
    }
    assert.deepEqual(checkArtifact(ROOT, target), [])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('v13 negative checker rejects NLC authority, byte, binding, graph, readiness, timestamp, and asset shortcuts', () => {
  const output = execFileSync('node', ['scripts/check-ziwei-p0-palace-branch-slot-composition-v13-negative-v0.mjs'], { cwd: ROOT, encoding: 'utf8' })
  const result = JSON.parse(output)
  assert.equal(result.mutationCount, 14)
  assert.equal(result.allRejected, true)
  assert.ok(result.results.every(item => item.rejected))
})
