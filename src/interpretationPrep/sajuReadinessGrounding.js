import { createHash } from 'node:crypto'

export const SAJU_READINESS_SCHEMA_VERSION = 'saju-readiness-v0'
export const SAJU_GROUNDING_SCHEMA_VERSION = 'saju-conversation-grounding-v0'
export const SAJU_READINESS_VERSION = '0.1.0'
export const SAJU_GROUNDING_VERSION = '0.1.0'

const HASH = /^[a-f0-9]{64}$/
const FORBIDDEN_KEYS = new Set(['question', 'prompt', 'interpretation', 'advice', 'ranking', 'rank', 'priority', 'meaning', 'personality', 'psychology', 'destiny', 'synthesis'])
const STATUS_MAP = Object.freeze({
  unverified: { readiness: 'grounding_only_unverified', availability: 'available_with_explicit_limits' },
  provenance_partial: { readiness: 'partial_evidence_only', availability: 'available_with_explicit_limits' },
  rule_implemented_source_unresolved: { readiness: 'source_unresolved', availability: 'not_available_for_assertion' },
})

const ordered = value => {
  if (Array.isArray(value)) return value.map(ordered)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]))
}
export const canonicalSajuReadinessJson = value => `${JSON.stringify(ordered(value))}\n`
export const sajuReadinessContentSha256 = value => {
  const copy = structuredClone(value); delete copy.contentSha256
  return createHash('sha256').update(canonicalSajuReadinessJson(copy)).digest('hex')
}
export const sajuGroundingContentSha256 = value => {
  const copy = structuredClone(value); delete copy.contentSha256
  return createHash('sha256').update(canonicalSajuReadinessJson(copy)).digest('hex')
}
const sortedUnique = values => [...new Set(values)].sort()
const refs = claim => [
  ...(claim.inputRefs || []), ...(claim.calculationRefs || []), ...(claim.ruleRefs || []),
  ...(claim.fixtureRefs || []), ...(claim.externalEvidenceRefs || []), ...(claim.traditionalSourceRefs || []),
].map(ref => ref.refId || ref.id).filter(Boolean).sort()

function readinessForClaim(claim) {
  const mapping = STATUS_MAP[claim.provenanceCompleteness] || STATUS_MAP.unverified
  const unresolved = sortedUnique([
    ...(claim.unresolvedGaps || []),
    ...(claim.externalEvidenceRefs?.length ? ['external match is limited to declared fixture fields and is not claim-level verification'] : []),
  ])
  return {
    claimId: claim.claimId,
    provenanceRef: `claim-provenance.claim.${claim.claimId}`,
    existingStructureRef: claim.existingStructureRef,
    evidence: {
      provenanceCompleteness: claim.provenanceCompleteness,
      verificationStatus: claim.verificationStatus,
      sourceIdentityStatus: claim.sourceIdentityStatus,
      evidenceKinds: [...claim.evidenceKinds].sort(),
      refs: refs(claim),
      unresolved,
    },
    readinessStatus: mapping.readiness,
    conversationAvailability: mapping.availability,
    knownFacts: [
      { domain: 'calculation', subject: 'repository_calculation_output', refs: claim.calculationRefs.map(ref => ref.refId) },
      { domain: 'rule', subject: 'implemented_rule_reference', refs: claim.ruleRefs.map(ref => ref.refId) },
    ],
    unresolvedEvidence: unresolved,
    userDependent: [{ domain: 'lived_experience', subject: 'user_experience', reason: 'not_provided' }, { domain: 'personal_context', subject: 'user_significance', reason: 'requires_user_context' }],
    additionalContext: [
      { domain: 'lived_experience', subject: 'user_experience', reason: 'claim_application_requires_user_report' },
      { domain: 'personal_context', subject: 'user_significance', reason: 'personal_meaning_is_not_calculated' },
    ],
    mustNotAssume: ['actual_life_expression', 'intensity', 'personal_significance', 'priority', 'likelihood', 'accuracy', 'user_identity', 'behavior', 'outcome'],
    relatedClaimRefs: [],
    tensionClaimRefs: [],
  }
}

function identityRef(id, source) { return { id, source, contentSha256: source?.contentSha256 || null, artifactByteSha256: source?.artifactByteSha256 || null } }

