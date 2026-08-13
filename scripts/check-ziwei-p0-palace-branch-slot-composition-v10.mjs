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
  CNTS_00047996572_COMMONS_SHA1,
  CNTS_00047996572_COMMONS_URL,
  CNTS_00047996572_PDF_BYTES,
  CNTS_00047996572_PDF_PAGES,
  CNTS_00047996572_PDF_SHA256,
  CNTS_00047996572_RENDER_DIMENSIONS_BY_PAGE,
  CNTS_00047996572_RENDER_DPI,
  CNTS_00047996572_RENDER_SHA256_BY_PAGE,
  CNTS_00047996572_URL,
  DOCUMENTATION_PATH,
  INPUT_PATHS,
  MATERIALIZER_PATH,
  MATERIALIZER_VERSION,
  OBSERVATION_CNTS_P13,
  OBSERVATION_CNTS_P6,
  PALACE_CLAIMS,
  PREDECESSOR_COMPOSITION,
  PREDECESSOR_COMPOSITION_EVIDENCE,
  PROTECTED_ASSET_PATH,
  RELATION_CNTS_CROSS_PAGE,
  ROOT,
  SCHEMA,
  SOURCE_CNTS_00047996572,
  buildBundle,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v10.mjs'

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
    const sidecar = parse(sidecarPath)
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

function checkSource(artifact, failures) {
  const entry = artifact.sourceLineage?.addedSources?.find(item => item.sourceId === SOURCE_CNTS_00047996572)
  failure(failures, !entry, 'missing_cnts_source')
  if (!entry) return
  failure(failures, entry.sourceKind !== 'direct_anonymous_handwritten_manuscript_image_scan', 'cnts_kind')
  failure(failures, entry.role !== 'same_witness_cross_page_binding_frontier_only', 'cnts_role')
  failure(failures, entry.title !== '紫微斗數方書' || entry.author !== '編者未詳' || entry.edition !== '筆寫本', 'cnts_catalog_identity')
  failure(failures, entry.catalogId !== 'CNTS-00047996572' || entry.holdingCredit !== 'National Digital Library of Korea', 'cnts_catalog_locator')
  failure(failures, entry.url !== CNTS_00047996572_URL || entry.commonsUrl !== CNTS_00047996572_COMMONS_URL, 'cnts_urls')
  failure(failures, entry.sourcePdfSha256 !== CNTS_00047996572_PDF_SHA256 || entry.sourcePdfBytes !== CNTS_00047996572_PDF_BYTES || entry.sourcePdfPages !== CNTS_00047996572_PDF_PAGES || entry.commonsSha1 !== CNTS_00047996572_COMMONS_SHA1, 'cnts_bytes')
  failure(failures, entry.physicalWitnessCandidate !== true || entry.independentPhysicalWitness !== false || entry.sourceAuthority !== 'not_established', 'cnts_authority')
  failure(failures, entry.lineageStatus !== 'catalogued_handwritten_copy; author_date_and_relation_to_youyi_lu_or_nanbei_unresolved' || entry.workIdentityStatus !== 'not_established_as_youyi_lu_or_nanbei_work', 'cnts_lineage')
}

function checkLocator(locatorRecord, pages, failures, prefix) {
  failure(failures, locatorRecord?.commonsUrl !== CNTS_00047996572_COMMONS_URL || locatorRecord.url !== CNTS_00047996572_URL, prefix + '_locator_urls')
  failure(failures, locatorRecord?.sourcePdfSha256 !== CNTS_00047996572_PDF_SHA256 || locatorRecord.sourcePdfBytes !== CNTS_00047996572_PDF_BYTES || locatorRecord.sourcePdfPages !== CNTS_00047996572_PDF_PAGES, prefix + '_bytes')
  failure(failures, JSON.stringify(locatorRecord?.scanPages) !== JSON.stringify(pages) || JSON.stringify(locatorRecord?.printedPages) !== JSON.stringify(pages), prefix + '_pages')
  failure(failures, locatorRecord?.renderDpi !== CNTS_00047996572_RENDER_DPI, prefix + '_dpi')
  const expectedHashes = Object.fromEntries(pages.map(page => [page, CNTS_00047996572_RENDER_SHA256_BY_PAGE[page]]))
  const expectedDimensions = Object.fromEntries(pages.map(page => [page, CNTS_00047996572_RENDER_DIMENSIONS_BY_PAGE[page]]))
  failure(failures, JSON.stringify(locatorRecord?.renderedFileSha256ByPage) !== JSON.stringify(expectedHashes), prefix + '_render_hashes')
  failure(failures, JSON.stringify(locatorRecord?.renderedDimensionsByPage) !== JSON.stringify(expectedDimensions), prefix + '_render_dimensions')
}

