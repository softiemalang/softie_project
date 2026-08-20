import { createHash } from 'node:crypto'

import { canonicalIdentityJson } from '../artifactIdentity.js'

export const SAJU_MINGLI_YUEYAN_SCHEMA = 'saju-mingli-yueyan-first-party-inspection-v0'
export const SAJU_MINGLI_YUEYAN_VERSION = '0.1.0'

export const GATE_KEYS = Object.freeze(['H', 'E', 'L', 'S', 'I', 'P'])
export const GATE_STATES = Object.freeze(['satisfied', 'unresolved', 'conflicted', 'not_applicable'])
export const CLAIM_STATUSES = Object.freeze(['kept', 'corrected', 'rejected', 'unresolved'])
export const INDEPENDENCE_AXES = Object.freeze([
  'physical-item',
  'digital-derivation',
  'edition/textual-lineage',
  'semantic-corroboration',
])

const sha256 = value => createHash('sha256').update(value).digest('hex')
const canonicalHash = value => sha256(Buffer.from(canonicalIdentityJson(value)))

const directPolicy = 'First-party item metadata and first-party cover/reader responses are admitted only at their stated URL and response boundary. They do not substitute for an authorized target-page image, physical-copy identity, semantic authority, or production procedure.'
const mirrorPolicy = 'A mirror or derivative scan may supply a locator lead only. It is not admitted as the NLC physical witness, direct first-party page evidence, independent corroboration, or production authority.'

export const MINGLI_YUEYAN_ITEM = Object.freeze({
  sourceId: 'source.nlc.mingli-yueyan.data-416.17jh002578',
  institution: '中国国家图书馆 / National Library of China',
  recordUrl: 'http://read.nlc.cn/allSearch/searchDetail?searchType=24&showType=1&indexName=data_416&fid=17jh002578',
  readerUrl: 'http://read.nlc.cn/OutOpenBook/OpenObjectBook?aid=416&bid=109774.0',
  coverUrl: 'http://read.nlc.cn/img2/img416/20210319095443/17jh002578_001.jpg',
  indexName: 'data_416',
  identifier: '17jh002578',
  dataId: '109774.0',
  serviceId: '4',
  titleCatalog: '精选命理约言',
  titleCover: '精選命理約言',
  responsible: '(清)陈素庵原著',
  publicationDateRecorded: '民国二十四年[1935]',
  publisherRecorded: '韦氏命苑[发行者]',
  extentRecorded: '1册',
  subjectRecorded: '命书',
  sourcePdfPathRecordedByReader: 'data06/2020mgts/duixiang/pdf/17jh002578/001/17jh002578_001.pdf',
})

export const FIRST_PARTY_ACCESS = Object.freeze({
  record: {
    httpStatus: 200,
    bodySha256: '5ae24bf0f59ac237ccddd82f0a5f0c1fa84ac0ac9ef773f4d70760b7f299bd63',
    byteLength: 25547,
    observedFields: ['data_416', '17jh002578', '精选命理约言', '民国二十四年[1935]', '韦氏命苑[发行者]', '1册', '(清)陈素庵原著', '命书'],
  },
  cover: {
    httpStatus: 200,
    bodySha256: '7c39ff937825a211ba26a475aa08cb3df850a7a440f9a9a6a1d0df5cc57d0123',
    byteLength: 12569,
    contentType: 'image/jpeg',
    directObservation: 'The official NLC cover image visibly shows 精選命理約言.',
  },
  reader: {
    httpStatus: 200,
    bodySha256: '04c3db0fa03bfd0c618b03d2151d9dcefdf044e9c19e5685586b304b75dbc08c',
    byteLength: 14592,
    exposes: ['aid=416', 'bid=109774.0', 'permissionNew', 'data06/2020mgts/duixiang/pdf/17jh002578/001/17jh002578_001.pdf'],
  },
  permission: {
    httpStatus: 200,
    success: false,
    message: '对不起，您没有访问权限。。',
    accessState: 'target_page_blocked_by_first_party_permission',
  },
  directPdfEndpoint: {
    httpStatus: 404,
    accessState: 'recorded_path_not_publicly_retrievable_as_direct_pdf',
  },
})

