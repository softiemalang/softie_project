import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { buildArtifact, canonicalJson, EXPECTED_HEAD, SCHEMA, VERDICT, ARTIFACT_PATH, SOURCE_FIELD_KIT_PATH } from './materialize-tri-system-p0-acquisition-priority-and-dossier-v1.mjs'
import { checkHistoricalRepositoryBasis, stableArtifactContentEqual } from '../src/artifactIdentity.js'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const asArray = value => Array.isArray(value) ? value : []
const hasText = value => typeof value === 'string' && value.trim().length > 0
const allowedCandidateStatuses = new Set(['confirmed', 'strong_candidate', 'weak_candidate'])
const expectedSystems = { saju: 2, ziwei: 4, western: 2 }

export async function checkArtifact(candidate, { root = resolve(new URL('..', import.meta.url).pathname) } = {}) {
  const errors = []
  let expected
  try {
    expected = await buildArtifact({ root })
  } catch (error) {
    return [`build:${error.message}`]
  }
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return ['artifact_not_object']
  if (candidate.schemaVersion !== SCHEMA || candidate.verdictToken !== VERDICT) errors.push('identity_or_verdict')
  const basis = checkHistoricalRepositoryBasis(root, EXPECTED_HEAD)
  if (candidate.scope?.branch !== 'main' || candidate.scope?.expectedHead !== EXPECTED_HEAD || !/^[0-9a-f]{40}$/.test(candidate.scope?.currentHead || '') || !/^[0-9a-f]{40}$/.test(candidate.scope?.originMainHead || '') || basis.errors.length) errors.push('repository_basis')
  for (const field of ['productionActivation', 'readinessPromotion', 'claimPromotion', 'deploy', 'remoteDatabaseMutation', 'commit', 'push']) if (candidate.scope?.[field] !== false) errors.push(`mutation_or_promotion:${field}`)
  if (!asArray(candidate.scope?.unrelatedUntrackedPreserved).includes('-.jpg')) errors.push('untracked_jpg_not_preserved')

  const sourceTargets = expected.sourceOfTruth.predecessorFieldKit.p0ReconstructedIds
  const ranked = asArray(candidate.rankedP0Targets)
  const rankedIds = ranked.map(target => target.id)
  if (ranked.length !== 8 || new Set(rankedIds).size !== 8) errors.push('p0_count_or_unique_ids')
  if (JSON.stringify([...new Set(rankedIds)].sort()) !== JSON.stringify([...new Set(sourceTargets)].sort())) errors.push('p0_reconstruction_mismatch')
  const systemCounts = ranked.reduce((counts, target) => ({ ...counts, [target.system]: (counts[target.system] || 0) + 1 }), {})
  for (const [system, count] of Object.entries(expectedSystems)) if (systemCounts[system] !== count) errors.push(`p0_system_count:${system}`)
  if (ranked.some(target => target.priority !== 'P0')) errors.push('non_p0_in_ranked_p0')
  if (ranked.some(target => !Array.isArray(target.blockerIds) || target.blockerIds.length === 0)) errors.push('missing_blocker_mapping')
  const requiredAuditFields = ['notes', 'selectionReason', 'heldOverlap', 'authorityPotential', 'acquisitionFeasibility', 'freeAccessAssessment', 'scanCertaintyAssessment', 'licenseReuseAssessment', 'deterministicLinkageAssessment', 'wrongMaterialRiskAssessment', 'nextFrontier']
  if (ranked.some(target => !target.priorityAudit || requiredAuditFields.some(field => !hasText(target.priorityAudit[field])))) errors.push('missing_priority_audit')
  for (const target of ranked) {
    const metrics = target.priorityAudit
    for (const key of Object.keys(expected.comparisonContract.weights)) {
      if (!Number.isInteger(metrics[key]) || metrics[key] < 1 || metrics[key] > 5) errors.push(`score_range:${target.id}:${key}`)
    }
    const recalculated = Object.entries(expected.comparisonContract.weights).reduce((sum, [key, weight]) => sum + (metrics[key] / 5) * weight, 0)
    if (Number(metrics.weightedScore) !== Number(recalculated.toFixed(1))) errors.push(`score_math:${target.id}`)
  }
  if (ranked.some((target, index) => index > 0 && ranked[index - 1].priorityAudit.weightedScore < target.priorityAudit.weightedScore)) errors.push('ranking_not_descending')
  if (candidate.priorityDecision?.rank1 !== rankedIds[0] || candidate.priorityDecision?.rank2 !== rankedIds[1] || candidate.priorityDecision?.rank3 !== rankedIds[2]) errors.push('rank_decision_mismatch')
  if (new Set(asArray(candidate.priorityDecision?.runnerUps)).size !== 2 || candidate.priorityDecision.runnerUps.includes(candidate.priorityDecision.rank1)) errors.push('runner_up_shape')

  const candidates = asArray(candidate.researchCandidates)
  const candidateIds = new Set(candidates.map(item => item.id))
  if (!candidates.some(item => item.status === 'confirmed')) errors.push('confirmed_candidate_missing')
  if (!candidates.some(item => item.status === 'strong_candidate')) errors.push('strong_candidate_missing')
  if (!candidates.some(item => item.status === 'weak_candidate')) errors.push('weak_candidate_missing')
  for (const item of candidates) {
    if (!hasText(item.id) || !allowedCandidateStatuses.has(item.status) || !hasText(item.system) || !hasText(item.role) || !hasText(item.title) || !hasText(item.institution) || !hasText(item.identity) || !hasText(item.access) || !hasText(item.freeViewOrDownload) || !hasText(item.evidenceNote)) errors.push(`candidate_shape:${item.id}`)
    if (!asArray(item.urls).length || item.urls.some(url => !/^https?:\/\//.test(url))) errors.push(`candidate_urls:${item.id}`)
    if (!asArray(item.supports).length || !asArray(item.doesNotSupport).length) errors.push(`candidate_scope:${item.id}`)
  }

  const dossier = candidate.selectedDossier
  if (!dossier || dossier.targetId !== candidate.priorityDecision?.rank1 || dossier.system !== 'ziwei') errors.push('selected_dossier_identity')
  if (!Array.isArray(dossier?.blockerIds) || dossier.blockerIds.length !== 3) errors.push('selected_dossier_blockers')
  for (const field of ['exactMaterialType', 'requiredBibliography', 'preferredInstitutionAndCatalogIdentity', 'accessDecision', 'minimumAcceptableMaterial', 'idealStrongestMaterial', 'knownComparisonLocators', 'searchAndCaptureTerms', 'mustBeVisible', 'acceptCriteria', 'rejectCriteria', 'wrongEditionDiscrimination', 'cloneAndReprintRules', 'fileChecksOnReceipt', 'postAcquisitionBlockerAdvance', 'noAutomaticPromotion', 'lunaNextGoalVerificationPlan']) if (!(field in (dossier || {}))) errors.push(`dossier_missing:${field}`)
  const dossierRefs = asArray(dossier?.actualCandidateRefs)
  if (!dossierRefs.length || dossierRefs.some(ref => !candidateIds.has(ref))) errors.push('dossier_candidate_refs')
  for (const field of ['minimumAcceptableMaterial', 'idealStrongestMaterial', 'mustBeVisible', 'acceptCriteria', 'rejectCriteria', 'wrongEditionDiscrimination', 'cloneAndReprintRules', 'noAutomaticPromotion', 'lunaNextGoalVerificationPlan']) if (!asArray(dossier?.[field]).length) errors.push(`dossier_empty:${field}`)
  if (!/not_confirmed|uncertain/.test(JSON.stringify(dossier?.accessDecision || {}))) errors.push('access_uncertainty_missing')
  if (!/not yet confirmed|do not guess/.test(JSON.stringify(dossier?.knownComparisonLocators || {}))) errors.push('unresolved_leaf_not_explicit')
  if (!/SHA-256/.test(JSON.stringify(dossier?.fileChecksOnReceipt || {}))) errors.push('hash_check_missing')
  if (!/rotation-06/.test(JSON.stringify(dossier || {}))) errors.push('rotation_boundary_missing')
  if (!/independent|clone|lineage/.test(JSON.stringify(dossier || {}))) errors.push('clone_boundary_missing')

  if (candidate.sourceOfTruth?.predecessorFieldKit?.path !== SOURCE_FIELD_KIT_PATH || !/^[a-f0-9]{64}$/.test(candidate.sourceOfTruth?.predecessorFieldKit?.byteSha256 || '')) errors.push('source_field_kit_hash')
  if (candidate.verificationContract?.promotionBoundary?.automaticReadinessPromotion !== false || candidate.verificationContract?.promotionBoundary?.automaticEvidencePromotion !== false || candidate.verificationContract?.promotionBoundary?.automaticClaimPromotion !== false || candidate.verificationContract?.promotionBoundary?.automaticProductionChange !== false || candidate.verificationContract?.promotionBoundary?.humanReviewRequired !== true) errors.push('promotion_boundary')
  if (candidate.deterministic?.generatedAt !== null || candidate.deterministic?.networkFetch !== false || candidate.deterministic?.sourceAcquisitionPerformed !== false) errors.push('deterministic_boundary')
  const heldHash = candidate.heldMaterialCheck?.actualBytes?.byteSha256
  if (!/^[a-f0-9]{64}$/.test(heldHash || '')) errors.push('held_actual_hash_missing')
  if (!stableArtifactContentEqual(candidate, expected)) errors.push('materialized_content')
  return [...new Set(errors)]
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const path = resolve(process.argv[2] || ARTIFACT_PATH)
  const bytes = await readFile(path)
  const candidate = JSON.parse(bytes)
  const failures = await checkArtifact(candidate)
  process.stdout.write(JSON.stringify({ artifactPath: path, artifactByteSha256: sha256(bytes), pass: failures.length === 0, failures }, null, 2) + '\n')
  if (failures.length) process.exitCode = 1
}
