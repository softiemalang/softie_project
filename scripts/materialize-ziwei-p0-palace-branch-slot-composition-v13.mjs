import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'

import {
  attachArtifactIdentity,
  buildArtifactIdentity,
  canonicalStableArtifactJson,
  checkHistoricalRepositoryBasis,
} from '../src/artifactIdentity.js'
import * as v12 from './materialize-ziwei-p0-palace-branch-slot-composition-v12.mjs'

export const SCHEMA = 'ziwei-p0-palace-branch-slot-composition-v13'
export const VERDICT = 'complete_ziwei_palace_branch_slot_composition_with_nlc_1607_institutional_record_and_derivative_scan_frontier_derived_not_authoritative'
export const MATERIALIZER_VERSION = '13.0.0'
export const BASIS_HEAD = '479c4b7dae57c3b7b51e5fdffb5617aa18723db3'
export const MATERIALIZER_PATH = 'scripts/materialize-' + SCHEMA + '.mjs'
export const ARTIFACT_DIR = 'artifacts/' + SCHEMA
export const ARTIFACT_PATH = ARTIFACT_DIR + '/complete.json'
export const DOCUMENTATION_PATH = 'docs/ziwei-p0-palace-branch-slot-composition-v13.md'
export const CHECKER_PATH = 'scripts/check-' + SCHEMA + '.mjs'
export const NEGATIVE_CHECKER_PATH = 'scripts/check-' + SCHEMA + '-negative-v0.mjs'
export const ROOT = resolve(new URL('..', import.meta.url).pathname)
export const PREDECESSOR_COMPOSITION = v12.ARTIFACT_PATH
export const PREDECESSOR_COMPOSITION_EVIDENCE = v12.ARTIFACT_DIR + '/evidence.json'
export const PROTECTED_ASSET_PATH = v12.PROTECTED_ASSET_PATH

export const CANDIDATE_NLC_1607 = 'candidate-nlc-1607-xudaozang-ziwei-vol1-3'
export const OBSERVATION_NLC_1607 = 'frontier-obs-nlc-1607-xudaozang-rule-and-grid-review'
export const SOURCE_ID_NLC_1607 = 'src-nlc-02608-xudaozang-139580-139582'

export const NLC_CATALOG_URL = 'http://read.nlc.cn/allSearch/searchDetail?searchType=10024&showType=1&indexName=data_892&fid=411999007380'
export const NLC_VIEWER_URLS = {
  '139580': 'http://read.nlc.cn/OutOpenBook/OpenObjectBook?aid=892&bid=139580.0',
  '139581': 'http://read.nlc.cn/OutOpenBook/OpenObjectBook?aid=892&bid=139581.0',
  '139582': 'http://read.nlc.cn/OutOpenBook/OpenObjectBook?aid=892&bid=139582.0',
}
export const NLC_CATALOG_HTML_SHA256 = '2668bcd804ebef6b687514e1708fa33daab6e08b057a8e0f715b5525599ddcb2'
export const NLC_CATALOG_HTML_BYTES = 86027
export const NLC_VIEWER_HTML_SHA256_BY_BID = {
  '139580': '7cff153b4691bdbd7e84623f72b2917dfaa645122f7a1bbd76b328474b8762f2',
  '139581': 'f30dc5200e08f970670a3ad8fa047b2596a5dbf8d23a964773ae452e167d10d7',
  '139582': '78ae00baf3626eb79b313bde35e79f0dc8ca565590b32118407830125717589f',
}
export const NLC_OFFICIAL_RANGE_ENDPOINT = 'http://read.nlc.cn/menhu/OutOpenBook/getReaderRangeNew'
export const NLC_OFFICIAL_CONTENT_RANGE_TOTAL_BY_BID = {
  '139580': 22720525,
  '139581': 13309632,
  '139582': 14889455,
}
export const NLC_OFFICIAL_PDF_SHA256_BY_BID = {
  '139580': 'ae39779b9da3403d10b4548c80d819af9d0b12d1d69bba89b0a120b82fc50760',
  '139581': '620b91ec07d670a4eec28e7848a2f58a4d921f08dc192060cfb01e0a9a5986c4',
  '139582': '7b5bfc67bc5729800e222ded2fb6442efdca0d29a335856acc62d9aea1116e67',
}
export const NLC_OFFICIAL_PDFINFO_PAGES_BY_BID = { '139580': 112, '139581': 67, '139582': 74 }
export const NLC_METHOD_DOCUMENT_REPORTED_TOTAL_BY_BID = { '139580': 22720526, '139581': 13309633, '139582': 14889456 }

export const NLC_DERIVATIVE_VOLUMES = [
  {
    volume: '第167冊',
    bid: '139580',
    chapter: '紫微鬥數',
    chapterNumber: '卷之一',
    pdfPages: 112,
    sourcePdfBytes: 22720525,
    sourcePdfSha256: 'ae39779b9da3403d10b4548c80d819af9d0b12d1d69bba89b0a120b82fc50760',
    commonsFilePage: 'https://commons.wikimedia.org/wiki/File:NLC892-411999007380-139580_%E7%BA%8C%E9%81%93%E8%97%8F_%E7%AC%AC167%E5%86%8A.pdf',
    pdfUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/46/NLC892-411999007380-139580_%E7%BA%8C%E9%81%93%E8%97%8F_%E7%AC%AC167%E5%86%8A.pdf',
  },
  {
    volume: '第168冊',
    bid: '139581',
    chapter: '紫微鬥數',
    chapterNumber: '卷之二',
    pdfPages: 67,
    sourcePdfBytes: 13309632,
    sourcePdfSha256: '620b91ec07d670a4eec28e7848a2f58a4d921f08dc192060cfb01e0a9a5986c4',
    commonsFilePage: 'https://commons.wikimedia.org/wiki/File:NLC892-411999007380-139581_%E7%BA%8C%E9%81%93%E8%97%8F_%E7%AC%AC168%E5%86%8A.pdf',
    pdfUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/41/NLC892-411999007380-139581_%E7%BA%8C%E9%81%93%E8%97%8F_%E7%AC%AC168%E5%86%8A.pdf',
  },
  {
    volume: '第169冊',
    bid: '139582',
    chapter: '紫微鬥數',
    chapterNumber: '卷之三',
    pdfPages: 74,
    sourcePdfBytes: 14889455,
    sourcePdfSha256: '7b5bfc67bc5729800e222ded2fb6442efdca0d29a335856acc62d9aea1116e67',
    commonsFilePage: 'https://commons.wikimedia.org/wiki/File:NLC892-411999007380-139582_%E7%BA%8C%E9%81%93%E8%97%8F_%E7%AC%AC169%E5%86%8A.pdf',
    pdfUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/NLC892-411999007380-139582_%E7%BA%8C%E9%81%93%E8%97%8F_%E7%AC%AC169%E5%86%8A.pdf',
  },
]

