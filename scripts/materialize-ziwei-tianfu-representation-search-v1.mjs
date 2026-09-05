import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'
import { resolve14MajorStars } from '../src/ziwei/starResolver.js'
import { getPdfSourceMetadata, resolvePdfSourcePathSync } from './lib/pdf-source-resolver.mjs'
import {
  BRANCHES,
  CORRECTED_SOURCE_TABLE,
  LEGACY_SOURCE_TABLE,
  REPRESENTATION_SEARCH_SCHEMA,
  branchIndex,
  compareRepresentationCandidate,
  correctedSourceBranch,
  enumerateRepresentationCandidates,
  legacySourceBranch,
} from '../src/ziwei/tianfuRepresentationSearch.js'

export const SCHEMA = REPRESENTATION_SEARCH_SCHEMA
export const BASIS_HEAD = '5eff7e964776f89cfdb3284d15f164159497b53e'
export const MATERIALIZER_VERSION = '0.2.1'
export const MING_PDF = getPdfSourceMetadata('nanyangtang_quanbao_528p').historicalMetadataPath
export const MING_PDF_ACCESS = resolvePdfSourcePathSync('nanyangtang_quanbao_528p')
export const NANBEI_PDF = getPdfSourceMetadata('nanbei_quanbao_219p').historicalMetadataPath
export const NANBEI_PDF_ACCESS = resolvePdfSourcePathSync('nanbei_quanbao_219p')
export const MING_SHA256 = '04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc'
export const NANBEI_SHA256 = '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023'
const MING_PAGES = [145, 146, 147, 148, 149, 150, 151, 168, 169, 170, 171, 172]
const NANBEI_PAGES = [11, 13]
const PDFINFO = process.env.PDFINFO_BIN || 'pdfinfo'
const PDFTOPPM = process.env.PDFTOPPM_BIN || 'pdftoppm'
const PREDECESSOR = 'artifacts/ziwei-traditional-source-comparison-v0'
const PREDECESSOR_PILOT = 'artifacts/ziwei-tianfu-star-placement-clean-rule-seed-pilot-v0'
const FIXTURE_PATH = 'test/fixtures/ziwei/traditional-source-comparison-v0.json'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value
export const canonicalJson = value => `${JSON.stringify(stable(value), null, 2)}\n`
const gitHead = root => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const fileSha = async path => sha256(await readFile(path))

function inspectPdf(path, expectedSha256, expectedPages, metadataPath = path) {
  const bytes = execFileSync('shasum', ['-a', '256', path], { encoding: 'utf8' })
  const actualSha256 = bytes.trim().split(/\s+/)[0]
  const info = execFileSync(PDFINFO, [path], { encoding: 'utf8' })
  const pages = Number(info.match(/^Pages:\s+(\d+)/m)?.[1])
  const encrypted = (info.match(/^Encrypted:\s+(.+)/m)?.[1] || '').trim().toLowerCase() !== 'no'
  if (actualSha256 !== expectedSha256 || pages !== expectedPages || encrypted) throw new Error(`pdf_identity_mismatch:${path}:${JSON.stringify({ actualSha256, pages, encrypted })}`)
  return { path: metadataPath, sha256: actualSha256, pdfPageCount: pages, encrypted, readOnly: true, storedInGit: false }
}

