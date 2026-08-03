import { createHash } from 'node:crypto'

export const VERIFIED_ASTROLOGY_READINESS_SCHEMA = 'verified-astrology-readiness-v1'
export const READINESS_AREAS = ['input', 'timeScale', 'ephemeris', 'runtime', 'documents', 'contamination']
export const READINESS_STATUSES = ['ready', 'blocked', 'unsupported']

export const READINESS_REASON_CODES = Object.freeze([
  'civil_time_ambiguous', 'civil_time_nonexistent', 'timezone_unverified', 'location_unverified',
  'dut1_missing', 'dut1_stale', 'dut1_out_of_range', 'leap_second_provenance_missing',
  'leap_second_time_mismatch', 'tt_minus_utc_provenance_missing', 'tt_minus_utc_time_mismatch',
  'tdb_minus_tt_missing', 'tdb_minus_tt_model_nondeterministic', 'bsp_missing', 'bsp_hash_mismatch',
  'bsp_coverage_outside', 'runner_missing', 'runner_unexecutable', 'runner_protocol_mismatch',
  'runner_identity_mismatch', 'evaluator_selection_unverified', 'raw_schema_hash_mismatch',
  'rule_schema_hash_mismatch', 'adapter_schema_hash_mismatch', 'simulation_contamination',
  'placidus_contamination', 'frozen_speed_contamination', 'consumer_connection_detected',
  'activation_requires_user_approval', 'evidence_shape_invalid', 'provider_unverified',
  'provider_stale', 'provider_future_effective', 'provider_range_missing',
])

const REASON_SET = new Set(READINESS_REASON_CODES)
const ACTIVATION_BOUNDARY = Object.freeze({
  availableForInterpretation: false,
  integrationStatus: 'not_connected',
  serviceEligibility: 'blocked',
  reason: 'activation_requires_user_approval',
})

export function canonicalSha256(value) {
  return createHash('sha256').update(`${JSON.stringify(value)}\n`).digest('hex')
}

function result(status, reasons, details = {}) {
  return { status, reasons: [...new Set(reasons)], ...details }
}

function providerValid(evidence, now) {
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) return ['evidence_shape_invalid']
  const required = ['provider', 'model', 'version', 'value', 'unit', 'verificationStatus', 'freshnessStatus', 'sourceRefs']
  if (required.some((key) => evidence[key] === undefined || evidence[key] === null)) return ['evidence_shape_invalid']
  if (!Array.isArray(evidence.sourceRefs) || evidence.sourceRefs.length === 0 || evidence.sourceRefs.some((ref) => typeof ref !== 'string') || JSON.stringify(evidence.sourceRefs) !== JSON.stringify([...evidence.sourceRefs].sort())) return ['evidence_shape_invalid']
  if (!evidence.source?.identity || !/^[a-f0-9]{64}$/.test(evidence.source.sha256 || '')) return ['evidence_shape_invalid']
  const hasRange = evidence.applicableRange || evidence.effectiveAt || evidence.expiryAt || evidence.observationAt
  if (!hasRange) return ['provider_range_missing']
  if (evidence.verificationStatus !== 'verified') return ['provider_unverified']
  if (evidence.freshnessStatus !== 'fresh') return ['provider_stale']
  if (evidence.effectiveAt && evidence.effectiveAt > now) return ['provider_future_effective']
  if (evidence.expiryAt && evidence.expiryAt <= now) return ['provider_stale']
  return []
}

function rangeContains(range, value) {
  return range && value >= range.start && value <= range.end
}

function assessInput(input = {}, now) {
  const reasons = []
  const civil = input.civilTime
  if (civil?.resolutionStatus === 'ambiguous' || civil?.foldStatus === 'ambiguous') reasons.push('civil_time_ambiguous')
  if (civil?.resolutionStatus === 'nonexistent' || civil?.gapStatus === 'nonexistent') reasons.push('civil_time_nonexistent')
  if (civil?.resolutionStatus !== 'resolved' || !civil?.utc || !civil?.ianaTimeZone) reasons.push('timezone_unverified')
  if (input.location?.verificationStatus !== 'verified') reasons.push('location_unverified')
  const valid = providerValid(input.dut1, now)
  if (valid.includes('evidence_shape_invalid') || !input.dut1) reasons.push('dut1_missing')
  else if (valid.includes('provider_stale')) reasons.push('dut1_stale')
  else if (valid.includes('provider_future_effective')) reasons.push('provider_future_effective')
  else if (valid.length) reasons.push('dut1_out_of_range')
  return result(reasons.length ? 'blocked' : 'ready', reasons, { sourceRefs: ['input.civilTime', 'input.location', 'input.dut1'] })
}

