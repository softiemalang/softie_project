const POSITION_LABELS = {
  year: '연주',
  month: '월주',
  day: '일주',
  hour: '시주',
}

const TOPIC_FEATURE_TAGS = {
  personality: ['identity', 'emotion', 'experimental'],
  career: ['career', 'social'],
  relationship: ['relationship', 'emotion'],
  timing: ['timing'],
  general: [],
}

const TOPIC_PALACES = {
  personality: ['life', 'mind'],
  career: ['career', 'wealth', 'life', 'travel'],
  relationship: ['spouse', 'life', 'mind', 'travel'],
  timing: [],
  general: ['life'],
}

export const TOPIC_LABELS = {
  personality: '성향과 내면 기질',
  career: '직업과 사회적 역할',
  relationship: '관계에서 반복되는 패턴',
  timing: '변화의 시기와 준비',
  general: '삶의 방향 탐색',
}

function compactJson(value) {
  return JSON.stringify(value ?? null)
}

function valueOfPillar(pillar) {
  if (!pillar) return null
  return pillar.value || (
    pillar.stem && pillar.branch ? `${pillar.stem}${pillar.branch}` : null
  )
}

export function formatSajuPillars(raw = {}, context = {}) {
  const factual = context.candidateSetConsensus?.factual || {}
  const values = {
    year: valueOfPillar(raw.pillars?.year) || factual.yearPillar,
    month: valueOfPillar(raw.pillars?.month) || factual.monthPillar,
    day: valueOfPillar(raw.pillars?.day) || factual.dayPillar,
    hour: valueOfPillar(raw.pillars?.hour) || factual.hourPillar,
  }
  return Object.entries(values)
    .map(([position, value]) => `${POSITION_LABELS[position]} ${value || '후보 확인 필요'}`)
    .join(' · ')
}

function formatMap(label, value = {}) {
  const entries = Object.entries(value || {})
  return `- **${label}**: ${entries.length > 0 ? entries.map(([key, item]) => `${key} ${item}`).join(' · ') : '자료 없음'}`
}

function formatRelations(label, relationBlock = {}) {
  const items = relationBlock.items || []
  if (items.length === 0) return `- **${label}**: 감지된 관계 없음`
  return `- **${label}**: ${items.map((item) => {
    const values = item.stems || item.branches || []
    const positions = item.positionLabels || item.positions || []
    return `${values.join('·')} ${item.relation}${positions.length > 0 ? `(${positions.join('·')})` : ''}`
  }).join(' / ')}`
}

function formatHiddenStems(hiddenStems = {}) {
  const entries = Object.entries(hiddenStems || {})
  if (entries.length === 0) return '- **지장간**: 자료 없음'
  return `- **지장간**: ${entries.map(([position, value]) => (
    `${POSITION_LABELS[position] || position} ${compactJson(value)}`
  )).join(' / ')}`
}

function formatCandidates(raw = {}, context = {}) {
  const candidates = raw.candidates || []
  const candidateFacts = context.candidateFacts || []
  const display = candidates.length > 0 ? candidates : candidateFacts
  if (display.length <= 1) {
    return [
      '- 후보 상태: 단일 계산안',
      `- Candidate Set Consensus: ${compactJson(context.candidateSetConsensus || {})}`,
    ].join('\n')
  }
  const candidateLines = display.map((candidate, index) => {
    const pillars = candidate.pillars
      ? Object.entries(candidate.pillars).map(([position, pillar]) => (
          `${POSITION_LABELS[position] || position} ${valueOfPillar(pillar) || compactJson(pillar)}`
        )).join(' · ')
      : candidate.label || candidate.candidateId || candidate.id
    return `- 후보 ${index + 1} (${candidate.label || candidate.inputAssumption || candidate.candidateId || candidate.id || '조건 미상'}): ${pillars}`
  })
  const differences = raw.candidateComparison?.differences
    || raw.candidateAnalysis?.pairwiseDiff?.differences
    || []
  return [
    `- 후보 수: ${display.length}`,
    ...candidateLines,
    `- Candidate Set Consensus: ${compactJson(context.candidateSetConsensus || raw.candidateAnalysis?.consensus || {})}`,
    `- 후보 간 차이: ${differences.length > 0 ? compactJson(differences) : '구조화된 차이 없음'}`,
  ].join('\n')
}

