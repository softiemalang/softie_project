import { createHash } from 'node:crypto'

export const TRI_SYSTEM_READINESS_SCHEMA = 'tri-system-readiness-handoff-v1'
export const TRI_SYSTEM_READINESS_VERSION = '1.0.0'
export const TRI_SYSTEM_IDS = Object.freeze(['saju', 'ziwei', 'astrology'])
export const TRI_SYSTEM_STATUS = Object.freeze(['partial', 'blocked', 'experimental', 'complete'])

export const TRI_SYSTEM_BOUNDARIES = Object.freeze({
  layerSeparation: {
    calculationFacts: 'separate',
    sourceEvidence: 'separate',
    deterministicRelations: 'separate',
    interpretation: 'not_created',
  },
  preservation: {
    conflictingClaims: 'parallel_preserved',
    unresolvedEvidence: 'explicit_blocker',
    personalMeaningWeights: 'not_precomputed',
  },
  epistemicRules: {
    sourcePresenceIsNotClaimVerification: true,
    numericAgreementIsNotSemanticAuthority: true,
    fixtureIsNotIndependentAuthority: true,
    domainReadinessDoesNotPropagate: true,
    blockedEvidenceIsNotFallback: true,
  },
})

const HASH = /^[a-f0-9]{64}$/
const isObject = value => value && typeof value === 'object' && !Array.isArray(value)
const uniqueSorted = values => [...new Set(values)].sort()

export function isSafeTriSystemRelativePath(value) {
  if (typeof value !== 'string' || !value || value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value) || value.includes('\0')) return false
  return !value.replaceAll('\\', '/').split('/').includes('..')
}

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]))
}

export function canonicalTriSystemReadinessJson(value) {
  return `${JSON.stringify(ordered(value))}\n`
}

export function triSystemReadinessContentSha256(value) {
  if (!isObject(value)) return null
  const copy = structuredClone(value)
  delete copy.contentSha256
  delete copy.artifactIdentity
  return createHash('sha256').update(canonicalTriSystemReadinessJson(copy)).digest('hex')
}

function sourceRefErrors(ref, root) {
  const errors = []
  if (!isObject(ref) || typeof ref.path !== 'string' || !ref.path || !isObject(ref.artifact)) {
    return ['evidence_ref_shape_invalid']
  }
  if (!HASH.test(ref.byteSha256 || '')) errors.push(`evidence_byte_hash_invalid:${ref.path}`)
  if (!ref.artifact.schemaVersion) errors.push(`evidence_schema_missing:${ref.path}`)
  if (ref.artifact.expectedSchema && ref.artifact.schemaVersion !== ref.artifact.expectedSchema) errors.push(`evidence_schema_mismatch:${ref.path}`)
  if (!isSafeTriSystemRelativePath(ref.path)) errors.push(`evidence_path_not_repo_relative:${ref.path}`)
  return errors
}

export function checkTriSystemReadinessContract(artifact, { root } = {}) {
  const errors = []
  if (!isObject(artifact) || artifact.schemaVersion !== TRI_SYSTEM_READINESS_SCHEMA || artifact.version !== TRI_SYSTEM_READINESS_VERSION) errors.push('schema_or_version_mismatch')
  if (triSystemReadinessContentSha256(artifact) !== artifact?.contentSha256) errors.push('content_hash_mismatch')
  if (JSON.stringify(artifact?.domains?.map(domain => domain.id)) !== JSON.stringify([...TRI_SYSTEM_IDS])) errors.push('domain_order_or_membership_mismatch')
  if (canonicalTriSystemReadinessJson(artifact?.boundaries) !== canonicalTriSystemReadinessJson(TRI_SYSTEM_BOUNDARIES)) errors.push('boundary_contract_changed')

  for (const domain of artifact?.domains || []) {
    const prefix = `domain:${domain.id}`
    if (!TRI_SYSTEM_IDS.includes(domain.id)) errors.push(`${prefix}:unknown_domain`)
    if (!TRI_SYSTEM_STATUS.includes(domain.status)) errors.push(`${prefix}:status_invalid`)
    if (domain.readiness?.availableForInterpretation !== false) errors.push(`${prefix}:interpretation_availability_promoted`)
    if (domain.readiness?.userDelivery !== 'blocked' || domain.readiness?.productionActivation !== 'blocked') errors.push(`${prefix}:delivery_or_production_promoted`)
    if (domain.claimInventory?.stableClaimCount !== 0) errors.push(`${prefix}:stable_claim_boundary_promoted`)
    if (!Array.isArray(domain.blockers) || domain.blockers.length === 0) errors.push(`${prefix}:blockers_missing`)
    if (domain.evidenceRefs?.length === 0) errors.push(`${prefix}:evidence_missing`)
    for (const ref of domain.evidenceRefs || []) errors.push(...sourceRefErrors(ref, root).map(error => `${prefix}:${error}`))
    if (domain.propagation?.readinessInheritedFromOtherDomain !== false) errors.push(`${prefix}:readiness_propagation_detected`)
    if (domain.propagation?.blockersInheritedFromOtherDomain !== false) errors.push(`${prefix}:blocker_propagation_detected`)
  }

  if (artifact?.envelope?.status !== 'blocked' || artifact?.envelope?.availableForInterpretation !== false || artifact?.envelope?.integrationStatus !== 'not_connected') errors.push('common_envelope_promoted')
  if (artifact?.envelope?.domainGate !== 'independent_domain_readiness_required') errors.push('common_domain_gate_changed')
  if (artifact?.propagation?.aggregateReadiness !== 'not_computed' || artifact?.propagation?.domainReadinessIndependent !== true) errors.push('aggregate_readiness_or_propagation_changed')
  if (artifact?.propagation?.blockedDomains?.length !== 2 || !artifact?.propagation?.blockedDomains?.includes('saju') || !artifact?.propagation?.blockedDomains?.includes('ziwei')) errors.push('blocked_domain_inventory_invalid')
  if (artifact?.scope?.interpretationCreated !== false || artifact?.scope?.promptOrLlmConnected !== false || artifact?.scope?.activationMutation !== false || artifact?.scope?.historicalArtifactsRewritten !== false) errors.push('scope_boundary_changed')
  if (artifact?.localEvidence?.exhausted !== true) errors.push('local_evidence_boundary_missing')
  return uniqueSorted(errors)
}
