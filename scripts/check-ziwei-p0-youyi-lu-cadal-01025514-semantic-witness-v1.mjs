import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'

import {
  canonicalIdentityJson,
  checkArtifactIdentity,
  checkHistoricalRepositoryBasis,
  stableArtifactContentEqual,
} from '../src/artifactIdentity.js'
import {
  ARTIFACT_DIR,
  ARTIFACT_PATH,
  BASIS_HEAD,
  MATERIALIZER_PATH,
  MATERIALIZER_VERSION,
  PREDECESSOR_FIELD_KIT,
  PREDECESSOR_FRONTIER,
  PREDECESSOR_INSTITUTIONAL,
  PREDECESSOR_SOURCE_IDENTITY,
  PREDECESSOR_TIANFU_INTEGRATED,
  PREDECESSOR_TIANFU_REPRESENTATION,
  PREDECESSOR_TOYO,
  ROOT,
  SCHEMA,
  SOURCE_DJVU_BYTES,
  SOURCE_DJVU_PAGES,
  SOURCE_DJVU_SHA1,
  SOURCE_DJVU_SHA256,
  SOURCE_ID,
  VERDICT,
  buildBundle,
} from './materialize-ziwei-p0-youyi-lu-cadal-01025514-semantic-witness-v1.mjs'
import { SAJU_SOURCE_DERIVED_ASSET_PATH } from '../src/interpretationPrep/sajuSourceDerivedEvidenceAsset.js'

export const COMPLETE_PATH = ARTIFACT_PATH

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const parse = path => JSON.parse(readFileSync(path, 'utf8'))
const failure = (list, condition, message) => { if (condition) list.push(message) }
const unique = values => [...new Set(values)]
const OUTPUT_NAMES = ['evidence.json', 'graph-reconciliation.json', 'field-kit-impact.json']
const PREDECESSOR_PATHS = [
  PREDECESSOR_SOURCE_IDENTITY,
  PREDECESSOR_TOYO,
  PREDECESSOR_FRONTIER,
  PREDECESSOR_FIELD_KIT,
  PREDECESSOR_INSTITUTIONAL,
]
const ALL_BLOCKER_IDS = [
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
const EXPECTED_PAGE_RENDER_SHA256 = {
  130: 'a0a7a185b795225a3b206ac828cc761e046b6028939093b2139835eae9311206',
  131: '05e4d55ad718229036a636ac36da898605a48fd4f40073a8d9c2293845df517f',
  136: '4f20ac6bbf906e1ecfcc2e08e78b4f9f3e5710617eef3d49714dffd153b2b64b',
  139: '22ad4198302e8ffbbdb913ee813f5f6bbb0efb9da41591617719cb764fa9621a',
  140: '556a53e005ad6debb19fef94d939c263349e6b46678df482e91d70a536f295a6',
}
const EXPECTED_TIANFU_MAP = [
  ['子', '辰'], ['丑', '卯'], ['寅', '寅'], ['卯', '丑'],
  ['辰', '子'], ['巳', '亥'], ['午', '戌'], ['未', '酉'],
  ['申', '申'], ['酉', '未'], ['戌', '午'], ['亥', '巳'],
]
const EXPECTED_SCAN_BOUNDARY_REVIEW = {
  reviewedPages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 177, 178],
  renderWidth: 1920,
  surfaces: [
    ['1', '7f6332ae04d3569e205f51efcef52d3a659552b6aa4665ae22531eaf4b0f69f3', 'blank scan leaf; no title-page text or imprint visible'],
    ['2', '514e9b1e8dbf514f98d3eb148a6f2920d2a90b660c00524d8760e72ccdc43e77', 'printed text begins; no title-page or imprint surface visible'],
    ['177', 'c5cc4d329d0f0dd99757e246668a0b78d9ff4763859b49c259cbbb9a64253fac', 'printed text and end seal; no colophon or imprint surface visible'],
    ['178', '7f6332ae04d3569e205f51efcef52d3a659552b6aa4665ae22531eaf4b0f69f3', 'blank scan leaf; no colophon text visible'],
  ],
  titlePageObserved: false,
  colophonObserved: false,
}

