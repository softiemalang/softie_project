import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { BRANCHES, SOURCE_RULE_SCHEMA, STEMS } from '../src/ziwei/fiveElementBureauCleanRuleSeedPilot.js'
import { buildPilotArtifact, canonicalJson, BASIS_HEAD, MATERIALIZER_VERSION, SCHEMA, SOURCE_PDF, SOURCE_PDF_SHA256 } from './materialize-ziwei-five-element-bureau-clean-rule-seed-pilot-v0.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const same = (a, b) => canonicalJson(a) === canonicalJson(b)
export async function checkPilotArtifact(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const expected = await buildPilotArtifact(); const errors = []
  if (candidate.schemaVersion !== SCHEMA || candidate.basisHead !== BASIS_HEAD) errors.push('schema_or_basis_head')
  if (candidate.sourceWitness?.witnessVerdict !== 'source_witness_admissible_with_limits' || candidate.sourceWitness?.pdfSha256 !== SOURCE_PDF_SHA256 || candidate.sourceWitness?.pdfPageCount !== 219 || candidate.sourceWitness?.pdfEncrypted !== false) errors.push('pdf_hash_page_source_ref')
  if (!same(candidate.sourceWitness?.selectedRulePages, [9, 10]) || !same(candidate.sourceWitness?.auxiliaryPages, [11, 12])) errors.push('source_range')
  if (candidate.transcription?.ocrStatus !== 'exploration_only_not_canonical' || candidate.transcription?.reviewerStatus !== 'single_human_review_complete_second_review_pending' || candidate.transcription?.modernCommentaryIngested !== false || !candidate.transcription?.uncertainty?.length) errors.push('ocr_uncertainty_or_commentary')
  if (candidate.normalizedRule?.schemaVersion !== SOURCE_RULE_SCHEMA || candidate.normalizedRule?.sourceTranscriptionId !== candidate.transcription?.transcriptionId || candidate.normalizedRule?.normalizationBoundary?.includes('separate') !== true) errors.push('transcription_normalization_mixing')
  if (candidate.normalizedRule?.validDomain?.cardinality !== 1440 || candidate.normalizedRule?.steps?.length !== 5) errors.push('domain_or_steps')
  if (!same(candidate.normalizedRule?.inputs?.birthYearStem, STEMS) || !same(candidate.normalizedRule?.inputs?.hourBranch, BRANCHES)) errors.push('input_domain')
  const rows = candidate.comparison?.rows
  if (!Array.isArray(rows) || rows.length !== 1440 || candidate.comparison?.inputCount !== 1440 || candidate.comparison?.expectedInputCount !== 1440) errors.push('not_exhaustive_1440')
  else {
    const ids = new Set(rows.map(row => row.rowId)); const keys = rows.map(row => row.orderingKey); const expectedIds = new Set(expected.comparison.rows.map(row => row.rowId))
    if (ids.size !== 1440 || !same([...ids].sort(), [...expectedIds].sort()) || keys.some((key, i) => i && key <= keys[i - 1])) errors.push('duplicate_missing_or_order')
    if (rows.some(row => !row.intermediate?.mingGongBranch || !row.intermediate?.ganzhi || !row.sourceDerived?.enum || !row.productionEngine || typeof row.match !== 'boolean')) errors.push('intermediate_or_output_fields')
    if (candidate.comparison.matchCount !== rows.filter(row => row.match).length || candidate.comparison.mismatchCount !== rows.filter(row => !row.match).length || !same(candidate.comparison.firstDivergence, rows.find(row => !row.match) || null)) errors.push('mismatch_hidden_or_first_divergence')
    if (Object.values(candidate.comparison.distribution || {}).reduce((a, b) => a + b, 0) !== 1440) errors.push('distribution')
  }
  const evaluator = readFileSync(resolve(root, 'src/ziwei/fiveElementBureauCleanRuleSeedPilot.js'), 'utf8')
  if (evaluator.includes('fiveElementResolver') || evaluator.includes('ziweiResolver')) errors.push('production_evaluator_reuse')
  if (candidate.independence?.sourceEvaluatorImportsProductionEngine !== false || candidate.independence?.sourceEvaluatorCopiesProductionTable !== false) errors.push('production_evaluator_reuse')
  if (!same(candidate.normalizedRule?.explicitMappings, expected.normalizedRule.explicitMappings)) errors.push('bureau_mapping_mutation')
  if (candidate.boundaries?.stableClaimCount !== 0 || candidate.boundaries?.readiness !== 'not_safe_to_start' || candidate.boundaries?.grounding !== 'blocked' || candidate.boundaries?.activation !== 'experimental' || candidate.boundaries?.engineModified !== false || candidate.boundaries?.ruleContractModified !== false || candidate.boundaries?.existingMingShenArtifactModified !== false || candidate.boundaries?.pdfStoredInGit !== false) errors.push('promotion_or_existing_artifact_change')
  if (!same(candidate.transcription, expected.transcription) || !same(candidate.normalizedRule, expected.normalizedRule) || !same(candidate.comparison, expected.comparison) || !same(candidate.artifactHashes, expected.artifactHashes)) errors.push('artifact_not_reproducible')
  for (const [name, value, expectedHash] of [['transcription.json', candidate.transcription, candidate.artifactHashes?.transcriptionSha256], ['normalized-rule.json', candidate.normalizedRule, candidate.artifactHashes?.normalizedRuleSha256], ['comparison.json', candidate.comparison, candidate.artifactHashes?.comparisonSha256]]) { try { const bytes = await readFile(resolve(root, `artifacts/${SCHEMA}/${name}`)); if (sha256(bytes) !== expectedHash || !same(JSON.parse(bytes), value)) errors.push(`artifact_file:${name}`) } catch { errors.push(`artifact_file_missing:${name}`) } }
  try { if (sha256(await readFile(SOURCE_PDF)) !== SOURCE_PDF_SHA256) errors.push('actual_pdf_hash') } catch { errors.push('source_pdf_unavailable') }
  errors.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: `scripts/materialize-${SCHEMA}.mjs`, materializerVersion: MATERIALIZER_VERSION }))
  return [...new Set(errors)]
}
if (process.argv[1] === new URL(import.meta.url).pathname) { const path = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`); const bytes = await readFile(path); const artifact = JSON.parse(bytes); const failures = await checkPilotArtifact(artifact); console.log(JSON.stringify({ pass: failures.length === 0, verdict: artifact.verdictToken, inputCount: artifact.comparison?.inputCount, matchCount: artifact.comparison?.matchCount, mismatchCount: artifact.comparison?.mismatchCount, artifactByteSha256: sha256(bytes), failures }, null, 2)); if (failures.length) process.exitCode = 1 }
