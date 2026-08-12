import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'

import {
  attachArtifactIdentity,
  buildArtifactIdentity,
} from '../src/artifactIdentity.js'
import { SAJU_SOURCE_DERIVED_ASSET_PATH } from '../src/interpretationPrep/sajuSourceDerivedEvidenceAsset.js'

export const SCHEMA = 'ziwei-p0-toyo-vii-3-157-institutional-evidence-v1'
export const VERDICT = 'complete_ziwei_p0_toyo_vii_3_157_institutional_evidence_bounded_reconciled'
export const MATERIALIZER_VERSION = '1.0.0'
export const BASIS_HEAD = '6c0d8414dad6940b3d28081afe1b96703a683d1f'
export const MATERIALIZER_PATH = `scripts/materialize-${SCHEMA}.mjs`
export const ARTIFACT_DIR = `artifacts/${SCHEMA}`
export const ARTIFACT_PATH = `${ARTIFACT_DIR}/complete.json`
export const ROOT = resolve(new URL('..', import.meta.url).pathname)

export const PREDECESSOR_SOURCE_IDENTITY = 'artifacts/ziwei-p0-claim-source-identity-frontier-v1/complete.json'
export const PREDECESSOR_TOYO = 'artifacts/ziwei-p0-toyo-1646-extended-observation-v0/complete.json'
export const PREDECESSOR_FRONTIER = 'artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json'
export const PREDECESSOR_FIELD_KIT = 'artifacts/ziwei-p0-evidence-acquisition-field-kit-v1/complete.json'

export const REPORT_SOURCE_ID = 'src-toyo-vii-3-157-institutional-reply-20260812'
export const PHYSICAL_WITNESS_SOURCE_ID = 'src-toyo-1646'
export const CATALOG_SOURCE_IDS = ['src-toyo-80941-catalog', 'src-toyo-80943-catalog']

const INPUT_PATHS = [
  PREDECESSOR_SOURCE_IDENTITY,
  PREDECESSOR_TOYO,
  PREDECESSOR_FRONTIER,
  PREDECESSOR_FIELD_KIT,
  'src/artifactIdentity.js',
  'src/interpretationPrep/sajuSourceDerivedEvidenceAsset.js',
  MATERIALIZER_PATH,
  SAJU_SOURCE_DERIVED_ASSET_PATH,
]

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

const REPORT = Object.freeze({
  evidenceId: 'evidence-toyo-vii-3-157-institutional-reply-20260812',
  provenanceKind: 'user_supplied_gmail_provenance',
  rawMessageBytes: 'not_provided_to_repository',
  messageId: '19ff4725ca62e800',
  threadId: '19feb2ee1dcf009c',
  receivedDate: '2026-08-12',
  subject: 'Re: 所蔵資料 VII-3-157『新刊希夷陳先生紫微斗數全集』の書誌・閲覧についてのお問い合わせ',
  sender: {
    name: '清水信子 / Nobuko Shimizu',
    institution: '公益財団法人 東洋文庫',
    title: '図書部資料整理課兼閲覧複写課長・主幹研究員',
    email: 'n-shimizu@toyo-bunko.or.jp',
  },
  target: {
    institution: '公益財団法人 東洋文庫',
    callNumber: 'VII-3-157',
    title: '新刊希夷陳先生紫微斗數全集',
  },
  evidenceBoundary: 'institution_staff_direct_inspection_report; exact supplied metadata and excerpts are preserved; researcher did not receive a page image or inspect the original in this packet',
})

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const sortValue = value => Array.isArray(value)
  ? value.map(sortValue)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sortValue(value[key])]))
    : value
export const canonicalJson = value => `${JSON.stringify(sortValue(value), null, 2)}\n`

const git = (root, args) => execFileSync(
  'git',
  ['-c', 'core.fsmonitor=false', ...args],
  { cwd: root, encoding: 'utf8' },
).trim()

