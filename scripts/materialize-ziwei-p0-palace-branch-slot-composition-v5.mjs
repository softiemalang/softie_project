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
import * as v4 from './materialize-ziwei-p0-palace-branch-slot-composition-v4.mjs'

export const SCHEMA = 'ziwei-p0-palace-branch-slot-composition-v5'
export const VERDICT = 'complete_ziwei_palace_branch_slot_composition_with_nara_chart_frontier_and_1871_catalog_route_derived_not_authoritative'
export const MATERIALIZER_VERSION = '5.0.0'
export const BASIS_HEAD = v4.BASIS_HEAD
export const MATERIALIZER_PATH = 'scripts/materialize-' + SCHEMA + '.mjs'
export const ARTIFACT_DIR = 'artifacts/' + SCHEMA
export const ARTIFACT_PATH = ARTIFACT_DIR + '/complete.json'
export const ROOT = resolve(new URL('..', import.meta.url).pathname)

export const PREDECESSOR_COMPOSITION = 'artifacts/ziwei-p0-palace-branch-slot-composition-v4/complete.json'
export const PREDECESSOR_COMPOSITION_EVIDENCE = 'artifacts/ziwei-p0-palace-branch-slot-composition-v4/evidence.json'
export const PROTECTED_ASSET_PATH = v4.PROTECTED_ASSET_PATH
export const DOCUMENTATION_PATH = 'docs/ziwei-p0-palace-branch-slot-composition-v5.md'

export const NARA_RECORD_URL = 'https://www.digital.archives.go.jp/das/meta/F1000000000000101426.html'
export const NARA_SOURCE_IDS = ['src-nara-4468520', 'src-nara-4469314']
export const NARA_MANIFESTS = {
  '4468520': {
    label: '新鋟希夷陳先生紫微斗数全書１',
    reference: '子０６０－０００１-0001',
    manifestUrl: 'https://www.digital.archives.go.jp/api/iiif/4468520/manifest.json',
    itemUrl: 'https://www.digital.archives.go.jp/item/4468520',
    manifestByteSha256: '732991ca47aefc323e2095a93202fd301421ad8b92994c63caae2a94acf75af',
    manifestBytes: 117876,
    canvasCount: 129,
  },
  '4469314': {
    label: '新鋟希夷陳先生紫微斗数全書２',
    reference: '子０６０－０００１-0002',
    manifestUrl: 'https://www.digital.archives.go.jp/api/iiif/4469314/manifest.json',
    itemUrl: 'https://www.digital.archives.go.jp/item/4469314',
    manifestByteSha256: '3f167e1280527e1c672a72d7ef060c299ce9dffad1f362ddba04575da3df1560',
    manifestBytes: 125132,
    canvasCount: 137,
  },
}

const NARA_V1_IMAGE_ROWS = [
  [84, 838573, '366f656fd2a51520746543e1cc96d77a8a2e5dc920281684d4543926166de613'],
  [85, 811543, 'e1dc1926a62cc534dee0055cb7f5da4bf6dab5cc55084c7591078cc0ac8dabb9'],
  [86, 849984, 'a44ac810cbf5c2a6d4053983677621e2574c0540e0323fdbd6c27ead3303f884'],
  [87, 842468, '6e8c584cb01dce720c3ef862a23a127af11d987e14ef0df40d841492576d00a9'],
  [88, 825635, '01aa70087388237313da09a6038e923e676acda36cfe1e58b3026e817a8eb619'],
  [89, 859799, '34e5178b021178cccf3ef61a6513652405db45ed989b2e1393361ba306d101e6'],
  [90, 863098, '8094e540ce8caa08c04dbad2ef686e41c27c1db04617631dfed21d7ba32f4e30'],
  [91, 882520, '5cebb77840c828a75bf43cdc780847465d86f75b31ba03baa1727cff40b81d18'],
  [92, 875659, '28189642c4c155dd80e5f859aa4cfe89a85964517d7520675dbce2542d6e3973'],
]

