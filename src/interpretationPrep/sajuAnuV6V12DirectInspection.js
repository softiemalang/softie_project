import { createHash } from 'node:crypto'

import { canonicalIdentityJson } from '../artifactIdentity.js'

export const SAJU_ANU_V6_V12_SCHEMA = 'saju-anu-v6-v12-direct-inspection-v0'
export const SAJU_ANU_V6_V12_VERSION = '0.1.0'

export const GATE_KEYS = Object.freeze(['H', 'E', 'L', 'S', 'I', 'P'])
export const GATE_STATES = Object.freeze(['satisfied', 'unresolved', 'conflicted', 'not_applicable'])
export const CLAIM_STATUSES = Object.freeze(['kept', 'corrected', 'rejected', 'unresolved'])
export const INDEPENDENCE_AXES = Object.freeze([
  'physical-item',
  'digital-derivation',
  'edition/textual-lineage',
  'semantic-corroboration',
])
export const LINEAGE_EDGE_STATES = Object.freeze([
  'DIRECTLY_SUPPORTED',
  'BIBLIOGRAPHIC_CLAIM_ONLY',
  'HYPOTHESIS',
  'UNSUPPORTED',
  'CONFLICTED',
])

const sha256 = value => createHash('sha256').update(value).digest('hex')
const canonicalHash = value => sha256(Buffer.from(canonicalIdentityJson(value)))

const directPolicy = 'A direct scan or first-party content endpoint observation is admitted only at its stated source and PDF locator; it is not canonical text, semantic authority, interpretation readiness, or a production procedure.'
const sameLineagePolicy = 'The seven ANU PDF bitstreams are digital representations in one first-party ORIGINAL bundle. They are not independent physical witnesses or independent textual lineages.'

export const ANU_ITEM = Object.freeze({
  sourceId: 'source.anu.sanming-tonghui.e0d2d017',
  institution: 'Australian National University Open Research Repository',
  itemUuid: 'e0d2d017-f99d-4818-af29-d18754f7e5cd',
  handle: 'http://hdl.handle.net/1885/206524',
  identifier: 'b22343921',
  recordUrl: 'https://openresearch-repository.anu.edu.au/items/e0d2d017-f99d-4818-af29-d18754f7e5cd',
  apiUrl: 'https://openresearch-repository.anu.edu.au/server/api/core/items/e0d2d017-f99d-4818-af29-d18754f7e5cd',
  bundleUuid: 'c11f2f3d-396b-43b1-b5b1-d2ce29a3f047',
  bundleApiUrl: 'https://openresearch-repository.anu.edu.au/server/api/core/bundles/c11f2f3d-396b-43b1-b5b1-d2ce29a3f047/bitstreams?size=100',
  title: 'San ming tong hui : 12 juan / Yuwushanren zhu 三命通會 : 十二卷 / 育吾山人著',
  extent: '12 v. (double leaves), oriental style in case',
  relationIsPartOf: 'Xu Dishan',
  collection: 'Chinese Rare Books',
  digitisedBy: 'Australian National University in 2020',
  access: 'Open Access',
})

