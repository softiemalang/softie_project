import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'

import {
  canonicalStableArtifactJson,
  checkArtifactIdentity,
  checkHistoricalRepositoryBasis,
} from '../src/artifactIdentity.js'
import {
  ARTIFACT_DIR,
  ARTIFACT_PATH,
  BASIS_HEAD,
  CATALOG_1882_SOURCE_ID,
  CATALOG_1882_URL,
  CATALOG_1897_SOURCE_ID,
  CATALOG_1897_URL,
  CATALOG_1902_OPAC_URL,
  CATALOG_1902_SOURCE_ID,
  CATALOG_1902_URL,
  CATALOG_1902_HANDLE_URL,
  DOCUMENTATION_PATH,
  INPUT_PATHS,
  MATERIALIZER_PATH,
  MATERIALIZER_VERSION,
  PREDECESSOR_COMPOSITION,
  PREDECESSOR_COMPOSITION_EVIDENCE,
  PROTECTED_ASSET_PATH,
  ROOT,
  SCHEMA,
  VERDICT,
  buildBundle,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v7.mjs'
import * as v6 from './materialize-ziwei-p0-palace-branch-slot-composition-v6.mjs'

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

function checkCandidate(candidate, failures) {
  failure(failures, candidate?.doesNotEnterGraph !== true, 'frontier_candidate_graph_admission:' + candidate?.candidateId)
  failure(failures, typeof candidate?.decision !== 'string' || !candidate.decision.includes('no_'), 'frontier_candidate_missing_negative_decision:' + candidate?.candidateId)
}

function checkNewCatalogCandidates(frontier, failures) {
  const c1902 = frontier.candidates.find(item => item.candidateId === CATALOG_1902_SOURCE_ID)
  const c1897 = frontier.candidates.find(item => item.candidateId === CATALOG_1897_SOURCE_ID)
  const c1882 = frontier.candidates.find(item => item.candidateId === CATALOG_1882_SOURCE_ID)
  failure(failures, c1902?.sourceIdentity?.ncid !== 'BA85312898' || c1902.sourceIdentity.publicationDate !== '[光緒28年 (1902)]' || c1902.sourceIdentity.holding !== 'Kyushu University Central Library', 'catalog_1902_identity')
  failure(failures, c1902?.locators?.pageImagesLocated !== false || c1902.locators.sourceBytesAcquired !== false || c1902.locators.imageAvailable !== false || c1902.catalogObservation.opacUrl !== CATALOG_1902_OPAC_URL || c1902.catalogObservation.handleUrl !== CATALOG_1902_HANDLE_URL, 'catalog_1902_no_image_boundary')
  failure(failures, c1902?.catalogObservation?.recordUrl !== CATALOG_1902_URL || !c1902.catalogObservation.observedFields.includes('Size: 24.2×15.3cm'), 'catalog_1902_observation')
  failure(failures, c1897?.sourceIdentity?.ncid !== 'BA90448039' || c1897.sourceIdentity.publicationDate !== '光緒23 [1897] 刊' || c1897.sourceIdentity.holding !== 'Bukkyo University Library', 'catalog_1897_identity')
  failure(failures, c1897?.locators?.pageImagesLocated !== false || c1897.locators.sourceBytesAcquired !== false || c1897.locators.imageAvailable !== false || c1897.catalogObservation.recordUrl !== CATALOG_1897_URL, 'catalog_1897_no_image_boundary')
  failure(failures, c1882?.sourceIdentity?.recordId !== '000007637258' || c1882.sourceIdentity.publicationDate !== '光緒8重定刊 (1882)', 'catalog_1882_identity')
  failure(failures, c1882?.locators?.pidRouteLocated !== false || c1882.locators.pageImagesLocated !== false || c1882.locators.sourceBytesAcquired !== false || c1882.locators.imageAvailable !== false || c1882.catalogObservation.recordUrl !== CATALOG_1882_URL, 'catalog_1882_no_pid_boundary')
  failure(failures, c1882?.catalogObservation?.observedFields.includes('Colophon note: 同治十年秋八月曾國藩署檢') !== true, 'catalog_1882_colophon_locator')
}

function checkFormatComparison(frontier, failures) {
  const format = frontier.catalogFormatComparison
  failure(failures, format?.status !== 'catalog_metadata_partial_comparison_text_byte_block_lineage_open', 'format_comparison_status')
  failure(failures, format?.directObservationStatus !== 'catalog_metadata_comparison_only' || format.directTextComparisonPerformed !== false || format.directColophonComparisonPerformed !== false || format.directByteComparisonPerformed !== false || format.blockLineageClosed !== false || format.independentWitnessAdmitted !== false, 'format_comparison_promotion')
  failure(failures, format?.source1871?.url !== 'https://ci.nii.ac.jp/ncid/BD19656670' || format.source1871.size !== '23.6x15.0cm' || format.source1871.notes[0] !== '左右双辺有界10行21字注文双行', 'format_1871_identity')
  failure(failures, format?.source1883?.url !== 'https://ci.nii.ac.jp/ncid/BB19945538' || format.source1883.size !== '23.4×15.1cm' || format.source1883.notes[0] !== '左右双辺有界10行21字注文双行', 'format_1883_identity')
  failure(failures, format?.catalogLevelMatches?.length !== 2 || format.catalogLevelDifferences?.length !== 4, 'format_comparison_rows')
  failure(failures, typeof format?.inferenceBoundary !== 'string' || !format.inferenceBoundary.includes('does not establish'), 'format_inference_boundary')
  const comparison = frontier.comparison1871To1883
  failure(failures, comparison?.catalogFormatComparisonPerformed !== true || comparison.catalogFormatComparison?.status !== format.status, 'frontier_format_comparison_copy')
  failure(failures, comparison?.directTextComparisonPerformed !== false || comparison.directByteComparisonPerformed !== false || comparison.textualLineageClosed !== false || comparison.independentLineageAdmitted !== false, 'frontier_lineage_promotion')
}

function checkFrontier(frontier, failures) {
  failure(failures, frontier?.schemaVersion !== SCHEMA + '-research-frontier-v0', 'frontier_schema')
  failure(failures, frontier?.status !== 'catalog_format_comparison_no_new_graph_admission', 'frontier_status')
  const candidates = frontier?.candidates || []
  failure(failures, candidates.length !== 9, 'frontier_candidate_count')
  failure(failures, unique(candidates.map(item => item.candidateId)).length !== 9, 'frontier_candidate_duplicate')
  for (const candidate of candidates) checkCandidate(candidate, failures)
  failure(failures, !candidates.some(item => item.candidateId === 'candidate-nara-4468520-4469314-chart-example-frontier'), 'predecessor_nara_missing')
  failure(failures, !candidates.some(item => item.candidateId === 'candidate-youyi-lu-nagoya-ba87134054-catalog-no-image'), 'predecessor_nagoya_missing')
  checkNewCatalogCandidates(frontier, failures)
  checkFormatComparison(frontier, failures)
  failure(failures, frontier.graphImpact?.claimsAdded !== 0 || frontier.graphImpact.sourcesAdded.length !== 0 || frontier.graphImpact.observationsAdded.length !== 0 || frontier.graphImpact.relationsAdded.length !== 0 || frontier.graphImpact.blockersClosed.length !== 0 || frontier.graphImpact.independentPhysicalWitnessesAdmitted !== 0, 'frontier_graph_admission')
  failure(failures, frontier.readinessImpact?.readiness !== 'not_safe_to_start' || frontier.readinessImpact.grounding !== 'blocked' || frontier.readinessImpact.activation !== 'experimental_only' || frontier.readinessImpact.rotation06 !== 'representation_only', 'frontier_readiness_promotion')
  failure(failures, frontier.acquisitionLeads?.length !== 8, 'acquisition_lead_count')
  for (const lead of frontier.acquisitionLeads || []) failure(failures, lead.doesNotEnterGraph !== true, 'acquisition_lead_graph_admission:' + lead.leadId)
  const catalog1902 = frontier.acquisitionLeads?.find(item => item.leadId === 'lead-cinii-youyi-lu-1902-kyushu-catalog-only')
  const catalog1897 = frontier.acquisitionLeads?.find(item => item.leadId === 'lead-cinii-youyi-lu-1897-bukkyo-catalog-only')
  const catalog1882 = frontier.acquisitionLeads?.find(item => item.leadId === 'lead-ndl-chunzaitang-1882-catalog-no-pid')
  failure(failures, catalog1902?.sourceId !== CATALOG_1902_SOURCE_ID || catalog1902.url !== CATALOG_1902_URL || catalog1902.pageImagesLocated !== false || catalog1902.sourceBytesAcquired !== false, 'lead_1902_boundary')
  failure(failures, catalog1897?.sourceId !== CATALOG_1897_SOURCE_ID || catalog1897.url !== CATALOG_1897_URL || catalog1897.pageImagesLocated !== false || catalog1897.sourceBytesAcquired !== false, 'lead_1897_boundary')
  failure(failures, catalog1882?.sourceId !== CATALOG_1882_SOURCE_ID || catalog1882.url !== CATALOG_1882_URL || catalog1882.pidRouteLocated !== false || catalog1882.pageImagesLocated !== false || catalog1882.sourceBytesAcquired !== false, 'lead_1882_boundary')
}

function checkEvidence(artifact, evidence, failures) {
  failure(failures, evidence?.schemaVersion !== SCHEMA + '-evidence-v0', 'evidence_schema')
  failure(failures, evidence?.authorityBoundary?.includes('No catalog field is admitted') !== true, 'evidence_authority_boundary')
  checkFrontier(evidence?.researchFrontier, failures)
  failure(failures, JSON.stringify(evidence?.frontierCatalogOnlySources) !== JSON.stringify([CATALOG_1902_SOURCE_ID, CATALOG_1897_SOURCE_ID, CATALOG_1882_SOURCE_ID]), 'evidence_catalog_only_sources')
  failure(failures, artifact.observations?.length !== evidence.observations?.length, 'artifact_evidence_observation_copy')
  failure(failures, evidence.frontierDirectObservation?.fullBindingObserved !== false || evidence.frontierDirectObservation?.physicalSlotObserved !== false || evidence.frontierDirectObservation?.productionOrdinalObserved !== false, 'frontier_direct_observation_promotion')
  failure(failures, evidence.reportedNonObservations?.some(item => /catalog format|1902|1897|1882|NDL metadata/.test(item)) !== true, 'v7_nonobservations')
}

function checkMatrix(artifact, matrix, failures) {
  failure(failures, matrix?.schemaVersion !== SCHEMA + '-binding-matrix-v0', 'matrix_schema')
  failure(failures, matrix?.composition?.status !== 'derived_not_authoritative', 'matrix_authority')
  failure(failures, matrix?.coverage?.directSingleWitnessFullBindingCount !== 0 || matrix.coverage.productionOrdinalBindingCount !== 0 || matrix.coverage.semanticAuthorityCount !== 0, 'matrix_promotion')
  failure(failures, matrix?.researchFrontierBoundary?.reviewedCandidateCount !== 9 || matrix.researchFrontierBoundary.admittedCandidateCount !== 0, 'matrix_frontier_boundary')
  failure(failures, artifact.bindingMatrix?.coverage?.directNamedPalaceWitnessCount !== 3, 'historical_named_witness_lost')
}

function checkLineage(artifact, lineage, failures) {
  failure(failures, lineage?.schemaVersion !== SCHEMA + '-lineage-v0', 'lineage_schema')
  failure(failures, lineage?.status !== 'derived_not_authoritative' || lineage.independentWitnessStatus !== 'not_admitted', 'lineage_authority')
  failure(failures, lineage?.earlierEdition1871?.catalogFormatComparisonPerformed !== true || lineage.earlierEdition1871.catalogFormatComparisonDirectText !== false || lineage.earlierEdition1871.catalogFormatComparisonDirectBytes !== false || lineage.earlierEdition1871.catalogFormatComparisonBlockLineageClosed !== false || lineage.earlierEdition1871.textualLineageClosed !== false, 'lineage_format_boundary')
  checkFrontier(lineage?.researchFrontier, failures)
}

function checkGraph(artifact, graph, failures) {
  failure(failures, graph?.predecessor?.claimCount !== 30 || graph.predecessor.sourceCount !== 17 || graph.predecessor.observationCount !== 53 || graph.predecessor.relationCount !== 143 || graph.predecessor.blockerCount !== 11, 'predecessor_graph_counts')
  failure(failures, graph?.additive?.claimCount !== 0 || graph.additive.sourceCount !== 2 || graph.additive.physicalWitnessCount !== 2 || graph.additive.observationCount !== 2 || graph.additive.relationCount !== 3 || graph.additive.blockerCount !== 0, 'additive_graph_counts')
  failure(failures, graph?.successor?.claimCount !== 30 || graph.successor.sourceCount !== 19 || graph.successor.observationCount !== 55 || graph.successor.relationCount !== 146 || graph.successor.blockerCount !== 11, 'successor_graph_counts')
  failure(failures, JSON.stringify(graph?.blockersClosed) !== JSON.stringify([]) || JSON.stringify(graph?.blockersStillOpen) !== JSON.stringify(BLOCKERS), 'blocker_closure')
  failure(failures, graph?.researchFrontier?.claimsAdded !== 0 || graph.researchFrontier.sourcesAdded.length !== 0 || graph.researchFrontier.observationsAdded.length !== 0 || graph.researchFrontier.relationsAdded.length !== 0 || graph.researchFrontier.blockersClosed.length !== 0 || graph.researchFrontier.independentPhysicalWitnessesAdmitted !== 0, 'frontier_graph_impact')
  failure(failures, artifact.blockerReassessment?.some(item => item.statusBefore !== item.statusAfter || item.statusChanged !== false), 'blocker_status_promotion')
}

function checkScopeAndReadiness(artifact, failures) {
  failure(failures, artifact.scope?.researchFrontierExpanded !== true || artifact.scope.heldOutResearchCandidateCount !== 9 || artifact.scope.researchCandidatesAdmitted !== 0, 'scope_frontier_boundary')
  failure(failures, artifact.scope?.sourceAuthorityPromoted !== false || artifact.scope.semanticAuthorityPromoted !== false || artifact.scope.productionChanged !== false || artifact.scope.independentWitnessesAdmitted !== 0, 'scope_promotion')
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
  failure(failures, artifact?.schemaVersion !== SCHEMA || artifact?.verdictToken !== VERDICT, 'schema_or_verdict')
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
