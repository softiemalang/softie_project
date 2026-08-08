import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { buildPilotArtifact, canonicalJson, BASIS_HEAD, MATERIALIZER_VERSION, SCHEMA, SOURCE_PDF_ACCESS, SOURCE_PDF_SHA256 } from './materialize-ziwei-tianfu-star-placement-clean-rule-seed-pilot-v0.mjs'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const same = (a, b) => canonicalJson(a) === canonicalJson(b)
export async function checkPilotArtifact(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const expected = await buildPilotArtifact(); const errors = []
  if (candidate.schemaVersion !== SCHEMA || candidate.basisHead !== BASIS_HEAD) errors.push('schema_or_basis_head')
  if (candidate.sourceWitness?.pdfSha256 !== SOURCE_PDF_SHA256 || candidate.sourceWitness?.pdfPageCount !== 219 || candidate.sourceWitness?.pdfEncrypted !== false || candidate.sourceWitness?.rulePageRange?.pdfPages?.join(',') !== '13' || candidate.sourceWitness?.rulePageRange?.printedPages?.[0] !== '三十四') errors.push('pdf_or_locator')
  if (candidate.transcription?.ocrStatus !== 'exploration_only_not_canonical' || candidate.transcription?.modernCommentaryIngested !== false || !candidate.transcription?.uncertainty?.length) errors.push('transcription_boundary')
  if (candidate.normalizedRule?.sourceTranscriptionId !== candidate.transcription?.transcriptionId || candidate.normalizedRule?.procedure?.direction !== 'source table row order only; no forward/reverse progression is asserted') errors.push('normalization_or_direction')
  const direct = candidate.comparison?.domains?.direct; const integrated = candidate.comparison?.domains?.integrated
  if (!direct || direct.inputCount !== 12 || direct.rows?.length !== 12 || direct.missingCount !== 0 || direct.duplicateRowIdCount !== 0) errors.push('direct_domain')
  if (!integrated || integrated.inputCount !== 150 || integrated.rows?.length !== 150 || integrated.missingCount !== 0 || integrated.duplicateRowIdCount !== 0) errors.push('integrated_domain')
  for (const domain of [direct, integrated]) { if (!domain) continue; const ids = domain.rows.map(row => row.rowId); if (new Set(ids).size !== domain.rows.length || domain.rows.some((row, i) => i && row.orderingKey <= domain.rows[i - 1].orderingKey)) errors.push('row_id_or_order'); if (domain.matchCount !== domain.rows.filter(row => row.match).length || domain.mismatchCount !== domain.rows.filter(row => !row.match).length || !same(domain.firstDivergence, domain.rows.find(row => !row.match) || null)) errors.push('mismatch_hidden_or_forced') }
  if (candidate.comparison?.matchCount !== integrated?.matchCount || candidate.comparison?.mismatchCount !== integrated?.mismatchCount || !same(candidate.comparison?.firstDivergence, integrated?.firstDivergence)) errors.push('summary_mismatch')
  if (candidate.independence?.sourceEvaluatorImportsProduction !== false || candidate.independence?.sourceEvaluatorCopiesProduction !== false || candidate.independence?.existingFixtureCalledBySourceEvaluator !== false) errors.push('independence_flags')
  const sourceModule = readFileSync(resolve(root, 'src/ziwei/tianfuStarPlacementCleanRuleSeedPilot.js'), 'utf8'); if (/starResolver|resolve14MajorStars|fixture|artifacts\//.test(sourceModule)) errors.push('source_evaluator_reuse')
  if (candidate.boundaries?.stableClaimCount !== 0 || candidate.boundaries?.readiness !== 'not_safe_to_start' || candidate.boundaries?.grounding !== 'blocked' || candidate.boundaries?.activation !== 'experimental' || candidate.boundaries?.engineModified !== false || candidate.boundaries?.ruleContractModified !== false || candidate.boundaries?.pdfStoredInGit !== false || candidate.boundaries?.otherStarsIncluded !== false) errors.push('promotion_or_scope')
  if (!same(candidate.transcription, expected.transcription) || !same(candidate.normalizedRule, expected.normalizedRule) || !same(candidate.comparison, expected.comparison)) errors.push('materialized_content')
  for (const [name, value, expectedHash] of [['transcription.json', candidate.transcription, candidate.artifactHashes?.transcriptionSha256], ['normalized-rule.json', candidate.normalizedRule, candidate.artifactHashes?.normalizedRuleSha256], ['comparison.json', candidate.comparison, candidate.artifactHashes?.comparisonSha256]]) { try { const bytes = readFileSync(resolve(root, `artifacts/${SCHEMA}/${name}`)); if (sha256(bytes) !== expectedHash || !same(JSON.parse(bytes), value)) errors.push(`artifact_file:${name}`) } catch { errors.push(`artifact_file:${name}`) } }
  for (const item of candidate.immutableExistingBytes ?? []) { try { if (sha256(readFileSync(resolve(root, item.path))) !== item.sha256) errors.push(`immutable_existing:${item.path}`) } catch { errors.push(`immutable_missing:${item.path}`) } }
  try { if (sha256(await readFile(SOURCE_PDF_ACCESS)) !== SOURCE_PDF_SHA256) errors.push('actual_pdf_hash') } catch { errors.push('source_pdf_unavailable') }
  errors.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: `scripts/materialize-${SCHEMA}.mjs`, materializerVersion: MATERIALIZER_VERSION }))
  return [...new Set(errors)]
}
if (process.argv[1] === new URL(import.meta.url).pathname) { const path = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`); const bytes = await readFile(path); const artifact = JSON.parse(bytes); const failures = await checkPilotArtifact(artifact); console.log(JSON.stringify({ pass: failures.length === 0, verdict: artifact.verdictToken, directCount: artifact.comparison?.domains?.direct?.inputCount, integratedCount: artifact.comparison?.domains?.integrated?.inputCount, matchCount: artifact.comparison?.matchCount, mismatchCount: artifact.comparison?.mismatchCount, artifactByteSha256: sha256(bytes), failures }, null, 2)); if (failures.length) process.exitCode = 1 }