export const ANU_BITSTREAMS = Object.freeze([
  {
    volume: 6,
    fileName: 'b22343921_v.6.pdf',
    description: 'Volume 6',
    bitstreamUuid: 'fb2aba7f-7631-40c6-ac51-e1d2c7d4f8cf',
    contentUrl: 'https://openresearch-repository.anu.edu.au/server/api/core/bitstreams/fb2aba7f-7631-40c6-ac51-e1d2c7d4f8cf/content',
    apiHttpStatus: 200,
    sizeBytes: 116512109,
    md5: 'ef4bdabe46a18d7585b60c7a75f74e3c',
    sha256: '97d57717dfbeab787af8c8f7e9edcbec4b2522a26821c75cb38cc7c0f156de2b',
    pdfPageCount: 106,
    downloadedPath: '/private/tmp/anu-b22343921-v6.pdf',
  },
  {
    volume: 7,
    fileName: 'b22343921_v.7.pdf',
    description: 'Volume 7',
    bitstreamUuid: '5b0a6e1b-3db4-46ee-aa12-a42b14e322b4',
    contentUrl: 'https://openresearch-repository.anu.edu.au/server/api/core/bitstreams/5b0a6e1b-3db4-46ee-aa12-a42b14e322b4/content',
    apiHttpStatus: 200,
    sizeBytes: 98529810,
    md5: '0568f1c263e6e941232a5af977c5d7a7',
    sha256: '6edc5391d91d409620b2e1174e629bb1a2653870b3f3aca4ce2d9deb3d0a863f',
    pdfPageCount: 89,
    downloadedPath: '/private/tmp/anu-b22343921-v7.pdf',
  },
  {
    volume: 8,
    fileName: 'b22343921_v.8.pdf',
    description: 'Volume 8',
    bitstreamUuid: 'a8fa6594-8fdc-4c11-8368-842289357e52',
    contentUrl: 'https://openresearch-repository.anu.edu.au/server/api/core/bitstreams/a8fa6594-8fdc-4c11-8368-842289357e52/content',
    apiHttpStatus: 200,
    sizeBytes: 132491390,
    md5: '94bc9f49cc19ca5310b690fc2107d8b8',
    sha256: '82bf2f1814b04f849a8a2abbcb16c49b0c9feb02b1d19531a26a694d628fc6eb',
    pdfPageCount: 126,
    downloadedPath: '/private/tmp/anu-b22343921-v8.pdf',
  },
  {
    volume: 9,
    fileName: 'b22343921_v.9.pdf',
    description: 'Volume 9',
    bitstreamUuid: '18bf8d2e-c443-41da-852a-b3404a6195ca',
    contentUrl: 'https://openresearch-repository.anu.edu.au/server/api/core/bitstreams/18bf8d2e-c443-41da-852a-b3404a6195ca/content',
    apiHttpStatus: 200,
    sizeBytes: 132300104,
    md5: '7e6d9af2a6aed73978c0c48674be4f35',
    sha256: '17446c7571c11c85a0b60f04074f968c0b708078c4f646930d25a959f73a24c1',
    pdfPageCount: 124,
    downloadedPath: '/private/tmp/anu-b22343921-v9.pdf',
  },
  {
    volume: 10,
    fileName: 'b22343921_v.10.pdf',
    description: 'Volume 10',
    bitstreamUuid: '97ec8e41-d427-4f7d-b9b0-336898fea3db',
    contentUrl: 'https://openresearch-repository.anu.edu.au/server/api/core/bitstreams/97ec8e41-d427-4f7d-b9b0-336898fea3db/content',
    apiHttpStatus: 200,
    sizeBytes: 66903696,
    md5: '359120cee2db78319fa435b987de2b30',
    sha256: 'abf528e8dfa821b0c947b3031ec1879f17d8028dbf81624e7d81db38368cc249',
    pdfPageCount: 77,
    downloadedPath: '/private/tmp/anu-b22343921-v10.pdf',
  },
  {
    volume: 11,
    fileName: 'b22343921_v.11.pdf',
    description: 'Volume 11',
    bitstreamUuid: '335e822c-7893-4ab9-ad7f-cd3bcb565759',
    contentUrl: 'https://openresearch-repository.anu.edu.au/server/api/core/bitstreams/335e822c-7893-4ab9-ad7f-cd3bcb565759/content',
    apiHttpStatus: 200,
    sizeBytes: 102605436,
    md5: '864bf38d466674436bb643372cb01244',
    sha256: 'ffba874a4d5cf73e59f203872149246090b9f7bce52905f2977fcfeb645f07e3',
    pdfPageCount: 91,
    downloadedPath: '/private/tmp/anu-b22343921-v11.pdf',
  },
  {
    volume: 12,
    fileName: 'b22343921_v.12.pdf',
    description: 'Volume 12',
    bitstreamUuid: 'fc1a5a22-84e8-4760-899f-c3d3e1add118',
    contentUrl: 'https://openresearch-repository.anu.edu.au/server/api/core/bitstreams/fc1a5a22-84e8-4760-899f-c3d3e1add118/content',
    apiHttpStatus: 200,
    sizeBytes: 88419498,
    md5: '1fe2ec34a48cdc2463a75eda9a80e92e',
    sha256: 'b7958e1fc5dd8a61aab33bbcaf06651a6c7b7d30059364295af417632b88847a',
    pdfPageCount: 81,
    downloadedPath: '/private/tmp/anu-b22343921-v12.pdf',
  },
])

const printedVolumeTitle = volume => `三命通會卷之${['六', '七', '八', '九', '十', '十一', '十二'][volume - 6]}`
const handwrittenCollectionMarks = Object.freeze({ 6: '6657', 7: '6668', 8: '6669', 9: '6670', 10: '6671', 11: '6672', 12: '6673' })

export const VOLUME_CROSSWALK = Object.freeze(ANU_BITSTREAMS.map(bitstream => ({
  volume: bitstream.volume,
  sourceId: `${ANU_ITEM.sourceId}.v${bitstream.volume}`,
  fileName: bitstream.fileName,
  bitstreamUuid: bitstream.bitstreamUuid,
  pdfPageCount: bitstream.pdfPageCount,
  titlePage: {
    pdfPage: 3,
    printedVolumeTitle: printedVolumeTitle(bitstream.volume),
    printedTitleDirectlyVisible: true,
    printedFolio: null,
    printedFolioStatus: 'unresolved_not_reliably_visible_in_inspected_render',
    handwrittenCollectionMarkOnFacingBlankLeaf: handwrittenCollectionMarks[bitstream.volume],
    handwrittenMarkStatus: 'directly_visible_but_not_a_printed_folio',
    titleToFolioRelation: 'not_inferred',
    locatorType: 'ANU_PDF_page_1_based',
  },
  folioCrosswalk: {
    status: 'unresolved',
    directPdfPage: 3,
    printedFolio: null,
    reason: 'The title-page/facing-leaf render exposes a handwritten collection mark but no reliably legible printed folio was closed. The PDF page number is retained as a digital locator only.',
  },
})))

const evidence = (evidenceId, category, status, details = {}) => ({
  evidenceId,
  sourceCategory: category,
  status,
  ...details,
  scopeBoundary: details.scopeBoundary || directPolicy,
})

