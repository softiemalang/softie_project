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
import * as v6 from './materialize-ziwei-p0-palace-branch-slot-composition-v6.mjs'

export const SCHEMA = 'ziwei-p0-palace-branch-slot-composition-v7'
export const VERDICT = 'complete_ziwei_palace_branch_slot_composition_with_catalog_format_comparison_derived_not_authoritative'
export const MATERIALIZER_VERSION = '7.0.0'
export const BASIS_HEAD = v6.BASIS_HEAD
export const MATERIALIZER_PATH = 'scripts/materialize-' + SCHEMA + '.mjs'
export const ARTIFACT_DIR = 'artifacts/' + SCHEMA
export const ARTIFACT_PATH = ARTIFACT_DIR + '/complete.json'
export const ROOT = resolve(new URL('..', import.meta.url).pathname)

export const PREDECESSOR_COMPOSITION = v6.ARTIFACT_PATH
export const PREDECESSOR_COMPOSITION_EVIDENCE = v6.ARTIFACT_DIR + '/evidence.json'
export const PROTECTED_ASSET_PATH = v6.PROTECTED_ASSET_PATH
export const DOCUMENTATION_PATH = 'docs/ziwei-p0-palace-branch-slot-composition-v7.md'

export const CATALOG_1902_SOURCE_ID = 'candidate-youyi-lu-cinii-ba85312898-1902-catalog-only'
export const CATALOG_1897_SOURCE_ID = 'candidate-youyi-lu-cinii-ba90448039-1897-catalog-only'
export const CATALOG_1882_SOURCE_ID = 'candidate-chunzaitang-ndl-1882-catalog-only'
export const CATALOG_1902_URL = 'https://ci.nii.ac.jp/ncid/BA85312898'
export const CATALOG_1902_OPAC_URL = 'https://catalog.lib.kyushu-u.ac.jp/opac_openurl/?ncid=BA85312898'
export const CATALOG_1902_HANDLE_URL = 'https://hdl.handle.net/2324/1001354396'
export const CATALOG_1897_URL = 'https://ci.nii.ac.jp/ncid/BA90448039'
export const CATALOG_1882_URL = 'https://ndlsearch.ndl.go.jp/books/R100000002-I000007637258'
export const CATALOG_1871_URL = 'https://ci.nii.ac.jp/ncid/BD19656670'
export const CATALOG_1883_URL = 'https://ci.nii.ac.jp/ncid/BB19945538'

