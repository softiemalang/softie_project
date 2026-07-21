import { analyzeNatalStructure, analyzePeriodPillar, getBranchMainStem, getTenGod } from '../saju/engine/core.js'
import { BRANCHES, ELEMENTS, STEMS, YIN_YANG } from '../saju/engine/constants.js'
import { calculateFourPillars } from '../saju/engine/fourPillars.js'
import { getAdjacentBaziMonthBoundary } from '../saju/engine/solarTerms.js'
import { calculateBranchGroupRelations, calculateBranchPairRelations, calculatePeriodBranchRelations } from './sajuRelationRules.js'

export const SAJU_TIMING_RULE_VERSION = 'softie-saju-standard-v1.3'

const TWELVE_STAGES = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양']
const LONGEVITY_START_BRANCH = {
  갑: '해', 을: '오', 병: '인', 정: '유', 무: '인',
  기: '유', 경: '사', 신: '자', 임: '신', 계: '묘',
}

function uniqueBy(items, keyFor) {
  const seen = new Set()
  return items.filter((item) => {
    const key = keyFor(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function cycleIndex(stem, branch) {
  return Array.from({ length: 60 }, (_, index) => index)
    .find((index) => STEMS[index % 10] === stem && BRANCHES[index % 12] === branch)
}

function stepPillar(pillar, steps) {
  const index = cycleIndex(pillar.stem, pillar.branch)
  if (index == null) throw new Error('유효한 간지 조합이 아닙니다.')
  const nextIndex = ((index + steps) % 60 + 60) % 60
  return { stem: STEMS[nextIndex % 10], branch: BRANCHES[nextIndex % 12] }
}

function daysInMonth(year, monthIndex) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
}

function addYearsClamped(date, years) {
  const targetYear = date.getUTCFullYear() + years
  const month = date.getUTCMonth()
  const day = Math.min(date.getUTCDate(), daysInMonth(targetYear, month))
  return new Date(Date.UTC(targetYear, month, day))
}

function addMonthsClamped(date, months) {
  const totalMonths = date.getUTCFullYear() * 12 + date.getUTCMonth() + months
  const targetYear = Math.floor(totalMonths / 12)
  const targetMonth = ((totalMonths % 12) + 12) % 12
  const day = Math.min(date.getUTCDate(), daysInMonth(targetYear, targetMonth))
  return new Date(Date.UTC(targetYear, targetMonth, day))
}

export function addCalendarAge(dateString, age) {
  const [year, month, day] = dateString.split('-').map(Number)
  let date = new Date(Date.UTC(year, month - 1, day))
  date = addYearsClamped(date, age.years)
  date = addMonthsClamped(date, age.months)
  date.setUTCDate(date.getUTCDate() + age.days)
  return date.toISOString().slice(0, 10)
}

function addYears(dateString, years) {
  const [year, month, day] = dateString.split('-').map(Number)
  return addYearsClamped(new Date(Date.UTC(year, month - 1, day)), years).toISOString().slice(0, 10)
}

function formatPillar(pillar) {
  return `${pillar.stem}${pillar.branch}`
}

function formatPillarSet(pillars) {
  return ['year', 'month', 'day', 'hour']
    .map((position) => pillars[position]?.stem ? formatPillar(pillars[position]) : '-')
    .join('|')
}

export function getTwelveStage(dayStem, branch) {
  const startBranch = LONGEVITY_START_BRANCH[dayStem]
  const startIndex = BRANCHES.indexOf(startBranch)
  const branchIndex = BRANCHES.indexOf(branch)
  if (startIndex < 0 || branchIndex < 0) return null
  const direction = YIN_YANG[dayStem] === '양' ? 1 : -1
  const offset = ((branchIndex - startIndex) * direction % 12 + 12) % 12
  return TWELVE_STAGES[offset]
}

function buildPillarDetail(dayStem, pillar) {
  const branchMainStem = getBranchMainStem(pillar.branch)
  return {
    ...pillar,
    value: formatPillar(pillar),
    stemElement: ELEMENTS[pillar.stem],
    branchElement: ELEMENTS[pillar.branch],
    stemTenGod: getTenGod(dayStem, pillar.stem),
    branchMainStem,
    branchTenGod: getTenGod(dayStem, branchMainStem),
    twelveStage: getTwelveStage(dayStem, pillar.branch),
  }
}

function buildPeriod(label, pillar, natalPillars, natalAnalysis) {
  return {
    label,
    ...buildPillarDetail(natalAnalysis.dayMaster, pillar),
    dayMaster: natalAnalysis.dayMaster,
    analysis: analyzePeriodPillar(natalAnalysis, pillar, label),
    branchRelations: calculatePeriodBranchRelations(natalPillars, pillar, label),
  }
}

function mergePeriodCandidates(label, periodPillars, natalCandidates) {
  const candidates = uniqueBy(
    periodPillars.flatMap((periodPillar) => natalCandidates.map((natal) => ({
      sourceLabels: [...new Set([periodPillar.sourceLabel, natal.label])],
      ...buildPeriod(label, periodPillar.pillar, natal.pillars, natal.analysis),
    }))),
    (candidate) => [
      candidate.value,
      candidate.dayMaster,
      candidate.stemTenGod,
      candidate.branchTenGod,
      candidate.twelveStage,
      JSON.stringify(candidate.branchRelations.items),
    ].join('|'),
  )
  const primary = candidates[0]
  return {
    ...primary,
    status: candidates.length > 1 ? 'candidate_required' : 'calculated',
    candidates,
  }
}

export function calculateStartAge(distanceMinutes) {
  const symbolicDays = distanceMinutes / 12
  const roundedDays = Math.round(symbolicDays)
  const years = Math.floor(roundedDays / 360)
  const remainderAfterYears = roundedDays % 360
  const months = Math.floor(remainderAfterYears / 30)
  const days = remainderAfterYears % 30
  return {
    years,
    months,
    days,
    decimalYears: Number((symbolicDays / 360).toFixed(4)),
    conversion: '3일=1년 · 1일=4개월 · 2시간=10일',
  }
}

function calculateDaYunSingle(input, pillars, natalAnalysis, calculationOptions, targetDate, sourceLabel) {
  const yearYinYang = YIN_YANG[pillars.year.stem]
  const forward = (input.gender === 'male' && yearYinYang === '양')
    || (input.gender === 'female' && yearYinYang === '음')
  const direction = forward ? 'forward' : 'backward'
  const [year, month, day] = input.birthDate.split('-').map(Number)
  const [hour, minute] = input.birthTime.split(':').map(Number)
  const boundary = getAdjacentBaziMonthBoundary(year, month, day, hour, minute, direction)
  const startAge = calculateStartAge(boundary.distanceMinutes)
  const firstStartDate = addCalendarAge(input.birthDate, startAge)
  const step = forward ? 1 : -1
  const cycles = Array.from({ length: 10 }, (_, index) => {
    const pillar = stepPillar(pillars.month, step * (index + 1))
    const startDate = addYears(firstStartDate, index * 10)
    const nextStartDate = addYears(firstStartDate, (index + 1) * 10)
    return {
      index: index + 1,
      ...buildPeriod('대운', pillar, pillars, natalAnalysis),
      startDate,
      nextStartDate,
      startAgeYears: Number((startAge.decimalYears + index * 10).toFixed(4)),
      isActive: targetDate >= startDate && targetDate < nextStartDate,
    }
  })

  return {
    sourceLabel,
    status: 'calculated',
    direction,
    directionLabel: forward ? '순행' : '역행',
    basis: `${yearYinYang}년생 ${input.gender === 'male' ? '남성' : '여성'}`,
    monthPillar: formatPillar(pillars.month),
    referenceBoundary: boundary,
    startAge,
    firstStartDate,
    cycles,
    activeCycleIndex: cycles.find((cycle) => cycle.isActive)?.index || null,
    calculationOptions,
  }
}

function mergeDaYunCandidates(input, candidateSources, calculationOptions, targetDate) {
  const hasGender = ['male', 'female'].includes(input.gender)
  const hasBirthTime = input.timeAccuracy !== 'unknown' && Boolean(input.birthTime)
  if (!hasGender || !hasBirthTime) {
    return {
      status: !hasGender ? 'missing_gender' : 'missing_birth_time',
      direction: null,
      reason: !hasGender ? '대운 순역 계산에 성별 선택이 필요함' : '대운 기산점 계산에 출생시각이 필요함',
      cycles: [],
      candidates: [],
      requiresVerification: false,
    }
  }

  const candidates = uniqueBy(
    candidateSources.map((source) => calculateDaYunSingle(
      source.input,
      source.pillars,
      source.analysis,
      calculationOptions,
      targetDate,
      source.label,
    )),
    (candidate) => [
      candidate.direction,
      candidate.monthPillar,
      candidate.firstStartDate,
      candidate.cycles.map((cycle) => cycle.value).join(','),
      candidate.activeCycleIndex,
    ].join('|'),
  )
  const primary = candidates[0]
  const materialKeys = new Set(candidates.map((candidate) => [
    candidate.direction,
    candidate.monthPillar,
    candidate.cycles.map((cycle) => cycle.value).join(','),
    candidate.activeCycleIndex,
  ].join('|')))
  const firstStartDates = candidates.map((candidate) => candidate.firstStartDate).sort()
  const requiresVerification = materialKeys.size > 1

  return {
    ...primary,
    status: requiresVerification ? 'candidate_required' : 'calculated',
    candidates,
    requiresVerification,
    startDateRange: firstStartDates.length > 1
      ? [firstStartDates[0], firstStartDates[firstStartDates.length - 1]]
      : null,
    uncertaintyReason: requiresVerification
      ? '출생 경계 후보에 따라 대운 배열 또는 기준일의 현재 대운이 달라짐'
      : firstStartDates.length > 1
        ? '역사 시간 환산 후보에 따라 대운 기산일만 달라지며 기준일의 현재 대운은 같음'
        : null,
  }
}

function buildNatalCandidates(primaryPillars, primaryAnalysis, candidates, birthTimeUnknown) {
  const normalizedPrimaryPillars = birthTimeUnknown
    ? { year: primaryPillars.year, month: primaryPillars.month, day: primaryPillars.day, hour: {} }
    : primaryPillars
  return uniqueBy([
    { label: '기준값', pillars: normalizedPrimaryPillars, analysis: primaryAnalysis },
    ...candidates.map((candidate) => {
      const analysisPillars = birthTimeUnknown
        ? { year: candidate.pillars.year, month: candidate.pillars.month, day: candidate.pillars.day, hour: {} }
        : candidate.pillars
      return {
        ...candidate,
        analysis: analyzeNatalStructure(analysisPillars),
        pillars: analysisPillars,
      }
    }),
  ], (candidate) => `${formatPillarSet(candidate.pillars)}|${candidate.analysis.dayMaster}`)
}

function buildNatalTwelveStages(natalCandidates) {
  return Object.fromEntries(['year', 'month', 'day', 'hour'].map((position) => {
    const candidates = uniqueBy(natalCandidates.map((natal) => {
      const branch = natal.pillars[position]?.branch || null
      return {
        sourceLabel: natal.label,
        dayMaster: natal.analysis.dayMaster,
        branch,
        stage: branch ? getTwelveStage(natal.analysis.dayMaster, branch) : null,
      }
    }), (candidate) => `${candidate.dayMaster}|${candidate.branch}|${candidate.stage}`)
    return [position, {
      branch: candidates[0]?.branch || null,
      stage: candidates[0]?.stage || null,
      status: candidates.length > 1 ? 'candidate_required' : 'calculated',
      candidates,
    }]
  }))
}

function buildCrossPeriodRelations(daYun, periods) {
  if (daYun.status !== 'calculated' || Object.values(periods).some((period) => period.status !== 'calculated')) {
    return {
      status: 'candidate_required',
      items: [],
      interpretationScope: '후보가 하나로 확정된 뒤 기간 간 관계를 계산함',
    }
  }
  const activeDaYun = daYun.cycles.find((cycle) => cycle.isActive)
  const entries = [
    activeDaYun ? { label: '대운', branch: activeDaYun.branch } : null,
    { label: '세운', branch: periods.year.branch },
    { label: '월운', branch: periods.month.branch },
    { label: '일진', branch: periods.day.branch },
  ].filter(Boolean)
  const items = []
  for (let leftIndex = 0; leftIndex < entries.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < entries.length; rightIndex += 1) {
      const left = entries[leftIndex]
      const right = entries[rightIndex]
      items.push(...calculateBranchPairRelations(left.branch, right.branch, left.label, right.label))
    }
  }
  items.push(...calculateBranchGroupRelations(entries))
  return {
    status: 'calculated',
    items,
    interpretationScope: '기간 간 지지 관계 존재 여부만 계산·강약·길흉은 판정하지 않음',
  }
}

export function calculateSajuTiming({
  input,
  pillars,
  natalAnalysis,
  calculationOptions,
  natalCandidatePillars = [],
  daYunCandidateSources = [],
}) {
  const targetDate = input.targetDate
  const birthTimeUnknown = input.timeAccuracy === 'unknown'
  const natalCandidates = buildNatalCandidates(pillars, natalAnalysis, natalCandidatePillars, birthTimeUnknown)
  const targetSamples = ['00:00', '12:00', '23:59'].map((birthTime) => ({
    sourceLabel: `${targetDate} ${birthTime}`,
    pillars: calculateFourPillars({ birthDate: targetDate, birthTime }, calculationOptions),
  }))
  const targetNoon = targetSamples[1].pillars
  const targetYearPillars = uniqueBy(targetSamples.map((sample) => ({ sourceLabel: sample.sourceLabel, pillar: sample.pillars.year })), (sample) => formatPillar(sample.pillar))
  const targetMonthPillars = uniqueBy(targetSamples.map((sample) => ({ sourceLabel: sample.sourceLabel, pillar: sample.pillars.month })), (sample) => formatPillar(sample.pillar))
  const periods = {
    year: mergePeriodCandidates('세운', targetYearPillars, natalCandidates),
    month: mergePeriodCandidates('월운', targetMonthPillars, natalCandidates),
    day: mergePeriodCandidates('일진', [{ sourceLabel: `${targetDate} 12:00`, pillar: targetNoon.day }], natalCandidates),
  }
  const daYunSources = uniqueBy([
    { label: '입력 기준', input, pillars, analysis: natalAnalysis },
    ...daYunCandidateSources.map((source) => ({
      ...source,
      analysis: source.analysis || analyzeNatalStructure(source.pillars),
    })),
  ], (source) => `${source.input.birthDate}|${source.input.birthTime}|${formatPillarSet(source.pillars)}`)
  const daYun = mergeDaYunCandidates(input, daYunSources, calculationOptions, targetDate)
  const targetDateBoundary = {
    status: targetYearPillars.length > 1 || targetMonthPillars.length > 1 ? 'candidate_required' : 'calculated',
    referenceTime: '12:00',
    yearPillarCandidates: targetYearPillars.map((candidate) => candidate.pillar).map(formatPillar),
    monthPillarCandidates: targetMonthPillars.map((candidate) => candidate.pillar).map(formatPillar),
    reason: targetYearPillars.length > 1 || targetMonthPillars.length > 1
      ? '기준일 안에 절입 경계가 있어 세운 또는 월운이 시각에 따라 달라짐'
      : null,
  }
  const natalTwelveStages = buildNatalTwelveStages(natalCandidates)
  const crossPeriodRelations = buildCrossPeriodRelations(daYun, periods)

  return {
    ruleVersion: SAJU_TIMING_RULE_VERSION,
    targetDate,
    targetDateBoundary,
    daYun,
    periods,
    natalTwelveStages,
    crossPeriodRelations,
    requiresVerification: daYun.requiresVerification || targetDateBoundary.status === 'candidate_required',
    interpretationScope: '간지·본기 십성·12운성·관계 존재 여부만 계산하며 길흉은 단정하지 않음',
  }
}
