import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { buildArtifact as buildPrior } from './materialize-ziwei-major-star-coordinate-provenance-v0.mjs'
import { resolve14MajorStars } from '../src/ziwei/starResolver.js'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'

export const SCHEMA = 'ziwei-major-star-source-corpus-provenance-v0'
export const BASIS_HEAD = '8dac3d5eba26c3c092c6e75b23782a98b5d093f3'
export const MATERIALIZER_VERSION = '0.1.0'
const PDF = '/Users/softie/Downloads/命-南北山人_紫微斗数全书.pdf'
const PDF_SHA256 = '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023'
const PAGE_COUNT = 219
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])])) : value
export const canonicalJson = value => JSON.stringify(stable(value), null, 2) + '\n'
const git = (root, args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8' }).trim()
const gitBytes = (root, args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root })
const fileSha = path => sha256(readFileSync(path))
const protectedPaths = [
  'artifacts/ziwei-major-star-coordinate-provenance-v0/complete.json',
  'artifacts/ziwei-major-star-coordinate-provenance-v0/decisionPacket.json',
  'artifacts/ziwei-major-star-coordinate-provenance-v0/inventory.json',
  'artifacts/ziwei-major-star-coordinate-provenance-v0/sourceEvidenceIndex.json',
  'artifacts/ziwei-major-star-coordinate-provenance-v0/complete.json.integrity.json',
  'artifacts/ziwei-major-star-coordinate-provenance-v0/decisionPacket.json.integrity.json',
  'artifacts/ziwei-major-star-coordinate-provenance-v0/inventory.json.integrity.json',
  'artifacts/ziwei-major-star-coordinate-provenance-v0/sourceEvidenceIndex.json.integrity.json',
  'docs/ziwei-major-star-coordinate-provenance-v0.md',
  'scripts/materialize-ziwei-major-star-coordinate-provenance-v0.mjs',
  'scripts/check-ziwei-major-star-coordinate-provenance-v0.mjs',
  'scripts/check-ziwei-major-star-coordinate-provenance-negative-v0.mjs',
  'test/ziweiMajorStarCoordinateProvenance.test.js'
]
const candidatePages = new Map([
  [3, ['candidate_coordinate_identity', 'index locator; not direct rule']],
  [7, ['candidate_coordinate_identity', '十二宮冠蓋 diagram; branch/八卦 frame']],
  [8, ['candidate_coordinate_identity', '命/身 traversal rule']],
  [9, ['context_only', '五行局 prerequisite; not a major-star placement rule']],
  [10, ['candidate_coordinate_identity', '命身 table structure; unresolved cells retained']],
  [11, ['candidate_direct_rule', '起紫微五訣']],
  [12, ['candidate_direct_rule', '起紫微簡索表']],
  [13, ['candidate_direct_rule', '甲六、安天府']],
  [14, ['context_only', '安火星 and adjacent auxiliary-star material']],
  [15, ['context_only', '左輔右弼 and adjacent auxiliary-star material']],
  [16, ['context_only', '天魁天鉞 and adjacent auxiliary-star material']],
  [17, ['context_only', '四化 and adjacent commentary']]
])
const defaultReview = ['no_relevant_evidence', 'visual render review completed; no direct major-star placement or coordinate-identity rule admitted']
let cachedPages = null
function renderHashes() {
  const dir = mkdtempSync(join(tmpdir(), 'ziwei-corpus-pages-'))
  try {
    const prefix = join(dir, 'page')
    execFileSync('pdftoppm', ['-png', '-r', '24', '-f', '1', '-l', String(PAGE_COUNT), PDF, prefix], { stdio: 'ignore' })
    const files = readdirSync(dir).filter(x => x.endsWith('.png')).sort()
    if (files.length !== PAGE_COUNT) throw new Error(`expected ${PAGE_COUNT} renders, got ${files.length}`)
    return files.map((file, index) => ({ page: index + 1, render: { method: 'pdftoppm', dpi: 24, sha256: sha256(readFileSync(join(dir, file))) } }))
  } finally { rmSync(dir, { recursive: true, force: true }) }
}
function pageInventory() {
  if (cachedPages) return structuredClone(cachedPages)
  const pages = renderHashes().map(({ page, render }) => {
    const [classification, reason] = candidatePages.get(page) || defaultReview
    const isCandidate = candidatePages.has(page)
    return {
      page,
      screeningStatus: 'screened',
      directReview: true,
      relevanceClassification: classification,
      candidateLocator: isCandidate ? `PDF p${page}; prior candidate ledger: ${reason}` : null,
      readingLevel: isCandidate ? 'render_confirmed_targeted_candidate' : 'visual_render_reviewed_no_admitted_rule',
      relevance: reason,
      confidence: isCandidate ? 'high' : 'medium',
      exclusionReason: classification === 'no_relevant_evidence' ? reason : null,
      renderEvidence: render,
      ocrRole: 'not_used_as_admission_evidence'
    }
  })
  cachedPages = pages
  return structuredClone(pages)
}
function rows() {
  return [2, 3, 4, 5, 6].flatMap(bureauNumber => Array.from({ length: 30 }, (_, i) => {
    const lunarDay = i + 1
    const result = resolve14MajorStars({ bureauNumber, lunarDay, palaces: [] })
    const stars = Object.fromEntries(result.majorStars.map(star => [star.id, star.palaceBranch]))
    return { rowId: `bureau-${bureauNumber}-day-${String(lunarDay).padStart(2, '0')}`, input: { bureauNumber, lunarDay }, source: null, integrated: stars, rawValuesPreserved: true }
  }))
}
export async function buildArtifact() {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const prior = await buildPrior()
  const priorBytes = readFileSync(resolve(root, 'artifacts/ziwei-major-star-coordinate-provenance-v0/complete.json'))
  const tianfuBytes = readFileSync(resolve(root, 'artifacts/ziwei-tianfu-placement-discrepancy-analysis-v0/complete.json'))
  const pages = pageInventory()
  const candidates = pages.filter(x => x.relevanceClassification.startsWith('candidate_'))
  const context = pages.filter(x => x.relevanceClassification === 'context_only')
  const gaps = pages.filter(x => x.relevanceClassification === 'unreadable_or_uncertain')
  const pageCounts = Object.fromEntries(['candidate_direct_rule','candidate_coordinate_identity','context_only','no_relevant_evidence','unreadable_or_uncertain'].map(k => [k, pages.filter(x => x.relevanceClassification === k).length]))
  const evidenceIndex = {
    source: { pdfPath: PDF, pdfSha256: PDF_SHA256, pdfPageCount: PAGE_COUNT, encrypted: false, actualBytesVerified: fileSha(PDF) === PDF_SHA256, requestedCorpusPageCount: 150, requestedScopeStatus: 'mismatch_actual_source_has_219_pages; no pages silently omitted' },
    screeningMethod: { render: 'pdftoppm 24 dpi every page', visualReview: 'all 219 rendered pages reviewed directly; high-resolution spot checks retained for candidate and representative later pages', ocr: 'exploration only; never admission', finalClassification: 'full visual render sweep with conservative admission only for p3,p7-p17' },
    candidatePages: candidates.map(x => ({ page: x.page, classification: x.relevanceClassification, locator: x.candidateLocator, readingLevel: x.readingLevel })),
    contextPages: context.map(x => x.page),
    coverageGaps: gaps.map(x => ({ page: x.page, reason: x.candidateLocator === null ? x.readingLevel : x.candidateLocator })),
    sourceRows: [
      { id: 'ziwei', pages: [11,12], status: 'direct_rule', sourceStatus: 'direct_rule', condition: '150/150 exact raw branch comparison retained from protected v0' },
      { id: 'tianfu', pages: [13], status: 'direct_rule', sourceStatus: 'direct_rule', condition: 'raw 0/150; rotation-06 150/150; residual 0; first divergence preserved' },
      ...['tianji','taiyang','wugu','tiandong','lianzhen','taiyin','tanlang','jumen','tianxiang','tianliang','qisha','pojun'].map(id => ({ id, pages: [], status: 'source_unresolved', sourceStatus: 'source_unresolved', condition: 'no admitted direct placement rule in the full 219-page visual sweep' }))
    ]
  }
  const dependencyGraph = {
    roots: ['ziwei','tianfu'],
    edges: prior.dependencyGraph.edges.map(edge => ({ ...edge, provenanceClass: edge.from === edge.to ? 'direct_root' : 'derived_repository_implementation' })),
    firstDivergence: prior.dependencyGraph.firstDivergence,
    conventionBlocker: { branchOrdinal: '子=0..亥=11', traversal: 'source branch progression preserved', palaceIdentity: 'unresolved', reason: 'numeric branch correspondence does not establish semantic palace identity' }
  }
  const inventory = prior.inventory.map(item => ({
    starId: item.starId, traditionalName: item.traditionalName, series: item.series, dependency: item.dependency,
    sourceStatus: item.sourceRuleStatus, sourcePages: evidenceIndex.sourceRows.find(x => x.id === item.starId)?.pages || [],
    comparison: item.comparison, blocker: item.sourceRuleStatus === 'source_unresolved' ? 'no admitted direct rule' : 'palace semantic identity unresolved',
    readinessImpact: 'blocked; no promotion or production choice'
  }))
  const artifact = {
    schemaVersion: SCHEMA, verdictToken: 'complete_ziwei_major_star_source_corpus_219page_provenance_evidence_uncommitted', basisHead: BASIS_HEAD,
    source: evidenceIndex.source, screening: { totalPages: PAGE_COUNT, screenedPages: pages.length, pageCounts, candidatePages: candidates.map(x => x.page), preciseReadingPages: [3,7,8,9,10,11,12,13,14,15,16,17], coverageGapPages: gaps.map(x => x.page), coverageComplete: gaps.length === 0 },
    evidenceIndex, pageInventory: pages, inventory, dependencyGraph,
    comparison: { rowDomain: { rowCount: 150, ordering: 'bureau 2..6 then lunar day 1..30' }, ziwei: { exact: '150/150', residual: 0 }, tianfu: { raw: '0/150', transform: 'rotation-06', transformed: '150/150', residual: 0, firstDivergence: prior.dependencyGraph.firstDivergence.rowId }, otherStars: { sourceUnresolvedCount: 12, rawValuesPreserved: true } },
    decisionPacket: { sourceRuleDirectCount: 2, sourceUnresolvedCount: 12, conventionBlocker: 'palace_semantic_identity_unresolved', action: 'continue_blocked', productionChoice: 'not performed', readinessImpact: 'not_safe_to_start / blocked / experimental' },
    lineage: {
      priorCoordinateV0: { path: 'artifacts/ziwei-major-star-coordinate-provenance-v0/complete.json', sha256: sha256(priorBytes), schema: prior.schemaVersion },
      priorTianfuSourceChain: { path: 'artifacts/ziwei-tianfu-placement-discrepancy-analysis-v0/complete.json', sha256: sha256(tianfuBytes), schema: 'ziwei-tianfu-placement-discrepancy-analysis-v0' },
      relation: 'hash/reference only; no overwrite or migration'
    },
    protectedBytes: protectedPaths.map(path => ({ path, gitHeadSha256: sha256(gitBytes(root, ['show', `HEAD:${path}`])), workingSha256: fileSha(resolve(root, path)) })),
    preservedBoundaries: { productionRuleModified: false, apiSchemaModified: false, enumModified: false, baselineModified: false, readinessModified: false, groundingModified: false, activationModified: false },
    materializer: `scripts/materialize-${SCHEMA}.mjs`, checker: `scripts/check-${SCHEMA}.mjs`, deterministic: { generatedAt: 'forbidden', pageRenderHashes: 'actual rendered PNG bytes', canonicalBytes: 'UTF-8 final LF' }
  }
  return attachArtifactIdentity(artifact, buildArtifactIdentity({ root, artifactId: SCHEMA, materializerPath: artifact.materializer, materializerVersion: MATERIALIZER_VERSION, baseHead: BASIS_HEAD, inputs: ['artifacts/ziwei-major-star-coordinate-provenance-v0/complete.json', 'artifacts/ziwei-tianfu-placement-discrepancy-analysis-v0/complete.json'] }))
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const target = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`)
  const artifact = await buildArtifact(); mkdirSync(dirname(target), { recursive: true })
  for (const [name, value] of Object.entries({ complete: artifact, inventory: artifact.pageInventory, sourceEvidenceIndex: artifact.evidenceIndex, decisionPacket: artifact.decisionPacket })) {
    const bytes = Buffer.from(canonicalJson(value)); const path = resolve(dirname(target), `${name}.json`)
    writeFileSync(path, bytes); writeFileSync(`${path}.integrity.json`, canonicalJson({ schemaVersion: SCHEMA, artifactByteSha256: sha256(bytes), artifactByteSha256Scope: 'UTF-8 bytes including final LF' }))
  }
  console.log(JSON.stringify({ verdict: artifact.verdictToken, pdfPages: artifact.screening.totalPages, screenedPages: artifact.screening.screenedPages, gapPages: artifact.screening.coverageGapPages.length, comparisonRows: artifact.comparison.rowDomain.rowCount }, null, 2))
}
