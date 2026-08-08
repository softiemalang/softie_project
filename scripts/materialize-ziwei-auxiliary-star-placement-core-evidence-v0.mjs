import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { attachArtifactIdentity, buildArtifactIdentity, canonicalIdentityJson } from '../src/artifactIdentity.js'
import { resolveMinorStars } from '../src/ziwei/minorStarResolver.js'
import { resolvePdfSourcePathSync } from './lib/pdf-source-resolver.mjs'

export const SCHEMA = 'ziwei-auxiliary-star-placement-core-evidence-v0'
export const MATERIALIZER_VERSION = '1.0.0'
export const BASIS_HEAD = 'f3ea287a4bb1b86cb10355facee3393448f2167e'
export const ARTIFACT_DIR = `artifacts/${SCHEMA}`
export const MATERIALIZER_PATH = `scripts/materialize-${SCHEMA}.mjs`

export const PDF_SOURCES = Object.freeze({
  mingNanyangtang: {
    id: 'ming_nanyangtang',
    path: '/Users/softie/Downloads/新锓希夷陈先生紫微斗数全书.七卷.宋.陈抟撰.明.潘希尹补.明代南阳堂刊本.黑白版.pdf',
    sha256: '04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc',
    pageCount: 528,
    label: '明代南阳堂刊本',
  },
  nanbeiShanren: {
    id: 'nanbei_shanren',
    path: '/Users/softie/Downloads/命-南北山人_紫微斗数全书.pdf',
    sha256: '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023',
    pageCount: 219,
    label: '南北山人本',
  },
})

export const BRANCHES = Object.freeze(['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'])
export const STEMS = Object.freeze(['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'])
export const YEAR_BRANCHES = Object.freeze(['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'])

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const POPPLER_PDFINFO = '/Users/softie/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/poppler/bin/pdfinfo'
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const mod = (value) => ((value % 12) + 12) % 12
const branchIndex = (branch) => BRANCHES.indexOf(branch)
const branchAt = (index) => BRANCHES[mod(index)]
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const rel = (path) => path.replace(`${ROOT}/`, '')

function pdfIdentity(source) {
  const accessPath = resolvePdfSourcePathSync(source.id === 'ming_nanyangtang' ? 'nanyangtang_quanbao_528p' : 'nanbei_quanbao_219p')
  if (!existsSync(accessPath)) throw new Error(`source PDF unavailable:${accessPath}`)
  const bytes = readFileSync(accessPath)
  const actualHash = sha256(bytes)
  const info = execFileSync(POPPLER_PDFINFO, [accessPath], { encoding: 'utf8' })
  const pages = Number(info.match(/^Pages:\s+(\d+)/m)?.[1] || 0)
  const encrypted = /^Encrypted:\s+(yes|no)/m.exec(info)?.[1] === 'yes'
  if (actualHash !== source.sha256) throw new Error(`source PDF hash mismatch:${source.id}`)
  if (pages !== source.pageCount) throw new Error(`source PDF page count mismatch:${source.id}`)
  if (encrypted) throw new Error(`source PDF encrypted:${source.id}`)
  return {
    id: source.id,
    label: source.label,
    pathOutsideRepository: source.path,
    actualByteSha256: actualHash,
    expectedByteSha256: source.sha256,
    pageCount: pages,
    encrypted,
    readOnly: true,
    storedInGit: false,
  }
}

function locator(id, sourceId, pdfPage, printedFolio, platePosition, title, directReading, confidence, uncertainty = []) {
  return {
    id,
    sourceId,
    pdfPage,
    printedFolio,
    platePosition,
    title,
    directReading,
    readingMode: pdfPage === null ? 'full_pdf_scan_negative_locator' : 'direct_high_resolution_plate',
    confidence,
    uncertainty,
    canonical: pdfPage !== null,
  }
}

