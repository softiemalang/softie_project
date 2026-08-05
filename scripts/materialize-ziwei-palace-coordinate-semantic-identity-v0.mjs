import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'
import { ZIWEI_PALACE_DEFINITIONS } from '../src/ziwei/ziweiContract.js'
import { resolve14MajorStars } from '../src/ziwei/starResolver.js'
import { BRANCHES, RECONFIRMED_SOURCE_TABLE } from '../src/ziwei/tianfuPlacementDiscrepancyRelations.js'

export const SCHEMA = 'ziwei-palace-coordinate-semantic-identity-v0'
export const BASIS_HEAD = 'a4cbf12b0a79c443e823b552631ae9c505e0127d'
export const MATERIALIZER_VERSION = '0.1.0'
const PDF = '/Users/softie/Documents/命-南北山人_紫微斗数全书.pdf'
const PDF_SHA256 = '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023'
const mod = n => (n % 12 + 12) % 12
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])])) : value
export const canonicalJson = value => `${JSON.stringify(stable(value), null, 2)}\n`
const git = (root, args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8' }).trim()
const fileHash = async (root, path) => sha256(await readFile(resolve(root, path)))
const isCommit = value => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value)

export function validateObservedHead({ root, observedHead, currentHead = git(root, ['rev-parse', 'HEAD']) }) {
  if (!isCommit(observedHead)) throw new Error('observedHead must be an explicit 40-hex commit')
  try { git(root, ['cat-file', '-e', `${observedHead}^{commit}`]) } catch { throw new Error(`observedHead is not a resolvable commit: ${observedHead}`) }
  try { git(root, ['merge-base', '--is-ancestor', BASIS_HEAD, observedHead]) } catch { throw new Error('basisHead must be an ancestor of or equal to observedHead') }
  try { git(root, ['merge-base', '--is-ancestor', observedHead, currentHead]) } catch { throw new Error('observedHead must be an ancestor of or equal to current HEAD') }
  return { observedHead, currentHead }
}

function candidates() {
  const out = [{ id: 'identity', family: 'identity', definition: 'source ordinal = production ordinal', predict: p => p }]
  for (let offset = 1; offset < 12; offset += 1) out.push({ id: `rotation-${String(offset).padStart(2, '0')}`, family: 'fixed_rotation', definition: `source = production + ${offset} (mod 12)`, predict: p => mod(p + offset) })
  for (let offset = 0; offset < 12; offset += 1) out.push({ id: `reflection-rotation-${String(offset).padStart(2, '0')}`, family: 'reflection_rotation', definition: `source = ${offset} - production (mod 12)`, predict: p => mod(offset - p) })
  out.push({ id: 'inverse-mapping', family: 'inverse_mapping', definition: 'source = 10 - production (mod 12)', predict: p => mod(10 - p) })
  for (let inputOffset = 0; inputOffset < 12; inputOffset += 1) for (let outputOffset = 0; outputOffset < 12; outputOffset += 1) {
    out.push({ id: `enum-relabel-in-${String(inputOffset).padStart(2, '0')}-out-${String(outputOffset).padStart(2, '0')}`, family: 'enum_relabel', definition: `relabel input +${inputOffset}, output -${outputOffset}`, predict: p => mod(p + inputOffset - outputOffset) })
  }
  out.push({ id: 'source-base-direction', family: 'source_base_direction', definition: 'source = mod(4 - integrated Ziwei ordinal)', predict: (_, row) => mod(4 - row.production.raw.ziweiOrdinal), inputBased: true })
  return out
}

function diagramPosition(ordinal) { return mod(ordinal + 7) }
function diagramLabelAt(position) { return BRANCHES[mod(position - 7)] }
function sourceRef(id, page, role, region, reading, identityEvidence) {
  return { id, page, role, region, reading, identityEvidence, pdf: { path: PDF, pages: 219, sha256: PDF_SHA256 } }
}

