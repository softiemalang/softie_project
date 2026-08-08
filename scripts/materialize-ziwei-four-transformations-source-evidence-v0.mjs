import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  attachArtifactIdentity,
  buildArtifactIdentity,
  canonicalIdentityJson,
} from '../src/artifactIdentity.js'
import {
  YEAR_STEM_TRANSFORMATIONS,
} from '../src/ziwei/transformationRules.js'
import { resolveFourTransformations } from '../src/ziwei/transformationResolver.js'
import { resolvePdfSourcePathSync } from './lib/pdf-source-resolver.mjs'

export const SCHEMA = 'ziwei-four-transformations-source-evidence-v0'
export const MATERIALIZER_VERSION = '1.0.0'
export const BASIS_HEAD = '6fc9db56fff7f453e87dd3425caab5b9058f2074'
export const ARTIFACT_DIR = `artifacts/${SCHEMA}`
export const MATERIALIZER_PATH = `scripts/materialize-${SCHEMA}.mjs`

export const PDF_SOURCES = Object.freeze({
  mingNanyangtang: {
    id: 'ming_nanyangtang',
    label: '明代南阳堂刊本',
    path: '/Users/softie/Downloads/新锓希夷陈先生紫微斗数全书.七卷.宋.陈抟撰.明.潘希尹补.明代南阳堂刊本.黑白版.pdf',
    sha256: '04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc',
    pageCount: 528,
  },
  nanbeiShanren: {
    id: 'nanbei_shanren',
    label: '南北山人本',
    path: '/Users/softie/Downloads/命-南北山人_紫微斗数全书.pdf',
    sha256: '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023',
    pageCount: 219,
  },
})

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const PDFINFO = '/Users/softie/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/pdfinfo'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

const TYPES = Object.freeze([
  { key: 'lu', type: 'hua_lu', glyph: '化祿', labelKey: 'lu' },
  { key: 'quan', type: 'hua_quan', glyph: '化權', labelKey: 'quan' },
  { key: 'ke', type: 'hua_ke', glyph: '化科', labelKey: 'ke' },
  { key: 'ji', type: 'hua_ji', glyph: '化忌', labelKey: 'ji' },
])

const STEMS = Object.freeze(['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'])

const CANONICAL_LABELS = Object.freeze({
  lianzhen: '廉貞', pojun: '破軍', wugu: '武曲', taiyang: '太陽',
  tianji: '天機', tianliang: '天梁', ziwei: '紫微', taiyin: '太陰',
  tiandong: '天同', wenchang: '文昌', jumen: '巨門', tanlang: '貪狼',
  youbi: '右弼', wengu: '文曲', tianfu: '天府', zuobo: '左輔',
})

const ALIAS_TO_CANONICAL = Object.freeze(Object.fromEntries(
  Object.entries(CANONICAL_LABELS).map(([id, label]) => [label, id]),
))

const MAJOR_IDS = new Set([
  'ziwei', 'tianji', 'taiyang', 'wugu', 'tiandong', 'lianzhen',
  'tianfu', 'taiyin', 'tanlang', 'jumen', 'tianxiang', 'tianliang', 'qisai', 'pojun',
])
const AUXILIARY_IDS = new Set(['wenchang', 'wengu', 'zuobo', 'youbi'])

