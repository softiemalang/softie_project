import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname, relative } from 'node:path'

import { canonicalIdentityJson, checkArtifactIdentity, checkHistoricalRepositoryBasis } from '../src/artifactIdentity.js'
import { ARTIFACT_DIR, EXPECTED_HEAD, MATERIALIZER_PATH, MATERIALIZER_VERSION, SCHEMA, VERDICT, buildBundle } from './materialize-ziwei-p0-claim-source-identity-frontier-v1.mjs'

export const ROOT = resolve(new URL('..', import.meta.url).pathname)

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const parse = (path) => JSON.parse(readFileSync(path, 'utf8'))
const stable = (value) => {
  const copy = structuredClone(value)
  delete copy.artifactIdentity
  delete copy.observedHead
  return copy
}
const same = (left, right) => canonicalIdentityJson(stable(left)) === canonicalIdentityJson(stable(right))

function failure(list, value) { if (value) list.push(value) }

export function checkBundle({ artifact, files }, root = ROOT) {
  const failures = []
  const historicalBasis = checkHistoricalRepositoryBasis(root, EXPECTED_HEAD, { expectedBranch: 'main' })
  failure(failures, historicalBasis.errors.length && `historical_repository_basis:${historicalBasis.errors.join(',')}`)
  const expected = buildBundle(root, { repositoryOverride: { branch: 'main', currentHead: EXPECTED_HEAD, originMainHead: EXPECTED_HEAD } })
  failure(failures, artifact?.schemaVersion !== SCHEMA && 'schema_version')
  failure(failures, artifact?.verdictToken !== VERDICT && 'verdict')
  failure(failures, artifact?.basisHead !== EXPECTED_HEAD && 'basis_head')
  failure(failures, artifact?.expectedHead !== EXPECTED_HEAD && 'expected_head')
  failure(failures, artifact?.originMainHead !== EXPECTED_HEAD && 'origin_main_head')
  failure(failures, artifact?.branch !== 'main' && 'branch')
  failure(failures, !same(artifact, expected.artifact) && 'complete_stable_content_not_reproducible')
  failure(failures, artifact?.coverage?.allRequiredFamiliesCovered !== true && 'required_family_coverage')
  failure(failures, artifact?.coverage?.claimCount !== 30 && 'claim_count')
  failure(failures, artifact?.coverage?.sourceCount !== 13 && 'source_count')
  failure(failures, artifact?.coverage?.observationCount !== 26 && 'observation_count')
  failure(failures, artifact?.coverage?.relationCount !== 116 && 'relation_count')
  failure(failures, artifact?.coverage?.blockerCount !== 11 && 'blocker_count')
  failure(failures, artifact?.coverage?.researchUnitCount !== 7 && 'research_unit_count')
  failure(failures, artifact?.researchUnits?.length !== 7 && 'research_unit_rows')
  failure(failures, artifact?.researchUnits?.some((item) => !item.unitId || !item.family || !item.claimIds?.length || item.status !== 'frontier_exhausted_unresolved' || !item.deterministicChecks?.length) && 'research_unit_incomplete')
  failure(failures, artifact?.coverage?.claimStatusDistribution?.unsupported !== 1 && 'unsupported_claim_not_preserved')
  failure(failures, artifact?.claimBoundary?.stableClaimCount !== 0 && 'stable_claim_promoted')
  failure(failures, artifact?.claimBoundary?.semanticAuthorityCount !== 0 && 'semantic_authority_promoted')
  failure(failures, artifact?.claimBoundary?.interpretationEligibleClaimCount !== 0 && 'interpretation_promoted')
  failure(failures, artifact?.claimBoundary?.productionActivationCount !== 0 && 'activation_promoted')
  failure(failures, artifact?.claimBoundary?.rotation06 !== 'representation_only' && 'rotation06_semantic_promoted')
  failure(failures, artifact?.readinessImpact?.readiness !== 'not_safe_to_start' && 'readiness_promoted')
  failure(failures, artifact?.readinessImpact?.grounding !== 'blocked' && 'grounding_promoted')
  failure(failures, artifact?.readinessImpact?.existingReadinessArtifactsModified !== false && 'existing_readiness_modified')
  failure(failures, artifact?.readinessImpact?.existingProductionArtifactsModified !== false && 'existing_production_modified')
  failure(failures, artifact?.protectedChanges?.sourcePdfOrImageStoredInGit !== false && 'source_image_stored')
  failure(failures, !Array.isArray(artifact?.protectedChanges?.preservedUntracked) || !artifact.protectedChanges.preservedUntracked.includes('-.jpg') && 'dash_jpg_not_preserved')

  const completeClaimRows = artifact?.claimSourceMatrix || []
  const claimRows = files?.['claim-source-matrix.json'] || []
  const requiredFamilies = artifact?.coverage?.requiredFamilies || []
  failure(failures, !same({ claimSourceMatrix: claimRows }, { claimSourceMatrix: expected.files['claim-source-matrix.json'] }) && 'claim_matrix_not_reproducible')
  failure(failures, !same({ claimSourceMatrix: completeClaimRows }, { claimSourceMatrix: claimRows }) && 'claim_matrix_complete_companion_mismatch')
  failure(failures, new Set(claimRows.map((item) => item.claimId)).size !== claimRows.length && 'duplicate_claim_id')
  failure(failures, claimRows.some((item) => !item.claimId || !item.family || !item.sourceIds?.length || item.status === 'stable_claim') && 'claim_row_incomplete_or_promoted')
  failure(failures, requiredFamilies.some((family) => !claimRows.some((item) => item.family === family)) && 'claim_family_missing')
  failure(failures, claimRows.some((item) => item.claimRelation === 'source_authority_established') && 'source_authority_promoted')
  failure(failures, claimRows.some((item) => item.readinessImpact !== 'readiness_remains_not_safe_to_start; no interpretation or activation promotion') && 'claim_readiness_boundary')

  const sources = files?.['source-lineage-inventory.json']?.sources || []
  failure(failures, !same({ sources }, { sources: expected.files['source-lineage-inventory.json'].sources }) && 'source_inventory_not_reproducible')
  const sourceById = new Map(sources.map((item) => [item.sourceId, item]))
  failure(failures, sourceById.get('src-nara-4468520')?.independence !== 'not_independent_same_record_volume_pair' && 'nara_v1_independence')
  failure(failures, sourceById.get('src-nara-4469314')?.independence !== 'not_independent_same_record_volume_pair' && 'nara_v2_independence')
  failure(failures, sourceById.get('src-toyo-1646')?.independence !== 'independent_physical_witness_candidate_not_admitted_as_independent_oracle' && 'toyo_candidate_boundary')
  failure(failures, sourceById.get('src-nanyangtang-pdf')?.independence !== 'not_independent_same_record_derivative_candidate' && 'nanyang_lineage_boundary')
  failure(failures, sources.some((item) => item.storedInGit === true) && 'source_stored_in_git')
  failure(failures, sources.some((item) => item.sourceKind === 'official_iiif_item' && item.lineage !== 'same_record_as_nara_4469314' && item.sourceId === 'src-nara-4468520') && 'nara_v1_lineage')

  const observations = files?.['observations.json']?.observations || []
  failure(failures, !same({ observations }, { observations: expected.files['observations.json'].observations }) && 'observations_not_reproducible')
  failure(failures, observations.some((item) => item.directObservationStatus !== 'visual_page_review' || item.transcriptionRole !== 'locator_only') && 'direct_observation_or_ocr_boundary')
  const toyo = sourceById.get('src-toyo-1646')
  failure(failures, observations.filter((item) => item.sourceId === 'src-toyo-1646').some((item) => toyo?.reviewedImageSha256?.[item.locator.replace('viewer image ', '')] !== item.imageSha256) && 'toyo_image_hash_binding')
  failure(failures, observations.some((item) => item.sourceId === 'src-nara-4468520' && item.imageSha256 && !/^[0-9a-f]{64}$/.test(item.imageSha256)) && 'nara_image_hash')

  const relations = files?.['relations.json']?.relations || []
  failure(failures, relations.length !== 116 && 'relation_rows')
  failure(failures, new Set(relations.map((item) => item.relationId)).size !== relations.length && 'duplicate_relation_id')
  failure(failures, relations.some((item) => item.promotion !== 'not_admitted_to_stable_claim_or_readiness') && 'relation_promotion')
  failure(failures, relations.some((item) => item.sourceId === 'src-nara-4468520' && item.independence === 'independent') && 'same_record_counted_independent')
  failure(failures, !same({ relations }, { relations: expected.files['relations.json'].relations }) && 'relations_not_reproducible')

  const blockers = files?.['blockers.json']?.blockers || []
  failure(failures, blockers.length !== 11 && 'blocker_rows')
  failure(failures, blockers.some((item) => !['blocked', 'needs_human_review'].includes(item.status)) && 'blocker_status')
  failure(failures, !blockers.some((item) => item.id === 'blocker-source-identity-unresolved' && item.status === 'blocked') && 'source_identity_blocker_missing')
  failure(failures, !blockers.some((item) => item.id === 'blocker-tianfu-rotation06-semantic-authority' && item.status === 'blocked') && 'rotation06_blocker_missing')
  failure(failures, !same({ blockers }, { blockers: expected.files['blockers.json'].blockers }) && 'blockers_not_reproducible')

  failure(failures, artifact?.sourceFrontier?.noRepositorySourceAcquisition !== true && 'repository_source_acquisition')
  failure(failures, artifact?.historicalContract?.preexistingArtifactsAreInputsNotRewritten !== true && 'historical_input_contract')
  failure(failures, artifact?.protectedChanges?.commitPerformed !== false || artifact?.protectedChanges?.pushPerformed !== false || artifact?.protectedChanges?.deploymentPerformed !== false || artifact?.protectedChanges?.remoteDatabaseChanged !== false ? 'forbidden_external_mutation' : '')
  failure(failures, !existsSync(resolve(root, '-.jpg')) && 'preserved_dash_jpg_missing')

  failures.push(...checkArtifactIdentity(artifact, { root, artifactId: SCHEMA, materializerPath: MATERIALIZER_PATH, materializerVersion: MATERIALIZER_VERSION, allowGenerationBaseInput: true }))
  return [...new Set(failures)]
}

export function checkArtifact(root = ROOT, completePath = resolve(root, `${ARTIFACT_DIR}/complete.json`)) {
  const directory = dirname(completePath)
  const artifact = parse(completePath)
  const files = Object.fromEntries(artifact.companionFiles.map((name) => [name, parse(resolve(directory, name))]))
  const failures = checkBundle({ artifact, files }, root)
  const paths = [completePath, ...artifact.companionFiles.map((name) => resolve(directory, name))]
  for (const path of paths) {
    const body = readFileSync(path)
    const sidecar = parse(`${path}.integrity.json`)
    const rel = relative(root, path)
    failure(failures, sidecar.path !== rel && `integrity_path:${rel}`)
    failure(failures, sidecar.byteSha256 !== sha256(body) && `integrity_hash:${rel}`)
  }
  return [...new Set(failures)]
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const errors = checkArtifact(ROOT, resolve(ROOT, process.argv[2] || `${ARTIFACT_DIR}/complete.json`))
  const result = { schema: SCHEMA, status: errors.length ? 'failed' : 'ok', errors, basisHead: EXPECTED_HEAD, verdict: VERDICT }
  console.log(JSON.stringify(result, null, 2))
  if (errors.length) process.exitCode = 1
}
