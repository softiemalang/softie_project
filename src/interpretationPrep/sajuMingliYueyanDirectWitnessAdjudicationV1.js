import { createHash } from 'node:crypto'

import { canonicalIdentityJson } from '../artifactIdentity.js'
import {
  GATE_KEYS,
  INDEPENDENCE_AXES,
  MINGLI_YUEYAN_ITEM,
  MIRROR_LOCATOR,
  P0_FIELDS,
} from './sajuMingliYueyanFirstPartyInspection.js'

export { P0_FIELDS }

export const SAJU_MINGLI_YUEYAN_DIRECT_WITNESS_SCHEMA = 'saju-mingli-yueyan-direct-witness-adjudication-v1'
export const SAJU_MINGLI_YUEYAN_DIRECT_WITNESS_VERSION = '1.0.0'
export const PREDECESSOR_ARTIFACT_PATH = 'artifacts/saju-mingli-yueyan-first-party-inspection-v0/complete.json'
export const PARENT_ARTIFACT_PATH = 'artifacts/saju-gemini-v7-parent-adjudication/complete.json'
export const TYPED_READINESS_ARTIFACT_PATH = 'artifacts/saju-five-classics-typed-readiness-contract-v0/complete.json'

const sha256 = value => createHash('sha256').update(value).digest('hex')
const canonicalHash = value => sha256(Buffer.from(canonicalIdentityJson(value)))
const isHash = value => /^[0-9a-f]{64}$/.test(value || '')

const directCapturePolicy = 'The supplied images are visual captures of the NLC record and official reader surface. They admit only what is visibly tied to the stated NLC item and reader page; they are not the underlying official page-image or PDF bytes.'
const rawPagePolicy = 'A screenshot can establish a bounded direct visual observation, but not raw page-byte identity, physical-copy collation, edition lineage, independent semantic corroboration, or production authority.'
const mirrorPolicy = 'The Commons derivative remains a locator-only mirror and is not promoted by the new official-reader captures.'

export const NLC_READER_SCREENSHOT_EVIDENCE = Object.freeze([
  {
    evidenceId: 'ev.mingli-yueyan.nlc-record-screenshot-2026-08-20',
    sourceCategory: 'USER_SUPPLIED_CAPTURE_OF_FIRST_PARTY_NLC_RECORD',
    sourceId: MINGLI_YUEYAN_ITEM.sourceId,
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 5.35.46.png',
    sha256: 'c32a7b513ea1a38875b525c0f28dbf18d02117a07901b0f14c20f9ac23c2de65',
    byteLength: 310082,
    pixelWidth: 2420,
    pixelHeight: 1314,
    directVisualObservation: true,
    observed: {
      breadcrumb: '首页 > 民国时期文献 > 民国图书 > 资源详情',
      titleCatalog: '精选命理约言',
      titleCover: '精選命理約言',
      carrier: '1册',
      publicationDate: '民国二十四年[1935]',
      publisher: '韦氏命苑[发行者]',
      subject: '命书',
      responsible: '(清)陈素庵原著',
    },
    scopeBoundary: 'This closes the visible NLC item-record identity and recorded bibliographic fields only. It does not prove physical production date, textual lineage, or timing semantics.',
  },
  {
    evidenceId: 'ev.mingli-yueyan.nlc-reader-page-85',
    sourceCategory: 'USER_SUPPLIED_CAPTURE_OF_FIRST_PARTY_NLC_READER',
    sourceId: MINGLI_YUEYAN_ITEM.sourceId,
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 5.32.12.png',
    sha256: '098b93b39aff7dd7109532e4cb968b69be33180c06fc2a507501c1a8e2dcd386',
    byteLength: 720617,
    pixelWidth: 2472,
    pixelHeight: 1738,
    directVisualObservation: true,
    readerPage: 85,
    totalReaderPages: 185,
    printedFolio: '二',
    readerBookmark: '3 行运赋',
    pageHeading: '精選命理約言 卷二 賦',
    observedTextFragments: [],
    scopeBoundary: 'Surrounding-page context for the captured 行運賦 spread. No P0 literal is admitted from this capture alone.',
  },
  {
    evidenceId: 'ev.mingli-yueyan.nlc-reader-page-86',
    sourceCategory: 'USER_SUPPLIED_CAPTURE_OF_FIRST_PARTY_NLC_READER',
    sourceId: MINGLI_YUEYAN_ITEM.sourceId,
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 5.33.36.png',
    sha256: '8a4829fcf965688349cd405b719eb5a17efff2ce0892c3597090f9f8ccd5ef7d',
    byteLength: 696282,
    pixelWidth: 2630,
    pixelHeight: 1692,
    directVisualObservation: true,
    readerPage: 86,
    totalReaderPages: 185,
    printedFolio: '三',
    readerBookmark: '3 行运赋',
    pageHeading: '精選命理約言 卷二 賦',
    observedTextFragments: [
      '遞行前月後月之建。',
      '以男女為別。乃分順行逆行之端。',
      '男生陽年。女生陰年。則從已往詳觀。',
      '計生辰之離節。凡有幾日。',
      '一日則為四月。',
      '三日則為一歲。',
    ],
    scopeBoundary: 'These are page-specific visual readings. They establish bounded fragments/literals, not a complete procedure or semantic/production authority.',
  },
  {
    evidenceId: 'ev.mingli-yueyan.nlc-reader-page-87',
    sourceCategory: 'USER_SUPPLIED_CAPTURE_OF_FIRST_PARTY_NLC_READER',
    sourceId: MINGLI_YUEYAN_ITEM.sourceId,
    screenshotPath: '/Users/softie/Desktop/스크린샷 2026-08-20 오후 5.35.09.png',
    sha256: 'c2b033458986e84c3802618dbb2fe43244551923391a035477dec575fe147b1b',
    byteLength: 774299,
    pixelWidth: 2590,
    pixelHeight: 1734,
    directVisualObservation: true,
    readerPage: 87,
    totalReaderPages: 185,
    printedFolio: '四',
    readerBookmark: '3 行运赋',
    pageHeading: '精選命理約言 卷二 賦',
    observedTextFragments: [
      '一運管十年。',
    ],
    scopeBoundary: 'This confirms a bounded surrounding 行運賦 literal only. It does not add a requested P0 field or close the complete start-rule procedure.',
  },
])

