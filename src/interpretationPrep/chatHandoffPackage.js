/**
 * Chat handoff Markdown package builder.
 *
 * The package receives both the original preparation result and the
 * availability-aware unified context so topic copies can select real features
 * instead of changing only their title.
 */

import {
  TOPIC_LABELS,
  formatSajuFull,
  formatSajuPillars,
  formatEvidenceBoundarySummary,
  formatTopicEvidence,
  formatZiweiFull,
} from './handoffFormatters.js'

const SYSTEM_LABELS = {
  saju: '사주',
  ziwei: '자미두수',
  astrology: '서양 점성학',
}

const PRIVACY_QUESTION_SUMMARY = {
  personality: '내면 기질과 반응 패턴 탐색',
  career: '일과 사회적 역할의 방향 탐색',
  relationship: '관계에서 반복되는 패턴 탐색',
  timing: '변화를 준비할 시기와 조건 탐색',
  general: '현재 삶의 방향과 가능성 탐색',
}

function normalizeArguments(configOrUnified, legacyQuestion, legacyTopic) {
  if (
    configOrUnified
    && typeof configOrUnified === 'object'
    && (
      Object.hasOwn(configOrUnified, 'unifiedContext')
      || Object.hasOwn(configOrUnified, 'result')
    )
  ) {
    return {
      result: configOrUnified.result || null,
      unifiedContext: configOrUnified.unifiedContext || {},
      userQuestion: configOrUnified.userQuestion || '',
      topicCategory: configOrUnified.topicCategory || 'general',
    }
  }
  return {
    result: null,
    unifiedContext: configOrUnified || {},
    userQuestion: legacyQuestion || '',
    topicCategory: legacyTopic || 'general',
  }
}

function formatSystemStatus(unifiedContext) {
  return ['saju', 'ziwei', 'astrology'].map((system) => {
    const descriptor = unifiedContext.systems?.[system] || {}
    const available = descriptor.availableForChat ? 'Chat 사용 가능' : 'Chat 사용 불가'
    return `- **${SYSTEM_LABELS[system]}**: ${descriptor.status || unifiedContext.systemAvailability?.[system] || 'unavailable'} / 검증 ${descriptor.verificationStatus || '미상'} / 신뢰도 ${descriptor.confidence || 'not_available'} / ${available}`
  }).join('\n')
}

function formatBirthBasis(result) {
  const input = result?.input?.normalized
  if (!input) return '- 입력 계산 기준: 원본 prepare result가 제공되지 않음'
  return [
    `- 출생 기준: ${input.birthDate} ${input.birthTime || '출생시각 후보'} / ${input.referenceCityLabel || input.placeName || '지역 미상'} / ${input.timezone || '시간대 미상'}`,
    `- 자료 기준일: ${input.targetDate || '자료 생성 시점'}`,
    `- 달력·시각 정확도: ${input.calendar || 'solar'} / ${input.timeAccuracy || '미상'}`,
  ].join('\n')
}

function formatWarnings(unifiedContext) {
  const warnings = unifiedContext.warnings || unifiedContext.unifiedConfidence?.warnings || []
  return warnings.length > 0
    ? warnings.map((warning) => `- ${warning}`).join('\n')
    : '- 별도 경고 없음'
}

function formatSharedThemes(unifiedContext) {
  if ((unifiedContext.sharedThemes || []).length === 0) {
    return '- 사용 가능한 체계가 2개 미만이면 공통 테마를 생성하지 않음'
  }
  return unifiedContext.sharedThemes.map((theme) => [
    `- **${theme.label}**`,
    ...Object.entries(theme.evidence || {}).map(([system, evidence]) => (
      `  - ${SYSTEM_LABELS[system] || system}: ${(evidence || []).join(' / ')}`
    )),
    `  - 비교 원칙: ${theme.synthesis}`,
  ].join('\n')).join('\n')
}

function formatDifferentPerspectives(unifiedContext) {
  if ((unifiedContext.differentPerspectives || []).length === 0) {
    return '- 비교 가능한 독립 관점 없음'
  }
  return unifiedContext.differentPerspectives.map((perspective) => (
    `- ${perspective.label}: ${(perspective.evidence || []).join(' / ')}`
  )).join('\n')
}

