import { createHash } from 'node:crypto'
import {
  assertAstrologyInterpretationContext,
  INTERPRETATION_CONTEXT_SCHEMA,
  INTERPRETATION_CONTEXT_VERSION,
} from './interpretationConsumer.js'
import {
  assertAstrologyInterpretationReadiness,
  ASTROLOGY_INTERPRETATION_READINESS_SCHEMA,
  ASTROLOGY_INTERPRETATION_READINESS_VERSION,
} from './interpretationReadiness.js'

export const ASTROLOGY_CLAIM_RELATION_GRAPH_SCHEMA = 'astrology-claim-relation-graph-v1'
export const ASTROLOGY_CLAIM_RELATION_GRAPH_VERSION = '1.0.0'
export const GRAPH_CONTENT_HASH_FIELD = 'graphContentSha256'

// These names describe observable structure only. They are deliberately not
// directional and carry no interpretation, weight, priority, or polarity.
export const CLAIM_RELATION_VOCABULARY = Object.freeze([
  'same_chart',
  'shares_body_subject',
  'shares_angle_subject',
  'shares_aspect_endpoint',
  'shares_house_subject',
  'shares_ruler_subject',
  'shares_distribution_dimension',
  'same_rule_id',
])

const HASH = /^[a-f0-9]{64}$/
const BODY_IDS = new Set(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'])
const ACTIVATION = { availableForInterpretation: false, integrationStatus: 'not_connected', serviceEligibility: 'blocked', reason: 'interpretation_packet_not_activated' }
const ordered = value => {
  if (Array.isArray(value)) return value.map(ordered)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]))
}
const canonical = value => `${JSON.stringify(ordered(value))}\n`
export const canonicalAstrologyClaimRelationGraphJson = canonical
export const astrologyClaimRelationGraphContentSha256 = value => {
  const copy = structuredClone(value)
  delete copy[GRAPH_CONTENT_HASH_FIELD]
  return createHash('sha256').update(canonical(copy)).digest('hex')
}
const isObject = value => value && typeof value === 'object' && !Array.isArray(value)
const uniqueSorted = values => [...new Set(values)].sort()
const fail = (code) => { const error = new Error(code); error.code = code; throw error }

const claimEntry = (claim, path) => {
  const segment = path.split('/').filter(Boolean).join('.')
  const nodeId = `${claim.epistemic === 'observed_or_calculated' ? 'observed' : 'derived'}:${segment}`
  const value = structuredClone(claim.value)
  const bodySubject = claim.claimType.startsWith('body.') ? claim.sourceRefs.map(ref => ref.match(/(?:rawChart|ruleChart)\.bodies\.([a-z_]+)\./)?.[1]).find(Boolean) : null
  const id = typeof value?.id === 'string' ? value.id : null
  const subjects = []
  if (claim.claimType.startsWith('body.') && (bodySubject || id) && BODY_IDS.has(bodySubject || id)) subjects.push(bodySubject || id)
  if (claim.claimType === 'angle.placement' && id) subjects.push(id)
  if (claim.claimType === 'aspect.major') {
    if (BODY_IDS.has(value.pointA) || ['ascendant', 'midheaven'].includes(value.pointA)) subjects.push(value.pointA)
    if (BODY_IDS.has(value.pointB) || ['ascendant', 'midheaven'].includes(value.pointB)) subjects.push(value.pointB)
  }
  if (claim.claimType === 'house.whole_sign_placement') {
    for (const placement of value.placements || []) if (BODY_IDS.has(placement.id)) subjects.push(placement.id)
  }
  if (claim.claimType === 'chart_ruler') {
    for (const key of ['traditionalChartRuler', 'modernChartRuler']) if (BODY_IDS.has(value[key])) subjects.push(value[key])
  }
  const dimensions = claim.claimType === 'distribution.elements_modalities_polarity' ? ['elements', 'modalities', 'polarity'] : []
  const ruleIds = ['ruleId', 'phaseRuleId'].filter(key => typeof value?.[key] === 'string').map(key => ({ key, value: value[key] }))
  return {
    nodeId, claimPath: path, claimType: claim.claimType, epistemic: claim.epistemic,
    value, sourceRefs: uniqueSorted(claim.sourceRefs),
    structural: { subjects: uniqueSorted(subjects), dimensions, ruleIds },
  }
}

function walkClaims(value, path = '', result = []) {
  if (!value || typeof value !== 'object') return result
  if (Object.prototype.hasOwnProperty.call(value, 'claimType') && Object.prototype.hasOwnProperty.call(value, 'value')) result.push(claimEntry(value, path))
  for (const [key, child] of Object.entries(value)) walkClaims(child, `${path}/${key}`, result)
  return result
}

