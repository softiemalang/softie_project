import { createHash } from 'node:crypto'

import {
  PTOLEMY_LINEAGE_ID,
  PTOLEMY_SOURCE_ID,
  WESTERN_SOURCE_PROFILES,
  getWesternSourceLexicon,
  validateAstrologySourceBoundedGrammar,
} from '../astrology/astrologySourceBoundedGrammar.js'
import {
  isDeterministicFactRef,
  validateDeterministicBaseForInterpretation,
} from '../interpretationConstitution.js'

/**
 * Additive handoff for source-bounded Western Astrology evidence.
 *
 * The existing technical calculation handoff remains the FACT lane.  This
 * envelope carries already materialized source/lineage results beside that
 * lane.  It never calculates a chart, selects a source winner, creates a
 * personal interpretation, or changes activation.
 */
export const ASTROLOGY_WESTERN_EVIDENCE_ENVELOPE_SCHEMA = 'astrology-western-source-evidence-envelope-v0'
export const ASTROLOGY_WESTERN_EVIDENCE_ENVELOPE_VERSION = '0.1.0'
export const ASTROLOGY_WESTERN_EVIDENCE_ENVELOPE_KIND = 'precomputed_western_source_bounded_evidence'
export const ASTROLOGY_WESTERN_EVIDENCE_HASH_FIELD = 'contentSha256'

export const ASTROLOGY_WESTERN_EVIDENCE_ACTIVATION = Object.freeze({
  availableForInterpretation: false,
  integrationStatus: 'not_connected',
  serviceEligibility: 'blocked',
  reason: 'interpretation_packet_not_activated',
})

export const ASTROLOGY_WESTERN_EVIDENCE_CLASSES = Object.freeze([
  'base_fact',
  'source_structural_result',
  'source_semantic_result',
  'source_local_composition',
  'source_lexicon_entry',
  'unresolved',
  'unsupported',
  'conflict',
])

export const ASTROLOGY_WESTERN_CONSUMPTION_GUIDANCE = Object.freeze({
  allowed: Object.freeze([
    'use the included technical FACT lane without recalculation',
    'describe an included source-bounded result only with its sourceRef and locator',
    'keep structural result, source term, unresolved, unsupported, and conflict states distinct',
    'ask for user context before any personal application outside this envelope',
  ]),
  forbidden: Object.freeze([
    'fill missing results or recalculate from generic astrology knowledge',
    'merge Ptolemy with Lilly, another lineage, or modern psychological astrology',
    'turn a source term into personality, fate, prediction, advice, or personal certainty',
    'treat unresolved, unsupported, blocked, or conflict state as confirmed meaning',
    'use outer planets as source-bounded semantic evidence in this envelope',
    'select a winner, vote across sources, create a hypothesis, or promote activation',
  ]),
})

const HASH = /^[a-f0-9]{64}$/u
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const unique = values => [...new Set(values)]
const clone = value => structuredClone(value)

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]))
}

export const canonicalAstrologyWesternEvidenceJson = value => `${JSON.stringify(ordered(value))}\n`

export function astrologyWesternEvidenceContentSha256(value) {
  const copy = clone(value)
  delete copy[ASTROLOGY_WESTERN_EVIDENCE_HASH_FIELD]
  return createHash('sha256').update(canonicalAstrologyWesternEvidenceJson(copy)).digest('hex')
}

function sourceResultGroups(grammarResult) {
  return [
    ['structuralResults', 'source_structural_result', grammarResult.structuralResults || []],
    ['semanticResults', 'source_semantic_result', grammarResult.semanticResults || []],
    ['compositionResults', 'source_local_composition', grammarResult.compositionResults || []],
  ]
}

function resultEvidenceId(result) {
  return `western.source-evidence.${encodeURIComponent(result.resultId)}`
}

function sourceTermFor(result) {
  if (!isObject(result.output)) return null
  return result.output.sourceTerm || result.output.sourceAspectTerm || result.output.sourceSemanticLabel || null
}

