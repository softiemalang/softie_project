import assert from 'node:assert/strict'
import test from 'node:test'
import { getBranchMainStem, getTenGod } from '../saju/engine/core.js'
import { buildExportPayload, exportPayloadToMarkdown, prepareInterpretationData, validatePrepInput } from './prepare.js'
import { calculateBranchGroupRelations, calculateNatalBranchRelations } from './sajuRelationRules.js'
import { addCalendarAge, calculateStartAge, getTwelveStage } from './sajuTimingRules.js'
import { DEFAULT_INPUT, DEFAULT_PROFILES, KOREA_REFERENCE_CITIES } from './schema.js'

const FIXED_INPUT = {
  subjectName: '고정 테스트',
  birthDate: '1997-04-21',
  birthTime: '14:40',
  targetDate: '2026-07-21',
  placeName: '서울',
  referenceCity: 'seoul',
  timezone: 'Asia/Seoul',
  latitude: '37.5665',
  longitude: '126.9780',
  gender: 'male',
  calendar: 'solar',
  source: 'known fixture',
  timeAccuracy: 'exact',
}

test('fixed birth input produces the known four pillars and traceable features', () => {
  const result = prepareInterpretationData(FIXED_INPUT, DEFAULT_PROFILES)
  const pillars = result.systems.saju.raw.pillars

  assert.equal(`${pillars.year.value} ${pillars.month.value} ${pillars.day.value} ${pillars.hour.value}`, '정축 갑진 계사 기미')
  assert.equal(result.systems.saju.raw.dayMaster.stem, '계')
  assert.equal(result.systems.saju.raw.calculationUncertainty.domesticLocation.status, 'domestic_location_no_core_change')
  assert.equal(result.systems.saju.status, 'partial')
  assert.equal(result.systems.saju.raw.branchRelations.ruleVersion, 'softie-natal-branch-relations-v1')
  assert.deepEqual(
    result.systems.saju.raw.branchRelations.items.map(({ relation, branches }) => ({ relation, branches })),
    [
      { relation: '파', branches: ['축', '진'] },
      { relation: '충', branches: ['축', '미'] },
      { relation: '형', branches: ['축', '미'] },
    ],
  )
  assert.ok(result.systems.saju.supportScope.limitations.every(({ reason }) => reason.length > 0))
  assert.ok(result.systems.saju.supportScope.supported.some(({ item }) => item === '국내 주요 도시 진태양시'))
  assert.ok(result.systems.saju.unsupported.every((item) => !item.startsWith('고정밀 진태양시:')))
  assert.equal(result.systems.saju.raw.timeBoundary.solarTimeMethod, 'NOAA fractional-year equation of time')
  assert.equal(result.systems.saju.raw.tenGods.visible.편재, 1)
  assert.equal(
    result.systems.saju.features.find((feature) => feature.id === 'saju.natal.ten-god-repeat.편관').statement,
    '표면 십성 배치에서 편관이 3회 반복된다.',
  )
  assert.ok(result.systems.saju.features.length > 0)
  result.systems.saju.features.forEach((feature) => {
    assert.ok(feature.evidence.length > 0, `${feature.id} should include evidence`)
    feature.evidence.forEach((evidence) => assert.match(evidence.reference, /^systems\.saju\.raw\./))
  })
})

test('same input and profile produce identical calculation data', () => {
  const first = prepareInterpretationData(FIXED_INPUT, DEFAULT_PROFILES)
  const second = prepareInterpretationData(FIXED_INPUT, DEFAULT_PROFILES)

  assert.deepEqual(first, second)
})

test('12운성 uses the fixed yang-forward and yin-backward table', () => {
  assert.equal(getTwelveStage('갑', '해'), '장생')
  assert.equal(getTwelveStage('갑', '묘'), '제왕')
  assert.equal(getTwelveStage('을', '오'), '장생')
  assert.equal(getTwelveStage('을', '사'), '목욕')
})

