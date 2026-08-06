import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { BASIS_HEAD, buildArtifact, canonicalJson, MATERIALIZER_VERSION, MING_PDF, MING_PDF_SHA256, NANBEI_PDF, NANBEI_PDF_SHA256, SCHEMA, VERDICT } from './materialize-ziwei-life-body-palace-ruler-source-evidence-v0.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const same = (a, b) => canonicalJson(a) === canonicalJson(b)

export async function checkArtifact(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const expected = await buildArtifact()
  const errors = []
  if (candidate.schemaVersion !== SCHEMA) errors.push('schema')
  if (candidate.verdictToken !== VERDICT) errors.push('verdict')
  if (candidate.boundaries?.stableClaimCount !== 0 || candidate.boundaries?.readiness !== 'not_safe_to_start' || candidate.boundaries?.grounding !== 'blocked' || candidate.boundaries?.activation !== 'experimental') errors.push('promotion_boundary')
  if (candidate.boundaries?.productionRuleModified !== false || candidate.boundaries?.publicContractModified !== false || candidate.boundaries?.pdfStoredInGit !== false || candidate.boundaries?.renderStoredInGit !== false) errors.push('scope_boundary')
  if (candidate.verdicts?.sourceEditionMingZhu !== 'exact_match' || candidate.verdicts?.sourceEditionShenZhu !== 'blocked_source_legibility' || candidate.verdicts?.productionRulers !== 'implementation_only') errors.push('rule_verdict_boundary')
  const editions = candidate.sourceWitnesses || []
  if (editions.length !== 2 || editions.some(edition => ![528, 219].includes(edition.pdf?.pageCount) || edition.pdf?.encrypted !== 'no')) errors.push('pdf_identity_metadata')
  if (editions.some(edition => edition.pdf?.fullPageScreening?.renderedPageCount !== edition.pdf?.pageCount || edition.pdf?.fullPageScreening?.dpi !== 32 || edition.pdf?.fullPageScreening?.outputPolicy !== 'external_temp_only; render bytes not stored in Git')) errors.push('full_page_screening_coverage')
  if (candidate.sourceWitnesses?.find(edition => edition.editionId === 'nanyangtang')?.pdf?.sha256 !== MING_PDF_SHA256 || candidate.sourceWitnesses?.find(edition => edition.editionId === 'nanbei')?.pdf?.sha256 !== NANBEI_PDF_SHA256) errors.push('pdf_hash_or_source_ref')
  const life = candidate.comparison?.lifeBody
  if (life?.inputCount !== 144 || life?.expectedInputCount !== 144 || life?.rows?.length !== 144 || life?.matchCount !== 144 || life?.mismatchCount !== 0 || life?.firstDivergence !== null) errors.push('life_body_exhaustive_reconciliation')
  if (new Set((life?.rows || []).map(row => row.rowId)).size !== 144 || (life?.rows || []).some((row, index) => index && row.orderingKey <= life.rows[index - 1].orderingKey)) errors.push('life_body_ordering_or_ids')
  const rulers = candidate.comparison?.rulers
  if (rulers?.expectedInputCountPerEdition !== 144 || rulers?.editions?.nanyangtang?.inputCount !== 144 || rulers?.editions?.nanyangtang?.rows?.length !== 144 || rulers?.editions?.nanbei?.inputCount !== 144 || rulers?.editions?.nanbei?.rows?.length !== 144) errors.push('ruler_source_domains_not_exhaustive')
  if (rulers?.sourceEditionComparison?.inputCount !== 144 || rulers?.sourceEditionComparison?.rows?.length !== 144 || rulers?.sourceEditionComparison?.summary?.mingZhuCanonicalMatches !== 144) errors.push('ruler_source_edition_comparison')
  const productionRulers = rulers?.production
  if (productionRulers?.inputCount !== 288 || productionRulers?.expectedInputCount !== 288 || productionRulers?.rows?.length !== 288 || productionRulers?.comparableCount !== 0 || productionRulers?.matchCount !== 0 || productionRulers?.mismatchCount !== 0) errors.push('ruler_production_domain_or_comparison_boundary')
  if ((productionRulers?.rows || []).some(row => row.match !== null || row.productionStatus !== 'not_comparable' || row.divergence?.reason !== 'production_fields_absent')) errors.push('ruler_invention_or_mismatch_concealment')
  if (candidate.productionTrace?.absentOutputs?.includes('chart.mingZhu') !== true || candidate.productionTrace?.absentOutputs?.includes('chart.shenZhu') !== true) errors.push('production_absent_fields_not_preserved')
  const nanyang = candidate.locatorInventory?.editions?.find(edition => edition.editionId === 'nanyangtang')
  if (nanyang?.rulerStatus !== 'direct_tables_located' || !nanyang?.locators?.some(locator => locator.pdfPage === 159 && locator.status === 'direct_table') || !nanyang?.locators?.some(locator => locator.pdfPage === 160 && locator.status === 'direct_table')) errors.push('nanyang_ruler_locator_missing_or_weakened')
  if (candidate.normalizedRules?.nanyangRulers?.status !== 'direct_visible_tables_with_surface_alias_boundaries' || candidate.normalizedRules?.nanyangRulers?.shenZhu?.aliasPolicy?.['火鈴星']?.canonicalStarId !== null) errors.push('nanyang_surface_alias_promotion')
  if (candidate.transcription?.ocrStatus !== 'exploration_only_not_canonical') errors.push('ocr_promotion')
  if (candidate.comparison?.transformationSearch?.candidateCount !== 576 || !candidate.comparison.transformationSearch.exactFitParameterSets?.length || !candidate.comparison.transformationSearch.nearestNonExact?.firstDivergence) errors.push('finite_transform_search_or_counterexample')
  if (candidate.deterministicContract?.generatedAt !== 'forbidden' || candidate.deterministicContract?.includedCommit !== null || candidate.deterministicContract?.sourceEvaluatorImportsProduction !== false || candidate.basisHead !== BASIS_HEAD || candidate.deterministicContract?.basisHead !== BASIS_HEAD || candidate.artifactIdentity?.generation?.baseHead !== BASIS_HEAD) errors.push('determinism_or_basis_contract')
  if (!same(candidate.locatorInventory, expected.locatorInventory) || !same(candidate.transcription, expected.transcription) || !same(candidate.normalizedRules, expected.normalizedRules) || !same(candidate.productionTrace, expected.productionTrace) || !same(candidate.comparison, expected.comparison) || !same(candidate.dependencyGraph, expected.dependencyGraph)) errors.push('reproducibility')
  for (const [key, value] of Object.entries({ locatorInventory: candidate.locatorInventory, transcription: candidate.transcription, normalizedRules: candidate.normalizedRules, productionTrace: candidate.productionTrace, comparison: candidate.comparison, dependencyGraph: candidate.dependencyGraph })) {
    if (candidate.artifactHashes?.[`${key}Sha256`] !== sha256(Buffer.from(canonicalJson(value)))) errors.push(`field_hash:${key}`)
  }
  try { if (sha256(readFileSync(MING_PDF)) !== MING_PDF_SHA256) errors.push('actual_ming_pdf_hash') } catch { errors.push('actual_ming_pdf_unavailable') }
  try { if (sha256(readFileSync(NANBEI_PDF)) !== NANBEI_PDF_SHA256) errors.push('actual_nanbei_pdf_hash') } catch { errors.push('actual_nanbei_pdf_unavailable') }
  const artifactDir = resolve(root, `artifacts/${SCHEMA}`)
  const files = [['locator-inventory.json', 'locatorInventory', candidate.locatorInventory], ['transcription.json', 'transcription', candidate.transcription], ['normalized-rules.json', 'normalizedRules', candidate.normalizedRules], ['production-trace.json', 'productionTrace', candidate.productionTrace], ['comparison.json', 'comparison', candidate.comparison], ['dependency-graph.json', 'dependencyGraph', candidate.dependencyGraph]]
  for (const [name, key, value] of files) {
    try {
      const bytes = await readFile(resolve(artifactDir, name))
      if (!same(JSON.parse(bytes), value) || sha256(bytes) !== candidate.artifactHashes?.[`${key}Sha256`]) errors.push(`artifact_file:${name}`)
    } catch { errors.push(`artifact_file_missing:${name}`) }
  }
  const sourceEvaluator = readFileSync(resolve(root, 'src/ziwei/lifeBodyPalaceRulerSourceEvidence.js'), 'utf8')
  if (sourceEvaluator.includes('ziweiResolver')) errors.push('source_evaluator_imports_production')
  errors.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: `scripts/materialize-${SCHEMA}.mjs`, materializerVersion: MATERIALIZER_VERSION }))
  return [...new Set(errors)]
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const path = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`)
  const bytes = await readFile(path)
  const artifact = JSON.parse(bytes)
  const failures = await checkArtifact(artifact)
  console.log(JSON.stringify({ pass: failures.length === 0, verdict: artifact.verdictToken, lifeBodyMatchCount: artifact.comparison?.lifeBody?.matchCount, rulerComparableCount: artifact.comparison?.rulers?.comparableCount, artifactByteSha256: sha256(bytes), failures }, null, 2))
  if (failures.length) process.exitCode = 1
}