const sourceRefs = [
  sourceRef('source-p7-shi-er-gong-guan-gai', 7, 'direct_diagram_witness', { renderDpi: 110, bboxPx: { x: 2460, y: 290, width: 1840, height: 2040 }, renderedFileSha256: 'ebbdcf1a35d21e0fcf4339182af2df3ad290c279b8627bab9dc7f80156083bac' }, '12-cell perimeter diagram visibly labels 巳午未申 / 酉戌 / 亥子丑寅 / 卯辰; clockwise physical sequence is recorded without assigning palace names.', 'branch labels and diagram positions only; no palace-name mapping'),
  sourceRef('source-p8-ming-shen-rule', 8, 'direct_traversal_witness', { renderDpi: 110, bboxPx: { x: 180, y: 180, width: 2060, height: 2700 }, renderedFileSha256: 'd740c6ed5191e516f40ee61bda7f95ff2081954b21b091c22bee9c0249e8acea' }, '命宮逆數 and 身宮順數 are legible from 寅起月 wording; branch traversal vocabulary is retained.', 'direction and branch traversal only; no shared semantic identity'),
  sourceRef('source-p11-ziwei-five-jue', 11, 'direct_star_coordinate_witness', { renderDpi: 110, bboxPx: { x: 170, y: 140, width: 2050, height: 2850 }, renderedFileSha256: '3768f215e3736ebb1e06d76fb93fa8c304b09c74fac480d14c41aafe7f9355e9' }, '起紫微五訣 gives 寅 base and branch progression rules.', 'star-to-branch coordinate rule; no palace-name mapping'),
  sourceRef('source-p12-ziwei-jian-suo', 12, 'direct_lookup_table_witness', { renderDpi: 110, bboxPx: { x: 190, y: 120, width: 2050, height: 2900 }, renderedFileSha256: 'e22ec2dab2d1b2c82df72e030cb7a254e65f5372e8a6a2ac7aa00634c9e06d9d' }, '起紫微簡索表 supplies the 5 bureaus × 30 days = 150-row Ziwei branch table.', 'lookup values and table direction only; no shared semantic identity'),
  sourceRef('source-p13-tianfu-table', 13, 'direct_lookup_table_witness', { renderDpi: 110, bboxPx: { x: 2420, y: 180, width: 1900, height: 2750 }, renderedFileSha256: '97542bc948edb8e9f0c0dcfd316940cc5d2cf04001006e54ab38ea8422aeeddd' }, '甲六、安天府 gives the 12-row 紫微→天府 branch table in source-table order.', 'star-to-branch coordinate rule; no shared palace-name mapping'),
]

function rowDomain() {
  const integrated = Array.from({ length: 5 }, (_, i) => i + 2).flatMap(bureauNumber => Array.from({ length: 30 }, (_, i) => {
    const lunarDay = i + 1
    const result = resolve14MajorStars({ bureauNumber, lunarDay, palaces: [] })
    const byId = Object.fromEntries(result.majorStars.map(star => [star.id, star.palaceBranch]))
    return { rowId: `bureau-${bureauNumber}-day-${String(lunarDay).padStart(2, '0')}`, input: { bureauNumber, lunarDay }, production: { ziwei: byId.ziwei, tianfu: byId.tianfu } }
  }))
  const sourceByZiwei = Object.fromEntries(RECONFIRMED_SOURCE_TABLE)
  return integrated.map(row => {
    const pZiwei = BRANCHES.indexOf(row.production.ziwei); const pTianfu = BRANCHES.indexOf(row.production.tianfu)
    const sTianfu = sourceByZiwei[row.production.ziwei]; const sTianfuOrdinal = BRANCHES.indexOf(sTianfu)
    return {
      rowId: row.rowId, input: row.input,
      contexts: { rawOrdinal: 'zero_based_branch_ordinal', earthlyBranchLabel: '子=0..亥=11', diagramPosition: 'p7 physical perimeter slot; not palace identity', palaceName: 'repository_default_ordinal_only', sourceDirection: 'p13 source-table order', productionDirection: 'repository series/resolver convention' },
      source: { raw: { tianfuBranch: sTianfu, ordinal: sTianfuOrdinal }, diagram: { position: diagramPosition(sTianfuOrdinal), labelAtPosition: diagramLabelAt(diagramPosition(sTianfuOrdinal)) }, palaceName: { value: null, status: 'unresolved_semantic_identity' }, direction: 'source-table-order' },
      production: { raw: { ziweiBranch: row.production.ziwei, tianfuBranch: row.production.tianfu, ziweiOrdinal: pZiwei, tianfuOrdinal: pTianfu }, diagram: { position: diagramPosition(pTianfu), labelAtPosition: diagramLabelAt(diagramPosition(pTianfu)) }, palaceName: { defaultOrdinal: ZIWEI_PALACE_DEFINITIONS[pTianfu]?.name ?? null, status: 'repository_convention_only' }, direction: 'integrated_rule; no authoritative source identity' },
      rawEquality: sTianfu === row.production.tianfu,
    }
  })
}

