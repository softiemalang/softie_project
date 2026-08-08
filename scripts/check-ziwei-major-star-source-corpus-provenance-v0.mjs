import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildArtifact, canonicalJson, BASIS_HEAD, MATERIALIZER_VERSION, SCHEMA } from './materialize-ziwei-major-star-source-corpus-provenance-v0.mjs'
import { checkArtifactIdentity, matchesFileByteIdentity } from '../src/artifactIdentity.js'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
export async function checkArtifact(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const expected = await buildArtifact(); const errors = []
  if (candidate.schemaVersion !== SCHEMA || candidate.basisHead !== BASIS_HEAD || candidate.verdictToken !== 'complete_ziwei_major_star_source_corpus_219page_provenance_evidence_uncommitted') errors.push('identity_or_verdict')
  if (candidate.screening?.totalPages !== 219 || candidate.screening?.screenedPages !== 219) errors.push('page_coverage')
  if (candidate.source?.requestedCorpusPageCount !== 150 || candidate.source?.requestedScopeStatus !== 'mismatch_actual_source_has_219_pages; no pages silently omitted') errors.push('requested_scope_mismatch')
  if (candidate.screening?.coverageComplete !== true || candidate.screening?.coverageGapPages?.length !== 0) errors.push('coverage_gap_boundary')
  if (candidate.pageInventory?.length !== 219 || candidate.pageInventory?.some((page, index) => page.page !== index + 1 || page.screeningStatus !== 'screened' || page.directReview !== true || typeof page.relevanceClassification !== 'string' || typeof page.readingLevel !== 'string' || typeof page.relevance !== 'string' || typeof page.confidence !== 'string' || typeof page.exclusionReason !== 'string' && page.relevanceClassification === 'no_relevant_evidence')) errors.push('page_inventory_shape')
  if (candidate.pageInventory?.filter(page => page.relevanceClassification === 'candidate_direct_rule').map(page => page.page).join(',') !== '11,12,13') errors.push('direct_candidate_pages')
  if (candidate.pageInventory?.filter(page => page.relevanceClassification === 'candidate_coordinate_identity').map(page => page.page).join(',') !== '3,7,8,10') errors.push('coordinate_candidate_pages')
  if (candidate.pageInventory?.filter(page => page.relevanceClassification === 'context_only').map(page => page.page).join(',') !== '9,14,15,16,17') errors.push('context_pages')
  if (candidate.pageInventory?.filter(page => page.relevanceClassification === 'unreadable_or_uncertain').length !== 0) errors.push('uncertain_page_count')
  if (candidate.comparison?.rowDomain?.rowCount !== 150 || candidate.comparison.ziwei.exact !== '150/150' || candidate.comparison.tianfu.transformed !== '150/150' || candidate.comparison.tianfu.residual !== 0) errors.push('comparison_boundary')
  if (candidate.inventory?.length !== 14 || candidate.inventory.filter(x => x.sourceStatus === 'source_unresolved').length !== 12) errors.push('star_inventory')
  if (candidate.inventory?.find(x => x.starId === 'ziwei')?.sourcePages.join(',') !== '11,12' || candidate.inventory?.find(x => x.starId === 'tianfu')?.sourcePages.join(',') !== '13') errors.push('direct_source_links')
  if (candidate.decisionPacket?.sourceRuleDirectCount !== 2 || candidate.decisionPacket?.sourceUnresolvedCount !== 12) errors.push('decision_boundary')
  if (candidate.dependencyGraph?.conventionBlocker?.palaceIdentity !== 'unresolved') errors.push('semantic_promoted')
  for (const item of candidate.protectedBytes || []) {
    if (!matchesFileByteIdentity(root, item.path, item.gitHeadSha256, { generationBaseHead: candidate.artifactIdentity?.generation?.baseHead })) errors.push(`protected_bytes:${item.path}`)
  }
  const clean = value => { const clone = structuredClone(value); delete clone.observedHead; delete clone.artifactIdentity; return clone }
  if (canonicalJson(clean(candidate)) !== canonicalJson(clean(expected))) errors.push('materialized_content')
  errors.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: `scripts/materialize-${SCHEMA}.mjs`, materializerVersion: MATERIALIZER_VERSION, allowGenerationBaseInput: true }))
  return [...new Set(errors)]
}
if (process.argv[1] === new URL(import.meta.url).pathname) { const candidate = JSON.parse(readFileSync(resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`), 'utf8')); const failures = await checkArtifact(candidate); console.log(JSON.stringify({ pass: failures.length === 0, failures }, null, 2)); if (failures.length) process.exitCode = 1 }