function evidenceForResult(result, evidenceRole) {
  const status = result.resultStatus
  const relation = status === 'conflict'
    ? 'conflicts'
    : (status === 'available' && evidenceRole !== 'source_structural_result' ? 'supports' : 'neutral')
  return {
    id: resultEvidenceId(result),
    class: status === 'available' ? evidenceRole : status,
    kind: 'literature_claim',
    evidenceRole,
    status,
    admission: 'semantic_candidate',
    relation,
    statement: `${result.sourceId}:${result.ruleId}:${status}`,
    sourceId: result.sourceId,
    lineageId: result.lineageId,
    resultId: result.resultId,
    ruleId: result.ruleId,
    ruleStatus: result.ruleStatus,
    executionStatus: result.executionStatus,
    requiredTechnicalFactRefs: [...(result.requiredFactRefs || [])],
    sourceRefs: clone(result.sourceRefs),
    output: result.output === null ? null : clone(result.output),
    sourceTerm: sourceTermFor(result),
    forbiddenExtensions: [...(result.forbiddenExtensions || [])],
    provenance: clone(result.provenance),
  }
}

function evidenceForLexicon(entry) {
  return {
    id: `western.source-lexicon.${encodeURIComponent(entry.entryId)}`,
    class: 'source_lexicon_entry',
    kind: 'literature_claim',
    evidenceRole: 'source_lexicon_entry',
    status: 'available',
    admission: 'semantic_candidate',
    relation: 'neutral',
    statement: `${entry.sourceId}:${entry.entryId}:source_term_only`,
    sourceId: entry.sourceId,
    lineageId: entry.lineageId,
    entryId: entry.entryId,
    ruleId: entry.ruleId,
    sourceTerm: entry.sourceTerm,
    appliesTo: [...entry.appliesTo],
    scope: entry.scope,
    sourceRefs: [{
      sourceId: entry.sourceId,
      lineageId: entry.lineageId,
      locatorId: entry.locatorId,
    }],
    requiredTechnicalFactRefs: [],
    forbiddenExtensions: [...entry.forbiddenExtensions],
    provenance: {
      sourceAuthority: 'bounded_source_text_only',
      sourceRuleLocatorId: entry.locatorId,
    },
  }
}

function buildEvidence(grammarResult) {
  const evidence = []
  for (const [, evidenceRole, results] of sourceResultGroups(grammarResult)) {
    for (const result of results) evidence.push(evidenceForResult(result, evidenceRole))
  }
  for (const entry of getWesternSourceLexicon()) evidence.push(evidenceForLexicon(entry))
  return evidence
}

function stateFrom(grammarResult, evidence) {
  const results = [...(grammarResult.structuralResults || []), ...(grammarResult.semanticResults || []), ...(grammarResult.compositionResults || [])]
  const ids = status => results.filter(item => item.resultStatus === status).map(item => item.resultId)
  return {
    adoptedResults: ids('available'),
    blockedResults: ids('blocked'),
    unresolvedResults: ids('unresolved'),
    unsupportedResults: ids('unsupported'),
    conflictResults: ids('conflict'),
    contextBoundCandidates: clone(grammarResult.candidates || []),
    unsupportedFrontier: clone(grammarResult.unsupported || []),
    commonCandidates: [],
    evidenceIds: evidence.map(item => item.id),
  }
}

function packetIdentity(packet, baseFactRefs) {
  const identities = packet?.identities || {}
  return {
    packetSchemaVersion: packet?.schemaVersion || null,
    packetVersion: packet?.packetVersion || null,
    packetStatus: packet?.packetStatus || null,
    packetContentSha256: packet?.packetContentSha256 || null,
    providerBundleSha256: identities.providerBundleSha256 || null,
    rawChartSha256: identities.rawChartSha256 || null,
    ruleChartSha256: identities.ruleChartSha256 || null,
    baseFactRefs: [...baseFactRefs],
  }
}

