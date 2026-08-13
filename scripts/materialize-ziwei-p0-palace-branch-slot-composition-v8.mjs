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
import * as v7 from './materialize-ziwei-p0-palace-branch-slot-composition-v7.mjs'

export const SCHEMA = 'ziwei-p0-palace-branch-slot-composition-v8'
export const VERDICT = 'complete_ziwei_palace_branch_slot_composition_with_figure_only_and_1870_acquisition_lead_derived_not_authoritative'
export const MATERIALIZER_VERSION = '8.0.0'
export const BASIS_HEAD = v7.BASIS_HEAD
export const MATERIALIZER_PATH = 'scripts/materialize-' + SCHEMA + '.mjs'
export const ARTIFACT_DIR = 'artifacts/' + SCHEMA
export const ARTIFACT_PATH = ARTIFACT_DIR + '/complete.json'
export const ROOT = resolve(new URL('..', import.meta.url).pathname)

export const PREDECESSOR_COMPOSITION = v7.ARTIFACT_PATH
export const PREDECESSOR_COMPOSITION_EVIDENCE = v7.ARTIFACT_DIR + '/evidence.json'
export const PROTECTED_ASSET_PATH = v7.PROTECTED_ASSET_PATH
export const DOCUMENTATION_PATH = 'docs/ziwei-p0-palace-branch-slot-composition-v8.md'

export const NLC_JAMISE_CANDIDATE_ID = 'candidate-nlc-jamise-collection-kol200200680-figure-only'
export const NLC_JAMISE_COLLECTION_URL = 'https://www.nl.go.kr/NL/contents/N20103000000.do?schIdSub=CO20211102161426612100&schM=contView'
export const NLC_JAMISE_VIEWER_URL = 'https://viewer.nl.go.kr/main.wviewer?cno=KOL200200680&sysid=homepage'
export const NLC_JAMISE_FIGURE_URL = 'https://rm.nl.go.kr/imgs/images/000026/2021_dc_astro_math_28_i01.jpg'
export const NLC_JAMISE_CONTROL_NO = 'KOL200200680'
export const NLC_JAMISE_FIGURE_SHA256 = 'e56d1cc148c8166cc4c9507ca3cdab616f6c451bedf15db07753b6c43451115'
export const NLC_JAMISE_FIGURE_BYTES = 351470
export const NLC_JAMISE_FIGURE_WIDTH = 491
export const NLC_JAMISE_FIGURE_HEIGHT = 741
export const SHIBA_FEIXING_LEAD_ID = 'lead-shiba-feixing-1870-hanyang-secondary-record-only'
export const SHIBA_FEIXING_LEAD_URL = 'https://dh.aks.ac.kr/sillokwiki/index.php/%EC%9E%90%EB%AF%B8%EC%88%98%28紫微數%29'

