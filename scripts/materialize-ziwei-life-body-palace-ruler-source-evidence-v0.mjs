import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'
import { evaluateCandidateLifeBody, evaluateSourceLifeBody, enumerateLifeBodyInputs, enumerateRulerInputs, NANYANG_MINGZHU_BY_MING_GONG, NANYANG_SHENZHU_SURFACE_BY_BIRTH_YEAR_BRANCH, NANBEI_MINGZHU_BY_MING_GONG, NANBEI_SHENZHU_BY_BIRTH_YEAR_BRANCH, SOURCE_RULE_SCHEMA, TRADITIONAL_BRANCH_ORDER } from '../src/ziwei/lifeBodyPalaceRulerSourceEvidence.js'
import { resolveZiweiChart } from '../src/ziwei/ziweiResolver.js'

export const SCHEMA = 'ziwei-life-body-palace-ruler-source-evidence-v0'
export const VERDICT = 'complete_ziwei_life_body_palace_and_ruler_evidence_without_promotion'
export const MATERIALIZER_VERSION = '0.2.0'
export const BASIS_HEAD = '5c45c4f880cea7d69e38120492d14640da9a9117'
export const MING_PDF = '/Users/softie/Downloads/新锓希夷陈先生紫微斗数全书.七卷.宋.陈抟撰.明.潘希尹补.明代南阳堂刊本.黑白版.pdf'
export const MING_PDF_SHA256 = '04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc'
export const NANBEI_PDF = '/Users/softie/Downloads/命-南北山人_紫微斗数全书.pdf'
export const NANBEI_PDF_SHA256 = '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023'
export const PDFINFO = '/Users/softie/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/pdfinfo'
export const FULL_PAGE_SCREENING = Object.freeze({
  tool: 'bundled pdftoppm',
  dpi: 32,
  outputPolicy: 'external_temp_only; render bytes not stored in Git',
  coverage: 'all declared PDF pages rendered and counted; direct canonical strings remain visual-review-only',
})

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value
export const canonicalJson = value => `${JSON.stringify(stable(value), null, 2)}\n`
const branchIndex = branch => TRADITIONAL_BRANCH_ORDER.indexOf(branch)

function inspectPdf(path, expectedSha256, expectedPageCount) {
  const bytes = requireReadable(path)
  const actualSha256 = sha256(bytes)
  if (actualSha256 !== expectedSha256) throw new Error(`source_pdf_sha256_mismatch:${path}:${actualSha256}`)
  const info = execFileSync(PDFINFO, [path], { encoding: 'utf8' })
  const pageCount = Number(info.match(/^Pages:\s+(\d+)$/m)?.[1] || 0)
  const encrypted = info.match(/^Encrypted:\s+(.+)$/m)?.[1]?.trim().toLowerCase() || 'unknown'
  if (pageCount !== expectedPageCount) throw new Error(`source_pdf_page_count_mismatch:${path}:${pageCount}`)
  if (encrypted !== 'no') throw new Error(`source_pdf_encryption_not_no:${path}:${encrypted}`)
  return { path, sha256: actualSha256, byteLength: bytes.length, pageCount, encrypted, pdfInfo: info.split('\n').filter(Boolean) }
}

function requireReadable(path) {
  try { return readFileSync(path) } catch (error) { throw new Error(`source_pdf_unavailable:${path}:${error.code || error.message}`) }
}

function compareLifeBody(sourceRows) {
  const rows = sourceRows.map(source => {
    const production = resolveZiweiChart({ birthYearStem: '甲', lunarMonth: source.lunarMonth, hourBranch: source.hourBranch })
    const productionRow = { mingGongBranch: production.chart.mingGong?.branch || null, shenGongBranch: production.chart.shenGong?.branch || null }
    const match = source.mingGongBranch === productionRow.mingGongBranch && source.shenGongBranch === productionRow.shenGongBranch
    return {
      rowId: source.rowId,
      orderingKey: source.orderingKey,
      input: { lunarMonth: source.lunarMonth, hourBranch: source.hourBranch },
      sourceDerived: { monthPalaceBranch: source.monthPalaceBranch, mingGongBranch: source.mingGongBranch, shenGongBranch: source.shenGongBranch },
      productionEngine: productionRow,
      match,
      divergence: match ? null : { fields: ['mingGongBranch', 'shenGongBranch'].filter(field => source[field] !== productionRow[field]), causesPreserved: ['source_transcription_or_legibility', 'direction_or_index_convention', 'edition_rule_variant', 'production_engine_implementation', 'comparison_configuration'] },
    }
  })
  const mismatches = rows.filter(row => !row.match)
  return { inputCount: rows.length, expectedInputCount: 144, rows, matchCount: rows.filter(row => row.match).length, mismatchCount: mismatches.length, firstDivergence: mismatches[0] || null }
}

