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
  CANDIDATE_IA,
  CANDIDATE_JSG,
  CANDIDATE_NAOJ,
  DOCUMENTATION_PATH,
  IA_JP2_ZIP_BYTES,
  IA_JP2_ZIP_MD5,
  IA_METADATA_URL,
  IA_ORIGINAL_PDF_BYTES,
  IA_ORIGINAL_PDF_MD5,
  IA_PAGE_SHA256_BY_PAGE,
  IA_SCANDATA_MD5,
  IA_SCANDATA_SHA256,
  INPUT_PATHS,
  JSG_PDF_BYTES,
  JSG_PDF_PAGES,
  JSG_PDF_SHA256,
  JSG_RECORD_URL,
  JSG_RENDER_DIMENSIONS_BY_PAGE,
  JSG_RENDER_DPI,
  JSG_RENDER_SHA256_BY_PAGE,
  JSG_PDF_URL,
  MATERIALIZER_PATH,
  MATERIALIZER_VERSION,
  NAOJ_PAGE_SHA256,
  NAOJ_RECORD_URL,
  NAOJ_TAIL_SHA256,
  NAOJ_VOL1_MANIFEST_SHA256,
  NAOJ_VOL1_MANIFEST_URL,
  NAOJ_VOL2_MANIFEST_SHA256,
  NAOJ_VOL2_MANIFEST_URL,
  OBSERVATION_IA,
  OBSERVATION_JSG,
  OBSERVATION_NAOJ,
  PREDECESSOR_COMPOSITION,
  PREDECESSOR_COMPOSITION_EVIDENCE,
  PROTECTED_ASSET_PATH,
  ROOT,
  SCHEMA,
  buildBundle,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v11.mjs'

export const COMPLETE_PATH = ARTIFACT_PATH

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const parse = path => JSON.parse(readFileSync(path, 'utf8'))
const failure = (list, condition, message) => { if (condition) list.push(message) }
const unique = values => [...new Set(values)]
const OUTPUT_NAMES = ['evidence.json', 'binding-matrix.json', 'lineage-assessment.json', 'graph-reconciliation.json', 'field-kit-impact.json']
const BLOCKERS = [
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
    try { sidecar = parse(sidecarPath) } catch (error) {
      failures.push('parse_sidecar:' + name + ':' + error.message)
      continue
    }
    failure(failures, sidecar.schemaVersion !== SCHEMA + '-integrity-v0', 'integrity_schema:' + name)
    failure(failures, sidecar.path !== relative(root, path), 'integrity_path:' + name)
    failure(failures, sidecar.byteSha256 !== sha256(readFileSync(path)), 'integrity_hash:' + name)
  }
}

function checkPredecessors(root, artifact, failures) {
  const paths = artifact.predecessorChain?.map(item => item.path) || []
  failure(failures, paths.at(-2) !== PREDECESSOR_COMPOSITION || paths.at(-1) !== PREDECESSOR_COMPOSITION_EVIDENCE, 'predecessor_successor_chain_tail')
  for (const row of artifact.predecessorChain || []) {
    const path = resolve(root, row.path)
    failure(failures, !existsSync(path), 'missing_predecessor:' + row.path)
    if (existsSync(path)) failure(failures, row.byteSha256 !== sha256(readFileSync(path)), 'predecessor_byte_identity:' + row.path)
  }
  for (const path of INPUT_PATHS) failure(failures, !existsSync(resolve(root, path)), 'missing_input:' + path)
  failure(failures, artifact.preservation?.protectedAsset?.canonicalPath !== PROTECTED_ASSET_PATH, 'protected_asset_path')
  if (existsSync(resolve(root, PROTECTED_ASSET_PATH))) {
    failure(failures, artifact.preservation?.protectedAsset?.byteSha256 !== sha256(readFileSync(resolve(root, PROTECTED_ASSET_PATH))), 'protected_asset_hash')
  }
}

