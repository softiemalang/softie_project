import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'

import {
  canonicalIdentityJson,
  checkArtifactIdentity,
  checkHistoricalRepositoryBasis,
  stableArtifactContentEqual,
} from '../src/artifactIdentity.js'
import {
  ARTIFACT_DIR,
  BASIS_HEAD,
  MATERIALIZER_PATH,
  MATERIALIZER_VERSION,
  PREDECESSOR_FIELD_KIT,
  PREDECESSOR_FRONTIER,
  PREDECESSOR_SOURCE_IDENTITY,
  PREDECESSOR_TOYO,
  REPORT_SOURCE_ID,
  ROOT,
  SCHEMA,
  VERDICT,
  buildBundle,
} from './materialize-ziwei-p0-toyo-vii-3-157-institutional-evidence-v1.mjs'
import { SAJU_SOURCE_DERIVED_ASSET_PATH } from '../src/interpretationPrep/sajuSourceDerivedEvidenceAsset.js'

export const ARTIFACT_PATH = `${ARTIFACT_DIR}/complete.json`

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
const OUTPUT_NAMES = ['evidence.json', 'graph-reconciliation.json', 'field-kit-impact.json']
const PREDECESSOR_PATHS = [PREDECESSOR_SOURCE_IDENTITY, PREDECESSOR_TOYO, PREDECESSOR_FRONTIER, PREDECESSOR_FIELD_KIT]

function stable(value) {
  const copy = structuredClone(value)
  delete copy.artifactIdentity
  delete copy.observedHead
  delete copy.originMainHead
  return copy
}

function same(left, right) {
  return canonicalIdentityJson(stable(left)) === canonicalIdentityJson(stable(right))
}

function containsTimestampValue(value, path = '') {
  if (Array.isArray(value)) return value.some((item, index) => containsTimestampValue(item, `${path}[${index}]`))
  if (!value || typeof value !== 'object') return false
  return Object.entries(value).some(([key, child]) => {
    if (key === 'generatedAt' && child !== 'forbidden') return true
    if (key === 'timestamp' && child !== 'forbidden') return true
    return containsTimestampValue(child, `${path}.${key}`)
  })
}

function readCompanions(root, completePath) {
  const directory = dirname(completePath)
  return Object.fromEntries(OUTPUT_NAMES.map(name => [name, parse(resolve(directory, name))]))
}

function checkSidecars(root, completePath, files, failures) {
  const paths = [['complete.json', completePath], ...OUTPUT_NAMES.map(name => [name, resolve(dirname(completePath), name)])]
  for (const [name, path] of paths) {
    const sidecarPath = `${path}.integrity.json`
    failure(failures, !existsSync(path), `missing_output:${name}`)
    failure(failures, !existsSync(sidecarPath), `missing_sidecar:${name}`)
    if (!existsSync(path) || !existsSync(sidecarPath)) continue
    const sidecar = parse(sidecarPath)
    const body = readFileSync(path)
    failure(failures, sidecar.schemaVersion !== `${SCHEMA}-integrity-v0`, `integrity_schema:${name}`)
    failure(failures, sidecar.path !== relative(root, path), `integrity_path:${name}`)
    failure(failures, sidecar.byteSha256 !== sha256(body), `integrity_hash:${name}`)
  }
  void files
}