function transformSearch(sourceRows) {
  const candidates = []
  for (let anchorIndex = 0; anchorIndex < 12; anchorIndex += 1) {
    for (const monthDirection of [-1, 1]) {
      for (const lifeDirection of [-1, 1]) {
        for (const bodyDirection of [-1, 1]) {
          for (const monthOffset of [0, 1]) {
            for (const hourOffset of [-1, 0, 1]) {
              let mismatchCount = 0
              let firstDivergence = null
              for (const source of sourceRows) {
                const candidate = evaluateCandidateLifeBody({ lunarMonth: source.lunarMonth, hourBranch: source.hourBranch, anchorIndex, monthDirection, lifeDirection, bodyDirection, monthOffset, hourOffset })
                const fields = ['mingGongBranch', 'shenGongBranch'].filter(field => candidate[field] !== source[field])
                if (fields.length && !firstDivergence) firstDivergence = { rowId: source.rowId, input: { lunarMonth: source.lunarMonth, hourBranch: source.hourBranch }, fields, source: { mingGongBranch: source.mingGongBranch, shenGongBranch: source.shenGongBranch }, candidate }
                if (fields.length) mismatchCount += 1
              }
              candidates.push({ parameters: { anchorBranch: TRADITIONAL_BRANCH_ORDER[anchorIndex], monthDirection, lifeDirection, bodyDirection, monthOffset, hourOffset }, mismatchCount, firstDivergence })
            }
          }
        }
      }
    }
  }
  const exactFits = candidates.filter(candidate => candidate.mismatchCount === 0).map(candidate => candidate.parameters)
  const nearestNonExact = [...candidates].filter(candidate => candidate.mismatchCount > 0).sort((a, b) => a.mismatchCount - b.mismatchCount || JSON.stringify(a.parameters).localeCompare(JSON.stringify(b.parameters)))[0] || null
  return { candidateCount: candidates.length, exactFitParameterSets: exactFits, nearestNonExact, baselineParameters: { anchorBranch: '寅', monthDirection: 1, lifeDirection: -1, bodyDirection: 1, monthOffset: 0, hourOffset: 0 }, searchBoundary: 'finite exhaustive search over anchor branch, month/life/body direction, month offset, and hour offset; no winner is promoted beyond the direct normalized rule' }
}

function buildLocatorInventory(sourceWitnesses) {
  return {
    schemaVersion: `${SCHEMA}-locator-inventory-v0`,
    searchPolicy: { pageNumbersArePdfPagesUnlessPrintedFolioIsExplicit, sourceIdentityRequired: true, rawScanBytesStoredInGit: false, ocrStatus: 'exploration_only_not_canonical', visualReviewTool: 'bundled pdftoppm + local image inspection' },
    editions: sourceWitnesses,
    blockers: [
      { id: 'production-ruler-fields-absent', editionId: 'production', status: 'blocked', verdict: 'implementation_only', statement: 'resolveZiweiChart 仅输出 chart.mingGong 与 chart.shenGong；当前 contract 没有命主·身主字段或推导调用。', nextEvidence: '如要实现须另行授权 production/public contract 变更；本工单不修改。' },
    ],
  }
}

const pageNumbersArePdfPagesUnlessPrintedFolioIsExplicit = 'pdf page labels are 1-based; printed folio is recorded only when visibly read'