const LOCATORS = Object.freeze([
  {
    id: 'ming-p151-four-transformations-title', sourceId: 'ming_nanyangtang', pdfPage: 151,
    printedFolio: null, volume: '卷三', platePosition: 'single_page_vertical_columns_right_to_left',
    title: '○安祿權科忌四星變化訣',
    directReading: '○安祿權科忌四星變化訣',
    readingMode: 'direct_high_resolution_plate', confidence: 'high', canonical: true,
    uncertainty: ['印刷面數未在该页扫描边界内安全辨认。', '正文在相邻页继续，标题本身不等于完整10干表。'],
  },
  {
    id: 'ming-p152-甲-four-transformations-example', sourceId: 'ming_nanyangtang', pdfPage: 152,
    printedFolio: null, volume: '卷三', platePosition: 'single_page_rightmost_vertical_column',
    title: '四化訣 adjacent 甲 example',
    directReading: '如甲生人廉貞化祿破軍化權武曲化科太陽化忌是也',
    readingMode: 'direct_high_resolution_plate', confidence: 'high', canonical: true,
    uncertainty: ['该直接句只闭合甲行；未将其推广到乙至癸。'],
  },
  {
    id: 'ming-full-scan-four-transformations-not-located', sourceId: 'ming_nanyangtang', pdfPage: null,
    printedFolio: null, volume: null, platePosition: 'full_528_page_low_resolution_render_plus_candidate_high_resolution_review',
    title: '四化完整乙至癸表 full-scan negative locator',
    directReading: null, readingMode: 'full_pdf_scan_negative_locator', confidence: 'not_located_after_full_scan', canonical: false,
    uncertainty: ['这是否定定位而不是“来源不存在”的证明；不得合成缺失行。'],
  },
  {
    id: 'nanbei-p16-printed-41-four-transformations-context', sourceId: 'nanbei_shanren', pdfPage: 16,
    printedFolio: '四十一', volume: null, platePosition: 'left_scanned_leaf_vertical_columns_right_to_left',
    title: '四化 adjacent explanation and next-page table pointer',
    directReading: '四化（祿、權、科、忌）及相鄰說明；四化速檢表於次頁。',
    readingMode: 'direct_high_resolution_plate', confidence: 'medium', canonical: true,
    uncertainty: ['局部邻接说明按可直接辨认的连续字串保留；不承担10×4赋值。'],
  },
  {
    id: 'nanbei-p17-printed-42-four-transformations-table', sourceId: 'nanbei_shanren', pdfPage: 17,
    printedFolio: '四十二', volume: null, platePosition: 'right_scanned_leaf_table',
    title: '四化速檢表',
    directReading: '年干｜化祿｜化權｜化科｜化忌；甲乙丙丁戊己庚辛壬癸十行',
    readingMode: 'direct_high_resolution_plate', confidence: 'high', canonical: true,
    uncertainty: ['合葉 scan 的另一侧为印刷面四十三；本规则表位于右侧印刷面四十二。'],
  },
])

const locatorMap = Object.fromEntries(LOCATORS.map(item => [item.id, item]))

const NANBEI_RAW_ROWS = Object.freeze([
  ['甲', ['廉貞', '破軍', '武曲', '太陽']],
  ['乙', ['天機', '天梁', '紫微', '太陰']],
  ['丙', ['天同', '天機', '文昌', '廉貞']],
  ['丁', ['太陰', '天同', '天機', '巨門']],
  ['戊', ['貪狼', '太陰', '右弼', '天機']],
  ['己', ['武曲', '貪狼', '天梁', '文曲']],
  ['庚', ['太陽', '武曲', '太陰', '天同']],
  ['辛', ['巨門', '太陽', '文曲', '文昌']],
  ['壬', ['天梁', '紫微', '天府', '武曲']],
  ['癸', ['破軍', '巨門', '太陰', '貪狼']],
])

const MING_DIRECT_ROWS = Object.freeze({
  甲: ['廉貞', '破軍', '武曲', '太陽'],
})

function pdfIdentity(source) {
  const accessPath = resolvePdfSourcePathSync(source.id === 'ming_nanyangtang' ? 'nanyangtang_quanbao_528p' : 'nanbei_quanbao_219p')
  if (!existsSync(accessPath)) throw new Error(`source_pdf_missing:${accessPath}`)
  const bytes = readFileSync(accessPath)
  const info = execFileSync(PDFINFO, [accessPath], { encoding: 'utf8' })
  const pages = Number(info.match(/^Pages:\s+(\d+)/m)?.[1] || 0)
  const encrypted = (info.match(/^Encrypted:\s+(.+)/m)?.[1] || '').trim().toLowerCase() !== 'no'
  const actual = { id: source.id, label: source.label, pathOutsideRepository: source.path, actualByteSha256: sha256(bytes), expectedByteSha256: source.sha256, pageCount: pages, encrypted, readOnly: true, storedInGit: false }
  if (actual.actualByteSha256 !== source.sha256) throw new Error(`source_pdf_hash_mismatch:${source.id}`)
  if (actual.pageCount !== source.pageCount) throw new Error(`source_pdf_page_count_mismatch:${source.id}`)
  if (actual.encrypted) throw new Error(`source_pdf_encrypted:${source.id}`)
  return actual
}

function ref(id) {
  const locator = locatorMap[id]
  if (!locator) throw new Error(`unknown_locator:${id}`)
  return { sourceRef: id, sourceId: locator.sourceId, pdfPage: locator.pdfPage, printedFolio: locator.printedFolio }
}