function readCompanions(root, completePath) {
  const directory = dirname(completePath)
  return Object.fromEntries(OUTPUT_NAMES.map(name => [name, parse(resolve(directory, name))]))
}

function checkSidecars(root, completePath, failures) {
  const paths = [['complete.json', completePath], ...OUTPUT_NAMES.map(name => [name, resolve(dirname(completePath), name)])]
  for (const [name, path] of paths) {
    const sidecarPath = path + '.integrity.json'
    failure(failures, !existsSync(path), 'missing_output:' + name)
    failure(failures, !existsSync(sidecarPath), 'missing_sidecar:' + name)
    if (!existsSync(path) || !existsSync(sidecarPath)) continue
    const sidecar = parse(sidecarPath)
    const body = readFileSync(path)
    failure(failures, sidecar.schemaVersion !== SCHEMA + '-integrity-v0', 'integrity_schema:' + name)
    failure(failures, sidecar.path !== relative(root, path), 'integrity_path:' + name)
    failure(failures, sidecar.byteSha256 !== sha256(body), 'integrity_hash:' + name)
  }
}

function containsTimestampValue(value) {
  if (Array.isArray(value)) return value.some(containsTimestampValue)
  if (!value || typeof value !== 'object') return false
  return Object.entries(value).some(([key, child]) => {
    if ((key === 'generatedAt' || key === 'timestamp') && child !== 'forbidden') return true
    return containsTimestampValue(child)
  })
}