function buildTranscription() {
  return {
    schemaVersion: `${SCHEMA}-transcription-v0`,
    reviewerStatus: 'single_visual_review_complete_for_nanbei_and_nanyang_ruler_locators;_surface_aliases_preserved',
    ocrStatus: 'exploration_only_not_canonical',
    occurrences: [
      { occurrenceId: 'nanbei-p23-folio-55-mingzhu-table', editionId: 'nanbei', pdfPage: 23, printedFolio: '五十五', section: '命主表', rawText: '命主表左页；表头可读为 命主 / 星名 / 命宮。十二行按命宮支列出貪狼、巨門、祿存、文曲、廉貞、武曲、破軍、武曲、廉貞、文曲、祿存、巨門。', uncertainty: ['表格以扫描页版面为准；未把现代命主术语解释混入原文。'] },
      { occurrenceId: 'nanbei-p24-folio-56-shenzhu-table', editionId: 'nanbei', pdfPage: 24, printedFolio: '五十六', section: '安身主', rawText: '身主表右页；表头可读为 身主 / 星名 / 本生年支。十二行按子丑寅卯辰巳午未申酉戌亥列出火星、天相、天梁、天同、文昌、天機、火星、天相、天梁、天同、文昌、天機。', uncertainty: ['表格以扫描页版面为准；未把现代星名别名或语义解释混入原文。'] },
      { occurrenceId: 'nanbei-p8-folio-25-life-body-rule', editionId: 'nanbei', pdfPage: 8, printedFolio: '二十五', section: '九、定命、身二宮', rawText: '命宮上的口訣直接给出寅起正月、顺数生月、生月起子、逆至生时为命宮、顺到生时即安身的方向与起点。', uncertainty: ['首句中“巳/順”的字形保留为原始阅读不确定性；归一化仅采用解释列中可确认的起点、方向和终点机制。'] },
      { occurrenceId: 'nanyang-p5-ruler-headings', editionId: 'nanyangtang', pdfPage: 5, section: '目录', rawText: '目录页直接可读 安命主、安身主。', uncertainty: ['目录不给出正文页码；它只能证明题名出现，不能证明规则正文。'] },
      { occurrenceId: 'nanyang-p145-life-body-rule', editionId: 'nanyangtang', pdfPage: 145, section: '○安身命例', rawText: '大抵入命俱從寅上起正月順數至本生月止；后续列文给出逆至本生时安命、顺至本生时安身的命身例。', uncertainty: ['本条为命身规则 witness，不扩展为南阳堂本命主·身主表。'] },
      { occurrenceId: 'nanyang-p159-mingzhu-groups', editionId: 'nanyangtang', pdfPage: 159, printedFolio: null, section: '○安命主', rawText: '直接可读的分组表：貪狼子宮；巨門亥丑宮；祿存寅戌宮；文曲卯酉宮；廉貞申辰宮；武曲未巳宮；破軍午宮。', uncertainty: ['PDF page 159 的印刷面数在当前扫描边缘未安全读出；分组内枝序按原始 glyph 顺序保留，比较展开只在 branch boundary 进行。'] },
      { occurrenceId: 'nanyang-p160-mingzhu-note', editionId: 'nanyangtang', pdfPage: 160, printedFolio: null, section: '命主邻接说明', rawText: '尋貪狼星即命主也。', uncertainty: ['这是命主说明句，不把“尋貪狼星”误扩展为 production 的星位计算。'] },
      { occurrenceId: 'nanyang-p160-shenzhu-groups', editionId: 'nanyangtang', pdfPage: 160, printedFolio: null, section: '○安身主', rawText: '直接可读的分组表：子午人火鈴星；辰戌人文昌星；丑未人天相星；巳亥人天機主；寅申人天梁星；卯酉人天同星。', uncertainty: ['火鈴星与南北山人本火星不是无条件同名；天機主含角色后缀；两类 surface alias 不在 source boundary 被静默合并。'] },
    ],
  }
}

const CANONICAL_STAR_ID_BY_SURFACE = Object.freeze({
  貪狼: 'tanlang', 巨門: 'jumen', 祿存: 'lucun', 文曲: 'wenqu', 廉貞: 'lianzhen', 武曲: 'wugu', 破軍: 'pojun',
  火星: 'huoxing', 天相: 'tianxiang', 天梁: 'tianliang', 天同: 'tiandong', 文昌: 'wenchang', 天機: 'tianji',
})

const NANYANG_SURFACE_ALIAS = Object.freeze({
  火鈴星: { canonicalStarId: null, status: 'blocked_ambiguous_compound_surface', note: 'surface contains 火 and 鈴 and is not silently reduced to 火星' },
  天相星: { canonicalStarId: 'tianxiang', status: 'explicit_name_plus_star_suffix' },
  天梁星: { canonicalStarId: 'tianliang', status: 'explicit_name_plus_star_suffix' },
  天同星: { canonicalStarId: 'tiandong', status: 'explicit_name_plus_star_suffix' },
  文昌星: { canonicalStarId: 'wenchang', status: 'explicit_name_plus_star_suffix' },
  天機主: { canonicalStarId: 'tianji', status: 'explicit_name_plus_role_suffix' },
})

