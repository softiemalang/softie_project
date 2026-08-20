import { createHash } from 'node:crypto'

export const SAJU_GEMINI_WITNESS_DOSSIER_SCHEMA = 'saju-gemini-witness-dossier-adjudication-v1'
export const SAJU_GEMINI_WITNESS_DOSSIER_VERSION = '1.0.0'
export const GATE_KEYS = Object.freeze(['H', 'E', 'L', 'S', 'I', 'P'])
export const GATE_STATES = Object.freeze(['satisfied', 'unresolved', 'conflicted', 'not_applicable'])
export const CLAIM_STATUSES = Object.freeze(['supported', 'partially_supported', 'unsupported', 'unresolved'])
export const INDEPENDENCE_AXES = Object.freeze([
  'physical-item',
  'digital-derivation',
  'edition/textual-lineage',
  'semantic-corroboration',
])

const sha256 = value => createHash('sha256').update(value).digest('hex')

export const CANDIDATE_PACKET = Object.freeze({
  path: '/Users/softie/.gemini/antigravity-cli/brain/ebb37c1a-b791-4d55-92c3-0d4022511694/luna-witness-evidence-packet-v1.md',
  byteLength: 23686,
  byteSha256: '08386bd853691b209c8a82a2977f1e7bc9bd01215de14aa3a58cb98f86e05092',
  trustBoundary: 'untrusted_candidate_only',
  importedAsCanonicalEvidence: false,
  importedConclusionFields: [],
})

const nclGengcunRecordUrl = 'https://rbook.ncl.edu.tw/NCLSearch/Search/SearchDetail?item=00ccfe6380184da28912a57393deb2d7fDI2NTQ0NQ2.PBlfBdELN3au83ZWddAblOP5Y3FBX8h5SLzXyf79aB4_&image=1&page=1030&SourceID=1&HasImage='
const nlcWuxingRecordUrl = 'http://read.nlc.cn/allSearch/searchDetail?searchType=24&showType=1&indexName=data_892&fid=411999013122'
const nlcWuxingOpenUrl = 'http://read.nlc.cn/OutOpenBook/OpenObjectBook?aid=892&bid=114453.0'
const nlcWuxingCommonsUrl = 'https://commons.wikimedia.org/wiki/File:NLC892-411999013122-114453_%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80_%E7%AC%AC3%E5%86%8A.pdf'
const nlcWuxingCommonsApiUrl = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|sha1|mime|extmetadata&titles=File:NLC892-411999013122-114453_%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80_%E7%AC%AC3%E5%86%8A.pdf'
const ctextDayunUrl = 'https://ctext.org/wiki.pl?chapter=181298&if=gb'
const wasedaRecordUrl = 'https://www.wul.waseda.ac.jp/kotenseki/html/bunko19/bunko19_f0111/index.html'
const wasedaPdfUrl = 'https://archive.wul.waseda.ac.jp/kosho/bunko19/bunko19_f0111/bunko19_f0111.pdf'
const wasedaImageUrl = page => `https://archive.wul.waseda.ac.jp/kosho/bunko19/bunko19_f0111/bunko19_f0111_p${String(page).padStart(4, '0')}.jpg`