export const P0_FIELD_DECISIONS = Object.freeze({
  起運法: {
    directObservation: false,
    status: 'unresolved_no_complete_start_procedure',
    literal: null,
    observedFragments: [],
    evidenceRefs: [
      'ev.mingli-yueyan.nlc-reader-page-85',
      'ev.mingli-yueyan.nlc-reader-page-86',
      'ev.mingli-yueyan.nlc-reader-page-87',
    ],
    scope: 'The captured spread is direct 行運賦 context, but it does not visibly supply a complete start-age/start-date procedure under the 起運法 field.',
  },
  順逆: {
    directObservation: true,
    status: 'bounded_direct_fragment_not_promoted',
    literal: null,
    observedFragments: [
      '以男女為別。乃分順行逆行之端。',
      '男生陽年。女生陰年。則從已往詳觀。',
    ],
    evidenceRefs: ['ev.mingli-yueyan.nlc-reader-page-86'],
    scope: 'The page directly shows a sex/year direction fragment. It does not establish an unqualified complete direction matrix beyond the visible wording.',
  },
  節選択: {
    directObservation: true,
    status: 'partial_direct_fragments_not_promoted',
    literal: null,
    observedFragments: [
      '遞行前月後月之建。',
      '計生辰之離節。凡有幾日。',
    ],
    evidenceRefs: ['ev.mingli-yueyan.nlc-reader-page-86'],
    scope: 'The page directly mentions preceding/next month construction and distance from the 節. It does not visibly specify the complete named-jie selection algorithm or all boundary cases.',
  },
  三日一歲: {
    directObservation: true,
    status: 'bounded_direct_literal_not_promoted',
    literal: '三日則為一歲。',
    observedFragments: ['三日則為一歲。'],
    evidenceRefs: ['ev.mingli-yueyan.nlc-reader-page-86'],
    scope: 'The exact literal is directly visible on the stated NLC reader page. It is not promoted to a general calculation procedure or production rule.',
  },
  一日四月: {
    directObservation: true,
    status: 'bounded_direct_literal_not_promoted',
    literal: '一日則為四月。',
    observedFragments: ['一日則為四月。'],
    evidenceRefs: ['ev.mingli-yueyan.nlc-reader-page-86'],
    scope: 'The exact literal is directly visible on the stated NLC reader page. It is not promoted to a general calculation procedure or production rule.',
  },
  一時辰十日: {
    directObservation: false,
    status: 'unresolved_not_observed_in_captured_spread',
    literal: null,
    observedFragments: [],
    evidenceRefs: [
      'ev.mingli-yueyan.nlc-reader-page-85',
      'ev.mingli-yueyan.nlc-reader-page-86',
      'ev.mingli-yueyan.nlc-reader-page-87',
    ],
    scope: 'The exact 一時辰十日 literal is not visible in the supplied p.85–87 captures. This is not a whole-volume negative.',
  },
  workedExample: {
    directObservation: false,
    status: 'unresolved_not_observed_in_captured_spread',
    literal: null,
    observedFragments: [],
    evidenceRefs: [
      'ev.mingli-yueyan.nlc-reader-page-85',
      'ev.mingli-yueyan.nlc-reader-page-86',
      'ev.mingli-yueyan.nlc-reader-page-87',
    ],
    scope: 'No worked example is visible in the supplied p.85–87 captures. This is not a whole-volume negative.',
  },
})

