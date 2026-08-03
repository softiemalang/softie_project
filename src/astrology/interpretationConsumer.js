import { createHash } from 'node:crypto'
import {
  INTERPRETATION_CLAIM_VOCABULARY,
  INTERPRETATION_EPISTEMIC_CLASSES,
  isAllowedClaimType,
} from './interpretationClaimVocabulary.js'
import {
  INTERPRETATION_PACKET_SCHEMA,
  INTERPRETATION_PACKET_VERSION,
  packetContentSha256,
} from './interpretationPacket.js'

export const INTERPRETATION_CONTEXT_SCHEMA = 'astrology-interpretation-context-v1'
export const INTERPRETATION_CONTEXT_VERSION = '1.0.0'
export const CONTEXT_CONTENT_HASH_FIELD = 'contextContentSha256'
export const CONTEXT_BLOCK_REASON = 'interpretation_packet_not_activated'

export const INTERPRETATION_CONTEXT_ACTIVATION = Object.freeze({
  availableForInterpretation: false,
  integrationStatus: 'not_connected',
  serviceEligibility: 'blocked',
  reason: CONTEXT_BLOCK_REASON,
})

export const INTERPRETATION_CONTEXT_REASON_CODES = Object.freeze([
  'packet_missing_or_not_object',
  'packet_schema_or_version_mismatch',
  'packet_not_complete',
  'packet_usable_or_activation_boundary_invalid',
  'packet_content_hash_missing_or_mismatch',
  'packet_provenance_mismatch',
  'packet_claim_vocabulary_invalid',
  'claim_shape_invalid',
  'claim_type_not_allowed',
  'claim_epistemic_boundary_invalid',
  'claim_source_refs_missing_or_unresolvable',
  'whole_sign_contract_invalid',
  'calculation_contamination',
  'unsupported_value_promoted',
  'packet_blocked_features_missing',
])

const HASH = /^[a-f0-9]{64}$/
const BODY_IDS = new Set(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'])
const OBSERVED_CLAIMS = new Set(['body.longitude'])
const DERIVED_CLAIMS = new Set(['angle.placement', 'house.whole_sign_placement', 'aspect.major', 'distribution.elements_modalities_polarity', 'chart_ruler'])
const PACKET_PROVENANCE_REFS = value => value === 'rawChart' || value === 'ruleChart' || value === 'goldenEvidence' || /^orchestration\.[a-zA-Z]+$/.test(value) || /^readiness\.[a-zA-Z]+$/.test(value)

const ordered = value => {
  if (Array.isArray(value)) return value.map(ordered)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]))
}

export const canonicalInterpretationContextJson = value => `${JSON.stringify(ordered(value))}\n`

export const interpretationContextContentSha256 = value => {
  const copy = structuredClone(value)
  if (copy && typeof copy === 'object') delete copy[CONTEXT_CONTENT_HASH_FIELD]
  return createHash('sha256').update(canonicalInterpretationContextJson(copy)).digest('hex')
}

const isObject = value => value && typeof value === 'object' && !Array.isArray(value)
const uniqueSorted = values => [...new Set(values)].sort()
const exactActivation = activation => Object.keys(INTERPRETATION_CONTEXT_ACTIVATION).every(key => activation?.[key] === INTERPRETATION_CONTEXT_ACTIVATION[key])
const sourceRef = value => typeof value === 'string' && value.length > 0

function walkClaims(value, result = []) {
  if (!value || typeof value !== 'object') return result
  if (Object.prototype.hasOwnProperty.call(value, 'claimType') && (Object.prototype.hasOwnProperty.call(value, 'value') || Object.prototype.hasOwnProperty.call(value, 'sourceRefs') || Object.prototype.hasOwnProperty.call(value, 'epistemic'))) result.push(value)
  for (const child of Object.values(value)) walkClaims(child, result)
  return result
}

