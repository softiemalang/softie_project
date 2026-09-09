import {
  SAJU_LINEAGE_LOCATORS,
  SAJU_LINEAGE_READING_GRAMMAR_SCHEMA,
  SAJU_LINEAGE_READING_GRAMMAR_VERSION,
  SAJU_LINEAGE_RULES,
  SAJU_LINEAGE_SOURCE_PROFILES,
  SAJU_LINEAGE_STRUCTURAL_CONTRACTS,
  SAJU_SANMING_SOURCE_SEMANTIC_CONTRACTS,
  SAJU_SANMING_SOURCE_SEMANTIC_RULES,
  SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON,
  SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_RULES,
  SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_READINESS,
  SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_FREEZE_DECISION,
  SAJU_ZIPING_SOURCE_SEMANTIC_CONTRACTS,
  SAJU_ZIPING_SOURCE_SEMANTIC_RULES,
  checkSajuLineageReadingGrammar,
  checkSajuLineageSourceSemanticResultContract,
  checkSajuLineageStructuralResultContract,
  checkSajuSanmingSourceSemanticResultContract,
  checkSajuSourceBoundedSemanticLexicon,
  checkSajuSourceLocalSemanticComposition,
} from './sajuLineageReadingGrammar.js'
import {
  isDeterministicFactRef,
  validateDeterministicBaseForInterpretation,
} from '../interpretationConstitution.js'

/**
 * Handoff-only evidence envelope for already materialized Saju lineage
 * results.  It is intentionally separate from the public Deterministic Base:
 * no calculation, source promotion, or personal interpretation occurs here.
 */
export const SAJU_LINEAGE_HANDOFF_EVIDENCE_SCHEMA = 'saju-lineage-handoff-evidence-v0'
export const SAJU_LINEAGE_HANDOFF_EVIDENCE_VERSION = '0.1.0'
export const SAJU_LINEAGE_HANDOFF_EVIDENCE_KIND = 'precomputed_saju_lineage_evidence'

const SOURCE_STATE_CATEGORIES = Object.freeze({
  structural: ['executableRules', 'prerequisiteGaps', 'unresolvedRules', 'unsupportedRules', 'notApplicableRules', 'lineageConflicts'],
  semantic: ['adoptedSemanticRules', 'contextBoundCandidates', 'unresolvedBoundaries', 'prerequisiteGaps', 'notApplicableRules', 'lineageConflicts'],
  semanticLexicon: ['catalogSemanticEntries', 'resolvedSemanticEntries', 'contextBoundEntries', 'unresolvedEntries', 'unsupportedEntries', 'blockedEntries', 'notApplicableEntries', 'ambiguousEntries', 'lineageConflicts', 'commonSemanticCandidates'],
  composition: ['adoptedCompositions', 'boundedRoleUseTransitions', 'unresolvedCompositions', 'unsupportedCompositions', 'blockedCompositions', 'notApplicableCompositions', 'ambiguousCompositions', 'lineageConflicts'],
})

const STRUCTURAL_CONTRACT_BY_RULE_ID = new Map(SAJU_LINEAGE_STRUCTURAL_CONTRACTS.map(contract => [contract.ruleId, contract]))
const STRUCTURAL_RULE_BY_RULE_ID = new Map(SAJU_LINEAGE_RULES.map(rule => [rule.ruleId, rule]))
const SEMANTIC_CONTRACT_BY_RULE_ID = new Map([
  ...SAJU_ZIPING_SOURCE_SEMANTIC_CONTRACTS,
  ...SAJU_SANMING_SOURCE_SEMANTIC_CONTRACTS,
].map(contract => [contract.ruleId, contract]))
const SEMANTIC_RULE_BY_RULE_ID = new Map([
  ...SAJU_ZIPING_SOURCE_SEMANTIC_RULES,
  ...SAJU_SANMING_SOURCE_SEMANTIC_RULES,
].map(rule => [rule.ruleId, rule]))
const LEXICON_ENTRY_BY_ID = new Map(SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON.map(entry => [entry.entryId, entry]))
const COMPOSITION_BY_ID = new Map(SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_RULES.map(composition => [composition.compositionId, composition]))
const SOURCE_BY_ID = new Map(SAJU_LINEAGE_SOURCE_PROFILES.map(source => [source.sourceId, source]))
const LOCATOR_BY_ID = new Map(SAJU_LINEAGE_LOCATORS.map(locator => [locator.observationId, locator]))

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const isNonEmptyString = value => typeof value === 'string' && value.trim().length > 0
const unique = values => [...new Set(values)]

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function sortedUnique(values) {
  return [...new Set(values)].sort()
}

function addError(errors, message) {
  if (!errors.includes(message)) errors.push(message)
}

function expectedSourceHashes(sourceIds) {
  return Object.fromEntries(sourceIds.map(sourceId => [sourceId, SOURCE_BY_ID.get(sourceId)?.byteSha256 || null]))
}

function sourceRefsFor(sourceIds = [], locatorIds = []) {
  return {
    sourceIds: [...sourceIds],
    locatorIds: [...locatorIds],
    sourceByteSha256: expectedSourceHashes(sourceIds),
  }
}

function sourceIdentityRefs(sourceIds) {
  return sourceIds.map(sourceId => {
    const source = SOURCE_BY_ID.get(sourceId)
    return source
      ? {
        sourceId: source.sourceId,
        work: source.work,
        editionIdentity: source.editionIdentity,
        lineageStatus: source.lineageStatus,
        independenceStatus: source.independenceStatus,
        byteSha256: source.byteSha256,
      }
      : { sourceId }
  })
}

function locatorRefs(locatorIds) {
  return locatorIds.map(locatorId => {
    const locator = LOCATOR_BY_ID.get(locatorId)
    return locator
      ? {
        locatorId: locator.observationId,
        sourceId: locator.sourceId,
        locator: clone(locator.locator),
      }
      : { locatorId }
  })
}

function sourceAndLocatorUnion(items) {
  const sourceIds = []
  const locatorIds = []
  for (const item of items) {
    for (const sourceId of item?.sourceIds || []) if (!sourceIds.includes(sourceId)) sourceIds.push(sourceId)
    for (const locatorId of item?.locatorIds || []) if (!locatorIds.includes(locatorId)) locatorIds.push(locatorId)
  }
  return { sourceIds, locatorIds }
}

