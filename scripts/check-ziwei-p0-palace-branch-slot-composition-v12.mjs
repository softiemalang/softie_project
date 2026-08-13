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
  CANDIDATE_NDL_FALSE_POSITIVE,
  CANDIDATE_SSID,
  CANDIDATE_TIANYIGE,
  CANDIDATE_ZJSLIB,
  CHECKER_PATH,
  DOCUMENTATION_PATH,
  INPUT_PATHS,
  MATERIALIZER_PATH,
  MATERIALIZER_VERSION,
  NDL_PARTS,
  NEGATIVE_CHECKER_PATH,
  OBSERVATION_NDL_FALSE_POSITIVE,
  OBSERVATION_SSID,
  OBSERVATION_TIANYIGE,
  OBSERVATION_ZJSLIB,
  PREDECESSOR_COMPOSITION,
  PREDECESSOR_COMPOSITION_EVIDENCE,
  PROTECTED_ASSET_PATH,
  ROOT,
  SCHEMA,
  SSID_PDF_BYTES,
  SSID_PDF_PAGES,
  SSID_PDF_SHA256,
  SSID_RENDER_DIMENSIONS_BY_PAGE,
  SSID_RENDER_SHA256_BY_PAGE,
  TIANYIGE_PDF_BYTES,
  TIANYIGE_PDF_PAGES,
  TIANYIGE_PDF_SHA256,
  TIANYIGE_RENDER_DIMENSIONS_BY_PAGE,
  TIANYIGE_RENDER_SHA256_BY_PAGE,
  ZJSLIB_PDF_BYTES,
  ZJSLIB_PDF_PAGES,
  ZJSLIB_PDF_SHA256,
  ZJSLIB_RENDER_DIMENSIONS_BY_PAGE,
  ZJSLIB_RENDER_SHA256_BY_PAGE,
  buildBundle,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v12.mjs'

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

function checkCandidateIdentity(candidate, failures) {
  failure(failures, candidate?.doesNotEnterGraph !== true || candidate.directVisualReview !== true, candidate?.candidateId + ':admission')
  failure(failures, candidate?.bindingMatrix?.fullBinding !== false || candidate.bindingMatrix.physicalSlot !== 'not_observed' || candidate.bindingMatrix.ordinalDirection !== 'not_observed', candidate?.candidateId + ':binding_promotion')
  failure(failures, candidate?.lineage?.independentPhysicalWitness !== false || candidate.lineage.semanticAuthority !== 'not_established', candidate?.candidateId + ':lineage_promotion')
}

