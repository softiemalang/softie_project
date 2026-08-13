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
import * as v3 from './materialize-ziwei-p0-palace-branch-slot-composition-v3.mjs'

export const SCHEMA = 'ziwei-p0-palace-branch-slot-composition-v4'
export const VERDICT = 'complete_ziwei_palace_branch_slot_composition_with_expanded_negative_frontier_derived_not_authoritative'
export const MATERIALIZER_VERSION = '4.0.0'
export const BASIS_HEAD = v3.BASIS_HEAD
export const MATERIALIZER_PATH = 'scripts/materialize-' + SCHEMA + '.mjs'
export const ARTIFACT_DIR = 'artifacts/' + SCHEMA
export const ARTIFACT_PATH = ARTIFACT_DIR + '/complete.json'
export const ROOT = resolve(new URL('..', import.meta.url).pathname)

export const PREDECESSOR_COMPOSITION = 'artifacts/ziwei-p0-palace-branch-slot-composition-v3/complete.json'
export const PREDECESSOR_COMPOSITION_EVIDENCE = 'artifacts/ziwei-p0-palace-branch-slot-composition-v3/evidence.json'
export const PROTECTED_ASSET_PATH = v3.PROTECTED_ASSET_PATH

export const HARVARD_SOURCE_ID = 'candidate-sancai-fa-mi-harvard-drs-52822721-v9-adjacent-star-ming'
export const HARVARD_PDF_SHA256 = '56cdd76a95ffb2bd4e51fea12f79b4c737bb9926f8be022324dff18f0425a22a'
export const GOOGLE_SOURCE_ID = 'candidate-ziwei-jielan-googlebooks-2016-facsimile-preview-derivative'
export const GOOGLE_PREVIEW_IMAGE_SHA256 = {
  PT16: '1a3b87967de36eda4059551a858b3c42607e25f97a3d2e5abeee72839d537700',
  PT27: 'e372baccaca21cc1666e12057aa7a6af6a990903e0c91b10850c0a006b4ae1d6',
  PT32: '12282b6561d54e2673f41f116763d84e4c57713fab5c830107fadc6c1619f76c',
  PT33: '15ee0c12fe2198ce98dec774a9915e65fcf7e55327f4344924a98b86b31bef93',
}
export const CATALOG_1871_SOURCE_ID = 'candidate-youyi-lu-cinii-bd19656670-1871-catalog-only'
export const CATALOG_1871_URL = 'https://ci.nii.ac.jp/ncid/BD19656670'
export const KOBE_OPAC_URL = 'https://op.lib.kobe-u.ac.jp/opac/opac_link/bibid/2002371593'
export const NDL_RECORD_URL = 'https://ndlsearch.ndl.go.jp/books/R100000002-I000007637157'
export const NDL_PID_URL = 'https://dl.ndl.go.jp/pid/2610509'
export const NDL_IIIF_MANIFEST_URL = 'https://dl.ndl.go.jp/api/iiif/2610509/manifest.json'

