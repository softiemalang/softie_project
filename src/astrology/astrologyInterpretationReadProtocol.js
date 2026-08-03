import { createHash } from 'node:crypto'
import {
  ASTROLOGY_INTERPRETATION_HANDOFF_SCHEMA,
  ASTROLOGY_INTERPRETATION_HANDOFF_VERSION,
  HANDOFF_ACTIVATION,
  HANDOFF_RELATION_VOCABULARY,
  HANDOFF_ALLOWED_FIELDS,
  HANDOFF_FORBIDDEN_USAGES,
  astrologyInterpretationHandoffContentSha256,
  componentSpec,
} from './astrologyInterpretationHandoff.js'
import { packetContentSha256, INTERPRETATION_PACKET_SCHEMA, INTERPRETATION_PACKET_VERSION } from './interpretationPacket.js'
import { interpretationContextContentSha256, INTERPRETATION_CONTEXT_SCHEMA, INTERPRETATION_CONTEXT_VERSION } from './interpretationConsumer.js'
import { astrologyInterpretationReadinessContentSha256, ASTROLOGY_INTERPRETATION_READINESS_SCHEMA, ASTROLOGY_INTERPRETATION_READINESS_VERSION } from './interpretationReadiness.js'
import { astrologyClaimRelationGraphContentSha256, ASTROLOGY_CLAIM_RELATION_GRAPH_SCHEMA, ASTROLOGY_CLAIM_RELATION_GRAPH_VERSION } from './astrologyClaimRelationGraph.js'

export const ASTROLOGY_INTERPRETATION_READ_PROTOCOL_SCHEMA = 'astrology-interpretation-read-protocol-v1'
export const ASTROLOGY_INTERPRETATION_READ_PROTOCOL_VERSION = '1.0.0'
export const READ_PROTOCOL_CONTENT_HASH_FIELD = 'protocolContentSha256'
export const READ_PROTOCOL_STATUS = Object.freeze({ complete: 'complete', blocked: 'blocked' })
export const READ_PROTOCOL_DECISIONS = Object.freeze({ localResearch: 'eligible_for_local_interpretation_research', userDelivery: 'blocked', productionActivation: 'blocked', humanReview: 'required' })

export const READ_PROTOCOL_STEPS = Object.freeze([
  'freeze_manifest_identity', 'handoff_identity', 'component_artifact_identity',
  'component_content_identity', 'cross_hash_links', 'component_boundaries',
  'claim_inventory', 'provenance_source_refs', 'graph_structural_relations',
  'eligibility_activation', 'access_policy', 'human_review_boundary',
])
export const READ_PROTOCOL_REQUIREMENTS = Object.freeze(READ_PROTOCOL_STEPS.map((step, index) => Object.freeze({ order: index + 1, step, required: true, onFailure: 'stop_and_block' })))
export const READ_PROTOCOL_REASON_CODES = Object.freeze([
  'freeze_manifest_schema_or_version_mismatch', 'freeze_manifest_content_hash_mismatch', 'freeze_component_identity_mismatch',
  'handoff_evidence_schema_or_version_mismatch', 'handoff_schema_or_version_mismatch', 'handoff_content_hash_mismatch',
  'component_artifact_hash_mismatch', 'component_schema_or_version_mismatch', 'component_content_hash_mismatch',
  'cross_hash_link_invalid', 'component_boundary_invalid', 'claim_inventory_invalid', 'claim_epistemic_statistics_invalid',
  'claim_source_refs_missing_or_unresolvable', 'provenance_incomplete', 'relation_vocabulary_invalid',
  'relation_semantics_transformed', 'access_policy_violation', 'calculation_contamination',
  'eligibility_or_activation_boundary_invalid', 'user_delivery_or_production_promoted', 'human_review_missing',
])

