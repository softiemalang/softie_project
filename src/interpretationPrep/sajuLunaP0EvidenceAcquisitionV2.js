import { createHash } from 'node:crypto'

export const SAJU_LUNA_P0_SCHEMA = 'saju-luna-p0-evidence-acquisition-adjudication-v2'
export const SAJU_LUNA_P0_VERSION = '2.0.0'
export const GATE_KEYS = Object.freeze(['H', 'E', 'L', 'S', 'I', 'P'])
export const GATE_STATES = Object.freeze(['satisfied', 'unresolved', 'conflicted', 'not_applicable'])
export const CLAIM_STATUSES = Object.freeze(['supported', 'partially_supported', 'unsupported', 'unresolved'])
export const UNITS = Object.freeze(['P0-A', 'P0-B', 'P0-C', 'P0-D', 'P0-E'])
export const SOURCE_LAYERS = Object.freeze([
  'DIRECT_OFFICIAL_RECORD',
  'DIRECT_OFFICIAL_SCAN',
  'DIRECT_DERIVATIVE_SCAN',
  'INSTITUTIONAL_METADATA',
  'SECONDARY_LOCATOR',
  'PARENT_INFERENCE',
  'CANDIDATE_ASSERTION',
])
export const INDEPENDENCE_AXES = Object.freeze([
  'physical-item',
  'digital-derivation',
  'edition/textual-lineage',
  'semantic-corroboration',
])

const sha256 = value => createHash('sha256').update(value).digest('hex')

const candidatePacketPath = '/Users/softie/.gemini/antigravity-cli/brain/ebb37c1a-b791-4d55-92c3-0d4022511694/luna-p0-evidence-packet-v2.md'
const candidateMatrixPath = '/Users/softie/.gemini/antigravity-cli/brain/ebb37c1a-b791-4d55-92c3-0d4022511694/luna-p0-evidence-matrix-v2.json'
const nclRecordUrl = 'https://rbook.ncl.edu.tw/NCLSearch/Search/SearchDetail?item=00ccfe6380184da28912a57393deb2d7fDI2NTQ0NQ2.PBlfBdELN3au83ZWddAblOP5Y3FBX8h5SLzXyf79aB4_&image=1&page=1030&SourceID=1&HasImage='
const nclCommonsPageUrl = 'https://commons.wikimedia.org/wiki/File:NCL-06599_%E8%80%95%E5%AF%B8%E9%9B%86.pdf'
const nclCommonsApiUrl = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url%7Csize%7Csha1%7Cmime%7Cextmetadata&titles=File:NCL-06599_%E8%80%95%E5%AF%B8%E9%9B%86.pdf'
const nclCommonsPdfUrl = 'https://upload.wikimedia.org/wikipedia/commons/9/95/NCL-06599_%E8%80%95%E5%AF%B8%E9%9B%86.pdf'
const nlcRecordUrl = 'http://read.nlc.cn/allSearch/searchDetail?searchType=24&showType=1&indexName=data_892&fid=411999013122'
const nlcVol3OpenUrl = 'http://read.nlc.cn/OutOpenBook/OpenObjectBook?aid=892&bid=114453.0'
const nlcVol4OpenUrl = 'http://read.nlc.cn/OutOpenBook/OpenObjectBook?aid=892&bid=114503.0'
const nlcVol3CommonsPageUrl = 'https://commons.wikimedia.org/wiki/File:NLC892-411999013122-114453_%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80_%E7%AC%AC3%E5%86%8A.pdf'
const nlcVol4CommonsPageUrl = 'https://commons.wikimedia.org/wiki/File:NLC892-411999013122-114503_%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80_%E7%AC%AC4%E5%86%8A.pdf'
const nlcVol4CommonsApiUrl = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url%7Csize%7Csha1%7Cmime%7Cextmetadata&titles=File:NLC892-411999013122-114503_%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80_%E7%AC%AC4%E5%86%8A.pdf'
const nlcVol4CommonsPdfUrl = 'https://upload.wikimedia.org/wikipedia/commons/a/a0/NLC892-411999013122-114503_%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80_%E7%AC%AC4%E5%86%8A.pdf'
const ctextDayunUrl = 'https://ctext.org/wiki.pl?chapter=181298&if=gb'
const wasedaRecordUrl = 'https://www.wul.waseda.ac.jp/kotenseki/html/bunko19/bunko19_f0111/index.html'
const wasedaPdfUrl = 'https://archive.wul.waseda.ac.jp/kosho/bunko19/bunko19_f0111/bunko19_f0111.pdf'
const wasedaImageUrl = page => `https://archive.wul.waseda.ac.jp/kosho/bunko19/bunko19_f0111/bunko19_f0111_p${String(page).padStart(4, '0')}.jpg`
const princetonRecordUrl = 'https://catalog.princeton.edu/catalog/SCSB-4603974.json'
const princetonHtmlUrl = 'https://catalog.princeton.edu/catalog/SCSB-4603974'
const shanghaiSearchUrl = term => `https://vufind.library.sh.cn/api/v1/search?lookfor=${encodeURIComponent(term)}`

export const CANDIDATE_PACKET = Object.freeze({
  path: candidatePacketPath,
  byteLength: 15304,
  byteSha256: '1742624e80cd9768c46a43b3e95a1ac278abd382e8f01e0c7f3030aa70d32a70',
  matrixPath: candidateMatrixPath,
  matrixByteLength: 8321,
  matrixByteSha256: '12f09cb9fdc697c542c7f89d8d6e3146a54f71368893cdccfcf708fc8b11e5b5',
  schemaVersion: '2.0.0',
  trustBoundary: 'untrusted_candidate_only',
  importedAsCanonicalEvidence: false,
  importedConclusionFields: [],
})

const derivativePolicy = 'The public PDF is a traceable digital derivative/mirror of an institutional item; it is not the physical item, is not official-byte equality, and is not an independent textual lineage.'
const rawObservationPolicy = 'A visible page, heading, or bounded visual transcription is admitted only at the stated locator and source-layer scope; it does not become canonical text or semantic authority.'