test('원국과 기간의 지지 십성은 모두 본기 지장간을 기준으로 한다', () => {
  assert.equal(getBranchMainStem('자'), '계')
  assert.equal(getTenGod('계', getBranchMainStem('자')), '비견')
  assert.equal(getBranchMainStem('오'), '정')
  assert.equal(getTenGod('계', getBranchMainStem('오')), '편재')
})

test('대운 기산 환산 keeps the selected 3-day rule at year month and day precision', () => {
  assert.deepEqual(calculateStartAge(3 * 24 * 60), {
    years: 1,
    months: 0,
    days: 0,
    decimalYears: 1,
    conversion: '3일=1년 · 1일=4개월 · 2시간=10일',
  })
  assert.deepEqual(calculateStartAge(24 * 60), {
    years: 0,
    months: 4,
    days: 0,
    decimalYears: 0.3333,
    conversion: '3일=1년 · 1일=4개월 · 2시간=10일',
  })
  assert.equal(calculateStartAge(2 * 60).days, 10)
})

test('대운 날짜 연산은 윤년과 월말을 다음 달로 넘기지 않는다', () => {
  assert.equal(addCalendarAge('2000-02-29', { years: 1, months: 0, days: 0 }), '2001-02-28')
  assert.equal(addCalendarAge('2000-01-31', { years: 0, months: 1, days: 0 }), '2000-02-29')
  assert.equal(addCalendarAge('2001-01-31', { years: 0, months: 1, days: 1 }), '2001-03-01')
})

test('대운 direction, adjacent 절 and 3-day conversion are deterministic', () => {
  const male = prepareInterpretationData({ ...FIXED_INPUT, gender: 'male' }, DEFAULT_PROFILES)
    .systems.saju.raw.timing.daYun
  const female = prepareInterpretationData({ ...FIXED_INPUT, gender: 'female' }, DEFAULT_PROFILES)
    .systems.saju.raw.timing.daYun

  assert.equal(male.directionLabel, '역행')
  assert.equal(male.referenceBoundary.direction, 'backward')
  assert.equal(male.referenceBoundary.longitude, 15)
  assert.equal(male.cycles[0].value, '계묘')
  assert.equal(male.startAge.conversion, '3일=1년 · 1일=4개월 · 2시간=10일')
  assert.equal(female.directionLabel, '순행')
  assert.equal(female.referenceBoundary.direction, 'forward')
  assert.equal(female.referenceBoundary.longitude, 45)
  assert.equal(female.cycles[0].value, '을사')
})

test('기준일의 세운 월운 일진과 12운성을 원자료로 보존한다', () => {
  const timing = prepareInterpretationData({ ...FIXED_INPUT, gender: 'male' }, DEFAULT_PROFILES)
    .systems.saju.raw.timing

  assert.equal(timing.ruleVersion, 'softie-saju-standard-v1.3')
  assert.equal(timing.targetDate, FIXED_INPUT.targetDate)
  assert.deepEqual(Object.values(timing.periods).map((period) => period.label), ['세운', '월운', '일진'])
  Object.values(timing.periods).forEach((period) => {
    assert.match(period.value, /^[갑을병정무기경신임계][자축인묘진사오미신유술해]$/)
    assert.ok(period.stemTenGod)
    assert.ok(period.branchTenGod)
    assert.ok(period.branchMainStem)
    assert.ok(period.twelveStage)
    assert.ok(Array.isArray(period.branchRelations.items))
  })
  assert.equal(timing.natalTwelveStages.hour.stage, '묘')
  assert.equal(timing.periods.year.branchMainStem, '정')
  assert.equal(timing.periods.year.branchTenGod, '편재')
  assert.ok(timing.daYun.cycles.every((cycle) => cycle.branchRelations?.items))
  assert.equal(timing.crossPeriodRelations.status, 'calculated')
  assert.ok(timing.crossPeriodRelations.items.some((item) => item.labels.join('-') === '대운-세운'))
  assert.match(timing.interpretationScope, /길흉은 단정하지 않음/)
})

