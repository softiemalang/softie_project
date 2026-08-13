import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { canonicalIdentityJson } from '../src/artifactIdentity.js'
import {
  CANDIDATE_IA,
  CANDIDATE_JSG,
  CANDIDATE_NAOJ,
  ROOT,
  buildBundle,
  materializeBundle,
} from '../scripts/materialize-ziwei-p0-palace-branch-slot-composition-v11.mjs'
import { checkArtifact } from '../scripts/check-ziwei-p0-palace-branch-slot-composition-v11.mjs'

test('v11 records same-record and held-out direct scan frontier without graph admission', async () => {
  const first = buildBundle(ROOT, { mode: 'historical_reference' })
  const second = buildBundle(ROOT, { mode: 'historical_reference' })
  assert.equal(canonicalIdentityJson(first), canonicalIdentityJson(second))
  assert.deepEqual(first.artifact.graphImpact.successor, {
    claimCount: 30,
    sourceCount: 21,
    observationCount: 58,
    relationCount: 148,
    blockerCount: 11,
  })
  assert.deepEqual(first.artifact.graphImpact.additive, {
    claimCount: 0,
    sourceCount: 0,
    physicalWitnessCount: 0,
    observationCount: 0,
    relationCount: 0,
    blockerCount: 0,
  })
  assert.equal(first.artifact.graphImpact.sourcesAdded.length, 0)
  assert.equal(first.artifact.graphImpact.addedObservationIds.length, 0)
  assert.equal(first.artifact.graphImpact.addedRelationIds.length, 0)
  assert.equal(first.artifact.lineageAssessment.researchFrontier.candidates.length, 12)
  assert.equal(first.artifact.lineageAssessment.researchFrontier.sameRecordFollowups.length, 1)
  assert.equal(first.artifact.lineageAssessment.researchFrontier.sameRecordFollowups[0].candidateId, CANDIDATE_NAOJ)
  assert.ok(first.artifact.lineageAssessment.researchFrontier.candidates.some(item => item.candidateId === CANDIDATE_JSG && item.doesNotEnterGraph))
  assert.ok(first.artifact.lineageAssessment.researchFrontier.candidates.some(item => item.candidateId === CANDIDATE_IA && item.doesNotEnterGraph))
  assert.equal(first.artifact.bindingMatrix.coverage.directSingleWitnessFullBindingCount, 0)
  assert.equal(first.artifact.bindingMatrix.coverage.productionOrdinalBindingCount, 0)
  assert.equal(first.artifact.bindingMatrix.coverage.semanticAuthorityCount, 0)
  assert.equal(first.artifact.readinessImpact.readiness, 'not_safe_to_start')
  assert.equal(first.artifact.readinessImpact.grounding, 'blocked')
  assert.equal(first.artifact.readinessImpact.activation, 'experimental_only')
  assert.deepEqual(first.artifact.graphImpact.blockersClosed, [])

  const directory = await mkdtemp(join(tmpdir(), 'ziwei-palace-composition-v11-check-'))
  try {
    const target = join(directory, 'complete.json')
    await materializeBundle(target, { mode: 'historical_reference' })
    assert.deepEqual(checkArtifact(ROOT, target), [])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('v11 materialization is byte-identical on repeated writes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ziwei-palace-composition-v11-deterministic-'))
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

test('v11 negative checker rejects lineage, same-record, binding, graph, readiness, timestamp, 1871, and asset shortcuts', () => {
  const output = execFileSync(
    'node',
    ['scripts/check-ziwei-p0-palace-branch-slot-composition-v11-negative-v0.mjs'],
    { cwd: ROOT, encoding: 'utf8' },
  )
  const result = JSON.parse(output)
  assert.equal(result.mutationCount, 16)
  assert.equal(result.allRejected, true)
  assert.ok(result.results.every(item => item.rejected))
})