function canonicalItemFor(lane, payload) {
  if (lane === 'structural') return payload?.ruleId ? STRUCTURAL_CONTRACT_BY_RULE_ID.get(payload.ruleId) || null : null
  if (lane === 'semantic') return payload?.ruleId ? SEMANTIC_CONTRACT_BY_RULE_ID.get(payload.ruleId) || null : null
  if (lane === 'semanticLexicon') return payload?.entryId ? LEXICON_ENTRY_BY_ID.get(payload.entryId) || null : null
  if (lane === 'composition') return payload?.compositionId ? COMPOSITION_BY_ID.get(payload.compositionId) || null : null
  return null
}

function canonicalItemsForState(lane, payload) {
  if (!isObject(payload)) return []
  const ids = Array.isArray(payload.ruleIds) ? payload.ruleIds : []
  if (lane === 'structural' || lane === 'semantic') {
    const maps = lane === 'structural'
      ? [STRUCTURAL_CONTRACT_BY_RULE_ID, STRUCTURAL_RULE_BY_RULE_ID]
      : [SEMANTIC_CONTRACT_BY_RULE_ID, SEMANTIC_RULE_BY_RULE_ID, STRUCTURAL_CONTRACT_BY_RULE_ID, STRUCTURAL_RULE_BY_RULE_ID]
    const items = []
    for (const byId of maps) {
      if (payload.ruleId && byId.has(payload.ruleId)) items.push(byId.get(payload.ruleId))
      for (const ruleId of ids) if (byId.has(ruleId)) items.push(byId.get(ruleId))
    }
    return items
  }
  if (lane === 'semanticLexicon' && payload.entryId && LEXICON_ENTRY_BY_ID.has(payload.entryId)) return [LEXICON_ENTRY_BY_ID.get(payload.entryId)]
  if (lane === 'composition') {
    const items = []
    if (payload.compositionId && COMPOSITION_BY_ID.has(payload.compositionId)) items.push(COMPOSITION_BY_ID.get(payload.compositionId))
    for (const ruleId of ids) {
      if (STRUCTURAL_CONTRACT_BY_RULE_ID.has(ruleId)) items.push(STRUCTURAL_CONTRACT_BY_RULE_ID.get(ruleId))
      if (SEMANTIC_CONTRACT_BY_RULE_ID.has(ruleId)) items.push(SEMANTIC_CONTRACT_BY_RULE_ID.get(ruleId))
    }
    return items
  }
  return []
}

function baseFactRefsFor(payload) {
  const refs = []
  for (const binding of payload?.commonBaseFacts || []) if (isObject(binding) && isNonEmptyString(binding.factRef)) refs.push(binding.factRef)
  for (const ref of payload?.provenance?.baseFactRefs || []) if (isNonEmptyString(ref)) refs.push(ref)
  for (const ref of payload?.provenance?.chain?.baseFactRefs || []) if (isNonEmptyString(ref)) refs.push(ref)
  return unique(refs)
}

function resultIdFor(lane, payload) {
  if (lane === 'semanticLexicon') return payload?.entryId ? `lexicon-entry.${payload.entryId}` : null
  return isNonEmptyString(payload?.resultId) ? payload.resultId : null
}

function recordIdFor(lane, category, payload, index) {
  const rawId = payload?.resultId || payload?.entryId || payload?.conflictId || payload?.compositionId || payload?.ruleId || `index-${index}`
  return `saju.${lane}.${category}.${rawId}`
}

function recordRefsFor(lane, payload, isConflict = false) {
  const canonical = isConflict ? canonicalItemsForState(lane, payload) : [canonicalItemFor(lane, payload)].filter(Boolean)
  const canonicalRefs = sourceAndLocatorUnion(canonical)
  const sourceIds = Array.isArray(payload?.sourceIds) && payload.sourceIds.length > 0
    ? [...payload.sourceIds]
    : canonicalRefs.sourceIds
  const locatorIds = Array.isArray(payload?.locatorIds) && payload.locatorIds.length > 0
    ? [...payload.locatorIds]
    : canonicalRefs.locatorIds
  return sourceRefsFor(sourceIds, locatorIds)
}

function recordLineagesFor(lane, payload, sourceRefs) {
  if (isNonEmptyString(payload?.lineage)) return [payload.lineage]
  const canonical = canonicalItemsForState(lane, payload)
  const lineages = canonical.map(item => item?.lineage).filter(isNonEmptyString)
  if (lineages.length > 0) return unique(lineages)
  return sourceRefs.sourceIds.map(sourceId => {
    const structural = [...STRUCTURAL_CONTRACT_BY_RULE_ID.values()].find(item => item.sourceIds.includes(sourceId))
    const semantic = [...SEMANTIC_CONTRACT_BY_RULE_ID.values()].find(item => item.sourceIds.includes(sourceId))
    return structural?.lineage || semantic?.lineage || null
  }).filter(isNonEmptyString).filter((value, index, list) => list.indexOf(value) === index)
}

function makeRecord(lane, category, payload, index) {
  const isConflict = category === 'lineageConflicts'
  const sourceRefs = recordRefsFor(lane, payload, isConflict)
  const lineages = recordLineagesFor(lane, payload, sourceRefs)
  const resultId = resultIdFor(lane, payload)
  const recordId = recordIdFor(lane, category, payload, index)
  return {
    recordId,
    lane,
    category,
    resultId,
    lineage: lineages.length === 1 ? lineages[0] : null,
    lineages,
    sourceRefs,
    provenance: {
      schema: SAJU_LINEAGE_HANDOFF_EVIDENCE_SCHEMA,
      version: SAJU_LINEAGE_HANDOFF_EVIDENCE_VERSION,
      lane,
      category,
      recordId,
      sourceIds: [...sourceRefs.sourceIds],
      locatorIds: [...sourceRefs.locatorIds],
      sourceByteSha256: { ...sourceRefs.sourceByteSha256 },
      baseFactRefs: baseFactRefsFor(payload),
      upstream: payload?.provenance ? clone(payload.provenance) : null,
    },
    payload: clone(payload),
  }
}

function makeResultRecords(lane, payloads) {
  return payloads.map((payload, index) => makeRecord(lane, 'derived', payload, index))
}

function makeStateRecords(lane, category, payloads) {
  return payloads.map((payload, index) => makeRecord(lane, category, payload, index))
}

function stateFromCategories(lane, categories) {
  return Object.fromEntries(SOURCE_STATE_CATEGORIES[lane].map(category => [
    category,
    makeStateRecords(lane, category, categories?.[category] || []),
  ]))
}

