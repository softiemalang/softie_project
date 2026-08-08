import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'
import { BRANCHES, BUREAU_ENUMS, SOURCE_NAYIN_PAIRS, SOURCE_RULE_SCHEMA, STEMS, enumerateSourceInputs } from '../src/ziwei/fiveElementBureauCleanRuleSeedPilot.js'
import { resolveZiweiChart } from '../src/ziwei/ziweiResolver.js'
import { getPdfSourceMetadata, resolvePdfSourcePathSync } from './lib/pdf-source-resolver.mjs'

export const SCHEMA = 'ziwei-five-element-bureau-clean-rule-seed-pilot-v0'
export const MATERIALIZER_VERSION = '0.1.0'
export const BASIS_HEAD = 'd79ce08be2df491d19216308e44a8feee3f22291'
export const SOURCE_PDF = getPdfSourceMetadata('nanbei_quanbao_219p').historicalMetadataPath
export const SOURCE_PDF_ACCESS = resolvePdfSourcePathSync('nanbei_quanbao_219p')
export const SOURCE_PDF_SHA256 = '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])])) : value
export const canonicalJson = value => `${JSON.stringify(stable(value), null, 2)}\n`

const TRANSCRIPTION = {
  transcriptionId: 'ziwei-five-element-bureau-p9-p10-p11-p12-transcription-v0', sourcePdfSha256: SOURCE_PDF_SHA256,
  sourceRefs: [
    { pdfPage: 9, printedPage: '二十七', section: '十、定五行局', locator: 'left scanned leaf; rule prose and 六十花甲納音 columns', glyphPreservingText: '水二局、木三局、金四局、土五局、火六局; 將命宮的天干地支按照左例歌訣變成六十花甲五行納音', scope: 'rule-bearing text' },
    { pdfPage: 10, printedPage: '二十八', section: '十二、定五行局', locator: 'right scanned leaf; 定五行局簡索表列左; 命宮天干地支 table', glyphPreservingText: '定五行局簡索表列左', tableStructure: { axisLabel: '命宮天干地支', columnHeaders: ['甲乙', '丙丁', '戊己', '庚辛', '壬癸'], rowHeaders: ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'], direction: 'drawn rows and columns retained; no transpose inferred' }, scope: 'auxiliary lookup-table structure; cell values are independently represented by the p9 Nayin transcription' },
    { pdfPage: 11, printedPage: '三十一', section: '起紫微五訣', locator: 'left scanned leaf; 水二局、木三局、金四局、土五局、火六局 rows', glyphPreservingText: '水二局中初一丑、木三局中初一辰、金四局中初一辰、土五局中初一午、火六局中初一酉', scope: 'auxiliary order cross-check only' },
    { pdfPage: 12, printedPage: '三十三', section: '起紫微簡索表', locator: 'left scanned leaf; 五行局 columns and 生日起例 table', glyphPreservingText: '水二局、木三局、金四局、土五局、火六局', scope: 'auxiliary table cross-check only' },
  ],
  nayinPairs: SOURCE_NAYIN_PAIRS.map(([ganzhiPair, nayinName]) => ({ ganzhiPair, nayinName })),
  uncertainty: [
    { field: 'nayinPairs', status: 'glyph_reading_pending_second_review', note: 'Traditional glyphs are retained as read from the rendered witness; no OCR output is canonical.' },
    { field: 'tableDirection', status: 'drawn_layout_preserved_not_inferred', note: 'The page 10 table is recorded as a lookup structure; no transpose or silent row/column completion is applied.' },
    { field: 'printedPage', status: 'page_label_observed', note: 'Printed folio labels are preserved per scanned leaf; no modern edition identity is inferred.' },
  ],
  reviewerStatus: 'single_human_review_complete_second_review_pending', ocrStatus: 'exploration_only_not_canonical', modernCommentaryIngested: false,
}

const NORMALIZED_RULE = {
  schemaVersion: SOURCE_RULE_SCHEMA, sourceTranscriptionId: TRANSCRIPTION.transcriptionId,
  inputs: { birthYearStem: STEMS, lunarMonth: 'integer 1..12', hourBranch: BRANCHES },
  validDomain: { cardinality: 1440, invalid: ['unknown stem/branch', 'month outside 1..12', 'non-integer month'], leapMonthResolution: 'excluded; lunar month is already resolved' },
  steps: [
    'place lunar month from 寅 as month 1, forward by lunarMonth-1',
    'from that month palace, count hourBranch backward to 命宮',
    'from 寅, advance the year-stem-derived 寅宮 stem by the 命宮 branch offset',
    'combine 命宮 stem and branch into a 六十花甲 key and lookup transcribed 納音',
    'map 納音 element explicitly to 水二局/木三局/金四局/土五局/火六局 and enum',
  ],
  formulas: { monthPalaceIndex: '(index(寅)+lunarMonth-1) mod 12', mingGongIndex: '(monthPalaceIndex-index(hourBranch)) mod 12', yinStem: '甲己丙寅頭;乙庚戊寅頭;丙辛庚寅頭;丁壬壬寅頭;戊癸甲寅頭', mingGongStem: '(index(yinStem)+index(mingGongBranch)-index(寅)) mod 10' },
  explicitMappings: { 水: { traditionalName: '水二局', number: 2, enum: BUREAU_ENUMS.水二局 }, 木: { traditionalName: '木三局', number: 3, enum: BUREAU_ENUMS.木三局 }, 金: { traditionalName: '金四局', number: 4, enum: BUREAU_ENUMS.金四局 }, 土: { traditionalName: '土五局', number: 5, enum: BUREAU_ENUMS.土五局 }, 火: { traditionalName: '火六局', number: 6, enum: BUREAU_ENUMS.火六局 } },
  normalizationBoundary: 'source glyphs and table layout remain separate from formulas, enums, and production-name normalization', exclusions: ['calendar conversion', 'leap-month resolution', 'interpretation', 'modern commentary', 'engine modification', 'claim promotion'],
}

const productionCanonical = bureau => bureau && ({ enum: ({ 수이국: 'water_2', 목삼국: 'wood_3', 금사국: 'metal_4', 토오국: 'earth_5', 화육국: 'fire_6' })[bureau.name], traditionalName: ({ 수이국: '水二局', 목삼국: '木三局', 금사국: '金四局', 토오국: '土五局', 화육국: '火六局' })[bureau.name], element: bureau.element === '수' ? '水' : bureau.element === '목' ? '木' : bureau.element === '금' ? '金' : bureau.element === '토' ? '土' : bureau.element === '화' ? '火' : null, number: bureau.number, raw: bureau })

export async function buildPilotArtifact() {
  const root = resolve(new URL('..', import.meta.url).pathname); const pdf = await readFile(SOURCE_PDF_ACCESS); const actualPdfSha256 = sha256(pdf)
  if (actualPdfSha256 !== SOURCE_PDF_SHA256) throw new Error(`source_pdf_sha256_mismatch:${actualPdfSha256}`)
  const sourceRows = enumerateSourceInputs(); const rows = sourceRows.map(source => { const production = resolveZiweiChart(source.input).chart.fiveElementsBureau; const p = productionCanonical(production); const sourceResult = source.output; const fields = ['enum', 'traditionalName', 'element', 'number']; const mismatchFields = fields.filter(field => sourceResult[field] !== p[field]); const row = { rowId: source.rowId, orderingKey: source.orderingKey, input: source.input, intermediate: source.intermediate, sourceDerived: sourceResult, productionEngine: p, match: mismatchFields.length === 0, divergence: mismatchFields.length ? { fields: mismatchFields, possibleCauses: ['transcription_or_table_direction', 'stem_branch_or_palace_boundary', 'nayin_or_mapping_interpretation', 'edition_rule_variant', 'production_engine_implementation', 'comparison_configuration'] } : null }; return row })
  const mismatches = rows.filter(row => !row.match); const comparison = { schemaVersion: `${SCHEMA}-comparison-v0`, inputCount: rows.length, expectedInputCount: 1440, distribution: Object.fromEntries(['water_2', 'wood_3', 'metal_4', 'earth_5', 'fire_6'].map(enumName => [enumName, rows.filter(row => row.sourceDerived.enum === enumName).length])), rows, matchCount: rows.filter(row => row.match).length, mismatchCount: mismatches.length, firstDivergence: mismatches[0] || null, mismatchDistribution: { byField: Object.fromEntries(['enum', 'traditionalName', 'element', 'number'].map(field => [field, mismatches.filter(row => row.divergence?.fields.includes(field)).length])) } }
  const transcription = { schemaVersion: `${SCHEMA}-transcription-v0`, ...TRANSCRIPTION }; const artifact = { schemaVersion: SCHEMA, verdictToken: mismatches.length ? 'ziwei_five_element_bureau_seed_divergent' : 'ziwei_five_element_bureau_seed_reconciled', basisHead: BASIS_HEAD, sourceWitness: { witnessVerdict: 'source_witness_admissible_with_limits', pdfPath: SOURCE_PDF, pdfPageCount: 219, pdfEncrypted: false, pdfSha256: actualPdfSha256, gitInclusion: 'forbidden', sourceArtifact: 'artifacts/ziwei-archive-scan-source-witness-admission-v0/complete.json', selectedRulePages: [9, 10], auxiliaryPages: [11, 12] }, transcription, normalizedRule: NORMALIZED_RULE, comparison, artifactFiles: { transcription: `artifacts/${SCHEMA}/transcription.json`, normalizedRule: `artifacts/${SCHEMA}/normalized-rule.json`, comparison: `artifacts/${SCHEMA}/comparison.json` }, artifactHashes: { transcriptionSha256: sha256(Buffer.from(canonicalJson(transcription))), normalizedRuleSha256: sha256(Buffer.from(canonicalJson(NORMALIZED_RULE))), comparisonSha256: sha256(Buffer.from(canonicalJson(comparison))) }, independence: { sourceEvaluatorModule: 'src/ziwei/fiveElementBureauCleanRuleSeedPilot.js', productionAdapter: 'src/ziwei/ziweiResolver.js', sourceEvaluatorImportsProductionEngine: false, sourceEvaluatorCopiesProductionTable: false, comparisonBoundary: 'birthYearStem x lunarMonth x hourBranch; production output is explicitly normalized at comparison boundary' }, causePreservation: ['transcription_or_table_direction', 'stem_branch_or_palace_boundary', 'nayin_or_mapping_interpretation', 'edition_rule_variant', 'production_engine_implementation', 'comparison_configuration'], boundaries: { stableClaimCount: 0, readiness: 'not_safe_to_start', grounding: 'blocked', activation: 'experimental', interpretationGenerated: false, engineModified: false, ruleContractModified: false, existingMingShenArtifactModified: false, pdfStoredInGit: false }, negativeContract: { fixture: 'test/fixtures/ziwei/five-element-bureau-clean-rule-seed-pilot-negative-v0.json', detects: ['PDF hash/page/sourceRef tampering', 'OCR promotion/uncertain glyph auto-fix', 'transcription-normalization mixing', 'table direction change', 'domain omission/impossible tuple', 'bureau mapping mutation', 'production evaluator reuse', 'mismatch concealment', 'modern commentary ingestion', 'existing artifact/rule/claim/readiness/activation promotion', 'PDF Git inclusion', 'nondeterministic ID/order/hash'] }, materializer: `scripts/materialize-${SCHEMA}.mjs`, checker: `scripts/check-${SCHEMA}.mjs`, observedHead: execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), deterministicContract: { generatedAt: 'forbidden', rowId: 'derived from ordered canonical input glyphs', sorting: 'fixed stem, month, branch order', hashes: 'actual UTF-8 bytes only' } }
  return attachArtifactIdentity(artifact, buildArtifactIdentity({ root, artifactId: SCHEMA, materializerPath: artifact.materializer, materializerVersion: MATERIALIZER_VERSION, baseHead: BASIS_HEAD, inputs: ['src/ziwei/fiveElementBureauCleanRuleSeedPilot.js', 'src/ziwei/ziweiResolver.js', 'src/ziwei/fiveElementResolver.js'] }))
}

if (process.argv[1] === new URL(import.meta.url).pathname) { const target = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`); const artifact = await buildPilotArtifact(); const body = canonicalJson(artifact); await mkdir(dirname(target), { recursive: true }); await writeFile(target, body); await writeFile(resolve(dirname(target), 'transcription.json'), canonicalJson(artifact.transcription)); await writeFile(resolve(dirname(target), 'normalized-rule.json'), canonicalJson(artifact.normalizedRule)); await writeFile(resolve(dirname(target), 'comparison.json'), canonicalJson(artifact.comparison)); await writeFile(`${target}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(Buffer.from(body)), artifactByteSha256Scope: 'complete.json UTF-8 bytes including final LF' }, null, 2)}\n`); console.log(JSON.stringify({ target, verdict: artifact.verdictToken, inputCount: artifact.comparison.inputCount, matchCount: artifact.comparison.matchCount, mismatchCount: artifact.comparison.mismatchCount, artifactByteSha256: sha256(Buffer.from(body)) }, null, 2)) }