export const EXTERNAL_EVIDENCE = Object.freeze([
  {
    evidenceId: 'ev.ncl.gengcun.catalog-record',
    sourceId: 'source.ncl.ziping.gengcun-06599.catalog-rarecatx0441810',
    evidenceKind: 'first_party_institutional_catalog_html',
    status: 'parent_verified',
    url: nclGengcunRecordUrl,
    downloadedByteLength: 28675,
    downloadedByteSha256: '0c8d778b4ba8a2960b46430a12096aa8a5b82d7a7a19179b88b2e691c5772eff',
    observedFields: ['耕寸集不分卷', '306.5 06599', '06599', 'rarecatx0441810', '國家圖書館中文古籍聯合目錄', '國家圖書館'],
    scopeBoundary: 'Catalog identity only; the target page bytes are not admitted.',
  },
  {
    evidenceId: 'ev.ncl.gengcun.page-access-boundary',
    sourceId: 'source.ncl.ziping.gengcun-06599.catalog-rarecatx0441810',
    evidenceKind: 'first_party_viewer_access_boundary',
    status: 'parent_verified_blocker',
    url: nclGengcunRecordUrl,
    accessStatus: 'catalog_record_only_viewer_puzzle_captcha_gated',
    observed: 'The official page exposes a puzzle CAPTCHA before the viewer route; no CAPTCHA or access-control bypass was attempted.',
    scopeBoundary: 'No folio, banxin, seal, dimensions, date, or target passage is promoted from this page.',
  },
  {
    evidenceId: 'ev.nlc.wuxing.official-record',
    sourceId: 'source.nlc.wuxing-jingji.06857.fid-411999013122',
    evidenceKind: 'first_party_institutional_catalog_html',
    status: 'parent_verified',
    url: nlcWuxingRecordUrl,
    downloadedByteLength: 27414,
    downloadedByteSha256: '880b5ad0d1bea5ff092a7a4855e6a45f5dcc5e26adc90ee46e8f1934788debcc',
    observedFields: ['五行精紀', '(宋)廖中撰', '清[1644-1911]', '06857', '抄本', '10行24字，黑口，左右雙邊。', '存33卷：1～33。', '114453.0'],
    scopeBoundary: 'The official record identifies the holding and volume route; it does not by itself prove the candidate passage.',
  },
  {
    evidenceId: 'ev.nlc.wuxing.official-viewer-route',
    sourceId: 'source.nlc.wuxing-jingji.06857.fid-411999013122',
    evidenceKind: 'first_party_viewer_route',
    status: 'parent_verified_access_boundary',
    url: nlcWuxingOpenUrl,
    bid: '114453.0',
    officialPdfPath: 'data09/sbgj_shanbenguji/20151221_01szsb4171/duixiang/SBGJ04096_00003/SBGJ04096/00003/SBGJ04096_00003.pdf',
    scopeBoundary: 'The official viewer route applies permission checks; the directly inspected page images below are from the separately identified Commons mirror.',
  },
  {
    evidenceId: 'ev.nlc.wuxing.commons-scan',
    sourceId: 'source.nlc.wuxing-jingji.06857.vol3.public-scan',
    evidenceKind: 'public_mirror_of_institutional_scan',
    status: 'parent_verified_digital_derivation',
    url: nlcWuxingCommonsUrl,
    apiUrl: nlcWuxingCommonsApiUrl,
    byteLength: 37007952,
    byteSha256: 'e88387495032048b71d11196ee59861ad1bfeee4c7ca5ee80fd9686eb9d37d04',
    sourceSha1: '8a70c35c5a20a9fb68108615f0421e354ea145d4',
    pageCount: 110,
    nlcData: '892,411999013122,114453',
    scopeBoundary: 'Actual page images were inspected from this public mirror; it is not itself the physical item and is not counted as an independent textual lineage.',
  },
  {
    evidenceId: 'ev.ctext.wuxing.dayun-locator',
    sourceId: 'source.ctext.wuxing-jingji.vol33.transmitted-locator',
    evidenceKind: 'transmitted_web_text_locator',
    status: 'locator_only_not_canonical',
    url: ctextDayunUrl,
    scopeBoundary: 'The displayed wording can locate a candidate passage but cannot substitute for an institutional scan or establish edition lineage.',
  },
  {
    evidenceId: 'ev.waseda.bunko19-f0111.record',
    sourceId: 'source.waseda.bunko19-f0111',
    evidenceKind: 'first_party_institutional_catalog_html',
    status: 'parent_verified',
    url: wasedaRecordUrl,
    downloadedByteLength: 5638,
    downloadedByteSha256: '76aaa4cee42bae06dde7ae417565c31696739061a7fb03f96346ff1c776462e4',
    callNumber: '文庫19 F0111',
    title: '窮通宝鑑欄江綱 : 二巻首一巻坿増補月談',
    attributions: ['[清]・余星堂監定', '清・余春台輯', '清・曾寄廛校閲'],
    imprint: '[出版地不明 : 出版者不明]',
    description: '合1冊 ; 唐小',
    notes: '封面記:新鐫命理秘訣 巻第二板心下記:集賢堂',
    scopeBoundary: 'Official record identity and unknown imprint are promoted; an 1886 current-copy date is not inferred.',
  },
  {
    evidenceId: 'ev.waseda.bunko19-f0111.pdf',
    sourceId: 'source.waseda.bunko19-f0111',
    evidenceKind: 'first_party_institution_hosted_pdf',
    status: 'parent_verified_byte_identity',
    url: wasedaPdfUrl,
    byteLength: 82323986,
    byteSha256: '123ce84b44bd20ecfdd6538bffc413a5e3948598315cd99f857a5c985c7257ae',
    pageCount: 108,
    scopeBoundary: 'The PDF creation metadata is a scan/production timestamp, not an edition date.',
  },
  {
    evidenceId: 'ev.princeton.scsb-4603974.candidate',
    sourceId: 'source.princeton.scsb-4603974',
    evidenceKind: 'candidate_catalog_reference',
    status: 'not_parent_verified',
    candidateIdentifier: 'SCSB-4603974 / CU51356996',
    scopeBoundary: 'The dossier supplied this identifier, but no direct Princeton record or page was verified in this pass.',
  },
])