export function buildSajuReadiness({ provenance, provenanceIdentity = {} } = {}) {
  if (!provenance || provenance.schemaVersion !== 'saju-claim-provenance-v0') throw new Error('saju provenance input missing or incompatible')
  const claims = provenance.claims.map(readinessForClaim)
  const byStatus = Object.fromEntries(Object.keys(STATUS_MAP).map(status => [status, claims.filter(claim => claim.evidence.provenanceCompleteness === status).length]))
  const result = {
    schemaVersion: SAJU_READINESS_SCHEMA_VERSION, readinessVersion: SAJU_READINESS_VERSION,
    verdictToken: 'saju_readiness_grounding_only_unverified', readinessStatus: 'implemented_unverified', usable: false,
    input: { provenance: identityRef('saju-claim-provenance-v0', provenanceIdentity) },
    claimCount: claims.length, occurrenceCount: provenance.claims.reduce((sum, claim) => sum + claim.occurrenceCount, 0),
    statusDistribution: byStatus, claims,
    activation: { availableForInterpretation: false, integrationStatus: 'not_connected', serviceEligibility: 'blocked', reason: 'saju_interpretation_not_activated' },
    boundary: { naturalLanguage: false, questions: false, interpretation: false, advice: false, prompt: false, ranking: false, userJudgment: false, claimTransformation: false },
    hashScopes: { contentSha256: 'readiness object excluding contentSha256, recursively sorted object keys, arrays preserved, JSON plus LF', artifactByteSha256: 'exact UTF-8 bytes of materialized readiness evidence JSON, including formatting and final LF' },
  }
  return { ...result, contentSha256: sajuReadinessContentSha256(result) }
}

export function buildSajuConversationGrounding({ provenance, readiness, provenanceIdentity = {}, readinessIdentity = {} } = {}) {
  if (!provenance || !readiness) throw new Error('saju grounding inputs missing')
  const bundle = {
    schemaVersion: SAJU_GROUNDING_SCHEMA_VERSION, groundingVersion: SAJU_GROUNDING_VERSION,
    verdictToken: 'saju_conversation_grounding_unverified', bundleStatus: 'complete', usable: false, connected: false,
    subject: { domain: 'saju', subjectRef: 'input_subjects_preserved_in_claim_provenance', inputIdentity: identityRef('saju-input-inventory', provenanceIdentity) },
    artifactIdentity: { provenance: identityRef('saju-claim-provenance-v0', provenanceIdentity), readiness: identityRef('saju-readiness-v0', readinessIdentity) },
    claimRefs: provenance.claims.map(claim => ({ claimId: claim.claimId, provenanceRef: `claim-provenance.claim.${claim.claimId}`, readinessRef: `readiness.claim.${claim.claimId}` })),
    claims: { count: readiness.claimCount, occurrenceCount: readiness.occurrenceCount, readinessStatuses: readiness.statusDistribution },
    availableEvidence: { calculationRefs: provenance.claims.flatMap(claim => claim.calculationRefs.map(ref => ref.refId)).sort(), ruleRefs: provenance.claims.flatMap(claim => claim.ruleRefs.map(ref => ref.refId)).sort(), scope: 'references_only; no claim-level verification promotion' },
    epistemicState: {
      known: [{ domain: 'calculation', subject: 'repository_calculation_outputs', status: 'known', reason: 'referenced_not_independently_verified' }, { domain: 'rule', subject: 'implemented_rules', status: 'known', reason: 'source_identity_unresolved' }],
      unknown: [{ domain: 'verification', subject: 'claim_level_verification', status: 'unknown', reason: 'not_established' }],
      unresolved: provenance.claims.flatMap(claim => claim.unresolvedGaps.map(reason => ({ claimId: claim.claimId, status: 'unresolved', reason }))),
      userDependent: [{ domain: 'lived_experience', subject: 'user_experience', status: 'user_dependent', reason: 'not_provided' }, { domain: 'personal_context', subject: 'user_significance', status: 'user_dependent', reason: 'requires_user_context' }],
      unavailable: [{ domain: 'delivery', subject: 'interpretation_service', status: 'unavailable', reason: 'activation_blocked' }],
    },
    preservedClaimRelations: { relationBasis: 'mechanically_proven_relations_only', relatedClaimRefs: [], tensionClaimRefs: [], note: 'no relation is inferred from occurrence, evidence, category, or text' },
    useLimits: { mustNotAssume: [...new Set(readiness.claims.flatMap(claim => claim.mustNotAssume))].sort(), noFrequencyRanking: true, noClaimSelection: true, noClaimMerging: true, noUnresolvedSourceHiding: true },
    verificationState: { provenance: provenance.verdictToken, readiness: readiness.verdictToken, overall: 'implemented_unverified', externalEvidenceScope: provenance.externalEvidenceSummary.scope },
    activation: readiness.activation, boundary: readiness.boundary,
    hashScopes: { contentSha256: 'grounding object excluding contentSha256, recursively sorted object keys, arrays preserved, JSON plus LF', artifactByteSha256: 'exact UTF-8 bytes of materialized grounding evidence JSON, including formatting and final LF' },
  }
  return { ...bundle, contentSha256: sajuGroundingContentSha256(bundle) }
}

