import { composeAstrologyRawChart } from './astrologyEphemerisCore.js'
import { deriveAstrologyRuleChart } from './astrologyRuleCore.js'
import { deriveAstrologyTimeAngle } from './astrologyTimeAngleCore.js'
import {
  canonicalSha256 as adapterSha256,
  createVerifiedAstrologyAdapterContext,
  VERIFIED_ASTROLOGY_ADAPTER_VERSION,
  EXPECTED_RAW_SCHEMA,
  EXPECTED_RULE_SCHEMA,
} from './verifiedAstrologyAdapter.js'
import {
  assertActivationBoundary,
  assessVerifiedAstrologyReadiness,
  VERIFIED_ASTROLOGY_READINESS_SCHEMA,
} from './verifiedAstrologyReadiness.js'
import { createHash } from 'node:crypto'

export const LOCAL_ORCHESTRATION_SCHEMA = 'astrology-local-verified-orchestration-v1'
export const LOCAL_ORCHESTRATION_VERSION = '1.0.0'
export const LOCAL_INPUT_SCHEMA = 'astrology-local-orchestration-input-v1'

const ACTIVATION = Object.freeze({
  availableForInterpretation: false,
  integrationStatus: 'not_connected',
  serviceEligibility: 'blocked',
  reason: 'activation_requires_user_approval',
})

const ordered = value => {
  if (Array.isArray(value)) return value.map(ordered)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]))
}

export function canonicalJson(value) { return `${JSON.stringify(ordered(value))}\n` }
export function canonicalSha256(value) { return createHash('sha256').update(canonicalJson(value)).digest('hex') }
export function providerBundleCanonicalSha256(bundle) {
  const copy = structuredClone(bundle)
  delete copy.bundleSha256
  delete copy.providerBundleCanonicalSha256
  if (Array.isArray(copy.evidence)) copy.evidence.sort((a, b) => a.identity.localeCompare(b.identity))
  return canonicalSha256(copy)
}

const stage = (status, reason = null, details = {}) => ({ status, ...(reason ? { reason } : {}), ...details })
const fail = (reason, stages = {}) => ({
  schemaVersion: LOCAL_ORCHESTRATION_SCHEMA,
  orchestrationVersion: LOCAL_ORCHESTRATION_VERSION,
  stages,
  blockedReasons: [reason],
  activation: ACTIVATION,
  status: 'blocked',
})

function utcFields(utc) {
  if (!utc || typeof utc !== 'object') return null
  return utc
}

function providerEvidence(bundle, identity) {
  return bundle?.evidence?.find(item => item.identity === identity) || null
}

function verifyBundle(bundle, instant) {
  if (!bundle || bundle.schemaVersion !== 'astrology-provider-evidence-bundle-v1') return 'provider_bundle_schema_mismatch'
  const expected = providerBundleCanonicalSha256(bundle)
  if (bundle.providerBundleCanonicalSha256 !== expected) return 'provider_bundle_hash_mismatch'
  if (bundle.fetchMode === 'network' || bundle.cacheMode === 'network') return 'provider_network_fetch_rejected'
  if (bundle.materialization !== 'adopt') return 'provider_materialization_not_adopted'
  if (!Array.isArray(bundle.evidence) || bundle.evidence.length === 0) return 'provider_bundle_empty'
  for (const evidence of bundle.evidence) {
    if (evidence.verificationStatus !== 'verified' || evidence.freshnessStatus !== 'fresh') return 'provider_unverified_or_stale'
    if (!Array.isArray(evidence.sourceRefs) || evidence.sourceRefs.length === 0) return 'provider_source_refs_missing'
    if (!evidence.source?.identity || !/^[a-f0-9]{64}$/.test(evidence.source.sha256 || '')) return 'provider_source_identity_invalid'
    if (evidence.effectiveAt && evidence.effectiveAt > instant) return 'provider_out_of_range'
    if (evidence.expiryAt && evidence.expiryAt <= instant) return 'provider_stale'
    if (evidence.applicableRange && (instant < evidence.applicableRange.start || instant > evidence.applicableRange.end)) return 'provider_out_of_range'
  }
  return null
}

