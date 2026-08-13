import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'

import {
  attachArtifactIdentity,
  buildArtifactIdentity,
  checkHistoricalRepositoryBasis,
  canonicalStableArtifactJson,
  stableArtifactContentEqual,
} from '../src/artifactIdentity.js'
import * as v2 from './materialize-ziwei-p0-palace-branch-slot-composition-v2.mjs'

export const SCHEMA = 'ziwei-p0-palace-branch-slot-composition-v3'
export const VERDICT = 'complete_ziwei_palace_branch_slot_composition_with_direct_scan_corroboration_derived_not_authoritative'
export const MATERIALIZER_VERSION = '3.0.0'
export const BASIS_HEAD = v2.BASIS_HEAD
export const MATERIALIZER_PATH = 'scripts/materialize-' + SCHEMA + '.mjs'
export const ARTIFACT_DIR = 'artifacts/' + SCHEMA
export const ARTIFACT_PATH = ARTIFACT_DIR + '/complete.json'
export const ROOT = resolve(new URL('..', import.meta.url).pathname)

export const PREDECESSOR_COMPOSITION = 'artifacts/ziwei-p0-palace-branch-slot-composition-v2/complete.json'
export const PREDECESSOR_COMPOSITION_EVIDENCE = 'artifacts/ziwei-p0-palace-branch-slot-composition-v2/evidence.json'
export const PROTECTED_ASSET_PATH = v2.PROTECTED_ASSET_PATH
export const SOURCE_NLC = 'src-youyi-lu-nlc-332-97-1883'
export const SOURCE_ZJLIB = 'src-youyi-lu-zjlib-36-25-late-reprint'
export const NLC_PDF_SHA256 = '6dcefdb465f63ae74fbb0d5587a3e90f9f1337160244b4ecaaf9490dd5e1cb45'
export const NLC_PAGE66_RENDER_SHA256 = '0711bc5ed6f10eccb824acf54ea8e8a2eafa18aa381c995007e581cba7dcdb8'
export const ZJLIB_PDF_SHA256 = 'f5ef36a28462e8260d435940dbff5f0e22f614ca458e23a8f764e96209056a4d'
export const ZJLIB_PAGE131_RENDER_SHA256 = 'a32f07e596085665e8810e3df787c81531b9f290507492446a56f38edbc6be59'
export const ZJLIB_PAGE132_RENDER_SHA256 = '09a73db0c5dd14d737695fba2c6e63c0c400a9eb125f488a8ef2370ada11baa5'
export const NLC_URL = 'https://upload.wikimedia.org/wikipedia/commons/5/57/NLC892-GBZX0301010898-252714_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8_%E4%B8%89%E4%B8%89%E4%BA%8C%E5%8D%B7_%E7%AC%AC97%E5%86%8A.pdf'
export const NLC_COMMONS_URL = 'https://commons.wikimedia.org/wiki/File:NLC892-GBZX0301010898-252714_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8_%E4%B8%89%E4%B8%89%E4%BA%8C%E5%8D%B7_%E7%AC%AC97%E5%86%8A.pdf'
export const ZJLIB_URL = 'https://upload.wikimedia.org/wikipedia/commons/b/bc/ZJLib-62b555343157d263ee6a4462-25_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8%E4%B8%89%E5%8D%81%E5%85%AD%E7%A8%AE_%E7%AC%AC25%E5%86%8A.pdf'
export const ZJLIB_COMMONS_URL = 'https://commons.wikimedia.org/wiki/File:ZJLib-62b555343157d263ee6a4462-25_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8%E4%B8%89%E5%8D%81%E5%85%AD%E7%A8%AE_%E7%AC%AC25%E5%86%8A.pdf'
export const CADAL_TITLE_COLLISION_URL = 'https://commons.wikimedia.org/wiki/File:CADAL01032231_%E9%81%8A%E8%97%9D%E9%8C%84.djvu'
export const CIINII_1968_REPRINT_URL = 'https://cir.nii.ac.jp/crid/1971149384876944315'
export const CNTS_ANONYMOUS_MANUSCRIPT_URL = 'https://commons.wikimedia.org/wiki/File:CNTS-00047996572_%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E6%96%B9%E6%9B%B8.pdf'
export const CNTS_ANONYMOUS_MANUSCRIPT_PDF_URL = 'https://upload.wikimedia.org/wikipedia/commons/9/98/CNTS-00047996572_%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E6%96%B9%E6%9B%B8.pdf'
export const CNTS_ANONYMOUS_MANUSCRIPT_PDF_SHA256 = 'b21bbf3e2c7cdada4153f847ff9f359dbb29e71998e1f931417d108b571b23c3'

