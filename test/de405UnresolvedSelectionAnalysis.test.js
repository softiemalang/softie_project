import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  calculatePercentiles,
  runUnresolvedSelectionAnalysis,
  selectRepresentativeSamples,
  serializeCanonicalJson
} from '../scripts/lib/de405-unresolved-selection-analysis.mjs'

test('calculatePercentiles computes deterministic values for valid input', () => {
  const values = [10, 20, 30, 40, 50]
  const res = calculatePercentiles(values)
  assert.equal(res.min, 10)
  assert.equal(res.p50, 30)
  assert.equal(res.max, 50)
})

test('calculatePercentiles throws error on NaN or Infinity', () => {
  assert.throws(() => calculatePercentiles([1, 2, NaN]), /NaN or Infinity detected/)
  assert.throws(() => calculatePercentiles([1, 2, Infinity]), /NaN or Infinity detected/)
})

test('selectRepresentativeSamples resolves ties deterministically using sampleId', () => {
  const samples = [
    { sampleId: 'sample-B', positionNorm: 1.0, velocityNorm: 0.0, queryEt: 100 },
    { sampleId: 'sample-A', positionNorm: 1.0, velocityNorm: 0.0, queryEt: 100 }
  ]
  const res = selectRepresentativeSamples(samples)
  assert.equal(res.byPositionResidual.minResidual.sampleId, 'sample-A')
  assert.equal(res.temporalAndAlphabetical.alphabeticalFirst.sampleId, 'sample-A')
})

test('runUnresolvedSelectionAnalysis produces byte-identical output across multiple runs on repository artifacts', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'de405-analysis-test-'))
  const file1 = join(dir, 'report1.json')
  const file2 = join(dir, 'report2.json')
  try {
    const report1 = await runUnresolvedSelectionAnalysis()
    const report2 = await runUnresolvedSelectionAnalysis()

    const json1 = serializeCanonicalJson(report1)
    const json2 = serializeCanonicalJson(report2)

    assert.equal(json1, json2)
    assert.equal(report1.invariants.totalUnresolvedCount, 1701)
    assert.equal(report1.invariants.groupCounts.state_equivalent_selection_different, 606)
    assert.equal(report1.invariants.groupCounts.candidate_state_different, 1095)
    assert.equal(report1.candidateAlternativesBitwiseIdentity.bitwiseIdentical, 1701)
    assert.equal(report1.candidateAlternativesBitwiseIdentity.bitwiseDifferent, 0)
    assert.equal(report1.candidateAlternativesBitwiseIdentity.notComparable, 0)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
