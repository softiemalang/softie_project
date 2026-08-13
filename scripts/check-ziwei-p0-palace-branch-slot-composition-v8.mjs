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
  DOCUMENTATION_PATH,
  INPUT_PATHS,
  MATERIALIZER_PATH,
  MATERIALIZER_VERSION,
  NLC_JAMISE_CANDIDATE_ID,
  NLC_JAMISE_COLLECTION_URL,
  NLC_JAMISE_CONTROL_NO,
  NLC_JAMISE_FIGURE_BYTES,
  NLC_JAMISE_FIGURE_HEIGHT,
  NLC_JAMISE_FIGURE_SHA256,
  NLC_JAMISE_FIGURE_URL,
  NLC_JAMISE_FIGURE_WIDTH,
  PREDECESSOR_COMPOSITION,
  PREDECESSOR_COMPOSITION_EVIDENCE,
  PROTECTED_ASSET_PATH,
  ROOT,
  SCHEMA,
  SHIBA_FEIXING_LEAD_ID,
  SHIBA_FEIXING_LEAD_URL,
  buildBundle,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v8.mjs'
import * as v7 from './materialize-ziwei-p0-palace-branch-slot-composition-v7.mjs'

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

function checkCandidates(frontier, failures) {
  const candidates = frontier?.candidates || []
  failure(failures, candidates.length !== 10, 'frontier_candidate_count')
  failure(failures, unique(candidates.map(item => item.candidateId)).length !== 10, 'frontier_candidate_duplicate')
  for (const candidate of candidates) {
    failure(failures, candidate?.doesNotEnterGraph !== true, 'frontier_candidate_graph_admission:' + candidate?.candidateId)
    failure(failures, typeof candidate?.decision !== 'string' || !candidate.decision.includes('no_'), 'frontier_candidate_missing_negative_decision:' + candidate?.candidateId)
  }
  const figure = candidates.find(item => item.candidateId === NLC_JAMISE_CANDIDATE_ID)
  failure(failures, figure?.sourceKind !== 'official_collection_figure_only_not_full_scan', 'figure_candidate_kind')
  failure(failures, figure?.sourceIdentity?.title !== '紫微數' || figure.sourceIdentity.author !== 'unknown' || figure.sourceIdentity.publicationDate !== 'unknown' || figure.sourceIdentity.controlNo !== NLC_JAMISE_CONTROL_NO, 'figure_candidate_identity')
  failure(failures, figure?.sourceIdentity?.fullScanIdentity !== 'not_resolved; only one curator figure was acquired', 'figure_full_scan_identity_boundary')
  failure(failures, figure?.locators?.collectionUrl !== NLC_JAMISE_COLLECTION_URL || figure.locators.viewerUrl !== 'https://viewer.nl.go.kr/main.wviewer?cno=KOL200200680&sysid=homepage' || figure.locators.figureUrl !== NLC_JAMISE_FIGURE_URL, 'figure_locator')
  failure(failures, figure?.locators?.figureBytesAcquired !== true || figure.locators.figureByteSha256 !== NLC_JAMISE_FIGURE_SHA256 || figure.locators.figureByteLength !== NLC_JAMISE_FIGURE_BYTES, 'figure_bytes_identity')
  failure(failures, figure?.locators?.figureDimensions?.width !== NLC_JAMISE_FIGURE_WIDTH || figure.locators.figureDimensions.height !== NLC_JAMISE_FIGURE_HEIGHT, 'figure_dimensions')
  failure(failures, figure?.locators?.fullSourceBytesAcquired !== false || figure.locators.sourceBytesAcquired !== false || figure.locators.sourceBytesScope !== 'figure_only_not_full_source' || figure.locators.fullScanAccess !== 'not_obtained_in_current_external_session', 'figure_full_source_boundary')
  failure(failures, figure?.directVisualReview !== true || figure.directObservationStatus !== 'figure_only_direct_visual_review_no_full_source', 'figure_review_status')
  failure(failures, figure?.bindingBoundary?.fullFourFieldBinding !== false, 'figure_full_binding_promotion')
  failure(failures, figure?.bindingBoundary?.branchToken?.directlyBound !== false || figure.bindingBoundary.palaceName.directlyBound !== false || figure.bindingBoundary.physicalSlot.directlyBound !== false || figure.bindingBoundary.ordinalDirection.directlyBound !== false, 'figure_binding_field_promotion')
  failure(failures, figure?.comparisonToExistingGraph?.sameSystemAsYouyiOrNanbei !== 'not_established', 'figure_system_identity_promotion')
}