function walkKeys(value, path = []) { if (!value || typeof value !== 'object') return []; return Object.entries(value).flatMap(([key, child]) => [[key, [...path, key]], ...walkKeys(child, [...path, key])]) }
function checkHash(value, hashFn) { return HASH.test(value?.contentSha256 || '') && hashFn(value) === value.contentSha256 }
export function checkSajuReadiness(readiness, provenance) {
  const errors = []
  if (readiness?.schemaVersion !== SAJU_READINESS_SCHEMA_VERSION || readiness?.readinessVersion !== SAJU_READINESS_VERSION) errors.push('readiness schema/version mismatch')
  if (!checkHash(readiness, sajuReadinessContentSha256)) errors.push('readiness content hash mismatch')
  if (readiness?.claimCount !== provenance?.claimCount || readiness?.claims?.length !== provenance?.claims?.length) errors.push('claim omission/duplication')
  if (readiness?.claims?.some(claim => claim.relatedClaimRefs.length || claim.tensionClaimRefs.length)) errors.push('unproven claim relation inserted')
  if (readiness?.claims?.some(claim => !provenance.claims.some(source => source.claimId === claim.claimId))) errors.push('readiness provenance reference broken')
  if (readiness?.claims?.some(claim => claim.evidence.verificationStatus !== 'unverified')) errors.push('unverified claim promoted')
  if (readiness?.claims?.some(claim => claim.evidence.unresolved.length === 0)) errors.push('unresolved evidence hidden')
  if (readiness?.claims?.some(claim => claim.mustNotAssume.length === 0 || claim.userDependent.length === 0)) errors.push('user-dependent boundary missing')
  if (readiness?.activation?.availableForInterpretation !== false || readiness?.activation?.serviceEligibility !== 'blocked') errors.push('activation boundary promoted')
  if (walkKeys(readiness).some(([key, path]) => FORBIDDEN_KEYS.has(key.toLowerCase()) && path[0] !== 'boundary')) errors.push('question/interpretation/advice/prompt inserted')
  return errors
}
export function checkSajuConversationGrounding(bundle, { provenance, readiness } = {}) {
  const errors = []
  if (bundle?.schemaVersion !== SAJU_GROUNDING_SCHEMA_VERSION || bundle?.groundingVersion !== SAJU_GROUNDING_VERSION) errors.push('grounding schema/version mismatch')
  if (!checkHash(bundle, sajuGroundingContentSha256)) errors.push('grounding content hash mismatch')
  if (bundle?.usable !== false || bundle?.connected !== false) errors.push('grounding activation promoted')
  if (bundle?.verificationState?.overall !== 'implemented_unverified' || bundle?.verificationState?.provenance !== provenance?.verdictToken || bundle?.verificationState?.readiness !== readiness?.verdictToken) errors.push('unverified claim promoted')
  if (bundle?.claims?.count !== provenance?.claimCount || bundle?.claimRefs?.length !== provenance?.claimCount) errors.push('grounding claim omission/duplication')
  if (new Set((bundle?.claimRefs || []).map(ref => ref.claimId)).size !== bundle?.claimRefs?.length) errors.push('grounding claim duplication')
  if (bundle?.claimRefs?.some(ref => !readiness?.claims?.some(claim => claim.claimId === ref.claimId && ref.readinessRef === `readiness.claim.${claim.claimId}`))) errors.push('grounding readiness reference broken')
  if (bundle?.preservedClaimRelations?.relatedClaimRefs?.length || bundle?.preservedClaimRelations?.tensionClaimRefs?.length) errors.push('unproven relation inserted')
  const statusKeys = Object.keys(readiness?.statusDistribution || {})
  if (statusKeys.some(key => bundle?.claims?.readinessStatuses?.[key] !== readiness.statusDistribution[key]) || Object.keys(bundle?.claims?.readinessStatuses || {}).length !== statusKeys.length) errors.push('readiness status inventory changed')
  if (bundle?.useLimits?.noFrequencyRanking !== true || bundle?.useLimits?.noClaimMerging !== true) errors.push('frequency ranking or claim merging allowed')
  if (bundle?.frequencyRanking || bundle?.frequencyRank || bundle?.score || bundle?.selection) errors.push('frequency ranking or claim selection inserted')
  if (bundle?.epistemicState?.unknown?.some(item => item.status !== 'unknown') || bundle?.epistemicState?.userDependent?.some(item => item.status !== 'user_dependent') || bundle?.epistemicState?.unresolved?.some(item => item.status !== 'unresolved')) errors.push('unknown/unresolved/user-dependent promoted')
  if (!bundle?.epistemicState?.unresolved?.length) errors.push('unresolved source hidden')
  if (walkKeys(bundle).some(([key, path]) => FORBIDDEN_KEYS.has(key.toLowerCase()) && path[0] !== 'boundary' && path[0] !== 'useLimits')) errors.push('question/interpretation/advice/prompt inserted')
  const expectedIds = (provenance?.claims || []).map(claim => claim.claimId).sort()
  const actualIds = (bundle?.claimRefs || []).map(ref => ref.claimId)
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) errors.push('non-deterministic claim ordering')
  return errors
}
