import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'
import { evaluateSourceMingShen, enumerateSourceInputs as enumerateMingShen } from '../src/ziwei/mingShenCleanRuleSeedPilot.js'
import { evaluateSourceFiveElementBureau, enumerateSourceInputs as enumerateFiveElement } from '../src/ziwei/fiveElementBureauCleanRuleSeedPilot.js'
import { evaluateSourceZiweiStarPlacement, enumerateSourceInputs as enumerateZiwei } from '../src/ziwei/ziweiStarPlacementCleanRuleSeedPilot.js'
import { evaluateSourceTianfuPlacement, enumerateSourceInputs as enumerateTianfu } from '../src/ziwei/tianfuStarPlacementCleanRuleSeedPilot.js'
import { resolveZiweiChart } from '../src/ziwei/ziweiResolver.js'
import { resolveFiveElementBureau } from '../src/ziwei/fiveElementResolver.js'
import { calculateZiweiBranch, calculateTianfuBranch } from '../src/ziwei/starPlacementRules.js'
import { getPdfSourceMetadata, resolvePdfSourcePathSync } from './lib/pdf-source-resolver.mjs'

export const SCHEMA = 'ziwei-traditional-source-comparison-v0'
export const MATERIALIZER_VERSION = '0.1.0'
export const MING_PDF = getPdfSourceMetadata('nanyangtang_quanbao_528p').historicalMetadataPath
export const MING_PDF_ACCESS = resolvePdfSourcePathSync('nanyangtang_quanbao_528p')
export const NANBEI_PDF = getPdfSourceMetadata('nanbei_quanbao_219p').historicalMetadataPath
export const NANBEI_PDF_ACCESS = resolvePdfSourcePathSync('nanbei_quanbao_219p')
const PDFINFO = process.env.PDFINFO_BIN || 'pdfinfo'
const FIXTURE_PATH = 'test/fixtures/ziwei/traditional-source-comparison-v0.json'
const MING_SHA = '04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc'
const NANBEI_SHA = '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value
export const canonicalJson = value => `${JSON.stringify(stable(value), null, 2)}\n`
const gitHead = root => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()

function inspectPdf(path, expected) {
  const bytes = readFileSync(path)
  const info = execFileSync(PDFINFO, [path], { encoding: 'utf8' })
  const pages = Number(info.match(/^Pages:\s+(\d+)/m)?.[1])
  const encrypted = (info.match(/^Encrypted:\s+(.+)/m)?.[1] || '').trim().toLowerCase() !== 'no'
  const actual = { actualFileName: path.split('/').pop(), sizeBytes: bytes.length, pdfPageCount: pages, encrypted, sha256: sha256(bytes) }
  if (actual.sha256 !== expected.sha256 || actual.pdfPageCount !== expected.pdfPageCount || actual.encrypted !== false) throw new Error(`source_identity_mismatch:${path}:${JSON.stringify(actual)}`)
  return actual
}

const mingBoundaries = [
  { volume: '卷一', pdfPages: [9, 76], startLocator: 'PDF outline 卷一 -> p9; right-side 卷之一 heading', endLocator: 'p76 immediately before PDF outline 卷二 -> p77' },
  { volume: '卷二', pdfPages: [77, 144], startLocator: 'PDF outline 卷二 -> p77; right-side 卷之二 heading', endLocator: 'p144 immediately before PDF outline 卷三 -> p145' },
  { volume: '卷三', pdfPages: [145, 258], contentPages: [145, 254], blankOrBoundaryPages: [255, 256, 257, 258], startLocator: 'PDF outline 卷三 -> p145; right-side 新鍥希夷陳先生紫微斗數全書卷之三 and ○安身命例', endLocator: 'p258 blank immediately before PDF outline 卷四 -> p259' },
  { volume: '卷四', pdfPages: [259, 312], startLocator: 'PDF outline 卷四 -> p259; right-side 卷之四 heading', endLocator: 'p312 五卷終 witness immediately before p313' },
  { volume: '卷五', pdfPages: [313, 382], startLocator: 'PDF outline 卷五 -> p313; right-side 卷之五 heading', endLocator: 'p382 五卷終 witness immediately before p383' },
  { volume: '卷六', pdfPages: [383, 496], startLocator: 'PDF outline 卷六 -> p383', endLocator: 'p496 immediately before PDF outline 卷七 -> p497' },
  { volume: '卷七', pdfPages: [497, 528], startLocator: 'PDF outline 卷七 -> p497', endLocator: 'PDF p528 final page' },
]

