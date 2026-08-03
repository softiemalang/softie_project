import assert from 'node:assert/strict'
import test from 'node:test'
import { assertActivationBoundary, assessVerifiedAstrologyReadiness, READINESS_AREAS, READINESS_REASON_CODES } from '../src/astrology/verifiedAstrologyReadiness.js'

const hash = 'a'.repeat(64)
const evidence = (overrides = {}) => ({ provider: 'synthetic', model: 'contract-fixture', version: '1', observationAt: '2049-01-01T00:00:00.000Z', value: 0, unit: 'unit', verificationStatus: 'verified', freshnessStatus: 'fresh', source: { identity: 'synthetic-source', sha256: hash }, sourceRefs: ['fixture'], ...overrides })
const valid = () => ({
  assessmentTime: '2050-01-01T00:00:00.000Z',
  input: {
    civilTime: { resolutionStatus: 'resolved', ianaTimeZone: 'Asia/Seoul', utc: '2050-01-01T00:00:00.000Z' },
    location: { verificationStatus: 'verified' },
    dut1: evidence({ applicableRange: { start: '2049-01-01T00:00:00.000Z', end: '2051-01-01T00:00:00.000Z' } }),
  },
  timeScale: {
    leapSecond: evidence({ applicableRange: { start: '2049-01-01T00:00:00.000Z', end: '2051-01-01T00:00:00.000Z' } }),
    ttMinusUtc: evidence({ applicableRange: { start: '2049-01-01T00:00:00.000Z', end: '2051-01-01T00:00:00.000Z' } }),
    tdbMinusTt: evidence({ modelDeterminism: 'deterministic' }),
  },
  ephemeris: { requestedEt: 0, bsp: { hashStatus: 'verified', coverage: { start: -1, end: 1 } }, evaluatorSelection: { status: 'verified', evaluator: 'de405-canonical-v2' } },
  runtime: { runner: { executableStatus: 'executable', protocolStatus: 'verified', protocolVersion: 'de405-canonical-v2-protocol-v1', identityStatus: 'verified' } },
  documents: { raw: { schemaVersion: 'astrology-raw-chart-v1', schemaHashStatus: 'verified' }, rule: { schemaVersion: 'astrology-rule-chart-v0', schemaHashStatus: 'verified' }, adapter: { schemaVersion: 'verified-astrology-adapter-v1', schemaHashStatus: 'verified' }, evaluatorSelectionStatus: 'verified' },
  contamination: { simulation: false, houseSystem: 'whole_sign', speedModel: 'moving-frame', connectedConsumers: [] },
})

test('all valid evidence is calculation-ready but permanently activation-blocked', () => {
  const result = assessVerifiedAstrologyReadiness(valid())
  assert.equal(result.readiness, 'ready')
  assert.equal(result.calculationReady, true)
  assert.equal(assertActivationBoundary(result), true)
})

for (const [name, mutate, reason] of [
  ['DST fold', (v) => { v.input.civilTime.resolutionStatus = 'ambiguous' }, 'civil_time_ambiguous'],
  ['DST gap', (v) => { v.input.civilTime.resolutionStatus = 'nonexistent' }, 'civil_time_nonexistent'],
  ['missing DUT1', (v) => { v.input.dut1 = null }, 'dut1_missing'],
  ['future effective', (v) => { v.input.dut1.effectiveAt = '2051-01-01T00:00:00.000Z' }, 'provider_future_effective'],
  ['BSP outside coverage', (v) => { v.ephemeris.requestedEt = 2 }, 'bsp_coverage_outside'],
  ['runner mismatch', (v) => { v.runtime.runner.protocolVersion = 'wrong' }, 'runner_protocol_mismatch'],
  ['frozen speed', (v) => { v.contamination.speedModel = 'frozen' }, 'frozen_speed_contamination'],
]) test(`readiness fail-closed: ${name}`, () => {
  const input = valid(); mutate(input)
  const result = assessVerifiedAstrologyReadiness(input)
  assert.equal(result.readiness, 'blocked')
  assert.ok(result.reasonCodes.includes(reason))
  assert.equal(assertActivationBoundary(result), true)
})

test('assessment is independent of object key order and reason codes are complete', () => {
  const first = assessVerifiedAstrologyReadiness(valid())
  const reversed = JSON.parse(JSON.stringify(valid(), (key, value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return value
    return Object.fromEntries(Object.entries(value).reverse())
  }))
  assert.deepEqual(first, assessVerifiedAstrologyReadiness(reversed))
  assert.ok(first.reasonCodes.every((reason) => READINESS_REASON_CODES.includes(reason)))
  assert.equal(READINESS_AREAS.length, 6)
})
