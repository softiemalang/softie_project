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
  INPUT_PATHS,
  MATERIALIZER_PATH,
  MATERIALIZER_VERSION,
  NARA_IMAGE_ROWS,
  NARA_MANIFESTS,
  NARA_SOURCE_IDS,
  NDL_COMPILED_MANIFEST_URL,
  NDL_COMPILED_RECORD_URL,
  NDL_MANUSCRIPT_MANIFEST_URL,
  NDL_MANUSCRIPT_RECORD_URL,
  PREDECESSOR_COMPOSITION,
  PREDECESSOR_COMPOSITION_EVIDENCE,
  PROTECTED_ASSET_PATH,
  ROOT,
  SCHEMA,
  VERDICT,
  buildBundle,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v5.mjs'
import * as v4 from './materialize-ziwei-p0-palace-branch-slot-composition-v4.mjs'
import * as v3 from './materialize-ziwei-p0-palace-branch-slot-composition-v3.mjs'

const HARVARD_SOURCE_ID = v4.HARVARD_SOURCE_ID
const GOOGLE_SOURCE_ID = v4.GOOGLE_SOURCE_ID
const CATALOG_1871_SOURCE_ID = v4.CATALOG_1871_SOURCE_ID
const RITSUMEIKAN_SOURCE_ID = 'candidate-youyi-lu-ritsumeikan-bn08364312-1871-catalog-only'

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

function checkNara(candidate, failures) {
  failure(failures, candidate?.directVisualReview !== true || candidate?.directObservationStatus !== 'direct_visual_original_scan_image_review', 'nara_direct_review')
  failure(failures, JSON.stringify(candidate?.sourceIdentity?.itemIds) !== JSON.stringify(NARA_SOURCE_IDS), 'nara_item_identity')
  failure(failures, candidate?.sourceIdentity?.sameRecordEditionPair !== true || candidate?.sourceIdentity?.independentHistoricalWitness !== false, 'nara_independence_boundary')
  failure(failures, canonicalStableArtifactJson(candidate?.sourceIdentity?.manifests) !== canonicalStableArtifactJson(NARA_MANIFESTS), 'nara_manifest_identity')
  failure(failures, JSON.stringify(candidate?.locators?.reviewedLeafRanges) !== JSON.stringify([
    { itemId: '4468520', leaves: [84, 92], role: '安天府圖 and branch/rule table run' },
    { itemId: '4469314', leaves: [64, 80], role: 'worked natal chart example run' },
  ]), 'nara_leaf_ranges')
  const images = candidate?.locators?.reviewedImages || []
  const expectedRows = Object.entries(NARA_IMAGE_ROWS).flatMap(([itemId, rows]) => rows.map(([leaf, bytes, byteSha256]) => ({ itemId, leaf, bytes, byteSha256 })))
  failure(failures, images.length !== expectedRows.length, 'nara_image_count')
  for (const expected of expectedRows) {
    const row = images.find(item => item.leaf === expected.leaf && item.canvasId?.includes('/' + (expected.itemId === '4468520' ? '4468520' : '4469314') + '/'))
    failure(failures, !row || row.bytes !== expected.bytes || row.byteSha256 !== expected.byteSha256, `nara_image_identity:${expected.itemId}:${expected.leaf}`)
  }
  failure(failures, candidate?.negativeBoundary?.fullPalaceNamePerimeterObserved !== false || candidate.negativeBoundary.physicalSlotCoordinateObserved !== false || candidate.negativeBoundary.productionOrdinalObserved !== false || candidate.negativeBoundary.singleSourceFourFieldBinding !== false, 'nara_negative_boundary')
  failure(failures, candidate?.doesNotEstablish?.includes('single_source_four_field_binding') !== true || candidate.doesNotEstablish.includes('semantic authority') !== true, 'nara_does_not_establish')
}

function checkRitsumeikan(candidate, failures) {
  failure(failures, candidate?.directVisualReview !== false || candidate?.directObservationStatus !== 'catalog_record_review_only', 'ritsumeikan_review_status')
  failure(failures, candidate?.sourceIdentity?.publicationDate !== '同治10(1871)' || candidate.sourceIdentity.ciniiNcid !== 'BN08364312', 'ritsumeikan_catalog_identity')
  failure(failures, candidate?.sourceIdentity?.independentHistoricalWitness !== false || candidate?.locators?.pageImagesLocated !== false || candidate.locators.sourceBytesAcquired !== false, 'ritsumeikan_access_boundary')
  failure(failures, candidate?.comparisonTo1883?.directTextComparisonPerformed !== false || candidate.comparisonTo1883.textualLineageClosed !== false, 'ritsumeikan_comparison_boundary')
}

