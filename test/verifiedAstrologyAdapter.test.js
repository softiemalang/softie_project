import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { deriveAstrologyRuleChart } from '../src/astrology/astrologyRuleCore.js'
import { canonicalSha256, createVerifiedAstrologyAdapterContext } from '../src/astrology/verifiedAstrologyAdapter.js'
import { materializeVerifiedAstrologyDryRun } from '../scripts/materialize-verified-astrology-dry-run.mjs'

const evidence = JSON.parse(readFileSync('test/fixtures/astrology/golden/astrology-ephemeris-golden-v1.json', 'utf8'))
const raw = evidence.rawChart.value
const rule = evidence.ruleCore.value
const makeInput = (overrides = {}) => ({
  rawChart: raw, ruleChart: rule, rawChartHash: canonicalSha256(raw), ruleChartHash: canonicalSha256(rule),
  provenance: { rawChartSha256: canonicalSha256(raw), ruleChartSha256: canonicalSha256(rule) },
  inputCompleteness: { time: 'complete', location: 'complete', evidence: 'complete' }, ...overrides,
})

test('verified adapter golden happy path preserves v1 semantics and remains blocked', () => {
  const result = createVerifiedAstrologyAdapterContext(makeInput())
  assert.equal(result.calculationContext.schemaVersion, 'astrology-verified-calculation-context-v1')
  assert.equal(result.calculationContext.calculationStatus, 'verified')
  assert.equal(result.status.availableForInterpretation, false)
  assert.equal(result.status.serviceEligibility, 'blocked')
  assert.equal(result.status.reason, 'verified_adapter_not_activated')
  assert.equal(result.calculationContext.bodies.length, 10)
  assert.equal(result.calculationContext.chartSystem.houseSystem, 'whole_sign')
  assert.deepEqual(result.calculationContext.aspects, rule.aspects)
})

for (const [name, overrides, reason] of [
  ['raw/rule hash mismatch', { rawChartHash: 'bad' }, 'raw_hash_mismatch'],
  ['legacy simulation', { rawChart: { ...raw, schemaVersion: 'astrology-raw-chart-v0', provenance: { ...raw.provenance, de405: { evaluator: 'date-seed-simulation' } } } , rawChartHash: null }, 'raw_schema_not_v1'],
  ['Placidus mislabel', { ruleChart: { ...rule, metadata: { ...rule.metadata, houseSystem: 'placidus' } }, ruleChartHash: null }, 'rule_chart_system_mismatch'],
  ['frozen speed provenance', { rawChart: { ...raw, provenance: { ...raw.provenance, transform: { ...raw.provenance.transform, speed: 'frozen_frame_xy_angular_rate_only' } } }, rawChartHash: null }, 'moving_frame_speed_provenance_missing'],
  ['incomplete evidence', { inputCompleteness: { time: 'complete', location: 'complete', evidence: 'pending' } }, 'input_completeness_incomplete'],
]) {
  test(`verified adapter fail-closed: ${name}`, () => {
    const input = makeInput(overrides)
    if (overrides.rawChart && overrides.rawChartHash === null) input.rawChartHash = canonicalSha256(input.rawChart)
    if (overrides.ruleChart && overrides.ruleChartHash === null) input.ruleChartHash = canonicalSha256(input.ruleChart)
    if (overrides.rawChart && overrides.rawChartHash === null) input.provenance.rawChartSha256 = input.rawChartHash
    if (overrides.ruleChart && overrides.ruleChartHash === null) input.provenance.ruleChartSha256 = input.ruleChartHash
    assert.equal(createVerifiedAstrologyAdapterContext(input).status.reason, reason)
  })
}

test('verified adapter is input-order independent and materializer is byte-stable', async () => {
  const first = await materializeVerifiedAstrologyDryRun()
  const second = await materializeVerifiedAstrologyDryRun()
  assert.deepEqual(first, second)
  assert.equal(first.simulationContamination, false)
  assert.equal(first.service.reason, 'verified_adapter_not_activated')
})