function checkFrontier(frontier, failures) {
  failure(failures, frontier?.schemaVersion !== SCHEMA + '-research-frontier-v0', 'frontier_schema')
  failure(failures, frontier?.status !== 'direct_figure_and_1870_acquisition_lead_no_graph_admission', 'frontier_status')
  checkCandidates(frontier, failures)
  failure(failures, frontier?.graphImpact?.claimsAdded !== 0 || frontier.graphImpact.sourcesAdded.length !== 0 || frontier.graphImpact.observationsAdded.length !== 0 || frontier.graphImpact.relationsAdded.length !== 0 || frontier.graphImpact.blockersClosed.length !== 0 || frontier.graphImpact.independentPhysicalWitnessesAdmitted !== 0, 'frontier_graph_admission')
  failure(failures, frontier?.readinessImpact?.readiness !== 'not_safe_to_start' || frontier.readinessImpact.grounding !== 'blocked' || frontier.readinessImpact.activation !== 'experimental_only' || frontier.readinessImpact.rotation06 !== 'representation_only', 'frontier_readiness_promotion')
  failure(failures, frontier?.frontierOnlyObservations?.length !== 1 || frontier.frontierOnlySources?.length !== 1 || frontier.frontierOnlySources[0] !== NLC_JAMISE_CANDIDATE_ID, 'frontier_only_counts')
  const figureObservation = frontier?.frontierOnlyObservations?.find(item => item.observationId === 'frontier-obs-nlc-jamise-figure-only-circular-diagram')
  failure(failures, figureObservation?.candidateId !== NLC_JAMISE_CANDIDATE_ID || figureObservation.graphAdmission !== false || figureObservation.sourceAdmission !== false || figureObservation.semanticAuthority !== false, 'frontier_figure_observation_admission')
  failure(failures, figureObservation?.locator?.figureByteSha256 !== NLC_JAMISE_FIGURE_SHA256 || figureObservation.locator.figureByteLength !== NLC_JAMISE_FIGURE_BYTES, 'frontier_figure_observation_identity')
  failure(failures, figureObservation?.fourFieldBinding?.branchToken !== 'not_bound' || figureObservation.fourFieldBinding.palaceName !== 'not_bound' || figureObservation.fourFieldBinding.physicalSlot !== 'not_bound' || figureObservation.fourFieldBinding.ordinalDirection !== 'not_bound' || figureObservation.fourFieldBinding.fullBindingObserved !== false, 'frontier_figure_binding_promotion')
  failure(failures, frontier?.acquisitionLeads?.length !== 9, 'acquisition_lead_count')
  for (const lead of frontier.acquisitionLeads || []) failure(failures, lead.doesNotEnterGraph !== true, 'acquisition_lead_graph_admission:' + lead.leadId)
  const shiba = frontier.acquisitionLeads?.find(item => item.leadId === SHIBA_FEIXING_LEAD_ID)
  failure(failures, shiba?.url !== SHIBA_FEIXING_LEAD_URL || shiba.sourceBytesAcquired !== false || shiba.pageImagesLocated !== false || shiba.directPageReview !== false || shiba.institutionalRecordType !== 'secondary_AKS_Sillokwiki_entry', 'shiba_lead_boundary')
  failure(failures, frontier.comparison1871To1883?.figureOnlySourceReviewed !== true || frontier.comparison1871To1883.figureOnlySourceFullScanAcquired !== false || frontier.comparison1871To1883.directFigureToYouyiSlotComparisonPerformed !== false || frontier.comparison1871To1883.directTextComparisonPerformed !== false || frontier.comparison1871To1883.directByteComparisonPerformed !== false || frontier.comparison1871To1883.textualLineageClosed !== false || frontier.comparison1871To1883.independentLineageAdmitted !== false, 'frontier_comparison_promotion')
}

