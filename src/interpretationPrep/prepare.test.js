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
  assert.equal(result.systems.saju.status, 'experimental') // complete에서 experimental로 격하 검증
  assert.equal(result.systems.saju.raw.branchRelations.ruleVersion, 'softie-natal-branch-relations-v2')

  // [사주 학파 프로필 회귀 테스트 1] 격국, 용신, 신강약 정량 스코어 정밀 대조 검증
  // - 주석: 《자평진전(子平眞詮)》 격국론 및 《적천수(滴天髓)》 억부론 표준 원칙 교차 검증 완료.
  // - 한계: 지장간에는 계수, 신금, 경금이 존재하여 현실 명리 임상에선 신약/신강 판정 시 이들의 통근 여부에 따른 가용 강약 점수가 학설마다 큰 차이를 보입니다. 본 엔진의 현재 수식은 단순 강약 산식에 의해 0점으로 계산하므로 이를 '골든 정확도'라 주장하지 않으며, 단지 현재 엔진의 출력 수식을 변함없이 유지하기 위한 '프로필 회귀 테스트'로 간주합니다.
  // - 대상 사주: 계수(癸) 일간이 진월(辰)에 출생함. 진토의 본기는 무토(戊)이며 천간 투간자가 없으므로 본기를 격국으로 삼아 '정관격(正官格)'으로 성격(成格)됨이 고전 이론상의 기대값임.
  // - 강약 평가: 사주 원국 표면에 일간을 생조하는 인성(금)과 비겁(수)이 전무하여 일간 계수가 완전히 고립되고 신약(극신약)하므로 정량 강약 점수가 수학적으로 0점으로 산출되는 것이 타당함.
  // - 용희신 판정: 극신약 정관격 사주이므로 일간을 수호하는 인성(금)을 억부용신으로 삼고, 비겁(수)을 희신으로 취하는 '신약용인(身弱用印)' 배치가 성립됨.
  const exp = result.systems.saju.raw.experimental
  assert.ok(exp.isExperimental, '실험 결과 메타데이터 표식 존재 확인')
  assert.equal(exp.gyeokguk.name, '정관격', '자평진전 진월 계수 무토사령 정관격 공식 검증')
  assert.equal(exp.yongShin.primaryYongShinElement, '금', '억부 희용신 신약용인 오행 금 용신 검증')
  assert.equal(exp.yongShin.heeShinElement, '수', '억부 수 희신 검증')
  assert.equal(exp.strength.score, 0, '인성/비겁의 표면 전무로 인한 극신약 점수 0점 검증')

  // [사주 학파 프로필 회귀 테스트 2] 원국 6대 신살 검출 회귀 방어 검증
  // - 천을귀인: 《삼명통회(三明通會)》 천을귀인 조 '임계사묘수(壬癸巳卯隨)'에 따라 계수 일간 대비 일지 사화(巳) 귀인 매핑 검증.
  // - 양인살: 고전 수식 '갑묘 을진 병오 정미 무오 기미 경유 신술 임자 계축'에 따라 계수 일간 대비 연지 축토(丑) 양인살 매핑 검증.
  assert.ok(exp.shinsal.some(s => s.name === '천을귀인' && s.position === 'day'), '일지 사화 천을귀인 규칙 매핑 검증')
  assert.ok(exp.shinsal.some(s => s.name === '양인살' && s.position === 'year'), '연지 축토 양인살 규칙 매핑 검증')

  // [사주 학파 프로필 회귀 테스트 3] 천간합의 기둥 인접성 정합성 검증 (갑기합토)
  // 월간 갑목 - 시간 기토는 떨어져(distance = 2) 있으므로 presence는 참이어야 하나 establishment 및 transmutation은 거짓이어야 함
  const gapGiRelation = result.systems.saju.raw.stemRelations.items.find(r => r.relation === '천간합')
  assert.ok(gapGiRelation, '갑기합 존재 확인')
  assert.equal(gapGiRelation.assessment.establishment, false, '월간-시간은 인접해 있지 않으므로 합이 성립(establishment)되지 않음')
  assert.equal(gapGiRelation.assessment.transmutation, false, '성립되지 않은 합은 합화(transmutation)가 불가능함')

  assert.deepEqual(
    result.systems.saju.raw.branchRelations.items.map(({ relation, branches }) => ({ relation, branches })),
    [
      { relation: '파', branches: ['진', '축'] },
      { relation: '충', branches: ['미', '축'] },
      { relation: '형', branches: ['미', '축'] },
    ],
  )
  // limitations ID 및 구조 불변성 검증
  const limitations = result.systems.saju.supportScope.limitations
  assert.ok(limitations.length > 0)
  const limIds = limitations.map((item) => item.id)
  assert.equal(new Set(limIds).size, limIds.length)
  assert.ok(limIds.includes('location-time-correction'))
  assert.ok(limIds.includes('historical-standard-time'))
  assert.ok(
    limitations.every(
      (item) =>
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.status === 'string' &&
        typeof item.impact === 'string' &&
        typeof item.item === 'string' &&
        typeof item.reason === 'string'
    )
  )

  // unsupported ID 및 구조 불변성 검증
  const unsupported = result.systems.saju.unsupported
  assert.ok(unsupported.length > 0)
  const unsIds = unsupported.map((item) => item.id)
  assert.equal(new Set(unsIds).size, unsIds.length)
  assert.ok(unsIds.includes('extended-shinsal'))
  assert.ok(unsIds.includes('advanced-following-structures'))
  assert.ok(
    unsupported.every(
      (item) =>
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.status === 'string'
    )
  )

  assert.ok(result.systems.saju.supportScope.supported.some(({ item }) => item === '국내 주요 도시 진태양시'))
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

