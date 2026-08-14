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
  CANDIDATE_ERXIANAN,
  CANDIDATE_JIELAN,
  CANDIDATE_JIELAN_PREVIEW,
  CHECKER_PATH,
  DOCUMENTATION_PATH,
  INPUT_PATHS,
  MATERIALIZER_PATH,
  MATERIALIZER_VERSION,
  NEGATIVE_CHECKER_PATH,
  PREDECESSOR_COMPOSITION,
  PREDECESSOR_COMPOSITION_EVIDENCE,
  PROTECTED_ASSET_PATH,
  ROOT,
  SCHEMA,
  VERDICT,
  buildBundle,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v14.mjs'

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

function checkDossier(artifact, failures) {
  const dossier = artifact.v14ResearchDossier
  failure(failures, dossier?.schemaVersion !== SCHEMA + '-research-dossier-v0', 'dossier_schema')
  failure(failures, dossier?.status !== 'derived_not_authoritative_graph_neutral', 'dossier_authority')
  failure(failures, JSON.stringify(dossier?.candidates?.map(item => item.candidateId)) !== JSON.stringify([CANDIDATE_JIELAN, CANDIDATE_ERXIANAN, CANDIDATE_JIELAN_PREVIEW]), 'dossier_candidates')
  failure(failures, dossier?.fiveFieldSummary?.primaryAllUnresolved !== true || dossier.fiveFieldSummary.secondaryAllUnresolved !== true || dossier.fiveFieldSummary.tertiaryAllUnresolved !== true, 'dossier_binding_boundary')
  failure(failures, dossier?.fiveFieldSummary?.directSingleWitnessFullBindingCount !== 0 || dossier.fiveFieldSummary.productionOrdinalBindingCount !== 0 || dossier.fiveFieldSummary.semanticAuthorityCount !== 0, 'dossier_binding_promotion')
  failure(failures, dossier?.blockers?.length !== 4 || dossier.blockers.some(item => item.status !== 'open' || item.blocksParent !== true), 'dossier_blockers')

  const primary = dossier.units?.primary
  failure(failures, primary?.candidateId !== CANDIDATE_JIELAN, 'jielan_candidate')
  failure(failures, primary?.sourceIdentity?.exactTitle?.status !== 'direct' || primary.sourceIdentity.exactTitle.detail !== '新刻纂集紫微斗數捷覽四卷', 'jielan_title')
  failure(failures, primary?.sourceIdentity?.volumeCount?.detail !== '四卷' || primary.sourceIdentity.identifier?.detail !== '子4051', 'jielan_volume_identifier')
  failure(failures, primary?.sourceIdentity?.catalogLabel?.detail !== '明萬曆九年金陵書坊王洛川刻本' || primary.sourceIdentity.publicationYear?.detail !== '1581', 'jielan_label_date')
  failure(failures, primary?.sourceIdentity?.place?.detail !== '金陵' || primary.sourceIdentity.printerOrBookshop?.detail !== '王洛川' || primary.sourceIdentity.heldBy?.detail !== '安徽省博物館', 'jielan_identity_fields')
  failure(failures, primary?.relationChain?.length !== 4, 'jielan_relation_chain_length')
  failure(failures, primary?.relationChain?.[1]?.predicate !== 'original' || primary.relationChain?.[2]?.predicate !== 'itemOf' || primary.relationChain?.[3]?.predicate !== 'heldBy', 'jielan_relation_semantics')
  failure(failures, primary?.accessBoundary?.fullImageFacet !== '无' || primary.accessBoundary.rawHistoricalLeafAcquired !== false || primary.accessBoundary.directHistoricalLeafRendered !== false, 'jielan_access_boundary')
  failure(failures, primary?.fiveFieldBinding?.fullBinding !== false || primary.fiveFieldBinding.directSingleWitnessFullBinding !== false || primary.fiveFieldBinding.productionOrdinal !== false || primary.fiveFieldBinding.semanticAuthority !== false, 'jielan_binding_promotion')
  failure(failures, primary?.graphAdmission?.sourceAdded !== false || primary.graphAdmission.independentPhysicalWitnessAdmitted !== false, 'jielan_graph_admission')

  const secondary = dossier.units?.secondary
  failure(failures, secondary?.candidateId !== CANDIDATE_ERXIANAN, 'erxianan_candidate')
  failure(failures, secondary?.sourceIdentity?.identifier?.detail !== '子51429536' || secondary.sourceIdentity.publicationYear?.detail !== '1906' || secondary.sourceIdentity.workshop?.detail !== '二仙庵', 'erxianan_identity')
  failure(failures, secondary?.transmissionCheck?.exactZiweiChildUnder1906 !== false, 'erxianan_child_promotion')
  failure(failures, secondary?.transmissionCheck?.exactZiweiRecord?.identifier !== '子51429531' || !secondary.transmissionCheck.exactZiweiRecord.manufacturedWith.includes('1607'), 'erxianan_child_identity')
  failure(failures, secondary?.accessBoundary?.rawHistoricalLeafAcquired !== false || secondary.accessBoundary.repeatedSameMetadataEndpoint !== false, 'erxianan_access_boundary')
  failure(failures, secondary?.fiveFieldBinding?.fullBinding !== false || secondary.fiveFieldBinding.independentPhysicalWitness !== false, 'erxianan_binding_promotion')

  const preview = dossier.units?.tertiary
  failure(failures, preview?.candidateId !== CANDIDATE_JIELAN_PREVIEW, 'preview_candidate')
  failure(failures, preview?.requestedIdentifier?.isbn !== '9789888266944' || preview.requestedIdentifier.resolvedTitle !== '紫微斗數全書', 'preview_requested_isbn')
  failure(failures, preview?.targetEdition?.isbn !== '9789888317127' || preview.targetEdition.googleBooksVolumeId !== 'rZRcCwAAQBAJ', 'preview_target_identity')
  failure(failures, preview?.locatorReview?.ocrLocatorOnly !== true || preview.locatorReview.sampledPreviewVisualReview !== true, 'preview_locator_boundary')
  failure(failures, preview?.fiveFieldBinding?.fullBinding !== false || preview.fiveFieldBinding.semanticAuthority !== false, 'preview_binding_promotion')

  for (const unit of [primary, secondary, preview]) {
    const fields = unit?.fiveFieldBinding || {}
    for (const key of ['branchToken', 'palaceName', 'physicalChartSlot', 'ordinalBase', 'direction']) {
      failure(failures, fields[key]?.status !== 'unresolved', 'unresolved_field:' + unit?.unitId + ':' + key)
    }
  }
}

