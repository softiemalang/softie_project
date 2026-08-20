import { createHash } from 'node:crypto'

export const SAJU_LUNA_DEEP_COLLATION_V4_SCHEMA = 'saju-luna-deep-collation-adjudication-v4'
export const SAJU_LUNA_DEEP_COLLATION_V4_VERSION = '4.0.0'

export const GATE_KEYS = Object.freeze(['H', 'E', 'L', 'S', 'I', 'P'])
export const GATE_STATES = Object.freeze(['satisfied', 'unresolved', 'conflicted', 'not_applicable'])
export const INDEPENDENCE_AXES = Object.freeze([
  'physical-item',
  'digital-derivation',
  'edition/textual-lineage',
  'semantic-corroboration',
])
export const VARIANT_STATUSES = Object.freeze(['verified', 'corrected', 'rejected', 'unresolved'])
export const CLAIM_STATUSES = Object.freeze(['supported', 'partially_supported', 'unsupported', 'unresolved'])
export const SOURCE_CATEGORIES = Object.freeze([
  'DIRECT_OFFICIAL_SCAN',
  'DIRECT_DERIVATIVE_SCAN',
  'INSTITUTIONAL_METADATA',
  'PHYSICAL_ITEM_CANDIDATE',
  'INFERENCE',
  'UNRESOLVED',
])

const sha256 = value => createHash('sha256').update(value).digest('hex')

const candidateRoot = '/Users/softie/.gemini/antigravity-cli/brain/ebb37c1a-b791-4d55-92c3-0d4022511694'

export const CANDIDATE_PACKET_FILES = Object.freeze([
  {
    role: 'packet',
    path: `${candidateRoot}/luna-deep-collation-packet-v4.md`,
    byteLength: 10386,
    byteSha256: '49f1408be79509ea5d1f598eafd3e63d9fe74ea290ddd156aa63e36170ecfc16',
  },
  {
    role: 'matrix',
    path: `${candidateRoot}/luna-deep-collation-matrix-v4.json`,
    byteLength: 7669,
    byteSha256: '046e2e824fdc4011227e5b7b982802707591caecf903ef9c045906cc9f365f37',
  },
  {
    role: 'packet_metadata',
    path: `${candidateRoot}/luna-deep-collation-packet-v4.md.metadata.json`,
    byteLength: 180,
    byteSha256: 'b69e5c0572e29822ec9d5c5e16e4eb7fcde720b4064c99d2916fd99d8385972c',
  },
  {
    role: 'matrix_metadata',
    path: `${candidateRoot}/luna-deep-collation-matrix-v4.json.metadata.json`,
    byteLength: 180,
    byteSha256: '6d4d3ae365534b3850194ed9af10ab5a4fe183b6209ff4f9bf070d676a0e9893',
  },
])

export const CANDIDATE_PACKET = Object.freeze({
  campaign: 'LUNA-DEEP-COLLATION-CAMPAIGN-V4',
  modelClaimedByUser: 'Gemini 3.7 Flash High v4',
  executionRole: 'Gemini 3.7 Flash High (Acquisition Agent)',
  packetSchemaVersion: '4.0.0',
  packetFiles: CANDIDATE_PACKET_FILES.map(file => ({ ...file })),
  selfDeclaredAdjudicationBoundary: 'non_adjudicative',
  trustBoundary: 'untrusted_candidate_only',
  importedAsCanonicalEvidence: false,
  importedConclusionFields: [],
  actualModelRuntimeVerified: false,
  sourceTextAndVerdictsImported: false,
})

export const EXTERNAL_SOURCE_URLS = Object.freeze({
  jsgRecord: 'https://jsg.aks.ac.kr/dir/view?dataId=JSG_K3-437',
  jsgELibraryRecord: 'https://jsg.aks.ac.kr/dir/view?dataId=LIB_116678',
  jsgPdf: 'https://jsg.aks.ac.kr/data/serviceFiles/pdf/K3-437_006.pdf',
  nlcRecord: 'http://read.nlc.cn/allSearch/searchDetail?searchType=24&showType=1&indexName=data_892&fid=411999013122',
  nlcReader: 'http://read.nlc.cn/OutOpenBook/OpenObjectBook?aid=892&bid=114503.0',
  nlcDerivativePage: 'https://commons.wikimedia.org/wiki/File:NLC892-411999013122-114503_%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80_%E7%AC%AC4%E5%86%8A.pdf',
  nlcDerivativePdf: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/NLC892-411999013122-114503_%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80_%E7%AC%AC4%E5%86%8A.pdf',
  kyujanggakRecord: 'https://kyudb.snu.ac.kr/book/view.do?book_cd=GC01822_00',
  wonkwangSearchBoundary: 'https://www.wku.ac.kr/',
  wonkwangSecondaryLead: 'https://dh.aks.ac.kr/sillokwiki/index.php/%EC%98%A4%ED%96%89%EC%A0%95%EA%B8%B0%28%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80%29',
  sonkeikakuAccessBoundary: 'https://east.skku.edu/',
  sonkeikakuCollectionOverview: 'https://www.skku.edu/skku/campus/skk_comm/news.do?article.offset=0&articleLimit=10&articleNo=127029&mode=view',
})

const scopeBoundary = 'A bounded record or page observation is admitted only at its stated locator and source category; it is not canonical text, semantic authority, interpretation readiness, implementation grounding, or activation.'
const candidateBoundary = 'The Gemini v4 packet and matrix are byte-identified candidate input only. Their transcription, metadata, variant labels, and conclusions are not imported without parent verification.'
const noCanonicalText = { canonicalTextObserved: false, canonicalTextAdmitted: false }

const K3_PDF = Object.freeze({
  sourceId: 'src.k3-437.pdf-006',
  recordUrl: EXTERNAL_SOURCE_URLS.jsgRecord,
  eLibraryRecordUrl: EXTERNAL_SOURCE_URLS.jsgELibraryRecord,
  url: EXTERNAL_SOURCE_URLS.jsgPdf,
  institution: '한국학중앙연구원 장서각',
  itemId: 'K3-437',
  microfilmId: 'MF35-143~4',
  pageCount: 134,
  byteLength: 14116437,
  byteSha256: '335a1c03c7af246969e00667d6a4d9756b19c19d93539223bb871c47001a24cd',
  inspectedRenderedPages: [71, 72],
  renderedPageImages: {
    71: { byteSha256: '8a6d2876a333c26881a3b3407bf190099eb2abb58c7f90fab870e19973ce1d88', renderDpi: 140 },
    72: { byteSha256: '05c8db420995ff0845a80d21406aa40e146d58e0c0bf6b4ade229f93795365e8', renderDpi: 140 },
  },
})

const NLC_PDF = Object.freeze({
  sourceId: 'src.nlc-06857-114503-derivative.pdf',
  recordUrl: EXTERNAL_SOURCE_URLS.nlcRecord,
  readerUrl: EXTERNAL_SOURCE_URLS.nlcReader,
  derivativePageUrl: EXTERNAL_SOURCE_URLS.nlcDerivativePage,
  url: EXTERNAL_SOURCE_URLS.nlcDerivativePdf,
  institution: '中国国家图书馆',
  rareBookId: '06857',
  identifier: '411999013122',
  volumeObjectId: '114503.0',
  volumeLabel: '第4冊',
  pageCount: 114,
  byteLength: 38628523,
  byteSha256: '6519fbdc0fa25272bf6aae0fdac8c73107c0f6b852a1b0beebc655344ec2812d',
  originalNlcBitstreamDownloaded: false,
  inspectedRenderedPages: [105, 106],
  renderedPageImages: {
    105: { byteSha256: '09155dbc6440c33b1350017fc6460fef6559582abb84281aba366ac63f641cfc', renderDpi: 140, printedFolio: '一' },
    106: { byteSha256: 'd99345ce146957488b1d1ddde973cdcc7ba713c200803aee0dab2e793f34399f', renderDpi: 140, printedFolio: '二' },
  },
})

