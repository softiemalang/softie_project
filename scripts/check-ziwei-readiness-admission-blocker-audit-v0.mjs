import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { buildAdmissionAudit, SCHEMA, VERDICT, BASIS_HEAD, MATERIALIZER_VERSION, ADMISSION_STATES } from './materialize-ziwei-readiness-admission-blocker-audit-v0.mjs'

const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value

export async function checkAdmissionAudit(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const failures = []
  const expected = await buildAdmissionAudit()
  if (candidate.schemaVersion !== SCHEMA) failures.push('schema_version')
  if (candidate.verdictToken !== VERDICT || candidate.basisHead !== BASIS_HEAD) failures.push('verdict_or_basis_head')
  if (candidate.occurrences?.length !== 19) failures.push('occurrence_count')
  if (JSON.stringify(candidate.admissionStates) !== JSON.stringify(ADMISSION_STATES)) failures.push('admission_vocabulary')
  if (candidate.baseline?.stableClaimBoundary !== 0 || candidate.baseline?.conflationRisk !== 19) failures.push('baseline_boundary_changed')
  const expectedById = new Map(expected.occurrences.map(x => [x.occurrenceId, x])); const seen = new Set()
  for (const item of candidate.occurrences || []) {
    if (seen.has(item.occurrenceId)) failures.push(`duplicate_occurrence:${item.occurrenceId}`); seen.add(item.occurrenceId)
    const source = expectedById.get(item.occurrenceId)
    if (!source) { failures.push(`unknown_occurrence:${item.occurrenceId}`); continue }
    for (const field of ['provenanceReference', 'evidenceBoundary']) if (JSON.stringify(stable(item[field])) !== JSON.stringify(stable(source[field]))) failures.push(`${field}_changed:${item.occurrenceId}`)
    if (!ADMISSION_STATES.includes(item.admission?.state)) failures.push(`invalid_state:${item.occurrenceId}`)
    if (item.admission?.primaryBlocker === 'forced_combined_blocker') failures.push(`blocker_conflated:${item.occurrenceId}`)
    if (item.admission?.state === 'eligible_after_structural_guard' && item.admission?.externalEvidenceRequired) failures.push(`external_requirement_deleted:${item.occurrenceId}`)
    if (item.admission?.state === 'eligible_after_structural_guard' && !item.admission?.claimBoundaryWithoutProceeding) failures.push(`claim_boundary_requirement_deleted:${item.occurrenceId}`)
    if (item.evidenceBoundary?.sourceIdentity !== 'unresolved_source_identity') failures.push(`unresolved_source_hidden:${item.occurrenceId}`)
    if (item.evidenceBoundary?.rawTextVerifiedFact !== false) failures.push(`raw_text_factified:${item.occurrenceId}`)
    if (!item.admission?.userContextDependency) failures.push(`user_context_missing:${item.occurrenceId}`)
    if (!item.admission?.mustNotAssume?.includes('importance_from_frequency')) failures.push(`frequency_guard_missing:${item.occurrenceId}`)
    if (item.admission?.state === 'blocked_external_evidence_required' && item.admission?.externalEvidenceRequired !== true) failures.push(`external_requirement_deleted:${item.occurrenceId}`)
    if (['blocked_external_evidence_required', 'blocked_claim_boundary_required', 'blocked_raw_text_misread_risk'].includes(item.admission?.state) && item.admission?.state === 'eligible_after_structural_guard') failures.push(`blocked_promoted:${item.occurrenceId}`)
  }
  if (JSON.stringify((candidate.occurrences || []).map(x => x.occurrenceId)) !== JSON.stringify(expected.occurrences.map(x => x.occurrenceId))) failures.push('nondeterministic_order')
  if (candidate.blockerDistribution?.eligible_after_structural_guard !== 4) failures.push('structural_guard_distribution')
  if (candidate.categoryLists?.externalEvidenceRequired?.length !== 15) failures.push('external_list')
  if (candidate.categoryLists?.excludedCurrently?.length !== 8) failures.push('excluded_list')
  if (candidate.structuralDecision?.canStartReadinessGroundingDesign !== false) failures.push('readiness_grounding_overpromoted')
  failures.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: 'scripts/materialize-ziwei-readiness-admission-blocker-audit-v0.mjs', materializerVersion: MATERIALIZER_VERSION, allowGenerationBaseInput: true }))
  return [...new Set(failures)]
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const path = resolve(process.argv[2] || 'artifacts/ziwei-readiness-admission-blocker-audit-v0/complete.json'); const bytes = await readFile(path); const artifact = JSON.parse(bytes); const failures = await checkAdmissionAudit(artifact)
  console.log(JSON.stringify({ pass: failures.length === 0, basisHead: artifact.basisHead, occurrenceCount: artifact.occurrenceCount, blockerDistribution: artifact.blockerDistribution, artifactByteSha256: createHash('sha256').update(bytes).digest('hex'), failures }, null, 2)); if (failures.length) process.exitCode = 1
}