export const READ_PROTOCOL_ACCESS_POLICY = Object.freeze({
  allowedTopLevel: Object.freeze(['schemaVersion', 'handoffVersion', 'bundleStatus', 'usable', 'activation', 'connected', 'components', 'crossHashLinks', 'statistics', 'relationVocabulary', 'provenance', 'eligibility', 'deliveryPolicy', 'hashScopes', 'bundleContentSha256']),
  allowedComponentData: Object.freeze(['schema/version/hash identity', 'status and boundary booleans', 'claimType/value/epistemic/sourceRefs', 'structural relation vocabulary and evidence', 'provenance/source documents']),
  forbiddenKeys: Object.freeze(['theme', 'narrative', 'personality', 'psychology', 'strength', 'weakness', 'wound', 'desire', 'risk', 'destiny', 'meaningWeight', 'meaning_weight', 'priority', 'ranking', 'rank', 'prompt', 'template', 'systemMessage', 'question', 'advice', 'synthesis', 'conflict', 'dominance', 'balance', 'winner', 'score']),
  forbiddenOperations: Object.freeze([...HANDOFF_FORBIDDEN_USAGES, 'convert_orb_phase_motion_or_rule_identity_to_life_importance']),
  relationSemantics: 'structural_co-occurrence_only',
})

const HASH = /^[a-f0-9]{64}$/
const isObject = value => value && typeof value === 'object' && !Array.isArray(value)
const ordered = value => Array.isArray(value) ? value.map(ordered) : (!value || typeof value !== 'object' ? value : Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])])))
const hashBytes = bytes => createHash('sha256').update(bytes).digest('hex')
const hashObject = value => hashBytes(`${JSON.stringify(ordered(value))}\n`)
const uniqueSorted = values => [...new Set(values)].sort()
const fail = (codes, code) => { if (!codes.includes(code)) codes.push(code) }
const activationOk = value => JSON.stringify(value) === JSON.stringify(HANDOFF_ACTIVATION)
const contentHashers = { packet: packetContentSha256, context: interpretationContextContentSha256, readiness: astrologyInterpretationReadinessContentSha256, graph: astrologyClaimRelationGraphContentSha256, handoff: astrologyInterpretationHandoffContentSha256 }
const pathsFor = value => value.split('/').filter(Boolean).join('.')
const walkClaims = (value, path = '', result = []) => {
  if (!value || typeof value !== 'object') return result
  if (Object.prototype.hasOwnProperty.call(value, 'claimType') && Object.prototype.hasOwnProperty.call(value, 'value')) result.push({ claim: value, path: pathsFor(path) })
  for (const [key, child] of Object.entries(value)) walkClaims(child, `${path}/${key}`, result)
  return result
}
const walkKeys = (value, result = []) => {
  if (!value || typeof value !== 'object') return result
  for (const [key, child] of Object.entries(value)) { result.push(key); walkKeys(child, result) }
  return result
}
const componentValue = (components, role) => components?.[role]?.[componentSpec[role].innerKey]

export const canonicalAstrologyInterpretationReadProtocolJson = value => `${JSON.stringify(ordered(value))}\n`
export const astrologyInterpretationReadProtocolContentSha256 = value => {
  const copy = structuredClone(value); delete copy[READ_PROTOCOL_CONTENT_HASH_FIELD]
  return hashObject(copy)
}

function checkFreezeManifest(manifest, manifestBytes, components, artifactBytes, handoff) {
  const reasons = []
  if (!isObject(manifest) || manifest.schemaVersion !== 'astrology-interpretation-base-freeze-manifest-v1' || manifest.manifestVersion !== '1.0.0' || manifest.baselineStatus !== 'audited_and_frozen_uncommitted') fail(reasons, 'freeze_manifest_schema_or_version_mismatch')
  if (!HASH.test(manifest?.manifestContentSha256 || '') || hashObject({ ...manifest, manifestContentSha256: undefined }) !== manifest?.manifestContentSha256) fail(reasons, 'freeze_manifest_content_hash_mismatch')
  for (const role of ['packet', 'context', 'readiness', 'graph', 'handoff']) {
    const entry = manifest?.components?.[role]
    const value = role === 'handoff' ? handoff : componentValue(components, role)
    const bytes = role === 'handoff' ? artifactBytes.handoff : artifactBytes[role]
    const contentHash = value && contentHashers[role](value)
    if (!entry || !value || !bytes || entry.artifactByteSha256 !== hashBytes(bytes) || entry.contentSha256 !== contentHash || entry.schemaVersion !== value.schemaVersion || entry.version !== value[`${role}Version`]) fail(reasons, 'freeze_component_identity_mismatch')
  }
  return reasons
}

