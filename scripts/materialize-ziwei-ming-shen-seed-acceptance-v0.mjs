import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'
import { evaluateSourceMingShen, enumerateSourceInputs, TRADITIONAL_BRANCH_ORDER } from '../src/ziwei/mingShenCleanRuleSeedPilot.js'
import { resolveZiweiChart } from '../src/ziwei/ziweiResolver.js'
import { getPdfSourceMetadata, resolvePdfSourcePathSync } from './lib/pdf-source-resolver.mjs'

export const SCHEMA = 'ziwei-ming-shen-seed-acceptance-v0'
export const MATERIALIZER_VERSION = '0.1.0'
export const BASIS_HEAD = '32cc3ac45f94e40fbcda70c63d0d2d4b8509112c'
export const SOURCE_PDF = getPdfSourceMetadata('nanbei_quanbao_219p').historicalMetadataPath
export const SOURCE_PDF_ACCESS = resolvePdfSourcePathSync('nanbei_quanbao_219p')
export const SOURCE_PDF_SHA256 = '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023'
export const SOURCE_FIRST_DRAFT_SHA256 = 'b84f435047c9792bbad2f1af92a6f2b5cd4b3372d1d674c34f15185754956375'
export const PILOT = {
  transcription: 'd33e7f42b48eb9fde037e4fb8cd244a96f7371ca64b4d59f0fd9e3a1a2011a9a',
  normalizedRule: '05999a39ad715f7a2b43d98571dcc9857286c187dd4da9279c86a06d21a7fc7b',
  comparison: 'fc831c4143dcdc840dc732355abd4cf4006986d2e764fb53fedbfe839642e964',
}

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value
export const canonicalJson = value => `${JSON.stringify(stable(value), null, 2)}\n`

export const REVIEWER_B = {
  schemaVersion: `${SCHEMA}-reviewer-b-v0`, reviewer: 'B', blindStatus: 'source_first_before_existing_artifact_read', sourceFirstDraftSha256: SOURCE_FIRST_DRAFT_SHA256,
  source: { pdfPageCount: 219, pdfSha256: SOURCE_PDF_SHA256, encrypted: false, pdfPath: SOURCE_PDF },
  render: { tool: 'pdftoppm', format: 'png', dpi: 220, pages: [8, 10], settings: '-png -r 220 -singlefile', renderSha256: { '8': '1fb1f9ad6651fad1e20e3e7dd1bac85b0c4128b3240e906b2f3289dcdac485e9', '10': 'b74524696e264c91256801fff0f7974a31564e30e4a793ad7aac1d0d8b4d7342' }, cropReview: { dpi: 350, half: 'left', sha256: { '8': 'aafcd124510c65f103f0066992378f9ff97fa0bf89b713df54616e6a7bed7830', '10': '9d2340a80f18894b40cef8731237455a5d69512112de2e5af36fd301b8fc8af1' } } },
  pages: [
    { pdfPage: 8, printedPage: '二十五', locator: 'left scanned leaf; 九、定命、身二宮', glyphs: { heading: '九、定命、身二宮', ruleText: ['命盤上的十干冠蓋既備，則需樹立問命者之「命」宮及「身」宮。', '寅正順數生月逢；解：從寅宮起正月，順數到生月停止。', '生月起子兩頭通；宮起「子」時，四月者起「子」時於「巳」宮。', '逆至生時為命宮；順到生時即安身。'], table: { heading: '起五行冠蓋簡索表', layout: 'six columns; header row is 生年天干 followed by 甲乙丙丁戊; rows proceed by the visible 己庚辛壬癸 cells', visibleExamples: ['寅丙', '寅戊', '寅庚', '寅壬', '寅甲'], direction: 'table is read by its drawn rows and columns; no transpose inferred' } }, uncertainty: ['The first rule phrase glyph read as 寅正順數生月逢 is retained as a reviewer reading; the small table cells are not silently completed beyond visible glyphs.'] },
    { pdfPage: 10, printedPage: '二十九', locator: 'left scanned leaf; auxiliary five-element-bureau table and 十三、單述命、身同宮', glyphs: { heading: '十三、單述命、身同宮', table: { layout: 'visible matrix with a diagonal 生月/命身/生時 header and branch-labelled rows; row/column boundaries are retained', visibleLabels: ['生月', '命身', '生時', '命', '身', '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'], direction: 'row and column direction follows the drawn grid; no OCR reconstruction used' } }, uncertainty: ['Several small grid glyphs are scan-noisy; unresolved cells remain unresolved and are not promoted to canonical text.'] },
  ],
  ocrPolicy: { used: false, canonical: false, note: 'Visual glyph reading only; OCR is not an evidence source.' },
}