function checkFrontier(frontier, failures) {
  failure(failures, frontier?.schemaVersion !== SCHEMA + '-research-frontier-v0', 'frontier_schema')
  failure(failures, frontier?.status !== 'nara_chart_example_and_1871_catalog_frontier_no_new_graph_admission', 'frontier_status')
  const candidates = frontier?.candidates || []
  failure(failures, candidates.length !== 5, 'frontier_candidate_count')
  failure(failures, unique(candidates.map(item => item.candidateId)).length !== 5, 'frontier_candidate_duplicate')
  for (const candidate of candidates) checkCandidate(candidate, failures)
  failure(failures, !candidates.some(item => item.candidateId === HARVARD_SOURCE_ID), 'predecessor_harvard_missing')
  failure(failures, !candidates.some(item => item.candidateId === GOOGLE_SOURCE_ID), 'predecessor_google_missing')
  failure(failures, !candidates.some(item => item.candidateId === CATALOG_1871_SOURCE_ID), 'predecessor_1871_missing')
  checkNara(candidates.find(item => item.candidateId === 'candidate-nara-4468520-4469314-chart-example-frontier'), failures)
  checkRitsumeikan(candidates.find(item => item.candidateId === RITSUMEIKAN_SOURCE_ID), failures)

  failure(failures, frontier.comparison1871To1883?.directTextComparisonPerformed !== false || frontier.comparison1871To1883?.directByteComparisonPerformed !== false || frontier.comparison1871To1883?.independentLineageAdmitted !== false, 'frontier_1871_comparison_promotion')
  failure(failures, frontier.graphImpact?.claimsAdded !== 0 || frontier.graphImpact?.sourcesAdded?.length !== 0 || frontier.graphImpact?.observationsAdded?.length !== 0 || frontier.graphImpact?.relationsAdded?.length !== 0 || frontier.graphImpact?.blockersClosed?.length !== 0 || frontier.graphImpact?.independentPhysicalWitnessesAdmitted !== 0, 'frontier_graph_admission')
  failure(failures, frontier.readinessImpact?.readiness !== 'not_safe_to_start' || frontier.readinessImpact?.grounding !== 'blocked' || frontier.readinessImpact?.activation !== 'experimental_only' || frontier.readinessImpact?.rotation06 !== 'representation_only', 'frontier_readiness_promotion')
  failure(failures, frontier.acquisitionLeads?.length !== 4, 'acquisition_lead_count')
  for (const lead of frontier.acquisitionLeads || []) failure(failures, lead.doesNotEnterGraph !== true, 'acquisition_lead_graph_admission:' + lead.leadId)
  const manuscript = frontier.acquisitionLeads?.find(item => item.leadId === 'lead-ndl-youyi-lu-manuscript-2606209')
  const compiled = frontier.acquisitionLeads?.find(item => item.leadId === 'lead-ndl-youyi-lu-compiled-2610509')
  failure(failures, manuscript?.attemptedIiifManifestUrl !== NDL_MANUSCRIPT_MANIFEST_URL || manuscript?.attemptedManifestResult !== '404_json_checkResult_NG' || manuscript?.pageBytesAcquired !== false, 'ndl_manuscript_boundary')
  failure(failures, compiled?.attemptedIiifManifestUrl !== NDL_COMPILED_MANIFEST_URL || compiled?.attemptedManifestResult !== '404_json_checkResult_NG' || compiled?.pageBytesAcquired !== false, 'ndl_compiled_boundary')
}

function checkEvidence(artifact, evidence, failures) {
  failure(failures, evidence?.schemaVersion !== SCHEMA + '-evidence-v0', 'evidence_schema')
  failure(failures, evidence?.authorityBoundary?.includes('held outside the semantic graph') !== true, 'evidence_authority_boundary')
  checkFrontier(evidence?.researchFrontier, failures)
  failure(failures, artifact.observations?.length !== evidence.observations?.length, 'artifact_evidence_observation_copy')
  failure(failures, evidence.frontierDirectObservation?.fullBindingObserved !== false || evidence.frontierDirectObservation?.physicalSlotObserved !== false || evidence.frontierDirectObservation?.productionOrdinalObserved !== false, 'frontier_direct_observation_promotion')
  failure(failures, evidence.reportedNonObservations?.some(item => /NARA|Ritsumeikan|NDL|1871.*comparison/.test(item)) !== true, 'frontier_nonobservations')
}

