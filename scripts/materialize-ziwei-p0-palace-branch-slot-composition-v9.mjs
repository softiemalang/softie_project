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
} from '../src/artifactIdentity.js'
import * as v8 from './materialize-ziwei-p0-palace-branch-slot-composition-v8.mjs'

export const SCHEMA = 'ziwei-p0-palace-branch-slot-composition-v9'
export const VERDICT = 'complete_ziwei_palace_branch_slot_composition_with_zjlib_lithographic_variant_direct_corroboration_derived_not_authoritative'
export const MATERIALIZER_VERSION = '9.0.0'
export const BASIS_HEAD = v8.BASIS_HEAD
export const MATERIALIZER_PATH = 'scripts/materialize-' + SCHEMA + '.mjs'
export const ARTIFACT_DIR = 'artifacts/' + SCHEMA
export const ARTIFACT_PATH = ARTIFACT_DIR + '/complete.json'
export const ROOT = resolve(new URL('..', import.meta.url).pathname)

export const PREDECESSOR_COMPOSITION = v8.ARTIFACT_PATH
export const PREDECESSOR_COMPOSITION_EVIDENCE = v8.ARTIFACT_DIR + '/evidence.json'
export const PROTECTED_ASSET_PATH = v8.PROTECTED_ASSET_PATH
export const DOCUMENTATION_PATH = 'docs/ziwei-p0-palace-branch-slot-composition-v9.md'

export const SOURCE_ZJLIB_36_3 = 'src-youyi-lu-zjlib-36-3-lithographic-variant'
export const ZJLIB_36_3_URL = 'https://upload.wikimedia.org/wikipedia/commons/a/af/ZJLib-62b555343157d263ee6a4468-3_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8%E4%B8%89%E5%8D%81%E5%85%AD%E7%A8%AE_%E7%AC%AC3%E5%86%8A.pdf'
export const ZJLIB_36_3_COMMONS_URL = 'https://commons.wikimedia.org/wiki/File:ZJLib-62b555343157d263ee6a4468-3_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8%E4%B8%89%E5%8D%81%E5%85%AD%E7%A8%AE_%E7%AC%AC3%E5%86%8A.pdf'
export const ZJLIB_36_3_PDF_SHA256 = '1161f81baccf1db652f8aa6ea91110ee34bee05d19f41b3402e95ce45e6a2f96'
export const ZJLIB_36_3_PDF_BYTES = 67173474
export const ZJLIB_36_3_PDF_PAGES = 136
export const ZJLIB_36_3_COMMONS_SHA1 = '95c6205aae61aa536e0d5876d051fa0759506fee'
export const ZJLIB_36_3_RENDER_DPI = 240
export const ZJLIB_36_3_RENDER_SHA256_BY_PAGE = {
  85: 'd9921e8dc7cd8cba425979d3213a7d09a8f4b4f686a3e2efd1be622725cc6fdc',
  86: '484a26f10a97b904d51abe64b9134291adec443d4b79a0cd7fcdb0715a69b9ab',
}
export const ZJLIB_36_3_RENDER_DIMENSIONS_BY_PAGE = {
  85: '1229x1914',
  86: '1229x1873',
}

export const OBSERVATION_ZJLIB_36_3 = 'obs-youyi-zjlib-p85-p86-direct-lithographic-palace-order'
export const RELATION_ZJLIB_36_3 = 'relation-youyi-zjlib-36-3-direct-palace-corroboration'
export const PALACE_CLAIMS = ['claim-palace-name-branch-ordinal', 'claim-12-palace-diagram-semantics']

