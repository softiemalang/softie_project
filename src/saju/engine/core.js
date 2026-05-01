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

function takeUniqueHints(hints, max = 3) {
  return [...new Set(hints.filter(Boolean))].slice(0, max)
}

function buildSupportiveElements(natalAnalysis) {
  const selfElement = ELEMENTS[natalAnalysis.dayMaster]
  const resourceElement = getElementThatGenerates(selfElement)
  const outputElement = RELATIONSHIPS.생[selfElement] || null
  const wealthElement = RELATIONSHIPS.극[selfElement] || null
  const pressureElement = getElementThatControls(selfElement)
  const weightedElements = natalAnalysis.weightedElementsCount || {}
  const strongElements = natalAnalysis.strongElements || []
  const weakElements = natalAnalysis.weakElements || []
  const refinedFlags = natalAnalysis.refinedImbalanceFlags || []
  const seasonalElement = natalAnalysis.seasonalContext?.seasonElement || null
  const topWeightedEntry = Object.entries(weightedElements).sort((a, b) => b[1] - a[1])[0] || null
  const topWeightedElement = topWeightedEntry?.[0] || null
  const topWeightedValue = topWeightedEntry?.[1] || 0
  const adjustedLevel = natalAnalysis.adjustedDayMasterStrengthLevel

  const likelyHelpful = []
  const likelyOverloading = []

  if (adjustedLevel === 'weak') {
    if (selfElement) likelyHelpful.push(selfElement)
    if (resourceElement) likelyHelpful.push(resourceElement)
  } else if (adjustedLevel === 'strong') {
    if (outputElement) likelyHelpful.push(outputElement)
    if (wealthElement) likelyHelpful.push(wealthElement)
  } else {
    if (resourceElement && weakElements.includes(resourceElement)) likelyHelpful.push(resourceElement)
    if (selfElement && weakElements.includes(selfElement)) likelyHelpful.push(selfElement)
  }

  strongElements.forEach((element) => likelyOverloading.push(element))

  if (refinedFlags.includes('weighted_element_overload') && topWeightedElement) {
    likelyOverloading.push(topWeightedElement)
  } else if (topWeightedElement && topWeightedValue >= 4.4) {
    likelyOverloading.push(topWeightedElement)
  }

  if (natalAnalysis.pressureScore >= 3 && pressureElement) {
    likelyOverloading.push(pressureElement)
  }

  if (
    natalAnalysis.wealthScore >= 3 &&
    wealthElement &&
    (refinedFlags.includes('wealth_pressure') || refinedFlags.includes('hidden_wealth_pressure'))
  ) {
    likelyOverloading.push(wealthElement)
  }

  if (seasonalElement && likelyOverloading.includes(seasonalElement)) {
    likelyOverloading.push(seasonalElement)
  }

  const normalizedHelpful = [...new Set(likelyHelpful)].slice(0, 2)
  const normalizedOverloading = [...new Set(likelyOverloading)].filter(
    (element) => !normalizedHelpful.includes(element),
  ).slice(0, 2)
  const likelyNeutral = ['목', '화', '토', '금', '수']
    .filter((element) => !normalizedHelpful.includes(element) && !normalizedOverloading.includes(element))
    .slice(0, 3)

  let confidence = 'low'
  if (
    ['weak', 'strong'].includes(adjustedLevel) &&
    (refinedFlags.includes('weighted_element_overload') || refinedFlags.includes('weighted_element_missing'))
  ) {
    confidence = 'high'
  } else if (
    refinedFlags.length >= 2 ||
    natalAnalysis.pressureScore >= 3 ||
    natalAnalysis.wealthScore >= 3 ||
    strongElements.length > 0 ||
    weakElements.length > 0
  ) {
    confidence = 'medium'
  }

  const reasonHints = takeUniqueHints([
    adjustedLevel === 'weak' ? '기본 리듬을 회복하려면 자신을 받쳐주는 흐름이 도움이 되기 쉬움' : null,
    resourceElement && normalizedHelpful.includes(resourceElement)
      ? '생각을 정리하고 속도를 낮추는 흐름이 안정에 도움이 됨'
      : null,
    outputElement && adjustedLevel === 'strong'
      ? '표현이나 결과로 풀어낼 때 막힌 기운이 덜 답답해질 수 있음'
      : null,
    normalizedOverloading.length > 0
      ? '이미 강한 흐름은 더해질수록 책임감이나 몸의 무게감으로 느껴질 수 있음'
      : null,
    seasonalElement && normalizedOverloading.includes(seasonalElement)
      ? '계절 흐름이 이미 강한 결을 더 밀어줄 수 있어 완급 조절이 중요함'
      : null,
  ])

  const cautionHints = takeUniqueHints([
    '도움이 되는 흐름도 과해지면 고집이나 과몰입으로 흐를 수 있음',
    '부담이 되는 흐름은 나쁘다는 뜻이 아니라 속도 조절이 필요하다는 신호로 해석할 것',
    '보완 흐름은 확정적 판단이 아니라 오늘 흐름과 함께 부드럽게 참고할 것',
  ])

  return {
    likelyHelpful: normalizedHelpful,
    likelyOverloading: normalizedOverloading,
    likelyNeutral,
    confidence,
    reasonHints,
    cautionHints,
  }
}

