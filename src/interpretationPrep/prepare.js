import {
  createEmptySystemResult,
  DEFAULT_INPUT,
  DEFAULT_PROFILES,
  getKoreaReferenceCity,
  INTERPRETATION_PREP_SCHEMA_VERSION,
  KOREA_REFERENCE_CITIES,
  TOPICS,
} from './schema.js'
import { calculateSajuSystem } from './sajuAdapter.js'
import { lunar2solar, leapMonth, leapDays, monthDays } from './lunarConverter.js'

const REQUIRED_INPUTS = ['birthDate', 'targetDate', 'timezone', 'referenceCity']

export function validatePrepInput(input) {
  const missing = REQUIRED_INPUTS.filter((key) => String(input[key] ?? '').trim() === '')
  if (missing.length > 0) return `필수 입력값을 확인해 주세요: ${missing.join(', ')}`
  const birthTimeUnknown = input.timeAccuracy === 'unknown'
  if (!['female', 'male'].includes(input.gender)) return '대운 순역 계산을 위해 성별을 선택해 주세요.'
  if (!birthTimeUnknown && !String(input.birthTime || '').trim()) return '출생시각을 입력하거나 모름을 선택해 주세요.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate)) return '출생일 형식을 확인해 주세요.'
  if (!birthTimeUnknown && !/^\d{2}:\d{2}$/.test(input.birthTime)) return '출생시각 형식을 확인해 주세요.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.targetDate)) return '운 흐름 기준일 형식을 확인해 주세요.'

  const [year, month, day] = input.birthDate.split('-').map(Number)
  const [hour, minute] = birthTimeUnknown ? [null, null] : input.birthTime.split(':').map(Number)

  if (input.calendar === 'lunar') {
    if (year < 1901 || year > 2100) return '현재 검증된 사주 계산 범위는 1901년부터 2100년까지입니다.'
    if (month < 1 || month > 12) return '실제로 존재하는 출생일을 입력해 주세요.'

    const lMonth = leapMonth(year)
    const isLeap = Boolean(input.isLeapMonth)
    if (isLeap && lMonth !== month) {
      return '입력하신 월은 해당 연도의 음력 윤달이 아닙니다.'
    }

    const maxDay = isLeap ? leapDays(year) : monthDays(year, month)
    if (day < 1 || day > maxDay) {
      return '실제로 존재하는 출생일을 입력해 주세요.'
    }

    const conversion = lunar2solar(year, month, day, isLeap)
    if (conversion === -1 || !conversion.solarDate) {
      return '실제로 존재하는 출생일을 입력해 주세요.'
    }

    const [solarYear] = conversion.solarDate.split('-').map(Number)
    if (solarYear < 1901 || solarYear > 2100) {
      return '변환된 양력 날짜가 사주 계산 범위(1901~2100년)를 벗어납니다.'
    }
  } else {
    if (year < 1901 || year > 2100) return '현재 검증된 사주 계산 범위는 1901년부터 2100년까지입니다.'
    const parsedDate = new Date(Date.UTC(year, month - 1, day))
    if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day
    ) return '실제로 존재하는 출생일을 입력해 주세요.'
  }

  const [targetYear, targetMonth, targetDay] = input.targetDate.split('-').map(Number)
  const parsedTargetDate = new Date(Date.UTC(targetYear, targetMonth - 1, targetDay))
  if (
    targetYear < 1901 || targetYear > 2100
    || parsedTargetDate.getUTCFullYear() !== targetYear
    || parsedTargetDate.getUTCMonth() !== targetMonth - 1
    || parsedTargetDate.getUTCDate() !== targetDay
  ) return '운 흐름 기준일은 1901년부터 2100년 사이의 실제 날짜여야 합니다.'
  if (!birthTimeUnknown && (hour > 23 || minute > 59)) return '출생시각 범위를 확인해 주세요.'
  if (!KOREA_REFERENCE_CITIES.some((city) => city.id === input.referenceCity)) return '지원하는 국내 기준 도시를 선택해 주세요.'
  return ''
}

