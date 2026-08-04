import { buildAdmissionAudit } from './materialize-ziwei-readiness-admission-blocker-audit-v0.mjs'
import { checkAdmissionAudit } from './check-ziwei-readiness-admission-blocker-audit-v0.mjs'

const base = await buildAdmissionAudit()
const cases = [
  ['blocked_occurrence_ready_promoted', x => { x.occurrences[0].admission.state = 'eligible_after_structural_guard' }],
  ['claim_boundary_invented', x => { x.occurrences[0].evidenceBoundary.stableClaimId = 'claim-invented' }],
  ['unresolved_source_hidden', x => { x.occurrences[0].evidenceBoundary.sourceIdentity = 'verified' }],
  ['raw_text_factified', x => { x.occurrences[0].evidenceBoundary.rawTextVerifiedFact = true }],
  ['user_context_deleted', x => { delete x.occurrences[0].admission.userContextDependency }],
  ['external_evidence_deleted', x => { x.occurrences[0].admission.externalEvidenceRequired = false }],
  ['frequency_admission', x => { x.occurrences[0].admission.mustNotAssume = x.occurrences[0].admission.mustNotAssume.filter(v => v !== 'importance_from_frequency') }],
  ['blockers_forced_together', x => { x.occurrences[0].admission.primaryBlocker = 'forced_combined_blocker' }],
  ['nondeterministic_sort', x => { x.occurrences.reverse() }],
]
const findings = []
for (const [name, mutate] of cases) { const candidate = structuredClone(base); mutate(candidate); if ((await checkAdmissionAudit(candidate)).length) findings.push(name) }
const result = { pass: findings.length === cases.length, caseCount: cases.length, findings, expectedCases: cases.map(([name]) => name) }
console.log(JSON.stringify(result, null, 2)); if (!result.pass) process.exitCode = 1