const buildP0Fields = () => P0_FIELDS.map(field => {
  const decision = P0_FIELD_DECISIONS[field]
  return {
    field,
    source: MINGLI_YUEYAN_ITEM.sourceId,
    directObservation: decision.directObservation,
    status: decision.status,
    completeRule: false,
    literal: decision.literal,
    observedFragments: [...decision.observedFragments],
    evidenceRefs: [...decision.evidenceRefs],
    locator: {
      readerUrl: MINGLI_YUEYAN_ITEM.readerUrl,
      readerPages: [85, 86, 87],
      directFieldPage: decision.directObservation ? 86 : null,
      directFieldPrintedFolio: decision.directObservation ? '三' : null,
      totalReaderPages: 185,
    },
    semanticAuthority: 'not_established',
    productionAuthority: false,
    scope: decision.scope,
    wholeVolumeNegative: false,
  }
})

const countStates = (claims, key) => Object.fromEntries(
  ['satisfied', 'unresolved', 'conflicted', 'not_applicable'].map(state => [
    state,
    claims.filter(claim => claim.gates?.[key]?.state === state).length,
  ]),
)

export function recomputeTypedReadiness(baseline) {
  const claims = baseline?.claims || []
  const before = Object.fromEntries(GATE_KEYS.map(key => [key, countStates(claims, key)]))
  const after = structuredClone(before)
  return {
    sourceArtifact: TYPED_READINESS_ARTIFACT_PATH,
    method: 'Official reader literals are retained as source-specific observations; no typed H/E/L/S/I/P gate is changed without complete procedure, lineage, and semantic authority.',
    before,
    after,
    changedGateStates: [],
    baselineClaimCount: claims.length,
    baselinePromotionReadyClaimIds: claims.filter(claim => claim.promotion?.ready === true).map(claim => claim.claimId),
    promotionReadyClaimIds: [],
    stableClaimPromotionCount: 0,
    availableForInterpretation: false,
    semanticAuthority: 'not_established',
    implementationSafeGrounding: 'not_established',
    productionActivation: 'blocked',
    reason: 'Direct page literals narrow the observation boundary but do not close the complete seven-field procedure or the separate provenance/semantic gates.',
  }
}

const claimStatusCounts = claims => Object.fromEntries(
  ['kept', 'corrected', 'rejected', 'unresolved'].map(status => [
    status,
    claims.filter(claim => claim.status === status).length,
  ]),
)

const parentReference = parentV7 => ({
  artifactPath: PARENT_ARTIFACT_PATH,
  schemaVersion: parentV7?.schemaVersion || null,
  version: parentV7?.version || null,
  basisHead: parentV7?.basisHead || null,
  contentSha256: parentV7?.contentSha256 || null,
  artifactPayloadSha256: parentV7?.artifactIdentity?.artifactPayloadSha256 || null,
  claimCount: parentV7?.claims?.length || 0,
  statusCounts: claimStatusCounts(parentV7?.claims || []),
  unchanged: true,
})

