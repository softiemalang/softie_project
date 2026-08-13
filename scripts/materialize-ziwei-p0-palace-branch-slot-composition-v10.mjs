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
import * as v9 from './materialize-ziwei-p0-palace-branch-slot-composition-v9.mjs'

export const SCHEMA = 'ziwei-p0-palace-branch-slot-composition-v10'
export const VERDICT = 'complete_ziwei_palace_branch_slot_composition_with_same_manuscript_cross_page_frontier_derived_not_authoritative'
export const MATERIALIZER_VERSION = '10.0.0'
export const BASIS_HEAD = v9.BASIS_HEAD
export const MATERIALIZER_PATH = 'scripts/materialize-' + SCHEMA + '.mjs'
export const ARTIFACT_DIR = 'artifacts/' + SCHEMA
export const ARTIFACT_PATH = ARTIFACT_DIR + '/complete.json'
export const ROOT = resolve(new URL('..', import.meta.url).pathname)

export const PREDECESSOR_COMPOSITION = v9.ARTIFACT_PATH
export const PREDECESSOR_COMPOSITION_EVIDENCE = v9.ARTIFACT_DIR + '/evidence.json'
export const PROTECTED_ASSET_PATH = v9.PROTECTED_ASSET_PATH
export const DOCUMENTATION_PATH = 'docs/ziwei-p0-palace-branch-slot-composition-v10.md'

export const SOURCE_CNTS_00047996572 = 'src-cnts-00047996572-ziwei-doushu-fangshu-manuscript'
export const CNTS_00047996572_COMMONS_URL = 'https://commons.wikimedia.org/wiki/File:CNTS-00047996572_%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E6%96%B9%E6%9B%B8.pdf'
export const CNTS_00047996572_URL = 'https://upload.wikimedia.org/wikipedia/commons/9/98/CNTS-00047996572_%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E6%96%B9%E6%9B%B8.pdf'
export const CNTS_00047996572_PDF_SHA256 = 'b21bbf3e2c7cdada4153f847ff9f359dbb29e71998e1f931417d108b571b23c3'
export const CNTS_00047996572_PDF_BYTES = 75687209
export const CNTS_00047996572_PDF_PAGES = 153
export const CNTS_00047996572_COMMONS_SHA1 = '0ecf0cdc7ae9a2e0d427501bb0fdef901a851a0a'
export const CNTS_00047996572_RENDER_DPI = 300
export const CNTS_00047996572_RENDER_SHA256_BY_PAGE = {
  6: '5df23d4bf6599436a5ed67cb5aeb28c68de4df6f73827755a37487390d955f58',
  7: '380e2405f741c3bcdcf4ba80c08c7bf87821952f34a21ea0068b775c57d20b13',
  13: '33f5931dc54583ed5c753d5319eed18555f29ce753a30269c48b673b632d4ddc',
}
export const CNTS_00047996572_RENDER_DIMENSIONS_BY_PAGE = {
  6: '1500x2356',
  7: '1500x2356',
  13: '1500x2356',
}

export const OBSERVATION_CNTS_P6 = 'obs-cnts-00047996572-p6-palace-sequence-direct'
export const OBSERVATION_CNTS_P13 = 'obs-cnts-00047996572-p13-branch-grid-direct'
export const RELATION_CNTS_CROSS_PAGE = 'relation-cnts-00047996572-cross-page-composed-binding-frontier'
export const PALACE_CLAIMS = ['claim-palace-name-branch-ordinal', 'claim-12-palace-diagram-semantics']

