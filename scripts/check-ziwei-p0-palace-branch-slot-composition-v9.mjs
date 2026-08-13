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
  OBSERVATION_ZJLIB_36_3,
  PALACE_CLAIMS,
  PREDECESSOR_COMPOSITION,
  PREDECESSOR_COMPOSITION_EVIDENCE,
  PROTECTED_ASSET_PATH,
  RELATION_ZJLIB_36_3,
  ROOT,
  SCHEMA,
  SOURCE_ZJLIB_36_3,
  ZJLIB_36_3_COMMONS_SHA1,
  ZJLIB_36_3_COMMONS_URL,
  ZJLIB_36_3_PDF_BYTES,
  ZJLIB_36_3_PDF_PAGES,
  ZJLIB_36_3_PDF_SHA256,
  ZJLIB_36_3_RENDER_DIMENSIONS_BY_PAGE,
  ZJLIB_36_3_RENDER_DPI,
  ZJLIB_36_3_RENDER_SHA256_BY_PAGE,
  ZJLIB_36_3_URL,
  buildBundle,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v9.mjs'
import * as v8 from './materialize-ziwei-p0-palace-branch-slot-composition-v8.mjs'

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
  const entry = artifact.sourceLineage?.addedSources?.find(item => item.sourceId === SOURCE_ZJLIB_36_3)
  failure(failures, !entry, 'missing_zjlib_36_3_source')
  if (!entry) return
  failure(failures, entry.sourceKind !== 'direct_lithographic_variant_physical_scan', 'zjlib_36_3_kind')
  failure(failures, entry.role !== 'direct_named_palace_corroboration_only', 'zjlib_36_3_role')
  failure(failures, entry.edition !== '清末石印本 上欄二十行二十一字下欄二十行二十一字白口四周單邊單黑', 'zjlib_36_3_edition')
  failure(failures, entry.url !== ZJLIB_36_3_URL || entry.commonsUrl !== ZJLIB_36_3_COMMONS_URL || entry.commonsPageId !== 148539347, 'zjlib_36_3_locator')
  failure(failures, entry.sourcePdfSha256 !== ZJLIB_36_3_PDF_SHA256 || entry.sourcePdfBytes !== ZJLIB_36_3_PDF_BYTES || entry.sourcePdfPages !== ZJLIB_36_3_PDF_PAGES || entry.commonsSha1 !== ZJLIB_36_3_COMMONS_SHA1, 'zjlib_36_3_bytes')
  failure(failures, entry.physicalWitnessCandidate !== true || entry.independentPhysicalWitness !== false || entry.sourceAuthority !== 'not_established', 'zjlib_36_3_authority')
  failure(failures, entry.lineageStatus !== 'distinct_lithographic_variant_same_work; block_colophon_and_1871_lineage_unresolved', 'zjlib_36_3_lineage')
}

