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
import * as v5 from './materialize-ziwei-p0-palace-branch-slot-composition-v5.mjs'

export const SCHEMA = 'ziwei-p0-palace-branch-slot-composition-v6'
export const VERDICT = 'complete_ziwei_palace_branch_slot_composition_with_catalog_frontier_exhaustion_derived_not_authoritative'
export const MATERIALIZER_VERSION = '6.0.0'
export const BASIS_HEAD = v5.BASIS_HEAD
export const MATERIALIZER_PATH = 'scripts/materialize-' + SCHEMA + '.mjs'
export const ARTIFACT_DIR = 'artifacts/' + SCHEMA
export const ARTIFACT_PATH = ARTIFACT_DIR + '/complete.json'
export const ROOT = resolve(new URL('..', import.meta.url).pathname)

export const PREDECESSOR_COMPOSITION = 'artifacts/ziwei-p0-palace-branch-slot-composition-v5/complete.json'
export const PREDECESSOR_COMPOSITION_EVIDENCE = 'artifacts/ziwei-p0-palace-branch-slot-composition-v5/evidence.json'
export const PROTECTED_ASSET_PATH = v5.PROTECTED_ASSET_PATH
export const DOCUMENTATION_PATH = 'docs/ziwei-p0-palace-branch-slot-composition-v6.md'

export const NAGOYA_SOURCE_ID = 'candidate-youyi-lu-nagoya-ba87134054-catalog-no-image'
export const NAGOYA_CATALOG_URL = 'https://da.adm.thers.ac.jp/en/item/n004-20230901-07327'

