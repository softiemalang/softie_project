import assert from 'node:assert/strict'
import { test } from 'node:test'
import { analyze } from '../../scripts/lib/de405-cspice-reference-contract-audit.mjs'

test('CSPICE reference contract audit covers fixed cohort and sequence matrix', async () => {
  const result = await analyze()
  assert.equal(result.cohortCount, 36)
  assert.equal(result.processRunCount, 360)
  assert.equal(result.callCount, 1368)
  assert.deepEqual(result.sequenceMatrixCoverage, { A: 36, B: 36, C: 36, D: 36, E: 36 })
  assert.equal(result.contractState.selectionUnresolved, 1701)
})