function checkEvidence(artifact, evidence, failures) {
  failure(failures, evidence?.schemaVersion !== SCHEMA + '-evidence-v0', 'evidence_schema')
  failure(failures, evidence?.observations?.length !== artifact.observations?.length, 'evidence_observation_copy')
  failure(failures, !evidence?.v14ResearchDossier || canonicalStableArtifactJson(evidence.v14ResearchDossier) !== canonicalStableArtifactJson(artifact.v14ResearchDossier), 'evidence_dossier_copy')
  failure(failures, evidence?.reportedNonObservations?.some(item => item.includes('子4051 metadata chain')) !== true, 'evidence_primary_boundary')
}

function checkGraph(artifact, graph, failures) {
  const expected = { claimCount: 30, sourceCount: 21, observationCount: 58, relationCount: 148, blockerCount: 11 }
  failure(failures, canonicalStableArtifactJson(graph?.predecessor) !== canonicalStableArtifactJson(expected), 'predecessor_graph_counts')
  failure(failures, canonicalStableArtifactJson(graph?.additive) !== canonicalStableArtifactJson({ claimCount: 0, sourceCount: 0, physicalWitnessCount: 0, observationCount: 0, relationCount: 0, blockerCount: 0 }), 'additive_graph_counts')
  failure(failures, canonicalStableArtifactJson(graph?.successor) !== canonicalStableArtifactJson(expected), 'successor_graph_counts')
  failure(failures, graph?.claimsAdded !== 0 || graph.sourcesAdded?.length !== 0 || graph.addedObservationIds?.length !== 0 || graph.addedRelationIds?.length !== 0 || graph.blockersClosed?.length !== 0 || graph.independentPhysicalWitnessesAdmitted !== 0, 'graph_promotion')
  failure(failures, graph?.v14ResearchBoundary?.claimsAdded !== 0 || graph.v14ResearchBoundary.sourcesAdded !== 0 || graph.v14ResearchBoundary.observationsAdded !== 0 || graph.v14ResearchBoundary.relationsAdded !== 0 || graph.v14ResearchBoundary.blockersClosed?.length !== 0, 'dossier_graph_promotion')
}

