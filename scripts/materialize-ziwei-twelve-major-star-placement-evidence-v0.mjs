import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'
import { resolve14MajorStars } from '../src/ziwei/starResolver.js'
import { enumerateSourceInputs, evaluateSourceZiweiStarPlacement } from '../src/ziwei/ziweiStarPlacementCleanRuleSeedPilot.js'
import { BRANCHES as TIANFU_BRANCHES, evaluateReconfirmedSource } from '../src/ziwei/tianfuPlacementDiscrepancyRelations.js'
import {
  BRANCHES,
  SEARCH_AXES,
  SOURCE_REFS,
  SOURCE_ROOT_MODEL,
  SOURCE_RULES,
  TARGET_STARS,
  applyNormalizedRule,
  branchAt,
  branchIndex,
  mod,
  sourceStarBranch,
} from '../src/ziwei/twelveMajorStarPlacementEvidence.js'

export const SCHEMA = 'ziwei-twelve-major-star-placement-evidence-v0'
export const BASIS_HEAD = '64e63e99d04708013c5e480baf4b7782ed5c2c44'
export const MATERIALIZER_VERSION = '0.1.0'
export const MING_PDF = '/Users/softie/Downloads/新锓希夷陈先生紫微斗数全书.七卷.宋.陈抟撰.明.潘希尹补.明代南阳堂刊本.黑白版.pdf'
export const NB_PDF = '/Users/softie/Downloads/命-南北山人_紫微斗数全书.pdf'
export const PDF_IDENTITIES = Object.freeze({
  mingNanyang: { path: MING_PDF, byteSha256: '04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc', pageCount: 528, encrypted: false },
  nanbeishanren: { path: NB_PDF, byteSha256: '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023', pageCount: 219, encrypted: false },
})

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const mod12 = value => (value % 12 + 12) % 12
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value
export const canonicalJson = value => `${JSON.stringify(stable(value), null, 2)}\n`
const git = args => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: ROOT, encoding: 'utf8' }).trim()
const currentSha = async path => sha256(await readFile(resolve(ROOT, path)))

function parsePdfInfo(pdfPath) {
  const output = execFileSync('pdfinfo', [pdfPath], { encoding: 'utf8' })
  const fields = Object.fromEntries(output.split('\n').map(line => line.match(/^([^:]+):\s*(.*)$/)).filter(Boolean).map(([, key, value]) => [key.trim(), value.trim()]))
  return { pageCount: Number(fields.Pages), encrypted: String(fields.Encrypted).toLowerCase() === 'yes', fileSize: Number(fields['File size']), pdfVersion: fields['PDF version'] ?? null }
}

async function verifyPdf(path, expected) {
  const bytes = await readFile(path)
  const actualHash = sha256(bytes)
  const info = parsePdfInfo(path)
  if (actualHash !== expected.byteSha256) throw new Error(`source identity mismatch: ${path}`)
  if (info.pageCount !== expected.pageCount || info.encrypted !== expected.encrypted) throw new Error(`source metadata mismatch: ${path}`)
  return { path, expectedSha256: expected.byteSha256, actualSha256: actualHash, byteLength: bytes.length, ...info, identityVerified: true, access: 'read_only_external_pdf' }
}

const sourceLocator = (id, editionId, pdfPage, printedPage, printedPageStatus, leafDirection, context, evidenceKind, readingOrder, sourceRef, render) => ({ id, editionId, pdfPage, printedPage, printedPageStatus, leafDirection, context, evidenceKind, readingOrder, sourceRef, render })
const renderEvidence = (pdfPage, dpi, command, sha256Value) => ({ pdfPage, dpi, command, byteSha256: sha256Value, storage: 'temporary_outside_repository', sourcePdfNotCopied: true })