function sajuQuickFacts(unifiedContext, result) {
  const system = unifiedContext.systems?.saju || {}
  const calculationResult = system.calculationResult || result?.systems?.saju || {}
  const context = system.context || unifiedContext.sajuContext || {}
  const raw = calculationResult.raw || {}
  const isCandidate = system.verificationStatus === 'candidate_required' || system.interpretationStatus === 'candidate_only'
  const pillarsText = isCandidate
    ? '후보 확인 필요 (단일 확정 명식 없음)'
    : formatSajuPillars(raw, context)
  const dayMaster = isCandidate
    ? '후보 확인 필요 (단일 확정 불가)'
    : (raw.dayMaster?.stem || context.candidateSetConsensus?.factual?.dayMaster || '후보 확인 필요')

  return [
    `- 사주: ${pillarsText}`,
    `- 일간: ${dayMaster}`,
    `- 신뢰도/상태: ${system.confidence || unifiedContext.unifiedConfidence?.sajuConfidence || '미상'} / ${system.status || 'available'}${calculationResult.status === 'experimental' ? ' · Experimental 판정 포함' : ''}`,
  ].join('\n')
}

function ziweiQuickFacts(unifiedContext) {
  const system = unifiedContext.systems?.ziwei || {}
  if (!system.availableForChat || !system.context) {
    return `- 자미두수: ${system.status || 'unavailable'} · 실제 계산값을 생성하지 않음`
  }
  const factual = system.context.candidateSetConsensus?.factual || {}
  const scope = system.supportScope || system.context?.supportScope || system.calculationResult?.supportScope || {}
  const scopeText = `미지원 범위: 운한/시기 계산 ${scope.timingStatus || 'unsupported'} · 묘왕리함 ${scope.brightnessStatus || 'unsupported'} · 확장 성요 ${scope.extendedMinorStarsStatus || 'unsupported'}`
  return `- 자미두수 [Experimental · ${system.verificationStatus || 'needs_external_verification'} · 신뢰도 ${system.confidence || 'medium'}]: 명궁 ${factual.mingGongBranch || '후보'}宮 · 신궁 ${factual.shenGongBranch || '후보'}宮 · ${factual.fiveElementsBureau || '오행국 후보'} (${scopeText})`
}

function astrologyStatus(unifiedContext) {
  const system = unifiedContext.systems?.astrology || {}
  return [
    `- 서양 점성학: ${system.status || 'simulation_blocked'} · 검증된 천문력 Adapter 미연결로 계산값 미포함`,
    formatEvidenceBoundarySummary(system.evidenceBoundary),
  ].join('\n')
}

