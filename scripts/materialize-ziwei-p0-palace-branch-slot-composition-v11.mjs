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
import * as v10 from './materialize-ziwei-p0-palace-branch-slot-composition-v10.mjs'

export const SCHEMA = 'ziwei-p0-palace-branch-slot-composition-v11'
export const VERDICT = 'complete_ziwei_palace_branch_slot_composition_with_same_record_followup_and_held_out_direct_scan_frontier_derived_not_authoritative'
export const MATERIALIZER_VERSION = '11.0.0'
export const BASIS_HEAD = v10.BASIS_HEAD
export const MATERIALIZER_PATH = 'scripts/materialize-' + SCHEMA + '.mjs'
export const ARTIFACT_DIR = 'artifacts/' + SCHEMA
export const ARTIFACT_PATH = ARTIFACT_DIR + '/complete.json'
export const ROOT = resolve(new URL('..', import.meta.url).pathname)

export const PREDECESSOR_COMPOSITION = v10.ARTIFACT_PATH
export const PREDECESSOR_COMPOSITION_EVIDENCE = v10.ARTIFACT_DIR + '/evidence.json'
export const PROTECTED_ASSET_PATH = v10.PROTECTED_ASSET_PATH
export const DOCUMENTATION_PATH = 'docs/ziwei-p0-palace-branch-slot-composition-v11.md'

export const CANDIDATE_JSG = 'candidate-jsg-lib169174-pc9a23-ziwei-doushu-buyi'
export const CANDIDATE_IA = 'candidate-ia-20260506-nanyang-public-mirror'
export const CANDIDATE_NAOJ = 'candidate-nara-4468520-4469314-chart-example-frontier'
export const OBSERVATION_JSG = 'frontier-obs-jsg-lib169174-ruled-manuscript-scan'
export const OBSERVATION_IA = 'frontier-obs-ia-20260506-nanyang-page-samples'
export const OBSERVATION_NAOJ = 'frontier-obs-nara-1078787-same-record-followup'

export const JSG_RECORD_URL = 'https://jsg.aks.ac.kr/dir/view?catePath=%EC%88%98%EC%A7%91%EB%B6%84%EB%A5%98&dataId=LIB_169174'
export const JSG_PDF_URL = 'https://jsg.aks.ac.kr/data/serviceFiles/pdf/PC9A-23_001.pdf'
export const JSG_PDF_SHA256 = '398463d7e211811cfdf23dfaf95423c7beed27a56122942dbef429a8ce190423'
export const JSG_PDF_BYTES = 4712407
export const JSG_PDF_PAGES = 32
export const JSG_RENDER_DPI = 200
export const JSG_RENDER_SHA256_BY_PAGE = {
  3: '2f6f5533cc7ae3c0d8da987eabdc2998694a3f7503fbed72988217b6e3360ed5',
  16: '8b1691741704ae9d09081b21437315b94911419d34f4850d57f2e6f77846532a',
  17: '6b094695b2279a111aeb1d116f4a69fe6696bbe23f81927154680936e320f21c',
  31: '179c9d4b4a72e0bc713a62343b5243d19daeb15ae86425ced61693eb926e06d6',
}
export const JSG_RENDER_DIMENSIONS_BY_PAGE = {
  3: '6225x8334',
  16: '6225x8334',
  17: '6225x8334',
  31: '6225x8334',
}

export const IA_ITEM_URL = 'https://archive.org/details/20260506_20260506_1217'
export const IA_METADATA_URL = 'https://archive.org/metadata/20260506_20260506_1217'
export const IA_ORIGINAL_PDF_BYTES = 853249683
export const IA_ORIGINAL_PDF_MD5 = '6507c367fc0958995a0fc2045a46d5b2'
export const IA_JP2_ZIP_BYTES = 432512606
export const IA_JP2_ZIP_MD5 = '2e6dad6373a39430882a20ee28014a85'
export const IA_SCANDATA_MD5 = '9f8dcfd87309139c2e92b3d32320d3e5'
export const IA_SCANDATA_SHA256 = '7cb7a6c40dd161c3fa960e5bd06871509c864edcee93f7b491bf6b9d24ec7be9'
export const IA_PAGE_SHA256_BY_PAGE = {
  n0: '73a2558875d99a18cc23f270bb8dc0e65cbc4d5de2193a12680b888cc5041b55',
  n64: 'ed5328e0ef62c65332b960a7fbe89cc9d7baa9ab38e5e3e8d01e64ea34b42f36',
  n87: 'fc1560bf13b1b1df4bf4550c00e8f5b341a49d7297c8128a31deb057787c663e',
  n172: '2e45d23c1cd0d0ed93da15097e92279c315995a30a9dabeeeb3c79b1ad8aa68d',
  n173: '6a833bb644170aebff4f4ab798b64a4787fb2256c44b915db38fe4bd1de7bcee',
}