function checkEvidenceSurface(artifact, failures) {
  const source = artifact?.sourceLineage?.addedSource
  failure(failures, source?.sourceId !== SOURCE_ID, 'source_id')
  failure(failures, source?.sourceKind !== 'external_public_digital_scan_of_historical_printed_work', 'source_kind')
  failure(failures, source?.edition?.catalogDate !== '清光緒九年(1883)', 'edition_date')
  failure(failures, source?.edition?.identityStatus !== 'digital_resource_identity_confirmed; printed_copy_identity_and_transmission_lineage_not_fully_closed', 'edition_identity_boundary')
  failure(failures, source?.edition?.physicalCopyTitlePageReviewed !== true || source?.edition?.physicalCopyTitlePagePresent !== false || source?.edition?.colophonReviewed !== true || source?.edition?.colophonPresent !== false || source?.edition?.printedFolioBindingClosed !== false, 'printed_identity_boundary')
  const boundary = source?.scanBoundaryReview
  failure(failures, JSON.stringify(boundary?.reviewedPages) !== JSON.stringify(EXPECTED_SCAN_BOUNDARY_REVIEW.reviewedPages) || boundary?.renderWidth !== EXPECTED_SCAN_BOUNDARY_REVIEW.renderWidth || boundary?.titlePageObserved !== false || boundary?.colophonObserved !== false, 'scan_boundary_review')
  failure(failures, JSON.stringify((boundary?.surfaces || []).map(item => [String(item.scanPage), item.commonsRenderSha256, item.observation])) !== JSON.stringify(EXPECTED_SCAN_BOUNDARY_REVIEW.surfaces), 'scan_boundary_surface_hashes')
  failure(failures, source?.sourceFile?.byteLength !== SOURCE_DJVU_BYTES || source?.sourceFile?.pageCount !== SOURCE_DJVU_PAGES, 'source_file_size_or_pages')
  failure(failures, source?.sourceFile?.sha1 !== SOURCE_DJVU_SHA1 || source?.sourceFile?.sha256 !== SOURCE_DJVU_SHA256, 'source_file_hash')
  failure(failures, source?.sourceFile?.storedInGit !== false || source?.sourceFile?.acquiredOutsideMaterializer !== true || source?.sourceFile?.materializerNetworkUsed !== false, 'source_file_storage_boundary')
  failure(failures, source?.ocrPolicy?.role !== 'locator_only' || source?.ocrPolicy?.canonicalForClaims !== false || source?.ocrPolicy?.scanVisualReviewRequired !== true, 'ocr_boundary')
  failure(failures, source?.rights?.sourceImageReuse !== 'not automatically granted by catalog access or public-domain label; human/policy review remains required', 'rights_boundary')
  failure(failures, source?.independence !== 'repository/file identity is distinct from existing P0 sources, but 1883-to-1871 and cross-corpus transmission independence is unresolved', 'independence_boundary')
  failure(failures, source?.authority !== 'direct visual scan observations support bounded text surfaces; source authority and semantic authority remain unestablished', 'authority_boundary')

  const observations = artifact?.observations || []
  const expectedObservationIds = [
    'obs-youyi-cadal-01025514-source-file-identity',
    'obs-youyi-p130-ming-shen-palace-order',
    'obs-youyi-p131-branch-relations',
    'obs-youyi-p136-tianfu-diagonal-anchor',
    'obs-youyi-p139-tianfu-pair-map',
    'obs-youyi-p140-major-star-series',
  ]
  failure(failures, observations.length !== expectedObservationIds.length, 'observation_count')
  failure(failures, JSON.stringify(observations.map(item => item.observationId)) !== JSON.stringify(expectedObservationIds), 'observation_order')
  failure(failures, unique(observations.map(item => item.observationId)).length !== observations.length, 'duplicate_observation_id')
  failure(failures, observations.some(item => item.sourceIds?.length !== 1 || item.sourceIds[0] !== SOURCE_ID), 'observation_source_binding')
  failure(failures, observations.some(item => item.transcriptionRole !== 'direct_scan_visual_review; CText OCR locator only' || item.lineageStatus !== 'digital_scan_identity_bounded; historical textual lineage not observed'), 'observation_provenance_boundary')
  failure(failures, observations.some(item => !/source_authority_and_semantic_authority_not_established/.test(item.authorityStatus)), 'observation_authority_boundary')
  failure(failures, observations.some(item => item.observationId !== expectedObservationIds[0] && item.researcherDirectObservation !== true), 'direct_scan_observation_boundary')
  failure(failures, observations.some(item => item.observationId === expectedObservationIds[0] && item.researcherDirectObservation !== false), 'identity_observation_boundary')
  const pageObservations = observations.filter(item => item.locator?.scanPage)
  failure(failures, pageObservations.length !== 5, 'page_observation_count')
  for (const item of pageObservations) {
    const page = item.locator.scanPage
    failure(failures, item.locator.cadalDigitalPage !== page || item.locator.commonsDjvuPage !== page, 'page_locator_crosswalk:' + page)
    failure(failures, item.locator.printedFolio !== null || item.locator.printedFolioStatus !== 'not_asserted; scan folio was not used as an invented locator', 'printed_folio_invention:' + page)
    failure(failures, item.locator.ctextLocator?.role !== 'locator_only' || item.locator.ctextLocator?.canonicalText !== false, 'ctext_role:' + page)
    failure(failures, item.locator.reviewedRenderSha256 !== EXPECTED_PAGE_RENDER_SHA256[page], 'render_hash:' + page)
    failure(failures, !item.rawVisibleText || !item.normalizedTranscription, 'missing_scan_transcription:' + page)
  }
  const page139 = observations.find(item => item.observationId === 'obs-youyi-p139-tianfu-pair-map')
  const map = (page139?.sourceSurfaceMap || []).map(row => [row.ziwei, row.tianfu])
  failure(failures, JSON.stringify(map) !== JSON.stringify(EXPECTED_TIANFU_MAP), 'youyi_tianfu_map')
  failure(failures, page139?.deterministicRelation?.sourceAlignedFormulaMatchesAllRecordedRows !== true || page139?.deterministicRelation?.legacyFormulaMatchCount !== 0, 'tianfu_numeric_comparison_boundary')
  const page140 = observations.find(item => item.observationId === 'obs-youyi-p140-major-star-series')
  failure(failures, page140?.deterministicRelation?.currentRuleSurfaceMatchesWorkedExample !== true, 'star_series_comparison_boundary')
  const page130 = observations.find(item => item.observationId === 'obs-youyi-p130-ming-shen-palace-order')
  failure(failures, page130?.deterministicRelation?.relationClass !== 'same-source-derived_evaluator_matches_bounded_scan_example; not an independent oracle', 'ming_shen_comparison_boundary')
}