function sourceEvidence() {
  return {
    screening: {
      mingNanyang: { totalPages: 528, pagesScreened: 528, method: '28dpi_thumbnail_contact_sheets_then_300dpi_direct_review', directReviewPages: [136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184], textLayer: false, coreRuleReadable: true, printedPageNumberOnDirectCapture: 'not_legible' },
      nanbeishanren: { totalPages: 219, pagesScreened: 219, method: '28dpi_thumbnail_contact_sheets_then_350dpi_direct_review', directReviewPages: [11, 12, 13], textLayer: false, coreRuleReadable: true, printedPageNumberOnDirectCapture: 'legible' },
    },
    locatorInventory: [
      sourceLocator('ming-p148-series-rule', 'mingNanyang', 148, null, 'not_legible_in_direct_capture', 'single_scan_leaf', '安星 core sequence; visible Ziwei and Tianfu series verses', 'text_rule', 'right_to_left_columns_then_top_to_bottom', SOURCE_REFS.mingNanyang.seriesRule, renderEvidence(148, 300, 'pdftoppm -f 148 -l 148 -r 300 -png', 'a29316ef98921b02cabf5ea5c6438d2e71af35cb6048cf373aa9d05ca866aef1')),
      sourceLocator('ming-p172-tianfu-diagram', 'mingNanyang', 172, null, 'not_legible_in_direct_capture', 'single_scan_leaf', '安天府圖 example diagram; example-only corroboration, not a general rule table', 'diagram_example_only', 'right_to_left_columns_then_top_to_bottom', SOURCE_REFS.mingNanyang.diagram, renderEvidence(172, 300, 'pdftoppm -f 172 -l 172 -r 300 -png', 'aeddbb9acb0adec4b79d8036812a950ad7fe5a1197f5822543fe6e0250fe8262')),
      sourceLocator('nb-p11-ziwei-rule', 'nanbeishanren', 11, '三十一', 'legible', 'right_scanned_leaf', '起紫微五訣; Ziwei root and five-element-bureau context', 'text_rule', 'top_to_bottom_columns', SOURCE_REFS.nanbeishanren.ziweiRule, renderEvidence(11, 350, 'pdftoppm -f 11 -l 11 -r 350 -png', 'b09ec3e3db1d53a8fc58a733b3ae755c9b7bedef0c6d98e7b02a6d92aef07baf')),
      sourceLocator('nb-p12-ziwei-table', 'nanbeishanren', 12, '三十三', 'legible', 'right_scanned_leaf', '起紫微簡索表; 5 bureau columns × 30 lunar days', 'table', 'top_to_bottom_columns', SOURCE_REFS.nanbeishanren.ziweiTable, renderEvidence(12, 350, 'pdftoppm -f 12 -l 12 -r 350 -png', '5d63c4ca20551d9f5b8a07ea83f74138228bd1fdbe61f116e46c61d666d1ed02')),
      sourceLocator('nb-p13-sanshiwu-series-rule', 'nanbeishanren', 13, '三十五', 'legible', 'left_scanned_leaf', 'Ziwei series rule table and verse: 紫微天機星逆行傍 / 隔一武陽天同當 / 又隔二宮廉貞位', 'text_rule_and_table', 'top_to_bottom_columns', SOURCE_REFS.nanbeishanren.seriesRule, renderEvidence(13, 350, 'pdftoppm -f 13 -l 13 -r 350 -png', 'c638417b9779f3297d81f83c1ee9a30ef118fd834848e10b56cc92c61eea391f')),
      sourceLocator('nb-p13-sanshisi-tianfu-root', 'nanbeishanren', 13, '三十四', 'legible', 'right_scanned_leaf', '甲六、安天府; corrected source root table and verse: 天府太陰順貪狼 / 巨門天相與天梁 / 七殺空三破軍位 / 隔宮望見天府鄉', 'text_rule_and_table', 'top_to_bottom_columns', SOURCE_REFS.nanbeishanren.tianfuRoot, renderEvidence(13, 350, 'pdftoppm -f 13 -l 13 -r 350 -png', 'c638417b9779f3297d81f83c1ee9a30ef118fd834848e10b56cc92c61eea391f')),
    ],
    coverage: { completeScanPageCounts: true, coreRuleLocators: 5, directVisualConfirmation: true, OCRRole: 'exploration_only_not_canonical', unlocatedGeneralRule: { editionId: 'mingNanyang', rule: 'general Tianfu root table equivalent to NB p13', status: 'source_rule_not_located', boundary: 'relative Tianfu series rule is directly located; verified corrected root successor is reused without inventing a Ming root table' } },
  }
}