const predecessorReference = predecessorV0 => ({
  artifactPath: PREDECESSOR_ARTIFACT_PATH,
  schemaVersion: predecessorV0?.schemaVersion || null,
  version: predecessorV0?.version || null,
  basisHead: predecessorV0?.basisHead || null,
  contentSha256: predecessorV0?.contentSha256 || null,
  artifactPayloadSha256: predecessorV0?.artifactIdentity?.artifactPayloadSha256 || null,
  priorTargetPageStatus: predecessorV0?.targetPageReconciliation?.firstPartyTargetPageStatus || null,
  priorUnresolvedP0FieldCount: predecessorV0?.summary?.unresolvedP0FieldCount || null,
  preserved: true,
})

const buildClaimReconciliation = parentV7 => (parentV7?.claims || []).map(claim => {
  const isMingliClaim = claim.claimId === 'claim.E.mingli-yueyan-direct-observation'
  return {
    claimId: claim.claimId,
    statusBefore: claim.status,
    statusAfter: claim.status,
    preserved: true,
    addedEvidenceRefs: isMingliClaim
      ? [
        'ev.mingli-yueyan.nlc-record-screenshot-2026-08-20',
        'ev.mingli-yueyan.nlc-reader-page-85',
        'ev.mingli-yueyan.nlc-reader-page-86',
        'ev.mingli-yueyan.nlc-reader-page-87',
      ]
      : [],
    scopeDelta: isMingliClaim
      ? 'The official reader captures add bounded direct observations for 順逆, 節 fragments, 三日則為一歲, and 一日則為四月. The parent claim remains unresolved because 起運法 as a complete procedure, 一時辰十日, workedExample, raw page bytes, edition lineage, and semantic authority are not closed.'
      : 'No status or gate mutation; parent adjudication is preserved byte-for-byte.',
  }
})

const buildEvidence = () => [
  ...NLC_READER_SCREENSHOT_EVIDENCE.map(item => structuredClone({
    ...item,
    underlyingOfficialPageBytesObtained: false,
    scopeBoundary: item.scopeBoundary,
  })),
  {
    evidenceId: 'ev.mingli-yueyan.mirror-preserved-locator-only',
    sourceCategory: MIRROR_LOCATOR.sourceCategory,
    sourceId: MINGLI_YUEYAN_ITEM.sourceId,
    mirror: structuredClone(MIRROR_LOCATOR),
    directObservation: false,
    scopeBoundary: mirrorPolicy,
  },
]

export function contentHash(artifact) {
  const copy = structuredClone(artifact)
  delete copy.contentSha256
  delete copy.artifactIdentity
  return canonicalHash(copy)
}