export function buildNatalProfile(natalAnalysis) {
  const dayMasterElement = ELEMENTS[natalAnalysis.dayMaster]
  const supportElement = getElementThatGenerates(dayMasterElement)
  const pressureElement = getElementThatControls(dayMasterElement)
  const seasonalNotes = Array.isArray(natalAnalysis.seasonalContext?.notes) ? natalAnalysis.seasonalContext.notes : []
  const weightedElements = natalAnalysis.weightedElementsCount || {}
  const dominantWeightedElement = Object.entries(weightedElements).sort((a, b) => b[1] - a[1])[0]?.[0] || null
  const hasHiddenSupport = (natalAnalysis.refinedImbalanceFlags || []).includes('hidden_support_present')
  const hasHiddenPressure = (natalAnalysis.refinedImbalanceFlags || []).includes('hidden_pressure_present')
  const hasHiddenResource = (natalAnalysis.refinedImbalanceFlags || []).includes('hidden_resource_support')
  const hasHiddenWealthPressure = (natalAnalysis.refinedImbalanceFlags || []).includes('hidden_wealth_pressure')
  const hasSeasonalSupport = (natalAnalysis.refinedImbalanceFlags || []).includes('seasonal_support')
  const isAdjustedWeak = natalAnalysis.adjustedDayMasterStrengthLevel === 'weak'
  const isAdjustedStrong = natalAnalysis.adjustedDayMasterStrengthLevel === 'strong'
  const supportScore = natalAnalysis.supportScore || 0
  const outputScore = natalAnalysis.outputScore || 0
  const wealthScore = natalAnalysis.wealthScore || 0
  const pressureScore = natalAnalysis.pressureScore || 0
  const strongElements = natalAnalysis.strongElements || []
  const weakElements = natalAnalysis.weakElements || []

  const baselineTemperament = takeUniqueHints([
    dayMasterElement === '수' ? '생각과 감정을 안쪽에서 오래 정리하는 편' : null,
    dayMasterElement === '목' ? '성장과 확장을 자연스럽게 추구하는 편' : null,
    dayMasterElement === '화' ? '표현과 반응이 비교적 빠르게 드러나는 편' : null,
    dayMasterElement === '토' ? '안정과 책임을 중요하게 보는 편' : null,
    dayMasterElement === '금' ? '기준과 정리를 중요하게 여기는 편' : null,
    isAdjustedWeak ? '겉으로 움직일 수 있어도 에너지와 마음의 여유를 아껴 쓰는 편이 좋음' : null,
    isAdjustedStrong ? '밀고 나가는 힘은 있으나 속도 조절이 함께 필요함' : null,
    hasHiddenSupport ? '겉으로는 조용해 보여도 안쪽에서 버티는 힘이 함께 작용함' : null,
    hasHiddenPressure ? '겉으로 드러나지 않는 부담을 안쪽에 쌓아두기 쉬움' : null,
  ])

  const stressTriggers = takeUniqueHints([
    natalAnalysis.pressureScore >= 3 || hasHiddenPressure ? '과도한 책임이나 기준을 요구받는 상황' : null,
    natalAnalysis.imbalanceFlags?.includes('element_overload') || natalAnalysis.refinedImbalanceFlags?.includes('weighted_element_overload') ? '한 가지 흐름이 과하게 몰리는 상황' : null,
    natalAnalysis.supportScore <= 1 || isAdjustedWeak ? '충분히 회복하기 전에 계속 움직여야 하는 상황' : null,
    natalAnalysis.outputScore >= 3 ? '말이나 표현이 많아져 에너지가 흩어지는 상황' : null,
    natalAnalysis.wealthScore >= 3 || hasHiddenWealthPressure ? '현실적인 선택과 부담을 동시에 처리해야 하는 상황' : null,
  ])

  const recoveryKeys = takeUniqueHints([
    hasHiddenResource ? '혼자 조용히 생각을 정리하는 시간' : null,
    hasSeasonalSupport ? '하루 리듬을 무리하게 바꾸지 않는 작은 루틴' : null,
    isAdjustedWeak ? '짧은 휴식과 몸의 긴장을 낮추는 행동' : null,
    ['수', '금'].includes(dayMasterElement) ? '기록하거나 정리하며 마음을 가라앉히는 방식' : null,
    ['목', '화'].includes(dayMasterElement) ? '가벼운 움직임이나 표현으로 답답함을 풀어내는 방식' : null,
  ])

  const expressionStyle = takeUniqueHints([
    outputScore >= 3 ? '표현이 살아날 때 아이디어와 말이 빠르게 흐르는 편' : null,
    outputScore === 0 ? '표현하기 전에 충분히 정리할 시간이 필요한 편' : null,
    hasHiddenSupport ? '직접 크게 드러내지 않아도 진심이 천천히 전해지는 편' : null,
  ])

  const relationshipStyle = takeUniqueHints([
    supportScore >= 4 ? '가까운 관계에서 자기 리듬과 기준을 지키려는 마음이 있음' : null,
    outputScore >= 3 ? '대화와 표현을 통해 관계가 풀리기 쉬움' : null,
    pressureScore >= 3 ? '관계 안에서 책임감이나 조심스러움이 커지기 쉬움' : null,
    hasHiddenPressure ? '겉으로 괜찮아 보여도 관계의 작은 반응을 오래 곱씹을 수 있음' : null,
  ])

  const workStyle = takeUniqueHints([
    pressureScore >= 3 ? '책임과 기준이 분명한 일에서 긴장과 집중이 함께 올라오기 쉬움' : null,
    outputScore >= 3 ? '아이디어를 말이나 결과물로 풀어낼 때 힘이 살아남' : null,
    wealthScore >= 3 ? '성과와 현실적인 효율을 함께 고려하려는 편' : null,
    isAdjustedWeak ? '무리하게 오래 밀기보다 우선순위를 나누는 방식이 유리함' : null,
  ])

  const moneyStyle = takeUniqueHints([
    wealthScore >= 3 ? '손익과 현실적인 선택을 민감하게 살피는 편' : null,
    hasHiddenWealthPressure ? '지출보다 그 뒤의 책임까지 함께 생각하기 쉬움' : null,
    weakElements.includes('토') || (dominantWeightedElement === '토' && strongElements.includes('토')) ? '안정감을 위해 필요 이상으로 부담을 끌어안을 수 있음' : null,
    wealthScore <= 1 ? '큰 변화보다 작은 계획과 점검이 더 안정적일 수 있음' : null,
  ])

  const healthCareKeys = takeUniqueHints([
    isAdjustedWeak ? '무리한 일정 전에 먼저 회복 시간을 확보하는 것' : null,
    pressureScore >= 3 || hasHiddenPressure ? '몸의 긴장을 의식적으로 풀어주는 짧은 루틴' : null,
    natalAnalysis.seasonalContext?.earthSupport ? '소화와 몸의 무게감을 가볍게 관리하는 것' : null,
    outputScore >= 3 ? '말과 생각이 많아질 때 호흡을 늦추는 것' : null,
  ])

  const interpretationWarnings = takeUniqueHints([
    '확정적인 성격 판단으로 쓰지 말 것',
    '부담과 취약점은 불안 조장이 아니라 조절 포인트로 표현할 것',
    '강한 신호가 있어도 오늘의 일진과 함께 부드럽게 조율해 해석할 것',
  ], 3)

  return {
    baselineTemperament,
    stressTriggers,
    recoveryKeys,
    expressionStyle,
    relationshipStyle,
    workStyle,
    moneyStyle,
    healthCareKeys,
    interpretationWarnings
  }
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
  const baseAnalysis = {
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
  }
  const supportiveElements = buildSupportiveElements(baseAnalysis)
  const natalProfile = buildNatalProfile(baseAnalysis)

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
    supportiveElements,
    natalProfile,
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