function validateInputs(context, readiness) {
  if (!isObject(context) || context.schemaVersion !== INTERPRETATION_CONTEXT_SCHEMA || context.contextVersion !== INTERPRETATION_CONTEXT_VERSION) fail('context_schema_or_version_mismatch')
  assertAstrologyInterpretationContext(context)
  if (!isObject(readiness) || readiness.schemaVersion !== ASTROLOGY_INTERPRETATION_READINESS_SCHEMA || readiness.readinessVersion !== ASTROLOGY_INTERPRETATION_READINESS_VERSION) fail('readiness_schema_or_version_mismatch')
  assertAstrologyInterpretationReadiness(readiness)
  if (readiness.readinessStatus !== 'complete' || readiness.decisions?.localInterpretationResearch !== 'eligible_for_local_interpretation_research') fail('readiness_not_valid')
  if (readiness.input?.contextContentSha256 !== context.contextContentSha256) fail('context_readiness_hash_link_invalid')
  if (context.contextStatus !== 'complete' || context.usable !== false || JSON.stringify(context.activation) !== JSON.stringify(ACTIVATION)) fail('activation_boundary_mismatch')
  if (readiness.claimCounts?.total !== 53 || readiness.claimCounts?.observedOrCalculated !== 20 || readiness.claimCounts?.deterministicallyDerived !== 33) fail('claim_count_invalid')
  if (context.provenance?.sourceIdentities?.evaluator?.evaluator !== 'de405-canonical-v2') fail('provenance_or_source_refs_invalid')
  if (context.ruleCoreDerived?.wholeSignHouses?.value?.houseSystem !== 'whole_sign') fail('calculation_contamination')
  if (['simulation', 'placidus', 'frozenSpeed', 'frozenFrameSpeed', 'legacyPrep'].some(key => Object.prototype.hasOwnProperty.call(context, key))) fail('calculation_contamination')
}

const pair = (a, b) => [a.nodeId, b.nodeId].sort()
const makeEdge = (a, b, relation, evidence) => ({ edgeId: `${pair(a, b).join('~')}~${relation}`, from: pair(a, b)[0], to: pair(a, b)[1], relation, evidence: { ...evidence, sourceRefs: uniqueSorted([...a.sourceRefs, ...b.sourceRefs]) } })

function buildEdges(nodes) {
  const edges = []
  const add = (a, b, relation, evidence) => { if (a.nodeId !== b.nodeId) edges.push(makeEdge(a, b, relation, evidence)) }
  for (let i = 0; i < nodes.length; i += 1) for (let j = i + 1; j < nodes.length; j += 1) {
    const a = nodes[i]; const b = nodes[j]
    add(a, b, 'same_chart', { basis: 'context.sourcePacket.packetContentSha256' })
    const sharedSubjects = a.structural.subjects.filter(subject => b.structural.subjects.includes(subject))
    if (sharedSubjects.length) {
      const relation = a.claimType === 'aspect.major' || b.claimType === 'aspect.major' ? 'shares_aspect_endpoint' : a.claimType === 'house.whole_sign_placement' || b.claimType === 'house.whole_sign_placement' ? 'shares_house_subject' : a.claimType === 'chart_ruler' || b.claimType === 'chart_ruler' ? 'shares_ruler_subject' : a.claimType === 'angle.placement' || b.claimType === 'angle.placement' ? 'shares_angle_subject' : 'shares_body_subject'
      add(a, b, relation, { basis: 'claim.value structural subject', subjects: sharedSubjects })
    }
    const sharedDimensions = a.structural.dimensions.filter(dimension => b.structural.dimensions.includes(dimension))
    if (sharedDimensions.length) add(a, b, 'shares_distribution_dimension', { basis: 'claim.value distribution dimension', dimensions: sharedDimensions })
    const sharedRules = a.structural.ruleIds.filter(x => b.structural.ruleIds.some(y => x.key === y.key && x.value === y.value))
    if (sharedRules.length) add(a, b, 'same_rule_id', { basis: 'claim.value rule identifier', ruleIds: sharedRules.map(x => ({ ...x })) })
  }
  return [...new Map(edges.map(edge => [edge.edgeId, edge])).values()].sort((a, b) => a.edgeId.localeCompare(b.edgeId))
}

