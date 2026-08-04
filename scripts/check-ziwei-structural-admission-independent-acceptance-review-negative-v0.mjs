import { buildIndependentAcceptanceReview } from './materialize-ziwei-structural-admission-independent-acceptance-review-v0.mjs'
import { checkIndependentAcceptanceReview } from './check-ziwei-structural-admission-independent-acceptance-review-v0.mjs'
const cases = [
  ['raw_text_only_extraction', x => { x.candidateRecords[0].rawText = x.candidateRecords[0].admissionUnit.occurrence.rawText.text }],
  ['guard_occurrence_separate_consumption', x => { x.candidateRecords[0].guard = x.candidateRecords[0].admissionUnit.guard }],
  ['stable_claim_or_verified_fact_promotion', x => { x.candidateRecords[0].admissionUnit.guard.isStableClaim = true }],
  ['source_unresolved_hidden', x => { x.candidateRecords[0].admissionUnit.guard.sourceIdentity.status = 'verified' }],
  ['context_or_must_not_assume_missing', x => { delete x.candidateRecords[0].admissionUnit.guard.mustNotAssume }],
  ['merge_or_representative_sentence', x => { x.candidateRecords[0].admissionUnit.guard.conflationProhibition.representativeSentence = true }],
  ['pilot_only_removed', x => { x.candidateRecords[0].admissionUnit.consumerContract.standaloneConsumptionAllowed = true }],
  ['candidate_outside_four', x => { x.candidateIds[0] = 'ziwei-occ-outside-candidate' }],
  ['whole_readiness_expansion', x => { x.boundaries.wholeReadinessExpansionAllowed = true }],
  ['question_interpretation_advice_prompt', x => { x.boundaries.questionInterpretationAdviceRankingPromptAllowed = true }],
  ['binding_replaced', x => { x.candidateRecords[0].admissionUnit.binding.occurrenceId = 'ziwei-occ-replaced' }],
  ['required_guard_partial', x => { delete x.candidateRecords[0].admissionUnit.guard.userContextDependency }],
  ['partial_serialization', x => { delete x.candidateRecords[0].admissionUnit.guard }],
  ['self_referential_head_contract', x => { x.artifactIdentity.generation.includedCommit = x.basisHead }],
]
const base = await buildIndependentAcceptanceReview(); const findings = []
for (const [name, mutate] of cases) { const candidate = structuredClone(base); mutate(candidate); if ((await checkIndependentAcceptanceReview(candidate)).length) findings.push(name) }
const result = { pass: findings.length === cases.length, caseCount: cases.length, findings, expectedCases: cases.map(([name]) => name) }
console.log(JSON.stringify(result, null, 2)); if (!result.pass) process.exitCode = 1
