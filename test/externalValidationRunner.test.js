import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { SAJU_EXTERNAL_FIXTURES, EXTERNAL_VALIDATION_FIXTURES } from '../src/saju/engine/externalValidationFixtures.js'
import { ZIWEI_EXTERNAL_FIXTURES } from '../src/ziwei/externalZiweiFixtures.js'
import {
  validateFixtureProvenance,
  compareSajuFixture,
  compareZiweiFixture,
  buildFixtureSummary,
  runExternalValidationSuite,
} from '../src/interpretationPrep/externalValidationRunner.js'

test('externalValidationRunner: verifies runner source code does not import any .test.js file', () => {
  const runnerSource = fs.readFileSync('src/interpretationPrep/externalValidationRunner.js', 'utf8')
  assert.equal(runnerSource.includes('.test.js'), false, 'Runner must not import any .test.js file')
})

test('externalValidationRunner: validates provenance schema fields and targetFields strictly', () => {
  assert.equal(validateFixtureProvenance(SAJU_EXTERNAL_FIXTURES[0]), true)
  assert.equal(validateFixtureProvenance(ZIWEI_EXTERNAL_FIXTURES[0]), true)

  const invalidFixture = {
    fixtureId: 'invalid-01',
    system: 'saju',
    // referenceType missing
  }
  assert.throws(() => validateFixtureProvenance(invalidFixture), /missing required provenance field/)

  const uncomparedTargetFieldFixture = {
    ...SAJU_EXTERNAL_FIXTURES[0],
    scope: {
      ...SAJU_EXTERNAL_FIXTURES[0].scope,
      targetFields: ['solarTermLocalTime', 'nonExistentTargetField'],
    },
  }
  assert.throws(() => compareSajuFixture(uncomparedTargetFieldFixture), /was not compared/)
})

test('externalValidationRunner: computes decoupled observedComparison per field for Saju', () => {
  const result = compareSajuFixture(SAJU_EXTERNAL_FIXTURES[0])
  assert.equal(result.system, 'saju')
  assert.equal(result.isExcludedFromValidationCount, false)
  assert.ok(result.observedComparison)
  assert.equal(result.observedComparison.overallStatus, 'matched_within_declared_scope')
  assert.ok(result.observedComparison.fields.length > 0)
  assert.equal(result.observedComparison.fields[0].status, 'matched')
})

test('externalValidationRunner: tampering with solarTermName expected produces mismatch', () => {
  const termFixture = SAJU_EXTERNAL_FIXTURES.find((f) => f.fixtureId === 'saju-ext-hko-2026-spring-commences')
  const tamperedFixture = {
    ...termFixture,
    expected: {
      ...termFixture.expected,
      solarTermName: '망종', // 잘못된 expected
    },
  }

  const comparison = compareSajuFixture(tamperedFixture)
  assert.equal(comparison.observedComparison.overallStatus, 'partial_match')
  const termNameField = comparison.observedComparison.fields.find((f) => f.path === 'solarTermName')
  assert.ok(termNameField)
  assert.equal(termNameField.status, 'mismatched')
  assert.equal(termNameField.actual, '입춘')
})

test('externalValidationRunner: real lunar2solar execution detects expected date mismatch', () => {
  const lunarFixture = SAJU_EXTERNAL_FIXTURES.find((f) => f.fixtureId === 'saju-ext-hko-2026-lunar-new-year')
  const tamperedFixture = {
    ...lunarFixture,
    expected: {
      solarDate: '1999-12-31', // 잘못된 expected
    },
  }

  const comparison = compareSajuFixture(tamperedFixture)
  assert.equal(comparison.observedComparison.overallStatus, 'mismatched_within_declared_scope')
  assert.equal(comparison.observedComparison.fields[0].status, 'mismatched')
  assert.equal(comparison.observedComparison.fields[0].actual, '2026-02-17')
})

test('externalValidationRunner: real assessHistoricalSeoulTime execution detects expected DST status mismatch', () => {
  const dstFixture = SAJU_EXTERNAL_FIXTURES.find((f) => f.fixtureId === 'saju-ext-iana-seoul-1987-dst-overlap')
  const tamperedFixture = {
    ...dstFixture,
    expected: {
      historicalTimezoneStatus: 'normal_standard_time', // 잘못된 expected
    },
  }

  const comparison = compareSajuFixture(tamperedFixture)
  assert.equal(comparison.observedComparison.overallStatus, 'mismatched_within_declared_scope')
  assert.equal(comparison.observedComparison.fields[0].status, 'mismatched')
  assert.equal(comparison.observedComparison.fields[0].actual, 'dst_ambiguous_local_time')
})