function readiness() {
  return {
    sourceBoundedEvidenceHandoff: 'ready_source_bounded',
    interpretationPrep: 'evidence_only_not_personalized',
    interpretationHypothesisLayer: 'not_open',
    userDelivery: 'not_eligible_for_user_delivery',
    humanReview: 'required',
    activation: 'blocked',
    blockers: [
      'no source-complete composition for Ptolemy I.23/I.24',
      'no independent modern or early-modern lineage admitted in this v0 package',
      'no personal interpretation or conversational activation contract in this package',
    ],
  }
}

function baseFactRefsFrom(value) {
  return unique(Array.isArray(value) ? value.filter(item => typeof item === 'string' && item.length > 0) : [])
}

function makeEnvelope({ packet = null, grammarResult, baseFactRefs = [] }) {
  const evidence = buildEvidence(grammarResult)
  const envelope = {
    schemaVersion: ASTROLOGY_WESTERN_EVIDENCE_ENVELOPE_SCHEMA,
    version: ASTROLOGY_WESTERN_EVIDENCE_ENVELOPE_VERSION,
    kind: ASTROLOGY_WESTERN_EVIDENCE_ENVELOPE_KIND,
    sourceScope: {
      selectedSourceId: PTOLEMY_SOURCE_ID,
      selectedLineageId: PTOLEMY_LINEAGE_ID,
      sourceSetIsClosed: false,
      sourceProfiles: clone(WESTERN_SOURCE_PROFILES),
      noImplicitCrossLineageMerge: true,
    },
    factLane: {
      precomputedOnly: true,
      sourcePacket: packetIdentity(packet, baseFactRefsFrom(baseFactRefs)),
      baseFactRefs: baseFactRefsFrom(baseFactRefs),
      noFactRecalculation: true,
    },
    sourceBoundedGrammar: clone(grammarResult),
    lexicon: getWesternSourceLexicon(),
    evidence,
    state: stateFrom(grammarResult, evidence),
    constitutionEvidenceAdapter: {
      schemaVersion: 'astrology-western-constitution-evidence-adapter-v0',
      version: '0.1.0',
      factsAndSourceEvidenceSeparate: true,
      sourceEvidenceIsNotBaseFact: true,
      hypotheses: [],
      conflicts: evidence.filter(item => item.relation === 'conflicts').map(item => ({
        id: `conflict.${item.id}`,
        evidenceIds: [item.id],
        resolution: 'preserved_tension',
      })),
      noHypothesisGenerated: true,
    },
    boundary: {
      precomputedOnly: true,
      noRecalculation: true,
      factsAndSourceEvidenceSeparate: true,
      sourceAuthorityPromotion: false,
      noCrossLineageSynthesis: true,
      noPersonalization: true,
      noNaturalLanguageInterpretation: true,
      unresolvedPreserved: true,
      conflictsPreserved: true,
      outerPlanetSemanticsUnsupported: true,
      activationUnchanged: true,
    },
    consumptionGuidance: clone(ASTROLOGY_WESTERN_CONSUMPTION_GUIDANCE),
    activation: { ...ASTROLOGY_WESTERN_EVIDENCE_ACTIVATION },
    readiness: readiness(),
  }
  return { ...envelope, [ASTROLOGY_WESTERN_EVIDENCE_HASH_FIELD]: astrologyWesternEvidenceContentSha256(envelope) }
}

function validationError(errors, code) {
  if (!errors.includes(code)) errors.push(code)
}

function validateSourceRefs(evidence, errors) {
  for (const item of evidence) {
    if (!Array.isArray(item.sourceRefs) || item.sourceRefs.length === 0) validationError(errors, `evidence_source_refs_missing:${item.id}`)
    for (const ref of item.sourceRefs || []) {
      if (ref.sourceId !== PTOLEMY_SOURCE_ID || ref.lineageId !== PTOLEMY_LINEAGE_ID) validationError(errors, `evidence_source_scope_mismatch:${item.id}`)
      if (typeof ref.locatorId !== 'string' || ref.locatorId.length === 0) validationError(errors, `evidence_locator_missing:${item.id}`)
    }
  }
}