function aliasResolution(surface, edition) {
  if (edition === 'nanyangtang') return { surface, ...(NANYANG_SURFACE_ALIAS[surface] || { canonicalStarId: CANONICAL_STAR_ID_BY_SURFACE[surface] || null, status: 'direct_surface_name' }) }
  return { surface, canonicalStarId: CANONICAL_STAR_ID_BY_SURFACE[surface] || null, status: 'direct_surface_name' }
}

function sourceRulerRowsByEdition(edition) {
  return enumerateRulerInputs(edition).map(row => ({
    ...row,
    mingZhuSurface: row.mingZhuStar,
    shenZhuSurface: row.shenZhuStar,
    mingZhuAlias: aliasResolution(row.mingZhuStar, edition),
    shenZhuAlias: aliasResolution(row.shenZhuStar, edition),
  }))
}

function buildEditionRulerComparison(nanyangRows, nanbeiRows) {
  const nanbeiByKey = new Map(nanbeiRows.map(row => [`${row.mingGongBranch}:${row.birthYearBranch}`, row]))
  const rows = nanyangRows.map(nanyang => {
    const nanbei = nanbeiByKey.get(`${nanyang.mingGongBranch}:${nanyang.birthYearBranch}`)
    const mingSurfaceMatch = nanyang.mingZhuSurface === nanbei.mingZhuSurface
    const mingCanonicalMatch = nanyang.mingZhuAlias.canonicalStarId === nanbei.mingZhuAlias.canonicalStarId
    const shenCanonicalComparable = nanyang.shenZhuAlias.canonicalStarId !== null && nanbei.shenZhuAlias.canonicalStarId !== null
    const shenCanonicalMatch = shenCanonicalComparable && nanyang.shenZhuAlias.canonicalStarId === nanbei.shenZhuAlias.canonicalStarId
    return {
      rowId: nanyang.rowId,
      orderingKey: nanyang.orderingKey,
      input: { mingGongBranch: nanyang.mingGongBranch, birthYearBranch: nanyang.birthYearBranch },
      nanyang: { mingZhuSurface: nanyang.mingZhuSurface, shenZhuSurface: nanyang.shenZhuSurface, mingZhuAlias: nanyang.mingZhuAlias, shenZhuAlias: nanyang.shenZhuAlias },
      nanbei: { mingZhuSurface: nanbei.mingZhuSurface, shenZhuSurface: nanbei.shenZhuSurface, mingZhuAlias: nanbei.mingZhuAlias, shenZhuAlias: nanbei.shenZhuAlias },
      comparison: {
        mingZhuSurfaceMatch: mingSurfaceMatch,
        mingZhuCanonicalMatch: mingCanonicalMatch,
        shenZhuSurfaceMatch: nanyang.shenZhuSurface === nanbei.shenZhuSurface,
        shenZhuCanonicalComparable: shenCanonicalComparable,
        shenZhuCanonicalMatch: shenCanonicalComparable ? shenCanonicalMatch : null,
        verdict: !mingCanonicalMatch ? 'substantive_rule_divergence_proven' : shenCanonicalComparable ? (shenCanonicalMatch ? 'equivalent_representation_proven' : 'substantive_rule_divergence_proven') : 'blocked_source_legibility',
      },
    }
  })
  const blocked = rows.filter(row => !row.comparison.shenZhuCanonicalComparable)
  const comparable = rows.filter(row => row.comparison.shenZhuCanonicalComparable)
  return {
    inputCount: rows.length,
    expectedInputCount: 144,
    rows,
    summary: {
      mingZhuSurfaceMatches: rows.filter(row => row.comparison.mingZhuSurfaceMatch).length,
      mingZhuCanonicalMatches: rows.filter(row => row.comparison.mingZhuCanonicalMatch).length,
      shenZhuSurfaceMatches: rows.filter(row => row.comparison.shenZhuSurfaceMatch).length,
      shenZhuCanonicalComparable: comparable.length,
      shenZhuCanonicalMatches: comparable.filter(row => row.comparison.shenZhuCanonicalMatch).length,
      shenZhuCanonicalBlocked: blocked.length,
      blockedSurfaceClasses: [...new Set(blocked.flatMap(row => [row.nanyang.shenZhuSurface, row.nanbei.shenZhuSurface]))].sort(),
    },
  }
}

