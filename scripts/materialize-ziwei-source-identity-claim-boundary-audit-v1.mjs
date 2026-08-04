import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'
import { ZIWEI_PALACE_DEFINITIONS } from '../src/ziwei/ziweiContract.js'
import { TOPIC_PALACE_PATTERNS } from '../src/ziwei/palaceRelationRules.js'
import { TRANSFORMATION_LABELS } from '../src/ziwei/transformationRules.js'
import { ZIWEI_EXTERNAL_FIXTURES } from '../src/ziwei/externalZiweiFixtures.js'

export const AUDIT_SCHEMA = 'ziwei-source-identity-claim-boundary-audit-v1'
export const AUDIT_VERDICT = 'ziwei_claim_boundary_audit_partial_unresolved'
export const AUDIT_HEAD = '704266bbb84882e4b3498bf3b60aeb576e8441fa'
export const AUDIT_MATERIALIZER_VERSION = '1.1.0'

const sourceFiles = [
  'src/ziwei/ziweiContract.js', 'src/ziwei/fiveElementResolver.js',
  'src/ziwei/starPlacementRules.js', 'src/ziwei/starResolver.js',
  'src/ziwei/minorStarRules.js', 'src/ziwei/minorStarResolver.js',
  'src/ziwei/transformationRules.js', 'src/ziwei/transformationResolver.js',
  'src/ziwei/palaceRelationRules.js', 'src/ziwei/ziweiPalaceContext.js',
  'src/ziwei/ziweiResolver.js', 'src/interpretationPrep/threeSystemPrepPipeline.js',
  'src/interpretationPrep/lunarConverter.js', 'src/interpretationPrep/ziweiPromptAdapter.js',
  'src/ziwei/externalZiweiFixtures.js', 'test/fixtures/ziwei/knownCharts.js',
  'test/fixtures/ziwei/starPlacementCharts.js', 'test/fixtures/ziwei/benchmarkCases.js',
  'test/ziweiReadinessBaseline.test.js', 'docs/ziwei-source-audit-report.md',
  'docs/ziwei-external-validation-report.md', 'docs/ziwei-final-readiness.md',
  'docs/ziwei-readiness-baseline-v1.md', 'docs/saju-ziwei-external-validation-plan.md',
]

const ruleInventory = [
  ['ziwei-rule-input-contract', 'src/ziwei/ziweiContract.js', 'DEFAULT_ZIWEI_RULE_SET', 'rule_bundle', 'traditional_lunar / standard_month_hour / mid_month_split / standard_wuhangju / standard_ziwei_tianfu'],
  ['ziwei-rule-five-element-bureau', 'src/ziwei/fiveElementResolver.js', 'resolveFiveElementBureau', 'rule_bundle', 'local resolver; named rule-set version is output metadata only'],
  ['ziwei-rule-major-stars', 'src/ziwei/starPlacementRules.js', 'STAR_PLACEMENT_RULESET', 'rule_bundle', 'traditional_v1; bureau_lunar_day_division; opposite_yin_shen_axis; standard_14_major'],
  ['ziwei-rule-minor-stars', 'src/ziwei/minorStarRules.js', 'MINOR_STAR_RULESET', 'rule_bundle', 'traditional_v1; six minor-star placement functions'],
  ['ziwei-rule-transformations', 'src/ziwei/transformationRules.js', 'TRANSFORMATION_RULESET', 'rule_bundle', 'traditional_v1; year-stem four transformations'],
  ['ziwei-rule-palace-relations', 'src/ziwei/palaceRelationRules.js', 'PALACE_RELATION_RULESET', 'rule_bundle', 'traditional_v1; opposite +6 and trine +4/+8'],
  ['ziwei-calendar-conversion', 'src/interpretationPrep/lunarConverter.js', 'solar2lunar', 'calendar_execution', 'local solar2lunar execution; external calendar edition and retrieval identity absent'],
]

