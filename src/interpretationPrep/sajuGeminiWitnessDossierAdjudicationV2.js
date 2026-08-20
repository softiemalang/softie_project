import { createHash } from 'node:crypto'

import { CANDIDATE_PACKET as GEMINI_V1_CANDIDATE_PACKET } from './sajuGeminiWitnessDossierAdjudication.js'

export const SAJU_GEMINI_WITNESS_DOSSIER_V2_SCHEMA = 'saju-gemini-witness-dossier-adjudication-v2'
export const SAJU_GEMINI_WITNESS_DOSSIER_V2_VERSION = '2.0.0'
export const GATE_KEYS = Object.freeze(['H', 'E', 'L', 'S', 'I', 'P'])
export const GATE_STATES = Object.freeze(['satisfied', 'unresolved', 'conflicted', 'not_applicable'])
export const CLAIM_STATUSES = Object.freeze(['supported', 'partially_supported', 'unsupported', 'unresolved'])
export const UNITS = Object.freeze(['A', 'B', 'C', 'D', 'E'])
export const SOURCE_CATEGORIES = Object.freeze([
  'DIRECT_OFFICIAL_SCAN',
  'DIRECT_DERIVATIVE_SCAN',
  'INSTITUTIONAL_METADATA',
  'PHYSICAL_ITEM_CANDIDATE',
  'BIBLIOGRAPHIC_WITNESS',
  'INFERENCE',
  'UNRESOLVED',
])
export const INDEPENDENCE_AXES = Object.freeze([
  'physical-item',
  'digital-derivation',
  'edition/textual-lineage',
  'semantic-corroboration',
])

const sha256 = value => createHash('sha256').update(value).digest('hex')

const jsgRecordUrl = 'https://jsg.aks.ac.kr/dir/view?dataId=LIB_116678'
const jsgPdfUrl = 'https://jsg.aks.ac.kr/data/serviceFiles/pdf/K3-437_006.pdf'
const kyujanggakRecordUrl = 'https://kyudb.snu.ac.kr/book/view.do?book_cd=GC01822_00'
const nlcRecordUrl = 'http://read.nlc.cn/allSearch/searchDetail?searchType=24&showType=1&indexName=data_892&fid=411999013122'
const nlcVol3OpenUrl = 'http://read.nlc.cn/OutOpenBook/OpenObjectBook?aid=892&bid=114453.0'
const nlcVol4OpenUrl = 'http://read.nlc.cn/OutOpenBook/OpenObjectBook?aid=892&bid=114503.0'
const nlcVol4CommonsPageUrl = 'https://commons.wikimedia.org/wiki/File:NLC892-411999013122-114503_%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80_%E7%AC%AC4%E5%86%8A.pdf'
const nlcVol4CommonsPdfUrl = 'https://upload.wikimedia.org/wikipedia/commons/a/a0/NLC892-411999013122-114503_%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80_%E7%AC%AC4%E5%86%8A.pdf'
const nclGengcunRecordUrl = 'https://rbook.ncl.edu.tw/NCLSearch/Search/SearchDetail?item=00ccfe6380184da28912a57393deb2d7fDI2NTQ0NQ2.PBlfBdELN3au83ZWddAblOP5Y3FBX8h5SLzXyf79aB4_&image=1&page=1030&SourceID=1&HasImage='
const nclGengcunCommonsPageUrl = 'https://commons.wikimedia.org/wiki/File:NCL-06599_%E8%80%95%E5%AF%B8%E9%9B%86.pdf'
const nclGengcunCommonsPdfUrl = 'https://upload.wikimedia.org/wikipedia/commons/9/95/NCL-06599_%E8%80%95%E5%AF%B8%E9%9B%86.pdf'
const qinEnfuAuthorityUrl = 'https://newarchive.ihp.sinica.edu.tw/sncaccgi/sncacFtp?ACTION=TQ%2CsncacFtpqf%2CSN%3D041488%2C2nd%2Csearch_simple'
const shanghaiSearchUrl = term => `https://vufind.library.sh.cn/api/v1/search?lookfor=${encodeURIComponent(term)}`
const baohuicaotangBibliographicUrl = 'https://www.donglishuzhai.net/books/63.html'
const yuxinBibliographicUrl = 'https://caipu.donglishuzhai.net/chapter/3711.html'
const baohuicaotangHoldingClueUrl = 'https://www.guoxuedashi.com/shumu/gj-2126150ys.html'
const wasedaRecordUrl = 'https://www.wul.waseda.ac.jp/kotenseki/html/bunko19/bunko19_f0111/index.html'
const wasedaPdfUrl = 'https://archive.wul.waseda.ac.jp/kosho/bunko19/bunko19_f0111/bunko19_f0111.pdf'
const wasedaImageUrl = page => `https://archive.wul.waseda.ac.jp/kosho/bunko19/bunko19_f0111/bunko19_f0111_p${String(page).padStart(4, '0')}.jpg`

export const CANDIDATE_PACKET = Object.freeze({
  ...GEMINI_V1_CANDIDATE_PACKET,
  modelClaimedByUser: 'Gemini 3.7 Flash High v3',
  trustBoundary: 'untrusted_candidate_only',
  importedAsCanonicalEvidence: false,
  importedConclusionFields: [],
})

const derivativePolicy = 'A public derivative is a traceable digital object for bounded page observation; it is not the physical item, does not prove official-byte equality, and is not an independent textual lineage.'
const rawObservationPolicy = 'A visible record field, page, seal block, heading, or bounded visual transcription is admitted only at its stated locator and source-category scope; it does not become canonical text, semantic authority, interpretation readiness, or activation.'

