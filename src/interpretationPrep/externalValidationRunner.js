/**
 * src/interpretationPrep/externalValidationRunner.js
 *
 * 사주·자미두수 독립 외부 검증 Fixture Pack v1 Runner.
 *
 * 주요 수칙:
 * 1. 하드코딩 actual 제거 (SOLAR_TERM_NAMES[longitude]로 절기명 동적 도출, lunar2solar(), assessHistoricalSeoulTime() 직접 호출).
 * 2. 출처 정규화 (referenceDocumentId, publisherId 기반 uniqueReferenceDocumentCount 및 independentPublisherCount 집계).
 * 3. observed와 verified 집계 완전 분리:
 *    - observedMatches / observedMismatches: 실제 계산 대조 결과
 *    - verifiedMatches / verifiedMismatches: declaredReviewStatus === 'verified_reference'인 fixture만 집계 (Tier 2 자료도 verified_reference로 등록된 경우 포함)
 *    - draft / disputed / unknown / pending_source_review 등 미확정 상태는 verified 집계에서 엄격히 제외
 * 4. Ziwei 출처 보수화: pending_source_review 시 gate status 및 finalJudgement 승격 차단.
 * 5. targetFields 선언 검증: 선언된 필드가 실제로 대조되지 않으면 provenance 검증 실패 처리.
 */

import { SAJU_EXTERNAL_FIXTURES } from '../saju/engine/externalValidationFixtures.js'
import { calculateFourPillars } from '../saju/engine/fourPillars.js'
import { findCalculatedBoundary, SOLAR_TERM_NAMES } from '../saju/engine/solarTerms.js'
import { lunar2solar } from './lunarConverter.js'
import { assessHistoricalSeoulTime } from './sajuAdapter.js'

import { ZIWEI_EXTERNAL_FIXTURES } from '../ziwei/externalZiweiFixtures.js'
import { resolveZiweiChart } from '../ziwei/ziweiResolver.js'
import { resolve14MajorStars } from '../ziwei/starResolver.js'
import { resolveFourTransformations } from '../ziwei/transformationResolver.js'
import { resolveMinorStars } from '../ziwei/minorStarResolver.js'
import { resolveFiveElementBureau } from '../ziwei/fiveElementResolver.js'

export const PROVENANCE_REQUIRED_FIELDS = Object.freeze([
  'fixtureId',
  'system',
  'referenceType',
  'scope',
  'input',
  'expected',
  'source',
  'independence',
  'rules',
  'declaredReviewStatus',
])

export const SOURCE_REQUIRED_FIELDS = Object.freeze([
  'title',
  'organizationOrAuthor',
  'publisherId',
  'referenceDocumentId',
  'editionOrVersion',
  'publicationDate',
  'pageOrTableOrSection',
  'urlOrReference',
  'accessedAt',
  'sourceTier',
  'methodDisclosure',
])

// 자미두수 내부 ID -> 한글 성명 맵 (의미 기반 비교용)
const STAR_ID_TO_KOREAN_NAME = Object.freeze({
  lianzhen: '염정',
  pojun: '파군',
  wugu: '무곡',
  taiyang: '태양',
  tianji: '천기',
  tiantong: '천동',
  taiyin: '태음',
  tanlang: '탐랑',
  jumen: '거문',
  tianliang: '천량',
  ziwei: '자미',
  tianfu: '천부',
  tianxiang: '천상',
  qisha: '칠살',
  zuobo: '좌보',
  youbi: '우필',
  wenchang: '문창',
  wengu: '문곡',
  tiankui: '천괴',
  tianyue: '천월',
})

// 한글/한자 성명 -> 정규화 성명 맵
const NORMALIZE_STAR_NAME = Object.freeze({
  'lian_zhen': '염정',
  'po_jun': '파군',
  'wu_qu': '무곡',
  'tai_yang': '태양',
  '염정': '염정',
  '파군': '파군',
  '무곡': '무곡',
  '태양': '태양',
  '좌보': '좌보',
  '우필': '우필',
  '문창': '문창',
  '문곡': '문곡',
  '천괴': '천괴',
  '천월': '천월',
})

/**
 * Fixture Provenance 필드 유효성 검사.
 */