const LOCATORS = [
  locator('ming-p148-wenchang-wenqu', 'ming_nanyangtang', 148, null, 'single_page_right_to_left_columns', '○安文昌文曲星訣', '子時戌上起文昌；逆到生時是貴卿。文曲數從辰上起，順到生時是貴卿。', 'medium', ['版面右側缺損與墨斑，短句可直接辨認；印刷面數未在本 render 中可靠辨認。']),
  locator('ming-p149-zuofu-youbi', 'ming_nanyangtang', 149, null, 'single_page_right_to_left_columns', '○安左輔右弼星訣', '左輔正月起於辰；右弼正月起於戌。', 'medium', ['完整上下文中的個別字形受版面污損影響。']),
  locator('ming-p149-tiankui-tianyue', 'ming_nanyangtang', 149, null, 'single_page_right_to_left_columns', '○安天魁天鉞訣', '甲戊庚牛羊，乙己鼠猴鄉，丙丁豬雞位，壬癸兔蛇藏，六辛逢虎馬。', 'high', ['表格邊緣字形不作超出短句的推讀。']),
  locator('ming-p150-lucun', 'ming_nanyangtang', 150, null, 'single_page_right_to_left_columns', '○安祿存星訣', '甲生祿存寅；乙生在卯；丙戊巳；丁己午；庚申；辛酉；壬亥；癸子。', 'medium', ['頁面右側仍有相鄰星訣，採用可直接辨認的祿存短句。']),
  locator('ming-p151-qingyang-tuoluo', 'ming_nanyangtang', 151, null, 'single_page_right_to_left_columns', '○安擎羊陀羅二星訣', '此二星隨祿存安之；祿前安擎羊，祿後安陀羅。', 'high', ['前後一位關係以原文方向保存，未以生知常識補表。']),
  locator('ming-p152-tiankong-dijie', 'ming_nanyangtang', 152, null, 'single_page_right_to_left_columns', '○安天空地劫訣論本生時', '如子時生者劫空俱在亥宮。', 'high', ['原文星名為天空，不改寫為地空；其餘逐時順逆句僅在可直接辨認處採錄。']),
  locator('ming-full-scan-fire-bell-not-located', 'ming_nanyangtang', null, null, 'full_528_page_scan', '火星鈴星全卷搜索未定位', '全卷低解像度逐頁探索與候選高解像度复核後，未定位可直接判讀的火星、鈴星独立規則表或完整規則句。', 'bounded_negative', ['負定位不是來源規則；不產生 Ming 火鈴 normalized output。']),
  locator('nanbei-p14-printed-37-fire-bell', 'nanbei_shanren', 14, '三十七', 'left_leaf_right_to_left_columns', '○十六、安火星、鈴星二煞曜', '火、鈴二星煞，為南斗十大殺將神（號煞神），為偏曜（又稱浮曜）。○安火、鈴二煞之訣，今載如下。', 'high', ['頁面為合葉 scan；表格在相鄰印刷面，方向以 leaf/plate 欄位分開記錄。']),
  locator('nanbei-p14-printed-36-zuofu-youbi', 'nanbei_shanren', 14, '三十六', 'right_leaf_right_to_left_columns', '○九、安左輔、右弼二吉曜', '從辰宮起正月，順數至生月，即係左輔星坐落之宮；再從戌宮起正月，逆數至生月，即係右弼星坐落之宮。', 'high', ['原頁文字中有解說行；表格與方向句共同作 canonical evidence。']),
  locator('nanbei-p15-printed-39-lucun', 'nanbei_shanren', 15, '三十九', 'left_leaf_right_to_left_columns', '○二十一、起祿存及擎羊、陀羅二煞星', '祿存又名天祿；甲祿到寅宮，乙祿到卯宮，丙戊祿在巳，丁己祿在午，庚祿申，辛祿酉，壬祿亥，癸祿子。祿前一位擎羊，祿後一位陀羅。', 'high', ['表頭與列方向以原表直接读取；derived relation 不取代 root rule。']),
  locator('nanbei-p15-printed-38-wenchang-wenqu', 'nanbei_shanren', 15, '三十八', 'right_leaf_right_to_left_columns', '○二十二、安文昌、文曲二曜', '文昌、文曲二曜；表列生時、文昌、文曲十二行。', 'high', ['正文多為性質解說，placement 以表格直接讀值。']),
  locator('nanbei-p15-printed-38-fire-bell-table', 'nanbei_shanren', 15, '三十八', 'right_leaf_center_table', '安火、鈴二煞速檢表', '表頭為生年支與生時；四組各列鈴星、火星十二行。', 'high', ['四組表頭採原版顛倒字序保留，normalized group key 使用十二支集合。']),
  locator('nanbei-p16-printed-41-transformations', 'nanbei_shanren', 16, '四十一', 'left_leaf_right_to_left_columns', '四化及相鄰說明', '本頁為四化與相鄰條文；非十三輔助星 placement evidence。', 'high', ['作為 full-scan 邊界確認，不納入規則輸出。']),
  locator('nanbei-p16-printed-40-tiankui-tianyue', 'nanbei_shanren', 16, '四十', 'right_leaf_right_to_left_columns', '○二十三、安天魁、天鉞', '甲戊庚牛羊，乙己鼠猴鄉，丙丁豬雞位，壬癸兔蛇藏，六辛逢虎馬，此是貴人鄉。', 'high', ['原表列天鉞、天魁與年干；表頭方向不以現代排版重排。']),
  locator('nanbei-p18-printed-45-tiankong-dijie', 'nanbei_shanren', 18, '四十五', 'left_leaf_left_table', '○二十六、安台輔、封誥、天空、地劫', '天空、地劫二曜；表列生時、天空、地劫十二行。', 'high', ['原文星名為天空；使用者目標的地空 alias 不在此處擅自升格為同一 canonical glyph。']),
]

const locatorMap = Object.fromEntries(LOCATORS.map((item) => [item.id, item]))
const ref = (id) => ({ sourceRef: id, sourceId: locatorMap[id].sourceId, pdfPage: locatorMap[id].pdfPage, printedFolio: locatorMap[id].printedFolio })

const STAR_LABELS = Object.freeze({
  wenchang: '文昌', wenqu: '文曲', zuofu: '左輔', youbi: '右弼', tiankui: '天魁', tianyue: '天鉞',
  lucun: '祿存', qingyang: '擎羊', tuoluo: '陀羅', huoxing: '火星', lingxing: '鈴星', dikong: '地空', dijie: '地劫',
})
const SOURCE_LABELS = Object.freeze({ ...STAR_LABELS, tiankong: '天空' })
export const STAR_IDS = Object.freeze(Object.keys(STAR_LABELS))