export const EXTERNAL_EVIDENCE = Object.freeze([
  {
    evidenceId: 'ev.A.jangseogak-record',
    unit: 'A',
    sourceCategory: 'INSTITUTIONAL_METADATA',
    status: 'parent_verified',
    url: jsgRecordUrl,
    institution: '장서각 / 한국학중앙연구원',
    callNumber: 'K3-437',
    observedFields: ['五行精紀', '木版', '[刊年未詳]', '線裝34卷6冊', 'MF35-143~4'],
    scopeBoundary: 'Institutional record identity and undated physical-description metadata; it does not by itself prove the target page wording.',
  },
  {
    evidenceId: 'ev.A.jangseogak-official-scan',
    unit: 'A',
    sourceCategory: 'DIRECT_OFFICIAL_SCAN',
    status: 'parent_verified_byte_identity',
    url: jsgPdfUrl,
    recordUrl: jsgRecordUrl,
    callNumber: 'K3-437',
    pageCount: 134,
    byteLength: 14116437,
    byteSha256: '335a1c03c7af246969e00667d6a4d9756b19c19d93539223bb871c47001a24cd',
    inspectedRenderedPages: [71, 72, 73],
    scopeBoundary: 'Institution-hosted scan bytes and bounded visual observations at rendered pages 71–73; no edition date or semantic authority is inferred.',
  },
  {
    evidenceId: 'ev.A.nlc-official-record-volume-map',
    unit: 'A',
    sourceCategory: 'INSTITUTIONAL_METADATA',
    status: 'parent_verified',
    url: nlcRecordUrl,
    observedFields: ['五行精紀', '(宋)廖中撰', '清[1644-1911]', '善本书号06857', '抄本', '存33卷：1～33'],
    volumeMap: { '114453.0': '第3卷', '114503.0': '第4卷' },
    scopeBoundary: 'Official NLC record and volume map; catalog metadata does not itself prove the derivative page wording.',
  },
  {
    evidenceId: 'ev.A.nlc-vol3-route-rejected',
    unit: 'A',
    sourceCategory: 'DIRECT_DERIVATIVE_SCAN',
    status: 'parent_verified_negative_for_target',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/NLC892-411999013122-114453_%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80_%E7%AC%AC3%E5%86%8A.pdf',
    officialRoute: nlcVol3OpenUrl,
    physicalVolume: '第3卷; Commons description: 卷16–24',
    pageCount: 110,
    byteLength: 37007952,
    byteSha256: 'e88387495032048b71d11196ee59861ad1bfeee4c7ca5ee80fd9686eb9d37d04',
    scopeBoundary: 'The earlier third-volume route is retained only as a corrected locator boundary; it is not the target 卷33 scan.',
  },
  {
    evidenceId: 'ev.A.nlc-vol4-official-route',
    unit: 'A',
    sourceCategory: 'INSTITUTIONAL_METADATA',
    status: 'parent_verified_access_boundary',
    url: nlcVol4OpenUrl,
    bid: '114503.0',
    officialPdfPath: 'data09/sbgj_shanbenguji/20151221_01szsb4171/duixiang/SBGJ04096_00004/SBGJ04096/00004/SBGJ04096_00004.pdf',
    scopeBoundary: 'The official fourth-volume route is identified and permission-limited; the inspected pages below come from the separately identified public derivative.',
  },
  {
    evidenceId: 'ev.A.nlc-vol4-derivative-scan',
    unit: 'A',
    sourceCategory: 'DIRECT_DERIVATIVE_SCAN',
    status: 'parent_verified_byte_identity',
    url: nlcVol4CommonsPdfUrl,
    pageUrl: nlcVol4CommonsPageUrl,
    officialRecordUrl: nlcRecordUrl,
    pageCount: 114,
    byteLength: 38628523,
    byteSha256: '6519fbdc0fa25272bf6aae0fdac8c73107c0f6b852a1b0beebc655344ec2812d',
    sourceSha1: '96da51a6d895469723d31694d45ef438643d7aab',
    physicalVolume: '第4卷; Commons description: 卷25–33',
    scopeBoundary: derivativePolicy,
  },
  {
    evidenceId: 'ev.A.kyujanggak-record-candidate',
    unit: 'A',
    sourceCategory: 'PHYSICAL_ITEM_CANDIDATE',
    status: 'parent_verified_metadata_only',
    url: kyujanggakRecordUrl,
    callNumber: '奎中1822-v.1-5',
    observedFields: ['五行精紀', '[刊年未詳]', '木版本', '28卷5冊(零本)', '卷29-34(1冊) 缺', '마이크로필름'],
    scopeBoundary: 'Kyujanggak holding metadata is a physical-item candidate only; no actual 卷33 page scan or target passage was parent-verified.',
  },
  {
    evidenceId: 'ev.B.ncl-gengcun-official-record',
    unit: 'B',
    sourceCategory: 'INSTITUTIONAL_METADATA',
    status: 'parent_verified',
    url: nclGengcunRecordUrl,
    observedFields: ['耕寸集不分卷', '306.5 06599', '善本書號/06599', '石研齋/秦氏印', '國立中央圖書館收藏'],
    viewerBoundary: 'The official viewer route is puzzle-CAPTCHA gated; no bypass was attempted.',
    scopeBoundary: 'Official catalog metadata supports item identity and the recorded seal reading; it does not date the seal application or promote target-page text.',
  },
  {
    evidenceId: 'ev.B.ncl-gengcun-derivative-scan',
    unit: 'B',
    sourceCategory: 'DIRECT_DERIVATIVE_SCAN',
    status: 'parent_verified_page_observation',
    url: nclGengcunCommonsPdfUrl,
    pageUrl: nclGengcunCommonsPageUrl,
    pageCount: 103,
    byteLength: 22371107,
    byteSha256: '8d6a42e1a6aa5675f978256349c9fcc145550a1c29c3947c425d3f611bfb27a3',
    sourceSha1: 'bcea42065da1e9c8978a96f5c741f6250953e0da',
    inspectedPage: 1,
    scopeBoundary: derivativePolicy,
  },
  {
    evidenceId: 'ev.B.qin-enfu-authority',
    unit: 'B',
    sourceCategory: 'INSTITUTIONAL_METADATA',
    status: 'parent_verified_authority_scope',
    url: qinEnfuAuthorityUrl,
    observedFields: ['秦恩復', '1760–1843', '石研齋'],
    scopeBoundary: 'Authority/person record supports the attribution of the 石研齋 room name to Qin Enfu and his lifespan; it does not prove that this item’s seal was applied by him or before 1843.',
  },
  {
    evidenceId: 'ev.B.seal-chronology-unresolved',
    unit: 'B',
    sourceCategory: 'UNRESOLVED',
    status: 'open_blocker',
    missingEvidence: ['seal application date', 'ownership chronology for this item', 'dated colophon or provenance chain'],
    scopeBoundary: 'The 1843 terminus ante quem is not admitted without seal-application chronology.',
  },
  {
    evidenceId: 'ev.C.shanghai-bounded-official-search',
    unit: 'C',
    sourceCategory: 'INSTITUTIONAL_METADATA',
    status: 'parent_verified_bounded_search',
    url: 'https://vufind.library.sh.cn/',
    queries: [
      { term: '秘本子平真詮', url: shanghaiSearchUrl('秘本子平真詮'), resultCount: 1, returnedId: '3e8bd9b5-3372-4593-8e6d-f0433772ea58', returnedTitle: '四库存目子平汇刊 2 秘本子平真诠' },
      { term: '報暉草堂', url: shanghaiSearchUrl('報暉草堂'), resultCount: 0 },
      { term: '育新書局', url: shanghaiSearchUrl('育新書局'), resultCount: 1, returnedTitle: '重修金华丛书 14' },
    ],
    scopeBoundary: 'Bounded official API results did not expose exact 1895/1923 date-bearing item records, holdings, or target pages; this is not a global absence claim.',
  },
  {
    evidenceId: 'ev.C.1895-third-party-bibliographic-witness',
    unit: 'C',
    sourceCategory: 'BIBLIOGRAPHIC_WITNESS',
    status: 'parent_verified_as_third_party_recitation',
    url: baohuicaotangBibliographicUrl,
    claimedEdition: '光緒二十一年乙未報暉草堂刻本 (1895)',
    witnessKind: 'third_party_book_overview',
    scopeBoundary: 'This page is a bibliographic lead/recitation only. It is not an item-level institutional catalog, physical description, scan, or target-page witness.',
  },
  {
    evidenceId: 'ev.C.1895-holding-clue',
    unit: 'C',
    sourceCategory: 'BIBLIOGRAPHIC_WITNESS',
    status: 'parent_verified_as_third_party_recitation',
    url: baohuicaotangHoldingClueUrl,
    claimedEdition: '光緖乙未報暉草堂精刋',
    witnessKind: 'third_party_holding_clue',
    scopeBoundary: 'The page itself warns that the clue is not a facsimile or item-level page proof; no direct physical witness is admitted.',
  },
  {
    evidenceId: 'ev.C.1923-third-party-bibliographic-witness',
    unit: 'C',
    sourceCategory: 'BIBLIOGRAPHIC_WITNESS',
    status: 'parent_verified_as_third_party_recitation',
    url: yuxinBibliographicUrl,
    claimedEdition: '民國十二年紹興育新書局本 (1923)',
    witnessKind: 'third_party_e_text_preface',
    scopeBoundary: 'The text page declares a 1923 base edition for its recitation, but provides no first-party holding ID, physical description, digital reproduction, or target-page bytes.',
  },
  {
    evidenceId: 'ev.C.item-level-witnesses-unresolved',
    unit: 'C',
    sourceCategory: 'UNRESOLVED',
    status: 'open_blocker',
    missingEvidence: ['1895 item-level institutional record and scan', '1923 item-level institutional record and scan', 'target pages and edition-lineage comparison'],
    scopeBoundary: 'The two dates remain bibliographic leads, not two admitted physical or textual witnesses.',
  },
  {
    evidenceId: 'ev.D.waseda-record',
    unit: 'D',
    sourceCategory: 'INSTITUTIONAL_METADATA',
    status: 'parent_verified',
    url: wasedaRecordUrl,
    callNumber: '文庫19 F0111 / bunko19_f0111',
    title: '窮通宝鑑欄江綱 : 二巻首一巻坿増補月談',
    attributions: ['[清]・余星堂監定', '清・余春台輯', '清・曾寄廛校閲'],
    imprint: '[出版地不明 : 出版者不明]',
    notes: ['封面記:新鐫命理秘訣', '巻第二板心下記:集賢堂'],
    scopeBoundary: 'Official record identity and unknown imprint only; a preface date is not a current-copy date.',
  },
  {
    evidenceId: 'ev.D.waseda-official-scan',
    unit: 'D',
    sourceCategory: 'DIRECT_OFFICIAL_SCAN',
    status: 'parent_verified_byte_identity',
    url: wasedaPdfUrl,
    recordUrl: wasedaRecordUrl,
    pageCount: 108,
    byteLength: 82323986,
    byteSha256: '123ce84b44bd20ecfdd6538bffc413a5e3948598315cd99f857a5c985c7257ae',
    scopeBoundary: 'Institution-hosted scan bytes and bounded page observations; PDF production metadata and preface attributions do not establish the current-copy imprint.',
  },
  {
    evidenceId: 'ev.D.preface-date-unresolved',
    unit: 'D',
    sourceCategory: 'UNRESOLVED',
    status: 'open_blocker',
    inspectedPages: [2, 3],
    candidateText: '光緒十二年歲次丙戌孟秋之月楚南余春台序',
    scopeBoundary: 'The exact date phrase was not observed in the inspected opening pages. This is a bounded unresolved result, not a global claim that the scan contains no such phrase.',
  },
  {
    evidenceId: 'ev.E.typed-boundary-contract',
    unit: 'E',
    sourceCategory: 'INFERENCE',
    status: 'parent_verified_structural',
    sourceCategories: [...SOURCE_CATEGORIES],
    gates: [...GATE_KEYS],
    independenceAxes: [...INDEPENDENCE_AXES],
    scopeBoundary: 'Structural typing and fail-closed boundaries are workflow evidence only; they do not create historical source authority.',
  },
])

