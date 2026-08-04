import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildAcceptanceArtifact, canonicalJson, BASIS_HEAD, MATERIALIZER_VERSION, SCHEMA, SOURCE_PDF, SOURCE_PDF_SHA256, PILOT } from './materialize-ziwei-ming-shen-seed-acceptance-v0.mjs'
import { TRADITIONAL_BRANCH_ORDER } from '../src/ziwei/mingShenCleanRuleSeedPilot.js'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const same = (a, b) => canonicalJson(a) === canonicalJson(b)
export async function checkAcceptanceArtifact(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const { artifact: expected, files } = await buildAcceptanceArtifact(); const errors = []
  if (candidate.schemaVersion !== SCHEMA) errors.push('schema')
  if (candidate.basisHead !== BASIS_HEAD) errors.push('basis_head')
  if (candidate.source?.pdfSha256 !== SOURCE_PDF_SHA256 || candidate.source?.pdfPageCount !== 219 || candidate.source?.encrypted !== false) errors.push('pdf_hash_page_encryption')
  if (!same(candidate.source?.targetPages, [{ pdfPage: 8, printedPage: '二十五' }, { pdfPage: 10, printedPage: '二十九' }])) errors.push('page_identity')
  if (candidate.reviewerB?.blindStatus !== 'source_first_before_existing_artifact_read') errors.push('source_first_impersonation')
  if (candidate.reviewerB?.ocrPolicy?.canonical !== false || candidate.reviewerB?.ocrPolicy?.used !== false) errors.push('ocr_canonical_promotion')
  if (!candidate.reviewerB?.pages?.every(page => Array.isArray(page.uncertainty) && page.uncertainty.length)) errors.push('uncertain_glyph_auto_finalization')
  if (candidate.reviewerB?.pages?.some(page => !page.glyphs?.table?.layout || !page.glyphs?.table?.direction)) errors.push('table_layout_direction_hidden')
  const classes = new Set(['exact match', 'glyph variant/equivalent', 'punctuation·spacing·layout only', 'uncertain but rule-neutral', 'rule-semantic discrepancy', 'unresolved source damage'])
  if (!Array.isArray(candidate.discrepancies) || candidate.discrepancies.some(item => !classes.has(item.classification) || !item.page || !item.locator || item.a === undefined || item.b === undefined || !item.impact)) errors.push('discrepancy_fields_or_classification')
  if (candidate.acceptance?.semanticDiscrepancy !== false || candidate.discrepancies?.some(item => item.classification === 'rule-semantic discrepancy') || candidate.acceptance?.semanticDiscrepancyIds?.length) errors.push('semantic_discrepancy_collapsed')
  if (!same(candidate.acceptance?.sourceTrace, expected.acceptance.sourceTrace)) errors.push('normalized_rule_trace')
  if (candidate.acceptance?.boundaries?.stableClaimCount !== 0 || candidate.acceptance?.boundaries?.readiness !== 'not_safe_to_start' || candidate.acceptance?.boundaries?.grounding !== 'blocked' || candidate.acceptance?.boundaries?.activation !== 'experimental' || candidate.acceptance?.boundaries?.pilotOverwritten !== false || candidate.acceptance?.boundaries?.engineModified !== false) errors.push('promotion_or_overwrite')
  if (candidate.comparison?.inputCount !== 144 || candidate.comparison?.expectedInputCount !== 144 || candidate.comparison?.rows?.length !== 144) errors.push('not_exhaustive_144')
  else { const rows = candidate.comparison.rows; if (new Set(rows.map(row => row.rowId)).size !== 144 || rows.some((row, i) => i && row.orderingKey <= rows[i - 1].orderingKey)) errors.push('nondeterministic_id_or_order'); if (candidate.comparison.matchCount !== rows.filter(row => row.match).length || candidate.comparison.mismatchCount !== rows.filter(row => !row.match).length || !same(candidate.comparison.firstDivergence, rows.find(row => !row.match) || null)) errors.push('mismatch_hidden') }
  if (candidate.comparison?.matchCount !== 144 || candidate.comparison?.mismatchCount !== 0 || candidate.comparison?.firstDivergence !== null) errors.push('comparison_not_144_144')
  if (!same(candidate.acceptance?.pilotImmutability?.expectedHashes, PILOT) || !same(candidate.acceptance?.pilotImmutability?.actualHashes, PILOT) || candidate.acceptance?.pilotImmutability?.unchanged !== true) errors.push('pilot_hash_immutability')
  for (const [key, value] of Object.entries(files)) { const name = key === 'reviewerB' ? 'reviewer-b' : key; try { const bytes = await readFile(resolve(root, `artifacts/${SCHEMA}/${name}.json`)); if (sha256(bytes) !== candidate.artifactHashes?.[`${key}Sha256`] || !same(JSON.parse(bytes), value)) errors.push(`artifact_file:${name}`) } catch { errors.push(`artifact_file_missing:${name}`) } }
  if (sha256(await readFile(SOURCE_PDF)) !== SOURCE_PDF_SHA256) errors.push('actual_pdf_hash')
  const sourceEvaluator = readFileSync(resolve(root, 'src/ziwei/mingShenCleanRuleSeedPilot.js'), 'utf8'); if (sourceEvaluator.includes('ziweiResolver')) errors.push('source_evaluator_imports_production')
  if (candidate.independence?.sourceEvaluatorImportsProduction !== false) errors.push('source_evaluator_reuse')
  if (candidate.materializer !== `scripts/materialize-${SCHEMA}.mjs` || candidate.checker !== `scripts/check-${SCHEMA}.mjs`) errors.push('materializer_checker_identity')
  errors.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: `scripts/materialize-${SCHEMA}.mjs`, materializerVersion: MATERIALIZER_VERSION }))
  if (!same(candidate.reviewerB, expected.reviewerB) || !same(candidate.discrepancies, expected.discrepancies) || !same(candidate.comparison, expected.comparison) || !same(candidate.acceptance, expected.acceptance)) errors.push('artifact_not_reproducible')
  return [...new Set(errors)]
}
if (process.argv[1] === new URL(import.meta.url).pathname) { const path = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`); const bytes = await readFile(path); const candidate = JSON.parse(bytes); const failures = await checkAcceptanceArtifact(candidate); console.log(JSON.stringify({ pass: failures.length === 0, verdict: candidate.verdictToken, matchCount: candidate.comparison?.matchCount, mismatchCount: candidate.comparison?.mismatchCount, artifactByteSha256: sha256(bytes), failures }, null, 2)); if (failures.length) process.exitCode = 1 }
