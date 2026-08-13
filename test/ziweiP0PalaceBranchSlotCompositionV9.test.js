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
} from '../scripts/materialize-ziwei-p0-palace-branch-slot-composition-v9.mjs'
import { checkArtifact } from '../scripts/check-ziwei-p0-palace-branch-slot-composition-v9.mjs'

test('v9 records the Zhejiang lithographic variant as direct corroboration without semantic or production promotion', async () => {
  const first = buildBundle(ROOT, { mode: 'historical_reference' })
  const second = buildBundle(ROOT, { mode: 'historical_reference' })
  assert.equal(canonicalIdentityJson(first), canonicalIdentityJson(second))
  assert.deepEqual(first.artifact.graphImpact.successor, {
    claimCount: 30,
    sourceCount: 20,
    observationCount: 56,
    relationCount: 147,
    blockerCount: 11,
  })
  assert.equal(first.artifact.graphImpact.sourcesAdded.at(-1), 'src-youyi-lu-zjlib-36-3-lithographic-variant')
  assert.equal(first.artifact.graphImpact.addedObservationIds.at(-1), 'obs-youyi-zjlib-p85-p86-direct-lithographic-palace-order')
  assert.equal(first.artifact.bindingMatrix.coverage.directNamedPalaceWitnessCount, 4)
  assert.equal(first.artifact.bindingMatrix.coverage.additionalDirectNamedPalaceCorroborationCount, 3)
  assert.equal(first.artifact.bindingMatrix.coverage.directSingleWitnessFullBindingCount, 0)
  assert.equal(first.artifact.bindingMatrix.coverage.productionOrdinalBindingCount, 0)
  assert.equal(first.artifact.bindingMatrix.coverage.semanticAuthorityCount, 0)
  assert.equal(first.artifact.lineageAssessment.lithographicVariantComparison.directVisualComparisonPerformed, true)
  assert.equal(first.artifact.lineageAssessment.lithographicVariantComparison.blockOrColophonIdentityClosed, false)
  assert.equal(first.artifact.lineageAssessment.independentWitnessStatus, 'not_admitted')
  assert.deepEqual(first.artifact.graphImpact.blockersClosed, [])
  assert.equal(first.artifact.readinessImpact.readiness, 'not_safe_to_start')
  assert.equal(first.artifact.readinessImpact.grounding, 'blocked')
  assert.equal(first.artifact.readinessImpact.activation, 'experimental_only')

  const directory = await mkdtemp(join(tmpdir(), 'ziwei-palace-composition-v9-check-'))
  try {
    const target = join(directory, 'complete.json')
    await materializeBundle(target, { mode: 'historical_reference' })
    assert.deepEqual(checkArtifact(ROOT, target), [])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('v9 materialization is byte-identical on repeated writes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ziwei-palace-composition-v9-deterministic-'))
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

test('v9 negative checker rejects lineage, witness, binding, graph, readiness, authority, timestamp, and asset shortcuts', () => {
  const output = execFileSync(
    'node',
    ['scripts/check-ziwei-p0-palace-branch-slot-composition-v9-negative-v0.mjs'],
    { cwd: ROOT, encoding: 'utf8' },
  )
  const result = JSON.parse(output)
  assert.equal(result.mutationCount, 14)
  assert.equal(result.allRejected, true)
  assert.ok(result.results.every(item => item.rejected))
})
