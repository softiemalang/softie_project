import { createHash } from 'node:crypto'
import { INTERPRETATION_CLAIM_VOCABULARY, INTERPRETATION_EPISTEMIC_CLASSES } from './interpretationClaimVocabulary.js'

export const INTERPRETATION_PACKET_SCHEMA = 'astrology-interpretation-packet-v1'
export const INTERPRETATION_PACKET_VERSION = '1.0.0'
export const PACKET_BLOCK_REASON = 'interpretation_packet_not_activated'
export const PACKET_CONTENT_HASH_FIELD = 'packetContentSha256'
export const ACTIVATION_BOUNDARY = Object.freeze({ availableForInterpretation: false, integrationStatus: 'not_connected', serviceEligibility: 'blocked', reason: PACKET_BLOCK_REASON })

const ordered = value => {
  if (Array.isArray(value)) return value.map(ordered)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]))
}

export const canonicalPacketJson = value => `${JSON.stringify(ordered(value))}\n`
export const packetContentSha256 = value => {
  const copy = structuredClone(value)
  if (copy && typeof copy === 'object') delete copy[PACKET_CONTENT_HASH_FIELD]
  return createHash('sha256').update(canonicalPacketJson(copy)).digest('hex')
}

const blocked = (reasons, details = {}) => ({
  schemaVersion: INTERPRETATION_PACKET_SCHEMA,
  packetVersion: INTERPRETATION_PACKET_VERSION,
  packetStatus: 'blocked',
  usable: false,
  activation: { ...ACTIVATION_BOUNDARY },
  blockedReasons: [...new Set(reasons)],
  unsupportedFeatures: details.unsupportedFeatures || [],
  blockedFeatures: details.blockedFeatures || [],
  epistemicClassification: { packet: 'blocked' },
  claimVocabulary: INTERPRETATION_CLAIM_VOCABULARY,
})

const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const refs = value => Array.isArray(value) && value.length > 0 && value.every(ref => typeof ref === 'string' && ref.length > 0)
const allRefs = value => value && typeof value === 'object' && Object.keys(value).length > 0 && Object.values(value).every(refs)
const refsOrMap = value => refs(value) || (value && typeof value === 'object' && Object.values(value).every(item => typeof item === 'string' ? item.length > 0 : refs(item)))

function validate({ orchestration, adapter, readiness, rawChart, ruleChart, sourceIdentities }) {
  const reasons = []
  if (orchestration?.schemaVersion !== 'astrology-local-verified-orchestration-v1' || !['completed', 'blocked'].includes(orchestration?.status)) reasons.push('orchestration_schema_or_status_mismatch')
  if (orchestration?.status !== 'completed') reasons.push(...(orchestration?.blockedReasons || ['orchestration_blocked']))
  if (orchestration?.activation?.availableForInterpretation !== false || orchestration?.activation?.integrationStatus !== 'not_connected' || orchestration?.activation?.serviceEligibility !== 'blocked') reasons.push('activation_boundary_missing_or_promoted')
  if (!hash(sourceIdentities?.providerBundleSha256) || sourceIdentities.providerBundleSha256 !== orchestration?.providerBundleCanonicalSha256) reasons.push('provider_hash_mismatch')
  if (!hash(sourceIdentities?.rawChartSha256) || sourceIdentities.rawChartSha256 !== orchestration?.rawChartHash) reasons.push('raw_hash_mismatch')
  if (!hash(sourceIdentities?.ruleChartSha256) || sourceIdentities.ruleChartSha256 !== orchestration?.ruleChartHash) reasons.push('rule_hash_mismatch')
  if (sourceIdentities?.rawChartSha256 !== adapter?.calculationContext?.sourceDocuments?.rawChartHash || sourceIdentities?.ruleChartSha256 !== adapter?.calculationContext?.sourceDocuments?.ruleChartHash) reasons.push('adapter_source_hash_mismatch')
  if (!hash(sourceIdentities?.adapterSha256) || !hash(sourceIdentities?.readinessSha256)) reasons.push('adapter_or_readiness_hash_missing')
  if (hash(sourceIdentities?.adapterSha256) && sourceIdentities.adapterSha256 !== canonicalObjectSha256(adapter?.interpretationPreparationContext)) reasons.push('adapter_hash_mismatch')
  if (hash(sourceIdentities?.readinessSha256) && sourceIdentities.readinessSha256 !== canonicalObjectSha256(readiness)) reasons.push('readiness_hash_mismatch')
  if (!readiness || readiness.calculationReady !== true) reasons.push('readiness_calculation_not_ready')
  if (!adapter?.interpretationPreparationContext || adapter.interpretationPreparationContext.calculationStatus !== 'verified') reasons.push('adapter_context_missing_or_unverified')
  if (!orchestration?.runtime?.bsp?.hash || !orchestration.runtime.runner?.runnerIdentity || !orchestration.runtime.runner?.protocolVersion || !orchestration.runtime.evaluator?.evaluator) reasons.push('provider_kernel_runner_identity_missing')
  if (!rawChart || !ruleChart || !refsOrMap(orchestration.sourceRefs) || !refsOrMap(adapter.interpretationPreparationContext.sourceRefs) || !refs(readiness.sourceRefs) || !allRefs(sourceIdentities?.sourceRefs)) reasons.push('provenance_or_source_refs_incomplete')
  if (sourceIdentities?.contamination === true || ['simulation', 'placidus', 'frozen'].includes(sourceIdentities?.contaminationType)) reasons.push('calculation_contamination')
  if (sourceIdentities?.unsupportedPromotion === true) reasons.push('unsupported_value_promoted')
  if (sourceIdentities?.inputCompleteness !== 'complete') reasons.push('input_completeness_incomplete')
  return [...new Set(reasons)]
}

