import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  attachArtifactIdentity,
  buildArtifactIdentity,
  canonicalIdentityJson,
} from '../src/artifactIdentity.js'
import { resolveFourTransformations } from '../src/ziwei/transformationResolver.js'

export const SCHEMA = 'ziwei-ming-four-transformations-source-scope-v1'
export const MATERIALIZER_VERSION = '1.0.0'
export const BASIS_HEAD = '5f44be9c9921637458ca7d211da3504e3ab985c9'
export const ARTIFACT_DIR = `artifacts/${SCHEMA}`
export const MATERIALIZER_PATH = `scripts/materialize-${SCHEMA}.mjs`

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const PDFINFO = '/Users/softie/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/pdfinfo'
const PDFTOPPM = '/Users/softie/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/pdftoppm'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const STEMS = Object.freeze(['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'])
const TYPES = Object.freeze([
  { key: 'lu', type: 'hua_lu', glyph: '化祿' },
  { key: 'quan', type: 'hua_quan', glyph: '化權' },
  { key: 'ke', type: 'hua_ke', glyph: '化科' },
  { key: 'ji', type: 'hua_ji', glyph: '化忌' },
])
const LABELS = Object.freeze({
  lianzhen: '廉貞', pojun: '破軍', wugu: '武曲', taiyang: '太陽',
  tianji: '天機', tianliang: '天梁', ziwei: '紫微', taiyin: '太陰',
  tiandong: '天同', wenchang: '文昌', jumen: '巨門', tanlang: '貪狼',
  youbi: '右弼', wengu: '文曲', tianfu: '天府', zuofu: '左輔',
})
const ALIASES = Object.freeze(Object.fromEntries(Object.entries(LABELS).map(([id, label]) => [label, id])))
const SEARCH_KEYS = Object.freeze([
  '安祿權科忌四星變化訣',
  '如甲生人廉貞化祿破軍化權武曲化科太陽化忌是也',
  '乙生人', '化祿', '化權', '化科', '化忌',
])

export const PDF_SOURCES = Object.freeze({
  mingNanyangtang: {
    id: 'ming_nanyangtang', label: '明代南阳堂刊本（当前基准扫描）',
    path: '/Users/softie/Downloads/新锓希夷陈先生紫微斗数全书.七卷.宋.陈抟撰.明.潘希尹补.明代南阳堂刊本.黑白版.pdf',
    sha256: '04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc', pageCount: 528,
  },
  nanbeiShanren: {
    id: 'nanbei_shanren', label: '南北山人本（比较 witness）',
    path: '/Users/softie/Downloads/命-南北山人_紫微斗数全书.pdf',
    sha256: '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023', pageCount: 219,
  },
})

const NANBEI_ROWS = Object.freeze([
  ['甲', ['廉貞', '破軍', '武曲', '太陽']], ['乙', ['天機', '天梁', '紫微', '太陰']],
  ['丙', ['天同', '天機', '文昌', '廉貞']], ['丁', ['太陰', '天同', '天機', '巨門']],
  ['戊', ['貪狼', '太陰', '右弼', '天機']], ['己', ['武曲', '貪狼', '天梁', '文曲']],
  ['庚', ['太陽', '武曲', '太陰', '天同']], ['辛', ['巨門', '太陽', '文曲', '文昌']],
  ['壬', ['天梁', '紫微', '天府', '武曲']], ['癸', ['破軍', '巨門', '太陰', '貪狼']],
])

const OFFICIAL = Object.freeze({
  institution: '国立公文書館（National Archives of Japan）, 内閣文庫',
  title: '新鋟希夷陳先生紫微斗数全書', callNumber: '子０６０－０００１',
  catalogUrl: 'https://www.digital.archives.go.jp/file/1078787',
  detailUrl: 'https://www.digital.archives.go.jp/das/meta/F1000000000000101426.html',
  volumes: [
    { volume: '冊次1', itemId: '4468520', manifestUrl: 'https://www.digital.archives.go.jp/api/iiif/4468520/manifest.json', canvases: 129, manifestSha256: '732991ca47aefc323ea2095a93202fd301421ad8b92994c63caae2a94acf75af' },
    { volume: '冊次2', itemId: '4469314', manifestUrl: 'https://www.digital.archives.go.jp/api/iiif/4469314/manifest.json', canvases: 137, manifestSha256: '3f167e1280527e1c672a72d7ef060c299ce9dffad1f362ddba04575da3df1560' },
  ],
  canvas76: {
    volume: '冊次1', canvasNumber: 76, canvasId: 'C102812185900',
    iiifImageUrl: 'https://www.digital.archives.go.jp/api/content/item/da12/C102812185900/iiif/M2019050811103249305_0076.jp2/full/max/0/native.jpg',
    imageSha256: '425d56fa0cf60ab66530e68ddf439a8a3b749a166a62fb67a9d74689304e9f61',
    imageByteLength: 865100, width: 3000, height: 2262,
  },
})