export const EXTERNAL_EVIDENCE = Object.freeze([
  evidence('ev.anu.current-item-and-bundle', 'FIRST_PARTY_API_RECORD', 'direct_first_party_record', {
    sourceId: ANU_ITEM.sourceId,
    institution: ANU_ITEM.institution,
    recordUrl: ANU_ITEM.recordUrl,
    apiUrl: ANU_ITEM.apiUrl,
    bundleApiUrl: ANU_ITEM.bundleApiUrl,
    observed: ['item UUID, Handle 1885/206524, identifier b22343921, ORIGINAL bundle UUID, 12-v metadata, Xu Dishan relation, Chinese Rare Books collection'],
    scopeBoundary: 'Item and bundle metadata are first-party identity evidence only. They do not establish printed-volume completeness, edition date, or textual genealogy.',
  }),
  evidence('ev.anu.v6-v12-content-byte-identity', 'DIRECT_OFFICIAL_CONTENT', 'direct_content_bytes_verified', {
    sourceId: ANU_ITEM.sourceId,
    bundleUuid: ANU_ITEM.bundleUuid,
    bitstreams: ANU_BITSTREAMS.map(item => ({
      volume: item.volume,
      fileName: item.fileName,
      bitstreamUuid: item.bitstreamUuid,
      contentUrl: item.contentUrl,
      apiHttpStatus: item.apiHttpStatus,
      sizeBytes: item.sizeBytes,
      md5: item.md5,
      sha256: item.sha256,
      pdfPageCount: item.pdfPageCount,
      bytesMatchedApiSizeAndMd5: true,
    })),
    scopeBoundary: 'The byte identities prove the retrieved digital objects and their PDF page counts. They do not turn digital files into independent physical witnesses.',
  }),
  evidence('ev.anu.v6-v12-title-pages', 'DIRECT_OFFICIAL_SCAN', 'direct_title_page_crosswalk', {
    sourceId: ANU_ITEM.sourceId,
    observations: VOLUME_CROSSWALK.map(item => ({
      volume: item.volume,
      pdfPage: item.titlePage.pdfPage,
      printedVolumeTitle: item.titlePage.printedVolumeTitle,
      printedFolio: item.titlePage.printedFolio,
      printedFolioStatus: item.titlePage.printedFolioStatus,
      handwrittenCollectionMarkOnFacingBlankLeaf: item.titlePage.handwrittenCollectionMarkOnFacingBlankLeaf,
    })),
    scopeBoundary: 'The title line directly identifies the printed 卷 label at the stated PDF page. The handwritten facing-leaf mark is not a printed folio, and neither observation establishes edition date or lineage.',
  }),
  evidence('ev.anu.v11-p7-p24-dayun', 'DIRECT_OFFICIAL_SCAN', 'direct_bounded_timing_observation', {
    sourceId: `${ANU_ITEM.sourceId}.v11`,
    scan: { fileName: 'b22343921_v.11.pdf', pdfPages: [6, 7, 8, 23, 24, 25], printedFolio: null, printedFolioStatus: 'unresolved' },
    observed: [
      'v11 PDF p.7 has the large vertical heading 大運折除成歲小運逆順由時。',
      'v11 PDF p.24 visibly contains 陽男陰女從生月順行 and 陰男陽女從生月逆行.',
      'v11 PDF p.24 visibly contains 運行則一辰十歲、折除乃三日為年、精休旺以為妙.',
      'v11 PDF p.23 and p.25 were checked as surrounding pages; no separate worked start-age example was closed at this locator.',
    ],
    scopeBoundary: 'These are literal, page-bounded observations from the same ANU item/bundle. 一辰十歲 is not normalized to 一時辰十日; 三日為年 is retained as a literal variant and is not silently equated with the parent 三日為一歲 observation.',
  }),
  evidence('ev.anu.parent-v2-baseline', 'PARENT_BASELINE_REFERENCE', 'parent_adjudication_preserved', {
    sourceArtifactPath: 'artifacts/saju-gemini-v7-parent-adjudication/complete.json',
    observationId: 'obs.A.anu-p58-p59-rule-and-example',
    observed: ['Parent v1–v6 adjudication remains authoritative for ANU V2 p.58–59 direction/節/worked-example scope and its literal/derived separation.'],
    scopeBoundary: 'The new v6–v12 pages are an additive same-item overlay. They do not rewrite or supersede parent bytes, claim verdicts, or typed readiness.',
  }),
])

const titleObservation = item => ({
  observationId: `obs.anu.v${item.volume}.title-p3`,
  sourceId: `${ANU_ITEM.sourceId}.v${item.volume}`,
  evidenceId: 'ev.anu.v6-v12-title-pages',
  volume: item.volume,
  pdfPage: item.titlePage.pdfPage,
  printedFolio: item.titlePage.printedFolio,
  printedFolioStatus: item.titlePage.printedFolioStatus,
  observed: [item.titlePage.printedVolumeTitle],
  handwrittenCollectionMarkOnFacingBlankLeaf: item.titlePage.handwrittenCollectionMarkOnFacingBlankLeaf,
  handwrittenMarkIsPrintedFolio: false,
  directObservation: true,
  canonicalTextObserved: false,
  semanticAuthority: 'not_established',
  scopeBoundary: 'The printed 卷 title is a direct scan observation at this PDF page. No printed folio, edition date, physical completeness, or genealogy is inferred.',
})