function sourceRow(edition, stem, type, rawTarget, status, sourceRef, confidence, directReading) {
  const normalizedStarId = rawTarget === null ? null : ALIAS_TO_CANONICAL[rawTarget]
  if (rawTarget !== null && !normalizedStarId) throw new Error(`unmapped_source_alias:${rawTarget}`)
  return {
    occurrenceId: `${edition}:${stem}:${type.type}`,
    edition,
    stem,
    transformation: type.type,
    transformationGlyph: type.glyph,
    rawTarget,
    normalizedStarId,
    sourceStatus: status,
    confidence,
    directReading,
    sourceRefs: [ref(sourceRef)],
    aliasResolution: rawTarget === null ? null : { rawGlyph: rawTarget, normalizedStarId, method: 'explicit_fixed_alias_table', postHoc: false },
  }
}

function sourceOccurrences() {
  const rows = []
  for (const [stem, rawTargets] of NANBEI_RAW_ROWS) {
    TYPES.forEach((type, index) => rows.push(sourceRow('nanbei_shanren', stem, type, rawTargets[index], 'direct_table_reading', 'nanbei-p17-printed-42-four-transformations-table', 'high', `${stem}${rawTargets.join('')}`)))
  }
  for (const stem of STEMS) {
    const direct = MING_DIRECT_ROWS[stem]
    TYPES.forEach((type, index) => {
      if (direct) rows.push(sourceRow('ming_nanyangtang', stem, type, direct[index], 'direct_sentence_reading', 'ming-p152-甲-four-transformations-example', 'high', '如甲生人廉貞化祿破軍化權武曲化科太陽化忌是也'))
      else rows.push(sourceRow('ming_nanyangtang', stem, type, null, 'source_rule_not_located', 'ming-full-scan-four-transformations-not-located', 'not_located_after_full_scan', null))
    })
  }
  return rows
}

function productionTrace() {
  const rows = STEMS.flatMap(stem => resolveFourTransformations(stem).transformations.map((item, index) => {
    const type = TYPES[index]
    return {
      occurrenceId: `production:${stem}:${type.type}`,
      stem,
      transformation: type.type,
      transformationGlyph: type.glyph,
      inputField: 'birthYearStem',
      rawTargetLabel: CANONICAL_LABELS[item.starId] || null,
      normalizedStarId: item.starId,
      status: 'implemented',
      ruleSetVersion: item.ruleSetVersion,
      callPath: [
        { file: 'src/interpretationPrep/threeSystemPrepPipeline.js', lines: '180', call: 'resolveFourTransformations(birthYearStem)' },
        { file: 'src/ziwei/transformationResolver.js', lines: '13-14', call: 'YEAR_STEM_TRANSFORMATIONS[birthYearStem]' },
        { file: 'src/ziwei/transformationResolver.js', lines: `${28 + index * 8}-${35 + index * 8}`, call: `stemMap.${type.key} -> ${type.type}` },
        { file: 'src/interpretationPrep/threeSystemPrepPipeline.js', lines: '198-200', call: 'chart.transformations = transformationResult.transformations' },
      ],
    }
  }))
  return {
    schemaVersion: SCHEMA,
    acceptedInputFields: ['birthYearStem'],
    ignoredForFourTransformations: ['lunarMonth', 'lunarDay', 'hourBranch', 'birthYearBranch', 'palace placement'],
    resolver: { file: 'src/ziwei/transformationResolver.js', exportName: 'resolveFourTransformations', outputOrder: TYPES.map(item => item.type), ruleSetFile: 'src/ziwei/transformationRules.js', ruleSetVersion: 'traditional_v1' },
    pipeline: { file: 'src/interpretationPrep/threeSystemPrepPipeline.js', inputDerivation: 'sajuRaw.pillars.year.stem -> STEM_TO_HAN -> birthYearStem', callLines: '225-226', resolverLines: '180', outputLines: '198-200' },
    rows,
    productionContract: { calculationChanged: false, publicContractChanged: false, readinessChanged: false, groundingChanged: false, activationChanged: false },
  }
}