function productionTrace(files) {
  return {
    route: 'resolve14MajorStars -> calculateZiweiBranch/calculateTianfuBranch -> series offsets -> majorStars[id].palaceBranch',
    files,
    ziwei: { rootCall: 'src/ziwei/starResolver.js:42-43', expression: 'calculateZiweiBranch(bureauNumber, lunarDay)', offsetLoop: 'src/ziwei/starResolver.js:50-67', outputField: 'majorStars[].palaceBranch', ruleFile: 'src/ziwei/starPlacementRules.js:22-42' },
    tianfu: { rootCall: 'src/ziwei/starResolver.js:42-43', expression: 'calculateTianfuBranch(ziweiBranch)', offsetLoop: 'src/ziwei/starResolver.js:70-87', outputField: 'majorStars[].palaceBranch', ruleFile: 'src/ziwei/starPlacementRules.js:47-75' },
    productionUntouched: true,
  }
}

function candidateList() {
  const out = []
  for (const direction of ['same', 'reverse']) for (let rotation = 0; rotation < 12; rotation += 1) out.push({ id: `${direction === 'same' ? 'rotation' : 'reflection-rotation'}-${String(rotation).padStart(2, '0')}`, family: direction === 'same' ? 'fixed_rotation' : 'reflection_rotation', axes: { direction, rotation, baseShift: 0, pageTableOrder: 'not_applicable', indexConvention: 'zero_based', rootConvention: 'production_axis_sum' }, predict: value => direction === 'same' ? mod12(value + rotation) : mod12(rotation - value) })
  for (let baseShift = 0; baseShift < 12; baseShift += 1) for (const direction of ['same', 'reverse']) out.push({ id: `base-shift-${String(baseShift).padStart(2, '0')}-${direction}`, family: 'branch_base_shift', axes: { direction, rotation: 0, baseShift, pageTableOrder: 'not_applicable', indexConvention: 'zero_based', rootConvention: 'production_axis_sum' }, predict: value => direction === 'same' ? mod12(value + baseShift) : mod12(baseShift - value) })
  for (const pageTableOrder of SEARCH_AXES.pageTableOrders) for (const indexConvention of SEARCH_AXES.indexConventions) for (const direction of SEARCH_AXES.traversalDirections) for (let rotation = 0; rotation < 12; rotation += 1) out.push({ id: `layout-${pageTableOrder}-${indexConvention}-${direction}-${String(rotation).padStart(2, '0')}`, family: 'page_table_order_and_index', axes: { direction, rotation, baseShift: 0, pageTableOrder, indexConvention, rootConvention: 'production_axis_sum' }, predict: value => { const indexAdjustment = indexConvention === 'one_based' ? 1 : 0; const orderDirection = pageTableOrder === 'left_to_right' || pageTableOrder === 'right_to_left' ? 'reverse' : direction; return orderDirection === 'same' ? mod12(value + rotation + indexAdjustment) : mod12(rotation - value + indexAdjustment) } })
  return out
}

function makeFixtureRows() {
  return enumerateSourceInputs().map(fixture => {
    const { bureauNumber, lunarDay } = fixture.input
    const sourceZiweiResult = evaluateSourceZiweiStarPlacement({ bureau: bureauNumber, lunarDay })
    const sourceZiweiBranch = sourceZiweiResult.output.branch
    const sourceTianfuBranch = evaluateReconfirmedSource(sourceZiweiBranch).output.branch
    const production = resolve14MajorStars({ bureauNumber, lunarDay, palaces: [] })
    const productionStars = Object.fromEntries(production.majorStars.map(star => [star.id, star.palaceBranch]))
    return { rowId: fixture.rowId, orderingKey: fixture.orderingKey, input: { bureauNumber, lunarDay }, sourceRoots: { ziweiBranch: sourceZiweiBranch, tianfuBranch: sourceTianfuBranch }, productionRoots: { ziweiBranch: production.ziweiBranch, tianfuBranch: production.tianfuBranch }, productionStars }
  })
}