export const PAGE_OBSERVATIONS = Object.freeze([
  ...VOLUME_CROSSWALK.map(titleObservation),
  {
    observationId: 'obs.anu.v11.p7-dayun-heading',
    sourceId: `${ANU_ITEM.sourceId}.v11`,
    evidenceId: 'ev.anu.v11-p7-p24-dayun',
    volume: 11,
    pdfPage: 7,
    printedFolio: null,
    printedFolioStatus: 'unresolved_not_reliably_visible_in_inspected_render',
    adjacentPdfPagesInspected: [6, 7, 8],
    observed: ['大運折除成歲小運逆順由時'],
    observationKind: 'large_vertical_heading_or_section_label',
    literalAudit: {
      daYunBreakToYears: 'direct_literal_heading',
      smallYunDirectionByTime: 'direct_literal_heading',
      threeDaysOneYear: 'not_observed_at_locator',
      oneChenTenYears: 'not_observed_at_locator',
      oneDayFourMonths: 'not_observed_at_locator',
      oneTimeUnitTenDays: 'not_observed_at_locator',
    },
    jieSelection: 'not_observed_at_locator',
    workedExample: 'not_observed_at_locator',
    canonicalTextObserved: false,
    semanticAuthority: 'not_established',
    promotionStatus: 'blocked_unpromoted_overlay',
    scopeBoundary: 'The heading is a direct occurrence only. It does not supply the parent worked example, named 節 selection, or a production-ready conversion procedure.',
  },
  {
    observationId: 'obs.anu.v11.p24-dayun-literal-variant',
    sourceId: `${ANU_ITEM.sourceId}.v11`,
    evidenceId: 'ev.anu.v11-p7-p24-dayun',
    volume: 11,
    pdfPage: 24,
    printedFolio: null,
    printedFolioStatus: 'unresolved_not_reliably_visible_in_inspected_render',
    adjacentPdfPagesInspected: [23, 24, 25],
    observed: [
      '陽男陰女從生月順行',
      '陰男陽女從生月逆行',
      '運行則一辰十歲',
      '折除乃三日為年',
      '精休旺以為妙',
      '窮通變以為玄',
    ],
    literalAudit: {
      direction: 'direct_literal',
      oneChenTenYears: 'direct_literal',
      threeDaysOneYear: 'direct_literal_variant',
      oneDayFourMonths: 'not_observed',
      oneTimeUnitTenDays: 'not_observed',
    },
    semanticRelation: {
      parentV2ThreeDaysOneYear: 'same relation family candidate; semantic equivalence unresolved',
      parentV2OneTimeUnitTenDays: 'not supported; the literal here is 一辰十歲, not 一時辰十日',
      normalizationPerformed: false,
    },
    jieSelection: 'not_observed_at_p23_p24_p25',
    workedExample: 'not_observed_at_p23_p24_p25',
    canonicalTextObserved: false,
    semanticAuthority: 'not_established',
    promotionStatus: 'blocked_unpromoted_overlay',
    scopeBoundary: 'The exact visible strings are preserved as a same-item variant observation. No arithmetic normalization, semantic equivalence, independent corroboration, implementation rule, or production authority is admitted.',
  },
])

const countStates = (claims, key) => Object.fromEntries(GATE_STATES.map(state => [state, claims.filter(claim => claim.gates?.[key]?.state === state).length]))

export function recomputeTypedReadiness(baseline) {
  const baselineClaims = baseline?.claims || []
  const before = Object.fromEntries(GATE_KEYS.map(key => [key, countStates(baselineClaims, key)]))
  const after = structuredClone(before)
  const baselinePromotionReadyClaimIds = baselineClaims.filter(claim => claim.promotion?.ready === true).map(claim => claim.claimId)
  return {
    sourceArtifact: 'artifacts/saju-five-classics-typed-readiness-contract-v0/complete.json',
    method: 'Recomputed from the authoritative typed-readiness claim gates. The ANU v6–v12 overlay adds page observations only and changes no canonical claim gate.',
    before,
    after,
    changedGateStates: [],
    baselineClaimCount: baselineClaims.length,
    baselinePromotionReadyClaimIds,
    promotionReadyClaimIds: [],
    stableClaimPromotionCount: 0,
    availableForInterpretation: false,
    semanticAuthority: 'not_established',
    implementationSafeGrounding: 'not_established',
    productionActivation: 'blocked',
    reason: 'Direct same-item observations do not close physical-item independence, edition/textual lineage, semantic authority, or implementation grounding.',
  }
}

const claimStatusCounts = claims => Object.fromEntries(CLAIM_STATUSES.map(status => [status, claims.filter(claim => claim.status === status).length]))

const parentReference = (parentV7, artifactPath) => ({
  artifactPath,
  schemaVersion: parentV7?.schemaVersion || null,
  version: parentV7?.version || null,
  basisHead: parentV7?.basisHead || null,
  contentSha256: parentV7?.contentSha256 || null,
  artifactPayloadSha256: parentV7?.artifactIdentity?.artifactPayloadSha256 || null,
  claimCount: parentV7?.claims?.length || 0,
  statusCounts: claimStatusCounts(parentV7?.claims || []),
  unchanged: true,
})

const scopeDelta = Object.freeze({
  'claim.A.sanming-rule-family': 'Parent corrected status preserved. v11 p.7/p.24 add literal same-item observations only; parent V2 p.58–59 direction/節/worked-example scope remains authoritative.',
  'claim.A.sanming-literal-one-day-four-month': 'Parent corrected status preserved. No 一日四月 literal is admitted from v11; no derived relation is promoted.',
  'claim.A.sanming-literal-time-unit-ten-day': 'Parent unresolved status preserved. v11 p.24 records 一辰十歲, which is not the candidate literal 一時辰十日.',
  'claim.B.anu-12juan-metadata': 'Parent kept metadata-only status preserved. Direct v6–v12 title pages do not turn catalog extent into an edition/completeness claim.',
  'claim.B.anu-current-original-v1-v12': 'Parent kept file-list status preserved and narrowed positively: v6–v12 content endpoints, byte identities, PDF page counts, and printed 卷 title pages were directly inspected.',
  'claim.B.anu-catalog-extent-to-public-count': 'Parent rejected inference preserved. Current bitstream enumeration is a separate first-party observation; catalog 12 juan is not used as its proof.',
  'claim.B.anu-xudishan-collection-relation': 'Parent kept metadata-only status preserved; no physical provenance chronology or textual genealogy is inferred.',
})