export function buildAstrologyClaimRelationGraph({ context, readiness } = {}) {
  validateInputs(context, readiness)
  const nodes = walkClaims(context).sort((a, b) => a.nodeId.localeCompare(b.nodeId))
  if (nodes.length !== 53) fail('claim_count_invalid')
  if (nodes.some(node => !node.sourceRefs.length || node.sourceRefs.some(ref => !context.provenance.sourceRefs.includes(ref)))) fail('provenance_or_source_refs_invalid')
  const graph = {
    schemaVersion: ASTROLOGY_CLAIM_RELATION_GRAPH_SCHEMA,
    graphVersion: ASTROLOGY_CLAIM_RELATION_GRAPH_VERSION,
    graphStatus: 'complete', usable: false,
    activation: { ...ACTIVATION }, connected: false, relationVocabulary: CLAIM_RELATION_VOCABULARY,
    input: { contextSchemaVersion: context.schemaVersion, contextVersion: context.contextVersion, contextContentSha256: context.contextContentSha256, readinessSchemaVersion: readiness.schemaVersion, readinessVersion: readiness.readinessVersion, readinessContentSha256: readiness.readinessContentSha256 },
    claimCounts: { total: nodes.length, observedOrCalculated: nodes.filter(n => n.epistemic === 'observed_or_calculated').length, deterministicallyDerived: nodes.filter(n => n.epistemic === 'deterministically_derived').length },
    nodes, edges: buildEdges(nodes),
    epistemicClassification: { observedOrCalculated: 'observed_or_calculated', ruleCoreDerived: 'deterministically_derived', activation: 'blocked' },
    decisions: { localInterpretationResearch: 'eligible_for_local_interpretation_research', userDelivery: 'not_eligible_for_user_delivery', productionActivation: 'production_activation_blocked', humanReview: 'human_review_required' },
    consumerBoundary: { externalLlm: false, naturalLanguageGeneration: false, humanAssessment: false, thematicSynthesis: false, ranking: false, userDelivery: false, production: false, ui: false, database: false },
    outputPolicy: { interpretation: false, synthesis: false, ranking: false, naturalLanguage: false },
    hashScopes: { graphContentSha256: 'graph object excluding graphContentSha256, recursively sorted object keys, arrays preserved, JSON plus LF', artifactByteSha256: 'exact UTF-8 bytes of materialized evidence JSON, including formatting and final LF' },
  }
  return { ...graph, [GRAPH_CONTENT_HASH_FIELD]: astrologyClaimRelationGraphContentSha256(graph) }
}

export function assertAstrologyClaimRelationGraph(graph, { context, readiness } = {}) {
  if (!isObject(graph) || graph.schemaVersion !== ASTROLOGY_CLAIM_RELATION_GRAPH_SCHEMA || graph.graphVersion !== ASTROLOGY_CLAIM_RELATION_GRAPH_VERSION) fail('graph_schema_or_version_mismatch')
  if (graph.graphStatus !== 'complete' || graph.usable !== false) fail('graph_not_complete')
  if (!HASH.test(graph.graphContentSha256 || '') || astrologyClaimRelationGraphContentSha256(graph) !== graph.graphContentSha256) fail('graph_content_hash_mismatch')
  validateInputs(context, readiness)
  if (graph.input.contextContentSha256 !== context.contextContentSha256 || graph.input.readinessContentSha256 !== readiness.readinessContentSha256) fail('graph_input_hash_link_invalid')
  if (JSON.stringify(graph.relationVocabulary) !== JSON.stringify(CLAIM_RELATION_VOCABULARY)) fail('relation_vocabulary_invalid')
  if (JSON.stringify(graph.activation) !== JSON.stringify(ACTIVATION) || graph.connected !== false) fail('activation_boundary_mismatch')
  if (['simulation', 'placidus', 'frozenSpeed', 'frozenFrameSpeed', 'legacyPrep'].some(key => Object.prototype.hasOwnProperty.call(graph, key))) fail('calculation_contamination')
  if (Object.values(graph.consumerBoundary || {}).some(value => value !== false) || Object.values(graph.outputPolicy || {}).some(value => value !== false)) fail('consumer_boundary_promoted')
  if (graph.claimCounts?.total !== 53 || graph.claimCounts.observedOrCalculated !== 20 || graph.claimCounts.deterministicallyDerived !== 33 || !Array.isArray(graph.nodes) || graph.nodes.length !== 53) fail('claim_count_invalid')
  const ids = new Set(graph.nodes.map(node => node.nodeId))
  if (ids.size !== graph.nodes.length || graph.nodes.some(node => !node.claimPath || !Array.isArray(node.sourceRefs) || node.sourceRefs.some(ref => !context.provenance.sourceRefs.includes(ref)))) fail('node_identity_or_source_ref_invalid')
  for (const edge of graph.edges || []) {
    if (!ids.has(edge.from) || !ids.has(edge.to) || edge.from >= edge.to) fail('edge_node_reference_invalid')
    if (!CLAIM_RELATION_VOCABULARY.includes(edge.relation)) fail('relation_vocabulary_invalid')
    if (!isObject(edge.evidence) || !Array.isArray(edge.evidence.sourceRefs) || !edge.evidence.sourceRefs.length) fail('relation_evidence_missing')
  }
  const expected = buildAstrologyClaimRelationGraph({ context, readiness })
  if (JSON.stringify(graph.nodes) !== JSON.stringify(expected.nodes) || JSON.stringify(graph.edges) !== JSON.stringify(expected.edges)) fail('graph_structure_mismatch')
  const forbiddenKeys = new Set(['theme', 'narrative', 'personality', 'psychology', 'strength', 'weakness', 'risk', 'desire', 'wound', 'destiny', 'importance', 'priority', 'conflict', 'dominance', 'balance', 'advice', 'score'])
  const walkKeys = value => { if (!value || typeof value !== 'object') return false; return Object.entries(value).some(([key, child]) => forbiddenKeys.has(key) || walkKeys(child)) }
  if (walkKeys(graph)) fail('interpretation_output_present')
  return true
}