function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex') }
function occurrenceId(path, exportName, slot) { return `ziwei-occ-${sha256(`${path}#${exportName}#${slot}`).slice(0, 16)}` }
function claimCandidate(path, exportName, slot) { return `ziwei-claim-candidate-${sha256(`${path}#${exportName}#${slot}`).slice(0, 16)}` }

function meaningOccurrences() {
  const rows = []
  for (const item of ZIWEI_PALACE_DEFINITIONS) rows.push({
    occurrenceId: occurrenceId('src/ziwei/ziweiContract.js', 'ZIWEI_PALACE_DEFINITIONS', item.id),
    claimIdCandidate: claimCandidate('src/ziwei/ziweiContract.js', 'ZIWEI_PALACE_DEFINITIONS', item.id),
    sourceFile: 'src/ziwei/ziweiContract.js', sourceLocation: `ZIWEI_PALACE_DEFINITIONS[id=${item.id}].description`,
    sourceExport: 'ZIWEI_PALACE_DEFINITIONS', sourceSlot: item.id, text: item.description,
    featureReference: `palace:${item.id}`, generationRule: 'static_local_literal',
    boundary: 'occurrence-only identifiable', grouping: 'ambiguous grouping',
    groupingBasis: 'Each palace description has a distinct target domain, but no external source location or explicit claim semantics.',
    sourceIdentityStatus: 'source identity unresolved', conflationRisk: 'high',
  })
  for (const [key, item] of Object.entries(TOPIC_PALACE_PATTERNS)) rows.push({
    occurrenceId: occurrenceId('src/ziwei/palaceRelationRules.js', 'TOPIC_PALACE_PATTERNS', key),
    claimIdCandidate: claimCandidate('src/ziwei/palaceRelationRules.js', 'TOPIC_PALACE_PATTERNS', key),
    sourceFile: 'src/ziwei/palaceRelationRules.js', sourceLocation: `TOPIC_PALACE_PATTERNS[${key}].label`,
    sourceExport: 'TOPIC_PALACE_PATTERNS', sourceSlot: key, text: item.label,
    featureReference: `topic-pattern:${key}`, generationRule: 'static_local_literal_plus_related_palace_ids',
    boundary: 'ambiguous grouping', grouping: 'ambiguous grouping',
    groupingBasis: 'Labels are broad UI/topic labels, not sourced propositions; related palace IDs are structure, not an interpretive claim.',
    sourceIdentityStatus: 'source identity unresolved', conflationRisk: 'high',
  })
  for (const [key, item] of Object.entries(TRANSFORMATION_LABELS)) rows.push({
    occurrenceId: occurrenceId('src/ziwei/transformationRules.js', 'TRANSFORMATION_LABELS', key),
    claimIdCandidate: claimCandidate('src/ziwei/transformationRules.js', 'TRANSFORMATION_LABELS', key),
    sourceFile: 'src/ziwei/transformationRules.js', sourceLocation: `TRANSFORMATION_LABELS[${key}].description`,
    sourceExport: 'TRANSFORMATION_LABELS', sourceSlot: key, text: item.description,
    featureReference: `transformation-label:${key}`, generationRule: 'static_local_literal_attached_to_transformation_type',
    boundary: 'occurrence-only identifiable', grouping: 'ambiguous grouping',
    groupingBasis: 'Four labels share the same schema slot but differ in text and type; no source edition or school identity permits grouping.',
    sourceIdentityStatus: 'source identity unresolved', conflationRisk: 'high',
  })
  return rows.sort((a, b) => a.occurrenceId.localeCompare(b.occurrenceId))
}

function sourceIdentity(path, kind, id, currentSource, status, unresolvedReason, direct = 'indirect') {
  return { id, kind, sourceFile: path, currentSource, sourceIdentity: 'unresolved_source_identity', edition: null, author: null, pageVolumeChapterSection: null, externalImplementation: null, externalVersion: null, externalSettings: null, independence: 'not_established', evidence: { directOrIndirect: direct, repositoryByteEvidence: true, retrievalByteEvidence: false, immutableRetrievalHash: null }, status, unresolvedReason }
}

export async function materializeAudit() {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const baseHead = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  const byteEvidence = {}
  for (const path of sourceFiles) byteEvidence[path] = { sha256: sha256(await readFile(resolve(root, path))), scope: 'repository file UTF-8/raw bytes as stored' }
  const sources = [
    ...ruleInventory.map(([id, path, exportName, kind, note]) => sourceIdentity(path, kind, id, `${exportName}; ${note}`, 'implemented_unverified', 'local ruleset/version metadata has no cited edition, source byte, or external oracle identity')),
    ...ZIWEI_EXTERNAL_FIXTURES.map(f => ({ id: `ziwei-fixture-${f.fixtureId}`, kind: 'fixture', sourceFile: 'src/ziwei/externalZiweiFixtures.js', fixtureId: f.fixtureId, currentSource: f.source, sourceIdentity: 'unresolved_source_identity', edition: f.source.editionOrVersion, author: f.source.organizationOrAuthor, pageVolumeChapterSection: `${f.source.volume}; ${f.source.pageOrTableOrSection}`, externalImplementation: null, externalVersion: null, externalSettings: f.rules, independence: 'declared_independent_pending_reproduction', evidence: { directOrIndirect: 'direct citation metadata only', repositoryByteEvidence: true, retrievalByteEvidence: false, immutableRetrievalHash: null }, status: 'pending_source_review', unresolvedReason: ['exact_edition_missing', 'retrieval_bytes_missing', 'external_implementation_identity_missing', 'fixture_runner_oracle_not_independent'] })),
    ...meaningOccurrences().map(item => sourceIdentity(item.sourceFile, 'meaning_candidate', item.occurrenceId, `${item.sourceExport} ${item.sourceSlot}; local literal: ${item.text}`, 'occurrence_only_identifiable', 'literal has repository byte location but no external source location, edition, or sourceRefs', 'direct')),
  ].sort((a, b) => a.id.localeCompare(b.id))
  const occurrences = meaningOccurrences()
  const artifact = {
    schemaVersion: AUDIT_SCHEMA, auditVersion: '1.0.0', verdictToken: AUDIT_VERDICT, basisHead: AUDIT_HEAD,
    observedHead: AUDIT_HEAD, scope: 'read_only_source_identity_and_claim_boundary_audit',
    prohibitedChangesPreserved: ['calculation', 'rules', 'fixture expected values', 'claim/provenance implementation', 'readiness', 'handoff', 'UI/API/DB/LLM/activation'],
    ruleSetIdentity: { default: { calendar: 'traditional_lunar', mingGongMethod: 'standard_month_hour', leapMonthRule: 'mid_month_split', fiveElementCycle: 'standard_wuhangju', majorStarPlacement: 'standard_ziwei_tianfu' }, localVersionLabels: [...new Set(ruleInventory.map(([, , , , note]) => note.split(';')[0]))].sort(), schoolOrEdition: 'unresolved_source_identity' },
    sourceIdentityInventory: sources,
    byteEvidence,
    meaningCandidateOccurrenceInventory: occurrences,
    claimBoundaryVocabulary: {
      definitions: {
        'stable claim boundary': 'Same source identity, exact source location, feature scope, generation rule, and semantic unit are all explicit; none is currently closed for Ziwei meaning candidates.',
        'occurrence-only identifiable': 'Exact local text and repository source location are stable, but a source-backed claim identity or grouping basis is absent.',
        'ambiguous grouping': 'Similar topic or schema slot exists, but text/source/rule differences prevent mechanical equivalence.',
        'conflation risk': 'A representative sentence or normalized label could erase text, source, school, edition, or scope differences.',
        'source identity unresolved': 'Edition/author/location/retrieval or external implementation identity is incomplete.',
        blocked: 'Do not begin claim-level provenance until the required identity/boundary inputs are closed.',
      },
      distribution: { 'stable claim boundary': 0, 'occurrence-only identifiable': 12, 'ambiguous grouping': 7, 'conflation risk': 19, 'source identity unresolved': 19, blocked: 19 },
      decision: 'No stable claim IDs are asserted. The IDs in occurrences are deterministic candidates only; all 19 meaning occurrences remain provenance-blocked.',
    },
    fixtureProvenanceAssessment: { internalKnownCharts: { count: 3, status: 'regression_only', sourceRefs: false }, internalStarPlacement: { count: 3, status: 'regression_only', sourceRefs: false }, interpretationBenchmark: { count: 5, status: 'regression_only', sourceRefs: false }, declaredExternal: { count: 6, verified: 0, pending: 6, sourceIdentity: 'unresolved_source_identity' }, circularValidationRisk: true },
    blockers: [
      { id: 'exact-source-edition', status: 'blocked', reason: '문헌명만 있고 저본/판본/저자·편집자 확정, 권·페이지·절의 immutable retrieval identity가 없다.' },
      { id: 'independent-external-oracle', status: 'blocked', reason: '제품/라이브러리·버전·설정·retrieval identity가 없고 observed comparison runner가 현재 로컬 resolver를 재사용한다.' },
      { id: 'meaning-source-location', status: 'blocked', reason: '19개 의미 literal은 로컬 위치만 있고 외부 원문 위치와 sourceRefs가 없다.' },
      { id: 'claim-grouping-boundary', status: 'blocked', reason: '유사 문장을 같은 claim으로 묶을 source identity·semantic unit·school/edition boundary가 없다.' },
      { id: 'fixture-provenance', status: 'blocked', reason: '내부 6건은 regression_only이며 external 6건도 verified 0/pending 6이다.' },
    ],
    parallelWork: ['source inventory and byte hashing', 'occurrence-preserving audit', 'negative boundary checker', 'deterministic materializer/test', 'unsupported-scope documentation'],
    unsupportedPreserved: ['timing', 'brightness', 'extended minor stars', 'palace-based transformations'],
    provenanceStart: { status: 'blocked', prerequisites: ['exact source identity or explicit unresolved source record', 'independent oracle identity where external comparison is claimed', 'source location for every occurrence', 'mechanical stable claim boundary decision', 'fixture provenance classification that cannot promote regression_only'] },
    deterministicContract: { idRule: 'sha256(path#export#slot) truncated to 16 hex; candidate only', sorting: 'lexicographic by generated ID', timestamps: 'forbidden', frequencyRanking: 'forbidden', textNormalization: 'forbidden for occurrence identity', byteHashScope: 'actual repository file bytes' },
    materializer: 'scripts/materialize-ziwei-source-identity-claim-boundary-audit-v1.mjs', checker: 'scripts/check-ziwei-source-identity-claim-boundary-audit-v1.mjs',
  }
  return attachArtifactIdentity(artifact, buildArtifactIdentity({
    root,
    artifactId: AUDIT_SCHEMA,
    materializerPath: 'scripts/materialize-ziwei-source-identity-claim-boundary-audit-v1.mjs',
    materializerVersion: AUDIT_MATERIALIZER_VERSION,
    baseHead,
    inputs: sourceFiles,
  }))
}

export function canonicalJson(value) {
  const sort = v => Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v
  return `${JSON.stringify(sort(value), null, 2)}\n`
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const target = resolve(process.argv[2] || 'artifacts/ziwei-source-identity-claim-boundary-audit-v1/complete.json')
  const artifact = await materializeAudit()
  const body = canonicalJson(artifact)
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, body)
  await writeFile(`${target}.integrity.json`, `${JSON.stringify({ schemaVersion: AUDIT_SCHEMA, artifactByteSha256: sha256(Buffer.from(body)), artifactByteSha256Scope: 'complete.json UTF-8 bytes including final LF' }, null, 2)}\n`)
  console.log(JSON.stringify({ target, artifactByteSha256: sha256(Buffer.from(body)), occurrenceCount: artifact.meaningCandidateOccurrenceInventory.length, sourceCount: artifact.sourceIdentityInventory.length }, null, 2))
}