export const INPUT_PATHS = [...new Set([
  ...v8.INPUT_PATHS,
  PREDECESSOR_COMPOSITION,
  PREDECESSOR_COMPOSITION_EVIDENCE,
  DOCUMENTATION_PATH,
  MATERIALIZER_PATH,
])]

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const clone = value => structuredClone(value)
const unique = values => [...new Set(values)]
const readJson = (root, path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'))
const fileSha256 = (root, path) => sha256(readFileSync(resolve(root, path)))
const requireValue = (condition, message) => { if (!condition) throw new Error(message) }
const git = (root, args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8' }).trim()
export const canonicalJson = v8.canonicalJson

function repository(root) {
  return {
    branch: git(root, ['branch', '--show-current']),
    currentHead: git(root, ['rev-parse', 'HEAD']),
    originMainHead: git(root, ['rev-parse', 'origin/main']),
  }
}

function predecessorInput(root, options = {}) {
  const generated = v8.buildBundle(root, options)
  const stored = readJson(root, PREDECESSOR_COMPOSITION)
  const storedEvidence = readJson(root, PREDECESSOR_COMPOSITION_EVIDENCE)
  requireValue(canonicalStableArtifactJson(stored) === canonicalStableArtifactJson(generated.artifact), 'v8_predecessor_complete_drift')
  requireValue(canonicalStableArtifactJson(storedEvidence) === canonicalStableArtifactJson(generated.files['evidence.json']), 'v8_predecessor_evidence_drift')
  requireValue(generated.artifact.schemaVersion === v8.SCHEMA, 'unexpected_v8_schema')
  requireValue(generated.artifact.graphImpact.successor.claimCount === 30, 'unexpected_v8_claim_count')
  requireValue(generated.artifact.graphImpact.successor.sourceCount === 19, 'unexpected_v8_source_count')
  requireValue(generated.artifact.graphImpact.successor.observationCount === 55, 'unexpected_v8_observation_count')
  requireValue(generated.artifact.graphImpact.successor.relationCount === 146, 'unexpected_v8_relation_count')
  requireValue(generated.artifact.graphImpact.successor.blockerCount === 11, 'unexpected_v8_blocker_count')
  return { generated, stored, storedEvidence }
}

function directObservation() {
  return {
    observationId: OBSERVATION_ZJLIB_36_3,
    affectedClaimIds: PALACE_CLAIMS,
    authorityStatus: 'direct_scan_witness; source_authority_and_semantic_authority_not_established',
    directObservationStatus: 'direct_visual_original_scan_review_not_ocr_transcription',
    directReading: [
      'The scan identifies 游藝錄五 and 紫微斗數篇 on the reviewed pages.',
      'The pages visibly state 乃逆行而布十二宮.',
      'The pages visibly present the twelve-palace sequence including 命宮, 兄弟宮, 夫妻宮, 子息宮, 財帛宮, 疾厄宮, 遷移宮, 奴僕宮, 官祿宮, 田宅宮, 福德宮, and 父母宮.',
      'The reviewed pages visibly contain 命立子宮 and 命立丑宮 worked-example forms; no canonical full transcription is asserted here.',
    ],
    rawVisibleText: [
      { text: '遊藝錄五', locator: 'PDF page 85, right-side running title/section surface', canonicalOriginalPageTranscription: false },
      { text: '紫微斗數篇', locator: 'PDF page 85, section heading', canonicalOriginalPageTranscription: false },
      { text: '乃逆行而布十二宮', locator: 'PDF pages 85-86, direct visual review', canonicalOriginalPageTranscription: false },
      { text: '命立子宮 / 命立丑宮', locator: 'PDF pages 85-86, worked-example forms', canonicalOriginalPageTranscription: false },
    ],
    doesNotEstablish: [
      'palace_name_to_physical_chart_slot',
      'production_ordinal',
      '1871_textual_lineage',
      'block_identity_or_colophon_continuity_with_the_1871_impression',
      'semantic_authority',
      'single_source_four_field_binding',
    ],
    locator: {
      commonsPageId: 148539347,
      commonsUrl: ZJLIB_36_3_COMMONS_URL,
      url: ZJLIB_36_3_URL,
      holdingCredit: 'Zhejiang Library',
      volume: '春在堂全書三十六種 第3冊',
      section: '遊藝錄五·紫微斗數篇',
      scanPages: [85, 86],
      renderDpi: ZJLIB_36_3_RENDER_DPI,
      renderedFileSha256ByPage: ZJLIB_36_3_RENDER_SHA256_BY_PAGE,
      renderedDimensionsByPage: ZJLIB_36_3_RENDER_DIMENSIONS_BY_PAGE,
      sourcePdfSha256: ZJLIB_36_3_PDF_SHA256,
      sourcePdfBytes: ZJLIB_36_3_PDF_BYTES,
      sourcePdfPages: ZJLIB_36_3_PDF_PAGES,
    },
    observationKind: 'direct_lithographic_variant_scan_named_palace_order_and_worked_examples',
    researcherDirectObservation: true,
    sourceIdentity: {
      author: '（清）俞樾撰',
      edition: '清末石印本 上欄二十行二十一字下欄二十行二十一字白口四周單邊單黑',
      holdingCredit: 'Zhejiang Library',
      commonsSha1: ZJLIB_36_3_COMMONS_SHA1,
      pdfBytes: ZJLIB_36_3_PDF_BYTES,
      pdfPages: ZJLIB_36_3_PDF_PAGES,
    },
    sourceIds: [SOURCE_ZJLIB_36_3],
    supports: [
      'direct_named_palace_relative_order',
      'direct_reverse_traversal_wording',
      'direct_worked_branch_example_forms',
      'distinct_lithographic_variant_physical_scan',
    ],
  }
}

function sourceLineageEntry() {
  return {
    sourceId: SOURCE_ZJLIB_36_3,
    sourceKind: 'direct_lithographic_variant_physical_scan',
    role: 'direct_named_palace_corroboration_only',
    title: '春在堂全書三十六種 第3冊',
    author: '（清）俞樾撰',
    edition: '清末石印本 上欄二十行二十一字下欄二十行二十一字白口四周單邊單黑',
    holdingCredit: 'Zhejiang Library',
    url: ZJLIB_36_3_URL,
    commonsUrl: ZJLIB_36_3_COMMONS_URL,
    commonsPageId: 148539347,
    sourcePdfSha256: ZJLIB_36_3_PDF_SHA256,
    sourcePdfBytes: ZJLIB_36_3_PDF_BYTES,
    sourcePdfPages: ZJLIB_36_3_PDF_PAGES,
    commonsSha1: ZJLIB_36_3_COMMONS_SHA1,
    physicalWitnessCandidate: true,
    independentPhysicalWitness: false,
    sourceAuthority: 'not_established',
    lineageStatus: 'distinct_lithographic_variant_same_work; block_colophon_and_1871_lineage_unresolved',
  }
}

function relation() {
  return {
    relationId: RELATION_ZJLIB_36_3,
    sourceIds: ['src-youyi-lu-cadal-01025514-1883', SOURCE_ZJLIB_36_3],
    observationIds: [OBSERVATION_ZJLIB_36_3],
    relationKind: 'direct_scan_named_palace_order_corroboration_distinct_lithographic_variant',
    relationStatus: 'direct Zhejiang Library 第3冊 pages 85-86 agree with the CADAL named-palace/reverse-traversal surface; the catalog-described lithographic variant is not treated as proof of 1871 block identity or coordinate authority',
    claimIds: PALACE_CLAIMS,
    affectedClaimIds: PALACE_CLAIMS,
    blockerIds: ['blocker-palace-semantic-identity'],
    promotion: 'not_admitted_to_source_authority_or_semantic_claim',
    observationCount: 1,
  }
}

function updateClaimReconciliation(previous, observation, relationRecord) {
  return previous.claimReconciliation.map(claim => {
    if (!PALACE_CLAIMS.includes(claim.claimId)) return clone(claim)
    return {
      ...clone(claim),
      observationIdsAdded: unique([...(claim.observationIdsAdded || []), observation.observationId]),
      sourceIdsAdded: unique([...(claim.sourceIdsAdded || []), SOURCE_ZJLIB_36_3]),
      evidenceRelationIdsAdded: unique([...(claim.evidenceRelationIdsAdded || []), relationRecord.relationId]),
      directObservationStatus: 'three additional direct scan corroborations; physical slot and semantic authority unchanged',
      predecessorStatus: claim.successorStatus,
      successorStatus: claim.successorStatus,
      predecessorClaimRelation: claim.successorClaimRelation,
      successorClaimRelation: claim.successorClaimRelation,
      statusChanged: false,
      sourceRelationPromotion: 'none',
    }
  })
}

function updateBlockers(previous, observation, relationRecord) {
  return previous.blockerReassessment.map(blocker => {
    if (blocker.id !== 'blocker-palace-semantic-identity') return clone(blocker)
    return {
      ...clone(blocker),
      statusBefore: blocker.statusAfter,
      statusAfter: blocker.statusAfter,
      statusChanged: false,
      newObservationIds: unique([...(blocker.newObservationIds || []), observation.observationId]),
      newRelationIds: unique([...(blocker.newRelationIds || []), relationRecord.relationId]),
      localResultAfter: `${blocker.localResultAfter}; a distinct Zhejiang lithographic-variant scan corroborates the named-palace/reverse-traversal surface, but no reviewed page supplies physical slots or production ordinal`,
      uncertaintyReduction: unique([...(blocker.uncertaintyReduction || []), 'a third added direct scan surface reduces uncertainty about named-palace text while leaving physical-slot identity open']),
      closureDecision: 'top_level_blocker_remains_open; no automatic closure',
    }
  })
}

function updateEvidence(previous, observation, relationRecord) {
  const evidence = clone(previous.evidence)
  evidence.schemaVersion = SCHEMA + '-evidence-v0'
  evidence.authorityBoundary = 'The v9 additive source is a directly reviewed Zhejiang Library lithographic-variant scan. It corroborates named-palace order and reverse-traversal wording, but does not establish source authority, 1871 lineage, physical slot, production ordinal, semantic authority, readiness, or activation.'
  evidence.observations = [...(evidence.observations || []), observation]
  evidence.directScanCorroboration = {
    ...clone(evidence.directScanCorroboration),
    sourceIds: unique([...(evidence.directScanCorroboration?.sourceIds || []), SOURCE_ZJLIB_36_3]),
    physicalWitnessCandidates: unique([...(evidence.directScanCorroboration?.physicalWitnessCandidates || []), SOURCE_ZJLIB_36_3]),
    status: 'three_added_direct_scan_surfaces_agree_with_CADAL_named_palace_order_and_worked_examples',
    independentHistoricalWitnessesAdmitted: 0,
    doesNotEstablish: unique([...(evidence.directScanCorroboration?.doesNotEstablish || []), '1871 textual continuity', 'lithographic-variant block identity']),
  }
  evidence.reportedNonObservations = unique([
    ...(evidence.reportedNonObservations || []),
    'The Zhejiang Library 第3冊 is a separate physical scan with a catalog-described 清末石印本 format; its distinct scan identity does not establish 1871 textual or block continuity.',
    'Pages 85-86 directly corroborate named-palace order and reverse-traversal wording, but do not label the Nanbei physical perimeter or declare a production ordinal.',
    'The new lithographic-variant scan is not admitted as an independent semantic witness or source authority.',
  ])
  evidence.newDirectScan = {
    sourceId: SOURCE_ZJLIB_36_3,
    observationId: observation.observationId,
    relationId: relationRecord.relationId,
    sourceBytes: {
      acquiredOutsideRepo: true,
      sha256: ZJLIB_36_3_PDF_SHA256,
      byteLength: ZJLIB_36_3_PDF_BYTES,
      pageCount: ZJLIB_36_3_PDF_PAGES,
    },
    graphAdmission: 'admitted_as_direct_named_palace_corroboration_only',
    independentWitnessAdmitted: false,
  }
  return evidence
}

function updateBindingMatrix(previous, observation) {
  const matrix = clone(previous.bindingMatrix)
  matrix.schemaVersion = SCHEMA + '-binding-matrix-v0'
  matrix.coverage.directNamedPalaceWitnessCount += 1
  matrix.coverage.additionalDirectNamedPalaceCorroborationCount += 1
  matrix.directPalaceWitnesses = [
    ...clone(matrix.directPalaceWitnesses),
    {
      sourceId: SOURCE_ZJLIB_36_3,
      locator: observation.locator,
      role: 'additional_direct_named_palace_corroboration_lithographic_variant',
      physicalSlotBound: false,
      productionOrdinalBound: false,
    },
  ]
  matrix.composition.additionalDirectWitnessLimitations = [
    ...clone(matrix.composition.additionalDirectWitnessLimitations),
    'Zhejiang Library 第3冊 is a catalog-described lithographic variant with direct page review; it does not label the Nanbei perimeter or declare the repository production ordinal.',
  ]
  return matrix
}

function updateLineage(previous, observation) {
  const lineage = clone(previous.lineageAssessment)
  lineage.schemaVersion = SCHEMA + '-lineage-v0'
  lineage.directPalaceWitnesses = [
    ...clone(lineage.directPalaceWitnesses),
    {
      sourceId: SOURCE_ZJLIB_36_3,
      locator: observation.locator,
      direct: true,
      completeRelativeOrder: true,
      physicalSlotBinding: false,
      productionOrdinalBinding: false,
      independentHistoricalWitnessAdmitted: false,
    },
  ]
  lineage.lithographicVariantComparison = {
    sourceIds: ['src-youyi-lu-zjlib-36-25-late-reprint', SOURCE_ZJLIB_36_3],
    status: 'same_work_distinct_catalog_described_format_and_physical_scan',
    sourceFormats: {
      'src-youyi-lu-zjlib-36-25-late-reprint': '清同治至光緒刻光緒末彙印本 十行二十一字黑口左右雙邊單黑',
      [SOURCE_ZJLIB_36_3]: '清末石印本 上欄二十行二十一字下欄二十行二十一字白口四周單邊單黑',
    },
    namedPalaceRuleVisualAgreement: true,
    directVisualComparisonPerformed: true,
    fullTextTranscriptionPerformed: false,
    byteIdentityClaimed: false,
    blockOrColophonIdentityClosed: false,
    relationTo1871Closed: false,
    independentLineageAdmitted: false,
  }
  lineage.physicalWitnessCandidatesAdded = unique([...(lineage.physicalWitnessCandidatesAdded || []), SOURCE_ZJLIB_36_3])
  lineage.sourceIdentityStatus = 'NLC 1883, Zhejiang 第25冊, and Zhejiang 第3冊 scan identities are bounded; 第3冊 is a distinct lithographic variant, while 1871 catalog-only and block/textual lineage remain unresolved'
  lineage.independenceStatus = 'Zhejiang 第3冊 is a direct same-work lithographic-variant corroboration; it is not admitted as an independent semantic authority or proof of 1871 continuity'
  lineage.independentWitnessStatus = 'not_admitted'
  return lineage
}

function updateFieldKit(previous, evidencePath) {
  const fieldKit = clone(previous.fieldKitImpact)
  fieldKit.schemaVersion = SCHEMA + '-field-kit-v0'
  fieldKit.targetReassessment = fieldKit.targetReassessment.map(item => {
    if (item.targetId === 'acq-distinct-witness-identity-lineage') {
      return {
        ...item,
        newEvidenceRole: 'Zhejiang 第3冊 is a directly reviewed lithographic-variant scan with bounded bytes and format metadata; exact 1871 page/text/colophon lineage remains action_required',
        evidenceRefs: unique([...(item.evidenceRefs || []), evidencePath]),
        statusBefore: item.statusAfter,
        statusAfter: item.statusAfter,
        statusChanged: false,
        closure: 'not_closed',
      }
    }
    if (item.targetId === 'acq-palace-semantic-map-and-coordinate-witness') {
      return {
        ...item,
        newEvidenceRole: 'Zhejiang 第3冊 pages 85-86 add a direct lithographic-variant named-palace/reverse-traversal surface; physical diagram slot and production ordinal remain action_required',
        evidenceRefs: unique([...(item.evidenceRefs || []), evidencePath]),
        statusBefore: item.statusAfter,
        statusAfter: item.statusAfter,
        statusChanged: false,
        closure: 'not_closed',
      }
    }
    return item
  })
  fieldKit.heldEvidenceUpdate = 'v9 adds a directly reviewed Zhejiang Library 第3冊 lithographic-variant scan. Its pages 85-86 corroborate named-palace order and reverse traversal, but no physical palace-slot diagram or production ordinal is admitted; 1871 lineage, source authority, semantic authority, readiness, and activation remain open.'
  fieldKit.evidenceObservationIds = unique([...(fieldKit.evidenceObservationIds || []), OBSERVATION_ZJLIB_36_3])
  fieldKit.semanticTargetStillOpen = true
  fieldKit.sourceIdentityTargetStillActionRequired = true
  fieldKit.rightsTargetStillHumanPolicyReview = true
  return fieldKit
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
  const observation = directObservation()
  const relationRecord = relation()
  const evidencePath = ARTIFACT_DIR + '/evidence.json'
  const evidence = updateEvidence(previous, observation, relationRecord)
  const bindingMatrix = updateBindingMatrix(previous, observation)
  const lineageAssessment = updateLineage(previous, observation)
  const fieldKitImpact = updateFieldKit(previous, evidencePath)
  const observations = [...clone(previous.observations), observation]
  const relations = [...clone(previous.relations), relationRecord]
  const claimReconciliation = updateClaimReconciliation(previous, observation, relationRecord)
  const blockerReassessment = updateBlockers(previous, observation, relationRecord)
  const protectedAsset = clone(previous.preservation.protectedAsset)
  requireValue(protectedAsset.exists, 'protected_source_derived_asset_missing')
  requireValue(protectedAsset.byteSha256 === fileSha256(root, PROTECTED_ASSET_PATH), 'protected_source_derived_asset_changed')

  const previousGraph = previous.graphImpact.successor
  const successorGraph = {
    claimCount: previousGraph.claimCount,
    sourceCount: previousGraph.sourceCount + 1,
    observationCount: previousGraph.observationCount + 1,
    relationCount: previousGraph.relationCount + 1,
    blockerCount: previousGraph.blockerCount,
  }
  const blockerStatusCounts = Object.fromEntries(blockerReassessment.map(item => [item.id, item.statusAfter]))
  const completeBase = {
    ...clone(previous),
    schemaVersion: SCHEMA,
    verdictToken: VERDICT,
    observedHead: repo.currentHead,
    originMainHead: repo.originMainHead,
    branch: repo.branch,
    scope: {
      ...clone(previous.scope),
      purpose: 'additive direct review of the Zhejiang 第3冊 lithographic variant for named-palace corroboration; no physical-slot, source-authority, semantic, production, readiness, or activation promotion',
      physicalWitnessCandidatesAdded: (previous.scope.physicalWitnessCandidatesAdded || 0) + 1,
      externalDirectScanReviewPerformed: true,
      historical1871ScanObtained: false,
      directSingleWitnessFullBindingEstablished: false,
      independentWitnessesAdmitted: 0,
      sourceAuthorityPromoted: false,
      semanticAuthorityPromoted: false,
    },
    predecessorChain: [
      ...clone(previous.predecessorChain),
      { path: PREDECESSOR_COMPOSITION, schemaVersion: previous.schemaVersion, byteSha256: fileSha256(root, PREDECESSOR_COMPOSITION) },
      { path: PREDECESSOR_COMPOSITION_EVIDENCE, schemaVersion: predecessor.storedEvidence.schemaVersion, byteSha256: fileSha256(root, PREDECESSOR_COMPOSITION_EVIDENCE) },
    ],
    sourceLineage: {
      ...clone(previous.sourceLineage),
      addedSources: [...clone(previous.sourceLineage.addedSources), sourceLineageEntry()],
      physicalWitnessCountBefore: previous.sourceLineage.physicalWitnessCountAfter,
      physicalWitnessCountAfter: previous.sourceLineage.physicalWitnessCountAfter + 1,
      physicalWitnessCandidatesAdded: unique([...(previous.sourceLineage.physicalWitnessCandidatesAdded || []), SOURCE_ZJLIB_36_3]),
      independentPhysicalWitnessesAdmitted: 0,
      lineageInferencePerformed: true,
      sourceAuthority: 'not_established',
      semanticAuthority: 'not_established',
      sourceIdentityStatus: 'NLC 1883, Zhejiang 第25冊, and Zhejiang 第3冊 identities are bounded; 第3冊 is a distinct lithographic variant, while 1871 catalog-only and block/textual lineage remain unresolved',
      independenceStatus: 'Zhejiang 第3冊 is a distinct same-work lithographic-variant direct corroboration; no independent semantic authority or 1871 continuity is admitted',
    },
    evidence,
    observations,
    relations,
    claimReconciliation,
    blockerReassessment,
    bindingMatrix,
    lineageAssessment,
    fieldKitImpact,
    graphImpact: {
      predecessor: previousGraph,
      additive: {
        claimCount: 0,
        sourceCount: 1,
        physicalWitnessCount: 1,
        observationCount: 1,
        relationCount: 1,
        blockerCount: 0,
      },
      successor: successorGraph,
      claimsAdded: 0,
      sourcesAdded: [SOURCE_ZJLIB_36_3],
      physicalWitnessesAdded: [SOURCE_ZJLIB_36_3],
      independentPhysicalWitnessesAdmitted: 0,
      addedObservationIds: [OBSERVATION_ZJLIB_36_3],
      addedRelationIds: [RELATION_ZJLIB_36_3],
      blockersClosed: [],
      blockersStillOpen: previous.graphImpact.blockersStillOpen,
      blockerStatusCounts,
      researchFrontier: clone(previous.graphImpact.researchFrontier),
    },
    claimImpact: {
      ...clone(previous.claimImpact),
      boundedDirectCorroborationAdded: unique([...(previous.claimImpact.boundedDirectCorroborationAdded || []), ...PALACE_CLAIMS]),
      directSemanticClaimSupportAdded: [],
      claimsAdded: 0,
      claimsPromoted: 0,
      semanticAuthorityCount: 0,
      boundary: 'The v9 lithographic-variant scan adds direct named-palace and reverse-traversal corroboration only. Branch-token joining, physical slot identity, production ordinal, 1871 lineage, source authority, semantic authority, readiness, and activation remain unchanged.',
    },
    blockerImpact: {
      ...clone(previous.blockerImpact),
      blockersClosed: [],
      blockerStatusChanges: [],
      resolvedSubBoundaries: [
        ...clone(previous.blockerImpact.resolvedSubBoundaries),
        'Zhejiang 第3冊 lithographic-variant pages 85-86 directly corroborate named-palace order and reverse traversal without closing the physical-slot, production-ordinal, or 1871-lineage gates',
      ],
      resolvedSubBoundaryIsNotTopLevelClosure: true,
    },
    readinessImpact: {
      ...clone(previous.readinessImpact),
      readiness: 'not_safe_to_start',
      grounding: 'blocked',
      activation: 'experimental_only',
      rotation06: 'representation_only',
      sourceAuthorityPromoted: false,
      semanticAuthorityPromoted: false,
      independentWitnessesAdmitted: 0,
      productionModified: false,
      readinessModified: false,
    },
    preservation: {
      ...clone(previous.preservation),
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
      ...clone(previous.deterministicContract),
      sourceBytes: 'The Zhejiang 第3冊 PDF and reviewed page renders are referenced through fixed URLs, byte hashes, dimensions, page numbers, and explicit lineage boundaries; materialization performs no network acquisition.',
      network: 'forbidden_during_materialization',
      ocr: 'not used as canonical text; direct visual findings and catalog-format metadata are fixed evidence metadata',
      noAutomaticPromotion: true,
    },
    negativeContract: {
      ...clone(previous.negativeContract),
      rejects: unique([
        ...previous.negativeContract.rejects,
        'treating the Zhejiang 第3冊 lithographic-variant format as proof of the 1871 impression or block identity',
        'treating direct visual agreement across Zhejiang 第3冊 and 第25冊 as full-text, colophon, or semantic-coordinate identity',
        'promoting the v9 direct corroboration into physical slot, production ordinal, source authority, semantic authority, readiness, or activation',
      ]),
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
        researchFrontierAdmission: 'not_admitted',
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
    predecessorSchema: v8.SCHEMA,
    counts: result.artifact.graphImpact.successor,
    addedSourceId: SOURCE_ZJLIB_36_3,
    addedObservationId: OBSERVATION_ZJLIB_36_3,
    directNamedPalaceWitnessCount: result.artifact.bindingMatrix.coverage.directNamedPalaceWitnessCount,
    directSingleWitnessFullBindingCount: result.artifact.bindingMatrix.coverage.directSingleWitnessFullBindingCount,
    productionOrdinalBindingCount: result.artifact.bindingMatrix.coverage.productionOrdinalBindingCount,
    independentPhysicalWitnessesAdmitted: result.artifact.graphImpact.independentPhysicalWitnessesAdmitted,
    blockersClosed: result.artifact.graphImpact.blockersClosed,
    completeByteSha256: result.completeSha256,
  }, null, 2))
}
