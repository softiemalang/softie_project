import { ELEMENTS, RELATIONSHIPS, YIN_YANG, STEMS, BRANCHES, HIDDEN_STEMS, SEASONAL_ELEMENT_WEIGHTS, TRINE_GROUPS, BRANCH_RELATION_PAIRS } from './constants.js'
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

function roundToTwo(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function getElementThatGenerates(targetElement) {
  return Object.keys(RELATIONSHIPS.생).find((element) => RELATIONSHIPS.생[element] === targetElement) || null
}

function getElementThatControls(targetElement) {
  return Object.keys(RELATIONSHIPS.극).find((element) => RELATIONSHIPS.극[element] === targetElement) || null
}

function normalizeBranchPair(a, b) {
  return [a, b].sort().join('-')
}

function pairMatches(branchA, branchB, pairs) {
  const pairKey = normalizeBranchPair(branchA, branchB)
  return pairs.some(([left, right]) => normalizeBranchPair(left, right) === pairKey)
}

function getTrineGroup(branch) {
  return TRINE_GROUPS.find((group) => group.branches.includes(branch)) || null
}

/**
 * 원국(Natal Chart)의 오행 분포 및 주요 구조 분석
 */
export function analyzeNatalStructure(pillars) {
  const elementsCount = { '목': 0, '화': 0, '토': 0, '금': 0, '수': 0 }
  const tenGodsDistribution = {}
  const hiddenStemsDistribution = {}
  const hiddenTenGodsDistribution = {}
  const weightedElementsCount = { ...elementsCount }

  const dayMaster = pillars.day.stem
  const dayMasterElement = ELEMENTS[dayMaster]
  const supportElement = getElementThatGenerates(dayMasterElement)
  const pressureElement = getElementThatControls(dayMasterElement)
  const monthBranch = pillars.month?.branch || null
  const seasonalInfo = monthBranch ? SEASONAL_ELEMENT_WEIGHTS[monthBranch] || null : null

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

  Object.entries(pillars).forEach(([, pillar]) => {
    const branch = pillar?.branch
    if (!branch) return

    const hiddenEntries = HIDDEN_STEMS[branch] || []
    hiddenEntries.forEach(({ stem, weight }) => {
      const element = ELEMENTS[stem]
      if (!element) return

      hiddenStemsDistribution[stem] = roundToTwo((hiddenStemsDistribution[stem] || 0) + weight)
      weightedElementsCount[element] = roundToTwo((weightedElementsCount[element] || 0) + weight)

      const hiddenTenGod = getTenGod(dayMaster, stem)
      if (hiddenTenGod) {
        hiddenTenGodsDistribution[hiddenTenGod] = roundToTwo((hiddenTenGodsDistribution[hiddenTenGod] || 0) + weight)
      }
    })
  })

  if (seasonalInfo?.weights) {
    Object.entries(seasonalInfo.weights).forEach(([element, weight]) => {
      weightedElementsCount[element] = roundToTwo((weightedElementsCount[element] || 0) + weight)
    })
  }

  Object.keys(weightedElementsCount).forEach((element) => {
    weightedElementsCount[element] = roundToTwo(weightedElementsCount[element] || 0)
  })

  // 구조 및 세력 분석
  let supportScore = 0; // 비겁 + 인성
  let outputScore = 0;  // 식상
  let wealthScore = 0;  // 재성
  let pressureScore = 0; // 관성

  Object.entries(tenGodsDistribution).forEach(([god, count]) => {
    if (god.includes('비') || god.includes('겁') || god.includes('인')) supportScore += count;
    else if (god.includes('식') || god.includes('상')) outputScore += count;
    else if (god.includes('재')) wealthScore += count;
    else if (god.includes('관')) pressureScore += count;
  });

  const strongElements = Object.entries(elementsCount).filter(([el, cnt]) => cnt >= 3).map(([el]) => el);
  const weakElements = Object.entries(elementsCount).filter(([el, cnt]) => cnt === 0).map(([el]) => el);

  let dayMasterStrengthLevel = 'balanced';
  if (supportScore >= 4) dayMasterStrengthLevel = 'strong';
  else if (supportScore <= 2) dayMasterStrengthLevel = 'weak';

  const imbalanceFlags = [];
  if (strongElements.length > 0) imbalanceFlags.push('element_overload');
  if (weakElements.length > 0) imbalanceFlags.push('element_missing');
  if (pressureScore >= 3) imbalanceFlags.push('pressure_high');
  if (supportScore <= 1) imbalanceFlags.push('support_low');
  if (outputScore >= 3) imbalanceFlags.push('expression_high');
  if (wealthScore >= 3 && pressureScore >= 2) imbalanceFlags.push('wealth_pressure');

  const strengthScore = (elementsCount[ELEMENTS[dayMaster]] * 10) + (elementsCount[Object.keys(RELATIONSHIPS.생).find(key => RELATIONSHIPS.생[key] === ELEMENTS[dayMaster])] * 5 || 0)

  const hiddenSupportScore = ['비견', '겁재', '편인', '정인']
    .reduce((sum, god) => sum + (hiddenTenGodsDistribution[god] || 0), 0)
  const hiddenPressureScore = ['편관', '정관']
    .reduce((sum, god) => sum + (hiddenTenGodsDistribution[god] || 0), 0)
  const hiddenResourceScore = ['편인', '정인']
    .reduce((sum, god) => sum + (hiddenTenGodsDistribution[god] || 0), 0)
  const hiddenWealthScore = ['편재', '정재']
    .reduce((sum, god) => sum + (hiddenTenGodsDistribution[god] || 0), 0)

  const seasonalWeights = seasonalInfo?.weights || {}
  const seasonalSupportScore = roundToTwo(
    (seasonalInfo?.seasonElement === dayMasterElement ? 2.2 : 0) +
    (seasonalInfo?.seasonElement === supportElement ? 1.4 : 0) +
    (seasonalWeights[dayMasterElement] || 0) * 0.8 +
    (supportElement ? (seasonalWeights[supportElement] || 0) * 0.5 : 0)
  )
  const seasonalPressureScore = roundToTwo(
    (seasonalInfo?.seasonElement === pressureElement ? 1.8 : 0) +
    (pressureElement ? (seasonalWeights[pressureElement] || 0) * 0.7 : 0)
  )

  const adjustedStrengthScore = roundToTwo(
    strengthScore +
    (weightedElementsCount[dayMasterElement] || 0) * 1.3 +
    (supportElement ? (weightedElementsCount[supportElement] || 0) * 0.8 : 0) -
    (pressureElement ? (weightedElementsCount[pressureElement] || 0) * 0.9 : 0) +
    seasonalSupportScore -
    seasonalPressureScore +
    hiddenSupportScore * 0.4 -
    hiddenPressureScore * 0.5
  )

  let adjustedDayMasterStrengthLevel = 'balanced'
  if (adjustedStrengthScore >= 34) adjustedDayMasterStrengthLevel = 'strong'
  else if (adjustedStrengthScore <= 18) adjustedDayMasterStrengthLevel = 'weak'

  const weightedValues = Object.values(weightedElementsCount)
  const maxWeightedValue = weightedValues.length > 0 ? Math.max(...weightedValues) : 0
  const hasWeightedMissing = weightedValues.some((value) => value === 0)

  const refinedImbalanceFlags = [...new Set([
    ...imbalanceFlags,
    ...(hiddenSupportScore > 0 ? ['hidden_support_present'] : []),
    ...(hiddenPressureScore > 0 ? ['hidden_pressure_present'] : []),
    ...(hiddenResourceScore > 0 ? ['hidden_resource_support'] : []),
    ...(hiddenWealthScore > 0 && pressureScore >= 2 ? ['hidden_wealth_pressure'] : []),
    ...(seasonalSupportScore > seasonalPressureScore ? ['seasonal_support'] : []),
    ...(seasonalPressureScore > seasonalSupportScore ? ['seasonal_pressure'] : []),
    ...(adjustedDayMasterStrengthLevel === 'strong' ? ['adjusted_strong'] : []),
    ...(adjustedDayMasterStrengthLevel === 'weak' ? ['adjusted_weak'] : []),
    ...(maxWeightedValue >= 4 ? ['weighted_element_overload'] : []),
    ...(hasWeightedMissing ? ['weighted_element_missing'] : []),
  ])]

  return {
    dayMaster,
    elementsCount,
    tenGodsDistribution,
    hiddenStemsDistribution,
    hiddenTenGodsDistribution,
    weightedElementsCount,
    seasonalContext: {
      monthBranch,
      seasonElement: seasonalInfo?.seasonElement || null,
      weights: seasonalInfo?.weights ? { ...seasonalInfo.weights } : {},
      earthSupport: ['진', '술', '축', '미'].includes(monthBranch),
      notes: seasonalInfo?.notes ? [...seasonalInfo.notes] : []
    },
    strongElements,
    weakElements,
    supportScore,
    outputScore,
    wealthScore,
    pressureScore,
    dayMasterStrengthLevel,
    imbalanceFlags,
    adjustedStrengthScore,
    adjustedDayMasterStrengthLevel,
    refinedImbalanceFlags,
    // 기초 강약 판정: 자신과 같은 오행 및 자신을 생하는 오행의 합산
    strengthScore
  }
}

const PERIOD_ROLE_HINTS = {
  '비견': '내 생각과 주관이 또렷해지기 쉬움',
  '겁재': '내 생각과 주관이 또렷해지기 쉬움',
  '식신': '표현과 아이디어가 살아나기 쉬움',
  '상관': '표현과 아이디어가 살아나기 쉬움',
  '편재': '현실적인 선택과 손익 감각이 올라오기 쉬움',
  '정재': '현실적인 선택과 손익 감각이 올라오기 쉬움',
  '편관': '책임감과 기준 의식이 또렷해지기 쉬움',
  '정관': '책임감과 기준 의식이 또렷해지기 쉬움',
  '편인': '생각을 정리하고 배울 것을 흡수하기 쉬움',
  '정인': '생각을 정리하고 배울 것을 흡수하기 쉬움'
}

export function analyzePeriodPillar(natalAnalysis, periodPillar, label) {
  const pillar = {
    stem: periodPillar?.stem || null,
    branch: periodPillar?.branch || null
  }
  const signals = []
  const elements = []
  const dominantTenGods = []

  const stemTenGod = pillar.stem ? getTenGod(natalAnalysis.dayMaster, pillar.stem) : null
  const stemElement = pillar.stem ? ELEMENTS[pillar.stem] || null : null
  const branchTenGod = pillar.branch ? getTenGod(natalAnalysis.dayMaster, pillar.branch) : null
  const branchElement = pillar.branch ? ELEMENTS[pillar.branch] || null : null

  if (stemTenGod) {
    signals.push({ type: 'stem', tenGod: stemTenGod, element: stemElement })
    dominantTenGods.push(stemTenGod)
  }
  if (branchTenGod) {
    signals.push({ type: 'branch', tenGod: branchTenGod, element: branchElement })
    dominantTenGods.push(branchTenGod)
  }
  if (stemElement) elements.push(stemElement)
  if (branchElement) elements.push(branchElement)

  const supportsWeakElement = elements.some((element) => natalAnalysis.weakElements?.includes(element))
  const addsToOverloadedElement = elements.some((element) => natalAnalysis.strongElements?.includes(element))

  const roleHints = []
  dominantTenGods.forEach((tenGod) => {
    const hint = PERIOD_ROLE_HINTS[tenGod]
    if (hint && !roleHints.includes(hint)) {
      roleHints.push(hint)
    }
  })

  if (supportsWeakElement) {
    roleHints.push('부족했던 흐름을 보완하는 역할이 있음')
  }
  if (addsToOverloadedElement) {
    roleHints.push('이미 강한 흐름을 더 자극할 수 있음')
  }

  return {
    label,
    pillar,
    signals,
    elements,
    dominantTenGods,
    supportsWeakElement,
    addsToOverloadedElement,
    roleHints: roleHints.slice(0, 3)
  }
}

const CHUNG_RELATIONS = {
  '자': '오', '오': '자', '축': '미', '미': '축', '인': '신', '신': '인',
  '묘': '유', '유': '묘', '진': '술', '술': '진', '사': '해', '해': '사'
};

const HAP_RELATIONS = {
  '자': '축', '축': '자', '인': '해', '해': '인', '묘': '술', '술': '묘',
  '진': '유', '유': '진', '사': '신', '신': '사', '오': '미', '미': '오'
};

/**
 * 특정 일진(Daily Pillar)과의 상호작용 분석
 */
export function analyzeDailyInteraction(natalAnalysis, dailyPillar, natalPillars) {
  const dayMaster = natalAnalysis.dayMaster
  const stemTenGod = getTenGod(dayMaster, dailyPillar.stem) || '비견'
  const branchTenGod = getTenGod(dayMaster, dailyPillar.branch) || '비견'

  const dailyStemElement = ELEMENTS[dailyPillar.stem];
  const dailyBranchElement = ELEMENTS[dailyPillar.branch];

  // 관계 및 충/합 판별
  const branchRelations = [];
  if (natalPillars) {
    ['day', 'month'].forEach(target => {
      const targetBranch = natalPillars[target]?.branch;
      if (targetBranch) {
        if (CHUNG_RELATIONS[dailyPillar.branch] === targetBranch) {
          branchRelations.push({ target: target + '_branch', relation: '충', meaning: 'emotional or relationship tension' });
        }
        if (HAP_RELATIONS[dailyPillar.branch] === targetBranch) {
          branchRelations.push({ target: target + '_branch', relation: '육합', meaning: 'harmony and connection' });
        }
      }
    });
  }

  if (natalPillars) {
    ['day', 'month'].forEach(target => {
      const targetBranch = natalPillars[target]?.branch;
      if (!targetBranch) return
      const hasStrongRelationForTarget = branchRelations.some((relation) =>
        relation.target === `${target}_branch` && (relation.relation === '충' || relation.relation === '육합')
      )
      if (hasStrongRelationForTarget) return

      let supplementalRelation = null

      if (pairMatches(dailyPillar.branch, targetBranch, BRANCH_RELATION_PAIRS.hyung)) {
        supplementalRelation = {
          target: `${target}_branch`,
          relation: '형',
          meaning: 'inner friction or pressure',
          severity: 'low'
        }
      } else if (pairMatches(dailyPillar.branch, targetBranch, BRANCH_RELATION_PAIRS.pa)) {
        supplementalRelation = {
          target: `${target}_branch`,
          relation: '파',
          meaning: 'small mismatch or disruption',
          severity: 'low'
        }
      } else if (pairMatches(dailyPillar.branch, targetBranch, BRANCH_RELATION_PAIRS.he)) {
        supplementalRelation = {
          target: `${target}_branch`,
          relation: '해',
          meaning: 'subtle discomfort or delayed friction',
          severity: 'low'
        }
      } else {
        const targetGroup = getTrineGroup(targetBranch)
        const dailyGroup = getTrineGroup(dailyPillar.branch)
        if (targetGroup && dailyGroup && targetGroup.element === dailyGroup.element) {
          supplementalRelation = {
            target: `${target}_branch`,
            relation: '삼합계열',
            meaning: 'shared direction or smoother flow',
            severity: 'low',
            element: targetGroup.element
          }
        }
      }

      if (supplementalRelation) {
        branchRelations.push(supplementalRelation)
      }
    })
  }

  const dailyElements = [dailyStemElement, dailyBranchElement];
  const dailyTenGods = [stemTenGod, branchTenGod];

  const supplements = dailyElements.filter(el => natalAnalysis.weakElements.includes(el));
  const overloads = dailyElements.filter(el => natalAnalysis.strongElements.includes(el));
  const amplifications = dailyTenGods.filter(tg => (natalAnalysis.tenGodsDistribution[tg] || 0) >= 2);
  const opportunities = dailyTenGods.filter(tg => (natalAnalysis.tenGodsDistribution[tg] || 0) === 0);

  // Field Impacts
  const fieldImpacts = {
    work: { score: 70, signals: [], risks: [], adviceType: 'neutral' },
    money: { score: 70, signals: [], risks: [], adviceType: 'neutral' },
    relationships: { score: 70, signals: [], risks: [], adviceType: 'neutral' },
    love: { score: 70, signals: [], risks: [], adviceType: 'neutral' },
    health: { score: 80, signals: [], risks: [], adviceType: 'neutral' },
    mind: { score: 75, signals: [], risks: [], adviceType: 'neutral' }
  };

  // 관성 영향
  if (dailyTenGods.some(tg => tg.includes('관'))) {
    fieldImpacts.work.score += 10;
    fieldImpacts.work.signals.push('관성');
    if (natalAnalysis.pressureScore >= 3 || overloads.length > 0) {
      fieldImpacts.work.risks.push('overload');
      fieldImpacts.work.adviceType = 'pressure/caution';
    } else {
      fieldImpacts.work.adviceType = 'support/opportunity';
    }
  }

  // 재성 영향
  if (dailyTenGods.some(tg => tg.includes('재'))) {
    fieldImpacts.money.score += 10;
    fieldImpacts.money.signals.push('재성');
    if (natalAnalysis.wealthScore >= 3 || overloads.length > 0) {
      fieldImpacts.money.risks.push('overload');
      fieldImpacts.money.adviceType = 'pressure/caution';
    } else {
      fieldImpacts.money.adviceType = 'support/opportunity';
    }
  }

  // 식상 및 비겁, 인성 영향
  if (dailyTenGods.some(tg => tg.includes('식') || tg.includes('상'))) {
    fieldImpacts.work.score += 5;
    fieldImpacts.relationships.score += 10;
    fieldImpacts.relationships.signals.push('식상');
  }

  if (dailyTenGods.some(tg => tg.includes('인'))) {
    fieldImpacts.mind.score += 10;
    fieldImpacts.mind.signals.push('인성');
  }

  // 충합 영향
  if (branchRelations.some(r => r.relation === '충')) {
    fieldImpacts.mind.score -= 10;
    fieldImpacts.relationships.score -= 10;
    fieldImpacts.relationships.risks.push('충');
    fieldImpacts.mind.adviceType = 'tension';
  } else if (branchRelations.some(r => r.relation === '육합')) {
    fieldImpacts.relationships.score += 15;
    fieldImpacts.relationships.adviceType = 'harmony';
  }

  if (branchRelations.some(r => r.relation === '형' || r.relation === '파' || r.relation === '해')) {
    fieldImpacts.relationships.score -= 3;
    fieldImpacts.mind.score -= 2;
    ['형', '파', '해'].forEach((relation) => {
      if (branchRelations.some(r => r.relation === relation)) {
        fieldImpacts.relationships.risks.push(relation);
        fieldImpacts.mind.risks.push(relation);
      }
    });
    if (fieldImpacts.relationships.adviceType === 'neutral') {
      fieldImpacts.relationships.adviceType = 'subtle_tension';
    }
    if (fieldImpacts.mind.adviceType === 'neutral') {
      fieldImpacts.mind.adviceType = 'subtle_tension';
    }
  }

  if (branchRelations.some(r => r.relation === '삼합계열')) {
    fieldImpacts.relationships.score += 3;
    fieldImpacts.relationships.signals.push('삼합계열');
    if (fieldImpacts.relationships.adviceType === 'neutral' &&
      !branchRelations.some(r => r.relation === '형' || r.relation === '파' || r.relation === '해')) {
      fieldImpacts.relationships.adviceType = 'smooth_flow';
    }
  }

  return {
    dailyPillar,
    signals: [
      { type: 'stem', tenGod: stemTenGod, element: dailyStemElement },
      { type: 'branch', tenGod: branchTenGod, element: dailyBranchElement }
    ],
    supplements,
    overloads,
    amplifications,
    opportunities,
    branchRelations,
    fieldImpacts,
    // 분야별 기초 점수 (기존 호환 유지)
    baseScores: {
      work: fieldImpacts.work.score,
      money: fieldImpacts.money.score,
      relationships: fieldImpacts.relationships.score,
      health: fieldImpacts.health.score,
      mind: fieldImpacts.mind.score
    }
  }
}
