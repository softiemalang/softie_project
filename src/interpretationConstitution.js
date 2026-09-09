/**
 * Interpretation Constitution v0
 *
 * A domain-neutral guard between a frozen Deterministic Base and any later
 * interpretation layer.  This module does not contain symbol dictionaries,
 * domain meanings, source authority, or activation decisions.  It only checks
 * that a consumer keeps facts, semantic claims, synthesis, inference, and
 * user-reported experience in separate lanes.
 */

export const INTERPRETATION_CONSTITUTION_VERSION = 'interpretation-constitution-v0'
export const CONSTITUTION_BASE_SCHEMA_VERSION = 'tri-system-deterministic-base-v0'
export const CONSTITUTION_BASE_FOUNDATION_VERSION = 'deterministic-base-v0'

export const CONSTITUTION_EVIDENCE_KINDS = Object.freeze([
  'base_fact',
  'literature_claim',
  'modern_synthesis',
  'ai_inference',
  'user_experience',
])

export const CONSTITUTION_EVIDENCE_RELATIONS = Object.freeze([
  'supports',
  'conflicts',
  'neutral',
])

export const CONSTITUTION_HYPOTHESIS_STATUS = 'hypothesis'

const EVIDENCE_KIND_SET = new Set(CONSTITUTION_EVIDENCE_KINDS)
const EVIDENCE_RELATION_SET = new Set(CONSTITUTION_EVIDENCE_RELATIONS)
const UNSAFE_EVIDENCE_STATUSES = new Set(['candidate', 'unverified', 'unsupported'])
const USABLE_SEMANTIC_STATUSES = new Set(['available'])
const FORBIDDEN_PUBLIC_METADATA_KEYS = new Set([
  'source',
  'unknown',
  'activation',
  'verificationStatus',
  'summary',
  'generatedAt',
  'markdown',
  'formattedMarkdown',
])
const FORBIDDEN_HYPOTHESIS_KEYS = new Set([
  'fact',
  'confirmed',
  'certainty',
  'confidence',
  'majority',
  'winner',
  'resolved',
  'personalTrait',
  'personality',
  'prediction',
  'semanticAuthority',
  'readiness',
  'activation',
])

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const isNonEmptyString = value => typeof value === 'string' && value.trim().length > 0
const unique = values => [...new Set(values)]

function addUnique(list, value) {
  if (!list.includes(value)) list.push(value)
}