export const MIRROR_LOCATOR = Object.freeze({
  sourceCategory: 'MIRROR_DERIVED_LOCATOR_ONLY',
  url: 'https://commons.wikimedia.org/wiki/File:NLC416-17jh002578-109774_%E7%B2%BE%E9%81%B8%E5%91%BD%E7%90%86%E7%B4%84%E8%A8%80.pdf',
  originalFileUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/NLC416-17jh002578-109774_%E7%B2%BE%E9%81%B8%E5%91%BD%E7%90%86%E7%B4%84%E8%A8%80.pdf',
  fileSha256: 'bb3952e09cb4aac8cd0778291f29c0100529e8e9e8cd0c4ee27118fbbc0922d5',
  byteLength: 4471099,
  pdfPageCount: 185,
  claimedSource: 'NLC data_416 / 17jh002578 / 109774',
  claimedPublicationDate: '民國二十四年[1935]',
  physicalWitnessAdmitted: false,
  independentWitnessCount: 0,
  scopeBoundary: mirrorPolicy,
  candidateTargetPages: [
    {
      mirrorPdfPage: 34,
      printedFolio: '一七',
      heading: '看運法一',
      observedCandidateLiterals: ['順行者行未來之月建', '逆行者行已往之月建'],
      status: 'mirror_locator_only',
    },
    {
      mirrorPdfPage: 35,
      printedFolio: '一八',
      heading: '看運法二',
      observedCandidateLiterals: ['初運管少年', '中運管中年', '末運管晚年'],
      status: 'mirror_locator_only',
    },
  ],
})

export const P0_FIELDS = Object.freeze([
  '起運法',
  '順逆',
  '節選択',
  '三日一歲',
  '一日四月',
  '一時辰十日',
  'workedExample',
])

const officialTargetField = field => ({
  field,
  directObservation: false,
  status: 'unresolved_target_page_access_blocked',
  source: MINGLI_YUEYAN_ITEM.sourceId,
  locator: null,
  literal: null,
  semanticAuthority: 'not_established',
  productionAuthority: false,
})

export const TARGET_PAGE_RECONCILIATION = Object.freeze({
  requestedHeading: '〈起運法〉',
  firstPartyTargetPageStatus: 'blocked',
  officialTargetPageLocator: null,
  officialTargetPageBytesObtained: false,
  fields: P0_FIELDS.map(officialTargetField),
  directTimingObservationCount: 0,
  workedExampleStatus: 'unresolved_target_page_access_blocked',
  noWholeVolumeNegative: true,
  reason: 'The first-party item and reader are identified, but the NLC reader permission endpoint denies the current external session and the recorded direct PDF path returns 404. The mirror candidate is retained only as a follow-up locator.',
})

const evidence = (evidenceId, category, status, details = {}) => ({
  evidenceId,
  sourceCategory: category,
  status,
  ...details,
  scopeBoundary: details.scopeBoundary || directPolicy,
})

