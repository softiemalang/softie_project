import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'

import {
  canonicalStableArtifactJson,
  checkArtifactIdentity,
  checkHistoricalRepositoryBasis,
} from '../src/artifactIdentity.js'
import {
  ARTIFACT_PATH,
  BASIS_HEAD,
  CANDIDATE_NLC_1607,
  CHECKER_PATH,
  DOCUMENTATION_PATH,
  INPUT_PATHS,
  MATERIALIZER_PATH,
  MATERIALIZER_VERSION,
  NLC_CATALOG_HTML_BYTES,
  NLC_CATALOG_HTML_SHA256,
  NLC_DERIVATIVE_VOLUMES,
  NLC_OFFICIAL_CONTENT_RANGE_TOTAL_BY_BID,
  NLC_OFFICIAL_PDFINFO_PAGES_BY_BID,
  NLC_OFFICIAL_PDF_SHA256_BY_BID,
  NLC_RENDERED_DIMENSIONS_BY_PAGE,
  NLC_RENDERED_SHA256_BY_PAGE,
  NEGATIVE_CHECKER_PATH,
  OBSERVATION_NLC_1607,
  PREDECESSOR_COMPOSITION,
  PREDECESSOR_COMPOSITION_EVIDENCE,
  PROTECTED_ASSET_PATH,
  ROOT,
  SCHEMA,
  SOURCE_ID_NLC_1607,
  buildBundle,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v13.mjs'

const OUTPUT_NAMES = ['evidence.json', 'binding-matrix.json', 'lineage-assessment.json', 'graph-reconciliation.json', 'field-kit-impact.json']
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const parse = path => JSON.parse(readFileSync(path, 'utf8'))
const failure = (failures, condition, message) => { if (condition) failures.push(message) }
const unique = values => [...new Set(values)]

function companions(completePath) {
  const directory = dirname(completePath)
  return Object.fromEntries(OUTPUT_NAMES.map(name => [name, parse(resolve(directory, name))]))
}

function containsGeneratedTimestamp(value) {
  if (Array.isArray(value)) return value.some(containsGeneratedTimestamp)
  if (!value || typeof value !== 'object') return false
  return Object.entries(value).some(([key, child]) => {
    if ((key === 'generatedAt' || key === 'timestamp') && child !== 'forbidden') return true
    return containsGeneratedTimestamp(child)
  })
}

function checkSidecars(root, completePath, failures) {
  const paths = [['complete.json', completePath], ...OUTPUT_NAMES.map(name => [name, resolve(dirname(completePath), name)])]
  for (const [name, path] of paths) {
    failure(failures, !existsSync(path), 'missing_output:' + name)
    const sidecarPath = path + '.integrity.json'
    failure(failures, !existsSync(sidecarPath), 'missing_sidecar:' + name)
    if (!existsSync(path) || !existsSync(sidecarPath)) continue
    let sidecar
    try { sidecar = parse(sidecarPath) } catch (error) { failures.push('parse_sidecar:' + name + ':' + error.message); continue }
    failure(failures, sidecar.schemaVersion !== SCHEMA + '-integrity-v0', 'integrity_schema:' + name)
    failure(failures, sidecar.path !== relative(root, path), 'integrity_path:' + name)
    failure(failures, sidecar.byteSha256 !== sha256(readFileSync(path)), 'integrity_hash:' + name)
  }
}

function checkPredecessors(root, artifact, failures) {
  const paths = artifact.predecessorChain?.map(item => item.path) || []
  failure(failures, paths.at(-2) !== PREDECESSOR_COMPOSITION || paths.at(-1) !== PREDECESSOR_COMPOSITION_EVIDENCE, 'predecessor_chain_tail')
  for (const row of artifact.predecessorChain || []) {
    const path = resolve(root, row.path)
    failure(failures, !existsSync(path), 'missing_predecessor:' + row.path)
    if (existsSync(path)) failure(failures, row.byteSha256 !== sha256(readFileSync(path)), 'predecessor_byte_identity:' + row.path)
  }
  for (const path of INPUT_PATHS) failure(failures, !existsSync(resolve(root, path)), 'missing_input:' + path)
  const protectedAsset = resolve(root, PROTECTED_ASSET_PATH)
  failure(failures, artifact.preservation?.protectedAsset?.canonicalPath !== PROTECTED_ASSET_PATH, 'protected_asset_path')
  if (existsSync(protectedAsset)) failure(failures, artifact.preservation?.protectedAsset?.byteSha256 !== sha256(readFileSync(protectedAsset)), 'protected_asset_hash')
}

function checkCandidate(candidate, failures) {
  failure(failures, !candidate || candidate.candidateId !== CANDIDATE_NLC_1607, 'nlc_candidate_identity')
  failure(failures, candidate?.doesNotEnterGraph !== true || candidate.directVisualReview !== true, 'nlc_candidate_admission')
  failure(failures, candidate?.sourceIdentity?.institutionalRecordStatus !== 'verified_direct_catalog_html' || candidate.sourceIdentity.volumeChapterMappingStatus !== 'verified_direct_formatCatalog_response', 'nlc_record_verification')
  failure(failures, candidate?.sourceIdentity?.sourceAuthority !== 'not_established' || candidate.sourceIdentity.semanticAuthority !== 'not_established', 'nlc_authority_promotion')
  failure(failures, candidate?.lineage?.institutionalRecordVerified !== true || candidate.lineage.targetSectionPresent !== true || candidate.lineage.officialPdfBytesAcquired !== true || candidate.lineage.officialStreamIdentityVerified !== true || candidate.lineage.derivativeToOfficialByteEqualityEstablished !== true || candidate.lineage.independentPhysicalWitness !== false, 'nlc_lineage_boundary')
  failure(failures, candidate?.bindingMatrix?.fullBinding !== false || candidate.bindingMatrix.productionOrdinal !== false || candidate.bindingMatrix.semanticAuthority !== false, 'nlc_binding_promotion')
  failure(failures, candidate?.locators?.catalogHtml?.sha256 !== NLC_CATALOG_HTML_SHA256 || candidate.locators.catalogHtml.bytes !== NLC_CATALOG_HTML_BYTES, 'nlc_catalog_identity')
  failure(failures, candidate?.locators?.volumes?.length !== NLC_DERIVATIVE_VOLUMES.length, 'nlc_volume_count')
  for (const volume of NLC_DERIVATIVE_VOLUMES) {
    const stored = candidate?.locators?.volumes?.find(item => item.bid === volume.bid)
    failure(failures, !stored || stored.volume !== volume.volume || stored.chapterNumber !== volume.chapterNumber || stored.sourcePdfSha256 !== volume.sourcePdfSha256 || stored.sourcePdfBytes !== volume.sourcePdfBytes || stored.pdfPages !== volume.pdfPages, 'nlc_volume_identity:' + volume.bid)
  }
  failure(failures, candidate?.locators?.officialViewerPdfBytes?.accessStatus !== 'acquired_direct_official_range_stream' || candidate.locators.officialViewerPdfBytes.derivativeToOfficialByteEquality !== 'verified_exact_byte_compare' || candidate.locators.officialViewerPdfBytes.pdfHeader !== '%PDF', 'nlc_official_stream_boundary')
  failure(failures, canonicalStableArtifactJson(candidate?.locators?.officialViewerPdfBytes?.contentRangeTotalByBid) !== canonicalStableArtifactJson(NLC_OFFICIAL_CONTENT_RANGE_TOTAL_BY_BID) || canonicalStableArtifactJson(candidate.locators.officialViewerPdfBytes.pdfSha256ByBid) !== canonicalStableArtifactJson(NLC_OFFICIAL_PDF_SHA256_BY_BID) || canonicalStableArtifactJson(candidate.locators.officialViewerPdfBytes.pdfinfoPagesByBid) !== canonicalStableArtifactJson(NLC_OFFICIAL_PDFINFO_PAGES_BY_BID), 'nlc_official_stream_identity')
  failure(failures, candidate.locators.officialViewerPdfBytes.derivativeToOfficialByteEqualityByBid?.['139580'] !== true || candidate.locators.officialViewerPdfBytes.derivativeToOfficialByteEqualityByBid?.['139581'] !== true || candidate.locators.officialViewerPdfBytes.derivativeToOfficialByteEqualityByBid?.['139582'] !== true, 'nlc_derivative_equality')
  failure(failures, candidate?.locators?.renderedFileSha256ByPage?.vol1?.[25] !== NLC_RENDERED_SHA256_BY_PAGE.vol1[25] || candidate.locators.renderedDimensionsByPage?.vol2?.[2] !== NLC_RENDERED_DIMENSIONS_BY_PAGE.vol2[2], 'nlc_render_identity')
}

function checkFrontier(artifact, failures) {
  const frontier = artifact.lineageAssessment?.researchFrontier
  const candidates = frontier?.candidates || []
  failure(failures, candidates.length !== 17, 'frontier_candidate_count')
  const candidate = candidates.find(item => item.candidateId === CANDIDATE_NLC_1607)
  checkCandidate(candidate, failures)
  const observationIds = frontier?.frontierOnlyObservations?.map(item => item.observationId) || []
  failure(failures, !observationIds.includes(OBSERVATION_NLC_1607), 'frontier_observation')
  failure(failures, frontier?.frontierOnlySources?.includes(CANDIDATE_NLC_1607) !== true, 'frontier_only_source')
  failure(failures, frontier?.graphImpact?.sourcesAdded?.length !== 0 || frontier.graphImpact.observationsAdded?.length !== 0 || frontier.graphImpact.relationsAdded?.length !== 0 || frontier.graphImpact.blockersClosed?.length !== 0, 'frontier_graph_admission')
}

function checkEvidence(artifact, evidence, failures) {
  failure(failures, evidence?.schemaVersion !== SCHEMA + '-evidence-v0', 'evidence_schema')
  failure(failures, evidence?.observations?.length !== artifact.observations?.length, 'evidence_observation_copy')
  failure(failures, evidence?.heldOutDirectScanReview?.candidateIds?.length !== 7 || evidence.heldOutDirectScanReview.fullBindingCount !== 0 || evidence.heldOutDirectScanReview.graphAdmission !== 'none', 'evidence_held_out_review')
  failure(failures, evidence?.v13Nlc1607Review?.candidateIds?.length !== 1 || evidence.v13Nlc1607Review.graphAdmission !== false || evidence.v13Nlc1607Review.officialPdfBytesAcquired !== true || evidence.v13Nlc1607Review.officialStreamIdentityVerified !== true || evidence.v13Nlc1607Review.derivativeToOfficialByteEqualityEstablished !== true, 'evidence_v13_review')
  failure(failures, evidence?.reportedNonObservations?.some(item => item.includes('official stream is not counted as a second independent physical witness')) !== true, 'evidence_official_boundary')
}

function checkMatrix(artifact, matrix, failures) {
  failure(failures, matrix?.schemaVersion !== SCHEMA + '-binding-matrix-v0', 'matrix_schema')
  failure(failures, matrix?.composition?.status !== 'derived_not_authoritative', 'matrix_authority')
  failure(failures, matrix?.coverage?.directSingleWitnessFullBindingCount !== 0 || matrix.coverage.productionOrdinalBindingCount !== 0 || matrix.coverage.semanticAuthorityCount !== 0, 'matrix_promotion')
  failure(failures, matrix?.researchFrontierBoundary?.reviewedCandidateCount !== 17 || matrix.researchFrontierBoundary.heldOutDirectScanCandidateCount !== 7 || matrix.researchFrontierBoundary.admittedCandidateCount !== 0 || matrix.researchFrontierBoundary.partialBranchGridReviewCount < 1, 'matrix_frontier_boundary')
  failure(failures, matrix?.frontierOnlyBindingRows?.length !== 8 || matrix.frontierOnlyBindingRows.some(row => row.candidateId === CANDIDATE_NLC_1607 && (row.fullBinding !== false || row.semanticAuthority !== false)), 'matrix_frontier_rows')
}

function checkLineage(artifact, lineage, failures) {
  failure(failures, lineage?.schemaVersion !== SCHEMA + '-lineage-v0', 'lineage_schema')
  failure(failures, lineage?.status !== 'derived_not_authoritative' || lineage.independentWitnessStatus !== 'not_admitted', 'lineage_authority')
  failure(failures, lineage?.frontierLineageAssessments?.length !== 8 || lineage.frontierLineageAssessments.some(item => item.candidateId === CANDIDATE_NLC_1607 && (item.independentPhysicalWitness !== false || item.graphAdmission !== false)), 'lineage_frontier_boundary')
  failure(failures, lineage?.frontierCandidateReview?.candidateIds?.length !== 7 || lineage.frontierCandidateReview.targetSectionPresentCount !== 2 || lineage.frontierCandidateReview.independentWitnessCount !== 0, 'lineage_candidate_review')
  failure(failures, lineage?.physicalWitnessCandidatesAdded?.includes(SOURCE_ID_NLC_1607) !== true || lineage.physicalWitnessCandidatesAdded.length !== artifact.sourceLineage?.physicalWitnessCandidatesAdded?.length, 'lineage_candidate_boundary')
  failure(failures, lineage?.earlierEdition1871?.v13DirectCandidateReview?.nlcOfficialPdfBytesAcquired !== true || lineage.earlierEdition1871.v13DirectCandidateReview.derivativeToOfficialByteEqualityEstablished !== true, 'lineage_1871_boundary')
}

function checkGraph(artifact, graph, failures) {
  failure(failures, graph?.predecessor?.claimCount !== 30 || graph.predecessor.sourceCount !== 21 || graph.predecessor.observationCount !== 58 || graph.predecessor.relationCount !== 148 || graph.predecessor.blockerCount !== 11, 'predecessor_graph_counts')
  failure(failures, graph?.additive?.claimCount !== 0 || graph.additive.sourceCount !== 0 || graph.additive.physicalWitnessCount !== 0 || graph.additive.observationCount !== 0 || graph.additive.relationCount !== 0 || graph.additive.blockerCount !== 0, 'additive_graph_counts')
  failure(failures, graph?.successor?.claimCount !== 30 || graph.successor.sourceCount !== 21 || graph.successor.observationCount !== 58 || graph.successor.relationCount !== 148 || graph.successor.blockerCount !== 11, 'successor_graph_counts')
  failure(failures, JSON.stringify(graph?.blockersClosed) !== JSON.stringify([]) || graph.independentPhysicalWitnessesAdmitted !== 0, 'graph_blocker_or_witness_promotion')
  failure(failures, graph?.addedObservationIds?.length !== 0 || graph.addedRelationIds?.length !== 0 || graph.sourcesAdded?.length !== 0 || graph.physicalWitnessesAdded?.length !== 0, 'graph_added_ids')
  failure(failures, graph?.researchFrontier?.sourcesAdded?.length !== 0 || graph.researchFrontier.observationsAdded?.length !== 0 || graph.researchFrontier.relationsAdded?.length !== 0, 'graph_frontier_added_ids')
}

function checkScopeAndReadiness(artifact, failures) {
  failure(failures, artifact.basisHead !== BASIS_HEAD || artifact.branch !== 'main', 'basis_or_branch')
  failure(failures, artifact.scope?.historical1871ScanObtained !== false || artifact.scope.directSingleWitnessFullBindingEstablished !== false, 'scope_binding_promotion')
  failure(failures, artifact.scope?.physicalWitnessCandidatesAdded !== 5 || artifact.scope.sourceAuthorityPromoted !== false || artifact.scope.semanticAuthorityPromoted !== false || artifact.scope.independentWitnessesAdmitted !== 0, 'scope_authority_promotion')
  failure(failures, artifact.scope?.researchCandidatesAdmitted !== 1 || artifact.scope?.heldOutResearchCandidateCount !== 16 || artifact.scope.sameRecordFollowupReviewPerformed !== true || artifact.scope.heldOutDirectScanCandidateCount !== 7, 'scope_frontier_boundary')
  failure(failures, artifact.readinessImpact?.readiness !== 'not_safe_to_start' || artifact.readinessImpact.grounding !== 'blocked' || artifact.readinessImpact.activation !== 'experimental_only' || artifact.readinessImpact.rotation06 !== 'representation_only', 'readiness_boundary')
  failure(failures, artifact.preservation?.predecessorArtifactsRewritten !== false || artifact.preservation.historicalPredecessorBytesRewritten !== false || artifact.preservation.existingFieldKitRewritten !== false || artifact.preservation.productionChanged !== false || artifact.preservation.remoteDatabaseChanged !== false || artifact.preservation.deploymentPerformed !== false || artifact.preservation.commitPerformed !== false || artifact.preservation.pushPerformed !== false, 'preservation_boundary')
  failure(failures, artifact.deterministicContract?.generatedAt !== 'forbidden' || artifact.deterministicContract.network !== 'forbidden_during_materialization' || artifact.deterministicContract.noAutomaticPromotion !== true, 'deterministic_contract')
  failure(failures, artifact.materializer !== MATERIALIZER_PATH || artifact.checker !== CHECKER_PATH || artifact.negativeChecker !== NEGATIVE_CHECKER_PATH, 'tool_paths')
}

export function checkBundle(artifact, root = ROOT, completePath = resolve(root, ARTIFACT_PATH)) {
  const failures = []
  let expected
  try { expected = buildBundle(root, { mode: 'historical_reference' }).artifact } catch (error) { return ['rebuild_failed:' + error.message] }
  const historical = checkHistoricalRepositoryBasis(root, BASIS_HEAD, { expectedBranch: 'main' })
  failure(failures, historical.errors.length > 0, 'historical_repository_basis:' + historical.errors.join(','))
  failure(failures, artifact?.schemaVersion !== SCHEMA || artifact?.verdictToken !== 'complete_ziwei_palace_branch_slot_composition_with_nlc_1607_institutional_record_and_derivative_scan_frontier_derived_not_authoritative', 'schema_or_verdict')
  failure(failures, canonicalStableArtifactJson(artifact) !== canonicalStableArtifactJson(expected), 'stable_content_not_reproducible')
  failure(failures, containsGeneratedTimestamp(artifact), 'artifact_timestamp')
  failures.push(...checkArtifactIdentity(artifact, { root, artifactId: SCHEMA, materializerPath: MATERIALIZER_PATH, materializerVersion: MATERIALIZER_VERSION, allowGenerationBaseInput: true, allowVerifierInputDrift: true }).map(error => 'artifact_identity:' + error))
  checkPredecessors(root, artifact, failures)
  checkFrontier(artifact, failures)
  const side = companions(completePath)
  checkEvidence(artifact, side['evidence.json'], failures)
  checkMatrix(artifact, side['binding-matrix.json'], failures)
  checkLineage(artifact, side['lineage-assessment.json'], failures)
  checkGraph(artifact, side['graph-reconciliation.json'].graphImpact, failures)
  checkScopeAndReadiness(artifact, failures)
  failure(failures, canonicalStableArtifactJson(artifact.evidence) !== canonicalStableArtifactJson(side['evidence.json']), 'evidence_copy')
  failure(failures, canonicalStableArtifactJson(artifact.bindingMatrix) !== canonicalStableArtifactJson(side['binding-matrix.json']), 'matrix_copy')
  failure(failures, canonicalStableArtifactJson(artifact.lineageAssessment) !== canonicalStableArtifactJson(side['lineage-assessment.json']), 'lineage_copy')
  const fieldKitSidecar = { ...side['field-kit-impact.json'] }
  delete fieldKitSidecar.closureBoundary
  failure(failures, canonicalStableArtifactJson(artifact.fieldKitImpact) !== canonicalStableArtifactJson(fieldKitSidecar), 'field_kit_copy')
  return unique(failures)
}

export function checkArtifact(root = ROOT, completePath = resolve(root, ARTIFACT_PATH)) {
  const failures = []
  if (!existsSync(completePath)) return ['missing_output:complete.json']
  let artifact
  try { artifact = parse(completePath) } catch (error) { return ['parse_complete:' + error.message] }
  try { companions(completePath) } catch (error) { return ['parse_companion:' + error.message] }
  failures.push(...checkBundle(artifact, root, completePath))
  checkSidecars(root, completePath, failures)
  let actualCompanions
  try { actualCompanions = companions(completePath) } catch { return unique(failures) }
  let expected
  try { expected = buildBundle(root, { mode: 'historical_reference' }).files } catch (error) { failures.push('rebuild_files_failed:' + error.message); return unique(failures) }
  for (const name of OUTPUT_NAMES) failure(failures, canonicalStableArtifactJson(actualCompanions[name]) !== canonicalStableArtifactJson(expected[name]), 'stable_companion:' + name)
  return unique(failures)
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const errors = checkArtifact(ROOT, resolve(process.argv[2] || ARTIFACT_PATH))
  console.log(JSON.stringify({ schema: SCHEMA, pass: errors.length === 0, errors }, null, 2))
  if (errors.length) process.exitCode = 1
}