function checkClaimBoundary(artifact, failures) {
  const claims = artifact?.claimReconciliation || []
  failure(failures, claims.length !== 30 || unique(claims.map(item => item.claimId)).length !== 30, 'claim_count')
  failure(failures, claims.some(item => item.predecessorStatus !== item.successorStatus || item.statusChanged !== false || item.sourceRelationPromotion !== 'none'), 'claim_status_promotion')
  failure(failures, claims.some(item => !Array.isArray(item.sourceIdsAdded) || item.sourceIdsAdded.some(id => id !== SOURCE_ID)), 'claim_source_binding')
  failure(failures, claims.some(item => item.directObservationStatus.includes('semantic authority established') || item.authorityStatus !== 'unchanged; source_authority_and_semantic_authority_not_established'), 'claim_authority_promotion')
  failure(failures, artifact?.claimImpact?.claimsAdded !== 0 || artifact?.claimImpact?.claimsPromoted !== 0 || artifact?.claimImpact?.claimStatusChanges?.length !== 0, 'claim_impact_promotion')
  failure(failures, artifact?.claimImpact?.directSemanticClaimSupportAdded?.length !== 0 || artifact?.claimImpact?.stableClaimCount !== 0 || artifact?.claimImpact?.semanticAuthorityCount !== 0, 'semantic_claim_promotion')
  failure(failures, artifact?.claimImpact?.boundedDirectObservationClaimSupportAdded?.length !== 8, 'bounded_claim_support_count')
  failure(failures, artifact?.claimImpact?.claimSourceMatrixUpdated !== false || artifact?.claimImpact?.unsupportedClaimPreserved !== true, 'claim_matrix_boundary')
}

function checkRelationsAndBlockers(artifact, failures) {
  const observations = artifact?.observations || []
  const observationIds = new Set(observations.map(item => item.observationId))
  const claims = artifact?.claimReconciliation || []
  const claimIds = new Set(claims.map(item => item.claimId))
  const relations = artifact?.relations || []
  const expectedRelations = [
    'relation-youyi-cadal-01025514-source-identity-boundary',
    'relation-youyi-p130-palace-reverse-layout',
    'relation-youyi-p131-branch-opposition-and-triples',
    'relation-youyi-p136-tianfu-diagonal-anchor',
    'relation-youyi-p139-tianfu-pair-map',
    'relation-youyi-p140-major-star-series-direction',
  ]
  failure(failures, relations.length !== expectedRelations.length, 'relation_count')
  failure(failures, JSON.stringify(relations.map(item => item.relationId)) !== JSON.stringify(expectedRelations), 'relation_order')
  failure(failures, unique(relations.map(item => item.relationId)).length !== relations.length, 'duplicate_relation_id')
  failure(failures, relations.some(item => item.sourceIds?.some(id => id !== SOURCE_ID) || !item.promotion.includes('not_admitted')), 'relation_promotion')
  failure(failures, relations.some(item => item.observationIds?.some(id => !observationIds.has(id)) || item.claimIds?.some(id => !claimIds.has(id))), 'relation_reference')
  failure(failures, relations.some(item => /semantic_authority_established|source_authority_established|independent_witness_admitted|stable_claim/.test(JSON.stringify(item))), 'relation_authority_shortcut')
  failure(failures, relations.some(item => JSON.stringify(item.claimIds) !== JSON.stringify(item.affectedClaimIds)), 'relation_affected_claim_mismatch')

  const blockers = artifact?.blockerReassessment || []
  failure(failures, blockers.length !== ALL_BLOCKER_IDS.length || blockers.some((item, index) => item.id !== ALL_BLOCKER_IDS[index]), 'blocker_order_or_count')
  failure(failures, blockers.some(item => item.statusBefore !== item.statusAfter || item.statusChanged !== false), 'blocker_status_promotion')
  failure(failures, artifact?.graphImpact?.blockersClosed?.length !== 0 || artifact?.blockerImpact?.blockersClosed?.length !== 0, 'blocker_closure')
  failure(failures, artifact?.blockerImpact?.resolvedSubBoundaryIsNotTopLevelClosure !== true, 'subboundary_closure_label')
  failure(failures, blockers.some(item => item.newObservationIds?.some(id => !observationIds.has(id)) || item.newRelationIds?.some(id => !relations.some(relation => relation.relationId === id))), 'blocker_reference')
  failure(failures, blockers.find(item => item.id === 'blocker-source-identity-unresolved')?.statusAfter !== 'blocked', 'source_blocker_boundary')
  failure(failures, blockers.find(item => item.id === 'blocker-image-reuse-rights')?.statusAfter !== 'needs_human_review', 'rights_blocker_boundary')
}

