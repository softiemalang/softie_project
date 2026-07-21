import { analyzeNatalStructure } from '../saju/engine/core.js'
import {
  calculateFourPillars,
  DEFAULT_SAJU_OPTIONS,
  SAJU_ENGINE_VERSION,
} from '../saju/engine/fourPillars.js'
import { ELEMENTS, YIN_YANG } from '../saju/engine/constants.js'
import { getKoreaReferenceCity, KOREA_REFERENCE_CITIES, SAJU_ADAPTER_VERSION } from './schema.js'
import { calculateNatalBranchRelations } from './sajuRelationRules.js'
import { calculateSajuTiming } from './sajuTimingRules.js'

const PILLAR_LABELS = {
  year: '연주',
  month: '월주',
  day: '일주',
  hour: '시주',
}

const SEOUL_STABLE_KST_START = '1961-08-10'
// IANA Asia/Seoul rules: clocks jumped at 02:00 in May and repeated 02:00 in October.
// https://lists.iana.org/hyperkitty/list/tz@iana.org/thread/Y6YDR3PU5PF3YXD6FMWIRYNW22VGSON6/
const SEOUL_DST_PERIODS = {
  1987: { startDate: '1987-05-10', endDate: '1987-10-11' },
  1988: { startDate: '1988-05-08', endDate: '1988-10-09' },
}

const SAJU_SUPPORT_SCOPE = {
  summary: '원국의 핵심 계산은 고정된 규칙 버전으로 재현하고, 판본 선택·추가 입력·고정밀 알고리즘이 필요한 항목은 분리합니다.',
  supported: [
    { item: '사주 네 기둥', basis: '입춘·절기월·진태양시 자정의 야자·조자 분리를 고정한 연·월·일·시주' },
    { item: '원국 기초 구조', basis: '일간·오행 분포·십성·지장간·계절 가중치' },
    { item: '원국 지지 기본 관계', basis: '육합·충·형·파·해의 쌍 조회와 완성된 삼합 조회' },
    { item: '국내 주요 도시 진태양시', basis: '선택 도시 경도 보정과 NOAA 날짜별 균시차를 합산하고 전체 도시 후보 비교' },
    { item: '대운', basis: '연간 음양·성별 순역과 절입 간격 3일당 1년 기산, 경계 후보·원국 관계를 포함한 10개 주기' },
    { item: '세운·월운·일진', basis: '선택 기준일의 절기 간지·본기 십성·원국 및 기간 간 지지 관계 조회' },
    { item: '12운성', basis: '일간 기준 양간 순행·음간 역행 고정표' },
  ],
  limitations: [
    {
      item: '신살',
      reason: '신살은 목록과 적용 기둥이 판본별로 크게 달라, 표준 프로필에서 지원할 최소 목록을 별도로 검증해야 합니다.',
      requirement: 'rule_profile',
    },
    {
      item: '합화·관계 강약·길흉',
      reason: '관계의 존재 여부는 계산하지만, 월령·투간·방합·해소 조건을 종합한 성립 및 우선순위 규칙은 확정하지 않았습니다.',
      requirement: 'rule_profile',
    },
  ],
}

const UNSUPPORTED_SAJU_ITEMS = SAJU_SUPPORT_SCOPE.limitations.map(({ item, reason }) => `${item}: ${reason}`)

function confidenceFromAccuracy(timeAccuracy) {
  if (timeAccuracy === 'exact') return 'high'
  if (timeAccuracy === 'approximate') return 'medium'
  return 'low'
}

function roundMinutes(value) {
  return Math.round(value * 100) / 100
}

function subjectParticle(word) {
  const lastCode = word.charCodeAt(word.length - 1) - 0xAC00
  const hasFinalConsonant = lastCode >= 0 && lastCode <= 0xD7A3 - 0xAC00 && lastCode % 28 !== 0
  return hasFinalConsonant ? '이' : '가'
}

function feature({ id, category, title, statement, evidence, strength, confidence, interpretationRange, tags }) {
  return {
    id,
    system: 'saju',
    category,
    title,
    statement,
    evidence,
    strength,
    confidence,
    interpretationRange,
    timeScope: 'natal',
    tags,
  }
}

