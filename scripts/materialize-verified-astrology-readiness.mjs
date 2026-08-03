#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { assessVerifiedAstrologyReadiness, canonicalSha256 } from '../src/astrology/verifiedAstrologyReadiness.js'

const hash = 'a'.repeat(64)
const evidence = (overrides = {}) => ({ provider: 'synthetic', model: 'contract-fixture', version: '1', observationAt: '2049-01-01T00:00:00.000Z', value: 0, unit: 'unit', verificationStatus: 'verified', freshnessStatus: 'fresh', source: { identity: 'synthetic-source', sha256: hash }, sourceRefs: ['fixture'], ...overrides })
const valid = () => ({ assessmentTime: '2050-01-01T00:00:00.000Z', input: { civilTime: { resolutionStatus: 'resolved', ianaTimeZone: 'Asia/Seoul', utc: '2050-01-01T00:00:00.000Z' }, location: { verificationStatus: 'verified' }, dut1: evidence({ applicableRange: { start: '2049-01-01T00:00:00.000Z', end: '2051-01-01T00:00:00.000Z' } }) }, timeScale: { leapSecond: evidence({ applicableRange: { start: '2049-01-01T00:00:00.000Z', end: '2051-01-01T00:00:00.000Z' } }), ttMinusUtc: evidence({ applicableRange: { start: '2049-01-01T00:00:00.000Z', end: '2051-01-01T00:00:00.000Z' } }), tdbMinusTt: evidence({ modelDeterminism: 'deterministic' }) }, ephemeris: { requestedEt: 0, bsp: { hashStatus: 'verified', coverage: { start: -1, end: 1 } }, evaluatorSelection: { status: 'verified', evaluator: 'de405-canonical-v2' } }, runtime: { runner: { executableStatus: 'executable', protocolStatus: 'verified', protocolVersion: 'de405-canonical-v2-protocol-v1', identityStatus: 'verified' } }, documents: { raw: { schemaVersion: 'astrology-raw-chart-v1', schemaHashStatus: 'verified' }, rule: { schemaVersion: 'astrology-rule-chart-v0', schemaHashStatus: 'verified' }, adapter: { schemaVersion: 'verified-astrology-adapter-v1', schemaHashStatus: 'verified' }, evaluatorSelectionStatus: 'verified' }, contamination: { simulation: false, houseSystem: 'whole_sign', speedModel: 'moving-frame', connectedConsumers: [] } })
const cases = [{ id: 'all-valid-calculation-ready', input: valid() }]
for (const [id, reason, mutate] of [
  ['coverage-boundary-in', null, (v) => { v.ephemeris.requestedEt = 1 }],
  ['civil-time-fold', 'civil_time_ambiguous', (v) => { v.input.civilTime.resolutionStatus = 'ambiguous' }],
  ['civil-time-gap', 'civil_time_nonexistent', (v) => { v.input.civilTime.resolutionStatus = 'nonexistent' }],
  ['timezone-unverified', 'timezone_unverified', (v) => { v.input.civilTime.ianaTimeZone = null }],
  ['location-unverified', 'location_unverified', (v) => { v.input.location.verificationStatus = 'unverified' }],
  ['dut1-missing', 'dut1_missing', (v) => { v.input.dut1 = null }],
  ['dut1-stale', 'dut1_stale', (v) => { v.input.dut1.freshnessStatus = 'stale' }],
  ['dut1-future-effective', 'provider_future_effective', (v) => { v.input.dut1.effectiveAt = '2051-01-01T00:00:00.000Z' }],
  ['leap-second-missing', 'leap_second_provenance_missing', (v) => { v.timeScale.leapSecond = null }],
  ['leap-second-time-mismatch', 'leap_second_time_mismatch', (v) => { v.timeScale.leapSecond.applicableRange.end = '2049-12-31T23:59:59.999Z' }],
  ['tt-utc-missing', 'tt_minus_utc_provenance_missing', (v) => { v.timeScale.ttMinusUtc = null }],
  ['tt-utc-time-mismatch', 'tt_minus_utc_time_mismatch', (v) => { v.timeScale.ttMinusUtc.applicableRange.end = '2049-12-31T23:59:59.999Z' }],
  ['tdb-tt-missing', 'tdb_minus_tt_missing', (v) => { v.timeScale.tdbMinusTt = null }],
  ['tdb-tt-nondeterministic', 'tdb_minus_tt_model_nondeterministic', (v) => { v.timeScale.tdbMinusTt.modelDeterminism = 'environment-dependent' }],
  ['bsp-missing', 'bsp_missing', (v) => { v.ephemeris.bsp = null }],
  ['bsp-hash-mismatch', 'bsp_hash_mismatch', (v) => { v.ephemeris.bsp.hashStatus = 'mismatch' }],
  ['bsp-outside-coverage', 'bsp_coverage_outside', (v) => { v.ephemeris.requestedEt = 2 }],
  ['runner-missing', 'runner_missing', (v) => { v.runtime.runner = null }],
  ['runner-unexecutable', 'runner_unexecutable', (v) => { v.runtime.runner.executableStatus = 'not-executable' }],
  ['runner-protocol-mismatch', 'runner_protocol_mismatch', (v) => { v.runtime.runner.protocolVersion = 'wrong' }],
  ['runner-identity-mismatch', 'runner_identity_mismatch', (v) => { v.runtime.runner.identityStatus = 'mismatch' }],
  ['evaluator-selection-unverified', 'evaluator_selection_unverified', (v) => { v.ephemeris.evaluatorSelection.status = 'unverified'; v.documents.evaluatorSelectionStatus = 'unverified' }],
  ['raw-schema-hash-mismatch', 'raw_schema_hash_mismatch', (v) => { v.documents.raw.schemaHashStatus = 'mismatch' }],
  ['rule-schema-hash-mismatch', 'rule_schema_hash_mismatch', (v) => { v.documents.rule.schemaHashStatus = 'mismatch' }],
  ['adapter-schema-hash-mismatch', 'adapter_schema_hash_mismatch', (v) => { v.documents.adapter.schemaHashStatus = 'mismatch' }],
  ['simulation-contamination', 'simulation_contamination', (v) => { v.contamination.simulation = true }],
  ['placidus-contamination', 'placidus_contamination', (v) => { v.contamination.houseSystem = 'placidus' }],
  ['frozen-speed-contamination', 'frozen_speed_contamination', (v) => { v.contamination.speedModel = 'frozen' }],
  ['consumer-connection-detected', 'consumer_connection_detected', (v) => { v.contamination.connectedConsumers = ['prep'] }],
]) { const input = valid(); mutate(input); cases.push({ id, expectedReason: reason, input }) }
const materialized = { schemaVersion: 'astrology-verified-readiness-evidence-v1', contract: 'verified-astrology-readiness-v1', cases: cases.map(({ id, expectedReason, input }) => ({ id, expectedReason, assessment: assessVerifiedAstrologyReadiness(input) })) }
const first = JSON.stringify(materialized, null, 2) + '\n'
const second = JSON.stringify(materialized, null, 2) + '\n'
if (first !== second) throw new Error('readiness evidence is not byte-stable')
const output = { ...materialized, payloadCanonicalSha256: canonicalSha256(materialized), byteIdentity: true, serviceActivation: 'blocked' }
const fileBytes = value => Buffer.from(JSON.stringify(value, null, 2) + '\n')
const documentCanonicalSha256 = canonicalSha256(output)
const outputBytes = fileBytes(output)
const fileBytesSha256 = createHash('sha256').update(outputBytes).digest('hex')
const counts = {
  total: materialized.cases.length,
  ready: materialized.cases.filter(item => item.assessment.readiness === 'ready').length,
  blocked: materialized.cases.filter(item => item.assessment.readiness === 'blocked').length,
  expectedReasonPresent: materialized.cases.filter(item => item.expectedReason).length,
  expectedReasonMissing: materialized.cases.filter(item => !item.expectedReason).length,
  positiveBoundaryCaseIds: materialized.cases.filter(item => item.assessment.readiness === 'ready').map(item => item.id),
  negativeCaseIds: materialized.cases.filter(item => item.assessment.readiness === 'blocked').map(item => item.id),
}
await mkdir('artifacts', { recursive: true })
await writeFile('artifacts/astrology-verified-readiness-v1.json', outputBytes)
await writeFile('artifacts/astrology-verified-readiness-v1.integrity.json', JSON.stringify({
  schemaVersion: 'astrology-verified-readiness-integrity-v1',
  artifactPath: 'artifacts/astrology-verified-readiness-v1.json',
  payloadCanonicalSha256: output.payloadCanonicalSha256,
  documentCanonicalSha256,
  fileBytesSha256,
  counts,
}, null, 2) + '\n')
console.log(JSON.stringify({ path: 'artifacts/astrology-verified-readiness-v1.json', payloadCanonicalSha256: output.payloadCanonicalSha256, documentCanonicalSha256, fileBytesSha256, counts, byteIdentity: true, serviceActivation: output.serviceActivation }, null, 2))