function checkScopeAndReadiness(artifact, failures) {
  failure(failures, artifact.basisHead !== BASIS_HEAD || artifact.branch !== 'main', 'basis_or_branch')
  failure(failures, JSON.stringify(artifact.scope?.v14ResearchUnitsCompleted) !== JSON.stringify(['primary-jielan-1581', 'secondary-erxianan-1906', 'tertiary-jielan-commercial-preview']), 'scope_units')
  failure(failures, artifact.scope?.v14GraphAdmission !== 'none' || artifact.scope.directSingleWitnessFullBindingEstablished !== false || artifact.scope.independentWitnessesAdmitted !== 0, 'scope_promotion')
  failure(failures, artifact.readinessImpact?.readiness !== 'not_safe_to_start' || artifact.readinessImpact.grounding !== 'blocked' || artifact.readinessImpact.activation !== 'experimental_only' || artifact.readinessImpact.rotation06 !== 'representation_only', 'readiness_boundary')
  failure(failures, artifact.preservation?.predecessorArtifactsRewritten !== false || artifact.preservation.historicalPredecessorBytesRewritten !== false || artifact.preservation.productionChanged !== false || artifact.preservation.remoteDatabaseChanged !== false || artifact.preservation.deploymentPerformed !== false || artifact.preservation.commitPerformed !== false || artifact.preservation.pushPerformed !== false, 'preservation_boundary')
  failure(failures, artifact.deterministicContract?.generatedAt !== 'forbidden' || artifact.deterministicContract.network !== 'forbidden_during_materialization' || artifact.deterministicContract.noAutomaticPromotion !== true, 'deterministic_contract')
  failure(failures, artifact.materializer !== MATERIALIZER_PATH || artifact.checker !== CHECKER_PATH || artifact.negativeChecker !== NEGATIVE_CHECKER_PATH, 'tool_paths')
}

export function checkBundle(artifact, root = ROOT, completePath = resolve(root, ARTIFACT_PATH)) {
  const failures = []
  let expected
  try { expected = buildBundle(root, { mode: 'historical_reference' }).artifact } catch (error) { return ['rebuild_failed:' + error.message] }
  const historical = checkHistoricalRepositoryBasis(root, BASIS_HEAD, { expectedBranch: 'main' })
  failure(failures, historical.errors.length > 0, 'historical_repository_basis:' + historical.errors.join(','))
  failure(failures, artifact?.schemaVersion !== SCHEMA || artifact?.verdictToken !== VERDICT, 'schema_or_verdict')
  failure(failures, canonicalStableArtifactJson(artifact) !== canonicalStableArtifactJson(expected), 'stable_content_not_reproducible')
  failure(failures, containsGeneratedTimestamp(artifact), 'artifact_timestamp')
  failures.push(...checkArtifactIdentity(artifact, { root, artifactId: SCHEMA, materializerPath: MATERIALIZER_PATH, materializerVersion: MATERIALIZER_VERSION, allowGenerationBaseInput: true, allowVerifierInputDrift: true }).map(error => 'artifact_identity:' + error))
  checkPredecessors(root, artifact, failures)
  checkDossier(artifact, failures)
  const side = companions(completePath)
  checkEvidence(artifact, side['evidence.json'], failures)
  failure(failures, side['binding-matrix.json']?.schemaVersion !== SCHEMA + '-binding-matrix-v0' || canonicalStableArtifactJson(side['binding-matrix.json']?.v14ResearchDossier) !== canonicalStableArtifactJson(artifact.v14ResearchDossier.fiveFieldSummary), 'matrix_dossier')
  failure(failures, side['lineage-assessment.json']?.schemaVersion !== SCHEMA + '-lineage-v0' || canonicalStableArtifactJson(side['lineage-assessment.json']?.v14ResearchDossier) !== canonicalStableArtifactJson(artifact.v14ResearchDossier), 'lineage_dossier')
  checkGraph(artifact, side['graph-reconciliation.json']?.graphImpact, failures)
  failure(failures, canonicalStableArtifactJson(artifact.evidence) !== canonicalStableArtifactJson(side['evidence.json']), 'evidence_copy')
  failure(failures, canonicalStableArtifactJson(artifact.bindingMatrix) !== canonicalStableArtifactJson(side['binding-matrix.json']), 'matrix_copy')
  failure(failures, canonicalStableArtifactJson(artifact.lineageAssessment) !== canonicalStableArtifactJson(side['lineage-assessment.json']), 'lineage_copy')
  const fieldKitSidecar = { ...side['field-kit-impact.json'] }
  delete fieldKitSidecar.closureBoundary
  failure(failures, canonicalStableArtifactJson(artifact.fieldKitImpact) !== canonicalStableArtifactJson(fieldKitSidecar), 'field_kit_copy')
  checkScopeAndReadiness(artifact, failures)
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
  return unique(failures)
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const errors = checkArtifact(ROOT, resolve(process.argv[2] || ARTIFACT_PATH))
  console.log(JSON.stringify({ schema: SCHEMA, pass: errors.length === 0, errors }, null, 2))
  if (errors.length) process.exitCode = 1
}
