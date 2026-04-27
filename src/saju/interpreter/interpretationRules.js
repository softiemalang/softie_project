export function buildInterpretationProfile({ natalAnalysis, dailyInteraction, gender }) {
  const { dayMasterStrengthLevel, imbalanceFlags } = natalAnalysis;
  const { supplements, overloads, branchRelations, signals, fieldImpacts } = dailyInteraction;

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
    fieldNarratives,
    avoidNarratives,
    recommendedNarrative: `${primaryTheme}. ${secondaryTheme}.`
  };
}