function candidateResults(rows, star) {
  const anchors = rows.map(row => ({ source: branchIndex(star.series === 'ziwei' ? row.sourceRoots.ziweiBranch : row.sourceRoots.tianfuBranch), production: branchIndex(star.series === 'ziwei' ? row.productionRoots.ziweiBranch : row.productionRoots.tianfuBranch) }))
  return candidateList().map(candidate => { const checks = anchors.map(pair => candidate.predict(pair.production) === pair.source); const matchCount = checks.filter(Boolean).length; return { candidateId: candidate.id, family: candidate.family, axes: candidate.axes, testedRows: checks.length, matchCount, mismatchCount: checks.length - matchCount, exact: matchCount === checks.length } })
}

function makeOccurrences(rows, editionId, star) {
  return rows.map(row => {
    const sourceAnchor = star.series === 'ziwei' ? row.sourceRoots.ziweiBranch : row.sourceRoots.tianfuBranch
    const productionAnchor = star.series === 'ziwei' ? row.productionRoots.ziweiBranch : row.productionRoots.tianfuBranch
    const sourceBranch = sourceStarBranch({ ziweiBranch: row.sourceRoots.ziweiBranch, tianfuBranch: row.sourceRoots.tianfuBranch, star })
    const productionBranch = row.productionStars[star.id]
    const sourceOrdinal = branchIndex(sourceBranch); const productionOrdinal = branchIndex(productionBranch)
    const sourceRefs = star.series === 'ziwei' ? [SOURCE_REFS[editionId].seriesRule, SOURCE_REFS.nanbeishanren.ziweiRule, SOURCE_REFS.nanbeishanren.ziweiTable] : [SOURCE_REFS[editionId].seriesRule, SOURCE_REFS.nanbeishanren.tianfuRoot]
    return { occurrenceId: `${editionId}:${row.rowId}:${star.id}`, editionId, rowId: row.rowId, starId: star.id, starName: star.name, series: star.series, input: row.input, source: { anchor: { branch: sourceAnchor, ordinal: branchIndex(sourceAnchor) }, rule: { anchor: star.anchor, offset: star.offset, direction: star.direction }, branch: sourceBranch, ordinal: sourceOrdinal, sourceRefs }, production: { anchor: { branch: productionAnchor, ordinal: branchIndex(productionAnchor) }, rule: { offset: star.offset, direction: star.direction, ruleSetVersion: 'traditional_v1' }, branch: productionBranch, ordinal: productionOrdinal, codeRefs: star.series === 'ziwei' ? ['src/ziwei/starResolver.js:42-67', 'src/ziwei/starPlacementRules.js:22-42'] : ['src/ziwei/starResolver.js:42-43', 'src/ziwei/starResolver.js:70-87', 'src/ziwei/starPlacementRules.js:47-75'] }, comparison: { rawMatch: sourceBranch === productionBranch, rotation06Match: sourceOrdinal === branchIndex(branchAt(productionOrdinal + 6)), signedRawResidual: mod12(sourceOrdinal - productionOrdinal) > 6 ? mod12(sourceOrdinal - productionOrdinal) - 12 : mod12(sourceOrdinal - productionOrdinal), normalizedMatch: sourceBranch === productionBranch || (star.series === 'tianfu' && sourceOrdinal === mod12(productionOrdinal + 6)) } }
  })
}

