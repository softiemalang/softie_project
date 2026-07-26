/**
 * ziweiContract.js
 *
 * 자미두수(紫微斗數) 해석 오케스트레이션을 위한 데이터 계약(Data Contract) 및 스키마 모듈
 */

import { buildZiweiPalaceContexts } from './ziweiPalaceContext.js'

export const ZIWEI_PALACE_DEFINITIONS = [
  { id: 'life', name: '명궁', defaultIndex: 0, description: '본질적 기질, 운명의 총체적 바탕' },
  { id: 'siblings', name: '형제궁', defaultIndex: 1, description: '형제자매, 동료, 친밀한 지인 관계' },
  { id: 'spouse', name: '부처궁', defaultIndex: 2, description: '배우자, 연인, 이성 인연' },
  { id: 'children', name: '자녀궁', defaultIndex: 3, description: '자녀, 후배, 제자, 창작물' },
  { id: 'wealth', name: '재백궁', defaultIndex: 4, description: '재물 운, 수입 및 지출 패턴' },
  { id: 'health', name: '질액궁', defaultIndex: 5, description: '건강, 신체적 체질, 질병 유의점' },
  { id: 'travel', name: '천이궁', defaultIndex: 6, description: '대외 활동, 이동, 타향/해외 운' },
  { id: 'friends', name: '노복궁', defaultIndex: 7, description: '부하, 대중, 일반 인간관계' },
  { id: 'career', name: '관록궁', defaultIndex: 8, description: '직업, 사회적 위치, 역량 발휘' },
  { id: 'property', name: '전택궁', defaultIndex: 9, description: '부동산, 주거 환경, 가문 바탕' },
  { id: 'mind', name: '복덕궁', defaultIndex: 10, description: '정신적 만족, 취향, 내면의 휴식' },
  { id: 'parents', name: '부모궁', defaultIndex: 11, description: '부모, 윗사람, 덕망, 문서 운' },
]

export const DEFAULT_ZIWEI_RULE_SET = {
  calendar: 'traditional_lunar',
  mingGongMethod: 'standard_month_hour',
  leapMonthRule: 'mid_month_split',
  fiveElementCycle: 'standard_wuhangju',
  majorStarPlacement: 'standard_ziwei_tianfu',
}

export function createZiweiCalculationContext(params = {}) {
  const {
    input = {},
    chart = {},
    candidates = {},
    calculationMeta = {},
    ruleSet = {},
  } = params

  const hasChart = Boolean(chart.mingGong && chart.fiveElementsBureau && Array.isArray(chart.palaces) && chart.palaces.length > 0)
  const isMissingInput = !input.birthYearStem || !input.lunarMonth || !input.hourBranch

  const inputStatus = calculationMeta.inputStatus ?? (isMissingInput ? 'missing_input' : 'valid')
  const calculationStatus = calculationMeta.calculationStatus ?? (hasChart && !isMissingInput ? 'calculated' : 'partial')
  const verificationStatus = calculationMeta.verificationStatus ?? 'needs_external_verification'
  const confidence = calculationMeta.confidence ?? (hasChart && !isMissingInput ? 'medium' : 'low')
  const interpretationStatus = calculationMeta.interpretationStatus ?? (
    confidence === 'low' || verificationStatus === 'candidate_required' || !hasChart || isMissingInput
      ? 'candidate_only'
      : 'experimental'
  )

  return {
    systemType: 'ziwei',
    input: {
      subjectName: input.subjectName || '무명',
      birthTime: input.birthTime ?? '',
      birthYearStem: input.birthYearStem ?? null,
      birthYearBranch: input.birthYearBranch ?? null,
      lunarYear: input.calendarBasis?.lunarYear ? Number(input.calendarBasis.lunarYear) : null,
      lunarMonth: input.lunarMonth ? Number(input.lunarMonth) : null,
      lunarDay: input.calendarBasis?.lunarDay ? Number(input.calendarBasis.lunarDay) : null,
      hourBranch: input.hourBranch ?? null,
      gender: input.gender || 'female',
      calendarBasis: {
        sourceSolarDate: input.calendarBasis?.sourceSolarDate || null,
        lunarYear: input.calendarBasis?.lunarYear ? Number(input.calendarBasis.lunarYear) : null,
        lunarDay: input.calendarBasis?.lunarDay ? Number(input.calendarBasis.lunarDay) : null,
        isLeapMonth: Boolean(input.calendarBasis?.isLeapMonth),
        timeAccuracy: input.calendarBasis?.timeAccuracy || 'exact',
        conversionVerificationStatus:
          input.calendarBasis?.conversionVerificationStatus || 'needs_external_verification',
      },
      ruleSet: {
        ...DEFAULT_ZIWEI_RULE_SET,
        ...ruleSet,
      },
    },

    chart: {
      mingGong: chart.mingGong || null,
      shenGong: chart.shenGong || null,
      fiveElementsBureau: chart.fiveElementsBureau || null,
      palaces: Array.isArray(chart.palaces) ? chart.palaces : [],
      majorStars: Array.isArray(chart.majorStars) ? chart.majorStars : [],
      minorStars: Array.isArray(chart.minorStars) ? chart.minorStars : [],
      transformations: Array.isArray(chart.transformations) ? chart.transformations : [],
    },

    candidates: {
      candidateOrigin: candidates.candidateOrigin || (isMissingInput ? 'missing_input' : 'exact_single_chart'),
      assumptions: Array.isArray(candidates.assumptions) ? candidates.assumptions : [],
      alternatives: Array.isArray(candidates.alternatives) ? candidates.alternatives : [],
    },

    calculationMeta: {
      confidence,
      verificationStatus,
      calculationStatus,
      inputStatus,
      interpretationStatus,
      warnings: Array.isArray(calculationMeta.warnings) ? calculationMeta.warnings : [],
      ruleSetVersions: calculationMeta.ruleSetVersions || {},
    },
  }
}