function pdfIdentity(source) {
  if (!existsSync(source.path)) throw new Error(`source_pdf_missing:${source.path}`)
  const bytes = readFileSync(source.path)
  const info = execFileSync(PDFINFO, [source.path], { encoding: 'utf8' })
  const pages = Number(info.match(/^Pages:\s+(\d+)/m)?.[1] || 0)
  const encrypted = (info.match(/^Encrypted:\s+(.+)/m)?.[1] || '').trim().toLowerCase() !== 'no'
  const pageSize = info.match(/^Page size:\s+(.+)$/m)?.[1]?.trim() || null
  const result = { id: source.id, label: source.label, pathOutsideRepository: source.path, actualByteSha256: sha256(bytes), expectedByteSha256: source.sha256, byteLength: bytes.length, pageCount: pages, encrypted, pageSize, readOnly: true, storedInGit: false }
  if (result.actualByteSha256 !== source.sha256) throw new Error(`source_pdf_hash_mismatch:${source.id}`)
  if (result.pageCount !== source.pageCount) throw new Error(`source_pdf_page_count_mismatch:${source.id}`)
  if (result.encrypted) throw new Error(`source_pdf_encrypted:${source.id}`)
  return result
}

function ref(id, sourceId, pdfPage, printedFolio, extra = {}) {
  const key = sourceId === 'ming_nanyangtang' ? 'mingNanyangtang' : 'nanbeiShanren'
  return { sourceRef: id, sourceId, pdfPage, printedFolio, fileIdentitySha256: PDF_SOURCES[key].sha256, ...extra }
}

function productionRows() {
  return STEMS.flatMap(stem => resolveFourTransformations(stem).transformations.map((item, index) => ({
    occurrenceId: `production:${stem}:${TYPES[index].type}`, stem, transformation: TYPES[index].type, transformationGlyph: TYPES[index].glyph,
    rawTargetLabel: LABELS[item.starId], normalizedStarId: item.starId, status: 'implemented', inputField: 'birthYearStem',
    ruleSetVersion: item.ruleSetVersion, sourceIndependent: false,
  })))
}

function sourceRows() {
  const rows = []
  const negativeRef = ref('ming-p145-160-four-transformations-negative-review', 'ming_nanyangtang', null, null, { pageRange: [145, 160], locatorType: 'range_negative_review' })
  const officialRef = pdfPage => ref('ming-p151-p152-official-canvas-76-same-witness', 'ming_nanyangtang', pdfPage, null, { locatorType: 'official_iiif_same_witness', ...OFFICIAL.canvas76 })
  for (const stem of STEMS) {
    const targets = stem === '甲' ? ['廉貞', '破軍', '武曲', '太陽'] : null
    TYPES.forEach((type, index) => {
      const rawTarget = targets?.[index] ?? null
      rows.push({
        occurrenceId: `ming_nanyangtang:${stem}:${type.type}`, edition: 'ming_nanyangtang', sourceTier: 'A', stem, transformation: type.type, transformationGlyph: type.glyph,
        rawTarget, normalizedStarId: rawTarget ? ALIASES[rawTarget] : null,
        sourceStatus: rawTarget ? 'direct_sentence_reading' : 'source_rule_not_located',
        resolutionStatus: rawTarget ? 'resolved_current_witness_only' : 'blocked_independent_tier_a_copy_unavailable',
        transcriptionConfidence: rawTarget ? 'high' : 'not_located_after_high_resolution_review',
        directReading: rawTarget ? '如甲生人廉貞化祿破軍化權武曲化科太陽化忌是也' : null,
        sourceRefs: [rawTarget ? officialRef(stem === '甲' ? 152 : null) : negativeRef],
        aliasResolution: rawTarget ? { rawGlyph: rawTarget, normalizedStarId: ALIASES[rawTarget], method: 'explicit_fixed_alias_table', postHoc: false } : null,
        independentReread: rawTarget ? { status: 'same_witness_official_iiif_confirmed', independentCopy: false } : { status: 'not_available', independentCopy: false },
      })
    })
  }
  for (const [stem, targets] of NANBEI_ROWS) TYPES.forEach((type, index) => rows.push({
    occurrenceId: `nanbei_shanren:${stem}:${type.type}`, edition: 'nanbei_shanren', sourceTier: 'B', stem, transformation: type.type, transformationGlyph: type.glyph,
    rawTarget: targets[index], normalizedStarId: ALIASES[targets[index]], sourceStatus: 'direct_table_reading', resolutionStatus: 'comparison_only', transcriptionConfidence: 'high',
    directReading: `${stem}${targets.join('')}`, sourceRefs: [ref('nanbei-p17-printed-42-four-transformations-table', 'nanbei_shanren', 17, '四十二', { locatorType: 'direct_high_resolution_plate' })],
    aliasResolution: { rawGlyph: targets[index], normalizedStarId: ALIASES[targets[index]], method: 'explicit_fixed_alias_table', postHoc: false },
    independentReread: { status: 'direct_high_resolution_re_read', independentCopy: false },
  }))
  return rows
}

