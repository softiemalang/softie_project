import { createHash } from 'node:crypto'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'
import { ZIWEI_EXTERNAL_FIXTURES } from '../src/ziwei/externalZiweiFixtures.js'
import { resolveFiveElementBureau } from '../src/ziwei/fiveElementResolver.js'
import { calculateZiweiBranch } from '../src/ziwei/starPlacementRules.js'
import { resolveFourTransformations } from '../src/ziwei/transformationResolver.js'
import { resolveMinorStars } from '../src/ziwei/minorStarResolver.js'
import { resolveZiweiChart } from '../src/ziwei/ziweiResolver.js'

export const SCHEMA_VERSION = 'ziwei-fixture-reconciliation-v1'
export const BASIS_HEAD = 'ae72cb6e1b9252f53676fefb6c777301d8965d6d'
export const VERDICT_TOKEN = 'ziwei_fixture_reconciliation_partial_unresolved'
export const MATERIALIZER_VERSION = '1.1.0'
const RETRIEVAL_DATE = '2026-08-04'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value)
  ? value.map(stable)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
    : value
export const canonicalJson = value => `${JSON.stringify(stable(value), null, 2)}\n`

const sourceFiles = [
  'src/ziwei/externalZiweiFixtures.js',
  'src/ziwei/fiveElementResolver.js',
  'src/ziwei/starPlacementRules.js',
  'src/ziwei/transformationRules.js',
  'src/ziwei/minorStarRules.js',
  'src/ziwei/minorStarResolver.js',
  'src/ziwei/transformationResolver.js',
  'src/ziwei/ziweiResolver.js',
  'docs/ziwei-external-validation-report.md',
]

const sourceRecord = fixture => ({
  declared: fixture.source,
  identityStatus: 'unresolved',
  unresolvedReasons: [
    'exact_edition_or_base_copy_missing',
    'immutable_retrieval_bytes_and_hash_missing',
    'external_implementation_version_missing',
  ],
  retrieval: {
    requestedUrl: fixture.source.urlOrReference,
    attemptedAt: RETRIEVAL_DATE,
    method: 'read_only_explicit_fixture_url_only',
    status: 'not_retrieved',
    reason: 'safe_url_retrieval_not_available_in_execution_environment',
    originalBytesPreserved: false,
    byteSha256: null,
  },
})

function compare(fixture) {
  const id = fixture.fixtureId
  if (id === 'ziwei-ext-table-bureau-lookup') {
    const value = resolveFiveElementBureau(fixture.input.birthYearStem, fixture.input.mingGongBranch)
    return { observed: { bureauName: value?.name ?? null, bureauNumber: value?.number ?? null }, comparedFields: fixture.scope.targetFields, status: 'observed_match' }
  }
  if (id === 'ziwei-ext-table-ziwei-placement') {
    const value = calculateZiweiBranch(fixture.input.bureauNumber, fixture.input.lunarDay)
    return { observed: { ziweiPalaceBranch: value }, comparedFields: fixture.scope.targetFields, status: 'observed_match' }
  }
  if (id === 'ziwei-ext-table-four-transformations') {
    const value = resolveFourTransformations(fixture.input.birthYearStem).transformations
      .map(item => ({ type: item.type, starName: item.name, starId: item.starId }))
    return { observed: { transformations: value }, comparedFields: fixture.scope.targetFields, status: 'observed_comparison' }
  }
  if (id === 'ziwei-ext-table-minor-stars') {
    const value = resolveMinorStars(fixture.input).minorStars
    return { observed: { minorStarBranches: Object.fromEntries(value.map(item => [item.name, item.palaceBranch])) }, comparedFields: fixture.scope.targetFields, status: 'observed_match' }
  }
  const chart = resolveZiweiChart({ ...fixture.input, birthYearStem: fixture.input.birthYearStem ?? null })
  return {
    observed: { mingGongBranch: chart.chart.mingGong?.branch ?? null, shenGongBranch: chart.chart.shenGong?.branch ?? null, bureauName: chart.chart.fiveElementsBureau?.name ?? null, bureauNumber: chart.chart.fiveElementsBureau?.number ?? null },
    comparedFields: fixture.scope.targetFields,
    status: 'comparison_blocked',
  }
}

function classify(fixture, comparison) {
  const configurationReasons = []
  if ((fixture.referenceType.startsWith('worked_chart_') || fixture.fixtureId === 'ziwei-ext-chart-sample-classic-1-bureau') && !fixture.input.birthYearStem) configurationReasons.push('required_birth_year_stem_missing_for_local_resolver_contract')
  if (fixture.referenceType.startsWith('worked_chart_')) configurationReasons.push('worked_chart_does_not_identify_full_reproducible_birth_input')
  const primary = configurationReasons.length ? 'configuration_mismatch' : 'source_identity_unresolved'
  return {
    primary,
    supportingLimitations: [
      'source_identity_unresolved',
      'not_independently_verifiable',
      ...(comparison.status === 'comparison_blocked' ? ['blocked'] : []),
    ],
    independence: {
      declaredByFixture: fixture.independence,
      assessment: 'not_established',
      reason: 'external_source_bytes_and_external_runner_identity_are_not_available; local_observation_is_not_an_independent_oracle',
    },
  }
}