function buildSynthesis(systems) {
  const supportedSystems = Object.values(systems).filter((system) => system.raw)
  const unavailableSystems = Object.values(systems).filter((system) => !system.raw).map((system) => system.system)

  return {
    taxonomyVersion: 'cross-system-taxonomy-0.1.0',
    agreements: [],
    complementary: [],
    tensions: [],
    uncertainties: [{
      id: 'synthesis.system-coverage',
      theme: 'system_coverage',
      summary: `현재 실제 계산 결과가 있는 체계는 ${supportedSystems.length}/3개이므로 체계 간 공통·보완·긴장 판정을 생성하지 않는다.`,
      supportedBy: supportedSystems.map((system) => system.system),
      missingSystems: unavailableSystems,
      featureIds: [],
      confidence: 'high',
    }],
  }
}

export function prepareInterpretationData(input, profiles = DEFAULT_PROFILES) {
  const validationMessage = validatePrepInput(input)
  if (validationMessage) throw new Error(validationMessage)

  const referenceCity = getKoreaReferenceCity(input.referenceCity)
  const { source: _ignoredSource, ...inputWithoutSource } = input

  let birthDateSolar = input.birthDate
  let lunarConversion = null

  if (input.calendar === 'lunar') {
    const [year, month, day] = input.birthDate.split('-').map(Number)
    const conversion = lunar2solar(year, month, day, Boolean(input.isLeapMonth))
    birthDateSolar = conversion.solarDate

    const [solarYear] = birthDateSolar.split('-').map(Number)
    const isKasiVerified = solarYear >= 1951 && solarYear <= 2050
    lunarConversion = {
      originalLunarDate: input.birthDate,
      isLeapMonth: Boolean(input.isLeapMonth),
      convertedSolarDate: birthDateSolar,
      verificationScope: isKasiVerified ? 'kasi_reference_range_unverified' : 'external_lunar_tables',
      source: isKasiVerified ? 'External Table (KASI-matching range 1951-2050)' : 'External Astrological Lunar Table',
      scopeLabel: isKasiVerified
        ? 'KASI 표준 대조 범위 내 (자체 전수 검증 대조 전, 1951~2050년)'
        : '전통 명리 음양력 대조 테이블 범위 (KASI 비지원 영역, 1901~1950년 및 2051~2100년)',
    }
  }

  const normalizedInput = {
    ...inputWithoutSource,
    calendar: 'solar', // 후속 코드가 이중 음력 변환하는 오류를 막기 위해 양력 계약 보장
    isLeapMonth: false, // 양력 날짜 규격 상 윤달 플래그 무력화
    birthDate: birthDateSolar,
    birthTime: input.timeAccuracy === 'unknown' ? '' : input.birthTime,
    targetDate: input.targetDate.trim(),
    subjectName: input.subjectName.trim(),
    placeName: DEFAULT_INPUT.placeName,
    gender: ['female', 'male'].includes(input.gender) ? input.gender : DEFAULT_INPUT.gender,
    referenceCity: referenceCity.id,
    referenceCityLabel: referenceCity.label,
    latitude: referenceCity.latitude,
    longitude: referenceCity.longitude,
  }

  const systems = {
    saju: calculateSajuSystem({
      ...normalizedInput,
      originalCalendar: input.calendar,
      originalIsLeapMonth: input.calendar === 'lunar' ? Boolean(input.isLeapMonth) : false,
      originalBirthDate: input.birthDate,
    }, profiles.saju),
    ziwei: createEmptySystemResult('ziwei', 'needs_profile', [
      '음력 변환·윤달·명궁·신궁·사화표 판본을 확정한 뒤 계산 모듈을 연결해야 합니다.',
    ]),
    astrology: createEmptySystemResult('astrology', 'unsupported', [
      '정확한 천문력과 하우스·애스펙트 계산 라이브러리를 검증한 뒤 연결해야 합니다.',
    ]),
  }

  systems.ziwei.engine = { profile: profiles.ziwei }
  systems.astrology.engine = { profile: profiles.astrology }

  const originalInputWithLunar = {
    ...normalizedInput,
    birthDate: input.birthDate,
    calendar: input.calendar,
    isLeapMonth: input.isLeapMonth,
  }

  return {
    schemaVersion: INTERPRETATION_PREP_SCHEMA_VERSION,
    input: {
      original: originalInputWithLunar,
      normalized: normalizedInput,
      lunarConversion,
    },
    calculationProfiles: profiles,
    systems,
    synthesis: buildSynthesis(systems),
  }
}