const sourceRef = ({ source, pdfPage = null, printedFolio = null, volume = null, section = null, locator = null, glyphPreservingText = null, confidence = 'unreadable', uncertainty = [], readingOrder = 'not_asserted' }) => ({ source, pdfPage, printedFolio, volume, section, locator, glyphPreservingText, readingOrder, confidence, uncertainty })
const unreadable = (source, section, reason) => sourceRef({ source, section, confidence: 'unreadable', uncertainty: [reason], locator: null })

const rules = [
  { ruleId: 'ming-shen-palace', label: '安身命·起五寅', ming: sourceRef({ source: 'ming', pdfPage: 145, volume: '卷三', section: '○安身命例', locator: 'PDF p145, right-side volume heading and rule columns', glyphPreservingText: '大抵入命俱從寅上起正月順數至本生月止；[其餘列文保留待二次校讀]', confidence: 'visually_bounded_single_review', uncertainty: ['後続文字在当前裁切中未完整保留，未作补写。'], readingOrder: 'vertical columns right-to-left' }), nanbei: sourceRef({ source: 'nanbei', pdfPage: 8, printedFolio: '二十五', section: '九、定命、身二宮', locator: 'PDF p8, left scanned leaf, rule columns', glyphPreservingText: '寅正巳順數生月逢。生月起子兩頭通。逆至生時為命宮。順到生時即安身。', confidence: 'human_readable_single_review', uncertainty: ['第二复核未完成。'], readingOrder: 'vertical columns right-to-left' }), implementation: { present: true, files: ['src/ziwei/ziweiResolver.js', 'src/ziwei/mingShenCleanRuleSeedPilot.js'], status: 'exact_144_of_144' }, comparisonStatus: 'equivalent_representation', comparisonNote: '两版起点/方向语句以不同表述表达同一已独立复核的 144-row placement boundary。' },
  { ruleId: 'twelve-palaces', label: '安十二宮', ming: sourceRef({ source: 'ming', pdfPage: 153, volume: '卷三', section: '○安十二宮', locator: 'PDF p153, section heading and vertical prose', glyphPreservingText: '○安十二宮；[正文未在本轮完整转写]', confidence: 'heading_readable_body_unreadable', uncertainty: ['正文与宫位图方向未完成逐字复核。'], readingOrder: 'vertical columns right-to-left' }), nanbei: unreadable('nanbei', '十二宮·宫位顺序', '本轮南北山人定位窗口未取得可确认的同题原文页，不能将未定位当作缺失。'), implementation: { present: true, files: ['src/ziwei/ziweiResolver.js', 'src/ziwei/ziweiContract.js'], status: 'palace_loop_present' }, comparisonStatus: 'unreadable', comparisonNote: '实现有循环，但明代页的宫位方向与南北山人对应页尚未达到原文级闭合。' },
  { ruleId: 'five-element-bureau', label: '五行局', ming: sourceRef({ source: 'ming', pdfPage: 168, volume: '卷三', section: '五行局表', locator: 'PDF p168–171, drawn bureau tables; p168 木三局, p169 水二局, p170 火六局, p171 土五局', glyphPreservingText: '水二局；木三局；金四局；土五局；火六局', confidence: 'table_boundary_readable', uncertainty: ['局部 folio label 不在当前裁切中，表格单元格仍需独立逐格复核。'], readingOrder: 'drawn table axes retained; no transpose inferred' }), nanbei: sourceRef({ source: 'nanbei', pdfPage: 9, printedFolio: '二十七', section: '十、定五行局', locator: 'PDF p9 left leaf; prose and 六十花甲納音 columns', glyphPreservingText: '水二局、木三局、金四局、土五局、火六局；[纳音列按原 artifact 保留]', confidence: 'human_readable_single_review', uncertainty: ['表格二次复核未完成。'], readingOrder: 'vertical prose right-to-left; table not transposed' }), implementation: { present: true, files: ['src/ziwei/fiveElementResolver.js', 'src/ziwei/fiveElementBureauCleanRuleSeedPilot.js'], status: 'exact_1440_of_1440' }, comparisonStatus: 'exact_match', comparisonNote: '五行局独立 evaluator 与当前 resolver 在 1440 个代表域输入上相同；不改变生产契约。' },
  { ruleId: 'ziwei-placement', label: '紫微', ming: sourceRef({ source: 'ming', pdfPage: 168, volume: '卷三', section: '五行局/起紫微表', locator: 'PDF p168–171, bureau/day table region; exact 30-day glyph cells not promoted', glyphPreservingText: '[起紫微表：表格边界可见，逐格转写未完成]', confidence: 'table_present_not_fully_transcribed', uncertainty: ['不能以标准算法补写明代版单元格。'], readingOrder: 'drawn table; orientation preserved, semantic axis not promoted' }), nanbei: sourceRef({ source: 'nanbei', pdfPage: 11, printedFolio: '三十一', section: '起紫微五訣', locator: 'PDF p11 left leaf; vertical rule prose and start-point table', glyphPreservingText: '水二局中初一丑；木三局中初一辰；金四局中初一辰；土五局中初一午；火六局中初一酉', confidence: 'human_readable_single_review', uncertainty: ['金四局起点在既有 pilot 与当前 scan read 有一处需二次复核，保留原字段不改写。'], readingOrder: 'vertical prose right-to-left; table rows descend' }), implementation: { present: true, files: ['src/ziwei/starPlacementRules.js', 'src/ziwei/ziweiStarPlacementCleanRuleSeedPilot.js'], status: 'exact_150_of_150_against_nanbei_seed' }, comparisonStatus: 'exact_match', comparisonNote: '现有 Nanbei source-seed 与实现的 150-row 结果一致；明代表格只记为未完整转写。' },
  { ruleId: 'tianfu-placement', label: '天府', ming: sourceRef({ source: 'ming', pdfPage: 147, volume: '卷三', section: '○安南北斗諸星訣', locator: 'PDF p147–148, 南北斗 heading and adjacent columns', glyphPreservingText: '○安南北斗諸星訣；[天府单独表未在本轮完整转写]', confidence: 'heading_readable_body_unreadable', uncertainty: ['不能用南北山人表反推明代表。'], readingOrder: 'vertical columns right-to-left' }), nanbei: sourceRef({ source: 'nanbei', pdfPage: 13, printedFolio: '三十四', section: '十六、安天府', locator: 'PDF p13 right leaf; 12-row drawn table', glyphPreservingText: '安天府；天府/紫微双列 12 行表，原单元格逐行保留在既有 source pilot', confidence: 'table_boundary_readable', uncertainty: ['版本谱系与语义宫位同一性未提升。'], readingOrder: 'drawn two-column table top-to-bottom; no transpose' }), implementation: { present: true, files: ['src/ziwei/starPlacementRules.js'], status: 'direct_150_row_relation_differs' }, comparisonStatus: 'substantive_divergence', comparisonNote: 'Nanbei source table 与当前天府公式直接身份不一致；既有分析仅记录 rotation-06 数值关系，未提升为语义等价。' },
  { ruleId: 'south-north-fourteen-major-stars', label: '南北斗14主星', ming: sourceRef({ source: 'ming', pdfPage: 147, volume: '卷三', section: '○安南北斗諸星訣', locator: 'PDF p147–148, heading and multi-column star text', glyphPreservingText: '○安南北斗諸星訣；[14星逐星位置未完整转写]', confidence: 'heading_readable_body_unreadable', uncertainty: ['星名、次序与图式的逐项映射未完成。'], readingOrder: 'vertical columns right-to-left' }), nanbei: sourceRef({ source: 'nanbei', pdfPage: 13, printedFolio: '三十四', section: '安南北斗·安天府', locator: 'PDF p13 left/right leaves; star table context', glyphPreservingText: '[星表可见，未把星名位置扩写为现代规范]', confidence: 'table_present_not_fully_transcribed', uncertainty: ['不能把图表布局推导成唯一语义坐标。'], readingOrder: 'drawn table; orientation retained' }), implementation: { present: true, files: ['src/ziwei/starResolver.js', 'src/ziwei/starPlacementRules.js'], status: 'implemented_unverified' }, comparisonStatus: 'unreadable', comparisonNote: '两版都已定位到相关星表上下文，但尚无逐星、逐格、独立复核的闭合证据。' },
  { ruleId: 'wenchang-wenqu', label: '文昌文曲', ming: sourceRef({ source: 'ming', pdfPage: 148, volume: '卷三', section: '○安文昌文曲星訣', locator: 'PDF p148, section heading and vertical rule columns', glyphPreservingText: '○安文昌文曲星訣；[正文未完整转写]', confidence: 'heading_readable_body_unreadable', uncertainty: ['方向和起点未从完整原文逐字闭合。'], readingOrder: 'vertical columns right-to-left' }), nanbei: unreadable('nanbei', '文昌文曲', '南北山人本轮 p8–p13 source window 未确认同题规则页。'), implementation: { present: true, files: ['src/ziwei/minorStarRules.js'], status: 'implementation_only_for_this_comparison' }, comparisonStatus: 'unreadable', comparisonNote: '已有实现不能替代两版原文证据。' },
  { ruleId: 'zuofu-youbi', label: '左輔右弼', ming: sourceRef({ source: 'ming', pdfPage: 149, volume: '卷三', section: '左輔右弼诀', locator: 'PDF p149 right/middle columns', glyphPreservingText: '左輔正月起於辰順至生月；右弼正月宮尋戌逆至生月；[余文保留]', confidence: 'visually_bounded_single_review', uncertainty: ['个别字形和后续条件未二次复核。'], readingOrder: 'vertical columns right-to-left' }), nanbei: unreadable('nanbei', '左輔右弼', '南北山人本轮 p8–p13 source window 未确认同题规则页。'), implementation: { present: true, files: ['src/ziwei/minorStarRules.js'], status: 'implementation_only_for_this_comparison' }, comparisonStatus: 'unreadable', comparisonNote: '明代局部规则可读，南北山人对应页与当前实现的三方闭合尚未完成。' },
  { ruleId: 'tiankui-tianyue', label: '天魁天鉞', ming: sourceRef({ source: 'ming', pdfPage: 149, volume: '卷三', section: '○安天魁天鉞訣', locator: 'PDF p149 left/middle columns', glyphPreservingText: '○安天魁天鉞訣；[甲戊庚牛羊、乙己鼠猴等列文未在本轮全量转写]', confidence: 'heading_readable_body_unreadable', uncertainty: ['干年映射未以完整原文表确证。'], readingOrder: 'vertical columns right-to-left' }), nanbei: unreadable('nanbei', '天魁天鉞', '南北山人本轮 p8–p13 source window 未确认同题规则页。'), implementation: { present: true, files: ['src/ziwei/minorStarRules.js'], status: 'implementation_only_for_this_comparison' }, comparisonStatus: 'unreadable', comparisonNote: '当前 map 不能作为 source transcription。' },
  { ruleId: 'lucun-qingyang-tuoluo-huoling', label: '禄存·擎羊陀羅·火鈴', ming: sourceRef({ source: 'ming', pdfPage: 150, volume: '卷三', section: '○安祿存星訣 / ○安火鈴二星訣', locator: 'PDF p150–151, section headings and rule columns', glyphPreservingText: '○安祿存星訣；○安火鈴二星訣；[擎羊陀羅相关列未完整转写]', confidence: 'heading_readable_body_unreadable', uncertainty: ['受损处与连续栏位需高分辨率二次复核。'], readingOrder: 'vertical columns right-to-left' }), nanbei: unreadable('nanbei', '禄存·擎羊陀羅·火鈴', '南北山人本轮 p8–p13 source window 未确认同题规则页。'), implementation: { present: false, files: ['src/ziwei/minorStarRules.js'], status: 'not_present_in_current_minor_rule_module' }, comparisonStatus: 'unreadable', comparisonNote: '明代标题可见但未完整转写；当前实现未覆盖该整组，不能把缺实现当作版本差异。' },
  { ruleId: 'four-transformations', label: '禄权科忌', ming: sourceRef({ source: 'ming', pdfPage: 151, volume: '卷三', section: '○安祿權科忌四星變化訣', locator: 'PDF p151, section heading and transformation columns', glyphPreservingText: '○安祿權科忌四星變化訣；[四干逐项列文未完整转写]', confidence: 'heading_readable_body_unreadable', uncertainty: ['不能以现行 map 补作明代逐字转写。'], readingOrder: 'vertical columns right-to-left' }), nanbei: unreadable('nanbei', '禄权科忌', '南北山人本轮 p8–p13 source window 未确认同题规则页。'), implementation: { present: true, files: ['src/ziwei/transformationRules.js', 'src/ziwei/transformationResolver.js'], status: 'implementation_only_for_this_comparison' }, comparisonStatus: 'unreadable', comparisonNote: '已有实现存在，但来源版逐干证据尚未闭合。' },
  { ruleId: 'tiankong-dijie', label: '天空地劫', ming: sourceRef({ source: 'ming', pdfPage: 152, volume: '卷三', section: '○安天空地劫訣', locator: 'PDF p152, section heading and vertical rule columns', glyphPreservingText: '○安天空地劫訣；[正文未完整转写]', confidence: 'heading_readable_body_unreadable', uncertainty: ['起点与方向未完成逐字复核。'], readingOrder: 'vertical columns right-to-left' }), nanbei: unreadable('nanbei', '天空地劫', '南北山人本轮 p8–p13 source window 未确认同题规则页。'), implementation: { present: false, files: ['src/ziwei/minorStarRules.js'], status: 'not_present_in_current_minor_rule_module' }, comparisonStatus: 'unreadable', comparisonNote: '不得从实现缺口推断版间缺失。' },
  { ruleId: 'mingzhu-shenzhu', label: '命主·身主', ming: unreadable('ming', '命主·身主', '权3本轮逐页定位未取得可安全转写的完整题名与规则正文。'), nanbei: unreadable('nanbei', '命主·身主', '南北山人本轮 p8–p13 source window 未确认同题规则页。'), implementation: { present: false, files: ['src/ziwei'], status: 'not_located_in_current_implementation' }, comparisonStatus: 'unreadable', comparisonNote: '后续需按权3目录和全本逐页寻检，现不推断。' },
  { ruleId: 'major-minor-limits', label: '大限·小限', ming: sourceRef({ source: 'ming', pdfPage: 173, volume: '卷三', section: '限图/限法相关页面', locator: 'PDF p173–176, chart and adjacent columns; exact heading not safely isolated', glyphPreservingText: '[限图可见；题名与起算规则未完整转写]', confidence: 'unreadable', uncertainty: ['图式方向、起算点、男女阴阳条件未从整页闭合。'], readingOrder: 'not asserted' }), nanbei: unreadable('nanbei', '大限·小限', '南北山人本轮 p8–p13 source window 未确认同题规则页。'), implementation: { present: false, files: ['src/ziwei'], status: 'not_located_in_current_implementation' }, comparisonStatus: 'implementation_only', comparisonNote: '当前实现未形成可核验限法；图式存在但尚未安全转写。' },
  { ruleId: 'brightness', label: '庙旺落陷', ming: sourceRef({ source: 'ming', pdfPage: 175, volume: '卷三', section: '星曜强弱表', locator: 'PDF p175–176, table rows 庙旺得地利益平和不得地落陷', glyphPreservingText: '廟；旺；得地；利益；平和；不得地；落陷', confidence: 'table_labels_readable', uncertainty: ['逐星表格单元格尚未完整转写。'], readingOrder: 'drawn table; cell direction not promoted' }), nanbei: unreadable('nanbei', '庙旺落陷', '南北山人本轮 p8–p13 source window 未确认同题规则页。'), implementation: { present: false, files: ['src/ziwei'], status: 'not_located_in_current_implementation' }, comparisonStatus: 'unreadable', comparisonNote: '表头证据保留，逐星强弱不能以现行实现或通行表补齐。' },
]