function checkObservationAndRelation(artifact, failures) {
  const observation = artifact.observations?.find(item => item.observationId === OBSERVATION_ZJLIB_36_3)
  failure(failures, !observation, 'missing_zjlib_36_3_observation')
  if (observation) {
    failure(failures, JSON.stringify(observation.affectedClaimIds) !== JSON.stringify(PALACE_CLAIMS), 'zjlib_36_3_observation_claims')
    failure(failures, observation.directObservationStatus !== 'direct_visual_original_scan_review_not_ocr_transcription' || observation.researcherDirectObservation !== true, 'zjlib_36_3_observation_review')
    failure(failures, observation.locator?.url !== ZJLIB_36_3_URL || observation.locator.commonsUrl !== ZJLIB_36_3_COMMONS_URL, 'zjlib_36_3_observation_locator')
    failure(failures, observation.locator?.sourcePdfSha256 !== ZJLIB_36_3_PDF_SHA256 || observation.locator.sourcePdfBytes !== ZJLIB_36_3_PDF_BYTES || observation.locator.sourcePdfPages !== ZJLIB_36_3_PDF_PAGES, 'zjlib_36_3_observation_bytes')
    failure(failures, JSON.stringify(observation.locator.scanPages) !== JSON.stringify([85, 86]) || observation.locator.renderDpi !== ZJLIB_36_3_RENDER_DPI, 'zjlib_36_3_observation_pages')
    failure(failures, JSON.stringify(observation.locator.renderedFileSha256ByPage) !== JSON.stringify(ZJLIB_36_3_RENDER_SHA256_BY_PAGE), 'zjlib_36_3_render_hashes')
    failure(failures, JSON.stringify(observation.locator.renderedDimensionsByPage) !== JSON.stringify(ZJLIB_36_3_RENDER_DIMENSIONS_BY_PAGE), 'zjlib_36_3_render_dimensions')
    failure(failures, observation.sourceIdentity?.commonsSha1 !== ZJLIB_36_3_COMMONS_SHA1 || observation.sourceIdentity.edition !== '清末石印本 上欄二十行二十一字下欄二十行二十一字白口四周單邊單黑', 'zjlib_36_3_observation_identity')
    failure(failures, observation.doesNotEstablish?.includes('palace_name_to_physical_chart_slot') !== true || observation.doesNotEstablish?.includes('production_ordinal') !== true || observation.doesNotEstablish?.includes('1871_textual_lineage') !== true, 'zjlib_36_3_observation_boundary')
  }
  const relationRecord = artifact.relations?.find(item => item.relationId === RELATION_ZJLIB_36_3)
  failure(failures, !relationRecord, 'missing_zjlib_36_3_relation')
  if (relationRecord) {
    failure(failures, JSON.stringify(relationRecord.sourceIds) !== JSON.stringify(['src-youyi-lu-cadal-01025514-1883', SOURCE_ZJLIB_36_3]), 'zjlib_36_3_relation_sources')
    failure(failures, JSON.stringify(relationRecord.observationIds) !== JSON.stringify([OBSERVATION_ZJLIB_36_3]), 'zjlib_36_3_relation_observations')
    failure(failures, JSON.stringify(relationRecord.claimIds) !== JSON.stringify(PALACE_CLAIMS) || relationRecord.promotion !== 'not_admitted_to_source_authority_or_semantic_claim', 'zjlib_36_3_relation_promotion')
  }
}

function checkEvidence(artifact, evidence, failures) {
  failure(failures, evidence?.schemaVersion !== SCHEMA + '-evidence-v0', 'evidence_schema')
  failure(failures, evidence?.authorityBoundary?.includes('lithographic-variant') !== true || evidence.authorityBoundary.includes('not establish') !== true, 'evidence_authority_boundary')
  failure(failures, evidence?.observations?.length !== artifact.observations?.length, 'evidence_observation_copy')
  failure(failures, evidence?.newDirectScan?.sourceId !== SOURCE_ZJLIB_36_3 || evidence.newDirectScan.independentWitnessAdmitted !== false, 'evidence_new_scan_boundary')
  failure(failures, evidence?.reportedNonObservations?.some(item => /第3冊|1871|physical|independent/.test(item)) !== true, 'evidence_nonobservations')
}

function checkMatrix(artifact, matrix, failures) {
  failure(failures, matrix?.schemaVersion !== SCHEMA + '-binding-matrix-v0', 'matrix_schema')
  failure(failures, matrix?.composition?.status !== 'derived_not_authoritative', 'matrix_authority')
  failure(failures, matrix?.coverage?.directNamedPalaceWitnessCount !== 4 || matrix.coverage.additionalDirectNamedPalaceCorroborationCount !== 3, 'matrix_named_witness_count')
  failure(failures, matrix?.coverage?.directSingleWitnessFullBindingCount !== 0 || matrix.coverage.productionOrdinalBindingCount !== 0 || matrix.coverage.semanticAuthorityCount !== 0, 'matrix_promotion')
  const witness = matrix?.directPalaceWitnesses?.at(-1)
  failure(failures, witness?.sourceId !== SOURCE_ZJLIB_36_3 || witness.physicalSlotBound !== false || witness.productionOrdinalBound !== false, 'matrix_new_witness_boundary')
}