export const EXTERNAL_EVIDENCE = Object.freeze([
  {
    evidenceId: 'ev.packet.v4-file-identity',
    unit: 'E',
    sourceCategory: 'UNRESOLVED',
    status: 'parent_verified_byte_identity_only',
    packetFiles: CANDIDATE_PACKET_FILES.map(file => ({ ...file })),
    scopeBoundary: candidateBoundary,
    ...noCanonicalText,
  },
  {
    evidenceId: 'ev.A.k3-official-record',
    unit: 'B',
    sourceCategory: 'INSTITUTIONAL_METADATA',
    status: 'parent_verified_first_party_record',
    url: EXTERNAL_SOURCE_URLS.jsgRecord,
    eLibraryRecordUrl: EXTERNAL_SOURCE_URLS.jsgELibraryRecord,
    itemId: 'K3-437',
    observedFields: {
      title: '五行精紀',
      editionType: '木版',
      publicationDate: '[刊年未詳]',
      physicalDescription: '線裝34卷6冊',
      layout: '四周雙邊, 半郭 21.5×14.8cm, 有界, 半葉10行20字, 註雙行, 內向三葉花紋魚尾',
      size: '28.3×19.3cm',
      microfilmId: 'MF35-143~4',
    },
    scopeCorrection: 'The official record supports item identity, woodblock classification, undated publication field, volume structure, and catalogued layout. It does not date the current copy or prove an edition lineage.',
    ...noCanonicalText,
  },
  {
    evidenceId: 'ev.A.k3-official-scan',
    unit: 'A',
    sourceCategory: 'DIRECT_OFFICIAL_SCAN',
    status: 'parent_verified_pdf_bytes_and_visual_pages',
    pdf: { ...K3_PDF },
    scopeBoundary: 'The official-hosted K3-437_006.pdf bytes and rendered pp.71–72 were directly inspected. Printed folio was not established from the scan; PDF page numbers are retained as the locator.',
    ...noCanonicalText,
  },
  {
    evidenceId: 'ev.A.nlc-official-record',
    unit: 'B',
    sourceCategory: 'INSTITUTIONAL_METADATA',
    status: 'parent_verified_first_party_record',
    url: EXTERNAL_SOURCE_URLS.nlcRecord,
    readerUrl: EXTERNAL_SOURCE_URLS.nlcReader,
    observedFields: {
      title: '五行精紀',
      authorField: '(宋)廖中撰',
      publicationField: '清[1644-1911]',
      versionField: '抄本',
      physicalDescription: '10行24字，黑口，左右雙邊',
      holdings: '存33卷：1～33',
      rareBookId: '06857',
      identifier: '411999013122',
      volumeMap: ['114408.0=第1卷', '114407.0=第2卷', '114453.0=第3卷', '114503.0=第4卷'],
    },
    scopeCorrection: 'The official record proves the record/volume mapping and catalogued copy description. The Qing date range is a catalog field, not an exact copy date or a proof of textual lineage.',
    ...noCanonicalText,
  },
  {
    evidenceId: 'ev.A.nlc-reader-object',
    unit: 'B',
    sourceCategory: 'INSTITUTIONAL_METADATA',
    status: 'parent_verified_reader_route',
    url: EXTERNAL_SOURCE_URLS.nlcReader,
    observedFields: {
      aid: '892',
      bid: '114503.0',
      indexName: 'data_892',
      identifier: '411999013122',
      pressName: '海虞瞿氏恬裕齋',
      officialReaderPdfPathPresent: true,
    },
    scopeCorrection: 'Reader-route fields identify the NLC digital object and imprint/press field. The original NLC PDF bitstream was not independently retrieved in this pass.',
    ...noCanonicalText,
  },
  {
    evidenceId: 'ev.A.nlc-derivative-scan',
    unit: 'A',
    sourceCategory: 'DIRECT_DERIVATIVE_SCAN',
    status: 'parent_verified_derivative_bytes_and_visual_pages',
    pdf: { ...NLC_PDF },
    scopeBoundary: 'The public derivative is a distinct, byte-identified digital object attributed to NLC 114503.0. It is not treated as official-byte equality or as a second physical witness.',
    ...noCanonicalText,
  },
  {
    evidenceId: 'ev.B.k3-preface-provenance-boundary',
    unit: 'B',
    sourceCategory: 'INSTITUTIONAL_METADATA',
    status: 'parent_verified_catalogue_description_only',
    url: EXTERNAL_SOURCE_URLS.jsgRecord,
    observedFields: {
      prefatoryMatter: ['周必大序, 1196', '岳珂序, 1228', '廖中自序/總目錄 (catalogued)'],
      provenanceMarks: ['密城世家', '朴吉璟', '李王家圖書之章'],
    },
    scopeCorrection: 'These are first-party catalog/解題 fields. No physical colophon, postscript, copy date, or complete ownership chain was directly located in the target-page inspection; the dates of the prefaces do not date K3-437.',
    ...noCanonicalText,
  },
  {
    evidenceId: 'ev.B.nlc-provenance-lineage-boundary',
    unit: 'B',
    sourceCategory: 'INSTITUTIONAL_METADATA',
    status: 'parent_verified_catalogue_and_reader_fields_only',
    url: EXTERNAL_SOURCE_URLS.nlcRecord,
    observedFields: ['清[1644-1911]', '抄本', '海虞瞿氏恬裕齋', '存33卷'],
    scopeCorrection: 'The fields support a catalogued manuscript-copy candidate and provenance/imprint lead. They do not establish exact date, colophon, copying relation to K3-437, or independent textual lineage.',
    ...noCanonicalText,
  },
  {
    evidenceId: 'ev.D.kyujanggak-negative-control',
    unit: 'D',
    sourceCategory: 'INSTITUTIONAL_METADATA',
    status: 'parent_verified_incomplete_holding',
    url: EXTERNAL_SOURCE_URLS.kyujanggakRecord,
    itemId: '奎中1822-v.1-5',
    observedFields: ['木板本', '28卷5冊(零本)', '卷29-34(1冊)缺', '[刊年未詳]'],
    scopeCorrection: 'The official record is a bounded negative control: this item cannot supply an actual 卷33 target page. It is not counted as a third witness.',
    ...noCanonicalText,
  },
  {
    evidenceId: 'ev.D.wonkwang-bounded-search',
    unit: 'D',
    sourceCategory: 'INSTITUTIONAL_METADATA',
    status: 'bounded_no_item_record',
    officialSearchBoundary: EXTERNAL_SOURCE_URLS.wonkwangSearchBoundary,
    secondaryLead: EXTERNAL_SOURCE_URLS.wonkwangSecondaryLead,
    observedFields: ['An AKS secondary institutional entry reports a Wonkwang holding and 34-volume/6-book metal-type or woodblock description.'],
    missingFields: ['Wonkwang item/catalog ID', 'first-party edition/date record', '卷33 inclusion record', 'actual scan/reproduction'],
    scopeCorrection: 'The report remains a candidate/metadata lead only. No direct Wonkwang record supports 乙亥字本(1455); the exact date is rejected as unverified.',
    ...noCanonicalText,
  },
  {
    evidenceId: 'ev.D.sonkeikaku-access-block',
    unit: 'D',
    sourceCategory: 'UNRESOLVED',
    status: 'first_party_service_temporarily_unavailable',
    url: EXTERNAL_SOURCE_URLS.sonkeikakuAccessBoundary,
    observedFields: ['尊經閣 catalog/search service outage reported for 2026-08-15 through 2026-08-18 10:00 KST', 'contact east@skku.edu'],
    missingFields: ['item/catalog ID', 'edition/date', '卷33 holding', 'actual reproduction'],
    nextAccessRoute: 'Reopen the official service after 2026-08-18 10:00 KST; search 五行精紀/五行精紀卷33, then request official reproduction or contact east@skku.edu.',
    scopeCorrection: 'The service outage proves an access blocker, not that the candidate item does or does not exist. No inaccessible witness is used for corroboration.',
    ...noCanonicalText,
  },
  {
    evidenceId: 'ev.E.typed-readiness-baseline',
    unit: 'E',
    sourceCategory: 'INFERENCE',
    status: 'parent_verified_baseline_reference',
    artifactPath: 'artifacts/saju-five-classics-typed-readiness-contract-v0/complete.json',
    scopeCorrection: 'The typed-readiness artifact is a baseline contract and graph, not an oracle. v4 adds bounded evidence without altering implementation or activation.',
    ...noCanonicalText,
  },
])

const page = ({ observationId, evidenceId, unit, sourceCategory, pdfUrl, pdfPage, printedFolio = null, imageSha256, heading, visibleFragments, exactObservedFragments, unreadable = false, directObservation }) => ({
  observationId,
  evidenceId,
  unit,
  sourceCategory,
  locator: { pdfUrl, pdfPage, printedFolio },
  renderedImageSha256: imageSha256,
  heading,
  visibleFragments,
  exactObservedFragments,
  unreadable,
  observationMode: 'direct_visual_review_of_rendered_page',
  directObservation,
  ...noCanonicalText,
  scopeBoundary,
})