export const EXTERNAL_EVIDENCE = Object.freeze([
  {
    evidenceId: 'ev.candidate.packet-v2',
    sourceLayer: 'CANDIDATE_ASSERTION',
    status: 'untrusted_candidate_only',
    url: candidatePacketPath,
    byteLength: 15304,
    byteSha256: CANDIDATE_PACKET.byteSha256,
    canonicalTextAdmitted: false,
    scopeBoundary: 'Candidate packet is a read-only lead. Its DIRECT_OBSERVATION labels, verdicts, counts, and completion marker are not parent evidence.',
  },
  {
    evidenceId: 'ev.candidate.matrix-v2',
    sourceLayer: 'CANDIDATE_ASSERTION',
    status: 'untrusted_candidate_only',
    url: candidateMatrixPath,
    byteLength: 8321,
    byteSha256: CANDIDATE_PACKET.matrixByteSha256,
    canonicalTextAdmitted: false,
    scopeBoundary: 'Matrix is used only to define candidate assertions and requested locators; no candidate gate or status is imported.',
  },
  {
    evidenceId: 'ev.ncl.a.official-record',
    sourceLayer: 'DIRECT_OFFICIAL_RECORD',
    status: 'parent_verified',
    url: nclRecordUrl,
    downloadedByteLength: 28748,
    downloadedByteSha256: 'dc34b18256fdec0185df30b63034ee447286759862c7dd78aff4168f41e9643f',
    observedFields: ['耕寸集不分卷', '306.5 06599', '善本书号/06599', 'rarecatx0441810', '國家圖書館'],
    canonicalTextAdmitted: false,
    scopeBoundary: 'Official catalog identity only. The current viewer path exposed a puzzle-CAPTCHA access boundary; no official folio bytes are admitted.',
  },
  {
    evidenceId: 'ev.ncl.a.viewer-boundary',
    sourceLayer: 'DIRECT_OFFICIAL_RECORD',
    status: 'parent_verified_blocker',
    url: nclRecordUrl,
    accessStatus: 'catalog_record_only_viewer_puzzle_captcha_gated',
    canonicalTextAdmitted: false,
    scopeBoundary: 'No official page, date, banxin, seal, or target passage is promoted from this route.',
  },
  {
    evidenceId: 'ev.ncl.a.commons-metadata',
    sourceLayer: 'INSTITUTIONAL_METADATA',
    status: 'parent_verified_metadata',
    url: nclCommonsPageUrl,
    apiUrl: nclCommonsApiUrl,
    byteLength: 22371107,
    byteSha256: '8d6a42e1a6aa5675f978256349c9fcc145550a1c29c3947c425d3f611bfb27a',
    sourceSha1: 'bcea42065da1e9c8978a96f5c741f6250953e0da',
    pageCount: 103,
    observedFields: ['清敬一堂鈔本', '線裝', '1冊', '8行20字', '雙欄', '版心白口', '單魚尾', '敬一堂藏書', '國立中央圖書館收藏', '石研齋/秦氏印'],
    canonicalTextAdmitted: false,
    scopeBoundary: 'Commons/NCL-attributed metadata and file identity; it is not proof that the official NCL record has exposed identical PDF bytes.',
  },
  {
    evidenceId: 'ev.ncl.a.commons-scan',
    sourceLayer: 'DIRECT_DERIVATIVE_SCAN',
    status: 'parent_verified_page_observation',
    url: nclCommonsPdfUrl,
    pageCount: 103,
    byteLength: 22371107,
    byteSha256: '8d6a42e1a6aa5675f978256349c9fcc145550a1c29c3947c425d3f611bfb27a',
    sourceSha1: 'bcea42065da1e9c8978a96f5c741f6250953e0da',
    canonicalTextAdmitted: false,
    scopeBoundary: derivativePolicy,
  },
  {
    evidenceId: 'ev.nlc.b.official-record',
    sourceLayer: 'DIRECT_OFFICIAL_RECORD',
    status: 'parent_verified',
    url: nlcRecordUrl,
    downloadedByteLength: 27408,
    downloadedByteSha256: '2839ef69fef430ec43d6a17d22a21737e3205a5a463ce669f0841a5bfbb0ce2b',
    observedFields: ['五行精紀', '(宋)廖中撰', '清[1644-1911]', '善本书号06857', '抄本', '10行24字，黑口，左右雙邊', '存33卷：1～33'],
    volumeMap: { '114453.0': '第3卷', '114503.0': '第4卷' },
    canonicalTextAdmitted: false,
    scopeBoundary: 'Official record and volume map. The official route confirms identity/access metadata, not the derivative scan’s page wording.',
  },
  {
    evidenceId: 'ev.nlc.b.vol3-derivative-scan',
    sourceLayer: 'DIRECT_DERIVATIVE_SCAN',
    status: 'parent_verified_negative_for_candidate_vol33',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/NLC892-411999013122-114453_%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80_%E7%AC%AC3%E5%86%8A.pdf',
    pageCount: 110,
    byteLength: 37007952,
    byteSha256: 'e88387495032048b71d11196ee59861ad1bfeee4c7ca5ee80fd9686eb9d37d04',
    sourceSha1: '8a70c35c5a20a9fb68108615f0421e354ea145d4',
    physicalVolume: '第3卷; Commons description: 卷16–24',
    canonicalTextAdmitted: false,
    scopeBoundary: derivativePolicy,
  },
  {
    evidenceId: 'ev.nlc.b.vol4-official-route',
    sourceLayer: 'DIRECT_OFFICIAL_RECORD',
    status: 'parent_verified_access_boundary',
    url: nlcVol4OpenUrl,
    downloadedByteLength: 14630,
    downloadedByteSha256: '6a206e76de945ef1858504d760cce4815f2e2f8e9d1dcff7db918f40169f8a71',
    bid: '114503.0',
    officialPdfPath: 'data09/sbgj_shanbenguji/20151221_01szsb4171/duixiang/SBGJ04096_00004/SBGJ04096/00004/SBGJ04096_00004.pdf',
    canonicalTextAdmitted: false,
    scopeBoundary: 'Official fourth-volume route is identified and permission-limited; page observations below come from the separately identified public derivative.',
  },
  {
    evidenceId: 'ev.nlc.b.vol4-derivative-scan',
    sourceLayer: 'DIRECT_DERIVATIVE_SCAN',
    status: 'parent_verified_page_observation',
    url: nlcVol4CommonsPdfUrl,
    pageUrl: nlcVol4CommonsPageUrl,
    apiUrl: nlcVol4CommonsApiUrl,
    pageCount: 114,
    byteLength: 38628523,
    byteSha256: '6519fbdc0fa25272bf6aae0fdac8c73107c0f6b852a1b0beebc655344ec2812d',
    sourceSha1: '96da51a6d895469723d31694d45ef438643d7aab',
    physicalVolume: '第4卷; Commons description: 卷25–33',
    canonicalTextAdmitted: false,
    scopeBoundary: derivativePolicy,
  },
  {
    evidenceId: 'ev.ctext.b.locator',
    sourceLayer: 'SECONDARY_LOCATOR',
    status: 'locator_only',
    url: ctextDayunUrl,
    canonicalTextAdmitted: false,
    scopeBoundary: 'Ctext can locate a transmitted wording but cannot substitute for the NLC institutional scan or establish lineage.',
  },
  {
    evidenceId: 'ev.c.shanghai.official-api-search',
    sourceLayer: 'DIRECT_OFFICIAL_RECORD',
    status: 'parent_verified_bounded_search',
    url: 'https://vufind.library.sh.cn/',
    queries: [
      { term: '秘本子平真詮', url: shanghaiSearchUrl('秘本子平真詮'), resultCount: 1, returnedId: '3e8bd9b5-3372-4593-8e6d-f0433772ea58', returnedTitle: '四库存目子平汇刊 2 秘本子平真诠', byteSha256: 'c13972c2096ea652c9fbe03dd437b90723c654f3f4c525e470ca29350397af23' },
      { term: '報暉草堂', url: shanghaiSearchUrl('報暉草堂'), resultCount: 0, byteSha256: 'cfec6183da3a6935abb54c745efa8267ca2f44d128a71c1f10aa989b1fbbe944' },
      { term: '育新書局', url: shanghaiSearchUrl('育新書局'), resultCount: 1, returnedId: '24f7d119-b400-4258-8e11-eab29e1db958', returnedTitle: '重修金华丛书 14', byteSha256: 'af718539e0eafbcbcf68df6ef2324223d81b717cbf35c651de7ef467ab298aad' },
    ],
    canonicalTextAdmitted: false,
    scopeBoundary: 'The bounded API results did not expose the candidate’s 1895/1923 date-bearing records, holdings, or target pages. This is not a proof that no such record exists.',
  },
  {
    evidenceId: 'ev.waseda.d.official-record',
    sourceLayer: 'DIRECT_OFFICIAL_RECORD',
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
    canonicalTextAdmitted: false,
    scopeBoundary: 'Official record identity and unknown imprint. A preface date is not a current-copy date.',
  },
  {
    evidenceId: 'ev.waseda.d.official-scan',
    sourceLayer: 'DIRECT_OFFICIAL_SCAN',
    status: 'parent_verified_byte_identity',
    url: wasedaPdfUrl,
    pageCount: 108,
    byteLength: 82323986,
    byteSha256: '123ce84b44bd20ecfdd6538bffc413a5e3948598315cd99f857a5c985c7257ae',
    canonicalTextAdmitted: false,
    scopeBoundary: 'Institution-hosted scan bytes and bounded page observations; no semantic authority or cross-edition identity is inferred.',
  },
  {
    evidenceId: 'ev.princeton.e.official-record',
    sourceLayer: 'DIRECT_OFFICIAL_RECORD',
    status: 'parent_verified_metadata_only',
    url: princetonRecordUrl,
    htmlUrl: princetonHtmlUrl,
    downloadedByteLength: 2854,
    downloadedByteSha256: 'a1804f517b1f1a77e37ef6a4de31defb253803b33eb8ea3a85a5acbcb923768e',
    observedFields: ['SCSB-4603974', '徐升', '上海 : 春明書局, 民國26 [1937]', '286 pages ; 19 cm', '1739 2920', 'CU51356996', 'OCLC 502860307', 'ReCAP'],
    digitalObjectField: 'not_present_in_verified_JSON_record',
    canonicalTextAdmitted: false,
    scopeBoundary: 'Official bibliographic/holding metadata only. No page text or edition-lineage conclusion follows from missing public scan data.',
  },
])

const renderedDerivative = (evidenceId, page, byteSha256, printedSection) => ({
  evidenceId,
  sourceLayer: 'DIRECT_DERIVATIVE_SCAN',
  renderedPdfPage: page,
  renderedImageByteSha256: byteSha256,
  printedSection,
  canonicalTextObserved: false,
  observationMode: 'direct_visual_review_of_rendered_page',
})

const renderedWaseda = (page, byteSha256, printedSection) => ({
  evidenceId: 'ev.waseda.d.official-scan',
  sourceLayer: 'DIRECT_OFFICIAL_SCAN',
  renderedPdfPage: page,
  imageUrl: wasedaImageUrl(page),
  renderedImageByteSha256: byteSha256,
  printedSection,
  canonicalTextObserved: false,
  observationMode: 'direct_visual_review_of_institution_hosted_page',
})

