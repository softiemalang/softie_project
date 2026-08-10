import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  ARTIFACT_PATH,
  EXPECTED_HEAD,
  REQUIRED_ACCESS_ROUTES,
  buildArtifact,
  canonicalJson,
  SCHEMA,
  VERDICT,
} from './materialize-ziwei-p0-palace-semantic-witness-acquisition-route-v1.mjs'
import { checkHistoricalRepositoryBasis, stableArtifactContentEqual } from '../src/artifactIdentity.js'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const asArray = value => Array.isArray(value) ? value : []
const hasText = value => typeof value === 'string' && value.trim().length > 0
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)

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
  for (const field of ['staging', 'commit', 'push', 'deploy', 'remoteDatabaseMutation']) if (candidate.scope?.[field] !== false) errors.push(`mutation:${field}`)
  if (!asArray(candidate.scope?.unrelatedUntrackedPreserved).includes('-.jpg')) errors.push('untracked_preservation')

  const target = candidate.target
  if (target?.id !== 'ZIWEI-P0-PALACE-SEMANTIC-WITNESS' || target?.system !== 'ziwei') errors.push('target_identity')
  if (asArray(target?.blockers).length !== 3 || asArray(target?.requiredSemanticEdges).length !== 5 || asArray(target?.requiredDirectWitnesses).length !== 9) errors.push('target_contract')

  const audit = candidate.acquisitionAudit
  if (audit?.observedAtUtc !== '2026-08-09T12:31:50Z') errors.push('observation_timestamp')
  if (audit?.exhaustionDecision !== 'bounded_reasonable_public_legal_paths_exhausted') errors.push('bounded_exhaustion_decision')
  if (audit?.semanticGateClosed !== true || audit?.independentSecondWitnessObtained !== false || audit?.imageLevelReuseClosed !== false) errors.push('gate_or_rights_boundary')
  if (audit?.noUserActionPerformed !== true || audit?.noAccountOrPaymentUsed !== true) errors.push('human_boundary')
  if (JSON.stringify([...asArray(audit?.routeStatuses)].sort()) !== JSON.stringify([...REQUIRED_ACCESS_ROUTES].sort())) errors.push('route_enum')
  if (audit?.humanFallback?.submitted !== false || audit?.humanFallback?.neededForCurrentPublicImages !== false) errors.push('fallback_boundary')

  const candidates = asArray(candidate.candidates)
  if (candidates.length < 10) errors.push('candidate_coverage')
  const nara = candidates.filter(item => item.classification === 'confirmed_acquirable')
  if (nara.length !== 2 || !nara.every(item => item.accessRoute === 'immediate_public_download')) errors.push('nara_acquisition_routes')
  const allowedClassifications = new Set(['confirmed_acquirable', 'confirmed_catalog_identity', 'strong_candidate', 'weak_candidate', 'rejected'])
  const allowedRoutes = new Set(REQUIRED_ACCESS_ROUTES)
  for (const item of candidates) {
    if (!hasText(item.id) || !allowedClassifications.has(item.classification) || !allowedRoutes.has(item.accessRoute) || !hasText(item.authorityStatus) || !hasText(item.semanticUsefulness) || !hasText(item.independentWitnessStatus) || !hasText(item.system) || !hasText(item.role) || !hasText(item.title) || !hasText(item.institution) || !hasText(item.observedAtUtc) || !hasText(item.evidenceNote)) errors.push(`candidate_shape:${item.id}`)
    const urls = Array.isArray(item.urls) ? item.urls : Object.values(item.urls || {})
    if (!urls.length || urls.some(url => !/^https?:\/\//.test(url))) errors.push(`candidate_urls:${item.id}`)
    if (!asArray(item.supports).length || !asArray(item.doesNotSupport).length) errors.push(`candidate_scope:${item.id}`)
    if (item.classification === 'confirmed_acquirable') {
      if (item.accessRoute !== 'immediate_public_download' || item.fetchObservation?.manifestHttpStatus !== 200 || item.fetchObservation?.imageHttpStatus !== 200 || !Number.isInteger(item.fetchObservation?.canvasCount) || !hash(item.fetchObservation?.manifestSha256)) errors.push(`nara_fetch:${item.id}`)
      if (!asArray(item.fetchObservation?.sampleImages).length) errors.push(`nara_samples:${item.id}`)
      if (item.accessAndRightsBoundary?.itemSpecificImageReuse === undefined || item.accessAndRightsBoundary?.metadataVsImageRule === undefined) errors.push(`nara_rights_boundary:${item.id}`)
      for (const sample of asArray(item.fetchObservation?.sampleImages)) if (!Number.isInteger(sample.canvasIndex) || !hash(sample.imageSha256) || !Number.isInteger(sample.bytes) || !/^https:\/\//.test(sample.imageUrl)) errors.push(`nara_sample_shape:${item.id}:${sample.canvasIndex}`)
    }
  }
  if (!candidates.some(item => item.classification === 'weak_candidate') || !candidates.some(item => item.classification === 'rejected')) errors.push('negative_candidate_classes')

  const semantic = candidate.semanticFinding
  if (semantic?.result !== 'candidate_usable_for_locator_and_diagnostic_comparison_but_gate_remains_blocked') errors.push('semantic_result')
  if (!asArray(semantic?.directlyObserved).length || !asArray(semantic?.notDirectlyObserved).length || !/separate semantic adjudication/i.test(semantic?.interpretationBoundary || '')) errors.push('semantic_observation_boundary')
  if (!/not proof/i.test(semantic?.tianfuBoundary || '')) errors.push('tianfu_boundary')

  const relationship = JSON.stringify(candidate.relationshipAudit || {})
  if (!/independent/i.test(relationship) || !/not count/i.test(relationship) || !/different textual tradition/i.test(relationship)) errors.push('relationship_boundary')
  const contract = candidate.verificationContract
  if (contract?.promotionBoundary?.automaticClaimPromotion !== false || contract?.promotionBoundary?.automaticEvidencePromotion !== false || contract?.promotionBoundary?.automaticReadinessPromotion !== false || contract?.promotionBoundary?.automaticGroundingPromotion !== false || contract?.promotionBoundary?.automaticActivation !== false || contract?.promotionBoundary?.automaticProductionChange !== false || contract?.promotionBoundary?.automaticLicenseConclusion !== false || contract?.promotionBoundary?.humanSemanticReviewRequired !== true) errors.push('promotion_boundary')
  if (!asArray(contract?.requiredNextEvidence).length) errors.push('next_evidence_contract')
  if (candidate.deterministic?.generatedAt !== null || candidate.deterministic?.networkFetchPerformedByMaterializer !== false || candidate.deterministic?.sourceAcquisitionPerformedByMaterializer !== false || candidate.deterministic?.remoteObservationHashesDerivedFromActualBytes !== true) errors.push('deterministic_boundary')

  const expectedInputs = expected.sourceOfTruth.sourceInputs
  const actualInputs = candidate.sourceOfTruth?.sourceInputs
  if (canonicalJson(actualInputs) !== canonicalJson(expectedInputs)) errors.push('source_input_inventory')
  if (candidate.sourceOfTruth?.currentRepositoryBasis !== EXPECTED_HEAD) errors.push('source_basis')
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