const NARA_V2_IMAGE_ROWS = [
  [64, 832936, '901dcc10e4fb8863703e0da2c85f883b6e930fd438c05ba1f22a48e44989770a'],
  [65, 847895, '2303a045af3c9f6c80650625f1801971e14682397fef0abb1d1044131e93d1d4'],
  [66, 854398, '435ba853a0b745b21d24e41625ed33a501cb3fdb523646caf3aec15ed0c5f328'],
  [67, 871865, '145fd716108ce99a76e1a31509738d46de74b9ca6c9c77a631b0194705c4e287'],
  [68, 857292, '3657754941c9d31679745d916f418241d0c5a527c84772f2a3c79592ae08f8a4'],
  [69, 859712, '892c9c3fcddee893f2d9354e643192f0f903fb70db726a71ef4aea30b3d0b766'],
  [70, 859644, '793040ac274581e41c6313c90e568a3b0de280939537fabb03bd6cdcd52f293d'],
  [71, 861523, 'f8351e91ecd78f2291435145fba89e9626022f478e8a0aee28efbcfa46a2cf33'],
  [72, 864054, '91b47bc25949067a196e9ac55a16a505cf2fbe7f7c78a39524e5896ebda78d6a'],
  [73, 855751, 'd8da540f12e891b179a1be2129dd5cef84602629a7915eb9e3164a53282d113f'],
  [74, 848356, '4e4a59ee811c880ee9f480c4bf32e2f9d9ec5661234cb4c71b9c34631695ee7b'],
  [75, 864238, 'bbf4823b2e4da81db468bed7e45787308d05bd293b8eef9d15a5da41ca9a2e0b'],
  [76, 883934, 'ef71d8f2d619b20bed8f4142c346f75997c71f55d1089fd733d13655da706553'],
  [77, 875876, '091ee758c92d4ddb240ba84b570c0fb22b631c8bc5d97b56b87e69d34f40b781'],
  [78, 860879, '75589369d8f1648933c33ba00c11285b065ee6bbde6a284d6ff962f4a6fc72514'],
  [79, 875661, '6a2b287fded657f4e958f644076d1bd0c4c9ea327da0f31a7d613d6c3ad39a77'],
  [80, 843934, '352cb081830eed051dadcf3b3ae884286572c41a5ffa13dc8fd855ed3660557a'],
]

export const NARA_IMAGE_ROWS = { '4468520': NARA_V1_IMAGE_ROWS, '4469314': NARA_V2_IMAGE_ROWS }
export const RITSUMEIKAN_SOURCE_ID = 'candidate-youyi-lu-ritsumeikan-bn08364312-1871-catalog-only'
export const RITSUMEIKAN_CINII_URL = 'https://ci.nii.ac.jp/ncid/BN08364312'
export const NDL_MANUSCRIPT_RECORD_URL = 'https://ndlsearch.ndl.go.jp/books/R100000039-I2606209'
export const NDL_MANUSCRIPT_PID_URL = 'https://dl.ndl.go.jp/pid/2606209'
export const NDL_MANUSCRIPT_MANIFEST_URL = 'https://dl.ndl.go.jp/api/iiif/2606209/manifest.json'
export const NDL_COMPILED_RECORD_URL = 'https://ndlsearch.ndl.go.jp/books/R100000002-I000007637157'
export const NDL_COMPILED_PID_URL = 'https://dl.ndl.go.jp/pid/2610509'
export const NDL_COMPILED_MANIFEST_URL = 'https://dl.ndl.go.jp/api/iiif/2610509/manifest.json'

export const INPUT_PATHS = [...new Set([
  ...v4.INPUT_PATHS,
  PREDECESSOR_COMPOSITION,
  PREDECESSOR_COMPOSITION_EVIDENCE,
  DOCUMENTATION_PATH,
  MATERIALIZER_PATH,
])]

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const sortValue = value => Array.isArray(value)
  ? value.map(sortValue)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sortValue(value[key])]))
    : value
