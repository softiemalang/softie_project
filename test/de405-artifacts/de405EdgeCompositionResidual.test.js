import assert from 'node:assert/strict'
import { test } from 'node:test'
import { analyze } from '../../scripts/lib/de405-edge-composition-residual.mjs'

test('edge composition residual cohort and contract remain fixed', async () => {
  const result = await analyze()
  assert.equal(result.cohortCount, 36)
  assert.equal(result.pairReferenceUnavailableCount, 0)
  assert.equal(result.contractState.selectionUnresolved, 1701)
  assert.equal(result.contractState.toleranceChanged, false)
  assert.equal(result.contractState.productionIntegration, false)
})