export function selectTopicFeatures(result, topicId) {
  const topic = TOPICS.find((item) => item.id === topicId) || TOPICS[0]
  const features = Object.values(result.systems).flatMap((system) => system.features)
  if (topic.tags.length === 0) return features
  return features.filter((feature) => feature.tags.some((tag) => topic.tags.includes(tag)))
}

export function buildExportPayload(result, { type, topicId, question, generatedAt }) {
  const topic = TOPICS.find((item) => item.id === topicId) || TOPICS[0]
  const base = {
    exportVersion: '1.4.0',
    exportType: type,
    generatedAt,
    schemaVersion: result.schemaVersion,
  }

  if (type === 'verification') {
    return {
      ...base,
      input: result.input,
      calculationProfiles: result.calculationProfiles,
      systems: result.systems,
      synthesis: result.synthesis,
    }
  }

  const selectedFeatures = selectTopicFeatures(result, topic.id)
  return {
    ...base,
    target: {
      topic: topic.label,
      question: question.trim() || null,
    },
    birthSummary: result.input.normalized,
    calculationProfileSummary: Object.fromEntries(
      Object.entries(result.calculationProfiles).map(([system, profile]) => [system, {
        profileVersion: profile.profileVersion,
        status: result.systems[system].status,
      }]),
    ),
    calculationSummary: {
      saju: {
        pillars: result.systems.saju.raw.pillars,
        dayMaster: result.systems.saju.raw.dayMaster,
        timeBoundary: result.systems.saju.raw.timeBoundary,
        branchRelations: result.systems.saju.raw.branchRelations,
        stemRelations: result.systems.saju.raw.stemRelations,
        gyeokguk: result.systems.saju.raw.experimental?.gyeokguk,
        yongShin: result.systems.saju.raw.experimental?.yongShin,
        strength: result.systems.saju.raw.experimental?.strength,
        shinsal: result.systems.saju.raw.experimental?.shinsal,
        timing: result.systems.saju.raw.timing,
        calculationUncertainty: result.systems.saju.raw.calculationUncertainty,
        supportScope: result.systems.saju.supportScope,
        unsupported: result.systems.saju.unsupported,
        inputNormalization: result.systems.saju.inputNormalization,
        engine: result.systems.saju.engine,
      },
    },
    features: selectedFeatures,
    synthesis: result.synthesis,
    uncertainties: Object.values(result.systems).flatMap((system) => system.warnings.map((warning) => ({
      system: system.system,
      warning,
    }))),
    instruction: '위 자료는 페이지에서 계산 및 구조화된 결과다. 제공된 계산값을 임의로 변경하지 말고 이를 근거로 해석하라. 사주·자미두수·점성학을 각각 먼저 살펴본 뒤 공통점, 보완점, 긴장점을 구분하라. 확정할 수 없는 부분은 가능성으로 표현하고 사용자의 실제 상황과 질문을 반영해 현실적으로 설명하라.',
  }
}

function formatFeatureMarkdown(item) {
  const evidence = item.evidence.map((entry) => `  - 근거: \`${entry.reference}\` = ${JSON.stringify(entry.value)}`).join('\n')
  return `- **${item.title}** (${item.system}, 강도 ${item.strength}, 신뢰도 ${item.confidence})\n  - ${item.statement}\n${evidence}`
}