const readJson = (root, path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'))
const fileSha256 = (root, path) => sha256(readFileSync(resolve(root, path)))
const unique = values => [...new Set(values)]
const requireValue = (condition, message) => {
  if (!condition) throw new Error(message)
}

function repository(root) {
  return {
    branch: git(root, ['branch', '--show-current']),
    currentHead: git(root, ['rev-parse', 'HEAD']),
    originMainHead: git(root, ['rev-parse', 'origin/main']),
  }
}

function sourceLineageSource() {
  return {
    sourceId: REPORT_SOURCE_ID,
    sourceKind: 'institution_staff_direct_report',
    access: 'incoming institutional email reply; raw Gmail bytes are not stored',
    catalogIdentity: 'staff report identifies the existing Toyo Bunko call number VII-3-157 and title; it is not a catalog row',
    physicalTargetSourceId: PHYSICAL_WITNESS_SOURCE_ID,
    catalogRowRefs: CATALOG_SOURCE_IDS,
    physicalWitnessStatus: 'report_about_existing_physical_witness; not_a_new_physical_witness',
    directInspection: 'staff directly checked the material and reported bounded findings; researcher direct page/leaf observation is absent',
    lineage: 'institutional_report_attached_to_src-toyo-1646; it does not establish textual transmission lineage',
    independence: 'not_a_physical_witness; does_not_add_an_independent_physical_lineage',
    authority: 'institution_staff_direct_inspection_report_for_bounded_item_identity_and_inscription_presence; edition_and_semantic_authority_not_established',
    reuseRights: 'viewing/copy procedure is reported; no image-level repository redistribution or reuse permission is granted',
    storedInGit: false,
    reportProvenanceRef: REPORT.evidenceId,
  }
}

function buildEvidence(claimRows) {
  const sourceContextClaimIds = claimRows
    .filter(item => item.sourceIds.includes(PHYSICAL_WITNESS_SOURCE_ID))
    .map(item => item.claimId)
  const semanticBoundaryClaimIds = claimRows
    .filter(item => item.family !== 'calendar_input')
    .map(item => item.claimId)

  const common = {
    sourceIds: [REPORT_SOURCE_ID],
    evidenceSourceId: REPORT_SOURCE_ID,
    physicalWitnessSourceId: PHYSICAL_WITNESS_SOURCE_ID,
    researcherDirectObservation: false,
    transcriptionRole: 'locator_only',
    lineageStatus: 'not_observed_and_not_inferred',
    independenceStatus: 'report_is_not_a_physical_witness',
    authorityStatus: 'bounded_report_only; semantic_authority_not_established',
    doesNotEstablish: [
      'VII-3-157_is_the_original_edition_or_original_printing_of_金陵益軒唐謙梓',
      'the_item_is_not_a_later_鈔本_or_寫本',
      'independent_physical_lineage_from_Nanyang_Nanbei_NARA_or_existing_TOYO_material',
      'complete_twelve_palace_semantic_map',
      'Tianfu_coordinate_or_direction_semantic_authority',
      'Four_Transformations_or_命主_身主_rule_surface',
      'production_readiness_semantic_authority_or_activation',
    ],
  }

  const observations = [
    {
      ...common,
      observationId: 'obs-toyo-vii-3-157-staff-physical-item-count',
      observationKind: 'institutional_catalog_duplicate_reconciliation',
      directObservationStatus: 'institution_staff_direct_inspection_report',
      observationMode: 'staff_report; no page image or leaf supplied; catalog rows remain metadata',
      locator: 'Toyo Bunko VII-3-157; DB 鈔本 / 寫本 duplicate entries',
      surface: 'physical item count and duplicate database records',
      rawQuote: 'データが重複していたためで、実際は1点です。',
      detail: 'The institution reports that the 鈔本 and 寫本 records were duplicated data and that the actual holding is one physical item.',
      whatItEstablishes: ['one actual physical item for VII-3-157 in the staff report', 'the two cited database rows should not be counted as two physical witnesses'],
      affectedClaimIds: sourceContextClaimIds,
      blockerIds: ['blocker-source-identity-unresolved'],
    },
    {
      ...common,
      observationId: 'obs-toyo-vii-3-157-staff-editorial-inscription',
      observationKind: 'institution_staff_reported_textual_inscription',
      directObservationStatus: 'institution_staff_direct_inspection_report',
      observationMode: 'staff limited inspection report; exact page/folio and image are absent',
      locator: '巻頭に続く編著者事項; exact 丁/folio not supplied',
      surface: 'preface-adjacent editor/author statement',
      rawQuote: '一見したところ、巻頭に続く編著者事項に「金陵益軒唐謙梓」とございます。',
      qualification: '一見したところ',
      reportedInscription: '金陵益軒唐謙梓',
      detail: 'The staff member reports that, on a limited look, the editor/author statement following the opening title area contains 金陵益軒唐謙梓. This is an institutional report of presence, not a researcher-reviewed page image or a conclusion about original edition status.',
      whatItEstablishes: ['bounded reported presence of the exact inscription in the stated context'],
      affectedClaimIds: sourceContextClaimIds,
      blockerIds: ['blocker-source-identity-unresolved'],
    },
    {
      ...common,
      observationId: 'obs-toyo-vii-3-157-staff-viewing-copy-route',
      observationKind: 'institutional_access_and_copy_procedure_report',
      directObservationStatus: 'institutional_procedure_report; not_a_page_observation',
      observationMode: 'staff reply about original viewing and copy application',
      locator: 'institutional reply; requested 丁 must be identified after original inspection',
      surface: 'original-viewing, copy-request, page-limit, and output procedure',
      rawQuote: null,
      detail: 'The reported procedure is that the original should in principle be viewed first, the relevant 丁 identified, and then a copy requested; copy-page limits apply and paper output is the default.',
      whatItEstablishes: ['a concrete institutional route for future leaf-level acquisition and human review'],
      affectedClaimIds: [],
      blockerIds: ['blocker-source-identity-unresolved', 'blocker-image-reuse-rights'],
    },
    {
      ...common,
      observationId: 'obs-toyo-vii-3-157-staff-semantic-limit',
      observationKind: 'institution_reported_semantic_observation_limit',
      directObservationStatus: 'institution_staff_reported_not_specific_on_the_spot',
      observationMode: 'negative capability boundary in staff reply; no semantic page observation supplied',
      locator: '十二宮 / 安天府 / 四化 / 命主·身主 requested surfaces; no exact 丁 supplied',
      surface: 'semantic-surface non-observation boundary',
      rawQuote: null,
      detail: 'The staff member could not readily identify the 十二宮, 安天府, 四化, or 命主·身主 positions in the reply and directed the researcher to inspect the original. Therefore no direct observation of those surfaces is admitted here.',
      whatItEstablishes: ['the reply does not contain a page-level semantic observation for the requested rule surfaces'],
      affectedClaimIds: semanticBoundaryClaimIds,
      blockerIds: [
        'blocker-palace-semantic-identity',
        'blocker-direct-rule-absent',
        'blocker-tianfu-raw-formula-contradiction',
        'blocker-tianfu-rotation06-semantic-authority',
        'blocker-four-transform-source-witness',
        'blocker-life-body-ruler-source-legibility',
      ],
    },
  ]

  return {
    source: sourceLineageSource(),
    report: REPORT,
    observations,
    catalogReconciliation: {
      physicalWitnessSourceId: PHYSICAL_WITNESS_SOURCE_ID,
      callNumber: REPORT.target.callNumber,
      title: REPORT.target.title,
      catalogRowRefs: CATALOG_SOURCE_IDS,
      catalogRowsRemainMetadata: true,
      reportedPhysicalItemCount: 1,
      duplicateDatabaseRowsReconciled: true,
      reconciliationStatus: 'bounded_institutional_report; one physical item, not two witnesses',
      topLevelSourceIdentityBlockerClosed: false,
      unresolved: [
        'edition/date/manuscript-or-printed status',
        'colophon and exact leaf/folio identity',
        'textual transmission lineage against NARA/Nanyang/Nanbei/TOYO materials',
        'source authority and semantic authority',
      ],
    },
    reportedNonObservations: [
      'No exact 丁/folio was supplied for the reported inscription.',
      'No source image, PDF, or raw email byte payload was supplied to the repository.',
      'No direct researcher observation of 十二宮, 安天府, 四化, or 命主·身主 was acquired.',
    ],
  }
}

function readCurrentFrontier(root) {
  const sourceIdentity = readJson(root, PREDECESSOR_SOURCE_IDENTITY)
  const toyo = readJson(root, PREDECESSOR_TOYO)
  const frontier = readJson(root, PREDECESSOR_FRONTIER)
  const fieldKit = readJson(root, PREDECESSOR_FIELD_KIT)
  requireValue(sourceIdentity.coverage?.claimCount === 30, 'unexpected_source_identity_claim_count')
  requireValue(sourceIdentity.coverage?.sourceCount === 13, 'unexpected_source_identity_source_count')
  requireValue(sourceIdentity.coverage?.observationCount === 26 && sourceIdentity.coverage?.relationCount === 116, 'unexpected_source_identity_observation_relation_count')
  requireValue(sourceIdentity.coverage?.blockerCount === 11, 'unexpected_source_identity_blocker_count')
  requireValue(toyo.impact?.additiveCoverage?.observationCount === 34 && toyo.impact?.additiveCoverage?.relationCount === 124, 'unexpected_toyo_successor_counts')
  requireValue(frontier.graphImpact?.successor?.claimCount === 30, 'unexpected_frontier_claim_count')
  requireValue(frontier.graphImpact?.successor?.sourceCount === 13, 'unexpected_frontier_source_count')
  requireValue(frontier.graphImpact?.successor?.observationCount === 40 && frontier.graphImpact?.successor?.relationCount === 130, 'unexpected_frontier_observation_relation_count')
  requireValue(frontier.graphImpact?.successor?.blockerCount === 11, 'unexpected_frontier_blocker_count')
  requireValue(frontier.claimImpact?.stableClaimCount === 0 && frontier.claimImpact?.semanticAuthorityCount === 0, 'unexpected_frontier_authority_boundary')
  requireValue(frontier.readinessImpact?.readiness === 'not_safe_to_start' && frontier.readinessImpact?.grounding === 'blocked' && frontier.readinessImpact?.activation === 'experimental_only', 'unexpected_frontier_readiness_boundary')
  requireValue(frontier.readinessImpact?.rotation06 === 'representation_only', 'unexpected_frontier_rotation_boundary')
  requireValue(frontier.sourceIdentity?.independentWitnessesAdmitted === 0 && frontier.sourceIdentity?.sourceAuthorityPromoted === false, 'unexpected_frontier_source_boundary')
  requireValue(fieldKit.currentAudit?.graph?.claims === 30 && fieldKit.currentAudit?.graph?.sources === 13 && fieldKit.currentAudit?.graph?.observations === 40 && fieldKit.currentAudit?.graph?.relations === 130 && fieldKit.currentAudit?.graph?.blockers === 11, 'unexpected_field_kit_graph_boundary')
  requireValue(fieldKit.currentAudit?.statuses?.readiness === 'not_safe_to_start' && fieldKit.currentAudit?.statuses?.grounding === 'blocked' && fieldKit.currentAudit?.statuses?.activation === 'experimental_only', 'unexpected_field_kit_readiness_boundary')
  requireValue(fieldKit.currentAudit?.statuses?.rotation06 === 'representation_only', 'unexpected_field_kit_rotation_boundary')
  return { sourceIdentity, claimRows: sourceIdentity.claimSourceMatrix, toyo, frontier, fieldKit }
}

function claimReconciliation(claimRows, relationIds) {
  const sourceContext = claimRows.filter(item => item.sourceIds.includes(PHYSICAL_WITNESS_SOURCE_ID)).map(item => item.claimId)
  return claimRows.map(item => ({
    claimId: item.claimId,
    family: item.family,
    predecessorStatus: item.status,
    successorStatus: item.status,
    predecessorClaimRelation: item.claimRelation,
    successorClaimRelation: item.claimRelation,
    sourceIdentityContext: sourceContext.includes(item.claimId) ? 'institution_staff_report_attached_to_existing_TOYO_candidate_only' : 'not_affected_by_TOYO_report',
    directObservationStatus: 'unchanged; staff report is not a researcher page/leaf observation',
    authorityStatus: 'unchanged; semantic_authority_not_established',
    statusChanged: false,
    sourceRelationPromotion: 'none',
    evidenceRelationIds: sourceContext.includes(item.claimId) ? relationIds.filter(id => id.includes('physical-item') || id.includes('editorial-inscription')) : [],
  }))
}

function relationRows(evidence) {
  const sourceContextClaimIds = evidence.observations[0].affectedClaimIds
  const semanticBoundaryClaimIds = evidence.observations[3].affectedClaimIds
  const common = {
    sourceIds: [REPORT_SOURCE_ID],
    promotion: 'not_admitted_to_claim_status_source_authority_semantic_authority_readiness_or_activation',
    independence: 'institutional_report_is_not_a_physical_witness_and_does_not_add_independent_lineage',
    authority: 'institution_staff_direct_report_bounded_to_declared_surface; semantic_authority_not_established',
    doesNotEstablish: evidence.observations[0].doesNotEstablish,
  }
  return [
    {
      ...common,
      relationId: 'relation-toyo-vii-3-157-staff-physical-item-count',
      observationIds: ['obs-toyo-vii-3-157-staff-physical-item-count'],
      relationKind: 'source_identity_reconciliation_only',
      relationStatus: 'institution_report_reconciles_two_catalog_rows_to_one_physical_item',
      claimIds: sourceContextClaimIds,
      affectedClaimIds: sourceContextClaimIds,
      blockerIds: ['blocker-source-identity-unresolved'],
    },
    {
      ...common,
      relationId: 'relation-toyo-vii-3-157-staff-editorial-inscription',
      observationIds: ['obs-toyo-vii-3-157-staff-editorial-inscription'],
      relationKind: 'reported_textual_inscription_presence_only',
      relationStatus: 'institution_report_adds_bounded_inscription_presence_without_edition_or_lineage_promotion',
      claimIds: sourceContextClaimIds,
      affectedClaimIds: sourceContextClaimIds,
      blockerIds: ['blocker-source-identity-unresolved'],
    },
    {
      ...common,
      relationId: 'relation-toyo-vii-3-157-staff-viewing-copy-route',
      observationIds: ['obs-toyo-vii-3-157-staff-viewing-copy-route'],
      relationKind: 'institutional_acquisition_route_only',
      relationStatus: 'original_viewing_and_limited_paper_copy_route_recorded; rights_remain_unresolved',
      claimIds: [],
      affectedClaimIds: [],
      blockerIds: ['blocker-source-identity-unresolved', 'blocker-image-reuse-rights'],
    },
    {
      ...common,
      relationId: 'relation-toyo-vii-3-157-staff-semantic-limit',
      observationIds: ['obs-toyo-vii-3-157-staff-semantic-limit'],
      relationKind: 'negative_semantic_observation_boundary',
      relationStatus: 'requested_semantic_surfaces_not_identified_in_reply; direct_page_observation_remains_open',
      claimIds: semanticBoundaryClaimIds,
      affectedClaimIds: semanticBoundaryClaimIds,
      blockerIds: evidence.observations[3].blockerIds,
    },
  ]
}

function blockerReassessment(previous, evidence, relations) {
  const addedByBlocker = new Map(ALL_BLOCKER_IDS.map(id => [id, []]))
  for (const observation of evidence.observations) for (const blockerId of observation.blockerIds) addedByBlocker.get(blockerId).push(observation.observationId)
  const relationByBlocker = new Map(ALL_BLOCKER_IDS.map(id => [id, []]))
  for (const relation of relations) for (const blockerId of relation.blockerIds) relationByBlocker.get(blockerId).push(relation.relationId)
  return previous.frontier.blockerAssessments.map(item => {
    const newObservationIds = unique(addedByBlocker.get(item.id))
    const newRelationIds = unique(relationByBlocker.get(item.id))
    const isSourceIdentity = item.id === 'blocker-source-identity-unresolved'
    const isRights = item.id === 'blocker-image-reuse-rights'
    return {
      id: item.id,
      statusBefore: item.status,
      statusAfter: item.status,
      statusChanged: false,
      newObservationIds,
      newRelationIds,
      previousLocalResult: item.localResult,
      localResultAfter: isSourceIdentity
        ? 'institution staff confirms the two VII-3-157 database records are duplicate data for one actual physical item and reports the bounded 金陵益軒唐謙梓 inscription; edition/date/folio/colophon/textual lineage/source authority remain open'
        : isRights
          ? 'institutional viewing and paper-copy procedure is now known; image-level repository reuse permission remains absent'
          : item.localResult,
      uncertaintyReduction: isSourceIdentity
        ? ['VII-3-157 physical item count: duplicate-record ambiguity -> one item in institutional report', 'reported inscription presence: absent from prior local graph -> bounded staff report with 一見したところ qualifier']
        : isRights
          ? ['future original-viewing/copy route is more concrete; rights permission is not reduced to granted']
          : [],
      remainingUncertainty: isSourceIdentity
        ? ['whether the item is an original print, later 鈔本, or 寫本', 'edition/date/colophon and exact leaf identity', 'textual transmission lineage to NARA/Nanyang/Nanbei/TOYO materials', 'semantic authority and reuse rights']
        : item.nextAcquisition?.note || 'no new evidence closes this blocker',
      closureDecision: 'top_level_blocker_remains_open; no automatic closure',
      evidenceRefs: [...item.evidenceRefs, ...(newObservationIds.length ? ['artifacts/ziwei-p0-toyo-vii-3-157-institutional-evidence-v1/evidence.json'] : [])],
      nextAcquisitionRequirementId: item.nextAcquisition?.requirementId || null,
      relatedFieldKitTargetIds: [],
    }
  })
}

function buildFieldKitImpact(root, fieldKit, evidence) {
  const targetIds = new Set(['acq-distinct-witness-identity-lineage', 'acq-palace-semantic-map-and-coordinate-witness', 'acq-tianfu-anchor-direction-adjudicator', 'review-image-level-reuse-permission'])
  const targets = fieldKit.targets.map(item => ({
    targetId: item.id,
    statusBefore: item.status,
    statusAfter: item.status,
    statusChanged: false,
    newEvidenceRole: item.id === 'acq-distinct-witness-identity-lineage'
      ? 'held_institution_report_narrows_physical_item_count_gap_but_does_not_satisfy_identity_packet'
      : item.id === 'review-image-level-reuse-permission'
        ? 'institutional_copy_route_is_available_as_a_future_path_but_no_reuse_permission_is_granted'
        : item.id === 'acq-palace-semantic-map-and-coordinate-witness' || item.id === 'acq-tianfu-anchor-direction-adjudicator'
          ? 'report_explicitly_preserves_missing_page_level_semantic_observation'
          : 'not_affected',
    evidenceRefs: targetIds.has(item.id)
      ? ['artifacts/ziwei-p0-toyo-vii-3-157-institutional-evidence-v1/evidence.json']
      : [],
    closure: 'not_closed',
  }))
  return {
    predecessorPath: PREDECESSOR_FIELD_KIT,
    predecessorByteSha256: fileSha256(root, PREDECESSOR_FIELD_KIT),
    existingFieldKitBytesRewritten: false,
    currentTargetStatusesRemainUnchanged: true,
    heldEvidenceUpdate: 'The institutional reply is now held evidence; do not reacquire the duplicate-row question. Future field work still needs the original leaf/page packet and human review.',
    targetReassessment: targets,
    semanticTargetStillOpen: true,
    sourceIdentityTargetStillActionRequired: true,
    rightsTargetStillHumanPolicyReview: true,
    evidenceObservationIds: evidence.observations.map(item => item.observationId),
  }
}

function buildArtifact(root = ROOT) {
  for (const path of INPUT_PATHS) requireValue(existsSync(resolve(root, path)), `missing_input:${path}`)
  const repo = repository(root)
  requireValue(repo.branch === 'main', 'institutional_evidence_requires_main')
  requireValue(git(root, ['merge-base', '--is-ancestor', BASIS_HEAD, repo.currentHead]) === '', 'institutional_evidence_basis_not_ancestor_of_current')
  requireValue(git(root, ['merge-base', '--is-ancestor', BASIS_HEAD, repo.originMainHead]) === '', 'institutional_evidence_basis_not_ancestor_of_origin_main')
  const previous = readCurrentFrontier(root)
  const evidence = buildEvidence(previous.claimRows)
  const relations = relationRows(evidence)
  const claims = claimReconciliation(previous.claimRows, relations.map(item => item.relationId))
  const blockers = blockerReassessment(previous, evidence, relations)
  const fieldKitImpact = buildFieldKitImpact(root, previous.fieldKit, evidence)
  const protectedAsset = {
    path: '-.jpg',
    canonicalPath: SAJU_SOURCE_DERIVED_ASSET_PATH,
    exists: existsSync(resolve(root, SAJU_SOURCE_DERIVED_ASSET_PATH)),
    byteSha256: fileSha256(root, SAJU_SOURCE_DERIVED_ASSET_PATH),
  }
  requireValue(protectedAsset.exists, 'protected_source_derived_asset_missing')

  const previousGraph = previous.frontier.graphImpact.successor
  const successorGraph = {
    claimCount: previousGraph.claimCount,
    sourceCount: previousGraph.sourceCount + 1,
    observationCount: previousGraph.observationCount + evidence.observations.length,
    relationCount: previousGraph.relationCount + relations.length,
    blockerCount: previousGraph.blockerCount,
  }
  const statusCounts = Object.fromEntries(ALL_BLOCKER_IDS.map(id => [id, blockers.find(item => item.id === id).statusAfter]))
  const completeBase = {
    schemaVersion: SCHEMA,
    verdictToken: VERDICT,
    basisHead: BASIS_HEAD,
    observedHead: repo.currentHead,
    originMainHead: repo.originMainHead,
    branch: repo.branch,
    scope: {
      purpose: 'additive normalization and reconciliation of a user-supplied Toyo Bunko institutional reply for Ziwei P0 source identity',
      reportIsExternalEvidence: true,
      externalAcquisitionPerformed: false,
      userSuppliedEvidenceIngested: true,
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
      protectedUntrackedPreserved: ['-.jpg'],
      predecessorArtifacts: 'read-only inputs; historical bytes are not rewritten',
    },
    predecessorChain: [PREDECESSOR_SOURCE_IDENTITY, PREDECESSOR_TOYO, PREDECESSOR_FRONTIER, PREDECESSOR_FIELD_KIT].map(path => ({
      path,
      schemaVersion: readJson(root, path).schemaVersion,
      byteSha256: fileSha256(root, path),
    })),
    companionFiles: ['evidence.json', 'graph-reconciliation.json', 'field-kit-impact.json'],
    institutionalEvidence: {
      evidenceId: REPORT.evidenceId,
      sourceId: REPORT_SOURCE_ID,
      provenance: REPORT,
      physicalWitnessSourceId: PHYSICAL_WITNESS_SOURCE_ID,
      catalogRowsRemainMetadata: true,
      physicalWitnessCountAdded: 0,
      topLevelSourceIdentityBlockerClosed: false,
      directSemanticObservationAcquired: false,
    },
    sourceLineage: {
      predecessorPhysicalWitnessCandidate: PHYSICAL_WITNESS_SOURCE_ID,
      addedSource: evidence.source,
      catalogReconciliation: evidence.catalogReconciliation,
      physicalWitnessCount: 1,
      independentPhysicalWitnessesAdmitted: 0,
      lineageInferencePerformed: false,
      sourceAuthority: 'not_established',
      semanticAuthority: 'not_established',
    },
    observations: evidence.observations,
    relations,
    claimReconciliation: claims,
    blockerReassessment: blockers,
    graphImpact: {
      predecessor: previousGraph,
      additive: {
        claimCount: 0,
        sourceCount: 1,
        physicalWitnessCount: 0,
        institutionalReportSourceCount: 1,
        observationCount: evidence.observations.length,
        relationCount: relations.length,
        blockerCount: 0,
      },
      successor: successorGraph,
      claimsAdded: 0,
      sourcesAdded: [REPORT_SOURCE_ID],
      physicalWitnessesAdded: [],
      addedObservationIds: evidence.observations.map(item => item.observationId),
      addedRelationIds: relations.map(item => item.relationId),
      blockersClosed: [],
      blockersStillOpen: ALL_BLOCKER_IDS,
      blockerStatusCounts: statusCounts,
    },
    claimImpact: {
      predecessorClaimCount: previousGraph.claimCount,
      successorClaimCount: successorGraph.claimCount,
      claimsAdded: 0,
      claimsPromoted: 0,
      claimStatusChanges: [],
      claimRowsRewritten: false,
      claimSourceMatrixUpdated: false,
      claimsWithTOYOIdentityContext: claims.filter(item => item.sourceIdentityContext.includes('institution_staff')).map(item => item.claimId),
      directSemanticClaimSupportAdded: [],
      stableClaimCount: 0,
      semanticAuthorityCount: 0,
      interpretationEligibleClaimCount: 0,
      unsupportedClaimPreserved: true,
      boundary: 'institutional identity/inscription report is source-context evidence only; every existing claim status and authority boundary remains unchanged',
    },
    blockerImpact: {
      blockersClosed: [],
      blockerStatusChanges: [],
      openBlockedCount: blockers.filter(item => item.statusAfter === 'blocked').length,
      openHumanReviewCount: blockers.filter(item => item.statusAfter === 'needs_human_review').length,
      resolvedSubBoundaries: ['toyo-vii-3-157-catalog-duplicate-rows-represent-one-physical-item_per_institution_report'],
      resolvedSubBoundaryIsNotTopLevelClosure: true,
    },
    uncertaintyImpact: {
      reduced: [
        'VII-3-157 catalog 鈔本/寫本 duplicate ambiguity is reduced to one actual physical item in the institution report.',
        'Presence of 金陵益軒唐謙梓 in the reported preface-adjacent editor/author statement is now institutionally reported, with 一見したところ retained.',
        'A future original-viewing and limited paper-copy route is documented.',
      ],
      notReduced: [
        'original edition status, later 鈔本/寫本 status, date, colophon, and exact leaf/folio',
        'textual transmission lineage and independent physical lineage',
        'complete 十二宮 semantic map, Tianfu coordinate/direction, 四化, or 命主·身主 surface',
        'semantic authority, production readiness, grounding, activation, and image reuse rights',
      ],
    },
    fieldKitImpact,
    readinessImpact: {
      readiness: 'not_safe_to_start',
      grounding: 'blocked',
      activation: 'experimental_only',
      rotation06: 'representation_only',
      sourceAuthorityPromoted: false,
      semanticAuthorityPromoted: false,
      independentWitnessesAdmitted: 0,
      productionModified: false,
      readinessModified: false,
      interpretationGenerated: false,
    },
    preservation: {
      predecessorArtifactsRewritten: false,
      historicalPredecessorBytesRewritten: false,
      existingFieldKitRewritten: false,
      sourceImagesStoredInGit: false,
      sourcePdfsStoredInGit: false,
      rawGmailBytesStoredInGit: false,
      externalAcquisitionPerformed: false,
      userSuppliedReportNormalized: true,
      networkUsedDuringMaterialization: false,
      protectedUntrackedDashJpgPreserved: protectedAsset.exists,
      protectedAsset,
      productionChanged: false,
      remoteDatabaseChanged: false,
      deploymentPerformed: false,
      commitPerformed: false,
      pushPerformed: false,
    },
    deterministicContract: {
      generatedAt: 'forbidden',
      timestamps: 'forbidden_except_receivedDate_in_supplied_provenance',
      network: 'forbidden_during_materialization',
      sourceBytes: 'no Gmail raw bytes or source images are acquired; predecessor and protected repository bytes are hash-checked',
      ordering: 'canonical object keys; declared evidence and blocker order; stable explicit IDs',
      noImplicitSourceSearch: true,
      noAutomaticPromotion: true,
    },
    negativeContract: {
      rejects: [
        'treating the staff report as a second physical witness',
        'treating the inscription report as proof of original edition or authorial priority',
        'inventing a page/folio from the context-only report',
        'promoting institution report to semantic authority or direct researcher page observation',
        'closing the source-identity blocker from the one-item reconciliation alone',
        'closing palace/Tianfu/Four Transformations/命主·身主 blockers from staff non-observation',
        'treating viewing/copy procedure as image reuse permission',
        'mutating predecessor bytes, protected asset, readiness, production, database, deployment, commit, or push state',
        'generated timestamp or network acquisition',
      ],
    },
    materializer: MATERIALIZER_PATH,
    checker: `scripts/check-${SCHEMA}.mjs`,
    negativeChecker: `scripts/check-${SCHEMA}-negative-v0.mjs`,
  }
  const artifact = attachArtifactIdentity(completeBase, buildArtifactIdentity({
    root,
    artifactId: SCHEMA,
    materializerPath: MATERIALIZER_PATH,
    materializerVersion: MATERIALIZER_VERSION,
    baseHead: BASIS_HEAD,
    inputs: INPUT_PATHS,
  }))
  const files = {
    'evidence.json': {
      schemaVersion: `${SCHEMA}-evidence-v0`,
      evidenceSource: evidence.source,
      report: evidence.report,
      target: REPORT.target,
      catalogReconciliation: evidence.catalogReconciliation,
      observations: evidence.observations,
      reportedNonObservations: evidence.reportedNonObservations,
    },
    'graph-reconciliation.json': {
      schemaVersion: `${SCHEMA}-graph-v0`,
      predecessorChain: artifact.predecessorChain,
      sourceLineage: artifact.sourceLineage,
      observations: artifact.observations,
      relations: artifact.relations,
      claimReconciliation: artifact.claimReconciliation,
      blockerReassessment: artifact.blockerReassessment,
      graphImpact: artifact.graphImpact,
      claimImpact: artifact.claimImpact,
      blockerImpact: artifact.blockerImpact,
      uncertaintyImpact: artifact.uncertaintyImpact,
    },
    'field-kit-impact.json': {
      schemaVersion: `${SCHEMA}-field-kit-v0`,
      predecessorFieldKit: fieldKitImpact.predecessorPath,
      predecessorByteSha256: fieldKitImpact.predecessorByteSha256,
      existingFieldKitBytesRewritten: fieldKitImpact.existingFieldKitBytesRewritten,
      heldEvidenceUpdate: fieldKitImpact.heldEvidenceUpdate,
      targetReassessment: fieldKitImpact.targetReassessment,
      evidenceObservationIds: fieldKitImpact.evidenceObservationIds,
      closureBoundary: {
        sourceIdentityTarget: 'action_required',
        palaceSemanticTarget: 'action_required',
        tianfuTarget: 'action_required',
        imageReuseTarget: 'human_policy_review',
      },
    },
  }
  return { artifact, files }
}

export function buildBundle(root = ROOT) {
  return buildArtifact(root)
}

export async function materializeBundle(target = resolve(ROOT, ARTIFACT_PATH)) {
  const root = ROOT
  const targetPath = resolve(target)
  const { artifact, files } = buildArtifact(root)
  const directory = dirname(targetPath)
  await mkdir(directory, { recursive: true })
  const outputs = { complete: targetPath }
  const writeJson = async (path, value) => {
    const body = Buffer.from(canonicalJson(value))
    await writeFile(path, body)
    await writeFile(`${path}.integrity.json`, canonicalJson({
      schemaVersion: `${SCHEMA}-integrity-v0`,
      path: relative(root, path),
      byteSha256: sha256(body),
      byteScope: 'UTF-8 JSON bytes including final LF',
    }))
    return sha256(body)
  }
  const completeSha256 = await writeJson(targetPath, artifact)
  for (const [name, value] of Object.entries(files)) outputs[name] = resolve(directory, name), await writeJson(outputs[name], value)
  return { artifact, files, outputs, targetPath, completeSha256 }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const result = await materializeBundle(resolve(process.argv[2] || ARTIFACT_PATH))
  console.log(JSON.stringify({
    target: result.targetPath,
    schema: SCHEMA,
    verdict: VERDICT,
    basisHead: BASIS_HEAD,
    counts: result.artifact.graphImpact.successor,
    blockersClosed: result.artifact.graphImpact.blockersClosed,
    completeByteSha256: result.completeSha256,
  }, null, 2))
}
