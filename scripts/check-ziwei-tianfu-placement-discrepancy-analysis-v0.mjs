import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildDiscrepancyArtifact, canonicalJson, BASIS_HEAD, MATERIALIZER_VERSION, SCHEMA, SOURCE_PDF, SOURCE_PDF_SHA256 } from './materialize-ziwei-tianfu-placement-discrepancy-analysis-v0.mjs'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const same = (a, b) => canonicalJson(a) === canonicalJson(b)
export async function checkDiscrepancyArtifact(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const expected = await buildDiscrepancyArtifact(); const errors = []
  if (candidate.schemaVersion !== SCHEMA || candidate.basisHead !== BASIS_HEAD) errors.push('schema_or_basis_head')
  if (candidate.sourceWitness?.pdfSha256 !== SOURCE_PDF_SHA256 || candidate.sourceWitness?.pdfPageCount !== 219 || candidate.sourceWitness?.pdfEncrypted !== false || candidate.sourceWitness?.locator !== 'p13 / 三十四 / 甲六、安天府 / right scanned leaf') errors.push('pdf_page_encryption_or_locator')
  if (candidate.sourceWitness?.render?.tool !== 'pdftoppm' || candidate.sourceWitness?.render?.dpi !== 200 || candidate.sourceWitness?.render?.crop !== 'none' || !/^[0-9a-f]{64}$/.test(candidate.sourceWitness?.render?.sha256 ?? '')) errors.push('render_provenance')
  if (candidate.reviewerA?.transcription?.ocrStatus !== 'exploration_only_not_canonical' || candidate.reviewerA?.transcription?.sourceReview?.includes('not independent human review') !== true) errors.push('source_first_boundary')
  if (candidate.reviewerB?.status !== 'not_run' || candidate.reviewerB?.requiredForPromotion !== true) errors.push('reviewer_boundary')
  if (candidate.direct?.inputCount !== 12 || candidate.direct.rows?.length !== 12 || candidate.direct.relationResults?.some(x => x.testedRowCount !== 12 || x.expectedRowCount !== 12)) errors.push('direct_completeness')
  if (candidate.integrated?.inputCount !== 150 || candidate.integrated.rows?.length !== 150 || candidate.integrated.relationResults?.some(x => x.testedRowCount !== 150 || x.expectedRowCount !== 150)) errors.push('integrated_completeness')
  if (candidate.integrated?.originalBaseline?.matchCount !== 25 || candidate.integrated?.originalBaseline?.mismatchCount !== 125 || candidate.integrated?.originalBaseline?.firstMismatch !== 'integrated-bureau-2-day-01') errors.push('original_baseline_not_preserved')
  for (const result of [...candidate.direct?.relationResults ?? [], ...candidate.integrated?.relationResults ?? []]) if (result.testedRowCount !== result.expectedRowCount || result.matchCount + result.mismatchCount !== result.testedRowCount) errors.push('partial_relation_or_count_mismatch')
  if (!candidate.direct?.exactFitIds?.length || !candidate.integrated?.exactFitIds?.length || candidate.direct.exactFitIds.join('|') !== candidate.integrated.exactFitIds.join('|')) errors.push('exact_fit_set_not_parallel')
  if (candidate.integrated?.predictionDoesNotOverwriteOriginal !== true || candidate.integrated?.residualExceptionCount !== 0) errors.push('prediction_overwrite_or_forced_reconcile')
  if (candidate.boundaries?.stableClaimCount !== 0 || candidate.boundaries?.readiness !== 'not_safe_to_start' || candidate.boundaries?.grounding !== 'blocked' || candidate.boundaries?.activation !== 'experimental' || candidate.boundaries?.truthLineageDeclared !== false || candidate.boundaries?.productionModified !== false || candidate.boundaries?.ruleContractModified !== false || candidate.boundaries?.existingArtifactsModified !== false) errors.push('status_or_authority_promotion')
  if (!same(candidate.reviewerA, expected.reviewerA) || !same(candidate.reviewerB, expected.reviewerB) || !same(candidate.abComparison, expected.abComparison) || !same(candidate.direct, expected.direct) || !same(candidate.integrated, expected.integrated)) errors.push('materialized_content')
  for (const item of candidate.immutableExistingBytes ?? []) { try { if (sha256(readFileSync(resolve(root, item.path))) !== item.sha256) errors.push(`immutable_existing:${item.path}`) } catch { errors.push(`immutable_missing:${item.path}`) } }
  try { if (sha256(await readFile(SOURCE_PDF)) !== SOURCE_PDF_SHA256) errors.push('actual_pdf_hash') } catch { errors.push('source_pdf_unavailable') }
  errors.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: `scripts/materialize-${SCHEMA}.mjs`, materializerVersion: MATERIALIZER_VERSION }))
  return [...new Set(errors)]
}
if (process.argv[1] === new URL(import.meta.url).pathname) { const path = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`); const artifact = JSON.parse(await readFile(path, 'utf8')); const failures = await checkDiscrepancyArtifact(artifact); console.log(JSON.stringify({ pass: failures.length === 0, verdict: artifact.verdictToken, failures }, null, 2)); if (failures.length) process.exitCode = 1 }
