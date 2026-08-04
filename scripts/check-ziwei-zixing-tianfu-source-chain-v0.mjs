import { createHash } from 'node:crypto'
import { readFile, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { buildChainArtifact, canonicalJson, BASIS_HEAD, MATERIALIZER_VERSION, SCHEMA, SOURCE_PDF, SOURCE_PDF_SHA256 } from './materialize-ziwei-zixing-tianfu-source-chain-v0.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
export async function checkChainArtifact(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const expected = await buildChainArtifact(); const errors = []
  if (candidate.schemaVersion !== SCHEMA || candidate.basisHead !== BASIS_HEAD || candidate.verdictToken !== 'complete_ziwei_zixing_tianfu_source_chain_evidence_uncommitted') errors.push('identity_or_verdict')
  if (candidate.sourceWitness?.pdfSha256 !== SOURCE_PDF_SHA256 || candidate.sourceWitness?.pdfPageCount !== 219 || candidate.sourceWitness?.ocrStatus !== 'exploration_only_not_canonical') errors.push('source_pdf_boundary')
  if (candidate.sourceWitness?.locators?.length !== 2 || candidate.sourceWitness.locators.some(x => !/^(11|12)$/.test(String(x.pdfPage)) || !/^[0-9a-f]{64}$/.test(x.render?.sha256 ?? '') || !/^[0-9a-f]{64}$/.test(x.crop?.sha256 ?? ''))) errors.push('locator_render_crop_hash')
  if (candidate.reviewerA?.status !== 'independent_source_only_complete' || candidate.reviewerB?.status !== 'independent_source_only_complete' || candidate.reviewerA.rows?.length !== 150 || candidate.reviewerB.rows?.length !== 150) errors.push('reviewer_completeness')
  if (candidate.reconciliation?.rowCount !== 150 || candidate.reconciliation.reviewerAReviewerBExactRows !== 150 || candidate.reconciliation.disagreementCount !== 0 || candidate.reconciliation.unresolvedCoreRows.length !== 0) errors.push('reconciliation')
  if (candidate.chain?.rowCount !== 150 || candidate.chain.rows?.length !== 150 || candidate.chain.rows.some((x, i) => x.rowId !== expected.chain.rows[i].rowId || x.orderingKey !== expected.chain.rows[i].orderingKey)) errors.push('chain_order_or_count')
  if (JSON.stringify(candidate.chain?.bureauDistribution) !== JSON.stringify({2:30,3:30,4:30,5:30,6:30}) || Object.values(candidate.chain?.dayDistribution ?? {}).some(x => x !== 5)) errors.push('domain_distribution')
  if (candidate.chain?.firstDivergence?.stage !== 'tianfu' || candidate.chain?.firstDivergence?.rowId !== 'bureau-2-day-01') errors.push('first_divergence')
  if (candidate.chain?.stageCounts?.ziwei?.exactMatch !== 150 || candidate.chain.stageCounts.ziwei.semanticDiscrepancy !== 0 || candidate.chain.stageCounts.tianfu.exactMatch !== 0 || candidate.chain.stageCounts.tianfu.transformEquivalent !== 150 || candidate.chain.stageCounts.tianfu.semanticDiscrepancy !== 0) errors.push('stage_classification')
  for (const family of ['ziwei', 'tianfu']) for (const result of candidate.relations?.[family]?.candidates ?? []) if (result.testedRowCount !== 150 || result.expectedRowCount !== 150 || result.matchCount + result.mismatchCount !== 150) errors.push(`relation_coverage:${family}`)
  if (!candidate.relations.ziwei.exactFitIds.includes('identity') || !candidate.relations.tianfu.exactFitIds.includes('rotation-06') || candidate.relations.transformCoverage.rotation06.residualRows !== 0 || candidate.relations.transformCoverage.rotation06.matchedRows !== 150) errors.push('transform_coverage')
  if (candidate.preservedPriorTianfu?.integratedOriginalBaseline?.matchCount !== 25 || candidate.preservedPriorTianfu.integratedOriginalBaseline.mismatchCount !== 125) errors.push('prior_baseline_mutation')
  if (candidate.boundaries?.stableClaimCount !== 0 || candidate.boundaries.readiness !== 'not_safe_to_start' || candidate.boundaries.grounding !== 'blocked' || candidate.boundaries.activation !== 'experimental' || candidate.boundaries.productionModified !== false || candidate.boundaries.ruleContractModified !== false || candidate.boundaries.existingArtifactsModified !== false) errors.push('status_or_authority_promotion')
  for (const item of candidate.immutableExistingBytes ?? []) { try { if (sha256(readFileSync(resolve(root, item.path))) !== item.sha256) errors.push(`immutable_existing:${item.path}`) } catch { errors.push(`immutable_missing:${item.path}`) } }
  try { if (sha256(await (await import('node:fs/promises')).readFile(SOURCE_PDF)) !== SOURCE_PDF_SHA256) errors.push('actual_pdf_hash') } catch { errors.push('source_pdf_unavailable') }
  const comparable = value => { const copy = structuredClone(value); delete copy.observedHead; delete copy.artifactIdentity; return copy }
  if (canonicalJson(comparable(candidate)) !== canonicalJson(comparable(expected))) errors.push('materialized_content')
  errors.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: `scripts/materialize-${SCHEMA}.mjs`, materializerVersion: MATERIALIZER_VERSION }))
  return [...new Set(errors)]
}
if (process.argv[1] === new URL(import.meta.url).pathname) { const candidate = JSON.parse(await (await import('node:fs/promises')).readFile(resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`), 'utf8')); const errors = await checkChainArtifact(candidate); console.log(JSON.stringify({ pass: errors.length === 0, failures: errors }, null, 2)); if (errors.length) process.exitCode = 1 }