export const INPUT_PATHS = [...new Set([
  ...v3.INPUT_PATHS,
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
const requireValue = (condition, message) => { if (!condition) throw new Error(message) }

function repository(root) {
  return {
    branch: git(root, ['branch', '--show-current']),
    currentHead: git(root, ['rev-parse', 'HEAD']),
    originMainHead: git(root, ['rev-parse', 'origin/main']),
  }
}

function harvardCandidate() {
  return {
    candidateId: HARVARD_SOURCE_ID,
    sourceKind: 'direct_harvard_scan_adjacent_star_ming_work_not_ziwei_authority',
    sourceIdentity: {
      title: '三才發秘 天部二卷, 地部三卷, 人部四卷',
      author: '陳雯',
      catalogDescription: '[China: s.n., 1697?]',
      holdingCredit: 'Harvard-Yenching Library / Harvard Digital Collections',
      sourcePdfPages: 55,
      sourcePdfBytes: 45558383,
      sourcePdfSha256: HARVARD_PDF_SHA256,
      sourcePdfKind: 'Wikimedia Commons PDF derivative of Harvard IIIF scan',
    },
    locators: {
      commonsUrl: 'https://commons.wikimedia.org/wiki/File:Harvard_drs_52822721_%E4%B8%89%E6%89%8D%E7%99%BC%E7%A7%98%E5%A4%A9%E9%83%A8%E4%BA%8C%E5%8D%B7_v.9.pdf',
      directPdfUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Harvard_drs_52822721_%E4%B8%89%E6%89%8D%E7%99%BC%E7%A7%98%E5%A4%A9%E9%83%A8%E4%BA%8C%E5%8D%B7_v.9.pdf',
      iiifManifestUrl: 'https://iiif.lib.harvard.edu/manifests/view/drs:52822721',
      reviewedScanPages: [15, 16, 20, 24],
      renderedFileSha256ByPage: {
        15: '29a3e29e6302cc3a0cf6e9d57edd19cf6bf8ec589b75fa5d72cf031dcb36ae57',
        16: 'd5db63eaaf51b312602175360309e3d24030717d15c0091ce22ee3d4d714286f',
        20: 'e7bbc09f5f323851d683459d9120719a7380da7b31f022a6224ac1b436679d39',
        24: '70f145f15002bceda85c10d44e93648e6130fc03277e79ac13c2fc79ba3265f6',
      },
    },
    directVisualReview: true,
    directObservationStatus: 'direct_visual_historical_scan_review',
    directReading: [
      'The reviewed scan surfaces include chart-like 格之圖 grids, branch/star marks, and related star-ming or 七政 material.',
      'The reviewed pages do not visibly supply a complete Ziwei palace-name perimeter joined to branch tokens, physical chart slots, and a production ordinal.',
      'This is a related star-ming work in a different textual framework; its diagrams cannot be silently treated as a Ziwei semantic witness.',
    ],
    decision: 'held_outside_graph_adjacent_work_no_ziwei_four_field_binding',
    doesNotEnterGraph: true,
    doesNotEstablish: [
      '俞樾游藝錄 source identity',
      'Ziwei palace semantic authority',
      'shared cross-framework coordinate frame',
      'production ordinal or direction',
      'single_source_four_field_binding',
    ],
  }
}

function googleCandidate() {
  return {
    candidateId: GOOGLE_SOURCE_ID,
    sourceKind: 'publisher_facsimile_preview_derivative_not_original_scan_bytes',
    sourceIdentity: {
      title: '紫微斗數捷覽：明刊孤本原彩色本附點校本（二冊不分售）',
      googleBooksVolumeId: 'rZRcCwAAQBAJ',
      publicationYear: 2016,
      previewPagesClaimed: 462,
      isPublicDomain: false,
      publisherClaimedEdition: '明萬曆九年金陵書坊王氏洛川刊本',
      publisherEditionClaimStatus: 'publisher_description_not_independently_verified',
    },
    locators: {
      stableVolumeUrl: 'https://books.google.com/books?id=rZRcCwAAQBAJ',
      publisherPageUrl: 'https://play.google.com/store/books/details/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E6%8D%B7%E8%A6%BD_%E6%98%8E%E5%88%8A%E5%AD%A4%E6%9C%AC_%E5%8E%9F_%E5%BD%A9%E8%89%B2%E6%9C%AC_%E9%99%84_%E9%BB%9E%E6%A0%A1%E6%9C%AC_%E4%BA%8C%E5%86%8A%E4%B8%8D%E5%88%86%E5%94%AE?gl=US&hl=en_IE&id=rZRcCwAAQBAJ',
      previewPageIds: ['PT16', 'PT27', 'PT32', 'PT33'],
      previewImageWidth: 1280,
      previewImageSha256ByPageId: GOOGLE_PREVIEW_IMAGE_SHA256,
    },
    directVisualReview: true,
    directObservationStatus: 'direct_visual_signed_preview_image_review',
    directReading: [
      'The reviewed preview pages visibly contain old-page tables or grids with branch and star tokens inside the publisher preview frame.',
      'No reviewed preview page visibly binds all palace names, branch perimeter, physical slot, ordinal, start point, and direction on one source surface.',
      'The page images are derivative signed previews; they do not establish the original scan bytes, exact leaf lineage, or independent edition identity.',
    ],
    decision: 'held_outside_graph_derivative_preview_no_independent_source_identity',
    doesNotEnterGraph: true,
    doesNotEstablish: [
      'original scan byte identity',
      'independent edition lineage',
      'production ordinal or direction',
      'single_source_four_field_binding',
    ],
  }
}

function catalog1871Candidate() {
  return {
    candidateId: CATALOG_1871_SOURCE_ID,
    sourceKind: 'catalog_identity_confirmed_direct_pages_unavailable',
    sourceIdentity: {
      title: '游藝録 6卷',
      author: '(清)兪樾 [撰]',
      publicationDate: '同治10 [1871]',
      binding: 'one bound volume',
      catalogNotes: [
        '版心の書名: 藝',
        '封面に「外書三/游藝録/徳清兪氏書廿二」とあり',
        '封面裏に「同治辛未冬十月江清驥著檢」とあり',
        '左右双辺有界10行21字注文双行, 内匡廓: 16.0×10.9cm, 白口単黒魚尾',
        '印記: 「山野氏蔵書章」',
      ],
      holding: 'Kobe University Library Humanities Science Library',
      holdingCount: 1,
    },
    locators: {
      ciniiUrl: CATALOG_1871_URL,
      kobeOpacUrl: KOBE_OPAC_URL,
      pageImagesLocated: false,
      sourceBytesAcquired: false,
    },
    directVisualReview: false,
    directObservationStatus: 'catalog_record_review_only',
    directReading: [],
    comparisonTo1883: {
      status: 'not_performed_catalog_only_1871',
      sources1883: [v3.SOURCE_YOUYI, v3.SOURCE_NLC],
      directTextComparisonPerformed: false,
      byteComparisonPerformed: false,
      textualLineageClosed: false,
    },
    decision: 'catalog_identity_confirmed_acquisition_target_no_direct_witness',
    doesNotEnterGraph: true,
    doesNotEstablish: [
      '1871 page-level text',
      '1871 colophon visual confirmation',
      '1871 to 1883 textual or block lineage',
      'palace_name_to_physical_chart_slot',
      'production ordinal',
    ],
  }
}

function researchFrontier() {
  const candidates = [harvardCandidate(), googleCandidate(), catalog1871Candidate()]
  return {
    schemaVersion: SCHEMA + '-research-frontier-v0',
    researchSessionDate: '2026-08-12',
    status: 'expanded_negative_frontier_no_new_graph_admission',
    admissionBoundary: 'The reviewed leads remain provenance-separated. Direct visual review, catalog identity, publisher claims, source lineage, semantic authority, physical slot, production ordinal, readiness, and activation are not interchangeable gates.',
    candidates,
    comparison1871To1883: {
      status: 'open',
      catalogSource1871: CATALOG_1871_SOURCE_ID,
      directSources1883: [v3.SOURCE_YOUYI, v3.SOURCE_NLC],
      conclusion: 'The 1871 record is identity-useful but page-inaccessible in this research session; therefore no direct textual, colophon, byte, or block comparison with the 1883 scans was performed.',
      directTextComparisonPerformed: false,
      directByteComparisonPerformed: false,
      independentLineageAdmitted: false,
    },
    acquisitionLeads: [
      {
        leadId: 'lead-kobe-1871-public-record-only',
        sourceId: CATALOG_1871_SOURCE_ID,
        url: KOBE_OPAC_URL,
        result: 'Kobe record and viewing instruction located; no public page-image, IIIF, or downloadable scan route located.',
        doesNotEnterGraph: true,
      },
      {
        leadId: 'lead-ndl-chunzaitang-descendant-route',
        recordUrl: NDL_RECORD_URL,
        pidUrl: NDL_PID_URL,
        attemptedIiifManifestUrl: NDL_IIIF_MANIFEST_URL,
        result: 'Later 春在堂全書 catalog and PID route located; attempted manifest returned no usable manifest in this session, so no descendant scan bytes were admitted.',
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
  const generated = v3.buildBundle(root, options)
  const stored = readJson(root, PREDECESSOR_COMPOSITION)
  const storedEvidence = readJson(root, PREDECESSOR_COMPOSITION_EVIDENCE)
  requireValue(canonicalStableArtifactJson(stored) === canonicalStableArtifactJson(generated.artifact), 'v3_predecessor_complete_drift')
  requireValue(canonicalStableArtifactJson(storedEvidence) === canonicalStableArtifactJson(generated.files['evidence.json']), 'v3_predecessor_evidence_drift')
  requireValue(generated.artifact.schemaVersion === v3.SCHEMA, 'unexpected_v3_schema')
  requireValue(generated.artifact.graphImpact.successor.claimCount === 30, 'unexpected_v3_claim_count')
  requireValue(generated.artifact.graphImpact.successor.sourceCount === 19, 'unexpected_v3_source_count')
  requireValue(generated.artifact.graphImpact.successor.observationCount === 55, 'unexpected_v3_observation_count')
  requireValue(generated.artifact.graphImpact.successor.relationCount === 146, 'unexpected_v3_relation_count')
  requireValue(generated.artifact.graphImpact.successor.blockerCount === 11, 'unexpected_v3_blocker_count')
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
  const frontier = researchFrontier()
  const evidence = structuredClone(previous.evidence)
  evidence.schemaVersion = SCHEMA + '-evidence-v0'
  evidence.authorityBoundary = 'The v4 research frontier expands direct visual and catalog review, but every new lead remains held outside the semantic graph; v3 direct named-palace corroboration and all physical-slot, ordinal, lineage, authority, readiness, and activation boundaries are unchanged.'
  evidence.researchFrontier = frontier
  evidence.reportedNonObservations = [...new Set([
    ...evidence.reportedNonObservations,
    'The Harvard 三才發秘 pages are a related star-ming or 七政 work, not an admitted 俞樾游藝錄 or Ziwei semantic witness.',
    'The Google Books 紫微斗數捷覽 pages are signed derivative preview images; the publisher-claimed Ming edition and original scan lineage were not independently verified.',
    'The exact 1871 游藝錄 catalog identity was rechecked, but no public page image or source bytes were located and no direct 1871-to-1883 comparison was performed.',
    'The NDL/Kobe acquisition routes remained catalog or landing-page routes in this session; no new scan bytes entered the graph.',
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
    pageImagesLocated: false,
    directTextComparisonPerformed: false,
    byteComparisonPerformed: false,
    textualLineageClosed: false,
    comparisonStatus: 'catalog_identity_only_1871_vs_1883_not_performed',
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
  fieldKitImpact.heldEvidenceUpdate = 'Harvard adjacent-work, Google derivative-preview, exact 1871 catalog, and NDL/Kobe route research expanded the negative frontier without supplying a new four-field witness; the physical slot, production ordinal, and direct 1871 lineage targets remain action_required.'
  fieldKitImpact.semanticTargetStillOpen = true
  fieldKitImpact.sourceIdentityTargetStillActionRequired = true

  const protectedAsset = structuredClone(previous.preservation.protectedAsset)
  requireValue(protectedAsset.exists, 'protected_source_derived_asset_missing')
  requireValue(protectedAsset.byteSha256 === fileSha256(root, v3.PROTECTED_ASSET_PATH), 'protected_source_derived_asset_changed')

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
      purpose: 'additive negative-frontier research for palace, branch, physical-slot, ordinal, and lineage binding; no graph admission or production promotion',
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
      boundary: 'The expanded frontier adds no graph claims or semantic support; v3 named-palace corroboration, branch-token join, physical slot, production ordinal, source lineage, semantic authority, readiness, and activation boundaries remain unchanged.',
    },
    blockerImpact: {
      ...structuredClone(previous.blockerImpact),
      researchFrontierReviewed: true,
      researchFrontierTopLevelClosures: [],
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
      sourceBytes: 'External scans and preview images are referenced by fixed byte hashes, stable locators, and explicit derivative/identity status; materialization performs no network acquisition.',
      network: 'forbidden_during_materialization',
      ocr: 'not used as canonical text; direct visual readings are fixed evidence metadata',
      noAutomaticPromotion: true,
    },
    negativeContract: {
      ...structuredClone(previous.negativeContract),
      rejects: [
        ...previous.negativeContract.rejects,
        'admitting a related star-ming or 七政 work as a Ziwei palace semantic witness',
        'treating publisher-claimed edition metadata or signed preview images as independently verified original scan lineage',
        'treating the exact 1871 catalog record as a direct page or textual comparison with the 1883 scans',
        'treating NDL/Kobe acquisition routes without page bytes as source graph evidence',
        'promoting held-out research frontier candidates into graph sources, observations, relations, or claims',
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
    predecessorSchema: v3.SCHEMA,
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