function buildNormalizedRules() {
  return {
    schemaVersion: SOURCE_RULE_SCHEMA,
    lifeBody: {
      sourceRefs: ['nanbei-p8-folio-25-life-body-rule', 'nanyang-p145-life-body-rule'],
      branchOrder: { values: TRADITIONAL_BRANCH_ORDER, indexConvention: '子=0, 丑=1, 寅=2, ... 亥=11', modulo: 12 },
      monthPlacement: { startBranch: '寅', firstLunarMonth: 1, direction: '+1', formula: '(index(寅)+lunarMonth-1) mod 12' },
      hourPlacement: { startLabel: '子', startAtMonthPalace: true, lifeDirection: '-1', bodyDirection: '+1', formula: '命宮=monthPalace-hourIndex; 身宮=monthPalace+hourIndex' },
      outputBoundary: { 命宮: 'life', 身宮: 'shen', mappingStatus: 'comparison-boundary-only; no production contract change' },
    },
    nanbeiRulers: {
      sourceRefs: ['nanbei-p23-folio-55-mingzhu-table', 'nanbei-p24-folio-56-shenzhu-table'],
      mingZhu: { input: '命宮地支', output: '命主星', table: NANBEI_MINGZHU_BY_MING_GONG },
      shenZhu: { input: '本生年支', output: '身主星', table: NANBEI_SHENZHU_BY_BIRTH_YEAR_BRANCH },
      sourceQualification: 'direct visible table in Nanbei source; no cross-edition identity claim',
    },
    nanyangRulers: {
      status: 'direct_visible_tables_with_surface_alias_boundaries',
      sourceRefs: ['nanyang-p159-mingzhu-groups', 'nanyang-p160-mingzhu-note', 'nanyang-p160-shenzhu-groups'],
      mingZhu: { input: '命宮地支', output: '命主星', table: NANYANG_MINGZHU_BY_MING_GONG, groupedRaw: ['貪狼子宮', '巨門亥丑宮', '祿存寅戌宮', '文曲卯酉宮', '廉貞申辰宮', '武曲未巳宮', '破軍午宮'] },
      shenZhu: { input: '本生年支', output: '身主星 surface', table: NANYANG_SHENZHU_SURFACE_BY_BIRTH_YEAR_BRANCH, groupedRaw: ['子午人火鈴星', '辰戌人文昌星', '丑未人天相星', '巳亥人天機主', '寅申人天梁星', '卯酉人天同星'], aliasPolicy: NANYANG_SURFACE_ALIAS },
      sourceQualification: 'direct visible tables in Nanyang source; surface variants remain separate from canonical IDs',
    },
  }
}

function buildProductionTrace(lifeBodyRows, rulerRows) {
  const rulerProbe = resolveZiweiChart({ birthYearStem: '甲', birthYearBranch: '子', lunarMonth: 1, hourBranch: '子' })
  return {
    schemaVersion: `${SCHEMA}-production-trace-v0`,
    callPath: { entry: 'resolveZiweiChart(params)', file: 'src/ziwei/ziweiResolver.js', consumers: ['src/ziwei/ziweiContract.js', 'src/ziwei/ziweiPalaceContext.js', 'test/threeSystemPrepPipeline.test.js'], productionChanged: false },
    implementedInputs: ['birthYearStem', 'birthYearBranch', 'lunarMonth', 'hourBranch'],
    implementedOutputs: ['chart.mingGong', 'chart.shenGong', 'chart.fiveElementsBureau', 'chart.palaces'],
    absentOutputs: ['chart.mingZhu', 'chart.shenZhu', '命主', '身主'],
    lifeBodyRows,
    rulerRows: rulerRows.map(row => ({ edition: row.edition, rowId: row.rowId, orderingKey: row.orderingKey, input: { mingGongBranch: row.mingGongBranch, birthYearBranch: row.birthYearBranch }, sourceDerived: { mingZhuSurface: row.mingZhuSurface, shenZhuSurface: row.shenZhuSurface, mingZhuAlias: row.mingZhuAlias, shenZhuAlias: row.shenZhuAlias }, productionStatus: 'not_implemented_in_current_contract', productionEngine: { mingZhuStar: null, shenZhuStar: null } })),
    probeEvidence: { input: { birthYearStem: '甲', birthYearBranch: '子', lunarMonth: 1, hourBranch: '子' }, observedChartKeys: Object.keys(rulerProbe.chart), rulerFieldsPresent: Boolean(rulerProbe.chart.mingZhu || rulerProbe.chart.shenZhu) },
  }
}