export const NAOJ_ROOT_URL = 'https://www.digital.archives.go.jp/file/1078787'
export const NAOJ_VIEWER_URL = 'https://www.digital.archives.go.jp/img/1078787'
export const NAOJ_RECORD_URL = 'https://www.digital.archives.go.jp/das/meta/F1000000000000101426.html'
export const NAOJ_VOL1_ITEM_URL = 'https://www.digital.archives.go.jp/item/4468520'
export const NAOJ_VOL2_ITEM_URL = 'https://www.digital.archives.go.jp/item/4469314'
export const NAOJ_VOL1_MANIFEST_URL = 'https://www.digital.archives.go.jp/api/iiif/4468520/manifest.json'
export const NAOJ_VOL2_MANIFEST_URL = 'https://www.digital.archives.go.jp/api/iiif/4469314/manifest.json'
export const NAOJ_VOL1_MANIFEST_SHA256 = '732991ca47aefc323e2095a93202fd301421ad8b92994c63caae2a94acf75af'
export const NAOJ_VOL2_MANIFEST_SHA256 = '3f167e1280527e1c672a72d7ef060c299ce9dffad1f362ddba04575da3df1560'
export const NAOJ_PAGE_SHA256 = {
  'v1-p2': '1806929dc23d944f350c059e6d4b003de1626c079138ab40c31f478bd49bb25f',
  'v1-p69': '8da44e829a992114ade3c65b80d2a1944844bcbb0e486e65e83296d5a5561f82',
  'v1-p70': '503e2963a1d129f679d89efbe1a59ebd9add3d462751bf4b68119032384873ab',
  'v1-p73': 'd1110027b4d126f23f6c5505e4d9900be85f444b3d49efaedca4ea749df2aa46',
  'v1-p84': '366f656fd2a51520746543e1cc96d77a8a2e5dc920281684d4543926166de613',
  'v1-p87': '6e8c584cb01dce720c3ef862a23a127af11d987e14ef0df40d841492576d00a9',
  'v2-p101': '234e6c6818f330da6cd6a28fcfe16979fd8646b53a2c4f8e3faa99eac224265f',
  'v2-p102': 'e7331e9b2151134f1a34dc0151ddb47c3b7bbc48740f1c38f1a9120a06c7f8c3',
}
export const NAOJ_TAIL_SHA256 = {
  C102812203300: '13c47e2d8b330f601916dad7fc0849d9aa15f3f9360cde1958612db06cb41f7b',
  C102812203400: 'ad6ea181489ca80d6a416fbd482f27f6ee3217e27e955057722d2400d13324aa',
  C102812203500: 'b5e94280f88eb874686147fe094c2694f74aa8dd27426b2560adff102fbedecc',
  C102812203600: 'c805f0364df298d3b595f792d4a44deb31731443cb832366a4edbfbce2e75bee',
  C102812203700: '055fe619c509b8b2b3f4671502208f108216bec21b78b33e13f32745db8e9e1a',
  C102812203800: '4e2f48cb81391a06b415820cde28903e563b991400b9afd63076e13789ab3b1f',
  C102812203900: 'd74a98eb5a218e6694179a7f6281a921adc9682f3f1b77a4a028d36a5758cc39',
  C102812204000: '19ac6d58b22323022bc4f9c159764ff506b876079c9a3e7f03f9cc4df045253a',
  C102812204100: '7323c43faec67977aa843f333dac095f076a20659e5d5613f2f539f2ef85fd6f',
  C102812204200: 'bdea3e5f2cd97c8328c7ea49b0f8588a7395bf8029708d9aefaa4a691cdd0275',
  C102812204300: '89ad91eab8714df132b0cc5860cfa1d96925b666212ffc390d71e2a69a7eb163',
  C102812204400: 'f8ca952bd9f7f6818245f791eb0f66f570d3aee2bbb2ffb3ea8b144e6942b75e',
  C102812204500: '6b051f914f029361253e4b0b360c717ae8b767c14967ee91fdd8dbd00e6a2e',
  C102812204600: '34ddbd3fccdd17383b402eba10aad6088edb2b9cce0bd6b219255af501d514f93',
  C102812204700: 'd839bac920ae5376074937ba9f8b96ac3add72ace95a473952a5039eae4bb963',
  C102812204800: 'c19e9fc606593aa0cdc55f3edc1409a61d1008e2e4325102998f712dc046646b',
  C102812204900: '4762d6bd95fbe77ec546fbc5e78242cd8347903e48b6c788fd716016390babdf',
}

