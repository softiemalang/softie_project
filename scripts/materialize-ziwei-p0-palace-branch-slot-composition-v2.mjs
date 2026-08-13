import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'

import {
  attachArtifactIdentity,
  buildArtifactIdentity,
  checkHistoricalRepositoryBasis,
} from '../src/artifactIdentity.js'

export const SCHEMA = 'ziwei-p0-palace-branch-slot-composition-v2'
export const VERDICT = 'complete_ziwei_palace_branch_slot_composition_derived_not_authoritative'
export const MATERIALIZER_VERSION = '2.0.0'
export const BASIS_HEAD = '43253bdab2582fb005e5c4c114f296ced5609335'
export const MATERIALIZER_PATH = 'scripts/materialize-' + SCHEMA + '.mjs'
export const ARTIFACT_DIR = 'artifacts/' + SCHEMA
export const ARTIFACT_PATH = ARTIFACT_DIR + '/complete.json'
export const ROOT = resolve(new URL('..', import.meta.url).pathname)

export const PREDECESSOR_YOUYI = 'artifacts/ziwei-p0-youyi-lu-cadal-01025514-semantic-witness-v1/complete.json'
export const PREDECESSOR_YOUYI_EVIDENCE = 'artifacts/ziwei-p0-youyi-lu-cadal-01025514-semantic-witness-v1/evidence.json'
export const PREDECESSOR_NANBEI_INDEX = 'artifacts/ziwei-palace-coordinate-semantic-identity-v0/sourceWitnessIndex.json'
export const PREDECESSOR_NANBEI_OBSERVATIONS = 'artifacts/ziwei-palace-semantic-source-frontier-v1/source-observations.json'
export const PREDECESSOR_NARA_SEMANTIC = 'artifacts/ziwei-nara-iiif-leafmap-semantic-witness-v1/semantic-observations.json'
export const PROTECTED_ASSET_PATH = 'artifacts/saju-source-derived-evidence-v1/assets/ziping-zhenquan-pdf-page-002-rendered-evidence.jpg'

export const SOURCE_YOUYI = 'src-youyi-lu-cadal-01025514-1883'
export const SOURCE_NANBEI = 'src-nanbei-pdf'
export const SOURCE_PCHOME = 'src-pchome-ziwei-palm-rule-2009'
export const SOURCE_CINII_1871 = 'src-youyi-lu-cinii-1871-catalog'

export const TRADITIONAL_BRANCH_ORDER = Object.freeze(['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'])
export const NANBEI_CLOCKWISE_SEQUENCE = Object.freeze(['巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰'])
export const PALACE_NAMES_YOUYI = Object.freeze([
  '命宮', '兄弟宮', '夫妻宮', '子息宮', '財帛宮', '疾厄宮',
  '遷移宮', '奴僕宮', '官祿宮', '田宅宮', '福德宮', '父母宮',
])
export const ANCHOR_MING_BRANCH = '寅'

export const PCHOME_URL = 'https://mypaper.pchome.com.tw/twmin2589/post/1312687151'
export const CINII_1871_URL = 'https://ci.nii.ac.jp/ncid/BD19656670'
export const CINII_1883_URL = 'https://ci.nii.ac.jp/ncid/BB19945538'
export const NANBEI_PDF_SHA256 = '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023'

const ALL_BLOCKER_IDS = Object.freeze([
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
])

const CLAIM_PALACE_ORDINAL = 'claim-palace-name-branch-ordinal'
const CLAIM_PALACE_DIAGRAM = 'claim-12-palace-diagram-semantics'

export const INPUT_PATHS = [
  PREDECESSOR_YOUYI,
  PREDECESSOR_YOUYI_EVIDENCE,
  PREDECESSOR_NANBEI_INDEX,
  PREDECESSOR_NANBEI_OBSERVATIONS,
  PREDECESSOR_NARA_SEMANTIC,
  PROTECTED_ASSET_PATH,
  'src/artifactIdentity.js',
  MATERIALIZER_PATH,
]

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const sortValue = value => Array.isArray(value)
  ? value.map(sortValue)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sortValue(value[key])]))
    : value
export const canonicalJson = value => JSON.stringify(sortValue(value), null, 2) + '\n'

const git = (root, args) => execFileSync(
  'git',
  ['-c', 'core.fsmonitor=false', ...args],
  { cwd: root, encoding: 'utf8' },
).trim()