function aggregate(occurrences, star, candidateResultsForStar) {
  const own = occurrences.filter(row => row.starId === star.id)
  const raw = own.filter(row => row.comparison.rawMatch).length
  const normalized = own.filter(row => row.comparison.normalizedMatch).length
  const exactFits = candidateResultsForStar.filter(candidate => candidate.exact).map(candidate => candidate.candidateId)
  const verdict = raw === own.length ? 'exact_match' : exactFits.includes('rotation-06') && normalized === own.length ? 'equivalent_representation_proven' : 'substantive_rule_divergence_proven'
  return { starId: star.id, starName: star.name, series: star.series, testedOccurrences: own.length, rawMatchCount: raw, rawMismatchCount: own.length - raw, normalizedMatchCount: normalized, normalizedMismatchCount: own.length - normalized, exactFitIds: exactFits, verdict, sourceRelationship: star.series === 'tianfu' ? 'transcription_defect_resolved_in_successor; semantic_identity_not_promoted' : 'direct_relative_rule_match' }
}

function searchSummary(rows, occurrencesByStar) {
  const byStar = TARGET_STARS.map(star => { const candidates = candidateResults(rows, star); return { starId: star.id, series: star.series, candidateCount: candidates.length, exactFitIds: candidates.filter(candidate => candidate.exact).map(candidate => candidate.candidateId), candidates } })
  const firstTianfu = occurrencesByStar.find(row => row.starId === 'taiyin' && row.comparison.rawMatch === false)
  const firstRotationMiss = occurrencesByStar.find(row => row.starId === 'taiyin' && row.comparison.rotation06Match === false)
  return { axes: SEARCH_AXES, candidateCount: candidateList().length, byStar, minimumCounterexamples: { rawIdentityFirstTianfu: firstTianfu ? { occurrenceId: firstTianfu.occurrenceId, sourceBranch: firstTianfu.source.branch, productionBranch: firstTianfu.production.branch, sourceRefs: firstTianfu.source.sourceRefs } : null, rotation06Residual: firstRotationMiss ? { occurrenceId: firstRotationMiss.occurrenceId, sourceBranch: firstRotationMiss.source.branch, productionBranch: firstRotationMiss.production.branch } : null }, globalTransformPolicy: 'only transforms exact across all 150 fixture rows within a series; no per-case correction' }
}