const renderedImage = (url, page, byteSha256, printedSection) => ({
  url,
  renderedPdfPage: page,
  renderedImageByteSha256: byteSha256,
  printedSection,
  observationMode: 'direct_visual_review_of_rendered_page',
})

export const PAGE_OBSERVATIONS = Object.freeze([
  {
    observationId: 'obs.A.jangseogak-vol33-heading-and-passage',
    unit: 'A',
    evidenceId: 'ev.A.jangseogak-official-scan',
    sourceCategory: 'DIRECT_OFFICIAL_SCAN',
    pages: [
      renderedImage(jsgPdfUrl, 71, 'b367f310f6f469e48a9189ecb89000941c3cf583b4f4c23c605c4e4e047cc5fc', '五行精紀卷第三十三 / 論大運'),
      renderedImage(jsgPdfUrl, 72, '4249ab2b16e64bb5afb5b22258509a2220169afc61fa4eaa96124941b842375e', '甲子陽男 worked example'),
    ],
    visibleFragments: ['五行精紀卷第三十三', '論大運', '甲子陽男', '六十三時', '六百三十日', '一歲奇九月之大運起於丁丑'],
    textVariant: { before立春: '二十九日申時立春' },
    directObservation: 'The official K3-437 scan visibly shows the 卷33 / 論大運 heading and the requested worked-example fragments at rendered pages 71–72.',
    canonicalTextObserved: false,
    scopeBoundary: rawObservationPolicy,
  },
  {
    observationId: 'obs.A.nlc-vol4-vol33-heading-and-passage',
    unit: 'A',
    evidenceId: 'ev.A.nlc-vol4-derivative-scan',
    sourceCategory: 'DIRECT_DERIVATIVE_SCAN',
    pages: [
      renderedImage(nlcVol4CommonsPdfUrl, 105, 'd8fba1bd9106ea4e40742b02ad6cfe4362ceb2f97c2250ac9d47c263ab6fdc55', '五行精紀卷第三十三 / 大運'),
      renderedImage(nlcVol4CommonsPdfUrl, 106, '7211b057d07241165774ce1c9fa22280552c522cf188795bdcda9d77d986bab8', '甲子陽男 worked example'),
    ],
    visibleFragments: ['五行精紀卷第三十三', '大運', '甲子陽男', '六十三時', '六百三十日', '一歲奇九月之大運起於丁丑'],
    textVariant: { before立春: '二十九日立春', laterStop: '至二十九日申時止' },
    directObservation: 'The corrected 114503.0 fourth-volume derivative visibly shows the target 卷33 / 大運 and the requested worked-example fragments at rendered pages 105–106.',
    canonicalTextObserved: false,
    scopeBoundary: rawObservationPolicy,
  },
  {
    observationId: 'obs.A.cross-scan-bounded-comparison',
    unit: 'A',
    evidenceId: 'ev.A.jangseogak-official-scan',
    sourceCategory: 'INFERENCE',
    comparedEvidenceIds: ['ev.A.jangseogak-official-scan', 'ev.A.nlc-vol4-derivative-scan'],
    directObservation: 'Both page sets support the requested bounded passage family, but the lead-in differs at 立春: Jangseogak visibly has 二十九日申時立春 while the NLC derivative visibly has 二十九日立春. This is recorded as textual variation, not erased for a green comparison.',
    independenceAssessment: {
      physicalItem: 'two institutionally distinct item identities are observed: K3-437 and NLC 06857',
      digitalDerivation: 'Jangseogak official-hosted PDF versus NLC-attributed public derivative',
      editionTextualLineage: 'unresolved',
      semanticCorroboration: 'unresolved',
    },
    canonicalTextObserved: false,
    scopeBoundary: rawObservationPolicy,
  },
  {
    observationId: 'obs.A.kyujanggak-target-scan-unresolved',
    unit: 'A',
    evidenceId: 'ev.A.kyujanggak-record-candidate',
    sourceCategory: 'UNRESOLVED',
    directObservation: 'The Kyujanggak record supplies a volume/holding candidate, but no actual 卷33 scan page or target passage was inspected in this pass.',
    pageBytesObserved: false,
    canonicalTextObserved: false,
    negativeBoundary: 'No conclusion is made about whether Kyujanggak can provide access outside this bounded pass.',
  },
  {
    observationId: 'obs.B.ncl-seal-block-and-metadata',
    unit: 'B',
    evidenceId: 'ev.B.ncl-gengcun-derivative-scan',
    sourceCategory: 'DIRECT_DERIVATIVE_SCAN',
    locator: renderedImage(nclGengcunCommonsPdfUrl, 1, '76a95960380b3cf844c7812e02df2b15db83962b6f2f3576ebddab4222527492', 'first-page lower-right seal block'),
    directObservation: 'A seal-impression block is visibly present on derivative page 1. The exact readings 石研齋/秦氏印 and 國立中央圖書館收藏 are admitted from the official NCL metadata record, not over-read from this derivative crop.',
    metadataReading: '石研齋/秦氏印',
    canonicalTextObserved: false,
    scopeBoundary: rawObservationPolicy,
  },
  {
    observationId: 'obs.B.qin-enfu-attribution-boundary',
    unit: 'B',
    evidenceId: 'ev.B.qin-enfu-authority',
    sourceCategory: 'INSTITUTIONAL_METADATA',
    directObservation: 'The authority record links the 石研齋 room name to 秦恩復 and gives 1760–1843. It does not establish when the seal was applied to the NCL item.',
    canonicalTextObserved: false,
    scopeBoundary: rawObservationPolicy,
  },
  {
    observationId: 'obs.B.taq-1843-unresolved',
    unit: 'B',
    evidenceId: 'ev.B.seal-chronology-unresolved',
    sourceCategory: 'UNRESOLVED',
    directObservation: 'No seal chronology, ownership transfer record, dated colophon, or item-level provenance chain was observed; TAQ 1843 is not promoted.',
    canonicalTextObserved: false,
  },
  {
    observationId: 'obs.C.dated-witness-boundary',
    unit: 'C',
    evidenceId: 'ev.C.shanghai-bounded-official-search',
    sourceCategory: 'INSTITUTIONAL_METADATA',
    directObservation: 'The bounded Shanghai Library search returned no exact 報暉草堂 record and an unrelated 育新書局 result; a related anthology record did not supply the candidate date-bearing items or pages.',
    canonicalTextObserved: false,
    negativeBoundary: 'This is a bounded result-set observation, not a global absence claim.',
  },
  {
    observationId: 'obs.C.third-party-bibliographic-leads',
    unit: 'C',
    evidenceId: 'ev.C.1895-third-party-bibliographic-witness',
    sourceCategory: 'BIBLIOGRAPHIC_WITNESS',
    relatedEvidenceIds: ['ev.C.1895-holding-clue', 'ev.C.1923-third-party-bibliographic-witness'],
    directObservation: 'Third-party pages recite 1895 報暉草堂 and 1923 紹興育新書局 edition labels, but none supplies an institution/item ID plus physical description and target-page reproduction.',
    canonicalTextObserved: false,
    scopeBoundary: rawObservationPolicy,
  },
  {
    observationId: 'obs.D.waseda-seasonal-headings',
    unit: 'D',
    evidenceId: 'ev.D.waseda-official-scan',
    sourceCategory: 'DIRECT_OFFICIAL_SCAN',
    pages: [
      renderedImage(wasedaImageUrl(9), 9, '7f152ad95d282cf782cee51d75878d1c867212b59a4723e49ac553646349bc21', '正月甲木'),
      renderedImage(wasedaImageUrl(10), 10, 'd80e93fe6e23c1cc2045c1a3b9848e5e061c3688021444b417881b0bc6b38d7c', '二月甲木'),
      renderedImage(wasedaImageUrl(11), 11, 'd5087c81e2a6133992f5009a53e4c15694db099ec38c19548c61a7f8a2a438d6', '三月甲木'),
    ],
    directObservation: 'The institution-hosted scan visibly contains consecutive 正月甲木, 二月甲木, and 三月甲木 headings on rendered pages 9–11.',
    canonicalTextObserved: false,
    scopeBoundary: rawObservationPolicy,
  },
  {
    observationId: 'obs.D.preface-date-bounded-negative',
    unit: 'D',
    evidenceId: 'ev.D.preface-date-unresolved',
    sourceCategory: 'UNRESOLVED',
    pages: [
      renderedImage(wasedaImageUrl(2), 2, '7bb296744d28274def29bb0a3f224d21693f84c924514c5403d14d2aeb5c58da', '序 page'),
      renderedImage(wasedaImageUrl(3), 3, 'e0ed84a943196b49334db457e1fefd148b03bfab2768731c914367bc3799a0bf', '序 continuation'),
    ],
    directObservation: 'The opening 序 pages were visually inspected, but the exact 光緒十二年歲次丙戌孟秋之月楚南余春台序 phrase was not observed there.',
    canonicalTextObserved: false,
    negativeBoundary: 'The result is bounded to inspected opening pages and does not assert global absence from the full scan.',
  },
  {
    observationId: 'obs.E.gates-and-categories-typed',
    unit: 'E',
    evidenceId: 'ev.E.typed-boundary-contract',
    sourceCategory: 'INFERENCE',
    directObservation: 'Every source record carries exactly one requested sourceCategory; every claim carries the six typed gates and four independence axes; no category transition grants semantic authority or readiness.',
    canonicalTextObserved: false,
  },
])

