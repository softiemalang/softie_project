import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { validateAdmissionUnit } from './lib/ziwei-structural-admission-guard.mjs'
import { SCHEMA, VERDICT, MATERIALIZER_VERSION, PILOT_PATH, AUDIT_PATH, PROVENANCE_PATH } from './materialize-ziwei-structural-admission-independent-acceptance-review-v0.mjs'
const stable = v => Array.isArray(v) ? v.map(stable) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, stable(v[k])])) : v
const same = (a, b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b))
export async function checkIndependentAcceptanceReview(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const failures = []
  const [pilot, audit, provenance] = await Promise.all([
    readFile(resolve(root, PILOT_PATH), 'utf8').then(JSON.parse),
    readFile(resolve(root, AUDIT_PATH), 'utf8').then(JSON.parse),
    readFile(resolve(root, PROVENANCE_PATH), 'utf8').then(JSON.parse),
  ])
  const sourceIds = [...audit.categoryLists.structuralGuardPossible].sort()
  const sourceRecords = pilot.records.map(x => ({
    occurrenceId: x.admissionUnit?.occurrence?.occurrenceId,
    acceptance: x.admissionUnit?.guard?.sourceIdentity?.status === 'unresolved_source_identity' && x.admissionUnit?.guard?.isStableClaim === false && x.admissionUnit?.occurrence?.rawText?.isVerifiedFact === false ? 'accepted_with_declared_limit' : 'violation',
    admissionUnit: structuredClone(x.admissionUnit),
  })).sort((a, b) => a.occurrenceId.localeCompare(b.occurrenceId))
  const expectedStatuses = { candidate_selection_is_audit_derived: 'accepted_with_declared_limit', all_four_candidates_reviewed_once: 'accepted', raw_text_only_extraction_blocked: 'accepted', guard_occurrence_separation_blocked: 'accepted', pilot_only_label_cannot_be_promoted: 'accepted_with_declared_limit', stable_claim_and_verified_fact_absent: 'accepted', source_unresolved_and_independent_verification_false: 'accepted', personal_application_is_context_gated: 'accepted', must_not_assume_context_and_merge_boundaries_present: 'accepted_with_declared_limit', candidate_scope_does_not_expand_to_remaining_15: 'accepted', pilot_result_does_not_expand_to_ziwei_readiness: 'accepted', builder_checker_shared_assumptions_are_not_reused: 'accepted_with_declared_limit', input_payload_identity_and_repeatability: 'accepted_with_declared_limit', pilot_and_audit_freshness_alignment: 'accepted', acceptance_is_not_fact_validation: 'accepted', grounding_subset_start_gate: 'accepted' }
  if (candidate.schemaVersion !== SCHEMA || candidate.verdictToken !== VERDICT) failures.push('schema_or_verdict')
  if (candidate.candidateCount !== 4 || candidate.candidateIds?.length !== 4 || new Set(candidate.candidateIds).size !== 4) failures.push('candidate_count_or_unique')
  if (!same(candidate.candidateIds, sourceIds) || !same(candidate.auditCandidateIds, sourceIds)) failures.push('candidate_not_audit_derived')
  if (candidate.boundaries?.stableClaimBoundary !== 0 || candidate.boundaries?.sourceIdentity !== 'unresolved_source_identity' || candidate.boundaries?.independentVerification !== false || candidate.boundaries?.readiness !== 'not_safe_to_start' || candidate.boundaries?.grounding !== 'not_safe_to_start') failures.push('boundary_promoted')
  if (candidate.decision?.groundingSubsetStart !== 'blocked' || candidate.decision?.reblockRequired !== false || candidate.decision?.candidateLimitedDialogueMaterial !== 'rejected_unverified_source_identity') failures.push('unsafe_start_decision')
  if (candidate.findingDistribution?.violation !== 0 || candidate.findingDistribution?.gap !== 0) failures.push('finding_distribution')
  if (!candidate.findings?.some(x => x.id === 'raw_text_only_extraction_blocked' && x.status === 'accepted')) failures.push('raw_text_bypass_not_cleared')
  if (!candidate.findings?.some(x => x.id === 'guard_occurrence_separation_blocked' && x.status === 'accepted')) failures.push('separation_bypass_not_cleared')
  if (!candidate.freshness || candidate.freshness.aligned !== true || candidate.freshness.identityErrors?.some(x => x.length)) failures.push('freshness_identity_missing')
  if (!same(candidate.candidateRecords, sourceRecords)) failures.push('candidate_record_mutation')
  for (const record of candidate.candidateRecords || []) {
    const unitKeys = Object.keys(record.admissionUnit || {}).sort()
    if (unitKeys.join(',') !== ['binding', 'consumerContract', 'guard', 'occurrence', 'schemaVersion', 'unitVersion'].join(',')) failures.push(`partial_unit:${record.occurrenceId}`)
    if (validateAdmissionUnit(record.admissionUnit).length) failures.push(`invalid_unit:${record.occurrenceId}`)
    if (Object.hasOwn(record, 'rawText') || Object.hasOwn(record, 'guard') || Object.hasOwn(record, 'occurrence')) failures.push(`split_candidate:${record.occurrenceId}`)
  }
  if (candidate.findings?.length !== Object.keys(expectedStatuses).length || candidate.findings.some(x => expectedStatuses[x.id] !== x.status || !['accepted', 'accepted_with_declared_limit', 'gap', 'violation', 'not_applicable'].includes(x.status) || !x.severity || typeof x.impact !== 'string' || typeof x.reblockRequired !== 'boolean')) failures.push('finding_mutation')
  if (candidate.findings?.filter(x => x.status === 'violation').some(x => !x.reblockRequired || x.severity !== 'critical')) failures.push('violation_severity_or_reblock')
  if (candidate.findings?.filter(x => x.status === 'gap').some(x => !x.reblockRequired || x.severity !== 'high')) failures.push('gap_severity_or_reblock')
  if (!same(candidate.candidateIds, sourceIds) || !same(candidate.auditCandidateIds, sourceIds)) failures.push('candidate_scope_changed')
  if (candidate.provenanceOccurrenceCount !== provenance.occurrences.length || candidate.provenanceOccurrenceCount !== 19) failures.push('whole_corpus_scope_changed')
  failures.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: 'scripts/materialize-ziwei-structural-admission-independent-acceptance-review-v0.mjs', materializerVersion: MATERIALIZER_VERSION }))
  return [...new Set(failures)]
}
if (process.argv[1] === new URL(import.meta.url).pathname) { const path = resolve(process.argv[2] || 'artifacts/ziwei-structural-admission-independent-acceptance-review-v0/complete.json'); const bytes = await readFile(path); const artifact = JSON.parse(bytes); const failures = await checkIndependentAcceptanceReview(artifact); console.log(JSON.stringify({ pass: failures.length === 0, basisHead: artifact.basisHead, candidateCount: artifact.candidateCount, findingDistribution: artifact.findingDistribution, artifactByteSha256: createHash('sha256').update(bytes).digest('hex'), failures }, null, 2)); if (failures.length) process.exitCode = 1 }