export function buildSajuMingliYueyanDirectWitnessAdjudication({
  basisHead,
  predecessorV0,
  parentV7,
  typedReadinessBaseline,
} = {}) {
  if (!/^[0-9a-f]{40}$/.test(basisHead || '')) throw new Error('命理約言 direct witness adjudication requires a valid basis HEAD')
  if (!predecessorV0?.summary || !parentV7?.claims || !typedReadinessBaseline?.claims) {
    throw new Error('命理約言 direct witness adjudication requires predecessor, parent, and typed-readiness artifacts')
  }

  const fields = buildP0Fields()
  const directFields = fields.filter(field => field.directObservation)
  const parentEdges = (parentV7.lineageGraph?.edges || []).map(edge => ({ ...edge, canonicalGraphIncluded: false }))
  const typedReadinessRecalculation = recomputeTypedReadiness(typedReadinessBaseline)
  const claimReconciliation = buildClaimReconciliation(parentV7)

  const artifact = {
    schemaVersion: SAJU_MINGLI_YUEYAN_DIRECT_WITNESS_SCHEMA,
    version: SAJU_MINGLI_YUEYAN_DIRECT_WITNESS_VERSION,
    basisHead,
    predecessor: predecessorReference(predecessorV0),
    scope: {
      sourceOfTruth: 'The NLC institutional record screenshot and the supplied captures of the official NLC reader for p.85–87 are admitted as direct visual observations at their stated page boundaries. The v0 inspection and Gemini v7 parent remain preserved baselines.',
      directInspectionCompleted: ['NLC item/detail record capture', 'NLC official reader p.85 capture', 'NLC official reader p.86 capture', 'NLC official reader p.87 capture'],
      directPageScope: 'The captures bind the visible 行運賦 spread to NLC data_416 / 17jh002578 / 109774.0 and expose bounded page-specific literals. They do not provide the underlying official page-image/PDF bytes or a complete seven-field procedure.',
      candidateBoundary: 'The Commons PDF and all prior candidate text remain locator or comparison material only. No mirror, OCR, e-text, or semantic reconstruction is imported as canonical evidence.',
      prohibited: [
        'screenshot-to-raw-page-byte identity',
        'recorded date-to-physical-production-date inference',
        'bounded fragment-to-complete-rule inference',
        'single literal-to-production procedure promotion',
        'absence from p.85–87-to-whole-volume negative',
        'reader capture-to-independent-lineage promotion',
        'semantic-authority promotion',
        'production activation',
      ],
    },
    evidencePolicy: {
      directCapturePolicy,
      rawPagePolicy,
      mirrorPolicy,
      ocr: 'locator_only',
      readerCapture: 'direct_visual_observation_bounded',
      underlyingPageBytes: 'required_for_byte_level_witness_identity',
      completeP0Rule: 'required_for_field closure and implementation',
      noWholeVolumeNegative: true,
    },
    candidatePacket: {
      trustBoundary: 'untrusted_candidate_only',
      importedAsCanonicalEvidence: false,
      importedConclusionFields: [],
      staleParentRejectedClaimsReintroduced: false,
    },
    firstPartyItem: {
      ...MINGLI_YUEYAN_ITEM,
      identityStatus: 'confirmed_item_and_reader_binding',
      witnessStatus: 'bounded_direct_reader_observation_not_full_physical_textual_witness',
      bibliographicDateStatus: 'first_party_recorded_value_only',
      physicalProductionDateStatus: 'unresolved',
      readerObservationStatus: 'direct_visual_capture_of_official_reader',
      underlyingOfficialPageBytesObtained: false,
      readerPagesObserved: [85, 86, 87],
      readerTotalPages: 185,
      pageFoliosObserved: ['二', '三', '四'],
      screenshotEvidenceIds: NLC_READER_SCREENSHOT_EVIDENCE.map(item => item.evidenceId),
    },
    externalEvidence: buildEvidence(),
    mirrorLocator: {
      ...structuredClone(MIRROR_LOCATOR),
      physicalWitnessAdmitted: false,
      independentWitnessCount: 0,
      scopeBoundary: mirrorPolicy,
    },
    targetPageReconciliation: {
      requestedHeading: '行運賦 / 起運 timing fields',
      firstPartyTargetPageStatus: 'direct_visual_observation_bounded',
      officialTargetPageLocator: {
        readerUrl: MINGLI_YUEYAN_ITEM.readerUrl,
        readerPages: [85, 86, 87],
        printedFolios: ['二', '三', '四'],
        totalReaderPages: 185,
      },
      officialTargetPageBytesObtained: false,
      userSuppliedCaptureBytesObtained: true,
      fields,
      directTargetPageObservationCount: 3,
      directTimingObservationCount: directFields.length,
      directlyObservedP0FieldCount: directFields.length,
      completeP0FieldClosureCount: 0,
      unresolvedP0FieldCount: fields.length,
      workedExampleStatus: 'unresolved_not_observed_in_captured_spread',
      noWholeVolumeNegative: true,
      reason: 'The official reader captures reduce the target-page access blocker to a bounded visual observation, but raw page bytes, complete rule scope, worked example, and independent provenance/semantic gates remain open.',
    },
    sourceClaimReconciliation: {
      parentArtifact: parentReference(parentV7),
      claims: claimReconciliation,
      kept: claimReconciliation.filter(item => item.statusAfter === 'kept').map(item => item.claimId),
      corrected: claimReconciliation.filter(item => item.statusAfter === 'corrected').map(item => item.claimId),
      rejected: claimReconciliation.filter(item => item.statusAfter === 'rejected').map(item => item.claimId),
      unresolved: claimReconciliation.filter(item => item.statusAfter === 'unresolved').map(item => item.claimId),
      statusMutation: false,
      candidateClaimsNotImported: true,
      newBoundedObservations: [
        'obs.mingli-yueyan.nlc-reader-page-85-context',
        'obs.mingli-yueyan.nlc-reader-page-86-direction-and-timing-literals',
        'obs.mingli-yueyan.nlc-reader-page-87-ten-year-context',
      ],
    },
    digitalPhysicalRelationshipAudit: {
      relationTypes: [...INDEPENDENCE_AXES],
      separated: true,
      axes: [
        {
          axis: 'physical-item',
          state: 'bounded_observation',
          countedAsIndependent: false,
          observation: 'The NLC record and reader page captures bind p.85–87 to the identified NLC item, but no physical copy, call number, or original leaf byte identity was established.',
          missingEdges: ['physical copy or call number', 'raw target leaf/page identity'],
        },
        {
          axis: 'digital-derivation',
          state: 'unresolved',
          countedAsIndependent: false,
          observation: 'The supplied images are screenshots of the official reader surface, not the underlying NLC page-image/PDF bytes or an authorized derivation manifest.',
          missingEdges: ['official page-image/PDF bytes', 'authorized derivation proof'],
        },
        {
          axis: 'edition/textual-lineage',
          state: 'unresolved',
          countedAsIndependent: false,
          observation: 'The NLC record supplies a 1935 recorded date, publisher, title, and responsible person, but the captured spread does not close imprint/colophon or relation to another 命理約言 witness.',
          missingEdges: ['title-page/colophon/imprint inspection', 'edition and textual-lineage record'],
        },
        {
          axis: 'semantic-corroboration',
          state: 'unresolved',
          countedAsIndependent: false,
          observation: 'The captures directly show source-specific wording, but no independent semantic oracle or complete procedure binds those literals to production interpretation.',
          missingEdges: ['independent semantic corroboration', 'complete rule reconciliation'],
        },
      ],
      overallState: 'unresolved',
      canonicalTransmissionEdges: [],
      rule: 'Direct visual observation is not independently counted until physical-item, digital-derivation, edition/textual-lineage, and semantic-corroboration edges are separately closed.',
    },
    lineageGraph: {
      inheritedFromParent: PARENT_ARTIFACT_PATH,
      policy: 'The parent graph and v0 blocker remain preserved. No screenshot-derived transmission edge is canonical.',
      edges: parentEdges,
      canonicalEdges: [],
      newlyAddedEdges: [],
      decontaminationPreserved: true,
    },
    timingReconciliation: {
      status: 'bounded_direct_observations_without_complete_rule_or_authority',
      fields: structuredClone(fields),
      observedLiterals: [
        {
          literal: '一日則為四月。',
          field: '一日四月',
          evidenceRef: 'ev.mingli-yueyan.nlc-reader-page-86',
        },
        {
          literal: '三日則為一歲。',
          field: '三日一歲',
          evidenceRef: 'ev.mingli-yueyan.nlc-reader-page-86',
        },
      ],
      observedFragments: [
        {
          fragments: ['以男女為別。乃分順行逆行之端。', '男生陽年。女生陰年。則從已往詳觀。'],
          field: '順逆',
          evidenceRef: 'ev.mingli-yueyan.nlc-reader-page-86',
        },
        {
          fragments: ['遞行前月後月之建。', '計生辰之離節。凡有幾日。'],
          field: '節選択',
          evidenceRef: 'ev.mingli-yueyan.nlc-reader-page-86',
        },
      ],
      notPromoted: [
        '起運法 as a complete start procedure',
        '節選択 as a complete named-jie selection algorithm',
        '一時辰十日',
        'workedExample',
        'any rounding or calendar conversion',
        'any production timing implementation',
      ],
      implementationBoundary: 'No direct literal is converted into a generalized calculator, semantic authority, or production rule by this artifact.',
    },
    typedReadinessRecalculation,
    blockers: [
      'raw_official_target_page_bytes_not_obtained',
      'physical_copy_or_call_number_not_established',
      'edition_and_textual_lineage_not_closed',
      'complete_seven_field_procedure_not_closed',
      'independent_semantic_corroboration_not_established',
    ],
    readiness: {
      availableForInterpretation: false,
      productionActivation: 'blocked',
      semanticAuthority: 'not_established',
      implementationSafeGrounding: 'not_established',
      stableClaimPromotionCount: 0,
      promotionReadyClaimIds: [],
      status: 'blocked',
      reason: 'The NLC reader captures close only a bounded direct-visual observation frontier. They do not close complete P0 procedure, raw page-byte identity, edition lineage, semantic authority, or production readiness.',
    },
    promotion: {
      status: 'blocked',
      ready: false,
      stableClaimPromotionCount: 0,
      promotionReadyClaimIds: [],
      semanticAuthorityChanged: false,
      productionChanged: false,
      interpretationAvailable: false,
      scope: 'Directly observed literals are retained as bounded source evidence only. No P0 field, transmission edge, claim, procedure, or production activation is promoted.',
      blockingEdges: [
        'raw-official-target-page-bytes:unresolved',
        'physical-copy-or-call-number:unresolved',
        'edition/textual-lineage:unresolved',
        'complete-seven-field-procedure:unresolved',
        'semantic-corroboration:unresolved',
      ],
    },
    negativeChecks: {
      allMustReject: true,
      ids: [
        'reader-capture-to-raw-page-bytes',
        'recorded-date-to-physical-production-date',
        'bounded-direction-fragment-to-complete-rule',
        'numeric-literal-to-production-procedure',
        'unobserved-time-unit-to-observation',
        'unobserved-worked-example-to-observation',
        'reader-capture-to-independent-lineage',
        'direct-observation-to-semantic-authority',
        'direct-observation-to-promotion',
      ],
      scope: 'The checker rejects promoting a capture, metadata, bounded fragment, literal, or page-limited absence beyond its stated evidence boundary.',
    },
    summary: {
      firstPartyItemIdentityConfirmed: true,
      firstPartyReaderPagesObserved: true,
      firstPartyTargetPageObtained: false,
      underlyingOfficialPageBytesObtained: false,
      directTargetPageObservationCount: 3,
      directTimingObservationCount: directFields.length,
      directlyObservedP0FieldCount: directFields.length,
      completeP0FieldClosureCount: 0,
      requestedP0FieldCount: P0_FIELDS.length,
      unresolvedP0FieldCount: fields.length,
      canonicalTransmissionEdgeCount: 0,
      promotionCount: 0,
      blockerCount: 5,
      parentClaimStatusCountsBefore: claimStatusCounts(parentV7.claims),
      parentClaimStatusCountsAfter: claimStatusCounts(parentV7.claims),
      typedReadinessBefore: typedReadinessRecalculation.before,
      typedReadinessAfter: typedReadinessRecalculation.after,
    },
    contentSha256: null,
  }

  artifact.contentSha256 = contentHash(artifact)
  return artifact
}