function formatDaYun(daYun = {}) {
  if (!daYun || Object.keys(daYun).length === 0) return '- 대운: 자료 없음'
  if (daYun.status === 'candidate_required') {
    return `- 대운: 후보 확인 필요 · ${compactJson(daYun.candidates || [])}`
  }
  const cycles = daYun.cycles || []
  const active = cycles.find((cycle) => cycle.isActive)
  const cycleValues = cycles.map((cycle) => {
    const start = cycle.startDate || cycle.startYear || cycle.startAge
    return `${cycle.value}${start ? `(${typeof start === 'object' ? compactJson(start) : start})` : ''}`
  })
  return [
    `- 대운 방향/기산: ${daYun.directionLabel || daYun.direction || '미상'} · ${compactJson(daYun.startAge || null)}`,
    `- 대운 배열: ${cycleValues.length > 0 ? cycleValues.join(' → ') : '자료 없음'}`,
    `- 기준일 활성 대운: ${active?.value || '해당 없음'}`,
  ].join('\n')
}

function formatPeriod(period = {}) {
  if (period.status === 'candidate_required') {
    return `${period.label || '기간'} 후보 ${compactJson(period.candidates || [])}`
  }
  return `${period.label || '기간'} ${period.value || '미상'} · 천간십성 ${period.stemTenGod || '미상'} · 지지본기십성 ${period.branchTenGod || '미상'} · 12운성 ${period.twelveStage || '미상'}`
}

export function formatSajuTiming(raw = {}) {
  const timing = raw.timing || {}
  const periods = timing.periods || {}
  const stageEntries = Object.entries(timing.natalTwelveStages || {})
  return [
    `- 기준일: ${timing.targetDate || '자료 생성 시점'}`,
    formatDaYun(timing.daYun),
    ...Object.values(periods).map((period) => `- ${formatPeriod(period)}`),
    `- 원국 12운성: ${stageEntries.length > 0 ? stageEntries.map(([position, value]) => `${POSITION_LABELS[position] || position} ${value.stage || compactJson(value)}`).join(' · ') : '자료 없음'}`,
    `- 기간 간 관계: ${compactJson(timing.crossPeriodRelations || {})}`,
    `- 지원 범위: ${timing.interpretationScope || '간지와 관계 존재를 계산하며 길흉은 단정하지 않음'}`,
  ].join('\n')
}

function formatExperimental(experimental = {}, status = 'experimental') {
  const candidateRequired = status === 'candidate_required' || experimental.status === 'candidate_required'
  if (candidateRequired) {
    return '- [Experimental] 후보 확인 전 강약·격국·용신·신살을 단일값으로 출력하지 않음'
  }
  const strength = experimental.strength || {}
  const gyeokguk = experimental.gyeokguk || {}
  const yongShin = experimental.yongShin || {}
  const shinsal = experimental.shinsal || []
  return [
    `- [Experimental · low] 강약: ${strength.level || '미산출'}${Number.isFinite(strength.score) ? ` (${strength.score}점)` : ''} · ${strength.basis || strength.limitations || '실험적 판정'}`,
    `- [Experimental · low] 격국: ${gyeokguk.name || '미산출'} · ${gyeokguk.reason || '실험적 판정'}`,
    `- [Experimental · low] 희용신: 용신 ${yongShin.primaryYongShinElement || '미산출'} / 희신 ${yongShin.heeShinElement || '미산출'} · ${yongShin.basis || '실험적 판정'}`,
    `- [Experimental · low] 신살: ${shinsal.length > 0 ? shinsal.map((item) => `${item.name}(${item.position || '위치 미상'} ${item.branch || ''})`).join(' · ') : '감지 항목 없음'}`,
  ].join('\n')
}