export const PAGE_OBSERVATIONS = Object.freeze([
  page({
    observationId: 'obs.A.k3-p71-heading',
    evidenceId: 'ev.A.k3-official-scan',
    unit: 'A',
    sourceCategory: 'DIRECT_OFFICIAL_SCAN',
    pdfUrl: EXTERNAL_SOURCE_URLS.jsgPdf,
    pdfPage: 71,
    imageSha256: K3_PDF.renderedPageImages[71].byteSha256,
    heading: '五行精紀卷第三十三 / 論大運',
    visibleFragments: ['五行精紀卷第三十三', '論大運'],
    exactObservedFragments: ['五行精紀卷第三十三', '論大運'],
    directObservation: 'The official K3-437 scan visibly shows the 卷33 heading and 論大運 section on rendered PDF page 71.',
  }),
  page({
    observationId: 'obs.A.k3-p72-worked-example',
    evidenceId: 'ev.A.k3-official-scan',
    unit: 'A',
    sourceCategory: 'DIRECT_OFFICIAL_SCAN',
    pdfUrl: EXTERNAL_SOURCE_URLS.jsgPdf,
    pdfPage: 72,
    imageSha256: K3_PDF.renderedPageImages[72].byteSha256,
    heading: '甲子陽男 worked example and 約法 critique',
    visibleFragments: ['譬如甲子陽男', '二十九日申時立春', '六十三時', '六百三十日', '一歲奇九月', '今人行運多用約法'],
    exactObservedFragments: ['譬如甲子陽男', '是月二十九日申時立春', '至二十九日申時止', '乃是一歲奇九月之大運', '今人行運多用約法'],
    directObservation: 'The target worked-example and the following approximation critique are directly legible on rendered PDF page 72. The scan does not provide a printed-folio number that was confidently established in this pass.',
  }),
  page({
    observationId: 'obs.A.nlc-p105-formula',
    evidenceId: 'ev.A.nlc-derivative-scan',
    unit: 'A',
    sourceCategory: 'DIRECT_DERIVATIVE_SCAN',
    pdfUrl: EXTERNAL_SOURCE_URLS.nlcDerivativePdf,
    pdfPage: 105,
    printedFolio: '一',
    imageSha256: NLC_PDF.renderedPageImages[105].byteSha256,
    heading: '五行精紀卷第三十三 / 大運',
    visibleFragments: ['五行精紀卷第三十三', '大運', '一日十二時得一百二十日為四箇月之數', '一時辰得十日之數'],
    exactObservedFragments: ['一日十二時得一百二十日為四箇月之數', '一時辰得十日之數'],
    directObservation: 'The public derivative page 105 visibly contains the 卷33 / 大運 heading and the target conversion formula. The printed folio mark 一 is retained as a locator.',
  }),
  page({
    observationId: 'obs.A.nlc-p106-worked-example',
    evidenceId: 'ev.A.nlc-derivative-scan',
    unit: 'A',
    sourceCategory: 'DIRECT_DERIVATIVE_SCAN',
    pdfUrl: EXTERNAL_SOURCE_URLS.nlcDerivativePdf,
    pdfPage: 106,
    printedFolio: '二',
    imageSha256: NLC_PDF.renderedPageImages[106].byteSha256,
    heading: '甲子陽男 worked example and 約法 critique',
    visibleFragments: ['譬如甲子陽男', '是月二十九日立春', '至二十九日申時止', '六十三時', '六百三十日', '一歲奇九月', '今人行運多用約法'],
    exactObservedFragments: ['譬如甲子陽男', '是月二十九日立春', '至二十九日申時止', '乃是一歲奇九月之大運', '今人行運多用約法', '殊不明折除實歷之數也'],
    directObservation: 'The public derivative page 106 visibly omits 申時 in the first 立春 clause but retains it in the later stopping clause. It also visibly continues with the full 約法 critique, not the shortened candidate wording. The printed folio mark 二 is retained as a locator.',
  }),
])

const k3WorkedExample = '譬如甲子陽男十二月二十四日巳時生是月二十九日申時立春陽男數未來之日自二十四日巳時至二十五日巳時方曰一日之實數至二十九日申時止得五日三時之節氣實歷過六十三時折除計六百三十日乃是一歲奇九月之大運起於丁丑是越三歲九月之內方是甲子十二月生行一歲奇九月之大運也'
const nlcWorkedExample = '譬如甲子陽男十二月二十四日巳時生是月二十九日立春陽男數未來之日自二十四日巳時至二十五日巳時方曰一日之實數至二十九日申時止得五日三時之節氣實歷過六十三時折除計六百三十日乃是一歲奇九月之大運起於丁丑是越三歲九月之內方是甲子十二月生行一歲奇九月之大運也'
const fullApproximation = '今人行運多用約法以一歲奇八月起運便以二歲九月過矣殊不明折除實歷之數也'

const baseVariant = ({ variantId, locus, k3Reading, nlcReading, k3Page, nlcPage, surroundingK3, surroundingNlc, actualDifference, status, candidateNlcReading, candidateVerdict, candidateCorrection }) => ({
  variantId,
  locus,
  status,
  unreadable: false,
  locators: {
    k3: { pdf: 'K3-437_006.pdf', pdfPage: k3Page, printedFolio: null, observationId: k3Page === 72 ? 'obs.A.k3-p72-worked-example' : 'obs.A.k3-p71-heading' },
    nlc: { pdf: 'NLC 114503.0 derivative', pdfPage: nlcPage, printedFolio: nlcPage === 105 ? '一' : '二', observationId: nlcPage === 105 ? 'obs.A.nlc-p105-formula' : 'obs.A.nlc-p106-worked-example' },
  },
  directReading: { k3: k3Reading, nlc: nlcReading },
  surroundingText: { k3: surroundingK3, nlc: surroundingNlc },
  actualDifference,
  candidateAssessment: {
    candidateNlcReading,
    verdict: candidateVerdict,
    correction: candidateCorrection,
  },
  excludedAsVariant: ['modern punctuation', 'OCR segmentation', 'Unicode/orthographic normalization without a glyph difference'],
  scopeBoundary,
})

export const VARIANT_ADJUDICATION = Object.freeze([
  baseVariant({
    variantId: 'VAR-01',
    locus: 'first 立春 clause / 申時 presence',
    k3Reading: '是月二十九日申時立春',
    nlcReading: '是月二十九日立春',
    k3Page: 72,
    nlcPage: 106,
    surroundingK3: k3WorkedExample.slice(0, 46),
    surroundingNlc: nlcWorkedExample.slice(0, 43),
    actualDifference: 'K3-437 has 申時 in the first clause; NLC 114503.0 derivative omits it. NLC later retains 至二十九日申時止.',
    status: 'verified',
    candidateNlcReading: '是月二十九日立春',
    candidateVerdict: 'verified',
    candidateCorrection: 'The candidate correctly exposed a real lead-in difference, but its inference that the omission confirms an underlying source reading is not promoted to lineage evidence.',
  }),
  baseVariant({
    variantId: 'VAR-02',
    locus: 'worked-example opening word',
    k3Reading: '譬如甲子陽男',
    nlcReading: '譬如甲子陽男',
    k3Page: 72,
    nlcPage: 106,
    surroundingK3: k3WorkedExample.slice(0, 10),
    surroundingNlc: nlcWorkedExample.slice(0, 10),
    actualDifference: 'No difference was directly observed between the two target pages. 假令 is not present in the inspected NLC target page.',
    status: 'corrected',
    candidateNlcReading: '譬如甲子陽男 (일부 傳本: 假令甲子陽男)',
    candidateVerdict: 'rejected',
    candidateCorrection: 'The alternate 假令 reading is an unsupported candidate-side addition in this two-page crosswalk; no third witness was supplied for it.',
  }),
  baseVariant({
    variantId: 'VAR-03',
    locus: 'worked-example remainder expression',
    k3Reading: '乃是一歲奇九月之大運',
    nlcReading: '乃是一歲奇九月之大運',
    k3Page: 72,
    nlcPage: 106,
    surroundingK3: '折除計六百三十日乃是一歲奇九月之大運起於丁丑',
    surroundingNlc: '折除計六百三十日乃是一歲奇九月之大運起於丁丑',
    actualDifference: 'The direct target pages both show 奇九月. The candidate alternative 一歲九個月 was not observed.',
    status: 'corrected',
    candidateNlcReading: '乃是一歲九個月之大運 / 一歲奇九月',
    candidateVerdict: 'rejected',
    candidateCorrection: 'Retain only the directly observed 一歲奇九月 for this crosswalk; do not import the 九個月 alternative.',
  }),
  baseVariant({
    variantId: 'VAR-04',
    locus: 'month classifier orthography',
    k3Reading: '為四箇月之數',
    nlcReading: '為四箇月之數',
    k3Page: 72,
    nlcPage: 105,
    surroundingK3: '一日十二時得一百二十日為四箇月之數一時辰得十日之數',
    surroundingNlc: '一日十二時得一百二十日為四箇月之數一時辰得十日之數',
    actualDifference: 'Both directly observed glyph sequences use 箇. No 四個月 glyph was observed.',
    status: 'corrected',
    candidateNlcReading: '為四個月之數 / 四箇月',
    candidateVerdict: 'rejected',
    candidateCorrection: 'The NLC reading is corrected to the directly visible traditional 箇; a modernized 个/個 form is not a textual variant admitted from these scans.',
  }),
  baseVariant({
    variantId: 'VAR-05',
    locus: 'hour-to-day conversion predicate',
    k3Reading: '一時辰得十日之數',
    nlcReading: '一時辰得十日之數',
    k3Page: 72,
    nlcPage: 105,
    surroundingK3: '為四箇月之數一時辰得十日之數',
    surroundingNlc: '為四箇月之數一時辰得十日之數',
    actualDifference: 'Both directly observed sequences use 得. 為十日 was not observed in the NLC target page.',
    status: 'corrected',
    candidateNlcReading: '一時辰為十日 / 得十日之數',
    candidateVerdict: 'rejected',
    candidateCorrection: 'Retain 得十日之數 only for this two-witness crosswalk; the candidate 為十日 alternative is not parent-verified.',
  }),
  baseVariant({
    variantId: 'VAR-06',
    locus: 'full 約法 critique',
    k3Reading: fullApproximation,
    nlcReading: fullApproximation,
    k3Page: 72,
    nlcPage: 106,
    surroundingK3: '方是甲子十二月生行一歲奇九月之大運也今人行運多用約法以一歲奇八月起運便以二歲九月過矣殊不明折除實歷之數也',
    surroundingNlc: '方是甲子十二月生行一歲奇九月之大運也今人行運多用約法以一歲奇八月起運便以二歲九月過矣殊不明折除實歷之數也',
    actualDifference: 'No shortening was directly observed: both target pages contain the expanded critique, including 便以二歲九月過矣 and 殊不明折除實歷之數也.',
    status: 'corrected',
    candidateNlcReading: '今人多用約法以一歲八箇月起運不知折除實歷之細也',
    candidateVerdict: 'rejected',
    candidateCorrection: 'The candidate NLC condensed wording is rejected for 114503.0 target pages; do not treat the alleged compression as an actual K3↔NLC variant.',
  }),
])