function checkEvidence(artifact, evidence, failures) {
  failure(failures, evidence?.schemaVersion !== SCHEMA + '-evidence-v0', 'evidence_schema')
  failure(failures, evidence?.authorityBoundary?.includes('figure-only') !== true || evidence.authorityBoundary.includes('remain unchanged') !== true, 'evidence_authority_boundary')
  checkFrontier(evidence?.researchFrontier, failures)
  failure(failures, JSON.stringify(evidence?.frontierFigureOnlySources) !== JSON.stringify([NLC_JAMISE_CANDIDATE_ID]), 'evidence_figure_only_sources')
  failure(failures, evidence?.frontierFigureOnlyObservation?.fourFieldBinding?.fullBindingObserved !== false, 'evidence_figure_binding_promotion')
  failure(failures, evidence?.frontierSecondaryAcquisitionLead?.leadId !== SHIBA_FEIXING_LEAD_ID, 'evidence_secondary_lead_copy')
  failure(failures, artifact.observations?.length !== evidence.observations?.length, 'artifact_evidence_observation_copy')
  failure(failures, evidence.reportedNonObservations?.some(item => /figure-only|1870|full source bytes|exact branch-token/.test(item)) !== true, 'v8_nonobservations')
}

function checkMatrix(artifact, matrix, failures) {
  failure(failures, matrix?.schemaVersion !== SCHEMA + '-binding-matrix-v0', 'matrix_schema')
  failure(failures, matrix?.composition?.status !== 'derived_not_authoritative', 'matrix_authority')
  failure(failures, matrix?.coverage?.directSingleWitnessFullBindingCount !== 0 || matrix.coverage.productionOrdinalBindingCount !== 0 || matrix.coverage.semanticAuthorityCount !== 0, 'matrix_promotion')
  failure(failures, matrix?.researchFrontierBoundary?.reviewedCandidateCount !== 10 || matrix.researchFrontierBoundary.admittedCandidateCount !== 0 || matrix.researchFrontierBoundary.figureOnlyCandidateCount !== 1 || matrix.researchFrontierBoundary.secondaryAcquisitionLeadCount !== 1, 'matrix_frontier_boundary')
  failure(failures, matrix?.figureOnlyBindingRows?.length !== 4 || matrix.figureOnlyBindingRows.some(row => row.bindingStatus !== 'not_bound'), 'matrix_figure_rows')
  failure(failures, artifact.bindingMatrix?.coverage?.directNamedPalaceWitnessCount !== 3, 'historical_named_witness_lost')
}

function checkLineage(artifact, lineage, failures) {
  failure(failures, lineage?.schemaVersion !== SCHEMA + '-lineage-v0', 'lineage_schema')
  failure(failures, lineage?.status !== 'derived_not_authoritative' || lineage.independentWitnessStatus !== 'not_admitted', 'lineage_authority')
  failure(failures, lineage?.earlierEdition1871?.catalogFormatComparisonPerformed !== true || lineage.earlierEdition1871.catalogFormatComparisonDirectText !== false || lineage.earlierEdition1871.catalogFormatComparisonDirectBytes !== false || lineage.earlierEdition1871.catalogFormatComparisonBlockLineageClosed !== false || lineage.earlierEdition1871.textualLineageClosed !== false, 'lineage_format_boundary')
  failure(failures, lineage?.figureOnlyLineageBoundary?.candidateId !== NLC_JAMISE_CANDIDATE_ID || lineage.figureOnlyLineageBoundary.fullSourceBytesAcquired !== false || lineage.figureOnlyLineageBoundary.independentWitnessAdmitted !== false || lineage.figureOnlyLineageBoundary.physicalSlotAndOrdinal !== 'not_observed', 'lineage_figure_boundary')
  failure(failures, lineage?.secondary1870AcquisitionLead?.leadId !== SHIBA_FEIXING_LEAD_ID || lineage.secondary1870AcquisitionLead.originalPageBytesAcquired !== false || lineage.secondary1870AcquisitionLead.independentWitnessAdmitted !== false, 'lineage_1870_boundary')
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
  failure(failures, artifact.scope?.researchFrontierExpanded !== true || artifact.scope.heldOutResearchCandidateCount !== 10 || artifact.scope.researchCandidatesAdmitted !== 0 || artifact.scope.figureOnlyCandidateCount !== 1 || artifact.scope.secondaryAcquisitionLeadCount !== 1, 'scope_frontier_boundary')
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
  failure(failures, artifact?.schemaVersion !== SCHEMA || artifact?.verdictToken !== 'complete_ziwei_palace_branch_slot_composition_with_figure_only_and_1870_acquisition_lead_derived_not_authoritative', 'schema_or_verdict')
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