function formatScope(calculationResult = {}) {
  const scope = calculationResult.supportScope || {}
  const supported = scope.supported || scope.items || []
  const limitations = scope.limitations || []
  const unsupported = calculationResult.unsupported || []
  return [
    `- 지원 항목: ${supported.length > 0 ? supported.map((item) => item.title || item.label || item.item || item.id || String(item)).join(' · ') : '원국·관계·시기 계산'}`,
    `- 제한 사항: ${limitations.length > 0 ? limitations.map((item) => item.title || item.impact || item).join(' / ') : '표시된 불확실성 참조'}`,
    `- 미지원 항목: ${unsupported.length > 0 ? unsupported.map((item) => item.title || item.id || item).join(' · ') : '별도 명시 없음'}`,
  ].join('\n')
}

export function formatEvidenceBoundary(boundary = {}) {
  const source = boundary.sourceEvidence || {}
  const calculation = boundary.calculation || {}
  const relations = boundary.deterministicRelations || {}
  const interpretation = boundary.interpretation || {}
  return [
    '#### Evidence boundary',
    `- 계산 사실: ${calculation.status || 'not_available'}`,
    `- source/provenance: ${source.status || 'not_available'} · 독립 권위 ${source.independentAuthority || '미상'} · claim 검증 ${source.claimVerification || '미상'}`,
    `- deterministic relation: ${relations.status || 'not_available'} · semantic equivalence ${relations.semanticEquivalence || '미상'}`,
    `- 해석: ${interpretation.status || '미상'} · 개인 의미 ${interpretation.personalMeaning || '미상'} · 사용자 맥락 ${interpretation.userContext || '미상'}`,
    `- 논리적 참조: ${[...(calculation.refs || []), ...(relations.refs || [])].join(' / ') || '없음'}`,
    `- 경계 사유: ${source.reason || '별도 사유 없음'}`,
  ].join('\n')
}

export function formatEvidenceBoundarySummary(boundary = {}) {
  const source = boundary.sourceEvidence || {}
  const calculation = boundary.calculation || {}
  const interpretation = boundary.interpretation || {}
  return `- 근거 경계: 계산 ${calculation.status || 'not_available'} / source\/provenance ${source.status || 'not_available'} / 독립 권위 ${source.independentAuthority || '미상'} / 해석 ${interpretation.status || '미상'} / 개인 의미 ${interpretation.personalMeaning || '미상'}`
}