export const EXTERNAL_EVIDENCE = Object.freeze([
  evidence('ev.mingli-yueyan.nlc-record', 'FIRST_PARTY_INSTITUTIONAL_RECORD', 'direct_item_identity_confirmed', {
    sourceId: MINGLI_YUEYAN_ITEM.sourceId,
    institution: MINGLI_YUEYAN_ITEM.institution,
    recordUrl: MINGLI_YUEYAN_ITEM.recordUrl,
    observed: {
      ...MINGLI_YUEYAN_ITEM,
      recordHttpStatus: FIRST_PARTY_ACCESS.record.httpStatus,
      recordBodySha256: FIRST_PARTY_ACCESS.record.bodySha256,
    },
    scopeBoundary: 'This closes the NLC item identity and its recorded bibliographic fields. It does not close physical-copy production date, target-page image access, or textual lineage.',
  }),
  evidence('ev.mingli-yueyan.nlc-cover', 'FIRST_PARTY_INSTITUTIONAL_IMAGE', 'direct_cover_observation', {
    sourceId: MINGLI_YUEYAN_ITEM.sourceId,
    imageUrl: MINGLI_YUEYAN_ITEM.coverUrl,
    httpStatus: FIRST_PARTY_ACCESS.cover.httpStatus,
    sha256: FIRST_PARTY_ACCESS.cover.bodySha256,
    observed: [FIRST_PARTY_ACCESS.cover.directObservation],
    scopeBoundary: 'The official cover image confirms the cover title only. Cover/title does not prove a target-page textual rule, physical production date, or transmission lineage.',
  }),
  evidence('ev.mingli-yueyan.nlc-reader-permission', 'FIRST_PARTY_READER_ACCESS', 'target_page_access_blocked', {
    sourceId: MINGLI_YUEYAN_ITEM.sourceId,
    readerUrl: MINGLI_YUEYAN_ITEM.readerUrl,
    readerHttpStatus: FIRST_PARTY_ACCESS.reader.httpStatus,
    permissionHttpStatus: FIRST_PARTY_ACCESS.permission.httpStatus,
    permissionSuccess: FIRST_PARTY_ACCESS.permission.success,
    permissionMessage: FIRST_PARTY_ACCESS.permission.message,
    directPdfEndpointHttpStatus: FIRST_PARTY_ACCESS.directPdfEndpoint.httpStatus,
    observed: ['Reader exposes bid 109774.0 and recorded PDF path.', 'permissionNew returns success=false for the current external session.', 'No authorized target-page bytes were obtained.'],
    scopeBoundary: 'Access failure is a blocker, not evidence that the target passage is absent. No whole-volume negative is emitted.',
  }),
  evidence('ev.mingli-yueyan.mirror-locator', 'MIRROR_DERIVED_LOCATOR', 'locator_only_not_admitted', {
    sourceId: MINGLI_YUEYAN_ITEM.sourceId,
    mirror: MIRROR_LOCATOR,
    observed: ['Mirror PDF p.34 visibly labels 看運法一 and prints direction/month-construction candidate text.', 'Mirror PDF p.35 visibly labels 看運法二 and prints initial/middle/late-cycle candidate text.', 'These pages did not close the requested 三日一歲 / 一日四月 / 一時辰十日 / 節-selection / worked-example fields at the candidate locator.'],
    scopeBoundary: mirrorPolicy,
  }),
])

const countStates = (claims, key) => Object.fromEntries(GATE_STATES.map(state => [state, claims.filter(claim => claim.gates?.[key]?.state === state).length]))

export function recomputeTypedReadiness(baseline) {
  const claims = baseline?.claims || []
  const before = Object.fromEntries(GATE_KEYS.map(key => [key, countStates(claims, key)]))
  const after = structuredClone(before)
  return {
    sourceArtifact: 'artifacts/saju-five-classics-typed-readiness-contract-v0/complete.json',
    method: 'The first-party item identity and blocked target-page overlay change no canonical typed gate.',
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
    reason: 'Item identity without target-page bytes cannot establish semantic corroboration, edition/textual lineage, or production timing authority.',
  }
}

const claimStatusCounts = claims => Object.fromEntries(CLAIM_STATUSES.map(status => [status, claims.filter(claim => claim.status === status).length]))

const parentReference = parentV7 => ({
  artifactPath: 'artifacts/saju-gemini-v7-parent-adjudication/complete.json',
  schemaVersion: parentV7?.schemaVersion || null,
  version: parentV7?.version || null,
  basisHead: parentV7?.basisHead || null,
  contentSha256: parentV7?.contentSha256 || null,
  artifactPayloadSha256: parentV7?.artifactIdentity?.artifactPayloadSha256 || null,
  claimCount: parentV7?.claims?.length || 0,
  statusCounts: claimStatusCounts(parentV7?.claims || []),
  unchanged: true,
})