const defaultGates = () => Object.fromEntries(GATE_KEYS.map(key => [key, 'unresolved']))
const defaultAxes = () => Object.fromEntries(INDEPENDENCE_AXES.map(axis => [axis, {
  state: 'unresolved',
  countedAsIndependent: false,
  sameLineageCandidate: false,
  missingEdges: [`${axis} independence evidence`],
}]))
const allNotApplicableAxes = () => Object.fromEntries(INDEPENDENCE_AXES.map(axis => [axis, {
  state: 'not_applicable',
  countedAsIndependent: false,
  sameLineageCandidate: false,
  missingEdges: [],
}]))
const observationBlocker = {
  blockerId: 'false.semantic-authority-for-bounded-observation',
  edge: 'semantic_authority',
  reason: 'A bounded record or page observation may be reported without semantic authority; the observation does not grant semantic authority.',
}
const makeClaim = ({ claimId, unit, candidateAssertion, status, evidenceRefs = [], gates = {}, axes = {}, falseBlockers = [observationBlocker], realBlockers = [], scopeCorrection, promotionTarget = 'none' }) => ({
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
    reason: 'This parent audit reports bounded evidence only; it does not grant semantic authority, interpretation readiness, or production activation.',
  },
})

const A_LINEAGE_BLOCKER = {
  blockerId: 'blocker.A.edition-lineage-and-semantic-corroboration',
  edge: 'L/S/I/P',
  reason: 'The Jangseogak item and NLC item/derivative provide bounded passage observations, but edition/textual lineage, semantic corroboration, interpretation readiness, and activation remain unresolved.',
}
const A_KYU_BLOCKER = {
  blockerId: 'blocker.A.kyujanggak-target-scan',
  edge: 'E/L/S/I/P',
  reason: 'Kyujanggak metadata names a candidate holding, but no actual 卷33 page bytes or target passage were inspected.',
}
const B_PROVENANCE_BLOCKER = {
  blockerId: 'blocker.B.seal-application-chronology',
  edge: 'H/E/L/I/P',
  reason: 'The seal block/metadata and Qin Enfu authority attribution do not establish seal application date, item ownership chronology, or textual lineage.',
}
const C_ITEM_BLOCKER = {
  blockerId: 'blocker.C.item-level-dated-witnesses',
  edge: 'H/E/L/S/I/P',
  reason: 'No exact 1895 or 1923 first-party item record, physical description, target scan, or edition-lineage comparison was obtained.',
}
const D_DATE_BLOCKER = {
  blockerId: 'blocker.D.preface-date-and-current-copy',
  edge: 'E/L/I/P',
  reason: 'The exact date phrase was not observed in the bounded opening-page inspection and the official record leaves place/publisher unknown; even a preface date would not date the current copy by itself.',
}