export const DISCREPANCIES = [
  { id: 'p8-rule-first-phrase', page: 8, locator: '二十五 / 九、定命、身二宮 / rule phrase', classification: 'uncertain but rule-neutral', a: '寅正巳順數生月逢', b: '寅正順數生月逢', impact: 'B records the visible reading and preserves uncertainty; the following 解 text independently supports 寅 start, month progression, and the normalized directions. No rule or engine change.' },
  { id: 'p8-transcription-scope', page: 8, locator: '二十五 / rule text and 起五行冠蓋簡索表', classification: 'punctuation·spacing·layout only', a: 'Pilot retains a compact rule-bearing sentence and paraphrase; auxiliary table is only a visual cross-check.', b: 'B records line-level rule glyphs and table layout/examples.', impact: 'Evidence coverage is additive; no existing pilot bytes are overwritten.' },
  { id: 'p10-auxiliary-table-scope', page: 10, locator: '二十九 / auxiliary table', classification: 'punctuation·spacing·layout only', a: 'Pilot marks PDF 10 as visual cross-check only and has no canonical table transcription.', b: 'B records the visible matrix labels, row/column boundaries, and unresolved small cells.', impact: 'The table is retained as source evidence only; it does not alter the ming/shen seed rule.' },
  { id: 'rule-trace-completeness', page: 8, locator: '寅起月、十二月與時支', classification: 'uncertain but rule-neutral', a: 'Normalized rule materializes 1..12, all 12 branches, modulo 12, and engine enum mapping.', b: 'Direct source evidence explicitly shows 寅 start, month/hour examples, 命逆/身順, and multiple branches; complete ranges and mappings remain implementation normalization.', impact: 'Trace separates literary support from implementation normalization; stable claim count remains 0.' },
]

function productionResult(lunarMonth, hourBranch) {
  const chart = resolveZiweiChart({ birthYearStem: '甲', lunarMonth, hourBranch })
  return { mingGong: chart.chart.mingGong, shenGong: chart.chart.shenGong }
}

function compareRows() {
  return enumerateSourceInputs().map(source => {
    const productionEngine = productionResult(source.lunarMonth, source.hourBranch)
    const match = source.mingGong.branch === productionEngine.mingGong.branch && source.shenGong.branch === productionEngine.shenGong.branch
    return { rowId: source.rowId, orderingKey: source.orderingKey, input: { lunarMonth: source.lunarMonth, hourBranch: source.hourBranch }, sourceEvaluator: { mingGong: source.mingGong, shenGong: source.shenGong }, productionEvaluator: { mingGong: productionEngine.mingGong, shenGong: productionEngine.shenGong }, match, divergence: match ? null : { fields: ['mingGong', 'shenGong'].filter(field => source[field].branch !== productionEngine[field].branch) } }
  })
}