function normalizedRules(sourceRows, productionRows) {
  const table = (edition, rows) => STEMS.map(stem => ({
    stem,
    assignments: TYPES.map(type => {
      const row = rows.find(item => item.stem === stem && item.transformation === type.type)
      return { transformation: type.type, rawTarget: row.rawTarget, normalizedStarId: row.normalizedStarId, sourceStatus: row.sourceStatus, sourceRefs: row.sourceRefs }
    }),
  }))
  return {
    schemaVersion: SCHEMA,
    axisOrder: { stemOrder: STEMS, transformationOrder: TYPES.map(item => item.type), sourceColumnGlyphOrder: ['年干', '化祿', '化權', '化科', '化忌'] },
    aliasTable: Object.entries(ALIAS_TO_CANONICAL).map(([rawGlyph, normalizedStarId]) => ({ rawGlyph, normalizedStarId, canonicalLabel: CANONICAL_LABELS[normalizedStarId] })).sort((a, b) => a.rawGlyph.localeCompare(b.rawGlyph)),
    sourceTables: { ming_nanyangtang: table('ming_nanyangtang', sourceRows.filter(item => item.edition === 'ming_nanyangtang')), nanbei_shanren: table('nanbei_shanren', sourceRows.filter(item => item.edition === 'nanbei_shanren')) },
    productionTable: STEMS.map(stem => ({ stem, assignments: TYPES.map(type => { const row = productionRows.find(item => item.stem === stem && item.transformation === type.type); return { transformation: type.type, rawTargetLabel: row.rawTargetLabel, normalizedStarId: row.normalizedStarId } }) })),
  }
}

function compare(sourceRows, productionRows) {
  const productionByKey = new Map(productionRows.map(row => [`${row.stem}:${row.transformation}`, row]))
  const rows = sourceRows.map(source => {
    const production = productionByKey.get(`${source.stem}:${source.transformation}`)
    const comparable = source.sourceStatus !== 'source_rule_not_located'
    const rawMatch = comparable && source.rawTarget === production.rawTargetLabel
    const normalizedMatch = comparable && source.normalizedStarId === production.normalizedStarId
    const verdict = !comparable ? 'source_rule_not_located' : normalizedMatch ? 'exact_match' : 'substantive_rule_divergence_proven'
    return { comparisonId: `${source.edition}:${source.stem}:${source.transformation}`, edition: source.edition, stem: source.stem, transformation: source.transformation, sourceRawTarget: source.rawTarget, sourceNormalizedStarId: source.normalizedStarId, productionRawTargetLabel: production.rawTargetLabel, productionNormalizedStarId: production.normalizedStarId, comparable, rawMatch: rawMatch || null, normalizedMatch: normalizedMatch || null, verdict, sourceRefs: source.sourceRefs, productionOccurrenceId: production.occurrenceId, minimalCounterexample: verdict === 'substantive_rule_divergence_proven' ? { source: source.normalizedStarId, production: production.normalizedStarId } : null }
  })
  const summaryFor = edition => {
    const subset = rows.filter(row => row.edition === edition)
    return { sourceOccurrenceCount: subset.length, comparableCount: subset.filter(row => row.comparable).length, rawMatchCount: subset.filter(row => row.rawMatch === true).length, normalizedMatchCount: subset.filter(row => row.normalizedMatch === true).length, mismatchCount: subset.filter(row => row.normalizedMatch === false).length, blockedCount: subset.filter(row => row.verdict === 'source_rule_not_located').length }
  }
  const editionVerdicts = Object.keys(PDF_SOURCES).map(key => {
    const edition = PDF_SOURCES[key].id
    const stats = summaryFor(edition)
    return { edition, verdict: stats.blockedCount > 0 ? 'source_rule_not_located' : stats.mismatchCount > 0 ? 'substantive_rule_divergence_proven' : 'exact_match', stats }
  })
  const crossEdition = STEMS.flatMap(stem => TYPES.map(type => {
    const ming = rows.find(row => row.edition === 'ming_nanyangtang' && row.stem === stem && row.transformation === type.type)
    const nanbei = rows.find(row => row.edition === 'nanbei_shanren' && row.stem === stem && row.transformation === type.type)
    return { stem, transformation: type.type, ming: ming.sourceNormalizedStarId, nanbei: nanbei.sourceNormalizedStarId, verdict: ming.comparable && nanbei.comparable ? (same(ming.sourceNormalizedStarId, nanbei.sourceNormalizedStarId) ? 'exact_match' : 'substantive_rule_divergence_proven') : 'source_rule_not_located', sourceRefs: [...ming.sourceRefs, ...nanbei.sourceRefs] }
  }))
  return { schemaVersion: SCHEMA, rows, summary: { rowCount: rows.length, sourceByEdition: Object.fromEntries(Object.keys(PDF_SOURCES).map(key => [PDF_SOURCES[key].id, summaryFor(PDF_SOURCES[key].id)])), productionOccurrenceCount: productionRows.length, exactNormalizedMatchCount: rows.filter(row => row.normalizedMatch === true).length, exactRawMatchCount: rows.filter(row => row.rawMatch === true).length, blockedCount: rows.filter(row => row.verdict === 'source_rule_not_located').length, mismatchCount: rows.filter(row => row.verdict === 'substantive_rule_divergence_proven').length }, editionVerdicts, crossEdition, minimumCounterexamples: [{ kind: 'source_blocker', edition: 'ming_nanyangtang', stem: '乙', transformation: 'hua_lu', sourceRef: 'ming-full-scan-four-transformations-not-located', note: 'first unlocated source cell; production value is retained but cannot be called a source match' }], sourceConflict: { verdict: 'no_substantive_source_conflict_proven', note: 'Ming 甲 direct example agrees with Nanbei 甲; Ming 乙–癸 cells remain unlocated, so absence is not a contradiction.' } }
}