export function buildSajuGeminiWitnessDossierAdjudicationV2({ basisHead, predecessorReferences = {} } = {}) {
  const claims = [
    makeClaim({
      claimId: 'claim.A.jangseogak-vol33-target-passage',
      unit: 'A',
      candidateAssertion: 'The Jangseogak K3-437 scan directly shows 五行精紀卷第三十三 / 論大運 and the requested 甲子陽男 / 六十三時 / 六百三十日 / 一歲奇九月之大運起於丁丑 passage family.',
      status: 'partially_supported',
      evidenceRefs: ['ev.A.jangseogak-record', 'ev.A.jangseogak-official-scan', 'obs.A.jangseogak-vol33-heading-and-passage'],
      gates: { H: 'satisfied', E: 'satisfied', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
      axes: {
        'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] },
        'digital-derivation': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] },
      },
      realBlockers: [A_LINEAGE_BLOCKER],
      scopeCorrection: 'The direct scan establishes a bounded page observation for K3-437. It does not establish an undated/dated edition lineage or semantic authority.',
      promotionTarget: 'historical_observation_stability',
    }),
    makeClaim({
      claimId: 'claim.A.nlc-vol4-route-correction',
      unit: 'A',
      candidateAssertion: 'NLC bid 114503.0, not 114453.0, is the fourth-volume route whose public derivative contains 卷33.',
      status: 'supported',
      evidenceRefs: ['ev.A.nlc-official-record-volume-map', 'ev.A.nlc-vol3-route-rejected', 'ev.A.nlc-vol4-official-route', 'ev.A.nlc-vol4-derivative-scan', 'obs.A.nlc-vol4-vol33-heading-and-passage'],
      gates: { H: 'satisfied', E: 'satisfied', L: 'not_applicable', S: 'not_applicable', I: 'unresolved', P: 'unresolved' },
      axes: {
        'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] },
        'digital-derivation': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] },
      },
      realBlockers: [A_LINEAGE_BLOCKER],
      scopeCorrection: 'This is a route/volume identity correction. The derivative page remains a derivative and is not promoted to official-byte equality.',
    }),
    makeClaim({
      claimId: 'claim.A.second-physical-scan-not-textual-independence',
      unit: 'A',
      candidateAssertion: 'Jangseogak K3-437 is a second institutionally identified physical item with a direct scan supporting the same bounded passage family as NLC 06857, but this does not establish textual independence.',
      status: 'partially_supported',
      evidenceRefs: ['ev.A.jangseogak-record', 'ev.A.jangseogak-official-scan', 'ev.A.nlc-official-record-volume-map', 'ev.A.nlc-vol4-derivative-scan', 'obs.A.cross-scan-bounded-comparison'],
      gates: { H: 'satisfied', E: 'satisfied', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
      axes: {
        'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] },
        'digital-derivation': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] },
        'edition/textual-lineage': { state: 'unresolved', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: ['edition relationship and copying/recension history'] },
        'semantic-corroboration': { state: 'unresolved', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: ['independent semantic corroboration'] },
      },
      realBlockers: [A_LINEAGE_BLOCKER],
      scopeCorrection: 'Institutional difference is counted only as physical-item/digital-path evidence. It is not converted into edition or semantic independence.',
      promotionTarget: 'cross_lineage_stability',
    }),
    makeClaim({
      claimId: 'claim.A.kyujanggak-vol33-scan-access',
      unit: 'A',
      candidateAssertion: 'Kyujanggak 奎中1822-v.1-5 supplies an actual accessible 卷33 scan with the target passage.',
      status: 'unresolved',
      evidenceRefs: ['ev.A.kyujanggak-record-candidate', 'obs.A.kyujanggak-target-scan-unresolved'],
      gates: { H: 'satisfied', E: 'unresolved', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
      axes: { 'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] } },
      realBlockers: [A_KYU_BLOCKER],
      scopeCorrection: 'The record is retained as a physical-item candidate; no target page is admitted without actual scan bytes.',
      promotionTarget: 'historical_observation_stability',
    }),
    makeClaim({
      claimId: 'claim.B.gengcun-seal-provenance-candidate',
      unit: 'B',
      candidateAssertion: 'NCL 06599 / 耕寸集 has the recorded 石研齋/秦氏印 seal and a directly observed seal-impression block, supporting a provenance candidate only.',
      status: 'partially_supported',
      evidenceRefs: ['ev.B.ncl-gengcun-official-record', 'ev.B.ncl-gengcun-derivative-scan', 'obs.B.ncl-seal-block-and-metadata'],
      gates: { H: 'satisfied', E: 'satisfied', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
      axes: {
        'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] },
        'digital-derivation': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] },
      },
      realBlockers: [B_PROVENANCE_BLOCKER],
      scopeCorrection: 'Only the seal-presence/provenance-candidate layer is admitted. No item-level date or early textual-witness status follows.',
      promotionTarget: 'provenance_candidate',
    }),
    makeClaim({
      claimId: 'claim.B.qin-enfu-room-name-attribution',
      unit: 'B',
      candidateAssertion: 'The room name 石研齋 is attributed in an authority record to 秦恩復 (1760–1843).',
      status: 'supported',
      evidenceRefs: ['ev.B.qin-enfu-authority', 'obs.B.qin-enfu-attribution-boundary'],
      gates: { H: 'satisfied', E: 'satisfied', L: 'not_applicable', S: 'not_applicable', I: 'unresolved', P: 'unresolved' },
      axes: allNotApplicableAxes(),
      realBlockers: [B_PROVENANCE_BLOCKER],
      scopeCorrection: 'This is an authority/person attribution only; it is not ownership or seal-application evidence for NCL 06599.',
    }),
    makeClaim({
      claimId: 'claim.B.taq-1843-from-seal',
      unit: 'B',
      candidateAssertion: 'The NCL seal alone establishes a TAQ of 1843 for the item or its relevant text.',
      status: 'unsupported',
      evidenceRefs: ['ev.B.ncl-gengcun-official-record', 'ev.B.qin-enfu-authority', 'ev.B.seal-chronology-unresolved', 'obs.B.taq-1843-unresolved'],
      gates: { H: 'unresolved', E: 'unresolved', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
      axes: {
        'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: ['seal application chronology'] },
      },
      realBlockers: [B_PROVENANCE_BLOCKER],
      scopeCorrection: 'TAQ 1843 remains rejected unless seal application chronology or a dated provenance chain is independently established.',
      promotionTarget: 'lineage_specific_stability',
    }),
    makeClaim({
      claimId: 'claim.C.1895-bibliographic-witness-only',
      unit: 'C',
      candidateAssertion: '1895 報暉草堂 is currently a third-party bibliographic witness/lead, not an admitted item-level scan witness.',
      status: 'supported',
      evidenceRefs: ['ev.C.1895-third-party-bibliographic-witness', 'ev.C.1895-holding-clue', 'obs.C.third-party-bibliographic-leads'],
      gates: { H: 'satisfied', E: 'satisfied', L: 'not_applicable', S: 'not_applicable', I: 'unresolved', P: 'unresolved' },
      axes: allNotApplicableAxes(),
      realBlockers: [C_ITEM_BLOCKER],
      scopeCorrection: 'The date label is preserved as a bibliographic lead only; no institution, item ID, physical description, scan bytes, or page locator is promoted.',
    }),
    makeClaim({
      claimId: 'claim.C.1923-bibliographic-witness-only',
      unit: 'C',
      candidateAssertion: '1923 紹興育新書局 is currently a third-party bibliographic witness/lead, not an admitted item-level scan witness.',
      status: 'supported',
      evidenceRefs: ['ev.C.1923-third-party-bibliographic-witness', 'obs.C.third-party-bibliographic-leads'],
      gates: { H: 'satisfied', E: 'satisfied', L: 'not_applicable', S: 'not_applicable', I: 'unresolved', P: 'unresolved' },
      axes: allNotApplicableAxes(),
      realBlockers: [C_ITEM_BLOCKER],
      scopeCorrection: 'The date label is preserved as a bibliographic lead only; no institution, item ID, physical description, scan bytes, or page locator is promoted.',
    }),
    makeClaim({
      claimId: 'claim.C.1895-item-level-witness',
      unit: 'C',
      candidateAssertion: 'An actual 1895 報暉草堂 item-level catalog record and target-page reproduction were verified.',
      status: 'unresolved',
      evidenceRefs: ['ev.C.shanghai-bounded-official-search', 'ev.C.1895-third-party-bibliographic-witness', 'ev.C.item-level-witnesses-unresolved'],
      gates: { H: 'unresolved', E: 'unresolved', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
      axes: defaultAxes(),
      realBlockers: [C_ITEM_BLOCKER],
      scopeCorrection: 'Institutional bibliography, third-party recitation, and actual item-level scan are separate gates; only the first two lead categories are present.',
      promotionTarget: 'lineage_specific_stability',
    }),
    makeClaim({
      claimId: 'claim.C.1923-item-level-witness',
      unit: 'C',
      candidateAssertion: 'An actual 1923 紹興育新書局 item-level catalog record and target-page reproduction were verified.',
      status: 'unresolved',
      evidenceRefs: ['ev.C.shanghai-bounded-official-search', 'ev.C.1923-third-party-bibliographic-witness', 'ev.C.item-level-witnesses-unresolved'],
      gates: { H: 'unresolved', E: 'unresolved', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
      axes: defaultAxes(),
      realBlockers: [C_ITEM_BLOCKER],
      scopeCorrection: 'Institutional bibliography, third-party recitation, and actual item-level scan are separate gates; only the first two lead categories are present.',
      promotionTarget: 'lineage_specific_stability',
    }),
    makeClaim({
      claimId: 'claim.C.two-dated-witnesses-establish-two-lineages',
      unit: 'C',
      candidateAssertion: 'The 1895 and 1923 labels establish two independent physical items and two independent edition/textual lineages.',
      status: 'unsupported',
      evidenceRefs: ['ev.C.1895-third-party-bibliographic-witness', 'ev.C.1923-third-party-bibliographic-witness', 'ev.C.item-level-witnesses-unresolved'],
      gates: { H: 'unresolved', E: 'unresolved', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
      axes: defaultAxes(),
      realBlockers: [C_ITEM_BLOCKER],
      scopeCorrection: 'Two dates or two recitations do not establish two physical items, independent digital derivations, or textual-lineage independence.',
      promotionTarget: 'cross_lineage_stability',
    }),
    makeClaim({
      claimId: 'claim.D.waseda-seasonal-headings',
      unit: 'D',
      candidateAssertion: 'The official Waseda scan contains consecutive 正月甲木, 二月甲木, and 三月甲木 headings on pages 9–11.',
      status: 'supported',
      evidenceRefs: ['ev.D.waseda-record', 'ev.D.waseda-official-scan', 'obs.D.waseda-seasonal-headings'],
      gates: { H: 'satisfied', E: 'satisfied', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
      axes: {
        'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] },
        'digital-derivation': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] },
      },
      realBlockers: [D_DATE_BLOCKER],
      scopeCorrection: 'This is a bounded official-scan heading observation, not a dated-edition claim, word-for-word comparator, or semantic authority claim.',
      promotionTarget: 'historical_observation_stability',
    }),
    makeClaim({
      claimId: 'claim.D.preface-date',
      unit: 'D',
      candidateAssertion: 'The Waseda scan directly shows 光緒十二年歲次丙戌孟秋之月楚南余春台序.',
      status: 'unresolved',
      evidenceRefs: ['ev.D.waseda-official-scan', 'ev.D.preface-date-unresolved', 'obs.D.preface-date-bounded-negative'],
      gates: { H: 'satisfied', E: 'unresolved', L: 'unresolved', S: 'not_applicable', I: 'unresolved', P: 'unresolved' },
      axes: {
        'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] },
        'digital-derivation': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] },
      },
      realBlockers: [D_DATE_BLOCKER],
      scopeCorrection: 'The exact phrase was not observed in the inspected opening pages; it remains unresolved, not imported from the candidate packet.',
    }),
    makeClaim({
      claimId: 'claim.D.current-copy-1886',
      unit: 'D',
      candidateAssertion: 'The current Waseda copy is a confirmed 1886 or otherwise late-Qing printed witness.',
      status: 'unsupported',
      evidenceRefs: ['ev.D.waseda-record', 'ev.D.waseda-official-scan', 'ev.D.preface-date-unresolved'],
      gates: { H: 'satisfied', E: 'unresolved', L: 'unresolved', S: 'not_applicable', I: 'unresolved', P: 'unresolved' },
      axes: {
        'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] },
        'digital-derivation': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] },
      },
      realBlockers: [D_DATE_BLOCKER],
      scopeCorrection: 'The official imprint is unknown. A preface date, if found later, must remain separate from the current-copy/edition date.',
    }),
    makeClaim({
      claimId: 'claim.E.source-categories-and-gates-typed',
      unit: 'E',
      candidateAssertion: 'The parent audit preserves source category, H/E/L/S/I/P gate, and the four independence axes as separate typed fields.',
      status: 'supported',
      evidenceRefs: ['ev.E.typed-boundary-contract', 'obs.E.gates-and-categories-typed'],
      gates: { H: 'not_applicable', E: 'not_applicable', L: 'not_applicable', S: 'not_applicable', I: 'not_applicable', P: 'not_applicable' },
      axes: allNotApplicableAxes(),
      realBlockers: [{ blockerId: 'blocker.E.no-domain-promotion', edge: 'readiness/activation', reason: 'The type contract is structural and cannot grant semantic authority, interpretation availability, or production activation.' }],
      scopeCorrection: 'Typing is an audit control, not a truth oracle or readiness transition.',
    }),
    makeClaim({
      claimId: 'claim.E.gemini-all-units-resolved',
      unit: 'E',
      candidateAssertion: 'The Gemini candidate packet’s all-units-resolved conclusion and interpretation/production promotion are established.',
      status: 'unsupported',
      evidenceRefs: ['ev.A.kyujanggak-record-candidate', 'ev.B.seal-chronology-unresolved', 'ev.C.item-level-witnesses-unresolved', 'ev.D.preface-date-unresolved', 'ev.E.typed-boundary-contract'],
      gates: { H: 'unresolved', E: 'unresolved', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
      axes: defaultAxes(),
      falseBlockers: [{ blockerId: 'false.candidate-baseline-as-proof', edge: 'all-gates', reason: 'The candidate packet is untrusted input and its counts/conclusions are not parent verification.' }],
      realBlockers: [A_LINEAGE_BLOCKER, A_KYU_BLOCKER, B_PROVENANCE_BLOCKER, C_ITEM_BLOCKER, D_DATE_BLOCKER],
      scopeCorrection: 'Parent verification is fail-closed: no promotion-ready claims, no semantic authority, no availableForInterpretation, no implementation-safe grounding, and no activation.',
      promotionTarget: 'implementation_safe_grounding',
    }),
  ]

  const gateStateCounts = Object.fromEntries(GATE_KEYS.map(gate => [gate, Object.fromEntries(GATE_STATES.map(state => [state, claims.filter(claim => claim.gates[gate] === state).length]))]))
  const parentVerifiedClaimIds = claims.filter(claim => claim.status === 'supported').map(claim => claim.claimId)
  const statusCounts = Object.fromEntries(CLAIM_STATUSES.map(status => [status, claims.filter(claim => claim.status === status).length]))

  return {
    schemaVersion: SAJU_GEMINI_WITNESS_DOSSIER_V2_SCHEMA,
    version: SAJU_GEMINI_WITNESS_DOSSIER_V2_VERSION,
    basisHead,
    scope: {
      purpose: 'Parent-direct continuation audit for Gemini 3.7 Flash High v3 historical-witness claims Units A–E.',
      sourceOfTruth: 'Parent-observed institutional records, byte-identified official/derivative scans, and bounded visual page observations.',
      sourceCategories: [...SOURCE_CATEGORIES],
      gateKeys: [...GATE_KEYS],
      independenceAxes: [...INDEPENDENCE_AXES],
      forbiddenPromotion: ['canonical_text', 'semantic_authority', 'availableForInterpretation', 'implementation_safe_grounding', 'production_activation', 'activation'],
      ocrPolicy: 'OCR or transmitted web text may locate a page only; no OCR/text-web locator is canonical evidence.',
      textPolicy: 'Bounded visual transcriptions preserve observed variants and do not become canonical rekeyings.',
      provenancePolicy: 'Physical-item identity, digital derivation, edition/textual lineage, semantic corroboration, interpretation readiness, and activation are separate gates.',
    },
    candidatePacket: CANDIDATE_PACKET,
    externalEvidence: EXTERNAL_EVIDENCE,
    pageObservations: PAGE_OBSERVATIONS,
    claims,
    blockerLedger: {
      falseBlockers: [
        { blockerId: 'false.candidate-baseline-as-proof', status: 'not_evidence', note: 'Candidate packet counts and conclusions remain untrusted input.' },
        { blockerId: 'false.institution-difference-equals-textual-independence', status: 'not_evidence', note: 'Institutional difference can support distinct physical-item identity while edition/textual lineage remains unresolved.' },
        { blockerId: 'false.preface-date-equals-current-copy-date', status: 'not_evidence', note: 'A preface date, even if later observed, would not alone date the current copy or printing.' },
      ],
      realBlockers: [A_LINEAGE_BLOCKER, A_KYU_BLOCKER, B_PROVENANCE_BLOCKER, C_ITEM_BLOCKER, D_DATE_BLOCKER],
    },
    predecessorReferences,
    readinessOverlay: {
      reportedByCandidate: { trust: 'untrusted_candidate_baseline', allUnitsResolved: 'not_admitted' },
      parentVerified: {
        comparablePopulation: `${claims.length} parent-adjudicated assertions; candidate baseline counts are not numerically comparable.`,
        gateStateCounts,
        parentVerifiedClaimIds,
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
    },
    summary: {
      claimCount: claims.length,
      statusCounts,
      parentVerifiedClaimCount: parentVerifiedClaimIds.length,
      promotionReadyClaimCount: 0,
      supportedScope: [
        'Jangseogak K3-437 direct 卷33 / 論大運 passage-family observation',
        'NLC 114503.0 corrected fourth-volume route and derivative 卷33 observation',
        'NCL 06599 seal-presence/provenance-candidate boundary and Qin Enfu room-name attribution',
        '1895/1923 third-party bibliographic-witness-only labels',
        'Waseda official scan seasonal headings on pages 9–11',
        'typed source-category, gate, and independence-axis separation',
      ],
      unresolvedScope: [
        'Kyujanggak actual 卷33 scan and target passage',
        'A edition/textual lineage and semantic corroboration',
        'seal application chronology and TAQ 1843',
        '1895/1923 item-level records, scans, and target-page collation',
        'Waseda exact 1886 preface phrase and current-copy date',
        'interpretation readiness, semantic authority, implementation grounding, and activation',
      ],
      predecessorDelta: {
        predecessorSchema: 'saju-gemini-witness-dossier-adjudication-v1',
        directEvidenceBoundaryChanged: true,
        changes: [
          'Unit A now has a direct Jangseogak K3-437 scan and a corrected NLC 114503.0 derivative target; the old 114453.0 route is explicitly rejected.',
          'Unit A records the observed 立春 lead-in variation instead of normalizing the two scans to identical wording.',
          'Unit B seal metadata and derivative seal-block presence are admitted only as a provenance candidate; Qin Enfu attribution does not create a seal TAQ.',
          'Units C and D retain their item-level/date boundaries; Unit D headings are supported while the exact date phrase/current-copy date remain unresolved/unsupported.',
          'Unit E keeps all readiness and activation fields closed.',
        ],
      },
    },
  }
}