export function formatSajuFull(system = {}) {
  const calculationResult = system.calculationResult || {}
  const raw = calculationResult.raw || {}
  const context = system.context || system.interpretationContext || {}
  const isCandidate = system.verificationStatus === 'candidate_required' || system.interpretationStatus === 'candidate_only'

  if (isCandidate) {
    return [
      '### 사주 · 복수 명식 후보 존재 (단일 확정 불가)',
      `- 상태: ${system.status || 'candidate_required'} / 검증 ${system.verificationStatus || 'candidate_required'} / 신뢰도 ${system.confidence || 'low'}`,
      `- RuleSet/엔진: ${calculationResult.engine?.profile?.profileVersion || calculationResult.engine?.sourceEngine || '현재 사주 엔진 프로필'}`,
      '- 원국: 후보 확인 필요 (단일 확정 명식 없음 - 아래 후보 목록 참조)',
      '- 일간: 후보 확인 필요 (단일 확정 일간 없음 - 아래 후보 목록 참조)',
      '- 오행 표면 분포: 후보별 상이함 (아래 후보 비교 항목 참조)',
      '- 십성 표면 분포: 후보별 상이함 (아래 후보 비교 항목 참조)',
      '- 지장간: 후보별 상이함 (아래 후보 비교 항목 참조)',
      '- 천간 관계: 후보 확인 필요 (단일 확정 관계 없음)',
      '- 지지 관계: 후보 확인 필요 (단일 확정 관계 없음)',
      formatEvidenceBoundary(system.evidenceBoundary),
      '',
      '#### 후보·불확실성',
      formatCandidates(raw, context),
      `- 계산값이 달라지는 조건: ${compactJson(raw.calculationUncertainty || context.uncertainFactors || [])}`,
      `- 해석 경고: ${(system.warnings || []).join(' / ') || '별도 경고 없음'}`,
      '',
      '#### 운 흐름 계산값',
      '- 운 흐름: 후보별 상이함 (단일 확정 운 흐름 없음 - 아래 후보 목록 참조)',
      '',
      '#### Experimental 판정',
      formatExperimental(raw.experimental, 'candidate_required'),
      '',
      '#### 지원 범위와 미지원 항목',
      formatScope(calculationResult),
    ].join('\n')
  }

  return [
    '### 사주 · 실제 계산 근거',
    `- 상태: ${system.status || 'available'} / 검증 ${system.verificationStatus || '미상'} / 신뢰도 ${system.confidence || '미상'}`,
    `- RuleSet/엔진: ${calculationResult.engine?.profile?.profileVersion || calculationResult.engine?.sourceEngine || '현재 사주 엔진 프로필'} / 운 흐름 ${raw.timing?.ruleVersion || '버전 미상'}`,
    formatEvidenceBoundary(system.evidenceBoundary),
    `- 원국: ${formatSajuPillars(raw, context)}`,
    `- 일간: ${raw.dayMaster?.stem || context.candidateSetConsensus?.factual?.dayMaster || '후보 확인 필요'}`,
    formatMap('오행 표면 분포', raw.elements?.counts),
    formatMap('십성 표면 분포', raw.tenGods?.visible),
    formatHiddenStems(raw.hiddenStems),
    formatRelations('천간 관계', raw.stemRelations),
    formatRelations('지지 관계', raw.branchRelations),
    '',
    '#### 후보·불확실성',
    formatCandidates(raw, context),
    `- 계산값이 달라지는 조건: ${compactJson(raw.calculationUncertainty || context.uncertainFactors || [])}`,
    `- 해석 경고: ${(system.warnings || []).join(' / ') || '별도 경고 없음'}`,
    '',
    '#### 운 흐름 계산값',
    formatSajuTiming(raw),
    '',
    '#### Experimental 판정',
    formatExperimental(raw.experimental, calculationResult.status),
    '',
    '#### 지원 범위와 미지원 항목',
    formatScope(calculationResult),
  ].join('\n')
}

export function selectSajuTopicFeatures(calculationResult = {}, topic = 'general') {
  if (calculationResult.verificationStatus === 'candidate_required' || calculationResult.interpretationStatus === 'candidate_only') {
    return []
  }
  const features = calculationResult.features || []
  const tags = TOPIC_FEATURE_TAGS[topic] || []
  if (tags.length === 0) return features
  return features.filter((feature) => (
    (feature.tags || []).some((tag) => tags.includes(tag))
  ))
}

function formatFeatures(features = []) {
  if (features.length === 0) return '- 해당 주제에 선별된 사주 Feature 없음'
  return features.map((feature) => (
    `- ${feature.title} [${feature.confidence || '미상'}${feature.isExperimental ? ' · Experimental' : ''}]: ${feature.statement}`
  )).join('\n')
}

function formatZiweiPalace(palace = {}) {
  const own = palace.own || {}
  const opposite = palace.relationship?.opposite
  const trines = palace.relationship?.trine?.palaces || []
  return [
    `${palace.palaceName || palace.palaceId}(${palace.branch || '미상'})`,
    `주성 ${(own.majorStars || []).map((star) => star.name).join('·') || '없음'}`,
    `보조성 ${(own.minorStars || []).map((star) => star.name).join('·') || '없음'}`,
    `사화 ${(own.transformations || []).map((item) => item.name).join('·') || '없음'}`,
    `대궁 ${opposite?.palaceName || '미상'}`,
    `삼방 ${trines.map((item) => item.palaceName).join('·') || '미상'}`,
  ].join(' / ')
}