function invariants(rows, productionRows) {
  const evaluate = (label, values, completeOnly) => {
    const complete = completeOnly ? values.filter(row => row.normalizedStarId !== null) : values
    const byStem = Object.fromEntries(STEMS.map(stem => [stem, complete.filter(row => row.stem === stem)]))
    const duplicateWithinStem = Object.entries(byStem).flatMap(([stem, stemRows]) => {
      const counts = Object.fromEntries(stemRows.map(row => [row.normalizedStarId, 0]))
      stemRows.forEach(row => { counts[row.normalizedStarId] += 1 })
      return Object.entries(counts).filter(([, count]) => count > 1).map(([normalizedStarId, count]) => ({ stem, normalizedStarId, count }))
    })
    const distribution = Object.fromEntries(Object.keys(CANONICAL_LABELS).map(id => [id, complete.filter(row => row.normalizedStarId === id).length]).filter(([, count]) => count > 0))
    return { label, totalRows: values.length, evaluatedRows: complete.length, evaluatedStemCount: new Set(complete.map(row => row.stem)).size, duplicateWithinStem, targetDistribution: distribution, duplicateWithinStemCount: duplicateWithinStem.length, status: complete.length === values.length ? 'complete' : 'partial_blocked' }
  }
  return { schemaVersion: SCHEMA, noTraditionalInvariantAssumed: true, editionInvariants: { ming_nanyangtang: evaluate('ming_nanyangtang', rows.filter(row => row.edition === 'ming_nanyangtang'), true), nanbei_shanren: evaluate('nanbei_shanren', rows.filter(row => row.edition === 'nanbei_shanren'), true) }, production: evaluate('production', productionRows, false), interpretation: 'same-stem duplicate and cross-stem target multiplicity are measured only; no external normative rule is injected' }
}

function validation(sourceRows, productionRows, comparisonValue) {
  return {
    schemaVersion: SCHEMA,
    sourceCoverage: { requiredSourceOccurrences: 80, actualSourceOccurrences: sourceRows.length, byEdition: { ming_nanyangtang: 40, nanbei_shanren: 40 }, allSourceCellsPreserved: sourceRows.length === 80 },
    stemOrder: { required: STEMS, ming: STEMS, nanbei: STEMS, production: STEMS, result: 'proved_by_artifact_axis_and_rows' },
    columnOrder: {
      nanbei: { visualLeftToRight: ['化忌', '化科', '化權', '化祿', '年干'], sourceReadRightToLeft: ['年干', '化祿', '化權', '化科', '化忌'], normalizedComparisonOrder: TYPES.map(item => item.type), sourceRef: ref('nanbei-p17-printed-42-four-transformations-table'), result: 'proved' },
      ming: { titleRef: ref('ming-p151-four-transformations-title'), sentenceRef: ref('ming-p152-甲-four-transformations-example'), observedSentenceOrder: ['化祿', '化權', '化科', '化忌'], scope: '甲_example_only', result: 'not_proven_for_乙_to_癸' },
    },
    aliases: { explicitAliasCount: Object.keys(ALIAS_TO_CANONICAL).length, allProductionTargetsCovered: productionRows.every(row => Boolean(ALIAS_TO_CANONICAL[row.rawTargetLabel])), noPostHocAliasAdded: true, rawGlyphsPreserved: sourceRows.filter(row => row.rawTarget !== null).every(row => row.rawTarget === CANONICAL_LABELS[row.normalizedStarId]) },
    invariants: invariants(sourceRows, productionRows),
    finiteDivergenceReview: ['row_or_column_reading_order', 'stem_index_offset_or_order', 'transformation_column_permutation', 'source_abbreviation_variant_alias', 'transcription_defect', 'actual_edition_transmission_difference'].map(axis => ({ axis, reviewed: true, result: axis === 'transcription_defect' ? 'predecessor_locator_correction_preserved_as_successor; no source cell overwritten' : axis === 'actual_edition_transmission_difference' ? 'not_proven_due Ming coverage blocker' : axis === 'source_abbreviation_variant_alias' ? 'explicit_alias_table_only; no row-specific alias' : axis === 'transformation_column_permutation' ? 'Nanbei order proved; Ming 甲 sentence order agrees' : axis === 'stem_index_offset_or_order' ? 'all rows retained in explicit 甲乙丙丁戊己庚辛壬癸 order' : 'Nanbei table and Ming 甲 sentence read in source order' })),
    comparisonVerdictDistribution: Object.fromEntries([...new Set(comparisonValue.rows.map(row => row.verdict))].map(verdict => [verdict, comparisonValue.rows.filter(row => row.verdict === verdict).length])),
  }
}