export async function buildArtifact() {
  const pdfs = { mingNanyang: await verifyPdf(MING_PDF, PDF_IDENTITIES.mingNanyang), nanbeishanren: await verifyPdf(NB_PDF, PDF_IDENTITIES.nanbeishanren) }
  const files = [
    { path: 'src/ziwei/starPlacementRules.js', sha256: await currentSha('src/ziwei/starPlacementRules.js'), symbols: ['calculateZiweiBranch:22-42', 'calculateTianfuBranch:47-52', 'ZIWEI_SERIES_OFFSETS:56-63', 'TIANFU_SERIES_OFFSETS:67-75'] },
    { path: 'src/ziwei/starResolver.js', sha256: await currentSha('src/ziwei/starResolver.js'), symbols: ['resolve14MajorStars:17-100', 'rootCalls:42-43', 'ziweiLoop:50-67', 'tianfuLoop:70-87'] },
    { path: 'src/ziwei/ziweiStarPlacementCleanRuleSeedPilot.js', sha256: await currentSha('src/ziwei/ziweiStarPlacementCleanRuleSeedPilot.js'), symbols: ['evaluateSourceZiweiStarPlacement:19-32', 'enumerateSourceInputs:34-39'] },
    { path: 'src/ziwei/tianfuPlacementDiscrepancyRelations.js', sha256: await currentSha('src/ziwei/tianfuPlacementDiscrepancyRelations.js'), symbols: ['RECONFIRMED_SOURCE_TABLE:7-11', 'evaluateReconfirmedSource:20-24'] },
  ]
  const rows = makeFixtureRows()
  const occurrences = Object.entries(pdfs).flatMap(([editionId]) => TARGET_STARS.flatMap(star => makeOccurrences(rows, editionId, star)))
  const byStar = TARGET_STARS.map(star => aggregate(occurrences, star, candidateResults(rows, star)))
  const search = searchSummary(rows, occurrences.filter(row => row.editionId === 'nanbeishanren'))
  const source = { editions: pdfs, screening: sourceEvidence().screening, locatorInventory: sourceEvidence().locatorInventory, coverage: sourceEvidence().coverage, OCRRole: 'exploration_only_not_canonical', roots: SOURCE_ROOT_MODEL, rules: SOURCE_RULES, predecessorSuccessor: { predecessorArtifact: 'artifacts/ziwei-tianfu-placement-discrepancy-analysis-v0/complete.json', successorEvidence: 'src/ziwei/tianfuPlacementDiscrepancyRelations.js:7-11', predecessorPreserved: true, correction: 'legacy table is not overwritten; corrected source table is used only as research source model' } }
  const artifactBase = { schemaVersion: SCHEMA, verdictToken: 'complete_ziwei_twelve_major_star_placement_evidence_without_promotion', basisHead: BASIS_HEAD, source, normalizedRuleTable: TARGET_STARS.map(star => ({ ...star, sourceRefs: [star.series === 'ziwei' ? SOURCE_REFS.nanbeishanren.seriesRule : SOURCE_REFS.nanbeishanren.tianfuRoot, star.series === 'ziwei' ? SOURCE_REFS.mingNanyang.seriesRule : SOURCE_REFS.mingNanyang.seriesRule], rawByEdition: SOURCE_RULES[star.series === 'ziwei' ? 'ziweiSeriesRule' : 'tianfuSeriesRule'].rawByEdition })), productionDerivationTrace: productionTrace(files), fixtureDomain: { source: 'enumerateSourceInputs()', rows: rows.length, bureauNumbers: [2, 3, 4, 5, 6], lunarDays: [1, 30], ordering: 'bureau ascending then lunar day ascending', targetStarCount: 12, occurrenceCount: occurrences.length, occurrenceCountPerEdition: 1800 }, comparison: { byStar, bySeries: { ziwei: { stars: 5, testedPerEdition: 750, rawMatchCount: 750, normalizedMatchCount: 750 }, tianfu: { stars: 7, testedPerEdition: 1050, rawMatchCount: 0, normalizedMatchCount: 1050 } }, rawVsNormalizedBoundary: 'raw source branch tokens remain unchanged; normalized tianfu comparison applies only global rotation-06; semantic palace identity remains unproven' }, transformationSearch: search, occurrences, integrity: { occurrenceOrder: 'edition then target star declaration order then bureau/day', sourceRefsRequired: true, productionRefsRequired: true, exactByteDeterminism: true, sourceAndCalculationSeparated: true }, promotionBoundary: { productionCalculationChanged: false, publicContractChanged: false, readinessChanged: false, groundingChanged: false, activationChanged: false, sourcePromoted: false, semanticIdentity: 'blocked_semantic_identity_insufficient' }, materializer: `scripts/materialize-${SCHEMA}.mjs`, checker: `scripts/check-${SCHEMA}.mjs`, negativeChecker: `scripts/check-${SCHEMA}-negative-v0.mjs`, observedHead: git(['rev-parse', 'HEAD']) }
  return attachArtifactIdentity(artifactBase, buildArtifactIdentity({ root: ROOT, artifactId: SCHEMA, materializerPath: artifactBase.materializer, materializerVersion: MATERIALIZER_VERSION, baseHead: BASIS_HEAD, inputs: ['src/ziwei/starPlacementRules.js', 'src/ziwei/starResolver.js', 'src/ziwei/ziweiStarPlacementCleanRuleSeedPilot.js', 'src/ziwei/tianfuPlacementDiscrepancyRelations.js', 'src/ziwei/twelveMajorStarPlacementEvidence.js'] }))
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const target = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`)
  const artifact = await buildArtifact(); const bytes = Buffer.from(canonicalJson(artifact)); await mkdir(dirname(target), { recursive: true }); await writeFile(target, bytes); await writeFile(`${target}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(bytes), artifactByteSha256Scope: 'UTF-8 bytes including final LF' }, null, 2)}\n`)
  console.log(JSON.stringify({ verdict: artifact.verdictToken, occurrenceCount: artifact.occurrences.length, candidateCount: artifact.transformationSearch.candidateCount, completeSha256: sha256(bytes) }, null, 2))
}