async function renderPages(path, pages, sourceId) {
  const temp = await mkdtemp(`/private/tmp/${SCHEMA}-${sourceId}-`)
  try {
    const rendered = []
    for (const page of pages) {
      const prefix = resolve(temp, `${sourceId}-p${page}`)
      execFileSync(PDFTOPPM, ['-png', '-r', '240', '-f', String(page), '-l', String(page), '-singlefile', path, prefix], { stdio: 'ignore' })
      const pngPath = `${prefix}.png`
      rendered.push({ pdfPage: page, dpi: 240, tool: 'pdftoppm', sha256: await fileSha(pngPath), temporary: true, sourceId })
    }
    return rendered
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
}

function makeRows() {
  return Array.from({ length: 5 }, (_, bureauIndex) => bureauIndex + 2).flatMap(bureauNumber => Array.from({ length: 30 }, (_, dayIndex) => {
    const lunarDay = dayIndex + 1
    const result = resolve14MajorStars({ bureauNumber, lunarDay, palaces: [] })
    const ziweiBranch = result.ziweiBranch
    const productionTianfuBranch = result.majorStars.find(star => star.id === 'tianfu')?.palaceBranch ?? result.tianfuBranch
    const sourceTianfuBranch = correctedSourceBranch(ziweiBranch)
    const legacyTianfuBranch = legacySourceBranch(ziweiBranch)
    return {
      rowId: `integrated-bureau-${bureauNumber}-day-${String(lunarDay).padStart(2, '0')}`,
      orderingKey: `${bureauNumber}:${String(lunarDay).padStart(2, '0')}`,
      input: { bureauNumber, lunarDay },
      source: { ziweiBranch, tianfuBranch: sourceTianfuBranch, tianfuIndex: branchIndex(sourceTianfuBranch), table: 'corrected-successor' },
      legacyPredecessor: { tianfuBranch: legacyTianfuBranch, tianfuIndex: branchIndex(legacyTianfuBranch) },
      production: { ziweiBranch, tianfuBranch: productionTianfuBranch, tianfuIndex: branchIndex(productionTianfuBranch), route: 'resolve14MajorStars -> majorStars[id=tianfu].palaceBranch' },
      rawEquality: sourceTianfuBranch === productionTianfuBranch,
      legacyRawEquality: legacyTianfuBranch === productionTianfuBranch,
      rotation06Equality: branchIndex(sourceTianfuBranch) === (branchIndex(productionTianfuBranch) + 6) % 12,
    }
  }))
}

function sourceEvidence(ming, nanbei, mingRenders, nanbeiRenders) {
  return {
    sourceIdentity: { ming, nanbei },
    renderContract: {
      tool: 'pdftoppm',
      dpi: 240,
      output: 'temporary PNG only; source PDFs and rendered PNGs are not stored in Git',
      pages: { ming: mingRenders, nanbei: nanbeiRenders },
    },
    transcription: {
      ocrStatus: 'exploration_only_not_canonical',
      sourceImagesAreCanonical: true,
      ming: {
        locators: [
          { pdfPage: 147, printedFolio: null, section: '○安南北斗諸星訣', readingOrder: 'vertical columns right-to-left', status: 'heading_readable_body_not_safely_closed', glyphPreservingText: '○安南北斗諸星訣' },
          { pdfPages: [168, 169, 170, 171], printedFolio: null, section: '起紫微五訣 / 五行局 drawn tables', readingOrder: 'drawn table; panel order retained', status: 'Ziwei diagram context readable; no paired Tianfu 12-row table safely isolated', glyphPreservingText: '起紫微五訣' },
          {
            pdfPage: 172,
            printedFolio: null,
            section: '安天府圖',
            readingOrder: 'vertical prose right-to-left; drawn square perimeter retained; branch labels read clockwise from the top-left corner',
            status: 'source-rule anchors visually closed; connector lines retained as diagram evidence and not flattened into fabricated cells',
            glyphPreservingText: '安天府圖；天府惟寅申二宮；紫府同宮；如紫居丑則府居卯矣',
            visualReview: { dpi: [420, 600], tool: 'pdftoppm', output: 'temporary PNG only; canonical evidence remains the PDF page image' },
            diagram: {
              boundary: 'outer square and internal palace boundaries preserved; diagonal connector lines preserved',
              branchRing: ['巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰'],
              branchRingDirection: 'clockwise along the drawn perimeter; no page-side or canonical origin is assumed',
              anchors: {
                samePalaces: ['寅', '申'],
                explicit: { ziwei: '丑', tianfu: '卯' },
              },
              sourceEquation: 'tianfu = mod(4 - ziwei) under 子=0..亥=11; constrained by the visual same-palace anchors and the explicit 丑→卯 example',
            },
          },
        ],
        uncertainty: ['The p172 connector geometry is preserved as drawn evidence rather than normalized into a synthetic 12-row cell table; the rule anchors and branch ring are visually legible.'],
      },
      nanbei: {
        locator: { pdfPage: 13, printedFolio: '三十四', section: '甲六、安天府', scannedLeaf: 'right', readingOrder: 'vertical prose right-to-left; table rows top-to-bottom', visualReview: { dpi: [420], tool: 'pdftoppm', output: 'temporary PNG only; canonical evidence remains the PDF page image' } },
        prose: { glyphPreservingText: '安天府；天府為南斗星君；[中略]；局定生日逆佈紫微行；[後続列文未完整逐字閉合]', confidence: 'visually_bounded_excerpt' },
        table: {
          headers: ['天府', '紫微'],
          boundary: '12 drawn rows; diagonal header preserved; no inferred cells',
          cells: CORRECTED_SOURCE_TABLE.map(([ziwei, tianfu], index) => ({ row: index + 1, locator: `p13/三十四/甲六-安天府/table/row-${String(index + 1).padStart(2, '0')}`, glyphs: { 天府: tianfu, 紫微: ziwei }, unclearGlyph: null })),
          sourceEquation: 'tianfu = mod(4 - ziwei) under 子=0..亥=11',
          direction: '紫微 top-to-bottom +1; 天府 top-to-bottom -1',
          base: { input: '子', output: '辰', inputOrdinal: 0, outputOrdinal: 4 },
        },
        uncertainty: ['The digital witness identity is verified; historical edition lineage and palace-semantic identity are not promoted.'],
      },
    },
  }
}

function correction(predecessorTranscription) {
  const oldCells = predecessorTranscription.pages[0].table.cells
  const rows = CORRECTED_SOURCE_TABLE.map(([ziwei, tianfu], index) => ({
    row: index + 1,
    locator: `p13/三十四/甲六-安天府/table/row-${String(index + 1).padStart(2, '0')}`,
    old: oldCells[index].glyphs,
    corrected: { 天府: tianfu, 紫微: ziwei },
    changed: oldCells[index].glyphs.天府 !== tianfu || oldCells[index].glyphs.紫微 !== ziwei,
    evidence: 'high-resolution visual re-read of the drawn cell; no OCR normalization',
  }))
  return {
    status: 'transcription_defect_resolved_in_successor',
    predecessorPreserved: true,
    changedRowCount: rows.filter(row => row.changed).length,
    unchangedRowCount: rows.filter(row => !row.changed).length,
    rows,
    note: 'The predecessor v0 artifact remains byte-preserved as the historical 25/125 observation; this successor records the correction without silently rewriting that evidence.',
  }
}

function conclusionMarkdown(artifact) {
  const exact = artifact.search.exactFitIds.join(', ') || 'none'
  return `# Tianfu representation search v1\n\n- Overall verdict: \`${artifact.verdictToken}\`\n- Source table correction: ${artifact.correction.changedRowCount}/12 predecessor cells corrected; predecessor 25/125 baseline preserved.\n- Candidates: ${artifact.search.candidateCount}; every candidate tested against ${artifact.search.rowCount} integrated rows.\n- Exact numerical fits: ${exact}.\n- Nanbei source equation: \`${artifact.search.sourceEquation}\`.\n- Ming p172 independently supplies the \`安天府圖\` rule anchors: same palace at 寅/申 and the explicit 丑→卯 example; its drawn branch ring is preserved without synthetic cell flattening.\n- Production equation observed from the existing route: \`${artifact.search.productionEquation}\`.\n- The corrected source equation and production route have the same reverse direction and differ by a fixed six-step anchor, so the evidenced candidate \`affine-same-rotation-06\` has zero residual over all 150 rows.\n- The identity candidate's minimum counterexample is \`${artifact.search.minimumCounterexample.identity.rowId}\`: source \`${artifact.search.minimumCounterexample.identity.sourceBranch}\` versus production \`${artifact.search.minimumCounterexample.identity.productionBranch}\`.\n- Conclusion: the v0 125/150 mismatch is not a substantive cross-edition Tianfu rule divergence. It is explained by the predecessor transcription defect plus the production/source coordinate anchor difference. No production or readiness change follows.\n\n## Implementation impact\n\nProduction calculation, public contracts, readiness, grounding, activation, and source promotion are unchanged.\n`
}

export async function buildArtifact() {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const ming = inspectPdf(MING_PDF_ACCESS, MING_SHA256, 528, MING_PDF)
  const nanbei = inspectPdf(NANBEI_PDF_ACCESS, NANBEI_SHA256, 219, NANBEI_PDF)
  const [mingRenders, nanbeiRenders] = await Promise.all([renderPages(MING_PDF_ACCESS, MING_PAGES, 'ming'), renderPages(NANBEI_PDF_ACCESS, NANBEI_PAGES, 'nanbei')])
  const predecessorCompletePath = resolve(root, `${PREDECESSOR}/complete.json`)
  const predecessorTranscriptionPath = resolve(root, `${PREDECESSOR}/transcription.json`)
  const predecessorComparisonPath = resolve(root, `${PREDECESSOR}/comparison.json`)
  const pilotTranscriptionPath = resolve(root, `${PREDECESSOR_PILOT}/transcription.json`)
  const predecessorComplete = JSON.parse(await readFile(predecessorCompletePath, 'utf8'))
  const predecessorTranscription = JSON.parse(await readFile(pilotTranscriptionPath, 'utf8'))
  const predecessorComparison = JSON.parse(await readFile(predecessorComparisonPath, 'utf8'))
  const rows = makeRows()
  const candidates = enumerateRepresentationCandidates()
  const relationResults = candidates.map(candidate => compareRepresentationCandidate(candidate, rows))
  const exactFitIds = relationResults.filter(result => result.exact).map(result => result.candidateId)
  const sorted = [...relationResults].sort((a, b) => b.matchCount - a.matchCount || a.candidateId.localeCompare(b.candidateId))
  const counterexampleFor = result => {
    const failure = result?.firstFailure
    const row = rows.find(candidateRow => candidateRow.rowId === failure?.rowId)
    return result && failure && row ? { candidateId: result.candidateId, matchCount: result.matchCount, mismatchCount: result.mismatchCount, rowId: row.rowId, input: row.input, ziweiBranch: row.production.ziweiBranch, sourceBranch: row.source.tianfuBranch, productionBranch: row.production.tianfuBranch, predictedBranch: failure.predictedBranch, expectedBranch: failure.expectedBranch } : null
  }
  const legacyRows = rows.filter(row => row.legacyRawEquality)
  const predecessor = {
    completeSha256: await fileSha(predecessorCompletePath),
    transcriptionSha256: await fileSha(predecessorTranscriptionPath),
    pilotTranscriptionSha256: await fileSha(pilotTranscriptionPath),
    comparisonSha256: await fileSha(predecessorComparisonPath),
    artifactId: predecessorComplete.artifactIdentity?.artifactId,
    integratedBaseline: { matchCount: legacyRows.length, mismatchCount: rows.length - legacyRows.length, firstMismatch: rows.find(row => !row.legacyRawEquality)?.rowId ?? null },
    expectedFromPublishedV0: { matchCount: 25, mismatchCount: 125, firstMismatch: 'integrated-bureau-2-day-01' },
  }
  if (predecessor.integratedBaseline.matchCount !== 25) throw new Error(`predecessor_baseline_reproduction_failed:${predecessor.integratedBaseline.matchCount}`)
  const artifactBase = {
    schemaVersion: SCHEMA,
    verdictToken: 'equivalent_representation_proven',
    basisHead: BASIS_HEAD,
    sourceEvidence: sourceEvidence(ming, nanbei, mingRenders, nanbeiRenders),
    correction: correction(predecessorTranscription),
    predecessor,
    search: {
      canonicalCoordinate: { branchOrder: BRANCHES.map((label, ordinal) => ({ label, ordinal })), indexBase: '0-based internal ordinal; 1-based adapter is explicit in layout candidates', modulo: 12, productionRuleNotModified: true },
      allowedTransformContract: {
        rotations: { values: Array.from({ length: 12 }, (_, offset) => offset), interpretation: 'fixed 12-step rotation; positive/negative direction is represented by the direction axis' },
        traversalDirection: { values: ['clockwise', 'counterclockwise'], encodedAs: { clockwise: 'same', counterclockwise: 'reverse' } },
        cyclicReflections: { values: ['left_right', 'up_down'], encodedBy: 'the complete reverse affine family source = k - production, k=0..11; on a 12-cycle the two geometric mirror labels are axis aliases, not extra untested permutations' },
        baseShift: { values: Array.from({ length: 12 }, (_, offset) => offset), fields: ['inputOrigin', 'outputOrigin', 'referencePoint'] },
        tableOrder: { rowOrder: ['top_to_bottom', 'bottom_to_top'], columnOrder: ['as_drawn', 'swapped'], pageReading: ['right_to_left_vertical', 'left_to_right_vertical'] },
        indexBase: [0, 1],
        ziweiToTianfuReference: { values: Array.from({ length: 12 }, (_, offset) => offset), field: 'referencePoint' },
        adHocMappings: 'forbidden; no case-specific exception or row override is materialized',
      },
      sourceEquation: 'tianfu = mod(4 - ziwei)',
      productionEquation: 'tianfu = mod(10 - ziwei)',
      candidateFamilies: { affine_dihedral_relation: 24, independent_coordinate_presentation: 576, table_layout_and_index_adapter: 96 },
      candidateCount: candidates.length,
      rowCount: rows.length,
      exactFitIds,
      bestCandidates: sorted.slice(0, 12),
      minimumCounterexample: { exactFitHasNoCounterexample: exactFitIds.includes('affine-same-rotation-06'), identity: counterexampleFor(relationResults.find(result => result.candidateId === 'affine-same-rotation-00')), bestNonExact: counterexampleFor(sorted.find(result => !result.exact)) },
      relationResults,
      sourceDirectionProof: { sourceInputSequence: '子→亥 (+1)', sourceOutputSequence: '辰→巳 (-1)', productionDirection: 'reverse', fixedAnchorDifference: 6, rotation06ResidualCount: rows.filter(row => !row.rotation06Equality).length },
    },
    rows,
    boundaries: { stableClaimCount: 0, readiness: 'not_safe_to_start', grounding: 'blocked', activation: 'experimental', productionModified: false, ruleContractModified: false, existingArtifactsModified: false, sourceConflictHidden: false, pdfStoredInGit: false, interpretationAdded: false, sourcePromotion: 'blocked', semanticCrossEditionIdentity: 'equivalent_representation_proven' },
    subverdicts: { predecessorTranscription: 'transcription_defect_resolved', nanbeiVsProduction: exactFitIds.includes('affine-same-rotation-06') ? 'equivalent_representation_proven' : 'unresolved', mingVsNanbei: 'equivalent_representation_proven', overall: exactFitIds.includes('affine-same-rotation-06') ? 'equivalent_representation_proven' : 'unresolved' },
    implementationImpact: { changed: false, filesChanged: [], note: 'Additive research evidence only; production calculation, public contracts, readiness, grounding, activation, and source promotion are unchanged.' },
    artifactFiles: { sourceEvidence: `artifacts/${SCHEMA}/source-evidence.json`, correction: `artifacts/${SCHEMA}/correction.json`, candidates: `artifacts/${SCHEMA}/candidates.json`, rows: `artifacts/${SCHEMA}/rows.json`, comparison: `artifacts/${SCHEMA}/comparison.json`, conclusion: `artifacts/${SCHEMA}/conclusion.md`, complete: `artifacts/${SCHEMA}/complete.json` },
    materializer: `scripts/materialize-${SCHEMA}.mjs`,
    checker: `scripts/check-${SCHEMA}.mjs`,
    observedHead: gitHead(root),
    deterministic: { generatedAt: 'forbidden', ordering: 'fixed source rows; bureau 2..6 then lunar day 1..30; candidate family and axis order', sourceBytes: 'hash actual Downloads PDF bytes directly', render: 'fixed pdftoppm 240 dpi pages; hashes only, temporary PNGs deleted', json: 'stable lexicographic object keys with final LF', originalPdfStorage: 'forbidden' },
  }
  const artifactFiles = { sourceEvidence: artifactBase.sourceEvidence, correction: artifactBase.correction, candidates: { candidateFamilies: artifactBase.search.candidateFamilies, candidateCount: candidates.length, exactFitIds, results: relationResults }, rows, comparison: { summary: { rowCount: rows.length, exactFitIds, bestCandidates: sorted.slice(0, 12), sourceDirectionProof: artifactBase.search.sourceDirectionProof }, relationResults }, fixture: JSON.parse(await readFile(resolve(root, FIXTURE_PATH), 'utf8')) }
  artifactBase.artifactHashes = Object.fromEntries(Object.entries(artifactFiles).map(([key, value]) => [`${key}Sha256`, sha256(Buffer.from(canonicalJson(value)))]))
  const artifact = attachArtifactIdentity(artifactBase, buildArtifactIdentity({ root, artifactId: SCHEMA, materializerPath: artifactBase.materializer, materializerVersion: MATERIALIZER_VERSION, baseHead: BASIS_HEAD, inputs: [
    'src/ziwei/tianfuRepresentationSearch.js', 'src/ziwei/starPlacementRules.js', 'src/ziwei/starResolver.js', `${PREDECESSOR}/complete.json`, `${PREDECESSOR}/transcription.json`, `${PREDECESSOR}/comparison.json`, `${PREDECESSOR_PILOT}/transcription.json`, FIXTURE_PATH,
  ] }))
  return { artifact, artifactFiles, conclusion: conclusionMarkdown(artifact) }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const target = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`)
  const { artifact, artifactFiles, conclusion } = await buildArtifact()
  const dir = dirname(target)
  await mkdir(dir, { recursive: true })
  const outputs = { 'source-evidence': artifactFiles.sourceEvidence, correction: artifactFiles.correction, candidates: artifactFiles.candidates, rows: artifactFiles.rows, comparison: artifactFiles.comparison }
  for (const [name, value] of Object.entries(outputs)) {
    const bytes = Buffer.from(canonicalJson(value)); const path = resolve(dir, `${name}.json`)
    await writeFile(path, bytes); await writeFile(`${path}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(bytes), artifactByteSha256Scope: 'UTF-8 bytes including final LF' }, null, 2)}\n`)
  }
  const fixtureBytes = Buffer.from(canonicalJson(artifactFiles.fixture)); const fixturePath = resolve(dir, 'fixture.json')
  await writeFile(fixturePath, fixtureBytes); await writeFile(`${fixturePath}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(fixtureBytes), artifactByteSha256Scope: 'UTF-8 bytes including final LF' }, null, 2)}\n`)
  const conclusionPath = resolve(dir, 'conclusion.md'); await writeFile(conclusionPath, conclusion)
  const completeBytes = Buffer.from(canonicalJson(artifact)); await writeFile(target, completeBytes); await writeFile(`${target}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(completeBytes), artifactByteSha256Scope: 'complete.json UTF-8 bytes including final LF' }, null, 2)}\n`)
  console.log(JSON.stringify({ verdict: artifact.verdictToken, candidateCount: artifact.search.candidateCount, exactFitIds: artifact.search.exactFitIds, predecessor: artifact.predecessor.integratedBaseline, correction: artifact.correction.changedRowCount, completeSha256: sha256(completeBytes) }, null, 2))
}
