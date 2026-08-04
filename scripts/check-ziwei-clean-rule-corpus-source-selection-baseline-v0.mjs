import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import {
  CLEAN_CONTENT_CLASSES,
  deterministicSourceId,
  validateSourceAdmissionRecord,
} from '../src/ziwei/cleanRuleCorpusSourceSelection.js'
import {
  SOURCE_SELECTION_SCHEMA,
  SOURCE_SELECTION_VERDICT,
  SOURCE_SELECTION_HEAD,
  SOURCE_SELECTION_MATERIALIZER_VERSION,
} from './materialize-ziwei-clean-rule-corpus-source-selection-baseline-v0.mjs'

const root = resolve(new URL('..', import.meta.url).pathname)
const path = resolve(process.argv[2] || 'artifacts/ziwei-clean-rule-corpus-source-selection-baseline-v0/complete.json')
const failures = []
const bytes = await readFile(path)
const artifact = JSON.parse(bytes)
const candidates = artifact.candidateInventory || []

if (artifact.schemaVersion !== SOURCE_SELECTION_SCHEMA) failures.push('schema_version')
if (artifact.verdictToken !== SOURCE_SELECTION_VERDICT || artifact.basisHead !== SOURCE_SELECTION_HEAD) failures.push('verdict_or_basis_head')
if (artifact.observedHead !== SOURCE_SELECTION_HEAD) failures.push('observed_head_not_fixed')
if (artifact.candidateCount !== candidates.length || candidates.length < 3) failures.push('candidate_count')
if (artifact.candidateValidation?.pass !== true) failures.push('candidate_validation_not_pass')
failures.push(...checkArtifactIdentity(artifact, {
  root,
  artifactId: SOURCE_SELECTION_SCHEMA,
  materializerPath: 'scripts/materialize-ziwei-clean-rule-corpus-source-selection-baseline-v0.mjs',
  materializerVersion: SOURCE_SELECTION_MATERIALIZER_VERSION,
}))

const ids = candidates.map(candidate => candidate.candidateId)
const sortedIds = [...ids].sort()
if (JSON.stringify(ids) !== JSON.stringify(sortedIds)) failures.push('candidate_sort_not_deterministic')
if (new Set(ids).size !== ids.length) failures.push('candidate_id_duplicate')
for (const candidate of candidates) {
  if (candidate.candidateId !== deterministicSourceId(candidate)) failures.push(`candidate_id_not_derived:${candidate.sourceKey}`)
  failures.push(...validateSourceAdmissionRecord(candidate).map(error => `${candidate.candidateId}:${error}`))
  if (candidate.legacyOccurrenceLink !== null) failures.push(`legacy_occurrence_link:${candidate.candidateId}`)
  if (candidate.verifiedClaim === true || candidate.ready === true || candidate.grounded === true || candidate.activation === 'active') failures.push(`promotion_flag:${candidate.candidateId}`)
  for (const contentClass of CLEAN_CONTENT_CLASSES) {
    const status = candidate.contentClasses?.[contentClass]?.status
    if (status === 'allowed') failures.push(`content_promoted:${candidate.candidateId}:${contentClass}`)
  }
  if (candidate.fileIdentity?.inferred !== false) failures.push(`file_identity_inferred:${candidate.candidateId}`)
  if (candidate.lineage?.inferred !== false) failures.push(`lineage_inferred:${candidate.candidateId}`)
  if (candidate.legalAccess?.bypassUsed !== false || candidate.textAccessibility?.bypassUsed !== false) failures.push(`access_bypass:${candidate.candidateId}`)
}

const computedDistribution = Object.fromEntries(['admissible', 'admissible_with_limits', 'reference_only', 'rejected', 'access_blocked', 'identity_unresolved'].map(verdict => [verdict, candidates.filter(candidate => candidate.verdict === verdict).length]))
if (Object.keys(computedDistribution).some(verdict => computedDistribution[verdict] !== artifact.verdictDistribution?.[verdict])) failures.push('verdict_distribution_mismatch')
const independentGroups = [...new Set(candidates.filter(candidate => candidate.independence?.countsAsIndependentCandidate).map(candidate => candidate.independence.groupKey))].sort()
if (artifact.independentCandidateCount !== independentGroups.length || JSON.stringify(artifact.independentCandidateGroupKeys) !== JSON.stringify(independentGroups)) failures.push('independence_count_mismatch')
if (candidates.some(candidate => candidate.independence?.status !== 'established' && candidate.independence?.countsAsIndependentCandidate)) failures.push('unresolved_independence_counted')

const selection = artifact.selectionDecision || {}
if (selection.status !== 'blocked' || selection.firstCleanCorpusPilotSourceId !== null || selection.admissibleCandidateIds?.length !== 0 || selection.admissibleWithLimitsCandidateIds?.length !== 0) failures.push('selection_promoted')
const downstream = artifact.downstreamBoundaries || {}
if (downstream.actualRuleCorpusGenerated !== false || downstream.stableClaimCount !== 0 || downstream.readiness !== 'not_safe_to_start' || downstream.grounding !== 'blocked' || downstream.activation !== 'experimental' || downstream.legacyOccurrenceAutoLink !== false || downstream.interpretationGenerated !== false || downstream.rankingGenerated !== false || downstream.promptGenerated !== false) failures.push('downstream_boundary_promoted')
if (artifact.lineageAccounting?.noPopularityOrCandidateCountRanking !== true) failures.push('ranking_boundary_missing')
if (artifact.candidateValidation?.errors && Object.values(artifact.candidateValidation.errors).some(errors => errors.length)) failures.push('materializer_candidate_errors')

const result = {
  pass: failures.length === 0,
  schemaVersion: artifact.schemaVersion,
  basisHead: artifact.basisHead,
  artifactByteSha256: createHash('sha256').update(bytes).digest('hex'),
  candidateCount: candidates.length,
  independentCandidateCount: artifact.independentCandidateCount,
  verdictDistribution: artifact.verdictDistribution,
  selectionStatus: selection.status,
  failures: [...new Set(failures)],
}
console.log(JSON.stringify(result, null, 2))
if (result.failures.length) process.exitCode = 1
