import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity, checkHistoricalRepositoryBasis } from '../src/artifactIdentity.js'
import { getPdfSourceMetadata, resolvePdfSourcePathSync } from './lib/pdf-source-resolver.mjs'

export const SCHEMA = 'ziwei-nara-iiif-leafmap-semantic-witness-v1'
export const VERDICT = 'complete_ziwei_nara_iiif_leafmap_semantic_witness_frontier_exhausted_uncommitted'
export const MATERIALIZER_VERSION = '1.0.0'
export const BASIS_HEAD = '87550964aaf303325c647c21066272a776f515f3'

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const PDFINFO = '/Users/softie/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/pdfinfo'
const NANYANG_SOURCE_ID = 'nanyangtang_quanbao_528p'
const RECORD_URL = 'https://www.digital.archives.go.jp/das/meta/F1000000000000101426.html'
const FILE_URL = 'https://www.digital.archives.go.jp/file/1078787'
const VOLUMES = Object.freeze([
  {
    volumeId: 'nara-v1', itemId: '4468520', label: '新鋟希夷陳先生紫微斗数全書１', leafCount: 129,
    manifestUrl: 'https://www.digital.archives.go.jp/api/iiif/4468520/manifest.json',
    manifestSha256: '732991ca47aefc323e2095a93202fd301421ad8b92994c63caae2a94acf75af', manifestByteLength: 117876,
    captureIndexPath: '/private/tmp/ziwei-nara-iiif-20260809/4468520-capture-index.json',
    captureIndexSha256: '9df8a1635d77cc4f21b23f4eca6d88d728a46f7af8f70359b7774af257553ddc',
    canvasNumberStart: 102812178400, imagePrefix: 'M2019050811103249305', imageBase: 'da12',
  },
  {
    volumeId: 'nara-v2', itemId: '4469314', label: '新鋟希夷陳先生紫微斗数全書２', leafCount: 137,
    manifestUrl: 'https://www.digital.archives.go.jp/api/iiif/4469314/manifest.json',
    manifestSha256: '3f167e1280527e1c672a72d7ef060c299ce9dffad1f362ddba04575da3df1560', manifestByteLength: 125132,
    captureIndexPath: '/private/tmp/ziwei-nara-iiif-20260809/4469314-capture-index.json',
    captureIndexSha256: '4634e033df8ae5ae3470164b97ff0e8da4511b9fa438e127896bc1eb6e2f48ec',
    canvasNumberStart: 102812191300, imagePrefix: 'M2019050811103949308', imageBase: 'da12',
  },
])

const NATIVE_REVIEW = Object.freeze({
  'nara-v1:84': { sha256: '366f656fd2a51520746543e1cc96d77a8a2e5dc920281684d4543926166de613', bytes: 838573 },
  'nara-v1:87': { sha256: '6e8c584cb01dce720c3ef862a23a127af11d987e14ef0df40d841492576d00a9', bytes: 842468 },
  'nara-v1:88': { sha256: '01aa70087388237313da09a6038e923e676acda36cfe1e58b3026e817a8eb619', bytes: 825635 },
  'nara-v1:92': { sha256: '28189642c4c155dd80e5f859aa4cfe89a85964517d7520675dbce2542d6e3973', bytes: 875659 },
  'nara-v1:128': { sha256: '8fc3f059526bdd52a3ce43dac6dd4238f014cd41544e057d6dcc422affdef4cf', bytes: 764982 },
  'nara-v1:129': { sha256: '55916e77b8df8f123dac4d7c63c3b8387abc6d9196379b4e61f302de3ce51860', bytes: 526420 },
  'nara-v2:1': { sha256: 'a8aab19602a963482e98b991c5ee4848638fb065820f30e89e5414453c7f3724', bytes: 687868 },
  'nara-v2:2': { sha256: 'e55771ed6860feb7b723d1f84fa1c4399880774e40a5af8bc9d7c19328ae9117', bytes: 674815 },
  'nara-v2:3': { sha256: '7624c0b5fb3ac6ffd652818aacdc454e74aa1ed7be8da0962bce55be63306ac7', bytes: 848784 },
  'nara-v2:64': { sha256: '901dcc10e4fb8863703e0da2c85f883b6e930fd438c05ba1f22a48e44989770a', bytes: 832936 },
  'nara-v2:69': { sha256: '892c9c3fcddee893f2d9354e643192f0f903fb70db726a71ef4aea30b3d0b766', bytes: 859712 },
  'nara-v2:75': { sha256: 'bbf4823b2e4da81db468bed7e45787308d05bd293b8eef9d15a5da41ca9a2e0b', bytes: 864238 },
  'nara-v2:80': { sha256: '352cb081830eed051dadcf3b3ae884286572c41a5ffa13dc8fd855ed3660557a', bytes: 843934 },
  'nara-v2:134': { sha256: '34ddbd3fccdd17383b402eba10aad6088ed2b9cce0bd6b219255af501d514f93', bytes: 871036 },
  'nara-v2:136': { sha256: 'c19e9fc606593aa0cdc55f3edc1409a61d1008e2e4325102998f712dc046646b', bytes: 782440 },
  'nara-v2:137': { sha256: '4762d6bd95fbe77ec546fbc5e78242cd8347903e48b6c788fd716016390babdf', bytes: 573277 },
})