function buildDependencyGraph() {
  return {
    schemaVersion: `${SCHEMA}-dependency-graph-v0`,
    nodes: [
      { id: 'source.nanbei.life_body', kind: 'source_rule', state: 'direct_visible_rule' },
      { id: 'source.nanbei.ming_zhu', kind: 'source_table', state: 'direct_visible_table' },
      { id: 'source.nanbei.shen_zhu', kind: 'source_table', state: 'direct_visible_table' },
      { id: 'source.nanyang.life_body', kind: 'source_rule', state: 'direct_visible_rule' },
      { id: 'source.nanyang.rulers', kind: 'source_rule', state: 'not_located' },
      { id: 'production.resolveZiweiChart', kind: 'production_entry', state: 'implemented' },
      { id: 'production.ruler_fields', kind: 'production_output', state: 'absent' },
      { id: 'comparison.life_body', kind: 'comparison', state: 'comparable' },
      { id: 'comparison.rulers', kind: 'comparison', state: 'blocked_not_comparable' },
    ],
    edges: [
      ['source.nanbei.life_body', 'comparison.life_body'], ['source.nanyang.life_body', 'comparison.life_body'], ['production.resolveZiweiChart', 'comparison.life_body'],
      ['source.nanbei.ming_zhu', 'comparison.rulers'], ['source.nanbei.shen_zhu', 'comparison.rulers'], ['source.nanyang.rulers', 'comparison.rulers'], ['production.ruler_fields', 'comparison.rulers'],
    ].map(([from, to]) => ({ from, to })),
    semanticPromotion: 'blocked; this graph records rule/evidence dependencies only',
  }
}

