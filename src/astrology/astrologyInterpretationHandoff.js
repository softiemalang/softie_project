import { createHash } from 'node:crypto'

export const ASTROLOGY_INTERPRETATION_HANDOFF_SCHEMA = 'astrology-interpretation-handoff-v1'
export const ASTROLOGY_INTERPRETATION_HANDOFF_VERSION = '1.0.0'
export const HANDOFF_CONTENT_HASH_FIELD = 'bundleContentSha256'
export const HANDOFF_ACTIVATION = Object.freeze({
  availableForInterpretation: false,
  integrationStatus: 'not_connected',
  serviceEligibility: 'blocked',
  reason: 'interpretation_packet_not_activated',
})
export const HANDOFF_RELATION_VOCABULARY = Object.freeze([
  'same_chart', 'shares_body_subject', 'shares_angle_subject',
  'shares_aspect_endpoint', 'shares_house_subject', 'shares_ruler_subject',
  'shares_distribution_dimension', 'same_rule_id',
])
export const HANDOFF_ALLOWED_FIELDS = Object.freeze([
  'component manifest identities and hashes',
  'verified claim counts and epistemic counts',
  'relation vocabulary and graph counts',
  'sourceRefs and provenance completeness status',
  'local research eligibility and human-review status',
  'activation, user-delivery, and production boundary status',
  'deterministic source artifact references',
])
export const HANDOFF_FORBIDDEN_USAGES = Object.freeze([
  'generate_new_claims', 'delete_merge_or_transform_claims',
  'infer_personality_psychology_strength_weakness_wound_desire_risk_or_destiny',
  'create_theme_narrative_synthesis_or_conclusion',
  'rank_claims_or_assign_meaning_weight_or_priority',
  'judge_conflict_dominance_balance_or_winner_between_claims',
  'infer_experience_environment_or_behavior',
  'generate_natural_language_interpretation_questions_or_advice',
  'convert_structural_relations_to_psychological_support_or_conflict',
  'promote_readiness_to_user_delivery_or_production',
  'inject_prompt_or_call_llm_api',
])

const HASH = /^[a-f0-9]{64}$/
const ordered = value => {
  if (Array.isArray(value)) return value.map(ordered)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]))
}
export const canonicalAstrologyInterpretationHandoffJson = value => `${JSON.stringify(ordered(value))}\n`
export const astrologyInterpretationHandoffContentSha256 = value => {
  const copy = structuredClone(value)
  delete copy[HANDOFF_CONTENT_HASH_FIELD]
  return createHash('sha256').update(canonicalAstrologyInterpretationHandoffJson(copy)).digest('hex')
}

const isObject = value => value && typeof value === 'object' && !Array.isArray(value)
const fail = (codes, code) => { if (!codes.includes(code)) codes.push(code) }
const contentHash = value => {
  const copy = structuredClone(value)
  delete copy.packetContentSha256; delete copy.contextContentSha256; delete copy.readinessContentSha256; delete copy.graphContentSha256
  return createHash('sha256').update(`${JSON.stringify(ordered(copy))}\n`).digest('hex')
}
const componentSpec = {
  packet: { wrapper: 'astrology-interpretation-packet-evidence-v1', schema: 'astrology-interpretation-packet-v1', versionKey: 'packetVersion', contentKey: 'packetContentSha256', innerKey: 'packet' },
  context: { wrapper: 'astrology-interpretation-context-evidence-v1', schema: 'astrology-interpretation-context-v1', versionKey: 'contextVersion', contentKey: 'contextContentSha256', innerKey: 'context' },
  readiness: { wrapper: 'astrology-interpretation-readiness-evidence-v1', schema: 'astrology-interpretation-readiness-v1', versionKey: 'readinessVersion', contentKey: 'readinessContentSha256', innerKey: 'readiness' },
  graph: { wrapper: 'astrology-claim-relation-graph-evidence-v1', schema: 'astrology-claim-relation-graph-v1', versionKey: 'graphVersion', contentKey: 'graphContentSha256', innerKey: 'graph' },
}