const buildClaimReconciliation = parentV7 => {
  const claims = parentV7?.claims || []
  return claims.map(claim => ({
    claimId: claim.claimId,
    statusBefore: claim.status,
    statusAfter: claim.status,
    preserved: true,
    addedEvidenceRefs: scopeDelta[claim.claimId] ? ['ev.anu.v6-v12-content-byte-identity', 'ev.anu.v6-v12-title-pages'] : [],
    scopeDelta: scopeDelta[claim.claimId] || 'No status or gate mutation; parent adjudication is preserved byte-for-byte.',
  }))
}

const edgeStatusCounts = edges => edges.reduce((counts, edge) => {
  counts[edge.status] = (counts[edge.status] || 0) + 1
  return counts
}, {})

export const NEGATIVE_CHECK_IDS = Object.freeze([
  'metadata-volume-to-printed-folio',
  'digital-files-to-independent-physical-witnesses',
  'literal-to-time-unit-normalization',
  'literal-variant-to-semantic-equivalence',
  'title-page-to-edition-date',
  'handwritten-mark-to-printed-folio',
  'same-item-observation-to-production-authority',
  'hypothesis-edge-to-canonical-graph',
  'absence-from-locator-to-whole-volume-negative',
  'parent-status-to-successor-promotion',
])

export function contentHash(artifact) {
  const copy = structuredClone(artifact)
  delete copy.contentSha256
  delete copy.artifactIdentity
  return canonicalHash(copy)
}