function renderPages(source, from, to, dpi, quality, root, prefix) {
  const outputPrefix = resolve(root, prefix)
  execFileSync(PDFTOPPM, ['-f', String(from), '-l', String(to), '-r', String(dpi), '-jpeg', '-jpegopt', `quality=${quality}`, source.path, outputPrefix], { stdio: 'ignore' })
  const name = prefix.split('/').at(-1)
  const files = readdirSync(root).filter(file => file.startsWith(name) && file.endsWith('.jpg')).sort((a, b) => Number(a.match(/(\d+)\.jpg$/)?.[1]) - Number(b.match(/(\d+)\.jpg$/)?.[1]))
  return files.map(file => {
    const bytes = readFileSync(resolve(root, file))
    return { pdfPage: Number(file.match(/(\d+)\.jpg$/)?.[1]), byteLength: bytes.length, byteSha256: sha256(bytes) }
  })
}

function scanTopology(sourceIdentity) {
  const tempRoot = mkdtempSync('/private/tmp/ziwei-ming-source-scope-')
  try {
    const low = renderPages(PDF_SOURCES.mingNanyangtang, 1, 528, 24, 40, tempRoot, 'ming-low')
    const high = renderPages(PDF_SOURCES.mingNanyangtang, 140, 165, 300, 90, tempRoot, 'ming-high')
    const hashes = new Map()
    for (const page of low) hashes.set(page.byteSha256, [...(hashes.get(page.byteSha256) || []), page.pdfPage])
    const duplicateGroups = [...hashes.values()].filter(pages => pages.length > 1)
    const pageHashDigest = low.map(page => page.byteSha256)
    return {
      schemaVersion: SCHEMA, sourceId: 'ming_nanyangtang', sourceFileSha256: sourceIdentity.ming_nanyangtang.actualByteSha256,
      sourcePageCount: sourceIdentity.ming_nanyangtang.pageCount, renderBytesStoredInRepository: false,
      fullScan: { renderer: 'bundled Poppler pdftoppm', dpi: 24, jpegQuality: 40, renderedPageCount: low.length, uniqueRenderHashCount: hashes.size, exactDuplicateGroupCount: duplicateGroups.length, duplicateGroups, pageHashDigest, aggregateSha256: sha256(Buffer.from(pageHashDigest.join('\n'))) },
      focusedHighResolutionReview: { renderer: 'bundled Poppler pdftoppm', dpi: 300, jpegQuality: 90, reviewedPdfPages: high.map(page => page.pdfPage), pageHashRecords: high, pageRange: [140, 165], renderedOutsideRepository: true, ocrUsedForCanonicalDecision: false },
      topologyObservations: [
        { pageRange: [145, 150], observation: 'continuous body leaves before the heading; no blank, duplicate, reversed, or inserted page observed in focused review', confidence: 'high' },
        { pageRange: [151, 152], observation: 'continuous two-page rule context; p151 contains the heading and p152 contains the single 甲 example, then continues to unrelated text', confidence: 'high' },
        { pageRange: [153, 160], observation: 'continuous body leaves after the 甲 example; no 乙–癸 table or detached continuation observed', confidence: 'high' },
        { pageRange: [255, 256], observation: 'blank or near-blank scan leaves at a volume boundary', confidence: 'high' },
        { pageRange: [257, 257], observation: 'title leaf reading 紫微斗數全書', confidence: 'high' },
        { pageRange: [258, 258], observation: 'blank or near-blank scan leaf after the title leaf', confidence: 'high' },
        { pageRange: [259, 528], observation: 'subsequent body-leaf sequence; not used to infer Ming four-transformation cells', confidence: 'medium' },
      ],
      folioAndLayout: { plateFormat: 'single scanned page extracted from a bound leaf/spread source', pageCenterAndFolio: 'not safely visible in the cropped black-white PDF at p151–p152', volumeEvidence: { value: '卷三', confidence: 'medium', basis: 'predecessor direct locator plus continuous surrounding section; no new volume claim is used for cell values' }, bindingFeatures: ['black frame', 'vertical columns right-to-left', 'fish-tail/center-margin traces visible where not cropped'], edgeCutoff: 'some outer margins are cropped, but p151–p152 text panels and borders are intact' },
      topologyVerdict: { coreRangeMissingPageEvidence: false, coreRangeDuplicateEvidence: false, coreRangeReversalEvidence: false, coreRangeWrongInsertionEvidence: false, sourceScopeResolvedByCurrentWitness: false, conclusion: 'same-witness scan review supports a single 甲 example in the current witness but cannot prove the original edition scope without an independent Tier A copy' },
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
}

function candidateInventory(sourceIdentity) {
  return {
    schemaVersion: SCHEMA,
    tierPolicy: { A: 'same edition independent physical copy or independent scan', B: 'near-period or same textual lineage witness', C: 'later reprint, transcription, catalog, OCR, or modern table' },
    candidates: [
      { id: 'current_ming_black_white_pdf', tier: 'A', institution: 'National Archives of Japan source derivative as supplied locally', title: OFFICIAL.title, editionDescription: '明刊本, 南阳堂/葆和堂系', publicationInfo: '明刊本; catalog records 明', volumeCount: 7, holdingIdentifier: '子０６０－０００１', url: OFFICIAL.catalogUrl, access: 'local file available; original PDF outside repository', pageCount: sourceIdentity.ming_nanyangtang.pageCount, imageQuality: 'black-white single-page derivative; 528 pages', completeness: 'current file complete as a 528-page PDF but not a proof of complete original copy', downloaded: true, fileHash: sourceIdentity.ming_nanyangtang.actualByteSha256, identityRelation: 'basis witness; not independent of itself', use: 'canonical direct reading for p151/p152 only' },
      { id: 'national_archives_japan_iiif_same_witness', tier: 'A', institution: OFFICIAL.institution, title: OFFICIAL.title, editionDescription: '明刊本; 2冊; 7巻; 紅葉山文庫旧蔵', publicationInfo: '刊本, 明', volumeCount: 7, holdingIdentifier: OFFICIAL.callNumber, url: OFFICIAL.catalogUrl, access: 'public catalog and public IIIF image endpoints observed; no access restriction bypassed', pageCount: 266, imageQuality: 'IIIF source canvases 6300×4750; acquired canvas76 derivative 3000×2262', completeness: 'official manifests enumerate 129 + 137 canvases', downloaded: 'manifest snapshots and canvas76 downloaded outside repository', fileHash: { manifest1: OFFICIAL.volumes[0].manifestSha256, manifest2: OFFICIAL.volumes[1].manifestSha256, canvas76: OFFICIAL.canvas76.imageSha256 }, identityRelation: 'same underlying holding/witness or its official scan, not an independent alternate copy; alignment to current p151/p152 is direct visual evidence', use: 'same-witness plate confirmation and topology cross-check; cannot resolve independent-copy blocker' },
      { id: 'shuge_mirror', tier: 'A', institution: '书格', title: OFFICIAL.title, editionDescription: '明代南阳堂刊本; Japan Cabinet Library holding described', publicationInfo: '明刊本', volumeCount: 7, holdingIdentifier: 'not supplied', url: 'https://www.shuge.org/view/zi_wei_dou_shu_quan_shu/comment-page-1/', access: 'preview page public; full download not acquired', pageCount: 528, imageQuality: 'black-white PDF described as 34.5M; preview only in this run', completeness: 'claimed PDF mirror; independentness not established', downloaded: false, fileHash: null, identityRelation: 'likely same-witness mirror; not treated as independent', use: 'catalog/provenance lead only' },
      { id: 'nanbei_shanren_comparison_pdf', tier: 'B', institution: 'local supplied comparison file; holding not identified', title: '命-南北山人_紫微斗数全书', editionDescription: 'comparison witness; not asserted to be 南阳堂 edition', publicationInfo: 'unknown', volumeCount: null, holdingIdentifier: null, url: null, access: 'local file available', pageCount: sourceIdentity.nanbei_shanren.pageCount, imageQuality: '219-page scan; p17 table directly re-read at 300dpi', completeness: 'sufficient for its p17 table; full edition identity unresolved', downloaded: true, fileHash: sourceIdentity.nanbei_shanren.actualByteSha256, identityRelation: 'different comparison witness', use: 'raw/normalized cross-comparison only; never fills Ming nulls' },
      { id: 'shidian_modern_transcription', tier: 'C', institution: '識典古籍', title: OFFICIAL.title, editionDescription: 'web transcription/translation interface; edition identity not independently established', publicationInfo: 'modern web publication', volumeCount: 7, holdingIdentifier: 'SDZJ0170', url: 'https://www.shidianguji.com/zh/book/SDZJ0170/chapter/1jvzoopnqo0t6', access: 'public text page', pageCount: null, imageQuality: 'text/OCR/transcription; no canonical scan acquired', completeness: 'textual interface only', downloaded: false, fileHash: null, identityRelation: 'not independent scan', use: 'Tier C exploration only' },
      { id: '2017_hsin_i_tang_reprint', tier: 'C', institution: '心一堂', title: '紫微斗數全書(明末清初木刻真本)', editionDescription: 'later commercial reprint; not the same Ming Nanyangtang witness', publicationInfo: '2017, ISBN 9789888266944, 258 pages', volumeCount: null, holdingIdentifier: null, url: 'https://hsing-fa-tang.com.tw/book_detail.php?id=17329145311', access: 'commercial catalog page', pageCount: 258, imageQuality: 'book listing; scan not acquired', completeness: 'unknown', downloaded: false, fileHash: null, identityRelation: 'later reprint/near textual witness', use: 'Tier C context only' },
      { id: 'google_books_catalog', tier: 'C', institution: 'Google Books', title: OFFICIAL.title, editionDescription: 'bibliographic record only', publicationInfo: '2016 record', volumeCount: 7, holdingIdentifier: 'kxdy0QEACAAJ', url: 'https://books.google.com/books/about/%E6%96%B0%E9%8B%9F%E5%B8%8C%E5%A4%B7%E9%99%B3%E5%85%88%E7%94%9F%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E5%85%A8%E6%9B%B8.html?id=kxdy0QEACAAJ', access: 'public catalog', pageCount: null, imageQuality: 'catalog only', completeness: 'not applicable', downloaded: false, fileHash: null, identityRelation: 'not a scan', use: 'bibliographic lead only' },
    ],
    acquisitionConclusion: 'No independent alternate Tier A physical copy or scan was acquired in this run. The official National Archives IIIF material is a same-witness scan and is retained as direct plate/topology evidence, not as an independent edition witness.',
  }
}

function directTranscription(sourceRows, sourceIdentity) {
  return {
    schemaVersion: SCHEMA, ocrStatus: 'exploration_only_not_canonical', canonicalDecisionSource: 'direct_high_resolution_plate_reading', sourcePdfStoredInGit: false,
    locators: [
      { id: 'ming-p151-four-transformations-title', tier: 'A', sourceId: 'ming_nanyangtang', pdfPage: 151, officialCanvas: OFFICIAL.canvas76, printedFolio: null, volume: '卷三', directReading: '○安祿權科忌四星變化訣', readingMode: 'direct_high_resolution_plate', confidence: 'high', sourceScopeRole: 'heading_only' },
      { id: 'ming-p152-甲-four-transformations-example', tier: 'A', sourceId: 'ming_nanyangtang', pdfPage: 152, officialCanvas: OFFICIAL.canvas76, printedFolio: null, volume: '卷三', directReading: '如甲生人廉貞化祿破軍化權武曲化科太陽化忌是也', readingMode: 'direct_high_resolution_plate', confidence: 'high', sourceScopeRole: 'single_example_only' },
      { id: 'ming-p145-160-four-transformations-negative-review', tier: 'A', sourceId: 'ming_nanyangtang', pdfPage: null, pageRange: [145, 160], printedFolio: null, volume: '卷三', directReading: null, readingMode: 'focused_high_resolution_negative_review', confidence: 'high_for_current_witness_only', sourceScopeRole: 'negative_locator_not_nonexistence_proof', searchKeys: SEARCH_KEYS, uncertainty: ['does not prove all copies of the edition have the same scope'] },
      { id: 'nanbei-p17-printed-42-four-transformations-table', tier: 'B', sourceId: 'nanbei_shanren', pdfPage: 17, printedFolio: '四十二', directReading: '年干｜化祿｜化權｜化科｜化忌；甲乙丙丁戊己庚辛壬癸十行', readingMode: 'direct_high_resolution_plate', confidence: 'high', sourceScopeRole: 'comparison_table' },
    ],
    rawSourceRows: sourceRows.filter(row => row.sourceStatus !== 'source_rule_not_located'),
    blockedMingRows: sourceRows.filter(row => row.edition === 'ming_nanyangtang' && row.sourceStatus === 'source_rule_not_located').map(row => ({ occurrenceId: row.occurrenceId, sourceStatus: row.sourceStatus, rawTarget: null, normalizedStarId: null, sourceRefs: row.sourceRefs })),
    fileIdentities: { ming_nanyangtang: sourceIdentity.ming_nanyangtang, nanbei_shanren: sourceIdentity.nanbei_shanren },
    predecessorArtifacts: ['artifacts/ziwei-four-transformations-source-evidence-v0/complete.json', 'artifacts/ziwei-four-transformations-source-evidence-v0/transcription.json'],
    predecessorOverwritten: false,
  }
}

function compare(sourceRows, production) {
  const productionByKey = new Map(production.map(row => [`${row.stem}:${row.transformation}`, row]))
  const rows = sourceRows.map(source => {
    const prod = productionByKey.get(`${source.stem}:${source.transformation}`)
    const comparable = source.sourceStatus !== 'source_rule_not_located'
    const normalizedMatch = comparable && source.normalizedStarId === prod.normalizedStarId
    return { comparisonId: `${source.edition}:${source.stem}:${source.transformation}`, edition: source.edition, stem: source.stem, transformation: source.transformation, sourceTier: source.edition === 'ming_nanyangtang' ? 'A' : 'B', sourceRawTarget: source.rawTarget, sourceNormalizedStarId: source.normalizedStarId, productionRawTargetLabel: prod.rawTargetLabel, productionNormalizedStarId: prod.normalizedStarId, comparable, rawMatch: comparable ? source.rawTarget === prod.rawTargetLabel : null, normalizedMatch: comparable ? normalizedMatch : null, mismatch: comparable ? !normalizedMatch : false, verdict: comparable ? (normalizedMatch ? 'exact_match' : 'substantive_rule_divergence_proven') : 'source_rule_not_located', sourceRefs: source.sourceRefs, productionOccurrenceId: prod.occurrenceId }
  })
  const compared = rows.filter(row => row.comparable)
  return { schemaVersion: SCHEMA, rows, summary: { totalCells: rows.length, comparableCount: compared.length, exactNormalizedMatchCount: compared.filter(row => row.normalizedMatch).length, exactRawMatchCount: compared.filter(row => row.rawMatch).length, mismatchCount: compared.filter(row => row.mismatch).length, sourceRuleNotLocatedCount: rows.filter(row => !row.comparable).length, mingDirectComparableCount: rows.filter(row => row.edition === 'ming_nanyangtang' && row.comparable).length, nanbeiComparableCount: rows.filter(row => row.edition === 'nanbei_shanren' && row.comparable).length, productionValuesCopiedIntoMingBlockedCells: false }, comparisonBoundary: { unlocatedCellsAreNotMismatches: true, nanbeiAndProductionNeverPopulateMingCells: true, sourcePromotion: false } }
}

function resolutionMatrix(sourceRows, production) {
  const p = new Map(production.map(row => [`${row.stem}:${row.transformation}`, row]))
  const cells = sourceRows.filter(row => row.edition === 'ming_nanyangtang' && row.sourceStatus === 'source_rule_not_located').map(row => {
    const prod = p.get(`${row.stem}:${row.transformation}`)
    return { cellId: row.occurrenceId, stem: row.stem, transformation: row.transformation, sourceTier: 'A', locator: row.sourceRefs[0], cellStatus: 'source_rule_not_located', rawTarget: null, normalizedStarId: null, independentTierAWitness: 'unavailable', independentReread: 'not_available', productionReference: { rawTargetLabel: prod.rawTargetLabel, normalizedStarId: prod.normalizedStarId }, comparisonStatus: 'not_compared_source_unlocated', mismatch: false, blocker: 'independent_tier_a_witness_unavailable' }
  })
  return { schemaVersion: SCHEMA, cells, summary: { total: cells.length, sourceRuleNotLocated: cells.length, directlyResolved: 0, mismatches: 0, blocker: 'independent_tier_a_witness_unavailable' } }
}

function fieldKit() {
  return { schemaVersion: SCHEMA, requiredIfBlocked: true, items: [
    { priority: 'P0', material: '독립 명대 남양당본 원판면 스캔', edition: '新鋟希夷陳先生紫微斗数全書, 明刊南阳堂/葆和堂 계열, 七卷', requiredLeaves: ['卷三 安祿權科忌四星變化訣 주변의 제목·앞뒤 엽', '乙–癸가 있을 가능성이 있는 인접 권·엽', '책 전체 표지·권수·판심·어미·엽차 확인면'], requiredPhrase: '安祿權科忌四星變化訣; 如甲生人廉貞化祿破軍化權武曲化科太陽化忌是也; 乙生人', priorityReason: '동일 판본 복본이 甲 단일 예시인지 직접 증명하는 유일한 Tier A 경로', canonicalCriteria: ['기관/소장번호와 원본 catalog 연결', '실물 또는 독립 스캔의 판식·권차·판심·어미 일치', '원본 이미지 파일 hash와 다운로드 시각', '페이지가 아닌 printed folio/leaf locator 보존'] },
    { priority: 'P1', material: '국립공문서관 내각문고 공식 원판 JP2/IIIF 원본', edition: OFFICIAL.title, requiredLeaves: ['冊次1 canvas 76과 양옆 canvas', '冊次1 전체 129 canvas', '冊次2 전체 137 canvas'], requiredPhrase: 'p151/p152 대응 펼침면의 제목·甲 예시와 그 다음 본문', priorityReason: '현재 PDF derivative의 원 witness를 완결성 있게 재현하고 split/omission을 판정', canonicalCriteria: ['manifest URL·canvas ID·파일 hash', '현재 PDF와 같은 witness인지 별도 복본인지 명시', '접근 제한을 우회하지 않고 공식 endpoint 사용'] },
    { priority: 'P2', material: '후대 영인·전사·현대 정리본', edition: '同書 또는 紫微斗數全集 계열', requiredLeaves: ['四化 표 또는 乙–癸 문장'], requiredPhrase: '乙生人; 化祿; 化權; 化科; 化忌', priorityReason: '탐색·이체자 교차확인만 수행', canonicalCriteria: ['판본 연대·편집·원문/전사 구분', '명대본 직접 전사로 승격 금지'] },
  ], constraints: ['웹 OCR·검색 snippet·현대 표는 명대본 canonical transcription이 아님', '독립 Tier A 확보 전 36셀은 blocker 유지', 'production/공개 계약/readiness/activation/source promotion 변경 금지'] }
}

function validation(topology, candidates, direct, matrix, comparison) {
  const independentTierACopyCount = candidates.candidates.filter(c => c.tier === 'A' && c.identityRelation?.includes('independent alternate') && !c.identityRelation?.includes('not an independent alternate')).length
  return { schemaVersion: SCHEMA, sourceIdentity: { currentPdfVerified: true, comparisonPdfVerified: true, externalManifestsHashRecorded: true }, topology: { fullScanPageCount: topology.fullScan.renderedPageCount, exactDuplicateGroupCount: topology.fullScan.exactDuplicateGroupCount, focusedPages: topology.focusedHighResolutionReview.reviewedPdfPages.length, coreRange: [145, 160], result: 'current_core_range_structurally_reviewed' }, tierValidation: { tierAIndependentAlternateCopyCount: independentTierACopyCount, officialSameWitnessRetained: true, sourceTierRequiredForCanonical: 'A', tierBOrCUsedToFillMing: false }, transcription: { directMingCells: direct.rawSourceRows.filter(row => row.edition === 'ming_nanyangtang').length, directNanbeiCells: direct.rawSourceRows.filter(row => row.edition === 'nanbei_shanren').length, mingBlockedCells: matrix.summary.sourceRuleNotLocated, allBlockedNullsPreserved: true, ocrCanonical: false }, comparison: { total: comparison.summary.totalCells, comparable: comparison.summary.comparableCount, exact: comparison.summary.exactNormalizedMatchCount, mismatches: comparison.summary.mismatchCount, unlocatedNotMismatch: comparison.summary.sourceRuleNotLocatedCount }, boundaries: { productionCalculationChanged: false, publicContractChanged: false, readinessChanged: false, groundingChanged: false, activationChanged: false, semanticIdentityPromoted: false, stableClaimCreated: false, sourcePromoted: false, predecessorOverwritten: false } }
}

function conclusion(artifact, topology, candidates, matrix, comparison) {
  const rows = NANBEI_ROWS.map(([stem, targets]) => '| ' + stem + ' | ' + targets.join(' | ') + ' |').join('\n')
  return [
    '# 明代南阳堂本四化 source scope successor v1', '',
    '- verdict: ' + artifact.verdict, '- basis HEAD: ' + artifact.basisHead, '- predecessor: ziwei-four-transformations-source-evidence-v0 (preserved)', '',
    '## Verdict and boundary', '',
    'The current 528-page black-white PDF was re-hashed from its supplied path and re-reviewed. p151 directly contains ○安祿權科忌四星變化訣; p152 directly contains only the 甲 sentence 如甲生人廉貞化祿破軍化權武曲化科太陽化忌是也. p153 onward continues with other rules. No 乙–癸 table was found in the high-resolution p145–160 review.',
    '',
    'The National Archives of Japan public IIIF canvas 76 re-renders the same p151/p152 spread and confirms the current witness reading. It is the same holding/witness or its official scan, not an independent alternate copy. Therefore the result is not promoted to source_scope_confirmed_single_example: the original-edition scope remains unresolved until a genuinely independent Tier A copy is obtained.',
    '',
    '## Current PDF topology audit', '',
    '- Full low-resolution render: ' + topology.fullScan.renderedPageCount + '/528 pages; unique render hashes ' + topology.fullScan.uniqueRenderHashCount + '; exact duplicate groups ' + topology.fullScan.exactDuplicateGroupCount + '.',
    '- Focused high-resolution range: p140–165; p145–160 is continuous in the current scan with no observed missing, duplicated, reversed, wrongly inserted, or cut-off page capable of hiding a 乙–癸 table.',
    '- Boundary anomaly preserved: p255–256 blank/near-blank, p257 title leaf, p258 blank/near-blank. These are topology facts, not four-transformation values.', '',
    '## Direct transcription', '',
    '| 年干 | 化祿 | 化權 | 化科 | 化忌 |', '|---|---|---|---|---|',
    rows, '',
    'The table above is the Tier B comparison witness only. Ming 甲 has four directly read cells; Ming 乙–癸 remain explicit null blockers. No Nanbei or production value is copied into a Ming cell.', '',
    '## 36-cell matrix', '',
    'All ' + matrix.summary.total + ' Ming 乙–癸 cells are source_rule_not_located, with raw/normalized values null, independent Tier A witness unavailable, and comparison status not-comparable. They are not counted as mismatches.',
    '',
    'Comparison: ' + comparison.summary.exactNormalizedMatchCount + ' normalized exact matches among ' + comparison.summary.comparableCount + ' directly acquired cells; ' + comparison.summary.mismatchCount + ' mismatches; ' + comparison.summary.sourceRuleNotLocatedCount + ' unlocated cells remain blocked.',
    '',
    '## Candidate witnesses and acquisition', '',
    'The candidate inventory contains ' + candidates.candidates.length + ' records. Only the current witness and the official same-witness IIIF are Tier A material; no independent alternate Tier A copy was acquired. Tier B/C candidates are exploration or comparison only. See source-acquisition-field-kit.json for the exact P0/P1/P2 request fields.',
    '',
    '## Safety boundary', '',
    'Production calculation, public contract, readiness, grounding, activation, semantic identity, stable claims, and source promotion were not changed. The predecessor artifact was not overwritten.', '',
  ].join('\n')
}

function stableFileHashes(files, conclusionText) {
  const result = Object.fromEntries(Object.entries(files).map(([name, value]) => {
    const bytes = Buffer.from(canonicalIdentityJson(value))
    return [name + '.json', { path: ARTIFACT_DIR + '/' + name + '.json', byteLength: bytes.length, byteSha256: sha256(bytes) }]
  }))
  result['conclusion.md'] = { path: ARTIFACT_DIR + '/conclusion.md', byteLength: Buffer.byteLength(conclusionText), byteSha256: sha256(Buffer.from(conclusionText)) }
  return result
}

export function buildArtifact() {
  const actualHead = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()
  const sourceIdentity = Object.fromEntries(Object.values(PDF_SOURCES).map(source => [source.id, pdfIdentity(source)]))
  const topology = scanTopology(sourceIdentity)
  const candidates = candidateInventory(sourceIdentity)
  const source = sourceRows()
  const production = productionRows()
  const direct = directTranscription(source, sourceIdentity)
  const matrix = resolutionMatrix(source, production)
  const comparison = compare(source, production)
  const files = {
    inventory: { schemaVersion: SCHEMA, sourceIdentity, sourcePdfStoredInGit: false, predecessorArtifacts: direct.predecessorArtifacts },
    'scan-topology': topology,
    'candidate-witnesses': candidates,
    'direct-transcription': direct,
    'resolution-matrix': matrix,
    comparison,
    'production-trace': { schemaVersion: SCHEMA, rows: production, calculationChanged: false, publicContractChanged: false },
    validation: validation(topology, candidates, direct, matrix, comparison),
    'source-acquisition-field-kit': fieldKit(),
  }
  const completeBase = {
    schemaVersion: SCHEMA, basisHead: BASIS_HEAD, verdict: 'blocked_ziwei_ming_four_transformations_tier_a_witness_unavailable',
    artifactFiles: { ...Object.fromEntries(Object.keys(files).map(name => [name, ARTIFACT_DIR + '/' + name + '.json'])), complete: ARTIFACT_DIR + '/complete.json', conclusion: ARTIFACT_DIR + '/conclusion.md' },
    artifactHashes: {}, sourceIdentity, sourceOccurrenceSummary: { mingDirect: 4, mingBlocked: 36, nanbeiDirect: 40, production: 40 },
    comparisonSummary: comparison.summary, resolutionSummary: matrix.summary,
    observedHeadPolicy: { observedHead: 'artifactIdentity.observedHead is diagnostic only; it is never a current-HEAD equality gate', currentHeadEqualityGate: false },
    boundaries: { productionEngineModified: false, publicContractModified: false, readinessChanged: false, groundingChanged: false, activationChanged: false, semanticIdentityPromotion: false, stableClaimCount: 0, sourcePromotion: false, predecessorOverwritten: false },
    predecessorArtifacts: direct.predecessorArtifacts, generatedBy: MATERIALIZER_PATH,
  }
  const conclusionText = conclusion(completeBase, topology, candidates, matrix, comparison)
  completeBase.artifactHashes = stableFileHashes(files, conclusionText)
  const identity = buildArtifactIdentity({ root: ROOT, artifactId: SCHEMA, materializerPath: MATERIALIZER_PATH, materializerVersion: MATERIALIZER_VERSION, baseHead: BASIS_HEAD, inputs: ['src/artifactIdentity.js', 'src/ziwei/transformationResolver.js', 'src/ziwei/transformationRules.js', 'artifacts/ziwei-four-transformations-source-evidence-v0/complete.json', 'artifacts/ziwei-four-transformations-source-evidence-v0/transcription.json'] })
  identity.observedHead = actualHead
  return { artifact: attachArtifactIdentity(completeBase, identity), files, conclusion: conclusionText }
}

async function writeJson(path, value) {
  await writeFile(resolve(ROOT, path), canonicalIdentityJson(value))
}

export async function materializeToDisk() {
  const result = buildArtifact()
  await mkdir(resolve(ROOT, ARTIFACT_DIR), { recursive: true })
  for (const [name, value] of Object.entries(result.files)) await writeJson(ARTIFACT_DIR + '/' + name + '.json', value)
  await writeJson(ARTIFACT_DIR + '/complete.json', result.artifact)
  await writeFile(resolve(ROOT, ARTIFACT_DIR + '/conclusion.md'), result.conclusion)
  const outputs = [...Object.keys(result.files).map(name => ARTIFACT_DIR + '/' + name + '.json'), ARTIFACT_DIR + '/complete.json', ARTIFACT_DIR + '/conclusion.md']
  for (const path of outputs) {
    const bytes = await readFile(resolve(ROOT, path))
    await writeJson(path + '.integrity.json', { schemaVersion: 'artifact-integrity-sidecar-v1', path, byteSha256: sha256(bytes), byteLength: bytes.length, source: 'actual_output_bytes' })
  }
  return { artifact: result.artifact, outputs }
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const result = await materializeToDisk()
  console.log(JSON.stringify({ schema: SCHEMA, verdict: result.artifact.verdict, outputCount: result.outputs.length, sourceSummary: result.artifact.sourceOccurrenceSummary }, null, 2))
}