function collectRecords(envelope) {
  return [
    ...(envelope.evidence.structuralResults || []),
    ...(envelope.evidence.semanticResults.ziping || []),
    ...(envelope.evidence.semanticResults.sanming || []),
    ...(envelope.evidence.semanticLexiconEntries || []),
    ...(envelope.evidence.compositionResults || []),
    ...Object.values(envelope.state.structural).flat(),
    ...Object.values(envelope.state.semantic.ziping).flat(),
    ...Object.values(envelope.state.semantic.sanming).flat(),
    ...Object.values(envelope.state.semanticLexicon).flat(),
    ...Object.values(envelope.state.composition).flat(),
  ]
}

function globalProvenance(records) {
  const sourceIds = unique(records.flatMap(record => record.sourceRefs.sourceIds))
  const locatorIds = unique(records.flatMap(record => record.sourceRefs.locatorIds))
  return {
    sourceRefs: sourceRefsFor(sourceIds, locatorIds),
    sources: sourceIdentityRefs(sourceIds),
    locators: locatorRefs(locatorIds),
    recordIds: records.map(record => record.recordId),
  }
}

function expectedGrammarContractErrors() {
  return [
    ...checkSajuLineageReadingGrammar(),
    ...checkSajuLineageStructuralResultContract(),
    ...checkSajuLineageSourceSemanticResultContract(),
    ...checkSajuSanmingSourceSemanticResultContract(),
    ...checkSajuSourceBoundedSemanticLexicon(),
    ...checkSajuSourceLocalSemanticComposition(),
  ]
}

function emptyEvidence() {
  return {
    structuralResults: [],
    semanticResults: { ziping: [], sanming: [] },
    semanticLexiconEntries: [],
    compositionResults: [],
  }
}

function emptyState() {
  return {
    structural: stateFromCategories('structural', {}),
    semantic: { ziping: stateFromCategories('semantic', {}), sanming: stateFromCategories('semantic', {}) },
    semanticLexicon: stateFromCategories('semanticLexicon', {}),
    composition: stateFromCategories('composition', {}),
    commonCandidates: { semantic: [], composition: [] },
  }
}

function blockedBuild(errors, base) {
  return {
    valid: false,
    errors: [...new Set(errors)].sort(),
    envelope: null,
    baseValidation: validateDeterministicBaseForInterpretation(base),
  }
}

function preflightInput({ base, structuralResults, semanticResults, semanticLexiconResults, compositionResults } = {}) {
  const errors = []
  const baseValidation = validateDeterministicBaseForInterpretation(base)
  if (!baseValidation.valid) errors.push(...baseValidation.errors.map(error => `base:${error}`))
  if (!isObject(structuralResults)) errors.push('structural_results_missing')
  if (!isObject(semanticResults) || !isObject(semanticResults.ziping) || !isObject(semanticResults.sanming)) errors.push('semantic_results_by_lineage_missing')
  if (!isObject(semanticLexiconResults)) errors.push('semantic_lexicon_results_missing')
  if (!isObject(compositionResults)) errors.push('composition_results_missing')

  if (isObject(structuralResults) && structuralResults.contractValidation?.valid !== true) errors.push('structural_contract_not_valid')
  for (const lineage of ['ziping', 'sanming']) {
    if (isObject(semanticResults?.[lineage]) && semanticResults[lineage].contractValidation?.valid !== true) errors.push(`semantic_contract_not_valid:${lineage}`)
  }
  if (isObject(semanticLexiconResults) && semanticLexiconResults.lexiconValidation?.valid !== true) errors.push('semantic_lexicon_contract_not_valid')
  if (isObject(compositionResults) && compositionResults.compositionValidation?.valid !== true) errors.push('composition_contract_not_valid')

  for (const [lane, categories] of [
    ['structural', structuralResults?.categories],
    ['semantic', semanticResults?.ziping?.categories],
    ['semantic', semanticResults?.sanming?.categories],
    ['semanticLexicon', semanticLexiconResults?.categories],
    ['composition', compositionResults?.categories],
  ]) {
    for (const category of SOURCE_STATE_CATEGORIES[lane]) if (!Array.isArray(categories?.[category])) errors.push(`state_category_missing:${lane}:${category}`)
  }
  if (!Array.isArray(structuralResults?.categories?.derivedStructuralResults)) errors.push('derived_structural_results_missing')
  if (!Array.isArray(semanticResults?.ziping?.categories?.derivedSourceBoundedSemanticResults)) errors.push('derived_ziping_semantic_results_missing')
  if (!Array.isArray(semanticResults?.sanming?.categories?.derivedSourceBoundedSemanticResults)) errors.push('derived_sanming_semantic_results_missing')
  if (!Array.isArray(semanticLexiconResults?.categories?.resolvedSemanticEntries)) errors.push('resolved_semantic_lexicon_entries_missing')
  if (!Array.isArray(compositionResults?.categories?.derivedCompositionResults)) errors.push('derived_composition_results_missing')

  const grammarErrors = expectedGrammarContractErrors()
  if (grammarErrors.length > 0) errors.push(...grammarErrors.map(error => `grammar:${error}`))
  if (SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_FREEZE_DECISION.v0FreezeReady !== true) errors.push('composition_v0_not_frozen')
  if (SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_READINESS.compositionReady !== false || SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_READINESS.interpretationHypothesisReady !== false) errors.push('composition_readiness_boundary_changed')
  return { errors: [...new Set(errors)].sort(), baseValidation }
}

