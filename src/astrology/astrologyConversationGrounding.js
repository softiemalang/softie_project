import { createHash } from 'node:crypto'

export const ASTROLOGY_CONVERSATION_GROUNDING_SCHEMA = 'astrology-conversation-grounding-v1'
export const ASTROLOGY_CONVERSATION_GROUNDING_VERSION = '1.0.0'
export const GROUNDING_CONTENT_HASH_FIELD = 'bundleContentSha256'
export const GROUNDING_ACTIVATION = Object.freeze({ availableForInterpretation: false, integrationStatus: 'not_connected', serviceEligibility: 'blocked', reason: 'interpretation_packet_not_activated' })
export const GROUNDING_RELATION_VOCABULARY = Object.freeze(['same_chart', 'shares_body_subject', 'shares_angle_subject', 'shares_aspect_endpoint', 'shares_house_subject', 'shares_ruler_subject', 'shares_distribution_dimension', 'same_rule_id'])
export const GROUNDING_STATUS_VOCABULARY = Object.freeze(['known', 'unknown', 'user_dependent', 'unavailable'])
export const GROUNDING_FORBIDDEN_KEYS = Object.freeze(['question', 'prompt', 'narrative', 'interpretation', 'advice', 'ranking', 'rank', 'priority', 'meaning', 'dominance', 'likelihood', 'personality', 'psychology', 'strength', 'weakness', 'destiny', 'synthesis', 'conflict'])

const HASH = /^[a-f0-9]{64}$/
const ordered = value => {
  if (Array.isArray(value)) return value.map(ordered)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]))
}
export const canonicalAstrologyConversationGroundingJson = value => `${JSON.stringify(ordered(value))}\n`
export const astrologyConversationGroundingContentSha256 = value => {
  const copy = structuredClone(value)
  delete copy[GROUNDING_CONTENT_HASH_FIELD]
  return createHash('sha256').update(canonicalAstrologyConversationGroundingJson(copy)).digest('hex')
}
const isObject = value => value && typeof value === 'object' && !Array.isArray(value)
const sortedUnique = values => [...new Set(values)].sort()
const stable = value => JSON.stringify(ordered(value))
const fail = (codes, code) => { if (!codes.includes(code)) codes.push(code) }
const componentSpec = {
  packet: { wrapper: 'astrology-interpretation-packet-evidence-v1', inner: 'packet', version: 'packetVersion', hash: 'packetContentSha256', schema: 'astrology-interpretation-packet-v1' },
  context: { wrapper: 'astrology-interpretation-context-evidence-v1', inner: 'context', version: 'contextVersion', hash: 'contextContentSha256', schema: 'astrology-interpretation-context-v1' },
  readiness: { wrapper: 'astrology-interpretation-readiness-evidence-v1', inner: 'readiness', version: 'readinessVersion', hash: 'readinessContentSha256', schema: 'astrology-interpretation-readiness-v1' },
  graph: { wrapper: 'astrology-claim-relation-graph-evidence-v1', inner: 'graph', version: 'graphVersion', hash: 'graphContentSha256', schema: 'astrology-claim-relation-graph-v1' },
}

const componentIdentity = (role, evidence, artifactByteSha256) => {
  const spec = componentSpec[role]; const value = evidence?.[spec.inner]
  return { role, artifactByteSha256, wrapperSchemaVersion: evidence?.schemaVersion, schemaVersion: value?.schemaVersion, version: value?.[spec.version], contentSha256: value?.[spec.hash], status: value?.[`${role}Status`] || value?.graphStatus || null }
}