export function validateFixtureProvenance(fixture) {
  if (!fixture || typeof fixture !== 'object') {
    throw new Error('Fixture must be a non-null object')
  }

  PROVENANCE_REQUIRED_FIELDS.forEach((field) => {
    if (!Object.hasOwn(fixture, field) || fixture[field] === undefined || fixture[field] === null) {
      throw new Error(`Fixture [${fixture.fixtureId || 'unknown'}] missing required provenance field: ${field}`)
    }
  })

  SOURCE_REQUIRED_FIELDS.forEach((field) => {
    if (!Object.hasOwn(fixture.source, field) || fixture.source[field] === undefined || fixture.source[field] === null) {
      throw new Error(`Fixture [${fixture.fixtureId}] missing required source provenance field: ${field}`)
    }
  })

  if (!Array.isArray(fixture.scope?.targetFields) || fixture.scope.targetFields.length === 0) {
    throw new Error(`Fixture [${fixture.fixtureId}] scope.targetFields must be a non-empty array`)
  }

  return true
}

/**
 * 단일 Saju Fixture 대조 수행 (하드코딩 actual 제거)
 */
export function compareSajuFixture(fixture) {
  validateFixtureProvenance(fixture)

  if (fixture.referenceType === 'boundary_contract') {
    return {
      fixtureId: fixture.fixtureId,
      system: 'saju',
      referenceType: fixture.referenceType,
      isExcludedFromValidationCount: true,
      declaredReviewStatus: fixture.declaredReviewStatus,
      source: fixture.source,
      observedComparison: {
        overallStatus: 'out_of_scope',
        comparedFieldsCount: 0,
        matchedFieldsCount: 0,
        fields: [],
      },
    }
  }

  const fields = []

  if (fixture.referenceType === 'astronomical_reference') {
    const [year, month, day] = fixture.input.localDate.split('-').map(Number)
    const [hour, minute] = fixture.input.localTime.split(':').map(Number)
    const publishedHktMs = Date.UTC(year, month - 1, day, hour - 8, minute)
    const calculatedUtcMs = findCalculatedBoundary(fixture.input.longitude, publishedHktMs)
    const errorMinutes = Math.abs(calculatedUtcMs - publishedHktMs) / 60000
    const tolerance = fixture.expected.toleranceMinutes || 15

    const matched = errorMinutes <= tolerance

    if (fixture.expected.solarTermName) {
      // SOLAR_TERM_NAMES[longitude]로 동적 도출
      const actualSolarTermName = SOLAR_TERM_NAMES[fixture.input.longitude] || null
      const termNameMatched = actualSolarTermName === fixture.expected.solarTermName
      fields.push({
        path: 'solarTermName',
        status: termNameMatched ? 'matched' : 'mismatched',
        expected: fixture.expected.solarTermName,
        actual: actualSolarTermName,
        reason: termNameMatched ? null : 'needs_investigation',
      })
    }

    fields.push({
      path: 'solarTermLocalTime',
      status: matched ? 'matched' : 'mismatched',
      expected: fixture.expected.solarTermLocalTime,
      actual: `diff: ${errorMinutes.toFixed(2)} min (tolerance: ±${tolerance}m)`,
      reason: matched ? null : 'needs_investigation',
    })
  } else if (fixture.referenceType === 'calendar_conversion_reference') {
    if (fixture.expected.dayPillar) {
      const result = calculateFourPillars({ birthDate: fixture.input.birthDate, birthTime: fixture.input.birthTime || '12:00' })
      const actualPillar = `${result.day.stem}${result.day.branch}`
      const matched = actualPillar === fixture.expected.dayPillar
      fields.push({
        path: 'dayPillar',
        status: matched ? 'matched' : 'mismatched',
        expected: fixture.expected.dayPillar,
        actual: actualPillar,
        reason: matched ? null : 'needs_investigation',
      })
    } else if (fixture.expected.solarDate) {
      // 실제 프로덕션 음력->양력 변환 함수 lunar2solar() 호출
      const lunarRes = lunar2solar(
        fixture.input.lunarYear,
        fixture.input.lunarMonth,
        fixture.input.lunarDay,
        Boolean(fixture.input.isLeapMonth)
      )
      const actualSolarDate = lunarRes.solarDate || `${lunarRes.solarYear}-${String(lunarRes.solarMonth).padStart(2, '0')}-${String(lunarRes.solarDay).padStart(2, '0')}`
      const matched = actualSolarDate === fixture.expected.solarDate

      fields.push({
        path: 'solarDate',
        status: matched ? 'matched' : 'mismatched',
        expected: fixture.expected.solarDate,
        actual: actualSolarDate,
        reason: matched ? null : 'needs_investigation',
      })
    }
  } else if (fixture.referenceType === 'timezone_reference') {
    // 실제 프로덕션 DST 역사적 시각 판정 함수 assessHistoricalSeoulTime() 호출
    const calcPillars = calculateFourPillars({ birthDate: fixture.input.localDate, birthTime: fixture.input.localTime })
    const assessment = assessHistoricalSeoulTime(
      { birthDate: fixture.input.localDate, birthTime: fixture.input.localTime },
      false,
      calcPillars,
      {}
    )
    const actualStatus = assessment ? assessment.status : 'unknown'
    const matched = actualStatus === fixture.expected.historicalTimezoneStatus

    fields.push({
      path: 'historicalTimezoneStatus',
      status: matched ? 'matched' : 'mismatched',
      expected: fixture.expected.historicalTimezoneStatus,
      actual: actualStatus,
      reason: matched ? null : 'needs_investigation',
    })
  }

  // targetFields 선언 검증: 선언된 필드가 실제로 대조되었는지 확인
  const comparedPaths = new Set(fields.map((f) => f.path))
  fixture.scope.targetFields.forEach((targetField) => {
    if (!comparedPaths.has(targetField)) {
      throw new Error(`Declared targetField [${targetField}] was not compared for fixture [${fixture.fixtureId}]`)
    }
  })

  const matchedCount = fields.filter((f) => f.status === 'matched').length
  const totalCount = fields.length
  let overallStatus = 'pending'

  if (totalCount > 0 && matchedCount === totalCount) {
    overallStatus = 'matched_within_declared_scope'
  } else if (matchedCount > 0) {
    overallStatus = 'partial_match'
  } else if (totalCount > 0) {
    overallStatus = 'mismatched_within_declared_scope'
  }

  return {
    fixtureId: fixture.fixtureId,
    system: 'saju',
    referenceType: fixture.referenceType,
    source: fixture.source,
    isExcludedFromValidationCount: false,
    declaredReviewStatus: fixture.declaredReviewStatus,
    observedComparison: {
      overallStatus,
      comparedFieldsCount: totalCount,
      matchedFieldsCount: matchedCount,
      fields,
    },
  }
}