function checkObservationsAndRelation(artifact, failures) {
  const palaceObservation = artifact.observations?.find(item => item.observationId === OBSERVATION_CNTS_P6)
  const gridObservation = artifact.observations?.find(item => item.observationId === OBSERVATION_CNTS_P13)
  failure(failures, !palaceObservation || !gridObservation, 'missing_cnts_observations')
  for (const [observation, page, prefix] of [[palaceObservation, 6, 'cnts_p6'], [gridObservation, 13, 'cnts_p13']]) {
    if (!observation) continue
    failure(failures, JSON.stringify(observation.affectedClaimIds) !== JSON.stringify(PALACE_CLAIMS), prefix + '_claims')
    failure(failures, observation.directObservationStatus !== 'direct_visual_original_scan_review_not_ocr_transcription' || observation.researcherDirectObservation !== true, prefix + '_review')
    failure(failures, JSON.stringify(observation.sourceIds) !== JSON.stringify([SOURCE_CNTS_00047996572]), prefix + '_source')
    checkLocator(observation.locator, [page], failures, prefix)
    failure(failures, observation.sourceIdentity?.commonsSha1 !== CNTS_00047996572_COMMONS_SHA1 || observation.sourceIdentity.pdfSha256 !== CNTS_00047996572_PDF_SHA256, prefix + '_identity')
    failure(failures, observation.doesNotEstablish?.includes('p6_palace_sequence_to_p13_branch_grid_join') !== true, prefix + '_cross_page_boundary')
    failure(failures, observation.doesNotEstablish?.includes('production_ordinal') !== true || observation.doesNotEstablish?.includes('semantic_authority') !== true, prefix + '_promotion_boundary')
  }
  failure(failures, palaceObservation?.supports?.includes('direct_partial_named_palace_sequence') !== true, 'cnts_p6_support')
  failure(failures, gridObservation?.supports?.includes('direct_branch_token_to_page_grid_row') !== true, 'cnts_p13_support')
  const relationRecord = artifact.relations?.find(item => item.relationId === RELATION_CNTS_CROSS_PAGE)
  failure(failures, !relationRecord, 'missing_cnts_relation')
  if (relationRecord) {
    failure(failures, JSON.stringify(relationRecord.sourceIds) !== JSON.stringify([SOURCE_CNTS_00047996572]), 'cnts_relation_sources')
    failure(failures, JSON.stringify(relationRecord.observationIds) !== JSON.stringify([OBSERVATION_CNTS_P6, OBSERVATION_CNTS_P13]), 'cnts_relation_observations')
    failure(failures, relationRecord.inferenceStatus !== 'composed_cross_page_same_manuscript_not_direct_single_frame', 'cnts_relation_inference')
    failure(failures, relationRecord.promotion !== 'not_admitted_to_source_authority_or_semantic_claim', 'cnts_relation_promotion')
    failure(failures, relationRecord.doesNotEstablish?.includes('palace_name_to_p13_physical_slot') !== true || relationRecord.doesNotEstablish?.includes('production_ordinal') !== true, 'cnts_relation_boundary')
  }
}

function checkEvidence(artifact, evidence, failures) {
  failure(failures, evidence?.schemaVersion !== SCHEMA + '-evidence-v0', 'evidence_schema')
  failure(failures, evidence?.authorityBoundary?.includes('cross-page join is inferred') !== true || evidence.authorityBoundary.includes('semantic authority') !== true, 'evidence_authority_boundary')
  failure(failures, evidence?.observations?.length !== artifact.observations?.length, 'evidence_observation_copy')
  failure(failures, evidence?.manuscriptCrossPageFrontier?.sourceId !== SOURCE_CNTS_00047996572 || evidence.manuscriptCrossPageFrontier.crossPageJoin !== 'inferred_same_manuscript_not_direct_single_frame' || evidence.manuscriptCrossPageFrontier.palaceNameToPhysicalSlot !== false, 'evidence_cross_page_frontier')
  failure(failures, evidence?.newDirectScan?.sourceId !== SOURCE_CNTS_00047996572 || evidence.newDirectScan.independentWitnessAdmitted !== false, 'evidence_new_scan_boundary')
  failure(failures, evidence?.reportedNonObservations?.some(item => /single reviewed frame|compass orientation|production ordinal|anonymous handwritten/.test(item)) !== true, 'evidence_nonobservations')
}