function checkNaOJ(artifact, failures) {
  const followup = artifact.lineageAssessment?.sameRecordFollowup
  failure(failures, followup?.candidateId !== CANDIDATE_NAOJ || followup.observationId !== OBSERVATION_NAOJ, 'naoj_followup_identity')
  if (!followup) return
  failure(failures, followup.sameRecordAsV10Nara !== true || followup.doesNotEnterGraph !== true || followup.independentPhysicalWitness !== false, 'naoj_followup_admission')
  failure(failures, followup.sourceIdentity?.recordUrl !== NAOJ_RECORD_URL || followup.sourceIdentity?.sameRecordEditionPair !== true, 'naoj_followup_record')
  failure(failures, followup.manifestIdentity?.['4468520']?.url !== NAOJ_VOL1_MANIFEST_URL || followup.manifestIdentity?.['4468520']?.byteSha256 !== NAOJ_VOL1_MANIFEST_SHA256, 'naoj_vol1_manifest')
  failure(failures, followup.manifestIdentity?.['4469314']?.url !== NAOJ_VOL2_MANIFEST_URL || followup.manifestIdentity?.['4469314']?.byteSha256 !== NAOJ_VOL2_MANIFEST_SHA256, 'naoj_vol2_manifest')
  failure(failures, followup.reviewedImages?.length !== 8 || followup.tailAcquiredPages?.length !== 17, 'naoj_page_counts')
  for (const [key, expected] of Object.entries(NAOJ_PAGE_SHA256)) {
    failure(failures, followup.reviewedImages?.some(item => item.hashKey === key && item.renderedResponseSha256 === expected) !== true, 'naoj_page_hash:' + key)
  }
  for (const [canvas, expected] of Object.entries(NAOJ_TAIL_SHA256)) {
    failure(failures, followup.tailAcquiredPages?.some(item => item.canvasLabel === canvas && item.renderedResponseSha256 === expected) !== true, 'naoj_tail_hash:' + canvas)
  }
  failure(failures, followup.bindingMatrix?.fullBinding !== false || followup.bindingMatrix?.physicalSlot !== 'partial_chart_surface_no_named_slot_mapping', 'naoj_binding_promotion')
  failure(failures, followup.doesNotEstablish?.includes('production_ordinal') !== true || followup.doesNotEstablish?.includes('semantic_authority') !== true, 'naoj_boundary')
  failure(failures, followup.rawVisibleText?.some(item => item.text === '大抵入命俱從寅上起正月順數至本生月止') !== true, 'naoj_rule_text')
  failure(failures, followup.rawVisibleText?.some(item => item.text === '安天府圖') !== true, 'naoj_tianfu_text')
}