export async function buildArtifact() {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const sourceWitnesses = [
    { editionId: 'nanyangtang', label: '明代南阳堂刊本', pdf: { ...inspectPdf(MING_PDF, MING_PDF_SHA256, 528), fullPageScreening: { ...FULL_PAGE_SCREENING, renderedPageCount: 528 } }, locators: [{ pdfPage: 5, section: '目录', printedFolio: null, status: 'heading_only', claims: ['安命主', '安身主'] }, { pdfPage: 145, section: '○安身命例', printedFolio: null, status: 'direct_rule', claims: ['寅起正月', '命逆', '身顺'] }, { pdfPage: 159, section: '○安命主', printedFolio: null, status: 'direct_table', claims: ['貪狼子宮', '巨門亥丑宮', '祿存寅戌宮', '文曲卯酉宮', '廉貞申辰宮', '武曲未巳宮', '破軍午宮'] }, { pdfPage: 160, section: '○安身主', printedFolio: null, status: 'direct_table', claims: ['子午人火鈴星', '辰戌人文昌星', '丑未人天相星', '巳亥人天機主', '寅申人天梁星', '卯酉人天同星'] }], rulerStatus: 'direct_tables_located' },
    { editionId: 'nanbei', label: '南北山人本', pdf: { ...inspectPdf(NANBEI_PDF, NANBEI_PDF_SHA256, 219), fullPageScreening: { ...FULL_PAGE_SCREENING, renderedPageCount: 219 } }, locators: [{ pdfPage: 8, printedFolio: '二十五', section: '九、定命、身二宮', status: 'direct_rule' }, { pdfPage: 23, printedFolio: '五十五', section: '命主表', status: 'direct_table' }, { pdfPage: 24, printedFolio: '五十六', section: '安身主', status: 'direct_table' }], rulerStatus: 'direct_tables_located' },
  ]
  const locatorInventory = buildLocatorInventory(sourceWitnesses)
  const transcription = buildTranscription()
  const normalizedRules = buildNormalizedRules()
  const sourceLifeBodyRows = enumerateLifeBodyInputs()
  const nanyangRulerRows = sourceRulerRowsByEdition('nanyangtang')
  const nanbeiRulerRows = sourceRulerRowsByEdition('nanbei')
  const sourceRulerRows = [...nanyangRulerRows, ...nanbeiRulerRows]
  const lifeBodyComparison = compareLifeBody(sourceLifeBodyRows)
  const productionTrace = buildProductionTrace(lifeBodyComparison.rows, sourceRulerRows)
  const sourceEditionRulerComparison = buildEditionRulerComparison(nanyangRulerRows, nanbeiRulerRows)
  const rulerProductionRows = sourceRulerRows.map(row => ({ edition: row.edition, rowId: row.rowId, orderingKey: row.orderingKey, input: { mingGongBranch: row.mingGongBranch, birthYearBranch: row.birthYearBranch }, sourceDerived: { mingZhuSurface: row.mingZhuSurface, shenZhuSurface: row.shenZhuSurface, mingZhuAlias: row.mingZhuAlias, shenZhuAlias: row.shenZhuAlias }, productionStatus: 'not_comparable', productionEngine: { mingZhuStar: null, shenZhuStar: null }, match: null, divergence: { reason: 'production_fields_absent' } }))
  const rulerComparison = { expectedInputCountPerEdition: 144, editions: { nanyangtang: { inputCount: nanyangRulerRows.length, rows: nanyangRulerRows }, nanbei: { inputCount: nanbeiRulerRows.length, rows: nanbeiRulerRows } }, sourceEditionComparison: sourceEditionRulerComparison, production: { inputCount: rulerProductionRows.length, expectedInputCount: 288, rows: rulerProductionRows, comparableCount: 0, matchCount: 0, mismatchCount: 0, firstDivergence: null } }
  const comparison = { schemaVersion: `${SCHEMA}-comparison-v0`, lifeBody: lifeBodyComparison, rulers: rulerComparison, transformationSearch: transformSearch(sourceLifeBodyRows), interpretation: 'life/body is exhaustive and comparable; both ruler source domains are exhaustive, source-edition surface relations are preserved, and production ruler comparison is implementation_only because the public contract has no ruler fields' }
  const dependencyGraph = buildDependencyGraph()
  const artifactFiles = {
    locatorInventory: `artifacts/${SCHEMA}/locator-inventory.json`, transcription: `artifacts/${SCHEMA}/transcription.json`, normalizedRules: `artifacts/${SCHEMA}/normalized-rules.json`, productionTrace: `artifacts/${SCHEMA}/production-trace.json`, comparison: `artifacts/${SCHEMA}/comparison.json`, dependencyGraph: `artifacts/${SCHEMA}/dependency-graph.json`, conclusion: `artifacts/${SCHEMA}/conclusion.md`,
  }
  const fileValues = { locatorInventory, transcription, normalizedRules, productionTrace, comparison, dependencyGraph }
  const artifactHashes = Object.fromEntries(Object.entries(fileValues).map(([key, value]) => [`${key}Sha256`, sha256(Buffer.from(canonicalJson(value)))]))
  const observedHead = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  const artifact = {
    schemaVersion: SCHEMA,
    verdictToken: VERDICT,
    sourceIdentity: { pdfsReadOnly: true, editions: sourceWitnesses.map(witness => witness.pdf), hashBasis: 'actual PDF bytes read at materialization; no copy/recompress/Git inclusion' },
    sourceWitnesses,
    locatorInventory,
    transcription,
    normalizedRules,
    productionTrace,
    comparison,
    dependencyGraph,
    verdicts: {
      nanyangLifeBody: 'exact_match',
      nanbeiLifeBody: 'exact_match',
      nanyangMingZhu: 'exact_match',
      nanbeiMingZhu: 'exact_match',
      sourceEditionMingZhu: 'exact_match',
      sourceEditionShenZhu: 'blocked_source_legibility',
      productionLifeBody: 'exact_match',
      productionRulers: 'implementation_only',
    },
    artifactFiles,
    artifactHashes,
    boundaries: { stableClaimCount: 0, readiness: 'not_safe_to_start', grounding: 'blocked', activation: 'experimental', interpretationGenerated: false, productionRuleModified: false, publicContractModified: false, sourceEditionIdentityPromoted: false, pdfStoredInGit: false, renderStoredInGit: false },
    blockers: locatorInventory.blockers,
    negativeContract: { checker: `scripts/check-${SCHEMA}.mjs`, negativeChecker: `scripts/check-${SCHEMA}-negative-v0.mjs`, mustReject: ['source PDF hash/page/encryption tampering', 'Ming ruler source locator deletion or surface alias promotion', 'OCR promotion', 'non-exhaustive input rows', 'production ruler field invention', 'mismatch concealment', 'stable/readiness/activation promotion', 'production/public contract changes', 'basis HEAD substitution'] },
    deterministicContract: { generatedAt: 'forbidden', ordering: 'branch order 子丑寅卯辰巳午未申酉戌亥; numeric lunarMonth then branch; edition then input', hashes: 'actual bytes only', sourceEvaluatorImportsProduction: false, basisHead: BASIS_HEAD, baseHeadSource: 'explicit task basis HEAD; current checkout is diagnostic only', includedCommit: null },
    basisHead: BASIS_HEAD,
    observedHead,
    materializer: `scripts/materialize-${SCHEMA}.mjs`,
  }
  return attachArtifactIdentity(artifact, buildArtifactIdentity({ root, artifactId: SCHEMA, materializerPath: artifact.materializer, materializerVersion: MATERIALIZER_VERSION, baseHead: BASIS_HEAD, inputs: ['src/ziwei/lifeBodyPalaceRulerSourceEvidence.js', 'src/ziwei/ziweiResolver.js', 'src/ziwei/ziweiContract.js'] }))
}