function makeEnvelope({ base, structuralResults, semanticResults, semanticLexiconResults, compositionResults }) {
  const evidence = {
    structuralResults: makeResultRecords('structural', structuralResults.categories.derivedStructuralResults),
    semanticResults: {
      ziping: makeResultRecords('semantic', semanticResults.ziping.categories.derivedSourceBoundedSemanticResults),
      sanming: makeResultRecords('semantic', semanticResults.sanming.categories.derivedSourceBoundedSemanticResults),
    },
    semanticLexiconEntries: makeResultRecords('semanticLexicon', semanticLexiconResults.categories.resolvedSemanticEntries),
    compositionResults: makeResultRecords('composition', compositionResults.categories.derivedCompositionResults),
  }
  const state = {
    structural: stateFromCategories('structural', structuralResults.categories),
    semantic: {
      ziping: stateFromCategories('semantic', semanticResults.ziping.categories),
      sanming: stateFromCategories('semantic', semanticResults.sanming.categories),
    },
    semanticLexicon: stateFromCategories('semanticLexicon', semanticLexiconResults.categories),
    composition: stateFromCategories('composition', compositionResults.categories),
    commonCandidates: {
      semantic: [
        ...(semanticLexiconResults.categories.commonSemanticCandidates || []),
      ],
      composition: [...(compositionResults.commonCompositionCandidates || [])],
    },
  }
  const records = collectRecords({ evidence, state })
  const baseFactRefs = unique(records.flatMap(record => record.provenance.baseFactRefs))
  return {
    schemaVersion: SAJU_LINEAGE_HANDOFF_EVIDENCE_SCHEMA,
    version: SAJU_LINEAGE_HANDOFF_EVIDENCE_VERSION,
    kind: SAJU_LINEAGE_HANDOFF_EVIDENCE_KIND,
    grammar: {
      schemaVersion: SAJU_LINEAGE_READING_GRAMMAR_SCHEMA,
      version: SAJU_LINEAGE_READING_GRAMMAR_VERSION,
      sourceSetFrozen: true,
      commonCandidates: [],
      compositionReady: false,
      interpretationHypothesisReady: false,
    },
    baseContract: {
      schemaVersion: base.schemaVersion,
      foundationVersion: base.foundationVersion,
      factRefs: baseFactRefs,
    },
    evidence,
    state,
    provenance: globalProvenance(records),
    boundary: {
      precomputedOnly: true,
      noRecalculation: true,
      noPersonalMeaning: true,
      noSemanticExpansion: true,
      noCrossLineageMerge: true,
      noWinnerSelection: true,
      unresolvedPreserved: true,
      conflictsPreserved: true,
      sourceAuthorityPromotion: false,
      claimPromotion: false,
      interpretationHypothesis: false,
    },
    readiness: {
      userExperienceGate: 'required_before_personal_application',
      userExperienceProvided: false,
      interpretationHypothesisReady: false,
      compositionReady: false,
      globalCompositionReady: false,
    },
  }
}

function exactKeys(value, expected, path, errors) {
  if (!isObject(value)) {
    addError(errors, `${path}:not_object`)
    return
  }
  for (const key of expected) if (!Object.hasOwn(value, key)) addError(errors, `${path}:missing:${key}`)
  for (const key of Object.keys(value)) if (!expected.includes(key)) addError(errors, `${path}:unexpected:${key}`)
}

function arraysEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function validateSourceRefs(record, errors, path) {
  exactKeys(record.sourceRefs, ['sourceIds', 'locatorIds', 'sourceByteSha256'], `${path}.sourceRefs`, errors)
  const sourceOptional = record.lane === 'structural'
    && record.category === 'unsupportedRules'
    && record.lineage === 'none'
  const sourceIds = Array.isArray(record.sourceRefs?.sourceIds) ? record.sourceRefs.sourceIds : []
  const locatorIds = Array.isArray(record.sourceRefs?.locatorIds) ? record.sourceRefs.locatorIds : []
  const sourceHashes = isObject(record.sourceRefs?.sourceByteSha256) ? record.sourceRefs.sourceByteSha256 : {}
  if (!Array.isArray(record.sourceRefs?.sourceIds) || (!sourceOptional && sourceIds.length === 0)) addError(errors, `${path}:source_ids_missing`)
  if (!Array.isArray(record.sourceRefs?.locatorIds) || (!sourceOptional && locatorIds.length === 0)) addError(errors, `${path}:locator_ids_missing`)
  if (new Set(sourceIds).size !== sourceIds.length) addError(errors, `${path}:source_ids_duplicate`)
  if (new Set(locatorIds).size !== locatorIds.length) addError(errors, `${path}:locator_ids_duplicate`)
  if (!arraysEqual(sortedUnique(Object.keys(sourceHashes)), sortedUnique(sourceIds))) addError(errors, `${path}:source_hash_keys_mismatch`)
  for (const sourceId of sourceIds) {
    const source = SOURCE_BY_ID.get(sourceId)
    if (!source) addError(errors, `${path}:source_unknown:${sourceId}`)
    else if (sourceHashes[sourceId] !== source.byteSha256) addError(errors, `${path}:source_hash_mismatch:${sourceId}`)
  }
  for (const locatorId of locatorIds) {
    const locator = LOCATOR_BY_ID.get(locatorId)
    if (!locator) addError(errors, `${path}:locator_unknown:${locatorId}`)
    else if (!sourceIds.includes(locator.sourceId)) addError(errors, `${path}:locator_source_mismatch:${locatorId}`)
  }
}

function validateRecord(record, lane, category, base, errors, path) {
  if (!isObject(record)) {
    addError(errors, `${path}:not_object`)
    return
  }
  exactKeys(record, ['recordId', 'lane', 'category', 'resultId', 'lineage', 'lineages', 'sourceRefs', 'provenance', 'payload'], path, errors)
  if (record.lane !== lane) addError(errors, `${path}:lane_mismatch`)
  if (record.category !== category) addError(errors, `${path}:category_mismatch`)
  if (!isNonEmptyString(record.recordId)) addError(errors, `${path}:record_id_missing`)
  if (!Array.isArray(record.lineages) || record.lineages.some(lineage => !isNonEmptyString(lineage))) addError(errors, `${path}:lineages_invalid`)
  if (record.lineages?.length === 1 && record.lineage !== record.lineages[0]) addError(errors, `${path}:lineage_mismatch`)
  if (record.lineages?.length !== 1 && record.lineage !== null) addError(errors, `${path}:multi_lineage_requires_null_lineage`)
  validateSourceRefs(record, errors, path)
  exactKeys(record.provenance, ['schema', 'version', 'lane', 'category', 'recordId', 'sourceIds', 'locatorIds', 'sourceByteSha256', 'baseFactRefs', 'upstream'], `${path}.provenance`, errors)
  if (record.provenance?.schema !== SAJU_LINEAGE_HANDOFF_EVIDENCE_SCHEMA || record.provenance?.version !== SAJU_LINEAGE_HANDOFF_EVIDENCE_VERSION) addError(errors, `${path}:provenance_schema_mismatch`)
  if (record.provenance?.lane !== lane || record.provenance?.category !== category || record.provenance?.recordId !== record.recordId) addError(errors, `${path}:provenance_identity_mismatch`)
  if (!arraysEqual(record.provenance?.sourceIds, record.sourceRefs?.sourceIds) || !arraysEqual(record.provenance?.locatorIds, record.sourceRefs?.locatorIds) || JSON.stringify(record.provenance?.sourceByteSha256) !== JSON.stringify(record.sourceRefs?.sourceByteSha256)) addError(errors, `${path}:provenance_refs_mismatch`)
  if (!Array.isArray(record.provenance?.baseFactRefs)) addError(errors, `${path}:provenance_fact_refs_missing`)
  if (new Set(record.provenance?.baseFactRefs || []).size !== (record.provenance?.baseFactRefs || []).length) addError(errors, `${path}:provenance_fact_refs_duplicate`)
  if (!arraysEqual(record.provenance?.baseFactRefs || [], baseFactRefsFor(record.payload))) addError(errors, `${path}:provenance_fact_refs_not_bound_to_payload`)
  for (const factRef of record.provenance?.baseFactRefs || []) {
    if (!isDeterministicFactRef(base, factRef)) addError(errors, `${path}:fact_ref_invalid:${factRef}`)
  }
  if (!isObject(record.payload)) addError(errors, `${path}:payload_not_object`)
}