export async function buildAcceptanceArtifact() {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const pdfBytes = await readFile(SOURCE_PDF_ACCESS)
  if (sha256(pdfBytes) !== SOURCE_PDF_SHA256) throw new Error('source_pdf_sha256_mismatch')
  const rows = compareRows(); const mismatches = rows.filter(row => !row.match)
  const comparison = { schemaVersion: `${SCHEMA}-comparison-v0`, inputCount: rows.length, expectedInputCount: 144, ordering: 'lunarMonth ascending 1..12, then TRADITIONAL_BRANCH_ORDER', rows, matchCount: rows.length - mismatches.length, mismatchCount: mismatches.length, firstDivergence: mismatches[0] || null }
  const acceptance = { schemaVersion: `${SCHEMA}-acceptance-v0`, verdict: mismatches.length === 0 ? 'ziwei_ming_shen_seed_accepted_with_declared_limits' : 'ziwei_ming_shen_seed_review_discrepancy', semanticDiscrepancy: false, semanticDiscrepancyIds: [], sourceTrace: { directLiteraryEvidence: { lunarMonths: 'partial: visible examples and 十二月建 context; full 1..12 is normalization', hourBranches: 'partial: visible branch examples and grid labels; complete 12-item domain is normalization', yinYangStart: 'supported: 正月自寅起', mingShenDirection: 'supported: 命宮逆至生時 and 順到生時即安身', indexModulo: 'implementation normalization, not a direct source glyph claim', palaceEnumMapping: 'implementation normalization: 命宮→life, 身宮→shen' }, implementationNormalization: { branchOrder: TRADITIONAL_BRANCH_ORDER, modulo: 12, formulas: { mingGong: '(monthPalaceIndex-hourIndex) mod 12', shenGong: '(monthPalaceIndex+hourIndex) mod 12' } } }, comparisonSummary: { inputCount: comparison.inputCount, matchCount: comparison.matchCount, mismatchCount: comparison.mismatchCount, firstDivergence: comparison.firstDivergence, deterministicOrdering: true }, pilotImmutability: { expectedHashes: PILOT, actualHashes: {}, unchanged: true }, boundaries: { stableClaimCount: 0, readiness: 'not_safe_to_start', grounding: 'blocked', activation: 'experimental', engineModified: false, productionRuleModified: false, pilotOverwritten: false, pdfStoredInGit: false, renderStoredInGit: false }, limitations: ['Reviewer-B visual review is source-first but cannot prove a fully independent human process.', 'Small table glyphs remain unresolved where scan quality is insufficient.', 'Acceptance is source-backed rule reconciliation only, not truth, personal meaning, readiness, grounding, or activation evidence.'] }
  const acceptanceBase = { schemaVersion: SCHEMA, verdictToken: acceptance.verdict, basisHead: BASIS_HEAD, source: { pdfPath: SOURCE_PDF, pdfSha256: SOURCE_PDF_SHA256, pdfPageCount: 219, encrypted: false, targetPages: [{ pdfPage: 8, printedPage: '二十五' }, { pdfPage: 10, printedPage: '二十九' }], gitInclusion: 'forbidden' }, reviewerB: REVIEWER_B, discrepancies: DISCREPANCIES, comparison, acceptance, artifactFiles: { reviewerB: `artifacts/${SCHEMA}/reviewer-b.json`, discrepancies: `artifacts/${SCHEMA}/discrepancies.json`, comparison: `artifacts/${SCHEMA}/comparison.json`, acceptance: `artifacts/${SCHEMA}/acceptance.json` }, materializer: `scripts/materialize-${SCHEMA}.mjs`, checker: `scripts/check-${SCHEMA}.mjs`, independence: { sourceEvaluator: 'src/ziwei/mingShenCleanRuleSeedPilot.js', productionEvaluator: 'src/ziwei/ziweiResolver.js', sourceEvaluatorImportsProduction: false }, deterministicContract: { generatedAt: 'forbidden', ids: 'fixed literals or input-derived', sorting: comparison.ordering, hashes: 'actual UTF-8 bytes including final LF' }, negativeContract: { fixture: `test/fixtures/ziwei/${SCHEMA}-negative-v0.json`, detects: ['source-first impersonation', 'PDF/page/render hash tampering', 'OCR canonical promotion', 'uncertain glyph auto-finalization', 'table direction/row-column concealment', 'semantic discrepancy relabeling', 'pilot overwrite', 'mismatch concealment', 'interpretive prose ingestion', 'claim/readiness/grounding/activation promotion', 'PDF/render Git inclusion', 'nondeterministic IDs/order/hash'] }, inputByteEvidence: [{ path: 'src/ziwei/mingShenCleanRuleSeedPilot.js', sha256: sha256(await readFile(resolve(root, 'src/ziwei/mingShenCleanRuleSeedPilot.js'))) }, { path: 'src/ziwei/ziweiResolver.js', sha256: sha256(await readFile(resolve(root, 'src/ziwei/ziweiResolver.js'))) }], observedHead: execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim() }
  const pilotDir = resolve(root, 'artifacts/ziwei-ming-shen-clean-rule-seed-pilot-v0')
  for (const [name, expected] of Object.entries(PILOT)) { const path = resolve(pilotDir, name === 'transcription' ? 'transcription.json' : name === 'normalizedRule' ? 'normalized-rule.json' : 'comparison.json'); const actual = sha256(await readFile(path)); if (actual !== expected) throw new Error(`pilot_hash_changed:${name}:${actual}`); acceptance.pilotImmutability.actualHashes[name] = actual }
  const artifact = { ...acceptanceBase, acceptance: { ...acceptance, pilotImmutability: acceptance.pilotImmutability } }
  const files = { reviewerB: REVIEWER_B, discrepancies: { schemaVersion: `${SCHEMA}-discrepancies-v0`, items: DISCREPANCIES }, comparison, acceptance: artifact.acceptance }
  artifact.artifactHashes = Object.fromEntries(Object.entries(files).map(([key, value]) => [`${key}Sha256`, sha256(Buffer.from(canonicalJson(value)))]))
  return { artifact: attachArtifactIdentity(artifact, buildArtifactIdentity({ root, artifactId: SCHEMA, materializerPath: artifact.materializer, materializerVersion: MATERIALIZER_VERSION, baseHead: BASIS_HEAD, inputs: ['src/ziwei/mingShenCleanRuleSeedPilot.js', 'src/ziwei/ziweiResolver.js'] })), files }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const target = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`); const { artifact, files } = await buildAcceptanceArtifact(); const body = canonicalJson(artifact); await mkdir(dirname(target), { recursive: true }); await writeFile(target, body)
  for (const [name, value] of Object.entries(files)) { const path = resolve(dirname(target), `${name === 'reviewerB' ? 'reviewer-b' : name}.json`); const bytes = Buffer.from(canonicalJson(value)); await writeFile(path, bytes); await writeFile(`${path}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(bytes), artifactByteSha256Scope: 'UTF-8 bytes including final LF' }, null, 2)}\n`) }
  await writeFile(`${target}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(Buffer.from(body)), artifactByteSha256Scope: 'complete.json UTF-8 bytes including final LF' }, null, 2)}\n`)
  console.log(JSON.stringify({ verdict: artifact.verdictToken, matchCount: artifact.comparison.matchCount, mismatchCount: artifact.comparison.mismatchCount, artifactByteSha256: sha256(Buffer.from(body)), pilotHashes: artifact.acceptance.pilotImmutability }, null, 2))
}