/**
 * 단일 Ziwei Fixture 대조 수행 (의미 기반 성명 대조)
 */
export function compareZiweiFixture(fixture) {
  validateFixtureProvenance(fixture)

  if (fixture.referenceType === 'boundary_contract') {
    return {
      fixtureId: fixture.fixtureId,
      system: 'ziwei',
      referenceType: fixture.referenceType,
      isExcludedFromValidationCount: true,
      declaredReviewStatus: fixture.declaredReviewStatus,
      source: fixture.source,
      observedComparison: {
        overallStatus: 'out_of_scope',
        comparedFieldsCount: 0,
        matchedFieldsCount: 0,
        fields: [],
      },
    }
  }

  const fields = []

  if (fixture.referenceType === 'ruleset_table_reference') {
    if (fixture.expected.bureauNumber !== undefined) {
      const bureau = resolveFiveElementBureau(fixture.input.birthYearStem, fixture.input.mingGongBranch)
      const matched = bureau && bureau.number === fixture.expected.bureauNumber
      fields.push({
        path: 'fiveElementsBureau.bureauNumber',
        status: matched ? 'matched' : 'mismatched',
        expected: fixture.expected.bureauNumber,
        actual: bureau ? bureau.number : null,
        reason: matched ? null : 'needs_investigation',
      })

      if (fixture.expected.bureauName !== undefined) {
        const nameMatched = bureau && bureau.name === fixture.expected.bureauName
        fields.push({
          path: 'fiveElementsBureau.bureauName',
          status: nameMatched ? 'matched' : 'mismatched',
          expected: fixture.expected.bureauName,
          actual: bureau ? bureau.name : null,
          reason: nameMatched ? null : 'needs_investigation',
        })
      }
    }

    if (fixture.expected.ziweiPalaceBranch) {
      const dummyPalaces = [
        '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'
      ].map((branch, index) => ({ index, branch, mainStars: [] }))

      const starsRes = resolve14MajorStars({
        bureauNumber: fixture.input.bureauNumber,
        lunarDay: fixture.input.lunarDay,
        palaces: dummyPalaces,
      })

      const ziweiStar = starsRes.majorStars ? starsRes.majorStars.find((s) => s.id === 'ziwei') : null
      const actualBranch = ziweiStar ? ziweiStar.palaceBranch : null
      const matched = actualBranch === fixture.expected.ziweiPalaceBranch

      fields.push({
        path: 'ziweiStarBranch',
        status: matched ? 'matched' : 'mismatched',
        expected: fixture.expected.ziweiPalaceBranch,
        actual: actualBranch,
        reason: matched ? null : 'needs_investigation',
      })
    }

    if (fixture.expected.transformations) {
      const transRes = resolveFourTransformations(fixture.input.birthYearStem)
      const actualAdapted = (transRes.transformations || []).map((t) => ({
        type: t.name,
        starName: STAR_ID_TO_KOREAN_NAME[t.starId] || t.starId,
      }))
      const expectedAdapted = fixture.expected.transformations.map((t) => ({
        type: t.type,
        starName: NORMALIZE_STAR_NAME[t.starName] || t.starName,
      }))

      const matched = JSON.stringify(actualAdapted) === JSON.stringify(expectedAdapted)
      fields.push({
        path: 'transformations',
        status: matched ? 'matched' : 'mismatched',
        expected: expectedAdapted,
        actual: actualAdapted,
        reason: matched ? null : 'needs_investigation',
      })
    }

    if (fixture.expected.minorStarBranches) {
      const minorRes = resolveMinorStars({
        birthYearStem: fixture.input.birthYearStem,
        lunarMonth: fixture.input.lunarMonth,
        hourBranch: fixture.input.hourBranch,
      })

      const actualAdapted = {}
      ;(minorRes.minorStars || []).forEach((s) => {
        const korName = STAR_ID_TO_KOREAN_NAME[s.id] || s.id
        actualAdapted[korName] = s.palaceBranch
      })

      const expectedAdapted = {}
      Object.entries(fixture.expected.minorStarBranches).forEach(([key, val]) => {
        const korName = NORMALIZE_STAR_NAME[key] || key
        expectedAdapted[korName] = val
      })

      const matched = JSON.stringify(actualAdapted) === JSON.stringify(expectedAdapted)
      fields.push({
        path: 'minorStarBranches',
        status: matched ? 'matched' : 'mismatched',
        expected: expectedAdapted,
        actual: actualAdapted,
        reason: matched ? null : 'needs_investigation',
      })
    }
  } else if (fixture.referenceType === 'worked_chart_reference') {
    const chartRes = resolveZiweiChart(fixture.input)
    const chart = chartRes.chart || {}

    if (fixture.expected.mingGongBranch !== undefined) {
      const matched = chart.mingGong?.branch === fixture.expected.mingGongBranch
      fields.push({
        path: 'mingGongBranch',
        status: matched ? 'matched' : 'mismatched',
        expected: fixture.expected.mingGongBranch,
        actual: chart.mingGong?.branch || null,
        reason: matched ? null : 'needs_investigation',
      })
    }

    if (fixture.expected.shenGongBranch !== undefined) {
      const matched = chart.shenGong?.branch === fixture.expected.shenGongBranch
      fields.push({
        path: 'shenGongBranch',
        status: matched ? 'matched' : 'mismatched',
        expected: fixture.expected.shenGongBranch,
        actual: chart.shenGong?.branch || null,
        reason: matched ? null : 'needs_investigation',
      })
    }

    if (fixture.expected.bureauName !== undefined) {
      const matched = chart.fiveElementsBureau?.name === fixture.expected.bureauName
      fields.push({
        path: 'bureauName',
        status: matched ? 'matched' : 'mismatched',
        expected: fixture.expected.bureauName,
        actual: chart.fiveElementsBureau?.name || null,
        reason: matched ? null : 'needs_investigation',
      })
    }

    if (fixture.expected.bureauNumber !== undefined) {
      const matched = chart.fiveElementsBureau?.number === fixture.expected.bureauNumber
      fields.push({
        path: 'bureauNumber',
        status: matched ? 'matched' : 'mismatched',
        expected: fixture.expected.bureauNumber,
        actual: chart.fiveElementsBureau?.number || null,
        reason: matched ? null : 'needs_investigation',
      })
    }
  }

  // targetFields 선언 검증: 선언된 필드가 실제로 대조되었는지 확인
  const comparedPaths = new Set(fields.map((f) => f.path))
  fixture.scope.targetFields.forEach((targetField) => {
    if (!comparedPaths.has(targetField)) {
      throw new Error(`Declared targetField [${targetField}] was not compared for fixture [${fixture.fixtureId}]`)
    }
  })

  const matchedCount = fields.filter((f) => f.status === 'matched').length
  const totalCount = fields.length
  let overallStatus = 'pending'

  if (totalCount > 0 && matchedCount === totalCount) {
    overallStatus = 'matched_within_declared_scope'
  } else if (matchedCount > 0) {
    overallStatus = 'partial_match'
  } else if (totalCount > 0) {
    overallStatus = 'mismatched_within_declared_scope'
  }

  return {
    fixtureId: fixture.fixtureId,
    system: 'ziwei',
    referenceType: fixture.referenceType,
    source: fixture.source,
    isExcludedFromValidationCount: false,
    declaredReviewStatus: fixture.declaredReviewStatus,
    observedComparison: {
      overallStatus,
      comparedFieldsCount: totalCount,
      matchedFieldsCount: matchedCount,
      fields,
    },
  }
}