function checkComparison(artifact, failures) {
  const comparison = artifact?.localComparison
  failure(failures, comparison?.palace?.exampleResult?.mingGong?.branch !== '亥' || comparison?.palace?.exampleResult?.shenGong?.branch !== '未', 'palace_example')
  failure(failures, comparison?.palace?.relationClass !== 'deterministic calculation fact; not an independent source oracle', 'palace_comparison_boundary')
  failure(failures, comparison?.tianfu?.sourceAlignedMapMatchCount !== 12 || comparison?.tianfu?.legacyProductionMapMatchCount !== 0, 'tianfu_map_counts')
  failure(failures, comparison?.tianfu?.existingRepresentationSurfaceMapMatches !== true, 'existing_source_surface_comparison')
  failure(failures, comparison?.tianfu?.existingIntegratedIdentity?.matchCount !== 0 || comparison?.tianfu?.existingIntegratedIdentity?.mismatchCount !== 150, 'identity_relation')
  failure(failures, comparison?.tianfu?.existingIntegratedRotation06?.matchCount !== 150 || comparison?.tianfu?.existingIntegratedRotation06?.mismatchCount !== 0, 'rotation_relation')
  failure(failures, comparison?.tianfu?.semanticIdentityStatus !== 'blocked; rotation-06 remains representation_only', 'rotation_semantic_boundary')
  const references = comparison?.tianfu?.referenceSurfaces
  failure(failures, references?.mingMingEditionAnTianfuDiagram?.sourceId !== 'ming' || references?.mingMingEditionAnTianfuDiagram?.sourceSha256 !== '04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc' || references?.mingMingEditionAnTianfuDiagram?.locator !== 'PDF page 172 / 安天府圖' || references?.mingMingEditionAnTianfuDiagram?.fullTwelveRowMapComparable !== false || references?.mingMingEditionAnTianfuDiagram?.semanticAuthority !== false || references?.mingMingEditionAnTianfuDiagram?.youyiExplicitAnchorMatches !== true || references?.mingMingEditionAnTianfuDiagram?.youyiSamePalaceAnchorsMatch !== true, 'ming_tianfu_reference_boundary')
  failure(failures, references?.nanbeiAnTianfuTable?.sourceId !== 'nanbei' || references?.nanbeiAnTianfuTable?.sourceSha256 !== '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023' || references?.nanbeiAnTianfuTable?.sourceRowCount !== 12 || references?.nanbeiAnTianfuTable?.youyiMapMatchCount !== 12 || references?.nanbeiAnTianfuTable?.fullMapMatchesYouyi !== true || references?.nanbeiAnTianfuTable?.semanticAuthority !== false, 'nanbei_tianfu_reference_boundary')
  failure(failures, references?.productionLegacy?.youyiMapMatchCount !== 0 || references?.productionLegacy?.productionModified !== false || references?.rotation06?.testedRows !== 150 || references?.rotation06?.matchCount !== 150 || references?.rotation06?.mismatchCount !== 0 || references?.rotation06?.status !== 'representation_only' || references?.rotation06?.semanticAuthority !== false, 'production_rotation_reference_boundary')
  failure(failures, comparison?.starSeries?.workedExampleSurfaceMatchesCurrentOffsets !== true || comparison?.starSeries?.relationClass !== 'direct worked-example and code-surface agreement; no rule-source promotion', 'star_series_boundary')
}