function claimSourceRefMatches(claim, ref) {
  if (!sourceRef(ref)) return false
  if (claim.claimType === 'body.longitude') {
    const expectedRaw = /^rawChart\.bodies\.([a-z_]+)\.longitudeDegrees$/.exec(ref)
    return Boolean(expectedRaw && BODY_IDS.has(expectedRaw[1]))
  }
  if (claim.claimType === 'body.moving_frame_motion') {
    const expectedRaw = /^rawChart\.bodies\.([a-z_]+)\.(longitudeDegrees|longitudeSpeedDegreesPerDay)$/.exec(ref)
    const expectedRule = /^ruleChart\.bodies\.([a-z_]+)\.motionState$/.exec(ref)
    return Boolean((expectedRaw && BODY_IDS.has(expectedRaw[1])) || (expectedRule && BODY_IDS.has(expectedRule[1])))
  }
  if (claim.claimType === 'angle.placement') return /^ruleChart\.angles\.(ascendant|midheaven)$/.test(ref)
  if (claim.claimType === 'house.whole_sign_placement') return ref === 'ruleChart.houses'
  if (claim.claimType === 'aspect.major') return /^ruleChart\.aspects\.[a-z_]+\.[a-z_]+$/.test(ref)
  if (claim.claimType === 'distribution.elements_modalities_polarity') return ref === 'ruleChart.distribution'
  if (claim.claimType === 'chart_ruler') return ref === 'ruleChart.chartRulers'
  return false
}

function validateClaims(packet) {
  const reasons = []
  for (const claim of walkClaims(packet)) {
    if (!isObject(claim) || !Object.prototype.hasOwnProperty.call(claim, 'value') || !Array.isArray(claim.sourceRefs)) {
      reasons.push('claim_shape_invalid')
      continue
    }
    if (!isAllowedClaimType(claim.claimType)) reasons.push('claim_type_not_allowed')
    if (!INTERPRETATION_EPISTEMIC_CLASSES.includes(claim.epistemic)) reasons.push('claim_epistemic_boundary_invalid')
    if (!claim.sourceRefs.length || claim.sourceRefs.some(ref => !claimSourceRefMatches(claim, ref))) reasons.push('claim_source_refs_missing_or_unresolvable')
    if (claim.sourceRefs.some(ref => ref.startsWith('rawChart.') && !packet.provenance.sourceRefs.includes('rawChart'))) reasons.push('claim_source_refs_missing_or_unresolvable')
    if (claim.sourceRefs.some(ref => ref.startsWith('ruleChart.') && !packet.provenance.sourceRefs.includes('ruleChart'))) reasons.push('claim_source_refs_missing_or_unresolvable')
    if (OBSERVED_CLAIMS.has(claim.claimType) && claim.epistemic !== 'observed_or_calculated') reasons.push('claim_epistemic_boundary_invalid')
    if (DERIVED_CLAIMS.has(claim.claimType) && claim.epistemic !== 'deterministically_derived') reasons.push('claim_epistemic_boundary_invalid')
    if (claim.claimType === 'body.moving_frame_motion') {
      const raw = claim.sourceRefs.some(ref => ref.startsWith('rawChart.'))
      const rule = claim.sourceRefs.some(ref => ref.startsWith('ruleChart.'))
      if ((raw && claim.epistemic !== 'observed_or_calculated') || (rule && claim.epistemic !== 'deterministically_derived') || (raw === rule)) reasons.push('claim_epistemic_boundary_invalid')
    }
  }
  return reasons
}