function validateCanonicalIdentity(record, lane, category, errors, path) {
  if (!isObject(record) || !isObject(record.payload)) return
  const payload = record.payload
  const isDerived = category === 'derived'
  const canonical = isDerived ? canonicalItemFor(lane, payload) : canonicalItemsForState(lane, payload)
  if (isDerived && !canonical) addError(errors, `${path}:canonical_item_unknown`)
  if (!isDerived && canonical.length === 0) addError(errors, `${path}:state_canonical_item_unknown`)
  const canonicalRefs = sourceAndLocatorUnion(isDerived ? [canonical].filter(Boolean) : canonical)
  if (!arraysEqual(sortedUnique(record.sourceRefs?.sourceIds), sortedUnique(canonicalRefs.sourceIds))) addError(errors, `${path}:canonical_source_refs_mismatch`)
  if (!arraysEqual(sortedUnique(record.sourceRefs?.locatorIds), sortedUnique(canonicalRefs.locatorIds))) addError(errors, `${path}:canonical_locator_refs_mismatch`)
  const canonicalLineages = sortedUnique((isDerived ? [canonical] : canonical).map(item => item?.lineage).filter(isNonEmptyString))
  if (!arraysEqual(sortedUnique(record.lineages || []), canonicalLineages)) addError(errors, `${path}:canonical_lineage_mismatch`)
  if (Array.isArray(payload.sourceIds) && !arraysEqual(sortedUnique(payload.sourceIds), sortedUnique(canonicalRefs.sourceIds))) addError(errors, `${path}:payload_source_refs_mismatch`)
  if (Array.isArray(payload.locatorIds) && !arraysEqual(sortedUnique(payload.locatorIds), sortedUnique(canonicalRefs.locatorIds))) addError(errors, `${path}:payload_locator_refs_mismatch`)
  if (isNonEmptyString(payload.lineage) && !canonicalLineages.includes(payload.lineage)) addError(errors, `${path}:payload_lineage_mismatch`)

  if (isDerived) {
    if (lane === 'semanticLexicon') {
      if (payload.lookupStatus !== 'resolved_from_lineage_result') addError(errors, `${path}:lexicon_not_resolved`)
      if (record.resultId !== `lexicon-entry.${payload.entryId}`) addError(errors, `${path}:lexicon_result_id_mismatch`)
      if (payload.deterministic !== true || payload.noPersonalMeaning !== true || payload.noCrossLineageMerge !== true || payload.interpretationHypothesis !== false) addError(errors, `${path}:lexicon_boundary_invalid`)
    } else {
      if (record.resultId !== payload.resultId) addError(errors, `${path}:result_id_mismatch`)
      if (payload.executionStatus !== 'executable_from_frozen_base') addError(errors, `${path}:result_not_executable`)
      if (payload.deterministic !== true || payload.noRecalculation !== true) addError(errors, `${path}:result_boundary_invalid`)
      if (lane === 'structural' && (payload.classification !== 'derived_structural_result' || payload.noSemanticMeaning !== true)) addError(errors, `${path}:structural_result_boundary_invalid`)
      if (lane === 'semantic' && (payload.classification !== 'derived_source_bounded_semantic_result' || payload.noPersonalMeaning !== true || payload.noCrossLineageMerge !== true || payload.semanticExpansion !== false)) addError(errors, `${path}:semantic_result_boundary_invalid`)
      if (lane === 'composition' && (!['derived_source_local_semantic_composition_result', 'derived_bounded_role_use_transition_result'].includes(payload.classification) || payload.noPersonalMeaning !== true || payload.noCrossLineageMerge !== true || payload.interpretationHypothesis !== false || payload.winnerSelected !== false || payload.semanticExpansion !== false)) addError(errors, `${path}:composition_result_boundary_invalid`)
    }
  }
}

function validateStateAndEvidenceRecords(envelope, base, errors) {
  const seen = new Set()
  const allRecords = []
  const evidence = isObject(envelope.evidence) ? envelope.evidence : {}
  const semanticEvidence = isObject(evidence.semanticResults) ? evidence.semanticResults : {}
  const state = isObject(envelope.state) ? envelope.state : {}
  const semanticState = isObject(state.semantic) ? state.semantic : {}
  const visit = (records, lane, category) => {
    if (!Array.isArray(records)) {
      addError(errors, `records_not_array:${lane}:${category}`)
      return
    }
    for (const [index, record] of records.entries()) {
      const path = `records.${lane}.${category}[${index}]`
      validateRecord(record, lane, category, base, errors, path)
      validateCanonicalIdentity(record, lane, category, errors, path)
      if (seen.has(record?.recordId)) addError(errors, `record_id_duplicate:${record?.recordId}`)
      seen.add(record?.recordId)
      allRecords.push(record)
    }
  }
  visit(evidence.structuralResults, 'structural', 'derived')
  visit(semanticEvidence.ziping, 'semantic', 'derived')
  visit(semanticEvidence.sanming, 'semantic', 'derived')
  visit(evidence.semanticLexiconEntries, 'semanticLexicon', 'derived')
  visit(evidence.compositionResults, 'composition', 'derived')
  const structuralState = isObject(state.structural) ? state.structural : {}
  for (const category of SOURCE_STATE_CATEGORIES.structural) visit(structuralState[category], 'structural', category)
  for (const lineage of ['ziping', 'sanming']) {
    const lineageState = isObject(semanticState[lineage]) ? semanticState[lineage] : {}
    for (const category of SOURCE_STATE_CATEGORIES.semantic) visit(lineageState[category], 'semantic', category)
  }
  const lexiconState = isObject(state.semanticLexicon) ? state.semanticLexicon : {}
  for (const category of SOURCE_STATE_CATEGORIES.semanticLexicon) visit(lexiconState[category], 'semanticLexicon', category)
  const compositionState = isObject(state.composition) ? state.composition : {}
  for (const category of SOURCE_STATE_CATEGORIES.composition) visit(compositionState[category], 'composition', category)
  return allRecords
}