/**
 * buildFixtureSummary — 순수 helper (테스트에서 직접 호출 가능)
 *
 * 비교 완료된 result 배열(compareSajuFixture / compareZiweiFixture 반환값)을 받아
 * fixtureCount, observedMatches, verifiedMatches 등을 집계하여 반환한다.
 *
 * verified 집계 정책:
 *   - declaredReviewStatus === 'verified_reference'인 fixture만 포함.
 *   - Tier 2 자료도 verified_reference로 명시 등록된 경우 포함.
 *   - draft / disputed / unknown / pending_source_review / pending 등 미확정 상태는 무조건 제외.
 */
export function buildFixtureSummary(results, systemName) {
  const included = results.filter((r) => !r.isExcludedFromValidationCount)
  const excluded = results.filter((r) => r.isExcludedFromValidationCount)

  // 1. observedMatches / observedMismatches: 실제 계산 대조 산출값 (declaredReviewStatus 불문)
  const observedMatches = included.filter(
    (r) => r.observedComparison.overallStatus === 'matched_within_declared_scope'
  ).length

  const observedMismatches = included.filter(
    (r) => r.observedComparison.overallStatus === 'mismatched_within_declared_scope'
  ).length

  const partialMatches = included.filter((r) => r.observedComparison.overallStatus === 'partial_match').length
  const disputed = included.filter((r) => r.observedComparison.overallStatus === 'disputed').length
  const pending = included.filter((r) => r.observedComparison.overallStatus === 'pending').length

  // 2. pending_source_review 항목 집계
  const pendingSourceReviewCount = included.filter(
    (r) => r.declaredReviewStatus === 'pending_source_review'
  ).length

  // 3. verifiedMatches / verifiedMismatches: declaredReviewStatus === 'verified_reference'인 fixture만 포함
  //    Tier 2 자료도 verified_reference로 명시 등록된 경우 포함.
  //    draft / disputed / unknown / pending_source_review 등 미확정 상태는 무조건 제외.
  const verifiedMatches = included.filter(
    (r) =>
      r.observedComparison.overallStatus === 'matched_within_declared_scope' &&
      r.declaredReviewStatus === 'verified_reference'
  ).length

  const verifiedMismatches = included.filter(
    (r) =>
      r.observedComparison.overallStatus === 'mismatched_within_declared_scope' &&
      r.declaredReviewStatus === 'verified_reference'
  ).length

  // sourceTier별 픽스처 및 match 수 집계
  const coverageBySourceTier = {}
  included.forEach((r) => {
    const tier = r.source.sourceTier || 'Unknown'
    if (!coverageBySourceTier[tier]) {
      coverageBySourceTier[tier] = { fixtureCount: 0, observedMatches: 0, observedMismatches: 0 }
    }
    coverageBySourceTier[tier].fixtureCount += 1
    if (r.observedComparison.overallStatus === 'matched_within_declared_scope') {
      coverageBySourceTier[tier].observedMatches += 1
    } else if (r.observedComparison.overallStatus === 'mismatched_within_declared_scope') {
      coverageBySourceTier[tier].observedMismatches += 1
    }
  })

  // 4. 출처 정규화 집계 (referenceDocumentId, publisherId)
  const uniqueDocs = new Set(included.map((r) => r.source.referenceDocumentId))
  const uniquePublishers = new Set(included.map((r) => r.source.publisherId))

  const coverageByField = {}
  included.forEach((r) => {
    r.observedComparison.fields.forEach((f) => {
      if (!coverageByField[f.path]) {
        coverageByField[f.path] = { total: 0, matched: 0, mismatched: 0 }
      }
      coverageByField[f.path].total += 1
      if (f.status === 'matched') coverageByField[f.path].matched += 1
      else if (f.status === 'mismatched') coverageByField[f.path].mismatched += 1
    })
  })

  return {
    system: systemName,
    fixtureCount: included.length,
    uniqueReferenceDocumentCount: uniqueDocs.size,
    independentPublisherCount: uniquePublishers.size,
    excludedBoundaryContractsCount: excluded.length,
    observedMatches,
    observedMismatches,
    pendingSourceReviewCount,
    verifiedMatches,
    verifiedMismatches,
    partialMatches,
    disputed,
    pending,
    outOfScope: excluded.length,
    coverageByField,
    coverageBySourceTier,
  }
}