export const CROSSWALK = Object.freeze([
  { scopeId: '卷33-heading', k3PdfPages: [71], nlcPdfPages: [105], k3PrintedFolio: null, nlcPrintedFolios: ['一'], relation: 'same 卷33 section; title display differs as 論大運 versus 大運', directObservationIds: ['obs.A.k3-p71-heading', 'obs.A.nlc-p105-formula'] },
  { scopeId: 'conversion-formula', k3PdfPages: [72], nlcPdfPages: [105], k3PrintedFolio: null, nlcPrintedFolios: ['一'], relation: 'same bounded conversion formula; direct readings agree at 四箇月 and 得十日之數', directObservationIds: ['obs.A.k3-p72-worked-example', 'obs.A.nlc-p105-formula'] },
  { scopeId: '甲子陽男-worked-example', k3PdfPages: [72], nlcPdfPages: [106], k3PrintedFolio: null, nlcPrintedFolios: ['二'], relation: 'same ordered worked-example calculation with one verified first-clause omission; not an independent-lineage finding', directObservationIds: ['obs.A.k3-p72-worked-example', 'obs.A.nlc-p106-worked-example'] },
  { scopeId: '約法-critique', k3PdfPages: [72], nlcPdfPages: [106], k3PrintedFolio: null, nlcPrintedFolios: ['二'], relation: 'same expanded critique directly observed in both; candidate shortening rejected', directObservationIds: ['obs.A.k3-p72-worked-example', 'obs.A.nlc-p106-worked-example'] },
])

export const WITNESS_IDENTITY_AUDIT = Object.freeze({
  K3_437: {
    witnessId: 'WIT-A1',
    physicalItem: {
      state: 'satisfied',
      institution: '한국학중앙연구원 장서각',
      itemId: 'K3-437',
      microfilmId: 'MF35-143~4',
      officialRecordRefs: ['ev.A.k3-official-record'],
      relationToNlc: 'distinct institutionally identified holding; this alone does not establish independent textual lineage',
    },
    digitalObject: {
      state: 'satisfied',
      objectId: 'K3-437_006.pdf',
      derivation: 'official-hosted PDF from Jangseogak record',
      byteLength: K3_PDF.byteLength,
      byteSha256: K3_PDF.byteSha256,
      refs: ['ev.A.k3-official-scan'],
    },
    editionCopyMetadata: {
      state: 'partially_supported',
      editionType: '木版',
      publicationDate: '[刊年未詳]',
      volumes: '34권6책 완본',
      authorCatalogueField: '(明)廖中著',
      copyDate: 'unresolved',
      refs: ['ev.A.k3-official-record'],
    },
    layout: {
      state: 'satisfied_as_catalogue_field',
      description: '四周雙邊, 有界, 半葉10行20字, 註雙行, 內向三葉花紋魚尾',
      candidateCorrection: 'Gemini v4 stated 四周單邊; the first-party record observed by parent states 四周雙邊. The candidate field is corrected, not imported.',
      refs: ['ev.A.k3-official-record'],
    },
    prefatoryPostscriptColophon: {
      state: 'unresolved_for_current_copy',
      catalogueDescription: ['周必大序 1196', '岳珂序 1228', '廖中自序/總目錄'],
      physicalColophonDirectlyObserved: false,
      postscriptDirectlyObserved: false,
      refs: ['ev.B.k3-preface-provenance-boundary'],
    },
    provenance: {
      state: 'partially_supported',
      observedMarks: ['密城世家', '朴吉璟', '李王家圖書之章'],
      completeOwnershipChain: 'unresolved',
      refs: ['ev.B.k3-preface-provenance-boundary'],
    },
    printingOrTranscriptionTime: {
      state: 'unresolved',
      recordField: '[刊年未詳]',
      warning: 'Preface dates and author dates are not current-copy dates.',
      refs: ['ev.A.k3-official-record', 'ev.B.k3-preface-provenance-boundary'],
    },
  },
  NLC_06857: {
    witnessId: 'WIT-A2',
    physicalItem: {
      state: 'satisfied_as_institutional_record',
      institution: '中国国家图书馆',
      rareBookId: '06857',
      identifier: '411999013122',
      volumeObjectId: '114503.0',
      officialRecordRefs: ['ev.A.nlc-official-record', 'ev.A.nlc-reader-object'],
      relationToK3: 'distinct institutionally identified holding; this alone does not establish independent textual lineage',
    },
    digitalObject: {
      state: 'satisfied_for_distinct_derivative_object',
      officialReaderObject: 'aid=892, bid=114503.0',
      publicDerivative: 'Wikimedia Commons derivative attributed to NLC object',
      byteLength: NLC_PDF.byteLength,
      byteSha256: NLC_PDF.byteSha256,
      originalNlcBitstreamDownloaded: false,
      refs: ['ev.A.nlc-reader-object', 'ev.A.nlc-derivative-scan'],
    },
    editionCopyMetadata: {
      state: 'partially_supported',
      editionType: '抄本 (official record field)',
      publicationDate: '清[1644-1911] (catalogue range only)',
      volumes: '存33卷：1～33',
      authorCatalogueField: '(宋)廖中撰',
      copyDate: 'unresolved',
      refs: ['ev.A.nlc-official-record', 'ev.B.nlc-provenance-lineage-boundary'],
    },
    layout: {
      state: 'satisfied_as_catalogue_field',
      description: '10行24字, 黑口, 左右雙邊',
      refs: ['ev.A.nlc-official-record'],
    },
    prefatoryPostscriptColophon: {
      state: 'unresolved_for_current_copy',
      directlyObservedInTargetPages: false,
      colophonLocated: false,
      postscriptLocated: false,
      refs: ['ev.B.nlc-provenance-lineage-boundary'],
    },
    provenance: {
      state: 'partially_supported',
      recordOrReaderFields: ['海虞瞿氏恬裕齋', '清[1644-1911]'],
      completeOwnershipChain: 'unresolved',
      refs: ['ev.A.nlc-reader-object', 'ev.B.nlc-provenance-lineage-boundary'],
    },
    printingOrTranscriptionTime: {
      state: 'unresolved',
      recordField: '清[1644-1911]',
      warning: 'The field is a broad catalog window; it does not establish an exact copy date or relation to K3-437.',
      refs: ['ev.A.nlc-official-record', 'ev.B.nlc-provenance-lineage-boundary'],
    },
  },
})

const axis = (state, evidenceRefs, missingEdges, note) => ({
  state,
  countedAsIndependent: false,
  evidenceRefs,
  missingEdges,
  note,
})