function validateGlobalProvenance(envelope, records, errors) {
  exactKeys(envelope.provenance, ['sourceRefs', 'sources', 'locators', 'recordIds'], 'provenance', errors)
  if (!isObject(envelope.provenance)) return
  const allSourceIds = unique(records.flatMap(record => record?.sourceRefs?.sourceIds || []))
  const allLocatorIds = unique(records.flatMap(record => record?.sourceRefs?.locatorIds || []))
  const expectedRefs = sourceRefsFor(allSourceIds, allLocatorIds)
  const actualRefs = envelope.provenance.sourceRefs
  if (!isObject(actualRefs)) {
    addError(errors, 'global_provenance_refs_missing')
  } else if (!arraysEqual(actualRefs.sourceIds, expectedRefs.sourceIds) || !arraysEqual(actualRefs.locatorIds, expectedRefs.locatorIds) || JSON.stringify(actualRefs.sourceByteSha256) !== JSON.stringify(expectedRefs.sourceByteSha256)) addError(errors, 'global_provenance_refs_mismatch')
  if (!arraysEqual(envelope.provenance.recordIds, records.map(record => record?.recordId))) addError(errors, 'global_provenance_record_ids_mismatch')
  const sourceIds = Array.isArray(envelope.provenance.sources) ? envelope.provenance.sources.map(source => source?.sourceId) : []
  const locatorIds = Array.isArray(envelope.provenance.locators) ? envelope.provenance.locators.map(locator => locator?.locatorId) : []
  if (!arraysEqual(sourceIds, expectedRefs.sourceIds)) addError(errors, 'global_provenance_sources_mismatch')
  if (!arraysEqual(locatorIds, expectedRefs.locatorIds)) addError(errors, 'global_provenance_locators_mismatch')
  if (JSON.stringify(envelope.provenance.sources) !== JSON.stringify(sourceIdentityRefs(expectedRefs.sourceIds))) addError(errors, 'global_provenance_source_identity_mismatch')
  if (JSON.stringify(envelope.provenance.locators) !== JSON.stringify(locatorRefs(expectedRefs.locatorIds))) addError(errors, 'global_provenance_locator_identity_mismatch')
}

/**
 * Validate an envelope against the frozen public Base and current lineage
 * contracts.  Validation only checks identity, shape, provenance, and
 * boundaries; it never reruns a lineage rule.
 */
export function validateSajuLineageHandoffEvidenceEnvelope(envelope, base) {
  const errors = []
  const baseValidation = validateDeterministicBaseForInterpretation(base)
  if (!baseValidation.valid) errors.push(...baseValidation.errors.map(error => `base:${error}`))
  if (!isObject(envelope)) return { valid: false, errors: ['envelope_not_object', ...errors].sort(), baseValidation }
  exactKeys(envelope, ['schemaVersion', 'version', 'kind', 'grammar', 'baseContract', 'evidence', 'state', 'provenance', 'boundary', 'readiness'], '$', errors)
  if (envelope.schemaVersion !== SAJU_LINEAGE_HANDOFF_EVIDENCE_SCHEMA || envelope.version !== SAJU_LINEAGE_HANDOFF_EVIDENCE_VERSION || envelope.kind !== SAJU_LINEAGE_HANDOFF_EVIDENCE_KIND) errors.push('envelope_schema_mismatch')

  exactKeys(envelope.grammar, ['schemaVersion', 'version', 'sourceSetFrozen', 'commonCandidates', 'compositionReady', 'interpretationHypothesisReady'], 'grammar', errors)
  if (envelope.grammar?.schemaVersion !== SAJU_LINEAGE_READING_GRAMMAR_SCHEMA || envelope.grammar?.version !== SAJU_LINEAGE_READING_GRAMMAR_VERSION || envelope.grammar?.sourceSetFrozen !== true || !Array.isArray(envelope.grammar?.commonCandidates) || envelope.grammar.commonCandidates.length !== 0 || envelope.grammar?.compositionReady !== false || envelope.grammar?.interpretationHypothesisReady !== false) errors.push('grammar_boundary_invalid')

  exactKeys(envelope.baseContract, ['schemaVersion', 'foundationVersion', 'factRefs'], 'baseContract', errors)
  if (envelope.baseContract?.schemaVersion !== base?.schemaVersion || envelope.baseContract?.foundationVersion !== base?.foundationVersion) errors.push('base_contract_identity_mismatch')
  if (!Array.isArray(envelope.baseContract?.factRefs)) errors.push('base_fact_refs_missing')
  const baseFactRefs = envelope.baseContract?.factRefs || []
  if (new Set(baseFactRefs).size !== baseFactRefs.length) errors.push('base_fact_refs_duplicate')
  for (const factRef of baseFactRefs) if (!isDeterministicFactRef(base, factRef)) errors.push(`base_fact_ref_invalid:${factRef}`)

  exactKeys(envelope.evidence, ['structuralResults', 'semanticResults', 'semanticLexiconEntries', 'compositionResults'], 'evidence', errors)
  exactKeys(envelope.evidence?.semanticResults, ['ziping', 'sanming'], 'evidence.semanticResults', errors)
  exactKeys(envelope.state, ['structural', 'semantic', 'semanticLexicon', 'composition', 'commonCandidates'], 'state', errors)
  exactKeys(envelope.state?.semantic, ['ziping', 'sanming'], 'state.semantic', errors)
  for (const [path, lane, value] of [
    ['state.structural', 'structural', envelope.state?.structural],
    ['state.semantic.ziping', 'semantic', envelope.state?.semantic?.ziping],
    ['state.semantic.sanming', 'semantic', envelope.state?.semantic?.sanming],
    ['state.semanticLexicon', 'semanticLexicon', envelope.state?.semanticLexicon],
    ['state.composition', 'composition', envelope.state?.composition],
  ]) {
    exactKeys(value, SOURCE_STATE_CATEGORIES[lane], path, errors)
  }
  exactKeys(envelope.state?.commonCandidates, ['semantic', 'composition'], 'state.commonCandidates', errors)
  if ((envelope.state?.commonCandidates?.semantic || []).length !== 0 || (envelope.state?.commonCandidates?.composition || []).length !== 0) errors.push('common_candidate_present')

  exactKeys(envelope.boundary, ['precomputedOnly', 'noRecalculation', 'noPersonalMeaning', 'noSemanticExpansion', 'noCrossLineageMerge', 'noWinnerSelection', 'unresolvedPreserved', 'conflictsPreserved', 'sourceAuthorityPromotion', 'claimPromotion', 'interpretationHypothesis'], 'boundary', errors)
  if (envelope.boundary?.precomputedOnly !== true || envelope.boundary?.noRecalculation !== true || envelope.boundary?.noPersonalMeaning !== true || envelope.boundary?.noSemanticExpansion !== true || envelope.boundary?.noCrossLineageMerge !== true || envelope.boundary?.noWinnerSelection !== true || envelope.boundary?.unresolvedPreserved !== true || envelope.boundary?.conflictsPreserved !== true || envelope.boundary?.sourceAuthorityPromotion !== false || envelope.boundary?.claimPromotion !== false || envelope.boundary?.interpretationHypothesis !== false) errors.push('handoff_boundary_invalid')

  exactKeys(envelope.readiness, ['userExperienceGate', 'userExperienceProvided', 'interpretationHypothesisReady', 'compositionReady', 'globalCompositionReady'], 'readiness', errors)
  if (envelope.readiness?.userExperienceGate !== 'required_before_personal_application' || envelope.readiness?.userExperienceProvided !== false || envelope.readiness?.interpretationHypothesisReady !== false || envelope.readiness?.compositionReady !== false || envelope.readiness?.globalCompositionReady !== false) errors.push('handoff_readiness_invalid')

  if (isObject(envelope.evidence) && isObject(envelope.evidence.semanticResults) && isObject(envelope.state)) {
    const records = validateStateAndEvidenceRecords(envelope, base, errors)
    validateGlobalProvenance(envelope, records, errors)
    const expectedFactRefs = unique(records.flatMap(record => record?.provenance?.baseFactRefs || []))
    if (!arraysEqual(envelope.baseContract.factRefs, expectedFactRefs)) errors.push('base_fact_refs_not_equal_to_evidence_chain')
  }
  return {
    valid: [...new Set(errors)].length === 0,
    errors: [...new Set(errors)].sort(),
    baseValidation,
  }
}