function dependencyGraph(sourceRows, productionRows) {
  const ids = [...new Set(productionRows.map(row => row.normalizedStarId))].sort()
  const nodes = ids.map(id => ({ id, canonicalLabel: CANONICAL_LABELS[id], identityClass: MAJOR_IDS.has(id) ? '14_major_star' : AUXILIARY_IDS.has(id) ? 'auxiliary_star' : 'canonical_star_unclassified', identityStatus: 'blocked_propagated', sourceRefs: [{ artifact: MAJOR_IDS.has(id) ? 'artifacts/ziwei-twelve-major-star-placement-evidence-v0/complete.json' : 'artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/complete.json', claimStatus: 'predecessor_identity_not_promoted' }] }))
  const edges = productionRows.map(row => ({ from: `transformation:${row.stem}:${row.transformation}`, to: row.normalizedStarId, relation: 'assigns_transformation_to_star', stem: row.stem, transformation: row.transformation, sourceRefs: sourceRows.filter(item => item.stem === row.stem && item.transformation === row.transformation).map(item => item.sourceRefs).flat(), productionRef: row.callPath }))
  return { schemaVersion: SCHEMA, nodes, edges, dependencyBoundary: { sourceRefsRetained: true, predecessorIdentityBlockedPropagated: true, semanticStarIdentityPromoted: false, palacePlacementNotUsed: true, calculationChanged: false } }
}

function inventory(sourceIdentity, exploration) {
  return { schemaVersion: SCHEMA, basisHead: BASIS_HEAD, sourceIdentity, exploration, locatorCount: LOCATORS.length, locators: LOCATORS.map(item => ({ ...item })), sourcePdfStoredInGit: false, renderBytesStoredInRepository: false }
}

function stableFileHashes(files) {
  return Object.fromEntries(Object.entries(files).map(([name, value]) => {
    const bytes = Buffer.from(canonicalIdentityJson(value))
    return [`${name}.json`, { path: `${ARTIFACT_DIR}/${name}.json`, byteLength: bytes.length, byteSha256: sha256(bytes) }]
  }))
}