test('lunar date conversion and verification scope profile regression test', () => {
  const lunarInput = {
    ...FIXED_INPUT,
    birthDate: '2025-06-01', // 음력 2025년 윤6월 1일 입력 (isLeapMonth: true)
    calendar: 'lunar',
    isLeapMonth: true,
  }
  const result = prepareInterpretationData(lunarInput, DEFAULT_PROFILES)
  const norm = result.systems.saju.inputNormalization

  // 음력 2025년 윤6월 1일은 양력 2025-07-25로 정상 변환
  assert.equal(norm.convertedSolarDate, '2025-07-25')
  assert.equal(norm.calendarType, 'lunar')
  assert.equal(norm.isLeapMonth, true)

  // KASI 표준 대조 범위 검증 (1951~2050년 사이이므로 kasi_reference_range_unverified 여야 함)
  const lConv = result.input.lunarConversion
  assert.equal(lConv.verificationScope, 'kasi_reference_range_unverified')
  assert.equal(lConv.source, 'External Table (KASI-matching range 1951-2050)')

  // 1940년 음력생인 경우 External Astrological Lunar Table 범위여야 함
  const oldLunarInput = {
    ...FIXED_INPUT,
    birthDate: '1940-05-05',
    calendar: 'lunar',
    isLeapMonth: false,
  }
  const oldResult = prepareInterpretationData(oldLunarInput, DEFAULT_PROFILES)
  const oldLConv = oldResult.input.lunarConversion
  assert.equal(oldLConv.verificationScope, 'external_lunar_tables')
  assert.equal(oldLConv.source, 'External Astrological Lunar Table')
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

  assert.equal(unchanged.status, 'experimental')
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

  assert.equal(unchanged.status, 'experimental')
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

test('음력 지원 검증 1: 평달 날짜 변환 및 사주 산출 검증', () => {
  const result = prepareInterpretationData({
    ...FIXED_INPUT,
    calendar: 'lunar',
    birthDate: '2025-01-01',
    isLeapMonth: false,
  }, DEFAULT_PROFILES)

  // 음력 2025-01-01 -> 양력 2025-01-29 변환 확인
  assert.equal(result.input.lunarConversion.convertedSolarDate, '2025-01-29')
  assert.equal(result.input.lunarConversion.isLeapMonth, false)
  assert.equal(result.input.original.birthDate, '2025-01-01')
  assert.equal(result.input.normalized.birthDate, '2025-01-29')

  // 사주 계산이 변환된 양력 기준으로 성공적으로 처리되었는지 확인
  const pillars = result.systems.saju.raw.pillars
  assert.ok(pillars)
  assert.match(result.systems.saju.warnings.join(' '), /음력 날짜\(2025-01-01\)를 기준으로 변환된 양력 날짜\(2025-01-29\)/)
})

test('음력 지원 검증 2: 설날 전후 연도 경계 변환 검증', () => {
  const resultBeforeNewYear = prepareInterpretationData({
    ...FIXED_INPUT,
    calendar: 'lunar',
    birthDate: '2025-12-29',
    isLeapMonth: false,
  }, DEFAULT_PROFILES)

  // 음력 2025-12-29는 양력 2026-02-16으로 변환되어야 함 (양력 연도가 바뀜)
  assert.equal(resultBeforeNewYear.input.lunarConversion.convertedSolarDate, '2026-02-16')
  assert.equal(resultBeforeNewYear.input.lunarConversion.originalLunarDate, '2025-12-29')
})

test('음력 지원 검증 3: 윤달이 존재하는 연도의 윤월 및 평월 교차 변환 검증', () => {
  // 2025년 음력 6월은 윤달이 존재함 (윤6월)
  const regularMonth = prepareInterpretationData({
    ...FIXED_INPUT,
    calendar: 'lunar',
    birthDate: '2025-06-01',
    isLeapMonth: false,
  }, DEFAULT_PROFILES)

  const leapMonthData = prepareInterpretationData({
    ...FIXED_INPUT,
    calendar: 'lunar',
    birthDate: '2025-06-01',
    isLeapMonth: true,
  }, DEFAULT_PROFILES)

  // 평6월 1일 -> 양력 2025-06-25
  assert.equal(regularMonth.input.lunarConversion.convertedSolarDate, '2025-06-25')
  // 윤6월 1일 -> 양력 2025-07-25
  assert.equal(leapMonthData.input.lunarConversion.convertedSolarDate, '2025-07-25')
})

test('음력 지원 검증 4: 윤달이 없는 월에 윤달 지정 시 예외 거부 검증', () => {
  // 2025년 음력 1월은 윤달이 없음
  const badInput = {
    ...FIXED_INPUT,
    calendar: 'lunar',
    birthDate: '2025-01-01',
    isLeapMonth: true,
  }
  assert.match(validatePrepInput(badInput), /음력 윤달이 아닙니다/)
})

test('음력 지원 검증 5: 실제 존재하지 않는 날짜 예외 거부 검증', () => {
  // 음력 2025년 2월은 소월(29일)이므로 30일이 존재하지 않음
  const nonexistentDay = {
    ...FIXED_INPUT,
    calendar: 'lunar',
    birthDate: '2025-02-30',
    isLeapMonth: false,
  }
  assert.match(validatePrepInput(nonexistentDay), /실제로 존재하는 출생일/)

  // 음력 범위 밖의 일수
  const outOfRangeDay = {
    ...FIXED_INPUT,
    calendar: 'lunar',
    birthDate: '2025-01-32',
    isLeapMonth: false,
  }
  assert.match(validatePrepInput(outOfRangeDay), /실제로 존재하는 출생일/)
})

test('음력 지원 검증 6: 사주 계산 범위를 벗어나는 음력 연도 입력 거부 검증', () => {
  const earlyYear = {
    ...FIXED_INPUT,
    calendar: 'lunar',
    birthDate: '1900-12-15',
    isLeapMonth: false,
  }
  assert.match(validatePrepInput(earlyYear), /1901년부터 2100년까지/)

  const lateYear = {
    ...FIXED_INPUT,
    calendar: 'lunar',
    birthDate: '2101-01-10',
    isLeapMonth: false,
  }
  assert.match(validatePrepInput(lateYear), /1901년부터 2100년까지/)
})

test('사주 학파 표준 프로필 고도화 검증 1: 신강약, 격국, 용신 도출 정밀 검사', () => {
  const result = prepareInterpretationData({
    ...FIXED_INPUT,
    birthDate: '1997-04-21',
    birthTime: '13:30',
  }, DEFAULT_PROFILES)

  const saju = result.systems.saju.raw

  // 1. 신강약 검증 (실험 기능 격리 참조)
  const exp = saju.experimental
  assert.ok(exp, 'experimental 블록이 존재해야 함')
  assert.ok(exp.strength.score !== undefined)
  assert.ok(exp.strength.score >= 0 && exp.strength.score <= 100)
  assert.ok(typeof exp.strength.level === 'string')
  assert.equal(typeof exp.strength.isStrong, 'boolean')
  assert.equal(typeof exp.strength.isWeak, 'boolean')

  // 2. 격국 검증 (실험 기능 격리 참조)
  assert.ok(exp.gyeokguk)
  assert.equal(typeof exp.gyeokguk.name, 'string')
  assert.equal(typeof exp.gyeokguk.type, 'string')
  assert.equal(typeof exp.gyeokguk.reason, 'string')

  // 3. 용신 검증 (실험 기능 격리 참조)
  assert.ok(exp.yongShin)
  assert.equal(typeof exp.yongShin.primaryYongShinElement, 'string')
  assert.equal(typeof exp.yongShin.heeShinElement, 'string')
  assert.equal(typeof exp.yongShin.statement, 'string')
  assert.equal(typeof exp.yongShin.confidence, 'string')
})

test('사주 학파 표준 프로필 고도화 검증 2: 6대 신살 및 천간/지지 세부 관계 결합 검사', () => {
  const result = prepareInterpretationData({
    ...FIXED_INPUT,
    birthDate: '1997-04-21',
    birthTime: '13:30',
  }, DEFAULT_PROFILES)

  const saju = result.systems.saju.raw

  // 1. 신살 검증 (실험 기능 격리 참조)
  const exp = saju.experimental
  assert.ok(exp, 'experimental 블록이 존재해야 함')
  assert.ok(Array.isArray(exp.shinsal))
  exp.shinsal.forEach((s) => {
    assert.equal(typeof s.name, 'string')
    assert.ok(['year', 'month', 'day', 'hour', 'time'].includes(s.position))
    assert.equal(typeof s.branch, 'string')
    assert.equal(typeof s.formula, 'string')
  })

  // 2. 천간 관계 검증
  assert.ok(saju.stemRelations)
  assert.ok(saju.stemRelations.ruleVersion)
  assert.ok(Array.isArray(saju.stemRelations.items))
  saju.stemRelations.items.forEach((item) => {
    assert.equal(typeof item.relation, 'string')
    assert.ok(Array.isArray(item.stems))
    assert.equal(typeof item.assessment.presence, 'boolean')
    assert.equal(typeof item.assessment.establishment, 'boolean')
    if (item.assessment.transmutation !== undefined) {
      assert.equal(typeof item.assessment.transmutation, 'boolean')
    }
    assert.equal(typeof item.assessment.description, 'string')
  })


  // 3. 지지 관계 검증 (합화, 성립, 설명 필드 확장 점검)
  assert.ok(saju.branchRelations)
  saju.branchRelations.items.forEach((item) => {
    assert.equal(typeof item.relation, 'string')
    assert.ok(Array.isArray(item.branches))
    assert.equal(typeof item.assessment.presence, 'boolean')
    assert.equal(typeof item.assessment.establishment, 'boolean')
    assert.equal(typeof item.assessment.description, 'string')
  })

  // 4. 최종 계산 상태가 잘 구성되었는지 확인
  assert.ok(result.systems.saju.status)
})

test('도화살 삼합국 매핑 프로필 회귀 테스트 (해묘미 -> 자)', () => {
  // 해묘미(목국) 삼합지(연지 해수, 일지 미토) 기준 '자(子)'수가 도화살로 검출되는지 명밀하게 회귀 검증
  // 을해(乙亥)년 정해(丁亥)월 을미(乙未)일 병자(丙子)시 명조
  const testInput = {
    ...FIXED_INPUT,
    birthDate: '1995-11-20',
    birthTime: '00:30', // 시지가 '자(子)'수이므로 도화살이 시지에 정확히 매핑되어야 함
  }
  const result = prepareInterpretationData(testInput, DEFAULT_PROFILES)
  const exp = result.systems.saju.raw.experimental

  const hasDohwaAtHour = exp.shinsal.some(s => s.name === '도화살' && s.position === 'hour' && s.branch === '자')
  assert.ok(hasDohwaAtHour, '해미(亥未) 기준 자(子)수 도화살이 시지에 정상적으로 검출되는지 회귀 대조 완료')
})
