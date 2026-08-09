import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  buildFieldKit,
  canonicalJson,
  EXPECTED_HEAD,
  SCHEMA,
  VERDICT,
} from './materialize-tri-system-evidence-acquisition-field-kit-v1.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const REQUIRED_TARGET_FIELDS = [
  'id', 'system', 'priority', 'blockerIds', 'material', 'locator', 'purpose', 'currentGap',
  'notDuplicateOf', 'accept', 'reject', 'provenanceChecks', 'licensing', 'verificationPlan',
  'expectedChange', 'rationale', 'difficulty', 'confidence', 'sourceRefs',
]
const SYSTEMS = new Set(['saju', 'ziwei', 'western'])
const PRIORITIES = new Set(['P0', 'P1', 'P2'])

function asArray(value) { return Array.isArray(value) ? value : [] }
function hasText(value) { return typeof value === 'string' && value.trim().length > 0 }
function hasNonEmptyTextArray(value) { return asArray(value).length > 0 && asArray(value).every(hasText) }

export async function checkArtifact(candidate, { root = resolve(new URL('..', import.meta.url).pathname) } = {}) {
  const errors = []
  let expected
  try {
    expected = await buildFieldKit({ root })
  } catch (error) {
    return [`build:${error.message}`]
  }
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return ['artifact_not_object']
  if (candidate.schemaVersion !== SCHEMA || candidate.verdictToken !== VERDICT) errors.push('identity_or_verdict')
  if (candidate.scope?.branch !== 'main' || candidate.scope?.expectedHead !== EXPECTED_HEAD || candidate.scope?.currentHead !== EXPECTED_HEAD || candidate.scope?.originMainHead !== EXPECTED_HEAD) errors.push('repository_basis')
  for (const field of ['productionActivation', 'deploy', 'remoteDatabaseMutation', 'commit', 'push']) if (candidate.scope?.[field] !== false) errors.push(`mutation:${field}`)
  if (!asArray(candidate.scope?.unrelatedUntrackedPreserved).includes('-.jpg')) errors.push('unrelated_untracked_not_preserved')

  const blockers = asArray(candidate.currentAudit?.blockers)
  const blockerIds = new Set(blockers.map(blocker => blocker.id))
  if (blockers.length === 0 || blockers.some(blocker => !hasText(blocker.id) || !PRIORITIES.has(blocker.priority) || !hasText(blocker.status) || !hasText(blocker.title))) errors.push('blocker_shape')
  const targets = asArray(candidate.targets)
  const targetIds = new Set(targets.map(target => target.id))
  if (targets.length !== expected.targets.length || new Set(targets.map(target => target.id)).size !== targets.length) errors.push('target_count_or_unique_ids')
  for (const target of targets) {
    for (const field of REQUIRED_TARGET_FIELDS) if (!(field in target)) errors.push(`target_missing:${target.id}:${field}`)
    if (!hasText(target.id) || !SYSTEMS.has(target.system) || !PRIORITIES.has(target.priority)) errors.push(`target_identity:${target.id}`)
    if (!hasNonEmptyTextArray(target.blockerIds) || target.blockerIds.some(id => !blockerIds.has(id))) errors.push(`target_blocker_refs:${target.id}`)
    if (!hasNonEmptyTextArray(target.accept) || !hasNonEmptyTextArray(target.reject)) errors.push(`target_accept_reject:${target.id}`)
    if (!hasNonEmptyTextArray(target.provenanceChecks) || !hasNonEmptyTextArray(target.verificationPlan)) errors.push(`target_provenance_or_verification:${target.id}`)
    if (!hasText(target.purpose) || !hasText(target.currentGap) || !hasText(target.rationale) || !hasText(target.difficulty) || !hasText(target.confidence)) errors.push(`target_narrative:${target.id}`)
    if (!target.material || !hasNonEmptyTextArray(target.material.minimumSet) || !hasNonEmptyTextArray(target.material.idealSet) || !Array.isArray(target.material.namedTargets)) errors.push(`target_material:${target.id}`)
    if (!target.locator || !Array.isArray(target.locator.requiredSections) || !Array.isArray(target.locator.capture)) errors.push(`target_locator:${target.id}`)
    if (!target.licensing || !hasText(target.licensing.access) || !hasText(target.licensing.rights) || !hasText(target.licensing.policyDecision)) errors.push(`target_licensing:${target.id}`)
    if (!target.expectedChange || !/^unchanged\b/i.test(target.expectedChange.production || '') || Object.values(target.expectedChange).some(value => typeof value === 'string' && /^(ready|activated|production_enabled|available_for_interpretation)$/i.test(value))) errors.push(`target_promotion_boundary:${target.id}`)
    if (target.candidateStatus === 'no_action_current_scope') {
      if (!hasText(target.noActionReason) || target.material.namedTargets.length !== 0) errors.push(`no_action_shape:${target.id}`)
    } else if (target.candidateStatus !== 'action_required') errors.push(`target_status:${target.id}`)
    if (target.candidateStatus !== 'no_action_current_scope' && target.notDuplicateOf.length === 0) errors.push(`duplicate_boundary:${target.id}`)
  }

  const mappedBlockers = new Set(targets.flatMap(target => target.blockerIds))
  for (const blocker of blockers) {
    const mapped = mappedBlockers.has(blocker.id)
    const explicitNoAction = asArray(candidate.noAction).some(item => item.blockerIds?.includes(blocker.id) && hasText(item.reason))
    if (!mapped && !explicitNoAction) errors.push(`unmapped_blocker:${blocker.id}`)
    if (blocker.status === 'resolved_with_existing_evidence' && !explicitNoAction) errors.push(`resolved_blocker_without_no_action:${blocker.id}`)
  }

  const researchIds = new Set(asArray(candidate.sourceResearch).map(source => source.id))
  for (const source of asArray(candidate.sourceResearch)) {
    if (!hasText(source.id) || !hasText(source.system) || !hasText(source.status) || !hasText(source.authorityRole) || !hasText(source.title) || !hasText(source.institution) || !hasText(source.locator) || !hasText(source.access) || !hasText(source.license) || !hasNonEmptyTextArray(source.supports) || !hasNonEmptyTextArray(source.doesNotSupport)) errors.push(`source_research_shape:${source.id}`)
  }
  for (const target of targets) {
    for (const ref of target.sourceRefs) if (!researchIds.has(ref) && !hasText(ref)) errors.push(`source_ref:${target.id}`)
  }
  if (candidate.verificationContract?.promotionBoundary?.automaticReadinessPromotion !== false || candidate.verificationContract?.promotionBoundary?.automaticProductionPromotion !== false || candidate.verificationContract?.promotionBoundary?.automaticClaimPromotion !== false || candidate.verificationContract?.promotionBoundary?.humanReviewRequired !== true) errors.push('promotion_contract')
  if (!/authority|observation|licens/i.test(JSON.stringify(candidate.verificationContract?.requiredPerTarget || []))) errors.push('authority_observation_license_boundary')
  if (!/not.*propagat|blocked evidence|numeric agreement/i.test(JSON.stringify(candidate.currentAudit?.invariants || []))) errors.push('readiness_invariants')
  if (canonicalJson(candidate) !== canonicalJson(expected)) errors.push('materialized_content')
  return [...new Set(errors)]
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const path = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`)
  const bytes = await readFile(path)
  const candidate = JSON.parse(bytes)
  const failures = await checkArtifact(candidate)
  const result = { artifactPath: path, artifactByteSha256: sha256(bytes), pass: failures.length === 0, failures }
  console.log(JSON.stringify(result, null, 2))
  if (failures.length) process.exitCode = 1
}