const claimScopeDelta = {
  'claim.E.mingli-yueyan-direct-observation': 'First-party NLC item identity is now confirmed, but the actual target page remains access-blocked. 起運法 and all requested timing fields remain unresolved.',
}

const buildClaimReconciliation = parentV7 => (parentV7?.claims || []).map(claim => ({
  claimId: claim.claimId,
  statusBefore: claim.status,
  statusAfter: claim.status,
  preserved: true,
  addedEvidenceRefs: claimScopeDelta[claim.claimId] ? ['ev.mingli-yueyan.nlc-record', 'ev.mingli-yueyan.nlc-reader-permission'] : [],
  scopeDelta: claimScopeDelta[claim.claimId] || 'No status or gate mutation; parent adjudication is preserved byte-for-byte.',
}))

export const NEGATIVE_CHECK_IDS = Object.freeze([
  'first-party-item-to-target-page-observation',
  'mirror-to-physical-witness',
  'mirror-to-independent-corroboration',
  'recorded-date-to-physical-production-date',
  'section-heading-to-numeric-rule',
  'permission-block-to-whole-volume-negative',
  'item-identity-to-semantic-authority',
  'blocked-target-to-promotion',
])

export function contentHash(artifact) {
  const copy = structuredClone(artifact)
  delete copy.contentSha256
  delete copy.artifactIdentity
  return canonicalHash(copy)
}