function buildFeatures(raw, timeAccuracy) {
  const hasSolarTermUncertainty = Boolean(raw.calculationUncertainty?.solarTermBoundary)
  const hasHistoricalTimezoneUncertainty = raw.calculationUncertainty?.historicalTimezone?.requiresVerification
  const hasDomesticLocationUncertainty = raw.calculationUncertainty?.domesticLocation?.requiresVerification
  const confidence = hasHistoricalTimezoneUncertainty || hasDomesticLocationUncertainty
    ? 'low'
    : hasSolarTermUncertainty ? 'medium' : confidenceFromAccuracy(timeAccuracy)
  const structuralConfidence = hasHistoricalTimezoneUncertainty || hasDomesticLocationUncertainty
    ? 'low'
    : hasSolarTermUncertainty ? 'medium' : 'high'
  const features = []
  if (timeAccuracy === 'unknown') {
    const dayCandidates = raw.pillars.day.candidates || []
    return [feature({
      id: 'saju.natal.unknown-birth-time',
      category: 'identity',
      title: '출생시각 미상 · 일주 후보',
      statement: `출생시각이 없어 시주는 계산에서 제외했다. 현재 규칙에서는 일주 후보가 ${dayCandidates.join('·')}이며 하나로 확정하지 않는다.`,
      evidence: dayCandidates.map((value) => ({
        type: 'pillar_candidate',
        reference: 'systems.saju.raw.pillars.day.candidates',
        value,
      })),
      strength: 0,
      confidence: 'low',
      interpretationRange: ['후보별 차이를 나누어 검토', '출생시각 확인 전 일간을 확정하지 않음'],
      tags: ['identity', 'emotion'],
    })]
  }
  const elementEntries = Object.entries(raw.elements.counts).sort((left, right) => right[1] - left[1])
  const [topElement, topCount] = elementEntries[0]
  const missingElements = elementEntries.filter(([, count]) => count === 0).map(([element]) => element)
  const topTenGods = Object.entries(raw.tenGods.visible)
    .filter(([, count]) => count >= 2)
    .sort((left, right) => right[1] - left[1])

  features.push(feature({
    id: 'saju.natal.day-master',
    category: 'identity',
    title: `${raw.dayMaster.stem}${raw.dayMaster.element} 일간`,
    statement: `원국의 기준점은 ${raw.dayMaster.stem} 일간이며 음양은 ${raw.dayMaster.yinYang}, 오행은 ${raw.dayMaster.element}이다.`,
    evidence: [{ type: 'pillar', reference: 'systems.saju.raw.pillars.day.stem', value: raw.dayMaster.stem }],
    strength: 1,
    confidence,
    interpretationRange: ['일간을 후속 해석의 기준축으로 사용', '계절·통근·분포와 함께 검토 필요'],
    tags: ['identity', 'emotion'],
  }))

  if (topElement && topCount > 0) {
    features.push(feature({
      id: `saju.natal.element-emphasis.${topElement}`,
      category: 'identity',
      title: `${topElement} 오행 표면 분포 강조`,
      statement: `천간과 지지 8글자의 단순 분포에서 ${topElement} 오행이 ${topCount}회로 가장 많이 나타난다.`,
      evidence: [{ type: 'element_count', reference: `systems.saju.raw.elements.counts.${topElement}`, value: topCount }],
      strength: Math.min(1, topCount / 4),
      confidence: structuralConfidence,
      interpretationRange: ['표면 분포의 반복성으로 사용', '계절 가중치와 지장간 분포를 별도로 함께 확인'],
      tags: ['identity', 'career', 'social'],
    }))
  }

  if (missingElements.length > 0) {
    features.push(feature({
      id: 'saju.natal.element-absence',
      category: 'identity',
      title: '표면 글자에 없는 오행',
      statement: `천간과 지지의 단순 분포에는 ${missingElements.join('·')} 오행이 나타나지 않는다. 지장간과 계절 가중치까지 없다는 뜻은 아니다.`,
      evidence: missingElements.map((element) => ({
        type: 'element_count',
        reference: `systems.saju.raw.elements.counts.${element}`,
        value: 0,
      })),
      strength: Math.min(1, missingElements.length / 3),
      confidence: structuralConfidence,
      interpretationRange: ['표면 분포의 공백으로만 표현', '부족하거나 나쁘다고 단정하지 않음'],
      tags: ['identity', 'emotion'],
    }))
  }

  topTenGods.forEach(([tenGod, count]) => {
    features.push(feature({
      id: `saju.natal.ten-god-repeat.${tenGod}`,
      category: tenGod.includes('재') ? 'money' : tenGod.includes('관') ? 'career' : tenGod.includes('식') || tenGod.includes('상') ? 'social' : 'identity',
      title: `${tenGod} 반복`,
      statement: `표면 십성 배치에서 ${tenGod}${subjectParticle(tenGod)} ${count}회 반복된다.`,
      evidence: [{ type: 'ten_god_count', reference: `systems.saju.raw.tenGods.visible.${tenGod}`, value: count }],
      strength: Math.min(1, count / 4),
      confidence: structuralConfidence,
      interpretationRange: ['반복되는 십성 구조로 후속 해석 가능', '지장간 십성과 계절 강도를 별도로 확인'],
      tags: ['relationship', 'career', 'money', 'social'],
    }))
  })

  raw.branchRelations.items.forEach((relation, index) => {
    const branchText = relation.branches.join('·')
    const positionText = relation.positionLabels.join('·')
    features.push(feature({
      id: `saju.natal.branch-relation.${relation.id}`,
      category: 'structure',
      title: `${branchText} ${relation.relation}`,
      statement: `현재 기준 원국의 ${positionText}에서 ${relation.relation} 관계가 고정 규칙표로 조회된다. 성립 강도나 길흉은 판정하지 않는다.`,
      evidence: [{
        type: 'branch_relation',
        reference: `systems.saju.raw.branchRelations.items.${index}`,
        value: relation,
      }],
      strength: 1,
      confidence: structuralConfidence,
      interpretationRange: ['관계 존재 여부만 근거로 사용', '합화·강약·길흉은 별도 규칙 확정 전에 단정하지 않음'],
      tags: ['identity', 'relationship', 'social'],
    }))
  })

  const activeDaYun = raw.timing.daYun.status === 'calculated'
    ? raw.timing.daYun.cycles.find((cycle) => cycle.isActive)
    : null
  if (activeDaYun) {
    features.push(feature({
      id: 'saju.timing.active-da-yun',
      category: 'timing',
      title: `현재 대운 ${activeDaYun.value}`,
      statement: `${raw.timing.targetDate} 기준으로 ${activeDaYun.startDate}부터 시작한 ${activeDaYun.value} 대운 구간에 해당한다.`,
      evidence: [{
        type: 'da_yun_cycle',
        reference: `systems.saju.raw.timing.daYun.cycles.${activeDaYun.index - 1}`,
        value: activeDaYun,
      }],
      strength: 1,
      confidence,
      interpretationRange: ['현재 10년 주기의 배경으로 사용', '원국 및 세운·월운·일진과 함께 검토'],
      tags: ['timing', 'career', 'money', 'relationship'],
    }))
  }

  Object.entries(raw.timing.periods).forEach(([periodKey, period]) => {
    const candidateSummary = period.candidates
      .map((candidate) => `${candidate.value}/${candidate.dayMaster}일간/${candidate.stemTenGod}·${candidate.branchTenGod}/${candidate.twelveStage}`)
      .join(' · ')
    features.push(feature({
      id: `saju.timing.${periodKey}`,
      category: 'timing',
      title: `${period.label} ${period.value}`,
      statement: period.status === 'candidate_required'
        ? `${raw.timing.targetDate} 기준 ${period.label}은 경계 또는 일간 후보에 따라 ${candidateSummary}로 나뉘며 하나로 확정하지 않는다.`
        : `${raw.timing.targetDate} 기준 ${period.label}은 ${period.value}, 천간 십성은 ${period.stemTenGod}, 지지 본기(${period.branchMainStem}) 십성은 ${period.branchTenGod}, 12운성은 ${period.twelveStage}이다.`,
      evidence: [{
        type: 'period_pillar',
        reference: `systems.saju.raw.timing.periods.${periodKey}`,
        value: period.status === 'candidate_required' ? period.candidates : period,
      }],
      strength: 1,
      confidence: period.status === 'candidate_required' ? 'low' : structuralConfidence,
      interpretationRange: ['선택 기준일의 시기 간지로 사용', '길흉은 원국·대운·관계 근거를 함께 보고 해석'],
      tags: ['timing'],
    }))
  })

  return features
}