function checkLineage(artifact, lineage, failures) {
  failure(failures, lineage?.schemaVersion !== SCHEMA + '-lineage-v0', 'lineage_schema')
  failure(failures, lineage?.status !== 'derived_not_authoritative' || lineage.independentWitnessStatus !== 'not_admitted', 'lineage_authority')
  failure(failures, lineage?.earlierEdition1871?.catalogFormatComparisonPerformed !== true || lineage.earlierEdition1871.catalogFormatComparisonDirectText !== false || lineage.earlierEdition1871.catalogFormatComparisonDirectBytes !== false || lineage.earlierEdition1871.catalogFormatComparisonBlockLineageClosed !== false || lineage.earlierEdition1871.textualLineageClosed !== false, 'lineage_1871_boundary')
  const comparison = lineage?.lithographicVariantComparison
  failure(failures, comparison?.sourceIds?.[0] !== 'src-youyi-lu-zjlib-36-25-late-reprint' || comparison.sourceIds?.[1] !== SOURCE_ZJLIB_36_3, 'lineage_variant_sources')
  failure(failures, comparison?.directVisualComparisonPerformed !== true || comparison.fullTextTranscriptionPerformed !== false || comparison.byteIdentityClaimed !== false || comparison.blockOrColophonIdentityClosed !== false || comparison.relationTo1871Closed !== false || comparison.independentLineageAdmitted !== false, 'lineage_variant_boundary')
  const direct = lineage?.directPalaceWitnesses?.at(-1)
  failure(failures, direct?.sourceId !== SOURCE_ZJLIB_36_3 || direct.physicalSlotBinding !== false || direct.productionOrdinalBinding !== false || direct.independentHistoricalWitnessAdmitted !== false, 'lineage_new_witness_boundary')
}

function checkGraph(artifact, graph, failures) {
  failure(failures, graph?.predecessor?.claimCount !== 30 || graph.predecessor.sourceCount !== 19 || graph.predecessor.observationCount !== 55 || graph.predecessor.relationCount !== 146 || graph.predecessor.blockerCount !== 11, 'predecessor_graph_counts')
  failure(failures, graph?.additive?.claimCount !== 0 || graph.additive.sourceCount !== 1 || graph.additive.physicalWitnessCount !== 1 || graph.additive.observationCount !== 1 || graph.additive.relationCount !== 1 || graph.additive.blockerCount !== 0, 'additive_graph_counts')
  failure(failures, graph?.successor?.claimCount !== 30 || graph.successor.sourceCount !== 20 || graph.successor.observationCount !== 56 || graph.successor.relationCount !== 147 || graph.successor.blockerCount !== 11, 'successor_graph_counts')
  failure(failures, JSON.stringify(graph?.blockersClosed) !== JSON.stringify([]) || JSON.stringify(graph?.blockersStillOpen) !== JSON.stringify(BLOCKERS), 'blocker_closure')
  failure(failures, graph?.independentPhysicalWitnessesAdmitted !== 0, 'independent_witness_promotion')
}

function checkScopeAndReadiness(artifact, failures) {
  failure(failures, artifact.scope?.historical1871ScanObtained !== false || artifact.scope.directSingleWitnessFullBindingEstablished !== false, 'scope_binding_promotion')
  failure(failures, artifact.scope?.physicalWitnessCandidatesAdded !== 3 || artifact.scope.sourceAuthorityPromoted !== false || artifact.scope.semanticAuthorityPromoted !== false || artifact.scope.independentWitnessesAdmitted !== 0, 'scope_authority_promotion')
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
  failure(failures, artifact?.schemaVersion !== SCHEMA || artifact?.verdictToken !== 'complete_ziwei_palace_branch_slot_composition_with_zjlib_lithographic_variant_direct_corroboration_derived_not_authoritative', 'schema_or_verdict')
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
  checkObservationAndRelation(artifact, failures)
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
