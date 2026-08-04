import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'
import {
  CLEAN_CONTENT_CLASSES,
  CLEAN_RULE_CORPUS_SOURCE_ADMISSION_SCHEMA,
  CLEAN_RULE_CORPUS_SOURCE_ADMISSION_VERSION,
  deterministicSourceId,
  validateSourceAdmissionRecord,
} from '../src/ziwei/cleanRuleCorpusSourceSelection.js'

export const SOURCE_SELECTION_SCHEMA = 'ziwei-clean-rule-corpus-source-selection-baseline-v0'
export const SOURCE_SELECTION_VERDICT = 'ziwei_clean_rule_corpus_source_selection_partial_blocked'
export const SOURCE_SELECTION_HEAD = '2595e087eaea4adb667a0280a677476aebcb80df'
export const SOURCE_SELECTION_MATERIALIZER_VERSION = '0.1.0'
export const SOURCE_CANDIDATE_INPUT = 'test/fixtures/ziwei/clean-rule-corpus-source-candidates-v0.json'

const sourceFiles = [
  SOURCE_CANDIDATE_INPUT,
  'src/ziwei/cleanRuleCorpusSourceSelection.js',
]

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value)
  ? value.map(stable)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
    : value

export const canonicalJson = value => `${JSON.stringify(stable(value), null, 2)}\n`

const contentClassPolicy = Object.fromEntries(CLEAN_CONTENT_CLASSES.map(contentClass => [contentClass, {
  admissible: 'Only when the candidate record closes identity, location, direct original text, legal access, and required file evidence.',
  admissible_with_limits: 'May be separately allowed only with explicit limits and no interpretive-claim promotion; this baseline has no such candidate.',
  reference_only: 'Not allowed as corpus content; may guide a future source retrieval request.',
  access_blocked: 'Not allowed while access or file identity is blocked.',
  identity_unresolved: 'Not allowed while edition, lineage, or source location is unresolved.',
  rejected: 'Not allowed.',
}[contentClass]]))

