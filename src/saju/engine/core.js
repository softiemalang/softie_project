import { ELEMENTS, RELATIONSHIPS, YIN_YANG, STEMS, BRANCHES } from './constants.js'
import { calculateFourPillars } from './fourPillars.js'

/**
 * 날짜와 시간을 기반으로 사주 8자(사주팔자) 기둥을 도출합니다.
 * 실무적으로는 정교한 만세력 알고리즘(절기 기준 등)이 필요하지만, 
 * MVP 구조를 위해 기둥을 생성하는 인터페이스를 정의합니다.
 */
export function derivePillars(birthDate, birthTime) {
  return calculateFourPillars({ birthDate, birthTime, timezone: 'Asia/Seoul' })
}

/**
 * 일간(Day Master)과 대상 천간/지지의 십성(Ten Gods)을 계산합니다.
 */
export function getTenGod(dayMasterStem, targetStemOrBranch) {
  const meElement = ELEMENTS[dayMasterStem]
  const meYinYang = YIN_YANG[dayMasterStem]
  const targetElement = ELEMENTS[targetStemOrBranch]
  const targetYinYang = YIN_YANG[targetStemOrBranch]

  if (!meElement || !targetElement) return null

  // 1. 비겁 (Same Element)
  if (meElement === targetElement) {
    return meYinYang === targetYinYang ? '비견' : '겁재'
  }

  // 2. 식상 (I give birth to target)
  if (RELATIONSHIPS.생[meElement] === targetElement) {
    return meYinYang === targetYinYang ? '식신' : '상관'
  }

  // 3. 재성 (I control target)
  if (RELATIONSHIPS.극[meElement] === targetElement) {
    return meYinYang === targetYinYang ? '편재' : '정재'
  }

  // 4. 관성 (Target controls me)
  if (RELATIONSHIPS.극[targetElement] === meElement) {
    return meYinYang === targetYinYang ? '편관' : '정관'
  }

  // 5. 인성 (Target gives birth to me)
  if (RELATIONSHIPS.생[targetElement] === meElement) {
    return meYinYang === targetYinYang ? '편인' : '정인'
  }

  return null
}

/**
 * 원국(Natal Chart)의 오행 분포 및 주요 구조 분석
 */
export function analyzeNatalStructure(pillars) {
  const elementsCount = { '목': 0, '화': 0, '토': 0, '금': 0, '수': 0 }
  const tenGodsDistribution = {}

  const dayMaster = pillars.day.stem

  Object.entries(pillars).forEach(([key, pillar]) => {
    // 오행 카운트
    if (pillar.stem) elementsCount[ELEMENTS[pillar.stem]] += 1
    if (pillar.branch) elementsCount[ELEMENTS[pillar.branch]] += 1

    // 십성 분포 (일간 자신 제외)
    if (key !== 'day' || (key === 'day' && pillar.branch)) {
      const stemTenGod = key !== 'day' ? getTenGod(dayMaster, pillar.stem) : null
      const branchTenGod = getTenGod(dayMaster, pillar.branch)
      
      if (stemTenGod) tenGodsDistribution[stemTenGod] = (tenGodsDistribution[stemTenGod] || 0) + 1
      if (branchTenGod) tenGodsDistribution[branchTenGod] = (tenGodsDistribution[branchTenGod] || 0) + 1
    }
  })

  return {
    dayMaster,
    elementsCount,
    tenGodsDistribution,
    // 기초 강약 판정: 자신과 같은 오행 및 자신을 생하는 오행의 합산
    strengthScore: (elementsCount[ELEMENTS[dayMaster]] * 10) + (elementsCount[Object.keys(RELATIONSHIPS.생).find(key => RELATIONSHIPS.생[key] === ELEMENTS[dayMaster])] * 5 || 0)
  }
}

/**
 * 특정 일진(Daily Pillar)과의 상호작용 분석
 */
export function analyzeDailyInteraction(natalAnalysis, dailyPillar) {
  const dayMaster = natalAnalysis.dayMaster
  const stemTenGod = getTenGod(dayMaster, dailyPillar.stem) || '비견'
  const branchTenGod = getTenGod(dayMaster, dailyPillar.branch) || '비견'

  return {
    dailyPillar,
    signals: [
      { type: 'stem', tenGod: stemTenGod, element: ELEMENTS[dailyPillar.stem] },
      { type: 'branch', tenGod: branchTenGod, element: ELEMENTS[dailyPillar.branch] }
    ],
    // 분야별 기초 점수 (알고리즘 기반)
    baseScores: {
      work: 70 + (stemTenGod.includes('관') ? 10 : 0),
      money: 70 + (stemTenGod.includes('재') ? 10 : 0),
      relationships: 70 + (branchTenGod.includes('재') || branchTenGod.includes('관') ? 10 : 0),
      health: 80,
      mind: 75
    }
  }
}
