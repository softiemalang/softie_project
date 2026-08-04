import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'
import { ZIWEI_PALACE_DEFINITIONS } from '../src/ziwei/ziweiContract.js'
import { TOPIC_PALACE_PATTERNS } from '../src/ziwei/palaceRelationRules.js'
import { TRANSFORMATION_LABELS } from '../src/ziwei/transformationRules.js'
import { ZIWEI_EXTERNAL_FIXTURES } from '../src/ziwei/externalZiweiFixtures.js'
import { KNOWN_ZIWEI_CHARTS } from '../test/fixtures/ziwei/knownCharts.js'
import { KNOWN_STAR_PLACEMENT_CHARTS } from '../test/fixtures/ziwei/starPlacementCharts.js'
import { ZIWEI_BENCHMARK_CASES } from '../test/fixtures/ziwei/benchmarkCases.js'

export const SCHEMA = 'ziwei-occurrence-level-provenance-v0'
export const VERDICT = 'ziwei_occurrence_provenance_partial_unverified'
export const BASIS_HEAD = '4b062131ae4f1f7b0932708809399b92dbe06469'
export const MATERIALIZER_VERSION = '1.0.0'
export const STATES = ['occurrence_identified', 'occurrence_provenance_partial', 'source_identity_unresolved', 'regression_only', 'configuration_mismatch', 'not_independently_verified', 'claim_grouping_blocked']

const INPUTS = [
  'src/ziwei/ziweiContract.js', 'src/ziwei/ziweiResolver.js', 'src/ziwei/fiveElementResolver.js',
  'src/ziwei/starPlacementRules.js', 'src/ziwei/starResolver.js', 'src/ziwei/minorStarRules.js',
  'src/ziwei/minorStarResolver.js', 'src/ziwei/transformationRules.js', 'src/ziwei/transformationResolver.js',
  'src/ziwei/palaceRelationRules.js', 'src/ziwei/ziweiPalaceContext.js', 'src/interpretationPrep/lunarConverter.js',
  'src/interpretationPrep/threeSystemPrepPipeline.js', 'src/ziwei/externalZiweiFixtures.js',
  'test/fixtures/ziwei/knownCharts.js', 'test/fixtures/ziwei/starPlacementCharts.js', 'test/fixtures/ziwei/benchmarkCases.js',
]

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const idFor = (file, exportName, slot) => `ziwei-occ-${sha256(`${file}#${exportName}#${slot}`).slice(0, 16)}`
const ref = (kind, id, status, scope, sourceFile) => ({ kind, id, status, verificationScope: scope, sourceFile })