export const NLC_RENDERED_SHA256_BY_PAGE = {
  vol1: {
    1: 'd0cf192727da39b3f075004470ceb8b5bb3375ae9f5d332dd61bac325f08d8a2',
    6: '48f3a3ed47536f71346774c705b92d57ac88d8dfa680fb2bcde155d790f79a05',
    25: 'c603c861634cb8188e1fac2f913a4b43a523729f92f5c19db453fd9ccb8bcab0',
    26: '21f8351e024c733afec86e99210e61092190cd5cd75a3eee5c966bc8e28c32bf',
    27: 'aa217c2ff79abf8b48f7a9354d91f3692f5e2e6c1990b88595591c9adec98dc2',
    28: '6198ecefc36d69677f64e68e0f5265def394f549bdf73eb28357d2f54cfd3687',
    29: 'e0500f08fb82d43cd3bfe01387f65980c5f4634e188dfd68e9791cb27136f48b',
    30: 'cced8bf839732d8fe0ce5a6c5c41ae91f5b7589edef2eab082a89b40a28eebb6',
    31: '48e5df7fd386ac789f4bb73420d4c4398f8c0616a6c93947cba721ac1d5b903f',
    32: '67a4041868e73f237d05fe55c9629f8def2340386c0df3f7c00091019d14645a',
  },
  vol2: {
    1: '682653030d26f7427d4d027c1ac4a949d60605e5b598ad69d3a94afe39f0420e',
    2: 'c5f60dbaded4b9a9aaa2d71afcf7dfffd7cae7f67409fac4fd31c76b4c34fcab',
  },
}
export const NLC_RENDERED_DIMENSIONS_BY_PAGE = {
  vol1: { 1: '1039x2815', 6: '1962x2769', 25: '1962x2769', 26: '1962x2769', 27: '1962x2769', 28: '1962x2769', 29: '1962x2769', 30: '1962x2769', 31: '1962x2769', 32: '1962x2769' },
  vol2: { 1: '990x2741', 2: '1956x2763' },
}