export function buildSajuAnuV6V12DirectInspection({ basisHead, parentV7, typedReadinessBaseline } = {}) {
  if (!/^[0-9a-f]{40}$/.test(basisHead || '')) throw new Error('ANU v6-v12 inspection requires a valid basis HEAD')
  if (!parentV7?.claims || !typedReadinessBaseline?.claims) throw new Error('ANU v6-v12 inspection requires parent claim and typed-readiness artifacts')

  const parentEdges = (parentV7.lineageGraph?.edges || []).map(edge => ({ ...edge, canonicalGraphIncluded: false }))
  const typedReadinessRecalculation = recomputeTypedReadiness(typedReadinessBaseline)
  const claimReconciliation = buildClaimReconciliation(parentV7)
  const artifact = {
    schemaVersion: SAJU_ANU_V6_V12_SCHEMA,
    version: SAJU_ANU_V6_V12_VERSION,
    basisHead,
    scope: {
      sourceOfTruth: 'Direct GET of ANU first-party v6–v12 PDF content endpoints, actual PDF byte identity/page count, and direct rendered scan-image inspection at the stated pages.',
      parentBaseline: 'Existing Luna v1–v6 and Gemini v7 parent adjudication remains authoritative; this artifact is an additive successor and does not rewrite predecessor bytes.',
      candidateBoundary: 'Gemini v7 remains untrusted_candidate_only. No v7 wholesale import or candidate conclusion is promoted.',
      directInspectionCompleted: ['v6', 'v7', 'v8', 'v9', 'v10', 'v11', 'v12'],
      directPageScope: 'Title-page volume mapping for v6–v12; bounded v11 p.7 and p.24 timing inspection with p.6/p.8 and p.23/p.25 context.',
      prohibited: ['printed folio from metadata/file name', 'semantic equivalence from glyph similarity', 'independent witness inflation', 'edition/date/genealogy promotion', 'availableForInterpretation=true', 'production activation', 'remote mutation'],
    },
    evidencePolicy: {
      directPolicy,
      sameLineagePolicy,
      ocr: 'locator_only',
      pdfPageNumbering: '1-based PDF scan page; not a printed folio',
      printedFolioPolicy: 'null/unresolved unless a printed folio is directly and reliably legible on the inspected image',
    },
    candidatePacket: {
      source: 'Gemini v7 wide acquisition packet',
      trustBoundary: 'untrusted_candidate_only',
      importedAsCanonicalEvidence: false,
      importedConclusionFields: [],
      sourceTextAndVerdictsImported: false,
      staleParentRejectedClaimsReintroduced: false,
      packetFiles: [],
    },
    externalEvidence: EXTERNAL_EVIDENCE.map(item => structuredClone(item)),
    bitstreamInventory: ANU_BITSTREAMS.map(item => structuredClone(item)),
    volumeCrosswalk: VOLUME_CROSSWALK.map(item => structuredClone(item)),
    pageObservations: PAGE_OBSERVATIONS.map(item => structuredClone(item)),
    timingSearchAudit: {
      method: 'ANU embedded OCR was used only as a locator; direct image inspection controls admission.',
      byVolume: [
        { volume: 6, locatorResult: 'No exact 大運 hit closed; generic 節/三日 OCR hits were not admitted as a timing rule.', directP0Observation: false, wholeVolumeNegativeClaim: false },
        { volume: 7, locatorResult: 'No exact 大運 hit closed; directly inspected candidate pages were general 論壽天 prose, not a timing procedure.', directP0Observation: false, wholeVolumeNegativeClaim: false },
        { volume: 8, locatorResult: 'Generic 節 locator only; no target timing page was closed.', directP0Observation: false, wholeVolumeNegativeClaim: false },
        { volume: 9, locatorResult: 'Generic 節 locator only; no target timing page was closed.', directP0Observation: false, wholeVolumeNegativeClaim: false },
        { volume: 10, locatorResult: 'PDF p.5 candidate directly inspected; generic 財官/運 prose, not a dedicated timing procedure.', directP0Observation: false, wholeVolumeNegativeClaim: false },
        { volume: 11, locatorResult: 'PDF p.7 heading and p.24 literal timing paragraph directly inspected with adjacent pages.', directP0Observation: true, wholeVolumeNegativeClaim: false },
        { volume: 12, locatorResult: 'Generic 節/運 locator only; no target timing page was closed.', directP0Observation: false, wholeVolumeNegativeClaim: false },
      ],
      boundary: 'No volume is declared free of the target passage merely because the OCR locator did not find it.',
    },
    sourceClaimReconciliation: {
      parentArtifact: parentReference(parentV7, 'artifacts/saju-gemini-v7-parent-adjudication/complete.json'),
      claims: claimReconciliation,
      kept: claimReconciliation.filter(item => item.statusAfter === 'kept').map(item => item.claimId),
      corrected: claimReconciliation.filter(item => item.statusAfter === 'corrected').map(item => item.claimId),
      rejected: claimReconciliation.filter(item => item.statusAfter === 'rejected').map(item => item.claimId),
      unresolved: claimReconciliation.filter(item => item.statusAfter === 'unresolved').map(item => item.claimId),
      statusMutation: false,
      candidateClaimsNotImported: true,
      newBoundedObservations: ['obs.anu.v6.title-p3', 'obs.anu.v7.title-p3', 'obs.anu.v8.title-p3', 'obs.anu.v9.title-p3', 'obs.anu.v10.title-p3', 'obs.anu.v11.title-p3', 'obs.anu.v12.title-p3', 'obs.anu.v11.p7-dayun-heading', 'obs.anu.v11.p24-dayun-literal-variant'],
    },
    metadataRegressionAudit: {
      baseline: {
        handle: 'http://hdl.handle.net/1885/206524',
        itemUuid: ANU_ITEM.itemUuid,
        parentConfirmedPublicPdfNames: ['b22343921_v.1.pdf', 'b22343921_v.2.pdf', 'b22343921_v.3.pdf', 'b22343921_v.4.pdf', 'b22343921_v.5.pdf'],
        parentScope: 'Parent direct byte/page confirmation covered V1–V5; the catalog extent 12 juan did not prove public digital volume content or printed folio mapping.',
      },
      currentFirstParty: {
        itemUuid: ANU_ITEM.itemUuid,
        handle: ANU_ITEM.handle,
        originalBundleUuid: ANU_ITEM.bundleUuid,
        currentApiPdfCount: 12,
        currentApiTifCount: 12,
        v6ToV12ContentEndpointStatus: Object.fromEntries(ANU_BITSTREAMS.map(item => [item.fileName, item.apiHttpStatus])),
        v6ToV12ByteIdentityVerified: true,
        v6ToV12ActualPdfPageCounts: Object.fromEntries(ANU_BITSTREAMS.map(item => [item.fileName, item.pdfPageCount])),
      },
      disposition: {
        rareBooks1885_42211: 'rejected_current_item_identity',
        twelveJuanCatalogExtent: 'kept_metadata_only',
        currentPublicV1_V12BitstreamEnumeration: 'kept_first_party_api_observation',
        currentPublicV6_V12ContentBytes: 'kept_direct_content_identity',
        currentV6_V12PrintedVolumeTitlePages: 'kept_direct_scan_observation',
        publicDigitalVolumeCountFromCatalogAlone: 'rejected_inference',
        printedFolioCrosswalk: 'unresolved',
        physicalCompleteness: 'unresolved',
        editionDate: 'unresolved',
        textualLineage: 'unresolved',
        xuDishanRelation: 'kept_metadata_only',
      },
      historicalBaselineMutated: false,
    },
    digitalPhysicalRelationshipAudit: {
      relationTypes: [...INDEPENDENCE_AXES],
      separated: true,
      axes: [
        { axis: 'physical-item', state: 'unresolved', countedAsIndependent: false, observation: 'Seven PDF files are not seven independently verified physical witnesses.', missingEdges: ['physical holding/leaf-level identity and independent witness relation'] },
        { axis: 'digital-derivation', state: 'unresolved', countedAsIndependent: false, observation: 'v6–v12 are seven official bitstreams in one ORIGINAL bundle.', missingEdges: ['independent capture/derivation relation'] },
        { axis: 'edition/textual-lineage', state: 'unresolved', countedAsIndependent: false, observation: 'Printed title pages identify 卷 labels only.', missingEdges: ['edition/date/lineage crosswalk'] },
        { axis: 'semantic-corroboration', state: 'unresolved', countedAsIndependent: false, observation: 'v11 p.7/p.24 is same-item text; it is not independent semantic corroboration.', missingEdges: ['independent semantic oracle and authority relation'] },
      ],
      overallState: 'unresolved',
      canonicalTransmissionEdges: [],
      rule: sameLineagePolicy,
    },
    lineageGraph: {
      inheritedFromParent: 'artifacts/saju-gemini-v7-parent-adjudication/complete.json',
      policy: 'Unverified arrows remain outside the canonical graph. This successor adds no transmission edge.',
      edges: parentEdges,
      edgeStatusCounts: edgeStatusCounts(parentEdges),
      canonicalEdges: [],
      newlyAddedEdges: [],
      decontaminationPreserved: true,
    },
    timingReconciliation: {
      status: 'bounded_same_item_variant_observations_not_authoritative',
      parentObservationPreserved: {
        sourceId: 'source.anu.sanming-tonghui.e0d2d017.v2',
        locator: 'ANU V2 scan p.58–59 with p.57/p.60 context',
        direct: ['direction family', 'preceding/next 節 selection language', '三日為一歲 relation family', 'worked example presence'],
        derivedOnly: ['一日四月'],
        notAdmitted: ['一時辰十日 as exact literal'],
      },
      newDirectObservations: [
        { observationId: 'obs.anu.v11.p7-dayun-heading', locator: 'ANU V11 PDF p.7', literal: '大運折除成歲小運逆順由時', relation: 'heading/section observation only', printedFolio: null },
        { observationId: 'obs.anu.v11.p24-dayun-literal-variant', locator: 'ANU V11 PDF p.24', literal: ['陽男陰女從生月順行', '陰男陽女從生月逆行', '運行則一辰十歲', '折除乃三日為年', '精休旺以為妙'], relation: 'same-item literal variant observation', printedFolio: null },
      ],
      variantBoundary: {
        oneChenTenYears: 'direct_literal_at_v11_p24',
        oneTimeUnitTenDays: 'not_observed_and_not_derived',
        threeDaysOneYear: 'direct_literal_variant_at_v11_p24; semantic equivalence to parent 三日為一歲 unresolved',
        oneDayFourMonths: 'not_observed_at_v11_p7_p24',
        jieSelection: 'not_observed_at_v11_p7_p24',
        workedExample: 'not_observed_at_v11_p7_p24',
        parentBoundary: 'Parent V2 節 and worked-example observations remain separate.',
      },
      implementationBoundary: 'No rounding, interpolation, calendar conversion, first-start timestamp, current Saju calculation, or production timing authority is promoted.',
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
      reason: 'The new observations are bounded same-item digital evidence. Unresolved independence, printed-folio/edition identity, lineage, semantic binding, and implementation grounding keep readiness closed.',
    },
    promotion: {
      status: 'blocked',
      ready: false,
      stableClaimPromotionCount: 0,
      promotionReadyClaimIds: [],
      semanticAuthorityChanged: false,
      productionChanged: false,
      interpretationAvailable: false,
      scope: 'No claim, source, procedure, or production activation is promoted by this artifact.',
      blockingEdges: ['physical-item:unresolved', 'digital-derivation:unresolved', 'edition/textual-lineage:unresolved', 'semantic-corroboration:unresolved', 'printed-folio:unresolved', 'edition/date:unresolved'],
    },
    negativeChecks: {
      allMustReject: true,
      ids: [...NEGATIVE_CHECK_IDS],
      scope: 'The checker must reject metadata/file-name shortcuts, independence inflation, glyph normalization, title/date transfer, graph insertion, whole-volume negative inference, and readiness promotion.',
    },
    summary: {
      directVolumeCount: VOLUME_CROSSWALK.length,
      directTitlePageObservationCount: VOLUME_CROSSWALK.length,
      directTimingObservationCount: 2,
      printedFolioClosedCount: VOLUME_CROSSWALK.filter(item => item.titlePage.printedFolio !== null).length,
      newP0BoundedObservationCount: 2,
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

export function checkSajuAnuV6V12DirectInspection(artifact) {
  const errors = []
  const fail = value => errors.push(value)
  if (!isObject(artifact)) return ['artifact_shape_invalid']
  if (artifact.schemaVersion !== SAJU_ANU_V6_V12_SCHEMA) fail('schema_version')
  if (artifact.version !== SAJU_ANU_V6_V12_VERSION) fail('version')
  if (artifact.candidatePacket?.trustBoundary !== 'untrusted_candidate_only') fail('candidate_trust_boundary')
  if (artifact.candidatePacket?.importedAsCanonicalEvidence !== false || artifact.candidatePacket?.sourceTextAndVerdictsImported !== false) fail('candidate_import_boundary')
  if (artifact.candidatePacket?.staleParentRejectedClaimsReintroduced !== false) fail('stale_parent_reintroduction')
  if (artifact.evidencePolicy?.ocr !== 'locator_only') fail('ocr_policy')
  if (artifact.evidencePolicy?.printedFolioPolicy !== 'null/unresolved unless a printed folio is directly and reliably legible on the inspected image') fail('printed_folio_policy')
  if (!Array.isArray(artifact.bitstreamInventory) || artifact.bitstreamInventory.length !== 7) fail('bitstream_count')
  const expectedVolumes = [6, 7, 8, 9, 10, 11, 12]
  if (JSON.stringify(artifact.bitstreamInventory.map(item => item.volume)) !== JSON.stringify(expectedVolumes)) fail('bitstream_volume_order')
  for (const expected of ANU_BITSTREAMS) {
    const actual = artifact.bitstreamInventory.find(item => item.volume === expected.volume)
    for (const key of ['fileName', 'bitstreamUuid', 'sizeBytes', 'md5', 'sha256', 'pdfPageCount']) if (actual?.[key] !== expected[key]) fail(`bitstream_identity:${expected.volume}:${key}`)
    if (actual?.apiHttpStatus !== 200) fail(`bitstream_http:${expected.volume}`)
  }
  if (!Array.isArray(artifact.volumeCrosswalk) || artifact.volumeCrosswalk.length !== 7) fail('crosswalk_count')
  for (const item of artifact.volumeCrosswalk) {
    if (!expectedVolumes.includes(item.volume)) fail(`crosswalk_volume:${item.volume}`)
    if (item.titlePage?.pdfPage !== 3) fail(`crosswalk_title_page:${item.volume}`)
    if (item.titlePage?.printedFolio !== null || item.titlePage?.printedFolioStatus !== 'unresolved_not_reliably_visible_in_inspected_render') fail(`crosswalk_folio_promoted:${item.volume}`)
    if (item.titlePage?.handwrittenMarkStatus !== 'directly_visible_but_not_a_printed_folio') fail(`crosswalk_handwritten_mark:${item.volume}`)
    if (item.titlePage?.titleToFolioRelation !== 'not_inferred') fail(`crosswalk_title_to_folio:${item.volume}`)
  }
  const observations = artifact.pageObservations || []
  for (const observation of observations) {
    if (observation.canonicalTextObserved !== false) fail(`observation_canonical:${observation.observationId}`)
    if (observation.semanticAuthority !== 'not_established') fail(`observation_authority:${observation.observationId}`)
    if (observation.printedFolio !== null) fail(`observation_folio:${observation.observationId}`)
  }
  const p7 = observations.find(item => item.observationId === 'obs.anu.v11.p7-dayun-heading')
  const p24 = observations.find(item => item.observationId === 'obs.anu.v11.p24-dayun-literal-variant')
  if (!p7 || !p7.observed?.includes('大運折除成歲小運逆順由時')) fail('p7_heading_missing')
  if (p7?.literalAudit?.oneTimeUnitTenDays !== 'not_observed_at_locator') fail('p7_time_unit_literal')
  if (p7?.jieSelection !== 'not_observed_at_locator' || p7?.workedExample !== 'not_observed_at_locator') fail('p7_scope_expanded')
  if (!p24 || !p24.observed?.includes('運行則一辰十歲') || !p24.observed?.includes('折除乃三日為年')) fail('p24_literals_missing')
  if (p24?.literalAudit?.oneChenTenYears !== 'direct_literal' || p24?.literalAudit?.threeDaysOneYear !== 'direct_literal_variant') fail('p24_literal_audit')
  if (p24?.literalAudit?.oneTimeUnitTenDays !== 'not_observed' || p24?.literalAudit?.oneDayFourMonths !== 'not_observed') fail('p24_literal_normalized')
  if (p24?.semanticRelation?.normalizationPerformed !== false) fail('p24_normalization')
  if (p24?.jieSelection !== 'not_observed_at_p23_p24_p25' || p24?.workedExample !== 'not_observed_at_p23_p24_p25') fail('p24_scope_expanded')
  if (artifact.sourceClaimReconciliation?.statusMutation !== false) fail('parent_claim_status_mutated')
  for (const claim of artifact.sourceClaimReconciliation?.claims || []) if (claim.statusBefore !== claim.statusAfter || claim.preserved !== true) fail(`parent_claim_changed:${claim.claimId}`)
  if (!artifact.digitalPhysicalRelationshipAudit?.separated) fail('independence_axes_mixed')
  for (const axis of artifact.digitalPhysicalRelationshipAudit?.axes || []) if (axis.countedAsIndependent === true || !INDEPENDENCE_AXES.includes(axis.axis)) fail(`independence_inflated:${axis.axis}`)
  if (artifact.digitalPhysicalRelationshipAudit?.canonicalTransmissionEdges?.length !== 0) fail('transmission_edge_promoted')
  if (artifact.lineageGraph?.canonicalEdges?.length !== 0 || artifact.lineageGraph?.newlyAddedEdges?.length !== 0) fail('canonical_graph_mutated')
  for (const edge of artifact.lineageGraph?.edges || []) {
    if (!LINEAGE_EDGE_STATES.includes(edge.status)) fail(`lineage_edge_status:${edge.edgeId}`)
    if (edge.canonicalGraphIncluded !== false) fail(`lineage_edge_included:${edge.edgeId}`)
  }
  if (artifact.timingReconciliation?.variantBoundary?.oneTimeUnitTenDays !== 'not_observed_and_not_derived') fail('timing_one_time_unit_promoted')
  if (artifact.timingReconciliation?.variantBoundary?.jieSelection !== 'not_observed_at_v11_p7_p24' || artifact.timingReconciliation?.variantBoundary?.workedExample !== 'not_observed_at_v11_p7_p24') fail('timing_scope_promoted')
  if (artifact.metadataRegressionAudit?.disposition?.twelveJuanCatalogExtent !== 'kept_metadata_only') fail('catalog_extent_promoted')
  if (artifact.metadataRegressionAudit?.disposition?.printedFolioCrosswalk !== 'unresolved') fail('printed_folio_crosswalk_promoted')
  if (artifact.metadataRegressionAudit?.disposition?.textualLineage !== 'unresolved' || artifact.metadataRegressionAudit?.disposition?.editionDate !== 'unresolved') fail('edition_lineage_promoted')
  if (artifact.readiness?.availableForInterpretation !== false || artifact.readiness?.productionActivation !== 'blocked' || artifact.readiness?.semanticAuthority !== 'not_established') fail('readiness_open')
  if (artifact.promotion?.stableClaimPromotionCount !== 0 || artifact.promotion?.promotionReadyClaimIds?.length !== 0 || artifact.promotion?.semanticAuthorityChanged !== false || artifact.promotion?.productionChanged !== false) fail('promotion_side_effect')
  if (artifact.typedReadinessRecalculation?.changedGateStates?.length !== 0 || artifact.typedReadinessRecalculation?.promotionReadyClaimIds?.length !== 0) fail('typed_readiness_changed')
  if (JSON.stringify(artifact.typedReadinessRecalculation?.before) !== JSON.stringify(artifact.typedReadinessRecalculation?.after)) fail('typed_readiness_before_after_differ')
  if (artifact.negativeChecks?.allMustReject !== true || JSON.stringify(artifact.negativeChecks?.ids) !== JSON.stringify([...NEGATIVE_CHECK_IDS])) fail('negative_checks_missing')
  if (artifact.contentSha256 !== contentHash(artifact)) fail('content_hash')
  return [...new Set(errors)].sort()
}