export async function materializeSourceSelection() {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const baseHead = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  if (baseHead !== SOURCE_SELECTION_HEAD) throw new Error(`source selection baseline requires HEAD ${SOURCE_SELECTION_HEAD}; observed ${baseHead}`)
  const input = JSON.parse(await readFile(resolve(root, SOURCE_CANDIDATE_INPUT), 'utf8'))
  const candidates = input.candidates.map(candidate => ({
    ...structuredClone(candidate),
    candidateId: deterministicSourceId(candidate),
    accessedOn: input.accessedOn,
  })).sort((a, b) => a.candidateId.localeCompare(b.candidateId))
  const candidateErrors = Object.fromEntries(candidates.map(candidate => [candidate.candidateId, validateSourceAdmissionRecord(candidate)]))
  const distribution = Object.fromEntries(['admissible', 'admissible_with_limits', 'reference_only', 'rejected', 'access_blocked', 'identity_unresolved'].map(verdict => [verdict, candidates.filter(candidate => candidate.verdict === verdict).length]))
  const independentGroups = [...new Set(candidates.filter(candidate => candidate.independence.countsAsIndependentCandidate).map(candidate => candidate.independence.groupKey))].sort()
  const artifact = {
    schemaVersion: SOURCE_SELECTION_SCHEMA,
    sourceAdmissionContract: {
      schema: CLEAN_RULE_CORPUS_SOURCE_ADMISSION_SCHEMA,
      version: CLEAN_RULE_CORPUS_SOURCE_ADMISSION_VERSION,
      atomicAdmissionUnit: 'one source edition or explicitly identified digital witness plus its location/file/lineage/access evidence',
      requiredAxes: ['sourceIdentity', 'locationIdentity', 'fileIdentity', 'textAccessibility', 'lineage', 'ruleExtractability', 'workedEvidence', 'legalAccess'],
      verdicts: ['admissible', 'admissible_with_limits', 'reference_only', 'rejected', 'access_blocked', 'identity_unresolved'],
      admissibleRequirements: ['closed signature/author-editor/edition/publisher/year', 'stable edition and volume/chapter/section location', 'direct original text confirmation', 'legal access without bypass', 'verified file hash for unqualified admissible'],
      limitedRequirements: ['same edition/location/original-text/legal gates', 'missing hash or other declared limit must be explicit', 'no interpretive prose promotion'],
      forbiddenShortcuts: ['catalog_as_scan', 'inferred_file_identity', 'inferred_lineage', 'mirror_or_reprint_double_count', 'blog_or_ai_unattributed_promotion', 'access_bypass', 'legacy_occurrence_auto_link', 'readiness_grounding_activation_promotion', 'nondeterministic_id_or_sort'],
    },
    verdictToken: SOURCE_SELECTION_VERDICT,
    basisHead: SOURCE_SELECTION_HEAD,
    observedHead: baseHead,
    accessedOn: input.accessedOn,
    scope: 'source_candidate_inventory_and_admission_assessment_only; no clean rule corpus materialized',
    candidateInventory: candidates,
    candidateCount: candidates.length,
    independentCandidateCount: independentGroups.length,
    independentCandidateGroupKeys: independentGroups,
    verdictDistribution: distribution,
    candidateValidation: { pass: Object.values(candidateErrors).every(errors => errors.length === 0), errors: candidateErrors },
    contentClassPolicy,
    selectionDecision: {
      status: 'blocked',
      admissibleCandidateIds: [],
      admissibleWithLimitsCandidateIds: [],
      firstCleanCorpusPilotSourceId: null,
      reason: 'No candidate simultaneously closes exact edition, stable source location, directly confirmable original text, and immutable file identity without access restrictions. Do not lower the threshold or generate corpus content.',
    },
    downstreamBoundaries: {
      actualRuleCorpusGenerated: false,
      stableClaimCount: 0,
      readiness: 'not_safe_to_start',
      grounding: 'blocked',
      activation: 'experimental',
      legacyOccurrenceAutoLink: false,
      interpretationGenerated: false,
      rankingGenerated: false,
      promptGenerated: false,
    },
    lineageAccounting: {
      rule: 'Only independence.status=established and countsAsIndependentCandidate=true contributes to independentCandidateCount.',
      unresolvedTranscriptionGroupsExcluded: candidates.filter(candidate => candidate.independence.status === 'unresolved').map(candidate => candidate.independence.groupKey).filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).sort(),
      noPopularityOrCandidateCountRanking: true,
    },
    prohibitedChangesPreserved: ['legacy occurrence provenance', 'legacy source-recovery artifacts', 'existing guards and audits', 'readiness/grounding/activation states', 'calculation/rule corpus/claims/interpretation/questions/advice/ranking/prompts', 'UI/API/DB/LLM/production consumers/tri-system envelope'],
    deterministicContract: {
      candidateId: 'sha256(sourceKey + bibliographic identity + stableUrls) truncated to 16 hex',
      sorting: 'candidateId lexicographic ascending',
      timestamps: 'accessedOn is an explicit inventory field; generated time is forbidden',
      sourceTextNormalization: 'forbidden; no source text is stored',
      fileHashScope: 'candidate file identity is recorded only when directly evidenced; null is not upgraded',
      repeatedMaterialization: 'complete.json bytes must be identical at fixed HEAD and input bytes',
    },
    materializer: 'scripts/materialize-ziwei-clean-rule-corpus-source-selection-baseline-v0.mjs',
    checker: 'scripts/check-ziwei-clean-rule-corpus-source-selection-baseline-v0.mjs',
  }
  return attachArtifactIdentity(artifact, buildArtifactIdentity({
    root,
    artifactId: SOURCE_SELECTION_SCHEMA,
    materializerPath: 'scripts/materialize-ziwei-clean-rule-corpus-source-selection-baseline-v0.mjs',
    materializerVersion: SOURCE_SELECTION_MATERIALIZER_VERSION,
    baseHead,
    inputs: sourceFiles,
  }))
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const target = resolve(process.argv[2] || 'artifacts/ziwei-clean-rule-corpus-source-selection-baseline-v0/complete.json')
  const artifact = await materializeSourceSelection()
  const body = canonicalJson(artifact)
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, body)
  await writeFile(`${target}.integrity.json`, `${JSON.stringify({ schemaVersion: SOURCE_SELECTION_SCHEMA, artifactByteSha256: sha256(Buffer.from(body)), artifactByteSha256Scope: 'complete.json UTF-8 bytes including final LF' }, null, 2)}\n`)
  console.log(JSON.stringify({ target, artifactByteSha256: sha256(Buffer.from(body)), candidateCount: artifact.candidateCount, independentCandidateCount: artifact.independentCandidateCount, verdictDistribution: artifact.verdictDistribution }, null, 2))
}