export function createZiweiInterpretationContext(calculationContext) {
  if (!calculationContext || typeof calculationContext !== 'object') {
    return null
  }

  const { input = {}, chart = {}, candidates = {}, calculationMeta = {} } = calculationContext

  const inputStatus = calculationMeta.inputStatus ?? (input.birthYearStem && input.lunarMonth && input.hourBranch ? 'valid' : 'missing_input')
  const calculationStatus = calculationMeta.calculationStatus ?? (chart.mingGong ? 'calculated' : 'partial')
  const verificationStatus = calculationMeta.verificationStatus ?? 'needs_external_verification'
  const confidence = calculationMeta.confidence ?? 'low'
  const interpretationStatus = calculationMeta.interpretationStatus ?? (
    confidence === 'low' || verificationStatus === 'candidate_required' || !chart.mingGong
      ? 'candidate_only'
      : 'experimental'
  )

  const isLowConfidence = confidence === 'low'
  const hasMultipleAlternatives = candidates.alternatives && candidates.alternatives.length > 0

  const palaceRelationData = buildZiweiPalaceContexts(chart)

  return {
    systemType: 'ziwei',
    subjectName: input.subjectName || '무명',

    palaceContexts: palaceRelationData.palaceContexts,
    interpretivePatterns: palaceRelationData.interpretivePatterns,

    candidateSetConsensus: {
      factual: {
        mingGongBranch: chart.mingGong?.branch || '미상',
        shenGongBranch: chart.shenGong?.branch || '미상',
        fiveElementsBureau: chart.fiveElementsBureau?.name || '미상',
        majorStarCount: chart.majorStars?.length || 0,
      },
      interpretiveAgreement: {
        hasStableMingGong: !isLowConfidence && !hasMultipleAlternatives,
      },
    },

    candidateFacts: hasMultipleAlternatives ? candidates.alternatives : [chart],

    uncertainFactors: Array.isArray(calculationMeta.warnings)
      ? calculationMeta.warnings.map((w) => ({ field: 'ziwei_calculation', issue: w }))
      : [],

    calculationConfidence: {
      stateContract: {
        inputStatus,
        calculationStatus,
        verificationStatus,
        interpretationStatus,
        confidence,
      },
    },

    interpretationWarnings: [
      ...(calculationMeta.warnings || []),
      ...(isLowConfidence ? ['자미두수 명반 산출에 복수의 가능성이 존재하므로 특정 명궁/주성 배치를 절대 확정하여 해석하지 마십시오.'] : []),
    ],
  }
}
