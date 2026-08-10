import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'

import { canonicalIdentityJson, checkArtifactIdentity, checkHistoricalRepositoryBasis } from '../src/artifactIdentity.js'
import { ARTIFACT_DIR, EXPECTED_HEAD, MATERIALIZER_PATH, MATERIALIZER_VERSION, PREDECESSOR_ARTIFACT, PREDECESSOR_LINEAGE_ARTIFACT, SCHEMA, VERDICT, buildBundle } from './materialize-ziwei-p0-toyo-1646-extended-observation-v0.mjs'

export const ROOT = resolve(new URL('..', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const parse = path => JSON.parse(readFileSync(path, 'utf8'))
const stable = value => {
  const copy = structuredClone(value)
  delete copy.artifactIdentity
  delete copy.observedHead
  return copy
}
const same = (left, right) => canonicalIdentityJson(stable(left)) === canonicalIdentityJson(stable(right))
const failure = (list, condition, message) => { if (condition) list.push(message) }

export function checkBundle({ artifact }, root = ROOT, { cacheDir = process.env.TOYO_1646_CACHE_DIR } = {}) {
  const failures = []
  const historical = checkHistoricalRepositoryBasis(root, EXPECTED_HEAD, { expectedBranch: 'main' })
  failure(failures, historical.errors.length > 0, `historical_repository_basis:${historical.errors.join(',')}`)
  let expected
  try { expected = buildBundle(root, { cacheDir, repositoryOverride: { branch: 'main', currentHead: EXPECTED_HEAD, originMainHead: EXPECTED_HEAD } }) } catch (error) { failures.push(`rebuild_failed:${error.message}`); return [...new Set(failures)] }

  failure(failures, artifact?.schemaVersion !== SCHEMA, 'schema_version')
  failure(failures, artifact?.verdictToken !== VERDICT, 'verdict')
  failure(failures, artifact?.basisHead !== EXPECTED_HEAD || artifact?.expectedHead !== EXPECTED_HEAD, 'basis_head')
  failure(failures, artifact?.branch !== 'main', 'branch')
  failure(failures, !same(artifact, expected), 'stable_content_not_reproducible')
  failure(failures, artifact?.predecessor?.path !== PREDECESSOR_ARTIFACT, 'predecessor_path')
  failure(failures, artifact?.sourceAssessment?.afterReviewIndependence !== 'independent_physical_witness_candidate_not_admitted_as_independent_oracle', 'candidate_promoted')
  failure(failures, artifact?.sourceAssessment?.semanticAuthority !== 'not_established', 'semantic_authority_promoted')
  failure(failures, artifact?.externalEvidence?.imageCount !== 23 || artifact?.externalEvidence?.predecessorImageCount !== 15 || artifact?.externalEvidence?.newImageCount !== 8, 'image_count')
  failure(failures, artifact?.externalEvidence?.cacheConfiguration?.requiredEnv !== 'TOYO_1646_CACHE_DIR', 'cache_configuration')

  const reviewedFiles = artifact?.externalEvidence?.reviewedFiles || []
  failure(failures, reviewedFiles.length !== 23, 'reviewed_file_rows')
  failure(failures, reviewedFiles.filter(item => item.reviewOrigin === 'predecessor_visual_review_hash_rechecked').length !== 15 || reviewedFiles.filter(item => item.reviewOrigin === 'new_visual_review_in_this_packet').length !== 8, 'review_origin_counts')
  failure(failures, reviewedFiles.some(item => item.cachePathIsNotStored !== true || !/^[0-9a-f]{64}$/.test(item.byteSha256) || item.byteLength <= 0), 'external_byte_identity')
  failure(failures, reviewedFiles.some(item => !['matches', 'historical_record_mismatch_preserved', 'new_expected_hash_match'].includes(item.predecessorHashStatus)), 'historical_hash_status')
  failure(failures, reviewedFiles.some(item => item.fileName?.includes('/') || item.fileName?.includes('\\')), 'unsafe_cache_filename')

  const observations = artifact?.observations || []
  failure(failures, observations.length !== 8, 'observation_count')
  failure(failures, observations.some(item => item.sourceId !== 'src-toyo-1646' || item.directObservationStatus !== 'visual_page_review' || item.transcriptionRole !== 'locator_only' || item.printedFolio !== null), 'observation_boundary')
  failure(failures, observations.some(item => !/^viewer image 00(02|09|10|11|12|13|19|20)$/.test(item.locator)), 'observation_locator')
  failure(failures, observations.some(item => item.semanticScope !== 'bounded_surface_only; no complete production palace mapping inferred'), 'semantic_scope')
  failure(failures, observations.some(item => !/^[0-9a-f]{64}$/.test(item.imageSha256)), 'observation_hash')

  const relations = artifact?.relations || []
  failure(failures, relations.length !== 8, 'relation_count')
  failure(failures, relations.some(item => item.sourceId !== 'src-toyo-1646' || item.relationStatus !== 'direct_observation_extends_physical_candidate_surface_not_semantic_authority' || item.promotion !== 'not_admitted_to_stable_claim_source_authority_readiness_or_activation'), 'relation_promotion')
  failure(failures, relations.some(item => !Array.isArray(item.doesNotEstablish) || item.doesNotEstablish.includes('semantic_authority_established')), 'relation_boundary')
  failure(failures, new Set(relations.map(item => item.relationId)).size !== relations.length, 'duplicate_relation_id')

  failure(failures, artifact?.impact?.predecessorCoverage?.observationCount !== 26 || artifact?.impact?.predecessorCoverage?.relationCount !== 116, 'predecessor_counts')
  failure(failures, artifact?.impact?.additiveCoverage?.observationCount !== 34 || artifact?.impact?.additiveCoverage?.relationCount !== 124, 'additive_counts')
  failure(failures, artifact?.impact?.claimsAdded !== 0 || artifact?.impact?.sourcesAdded !== 0, 'claim_or_source_promotion')
  failure(failures, !Array.isArray(artifact?.impact?.blockersClosed) || artifact.impact.blockersClosed.length !== 0, 'blocker_closed')
  failure(failures, artifact?.impact?.stableClaimCount !== 0 || artifact?.impact?.semanticAuthorityCount !== 0 || artifact?.impact?.independentWitnessesAdmitted !== 0, 'authority_or_witness_promotion')
  failure(failures, artifact?.impact?.readiness !== 'not_safe_to_start' || artifact?.impact?.grounding !== 'blocked' || artifact?.impact?.rotation06 !== 'representation_only', 'readiness_or_rotation_promotion')

  failure(failures, artifact?.preservation?.sourceImagesStoredInGit !== false || artifact?.preservation?.externalAcquisitionPerformed !== false || artifact?.preservation?.networkUsedDuringMaterialization !== false || artifact?.preservation?.timestampsUsed !== false, 'forbidden_operation_or_source_storage')
  failure(failures, artifact?.preservation?.historicalPredecessorBytesRewritten !== false, 'historical_predecessor_rewritten')
  failure(failures, !existsSync(resolve(root, '-.jpg')), 'dash_jpg_not_preserved')

  failure(failures, !same({ reviewedFiles }, { reviewedFiles: expected.externalEvidence.reviewedFiles }), 'external_files_not_reproducible')
  failure(failures, !same({ historicalHashReconciliation: artifact?.externalEvidence?.historicalHashReconciliation }, { historicalHashReconciliation: expected.externalEvidence.historicalHashReconciliation }), 'historical_hash_reconciliation')
  failure(failures, artifact?.predecessor?.lineagePath !== PREDECESSOR_LINEAGE_ARTIFACT || !/^[0-9a-f]{64}$/.test(artifact?.predecessor?.lineageByteSha256), 'predecessor_lineage_provenance')
  failure(failures, !same({ observations }, { observations: expected.observations }), 'observations_not_reproducible')
  failure(failures, !same({ relations }, { relations: expected.relations }), 'relations_not_reproducible')
  failures.push(...checkArtifactIdentity(artifact, { root, artifactId: SCHEMA, materializerPath: MATERIALIZER_PATH, materializerVersion: MATERIALIZER_VERSION, allowGenerationBaseInput: true }))
  return [...new Set(failures)]
}

export function checkArtifact(root = ROOT, completePath = resolve(root, `${ARTIFACT_DIR}/complete.json`), options = {}) {
  const failures = checkBundle({ artifact: parse(completePath) }, root, options)
  const body = readFileSync(completePath)
  const sidecar = parse(`${completePath}.integrity.json`)
  failure(failures, sidecar.path !== relative(root, completePath), 'integrity_path')
  failure(failures, sidecar.byteSha256 !== sha256(body), 'integrity_hash')
  return [...new Set(failures)]
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const completePath = resolve(process.argv[2] || `${ARTIFACT_DIR}/complete.json`)
  const errors = checkArtifact(ROOT, completePath)
  console.log(JSON.stringify({ schema: SCHEMA, status: errors.length ? 'failed' : 'ok', errors, basisHead: EXPECTED_HEAD, verdict: VERDICT }, null, 2))
  if (errors.length) process.exitCode = 1
}