function checkHeldOutCandidates(artifact, failures) {
  const frontier = artifact.lineageAssessment?.researchFrontier
  const candidates = frontier?.candidates || []
  const jsg = candidates.find(item => item.candidateId === CANDIDATE_JSG)
  const ia = candidates.find(item => item.candidateId === CANDIDATE_IA)
  failure(failures, candidates.length !== 12, 'frontier_candidate_count')
  failure(failures, !jsg || !ia, 'frontier_held_out_candidates')
  if (jsg) {
    failure(failures, jsg.doesNotEnterGraph !== true || jsg.directVisualReview !== true || jsg.decision !== 'held_outside_graph_direct_aks_scan_partial_rule_surface_no_four_field_binding', 'jsg_admission')
    failure(failures, jsg.locators?.recordUrl !== JSG_RECORD_URL || jsg.locators?.pdfUrl !== JSG_PDF_URL, 'jsg_urls')
    failure(failures, jsg.locators?.sourcePdfSha256 !== JSG_PDF_SHA256 || jsg.locators?.sourcePdfBytes !== JSG_PDF_BYTES || jsg.locators?.sourcePdfPages !== JSG_PDF_PAGES, 'jsg_pdf_identity')
    failure(failures, jsg.locators?.renderDpi !== JSG_RENDER_DPI || JSON.stringify(jsg.locators?.renderedFileSha256ByPage) !== JSON.stringify(JSG_RENDER_SHA256_BY_PAGE) || JSON.stringify(jsg.locators?.renderedDimensionsByPage) !== JSON.stringify(JSG_RENDER_DIMENSIONS_BY_PAGE), 'jsg_render_identity')
    failure(failures, jsg.sourceIdentity?.publicationDate !== '年紀未詳' || jsg.lineage?.publicationDateEstablished !== false, 'jsg_date_promotion')
    failure(failures, jsg.bindingMatrix?.fullBinding !== false || jsg.bindingMatrix?.physicalSlot !== 'not_observed' || jsg.bindingMatrix?.ordinalDirection !== 'not_observed', 'jsg_binding_promotion')
  }
  if (ia) {
    failure(failures, ia.doesNotEnterGraph !== true || ia.directVisualReview !== true || ia.decision !== 'held_outside_graph_public_mirror_sample_no_independent_witness_no_four_field_binding', 'ia_admission')
    failure(failures, ia.locators?.metadataUrl !== IA_METADATA_URL || ia.locators?.originalPdfBytesFromMetadata !== IA_ORIGINAL_PDF_BYTES || ia.locators?.originalPdfMd5FromMetadata !== IA_ORIGINAL_PDF_MD5, 'ia_pdf_metadata')
    failure(failures, ia.locators?.jp2ZipBytesFromMetadata !== IA_JP2_ZIP_BYTES || ia.locators?.jp2ZipMd5FromMetadata !== IA_JP2_ZIP_MD5 || ia.locators?.scandataMd5FromMetadata !== IA_SCANDATA_MD5 || ia.locators?.scandataSha256 !== IA_SCANDATA_SHA256, 'ia_derivative_identity')
    failure(failures, ia.locators?.originalPdfSha256 !== null || ia.locators?.fullOriginalPdfDownloadedForSha256 !== false, 'ia_sha256_promotion')
    failure(failures, canonicalStableArtifactJson(ia.locators?.pageJpegSha256ByPage) !== canonicalStableArtifactJson(IA_PAGE_SHA256_BY_PAGE), 'ia_page_hashes')
    failure(failures, ia.lineage?.independentPhysicalWitness !== false || ia.bindingMatrix?.fullBinding !== false, 'ia_binding_promotion')
  }
  failure(failures, frontier?.sameRecordFollowups?.length !== 1, 'frontier_same_record_followup_count')
  failure(failures, frontier?.frontierOnlySources?.includes(CANDIDATE_JSG) !== true || frontier.frontierOnlySources.includes(CANDIDATE_IA) !== true, 'frontier_only_sources')
  failure(failures, frontier?.graphImpact?.sourcesAdded?.length !== 0 || frontier.graphImpact.observationsAdded?.length !== 0 || frontier.graphImpact.relationsAdded?.length !== 0, 'frontier_graph_admission')
  failure(failures, frontier?.frontierOnlyObservations?.some(item => item.observationId === OBSERVATION_JSG) !== true || frontier.frontierOnlyObservations.some(item => item.observationId === OBSERVATION_IA) !== true || frontier.frontierOnlyObservations.some(item => item.observationId === OBSERVATION_NAOJ) !== true, 'frontier_observation_ids')
}

function checkEvidence(artifact, evidence, failures) {
  failure(failures, evidence?.schemaVersion !== SCHEMA + '-evidence-v0', 'evidence_schema')
  failure(failures, evidence?.authorityBoundary?.includes('same-record') !== true || evidence.authorityBoundary.includes('semantic authority') !== true, 'evidence_authority_boundary')
  failure(failures, evidence?.observations?.length !== artifact.observations?.length, 'evidence_observation_copy')
  failure(failures, evidence?.sameRecordFollowup?.candidateId !== CANDIDATE_NAOJ || evidence.sameRecordFollowup.doesNotEnterGraph !== true, 'evidence_naoj_followup')
  failure(failures, evidence?.heldOutDirectScanReview?.candidateIds?.length !== 2 || evidence.heldOutDirectScanReview.fullBindingCount !== 0, 'evidence_held_out_review')
  failure(failures, evidence?.earlierEdition1871Recheck?.pageBytesObtained !== false || evidence.earlierEdition1871Recheck.textualLineageClosed !== false, 'evidence_1871_boundary')
  failure(failures, evidence?.reportedNonObservations?.some(item => /same-record|AKS|Internet Archive|1871 page bytes/.test(item)) !== true, 'evidence_nonobservations')
}