export const INPUT_PATHS = [...new Set([
  ...v6.INPUT_PATHS,
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

function catalog1902Candidate() {
  return {
    candidateId: CATALOG_1902_SOURCE_ID,
    sourceKind: 'institutional_catalog_record_no_page_image',
    sourceIdentity: {
      title: '游藝録 6巻',
      author: '(清)兪樾撰',
      publicationDate: '[光緒28年 (1902)]',
      holding: 'Kyushu University Central Library',
      ncid: 'BA85312898',
      parentBibliography: '春在堂全書',
      extent: '1冊',
      size: '24.2×15.3cm',
      catalogNotes: [
        '和漢古書につき記述対象資料毎に書誌データ作成',
        '刻本',
        '春在堂全書154[書根による]',
        '左右双辺有界,半葉10行21字,内匡廓(15.7×11.1cm),白口単黒魚尾',
        '線装本,帙入り',
        '印記: 靜修廬藏書記',
      ],
      catalogRecordOnly: true,
      independentHistoricalWitness: false,
    },
    catalogObservation: {
      role: 'direct_catalog_metadata_observation_not_page_semantics',
      recordUrl: CATALOG_1902_URL,
      opacUrl: CATALOG_1902_OPAC_URL,
      handleUrl: CATALOG_1902_HANDLE_URL,
      observedFields: [
        'Title: 游藝録 6巻',
        'Author: (清)兪樾撰',
        'Publication: [光緒28年 (1902)]',
        'NCID: BA85312898',
        'Holding: 九州大学 中央図書館',
        'Extent: 1冊',
        'Size: 24.2×15.3cm',
        'OPAC: catalog record with semi-rare shelf location; no page-image link located',
      ],
    },
    locators: {
      catalogUrl: CATALOG_1902_URL,
      opacUrl: CATALOG_1902_OPAC_URL,
      handleUrl: CATALOG_1902_HANDLE_URL,
      pageImagesLocated: false,
      sourceBytesAcquired: false,
      imageAvailable: false,
    },
    directVisualReview: false,
    directObservationStatus: 'catalog_record_review_only_no_page_image',
    directReading: [],
    comparisonTo1883: {
      status: 'catalog_metadata_only_not_page_text_or_block_comparison',
      directTextComparisonPerformed: false,
      directByteComparisonPerformed: false,
      textualLineageClosed: false,
    },
    decision: 'catalog_record_only_no_page_bytes_no_graph_admission',
    doesNotEnterGraph: true,
    doesNotEstablish: [
      '1902 page-level text or colophon',
      '1871 to 1883 textual or block lineage',
      'independent historical witness',
      'palace_name_to_physical_chart_slot',
      'production ordinal',
    ],
  }
}

function catalog1897Candidate() {
  return {
    candidateId: CATALOG_1897_SOURCE_ID,
    sourceKind: 'institutional_catalog_record_no_page_image',
    sourceIdentity: {
      title: '金剛般若波羅蜜經 2卷 ; 太上感應篇纉義 2卷 ; 游藝録 6卷 ; 小蓬莱謠 ; 袖中書',
      author: '(清)兪樾 [撰]',
      publicationDate: '光緒23 [1897] 刊',
      holding: 'Bukkyo University Library',
      ncid: 'BA90448039',
      parentBibliography: '春在堂全書',
      extent: '1冊',
      size: '20cm',
      catalogNotes: [
        '個別書誌作成(漢籍)',
        '四針眼線装',
      ],
      catalogRecordOnly: true,
      independentHistoricalWitness: false,
    },
    catalogObservation: {
      role: 'direct_catalog_metadata_observation_not_page_semantics',
      recordUrl: CATALOG_1897_URL,
      observedFields: [
        'Title includes 游藝録 6卷',
        'Author: (清)兪樾 [撰]',
        'Publication: 光緒23 [1897] 刊',
        'NCID: BA90448039',
        'Holding: 佛教大学 附属図書館',
        'Extent: 1冊',
        'Size: 20cm',
        'Note: 四針眼線装',
        'No page-image or downloadable scan route located',
      ],
    },
    locators: {
      catalogUrl: CATALOG_1897_URL,
      pageImagesLocated: false,
      sourceBytesAcquired: false,
      imageAvailable: false,
    },
    directVisualReview: false,
    directObservationStatus: 'catalog_record_review_only_no_page_image',
    directReading: [],
    comparisonTo1883: {
      status: 'catalog_metadata_only_not_page_text_or_block_comparison',
      directTextComparisonPerformed: false,
      directByteComparisonPerformed: false,
      textualLineageClosed: false,
    },
    decision: 'catalog_record_only_no_page_bytes_no_graph_admission',
    doesNotEnterGraph: true,
    doesNotEstablish: [
      '1897 page-level text or colophon',
      '1871 to 1883 textual or block lineage',
      'independent historical witness',
      'palace_name_to_physical_chart_slot',
      'production ordinal',
    ],
  }
}

function catalog1882Candidate() {
  return {
    candidateId: CATALOG_1882_SOURCE_ID,
    sourceKind: 'national_catalog_record_no_pid_or_page_image',
    sourceIdentity: {
      title: '春在堂全書',
      author: '清兪〓撰',
      publicationDate: '光緒8重定刊 (1882)',
      recordId: '000007637258',
      recordUrl: CATALOG_1882_URL,
      extent: '64册 (合32册)',
      catalogNotes: [
        '封面書名: 徳清兪蔭甫所箸書',
        '封面裏に「同治十年秋八月曾國藩署檢」とあり',
      ],
      catalogRecordOnly: true,
      independentHistoricalWitness: false,
    },
    catalogObservation: {
      role: 'direct_catalog_metadata_observation_not_page_semantics',
      recordUrl: CATALOG_1882_URL,
      observedFields: [
        'Title: 春在堂全書',
        'Publication: 光緒8重定刊',
        'Extent: 64册 (合32册)',
        'Cover note: 徳清兪蔭甫所箸書',
        'Colophon note: 同治十年秋八月曾國藩署檢',
        'No PID, IIIF manifest, or page-image route exposed on this record',
      ],
    },
    locators: {
      catalogUrl: CATALOG_1882_URL,
      pidRouteLocated: false,
      pageImagesLocated: false,
      sourceBytesAcquired: false,
      imageAvailable: false,
    },
    directVisualReview: false,
    directObservationStatus: 'catalog_record_review_only_no_pid_or_page_image',
    directReading: [],
    comparisonTo1883: {
      status: 'catalog_colophon_locator_only_no_page_or_block_comparison',
      directTextComparisonPerformed: false,
      directByteComparisonPerformed: false,
      textualLineageClosed: false,
    },
    decision: 'catalog_record_only_no_pid_no_page_bytes_no_graph_admission',
    doesNotEnterGraph: true,
    doesNotEstablish: [
      '1882 page-level colophon visual confirmation',
      '1871 to 1883 textual or block lineage',
      'independent historical witness',
      'palace_name_to_physical_chart_slot',
      'production ordinal',
    ],
  }
}

function catalogFormatComparison() {
  return {
    status: 'catalog_metadata_partial_comparison_text_byte_block_lineage_open',
    directObservationStatus: 'catalog_metadata_comparison_only',
    source1871: {
      url: CATALOG_1871_URL,
      title: '游藝録 6卷',
      publicationDate: '同治10 [1871]',
      extent: '1冊',
      size: '23.6x15.0cm',
      notes: [
        '左右双辺有界10行21字注文双行',
        '内匡廓: 16.0×10.9cm',
        '白口単黒魚尾',
      ],
    },
    source1883: {
      url: CATALOG_1883_URL,
      title: '游藝録 6卷',
      publicationDate: '[光緒9 (1883)]',
      extent: '13, 27, 18, 6, 18, 6丁',
      size: '23.4×15.1cm',
      notes: [
        '左右双辺有界10行21字注文双行',
        '内匡郭: 15.9×11.1cm',
        '単魚尾',
        '和装, 帙入',
      ],
    },
    catalogLevelMatches: [
      'Both records describe 左右双辺有界10行21字注文双行.',
      'Both records describe a 游藝録 6卷/6巻 witness attributed to 清兪樾.',
    ],
    catalogLevelDifferences: [
      'The recorded outer size differs: 1871 23.6x15.0cm versus 1883 23.4×15.1cm.',
      'The recorded inner frame differs: 1871 16.0×10.9cm versus 1883 15.9×11.1cm.',
      'The 1871 record says 白口単黒魚尾; the 1883 record says 単魚尾 and does not repeat 白口.',
      'The 1871 record is one bound volume; the 1883 record reports 13, 27, 18, 6, 18, 6丁 for the six parts.',
    ],
    directTextComparisonPerformed: false,
    directColophonComparisonPerformed: false,
    directByteComparisonPerformed: false,
    blockLineageClosed: false,
    independentWitnessAdmitted: false,
    inferenceBoundary: 'Shared catalog-described format is a bounded bibliographic comparison only. It does not establish identical blocks, textual continuity, same physical chart, source authority, or semantic authority.',
  }
}

function researchFrontier(previousFrontier) {
  const addedCandidates = [catalog1902Candidate(), catalog1897Candidate(), catalog1882Candidate()]
  const candidates = [...structuredClone(previousFrontier.candidates), ...addedCandidates]
  const format = catalogFormatComparison()
  const comparison = {
    ...structuredClone(previousFrontier.comparison1871To1883),
    catalogFormatComparisonPerformed: true,
    catalogFormatComparison: format,
    directTextComparisonPerformed: false,
    directByteComparisonPerformed: false,
    textualLineageClosed: false,
    independentLineageAdmitted: false,
    status: 'catalog_metadata_partial_comparison_text_byte_block_lineage_open',
    conclusion: 'The 1871 and 1883 catalog records share the recorded 左右双辺有界10行21字注文双行 format, but differ in reported dimensions, inner-frame measurements, fish-tail wording, and extent metadata. This is a catalog-level comparison only; no direct 1871 page, colophon image, source byte, block identity, or independent witness was obtained.',
  }
  return {
    schemaVersion: SCHEMA + '-research-frontier-v0',
    researchSessionDate: '2026-08-13',
    status: 'catalog_format_comparison_no_new_graph_admission',
    admissionBoundary: 'The reviewed catalog routes remain provenance-separated. Catalog identity and format metadata do not substitute for direct original-image observation, source lineage, semantic authority, physical slot, production ordinal, readiness, or activation.',
    candidates,
    comparison1871To1883: comparison,
    catalogFormatComparison: format,
    acquisitionLeads: [
      ...structuredClone(previousFrontier.acquisitionLeads || []),
      {
        leadId: 'lead-cinii-youyi-lu-1902-kyushu-catalog-only',
        sourceId: CATALOG_1902_SOURCE_ID,
        url: CATALOG_1902_URL,
        opacUrl: CATALOG_1902_OPAC_URL,
        handleUrl: CATALOG_1902_HANDLE_URL,
        imageAvailable: false,
        pageImagesLocated: false,
        sourceBytesAcquired: false,
        result: 'Kyushu University catalog and CiNii identify a 1902 游藝録 6巻 copy with a semi-rare shelf location; no public page-image or downloadable scan route was located.',
        doesNotEnterGraph: true,
      },
      {
        leadId: 'lead-cinii-youyi-lu-1897-bukkyo-catalog-only',
        sourceId: CATALOG_1897_SOURCE_ID,
        url: CATALOG_1897_URL,
        imageAvailable: false,
        pageImagesLocated: false,
        sourceBytesAcquired: false,
        result: 'CiNii identifies a 1897 composed 春在堂全書 volume containing 游藝録 6卷 at Bukkyo University; no public page-image or downloadable scan route was located.',
        doesNotEnterGraph: true,
      },
      {
        leadId: 'lead-ndl-chunzaitang-1882-catalog-no-pid',
        sourceId: CATALOG_1882_SOURCE_ID,
        url: CATALOG_1882_URL,
        imageAvailable: false,
        pageImagesLocated: false,
        sourceBytesAcquired: false,
        pidRouteLocated: false,
        result: 'NDL catalog identifies an 1882 光緒8重定刊 春在堂全書 record and a 同治十年秋八月曾國藩署檢 catalog note, but exposes no PID, IIIF manifest, or page-image route for this record.',
        doesNotEnterGraph: true,
      },
    ],
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
  const generated = v6.buildBundle(root, options)
  const stored = readJson(root, PREDECESSOR_COMPOSITION)
  const storedEvidence = readJson(root, PREDECESSOR_COMPOSITION_EVIDENCE)
  requireValue(canonicalStableArtifactJson(stored) === canonicalStableArtifactJson(generated.artifact), 'v6_predecessor_complete_drift')
  requireValue(canonicalStableArtifactJson(storedEvidence) === canonicalStableArtifactJson(generated.files['evidence.json']), 'v6_predecessor_evidence_drift')
  requireValue(generated.artifact.schemaVersion === v6.SCHEMA, 'unexpected_v6_schema')
  requireValue(generated.artifact.graphImpact.successor.claimCount === 30, 'unexpected_v6_claim_count')
  requireValue(generated.artifact.graphImpact.successor.sourceCount === 19, 'unexpected_v6_source_count')
  requireValue(generated.artifact.graphImpact.successor.observationCount === 55, 'unexpected_v6_observation_count')
  requireValue(generated.artifact.graphImpact.successor.relationCount === 146, 'unexpected_v6_relation_count')
  requireValue(generated.artifact.graphImpact.successor.blockerCount === 11, 'unexpected_v6_blocker_count')
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
  evidence.authorityBoundary = 'The v7 frontier adds a bounded catalog-format comparison and three additional catalog routes. No catalog field is admitted as a page-level semantic witness; graph counts, physical-slot binding, production ordinal, source authority, semantic authority, readiness, and activation remain unchanged.'
  evidence.researchFrontier = frontier
  evidence.frontierCatalogOnlySources = [CATALOG_1902_SOURCE_ID, CATALOG_1897_SOURCE_ID, CATALOG_1882_SOURCE_ID]
  evidence.reportedNonObservations = [...new Set([
    ...evidence.reportedNonObservations,
    'The 1871 and 1883 CiNii records permit a catalog-level format comparison, but not a page-text, colophon-image, byte, or block-lineage comparison.',
    'The 1902 Kyushu/CiNii, 1897 Bukkyo/CiNii, and 1882 NDL routes remain catalog-only and provided no page bytes.',
    'NDL metadata may expose a nominal IIIF field for a record while the tested PID manifest still returns 404 checkResult NG; metadata exposure is not page-byte acquisition.',
  ])]

  const bindingMatrix = structuredClone(previous.bindingMatrix)
  bindingMatrix.schemaVersion = SCHEMA + '-binding-matrix-v0'
  bindingMatrix.researchFrontierBoundary = {
    reviewedCandidateCount: frontier.candidates.length,
    admittedCandidateCount: 0,
    directSingleWitnessFullBindingCount: 0,
    productionOrdinalBindingCount: 0,
    semanticAuthorityCount: 0,
    status: 'held_outside_graph_catalog_format_only',
  }

  const lineageAssessment = structuredClone(previous.lineageAssessment)
  lineageAssessment.schemaVersion = SCHEMA + '-lineage-v0'
  lineageAssessment.researchFrontier = frontier
  lineageAssessment.earlierEdition1871 = {
    ...lineageAssessment.earlierEdition1871,
    catalogFormatComparisonPerformed: true,
    catalogFormatComparisonStatus: 'partial_format_match_and_difference_catalog_only',
    catalogFormatComparisonDirectText: false,
    catalogFormatComparisonDirectBytes: false,
    catalogFormatComparisonBlockLineageClosed: false,
    directTextComparisonPerformed: false,
    byteComparisonPerformed: false,
    textualLineageClosed: false,
    comparisonStatus: 'catalog_format_metadata_compared_text_byte_block_lineage_open',
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
  fieldKitImpact.heldEvidenceUpdate = 'v7 records a catalog-level 1871-to-1883 format comparison and three additional no-page-image catalog routes. The shared 10-row/21-character double-ruled description is not block identity; differing dimensions, fish-tail wording, and extent metadata preserve the open textual, byte, block, semantic-authority, physical-slot, and production-ordinal gates.'
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
      purpose: 'additive catalog-format comparison and acquisition-frontier research for palace, branch, physical-slot, ordinal, and lineage binding; no graph admission or production promotion',
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
      boundary: 'The v7 catalog-format frontier adds no graph claims or semantic support. Catalog format agreement/differences do not establish palace-name to physical-slot identity, production ordinal, source lineage, semantic authority, readiness, or activation.',
    },
    blockerImpact: {
      ...structuredClone(previous.blockerImpact),
      researchFrontierReviewed: true,
      researchFrontierTopLevelClosures: [],
      resolvedSubBoundaries: [
        ...previous.blockerImpact.resolvedSubBoundaries,
        '1871/1883 catalog format fields were compared without treating bibliographic agreement as block identity or semantic authority',
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
      sourceBytes: 'External catalog/access metadata and direct scan observations are referenced through stable locators, fixed hashes, and explicit catalog/no-image/same-record/derivative/access status; materialization performs no network acquisition.',
      network: 'forbidden_during_materialization',
      ocr: 'not used as canonical text; direct visual readings and catalog fields are fixed evidence metadata',
      noAutomaticPromotion: true,
    },
    negativeContract: {
      ...structuredClone(previous.negativeContract),
      rejects: [...new Set([
        ...previous.negativeContract.rejects,
        'treating shared catalog format fields as direct page-text, block, physical-slot, or semantic-authority evidence',
        'treating the 1902, 1897, or 1882 catalog routes as page bytes or independent historical witnesses',
        'promoting the v7 catalog-format frontier into graph sources, observations, relations, claims, readiness, or activation',
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
    predecessorSchema: v6.SCHEMA,
    counts: result.artifact.graphImpact.successor,
    heldOutResearchCandidateCount: result.artifact.scope.heldOutResearchCandidateCount,
    researchCandidatesAdmitted: result.artifact.scope.researchCandidatesAdmitted,
    catalogFormatComparisonStatus: result.artifact.researchFrontier.catalogFormatComparison.status,
    directSingleWitnessFullBindingCount: result.artifact.bindingMatrix.coverage.directSingleWitnessFullBindingCount,
    productionOrdinalBindingCount: result.artifact.bindingMatrix.coverage.productionOrdinalBindingCount,
    independentPhysicalWitnessesAdmitted: result.artifact.graphImpact.independentPhysicalWitnessesAdmitted,
    blockersClosed: result.artifact.graphImpact.blockersClosed,
    completeByteSha256: result.completeSha256,
  }, null, 2))
}
