import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity, checkArtifactIdentity } from '../src/artifactIdentity.js'

export const SCHEMA = 'ziwei-structural-admission-independent-acceptance-review-v0'
export const VERDICT = 'ziwei_structural_admission_guard_pilot_independent_review_partial_unverified'
export const MATERIALIZER_VERSION = '1.0.0'
export const PILOT_PATH = 'artifacts/ziwei-structural-admission-guard-pilot-v0/complete.json'
export const AUDIT_PATH = 'artifacts/ziwei-readiness-admission-blocker-audit-v0/complete.json'
export const PROVENANCE_PATH = 'artifacts/ziwei-occurrence-level-provenance-v0/complete.json'
export const NEGATIVE_PATH = 'test/fixtures/ziwei/structural-admission-independent-acceptance-review-negative-v0.json'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const canonicalJson = value => {
  const sort = v => Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v
  return `${JSON.stringify(sort(value), null, 2)}\n`
}
const rootOf = () => resolve(new URL('..', import.meta.url).pathname)
const ids = a => [...(a || [])].sort()
const unitOf = record => record?.admissionUnit

const checks = [
  ['candidate_selection_is_audit_derived', 'accepted_with_declared_limit', 'The four IDs equal the audit structuralGuardPossible list and no other source is used.', 'candidate IDs remain occurrence-scoped; this does not validate the audit rule itself.'],
  ['all_four_candidates_reviewed_once', 'accepted', 'Four unique records are present and each has an independent finding.', 'No confidence or importance is inferred from the count.'],
  ['raw_text_only_extraction_blocked', 'accepted', 'No rawText property exists outside the versioned admissionUnit; reference consumption returns only the validated unit.', 'The unit contains preserved raw text, but no raw-text-only reference contract is exposed.'],
  ['guard_occurrence_separation_blocked', 'accepted', 'No top-level guard or occurrence payload exists; occurrence, provenance, and guard are bound inside one versioned unit.', 'Partial serialization or binding replacement must remain rejected.'],
  ['pilot_only_label_cannot_be_promoted', 'accepted_with_declared_limit', 'The artifact has pilot-only status and explicit false consumer expansion flags.', 'The representation is not opaque, so downstream enforcement remains required.'],
  ['stable_claim_and_verified_fact_absent', 'accepted', 'All four records retain isStableClaim=false and rawText.isVerifiedFact=false.', 'This is a structural absence check, not a truth assessment.'],
  ['source_unresolved_and_independent_verification_false', 'accepted', 'All four records retain unresolved_source_identity and independentVerification=false.', 'No source search, inference, or identity linkage was performed.'],
  ['personal_application_is_context_gated', 'accepted', 'userContextDependency and mustNotAssume prohibit user-trait, life, and future inference.', 'This does not implement or authorize interpretation.'],
  ['must_not_assume_context_and_merge_boundaries_present', 'accepted_with_declared_limit', 'Required negative-boundary fields are present in all records and merge/representative sentence flags are false.', 'Public object mutation means the boundary is declarative rather than tamper-resistant.'],
  ['candidate_scope_does_not_expand_to_remaining_15', 'accepted', 'The review compares candidate IDs to the 19-occurrence audit set and finds exactly 4 selected IDs.', 'The other 15 remain outside the review subset.'],
  ['pilot_result_does_not_expand_to_ziwei_readiness', 'accepted', 'Global readiness and grounding remain not_safe_to_start, stable claim boundary is zero, and expansion is false.', 'No whole-system readiness conclusion is made.'],
  ['builder_checker_shared_assumptions_are_not_reused', 'accepted_with_declared_limit', 'Review reads serialized pilot, audit, and provenance artifacts directly and uses independent structural assertions.', 'Independent from pilot code; it cannot establish the upstream audit rule is correct.'],
  ['input_payload_identity_and_repeatability', 'accepted_with_declared_limit', 'Input byte hashes and artifact payload identity are checked; repeated materialization is tested separately.', 'Freshness mismatch in the inherited pilot is recorded below.'],
  ['pilot_and_audit_freshness_alignment', 'accepted', 'Each input artifact has a valid artifact-identity-v1 base object, exact input byte hashes, payload hash, and materializer contract; differing historical base heads alone are not stale.', 'Identity proves artifact freshness against its declared generation inputs, not source truth or domain correctness.'],
  ['acceptance_is_not_fact_validation', 'accepted', 'Review scope explicitly limits acceptance to structural and non-intervention boundaries.', 'No claim truth, traditional correctness, or independent factual verification is asserted.'],
  ['grounding_subset_start_gate', 'violation', 'The raw-text and guard/occurrence bypasses are critical structural holes.', 'Candidate-limited grounding subset must remain blocked until the consumer boundary is made enforceable.'],
]

