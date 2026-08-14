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
  CANDIDATE_SUZHOU,
  CHECKER_PATH,
  DOCUMENTATION_PATH,
  INPUT_PATHS,
  MATERIALIZER_PATH,
  MATERIALIZER_VERSION,
  NEGATIVE_CHECKER_PATH,
  OBSERVATION_SUZHOU,
  PREDECESSOR_COMPOSITION,
  PREDECESSOR_COMPOSITION_EVIDENCE,
  PROTECTED_ASSET_PATH,
  ROOT,
  SCHEMA,
  SUZHOU_REPORT_HTML_BYTES,
  SUZHOU_REPORT_HTML_SHA256,
  SUZHOU_REPORT_IMAGE_BYTES,
  SUZHOU_REPORT_IMAGE_SHA256,
  VERDICT,
  buildBundle,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v15.mjs'

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

function checkFiveFields(unit, failures) {
  const fields = unit?.fiveFieldBinding || {}
  for (const key of ['branchToken', 'palaceName', 'physicalChartSlot', 'ordinalBase', 'direction']) failure(failures, fields[key]?.status !== 'unresolved', 'unresolved_field:' + unit?.unitId + ':' + key)
  failure(failures, fields.fullBinding !== false || fields.directSingleWitnessFullBinding !== false || fields.productionOrdinal !== false || fields.semanticAuthority !== false, 'binding_promotion:' + unit?.unitId)
}

function checkDossier(artifact, failures) {
  const dossier = artifact.v15ResearchDossier
  failure(failures, dossier?.schemaVersion !== SCHEMA + '-research-dossier-v0', 'dossier_schema')
  failure(failures, dossier?.status !== 'derived_not_authoritative_graph_neutral', 'dossier_authority')
  failure(failures, JSON.stringify(dossier?.candidates?.map(item => item.candidateId)) !== JSON.stringify([CANDIDATE_JIELAN, CANDIDATE_ERXIANAN, CANDIDATE_JIELAN_PREVIEW, CANDIDATE_SUZHOU]), 'dossier_candidates')
  failure(failures, dossier?.fiveFieldSummary?.primaryAllUnresolved !== true || dossier.fiveFieldSummary.secondaryAllUnresolved !== true || dossier.fiveFieldSummary.tertiaryAllUnresolved !== true || dossier.fiveFieldSummary.quaternaryAllUnresolved !== true, 'dossier_binding_boundary')
  failure(failures, dossier?.fiveFieldSummary?.directSingleWitnessFullBindingCount !== 0 || dossier.fiveFieldSummary.productionOrdinalBindingCount !== 0 || dossier.fiveFieldSummary.semanticAuthorityCount !== 0, 'dossier_binding_promotion')
  failure(failures, dossier?.blockers?.length !== 4 || dossier.blockers.some(item => item.status !== 'open' || item.blocksParent !== true), 'dossier_blockers')
  for (const unit of Object.values(dossier.units || {})) checkFiveFields(unit, failures)

  const quaternary = dossier.units?.quaternary
  failure(failures, quaternary?.candidateId !== CANDIDATE_SUZHOU, 'suzhou_candidate')
  failure(failures, quaternary?.sourceIdentity?.reportedHolding?.status !== 'reported' || quaternary.sourceIdentity.reportedHolding.detail !== '曾在蘇州博物館內', 'suzhou_reported_holding')
  failure(failures, quaternary?.sourceIdentity?.sourceAuthority?.status !== 'unresolved' || quaternary.sourceIdentity.sameCopyAsAnhuiZi4051?.status !== 'unresolved', 'suzhou_identity_promotion')
  failure(failures, quaternary?.sourceBytes?.reportHtml?.byteSha256 !== SUZHOU_REPORT_HTML_SHA256 || quaternary.sourceBytes.reportHtml.byteLength !== SUZHOU_REPORT_HTML_BYTES, 'suzhou_html_identity')
  failure(failures, quaternary?.sourceBytes?.embeddedImage?.byteSha256 !== SUZHOU_REPORT_IMAGE_SHA256 || quaternary.sourceBytes.embeddedImage.byteLength !== SUZHOU_REPORT_IMAGE_BYTES || quaternary.sourceBytes.embeddedImage.width !== 470 || quaternary.sourceBytes.embeddedImage.height !== 784, 'suzhou_image_identity')
  failure(failures, quaternary?.directImageReview?.retrievedBytesVisuallyReviewed !== true || quaternary.directImageReview.chartLikeGrid?.status !== 'direct', 'suzhou_direct_review')
  failure(failures, quaternary?.graphAdmission?.sourceAdded !== false || quaternary.graphAdmission.observationAdded !== false || quaternary.graphAdmission.independentPhysicalWitnessAdmitted !== false, 'suzhou_graph_admission')
  failure(failures, JSON.stringify(dossier.remainingAcquisitionTargets?.[0]?.holder) !== JSON.stringify('蘇州博物館'), 'suzhou_acquisition_target')

  const gate = dossier.continuationDecisions?.suzhouFrontier
  failure(failures, gate?.decision !== 'stop_blocked', 'continuation_decision')
  for (const reason of ['new_evidence', 'validated_fact', 'frontier_not_actionable', 'unresolved_parent_blocker', 'no_safe_frontier']) failure(failures, !gate?.reasonCodes?.includes(reason), 'continuation_reason:' + reason)
  failure(failures, gate?.checkpoint?.automaticRetry !== false, 'continuation_automatic_retry')
  failure(failures, gate?.authorityBoundary?.gateRole !== 'workflow_continuation_only' || gate.authorityBoundary.domainReadiness !== 'not_evaluated' || gate.authorityBoundary.semanticAuthority !== 'not_established' || gate.authorityBoundary.productionActivation !== false || gate.authorityBoundary.childPassIsParentGoalPass !== false, 'continuation_authority_boundary')
}

