import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'

import {
  canonicalStableArtifactJson,
  checkArtifactIdentity,
  checkHistoricalRepositoryBasis,
  stableArtifactContentEqual,
} from '../src/artifactIdentity.js'
import {
  ARTIFACT_PATH,
  BASIS_HEAD,
  INPUT_PATHS,
  MATERIALIZER_PATH,
  MATERIALIZER_VERSION,
  NLC_PAGE66_RENDER_SHA256,
  NLC_PDF_SHA256,
  PREDECESSOR_COMPOSITION,
  PREDECESSOR_COMPOSITION_EVIDENCE,
  PROTECTED_ASSET_PATH,
  ROOT,
  SCHEMA,
  SOURCE_NLC,
  SOURCE_ZJLIB,
  VERDICT,
  ZJLIB_PAGE131_RENDER_SHA256,
  ZJLIB_PAGE132_RENDER_SHA256,
  ZJLIB_PDF_SHA256,
  buildBundle,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v3.mjs'

export const COMPLETE_PATH = ARTIFACT_PATH

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const parse = path => JSON.parse(readFileSync(path, 'utf8'))
const failure = (list, condition, message) => { if (condition) list.push(message) }
const unique = values => [...new Set(values)]
const OUTPUT_NAMES = ['evidence.json', 'binding-matrix.json', 'lineage-assessment.json', 'graph-reconciliation.json', 'field-kit-impact.json']
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
const EXPECTED_NEW_OBSERVATIONS = ['obs-youyi-nlc-p66-direct-palace-order', 'obs-youyi-zjlib-p131-p132-direct-palace-order']
const EXPECTED_NEW_RELATIONS = [
  'relation-youyi-nlc-direct-palace-corroboration',
  'relation-youyi-zjlib-direct-palace-corroboration',
  'relation-youyi-cross-scan-lineage-boundary',
]
const EXPECTED_PALACES = ['命宮', '兄弟宮', '夫妻宮', '子息宮', '財帛宮', '疾厄宮', '遷移宮', '奴僕宮', '官祿宮', '田宅宮', '福德宮', '父母宮']

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
    failure(failures, !existsSync(resolve(root, row.path)), 'missing_predecessor:' + row.path)
    if (existsSync(resolve(root, row.path))) failure(failures, row.byteSha256 !== sha256(readFileSync(resolve(root, row.path))), 'predecessor_byte_identity:' + row.path)
  }
  for (const path of INPUT_PATHS) failure(failures, !existsSync(resolve(root, path)), 'missing_input:' + path)
  failure(failures, artifact.preservation?.protectedAsset?.canonicalPath !== PROTECTED_ASSET_PATH, 'protected_asset_path')
  failure(failures, artifact.preservation?.protectedAsset?.byteSha256 !== sha256(readFileSync(resolve(root, PROTECTED_ASSET_PATH))), 'protected_asset_hash')
}

function checkEvidence(artifact, evidence, failures) {
  failure(failures, evidence?.schemaVersion !== SCHEMA + '-evidence-v0', 'evidence_schema')
  failure(failures, evidence?.authorityBoundary !== 'The complete four-field matrix remains a composition; the added scans directly corroborate named-palace order and worked examples but no reviewed page directly witnesses all four fields.', 'evidence_authority_boundary')
  const observations = evidence?.observations || []
  const newObservations = observations.filter(item => EXPECTED_NEW_OBSERVATIONS.includes(item.observationId))
  failure(failures, newObservations.length !== 2, 'direct_observation_count')
  failure(failures, unique(newObservations.map(item => item.observationId)).length !== 2, 'direct_observation_duplicate')
  failure(failures, newObservations.some(item => item.researcherDirectObservation !== true || item.directObservationStatus !== 'direct_visual_original_scan_review'), 'direct_observation_status')
  failure(failures, newObservations.some(item => item.authorityStatus.includes('semantic_authority_established')), 'direct_observation_authority_promotion')
  const nlc = observations.find(item => item.observationId === EXPECTED_NEW_OBSERVATIONS[0])
  failure(failures, nlc?.sourceIds?.[0] !== SOURCE_NLC || nlc.locator?.scanPage !== 66 || nlc.locator?.sourcePdfSha256 !== NLC_PDF_SHA256 || nlc.locator?.renderedFileSha256 !== NLC_PAGE66_RENDER_SHA256, 'nlc_identity_or_locator')
  failure(failures, nlc?.doesNotEstablish?.includes('palace_name_to_physical_chart_slot') !== true || nlc?.doesNotEstablish?.includes('production_ordinal') !== true, 'nlc_negative_boundary')
  failure(failures, nlc?.directReading?.some(item => item.includes('十二宮者') && item.includes('命宮') && item.includes('父母宮')) !== true, 'nlc_palace_reading')
  const zjlib = observations.find(item => item.observationId === EXPECTED_NEW_OBSERVATIONS[1])
  failure(failures, zjlib?.sourceIds?.[0] !== SOURCE_ZJLIB || JSON.stringify(zjlib.locator?.scanPages) !== JSON.stringify([131, 132]) || zjlib.locator?.sourcePdfSha256 !== ZJLIB_PDF_SHA256, 'zjlib_identity_or_locator')
  failure(failures, zjlib?.locator?.renderedFileSha256ByPage?.[131] !== ZJLIB_PAGE131_RENDER_SHA256 || zjlib?.locator?.renderedFileSha256ByPage?.[132] !== ZJLIB_PAGE132_RENDER_SHA256, 'zjlib_render_hash')
  failure(failures, zjlib?.doesNotEstablish?.includes('palace_name_to_physical_chart_slot') !== true || zjlib?.doesNotEstablish?.includes('production_ordinal') !== true, 'zjlib_negative_boundary')
  failure(failures, evidence.directScanCorroboration?.independentHistoricalWitnessesAdmitted !== 0, 'direct_scan_independence_promotion')
  failure(failures, evidence.candidateReview?.candidates?.some(item => item.doesNotEnterGraph !== true) === true, 'candidate_graph_admission')
  failure(failures, evidence.reportedNonObservations?.some(item => /physical palace-name diagram|production ordinal/.test(item)) !== true, 'missing_new_nonobservations')
  failure(failures, artifact.observations?.length !== observations.length, 'artifact_evidence_observation_copy')
}