export function evaluateAstrologyInterpretationReadProtocol({ freezeManifest, freezeManifestBytes, handoffEvidence, handoffEvidenceBytes, components = {}, artifactBytes = {} } = {}) {
  const reasons = []
  const checks = []
  const check = (id, ok, ...codes) => { const reasonCodes = ok ? [] : uniqueSorted(codes); reasonCodes.forEach(code => fail(reasons, code)); checks.push({ id, status: ok ? 'passed' : 'failed', reasonCodes }) }
  const handoff = handoffEvidence?.bundle || handoffEvidence
  const handoffEvidenceOk = isObject(handoffEvidence) && handoffEvidence.schemaVersion === 'astrology-interpretation-handoff-evidence-v1'
  check('freeze_manifest_identity', isObject(freezeManifest) && freezeManifestBytes && isObject(handoff) && handoffEvidenceBytes && checkFreezeManifest(freezeManifest, freezeManifestBytes, components, { ...artifactBytes, handoff: handoffEvidenceBytes }, handoff).length === 0, 'freeze_manifest_schema_or_version_mismatch', 'freeze_manifest_content_hash_mismatch', 'freeze_component_identity_mismatch')
  check('handoff_identity', handoffEvidenceOk && isObject(handoff) && handoff.schemaVersion === ASTROLOGY_INTERPRETATION_HANDOFF_SCHEMA && handoff.handoffVersion === ASTROLOGY_INTERPRETATION_HANDOFF_VERSION, 'handoff_evidence_schema_or_version_mismatch', 'handoff_schema_or_version_mismatch')
  check('handoff_content_hash', isObject(handoff) && HASH.test(handoff.bundleContentSha256 || '') && astrologyInterpretationHandoffContentSha256(handoff) === handoff.bundleContentSha256, 'handoff_content_hash_mismatch')
  for (const role of Object.keys(componentSpec)) {
    const spec = componentSpec[role]; const entry = handoff?.components?.[role]; const value = componentValue(components, role); const bytes = artifactBytes[role]
    check(`component_${role}_artifact_identity`, isObject(entry) && HASH.test(entry.artifact?.artifactByteSha256 || '') && bytes && hashBytes(bytes) === entry.artifact.artifactByteSha256, 'component_artifact_hash_mismatch')
    check(`component_${role}_content_identity`, isObject(value) && value.schemaVersion === spec.schema && value[spec.versionKey] === '1.0.0' && entry?.artifact?.wrapperSchemaVersion === spec.wrapper && entry?.content?.schemaVersion === spec.schema && entry?.content?.version === value[spec.versionKey] && HASH.test(value[spec.contentKey] || '') && value[spec.contentKey] === entry.content.contentSha256 && contentHashers[role](value) === value[spec.contentKey], 'component_schema_or_version_mismatch', 'component_content_hash_mismatch')
  }
  check('cross_hash_links', handoff?.crossHashLinks?.contextFromPacket === componentValue(components, 'context')?.sourcePacket?.packetContentSha256 && handoff?.crossHashLinks?.readinessFromPacket === componentValue(components, 'readiness')?.input?.packetContentSha256 && handoff?.crossHashLinks?.graphFromContext === componentValue(components, 'graph')?.input?.contextContentSha256 && handoff?.crossHashLinks?.graphFromReadiness === componentValue(components, 'graph')?.input?.readinessContentSha256, 'cross_hash_link_invalid')
  const packet = componentValue(components, 'packet'); const context = componentValue(components, 'context'); const readiness = componentValue(components, 'readiness'); const graph = componentValue(components, 'graph')
  check('component_boundaries', packet?.usable === false && context?.usable === false && readiness?.readinessStatus === 'complete' && graph?.usable === false && graph?.connected === false, 'component_boundary_invalid')
  const claims = walkClaims(context); const expectedStats = { total: 53, observedOrCalculated: 20, deterministicallyDerived: 33 }
  const stats = { total: claims.length, observedOrCalculated: claims.filter(item => item.claim.epistemic === 'observed_or_calculated').length, deterministicallyDerived: claims.filter(item => item.claim.epistemic === 'deterministically_derived').length }
  const nodeIds = graph?.nodes?.map(node => node.nodeId) || []; const claimPaths = graph?.nodes?.map(node => pathsFor(node.claimPath)) || []
  const graphClaimsOk = claims.length === 53 && graph?.nodes?.length === 53 && new Set(nodeIds).size === 53 && new Set(claimPaths).size === 53 && graph.nodes.every(node => { const item = claims.find(candidate => candidate.path === pathsFor(node.claimPath)); return item && node.claimType === item.claim.claimType && node.epistemic === item.claim.epistemic && JSON.stringify(node.value) === JSON.stringify(item.claim.value) && JSON.stringify(node.sourceRefs) === JSON.stringify([...item.claim.sourceRefs].sort()) })
  check('claim_inventory', graphClaimsOk && JSON.stringify(stats) === JSON.stringify(expectedStats) && JSON.stringify(handoff?.statistics?.claims) === JSON.stringify(expectedStats), 'claim_inventory_invalid', 'claim_epistemic_statistics_invalid')
  const sourceRefs = context?.provenance?.sourceRefs; const refsOk = Array.isArray(sourceRefs) && sourceRefs.length > 0 && claims.every(item => Array.isArray(item.claim.sourceRefs) && item.claim.sourceRefs.length > 0 && item.claim.sourceRefs.every(ref => sourceRefs.includes(ref))) && graph?.nodes?.every(node => node.sourceRefs?.every(ref => sourceRefs.includes(ref))) && graph?.edges?.every(edge => edge.evidence?.sourceRefs?.every(ref => sourceRefs.includes(ref)))
  check('provenance_source_refs', refsOk && handoff?.provenance?.sourceRefsCompleteness === 'complete', 'claim_source_refs_missing_or_unresolvable', 'provenance_incomplete')
  const relationOk = JSON.stringify(handoff?.relationVocabulary) === JSON.stringify(HANDOFF_RELATION_VOCABULARY) && JSON.stringify(graph?.relationVocabulary) === JSON.stringify(HANDOFF_RELATION_VOCABULARY) && graph?.edges?.length === 1753 && graph.edges.every(edge => HANDOFF_RELATION_VOCABULARY.includes(edge.relation) && edge.evidence?.basis && !['support', 'conflict', 'dominance', 'meaning', 'priority'].some(token => JSON.stringify(edge).toLowerCase().includes(token)))
  check('graph_structural_relations', relationOk, 'relation_vocabulary_invalid', 'relation_semantics_transformed')
  const boundaryOk = JSON.stringify(handoff?.activation) === JSON.stringify(HANDOFF_ACTIVATION) && handoff?.connected === false && handoff?.eligibility?.localResearch === READ_PROTOCOL_DECISIONS.localResearch && handoff?.eligibility?.userDelivery === 'not_eligible_for_user_delivery' && handoff?.eligibility?.production === 'production_activation_blocked' && handoff?.eligibility?.humanReview === 'human_review_required' && handoff?.eligibility?.activation === 'blocked'
  check('eligibility_activation', boundaryOk, 'eligibility_or_activation_boundary_invalid', 'user_delivery_or_production_promoted')
  const forbidden = new Set(READ_PROTOCOL_ACCESS_POLICY.forbiddenKeys); const keyViolation = walkKeys(handoff).some(key => forbidden.has(key))
  const topLevelAllowed = isObject(handoff) && Object.keys(handoff).every(key => READ_PROTOCOL_ACCESS_POLICY.allowedTopLevel.includes(key))
  check('access_policy', !keyViolation && topLevelAllowed && handoff?.deliveryPolicy?.relationSemantics === 'structural_co-occurrence_only' && handoff?.deliveryPolicy?.noInterpretationText === true && handoff?.deliveryPolicy?.noPromptTemplate === true && handoff?.deliveryPolicy?.noLlmCall === true && JSON.stringify(handoff?.deliveryPolicy?.allowedFields) === JSON.stringify(HANDOFF_ALLOWED_FIELDS) && JSON.stringify(handoff?.deliveryPolicy?.forbiddenUsages) === JSON.stringify(HANDOFF_FORBIDDEN_USAGES), 'access_policy_violation', 'calculation_contamination')
  const contaminationKeys = new Set(['simulation', 'placidus', 'frozenSpeed', 'frozenFrameSpeed', 'legacyPrep'])
  const hasContamination = value => {
    if (!value || typeof value !== 'object') return typeof value === 'string' && /unverified[ _-]?provider/i.test(value)
    return Object.entries(value).some(([key, child]) => contaminationKeys.has(key) || (/provider/i.test(key) && typeof child === 'string' && /unverified|unknown|simulation/i.test(child)) || hasContamination(child))
  }
  const contaminated = hasContamination({ handoff, packet, context, readiness, graph })
  check('calculation_boundary', !contaminated, 'calculation_contamination')
  check('human_review_boundary', handoff?.eligibility?.humanReview === 'human_review_required', 'human_review_missing')
  const claimSourceTrace = claims.map(item => ({ claimPath: item.path, sourceRefs: [...item.claim.sourceRefs].sort(), epistemic: item.claim.epistemic, provenanceStatus: item.claim.sourceRefs.every(ref => sourceRefs?.includes(ref)) ? 'resolved' : 'unresolved' }))
  const stepStatus = step => {
    const matches = checks.filter(checkItem => checkItem.id === step || (step === 'component_artifact_identity' && checkItem.id.endsWith('_artifact_identity')) || (step === 'component_content_identity' && checkItem.id.endsWith('_content_identity')))
    return matches.length && matches.every(checkItem => checkItem.status === 'passed') ? 'passed' : matches.length ? 'failed' : 'not_applicable'
  }
  const protocol = { schemaVersion: ASTROLOGY_INTERPRETATION_READ_PROTOCOL_SCHEMA, protocolVersion: ASTROLOGY_INTERPRETATION_READ_PROTOCOL_VERSION, protocolStatus: reasons.length ? READ_PROTOCOL_STATUS.blocked : READ_PROTOCOL_STATUS.complete, input: { handoffSchemaVersion: handoff?.schemaVersion || null, handoffVersion: handoff?.handoffVersion || null, handoffContentSha256: handoff?.bundleContentSha256 || null }, requirements: READ_PROTOCOL_REQUIREMENTS, steps: READ_PROTOCOL_STEPS.map(step => ({ step, status: stepStatus(step) })), failureProcedure: { onAnyFailedCheck: 'stop_and_block', noPartialRead: true, noFallbackSource: true, noActivation: true }, checks, claimCounts: stats, claimSourceTrace, accessPolicy: READ_PROTOCOL_ACCESS_POLICY, decisions: { localResearch: reasons.length ? 'blocked' : READ_PROTOCOL_DECISIONS.localResearch, userDelivery: READ_PROTOCOL_DECISIONS.userDelivery, productionActivation: READ_PROTOCOL_DECISIONS.productionActivation, humanReview: READ_PROTOCOL_DECISIONS.humanReview }, activation: { ...HANDOFF_ACTIVATION }, connected: false, availableForInterpretation: false, interpretationPacketActivation: 'blocked', interpretationBoundary: { noInterpretationText: true, noPromptTemplate: true, noLlmCall: true, structuralRelationsOnly: true, noPriorityOrMeaningWeight: true, noMeaningBeforeExperience: true }, hashScopes: { protocolContentSha256: 'protocol object excluding protocolContentSha256, recursively sorted object keys, arrays preserved, JSON plus LF', artifactByteSha256: 'exact UTF-8 bytes of materialized protocol evidence JSON, including formatting and final LF' } }
  return { ...protocol, [READ_PROTOCOL_CONTENT_HASH_FIELD]: astrologyInterpretationReadProtocolContentSha256(protocol), pass: reasons.length === 0, reasonCodes: uniqueSorted(reasons) }
}
