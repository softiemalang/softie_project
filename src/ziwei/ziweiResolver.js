/**
 * ziweiResolver.js
 *
 * 자미두수 명궁, 신궁 및 12궁 정방향 포국 산출 전문 모듈
 *
 * [핵심 산출 포국 수식]
 * - 명궁(命宮) 지지 = (음력 월 - 출생 시지 + 1) mod 12 (寅宮 기준 정방향 역산)
 * - 신궁(身宮) 지지 = (음력 월 + 출생 시지 - 1) mod 12
 * - 12궁 포국 = 명궁을 시작점으로 하여 시계방향(정방향) 순환 배치
 */

import { ZIWEI_PALACE_DEFINITIONS, createZiweiCalculationContext } from './ziweiContract.js'
import { resolveFiveElementBureau } from './fiveElementResolver.js'

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

export function resolveZiweiChart(params = {}) {
  const {
    subjectName = '무명',
    birthYearStem = null,
    birthYearBranch = null,
    lunarMonth = null,
    hourBranch = null,
    isLeapMonth = false,
    birthTime = '',
    ruleSet = {},
  } = params || {}

  const isValidMonth = Number.isInteger(Number(lunarMonth)) && Number(lunarMonth) >= 1 && Number(lunarMonth) <= 12
  const isValidBranch = typeof hourBranch === 'string' && BRANCHES.includes(hourBranch)
  const isValidStem = typeof birthYearStem === 'string' && ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'].includes(birthYearStem)

  if (!isValidMonth || !isValidBranch || !isValidStem) {
    const warnings = ['필수 계산 입력(lunarMonth, hourBranch, birthYearStem)이 누락되거나 유효하지 않아 명반 계산을 수행하지 않았습니다.']
    return createZiweiCalculationContext({
      input: {
        subjectName,
        birthTime: typeof birthTime === 'string' ? birthTime : '',
        birthYearStem,
        birthYearBranch,
        lunarMonth: lunarMonth ? Number(lunarMonth) : null,
        hourBranch,
        calendarBasis: { lunarDate: null, isLeapMonth: Boolean(isLeapMonth) },
        ruleSet,
      },
      chart: {
        mingGong: null,
        shenGong: null,
        fiveElementsBureau: null,
        palaces: [],
        majorStars: [],
        minorStars: [],
        transformations: [],
      },
      candidates: {
        candidateOrigin: 'missing_input',
        alternatives: [],
      },
      calculationMeta: {
        confidence: 'low',
        verificationStatus: 'needs_external_verification',
        calculationStatus: 'partial',
        inputStatus: 'missing_input',
        interpretationStatus: 'candidate_only',
        warnings,
      },
    })
  }

  const hourIndex = BRANCHES.indexOf(hourBranch)
  const monthVal = Number(lunarMonth)

  // 1. 명궁 지지 산출: (음력 월 - 출생 시지 + 1)
  // 인궁(寅, index 2)을 기준점으로 한 계산
  const mingGongOffset = (monthVal - 1 - hourIndex + 1200) % 12
  const mingGongBranchIndex = (2 + mingGongOffset) % 12
  const mingGongBranch = BRANCHES[mingGongBranchIndex]

  // 2. 신궁 지지 산출: (음력 월 + 출생 시지 - 1)
  const shenGongOffset = (monthVal - 1 + hourIndex) % 12
  const shenGongBranchIndex = (2 + shenGongOffset) % 12
  const shenGongBranch = BRANCHES[shenGongBranchIndex]

  // 3. 오행국 산출
  const bureau = resolveFiveElementBureau(birthYearStem, mingGongBranch)

  // 4. 12궁 포국 순환 배치 (명궁에서부터 시계방향)
  const palaces = ZIWEI_PALACE_DEFINITIONS.map((def, idx) => {
    const branchIndex = (mingGongBranchIndex + idx) % 12
    return {
      id: def.id,
      name: def.name,
      index: idx,
      branch: BRANCHES[branchIndex],
      isMingGong: idx === 0,
      isShenGong: BRANCHES[branchIndex] === shenGongBranch,
      stars: [],
    }
  })

  // 5. 불확실성 후보 감지 (자시 경계 또는 윤달 조건)
  const isZiHourBoundary = typeof birthTime === 'string' && (birthTime.startsWith('23:') || birthTime.startsWith('00:'))
  const warnings = []
  const alternatives = []

  if (isZiHourBoundary) {
    warnings.push('자시(23:00~01:00) 경계 입력으로 인한 시지 후보 가능성이 존재합니다.')
  }
  if (isLeapMonth) {
    warnings.push('윤달 출생 건으로 당월/익월 명궁 포국 후보가 공존합니다.')
    alternatives.push(
      { mode: 'current_month', lunarMonth: monthVal, mingGongBranch },
      { mode: 'next_month', lunarMonth: (monthVal % 12) + 1, mingGongBranch: BRANCHES[(mingGongBranchIndex + 1) % 12] }
    )
  }

  const confidence = isZiHourBoundary || isLeapMonth ? 'low' : 'medium'
  const verificationStatus = confidence === 'low' ? 'candidate_required' : 'needs_external_verification'

  return createZiweiCalculationContext({
    input: {
      subjectName,
      birthTime,
      birthYearStem,
      birthYearBranch,
      lunarMonth: monthVal,
      hourBranch,
      calendarBasis: { lunarDate: `lunar_${monthVal}`, isLeapMonth },
      ruleSet,
    },
    chart: {
      mingGong: { id: 'life', name: '명궁', branch: mingGongBranch, index: mingGongBranchIndex },
      shenGong: { id: 'shen', name: '신궁', branch: shenGongBranch, index: shenGongBranchIndex },
      fiveElementsBureau: bureau,
      palaces,
    },
    candidates: {
      candidateOrigin: isZiHourBoundary ? 'zi_hour_boundary' : isLeapMonth ? 'leap_month_boundary' : 'exact_single_chart',
      alternatives,
    },
    calculationMeta: {
      confidence,
      verificationStatus,
      calculationStatus: 'calculated',
      inputStatus: 'valid',
      interpretationStatus: confidence === 'low' ? 'candidate_only' : 'experimental',
      warnings,
    },
  })
}