function checkMatrix(artifact, matrix, failures) {
  failure(failures, matrix?.schemaVersion !== SCHEMA + '-binding-matrix-v0', 'matrix_schema')
  failure(failures, matrix?.composition?.status !== 'derived_not_authoritative', 'matrix_authority')
  failure(failures, matrix?.coverage?.directSingleWitnessFullBindingCount !== 0, 'direct_single_witness_promotion')
  failure(failures, matrix?.coverage?.directNamedPalaceOrdinalCount !== 12, 'historical_named_order_lost')
  failure(failures, matrix?.coverage?.directNamedPalaceWitnessCount !== 3 || matrix?.coverage?.additionalDirectNamedPalaceCorroborationCount !== 2, 'direct_named_witness_count')
  failure(failures, matrix?.coverage?.productionOrdinalBindingCount !== 0, 'production_ordinal_promotion')
  failure(failures, matrix?.coverage?.semanticAuthorityCount !== 0, 'matrix_semantic_authority')
  failure(failures, JSON.stringify(matrix?.anchorRows?.map(row => row.palaceName)) !== JSON.stringify(EXPECTED_PALACES), 'palace_order_changed')
  failure(failures, matrix?.anchorRows?.some(row => row.productionOrdinal !== null || row.bindingStatus !== 'composed_inference_not_direct_witness'), 'anchor_row_promotion')
  failure(failures, matrix?.directPalaceWitnesses?.length !== 3, 'direct_palace_witness_list')
  failure(failures, matrix?.directPalaceWitnesses?.some(item => item.physicalSlotBound !== false || item.productionOrdinalBound !== false), 'direct_palace_slot_promotion')
  failure(failures, matrix?.composition?.additionalDirectWitnessLimitations?.length !== 3, 'matrix_limitation_count')
}

function checkLineage(artifact, lineage, failures) {
  failure(failures, lineage?.status !== 'derived_not_authoritative', 'lineage_status')
  failure(failures, lineage?.independentWitnessStatus !== 'not_admitted', 'lineage_independence')
  failure(failures, lineage?.sameEditionComparison?.status !== 'same_edition_distinct_physical_scan' || lineage.sameEditionComparison.independentLineageAdmitted !== false, 'nlc_lineage_boundary')
  failure(failures, lineage?.sameEditionComparison?.namedPalaceOrderAgreement !== true || lineage.sameEditionComparison.byteIdentityClaimed !== false, 'nlc_comparison_boundary')
  failure(failures, lineage?.lateReprintComparison?.status !== 'catalog_labelled_late_compiled_reprint_directly_reviewed' || lineage.lateReprintComparison.blockOrColophonIdentityClosed !== false || lineage.lateReprintComparison.independentLineageAdmitted !== false, 'zjlib_lineage_boundary')
  failure(failures, lineage?.physicalWitnessCandidatesAdded?.length !== 2, 'physical_candidate_count')
  failure(failures, lineage?.productionBoundary?.directScanPhysicalSlotToProductionOrdinal !== 'not_established' || lineage.productionBoundary.productionModified !== false, 'production_boundary')
  failure(failures, lineage?.earlierEdition1871?.pageImagesLocated !== false || lineage.earlierEdition1871.directTextComparisonPerformed !== false || lineage.earlierEdition1871.textualLineageClosed !== false, '1871_boundary_changed')
  failure(failures, lineage?.candidateReview?.candidates?.some(item => item.doesNotEnterGraph !== true) === true, 'candidate_lineage_admission')
}