/**
 * Build the envelope from caller-supplied, already derived result objects.
 * Missing or malformed result containers return no envelope and never trigger
 * a fallback derivation.
 */
export function buildSajuLineageHandoffEvidenceEnvelope(input = {}) {
  const preflight = preflightInput(input)
  if (preflight.errors.length > 0) return blockedBuild(preflight.errors, input.base)
  const envelope = makeEnvelope(input)
  const validation = validateSajuLineageHandoffEvidenceEnvelope(envelope, input.base)
  return {
    valid: validation.valid,
    errors: validation.errors,
    envelope: validation.valid ? envelope : null,
    baseValidation: validation.baseValidation,
  }
}

export function exportSajuLineageHandoffEvidenceJson(envelope, indent = 2) {
  return JSON.stringify(envelope, null, indent)
}

/**
 * Reconsume a serialized envelope from an actual file/transport surface.
 * Invalid JSON or invalid provenance returns no envelope.
 */
export function consumeSajuLineageHandoffEvidenceEnvelope(serialized, base) {
  let envelope
  try {
    envelope = typeof serialized === 'string' ? JSON.parse(serialized) : clone(serialized)
  } catch {
    return { valid: false, errors: ['envelope_json_invalid'], envelope: null, baseValidation: validateDeterministicBaseForInterpretation(base) }
  }
  const validation = validateSajuLineageHandoffEvidenceEnvelope(envelope, base)
  return {
    valid: validation.valid,
    errors: validation.errors,
    envelope: validation.valid ? envelope : null,
    baseValidation: validation.baseValidation,
  }
}

function factEvidenceId(factRef) {
  return `saju.base-fact.${encodeURIComponent(factRef)}`
}

function sourceEvidenceId(record) {
  return `saju.source-evidence.${record.recordId}`
}

function stateStatus(category) {
  if (category === 'contextBoundCandidates' || category === 'contextBoundEntries') return 'candidate'
  if (category === 'unsupportedRules' || category === 'unsupportedEntries' || category === 'unsupportedCompositions') return 'unsupported'
  if (category === 'blockedEntries' || category === 'blockedCompositions' || category === 'prerequisiteGaps') return 'blocked'
  if (category === 'ambiguousEntries' || category === 'ambiguousCompositions') return 'ambiguous'
  if (category === 'notApplicableRules' || category === 'notApplicableEntries' || category === 'notApplicableCompositions') return 'not_applicable'
  return 'unresolved'
}

function sourceEvidenceStatement(record, isState = false) {
  const label = record.resultId || record.payload?.entryId || record.recordId
  if (isState && record.category === 'lineageConflicts') return `사주 ${record.lane} conflict ${label}를 충돌 상태로 보존하며 승자를 선택하지 않음.`
  if (isState) return `사주 ${record.lane} ${record.category} ${label}를 미해결·미지원 상태로 보존하며 대체 결과를 만들지 않음.`
  if (record.lane === 'structural') return `사주 source-bounded structural result ${label}를 구조화된 결과로 전달하며 개인 의미를 부여하지 않음.`
  if (record.lane === 'semanticLexicon') return `사주 source-bounded semantic lexicon entry ${label}를 원문 범위의 용어 자료로 전달하며 개인 의미를 부여하지 않음.`
  if (record.lane === 'composition') return `사주 source-local composition result ${label}를 source-local 결과로 전달하며 미완성 조합을 보완하지 않음.`
  return `사주 source-bounded semantic result ${label}를 원문 범위의 결과로 전달하며 개인 적용은 별도 가설 단계로 남김.`
}