function canonicalObjectSha256(value) { return createHash('sha256').update(canonicalPacketJson(value)).digest('hex') }

function claim(type, value, sourceRefs, epistemic) {
  return { claimType: type, value, sourceRefs, epistemic }
}

export function buildInterpretationPacket(input = {}) {
  const reasons = validate(input)
  if (reasons.length) return blocked(reasons)
  const { orchestration, adapter, readiness, rawChart, ruleChart, sourceIdentities } = input
  const context = adapter.interpretationPreparationContext
  const bodies = context.verifiedFacts.bodies.map(body => ({
    id: body.id,
    longitudeDegrees: claim('body.longitude', body.longitudeDegrees, [`rawChart.bodies.${body.id}.longitudeDegrees`], 'observed_or_calculated'),
    movingFrameSpeedDegreesPerDay: claim('body.moving_frame_motion', body.movingFrameSpeedDegreesPerDay, [`rawChart.bodies.${body.id}.longitudeSpeedDegreesPerDay`], 'observed_or_calculated'),
    motion: claim('body.moving_frame_motion', body.motion, [`ruleChart.bodies.${body.id}.motionState`], 'deterministically_derived'),
    state: body.state,
  }))
  const packet = {
    schemaVersion: INTERPRETATION_PACKET_SCHEMA,
    packetVersion: INTERPRETATION_PACKET_VERSION,
    packetStatus: 'complete',
    usable: false,
    activation: { ...ACTIVATION_BOUNDARY },
    sourceOrchestration: { schemaVersion: orchestration.schemaVersion, orchestrationVersion: orchestration.orchestrationVersion, status: orchestration.status, candidateId: rawChart.candidateId, providerBundleSha256: orchestration.providerBundleCanonicalSha256, rawChartSha256: orchestration.rawChartHash, ruleChartSha256: orchestration.ruleChartHash },
    identities: { providerBundleSha256: sourceIdentities.providerBundleSha256, rawChartSha256: sourceIdentities.rawChartSha256, ruleChartSha256: sourceIdentities.ruleChartSha256, adapterSha256: sourceIdentities.adapterSha256, readinessSha256: sourceIdentities.readinessSha256, kernel: orchestration.runtime.bsp, runner: orchestration.runtime.runner, evaluator: orchestration.runtime.evaluator },
    chartSystem: context.chartSystem,
    verifiedBodies: bodies,
    verifiedAngles: Object.fromEntries(Object.entries(context.verifiedFacts.angles).map(([id, value]) => [id, claim('angle.placement', value, [`ruleChart.angles.${id}`], 'deterministically_derived')])),
    wholeSignHouses: claim('house.whole_sign_placement', context.verifiedFacts.houses, ['ruleChart.houses'], 'deterministically_derived'),
    majorAspects: context.verifiedFacts.aspects.map(aspect => claim('aspect.major', aspect, [`ruleChart.aspects.${aspect.pointA || aspect.first}.${aspect.pointB || aspect.second}`], 'deterministically_derived')),
    distribution: claim('distribution.elements_modalities_polarity', context.verifiedFacts.distribution, ['ruleChart.distribution'], 'deterministically_derived'),
    chartRulers: claim('chart_ruler', context.verifiedFacts.chartRulers, ['ruleChart.chartRulers'], 'deterministically_derived'),
    inputCompleteness: sourceIdentities.inputCompleteness,
    provenance: { sourceRefs: [...new Set([...orchestration.sourceRefs, ...context.provenance.sourceRefs, ...readiness.sourceRefs, ...Object.values(sourceIdentities.sourceRefs).flat()])].sort(), sourceDocuments: context.sourceDocuments },
    unsupportedFeatures: [{ feature: 'legacy_simulation_placidus_date_seed', status: 'unsupported', sourceRefs: ['compatibility.legacyPrep'] }],
    blockedFeatures: [{ feature: 'interpretation_service_activation', status: 'blocked', reason: PACKET_BLOCK_REASON, sourceRefs: ['activation'] }],
    epistemicClassification: { observedFacts: 'observed_or_calculated', ruleCoreOutputs: 'deterministically_derived', unsupported: 'unsupported', activation: 'blocked' },
    claimVocabulary: INTERPRETATION_CLAIM_VOCABULARY,
  }
  return { ...packet, [PACKET_CONTENT_HASH_FIELD]: packetContentSha256(packet) }
}

export function assertInterpretationPacket(packet) {
  if (!packet || packet.schemaVersion !== INTERPRETATION_PACKET_SCHEMA) throw new Error('interpretation packet schema mismatch')
  if (!INTERPRETATION_EPISTEMIC_CLASSES.includes(packet.epistemicClassification.observedFacts)) throw new Error('interpretation packet epistemic classification invalid')
  if (packet.packetStatus === 'complete' && packet.activation.availableForInterpretation !== false) throw new Error('interpretation packet activation promoted')
  return true
}