function conclusion(complete, comparisonValue, normalizedValue) {
  const ming = normalizedValue.sourceTables.ming_nanyangtang
  const nanbei = normalizedValue.sourceTables.nanbei_shanren
  const row = table => table.map(item => `| ${item.stem} | ${item.assignments.map(a => a.rawTarget ?? '—').join(' | ')} |`).join('\n')
  return [
    '# Ziwei 四化 source evidence v0',
    '',
    `- verdict: ${complete.verdict}`,
    `- basis HEAD: ${complete.basisHead}`,
    `- source occurrences: ${comparisonValue.summary.rowCount} comparisons over 80 source cells (40 per edition)`,
    `- normalized matches: ${comparisonValue.summary.exactNormalizedMatchCount}; raw matches: ${comparisonValue.summary.exactRawMatchCount}; blocked: ${comparisonValue.summary.blockedCount}; substantive mismatches: ${comparisonValue.summary.mismatchCount}`,
    '',
    '## Source identity',
    '',
    'Both PDFs were re-hashed from their original paths, confirmed unencrypted, and confirmed at 528 and 219 pages. PDF bytes and temporary renders remain outside Git. OCR is locator-only and is not canonical evidence; canonical strings below came from direct high-resolution plate reading.',
    '',
    '## Raw 10×4 transcription',
    '',
    '### 明代南阳堂刊本',
    '',
    'The p151 title and p152 甲 example are directly readable. The remaining 36 cells are retained as explicit source_rule_not_located nulls; no production value is copied into them.',
    '',
    '| 年干 | 化祿 | 化權 | 化科 | 化忌 |',
    '|---|---|---|---|---|',
    row(ming),
    '',
    '### 南北山人本',
    '',
    'PDF p17, printed folio 四十二, right scanned leaf; the source table proves the printed column order 年干 → 化祿 → 化權 → 化科 → 化忌.',
    '',
    '| 年干 | 化祿 | 化權 | 化科 | 化忌 |',
    '|---|---|---|---|---|',
    row(nanbei),
    '',
    '## Determination',
    '',
    'Nanbei is an exact normalized fit for all 40 cells. Ming 甲 is an exact normalized fit for its four directly readable cells; Ming 乙–癸 remain blocked. Therefore no substantive cross-edition divergence is proven, and neither edition is selected as a winner. Production is unchanged. Existing predecessor artifacts remain intact; this artifact is a correction successor for their incomplete four-transformation coverage and stale locator boundaries.',
    '',
    '## Structural boundary',
    '',
    'Within each fully observed Nanbei stem and production row, the four transformation targets are distinct. Cross-stem target multiplicity is reported as an observed distribution, not treated as a normative expectation. Target-star identity remains blocked where predecessor 14-major/auxiliary evidence is blocked; no stable claim, readiness, grounding, activation, or source promotion is created.',
    '',
    '## Production defect boundary',
    '',
    'No production defect was fixed. The minimum source blocker is Ming 乙 × 化祿: production has a value, but the source cell is unlocated and is not called a match.',
    '',
  ].join('\n')
}

