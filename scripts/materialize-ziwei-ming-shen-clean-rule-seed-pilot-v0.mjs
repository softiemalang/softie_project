import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'
import { enumerateSourceInputs, SOURCE_RULE_SCHEMA, TRADITIONAL_BRANCH_ORDER } from '../src/ziwei/mingShenCleanRuleSeedPilot.js'
import { resolveZiweiChart } from '../src/ziwei/ziweiResolver.js'

export const SCHEMA = 'ziwei-ming-shen-clean-rule-seed-pilot-v0'
export const VERDICT = 'ziwei_ming_shen_clean_rule_seed_reconciled'
export const MATERIALIZER_VERSION = '0.1.0'
export const BASIS_HEAD = 'c949669201c2b4c11de4dfdec9eb739cdba6ce38'
export const SOURCE_PDF = '/Users/softie/Downloads/命-南北山人_紫微斗数全书.pdf'
export const SOURCE_PDF_SHA256 = '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])])) : value
export const canonicalJson = value => `${JSON.stringify(stable(value), null, 2)}\n`

const TRANSCRIPTION = {
  transcriptionId: 'ziwei-ming-shen-p25-rule-transcription-v0',
  sourcePdfSha256: SOURCE_PDF_SHA256,
  pdfPage: 8,
  printedPage: '二十五',
  section: '九、定命、身二宮',
  locator: 'PDF page 8, left printed page 二十五, section heading 九、定命、身二宮; rule text columns under 口訣如左',
  glyphPreservingText: '寅正巳順數生月逢。生月起子兩頭通。逆至生時為命宮。順到生時即安身。',
  ruleBearingExplanation: '解：從寅宮起正月，順數到生月停止；再於數至的生月起「子」時，逆數到問命者的生時停止為命宮，順數到生時即安身。',
  uncertainty: [
    { field: 'glyphPreservingText', status: 'human_readable_but_single_review', note: 'Vertical scan glyphs were manually read from the original PDF image; second reviewer confirmation remains pending.' },
    { field: 'ruleBearingExplanation', status: 'scope_minimized_paraphrase_not_canonical', note: 'Only the direction/start/stop mechanics needed by the normalized rule are retained; this is not presented as a full canonical transcription.' },
    { field: 'printedPage', status: 'page_label_observed', note: 'The left page margin visibly shows 二十五; no modern edition page identity is inferred.' },
  ],
  reviewerStatus: 'single_human_review_complete_second_review_pending',
  ocrStatus: 'exploration_only_not_canonical',
}

const NORMALIZED_RULE = {
  schemaVersion: SOURCE_RULE_SCHEMA,
  sourceTranscriptionId: TRANSCRIPTION.transcriptionId,
  input: { lunarMonth: 'integer 1..12', hourBranch: TRADITIONAL_BRANCH_ORDER },
  branchOrder: { traditional: TRADITIONAL_BRANCH_ORDER, indexConvention: '子=0, 丑=1, 寅=2, ... 亥=11', modulo: 12 },
  monthPlacement: { startBranch: '寅', firstLunarMonth: 1, direction: 'clockwise/traditional forward (+1)', formula: 'monthPalaceIndex=(index(寅)+lunarMonth-1) mod 12' },
  hourPlacement: { startLabel: '子', startAtMonthPalace: true, directionForMing: 'reverse (-1)', directionForShen: 'forward (+1)', hourIndex: 'index(hourBranch) with 子=0' },
  output: { 命宮: 'life', 身宮: 'shen', branch: 'traditional branch glyph; engine mapping is explicit above' },
  formulas: { mingGong: '(monthPalaceIndex-hourIndex) mod 12', shenGong: '(monthPalaceIndex+hourIndex) mod 12' },
  exclusions: ['leap-month resolution', 'solar/lunar conversion', 'calendar/time preprocessing', 'palace interpretation', 'five-element bureau', 'star placement'],
}

function engineResult(lunarMonth, hourBranch) {
  const chart = resolveZiweiChart({ birthYearStem: '甲', lunarMonth, hourBranch })
  return { mingGong: chart.chart.mingGong, shenGong: chart.chart.shenGong }
}