export function formatZiweiFull(system = {}) {
  if (!system.availableForChat || !system.context || !system.calculationResult) {
    return [
      '### 자미두수 · 사용 불가',
      `- 상태: ${system.status || 'unavailable'} / 검증 ${system.verificationStatus || '미상'}`,
      formatEvidenceBoundary(system.evidenceBoundary),
      `- 사유: ${(system.warnings || []).join(' / ') || '계산 자료 없음'}`,
    ].join('\n')
  }
  const calculation = system.calculationResult
  const context = system.context
  const chart = calculation.chart || {}
  const lunar = system.sourceDerivation?.lunarConversion || {}
  const scope = system.supportScope || calculation.supportScope || {}
  return [
    '### 자미두수 · 고정 RuleSet 기반 실험적 계산',
    `- 상태: ${system.status} / 검증 ${system.verificationStatus} / 신뢰도 ${system.confidence} (독립 외부 명반 대조 전)`,
    `- RuleSet: ${calculation.input?.ruleSet?.profileVersion || 'ziwei-fixed-ruleset-experimental-v1'} / ${compactJson(calculation.calculationMeta?.ruleSetVersions || {})}`,
    formatEvidenceBoundary(system.evidenceBoundary),
    `- 음력 파생 입력: ${lunar.lunarYear || calculation.input?.calendarBasis?.lunarYear || '미상'}년 ${lunar.lunarMonth || calculation.input?.lunarMonth || '미상'}월 ${lunar.lunarDay || calculation.input?.calendarBasis?.lunarDay || '미상'}일${lunar.isLeapMonth ? ' 윤달' : ''}`,
    `- 연간·연지·시지: ${calculation.input?.birthYearStem || '미상'}${calculation.input?.birthYearBranch || '미상'} / ${calculation.input?.hourBranch || '미상'}시`,
    `- 명궁·신궁: ${chart.mingGong?.branch || '미상'}宮 / ${chart.shenGong?.branch || '미상'}宮`,
    `- 오행국: ${chart.fiveElementsBureau?.name || '미상'} (${chart.fiveElementsBureau?.number || '미상'}국)`,
    `- 14주성: ${(chart.majorStars || []).map((star) => `${star.name}(${star.palaceName || star.palaceBranch})`).join(' · ') || '자료 없음'}`,
    `- 사화: ${(chart.transformations || []).map((item) => `${item.name}:${item.starId}`).join(' · ') || '자료 없음'}`,
    `- 보조성: ${(chart.minorStars || []).map((star) => `${star.name}(${star.palaceName || star.palaceBranch})`).join(' · ') || '자료 없음'}`,
    `- 미지원 범위(supportScope): 운한/시기 계산(${scope.timingStatus || 'unsupported'}) · 묘왕리함(${scope.brightnessStatus || 'unsupported'}) · 확장 성요(${scope.extendedMinorStarsStatus || 'unsupported'})`,
    '',
    '#### 12궁 및 삼방사정',
    ...Object.values(context.palaceContexts || {}).map((palace) => `- ${formatZiweiPalace(palace)}`),
    `- 후보·불확실성: ${compactJson(calculation.candidates || {})}`,
    `- 경고: ${(system.warnings || []).join(' / ')}`,
  ].join('\n')
}

export function formatZiweiTopic(system = {}, topic = 'general') {
  if (!system.availableForChat || !system.context) {
    return `- 자미두수: ${system.status || 'unavailable'} (${(system.warnings || []).join(' / ')})`
  }
  const scope = system.supportScope || system.calculationResult?.supportScope || {}
  const statusHeader = `- 자미두수 [Experimental · ${system.verificationStatus || 'needs_external_verification'} · 신뢰도 ${system.confidence || 'medium'}]: 독립 외부 명반 대조 전 (미지원 범위: 운한/시기 계산 ${scope.timingStatus || 'unsupported'} · 묘왕리함 ${scope.brightnessStatus || 'unsupported'} · 확장 성요 ${scope.extendedMinorStarsStatus || 'unsupported'})`
  if (topic === 'timing') {
    return `${statusHeader}\n- 자미두수: 현재 RuleSet은 대운·세운 등 독립 시기 계산을 지원하지 않으므로 시기 값을 생성하지 않음 (timingStatus: unsupported)`
  }
  const ids = TOPIC_PALACES[topic] || TOPIC_PALACES.general
  const contexts = system.context.palaceContexts || {}
  const lines = ids
    .map((id) => contexts[id])
    .filter(Boolean)
    .map((palace) => `- ${formatZiweiPalace(palace)}`)
  return [statusHeader, ...lines].join('\n')
}

