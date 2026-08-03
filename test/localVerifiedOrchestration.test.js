import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalSha256, providerBundleCanonicalSha256, runLocalVerifiedOrchestration } from '../src/astrology/localVerifiedOrchestration.js'

const sourceHash = 'a'.repeat(64)
const evidence = (identity, value, extra = {}) => ({ identity, provider: 'fixture', model: identity, version: 'v1', value, unit: 'seconds', verificationStatus: 'verified', freshnessStatus: 'fresh', effectiveAt: '1900-01-01T00:00:00.000Z', expiryAt: '2100-01-01T00:00:00.000Z', sourceRefs: [`fixture/${identity}`], source: { identity: `fixture-${identity}`, sha256: sourceHash }, ...extra })
const bundle = { schemaVersion: 'astrology-provider-evidence-bundle-v1', bundleVersion: 'fixture-v1', materialization: 'adopt', fetchMode: 'offline', cacheMode: 'disabled', evidence: [evidence('iers-dut1', 0.1), evidence('iers-leap-seconds', 37), evidence('tai-utc', 64.184), evidence('tdb-minus-tt', 0, { modelDeterminism: 'deterministic' })] }
bundle.providerBundleCanonicalSha256 = providerBundleCanonicalSha256(bundle)
const input = { schemaVersion: 'astrology-local-orchestration-input-v1', candidateId: 'fixture', civilTime: { utc: '2000-01-01T12:00:00.000Z', utcFields: { year: 2000, month: 1, day: 1, hour: 12, minute: 0, second: 0 }, ianaTimeZone: 'Etc/UTC', resolutionStatus: 'resolved', foldStatus: 'unique', gapStatus: 'none' }, location: { latitude: 37, longitude: 127, verificationStatus: 'verified' } }
const runtime = { kernel: { hash: 'b'.repeat(64), hashStatus: 'verified', coverage: { start: -1e12, end: 1e12 } }, runner: { executableStatus: 'executable', protocolStatus: 'verified', protocolVersion: 'de405-canonical-v2-protocol-v1', identityStatus: 'verified', runnerIdentity: 'fixture-runner' }, evaluatorSelection: { status: 'verified', evaluator: 'de405-canonical-v2' } }
const states = Object.fromEntries(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].map((id, index) => [id, { stateKmKmPerSec: [1e8 + index * 1e6, 2e8 + index * 1e6, 3e7, 10, 20, 30], selectionEvidenceStatus: 'verified' }]))
const run = overrides => runLocalVerifiedOrchestration({ input, providerBundle: bundle, runtime, evaluateStates: () => ({ availability: 'available', states }), ...overrides })

test('local orchestration completes the calculation chain but remains activation-blocked', () => {
  const first = run(); const second = run()
  assert.deepEqual(first, second)
  assert.equal(first.status, 'completed')
  assert.equal(first.stages.timeAngle.status, 'completed')
  assert.equal(first.stages.raw.status, 'completed')
  assert.equal(first.stages.rule.status, 'completed')
  assert.equal(first.stages.adapter.status, 'completed')
  assert.equal(first.stages.readiness.status, 'completed')
  assert.deepEqual(first.activation, { availableForInterpretation: false, integrationStatus: 'not_connected', serviceEligibility: 'blocked', reason: 'activation_requires_user_approval' })
})

test('local orchestration is input-key-order independent and hashes are reproducible', () => {
  const reversed = JSON.parse(JSON.stringify(input, (key, value) => value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).reverse()) : value))
  const result = run({ input: reversed })
  assert.equal(canonicalSha256(result), canonicalSha256(run()))
  assert.equal(result.rawChartHash, run().rawChartHash)
  assert.equal(result.ruleChartHash, run().ruleChartHash)
})

for (const [name, mutate, reason] of [
  ['fold', value => { value.input.civilTime.resolutionStatus = 'ambiguous'; value.input.civilTime.foldStatus = 'ambiguous' }, 'civil_time_ambiguous'],
  ['stale provider', value => { value.providerBundle.evidence[0].freshnessStatus = 'stale'; value.providerBundle.providerBundleCanonicalSha256 = providerBundleCanonicalSha256(value.providerBundle) }, 'provider_unverified_or_stale'],
  ['kernel mismatch', value => { value.runtime.kernel.hashStatus = 'mismatch' }, 'runtime_identity_or_protocol_mismatch'],
  ['runner mismatch', value => { value.runtime.runner.protocolVersion = 'wrong' }, 'runtime_identity_or_protocol_mismatch'],
  ['contamination', value => { value.contamination = { simulation: true } }, 'simulation_contamination'],
]) test(`local orchestration fail-closed: ${name}`, () => {
  const value = { input: structuredClone(input), providerBundle: structuredClone(bundle), runtime: structuredClone(runtime), contamination: {} }
  mutate(value)
  const result = run(value)
  assert.equal(result.status, 'blocked')
  assert.ok(result.blockedReasons.includes(reason))
  assert.equal(result.activation.serviceEligibility, 'blocked')
})