function validateEnvelopeShape(envelope, errors) {
  if (!isObject(envelope)) {
    validationError(errors, 'envelope_not_object')
    return
  }
  if (envelope.schemaVersion !== ASTROLOGY_WESTERN_EVIDENCE_ENVELOPE_SCHEMA || envelope.version !== ASTROLOGY_WESTERN_EVIDENCE_ENVELOPE_VERSION || envelope.kind !== ASTROLOGY_WESTERN_EVIDENCE_ENVELOPE_KIND) validationError(errors, 'envelope_schema_mismatch')
  if (envelope.sourceScope?.selectedSourceId !== PTOLEMY_SOURCE_ID || envelope.sourceScope?.selectedLineageId !== PTOLEMY_LINEAGE_ID || envelope.sourceScope?.sourceSetIsClosed !== false || envelope.sourceScope?.noImplicitCrossLineageMerge !== true) validationError(errors, 'source_scope_boundary_invalid')
  if (canonicalAstrologyWesternEvidenceJson(envelope.sourceScope?.sourceProfiles || []) !== canonicalAstrologyWesternEvidenceJson(WESTERN_SOURCE_PROFILES)) validationError(errors, 'source_profiles_not_canonical')
  if (envelope.factLane?.precomputedOnly !== true || envelope.factLane?.noFactRecalculation !== true || !isObject(envelope.factLane?.sourcePacket) || !Array.isArray(envelope.factLane?.baseFactRefs)) validationError(errors, 'fact_lane_invalid')
  if (!Array.isArray(envelope.lexicon) || !Array.isArray(envelope.evidence)) validationError(errors, 'evidence_containers_missing')
  if (!isObject(envelope.state) || !isObject(envelope.constitutionEvidenceAdapter)) validationError(errors, 'state_or_adapter_missing')
  const boundary = envelope.boundary
  if (boundary?.precomputedOnly !== true || boundary?.noRecalculation !== true || boundary?.factsAndSourceEvidenceSeparate !== true || boundary?.sourceAuthorityPromotion !== false || boundary?.noCrossLineageSynthesis !== true || boundary?.noPersonalization !== true || boundary?.noNaturalLanguageInterpretation !== true || boundary?.unresolvedPreserved !== true || boundary?.conflictsPreserved !== true || boundary?.outerPlanetSemanticsUnsupported !== true || boundary?.activationUnchanged !== true) validationError(errors, 'evidence_boundary_invalid')
  if (canonicalAstrologyWesternEvidenceJson(envelope.activation) !== canonicalAstrologyWesternEvidenceJson(ASTROLOGY_WESTERN_EVIDENCE_ACTIVATION)) validationError(errors, 'activation_boundary_invalid')
  if (envelope.constitutionEvidenceAdapter?.factsAndSourceEvidenceSeparate !== true || envelope.constitutionEvidenceAdapter?.sourceEvidenceIsNotBaseFact !== true || envelope.constitutionEvidenceAdapter?.noHypothesisGenerated !== true || !Array.isArray(envelope.constitutionEvidenceAdapter?.hypotheses) || envelope.constitutionEvidenceAdapter.hypotheses.length !== 0) validationError(errors, 'constitution_adapter_boundary_invalid')
  if (!isObject(envelope.readiness) || envelope.readiness.sourceBoundedEvidenceHandoff !== 'ready_source_bounded' || envelope.readiness.interpretationHypothesisLayer !== 'not_open' || envelope.readiness.userDelivery !== 'not_eligible_for_user_delivery' || envelope.readiness.activation !== 'blocked') validationError(errors, 'readiness_boundary_invalid')
  if (!Array.isArray(envelope.consumptionGuidance?.allowed) || !Array.isArray(envelope.consumptionGuidance?.forbidden)) validationError(errors, 'consumption_guidance_missing')
}

