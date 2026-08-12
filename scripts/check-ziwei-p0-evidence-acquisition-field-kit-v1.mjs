import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  checkArtifactIdentity,
  stableArtifactContentEqual,
} from '../src/artifactIdentity.js'
import {
  ARTIFACT_PATH,
  MATERIALIZER_VERSION,
  ROOT,
  SCHEMA,
  VERDICT,
  buildBundle,
} from './materialize-ziwei-p0-evidence-acquisition-field-kit-v1.mjs'
import {
  SAJU_SOURCE_DERIVED_ASSET_PATH,
  migrateSajuLegacyAssetPath,
} from '../src/interpretationPrep/sajuSourceDerivedEvidenceAsset.js'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const asArray = value => Array.isArray(value) ? value : []
const hasText = value => typeof value === 'string' && value.trim().length > 0
const unique = values => [...new Set(values)]

const REQUIRED_TARGET_FIELDS = [
  'id', 'priority', 'priorityRank', 'status', 'title', 'purpose', 'blockerIds',
  'resolvesClaimIds', 'affectedClaimIds', 'currentRelationIds', 'affectedRelationIds',
  'currentEvidenceRefs', 'sourceRefs', 'currentGap', 'material', 'locator', 'search',
  'acceptanceCriteria', 'rejectionCriteria', 'notDuplicateOf', 'closure', 'licensing',
  'verificationPlan', 'rationale',
]
const PRIORITIES = new Set(['P0', 'P1', 'P2'])
const TARGET_STATUSES = new Set(['action_required', 'human_policy_review'])

function allText(values) {
  return Array.isArray(values) && values.length > 0 && values.every(hasText)
}

function containsTimestampValue(value, path = '') {
  if (Array.isArray(value)) return value.some((item, index) => containsTimestampValue(item, `${path}[${index}]`))
  if (!value || typeof value !== 'object') return false
  return Object.entries(value).some(([key, child]) => {
    if (key === 'generatedAt' && child !== 'forbidden') return true
    if (key === 'timestamp' && child !== 'forbidden') return true
    return containsTimestampValue(child, `${path}.${key}`)
  })
}