function shiftLocalDateTime(dateString, timeString, minutes) {
  const [year, month, day] = dateString.split('-').map(Number)
  const [hour, minute] = timeString.split(':').map(Number)
  const value = new Date(Date.UTC(year, month - 1, day, hour, minute + minutes))
  return {
    birthDate: value.toISOString().slice(0, 10),
    birthTime: value.toISOString().slice(11, 16),
  }
}

function formatPillarValue(pillar) {
  return `${pillar.stem}${pillar.branch}`
}

function assessHistoricalSeoulTime(input, birthTimeUnknown, pillars, calculationOptions) {
  if (input.birthDate < SEOUL_STABLE_KST_START) {
    return {
      status: 'historical_offset_unverified',
      requiresVerification: true,
      reason: '1961-08-10 이전 서울 표준시·서머타임 이력은 현재 계산에 직접 반영하지 않음',
      alternativeInput: null,
      alternativePillars: null,
      changedPillars: [],
    }
  }

  if (birthTimeUnknown) return null
  const year = Number(input.birthDate.slice(0, 4))
  const period = SEOUL_DST_PERIODS[year]
  if (!period) return null

  const localKey = `${input.birthDate} ${input.birthTime}`
  const springGapStart = `${period.startDate} 02:00`
  const springGapEnd = `${period.startDate} 03:00`
  const autumnOverlapStart = `${period.endDate} 02:00`
  const autumnOverlapEnd = `${period.endDate} 03:00`

  if (localKey >= springGapStart && localKey < springGapEnd) {
    return {
      status: 'dst_nonexistent_local_time',
      requiresVerification: true,
      reason: '서머타임 시작으로 현지 시계에 존재하지 않았던 시각대',
      alternativeInput: null,
      alternativePillars: null,
      changedPillars: ['hour'],
    }
  }

  if (localKey >= autumnOverlapStart && localKey < autumnOverlapEnd) {
    return {
      status: 'dst_ambiguous_local_time',
      requiresVerification: true,
      reason: '서머타임 종료로 같은 현지 시각이 두 번 존재했던 시각대',
      alternativeInput: null,
      alternativePillars: null,
      changedPillars: ['hour'],
    }
  }

  const isDst = localKey >= `${period.startDate} 03:00` && localKey < `${period.endDate} 02:00`
  if (!isDst) return null

  const alternativeInput = shiftLocalDateTime(input.birthDate, input.birthTime, -60)
  const alternativePillars = calculateFourPillars(alternativeInput, calculationOptions)
  const changedPillars = Object.keys(PILLAR_LABELS).filter(
    (key) => formatPillarValue(pillars[key]) !== formatPillarValue(alternativePillars[key]),
  )

  return {
    status: changedPillars.length > 0 ? 'dst_changes_core_pillars' : 'dst_no_core_change',
    requiresVerification: changedPillars.length > 0,
    reason: changedPillars.length > 0
      ? '서머타임 1시간 환산 전후로 핵심 사주 기둥이 달라짐'
      : '서머타임 기간이지만 1시간 환산 전후 핵심 사주 기둥은 동일함',
    alternativeInput,
    alternativePillars,
    changedPillars,
  }
}

