import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'
import { buildOccurrenceProvenance } from './materialize-ziwei-occurrence-provenance-v0.mjs'

export const SCHEMA = 'ziwei-readiness-admission-blocker-audit-v0'
export const VERDICT = 'ziwei_readiness_admission_audit_partial_unverified'
export const BASIS_HEAD = '034ea3015875d52643341613547aec583747976e'
export const MATERIALIZER_VERSION = '1.0.0'
export const ADMISSION_STATES = [
  'blocked_external_evidence_required', 'blocked_claim_boundary_required',
  'blocked_raw_text_misread_risk', 'eligible_occurrence_only_with_limits',
  'eligible_after_structural_guard', 'excluded_currently', 'unresolved',
]

const HIGH_RISK = new Set(['life', 'spouse', 'children', 'wealth', 'health', 'travel', 'property', 'parents'])
const LOW_RISK = new Set(['siblings', 'friends', 'career', 'mind'])
const INPUTS = [
  'scripts/materialize-ziwei-occurrence-provenance-v0.mjs',
  'src/ziwei/ziweiContract.js', 'src/ziwei/palaceRelationRules.js', 'src/ziwei/transformationRules.js',
  'src/ziwei/externalZiweiFixtures.js', 'test/fixtures/ziwei/knownCharts.js',
  'test/fixtures/ziwei/starPlacementCharts.js', 'test/fixtures/ziwei/benchmarkCases.js',
]
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const canonicalJson = value => {
  const sort = v => Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v
  return `${JSON.stringify(sort(value), null, 2)}\n`
}

function slotOf(occurrence) { return occurrence.source.slot }

function assess(occurrence) {
  const slot = slotOf(occurrence)
  const isTransformation = occurrence.source.exportName === 'TRANSFORMATION_LABELS'
  const isTopic = occurrence.source.exportName === 'TOPIC_PALACE_PATTERNS'
  let state
  let primaryBlocker
  let supportingLimitations
  let minimumConditions
  let rawRestriction
  let userContextDependency
  let externalEvidenceRequired
  let claimBoundaryWithoutProceeding

  if (isTransformation) {
    state = 'blocked_external_evidence_required'
    primaryBlocker = 'external_evidence_required'
    supportingLimitations = ['source_identity_unresolved', 'external_fixture_pending', 'raw_text_misread_risk', 'claim_boundary_zero']
    minimumConditions = ['immutable source edition and retrieval bytes', 'independent oracle and settings', 'field-level comparison with this occurrence kept separate']
    rawRestriction = 'literal archive/reference only; never state the label as a traditional fact or user attribute'
    userContextDependency = 'must not connect to a user until input, rule scope, and independently verified evidence are explicit'
    externalEvidenceRequired = true
    claimBoundaryWithoutProceeding = false
  } else if (isTopic) {
    state = 'blocked_claim_boundary_required'
    primaryBlocker = 'stable_claim_boundary_required'
    supportingLimitations = ['source_identity_unresolved', 'broad_topic_label', 'related-palace-structure-is-not-meaning', 'claim_boundary_zero']
    minimumConditions = ['explicit semantic unit and scope', 'source-backed sourceRefs', 'preserve each label and related palace list without merging']
    rawRestriction = 'do not paraphrase; may be shown only as an unlabeled local topic reference, not as a conclusion'
    userContextDependency = 'requires an explicit user question and context scope; never infer a life domain or ranking'
    externalEvidenceRequired = true
    claimBoundaryWithoutProceeding = false
  } else if (HIGH_RISK.has(slot)) {
    state = 'excluded_currently'
    primaryBlocker = 'raw_text_misread_risk'
    supportingLimitations = ['source_identity_unresolved', 'predictive_or_personal-reading-risk', 'claim_boundary_zero', 'regression_only_fixture_context']
    minimumConditions = ['human-reviewed literal-use policy', 'user-context request and uncertainty disclosure', 'source-backed boundary and independent evidence before any meaning use']
    rawRestriction = 'do not display as a standalone reference in the current admission path; retain only in audit evidence'
    userContextDependency = 'materially dependent on user context and must not be inferred from occurrence, count, or chart placement'
    externalEvidenceRequired = true
    claimBoundaryWithoutProceeding = false
  } else if (LOW_RISK.has(slot)) {
    state = 'eligible_after_structural_guard'
    primaryBlocker = 'structural_guard_required'
    supportingLimitations = ['source_identity_unresolved', 'raw_text_is_not_fact', 'claim_boundary_zero', 'regression_only_fixture_context']
    minimumConditions = ['exact text and source location preserved', 'no paraphrase or claim ID', 'context-gated reference-only rendering', 'fixture status remains regression_only']
    rawRestriction = 'literal text only with an explicit occurrence/provenance label; no factual, traditional, predictive, or personal assertion'
    userContextDependency = 'requires user-provided context for any discussion; absence of context means no interpretation or application'
    externalEvidenceRequired = false
    claimBoundaryWithoutProceeding = true
  } else {
    state = 'unresolved'
    primaryBlocker = 'unresolved_admission_basis'
    supportingLimitations = ['classification_rule_missing']
    minimumConditions = ['explicit audit decision']
    rawRestriction = 'do not consume'
    userContextDependency = 'unknown; do not infer'
    externalEvidenceRequired = true
    claimBoundaryWithoutProceeding = false
  }

  return {
    occurrenceId: occurrence.occurrenceId,
    provenanceReference: { artifact: 'ziwei-occurrence-level-provenance-v0', source: occurrence.source, sourceIdentityStatus: occurrence.sourceIdentity.status },
    admission: {
      state, primaryBlocker, supportingLimitations, minimumConditions,
      mustNotAssume: ['verified_fact', 'stable_claim', 'traditional_consensus', 'user_trait', 'life_or_future_outcome', 'importance_from_frequency'],
      rawTextConsumptionRestriction: rawRestriction,
      userContextDependency,
      externalEvidenceRequired,
      claimBoundaryWithoutProceeding,
    },
    evidenceBoundary: {
      rawTextVerifiedFact: false,
      sourceIdentity: 'unresolved_source_identity',
      internalFixture: 'regression_only',
      independentVerification: false,
      stableClaimId: null,
      occurrenceOnly: true,
      fixtureReferences: occurrence.fixtureReferences,
      configurationMismatch: occurrence.fixtureReferences.some(x => x.includes('chart-sample')),
    },
  }
}