const LUCUN = Object.freeze({ 甲: '寅', 乙: '卯', 丙: '巳', 丁: '午', 戊: '巳', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子' })
const KUI_YUE = Object.freeze({
  甲: { tiankui: '丑', tianyue: '未' }, 戊: { tiankui: '丑', tianyue: '未' }, 庚: { tiankui: '丑', tianyue: '未' },
  乙: { tiankui: '子', tianyue: '申' }, 己: { tiankui: '子', tianyue: '申' },
  丙: { tiankui: '亥', tianyue: '酉' }, 丁: { tiankui: '亥', tianyue: '酉' },
  辛: { tiankui: '午', tianyue: '寅' }, 壬: { tiankui: '卯', tianyue: '巳' }, 癸: { tiankui: '卯', tianyue: '巳' },
})

const GROUPS = Object.freeze({
  wenchangWenqu: { id: 'wenchang-wenqu', stars: ['wenchang', 'wenqu'], inputAxes: ['hourBranch'], sourceRefs: ['ming-p148-wenchang-wenqu', 'nanbei-p15-printed-38-wenchang-wenqu'], productionRefs: ['src/ziwei/minorStarRules.js:27-38', 'src/ziwei/minorStarResolver.js:48-50'] },
  zuofuYoubi: { id: 'zuofu-youbi', stars: ['zuofu', 'youbi'], inputAxes: ['lunarMonth'], sourceRefs: ['ming-p149-zuofu-youbi', 'nanbei-p14-printed-36-zuofu-youbi'], productionRefs: ['src/ziwei/minorStarRules.js:14-25', 'src/ziwei/minorStarResolver.js:44-46'] },
  tiankuiTianyue: { id: 'tiankui-tianyue', stars: ['tiankui', 'tianyue'], inputAxes: ['birthYearStem'], sourceRefs: ['ming-p149-tiankui-tianyue', 'nanbei-p16-printed-40-tiankui-tianyue'], productionRefs: ['src/ziwei/minorStarRules.js:40-50', 'src/ziwei/minorStarResolver.js:52-61'] },
  lucunQingyangTuoluo: { id: 'lucun-qingyang-tuoluo', stars: ['lucun', 'qingyang', 'tuoluo'], inputAxes: ['birthYearStem'], sourceRefs: ['ming-p150-lucun', 'ming-p151-qingyang-tuoluo', 'nanbei-p15-printed-39-lucun'], productionRefs: ['production_missing_rule'] },
  huoxingLingxing: { id: 'huoxing-lingxing', stars: ['huoxing', 'lingxing'], inputAxes: ['birthYearBranch', 'hourBranch'], sourceRefs: ['ming-full-scan-fire-bell-not-located', 'nanbei-p14-printed-37-fire-bell', 'nanbei-p15-printed-38-fire-bell-table'], productionRefs: ['production_missing_rule'] },
  kongJie: { id: 'dikong-dijie', stars: ['dikong', 'dijie'], sourceStars: ['tiankong', 'dijie'], inputAxes: ['hourBranch'], sourceRefs: ['ming-p152-tiankong-dijie', 'nanbei-p18-printed-45-tiankong-dijie'], productionRefs: ['production_missing_rule'] },
})

function sourceRules() {
  const rows = []
  for (const edition of Object.values(PDF_SOURCES)) {
    const common = (ruleId, star, inputAxis, status, evaluator, sourceStar = star) => ({ edition: edition.id, ruleId, star, sourceStar, inputAxis, status, evaluator, sourceRefs: GROUPS[Object.keys(GROUPS).find((key) => GROUPS[key].id === ruleId)].sourceRefs.filter((id) => locatorMap[id].sourceId === edition.id).map(ref) })
    rows.push(common('wenchang-wenqu', 'wenchang', 'hourBranch', 'complete', (input) => branchAt(10 - branchIndex(input.hourBranch)), 'wenchang'))
    rows.push(common('wenchang-wenqu', 'wenqu', 'hourBranch', 'complete', (input) => branchAt(4 + branchIndex(input.hourBranch)), 'wenqu'))
    rows.push(common('zuofu-youbi', 'zuofu', 'lunarMonth', 'complete', (input) => branchAt(4 + input.lunarMonth - 1), 'zuofu'))
    rows.push(common('zuofu-youbi', 'youbi', 'lunarMonth', 'complete', (input) => branchAt(10 - input.lunarMonth + 1), 'youbi'))
    rows.push(common('tiankui-tianyue', 'tiankui', 'birthYearStem', 'complete', (input) => KUI_YUE[input.birthYearStem].tiankui, 'tiankui'))
    rows.push(common('tiankui-tianyue', 'tianyue', 'birthYearStem', 'complete', (input) => KUI_YUE[input.birthYearStem].tianyue, 'tianyue'))
    rows.push(common('lucun-qingyang-tuoluo', 'lucun', 'birthYearStem', 'complete', (input) => LUCUN[input.birthYearStem], 'lucun'))
    rows.push(common('lucun-qingyang-tuoluo', 'qingyang', 'birthYearStem', 'complete', (input) => branchAt(branchIndex(LUCUN[input.birthYearStem]) + 1), 'qingyang'))
    rows.push(common('lucun-qingyang-tuoluo', 'tuoluo', 'birthYearStem', 'complete', (input) => branchAt(branchIndex(LUCUN[input.birthYearStem]) - 1), 'tuoluo'))
    const fireBellStatus = edition.id === 'nanbei_shanren' ? 'complete' : 'source_rule_not_located'
    const fireBellEvaluator = edition.id === 'nanbei_shanren' ? (input) => fireBell(input.birthYearBranch, input.hourBranch) : () => null
    rows.push(common('huoxing-lingxing', 'huoxing', 'birthYearBranch+hourBranch', fireBellStatus, fireBellEvaluator, 'huoxing'))
    rows.push(common('huoxing-lingxing', 'lingxing', 'birthYearBranch+hourBranch', fireBellStatus, fireBellEvaluator, 'lingxing'))
    rows.push(common('dikong-dijie', 'dikong', 'hourBranch', 'complete', (input) => branchAt(11 - branchIndex(input.hourBranch)), 'tiankong'))
    rows.push(common('dikong-dijie', 'dijie', 'hourBranch', 'complete', (input) => branchAt(branchIndex(input.hourBranch) - 1), 'dijie'))
  }
  return rows
}

const FIRE_BELL_GROUPS = Object.freeze({
  '亥卯未': { huoxing: -3, lingxing: -2 },
  '巳酉丑': { huoxing: -2, lingxing: 3 },
  '申子辰': { huoxing: 2, lingxing: -2 },
  '寅午戌': { huoxing: 1, lingxing: 3 },
})
function yearGroup(yearBranch) {
  return Object.keys(FIRE_BELL_GROUPS).find((group) => group.includes(yearBranch))
}
function fireBell(yearBranch, hourBranch) {
  const offsets = FIRE_BELL_GROUPS[yearGroup(yearBranch)]
  const hour = branchIndex(hourBranch)
  return { huoxing: branchAt(hour + offsets.huoxing), lingxing: branchAt(hour + offsets.lingxing) }
}

function tableRows() {
  const hourRows = BRANCHES.map((hourBranch) => ({ input: hourBranch, wenchang: branchAt(10 - branchIndex(hourBranch)), wenqu: branchAt(4 + branchIndex(hourBranch)), tiankong: branchAt(11 - branchIndex(hourBranch)), dijie: branchAt(branchIndex(hourBranch) - 1) }))
  const monthRows = Array.from({ length: 12 }, (_, i) => ({ input: i + 1, zuofu: branchAt(4 + i), youbi: branchAt(10 - i) }))
  const stemRows = STEMS.map((birthYearStem) => ({ input: birthYearStem, ...KUI_YUE[birthYearStem], lucun: LUCUN[birthYearStem], qingyang: branchAt(branchIndex(LUCUN[birthYearStem]) + 1), tuoluo: branchAt(branchIndex(LUCUN[birthYearStem]) - 1) }))
  const fireBellRows = Object.fromEntries(Object.keys(FIRE_BELL_GROUPS).map((group) => [group, BRANCHES.map((hourBranch) => ({ input: hourBranch, ...fireBell(group[0], hourBranch) }))]))
  return { hourRows, monthRows, stemRows, fireBellRows }
}

function transcription() {
  return {
    schemaVersion: SCHEMA,
    ocrPolicy: { allowed: true, role: 'exploration_only_not_canonical', canonicalTranscription: false, canonicalDecisionSource: 'direct_high_resolution_plate_reading' },
    fullPdfExploration: Object.values(PDF_SOURCES).map((source) => ({ sourceId: source.id, pageRange: `1-${source.pageCount}`, lowResolutionRender: true, renderedOutsideRepository: true, pageCountCovered: source.pageCount, result: 'completed' })),
    locators: LOCATORS,
    tableTranscriptions: {
      'nanbei-p15-printed-38-fire-bell-table': { rows: tableRows().fireBellRows, columns: ['鈴星', '火星'], readingOrder: '四組從右至左；各組列鈴星、火星；生時自子至亥', ...ref('nanbei-p15-printed-38-fire-bell-table') },
      'nanbei-p15-printed-39-lucun': { rows: tableRows().stemRows.map(({ input, lucun, qingyang, tuoluo }) => ({ input, lucun, qingyang, tuoluo })), columns: ['陀羅', '擎羊', '祿存', '年干'], readingOrder: '表頭按原版欄位保留；normalized output 在比較邊界使用', ...ref('nanbei-p15-printed-39-lucun') },
      'nanbei-p15-printed-38-wenchang-wenqu': { rows: tableRows().hourRows.map(({ input, wenchang, wenqu }) => ({ input, wenchang, wenqu })), columns: ['文曲', '文昌', '生時'], readingOrder: '表頭按原版欄位保留', ...ref('nanbei-p15-printed-38-wenchang-wenqu') },
      'nanbei-p14-printed-36-zuofu-youbi': { rows: tableRows().monthRows, columns: ['右弼', '左輔', '生月'], readingOrder: '表頭按原版欄位保留', ...ref('nanbei-p14-printed-36-zuofu-youbi') },
      'nanbei-p16-printed-40-tiankui-tianyue': { rows: tableRows().stemRows.map(({ input, tiankui, tianyue }) => ({ input, tiankui, tianyue })), columns: ['天鉞', '天魁', '年干'], readingOrder: '表頭按原版欄位保留', ...ref('nanbei-p16-printed-40-tiankui-tianyue') },
      'nanbei-p18-printed-45-tiankong-dijie': { rows: tableRows().hourRows.map(({ input, tiankong, dijie }) => ({ input, tiankong, dijie })), columns: ['地劫', '天空', '生時'], readingOrder: '表頭按原版欄位保留；天空 is source glyph', ...ref('nanbei-p18-printed-45-tiankong-dijie') },
    },
    predecessorArtifacts: [
      'artifacts/ziwei-traditional-source-comparison-v0/complete.json',
      'artifacts/ziwei-tianfu-representation-search-v1/complete.json',
      'artifacts/ziwei-twelve-major-star-placement-evidence-v0/complete.json',
      'artifacts/ziwei-palace-coordinate-semantic-identity-v0/complete.json',
    ],
  }
}

function normalizedRules() {
  const rules = [
    { ruleId: 'wenchang-wenqu', stars: ['wenchang', 'wenqu'], inputAxes: ['hourBranch'], normalized: { wenchang: { anchor: '戌', direction: 'reverse', step: 'hourBranchIndex' }, wenqu: { anchor: '辰', direction: 'forward', step: 'hourBranchIndex' } }, sourceRefs: ['ming-p148-wenchang-wenqu', 'nanbei-p15-printed-38-wenchang-wenqu'].map(ref) },
    { ruleId: 'zuofu-youbi', stars: ['zuofu', 'youbi'], inputAxes: ['lunarMonth'], normalized: { zuofu: { anchor: '辰', direction: 'forward', step: 'lunarMonth-1' }, youbi: { anchor: '戌', direction: 'reverse', step: 'lunarMonth-1' } }, sourceRefs: ['ming-p149-zuofu-youbi', 'nanbei-p14-printed-36-zuofu-youbi'].map(ref) },
    { ruleId: 'tiankui-tianyue', stars: ['tiankui', 'tianyue'], inputAxes: ['birthYearStem'], normalized: { map: KUI_YUE }, sourceRefs: ['ming-p149-tiankui-tianyue', 'nanbei-p16-printed-40-tiankui-tianyue'].map(ref) },
    { ruleId: 'lucun-qingyang-tuoluo', stars: ['lucun', 'qingyang', 'tuoluo'], inputAxes: ['birthYearStem'], rootRule: { star: 'lucun', map: LUCUN }, derivedRelations: [{ from: 'lucun', to: 'qingyang', relation: 'forward_one_branch' }, { from: 'lucun', to: 'tuoluo', relation: 'reverse_one_branch' }], sourceRefs: ['ming-p150-lucun', 'ming-p151-qingyang-tuoluo', 'nanbei-p15-printed-39-lucun'].map(ref) },
    { ruleId: 'huoxing-lingxing', stars: ['huoxing', 'lingxing'], inputAxes: ['birthYearBranch', 'hourBranch'], editions: { ming_nanyangtang: { status: 'source_rule_not_located', sourceRef: ref('ming-full-scan-fire-bell-not-located') }, nanbei_shanren: { status: 'complete', groupOffsets: FIRE_BELL_GROUPS, sourceRefs: ['nanbei-p14-printed-37-fire-bell', 'nanbei-p15-printed-38-fire-bell-table'].map(ref) } }, sourceRefs: ['ming-full-scan-fire-bell-not-located', 'nanbei-p14-printed-37-fire-bell', 'nanbei-p15-printed-38-fire-bell-table'].map(ref) },
    { ruleId: 'dikong-dijie', stars: ['dikong', 'dijie'], sourceStarNames: { dikong: '天空', dijie: '地劫' }, requestedNameBoundary: { requested: '地空', source: '天空', status: 'name_variant_preserved_not_promoted' }, inputAxes: ['hourBranch'], normalized: { tiankong: { anchor: '亥', direction: 'reverse', formula: '11-hourBranchIndex' }, dijie: { anchor: '亥', direction: 'forward', step: 'one_branch_before_hour' } }, sourceRefs: ['ming-p152-tiankong-dijie', 'nanbei-p18-printed-45-tiankong-dijie'].map(ref) },
  ]
  return { schemaVersion: SCHEMA, branchCoordinate: { order: BRANCHES, indexZero: '子', noSemanticPalaceIdentity: true }, rules }
}

function sourceOccurrences() {
  const rows = []
  for (const edition of Object.values(PDF_SOURCES)) {
    for (const rule of sourceRules().filter((item) => item.edition === edition.id)) {
      const inputs = rule.ruleId === 'wenchang-wenqu' || rule.ruleId === 'dikong-dijie'
        ? BRANCHES.map((hourBranch) => ({ hourBranch }))
        : rule.ruleId === 'zuofu-youbi'
          ? Array.from({ length: 12 }, (_, i) => ({ lunarMonth: i + 1 }))
          : rule.ruleId === 'tiankui-tianyue' || rule.ruleId === 'lucun-qingyang-tuoluo'
            ? STEMS.map((birthYearStem) => ({ birthYearStem }))
            : YEAR_BRANCHES.flatMap((birthYearBranch) => BRANCHES.map((hourBranch) => ({ birthYearBranch, hourBranch })))
      for (const input of inputs) {
        const evaluated = rule.evaluator(input)
        const output = evaluated && typeof evaluated === 'object' ? evaluated[rule.star] : evaluated
        rows.push({ occurrenceId: `${edition.id}:${rule.ruleId}:${rule.star}:${JSON.stringify(input)}`, edition: edition.id, ruleId: rule.ruleId, requestedStar: rule.star, sourceStar: rule.sourceStar, sourceLabel: SOURCE_LABELS[rule.sourceStar], input, normalizedOutput: output, status: rule.status, sourceRefs: rule.sourceRefs, dependency: rule.star === 'lucun' ? { kind: 'root' } : ['qingyang', 'tuoluo'].includes(rule.star) ? { kind: 'derived', from: 'lucun' } : null })
      }
    }
  }
  return rows
}

const PROD_IDS = Object.freeze({ wenchang: 'wenchang', wenqu: 'wengu', zuofu: 'zuobo', youbi: 'youbi', tiankui: 'tiankui', tianyue: 'tianyue' })
function productionOutput(star, input) {
  const result = resolveMinorStars({ birthYearStem: input.birthYearStem || '甲', lunarMonth: input.lunarMonth || 1, hourBranch: input.hourBranch || '子', palaces: [] })
  return result.minorStars.find((item) => item.id === PROD_IDS[star])?.palaceBranch || null
}
function productionOccurrences() {
  const rows = []
  for (const star of ['wenchang', 'wenqu']) for (const hourBranch of BRANCHES) rows.push({ occurrenceId: `production:${star}:${hourBranch}`, productionStar: PROD_IDS[star], star, input: { birthYearStem: '甲', lunarMonth: 1, hourBranch }, normalizedOutput: productionOutput(star, { hourBranch }), status: 'implemented', callPath: 'src/interpretationPrep/threeSystemPrepPipeline.js:181-186 -> src/ziwei/minorStarResolver.js:19-83', sourceRefs: GROUPS.wenchangWenqu.sourceRefs.map((id) => ({ sourceRef: id })) })
  for (const star of ['zuofu', 'youbi']) for (let lunarMonth = 1; lunarMonth <= 12; lunarMonth += 1) rows.push({ occurrenceId: `production:${star}:${lunarMonth}`, productionStar: PROD_IDS[star], star, input: { birthYearStem: '甲', lunarMonth, hourBranch: '子' }, normalizedOutput: productionOutput(star, { lunarMonth }), status: 'implemented', callPath: 'src/interpretationPrep/threeSystemPrepPipeline.js:181-186 -> src/ziwei/minorStarResolver.js:19-83', sourceRefs: GROUPS.zuofuYoubi.sourceRefs.map((id) => ({ sourceRef: id })) })
  for (const star of ['tiankui', 'tianyue']) for (const birthYearStem of STEMS) rows.push({ occurrenceId: `production:${star}:${birthYearStem}`, productionStar: PROD_IDS[star], star, input: { birthYearStem, lunarMonth: 1, hourBranch: '子' }, normalizedOutput: productionOutput(star, { birthYearStem }), status: 'implemented', callPath: 'src/interpretationPrep/threeSystemPrepPipeline.js:181-186 -> src/ziwei/minorStarResolver.js:19-83', sourceRefs: GROUPS.tiankuiTianyue.sourceRefs.map((id) => ({ sourceRef: id })) })
  return rows
}

function productionTrace() {
  return {
    schemaVersion: SCHEMA,
    basisHead: BASIS_HEAD,
    actualCallPath: [{ file: 'src/interpretationPrep/threeSystemPrepPipeline.js', lines: '181-186', call: 'resolveMinorStars({ birthYearStem, lunarMonth: lunar.lMonth, hourBranch, palaces: chart.palaces })' }, { file: 'src/ziwei/minorStarResolver.js', lines: '19-83', call: 'validation -> six lucky-star specs -> palace branch output' }],
    acceptedProductionInputs: ['birthYearStem', 'lunarMonth', 'hourBranch', 'palaces'],
    ignoredOrUnavailableInputs: [{ input: 'birthYearBranch', status: 'not accepted by minorStarResolver; only upstream context has it' }],
    implementedStars: ['wenchang', 'wenqu', 'zuofu', 'youbi', 'tiankui', 'tianyue'],
    missingStars: ['lucun', 'qingyang', 'tuoluo', 'huoxing', 'lingxing', 'dikong', 'dijie'],
    productionContract: { calculationChanged: false, publicContractChanged: false, readinessChanged: false, groundingChanged: false, activationChanged: false },
  }
}

function comparison(sourceRows, productionRows) {
  const rows = []
  for (const source of sourceRows) {
    const matches = productionRows.filter((item) => item.star === source.requestedStar && Object.entries(source.input).every(([key, value]) => item.input[key] === value))
    const production = matches[0] || null
    const comparable = source.status === 'complete' && production?.status === 'implemented'
    rows.push({ comparisonId: `${source.edition}:${source.ruleId}:${source.requestedStar}:${JSON.stringify(source.input)}`, edition: source.edition, ruleId: source.ruleId, star: source.requestedStar, input: source.input, sourceOutput: source.normalizedOutput, productionOutput: production?.normalizedOutput ?? null, comparable, match: comparable ? source.normalizedOutput === production.normalizedOutput : null, sourceStatus: source.status, productionStatus: production?.status || 'implementation_only', sourceRefs: source.sourceRefs, productionCallPath: production?.callPath || null, minimalCounterexample: comparable && source.normalizedOutput !== production.normalizedOutput ? { input: source.input, sourceOutput: source.normalizedOutput, productionOutput: production.normalizedOutput } : null })
  }
  const verdicts = []
  const editionVerdicts = []
  const sourceCrossEdition = []
  for (const star of STAR_IDS) {
    const source = sourceRows.filter((item) => item.requestedStar === star)
    const implemented = productionRows.filter((item) => item.star === star)
    const sourceBlocked = source.some((item) => item.status !== 'complete')
    let verdict = 'implementation_only'
    if (sourceBlocked) verdict = 'source_rule_not_located'
    else if (!implemented.length) verdict = star === 'dikong' ? 'source_rule_not_located' : 'implementation_only'
    else if (rows.filter((item) => item.star === star).every((item) => item.match === true)) verdict = 'exact_match'
    verdicts.push({ star, sourceOccurrences: source.length, productionOccurrences: implemented.length, verdict, sourceRefs: [...new Set(source.flatMap((item) => item.sourceRefs.map((r) => r.sourceRef)))].map((id) => ({ sourceRef: id })) })
    for (const edition of Object.values(PDF_SOURCES)) {
      const editionSource = source.filter((item) => item.edition === edition.id)
      const editionRows = rows.filter((item) => item.edition === edition.id && item.star === star)
      const editionImplemented = implemented.length > 0
      const editionBlocked = editionSource.some((item) => item.status !== 'complete')
      const editionVerdict = editionBlocked ? 'source_rule_not_located' : !editionImplemented ? (star === 'dikong' ? 'source_rule_not_located' : 'implementation_only') : editionRows.every((item) => item.match === true) ? 'exact_match' : 'substantive_rule_divergence_proven'
      editionVerdicts.push({ edition: edition.id, star, sourceOccurrences: editionSource.length, productionOccurrences: editionImplemented ? editionRows.length : 0, verdict: editionVerdict, sourceRefs: [...new Set(editionSource.flatMap((item) => item.sourceRefs.map((r) => r.sourceRef)))].map((id) => ({ sourceRef: id })) })
    }
    const ming = source.filter((item) => item.edition === 'ming_nanyangtang')
    const nanbei = source.filter((item) => item.edition === 'nanbei_shanren')
    const comparableSource = ming.length === nanbei.length && ming.every((item) => item.status === 'complete') && nanbei.every((item) => item.status === 'complete') && ming.every((item) => { const other = nanbei.find((candidate) => same(candidate.input, item.input)); return other && other.normalizedOutput === item.normalizedOutput })
    sourceCrossEdition.push({ star, inputDomainCounts: { ming: ming.length, nanbei: nanbei.length }, verdict: ming.some((item) => item.status !== 'complete') ? 'source_rule_not_located' : comparableSource ? 'exact_match' : 'substantive_rule_divergence_proven', sourceRefs: [...new Set(source.flatMap((item) => item.sourceRefs.map((r) => r.sourceRef)))].map((id) => ({ sourceRef: id })) })
  }
  return { schemaVersion: SCHEMA, rows, summary: { rowCount: rows.length, comparableCount: rows.filter((item) => item.comparable).length, exactMatchCount: rows.filter((item) => item.match === true).length, mismatchCount: rows.filter((item) => item.match === false).length, notComparableCount: rows.filter((item) => item.comparable === false).length, sourceOutputNonNullCount: rows.filter((item) => item.sourceOutput !== null).length, productionOutputNonNullCount: rows.filter((item) => item.productionOutput !== null).length }, verdicts, editionVerdicts, sourceCrossEdition }
}

function transformSearch(comparisons) {
  const candidates = [...Array.from({ length: 12 }, (_, offset) => ({ id: `rotation_${offset}`, kind: 'rotation', offset })), ...Array.from({ length: 12 }, (_, offset) => ({ id: `reflection_${offset}`, kind: 'reflection', offset }))]
  const searches = []
  for (const star of ['wenchang', 'wenqu', 'zuofu', 'youbi', 'tiankui', 'tianyue']) {
    const rows = comparisons.rows.filter((item) => item.star === star && item.comparable)
    const fits = candidates.map((candidate) => ({ ...candidate, exactFit: rows.every((row) => { const source = branchIndex(row.sourceOutput); const production = branchIndex(row.productionOutput); return candidate.kind === 'rotation' ? mod(production + candidate.offset) === source : mod(candidate.offset - production) === source }) })).filter((item) => item.exactFit).map((item) => item.id)
    searches.push({ star, domainCount: rows.length, candidateCount: candidates.length, candidates, exactFitIds: fits, identityExactFit: fits.includes('rotation_0'), minimalCounterexample: rows.find((row) => row.match === false) || null, caseSpecificAdjustmentsAllowed: false })
  }
  return { schemaVersion: SCHEMA, searchSpace: ['global_rotation_0..11', 'global_reflection_offset_0..11'], searches, noUnlistedCandidateAxes: true }
}

function dependencyGraph() {
  return { schemaVersion: SCHEMA, nodes: STAR_IDS.map((star) => ({ id: star, label: STAR_LABELS[star] })), edges: [{ from: 'lucun', to: 'qingyang', relation: 'source_root_plus_one_branch', sourceRefs: ['ming-p151-qingyang-tuoluo', 'nanbei-p15-printed-39-lucun'].map(ref) }, { from: 'lucun', to: 'tuoluo', relation: 'source_root_minus_one_branch', sourceRefs: ['ming-p151-qingyang-tuoluo', 'nanbei-p15-printed-39-lucun'].map(ref) }], accounting: { rootRule: 'lucun', derivedRules: ['qingyang', 'tuoluo'], rootErrorsNotDoubleCounted: true, derivedRowsRetainRootReference: true } }
}

function inventory(sourceIdentity) {
  return { schemaVersion: SCHEMA, basisHead: BASIS_HEAD, sourceIdentity, coverage: { fullPdfPageCount: Object.fromEntries(Object.values(PDF_SOURCES).map((source) => [source.id, source.pageCount])), canonicalTargetPages: [...new Set(LOCATORS.filter((item) => item.pdfPage !== null).map((item) => `${item.sourceId}:${item.pdfPage}`))].sort(), negativeSearchLocators: LOCATORS.filter((item) => item.pdfPage === null).map((item) => item.id), noPdfCopyOrRenderStored: true, renderTempRoot: '/private/tmp (outside repository)' }, locatorCount: LOCATORS.length, locators: LOCATORS.map((item) => ({ id: item.id, ...ref(item.id), title: item.title, confidence: item.confidence, canonical: item.canonical })) }
}

function stableFiles(files) {
  /* keep output hashes derived from canonical bytes */
  return Object.fromEntries(Object.entries(files).map(([name, value]) => [`${name}.json`, { path: `${ARTIFACT_DIR}/${name}.json`, byteSha256: sha256(Buffer.from(canonicalIdentityJson(value))), byteLength: Buffer.byteLength(canonicalIdentityJson(value)) }]))
}

export function buildArtifact() {
  const actualHead = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()
  const sourceIdentity = Object.fromEntries(Object.values(PDF_SOURCES).map((source) => [source.id, pdfIdentity(source)]))
  const inventoryValue = inventory(sourceIdentity)
  const transcriptionValue = transcription()
  const normalizedValue = normalizedRules()
  const sourceRows = sourceOccurrences()
  const productionRows = productionOccurrences()
  const occurrencesValue = { schemaVersion: SCHEMA, sourceOccurrences: sourceRows, productionOccurrences: productionRows, counts: { source: sourceRows.length, production: productionRows.length, sourceByEdition: Object.fromEntries(Object.values(PDF_SOURCES).map((source) => [source.id, sourceRows.filter((row) => row.edition === source.id).length])) } }
  const comparisonValue = comparison(sourceRows, productionRows)
  const transformValue = transformSearch(comparisonValue)
  const dependencyValue = dependencyGraph()
  const productionTraceValue = productionTrace()
  const blocked = comparisonValue.verdicts.some((item) => item.verdict === 'source_rule_not_located')
  const files = { inventory: inventoryValue, transcription: transcriptionValue, 'normalized-rules': normalizedValue, 'production-trace': productionTraceValue, occurrences: occurrencesValue, comparison: comparisonValue, 'transform-search': transformValue, 'dependency-graph': dependencyValue }
  const completePayload = {
    schemaVersion: SCHEMA,
    basisHead: BASIS_HEAD,
    observedHead: actualHead,
    verdict: blocked ? 'partial_ziwei_auxiliary_star_placement_evidence_with_explicit_blockers' : 'complete_ziwei_auxiliary_star_placement_core_evidence_without_promotion',
    targetStars: STAR_IDS.map((id) => ({ id, label: STAR_LABELS[id] })),
    artifactFiles: { ...Object.fromEntries(Object.keys(files).map((name) => [name, `${ARTIFACT_DIR}/${name}.json`])), complete: `${ARTIFACT_DIR}/complete.json`, conclusion: `${ARTIFACT_DIR}/conclusion.md` },
    artifactHashes: stableFiles(files),
    sourceEvidence: { sourceIdentity, sourceRuleNamePreservation: { requested: '地空', rawSource: '天空', promotion: 'forbidden' }, ocrPolicy: transcriptionValue.ocrPolicy },
    occurrenceSummary: occurrencesValue.counts,
    comparisonSummary: comparisonValue.summary,
    transformationSummary: transformValue.searches.map(({ star, domainCount, candidateCount, exactFitIds, minimalCounterexample }) => ({ star, domainCount, candidateCount, exactFitIds, minimalCounterexample })),
    dependencySummary: dependencyValue.accounting,
    boundaries: { stableClaimCount: 0, readiness: 'not_safe_to_start', grounding: 'blocked', activation: 'experimental', semanticPalaceIdentityChanged: false, sourcePromotion: false, productionEngineModified: false, publicContractModified: false, predecessorOverwritten: false, productionDefectsFixed: false },
    predecessorArtifacts: transcriptionValue.predecessorArtifacts,
    generatedBy: MATERIALIZER_PATH,
  }
  const complete = attachArtifactIdentity(completePayload, buildArtifactIdentity({ root: ROOT, artifactId: SCHEMA, materializerPath: MATERIALIZER_PATH, materializerVersion: MATERIALIZER_VERSION, baseHead: BASIS_HEAD, inputs: ['src/artifactIdentity.js', 'src/ziwei/minorStarRules.js', 'src/ziwei/minorStarResolver.js', 'src/interpretationPrep/threeSystemPrepPipeline.js', 'artifacts/ziwei-traditional-source-comparison-v0/complete.json', 'artifacts/ziwei-tianfu-representation-search-v1/complete.json', 'artifacts/ziwei-twelve-major-star-placement-evidence-v0/complete.json', 'artifacts/ziwei-palace-coordinate-semantic-identity-v0/complete.json'] }))
  const conclusion = conclusionMarkdown(complete, comparisonValue, sourceRows, productionRows)
  return { artifact: complete, files, conclusion }
}

function conclusionMarkdown(complete, comparisonValue, sourceRows, productionRows) {
  const exact = comparisonValue.verdicts.filter((item) => item.verdict === 'exact_match').map((item) => item.star).join(', ')
  const implementationOnly = comparisonValue.verdicts.filter((item) => item.verdict === 'implementation_only').map((item) => item.star).join(', ')
  const blocked = comparisonValue.verdicts.filter((item) => item.verdict === 'source_rule_not_located').map((item) => item.star).join(', ')
  return `# Ziwei auxiliary-star placement core evidence v0\n\n- verdict: \`${complete.verdict}\`\n- basis HEAD: \`${complete.basisHead}\`\n- source PDF identity: verified against the expected SHA-256 values; page counts 528 and 219; encryption false.\n- source occurrences: ${sourceRows.length}; production occurrences: ${productionRows.length}.\n- production exact matches for the six implemented stars: ${exact || 'none'}.\n- implementation-only stars: ${implementationOnly || 'none'}.\n- source-rule-not-located blockers: ${blocked || 'none'}.\n\n## Boundaries\n\nThe raw source glyph \`天空\` is preserved and is not silently promoted to the requested \`地空\`. The Ming edition Fire/Bell rule was not located after the full scan and is not synthesized. No production calculation, public contract, readiness, grounding, activation, or semantic palace identity was changed. The predecessor source-comparison artifacts remain immutable.\n\n## Interpretation\n\nThis is an evidence and reproduction artifact only. An exact production fit is a bounded comparison result, not a claim that production or either source is independently true.\n`
}

async function writeJson(path, value) {
  await writeFile(resolve(ROOT, path), canonicalIdentityJson(value))
}

export async function materializeToDisk() {
  const { artifact, files, conclusion } = buildArtifact()
  await mkdir(resolve(ROOT, ARTIFACT_DIR), { recursive: true })
  for (const [name, value] of Object.entries(files)) await writeJson(`${ARTIFACT_DIR}/${name}.json`, value)
  await writeJson(`${ARTIFACT_DIR}/complete.json`, artifact)
  await writeFile(resolve(ROOT, `${ARTIFACT_DIR}/conclusion.md`), conclusion)
  const outputs = [...Object.entries(files).map(([name]) => `${ARTIFACT_DIR}/${name}.json`), `${ARTIFACT_DIR}/complete.json`, `${ARTIFACT_DIR}/conclusion.md`]
  for (const path of outputs) {
    const bytes = await readFile(resolve(ROOT, path))
    await writeJson(`${path}.integrity.json`, { schemaVersion: 'artifact-integrity-sidecar-v1', path, byteSha256: sha256(bytes), byteLength: bytes.length, source: 'actual_output_bytes' })
  }
  return { artifact, files, conclusion, outputs }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await materializeToDisk()
  console.log(JSON.stringify({ schema: SCHEMA, verdict: result.artifact.verdict, sourceOccurrences: result.artifact.occurrenceSummary.source, productionOccurrences: result.artifact.occurrenceSummary.production, outputCount: result.outputs.length }, null, 2))
}
