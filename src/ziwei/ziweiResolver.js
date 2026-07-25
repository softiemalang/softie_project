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
    lunarMonth = 1,
    hourBranch = '子',
    birthYearStem = '甲',
    isLeapMonth = false,
    birthTime = '12:00',
    ruleSet = {},
  } = params

  const hourIndex = BRANCHES.indexOf(hourBranch) !== -1 ? BRANCHES.indexOf(hourBranch) : 0
  const monthVal = Number(lunarMonth) || 1

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
  const isZiHourBoundary = birthTime.startsWith('23:') || birthTime.startsWith('00:')
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

  const confidence = isZiHourBoundary || isLeapMonth ? 'low' : 'high'

  return createZiweiCalculationContext({
    input: {
      subjectName,
      birthTime,
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
      verificationStatus: confidence === 'low' ? 'candidate_required' : 'verified',
      warnings,
    },
  })
}