export const PAGE_OBSERVATIONS = Object.freeze([
  {
    observationId: 'obs.P0-A.official-record-identity',
    unit: 'P0-A',
    evidenceId: 'ev.ncl.a.official-record',
    sourceLayer: 'DIRECT_OFFICIAL_RECORD',
    observationKind: 'institutional_record_identity',
    directObservation: 'The official NCL record identifies 耕寸集不分卷 with call number 306.5 06599, book number 06599, and registration rarecatx0441810.',
    pageBytesObserved: false,
    canonicalTextObserved: false,
  },
  {
    observationId: 'obs.P0-A.commons-metadata-layer',
    unit: 'P0-A',
    evidenceId: 'ev.ncl.a.commons-metadata',
    sourceLayer: 'INSTITUTIONAL_METADATA',
    observationKind: 'derivative_file_metadata',
    directObservation: 'The public NCL-attributed Commons file records 清敬一堂鈔本, one bound volume, 8行20字, and the listed seals/版心 metadata. These are derivative metadata fields, not an official NCL page observation.',
    pageBytesObserved: false,
    canonicalTextObserved: false,
    datingBoundary: '清 and 敬一堂 are broad metadata/attribution clues; neither is an exact pre-1776 copy date.',
  },
  {
    observationId: 'obs.P0-A.yongshen.corrected-locator',
    unit: 'P0-A',
    evidenceId: 'ev.ncl.a.commons-scan',
    sourceLayer: 'DIRECT_DERIVATIVE_SCAN',
    page: renderedDerivative('ev.ncl.a.commons-scan', 16, 'f117c5aea5521848d3ed474d7b0a2e54f5058774c3ce0ae74fa63702f22a2dd2', '論用神'),
    directObservation: 'Rendered PDF page 16 visibly carries 論用神 and the incipit 八字用神，專求月令，以日干配月令地支，而生剋不同，格局分焉。',
    candidateLocatorCorrection: 'The candidate PDF pp.4–7 locator is not the target heading in this derivative PDF; the bounded corrected locator is p.16.',
    pageBytesObserved: true,
    canonicalTextObserved: false,
  },
  {
    observationId: 'obs.P0-A.xiangshen.corrected-locator',
    unit: 'P0-A',
    evidenceId: 'ev.ncl.a.commons-scan',
    sourceLayer: 'DIRECT_DERIVATIVE_SCAN',
    pages: [
      renderedDerivative('ev.ncl.a.commons-scan', 29, 'a62b07405940548ce32b6b8837fe72459fb6b64d4005d1ffac98d639e3271ba9', '論相神緊要'),
      renderedDerivative('ev.ncl.a.commons-scan', 30, '108465b4bed66eadf10d6ba7b7084ee68e1a61dc5f3750e7cb878ef767d34936', '論相神緊要 continuation'),
    ],
    directObservation: 'Rendered PDF pages 29–30 visibly show 論相神緊要, 輔我用神者是也, and the role clause 財旺生官，則財為用，官為相. Candidate pp.27–30 is overbroad but contains this corrected p.29–30 scope.',
    pageBytesObserved: true,
    canonicalTextObserved: false,
  },
  {
    observationId: 'obs.P0-A.xingyun.corrected-locator',
    unit: 'P0-A',
    evidenceId: 'ev.ncl.a.commons-scan',
    sourceLayer: 'DIRECT_DERIVATIVE_SCAN',
    pages: [
      renderedDerivative('ev.ncl.a.commons-scan', 47, 'c53e68b8dbda707440ee5e8f0a45edcb3c4a5e972ace873beedfcc9977a7b082', '論行運喜忌'),
      renderedDerivative('ev.ncl.a.commons-scan', 48, '780facf5cbf65c3bce76334ebad211599f7325cb62abf7baec6d77767801aa6b', '論行運喜忌 continuation'),
      renderedDerivative('ev.ncl.a.commons-scan', 49, '5775a57d78ddd258e13f685658dad7877587c2dcb514f1182d2e857e4cc48956', '論行運喜忌 continuation'),
    ],
    directObservation: 'The target 行運 section begins at rendered PDF page 47 as 論行運喜忌 and continues on pages 48–49. Candidate pp.39–44 instead show adjacent sections such as 論星辰無關格局, 論宮分用神配六親, 論外格用舍, and 論妻子.',
    pageBytesObserved: true,
    canonicalTextObserved: false,
  },
  {
    observationId: 'obs.P0-A.early-date-not-established',
    unit: 'P0-A',
    evidenceId: 'ev.ncl.a.commons-metadata',
    sourceLayer: 'PARENT_INFERENCE',
    observationKind: 'dating_boundary',
    directObservation: 'No exact reign-year, colophon, or date-bearing page was admitted. 清/敬一堂 metadata and a banxin/hall attribution, even if correct at metadata scope, do not establish a pre-1776 copy date or early textual witness.',
    pageBytesObserved: false,
    canonicalTextObserved: false,
  },
  {
    observationId: 'obs.P0-B.volume-route-correction',
    unit: 'P0-B',
    evidenceId: 'ev.nlc.b.official-record',
    sourceLayer: 'DIRECT_OFFICIAL_RECORD',
    observationKind: 'official_volume_map',
    directObservation: 'The NLC record maps bid 114453.0 to 第3卷 and bid 114503.0 to 第4卷. The candidate’s use of 114453.0 as 卷33 is therefore a volume-route error.',
    pageBytesObserved: false,
    canonicalTextObserved: false,
  },
  {
    observationId: 'obs.P0-B.vol3-not-vol33',
    unit: 'P0-B',
    evidenceId: 'ev.nlc.b.vol3-derivative-scan',
    sourceLayer: 'DIRECT_DERIVATIVE_SCAN',
    observationKind: 'bounded_negative_observation',
    locator: { renderedPdfPagesInspected: '86–110', physicalVolume: '第3卷', volumeContents: '卷16–24' },
    directObservation: 'The 114453.0 derivative volume contains 卷23 and 卷24 pages in the inspected end range; it is not the 卷33 target volume.',
    pageBytesObserved: true,
    canonicalTextObserved: false,
  },
  {
    observationId: 'obs.P0-B.vol33.corrected-volume',
    unit: 'P0-B',
    evidenceId: 'ev.nlc.b.vol4-derivative-scan',
    sourceLayer: 'DIRECT_DERIVATIVE_SCAN',
    locator: { renderedPdfPage: 105, physicalVolume: '第4卷', printedWorkSection: '五行精紀卷第三十三 / 大運' },
    page: renderedDerivative('ev.nlc.b.vol4-derivative-scan', 105, 'c849c9198deb8dcbec0a3c8b15fb12ad9c883352715bba25acd5d595a6036148', '五行精紀卷第三十三 / 大運'),
    directObservation: 'The corrected 114503.0 derivative volume visibly carries 五行精紀卷第三十三 and the 大運 section at rendered page 105.',
    pageBytesObserved: true,
    canonicalTextObserved: false,
  },
  {
    observationId: 'obs.P0-B.six-stage-chain',
    unit: 'P0-B',
    evidenceId: 'ev.nlc.b.vol4-derivative-scan',
    sourceLayer: 'DIRECT_DERIVATIVE_SCAN',
    pages: [
      renderedDerivative('ev.nlc.b.vol4-derivative-scan', 105, 'c849c9198deb8dcbec0a3c8b15fb12ad9c883352715bba25acd5d595a6036148', '大運 rule passage'),
      renderedDerivative('ev.nlc.b.vol4-derivative-scan', 106, 'f26eb18c01b5627ade6f062dfe5e44c9695173babf3a1f5bae9cf6b5fc97850c', '大運 rule passage continuation'),
    ],
    contiguous: true,
    verbatimPolicy: 'Bounded visual transcription with modern punctuation only for readability; not a canonical rekeying.',
    verbatimFragments: [
      { stage: 1, text: '運行則一辰十歲', arithmeticRestatement: '一辰 → 十年' },
      { stage: 2, text: '折除乃三日為年', arithmeticRestatement: '三日 → 一年' },
      { stage: 3, text: '凡三日有三十六時', arithmeticRestatement: '三日 → 三十六時' },
      { stage: 4, text: '乃見三百六十日，為一歲之數', arithmeticRestatement: '三十六時 → 三百六十日 → 一歲' },
      { stage: 5, text: '一日十二時，得一百二十日，為四箇月之數', arithmeticRestatement: '十二時 → 一百二十日 → 四箇月' },
      { stage: 6, text: '一時辰得十日之數', arithmeticRestatement: '一時 → 十日' },
    ],
    surroundingText: 'The adjacent month/day background passage is also visible; the six rows above are the operational chain, not six independent witnesses.',
    directObservation: 'Pages 105–106 provide one contiguous derivative-scan passage for the rule family. No source-layer change is made from direct derivative text to official scan or semantic authority.',
    pageBytesObserved: true,
    canonicalTextObserved: false,
  },
  {
    observationId: 'obs.P0-B.worked-example',
    unit: 'P0-B',
    evidenceId: 'ev.nlc.b.vol4-derivative-scan',
    sourceLayer: 'DIRECT_DERIVATIVE_SCAN',
    locator: { renderedPdfPages: '105–106', printedSection: '大運' },
    verbatimText: '譬如甲子陽男，十二月二十四日巳時生，是月二十九日立春，陽男數未來之日，自二十四日巳時至二十五日巳時，方曰一日之實數，至二十九日申時止，得五日三時，節氣實歷過六十三時，折除計六百三十日，乃是一歲奇九月之大運，起於丁丑，是越三歲九月之內，方是甲子十二月生行一歲奇九月之大運也。',
    arithmeticRestatement: ['六十三時 = 五日三時', '六百三十日 = 一歲奇九月 under the passage’s stated conversion'],
    inferenceBoundary: 'The arithmetic restatement checks the visible numbers; it does not establish a production calendar algorithm, rounding policy, or semantic authority.',
    candidateDelta: 'The derivative page reads 一歲奇八月 in the later approximate-method sentence, not the candidate’s normalized 一歲八箇月 wording; the difference is retained as a textual observation.',
    directObservation: 'The complete worked example and the later approximate-method sentence are visibly contiguous across pages 105–106 of the corrected fourth-volume derivative.',
    pageBytesObserved: true,
    canonicalTextObserved: false,
  },
  {
    observationId: 'obs.P0-C.first-party-record-frontier',
    unit: 'P0-C',
    evidenceId: 'ev.c.shanghai.official-api-search',
    sourceLayer: 'DIRECT_OFFICIAL_RECORD',
    observationKind: 'bounded_search_observation',
    directObservation: 'The official Shanghai Library API returned a related 四库存目子平汇刊 2 秘本子平真诠 record without the candidate’s 1895/1923 date and holding fields; the exact 報暉草堂 query returned zero and 育新書局 returned an unrelated record. No exact first-party witness record/page was admitted.',
    negativeBoundary: 'This is a bounded result-set observation, not a global absence claim.',
    pageBytesObserved: false,
    canonicalTextObserved: false,
  },
  {
    observationId: 'obs.P0-D.record-and-imprint',
    unit: 'P0-D',
    evidenceId: 'ev.waseda.d.official-record',
    sourceLayer: 'DIRECT_OFFICIAL_RECORD',
    observationKind: 'institutional_record_identity',
    directObservation: 'Waseda’s official record identifies bunko19_f0111 / 文庫19 F0111, the title, Qing attributions, unknown place/publisher, and the 集賢堂 cover/banxin note.',
    pageBytesObserved: false,
    canonicalTextObserved: false,
  },
  {
    observationId: 'obs.P0-D.seasonal-headings',
    unit: 'P0-D',
    evidenceId: 'ev.waseda.d.official-scan',
    sourceLayer: 'DIRECT_OFFICIAL_SCAN',
    pages: [
      renderedWaseda(9, '7f152ad95d282cf782cee51d75878d1c867212b59a4723e49ac553646349bc21', '正月甲木'),
      renderedWaseda(10, 'd80e93fe6e23c1cc2045c1a3b9848e5e061c3688021444b417881b0bc6b38d7c', '二月甲木'),
      renderedWaseda(11, 'd5087c81e2a6133992f5009a53e4c15694db099ec38c19548c61a7f8a2a438d6', '三月甲木'),
    ],
    directObservation: 'The official Waseda scan visibly contains the consecutive 正月甲木, 二月甲木, and 三月甲木 headings on rendered pages 9–11.',
    pageBytesObserved: true,
    canonicalTextObserved: false,
  },
  {
    observationId: 'obs.P0-D.preface-date-unresolved',
    unit: 'P0-D',
    evidenceId: 'ev.waseda.d.official-scan',
    sourceLayer: 'DIRECT_OFFICIAL_SCAN',
    pages: [
      renderedWaseda(2, '7bb296744d28274def29bb0a3f224d21693f84c924514c5403d14d2aeb5c58da', '序 page'),
      renderedWaseda(3, 'e0ed84a943196b49334db457e1fefd148b03bfab2768731c914367bc3799a0bf', '序 continuation'),
    ],
    directObservation: 'A 序 and the attributed work are visible in the inspected opening pages, but 光緒十二年歲次丙戌 and a dated 余春台序 were not observed there. The official record remains undated/unknown-imprint.',
    negativeBoundary: 'This is unresolved at the inspected-page scope; it is not a global claim that no date occurs elsewhere in the scan.',
    pageBytesObserved: true,
    canonicalTextObserved: false,
  },
  {
    observationId: 'obs.P0-E.princeton-record',
    unit: 'P0-E',
    evidenceId: 'ev.princeton.e.official-record',
    sourceLayer: 'DIRECT_OFFICIAL_RECORD',
    observationKind: 'institutional_record_identity',
    directObservation: 'The official Princeton JSON record identifies SCSB-4603974 / CU51356996, call 1739 2920, OCLC 502860307, Xu Sheng, Shanghai Chunming Shuju 1937, and 286 pages; no digital scan field is present in the verified JSON.',
    pageBytesObserved: false,
    canonicalTextObserved: false,
  },
  {
    observationId: 'obs.P0-E.access-is-not-lineage',
    unit: 'P0-E',
    evidenceId: 'ev.princeton.e.official-record',
    sourceLayer: 'PARENT_INFERENCE',
    observationKind: 'independence_boundary',
    directObservation: 'No public scan field or page bytes were verified. That access boundary is not evidence that the item is or is not textually independent.',
    pageBytesObserved: false,
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

const FALSE_SEMANTIC_BLOCKER = {
  blockerId: 'false.semantic-authority-for-bounded-observation',
  edge: 'semantic_authority',
  reason: 'A bounded record or page observation may be reported without semantic authority; the observation does not grant semantic authority.',
}
const REAL_A_PAGE_BLOCKER = {
  blockerId: 'blocker.P0-A.official-folio-and-date',
  edge: 'H/E/L',
  reason: 'The official NCL viewer is CAPTCHA-gated and the public derivative does not prove official-byte equality, exact copy date, or physical/textual lineage.',
}
const REAL_B_DERIVATION_BLOCKER = {
  blockerId: 'blocker.P0-B.derivative-to-independent-lineage',
  edge: 'L/S/I/P',
  reason: 'The corrected volume and contiguous text are directly observed only in a public derivative; lineage, independent corroboration, semantic authority, and implementation safety remain open.',
}
const REAL_C_RECORD_BLOCKER = {
  blockerId: 'blocker.P0-C.first-party-dated-witnesses',
  edge: 'H/E/L/I',
  reason: 'Exact 1895/1923 first-party records, date-bearing pages, and target-section scans were not obtained in the bounded search.',
}
const REAL_D_DATE_BLOCKER = {
  blockerId: 'blocker.P0-D.preface-date-and-current-copy',
  edge: 'E/L/I',
  reason: 'The inspected Waseda opening pages did not establish the candidate date, and the official imprint is unknown; a preface date would not by itself date the current copy.',
}
const REAL_E_LINEAGE_BLOCKER = {
  blockerId: 'blocker.P0-E.edition-lineage-and-pages',
  edge: 'E/L/I',
  reason: 'The official Princeton metadata is verified, but no page/edition-lineage evidence was available; absence of public scan access cannot close independence.',
}

const makeClaim = ({ claimId, unit, candidateAssertion, status, evidenceRefs = [], gates = {}, axes = {}, falseBlockers = [], realBlockers = [], scopeCorrection, promotionTarget = 'none' }) => ({
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
    reason: 'This artifact is a read-only evidence and readiness overlay. It grants no semantic authority, interpretation availability, or production activation.',
  },
})

const identityAxes = () => ({
  'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] },
})
const derivativeAxes = () => ({
  'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: true, missingEdges: [] },
  'digital-derivation': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: true, missingEdges: [] },
})
const officialScanAxes = () => ({
  'physical-item': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] },
  'digital-derivation': { state: 'satisfied', countedAsIndependent: false, sameLineageCandidate: false, missingEdges: [] },
})