export const INPUT_PATHS = [...new Set([
  ...v7.INPUT_PATHS,
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

function jamiseFigureCandidate() {
  return {
    candidateId: NLC_JAMISE_CANDIDATE_ID,
    sourceKind: 'official_collection_figure_only_not_full_scan',
    sourceIdentity: {
      title: '紫微數',
      collectionLabel: '[조선의 천문학] 자미수(紫微數)',
      author: 'unknown',
      publicationDate: 'unknown',
      holding: 'National Library of Korea digital collection',
      controlNo: NLC_JAMISE_CONTROL_NO,
      recordUrl: NLC_JAMISE_COLLECTION_URL,
      headCondition: 'missing_or_damaged_as_reported_by_collection_page',
      independentHistoricalWitness: false,
      fullScanIdentity: 'not_resolved; only one curator figure was acquired',
    },
    catalogObservation: {
      role: 'official_collection_page_metadata_and_curator_description_not_full_original_transcription',
      recordUrl: NLC_JAMISE_COLLECTION_URL,
      observedFields: [
        'Collection label: [조선의 천문학] 자미수(紫微數)',
        'Author and year: unknown',
        'Head: missing or damaged',
        'Sequence includes 木局, 水局, 土局, 起天數, 起地數, 定十二宮, 起例總說, and 星辰吉凶',
        'Figure 1 is presented as a partial image',
      ],
      curatorTextIsNotOriginalPageTranscription: true,
    },
    locators: {
      collectionUrl: NLC_JAMISE_COLLECTION_URL,
      viewerUrl: NLC_JAMISE_VIEWER_URL,
      controlNo: NLC_JAMISE_CONTROL_NO,
      figureUrl: NLC_JAMISE_FIGURE_URL,
      figureLocator: 'official collection page figure 1 / rm.nl.go.kr JPEG',
      figureBytesAcquired: true,
      figureByteSha256: NLC_JAMISE_FIGURE_SHA256,
      figureByteLength: NLC_JAMISE_FIGURE_BYTES,
      figureDimensions: { width: NLC_JAMISE_FIGURE_WIDTH, height: NLC_JAMISE_FIGURE_HEIGHT },
      fullSourceBytesAcquired: false,
      fullScanAccess: 'not_obtained_in_current_external_session',
      viewerProbeStatus: 'viewer_route_returned_404_or_timeout_in_current_session',
      pageImagesLocated: 'single_curator_figure_only',
      imageAvailable: true,
      sourceBytesAcquired: false,
      sourceBytesScope: 'figure_only_not_full_source',
    },
    directVisualReview: true,
    directObservationStatus: 'figure_only_direct_visual_review_no_full_source',
    directReading: [
      'The supplied 491×741 JPEG visibly contains a circular diagram divided by radial lines into sectors.',
      'A central vertically arranged worked-example text block is visibly present.',
      'Outer sectors contain visible glyph labels, but the exact branch tokens are not promoted from this resolution.',
      'No complete named-palace perimeter was visually legible in the supplied figure.',
    ],
    rawVisibleText: [
      {
        text: '[조선의 천문학] 자미수(紫微數)',
        locator: 'official collection page title',
        provenance: 'official curator-page text',
        canonicalOriginalPageTranscription: false,
      },
      {
        text: '定十二宮',
        locator: 'official collection page content sequence',
        provenance: 'official curator-page description',
        canonicalOriginalPageTranscription: false,
      },
      {
        text: '[central figure text not safely transcribed]',
        locator: 'figure 1 JPEG, center block',
        provenance: 'direct visual boundary',
        canonicalOriginalPageTranscription: false,
      },
    ],
    bindingBoundary: {
      branchToken: { status: 'glyphs_visible_but_exact_branch_token_not_promoted', directlyBound: false },
      palaceName: { status: 'not_legible_in_supplied_figure', directlyBound: false },
      physicalSlot: { status: 'circular_sector_geometry_only_no_named_slot_mapping', directlyBound: false },
      ordinalDirection: { status: 'not_visible_or_established', directlyBound: false },
      tianfuAnchor: { status: 'not_observed', directlyBound: false },
      fullFourFieldBinding: false,
    },
    comparisonToExistingGraph: {
      palaceNameToBranchToken: 'not_performed',
      branchTokenToPhysicalSlot: 'not_performed',
      physicalSlotToOrdinal: 'not_performed',
      tianfuRelation: 'not_observed',
      sameSystemAsYouyiOrNanbei: 'not_established',
    },
    decision: 'figure_only_direct_geometry_no_palace_name_no_branch_slot_ordinal_binding_no_graph_admission',
    doesNotEnterGraph: true,
    doesNotEstablish: [
      'complete source identity or full-scan lineage',
      'the exact branch tokens in each sector',
      'palace-name to physical-slot identity',
      'physical slot to ordinal or production direction',
      'a Tianfu anchor or source-rule equivalence with Youyi/Nanbei',
      'independent historical witness or semantic authority',
    ],
  }
}

function figureOnlyObservation() {
  return {
    observationId: 'frontier-obs-nlc-jamise-figure-only-circular-diagram',
    candidateId: NLC_JAMISE_CANDIDATE_ID,
    sourceRole: 'official_collection_figure_only_direct_visual_observation_held_outside_graph',
    locator: {
      collectionUrl: NLC_JAMISE_COLLECTION_URL,
      figureUrl: NLC_JAMISE_FIGURE_URL,
      controlNo: NLC_JAMISE_CONTROL_NO,
      figureByteSha256: NLC_JAMISE_FIGURE_SHA256,
      figureByteLength: NLC_JAMISE_FIGURE_BYTES,
      figureDimensions: { width: NLC_JAMISE_FIGURE_WIDTH, height: NLC_JAMISE_FIGURE_HEIGHT },
    },
    directVisualFindings: [
      'circular diagram geometry with radial sectors is directly visible',
      'central worked-example text block is directly visible',
      'sector glyph labels are directly visible but not safely transcribed as branch tokens',
      'complete palace-name perimeter is not directly legible',
    ],
    rawVisibleText: [
      'Official collection page title: [조선의 천문학] 자미수(紫微數)',
      'Official collection page sequence label: 定十二宮',
      'Figure center: text block present; no full raw transcription promoted',
    ],
    fourFieldBinding: {
      branchToken: 'not_bound',
      palaceName: 'not_bound',
      physicalSlot: 'not_bound',
      ordinalDirection: 'not_bound',
      fullBindingObserved: false,
    },
    graphAdmission: false,
    sourceAdmission: false,
    semanticAuthority: false,
    readinessImpact: 'none; existing readiness remains not_safe_to_start',
  }
}

function shibaFeixingLead() {
  return {
    leadId: SHIBA_FEIXING_LEAD_ID,
    sourceId: 'bibliographic-lead-shiba-feixing-1870-hanyang',
    url: SHIBA_FEIXING_LEAD_URL,
    sourceRole: 'secondary_institutional_bibliographic_acquisition_lead',
    title: '新刻合倂十八飛星策天紫微斗數全集',
    publicationDate: '1870',
    extent: '6卷6冊',
    printing: 'woodblock',
    namedHolding: 'Hanyang University Library',
    institutionalRecordType: 'secondary_AKS_Sillokwiki_entry',
    imageAvailable: false,
    pageImagesLocated: false,
    sourceBytesAcquired: false,
    directPageReview: false,
    result: 'AKS secondary bibliography identifies a 1870 six-volume woodblock record and names Hanyang University Library, but no original page image or downloadable source bytes were located in the current session.',
    doesNotEnterGraph: true,
    doesNotEstablish: [
      'original 1870 page text or diagram',
      'direct source lineage or independent witness',
      'palace-name to physical-slot mapping',
      'production ordinal or semantic authority',
    ],
  }
}

function researchFrontier(previousFrontier) {
  const candidates = [...structuredClone(previousFrontier.candidates), jamiseFigureCandidate()]
  const format = structuredClone(previousFrontier.catalogFormatComparison)
  const comparison = {
    ...structuredClone(previousFrontier.comparison1871To1883),
    figureOnlySourceReviewed: true,
    figureOnlySourceFullScanAcquired: false,
    directFigureToYouyiSlotComparisonPerformed: false,
    directTextComparisonPerformed: false,
    directByteComparisonPerformed: false,
    textualLineageClosed: false,
    independentLineageAdmitted: false,
    status: format.status,
    conclusion: 'The 1871 and 1883 catalog comparison remains catalog-only. The NLC 紫微數 figure adds a direct circular-diagram observation without a readable palace-name perimeter, and the 1870 十八飛星 route remains a secondary acquisition lead; neither supplies direct 1871 page bytes or a four-field binding witness.',
  }
  return {
    schemaVersion: SCHEMA + '-research-frontier-v0',
    researchSessionDate: '2026-08-13',
    status: 'direct_figure_and_1870_acquisition_lead_no_graph_admission',
    admissionBoundary: 'The NLC figure-only observation, the 1870 secondary bibliographic lead, and the earlier catalog routes remain provenance-separated. A visible circular diagram is not a readable palace-name/branch/slot/ordinal map; secondary institutional bibliography is not an original page witness. No frontier item enters the semantic graph or promotes source authority, semantic authority, readiness, or activation.',
    candidates,
    comparison1871To1883: comparison,
    catalogFormatComparison: format,
    frontierOnlyObservations: [
      ...structuredClone(previousFrontier.frontierOnlyObservations || []),
      figureOnlyObservation(),
    ],
    frontierOnlySources: [
      ...structuredClone(previousFrontier.frontierOnlySources || []),
      NLC_JAMISE_CANDIDATE_ID,
    ],
    acquisitionLeads: [
      ...structuredClone(previousFrontier.acquisitionLeads || []),
      shibaFeixingLead(),
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
  const generated = v7.buildBundle(root, options)
  const stored = readJson(root, PREDECESSOR_COMPOSITION)
  const storedEvidence = readJson(root, PREDECESSOR_COMPOSITION_EVIDENCE)
  requireValue(canonicalStableArtifactJson(stored) === canonicalStableArtifactJson(generated.artifact), 'v7_predecessor_complete_drift')
  requireValue(canonicalStableArtifactJson(storedEvidence) === canonicalStableArtifactJson(generated.files['evidence.json']), 'v7_predecessor_evidence_drift')
  requireValue(generated.artifact.schemaVersion === v7.SCHEMA, 'unexpected_v7_schema')
  requireValue(generated.artifact.graphImpact.successor.claimCount === 30, 'unexpected_v7_claim_count')
  requireValue(generated.artifact.graphImpact.successor.sourceCount === 19, 'unexpected_v7_source_count')
  requireValue(generated.artifact.graphImpact.successor.observationCount === 55, 'unexpected_v7_observation_count')
  requireValue(generated.artifact.graphImpact.successor.relationCount === 146, 'unexpected_v7_relation_count')
  requireValue(generated.artifact.graphImpact.successor.blockerCount === 11, 'unexpected_v7_blocker_count')
  requireValue(generated.artifact.researchFrontier.candidates.length === 9, 'unexpected_v7_frontier_candidate_count')
  requireValue(generated.artifact.researchFrontier.acquisitionLeads.length === 8, 'unexpected_v7_frontier_lead_count')
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
  const figure = frontier.frontierOnlyObservations.find(item => item.observationId === 'frontier-obs-nlc-jamise-figure-only-circular-diagram')
  const shiba = frontier.acquisitionLeads.find(item => item.leadId === SHIBA_FEIXING_LEAD_ID)

  const evidence = structuredClone(previous.evidence)
  evidence.schemaVersion = SCHEMA + '-evidence-v0'
  evidence.authorityBoundary = 'The v8 frontier adds one NLC 紫微數 figure-only direct observation and one 1870 十八飛星 secondary acquisition lead. The figure confirms circular sector geometry but not a readable palace-name/branch/slot/ordinal map; the secondary lead has no original page bytes. Graph counts, named-palace corroboration, Tianfu relation comparison, source authority, semantic authority, readiness, and activation remain unchanged.'
  evidence.researchFrontier = frontier
  evidence.frontierFigureOnlySources = [NLC_JAMISE_CANDIDATE_ID]
  evidence.frontierFigureOnlyObservation = figure
  evidence.frontierSecondaryAcquisitionLead = shiba
  evidence.reportedNonObservations = [...new Set([
    ...evidence.reportedNonObservations,
    'The NLC 紫微數 source was reviewed as one 491×741 figure JPEG only; full source bytes and a full-scan viewer payload were not acquired.',
    'The NLC figure shows circular sector geometry and a central text block, but no safely legible complete palace-name perimeter, exact branch-token table, physical slot labels, ordinal, or Tianfu anchor.',
    'The 1870 十八飛星/Hanyang route is a secondary institutional bibliographic lead without original page images or source bytes; it is not an independent witness.',
    'The new figure-only and 1870 lead evidence does not establish identity with Youyi Lu, Nanbei, Nanyangtang, or any existing graph source.',
  ])]

  const bindingMatrix = structuredClone(previous.bindingMatrix)
  bindingMatrix.schemaVersion = SCHEMA + '-binding-matrix-v0'
  bindingMatrix.researchFrontierBoundary = {
    reviewedCandidateCount: frontier.candidates.length,
    admittedCandidateCount: 0,
    directSingleWitnessFullBindingCount: 0,
    productionOrdinalBindingCount: 0,
    semanticAuthorityCount: 0,
    figureOnlyCandidateCount: 1,
    secondaryAcquisitionLeadCount: 1,
    status: 'held_outside_graph_figure_only_and_secondary_lead',
  }
  bindingMatrix.figureOnlyBindingRows = [
    { field: 'branchToken', observed: 'partial glyph-like labels only; exact token not promoted', bindingStatus: 'not_bound' },
    { field: 'palaceName', observed: 'not legible in supplied figure', bindingStatus: 'not_bound' },
    { field: 'physicalSlot', observed: 'circular sector geometry without named slot mapping', bindingStatus: 'not_bound' },
    { field: 'ordinalDirection', observed: 'not visible or established', bindingStatus: 'not_bound' },
  ]

  const lineageAssessment = structuredClone(previous.lineageAssessment)
  lineageAssessment.schemaVersion = SCHEMA + '-lineage-v0'
  lineageAssessment.researchFrontier = frontier
  lineageAssessment.figureOnlyLineageBoundary = {
    candidateId: NLC_JAMISE_CANDIDATE_ID,
    sourceIdentityStatus: 'official collection record; author/year unknown and head reported missing_or_damaged',
    figureBytes: { acquired: true, sha256: NLC_JAMISE_FIGURE_SHA256, byteLength: NLC_JAMISE_FIGURE_BYTES },
    fullSourceBytesAcquired: false,
    textualLineageClosed: false,
    independentWitnessAdmitted: false,
    semanticAuthority: 'not_established',
    physicalSlotAndOrdinal: 'not_observed',
  }
  lineageAssessment.secondary1870AcquisitionLead = {
    leadId: SHIBA_FEIXING_LEAD_ID,
    originalPageBytesAcquired: false,
    directLineageAssessed: false,
    independentWitnessAdmitted: false,
    semanticAuthority: 'not_established',
  }

  const fieldKitImpact = structuredClone(previous.fieldKitImpact)
  fieldKitImpact.schemaVersion = SCHEMA + '-field-kit-v0'
  fieldKitImpact.researchFrontier = {
    status: frontier.status,
    reviewedCandidateCount: frontier.candidates.length,
    admittedCandidateCount: 0,
    acquisitionLeadsRemainOpen: frontier.acquisitionLeads.length,
    figureOnlyCandidateCount: 1,
    secondaryAcquisitionLeadCount: 1,
    evidenceRefs: [ARTIFACT_DIR + '/evidence.json'],
  }
  fieldKitImpact.heldEvidenceUpdate = 'v8 records a direct NLC 紫微數 figure-only observation: a circular sector diagram and central text block are visible, but palace names, exact branch tokens, physical slots, ordinal/direction, and Tianfu anchor are not safely bound. A 1870 十八飛星/Hanyang route is recorded as a secondary acquisition lead without original page bytes. Existing named-palace, Tianfu, branch-slot composition, 1871/1883 catalog, source-lineage, and readiness boundaries remain open.'
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
      purpose: 'additive figure-only direct observation and 1870 acquisition-lead research for palace, branch, physical-slot, ordinal, and lineage binding; no graph admission or production promotion',
      researchFrontierExpanded: true,
      heldOutResearchCandidateCount: frontier.candidates.length,
      researchCandidatesAdmitted: 0,
      figureOnlyCandidateCount: 1,
      secondaryAcquisitionLeadCount: 1,
      physicalWitnessCandidatesAdded: previous.scope.physicalWitnessCandidatesAdded,
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
      boundary: 'The v8 figure-only and secondary acquisition frontier adds no graph claims or semantic support. Visible sector geometry and bibliographic leads do not establish palace-name to physical-slot identity, production ordinal, source lineage, semantic authority, readiness, or activation.',
    },
    blockerImpact: {
      ...structuredClone(previous.blockerImpact),
      researchFrontierReviewed: true,
      researchFrontierTopLevelClosures: [],
      resolvedSubBoundaries: [
        ...previous.blockerImpact.resolvedSubBoundaries,
        'NLC official 紫微數 figure-only review confirms circular sector geometry but not palace names, exact branch tokens, physical slots, ordinal/direction, or Tianfu anchor',
        '1870 十八飛星/Hanyang remains a secondary acquisition lead without original page bytes or independent-witness admission',
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
      sourceBytes: 'The figure-only JPEG and secondary bibliographic lead are referenced through fixed locators, hashes, dimensions, and explicit full-scan/access boundaries; materialization performs no network acquisition.',
      network: 'forbidden_during_materialization',
      ocr: 'not used as canonical text; direct visual findings and curator/catalog fields are fixed evidence metadata',
      noAutomaticPromotion: true,
    },
    negativeContract: {
      ...structuredClone(previous.negativeContract),
      rejects: [...new Set([
        ...previous.negativeContract.rejects,
        'treating a visible circular figure as a complete palace-name, branch-token, physical-slot, ordinal, or Tianfu witness',
        'treating curator-page text such as 定十二宮 as a direct original-page transcription or semantic authority',
        'treating the NLC figure-only JPEG as a full source scan or independent historical witness',
        'treating the 1870 十八飛星/Hanyang secondary bibliography as original page bytes or an independent witness',
        'promoting the v8 figure-only and secondary acquisition frontier into graph sources, observations, relations, claims, readiness, or activation',
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
    predecessorSchema: v7.SCHEMA,
    counts: result.artifact.graphImpact.successor,
    heldOutResearchCandidateCount: result.artifact.scope.heldOutResearchCandidateCount,
    researchCandidatesAdmitted: result.artifact.scope.researchCandidatesAdmitted,
    frontierOnlyObservationCount: result.artifact.researchFrontier.frontierOnlyObservations.length,
    acquisitionLeadCount: result.artifact.researchFrontier.acquisitionLeads.length,
    figureOnlyFullBindingObserved: result.artifact.researchFrontier.frontierOnlyObservations.at(-1).fourFieldBinding.fullBindingObserved,
    directSingleWitnessFullBindingCount: result.artifact.bindingMatrix.coverage.directSingleWitnessFullBindingCount,
    productionOrdinalBindingCount: result.artifact.bindingMatrix.coverage.productionOrdinalBindingCount,
    independentPhysicalWitnessesAdmitted: result.artifact.graphImpact.independentPhysicalWitnessesAdmitted,
    blockersClosed: result.artifact.graphImpact.blockersClosed,
    completeByteSha256: result.completeSha256,
  }, null, 2))
}