export const INPUT_PATHS = [...new Set([
  ...v2.INPUT_PATHS,
  PREDECESSOR_COMPOSITION,
  PREDECESSOR_COMPOSITION_EVIDENCE,
  MATERIALIZER_PATH,
])]

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
export const canonicalJson = value => JSON.stringify(sortValue(value), null, 2) + '\n'
const sortValue = value => Array.isArray(value)
  ? value.map(sortValue)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sortValue(value[key])]))
    : value
const git = (root, args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8' }).trim()
const readJson = (root, path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'))
const fileSha256 = (root, path) => sha256(readFileSync(resolve(root, path)))
const unique = values => [...new Set(values)]
const requireValue = (condition, message) => { if (!condition) throw new Error(message) }

const CLAIMS = ['claim-palace-name-branch-ordinal', 'claim-12-palace-diagram-semantics']
const BLOCKER_PALACE = 'blocker-palace-semantic-identity'
const V2_ADDED_SOURCES = [v2.SOURCE_PCHOME, v2.SOURCE_CINII_1871]
const NEW_OBSERVATIONS = [
  'obs-youyi-nlc-p66-direct-palace-order',
  'obs-youyi-zjlib-p131-p132-direct-palace-order',
]
const NEW_RELATIONS = [
  'relation-youyi-nlc-direct-palace-corroboration',
  'relation-youyi-zjlib-direct-palace-corroboration',
  'relation-youyi-cross-scan-lineage-boundary',
]

function repository(root) {
  return {
    branch: git(root, ['branch', '--show-current']),
    currentHead: git(root, ['rev-parse', 'HEAD']),
    originMainHead: git(root, ['rev-parse', 'origin/main']),
  }
}

function predecessorInput(root, options = {}) {
  const generated = v2.buildBundle(root, options)
  const stored = readJson(root, PREDECESSOR_COMPOSITION)
  const storedEvidence = readJson(root, PREDECESSOR_COMPOSITION_EVIDENCE)
  requireValue(stableArtifactContentEqual(stored, generated.artifact), 'v2_predecessor_complete_drift')
  requireValue(canonicalStableArtifactJson(storedEvidence) === canonicalStableArtifactJson(generated.files['evidence.json']), 'v2_predecessor_evidence_drift')
  requireValue(generated.artifact.schemaVersion === v2.SCHEMA, 'unexpected_v2_schema')
  requireValue(generated.artifact.graphImpact?.successor?.sourceCount === 17, 'unexpected_v2_source_count')
  requireValue(generated.artifact.graphImpact?.successor?.observationCount === 53, 'unexpected_v2_observation_count')
  requireValue(generated.artifact.graphImpact?.successor?.relationCount === 143, 'unexpected_v2_relation_count')
  requireValue(generated.artifact.sourceLineage?.physicalWitnessCountAfter === 2, 'unexpected_v2_physical_witness_count')
  return { generated, stored, storedEvidence }
}

function directWitnesses() {
  return [
    {
      observationId: NEW_OBSERVATIONS[0],
      sourceIds: [SOURCE_NLC],
      researcherDirectObservation: true,
      directObservationStatus: 'direct_visual_original_scan_review',
      observationKind: 'direct_historical_scan_named_palace_order_and_worked_examples',
      authorityStatus: 'direct_scan_witness; source_authority_and_semantic_authority_not_established',
      blockerIds: [BLOCKER_PALACE],
      affectedClaimIds: CLAIMS,
      locator: {
        url: NLC_URL,
        commonsUrl: NLC_COMMONS_URL,
        commonsPageId: 129857505,
        volume: '春在堂全書 三三二卷 第97冊',
        scanPage: 66,
        renderDpi: 300,
        renderedFileSha256: NLC_PAGE66_RENDER_SHA256,
        renderedDimensions: '1920x1767',
        sourcePdfSha256: NLC_PDF_SHA256,
      },
      sourceIdentity: {
        author: '〔清〕俞樾撰',
        edition: '清光緒九年（1883）重刻本 100冊',
        holdingCredit: 'Tianjin Library / National Library of China',
        pdfBytes: 59303996,
        pdfPages: 90,
        commonsSha1: '8d70866096b7a19021c6164ce996d3703dec6c96',
      },
      directReading: [
        'The scan visibly identifies 紫微斗數篇 and 游藝錄五.',
        'The page visibly states 乃逆行而布十二宮.',
        'The page visibly lists 十二宮者 in order: 命宮, 兄弟宮, 夫妻宮, 子息宮, 財帛宮, 疾厄宮, 遷移宮, 奴僕宮, 官祿宮, 田宅宮, 福德宮, 父母宮.',
        'The page visibly gives worked examples 命立子宮則亥為兄弟宮 and 命立丑宮則子為兄弟宮.',
      ],
      supports: ['direct_named_palace_relative_order', 'direct_reverse_traversal_wording', 'direct_worked_branch_examples', 'separate_physical_scan_of_1883_edition'],
      doesNotEstablish: ['palace_name_to_physical_chart_slot', 'production_ordinal', '1871_textual_lineage', 'semantic_authority', 'single_source_four_field_binding'],
    },
    {
      observationId: NEW_OBSERVATIONS[1],
      sourceIds: [SOURCE_ZJLIB],
      researcherDirectObservation: true,
      directObservationStatus: 'direct_visual_original_scan_review',
      observationKind: 'direct_late_reprint_scan_named_palace_order_and_worked_examples',
      authorityStatus: 'direct_late_reprint_scan witness; source_authority_and_semantic_authority_not_established',
      blockerIds: [BLOCKER_PALACE],
      affectedClaimIds: CLAIMS,
      locator: {
        url: ZJLIB_URL,
        commonsUrl: ZJLIB_COMMONS_URL,
        commonsPageId: 148541003,
        volume: '春在堂全書三十六種 第25冊',
        section: '游藝錄五·紫微斗數篇',
        scanPages: [131, 132],
        renderDpi: 240,
        renderedFileSha256ByPage: {
          131: ZJLIB_PAGE131_RENDER_SHA256,
          132: ZJLIB_PAGE132_RENDER_SHA256,
        },
        sourcePdfSha256: ZJLIB_PDF_SHA256,
      },
      sourceIdentity: {
        author: '（清）俞樾撰',
        edition: '清同治至光緒刻光緒末彙印本',
        holdingCredit: 'Zhejiang Library',
        pdfBytes: 88846033,
        pdfPages: 180,
        commonsSha1: 'ef0f36e9c7f1fc285aaba4ca56dca9ea2e508a83',
      },
      directReading: [
        'The scan identifies 游藝錄五 and 紫微斗數篇 across pages 131-132.',
        'The pages visibly state 乃逆行而布十二宮.',
        'The pages visibly list the twelve palace names in the same relative order, with the late-reprint variants 夫妻宮 and 子息宮 retained.',
        'The pages visibly give the 命立子宮 and 命立丑宮 worked examples.',
      ],
      supports: ['direct_named_palace_relative_order', 'direct_reverse_traversal_wording', 'direct_worked_branch_examples', 'separate_late_reprint_physical_scan'],
      doesNotEstablish: ['palace_name_to_physical_chart_slot', 'production_ordinal', '1871_textual_lineage', 'block_identity_with_1883_reprint', 'semantic_authority', 'single_source_four_field_binding'],
    },
  ]
}

function candidateReview() {
  return {
    reviewedOutsideGraph: true,
    candidates: [
      {
        candidateId: 'candidate-cadal-01032231-title-collision',
        url: CADAL_TITLE_COLLISION_URL,
        identity: '遊藝錄 by 李佃, 醉月山房, 清光緒二十年（1894）, 81 pages, CADAL 01032231',
        commonsSha1: 'ff8be2ded9d645d82f4993180afa1d0ceeab4e1e',
        bytes: 3721202,
        decision: 'rejected_same_title_not_yuyue_youyi_lu',
        doesNotEnterGraph: true,
      },
      {
        candidateId: 'candidate-nlc416-feixing-ziwei-original-intended',
        identity: '華山陳希夷先生飛星紫微斗數原旨, NLC416-12jh004539-48693, separate work',
        sourcePdfSha256: 'd7111b8a43babc6141759d61f4d5d5c013b960ca35ae588cb3458a66e0941797',
        bytes: 3668550,
        pages: 116,
        decision: 'not_admitted_to_this_youyi_lu_composition',
        doesNotEnterGraph: true,
      },
      {
        candidateId: 'candidate-cini-1968-youyi-lu-reprint-catalog',
        url: CIINII_1968_REPRINT_URL,
        catalogId: 'BN14977393 / CRID 1971149384876944315',
        identity: '中國文獻出版社, 1968.9, 春在堂全書第8冊; catalog note says 同治10年(1871)刊の影印 and includes 游藝録',
        directScanObtained: false,
        decision: 'catalog_only_1871_reprint_acquisition_lead',
        doesNotEnterGraph: true,
      },
      {
        candidateId: 'candidate-cnts-00047996572-anonymous-manuscript',
        url: CNTS_ANONYMOUS_MANUSCRIPT_URL,
        directPdfUrl: CNTS_ANONYMOUS_MANUSCRIPT_PDF_URL,
        identity: '紫微斗數方書, 編者未詳, 筆寫本, National Digital Library of Korea record CNTS-00047996572',
        sourcePdfSha256: CNTS_ANONYMOUS_MANUSCRIPT_PDF_SHA256,
        commonsSha1: '0ecf0cdc7ae9a2e0d427501bb0fdef901a851a0a',
        bytes: 75687209,
        pages: 153,
        reviewedScanPages: 'pp1-28, with selected direct visual review at pp6-16',
        directVisualReview: true,
        decision: 'held_separate_anonymous_handwritten_work_no_complete_four_field_binding_surfaced_in_reviewed_pages',
        doesNotEnterGraph: true,
      },
    ],
  }
}

function addEvidence(previous, witnesses) {
  const evidence = structuredClone(previous.evidence)
  evidence.schemaVersion = SCHEMA + '-evidence-v0'
  evidence.authorityBoundary = 'The complete four-field matrix remains a composition; the added scans directly corroborate named-palace order and worked examples but no reviewed page directly witnesses all four fields.'
  evidence.observations = [...evidence.observations, ...witnesses]
  evidence.directScanCorroboration = {
    sourceIds: [v2.SOURCE_YOUYI, SOURCE_NLC, SOURCE_ZJLIB],
    status: 'two_added_direct_scan_surfaces_agree_with_CADAL_named_palace_order_and_worked_examples',
    independentHistoricalWitnessesAdmitted: 0,
    physicalWitnessCandidates: [SOURCE_NLC, SOURCE_ZJLIB],
    doesNotEstablish: ['shared physical chart coordinate frame', 'production ordinal', '1871 textual continuity', 'semantic authority'],
  }
  evidence.candidateReview = candidateReview()
  evidence.reportedNonObservations = unique([
    ...evidence.reportedNonObservations,
    'NLC p66 and Zhejiang Library pp131-132 contain text and worked examples but no complete palace-name physical chart perimeter.',
    'NLC is a distinct physical scan of the 1883 Guangxu 9 reprint; it is not an independent edition lineage from CADAL.',
    'The Zhejiang Library catalog labels a late compiled/reprinted edition, but block identity, colophon continuity, and relation to the 1871 impression were not closed.',
    'The two added direct scans do not convert a named-palace witness into a branch-to-physical-slot or production-ordinal witness.',
  ])
  return evidence
}

function addRelations(witnesses) {
  return [
    {
      relationId: NEW_RELATIONS[0],
      sourceIds: [v2.SOURCE_YOUYI, SOURCE_NLC],
      observationIds: [witnesses[0].observationId],
      relationKind: 'direct_scan_named_palace_order_corroboration_same_1883_edition',
      relationStatus: 'direct NLC p66 agrees with CADAL p130 on named-palace order, reverse wording, and worked examples; same-edition physical corroboration only',
      claimIds: CLAIMS,
      affectedClaimIds: CLAIMS,
      blockerIds: [BLOCKER_PALACE],
      promotion: 'not_admitted_to_source_authority_or_semantic_claim',
      observationCount: 1,
    },
    {
      relationId: NEW_RELATIONS[1],
      sourceIds: [v2.SOURCE_YOUYI, SOURCE_ZJLIB],
      observationIds: [witnesses[1].observationId],
      relationKind: 'direct_scan_named_palace_order_corroboration_late_reprint',
      relationStatus: 'direct Zhejiang Library pp131-132 agrees with CADAL p130 on named-palace order, reverse wording, and worked examples; edition/block lineage remains open',
      claimIds: CLAIMS,
      affectedClaimIds: CLAIMS,
      blockerIds: [BLOCKER_PALACE],
      promotion: 'not_admitted_to_source_authority_or_semantic_claim',
      observationCount: 1,
    },
    {
      relationId: NEW_RELATIONS[2],
      sourceIds: [v2.SOURCE_YOUYI, SOURCE_NLC, SOURCE_ZJLIB],
      observationIds: witnesses.map(item => item.observationId),
      relationKind: 'cross_scan_textual_agreement_with_lineage_boundary',
      relationStatus: 'three directly reviewed scan surfaces agree on the relative named-palace rule; agreement is corroboration, not proof of common source block or semantic coordinate frame',
      claimIds: [],
      affectedClaimIds: [],
      blockerIds: [BLOCKER_PALACE],
      promotion: 'not_admitted_to_source_lineage_or_semantic_authority',
      observationCount: 2,
    },
  ]
}

function updateClaimReconciliation(previous, witnesses, relations) {
  const relationIds = relations.filter(item => item.claimIds.length).map(item => item.relationId)
  return previous.claimReconciliation.map(claim => {
    if (!CLAIMS.includes(claim.claimId)) return { ...claim, predecessorStatus: claim.successorStatus, successorStatus: claim.successorStatus, statusChanged: false, sourceRelationPromotion: 'none' }
    return {
      ...claim,
      observationIdsAdded: unique([...(claim.observationIdsAdded || []), ...witnesses.map(item => item.observationId)]),
      sourceIdsAdded: unique([...(claim.sourceIdsAdded || []), SOURCE_NLC, SOURCE_ZJLIB]),
      evidenceRelationIdsAdded: unique([...(claim.evidenceRelationIdsAdded || []), ...relationIds]),
      directObservationStatus: 'two additional direct scan corroborations; physical slot and semantic authority unchanged',
      predecessorStatus: claim.successorStatus,
      successorStatus: claim.successorStatus,
      predecessorClaimRelation: claim.successorClaimRelation,
      successorClaimRelation: claim.successorClaimRelation,
      statusChanged: false,
      sourceRelationPromotion: 'none',
    }
  })
}

function updateBlockers(previous, witnesses, relations) {
  const evidencePath = ARTIFACT_DIR + '/evidence.json'
  return previous.blockerReassessment.map(blocker => {
    if (blocker.id !== BLOCKER_PALACE) return blocker
    return {
      ...blocker,
      statusBefore: blocker.statusAfter,
      statusAfter: blocker.statusAfter,
      statusChanged: false,
      newObservationIds: unique([...(blocker.newObservationIds || []), ...witnesses.map(item => item.observationId)]),
      newRelationIds: unique([...(blocker.newRelationIds || []), ...relations.map(item => item.relationId)]),
      localResultAfter: `${blocker.localResultAfter}; two direct scan witnesses corroborate named-palace order, but no reviewed page supplies physical slots or production ordinal`,
      uncertaintyReduction: unique([...(blocker.uncertaintyReduction || []), 'two direct scan witnesses reduce uncertainty about the named-palace textual order only']),
      evidenceRefs: unique([...(blocker.evidenceRefs || []), evidencePath]),
      closureDecision: 'top_level_blocker_remains_open; no automatic closure',
    }
  })
}

function updateFieldKit(previous, evidence) {
  const evidencePath = ARTIFACT_DIR + '/evidence.json'
  const targetReassessment = previous.fieldKitImpact.targetReassessment.map(item => {
    const palace = item.targetId === 'acq-palace-semantic-map-and-coordinate-witness'
    const source = item.targetId === 'acq-distinct-witness-identity-lineage'
    return {
      ...item,
      newEvidenceRole: palace
        ? 'NLC p66 and Zhejiang Library pp131-132 add direct named-palace text and worked examples; physical diagram slot and production ordinal remain action_required'
        : source
          ? 'NLC 1883 same-edition copy and Zhejiang late-reprint identity are bounded; exact 1871 page/text/colophon lineage remains action_required'
          : item.newEvidenceRole,
      evidenceRefs: palace || source ? unique([...(item.evidenceRefs || []), evidencePath]) : item.evidenceRefs,
      statusBefore: item.statusAfter,
      statusAfter: item.statusAfter,
      statusChanged: false,
      closure: 'not_closed',
    }
  })
  return {
    ...previous.fieldKitImpact,
    heldEvidenceUpdate: 'Two additional direct scans corroborate the named-palace rule, but no physical palace-name diagram or production ordinal was admitted; the 1871 record remains catalog-only.',
    targetReassessment,
    evidenceObservationIds: unique([...previous.fieldKitImpact.evidenceObservationIds, ...evidence.observations.slice(-2).map(item => item.observationId)]),
    semanticTargetStillOpen: true,
    sourceIdentityTargetStillActionRequired: true,
    rightsTargetStillHumanPolicyReview: true,
  }
}

function updateBindingMatrix(previous, witnesses) {
  const matrix = structuredClone(previous.bindingMatrix)
  matrix.schemaVersion = SCHEMA + '-binding-matrix-v0'
  matrix.composition.additionalDirectWitnessLimitations = [
    'NLC p66 is a separate physical scan of the same 1883 Guangxu 9 reprint as CADAL; it is not an independent edition lineage.',
    'Zhejiang Library pp131-132 are a directly reviewed late compiled/reprint scan; block identity and relation to the 1871 impression remain unclosed.',
    'Neither added scan labels the Nanbei p7 perimeter slots with palace names or declares the repository production ordinal.',
  ]
  matrix.coverage.directNamedPalaceWitnessCount = 3
  matrix.coverage.additionalDirectNamedPalaceCorroborationCount = 2
  matrix.coverage.directSingleWitnessFullBindingCount = 0
  matrix.directPalaceWitnesses = [
    {
      sourceId: v2.SOURCE_YOUYI,
      locator: 'CADAL scan p130',
      role: 'primary_direct_named_palace_order',
      physicalSlotBound: false,
      productionOrdinalBound: false,
    },
    ...witnesses.map(item => ({
      sourceId: item.sourceIds[0],
      locator: item.locator,
      role: 'additional_direct_named_palace_corroboration',
      physicalSlotBound: false,
      productionOrdinalBound: false,
    })),
  ]
  return matrix
}

function updateLineage(previous, witnesses) {
  return {
    ...structuredClone(previous.lineageAssessment),
    directPalaceWitnesses: witnesses.map(item => ({
      sourceId: item.sourceIds[0],
      locator: item.locator,
      direct: true,
      completeRelativeOrder: true,
      physicalSlotBinding: false,
      productionOrdinalBinding: false,
      independentHistoricalWitnessAdmitted: false,
    })),
    sameEditionComparison: {
      sourceIds: [v2.SOURCE_YOUYI, SOURCE_NLC],
      status: 'same_edition_distinct_physical_scan',
      edition: '清光緒九年（1883）重刻本 100冊',
      namedPalaceOrderAgreement: true,
      byteIdentityClaimed: false,
      independentLineageAdmitted: false,
    },
    lateReprintComparison: {
      sourceIds: [v2.SOURCE_YOUYI, SOURCE_ZJLIB],
      status: 'catalog_labelled_late_compiled_reprint_directly_reviewed',
      namedPalaceOrderAgreement: true,
      blockOrColophonIdentityClosed: false,
      independentLineageAdmitted: false,
    },
    candidateReview: candidateReview(),
    independentWitnessStatus: 'not_admitted',
    physicalWitnessCandidatesAdded: [SOURCE_NLC, SOURCE_ZJLIB],
    productionBoundary: {
      ...previous.lineageAssessment.productionBoundary,
      directScanPhysicalSlotToProductionOrdinal: 'not_established',
      productionModified: false,
    },
  }
}

function buildArtifact(root = ROOT, { mode = 'exact' } = {}) {
  for (const path of INPUT_PATHS) requireValue(existsSync(resolve(root, path)), 'missing_input:' + path)
  const repo = repository(root)
  requireValue(repo.branch === 'main', 'composition_requires_main')
  if (mode === 'exact') {
    requireValue(repo.currentHead === BASIS_HEAD, 'composition_basis_must_be_current_head')
    requireValue(repo.originMainHead === BASIS_HEAD, 'composition_origin_must_match_basis_head')
  } else if (mode === 'historical_reference') {
    const historical = checkHistoricalRepositoryBasis(root, BASIS_HEAD, { expectedBranch: 'main' })
    requireValue(historical.errors.length === 0, 'historical_reference_basis_invalid:' + historical.errors.join(','))
  } else {
    requireValue(false, 'unsupported_materialization_mode:' + mode)
  }
  const predecessor = predecessorInput(root, { mode })
  const previous = predecessor.generated.artifact
  const witnesses = directWitnesses()
  const evidence = addEvidence(previous, witnesses)
  const relations = addRelations(witnesses)
  const observations = evidence.observations
  const bindingMatrix = updateBindingMatrix(previous, witnesses)
  const claimReconciliation = updateClaimReconciliation(previous, witnesses, relations)
  const blockers = updateBlockers(previous, witnesses, relations)
  const fieldKitImpact = updateFieldKit(previous, evidence)
  const lineageAssessment = updateLineage(previous, witnesses)
  const protectedAsset = structuredClone(previous.preservation.protectedAsset)
  requireValue(protectedAsset.exists, 'protected_source_derived_asset_missing')
  requireValue(protectedAsset.byteSha256 === fileSha256(root, v2.PROTECTED_ASSET_PATH), 'protected_source_derived_asset_changed')

  const previousGraph = previous.graphImpact.successor
  const addedObservationIds = witnesses.map(item => item.observationId)
  const addedSourceIds = [SOURCE_NLC, SOURCE_ZJLIB]
  const successorGraph = {
    claimCount: previousGraph.claimCount,
    sourceCount: previousGraph.sourceCount + addedSourceIds.length,
    observationCount: previousGraph.observationCount + addedObservationIds.length,
    relationCount: previousGraph.relationCount + relations.length,
    blockerCount: previousGraph.blockerCount,
  }
  const blockerStatusCounts = Object.fromEntries(blockers.map(item => [item.id, item.statusAfter]))
  const completeBase = {
    ...structuredClone(previous),
    schemaVersion: SCHEMA,
    verdictToken: VERDICT,
    observedHead: repo.currentHead,
    originMainHead: repo.originMainHead,
    branch: repo.branch,
    scope: {
      ...previous.scope,
      purpose: 'additive direct-scan corroboration of the historical named-palace order; no physical-slot, semantic, or production promotion',
      physicalWitnessCandidatesAdded: 2,
      externalDirectScanReviewPerformed: true,
      directSingleWitnessFullBindingEstablished: false,
      historical1871ScanObtained: false,
      independentWitnessesAdmitted: 0,
    },
    predecessorChain: [
      ...previous.predecessorChain,
      { path: PREDECESSOR_COMPOSITION, schemaVersion: previous.schemaVersion, byteSha256: fileSha256(root, PREDECESSOR_COMPOSITION) },
      { path: PREDECESSOR_COMPOSITION_EVIDENCE, schemaVersion: predecessor.storedEvidence.schemaVersion, byteSha256: fileSha256(root, PREDECESSOR_COMPOSITION_EVIDENCE) },
    ],
    sourceLineage: {
      ...structuredClone(previous.sourceLineage),
      addedSources: [
        ...previous.sourceLineage.addedSources,
        {
          sourceId: SOURCE_NLC,
          sourceKind: 'direct_1883_physical_scan_same_edition_as_cadal',
          role: 'direct_named_palace_corroboration_only',
          url: NLC_URL,
          sourcePdfSha256: NLC_PDF_SHA256,
          independentPhysicalWitness: false,
          physicalWitnessCandidate: true,
          sourceAuthority: 'not_established',
          lineageStatus: 'same_edition_distinct_physical_scan',
        },
        {
          sourceId: SOURCE_ZJLIB,
          sourceKind: 'direct_late_reprint_physical_scan',
          role: 'direct_named_palace_corroboration_only',
          url: ZJLIB_URL,
          sourcePdfSha256: ZJLIB_PDF_SHA256,
          independentPhysicalWitness: false,
          physicalWitnessCandidate: true,
          sourceAuthority: 'not_established',
          lineageStatus: 'catalog_labelled_late_compiled_reprint; block_lineage_unresolved',
        },
      ],
      physicalWitnessCountBefore: previous.sourceLineage.physicalWitnessCountAfter,
      physicalWitnessCountAfter: previous.sourceLineage.physicalWitnessCountAfter + 2,
      physicalWitnessCandidatesAdded: [SOURCE_NLC, SOURCE_ZJLIB],
      independentPhysicalWitnessesAdmitted: 0,
      lineageInferencePerformed: true,
      sourceAuthority: 'not_established',
      semanticAuthority: 'not_established',
      sourceIdentityStatus: 'NLC 1883 same-edition copy and Zhejiang late-reprint scan identities bounded; 1871 catalog-only; block/textual lineage unresolved',
      independenceStatus: 'NLC is same-edition physical corroboration; Zhejiang is a distinct catalog-labelled reprint candidate; neither is admitted as independent semantic authority',
    },
    evidence,
    observations,
    relations: [...previous.relations, ...relations],
    claimReconciliation,
    blockerReassessment: blockers,
    bindingMatrix,
    lineageAssessment,
    graphImpact: {
      predecessor: previousGraph,
      additive: {
        claimCount: 0,
        sourceCount: addedSourceIds.length,
        physicalWitnessCount: 2,
        observationCount: addedObservationIds.length,
        relationCount: relations.length,
        blockerCount: 0,
      },
      successor: successorGraph,
      claimsAdded: 0,
      sourcesAdded: addedSourceIds,
      physicalWitnessesAdded: addedSourceIds,
      independentPhysicalWitnessesAdmitted: 0,
      addedObservationIds,
      addedRelationIds: relations.map(item => item.relationId),
      blockersClosed: [],
      blockersStillOpen: previous.graphImpact.blockersStillOpen,
      blockerStatusCounts,
    },
    claimImpact: {
      ...structuredClone(previous.claimImpact),
      predecessorClaimCount: previousGraph.claimCount,
      successorClaimCount: successorGraph.claimCount,
      boundedDirectCorroborationAdded: CLAIMS,
      directSemanticClaimSupportAdded: [],
      stableClaimCount: 0,
      semanticAuthorityCount: 0,
      boundary: 'the additional scans directly corroborate named-palace order only; the branch-token join, physical slot identity, production ordinal, source authority, semantic authority, readiness, and activation remain unchanged',
    },
    blockerImpact: {
      ...structuredClone(previous.blockerImpact),
      blockersClosed: [],
      blockerStatusChanges: [],
      resolvedSubBoundaries: [
        ...previous.blockerImpact.resolvedSubBoundaries,
        'two additional direct scans corroborate the named-palace order without closing the physical-slot or production-ordinal gate',
      ],
      resolvedSubBoundaryIsNotTopLevelClosure: true,
    },
    fieldKitImpact,
    readinessImpact: {
      ...structuredClone(previous.readinessImpact),
      readiness: 'not_safe_to_start',
      grounding: 'blocked',
      activation: 'experimental_only',
      rotation06: 'representation_only',
      sourceAuthorityPromoted: false,
      semanticAuthorityPromoted: false,
      independentWitnessesAdmitted: 0,
      productionModified: false,
      readinessModified: false,
      derivedCompositionAvailableForResearchOnly: true,
    },
    preservation: {
      ...structuredClone(previous.preservation),
      predecessorArtifactsRewritten: false,
      historicalPredecessorBytesRewritten: false,
      existingFieldKitRewritten: false,
      sourceImagesStoredInGit: false,
      sourcePdfsStoredInGit: false,
      sourceBytesAcquiredOutsideRepo: true,
      externalWebSourceBytesStoredInGit: false,
      materializerNetworkUsed: false,
      protectedAsset,
      productionChanged: false,
      remoteDatabaseChanged: false,
      deploymentPerformed: false,
      commitPerformed: false,
      pushPerformed: false,
    },
    deterministicContract: {
      ...structuredClone(previous.deterministicContract),
      sourceBytes: 'external source bytes and page renders are referenced by fixed byte hashes and page locators; materialization performs no network acquisition',
      network: 'forbidden_during_materialization',
      ocr: 'not used as canonical text; direct visual readings are fixed evidence metadata',
      noAutomaticPromotion: true,
    },
    negativeContract: {
      ...structuredClone(previous.negativeContract),
      rejects: [
        ...previous.negativeContract.rejects,
        'calling the NLC same-edition scan an independent edition lineage',
        'calling the Zhejiang late-reprint scan proof of 1871 textual continuity',
        'converting direct named-palace corroboration into physical slot or production ordinal authority',
        'admitting title-collision candidates into the Youyi Lu source graph',
      ],
    },
    materializer: MATERIALIZER_PATH,
    checker: 'scripts/check-' + SCHEMA + '.mjs',
    negativeChecker: 'scripts/check-' + SCHEMA + '-negative-v0.mjs',
  }
  delete completeBase.artifactIdentity
  const artifact = attachArtifactIdentity(completeBase, buildArtifactIdentity({
    root,
    artifactId: SCHEMA,
    materializerPath: MATERIALIZER_PATH,
    materializerVersion: MATERIALIZER_VERSION,
    baseHead: BASIS_HEAD,
    inputs: INPUT_PATHS,
  }))
  const files = {
    'evidence.json': evidence,
    'binding-matrix.json': bindingMatrix,
    'lineage-assessment.json': lineageAssessment,
    'graph-reconciliation.json': {
      schemaVersion: SCHEMA + '-graph-v0',
      predecessorChain: artifact.predecessorChain,
      sourceLineage: artifact.sourceLineage,
      observations: artifact.observations,
      relations: artifact.relations,
      claimReconciliation: artifact.claimReconciliation,
      blockerReassessment: artifact.blockerReassessment,
      graphImpact: artifact.graphImpact,
      claimImpact: artifact.claimImpact,
      blockerImpact: artifact.blockerImpact,
      uncertainty: artifact.lineageAssessment,
    },
    'field-kit-impact.json': {
      schemaVersion: SCHEMA + '-field-kit-v0',
      ...fieldKitImpact,
      closureBoundary: {
        sourceIdentityTarget: 'action_required',
        palaceSemanticTarget: 'action_required',
        productionOrdinalTarget: 'not_established',
        imageReuseTarget: 'human_policy_review',
      },
    },
  }
  return { artifact, files }
}

export function buildBundle(root = ROOT, options = {}) { return buildArtifact(root, options) }

export async function materializeBundle(target = resolve(ROOT, ARTIFACT_PATH), options = {}) {
  const { artifact, files } = buildArtifact(ROOT, options)
  const targetPath = resolve(target)
  const directory = dirname(targetPath)
  await mkdir(directory, { recursive: true })
  const outputs = { complete: targetPath }
  const writeJson = async (path, value) => {
    const body = Buffer.from(canonicalJson(value))
    await writeFile(path, body)
    await writeFile(path + '.integrity.json', canonicalJson({
      schemaVersion: SCHEMA + '-integrity-v0',
      path: relative(ROOT, path),
      byteSha256: sha256(body),
      byteScope: 'UTF-8 JSON bytes including final LF',
    }))
    return sha256(body)
  }
  const completeSha256 = await writeJson(targetPath, artifact)
  for (const [name, value] of Object.entries(files)) {
    const path = resolve(directory, name)
    outputs[name] = path
    await writeJson(path, value)
  }
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
    directNamedPalaceWitnessCount: result.artifact.bindingMatrix.coverage.directNamedPalaceWitnessCount,
    directSingleWitnessFullBindingCount: result.artifact.bindingMatrix.coverage.directSingleWitnessFullBindingCount,
    physicalWitnessesAdded: result.artifact.graphImpact.physicalWitnessesAdded,
    independentPhysicalWitnessesAdmitted: result.artifact.graphImpact.independentPhysicalWitnessesAdmitted,
    blockersClosed: result.artifact.graphImpact.blockersClosed,
    completeByteSha256: result.completeSha256,
  }, null, 2))
}