function checkHeldOutCandidates(artifact, failures) {
  const frontier = artifact.lineageAssessment?.researchFrontier
  const candidates = frontier?.candidates || []
  failure(failures, candidates.length !== 16, 'frontier_candidate_count')
  const ssid = candidates.find(item => item.candidateId === CANDIDATE_SSID)
  const tianyige = candidates.find(item => item.candidateId === CANDIDATE_TIANYIGE)
  const zjslib = candidates.find(item => item.candidateId === CANDIDATE_ZJSLIB)
  const ndl = candidates.find(item => item.candidateId === CANDIDATE_NDL_FALSE_POSITIVE)
  for (const candidate of [ssid, tianyige, zjslib, ndl]) if (candidate) checkCandidateIdentity(candidate, failures)
  failure(failures, !ssid || ssid.locators.sourcePdfSha256 !== SSID_PDF_SHA256 || ssid.locators.sourcePdfBytes !== SSID_PDF_BYTES || ssid.locators.sourcePdfPages !== SSID_PDF_PAGES, 'ssid_pdf_identity')
  failure(failures, !ssid || canonicalStableArtifactJson(ssid.locators.renderedFileSha256ByPage) !== canonicalStableArtifactJson(SSID_RENDER_SHA256_BY_PAGE) || canonicalStableArtifactJson(ssid.locators.renderedDimensionsByPage) !== canonicalStableArtifactJson(SSID_RENDER_DIMENSIONS_BY_PAGE), 'ssid_render_identity')
  failure(failures, !ssid || ssid.sourceIdentity.sourceMetadataStatus !== 'blank_on_Commons_file_page' || ssid.sourceIdentity.publicationDate !== null, 'ssid_source_promotion')
  failure(failures, !tianyige || tianyige.locators.sourcePdfSha256 !== TIANYIGE_PDF_SHA256 || tianyige.locators.sourcePdfBytes !== TIANYIGE_PDF_BYTES || tianyige.locators.sourcePdfPages !== TIANYIGE_PDF_PAGES, 'tianyige_pdf_identity')
  failure(failures, !tianyige || canonicalStableArtifactJson(tianyige.locators.renderedFileSha256ByPage) !== canonicalStableArtifactJson(TIANYIGE_RENDER_SHA256_BY_PAGE) || canonicalStableArtifactJson(tianyige.locators.renderedDimensionsByPage) !== canonicalStableArtifactJson(TIANYIGE_RENDER_DIMENSIONS_BY_PAGE), 'tianyige_render_identity')
  failure(failures, !tianyige || tianyige.lineage.targetChapterPresent !== false, 'tianyige_target_presence')
  failure(failures, !zjslib || zjslib.locators.sourcePdfSha256 !== ZJSLIB_PDF_SHA256 || zjslib.locators.sourcePdfBytes !== ZJSLIB_PDF_BYTES || zjslib.locators.sourcePdfPages !== ZJSLIB_PDF_PAGES, 'zjslib_pdf_identity')
  failure(failures, !zjslib || canonicalStableArtifactJson(zjslib.locators.renderedFileSha256ByPage) !== canonicalStableArtifactJson(ZJSLIB_RENDER_SHA256_BY_PAGE) || canonicalStableArtifactJson(zjslib.locators.renderedDimensionsByPage) !== canonicalStableArtifactJson(ZJSLIB_RENDER_DIMENSIONS_BY_PAGE), 'zjslib_render_identity')
  failure(failures, !zjslib || zjslib.lineage.targetChapterPresent !== false, 'zjslib_target_presence')
  failure(failures, !ndl || ndl.sourceIdentity.targetRecordMatch !== false || ndl.sourceIdentity.actualNdlBibId !== '000007637582' || ndl.lineage.targetChapterPresent !== false, 'ndl_false_positive_identity')
  failure(failures, !ndl || ndl.locators.parts?.length !== NDL_PARTS.length, 'ndl_part_count')
  for (const part of NDL_PARTS) {
    const stored = ndl?.locators.parts?.find(item => item.part === part.part)
    failure(failures, !stored || stored.sourcePdfSha256 !== part.sha256 || stored.sourcePdfBytes !== part.bytes || stored.sourcePdfPages !== part.pages || canonicalStableArtifactJson(stored.renderedFileSha256ByPage) !== canonicalStableArtifactJson(part.renderSha256ByPage), 'ndl_part_identity:' + part.part)
  }
  failure(failures, frontier?.frontierOnlySources?.includes(CANDIDATE_SSID) !== true || frontier.frontierOnlySources.includes(CANDIDATE_TIANYIGE) !== true || frontier.frontierOnlySources.includes(CANDIDATE_ZJSLIB) !== true || frontier.frontierOnlySources.includes(CANDIDATE_NDL_FALSE_POSITIVE) !== true, 'frontier_only_sources')
  const observationIds = frontier?.frontierOnlyObservations?.map(item => item.observationId) || []
  for (const id of [OBSERVATION_SSID, OBSERVATION_TIANYIGE, OBSERVATION_ZJSLIB, OBSERVATION_NDL_FALSE_POSITIVE]) failure(failures, !observationIds.includes(id), 'frontier_observation:' + id)
  failure(failures, frontier?.graphImpact?.sourcesAdded?.length !== 0 || frontier.graphImpact.observationsAdded?.length !== 0 || frontier.graphImpact.relationsAdded?.length !== 0, 'frontier_graph_admission')
}

function checkEvidence(artifact, evidence, failures) {
  failure(failures, evidence?.schemaVersion !== SCHEMA + '-evidence-v0', 'evidence_schema')
  failure(failures, evidence?.observations?.length !== artifact.observations?.length, 'evidence_observation_copy')
  failure(failures, evidence?.heldOutDirectScanReview?.candidateIds?.length !== 6 || evidence.heldOutDirectScanReview.fullBindingCount !== 0, 'evidence_held_out_review')
  failure(failures, evidence?.v12DirectScanReview?.candidateIds?.length !== 4 || evidence.v12DirectScanReview.graphAdmission !== false, 'evidence_v12_review')
  failure(failures, evidence?.earlierEdition1871Recheck?.pageBytesObtained !== false || evidence.earlierEdition1871Recheck.textualLineageClosed !== false || evidence.earlierEdition1871Recheck.directCandidateReview?.historical1871TargetBytes !== false, 'evidence_1871_boundary')
  failure(failures, evidence?.earlierEdition1871Recheck?.directCandidateReview?.ndlFalsePositiveTargetRecordMatch !== false, 'evidence_ndl_boundary')
}

function checkMatrix(artifact, matrix, failures) {
  failure(failures, matrix?.schemaVersion !== SCHEMA + '-binding-matrix-v0', 'matrix_schema')
  failure(failures, matrix?.composition?.status !== 'derived_not_authoritative', 'matrix_authority')
  failure(failures, matrix?.coverage?.directSingleWitnessFullBindingCount !== 0 || matrix.coverage.productionOrdinalBindingCount !== 0 || matrix.coverage.semanticAuthorityCount !== 0, 'matrix_promotion')
  failure(failures, matrix?.researchFrontierBoundary?.reviewedCandidateCount !== 16 || matrix.researchFrontierBoundary.heldOutDirectScanCandidateCount !== 6 || matrix.researchFrontierBoundary.sameRecordFollowupCount !== 1 || matrix.researchFrontierBoundary.admittedCandidateCount !== 0, 'matrix_frontier_boundary')
  failure(failures, matrix?.frontierOnlyBindingRows?.length !== 7 || matrix.frontierOnlyBindingRows.some(row => row.fullBinding !== false || row.semanticAuthority !== false), 'matrix_frontier_rows')
}

