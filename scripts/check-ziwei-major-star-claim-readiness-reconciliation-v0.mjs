import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { buildArtifact, canonicalJson, BASIS_HEAD, MATERIALIZER_VERSION, SCHEMA } from './materialize-ziwei-major-star-claim-readiness-reconciliation-v0.mjs'
import { checkArtifactIdentity, matchesFileByteIdentity } from '../src/artifactIdentity.js'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
export async function checkArtifact(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const currentInputs = new Map((candidate.artifactIdentity?.inputs ?? []).map(item => [item.path, item.byteSha256]))
  const useHistoricalInputs = [...currentInputs].some(([path, expectedSha256]) => !matchesFileByteIdentity(root, path, expectedSha256))
  const expected = await buildArtifact({ inputSource: useHistoricalInputs ? 'generation_base' : 'current' }); const errors = []
  if (candidate.schemaVersion !== SCHEMA || candidate.basisHead !== BASIS_HEAD || candidate.verdictToken !== 'complete_ziwei_major_star_claim_readiness_reconciliation_evidence_uncommitted') errors.push('identity_or_verdict')
  if (candidate.claims?.length !== 14 || candidate.evidenceInventory?.length !== 9 || candidate.contextRegistry?.length !== 5) errors.push('inventory_shape')
  const statuses = candidate.claims?.map(x => x.evidenceStatus) ?? []
  if (statuses.filter(x => x === 'evidence_sufficient_within_scope').length !== 1 || statuses.filter(x => x === 'transform_verified_semantics_unresolved').length !== 1 || statuses.filter(x => x === 'source_scope_exhausted_unresolved').length !== 12) errors.push('status_distribution')
  if (!candidate.contextRegistry.some(x => x.key === 'integrated-baseline-v0' && x.count.match === 25 && x.count.mismatch === 125) || !candidate.contextRegistry.some(x => x.key === 'tianfu-neutral-raw-v0' && x.count.exact === 0) || !candidate.contextRegistry.some(x => x.key === 'tianfu-rotation-06-v0' && x.count.transformEquivalent === 150 && x.count.residual === 0) || !candidate.contextRegistry.some(x => x.key === 'source-corpus-direct-review-v0' && x.denominator === 219 && x.count.gap === 0)) errors.push('context_registry')
  const types = new Set(candidate.relationGraph?.relations?.map(x => x.type)); for (const type of ['supported_by','derived_from','exact_match','transform_equivalent','context_differs','blocked_by','unresolved_source']) if (!types.has(type)) errors.push('missing_relation:' + type)
  if (candidate.blockerRegistry?.length !== 2 || !candidate.blockerRegistry.some(x => x.id === 'blocker-direct-rule-absent') || !candidate.blockerRegistry.some(x => x.id === 'blocker-palace-semantic-identity')) errors.push('blocker_registry')
  if (candidate.layeredReadiness?.semantic !== 'blocked_semantic_identity_insufficient' || candidate.layeredReadiness?.grounding !== 'blocked' || candidate.layeredReadiness?.activation !== 'experimental' || candidate.layeredReadiness?.productionSelection !== 'not_performed') errors.push('readiness_boundary')
  if (candidate.claims.some(x => x.readinessImpact !== 'not_eligible_for_interpretation' || !x.artifactRefs.length || !x.calculationGitProvenance.length)) errors.push('claim_provenance_boundary')
  const sourceIds = new Set(candidate.sourceReferences?.map(x => x.id)); const evidenceIds = new Set(candidate.evidenceInventory?.map(x => x.id)); const claimIds = new Set(candidate.claims?.map(x => x.id)); const blockerIds = new Set(candidate.blockerRegistry?.map(x => x.id)); const contextIds = new Set(candidate.contextRegistry?.map(x => 'context-' + x.key)); const nodeIds = new Set(candidate.relationGraph?.nodeIds)
  if (candidate.claims.some(x => x.sourceRefs.some(id => !sourceIds.has(id)) || x.artifactRefs.some(id => !evidenceIds.has(id)) || x.blockers.some(id => !blockerIds.has(id)))) errors.push('orphan_claim_reference')
  if (candidate.evidenceInventory.some(x => !evidenceIds.has(x.id) || !x.artifactRef?.byteSha256)) errors.push('orphan_evidence_reference')
  if (candidate.relationGraph.relations.some(x => !nodeIds.has(x.from) || !nodeIds.has(x.to) || !['supported_by','derived_from','exact_match','transform_equivalent','context_differs','blocked_by','unresolved_source'].includes(x.type))) errors.push('invalid_relation_dependency')
  if (candidate.evidenceSufficiencyReview.some(x => !claimIds.has(x.claimId)) || candidate.blockerRegistry.some(x => x.affectedClaims.some(id => !claimIds.has(id)))) errors.push('invalid_claim_dependency')
  for (const item of candidate.protectedInputs ?? []) {
    if (!matchesFileByteIdentity(root, item.path, item.byteSha256, { generationBaseHead: candidate.artifactIdentity?.generation?.baseHead })) errors.push('protected_hash:' + item.path)
  }
  const comparable = x => { const y = structuredClone(x); delete y.observedHead; delete y.artifactIdentity; if (y.gitProvenance) delete y.gitProvenance.observedHead; return y }
  if (canonicalJson(comparable(candidate)) !== canonicalJson(comparable(expected))) errors.push('materialized_content')
  errors.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: 'scripts/materialize-' + SCHEMA + '.mjs', materializerVersion: MATERIALIZER_VERSION, allowGenerationBaseInput: true }))
  return [...new Set(errors)]
}
if (process.argv[1] === new URL(import.meta.url).pathname) { const path = resolve(process.argv[2] || 'artifacts/' + SCHEMA + '/complete.json'); const candidate = JSON.parse(await readFile(path, 'utf8')); const failures = await checkArtifact(candidate); console.log(JSON.stringify({ pass: failures.length === 0, failures }, null, 2)); if (failures.length) process.exitCode = 1 }