export function exportPayloadToMarkdown(payload) {
  if (payload.exportType === 'verification') {
    return [
      '# 해석 준비 도구 · 검증용 상세 출력',
      '',
      `- 생성 시각: ${payload.generatedAt}`,
      `- 스키마 버전: ${payload.schemaVersion}`,
      '',
      '## 상세 JSON',
      '',
      '```json',
      JSON.stringify(payload, null, 2),
      '```',
    ].join('\n')
  }

  const features = payload.features.length > 0
    ? payload.features.map(formatFeatureMarkdown).join('\n')
    : '- 현재 주제에 포함할 수 있는 검증된 특징이 없음'
  const uncertainties = payload.uncertainties.length > 0
    ? payload.uncertainties.map((item) => `- ${item.system}: ${item.warning}`).join('\n')
    : '- 없음'
  const sajuPillars = Object.values(payload.calculationSummary.saju.pillars)
    .map((pillar) => `${pillar.label}: ${pillar.value || '미상'}${pillar.candidates?.length > 1 ? ` (후보 ${pillar.candidates.join(' · ')})` : ''}`)
    .join('\n- ')
  const timing = payload.calculationSummary.saju.timing
  const periods = Object.values(timing.periods)
    .map((period) => period.status === 'candidate_required'
      ? `${period.label}: 후보 ${period.candidates.map((candidate) => `${candidate.value}/${candidate.dayMaster}일간/${candidate.stemTenGod}·본기${candidate.branchMainStem}(${candidate.branchTenGod})/12운성 ${candidate.twelveStage}`).join(' | ')}`
      : `${period.label}: ${period.value} (${period.stemTenGod}·본기${period.branchMainStem}(${period.branchTenGod}), 12운성 ${period.twelveStage})`)
    .join('\n- ')
  const activeDaYun = timing.daYun.status === 'calculated'
    ? timing.daYun.cycles.find((cycle) => cycle.isActive)
    : null
  const daYunSummary = timing.daYun.status === 'candidate_required'
    ? `후보 확인 필요 · ${timing.daYun.candidates.map((candidate) => `${candidate.sourceLabel} ${candidate.directionLabel}/${candidate.monthPillar}/첫 대운 ${candidate.cycles[0]?.value}/현재 ${candidate.cycles.find((cycle) => cycle.isActive)?.value || '없음'}`).join(' | ')}`
    : timing.daYun.status === 'calculated'
    ? `${timing.daYun.directionLabel} · ${timing.daYun.startAge.years}년 ${timing.daYun.startAge.months}개월 ${timing.daYun.startAge.days}일 기산 · 기준일 해당 ${activeDaYun?.value || '없음'}`
    : timing.daYun.reason

  const saju = payload.calculationSummary.saju
  let gyeokgukText = saju.gyeokguk && saju.gyeokguk.name !== '불명'
    ? `- **[Experimental] 격국**: ${saju.gyeokguk.name} (${saju.gyeokguk.type} · ${saju.gyeokguk.reason})`
    : '- **[Experimental] 격국**: 미성격 또는 분석 불능'
  if (saju.gyeokguk?.specialStructureCandidate) {
    const cand = saju.gyeokguk.specialStructureCandidate
    gyeokgukText += `\n  - **특수격 후보 (참고)**: ${cand.name} (${cand.type} · ${cand.reason})`
  }
  const yongshinText = saju.yongShin
    ? `- **[Experimental] 희용신**: 용신 오행 ${saju.yongShin.primaryYongShinElement} / 희신 오행 ${saju.yongShin.heeShinElement} (억부: ${saju.yongShin.statement}${saju.yongShin.chohu ? ` / 조후: ${saju.yongShin.chohu.statement}` : ''})`
    : '- **[Experimental] 희용신**: 분석 불능'
  const shinsalSummary = saju.shinsal && saju.shinsal.length > 0
    ? `- **[Experimental] 신살**: ${saju.shinsal.map(s => `${s.name}(${s.position === 'year' ? '연지' : s.position === 'month' ? '월지' : s.position === 'day' ? '일지' : s.position === 'hour' ? '시지' : '불명'}: ${s.branch})`).join(', ')}`
    : '- **[Experimental] 신살**: 감지된 주요 신살 없음'
  const stemRelationSummary = saju.stemRelations && saju.stemRelations.items.length > 0
    ? `- **천간 관계**: ${saju.stemRelations.items.map(r => `${r.relation === '천간합' ? `${r.label}(${r.assessment.transmutation ? '합화성립' : '합반'})` : `${r.stems.join('·')}충`}`).join(', ')}`
    : '- **천간 관계**: 특이 상호작용 없음'

  const isLunar = payload.calculationSummary.saju.inputNormalization.calendarType === 'lunar'
  const originalLunar = payload.calculationSummary.saju.inputNormalization.originalLunarDate
  const isLeap = payload.calculationSummary.saju.inputNormalization.isLeapMonth
  const convertedSolar = payload.calculationSummary.saju.inputNormalization.convertedSolarDate
  const lunarSource = payload.calculationSummary.saju.engine?.profile?.lunarConversionSource || 'External Table (KASI-matching range 1951-2050)'

  const birthSummaryText = isLunar
    ? `음력 ${originalLunar} (${isLeap ? '윤달' : '평달'}) -> 변환 양력 ${convertedSolar} (출처: ${lunarSource}) ${payload.birthSummary.birthTime || '출생시각 모름'} (${payload.birthSummary.timezone})`
    : `${payload.birthSummary.birthDate} ${payload.birthSummary.birthTime || '출생시각 모름'} (${payload.birthSummary.timezone})`

  return [
    '# 해석 준비 도구 · 대화용 패키지',
    '',
    `- 주제: ${payload.target.topic}`,
    `- 질문: ${payload.target.question || '지정하지 않음'}`,
    `- 출생정보: ${birthSummaryText}`,
    `- 지원 지역: ${payload.birthSummary.placeName}`,
    `- 기준 도시: ${payload.birthSummary.referenceCityLabel} (${payload.birthSummary.latitude}, ${payload.birthSummary.longitude})`,

    '',
    '## 계산 요약',
    '',
    `- ${sajuPillars}`,
    '',
    '## Experimental 사주 분석 프로필 (검증단계)',
    '※ 주의: 아래 항목들은 검증단계의 학술적 실험 결과물입니다. 공식 확정값이 아니므로 해석 시 신중히 검토해 주시기 바랍니다.',
    '',
    gyeokgukText,
    yongshinText,
    shinsalSummary,
    stemRelationSummary,
    '',
    '## 운 흐름 기준값',
    '',
    `- 기준일: ${timing.targetDate}`,
    `- 대운: ${daYunSummary}`,
    `- ${periods}`,
    `- 범위: ${timing.interpretationScope}`,
    '',
    '## 체계별 핵심 특징',
    '',
    features,
    '',
    '## 통합 구조',
    '',
    '- 공통점: 비교 가능한 체계가 2개 미만이므로 생성하지 않음',
    '- 보완점: 비교 가능한 체계가 2개 미만이므로 생성하지 않음',
    '- 긴장점: 비교 가능한 체계가 2개 미만이므로 생성하지 않음',
    '',
    '## 불확실성 및 제한/미지원 범위',
    '',
    '### 1. 사용자 경고 및 불확실성 (Uncertainties)',
    uncertainties,
    '',
    '### 2. 계산/판정 제약 조건 (Limitations)',
    payload.calculationSummary.saju.supportScope.limitations.map(lim => `- **${lim.title}** (${lim.status}): ${lim.impact}`).join('\n'),
    '',
    '### 3. 미구현 미지원 기능 (Unsupported)',
    payload.calculationSummary.saju.unsupported.map(un => `- **${un.title}** (${un.status})${un.examples ? ` (예: ${un.examples.join(', ')})` : ''}`).join('\n'),
    '',
    '## 해석 모델 지시문',
    '',
    payload.instruction,
  ].join('\n')
}

/**
 * Developer Only - Compiles and exports the complete validation report to Markdown
 */
import { sajuValidationFixtures } from './fixtures/sajuValidationFixtures.js'
import { runSajuValidationSuite, buildValidationReport as compileReport } from './sajuValidationRunner.js'

export function exportValidationReportToMarkdown() {
  const summary = runSajuValidationSuite(sajuValidationFixtures, prepareInterpretationData)
  return compileReport(summary)
}
