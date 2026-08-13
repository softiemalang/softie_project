import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

import { canonicalIdentityJson } from '../src/artifactIdentity.js'
import {
  ARTIFACT_DIR,
  ROOT,
  buildBundle,
  materializeBundle,
} from '../scripts/materialize-ziwei-p0-palace-branch-slot-composition-v3.mjs'
import { checkArtifact } from '../scripts/check-ziwei-p0-palace-branch-slot-composition-v3.mjs'

test('v3 preserves direct-scan corroboration while keeping physical and authority gates open', async () => {
  const first = buildBundle(ROOT, { mode: 'historical_reference' })
  const second = buildBundle(ROOT, { mode: 'historical_reference' })
  assert.equal(canonicalIdentityJson(first), canonicalIdentityJson(second))
  assert.deepEqual(first.artifact.graphImpact.predecessor, {
    claimCount: 30,
    sourceCount: 17,
    observationCount: 53,
    relationCount: 143,
    blockerCount: 11,
  })
  assert.deepEqual(first.artifact.graphImpact.successor, {
    claimCount: 30,
    sourceCount: 19,
    observationCount: 55,
    relationCount: 146,
    blockerCount: 11,
  })
  assert.deepEqual(first.artifact.graphImpact.physicalWitnessesAdded, [
    'src-youyi-lu-nlc-332-97-1883',
    'src-youyi-lu-zjlib-36-25-late-reprint',
  ])
  assert.equal(first.artifact.graphImpact.independentPhysicalWitnessesAdmitted, 0)
  assert.equal(first.artifact.bindingMatrix.coverage.directNamedPalaceWitnessCount, 3)
  assert.equal(first.artifact.bindingMatrix.coverage.additionalDirectNamedPalaceCorroborationCount, 2)
  assert.equal(first.artifact.bindingMatrix.coverage.directSingleWitnessFullBindingCount, 0)
  assert.equal(first.artifact.bindingMatrix.coverage.productionOrdinalBindingCount, 0)
  assert.equal(first.artifact.lineageAssessment.sameEditionComparison.independentLineageAdmitted, false)
  assert.equal(first.artifact.lineageAssessment.lateReprintComparison.blockOrColophonIdentityClosed, false)
  assert.equal(first.artifact.lineageAssessment.earlierEdition1871.directTextComparisonPerformed, false)
  assert.equal(first.artifact.readinessImpact.readiness, 'not_safe_to_start')
  assert.equal(first.artifact.readinessImpact.grounding, 'blocked')
  assert.equal(first.artifact.readinessImpact.activation, 'experimental_only')
  assert.deepEqual(first.artifact.graphImpact.blockersClosed, [])
  const directory = await mkdtemp(join(tmpdir(), 'ziwei-palace-composition-v3-check-'))
  try {
    const target = join(directory, 'complete.json')
    await materializeBundle(target, { mode: 'historical_reference' })
    assert.deepEqual(checkArtifact(ROOT, target), [])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('v3 materialization is byte-identical on repeated writes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ziwei-palace-composition-v3-deterministic-'))
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

test('v3 negative checker rejects lineage, slot, ordinal, authority, and candidate shortcuts', () => {
  const output = execFileSync(
    'node',
    ['scripts/check-ziwei-p0-palace-branch-slot-composition-v3-negative-v0.mjs'],
    { cwd: ROOT, encoding: 'utf8' },
  )
  const result = JSON.parse(output)
  assert.equal(result.mutationCount, 12)
  assert.equal(result.allRejected, true)
  assert.ok(result.results.every(item => item.rejected))
})
