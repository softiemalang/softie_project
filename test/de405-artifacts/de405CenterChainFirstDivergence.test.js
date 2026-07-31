import assert from 'node:assert/strict'
import { test } from 'node:test'
import { analyze } from '../../scripts/lib/de405-center-chain-first-divergence.mjs'

test('center-chain first-divergence evidence preserves the fixed 243-row contract', async () => {
  const result = await analyze()
  assert.equal(result.cohortCount, 243)
  assert.equal(result.chainContract.validGraphCount, 243)
  assert.equal(result.uniqueLegPairQueryCount, 486)
  assert.equal(result.pairReferenceUnavailableCount, 0)
  assert.equal(result.nativeExpectedOperationCount, 2916)
  assert.equal(result.nativeExecutedOperationCount, 2916)
  assert.equal(result.parityMismatchCount, 0)
  assert.equal(result.nativeFailureCount, 0)
  assert.equal(result.jsFallback, false)
  assert.equal(result.contractState.selectionUnresolved, 1701)
  assert.equal(result.contractState.toleranceChanged, false)
})