function makeTimeAngleInput(input, bundle) {
  const dut1 = providerEvidence(bundle, 'iers-dut1')
  const tt = providerEvidence(bundle, 'tai-utc')
  return {
    schemaVersion: 'astrology-time-angle-input-v0',
    calendar: 'proleptic_gregorian',
    candidateId: input.candidateId || 'local-orchestration-fixture',
    inputStatus: 'confirmed',
    verificationStatus: 'verified',
    utc: utcFields(input.civilTime?.utcFields || input.civilTime?.utc),
    location: {
      geographicLatitudeDegrees: input.location?.latitude,
      longitudeDegreesEast: input.location?.longitude,
    },
    timeScaleOffsets: {
      ut1MinusUtcSeconds: dut1?.value,
      ttMinusUtcSeconds: tt?.value,
      sourceStatus: 'versioned-offline-provider-bundle',
    },
  }
}

function runtimeIdentity(runtime = {}) {
  return {
    bsp: runtime.kernel ? { hash: runtime.kernel.hash, hashStatus: runtime.kernel.hashStatus, coverage: runtime.kernel.coverage } : null,
    runner: runtime.runner ? { protocolVersion: runtime.runner.protocolVersion, protocolStatus: runtime.runner.protocolStatus, identityStatus: runtime.runner.identityStatus, runnerIdentity: runtime.runner.runnerIdentity } : null,
    evaluator: runtime.evaluatorSelection || null,
  }
}