export const canonicalJson = value => JSON.stringify(sortValue(value), null, 2) + '\n'
const git = (root, args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8' }).trim()
const readJson = (root, path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'))
const fileSha256 = (root, path) => sha256(readFileSync(resolve(root, path)))
const requireValue = (condition, message) => { if (!condition) throw new Error(message) }

function repository(root) {
  return {
    branch: git(root, ['branch', '--show-current']),
    currentHead: git(root, ['rev-parse', 'HEAD']),
    originMainHead: git(root, ['rev-parse', 'origin/main']),
  }
}

function naraImages(itemId, canvasBase, imagePrefix, rows) {
  return rows.map(([leaf, bytes, byteSha256]) => {
    const leafToken = String(leaf).padStart(4, '0')
    const canvasLabel = 'C102812' + String(canvasBase + (leaf - rows[0][0]) * 100)
    return {
      leaf,
      canvasLabel,
      canvasId: `https://www.digital.archives.go.jp/api/iiif/${itemId}/canvas/${canvasLabel}`,
      imageUrl: `https://www.digital.archives.go.jp/api/content/item/da12/${canvasLabel}/iiif/${imagePrefix}${leafToken}.jp2/full/max/0/native.jpg`,
      retrievedVariant: 'full/max/0/native.jpg',
      bytes,
      byteSha256,
      byteScope: 'retrieved JPEG response bytes for the fixed IIIF max image URL',
    }
  })
}

function naraCandidate() {
  const images = [
    ...naraImages('4468520', 186700, 'M2019050811103249305_', NARA_V1_IMAGE_ROWS),
    ...naraImages('4469314', 197600, 'M2019050811103949308_', NARA_V2_IMAGE_ROWS),
  ]
  return {
    candidateId: 'candidate-nara-4468520-4469314-chart-example-frontier',
    sourceKind: 'direct_nara_iiif_scan_chart_example_frontier_same_record_pair',
    sourceIdentity: {
      recordUrl: NARA_RECORD_URL,
      attribution: 'National Archives of JAPAN',
      itemIds: NARA_SOURCE_IDS,
      sameRecordEditionPair: true,
      independentHistoricalWitness: false,
      manifests: NARA_MANIFESTS,
    },
    locators: {
      recordUrl: NARA_RECORD_URL,
      itemUrls: Object.values(NARA_MANIFESTS).map(item => item.itemUrl),
      manifestUrls: Object.values(NARA_MANIFESTS).map(item => item.manifestUrl),
      reviewedLeafRanges: [
        { itemId: '4468520', leaves: [84, 92], role: '安天府圖 and branch/rule table run' },
        { itemId: '4469314', leaves: [64, 80], role: 'worked natal chart example run' },
      ],
      reviewedImages: images,
      originalRepositoryBytesStoredInCheckout: false,
    },
    directVisualReview: true,
    directObservationStatus: 'direct_visual_original_scan_image_review',
    directReading: [
      'Volume 1 leaves 84-86 show explanatory chart or rule surfaces; leaves 87-88 visibly include 安天府圖 and branch/star or four-transformation tables; leaves 89-92 continue rule and worked-example surfaces.',
      'Volume 2 leaves 64-80 contain repeated worked natal-chart examples with sex/bureau labels, star entries, and branch tokens, but no complete twelve-palace-name perimeter with physical coordinates and a production ordinal.',
      'The reviewed leaves join chart-example vocabulary and branch or ordinal-like table surfaces in one same-record scan pair, but they do not visibly bind palace name, branch token, physical slot, and ordinal in one semantic frame.',
    ],
    negativeBoundary: {
      chartExamplesObserved: true,
      branchAndStarTokensObserved: true,
      fullPalaceNamePerimeterObserved: false,
      physicalSlotCoordinateObserved: false,
      productionOrdinalObserved: false,
      singleSourceFourFieldBinding: false,
      semanticAuthority: 'not_established',
      independentWitness: false,
    },
    decision: 'held_outside_graph_same_record_chart_example_partial_no_four_field_binding',
    doesNotEnterGraph: true,
    doesNotEstablish: [
      'single_source_four_field_binding',
      'palace_name_to_physical_chart_slot',
      'production ordinal or production direction',
      'independent historical witness',
      'semantic authority',
    ],
  }
}

function ritsumeikanCandidate() {
  return {
    candidateId: RITSUMEIKAN_SOURCE_ID,
    sourceKind: 'alternate_1871_catalog_holding_direct_pages_unavailable',
    sourceIdentity: {
      title: '袖中書, 2巻 ; 游藝録, 6巻',
      author: '(清)兪樾 [撰]',
      publicationDate: '同治10(1871)',
      holding: '立命館大学 図書館',
      identifier: '6111433313',
      binding: '和装 袋綴 帙入り',
      ciniiNcid: 'BN08364312',
      same1871BibliographicObjectAs: 'candidate-youyi-lu-cinii-bd19656670-1871-catalog-only',
      independentHistoricalWitness: false,
    },
    locators: {
      ciniiUrl: RITSUMEIKAN_CINII_URL,
      ciniiJsonUrl: RITSUMEIKAN_CINII_URL + '.json',
      opacOpenUrl: 'http://runners.ritsumei.ac.jp/opac/opac_openurl/?ncid=BN08364312',
      detailBibId: 'TT40358003',
      detailAccessResult: '403_in_this_session',
      pageImagesLocated: false,
      sourceBytesAcquired: false,
    },
    directVisualReview: false,
    directObservationStatus: 'catalog_record_review_only',
    directReading: [],
    comparisonTo1883: {
      status: 'not_performed_catalog_only_1871',
      directTextComparisonPerformed: false,
      directByteComparisonPerformed: false,
      textualLineageClosed: false,
    },
    decision: 'catalog_identity_confirmed_alternate_holding_no_direct_witness',
    doesNotEnterGraph: true,
    doesNotEstablish: [
      '1871 page-level text or colophon',
      '1871 to 1883 textual or block lineage',
      'independent historical witness',
      'palace_name_to_physical_chart_slot',
      'production ordinal',
    ],
  }
}

function ndlLeads(previousFrontier) {
  const prior = structuredClone(previousFrontier.acquisitionLeads || [])
  return [
    ...prior,
    {
      leadId: 'lead-ndl-youyi-lu-manuscript-2606209',
      recordUrl: NDL_MANUSCRIPT_RECORD_URL,
      pidUrl: NDL_MANUSCRIPT_PID_URL,
      attemptedIiifManifestUrl: NDL_MANUSCRIPT_MANIFEST_URL,
      catalogIdentity: '春在堂全書稿本; contents identify 游藝録6卷 including the 紫微斗數篇 section',
      accessBoundary: 'NDL catalog indicates online viewing is restricted to NDL premises or permitted transmission routes.',
      attemptedManifestResult: '404_json_checkResult_NG',
      pageBytesAcquired: false,
      result: 'Specific manuscript PID route located, but no public page bytes or usable IIIF manifest were acquired in this session.',
      doesNotEnterGraph: true,
    },
    {
      leadId: 'lead-ndl-youyi-lu-compiled-2610509',
      recordUrl: NDL_COMPILED_RECORD_URL,
      pidUrl: NDL_COMPILED_PID_URL,
      attemptedIiifManifestUrl: NDL_COMPILED_MANIFEST_URL,
      catalogIdentity: '春在堂全書 第73-145册; contents identify 游藝録6卷',
      accessBoundary: 'NDL catalog indicates online viewing is restricted to NDL premises or permitted transmission routes.',
      attemptedManifestResult: '404_json_checkResult_NG',
      pageBytesAcquired: false,
      result: 'Compiled-volume PID route located, but no public page bytes or usable IIIF manifest were acquired in this session.',
      doesNotEnterGraph: true,
    },
  ]
}

function researchFrontier(previousFrontier) {
  const candidates = [
    ...structuredClone(previousFrontier.candidates),
    naraCandidate(),
    ritsumeikanCandidate(),
  ]
  const comparison = structuredClone(previousFrontier.comparison1871To1883)
  comparison.alternateCatalogSources = [RITSUMEIKAN_SOURCE_ID]
  comparison.ndlCatalogLeads = [NDL_MANUSCRIPT_RECORD_URL, NDL_COMPILED_RECORD_URL]
  comparison.directTextComparisonPerformed = false
  comparison.directByteComparisonPerformed = false
  comparison.independentLineageAdmitted = false
  comparison.status = 'open'
  comparison.conclusion = 'The exact 1871 record and an alternate Ritsumeikan holding are identity-useful catalog surfaces; NDL manuscript and compiled-volume routes remain access-limited and no 1871 page bytes were acquired. No direct textual, colophon, byte, or block comparison with the 1883 scans was performed.'
  return {
    schemaVersion: SCHEMA + '-research-frontier-v0',
    researchSessionDate: '2026-08-12',
    status: 'nara_chart_example_and_1871_catalog_frontier_no_new_graph_admission',
    admissionBoundary: 'The reviewed leads remain provenance-separated. Direct original-image observation, catalog identity, access status, source lineage, semantic authority, physical slot, production ordinal, readiness, and activation are not interchangeable gates.',
    candidates,
    comparison1871To1883: comparison,
    acquisitionLeads: ndlLeads(previousFrontier),
    graphImpact: {
      claimsAdded: 0,
      sourcesAdded: [],
      observationsAdded: [],
      relationsAdded: [],
      blockersClosed: [],
      independentPhysicalWitnessesAdmitted: 0,
    },
    readinessImpact: {
      readiness: 'not_safe_to_start',
      grounding: 'blocked',
      activation: 'experimental_only',
      rotation06: 'representation_only',
    },
  }
}

function predecessorInput(root, options = {}) {
  const generated = v4.buildBundle(root, options)
  const stored = readJson(root, PREDECESSOR_COMPOSITION)
  const storedEvidence = readJson(root, PREDECESSOR_COMPOSITION_EVIDENCE)
  requireValue(canonicalStableArtifactJson(stored) === canonicalStableArtifactJson(generated.artifact), 'v4_predecessor_complete_drift')
  requireValue(canonicalStableArtifactJson(storedEvidence) === canonicalStableArtifactJson(generated.files['evidence.json']), 'v4_predecessor_evidence_drift')
  requireValue(generated.artifact.schemaVersion === v4.SCHEMA, 'unexpected_v4_schema')
  requireValue(generated.artifact.graphImpact.successor.claimCount === 30, 'unexpected_v4_claim_count')
  requireValue(generated.artifact.graphImpact.successor.sourceCount === 19, 'unexpected_v4_source_count')
  requireValue(generated.artifact.graphImpact.successor.observationCount === 55, 'unexpected_v4_observation_count')
  requireValue(generated.artifact.graphImpact.successor.relationCount === 146, 'unexpected_v4_relation_count')
  requireValue(generated.artifact.graphImpact.successor.blockerCount === 11, 'unexpected_v4_blocker_count')
  return { generated, stored, storedEvidence }
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
  const frontier = researchFrontier(previous.researchFrontier)
  const evidence = structuredClone(previous.evidence)
  evidence.schemaVersion = SCHEMA + '-evidence-v0'
  evidence.authorityBoundary = 'The v5 frontier records direct NARA chart-example image review and expanded 1871 catalog/access routes, but every new lead remains held outside the semantic graph; v4 named-palace corroboration and all physical-slot, ordinal, lineage, authority, readiness, and activation boundaries are unchanged.'
  evidence.researchFrontier = frontier
  evidence.frontierDirectObservation = {
    sourceIds: NARA_SOURCE_IDS,
    role: 'direct_original_scan_image_review_held_outside_graph',
    reviewedLeafRanges: frontier.candidates.find(item => item.candidateId === 'candidate-nara-4468520-4469314-chart-example-frontier').locators.reviewedLeafRanges,
    fullBindingObserved: false,
    physicalSlotObserved: false,
    productionOrdinalObserved: false,
    independentWitness: false,
  }
  evidence.reportedNonObservations = [...new Set([
    ...evidence.reportedNonObservations,
    'The NARA volume-1 leaves 84-92 and volume-2 leaves 64-80 add direct chart-example and branch/star image observations, but no single leaf or joined same-record frame visibly binds palace name, branch token, physical slot, and production ordinal.',
    'The NARA pair is one official record and an edition pair; it is not an independent historical witness for semantic authority.',
    'The Ritsumeikan BN08364312 holding confirms an alternate 1871 catalog identity, but the OPAC detail was access-blocked in this session and no page image or source bytes were acquired.',
    'The NDL manuscript PID 2606209 and compiled-volume PID 2610509 are catalog/access leads; their exact attempted IIIF routes returned 404 checkResult NG and no page bytes entered the graph.',
    'No direct 1871-to-1883 text, colophon, byte, or block comparison was performed.',
  ])]

  const bindingMatrix = structuredClone(previous.bindingMatrix)
  bindingMatrix.schemaVersion = SCHEMA + '-binding-matrix-v0'
  bindingMatrix.researchFrontierBoundary = {
    reviewedCandidateCount: frontier.candidates.length,
    admittedCandidateCount: 0,
    directSingleWitnessFullBindingCount: 0,
    productionOrdinalBindingCount: 0,
    semanticAuthorityCount: 0,
    status: 'held_outside_graph',
  }

  const lineageAssessment = structuredClone(previous.lineageAssessment)
  lineageAssessment.schemaVersion = SCHEMA + '-lineage-v0'
  lineageAssessment.researchFrontier = frontier
  lineageAssessment.earlierEdition1871 = {
    ...lineageAssessment.earlierEdition1871,
    catalogIdentityReconfirmed: true,
    alternateCatalogHoldingReviewed: true,
    pageImagesLocated: false,
    directTextComparisonPerformed: false,
    byteComparisonPerformed: false,
    textualLineageClosed: false,
    comparisonStatus: 'catalog_identity_and_access_route_only_1871_vs_1883_not_performed',
  }

  const fieldKitImpact = structuredClone(previous.fieldKitImpact)
  fieldKitImpact.schemaVersion = SCHEMA + '-field-kit-v0'
  fieldKitImpact.researchFrontier = {
    status: frontier.status,
    reviewedCandidateCount: frontier.candidates.length,
    admittedCandidateCount: 0,
    acquisitionLeadsRemainOpen: frontier.acquisitionLeads.length,
    evidenceRefs: [ARTIFACT_DIR + '/evidence.json'],
  }
  fieldKitImpact.heldEvidenceUpdate = 'NARA chart-example leaves add fixed direct-image observations of branch, star, rule, and worked-chart surfaces; Ritsumeikan adds an alternate 1871 catalog holding; NDL adds specific manuscript and compiled-volume access leads. None supplies a new four-field witness, physical slot, production ordinal, or direct 1871 lineage comparison.'
  fieldKitImpact.semanticTargetStillOpen = true
  fieldKitImpact.sourceIdentityTargetStillActionRequired = true

  const protectedAsset = structuredClone(previous.preservation.protectedAsset)
  requireValue(protectedAsset.exists, 'protected_source_derived_asset_missing')
  requireValue(protectedAsset.byteSha256 === fileSha256(root, PROTECTED_ASSET_PATH), 'protected_source_derived_asset_changed')

  const blockerReassessment = previous.blockerReassessment.map(item => ({
    ...item,
    statusBefore: item.statusAfter,
    statusAfter: item.statusAfter,
    statusChanged: false,
  }))
  const completeBase = {
    ...structuredClone(previous),
    schemaVersion: SCHEMA,
    verdictToken: VERDICT,
    observedHead: repo.currentHead,
    originMainHead: repo.originMainHead,
    branch: repo.branch,
    scope: {
      ...previous.scope,
      purpose: 'additive direct-image and catalog-route frontier research for palace, branch, physical-slot, ordinal, and lineage binding; no graph admission or production promotion',
      researchFrontierExpanded: true,
      heldOutResearchCandidateCount: frontier.candidates.length,
      researchCandidatesAdmitted: 0,
      externalDirectScanReviewPerformed: true,
      historical1871ScanObtained: false,
      directSingleWitnessFullBindingEstablished: false,
      independentWitnessesAdmitted: 0,
    },
    predecessorChain: [
      ...previous.predecessorChain,
      { path: PREDECESSOR_COMPOSITION, schemaVersion: previous.schemaVersion, byteSha256: fileSha256(root, PREDECESSOR_COMPOSITION) },
      { path: PREDECESSOR_COMPOSITION_EVIDENCE, schemaVersion: predecessor.storedEvidence.schemaVersion, byteSha256: fileSha256(root, PREDECESSOR_COMPOSITION_EVIDENCE) },
    ],
    researchFrontier: frontier,
    evidence,
    bindingMatrix,
    lineageAssessment,
    fieldKitImpact,
    blockerReassessment,
    graphImpact: {
      ...structuredClone(previous.graphImpact),
      researchFrontier: frontier.graphImpact,
    },
    claimImpact: {
      ...structuredClone(previous.claimImpact),
      researchFrontierClaimsAdded: 0,
      researchFrontierSemanticSupportAdded: 0,
      boundary: 'The v5 frontier adds direct image and catalog/access observations only; no graph claims or semantic support are added, and v4 named-palace corroboration, branch-token join, physical slot, production ordinal, source lineage, semantic authority, readiness, and activation boundaries remain unchanged.',
    },
    blockerImpact: {
      ...structuredClone(previous.blockerImpact),
      researchFrontierReviewed: true,
      researchFrontierTopLevelClosures: [],
      resolvedSubBoundaries: [
        ...previous.blockerImpact.resolvedSubBoundaries,
        'NARA original scan leaves 84-92 and 64-80 were directly reviewed and confirm chart-example surfaces without a complete four-field semantic frame',
        'Ritsumeikan alternate 1871 and NDL manuscript/compiled routes remain catalog or access evidence without page bytes or semantic graph admission',
      ],
      resolvedSubBoundaryIsNotTopLevelClosure: true,
    },
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
      sourceBytes: 'NARA image responses and external catalog/access routes are referenced by fixed byte hashes, stable locators, and explicit same-record/derivative/access status; materialization performs no network acquisition.',
      network: 'forbidden_during_materialization',
      ocr: 'not used as canonical text; direct visual readings are fixed evidence metadata',
      noAutomaticPromotion: true,
    },
    negativeContract: {
      ...structuredClone(previous.negativeContract),
      rejects: [...new Set([
        ...previous.negativeContract.rejects,
        'treating NARA worked chart examples or branch/star tables as a complete palace-name, physical-slot, and production-ordinal witness',
        'treating the NARA same-record volume pair as an independent historical witness',
        'treating the Ritsumeikan alternate 1871 catalog holding as page-level text or byte evidence',
        'treating NDL catalog or failed IIIF routes as acquired manuscript or compiled-volume scan bytes',
        'promoting the v5 held-out frontier into graph sources, observations, relations, claims, or readiness',
      ])],
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
      researchFrontier: artifact.researchFrontier,
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
    predecessorSchema: v4.SCHEMA,
    counts: result.artifact.graphImpact.successor,
    heldOutResearchCandidateCount: result.artifact.scope.heldOutResearchCandidateCount,
    researchCandidatesAdmitted: result.artifact.scope.researchCandidatesAdmitted,
    directSingleWitnessFullBindingCount: result.artifact.bindingMatrix.coverage.directSingleWitnessFullBindingCount,
    productionOrdinalBindingCount: result.artifact.bindingMatrix.coverage.productionOrdinalBindingCount,
    independentPhysicalWitnessesAdmitted: result.artifact.graphImpact.independentPhysicalWitnessesAdmitted,
    blockersClosed: result.artifact.graphImpact.blockersClosed,
    completeByteSha256: result.completeSha256,
  }, null, 2))
}
