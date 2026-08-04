import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { buildOccurrenceProvenance, canonicalJson, SCHEMA, VERDICT, BASIS_HEAD, MATERIALIZER_VERSION, STATES } from './materialize-ziwei-occurrence-provenance-v0.mjs'

export async function checkOccurrenceProvenance(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const failures = []
  if (candidate.schemaVersion !== SCHEMA) failures.push('schema_version')
  if (candidate.verdictToken !== VERDICT || candidate.basisHead !== BASIS_HEAD) failures.push('verdict_or_basis_head')
  if (candidate.stableClaimBoundary?.count !== 0 || candidate.stableClaimBoundary?.stableClaimIds?.length !== 0) failures.push('stable_claim_boundary_nonzero')
  if (candidate.conflationRisk?.count !== 19 || candidate.conflationRisk?.ranking !== 'forbidden') failures.push('conflation_boundary_changed')
  if (candidate.sourceIdentityInventorySummary?.total !== 32 || candidate.sourceIdentityInventorySummary?.unresolved !== 32) failures.push('source_identity_summary_changed')
  if (JSON.stringify(candidate.statusVocabulary) !== JSON.stringify(STATES)) failures.push('status_vocabulary_changed')
  const expected = await buildOccurrenceProvenance()
  if (candidate.occurrences?.length !== 19) failures.push('occurrence_count')
  const expectedById = new Map(expected.occurrences.map(x => [x.occurrenceId, x]))
  const seen = new Set()
  for (const item of candidate.occurrences || []) {
    if (seen.has(item.occurrenceId)) failures.push(`duplicate_occurrence:${item.occurrenceId}`); seen.add(item.occurrenceId)
    const source = expectedById.get(item.occurrenceId)
    if (!source) { failures.push(`unknown_or_nondeterministic_id:${item.occurrenceId}`); continue }
    for (const field of ['rawText', 'source', 'featureReferences', 'ruleReferences', 'calculationReferences', 'fixtureReferences', 'evidenceReferences']) if (canonicalJson(item[field]) !== canonicalJson(source[field])) failures.push(`occurrence_${field}_changed:${item.occurrenceId}`)
    if (item.rawText?.isVerifiedFact !== false) failures.push(`raw_text_promoted:${item.occurrenceId}`)
    if (item.claimBoundary?.stableClaimId !== null || item.claimBoundary?.status !== 'claim_grouping_blocked') failures.push(`claim_boundary_promoted:${item.occurrenceId}`)
    if (item.sourceIdentity?.status !== 'unresolved_source_identity') failures.push(`source_identity_hidden:${item.occurrenceId}`)
    if (!item.conflationProhibition?.prohibited) failures.push(`conflation_prohibition_missing:${item.occurrenceId}`)
  }
  if (JSON.stringify((candidate.occurrences || []).map(x => x.occurrenceId)) !== JSON.stringify(expected.occurrences.map(x => x.occurrenceId))) failures.push('occurrence_order_changed')
  if (!candidate.evidenceIndex || Object.values(candidate.evidenceIndex).some(x => !x.occurrenceIds?.every(id => seen.has(id)))) failures.push('dangling_evidence_reference')
  if (candidate.fixturePolicy?.internal?.status !== 'regression_only' || candidate.fixturePolicy?.external?.verified !== 0) failures.push('fixture_verification_promoted')
  if (candidate.fixtureStatusInventory?.length !== 6 || candidate.fixtureStatusInventory.filter(x => x.statuses.includes('configuration_mismatch')).length !== 2 || candidate.fixtureStatusInventory.some(x => !x.statuses.includes('source_identity_unresolved'))) failures.push('fixture_statuses_collapsed')
  if (candidate.forbiddenTransformations?.includes('frequency_ranking') !== true) failures.push('frequency_ranking_not_forbidden')
  if (candidate.readinessGroundingDecision?.readiness !== 'not_safe_to_start' || candidate.readinessGroundingDecision?.grounding !== 'not_safe_to_start') failures.push('readiness_grounding_overpromoted')
  failures.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: 'scripts/materialize-ziwei-occurrence-provenance-v0.mjs', materializerVersion: MATERIALIZER_VERSION }))
  return [...new Set(failures)]
}

if (process.argv[1] === new URL(import.meta.url).pathname) { const path = resolve(process.argv[2] || 'artifacts/ziwei-occurrence-level-provenance-v0/complete.json'); const bytes = await readFile(path); const artifact = JSON.parse(bytes); const failures = await checkOccurrenceProvenance(artifact); console.log(JSON.stringify({ pass: failures.length === 0, schemaVersion: artifact.schemaVersion, basisHead: artifact.basisHead, occurrenceCount: artifact.occurrences?.length || 0, evidenceKindCounts: artifact.evidenceKindCounts, artifactByteSha256: createHash('sha256').update(bytes).digest('hex'), canonicalPayloadByteSha256: createHash('sha256').update(canonicalJson(artifact), 'utf8').digest('hex'), failures }, null, 2)); if (failures.length) process.exitCode = 1 }