function checkGraph(artifact, graph, failures) {
  failure(failures, graph?.predecessor?.claimCount !== 30 || graph.predecessor.sourceCount !== 17 || graph.predecessor.observationCount !== 53 || graph.predecessor.relationCount !== 143 || graph.predecessor.blockerCount !== 11, 'predecessor_graph_counts')
  failure(failures, graph?.additive?.claimCount !== 0 || graph.additive.sourceCount !== 2 || graph.additive.physicalWitnessCount !== 2 || graph.additive.observationCount !== 2 || graph.additive.relationCount !== 3 || graph.additive.blockerCount !== 0, 'additive_graph_counts')
  failure(failures, graph?.successor?.claimCount !== 30 || graph.successor.sourceCount !== 19 || graph.successor.observationCount !== 55 || graph.successor.relationCount !== 146 || graph.successor.blockerCount !== 11, 'successor_graph_counts')
  failure(failures, JSON.stringify(graph?.sourcesAdded) !== JSON.stringify([SOURCE_NLC, SOURCE_ZJLIB]), 'source_addition')
  failure(failures, JSON.stringify(graph?.physicalWitnessesAdded) !== JSON.stringify([SOURCE_NLC, SOURCE_ZJLIB]) || graph?.independentPhysicalWitnessesAdmitted !== 0, 'physical_witness_promotion')
  failure(failures, JSON.stringify(graph?.addedObservationIds) !== JSON.stringify(EXPECTED_NEW_OBSERVATIONS), 'added_observation_ids')
  failure(failures, JSON.stringify(graph?.addedRelationIds) !== JSON.stringify(EXPECTED_NEW_RELATIONS), 'added_relation_ids')
  failure(failures, JSON.stringify(graph?.blockersClosed) !== JSON.stringify([]) || JSON.stringify(graph?.blockersStillOpen) !== JSON.stringify(ALL_BLOCKER_IDS), 'blocker_closure')
  failure(failures, artifact.blockerReassessment?.some(item => item.statusBefore !== item.statusAfter || item.statusChanged !== false), 'blocker_status_promotion')
  const palace = artifact.blockerReassessment?.find(item => item.id === 'blocker-palace-semantic-identity')
  failure(failures, !palace?.newObservationIds?.includes(EXPECTED_NEW_OBSERVATIONS[0]) || !palace.newObservationIds.includes(EXPECTED_NEW_OBSERVATIONS[1]), 'palace_blocker_evidence')
  failure(failures, !palace?.newRelationIds?.includes(EXPECTED_NEW_RELATIONS[0]) || !palace.newRelationIds.includes(EXPECTED_NEW_RELATIONS[1]) || !palace.newRelationIds.includes(EXPECTED_NEW_RELATIONS[2]), 'palace_blocker_relations')
}

function checkRelations(artifact, failures) {
  const relations = artifact.relations || []
  const added = relations.filter(item => EXPECTED_NEW_RELATIONS.includes(item.relationId))
  failure(failures, added.length !== 3, 'new_relation_count')
  failure(failures, unique(added.map(item => item.relationId)).length !== 3, 'new_relation_duplicate')
  failure(failures, added.some(item => !/not_admitted/.test(item.promotion) || item.blockerIds?.includes('blocker-palace-semantic-identity') !== true), 'relation_promotion')
  failure(failures, added.some(item => item.sourceIds?.includes(SOURCE_NLC) && item.sourceIds?.includes(SOURCE_ZJLIB) && item.claimIds?.length !== 0), 'cross_scan_claim_shortcut')
  failure(failures, artifact.claimImpact?.claimsPromoted !== 0 || artifact.claimImpact?.directSemanticClaimSupportAdded?.length !== 0 || artifact.claimImpact?.stableClaimCount !== 0 || artifact.claimImpact?.semanticAuthorityCount !== 0, 'claim_promotion')
  failure(failures, artifact.claimImpact?.boundedDirectCorroborationAdded?.length !== 2, 'direct_corroboration_claim_boundary')
}

function checkScopeAndReadiness(artifact, failures) {
  failure(failures, artifact.scope?.sourceAuthorityPromoted !== false || artifact.scope.semanticAuthorityPromoted !== false || artifact.scope.productionChanged !== false || artifact.scope.independentWitnessesAdmitted !== 0, 'scope_promotion')
  failure(failures, artifact.scope?.physicalWitnessCandidatesAdded !== 2 || artifact.scope.externalDirectScanReviewPerformed !== true, 'scope_direct_scan')
  failure(failures, artifact.readinessImpact?.readiness !== 'not_safe_to_start' || artifact.readinessImpact.grounding !== 'blocked' || artifact.readinessImpact.activation !== 'experimental_only' || artifact.readinessImpact.rotation06 !== 'representation_only', 'readiness_boundary')
  failure(failures, artifact.preservation?.predecessorArtifactsRewritten !== false || artifact.preservation.historicalPredecessorBytesRewritten !== false || artifact.preservation.existingFieldKitRewritten !== false || artifact.preservation.sourcePdfsStoredInGit !== false || artifact.preservation.productionChanged !== false, 'preservation_boundary')
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
  failure(failures, !stableArtifactContentEqual(artifact, expected), 'stable_content_not_reproducible')
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
  checkRelations(artifact, failures)
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