export const INPUT_PATHS = [...new Set([
  ...v12.INPUT_PATHS,
  PREDECESSOR_COMPOSITION,
  PREDECESSOR_COMPOSITION_EVIDENCE,
  DOCUMENTATION_PATH,
  MATERIALIZER_PATH,
  CHECKER_PATH,
  NEGATIVE_CHECKER_PATH,
])]

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const clone = value => structuredClone(value)
const unique = values => [...new Set(values)]
const readJson = (root, path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'))
const fileSha256 = (root, path) => sha256(readFileSync(resolve(root, path)))
const requireValue = (condition, message) => { if (!condition) throw new Error(message) }
const git = (root, args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8' }).trim()
export const canonicalJson = v12.canonicalJson

function repository(root) {
  return {
    branch: git(root, ['branch', '--show-current']),
    currentHead: git(root, ['rev-parse', 'HEAD']),
    originMainHead: git(root, ['rev-parse', 'origin/main']),
  }
}

function predecessorInput(root, options = {}) {
  // v12 is a historical predecessor with its own frozen basis. Replaying it
  // through its historical-reference path preserves that basis while v13
  // still enforces its own exact current-head basis below.
  const generated = v12.buildBundle(root, { ...options, mode: 'historical_reference' })
  const stored = readJson(root, PREDECESSOR_COMPOSITION)
  const storedEvidence = readJson(root, PREDECESSOR_COMPOSITION_EVIDENCE)
  requireValue(canonicalStableArtifactJson(stored) === canonicalStableArtifactJson(generated.artifact), 'v12_predecessor_complete_drift')
  requireValue(canonicalStableArtifactJson(storedEvidence) === canonicalStableArtifactJson(generated.files['evidence.json']), 'v12_predecessor_evidence_drift')
  requireValue(generated.artifact.schemaVersion === v12.SCHEMA, 'unexpected_v12_schema')
  requireValue(JSON.stringify(generated.artifact.graphImpact.successor) === JSON.stringify({ claimCount: 30, sourceCount: 21, observationCount: 58, relationCount: 148, blockerCount: 11 }), 'unexpected_v12_graph_counts')
  return { generated, stored, storedEvidence }
}

function nlcCandidate() {
  return {
    candidateId: CANDIDATE_NLC_1607,
    decision: 'held_outside_graph_nlc_1607_institutional_record_and_direct_official_range_stream_partial_binding',
    directObservationStatus: 'direct_visual_direct_official_range_stream_review_not_ocr',
    directVisualReview: true,
    doesNotEnterGraph: true,
    sourceKind: 'NLC_institutional_catalog_identity_plus_direct_official_range_stream_and_byte_equal_Commons_derivative',
    sourceIdentity: {
      title: '續道藏',
      responsible: '(明)張國祥等編',
      publication: '內府明萬曆35年[1607]',
      edition: '刻本',
      goodBookNumber: '02608',
      indexName: 'data_892',
      identifier: '411999007380',
      collectionVolumes: '第167冊–第169冊',
      treatiseTitle: '紫微鬥數',
      treatiseAuthorStatus: '撰人不詳_not_a_separate_NLC_responsible_field',
      institutionalRecordStatus: 'verified_direct_catalog_html',
      volumeChapterMappingStatus: 'verified_direct_formatCatalog_response',
      sourceAuthority: 'not_established',
      semanticAuthority: 'not_established',
    },
    locators: {
      catalogUrl: NLC_CATALOG_URL,
      viewerUrls: NLC_VIEWER_URLS,
      catalogHtml: { sha256: NLC_CATALOG_HTML_SHA256, bytes: NLC_CATALOG_HTML_BYTES, storedOutsideRepo: true },
      viewerHtmlSha256ByBid: NLC_VIEWER_HTML_SHA256_BY_BID,
      catalogFormatCatalogEndpoint: 'http://read.nlc.cn/allSearch/formatCatalog',
      formatCatalogRequest: { indexName: 'data_892', bidIds: ['139580', '139581', '139582'] },
      volumes: NLC_DERIVATIVE_VOLUMES,
      directVisualReviewPages: { vol1: [1, 6, 25, 26, 27, 28, 29, 30, 31, 32], vol2: [1, 2], vol3: [68, 69, 70, 71, 72] },
      renderedFileSha256ByPage: NLC_RENDERED_SHA256_BY_PAGE,
      renderedDimensionsByPage: NLC_RENDERED_DIMENSIONS_BY_PAGE,
      renderVariant: 'pdftoppm -png -r 220',
      vol3RenderedPageIdentity: 'not_materialized_in_current_temp_review; page locator retained without invented hash',
      officialViewerPdfBytes: {
        accessStatus: 'acquired_direct_official_range_stream',
        readerEndpoint: NLC_OFFICIAL_RANGE_ENDPOINT,
        requestShape: 'fresh viewer session cookie plus tokenKey/myreader header; Range bytes=0-3 then bytes=0-(N-2) plus final byte bytes=(N-1)-(N-1)',
        responseStatus: '206_partial_content',
        pdfHeader: '%PDF',
        contentRangeTotalByBid: NLC_OFFICIAL_CONTENT_RANGE_TOTAL_BY_BID,
        pdfSha256ByBid: NLC_OFFICIAL_PDF_SHA256_BY_BID,
        pdfinfoPagesByBid: NLC_OFFICIAL_PDFINFO_PAGES_BY_BID,
        sourcePdfBytesByBid: NLC_OFFICIAL_CONTENT_RANGE_TOTAL_BY_BID,
        sourceBytesStoredOutsideRepo: true,
        derivativeToOfficialByteEquality: 'verified_exact_byte_compare',
        derivativeToOfficialByteEqualityByBid: { '139580': true, '139581': true, '139582': true },
        methodDocumentReportedTotalByBid: NLC_METHOD_DOCUMENT_REPORTED_TOTAL_BY_BID,
        methodDocumentVol1TotalDiscrepancy: 'method note reported 22720526; direct Content-Range, downloaded file, and pdfinfo report 22720525; direct bytes are authoritative',
      },
      sourceBytesStoredInGit: false,
    },
    directReading: [
      'NLC catalog HTML directly identifies 續道藏, (明)張國祥等編, 內府明萬曆35年[1607], 刻本, 善本書號02608, identifier 411999007380; formatCatalog maps bids 139580/139581/139582 to 紫微鬥數 卷之一/二/三.',
      'The official NLC range reader was directly acquired in fresh viewer sessions. Range response status was 206, the first bytes were %PDF, Content-Range totals were 22720525/13309632/14889455, and pdfinfo reported 112/67/74 pages.',
      'The official NLC PDFs and the three source-marked Commons derivatives are byte-identical for bids 139580/139581/139582. This closes official-vs-derivative byte identity, but not independent physical-witness status or relation to the existing semantic graph.',
      'The supplied download method note reports a one-byte-higher total for each volume; direct Content-Range and completed file bytes were used as the authoritative observed totals.',
      'Volume 1 p1 visibly reads 紫微斗數卷之一; p6 visibly contains 四排星辰 and 八書化曜 procedural surfaces.',
      'Volume 1 p25-p28 visibly contain rectangular/ruled chart and star-table surfaces. A 子 token and 紫微 are visible in the reviewed grid surface, but no same-frame palace-name label, complete perimeter, or production ordinal was observed.',
      'Volume 1 p29-p32 directly show 起紫微例, 起天杖例, 起天刑例, 起天哭例, 安命例, 安身例, 起大限例, and 起小運例 rule surfaces. Watermark and page layout obscure or complicate some glyphs; no modern normalization is applied.',
      'Volume 2 p1 visibly reads 紫微斗數卷之二 and p2 visibly includes 凡看命，先定身宮 / 身宮 emphasis. This is a direct precedence statement, not a complete 身主/命主 placement table.',
      'Volume 3 p68-p72 were reviewed as a continuation locator; no reviewed page was used to invent a complete five-field binding.',
      'The reviewed witness presents a historical 十八飛星-like star/rule surface, including names such as 紫微, 紅鸞, 天虛, 天庫, 天貴, 天貫, 天印, 文昌, 天壽, 天福, 天祿, 天空, and additional visible variants. It is not treated as equivalent to the modern 14 major-star system.',
      'OCR/text extraction is not canonical evidence. The raw strings below are direct visual locator transcriptions with uncertainty retained where watermark, glyph variant, or page layout prevents a safe reading.',
    ],
    rawVisibleText: [
      { volume: '第167冊', pdfPage: 6, heading: 'procedural sequence', visibleText: '四排星辰', status: 'direct_visual_confirmed', uncertainty: 'surrounding sequence is not normalized' },
      { volume: '第167冊', pdfPage: 6, heading: 'procedural sequence', visibleText: '八書化曜', status: 'direct_visual_confirmed', uncertainty: 'surrounding sequence is not normalized' },
      { volume: '第167冊', pdfPage: 25, heading: '術天機', visibleText: '術天機', status: 'direct_visual_confirmed', uncertainty: 'page watermark crosses the ruled surface' },
      { volume: '第167冊', pdfPage: 25, heading: 'grid surface', visibleText: '自子生起順', status: 'direct_visual_partial', uncertainty: 'kept as visually read; no modern formula reconstruction' },
      { volume: '第167冊', pdfPage: 25, heading: 'grid cell', visibleText: '子／紫微', status: 'direct_visual_partial', uncertainty: 'token and star are observed in the same local cell surface; no palace name or production slot is assigned' },
      { volume: '第167冊', pdfPage: 29, heading: '起紫微例', visibleText: '從未上順數子遇着生年便布紫', status: 'direct_visual_partial', uncertainty: 'watermark/page layout; retained without modern punctuation or inferred final star name' },
      { volume: '第167冊', pdfPage: 29, heading: '起紫微例', visibleText: '從未上起子順數至本人生年安紫逆', status: 'direct_visual_partial', uncertainty: 'retained as locator transcription; no branch-to-slot result inferred' },
      { volume: '第167冊', pdfPage: 30, heading: '起天杖例', visibleText: '從子上起正月逆數至本人生月安杖逆布異毛又', status: 'direct_visual_partial', uncertainty: 'the trailing star sequence is not normalized to later names; watermark crosses the page' },
      { volume: '第167冊', pdfPage: 30, heading: '起天刑例', visibleText: '凡起天刑從酉上起正月順數至本人生月', status: 'direct_visual_confirmed', uncertainty: 'resulting slot is not declared in the reviewed frame' },
      { volume: '第167冊', pdfPage: 30, heading: '起天哭例', visibleText: '凡起天哭與本人生年相合安哭／如子年生丑上安哭', status: 'direct_visual_partial', uncertainty: 'slash separates two visible rule lines; no modern branch-slot normalization' },
      { volume: '第167冊', pdfPage: 31, heading: '安命例', visibleText: '杖星宮裏起生時順數卯處安命之', status: 'direct_visual_partial', uncertainty: 'watermark and vertical layout; local anchor is retained, not converted to a modern chart coordinate' },
      { volume: '第167冊', pdfPage: 31, heading: '安身例', visibleText: '單從杖上起初一不問陰陽男女逆／兩日之半行一宮數至生日身宮住', status: 'direct_visual_partial', uncertainty: 'two visible rule lines; no production ordinal inferred' },
      { volume: '第167冊', pdfPage: 31, heading: '安身例', visibleText: '從杖上逆數一宮兩日半五日二宮', status: 'direct_visual_partial', uncertainty: 'continuation is partly obscured; ellipsis is not filled' },
      { volume: '第167冊', pdfPage: 32, heading: '起大限例', visibleText: '陽男陰女從命宮順數十年行一宮', status: 'direct_visual_confirmed', uncertainty: 'no named palace-to-physical slot map in the frame' },
      { volume: '第167冊', pdfPage: 32, heading: '起大限例', visibleText: '陰男陽女從申宮逆數十年行一宮', status: 'direct_visual_partial', uncertainty: 'watermark crosses the text; preserved as direct rule surface' },
      { volume: '第167冊', pdfPage: 32, heading: '起小運例', visibleText: '一年一宮', status: 'direct_visual_confirmed', uncertainty: 'surrounding exception row is not fully normalized' },
      { volume: '第167冊', pdfPage: 32, heading: 'exception row', visibleText: '初三、初八、十三、十八、二十三、二十八／午時不過宮，未時過宮', status: 'direct_visual_partial', uncertainty: 'punctuation and adjacent glyphs are locator aids only' },
      { volume: '第168冊', pdfPage: 2, heading: '太乙金井局陰陽玄妙論', visibleText: '凡看命先定身宮／身宮', status: 'direct_visual_confirmed', uncertainty: 'interpretive precedence statement, not a 身主 table' },
    ],
    ruleDossier: [
      { ruleId: 'nlc1607-p6-procedure', locator: '第167冊 PDF p6', input: 'procedural step', anchor: null, direction: null, sequence: '四排星辰 → 八書化曜', resultingBranchOrSlot: 'not stated in reviewed locator', modernComparison: 'direct_commonality', confidence: 'direct_visual_strong' },
      { ruleId: 'nlc1607-p29-ziwei', locator: '第167冊 PDF p29 / 起紫微例', input: '生年', anchor: '未', direction: '先順數至子，再逆布紫', sequence: '從未上順數子遇着生年便布紫', resultingBranchOrSlot: '紫微 result visible; resulting production slot not stated', modernComparison: 'non_comparable', confidence: 'direct_visual_partial' },
      { ruleId: 'nlc1607-p30-tianzhang', locator: '第167冊 PDF p30 / 起天杖例', input: '生月', anchor: '子', direction: '逆數', sequence: '從子上起正月逆數至本人生月安杖逆布異毛又', resultingBranchOrSlot: '天杖 and a secondary star sequence are visible; exact terminal slot not stated', modernComparison: 'historical_difference', confidence: 'direct_visual_partial' },
      { ruleId: 'nlc1607-p30-tianxing', locator: '第167冊 PDF p30 / 起天刑例', input: '生月', anchor: '酉', direction: '順數', sequence: '凡起天刑從酉上起正月順數至本人生月', resultingBranchOrSlot: '天刑 result; terminal slot not stated', modernComparison: 'historical_difference', confidence: 'direct_visual_strong' },
      { ruleId: 'nlc1607-p30-tianku', locator: '第167冊 PDF p30 / 起天哭例', input: '生年地支', anchor: '相合', direction: '合', sequence: '凡起天哭與本人生年相合安哭；如子年生丑上安哭', resultingBranchOrSlot: '丑 example anchor is visible; no named palace or production slot', modernComparison: 'historical_difference', confidence: 'direct_visual_partial' },
      { ruleId: 'nlc1607-p31-ming', locator: '第167冊 PDF p31 / 安命例', input: '生時', anchor: '杖星宮', direction: '順數', sequence: '杖星宮裏起生時順數卯處安命之', resultingBranchOrSlot: '安命 result; no perimeter slot identity', modernComparison: 'unresolved', confidence: 'direct_visual_partial' },
      { ruleId: 'nlc1607-p31-shen', locator: '第167冊 PDF p31 / 安身例', input: '生日', anchor: '杖', direction: '逆數; 兩日之半行一宮', sequence: '單從杖上起初一不問陰陽男女逆；兩日之半行一宮數至生日身宮住', resultingBranchOrSlot: '身宮 result; no production ordinal', modernComparison: 'historical_difference', confidence: 'direct_visual_partial' },
      { ruleId: 'nlc1607-p32-daxian', locator: '第167冊 PDF p32 / 起大限例', input: 'gender and yin-yang', anchor: '命宮 or 申宮', direction: '陽男陰女順; 陰男陽女逆', sequence: '十年行一宮', resultingBranchOrSlot: '大限 movement rule; no named physical slot', modernComparison: 'non_comparable', confidence: 'direct_visual_partial' },
      { ruleId: 'nlc1607-p32-xiaoyun', locator: '第167冊 PDF p32 / 起小運例', input: 'gender and age', anchor: 'not fully visible in sampled frame', direction: 'rule surface includes reverse/forward exception language', sequence: '一年一宮; 午時不過宮，未時過宮', resultingBranchOrSlot: '小運 movement rule; no production slot', modernComparison: 'non_comparable', confidence: 'direct_visual_partial' },
      { ruleId: 'nlc1607-p2-shen-precedence', locator: '第168冊 PDF p2 / 太乙金井局陰陽玄妙論', input: '看命', anchor: '身宮', direction: null, sequence: '先定身宮', resultingBranchOrSlot: '身宮 is stated as an early determination; no placement coordinate', modernComparison: 'unresolved', confidence: 'direct_visual_strong' },
    ],
    bindingMatrix: {
      branchToken: 'partial_direct_branch_token_in_local_grid_surface',
      palaceName: 'not_observed_in_same_frame_as_grid',
      physicalSlot: 'partial_direct_rectangular_grid_cell_without_named_palace_mapping',
      ordinalDirection: 'direct_rule_direction_surface_but_not_production_ordinal',
      workedExample: 'partial_direct_rule_examples_without_named_physical_slot',
      fullBinding: false,
      productionOrdinal: false,
      semanticAuthority: false,
    },
    lineage: {
      institutionalRecordVerified: true,
      sourceIdentityEstablished: true,
      volumeChapterMappingVerified: true,
      targetSectionPresent: true,
      publicationDateEstablished: true,
      directDerivativeReview: true,
      officialPdfBytesAcquired: true,
      officialStreamIdentityVerified: true,
      derivativeToOfficialByteEqualityEstablished: true,
      independentPhysicalWitness: false,
      relationToExistingGraph: 'not_adjudicated',
      textualLineage: 'unresolved',
      sourceAuthority: 'not_established',
      semanticAuthority: 'not_established',
      graphAdmission: false,
    },
    doesNotEstablish: [
      'independent_physical_witness_admission_relative_to_existing_graph',
      'source_authority_or_semantic_authority',
      'complete_palace_name_to_branch_token_binding',
      'palace_name_to_physical_chart_slot',
      'production_ordinal',
      'modern_14_major_star_equivalence_of_the_visible_18_star_surface',
      'single_frame_five_field_binding',
      'readiness_or_activation',
    ],
  }
}

function frontierObservation(candidate) {
  return {
    observationId: OBSERVATION_NLC_1607,
    candidateId: candidate.candidateId,
    directVisualFindings: [
      'Institutional catalog and bid-to-volume/chapter mapping are directly verified for 續道藏, identifier 411999007380, bids 139580-139582.',
      'Official NLC range-stream PDFs for 第167–169冊 are directly acquired, hashed, and page-count verified; exact byte equality with the source-marked Commons derivatives is confirmed.',
      '第167冊 p25-p32 directly add a branch/grid component and rule surfaces for 紫微, 天杖, 天刑, 天哭, 安命, 安身, 大限, and 小運, without a complete palace-name/slot/ordinal frame.',
      '第168冊 p2 directly adds a 身宮 precedence statement; it does not provide a 身主 table or production coordinate.',
    ],
    fourFieldBinding: candidate.bindingMatrix,
    locator: candidate.locators,
    graphAdmission: false,
    sourceAdmission: false,
    semanticAuthority: false,
    readinessImpact: 'none; existing readiness remains not_safe_to_start',
    directObservationStatus: candidate.directObservationStatus,
  }
}

function updateFrontier(previous, candidate, observation) {
  const frontier = clone(previous.lineageAssessment.researchFrontier)
  frontier.schemaVersion = SCHEMA + '-research-frontier-v0'
  frontier.status = 'nlc_1607_institutional_record_and_direct_official_range_stream_no_graph_admission'
  frontier.researchSessionDate = '2026-08-13'
  frontier.candidates = [...clone(frontier.candidates), candidate]
  frontier.frontierOnlySources = unique([...(frontier.frontierOnlySources || []), candidate.candidateId])
  frontier.frontierOnlyObservations = [...(frontier.frontierOnlyObservations || []), observation]
  frontier.admissionBoundary = `${frontier.admissionBoundary}; v13 verifies the NLC 1607 institutional record and directly acquires the official range-stream PDFs for all three 紫微鬥數 volumes, with exact byte equality to the source-marked Commons derivatives. Independent physical-witness status, relation to the existing graph, and the direct grid/rule surfaces' palace-name, production-ordinal, and semantic-authority boundaries remain unresolved. The candidate remains outside the graph.`
  frontier.graphImpact = {
    ...clone(frontier.graphImpact),
    claimsAdded: 0,
    sourcesAdded: [],
    observationsAdded: [],
    relationsAdded: [],
    blockersClosed: [],
    independentPhysicalWitnessesAdmitted: 0,
  }
  return frontier
}

function updateEvidence(previous, frontier, candidate, observation) {
  const evidence = clone(previous.evidence)
  evidence.schemaVersion = SCHEMA + '-evidence-v0'
  evidence.authorityBoundary = 'v13 directly verifies the NLC institutional catalog identity and volume mapping, acquires the official range-stream PDFs, verifies their hashes/pages, and verifies exact byte equality with the source-marked derivative PDFs. Source authority, independent physical-witness admission, relation to the existing graph, palace-name to physical-slot binding, production ordinal, semantic authority, readiness, and activation remain unestablished.'
  evidence.researchFrontier = frontier
  evidence.frontierOnlyObservations = frontier.frontierOnlyObservations
  evidence.heldOutDirectScanReview = {
    ...clone(previous.evidence.heldOutDirectScanReview),
    candidateIds: [...(previous.evidence.heldOutDirectScanReview?.candidateIds || []), candidate.candidateId],
    candidates: [...(previous.evidence.heldOutDirectScanReview?.candidates || []), candidate],
    graphAdmission: 'none',
    independentWitnessesAdmitted: 0,
    fullBindingCount: 0,
  }
  evidence.v13Nlc1607Review = {
    candidateIds: [candidate.candidateId],
    observationIds: [observation.observationId],
    institutionalRecordVerified: true,
    volumeChapterMappingVerified: true,
    officialPdfBytesAcquired: true,
    officialStreamIdentityVerified: true,
    derivativePdfIdentitiesVerified: true,
    derivativeToOfficialByteEqualityEstablished: true,
    officialContentRangeTotalByBid: NLC_OFFICIAL_CONTENT_RANGE_TOTAL_BY_BID,
    officialPdfSha256ByBid: NLC_OFFICIAL_PDF_SHA256_BY_BID,
    officialPdfinfoPagesByBid: NLC_OFFICIAL_PDFINFO_PAGES_BY_BID,
    graphAdmission: false,
    independentWitnessesAdmitted: 0,
    fullBindingCount: 0,
    sourceAuthorityPromoted: false,
    semanticAuthorityPromoted: false,
  }
  evidence.reportedNonObservations = unique([
    ...(evidence.reportedNonObservations || []),
    'The NLC catalog record and bid-to-volume mapping are direct institutional observations; they do not by themselves establish page-level source authority or semantic authority.',
    'Official NLC PDF bytes were acquired through the fresh-session getReaderRangeNew Range flow; all three official streams are byte-identical to the corresponding source-marked Commons derivatives. The official stream is not counted as a second independent physical witness.',
    'The supplied method note reports one byte above each direct Content-Range total; the direct 206 response, completed file length, and pdfinfo result are retained as the authoritative observed totals.',
    'NLC 第167冊 p25-p28 supplies a local branch-token/grid component, but the reviewed frame does not show a palace name joined to that cell or declare a production ordinal.',
    'NLC 第167冊 p29-p32 supplies direct historical rule surfaces and direction/step language, but rule direction is not a production ordinal or a physical chart orientation.',
    'The visible 18-star surface is not normalized into, or asserted equivalent to, the modern 14 major-star system.',
    'No v13 observation closes source authority, independent physical-witness admission, five-field semantic binding, semantic authority, readiness, or activation.',
  ])
  return evidence
}

function frontierBindingRow(candidate) {
  return {
    candidateId: candidate.candidateId,
    role: 'held_out_nlc_1607_institutional_derivative_rule_and_grid_surface',
    sourceAdmission: false,
    independentHistoricalWitness: false,
    branchToken: candidate.bindingMatrix.branchToken,
    palaceName: candidate.bindingMatrix.palaceName,
    physicalSlot: candidate.bindingMatrix.physicalSlot,
    ordinalDirection: candidate.bindingMatrix.ordinalDirection,
    workedExample: candidate.bindingMatrix.workedExample,
    fullBinding: false,
    productionOrdinal: false,
    semanticAuthority: false,
  }
}

function updateBindingMatrix(previous, candidate) {
  const matrix = clone(previous.bindingMatrix)
  matrix.schemaVersion = SCHEMA + '-binding-matrix-v0'
  matrix.researchFrontierBoundary = {
    ...clone(matrix.researchFrontierBoundary),
    reviewedCandidateCount: (matrix.researchFrontierBoundary?.reviewedCandidateCount || 0) + 1,
    heldOutDirectScanCandidateCount: (matrix.researchFrontierBoundary?.heldOutDirectScanCandidateCount || 0) + 1,
    sameRecordFollowupCount: matrix.researchFrontierBoundary?.sameRecordFollowupCount || 1,
    admittedCandidateCount: 0,
    directSingleWitnessFullBindingCount: 0,
    productionOrdinalBindingCount: 0,
    semanticAuthorityCount: 0,
    partialBranchGridReviewCount: (matrix.researchFrontierBoundary?.partialBranchGridReviewCount || 0) + 1,
    directRuleSurfaceReviewCount: (matrix.researchFrontierBoundary?.directRuleSurfaceReviewCount || 0) + 1,
    status: 'nlc_1607_institutional_record_and_direct_official_range_stream_no_graph_admission',
  }
  matrix.frontierOnlyBindingRows = [...(matrix.frontierOnlyBindingRows || []), frontierBindingRow(candidate)]
  matrix.composition.additionalDirectWitnessLimitations = [
    ...clone(matrix.composition.additionalDirectWitnessLimitations),
    'v13 NLC 1607 catalog identity, three-volume chapter mapping, official range-stream PDF identities, and exact byte equality with the source-marked derivatives are directly verified; the stream/derivative pair is still not an independent physical witness of the existing graph.',
    'v13 NLC 第167冊 p25-p28 directly adds a local branch-token/grid component and p29-p32 adds historical rule surfaces; no same-frame palace-name to physical-slot or production-ordinal join is observed.',
    'v13 NLC direction/step rules and the 第168冊 身宮 precedence statement are historical rule observations, not semantic authority or modern 14-major-star equivalence.',
  ]
  matrix.composition.unprovenJoinPremises = unique([
    ...clone(matrix.composition.unprovenJoinPremises),
    'The NLC official stream/Commons byte-equality result closes file identity for the three acquired volume pairs, but it does not establish independent physical provenance or semantic authority.',
    'The NLC 1607 local grid cell uses the same coordinate frame as the existing named-palace and Nanbei perimeter components.',
    'The NLC rule directions or step counts declare a repository production ordinal or physical chart orientation.',
    'The visible NLC 18-star surface is historically equivalent to the modern 14 major-star system.',
  ])
  return matrix
}

function updateLineage(previous, frontier, candidate) {
  const lineage = clone(previous.lineageAssessment)
  lineage.schemaVersion = SCHEMA + '-lineage-v0'
  lineage.researchFrontier = frontier
  lineage.frontierLineageAssessments = [
    ...(lineage.frontierLineageAssessments || []),
    {
      candidateId: candidate.candidateId,
      institutionalRecordVerified: true,
      volumeChapterMappingVerified: true,
      targetSectionPresent: true,
      publicationDateEstablished: true,
      directDerivativeReview: true,
      officialPdfBytesAcquired: true,
      officialStreamIdentityVerified: true,
      derivativeToOfficialByteEqualityEstablished: true,
      independentPhysicalWitness: false,
      relationToExistingGraph: 'not_adjudicated',
      textualLineage: 'unresolved',
      semanticAuthority: 'not_established',
      graphAdmission: false,
    },
  ]
  lineage.sourceIdentityStatus = `${previous.lineageAssessment.sourceIdentityStatus}; v13 directly verifies the NLC 1607 續道藏 catalog identity, bid-to-volume mapping, official range-stream PDF bytes, and exact equality with the corresponding source-marked derivatives, while relation to the existing graph remains unresolved`
  lineage.independenceStatus = 'No v13 candidate is admitted as an independent target witness: the NLC institutional record and official range-stream bytes are verified, and the Commons derivatives are exact duplicates of those bytes; independent physical provenance relative to the existing graph and the semantic coordinate relation remain unresolved.'
  lineage.independentWitnessStatus = 'not_admitted'
  lineage.physicalWitnessCandidatesAdded = unique([...(previous.lineageAssessment.physicalWitnessCandidatesAdded || []), SOURCE_ID_NLC_1607])
  lineage.frontierCandidateReview = {
    ...clone(previous.lineageAssessment.frontierCandidateReview),
    candidateIds: unique([...(previous.lineageAssessment.frontierCandidateReview?.candidateIds || []), candidate.candidateId]),
    directReview: true,
    graphAdmission: false,
    fullBindingCount: 0,
    independentWitnessCount: 0,
    publicationDateResolvedCount: (previous.lineageAssessment.frontierCandidateReview?.publicationDateResolvedCount || 0) + 1,
    targetSectionPresentCount: (previous.lineageAssessment.frontierCandidateReview?.targetSectionPresentCount || 0) + 1,
    falsePositiveCount: previous.lineageAssessment.frontierCandidateReview?.falsePositiveCount || 1,
  }
  lineage.earlierEdition1871 = {
    ...clone(previous.lineageAssessment.earlierEdition1871),
    textualLineageClosed: false,
    catalogFormatComparisonDirectBytes: false,
    v13DirectCandidateReview: {
      nlcInstitutionalRecordVerified: true,
      nlcOfficialPdfBytesAcquired: true,
      nlcOfficialStreamIdentityVerified: true,
      nlcDerivativeScanReviewed: true,
      derivativeToOfficialByteEqualityEstablished: true,
      target1871IdentityResolved: false,
    },
  }
  return lineage
}

function updateFieldKit(previous, evidencePath, observationId) {
  const fieldKit = clone(previous.fieldKitImpact)
  fieldKit.schemaVersion = SCHEMA + '-field-kit-v0'
  fieldKit.targetReassessment = fieldKit.targetReassessment.map(item => {
    if (item.targetId === 'acq-distinct-witness-identity-lineage') return { ...item, newEvidenceRole: 'v13 verifies the NLC institutional record, three-volume mapping, official range-stream PDF bytes, and exact equality with the source-marked derivatives; independent physical provenance relative to the existing graph remains open', evidenceRefs: unique([...(item.evidenceRefs || []), evidencePath]), statusBefore: item.statusAfter, statusAfter: item.statusAfter, statusChanged: false, closure: 'not_closed' }
    if (item.targetId === 'acq-palace-semantic-map-and-coordinate-witness') return { ...item, newEvidenceRole: 'v13 adds a direct local branch/grid component and historical rule surfaces, but no same-frame palace-name physical slot or production ordinal; the coordinate witness remains action_required', evidenceRefs: unique([...(item.evidenceRefs || []), evidencePath]), statusBefore: item.statusAfter, statusAfter: item.statusAfter, statusChanged: false, closure: 'not_closed' }
    if (item.targetId === 'acq-tianfu-anchor-direction-adjudicator') return { ...item, newEvidenceRole: 'v13 records an 18-star-like historical surface and rule directions without a Tianfu anchor adjudication or semantic authority', evidenceRefs: unique([...(item.evidenceRefs || []), evidencePath]), statusBefore: item.statusAfter, statusAfter: item.statusAfter, statusChanged: false, closure: 'not_closed' }
    return item
  })
  fieldKit.heldEvidenceUpdate = 'v13 records a directly verified NLC institutional record, official range-stream PDFs, and exact equality with the source-marked derivatives for 續道藏 第167–169冊 紫微鬥數 卷一–三. The stream/derivative pair is not admitted as an independent physical witness; direct grid and rule surfaces do not close the five-field binding, source authority, semantic authority, readiness, or activation.'
  fieldKit.evidenceObservationIds = unique([...(fieldKit.evidenceObservationIds || []), observationId])
  fieldKit.researchFrontier = {
    ...fieldKit.researchFrontier,
    evidenceRefs: unique([...(fieldKit.researchFrontier?.evidenceRefs || []), evidencePath]),
    reviewedCandidateCount: (fieldKit.researchFrontier?.reviewedCandidateCount || 0) + 1,
    heldOutDirectScanCandidateCount: (fieldKit.researchFrontier?.heldOutDirectScanCandidateCount || 0) + 1,
    sameRecordFollowupCount: fieldKit.researchFrontier?.sameRecordFollowupCount || 1,
    admittedCandidateCount: 0,
    graphAdmittedFrontierCandidateCount: fieldKit.researchFrontier?.graphAdmittedFrontierCandidateCount || 0,
    status: 'nlc_1607_institutional_record_and_direct_official_range_stream_no_graph_admission',
  }
  fieldKit.semanticTargetStillOpen = true
  fieldKit.sourceIdentityTargetStillActionRequired = true
  fieldKit.rightsTargetStillHumanPolicyReview = true
  return fieldKit
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
  const candidate = nlcCandidate()
  const observation = frontierObservation(candidate)
  const frontier = updateFrontier(previous, candidate, observation)
  const evidencePath = ARTIFACT_DIR + '/evidence.json'
  const evidence = updateEvidence(previous, frontier, candidate, observation)
  const bindingMatrix = updateBindingMatrix(previous, candidate)
  const lineageAssessment = updateLineage(previous, frontier, candidate)
  const fieldKitImpact = updateFieldKit(previous, evidencePath, OBSERVATION_NLC_1607)
  const previousGraph = previous.graphImpact.successor
  const protectedAsset = clone(previous.preservation.protectedAsset)
  requireValue(protectedAsset.exists, 'protected_source_derived_asset_missing')
  requireValue(protectedAsset.byteSha256 === fileSha256(root, PROTECTED_ASSET_PATH), 'protected_source_derived_asset_changed')
  const blockerStatusCounts = clone(previous.graphImpact.blockerStatusCounts)

  const completeBase = {
    ...clone(previous),
    schemaVersion: SCHEMA,
    verdictToken: VERDICT,
    observedHead: repo.currentHead,
    originMainHead: repo.originMainHead,
    basisHead: BASIS_HEAD,
    branch: repo.branch,
    scope: {
      ...clone(previous.scope),
      purpose: 'additive NLC 1607 institutional-record and direct official range-stream review with exact derivative equality; no graph, source, semantic, readiness, or activation promotion',
      heldOutResearchCandidateCount: (previous.scope.heldOutResearchCandidateCount || 0) + 1,
      physicalWitnessCandidatesAdded: (previous.scope.physicalWitnessCandidatesAdded || 0) + 1,
      researchCandidatesAdmitted: previous.scope.researchCandidatesAdmitted,
      sameRecordFollowupReviewPerformed: true,
      heldOutDirectScanReviewPerformed: true,
      heldOutDirectScanCandidateCount: (previous.scope.heldOutDirectScanCandidateCount || 0) + 1,
      externalDirectScanReviewPerformed: true,
      historical1871ScanObtained: false,
      directSingleWitnessFullBindingEstablished: false,
      independentWitnessesAdmitted: 0,
      sourceAuthorityPromoted: false,
      semanticAuthorityPromoted: false,
    },
    predecessorChain: [
      ...clone(previous.predecessorChain),
      { path: PREDECESSOR_COMPOSITION, schemaVersion: previous.schemaVersion, byteSha256: fileSha256(root, PREDECESSOR_COMPOSITION) },
      { path: PREDECESSOR_COMPOSITION_EVIDENCE, schemaVersion: predecessor.storedEvidence.schemaVersion, byteSha256: fileSha256(root, PREDECESSOR_COMPOSITION_EVIDENCE) },
    ],
    sourceLineage: {
      ...clone(previous.sourceLineage),
      researchFrontierOnlySources: unique([...(previous.sourceLineage.researchFrontierOnlySources || []), candidate.candidateId]),
      physicalWitnessCandidatesAdded: lineageAssessment.physicalWitnessCandidatesAdded,
      sameRecordFollowupCandidate: previous.sourceLineage.sameRecordFollowupCandidate,
      independentPhysicalWitnessesAdmitted: 0,
      sourceAuthority: 'not_established',
      semanticAuthority: 'not_established',
      independenceStatus: lineageAssessment.independenceStatus,
      sourceIdentityStatus: lineageAssessment.sourceIdentityStatus,
    },
    evidence,
    observations: clone(previous.observations),
    relations: clone(previous.relations),
    claimReconciliation: clone(previous.claimReconciliation),
    blockerReassessment: clone(previous.blockerReassessment),
    bindingMatrix,
    lineageAssessment,
    fieldKitImpact,
    graphImpact: {
      predecessor: clone(previousGraph),
      additive: { claimCount: 0, sourceCount: 0, physicalWitnessCount: 0, observationCount: 0, relationCount: 0, blockerCount: 0 },
      successor: clone(previousGraph),
      claimsAdded: 0,
      sourcesAdded: [],
      physicalWitnessesAdded: [],
      independentPhysicalWitnessesAdmitted: 0,
      addedObservationIds: [],
      addedRelationIds: [],
      blockersClosed: [],
      blockersStillOpen: clone(previous.graphImpact.blockersStillOpen),
      blockerStatusCounts,
      researchFrontier: {
        ...clone(previous.graphImpact.researchFrontier),
        sourcesAdded: [],
        observationsAdded: [],
        relationsAdded: [],
        blockersClosed: [],
        claimsAdded: 0,
        independentPhysicalWitnessesAdmitted: 0,
      },
    },
    claimImpact: {
      ...clone(previous.claimImpact),
      claimsAdded: 0,
      claimsPromoted: 0,
      directSemanticClaimSupportAdded: [],
      researchFrontierClaimsAdded: 0,
      researchFrontierSemanticSupportAdded: 0,
      semanticAuthorityCount: 0,
      boundedComponentEvidenceAdded: unique([...(previous.claimImpact.boundedComponentEvidenceAdded || []), 'direct_nlc_1607_partial_branch_grid', 'direct_nlc_1607_eighteen_star_rule_surface']),
      boundary: 'v13 records NLC 1607 institutional identity, direct official range-stream PDF bytes, exact derivative equality, a partial branch/grid surface, and historical rule surfaces outside the semantic graph. Palace-name physical slot, production ordinal, independent witness admission, and modern 14-major-star equivalence remain unestablished.',
    },
    blockerImpact: {
      ...clone(previous.blockerImpact),
      blockersClosed: [],
      blockerStatusChanges: [],
      resolvedSubBoundaries: [
        ...clone(previous.blockerImpact.resolvedSubBoundaries),
        'NLC 1607 institutional catalog identity and 第167–169冊 / 紫微鬥數 卷一–三 mapping are directly verified, but this does not close source or semantic authority',
        'NLC 第167冊 p25-p28 directly supplies a local branch-token/grid component and p29-p32 supplies historical rule surfaces; palace-name, physical-slot, production-ordinal, and coordinate-frame joins remain open',
        'NLC 第168冊 p2 directly records 先定身宮 precedence, but it is not a 身主 table or a production coordinate',
        'Official NLC range-stream PDF access and exact equality with the source-marked Commons derivatives are directly verified; the duplicated stream/derivative pair does not close independent physical provenance or semantic authority',
      ],
      resolvedSubBoundaryIsNotTopLevelClosure: true,
    },
    readinessImpact: {
      ...clone(previous.readinessImpact),
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
      ...clone(previous.preservation),
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
      ...clone(previous.deterministicContract),
      sourceBytes: 'v13 records fixed NLC catalog/viewer HTML hashes, direct official getReaderRangeNew Content-Range totals and PDF SHA-256/page identities for NLC 139580/139581/139582, exact equality with the source-marked derivative PDFs, and selected rendered-page hashes. Materialization performs no network acquisition; OCR/text extraction is locator-only.',
      network: 'forbidden_during_materialization',
      ocr: 'not used as canonical text; direct visual findings are fixed evidence metadata and OCR/text extraction is locator-only',
      noAutomaticPromotion: true,
    },
    negativeContract: {
      ...clone(previous.negativeContract),
      rejects: unique([
        ...previous.negativeContract.rejects,
        'promoting the NLC institutional catalog identity into source authority or semantic authority because the record and volume mapping are verified',
        'treating exact equality between the official NLC stream and a source-marked Commons derivative as proof of an independent physical witness or semantic authority',
        'treating NLC p25-p28 local branch/grid surfaces as a palace-name physical slot or production ordinal',
        'treating NLC p29-p32 rule direction/step text or 第168冊 p2 身宮 precedence as modern 14-major-star equivalence or semantic authority',
        'promoting the v13 NLC candidate into graph sources, observations, relations, claims, readiness, or activation',
      ]),
    },
    materializer: MATERIALIZER_PATH,
    checker: CHECKER_PATH,
    negativeChecker: NEGATIVE_CHECKER_PATH,
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
        researchFrontierAdmission: 'held_outside_graph_nlc_1607_institutional_record_and_direct_official_range_stream',
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
    predecessorSchema: v12.SCHEMA,
    counts: result.artifact.graphImpact.successor,
    graphAdditive: result.artifact.graphImpact.additive,
    heldOutCandidateId: CANDIDATE_NLC_1607,
    heldOutDirectScanCandidateCount: result.artifact.scope.heldOutDirectScanCandidateCount,
    directSingleWitnessFullBindingCount: result.artifact.bindingMatrix.coverage.directSingleWitnessFullBindingCount,
    productionOrdinalBindingCount: result.artifact.bindingMatrix.coverage.productionOrdinalBindingCount,
    independentPhysicalWitnessesAdmitted: result.artifact.graphImpact.independentPhysicalWitnessesAdmitted,
    blockersClosed: result.artifact.graphImpact.blockersClosed,
    completeByteSha256: result.completeSha256,
  }, null, 2))
}