function validateEvidenceAgainstGrammar(envelope, errors) {
  const grammarValidation = validateAstrologySourceBoundedGrammar(envelope.sourceBoundedGrammar)
  if (!grammarValidation.valid) errors.push(...grammarValidation.errors.map(error => `grammar:${error}`))
  const expected = buildEvidence(envelope.sourceBoundedGrammar || {})
  if (canonicalAstrologyWesternEvidenceJson(envelope.evidence) !== canonicalAstrologyWesternEvidenceJson(expected)) validationError(errors, 'evidence_not_lossless_from_grammar')
  if (canonicalAstrologyWesternEvidenceJson(envelope.lexicon) !== canonicalAstrologyWesternEvidenceJson(getWesternSourceLexicon())) validationError(errors, 'lexicon_not_canonical')
  const expectedState = stateFrom(envelope.sourceBoundedGrammar || {}, expected)
  if (canonicalAstrologyWesternEvidenceJson(envelope.state) !== canonicalAstrologyWesternEvidenceJson(expectedState)) validationError(errors, 'state_not_lossless_from_grammar')
  const expectedConflicts = expected
    .filter(item => item.relation === 'conflicts')
    .map(item => ({ id: `conflict.${item.id}`, evidenceIds: [item.id], resolution: 'preserved_tension' }))
  if (canonicalAstrologyWesternEvidenceJson(envelope.constitutionEvidenceAdapter?.conflicts || []) !== canonicalAstrologyWesternEvidenceJson(expectedConflicts)) validationError(errors, 'conflict_ledger_not_lossless')
  validateSourceRefs(expected, errors)
}

export function validateAstrologyWesternEvidenceEnvelope(envelope, { packet = null, grammarResult = null, base = null } = {}) {
  const errors = []
  validateEnvelopeShape(envelope, errors)
  if (isObject(envelope)) {
    if (!HASH.test(envelope.contentSha256 || '') || astrologyWesternEvidenceContentSha256(envelope) !== envelope.contentSha256) validationError(errors, 'content_hash_mismatch')
    validateEvidenceAgainstGrammar(envelope, errors)
    if (packet) {
      const expected = packetIdentity(packet, envelope.factLane?.baseFactRefs || [])
      if (canonicalAstrologyWesternEvidenceJson(envelope.factLane?.sourcePacket) !== canonicalAstrologyWesternEvidenceJson(expected)) validationError(errors, 'source_packet_identity_mismatch')
    }
    if (grammarResult && canonicalAstrologyWesternEvidenceJson(envelope.sourceBoundedGrammar) !== canonicalAstrologyWesternEvidenceJson(grammarResult)) validationError(errors, 'grammar_input_identity_mismatch')
    if (base) {
      const baseValidation = validateDeterministicBaseForInterpretation(base)
      if (!baseValidation.valid) errors.push(...baseValidation.errors.map(error => `base:${error}`))
      for (const factRef of envelope.factLane?.baseFactRefs || []) if (!isDeterministicFactRef(base, factRef)) validationError(errors, `base_fact_ref_invalid:${factRef}`)
    }
  }
  return { valid: unique(errors).length === 0, errors: unique(errors).sort() }
}

export function buildAstrologyWesternEvidenceEnvelope({ packet = null, grammarResult = null, baseFactRefs = [] } = {}) {
  const grammarValidation = validateAstrologySourceBoundedGrammar(grammarResult)
  if (!grammarValidation.valid) return { valid: false, errors: grammarValidation.errors.map(error => `grammar:${error}`), envelope: null }
  const envelope = makeEnvelope({ packet, grammarResult, baseFactRefs })
  const validation = validateAstrologyWesternEvidenceEnvelope(envelope, { packet, grammarResult })
  return { valid: validation.valid, errors: validation.errors, envelope: validation.valid ? envelope : null }
}

export const exportAstrologyWesternEvidenceJson = (envelope, indent = 2) => JSON.stringify(envelope, null, indent)