function checkMatrix(artifact, matrix, failures) {
  failure(failures, matrix?.schemaVersion !== SCHEMA + '-binding-matrix-v0', 'matrix_schema')
  failure(failures, matrix?.composition?.status !== 'derived_not_authoritative', 'matrix_authority')
  failure(failures, matrix?.coverage?.directNamedPalaceWitnessCount !== 4 || matrix.coverage.additionalDirectNamedPalaceCorroborationCount !== 3, 'matrix_existing_named_witness_count')
  failure(failures, matrix?.coverage?.partialDirectNamedPalaceComponentCount !== 1 || matrix.coverage.directBranchPhysicalGridWitnessCount !== 1 || matrix.coverage.crossPageComposedBindingFrontierCount !== 1, 'matrix_component_counts')
  failure(failures, matrix?.coverage?.directSingleWitnessFullBindingCount !== 0 || matrix.coverage.productionOrdinalBindingCount !== 0 || matrix.coverage.semanticAuthorityCount !== 0, 'matrix_promotion')
  const witness = matrix?.directPalaceWitnesses?.at(-1)
  failure(failures, witness?.sourceId !== SOURCE_CNTS_00047996572 || witness.completeRelativeOrder !== false || witness.physicalSlotBound !== false || witness.productionOrdinalBound !== false, 'matrix_new_palace_component_boundary')
  const grid = matrix?.directBranchPhysicalGridWitnesses?.at(-1)
  failure(failures, grid?.sourceId !== SOURCE_CNTS_00047996572 || grid.branchCoverage !== 12 || grid.pageAxisOnly !== true || grid.palaceNameBound !== false, 'matrix_new_grid_boundary')
  const composed = matrix?.crossPageComposedBindingFrontiers?.at(-1)
  failure(failures, composed?.sourceId !== SOURCE_CNTS_00047996572 || composed.status !== 'inferred_not_direct_single_frame' || composed.fullBinding !== false, 'matrix_cross_page_boundary')
}

function checkLineage(artifact, lineage, failures) {
  failure(failures, lineage?.schemaVersion !== SCHEMA + '-lineage-v0', 'lineage_schema')
  failure(failures, lineage?.status !== 'derived_not_authoritative' || lineage.independentWitnessStatus !== 'not_admitted', 'lineage_authority')
  const direct = lineage?.directPalaceWitnesses?.at(-1)
  failure(failures, direct?.sourceId !== SOURCE_CNTS_00047996572 || direct.completeRelativeOrder !== false || direct.partialNamedPalaceSequence !== true || direct.physicalSlotBinding !== false || direct.productionOrdinalBinding !== false || direct.independentHistoricalWitnessAdmitted !== false, 'lineage_palace_component_boundary')
  const grid = lineage?.branchGridWitnesses?.at(-1)
  failure(failures, grid?.sourceId !== SOURCE_CNTS_00047996572 || grid.branchCoverage !== 12 || grid.pageAxisOnly !== true || grid.palaceNameBinding !== false || grid.productionOrdinalBinding !== false, 'lineage_grid_boundary')
  failure(failures, lineage?.sameManuscriptCrossPageComposition?.relationId !== RELATION_CNTS_CROSS_PAGE || lineage.sameManuscriptCrossPageComposition.crossPageJoin !== 'inferred_not_direct_single_frame' || lineage.sameManuscriptCrossPageComposition.physicalSlotBinding !== false, 'lineage_cross_page_boundary')
  failure(failures, lineage?.candidateReview?.candidates?.find(item => item.candidateId === 'candidate-cnts-00047996572-anonymous-manuscript')?.doesNotEnterGraph !== false, 'lineage_candidate_admission')
  failure(failures, lineage?.earlierEdition1871?.textualLineageClosed !== false || lineage.earlierEdition1871.catalogFormatComparisonDirectBytes !== false, 'lineage_1871_boundary')
}

function checkGraph(artifact, graph, failures) {
  failure(failures, graph?.predecessor?.claimCount !== 30 || graph.predecessor.sourceCount !== 20 || graph.predecessor.observationCount !== 56 || graph.predecessor.relationCount !== 147 || graph.predecessor.blockerCount !== 11, 'predecessor_graph_counts')
  failure(failures, graph?.additive?.claimCount !== 0 || graph.additive.sourceCount !== 1 || graph.additive.physicalWitnessCount !== 1 || graph.additive.observationCount !== 2 || graph.additive.relationCount !== 1 || graph.additive.blockerCount !== 0, 'additive_graph_counts')
  failure(failures, graph?.successor?.claimCount !== 30 || graph.successor.sourceCount !== 21 || graph.successor.observationCount !== 58 || graph.successor.relationCount !== 148 || graph.successor.blockerCount !== 11, 'successor_graph_counts')
  failure(failures, JSON.stringify(graph?.blockersClosed) !== JSON.stringify([]) || JSON.stringify(graph?.blockersStillOpen) !== JSON.stringify(BLOCKERS), 'blocker_closure')
  failure(failures, graph?.independentPhysicalWitnessesAdmitted !== 0, 'independent_witness_promotion')
  failure(failures, !graph?.addedObservationIds?.includes(OBSERVATION_CNTS_P6) || !graph.addedObservationIds.includes(OBSERVATION_CNTS_P13) || !graph.addedRelationIds?.includes(RELATION_CNTS_CROSS_PAGE), 'graph_added_ids')
}

