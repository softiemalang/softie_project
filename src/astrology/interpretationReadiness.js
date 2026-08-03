import { createHash } from 'node:crypto'
import {
  INTERPRETATION_CONTEXT_ACTIVATION,
  INTERPRETATION_CONTEXT_SCHEMA,
  INTERPRETATION_CONTEXT_VERSION,
  interpretationContextContentSha256,
} from './interpretationConsumer.js'
import {
  INTERPRETATION_PACKET_SCHEMA,
  INTERPRETATION_PACKET_VERSION,
  packetContentSha256,
} from './interpretationPacket.js'
import { INTERPRETATION_CLAIM_VOCABULARY } from './interpretationClaimVocabulary.js'

export const ASTROLOGY_INTERPRETATION_READINESS_SCHEMA = 'astrology-interpretation-readiness-v1'
export const ASTROLOGY_INTERPRETATION_READINESS_VERSION = '1.0.0'
export const READINESS_CONTENT_HASH_FIELD = 'readinessContentSha256'

export const READINESS_REASON_CODES = Object.freeze([
  'context_missing_or_not_object', 'context_schema_or_version_mismatch',
  'context_not_complete', 'context_content_hash_missing_or_mismatch',
  'packet_missing_or_not_object', 'packet_schema_or_version_mismatch',
  'packet_content_hash_missing_or_mismatch', 'packet_context_hash_link_invalid',
  'provenance_or_source_refs_invalid', 'claim_count_invalid',
  'claim_vocabulary_invalid', 'claim_epistemic_boundary_invalid',
  'unsupported_or_forbidden_claim_present', 'calculation_contamination',
  'activation_boundary_mismatch', 'consumer_boundary_promoted',
  'user_delivery_not_authorized', 'production_activation_not_authorized',
  'human_review_required',
])

const HASH = /^[a-f0-9]{64}$/
const ACTIVATION_BLOCK_REASON = 'interpretation_packet_not_activated'
const ALLOWED = new Set(INTERPRETATION_CLAIM_VOCABULARY.allowed.map(item => item.claimType))
const FORBIDDEN = new Set(INTERPRETATION_CLAIM_VOCABULARY.forbidden.map(item => item.claimType))

const ordered = value => {
  if (Array.isArray(value)) return value.map(ordered)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]))
}

export const canonicalAstrologyInterpretationReadinessJson = value => `${JSON.stringify(ordered(value))}\n`
export const astrologyInterpretationReadinessContentSha256 = value => {
  const copy = structuredClone(value)
  if (copy && typeof copy === 'object') delete copy[READINESS_CONTENT_HASH_FIELD]
  return createHash('sha256').update(canonicalAstrologyInterpretationReadinessJson(copy)).digest('hex')
}

const isObject = value => value && typeof value === 'object' && !Array.isArray(value)
const walkClaims = (value, result = []) => {
  if (!value || typeof value !== 'object') return result
  if (Object.prototype.hasOwnProperty.call(value, 'claimType') && Object.prototype.hasOwnProperty.call(value, 'value')) result.push(value)
  for (const child of Object.values(value)) walkClaims(child, result)
  return result
}
const uniqueSorted = values => [...new Set(values)].sort()
const exactActivation = value => Object.keys(INTERPRETATION_CONTEXT_ACTIVATION).every(key => value?.[key] === INTERPRETATION_CONTEXT_ACTIVATION[key])
const pass = id => ({ id, status: 'passed', reasonCodes: [] })
const fail = (id, ...reasons) => ({ id, status: 'failed', reasonCodes: uniqueSorted(reasons) })