test('new drafts default to Seoul while domestic city candidates only block boundary-sensitive times', () => {
  assert.equal(DEFAULT_INPUT.placeName, '대한민국')
  assert.equal(DEFAULT_INPUT.referenceCity, 'seoul')
  assert.deepEqual(
    KOREA_REFERENCE_CITIES.find((city) => city.id === 'gwangmyeong'),
    { id: 'gwangmyeong', label: '광명', latitude: 37.48, longitude: 126.87, correctionMinutes: 33 },
  )

  const fixedCountry = prepareInterpretationData({
    ...FIXED_INPUT,
    placeName: '광명',
  }, DEFAULT_PROFILES)
  assert.equal(fixedCountry.input.original.placeName, '대한민국')
  assert.equal(fixedCountry.input.normalized.placeName, '대한민국')

  assert.match(validatePrepInput({ ...FIXED_INPUT, gender: 'other' }), /성별을 선택/)

  const busan = prepareInterpretationData({
    ...FIXED_INPUT,
    referenceCity: 'busan',
    latitude: '0',
    longitude: '0',
  }, DEFAULT_PROFILES)
  assert.equal(busan.input.normalized.referenceCityLabel, '부산')
  assert.equal(busan.input.normalized.latitude, 35.10)
  assert.equal(busan.input.normalized.longitude, 129.03)
  assert.equal('source' in busan.input.normalized, false)
  assert.equal(busan.systems.saju.inputNormalization.meanSolarCorrectionMinutes, -23.88)
  assert.equal(busan.systems.saju.inputNormalization.equationOfTimeMinutes, 1.24)
  assert.equal(busan.systems.saju.inputNormalization.correctionMinutes, -22.64)
  assert.equal(busan.systems.saju.inputNormalization.correctedSolarTime, '1997-04-21 14:17')

  const boundary = prepareInterpretationData({
    ...FIXED_INPUT,
    placeName: '대한민국',
    birthTime: '01:27',
  }, DEFAULT_PROFILES).systems.saju

  assert.equal(boundary.status, 'needs_verification')
  assert.equal(boundary.raw.calculationUncertainty.domesticLocation.status, 'domestic_location_changes_core_pillars')
  assert.deepEqual(boundary.raw.calculationUncertainty.domesticLocation.changedPillars, ['시주'])
  assert.equal(boundary.raw.pillars.hour.status, 'domestic_location_sensitive')
  assert.deepEqual(boundary.raw.pillars.hour.candidates, ['임자', '계축'])
  assert.match(boundary.warnings.join(' '), /국내 지역 보정 확인 필요/)
})

test('국내 도시 보정이 진태양시 자정을 가르면 야자 조자 일주 후보를 보존한다', () => {
  const saju = prepareInterpretationData({
    ...FIXED_INPUT,
    birthDate: '1997-04-22',
    birthTime: '00:28',
    referenceCity: 'seoul',
  }, DEFAULT_PROFILES).systems.saju

  assert.equal(saju.status, 'needs_verification')
  assert.equal(saju.inputNormalization.correctedSolarTime, '1997-04-21 23:57')
  assert.equal(saju.inputNormalization.equationOfTimeMinutes, 1.33)
  assert.deepEqual(saju.raw.pillars.day.candidates, ['계사', '갑오'])
  assert.deepEqual(saju.raw.pillars.hour.candidates, ['임자', '갑자'])
  assert.equal(saju.raw.timeBoundary.ziPeriodLabel, '야자')
  assert.equal(saju.inputNormalization.ziPeriodLabel, '야자')
  assert.equal(saju.inputNormalization.dayBoundaryDate, '1997-04-21')
  assert.deepEqual(saju.raw.calculationUncertainty.domesticLocation.changedPillars, ['일주', '시주'])
})