test('externalValidationRunner: Ziwei star ID ziwei and name-based star adaptation prevent false ID mismatches', () => {
  const transFixture = ZIWEI_EXTERNAL_FIXTURES.find((f) => f.fixtureId === 'ziwei-ext-table-four-transformations')
  const comparison = compareZiweiFixture(transFixture)

  assert.equal(comparison.observedComparison.overallStatus, 'matched_within_declared_scope')
  assert.equal(comparison.observedComparison.fields[0].status, 'matched')
})

test('externalValidationRunner: separates observed vs verified counts and counts documents & publishers accurately', () => {
  const suite = runExternalValidationSuite()

  assert.ok(suite.timestamp)
  assert.ok(suite.gateStatus)

  // 사주: 7개 픽스처, 3개 문서, 2개 독립 발행기관 (HKO, IANA)
  assert.equal(suite.sajuSummary.fixtureCount, 7)
  assert.equal(suite.sajuSummary.uniqueReferenceDocumentCount, 3)
  assert.equal(suite.sajuSummary.independentPublisherCount, 2)
  assert.equal(suite.sajuSummary.observedMatches, 7)
  assert.equal(suite.sajuSummary.observedMismatches, 0)
  assert.equal(suite.sajuSummary.verifiedMatches, 7, 'verified_reference fixtures (Tier 1+2) map to verifiedMatches')

  // 사주 sourceTier 집계: Tier 1 (5건) + Tier 2 (2건)
  const sajuTiers = suite.sajuSummary.coverageBySourceTier
  assert.ok(sajuTiers['Tier 1'], 'Saju must have Tier 1 fixtures')
  assert.equal(sajuTiers['Tier 1'].fixtureCount, 5)
  assert.ok(sajuTiers['Tier 2'], 'Saju must have Tier 2 fixtures (IANA DST discussion)')
  assert.equal(sajuTiers['Tier 2'].fixtureCount, 2)

  // 자미두수: 5개 픽스처 (모두 pending_source_review), 1개 문서, 1개 발행기관
  assert.equal(suite.ziweiSummary.fixtureCount, 5)
  assert.equal(suite.ziweiSummary.uniqueReferenceDocumentCount, 1)
  assert.equal(suite.ziweiSummary.independentPublisherCount, 1)
  assert.equal(suite.ziweiSummary.pendingSourceReviewCount, 5)
  assert.equal(suite.ziweiSummary.observedMatches, 2)
  assert.equal(suite.ziweiSummary.observedMismatches, 3)
  assert.equal(suite.ziweiSummary.verifiedMatches, 0, 'pending_source_review fixtures must not be counted in verifiedMatches')
  assert.equal(suite.ziweiSummary.verifiedMismatches, 0, 'pending_source_review fixtures must not be counted in verifiedMismatches')

  // 자미두수 sourceTier 집계: Tier 2 전체 5건
  const ziweiTiers = suite.ziweiSummary.coverageBySourceTier
  assert.ok(ziweiTiers['Tier 2'], 'Ziwei must have Tier 2 fixtures')
  assert.equal(ziweiTiers['Tier 2'].fixtureCount, 5)

  assert.equal(suite.gateStatus.sajuExternalValidationStatus, 'scoped_external_validation_passed')
  assert.equal(suite.gateStatus.ziweiExternalValidationStatus, 'external_fixture_pack_started')
  assert.equal(suite.finalJudgement, 'PARTIAL_FIXTURE_PACK_REFERENCE_GAP')
})

test('externalValidationRunner: pending_source_review blocks Ziwei promotion to scoped_external_validation_passed', () => {
  const suite = runExternalValidationSuite()

  assert.notEqual(suite.gateStatus.ziweiExternalValidationStatus, 'scoped_external_validation_passed')
  assert.equal(suite.gateStatus.ziweiExternalValidationStatus, 'external_fixture_pack_started')
})

