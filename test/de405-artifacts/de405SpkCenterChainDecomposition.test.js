import assert from 'node:assert/strict'
import { test } from 'node:test'
import { analyze } from '../../scripts/lib/de405-spk-center-chain-decomposition.mjs'

test('center-chain decomposition preserves fixed coverage and direct comparison population', async () => {
  const a=await analyze()
  assert.equal(a.totalSamples,1701); assert.equal(a.controlCount,1222); assert.equal(a.mismatchCount,479)
  assert.deepEqual(a.groups,{candidate_state_different:1095,state_equivalent_selection_different:606})
  assert.equal(a.contractState.selectionUnresolved,1701); assert.equal(a.contractState.toleranceChanged,false)
})