export async function buildPilotArtifact() {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const pdf = await readFile(SOURCE_PDF)
  const actualPdfSha256 = sha256(pdf)
  if (actualPdfSha256 !== SOURCE_PDF_SHA256) throw new Error(`source_pdf_sha256_mismatch:${actualPdfSha256}`)
  const sourceRows = enumerateSourceInputs()
  const comparisonRows = sourceRows.map(source => {
    const engine = engineResult(source.lunarMonth, source.hourBranch)
    const row = { rowId: source.rowId, orderingKey: source.orderingKey, input: { lunarMonth: source.lunarMonth, hourBranch: source.hourBranch }, sourceDerived: { mingGong: source.mingGong, shenGong: source.shenGong }, productionEngine: { mingGong: engine.mingGong, shenGong: engine.shenGong } }
    row.match = row.sourceDerived.mingGong.branch === row.productionEngine.mingGong.branch && row.sourceDerived.shenGong.branch === row.productionEngine.shenGong.branch
    row.divergence = row.match ? null : { fields: ['mingGong', 'shenGong'].filter(field => row.sourceDerived[field].branch !== row.productionEngine[field].branch), possibleCauses: ['transcription_uncertainty', 'direction_or_index_convention', 'edition_rule_variant', 'production_engine_implementation', 'comparison_configuration'] }
    return row
  })
  const mismatches = comparisonRows.filter(row => !row.match)
  const firstDivergence = mismatches[0] || null
  const verdict = mismatches.length === 0 ? VERDICT : 'ziwei_ming_shen_clean_rule_seed_divergent'
  const transcriptionArtifact = { schemaVersion: `${SCHEMA}-transcription-v0`, ...TRANSCRIPTION }
  const normalizedRuleArtifact = NORMALIZED_RULE
  const comparisonArtifact = { schemaVersion: `${SCHEMA}-comparison-v0`, inputCount: comparisonRows.length, expectedInputCount: 144, ordering: 'lunarMonth ascending 1..12, then TRADITIONAL_BRANCH_ORDER', rows: comparisonRows, matchCount: comparisonRows.filter(row => row.match).length, mismatchCount: mismatches.length, firstDivergence, mismatchDistribution: { byField: Object.fromEntries(['mingGong', 'shenGong'].map(field => [field, mismatches.filter(row => row.divergence?.fields.includes(field)).length])) } }
  const artifact = {
    schemaVersion: SCHEMA, verdictToken: verdict, basisHead: BASIS_HEAD,
    sourceWitness: { witnessVerdict: 'source_witness_admissible_with_limits', pdfPath: SOURCE_PDF, pdfPageCount: 219, pdfSha256: actualPdfSha256, gitInclusion: 'forbidden', sourceArtifact: 'artifacts/ziwei-archive-scan-source-witness-admission-v0/complete.json', rulePageRange: { pdfPages: [8], printedPages: ['二十五'], section: TRANSCRIPTION.section, auxiliaryTable: { pdfPages: [10], printedPages: ['二十九'], purpose: 'visual cross-check only' } } },
    transcription: TRANSCRIPTION, normalizedRule: NORMALIZED_RULE,
    artifactFiles: { transcription: `artifacts/${SCHEMA}/transcription.json`, normalizedRule: `artifacts/${SCHEMA}/normalized-rule.json`, comparison: `artifacts/${SCHEMA}/comparison.json` },
    comparison: { inputCount: comparisonRows.length, expectedInputCount: 144, ordering: 'lunarMonth ascending 1..12, then TRADITIONAL_BRANCH_ORDER', rows: comparisonRows, matchCount: comparisonRows.filter(row => row.match).length, mismatchCount: mismatches.length, firstDivergence, mismatchDistribution: { byField: Object.fromEntries(['mingGong', 'shenGong'].map(field => [field, mismatches.filter(row => row.divergence?.fields.includes(field)).length])) } },
    artifactHashes: { transcriptionSha256: sha256(Buffer.from(canonicalJson(transcriptionArtifact))), normalizedRuleSha256: sha256(Buffer.from(canonicalJson(normalizedRuleArtifact))), comparisonSha256: sha256(Buffer.from(canonicalJson(comparisonArtifact))) },
    causePreservation: ['transcription_uncertainty', 'direction_or_index_convention', 'edition_rule_variant', 'production_engine_implementation', 'comparison_configuration'],
    independence: { sourceEvaluatorModule: 'src/ziwei/mingShenCleanRuleSeedPilot.js', productionAdapter: 'src/ziwei/ziweiResolver.js', sourceEvaluatorImportsProductionEngine: false, comparisonBoundary: 'core lunarMonth x hourBranch placement; birthYearStem=甲 is adapter-only because production resolver requires it and placement does not use it' },
    boundaries: { stableClaimCount: 0, readiness: 'not_safe_to_start', grounding: 'blocked', activation: 'experimental', interpretationGenerated: false, engineModified: false, claimPromoted: false, pdfStoredInGit: false },
    negativeContract: { fixture: 'test/fixtures/ziwei/ming-shen-clean-rule-seed-pilot-negative-v0.json', detects: ['PDF hash/page/sourceRef tampering', 'OCR canonical promotion', 'uncertainty auto-correction', 'transcription/normalization mixing', 'silent direction/index change', 'non-exhaustive 144 claim', 'mismatch concealment/equivalence forcing', 'production evaluator reuse', 'interpretive prose/commentary ingestion', 'claim/readiness/grounding/activation promotion', 'PDF Git inclusion', 'nondeterministic row ID/order/hash'] },
    materializer: `scripts/materialize-${SCHEMA}.mjs`, checker: `scripts/check-${SCHEMA}.mjs`, observedHead: execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), inputByteEvidence: [{ path: 'src/ziwei/mingShenCleanRuleSeedPilot.js', sha256: sha256(await readFile(resolve(root, 'src/ziwei/mingShenCleanRuleSeedPilot.js'))) }, { path: 'src/ziwei/ziweiResolver.js', sha256: sha256(await readFile(resolve(root, 'src/ziwei/ziweiResolver.js'))) }], deterministicContract: { generatedAt: 'forbidden', rowId: 'derived from lunarMonth and ordered branch glyph', sorting: 'fixed numeric month then branch order', hashes: 'actual bytes only' },
  }
  return attachArtifactIdentity(artifact, buildArtifactIdentity({ root, artifactId: SCHEMA, materializerPath: artifact.materializer, materializerVersion: MATERIALIZER_VERSION, baseHead: BASIS_HEAD, inputs: ['src/ziwei/mingShenCleanRuleSeedPilot.js', 'src/ziwei/ziweiResolver.js'] }))
}