const isObject = value => Boolean(value && typeof value === 'object' && !Array.isArray(value))

export function checkSajuGeminiWitnessDossierAdjudicationV2(artifact) {
  const errors = []
  if (!isObject(artifact)) return ['artifact_shape_invalid']
  if (artifact.schemaVersion !== SAJU_GEMINI_WITNESS_DOSSIER_V2_SCHEMA) errors.push('schema_version')
  if (artifact.version !== SAJU_GEMINI_WITNESS_DOSSIER_V2_VERSION) errors.push('version')
  if (artifact.candidatePacket?.trustBoundary !== 'untrusted_candidate_only') errors.push('candidate_trust_boundary')
  if (artifact.candidatePacket?.importedAsCanonicalEvidence !== false) errors.push('candidate_import_boundary')
  if (artifact.candidatePacket?.importedConclusionFields?.length !== 0) errors.push('candidate_conclusion_import')
  if (JSON.stringify(artifact.scope?.sourceCategories) !== JSON.stringify(SOURCE_CATEGORIES)) errors.push('source_category_contract')
  if (JSON.stringify(artifact.scope?.gateKeys) !== JSON.stringify(GATE_KEYS)) errors.push('gate_contract')
  if (JSON.stringify(artifact.scope?.independenceAxes) !== JSON.stringify(INDEPENDENCE_AXES)) errors.push('independence_contract')
  if (!Array.isArray(artifact.externalEvidence) || artifact.externalEvidence.length < 20) errors.push('external_evidence_count')
  if (!Array.isArray(artifact.pageObservations) || artifact.pageObservations.length < 12) errors.push('page_observation_count')
  if (!Array.isArray(artifact.claims) || artifact.claims.length !== 17) errors.push('claim_count')

  const evidenceIds = new Set((artifact.externalEvidence || []).map(item => item.evidenceId))
  const observationIds = new Set((artifact.pageObservations || []).map(item => item.observationId))
  for (const evidence of artifact.externalEvidence || []) {
    if (!SOURCE_CATEGORIES.includes(evidence.sourceCategory)) errors.push(`evidence:${evidence.evidenceId}:source_category`)
    if (evidence.canonicalTextAdmitted === true) errors.push(`evidence:${evidence.evidenceId}:canonical_text_admitted`)
  }
  for (const observation of artifact.pageObservations || []) {
    if (!SOURCE_CATEGORIES.includes(observation.sourceCategory)) errors.push(`observation:${observation.observationId}:source_category`)
    if (observation.canonicalTextObserved === true) errors.push(`observation:${observation.observationId}:canonical_text_observed`)
    if (observation.evidenceId && !evidenceIds.has(observation.evidenceId)) errors.push(`observation:${observation.observationId}:evidence_ref`)
  }
  for (const claim of artifact.claims || []) {
    if (!UNITS.includes(claim.unit)) errors.push(`claim:${claim.claimId}:unit`)
    if (!CLAIM_STATUSES.includes(claim.status)) errors.push(`claim:${claim.claimId}:status`)
    for (const gate of GATE_KEYS) if (!GATE_STATES.includes(claim.gates?.[gate])) errors.push(`claim:${claim.claimId}:gate:${gate}`)
    for (const axis of INDEPENDENCE_AXES) {
      const axisEvidence = claim.independence?.[axis]
      if (!isObject(axisEvidence)) errors.push(`claim:${claim.claimId}:axis:${axis}:missing`)
      if (axisEvidence?.countedAsIndependent === true) errors.push(`claim:${claim.claimId}:axis:${axis}:counted_as_independent`)
    }
    if (claim.candidateEvidenceAccepted !== false) errors.push(`claim:${claim.claimId}:candidate_evidence_accepted`)
    if (claim.promotion?.ready !== false || claim.promotion?.status !== 'blocked') errors.push(`claim:${claim.claimId}:promotion_not_blocked`)
    for (const evidenceRef of claim.parentVerifiedEvidenceRefs || []) if (!evidenceIds.has(evidenceRef) && !observationIds.has(evidenceRef)) errors.push(`claim:${claim.claimId}:evidence_ref:${evidenceRef}`)
  }

  const find = claimId => artifact.claims?.find(claim => claim.claimId === claimId)
  const expectedStatuses = {
    'claim.A.jangseogak-vol33-target-passage': 'partially_supported',
    'claim.A.nlc-vol4-route-correction': 'supported',
    'claim.A.second-physical-scan-not-textual-independence': 'partially_supported',
    'claim.A.kyujanggak-vol33-scan-access': 'unresolved',
    'claim.B.gengcun-seal-provenance-candidate': 'partially_supported',
    'claim.B.qin-enfu-room-name-attribution': 'supported',
    'claim.B.taq-1843-from-seal': 'unsupported',
    'claim.C.1895-bibliographic-witness-only': 'supported',
    'claim.C.1923-bibliographic-witness-only': 'supported',
    'claim.C.1895-item-level-witness': 'unresolved',
    'claim.C.1923-item-level-witness': 'unresolved',
    'claim.C.two-dated-witnesses-establish-two-lineages': 'unsupported',
    'claim.D.waseda-seasonal-headings': 'supported',
    'claim.D.preface-date': 'unresolved',
    'claim.D.current-copy-1886': 'unsupported',
    'claim.E.source-categories-and-gates-typed': 'supported',
    'claim.E.gemini-all-units-resolved': 'unsupported',
  }
  for (const [claimId, expected] of Object.entries(expectedStatuses)) if (find(claimId)?.status !== expected) errors.push(`status_boundary:${claimId}`)

  const comparison = artifact.pageObservations?.find(item => item.observationId === 'obs.A.cross-scan-bounded-comparison')
  if (comparison?.sourceCategory !== 'INFERENCE' || comparison?.independenceAssessment?.editionTextualLineage !== 'unresolved') errors.push('A_lineage_boundary')
  const nlc = artifact.externalEvidence?.find(item => item.evidenceId === 'ev.A.nlc-vol4-derivative-scan')
  if (nlc?.sourceCategory !== 'DIRECT_DERIVATIVE_SCAN' || nlc?.physicalVolume !== '第4卷; Commons description: 卷25–33') errors.push('A_NLC_derivative_boundary')
  const kyujanggak = find('claim.A.kyujanggak-vol33-scan-access')
  if (kyujanggak?.status !== 'unresolved') errors.push('A_Kyujanggak_boundary')
  const taq = find('claim.B.taq-1843-from-seal')
  if (taq?.status !== 'unsupported') errors.push('B_TAQ_boundary')
  const cLineage = find('claim.C.two-dated-witnesses-establish-two-lineages')
  if (cLineage?.status !== 'unsupported') errors.push('C_lineage_boundary')
  const dDate = find('claim.D.preface-date')
  if (dDate?.status !== 'unresolved') errors.push('D_preface_boundary')
  const dCopy = find('claim.D.current-copy-1886')
  if (dCopy?.status !== 'unsupported') errors.push('D_current_copy_boundary')
  const overall = find('claim.E.gemini-all-units-resolved')
  if (overall?.status !== 'unsupported') errors.push('overall_overclaim_not_rejected')

  const parent = artifact.readinessOverlay?.parentVerified
  if (parent?.promotionReadyClaimIds?.length !== 0) errors.push('readiness_promotion')
  if (parent?.stableClaimPromotionCount !== 0) errors.push('readiness_stable_count')
  if (parent?.availableForInterpretation !== false) errors.push('readiness_available')
  if (parent?.semanticAuthority !== 'not_established') errors.push('readiness_semantic_authority')
  if (parent?.implementationSafeGrounding !== 'not_established') errors.push('readiness_implementation')
  if (parent?.productionActivation !== 'blocked') errors.push('readiness_activation')
  if (artifact.promotion?.ready !== false || artifact.promotion?.status !== 'blocked') errors.push('promotion_not_blocked')
  if (artifact.promotion?.stableClaimPromotionCount !== 0 || artifact.promotion?.semanticAuthorityChanged !== false || artifact.promotion?.productionChanged !== false || artifact.promotion?.interpretationAvailable !== false) errors.push('promotion_side_effect')
  return [...new Set(errors)].sort()
}

export const EXTERNAL_SOURCE_URLS = Object.freeze({
  jsgRecordUrl,
  jsgPdfUrl,
  kyujanggakRecordUrl,
  nlcRecordUrl,
  nlcVol3OpenUrl,
  nlcVol4OpenUrl,
  nlcVol4CommonsPageUrl,
  nlcVol4CommonsPdfUrl,
  nclGengcunRecordUrl,
  nclGengcunCommonsPageUrl,
  nclGengcunCommonsPdfUrl,
  qinEnfuAuthorityUrl,
  baohuicaotangBibliographicUrl,
  yuxinBibliographicUrl,
  baohuicaotangHoldingClueUrl,
  wasedaRecordUrl,
  wasedaPdfUrl,
})

export const candidatePacketByteSha256 = value => sha256(value)