const LOCAL_ANCHORS = Object.freeze([
  { pdfPage: 1, profile: '72dpi-jpeg-q70', sha256: '12c9087d4f8dd06d42b740f695693d9119042b197aadb3db1741d8a33f27083d', path: '/private/tmp/ziwei-nara-iiif-20260809/local-render/all-72/nanyang-001.jpg', reading: 'volume-1 cover' },
  { pdfPage: 2, profile: '72dpi-jpeg-q70', sha256: 'ff616b320ba63b084b848223c9579f9205bdfe5df11a5a71c082f14f523a0aa8', path: '/private/tmp/ziwei-nara-iiif-20260809/local-render/all-72/nanyang-002.jpg', reading: 'title/imprint page' },
  { pdfPage: 167, profile: '110dpi-jpeg', sha256: '8a9b24e6bbb36d7269cd20d75da6a3fdfff9f1d7f1d53fc4aefbf274ba1cb44d', path: '/private/tmp/ziwei-nara-iiif-20260809/local-render/chart-110/nanyang-167.jpg', reading: 'five-element bureau / branch chart' },
  { pdfPage: 172, profile: '110dpi-jpeg', sha256: '690ded3d7a61fd96715a4206279b1c2b02e8a30114b4aaf81c7ac0de8c11e5a0', path: '/private/tmp/ziwei-nara-iiif-20260809/local-render/chart-110/nanyang-172.jpg', reading: '安天府圖' },
  { pdfPage: 175, profile: '110dpi-jpeg', sha256: '6e725474d9f714170daccb3ceef27c6d4db5d624c0fda0d1a2f42ec1fe1efb3d', path: '/private/tmp/ziwei-nara-iiif-20260809/local-render/chart-110/nanyang-175.jpg', reading: 'branch/day grid' },
  { pdfPage: 254, profile: '72dpi-jpeg-q70', sha256: '64fe8f894b675ff172a3ca72eec6b85babe62003bdb20614a6134222443fadd6', path: '/private/tmp/ziwei-nara-iiif-20260809/local-render/all-72/nanyang-254.jpg', reading: 'volume-1 final text page' },
  { pdfPage: 255, profile: '72dpi-jpeg-q70', sha256: '1eed94cfa8bfb19179b162a83b3234aae20a97b992594c29be932e4d46755445', path: '/private/tmp/ziwei-nara-iiif-20260809/local-render/all-72/nanyang-255.jpg', reading: 'volume-1 boundary blank page' },
  { pdfPage: 256, profile: '72dpi-jpeg-q70', sha256: '6549453840d37b4aec004fd2ee5e35a97486c611d8844a55c0144dd332665eff', path: '/private/tmp/ziwei-nara-iiif-20260809/local-render/all-72/nanyang-256.jpg', reading: 'volume-1 back/blank page' },
  { pdfPage: 257, profile: '72dpi-jpeg-q70', sha256: 'd7da40c2caafca1ffdccc4eaa5d50711d0c86407873ee96997537adcf48a401b', path: '/private/tmp/ziwei-nara-iiif-20260809/local-render/all-72/nanyang-257.jpg', reading: 'volume-2 cover' },
  { pdfPage: 258, profile: '72dpi-jpeg-q70', sha256: '968d1d7955179df738493a43b883c929d7b37fdef23f04dbc9e987cd7031cf05', path: '/private/tmp/ziwei-nara-iiif-20260809/local-render/all-72/nanyang-258.jpg', reading: 'volume-2 opening blank page' },
  { pdfPage: 382, profile: '110dpi-jpeg', sha256: '63ab88aae6b38ce59d1e4d3ac00c339d0210ecb4f92dce4f28bc5c6d8dc1020b', path: '/private/tmp/ziwei-nara-iiif-20260809/local-render/chart-110/nanyang-382.jpg', reading: 'volume-2 chart example' },
  { pdfPage: 383, profile: '110dpi-jpeg', sha256: '776cdc40de006b66770bdcab8fabde212d0397659ee8bff92b13de21baf7956c', path: '/private/tmp/ziwei-nara-iiif-20260809/local-render/chart-110/nanyang-383.jpg', reading: 'volume-2 chart example' },
  { pdfPage: 404, profile: '110dpi-jpeg', sha256: '34413e9d185f35440461ec09e185c440d44ee00ebcb0324916aa19155db4917a', path: '/private/tmp/ziwei-nara-iiif-20260809/local-render/chart-110/nanyang-404.jpg', reading: 'volume-2 chart example' },
  { pdfPage: 405, profile: '110dpi-jpeg', sha256: 'b47fe80cd7db61ec67d7514932ce08c56fe0e1dcbe1eedf75ee47d5bc245a3e5', path: '/private/tmp/ziwei-nara-iiif-20260809/local-render/chart-110/nanyang-405.jpg', reading: 'volume-2 chart example' },
  { pdfPage: 526, profile: '72dpi-jpeg-q70', sha256: '7fa9f2304d6c340434c9d4f0343438061bca1fd698d6bd356141ed257d56002f', path: '/private/tmp/ziwei-nara-iiif-20260809/local-render/all-72/nanyang-526.jpg', reading: 'volume-2 final text page' },
  { pdfPage: 527, profile: '72dpi-jpeg-q70', sha256: '18019017d9dc078a9bb9a9686ae71303645bf3786524282e22559ccc269a9b84', path: '/private/tmp/ziwei-nara-iiif-20260809/local-render/all-72/nanyang-527.jpg', reading: 'volume-2 final blank side' },
  { pdfPage: 528, profile: '72dpi-jpeg-q70', sha256: '7ae64c5c17f72b4cc433e8cb2f0e021e100f675f8cb04f0a3de47348e84b86f3', path: '/private/tmp/ziwei-nara-iiif-20260809/local-render/all-72/nanyang-528.jpg', reading: 'volume-2 back/blank side' },
])

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value
export const canonicalJson = value => `${JSON.stringify(stable(value), null, 2)}\n`