function assessDomesticLocationRange(input, birthTimeUnknown, pillars) {
  if (birthTimeUnknown) return null

  const candidates = KOREA_REFERENCE_CITIES.map((reference) => ({
    ...reference,
    pillars: calculateFourPillars(
      { birthDate: input.birthDate, birthTime: input.birthTime },
      { ...DEFAULT_SAJU_OPTIONS, longitudeDegrees: reference.longitude },
    ),
  }))
  const changedPillars = Object.keys(PILLAR_LABELS).filter((key) =>
    candidates.some((candidate) => formatPillarValue(candidate.pillars[key]) !== formatPillarValue(pillars[key])),
  )

  return {
    status: changedPillars.length > 0
      ? 'domestic_location_changes_core_pillars'
      : 'domestic_location_no_core_change',
    requiresVerification: changedPillars.length > 0,
    reason: changedPillars.length > 0
      ? '국내 주요 도시 진태양시 보정 후보에서 핵심 사주 기둥이 달라짐'
      : '국내 주요 도시 진태양시 보정 후보에서 핵심 사주 기둥이 같음',
    changedPillars,
    candidates,
  }
}

export function calculateSajuSystem(input, profile) {
  if (input.calendar !== 'solar') {
    throw new Error('현재 사주 어댑터는 양력 입력만 지원합니다.')
  }
  if (input.timezone !== 'Asia/Seoul') {
    throw new Error('현재 사주 어댑터는 Asia/Seoul 시간대만 검증되었습니다.')
  }

  const referenceCity = getKoreaReferenceCity(input.referenceCity)
  const calculationOptions = {
    ...DEFAULT_SAJU_OPTIONS,
    longitudeDegrees: referenceCity.longitude,
    solarTimeOffsetMinutes: referenceCity.correctionMinutes,
  }
  const birthTimeUnknown = input.timeAccuracy === 'unknown'
  const referenceBirthTime = birthTimeUnknown ? '12:00' : input.birthTime
  const pillars = calculateFourPillars(
    { birthDate: input.birthDate, birthTime: referenceBirthTime },
    calculationOptions,
  )
  const historicalTimeAssessment = assessHistoricalSeoulTime(input, birthTimeUnknown, pillars, calculationOptions)
  const domesticLocationAssessment = assessDomesticLocationRange(input, birthTimeUnknown, pillars)
  const domesticCorrectionValues = (domesticLocationAssessment?.candidates || [])
    .map((candidate) => candidate.pillars._meta.apparentSolarCorrectionMinutes)
  const domesticCorrectionRange = domesticCorrectionValues.length > 0
    ? [Math.min(...domesticCorrectionValues), Math.max(...domesticCorrectionValues)].map(roundMinutes)
    : null
  const timeCandidatePillars = birthTimeUnknown
    ? ['00:00', '12:00', '23:59'].map((birthTime) => calculateFourPillars(
        { birthDate: input.birthDate, birthTime },
        calculationOptions,
      ))
    : [pillars]
  const solarTermBoundarySensitive = !birthTimeUnknown && pillars._meta.isNearSolarTermBoundary
  const solarTermCandidateProbeMinutes = pillars._meta.boundaryUncertaintyMinutes + 2
  const solarTermCandidatePillars = solarTermBoundarySensitive
    ? [-solarTermCandidateProbeMinutes, solarTermCandidateProbeMinutes].map((minutes) => {
        const candidateInput = shiftLocalDateTime(input.birthDate, input.birthTime, minutes)
        return calculateFourPillars(candidateInput, calculationOptions)
      })
    : [pillars]
  const analysisPillars = birthTimeUnknown
    ? { year: pillars.year, month: pillars.month, day: pillars.day, hour: {} }
    : pillars
  const analysis = analyzeNatalStructure(analysisPillars)
  const branchRelations = calculateNatalBranchRelations(analysisPillars)
  const natalCandidatePillars = [
    ...(birthTimeUnknown ? timeCandidatePillars.map((candidate, index) => ({
      label: `출생시각 미상 후보 ${index + 1}`,
      pillars: candidate,
    })) : []),
    ...(solarTermBoundarySensitive ? solarTermCandidatePillars.map((candidate, index) => ({
      label: `절입 경계 후보 ${index + 1}`,
      pillars: candidate,
    })) : []),
    ...(historicalTimeAssessment?.alternativePillars ? [{
      label: '역사 시간 환산 후보',
      pillars: historicalTimeAssessment.alternativePillars,
    }] : []),
    ...(domesticLocationAssessment?.requiresVerification
      ? domesticLocationAssessment.candidates.map((candidate) => ({
          label: `${candidate.label} 지역 후보`,
          pillars: candidate.pillars,
        }))
      : []),
  ]
  const daYunCandidateSources = [
    ...(solarTermBoundarySensitive ? solarTermCandidatePillars.map((candidate, index) => ({
      label: `절입 경계 후보 ${index + 1}`,
      input,
      pillars: candidate,
    })) : []),
    ...(historicalTimeAssessment?.alternativePillars && historicalTimeAssessment.alternativeInput ? [{
      label: '서머타임 표준시 환산 후보',
      input: { ...input, ...historicalTimeAssessment.alternativeInput },
      pillars: historicalTimeAssessment.alternativePillars,
    }] : []),
    ...(domesticLocationAssessment?.requiresVerification
      ? domesticLocationAssessment.candidates.map((candidate) => ({
          label: `${candidate.label} 지역 후보`,
          input,
          pillars: candidate.pillars,
        }))
      : []),
  ]
  const timing = calculateSajuTiming({
    input,
    pillars,
    natalAnalysis: analysis,
    calculationOptions,
    natalCandidatePillars,
    daYunCandidateSources,
  })
  const rawPillars = Object.fromEntries(
    Object.entries(PILLAR_LABELS).map(([key, label]) => {
      if (birthTimeUnknown && key === 'hour') {
        return [key, { label, stem: null, branch: null, value: null, candidates: [], status: 'unknown' }]
      }

      const candidateSource = solarTermBoundarySensitive && ['year', 'month'].includes(key)
        ? [pillars, ...solarTermCandidatePillars]
        : timeCandidatePillars
      const historicalCandidateSource = historicalTimeAssessment?.requiresVerification
        && historicalTimeAssessment.alternativePillars
        && historicalTimeAssessment.changedPillars.includes(key)
        ? [...candidateSource, historicalTimeAssessment.alternativePillars]
        : candidateSource
      const domesticCandidateSource = domesticLocationAssessment?.requiresVerification
        && domesticLocationAssessment.changedPillars.includes(key)
        ? [...historicalCandidateSource, ...domesticLocationAssessment.candidates.map((candidate) => candidate.pillars)]
        : historicalCandidateSource
      const candidates = [...new Set(domesticCandidateSource.map((candidate) => `${candidate[key].stem}${candidate[key].branch}`))]
      return [key, {
        label,
        stem: pillars[key].stem,
        branch: pillars[key].branch,
        value: candidates.join(' / '),
        referenceValue: `${pillars[key].stem}${pillars[key].branch}`,
        candidates,
        status: candidates.length > 1
          ? (historicalTimeAssessment?.changedPillars.includes(key)
              ? 'historical_time_sensitive'
              : domesticLocationAssessment?.changedPillars.includes(key)
                ? 'domestic_location_sensitive'
              : solarTermBoundarySensitive && ['year', 'month'].includes(key) ? 'solar_term_sensitive' : 'time_sensitive')
          : 'calculated',
        stemElement: ELEMENTS[pillars[key].stem],
        branchElement: ELEMENTS[pillars[key].branch],
      }]
    }),
  )
  const dayMasterCandidates = [...new Set([
    ...timeCandidatePillars.map((candidate) => candidate.day.stem),
    ...(historicalTimeAssessment?.alternativePillars ? [historicalTimeAssessment.alternativePillars.day.stem] : []),
    ...(domesticLocationAssessment?.candidates || []).map((candidate) => candidate.pillars.day.stem),
  ])]
  const solarTermCandidates = solarTermBoundarySensitive
    ? {
        year: [...new Set([pillars, ...solarTermCandidatePillars].map((candidate) => `${candidate.year.stem}${candidate.year.branch}`))],
        month: [...new Set([pillars, ...solarTermCandidatePillars].map((candidate) => `${candidate.month.stem}${candidate.month.branch}`))],
      }
    : null

  const raw = {
    birthTimeUnknown,
    calculationBasis: birthTimeUnknown ? '정오 기준 연·월·일 분석, 시주 제외, 하루 경계 후보 별도 저장' : '입력 시각 기준',
    timeBoundary: {
      rule: pillars._meta.dayBoundaryRule,
      solarTimeMethod: pillars._meta.solarTimeMethod,
      meanSolarCorrectionMinutes: birthTimeUnknown ? null : roundMinutes(pillars._meta.meanSolarCorrectionMinutes),
      equationOfTimeMinutes: birthTimeUnknown ? null : roundMinutes(pillars._meta.equationOfTimeMinutes),
      apparentSolarCorrectionMinutes: birthTimeUnknown ? null : roundMinutes(pillars._meta.apparentSolarCorrectionMinutes),
      correctedSolarDateTime: birthTimeUnknown ? null : pillars._meta.correctedSolarDateTime,
      solarDayShift: birthTimeUnknown ? null : pillars._meta.solarDayShift,
      ziPeriod: birthTimeUnknown ? null : pillars._meta.ziPeriod,
      ziPeriodLabel: birthTimeUnknown
        ? null
        : pillars._meta.ziPeriod === 'night_zi' ? '야자'
          : pillars._meta.ziPeriod === 'early_zi' ? '조자'
            : '자시 아님',
    },
    calculationUncertainty: {
      solarTermBoundary: solarTermBoundarySensitive ? {
        status: 'candidate_required',
        nearestLongitude: pillars._meta.nearestBoundaryLongitude,
        estimatedDistanceMinutes: Math.round(pillars._meta.boundaryDistanceMinutes * 10) / 10,
        uncertaintyWindowMinutes: pillars._meta.boundaryUncertaintyMinutes,
        candidates: solarTermCandidates,
      } : null,
      historicalTimezone: historicalTimeAssessment ? {
        status: historicalTimeAssessment.status,
        requiresVerification: historicalTimeAssessment.requiresVerification,
        reason: historicalTimeAssessment.reason,
        changedPillars: historicalTimeAssessment.changedPillars.map((key) => PILLAR_LABELS[key]),
        standardTimeCandidate: historicalTimeAssessment.alternativeInput
          ? `${historicalTimeAssessment.alternativeInput.birthDate} ${historicalTimeAssessment.alternativeInput.birthTime}`
          : null,
      } : null,
      domesticLocation: domesticLocationAssessment ? {
        status: domesticLocationAssessment.status,
        requiresVerification: domesticLocationAssessment.requiresVerification,
        reason: domesticLocationAssessment.reason,
        changedPillars: domesticLocationAssessment.changedPillars.map((key) => PILLAR_LABELS[key]),
        referenceCandidates: domesticLocationAssessment.candidates.map((candidate) => ({
          id: candidate.id,
          label: candidate.label,
          latitude: candidate.latitude,
          longitude: candidate.longitude,
          meanSolarCorrectionMinutes: roundMinutes(candidate.pillars._meta.meanSolarCorrectionMinutes),
          equationOfTimeMinutes: roundMinutes(candidate.pillars._meta.equationOfTimeMinutes),
          correctionMinutes: roundMinutes(candidate.pillars._meta.apparentSolarCorrectionMinutes),
          pillars: Object.fromEntries(Object.keys(PILLAR_LABELS).map((key) => [key, formatPillarValue(candidate.pillars[key])])),
        })),
      } : null,
    },
    pillars: rawPillars,
    dayMaster: {
      stem: analysis.dayMaster,
      yinYang: YIN_YANG[analysis.dayMaster],
      element: ELEMENTS[analysis.dayMaster],
      candidates: dayMasterCandidates,
    },
    elements: {
      counts: analysis.elementsCount,
      weightedCounts: analysis.weightedElementsCount,
      strong: analysis.strongElements,
      absentOnSurface: analysis.weakElements,
    },
    tenGods: {
      visible: analysis.tenGodsDistribution,
      hidden: analysis.hiddenTenGodsDistribution,
    },
    hiddenStems: analysis.hiddenStemsDistribution,
    season: analysis.seasonalContext,
    strength: {
      baseScore: analysis.strengthScore,
      baseLevel: analysis.dayMasterStrengthLevel,
      adjustedScore: analysis.adjustedStrengthScore,
      adjustedLevel: analysis.adjustedDayMasterStrengthLevel,
      flags: analysis.refinedImbalanceFlags,
    },
    branchRelations,
    timing,
    calculationTrace: [
      `연주·월주: ${pillars._meta.solarLongitudeMethod} 태양 황경으로 입춘 및 절기 월 경계를 판정`,
      '일주: 1970-01-01 신사일 기준 60갑자 일수 차 계산',
      birthTimeUnknown
        ? '시주: 출생시각 미상으로 계산 제외, 00:00·12:00·23:59 후보를 비교해 시간 민감도 기록'
        : `시주·일주: ${referenceCity.label} 경도 보정과 NOAA 균시차를 합산한 진태양시로 국내 주요 도시 후보 비교, 진태양시 자정 전 야자·자정 후 조자 분리`,
      '오행·십성: 천간·지지와 지장간 규칙표를 이용해 별도 집계',
      `지지 관계: ${branchRelations.ruleVersion} 쌍·완성 그룹 조회로 존재 여부만 계산`,
      `운 흐름: ${timing.ruleVersion} 대운 순역·기산점과 ${timing.targetDate} 세운·월운·일진·12운성 계산`,
    ],
  }

  const warnings = [
    '절기 계산은 의존성 없는 NOAA·Meeus 근사식을 사용합니다. 홍콩천문대 2013~2016 공개 절입 시각 48건 대조에서 최대 오차가 15분 이내였으며, 현재 엔진은 ±20분을 경계 불확실성 구간으로 취급합니다.',
    `기준 도시 ${referenceCity.label} 경도 보정에 NOAA 날짜별 균시차를 합산한 진태양시를 적용하고 국내 주요 도시 후보를 비교합니다.`,
  ]
  if (solarTermBoundarySensitive) {
    warnings.push('입력 시각이 절기 경계 불확실성 구간에 있어 연주·월주 후보를 함께 저장했습니다. 외부 고정밀 천문력 대조 전에는 하나로 확정하지 마세요.')
  }
  if (birthTimeUnknown) {
    warnings.push('출생시각 미상으로 시주를 제외했으며, 일주와 일간은 자시 경계에 따라 복수 후보로 저장했습니다.')
  }
  if (timing.daYun.status === 'missing_gender') {
    warnings.push('성별이 선택되지 않아 대운 순역과 시작 나이를 계산하지 않았습니다.')
  } else if (timing.daYun.status === 'missing_birth_time') {
    warnings.push('출생시각이 없어 대운 기산점과 시작 나이를 계산하지 않았습니다.')
  }
  if (timing.daYun.status === 'candidate_required') {
    warnings.push(`대운 후보 확인 필요: ${timing.daYun.uncertaintyReason}`)
  } else if (timing.daYun.startDateRange) {
    warnings.push(`대운 기산일 후보는 ${timing.daYun.startDateRange.join('~')}이며 기준일의 현재 대운은 같습니다.`)
  }
  if (timing.targetDateBoundary.status === 'candidate_required') {
    warnings.push(`운 흐름 기준일 확인 필요: ${timing.targetDateBoundary.reason}. 세운·월운 후보를 함께 저장했습니다.`)
  }
  if (domesticLocationAssessment?.requiresVerification) {
    warnings.push(`국내 지역 보정 확인 필요: ${domesticLocationAssessment.reason}. 가장 가까운 기준 도시를 선택하세요.`)
  }
  if (historicalTimeAssessment?.status === 'historical_offset_unverified') {
    warnings.push('1961-08-10 이전 출생은 당시 서울 표준시와 서머타임 이력을 현재 엔진이 직접 반영하지 않으므로 검증 필요 상태로 표시합니다.')
  } else if (historicalTimeAssessment?.requiresVerification) {
    warnings.push(`1987·1988년 서머타임 확인 필요: ${historicalTimeAssessment.reason}. 입력 기록과 표준시 환산 기준을 확인하세요.`)
  } else if (historicalTimeAssessment?.status === 'dst_no_core_change') {
    warnings.push('1987·1988년 서머타임 기간이지만 1시간 표준시 환산 전후 연주·월주·일주·시주가 같아 검증 필요 상태로 올리지 않았습니다.')
  }

  return {
    system: 'saju',
    status: historicalTimeAssessment?.requiresVerification || domesticLocationAssessment?.requiresVerification || timing.requiresVerification
      ? 'needs_verification'
      : 'partial',
    engine: {
      adapter: SAJU_ADAPTER_VERSION,
      sourceEngine: `softie saju core ${SAJU_ENGINE_VERSION}`,
      options: calculationOptions,
      profile,
    },
    inputNormalization: {
      original: `${input.birthDate} ${birthTimeUnknown ? '출생시각 모름' : input.birthTime} ${input.timezone}`,
      referenceCity: `${referenceCity.label} (${referenceCity.latitude.toFixed(2)}°N, ${referenceCity.longitude.toFixed(2)}°E)`,
      correctedSolarTime: birthTimeUnknown
        ? null
        : pillars._meta.correctedSolarDateTime,
      meanSolarCorrectionMinutes: birthTimeUnknown ? null : roundMinutes(pillars._meta.meanSolarCorrectionMinutes),
      equationOfTimeMinutes: birthTimeUnknown ? null : roundMinutes(pillars._meta.equationOfTimeMinutes),
      correctionMinutes: birthTimeUnknown ? null : roundMinutes(pillars._meta.apparentSolarCorrectionMinutes),
      domesticCorrectionRangeMinutes: birthTimeUnknown
        ? null
        : domesticCorrectionRange,
      ziPeriodLabel: birthTimeUnknown
        ? null
        : pillars._meta.ziPeriod === 'night_zi' ? '야자'
          : pillars._meta.ziPeriod === 'early_zi' ? '조자'
            : '자시 아님',
      dayBoundaryDate: birthTimeUnknown ? null : pillars._meta.correctedSolarDateTime.slice(0, 10),
    },
    raw,
    features: buildFeatures(raw, input.timeAccuracy),
    warnings,
    unsupported: UNSUPPORTED_SAJU_ITEMS,
    supportScope: SAJU_SUPPORT_SCOPE,
  }
}