function compareCandidates(rows) {
  return candidates().map(candidate => {
    const matches = rows.map(row => (candidate.inputBased ? candidate.predict(null, row) : candidate.predict(row.production.raw.tianfuOrdinal)) === row.source.raw.ordinal)
    const first = matches.findIndex(value => !value)
    return { candidateId: candidate.id, family: candidate.family, definition: candidate.definition, testedRowCount: rows.length, matchCount: matches.filter(Boolean).length, mismatchCount: matches.length - matches.filter(Boolean).length, exact: first === -1, firstDivergence: first === -1 ? null : { rowIndex: first, rowId: rows[first].rowId } }
  })
}

async function buildArtifact({ observedHead } = {}) {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const currentHead = git(root, ['rev-parse', 'HEAD'])
  validateObservedHead({ root, observedHead, currentHead })
  const pdfBytes = await readFile(PDF)
  if (sha256(pdfBytes) !== PDF_SHA256) throw new Error('authoritative PDF SHA-256 mismatch')
  const rows = rowDomain(); const relationResults = compareCandidates(rows)
  const exactFitIds = relationResults.filter(x => x.exact).map(x => x.candidateId)
  const repositoryInventory = [
    { path: 'src/ziwei/ziweiContract.js', role: 'production palace enum/name/defaultIndex', facts: ['12 definitions', 'defaultIndex 0..11', 'no branch-to-palace map'] },
    { path: 'src/ziwei/ziweiResolver.js', role: 'production chart layout', facts: ['mingGong branch anchor', 'shenGong branch marker', 'palaces index increments branch ordinal', 'comment says clockwise'] },
    { path: 'src/ziwei/starPlacementRules.js', role: 'production star coordinate rules', facts: ['BRANCHES 子..亥', 'Tianfu mod(10 - ziwei)', 'series offsets'] },
    { path: 'src/ziwei/starResolver.js', role: 'production consumer lookup', facts: ['palace lookup matches caller-provided palaces by branch', 'does not define canonical branch-to-palace identity'] },
    { path: 'src/ziwei/ziweiPalaceContext.js', role: 'production positional consumer', facts: ['array index drives opposite/trine context'] },
    { path: 'src/ziwei/palaceRelationRules.js', role: 'production positional relation rules', facts: ['opposite +6', 'trine +4,+8'] },
    { path: 'src/ziwei/externalZiweiFixtures.js', role: 'fixture source metadata', facts: ['edition pending exact review', 'not admitted as independent source identity'] },
    { path: 'artifacts/ziwei-major-star-coordinate-provenance-v0/complete.json', role: 'prior coordinate evidence', facts: ['source/integrated contexts separated', 'semantic identity unresolved'] },
    { path: 'artifacts/ziwei-tianfu-convention-provenance-v0/complete.json', role: 'prior Tianfu transform evidence', facts: ['rotation-06 150/150', 'source-base-direction 150/150', 'raw divergence preserved'] },
    { path: 'artifacts/ziwei-system-evidence-readiness-coverage-map-v0/complete.json', role: 'coverage/blocker map', facts: ['P0 palace semantic identity blocker', 'readiness blocked'] },
  ]
  for (const item of repositoryInventory) item.sha256 = await fileHash(root, item.path)
  const sourceWitnessIndex = { source: { path: PDF, pages: 219, sha256: PDF_SHA256, actualBytesVerified: true }, sourceRefs, diagram: { positionBasis: 'p7 observed perimeter slots', clockwiseSequence: ['巳','午','未','申','酉','戌','亥','子','丑','寅','卯','辰'], semanticIdentity: 'unresolved' }, priorScreening: { screenedPages: 219, screeningModified: false, sourceCorpusArtifact: 'artifacts/ziwei-major-star-source-corpus-provenance-v0/complete.json' } }
  const candidateMatrix = { candidateCount: relationResults.length, domain: { rowCount: rows.length, bureaus: [2,3,4,5,6], lunarDays: [1,30], ordering: 'bureau ascending then lunarDay ascending' }, relationResults, exactFitIds, eliminationRule: 'exact requires all 150 rows; no sample inference' }
  const claims = [
    { id: 'direct_source_witness', status: 'evidence_sufficient_within_scope', statement: 'p7/p8/p11-p13 provide page-region witnesses for branch labels, diagram positions, traversal wording, and star-to-branch tables.', sourceRefs: sourceRefs.map(x => x.id), semanticLimit: 'does not establish palace semantic identity' },
    { id: 'repository_convention', status: 'repository_convention_only', statement: 'Production exposes ordinal 0..11, default palace names, branch-anchored resolution, and positional relation arithmetic.', evidence: repositoryInventory.map(x => x.path), semanticLimit: 'repository convention is not traditional authority' },
    { id: 'exact_transform', status: 'exact_transform_only', statement: 'Across all 150 related Tianfu rows, rotation-06 and source-base-direction are exact numeric transforms.', evidence: ['candidateMatrix.relationResults'], semanticLimit: 'transform equivalence is not semantic identity' },
    { id: 'semantic_identity', status: 'blocked_semantic_identity_insufficient', statement: 'No admitted witness directly maps source branch/diagram positions to production palace names and ordinal semantics.', evidence: ['sourceWitnessIndex.sourceRefs', 'repositoryInventory', 'candidateMatrix'], semanticLimit: 'must remain unresolved' },
  ]
  const relationGraph = { nodes: [...claims.map(x => x.id), ...sourceRefs.map(x => x.id), ...repositoryInventory.map(x => x.path), 'blocker-palace-semantic-identity'], edges: [
    ...sourceRefs.map(x => ({ from: x.id, to: 'direct_source_witness', relation: 'supports' })),
    ...repositoryInventory.map(x => ({ from: x.path, to: 'repository_convention', relation: 'supports' })),
    { from: 'exact_transform', to: 'semantic_identity', relation: 'does_not_promote' },
    { from: 'semantic_identity', to: 'blocker-palace-semantic-identity', relation: 'blocked_by' },
  ] }
  const blockerRegistry = [{ id: 'blocker-palace-semantic-identity', priority: 'P0', status: 'blocked', decision: 'continue_blocked', affected: ['palace-layout','ming-shen','tianfu-placement','fourteen-major-stars','palace-relations'], required: 'authoritative shared mapping of 12 palace names, branches, diagram slots, ordinal/order, and direction', sourceRefs: ['source-p7-shi-er-gong-guan-gai','source-p8-ming-shen-rule'], acceptance: 'immutable scan/page/folio witness with readable glyphs and complete mapping; no OCR-only or preview-only evidence' }]
  const acquisition = { priority: 'P0', target: 'palace coordinate semantic identity', requestedMaterial: [
    { need: '12궁 label-to-branch correspondence', keywords: ['紫微斗數 十二宮 宮位 地支','十二宮冠蓋 宮名','命宮 身宮 十二宮 表'], minimumCapture: 'complete p7 diagram plus adjacent explanatory leaf; all 12 cells and labels in one continuous capture' },
    { need: '命宮·身宮 anchor and direction', keywords: ['定命身二宮','命宮逆數 身宮順數','寅起月'], minimumCapture: 'complete p8 rule text and any diagram/table defining the same coordinate frame' },
    { need: 'edition and scan identity', keywords: ['書名 作者 版本 刊年 卷一','紫微斗數全書 南北山人'], minimumCapture: 'title/edition/folio or page metadata plus original scan bytes' },
  ], metadata: ['title','author/editor','edition/print year','repository/call number','volume','printed page/folio','scan settings','file SHA-256','access date'], accept: ['actual immutable scan bytes','page/folio identity','complete readable glyph/layout/table boundary','mapping independently reviewable'], reject: ['preview/catalog only','OCR only','partial crop hiding direction or labels','edition/source identity inferred','manual exception or normalized transcription'], order: ['P0 palace identity mapping','P0 source identity/edition linkage','P1 independent oracle comparison','P2 unresolved star rules'] }
  const handoff = { verdictToken: 'complete_ziwei_palace_coordinate_semantic_identity_evidence_uncommitted', humanReviewRequired: true, reviewQuestions: ['Does p7 diagram actually assert palace names or only branch/compass positions?','Does p8 use the same coordinate frame as the 12-palace semantic labels?','Can any exact transform be rejected or accepted semantically from the new witness without changing production?'], reviewerMustPreserve: ['raw branch/ordinal values','all 170 candidates and 150 rows','first divergences','sourceRefs and hashes','blocked semantic verdict'], forbidden: ['production choice','enum/API/schema change','readiness activation','confidence score','interpretation'] }
  const artifactBase = { schemaVersion: SCHEMA, verdictToken: 'complete_ziwei_palace_coordinate_semantic_identity_evidence_uncommitted', basisHead: BASIS_HEAD, sourceWitnessIndex, repositoryConventionInventory: repositoryInventory, candidateMatrix, rows, claims, relationGraph, blockerRegistry, sourceAcquisitionBrief: acquisition, humanReviewHandoff: handoff, conclusions: { productionOrdinalToBranch: 'production uses caller/chart branch anchor plus 0..11 ordinal progression; no globally authoritative palace-name identity', sourceDiagram: 'p7 branch/diagram sequence recorded; palace-name meaning unresolved', mingShenSharedFrame: 'directly unresolved; p8 traversal evidence is only indirect support', rotation06: '150/150 numeric exact transform; simple coordinate re-expression cannot be promoted to semantic identity from current corpus', mathematicalStatus: ['150/150 full-row transform comparison', '0/150 raw Tianfu identity', 'first divergence preserved per candidate'], semanticStatus: 'blocked_semantic_identity_insufficient' }, readinessImpact: { stableClaimCount: 0, readiness: 'not_safe_to_start', grounding: 'blocked', activation: 'experimental', productionMutation: false, contractMutation: false }, immutableExistingBytes: [], materializer: `scripts/materialize-${SCHEMA}.mjs`, checker: `scripts/check-${SCHEMA}.mjs`, observedHead, deterministic: { generatedAt: 'forbidden', candidateCount: relationResults.length, rowCount: rows.length, hashes: 'UTF-8 bytes including final LF' } }
  const protectedPaths = ['src/ziwei/ziweiContract.js','src/ziwei/ziweiResolver.js','src/ziwei/starPlacementRules.js','src/ziwei/starResolver.js','src/ziwei/palaceRelationRules.js','artifacts/ziwei-major-star-coordinate-provenance-v0/complete.json','artifacts/ziwei-tianfu-convention-provenance-v0/complete.json','artifacts/ziwei-system-evidence-readiness-coverage-map-v0/complete.json']
  artifactBase.immutableExistingBytes = await Promise.all(protectedPaths.map(async path => ({ path, sha256: await fileHash(root, path) })))
  return attachArtifactIdentity(artifactBase, buildArtifactIdentity({ root, artifactId: SCHEMA, materializerPath: artifactBase.materializer, materializerVersion: MATERIALIZER_VERSION, baseHead: BASIS_HEAD, inputs: protectedPaths }))
}