export async function checkArtifact(candidate, { root = ROOT } = {}) {
  const errors = []
  let expected
  try {
    expected = buildBundle(root)
  } catch (error) {
    return [`build:${error.message}`]
  }
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return ['artifact_not_object']
  if (candidate.schemaVersion !== SCHEMA || candidate.verdictToken !== VERDICT) errors.push('identity_or_verdict')

  const identityErrors = checkArtifactIdentity(candidate, {
    root,
    artifactId: SCHEMA,
    materializerPath: `scripts/materialize-${SCHEMA}.mjs`,
    materializerVersion: MATERIALIZER_VERSION,
    allowGenerationBaseInput: true,
    allowVerifierInputDrift: true,
    inputPathResolver: migrateSajuLegacyAssetPath,
  })
  errors.push(...identityErrors.map(error => `artifact_identity:${error}`))

  const scope = candidate.scope || {}
  if (scope.branch !== 'main' || !/^[0-9a-f]{40}$/.test(scope.currentHead || '') || !/^[0-9a-f]{40}$/.test(scope.originMainHead || '')) errors.push('repository_scope')
  for (const field of ['externalAcquisitionPerformed', 'networkUsedDuringMaterialization', 'sourceAuthorityPromoted', 'semanticAuthorityPromoted', 'productionChanged', 'readinessChanged', 'groundingChanged', 'activationChanged', 'remoteDatabaseChanged', 'deployPerformed', 'commitPerformed', 'pushPerformed']) if (scope[field] !== false) errors.push(`scope_mutation:${field}`)
  if (scope.independentWitnessesAdmitted !== 0) errors.push('independent_witness_promotion')
  if (!asArray(scope.protectedUntrackedPreserved).includes('-.jpg')) errors.push('protected_untracked_missing')

  const graph = candidate.currentAudit?.graph || {}
  for (const [field, value] of Object.entries({ claims: 30, sources: 13, observations: 40, relations: 130, blockers: 11, stableClaims: 0, semanticAuthority: 0 })) if (graph[field] !== value) errors.push(`current_graph_boundary:${field}`)
  const statuses = candidate.currentAudit?.statuses || {}
  if (statuses.readiness !== 'not_safe_to_start' || statuses.grounding !== 'blocked' || statuses.activation !== 'experimental_only' || statuses.rotation06 !== 'representation_only') errors.push('status_promotion')
  if (statuses.independentWitnessesAdmitted !== 0 || statuses.sourceAuthorityPromoted !== false) errors.push('current_status_promotion')
  const keyBoundaries = asArray(candidate.currentAudit?.keyEvidenceBoundaries)
  if (keyBoundaries.length !== 6) errors.push('key_boundary_count')
  if (!keyBoundaries.some(item => item.id === 'nara-leaf-concordance' && /0 exact_same_leaf/.test(item.result))) errors.push('nara_boundary')
  if (!keyBoundaries.some(item => item.id === 'four-transformations' && /40\/40/.test(item.observed) && /36 unlocated/.test(item.observed))) errors.push('four_transform_boundary')
  if (!keyBoundaries.some(item => item.id === 'life-body-rulers' && /24 blocked/.test(item.observed))) errors.push('life_body_boundary')
  if (!keyBoundaries.some(item => item.id === 'tianfu' && /0\/150/.test(item.observed) && /150\/150/.test(item.observed))) errors.push('tianfu_boundary')

  const claimIds = asArray(candidate.currentAudit?.claimIds)
  if (claimIds.length !== 30 || unique(claimIds).length !== 30) errors.push('claim_id_boundary')
  const relationIds = asArray(candidate.currentAudit?.relationIds)
  if (relationIds.length !== 6 || unique(relationIds).length !== 6) errors.push('relation_id_boundary')
  const claimSet = new Set(claimIds)
  const relationSet = new Set(relationIds)
  const blockerList = asArray(candidate.blockers)
  const blockerIds = new Set(blockerList.map(item => item.id))
  if (blockerList.length !== 11 || blockerIds.size !== 11) errors.push('blocker_count_or_unique')
  for (const blocker of blockerList) {
    if (!hasText(blocker.id) || !PRIORITIES.has(blocker.priority) || !hasText(blocker.status) || !hasText(blocker.boundaryClass) || !hasText(blocker.currentEvidenceBoundary)) errors.push(`blocker_shape:${blocker.id}`)
    if (!allText(blocker.currentEvidenceRefs) || !allText(blocker.mappedTargetIds)) errors.push(`blocker_refs:${blocker.id}`)
  }

  const targets = asArray(candidate.targets)
  const targetIds = new Set(targets.map(item => item.id))
  if (targets.length !== 10 || targetIds.size !== targets.length) errors.push('target_count_or_unique')
  const witnessClasses = asArray(candidate.candidateWitnessClasses)
  if (witnessClasses.length !== 4 || witnessClasses.some(item => !hasText(item.id) || !hasText(item.use) || !hasText(item.material) || !hasText(item.independence) || !hasText(item.acceptance) || !hasText(item.rejection))) errors.push('candidate_witness_class_boundary')
  for (const item of targets) {
    const expectedTarget = expected.targets.find(expectedItem => expectedItem.id === item.id)
    if (!expectedTarget) errors.push(`unknown_target:${item.id}`)
    else {
      if (item.blockerIds.some(id => !expectedTarget.blockerIds.includes(id))) errors.push(`target_blocker_scope:${item.id}`)
      if (item.resolvesClaimIds.some(id => !expectedTarget.resolvesClaimIds.includes(id))) errors.push(`target_claim_scope:${item.id}`)
      if (item.affectedClaimIds.some(id => !expectedTarget.affectedClaimIds.includes(id))) errors.push(`target_affected_claim_scope:${item.id}`)
      if (item.currentRelationIds.some(id => !expectedTarget.currentRelationIds.includes(id))) errors.push(`target_relation_scope:${item.id}`)
    }
    for (const field of REQUIRED_TARGET_FIELDS) if (!(field in item)) errors.push(`target_missing:${item.id}:${field}`)
    if (!hasText(item.id) || !PRIORITIES.has(item.priority) || !TARGET_STATUSES.has(item.status) || !Number.isInteger(item.priorityRank) || !hasText(item.title) || !hasText(item.purpose) || !hasText(item.currentGap) || !hasText(item.rationale)) errors.push(`target_identity:${item.id}`)
    if (!allText(item.blockerIds) || item.blockerIds.some(id => !blockerIds.has(id))) errors.push(`target_blockers:${item.id}`)
    if (!Array.isArray(item.resolvesClaimIds) || item.resolvesClaimIds.some(id => !claimSet.has(id))) errors.push(`target_resolves_claims:${item.id}`)
    if (!Array.isArray(item.affectedClaimIds) || item.affectedClaimIds.some(id => !claimSet.has(id))) errors.push(`target_affected_claims:${item.id}`)
    if (!Array.isArray(item.currentRelationIds) || item.currentRelationIds.some(id => !relationSet.has(id))) errors.push(`target_current_relations:${item.id}`)
    if (!Array.isArray(item.affectedRelationIds) || item.affectedRelationIds.some(id => !relationSet.has(id))) errors.push(`target_affected_relations:${item.id}`)
    if (!allText(item.currentEvidenceRefs) || !allText(item.sourceRefs) || !allText(item.notDuplicateOf)) errors.push(`target_source_refs:${item.id}`)
    if (!item.material || !allText(item.material.minimumSet) || !allText(item.material.idealSet)) errors.push(`target_material:${item.id}`)
    if (!item.locator || !allText(item.locator.required) || !allText(item.locator.capture)) errors.push(`target_locator:${item.id}`)
    if (!item.search || !allText(item.search.canonicalTerms) || !allText(item.search.channels) || !allText(item.search.alreadyHeldNearMisses)) errors.push(`target_search:${item.id}`)
    if (!allText(item.acceptanceCriteria) || !allText(item.rejectionCriteria) || !allText(item.verificationPlan)) errors.push(`target_criteria:${item.id}`)
    if (!item.closure || item.closure.automatic !== false || item.closure.humanReviewRequired !== true || !allText(item.closure.doesNotClose) || !allText(item.closure.canCloseOnlyWhen)) errors.push(`target_closure:${item.id}`)
    if (!item.licensing || !hasText(item.licensing.access) || !hasText(item.licensing.rights) || !hasText(item.licensing.policyDecision)) errors.push(`target_licensing:${item.id}`)
    if (item.status === 'human_policy_review' && item.resolvesClaimIds.length !== 0) errors.push(`human_target_resolves_claim:${item.id}`)
    if (item.id === 'acq-distinct-witness-identity-lineage' && item.resolvesClaimIds.length !== 0) errors.push('identity_gate_resolves_claims')
    if (item.id === 'review-image-level-reuse-permission' && item.resolvesClaimIds.length !== 0) errors.push('rights_gate_resolves_claims')
  }
  const mappedBlockers = new Set(targets.flatMap(item => item.blockerIds))
  for (const blocker of blockerList) {
    if (!mappedBlockers.has(blocker.id)) errors.push(`unmapped_blocker:${blocker.id}`)
    if (blocker.mappedTargetIds.some(id => !targetIds.has(id))) errors.push(`blocker_target_ref:${blocker.id}`)
    if (blocker.boundaryClass === 'human_policy_boundary' && blocker.status !== 'needs_human_review') errors.push(`human_boundary_status:${blocker.id}`)
  }
  const sourceInputPaths = new Set(asArray(candidate.artifactIdentity?.inputs).map(item => item.path))
  for (const item of targets) {
    for (const ref of [...item.currentEvidenceRefs, ...item.sourceRefs]) if (!sourceInputPaths.has(ref)) errors.push(`untracked_target_ref:${item.id}:${ref}`)
  }
  const rightsTarget = targets.find(item => item.id === 'review-image-level-reuse-permission')
  if (!rightsTarget || rightsTarget.blockerIds.length !== 1 || rightsTarget.blockerIds[0] !== 'blocker-image-reuse-rights' || rightsTarget.resolvesClaimIds.length !== 0) errors.push('rights_layer_mixing')
  if (candidate.claimImpact?.rightsTargetResolvesClaimIds?.length !== 0 || candidate.claimImpact?.sourceIdentityTargetResolvesClaimIds?.length !== 0 || candidate.claimImpact?.noClaimPromotionByIntake !== true) errors.push('claim_promotion_boundary')
  if (candidate.relationImpact?.plannedRelationsAreNotCurrentEvidence !== true || candidate.relationImpact?.numericAgreementIsNotSemanticAuthority !== true || candidate.relationImpact?.sameLineageIsNotIndependent !== true) errors.push('relation_separation_boundary')
  const inventory = candidate.currentAudit?.sourceInventory || {}
  const inventoryText = JSON.stringify(inventory)
  if (/source_authority_established|semantic_authority_established|independent_witness_admitted/.test(inventoryText)) errors.push('inventory_authority_promotion')
  if (!inventory.heldButAuthorityInsufficient?.every(item => /held_but_authority_insufficient/.test(item.status))) errors.push('held_material_classification')
  if (!inventory.missingOrHumanBoundary?.some(item => item.id === 'image-reuse-decision' && item.status === 'needs_human_review')) errors.push('human_rights_inventory')
  if (candidate.humanReviewBoundary?.imageReuseRights !== 'blocker-image-reuse-rights remains needs_human_review; no source image is stored by this field kit') errors.push('rights_human_boundary')
  const preservation = candidate.preservation || {}
  for (const field of ['sourceImagesStoredInGit', 'sourcePdfsStoredInGit', 'externalAcquisitionPerformed', 'networkUsedDuringMaterialization', 'predecessorArtifactsRewritten', 'existingAcquisitionKitRewritten', 'commitPerformed', 'pushPerformed', 'deployPerformed', 'remoteDatabaseChanged']) if (preservation[field] !== false) errors.push(`preservation:${field}`)
  if (preservation.protectedDashJpg?.path !== '-.jpg' || preservation.protectedDashJpg?.exists !== true || !existsSync(resolve(root, SAJU_SOURCE_DERIVED_ASSET_PATH))) errors.push('protected_source_derived_asset')
  if (candidate.deterministicContract?.generatedAt !== 'forbidden' || candidate.deterministicContract?.timestamps !== 'forbidden' || candidate.deterministicContract?.noExternalAcquisition !== true) errors.push('deterministic_contract')
  if (containsTimestampValue(candidate)) errors.push('timestamp_value')
  const rejectionText = JSON.stringify(candidate.negativeContract?.rejects || [])
  if (!/wrong blocker-to-target mapping/.test(rejectionText) || !/authority/.test(rejectionText) || !/same-record/.test(rejectionText) || !/rights/.test(rejectionText)) errors.push('negative_contract')
  if (!stableArtifactContentEqual(candidate, expected)) errors.push('materialized_content')
  return [...new Set(errors)]
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const path = resolve(process.argv[2] || ARTIFACT_PATH)
  const bytes = await readFile(path)
  const candidate = JSON.parse(bytes)
  const failures = await checkArtifact(candidate)
  console.log(JSON.stringify({ artifactPath: path, artifactByteSha256: sha256(bytes), pass: failures.length === 0, failures }, null, 2))
  if (failures.length) process.exitCode = 1
}