function checkScopeAndReadiness(artifact, failures) {
  failure(failures, artifact.scope?.historical1871ScanObtained !== false || artifact.scope.directSingleWitnessFullBindingEstablished !== false, 'scope_binding_promotion')
  failure(failures, artifact.scope?.physicalWitnessCandidatesAdded !== 4 || artifact.scope.sourceAuthorityPromoted !== false || artifact.scope.semanticAuthorityPromoted !== false || artifact.scope.independentWitnessesAdmitted !== 0, 'scope_authority_promotion')
  failure(failures, artifact.scope?.researchCandidatesAdmitted !== 1 || artifact.scope?.heldOutResearchCandidateCount !== 9, 'scope_frontier_admission')
  failure(failures, artifact.readinessImpact?.readiness !== 'not_safe_to_start' || artifact.readinessImpact.grounding !== 'blocked' || artifact.readinessImpact.activation !== 'experimental_only' || artifact.readinessImpact.rotation06 !== 'representation_only', 'readiness_boundary')
  failure(failures, artifact.preservation?.predecessorArtifactsRewritten !== false || artifact.preservation.historicalPredecessorBytesRewritten !== false || artifact.preservation.existingFieldKitRewritten !== false || artifact.preservation.productionChanged !== false || artifact.preservation.remoteDatabaseChanged !== false || artifact.preservation.deploymentPerformed !== false, 'preservation_boundary')
  failure(failures, artifact.deterministicContract?.generatedAt !== 'forbidden' || artifact.deterministicContract.network !== 'forbidden_during_materialization' || artifact.deterministicContract.noAutomaticPromotion !== true, 'deterministic_contract')
}

export function checkBundle(artifact, root = ROOT, completePath = resolve(root, ARTIFACT_PATH)) {
  const failures = []
  let expected
  try { expected = buildBundle(root, { mode: 'historical_reference' }).artifact } catch (error) { return ['rebuild_failed:' + error.message] }
  const historical = checkHistoricalRepositoryBasis(root, BASIS_HEAD, { expectedBranch: 'main' })
  failure(failures, historical.errors.length > 0, 'historical_repository_basis:' + historical.errors.join(','))
  failure(failures, artifact?.schemaVersion !== SCHEMA || artifact?.verdictToken !== 'complete_ziwei_palace_branch_slot_composition_with_same_manuscript_cross_page_frontier_derived_not_authoritative', 'schema_or_verdict')
  failure(failures, artifact?.basisHead !== BASIS_HEAD || artifact?.branch !== 'main', 'basis_or_branch')
  failure(failures, !canonicalStableArtifactJson(artifact) || canonicalStableArtifactJson(artifact) !== canonicalStableArtifactJson(expected), 'stable_content_not_reproducible')
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
  checkSource(artifact, failures)
  checkObservationsAndRelation(artifact, failures)
  const side = companions(completePath)
  checkEvidence(artifact, side['evidence.json'], failures)
  checkMatrix(artifact, side['binding-matrix.json'], failures)
  checkLineage(artifact, side['lineage-assessment.json'], failures)
  checkGraph(artifact, side['graph-reconciliation.json'].graphImpact, failures)
  checkScopeAndReadiness(artifact, failures)
  failure(failures, canonicalStableArtifactJson(artifact.evidence) !== canonicalStableArtifactJson(side['evidence.json']), 'evidence_copy')
  failure(failures, canonicalStableArtifactJson(artifact.bindingMatrix) !== canonicalStableArtifactJson(side['binding-matrix.json']), 'matrix_copy')
  failure(failures, canonicalStableArtifactJson(artifact.lineageAssessment) !== canonicalStableArtifactJson(side['lineage-assessment.json']), 'lineage_copy')
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
  const actualCompanions = companions(completePath)
  const expected = buildBundle(root, { mode: 'historical_reference' }).files
  for (const name of OUTPUT_NAMES) failure(failures, canonicalStableArtifactJson(actualCompanions[name]) !== canonicalStableArtifactJson(expected[name]), 'stable_companion:' + name)
  return unique(failures)
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const errors = checkArtifact(ROOT, resolve(process.argv[2] || ARTIFACT_PATH))
  console.log(JSON.stringify({ schema: SCHEMA, pass: errors.length === 0, errors }, null, 2))
  if (errors.length) process.exitCode = 1
}