function volumeById(volumeId) { const volume = VOLUMES.find(item => item.volumeId === volumeId); if (!volume) throw new Error(`unknown_nara_volume:${volumeId}`); return volume }

export function buildManifestIndex(volumeId) {
  const volume = volumeById(volumeId)
  return Array.from({ length: volume.leafCount }, (_, index) => {
    const leafOrdinal = index + 1
    const canvasNumber = volume.canvasNumberStart + index * 100
    const canvasId = `https://www.digital.archives.go.jp/api/iiif/${volume.itemId}/canvas/C${canvasNumber}`
    const imageName = `${volume.imagePrefix}_${String(leafOrdinal).padStart(4, '0')}.jp2`
    return {
      stableIndex: index, leafOrdinal, canvasId, canvasLabel: `C${canvasNumber}`, canvasWidth: 6300, canvasHeight: 4750,
      imageUrl: `https://www.digital.archives.go.jp/api/content/item/${volume.imageBase}/C${canvasNumber}/iiif/${imageName}/full/1200,/0/native.jpg`,
      nativeImageUrl: `https://www.digital.archives.go.jp/api/content/item/${volume.imageBase}/C${canvasNumber}/iiif/${imageName}/full/max/0/native.jpg`,
    }
  })
}

function side({ volumeId, leafOrdinal, sideName, localPdfPage, relation, mappingStatus = 'mapped', note }) {
  const volume = volumeById(volumeId)
  const capture = buildManifestIndex(volumeId)[leafOrdinal - 1]
  return { volumeId, itemId: volume.itemId, leafOrdinal, stableIndex: capture.stableIndex, side: sideName, localPdfPage, relation, mappingStatus, note: note || null, canvasId: capture.canvasId, canvasLabel: capture.canvasLabel }
}