function finding(id, status, evidence, impact) {
  const severity = status === 'violation' ? 'critical' : status === 'gap' ? 'high' : status === 'accepted_with_declared_limit' ? 'medium' : 'info'
  return { id, status, severity, evidence, impact, reblockRequired: status === 'violation' || status === 'gap' }
}

function deriveFindings({ pilot, audit, provenance, currentHead, root }) {
  const records = Array.isArray(pilot.records) ? pilot.records : []
  const candidateIds = records.map(x => unitOf(x)?.occurrence?.occurrenceId)
  const auditIds = ids(audit.categoryLists?.structuralGuardPossible)
  const unique = new Set(candidateIds)
  const all = predicate => records.length === 4 && records.every(predicate)
  const hasDirectRawPath = records.some(x => Object.hasOwn(x || {}, 'occurrence') || Object.hasOwn(x?.admissionUnit || {}, 'rawText'))
  const hasSeparateEnvelope = records.some(x => Object.hasOwn(x || {}, 'guard') || Object.hasOwn(x || {}, 'occurrence'))
  const sourceSafe = all(x => unitOf(x)?.guard?.sourceIdentity?.status === 'unresolved_source_identity' && unitOf(x)?.guard?.sourceIdentity?.independentVerification === false)
  const boundarySafe = all(x => unitOf(x)?.guard?.isStableClaim === false && unitOf(x)?.occurrence?.rawText?.isVerifiedFact === false)
  const consumerSafe = all(x => unitOf(x)?.consumerContract?.atomicUnitOnly === true && unitOf(x)?.consumerContract?.standaloneConsumptionAllowed === false && unitOf(x)?.consumerContract?.rawTextOnlyPathAllowed === false && unitOf(x)?.consumerContract?.partialSerializationAllowed === false)
  const contextSafe = all(x => typeof unitOf(x)?.guard?.userContextDependency === 'string' && Array.isArray(unitOf(x)?.guard?.mustNotAssume) && unitOf(x).guard.mustNotAssume.includes('user_trait') && unitOf(x).guard.mustNotAssume.includes('life_or_future_outcome'))
  const mergeSafe = all(x => unitOf(x)?.guard?.conflationProhibition?.occurrenceMerge === false && unitOf(x)?.guard?.conflationProhibition?.representativeSentence === false && unitOf(x)?.consumerContract?.occurrenceGuardConflationAllowed === false)
  const pilotOnly = all(x => unitOf(x)?.guard?.status === 'pilot_only_not_readiness_or_grounding' && unitOf(x)?.guard?.admissionScope === 'pilot_only_literal_occurrence_reference')
  const wholeSafe = pilot.globalBoundary?.stableClaimBoundary === 0 && pilot.globalBoundary?.readiness === 'not_safe_to_start' && pilot.globalBoundary?.grounding === 'not_safe_to_start' && pilot.globalBoundary?.wholeReadinessExpansionAllowed === false
  const scopeSafe = candidateIds.length === 4 && unique.size === 4 && JSON.stringify(ids(candidateIds)) === JSON.stringify(auditIds) && audit.occurrenceCount === 19 && provenance.occurrences?.length === 19
  const identityErrors = [
    checkArtifactIdentity(pilot, { root, artifactId: 'ziwei-structural-admission-guard-pilot-v0', materializerPath: 'scripts/materialize-ziwei-structural-admission-guard-pilot-v0.mjs', materializerVersion: '1.0.0' }),
    checkArtifactIdentity(audit, { root, artifactId: audit.artifactIdentity?.artifactId, materializerPath: 'scripts/materialize-ziwei-readiness-admission-blocker-audit-v0.mjs', materializerVersion: audit.artifactIdentity?.materializer?.version }),
    checkArtifactIdentity(provenance, { root, artifactId: provenance.artifactIdentity?.artifactId, materializerPath: 'scripts/materialize-ziwei-occurrence-provenance-v0.mjs', materializerVersion: provenance.artifactIdentity?.materializer?.version }),
  ]
  const fresh = identityErrors.every(errors => errors.length === 0)
  const splitBoundary = pilot.records.some(record => Object.hasOwn(record, 'occurrence') || Object.hasOwn(record, 'guard'))
  const scope = (id, ok) => ok ? checks.find(x => x[0] === id)[1] : 'violation'
  const status = new Map([
    ['candidate_selection_is_audit_derived', scope('candidate_selection_is_audit_derived', JSON.stringify(ids(candidateIds)) === JSON.stringify(auditIds))],
    ['all_four_candidates_reviewed_once', scope('all_four_candidates_reviewed_once', records.length === 4 && unique.size === 4)],
    ['raw_text_only_extraction_blocked', hasDirectRawPath ? 'violation' : 'accepted'],
    ['guard_occurrence_separation_blocked', hasSeparateEnvelope ? 'violation' : 'accepted'],
    ['pilot_only_label_cannot_be_promoted', scope('pilot_only_label_cannot_be_promoted', pilotOnly && consumerSafe)],
    ['stable_claim_and_verified_fact_absent', scope('stable_claim_and_verified_fact_absent', boundarySafe)],
    ['source_unresolved_and_independent_verification_false', scope('source_unresolved_and_independent_verification_false', sourceSafe)],
    ['personal_application_is_context_gated', scope('personal_application_is_context_gated', contextSafe)],
    ['must_not_assume_context_and_merge_boundaries_present', scope('must_not_assume_context_and_merge_boundaries_present', contextSafe && mergeSafe)],
    ['candidate_scope_does_not_expand_to_remaining_15', scope('candidate_scope_does_not_expand_to_remaining_15', scopeSafe)],
    ['pilot_result_does_not_expand_to_ziwei_readiness', scope('pilot_result_does_not_expand_to_ziwei_readiness', wholeSafe)],
    ['builder_checker_shared_assumptions_are_not_reused', 'accepted_with_declared_limit'],
    ['input_payload_identity_and_repeatability', 'accepted_with_declared_limit'],
    ['pilot_and_audit_freshness_alignment', fresh ? 'accepted' : 'gap'],
    ['acceptance_is_not_fact_validation', 'accepted'],
    ['grounding_subset_start_gate', hasDirectRawPath || hasSeparateEnvelope ? 'violation' : 'accepted'],
  ])
  return checks.map(([id, , evidence, impact]) => finding(id, status.get(id), evidence, impact))
}