export const PAGE_OBSERVATIONS = Object.freeze([
  {
    observationId: 'obs.ncl.gengcun.catalog-identity',
    evidenceId: 'ev.ncl.gengcun.catalog-record',
    observationKind: 'institutional_record_identity',
    directObservation: 'The NCL HTML hidden fields identify 耕寸集不分卷, call number 306.5 06599, book number 06599, registration rarecatx0441810, source database, and rights owner.',
    pageBytesObserved: false,
    canonicalTextObserved: false,
  },
  {
    observationId: 'obs.ncl.gengcun.target-folio-blocked',
    evidenceId: 'ev.ncl.gengcun.page-access-boundary',
    observationKind: 'access_boundary',
    directObservation: 'The catalog page exposes a puzzle CAPTCHA before the viewer; target folios 1–2, 12–13, and 18–20 were not directly observed.',
    pageBytesObserved: false,
    canonicalTextObserved: false,
  },
  {
    observationId: 'obs.nlc.wuxing.official-record',
    evidenceId: 'ev.nlc.wuxing.official-record',
    observationKind: 'institutional_record_identity',
    directObservation: 'The NLC record identifies 五行精紀, 06857, 清抄本, 存33卷：1～33, and the third-volume bid 114453.0.',
    pageBytesObserved: false,
    canonicalTextObserved: false,
  },
  {
    observationId: 'obs.nlc.wuxing.vol33-heading',
    evidenceId: 'ev.nlc.wuxing.commons-scan',
    observationKind: 'direct_visual_scan_observation',
    locator: { renderedPdfPage: 86, printedFolio: '一' },
    pageImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/NLC892-411999013122-114453_%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80_%E7%AC%AC3%E5%86%8A.pdf',
    pageImageByteSha256: '9a4a61b6aab767c0f98de20b77b821f97654d99a2f60c3229f1c89aa5eb4e838',
    directObservation: 'The rendered page visibly carries 五行精紀卷第三十三 and printed folio 一.',
    pageBytesObserved: true,
    canonicalTextObserved: false,
  },
  {
    observationId: 'obs.nlc.wuxing.vol33-worked-example-not-observed',
    evidenceId: 'ev.nlc.wuxing.commons-scan',
    observationKind: 'bounded_negative_observation',
    locator: { renderedPdfPagesInspected: '86–110', printedVolume: '卷第三十三' },
    directObservation: 'The dossier’s candidate 甲子／十二月二十四日巳時／六十三時／六百三十日／丁丑 sequence was not directly observed during visual inspection of the available 卷33 renderings. This is not a claim that the wording is absent from every representation.',
    pageBytesObserved: true,
    canonicalTextObserved: false,
  },
  {
    observationId: 'obs.waseda.seasonal-headings',
    evidenceId: 'ev.waseda.bunko19-f0111.pdf',
    observationKind: 'direct_visual_scan_observation',
    locators: [
      { renderedPdfPage: 9, printedSection: '正月甲木', imageUrl: wasedaImageUrl(9), imageByteSha256: '7f152ad95d282cf782cee51d75878d1c867212b59a4723e49ac553646349bc21' },
      { renderedPdfPage: 10, printedSection: '二月甲木', imageUrl: wasedaImageUrl(10), imageByteSha256: 'd80e93fe6e23c1cc2045c1a3b9848e5e061c3688021444b417881b0bc6b38d7c' },
      { renderedPdfPage: 11, printedSection: '三月甲木', imageUrl: wasedaImageUrl(11), imageByteSha256: 'd5087c81e2a6133992f5009a53e4c15694db099ec38c19548c61a7f8a2a438d6' },
    ],
    directObservation: 'The three seasonal headings are visible in the institution-hosted scan.',
    pageBytesObserved: true,
    canonicalTextObserved: false,
  },
  {
    observationId: 'obs.waseda.preface-date-unresolved',
    evidenceId: 'ev.waseda.bunko19-f0111.pdf',
    observationKind: 'bounded_negative_observation',
    locators: [
      { renderedPdfPage: 2, imageByteSha256: '7bb296744d28274def29bb0a3f224d21693f84c924514c5403d14d2aeb5c58da' },
      { renderedPdfPage: 3, imageByteSha256: 'e0ed84a943196b49334db457e1fefd148b03bfab2768731c914367bc3799a0bf' },
    ],
    directObservation: 'A 序 page and the editorially attributed work are visible, but 光緒十二年丙戌 and a dated 余春台序 were not observed in the inspected pages; the official imprint is unknown.',
    pageBytesObserved: true,
    canonicalTextObserved: false,
  },
])

