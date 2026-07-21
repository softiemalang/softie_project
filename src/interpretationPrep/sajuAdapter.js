import { analyzeNatalStructure } from '../saju/engine/core.js'
import {
  calculateFourPillars,
  DEFAULT_SAJU_OPTIONS,
  SAJU_ENGINE_VERSION,
} from '../saju/engine/fourPillars.js'
import { ELEMENTS, YIN_YANG } from '../saju/engine/constants.js'
import { SAJU_ADAPTER_VERSION } from './schema.js'

const PILLAR_LABELS = {
  year: '연주',
  month: '월주',
  day: '일주',
  hour: '시주',
}

const UNSUPPORTED_SAJU_ITEMS = [
  '대운 순행·역행 및 시작 나이',
  '세운·월운·일진과 원국의 전체 작용',
  '12운성 및 신살',
  '합·충·형·파·해의 완전 판정',
  '사용자 좌표 기반 진태양시 보정',
]

function confidenceFromAccuracy(timeAccuracy) {
  if (timeAccuracy === 'exact') return 'high'
  if (timeAccuracy === 'approximate') return 'medium'
  return 'low'
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
  const confidence = hasSolarTermUncertainty ? 'medium' : confidenceFromAccuracy(timeAccuracy)
  const structuralConfidence = hasSolarTermUncertainty ? 'medium' : 'high'
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
      statement: `표면 십성 배치에서 ${tenGod}이 ${count}회 반복된다.`,
      evidence: [{ type: 'ten_god_count', reference: `systems.saju.raw.tenGods.visible.${tenGod}`, value: count }],
      strength: Math.min(1, count / 4),
      confidence: structuralConfidence,
      interpretationRange: ['반복되는 십성 구조로 후속 해석 가능', '지장간 십성과 계절 강도를 별도로 확인'],
      tags: ['relationship', 'career', 'money', 'social'],
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

export function calculateSajuSystem(input, profile) {
  if (input.calendar !== 'solar') {
    throw new Error('현재 사주 어댑터는 양력 입력만 지원합니다.')
  }
  if (input.timezone !== 'Asia/Seoul') {
    throw new Error('현재 사주 어댑터는 Asia/Seoul 시간대만 검증되었습니다.')
  }

  const birthTimeUnknown = input.timeAccuracy === 'unknown'
  const referenceBirthTime = birthTimeUnknown ? '12:00' : input.birthTime
  const pillars = calculateFourPillars(
    { birthDate: input.birthDate, birthTime: referenceBirthTime },
    DEFAULT_SAJU_OPTIONS,
  )
  const timeCandidatePillars = birthTimeUnknown
    ? ['00:00', '12:00', '23:59'].map((birthTime) => calculateFourPillars(
        { birthDate: input.birthDate, birthTime },
        DEFAULT_SAJU_OPTIONS,
      ))
    : [pillars]
  const solarTermBoundarySensitive = !birthTimeUnknown && pillars._meta.isNearSolarTermBoundary
  const solarTermCandidateProbeMinutes = pillars._meta.boundaryUncertaintyMinutes + 2
  const solarTermCandidatePillars = solarTermBoundarySensitive
    ? [-solarTermCandidateProbeMinutes, solarTermCandidateProbeMinutes].map((minutes) => {
        const candidateInput = shiftLocalDateTime(input.birthDate, input.birthTime, minutes)
        return calculateFourPillars(candidateInput, DEFAULT_SAJU_OPTIONS)
      })
    : [pillars]
  const analysisPillars = birthTimeUnknown
    ? { year: pillars.year, month: pillars.month, day: pillars.day, hour: {} }
    : pillars
  const analysis = analyzeNatalStructure(analysisPillars)
  const rawPillars = Object.fromEntries(
    Object.entries(PILLAR_LABELS).map(([key, label]) => {
      if (birthTimeUnknown && key === 'hour') {
        return [key, { label, stem: null, branch: null, value: null, candidates: [], status: 'unknown' }]
      }

      const candidateSource = solarTermBoundarySensitive && ['year', 'month'].includes(key)
        ? [pillars, ...solarTermCandidatePillars]
        : timeCandidatePillars
      const candidates = [...new Set(candidateSource.map((candidate) => `${candidate[key].stem}${candidate[key].branch}`))]
      return [key, {
        label,
        stem: pillars[key].stem,
        branch: pillars[key].branch,
        value: candidates.join(' / '),
        referenceValue: `${pillars[key].stem}${pillars[key].branch}`,
        candidates,
        status: candidates.length > 1
          ? (solarTermBoundarySensitive && ['year', 'month'].includes(key) ? 'solar_term_sensitive' : 'time_sensitive')
          : 'calculated',
        stemElement: ELEMENTS[pillars[key].stem],
        branchElement: ELEMENTS[pillars[key].branch],
      }]
    }),
  )
  const dayMasterCandidates = [...new Set(timeCandidatePillars.map((candidate) => candidate.day.stem))]
  const solarTermCandidates = solarTermBoundarySensitive
    ? {
        year: [...new Set([pillars, ...solarTermCandidatePillars].map((candidate) => `${candidate.year.stem}${candidate.year.branch}`))],
        month: [...new Set([pillars, ...solarTermCandidatePillars].map((candidate) => `${candidate.month.stem}${candidate.month.branch}`))],
      }
    : null

  const raw = {
    birthTimeUnknown,
    calculationBasis: birthTimeUnknown ? '정오 기준 연·월·일 분석, 시주 제외, 하루 경계 후보 별도 저장' : '입력 시각 기준',
    calculationUncertainty: {
      solarTermBoundary: solarTermBoundarySensitive ? {
        status: 'candidate_required',
        nearestLongitude: pillars._meta.nearestBoundaryLongitude,
        estimatedDistanceMinutes: Math.round(pillars._meta.boundaryDistanceMinutes * 10) / 10,
        uncertaintyWindowMinutes: pillars._meta.boundaryUncertaintyMinutes,
        candidates: solarTermCandidates,
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
    calculationTrace: [
      `연주·월주: ${pillars._meta.solarLongitudeMethod} 태양 황경으로 입춘 및 절기 월 경계를 판정`,
      '일주: 1970-01-01 신사일 기준 60갑자 일수 차 계산',
      birthTimeUnknown
        ? '시주: 출생시각 미상으로 계산 제외, 00:00·12:00·23:59 후보를 비교해 시간 민감도 기록'
        : '시주: 서울 기준 30분 보정 및 23:30 자시 경계 적용',
      '오행·십성: 천간·지지와 지장간 규칙표를 이용해 별도 집계',
    ],
  }

  const warnings = [
    '절기 계산은 의존성 없는 NOAA·Meeus 근사식을 사용합니다. 홍콩천문대 2013~2016 공개 절입 시각 48건 대조에서 최대 오차가 15분 이내였으며, 현재 엔진은 ±20분을 경계 불확실성 구간으로 취급합니다.',
    '입력 좌표는 기록되지만 현재 엔진의 진태양시 보정에는 사용되지 않습니다.',
  ]
  if (solarTermBoundarySensitive) {
    warnings.push('입력 시각이 절기 경계 불확실성 구간에 있어 연주·월주 후보를 함께 저장했습니다. 외부 고정밀 천문력 대조 전에는 하나로 확정하지 마세요.')
  }
  if (birthTimeUnknown) {
    warnings.push('출생시각 미상으로 시주를 제외했으며, 일주와 일간은 자시 경계에 따라 복수 후보로 저장했습니다.')
  }

  return {
    system: 'saju',
    status: 'partial',
    engine: {
      adapter: SAJU_ADAPTER_VERSION,
      sourceEngine: `softie saju core ${SAJU_ENGINE_VERSION}`,
      options: { ...DEFAULT_SAJU_OPTIONS },
      profile,
    },
    inputNormalization: {
      original: `${input.birthDate} ${birthTimeUnknown ? '출생시각 모름' : input.birthTime} ${input.timezone}`,
      correctedSolarTime: birthTimeUnknown
        ? null
        : Object.values(shiftLocalDateTime(
            input.birthDate,
            input.birthTime,
            -DEFAULT_SAJU_OPTIONS.solarTimeOffsetMinutes,
          )).join(' '),
      correctionMinutes: birthTimeUnknown ? null : -DEFAULT_SAJU_OPTIONS.solarTimeOffsetMinutes,
    },
    raw,
    features: buildFeatures(raw, input.timeAccuracy),
    warnings,
    unsupported: UNSUPPORTED_SAJU_ITEMS,
  }
}
