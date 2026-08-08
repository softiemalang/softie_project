import { createHash } from 'node:crypto'
import { readFile, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { buildAcceptanceArtifact, canonicalJson, BASIS_HEAD, MATERIALIZER_VERSION, PILOT_HASHES, SCHEMA, SOURCE_PDF_ACCESS, SOURCE_PDF_SHA256 } from './materialize-ziwei-five-element-bureau-clean-rule-seed-acceptance-v0.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const same = (a, b) => canonicalJson(a) === canonicalJson(b)
export async function checkAcceptanceArtifact(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const { artifact: expected, files } = await buildAcceptanceArtifact(); const errors = []
  if (candidate.schemaVersion !== SCHEMA || candidate.basisHead !== BASIS_HEAD) errors.push('schema_or_basis_head')
  if (candidate.source?.pdfSha256 !== SOURCE_PDF_SHA256 || candidate.source?.pdfPageCount !== 219 || candidate.source?.encrypted !== false) errors.push('pdf_hash_page_encryption')
  if (!same(candidate.source?.targetPages, expected.source.targetPages)) errors.push('page_identity_or_render_hash')
  if (candidate.reviewerB?.blindStatus !== 'source_first_reading_completed_but_full_blindness_unproven' || !candidate.reviewerB?.blindnessLimit) errors.push('source_first_impersonation')
  if (candidate.reviewerB?.ocrPolicy?.canonical !== false || candidate.reviewerB?.ocrPolicy?.used !== false) errors.push('ocr_canonical_promotion')
  if (candidate.reviewerB?.modernCommentaryIngested !== false || candidate.reviewerB?.renderGitInclusion !== 'forbidden' || candidate.source?.gitInclusion !== 'forbidden') errors.push('commentary_or_render_git_inclusion')
  if (!candidate.reviewerB?.pages?.every(page => Array.isArray(page.uncertainty) && Array.isArray(page.table?.uncertainGlyphs))) errors.push('uncertain_glyph_auto_finalization')
  if (candidate.reviewerB?.pages?.some(page => !page.table?.direction || (page.pdfPage === 10 && (!page.table.columnHeaders?.length || !page.table.rowHeaders?.length)))) errors.push('table_direction_hidden')
  if (candidate.reviewerB?.pages?.find(page => page.pdfPage === 10)?.table?.direction !== expected.reviewerB.pages.find(page => page.pdfPage === 10).table.direction) errors.push('table_direction_hidden')
  const classes = new Set(['exact','glyph equivalent','layout only','uncertain rule-neutral','rule-semantic discrepancy','source damage'])
  if (!Array.isArray(candidate.discrepancies?.items) || candidate.discrepancies.items.some(item => !classes.has(item.classification) || !item.page || !item.locator || item.a === undefined || item.b === undefined || !item.impact)) errors.push('discrepancy_fields_or_classification')
  if (candidate.acceptance?.semanticDiscrepancy !== false || candidate.discrepancies?.items?.some(item => item.classification === 'rule-semantic discrepancy')) errors.push('semantic_discrepancy_collapsed')
  if (!same(candidate.acceptance?.sourceTrace, expected.acceptance.sourceTrace)) errors.push('normalized_rule_trace')
  if (candidate.acceptance?.boundaries?.stableClaimCount !== 0 || candidate.acceptance?.boundaries?.readiness !== 'not_safe_to_start' || candidate.acceptance?.boundaries?.grounding !== 'blocked' || candidate.acceptance?.boundaries?.activation !== 'experimental' || candidate.acceptance?.boundaries?.pilotOverwritten !== false || candidate.acceptance?.boundaries?.productionEngineModified !== false) errors.push('promotion_or_overwrite')
  const rows = candidate.comparison?.rows
  if (!Array.isArray(rows) || rows.length !== 1440 || candidate.comparison.inputCount !== 1440 || candidate.comparison.expectedInputCount !== 1440) errors.push('not_exhaustive_1440')
  else { const ids = new Set(rows.map(row => row.rowId)); if (ids.size !== 1440 || rows.some((row, i) => i && row.orderingKey <= rows[i - 1].orderingKey)) errors.push('nondeterministic_id_or_order'); if (candidate.comparison.matchCount !== rows.filter(row => row.match).length || candidate.comparison.mismatchCount !== rows.filter(row => !row.match).length || !same(candidate.comparison.firstDivergence, rows.find(row => !row.match) || null)) errors.push('mismatch_hidden_or_forced'); if (Object.values(candidate.comparison.distribution || {}).reduce((a, b) => a + b, 0) !== 1440) errors.push('distribution') }
  if (candidate.comparison?.matchCount !== 1440 || candidate.comparison?.mismatchCount !== 0 || candidate.comparison?.firstDivergence !== null) errors.push('comparison_not_1440_1440')
  if (!same(candidate.acceptance?.pilotImmutability?.expectedHashes, PILOT_HASHES) || !same(candidate.acceptance?.pilotImmutability?.actualHashes, PILOT_HASHES) || candidate.acceptance?.pilotImmutability?.unchanged !== true) errors.push('pilot_hash_immutability')
  for (const [key, value] of Object.entries(files)) { const name = key === 'reviewerB' ? 'reviewer-b' : key; try { const bytes = readFileSync(resolve(root, `artifacts/${SCHEMA}/${name}.json`)); if (sha256(bytes) !== candidate.artifactHashes?.[`${key}Sha256`] || !same(JSON.parse(bytes), value)) errors.push(`artifact_file:${name}`) } catch { errors.push(`artifact_file_missing:${name}`) } }
  try { if (sha256(readFileSync(SOURCE_PDF_ACCESS)) !== SOURCE_PDF_SHA256) errors.push('actual_pdf_hash') } catch { errors.push('source_pdf_unavailable') }
  const sourceEvaluator = readFileSync(resolve(root, 'src/ziwei/fiveElementBureauCleanRuleSeedPilot.js'), 'utf8'); if (sourceEvaluator.includes('ziweiResolver') || sourceEvaluator.includes('fiveElementResolver')) errors.push('source_evaluator_reuse')
  if (candidate.independence?.sourceEvaluatorImportsProduction !== false || candidate.independence?.sourceEvaluatorCopiesProductionTable !== false) errors.push('production_evaluator_reuse')
  if (candidate.materializer !== `scripts/materialize-${SCHEMA}.mjs` || candidate.checker !== `scripts/check-${SCHEMA}.mjs`) errors.push('materializer_checker_identity')
  errors.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: `scripts/materialize-${SCHEMA}.mjs`, materializerVersion: MATERIALIZER_VERSION, allowGenerationBaseInput: true }))
  if (!same(candidate.reviewerB, expected.reviewerB) || !same(candidate.discrepancies, expected.discrepancies) || !same(candidate.comparison, expected.comparison) || !same(candidate.acceptance, expected.acceptance)) errors.push('artifact_not_reproducible')
  return [...new Set(errors)]
}

if (process.argv[1] === new URL(import.meta.url).pathname) { const path = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`); const bytes = await (await import('node:fs/promises')).readFile(path); const candidate = JSON.parse(bytes); const failures = await checkAcceptanceArtifact(candidate); console.log(JSON.stringify({ pass: failures.length === 0, verdict: candidate.verdictToken, inputCount: candidate.comparison?.inputCount, matchCount: candidate.comparison?.matchCount, mismatchCount: candidate.comparison?.mismatchCount, artifactByteSha256: sha256(bytes), failures }, null, 2)); if (failures.length) process.exitCode = 1 }