export function buildAstrologyInterpretationHandoff({ components, artifactPaths }) {
  const manifest = {}
  for (const [role, spec] of Object.entries(componentSpec)) {
    const evidence = components[role]
    const value = evidence?.[spec.innerKey]
    if (!isObject(evidence) || !isObject(value)) throw new Error(`component_missing:${role}`)
    manifest[role] = {
      role,
      artifact: { path: artifactPaths[role], wrapperSchemaVersion: evidence.schemaVersion, artifactByteSha256: evidence.artifactByteSha256 || null },
      content: { schemaVersion: value.schemaVersion, version: value[spec.versionKey], contentSha256: value[spec.contentKey] },
      status: value[`${role}Status`] || value.graphStatus || null,
    }
  }
  const packet = components.packet.packet
  const context = components.context.context
  const readiness = components.readiness.readiness
  const graph = components.graph.graph
  const bundle = {
    schemaVersion: ASTROLOGY_INTERPRETATION_HANDOFF_SCHEMA,
    handoffVersion: ASTROLOGY_INTERPRETATION_HANDOFF_VERSION,
    bundleStatus: 'complete', usable: false,
    activation: { ...HANDOFF_ACTIVATION }, connected: false,
    components: manifest,
    crossHashLinks: {
      contextFromPacket: context.sourcePacket?.packetContentSha256,
      readinessFromPacket: readiness.input?.packetContentSha256,
      graphFromContext: graph.input?.contextContentSha256,
      graphFromReadiness: graph.input?.readinessContentSha256,
    },
    statistics: { claims: graph.claimCounts, graphNodes: graph.nodes?.length, graphEdges: graph.edges?.length },
    relationVocabulary: graph.relationVocabulary,
    provenance: { sourceRefsCompleteness: 'complete', packet: 'complete', context: 'complete', graphNodes: 'complete', graphEdges: 'complete' },
    eligibility: { localResearch: 'eligible_for_local_interpretation_research', userDelivery: 'not_eligible_for_user_delivery', production: 'production_activation_blocked', humanReview: 'human_review_required', activation: 'blocked' },
    deliveryPolicy: { allowedFields: HANDOFF_ALLOWED_FIELDS, forbiddenUsages: HANDOFF_FORBIDDEN_USAGES, relationSemantics: 'structural_co-occurrence_only', noInterpretationText: true, noPromptTemplate: true, noLlmCall: true },
    hashScopes: { bundleContentSha256: 'bundle object excluding bundleContentSha256, recursively sorted object keys, arrays preserved, JSON plus LF', artifactByteSha256: 'exact UTF-8 bytes of the materialized bundle evidence JSON, including formatting and final LF' },
  }
  return { ...bundle, [HANDOFF_CONTENT_HASH_FIELD]: astrologyInterpretationHandoffContentSha256(bundle) }
}