export function buildConcordance() {
  const rows = []
  const omitted = []
  const add = (volumeId, leafOrdinal, sideName, localPdfPage, relation, note) => rows.push(side({ volumeId, leafOrdinal, sideName, localPdfPage, relation, note }))
  const omit = (volumeId, leafOrdinal, sideName, note) => omitted.push(side({ volumeId, leafOrdinal, sideName, localPdfPage: null, relation: 'unresolved', mappingStatus: 'omitted_blank_or_background_side', note }))

  add('nara-v1', 1, 'visualLeft', 1, 'probable_correspondence', 'cover page; local derivative is a separate scan')
  omit('nara-v1', 1, 'visualRight', 'blank/background side not represented as a local PDF page')
  for (let leaf = 2; leaf <= 128; leaf += 1) {
    add('nara-v1', leaf, 'visualRight', leaf * 2 - 2, 'same_text_different_capture', 'NARA spread visual-right page precedes visual-left page in traditional local reading order')
    add('nara-v1', leaf, 'visualLeft', leaf * 2 - 1, 'same_text_different_capture', 'NARA spread visual-left page follows visual-right page in traditional local reading order')
  }
  add('nara-v1', 129, 'visualRight', 256, 'probable_correspondence', 'back/blank side; local derivative is a separate scan')
  omit('nara-v1', 129, 'visualLeft', 'outside-book/background side not represented as a local PDF page')

  add('nara-v2', 1, 'visualLeft', 257, 'probable_correspondence', 'volume-2 cover page; local derivative is a separate scan')
  add('nara-v2', 1, 'visualRight', 258, 'probable_correspondence', 'opening blank side retained by the local derivative')
  add('nara-v2', 2, 'visualLeft', 259, 'same_text_different_capture', 'first volume-2 text page')
  omit('nara-v2', 2, 'visualRight', 'blank/background side not represented as a local PDF page')
  for (let leaf = 3; leaf <= 136; leaf += 1) {
    add('nara-v2', leaf, 'visualRight', leaf * 2 + 254, 'same_text_different_capture', 'NARA spread visual-right page precedes visual-left page in traditional local reading order')
    add('nara-v2', leaf, 'visualLeft', leaf * 2 + 255, leaf === 136 ? 'probable_correspondence' : 'same_text_different_capture', leaf === 136 ? 'blank/side retained by the local derivative' : 'NARA spread visual-left page follows visual-right page in traditional local reading order')
  }
  add('nara-v2', 137, 'visualRight', 528, 'probable_correspondence', 'back/blank side; local derivative is a separate scan')
  omit('nara-v2', 137, 'visualLeft', 'outside-book/background side not represented as a local PDF page')
  return { rows, omitted, allSides: [...rows, ...omitted].sort((a, b) => a.volumeId.localeCompare(b.volumeId) || a.leafOrdinal - b.leafOrdinal || a.side.localeCompare(b.side)), localPageCount: rows.length, naraSideCount: rows.length + omitted.length, omittedSideCount: omitted.length }
}

function inspectLocalPdf() {
  const source = getPdfSourceMetadata(NANYANG_SOURCE_ID)
  const path = resolvePdfSourcePathSync(NANYANG_SOURCE_ID)
  const bytes = readFileSync(path)
  const pdfInfo = execFileSync(PDFINFO, [path], { encoding: 'utf8' })
  const pages = Number(pdfInfo.match(/^Pages:\s+(\d+)$/m)?.[1] || 0)
  const encrypted = pdfInfo.match(/^Encrypted:\s+(.+)$/m)?.[1]?.trim().toLowerCase() || 'unknown'
  if (sha256(bytes) !== source.expectedSha256) throw new Error('nanyang_pdf_sha256_mismatch')
  if (pages !== source.pageCount) throw new Error(`nanyang_pdf_page_count_mismatch:${pages}`)
  if (encrypted !== 'no') throw new Error(`nanyang_pdf_encryption_mismatch:${encrypted}`)
  return { sourceId: source.sourceId, envVar: source.envVar, path, byteLength: bytes.length, sha256: source.expectedSha256, pageCount: pages, encrypted, pdfInfo: pdfInfo.split('\n').filter(Boolean) }
}