function validatePacket(packet) {
  const reasons = []
  if (!isObject(packet)) return ['packet_missing_or_not_object']
  if (packet.schemaVersion !== INTERPRETATION_PACKET_SCHEMA || packet.packetVersion !== INTERPRETATION_PACKET_VERSION) reasons.push('packet_schema_or_version_mismatch')
  if (packet.packetStatus !== 'complete') reasons.push('packet_not_complete')
  if (packet.usable !== false || !exactActivation(packet.activation)) reasons.push('packet_usable_or_activation_boundary_invalid')
  if (!HASH.test(packet.packetContentSha256 || '') || packetContentSha256(packet) !== packet.packetContentSha256) reasons.push('packet_content_hash_missing_or_mismatch')
  if (!isObject(packet.sourceOrchestration) || packet.sourceOrchestration.schemaVersion !== 'astrology-local-verified-orchestration-v1' || packet.sourceOrchestration.status !== 'completed' || !isObject(packet.identities) || packet.identities.providerBundleSha256 !== packet.sourceOrchestration.providerBundleSha256 || packet.identities.rawChartSha256 !== packet.sourceOrchestration.rawChartSha256 || packet.identities.ruleChartSha256 !== packet.sourceOrchestration.ruleChartSha256 || ![packet.identities.providerBundleSha256, packet.identities.rawChartSha256, packet.identities.ruleChartSha256, packet.identities.adapterSha256, packet.identities.readinessSha256, packet.identities.kernel?.hash].every(value => HASH.test(value || ''))) reasons.push('packet_provenance_mismatch')
  if (!isObject(packet.provenance) || !isObject(packet.provenance.sourceDocuments) || packet.provenance.sourceDocuments.rawChartHash !== packet.identities.rawChartSha256 || packet.provenance.sourceDocuments.ruleChartHash !== packet.identities.ruleChartSha256 || !Array.isArray(packet.provenance.sourceRefs) || !packet.provenance.sourceRefs.length || packet.provenance.sourceRefs.some(ref => !PACKET_PROVENANCE_REFS(ref))) reasons.push('packet_provenance_mismatch')
  if (JSON.stringify(packet.claimVocabulary) !== JSON.stringify(INTERPRETATION_CLAIM_VOCABULARY)) reasons.push('packet_claim_vocabulary_invalid')
  if (packet.wholeSignHouses?.value?.houseSystem !== 'whole_sign') reasons.push('whole_sign_contract_invalid')
  if (packet.simulation === true || packet.speedModel === 'frozen' || packet.houseSystem === 'placidus' || packet.legacyPrep) reasons.push('calculation_contamination')
  if (packet.unsupportedFeatures?.some(item => item?.status !== 'unsupported')) reasons.push('unsupported_value_promoted')
  if (!Array.isArray(packet.blockedFeatures) || !packet.blockedFeatures.some(item => item?.status === 'blocked' && item.reason === CONTEXT_BLOCK_REASON)) reasons.push('packet_blocked_features_missing')
  if (!Array.isArray(packet.verifiedBodies) || packet.verifiedBodies.length === 0 || packet.verifiedBodies.some(body => !isObject(body) || !BODY_IDS.has(body.id) || !isObject(body.longitudeDegrees) || body.longitudeDegrees.claimType !== 'body.longitude' || !isObject(body.movingFrameSpeedDegreesPerDay) || body.movingFrameSpeedDegreesPerDay.claimType !== 'body.moving_frame_motion' || !isObject(body.motion) || body.motion.claimType !== 'body.moving_frame_motion')) reasons.push('claim_shape_invalid')
  if (!isObject(packet.verifiedAngles) || !['ascendant', 'midheaven'].every(id => isObject(packet.verifiedAngles[id]) && packet.verifiedAngles[id].claimType === 'angle.placement')) reasons.push('claim_shape_invalid')
  if (!isObject(packet.wholeSignHouses) || packet.wholeSignHouses.claimType !== 'house.whole_sign_placement' || !Array.isArray(packet.wholeSignHouses.value?.placements)) reasons.push('claim_shape_invalid')
  if (!Array.isArray(packet.majorAspects) || packet.majorAspects.some(claim => !isObject(claim) || claim.claimType !== 'aspect.major' || !isObject(claim.value))) reasons.push('claim_shape_invalid')
  if (!isObject(packet.distribution) || packet.distribution.claimType !== 'distribution.elements_modalities_polarity' || !isObject(packet.chartRulers) || packet.chartRulers.claimType !== 'chart_ruler') reasons.push('claim_shape_invalid')
  if (!isObject(packet.epistemicClassification) || packet.epistemicClassification.observedFacts !== 'observed_or_calculated' || packet.epistemicClassification.ruleCoreOutputs !== 'deterministically_derived' || packet.epistemicClassification.unsupported !== 'unsupported' || packet.epistemicClassification.activation !== 'blocked') reasons.push('claim_epistemic_boundary_invalid')
  reasons.push(...validateClaims(packet))
  return uniqueSorted(reasons)
}

const copy = value => structuredClone(value)

function blockedContext(reasons, packet) {
  const context = {
    schemaVersion: INTERPRETATION_CONTEXT_SCHEMA,
    contextVersion: INTERPRETATION_CONTEXT_VERSION,
    contextStatus: 'blocked',
    usable: false,
    availableForInterpretation: false,
    integrationStatus: 'not_connected',
    serviceEligibility: 'blocked',
    reason: CONTEXT_BLOCK_REASON,
    activation: { ...INTERPRETATION_CONTEXT_ACTIVATION },
    blockedReasons: uniqueSorted(reasons),
    sourcePacket: isObject(packet) ? { schemaVersion: packet.schemaVersion || null, packetVersion: packet.packetVersion || null, packetContentSha256: packet.packetContentSha256 || null } : null,
    epistemicClassification: { context: 'blocked' },
    claimVocabulary: INTERPRETATION_CLAIM_VOCABULARY,
  }
  return { ...context, [CONTEXT_CONTENT_HASH_FIELD]: interpretationContextContentSha256(context) }
}