export async function buildAdmissionAudit() {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const provenance = await buildOccurrenceProvenance()
  const occurrences = provenance.occurrences.map(assess)
  const counts = Object.fromEntries(ADMISSION_STATES.map(state => [state, occurrences.filter(x => x.admission.state === state).length]))
  const lists = {
    externalEvidenceRequired: occurrences.filter(x => x.admission.externalEvidenceRequired).map(x => x.occurrenceId),
    structuralGuardPossible: occurrences.filter(x => x.admission.state === 'eligible_after_structural_guard').map(x => x.occurrenceId),
    excludedCurrently: occurrences.filter(x => x.admission.state === 'excluded_currently').map(x => x.occurrenceId),
  }
  const artifact = {
    schemaVersion: SCHEMA, auditVersion: '1.0.0', verdictToken: VERDICT, basisHead: BASIS_HEAD,
    observedHead: execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    scope: 'read-only admission blocker audit; no readiness, grounding, claim, interpretation, or activation implementation',
    baseline: { occurrenceCount: 19, stableOccurrenceIds: 19, stableClaimBoundary: 0, conflationRisk: 19, sourceIdentity: { total: 32, unresolved: 32 }, internalFixtures: 'regression_only', externalFixtures: { verified: 0, pending: 6 }, configurationMismatch: 2, readiness: 'not_safe_to_start', grounding: 'not_safe_to_start', activation: 'experimental' },
    admissionStates: ADMISSION_STATES,
    occurrenceCount: occurrences.length,
    occurrences,
    blockerDistribution: counts,
    categoryLists: lists,
    structuralDecision: { stableClaimBoundaryCount: 0, canStartReadinessGroundingDesign: false, verdict: 'not_safe_to_start', reason: 'literal occurrence reference can be specified for four low-risk labels under structural guard, but claim-level readiness/grounding cannot start while source identity, independent evidence, and claim boundaries remain open' },
    invariants: ['occurrences are never merged', 'source identity is never inferred', 'observed match and regression fixture are not independent verification', 'frequency and count never affect admission', 'raw text never becomes fact', 'user context is required for any application', 'blocker kinds remain distinct'],
    deterministicContract: { occurrenceOrder: 'lexicographic occurrenceId', rawText: 'exact baseline text; no normalization', timestamps: 'forbidden', hashScopes: ['canonical artifact payload', 'complete.json UTF-8 bytes including final LF'] },
    materializer: 'scripts/materialize-ziwei-readiness-admission-blocker-audit-v0.mjs',
    checker: 'scripts/check-ziwei-readiness-admission-blocker-audit-v0.mjs',
    negativeFixture: 'test/fixtures/ziwei/readiness-admission-blocker-negative-v0.json',
  }
  return attachArtifactIdentity(artifact, buildArtifactIdentity({ root, artifactId: SCHEMA, materializerPath: artifact.materializer, materializerVersion: MATERIALIZER_VERSION, baseHead: artifact.observedHead, inputs: INPUTS }))
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const target = resolve(process.argv[2] || 'artifacts/ziwei-readiness-admission-blocker-audit-v0/complete.json')
  const artifact = await buildAdmissionAudit(); const body = canonicalJson(artifact)
  await mkdir(dirname(target), { recursive: true }); await writeFile(target, body)
  await writeFile(`${target}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(Buffer.from(body)), artifactByteSha256Scope: 'complete.json UTF-8 bytes including final LF' }, null, 2)}\n`)
  console.log(JSON.stringify({ target, occurrenceCount: artifact.occurrenceCount, blockerDistribution: artifact.blockerDistribution, artifactByteSha256: sha256(Buffer.from(body)) }, null, 2))
}