export const INPUT_PATHS = [...new Set([
  ...v5.INPUT_PATHS,
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

function nagoyaCandidate() {
  return {
    candidateId: NAGOYA_SOURCE_ID,
    sourceKind: 'institutional_catalog_record_no_image',
    sourceIdentity: {
      title: '游藝錄六卷',
      author: '清 兪樾 撰',
      appearance: '刊6卷1冊',
      catalogCollection: 'Kotenseki Descriptive Database',
      holding: 'Nagoya University Library',
      materialId: '10149888',
      ncid: 'BA87134054',
      remarks: '春在堂全書96冊',
      publicationDate: 'unresolved',
      independentHistoricalWitness: false,
    },
    catalogObservation: {
      role: 'direct_catalog_metadata_observation_not_page_semantics',
      recordUrl: NAGOYA_CATALOG_URL,
      observedFields: [
        'Title: 游藝錄六卷',
        'Author: 清 兪樾 撰',
        'Appearance: 刊6卷1冊',
        'NCID: BA87134054',
        'Material ID: 10149888',
        'Original Owner: Nagoya University Library',
        'Remarks: 春在堂全書96冊',
        'Image: None',
      ],
    },
    locators: {
      catalogUrl: NAGOYA_CATALOG_URL,
      recordId: 'n004-20230901-07327',
      imageField: 'None',
      imageAvailable: false,
      pageImagesLocated: false,
      sourceBytesAcquired: false,
      metadataRights: 'CC0',
    },
    directVisualReview: false,
    directObservationStatus: 'catalog_record_review_only_no_image',
    directReading: [],
    comparisonTo1883: {
      status: 'not_performed_catalog_only_date_unresolved',
      directTextComparisonPerformed: false,
      directByteComparisonPerformed: false,
      textualLineageClosed: false,
    },
    decision: 'catalog_record_identity_only_no_image_no_1871_date_no_direct_witness',
    doesNotEnterGraph: true,
    doesNotEstablish: [
      'publication year 1871',
      'page-level text or colophon',
      '1871 to 1883 textual or block lineage',
      'independent historical witness',
      'palace_name_to_physical_chart_slot',
      'production ordinal',
    ],
  }
}

function researchFrontier(previousFrontier) {
  const candidates = [...structuredClone(previousFrontier.candidates), nagoyaCandidate()]
  const comparison = structuredClone(previousFrontier.comparison1871To1883)
  comparison.alternateCatalogSources = [
    ...new Set([...(comparison.alternateCatalogSources || []), v5.RITSUMEIKAN_SOURCE_ID, NAGOYA_SOURCE_ID]),
  ]
  comparison.ndlCatalogLeads = [v5.NDL_MANUSCRIPT_RECORD_URL, v5.NDL_COMPILED_RECORD_URL]
  comparison.directTextComparisonPerformed = false
  comparison.directByteComparisonPerformed = false
  comparison.independentLineageAdmitted = false
  comparison.status = 'open'
  comparison.conclusion = 'The exact 1871 record, an alternate Ritsumeikan holding, and the separate Nagoya catalog record are identity-useful acquisition surfaces; the Nagoya record reports Image: None and does not resolve a publication date. NDL manuscript and compiled-volume routes remain access-limited, and no 1871 page bytes were acquired. No direct textual, colophon, byte, or block comparison with the 1883 scans was performed.'
  return {
    schemaVersion: SCHEMA + '-research-frontier-v0',
    researchSessionDate: '2026-08-13',
    status: 'catalog_route_exhaustion_no_new_graph_admission',
    admissionBoundary: 'The reviewed leads remain provenance-separated. Direct original-image observation, catalog identity, access status, source lineage, semantic authority, physical slot, production ordinal, readiness, and activation are not interchangeable gates.',
    candidates,
    comparison1871To1883: comparison,
    acquisitionLeads: [
      ...structuredClone(previousFrontier.acquisitionLeads || []),
      {
        leadId: 'lead-nagoya-youyi-lu-ba87134054-catalog-no-image',
        sourceId: NAGOYA_SOURCE_ID,
        url: NAGOYA_CATALOG_URL,
        recordId: 'n004-20230901-07327',
        imageAvailable: false,
        publicationDateResolved: false,
        pageBytesAcquired: false,
        result: 'Separate Nagoya University catalog record located; the record explicitly reports Image: None, so no page image or source bytes were acquired and the publication date remains unresolved.',
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
  const generated = v5.buildBundle(root, options)
  const stored = readJson(root, PREDECESSOR_COMPOSITION)
  const storedEvidence = readJson(root, PREDECESSOR_COMPOSITION_EVIDENCE)
  requireValue(canonicalStableArtifactJson(stored) === canonicalStableArtifactJson(generated.artifact), 'v5_predecessor_complete_drift')
  requireValue(canonicalStableArtifactJson(storedEvidence) === canonicalStableArtifactJson(generated.files['evidence.json']), 'v5_predecessor_evidence_drift')
  requireValue(generated.artifact.schemaVersion === v5.SCHEMA, 'unexpected_v5_schema')
  requireValue(generated.artifact.graphImpact.successor.claimCount === 30, 'unexpected_v5_claim_count')
  requireValue(generated.artifact.graphImpact.successor.sourceCount === 19, 'unexpected_v5_source_count')
  requireValue(generated.artifact.graphImpact.successor.observationCount === 55, 'unexpected_v5_observation_count')
  requireValue(generated.artifact.graphImpact.successor.relationCount === 146, 'unexpected_v5_relation_count')
  requireValue(generated.artifact.graphImpact.successor.blockerCount === 11, 'unexpected_v5_blocker_count')
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
  evidence.authorityBoundary = 'The v6 frontier records a separate Nagoya catalog route with no image, plus the v5 NARA and 1871 catalog/access boundaries. Every new lead remains held outside the semantic graph; named-palace corroboration and all physical-slot, ordinal, lineage, authority, readiness, and activation boundaries are unchanged.'
  evidence.researchFrontier = frontier
  evidence.frontierCatalogOnlySources = [NAGOYA_SOURCE_ID]
  evidence.reportedNonObservations = [...new Set([
    ...evidence.reportedNonObservations,
    'The Nagoya University record n004-20230901-07327 identifies 游藝錄六卷 and reports Image: None; it does not provide page bytes, a colophon image, or a resolved 1871 publication date.',
    'No direct 1871-to-1883 text, colophon, byte, or block comparison was performed after reviewing the Kobe, Ritsumeikan, NDL, and Nagoya catalog routes.',
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
    thirdCatalogRouteReviewed: true,
    nagoyaCatalogRecordReviewed: true,
    nagoyaImageAvailable: false,
    nagoyaPublicationDateResolved: false,
    pageImagesLocated: false,
    directTextComparisonPerformed: false,
    byteComparisonPerformed: false,
    textualLineageClosed: false,
    comparisonStatus: 'catalog_identity_and_no_image_route_only_1871_vs_1883_not_performed',
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
  fieldKitImpact.heldEvidenceUpdate = 'Nagoya adds a separate institutional catalog record for 游藝錄六卷, but its Image: None field means no page image or source bytes were acquired and the publication date remains unresolved. Together with the v5 NARA, Ritsumeikan, and NDL review, this expands the acquisition frontier without supplying a new four-field witness, physical slot, production ordinal, or direct 1871 lineage comparison.'
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
      purpose: 'additive catalog-route exhaustion research for palace, branch, physical-slot, ordinal, and lineage binding; no graph admission or production promotion',
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
      boundary: 'The v6 catalog-route frontier adds no graph claims or semantic support; v5 named-palace corroboration, branch-token join, physical slot, production ordinal, source lineage, semantic authority, readiness, and activation boundaries remain unchanged.',
    },
    blockerImpact: {
      ...structuredClone(previous.blockerImpact),
      researchFrontierReviewed: true,
      researchFrontierTopLevelClosures: [],
      resolvedSubBoundaries: [
        ...previous.blockerImpact.resolvedSubBoundaries,
        'Nagoya catalog record n004-20230901-07327 reports Image: None and remains an acquisition route without page bytes, a resolved 1871 date, or semantic graph admission',
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
      sourceBytes: 'NARA image responses and external catalog/access routes are referenced by fixed hashes, stable locators, and explicit same-record/derivative/access/no-image status; materialization performs no network acquisition.',
      network: 'forbidden_during_materialization',
      ocr: 'not used as canonical text; direct visual readings are fixed evidence metadata',
      noAutomaticPromotion: true,
    },
    negativeContract: {
      ...structuredClone(previous.negativeContract),
      rejects: [...new Set([
        ...previous.negativeContract.rejects,
        'treating the Nagoya catalog record with Image: None as a page-level scan or independent historical witness',
        'inventing a 1871 publication date from the Nagoya record whose publication date remains unresolved',
        'treating the Nagoya catalog route as direct text, colophon, byte, block-lineage, palace-slot, or production-ordinal evidence',
        'promoting the v6 held-out catalog frontier into graph sources, observations, relations, claims, or readiness',
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
    predecessorSchema: v5.SCHEMA,
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