function checkEvidence(artifact, evidence, failures) {
  failure(failures, evidence?.schemaVersion !== SCHEMA + '-evidence-v0', 'evidence_schema')
  failure(failures, evidence?.observations?.length !== artifact.observations?.length, 'evidence_observation_copy')
  failure(failures, !evidence?.v15ResearchDossier || canonicalStableArtifactJson(evidence.v15ResearchDossier) !== canonicalStableArtifactJson(artifact.v15ResearchDossier), 'evidence_dossier_copy')
  failure(failures, evidence?.reportedNonObservations?.some(item => item.includes('Suzhou') || item.includes('蘇州')) !== true, 'evidence_suzhou_boundary')
}

function checkGraph(artifact, graph, failures) {
  const expected = { claimCount: 30, sourceCount: 21, observationCount: 58, relationCount: 148, blockerCount: 11 }
  failure(failures, canonicalStableArtifactJson(graph?.predecessor) !== canonicalStableArtifactJson(expected), 'predecessor_graph_counts')
  failure(failures, canonicalStableArtifactJson(graph?.additive) !== canonicalStableArtifactJson({ claimCount: 0, sourceCount: 0, physicalWitnessCount: 0, observationCount: 0, relationCount: 0, blockerCount: 0 }), 'additive_graph_counts')
  failure(failures, canonicalStableArtifactJson(graph?.successor) !== canonicalStableArtifactJson(expected), 'successor_graph_counts')
  failure(failures, graph?.claimsAdded !== 0 || graph.sourcesAdded?.length !== 0 || graph.addedObservationIds?.length !== 0 || graph.addedRelationIds?.length !== 0 || graph.blockersClosed?.length !== 0 || graph.independentPhysicalWitnessesAdmitted !== 0, 'graph_promotion')
  failure(failures, graph?.v15ResearchBoundary?.claimsAdded !== 0 || graph.v15ResearchBoundary.sourcesAdded !== 0 || graph.v15ResearchBoundary.observationsAdded !== 0 || graph.v15ResearchBoundary.relationsAdded !== 0 || graph.v15ResearchBoundary.blockersClosed?.length !== 0 || graph.v15ResearchBoundary.heldOutCandidateIds?.[0] !== CANDIDATE_SUZHOU || graph.v15ResearchBoundary.heldOutObservationIds?.[0] !== OBSERVATION_SUZHOU, 'dossier_graph_promotion')
}