function checkBundle({ artifact, files }, root = ROOT, completePath = resolve(root, ARTIFACT_PATH)) {
  const failures = []
  let expected
  try {
    expected = buildBundle(root, { mode: 'historical_reference' })
  } catch (error) {
    return ['rebuild_failed:' + error.message]
  }

  const historical = checkHistoricalRepositoryBasis(root, BASIS_HEAD, { expectedBranch: 'main' })
  failure(failures, historical.errors.length > 0, 'historical_repository_basis:' + historical.errors.join(','))
  failure(failures, artifact?.schemaVersion !== SCHEMA, 'schema_version')
  failure(failures, artifact?.verdictToken !== VERDICT, 'verdict')
  failure(failures, artifact?.basisHead !== BASIS_HEAD, 'basis_head')
  failure(failures, artifact?.branch !== 'main', 'branch')
  failure(failures, !stableArtifactContentEqual(artifact, expected.artifact), 'stable_content_not_reproducible')

  failures.push(...checkArtifactIdentity(artifact, {
    root,
    artifactId: SCHEMA,
    materializerPath: MATERIALIZER_PATH,
    materializerVersion: MATERIALIZER_VERSION,
    allowGenerationBaseInput: true,
    allowVerifierInputDrift: true,
  }).map(error => 'artifact_identity:' + error))

  const predecessorChain = artifact?.predecessorChain || []
  failure(failures, predecessorChain.length !== PREDECESSOR_PATHS.length, 'predecessor_chain_count')
  for (const path of PREDECESSOR_PATHS) {
    const row = predecessorChain.find(item => item.path === path)
    failure(failures, !row || row.byteSha256 !== sha256(readFileSync(resolve(root, path))), 'predecessor_byte_identity:' + path)
  }

  checkEvidenceSurface(artifact, failures)
  checkClaimBoundary(artifact, failures)
  checkRelationsAndBlockers(artifact, failures)
  checkComparison(artifact, failures)

  const graph = artifact?.graphImpact
  failure(failures, graph?.predecessor?.claimCount !== 30 || graph?.predecessor?.sourceCount !== 14 || graph?.predecessor?.observationCount !== 44 || graph?.predecessor?.relationCount !== 134 || graph?.predecessor?.blockerCount !== 11, 'predecessor_graph_counts')
  failure(failures, graph?.additive?.claimCount !== 0 || graph?.additive?.sourceCount !== 1 || graph?.additive?.physicalWitnessCount !== 1 || graph?.additive?.observationCount !== 6 || graph?.additive?.relationCount !== 6 || graph?.additive?.blockerCount !== 0, 'additive_graph_counts')
  failure(failures, graph?.successor?.claimCount !== 30 || graph?.successor?.sourceCount !== 15 || graph?.successor?.observationCount !== 50 || graph?.successor?.relationCount !== 140 || graph?.successor?.blockerCount !== 11, 'successor_graph_counts')
  failure(failures, graph?.physicalWitnessesAdded?.length !== 1 || graph?.physicalWitnessesAdded?.[0] !== SOURCE_ID || graph?.independentPhysicalWitnessesAdmitted !== 0, 'witness_graph_boundary')
  failure(failures, graph?.blockersStillOpen?.length !== 11, 'open_blocker_count')
  failure(failures, artifact?.sourceLineage?.physicalWitnessCountBefore !== 1 || artifact?.sourceLineage?.physicalWitnessCountAfter !== 2 || artifact?.sourceLineage?.independentPhysicalWitnessesAdmitted !== 0, 'source_witness_counts')

  const fieldTargets = artifact?.fieldKitImpact?.targetReassessment || []
  failure(failures, fieldTargets.length !== 10 || unique(fieldTargets.map(item => item.targetId)).length !== 10, 'field_target_count')
  failure(failures, fieldTargets.some(item => item.statusBefore !== item.statusAfter || item.statusChanged !== false || item.closure !== 'not_closed'), 'field_target_promotion')
  failure(failures, artifact?.fieldKitImpact?.existingFieldKitBytesRewritten !== false || artifact?.fieldKitImpact?.semanticTargetStillOpen !== true || artifact?.fieldKitImpact?.sourceIdentityTargetStillActionRequired !== true || artifact?.fieldKitImpact?.rightsTargetStillHumanPolicyReview !== true, 'field_kit_boundary')

  const readiness = artifact?.readinessImpact
  failure(failures, readiness?.readiness !== 'not_safe_to_start' || readiness?.grounding !== 'blocked' || readiness?.activation !== 'experimental_only' || readiness?.rotation06 !== 'representation_only', 'readiness_boundary')
  failure(failures, readiness?.sourceAuthorityPromoted !== false || readiness?.semanticAuthorityPromoted !== false || readiness?.independentWitnessesAdmitted !== 0, 'readiness_authority_boundary')
  const scope = artifact?.scope
  for (const [field, value] of Object.entries({
    externalScanAcquiredOutsideRepository: true,
    materializerNetworkUsed: false,
    sourceAuthorityPromoted: false,
    semanticAuthorityPromoted: false,
    independentWitnessesAdmitted: 0,
    productionChanged: false,
    readinessChanged: false,
    groundingChanged: false,
    activationChanged: false,
    remoteDatabaseChanged: false,
    deployPerformed: false,
    commitPerformed: false,
    pushPerformed: false,
  })) failure(failures, scope?.[field] !== value, 'scope_boundary:' + field)

  const preservation = artifact?.preservation
  failure(failures, preservation?.predecessorArtifactsRewritten !== false || preservation?.historicalPredecessorBytesRewritten !== false || preservation?.existingFieldKitRewritten !== false, 'predecessor_mutation')
  failure(failures, preservation?.sourceDjvuStoredInGit !== false || preservation?.sourcePageRendersStoredInGit !== false || preservation?.sourceImagesStoredInGit !== false || preservation?.sourcePdfsStoredInGit !== false, 'source_storage_mutation')
  failure(failures, preservation?.protectedUntrackedDashJpgPreserved !== true || preservation?.protectedAsset?.canonicalPath !== SAJU_SOURCE_DERIVED_ASSET_PATH || preservation?.protectedAsset?.byteSha256 !== sha256(readFileSync(resolve(root, SAJU_SOURCE_DERIVED_ASSET_PATH))), 'protected_asset_boundary')
  failure(failures, preservation?.commitPerformed !== false || preservation?.pushPerformed !== false || preservation?.deploymentPerformed !== false || preservation?.remoteDatabaseChanged !== false, 'external_mutation_boundary')
  failure(failures, artifact?.deterministicContract?.generatedAt !== 'forbidden' || artifact?.deterministicContract?.network !== 'forbidden_during_materialization' || artifact?.deterministicContract?.ocr !== 'locator_only; never canonical claim text', 'deterministic_contract')
  failure(failures, containsTimestampValue(artifact), 'generated_timestamp')

  for (const name of OUTPUT_NAMES) failure(failures, canonicalIdentityJson(files?.[name]) !== canonicalIdentityJson(expected.files[name]), 'companion_content:' + name)
  checkSidecars(root, completePath, failures)
  return [...new Set(failures)]
}

export function checkArtifact(root = ROOT, completePath = resolve(root, ARTIFACT_PATH)) {
  const artifact = parse(completePath)
  const files = readCompanions(root, completePath)
  return checkBundle({ artifact, files }, root, completePath)
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const completePath = resolve(process.argv[2] || ARTIFACT_PATH)
  const errors = checkArtifact(ROOT, completePath)
  console.log(JSON.stringify({
    schema: SCHEMA,
    status: errors.length ? 'failed' : 'ok',
    errors,
    basisHead: BASIS_HEAD,
    verdict: VERDICT,
  }, null, 2))
  if (errors.length) process.exitCode = 1
}