/**
 * 전체 외부 검증 픽스처 비교 실행 및 observed / verified 분리 집계
 */
export function runExternalValidationSuite() {
  const sajuResults = SAJU_EXTERNAL_FIXTURES.map(compareSajuFixture)
  const ziweiResults = ZIWEI_EXTERNAL_FIXTURES.map(compareZiweiFixture)

  const sajuSummary = buildFixtureSummary(sajuResults, 'saju')
  const ziweiSummary = buildFixtureSummary(ziweiResults, 'ziwei')

  // 동적 게이트 상태 산출
  const sajuExternalValidationStatus =
    sajuSummary.verifiedMatches === sajuSummary.fixtureCount &&
    sajuSummary.pendingSourceReviewCount === 0 &&
    sajuSummary.pending === 0 &&
    sajuSummary.observedMismatches === 0
      ? 'scoped_external_validation_passed'
      : 'external_fixture_pack_started'

  const ziweiExternalValidationStatus =
    ziweiSummary.verifiedMatches === ziweiSummary.fixtureCount &&
    ziweiSummary.pendingSourceReviewCount === 0 &&
    ziweiSummary.pending === 0 &&
    ziweiSummary.observedMismatches === 0
      ? 'scoped_external_validation_passed'
      : 'external_fixture_pack_started'

  const finalJudgement =
    sajuSummary.observedMismatches > 0 ||
    ziweiSummary.observedMismatches > 0 ||
    sajuSummary.pendingSourceReviewCount > 0 ||
    ziweiSummary.pendingSourceReviewCount > 0 ||
    sajuSummary.pending > 0 ||
    ziweiSummary.pending > 0 ||
    sajuSummary.partialMatches > 0 ||
    ziweiSummary.partialMatches > 0 ||
    sajuSummary.disputed > 0 ||
    ziweiSummary.disputed > 0
      ? 'PARTIAL_FIXTURE_PACK_REFERENCE_GAP'
      : 'EXTERNAL_FIXTURE_PACK_READY_FOR_REVIEW'

  return {
    timestamp: new Date().toISOString(),
    gateStatus: {
      sajuExternalValidationStatus,
      ziweiExternalValidationStatus,
      externalFixturePackStatus: 'started',
    },
    finalJudgement,
    sajuSummary,
    ziweiSummary,
    sajuResults,
    ziweiResults,
  }
}