function checkScopeAndReadiness(artifact, failures) {
  failure(failures, artifact.basisHead !== BASIS_HEAD || artifact.branch !== 'main', 'basis_or_branch')
  failure(failures, JSON.stringify(artifact.scope?.v14ResearchUnitsCompleted) !== JSON.stringify(['primary-jielan-1581', 'secondary-erxianan-1906', 'tertiary-jielan-commercial-preview']), 'scope_v14_units')
  failure(failures, JSON.stringify(artifact.scope?.v15ResearchUnitsCompleted) !== JSON.stringify(['primary-jielan-1581', 'secondary-erxianan-1906', 'tertiary-jielan-commercial-preview', 'quaternary-jielan-suzhou-museum-chart-lead']), 'scope_v15_units')
  failure(failures, artifact.scope?.v15GraphAdmission !== 'none' || artifact.scope.v15DirectChartObservationRecorded !== true || artifact.scope.v15InstitutionalItemResolved !== false || artifact.scope.v15SameCopyEstablished !== false || artifact.scope.directSingleWitnessFullBindingEstablished !== false || artifact.scope.independentWitnessesAdmitted !== 0, 'scope_promotion')
  failure(failures, artifact.readinessImpact?.readiness !== 'not_safe_to_start' || artifact.readinessImpact.grounding !== 'blocked' || artifact.readinessImpact.activation !== 'experimental_only' || artifact.readinessImpact.rotation06 !== 'representation_only', 'readiness_boundary')
  failure(failures, artifact.preservation?.predecessorArtifactsRewritten !== false || artifact.preservation.historicalPredecessorBytesRewritten !== false || artifact.preservation.productionChanged !== false || artifact.preservation.remoteDatabaseChanged !== false || artifact.preservation.deploymentPerformed !== false || artifact.preservation.commitPerformed !== false || artifact.preservation.pushPerformed !== false || artifact.preservation.v15ReportBytesStoredInRepo !== false, 'preservation_boundary')
  failure(failures, artifact.deterministicContract?.generatedAt !== 'forbidden' || artifact.deterministicContract.network !== 'forbidden_during_materialization' || artifact.deterministicContract.noAutomaticPromotion !== true, 'deterministic_contract')
  failure(failures, artifact.materializer !== MATERIALIZER_PATH || artifact.checker !== CHECKER_PATH || artifact.negativeChecker !== NEGATIVE_CHECKER_PATH || artifact.documentation !== undefined && artifact.documentation !== DOCUMENTATION_PATH, 'tool_paths')
}

function checkFrontier(artifact, failures) {
  const source = artifact.sourceLineage?.researchFrontierOnlySourceRecords?.find(item => item.sourceId === CANDIDATE_SUZHOU)
  failure(failures, !source || source.graphAdmission !== false || source.independentPhysicalWitness !== false || source.sourceAuthority !== 'not_established' || source.sameCopyStatus !== 'unresolved', 'lineage_frontier_admission')
  failure(failures, !artifact.researchFrontier?.frontierOnlySources?.includes(CANDIDATE_SUZHOU), 'frontier_source_id')
  failure(failures, artifact.researchFrontier?.v15ObservationRecord?.observationId !== OBSERVATION_SUZHOU || artifact.researchFrontier.v15ObservationRecord.graphAdmission !== false || artifact.researchFrontier.v15ObservationRecord.fiveFieldBinding.fullBindingObserved !== false, 'frontier_observation_boundary')
  failure(failures, artifact.researchFrontier?.acquisitionLeads?.some(item => item.leadId === 'lead-suzhou-museum-jielan-reported-chart-v15' && item.doesNotEnterGraph === true) !== true, 'frontier_acquisition_lead')
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
  checkFrontier(artifact, failures)
  const side = companions(completePath)
  checkEvidence(artifact, side['evidence.json'], failures)
  failure(failures, side['binding-matrix.json']?.schemaVersion !== SCHEMA + '-binding-matrix-v0' || canonicalStableArtifactJson(side['binding-matrix.json']?.v15ResearchDossier) !== canonicalStableArtifactJson(artifact.v15ResearchDossier.fiveFieldSummary), 'matrix_dossier')
  failure(failures, side['lineage-assessment.json']?.schemaVersion !== SCHEMA + '-lineage-v0' || canonicalStableArtifactJson(side['lineage-assessment.json']?.v15ResearchDossier) !== canonicalStableArtifactJson(artifact.v15ResearchDossier), 'lineage_dossier')
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