test('externalValidationRunner: canonical external fixtures and IDs are not lost during normalization', () => {
  assert.ok(EXTERNAL_VALIDATION_FIXTURES.solarTerms.length >= 1)
  assert.ok(EXTERNAL_VALIDATION_FIXTURES.dayPillars.length >= 1)
  assert.ok(EXTERNAL_VALIDATION_FIXTURES.lunarConversions.length >= 3, 'Must include 3 lunar conversion fixtures including 2026-06-16')
  assert.ok(EXTERNAL_VALIDATION_FIXTURES.historicalTime.length >= 2)

  const restoredLunar = EXTERNAL_VALIDATION_FIXTURES.lunarConversions.find((f) => f.lunarDate === '2026-06-16')
  assert.ok(restoredLunar)
  assert.equal(restoredLunar.expectedSolarDate, '2026-07-29')
})

test('externalValidationRunner: boundary safety fixtures are excluded from validation count', () => {
  const boundaryFixture = {
    fixtureId: 'ziwei-ext-boundary-leap-month',
    system: 'ziwei',
    referenceType: 'boundary_contract',
    scope: { targetFields: ['safely_blocked'], applicablePeriod: 'leap_month' },
    input: { isLeapMonth: true },
    expected: { availableForChat: false },
    source: {
      title: 'Ziwei Fail-Closed Boundary Contract',
      organizationOrAuthor: 'Internal Policy',
      publisherId: 'pub-internal',
      referenceDocumentId: 'doc-ziwei-readiness',
      editionOrVersion: 'v1.0',
      publicationDate: '2026-07-27',
      pageOrTableOrSection: 'Section 2.1',
      urlOrReference: 'file:///Users/softie/Documents/softie_project/docs/ziwei-final-readiness.md',
      accessedAt: '2026-07-27',
      sourceTier: 'Tier 1',
      methodDisclosure: 'internal_safety_policy',
    },
    independence: {
      independentFromCurrentEngine: false,
      suspectedSharedDependency: false,
      independentlyReproducible: 'pending',
    },
    rules: {
      timezone: 'Asia/Seoul',
      calendar: 'lunar',
      dayBoundary: 'midnight',
      hourBoundary: 'zi_hour',
      leapMonthRule: 'leap_month_blocked',
      schoolOrRuleSet: 'safety_contract',
    },
    declaredReviewStatus: 'boundary_contract',
  }

  const comparison = compareZiweiFixture(boundaryFixture)
  assert.equal(comparison.isExcludedFromValidationCount, true)
  assert.equal(comparison.observedComparison.overallStatus, 'out_of_scope')
})

test('externalValidationRunner: buildFixtureSummary correctly counts observed vs verified for each declaredReviewStatus', () => {
  // 실제 집계 테스트: buildFixtureSummary 를 직접 호출하여 observed/verified 수치를 검증
  const lunarFixture = SAJU_EXTERNAL_FIXTURES.find((f) => f.fixtureId === 'saju-ext-hko-2026-lunar-new-year')

  // 테스트 픽스처를 정의 (실제 산친값은 인하여 matched_within_declared_scope)
  const makeResult = (declaredReviewStatus) => ({
    ...compareSajuFixture(lunarFixture),
    declaredReviewStatus,
    isExcludedFromValidationCount: false,
  })

  // draft, disputed, unknown, pending_source_review, pending: observedMatches===1, verifiedMatches===0
  const problematicStatuses = ['draft', 'disputed', 'unknown', 'pending_source_review', 'pending']
  for (const badStatus of problematicStatuses) {
    const result = makeResult(badStatus)
    const summary = buildFixtureSummary([result], 'saju')
    assert.equal(summary.observedMatches, 1,
      `Status '${badStatus}' must appear in observedMatches`)
    assert.equal(summary.verifiedMatches, 0,
      `Status '${badStatus}' must NOT appear in verifiedMatches`)
  }

  // verified_reference: observedMatches===1, verifiedMatches===1
  const verifiedResult = makeResult('verified_reference')
  const verifiedSummary = buildFixtureSummary([verifiedResult], 'saju')
  assert.equal(verifiedSummary.observedMatches, 1,
    'verified_reference must appear in observedMatches')
  assert.equal(verifiedSummary.verifiedMatches, 1,
    'verified_reference must appear in verifiedMatches')
})
