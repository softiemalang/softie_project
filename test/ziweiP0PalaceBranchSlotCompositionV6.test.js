import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { canonicalIdentityJson } from '../src/artifactIdentity.js'
import {
  ROOT,
  buildBundle,
  materializeBundle,
} from '../scripts/materialize-ziwei-p0-palace-branch-slot-composition-v6.mjs'
import { checkArtifact } from '../scripts/check-ziwei-p0-palace-branch-slot-composition-v6.mjs'

test('v6 records the no-image Nagoya catalog frontier without graph or readiness promotion', async () => {
  const first = buildBundle(ROOT, { mode: 'historical_reference' })
  const second = buildBundle(ROOT, { mode: 'historical_reference' })
  assert.equal(canonicalIdentityJson(first), canonicalIdentityJson(second))
  assert.deepEqual(first.artifact.graphImpact.successor, {
    claimCount: 30,
    sourceCount: 19,
    observationCount: 55,
    relationCount: 146,
    blockerCount: 11,
  })
  assert.equal(first.artifact.scope.heldOutResearchCandidateCount, 6)
  assert.equal(first.artifact.scope.researchCandidatesAdmitted, 0)
  assert.equal(first.artifact.researchFrontier.candidates.length, 6)
  assert.equal(first.artifact.researchFrontier.acquisitionLeads.length, 5)
  const nagoya = first.artifact.researchFrontier.candidates.find(item => item.candidateId.includes('nagoya-'))
  assert.equal(nagoya.sourceIdentity.publicationDate, 'unresolved')
  assert.equal(nagoya.locators.imageField, 'None')
  assert.equal(nagoya.locators.imageAvailable, false)
  assert.ok(nagoya.catalogObservation.observedFields.includes('Image: None'))
  assert.equal(nagoya.doesNotEnterGraph, true)
  assert.equal(first.artifact.researchFrontier.comparison1871To1883.directTextComparisonPerformed, false)
  assert.equal(first.artifact.bindingMatrix.coverage.directSingleWitnessFullBindingCount, 0)
  assert.equal(first.artifact.bindingMatrix.coverage.productionOrdinalBindingCount, 0)
  assert.equal(first.artifact.graphImpact.independentPhysicalWitnessesAdmitted, 0)
  assert.deepEqual(first.artifact.graphImpact.blockersClosed, [])
  assert.equal(first.artifact.readinessImpact.readiness, 'not_safe_to_start')
  assert.equal(first.artifact.readinessImpact.grounding, 'blocked')
  assert.equal(first.artifact.readinessImpact.activation, 'experimental_only')
  const directory = await mkdtemp(join(tmpdir(), 'ziwei-palace-composition-v6-check-'))
  try {
    const target = join(directory, 'complete.json')
    await materializeBundle(target, { mode: 'historical_reference' })
    assert.deepEqual(checkArtifact(ROOT, target), [])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('v6 materialization is byte-identical on repeated writes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ziwei-palace-composition-v6-deterministic-'))
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

test('v6 negative checker rejects catalog-frontier, byte-identity, graph, readiness, authority, and timestamp shortcuts', () => {
  const output = execFileSync(
    'node',
    ['scripts/check-ziwei-p0-palace-branch-slot-composition-v6-negative-v0.mjs'],
    { cwd: ROOT, encoding: 'utf8' },
  )
  const result = JSON.parse(output)
  assert.equal(result.mutationCount, 19)
  assert.equal(result.allRejected, true)
  assert.ok(result.results.every(item => item.rejected))
})