const readJson = (root, path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'))
const fileSha256 = (root, path) => sha256(readFileSync(resolve(root, path)))
const unique = values => [...new Set(values)]
const mod = value => ((value % 12) + 12) % 12
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

function sourceInput(root) {
  const youyi = readJson(root, PREDECESSOR_YOUYI)
  const youyiEvidence = readJson(root, PREDECESSOR_YOUYI_EVIDENCE)
  const nanbeiIndex = readJson(root, PREDECESSOR_NANBEI_INDEX)
  const nanbeiObservations = readJson(root, PREDECESSOR_NANBEI_OBSERVATIONS)
  const naraSemantic = readJson(root, PREDECESSOR_NARA_SEMANTIC)
  requireValue(youyi.schemaVersion === 'ziwei-p0-youyi-lu-cadal-01025514-semantic-witness-v1', 'unexpected_youyi_predecessor_schema')
  requireValue(youyi.graphImpact?.successor?.claimCount === 30, 'unexpected_youyi_claim_count')
  requireValue(youyi.graphImpact?.successor?.sourceCount === 15, 'unexpected_youyi_source_count')
  requireValue(youyi.graphImpact?.successor?.observationCount === 50, 'unexpected_youyi_observation_count')
  requireValue(youyi.graphImpact?.successor?.relationCount === 140, 'unexpected_youyi_relation_count')
  requireValue(youyi.graphImpact?.successor?.blockerCount === 11, 'unexpected_youyi_blocker_count')
  requireValue(youyi.sourceLineage?.physicalWitnessCountAfter === 2, 'unexpected_youyi_physical_witness_count')
  requireValue(youyi.readinessImpact?.readiness === 'not_safe_to_start', 'unexpected_youyi_readiness')
  requireValue(youyi.readinessImpact?.grounding === 'blocked', 'unexpected_youyi_grounding')
  requireValue(youyi.readinessImpact?.activation === 'experimental_only', 'unexpected_youyi_activation')
  requireValue(nanbeiIndex.source?.sha256 === NANBEI_PDF_SHA256, 'unexpected_nanbei_source_hash')
  requireValue(nanbeiIndex.diagram?.clockwiseSequence?.join('') === NANBEI_CLOCKWISE_SEQUENCE.join(''), 'unexpected_nanbei_branch_ring')
  requireValue(nanbeiIndex.sourceRefs?.find(item => item.id === 'source-p7-shi-er-gong-guan-gai')?.page === 7, 'missing_nanbei_p7')
  requireValue(nanbeiIndex.sourceRefs?.find(item => item.id === 'source-p8-ming-shen-rule')?.page === 8, 'missing_nanbei_p8')
  requireValue(naraSemantic.completeBindingCount === 0, 'unexpected_nara_binding_promotion')
  requireValue(naraSemantic.lineage?.independentWitness === false, 'unexpected_nara_independence_promotion')
  return { youyi, youyiEvidence, nanbeiIndex, nanbeiObservations, naraSemantic }
}

function predecessorByteIdentity(root) {
  return INPUT_PATHS.map(path => ({ path, byteSha256: fileSha256(root, path) }))
}

function composeRows(mingBranch) {
  const mingIndex = TRADITIONAL_BRANCH_ORDER.indexOf(mingBranch)
  requireValue(mingIndex >= 0, 'unknown_ming_branch:' + mingBranch)
  return PALACE_NAMES_YOUYI.map((palaceName, palaceOrdinalZero) => {
    const branchOrdinal = mod(mingIndex - palaceOrdinalZero)
    const branchToken = TRADITIONAL_BRANCH_ORDER[branchOrdinal]
    const physicalSlot = NANBEI_CLOCKWISE_SEQUENCE.indexOf(branchToken)
    return {
      rowId: `${mingBranch}-palace-${String(palaceOrdinalZero + 1).padStart(2, '0')}`,
      mingBranch,
      palaceName,
      palaceOrdinal: palaceOrdinalZero + 1,
      branchToken,
      traditionalBranchOrdinal: branchOrdinal,
      physicalSlotClockwiseIndex: physicalSlot,
      physicalSlotLabel: `nanbei-p7-perimeter-${String(physicalSlot + 1).padStart(2, '0')}`,
      sourceDirection: palaceOrdinalZero === 0 ? 'anchor' : 'reverse_from_ming_branch',
      composedPhysicalDirection: palaceOrdinalZero === 0
        ? 'anchor'
        : 'counterclockwise_relative_to_nanbei_recorded_clockwise_sequence',
      productionOrdinal: null,
      productionOrdinalStatus: 'not_established',
      bindingStatus: 'composed_inference_not_direct_witness',
    }
  })
}

function buildBindingMatrix(source) {
  const allAnchors = TRADITIONAL_BRANCH_ORDER.map(mingBranch => ({ mingBranch, rows: composeRows(mingBranch) }))
  const anchorRows = allAnchors.find(item => item.mingBranch === ANCHOR_MING_BRANCH).rows
  const pchomeRows = [
    ['命宮', '寅'], ['兄弟宮', '丑'], ['夫妻宮', '子'], ['子女宮', '亥'],
    ['財帛宮', '戌'], ['疾厄宮', '酉'], ['遷移宮', '申'], ['交友宮', '未'],
    ['事業宮', '午'], ['田宅宮', '巳'], ['福德宮', '辰'], ['父母宮', '卯'],
  ].map(([visibleName, branchToken]) => ({ visibleName, branchToken }))
  const alias = { 子女宮: '子息宮', 交友宮: '奴僕宮', 事業宮: '官祿宮' }
  const secondaryComparison = pchomeRows.map((row, index) => {
    const derived = anchorRows[index]
    return {
      visibleName: row.visibleName,
      normalizedPalaceName: alias[row.visibleName] || row.visibleName,
      visibleBranchToken: row.branchToken,
      derivedPalaceName: derived.palaceName,
      derivedBranchToken: derived.branchToken,
      branchMatch: row.branchToken === derived.branchToken,
      nameMatchAfterAlias: (alias[row.visibleName] || row.visibleName) === derived.palaceName,
    }
  })
  return {
    schemaVersion: SCHEMA + '-binding-matrix-v0',
    composition: {
      status: 'derived_not_authoritative',
      joinKey: 'earthly_branch_token',
      anchorMingBranch: ANCHOR_MING_BRANCH,
      palaceNameOrdinalSource: {
        sourceId: SOURCE_YOUYI,
        predecessorObservationId: 'obs-youyi-p130-ming-shen-palace-order',
        locator: 'Youyi Lu CADAL scan page 130; direct named-palace sequence and 乃逆行而布十二宮 wording',
        directCoverage: 12,
      },
      branchPhysicalSlotSource: {
        sourceId: SOURCE_NANBEI,
        predecessorSourceRef: 'source-p7-shi-er-gong-guan-gai',
        locator: 'Nanbei PDF p7 / 十二宮冠蓋; direct 12-cell branch perimeter',
        directCoverage: 12,
      },
      directionSource: {
        sourceIds: [SOURCE_YOUYI, SOURCE_NANBEI],
        predecessorObservationIds: ['obs-youyi-p130-ming-shen-palace-order', 'source-p8-ming-shen-rule'],
        directText: '逆行而布十二宮 / 命宮逆數',
        composedPhysicalDirection: 'counterclockwise_relative_to_nanbei_recorded_clockwise_sequence',
      },
      unprovenJoinPremises: [
        'The named-palace order on Youyi p130 and the physical branch perimeter on Nanbei p7 share one semantic coordinate frame.',
        'The Nanbei p7 physical perimeter orientation is the production chart orientation.',
        'A source-composed physical slot is identical to the repository production ordinal.',
      ],
    },
    coverage: {
      directSingleWitnessFullBindingCount: 0,
      directNamedPalaceOrdinalCount: 12,
      directBranchPhysicalSlotCount: 12,
      composedSourceBindingCount: anchorRows.length,
      allAnchorRowCount: allAnchors.reduce((count, item) => count + item.rows.length, 0),
      secondaryClarificationMatchCount: secondaryComparison.filter(item => item.branchMatch && item.nameMatchAfterAlias).length,
      productionOrdinalBindingCount: 0,
      semanticAuthorityCount: 0,
      readinessPromotionCount: 0,
    },
    anchorRows,
    allAnchorRows: allAnchors,
    secondaryClarification: {
      sourceId: SOURCE_PCHOME,
      url: PCHOME_URL,
      publicationDate: '2009-04-26',
      role: 'secondary_clarification_only',
      canonicalForClaims: false,
      independentHistoricalWitness: false,
      historicalOriginality: false,
      visibleTextLocator: 'article lines 16-28 and 30-78 in the captured web text surface',
      comparison: secondaryComparison,
      matchCount: secondaryComparison.filter(item => item.branchMatch && item.nameMatchAfterAlias).length,
    },
    sourceBranchRing: {
      sourceId: SOURCE_NANBEI,
      pdfSha256: source.nanbeiIndex.source.sha256,
      page: 7,
      clockwiseSequence: NANBEI_CLOCKWISE_SEQUENCE,
      palaceNamesVisibleOnPage: false,
      semanticIdentityOnPage: 'unresolved',
    },
  }
}

function buildEvidence(source, bindingMatrix) {
  const youyiP130 = source.youyi.observations.find(item => item.observationId === 'obs-youyi-p130-ming-shen-palace-order')
  const p7 = source.nanbeiIndex.sourceRefs.find(item => item.id === 'source-p7-shi-er-gong-guan-gai')
  const p8 = source.nanbeiIndex.sourceRefs.find(item => item.id === 'source-p8-ming-shen-rule')
  const nanbeiP7 = source.nanbeiObservations.find(item => item.id === 'nanbei-p7-twelve-cell-diagram')
  const nanbeiP8 = source.nanbeiObservations.find(item => item.id === 'nanbei-p8-ming-shen-rule')
  const reusedDirectWitnesses = [
    {
      evidenceId: 'reuse-youyi-p130-named-palace-order',
      sourceId: SOURCE_YOUYI,
      predecessorArtifact: PREDECESSOR_YOUYI_EVIDENCE,
      predecessorObservationId: youyiP130.observationId,
      observationKind: 'reused_direct_scan_surface',
      locator: youyiP130.locator,
      establishes: ['12 named-palace relative order', 'reverse traversal wording', 'relative palace ordinal from 命宮'],
      doesNotEstablish: ['physical chart slot', 'production ordinal', 'semantic authority'],
    },
    {
      evidenceId: 'reuse-nanbei-p7-branch-perimeter',
      sourceId: SOURCE_NANBEI,
      predecessorArtifact: PREDECESSOR_NANBEI_INDEX,
      predecessorSourceRef: p7.id,
      observationKind: 'reused_direct_diagram_surface',
      locator: { pdfPage: p7.page, renderedFileSha256: p7.region.renderedFileSha256, role: p7.role },
      reading: p7.reading,
      supports: nanbeiP7.supports,
      doesNotSupport: nanbeiP7.doesNotSupport,
    },
    {
      evidenceId: 'reuse-nanbei-p8-reverse-traversal',
      sourceId: SOURCE_NANBEI,
      predecessorArtifact: PREDECESSOR_NANBEI_INDEX,
      predecessorSourceRef: p8.id,
      observationKind: 'reused_direct_traversal_surface',
      locator: { pdfPage: p8.page, renderedFileSha256: p8.region.renderedFileSha256, role: p8.role },
      reading: p8.reading,
      supports: nanbeiP8.supports,
      doesNotSupport: nanbeiP8.doesNotSupport,
    },
  ]
  const observations = [
    {
      observationId: 'obs-youyi-1871-catalog-only-boundary',
      sourceIds: [SOURCE_CINII_1871],
      researcherDirectObservation: false,
      directObservationStatus: 'catalog_record_review_only',
      observationKind: 'earlier_edition_catalog_only_lineage_boundary',
      authorityStatus: 'catalog_identity_only; source_authority_and_semantic_authority_not_established',
      blockerIds: ['blocker-source-identity-unresolved'],
      locator: { url: CINII_1871_URL, recordId: 'BD19656670', institution: 'Kobe University Library for Humanities' },
      facts: [
        'The CiNii record identifies 游藝錄 6卷 by (清)兪樾 with 同治10 [1871].',
        'The record reports one bound volume and bibliographic measurements, but no public page-image route was located in this research unit.',
        'No direct text, leaf, colophon, or byte comparison with the 1883 CADAL scan was performed.',
      ],
      doesNotEstablish: ['textual continuity with the 1883 scan', 'independent semantic witness admission', 'edition authority', 'palace coordinate identity'],
      lineageStatus: 'earlier-edition-catalog-candidate; direct text and image comparison absent',
    },
    {
      observationId: 'obs-composed-palace-branch-slot-anchor-ming-yin',
      sourceIds: [SOURCE_YOUYI, SOURCE_NANBEI],
      researcherDirectObservation: false,
      directObservationStatus: 'deterministic_composition_of_prior_direct_observations',
      observationKind: 'derived_palace_branch_physical_slot_matrix',
      authorityStatus: 'derived_not_authoritative; source_authority_and_semantic_authority_not_established',
      blockerIds: ['blocker-palace-semantic-identity'],
      affectedClaimIds: [CLAIM_PALACE_ORDINAL, CLAIM_PALACE_DIAGRAM],
      basisObservationRefs: reusedDirectWitnesses.map(item => item.evidenceId),
      compositionRule: 'palace ordinal j maps to traditional branch index (mingIndex - j) mod 12; branch token maps to Nanbei p7 clockwise physical slot',
      anchorMingBranch: ANCHOR_MING_BRANCH,
      derivedCoverage: bindingMatrix.anchorRows.length,
      directSingleWitnessFullBinding: false,
      productionOrdinal: 'not_established',
      facts: [
        'For anchor 命宮=寅, the composed rows reproduce the 12 relative palace names, branch tokens, and Nanbei perimeter slots.',
        'The physical counterclockwise label is a consequence of joining Youyi/Nanbei reverse traversal with the Nanbei recorded clockwise sequence; it is not printed as a complete named-palace diagram on either reviewed page.',
      ],
      doesNotEstablish: ['single-source complete semantic map', 'production enum identity', 'semantic authority', 'readiness or activation'],
    },
    {
      observationId: 'obs-pchome-secondary-anchor-clarification',
      sourceIds: [SOURCE_PCHOME],
      researcherDirectObservation: false,
      directObservationStatus: 'secondary_web_text_surface_review',
      observationKind: 'modern_secondary_worked_diagram_clarification',
      authorityStatus: 'secondary_clarification_only; source_authority_and_semantic_authority_not_established',
      blockerIds: ['blocker-palace-semantic-identity'],
      locator: {
        url: PCHOME_URL,
        publicationDate: '2009-04-26',
        lines: '16-28 and 30-78',
        role: 'secondary_clarification_only',
      },
      visibleText: '由命宮起，逆時針方向分別為：命宮、兄弟宮、夫妻宮、子女宮、財帛宮、疾厄宮、遷移宮、交友宮、事業宮、田宅宮、福德宮、父母宮。假設命宮在寅。',
      canonicalForClaims: false,
      independentHistoricalWitness: false,
      historicalOriginality: false,
      comparisonMatchCount: bindingMatrix.secondaryClarification.matchCount,
      facts: ['The modern article explicitly prints palace names with branch tokens for a 命宮=寅 example.', 'After source-name alias normalization, all 12 branch/name rows match the derived matrix.'],
      doesNotEstablish: ['historical originality', 'independent source lineage', 'production ordinal authority', 'rights for image or text reuse'],
    },
  ]
  return {
    schemaVersion: SCHEMA + '-evidence-v0',
    authorityBoundary: 'The only complete four-field matrix in this artifact is a composition; no single historical source page directly witnesses all four fields.',
    reusedDirectWitnesses,
    observations,
    negativeBoundaryReuse: {
      predecessorArtifact: PREDECESSOR_NARA_SEMANTIC,
      completeBindingCount: source.naraSemantic.completeBindingCount,
      status: source.naraSemantic.status,
      directNegativeObservationIds: source.naraSemantic.observations.map(item => item.id),
      sameRecordVolumePairIsNotIndependent: source.naraSemantic.lineage.independentWitness === false,
    },
    reportedNonObservations: [
      'No 1871 page image or text comparison was located; the 1871 record remains catalog-only.',
      'Nanbei p7 has no palace-name labels; Youyi p130 has no physical chart perimeter.',
      'The branch-token join is an explicit inference and does not establish that the two source surfaces share one historical coordinate frame.',
      'No production ordinal, source authority, independent witness admission, readiness, grounding, activation, deployment, or remote mutation was performed.',
    ],
  }
}

function buildRelations(evidence) {
  const common = {
    promotion: 'not_admitted_to_source_authority_or_semantic_claim',
    blockerIds: ['blocker-palace-semantic-identity'],
  }
  return [
    {
      ...common,
      relationId: 'relation-youyi-nanbei-branch-token-composition',
      sourceIds: [SOURCE_YOUYI, SOURCE_NANBEI],
      observationIds: ['obs-composed-palace-branch-slot-anchor-ming-yin'],
      relationKind: 'derived_branch_token_join_of_named_palace_order_and_physical_branch_ring',
      relationStatus: 'reproducible 12-row composition; historical shared-frame and production-ordinal premises remain open',
      claimIds: [CLAIM_PALACE_ORDINAL, CLAIM_PALACE_DIAGRAM],
      affectedClaimIds: [CLAIM_PALACE_ORDINAL, CLAIM_PALACE_DIAGRAM],
    },
    {
      ...common,
      relationId: 'relation-pchome-secondary-anchor-corroboration',
      sourceIds: [SOURCE_PCHOME],
      observationIds: ['obs-pchome-secondary-anchor-clarification'],
      relationKind: 'secondary_worked_example_matches_derived_anchor',
      relationStatus: '12/12 modern secondary clarification match after name aliases; not independent or historical authority',
      claimIds: [CLAIM_PALACE_ORDINAL, CLAIM_PALACE_DIAGRAM],
      affectedClaimIds: [CLAIM_PALACE_ORDINAL, CLAIM_PALACE_DIAGRAM],
    },
    {
      relationId: 'relation-youyi-1871-catalog-lineage-boundary',
      sourceIds: [SOURCE_CINII_1871],
      observationIds: ['obs-youyi-1871-catalog-only-boundary'],
      relationKind: 'catalog_only_earlier_edition_lineage_candidate',
      relationStatus: '1871 catalog identity retained; textual continuity and independent witness status not admitted',
      claimIds: [],
      affectedClaimIds: [],
      blockerIds: ['blocker-source-identity-unresolved'],
      promotion: 'not_admitted_to_source_lineage_or_semantic_authority',
    },
  ].map(relation => ({ ...relation, observationCount: relation.observationIds.length }))
}

function buildClaimReconciliation(previous, relations) {
  const newObservationIdsByClaim = {
    [CLAIM_PALACE_ORDINAL]: ['obs-composed-palace-branch-slot-anchor-ming-yin', 'obs-pchome-secondary-anchor-clarification'],
    [CLAIM_PALACE_DIAGRAM]: ['obs-composed-palace-branch-slot-anchor-ming-yin', 'obs-pchome-secondary-anchor-clarification'],
  }
  const newSourceIdsByClaim = {
    [CLAIM_PALACE_ORDINAL]: [SOURCE_NANBEI, SOURCE_PCHOME],
    [CLAIM_PALACE_DIAGRAM]: [SOURCE_NANBEI, SOURCE_PCHOME],
  }
  const newRelationIdsByClaim = Object.fromEntries(Object.keys(newObservationIdsByClaim).map(claimId => [
    claimId,
    relations.filter(item => item.claimIds.includes(claimId)).map(item => item.relationId),
  ]))
  return previous.claimReconciliation.map(claim => {
    const observations = newObservationIdsByClaim[claim.claimId] || []
    const sourceIds = newSourceIdsByClaim[claim.claimId] || []
    const relationIds = newRelationIdsByClaim[claim.claimId] || []
    return {
      ...claim,
      observationIdsAdded: unique([...(claim.observationIdsAdded || []), ...observations]),
      sourceIdsAdded: unique([...(claim.sourceIdsAdded || []), ...sourceIds]),
      evidenceRelationIdsAdded: unique([...(claim.evidenceRelationIdsAdded || []), ...relationIds]),
      directObservationStatus: observations.length > 0
        ? 'new derived branch-token composition and secondary clarification; semantic authority unchanged'
        : claim.directObservationStatus,
      predecessorStatus: claim.successorStatus,
      successorStatus: claim.successorStatus,
      predecessorClaimRelation: claim.successorClaimRelation,
      successorClaimRelation: claim.successorClaimRelation,
      statusChanged: false,
      sourceRelationPromotion: 'none',
    }
  })
}

function buildBlockers(previous, evidence, relations) {
  const newObsByBlocker = Object.fromEntries(ALL_BLOCKER_IDS.map(id => [id, []]))
  const newRelationsByBlocker = Object.fromEntries(ALL_BLOCKER_IDS.map(id => [id, []]))
  for (const observation of evidence.observations) {
    for (const blockerId of observation.blockerIds || []) newObsByBlocker[blockerId].push(observation.observationId)
  }
  for (const relation of relations) {
    for (const blockerId of relation.blockerIds || []) newRelationsByBlocker[blockerId].push(relation.relationId)
  }
  return previous.blockerReassessment.map(previousBlocker => {
    const before = previousBlocker.statusAfter
    const newObservationIds = unique(newObsByBlocker[previousBlocker.id])
    const newRelationIds = unique(newRelationsByBlocker[previousBlocker.id])
    const localAddendum = previousBlocker.id === 'blocker-palace-semantic-identity'
      ? 'a 12-row branch-token composition and 12/12 secondary clarification match are now reproducible, but single-source/direct binding and production ordinal remain open'
      : previousBlocker.id === 'blocker-source-identity-unresolved'
        ? 'the 1871 record is bounded as catalog-only; no scan/text comparison or lineage closure was performed'
        : null
    return {
      ...previousBlocker,
      statusBefore: before,
      statusAfter: before,
      statusChanged: false,
      newObservationIds,
      newRelationIds,
      localResultAfter: localAddendum ? `${previousBlocker.localResultAfter}; ${localAddendum}` : previousBlocker.localResultAfter,
      uncertaintyReduction: localAddendum ? [...(previousBlocker.uncertaintyReduction || []), localAddendum] : previousBlocker.uncertaintyReduction,
      evidenceRefs: newObservationIds.length || newRelationIds.length
        ? unique([...(previousBlocker.evidenceRefs || []), ARTIFACT_DIR + '/evidence.json'])
        : previousBlocker.evidenceRefs,
      closureDecision: 'top_level_blocker_remains_open; no automatic closure',
    }
  })
}

function buildFieldKitImpact(root, previous, evidence) {
  const previousFieldKit = previous.fieldKitImpact
  const evidencePath = ARTIFACT_DIR + '/evidence.json'
  const targetReassessment = previousFieldKit.targetReassessment.map(item => {
    const isSource = item.targetId === 'acq-distinct-witness-identity-lineage'
    const isPalace = item.targetId === 'acq-palace-semantic-map-and-coordinate-witness'
    return {
      ...item,
      newEvidenceRole: isSource
        ? '1871 CiNii catalog identity is bounded as catalog-only; direct copy, text comparison, and lineage remain action_required'
        : isPalace
          ? 'Youyi named-palace order plus Nanbei branch ring produce a 12-row derived matrix; single-source witness and production ordinal remain action_required'
          : item.newEvidenceRole,
      evidenceRefs: isSource || isPalace ? unique([...(item.evidenceRefs || []), evidencePath]) : item.evidenceRefs,
      statusBefore: item.statusAfter,
      statusAfter: item.statusAfter,
      statusChanged: false,
      closure: 'not_closed',
    }
  })
  return {
    predecessorPath: PREDECESSOR_YOUYI,
    predecessorByteSha256: fileSha256(root, PREDECESSOR_YOUYI),
    existingFieldKitBytesRewritten: false,
    heldEvidenceUpdate: 'The branch-token composition narrows the palace frontier but remains derived and non-authoritative; the 1871 record remains catalog-only and no production ordinal is admitted.',
    targetReassessment,
    evidenceObservationIds: evidence.observations.map(item => item.observationId),
    semanticTargetStillOpen: true,
    sourceIdentityTargetStillActionRequired: true,
    rightsTargetStillHumanPolicyReview: true,
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
  const source = sourceInput(root)
  const bindingMatrix = buildBindingMatrix(source)
  const evidence = buildEvidence(source, bindingMatrix)
  const relations = buildRelations(evidence)
  const claimReconciliation = buildClaimReconciliation(source.youyi, relations)
  const blockers = buildBlockers(source.youyi, evidence, relations)
  const fieldKitImpact = buildFieldKitImpact(root, source.youyi, evidence)
  const protectedAsset = {
    path: '-.jpg',
    canonicalPath: PROTECTED_ASSET_PATH,
    exists: existsSync(resolve(root, PROTECTED_ASSET_PATH)),
    byteSha256: fileSha256(root, PROTECTED_ASSET_PATH),
  }
  requireValue(protectedAsset.exists, 'protected_source_derived_asset_missing')
  requireValue(protectedAsset.byteSha256 === source.youyi.preservation.protectedAsset.byteSha256, 'protected_source_derived_asset_changed')

  const previousGraph = source.youyi.graphImpact.successor
  const addedObservationIds = evidence.observations.map(item => item.observationId)
  const addedRelationIds = relations.map(item => item.relationId)
  const addedSourceIds = [SOURCE_PCHOME, SOURCE_CINII_1871]
  const successorGraph = {
    claimCount: previousGraph.claimCount,
    sourceCount: previousGraph.sourceCount + addedSourceIds.length,
    observationCount: previousGraph.observationCount + addedObservationIds.length,
    relationCount: previousGraph.relationCount + addedRelationIds.length,
    blockerCount: previousGraph.blockerCount,
  }
  const statusCounts = Object.fromEntries(ALL_BLOCKER_IDS.map(id => [id, blockers.find(item => item.id === id).statusAfter]))
  const boundedClaimIds = claimReconciliation.filter(item => item.observationIdsAdded.length > (source.youyi.claimReconciliation.find(previousClaim => previousClaim.claimId === item.claimId)?.observationIdsAdded?.length || 0)).map(item => item.claimId)
  const completeBase = {
    schemaVersion: SCHEMA,
    verdictToken: VERDICT,
    basisHead: BASIS_HEAD,
    observedHead: repo.currentHead,
    originMainHead: repo.originMainHead,
    branch: repo.branch,
    scope: {
      purpose: 'additive composition of a historical named-palace order and a historical branch perimeter; no semantic or production promotion',
      directSingleWitnessFullBindingEstablished: false,
      derivedMatrixProduced: true,
      secondaryClarificationRecorded: true,
      historical1871ScanObtained: false,
      sourceAuthorityPromoted: false,
      semanticAuthorityPromoted: false,
      independentWitnessesAdmitted: 0,
      physicalWitnessCandidatesAdded: 0,
      productionChanged: false,
      readinessChanged: false,
      groundingChanged: false,
      activationChanged: false,
      remoteDatabaseChanged: false,
      deployPerformed: false,
      commitPerformed: false,
      pushPerformed: false,
      protectedUntrackedPreserved: ['-.jpg'],
      predecessorArtifacts: 'read-only inputs; historical bytes and existing field-kit bytes are not rewritten',
    },
    predecessorChain: [
      PREDECESSOR_YOUYI,
      PREDECESSOR_YOUYI_EVIDENCE,
      PREDECESSOR_NANBEI_INDEX,
      PREDECESSOR_NANBEI_OBSERVATIONS,
      PREDECESSOR_NARA_SEMANTIC,
    ].map(path => ({ path, schemaVersion: readJson(root, path).schemaVersion, byteSha256: fileSha256(root, path) })),
    companionFiles: ['evidence.json', 'binding-matrix.json', 'lineage-assessment.json', 'graph-reconciliation.json', 'field-kit-impact.json'],
    sourceLineage: {
      predecessorPhysicalWitnessCandidates: source.youyi.sourceLineage.addedSource
        ? [...(source.youyi.sourceLineage.predecessorPhysicalWitnessCandidates || []), source.youyi.sourceLineage.addedSource.sourceId]
        : [],
      reusedDirectSources: [SOURCE_YOUYI, SOURCE_NANBEI],
      addedSources: [
        {
          sourceId: SOURCE_PCHOME,
          sourceKind: 'modern_secondary_web_explainer',
          role: 'secondary_clarification_only',
          url: PCHOME_URL,
          independentPhysicalWitness: false,
          sourceAuthority: 'not_established',
        },
        {
          sourceId: SOURCE_CINII_1871,
          sourceKind: 'catalog_record_only_earlier_edition_candidate',
          role: 'lineage_boundary_only',
          url: CINII_1871_URL,
          independentPhysicalWitness: false,
          sourceAuthority: 'not_established',
        },
      ],
      physicalWitnessCountBefore: source.youyi.sourceLineage.physicalWitnessCountAfter,
      physicalWitnessCountAfter: source.youyi.sourceLineage.physicalWitnessCountAfter,
      independentPhysicalWitnessesAdmitted: 0,
      lineageInferencePerformed: false,
      sourceAuthority: 'not_established',
      semanticAuthority: 'not_established',
      compositionStatus: 'derived_not_authoritative',
      sourceIdentityStatus: '1883 scan bounded; 1871 catalog-only; textual lineage unresolved',
      independenceStatus: 'Nanbei/Youyi source-frame join is inferred; PChome is secondary; NARA pair remains same-record and non-independent',
    },
    evidence,
    observations: evidence.observations,
    relations,
    claimReconciliation,
    blockerReassessment: blockers,
    bindingMatrix,
    lineageAssessment: {
      status: 'derived_not_authoritative',
      namedPalaceWitness: { sourceId: SOURCE_YOUYI, locator: 'scan p130', direct: true, completeRelativeOrder: true },
      branchPerimeterWitness: { sourceId: SOURCE_NANBEI, locator: 'PDF p7', direct: true, completeBranchRing: true },
      joinKey: 'earthly_branch_token',
      joinStatus: 'inferred_not_directly_asserted_by_either_source',
      independentWitnessStatus: 'not_admitted',
      earlierEdition1871: {
        sourceId: SOURCE_CINII_1871,
        url: CINII_1871_URL,
        catalogDate: '同治10 [1871]',
        pageImagesLocated: false,
        directTextComparisonPerformed: false,
        textualLineageClosed: false,
      },
      secondaryClarification: {
        sourceId: SOURCE_PCHOME,
        url: PCHOME_URL,
        exactAnchor: '命宮=寅',
        normalizedMatchCount: bindingMatrix.secondaryClarification.matchCount,
        independentHistoricalAuthority: false,
      },
      naraBoundary: {
        artifact: PREDECESSOR_NARA_SEMANTIC,
        completeBindingCount: source.naraSemantic.completeBindingCount,
        independentWitness: source.naraSemantic.lineage.independentWitness,
        status: source.naraSemantic.status,
      },
      productionBoundary: {
        physicalSlotToProductionOrdinal: 'not_established',
        rotation06: 'representation_only',
        productionModified: false,
      },
    },
    graphImpact: {
      predecessor: previousGraph,
      additive: {
        claimCount: 0,
        sourceCount: addedSourceIds.length,
        physicalWitnessCount: 0,
        observationCount: addedObservationIds.length,
        relationCount: addedRelationIds.length,
        blockerCount: 0,
      },
      successor: successorGraph,
      claimsAdded: 0,
      sourcesAdded: addedSourceIds,
      physicalWitnessesAdded: [],
      independentPhysicalWitnessesAdmitted: 0,
      addedObservationIds,
      addedRelationIds,
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
      claimSourceMatrixUpdated: boundedClaimIds.length > 0,
      boundedDerivedSupportAdded: boundedClaimIds,
      directSemanticClaimSupportAdded: [],
      stableClaimCount: 0,
      semanticAuthorityCount: 0,
      interpretationEligibleClaimCount: 0,
      unsupportedClaimPreserved: true,
      boundary: 'the complete matrix is a derived join and a secondary corroboration; claim status, source authority, semantic authority, readiness, and activation remain unchanged',
    },
    blockerImpact: {
      blockersClosed: [],
      blockerStatusChanges: [],
      openBlockedCount: blockers.filter(item => item.statusAfter === 'blocked').length,
      openHumanReviewCount: blockers.filter(item => item.statusAfter === 'needs_human_review').length,
      resolvedSubBoundaries: [
        'the 12-row branch-token composition is deterministic and reproducible for all 12 命宮 anchors',
        'the 1871 record is bounded as catalog-only without a false text-lineage merge',
      ],
      resolvedSubBoundaryIsNotTopLevelClosure: true,
    },
    fieldKitImpact,
    readinessImpact: {
      readiness: source.youyi.readinessImpact.readiness,
      grounding: source.youyi.readinessImpact.grounding,
      activation: source.youyi.readinessImpact.activation,
      rotation06: source.youyi.readinessImpact.rotation06,
      sourceAuthorityPromoted: false,
      semanticAuthorityPromoted: false,
      independentWitnessesAdmitted: 0,
      productionModified: false,
      readinessModified: false,
      derivedCompositionAvailableForResearchOnly: true,
    },
    preservation: {
      predecessorArtifactsRewritten: false,
      historicalPredecessorBytesRewritten: false,
      existingFieldKitRewritten: false,
      sourceImagesStoredInGit: false,
      sourcePdfsStoredInGit: false,
      sourceBytesAcquiredOutsideRepo: true,
      externalWebSourceBytesStoredInGit: false,
      materializerNetworkUsed: false,
      protectedUntrackedDashJpgPreserved: source.youyi.preservation.protectedUntrackedDashJpgPreserved,
      protectedAsset,
      productionChanged: false,
      remoteDatabaseChanged: false,
      deploymentPerformed: false,
      commitPerformed: false,
      pushPerformed: false,
    },
    deterministicContract: {
      generatedAt: 'forbidden',
      timestamps: 'forbidden except fixed publication/catalog dates in source metadata',
      network: 'forbidden_during_materialization',
      sourceBytes: 'external source bytes and page renders are referenced by prior hash-bound artifacts; web clarification is URL/locator metadata only',
      ordering: 'canonical object keys; traditional branch order; explicit 12-row palace order; explicit relation/blocker order',
      ocr: 'not used as canonical text',
      noImplicitSourceSearch: true,
      noAutomaticPromotion: true,
    },
    negativeContract: {
      rejects: [
        'calling the composed matrix a direct single-source witness',
        'treating PChome as an independent historical witness or canonical claim source',
        'treating the 1871 catalog record as a scanned or text-compared edition',
        'mapping the composed Nanbei slot to a production ordinal without evidence',
        'promoting physical counterclockwise inference to production direction',
        'promoting any branch/name/slot match to semantic authority or readiness',
        'closing a top-level blocker or admitting an independent witness',
        'mutating predecessor artifacts, source bytes, or the protected derived asset',
        'introducing generated timestamps or network acquisition during materialization',
      ],
    },
    materializer: MATERIALIZER_PATH,
    checker: 'scripts/check-' + SCHEMA + '.mjs',
    negativeChecker: 'scripts/check-' + SCHEMA + '-negative-v0.mjs',
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
    'evidence.json': evidence,
    'binding-matrix.json': bindingMatrix,
    'lineage-assessment.json': artifact.lineageAssessment,
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

export function buildBundle(root = ROOT, options = {}) {
  return buildArtifact(root, options)
}

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
    composedBindingCount: result.artifact.bindingMatrix.coverage.composedSourceBindingCount,
    directSingleWitnessFullBindingCount: result.artifact.bindingMatrix.coverage.directSingleWitnessFullBindingCount,
    blockersClosed: result.artifact.graphImpact.blockersClosed,
    completeByteSha256: result.completeSha256,
  }, null, 2))
}