function nativeReviewEvidence() {
  return Object.entries(NATIVE_REVIEW).map(([key, value]) => {
    const [volumeId, ordinalText] = key.split(':'); const leafOrdinal = Number(ordinalText); const volume = volumeById(volumeId); const capture = buildManifestIndex(volumeId)[leafOrdinal - 1]
    return { volumeId, itemId: volume.itemId, leafOrdinal, canvasId: capture.canvasId, nativeImageUrl: capture.nativeImageUrl, localCachePath: `/private/tmp/ziwei-nara-iiif-20260809/native-review/${volume.itemId}-${String(leafOrdinal).padStart(3, '0')}-max.jpg`, bytes: value.bytes, sha256: value.sha256, dimensions: { width: 3000, height: 2262 }, review: 'direct_visual_native_max' }
  })
}

function semanticObservations() {
  return [
    { id: 'nara-v1-c84-c86-bureau-charts', scope: 'nara-v1 leaf 84-86', review: 'native direct plus whole-volume 1200px locator', observation: '五行局 and branch/day chart grids are visible; they show chart cells and branch/day tokens but do not give a complete 12-palace-name legend bound to production ordinals.', supports: ['bureau_chart_surface', 'branch_and_slot_surface'], doesNotSupport: ['complete_palace_name_to_branch_binding', 'production_ordinal_anchor'] },
    { id: 'nara-v1-c87-c88-tianfu-branch-tables', scope: 'nara-v1 leaf 87-88', review: 'native direct plus whole-volume 1200px locator', observation: '安天府圖, branch columns, and 祿科權忌/table material are directly visible; the same frame does not establish all 12 palace labels, a production enum, or an accepted orientation.', supports: ['tianfu_chart_surface', 'branch_table_surface'], doesNotSupport: ['palace_name_to_branch_mapping', 'cycle_orientation_to_production_ordinal'] },
    { id: 'nara-v1-c89-c92-rule-examples', scope: 'nara-v1 leaf 89-92', review: 'native direct plus whole-volume 1200px locator', observation: 'rule/example prose and tables continue, but no complete shared semantic coordinate frame is visible.', supports: ['rule_example_surface'], doesNotSupport: ['complete_12_palace_semantics', 'semantic_authority'] },
    { id: 'nara-v2-c64-c80-chart-run', scope: 'nara-v2 leaf 64-80', review: 'native direct selected leaves plus whole-volume 1200px locator', observation: 'repeated natal-chart grids contain 命之 headings, names, bureau values, branch/day tokens, and stars; they are examples rather than a complete palace-name/branch/slot legend.', supports: ['repeated_chart_surface', 'cross-volume-textual-correspondence_candidate'], doesNotSupport: ['independent_oracle', 'complete_palace_name_to_branch_binding'] },
    { id: 'local-nanyang-chart-anchors', scope: 'local Nanyang PDF pages 167, 172, 175, 382-405 selected anchors', review: 'bundled pdftoppm at 110 dpi', observation: 'the local derivative contains the same visible families of bureau, 安天府, branch/day, transformation, and natal-chart material at the deterministic mapped pages; visual correspondence does not make this catalog volume pair an independent witness.', supports: ['local_nara_sequence_concordance'], doesNotSupport: ['independent_edition_semantic_authority', 'production_activation'] },
  ].sort((a, b) => a.id.localeCompare(b.id))
}

