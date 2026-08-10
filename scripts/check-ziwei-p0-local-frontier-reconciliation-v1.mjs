import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'

import {
  canonicalIdentityJson,
  checkArtifactIdentity,
  checkHistoricalRepositoryBasis,
} from '../src/artifactIdentity.js'
import {
  ARTIFACT_DIR,
  BASIS_HEAD,
  MATERIALIZER_PATH,
  MATERIALIZER_VERSION,
  PREDECESSOR_ARTIFACT,
  SCHEMA,
  TOYO_ARTIFACT,
  VERDICT,
  buildBundle,
} from './materialize-ziwei-p0-local-frontier-reconciliation-v1.mjs'

export const ROOT = resolve(new URL('..', import.meta.url).pathname)

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const parse = path => JSON.parse(readFileSync(path, 'utf8'))
const stable = value => {
  const copy = structuredClone(value)
  delete copy.artifactIdentity
  delete copy.observedHead
  delete copy.originMainHead
  return copy
}
const same = (left, right) => canonicalIdentityJson(stable(left)) === canonicalIdentityJson(stable(right))
const failure = (list, condition, message) => { if (condition) list.push(message) }

const BLOCKER_IDS = [
  'blocker-source-identity-unresolved',
  'blocker-palace-semantic-identity',
  'blocker-direct-rule-absent',
  'blocker-tianfu-raw-formula-contradiction',
  'blocker-tianfu-rotation06-semantic-authority',
  'blocker-auxiliary-star-source-witness',
  'blocker-four-transform-source-witness',
  'blocker-life-body-ruler-source-legibility',
  'blocker-independent-external-oracle',
  'blocker-calendar-time-source-identity',
  'blocker-image-reuse-rights',
]

const EXPECTED_INPUT_PATHS = [
  PREDECESSOR_ARTIFACT,
  TOYO_ARTIFACT,
  'artifacts/ziwei-four-transformations-source-evidence-v0/complete.json',
  'artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/complete.json',
  'artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/complete.json',
  'artifacts/ziwei-twelve-major-star-placement-evidence-v0/complete.json',
  'artifacts/ziwei-major-star-source-corpus-provenance-v0/complete.json',
  'artifacts/ziwei-tianfu-representation-search-v1/complete.json',
  'artifacts/ziwei-tianfu-convention-provenance-v0/complete.json',
  'artifacts/ziwei-fixture-reconciliation-v1/complete.json',
  '-.jpg',
]

function fileSha256(root, path) {
  return sha256(readFileSync(resolve(root, path)))
}

function protectedBytesMatch(root, artifact) {
  return (artifact?.evidenceInputs?.protectedBytes || []).every(item => (
    item.exists === true
    && existsSync(resolve(root, item.path))
    && fileSha256(root, item.path) === item.byteSha256
  ))
}

function checkAcquisitionRows(failures, blockerAssessments) {
  failure(failures, blockerAssessments.some(item => {
    const acquisition = item.nextAcquisition
    return !acquisition
      || typeof acquisition.requirementId !== 'string'
      || typeof acquisition.witnessType !== 'string'
      || typeof acquisition.identity !== 'string'
      || typeof acquisition.locator !== 'string'
      || typeof acquisition.independence !== 'string'
      || !Array.isArray(acquisition.resolvesClaimIds)
      || acquisition.resolvesClaimIds.length === 0
      || typeof acquisition.note !== 'string'
  }), 'acquisition_requirement_shape')
  failure(failures, new Set(blockerAssessments.map(item => item.nextAcquisition.requirementId)).size !== blockerAssessments.length, 'duplicate_acquisition_requirement_id')
}