export const INPUT_PATHS = [...new Set([
  ...v10.INPUT_PATHS,
  PREDECESSOR_COMPOSITION,
  PREDECESSOR_COMPOSITION_EVIDENCE,
  DOCUMENTATION_PATH,
  MATERIALIZER_PATH,
])]

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const clone = value => structuredClone(value)
const unique = values => [...new Set(values)]
const readJson = (root, path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'))
const fileSha256 = (root, path) => sha256(readFileSync(resolve(root, path)))
const requireValue = (condition, message) => { if (!condition) throw new Error(message) }
const git = (root, args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8' }).trim()
export const canonicalJson = v10.canonicalJson

function repository(root) {
  return {
    branch: git(root, ['branch', '--show-current']),
    currentHead: git(root, ['rev-parse', 'HEAD']),
    originMainHead: git(root, ['rev-parse', 'origin/main']),
  }
}

function predecessorInput(root, options = {}) {
  const generated = v10.buildBundle(root, options)
  const stored = readJson(root, PREDECESSOR_COMPOSITION)
  const storedEvidence = readJson(root, PREDECESSOR_COMPOSITION_EVIDENCE)
  requireValue(canonicalStableArtifactJson(stored) === canonicalStableArtifactJson(generated.artifact), 'v10_predecessor_complete_drift')
  requireValue(canonicalStableArtifactJson(storedEvidence) === canonicalStableArtifactJson(generated.files['evidence.json']), 'v10_predecessor_evidence_drift')
  requireValue(generated.artifact.schemaVersion === v10.SCHEMA, 'unexpected_v10_schema')
  requireValue(generated.artifact.graphImpact.successor.claimCount === 30, 'unexpected_v10_claim_count')
  requireValue(generated.artifact.graphImpact.successor.sourceCount === 21, 'unexpected_v10_source_count')
  requireValue(generated.artifact.graphImpact.successor.observationCount === 58, 'unexpected_v10_observation_count')
  requireValue(generated.artifact.graphImpact.successor.relationCount === 148, 'unexpected_v10_relation_count')
  requireValue(generated.artifact.graphImpact.successor.blockerCount === 11, 'unexpected_v10_blocker_count')
  return { generated, stored, storedEvidence }
}

function naojPage(volume, leaf, key, renderedSha256, bytes) {
  const base = volume === 1 ? 178300 : 191200
  const imageBase = volume === 1 ? 'M2019050811103249305' : 'M2019050811103949308'
  const itemId = volume === 1 ? '4468520' : '4469314'
  const canvasNumber = base + leaf * 100
  const canvasLabel = `C102812${canvasNumber}`
  const canvasUrl = `https://www.digital.archives.go.jp/api/iiif/${itemId}/canvas/${canvasLabel}`
  const imageUrl = `https://www.digital.archives.go.jp/api/content/item/da12/${canvasLabel}/iiif/${imageBase}_${String(leaf).padStart(4, '0')}.jp2/full/max/0/native.jpg`
  return {
    itemId,
    itemUrl: volume === 1 ? NAOJ_VOL1_ITEM_URL : NAOJ_VOL2_ITEM_URL,
    manifestUrl: volume === 1 ? NAOJ_VOL1_MANIFEST_URL : NAOJ_VOL2_MANIFEST_URL,
    canvasId: canvasUrl,
    canvasLabel,
    imageUrl,
    leaf,
    retrievedVariant: 'full/max/0/native.jpg',
    byteScope: 'retrieved JPEG response bytes for the fixed IIIF max image URL',
    renderedResponseSha256: renderedSha256,
    renderedResponseBytes: bytes,
    renderedDimensions: '3000x2262',
    hashKey: key,
  }
}

function naojTailPage(canvasLabel, leaf) {
  const canvasNumber = Number(canvasLabel.slice('C102812'.length))
  const imageUrl = `https://www.digital.archives.go.jp/api/content/item/da12/${canvasLabel}/iiif/M2019050811103949308_${String(leaf).padStart(4, '0')}.jp2/full/max/0/native.jpg`
  return {
    itemId: '4469314',
    itemUrl: NAOJ_VOL2_ITEM_URL,
    manifestUrl: NAOJ_VOL2_MANIFEST_URL,
    canvasId: `https://www.digital.archives.go.jp/api/iiif/4469314/canvas/${canvasLabel}`,
    canvasLabel,
    imageUrl,
    leaf,
    retrievedVariant: 'full/max/0/native.jpg',
    byteScope: 'retrieved JPEG response bytes for the fixed IIIF max image URL',
    renderedResponseSha256: NAOJ_TAIL_SHA256[canvasLabel],
    renderedDimensions: 'not re-read after acquisition; native JPEG hash preserved',
    canvasNumber,
  }
}

function naojFollowup() {
  const reviewedImages = [
    naojPage(1, 2, 'v1-p2', NAOJ_PAGE_SHA256['v1-p2'], 754451),
    naojPage(1, 69, 'v1-p69', NAOJ_PAGE_SHA256['v1-p69'], 847462),
    naojPage(1, 70, 'v1-p70', NAOJ_PAGE_SHA256['v1-p70'], 852232),
    naojPage(1, 73, 'v1-p73', NAOJ_PAGE_SHA256['v1-p73'], 860142),
    naojPage(1, 84, 'v1-p84', NAOJ_PAGE_SHA256['v1-p84'], 838573),
    naojPage(1, 87, 'v1-p87', NAOJ_PAGE_SHA256['v1-p87'], 842468),
    naojPage(2, 101, 'v2-p101', NAOJ_PAGE_SHA256['v2-p101'], 854211),
    naojPage(2, 102, 'v2-p102', NAOJ_PAGE_SHA256['v2-p102'], 848398),
  ]
  const tailCanvasLabels = Object.keys(NAOJ_TAIL_SHA256)
  const tailPages = tailCanvasLabels.map((canvasLabel, index) => naojTailPage(canvasLabel, 121 + index))
  return {
    candidateId: CANDIDATE_NAOJ,
    observationId: OBSERVATION_NAOJ,
    sourceRole: 'same_record_followup_held_outside_graph',
    decision: 'same_record_followup_no_new_graph_source_no_complete_four_field_binding',
    doesNotEnterGraph: true,
    directVisualReview: true,
    sameRecordAsV10Nara: true,
    independentPhysicalWitness: false,
    sourceIdentity: {
      nationalArchivesRootId: '1078787',
      catalogRecord: 'F1000000000000101426',
      title: '新鋟希夷陳先生紫微斗数全書',
      itemIds: ['4468520', '4469314'],
      volumeCanvasCounts: { '4468520': 129, '4469314': 137 },
      recordUrl: NAOJ_RECORD_URL,
      rootUrl: NAOJ_ROOT_URL,
      viewerUrl: NAOJ_VIEWER_URL,
      sameRecordEditionPair: true,
      independentHistoricalWitness: false,
      sourceAuthority: 'not_established',
      semanticAuthority: 'not_established',
    },
    directReading: [
      'Volume 1 p2 visibly identifies the printed work and 南陽堂梓; this is a record/edition identity surface, not a palace-coordinate witness.',
      'Volume 1 pp69-70 visibly show branch-labelled 安命 entries including 寅安命, 丑安命, 子安命, 辰安命, 巳安命, 午安命, 未安命, 申安命 and a ○十二宮 heading in ruled textual columns. The pages do not place all named palaces into one physical chart frame.',
      'Volume 1 p73 visibly states a 寅 base and 順/逆 rule surface: 大抵入命俱從寅上起正月順數至本生月止, followed by 逆至本生時安命 and 順至本生時安身. This directly records a rule text but not the repository production ordinal or compass orientation.',
      'Volume 1 p84 shows 紫微/局 chart-table material and p87 visibly shows 安天府圖, 天府惟寅申二宮, and 紫府同宮 material. These are diagram/rule surfaces without a complete twelve named-palace perimeter.',
      'Volume 2 pp101-102 show worked rectangular chart grids with 陽男/陰男, 水二局, 火六局, and 土五局 labels and branch/star cells. The reviewed grids do not visibly contain a complete named-palace set with a declared production ordinal.',
      'Volume 2 leaves 121-137 were acquired as a same-record tail sample; direct visual samples at 121, 125, 129, 133, and 137 add no complete four-field binding. Leaf 137 is a cover/end surface.',
    ],
    rawVisibleText: [
      { text: '寅安命 丑安命 子安命 辰安命 巳安命 午安命 未安命 申安命', locator: 'NAOJ item 4468520 / leaves 69-70 / ruled 安命 entries', canonicalOriginalPageTranscription: false },
      { text: '○十二宮', locator: 'NAOJ item 4468520 / leaves 69-70 / ruled text surface', canonicalOriginalPageTranscription: false },
      { text: '大抵入命俱從寅上起正月順數至本生月止', locator: 'NAOJ item 4468520 / leaf 73 / rule paragraph', canonicalOriginalPageTranscription: false },
      { text: '逆至本生時安命', locator: 'NAOJ item 4468520 / leaf 73 / rule paragraph', canonicalOriginalPageTranscription: false },
      { text: '順至本生時安身', locator: 'NAOJ item 4468520 / leaf 73 / rule paragraph', canonicalOriginalPageTranscription: false },
      { text: '安天府圖', locator: 'NAOJ item 4468520 / leaf 87 / diagram heading', canonicalOriginalPageTranscription: false },
      { text: '天府惟寅申二宮', locator: 'NAOJ item 4468520 / leaf 87 / rule text', canonicalOriginalPageTranscription: false },
      { text: '紫府同宮', locator: 'NAOJ item 4468520 / leaf 87 / rule text', canonicalOriginalPageTranscription: false },
      { text: '陽男 陰男 水二局 火六局 土五局', locator: 'NAOJ item 4469314 / leaves 101-102 / worked chart grids', canonicalOriginalPageTranscription: false },
    ],
    reviewedImages,
    tailAcquiredPages: tailPages,
    tailVisualSampleLeaves: [121, 125, 129, 133, 137],
    manifestIdentity: {
      '4468520': { url: NAOJ_VOL1_MANIFEST_URL, byteSha256: NAOJ_VOL1_MANIFEST_SHA256, bytes: 117876 },
      '4469314': { url: NAOJ_VOL2_MANIFEST_URL, byteSha256: NAOJ_VOL2_MANIFEST_SHA256, bytes: 125132 },
    },
    bindingMatrix: {
      branchToken: 'partial_direct',
      palaceName: 'partial_textual_component_not_bound_to_chart_frame',
      physicalSlot: 'partial_chart_surface_no_named_slot_mapping',
      ordinalDirection: 'direct_rule_text_not_production_ordinal_or_compass',
      workedExample: 'partial_direct',
      fullBinding: false,
    },
    lineage: {
      sameRecordAsExistingNaraFrontier: true,
      independentPhysicalWitness: false,
      lineageStatus: 'same National Archives record and edition pair already bounded in v10; follow-up pages are not an independent witness',
      semanticAuthority: 'not_established',
    },
    doesNotEstablish: [
      'new_independent_historical_witness',
      'complete_palace_name_to_branch_token_binding',
      'palace_name_to_physical_chart_slot',
      'production_ordinal',
      'compass_or_clockwise_direction',
      'single_frame_four_field_binding',
      'semantic_authority',
      '1871_textual_lineage',
    ],
  }
}

function jsgCandidate() {
  return {
    candidateId: CANDIDATE_JSG,
    decision: 'held_outside_graph_direct_aks_scan_partial_rule_surface_no_four_field_binding',
    directObservationStatus: 'direct_visual_original_scan_review_not_ocr_transcription',
    directVisualReview: true,
    doesNotEnterGraph: true,
    sourceKind: 'direct_aks_institutional_manuscript_scan_held_outside_graph',
    sourceIdentity: {
      catalogRecord: 'LIB_169174',
      title: '紫微斗數補遺',
      titleKorean: '자미두수보유',
      author: '[陳搏(宋) 著]',
      callNumber: 'PC9A-23',
      shelfMark: 'MF35/8437',
      edition: '筆寫本(轉寫本)',
      publicationDate: '年紀未詳',
      extent: '1冊(15張)',
      holding: '장서각 / Academy of Korean Studies',
      sourceAuthority: 'not_established',
      semanticAuthority: 'not_established',
    },
    locators: {
      recordUrl: JSG_RECORD_URL,
      pdfUrl: JSG_PDF_URL,
      sourcePdfSha256: JSG_PDF_SHA256,
      sourcePdfBytes: JSG_PDF_BYTES,
      sourcePdfPages: JSG_PDF_PAGES,
      directVisualReviewPages: [3, 16, 17, 31],
      renderDpi: JSG_RENDER_DPI,
      renderedFileSha256ByPage: JSG_RENDER_SHA256_BY_PAGE,
      renderedDimensionsByPage: JSG_RENDER_DIMENSIONS_BY_PAGE,
      sourceBytesStoredInRepo: false,
    },
    directReading: [
      'The 32-page institutional PDF was directly opened and rendered; sampled pages 3, 16, 17, and 31 visibly contain ruled rule/star columns and branch-group-like glyph surfaces.',
      'Page 3 visibly includes 天府 and 武曲 glyphs within ruled textual material; the page does not present a complete named-palace perimeter joined to a physical slot and production ordinal.',
      'Pages 16, 17, and 31 continue textual/rule-column material rather than supplying a full four-field chart frame. The manuscript date and relation to the 1871/1883 游藝錄 lineage remain unresolved.',
    ],
    rawVisibleText: [
      { text: '天府', locator: 'AKS PDF p3 / ruled star-rule material', canonicalOriginalPageTranscription: false },
      { text: '武曲', locator: 'AKS PDF p3 / ruled star-rule material', canonicalOriginalPageTranscription: false },
      { text: '四正', locator: 'AKS PDF p3 / branch/rule surface', canonicalOriginalPageTranscription: false },
    ],
    bindingMatrix: {
      branchToken: 'partial_rule_surface',
      palaceName: 'not_bound',
      physicalSlot: 'not_observed',
      ordinalDirection: 'not_observed',
      workedExample: 'not_observed',
      fullBinding: false,
    },
    lineage: {
      independentPhysicalWitness: false,
      publicationDateEstablished: false,
      authorIdentityEstablished: false,
      relationToYouyiLuOrNanbei: 'unresolved',
      semanticAuthority: 'not_established',
    },
    doesNotEstablish: [
      'known_publication_date_or_1871_lineage',
      'complete_palace_name_to_branch_token_binding',
      'palace_name_to_physical_chart_slot',
      'production_ordinal_or_direction',
      'single_frame_four_field_binding',
      'independent_historical_witness',
      'semantic_authority',
    ],
  }
}

function iaCandidate() {
  return {
    candidateId: CANDIDATE_IA,
    decision: 'held_outside_graph_public_mirror_sample_no_independent_witness_no_four_field_binding',
    directObservationStatus: 'direct_public_page_jpeg_sample_review_not_ocr_transcription',
    directVisualReview: true,
    doesNotEnterGraph: true,
    sourceKind: 'internet_archive_public_mirror_sampled_page_jpegs_held_outside_graph',
    sourceIdentity: {
      itemIdentifier: '20260506_20260506_1217',
      title: 'Tân Tiêm Hy Di Trần Tiên Sinh Tử Vi Đẩu Số Toàn Thư / 新鋟希夷陳先生紫微斗數全書',
      creator: '陳搏',
      metadataDate: '1600',
      description: 'Ming 南陽堂刊本 as stated by item metadata',
      sourceAuthority: 'public_item_metadata_only',
      semanticAuthority: 'not_established',
      samePhysicalCopyBoundary: 'sampled cover/imprint surface matches the local Nanyangtang physical-copy boundary; mirror is not admitted as independent',
    },
    locators: {
      itemUrl: IA_ITEM_URL,
      metadataUrl: IA_METADATA_URL,
      pageUrlPattern: 'https://archive.org/download/20260506_20260506_1217/page/{leaf}_w1600.jpg',
      sampledPages: Object.keys(IA_PAGE_SHA256_BY_PAGE),
      pageJpegSha256ByPage: IA_PAGE_SHA256_BY_PAGE,
      originalPdfBytesFromMetadata: IA_ORIGINAL_PDF_BYTES,
      originalPdfMd5FromMetadata: IA_ORIGINAL_PDF_MD5,
      originalPdfSha256: null,
      jp2ZipBytesFromMetadata: IA_JP2_ZIP_BYTES,
      jp2ZipMd5FromMetadata: IA_JP2_ZIP_MD5,
      scandataMd5FromMetadata: IA_SCANDATA_MD5,
      scandataSha256: IA_SCANDATA_SHA256,
      fullOriginalPdfDownloadedForSha256: false,
      sourceBytesStoredInRepo: false,
    },
    directReading: [
      'The sampled n0 page visibly shows the cover/inner-cabinet imprint boundary and matches the local Nanyangtang copy surface; this establishes a mirror/copy comparison target, not an independent witness.',
      'The sampled n87 page visibly shows ruled branch/star-table material without a complete named-palace perimeter.',
      'The sampled n172 and n173 pages are text surfaces and do not supply the required physical chart-slot/ordinal join. The sampled public mirror therefore does not close the four-field binding.',
    ],
    rawVisibleText: [
      { text: '新鋟希夷陳先生紫微斗數全書', locator: 'Internet Archive page n0 / cover title surface', canonicalOriginalPageTranscription: false },
      { text: '安天府圖', locator: 'Internet Archive sampled page n87 / ruled diagram-rule surface', canonicalOriginalPageTranscription: false },
    ],
    bindingMatrix: {
      branchToken: 'partial_rule_table_surface',
      palaceName: 'not_bound',
      physicalSlot: 'not_observed',
      ordinalDirection: 'not_observed',
      workedExample: 'not_observed_in_sample',
      fullBinding: false,
    },
    lineage: {
      independentPhysicalWitness: false,
      mirrorOrCopyRelation: 'same physical-copy boundary as local Nanyangtang / same edition-family target; block identity not closed',
      originalPdfSha256: null,
      semanticAuthority: 'not_established',
    },
    doesNotEstablish: [
      'independent_physical_witness',
      'full_original_pdf_sha256',
      'block_or_colophon_identity',
      'complete_palace_name_to_branch_token_binding',
      'palace_name_to_physical_chart_slot',
      'production_ordinal_or_direction',
      'single_frame_four_field_binding',
      'semantic_authority',
    ],
  }
}

function frontierObservation(candidate, observationId, summary, binding, locator) {
  return {
    observationId,
    candidateId: candidate.candidateId,
    directVisualFindings: summary,
    fourFieldBinding: binding,
    locator,
    graphAdmission: false,
    sourceAdmission: false,
    semanticAuthority: false,
    readinessImpact: 'none; existing readiness remains not_safe_to_start',
    directObservationStatus: candidate.directObservationStatus,
  }
}

function updateFrontier(previous, naoj, jsg, ia) {
  const frontier = clone(previous.lineageAssessment.researchFrontier)
  frontier.schemaVersion = SCHEMA + '-research-frontier-v0'
  frontier.status = 'same_record_naoj_followup_and_held_out_aks_ia_scans_no_graph_admission'
  frontier.researchSessionDate = '2026-08-13'
  frontier.candidates = [...clone(frontier.candidates), jsg, ia]
  frontier.sameRecordFollowups = [...(frontier.sameRecordFollowups || []), naoj]
  frontier.frontierOnlySources = unique([...(frontier.frontierOnlySources || []), CANDIDATE_JSG, CANDIDATE_IA])
  frontier.frontierOnlyObservations = [
    ...(frontier.frontierOnlyObservations || []),
    frontierObservation(
      jsg,
      OBSERVATION_JSG,
      ['AKS p3, p16, p17, and p31 were directly visually reviewed from a 32-page institutional PDF; ruled star/rule and branch-group-like surfaces are visible.', 'No single reviewed frame supplies named palaces, physical slots, and production ordinal together.'],
      jsg.bindingMatrix,
      jsg.locators,
    ),
    frontierObservation(
      ia,
      OBSERVATION_IA,
      ['Internet Archive n0, n64, n87, n172, and n173 public page JPEGs were directly sampled.', 'The mirror/copy boundary and ruled table surfaces are direct observations, but no complete named-palace/branch/slot/ordinal frame is observed.'],
      ia.bindingMatrix,
      ia.locators,
    ),
    frontierObservation(
      naoj,
      OBSERVATION_NAOJ,
      ['NAOJ same-record pages 69-73, 84, 87, 101-102 and acquired volume-2 tail pages 121-137 were reviewed as a follow-up to the v10 NARA boundary.', 'The pages directly add branch-labelled 安命, 寅 順/逆 rule, Tianfu/紫微, and worked-grid surfaces but do not create an independent source or a complete four-field frame.'],
      naoj.bindingMatrix,
      { recordUrl: NAOJ_RECORD_URL, rootUrl: NAOJ_ROOT_URL, reviewedImages: naoj.reviewedImages, tailAcquiredPages: naoj.tailAcquiredPages },
    ),
  ]
  frontier.admissionBoundary = `${frontier.admissionBoundary}; v11 keeps the NAOJ pages as a same-record follow-up and keeps the AKS and Internet Archive scans outside the graph because neither provides an independently lineaged single-frame palace-name/branch/physical-slot/ordinal binding.`
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

function updateEvidence(previous, frontier, naoj, jsg, ia) {
  const evidence = clone(previous.evidence)
  evidence.schemaVersion = SCHEMA + '-evidence-v0'
  evidence.authorityBoundary = 'v11 directly reviews a same-record National Archives follow-up, an AKS institutional manuscript scan, and Internet Archive public mirror pages. The NAOJ follow-up is not an independent witness; the AKS scan is date/lineage unresolved; the Internet Archive sample is a mirror/copy comparison target without a full PDF SHA-256. Their direct branch, rule, Tianfu, chart, or table surfaces do not establish a single-frame palace-name ↔ branch token ↔ physical slot ↔ production ordinal binding, source authority, semantic authority, readiness, or activation.'
  evidence.researchFrontier = frontier
  evidence.sameRecordFollowup = naoj
  evidence.heldOutDirectScanReview = {
    candidateIds: [CANDIDATE_JSG, CANDIDATE_IA],
    candidates: [jsg, ia],
    graphAdmission: 'none',
    independentWitnessesAdmitted: 0,
    fullBindingCount: 0,
  }
  evidence.frontierOnlyObservations = frontier.frontierOnlyObservations
  evidence.earlierEdition1871Recheck = {
    catalogUrl: 'https://ci.nii.ac.jp/ncid/BD19656670',
    ndlManuscriptUrl: 'https://ndlsearch.ndl.go.jp/books/R100000039-I2606209',
    ndlCompiledUrl: 'https://ndlsearch.ndl.go.jp/books/R100000002-I000007637157',
    attemptedIiifManifests: [
      { url: 'https://dl.ndl.go.jp/api/iiif/2606209/manifest.json', result: '404_json_checkResult_NG' },
      { url: 'https://dl.ndl.go.jp/api/iiif/2610509/manifest.json', result: '404_json_checkResult_NG' },
    ],
    pageBytesObtained: false,
    textualLineageClosed: false,
    graphAdmission: false,
  }
  evidence.reportedNonObservations = unique([
    ...(evidence.reportedNonObservations || []),
    'The NAOJ pp69-73, 84, 87, 101-102 and vol2 tail review is a same-record follow-up to the v10 NARA candidate, not a new independent physical witness.',
    'The NAOJ p73 寅/順/逆 text is a direct rule observation but does not declare the repository production ordinal, compass orientation, or a complete palace-name-to-slot map.',
    'The NAOJ p84/p87 Tianfu and 紫微 surfaces and p101/p102 worked grids do not contain a complete named-palace perimeter in the reviewed frame.',
    'The AKS PC9A-23 PDF is a date-unknown manuscript/transcription scan; direct rule/star surfaces do not establish the requested four-field binding or independent semantic authority.',
    'The Internet Archive original-PDF MD5 and sampled JPEG hashes are not a full original-PDF SHA-256; the sampled item is retained as a mirror/copy comparison target, not an independent witness.',
    'The 1871 游藝錄 route remains catalog/failed-IIIF only; no 1871 page bytes or direct text comparison were obtained.',
  ])
  return evidence
}

function frontierBindingRow(candidate, role) {
  return {
    candidateId: candidate.candidateId,
    role,
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

function updateBindingMatrix(previous, naoj, jsg, ia) {
  const matrix = clone(previous.bindingMatrix)
  matrix.schemaVersion = SCHEMA + '-binding-matrix-v0'
  matrix.researchFrontierBoundary = {
    ...clone(matrix.researchFrontierBoundary),
    reviewedCandidateCount: (matrix.researchFrontierBoundary?.reviewedCandidateCount || 0) + 2,
    heldOutDirectScanCandidateCount: 2,
    sameRecordFollowupCount: (matrix.researchFrontierBoundary?.sameRecordFollowupCount || 0) + 1,
    admittedCandidateCount: 0,
    directSingleWitnessFullBindingCount: 0,
    productionOrdinalBindingCount: 0,
    semanticAuthorityCount: 0,
    status: 'same_record_followup_and_held_out_direct_scans_no_new_graph_admission',
  }
  matrix.frontierOnlyBindingRows = [
    ...(matrix.frontierOnlyBindingRows || []),
    frontierBindingRow(naoj, 'same_record_followup_partial_rule_chart_and_worked_grid'),
    frontierBindingRow(jsg, 'held_out_institutional_manuscript_partial_rule_surface'),
    frontierBindingRow(ia, 'held_out_public_mirror_sample_partial_table_surface'),
  ]
  matrix.composition.additionalDirectWitnessLimitations = [
    ...clone(matrix.composition.additionalDirectWitnessLimitations),
    'v11 NAOJ follow-up pages add direct branch/rule/Tianfu/worked-grid components from the same record but do not add a new source or a single-frame four-field binding.',
    'v11 AKS and Internet Archive samples remain held-out direct scans; their branch/rule/table surfaces do not establish named-palace physical slots or a production ordinal.',
  ]
  matrix.composition.unprovenJoinPremises = unique([
    ...clone(matrix.composition.unprovenJoinPremises),
    'The NAOJ p73 rule text supplies the same coordinate semantics as the named-palace sequence or chart grids.',
    'The AKS manuscript and Internet Archive mirror share the same authoritative coordinate frame as the admitted Youyi/Nanbei graph.',
  ])
  return matrix
}

function updateLineage(previous, frontier, naoj, jsg, ia) {
  const lineage = clone(previous.lineageAssessment)
  lineage.schemaVersion = SCHEMA + '-lineage-v0'
  lineage.researchFrontier = frontier
  lineage.sameRecordFollowup = naoj
  lineage.frontierLineageAssessments = [
    ...(lineage.frontierLineageAssessments || []),
    { candidateId: CANDIDATE_NAOJ, independentPhysicalWitness: false, sameRecordAsExistingNaraFrontier: true, semanticAuthority: 'not_established', graphAdmission: false },
    { candidateId: CANDIDATE_JSG, independentPhysicalWitness: false, publicationDateEstablished: false, relationToExistingGraph: 'unresolved', semanticAuthority: 'not_established', graphAdmission: false },
    { candidateId: CANDIDATE_IA, independentPhysicalWitness: false, mirrorOrCopyRelation: 'same physical-copy boundary as local Nanyangtang; independence not admitted', originalPdfSha256: null, semanticAuthority: 'not_established', graphAdmission: false },
  ]
  lineage.sourceIdentityStatus = `${previous.lineageAssessment.sourceIdentityStatus}; v11 NAOJ pages are same-record follow-up, AKS date/lineage remains unresolved, and Internet Archive sampled pages are a mirror/copy comparison target`
  lineage.independenceStatus = 'No v11 candidate is admitted as an independent historical or semantic witness: NAOJ is the same NARA record, AKS publication/date relation is unresolved, and Internet Archive samples track a mirror/copy boundary without full-PDF SHA-256 or block identity.'
  lineage.independentWitnessStatus = 'not_admitted'
  lineage.physicalWitnessCandidatesAdded = clone(previous.lineageAssessment.physicalWitnessCandidatesAdded)
  lineage.frontierCandidateReview = {
    candidateIds: [CANDIDATE_JSG, CANDIDATE_IA],
    directReview: true,
    graphAdmission: false,
    fullBindingCount: 0,
    independentWitnessCount: 0,
    publicationDateResolvedCount: 0,
  }
  return lineage
}

function updateFieldKit(previous, evidencePath) {
  const fieldKit = clone(previous.fieldKitImpact)
  fieldKit.schemaVersion = SCHEMA + '-field-kit-v0'
  fieldKit.targetReassessment = fieldKit.targetReassessment.map(item => {
    if (item.targetId === 'acq-distinct-witness-identity-lineage') {
      return {
        ...item,
        newEvidenceRole: 'v11 adds a same-record NAOJ follow-up, a date-unknown AKS manuscript scan, and an Internet Archive mirror/copy sample; none closes distinct-witness identity or lineage',
        evidenceRefs: unique([...(item.evidenceRefs || []), evidencePath]),
        statusBefore: item.statusAfter,
        statusAfter: item.statusAfter,
        statusChanged: false,
        closure: 'not_closed',
      }
    }
    if (item.targetId === 'acq-palace-semantic-map-and-coordinate-witness') {
      return {
        ...item,
        newEvidenceRole: 'NAOJ directly adds branch-labelled 安命, 寅 順/逆, Tianfu/紫微, and worked-grid components across separate pages; AKS and IA add no complete four-field frame, so palace-to-slot and production ordinal remain action_required',
        evidenceRefs: unique([...(item.evidenceRefs || []), evidencePath]),
        statusBefore: item.statusAfter,
        statusAfter: item.statusAfter,
        statusChanged: false,
        closure: 'not_closed',
      }
    }
    if (item.targetId === 'acq-tianfu-anchor-direction-adjudicator') {
      return {
        ...item,
        newEvidenceRole: 'NAOJ p84/p87 directly shows Tianfu/紫微 diagram-rule surfaces, but the pages do not adjudicate palace-name physical slot, production ordinal, or semantic authority',
        evidenceRefs: unique([...(item.evidenceRefs || []), evidencePath]),
        statusBefore: item.statusAfter,
        statusAfter: item.statusAfter,
        statusChanged: false,
        closure: 'not_closed',
      }
    }
    return item
  })
  fieldKit.heldEvidenceUpdate = 'v11 records a same-record NAOJ follow-up and two held-out direct scan candidates. NAOJ supplies separated branch/rule/Tianfu/worked-grid components; AKS supplies a date-unknown ruled manuscript surface; Internet Archive supplies mirror/copy page samples without a full PDF SHA-256. No item closes source identity, palace-to-slot, production ordinal, semantic authority, readiness, or activation.'
  fieldKit.evidenceObservationIds = unique([
    ...(fieldKit.evidenceObservationIds || []),
    OBSERVATION_NAOJ,
    OBSERVATION_JSG,
    OBSERVATION_IA,
  ])
  fieldKit.researchFrontier = {
    ...fieldKit.researchFrontier,
    evidenceRefs: unique([...(fieldKit.researchFrontier?.evidenceRefs || []), evidencePath]),
    reviewedCandidateCount: (fieldKit.researchFrontier?.reviewedCandidateCount || 0) + 2,
    heldOutDirectScanCandidateCount: 2,
    sameRecordFollowupCount: (fieldKit.researchFrontier?.sameRecordFollowupCount || 0) + 1,
    admittedCandidateCount: 0,
    graphAdmittedFrontierCandidateCount: fieldKit.researchFrontier?.graphAdmittedFrontierCandidateCount || 0,
    status: 'same_record_followup_and_held_out_direct_scans_no_new_graph_admission',
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
  const naoj = naojFollowup()
  const jsg = jsgCandidate()
  const ia = iaCandidate()
  const frontier = updateFrontier(previous, naoj, jsg, ia)
  const evidencePath = ARTIFACT_DIR + '/evidence.json'
  const evidence = updateEvidence(previous, frontier, naoj, jsg, ia)
  const bindingMatrix = updateBindingMatrix(previous, naoj, jsg, ia)
  const lineageAssessment = updateLineage(previous, frontier, naoj, jsg, ia)
  const fieldKitImpact = updateFieldKit(previous, evidencePath)
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
    branch: repo.branch,
    scope: {
      ...clone(previous.scope),
      purpose: 'additive same-record NAOJ follow-up and held-out AKS/Internet Archive direct scan review; no new graph source, no single-frame four-field binding, no source/semantic/readiness/activation promotion',
      heldOutResearchCandidateCount: (previous.scope.heldOutResearchCandidateCount || 0) + 2,
      researchCandidatesAdmitted: previous.scope.researchCandidatesAdmitted,
      sameRecordFollowupReviewPerformed: true,
      heldOutDirectScanReviewPerformed: true,
      heldOutDirectScanCandidateCount: 2,
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
      researchFrontierOnlySources: [CANDIDATE_JSG, CANDIDATE_IA],
      sameRecordFollowupCandidate: CANDIDATE_NAOJ,
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
      additive: {
        claimCount: 0,
        sourceCount: 0,
        physicalWitnessCount: 0,
        observationCount: 0,
        relationCount: 0,
        blockerCount: 0,
      },
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
      boundary: 'v11 records direct same-record and held-out scan observations outside the semantic graph. NAOJ branch/rule/Tianfu/worked-grid surfaces, AKS ruled manuscript surfaces, and Internet Archive mirror pages do not establish a single-frame palace-name ↔ branch ↔ physical-slot ↔ production-ordinal binding, lineage, source authority, semantic authority, readiness, or activation.',
    },
    blockerImpact: {
      ...clone(previous.blockerImpact),
      blockersClosed: [],
      blockerStatusChanges: [],
      resolvedSubBoundaries: [
        ...clone(previous.blockerImpact.resolvedSubBoundaries),
        'NAOJ same-record pages 69-73 directly add 寅-based 順/逆 and branch-labelled 安命 rule surfaces without establishing production ordinal or a named-palace physical slot map',
        'NAOJ same-record pages 84, 87, 101-102 and tail pages 121-137 were directly reviewed; Tianfu/紫微 and worked-grid surfaces do not close the four-field semantic frame',
        'AKS PC9A-23 and Internet Archive sampled pages were directly reviewed as held-out candidates; date/lineage or mirror independence remains unresolved and no top-level blocker is closed',
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
      sourceBytes: 'v11 records fixed NAOJ IIIF manifest/page-response hashes, AKS PDF/render hashes, and Internet Archive metadata/page-JPEG hashes. Materialization performs no network acquisition and treats OCR/text extraction as locator-only.',
      network: 'forbidden_during_materialization',
      ocr: 'not used as canonical text; direct visual findings are fixed evidence metadata and OCR/text extraction is locator-only',
      noAutomaticPromotion: true,
    },
    negativeContract: {
      ...clone(previous.negativeContract),
      rejects: unique([
        ...previous.negativeContract.rejects,
        'treating the NAOJ same-record follow-up as an independent historical witness or new graph source',
        'promoting the NAOJ p73 寅/順/逆 rule text into production ordinal, compass direction, or full palace-slot authority',
        'treating NAOJ Tianfu/紫微 pages or worked chart grids as a complete named-palace four-field frame',
        'promoting the AKS date-unknown PC9A-23 scan into a known 1871 witness, independent source, or semantic authority',
        'treating AKS ruled star/rule columns as a complete palace-name, branch, physical-slot, and production-ordinal binding',
        'treating Internet Archive metadata MD5 as a full original-PDF SHA-256 or sampled mirror as an independent physical witness',
        'treating Internet Archive sampled pages as proof of block identity, colophon identity, palace slot, or production ordinal',
        'treating catalog and failed-IIIF 1871 routes as acquired page bytes or direct textual lineage',
        'promoting any v11 held-out candidate or same-record follow-up into graph sources, observations, relations, claims, readiness, or activation',
      ]),
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
        researchFrontierAdmission: 'held_outside_graph_same_record_followup_and_direct_scan_candidates',
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
    predecessorSchema: v10.SCHEMA,
    counts: result.artifact.graphImpact.successor,
    graphAdditive: result.artifact.graphImpact.additive,
    heldOutCandidateIds: [CANDIDATE_JSG, CANDIDATE_IA],
    sameRecordFollowupCandidate: CANDIDATE_NAOJ,
    directSingleWitnessFullBindingCount: result.artifact.bindingMatrix.coverage.directSingleWitnessFullBindingCount,
    productionOrdinalBindingCount: result.artifact.bindingMatrix.coverage.productionOrdinalBindingCount,
    independentPhysicalWitnessesAdmitted: result.artifact.graphImpact.independentPhysicalWitnessesAdmitted,
    blockersClosed: result.artifact.graphImpact.blockersClosed,
    completeByteSha256: result.completeSha256,
  }, null, 2))
}
