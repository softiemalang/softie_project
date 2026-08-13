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
} from '../scripts/materialize-ziwei-p0-palace-branch-slot-composition-v2.mjs'
import { checkArtifact } from '../scripts/check-ziwei-p0-palace-branch-slot-composition-v2.mjs'

test('palace branch-slot composition is complete as a derivation and incomplete as authority', () => {
  const first = buildBundle(ROOT, { mode: 'historical_reference' })
  const second = buildBundle(ROOT, { mode: 'historical_reference' })
  assert.equal(canonicalIdentityJson(first), canonicalIdentityJson(second))
  assert.deepEqual(first.artifact.graphImpact.predecessor, {
    claimCount: 30,
    sourceCount: 15,
    observationCount: 50,
    relationCount: 140,
    blockerCount: 11,
  })
  assert.deepEqual(first.artifact.graphImpact.successor, {
    claimCount: 30,
    sourceCount: 17,
    observationCount: 53,
    relationCount: 143,
    blockerCount: 11,
  })
  assert.equal(first.artifact.bindingMatrix.coverage.directSingleWitnessFullBindingCount, 0)
  assert.equal(first.artifact.bindingMatrix.coverage.composedSourceBindingCount, 12)
  assert.equal(first.artifact.bindingMatrix.coverage.secondaryClarificationMatchCount, 12)
  assert.equal(first.artifact.bindingMatrix.coverage.productionOrdinalBindingCount, 0)
  assert.deepEqual(first.artifact.bindingMatrix.anchorRows.map(row => row.branchToken), ['寅', '丑', '子', '亥', '戌', '酉', '申', '未', '午', '巳', '辰', '卯'])
  assert.deepEqual(first.artifact.bindingMatrix.anchorRows.map(row => row.physicalSlotClockwiseIndex), [9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 11, 10])
  assert.deepEqual(first.artifact.bindingMatrix.anchorRows.map(row => row.productionOrdinal), Array(12).fill(null))
  assert.equal(first.artifact.lineageAssessment.joinStatus, 'inferred_not_directly_asserted_by_either_source')
  assert.equal(first.artifact.lineageAssessment.earlierEdition1871.directTextComparisonPerformed, false)
  assert.equal(first.artifact.readinessImpact.readiness, 'not_safe_to_start')
  assert.equal(first.artifact.readinessImpact.grounding, 'blocked')
  assert.equal(first.artifact.readinessImpact.activation, 'experimental_only')
  assert.deepEqual(first.artifact.graphImpact.blockersClosed, [])
  assert.deepEqual(checkArtifact(ROOT, resolve(ROOT, ARTIFACT_DIR + '/complete.json')), [])
})

test('composition materialization is byte-identical on repeated writes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ziwei-palace-composition-deterministic-'))
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

test('composition negative checker rejects authority, lineage, and production shortcuts', () => {
  const output = execFileSync(
    'node',
    ['scripts/check-ziwei-p0-palace-branch-slot-composition-v2-negative-v0.mjs'],
    { cwd: ROOT, encoding: 'utf8' },
  )
  const result = JSON.parse(output)
  assert.equal(result.mutationCount, 12)
  assert.equal(result.allRejected, true)
  assert.ok(result.results.every(item => item.rejected))
})