export const INPUT_PATHS = [...new Set([
  ...v9.INPUT_PATHS,
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
export const canonicalJson = v9.canonicalJson

function repository(root) {
  return {
    branch: git(root, ['branch', '--show-current']),
    currentHead: git(root, ['rev-parse', 'HEAD']),
    originMainHead: git(root, ['rev-parse', 'origin/main']),
  }
}

function predecessorInput(root, options = {}) {
  const generated = v9.buildBundle(root, options)
  const stored = readJson(root, PREDECESSOR_COMPOSITION)
  const storedEvidence = readJson(root, PREDECESSOR_COMPOSITION_EVIDENCE)
  requireValue(canonicalStableArtifactJson(stored) === canonicalStableArtifactJson(generated.artifact), 'v9_predecessor_complete_drift')
  requireValue(canonicalStableArtifactJson(storedEvidence) === canonicalStableArtifactJson(generated.files['evidence.json']), 'v9_predecessor_evidence_drift')
  requireValue(generated.artifact.schemaVersion === v9.SCHEMA, 'unexpected_v9_schema')
  requireValue(generated.artifact.graphImpact.successor.claimCount === 30, 'unexpected_v9_claim_count')
  requireValue(generated.artifact.graphImpact.successor.sourceCount === 20, 'unexpected_v9_source_count')
  requireValue(generated.artifact.graphImpact.successor.observationCount === 56, 'unexpected_v9_observation_count')
  requireValue(generated.artifact.graphImpact.successor.relationCount === 147, 'unexpected_v9_relation_count')
  requireValue(generated.artifact.graphImpact.successor.blockerCount === 11, 'unexpected_v9_blocker_count')
  return { generated, stored, storedEvidence }
}

function locator(scanPages, renderedPages) {
  return {
    commonsUrl: CNTS_00047996572_COMMONS_URL,
    url: CNTS_00047996572_URL,
    catalogId: 'CNTS-00047996572',
    holdingCredit: 'National Digital Library of Korea',
    title: '紫微斗數方書',
    edition: '筆寫本',
    scanPages,
    printedPages: scanPages,
    renderDpi: CNTS_00047996572_RENDER_DPI,
    renderedFileSha256ByPage: renderedPages,
    renderedDimensionsByPage: Object.fromEntries(scanPages.map(page => [page, CNTS_00047996572_RENDER_DIMENSIONS_BY_PAGE[page]])),
    sourcePdfSha256: CNTS_00047996572_PDF_SHA256,
    sourcePdfBytes: CNTS_00047996572_PDF_BYTES,
    sourcePdfPages: CNTS_00047996572_PDF_PAGES,
  }
}

function sourceIdentity() {
  return {
    author: '編者未詳',
    edition: '筆寫本',
    holdingCredit: 'National Digital Library of Korea',
    catalogId: 'CNTS-00047996572',
    commonsSha1: CNTS_00047996572_COMMONS_SHA1,
    pdfSha256: CNTS_00047996572_PDF_SHA256,
    pdfBytes: CNTS_00047996572_PDF_BYTES,
    pdfPages: CNTS_00047996572_PDF_PAGES,
    publicationDate: 'not established',
  }
}

function directPalaceObservation() {
  const pageLocator = locator([6], { 6: CNTS_00047996572_RENDER_SHA256_BY_PAGE[6] })
  return {
    observationId: OBSERVATION_CNTS_P6,
    affectedClaimIds: PALACE_CLAIMS,
    authorityStatus: 'direct_image_scan_witness; work identity, source authority, and semantic authority not established',
    directObservationStatus: 'direct_visual_original_scan_review_not_ocr_transcription',
    directReading: [
      'PDF page 6 / printed page 6 visibly contains a numbered vertical palace-name sequence beginning 一命宮二兄弟宮三夫妻宮四子息宮五財帛宮六疾厄宮七遷移宮八奴僕宮.',
      'The same page visibly contains branch tokens and rule/example columns, but it does not place the named palace labels inside the physical grid reviewed at PDF page 13.',
    ],
    rawVisibleText: [
      {
        text: '一命宮二兄弟宮三夫妻宮四子息宮五財帛宮六疾厄宮七遷移宮八奴僕宮',
        locator: 'PDF page 6 / printed page 6 / rightmost vertical numbered sequence',
        canonicalOriginalPageTranscription: false,
      },
    ],
    doesNotEstablish: [
      'palace_name_to_physical_chart_slot',
      'p6_palace_sequence_to_p13_branch_grid_join',
      'production_ordinal',
      'physical_chart_compass_orientation',
      'clockwise_or_counterclockwise_chart_direction',
      '1871_textual_lineage',
      'relation_to_youyi_lu_or_nanbei_work_identity',
      'semantic_authority',
      'single_frame_four_field_binding',
    ],
    locator: pageLocator,
    observationKind: 'direct_anonymous_handwritten_manuscript_palace_sequence_component',
    researcherDirectObservation: true,
    sourceIdentity: sourceIdentity(),
    sourceIds: [SOURCE_CNTS_00047996572],
    supports: [
      'direct_partial_named_palace_sequence',
      'direct_numbered_palace_labels_in_text',
      'same_manuscript_identity_for_cross_page_composition',
    ],
  }
}

function directBranchGridObservation() {
  const pageLocator = locator([13], { 13: CNTS_00047996572_RENDER_SHA256_BY_PAGE[13] })
  return {
    observationId: OBSERVATION_CNTS_P13,
    affectedClaimIds: PALACE_CLAIMS,
    authorityStatus: 'direct_image_scan_witness; branch-grid component only; source authority and semantic authority not established',
    directObservationStatus: 'direct_visual_original_scan_review_not_ocr_transcription',
    directReading: [
      'PDF page 13 / printed page 13 visibly presents a ruled chart/table whose rightmost vertical column places 子, 丑, 寅, 卯, 辰, 巳, 午, 未, 申, 酉, 戌, 亥 in separate physical rows/cells.',
      'The page visibly places star/rule entries in cells adjacent to those branch tokens; the observed sequence is page-top-to-bottom only and is not assigned a compass or clockwise orientation.',
    ],
    rawVisibleText: [
      {
        text: '子 丑 寅 卯 辰 巳 午 未 申 酉 戌 亥',
        locator: 'PDF page 13 / printed page 13 / rightmost vertical grid column',
        canonicalOriginalPageTranscription: false,
      },
    ],
    doesNotEstablish: [
      'palace_name_to_physical_chart_slot',
      'p6_palace_sequence_to_p13_branch_grid_join',
      'production_ordinal',
      'physical_chart_compass_orientation',
      'clockwise_or_counterclockwise_chart_direction',
      '1871_textual_lineage',
      'relation_to_youyi_lu_or_nanbei_work_identity',
      'semantic_authority',
      'single_frame_four_field_binding',
    ],
    locator: pageLocator,
    observationKind: 'direct_anonymous_handwritten_manuscript_branch_token_physical_grid_component',
    researcherDirectObservation: true,
    sourceIdentity: sourceIdentity(),
    sourceIds: [SOURCE_CNTS_00047996572],
    supports: [
      'direct_twelve_branch_token_coverage',
      'direct_branch_token_to_page_grid_row',
      'direct_physical_grid_slot_component',
      'same_manuscript_identity_for_cross_page_composition',
    ],
  }
}

function sourceLineageEntry() {
  return {
    sourceId: SOURCE_CNTS_00047996572,
    sourceKind: 'direct_anonymous_handwritten_manuscript_image_scan',
    role: 'same_witness_cross_page_binding_frontier_only',
    title: '紫微斗數方書',
    author: '編者未詳',
    edition: '筆寫本',
    extent: '2卷1冊; 34.2 x 23.3 cm',
    holdingCredit: 'National Digital Library of Korea',
    catalogId: 'CNTS-00047996572',
    url: CNTS_00047996572_URL,
    commonsUrl: CNTS_00047996572_COMMONS_URL,
    sourcePdfSha256: CNTS_00047996572_PDF_SHA256,
    sourcePdfBytes: CNTS_00047996572_PDF_BYTES,
    sourcePdfPages: CNTS_00047996572_PDF_PAGES,
    commonsSha1: CNTS_00047996572_COMMONS_SHA1,
    physicalWitnessCandidate: true,
    independentPhysicalWitness: false,
    sourceAuthority: 'not_established',
    lineageStatus: 'catalogued_handwritten_copy; author_date_and_relation_to_youyi_lu_or_nanbei_unresolved',
    workIdentityStatus: 'not_established_as_youyi_lu_or_nanbei_work',
  }
}

function relation() {
  return {
    relationId: RELATION_CNTS_CROSS_PAGE,
    sourceIds: [SOURCE_CNTS_00047996572],
    observationIds: [OBSERVATION_CNTS_P6, OBSERVATION_CNTS_P13],
    relationKind: 'same_manuscript_cross_page_palace_sequence_and_branch_grid_composed_frontier',
    relationStatus: 'The same scanned manuscript directly supplies a numbered palace-name component on p6 and a twelve-branch physical grid component on p13. Joining those components is an explicit cross-page inference; no reviewed single frame labels the p13 grid with palace names.',
    claimIds: PALACE_CLAIMS,
    affectedClaimIds: PALACE_CLAIMS,
    blockerIds: ['blocker-palace-semantic-identity'],
    promotion: 'not_admitted_to_source_authority_or_semantic_claim',
    inferenceStatus: 'composed_cross_page_same_manuscript_not_direct_single_frame',
    doesNotEstablish: [
      'palace_name_to_p13_physical_slot',
      'production_ordinal',
      'compass_or_clockwise_direction',
      'youyi_lu_or_nanbei_work_identity',
      'semantic_authority',
    ],
    observationCount: 2,
  }
}

function updateClaimReconciliation(previous, observations, relationRecord) {
  const observationIds = observations.map(item => item.observationId)
  return previous.claimReconciliation.map(claim => {
    if (!PALACE_CLAIMS.includes(claim.claimId)) return clone(claim)
    return {
      ...clone(claim),
      observationIdsAdded: unique([...(claim.observationIdsAdded || []), ...observationIds]),
      sourceIdsAdded: unique([...(claim.sourceIdsAdded || []), SOURCE_CNTS_00047996572]),
      evidenceRelationIdsAdded: unique([...(claim.evidenceRelationIdsAdded || []), relationRecord.relationId]),
      directObservationStatus: 'same anonymous manuscript directly supplies separate palace-sequence and branch-grid components; cross-page join remains inferred and physical-slot/semantic authority unchanged',
      predecessorStatus: claim.successorStatus,
      successorStatus: claim.successorStatus,
      predecessorClaimRelation: claim.successorClaimRelation,
      successorClaimRelation: claim.successorClaimRelation,
      statusChanged: false,
      sourceRelationPromotion: 'none',
    }
  })
}

function updateBlockers(previous, observations, relationRecord) {
  const observationIds = observations.map(item => item.observationId)
  return previous.blockerReassessment.map(blocker => {
    if (blocker.id !== 'blocker-palace-semantic-identity') return clone(blocker)
    return {
      ...clone(blocker),
      statusBefore: blocker.statusAfter,
      statusAfter: blocker.statusAfter,
      statusChanged: false,
      newObservationIds: unique([...(blocker.newObservationIds || []), ...observationIds]),
      newRelationIds: unique([...(blocker.newRelationIds || []), relationRecord.relationId]),
      localResultAfter: `${blocker.localResultAfter}; the same anonymous handwritten scan directly supplies a numbered palace sequence on p6 and a twelve-branch physical grid on p13, but no reviewed frame joins a palace name to a p13 slot or declares an ordinal/direction contract`,
      uncertaintyReduction: unique([...(blocker.uncertaintyReduction || []), 'one physical manuscript now supplies both component surfaces, while the cross-page join remains an explicit inference']),
      closureDecision: 'top_level_blocker_remains_open; no automatic closure',
    }
  })
}

function updateEvidence(previous, observations, relationRecord) {
  const evidence = clone(previous.evidence)
  evidence.schemaVersion = SCHEMA + '-evidence-v0'
  evidence.authorityBoundary = 'The v10 additive source is a directly reviewed National Digital Library of Korea handwritten image scan. Its p6 numbered palace sequence and p13 twelve-branch grid are direct observations from the same manuscript, but their cross-page join is inferred; work identity, source authority, palace-to-slot binding, production ordinal, direction, semantic authority, readiness, and activation remain unestablished.'
  evidence.observations = [...(evidence.observations || []), ...observations]
  evidence.manuscriptCrossPageFrontier = {
    sourceId: SOURCE_CNTS_00047996572,
    observationIds: observations.map(item => item.observationId),
    relationId: relationRecord.relationId,
    directComponents: {
      p6NumberedPalaceSequence: true,
      p13TwelveBranchPhysicalGrid: true,
    },
    crossPageJoin: 'inferred_same_manuscript_not_direct_single_frame',
    palaceNameToPhysicalSlot: false,
    productionOrdinal: false,
    direction: false,
    independentWitnessAdmitted: false,
  }
  evidence.reportedNonObservations = unique([
    ...(evidence.reportedNonObservations || []),
    'The NLD Korea manuscript p6 and p13 are separate direct page observations; no single reviewed frame places the p6 palace labels in the p13 branch grid.',
    'The p13 top-to-bottom branch sequence is a page-axis observation only. It does not establish compass orientation, clockwise/counterclockwise traversal, or the repository production ordinal.',
    'The anonymous handwritten manuscript has bounded scan bytes but no established author/date/work identity relation to 游藝錄 or the Nanbei source; it is not admitted as an independent semantic authority.',
  ])
  evidence.predecessorNewDirectScan = clone(previous.evidence.newDirectScan)
  evidence.newDirectScan = {
    sourceId: SOURCE_CNTS_00047996572,
    observationIds: observations.map(item => item.observationId),
    relationId: relationRecord.relationId,
    sourceBytes: {
      acquiredOutsideRepo: true,
      sha256: CNTS_00047996572_PDF_SHA256,
      byteLength: CNTS_00047996572_PDF_BYTES,
      pageCount: CNTS_00047996572_PDF_PAGES,
    },
    graphAdmission: 'admitted_as_same_manuscript_cross_page_binding_frontier_only',
    independentWitnessAdmitted: false,
  }
  return evidence
}

function updateBindingMatrix(previous, palaceObservation, gridObservation, relationRecord) {
  const matrix = clone(previous.bindingMatrix)
  matrix.schemaVersion = SCHEMA + '-binding-matrix-v0'
  matrix.coverage.partialDirectNamedPalaceComponentCount = (matrix.coverage.partialDirectNamedPalaceComponentCount || 0) + 1
  matrix.coverage.directBranchPhysicalGridWitnessCount = (matrix.coverage.directBranchPhysicalGridWitnessCount || 0) + 1
  matrix.coverage.crossPageComposedBindingFrontierCount = (matrix.coverage.crossPageComposedBindingFrontierCount || 0) + 1
  matrix.directPalaceWitnesses = [
    ...clone(matrix.directPalaceWitnesses),
    {
      sourceId: SOURCE_CNTS_00047996572,
      locator: palaceObservation.locator,
      role: 'partial_direct_named_palace_sequence_component_same_manuscript',
      completeRelativeOrder: false,
      partialSequence: true,
      physicalSlotBound: false,
      productionOrdinalBound: false,
      independentHistoricalWitnessAdmitted: false,
    },
  ]
  matrix.directBranchPhysicalGridWitnesses = [
    ...(matrix.directBranchPhysicalGridWitnesses || []),
    {
      sourceId: SOURCE_CNTS_00047996572,
      locator: gridObservation.locator,
      branchCoverage: 12,
      pageAxisOnly: true,
      palaceNameBound: false,
      productionOrdinalBound: false,
    },
  ]
  matrix.crossPageComposedBindingFrontiers = [
    ...(matrix.crossPageComposedBindingFrontiers || []),
    {
      sourceId: SOURCE_CNTS_00047996572,
      observationIds: [palaceObservation.observationId, gridObservation.observationId],
      relationId: relationRecord.relationId,
      status: 'inferred_not_direct_single_frame',
      fullBinding: false,
    },
  ]
  matrix.composition.additionalDirectWitnessLimitations = [
    ...clone(matrix.composition.additionalDirectWitnessLimitations),
    'NLD Korea p6 and p13 are direct pages from one anonymous handwritten manuscript; p6 supplies only a palace-sequence component, p13 supplies only a branch-grid component, and no frame joins palace names to grid slots.',
  ]
  matrix.composition.unprovenJoinPremises = unique([
    ...clone(matrix.composition.unprovenJoinPremises),
    'The NLD Korea p6 numbered palace sequence and p13 branch grid use the same semantic coordinate frame.',
    'The NLD Korea p13 page-axis order is a chart orientation or production ordinal.',
  ])
  return matrix
}

function updateLineage(previous, palaceObservation, gridObservation, relationRecord) {
  const lineage = clone(previous.lineageAssessment)
  lineage.schemaVersion = SCHEMA + '-lineage-v0'
  lineage.directPalaceWitnesses = [
    ...clone(lineage.directPalaceWitnesses),
    {
      sourceId: SOURCE_CNTS_00047996572,
      locator: palaceObservation.locator,
      direct: true,
      completeRelativeOrder: false,
      partialNamedPalaceSequence: true,
      physicalSlotBinding: false,
      productionOrdinalBinding: false,
      independentHistoricalWitnessAdmitted: false,
    },
  ]
  lineage.branchGridWitnesses = [
    ...(lineage.branchGridWitnesses || []),
    {
      sourceId: SOURCE_CNTS_00047996572,
      locator: gridObservation.locator,
      direct: true,
      branchCoverage: 12,
      pageAxisOnly: true,
      palaceNameBinding: false,
      productionOrdinalBinding: false,
    },
  ]
  lineage.sameManuscriptCrossPageComposition = {
    sourceId: SOURCE_CNTS_00047996572,
    observationIds: [palaceObservation.observationId, gridObservation.observationId],
    relationId: relationRecord.relationId,
    directPalaceSequenceComponent: true,
    directBranchPhysicalGridComponent: true,
    crossPageJoin: 'inferred_not_direct_single_frame',
    workIdentityEstablished: false,
    independentHistoricalWitnessAdmitted: false,
    physicalSlotBinding: false,
    productionOrdinalBinding: false,
  }
  lineage.physicalWitnessCandidatesAdded = unique([...(lineage.physicalWitnessCandidatesAdded || []), SOURCE_CNTS_00047996572])
  lineage.sourceIdentityStatus = 'NLC 1883, Zhejiang 第25冊, Zhejiang 第3冊, and the NLD Korea manuscript scan identities are bounded; the anonymous handwritten manuscript has no established author/date/work relation to 游藝錄 or Nanbei'
  lineage.independenceStatus = 'NLD Korea 紫微斗數方書 is admitted only as a direct same-manuscript cross-page component frontier; independent historical or semantic witness status is not admitted'
  lineage.independentWitnessStatus = 'not_admitted'
  if (lineage.candidateReview?.candidates) {
    lineage.candidateReview.candidates = lineage.candidateReview.candidates.map(candidate => {
      if (candidate.candidateId !== 'candidate-cnts-00047996572-anonymous-manuscript') return candidate
      return {
        ...candidate,
        decision: 'graph_admitted_same_manuscript_cross_page_frontier_no_complete_four_field_binding',
        doesNotEnterGraph: false,
        graphSourceId: SOURCE_CNTS_00047996572,
        graphObservationIds: [palaceObservation.observationId, gridObservation.observationId],
        graphRelationId: relationRecord.relationId,
      }
    })
  }
  return lineage
}

function updateFieldKit(previous, evidencePath) {
  const fieldKit = clone(previous.fieldKitImpact)
  fieldKit.schemaVersion = SCHEMA + '-field-kit-v0'
  fieldKit.targetReassessment = fieldKit.targetReassessment.map(item => {
    if (item.targetId === 'acq-distinct-witness-identity-lineage') {
      return {
        ...item,
        newEvidenceRole: 'NLD Korea 紫微斗數方書 has bounded direct scan bytes and page identity, but author, date, and relation to 游藝錄/Nanbei remain action_required',
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
        newEvidenceRole: 'NLD Korea p6 directly supplies a partial numbered palace sequence and p13 directly supplies a twelve-branch physical grid; their cross-page join, palace-to-slot mapping, production ordinal, and direction remain action_required',
        evidenceRefs: unique([...(item.evidenceRefs || []), evidencePath]),
        statusBefore: item.statusAfter,
        statusAfter: item.statusAfter,
        statusChanged: false,
        closure: 'not_closed',
      }
    }
    return item
  })
  fieldKit.heldEvidenceUpdate = 'v10 admits the NLD Korea 紫微斗數方書 scan as a bounded same-manuscript cross-page frontier: p6 directly shows a numbered palace-name component and p13 directly shows a twelve-branch physical grid. The join is inferred, not single-frame direct; work lineage, palace-to-slot identity, production ordinal, source/semantic authority, readiness, and activation remain open.'
  fieldKit.evidenceObservationIds = unique([...(fieldKit.evidenceObservationIds || []), OBSERVATION_CNTS_P6, OBSERVATION_CNTS_P13])
  fieldKit.researchFrontier = {
    ...fieldKit.researchFrontier,
    evidenceRefs: unique([...(fieldKit.researchFrontier?.evidenceRefs || []), evidencePath]),
    graphAdmittedFrontierSourceIds: unique([...(fieldKit.researchFrontier?.graphAdmittedFrontierSourceIds || []), SOURCE_CNTS_00047996572]),
    graphAdmittedFrontierObservationIds: unique([...(fieldKit.researchFrontier?.graphAdmittedFrontierObservationIds || []), OBSERVATION_CNTS_P6, OBSERVATION_CNTS_P13]),
    graphAdmittedFrontierCandidateCount: (fieldKit.researchFrontier?.graphAdmittedFrontierCandidateCount || 0) + 1,
    status: 'same_manuscript_cross_page_frontier_admitted_no_complete_four_field_binding',
  }
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
  const palaceObservation = directPalaceObservation()
  const gridObservation = directBranchGridObservation()
  const observationsAdded = [palaceObservation, gridObservation]
  const relationRecord = relation()
  const evidencePath = ARTIFACT_DIR + '/evidence.json'
  const evidence = updateEvidence(previous, observationsAdded, relationRecord)
  const bindingMatrix = updateBindingMatrix(previous, palaceObservation, gridObservation, relationRecord)
  const lineageAssessment = updateLineage(previous, palaceObservation, gridObservation, relationRecord)
  const fieldKitImpact = updateFieldKit(previous, evidencePath)
  const observations = [...clone(previous.observations), ...observationsAdded]
  const relations = [...clone(previous.relations), relationRecord]
  const claimReconciliation = updateClaimReconciliation(previous, observationsAdded, relationRecord)
  const blockerReassessment = updateBlockers(previous, observationsAdded, relationRecord)
  const protectedAsset = clone(previous.preservation.protectedAsset)
  requireValue(protectedAsset.exists, 'protected_source_derived_asset_missing')
  requireValue(protectedAsset.byteSha256 === fileSha256(root, PROTECTED_ASSET_PATH), 'protected_source_derived_asset_changed')

  const previousGraph = previous.graphImpact.successor
  const successorGraph = {
    claimCount: previousGraph.claimCount,
    sourceCount: previousGraph.sourceCount + 1,
    observationCount: previousGraph.observationCount + observationsAdded.length,
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
      purpose: 'additive direct review of one anonymous handwritten manuscript for a same-witness cross-page palace-sequence and branch-grid frontier; no single-frame, physical-slot, source-authority, semantic, production, readiness, or activation promotion',
      physicalWitnessCandidatesAdded: (previous.scope.physicalWitnessCandidatesAdded || 0) + 1,
      heldOutResearchCandidateCount: Math.max(0, (previous.scope.heldOutResearchCandidateCount || 0) - 1),
      researchCandidatesAdmitted: (previous.scope.researchCandidatesAdmitted || 0) + 1,
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
      physicalWitnessCandidatesAdded: unique([...(previous.sourceLineage.physicalWitnessCandidatesAdded || []), SOURCE_CNTS_00047996572]),
      independentPhysicalWitnessesAdmitted: 0,
      lineageInferencePerformed: true,
      sourceAuthority: 'not_established',
      semanticAuthority: 'not_established',
      sourceIdentityStatus: 'NLC 1883, Zhejiang 第25冊, Zhejiang 第3冊, and the NLD Korea manuscript scan identities are bounded; the anonymous handwritten manuscript has no established author/date/work relation to 游藝錄 or Nanbei',
      independenceStatus: 'NLD Korea 紫微斗數方書 is admitted only as a direct same-manuscript cross-page component frontier; independent historical or semantic witness status is not admitted',
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
        observationCount: observationsAdded.length,
        relationCount: 1,
        blockerCount: 0,
      },
      successor: successorGraph,
      claimsAdded: 0,
      sourcesAdded: [SOURCE_CNTS_00047996572],
      physicalWitnessesAdded: [SOURCE_CNTS_00047996572],
      independentPhysicalWitnessesAdmitted: 0,
      addedObservationIds: observationsAdded.map(item => item.observationId),
      addedRelationIds: [RELATION_CNTS_CROSS_PAGE],
      blockersClosed: [],
      blockersStillOpen: previous.graphImpact.blockersStillOpen,
      blockerStatusCounts,
      researchFrontier: {
        ...clone(previous.graphImpact.researchFrontier),
        sourcesAdded: unique([...(previous.graphImpact.researchFrontier.sourcesAdded || []), SOURCE_CNTS_00047996572]),
        observationsAdded: unique([...(previous.graphImpact.researchFrontier.observationsAdded || []), ...observationsAdded.map(item => item.observationId)]),
        relationsAdded: unique([...(previous.graphImpact.researchFrontier.relationsAdded || []), RELATION_CNTS_CROSS_PAGE]),
        independentPhysicalWitnessesAdmitted: 0,
      },
    },
    claimImpact: {
      ...clone(previous.claimImpact),
      boundedComponentEvidenceAdded: unique([...(previous.claimImpact.boundedComponentEvidenceAdded || []), 'direct_partial_named_palace_sequence', 'direct_twelve_branch_physical_grid']),
      directSemanticClaimSupportAdded: [],
      claimsAdded: 0,
      claimsPromoted: 0,
      semanticAuthorityCount: 0,
      boundary: 'The v10 manuscript adds two direct component observations from one anonymous scan and one explicitly inferred cross-page relation. It does not establish a single-frame palace-to-slot binding, production ordinal, direction, 1871 lineage, source authority, semantic authority, readiness, or activation.',
    },
    blockerImpact: {
      ...clone(previous.blockerImpact),
      blockersClosed: [],
      blockerStatusChanges: [],
      resolvedSubBoundaries: [
        ...clone(previous.blockerImpact.resolvedSubBoundaries),
        'NLD Korea p6 directly supplies a partial numbered palace sequence and p13 directly supplies a twelve-branch physical grid from the same manuscript; the cross-page join remains inferred and no top-level semantic blocker is closed',
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
      sourceBytes: 'The NLD Korea manuscript PDF and reviewed page renders are referenced through fixed URLs, catalog identity, byte hashes, dimensions, page numbers, and explicit cross-page inference boundaries; materialization performs no network acquisition.',
      network: 'forbidden_during_materialization',
      ocr: 'not used as canonical text; direct visual findings are fixed evidence metadata and OCR/text extraction is locator-only',
      noAutomaticPromotion: true,
    },
    negativeContract: {
      ...clone(previous.negativeContract),
      rejects: unique([
        ...previous.negativeContract.rejects,
        'treating the NLD p6 and p13 observations as a direct single-frame palace-name-to-physical-slot binding',
        'treating the NLD p13 page-top-to-bottom branch sequence as compass direction, clockwise traversal, or production ordinal',
        'treating the anonymous handwritten manuscript as an independent semantic witness or as proof of 游藝錄/Nanbei work identity',
        'promoting the NLD cross-page frontier into source authority, semantic authority, readiness, or activation',
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
        researchFrontierAdmission: 'same_manuscript_cross_page_frontier_only',
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
    predecessorSchema: v9.SCHEMA,
    counts: result.artifact.graphImpact.successor,
    addedSourceId: SOURCE_CNTS_00047996572,
    addedObservationIds: [OBSERVATION_CNTS_P6, OBSERVATION_CNTS_P13],
    addedRelationId: RELATION_CNTS_CROSS_PAGE,
    directNamedPalaceWitnessCount: result.artifact.bindingMatrix.coverage.directNamedPalaceWitnessCount,
    partialDirectNamedPalaceComponentCount: result.artifact.bindingMatrix.coverage.partialDirectNamedPalaceComponentCount,
    directBranchPhysicalGridWitnessCount: result.artifact.bindingMatrix.coverage.directBranchPhysicalGridWitnessCount,
    crossPageComposedBindingFrontierCount: result.artifact.bindingMatrix.coverage.crossPageComposedBindingFrontierCount,
    directSingleWitnessFullBindingCount: result.artifact.bindingMatrix.coverage.directSingleWitnessFullBindingCount,
    productionOrdinalBindingCount: result.artifact.bindingMatrix.coverage.productionOrdinalBindingCount,
    independentPhysicalWitnessesAdmitted: result.artifact.graphImpact.independentPhysicalWitnessesAdmitted,
    blockersClosed: result.artifact.graphImpact.blockersClosed,
    completeByteSha256: result.completeSha256,
  }, null, 2))
}