export function formatTopicEvidence({ result, unifiedContext, topic = 'general' }) {
  const sajuSystem = unifiedContext.systems?.saju || {}
  const ziweiSystem = unifiedContext.systems?.ziwei || {}
  const sajuResult = sajuSystem.calculationResult || result?.systems?.saju || {}
  const raw = sajuResult.raw || {}
  const isCandidateSaju = sajuSystem.verificationStatus === 'candidate_required' || sajuSystem.interpretationStatus === 'candidate_only'
  const features = isCandidateSaju ? [] : selectSajuTopicFeatures(sajuResult, topic)
  const sajuFeatureText = isCandidateSaju
    ? '- 사주: 복수 명식 후보 존재 조건으로 단일 대표 Feature를 출력하지 않음'
    : formatFeatures(features)

  const sections = [
    `### 사주 · ${TOPIC_LABELS[topic] || TOPIC_LABELS.general} Feature`,
    formatEvidenceBoundarySummary(sajuSystem.evidenceBoundary),
    sajuFeatureText,
  ]

  if (topic === 'personality') {
    if (isCandidateSaju) {
      sections.push(
        '- 오행/십성: 후보별 상이함 (아래 후보 비교 항목 참조)',
        formatExperimental(raw.experimental, 'candidate_required'),
      )
    } else {
      sections.push(
        formatMap('오행 표면 분포', raw.elements?.counts),
        formatMap('십성 표면 분포', raw.tenGods?.visible),
        formatExperimental(raw.experimental, sajuResult.status),
      )
    }
  } else if (topic === 'career') {
    if (isCandidateSaju) {
      sections.push('#### 직업 관련 시기 근거', '- 대운·세운: 후보별 상이함 (단일 확정 불가)')
    } else {
      sections.push('#### 직업 관련 시기 근거', formatDaYun(raw.timing?.daYun), `- 세운: ${formatPeriod(raw.timing?.periods?.year || {})}`)
    }
  } else if (topic === 'relationship') {
    if (isCandidateSaju) {
      sections.push(
        '- 일지: 후보 확인 필요 (단일 확정 불가)',
        '- 일지·관계 관련 합충형파해: 후보별 상이함',
      )
    } else {
      const dayBranch = raw.pillars?.day?.branch
      const relationshipRelations = (raw.branchRelations?.items || []).filter((item) => (
        (item.positions || []).includes('day')
        || (item.branches || []).includes(dayBranch)
        || (item.positionLabels || []).includes('일지')
      ))
      sections.push(
        `- 일지: ${dayBranch || '후보 확인 필요'}`,
        formatRelations('일지·관계 관련 합충형파해', { items: relationshipRelations }),
      )
    }
  } else if (topic === 'timing') {
    if (isCandidateSaju) {
      sections.push('#### 대운·세운·월운·일진·경계 후보', '- 시기 계산: 후보별 상이함 (단일 확정 불가)', formatCandidates(raw, sajuSystem.context || {}))
    } else {
      sections.push('#### 대운·세운·월운·일진·경계 후보', formatSajuTiming(raw), formatCandidates(raw, sajuSystem.context || {}))
    }
  }

  sections.push(
    `### 자미두수 · ${TOPIC_LABELS[topic] || TOPIC_LABELS.general} Palace Context`,
    formatEvidenceBoundarySummary(ziweiSystem.evidenceBoundary),
    formatZiweiTopic(ziweiSystem, topic),
  )
  return sections.join('\n')
}