const isObject = value => Boolean(value && typeof value === 'object' && !Array.isArray(value))

export function checkSajuMingliYueyanDirectWitnessAdjudication(artifact) {
  const errors = []
  const fail = value => errors.push(value)
  if (!isObject(artifact)) return ['artifact_shape_invalid']
  if (artifact.schemaVersion !== SAJU_MINGLI_YUEYAN_DIRECT_WITNESS_SCHEMA) fail('schema_version')
  if (artifact.version !== SAJU_MINGLI_YUEYAN_DIRECT_WITNESS_VERSION) fail('version')
  if (artifact.candidatePacket?.trustBoundary !== 'untrusted_candidate_only') fail('candidate_trust_boundary')
  if (artifact.candidatePacket?.importedAsCanonicalEvidence !== false || artifact.candidatePacket?.staleParentRejectedClaimsReintroduced !== false) fail('candidate_import_boundary')
  if (artifact.evidencePolicy?.readerCapture !== 'direct_visual_observation_bounded' || artifact.evidencePolicy?.underlyingPageBytes !== 'required_for_byte_level_witness_identity') fail('evidence_policy')
  if (artifact.firstPartyItem?.identityStatus !== 'confirmed_item_and_reader_binding') fail('item_identity_scope')
  if (artifact.firstPartyItem?.witnessStatus !== 'bounded_direct_reader_observation_not_full_physical_textual_witness') fail('witness_scope')
  if (artifact.firstPartyItem?.physicalProductionDateStatus !== 'unresolved' || artifact.firstPartyItem?.underlyingOfficialPageBytesObtained !== false) fail('date_or_byte_scope')
  if (JSON.stringify(artifact.firstPartyItem?.readerPagesObserved) !== JSON.stringify([85, 86, 87])) fail('reader_page_scope')
  if (!Array.isArray(artifact.externalEvidence) || artifact.externalEvidence.length !== 5) fail('evidence_count')
  for (const item of NLC_READER_SCREENSHOT_EVIDENCE) {
    const found = artifact.externalEvidence.find(evidence => evidence.evidenceId === item.evidenceId)
    if (!found || found.sha256 !== item.sha256 || !isHash(found.sha256) || found.directVisualObservation !== true || found.underlyingOfficialPageBytesObtained !== false) fail('screenshot_evidence:' + item.evidenceId)
  }
  if (artifact.targetPageReconciliation?.firstPartyTargetPageStatus !== 'direct_visual_observation_bounded') fail('target_page_status')
  if (artifact.targetPageReconciliation?.officialTargetPageBytesObtained !== false || artifact.targetPageReconciliation?.userSuppliedCaptureBytesObtained !== true) fail('target_page_byte_boundary')
  if (artifact.targetPageReconciliation?.directTargetPageObservationCount !== 3 || artifact.targetPageReconciliation?.directTimingObservationCount !== 4) fail('target_page_counts')
  if (artifact.targetPageReconciliation?.completeP0FieldClosureCount !== 0 || artifact.targetPageReconciliation?.unresolvedP0FieldCount !== P0_FIELDS.length || artifact.targetPageReconciliation?.noWholeVolumeNegative !== true) fail('target_page_closure_counts')
  if (!Array.isArray(artifact.targetPageReconciliation?.fields) || artifact.targetPageReconciliation.fields.length !== P0_FIELDS.length) fail('p0_field_count')
  for (const field of artifact.targetPageReconciliation?.fields || []) {
    const expected = P0_FIELD_DECISIONS[field.field]
    if (!expected || field.directObservation !== expected.directObservation || field.status !== expected.status || field.completeRule !== false || field.semanticAuthority !== 'not_established' || field.productionAuthority !== false || field.wholeVolumeNegative !== false) fail('p0_field_boundary:' + field.field)
    if (field.literal !== expected.literal || JSON.stringify(field.observedFragments) !== JSON.stringify(expected.observedFragments)) fail('p0_field_literal:' + field.field)
  }
  if (artifact.mirrorLocator?.physicalWitnessAdmitted !== false || artifact.mirrorLocator?.independentWitnessCount !== 0 || artifact.mirrorLocator?.sourceCategory !== 'MIRROR_DERIVED_LOCATOR_ONLY') fail('mirror_promoted')
  if (artifact.sourceClaimReconciliation?.statusMutation !== false || artifact.sourceClaimReconciliation?.candidateClaimsNotImported !== true) fail('parent_reconciliation_boundary')
  for (const claim of artifact.sourceClaimReconciliation?.claims || []) if (claim.statusBefore !== claim.statusAfter || claim.preserved !== true) fail('parent_claim_changed:' + claim.claimId)
  if (!artifact.digitalPhysicalRelationshipAudit?.separated) fail('independence_axes_mixed')
  if (JSON.stringify(artifact.digitalPhysicalRelationshipAudit?.relationTypes) !== JSON.stringify(INDEPENDENCE_AXES)) fail('independence_axis_set')
  for (const axis of artifact.digitalPhysicalRelationshipAudit?.axes || []) if (axis.countedAsIndependent === true) fail('independence_inflated:' + axis.axis)
  if (artifact.digitalPhysicalRelationshipAudit?.canonicalTransmissionEdges?.length !== 0 || artifact.lineageGraph?.canonicalEdges?.length !== 0 || artifact.lineageGraph?.newlyAddedEdges?.length !== 0) fail('lineage_promoted')
  if (artifact.timingReconciliation?.status !== 'bounded_direct_observations_without_complete_rule_or_authority') fail('timing_scope')
  if (artifact.timingReconciliation?.fields?.some(field => field.completeRule === true || field.productionAuthority === true)) fail('timing_field_promoted')
  if (artifact.readiness?.availableForInterpretation !== false || artifact.readiness?.productionActivation !== 'blocked' || artifact.readiness?.semanticAuthority !== 'not_established') fail('readiness_open')
  if (artifact.promotion?.stableClaimPromotionCount !== 0 || artifact.promotion?.promotionReadyClaimIds?.length !== 0 || artifact.promotion?.semanticAuthorityChanged !== false || artifact.promotion?.productionChanged !== false) fail('promotion_side_effect')
  if (JSON.stringify(artifact.typedReadinessRecalculation?.before) !== JSON.stringify(artifact.typedReadinessRecalculation?.after) || artifact.typedReadinessRecalculation?.changedGateStates?.length !== 0) fail('typed_readiness_changed')
  if (artifact.negativeChecks?.allMustReject !== true) fail('negative_checks_missing')
  if (artifact.contentSha256 !== contentHash(artifact)) fail('content_hash')
  return [...new Set(errors)].sort()
}
