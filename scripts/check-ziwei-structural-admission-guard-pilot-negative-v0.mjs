import { buildStructuralAdmissionGuardPilot } from './materialize-ziwei-structural-admission-guard-pilot-v0.mjs'
import { checkStructuralAdmissionGuardPilot } from './check-ziwei-structural-admission-guard-pilot-v0.mjs'
const cases = [
  ['candidate_outside_audit', x => { x.records[0].occurrence.occurrenceId = 'ziwei-occ-not-a-candidate' }],
  ['stable_claim_promoted', x => { x.records[0].guard.isStableClaim = true }],
  ['verified_fact_promoted', x => { x.records[0].occurrence.rawText.isVerifiedFact = true }],
  ['source_unresolved_hidden', x => { x.records[0].guard.sourceIdentity.status = 'verified' }],
  ['raw_text_only_consumer', x => { x.records[0].consumerContract.rawTextOnlyPathAllowed = true }],
  ['must_not_assume_deleted', x => { delete x.records[0].guard.mustNotAssume }],
  ['user_context_deleted', x => { delete x.records[0].guard.userContextDependency }],
  ['occurrences_merged', x => { x.records[1].occurrence.rawText.text = x.records[0].occurrence.rawText.text }],
  ['representative_sentence_added', x => { x.records[0].guard.conflationProhibition.representativeSentence = true }],
  ['question_interpretation_advice_ranking_prompt_added', x => { x.records[0].ranking = 'high'; x.records[0].consumerContract.interpretationQuestionAdviceRankingPromptAllowed = true }],
  ['whole_readiness_expanded', x => { x.globalBoundary.wholeReadinessExpansionAllowed = true }],
  ['nondeterministic_id_or_sort', x => { x.records.reverse() }],
]
const base = await buildStructuralAdmissionGuardPilot(); const findings = []
for (const [name, mutate] of cases) { const candidate = structuredClone(base); mutate(candidate); if ((await checkStructuralAdmissionGuardPilot(candidate)).length) findings.push(name) }
const result = { pass: findings.length === cases.length, caseCount: cases.length, findings, expectedCases: cases.map(([name]) => name) }
console.log(JSON.stringify(result, null, 2)); if (!result.pass) process.exitCode = 1