const defaultGates = () => ({ H: 'unresolved', E: 'unresolved', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' })
const defaultAxes = () => Object.fromEntries(INDEPENDENCE_AXES.map(axis => [axis, {
  state: 'unresolved',
  countedAsIndependent: false,
  sameLineageCandidate: false,
  missingEdges: [`${axis} independence evidence`],
}]))

const makeClaim = ({
  claimId,
  unit,
  candidateAssertion,
  status,
  evidenceRefs = [],
  gates = {},
  axes = {},
  falseBlockers = [],
  realBlockers = [],
  scopeCorrection,
  promotionTarget = 'none',
}) => ({
  claimId,
  unit,
  candidateAssertion,
  status,
  candidateEvidenceAccepted: false,
  parentVerifiedEvidenceRefs: [...evidenceRefs],
  gates: { ...defaultGates(), ...gates },
  independence: { ...defaultAxes(), ...axes },
  blockerAssessment: {
    falseBlockers: [...falseBlockers],
    realBlockers: [...realBlockers],
  },
  scopeCorrection,
  promotion: {
    target: promotionTarget,
    status: 'blocked',
    ready: false,
    reason: 'This adjudication is an evidence/readiness overlay only; no semantic authority or production activation follows.',
  },
})

const FALSE_RAW_OBSERVATION_BLOCKER = {
  blockerId: 'false.semantic-authority-for-bounded-observation',
  edge: 'semantic_authority',
  reason: 'Semantic authority is not required to report a bounded catalog or page observation, but it is also not granted by that observation.',
}

const REAL_A_FOLIO_BLOCKER = {
  blockerId: 'blocker.ncl.gengcun.target-folio-bytes',
  edge: 'H/E',
  reason: 'Authorized access to the target folios and a date/colophon observation is required before the manuscript can support the claimed passages or age.',
}

const REAL_B_RECORD_BLOCKER = {
  blockerId: 'blocker.ziping.pre-1926.first-party-records',
  edge: 'H/E/I',
  reason: 'First-party catalog identifiers and page-level title/imprint/target-section scans for both dated witnesses are missing.',
}

const REAL_C_PASSAGE_BLOCKER = {
  blockerId: 'blocker.wuxing.vol33.target-passage-page',
  edge: 'H/E/S/I',
  reason: 'The public mirror identifies and shows 卷33, but the candidate worked example and exact section wording were not directly observed; the official route applies permission checks.',
}

const REAL_F_DATE_BLOCKER = {
  blockerId: 'blocker.waseda.preface-date-and-colophon',
  edge: 'E/I',
  reason: 'The official Waseda record has unknown imprint and the inspected scan pages do not establish the claimed 1886 date for the current copy.',
}

export function buildSajuGeminiWitnessDossierAdjudication({ basisHead, typedReadinessReference = null } = {}) {
  const claims = [
    makeClaim({
      claimId: 'claim.unit-a.ncl-record-identity',
      unit: 'A',
      candidateAssertion: 'NCL 06599 / rarecatx0441810 identifies 耕寸集不分卷.',
      status: 'supported',
      evidenceRefs: ['ev.ncl.gengcun.catalog-record', 'obs.ncl.gengcun.catalog-identity'],
      gates: { H: 'satisfied', E: 'satisfied', S: 'not_applicable', P: 'unresolved' },
      axes: { 'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] } },
      falseBlockers: [FALSE_RAW_OBSERVATION_BLOCKER],
      realBlockers: [REAL_A_FOLIO_BLOCKER],
      scopeCorrection: 'Promote only the catalog-level identity; do not promote page content, exact date, or textual-witness status.',
    }),
    makeClaim({
      claimId: 'claim.unit-a.ncl-physical-description',
      unit: 'A',
      candidateAssertion: 'The dossier’s full physical description, seals, dimensions, and page layout were directly verified.',
      status: 'partially_supported',
      evidenceRefs: ['ev.ncl.gengcun.catalog-record'],
      gates: { H: 'satisfied', E: 'unresolved', S: 'not_applicable', P: 'unresolved' },
      axes: { 'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] } },
      falseBlockers: [FALSE_RAW_OBSERVATION_BLOCKER],
      realBlockers: [REAL_A_FOLIO_BLOCKER],
      scopeCorrection: 'Only title/call/accession/registration/owner fields are parent-observed here; the dossier’s dimensions, folio layout, and seals remain unverified in this pass.',
    }),
    makeClaim({
      claimId: 'claim.unit-a.ncl-target-folios-and-passages',
      unit: 'A',
      candidateAssertion: 'Folios 1–2, 12–13, and 18–20 contain the cited 子平真詮 / 用神 / 相神 / 行運 passages.',
      status: 'unresolved',
      evidenceRefs: ['ev.ncl.gengcun.page-access-boundary', 'obs.ncl.gengcun.target-folio-blocked'],
      gates: { S: 'unresolved', P: 'unresolved' },
      axes: { 'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] } },
      falseBlockers: [FALSE_RAW_OBSERVATION_BLOCKER],
      realBlockers: [REAL_A_FOLIO_BLOCKER],
      scopeCorrection: 'Candidate transcriptions are not accepted as page observations until authorized page bytes or a first-party image route is available.',
    }),
    makeClaim({
      claimId: 'claim.unit-a.pre-1776-early-witness',
      unit: 'A',
      candidateAssertion: 'The NCL item is pre-1776 or otherwise an early direct witness of the later 子平真詮 text.',
      status: 'unsupported',
      evidenceRefs: ['ev.ncl.gengcun.catalog-record'],
      gates: { H: 'unresolved', E: 'unresolved', S: 'unresolved', P: 'unresolved' },
      axes: { 'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] } },
      falseBlockers: [FALSE_RAW_OBSERVATION_BLOCKER],
      realBlockers: [REAL_A_FOLIO_BLOCKER],
      scopeCorrection: 'The official record exposes a 清 category, not an exact year; no pre-1776 or early-witness claim is admitted.',
      promotionTarget: 'lineage_specific_stability',
    }),
    makeClaim({
      claimId: 'claim.unit-b.1895-baohuicaotang-witness',
      unit: 'B',
      candidateAssertion: 'An 1895 報暉草堂 physical witness is institutionally catalog-anchored with the stated target sections.',
      status: 'unresolved',
      gates: { S: 'unresolved', P: 'unresolved' },
      falseBlockers: [FALSE_RAW_OBSERVATION_BLOCKER],
      realBlockers: [REAL_B_RECORD_BLOCKER],
      scopeCorrection: 'Non-institutional web locators are retained as leads only; no dated holding or page text was parent-verified.',
      promotionTarget: 'lineage_specific_stability',
    }),
    makeClaim({
      claimId: 'claim.unit-b.1923-yuxin-witness',
      unit: 'B',
      candidateAssertion: 'A 1923 紹興育新書局 witness is institutionally catalog-anchored with the stated target sections.',
      status: 'unresolved',
      gates: { S: 'unresolved', P: 'unresolved' },
      falseBlockers: [FALSE_RAW_OBSERVATION_BLOCKER],
      realBlockers: [REAL_B_RECORD_BLOCKER],
      scopeCorrection: 'The 1923 date and institutional holdings remain candidate metadata until an original library record or scan is captured.',
      promotionTarget: 'lineage_specific_stability',
    }),
    makeClaim({
      claimId: 'claim.unit-b.two-independent-pre-1926-witnesses',
      unit: 'B',
      candidateAssertion: 'The 1895 and 1923 items establish two independent physical/edition lineages before 1926.',
      status: 'unsupported',
      gates: { S: 'unresolved', P: 'unresolved' },
      falseBlockers: [FALSE_RAW_OBSERVATION_BLOCKER],
      realBlockers: [REAL_B_RECORD_BLOCKER],
      scopeCorrection: 'Date labels alone do not establish physical-item independence, digital independence, or textual-lineage independence.',
      promotionTarget: 'cross_lineage_stability',
    }),
    makeClaim({
      claimId: 'claim.unit-b.target-sections-directly-observed',
      unit: 'B',
      candidateAssertion: 'The cited 用神 / 相神 / 行運 sections were directly observed in both dated witnesses.',
      status: 'unresolved',
      gates: { S: 'unresolved', P: 'unresolved' },
      falseBlockers: [FALSE_RAW_OBSERVATION_BLOCKER],
      realBlockers: [REAL_B_RECORD_BLOCKER],
      scopeCorrection: 'No target page or scan byte was verified for either item in this pass.',
      promotionTarget: 'historical_observation_stability',
    }),
    makeClaim({
      claimId: 'claim.unit-c.nlc-official-record',
      unit: 'C',
      candidateAssertion: 'NLC 06857 / fid 411999013122 identifies a 清抄本 五行精紀 with 卷1–33 and third-volume route 114453.0.',
      status: 'supported',
      evidenceRefs: ['ev.nlc.wuxing.official-record', 'obs.nlc.wuxing.official-record'],
      gates: { H: 'satisfied', E: 'satisfied', S: 'not_applicable', P: 'unresolved' },
      axes: { 'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] } },
      falseBlockers: [FALSE_RAW_OBSERVATION_BLOCKER],
      realBlockers: [REAL_C_PASSAGE_BLOCKER],
      scopeCorrection: 'Promote the official bibliographic identity only; do not promote the dossier’s passage or procedure from the record.',
    }),
    makeClaim({
      claimId: 'claim.unit-c.public-scan-vol33-identity',
      unit: 'C',
      candidateAssertion: 'The Commons PDF is a directly inspectable digital representation of the NLC third volume and contains 卷33.',
      status: 'supported',
      evidenceRefs: ['ev.nlc.wuxing.commons-scan', 'obs.nlc.wuxing.vol33-heading'],
      gates: { H: 'satisfied', E: 'satisfied', S: 'not_applicable', P: 'unresolved' },
      axes: {
        'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: true, missingEdges: [] },
        'digital-derivation': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: true, missingEdges: [] },
      },
      falseBlockers: [FALSE_RAW_OBSERVATION_BLOCKER],
      realBlockers: [REAL_C_PASSAGE_BLOCKER],
      scopeCorrection: 'The mirror is not a second physical or textual witness; it is a traceable public digital derivation of the NLC item.',
    }),
    makeClaim({
      claimId: 'claim.unit-c.vol33-dayun-heading-and-rules',
      unit: 'C',
      candidateAssertion: '卷33 directly displays a 論大運 section and the full 3日=1歲 / 1日=4月 / 1時=10日 rule family.',
      status: 'unresolved',
      evidenceRefs: ['obs.nlc.wuxing.vol33-heading', 'obs.nlc.wuxing.vol33-worked-example-not-observed', 'ev.ctext.wuxing.dayun-locator'],
      gates: { H: 'unresolved', E: 'unresolved', S: 'unresolved', P: 'unresolved' },
      axes: {
        'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: true, missingEdges: [] },
        'digital-derivation': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: true, missingEdges: [] },
      },
      falseBlockers: [FALSE_RAW_OBSERVATION_BLOCKER],
      realBlockers: [REAL_C_PASSAGE_BLOCKER],
      scopeCorrection: 'The heading at page 86 establishes 卷33 identity, not the exact section wording; Ctext remains a locator-only corroboration.',
      promotionTarget: 'historical_observation_stability',
    }),
    makeClaim({
      claimId: 'claim.unit-c.complete-worked-example',
      unit: 'C',
      candidateAssertion: 'The NLC witness directly shows the 甲子／12月24日巳時／12月29日申時／63時／630日／1歲9個月／丁丑 worked example.',
      status: 'unresolved',
      evidenceRefs: ['obs.nlc.wuxing.vol33-worked-example-not-observed', 'ev.ctext.wuxing.dayun-locator'],
      gates: { H: 'unresolved', E: 'unresolved', S: 'unresolved', P: 'unresolved' },
      axes: {
        'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: true, missingEdges: [] },
        'digital-derivation': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: true, missingEdges: [] },
      },
      falseBlockers: [FALSE_RAW_OBSERVATION_BLOCKER],
      realBlockers: [REAL_C_PASSAGE_BLOCKER],
      scopeCorrection: 'The candidate wording is not copied into canonical evidence. It remains a locator target pending exact page observation from an authorized or primary scan.',
      promotionTarget: 'historical_observation_stability',
    }),
    makeClaim({
      claimId: 'claim.unit-d.six-stage-dayun-procedure',
      unit: 'D',
      candidateAssertion: 'The complete six-stage historical 大運 procedure is resolved from the worked example.',
      status: 'unresolved',
      evidenceRefs: ['claim.unit-c.complete-worked-example', 'ev.ctext.wuxing.dayun-locator'],
      gates: { H: 'unresolved', E: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
      falseBlockers: [{ blockerId: 'false.modern-arithmetic-substitution', edge: 'calculation', reason: 'Modern arithmetic may test a transcription after the historical passage is observed, but cannot substitute for that observation.' }],
      realBlockers: [REAL_C_PASSAGE_BLOCKER],
      scopeCorrection: 'Do not mix a modern recomputation with historical source observation; first capture the exact passage and its section/folio.',
      promotionTarget: 'implementation_safe_grounding',
    }),
    makeClaim({
      claimId: 'claim.unit-d.implementation-safe-conversion',
      unit: 'D',
      candidateAssertion: 'The worked example proves exact double-hour arithmetic and historical implementation adherence.',
      status: 'unsupported',
      evidenceRefs: ['claim.unit-c.complete-worked-example'],
      gates: { H: 'unresolved', E: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
      falseBlockers: [{ blockerId: 'false.implementation-promotion-from-one-example', edge: 'implementation_grounding', reason: 'A single candidate example cannot by itself establish a production algorithm, calendar policy, rounding order, or implementation authority.' }],
      realBlockers: [REAL_C_PASSAGE_BLOCKER],
      scopeCorrection: 'Even a later verified historical example would remain a bounded source observation until independent semantic collation and implementation review are complete.',
      promotionTarget: 'implementation_safe_grounding',
    }),
    makeClaim({
      claimId: 'claim.unit-e.princeton-catalog-copy',
      unit: 'E',
      candidateAssertion: 'Princeton/ReCAP SCSB-4603974 / CU51356996 is a verified 1937 286-page physical copy.',
      status: 'unresolved',
      evidenceRefs: ['ev.princeton.scsb-4603974.candidate'],
      gates: { S: 'not_applicable', P: 'unresolved' },
      falseBlockers: [FALSE_RAW_OBSERVATION_BLOCKER],
      realBlockers: [{ blockerId: 'blocker.princeton.first-party-catalog', edge: 'H/E', reason: 'A direct Princeton/SCSB catalog record and, if required, scan or request metadata were not verified in this pass.' }],
      scopeCorrection: 'Keep the identifier as an acquisition lead only; do not treat candidate catalog prose as verified physical metadata.',
    }),
    makeClaim({
      claimId: 'claim.unit-e.princeton-reprint-lineage',
      unit: 'E',
      candidateAssertion: 'The Princeton item is a modern commercial reprint of a Ming Yang Cong recension and is not an independent pre-modern witness.',
      status: 'unresolved',
      evidenceRefs: ['ev.princeton.scsb-4603974.candidate'],
      gates: { H: 'unresolved', E: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
      falseBlockers: [FALSE_RAW_OBSERVATION_BLOCKER],
      realBlockers: [{ blockerId: 'blocker.princeton.edition-lineage', edge: 'E/I', reason: 'The publication statement, physical pages, and relation to the alleged Ming recension require first-party record/page evidence.' }],
      scopeCorrection: 'No independence or reprint classification is admitted without the item-level record and relevant pages.',
      promotionTarget: 'lineage_specific_stability',
    }),
    makeClaim({
      claimId: 'claim.unit-e.princeton-negative-independence-conclusion',
      unit: 'E',
      candidateAssertion: 'The absence of a public Princeton scan and candidate reprint description closes the independence question.',
      status: 'unsupported',
      evidenceRefs: ['ev.princeton.scsb-4603974.candidate'],
      gates: { H: 'unresolved', E: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
      falseBlockers: [{ blockerId: 'false.public-scan-as-readiness-gate', edge: 'digital-access', reason: 'A public scan is not required for a metadata-only classification if an official record is actually verified.' }],
      realBlockers: [{ blockerId: 'blocker.princeton.first-party-catalog', edge: 'H/E/I', reason: 'The official item record and physical/edition lineage evidence remain open.' }],
      scopeCorrection: 'Unknown access is not evidence of non-independence.',
    }),
    makeClaim({
      claimId: 'claim.unit-f.waseda-record-identity',
      unit: 'F',
      candidateAssertion: 'Waseda bunko19_f0111 identifies the stated Qiong tong bao jian record and Qing editorial attributions.',
      status: 'supported',
      evidenceRefs: ['ev.waseda.bunko19-f0111.record'],
      gates: { H: 'satisfied', E: 'satisfied', S: 'not_applicable', P: 'unresolved' },
      axes: { 'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] } },
      falseBlockers: [FALSE_RAW_OBSERVATION_BLOCKER],
      realBlockers: [REAL_F_DATE_BLOCKER],
      scopeCorrection: 'Promote official record identity, attribution display, and unknown imprint only.',
    }),
    makeClaim({
      claimId: 'claim.unit-f.seasonal-headings',
      unit: 'F',
      candidateAssertion: 'The institution-hosted scan visibly contains 正月甲木, 二月甲木, and 三月甲木 at pages 9–11.',
      status: 'supported',
      evidenceRefs: ['ev.waseda.bunko19-f0111.pdf', 'obs.waseda.seasonal-headings'],
      gates: { H: 'satisfied', E: 'unresolved', L: 'unresolved', S: 'not_applicable', P: 'unresolved' },
      axes: {
        'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] },
        'digital-derivation': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] },
      },
      falseBlockers: [FALSE_RAW_OBSERVATION_BLOCKER],
      realBlockers: [REAL_F_DATE_BLOCKER],
      scopeCorrection: 'This is a bounded page-heading observation, not a semantic equivalence or dated-edition claim.',
      promotionTarget: 'historical_observation_stability',
    }),
    makeClaim({
      claimId: 'claim.unit-f.preface-date',
      unit: 'F',
      candidateAssertion: 'The scan contains a 余春台序 dated 光緒十二年丙戌 (1886).',
      status: 'unresolved',
      evidenceRefs: ['ev.waseda.bunko19-f0111.record', 'obs.waseda.preface-date-unresolved'],
      gates: { H: 'unresolved', E: 'unresolved', S: 'not_applicable', P: 'unresolved' },
      axes: { 'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] } },
      falseBlockers: [FALSE_RAW_OBSERVATION_BLOCKER],
      realBlockers: [REAL_F_DATE_BLOCKER],
      scopeCorrection: 'A visible 序 page and Qing editorial attribution do not establish the candidate date; date-bearing folio/colophon remains required.',
      promotionTarget: 'edition/textual-lineage',
    }),
    makeClaim({
      claimId: 'claim.unit-f.current-copy-date',
      unit: 'F',
      candidateAssertion: 'The current Waseda copy/edition was printed in the late Qing or in 1886.',
      status: 'unsupported',
      evidenceRefs: ['ev.waseda.bunko19-f0111.record'],
      gates: { H: 'unresolved', E: 'unresolved', S: 'not_applicable', P: 'unresolved' },
      axes: { 'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] } },
      falseBlockers: [FALSE_RAW_OBSERVATION_BLOCKER],
      realBlockers: [REAL_F_DATE_BLOCKER],
      scopeCorrection: 'The official imprint is [出版地不明 : 出版者不明]; preface date, compiler attribution, and current-copy date must remain separate.',
      promotionTarget: 'edition/textual-lineage',
    }),
    makeClaim({
      claimId: 'claim.unit-f.word-for-word-seasonal-stability',
      unit: 'F',
      candidateAssertion: 'The Waseda seasonal clauses match the 1926/1937 NLC recensions word-for-word and establish high textual stability.',
      status: 'unresolved',
      evidenceRefs: ['obs.waseda.seasonal-headings', 'ev.waseda.bunko19-f0111.pdf'],
      gates: { H: 'satisfied', E: 'unresolved', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
      axes: {
        'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] },
        'digital-derivation': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] },
      },
      falseBlockers: [FALSE_RAW_OBSERVATION_BLOCKER],
      realBlockers: [REAL_F_DATE_BLOCKER, { blockerId: 'blocker.waseda.cross-edition-page-collation', edge: 'S/I', reason: 'The comparator pages and edition lineage for the 1926/1937 recensions were not directly collated in this pass.' }],
      scopeCorrection: 'Headings are supported; word-for-word stability, semantic corroboration, and independent lineage are not.',
      promotionTarget: 'cross_lineage_stability',
    }),
    makeClaim({
      claimId: 'claim.overall.dossier-all-units-resolved',
      unit: 'E',
      candidateAssertion: 'The candidate packet’s ALL UNITS RESOLVED conclusion and L/I/P promotion claims are established.',
      status: 'unsupported',
      evidenceRefs: ['ev.ncl.gengcun.page-access-boundary', 'ev.princeton.scsb-4603974.candidate', 'obs.nlc.wuxing.vol33-worked-example-not-observed', 'obs.waseda.preface-date-unresolved'],
      gates: { H: 'unresolved', E: 'unresolved', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
      falseBlockers: [{ blockerId: 'false.candidate-baseline-as-proof', edge: 'all-gates', reason: 'A candidate packet’s baseline counts are not parent verification and cannot promote readiness.' }],
      realBlockers: [REAL_A_FOLIO_BLOCKER, REAL_B_RECORD_BLOCKER, REAL_C_PASSAGE_BLOCKER, REAL_F_DATE_BLOCKER],
      scopeCorrection: 'Parent overlay remains fail-closed: promotionReadyClaimIds=[], availableForInterpretation=false, semanticAuthority=not_established, productionActivation=blocked.',
      promotionTarget: 'implementation_safe_grounding',
    }),
  ]

  const gateStateCounts = Object.fromEntries(GATE_KEYS.map(gate => [gate, Object.fromEntries(GATE_STATES.map(state => [state, claims.filter(claim => claim.gates[gate] === state).length]))]))
  const parentVerifiedClaimIds = claims.filter(claim => claim.status === 'supported').map(claim => claim.claimId)

  return {
    schemaVersion: SAJU_GEMINI_WITNESS_DOSSIER_SCHEMA,
    version: SAJU_GEMINI_WITNESS_DOSSIER_VERSION,
    basisHead,
    scope: {
      purpose: 'Parent verification overlay for an untrusted candidate historical-evidence packet.',
      sourceOfTruth: 'Parent-observed institutional records, byte-identified scans, and bounded visual page observations.',
      forbiddenPromotion: ['canonical_text', 'semantic_authority', 'availableForInterpretation', 'production_activation', 'implementation_rule'],
      ocrPolicy: 'OCR or transmitted web text may locate a page only; no OCR/text-web locator is canonical evidence.',
      modernArithmeticPolicy: 'Modern recomputation is not used to upgrade historical source status.',
    },
    candidatePacket: CANDIDATE_PACKET,
    externalEvidence: EXTERNAL_EVIDENCE,
    pageObservations: PAGE_OBSERVATIONS,
    claims,
    blockerLedger: {
      falseBlockers: [
        { blockerId: 'false.semantic-authority-for-bounded-observation', status: 'not_a_blocker_for_raw_observation', note: 'Semantic authority is not needed to record an official record or visible heading.' },
        { blockerId: 'false.modern-arithmetic-substitution', status: 'not_a_resolution_route', note: 'Arithmetic cannot replace direct historical page observation.' },
        { blockerId: 'false.candidate-baseline-as-proof', status: 'not_evidence', note: 'The dossier’s H/E/S/L/I/P counts are candidate assertions only.' },
      ],
      realBlockers: [
        REAL_A_FOLIO_BLOCKER,
        REAL_B_RECORD_BLOCKER,
        REAL_C_PASSAGE_BLOCKER,
        REAL_F_DATE_BLOCKER,
        { blockerId: 'blocker.princeton.first-party-catalog', edge: 'H/E', reason: 'Princeton candidate metadata was not directly verified.' },
      ],
    },
    readinessOverlay: {
      reportedByCandidate: { H: 13, E: 12, L: 0, S: 11, I: 0, P: 0, trust: 'untrusted_candidate_baseline' },
      parentVerified: {
        comparablePopulation: '23 adjudicated candidate assertions; counts are not numerically comparable to the candidate’s 13-claim baseline.',
        gateStateCounts,
        parentVerifiedClaimIds,
        promotionReadyClaimIds: [],
        availableForInterpretation: false,
        semanticAuthority: 'not_established',
        productionActivation: 'blocked',
        implementationSafeGrounding: 'not_established',
      },
    },
    predecessorReadinessReference: typedReadinessReference,
    promotion: {
      status: 'blocked',
      ready: false,
      promotionReadyClaimIds: [],
      semanticAuthorityChanged: false,
      productionChanged: false,
      interpretationAvailable: false,
    },
    summary: {
      claimCount: claims.length,
      statusCounts: Object.fromEntries(CLAIM_STATUSES.map(status => [status, claims.filter(claim => claim.status === status).length])),
      parentVerifiedClaimCount: parentVerifiedClaimIds.length,
      realBlockerCount: 5,
      promotionReadyClaimCount: 0,
      supportedScope: [
        'NCL 06599 catalog identity only',
        'NLC 06857 official record and public vol3/卷33 identity',
        'Waseda bunko19_f0111 official record and pages 9–11 seasonal headings',
      ],
      unresolvedScope: [
        'NCL target folios and early date',
        '1895/1923 first-party dated witnesses',
        'NLC exact 論大運 passage and worked example',
        'Princeton candidate record and lineage',
        'Waseda 1886 date and cross-edition word-for-word stability',
      ],
    },
  }
}

const isObject = value => Boolean(value && typeof value === 'object' && !Array.isArray(value))

export function checkSajuGeminiWitnessDossierAdjudication(artifact) {
  const errors = []
  if (!isObject(artifact)) return ['artifact_shape_invalid']
  if (artifact.schemaVersion !== SAJU_GEMINI_WITNESS_DOSSIER_SCHEMA) errors.push('schema_version')
  if (artifact.version !== SAJU_GEMINI_WITNESS_DOSSIER_VERSION) errors.push('version')
  if (artifact.candidatePacket?.trustBoundary !== 'untrusted_candidate_only') errors.push('candidate_trust_boundary')
  if (artifact.candidatePacket?.importedAsCanonicalEvidence !== false) errors.push('candidate_import_boundary')
  if (artifact.candidatePacket?.importedConclusionFields?.length !== 0) errors.push('candidate_conclusion_import')
  if (!Array.isArray(artifact.claims) || artifact.claims.length !== 23) errors.push('claim_count')
  if (!Array.isArray(artifact.externalEvidence) || artifact.externalEvidence.length < 9) errors.push('external_evidence_count')
  if (!Array.isArray(artifact.pageObservations) || artifact.pageObservations.length < 7) errors.push('page_observation_count')

  for (const claim of artifact.claims || []) {
    if (!CLAIM_STATUSES.includes(claim.status)) errors.push(`claim:${claim.claimId}:status`)
    for (const gate of GATE_KEYS) {
      if (!GATE_STATES.includes(claim.gates?.[gate])) errors.push(`claim:${claim.claimId}:gate:${gate}`)
    }
    for (const axis of INDEPENDENCE_AXES) {
      const evidence = claim.independence?.[axis]
      if (!isObject(evidence)) errors.push(`claim:${claim.claimId}:axis:${axis}:missing`)
      if (evidence?.countedAsIndependent === true) errors.push(`claim:${claim.claimId}:axis:${axis}:counted_as_independent`)
    }
    if (claim.promotion?.ready !== false || claim.promotion?.status !== 'blocked') errors.push(`claim:${claim.claimId}:promotion_not_blocked`)
    if (claim.candidateEvidenceAccepted !== false) errors.push(`claim:${claim.claimId}:candidate_evidence_accepted`)
  }

  if (artifact.readinessOverlay?.parentVerified?.promotionReadyClaimIds?.length !== 0) errors.push('readiness_promotion')
  if (artifact.readinessOverlay?.parentVerified?.availableForInterpretation !== false) errors.push('readiness_available')
  if (artifact.readinessOverlay?.parentVerified?.semanticAuthority !== 'not_established') errors.push('readiness_semantic_authority')
  if (artifact.readinessOverlay?.parentVerified?.productionActivation !== 'blocked') errors.push('readiness_activation')
  if (artifact.promotion?.ready !== false || artifact.promotion?.status !== 'blocked') errors.push('promotion_not_blocked')
  if (artifact.promotion?.semanticAuthorityChanged !== false || artifact.promotion?.productionChanged !== false || artifact.promotion?.interpretationAvailable !== false) errors.push('promotion_side_effect')

  const overall = artifact.claims?.find(claim => claim.claimId === 'claim.overall.dossier-all-units-resolved')
  if (overall?.status !== 'unsupported') errors.push('overall_overclaim_not_rejected')
  const cExample = artifact.claims?.find(claim => claim.claimId === 'claim.unit-c.complete-worked-example')
  if (cExample?.status !== 'unresolved') errors.push('worked_example_overclaim_not_unresolved')
  const aFolios = artifact.claims?.find(claim => claim.claimId === 'claim.unit-a.ncl-target-folios-and-passages')
  if (aFolios?.status !== 'unresolved') errors.push('ncl_folio_boundary')
  const bIndependence = artifact.claims?.find(claim => claim.claimId === 'claim.unit-b.two-independent-pre-1926-witnesses')
  if (bIndependence?.status !== 'unsupported') errors.push('pre1926_independence_boundary')
  const fDate = artifact.claims?.find(claim => claim.claimId === 'claim.unit-f.current-copy-date')
  if (fDate?.status !== 'unsupported') errors.push('waseda_date_boundary')

  return [...new Set(errors)].sort()
}

export const EXTERNAL_SOURCE_URLS = Object.freeze({
  nclGengcunRecordUrl,
  nlcWuxingRecordUrl,
  nlcWuxingOpenUrl,
  nlcWuxingCommonsUrl,
  nlcWuxingCommonsApiUrl,
  ctextDayunUrl,
  wasedaRecordUrl,
  wasedaPdfUrl,
})

export const candidatePacketByteSha256 = value => sha256(value)