function pushPathErrors(value, errors, path = '$', options = {}) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => pushPathErrors(item, errors, `${path}[${index}]`, options))
    return
  }
  if (!isObject(value)) return

  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`
    if (options.forbiddenKeys?.has(key)) errors.push(`forbidden_public_metadata:${childPath}`)
    pushPathErrors(child, errors, childPath, options)
  }
}

function parseFactRef(factRef) {
  if (!isNonEmptyString(factRef)) return null
  const segments = factRef.split('.')
  if (segments.length < 4 || segments[0] !== 'systems' || segments[2] !== 'fact') return null
  if (segments.some(segment => segment.length === 0)) return null
  return segments
}

function readPath(root, segments) {
  let value = root
  for (const segment of segments) {
    if (value === null || value === undefined) return { present: false, value: undefined }
    if (Array.isArray(value)) {
      if (!/^\d+$/.test(segment) || Number(segment) >= value.length) return { present: false, value: undefined }
      value = value[Number(segment)]
    } else if (isObject(value) && Object.hasOwn(value, segment)) {
      value = value[segment]
    } else {
      return { present: false, value: undefined }
    }
  }
  return { present: value !== null && value !== undefined, value }
}

function factLookup(base, factRef) {
  const segments = parseFactRef(factRef)
  if (!segments) return { validRef: false, present: false, value: undefined, domain: null }
  const result = readPath(base, segments)
  return {
    ...result,
    validRef: true,
    domain: segments[1],
  }
}

function validateConsumerBoundary(base, errors) {
  if (!isObject(base.consumerBoundary)) {
    errors.push('base_consumer_boundary_missing')
    return
  }
  const expected = {
    factScope: 'verified_claims_only',
    omittedClaims: 'not_provided_as_facts',
    interpretation: 'separate_fact_from_interpretation_and_confirm_personal_context',
  }
  for (const [key, value] of Object.entries(expected)) {
    if (base.consumerBoundary[key] !== value) errors.push(`base_consumer_boundary_mismatch:${key}`)
  }
}

/**
 * Validate the public, frozen Deterministic Base shape without recalculating
 * or interpreting any value.
 */
export function validateDeterministicBaseForInterpretation(base) {
  const errors = []
  if (!isObject(base)) return { valid: false, errors: ['base_not_object'] }
  if (base.schemaVersion !== CONSTITUTION_BASE_SCHEMA_VERSION) errors.push('base_schema_version_mismatch')
  if (base.foundationVersion !== CONSTITUTION_BASE_FOUNDATION_VERSION) errors.push('base_foundation_version_mismatch')
  if (!isObject(base.normalizedInput)) errors.push('base_normalized_input_missing')
  if (!isObject(base.systems) || Object.keys(base.systems).length === 0) errors.push('base_systems_missing')
  else {
    for (const [domain, system] of Object.entries(base.systems)) {
      if (!isObject(system)) errors.push(`base_system_not_object:${domain}`)
      else if (!isObject(system.fact)) errors.push(`base_fact_missing:${domain}`)
    }
  }
  validateConsumerBoundary(base, errors)
  if (Object.hasOwn(base, 'summary') || Object.hasOwn(base, 'generatedAt')) errors.push('base_internal_root_metadata_present')
  if (Object.hasOwn(base, 'markdown') || Object.hasOwn(base, 'formattedMarkdown')) errors.push('base_embedded_markdown_present')
  pushPathErrors(base.systems, errors, '$.systems', { forbiddenKeys: FORBIDDEN_PUBLIC_METADATA_KEYS })
  return { valid: unique(errors).length === 0, errors: unique(errors) }
}

export function isDeterministicFactRef(base, factRef) {
  const result = factLookup(base, factRef)
  return result.validRef && result.present
}

function validateFactRefs(base, refs, errors, path) {
  if (!Array.isArray(refs) || refs.length === 0) {
    errors.push(`fact_refs_missing:${path}`)
    return []
  }
  const domains = []
  for (const factRef of refs) {
    const result = factLookup(base, factRef)
    if (!result.validRef) errors.push(`invalid_fact_ref:${path}:${factRef}`)
    else if (!result.present) errors.push(`fact_not_present:${factRef}`)
    else addUnique(domains, result.domain)
  }
  return domains
}

function validateEvidence(base, evidence, errors) {
  if (!Array.isArray(evidence)) {
    errors.push('evidence_list_missing')
    return new Map()
  }

  const byId = new Map()
  evidence.forEach((item, index) => {
    const path = `evidence[${index}]`
    if (!isObject(item)) {
      errors.push(`evidence_not_object:${path}`)
      return
    }
    if (!isNonEmptyString(item.id)) errors.push(`evidence_id_missing:${path}`)
    else if (byId.has(item.id)) errors.push(`evidence_id_duplicate:${item.id}`)
    else byId.set(item.id, item)
    if (!EVIDENCE_KIND_SET.has(item.kind)) errors.push(`evidence_kind_invalid:${path}`)
    if (!EVIDENCE_RELATION_SET.has(item.relation)) errors.push(`evidence_relation_invalid:${path}`)
    if (!isNonEmptyString(item.status)) errors.push(`evidence_status_missing:${path}`)

    if (item.kind === 'base_fact') {
      if (item.status !== 'available') errors.push(`base_fact_status_invalid:${item.id || path}`)
      if (item.admission !== 'base_contract') errors.push(`base_fact_admission_invalid:${item.id || path}`)
      if (Object.hasOwn(item, 'statement')) errors.push(`base_fact_statement_forbidden:${item.id || path}`)
      validateFactRefs(base, item.factRefs, errors, path)
    } else if (item.kind === 'user_experience') {
      if (item.status !== 'reported') errors.push(`user_experience_status_invalid:${item.id || path}`)
      if (item.admission !== 'user_report') errors.push(`user_experience_admission_invalid:${item.id || path}`)
      if (!isNonEmptyString(item.statement)) errors.push(`user_experience_statement_missing:${item.id || path}`)
    } else {
      if (!isNonEmptyString(item.statement)) errors.push(`evidence_statement_missing:${item.id || path}`)
      if (!isNonEmptyString(item.admission)) errors.push(`evidence_admission_missing:${item.id || path}`)
      if (item.kind === 'ai_inference' && item.admission !== 'none') errors.push(`ai_inference_admission_invalid:${item.id || path}`)
      if (item.kind !== 'ai_inference' && item.kind !== 'user_experience' && item.admission !== 'semantic_candidate') {
        errors.push(`semantic_evidence_admission_invalid:${item.id || path}`)
      }
    }
  })
  return byId
}

function validateConflicts(conflicts, evidenceById, errors) {
  const items = conflicts === undefined ? [] : conflicts
  const byId = new Map()
  if (!Array.isArray(items)) errors.push('conflicts_not_array')
  const conflictEntries = Array.isArray(items) ? items : []
  conflictEntries.forEach((conflict, index) => {
    const path = `conflicts[${index}]`
    if (!isObject(conflict)) {
      errors.push(`conflict_not_object:${path}`)
      return
    }
    if (!isNonEmptyString(conflict.id)) errors.push(`conflict_id_missing:${path}`)
    else if (byId.has(conflict.id)) errors.push(`conflict_id_duplicate:${conflict.id}`)
    else byId.set(conflict.id, conflict)
    if (!Array.isArray(conflict.evidenceIds) || conflict.evidenceIds.length === 0) {
      errors.push(`conflict_evidence_missing:${conflict.id || path}`)
    } else {
      for (const evidenceId of conflict.evidenceIds) {
        const evidence = evidenceById.get(evidenceId)
        if (!evidence) errors.push(`conflict_evidence_unknown:${evidenceId}`)
        else if (evidence.relation !== 'conflicts') errors.push(`conflict_evidence_not_conflicting:${evidenceId}`)
      }
    }
    if (conflict.resolution !== 'preserved_tension') errors.push(`conflict_resolution_must_preserve_tension:${conflict.id || path}`)
  })
  const ledgerEvidenceIds = new Set([...byId.values()].flatMap(conflict => conflict.evidenceIds || []))
  for (const evidence of evidenceById.values()) {
    if (evidence.relation === 'conflicts' && !ledgerEvidenceIds.has(evidence.id)) {
      errors.push(`conflicting_evidence_not_in_ledger:${evidence.id}`)
    }
  }
  return byId
}

function validateHypotheses(base, hypotheses, evidenceById, conflictsById, errors) {
  if (!Array.isArray(hypotheses)) {
    errors.push('hypotheses_not_array')
    return []
  }
  const ids = new Set()
  return hypotheses.map((hypothesis, index) => {
    const path = `hypotheses[${index}]`
    if (!isObject(hypothesis)) {
      errors.push(`hypothesis_not_object:${path}`)
      return null
    }
    if (!isNonEmptyString(hypothesis.id)) errors.push(`hypothesis_id_missing:${path}`)
    else if (ids.has(hypothesis.id)) errors.push(`hypothesis_id_duplicate:${hypothesis.id}`)
    else ids.add(hypothesis.id)
    if (!isNonEmptyString(hypothesis.statement)) errors.push(`hypothesis_statement_missing:${hypothesis.id || path}`)
    if (hypothesis.claimType !== 'interpretation_hypothesis') errors.push(`hypothesis_claim_type_invalid:${hypothesis.id || path}`)
    if (hypothesis.status !== CONSTITUTION_HYPOTHESIS_STATUS) errors.push(`hypothesis_status_not_tentative:${hypothesis.id || path}`)
    if (hypothesis.userExperienceGate !== 'required') errors.push(`user_experience_gate_missing:${hypothesis.id || path}`)
    for (const key of Object.keys(hypothesis)) {
      if (FORBIDDEN_HYPOTHESIS_KEYS.has(key)) errors.push(`hypothesis_overclaim_field:${hypothesis.id || path}.${key}`)
    }

    const factDomains = validateFactRefs(base, hypothesis.factRefs, errors, path)
    const evidenceIds = Array.isArray(hypothesis.evidenceIds) ? hypothesis.evidenceIds : []
    const semanticBasisIds = Array.isArray(hypothesis.semanticBasisIds) ? hypothesis.semanticBasisIds : []
    const conflictIds = Array.isArray(hypothesis.conflictIds) ? hypothesis.conflictIds : []
    if (!Array.isArray(hypothesis.evidenceIds)) {
      errors.push(`hypothesis_evidence_not_array:${hypothesis.id || path}`)
    }
    if (evidenceIds.length === 0) {
      errors.push(`hypothesis_evidence_missing:${hypothesis.id || path}`)
    }
    const referencedEvidence = []
    for (const evidenceId of evidenceIds) {
      const evidence = evidenceById.get(evidenceId)
      if (!evidence) errors.push(`hypothesis_evidence_unknown:${hypothesis.id || path}:${evidenceId}`)
      else referencedEvidence.push(evidence)
    }

    const declaredFactRefs = new Set(Array.isArray(hypothesis.factRefs) ? hypothesis.factRefs : [])
    for (const evidence of referencedEvidence) {
      if (evidence.kind !== 'base_fact') continue
      for (const factRef of evidence.factRefs || []) {
        if (!declaredFactRefs.has(factRef)) {
          errors.push(`base_fact_not_declared_by_hypothesis:${hypothesis.id || path}:${factRef}`)
        }
      }
    }

    if (Object.hasOwn(hypothesis, 'semanticBasisIds') && !Array.isArray(hypothesis.semanticBasisIds)) {
      errors.push(`semantic_basis_not_array:${hypothesis.id || path}`)
    }
    for (const semanticId of semanticBasisIds) {
      if (!evidenceIds.includes(semanticId)) errors.push(`semantic_basis_not_in_hypothesis_evidence:${hypothesis.id || path}:${semanticId}`)
      if (!evidenceById.has(semanticId)) errors.push(`semantic_basis_unknown:${hypothesis.id || path}:${semanticId}`)
    }

    if (Object.hasOwn(hypothesis, 'conflictIds') && !Array.isArray(hypothesis.conflictIds)) {
      errors.push(`hypothesis_conflict_ids_not_array:${hypothesis.id || path}`)
    }
    for (const conflictId of conflictIds) {
      if (!conflictsById.has(conflictId)) errors.push(`hypothesis_conflict_unknown:${hypothesis.id || path}:${conflictId}`)
    }

    const conflictEvidenceIds = referencedEvidence.filter(item => item.relation === 'conflicts').map(item => item.id)
    if (conflictEvidenceIds.length > 0) {
      const preserved = conflictIds.map(id => conflictsById.get(id)).filter(Boolean)
      const preservedEvidenceIds = new Set(preserved.flatMap(item => item.evidenceIds || []))
      for (const evidenceId of conflictEvidenceIds) {
        if (!preservedEvidenceIds.has(evidenceId)) errors.push(`conflict_not_preserved:${hypothesis.id || path}:${evidenceId}`)
      }
    }

    return { hypothesis, factDomains, referencedEvidence, conflictEvidenceIds, semanticBasisIds, conflictIds }
  }).filter(Boolean)
}

function groupEvidence(evidence) {
  const items = Array.isArray(evidence) ? evidence : []
  return Object.fromEntries(CONSTITUTION_EVIDENCE_KINDS.map(kind => [
    kind,
    items.filter(item => item.kind === kind).map(item => item.id),
  ]))
}

function evaluateHypothesis(item) {
  const { hypothesis, factDomains, referencedEvidence, conflictEvidenceIds, semanticBasisIds, conflictIds } = item
  const semanticBasis = semanticBasisIds
    .map(id => referencedEvidence.find(evidence => evidence.id === id))
    .filter(Boolean)
  const semanticBasisReady = semanticBasis.length > 0
    && semanticBasis.every(evidence =>
      (evidence.kind === 'literature_claim' || evidence.kind === 'modern_synthesis')
      && evidence.admission === 'semantic_candidate'
      && USABLE_SEMANTIC_STATUSES.has(evidence.status))

  const supporting = referencedEvidence.filter(evidence => evidence.relation === 'supports')
  const excludedEvidenceIds = referencedEvidence
    .filter(evidence => UNSAFE_EVIDENCE_STATUSES.has(evidence.status))
    .map(evidence => evidence.id)
  const priorityEvidenceKinds = unique(supporting
    .filter(evidence => !UNSAFE_EVIDENCE_STATUSES.has(evidence.status))
    .filter(evidence => evidence.kind !== 'ai_inference' && evidence.kind !== 'user_experience')
    .map(evidence => evidence.kind))
  const crossSystem = factDomains.length > 1
  const priority = crossSystem
    ? 'baseline_cross_system_not_counted'
    : priorityEvidenceKinds.length >= 2
      ? 'elevated_hypothesis_priority'
      : 'baseline_hypothesis_priority'

  const userExperience = referencedEvidence.filter(evidence => evidence.kind === 'user_experience')
  const userExperienceDecision = userExperience.some(evidence => evidence.relation === 'conflicts')
    ? 'user_experience_first_defer_application'
    : userExperience.length > 0
      ? 'user_experience_context_only_not_confirmation'
      : 'user_experience_not_provided_ask_before_personal_application'

  return {
    id: hypothesis.id,
    status: semanticBasisReady ? 'hypothesis_only' : 'blocked_semantic_basis_missing',
    factRefs: [...hypothesis.factRefs],
    factDomains,
    semanticBasisIds: [...semanticBasisIds],
    excludedEvidenceIds,
    priority,
    agreementTreatment: 'priority_only_never_confirmation_or_majority',
    crossSystemTreatment: crossSystem ? 'not_intervalidation_or_vote' : 'single_system_or_unresolved',
    conflictStatus: conflictEvidenceIds.length > 0 ? 'tension_preserved' : 'no_conflict_recorded',
    conflictIds: [...conflictIds],
    userExperienceDecision,
    userExperienceRequired: true,
    noRecalculation: true,
    noSemanticMeaningFromFactPresence: true,
  }
}

/**
 * Execute the common interpretation gate.  A structurally valid result can
 * still be blocked: the Constitution never treats a present FACT as semantic
 * meaning, and it never emits a definitive personal conclusion.
 */
export function evaluateInterpretationConstitution({
  base,
  evidence = [],
  conflicts = [],
  hypotheses = [],
} = {}) {
  const errors = []
  const baseValidation = validateDeterministicBaseForInterpretation(base)
  errors.push(...baseValidation.errors)
  const evidenceById = validateEvidence(base, evidence, errors)
  const conflictsById = validateConflicts(conflicts, evidenceById, errors)
  const validatedHypotheses = validateHypotheses(base, hypotheses, evidenceById, conflictsById, errors)
  const evaluations = validatedHypotheses.map(evaluateHypothesis)
  const semanticBlockers = evaluations
    .filter(result => result.status === 'blocked_semantic_basis_missing')
    .map(result => `semantic_basis_not_explicit:${result.id}`)
  const allErrors = unique(errors)
  const allBlockers = unique([...semanticBlockers, ...allErrors])
  const interpretationDecision = allErrors.length > 0
    ? 'blocked_contract_violation'
    : evaluations.length === 0
      ? 'facts_only_no_semantic_interpretation'
      : evaluations.every(result => result.status === 'hypothesis_only')
        ? 'hypothesis_only'
        : 'blocked_semantic_basis_missing'

  return {
    constitutionVersion: INTERPRETATION_CONSTITUTION_VERSION,
    inputContract: CONSTITUTION_BASE_FOUNDATION_VERSION,
    baseContractValid: baseValidation.valid,
    contractValid: allErrors.length === 0,
    interpretationDecision,
    semanticInterpretation: {
      status: 'not_assumed_from_fact_presence',
      factPresenceDoesNotEstablishMeaning: true,
      semanticBasisRequiredForHypothesis: true,
      definitivePersonalConclusion: false,
    },
    evidenceGroups: groupEvidence(evidence),
    hypotheses: evaluations,
    blockers: allBlockers,
    violations: allErrors,
    noRecalculation: true,
    noCrossSystemMajority: true,
    conflictsPreserved: evaluations.every(result => result.conflictStatus !== 'tension_preserved' || result.conflictIds.length > 0),
  }
}