export const INDEPENDENCE_ADJUDICATION = Object.freeze({
  before: {
    source: 'saju-gemini-witness-dossier-adjudication-v3',
    'physical-item': 'satisfied',
    'digital-derivation': 'satisfied',
    'edition/textual-lineage': 'unresolved',
    'semantic-corroboration': 'unresolved',
    overall: 'unresolved',
  },
  after: {
    'physical-item': axis('satisfied', ['ev.A.k3-official-record', 'ev.A.nlc-official-record'], [], 'K3-437 and NLC 06857/114503.0 are distinct institutionally identified holdings. This is not a textual-lineage assertion.'),
    'digital-derivation': axis('satisfied', ['ev.A.k3-official-scan', 'ev.A.nlc-derivative-scan', 'ev.A.nlc-reader-object'], ['official NLC source-bitstream equality'], 'The K3 official PDF and NLC-attributed public derivative are distinct digital objects; the derivative is not treated as an independent physical witness.'),
    'edition/textual-lineage': axis('unresolved', ['ev.A.k3-official-record', 'ev.A.nlc-official-record', 'ev.B.k3-preface-provenance-boundary', 'ev.B.nlc-provenance-lineage-boundary'], ['copy/edition relation', 'colophon or dated transmission edge', 'recension/lineage comparison'], 'Different catalogued formats and a real wording difference narrow the relation but do not close it.'),
    'semantic-corroboration': axis('unresolved', ['ev.A.k3-official-scan', 'ev.A.nlc-derivative-scan'], ['independent textual lineage', 'independent semantic authority'], 'The same bounded worked example is directly observed, but agreement across two actual witnesses is not independent semantic corroboration until the lineage edge is established.'),
    overall: 'unresolved',
    scopeLimitedCorrespondence: {
      state: 'satisfied',
      scope: '五行精紀 卷33 論大運 / 甲子陽男 worked-example ordered calculation and expanded 約法 critique',
      evidenceRefs: ['obs.A.k3-p72-worked-example', 'obs.A.nlc-p106-worked-example'],
      boundary: 'This is bounded semantic/textual correspondence only. It does not satisfy the semantic-corroboration independence axis and cannot promote implementation authority.',
    },
  },
})

const defaultGates = () => Object.fromEntries(GATE_KEYS.map(key => [key, 'unresolved']))

// Kept as a plain helper rather than relying on object mutation so every claim
// carries the same fail-closed independence shape.
const makeAxes = overrides => Object.fromEntries(INDEPENDENCE_AXES.map(key => [key, overrides?.[key] || axis('unresolved', [], [`${key} evidence`], 'No independence promotion.')] ))
const makeClaim = ({ claimId, unit, status, candidateAssertion, evidenceRefs, gates = {}, axes = {}, blockers = [], scopeCorrection, promotionTarget = 'none' }) => ({
  claimId,
  unit,
  status,
  candidateAssertion,
  candidateEvidenceAccepted: false,
  parentVerifiedEvidenceRefs: [...evidenceRefs],
  gates: { ...defaultGates(), ...gates },
  independence: makeAxes(axes),
  blockerAssessment: {
    falseBlockers: [
      { blockerId: 'false.v4-candidate-conclusion-as-proof', edge: 'all-gates', reason: 'Gemini v4 is untrusted candidate input; candidate transcription, metadata, and conclusions are not parent verification.' },
      { blockerId: 'false.digital-object-equals-physical-witness', edge: 'I.digital-derivation', reason: 'A different digital file does not create another physical item.' },
      { blockerId: 'false.same-passage-equals-independent-lineage', edge: 'I.edition/textual-lineage', reason: 'Textual similarity or a textual variant does not establish independent edition or transmission lineage.' },
    ],
    realBlockers: [...blockers],
  },
  scopeCorrection,
  promotion: {
    target: promotionTarget,
    status: 'blocked',
    ready: false,
    reason: 'Bounded parent-verified evidence is additive only; no semantic authority, interpretation readiness, implementation grounding, or production activation is granted.',
  },
})

const LINEAGE_BLOCKER = { blockerId: 'blocker.A.edition-textual-lineage', edge: 'L/I/P', reason: 'K3-437 and NLC 06857 have actual item/digital identities, but no dated copy/edition/transmission relation or colophon closes textual lineage.' }
const THIRD_WITNESS_BLOCKER = { blockerId: 'blocker.D.third-witness-target-page', edge: 'H/E/L/S/I/P', reason: 'Wonkwang has no parent-verified first-party item record or 卷33 page; Sonkeikaku access is temporarily blocked and no item/page was verified.' }

function normalizedBaseline(baseline = null) {
  const fallback = {
    schemaVersion: 'saju-five-classics-typed-readiness-contract-v0',
    version: '0.1.0',
    contentSha256: null,
    activeClaimCount: 13,
    gateStateCounts: {
      H: { conflicted: 0, satisfied: 13, unresolved: 0 },
      E: { conflicted: 0, satisfied: 12, unresolved: 1 },
      L: { conflicted: 0, satisfied: 1, unresolved: 12 },
      S: { conflicted: 1, satisfied: 11, unresolved: 1 },
      I: { conflicted: 0, satisfied: 0, unresolved: 13 },
      P: { conflicted: 1, satisfied: 0, unresolved: 12 },
    },
    readiness: {
      availableForInterpretation: false,
      productionActivation: 'blocked',
      promotionReadyClaimIds: [],
      semanticAuthority: 'not_established',
      stableClaimPromotionCount: 0,
    },
    dayunClaims: [],
  }
  return {
    ...fallback,
    ...(baseline || {}),
    readiness: { ...fallback.readiness, ...(baseline?.readiness || {}) },
    gateStateCounts: baseline?.gateStateCounts || fallback.gateStateCounts,
    dayunClaims: baseline?.dayunClaims || [],
  }
}