export function consumeAstrologyWesternEvidenceEnvelope(serialized, options = {}) {
  let envelope
  try {
    envelope = typeof serialized === 'string' ? JSON.parse(serialized) : clone(serialized)
  } catch {
    return { valid: false, errors: ['envelope_json_invalid'], envelope: null }
  }
  const validation = validateAstrologyWesternEvidenceEnvelope(envelope, options)
  return { valid: validation.valid, errors: validation.errors, envelope: validation.valid ? envelope : null }
}

function baseFactEvidence(factRef) {
  return {
    id: `astrology.base-fact.${encodeURIComponent(factRef)}`,
    kind: 'base_fact',
    status: 'available',
    admission: 'base_contract',
    relation: 'neutral',
    factRefs: [factRef],
    evidenceRole: 'public_deterministic_base_fact',
  }
}

function constitutionEvidenceItem(item) {
  return {
    id: item.id,
    kind: 'literature_claim',
    status: item.status,
    admission: 'semantic_candidate',
    relation: item.relation,
    statement: item.statement,
    evidenceRole: item.evidenceRole,
    semanticBasisEligible: item.evidenceRole !== 'source_structural_result' && item.status === 'available',
    sourceRefs: clone(item.sourceRefs),
    provenance: clone(item.provenance),
    requiredTechnicalFactRefs: [...item.requiredTechnicalFactRefs],
    payload: {
      sourceId: item.sourceId,
      lineageId: item.lineageId,
      ruleId: item.ruleId || null,
      resultId: item.resultId || null,
      entryId: item.entryId || null,
      sourceTerm: item.sourceTerm,
      output: item.output === undefined ? null : clone(item.output),
      scope: item.scope || null,
    },
  }
}

/**
 * Adapt the envelope to the domain-neutral Constitution input shape.  This is
 * only a lane adapter: it emits no hypothesis and performs no interpretation.
 */
export function adaptAstrologyWesternEvidenceToConstitution({ base = null, envelope } = {}) {
  const validation = validateAstrologyWesternEvidenceEnvelope(envelope, { base })
  if (!validation.valid) {
    return {
      base,
      evidence: [],
      conflicts: [],
      hypotheses: [],
      constitutionInput: { base, evidence: [], conflicts: [], hypotheses: [] },
      adapterValidation: validation,
      boundary: { factsAndSourceEvidenceSeparate: true, noRecalculation: true, noPersonalization: true, noCrossLineageSynthesis: true, noHypothesisGenerated: true },
      readiness: { sourceBoundedEvidenceHandoff: 'blocked', interpretationHypothesisReady: false, activation: 'blocked' },
    }
  }
  const evidence = []
  for (const factRef of envelope.factLane.baseFactRefs) evidence.push(baseFactEvidence(factRef))
  for (const item of envelope.evidence) evidence.push(constitutionEvidenceItem(item))
  const conflicts = envelope.constitutionEvidenceAdapter.conflicts.map(conflict => ({ ...conflict }))
  return {
    base,
    evidence,
    conflicts,
    hypotheses: [],
    constitutionInput: { base, evidence, conflicts, hypotheses: [] },
    adapterValidation: validation,
    evidenceMapping: {
      baseFactEvidenceIds: evidence.filter(item => item.kind === 'base_fact').map(item => item.id),
      sourceEvidenceIds: evidence.filter(item => item.kind === 'literature_claim').map(item => item.id),
      conflictEvidenceIds: conflicts.flatMap(item => item.evidenceIds),
      semanticBasisEligibleEvidenceIds: evidence.filter(item => item.semanticBasisEligible === true).map(item => item.id),
    },
    boundary: {
      factsAndSourceEvidenceSeparate: true,
      noRecalculation: true,
      noPersonalization: true,
      noCrossLineageSynthesis: true,
      unresolvedPreserved: true,
      conflictsPreserved: true,
      noHypothesisGenerated: true,
    },
    readiness: {
      sourceBoundedEvidenceHandoff: 'ready_source_bounded',
      interpretationHypothesisReady: false,
      userExperienceRequired: true,
      activation: 'blocked',
    },
  }
}