function buildSemanticWitness(concordance, observations) {
  const completeBindingCount = 0
  return {
    status: 'blocked_semantic_identity_insufficient',
    lineage: { catalogRecord: 'F1000000000000101426', sameRecord: true, sameEditionVolumePair: true, independentWitness: false, reason: 'NARA v1 and v2 are the two volumes of the same catalog record; local Nanyang is a derivative comparison target, not a third independent semantic oracle.' },
    requirements: [
      ['palace_names_all_12', 'not_complete'], ['palace_name_to_branch', 'not_established'], ['palace_name_to_physical_slot', 'not_established'],
      ['physical_slot_to_production_ordinal', 'not_established'], ['ming_shen_start_and_direction', 'not_established_by_NARA_leafmap'], ['cycle_order_and_orientation', 'not_established'],
      ['production_ordinal_anchor', 'not_located'], ['cross_edition_semantic_identity', 'not_established'], ['all_12_bindings_complete', 'not_complete'],
    ].map(([id, status]) => ({ id, status })),
    completeBindingCount,
    requiredBindingCount: 12,
    observations,
    representationRelations: {
      rotation06: { testedRows: 150, matchedRows: 150, status: 'representation_only', semanticAuthority: false, naraSupport: false },
      sourceBaseDirection: { testedRows: 150, matchedRows: 150, status: 'representation_only', semanticAuthority: false, naraSupport: false },
    },
    conclusion: 'The two NARA IIIF volumes exhaust the publicly reachable leaf-map reconnaissance frontier used here, but they do not close the semantic identity boundary. No source rule, numeric transform, local visual match, or same-record agreement is promoted to production authority.',
    productionMutation: false,
  }
}

function predecessorProtection() {
  const paths = [
    'artifacts/ziwei-palace-semantic-source-frontier-v1/complete.json',
    'artifacts/ziwei-p0-palace-semantic-witness-acquisition-route-v1/complete.json',
    'docs/ziwei-palace-semantic-source-frontier-v1.md',
    'docs/ziwei-p0-palace-semantic-witness-acquisition-route-v1.md',
  ]
  return Object.fromEntries(paths.map(path => [path, sha256(readFileSync(resolve(ROOT, path)))]))
}

export async function buildArtifact() {
  const observedHead = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()
  const basis = checkHistoricalRepositoryBasis(ROOT, BASIS_HEAD)
  if (basis.errors.length) throw new Error(`historical repository basis invalid:${basis.errors.join(',')}`)
  const localPdf = inspectLocalPdf()
  const manifestIndex = VOLUMES.map(volume => ({ ...volume, entries: buildManifestIndex(volume.volumeId) }))
  const concordance = buildConcordance()
  const observations = semanticObservations()
  const artifact = {
    schemaVersion: SCHEMA, verdictToken: VERDICT, basisHead: BASIS_HEAD, observedHead,
    source: { recordUrl: RECORD_URL, fileUrl: FILE_URL, catalogRecordId: 'F1000000000000101426', fileId: '1078787', callNumber: '子０６０－０００１', title: '新锓希夷陈先生紫微斗数全书', recordVolumeCount: 2, recordBookCount: 2, localComparison: localPdf },
    manifests: { presentationApi: 'IIIF Presentation 2', dimensions: { width: 6300, height: 4750 }, captureProfile: 'full/1200,/0/native.jpg for all-leaf locator; full/max/0/native.jpg for selected native review; originals remain outside repository', volumes: manifestIndex.map(({ entries, ...volume }) => ({ ...volume, firstCanvasId: entries[0].canvasId, lastCanvasId: entries.at(-1).canvasId, entries })) },
    captureReview: { allLeafsReviewed: true, reviewedLeafCount: 266, contactSheets: { storage: 'external_temp_only_not_in_git', root: '/private/tmp/ziwei-nara-iiif-20260809', volumes: { 'nara-v1': { leafCount: 129, captureIndexPath: VOLUMES[0].captureIndexPath, captureIndexSha256: VOLUMES[0].captureIndexSha256 }, 'nara-v2': { leafCount: 137, captureIndexPath: VOLUMES[1].captureIndexPath, captureIndexSha256: VOLUMES[1].captureIndexSha256 } } }, nativeSamples: nativeReviewEvidence() },
    localRenderAnchors: { storage: 'external_temp_only_not_in_git', tool: 'bundled pdftoppm', anchors: LOCAL_ANCHORS },
    concordance: { method: 'explicit traditional-reading-order leaf/side rule with boundary exceptions; no OCR or synthetic source substitution', localPdfPageCount: concordance.localPageCount, naraSideCount: concordance.naraSideCount, omittedSideCount: concordance.omittedSideCount, relationCounts: Object.fromEntries(['exact_same_leaf', 'same_text_different_capture', 'probable_correspondence', 'unresolved'].map(kind => [kind, concordance.allSides.filter(row => row.relation === kind).length])), rows: concordance.rows, omitted: concordance.omitted },
    semanticWitness: buildSemanticWitness(concordance, observations),
    boundaries: { sourceBytesAreNotSemanticAuthority: true, visualCorrespondenceIsNotIndependentOracle: true, sameRecordIsNotIndependentWitness: true, numericAgreementIsNotSemanticAuthority: true, sourcePresenceIsNotClaimVerification: true, stableClaimCount: 0, readiness: 'not_safe_to_start', grounding: 'blocked', activation: 'experimental', productionRuleModified: false, publicContractModified: false, readinessModified: false, productionModified: false, existingArtifactsModified: false, existingRouteModified: false, imagesStoredInGit: false, pdfStoredInGit: false, contractMutation: false },
    predecessorProtection: predecessorProtection(),
    deterministicContract: { generatedAt: 'forbidden', manifestRows: 'stableIndex ascending within volume; volume nara-v1 then nara-v2', concordanceRows: 'volume, leafOrdinal, side; local pages 1..528 exactly once', hashes: 'actual bytes where recorded; UTF-8 JSON including final LF', externalResearchCache: 'path and digest recorded but original NARA images are not copied to checkout' },
    materializer: `scripts/materialize-${SCHEMA}.mjs`, checker: `scripts/check-${SCHEMA}.mjs`, negativeChecker: `scripts/check-${SCHEMA}-negative.mjs`,
  }
  const inputPaths = [
    'src/artifactIdentity.js', 'scripts/lib/pdf-source-resolver.mjs', `scripts/materialize-${SCHEMA}.mjs`,
    'artifacts/ziwei-palace-semantic-source-frontier-v1/complete.json', 'artifacts/ziwei-p0-palace-semantic-witness-acquisition-route-v1/complete.json',
    'docs/ziwei-palace-semantic-source-frontier-v1.md', 'docs/ziwei-p0-palace-semantic-witness-acquisition-route-v1.md',
  ]
  return attachArtifactIdentity(artifact, buildArtifactIdentity({ root: ROOT, artifactId: SCHEMA, materializerPath: artifact.materializer, materializerVersion: MATERIALIZER_VERSION, baseHead: BASIS_HEAD, inputs: inputPaths }))
}