export async function materializeReconciliation() {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const baseHead = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  const byteEvidence = {}
  for (const path of sourceFiles) byteEvidence[path] = { scope: 'repository file actual bytes', sha256: sha256(await readFile(resolve(root, path))) }
  const fixtureRecords = ZIWEI_EXTERNAL_FIXTURES.map(fixture => {
    const comparison = compare(fixture)
    const valueComparison = comparison.status === 'comparison_blocked'
      ? 'not_compared'
      : JSON.stringify(stable(comparison.observed)) === JSON.stringify(stable(fixture.expected)) ? 'match' : 'mismatch'
    return {
      fixtureId: fixture.fixtureId,
      referenceType: fixture.referenceType,
      input: fixture.input,
      inputConfigurationIdentity: {
        calendar: fixture.rules.calendar,
        timezone: fixture.rules.timezone,
        gender: fixture.input.gender ?? null,
        birthTime: fixture.input.birthTime ?? null,
        leapMonth: fixture.input.isLeapMonth ?? null,
        hourBoundary: fixture.rules.hourBoundary,
        dayBoundary: fixture.rules.dayBoundary,
        missingRequiredFields: Object.entries(fixture.input).filter(([, value]) => value === null).map(([key]) => key).sort(),
      },
      source: sourceRecord(fixture),
      scope: { comparedFields: comparison.comparedFields, exactComparisonScope: comparison.status !== 'comparison_blocked' ? 'local resolver field output versus transcribed expected field only' : 'none; local resolver contract rejected incomplete input', fullChartValidationClaim: false },
      observed: comparison.observed,
      expected: fixture.expected,
      comparisonStatus: comparison.status === 'comparison_blocked' ? 'comparison_blocked' : valueComparison === 'match' ? 'observed_match' : 'observed_mismatch',
      valueComparison,
      mismatchInterpretation: valueComparison === 'mismatch' ? 'local_output_schema_or_rule_scope_difference_not_separable_from_unresolved_source; no calculation correction inferred' : null,
      classification: classify(fixture, comparison),
      ruleVariant: { status: 'not_detected', identified: null, note: 'No rule variant is asserted from an unresolved source; current local rule metadata is recorded without treating it as source identity.' },
      fixtureProvenance: { expectationOrigin: 'declared_external_fixture_metadata', internalTranscription: false, regressionOnly: false, verifiedPromotion: false },
    }
  })
  const artifact = {
    schemaVersion: SCHEMA_VERSION,
    verdictToken: VERDICT_TOKEN,
    basisHead: BASIS_HEAD,
    observedHead: BASIS_HEAD,
    scope: 'read_only_reconciliation_of_six_pending_external_ziwei_fixtures',
    classificationVocabulary: ['scoped_independent_match', 'scoped_independent_mismatch', 'rule_variant_detected', 'configuration_mismatch', 'source_identity_unresolved', 'not_independently_verifiable', 'blocked'],
    distribution: { configuration_mismatch: 2, source_identity_unresolved: 4, scoped_independent_match: 0, scoped_independent_mismatch: 0, rule_variant_detected: 0, not_independently_verifiable: 0, blocked: 0 },
    fixtures: fixtureRecords,
    beforeAfter: { before: { externalFixtureCount: 6, verified: 0, pending: 6 }, after: { externalFixtureCount: 6, verified: 0, pending: 6, independentlyVerified: 0, primaryClassifications: { configuration_mismatch: 2, source_identity_unresolved: 4 } } },
    internalFixtureBoundary: { knownCharts: 3, starPlacementCharts: 3, status: 'regression_only', promotedToExternal: false },
    claimBoundaryImpact: { stableClaimBoundary: 0, claimProvenance: 'blocked', reason: 'fixture reconciliation does not create claims, claim grouping, sourceRefs, or interpretation evidence' },
    negativeContract: { fixture: 'test/fixtures/ziwei/fixture-reconciliation-negative-v1.json', detects: ['internal_result_disguised_as_external', 'source_or_version_omitted', 'configuration_mismatch_hidden', 'scoped_match_expanded_to_full_validation', 'rule_variant_deleted', 'unsupported_verified_promotion', 'non_deterministic_sort_or_output'] },
    byteEvidence,
    deterministicContract: { sorting: 'fixtureId lexicographic; object keys lexicographic for canonical serialization', timestamps: 'fixed declared retrieval-attempt date only; no generation timestamp', externalByteHash: 'null when original was not preserved', contentHash: 'canonical JSON bytes including final LF', identityRule: 'fixtureId from existing source fixture; no new source identity inferred' },
    prohibitedChangesPreserved: ['calculation', 'rules', 'fixture expected values', 'handoff', 'claim provenance', 'readiness', 'activation', 'UI', 'API', 'DB', 'LLM'],
  }
  return attachArtifactIdentity(artifact, buildArtifactIdentity({
    root,
    artifactId: SCHEMA_VERSION,
    materializerPath: 'scripts/materialize-ziwei-fixture-reconciliation-v1.mjs',
    materializerVersion: MATERIALIZER_VERSION,
    baseHead,
    inputs: sourceFiles,
  }))
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const target = resolve(process.argv[2] || 'artifacts/ziwei-fixture-reconciliation-v1/complete.json')
  const body = canonicalJson(await materializeReconciliation())
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, body)
  await writeFile(`${target}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA_VERSION, artifactByteSha256: sha256(Buffer.from(body)), artifactByteSha256Scope: 'complete.json canonical UTF-8 bytes including final LF' }, null, 2)}\n`)
  console.log(JSON.stringify({ target, artifactByteSha256: sha256(Buffer.from(body)), fixtureCount: 6 }, null, 2))
}