export function buildSajuMingliYueyanFirstPartyInspection({ basisHead, parentV7, typedReadinessBaseline } = {}) {
  if (!/^[0-9a-f]{40}$/.test(basisHead || '')) throw new Error('命理約言 inspection requires a valid basis HEAD')
  if (!parentV7?.claims || !typedReadinessBaseline?.claims) throw new Error('命理約言 inspection requires parent claim and typed-readiness artifacts')

  const parentEdges = (parentV7.lineageGraph?.edges || []).map(edge => ({ ...edge, canonicalGraphIncluded: false }))
  const typedReadinessRecalculation = recomputeTypedReadiness(typedReadinessBaseline)
  const claimReconciliation = buildClaimReconciliation(parentV7)
  const artifact = {
    schemaVersion: SAJU_MINGLI_YUEYAN_SCHEMA,
    version: SAJU_MINGLI_YUEYAN_VERSION,
    basisHead,
    scope: {
      sourceOfTruth: 'Direct NLC item/detail/cover/reader responses and direct visual review of the official cover. The mirror PDF is a locator-only lead.',
      parentBaseline: 'Existing Luna v1–v6 and Gemini v7 parent adjudication remains authoritative; this artifact adds an access/identity frontier only.',
      candidateBoundary: 'Mirror, e-text, product pages, and secondary bibliography remain non-witness candidates. No candidate text is imported as canonical evidence.',
      directInspectionCompleted: ['NLC record', 'NLC cover image', 'NLC reader/permission response', 'mirror locator review'],
      directPageScope: 'No authorized first-party target page was obtained. The requested 〈起運法〉 fields remain unresolved.',
      prohibited: ['mirror-to-physical-witness promotion', 'cover-to-target-page inference', 'recorded date-to-production date inference', 'textual similarity to independence', 'semantic equivalence', 'production activation', 'remote mutation'],
    },
    evidencePolicy: {
      directPolicy,
      mirrorPolicy,
      ocr: 'locator_only',
      itemIdentity: 'first_party_record_only',
      targetPage: 'required_for_timing_observation',
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
      access: structuredClone(FIRST_PARTY_ACCESS),
      identityStatus: 'confirmed_item_record_only',
      witnessStatus: 'target_page_blocked_not_admitted_as_full_physical_textual_witness',
      bibliographicDateStatus: 'first_party_recorded_value_only',
      physicalProductionDateStatus: 'unresolved',
    },
    externalEvidence: EXTERNAL_EVIDENCE.map(item => structuredClone(item)),
    mirrorLocator: structuredClone(MIRROR_LOCATOR),
    targetPageReconciliation: structuredClone(TARGET_PAGE_RECONCILIATION),
    sourceClaimReconciliation: {
      parentArtifact: parentReference(parentV7),
      claims: claimReconciliation,
      kept: claimReconciliation.filter(item => item.statusAfter === 'kept').map(item => item.claimId),
      corrected: claimReconciliation.filter(item => item.statusAfter === 'corrected').map(item => item.claimId),
      rejected: claimReconciliation.filter(item => item.statusAfter === 'rejected').map(item => item.claimId),
      unresolved: claimReconciliation.filter(item => item.statusAfter === 'unresolved').map(item => item.claimId),
      statusMutation: false,
      candidateClaimsNotImported: true,
      newBoundedObservations: ['obs.mingli-yueyan.nlc-item-identity', 'obs.mingli-yueyan.nlc-cover-title', 'obs.mingli-yueyan.mirror看運法-locator'],
    },
    digitalPhysicalRelationshipAudit: {
      relationTypes: [...INDEPENDENCE_AXES],
      separated: true,
      axes: [
        { axis: 'physical-item', state: 'unresolved', countedAsIndependent: false, observation: 'NLC item identity is direct, but the authorized target-page/leaf bytes were not accessible.', missingEdges: ['authorized physical leaf/page identity'] },
        { axis: 'digital-derivation', state: 'unresolved', countedAsIndependent: false, observation: 'The Commons PDF claims NLC provenance but is a mirror derivative.', missingEdges: ['first-party bitstream or authorized derivation proof'] },
        { axis: 'edition/textual-lineage', state: 'unresolved', countedAsIndependent: false, observation: 'NLC records 1935 精選命理約言; relation to the underlying 命理約言 and any later reprint is not closed by metadata.', missingEdges: ['edition collation and lineage record'] },
        { axis: 'semantic-corroboration', state: 'unresolved', countedAsIndependent: false, observation: 'No first-party target page was inspected; mirror candidate text cannot corroborate parent timing semantics.', missingEdges: ['authorized target page and independent semantic oracle'] },
      ],
      overallState: 'unresolved',
      canonicalTransmissionEdges: [],
      rule: 'No source is counted as independent until physical-item, digital-derivation, edition/textual-lineage, and semantic-corroboration edges are separately closed.',
    },
    lineageGraph: {
      inheritedFromParent: 'artifacts/saju-gemini-v7-parent-adjudication/complete.json',
      policy: 'Unverified arrows remain outside the canonical graph. This successor adds no transmission edge.',
      edges: parentEdges,
      canonicalEdges: [],
      newlyAddedEdges: [],
      decontaminationPreserved: true,
    },
    timingReconciliation: {
      status: 'no_new_authoritative_timing_observation',
      requestedFields: P0_FIELDS.map(field => structuredClone(officialTargetField(field))),
      mirrorCandidate: {
        sectionLocator: 'Commons mirror PDF p.34–35 / printed p.17–18',
        headings: ['看運法一', '看運法二'],
        direction: 'mirror_locator_only',
        jieSelection: 'not_observed_at_mirror_target_locator',
        threeDaysOneYear: 'not_observed_at_mirror_target_locator',
        oneDayFourMonths: 'not_observed_at_mirror_target_locator',
        oneTimeUnitTenDays: 'not_observed_at_mirror_target_locator',
        workedExample: 'not_observed_at_mirror_target_locator',
        semanticAuthority: 'not_established',
      },
      parentObservationPreserved: {
        sourceId: 'source.anu.sanming-tonghui.e0d2d017.v2',
        locator: 'ANU V2 scan p.58–59 with p.57/p.60 context',
        direct: ['direction family', 'preceding/next 節 selection language', '三日為一歲 relation family', 'worked example presence'],
        derivedOnly: ['一日四月'],
        notAdmitted: ['一時辰十日 as exact literal'],
      },
      implementationBoundary: 'No rounding, interpolation, calendar conversion, first-start timestamp, current Saju calculation, semantic authority, or production timing rule is promoted.',
    },
    typedReadinessRecalculation,
    readiness: {
      availableForInterpretation: false,
      productionActivation: 'blocked',
      semanticAuthority: 'not_established',
      implementationSafeGrounding: 'not_established',
      stableClaimPromotionCount: 0,
      promotionReadyClaimIds: [],
      status: 'blocked',
      reason: 'Only item identity is direct. Target-page access, physical witness identity, edition/textual lineage, semantic binding, and implementation grounding remain unresolved.',
    },
    promotion: {
      status: 'blocked',
      ready: false,
      stableClaimPromotionCount: 0,
      promotionReadyClaimIds: [],
      semanticAuthorityChanged: false,
      productionChanged: false,
      interpretationAvailable: false,
      scope: 'No item, target page, claim, procedure, or production activation is promoted by this artifact.',
      blockingEdges: ['target-page-access:blocked', 'physical-item:unresolved', 'digital-derivation:unresolved', 'edition/textual-lineage:unresolved', 'semantic-corroboration:unresolved'],
    },
    negativeChecks: {
      allMustReject: true,
      ids: [...NEGATIVE_CHECK_IDS],
      scope: 'The checker must reject treating item identity, mirror pages, cover/title, recorded date, or permission failure as target-page evidence, independence, semantic authority, or promotion.',
    },
    summary: {
      firstPartyItemIdentityConfirmed: true,
      firstPartyTargetPageObtained: false,
      directTargetPageObservationCount: 0,
      mirrorLocatorCount: MIRROR_LOCATOR.candidateTargetPages.length,
      directTimingObservationCount: 0,
      requestedP0FieldCount: P0_FIELDS.length,
      unresolvedP0FieldCount: P0_FIELDS.length,
      canonicalTransmissionEdgeCount: 0,
      promotionCount: 0,
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

export function checkSajuMingliYueyanFirstPartyInspection(artifact) {
  const errors = []
  const fail = value => errors.push(value)
  if (!isObject(artifact)) return ['artifact_shape_invalid']
  if (artifact.schemaVersion !== SAJU_MINGLI_YUEYAN_SCHEMA) fail('schema_version')
  if (artifact.version !== SAJU_MINGLI_YUEYAN_VERSION) fail('version')
  if (artifact.candidatePacket?.trustBoundary !== 'untrusted_candidate_only') fail('candidate_trust_boundary')
  if (artifact.candidatePacket?.importedAsCanonicalEvidence !== false || artifact.candidatePacket?.staleParentRejectedClaimsReintroduced !== false) fail('candidate_import_boundary')
  if (artifact.evidencePolicy?.ocr !== 'locator_only' || artifact.evidencePolicy?.targetPage !== 'required_for_timing_observation') fail('evidence_policy')
  if (artifact.firstPartyItem?.identityStatus !== 'confirmed_item_record_only') fail('item_identity_scope')
  if (artifact.firstPartyItem?.witnessStatus !== 'target_page_blocked_not_admitted_as_full_physical_textual_witness') fail('witness_scope')
  if (artifact.firstPartyItem?.bibliographicDateStatus !== 'first_party_recorded_value_only' || artifact.firstPartyItem?.physicalProductionDateStatus !== 'unresolved') fail('date_scope')
  if (artifact.firstPartyItem?.access?.permission?.success !== false || artifact.firstPartyItem?.access?.permission?.accessState !== 'target_page_blocked_by_first_party_permission') fail('permission_boundary')
  if (artifact.firstPartyItem?.access?.directPdfEndpoint?.httpStatus !== 404) fail('direct_pdf_boundary')
  if (artifact.targetPageReconciliation?.firstPartyTargetPageStatus !== 'blocked' || artifact.targetPageReconciliation?.officialTargetPageBytesObtained !== false) fail('target_page_opened')
  if (artifact.targetPageReconciliation?.directTimingObservationCount !== 0 || artifact.targetPageReconciliation?.noWholeVolumeNegative !== true) fail('target_page_counts')
  if (!Array.isArray(artifact.targetPageReconciliation?.fields) || artifact.targetPageReconciliation.fields.length !== P0_FIELDS.length) fail('p0_field_count')
  for (const field of artifact.targetPageReconciliation?.fields || []) {
    if (!P0_FIELDS.includes(field.field) || field.directObservation !== false || field.status !== 'unresolved_target_page_access_blocked' || field.semanticAuthority !== 'not_established' || field.productionAuthority !== false) fail(`p0_field_promoted:${field.field}`)
  }
  if (artifact.mirrorLocator?.physicalWitnessAdmitted !== false || artifact.mirrorLocator?.independentWitnessCount !== 0 || artifact.mirrorLocator?.sourceCategory !== 'MIRROR_DERIVED_LOCATOR_ONLY') fail('mirror_promoted')
  if (!Array.isArray(artifact.mirrorLocator?.candidateTargetPages) || artifact.mirrorLocator.candidateTargetPages.length !== 2) fail('mirror_locator_count')
  if (artifact.sourceClaimReconciliation?.statusMutation !== false || artifact.sourceClaimReconciliation?.candidateClaimsNotImported !== true) fail('parent_reconciliation_boundary')
  for (const claim of artifact.sourceClaimReconciliation?.claims || []) if (claim.statusBefore !== claim.statusAfter || claim.preserved !== true) fail(`parent_claim_changed:${claim.claimId}`)
  if (!artifact.digitalPhysicalRelationshipAudit?.separated) fail('independence_axes_mixed')
  for (const axis of artifact.digitalPhysicalRelationshipAudit?.axes || []) if (axis.countedAsIndependent === true || !INDEPENDENCE_AXES.includes(axis.axis)) fail(`independence_inflated:${axis.axis}`)
  if (artifact.digitalPhysicalRelationshipAudit?.canonicalTransmissionEdges?.length !== 0 || artifact.lineageGraph?.canonicalEdges?.length !== 0 || artifact.lineageGraph?.newlyAddedEdges?.length !== 0) fail('lineage_promoted')
  if (artifact.timingReconciliation?.status !== 'no_new_authoritative_timing_observation') fail('timing_observation_promoted')
  for (const field of artifact.timingReconciliation?.requestedFields || []) if (field.status !== 'unresolved_target_page_access_blocked' || field.directObservation !== false) fail(`timing_field_promoted:${field.field}`)
  if (artifact.timingReconciliation?.mirrorCandidate?.semanticAuthority !== 'not_established') fail('mirror_semantic_authority')
  if (artifact.readiness?.availableForInterpretation !== false || artifact.readiness?.productionActivation !== 'blocked' || artifact.readiness?.semanticAuthority !== 'not_established') fail('readiness_open')
  if (artifact.promotion?.stableClaimPromotionCount !== 0 || artifact.promotion?.promotionReadyClaimIds?.length !== 0 || artifact.promotion?.semanticAuthorityChanged !== false || artifact.promotion?.productionChanged !== false) fail('promotion_side_effect')
  if (artifact.typedReadinessRecalculation?.changedGateStates?.length !== 0 || artifact.typedReadinessRecalculation?.promotionReadyClaimIds?.length !== 0) fail('typed_readiness_changed')
  if (JSON.stringify(artifact.typedReadinessRecalculation?.before) !== JSON.stringify(artifact.typedReadinessRecalculation?.after)) fail('typed_readiness_before_after_differ')
  if (artifact.negativeChecks?.allMustReject !== true || JSON.stringify(artifact.negativeChecks?.ids) !== JSON.stringify([...NEGATIVE_CHECK_IDS])) fail('negative_checks_missing')
  if (artifact.contentSha256 !== contentHash(artifact)) fail('content_hash')
  return [...new Set(errors)].sort()
}