function normalizeHouseClaim(claim) {
  const value = copy(claim)
  value.value.placements = [...value.value.placements].sort((a, b) => String(a.id).localeCompare(String(b.id)))
  return value
}

function buildCompleteContext(packet) {
  const bodies = [...packet.verifiedBodies].sort((a, b) => String(a.id).localeCompare(String(b.id)))
  const bodyObserved = bodies.map(body => ({ id: body.id, longitudeDegrees: copy(body.longitudeDegrees), movingFrameSpeedDegreesPerDay: copy(body.movingFrameSpeedDegreesPerDay) }))
  const bodyDerived = bodies.map(body => ({ id: body.id, motion: copy(body.motion) }))
  const angles = Object.fromEntries(Object.keys(packet.verifiedAngles).sort().map(id => [id, copy(packet.verifiedAngles[id])]))
  const majorAspects = [...packet.majorAspects].sort((a, b) => String(a.value.id || '').localeCompare(String(b.value.id || '')))
  const sourceRefs = uniqueSorted([...packet.provenance.sourceRefs, ...walkClaims(packet).flatMap(claim => claim.sourceRefs)])
  const context = {
    schemaVersion: INTERPRETATION_CONTEXT_SCHEMA,
    contextVersion: INTERPRETATION_CONTEXT_VERSION,
    contextStatus: 'complete',
    usable: false,
    availableForInterpretation: false,
    integrationStatus: 'not_connected',
    serviceEligibility: 'blocked',
    reason: CONTEXT_BLOCK_REASON,
    activation: { ...INTERPRETATION_CONTEXT_ACTIVATION },
    sourcePacket: {
      schemaVersion: packet.schemaVersion,
      packetVersion: packet.packetVersion,
      packetContentSha256: packet.packetContentSha256,
      candidateId: packet.sourceOrchestration.candidateId,
    },
    observedOrCalculated: { bodies: bodyObserved },
    ruleCoreDerived: {
      bodies: bodyDerived,
      angles,
      wholeSignHouses: normalizeHouseClaim(packet.wholeSignHouses),
      majorAspects,
      distribution: copy(packet.distribution),
      chartRulers: copy(packet.chartRulers),
    },
    unsupported: copy(packet.unsupportedFeatures),
    blocked: copy(packet.blockedFeatures),
    epistemicClassification: {
      observedOrCalculated: 'observed_or_calculated',
      ruleCoreDerived: 'deterministically_derived',
      unsupported: 'unsupported',
      activation: 'blocked',
    },
    provenance: {
      sourceIdentities: copy(packet.identities),
      sourceDocuments: copy(packet.provenance.sourceDocuments),
      sourceRefs,
    },
    hashScopes: {
      packetContentSha256: 'input packet object excluding packetContentSha256, recursively sorted object keys, arrays preserved, JSON plus LF',
      contextContentSha256: 'context object excluding contextContentSha256, recursively sorted object keys, arrays preserved, JSON plus LF',
      artifactByteSha256: 'exact UTF-8 bytes of the materialized evidence JSON, including formatting and final LF; calculated outside this context',
    },
    consumer: {
      externalLlm: false,
      naturalLanguageGeneration: false,
      psychologicalAssessment: false,
      prediction: false,
      advice: false,
      scoring: false,
      productionConnection: false,
    },
    claimVocabulary: INTERPRETATION_CLAIM_VOCABULARY,
  }
  return { ...context, [CONTEXT_CONTENT_HASH_FIELD]: interpretationContextContentSha256(context) }
}

export function buildAstrologyInterpretationContext(packet = {}) {
  const reasons = validatePacket(packet)
  if (reasons.length) return blockedContext(reasons, packet)
  return buildCompleteContext(packet)
}

export function assertAstrologyInterpretationContext(context) {
  if (!isObject(context) || context.schemaVersion !== INTERPRETATION_CONTEXT_SCHEMA) throw new Error('interpretation context schema mismatch')
  if (context.contextStatus === 'complete' && context.usable !== false) throw new Error('interpretation context activation promoted')
  if (!HASH.test(context.contextContentSha256 || '') || interpretationContextContentSha256(context) !== context.contextContentSha256) throw new Error('interpretation context content hash mismatch')
  return true
}
