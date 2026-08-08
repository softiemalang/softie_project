/**
 * Machine-readable boundary for values that cross from calculation into a
 * handoff package. This is deliberately separate from verificationStatus:
 * an engine status must not be read as independent source authority.
 */

export const EVIDENCE_BOUNDARY_SCHEMA = 'tri-system-evidence-boundary-v1'

const CALCULATION_STATUSES = new Set(['calculated', 'partial_or_candidate', 'not_available'])
const SOURCE_EVIDENCE_STATUSES = new Set(['unverified', 'not_available'])
const RELATION_STATUSES = new Set(['present_in_calculation_context', 'not_available'])

const unique = values => [...new Set((values || []).filter(value => typeof value === 'string' && value))]

export function createEvidenceBoundary({
  system,
  calculationStatus = 'not_available',
  sourceEvidenceStatus = 'not_available',
  sourceEvidenceReason,
  deterministicRelationStatus = 'not_available',
  sourceRefs = [],
  relationRefs = [],
} = {}) {
  return {
    schemaVersion: EVIDENCE_BOUNDARY_SCHEMA,
    system: system || 'unknown',
    calculation: {
      status: calculationStatus,
      refs: unique(sourceRefs),
    },
    sourceEvidence: {
      status: sourceEvidenceStatus,
      independentAuthority: 'not_claimed',
      claimVerification: 'not_promoted',
      reason: sourceEvidenceReason || 'source evidence status was not supplied',
    },
    deterministicRelations: {
      status: deterministicRelationStatus,
      refs: unique(relationRefs),
      semanticEquivalence: 'not_computed',
    },
    interpretation: {
      status: 'not_created',
      personalMeaning: 'not_computed',
      userContext: 'required_for_application',
    },
  }
}
export function checkEvidenceBoundary(boundary = {}) {
  const errors = []
  if (!boundary || typeof boundary !== 'object' || Array.isArray(boundary)) return ['boundary_shape_invalid']
  if (boundary.schemaVersion !== EVIDENCE_BOUNDARY_SCHEMA) errors.push('boundary_schema_mismatch')
  if (!boundary.system || typeof boundary.system !== 'string') errors.push('boundary_system_missing')
  if (!CALCULATION_STATUSES.has(boundary.calculation?.status)) errors.push('calculation_status_invalid')
  if (!SOURCE_EVIDENCE_STATUSES.has(boundary.sourceEvidence?.status)) errors.push('source_evidence_status_invalid')
  if (boundary.sourceEvidence?.independentAuthority !== 'not_claimed') errors.push('independent_authority_promoted')
  if (boundary.sourceEvidence?.claimVerification !== 'not_promoted') errors.push('claim_verification_promoted')
  if (!RELATION_STATUSES.has(boundary.deterministicRelations?.status)) errors.push('relation_status_invalid')
  if (boundary.deterministicRelations?.semanticEquivalence !== 'not_computed') errors.push('semantic_equivalence_computed')
  if (boundary.interpretation?.status !== 'not_created') errors.push('interpretation_created')
  if (boundary.interpretation?.personalMeaning !== 'not_computed') errors.push('personal_meaning_computed')
  if (boundary.interpretation?.userContext !== 'required_for_application') errors.push('user_context_boundary_changed')
  if (!Array.isArray(boundary.calculation?.refs) || !Array.isArray(boundary.deterministicRelations?.refs)) errors.push('boundary_refs_invalid')
  return [...new Set(errors)].sort()
}