if (process.argv[1] === new URL(import.meta.url).pathname) { const target = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`); const artifact = await buildPilotArtifact(); const body = canonicalJson(artifact); const comparisonArtifact = { schemaVersion: `${SCHEMA}-comparison-v0`, inputCount: artifact.comparison.inputCount, expectedInputCount: artifact.comparison.expectedInputCount, ordering: artifact.comparison.ordering, rows: artifact.comparison.rows, matchCount: artifact.comparison.matchCount, mismatchCount: artifact.comparison.mismatchCount, firstDivergence: artifact.comparison.firstDivergence, mismatchDistribution: artifact.comparison.mismatchDistribution }; await mkdir(dirname(target), { recursive: true }); await writeFile(target, body); await writeFile(resolve(dirname(target), 'transcription.json'), canonicalJson({ schemaVersion: `${SCHEMA}-transcription-v0`, ...artifact.transcription })); await writeFile(resolve(dirname(target), 'normalized-rule.json'), canonicalJson(artifact.normalizedRule)); await writeFile(resolve(dirname(target), 'comparison.json'), canonicalJson(comparisonArtifact)); await writeFile(`${target}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(Buffer.from(body)), artifactByteSha256Scope: 'complete.json UTF-8 bytes including final LF' }, null, 2)}\n`); console.log(JSON.stringify({ target, verdict: artifact.verdictToken, matchCount: artifact.comparison.matchCount, mismatchCount: artifact.comparison.mismatchCount, artifactByteSha256: sha256(Buffer.from(body)) }, null, 2)) }