function evaluateChecks({ context, packet }) {
  const claims = walkClaims(context)
  const checks = []
  checks.push(!isObject(context) ? fail('context_schema', 'context_missing_or_not_object') : context.schemaVersion !== INTERPRETATION_CONTEXT_SCHEMA || context.contextVersion !== INTERPRETATION_CONTEXT_VERSION ? fail('context_schema', 'context_schema_or_version_mismatch') : pass('context_schema'))
  checks.push(!isObject(context) || context.contextStatus !== 'complete' || context.usable !== false ? fail('context_status', 'context_not_complete') : pass('context_status'))
  checks.push(!isObject(context) || !HASH.test(context.contextContentSha256 || '') || interpretationContextContentSha256(context) !== context.contextContentSha256 ? fail('context_content_hash', 'context_content_hash_missing_or_mismatch') : pass('context_content_hash'))
  const packetLinkOk = isObject(context?.sourcePacket) && context.sourcePacket.packetContentSha256 === packet?.packetContentSha256 && context.provenance?.sourceIdentities?.rawChartSha256 === packet?.identities?.rawChartSha256 && context.provenance?.sourceIdentities?.ruleChartSha256 === packet?.identities?.ruleChartSha256
  checks.push(!isObject(packet) ? fail('packet_identity', 'packet_missing_or_not_object') : packet.schemaVersion !== INTERPRETATION_PACKET_SCHEMA || packet.packetVersion !== INTERPRETATION_PACKET_VERSION ? fail('packet_identity', 'packet_schema_or_version_mismatch') : !HASH.test(packet.packetContentSha256 || '') || packetContentSha256(packet) !== packet.packetContentSha256 ? fail('packet_identity', 'packet_content_hash_missing_or_mismatch') : !packetLinkOk ? fail('packet_identity', 'packet_context_hash_link_invalid') : pass('packet_identity'))
  const provenanceOk = isObject(context) && Array.isArray(context.provenance?.sourceRefs) && context.provenance.sourceRefs.length > 0 && context.provenance.sourceIdentities?.rawChartSha256 === context.provenance.sourceDocuments?.rawChartHash && context.provenance.sourceIdentities?.ruleChartSha256 === context.provenance.sourceDocuments?.ruleChartHash && claims.every(claim => Array.isArray(claim.sourceRefs) && claim.sourceRefs.length > 0 && claim.sourceRefs.every(ref => context.provenance.sourceRefs.includes(ref)))
  checks.push(provenanceOk ? pass('provenance_source_refs') : fail('provenance_source_refs', 'provenance_or_source_refs_invalid'))
  const counts = { total: claims.length, observedOrCalculated: claims.filter(claim => claim.epistemic === 'observed_or_calculated').length, deterministicallyDerived: claims.filter(claim => claim.epistemic === 'deterministically_derived').length }
  checks.push(counts.total === 53 && counts.observedOrCalculated === 20 && counts.deterministicallyDerived === 33 ? pass('claim_counts') : fail('claim_counts', 'claim_count_invalid'))
  const vocabularyOk = isObject(context) && JSON.stringify(context.claimVocabulary) === JSON.stringify(INTERPRETATION_CLAIM_VOCABULARY) && claims.every(claim => ALLOWED.has(claim.claimType) && !FORBIDDEN.has(claim.claimType))
  checks.push(vocabularyOk ? pass('claim_vocabulary') : fail('claim_vocabulary', claims.some(claim => FORBIDDEN.has(claim.claimType)) ? 'unsupported_or_forbidden_claim_present' : 'claim_vocabulary_invalid'))
  const epistemicOk = claims.every(claim => (claim.epistemic === 'observed_or_calculated' || claim.epistemic === 'deterministically_derived') && ((claim.epistemic === 'observed_or_calculated' && (claim.claimType === 'body.longitude' || claim.claimType === 'body.moving_frame_motion')) || claim.epistemic === 'deterministically_derived')) && context?.epistemicClassification?.observedOrCalculated === 'observed_or_calculated' && context?.epistemicClassification?.ruleCoreDerived === 'deterministically_derived'
  checks.push(epistemicOk ? pass('epistemic_boundary') : fail('epistemic_boundary', 'claim_epistemic_boundary_invalid'))
  const serialized = JSON.stringify({ context, packet })
  const contaminationOk = context?.ruleCoreDerived?.wholeSignHouses?.value?.houseSystem === 'whole_sign' && context?.provenance?.sourceIdentities?.evaluator?.evaluator === 'de405-canonical-v2' && !['simulation', 'placidus', 'frozenSpeed', 'legacyPrep', 'frozenFrameSpeed'].some(key => Object.prototype.hasOwnProperty.call(context || {}, key) || Object.prototype.hasOwnProperty.call(packet || {}, key)) && !serialized.includes('simulationValue')
  checks.push(contaminationOk ? pass('calculation_contamination') : fail('calculation_contamination', 'calculation_contamination'))
  checks.push(isObject(context) && exactActivation(context.activation) && context.availableForInterpretation === false && context.integrationStatus === 'not_connected' && context.serviceEligibility === 'blocked' && context.reason === ACTIVATION_BLOCK_REASON && context.epistemicClassification?.activation === 'blocked' ? pass('activation_boundary') : fail('activation_boundary', 'activation_boundary_mismatch'))
  const consumerOk = Object.values(context?.consumer || {}).every(value => value === false)
  checks.push(consumerOk ? pass('consumer_boundary') : fail('consumer_boundary', 'consumer_boundary_promoted'))
  return { checks, claims, counts }
}