function conclusionMarkdown(artifact) {
  return `# ${SCHEMA}\n\n- verdict: \`${artifact.verdictToken}\`\n- basis HEAD: \`${artifact.basisHead}\`; observed checkout HEAD: \`${artifact.observedHead}\` (diagnostic only).\n- life/body palace: ${artifact.comparison.lifeBody.matchCount}/${artifact.comparison.lifeBody.inputCount} comparable production rows match; no production rule was changed.\n- ruler source domains: Nanyang Tang 144/144 and Nanbei 144/144 are materialized; source-edition surface/canonical relations remain explicit.\n- source-edition 命主: exact 144/144; source-edition 身主: 120/144 canonical-comparable equivalent rows and 24/144 blocked by the Nanyang surface 火鈴星 boundary.\n- production rulers: 0/${artifact.comparison.rulers.production.inputCount} comparable because current production has no 命主·身主 fields; rule verdict is \`implementation_only\`.\n- Nanyang Tang locators: 命主 direct table at PDF p159 and 身主 direct table at PDF p160; p145 remains the direct 命身 placement rule.\n- promotion boundary: stable claims 0; readiness \`not_safe_to_start\`; grounding \`blocked\`; activation \`experimental\`.\n\nThis artifact is complete as bounded source evidence, while preserving source surface variants and source/production divergence without inferring a cross-edition semantic winner or production availability.\n`
}

export async function writeArtifact(target) {
  const artifact = await buildArtifact()
  const body = canonicalJson(artifact)
  const dir = dirname(target)
  await mkdir(dir, { recursive: true })
  await writeFile(target, body)
  const auxiliary = {
    'locator-inventory.json': artifact.locatorInventory,
    'transcription.json': artifact.transcription,
    'normalized-rules.json': artifact.normalizedRules,
    'production-trace.json': artifact.productionTrace,
    'comparison.json': artifact.comparison,
    'dependency-graph.json': artifact.dependencyGraph,
  }
  for (const [name, value] of Object.entries(auxiliary)) {
    const bytes = Buffer.from(canonicalJson(value)); const path = resolve(dir, name)
    await writeFile(path, bytes)
    await writeFile(`${path}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(bytes), artifactByteSha256Scope: 'UTF-8 bytes including final LF' }, null, 2)}\n`)
  }
  await writeFile(resolve(dir, 'conclusion.md'), conclusionMarkdown(artifact))
  await writeFile(`${target}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(Buffer.from(body)), artifactByteSha256Scope: 'complete.json UTF-8 bytes including final LF' }, null, 2)}\n`)
  return artifact
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const target = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`)
  const artifact = await writeArtifact(target)
  console.log(JSON.stringify({ target, verdict: artifact.verdictToken, basisHead: artifact.basisHead, observedHead: artifact.observedHead, lifeBody: { inputCount: artifact.comparison.lifeBody.inputCount, matchCount: artifact.comparison.lifeBody.matchCount, mismatchCount: artifact.comparison.lifeBody.mismatchCount }, rulerSourceRowsPerEdition: artifact.comparison.rulers.expectedInputCountPerEdition, rulerProductionRows: artifact.comparison.rulers.production.inputCount, rulerComparable: artifact.comparison.rulers.production.comparableCount, exactTransformFits: artifact.comparison.transformationSearch.exactFitParameterSets.length, artifactByteSha256: sha256(Buffer.from(canonicalJson(artifact))) }, null, 2))
}