export { buildArtifact, candidates }

function parseCliArgs(argv) {
  const observedIndex = argv.indexOf('--observed-head')
  if (observedIndex < 0 || !argv[observedIndex + 1]) throw new Error('--observed-head <40-hex-commit> is required; current HEAD fallback is forbidden')
  const positional = argv.filter((value, index) => index !== observedIndex && index !== observedIndex + 1)
  if (positional.length > 1) throw new Error('only one output path is allowed')
  return { observedHead: argv[observedIndex + 1], target: resolve(positional[0] || `artifacts/${SCHEMA}/complete.json`) }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const { observedHead, target } = parseCliArgs(process.argv.slice(2))
  const artifact = await buildArtifact({ observedHead }); const dir = dirname(target); await mkdir(dir, { recursive: true })
  const outputs = { complete: artifact, sourceWitnessIndex: artifact.sourceWitnessIndex, repositoryConventionInventory: artifact.repositoryConventionInventory, candidateMatrix: artifact.candidateMatrix, claimLedger: artifact.claims, relationGraph: artifact.relationGraph, blockerRegistry: artifact.blockerRegistry, sourceAcquisitionBrief: artifact.sourceAcquisitionBrief, humanReviewHandoff: artifact.humanReviewHandoff }
  for (const [name, value] of Object.entries(outputs)) { const bytes = Buffer.from(canonicalJson(value)); const path = name === 'complete' ? target : resolve(dir, `${name}.json`); await writeFile(path, bytes); await writeFile(`${path}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(bytes), artifactByteSha256Scope: 'UTF-8 bytes including final LF' }, null, 2)}\n`) }
  console.log(JSON.stringify({ verdict: artifact.verdictToken, sourceWitnessCount: sourceRefs.length, candidateCount: artifact.candidateMatrix.candidateCount, exactFitIds: artifact.candidateMatrix.exactFitIds, rawTianfuIdentity: `${artifact.rows.filter(x => x.rawEquality).length}/${artifact.rows.length}`, rotation06: artifact.candidateMatrix.relationResults.find(x => x.candidateId === 'rotation-06'), semantic: artifact.conclusions.semanticStatus }, null, 2))
}
