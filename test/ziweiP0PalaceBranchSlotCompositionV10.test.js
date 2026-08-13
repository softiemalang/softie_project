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
} from '../scripts/materialize-ziwei-p0-palace-branch-slot-composition-v10.mjs'
import { checkArtifact } from '../scripts/check-ziwei-p0-palace-branch-slot-composition-v10.mjs'

test('v10 records same-manuscript cross-page components without promoting a complete binding', async () => {
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
  assert.equal(first.artifact.graphImpact.sourcesAdded.at(-1), 'src-cnts-00047996572-ziwei-doushu-fangshu-manuscript')
  assert.deepEqual(first.artifact.graphImpact.addedObservationIds.slice(-2), [
    'obs-cnts-00047996572-p6-palace-sequence-direct',
    'obs-cnts-00047996572-p13-branch-grid-direct',
  ])
  assert.equal(first.artifact.graphImpact.addedRelationIds.at(-1), 'relation-cnts-00047996572-cross-page-composed-binding-frontier')
  assert.equal(first.artifact.bindingMatrix.coverage.directNamedPalaceWitnessCount, 4)
  assert.equal(first.artifact.bindingMatrix.coverage.partialDirectNamedPalaceComponentCount, 1)
  assert.equal(first.artifact.bindingMatrix.coverage.directBranchPhysicalGridWitnessCount, 1)
  assert.equal(first.artifact.bindingMatrix.coverage.crossPageComposedBindingFrontierCount, 1)
  assert.equal(first.artifact.bindingMatrix.coverage.directSingleWitnessFullBindingCount, 0)
  assert.equal(first.artifact.bindingMatrix.coverage.productionOrdinalBindingCount, 0)
  assert.equal(first.artifact.bindingMatrix.coverage.semanticAuthorityCount, 0)
  assert.equal(first.artifact.lineageAssessment.sameManuscriptCrossPageComposition.crossPageJoin, 'inferred_not_direct_single_frame')
  assert.equal(first.artifact.lineageAssessment.independentWitnessStatus, 'not_admitted')
  assert.deepEqual(first.artifact.graphImpact.blockersClosed, [])
  assert.equal(first.artifact.readinessImpact.readiness, 'not_safe_to_start')
  assert.equal(first.artifact.readinessImpact.grounding, 'blocked')
  assert.equal(first.artifact.readinessImpact.activation, 'experimental_only')

  const directory = await mkdtemp(join(tmpdir(), 'ziwei-palace-composition-v10-check-'))
  try {
    const target = join(directory, 'complete.json')
    await materializeBundle(target, { mode: 'historical_reference' })
    assert.deepEqual(checkArtifact(ROOT, target), [])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('v10 materialization is byte-identical on repeated writes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ziwei-palace-composition-v10-deterministic-'))
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

test('v10 negative checker rejects lineage, cross-page, binding, graph, readiness, authority, timestamp, and asset shortcuts', () => {
  const output = execFileSync(
    'node',
    ['scripts/check-ziwei-p0-palace-branch-slot-composition-v10-negative-v0.mjs'],
    { cwd: ROOT, encoding: 'utf8' },
  )
  const result = JSON.parse(output)
  assert.equal(result.mutationCount, 16)
  assert.equal(result.allRejected, true)
  assert.ok(result.results.every(item => item.rejected))
})