function compareMingShen(rows) {
  return rows.map(source => {
    const engine = resolveZiweiChart({ birthYearStem: '甲', lunarMonth: source.lunarMonth, hourBranch: source.hourBranch }).chart
    return { input: source, sourceOutput: evaluateSourceMingShen(source), productionOutput: { mingGong: engine.mingGong.branch, shenGong: engine.shenGong.branch }, match: evaluateSourceMingShen(source).mingGong.branch === engine.mingGong.branch && evaluateSourceMingShen(source).shenGong.branch === engine.shenGong.branch }
  })
}

function compareFiveElement(rows) {
  return rows.map(source => {
    const sourceResult = evaluateSourceFiveElementBureau(source)
    const chart = resolveZiweiChart(source).chart
    const production = resolveFiveElementBureau(source.birthYearStem, chart.mingGong.branch)
    return { input: source, sourceOutput: sourceResult.output, productionOutput: production, match: sourceResult.output.enum === production?.id }
  })
}

function compareZiwei(rows) {
  return rows.map(source => { const s = evaluateSourceZiweiStarPlacement(source).output; const p = calculateZiweiBranch(source.bureauNumber || ({ 水二局: 2, 木三局: 3, 金四局: 4, 土五局: 5, 火六局: 6 })[source.bureau], source.lunarDay); return { input: source, sourceOutput: s, productionOutput: { branch: p }, match: s.branch === p } })
}