function records() {
  const rows = []
  const common = {
    statuses: ['occurrence_identified', 'occurrence_provenance_partial', 'source_identity_unresolved', 'claim_grouping_blocked'],
    rawText: { isVerifiedFact: false, epistemicBoundary: 'raw_meaning_candidate_only' },
    provenanceCompleteness: 'partial',
    sourceIdentity: { status: 'unresolved_source_identity', immutableExternalIdentity: null },
    conflationProhibition: { prohibited: true, reason: '원문·위치·규칙·source identity가 닫히기 전 대표 문장 또는 stable claim으로 병합 금지' },
    claimBoundary: { status: 'claim_grouping_blocked', stableClaimBoundary: false, stableClaimId: null },
    unresolvedGaps: ['external_source_location_missing', 'exact_edition_or_retrieval_identity_missing', 'independent_oracle_identity_missing'],
  }
  for (const item of ZIWEI_PALACE_DEFINITIONS) rows.push({ ...common, occurrenceId: idFor('src/ziwei/ziweiContract.js', 'ZIWEI_PALACE_DEFINITIONS', item.id), rawText: { text: item.description, isVerifiedFact: false, epistemicBoundary: 'raw_meaning_candidate_only' }, source: { file: 'src/ziwei/ziweiContract.js', location: `ZIWEI_PALACE_DEFINITIONS[id=${item.id}].description`, exportName: 'ZIWEI_PALACE_DEFINITIONS', slot: item.id }, featureReferences: ['ziwei-feature-palace-context'], ruleReferences: ['ziwei-rule-input-contract', 'ziwei-rule-palace-placement'], calculationReferences: ['ziwei-calculation-resolve-chart-palaces', 'ziwei-calculation-interpretation-palace-contexts'], fixtureReferences: [...KNOWN_ZIWEI_CHARTS.map(x => `fixture:known-chart:${x.id}`), ...ZIWEI_BENCHMARK_CASES.map(x => `fixture:benchmark:${x.id}`)], evidenceReferences: ['source:src/ziwei/ziweiContract.js'] })
  for (const [key, item] of Object.entries(TOPIC_PALACE_PATTERNS)) rows.push({ ...common, occurrenceId: idFor('src/ziwei/palaceRelationRules.js', 'TOPIC_PALACE_PATTERNS', key), rawText: { text: item.label, isVerifiedFact: false, epistemicBoundary: 'raw_meaning_candidate_only' }, source: { file: 'src/ziwei/palaceRelationRules.js', location: `TOPIC_PALACE_PATTERNS[${key}].label`, exportName: 'TOPIC_PALACE_PATTERNS', slot: key }, featureReferences: [`ziwei-feature-topic-pattern:${key}`], ruleReferences: ['ziwei-rule-palace-relations'], calculationReferences: ['ziwei-calculation-build-palace-relations'], fixtureReferences: ZIWEI_BENCHMARK_CASES.map(x => `fixture:benchmark:${x.id}`), evidenceReferences: ['source:src/ziwei/palaceRelationRules.js'] })
  for (const [key, item] of Object.entries(TRANSFORMATION_LABELS)) rows.push({ ...common, occurrenceId: idFor('src/ziwei/transformationRules.js', 'TRANSFORMATION_LABELS', key), rawText: { text: item.description, isVerifiedFact: false, epistemicBoundary: 'raw_meaning_candidate_only' }, source: { file: 'src/ziwei/transformationRules.js', location: `TRANSFORMATION_LABELS[${key}].description`, exportName: 'TRANSFORMATION_LABELS', slot: key }, featureReferences: [`ziwei-feature-transformation-label:${key}`], ruleReferences: ['ziwei-rule-transformations'], calculationReferences: ['ziwei-calculation-resolve-transformations'], fixtureReferences: [...KNOWN_STAR_PLACEMENT_CHARTS.map(x => `fixture:star-placement:${x.id}`), ...ZIWEI_EXTERNAL_FIXTURES.filter(x => x.fixtureId === 'ziwei-ext-table-four-transformations').map(x => `fixture:external:${x.fixtureId}`)], evidenceReferences: ['source:src/ziwei/transformationRules.js'] })
  return rows.sort((a, b) => a.occurrenceId.localeCompare(b.occurrenceId))
}

function evidenceIndex(occurrences) {
  const index = {}
  const add = (kind, id, occurrenceId, status, scope, sourceFile) => { (index[`${kind}:${id}`] ||= { kind, id, status, verificationScope: scope, sourceFile, occurrenceIds: [] }).occurrenceIds.push(occurrenceId) }
  for (const occurrence of occurrences) {
    add('source', occurrence.source.file, occurrence.occurrenceId, 'source_identity_unresolved', 'repository bytes only', occurrence.source.file)
    for (const id of occurrence.featureReferences) add('feature', id, occurrence.occurrenceId, 'occurrence_provenance_partial', 'local feature reference', occurrence.source.file)
    for (const id of occurrence.ruleReferences) add('rule', id, occurrence.occurrenceId, 'occurrence_provenance_partial', 'local rule path; not external truth', occurrence.source.file)
    for (const id of occurrence.calculationReferences) add('calculation', id, occurrence.occurrenceId, 'occurrence_provenance_partial', 'local calculation path; not independent verification', occurrence.source.file)
    for (const id of occurrence.fixtureReferences) add(id.startsWith('fixture:external:') ? 'external_fixture' : 'fixture', id, occurrence.occurrenceId, id.startsWith('fixture:external:') ? 'not_independently_verified' : 'regression_only', id.startsWith('fixture:external:') ? 'scoped observed match or pending review only' : 'regression only', occurrence.source.file)
  }
  for (const item of Object.values(index)) item.occurrenceIds.sort()
  return Object.fromEntries(Object.keys(index).sort().map(key => [key, index[key]]))
}