export function buildAstrologyConversationGrounding({ components = {}, artifactIdentities = {} } = {}) {
  const packet = components.packet?.packet; const context = components.context?.context; const readiness = components.readiness?.readiness; const graph = components.graph?.graph
  if (![packet, context, readiness, graph].every(isObject)) throw new Error('grounding_component_missing')
  const nodes = (graph.nodes || []).map(node => ({ nodeId: node.nodeId, claimPath: node.claimPath, claimType: node.claimType, value: structuredClone(node.value), epistemic: node.epistemic, sourceRefs: [...node.sourceRefs].sort(), structural: structuredClone(node.structural) })).sort((a, b) => a.nodeId.localeCompare(b.nodeId))
  const edges = (graph.edges || []).map(edge => structuredClone(edge)).sort((a, b) => a.edgeId.localeCompare(b.edgeId))
  const sourceRefs = sortedUnique(context.provenance?.sourceRefs || [])
  const bundle = {
    schemaVersion: ASTROLOGY_CONVERSATION_GROUNDING_SCHEMA,
    groundingVersion: ASTROLOGY_CONVERSATION_GROUNDING_VERSION,
    bundleStatus: 'complete', usable: false,
    activation: { ...GROUNDING_ACTIVATION }, connected: false,
    inputs: {
      packet: componentIdentity('packet', components.packet, artifactIdentities.packet?.artifactByteSha256),
      context: componentIdentity('context', components.context, artifactIdentities.context?.artifactByteSha256),
      readiness: componentIdentity('readiness', components.readiness, artifactIdentities.readiness?.artifactByteSha256),
      graph: componentIdentity('graph', components.graph, artifactIdentities.graph?.artifactByteSha256),
      links: { contextFromPacket: context.sourcePacket?.packetContentSha256, readinessFromPacket: readiness.input?.packetContentSha256, graphFromContext: graph.input?.contextContentSha256, graphFromReadiness: graph.input?.readinessContentSha256 },
    },
    claims: { nodes, counts: { total: nodes.length, observedOrCalculated: nodes.filter(node => node.epistemic === 'observed_or_calculated').length, deterministicallyDerived: nodes.filter(node => node.epistemic === 'deterministically_derived').length } },
    relations: { vocabulary: [...graph.relationVocabulary], edges },
    context: { available: [{ domain: 'calculation', subject: 'verified_chart_facts', status: 'known', sourceRefs }], sourceRefs, sourceIdentities: structuredClone(context.provenance?.sourceIdentities || {}), readiness: { status: readiness.readinessStatus, decisions: structuredClone(readiness.decisions), blockedReasons: [...readiness.blockedReasons].sort() } },
    epistemicState: {
      known: [{ domain: 'calculation', subject: 'verified_chart_facts', status: 'known', sourceRefs }],
      unknown: [{ domain: 'lived_experience', subject: 'user_experience', status: 'unknown', reasonCode: 'not_provided', sourceRefs: [] }],
      userDependent: [{ domain: 'personal_meaning', subject: 'user_significance', status: 'user_dependent', reasonCode: 'requires_user_context', sourceRefs: [] }],
      unavailable: [{ domain: 'delivery', subject: 'interpretation_service', status: 'unavailable', reasonCode: 'activation_blocked', sourceRefs: ['activation'] }],
    },
    contextRequirements: [{ domain: 'lived_experience', subject: 'user_experience', reasonCode: 'not_provided', status: 'user_dependent', sourceRefs: [] }, { domain: 'personal_meaning', subject: 'user_significance', reasonCode: 'requires_user_context', status: 'user_dependent', sourceRefs: [] }],
    nonAssumptions: ['claim_life_strength', 'claim_personal_meaning', 'claim_user_identity', 'claim_experience_or_behavior', 'claim_dominance_or_priority', 'claim_likelihood', 'claim_interpretation_or_advice'],
    boundary: { naturalLanguage: false, questions: false, interpretation: false, advice: false, prompt: false, llmCall: false, ranking: false, userJudgment: false, claimTransformation: false },
    provenance: { sourceRefs, everyClaimSourceRefsResolve: true, everyRelationSourceRefsResolve: true, tracePolicy: 'claim node and relation evidence retain sourceRefs from graph; input identities retain component hashes' },
    hashScopes: { bundleContentSha256: 'bundle object excluding bundleContentSha256, recursively sorted object keys, arrays preserved, JSON plus LF', artifactByteSha256: 'exact UTF-8 bytes of materialized grounding evidence JSON, including formatting and final LF' },
  }
  return { ...bundle, [GROUNDING_CONTENT_HASH_FIELD]: astrologyConversationGroundingContentSha256(bundle) }
}

const walkKeys = (value, path = []) => {
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).flatMap(([key, child]) => [[key, [...path, key]], ...walkKeys(child, [...path, key])])
}