function compareTianfu(rows) {
  return rows.map(source => { const s = evaluateSourceTianfuPlacement(source).output; const p = calculateTianfuBranch(source.ziweiBranch); return { input: source, sourceOutput: s, productionOutput: { branch: p }, match: s.branch === p } })
}

export async function buildArtifact() {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const fixture = JSON.parse(await readFile(resolve(root, FIXTURE_PATH), 'utf8'))
  const ming = inspectPdf(MING_PDF_ACCESS, { sha256: MING_SHA, pdfPageCount: 528 })
  const nanbei = inspectPdf(NANBEI_PDF_ACCESS, { sha256: NANBEI_SHA, pdfPageCount: 219 })
  const mingShenDomain = enumerateMingShen().map(source => { const engine = resolveZiweiChart({ birthYearStem: '甲', lunarMonth: source.lunarMonth, hourBranch: source.hourBranch }).chart; return source.mingGong.branch === engine.mingGong.branch && source.shenGong.branch === engine.shenGong.branch })
  const fiveDomain = enumerateFiveElement().map(source => { const sourceResult = source.output; const chart = resolveZiweiChart(source.input).chart; const production = resolveFiveElementBureau(source.input.birthYearStem, chart.mingGong.branch); return sourceResult.enum === production?.id })
  const ziweiDomain = enumerateZiwei().map(source => source.output.branch === calculateZiweiBranch(source.input.bureauNumber, source.input.lunarDay))
  const tianfuDomain = enumerateZiwei().map(source => evaluateSourceTianfuPlacement({ ziweiBranch: source.output.branch }).output.branch === calculateTianfuBranch(source.output.branch))
  const comparison = { representativeFixture: { path: FIXTURE_PATH, fixture }, domains: { mingShen: { inputCount: 144, matchCount: mingShenDomain.filter(Boolean).length, mismatchCount: mingShenDomain.filter(x => !x).length, rows: compareMingShen(fixture.mingShen) }, fiveElementBureau: { inputCount: 1440, matchCount: fiveDomain.filter(Boolean).length, mismatchCount: fiveDomain.filter(x => !x).length, rows: compareFiveElement(fixture.fiveElementBureau) }, ziwei: { inputCount: 150, matchCount: ziweiDomain.filter(Boolean).length, mismatchCount: ziweiDomain.filter(x => !x).length, rows: compareZiwei(fixture.ziwei) }, tianfu: { inputCount: 150, matchCount: tianfuDomain.filter(Boolean).length, mismatchCount: tianfuDomain.filter(x => !x).length, rows: compareTianfu(fixture.tianfu) } }, statusCounts: Object.fromEntries(['exact_match', 'equivalent_representation', 'substantive_divergence', 'missing_in_edition', 'unreadable', 'implementation_only'].map(status => [status, rules.filter(rule => rule.comparisonStatus === status).length])), rules: rules.map(rule => ({ ruleId: rule.ruleId, label: rule.label, comparisonStatus: rule.comparisonStatus, comparisonNote: rule.comparisonNote, sourceRefs: { ming: rule.ming, nanbei: rule.nanbei }, implementation: rule.implementation })) }
  const inventory = {
    schemaVersion: `${SCHEMA}-inventory-v0`,
    generatedFromActualBytes: true,
    sources: [
      {
        sourceId: 'ming',
        title: '《新锓希夷陈先生紫微斗数全书》',
        file: { path: MING_PDF, ...ming, kind: 'original_pdf', storedInGit: false, readOnly: true },
        editionIdentity: {
          declaredLineage: '明代南阳堂刊本系谱之影印本（用户提供名称）',
          historicalIdentityStatus: 'file identity verified; historical lineage not independently promoted',
          pdfOutlineVolumeStarts: [1, 2, 3, 4, 5, 6, 7].map((volume, index) => ({ volume: `卷${['一', '二', '三', '四', '五', '六', '七'][index]}`, pdfPage: [9, 77, 145, 259, 313, 383, 497][index] })),
          juanBoundaries: mingBoundaries,
        },
      },
      {
        sourceId: 'nanbei',
        title: '《命-南北山人_紫微斗数全书》',
        file: { path: NANBEI_PDF, ...nanbei, kind: 'original_pdf', storedInGit: false, readOnly: true },
        editionIdentity: {
          declaredLineage: '南北山人编辑本（用户提供名称）',
          historicalIdentityStatus: 'digital file identity verified; source lineage and historical edition relationship not promoted',
          structure: '219-page annotated comparison edition; not mapped to Ming juan boundaries',
          reviewedWindow: { pdfPages: [8, 13], printedFolios: ['二十五', '二十六', '二十七', '二十八', '二十九', '三十', '三十一', '三十二', '三十三', '三十四'] },
        },
      },
    ],
  }
  const transcription = { schemaVersion: `${SCHEMA}-transcription-v0`, ocrStatus: 'exploration_only_not_canonical', sourceImagesAreCanonical: true, rules: rules.map(rule => ({ ruleId: rule.ruleId, label: rule.label, sourceRefs: { ming: rule.ming, nanbei: rule.nanbei }, preservation: ['original glyphs retained where visually bounded', 'unreadable/uncertain fields remain null or bracketed', 'PDF page and printed folio are separate fields', 'no source PDF bytes are copied into the repository'] })) }
  const artifact = { schemaVersion: SCHEMA, verdictToken: 'blocked_partial_source_integration_no_production_promotion', basisHead: gitHead(root), sourceInventory: inventory, transcription, comparison, boundaries: { stableClaimCount: 0, readiness: 'not_safe_to_start', grounding: 'blocked', activation: 'experimental', productionEngineModified: false, ruleContractModified: false, existingEvidenceArtifactsModified: false, pdfStoredInGit: false, interpretationAdded: false, sourceConflictHidden: false }, implementationImpact: { changed: false, sourceRefsAttachedToExistingProductionOutputs: false, reason: 'This packet creates additive provenance and comparison evidence only; existing production files and readiness contracts are unchanged.' }, artifactFiles: { inventory: `artifacts/${SCHEMA}/inventory.json`, transcription: `artifacts/${SCHEMA}/transcription.json`, comparison: `artifacts/${SCHEMA}/comparison.json`, fixtures: FIXTURE_PATH }, artifactHashes: {}, materializer: `scripts/materialize-${SCHEMA}.mjs`, checker: `scripts/check-${SCHEMA}.mjs`, observedHead: gitHead(root), deterministicContract: { generatedAt: 'forbidden', sourceBytes: 'hashed directly from the two Downloads files at materialization', ordering: 'fixed rule order and fixed domain order', json: 'stable lexicographic object keys with final LF', originalPdfStorage: 'forbidden' } }
  const invArtifact = inventory
  const transArtifact = transcription
  const compArtifact = comparison
  artifact.artifactHashes = { inventorySha256: sha256(Buffer.from(canonicalJson(invArtifact))), transcriptionSha256: sha256(Buffer.from(canonicalJson(transArtifact))), comparisonSha256: sha256(Buffer.from(canonicalJson(compArtifact))), fixtureSha256: sha256(Buffer.from(canonicalJson(fixture))) }
  return attachArtifactIdentity(artifact, buildArtifactIdentity({ root, artifactId: SCHEMA, materializerPath: artifact.materializer, materializerVersion: MATERIALIZER_VERSION, baseHead: artifact.basisHead, inputs: [FIXTURE_PATH, 'src/ziwei/mingShenCleanRuleSeedPilot.js', 'src/ziwei/fiveElementBureauCleanRuleSeedPilot.js', 'src/ziwei/ziweiStarPlacementCleanRuleSeedPilot.js', 'src/ziwei/tianfuStarPlacementCleanRuleSeedPilot.js', 'src/ziwei/ziweiResolver.js', 'src/ziwei/fiveElementResolver.js', 'src/ziwei/starPlacementRules.js'] }))
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const target = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`)
  const artifact = await buildArtifact(); const body = canonicalJson(artifact)
  await mkdir(dirname(target), { recursive: true }); await writeFile(target, body)
  await writeFile(resolve(dirname(target), 'inventory.json'), canonicalJson(artifact.sourceInventory)); await writeFile(resolve(dirname(target), 'transcription.json'), canonicalJson(artifact.transcription)); await writeFile(resolve(dirname(target), 'comparison.json'), canonicalJson(artifact.comparison)); await writeFile(`${target}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(Buffer.from(body)), artifactByteSha256Scope: 'complete.json UTF-8 bytes including final LF' }, null, 2)}\n`)
  console.log(JSON.stringify({ target, verdict: artifact.verdictToken, statusCounts: artifact.comparison.statusCounts, domains: Object.fromEntries(Object.entries(artifact.comparison.domains).map(([key, value]) => [key, { inputCount: value.inputCount, matchCount: value.matchCount, mismatchCount: value.mismatchCount }])) }, null, 2))
}