const sixStageChain = PAGE_OBSERVATIONS.find(item => item.observationId === 'obs.P0-B.six-stage-chain').verbatimFragments

export const RECONCILIATION = Object.freeze([
  {
    reconciliationId: 'reconcile.P0-A.target-locators',
    unit: 'P0-A',
    before: { source: 'candidate-matrix-v2', status: 'candidate_asserted_unadjudicated', locators: ['PDF pp.4–7', 'PDF pp.27–30', 'PDF pp.39–44'] },
    after: { status: 'partially_supported', acceptedScope: ['derivative p.16 論用神', 'derivative pp.29–30 論相神緊要 and role clause', 'derivative pp.47–49 論行運喜忌'], rejectedOrCorrected: ['p.4–7 is not the target 論用神 heading in this PDF', 'p.39–44 are adjacent sections, not the target 行運 heading'] },
    evidenceRefs: ['obs.P0-A.yongshen.corrected-locator', 'obs.P0-A.xiangshen.corrected-locator', 'obs.P0-A.xingyun.corrected-locator'],
  },
  {
    reconciliationId: 'reconcile.P0-A.early-lineage',
    unit: 'P0-A',
    before: { source: 'candidate-matrix-v2', status: 'candidate_asserted_unadjudicated', assertion: '清敬一堂/banxin supports an early or pre-1776 witness' },
    after: { status: 'unsupported', acceptedScope: ['official NCL catalog identity', 'derivative metadata only'], rejectedOrCorrected: ['清 is a broad category', 'hall/banxin attribution is not an exact copy date', 'no pre-1776 conclusion'] },
    evidenceRefs: ['ev.ncl.a.official-record', 'ev.ncl.a.commons-metadata', 'obs.P0-A.early-date-not-established'],
  },
  {
    reconciliationId: 'reconcile.P0-B.volume-route',
    unit: 'P0-B',
    before: { source: 'candidate-matrix-v2', status: 'candidate_asserted_unadjudicated', route: '114453.0 as 卷33' },
    after: { status: 'unsupported_for_candidate_route', acceptedScope: ['114453.0 = official 第3卷 / derivative 卷16–24', '114503.0 = official 第4卷 / derivative 卷25–33', '卷33 target is on corrected 114503.0'] },
    evidenceRefs: ['ev.nlc.b.official-record', 'obs.P0-B.volume-route-correction', 'obs.P0-B.vol3-not-vol33', 'obs.P0-B.vol33.corrected-volume'],
  },
  {
    reconciliationId: 'reconcile.P0-B.chain-and-example',
    unit: 'P0-B',
    before: { source: 'candidate-matrix-v2', status: 'candidate_asserted_unadjudicated', textCategory: 'DIRECT_OBSERVATION' },
    after: { status: 'partially_supported', sourceLayer: 'DIRECT_DERIVATIVE_SCAN', exactScope: '114503.0 derivative pp.105–106', separateFields: ['verbatimFragments', 'arithmeticRestatement', 'inferenceBoundary'], implementationPromotion: 'blocked', chainFragmentCount: sixStageChain.length },
    evidenceRefs: ['obs.P0-B.six-stage-chain', 'obs.P0-B.worked-example'],
  },
  {
    reconciliationId: 'reconcile.P0-C.dated-witnesses',
    unit: 'P0-C',
    before: { source: 'candidate-matrix-v2', status: 'candidate_asserted_unadjudicated', witnesses: ['1895 報暉草堂', '1923 育新書局'] },
    after: { status: 'unresolved', acceptedScope: ['bounded official Shanghai API search observation only'], rejectedOrCorrected: ['no exact date-bearing first-party record/page admitted', 'no independence conclusion'] },
    evidenceRefs: ['ev.c.shanghai.official-api-search', 'obs.P0-C.first-party-record-frontier'],
  },
  {
    reconciliationId: 'reconcile.P0-D.date-and-headings',
    unit: 'P0-D',
    before: { source: 'candidate-matrix-v2', status: 'candidate_asserted_unadjudicated', date: '光緒十二年歲次丙戌 / 1886' },
    after: { status: 'mixed', acceptedScope: ['official record identity', 'official scan seasonal headings p.9–11'], dateStatus: 'unresolved_at_inspected_opening_pages', currentCopyDate: 'unsupported_from_unknown_imprint' },
    evidenceRefs: ['ev.waseda.d.official-record', 'ev.waseda.d.official-scan', 'obs.P0-D.seasonal-headings', 'obs.P0-D.preface-date-unresolved'],
  },
  {
    reconciliationId: 'reconcile.P0-E.catalog-and-access',
    unit: 'P0-E',
    before: { source: 'candidate-matrix-v2', status: 'partial_packet', catalog: 'SCSB-4603974' },
    after: { status: 'partially_supported', acceptedScope: ['official Princeton metadata'], access: 'no verified scan field/page bytes', independence: 'unresolved rather than negative' },
    evidenceRefs: ['ev.princeton.e.official-record', 'obs.P0-E.princeton-record', 'obs.P0-E.access-is-not-lineage'],
  },
])