export function checkAstrologyConversationGrounding(bundle, { components = {}, artifactIdentities = {} } = {}) {
  const reasons = []
  if (!isObject(bundle) || bundle.schemaVersion !== ASTROLOGY_CONVERSATION_GROUNDING_SCHEMA || bundle.groundingVersion !== ASTROLOGY_CONVERSATION_GROUNDING_VERSION) fail(reasons, 'bundle_schema_or_version_mismatch')
  if (!HASH.test(bundle?.bundleContentSha256 || '') || astrologyConversationGroundingContentSha256(bundle) !== bundle?.bundleContentSha256) fail(reasons, 'bundle_content_hash_mismatch')
  if (bundle?.bundleStatus !== 'complete' || bundle?.usable !== false) fail(reasons, 'bundle_not_complete')
  if (JSON.stringify(bundle?.activation) !== JSON.stringify(GROUNDING_ACTIVATION) || bundle?.connected !== false) fail(reasons, 'activation_boundary_mismatch')
  if (JSON.stringify(bundle?.relations?.vocabulary) !== JSON.stringify(GROUNDING_RELATION_VOCABULARY)) fail(reasons, 'relation_vocabulary_invalid')
  const graph = components.graph?.graph; const context = components.context?.context; const readiness = components.readiness?.readiness; const packet = components.packet?.packet
  if (!isObject(packet) || !isObject(context) || !isObject(readiness) || !isObject(graph)) fail(reasons, 'component_missing_or_not_object')
  for (const role of Object.keys(componentSpec)) {
    const identity = bundle?.inputs?.[role]; const actual = artifactIdentities?.[role]?.artifactByteSha256
    if (!HASH.test(identity?.artifactByteSha256 || '') || (actual && identity.artifactByteSha256 !== actual)) fail(reasons, 'input_artifact_identity_invalid')
  }
  if (bundle?.inputs?.links?.contextFromPacket !== context?.sourcePacket?.packetContentSha256 || bundle?.inputs?.links?.readinessFromPacket !== readiness?.input?.packetContentSha256 || bundle?.inputs?.links?.graphFromContext !== graph?.input?.contextContentSha256 || bundle?.inputs?.links?.graphFromReadiness !== graph?.input?.readinessContentSha256) fail(reasons, 'input_hash_link_invalid')
  if (bundle?.claims?.nodes?.length !== graph?.nodes?.length || bundle?.claims?.nodes?.some((node, index) => stable(node) !== stable(graph.nodes.slice().sort((a, b) => a.nodeId.localeCompare(b.nodeId))[index]))) fail(reasons, 'claim_inventory_invalid')
  if (bundle?.relations?.edges?.length !== graph?.edges?.length || bundle?.relations?.edges?.some(edge => !graph.edges.some(source => JSON.stringify(source) === JSON.stringify(edge)))) fail(reasons, 'relation_inventory_invalid')
  if (bundle?.claims?.nodes?.some(node => !node.sourceRefs?.length || node.sourceRefs.some(ref => !context?.provenance?.sourceRefs?.includes(ref)))) fail(reasons, 'claim_provenance_broken')
  if (bundle?.relations?.edges?.some(edge => edge.evidence?.sourceRefs?.some(ref => !context?.provenance?.sourceRefs?.includes(ref)))) fail(reasons, 'relation_provenance_broken')
  if (bundle?.claims?.counts?.total !== graph?.claimCounts?.total || bundle?.claims?.counts?.total !== bundle?.claims?.nodes?.length) fail(reasons, 'claim_count_invalid')
  if (readiness?.readinessStatus !== 'complete' || bundle?.context?.readiness?.status !== readiness?.readinessStatus) fail(reasons, 'readiness_state_invalid')
  for (const status of ['known', 'unknown', 'userDependent', 'unavailable']) if (!Array.isArray(bundle?.epistemicState?.[status])) fail(reasons, 'epistemic_state_invalid')
  if (bundle?.epistemicState?.unknown?.some(item => item.status !== 'unknown') || bundle?.epistemicState?.userDependent?.some(item => item.status !== 'user_dependent')) fail(reasons, 'epistemic_state_promoted')
  if (bundle?.contextRequirements?.some(item => typeof item.reasonCode !== 'string' || item.status !== 'user_dependent' || item.question || item.prompt)) fail(reasons, 'context_requirement_invalid')
  if (JSON.stringify(bundle?.boundary) !== JSON.stringify({ naturalLanguage: false, questions: false, interpretation: false, advice: false, prompt: false, llmCall: false, ranking: false, userJudgment: false, claimTransformation: false })) fail(reasons, 'boundary_promoted')
  if (walkKeys(bundle).some(([key, path]) => GROUNDING_FORBIDDEN_KEYS.includes(String(key).toLowerCase()) && path[0] !== 'boundary' && path[0] !== 'contextRequirements')) fail(reasons, 'interpretation_output_present')
  if (bundle?.claims?.nodes?.some(node => ['dominance', 'priority', 'likelihood', 'meaning'].some(token => JSON.stringify(node).toLowerCase().includes(token)))) fail(reasons, 'claim_semantics_injected')
  return { pass: reasons.length === 0, reasonCodes: [...new Set(reasons)].sort() }
}

export { componentSpec }