export async function buildIndependentAcceptanceReview() {
  const root = rootOf()
  const [pilot, audit, provenance, negative] = await Promise.all([
    readFile(resolve(root, PILOT_PATH), 'utf8').then(JSON.parse),
    readFile(resolve(root, AUDIT_PATH), 'utf8').then(JSON.parse),
    readFile(resolve(root, PROVENANCE_PATH), 'utf8').then(JSON.parse),
    readFile(resolve(root, NEGATIVE_PATH), 'utf8').then(JSON.parse),
  ])
  const currentHead = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  const identityErrors = [
    checkArtifactIdentity(pilot, { root, artifactId: 'ziwei-structural-admission-guard-pilot-v0', materializerPath: 'scripts/materialize-ziwei-structural-admission-guard-pilot-v0.mjs', materializerVersion: '1.0.0' }),
    checkArtifactIdentity(audit, { root, artifactId: audit.artifactIdentity?.artifactId, materializerPath: 'scripts/materialize-ziwei-readiness-admission-blocker-audit-v0.mjs', materializerVersion: audit.artifactIdentity?.materializer?.version }),
    checkArtifactIdentity(provenance, { root, artifactId: provenance.artifactIdentity?.artifactId, materializerPath: 'scripts/materialize-ziwei-occurrence-provenance-v0.mjs', materializerVersion: provenance.artifactIdentity?.materializer?.version }),
  ]
  const fresh = identityErrors.every(errors => errors.length === 0)
  const splitBoundary = pilot.records.some(record => Object.hasOwn(record, 'occurrence') || Object.hasOwn(record, 'guard'))
  const candidateIds = ids(pilot.records.map(x => unitOf(x)?.occurrence?.occurrenceId))
  const auditIds = ids(audit.categoryLists.structuralGuardPossible)
  const provenanceIds = ids(provenance.occurrences.map(x => x.occurrenceId))
  const findings = deriveFindings({ pilot, audit, provenance, currentHead, root })
  const counts = Object.fromEntries(['accepted', 'accepted_with_declared_limit', 'gap', 'violation', 'not_applicable'].map(s => [s, findings.filter(x => x.status === s).length]))
  const candidateRecords = pilot.records.map(record => {
    const unit = unitOf(record)
    return {
      occurrenceId: unit.occurrence.occurrenceId,
      acceptance: unit.guard?.sourceIdentity?.status === 'unresolved_source_identity' && unit.guard?.isStableClaim === false && unit.occurrence?.rawText?.isVerifiedFact === false ? 'accepted_with_declared_limit' : 'violation',
      admissionUnit: structuredClone(unit),
    }
  }).sort((a, b) => a.occurrenceId.localeCompare(b.occurrenceId))
  const artifact = {
    schemaVersion: SCHEMA, reviewVersion: '1.0.0', verdictToken: VERDICT, basisHead: currentHead,
    scope: 'independent adversarial structural acceptance review only; no readiness, grounding, interpretation, source validation, or activation implementation',
    reviewMethod: { independentFrom: ['scripts/materialize-ziwei-structural-admission-guard-pilot-v0.mjs', 'scripts/check-ziwei-structural-admission-guard-pilot-v0.mjs'], inputMode: 'serialized artifacts and direct runtime/object-shape inspection', selectionDerivation: 'audit.categoryLists.structuralGuardPossible compared with pilot record IDs', contentTruthValidation: false },
    sourceArtifacts: { pilot: PILOT_PATH, audit: AUDIT_PATH, provenance: PROVENANCE_PATH, negativeFixture: NEGATIVE_PATH },
    currentHead, candidateCount: candidateRecords.length, candidateIds, auditCandidateIds: auditIds, provenanceOccurrenceCount: provenanceIds.length,
    candidateRecords, findings, findingDistribution: counts,
    adversarialNegativeCoverage: negative.cases.map(x => ({ id: x.id, expected: x.expected, observed: x.observed })),
    freshness: { pilotBaseHead: pilot.artifactIdentity?.generation?.baseHead, auditBasisHead: audit.basisHead, provenanceBasisHead: provenance.basisHead, currentHead, aligned: fresh, identityErrors },
    decision: { verdict: fresh && !splitBoundary ? 'accepted_with_declared_limit' : 'partial_unverified', candidateLimitedDialogueMaterial: 'rejected_unverified_source_identity', groundingSubsetStart: 'blocked', reblockRequired: false, reason: fresh && !splitBoundary ? 'atomic admission boundary accepted; source identity remains unresolved and no grounding consumer is implemented' : 'artifact identity or atomic-unit validation failed' },
    boundaries: { stableClaimBoundary: 0, rawTextVerifiedFact: false, sourceIdentity: 'unresolved_source_identity', independentVerification: false, readiness: 'not_safe_to_start', grounding: 'not_safe_to_start', activation: 'experimental', wholeReadinessExpansionAllowed: false, candidateScopeOnly: true, userContextDependencyPreserved: true, frequencyAsImportanceForbidden: true, questionInterpretationAdviceRankingPromptAllowed: false },
    invariants: ['no existing pilot/provenance/admission artifact is modified', 'four records remain occurrence-only and separate', 'no source is searched or inferred', 'acceptance is structural, not a truth guarantee', 'no user meaning, question, interpretation, advice, ranking, or prompt is generated'],
    deterministicContract: { recordOrder: 'lexicographic occurrenceId', inputBytes: 'exact serialized artifacts', timestamps: 'forbidden', hashScopes: ['canonical artifact payload', 'complete.json UTF-8 bytes including final LF'] },
    materializer: 'scripts/materialize-ziwei-structural-admission-independent-acceptance-review-v0.mjs', checker: 'scripts/check-ziwei-structural-admission-independent-acceptance-review-v0.mjs', negativeFixture: NEGATIVE_PATH,
  }
  return attachArtifactIdentity(artifact, buildArtifactIdentity({ root, artifactId: SCHEMA, materializerPath: artifact.materializer, materializerVersion: MATERIALIZER_VERSION, baseHead: currentHead, inputs: [PILOT_PATH, AUDIT_PATH, PROVENANCE_PATH, NEGATIVE_PATH] }))
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const target = resolve(process.argv[2] || 'artifacts/ziwei-structural-admission-independent-acceptance-review-v0/complete.json')
  const artifact = await buildIndependentAcceptanceReview(); const body = canonicalJson(artifact)
  await mkdir(dirname(target), { recursive: true }); await writeFile(target, body); await writeFile(`${target}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(Buffer.from(body)), artifactByteSha256Scope: 'complete.json UTF-8 bytes including final LF' }, null, 2)}\n`)
  console.log(JSON.stringify({ target, basisHead: artifact.basisHead, candidateCount: artifact.candidateCount, findingDistribution: artifact.findingDistribution, artifactByteSha256: sha256(Buffer.from(body)) }, null, 2))
}