function assessTimeScale(timeScale = {}, now, instant) {
  const reasons = []
  const leap = providerValid(timeScale.leapSecond, now)
  const tt = providerValid(timeScale.ttMinusUtc, now)
  const tdb = providerValid(timeScale.tdbMinusTt, now)
  for (const status of [...leap, ...tt, ...tdb]) {
    if (status === 'provider_stale' || status === 'provider_future_effective') reasons.push(status)
  }
  if (!timeScale.leapSecond || leap.includes('evidence_shape_invalid') || leap.includes('provider_range_missing')) reasons.push('leap_second_provenance_missing')
  if (timeScale.leapSecond?.applicableRange && !rangeContains(timeScale.leapSecond.applicableRange, instant)) reasons.push('leap_second_time_mismatch')
  if (!timeScale.ttMinusUtc || tt.includes('evidence_shape_invalid') || tt.includes('provider_range_missing')) reasons.push('tt_minus_utc_provenance_missing')
  if (timeScale.ttMinusUtc?.applicableRange && !rangeContains(timeScale.ttMinusUtc.applicableRange, instant)) reasons.push('tt_minus_utc_time_mismatch')
  if (!timeScale.tdbMinusTt || tdb.includes('evidence_shape_invalid')) reasons.push('tdb_minus_tt_missing')
  if (timeScale.tdbMinusTt && (timeScale.tdbMinusTt.modelDeterminism !== 'deterministic' || tdb.includes('provider_unverified'))) reasons.push('tdb_minus_tt_model_nondeterministic')
  return result(reasons.length ? 'blocked' : 'ready', reasons, { sourceRefs: ['input.dut1', 'timeScale.leapSecond', 'timeScale.ttMinusUtc', 'timeScale.tdbMinusTt'] })
}

function assessEphemeris(ephemeris = {}, instant) {
  const reasons = []
  if (!ephemeris.bsp) reasons.push('bsp_missing')
  else {
    if (ephemeris.bsp.hashStatus !== 'verified') reasons.push('bsp_hash_mismatch')
    if (!rangeContains(ephemeris.bsp.coverage, ephemeris.requestedEt ?? instant)) reasons.push('bsp_coverage_outside')
  }
  if (ephemeris.evaluatorSelection?.status !== 'verified' || ephemeris.evaluatorSelection?.evaluator !== 'de405-canonical-v2') reasons.push('evaluator_selection_unverified')
  return result(reasons.length ? 'blocked' : 'ready', reasons, { sourceRefs: ['ephemeris.bsp', 'ephemeris.evaluatorSelection'] })
}

function assessRuntime(runtime = {}) {
  const reasons = []
  if (!runtime.runner) reasons.push('runner_missing')
  else {
    if (runtime.runner.executableStatus !== 'executable') reasons.push('runner_unexecutable')
    if (runtime.runner.protocolStatus !== 'verified' || runtime.runner.protocolVersion !== 'de405-canonical-v2-protocol-v1') reasons.push('runner_protocol_mismatch')
    if (runtime.runner.identityStatus !== 'verified') reasons.push('runner_identity_mismatch')
  }
  return result(reasons.length ? 'blocked' : 'ready', reasons, { sourceRefs: ['runtime.runner'] })
}

function assessDocuments(documents = {}) {
  const reasons = []
  for (const [key, label] of [['raw', 'raw_schema_hash_mismatch'], ['rule', 'rule_schema_hash_mismatch'], ['adapter', 'adapter_schema_hash_mismatch']]) {
    if (documents[key]?.schemaHashStatus !== 'verified' || documents[key]?.schemaVersion == null) reasons.push(label)
  }
  if (documents.evaluatorSelectionStatus !== 'verified') reasons.push('evaluator_selection_unverified')
  return result(reasons.length ? 'blocked' : 'ready', reasons, { sourceRefs: ['documents.raw', 'documents.rule', 'documents.adapter'] })
}

function assessContamination(contamination = {}) {
  const reasons = []
  if (contamination.simulation === true) reasons.push('simulation_contamination')
  if (contamination.houseSystem === 'placidus') reasons.push('placidus_contamination')
  if (contamination.speedModel === 'frozen') reasons.push('frozen_speed_contamination')
  if (contamination.connectedConsumers?.length) reasons.push('consumer_connection_detected')
  return result(reasons.length ? 'blocked' : 'ready', reasons, { sourceRefs: ['contamination'] })
}

export function assessVerifiedAstrologyReadiness(input = {}) {
  const now = input.assessmentTime || '2050-01-01T00:00:00.000Z'
  const instant = input.input?.civilTime?.utc || input.instant || now
  const areas = {
    input: assessInput(input.input, now),
    timeScale: assessTimeScale(input.timeScale, now, instant),
    ephemeris: assessEphemeris(input.ephemeris, instant),
    runtime: assessRuntime(input.runtime),
    documents: assessDocuments(input.documents),
    contamination: assessContamination(input.contamination),
  }
  const reasons = READINESS_AREAS.flatMap((area) => areas[area].reasons)
  for (const reason of reasons) if (!REASON_SET.has(reason)) throw new Error(`unregistered readiness reason: ${reason}`)
  const ready = reasons.length === 0
  return {
    schemaVersion: VERIFIED_ASTROLOGY_READINESS_SCHEMA,
    readiness: ready ? 'ready' : 'blocked',
    areas,
    reasonCodes: reasons,
    calculationReady: ready,
    activation: { ...ACTIVATION_BOUNDARY },
    sourceRefs: READINESS_AREAS.flatMap((area) => areas[area].sourceRefs),
  }
}

export function assertActivationBoundary(assessment) {
  const activation = assessment?.activation || {}
  return activation.availableForInterpretation === false && activation.integrationStatus === 'not_connected' && activation.serviceEligibility === 'blocked' && activation.reason === 'activation_requires_user_approval'
}