function checkMatrix(artifact, matrix, failures) {
  failure(failures, matrix?.schemaVersion !== SCHEMA + '-binding-matrix-v0', 'matrix_schema')
  failure(failures, matrix?.composition?.status !== 'derived_not_authoritative', 'matrix_authority')
  failure(failures, matrix?.coverage?.directNamedPalaceWitnessCount !== 4 || matrix.coverage.additionalDirectNamedPalaceCorroborationCount !== 3, 'matrix_existing_named_witness_count')
  failure(failures, matrix?.coverage?.partialDirectNamedPalaceComponentCount !== 1 || matrix.coverage.directBranchPhysicalGridWitnessCount !== 1 || matrix.coverage.crossPageComposedBindingFrontierCount !== 1, 'matrix_component_counts')
  failure(failures, matrix?.coverage?.directSingleWitnessFullBindingCount !== 0 || matrix.coverage.productionOrdinalBindingCount !== 0 || matrix.coverage.semanticAuthorityCount !== 0, 'matrix_promotion')
  failure(failures, matrix?.researchFrontierBoundary?.reviewedCandidateCount !== 12 || matrix.researchFrontierBoundary.heldOutDirectScanCandidateCount !== 2 || matrix.researchFrontierBoundary.sameRecordFollowupCount !== 1 || matrix.researchFrontierBoundary.admittedCandidateCount !== 0, 'matrix_frontier_boundary')
  failure(failures, matrix?.frontierOnlyBindingRows?.length !== 3 || matrix.frontierOnlyBindingRows.some(row => row.fullBinding !== false || row.semanticAuthority !== false), 'matrix_frontier_rows')
}

function checkLineage(artifact, lineage, failures) {
  failure(failures, lineage?.schemaVersion !== SCHEMA + '-lineage-v0', 'lineage_schema')
  failure(failures, lineage?.status !== 'derived_not_authoritative' || lineage.independentWitnessStatus !== 'not_admitted', 'lineage_authority')
  failure(failures, lineage?.sameRecordFollowup?.candidateId !== CANDIDATE_NAOJ || lineage.sameRecordFollowup.sameRecordAsV10Nara !== true, 'lineage_naoj_boundary')
  failure(failures, lineage?.frontierLineageAssessments?.length !== 3 || lineage.frontierLineageAssessments.some(item => item.independentPhysicalWitness !== false), 'lineage_frontier_boundary')
  failure(failures, lineage?.physicalWitnessCandidatesAdded?.length !== artifact.sourceLineage?.physicalWitnessCandidatesAdded?.length, 'lineage_graph_candidate_boundary')
  failure(failures, lineage?.earlierEdition1871?.textualLineageClosed !== false || lineage.earlierEdition1871.catalogFormatComparisonDirectBytes !== false, 'lineage_1871_boundary')
}

function checkGraph(artifact, graph, failures) {
  failure(failures, graph?.predecessor?.claimCount !== 30 || graph.predecessor.sourceCount !== 21 || graph.predecessor.observationCount !== 58 || graph.predecessor.relationCount !== 148 || graph.predecessor.blockerCount !== 11, 'predecessor_graph_counts')
  failure(failures, graph?.additive?.claimCount !== 0 || graph.additive.sourceCount !== 0 || graph.additive.physicalWitnessCount !== 0 || graph.additive.observationCount !== 0 || graph.additive.relationCount !== 0 || graph.additive.blockerCount !== 0, 'additive_graph_counts')
  failure(failures, graph?.successor?.claimCount !== 30 || graph.successor.sourceCount !== 21 || graph.successor.observationCount !== 58 || graph.successor.relationCount !== 148 || graph.successor.blockerCount !== 11, 'successor_graph_counts')
  failure(failures, JSON.stringify(graph?.blockersClosed) !== JSON.stringify([]) || JSON.stringify(graph?.blockersStillOpen) !== JSON.stringify(BLOCKERS), 'blocker_closure')
  failure(failures, graph?.independentPhysicalWitnessesAdmitted !== 0, 'independent_witness_promotion')
  failure(failures, graph?.addedObservationIds?.length !== 0 || graph.addedRelationIds?.length !== 0 || graph.sourcesAdded?.length !== 0 || graph.physicalWitnessesAdded?.length !== 0, 'graph_added_ids')
  failure(failures, graph?.researchFrontier?.sourcesAdded?.length !== 0 || graph.researchFrontier.observationsAdded?.length !== 0 || graph.researchFrontier.relationsAdded?.length !== 0, 'graph_frontier_added_ids')
}