function checkMatrix(artifact, matrix, failures) {
  failure(failures, matrix?.schemaVersion !== SCHEMA + '-binding-matrix-v0', 'matrix_schema')
  failure(failures, matrix?.composition?.status !== 'derived_not_authoritative', 'matrix_authority')
  failure(failures, matrix?.coverage?.directSingleWitnessFullBindingCount !== 0 || matrix?.coverage?.productionOrdinalBindingCount !== 0 || matrix?.coverage?.semanticAuthorityCount !== 0, 'matrix_promotion')
  failure(failures, matrix?.researchFrontierBoundary?.reviewedCandidateCount !== 5 || matrix.researchFrontierBoundary.admittedCandidateCount !== 0, 'matrix_frontier_boundary')
  failure(failures, artifact.bindingMatrix?.coverage?.directNamedPalaceWitnessCount !== 3, 'historical_named_witness_lost')
}

function checkLineage(artifact, lineage, failures) {
  failure(failures, lineage?.schemaVersion !== SCHEMA + '-lineage-v0', 'lineage_schema')
  failure(failures, lineage?.status !== 'derived_not_authoritative' || lineage?.independentWitnessStatus !== 'not_admitted', 'lineage_authority')
  failure(failures, lineage?.earlierEdition1871?.catalogIdentityReconfirmed !== true || lineage.earlierEdition1871.alternateCatalogHoldingReviewed !== true || lineage.earlierEdition1871.pageImagesLocated !== false || lineage.earlierEdition1871.directTextComparisonPerformed !== false || lineage.earlierEdition1871.textualLineageClosed !== false, 'lineage_1871_boundary')
  checkFrontier(lineage?.researchFrontier, failures)
}

function checkGraph(artifact, graph, failures) {
  failure(failures, graph?.predecessor?.claimCount !== 30 || graph.predecessor.sourceCount !== 17 || graph.predecessor.observationCount !== 53 || graph.predecessor.relationCount !== 143 || graph.predecessor.blockerCount !== 11, 'predecessor_graph_counts')
  failure(failures, graph?.additive?.claimCount !== 0 || graph.additive.sourceCount !== 2 || graph.additive.physicalWitnessCount !== 2 || graph.additive.observationCount !== 2 || graph.additive.relationCount !== 3 || graph.additive.blockerCount !== 0, 'additive_graph_counts')
  failure(failures, graph?.successor?.claimCount !== 30 || graph.successor.sourceCount !== 19 || graph.successor.observationCount !== 55 || graph.successor.relationCount !== 146 || graph.successor.blockerCount !== 11, 'successor_graph_counts')
  failure(failures, JSON.stringify(graph?.sourcesAdded) !== JSON.stringify([v3.SOURCE_NLC, v3.SOURCE_ZJLIB]), 'source_admission')
  failure(failures, JSON.stringify(graph?.addedObservationIds) !== JSON.stringify(['obs-youyi-nlc-p66-direct-palace-order', 'obs-youyi-zjlib-p131-p132-direct-palace-order']) || JSON.stringify(graph?.addedRelationIds) !== JSON.stringify(['relation-youyi-nlc-direct-palace-corroboration', 'relation-youyi-zjlib-direct-palace-corroboration', 'relation-youyi-cross-scan-lineage-boundary']), 'observation_relation_admission')
  failure(failures, JSON.stringify(graph?.blockersClosed) !== JSON.stringify([]) || JSON.stringify(graph?.blockersStillOpen) !== JSON.stringify(BLOCKERS), 'blocker_closure')
  failure(failures, graph?.researchFrontier?.claimsAdded !== 0 || graph.researchFrontier.sourcesAdded.length !== 0 || graph.researchFrontier.observationsAdded.length !== 0 || graph.researchFrontier.relationsAdded.length !== 0 || graph.researchFrontier.blockersClosed.length !== 0 || graph.researchFrontier.independentPhysicalWitnessesAdmitted !== 0, 'frontier_graph_impact')
  failure(failures, artifact.blockerReassessment?.some(item => item.statusBefore !== item.statusAfter || item.statusChanged !== false), 'blocker_status_promotion')
}

function checkScopeAndReadiness(artifact, failures) {
  failure(failures, artifact.scope?.researchFrontierExpanded !== true || artifact.scope.heldOutResearchCandidateCount !== 5 || artifact.scope.researchCandidatesAdmitted !== 0, 'scope_frontier_boundary')
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