export function buildChatHandoffPackage(configOrUnified = {}, legacyQuestion = '', legacyTopic = 'general') {
  const {
    result,
    unifiedContext,
    userQuestion,
    topicCategory,
  } = normalizeArguments(configOrUnified, legacyQuestion, legacyTopic)
  const subjectName = unifiedContext.subjectName || result?.input?.normalized?.subjectName || '내담자'
  const topicLabel = TOPIC_LABELS[topicCategory] || TOPIC_LABELS.general
  const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
  const schemaHeader = `[SCHEMA v2.0 · Generated ${timestamp}]`
  const question = userQuestion.trim() || `${topicLabel}이 궁금합니다.`
  const sajuSystem = unifiedContext.systems?.saju || {
    status: unifiedContext.systemAvailability?.saju,
    confidence: unifiedContext.unifiedConfidence?.sajuConfidence,
    context: unifiedContext.sajuContext,
    availableForChat: Boolean(unifiedContext.sajuContext && Object.keys(unifiedContext.sajuContext).length),
  }
  const ziweiSystem = unifiedContext.systems?.ziwei || {}

  const fullMarkdown = [
    schemaHeader,
    `# 3-System Chat Handoff Package · ${subjectName}님`,
    '',
    '## 1. 질문과 계산 기준',
    `- 질문: "${question}"`,
    `- 관심 주제: ${topicCategory} · ${topicLabel}`,
    formatBirthBasis(result),
    '',
    '## 2. 체계별 가용 상태',
    formatSystemStatus(unifiedContext),
    '',
    '## 3. 체계별 실제 계산 근거',
    formatSajuFull(sajuSystem),
    '',
    formatZiweiFull(ziweiSystem),
    '',
    '### 서양 점성학 · Simulation 차단',
    astrologyStatus(unifiedContext),
    `- 경고: ${(unifiedContext.systems?.astrology?.warnings || []).join(' / ') || '검증된 천문력 Adapter가 필요함'}`,
    '',
    '## 4. 질문 주제별 선별 자료',
    formatTopicEvidence({ result, unifiedContext, topic: topicCategory }),
    '',
    '## 5. Availability-aware 통합 구조',
    `- Context 유형: ${unifiedContext.systemType || 'no_system_context'}`,
    `- 사용 가능 체계: ${(unifiedContext.availableSystems || []).map((system) => SYSTEM_LABELS[system]).join(' · ') || '없음'}`,
    `- 통합 신뢰도: ${unifiedContext.unifiedConfidence?.overallConfidence || 'not_available'} (합성 대상 체계 중 가장 낮은 신뢰도 기준)`,
    '### 공통으로 비추는 질문 영역',
    formatSharedThemes(unifiedContext),
    '### 서로 다른 독립 관점',
    formatDifferentPerspectives(unifiedContext),
    '',
    '## 6. 불확실성과 경고',
    formatWarnings(unifiedContext),
    '',
    '## 7. Chat 해석 가드레일',
    '- 세 체계의 용어를 직접 인과관계로 섞거나 결과를 평균·다수결로 합치지 마십시오.',
    '- 각 체계의 근거, 공통으로 비추는 질문, 다르게 보는 지점을 분리해 설명하십시오.',
    '- 후보와 경계 조건은 하나의 값으로 확정하지 마십시오.',
    '- [Experimental] 강약·격국·용신·신살과 자미두수 결과는 검증 수준을 함께 고지하십시오.',
    '- 서양 점성학 값을 추정하거나 Simulation 값을 실제 천문력 계산처럼 생성하지 마십시오.',
    '- 결정론적 성격·운명·미래 판정을 피하고 사용자의 실제 경험을 확인하는 질문을 포함하십시오.',
    '',
    '## 8. 대화 시작 요청',
    `"위 계산 근거와 검증 상태 안에서 ${topicLabel}을 세 체계의 독립 관점으로 살펴주세요. 공통점과 차이를 구분하고, 제 실제 경험을 확인하는 질문으로 자유로운 대화를 시작해주세요."`,
  ].join('\n')

  const quickMarkdown = [
    schemaHeader,
    `# Chat 해석 핵심 자료 · ${subjectName}님`,
    `- 질문: "${question}"`,
    `- 주제: ${topicLabel}`,
    sajuQuickFacts(unifiedContext, result),
    formatEvidenceBoundarySummary(sajuSystem.evidenceBoundary),
    ziweiQuickFacts(unifiedContext),
    formatEvidenceBoundarySummary(ziweiSystem.evidenceBoundary),
    astrologyStatus(unifiedContext),
    '- 요청: 제공된 값과 상태만 사용하고 후보·Experimental·미지원 경계를 유지해 대화를 시작해주세요.',
  ].join('\n')

  const topicFocusedMarkdown = [
    schemaHeader,
    `# ${topicLabel} 집중 Chat Handoff · ${subjectName}님`,
    `- 질문: "${question}"`,
    `- 선별 원칙: ${topicCategory} 태그와 관련 Palace Context만 포함`,
    '',
    formatTopicEvidence({ result, unifiedContext, topic: topicCategory }),
    '',
    astrologyStatus(unifiedContext),
    '- 요청: 위 주제별 근거만 우선 사용하되, 체계별 용어를 섞지 말고 실제 경험을 묻는 대화로 이어가 주세요.',
  ].join('\n')

  const privacyMinimalMarkdown = [
    schemaHeader,
    '# 익명 Chat Handoff · 개인정보 최소화',
    `- 고민 주제: ${topicCategory}`,
    `- 질문 요약: ${PRIVACY_QUESTION_SUMMARY[topicCategory] || PRIVACY_QUESTION_SUMMARY.general}`,
    '- 이름·정확한 생년월일시·출생지·내부 식별자는 포함하지 않음',
    sajuQuickFacts(unifiedContext, result),
    formatEvidenceBoundarySummary(sajuSystem.evidenceBoundary),
    ziweiQuickFacts(unifiedContext),
    formatEvidenceBoundarySummary(ziweiSystem.evidenceBoundary),
    astrologyStatus(unifiedContext),
    '- 요청: 제공된 익명 계산 근거만 사용하고, 개인정보를 추측하거나 요청하지 말아주세요.',
  ].join('\n')

  const copies = {
    full: fullMarkdown,
    quick: quickMarkdown,
    topicFocused: topicFocusedMarkdown,
    privacyMinimal: privacyMinimalMarkdown,
  }

  return {
    subjectName,
    userQuestion: question,
    topicCategory,
    copies,
    characterCounts: Object.fromEntries(
      Object.entries(copies).map(([type, markdown]) => [type, markdown.length]),
    ),
  }
}