function checkFieldKit(artifact, fieldKit, failures) {
  failure(failures, fieldKit?.schemaVersion !== SCHEMA + '-field-kit-v0', 'field_kit_schema')
  failure(failures, fieldKit?.semanticTargetStillOpen !== true || fieldKit.sourceIdentityTargetStillActionRequired !== true || fieldKit.rightsTargetStillHumanPolicyReview !== true, 'field_kit_promotion')
  failure(failures, fieldKit?.researchFrontier?.reviewedCandidateCount !== 12 || fieldKit.researchFrontier.heldOutDirectScanCandidateCount !== 2 || fieldKit.researchFrontier.sameRecordFollowupCount !== 1 || fieldKit.researchFrontier.admittedCandidateCount !== 0, 'field_kit_frontier')
  failure(failures, fieldKit?.researchFrontier?.graphAdmittedFrontierCandidateCount !== 1, 'field_kit_graph_frontier')
}

function checkScopeAndReadiness(artifact, failures) {
  failure(failures, artifact.scope?.historical1871ScanObtained !== false || artifact.scope.directSingleWitnessFullBindingEstablished !== false, 'scope_binding_promotion')
  failure(failures, artifact.scope?.physicalWitnessCandidatesAdded !== 4 || artifact.scope.sourceAuthorityPromoted !== false || artifact.scope.semanticAuthorityPromoted !== false || artifact.scope.independentWitnessesAdmitted !== 0, 'scope_authority_promotion')
  failure(failures, artifact.scope?.researchCandidatesAdmitted !== 1 || artifact.scope?.heldOutResearchCandidateCount !== 11 || artifact.scope.sameRecordFollowupReviewPerformed !== true || artifact.scope.heldOutDirectScanCandidateCount !== 2, 'scope_frontier_boundary')
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
  failure(failures, artifact?.schemaVersion !== SCHEMA || artifact?.verdictToken !== 'complete_ziwei_palace_branch_slot_composition_with_same_record_followup_and_held_out_direct_scan_frontier_derived_not_authoritative', 'schema_or_verdict')
  failure(failures, artifact?.basisHead !== BASIS_HEAD || artifact?.branch !== 'main', 'basis_or_branch')
  failure(failures, canonicalStableArtifactJson(artifact) !== canonicalStableArtifactJson(expected), 'stable_content_not_reproducible')
  failure(failures, containsGeneratedTimestamp(artifact), 'artifact_timestamp')
  failures.push(...checkArtifactIdentity(artifact, {
    root,
    artifactId: SCHEMA,
    materializerPath: MATERIALIZER_PATH,
    materializerVersion: MATERIALIZER_VERSION,
    allowGenerationBaseInput: true,
    allowVerifierInputDrift: true,
  }).map(error => 'artifact_identity:' + error))
  checkPredecessors(root, artifact, failures)
  checkNaOJ(artifact, failures)
  checkHeldOutCandidates(artifact, failures)
  const side = companions(completePath)
  checkEvidence(artifact, side['evidence.json'], failures)
  checkMatrix(artifact, side['binding-matrix.json'], failures)
  checkLineage(artifact, side['lineage-assessment.json'], failures)
  checkGraph(artifact, side['graph-reconciliation.json'].graphImpact, failures)
  checkFieldKit(artifact, side['field-kit-impact.json'], failures)
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