test('natal branch relation rules cover the complete fixed pair tables and complete trines', () => {
  const pairFixtures = {
    '육합': [['자', '축'], ['인', '해'], ['묘', '술'], ['진', '유'], ['사', '신'], ['오', '미']],
    '충': [['자', '오'], ['축', '미'], ['인', '신'], ['묘', '유'], ['진', '술'], ['사', '해']],
    '파': [['자', '유'], ['축', '진'], ['인', '해'], ['묘', '오'], ['사', '신'], ['미', '술']],
    '해': [['자', '미'], ['축', '오'], ['인', '사'], ['묘', '진'], ['신', '해'], ['유', '술']],
  }

  Object.entries(pairFixtures).forEach(([relation, pairs]) => {
    pairs.forEach(([left, right]) => {
      const result = calculateNatalBranchRelations({ year: { branch: left }, month: { branch: right } })
      assert.ok(
        result.items.some((item) => item.relation === relation),
        `${left}·${right} should include ${relation}`,
      )
    })
  })

  const selfPunishment = calculateNatalBranchRelations({ year: { branch: '진' }, month: { branch: '진' } })
  assert.ok(selfPunishment.items.some((item) => item.relation === '형'))

  const completeTrine = calculateNatalBranchRelations({
    year: { branch: '신' },
    month: { branch: '자' },
    day: { branch: '진' },
  })
  const incompleteTrine = calculateNatalBranchRelations({
    year: { branch: '신' },
    month: { branch: '자' },
  })
  assert.ok(completeTrine.items.some((item) => item.relation === '삼합' && item.element === '수'))
  assert.ok(!incompleteTrine.items.some((item) => item.relation === '삼합'))
})

test('기간 간 관계는 세 기간에 걸친 완성 삼합도 보존한다', () => {
  assert.deepEqual(calculateBranchGroupRelations([
    { label: '대운', branch: '신' },
    { label: '세운', branch: '자' },
    { label: '월운', branch: '진' },
  ]), [{
    id: 'period-trine-수-대운-세운-월운',
    relation: '삼합',
    element: '수',
    branches: ['신', '자', '진'],
    labels: ['대운', '세운', '월운'],
    ruleType: 'period_complete_group_lookup',
    interpretationStatus: 'presence_only',
  }])
})

test('unsupported systems stay explicit and do not create fake synthesis', () => {
  const result = prepareInterpretationData(FIXED_INPUT, DEFAULT_PROFILES)

  assert.equal(result.systems.ziwei.raw, null)
  assert.equal(result.systems.astrology.raw, null)
  assert.equal(result.synthesis.agreements.length, 0)
  assert.equal(result.synthesis.tensions.length, 0)
  assert.equal(result.synthesis.uncertainties.length, 1)
})