export function buildArtifact() {
  const actualHead = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()
  const sourceIdentity = Object.fromEntries(Object.values(PDF_SOURCES).map(source => [source.id, pdfIdentity(source)]))
  const exploration = { method: 'bundled Poppler pdftoppm low-resolution full-page render', renderDpi: 24, imageFormat: 'jpeg', quality: 40, pageCoverage: { ming_nanyangtang: 528, nanbei_shanren: 219 }, fullPageCoverageVerified: true, renderedOutsideRepository: true, temporaryRenderRoot: '/private/tmp (random run directory, not stored)', ocr: { allowed: true, usedForCanonicalDecision: false, role: 'exploration_only_not_canonical' } }
  const sourceRows = sourceOccurrences()
  const production = productionTrace()
  const productionRows = production.rows
  const comparisonValue = compare(sourceRows, productionRows)
  const normalizedValue = normalizedRules(sourceRows, productionRows)
  const validationValue = validation(sourceRows, productionRows, comparisonValue)
  const dependencyValue = dependencyGraph(sourceRows, productionRows)
  const inventoryValue = inventory(sourceIdentity, exploration)
  const transcriptionValue = { schemaVersion: SCHEMA, ocrStatus: 'exploration_only_not_canonical', canonicalDecisionSource: 'direct_high_resolution_plate_reading', locators: LOCATORS, rawSourceRows: sourceRows, predecessorArtifacts: ['artifacts/ziwei-traditional-source-comparison-v0/complete.json', 'artifacts/ziwei-traditional-source-comparison-v0/transcription.json'], correctionSuccessor: { predecessorOverwritten: false, corrections: ['Nanbei four-transformations table moved from predecessor p16 context-only locator to directly read p17 printed 四十二 table locator', 'Ming p151 title and p152 甲 example split into distinct direct locators', 'Ming 乙–癸 are explicit null blockers rather than inferred values'] } }
  const occurrencesValue = { schemaVersion: SCHEMA, sourceOccurrences: sourceRows, productionOccurrences: productionRows, counts: { source: sourceRows.length, sourceByEdition: { ming_nanyangtang: sourceRows.filter(row => row.edition === 'ming_nanyangtang').length, nanbei_shanren: sourceRows.filter(row => row.edition === 'nanbei_shanren').length }, production: productionRows.length } }
  const files = { inventory: inventoryValue, transcription: transcriptionValue, 'normalized-rules': normalizedValue, 'production-trace': production, occurrences: occurrencesValue, comparison: comparisonValue, validation: validationValue, 'dependency-graph': dependencyValue }
  const completePayload = {
    schemaVersion: SCHEMA,
    basisHead: BASIS_HEAD,
    verdict: comparisonValue.summary.blockedCount > 0 ? 'partial_ziwei_four_transformations_evidence_with_explicit_blockers' : 'complete_ziwei_four_transformations_evidence_without_promotion',
    artifactFiles: { ...Object.fromEntries(Object.keys(files).map(name => [name, `${ARTIFACT_DIR}/${name}.json`])), complete: `${ARTIFACT_DIR}/complete.json`, conclusion: `${ARTIFACT_DIR}/conclusion.md` },
    artifactHashes: stableFileHashes(files),
    sourceIdentity,
    sourceOccurrenceSummary: occurrencesValue.counts,
    comparisonSummary: comparisonValue.summary,
    classificationValues: ['exact_match', 'equivalent_representation_proven', 'substantive_rule_divergence_proven', 'transcription_defect_resolved', 'blocked_source_legibility', 'source_rule_not_located', 'implementation_only'],
    observedHeadPolicy: { observedHead: 'stored under artifactIdentity.observedHead as diagnostic only', currentHeadEqualityGate: false, canonicalFreshness: 'artifact-identity-v1 baseHead/input/payload validation' },
    boundaries: { stableClaimCount: 0, readiness: 'not_safe_to_start', grounding: 'blocked', activation: 'experimental', sourcePromotion: false, semanticIdentityPromotion: false, productionEngineModified: false, publicContractModified: false, readinessChanged: false, groundingChanged: false, activationChanged: false, predecessorOverwritten: false, productionDefectsFixed: false },
    predecessorArtifacts: transcriptionValue.predecessorArtifacts,
    generatedBy: MATERIALIZER_PATH,
  }
  const identity = buildArtifactIdentity({ root: ROOT, artifactId: SCHEMA, materializerPath: MATERIALIZER_PATH, materializerVersion: MATERIALIZER_VERSION, baseHead: BASIS_HEAD, inputs: ['src/artifactIdentity.js', 'src/ziwei/transformationRules.js', 'src/ziwei/transformationResolver.js', 'src/interpretationPrep/threeSystemPrepPipeline.js', 'artifacts/ziwei-traditional-source-comparison-v0/complete.json', 'artifacts/ziwei-traditional-source-comparison-v0/transcription.json', 'artifacts/ziwei-twelve-major-star-placement-evidence-v0/complete.json', 'artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/complete.json'] })
  identity.observedHead = actualHead
  const artifact = attachArtifactIdentity(completePayload, identity)
  return { artifact, files, conclusion: conclusion(artifact, comparisonValue, normalizedValue) }
}

async function writeJson(path, value) {
  await writeFile(resolve(ROOT, path), canonicalIdentityJson(value))
}

export async function materializeToDisk() {
  const { artifact, files, conclusion: conclusionText } = buildArtifact()
  await mkdir(resolve(ROOT, ARTIFACT_DIR), { recursive: true })
  for (const [name, value] of Object.entries(files)) await writeJson(`${ARTIFACT_DIR}/${name}.json`, value)
  await writeJson(`${ARTIFACT_DIR}/complete.json`, artifact)
  await writeFile(resolve(ROOT, `${ARTIFACT_DIR}/conclusion.md`), conclusionText)
  const outputs = [...Object.keys(files).map(name => `${ARTIFACT_DIR}/${name}.json`), `${ARTIFACT_DIR}/complete.json`, `${ARTIFACT_DIR}/conclusion.md`]
  for (const path of outputs) {
    const bytes = await readFile(resolve(ROOT, path))
    await writeJson(`${path}.integrity.json`, { schemaVersion: 'artifact-integrity-sidecar-v1', path, byteSha256: sha256(bytes), byteLength: bytes.length, source: 'actual_output_bytes' })
  }
  return { artifact, outputs }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await materializeToDisk()
  console.log(JSON.stringify({ schema: SCHEMA, verdict: result.artifact.verdict, sourceOccurrences: result.artifact.sourceOccurrenceSummary.source, productionOccurrences: result.artifact.sourceOccurrenceSummary.production, outputCount: result.outputs.length }, null, 2))
}
