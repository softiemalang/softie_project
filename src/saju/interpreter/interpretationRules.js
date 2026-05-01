export function buildInterpretationProfile({ natalAnalysis, dailyInteraction, gender }) {
  const {
    dayMasterStrengthLevel,
    imbalanceFlags,
    hiddenStemsDistribution = {},
    hiddenTenGodsDistribution = {},
    weightedElementsCount = {},
    seasonalContext = {},
    adjustedStrengthScore = 0,
    adjustedDayMasterStrengthLevel = 'balanced',
    refinedImbalanceFlags = []
  } = natalAnalysis;
  const { supplements, overloads, branchRelations, signals, fieldImpacts, periodContext } = dailyInteraction;

  // Primary Theme & Intensity
  let intensity = 'low';
  let score = 0;
  if (overloads.length > 0) score += 1;
  if (imbalanceFlags.includes('pressure_high')) score += 1;
  if (branchRelations.some(r => r.target === 'day_branch' && r.relation === '충')) score += 2;
  if (dayMasterStrengthLevel !== 'balanced') score += 1;

  if (score >= 3) intensity = 'high';
  else if (score >= 1) intensity = 'medium';

  // Determine core dynamic
  const isSupplement = supplements.length > 0;
  const isOverload = overloads.length > 0;
  const hasChung = branchRelations.some(r => r.relation === '충');
  const hasHap = branchRelations.some(r => r.relation === '육합');

  let primaryTheme = '평온한 일상 유지';
  let secondaryTheme = '흐름에 몸을 맡기세요';

  if (isSupplement && !hasChung && !hasHap) {
    primaryTheme = '안정적인 보완과 기회';
    secondaryTheme = '부족한 기운이 채워져 순조로운 하루';
  } else if (isOverload && !hasChung && !hasHap) {
    primaryTheme = '기운의 과열과 압박';
    secondaryTheme = '넘치는 에너지를 조절하고 한 템포 쉬어가기';
  } else if (isSupplement && hasChung) {
    primaryTheme = '변화를 통한 새로운 기회';
    secondaryTheme = '뜻밖의 상황이 유리하게 작용할 수 있으나 서두르지 않기';
  } else if (isOverload && hasChung) {
    primaryTheme = '긴장감과 피로 누적';
    secondaryTheme = '충돌이나 감정적 소모에 유의하며 유연하게 대처하기';
  } else if (isSupplement && hasHap) {
    primaryTheme = '부드러운 협력과 정서적 안정';
    secondaryTheme = '주변과의 조화가 돋보이며 편안한 흐름';
  } else if (isOverload && hasHap) {
    primaryTheme = '편안함 속의 안일함 주의';
    secondaryTheme = '관계는 좋으나 나태해질 수 있으니 목표 의식 유지';
  }

  const dominantSignals = signals.map(s => s.tenGod);
  const hiddenSupportScore = ['비견', '겁재', '편인', '정인']
    .reduce((sum, god) => sum + (hiddenTenGodsDistribution[god] || 0), 0)
  const hiddenPressureScore = ['편관', '정관']
    .reduce((sum, god) => sum + (hiddenTenGodsDistribution[god] || 0), 0)
  const hiddenResourceScore = ['편인', '정인']
    .reduce((sum, god) => sum + (hiddenTenGodsDistribution[god] || 0), 0)
  const hiddenWealthScore = ['편재', '정재']
    .reduce((sum, god) => sum + (hiddenTenGodsDistribution[god] || 0), 0)
  const seasonalNotes = Array.isArray(seasonalContext.notes) ? seasonalContext.notes : []
  const seasonElement = seasonalContext.seasonElement || null
  const hiddenTopStem = Object.entries(hiddenStemsDistribution)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null
  const weightedTopElement = Object.entries(weightedElementsCount)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null
  const periodContextHints = [
    periodContext?.year?.roleHints?.[0] ? `올해 흐름은 ${periodContext.year.roleHints[0]}` : null,
    periodContext?.month?.roleHints?.[0] ? `이번 달 흐름은 ${periodContext.month.roleHints[0]}` : null,
    periodContext?.day?.roleHints?.[0] ? `오늘은 ${periodContext.day.roleHints[0]}` : null,
  ].filter(Boolean)

  // Field Narratives
  const fieldNarratives = {
    work: '주어진 업무에 충실하며 내실을 다지기 좋은 날입니다.',
    money: '계획적인 지출과 현상 유지가 유리한 하루입니다.',
    relationships: '원만한 대인관계를 유지하며 경청하는 자세가 필요합니다.',
    love: '자연스러운 대화 속에서 신뢰와 호감을 쌓아가는 흐름입니다.',
    health: '규칙적인 식사와 가벼운 스트레칭으로 컨디션을 관리하세요.',
    mind: '감정의 동요 없이 평온한 마음가짐을 유지하는 것이 중요합니다.'
  };

  // Adjust field narratives based on dominant signals
  const hasBi = dominantSignals.some(s => s.includes('비') || s.includes('겁'));
  const hasSik = dominantSignals.some(s => s.includes('식') || s.includes('상'));
  const hasJae = dominantSignals.some(s => s.includes('재'));
  const hasGwan = dominantSignals.some(s => s.includes('관'));
  const hasIn = dominantSignals.some(s => s.includes('인'));

  if (hasBi) {
    fieldNarratives.relationships = isOverload ? '경쟁심이나 자존심 충돌에 유의하고 한발 양보하세요.' : '주변 사람들과의 연대와 협력이 힘이 되는 날입니다.';
    fieldNarratives.work = '자신의 주관을 가지고 주도적으로 일을 추진하기 좋습니다.';
  }
  if (hasSik) {
    fieldNarratives.work = '창의적인 아이디어나 표현력을 발휘하기 좋은 흐름입니다.';
    fieldNarratives.relationships = isOverload ? '말실수에 유의하고 감정 표현의 수위를 조절하세요.' : '대화와 소통이 원활해지며 매력을 어필하기 좋습니다.';
  }
  if (hasJae) {
    fieldNarratives.money = isOverload ? '충동적인 지출이나 무리한 투자를 경계해야 합니다.' : '현실적인 감각이 살아나며 금전 관리에 유리한 날입니다.';
    fieldNarratives.work = '현실적인 성과를 목표로 효율적으로 움직이기 좋습니다.';
  }
  if (hasGwan) {
    fieldNarratives.work = isOverload ? '과도한 책임감이나 압박감으로 피로할 수 있으니 완급 조절이 필요합니다.' : '책임감이 빛을 발하며 원칙을 지키는 태도가 인정받습니다.';
    fieldNarratives.mind = '자신을 너무 엄격하게 통제하기보다 약간의 여유를 가지세요.';
  }
  if (hasIn) {
    fieldNarratives.mind = isOverload ? '생각이 꼬리를 물 수 있으니 단순하게 상황을 바라보세요.' : '차분히 생각을 정리하고 내면의 지혜를 발휘하기 좋은 날입니다.';
    fieldNarratives.work = '행동에 앞서 철저한 준비와 점검이 유리하게 작용합니다.';
  }

  // Love overrides based on gender and signals
  if (gender === 'male') {
    if (hasJae) fieldNarratives.love = isOverload ? '이성 문제로 마음이 복잡해질 수 있으니 신중하게 접근하세요.' : '자연스럽게 매력을 어필하며 관계를 진전시키기 좋은 기류입니다.';
  } else {
    if (hasGwan) fieldNarratives.love = isOverload ? '관계에서 압박감을 느낄 수 있으니 편안한 거리를 유지하세요.' : '안정적이고 신뢰할 수 있는 만남의 기운이 긍정적입니다.';
  }

  const avoidNarratives = [
    '무조건 돈을 번다거나 재물이 쏟아진다는 식의 확정적 표현',
    '반드시 누군가 고백한다거나 운명의 상대를 만난다는 로맨스 확언',
    '사고가 난다, 병에 걸린다는 공포 조장',
    '운세가 나쁘니 아무것도 하지 말라는 식의 극단적 조언'
  ];

  const relationHints = branchRelations.map((relation) => {
    if (relation.relation === '충') {
      return relation.target === 'day_branch'
        ? '내 컨디션과 가까운 관계에서 예민한 반응이 커질 수 있음'
        : '주변 일정이나 관계 변수로 흐름이 흔들릴 수 있음';
    }

    if (relation.relation === '육합') {
      return relation.target === 'day_branch'
        ? '가까운 관계에서 말이 부드럽게 이어질 수 있음'
        : '협력과 조율이 비교적 자연스럽게 풀릴 수 있음';
    }

    return `${relation.target} 흐름에 ${relation.relation} 반응이 있음`;
  });

  const dailyKeyPoints = [
    supplements.length > 0 ? `부족한 요소를 보완하는 흐름: ${supplements.join(', ')}` : null,
    overloads.length > 0 ? `과열되기 쉬운 요소: ${overloads.join(', ')}` : null,
    dominantSignals.length > 0 ? `오늘 두드러지는 역할감: ${dominantSignals.join(', ')}` : null,
    hiddenSupportScore > 0 ? '겉으로 드러나지 않아도 안쪽에서 버티는 힘이 있음' : null,
    hiddenPressureScore > 0 ? '눈에 잘 안 보이는 부담이 함께 쌓일 수 있음' : null,
    hiddenTopStem ? `안쪽에서 더 두드러지는 재료는 ${hiddenTopStem} 쪽 흐름임` : null,
    ...periodContextHints,
    seasonalNotes[0] || null,
    seasonElement ? `계절 흐름의 중심은 ${seasonElement} 쪽으로 기울어 있음` : null,
    weightedTopElement ? `전체 무게감은 ${weightedTopElement} 쪽에 조금 더 실려 있음` : null,
    ...relationHints,
  ].filter(Boolean);

  const fieldReasonHints = {
    work: [
      fieldImpacts.work.signals.length > 0 ? `일 흐름 자극: ${fieldImpacts.work.signals.join(', ')}` : null,
      fieldImpacts.work.risks.length > 0 ? `업무 리스크: ${fieldImpacts.work.risks.join(', ')}` : null,
      hasGwan ? '책임이나 기준 의식이 강해지기 쉬움' : null,
      hasSik ? '표현력이나 아이디어가 일에 섞이기 쉬움' : null,
      periodContext?.year?.roleHints?.[0] ? `올해 흐름은 ${periodContext.year.roleHints[0]}` : null,
      periodContext?.month?.roleHints?.[0] ? `이번 달 흐름은 ${periodContext.month.roleHints[0]}` : null,
      refinedImbalanceFlags.includes('hidden_support_present') ? '겉보다 준비력과 버티는 힘이 함께 작동함' : null,
      adjustedDayMasterStrengthLevel === 'weak' ? '무리하게 밀기보다 리듬을 지키는 편이 유리함' : null,
    ].filter(Boolean),
    money: [
      fieldImpacts.money.signals.length > 0 ? `금전 흐름 자극: ${fieldImpacts.money.signals.join(', ')}` : null,
      fieldImpacts.money.risks.length > 0 ? `금전 리스크: ${fieldImpacts.money.risks.join(', ')}` : null,
      hasJae ? '현실 감각과 손익 계산이 예민해지기 쉬움' : null,
      hiddenWealthScore > 0 ? '보이지 않는 지출 감각이나 현실 판단이 함께 올라올 수 있음' : null,
      refinedImbalanceFlags.includes('seasonal_pressure') ? '시기 흐름상 지출은 한 번 더 살피는 편이 좋음' : null,
    ].filter(Boolean),
    relationships: [
      fieldImpacts.relationships.signals.length > 0 ? `관계 흐름 자극: ${fieldImpacts.relationships.signals.join(', ')}` : null,
      fieldImpacts.relationships.risks.length > 0 ? `관계 리스크: ${fieldImpacts.relationships.risks.join(', ')}` : null,
      ...relationHints,
      hiddenSupportScore > 0 ? '사람을 대하는 태도는 겉보다 부드럽게 드러나기 쉬움' : null,
      hiddenPressureScore > 0 ? '말보다 반응이 먼저 나와 관계가 살짝 민감해질 수 있음' : null,
    ].filter(Boolean),
    love: [
      gender === 'male' && hasJae ? '감정 표현보다 호감의 진전 여부가 신경 쓰이기 쉬움' : null,
      gender === 'female' && hasGwan ? '관계의 안정감이나 신뢰 여부가 더 중요하게 느껴질 수 있음' : null,
      hasSik ? '말과 표현이 애정 흐름에 직접 영향을 주기 쉬움' : null,
      hasIn ? '생각이 많아져 표현이 조심스러워질 수 있음' : null,
      seasonElement ? '분위기는 부드럽지만 반응 속도는 조금 예민할 수 있음' : null,
    ].filter(Boolean),
    health: [
      overloads.length > 0 ? '에너지 과열로 피로 누적에 주의' : null,
      hasChung ? '리듬이 흔들리면 컨디션 기복이 커질 수 있음' : null,
      seasonalContext.earthSupport ? '몸의 긴장을 조금 풀어주면 균형이 살아나기 쉬움' : null,
      adjustedDayMasterStrengthLevel === 'strong' ? '움직일 힘은 있지만 너무 몰아붙이면 금방 지칠 수 있음' : null,
    ].filter(Boolean),
    mind: [
      fieldImpacts.mind.signals.length > 0 ? `심리 흐름 자극: ${fieldImpacts.mind.signals.join(', ')}` : null,
      fieldImpacts.mind.adviceType === 'tension' ? '생각이 많아지고 예민해질 수 있음' : null,
      hasIn ? '정리와 성찰에는 좋지만 과몰입은 피하는 편이 좋음' : null,
      periodContext?.day?.roleHints?.[0] ? `오늘 흐름은 ${periodContext.day.roleHints[0]}` : null,
      hiddenResourceScore > 0 ? '겉으로는 조용해 보여도 안쪽에서 생각을 정리할 힘이 있음' : null,
    ].filter(Boolean),
  };

  const basisHintParts = [
    hiddenSupportScore > 0 ? '겉으로 드러나지 않아도 안쪽에서 버티는 힘이 함께 작동하고' : null,
    hiddenPressureScore > 0 ? '눈에 잘 안 띄는 부담이 함께 쌓일 수 있으며' : null,
    seasonElement ? '계절 흐름이 하루의 기본 리듬을 살짝 받쳐주고' : null,
    hasSik ? '표현과 소통이 자연스럽게 움직이기 쉽지만' : null,
    hasGwan ? '해야 할 일과 책임감이 또렷해지며' : null,
    hasJae ? '현실 감각과 손익 계산이 예민해지고' : null,
    hasIn ? '생각과 정리의 흐름이 강해지지만' : null,
    hasBi ? '내 생각을 지키고 싶은 마음이 함께 올라올 수 있고' : null,
    periodContext?.day?.roleHints?.[0] ? `오늘은 ${periodContext.day.roleHints[0]}` : null,
    hasChung ? '가까운 관계나 반응 속도는 조금 예민해질 수 있어요.' : null,
    !hasChung && hasHap ? '대화와 협력은 비교적 부드럽게 이어질 수 있어요.' : null,
    !hasChung && !hasHap ? '큰 충돌보다는 내 리듬을 지키는 쪽이 더 중요해요.' : null,
  ].filter(Boolean);

  const basisHint = basisHintParts.join(' ');

  return {
    overallTone: 'warm, grounded, practical',
    primaryTheme,
    secondaryTheme,
    intensity,
    dominantSignals,
    mainSupports: supplements,
    mainPressures: overloads,
    topOpportunities: dailyInteraction.opportunities,
    topRisks: dailyInteraction.branchRelations.map(r => r.relation),
    basisHint,
    periodContextHints,
    dailyKeyPoints,
    fieldNarratives,
    fieldReasonHints,
    avoidNarratives,
    recommendedNarrative: `${primaryTheme}. ${secondaryTheme}.`
  };
}
