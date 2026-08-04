import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { buildStructuralAdmissionGuardPilot, SCHEMA, VERDICT, MATERIALIZER_VERSION, AUDIT_PATH } from './materialize-ziwei-structural-admission-guard-pilot-v0.mjs'
import { GUARD_SCHEMA, consumeGuardedOccurrence } from './lib/ziwei-structural-admission-guard.mjs'
const stable = v => Array.isArray(v) ? v.map(stable) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, stable(v[k])])) : v
const same = (a, b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b))

export async function checkStructuralAdmissionGuardPilot(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const failures = []; const expected = await buildStructuralAdmissionGuardPilot()
  if (candidate.schemaVersion !== SCHEMA || candidate.verdictToken !== VERDICT) failures.push('schema_or_verdict')
  if (candidate.occurrenceCount !== 4 || candidate.records?.length !== 4) failures.push('candidate_count')
  if (candidate.sourceAudit?.path !== AUDIT_PATH || candidate.sourceAudit?.selectedPath !== 'categoryLists.structuralGuardPossible') failures.push('audit_selection_path')
  if (candidate.globalBoundary?.stableClaimBoundary !== 0 || candidate.globalBoundary?.readiness !== 'not_safe_to_start' || candidate.globalBoundary?.grounding !== 'not_safe_to_start' || candidate.globalBoundary?.wholeReadinessExpansionAllowed !== false) failures.push('whole_readiness_overpromoted')
  const expectedById = new Map(expected.records.map(x => [x.occurrence.occurrenceId, x])); const seen = new Set()
  for (const record of candidate.records || []) {
    const id = record.occurrence?.occurrenceId
    if (seen.has(id)) failures.push(`duplicate:${id}`); seen.add(id)
    const source = expectedById.get(id); if (!source) { failures.push(`unknown_candidate:${id}`); continue }
    if (!same(record.occurrence, source.occurrence)) failures.push(`occurrence_or_provenance_changed:${id}`)
    if (record.guard?.isStableClaim !== false || record.guard?.sourceIdentity?.status !== 'unresolved_source_identity' || record.guard?.sourceIdentity?.independentVerification !== false) failures.push(`evidence_promoted:${id}`)
    if (record.occurrence?.rawText?.isVerifiedFact !== false) failures.push(`raw_text_factified:${id}`)
    for (const field of ['mustNotAssume', 'userContextDependency', 'conflationProhibition', 'rawTextConsumptionRestriction', 'blockedFallbackReason']) if (!record.guard?.[field]) failures.push(`guard_field_missing:${field}:${id}`)
    if (record.guard?.standaloneConsumptionAllowed !== false || record.consumerContract?.standaloneConsumptionAllowed !== false || record.consumerContract?.rawTextOnlyPathAllowed !== false) failures.push(`unsafe_consumer_path:${id}`)
    if (record.guard?.conflationProhibition?.occurrenceMerge !== false || record.guard?.conflationProhibition?.representativeSentence !== false) failures.push(`conflation_allowed:${id}`)
    if (record.consumerContract?.interpretationQuestionAdviceRankingPromptAllowed !== false) failures.push(`forbidden_consumer_field:${id}`)
    if (record.consumerContract?.wholeReadinessExpansionAllowed !== false) failures.push(`record_readiness_expansion:${id}`)
    if (['question', 'interpretation', 'advice', 'ranking', 'prompt', 'llmInstruction'].some(field => Object.hasOwn(record, field) || Object.hasOwn(record.guard || {}, field) || Object.hasOwn(record.consumerContract || {}, field))) failures.push(`meaning_or_prompt_field:${id}`)
    if (record.assessment?.result !== 'limited_admission_possible' || record.assessment?.pilotFailureFallback !== 'pilot_reblocked') failures.push(`invalid_assessment:${id}`)
    try { consumeGuardedOccurrence(record) } catch { failures.push(`reference_consumer_rejected:${id}`) }
  }
  if (JSON.stringify((candidate.records || []).map(x => x.occurrence?.occurrenceId)) !== JSON.stringify(expected.records.map(x => x.occurrence.occurrenceId))) failures.push('nondeterministic_order')
  if (!same(candidate.resultDistribution, { limited_admission_possible: 4, additional_structural_restriction_required: 0, pilot_reblocked: 0 })) failures.push('result_distribution')
  failures.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: 'scripts/materialize-ziwei-structural-admission-guard-pilot-v0.mjs', materializerVersion: MATERIALIZER_VERSION }))
  return [...new Set(failures)]
}

if (process.argv[1] === new URL(import.meta.url).pathname) { const path = resolve(process.argv[2] || 'artifacts/ziwei-structural-admission-guard-pilot-v0/complete.json'); const bytes = await readFile(path); const artifact = JSON.parse(bytes); const failures = await checkStructuralAdmissionGuardPilot(artifact); console.log(JSON.stringify({ pass: failures.length === 0, basisHead: artifact.basisHead, occurrenceCount: artifact.occurrenceCount, resultDistribution: artifact.resultDistribution, artifactByteSha256: createHash('sha256').update(bytes).digest('hex'), failures }, null, 2)); if (failures.length) process.exitCode = 1 }
