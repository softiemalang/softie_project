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
  ARTIFACT_DIR,
  ARTIFACT_PATH,
  BASIS_HEAD,
  INPUT_PATHS,
  MATERIALIZER_PATH,
  MATERIALIZER_VERSION,
  NANBEI_CLOCKWISE_SEQUENCE,
  NANBEI_PDF_SHA256,
  PALACE_NAMES_YOUYI,
  PREDECESSOR_NARA_SEMANTIC,
  PREDECESSOR_NANBEI_INDEX,
  PREDECESSOR_NANBEI_OBSERVATIONS,
  PREDECESSOR_YOUYI,
  PREDECESSOR_YOUYI_EVIDENCE,
  PROTECTED_ASSET_PATH,
  PCHOME_URL,
  ROOT,
  SCHEMA,
  SOURCE_CINII_1871,
  SOURCE_NANBEI,
  SOURCE_PCHOME,
  SOURCE_YOUYI,
  TRADITIONAL_BRANCH_ORDER,
  VERDICT,
  buildBundle,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v2.mjs'

export const COMPLETE_PATH = ARTIFACT_PATH

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const parse = path => JSON.parse(readFileSync(path, 'utf8'))
const failure = (list, condition, message) => { if (condition) list.push(message) }
const unique = values => [...new Set(values)]
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
const OUTPUT_NAMES = ['evidence.json', 'binding-matrix.json', 'lineage-assessment.json', 'graph-reconciliation.json', 'field-kit-impact.json']
const EXPECTED_ANCHOR_BRANCHES = ['寅', '丑', '子', '亥', '戌', '酉', '申', '未', '午', '巳', '辰', '卯']
const EXPECTED_ANCHOR_SLOTS = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 11, 10]
const EXPECTED_SECONDARY_VISIBLE_NAMES = ['命宮', '兄弟宮', '夫妻宮', '子女宮', '財帛宮', '疾厄宮', '遷移宮', '交友宮', '事業宮', '田宅宮', '福德宮', '父母宮']
const ALLOWED_SOURCE_IDS = new Set([SOURCE_YOUYI, SOURCE_NANBEI, SOURCE_PCHOME, SOURCE_CINII_1871])

function readCompanions(completePath) {
  const directory = dirname(completePath)
  return Object.fromEntries(OUTPUT_NAMES.map(name => [name, parse(resolve(directory, name))]))
}

