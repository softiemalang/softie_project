import test from 'node:test'
import assert from 'node:assert/strict'
import { de405OverlapToleranceContract as contract } from '../scripts/lib/de405-overlap-tolerance-contract.mjs'
import { nextDown, nextUp, nearestRankPercentile, residualEvidence } from '../scripts/lib/de405-overlap-sweep.mjs'

test('arbitrary ET helpers preserve binary64 adjacent values', () => {
  const value = -1577361600
  assert.equal(nextDown(nextUp(value)), value)
  assert.notEqual(nextUp(value), value)
  assert.notEqual(nextDown(value), value)
})

test('nearest-rank percentile uses ceil(p*N)', () => {
  assert.equal(nearestRankPercentile([4, 1, 3, 2], 0.5), 2)
  assert.equal(nearestRankPercentile([4, 1, 3, 2], 0.99), 4)
})

test('residual evidence separates an out-of-coverage sample from numeric residuals', () => {
  const sample = { sampleId: 's', queryEtHex: '0x0000000000000000', comparisonCaseId: 'venus_barycenter', targetId: 2, centerId: 399, frameId: 1, segmentOrdinal: 1, recordIndex: 0, knotIndex: null, epochKind: 'record_quarter' }
  const evidence = residualEvidence(sample, {
    sampleId: sample.sampleId,
    queryEtHex: sample.queryEtHex,
    evaluationStatus: 'evaluated',
    stateKmKmPerSec: [1, 2, 3, 4, 5, 6]
  }, {
    sampleId: sample.sampleId,
    queryEtHex: sample.queryEtHex,
    selectionEvidenceStatus: 'out_of_coverage',
    stateKmKmPerSec: null
  }, contract)
  assert.equal(evidence.evaluationStatus, 'out_of_coverage')
  assert.equal(evidence.positionResidualKm, null)
  assert.equal(evidence.candidatePass, null)
})