export function checkAstrologyInterpretationHandoff(bundle, { components = {}, artifactBytes = {} } = {}) {
  const reasons = []
  if (!isObject(bundle) || bundle.schemaVersion !== ASTROLOGY_INTERPRETATION_HANDOFF_SCHEMA || bundle.handoffVersion !== ASTROLOGY_INTERPRETATION_HANDOFF_VERSION) fail(reasons, 'bundle_schema_or_version_mismatch')
  if (!HASH.test(bundle?.bundleContentSha256 || '') || astrologyInterpretationHandoffContentSha256(bundle) !== bundle?.bundleContentSha256) fail(reasons, 'bundle_content_hash_mismatch')
  if (bundle?.bundleStatus !== 'complete' || bundle?.usable !== false) fail(reasons, 'bundle_not_complete')
  if (JSON.stringify(bundle?.activation) !== JSON.stringify(HANDOFF_ACTIVATION) || bundle?.connected !== false) fail(reasons, 'activation_boundary_mismatch')
  for (const [role, spec] of Object.entries(componentSpec)) {
    const entry = bundle?.components?.[role]; const evidence = components[role]; const value = evidence?.[spec.innerKey]
    if (!entry || !isObject(value)) { fail(reasons, 'component_missing_or_not_object'); continue }
    if (entry.artifact.wrapperSchemaVersion !== spec.wrapper || entry.content.schemaVersion !== spec.schema || entry.content.version !== value[spec.versionKey] || value.schemaVersion !== spec.schema || value[spec.versionKey] !== '1.0.0') fail(reasons, 'component_schema_or_version_mismatch')
    if (!HASH.test(entry.content.contentSha256 || '') || value[spec.contentKey] !== entry.content.contentSha256 || contentHash(value) !== value[spec.contentKey]) fail(reasons, 'component_content_hash_mismatch')
    const actualArtifact = artifactBytes[role]
    if (!HASH.test(entry.artifact.artifactByteSha256 || '') || (actualArtifact && createHash('sha256').update(actualArtifact).digest('hex') !== entry.artifact.artifactByteSha256)) fail(reasons, 'component_artifact_hash_mismatch')
  }
  if (bundle.crossHashLinks?.contextFromPacket !== components.context?.context?.sourcePacket?.packetContentSha256 || bundle.crossHashLinks?.readinessFromPacket !== components.readiness?.readiness?.input?.packetContentSha256 || bundle.crossHashLinks?.graphFromContext !== components.graph?.graph?.input?.contextContentSha256 || bundle.crossHashLinks?.graphFromReadiness !== components.graph?.graph?.input?.readinessContentSha256) fail(reasons, 'cross_hash_link_invalid')
  if (JSON.stringify(bundle.relationVocabulary) !== JSON.stringify(HANDOFF_RELATION_VOCABULARY)) fail(reasons, 'relation_vocabulary_invalid')
  if (JSON.stringify(bundle.statistics?.claims) !== JSON.stringify({ total: 53, observedOrCalculated: 20, deterministicallyDerived: 33 }) || bundle.statistics?.graphNodes !== 53 || bundle.statistics?.graphEdges !== 1753) fail(reasons, 'statistics_invalid')
  const packet = components.packet?.packet; const context = components.context?.context; const readiness = components.readiness?.readiness; const graph = components.graph?.graph
  if (packet?.usable !== false || context?.usable !== false || readiness?.readinessStatus !== 'complete' || graph?.usable !== false || graph?.connected !== false) fail(reasons, 'component_boundary_invalid')
  if (!Array.isArray(context?.provenance?.sourceRefs) || context.provenance.sourceRefs.length === 0 || !Array.isArray(graph?.nodes) || graph.nodes.length !== 53 || graph.nodes.some(node => !Array.isArray(node.sourceRefs) || node.sourceRefs.length === 0 || node.sourceRefs.some(ref => !context.provenance.sourceRefs.includes(ref)))) fail(reasons, 'source_refs_incomplete')
  if (!Array.isArray(graph?.edges) || graph.edges.length !== 1753 || graph.edges.some(edge => !HANDOFF_RELATION_VOCABULARY.includes(edge.relation))) fail(reasons, 'relation_vocabulary_invalid')
  if (JSON.stringify(bundle.provenance) !== JSON.stringify({ sourceRefsCompleteness: 'complete', packet: 'complete', context: 'complete', graphNodes: 'complete', graphEdges: 'complete' })) fail(reasons, 'provenance_incomplete')
  if (bundle.eligibility?.localResearch !== 'eligible_for_local_interpretation_research' || bundle.eligibility?.userDelivery !== 'not_eligible_for_user_delivery' || bundle.eligibility?.production !== 'production_activation_blocked' || bundle.eligibility?.humanReview !== 'human_review_required' || bundle.eligibility?.activation !== 'blocked') fail(reasons, 'promotion_boundary_invalid')
  if (!Array.isArray(bundle.deliveryPolicy?.allowedFields) || !Array.isArray(bundle.deliveryPolicy?.forbiddenUsages) || bundle.deliveryPolicy.noInterpretationText !== true || bundle.deliveryPolicy.noPromptTemplate !== true || bundle.deliveryPolicy.noLlmCall !== true) fail(reasons, 'delivery_policy_invalid')
  const forbiddenKeys = new Set(['theme', 'narrative', 'ranking', 'rank', 'meaningWeight', 'meaning_weight', 'prompt', 'personality', 'psychology', 'strength', 'weakness', 'wound', 'desire', 'destiny', 'advice', 'synthesis', 'conflict', 'dominance', 'balance'])
  const hasForbiddenKey = value => isObject(value) && Object.entries(value).some(([key, child]) => forbiddenKeys.has(key) || hasForbiddenKey(child))
  if (hasForbiddenKey(bundle)) fail(reasons, 'interpretation_output_present')
  return { pass: reasons.length === 0, reasonCodes: [...new Set(reasons)].sort() }
}

export { componentSpec }