const buildClaims = () => [
  makeClaim({
    claimId: 'claim.P0-A.ncl-official-record-identity', unit: 'P0-A',
    candidateAssertion: 'NCL 善本06599 / rarecatx0441810 identifies 耕寸集.', status: 'supported',
    evidenceRefs: ['ev.ncl.a.official-record', 'obs.P0-A.official-record-identity'],
    gates: { H: 'satisfied', E: 'satisfied', L: 'not_applicable', S: 'not_applicable', I: 'not_applicable', P: 'unresolved' },
    axes: identityAxes(), falseBlockers: [FALSE_SEMANTIC_BLOCKER], realBlockers: [REAL_A_PAGE_BLOCKER],
    scopeCorrection: 'Only the official catalog identity is supported; no page content, exact date, or textual-witness claim is promoted.',
  }),
  makeClaim({
    claimId: 'claim.P0-A.derivative-physical-metadata', unit: 'P0-A',
    candidateAssertion: 'The full physical description, seals, dimensions, and banxin were directly established as official item facts.', status: 'partially_supported',
    evidenceRefs: ['ev.ncl.a.commons-metadata', 'ev.ncl.a.commons-scan'],
    gates: { H: 'satisfied', E: 'satisfied', L: 'unresolved', S: 'not_applicable', I: 'unresolved', P: 'unresolved' },
    axes: derivativeAxes(), falseBlockers: [FALSE_SEMANTIC_BLOCKER], realBlockers: [REAL_A_PAGE_BLOCKER],
    scopeCorrection: 'Commons/NCL-attributed metadata and derivative PDF are admitted as such; official NCL byte equality and physical-item verification remain open.',
  }),
  makeClaim({
    claimId: 'claim.P0-A.target-passages-corrected-locators', unit: 'P0-A',
    candidateAssertion: 'The candidate 用神 / 相神 / 行運 passages occur at its supplied PDF pp.4–7, 27–30, and 39–44 locators.', status: 'partially_supported',
    evidenceRefs: ['obs.P0-A.yongshen.corrected-locator', 'obs.P0-A.xiangshen.corrected-locator', 'obs.P0-A.xingyun.corrected-locator'],
    gates: { H: 'satisfied', E: 'satisfied', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
    axes: derivativeAxes(), falseBlockers: [FALSE_SEMANTIC_BLOCKER], realBlockers: [REAL_A_PAGE_BLOCKER],
    scopeCorrection: 'The bounded derivative-scan observations support corrected locators p.16, pp.29–30, and pp.47–49. They do not admit the candidate locators as exact or establish semantic authority.',
    promotionTarget: 'historical_observation_stability',
  }),
  makeClaim({
    claimId: 'claim.P0-A.candidate-locator-accuracy', unit: 'P0-A',
    candidateAssertion: 'The candidate PDF p.4–7 and p.39–44 ranges are exact target locators for 用神 and 行運.', status: 'unsupported',
    evidenceRefs: ['obs.P0-A.yongshen.corrected-locator', 'obs.P0-A.xingyun.corrected-locator'],
    gates: { H: 'satisfied', E: 'satisfied', L: 'not_applicable', S: 'not_applicable', I: 'not_applicable', P: 'unresolved' },
    axes: derivativeAxes(), falseBlockers: [FALSE_SEMANTIC_BLOCKER], realBlockers: [REAL_A_PAGE_BLOCKER],
    scopeCorrection: 'The candidate locator set is corrected rather than silently normalized: p.16, pp.29–30, and pp.47–49 are the parent-observed derivative scope.',
  }),
  makeClaim({
    claimId: 'claim.P0-A.pre-1776-early-witness', unit: 'P0-A',
    candidateAssertion: '清敬一堂 / banxin metadata establishes a pre-1776 or early direct textual witness.', status: 'unsupported',
    evidenceRefs: ['ev.ncl.a.official-record', 'ev.ncl.a.commons-metadata', 'obs.P0-A.early-date-not-established'],
    gates: { H: 'satisfied', E: 'unresolved', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
    axes: derivativeAxes(), falseBlockers: [FALSE_SEMANTIC_BLOCKER], realBlockers: [REAL_A_PAGE_BLOCKER],
    scopeCorrection: 'Broad Qing/hall metadata is not an exact reign-year or copy date; no pre-1776 claim is admitted.',
    promotionTarget: 'edition/textual-lineage',
  }),
  makeClaim({
    claimId: 'claim.P0-B.nlc-official-record-volume-map', unit: 'P0-B',
    candidateAssertion: 'NLC 06857 / fid 411999013122 identifies the Qing copy with 卷1–33 and maps the target volume route.', status: 'supported',
    evidenceRefs: ['ev.nlc.b.official-record', 'obs.P0-B.volume-route-correction'],
    gates: { H: 'satisfied', E: 'satisfied', L: 'unresolved', S: 'not_applicable', I: 'unresolved', P: 'unresolved' },
    axes: identityAxes(), falseBlockers: [FALSE_SEMANTIC_BLOCKER], realBlockers: [REAL_B_DERIVATION_BLOCKER],
    scopeCorrection: 'Official record identity and volume map are supported; the exact passage is a separate page-level claim.',
  }),
  makeClaim({
    claimId: 'claim.P0-B.candidate-114453-vol33-route', unit: 'P0-B',
    candidateAssertion: 'The candidate’s bid 114453.0 is the 卷33 target volume.', status: 'unsupported',
    evidenceRefs: ['ev.nlc.b.official-record', 'ev.nlc.b.vol3-derivative-scan', 'obs.P0-B.vol3-not-vol33'],
    gates: { H: 'satisfied', E: 'satisfied', L: 'not_applicable', S: 'not_applicable', I: 'not_applicable', P: 'unresolved' },
    axes: derivativeAxes(), falseBlockers: [FALSE_SEMANTIC_BLOCKER], realBlockers: [REAL_B_DERIVATION_BLOCKER],
    scopeCorrection: '114453.0 is the third physical volume and its derivative scan covers 卷16–24; the corrected 卷33 route is 114503.0.',
  }),
  makeClaim({
    claimId: 'claim.P0-B.corrected-vol33-heading-and-section', unit: 'P0-B',
    candidateAssertion: 'The corrected 卷33 derivative contains the 大運 target section.', status: 'partially_supported',
    evidenceRefs: ['ev.nlc.b.vol4-official-route', 'ev.nlc.b.vol4-derivative-scan', 'obs.P0-B.vol33.corrected-volume'],
    gates: { H: 'satisfied', E: 'satisfied', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
    axes: derivativeAxes(), falseBlockers: [FALSE_SEMANTIC_BLOCKER], realBlockers: [REAL_B_DERIVATION_BLOCKER],
    scopeCorrection: 'The heading and target page are supported at the corrected public derivative scope, not as official NLC PDF byte equality.',
    promotionTarget: 'historical_observation_stability',
  }),
  makeClaim({
    claimId: 'claim.P0-B.six-stage-chain', unit: 'P0-B',
    candidateAssertion: 'The exact six-stage 大運 conversion chain is directly observed in 卷33.', status: 'partially_supported',
    evidenceRefs: ['obs.P0-B.six-stage-chain'],
    gates: { H: 'satisfied', E: 'satisfied', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
    axes: derivativeAxes(), falseBlockers: [FALSE_SEMANTIC_BLOCKER], realBlockers: [REAL_B_DERIVATION_BLOCKER],
    scopeCorrection: 'The six operational fragments are visually observed as one contiguous derivative passage. Verbatim fragments, arithmetic restatement, and implementation inference remain separate.',
    promotionTarget: 'historical_observation_stability',
  }),
  makeClaim({
    claimId: 'claim.P0-B.worked-example', unit: 'P0-B',
    candidateAssertion: 'The 甲子陽男 worked example directly establishes the historical start-age and pillar calculation.', status: 'partially_supported',
    evidenceRefs: ['obs.P0-B.worked-example'],
    gates: { H: 'satisfied', E: 'satisfied', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
    axes: derivativeAxes(), falseBlockers: [FALSE_SEMANTIC_BLOCKER], realBlockers: [REAL_B_DERIVATION_BLOCKER],
    scopeCorrection: 'The bounded derivative page shows the example and its numbers; the arithmetic restatement is not a production rule or semantic conclusion.',
    promotionTarget: 'historical_observation_stability',
  }),
  makeClaim({
    claimId: 'claim.P0-B.implementation-safe-conversion', unit: 'P0-B',
    candidateAssertion: 'The single worked example establishes an implementation-safe calendar conversion and rounding policy.', status: 'unsupported',
    evidenceRefs: ['obs.P0-B.six-stage-chain', 'obs.P0-B.worked-example'],
    gates: { H: 'unresolved', E: 'unresolved', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
    axes: derivativeAxes(), falseBlockers: [{ blockerId: 'false.single-example-implementation-promotion', edge: 'implementation_grounding', reason: 'One historical example cannot define a production calendar algorithm, timezone policy, rounding order, or exception handling.' }], realBlockers: [REAL_B_DERIVATION_BLOCKER],
    scopeCorrection: 'No implementation rule or production activation follows from this visual page observation.',
    promotionTarget: 'implementation_safe_grounding',
  }),
  makeClaim({
    claimId: 'claim.P0-C.1895-baohuicaotang-witness', unit: 'P0-C',
    candidateAssertion: 'An 1895 報暉草堂 physical witness is first-party catalog-anchored with the target sections.', status: 'unresolved',
    evidenceRefs: ['ev.c.shanghai.official-api-search', 'obs.P0-C.first-party-record-frontier'],
    gates: { S: 'unresolved', P: 'unresolved' },
    falseBlockers: [FALSE_SEMANTIC_BLOCKER], realBlockers: [REAL_C_RECORD_BLOCKER],
    scopeCorrection: 'The candidate date/publisher/holding claim remains a lead; no exact first-party record or target page was admitted.',
    promotionTarget: 'edition/textual-lineage',
  }),
  makeClaim({
    claimId: 'claim.P0-C.1923-yuxin-witness', unit: 'P0-C',
    candidateAssertion: 'A 1923 紹興育新書局 witness is first-party catalog-anchored with the target sections.', status: 'unresolved',
    evidenceRefs: ['ev.c.shanghai.official-api-search', 'obs.P0-C.first-party-record-frontier'],
    gates: { S: 'unresolved', P: 'unresolved' },
    falseBlockers: [FALSE_SEMANTIC_BLOCKER], realBlockers: [REAL_C_RECORD_BLOCKER],
    scopeCorrection: 'The candidate date/publisher/holding claim remains a lead; the related API result is not this exact dated witness.',
    promotionTarget: 'edition/textual-lineage',
  }),
  makeClaim({
    claimId: 'claim.P0-C.target-sections-first-party', unit: 'P0-C',
    candidateAssertion: '用神 / 相神 / 行運 are directly observed in both dated pre-1926 witnesses.', status: 'unresolved',
    evidenceRefs: ['obs.P0-C.first-party-record-frontier'],
    gates: { S: 'unresolved', P: 'unresolved' },
    falseBlockers: [FALSE_SEMANTIC_BLOCKER], realBlockers: [REAL_C_RECORD_BLOCKER],
    scopeCorrection: 'No date-bearing title/colophon page or target-section image was parent-verified for either candidate witness.',
    promotionTarget: 'historical_observation_stability',
  }),
  makeClaim({
    claimId: 'claim.P0-C.two-independent-pre1926-witnesses', unit: 'P0-C',
    candidateAssertion: 'The candidate 1895 and 1923 labels establish two independent physical and textual lineages.', status: 'unsupported',
    evidenceRefs: ['ev.c.shanghai.official-api-search', 'obs.P0-C.first-party-record-frontier'],
    gates: { H: 'unresolved', E: 'unresolved', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
    falseBlockers: [FALSE_SEMANTIC_BLOCKER], realBlockers: [REAL_C_RECORD_BLOCKER],
    scopeCorrection: 'Date labels alone cannot establish physical-item independence, digital independence, or textual-lineage independence.',
    promotionTarget: 'cross_lineage_stability',
  }),
  makeClaim({
    claimId: 'claim.P0-D.waseda-official-record-identity', unit: 'P0-D',
    candidateAssertion: 'Waseda bunko19_f0111 identifies the stated Qiong tong bao jian record and Qing editorial attributions.', status: 'supported',
    evidenceRefs: ['ev.waseda.d.official-record', 'obs.P0-D.record-and-imprint'],
    gates: { H: 'satisfied', E: 'satisfied', L: 'not_applicable', S: 'not_applicable', I: 'not_applicable', P: 'unresolved' },
    axes: identityAxes(), falseBlockers: [FALSE_SEMANTIC_BLOCKER], realBlockers: [REAL_D_DATE_BLOCKER],
    scopeCorrection: 'Official record identity, attributions, and unknown imprint are supported; no date or semantic authority is inferred.',
  }),
  makeClaim({
    claimId: 'claim.P0-D.seasonal-headings', unit: 'P0-D',
    candidateAssertion: 'The official Waseda scan visibly contains 正月甲木, 二月甲木, and 三月甲木 on pages 9–11.', status: 'supported',
    evidenceRefs: ['ev.waseda.d.official-scan', 'obs.P0-D.seasonal-headings'],
    gates: { H: 'satisfied', E: 'satisfied', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
    axes: officialScanAxes(), falseBlockers: [FALSE_SEMANTIC_BLOCKER], realBlockers: [REAL_D_DATE_BLOCKER],
    scopeCorrection: 'This is a bounded official-scan heading observation, not a dated-edition claim or cross-edition semantic equivalence.',
    promotionTarget: 'historical_observation_stability',
  }),
  makeClaim({
    claimId: 'claim.P0-D.preface-date', unit: 'P0-D',
    candidateAssertion: 'The scan contains a 余春台序 dated 光緒十二年歲次丙戌 (1886).', status: 'unresolved',
    evidenceRefs: ['ev.waseda.d.official-record', 'obs.P0-D.preface-date-unresolved'],
    gates: { H: 'unresolved', E: 'unresolved', L: 'unresolved', S: 'not_applicable', I: 'unresolved', P: 'unresolved' },
    axes: officialScanAxes(), falseBlockers: [FALSE_SEMANTIC_BLOCKER], realBlockers: [REAL_D_DATE_BLOCKER],
    scopeCorrection: 'The exact date was not observed in the inspected opening pages; it remains unresolved, not imported from the candidate packet.',
    promotionTarget: 'edition/textual-lineage',
  }),
  makeClaim({
    claimId: 'claim.P0-D.current-copy-date', unit: 'P0-D',
    candidateAssertion: 'The current Waseda copy was printed in 1886 or otherwise has a confirmed late-Qing copy date.', status: 'unsupported',
    evidenceRefs: ['ev.waseda.d.official-record', 'obs.P0-D.preface-date-unresolved'],
    gates: { H: 'satisfied', E: 'unresolved', L: 'unresolved', S: 'not_applicable', I: 'unresolved', P: 'unresolved' },
    axes: officialScanAxes(), falseBlockers: [FALSE_SEMANTIC_BLOCKER], realBlockers: [REAL_D_DATE_BLOCKER],
    scopeCorrection: 'The official imprint is unknown. A preface date, if later found, must remain separate from the current-copy/edition date.',
    promotionTarget: 'edition/textual-lineage',
  }),
  makeClaim({
    claimId: 'claim.P0-D.word-for-word-seasonal-stability', unit: 'P0-D',
    candidateAssertion: 'The Waseda seasonal clauses match NLC 1926/1937 word-for-word and establish textual stability.', status: 'unresolved',
    evidenceRefs: ['obs.P0-D.seasonal-headings'],
    gates: { H: 'satisfied', E: 'unresolved', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
    axes: officialScanAxes(), falseBlockers: [FALSE_SEMANTIC_BLOCKER], realBlockers: [REAL_D_DATE_BLOCKER, { blockerId: 'blocker.P0-D.cross-edition-page-collation', edge: 'E/L/I', reason: 'This P0 acquisition pass did not establish a word-for-word page collation with the claimed 1926/1937 comparators.' }],
    scopeCorrection: 'The three headings are supported; word-for-word stability and independent transmission remain separate unresolved claims.',
    promotionTarget: 'cross_lineage_stability',
  }),
  makeClaim({
    claimId: 'claim.P0-E.princeton-official-record', unit: 'P0-E',
    candidateAssertion: 'Princeton/ReCAP SCSB-4603974 / CU51356996 is a verified 1937 286-page physical copy.', status: 'supported',
    evidenceRefs: ['ev.princeton.e.official-record', 'obs.P0-E.princeton-record'],
    gates: { H: 'satisfied', E: 'satisfied', L: 'unresolved', S: 'not_applicable', I: 'unresolved', P: 'unresolved' },
    axes: identityAxes(), falseBlockers: [FALSE_SEMANTIC_BLOCKER], realBlockers: [REAL_E_LINEAGE_BLOCKER],
    scopeCorrection: 'Official bibliographic and holding metadata are supported; no page text or edition-lineage conclusion is imported.',
  }),
  makeClaim({
    claimId: 'claim.P0-E.scan-access', unit: 'P0-E',
    candidateAssertion: 'A Princeton public scan or page-level representation is available for direct verification.', status: 'unresolved',
    evidenceRefs: ['ev.princeton.e.official-record', 'obs.P0-E.princeton-record'],
    gates: { H: 'unresolved', E: 'unresolved', L: 'unresolved', S: 'not_applicable', I: 'unresolved', P: 'unresolved' },
    falseBlockers: [FALSE_SEMANTIC_BLOCKER], realBlockers: [REAL_E_LINEAGE_BLOCKER],
    scopeCorrection: 'The verified JSON record has no digital-object field; access remains unresolved and is not a lineage result.',
  }),
  makeClaim({
    claimId: 'claim.P0-E.reprint-lineage', unit: 'P0-E',
    candidateAssertion: 'The Princeton item is a modern commercial reprint of a Ming Yang Cong recension and is not independent.', status: 'unresolved',
    evidenceRefs: ['ev.princeton.e.official-record', 'obs.P0-E.access-is-not-lineage'],
    gates: { H: 'satisfied', E: 'unresolved', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
    axes: defaultAxes(), falseBlockers: [FALSE_SEMANTIC_BLOCKER], realBlockers: [REAL_E_LINEAGE_BLOCKER],
    scopeCorrection: 'The official record establishes 1937 metadata but does not establish the claimed reprint genealogy or negative independence.',
    promotionTarget: 'edition/textual-lineage',
  }),
  makeClaim({
    claimId: 'claim.P0-E.negative-independence-from-access-absence', unit: 'P0-E',
    candidateAssertion: 'The absence of a public Princeton scan closes the independence question negatively.', status: 'unsupported',
    evidenceRefs: ['ev.princeton.e.official-record', 'obs.P0-E.access-is-not-lineage'],
    gates: { H: 'satisfied', E: 'unresolved', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
    axes: defaultAxes(), falseBlockers: [{ blockerId: 'false.access-absence-proves-lineage', edge: 'independence', reason: 'Access absence is not evidence for or against textual independence.' }], realBlockers: [REAL_E_LINEAGE_BLOCKER],
    scopeCorrection: 'Do not convert an access boundary into a negative independence conclusion.',
  }),
  makeClaim({
    claimId: 'claim.overall.P0-all-units-resolved-and-promotable', unit: 'P0-E',
    candidateAssertion: 'The candidate packet resolves all P0 units and establishes L/I/P promotion for interpretation or production.', status: 'unsupported',
    evidenceRefs: ['ev.candidate.packet-v2', 'obs.P0-B.volume-route-correction', 'obs.P0-C.first-party-record-frontier', 'obs.P0-D.preface-date-unresolved', 'obs.P0-E.access-is-not-lineage'],
    gates: { H: 'unresolved', E: 'unresolved', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
    falseBlockers: [{ blockerId: 'false.candidate-verdict-as-parent-verification', edge: 'all-gates', reason: 'Candidate packet verdicts and completion markers are not parent verification.' }], realBlockers: [REAL_A_PAGE_BLOCKER, REAL_B_DERIVATION_BLOCKER, REAL_C_RECORD_BLOCKER, REAL_D_DATE_BLOCKER, REAL_E_LINEAGE_BLOCKER],
    scopeCorrection: 'The additive parent overlay keeps promotionReadyClaimIds empty, semantic authority not established, interpretation unavailable, and production activation blocked.',
    promotionTarget: 'implementation_safe_grounding',
  }),
]

const statusCounts = claims => Object.fromEntries(CLAIM_STATUSES.map(status => [status, claims.filter(claim => claim.status === status).length]))
const gateStateCounts = claims => Object.fromEntries(GATE_KEYS.map(gate => [gate, Object.fromEntries(GATE_STATES.map(state => [state, claims.filter(claim => claim.gates[gate] === state).length]))]))
const gateStatus = counts => counts.satisfied > 0 && counts.unresolved === 0 && counts.conflicted === 0 ? 'satisfied' : counts.conflicted > 0 ? 'conflicted' : counts.satisfied > 0 ? 'partial' : 'unresolved'

export function buildSajuLunaP0EvidenceAcquisitionV2({ basisHead, predecessorReferences = {} } = {}) {
  const claims = buildClaims()
  const counts = gateStateCounts(claims)
  const typedReadiness = Object.fromEntries(GATE_KEYS.map(gate => [gate, {
    status: gate === 'P' ? 'blocked' : gateStatus(counts[gate]),
    stateCounts: counts[gate],
    note: gate === 'H' || gate === 'E'
      ? 'Partial bounded evidence exists, but unresolved claims remain.'
      : 'No all-claims or cross-boundary readiness is established by this pass.',
  }]))
  const parentVerifiedClaimIds = claims.filter(claim => claim.status === 'supported').map(claim => claim.claimId)
  return {
    schemaVersion: SAJU_LUNA_P0_SCHEMA,
    version: SAJU_LUNA_P0_VERSION,
    basisHead,
    scope: {
      purpose: 'Additive parent verification of the read-only Gemini/LUNA P0 evidence-acquisition packet and matrix.',
      sourceOfTruth: 'Parent-observed official records, official/derivative scan bytes, exact rendered-page identities, and bounded visual observations.',
      sourceLayerPolicy: {
        DIRECT_OFFICIAL_RECORD: 'Institution-hosted record fields only.',
        DIRECT_OFFICIAL_SCAN: 'Institution-hosted scan bytes/pages only.',
        DIRECT_DERIVATIVE_SCAN: 'Public scan derivative/mirror; no official-byte or independent-lineage assumption.',
        INSTITUTIONAL_METADATA: 'Catalog/file metadata; no page-text or date overreach.',
        SECONDARY_LOCATOR: 'Locator/corroboration only; never canonical source text.',
        PARENT_INFERENCE: 'Explicit bounded inference; never relabeled as direct observation.',
        CANDIDATE_ASSERTION: 'Untrusted lead only.',
      },
      ocrPolicy: 'OCR and transmitted web text may locate a page only; visual page review and source-layer identity control the admitted observation.',
      verbatimPolicy: 'Direct visual transcriptions remain bounded observations with original-source scope and are not canonical rekeyings.',
      arithmeticPolicy: 'Arithmetic restatements are stored separately from source wording and cannot promote implementation safety.',
      forbiddenPromotion: ['canonical_text', 'semantic_authority', 'available_for_interpretation', 'production_activation', 'implementation_rule'],
    },
    candidatePacket: CANDIDATE_PACKET,
    externalEvidence: EXTERNAL_EVIDENCE,
    pageObservations: PAGE_OBSERVATIONS,
    reconciliation: RECONCILIATION,
    claims,
    blockerLedger: {
      falseBlockers: [
        { blockerId: 'false.semantic-authority-for-bounded-observation', status: 'not_a_blocker_for_raw_observation', note: 'Raw catalog/page observations can be recorded without semantic authority; they do not grant it.' },
        { blockerId: 'false.access-absence-proves-lineage', status: 'not_evidence', note: 'Missing public scan access is not a lineage conclusion.' },
        { blockerId: 'false.single-example-implementation-promotion', status: 'not_a_resolution_route', note: 'A worked example cannot define production implementation safety.' },
      ],
      realBlockers: [REAL_A_PAGE_BLOCKER, REAL_B_DERIVATION_BLOCKER, REAL_C_RECORD_BLOCKER, REAL_D_DATE_BLOCKER, REAL_E_LINEAGE_BLOCKER],
    },
    readinessOverlay: {
      reportedByCandidate: { trust: 'untrusted_candidate_baseline', matrixSchemaVersion: '2.0.0', imported: false },
      parentVerified: {
        comparablePopulation: `${claims.length} additive parent claims; candidate packet labels/counts are not imported as readiness counts.`,
        gateStateCounts: counts,
        typedReadiness,
        parentVerifiedClaimIds,
        promotionReadyClaimIds: [],
        stableClaimPromotionCount: 0,
        availableForInterpretation: false,
        semanticAuthority: 'not_established',
        implementationSafeGrounding: 'not_established',
        productionActivation: 'blocked',
      },
    },
    predecessorReferences,
    promotion: {
      status: 'blocked',
      ready: false,
      promotionReadyClaimIds: [],
      stableClaimPromotionCount: 0,
      semanticAuthorityChanged: false,
      productionChanged: false,
      interpretationAvailable: false,
      reason: 'Evidence acquisition and parent verification do not activate semantic interpretation or production rules.',
    },
    summary: {
      claimCount: claims.length,
      statusCounts: statusCounts(claims),
      parentVerifiedClaimCount: parentVerifiedClaimIds.length,
      realBlockerCount: 5,
      promotionReadyClaimCount: 0,
      supportedScope: [
        'P0-A official NCL catalog identity; corrected bounded passages in a public derivative at p.16, pp.29–30, and pp.47–49',
        'P0-B official NLC record/volume map; corrected 114503.0 derivative 卷33 heading, contiguous rule chain, and worked example',
        'P0-D Waseda official record/scan identity and pages 9–11 seasonal headings',
        'P0-E official Princeton 1937 metadata identity',
      ],
      unresolvedScope: [
        'P0-A official folio bytes, exact copy date, and early textual lineage',
        'P0-B official scan byte equality, independent lineage, semantic authority, and implementation safety',
        'P0-C exact 1895/1923 first-party records, pages, and independence',
        'P0-D claimed 1886 preface date, current-copy date, and cross-edition word-for-word stability',
        'P0-E page access and edition/reprint lineage',
      ],
    },
  }
}

const isObject = value => Boolean(value && typeof value === 'object' && !Array.isArray(value))
const claimIds = artifact => new Set((artifact.claims || []).map(claim => claim.claimId))

export function checkSajuLunaP0EvidenceAcquisitionV2(artifact) {
  const errors = []
  if (!isObject(artifact)) return ['artifact_shape_invalid']
  if (artifact.schemaVersion !== SAJU_LUNA_P0_SCHEMA) errors.push('schema_version')
  if (artifact.version !== SAJU_LUNA_P0_VERSION) errors.push('version')
  if (artifact.candidatePacket?.trustBoundary !== 'untrusted_candidate_only') errors.push('candidate_trust_boundary')
  if (artifact.candidatePacket?.importedAsCanonicalEvidence !== false) errors.push('candidate_import_boundary')
  if (artifact.candidatePacket?.importedConclusionFields?.length !== 0) errors.push('candidate_conclusion_import')
  if (artifact.candidatePacket?.byteSha256 !== CANDIDATE_PACKET.byteSha256 || artifact.candidatePacket?.matrixByteSha256 !== CANDIDATE_PACKET.matrixByteSha256) errors.push('candidate_identity')
  if (!Array.isArray(artifact.externalEvidence) || artifact.externalEvidence.length < 15) errors.push('external_evidence_count')
  if (!Array.isArray(artifact.pageObservations) || artifact.pageObservations.length < 15) errors.push('page_observation_count')
  if (!Array.isArray(artifact.reconciliation) || artifact.reconciliation.length < 7) errors.push('reconciliation_count')
  if (!Array.isArray(artifact.claims) || artifact.claims.length !== 25) errors.push('claim_count')

  for (const evidence of artifact.externalEvidence || []) {
    if (!SOURCE_LAYERS.includes(evidence.sourceLayer)) errors.push(`evidence:${evidence.evidenceId}:source_layer`)
    if (evidence.canonicalTextAdmitted === true) errors.push(`evidence:${evidence.evidenceId}:canonical_text_admitted`)
  }
  for (const observation of artifact.pageObservations || []) {
    if (!SOURCE_LAYERS.includes(observation.sourceLayer)) errors.push(`observation:${observation.observationId}:source_layer`)
    if (observation.canonicalTextObserved === true) errors.push(`observation:${observation.observationId}:canonical_text_observed`)
  }
  for (const claim of artifact.claims || []) {
    if (!UNITS.includes(claim.unit) && claim.claimId !== 'claim.overall.P0-all-units-resolved-and-promotable') errors.push(`claim:${claim.claimId}:unit`)
    if (!CLAIM_STATUSES.includes(claim.status)) errors.push(`claim:${claim.claimId}:status`)
    for (const gate of GATE_KEYS) if (!GATE_STATES.includes(claim.gates?.[gate])) errors.push(`claim:${claim.claimId}:gate:${gate}`)
    for (const axis of INDEPENDENCE_AXES) {
      const axisEvidence = claim.independence?.[axis]
      if (!isObject(axisEvidence)) errors.push(`claim:${claim.claimId}:axis:${axis}:missing`)
      if (axisEvidence?.countedAsIndependent === true) errors.push(`claim:${claim.claimId}:axis:${axis}:counted_as_independent`)
    }
    if (claim.candidateEvidenceAccepted !== false) errors.push(`claim:${claim.claimId}:candidate_evidence_accepted`)
    if (claim.promotion?.ready !== false || claim.promotion?.status !== 'blocked') errors.push(`claim:${claim.claimId}:promotion_not_blocked`)
  }

  const ids = claimIds(artifact)
  const required = [
    'claim.P0-A.target-passages-corrected-locators', 'claim.P0-A.candidate-locator-accuracy', 'claim.P0-A.pre-1776-early-witness',
    'claim.P0-B.candidate-114453-vol33-route', 'claim.P0-B.corrected-vol33-heading-and-section', 'claim.P0-B.six-stage-chain', 'claim.P0-B.worked-example', 'claim.P0-B.implementation-safe-conversion',
    'claim.P0-C.1895-baohuicaotang-witness', 'claim.P0-C.1923-yuxin-witness', 'claim.P0-C.two-independent-pre1926-witnesses',
    'claim.P0-D.seasonal-headings', 'claim.P0-D.preface-date', 'claim.P0-D.current-copy-date',
    'claim.P0-E.princeton-official-record', 'claim.P0-E.reprint-lineage', 'claim.P0-E.negative-independence-from-access-absence',
  ]
  for (const requiredId of required) if (!ids.has(requiredId)) errors.push(`missing_claim:${requiredId}`)

  const find = claimId => artifact.claims?.find(claim => claim.claimId === claimId)
  if (find('claim.P0-A.target-passages-corrected-locators')?.status !== 'partially_supported') errors.push('P0-A_corrected_scope')
  if (find('claim.P0-A.candidate-locator-accuracy')?.status !== 'unsupported') errors.push('P0-A_candidate_locator_boundary')
  if (find('claim.P0-A.pre-1776-early-witness')?.status !== 'unsupported') errors.push('P0-A_date_boundary')
  if (find('claim.P0-B.candidate-114453-vol33-route')?.status !== 'unsupported') errors.push('P0-B_volume_correction')
  if (find('claim.P0-B.corrected-vol33-heading-and-section')?.status !== 'partially_supported') errors.push('P0-B_corrected_volume_scope')
  if (find('claim.P0-B.six-stage-chain')?.status !== 'partially_supported') errors.push('P0-B_chain_scope')
  if (find('claim.P0-B.worked-example')?.status !== 'partially_supported') errors.push('P0-B_example_scope')
  if (find('claim.P0-B.implementation-safe-conversion')?.status !== 'unsupported') errors.push('P0-B_implementation_boundary')
  if (find('claim.P0-C.1895-baohuicaotang-witness')?.status !== 'unresolved' || find('claim.P0-C.1923-yuxin-witness')?.status !== 'unresolved') errors.push('P0-C_record_boundary')
  if (find('claim.P0-C.two-independent-pre1926-witnesses')?.status !== 'unsupported') errors.push('P0-C_independence_boundary')
  if (find('claim.P0-D.seasonal-headings')?.status !== 'supported') errors.push('P0-D_heading_scope')
  if (find('claim.P0-D.preface-date')?.status !== 'unresolved') errors.push('P0-D_preface_date_boundary')
  if (find('claim.P0-D.current-copy-date')?.status !== 'unsupported') errors.push('P0-D_copy_date_boundary')
  if (find('claim.P0-E.princeton-official-record')?.status !== 'supported') errors.push('P0-E_record_scope')
  if (find('claim.P0-E.reprint-lineage')?.status !== 'unresolved') errors.push('P0-E_lineage_boundary')
  if (find('claim.P0-E.negative-independence-from-access-absence')?.status !== 'unsupported') errors.push('P0-E_access_boundary')

  const bVolume = artifact.externalEvidence?.find(item => item.evidenceId === 'ev.nlc.b.vol4-derivative-scan')
  if (bVolume?.sourceLayer !== 'DIRECT_DERIVATIVE_SCAN' || bVolume?.physicalVolume !== '第4卷; Commons description: 卷25–33') errors.push('P0-B_derivative_layer')
  const bChain = artifact.pageObservations?.find(item => item.observationId === 'obs.P0-B.six-stage-chain')
  if (bChain?.contiguous !== true || bChain?.verbatimFragments?.length !== 6) errors.push('P0-B_six_stage_chain_shape')
  if (artifact.readinessOverlay?.parentVerified?.promotionReadyClaimIds?.length !== 0) errors.push('readiness_promotion')
  if (artifact.readinessOverlay?.parentVerified?.stableClaimPromotionCount !== 0) errors.push('readiness_stable_count')
  if (artifact.readinessOverlay?.parentVerified?.availableForInterpretation !== false) errors.push('readiness_available')
  if (artifact.readinessOverlay?.parentVerified?.semanticAuthority !== 'not_established') errors.push('readiness_semantic_authority')
  if (artifact.readinessOverlay?.parentVerified?.implementationSafeGrounding !== 'not_established') errors.push('readiness_implementation')
  if (artifact.readinessOverlay?.parentVerified?.productionActivation !== 'blocked') errors.push('readiness_activation')
  if (artifact.promotion?.ready !== false || artifact.promotion?.status !== 'blocked') errors.push('promotion_not_blocked')
  if (artifact.promotion?.stableClaimPromotionCount !== 0 || artifact.promotion?.semanticAuthorityChanged !== false || artifact.promotion?.productionChanged !== false || artifact.promotion?.interpretationAvailable !== false) errors.push('promotion_side_effect')
  const overall = find('claim.overall.P0-all-units-resolved-and-promotable')
  if (overall?.status !== 'unsupported') errors.push('overall_overclaim_not_rejected')
  return [...new Set(errors)].sort()
}

export const EXTERNAL_SOURCE_URLS = Object.freeze({
  nclRecordUrl,
  nclCommonsPageUrl,
  nclCommonsApiUrl,
  nclCommonsPdfUrl,
  nlcRecordUrl,
  nlcVol3OpenUrl,
  nlcVol4OpenUrl,
  nlcVol3CommonsPageUrl,
  nlcVol4CommonsPageUrl,
  nlcVol4CommonsApiUrl,
  nlcVol4CommonsPdfUrl,
  ctextDayunUrl,
  wasedaRecordUrl,
  wasedaPdfUrl,
  princetonRecordUrl,
  princetonHtmlUrl,
})

export const candidatePacketByteSha256 = value => sha256(value)
