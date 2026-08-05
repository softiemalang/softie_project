import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'
import { resolve14MajorStars } from '../src/ziwei/starResolver.js'
import { ZIWEI_SERIES_OFFSETS, TIANFU_SERIES_OFFSETS } from '../src/ziwei/starPlacementRules.js'
import { enumerateSourceInputs as enumerateZiweiSource } from '../src/ziwei/ziweiStarPlacementCleanRuleSeedPilot.js'
import { BRANCHES, RECONFIRMED_SOURCE_TABLE } from '../src/ziwei/tianfuPlacementDiscrepancyRelations.js'

export const SCHEMA = 'ziwei-major-star-coordinate-provenance-v0'
export const BASIS_HEAD = 'd5f2853ca6a995301d01129f45d6a41bf67328e5'
export const MATERIALIZER_VERSION = '0.1.0'
const mod = n => (n % 12 + 12) % 12
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])])) : value
export const canonicalJson = value => `${JSON.stringify(stable(value), null, 2)}\n`
const git = (root, args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8' }).trim()
const fileHash = async (root, path) => sha256(await readFile(resolve(root, path)))

const SOURCE_ARTIFACT = 'artifacts/ziwei-ziwei-star-placement-clean-rule-seed-acceptance-v0/complete.json'
const TIANFU_ARTIFACT = 'artifacts/ziwei-tianfu-placement-discrepancy-analysis-v0/complete.json'
const PALACE_SOURCES = [
  { id: 'source-p11-five-jue', role: 'direct_coordinate_progression', locator: 'PDF p11 / printed 三十一 / 起紫微五訣', pages: [11], render: { file: 'p11.png', sha256: 'e10b1b30c7928b2cc8e3afcbf3efec3c8d0cbdc9434233a939677869b8402201', targetHalf: 'left' }, reading: '五行局별 初一 위치와 순행·역행을 지지 branch 순서로 읽음', identityEvidence: 'branch progression only; no 命宮/十二宮 label mapping' },
  { id: 'source-p12-jian-suo', role: 'direct_lookup_table', locator: 'PDF p12 / printed 三十三 / 起紫微簡索表', pages: [12], render: { file: 'p12.png', sha256: '0cc8f8a56ce4b839f300a141f8fe9aa6f035801fda0e7464a3acab0e8af363b1', targetHalf: 'left' }, reading: '五行局 열 × 初一..三十 행의 150개 紫微 결과를 표 방향 그대로 전사', identityEvidence: 'branch tokens and progression only; palace semantic identity not stated' },
  { id: 'source-p13-tianfu', role: 'direct_lookup_table', locator: 'PDF p13 / printed 三十四 / 甲六、安天府 / right scanned leaf', pages: [13], render: { file: 'p13-013.png', sha256: '4fa29afdbc09f8c7bff9c1e510aef603a47c9dd60fa5d2fc78c26baa5e444df9', cropSha256: '8f0bc209cac98a38fdd2bdfa0166151ae3ffcb1ee20b77c5a11636d12e05c274', crop: 'right-page bounding crop; 4000x5000 at offset x=4300,y=500' }, reading: '紫微→天府 two-column table, top-to-bottom source transcription', identityEvidence: 'source table gives star-to-branch tokens; no shared palace-coordinate declaration' },
  { id: 'source-p8-p10-ming-shen', role: 'indirect_coordinate_progression', locator: 'PDF p8/p10 / printed 二十五/二十九', pages: [8, 10], render: null, reading: '寅起月、命宮逆數、身宮順數 and branch order used by existing source pilot', identityEvidence: 'supports traversal vocabulary but does not establish branch token = production palace identity' },
]

const directStars = new Map([
  ['ziwei', { sourceStatus: 'direct_rule', sourceArtifact: SOURCE_ARTIFACT, sourceLocator: 'source-p11-five-jue + source-p12-jian-suo', sourceRule: 'base 寅; quotient/remainder; odd remainder reverse, even forward; 150-row table' }],
  ['tianfu', { sourceStatus: 'direct_rule', sourceArtifact: TIANFU_ARTIFACT, sourceLocator: 'source-p13-tianfu', sourceRule: 'source table: 紫微 子..亥 -> 天府 辰..巳; normalized output = mod(4 - input)' }],
])
const offsets = [...ZIWEI_SERIES_OFFSETS.map(x => ({ ...x, series: 'ziwei', dependency: 'ziwei' })), ...TIANFU_SERIES_OFFSETS.map(x => ({ ...x, series: 'tianfu', dependency: 'tianfu' }))]

function candidateCount() { return 1 + 11 + 12 + 1 + 144 + 1 }
function relationCandidates() {
  const out = [{ id: 'identity', family: 'identity', predict: p => p }]
  for (let i = 1; i < 12; i++) out.push({ id: `rotation-${String(i).padStart(2, '0')}`, family: 'fixed_rotation', predict: p => mod(p + i) })
  for (let i = 0; i < 12; i++) out.push({ id: `reflection-rotation-${String(i).padStart(2, '0')}`, family: 'reflection_rotation', predict: p => mod(i - p) })
  out.push({ id: 'inverse-mapping', family: 'inverse_mapping', predict: p => mod(10 - p) })
  for (let i = 0; i < 12; i++) for (let o = 0; o < 12; o++) out.push({ id: `enum-relabel-in-${String(i).padStart(2, '0')}-out-${String(o).padStart(2, '0')}`, family: 'enum_relabel', predict: p => mod(p + i - o) })
  out.push({ id: 'source-base-direction', family: 'source_base_direction', predict: z => mod(4 - z), inputBased: true })
  return out
}

function compare(sourceRows, integratedRows) {
  return relationCandidates().map(candidate => {
    const booleans = sourceRows.map((source, i) => {
      const integrated = integratedRows[i]
      const input = candidate.inputBased ? integrated.input : integrated.output
      return candidate.predict(input) === source.output
    })
    const matchCount = booleans.filter(Boolean).length
    return { candidateId: candidate.id, family: candidate.family, testedRowCount: booleans.length, matchCount, mismatchCount: booleans.length - matchCount, exact: matchCount === booleans.length }
  })
}

function palaceModel() {
  return {
    axes: ['palaceIdentity', 'earthlyBranchLabel', 'zeroBasedOrdinal', 'traversalDirection', 'basePalace', 'rotation', 'relabel'],
    branchEnum: BRANCHES.map((label, ordinal) => ({ label, ordinal })),
    source: { conventionStatus: 'partially_defined', branchLabelOrder: '子,丑,寅,卯,辰,巳,午,未,申,酉,戌,亥', zeroBasedOrdinal: 'branch enum only', traversal: 'source-specific rule; 紫微 base 寅, 天府 source table order / normalized base 辰', palaceIdentity: 'unresolved', evidenceGap: 'secured source locators show branch tokens and movement, but no authoritative mapping from tokens to the repository palace identities' },
    integrated: { conventionStatus: 'partially_defined', branchLabelOrder: '子,丑,寅,卯,辰,巳,午,未,申,酉,戌,亥', zeroBasedOrdinal: 'BRANCHES index', traversal: '紫微 series reverse offsets; 天府 series forward offsets', basePalace: '紫微 寅(index 2); 天府 formula axis-sum 寅+申(index 10)', palaceIdentity: 'unresolved', evidenceGap: 'starResolver matches palaceId/name by supplied palace.branch; no canonical branch-to-palace-label map is declared' },
    transformations: { rotation06: 'source Tianfu ordinal = integrated Tianfu ordinal + 6 (mod 12)', sourceBaseDirection: 'source Tianfu ordinal = mod(4 - integrated Ziwei ordinal)', semanticRule: 'numeric and coordinate relations never promote palace identity' },
  }
}

async function provenance(root) {
  const starFile = 'src/ziwei/starPlacementRules.js'; const resolverFile = 'src/ziwei/starResolver.js'; const contractFile = 'src/ziwei/ziweiContract.js'; const contextFile = 'src/ziwei/ziweiPalaceContext.js'; const relationFile = 'src/ziwei/palaceRelationRules.js'
  const introduced = '7d2fb8fccc65ab34efea93ea2d16f94fb526417c'
  return {
    currentHead: BASIS_HEAD,
    files: [
      { path: starFile, sha256: await fileHash(root, starFile), evidence: [{ symbol: 'BRANCHES', lines: '17', fact: '子..亥 enum' }, { symbol: 'calculateZiweiBranch', lines: '22-42', fact: '寅 base and remainder direction' }, { symbol: 'calculateTianfuBranch', lines: '47-52', fact: 'mod(10 - ziweiIndex)' }, { symbol: 'ZIWEI_SERIES_OFFSETS', lines: '56-63', fact: 'six integrated offsets' }, { symbol: 'TIANFU_SERIES_OFFSETS', lines: '67-76', fact: 'eight integrated offsets' }] },
      { path: resolverFile, sha256: await fileHash(root, resolverFile), evidence: [{ symbol: 'resolve14MajorStars', lines: '17-100', fact: '14-star call chain' }, { symbol: 'palaceLookup', lines: '54,72', fact: 'palaces.find(p => p.branch === branch)' }] },
      { path: contractFile, sha256: await fileHash(root, contractFile), evidence: [{ symbol: 'ZIWEI_PALACE_DEFINITIONS', lines: '10-21', fact: '12 palace labels/defaultIndex; no branch map' }] },
      { path: contextFile, sha256: await fileHash(root, contextFile), evidence: [{ symbol: 'buildZiweiPalaceContexts', lines: '18-24', fact: 'palace array index drives opposite/trine contexts' }] },
      { path: relationFile, sha256: await fileHash(root, relationFile), evidence: [{ symbol: 'calculateOppositePalaceIndex/calculateTrinePalaceIndices', lines: '1-40', fact: 'positional palace relations' }] },
    ],
    history: [{ commit: introduced, subject: git(root, ['show', '-s', '--format=%s', introduced]), date: git(root, ['show', '-s', '--format=%aI', introduced]), role: 'first integrated 14-star rule/resolver introduction', sourceAuthority: false }],
    authorityBoundary: { sourceEditionCitationInGit: false, palaceCoordinateConventionCitationInGit: false, sourceToIntegratedPalaceIdentity: 'not established' },
  }
}

async function buildArtifact() {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const sourceZiwei = enumerateZiweiSource(); const sourceTianfu = RECONFIRMED_SOURCE_TABLE.map(([ziweiBranch, tianfuBranch], index) => ({ rowId: `ziwei-${ziweiBranch}-tianfu`, orderingKey: String(index).padStart(2, '0'), input: { ziweiBranch }, output: { branch: tianfuBranch } }))
  const integrated = Array.from({ length: 5 }, (_, i) => i + 2).flatMap(bureauNumber => Array.from({ length: 30 }, (_, i) => {
    const lunarDay = i + 1; const result = resolve14MajorStars({ bureauNumber, lunarDay, palaces: [] }); const byId = Object.fromEntries(result.majorStars.map(star => [star.id, star.palaceBranch]))
    return { rowId: `bureau-${bureauNumber}-day-${String(lunarDay).padStart(2, '0')}`, input: { bureauNumber, lunarDay }, inputBranch: result.ziweiBranch, outputs: byId }
  }))
  const ziweiRows = sourceZiwei.map((row, i) => ({ rowId: row.rowId, input: row.input, source: row.output.branch, integrated: integrated[i].outputs.ziwei, rawEquality: row.output.branch === integrated[i].outputs.ziwei }))
  const tianfuRows = sourceTianfu.flatMap(source => integrated.filter(row => row.inputBranch === source.input.ziweiBranch).map(row => ({ rowId: row.rowId, input: row.input, source: source.output.branch, integrated: row.outputs.tianfu, rawEquality: source.output.branch === row.outputs.tianfu, rotation06: source.output.branch === BRANCHES[mod(BRANCHES.indexOf(row.outputs.tianfu) + 6)] })))
  const sourceRoot = { ziwei: sourceZiwei.map(x => x.output.branch), tianfu: sourceTianfu }
  const integratedRoot = { ziwei: integrated.map(x => x.outputs.ziwei), tianfu: integrated }
  const sourceTianfuByZiwei = sourceTianfu.reduce((m, x) => { m[x.input.ziweiBranch] = x.output.branch; return m }, {})
  const tianfuIntegratedRows = integrated.map(x => ({ input: BRANCHES.indexOf(x.inputBranch), output: BRANCHES.indexOf(x.outputs.tianfu) }))
  const tianfuSourceRows = integrated.map(x => ({ input: BRANCHES.indexOf(x.inputBranch), output: BRANCHES.indexOf(sourceTianfuByZiwei[x.inputBranch]) }))
  const relationSummaries = { ziwei: { candidateCount: candidateCount(), results: compare(ziweiRows.map(x => ({ output: BRANCHES.indexOf(x.source) })), ziweiRows.map(x => ({ input: BRANCHES.indexOf(integrated.find(y => y.rowId === x.rowId).inputBranch), output: BRANCHES.indexOf(x.integrated) }))) }, tianfu: { candidateCount: candidateCount(), results: compare(tianfuSourceRows, tianfuIntegratedRows) } }
  const sourceWitness = JSON.parse(await readFile(resolve(root, SOURCE_ARTIFACT), 'utf8')); const tianfuWitness = JSON.parse(await readFile(resolve(root, TIANFU_ARTIFACT), 'utf8'))
  const inventory = offsets.map(star => { const direct = directStars.get(star.id); const sourceCoverage = direct ? (star.id === 'ziwei' ? '150/150 exact raw branch comparison' : '12-row source table; 150/150 full-domain transform relation') : 'not_run: source rule not securely transcribed'; return { starId: star.id, traditionalName: star.name, series: star.series, dependency: star.dependency, integratedOffset: star.offset, sourceRuleStatus: direct?.sourceStatus || 'source_unresolved', sourceLocator: direct?.sourceLocator || null, sourceRule: direct?.sourceRule || null, comparison: direct ? { status: 'coordinate_only', coverage: sourceCoverage, semanticVerdict: 'blocked_semantic_identity_insufficient' } : { status: 'source_unresolved', coverage: '0/150 comparable source rows', semanticVerdict: 'source_unresolved' }, readinessImpact: 'blocked_by_coordinate_identity_or_missing_source_rule' } })
  const artifactBase = { schemaVersion: SCHEMA, verdictToken: 'complete_ziwei_major_star_coordinate_provenance_readiness_evidence_uncommitted', basisHead: BASIS_HEAD, sourceWitness: { pdfPath: sourceWitness.source.pdfPath, pdfSha256: sourceWitness.source.pdfSha256, pdfPageCount: sourceWitness.source.pdfPageCount, encrypted: sourceWitness.source.encrypted, locators: PALACE_SOURCES, sourceArtifacts: [{ path: SOURCE_ARTIFACT, artifactByteSha256: sha256(await readFile(resolve(root, SOURCE_ARTIFACT))), verdictToken: sourceWitness.verdictToken }, { path: TIANFU_ARTIFACT, artifactByteSha256: sha256(await readFile(resolve(root, TIANFU_ARTIFACT))), verdictToken: tianfuWitness.verdictToken }], ocr: 'exploration_only_not_canonical', renderAndCropHashes: 'preserved from prior source artifacts; PDF/render not copied into Git' }, provenance: await provenance(root), coordinateConvention: palaceModel(), inventory, dependencyGraph: { nodes: ['ziwei','tianfu',...offsets.filter(x => !['ziwei','tianfu'].includes(x.id)).map(x => x.id)], edges: offsets.map(x => ({ from: x.dependency, to: x.id, relation: 'placement offset from upstream anchor' })), roots: ['ziwei','tianfu'], firstDivergence: { chain: 'tianfu', rowId: 'bureau-2-day-01', stage: 'tianfu', source: '卯', integrated: '酉', relation: 'rotation-06/source-base-direction', semanticVerdict: 'blocked_semantic_identity_insufficient' } }, comparison: { domain: { rowCount: 150, bureaus: [2,3,4,5,6], lunarDays: [1,30], ordering: 'bureau ascending then lunarDay ascending' }, roots: { ziwei: { rows: ziweiRows, rawMatchCount: ziweiRows.filter(x => x.rawEquality).length, rawMismatchCount: ziweiRows.filter(x => !x.rawEquality).length, firstDivergence: null, relation: relationSummaries.ziwei }, tianfu: { rows: tianfuRows, rawMatchCount: tianfuRows.filter(x => x.rawEquality).length, rawMismatchCount: tianfuRows.filter(x => !x.rawEquality).length, rotation06MatchCount: tianfuRows.filter(x => x.rotation06).length, rotation06ResidualCount: tianfuRows.filter(x => !x.rotation06).length, firstDivergence: 'bureau-2-day-01', relation: relationSummaries.tianfu } }, otherStars: { status: 'source_unresolved', materializedIntegratedRows: integrated.length, perStarRows: integrated.length, rawValuesPreserved: true } }, claims: { stableClaimCount: 0, claims: [{ id: 'branch_coordinate_numeric_contract', status: 'bounded', statement: 'Source and integrated artifacts use the explicit 子=0..亥=11 branch label/ordinal model for numeric comparison.', evidence: ['coordinateConvention', 'sourceWitness.sourceArtifacts'] }, { id: 'ziwei_numeric_reconciliation', status: 'exact_coordinate_only', statement: '紫微 is 150/150 raw branch exact in the secured source evaluator comparison.', evidence: ['comparison.roots.ziwei'] }, { id: 'tianfu_transform_relation', status: 'exact_transform_only', statement: '天府 is 150/150 under rotation-06 and source-base-direction, with raw divergence preserved.', evidence: ['comparison.roots.tianfu'] }, { id: 'fourteen_star_semantic_identity', status: 'blocked_semantic_identity_insufficient', statement: 'A shared palace identity convention is not established; eight Tianfu-series stars inherit the root blocker and the remaining ten non-root source rules are unresolved.', evidence: ['coordinateConvention', 'inventory', 'dependencyGraph'] }] }, readinessImpact: { stableClaimCount: 0, readiness: 'not_safe_to_start', grounding: 'blocked', activation: 'experimental', productionRuleChanged: false, contractChanged: false, impact: 'No production choice is made; all 14 stars remain unavailable for semantic promotion.', options: [{ id: 'retain', action: 'retain integrated', effect: 'preserves current numeric engine and keeps semantic blocker; no migration', requiredEvidence: 'palace identity authority before promotion' }, { id: 'replace', action: 'replace with source rules', effect: 'would alter Tianfu root and all dependent series; requires approved rule migration and fresh baseline', requiredEvidence: 'source rules for all affected stars plus shared coordinate identity' }, { id: 'compatibility-layer', action: 'add compatibility layer', effect: 'would preserve both raw systems but requires explicit schema/alias authorization; not implemented', requiredEvidence: 'contract design and consumer audit' }, { id: 'continue-blocked', action: 'continue blocked', effect: 'no rule or contract mutation; acquire palace identity and unresolved-star source evidence', requiredEvidence: 'new admissible source witness and independent review' }] }, preservedBoundaries: { productionRuleModified: false, apiSchemaModified: false, enumModified: false, toleranceModified: false, baselineModified: false, readinessModified: false, groundingModified: false, activationModified: false, compatibilityAliasImplemented: false }, immutableExistingBytes: [{ path: SOURCE_ARTIFACT, sha256: sha256(await readFile(resolve(root, SOURCE_ARTIFACT))) }, { path: TIANFU_ARTIFACT, sha256: sha256(await readFile(resolve(root, TIANFU_ARTIFACT))) }, { path: 'src/ziwei/starPlacementRules.js', sha256: await fileHash(root, 'src/ziwei/starPlacementRules.js') }, { path: 'src/ziwei/starResolver.js', sha256: await fileHash(root, 'src/ziwei/starResolver.js') }], materializer: `scripts/materialize-${SCHEMA}.mjs`, checker: `scripts/check-${SCHEMA}.mjs`, observedHead: git(root, ['rev-parse', 'HEAD']), deterministic: { generatedAt: 'forbidden', relationCandidateCount: candidateCount(), rawValues: 'preserved; no post-hoc fitting', hashes: 'UTF-8 bytes including final LF' } }
  return attachArtifactIdentity(artifactBase, buildArtifactIdentity({ root, artifactId: SCHEMA, materializerPath: artifactBase.materializer, materializerVersion: MATERIALIZER_VERSION, baseHead: BASIS_HEAD, inputs: [SOURCE_ARTIFACT, TIANFU_ARTIFACT, 'src/ziwei/starPlacementRules.js', 'src/ziwei/starResolver.js', 'src/ziwei/ziweiStarPlacementCleanRuleSeedPilot.js', 'src/ziwei/tianfuStarPlacementCleanRuleSeedPilot.js', 'src/ziwei/ziweiContract.js', 'src/ziwei/ziweiPalaceContext.js', 'src/ziwei/palaceRelationRules.js'] }))
}

export { buildArtifact }
if (process.argv[1] === new URL(import.meta.url).pathname) { const target = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`); const artifact = await buildArtifact(); const dir = dirname(target); await mkdir(dir, { recursive: true }); const outputs = { complete: artifact, inventory: artifact.inventory, sourceEvidenceIndex: artifact.sourceWitness, comparison: artifact.comparison, decisionPacket: artifact.readinessImpact }; for (const [name, value] of Object.entries(outputs)) { const bytes = Buffer.from(canonicalJson(value)); const path = resolve(dir, `${name}.json`); await writeFile(path, bytes); await writeFile(`${path}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(bytes), artifactByteSha256Scope: 'UTF-8 bytes including final LF' }, null, 2)}\n`) } console.log(JSON.stringify({ verdict: artifact.verdictToken, inventoryCount: artifact.inventory.length, ziwei: artifact.comparison.roots.ziwei.rawMatchCount, tianfuRotation06: artifact.comparison.roots.tianfu.rotation06MatchCount, semantic: artifact.claims.claims[3].status }, null, 2)) }