export function checkBundle({ artifact }, root = ROOT, options = {}) {
  const failures = []
  const historical = checkHistoricalRepositoryBasis(root, BASIS_HEAD, { expectedBranch: 'main' })
  failure(failures, historical.errors.length > 0, `historical_repository_basis:${historical.errors.join(',')}`)

  let expected
  try {
    expected = buildBundle(root, options)
  } catch (error) {
    failures.push(`rebuild_failed:${error.message}`)
    return [...new Set(failures)]
  }

  failure(failures, artifact?.schemaVersion !== SCHEMA, 'schema_version')
  failure(failures, artifact?.verdictToken !== VERDICT, 'verdict')
  failure(failures, artifact?.basisHead !== BASIS_HEAD, 'basis_head')
  failure(failures, artifact?.branch !== 'main', 'branch')
  failure(failures, !same(artifact, expected), 'stable_content_not_reproducible')

  const predecessor = artifact?.predecessor
  failure(failures, predecessor?.path !== PREDECESSOR_ARTIFACT, 'predecessor_path')
  failure(failures, predecessor?.coverage?.claimCount !== 30 || predecessor?.coverage?.sourceCount !== 13 || predecessor?.coverage?.observationCount !== 34 || predecessor?.coverage?.relationCount !== 124 || predecessor?.coverage?.blockerCount !== 11, 'predecessor_counts')
  failure(failures, predecessor?.claimBoundary?.stableClaimCount !== 0 || predecessor?.claimBoundary?.semanticAuthorityCount !== 0 || predecessor?.claimBoundary?.independentWitnessesAdmitted !== 0, 'predecessor_authority_boundary')
  failure(failures, predecessor?.readiness?.readiness !== 'not_safe_to_start' || predecessor?.readiness?.grounding !== 'blocked' || predecessor?.readiness?.activation !== 'experimental_only' || predecessor?.readiness?.rotation06 !== 'representation_only', 'predecessor_readiness_boundary')
  failure(failures, predecessor?.preserved?.predecessorBytesRewritten !== false || predecessor?.preserved?.sourceImagesStoredInGit !== false, 'predecessor_preservation_boundary')
  failure(failures, !/^[0-9a-f]{64}$/.test(predecessor?.byteSha256 || ''), 'predecessor_byte_identity')

  const sourceRows = artifact?.sourceIdentity?.sources || []
  failure(failures, sourceRows.length !== 2, 'source_row_count')
  failure(failures, sourceRows.some(item => !/^[0-9a-f]{64}$/.test(item.actualSha256 || '') || item.actualSha256 !== item.expectedSha256 || item.readOnly !== true || item.copiedIntoRepository !== false || item.acquiredDuringMaterialization !== false), 'source_byte_boundary')
  failure(failures, artifact?.sourceIdentity?.newSourceCount !== 0 || artifact?.sourceIdentity?.independentWitnessesAdmitted !== 0 || artifact?.sourceIdentity?.sourceAuthorityPromoted !== false, 'source_authority_promotion')
  failure(failures, artifact?.sourceIdentity?.sameRecordAndDerivativeSeparationPreserved !== true || artifact?.sourceIdentity?.actualBytesReadDirectly !== true || artifact?.sourceIdentity?.sourceImagesOrPdfsStoredInGit !== false, 'source_lineage_boundary')
  failure(failures, sourceRows.some(item => !existsSync(item.path) || fileSha256(root, relative(root, item.path)) !== item.actualSha256), 'source_path_byte_mismatch')

  const observations = artifact?.observations || []
  failure(failures, observations.length !== 6, 'observation_count')
  failure(failures, observations.some(item => !item.observationId || !Array.isArray(item.sourceIds) || item.sourceIds.length === 0 || !Array.isArray(item.claimIds) || !Array.isArray(item.blockerIds) || typeof item.detail !== 'string'), 'observation_shape')
  failure(failures, new Set(observations.map(item => item.observationId)).size !== observations.length, 'duplicate_observation_id')
  failure(failures, observations.some(item => ![
    'existing_hash_verified_pdf_direct_visual_review_reconciled_in_successor',
    'current_actual_pdf_bytes_hash_verified_and_directly_rendered_visual_review',
    'current_actual_pdf_bytes_hash_verified_and_directly_rendered_selected_page_review',
  ].includes(item.observationMode)), 'observation_visual_boundary')
  failure(failures, observations.some(item => ![
    'bounded_rule_surface_not_complete_row_level_source_authority',
    'formula_and_diagram_surface_not_semantic_palace_identity',
    'bounded_auxiliary_surface_and_comparison_not_complete_independent_rule_witness',
    'complete_single_local_edition_table_surface_not_source_authority',
    'partial_same_record_candidate_surface_with_explicit_unlocated_cells',
    'bounded_life_body_and_ruler_surface_with_24_unresolved_rows',
  ].includes(item.evidenceScope)), 'observation_authority_boundary')

  const relations = artifact?.relations || []
  failure(failures, relations.length !== 6, 'relation_count')
  failure(failures, new Set(relations.map(item => item.relationId)).size !== relations.length, 'duplicate_relation_id')
  failure(failures, relations.some(item => !observations.some(observation => observation.observationId === item.observationId) || item.promotion === undefined || !Array.isArray(item.doesNotEstablish) || item.doesNotEstablish.length === 0), 'relation_shape')
  failure(failures, relations.some(item => /semantic_authority|stable_claim|source_authority|production_promotion/.test(item.promotion) && !/not|remains|blocked/.test(item.promotion)), 'relation_promotion')

  const blockers = artifact?.blockerAssessments || []
  failure(failures, blockers.length !== BLOCKER_IDS.length, 'blocker_assessment_count')
  failure(failures, BLOCKER_IDS.some((id, index) => blockers[index]?.id !== id), 'blocker_assessment_order')
  failure(failures, blockers.some(item => !['blocked', 'needs_human_review'].includes(item.status)), 'blocker_status_promotion')
  failure(failures, blockers.some(item => !Array.isArray(item.evidenceRefs) || item.evidenceRefs.length === 0 || !Array.isArray(item.newObservationIds)), 'blocker_evidence_shape')
  checkAcquisitionRows(failures, blockers)

  const successor = artifact?.graphImpact?.successor
  failure(failures, successor?.claimCount !== 30 || successor?.sourceCount !== 13 || successor?.observationCount !== 40 || successor?.relationCount !== 130 || successor?.blockerCount !== 11, 'successor_counts')
  failure(failures, artifact?.graphImpact?.additive?.claimCount !== 0 || artifact?.graphImpact?.additive?.sourceCount !== 0 || artifact?.graphImpact?.additive?.observationCount !== 6 || artifact?.graphImpact?.additive?.relationCount !== 6 || artifact?.graphImpact?.additive?.blockerCount !== 0, 'additive_counts')
  failure(failures, artifact?.graphImpact?.blockersClosed?.length !== 0 || artifact?.graphImpact?.blockersStillBlocked?.length !== 11, 'blocker_closure')
  failure(failures, artifact?.claimImpact?.claimsAdded !== 0 || artifact?.claimImpact?.claimsPromoted !== 0 || artifact?.claimImpact?.stableClaimCount !== 0 || artifact?.claimImpact?.semanticAuthorityCount !== 0, 'claim_promotion')

  failure(failures, artifact?.localEvidence?.fourTransformations?.nanbei?.comparableCount !== 40 || artifact?.localEvidence?.fourTransformations?.ming?.comparableCount !== 4 || artifact?.localEvidence?.fourTransformations?.ming?.blockedCount !== 36, 'four_transform_boundary')
  failure(failures, artifact?.localEvidence?.fourTransformations?.sourceCellsPreserved !== true || artifact?.localEvidence?.fourTransformations?.mismatchCount !== 0, 'four_transform_preservation')
  failure(failures, artifact?.localEvidence?.lifeBodyRulers?.lifeBody?.matchCount !== 144 || artifact?.localEvidence?.lifeBodyRulers?.sourceEditionRulers?.mingZhuCanonicalMatches !== 144 || artifact?.localEvidence?.lifeBodyRulers?.sourceEditionRulers?.shenZhuCanonicalComparable !== 120 || artifact?.localEvidence?.lifeBodyRulers?.sourceEditionRulers?.shenZhuCanonicalBlocked !== 24 || artifact?.localEvidence?.lifeBodyRulers?.productionRulerComparison?.comparableCount !== 0, 'life_body_boundary')
  failure(failures, artifact?.localEvidence?.auxiliaryStars?.comparableCount !== 136 || artifact?.localEvidence?.auxiliaryStars?.exactMatchCount !== 136 || artifact?.localEvidence?.auxiliaryStars?.notComparableCount !== 684, 'auxiliary_boundary')
  failure(failures, artifact?.localEvidence?.tianfu?.identityMatchCount !== 0 || artifact?.localEvidence?.tianfu?.rotation06MatchCount !== 150 || artifact?.localEvidence?.tianfu?.semanticEquivalence !== 'blocked_semantic_identity_insufficient' || artifact?.localEvidence?.tianfu?.rotation06RawIdentity !== 'not_raw_identity; representation_relation_only', 'tianfu_boundary')
  failure(failures, artifact?.localEvidence?.externalOracle?.fixtureCount !== 6 || artifact?.localEvidence?.externalOracle?.independentlyVerified !== 0 || artifact?.localEvidence?.externalOracle?.pending !== 6 || artifact?.localEvidence?.externalOracle?.internalFixturesPromoted !== false, 'external_oracle_boundary')

  failure(failures, artifact?.frontierConclusion?.predecessorGlobalExhaustion !== false || artifact?.frontierConclusion?.successorLocalFrontier !== 'exhausted_after_reconciling_existing_repository_artifacts_and_explicitly_configured_local_original_pdfs' || artifact?.frontierConclusion?.noUnsupportedPromotion !== true, 'frontier_conclusion')
  failure(failures, !Array.isArray(artifact?.frontierTransitions) || artifact.frontierTransitions.length !== 5, 'frontier_transition_count')
  failure(failures, !Array.isArray(artifact?.researchUnits) || artifact.researchUnits.length !== 7 || artifact.researchUnits.some(item => !item.unitId || !item.frontier || !item.result || !Array.isArray(item.blockerIds)), 'research_unit_shape')

  failure(failures, artifact?.readinessImpact?.readiness !== 'not_safe_to_start' || artifact?.readinessImpact?.grounding !== 'blocked' || artifact?.readinessImpact?.activation !== 'experimental_only' || artifact?.readinessImpact?.rotation06 !== 'representation_only', 'readiness_promotion')
  failure(failures, artifact?.readinessImpact?.productionModified !== false || artifact?.readinessImpact?.publicContractModified !== false || artifact?.readinessImpact?.readinessModified !== false || artifact?.readinessImpact?.interpretationGenerated !== false, 'production_or_readiness_mutation')
  failure(failures, artifact?.preservation?.predecessorArtifactChanged !== false || artifact?.preservation?.historicalPredecessorBytesRewritten !== false || artifact?.preservation?.protectedUntrackedDashJpgPreserved !== true || artifact?.preservation?.sourceImagesStoredInGit !== false || artifact?.preservation?.sourcePdfsStoredInGit !== false || artifact?.preservation?.externalAcquisitionPerformed !== false || artifact?.preservation?.networkUsedDuringMaterialization !== false, 'preservation_boundary')
  failure(failures, artifact?.preservation?.productionChanged !== false || artifact?.preservation?.remoteDatabaseChanged !== false || artifact?.preservation?.commitPerformed !== false || artifact?.preservation?.pushPerformed !== false || artifact?.preservation?.deploymentPerformed !== false, 'external_mutation_boundary')
  failure(failures, artifact?.deterministicContract?.generatedAt !== 'forbidden' || artifact?.deterministicContract?.timestamps !== 'forbidden' || artifact?.deterministicContract?.network !== 'forbidden', 'deterministic_contract')

  failure(failures, !protectedBytesMatch(root, artifact), 'protected_bytes_changed')
  failure(failures, !existsSync(resolve(root, '-.jpg')), 'dash_jpg_not_preserved')
  failure(failures, EXPECTED_INPUT_PATHS.some(path => !existsSync(resolve(root, path))), 'expected_input_missing')
  failures.push(...checkArtifactIdentity(artifact, {
    root,
    artifactId: SCHEMA,
    materializerPath: MATERIALIZER_PATH,
    materializerVersion: MATERIALIZER_VERSION,
    allowGenerationBaseInput: true,
  }))
  return [...new Set(failures)]
}

export function checkArtifact(root = ROOT, completePath = resolve(root, `${ARTIFACT_DIR}/complete.json`), options = {}) {
  const failures = checkBundle({ artifact: parse(completePath) }, root, options)
  const body = readFileSync(completePath)
  const sidecar = parse(`${completePath}.integrity.json`)
  failure(failures, sidecar.schemaVersion !== `${SCHEMA}-integrity-v0`, 'integrity_schema')
  failure(failures, sidecar.path !== relative(root, completePath), 'integrity_path')
  failure(failures, sidecar.byteSha256 !== sha256(body), 'integrity_hash')
  return [...new Set(failures)]
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const completePath = resolve(process.argv[2] || `${ARTIFACT_DIR}/complete.json`)
  const errors = checkArtifact(ROOT, completePath)
  console.log(JSON.stringify({ schema: SCHEMA, status: errors.length ? 'failed' : 'ok', errors, basisHead: BASIS_HEAD, verdict: VERDICT }, null, 2))
  if (errors.length) process.exitCode = 1
}