export async function writeArtifact(target = `artifacts/${SCHEMA}/complete.json`) {
  const artifact = await buildArtifact(); const dir = dirname(resolve(ROOT, target)); await mkdir(dir, { recursive: true })
  const body = Buffer.from(canonicalJson(artifact)); await writeFile(resolve(ROOT, target), body)
  const auxiliaries = { 'manifest-index.json': artifact.manifests, 'concordance.json': artifact.concordance, 'semantic-observations.json': artifact.semanticWitness, 'relation-graph.json': { nodes: artifact.manifests.volumes.flatMap(volume => volume.entries.map(entry => ({ id: entry.canvasId, kind: 'nara-canvas', leafOrdinal: entry.leafOrdinal, volumeId: volume.volumeId }))), edges: artifact.concordance.rows.map(row => ({ from: row.canvasId, to: `local-pdf-page:${row.localPdfPage}`, relation: row.relation, side: row.side })) } }
  for (const [name, value] of Object.entries(auxiliaries)) { const bytes = Buffer.from(canonicalJson(value)); const path = resolve(dir, name); await writeFile(path, bytes); await writeFile(`${path}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(bytes), artifactByteSha256Scope: 'UTF-8 bytes including final LF' }, null, 2)}\n`) }
  await writeFile(`${resolve(ROOT, target)}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(body), artifactByteSha256Scope: 'complete.json UTF-8 bytes including final LF' }, null, 2)}\n`)
  return artifact
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const artifact = await writeArtifact(process.argv[2] || `artifacts/${SCHEMA}/complete.json`)
  console.log(JSON.stringify({ schema: SCHEMA, verdict: artifact.verdictToken, basisHead: artifact.basisHead, localPageCount: artifact.concordance.localPdfPageCount, naraSideCount: artifact.concordance.naraSideCount, omittedSideCount: artifact.concordance.omittedSideCount, semanticStatus: artifact.semanticWitness.status }, null, 2))
}