export function runLocalVerifiedOrchestration({ input, providerBundle, runtime, evaluateStates, contamination = {}, assessmentTime = '2050-01-01T00:00:00.000Z', documentHashOverrides = {} } = {}) {
  const stages = {}
  if (!input || input.schemaVersion !== LOCAL_INPUT_SCHEMA) return fail('input_schema_mismatch', stages)
  const instant = input.civilTime?.utc || assessmentTime
  const bundleReason = verifyBundle(providerBundle, instant)
  const bundleHash = providerBundle ? providerBundleCanonicalSha256(providerBundle) : null
  stages.input = stage('completed', null, { schemaVersion: LOCAL_INPUT_SCHEMA, sourceRefs: ['input.civilTime', 'input.location'] })
  stages.providerBundle = bundleReason
    ? stage('blocked', bundleReason, { schemaVersion: providerBundle?.schemaVersion || null, canonicalSha256: bundleHash })
    : stage('completed', null, { schemaVersion: providerBundle.schemaVersion, version: providerBundle.bundleVersion, canonicalSha256: bundleHash, sourceRefs: providerBundle.evidence.flatMap(e => e.sourceRefs).sort() })
  if (bundleReason) return { ...fail(bundleReason, stages), providerBundleCanonicalSha256: bundleHash }
  if (input.civilTime?.resolutionStatus === 'ambiguous' || input.civilTime?.foldStatus === 'ambiguous') {
    stages.input = stage('blocked', 'civil_time_ambiguous', { schemaVersion: LOCAL_INPUT_SCHEMA, sourceRefs: ['input.civilTime'] })
    return { ...fail('civil_time_ambiguous', stages), providerBundleCanonicalSha256: bundleHash }
  }
  if (input.civilTime?.resolutionStatus === 'nonexistent' || input.civilTime?.gapStatus === 'nonexistent') {
    stages.input = stage('blocked', 'civil_time_nonexistent', { schemaVersion: LOCAL_INPUT_SCHEMA, sourceRefs: ['input.civilTime'] })
    return { ...fail('civil_time_nonexistent', stages), providerBundleCanonicalSha256: bundleHash }
  }
  if (input.civilTime?.resolutionStatus !== 'resolved' || !input.civilTime?.ianaTimeZone) {
    stages.input = stage('blocked', 'timezone_unverified', { schemaVersion: LOCAL_INPUT_SCHEMA, sourceRefs: ['input.civilTime'] })
    return { ...fail('timezone_unverified', stages), providerBundleCanonicalSha256: bundleHash }
  }
  if (input.location?.verificationStatus !== 'verified') {
    stages.input = stage('blocked', 'location_unverified', { schemaVersion: LOCAL_INPUT_SCHEMA, sourceRefs: ['input.location'] })
    return { ...fail('location_unverified', stages), providerBundleCanonicalSha256: bundleHash }
  }
  if (contamination.simulation === true || contamination.houseSystem === 'placidus' || contamination.speedModel === 'frozen' || contamination.connectedConsumers?.length) {
    const reason = contamination.simulation === true ? 'simulation_contamination' : contamination.houseSystem === 'placidus' ? 'placidus_contamination' : contamination.speedModel === 'frozen' ? 'frozen_speed_contamination' : 'consumer_connection_detected'
    stages.contamination = stage('blocked', reason, { sourceRefs: ['contamination'] })
    return { ...fail(reason, stages), providerBundleCanonicalSha256: bundleHash }
  }

  const runtimeReady = runtime?.kernel?.hashStatus === 'verified' && runtime?.runner?.protocolStatus === 'verified' && runtime?.runner?.protocolVersion === 'de405-canonical-v2-protocol-v1' && runtime?.runner?.identityStatus === 'verified' && runtime?.evaluatorSelection?.status === 'verified' && runtime?.evaluatorSelection?.evaluator === 'de405-canonical-v2'
  stages.runtime = runtimeReady ? stage('completed', null, { identity: runtimeIdentity(runtime), sourceRefs: ['runtime.kernel', 'runtime.runner', 'runtime.evaluatorSelection'] }) : stage('blocked', 'runtime_identity_or_protocol_mismatch', { identity: runtimeIdentity(runtime), sourceRefs: ['runtime.kernel', 'runtime.runner', 'runtime.evaluatorSelection'] })
  if (!runtimeReady) return { ...fail(stages.runtime.reason, stages), providerBundleCanonicalSha256: bundleHash, runtime: runtimeIdentity(runtime) }
  const timeAngleInput = makeTimeAngleInput(input, providerBundle)
  const timeAngle = deriveAstrologyTimeAngle(timeAngleInput)
  const timeAngleReady = timeAngle.blockedFeatures?.length === 0 && timeAngle.unsupportedFeatures?.length === 0 && timeAngle.calendar?.availability === 'available' && timeAngle.timeScales?.julianDateUt1?.availability === 'available' && timeAngle.timeScales?.julianDateTt?.availability === 'available'
  stages.timeAngle = timeAngleReady ? stage('completed', null, { schemaVersion: timeAngle.schemaVersion, sourceRefs: ['input.civilTime.utc', 'input.location', 'input.timeScaleOffsets'] }) : stage('blocked', timeAngle.blockedFeatures?.[0]?.reason || timeAngle.unsupportedFeatures?.[0]?.reason || 'time_angle_unavailable', { schemaVersion: timeAngle.schemaVersion, sourceRefs: ['input.civilTime.utc', 'input.location', 'input.timeScaleOffsets'] })
  if (stages.timeAngle.status !== 'completed') return { ...fail(stages.timeAngle.reason, stages), providerBundleCanonicalSha256: bundleHash, runtime: runtimeIdentity(runtime) }

  const tdb = providerEvidence(providerBundle, 'tdb-minus-tt')
  const raw = composeAstrologyRawChart({ timeAngleInput, tdbMinusTtSeconds: tdb.value, evaluateStates, kernelProvenance: { kernelSha256: runtime.kernel.hash, runnerIdentity: runtime.runner.runnerIdentity, evaluatorIdentity: runtime.evaluatorSelection.evaluator } })
  stages.raw = raw.availability === 'available' ? stage('completed', null, { schemaVersion: raw.schemaVersion, sourceRefs: ['timeAngle', 'provider.tdb-minus-tt', 'runtime.kernel', 'runtime.evaluatorSelection'] }) : stage('blocked', raw.reason || 'raw_chart_blocked', { schemaVersion: raw.schemaVersion, sourceRefs: ['timeAngle', 'provider.tdb-minus-tt', 'runtime.kernel', 'runtime.evaluatorSelection'] })
  if (stages.raw.status !== 'completed') return { ...fail(stages.raw.reason, stages), providerBundleCanonicalSha256: bundleHash, runtime: runtimeIdentity(runtime) }

  const orderedRaw = ordered(raw)
  const rawChartHash = documentHashOverrides.rawChartHash || adapterSha256(orderedRaw)
  const rule = deriveAstrologyRuleChart(orderedRaw)
  const orderedRule = ordered(rule)
  const ruleChartHash = documentHashOverrides.ruleChartHash || adapterSha256(orderedRule)
  stages.rule = stage('completed', null, { schemaVersion: orderedRule.schemaVersion, sourceRefs: ['rawChart.bodies[*]', 'rawChart.angles.*'] })
  const provenance = { rawChartSha256: rawChartHash, ruleChartSha256: ruleChartHash, sourceRefs: ['input', 'providerBundle', 'runtime', 'timeAngle', 'rawChart', 'ruleChart'] }
  const adapter = createVerifiedAstrologyAdapterContext({ rawChart: orderedRaw, ruleChart: orderedRule, rawChartHash, ruleChartHash, provenance, inputCompleteness: { time: 'complete', location: 'complete', evidence: 'complete' } })
  stages.adapter = adapter.calculationContext ? stage('completed', null, { schemaVersion: adapter.adapterVersion, sourceRefs: ['rawChart', 'ruleChart', 'provenance'] }) : stage('blocked', adapter.status.reason, { schemaVersion: VERIFIED_ASTROLOGY_ADAPTER_VERSION, sourceRefs: ['rawChart', 'ruleChart', 'provenance'] })
  if (!adapter.calculationContext) return { ...fail(stages.adapter.reason, stages), providerBundleCanonicalSha256: bundleHash, rawChartHash, ruleChartHash, runtime: runtimeIdentity(runtime) }

  const readinessInput = {
    assessmentTime,
    input: { civilTime: { ...input.civilTime, utc: input.civilTime.utc || input.civilTime.utcIso }, location: { ...input.location, verificationStatus: input.location.verificationStatus }, dut1: providerEvidence(providerBundle, 'iers-dut1') },
    timeScale: { leapSecond: providerEvidence(providerBundle, 'iers-leap-seconds'), ttMinusUtc: providerEvidence(providerBundle, 'tai-utc'), tdbMinusTt: providerEvidence(providerBundle, 'tdb-minus-tt') },
    ephemeris: { requestedEt: raw.provenance.ephemerisTime.etSeconds, bsp: runtime.kernel, evaluatorSelection: runtime.evaluatorSelection },
    runtime: { runner: runtime.runner },
    documents: { raw: { schemaVersion: EXPECTED_RAW_SCHEMA, schemaHashStatus: 'verified' }, rule: { schemaVersion: EXPECTED_RULE_SCHEMA, schemaHashStatus: 'verified' }, adapter: { schemaVersion: VERIFIED_ASTROLOGY_ADAPTER_VERSION, schemaHashStatus: 'verified' }, evaluatorSelectionStatus: 'verified' },
    contamination,
  }
  const readiness = assessVerifiedAstrologyReadiness(readinessInput)
  stages.readiness = stage(readiness.readiness === 'ready' ? 'completed' : 'blocked', readiness.reasonCodes[0] || null, { schemaVersion: VERIFIED_ASTROLOGY_READINESS_SCHEMA, reasonCodes: readiness.reasonCodes, sourceRefs: readiness.sourceRefs })
  if (readiness.readiness !== 'ready' || !assertActivationBoundary(readiness)) return { ...fail(readiness.reasonCodes[0] || 'readiness_blocked', stages), providerBundleCanonicalSha256: bundleHash, rawChartHash, ruleChartHash, runtime: runtimeIdentity(runtime), readiness }
  return {
    schemaVersion: LOCAL_ORCHESTRATION_SCHEMA,
    orchestrationVersion: LOCAL_ORCHESTRATION_VERSION,
    status: 'completed',
    stages,
    schemaIdentities: { raw: EXPECTED_RAW_SCHEMA, rule: EXPECTED_RULE_SCHEMA, adapter: VERIFIED_ASTROLOGY_ADAPTER_VERSION, readiness: VERIFIED_ASTROLOGY_READINESS_SCHEMA },
    providerBundleCanonicalSha256: bundleHash,
    runtime: runtimeIdentity(runtime),
    rawChartHash,
    ruleChartHash,
    verifiedDocuments: {
      rawChart: orderedRaw,
      ruleChart: orderedRule,
      adapter,
    },
    adapter: { schemaVersion: adapter.adapterVersion, status: adapter.status },
    readiness,
    sourceRefs: [...new Set(['input', 'providerBundle', 'runtime', 'timeAngle', 'rawChart', 'ruleChart', 'adapter', 'readiness', ...readiness.sourceRefs])].sort(),
    blockedReasons: ['activation_requires_user_approval'],
    activation: ACTIVATION,
  }
}
