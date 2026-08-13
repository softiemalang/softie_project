import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { canonicalIdentityJson } from '../src/artifactIdentity.js'
import {
  CANDIDATE_NDL_FALSE_POSITIVE,
  CANDIDATE_SSID,
  CANDIDATE_TIANYIGE,
  CANDIDATE_ZJSLIB,
  OBSERVATION_NDL_FALSE_POSITIVE,
  OBSERVATION_SSID,
  OBSERVATION_TIANYIGE,
  OBSERVATION_ZJSLIB,
  ROOT,
  buildBundle,
  materializeBundle,
} from '../scripts/materialize-ziwei-p0-palace-branch-slot-composition-v12.mjs'
import { checkArtifact } from '../scripts/check-ziwei-p0-palace-branch-slot-composition-v12.mjs'

test('v12 records direct target and false-positive scans without graph admission', async () => {
  const first = buildBundle(ROOT, { mode: 'historical_reference' })
  const second = buildBundle(ROOT, { mode: 'historical_reference' })
  assert.equal(canonicalIdentityJson(first), canonicalIdentityJson(second))
  assert.deepEqual(first.artifact.graphImpact.successor, { claimCount: 30, sourceCount: 21, observationCount: 58, relationCount: 148, blockerCount: 11 })
  assert.deepEqual(first.artifact.graphImpact.additive, { claimCount: 0, sourceCount: 0, physicalWitnessCount: 0, observationCount: 0, relationCount: 0, blockerCount: 0 })
  assert.equal(first.artifact.lineageAssessment.researchFrontier.candidates.length, 16)
  for (const id of [CANDIDATE_SSID, CANDIDATE_TIANYIGE, CANDIDATE_ZJSLIB, CANDIDATE_NDL_FALSE_POSITIVE]) assert.ok(first.artifact.lineageAssessment.researchFrontier.candidates.some(item => item.candidateId === id && item.doesNotEnterGraph))
  for (const id of [OBSERVATION_SSID, OBSERVATION_TIANYIGE, OBSERVATION_ZJSLIB, OBSERVATION_NDL_FALSE_POSITIVE]) assert.ok(first.artifact.lineageAssessment.researchFrontier.frontierOnlyObservations.some(item => item.observationId === id))
  assert.equal(first.artifact.scope.heldOutResearchCandidateCount, 15)
  assert.equal(first.artifact.scope.heldOutDirectScanCandidateCount, 6)
  assert.equal(first.artifact.scope.physicalWitnessCandidatesAdded, 4)
  assert.equal(first.artifact.bindingMatrix.coverage.directSingleWitnessFullBindingCount, 0)
  assert.equal(first.artifact.bindingMatrix.coverage.productionOrdinalBindingCount, 0)
  assert.equal(first.artifact.bindingMatrix.coverage.semanticAuthorityCount, 0)
  assert.equal(first.artifact.readinessImpact.readiness, 'not_safe_to_start')
  assert.deepEqual(first.artifact.graphImpact.blockersClosed, [])

  const directory = await mkdtemp(join(tmpdir(), 'ziwei-palace-composition-v12-check-'))
  try {
    const target = join(directory, 'complete.json')
    await materializeBundle(target, { mode: 'historical_reference' })
    assert.deepEqual(checkArtifact(ROOT, target), [])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('v12 materialization is byte-identical on repeated writes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ziwei-palace-composition-v12-deterministic-'))
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

test('v12 negative checker rejects source, target, binding, graph, readiness, timestamp, 1871, and asset shortcuts', () => {
  const output = execFileSync('node', ['scripts/check-ziwei-p0-palace-branch-slot-composition-v12-negative-v0.mjs'], { cwd: ROOT, encoding: 'utf8' })
  const result = JSON.parse(output)
  assert.equal(result.mutationCount, 15)
  assert.equal(result.allRejected, true)
  assert.ok(result.results.every(item => item.rejected))
})
