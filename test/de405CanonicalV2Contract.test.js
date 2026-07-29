import test from 'node:test'
import assert from 'node:assert/strict'
import { TARGETS, STEP_SECONDS, TIMESTAMP_COUNT, EXPECTED_ROW_COUNT, TOTAL_RANGE_SECONDS, LAST_SAMPLE_GAP_SECONDS, START_ET, END_ET } from '../scripts/lib/de405-canonical-v2-contract.mjs'
test('canonical v2 contract has exact targets and grid', () => { assert.deepEqual(TARGETS.map(t=>t.targetId),[1,2,4,5,6,7,8,9,10,301]); assert.equal(TARGETS.length,10); assert.equal(TIMESTAMP_COUNT,7342); assert.equal(EXPECTED_ROW_COUNT,73420); assert.equal(STEP_SECONDS,864000); assert.equal(Number(END_ET)-Number(START_ET),TOTAL_RANGE_SECONDS); assert.equal(Number(END_ET)-(Number(START_ET)+7341*STEP_SECONDS),LAST_SAMPLE_GAP_SECONDS) })