export function buildSajuLunaDeepCollationAdjudicationV4({ basisHead, predecessorReferences = {}, typedReadinessBaseline = null } = {}) {
  const baseline = normalizedBaseline(typedReadinessBaseline)
  const claims = [
    makeClaim({
      claimId: 'claim.A.k3-nlc-variant-crosswalk',
      unit: 'A',
      status: 'partially_supported',
      candidateAssertion: 'The Gemini v4 variant map is parent-verified as a bounded K3-437↔NLC 114503.0 crosswalk only.',
      evidenceRefs: ['ev.A.k3-official-scan', 'ev.A.nlc-derivative-scan', 'obs.A.k3-p72-worked-example', 'obs.A.nlc-p105-formula', 'obs.A.nlc-p106-worked-example'],
      gates: { H: 'satisfied', E: 'satisfied', L: 'unresolved', S: 'satisfied', I: 'unresolved', P: 'unresolved' },
      axes: {
        'physical-item': axis('satisfied', ['ev.A.k3-official-record', 'ev.A.nlc-official-record'], [], 'Two item identities are observed, not counted as independent textual witnesses.'),
        'digital-derivation': axis('satisfied', ['ev.A.k3-official-scan', 'ev.A.nlc-derivative-scan'], ['official NLC source-bitstream equality'], 'Distinct digital objects are observed; digital distinction is not physical independence.'),
        'edition/textual-lineage': axis('unresolved', ['ev.A.k3-official-record', 'ev.A.nlc-official-record'], ['dated transmission/edition relation'], 'Unresolved.'),
        'semantic-corroboration': axis('unresolved', ['obs.A.k3-p72-worked-example', 'obs.A.nlc-p106-worked-example'], ['independent textual lineage'], 'Bounded correspondence is recorded separately.'),
      },
      blockers: [LINEAGE_BLOCKER],
      scopeCorrection: 'VAR-01 is a verified actual difference. VAR-02–VAR-06 correct or reject candidate-side alternatives after direct reading; no normalization or OCR reading is promoted.',
      promotionTarget: 'historical_observation_stability',
    }),
    makeClaim({
      claimId: 'claim.B.k3-437-identity-and-copy-boundary',
      unit: 'B',
      status: 'supported',
      candidateAssertion: 'K3-437 is an institutionally identified 34-volume/6-book woodblock item with an undated publication field and direct target scan.',
      evidenceRefs: ['ev.A.k3-official-record', 'ev.A.k3-official-scan', 'ev.B.k3-preface-provenance-boundary'],
      gates: { H: 'satisfied', E: 'satisfied', L: 'unresolved', S: 'not_applicable', I: 'unresolved', P: 'unresolved' },
      axes: {
        'physical-item': axis('satisfied', ['ev.A.k3-official-record'], [], 'Official item identity.'),
        'digital-derivation': axis('satisfied', ['ev.A.k3-official-scan'], [], 'Official-hosted PDF identity.'),
      },
      blockers: [LINEAGE_BLOCKER],
      scopeCorrection: '四周雙邊 is the parent-verified first-party layout field; the v4 四周單邊 candidate field is corrected. Preface dates, seals, and author labels do not date the current copy.',
      promotionTarget: 'historical_observation_stability',
    }),
    makeClaim({
      claimId: 'claim.B.nlc-06857-identity-and-derivative-boundary',
      unit: 'B',
      status: 'partially_supported',
      candidateAssertion: 'NLC 06857 / fid 411999013122 / volume object 114503.0 is an institutionally identified manuscript-copy record with a parent-verified public derivative target scan.',
      evidenceRefs: ['ev.A.nlc-official-record', 'ev.A.nlc-reader-object', 'ev.A.nlc-derivative-scan', 'ev.B.nlc-provenance-lineage-boundary'],
      gates: { H: 'satisfied', E: 'satisfied', L: 'unresolved', S: 'not_applicable', I: 'unresolved', P: 'unresolved' },
      axes: {
        'physical-item': axis('satisfied', ['ev.A.nlc-official-record'], [], 'Official record identity.'),
        'digital-derivation': axis('satisfied', ['ev.A.nlc-reader-object', 'ev.A.nlc-derivative-scan'], ['original NLC bitstream equality'], 'Reader object and public derivative are tracked separately.'),
      },
      blockers: [LINEAGE_BLOCKER],
      scopeCorrection: 'The NLC catalog range 清[1644-1911] and 海虞瞿氏恬裕齋 field remain catalogue/reader metadata; no exact copy date or lineage is asserted.',
      promotionTarget: 'historical_observation_stability',
    }),
    makeClaim({
      claimId: 'claim.C.edition-textual-lineage-remains-unresolved',
      unit: 'C',
      status: 'unresolved',
      candidateAssertion: 'K3-437 and NLC 06857 can be assigned independent edition/textual lineages from their item metadata and observed variants.',
      evidenceRefs: ['ev.A.k3-official-record', 'ev.A.nlc-official-record', 'ev.B.k3-preface-provenance-boundary', 'ev.B.nlc-provenance-lineage-boundary', 'claim.A.k3-nlc-variant-crosswalk'],
      gates: { H: 'satisfied', E: 'satisfied', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
      axes: {
        'physical-item': axis('satisfied', ['ev.A.k3-official-record', 'ev.A.nlc-official-record'], [], 'Distinct holdings.'),
        'digital-derivation': axis('satisfied', ['ev.A.k3-official-scan', 'ev.A.nlc-derivative-scan'], ['official source-bitstream equality'], 'Distinct digital paths.'),
        'edition/textual-lineage': axis('unresolved', ['ev.B.k3-preface-provenance-boundary', 'ev.B.nlc-provenance-lineage-boundary'], ['dated copy relation', 'colophon/transmission evidence'], 'Unresolved.'),
        'semantic-corroboration': axis('unresolved', ['obs.A.k3-p72-worked-example', 'obs.A.nlc-p106-worked-example'], ['independent lineage'], 'Unresolved.'),
      },
      blockers: [LINEAGE_BLOCKER],
      scopeCorrection: 'Different institutions, formats, and the verified 申時 omission are evidence to narrow the relation, not proof of independent lineage. No Song print, ancient manuscript, Joseon official/academy lineage, or canonical edition is declared.',
      promotionTarget: 'lineage_specific_stability',
    }),
    makeClaim({
      claimId: 'claim.C.bounded-worked-example-correspondence',
      unit: 'C',
      status: 'supported',
      candidateAssertion: 'Within the bounded 卷33 / 甲子陽男 scope, the two directly read pages preserve the same ordered worked-example calculation and expanded 約法 critique, subject to the verified first-clause 申時 omission.',
      evidenceRefs: ['obs.A.k3-p72-worked-example', 'obs.A.nlc-p106-worked-example', 'VAR-01', 'VAR-06'],
      gates: { H: 'satisfied', E: 'satisfied', L: 'unresolved', S: 'satisfied', I: 'unresolved', P: 'unresolved' },
      axes: {
        'physical-item': axis('satisfied', ['ev.A.k3-official-record', 'ev.A.nlc-official-record'], [], 'Two actual holdings observed.'),
        'digital-derivation': axis('satisfied', ['ev.A.k3-official-scan', 'ev.A.nlc-derivative-scan'], ['official NLC source-bitstream equality'], 'Two digital objects observed.'),
        'edition/textual-lineage': axis('unresolved', ['ev.B.k3-preface-provenance-boundary', 'ev.B.nlc-provenance-lineage-boundary'], ['independent lineage'], 'Unresolved.'),
        'semantic-corroboration': axis('unresolved', ['obs.A.k3-p72-worked-example', 'obs.A.nlc-p106-worked-example'], ['independent lineage/semantic authority'], 'The bounded correspondence does not satisfy this independence axis.'),
      },
      blockers: [LINEAGE_BLOCKER],
      scopeCorrection: 'This is the only bounded semantic/correspondence admission. It is not implementation authority and is not a production-safe rule.',
      promotionTarget: 'historical_observation_stability',
    }),
    makeClaim({
      claimId: 'claim.D.wonkwang-third-witness-reality',
      unit: 'D',
      status: 'unresolved',
      candidateAssertion: 'Wonkwang first-party records verify a 34-volume 五行精紀 item, 乙亥字本(1455), and an actual 卷33 scan.',
      evidenceRefs: ['ev.D.wonkwang-bounded-search'],
      gates: { H: 'unresolved', E: 'unresolved', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
      blockers: [THIRD_WITNESS_BLOCKER],
      scopeCorrection: 'Keep as INSTITUTIONAL_METADATA/PHYSICAL_ITEM_CANDIDATE only. No Wonkwang item ID, first-party edition/date record, 卷33 inclusion record, or page bytes were found in the bounded search. 1455 is rejected as unverified.',
      promotionTarget: 'lineage_specific_stability',
    }),
    makeClaim({
      claimId: 'claim.D.sonkeikaku-third-witness-reality',
      unit: 'D',
      status: 'unresolved',
      candidateAssertion: 'Sonkeikaku first-party records verify a complete 34-volume old-book/宋版/古鈔本 五行精紀 with accessible 卷33 reproduction.',
      evidenceRefs: ['ev.D.sonkeikaku-access-block'],
      gates: { H: 'unresolved', E: 'unresolved', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
      blockers: [THIRD_WITNESS_BLOCKER],
      scopeCorrection: 'The official access route was unavailable during the bounded check. Retain the Gemini report as a physical-item candidate only; no item identity, edition/date, 卷33 page, or corroboration is admitted.',
      promotionTarget: 'lineage_specific_stability',
    }),
    makeClaim({
      claimId: 'claim.E.v4-all-units-resolved',
      unit: 'E',
      status: 'unsupported',
      candidateAssertion: 'Gemini v4 resolves Units A–E and promotes the witnesses for interpretation/implementation.',
      evidenceRefs: ['ev.packet.v4-file-identity', 'claim.A.k3-nlc-variant-crosswalk', 'claim.C.edition-textual-lineage-remains-unresolved', 'claim.D.wonkwang-third-witness-reality', 'claim.D.sonkeikaku-third-witness-reality'],
      gates: { H: 'unresolved', E: 'unresolved', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
      blockers: [LINEAGE_BLOCKER, THIRD_WITNESS_BLOCKER],
      scopeCorrection: 'The candidate is retained as acquisition input only. No availableForInterpretation, semantic authority, implementation-safe grounding, canonical edition, or activation transition is allowed.',
      promotionTarget: 'implementation_safe_grounding',
    }),
  ]

  const gateStateCounts = Object.fromEntries(GATE_KEYS.map(gate => [gate, Object.fromEntries(GATE_STATES.map(state => [state, claims.filter(claim => claim.gates[gate] === state).length]))]))
  const statusCounts = Object.fromEntries(CLAIM_STATUSES.map(status => [status, claims.filter(claim => claim.status === status).length]))

  const beforeDayun = baseline.dayunClaims.map(claim => ({
    claimId: claim.id || claim.claimId,
    stability: claim.stability || claim.currentStabilityLevel || 'historical_observation_stability',
    gates: claim.gates || {},
    promotion: claim.promotion || { ready: false, status: 'blocked' },
  }))
  const afterDayun = beforeDayun.map(claim => ({
    ...claim,
    additiveEvidenceRefs: ['obs.A.k3-p72-worked-example', 'obs.A.nlc-p105-formula', 'obs.A.nlc-p106-worked-example', 'claim.C.bounded-worked-example-correspondence'],
    additiveDecision: 'No typed gate transition and no implementation promotion; direct observation/correspondence is appended only.',
  }))

  return {
    schemaVersion: SAJU_LUNA_DEEP_COLLATION_V4_SCHEMA,
    version: SAJU_LUNA_DEEP_COLLATION_V4_VERSION,
    basisHead,
    scope: {
      purpose: 'Parent-direct v4 re-audit of K3-437↔NLC 06857 variants, witness identity/lineage, independence sub-axes, third-witness reality, and additive typed-readiness reconciliation.',
      sourceOfTruth: 'Parent-observed first-party records, byte-identified official/derivative PDFs, direct visual target-page observations, and explicitly scoped candidate-file identity.',
      units: ['A', 'B', 'C', 'D', 'E'],
      gateKeys: [...GATE_KEYS],
      gateStates: [...GATE_STATES],
      independenceAxes: [...INDEPENDENCE_AXES],
      variantStatuses: [...VARIANT_STATUSES],
      sourceCategories: [...SOURCE_CATEGORIES],
      candidateBoundary,
      ocrPolicy: 'OCR and modern punctuation are locator aids only. No OCR output was used as a textual variant or canonical reading.',
      textPolicy: 'Direct readings are bounded visual observations at named PDF pages; no normalized or canonical text is emitted.',
      provenancePolicy: 'Calculation fact, source evidence, relation, semantic correspondence, independence, readiness, and activation remain separate.',
      forbiddenPromotion: ['availableForInterpretation', 'semanticAuthority', 'implementationSafeGrounding', 'productionActivation', 'canonicalEdition', 'implementationSafeRule'],
    },
    candidatePacket: CANDIDATE_PACKET,
    externalEvidence: EXTERNAL_EVIDENCE,
    pageObservations: PAGE_OBSERVATIONS,
    variantAdjudication: VARIANT_ADJUDICATION,
    crosswalk: CROSSWALK,
    witnessIdentityAudit: WITNESS_IDENTITY_AUDIT,
    independenceAdjudication: INDEPENDENCE_ADJUDICATION,
    typedReadinessReconciliation: {
      before: {
        artifactPath: 'artifacts/saju-five-classics-typed-readiness-contract-v0/complete.json',
        schemaVersion: baseline.schemaVersion,
        version: baseline.version,
        contentSha256: baseline.contentSha256,
        activeClaimCount: baseline.activeClaimCount,
        gateStateCounts: baseline.gateStateCounts,
        readiness: baseline.readiness,
        dayunClaims: beforeDayun,
      },
      after: {
        gateStateCounts: baseline.gateStateCounts,
        dayunClaims: afterDayun,
        additiveScope: {
          historicalObservationStability: { state: 'satisfied', scope: 'K3-437/NLC 114503.0 bounded visual observations and six target loci', refs: ['obs.A.k3-p71-heading', 'obs.A.k3-p72-worked-example', 'obs.A.nlc-p105-formula', 'obs.A.nlc-p106-worked-example'] },
          boundedSemanticCorroboration: { state: 'satisfied', scope: INDEPENDENCE_ADJUDICATION.after.scopeLimitedCorrespondence.scope, refs: INDEPENDENCE_ADJUDICATION.after.scopeLimitedCorrespondence.evidenceRefs, boundary: 'Correspondence scope only; semantic-corroboration independence axis remains unresolved.' },
          lineageSpecificStability: { state: 'unresolved', scope: 'K3-437↔NLC edition/textual-lineage relation', refs: ['ev.B.k3-preface-provenance-boundary', 'ev.B.nlc-provenance-lineage-boundary'] },
        },
        gateTransitions: Object.fromEntries(GATE_KEYS.map(gate => [gate, { before: baseline.gateStateCounts[gate], after: baseline.gateStateCounts[gate], transition: 'unchanged' }])),
        promotionReadyClaimIds: [],
        stableClaimPromotionCount: 0,
        availableForInterpretation: false,
        semanticAuthority: 'not_established',
        implementationSafeGrounding: 'not_established',
        productionActivation: 'blocked',
      },
      promotionDecision: 'promotion_0_normal',
      rationale: 'The direct page observations stabilize bounded historical observation and worked-example correspondence only. The unresolved edition/textual-lineage and independence edges keep typed readiness and activation closed.',
    },
    negativeChecks: {
      geminiVariantImport: { status: 'pass', result: 'Candidate alternatives not directly observed were rejected/corrected; candidate file identity alone was admitted.' },
      institutionDifferenceImpliesIndependence: { status: 'pass', result: 'Different institutions satisfy physical-item identity only; edition/textual-lineage remains unresolved.' },
      digitalObjectImpliesPhysicalWitness: { status: 'pass', result: 'K3 official PDF and NLC derivative are tracked as digital objects; derivative is not counted as a second physical witness.' },
      textualVariantClosesIndependence: { status: 'pass', result: 'Verified 申時 omission is recorded as a variant and does not close I.' },
      workedExampleImpliesImplementationAuthority: { status: 'pass', result: 'Bounded correspondence is not a production or implementation rule.' },
      catalogDetailExactDateOrEdition: { status: 'pass', result: 'Catalog windows/preface dates/author labels are not promoted to current-copy date or canonical edition.' },
      inaccessibleWitnessCorroborates: { status: 'pass', result: 'Wonkwang and Sonkeikaku are not included in semantic corroboration without first-party item/page evidence.' },
      ocrOrPunctuationAsVariant: { status: 'pass', result: 'OCR/modern punctuation/normalization are excluded from variant status.' },
    },
    claims,
    blockerLedger: {
      falseBlockers: [
        { blockerId: 'false.v4-candidate-packet-as-adjudication', status: 'not_evidence', note: 'Candidate dossier is untrusted input.' },
        { blockerId: 'false.k3-preface-date-as-copy-date', status: 'not_evidence', note: 'Preface date does not date the current K3-437 copy.' },
        { blockerId: 'false.nlc-catalog-window-as-exact-date', status: 'not_evidence', note: '清[1644-1911] is a broad catalog field.' },
      ],
      realBlockers: [LINEAGE_BLOCKER, THIRD_WITNESS_BLOCKER],
    },
    predecessorReferences,
    readinessOverlay: {
      reportedByCandidate: { trust: 'untrusted_candidate_only', allUnitsResolved: 'not_admitted' },
      parentVerified: {
        comparablePopulation: `${claims.length} v4 parent-adjudicated assertions; not numerically comparable to the typed-readiness 13-claim population.`,
        gateStateCounts,
        parentVerifiedClaimIds: claims.filter(claim => claim.status === 'supported').map(claim => claim.claimId),
        promotionReadyClaimIds: [],
        stableClaimPromotionCount: 0,
        availableForInterpretation: false,
        semanticAuthority: 'not_established',
        implementationSafeGrounding: 'not_established',
        productionActivation: 'blocked',
      },
    },
    promotion: {
      status: 'blocked',
      ready: false,
      promotionReadyClaimIds: [],
      stableClaimPromotionCount: 0,
      semanticAuthorityChanged: false,
      productionChanged: false,
      interpretationAvailable: false,
      canonicalEditionDeclared: false,
    },
    summary: {
      claimCount: claims.length,
      statusCounts,
      variantCount: VARIANT_ADJUDICATION.length,
      verifiedVariantCount: VARIANT_ADJUDICATION.filter(item => item.status === 'verified').length,
      correctedVariantCount: VARIANT_ADJUDICATION.filter(item => item.status === 'corrected').length,
      rejectedVariantCount: VARIANT_ADJUDICATION.filter(item => item.status === 'rejected').length,
      unresolvedVariantCount: VARIANT_ADJUDICATION.filter(item => item.status === 'unresolved').length,
      parentVerifiedClaimCount: claims.filter(claim => claim.status === 'supported').length,
      promotionReadyClaimCount: 0,
      supportedScope: ['K3-437 and NLC 114503.0 target-page identity and bounded direct observations', 'six-locus variant adjudication', 'physical-item and digital-derivation sub-axis satisfaction without lineage promotion', 'bounded worked-example correspondence'],
      unresolvedScope: ['K3-437↔NLC edition/textual-lineage relation', 'independent semantic-corroboration axis', 'Wonkwang first-party item/page reality', 'Sonkeikaku item/page reality while official access is blocked', 'interpretation readiness, implementation grounding, canonical edition, and activation'],
      predecessorDelta: {
        predecessorSchema: 'saju-gemini-witness-dossier-adjudication-v3',
        directEvidenceBoundaryChanged: true,
        changes: [
          'Gemini v4 packet and matrix are byte-identified and remain untrusted_candidate_only.',
          'K3-437 and NLC 114503.0 target pages were directly reread at PDF pp.71–72 and 105–106.',
          'The first 申時 omission is verified; the candidate NLC 九個月, 四個月, 為十日, and condensed 約法 alternatives are rejected/corrected after direct reading.',
          'K3 official layout is corrected from candidate 四周單邊 to the first-party catalogued 四周雙邊 field.',
          'Witness identity and digital derivation are separated from unresolved edition/textual lineage and semantic-corroboration independence.',
          'Wonkwang remains metadata/candidate-only and 乙亥字本(1455) is not approved; Sonkeikaku remains access-blocked without corroboration.',
          'Typed readiness is reconciled additively with promotion 0 and no activation transition.',
        ],
      },
    },
  }
}

const isObject = value => Boolean(value && typeof value === 'object' && !Array.isArray(value))

export function checkSajuLunaDeepCollationAdjudicationV4(artifact) {
  const errors = []
  if (!isObject(artifact)) return ['artifact_shape_invalid']
  if (artifact.schemaVersion !== SAJU_LUNA_DEEP_COLLATION_V4_SCHEMA) errors.push('schema_version')
  if (artifact.version !== SAJU_LUNA_DEEP_COLLATION_V4_VERSION) errors.push('version')
  if (artifact.candidatePacket?.trustBoundary !== 'untrusted_candidate_only') errors.push('candidate_trust_boundary')
  if (artifact.candidatePacket?.importedAsCanonicalEvidence !== false) errors.push('candidate_import_boundary')
  if (artifact.candidatePacket?.importedConclusionFields?.length !== 0) errors.push('candidate_conclusion_import')
  if (artifact.candidatePacket?.actualModelRuntimeVerified !== false) errors.push('candidate_runtime_boundary')
  if (JSON.stringify(artifact.scope?.gateKeys) !== JSON.stringify(GATE_KEYS)) errors.push('gate_contract')
  if (JSON.stringify(artifact.scope?.independenceAxes) !== JSON.stringify(INDEPENDENCE_AXES)) errors.push('independence_contract')
  if (JSON.stringify(artifact.scope?.variantStatuses) !== JSON.stringify(VARIANT_STATUSES)) errors.push('variant_status_contract')
  if (!Array.isArray(artifact.externalEvidence) || artifact.externalEvidence.length < EXTERNAL_EVIDENCE.length) errors.push('external_evidence_count')
  if (!Array.isArray(artifact.pageObservations) || artifact.pageObservations.length !== PAGE_OBSERVATIONS.length) errors.push('page_observation_count')
  if (!Array.isArray(artifact.variantAdjudication) || artifact.variantAdjudication.length !== VARIANT_ADJUDICATION.length) errors.push('variant_count')
  if (!Array.isArray(artifact.claims) || artifact.claims.length !== 8) errors.push('claim_count')

  const evidenceIds = new Set((artifact.externalEvidence || []).map(item => item.evidenceId))
  const observationIds = new Set((artifact.pageObservations || []).map(item => item.observationId))
  if (evidenceIds.size !== (artifact.externalEvidence || []).length) errors.push('duplicate_evidence_id')
  if (observationIds.size !== (artifact.pageObservations || []).length) errors.push('duplicate_observation_id')
  for (const evidence of artifact.externalEvidence || []) {
    if (!SOURCE_CATEGORIES.includes(evidence.sourceCategory)) errors.push(`evidence:${evidence.evidenceId}:source_category`)
    if (evidence.canonicalTextAdmitted === true) errors.push(`evidence:${evidence.evidenceId}:canonical_text_admitted`)
  }
  for (const observation of artifact.pageObservations || []) {
    if (!SOURCE_CATEGORIES.includes(observation.sourceCategory)) errors.push(`observation:${observation.observationId}:source_category`)
    if (observation.canonicalTextObserved === true) errors.push(`observation:${observation.observationId}:canonical_text_observed`)
    if (!evidenceIds.has(observation.evidenceId)) errors.push(`observation:${observation.observationId}:evidence_ref`)
  }
  for (const variant of artifact.variantAdjudication || []) {
    if (!VARIANT_STATUSES.includes(variant.status)) errors.push(`variant:${variant.variantId}:status`)
    if (variant.unreadable !== false) errors.push(`variant:${variant.variantId}:unreadable`)
    for (const observationId of [variant.locators?.k3?.observationId, variant.locators?.nlc?.observationId]) if (!observationIds.has(observationId)) errors.push(`variant:${variant.variantId}:observation_ref`)
    if (variant.scopeBoundary !== scopeBoundary) errors.push(`variant:${variant.variantId}:scope_boundary`)
  }
  for (const claim of artifact.claims || []) {
    if (!CLAIM_STATUSES.includes(claim.status)) errors.push(`claim:${claim.claimId}:status`)
    if (!['A', 'B', 'C', 'D', 'E'].includes(claim.unit)) errors.push(`claim:${claim.claimId}:unit`)
    for (const gate of GATE_KEYS) if (!GATE_STATES.includes(claim.gates?.[gate])) errors.push(`claim:${claim.claimId}:gate:${gate}`)
    for (const independenceAxis of INDEPENDENCE_AXES) {
      if (!isObject(claim.independence?.[independenceAxis])) errors.push(`claim:${claim.claimId}:axis:${independenceAxis}:missing`)
      if (claim.independence?.[independenceAxis]?.countedAsIndependent === true) errors.push(`claim:${claim.claimId}:axis:${independenceAxis}:counted_as_independent`)
    }
    if (claim.candidateEvidenceAccepted !== false) errors.push(`claim:${claim.claimId}:candidate_evidence_accepted`)
    if (claim.promotion?.ready !== false || claim.promotion?.status !== 'blocked') errors.push(`claim:${claim.claimId}:promotion_not_blocked`)
    for (const ref of claim.parentVerifiedEvidenceRefs || []) if (!evidenceIds.has(ref) && !observationIds.has(ref) && !ref.startsWith('claim.') && !ref.startsWith('VAR-')) errors.push(`claim:${claim.claimId}:evidence_ref:${ref}`)
  }

  const findVariant = id => artifact.variantAdjudication?.find(item => item.variantId === id)
  if (findVariant('VAR-01')?.status !== 'verified' || findVariant('VAR-01')?.directReading?.k3 !== '是月二十九日申時立春' || findVariant('VAR-01')?.directReading?.nlc !== '是月二十九日立春') errors.push('VAR-01_boundary')
  for (const id of ['VAR-02', 'VAR-03', 'VAR-04', 'VAR-05', 'VAR-06']) if (findVariant(id)?.status !== 'corrected') errors.push(`${id}_candidate_correction_boundary`)
  if (findVariant('VAR-03')?.directReading?.nlc !== '乃是一歲奇九月之大運') errors.push('VAR-03_direct_reading')
  if (findVariant('VAR-04')?.directReading?.nlc !== '為四箇月之數') errors.push('VAR-04_direct_reading')
  if (findVariant('VAR-05')?.directReading?.nlc !== '一時辰得十日之數') errors.push('VAR-05_direct_reading')
  if (findVariant('VAR-06')?.directReading?.nlc !== fullApproximation) errors.push('VAR-06_direct_reading')

  const after = artifact.independenceAdjudication?.after
  if (after?.['physical-item']?.state !== 'satisfied' || after?.['digital-derivation']?.state !== 'satisfied' || after?.['edition/textual-lineage']?.state !== 'unresolved' || after?.['semantic-corroboration']?.state !== 'unresolved' || after?.overall !== 'unresolved') errors.push('independence_boundary')
  if (after?.['edition/textual-lineage']?.countedAsIndependent === true || after?.['semantic-corroboration']?.countedAsIndependent === true) errors.push('independence_inflation')
  if (after?.scopeLimitedCorrespondence?.state !== 'satisfied') errors.push('bounded_correspondence_boundary')
  if (artifact.witnessIdentityAudit?.K3_437?.editionCopyMetadata?.layout !== undefined) errors.push('unexpected_layout_shape')
  if (artifact.witnessIdentityAudit?.K3_437?.layout?.candidateCorrection?.includes('四周雙邊') !== true) errors.push('K3_layout_correction')
  if (artifact.witnessIdentityAudit?.NLC_06857?.digitalObject?.originalNlcBitstreamDownloaded !== false) errors.push('NLC_original_bitstream_boundary')
  if (artifact.claims.find(item => item.claimId === 'claim.D.wonkwang-third-witness-reality')?.status !== 'unresolved') errors.push('Wonkwang_boundary')
  if (artifact.claims.find(item => item.claimId === 'claim.D.sonkeikaku-third-witness-reality')?.status !== 'unresolved') errors.push('Sonkeikaku_boundary')

  const readiness = artifact.readinessOverlay?.parentVerified
  if (readiness?.promotionReadyClaimIds?.length !== 0) errors.push('readiness_promotion')
  if (readiness?.stableClaimPromotionCount !== 0) errors.push('readiness_stable_count')
  if (readiness?.availableForInterpretation !== false) errors.push('readiness_available')
  if (readiness?.semanticAuthority !== 'not_established') errors.push('readiness_semantic_authority')
  if (readiness?.implementationSafeGrounding !== 'not_established') errors.push('readiness_implementation')
  if (readiness?.productionActivation !== 'blocked') errors.push('readiness_activation')
  if (artifact.promotion?.ready !== false || artifact.promotion?.status !== 'blocked' || artifact.promotion?.canonicalEditionDeclared !== false) errors.push('promotion_boundary')
  if (artifact.typedReadinessReconciliation?.promotionDecision !== 'promotion_0_normal') errors.push('typed_promotion_boundary')
  if (artifact.typedReadinessReconciliation?.after?.gateTransitions && Object.values(artifact.typedReadinessReconciliation.after.gateTransitions).some(item => item.transition !== 'unchanged')) errors.push('typed_gate_transition')
  for (const [key, item] of Object.entries(artifact.negativeChecks || {})) if (item.status !== 'pass') errors.push(`negative_check:${key}`)
  return [...new Set(errors)].sort()
}

export const candidatePacketByteSha256 = value => sha256(value)