export async function buildOccurrenceProvenance() {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const occurrences = records()
  const sourceByteEvidence = Object.fromEntries(await Promise.all(INPUTS.map(async path => [path, { byteSha256: sha256(await readFile(resolve(root, path))), scope: 'actual repository file bytes' }])))
  const sourceStatuses = Object.fromEntries(INPUTS.map(path => [path, 'source_identity_unresolved']))
  const artifact = {
    schemaVersion: SCHEMA, verdictToken: VERDICT, basisHead: BASIS_HEAD, observedHead: execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    scope: 'occurrence-level provenance only; no claim, grouping, ranking, readiness, grounding, or activation',
    sourceIdentityInventorySummary: { total: 32, unresolved: 32, composition: { localRuleOrCalculationSources: 7, declaredExternalFixtures: ZIWEI_EXTERNAL_FIXTURES.length, meaningOccurrences: occurrences.length }, status: 'unresolved_source_identity' },
    stableClaimBoundary: { count: 0, status: 'blocked', stableClaimIds: [] }, conflationRisk: { count: occurrences.length, status: 'preserved', ranking: 'forbidden' },
    statusVocabulary: STATES, provenanceCompletenessDistribution: { partial: occurrences.length }, sourceIdentityDistribution: { unresolved_source_identity: occurrences.length },
    evidenceKindCounts: { calculation: 0, feature: 0, rule: 0, source: 0, fixture: 0, external_fixture: 0 },
    occurrences, evidenceIndex: evidenceIndex(occurrences), sourceStatuses, sourceByteEvidence,
    fixturePolicy: { internal: { status: 'regression_only', independentlyVerified: false, count: KNOWN_ZIWEI_CHARTS.length + KNOWN_STAR_PLACEMENT_CHARTS.length + ZIWEI_BENCHMARK_CASES.length }, external: { status: 'not_independently_verified', sourceIdentity: 'unresolved_source_identity', verified: 0, pending: ZIWEI_EXTERNAL_FIXTURES.length, scopedMatchExpansion: 'forbidden' } },
    fixtureStatusInventory: ZIWEI_EXTERNAL_FIXTURES.map(fixture => ({ fixtureId: fixture.fixtureId, statuses: fixture.fixtureId.includes('chart-sample') ? ['configuration_mismatch', 'not_independently_verified', 'source_identity_unresolved'] : ['not_independently_verified', 'source_identity_unresolved'], comparisonScope: 'declared fixture fields only; no full-chart or system-wide claim' })).sort((a, b) => a.fixtureId.localeCompare(b.fixtureId)),
    forbiddenTransformations: ['raw_text_to_verified_fact', 'occurrence_to_stable_claim', 'different_occurrence_merge', 'frequency_ranking', 'scoped_match_to_system_verification', 'unresolved_source_hiding'],
    deterministicContract: { occurrenceId: 'sha256(source.file#source.exportName#source.slot), first 16 hex', occurrenceSort: 'lexicographic occurrenceId', textPolicy: 'exact raw text; no normalization', timestamps: 'forbidden', contentHash: 'artifact-identity-v1 artifactPayloadSha256', byteHash: 'complete.json UTF-8 bytes including final LF' },
    readinessGroundingDecision: { occurrenceProvenance: 'partial_unverified', readiness: 'not_safe_to_start', grounding: 'not_safe_to_start', reason: 'occurrence provenance preserves uncertainty but does not close source identity, independent verification, or claim boundary' },
    materializer: 'scripts/materialize-ziwei-occurrence-provenance-v0.mjs', checker: 'scripts/check-ziwei-occurrence-provenance-v0.mjs', negativeFixture: 'test/fixtures/ziwei/occurrence-provenance-negative-v0.json',
  }
  const counts = Object.values(artifact.evidenceIndex).reduce((acc, item) => { acc[item.kind]++; return acc }, { calculation: 0, feature: 0, rule: 0, source: 0, fixture: 0, external_fixture: 0 })
  artifact.evidenceKindCounts = counts
  return attachArtifactIdentity(artifact, buildArtifactIdentity({ root, artifactId: SCHEMA, materializerPath: artifact.materializer, materializerVersion: MATERIALIZER_VERSION, baseHead: artifact.observedHead, inputs: INPUTS }))
}

export function canonicalJson(value) { const sort = v => Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v; return `${JSON.stringify(sort(value), null, 2)}\n` }

if (process.argv[1] === new URL(import.meta.url).pathname) { const target = resolve(process.argv[2] || 'artifacts/ziwei-occurrence-level-provenance-v0/complete.json'); const artifact = await buildOccurrenceProvenance(); const body = canonicalJson(artifact); await mkdir(dirname(target), { recursive: true }); await writeFile(target, body); await writeFile(`${target}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(Buffer.from(body)), artifactByteSha256Scope: 'complete.json UTF-8 bytes including final LF' }, null, 2)}\n`); console.log(JSON.stringify({ target, occurrenceCount: artifact.occurrences.length, artifactPayloadSha256: artifact.artifactIdentity.artifactPayloadSha256, artifactByteSha256: sha256(Buffer.from(body)) }, null, 2)) }