export function evaluateAstrologyInterpretationReadiness(input = {}) {
  const { checks, claims, counts } = evaluateChecks(input)
  const failedReasons = uniqueSorted([...checks.flatMap(check => check.reasonCodes), ...(input.context?.contextStatus === 'blocked' ? (input.context.blockedReasons || []) : [])])
  const localEligible = failedReasons.length === 0
  const blockedReasons = uniqueSorted([...failedReasons, 'user_delivery_not_authorized', 'production_activation_not_authorized', 'human_review_required'])
  const result = {
    schemaVersion: ASTROLOGY_INTERPRETATION_READINESS_SCHEMA,
    readinessVersion: ASTROLOGY_INTERPRETATION_READINESS_VERSION,
    readinessStatus: localEligible ? 'complete' : 'blocked',
    input: { contextSchemaVersion: input.context?.schemaVersion || null, contextVersion: input.context?.contextVersion || null, contextContentSha256: input.context?.contextContentSha256 || null, packetSchemaVersion: input.packet?.schemaVersion || null, packetVersion: input.packet?.packetVersion || null, packetContentSha256: input.packet?.packetContentSha256 || null },
    claimCounts: counts,
    checks,
    decisions: {
      localInterpretationResearch: localEligible ? 'eligible_for_local_interpretation_research' : 'not_eligible_for_local_interpretation',
      userDelivery: 'not_eligible_for_user_delivery',
      productionActivation: 'production_activation_blocked',
      humanReview: 'human_review_required',
    },
    satisfiedConditions: checks.filter(check => check.status === 'passed').map(check => check.id),
    blockedReasons,
    connected: false,
    activation: { ...INTERPRETATION_CONTEXT_ACTIVATION },
    consumerBoundary: { externalLlm: false, userDelivery: false, ui: false, production: false, database: false },
    hashScopes: { packetContentSha256: 'packet object excluding packetContentSha256, recursively sorted object keys, arrays preserved, JSON plus LF', contextContentSha256: 'context object excluding contextContentSha256, recursively sorted object keys, arrays preserved, JSON plus LF', readinessContentSha256: 'readiness object excluding readinessContentSha256, recursively sorted object keys, arrays preserved, JSON plus LF', artifactByteSha256: 'exact UTF-8 bytes of materialized evidence JSON, including formatting and final LF' },
  }
  return { ...result, [READINESS_CONTENT_HASH_FIELD]: astrologyInterpretationReadinessContentSha256(result) }
}

export function assertAstrologyInterpretationReadiness(readiness) {
  if (!isObject(readiness) || readiness.schemaVersion !== ASTROLOGY_INTERPRETATION_READINESS_SCHEMA) throw new Error('astrology interpretation readiness schema mismatch')
  if (readiness.readinessContentSha256 !== astrologyInterpretationReadinessContentSha256(readiness)) throw new Error('astrology interpretation readiness content hash mismatch')
  if (readiness.activation.availableForInterpretation !== false || readiness.activation.integrationStatus !== 'not_connected' || readiness.activation.serviceEligibility !== 'blocked') throw new Error('astrology interpretation readiness activation promoted')
  return true
}