test('conversation export filters by topic and keeps model instructions', () => {
  const result = prepareInterpretationData(FIXED_INPUT, DEFAULT_PROFILES)
  const payload = buildExportPayload(result, {
    type: 'conversation',
    topicId: 'money',
    question: '재정 근거를 보고 싶다',
    generatedAt: '2026-07-21T00:00:00.000Z',
  })

  assert.equal(payload.target.topic, '재정과 가치관')
  assert.equal(payload.calculationSummary.saju.pillars.day.value, '계사')
  assert.equal(payload.calculationSummary.saju.branchRelations.items[0].relation, '파')
  assert.match(payload.calculationSummary.saju.supportScope.summary, /재현/)
  assert.equal(payload.calculationSummary.saju.timing.targetDate, FIXED_INPUT.targetDate)
  assert.ok(payload.instruction.includes('계산값을 임의로 변경하지 말고'))
  assert.ok(payload.uncertainties.length > 0)
  const markdown = exportPayloadToMarkdown(payload)
  assert.match(markdown, /- 지원 지역: 대한민국/)
  assert.match(markdown, /- 기준 도시: 서울 \(37.57, 126.97\)/)
  assert.match(markdown, /## 운 흐름 기준값/)
  assert.match(markdown, /- 대운: 역행/)
})

test('input validation rejects unsupported reference cities and missing birth data', () => {
  assert.equal(validatePrepInput({ ...FIXED_INPUT, placeName: '' }), '')
  assert.match(validatePrepInput({ ...FIXED_INPUT, birthDate: '' }), /birthDate/)
  assert.match(validatePrepInput({ ...FIXED_INPUT, birthTime: '' }), /입력하거나 모름/)
  assert.match(validatePrepInput({ ...FIXED_INPUT, birthDate: '2026-02-30' }), /실제로 존재/)
  assert.match(validatePrepInput({ ...FIXED_INPUT, birthTime: '24:10' }), /시각 범위/)
  assert.match(validatePrepInput({ ...FIXED_INPUT, birthDate: '1900-01-01' }), /1901년부터 2100년/)
  assert.match(validatePrepInput({ ...FIXED_INPUT, targetDate: '' }), /targetDate/)
  assert.match(validatePrepInput({ ...FIXED_INPUT, targetDate: '2026-02-30' }), /기준일은/)
  assert.match(validatePrepInput({ ...FIXED_INPUT, referenceCity: 'unsupported' }), /기준 도시/)
  assert.match(validatePrepInput({ ...FIXED_INPUT, gender: 'unspecified' }), /성별을 선택/)
})

test('unknown birth time omits the hour pillar and preserves time-sensitive candidates', () => {
  const result = prepareInterpretationData({
    ...FIXED_INPUT,
    birthTime: '',
    timeAccuracy: 'unknown',
  }, DEFAULT_PROFILES)
  const saju = result.systems.saju

  assert.equal(saju.raw.pillars.hour.value, null)
  assert.equal(saju.raw.pillars.hour.status, 'unknown')
  assert.deepEqual(saju.raw.pillars.day.candidates, ['임진', '계사'])
  assert.deepEqual(saju.raw.dayMaster.candidates, ['임', '계'])
  assert.equal(saju.raw.timing.daYun.status, 'missing_birth_time')
  assert.equal(saju.raw.timing.natalTwelveStages.hour.stage, null)
  assert.equal(saju.raw.timing.periods.year.status, 'candidate_required')
  assert.deepEqual(
    [...new Set(saju.raw.timing.periods.year.candidates.map((candidate) => candidate.dayMaster))],
    ['계', '임'],
  )
  assert.equal(saju.inputNormalization.correctedSolarTime, null)
  assert.equal(saju.features.length, 1)
  assert.equal(saju.features[0].confidence, 'low')
  assert.match(saju.warnings.join(' '), /시주를 제외/)
})

test('solar-term boundary inputs expose year and month candidates instead of hiding precision limits', () => {
  const result = prepareInterpretationData({
    ...FIXED_INPUT,
    birthDate: '2014-02-04',
    birthTime: '07:03',
  }, DEFAULT_PROFILES)
  const saju = result.systems.saju

  assert.equal(saju.raw.calculationUncertainty.solarTermBoundary.status, 'candidate_required')
  assert.deepEqual(saju.raw.pillars.year.candidates, ['갑오', '계사'])
  assert.deepEqual(saju.raw.pillars.month.candidates, ['병인', '을축'])
  assert.equal(saju.raw.pillars.year.status, 'solar_term_sensitive')
  assert.equal(saju.status, 'needs_verification')
  assert.equal(saju.raw.timing.daYun.status, 'candidate_required')
  assert.ok(saju.raw.timing.daYun.candidates.length > 1)
  assert.match(saju.warnings.join(' '), /하나로 확정하지/)
})

test('운 흐름 기준일에 절입이 있으면 세운 월운 후보를 함께 보존한다', () => {
  const saju = prepareInterpretationData({
    ...FIXED_INPUT,
    targetDate: '2014-02-04',
  }, DEFAULT_PROFILES).systems.saju

  assert.equal(saju.status, 'needs_verification')
  assert.equal(saju.raw.timing.targetDateBoundary.status, 'candidate_required')
  assert.deepEqual(saju.raw.timing.targetDateBoundary.yearPillarCandidates, ['계사', '갑오'])
  assert.deepEqual(saju.raw.timing.targetDateBoundary.monthPillarCandidates, ['을축', '병인'])
  assert.deepEqual(saju.raw.timing.periods.year.candidates.map((candidate) => candidate.value), ['계사', '갑오'])
  assert.equal(saju.raw.timing.periods.day.status, 'calculated')
  assert.match(saju.warnings.join(' '), /운 흐름 기준일 확인 필요/)
})

test('births before stable KST are always marked as needing verification', () => {
  const result = prepareInterpretationData({
    ...FIXED_INPUT,
    birthDate: '1960-06-01',
    birthTime: '12:00',
  }, DEFAULT_PROFILES)
  const saju = result.systems.saju

  assert.equal(saju.status, 'needs_verification')
  assert.equal(saju.raw.calculationUncertainty.historicalTimezone.status, 'historical_offset_unverified')
  assert.equal(saju.raw.calculationUncertainty.historicalTimezone.requiresVerification, true)
  assert.match(saju.warnings.join(' '), /1961-08-10 이전/)
})

test('1987 DST only needs verification when the one-hour correction changes a core pillar', () => {
  const unchanged = prepareInterpretationData({
    ...FIXED_INPUT,
    birthDate: '1987-06-01',
    birthTime: '13:00',
  }, DEFAULT_PROFILES).systems.saju
  const changed = prepareInterpretationData({
    ...FIXED_INPUT,
    birthDate: '1987-06-01',
    birthTime: '12:00',
  }, DEFAULT_PROFILES).systems.saju

  assert.equal(unchanged.status, 'partial')
  assert.equal(unchanged.raw.calculationUncertainty.historicalTimezone.status, 'dst_no_core_change')
  assert.deepEqual(unchanged.raw.timing.daYun.startDateRange, ['1996-02-10', '1996-02-15'])
  assert.match(unchanged.warnings.join(' '), /대운 기산일 후보/)
  assert.equal(changed.status, 'needs_verification')
  assert.equal(changed.raw.calculationUncertainty.historicalTimezone.status, 'dst_changes_core_pillars')
  assert.deepEqual(changed.raw.calculationUncertainty.historicalTimezone.changedPillars, ['시주'])
  assert.deepEqual(changed.raw.pillars.hour.candidates, ['갑오', '계사'])
  assert.equal(changed.raw.pillars.hour.status, 'historical_time_sensitive')
})

test('DST 기산일 후보가 기준일의 현재 대운을 바꾸는 경우에만 운 계산도 검증 필요로 올린다', () => {
  const saju = prepareInterpretationData({
    ...FIXED_INPUT,
    birthDate: '1987-06-01',
    birthTime: '13:00',
    targetDate: '1996-02-12',
  }, DEFAULT_PROFILES).systems.saju

  assert.equal(saju.raw.calculationUncertainty.historicalTimezone.status, 'dst_no_core_change')
  assert.equal(saju.raw.timing.daYun.status, 'candidate_required')
  assert.deepEqual(saju.raw.timing.daYun.candidates.map((candidate) => candidate.activeCycleIndex), [null, 1])
  assert.equal(saju.status, 'needs_verification')
})

test('1988 DST follows the same conditional verification rule', () => {
  const unchanged = prepareInterpretationData({
    ...FIXED_INPUT,
    birthDate: '1988-06-01',
    birthTime: '13:00',
  }, DEFAULT_PROFILES).systems.saju
  const changed = prepareInterpretationData({
    ...FIXED_INPUT,
    birthDate: '1988-06-01',
    birthTime: '12:00',
  }, DEFAULT_PROFILES).systems.saju

  assert.equal(unchanged.status, 'partial')
  assert.equal(changed.status, 'needs_verification')
  assert.deepEqual(changed.raw.calculationUncertainty.historicalTimezone.changedPillars, ['시주'])
})

test('DST skipped and repeated local hours always require verification', () => {
  const skipped = prepareInterpretationData({
    ...FIXED_INPUT,
    birthDate: '1987-05-10',
    birthTime: '02:30',
  }, DEFAULT_PROFILES).systems.saju
  const repeated = prepareInterpretationData({
    ...FIXED_INPUT,
    birthDate: '1987-10-11',
    birthTime: '02:30',
  }, DEFAULT_PROFILES).systems.saju

  assert.equal(skipped.status, 'needs_verification')
  assert.equal(skipped.raw.calculationUncertainty.historicalTimezone.status, 'dst_nonexistent_local_time')
  assert.equal(repeated.status, 'needs_verification')
  assert.equal(repeated.raw.calculationUncertainty.historicalTimezone.status, 'dst_ambiguous_local_time')
})