function checkLineage(artifact, lineage, failures) {
  failure(failures, lineage?.schemaVersion !== SCHEMA + '-lineage-v0', 'lineage_schema')
  failure(failures, lineage?.status !== 'derived_not_authoritative' || lineage.independentWitnessStatus !== 'not_admitted', 'lineage_authority')
  failure(failures, lineage?.frontierLineageAssessments?.length !== 7 || lineage.frontierLineageAssessments.some(item => item.independentPhysicalWitness !== false), 'lineage_frontier_boundary')
  failure(failures, lineage?.frontierCandidateReview?.candidateIds?.length !== 6 || lineage.frontierCandidateReview.targetSectionPresentCount !== 1 || lineage.frontierCandidateReview.falsePositiveCount !== 1, 'lineage_candidate_review')
  failure(failures, lineage?.physicalWitnessCandidatesAdded?.length !== artifact.sourceLineage?.physicalWitnessCandidatesAdded?.length, 'lineage_graph_candidate_boundary')
  failure(failures, lineage?.earlierEdition1871?.textualLineageClosed !== false || lineage.earlierEdition1871.catalogFormatComparisonDirectBytes !== false || lineage.earlierEdition1871.v12DirectCandidateReview?.historical1871ScanObtained !== false, 'lineage_1871_boundary')
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
  failure(failures, artifact.scope?.historical1871ScanObtained !== false || artifact.scope.directSingleWitnessFullBindingEstablished !== false, 'scope_binding_promotion')
  failure(failures, artifact.scope?.physicalWitnessCandidatesAdded !== 4 || artifact.scope.sourceAuthorityPromoted !== false || artifact.scope.semanticAuthorityPromoted !== false || artifact.scope.independentWitnessesAdmitted !== 0, 'scope_authority_promotion')
  failure(failures, artifact.scope?.researchCandidatesAdmitted !== 1 || artifact.scope?.heldOutResearchCandidateCount !== 15 || artifact.scope.sameRecordFollowupReviewPerformed !== true || artifact.scope.heldOutDirectScanCandidateCount !== 6, 'scope_frontier_boundary')
  failure(failures, artifact.readinessImpact?.readiness !== 'not_safe_to_start' || artifact.readinessImpact.grounding !== 'blocked' || artifact.readinessImpact.activation !== 'experimental_only' || artifact.readinessImpact.rotation06 !== 'representation_only', 'readiness_boundary')
  failure(failures, artifact.preservation?.predecessorArtifactsRewritten !== false || artifact.preservation.historicalPredecessorBytesRewritten !== false || artifact.preservation.existingFieldKitRewritten !== false || artifact.preservation.productionChanged !== false || artifact.preservation.remoteDatabaseChanged !== false || artifact.preservation.deploymentPerformed !== false || artifact.preservation.commitPerformed !== false || artifact.preservation.pushPerformed !== false, 'preservation_boundary')
  failure(failures, artifact.deterministicContract?.generatedAt !== 'forbidden' || artifact.deterministicContract.network !== 'forbidden_during_materialization' || artifact.deterministicContract.noAutomaticPromotion !== true, 'deterministic_contract')
}

export function checkBundle(artifact, root = ROOT, completePath = resolve(root, ARTIFACT_PATH)) {
  const failures = []
  let expected
  try { expected = buildBundle(root, { mode: 'historical_reference' }).artifact } catch (error) { return ['rebuild_failed:' + error.message] }
  const historical = checkHistoricalRepositoryBasis(root, BASIS_HEAD, { expectedBranch: 'main' })
  failure(failures, historical.errors.length > 0, 'historical_repository_basis:' + historical.errors.join(','))
  failure(failures, artifact?.schemaVersion !== SCHEMA || artifact?.verdictToken !== 'complete_ziwei_palace_branch_slot_composition_with_anonymous_ssid_scan_and_rejected_false_positive_scans_derived_not_authoritative', 'schema_or_verdict')
  failure(failures, artifact?.basisHead !== BASIS_HEAD || artifact?.branch !== 'main', 'basis_or_branch')
  failure(failures, canonicalStableArtifactJson(artifact) !== canonicalStableArtifactJson(expected), 'stable_content_not_reproducible')
  failure(failures, containsGeneratedTimestamp(artifact), 'artifact_timestamp')
  failures.push(...checkArtifactIdentity(artifact, { root, artifactId: SCHEMA, materializerPath: MATERIALIZER_PATH, materializerVersion: MATERIALIZER_VERSION, allowGenerationBaseInput: true, allowVerifierInputDrift: true }).map(error => 'artifact_identity:' + error))
  checkPredecessors(root, artifact, failures)
  checkHeldOutCandidates(artifact, failures)
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