export function checkBundle({ artifact, files }, root = ROOT, completePath = resolve(root, ARTIFACT_PATH)) {
  const failures = []
  let expected
  try {
    expected = buildBundle(root)
  } catch (error) {
    return [`rebuild_failed:${error.message}`]
  }

  const historical = checkHistoricalRepositoryBasis(root, BASIS_HEAD, { expectedBranch: 'main' })
  failure(failures, historical.errors.length > 0, `historical_repository_basis:${historical.errors.join(',')}`)
  failure(failures, artifact?.schemaVersion !== SCHEMA, 'schema_version')
  failure(failures, artifact?.verdictToken !== VERDICT, 'verdict')
  failure(failures, artifact?.basisHead !== BASIS_HEAD, 'basis_head')
  failure(failures, artifact?.branch !== 'main', 'branch')
  failure(failures, !same(artifact, expected.artifact), 'stable_content_not_reproducible')

  const identityErrors = checkArtifactIdentity(artifact, {
    root,
    artifactId: SCHEMA,
    materializerPath: MATERIALIZER_PATH,
    materializerVersion: MATERIALIZER_VERSION,
    allowGenerationBaseInput: true,
    allowVerifierInputDrift: true,
  })
  failures.push(...identityErrors.map(error => `artifact_identity:${error}`))

  const predecessorChain = artifact?.predecessorChain || []
  failure(failures, predecessorChain.length !== PREDECESSOR_PATHS.length, 'predecessor_chain_count')
  for (const path of PREDECESSOR_PATHS) {
    const row = predecessorChain.find(item => item.path === path)
    failure(failures, !row || row.byteSha256 !== sha256(readFileSync(resolve(root, path))), `predecessor_byte_identity:${path}`)
  }

  const provenance = artifact?.institutionalEvidence?.provenance
  failure(failures, artifact?.institutionalEvidence?.evidenceId !== 'evidence-toyo-vii-3-157-institutional-reply-20260812', 'evidence_id')
  failure(failures, artifact?.institutionalEvidence?.sourceId !== REPORT_SOURCE_ID, 'report_source_id')
  failure(failures, artifact?.institutionalEvidence?.physicalWitnessSourceId !== 'src-toyo-1646', 'physical_witness_ref')
  failure(failures, artifact?.institutionalEvidence?.physicalWitnessCountAdded !== 0, 'physical_witness_added')
  failure(failures, artifact?.institutionalEvidence?.catalogRowsRemainMetadata !== true, 'catalog_metadata_boundary')
  failure(failures, artifact?.institutionalEvidence?.topLevelSourceIdentityBlockerClosed !== false, 'source_identity_blocker_boundary')
  failure(failures, artifact?.institutionalEvidence?.directSemanticObservationAcquired !== false, 'semantic_observation_boundary')
  for (const [key, value] of Object.entries({
    messageId: '19ff4725ca62e800',
    threadId: '19feb2ee1dcf009c',
    receivedDate: '2026-08-12',
    subject: 'Re: 所蔵資料 VII-3-157『新刊希夷陳先生紫微斗數全集』の書誌・閲覧についてのお問い合わせ',
  })) {
    // The subject is checked below with its exact Unicode spelling; keep this
    // loop limited to the stable message identifiers and received date.
    if (key !== 'subject') failure(failures, provenance?.[key] !== value, `provenance:${key}`)
  }
  failure(failures, provenance?.subject !== 'Re: 所蔵資料 VII-3-157『新刊希夷陳先生紫微斗數全集』の書誌・閲覧についてのお問い合わせ', 'provenance:subject')
  failure(failures, provenance?.sender?.name !== '清水信子 / Nobuko Shimizu', 'provenance:sender_name')
  failure(failures, provenance?.sender?.institution !== '公益財団法人 東洋文庫', 'provenance:sender_institution')
  failure(failures, provenance?.sender?.title !== '図書部資料整理課兼閲覧複写課長・主幹研究員', 'provenance:sender_title')
  failure(failures, provenance?.sender?.email !== 'n-shimizu@toyo-bunko.or.jp', 'provenance:sender_email')
  failure(failures, provenance?.target?.callNumber !== 'VII-3-157' || provenance?.target?.title !== '新刊希夷陳先生紫微斗數全集', 'provenance:target')
  failure(failures, provenance?.rawMessageBytes !== 'not_provided_to_repository' || provenance?.provenanceKind !== 'user_supplied_gmail_provenance', 'provenance:raw_boundary')

  const source = artifact?.sourceLineage?.addedSource
  failure(failures, source?.sourceId !== REPORT_SOURCE_ID || source?.sourceKind !== 'institution_staff_direct_report', 'source_kind')
  failure(failures, source?.physicalTargetSourceId !== 'src-toyo-1646' || source?.physicalWitnessStatus !== 'report_about_existing_physical_witness; not_a_new_physical_witness', 'source_physical_boundary')
  failure(failures, source?.independence !== 'not_a_physical_witness; does_not_add_an_independent_physical_lineage', 'source_independence_boundary')
  failure(failures, source?.storedInGit !== false || !/semantic_authority_not_established/.test(source?.authority || ''), 'source_authority_boundary')
  const catalog = artifact?.sourceLineage?.catalogReconciliation
  failure(failures, catalog?.reportedPhysicalItemCount !== 1 || catalog?.duplicateDatabaseRowsReconciled !== true, 'catalog_duplicate_reconciliation')
  failure(failures, catalog?.catalogRowsRemainMetadata !== true || catalog?.topLevelSourceIdentityBlockerClosed !== false, 'catalog_reconciliation_boundary')
  failure(failures, artifact?.sourceLineage?.physicalWitnessCount !== 1 || artifact?.sourceLineage?.independentPhysicalWitnessesAdmitted !== 0 || artifact?.sourceLineage?.lineageInferencePerformed !== false, 'lineage_boundary')

  const observations = artifact?.observations || []
  failure(failures, observations.length !== 4, 'observation_count')
  failure(failures, new Set(observations.map(item => item.observationId)).size !== observations.length, 'duplicate_observation_id')
  failure(failures, observations.some(item => !Array.isArray(item.sourceIds) || item.sourceIds.length !== 1 || item.sourceIds[0] !== REPORT_SOURCE_ID), 'observation_source_binding')
  failure(failures, observations.some(item => item.researcherDirectObservation !== false || item.transcriptionRole !== 'locator_only'), 'observation_direct_or_ocr_promotion')
  failure(failures, observations.some(item => item.lineageStatus !== 'not_observed_and_not_inferred' || item.independenceStatus !== 'report_is_not_a_physical_witness'), 'observation_lineage_boundary')
  failure(failures, observations.some(item => !/semantic_authority_not_established/.test(item.authorityStatus || '')), 'observation_authority_boundary')
  const itemCountObservation = observations.find(item => item.observationId === 'obs-toyo-vii-3-157-staff-physical-item-count')
  const inscriptionObservation = observations.find(item => item.observationId === 'obs-toyo-vii-3-157-staff-editorial-inscription')
  const limitObservation = observations.find(item => item.observationId === 'obs-toyo-vii-3-157-staff-semantic-limit')
  failure(failures, itemCountObservation?.rawQuote !== 'データが重複していたためで、実際は1点です。', 'physical_item_quote')
  failure(failures, inscriptionObservation?.rawQuote !== '一見したところ、巻頭に続く編著者事項に「金陵益軒唐謙梓」とございます。', 'inscription_quote')
  failure(failures, inscriptionObservation?.qualification !== '一見したところ' || inscriptionObservation?.reportedInscription !== '金陵益軒唐謙梓', 'inscription_qualification')
  failure(failures, !/no direct observation/i.test(limitObservation?.detail || '') || !/no semantic page observation|not_a_page_observation/i.test(JSON.stringify(limitObservation || {})), 'semantic_nonobservation_boundary')
  failure(failures, observations.some(item => item.observationId === 'obs-toyo-vii-3-157-staff-editorial-inscription' && /folio|page/i.test(item.locator) && !/exact (?:page|丁)\/folio/i.test(item.locator)), 'invented_inscription_locator')

  const claims = artifact?.claimReconciliation || []
  failure(failures, claims.length !== 30 || unique(claims.map(item => item.claimId)).length !== 30, 'claim_reconciliation_count')
  failure(failures, claims.some(item => item.predecessorStatus !== item.successorStatus || item.statusChanged !== false || item.sourceRelationPromotion !== 'none'), 'claim_status_promotion')
  failure(failures, claims.some(item => item.directObservationStatus !== 'unchanged; staff report is not a researcher page/leaf observation' || item.authorityStatus !== 'unchanged; semantic_authority_not_established'), 'claim_observation_boundary')
  failure(failures, artifact?.claimImpact?.claimsAdded !== 0 || artifact?.claimImpact?.claimsPromoted !== 0 || artifact?.claimImpact?.claimStatusChanges?.length !== 0 || artifact?.claimImpact?.stableClaimCount !== 0 || artifact?.claimImpact?.semanticAuthorityCount !== 0, 'claim_impact_promotion')
  failure(failures, artifact?.claimImpact?.claimsWithTOYOIdentityContext?.length !== 29 || artifact?.claimImpact?.directSemanticClaimSupportAdded?.length !== 0, 'claim_context_boundary')

  const relations = artifact?.relations || []
  failure(failures, relations.length !== 4, 'relation_count')
  failure(failures, new Set(relations.map(item => item.relationId)).size !== relations.length, 'duplicate_relation_id')
  const claimIdSet = new Set(claims.map(item => item.claimId))
  failure(failures, relations.some(item => !Array.isArray(item.claimIds) || unique(item.claimIds).length !== item.claimIds.length || item.claimIds.some(id => !claimIdSet.has(id))), 'relation_claim_binding')
  failure(failures, relations.some(item => !Array.isArray(item.observationIds) || item.observationIds.some(id => !observations.some(observation => observation.observationId === id))), 'relation_observation_binding')
  failure(failures, relations.some(item => item.sourceIds?.some(id => id !== REPORT_SOURCE_ID) || !/not_admitted/.test(item.promotion)), 'relation_source_or_promotion_boundary')
  failure(failures, relations.some(item => /semantic_authority_established|source_authority_established|independent_witness_admitted|stable_claim/.test(JSON.stringify(item))), 'relation_authority_promotion')
  failure(failures, relations.some(item => !Array.isArray(item.affectedClaimIds) || item.claimIds.join('|') !== item.affectedClaimIds.join('|')), 'relation_affected_claim_mismatch')
  failure(failures, !relations.some(item => item.relationId === 'relation-toyo-vii-3-157-staff-physical-item-count' && item.relationKind === 'source_identity_reconciliation_only'), 'physical_relation_missing')
  failure(failures, !relations.some(item => item.relationId === 'relation-toyo-vii-3-157-staff-semantic-limit' && item.relationKind === 'negative_semantic_observation_boundary'), 'semantic_limit_relation_missing')

  const fieldKitTargets = artifact?.fieldKitImpact?.targetReassessment || []
  failure(failures, fieldKitTargets.length !== 10 || unique(fieldKitTargets.map(item => item.targetId)).length !== 10, 'field_kit_target_count')
  failure(failures, fieldKitTargets.some(item => item.statusBefore !== item.statusAfter || item.statusChanged !== false || item.closure !== 'not_closed'), 'field_kit_target_promotion')
  failure(failures, artifact?.fieldKitImpact?.existingFieldKitBytesRewritten !== false || artifact?.fieldKitImpact?.sourceIdentityTargetStillActionRequired !== true || artifact?.fieldKitImpact?.rightsTargetStillHumanPolicyReview !== true, 'field_kit_boundary')

  const blockers = artifact?.blockerReassessment || []
  failure(failures, blockers.length !== 11 || blockers.some((item, index) => item.id !== ALL_BLOCKER_IDS[index]), 'blocker_count_or_order')
  failure(failures, blockers.some(item => item.statusBefore !== item.statusAfter || item.statusChanged !== false), 'blocker_status_promotion')
  failure(failures, artifact?.graphImpact?.blockersClosed?.length !== 0 || artifact?.blockerImpact?.blockersClosed?.length !== 0, 'blocker_closure')
  failure(failures, artifact?.blockerImpact?.resolvedSubBoundaryIsNotTopLevelClosure !== true, 'subboundary_closure_label')
  failure(failures, blockers.find(item => item.id === 'blocker-source-identity-unresolved')?.uncertaintyReduction?.length !== 2, 'source_identity_uncertainty_reduction')
  failure(failures, blockers.find(item => item.id === 'blocker-image-reuse-rights')?.statusAfter !== 'needs_human_review', 'rights_status_boundary')
  failure(failures, blockers.some(item => !Array.isArray(item.evidenceRefs) || !Array.isArray(item.newObservationIds) || !Array.isArray(item.newRelationIds)), 'blocker_reassessment_shape')

  const graph = artifact?.graphImpact
  failure(failures, graph?.predecessor?.claimCount !== 30 || graph?.predecessor?.sourceCount !== 13 || graph?.predecessor?.observationCount !== 40 || graph?.predecessor?.relationCount !== 130 || graph?.predecessor?.blockerCount !== 11, 'predecessor_graph_counts')
  failure(failures, graph?.additive?.claimCount !== 0 || graph?.additive?.sourceCount !== 1 || graph?.additive?.physicalWitnessCount !== 0 || graph?.additive?.institutionalReportSourceCount !== 1 || graph?.additive?.observationCount !== 4 || graph?.additive?.relationCount !== 4 || graph?.additive?.blockerCount !== 0, 'additive_graph_counts')
  failure(failures, graph?.successor?.claimCount !== 30 || graph?.successor?.sourceCount !== 14 || graph?.successor?.observationCount !== 44 || graph?.successor?.relationCount !== 134 || graph?.successor?.blockerCount !== 11, 'successor_graph_counts')
  failure(failures, graph?.physicalWitnessesAdded?.length !== 0 || graph?.independentPhysicalWitnessesAdmitted !== undefined, 'physical_witness_graph_boundary')
  failure(failures, graph?.blockersStillOpen?.length !== 11, 'open_blocker_count')

  const statuses = artifact?.readinessImpact
  failure(failures, statuses?.readiness !== 'not_safe_to_start' || statuses?.grounding !== 'blocked' || statuses?.activation !== 'experimental_only' || statuses?.rotation06 !== 'representation_only', 'readiness_boundary')
  failure(failures, statuses?.sourceAuthorityPromoted !== false || statuses?.semanticAuthorityPromoted !== false || statuses?.independentWitnessesAdmitted !== 0, 'authority_boundary')
  const scope = artifact?.scope
  for (const [field, value] of Object.entries({
    externalAcquisitionPerformed: false,
    networkUsedDuringMaterialization: false,
    sourceAuthorityPromoted: false,
    semanticAuthorityPromoted: false,
    independentWitnessesAdmitted: 0,
    productionChanged: false,
    readinessChanged: false,
    groundingChanged: false,
    activationChanged: false,
    remoteDatabaseChanged: false,
    deployPerformed: false,
    commitPerformed: false,
    pushPerformed: false,
  })) failure(failures, scope?.[field] !== value, `scope_mutation:${field}`)

  const preservation = artifact?.preservation
  failure(failures, preservation?.predecessorArtifactsRewritten !== false || preservation?.historicalPredecessorBytesRewritten !== false || preservation?.existingFieldKitRewritten !== false, 'predecessor_mutation')
  failure(failures, preservation?.sourceImagesStoredInGit !== false || preservation?.sourcePdfsStoredInGit !== false || preservation?.rawGmailBytesStoredInGit !== false, 'source_storage_mutation')
  failure(failures, preservation?.protectedUntrackedDashJpgPreserved !== true || preservation?.protectedAsset?.canonicalPath !== SAJU_SOURCE_DERIVED_ASSET_PATH || preservation?.protectedAsset?.byteSha256 !== sha256(readFileSync(resolve(root, SAJU_SOURCE_DERIVED_ASSET_PATH))), 'protected_asset_boundary')
  failure(failures, preservation?.commitPerformed !== false || preservation?.pushPerformed !== false || preservation?.deploymentPerformed !== false || preservation?.remoteDatabaseChanged !== false, 'external_mutation_boundary')
  failure(failures, artifact?.deterministicContract?.generatedAt !== 'forbidden' || artifact?.deterministicContract?.network !== 'forbidden_during_materialization', 'deterministic_contract')
  failure(failures, containsTimestampValue(artifact), 'generated_timestamp')

  const expectedFiles = expected.files
  for (const name of OUTPUT_NAMES) failure(failures, !same(files?.[name], expectedFiles[name]), `companion_content:${name}`)
  checkSidecars(root, completePath, files, failures)
  return [...new Set(failures)]
}

export function checkArtifact(root = ROOT, completePath = resolve(root, ARTIFACT_PATH)) {
  const artifact = parse(completePath)
  const files = readCompanions(root, completePath)
  return checkBundle({ artifact, files }, root, completePath)
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const completePath = resolve(process.argv[2] || ARTIFACT_PATH)
  const errors = checkArtifact(ROOT, completePath)
  console.log(JSON.stringify({
    schema: SCHEMA,
    status: errors.length ? 'failed' : 'ok',
    errors,
    basisHead: BASIS_HEAD,
    verdict: VERDICT,
  }, null, 2))
  if (errors.length) process.exitCode = 1
}