function containsTimestampValue(value) {
  if (Array.isArray(value)) return value.some(containsTimestampValue)
  if (!value || typeof value !== 'object') return false
  return Object.entries(value).some(([key, child]) => {
    if ((key === 'generatedAt' || key === 'timestamp') && child !== 'forbidden') return true
    return containsTimestampValue(child)
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
  const expectedPaths = [PREDECESSOR_YOUYI, PREDECESSOR_YOUYI_EVIDENCE, PREDECESSOR_NANBEI_INDEX, PREDECESSOR_NANBEI_OBSERVATIONS, PREDECESSOR_NARA_SEMANTIC]
  failure(failures, JSON.stringify(artifact.predecessorChain?.map(item => item.path)) !== JSON.stringify(expectedPaths), 'predecessor_order')
  for (const path of expectedPaths) {
    const row = artifact.predecessorChain?.find(item => item.path === path)
    failure(failures, !row || row.byteSha256 !== sha256(readFileSync(resolve(root, path))), 'predecessor_byte_identity:' + path)
  }
  for (const path of INPUT_PATHS) failure(failures, !existsSync(resolve(root, path)), 'missing_input:' + path)
  failure(failures, artifact.preservation?.protectedAsset?.canonicalPath !== PROTECTED_ASSET_PATH, 'protected_asset_path')
  failure(failures, artifact.preservation?.protectedAsset?.byteSha256 !== sha256(readFileSync(resolve(root, PROTECTED_ASSET_PATH))), 'protected_asset_hash')
}

function checkMatrix(artifact, companions, failures) {
  const matrix = artifact.bindingMatrix
  const companionMatrix = companions['binding-matrix.json']
  failure(failures, canonicalStableArtifactJson(matrix) !== canonicalStableArtifactJson(companionMatrix), 'binding_matrix_companion_mismatch')
  failure(failures, matrix?.schemaVersion !== SCHEMA + '-binding-matrix-v0', 'binding_matrix_schema')
  failure(failures, matrix?.composition?.status !== 'derived_not_authoritative', 'binding_matrix_authority')
  failure(failures, matrix?.composition?.joinKey !== 'earthly_branch_token', 'binding_matrix_join_key')
  failure(failures, matrix?.composition?.anchorMingBranch !== '寅', 'binding_matrix_anchor')
  failure(failures, JSON.stringify(matrix?.sourceBranchRing?.clockwiseSequence) !== JSON.stringify(NANBEI_CLOCKWISE_SEQUENCE), 'binding_matrix_ring')
  failure(failures, matrix?.sourceBranchRing?.pdfSha256 !== NANBEI_PDF_SHA256, 'binding_matrix_nanbei_hash')
  failure(failures, matrix?.sourceBranchRing?.palaceNamesVisibleOnPage !== false, 'binding_matrix_direct_name_boundary')
  failure(failures, matrix?.coverage?.directSingleWitnessFullBindingCount !== 0, 'direct_single_witness_promotion')
  failure(failures, matrix?.coverage?.directNamedPalaceOrdinalCount !== 12, 'direct_named_palace_count')
  failure(failures, matrix?.coverage?.directBranchPhysicalSlotCount !== 12, 'direct_branch_slot_count')
  failure(failures, matrix?.coverage?.composedSourceBindingCount !== 12, 'composed_binding_count')
  failure(failures, matrix?.coverage?.allAnchorRowCount !== 144, 'all_anchor_row_count')
  failure(failures, matrix?.coverage?.secondaryClarificationMatchCount !== 12, 'secondary_match_count')
  failure(failures, matrix?.coverage?.productionOrdinalBindingCount !== 0, 'production_ordinal_promotion')
  failure(failures, matrix?.coverage?.semanticAuthorityCount !== 0, 'matrix_semantic_authority')
  failure(failures, matrix?.anchorRows?.length !== 12, 'anchor_matrix_length')
  failure(failures, JSON.stringify(matrix?.anchorRows?.map(row => row.branchToken)) !== JSON.stringify(EXPECTED_ANCHOR_BRANCHES), 'anchor_branch_order')
  failure(failures, JSON.stringify(matrix?.anchorRows?.map(row => row.physicalSlotClockwiseIndex)) !== JSON.stringify(EXPECTED_ANCHOR_SLOTS), 'anchor_slot_order')
  failure(failures, JSON.stringify(matrix?.anchorRows?.map(row => row.palaceName)) !== JSON.stringify(PALACE_NAMES_YOUYI), 'anchor_palace_order')
  failure(failures, matrix?.anchorRows?.some(row => row.productionOrdinal !== null || row.productionOrdinalStatus !== 'not_established'), 'anchor_production_ordinal')
  failure(failures, matrix?.anchorRows?.some(row => row.bindingStatus !== 'composed_inference_not_direct_witness'), 'anchor_binding_status')
  failure(failures, matrix?.allAnchorRows?.length !== 12 || matrix.allAnchorRows.some(item => item.rows?.length !== 12), 'all_anchor_matrix_shape')
  failure(failures, matrix?.secondaryClarification?.sourceId !== SOURCE_PCHOME || matrix.secondaryClarification.url !== PCHOME_URL, 'secondary_source_identity')
  failure(failures, matrix?.secondaryClarification?.canonicalForClaims !== false || matrix.secondaryClarification.independentHistoricalWitness !== false || matrix.secondaryClarification.historicalOriginality !== false, 'secondary_authority_boundary')
  failure(failures, matrix?.secondaryClarification?.matchCount !== 12, 'secondary_anchor_match')
  failure(failures, JSON.stringify(matrix.secondaryClarification.comparison.map(row => row.visibleName)) !== JSON.stringify(EXPECTED_SECONDARY_VISIBLE_NAMES), 'secondary_name_order')
  failure(failures, matrix?.composition?.unprovenJoinPremises?.length !== 3, 'join_premise_boundary')
}

function checkEvidence(artifact, companions, failures) {
  const evidence = companions['evidence.json']
  const observations = artifact.observations || []
  const expectedIds = [
    'obs-youyi-1871-catalog-only-boundary',
    'obs-composed-palace-branch-slot-anchor-ming-yin',
    'obs-pchome-secondary-anchor-clarification',
  ]
  failure(failures, evidence?.schemaVersion !== SCHEMA + '-evidence-v0', 'evidence_schema')
  failure(failures, evidence?.authorityBoundary !== 'The only complete four-field matrix in this artifact is a composition; no single historical source page directly witnesses all four fields.', 'evidence_authority_boundary')
  failure(failures, JSON.stringify(observations.map(item => item.observationId)) !== JSON.stringify(expectedIds), 'observation_order')
  failure(failures, unique(observations.map(item => item.observationId)).length !== observations.length, 'duplicate_observation_id')
  failure(failures, observations.some(item => item.sourceIds?.some(id => !ALLOWED_SOURCE_IDS.has(id))), 'observation_source_id')
  failure(failures, observations.some(item => item.researcherDirectObservation !== false), 'new_observation_directness')
  const catalog = observations.find(item => item.observationId === expectedIds[0])
  failure(failures, catalog?.sourceIds?.[0] !== SOURCE_CINII_1871 || catalog.authorityStatus !== 'catalog_identity_only; source_authority_and_semantic_authority_not_established', 'catalog_boundary')
  failure(failures, catalog?.lineageStatus !== 'earlier-edition-catalog-candidate; direct text and image comparison absent', 'catalog_lineage_boundary')
  failure(failures, catalog?.facts?.some(fact => /direct text|leaf|colophon|byte comparison/.test(fact) && !/No direct/.test(fact) && !/No direct text/.test(fact)) === true, 'catalog_fact_shortcut')
  const derived = observations.find(item => item.observationId === expectedIds[1])
  failure(failures, derived?.sourceIds?.length !== 2 || derived.sourceIds[0] !== SOURCE_YOUYI || derived.sourceIds[1] !== SOURCE_NANBEI, 'derived_source_join')
  failure(failures, derived?.directObservationStatus !== 'deterministic_composition_of_prior_direct_observations' || derived.directSingleWitnessFullBinding !== false, 'derived_directness_boundary')
  failure(failures, derived?.productionOrdinal !== 'not_established' || derived.authorityStatus !== 'derived_not_authoritative; source_authority_and_semantic_authority_not_established', 'derived_authority_boundary')
  failure(failures, derived?.basisObservationRefs?.length !== 3, 'derived_basis_refs')
  const secondary = observations.find(item => item.observationId === expectedIds[2])
  failure(failures, secondary?.sourceIds?.[0] !== SOURCE_PCHOME || secondary.canonicalForClaims !== false || secondary.independentHistoricalWitness !== false || secondary.historicalOriginality !== false, 'secondary_observation_boundary')
  failure(failures, secondary?.comparisonMatchCount !== 12 || secondary?.locator?.url !== PCHOME_URL, 'secondary_observation_match')
  failure(failures, evidence.reusedDirectWitnesses?.length !== 3, 'reused_direct_witness_count')
  failure(failures, evidence.reusedDirectWitnesses?.find(item => item.predecessorSourceRef === 'source-p7-shi-er-gong-guan-gai')?.locator?.renderedFileSha256 !== 'ebbdcf1a35d21e0fcf4339182af2df3ad290c279b8627bab9dc7f80156083bac', 'nanbei_p7_hash')
  failure(failures, evidence.reusedDirectWitnesses?.find(item => item.predecessorSourceRef === 'source-p8-ming-shen-rule')?.locator?.renderedFileSha256 !== 'd740c6ed5191e516f40ee61bda7f95ff2081954b21b091c22bee9c0249e8acea', 'nanbei_p8_hash')
  failure(failures, evidence.negativeBoundaryReuse?.completeBindingCount !== 0 || evidence.negativeBoundaryReuse?.sameRecordVolumePairIsNotIndependent !== true, 'nara_negative_boundary')
  failure(failures, containsTimestampValue(evidence), 'evidence_timestamp')
}

function checkLineage(artifact, companions, failures) {
  const lineage = artifact.lineageAssessment
  failure(failures, canonicalStableArtifactJson(lineage) !== canonicalStableArtifactJson(companions['lineage-assessment.json']), 'lineage_companion_mismatch')
  failure(failures, lineage?.status !== 'derived_not_authoritative', 'lineage_status')
  failure(failures, lineage?.joinKey !== 'earthly_branch_token' || lineage.joinStatus !== 'inferred_not_directly_asserted_by_either_source', 'lineage_join_boundary')
  failure(failures, lineage?.independentWitnessStatus !== 'not_admitted', 'lineage_independence')
  failure(failures, lineage?.earlierEdition1871?.pageImagesLocated !== false || lineage.earlierEdition1871.directTextComparisonPerformed !== false || lineage.earlierEdition1871.textualLineageClosed !== false, '1871_lineage_boundary')
  failure(failures, lineage?.secondaryClarification?.normalizedMatchCount !== 12 || lineage.secondaryClarification.independentHistoricalAuthority !== false, 'secondary_lineage_boundary')
  failure(failures, lineage?.naraBoundary?.completeBindingCount !== 0 || lineage.naraBoundary.independentWitness !== false, 'nara_lineage_boundary')
  failure(failures, lineage?.productionBoundary?.physicalSlotToProductionOrdinal !== 'not_established' || lineage.productionBoundary.rotation06 !== 'representation_only' || lineage.productionBoundary.productionModified !== false, 'production_lineage_boundary')
}

function checkClaimsAndRelations(artifact, failures) {
  const claims = artifact.claimReconciliation || []
  failure(failures, claims.length !== 30 || unique(claims.map(item => item.claimId)).length !== 30, 'claim_count')
  failure(failures, claims.some(item => item.predecessorStatus !== item.successorStatus || item.statusChanged !== false || item.sourceRelationPromotion !== 'none'), 'claim_promotion')
  failure(failures, artifact.claimImpact?.claimsAdded !== 0 || artifact.claimImpact?.claimsPromoted !== 0 || artifact.claimImpact?.directSemanticClaimSupportAdded?.length !== 0, 'claim_impact_promotion')
  failure(failures, artifact.claimImpact?.stableClaimCount !== 0 || artifact.claimImpact?.semanticAuthorityCount !== 0 || artifact.claimImpact?.unsupportedClaimPreserved !== true, 'claim_authority_boundary')
  failure(failures, JSON.stringify(artifact.claimImpact?.boundedDerivedSupportAdded) !== JSON.stringify(['claim-palace-name-branch-ordinal', 'claim-12-palace-diagram-semantics']), 'derived_claim_support')
  const relations = artifact.relations || []
  const expectedRelationIds = [
    'relation-youyi-nanbei-branch-token-composition',
    'relation-pchome-secondary-anchor-corroboration',
    'relation-youyi-1871-catalog-lineage-boundary',
  ]
  failure(failures, JSON.stringify(relations.map(item => item.relationId)) !== JSON.stringify(expectedRelationIds), 'relation_order')
  failure(failures, relations.length !== 3 || unique(relations.map(item => item.relationId)).length !== 3, 'relation_count')
  const observationIds = new Set((artifact.observations || []).map(item => item.observationId))
  const claimIds = new Set(claims.map(item => item.claimId))
  failure(failures, relations.some(item => item.sourceIds?.some(id => !ALLOWED_SOURCE_IDS.has(id))), 'relation_source_id')
  failure(failures, relations.some(item => item.observationIds?.some(id => !observationIds.has(id)) || item.claimIds?.some(id => !claimIds.has(id))), 'relation_reference')
  failure(failures, relations.some(item => JSON.stringify(item.claimIds) !== JSON.stringify(item.affectedClaimIds)), 'relation_claim_mismatch')
  failure(failures, relations.some(item => /semantic_authority_established|source_authority_established|independent_witness_admitted|stable_claim/.test(JSON.stringify(item))), 'relation_shortcut')
  failure(failures, relations.some(item => !/not_admitted/.test(item.promotion)), 'relation_promotion')
}

function checkGraphAndBlockers(artifact, companions, failures) {
  const graph = artifact.graphImpact
  failure(failures, graph?.predecessor?.claimCount !== 30 || graph.predecessor.sourceCount !== 15 || graph.predecessor.observationCount !== 50 || graph.predecessor.relationCount !== 140 || graph.predecessor.blockerCount !== 11, 'predecessor_graph_counts')
  failure(failures, graph?.additive?.claimCount !== 0 || graph.additive.sourceCount !== 2 || graph.additive.physicalWitnessCount !== 0 || graph.additive.observationCount !== 3 || graph.additive.relationCount !== 3 || graph.additive.blockerCount !== 0, 'additive_graph_counts')
  failure(failures, graph?.successor?.claimCount !== 30 || graph.successor.sourceCount !== 17 || graph.successor.observationCount !== 53 || graph.successor.relationCount !== 143 || graph.successor.blockerCount !== 11, 'successor_graph_counts')
  failure(failures, JSON.stringify(graph?.sourcesAdded) !== JSON.stringify([SOURCE_PCHOME, SOURCE_CINII_1871]), 'source_addition')
  failure(failures, graph?.physicalWitnessesAdded?.length !== 0 || graph?.independentPhysicalWitnessesAdmitted !== 0, 'witness_promotion')
  failure(failures, JSON.stringify(graph?.blockersClosed) !== JSON.stringify([]) || JSON.stringify(graph?.blockersStillOpen) !== JSON.stringify(ALL_BLOCKER_IDS), 'blocker_closure')
  failure(failures, graph?.blockerStatusCounts?.['blocker-palace-semantic-identity'] !== 'blocked' || graph.blockerStatusCounts?.['blocker-source-identity-unresolved'] !== 'blocked', 'blocker_status')
  const blockers = artifact.blockerReassessment || []
  failure(failures, blockers.length !== ALL_BLOCKER_IDS.length || blockers.some((item, index) => item.id !== ALL_BLOCKER_IDS[index]), 'blocker_order')
  failure(failures, blockers.some(item => item.statusBefore !== item.statusAfter || item.statusChanged !== false), 'blocker_status_promotion')
  failure(failures, blockers.some(item => item.newObservationIds?.some(id => !graph.addedObservationIds.includes(id)) || item.newRelationIds?.some(id => !graph.addedRelationIds.includes(id))), 'blocker_reference')
  const palace = blockers.find(item => item.id === 'blocker-palace-semantic-identity')
  const source = blockers.find(item => item.id === 'blocker-source-identity-unresolved')
  failure(failures, !palace?.newObservationIds.includes('obs-composed-palace-branch-slot-anchor-ming-yin') || !palace.newObservationIds.includes('obs-pchome-secondary-anchor-clarification'), 'palace_blocker_evidence')
  failure(failures, !source?.newObservationIds.includes('obs-youyi-1871-catalog-only-boundary'), 'source_blocker_evidence')
  failure(failures, artifact.blockerImpact?.resolvedSubBoundaryIsNotTopLevelClosure !== true || artifact.blockerImpact?.blockersClosed?.length !== 0, 'subboundary_closure')
  failure(failures, containsTimestampValue(companions['graph-reconciliation.json']), 'graph_timestamp')
}

function checkFieldKit(artifact, companions, failures) {
  const fieldKit = artifact.fieldKitImpact
  const targets = fieldKit?.targetReassessment || []
  failure(failures, targets.length !== 10 || unique(targets.map(item => item.targetId)).length !== 10, 'field_target_count')
  failure(failures, targets.some(item => item.statusBefore !== item.statusAfter || item.statusChanged !== false || item.closure !== 'not_closed'), 'field_target_promotion')
  failure(failures, !targets.find(item => item.targetId === 'acq-palace-semantic-map-and-coordinate-witness')?.newEvidenceRole.includes('derived matrix'), 'field_palace_boundary')
  failure(failures, !targets.find(item => item.targetId === 'acq-distinct-witness-identity-lineage')?.newEvidenceRole.includes('catalog-only'), 'field_source_boundary')
  failure(failures, artifact.fieldKitImpact.semanticTargetStillOpen !== true || artifact.fieldKitImpact.sourceIdentityTargetStillActionRequired !== true, 'field_gate_boundary')
}

export function checkBundle(artifact, root = ROOT) {
  const failures = []
  let expected
  try { expected = buildBundle(root, { mode: 'historical_reference' }).artifact } catch (error) { return ['rebuild_failed:' + error.message] }
  const historical = checkHistoricalRepositoryBasis(root, BASIS_HEAD, { expectedBranch: 'main' })
  failure(failures, historical.errors.length > 0, 'historical_repository_basis:' + historical.errors.join(','))
  failure(failures, artifact?.schemaVersion !== SCHEMA || artifact?.verdictToken !== VERDICT, 'schema_or_verdict')
  failure(failures, artifact?.basisHead !== BASIS_HEAD || artifact?.branch !== 'main', 'basis_or_branch')
  failure(failures, !stableArtifactContentEqual(artifact, expected), 'stable_content_not_reproducible')
  failure(failures, containsTimestampValue(artifact), 'artifact_timestamp')
  failures.push(...checkArtifactIdentity(artifact, {
    root,
    artifactId: SCHEMA,
    materializerPath: MATERIALIZER_PATH,
    materializerVersion: MATERIALIZER_VERSION,
    allowGenerationBaseInput: true,
    allowVerifierInputDrift: true,
  }).map(error => 'artifact_identity:' + error))
  checkPredecessors(root, artifact, failures)
  checkMatrix(artifact, { 'binding-matrix.json': artifact.bindingMatrix }, failures)
  checkEvidence(artifact, { 'evidence.json': artifact.evidence }, failures)
  checkLineage(artifact, { 'lineage-assessment.json': artifact.lineageAssessment }, failures)
  checkClaimsAndRelations(artifact, failures)
  checkGraphAndBlockers(artifact, {
    'graph-reconciliation.json': {
      schemaVersion: SCHEMA + '-graph-v0',
      graphImpact: artifact.graphImpact,
    },
  }, failures)
  checkFieldKit(artifact, { 'field-kit-impact.json': artifact.fieldKitImpact }, failures)
  failure(failures, artifact.scope?.sourceAuthorityPromoted !== false || artifact.scope.semanticAuthorityPromoted !== false || artifact.scope.productionChanged !== false, 'scope_promotion')
  failure(failures, artifact.readinessImpact?.readiness !== 'not_safe_to_start' || artifact.readinessImpact.grounding !== 'blocked' || artifact.readinessImpact.activation !== 'experimental_only' || artifact.readinessImpact.rotation06 !== 'representation_only', 'readiness_boundary')
  failure(failures, artifact.preservation?.predecessorArtifactsRewritten !== false || artifact.preservation.historicalPredecessorBytesRewritten !== false || artifact.preservation.existingFieldKitRewritten !== false || artifact.preservation.productionChanged !== false, 'preservation_boundary')
  failure(failures, artifact.deterministicContract?.generatedAt !== 'forbidden' || artifact.deterministicContract.network !== 'forbidden_during_materialization' || artifact.deterministicContract.noAutomaticPromotion !== true, 'deterministic_contract')
  return unique(failures)
}

export function checkArtifact(root = ROOT, completePath = resolve(root, ARTIFACT_PATH)) {
  const failures = []
  if (!existsSync(completePath)) return ['missing_output:complete.json']
  let artifact
  try { artifact = parse(completePath) } catch (error) { return ['parse_complete:' + error.message] }
  let companions
  try { companions = readCompanions(completePath) } catch (error) { return ['parse_companion:' + error.message] }
  failures.push(...checkBundle(artifact, root))
  checkSidecars(root, completePath, failures)
  for (const name of OUTPUT_NAMES) {
    const actual = companions[name]
    const expected = buildBundle(root, { mode: 'historical_reference' }).files[name]
    failure(failures, canonicalStableArtifactJson(actual) !== canonicalStableArtifactJson(expected), 'stable_companion:' + name)
  }
  return unique(failures)
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const errors = checkArtifact(ROOT, resolve(process.argv[2] || ARTIFACT_PATH))
  console.log(JSON.stringify({ schema: SCHEMA, pass: errors.length === 0, errors }, null, 2))
  if (errors.length) process.exitCode = 1
}
