import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { TRADITIONAL_BRANCH_ORDER } from '../src/ziwei/mingShenCleanRuleSeedPilot.js'
import { buildPilotArtifact, canonicalJson, SCHEMA, BASIS_HEAD, MATERIALIZER_VERSION, SOURCE_PDF, SOURCE_PDF_SHA256 } from './materialize-ziwei-ming-shen-clean-rule-seed-pilot-v0.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const same = (a, b) => canonicalJson(a) === canonicalJson(b)

export async function checkPilotArtifact(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const expected = await buildPilotArtifact(); const errors = []
  if (candidate.schemaVersion !== SCHEMA) errors.push('schema')
  if (candidate.basisHead !== BASIS_HEAD) errors.push('basis_head')
  if (candidate.sourceWitness?.pdfSha256 !== SOURCE_PDF_SHA256) errors.push('pdf_hash_or_source_ref')
  if (candidate.sourceWitness?.pdfPageCount !== 219 || !same(candidate.sourceWitness?.rulePageRange?.pdfPages, [8]) || candidate.sourceWitness?.rulePageRange?.printedPages?.[0] !== '二十五') errors.push('source_page_locator')
  if (candidate.transcription?.ocrStatus !== 'exploration_only_not_canonical') errors.push('ocr_canonical_promotion')
  if (candidate.transcription?.reviewerStatus !== 'single_human_review_complete_second_review_pending') errors.push('uncertainty_auto_correction_or_review_status')
  if (!candidate.transcription?.uncertainty?.length) errors.push('uncertainty_missing')
  if (!candidate.normalizedRule || candidate.normalizedRule.sourceTranscriptionId !== candidate.transcription?.transcriptionId) errors.push('transcription_normalization_mixing')
  if (candidate.normalizedRule?.hourPlacement?.directionForMing !== 'reverse (-1)' || candidate.normalizedRule?.hourPlacement?.directionForShen !== 'forward (+1)' || candidate.normalizedRule?.branchOrder?.indexConvention !== '子=0, 丑=1, 寅=2, ... 亥=11') errors.push('silent_direction_or_index_change')
  const rows = candidate.comparison?.rows
  if (!Array.isArray(rows) || rows.length !== 144 || candidate.comparison?.inputCount !== 144 || candidate.comparison?.expectedInputCount !== 144) errors.push('not_exhaustive_144')
  else {
    const ids = new Set(rows.map(row => row.rowId)); const keys = rows.map(row => row.orderingKey)
    if (ids.size !== 144 || keys.some((key, i) => i && key <= keys[i - 1])) errors.push('row_id_or_ordering')
    if (rows.some(row => !row.sourceDerived || !row.productionEngine || typeof row.match !== 'boolean')) errors.push('comparison_fields')
    if (candidate.comparison.matchCount !== rows.filter(row => row.match).length || candidate.comparison.mismatchCount !== rows.filter(row => !row.match).length) errors.push('mismatch_hidden_or_forced_equivalence')
    if (!same(candidate.comparison.firstDivergence, rows.find(row => !row.match) || null)) errors.push('first_divergence')
  }
  if (!Array.isArray(candidate.causePreservation) || candidate.causePreservation.length !== 5) errors.push('cause_alternatives_collapsed')
  if (candidate.independence?.sourceEvaluatorImportsProductionEngine !== false) errors.push('source_evaluator_reuse')
  const sourceEvaluator = readFileSync(resolve(root, 'src/ziwei/mingShenCleanRuleSeedPilot.js'), 'utf8')
  if (sourceEvaluator.includes('ziweiResolver')) errors.push('source_evaluator_imports_production')
  if (candidate.boundaries?.stableClaimCount !== 0 || candidate.boundaries?.readiness !== 'not_safe_to_start' || candidate.boundaries?.grounding !== 'blocked' || candidate.boundaries?.activation !== 'experimental' || candidate.boundaries?.engineModified !== false || candidate.boundaries?.pdfStoredInGit !== false) errors.push('promotion_or_pdf_git_inclusion')
  if (!same(candidate.transcription, expected.transcription) || !same(candidate.normalizedRule, expected.normalizedRule)) errors.push('source_rule_mutated')
  if (!same(candidate.comparison, expected.comparison)) errors.push('comparison_not_reproducible')
  const expectedHashes = expected.artifactHashes
  if (!same(candidate.artifactHashes, expectedHashes)) errors.push('field_hashes_missing_or_mutated')
  const artifactDir = resolve(root, `artifacts/${SCHEMA}`)
  const fileChecks = [
    ['transcription.json', { schemaVersion: `${SCHEMA}-transcription-v0`, ...candidate.transcription }, candidate.artifactHashes?.transcriptionSha256],
    ['normalized-rule.json', candidate.normalizedRule, candidate.artifactHashes?.normalizedRuleSha256],
    ['comparison.json', { schemaVersion: `${SCHEMA}-comparison-v0`, inputCount: candidate.comparison?.inputCount, expectedInputCount: candidate.comparison?.expectedInputCount, ordering: candidate.comparison?.ordering, rows: candidate.comparison?.rows, matchCount: candidate.comparison?.matchCount, mismatchCount: candidate.comparison?.mismatchCount, firstDivergence: candidate.comparison?.firstDivergence, mismatchDistribution: candidate.comparison?.mismatchDistribution }, candidate.artifactHashes?.comparisonSha256],
  ]
  for (const [name, value, expectedHash] of fileChecks) {
    try {
      const bytes = await readFile(resolve(artifactDir, name))
      if (sha256(bytes) !== expectedHash || !same(JSON.parse(bytes), value)) errors.push(`artifact_file:${name}`)
    } catch { errors.push(`artifact_file_missing:${name}`) }
  }
  try { if (sha256(await readFile(SOURCE_PDF)) !== SOURCE_PDF_SHA256) errors.push('actual_pdf_hash') } catch { errors.push('source_pdf_unavailable') }
  errors.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: `scripts/materialize-${SCHEMA}.mjs`, materializerVersion: MATERIALIZER_VERSION }))
  return [...new Set(errors)]
}

if (process.argv[1] === new URL(import.meta.url).pathname) { const path = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`); const bytes = await readFile(path); const artifact = JSON.parse(bytes); const failures = await checkPilotArtifact(artifact); console.log(JSON.stringify({ pass: failures.length === 0, verdict: artifact.verdictToken, matchCount: artifact.comparison?.matchCount, mismatchCount: artifact.comparison?.mismatchCount, artifactByteSha256: sha256(bytes), failures }, null, 2)); if (failures.length) process.exitCode = 1 }