function makeBaseFactEvidence(factRef) {
  return {
    id: factEvidenceId(factRef),
    kind: 'base_fact',
    status: 'available',
    admission: 'base_contract',
    relation: 'neutral',
    factRefs: [factRef],
    evidenceRole: 'public_deterministic_base_fact',
  }
}

function makeSourceEvidence(record, { isState = false } = {}) {
  const conflict = isState && record.category === 'lineageConflicts'
  const semanticEligible = !isState && ['semantic', 'semanticLexicon', 'composition'].includes(record.lane)
  return {
    id: sourceEvidenceId(record),
    kind: 'literature_claim',
    status: isState ? stateStatus(record.category) : (record.lane === 'structural' ? 'structural_result' : 'available'),
    admission: 'semantic_candidate',
    relation: conflict ? 'conflicts' : (semanticEligible ? 'supports' : 'neutral'),
    statement: sourceEvidenceStatement(record, isState),
    evidenceRole: isState ? 'lineage_state' : `${record.lane}_result`,
    semanticBasisEligible: semanticEligible,
    resultId: record.resultId,
    lineage: record.lineage,
    lineages: [...record.lineages],
    factRefs: [...record.provenance.baseFactRefs],
    sourceRefs: clone(record.sourceRefs),
    provenance: clone(record.provenance),
    payload: clone(record.payload),
  }
}

function stateRecordsForAdapter(envelope) {
  const records = []
  const add = (lane, category, list) => {
    for (const record of list || []) {
      if (category === 'lineageConflicts') continue
      if (['executableRules', 'adoptedSemanticRules', 'adoptedCompositions', 'boundedRoleUseTransitions', 'catalogSemanticEntries', 'resolvedSemanticEntries'].includes(category)) continue
      records.push(record)
    }
  }
  for (const category of SOURCE_STATE_CATEGORIES.structural) add('structural', category, envelope.state.structural[category])
  for (const lineage of ['ziping', 'sanming']) for (const category of SOURCE_STATE_CATEGORIES.semantic) add('semantic', category, envelope.state.semantic[lineage][category])
  for (const category of SOURCE_STATE_CATEGORIES.semanticLexicon) add('semanticLexicon', category, envelope.state.semanticLexicon[category])
  for (const category of SOURCE_STATE_CATEGORIES.composition) add('composition', category, envelope.state.composition[category])
  return records
}

function conflictRecordsForAdapter(envelope) {
  return [
    ...envelope.state.structural.lineageConflicts,
    ...envelope.state.semantic.ziping.lineageConflicts,
    ...envelope.state.semantic.sanming.lineageConflicts,
    ...envelope.state.semanticLexicon.lineageConflicts,
    ...envelope.state.composition.lineageConflicts,
  ]
}

/**
 * Convert a validated envelope into Constitution input.  Base facts remain
 * `base_fact`; every source-derived record remains a separate `literature_claim`.
 * The adapter emits no hypothesis and supplies no personal interpretation.
 */
export function adaptSajuLineageHandoffEvidenceToConstitution({ base, envelope } = {}) {
  const validation = validateSajuLineageHandoffEvidenceEnvelope(envelope, base)
  if (!validation.valid) {
    return {
      base: clone(base),
      evidence: [],
      conflicts: [],
      hypotheses: [],
      adapterValidation: validation,
      evidenceMapping: { baseFactEvidenceIds: [], sourceEvidenceIds: [], stateEvidenceIds: [], conflictEvidenceIds: [], semanticBasisEligibleEvidenceIds: [] },
      boundary: {
        factsAndSourceEvidenceSeparate: true,
        noRecalculation: true,
        noPersonalMeaning: true,
        unresolvedPreserved: true,
        conflictsPreserved: true,
        noCrossLineageMerge: true,
        noHypothesisGenerated: true,
      },
      readiness: {
        userExperienceGate: 'required_before_personal_application',
        userExperienceProvided: false,
        interpretationHypothesisReady: false,
      },
    }
  }

  const evidence = []
  const baseFactEvidenceIds = []
  const sourceEvidenceIds = []
  const stateEvidenceIds = []
  const conflictEvidenceIds = []
  const semanticBasisEligibleEvidenceIds = []
  for (const factRef of envelope.baseContract.factRefs) {
    const item = makeBaseFactEvidence(factRef)
    evidence.push(item)
    baseFactEvidenceIds.push(item.id)
  }

  const resultRecords = [
    ...envelope.evidence.structuralResults,
    ...envelope.evidence.semanticResults.ziping,
    ...envelope.evidence.semanticResults.sanming,
    ...envelope.evidence.semanticLexiconEntries,
    ...envelope.evidence.compositionResults,
  ]
  for (const record of resultRecords) {
    const item = makeSourceEvidence(record)
    evidence.push(item)
    sourceEvidenceIds.push(item.id)
    if (item.semanticBasisEligible) semanticBasisEligibleEvidenceIds.push(item.id)
  }
  for (const record of stateRecordsForAdapter(envelope)) {
    const item = makeSourceEvidence(record, { isState: true })
    evidence.push(item)
    stateEvidenceIds.push(item.id)
  }
  const conflicts = conflictRecordsForAdapter(envelope).map(record => {
    const item = makeSourceEvidence(record, { isState: true })
    evidence.push(item)
    conflictEvidenceIds.push(item.id)
    return {
      id: item.id,
      evidenceIds: [item.id],
      resolution: 'preserved_tension',
      conflictId: record.payload?.conflictId || record.recordId,
      sourceRefs: clone(record.sourceRefs),
      provenance: clone(record.provenance),
    }
  })

  return {
    base: clone(base),
    evidence,
    conflicts,
    hypotheses: [],
    adapterValidation: validation,
    evidenceMapping: {
      baseFactEvidenceIds,
      sourceEvidenceIds,
      stateEvidenceIds,
      conflictEvidenceIds,
      semanticBasisEligibleEvidenceIds,
    },
    boundary: {
      factsAndSourceEvidenceSeparate: true,
      noRecalculation: true,
      noPersonalMeaning: true,
      unresolvedPreserved: true,
      conflictsPreserved: true,
      noCrossLineageMerge: true,
      noHypothesisGenerated: true,
    },
    readiness: {
      semanticBasisAvailable: semanticBasisEligibleEvidenceIds.length > 0,
      userExperienceGate: 'required_before_personal_application',
      userExperienceProvided: false,
      interpretationHypothesisReady: false,
      reason: 'adapter supplies source-bounded evidence only; no user experience or hypothesis is supplied',
    },
  }
}
