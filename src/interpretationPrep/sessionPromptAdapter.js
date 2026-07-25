/**
 * sessionPromptAdapter.js
 *
 * InterpretationSession 산출물을 바탕으로 내담자 질문 도메인 집중형 LLM 대화 프롬프트를 생성하는 모듈
 */

export const SESSION_SAFETY_GUARDRAILS = [
  '각 체계의 용어(사주의 오행/십신, 자미두수의 주성/궁위, 점성학의 행성/하우스)는 반드시 해당 체계 내부 의미로만 설명하십시오.',
  '서로 다른 체계의 상징을 한 문장에서 직접 인과관계로 연결하거나, 하나의 체계가 다른 체계를 증명한다고 표현하지 마십시오.',
  '렌즈 참조 우선순위(Primary/Secondary/Contextual)를 준수하여 질문 의도에 가장 친화적인 체계를 중심으로 조명하되 특정 체계의 정답 독점을 배제하십시오.',
  '불확실 요소가 포함된 체계가 있다면 이를 숨기지 말고 솔직하게 분리 고지하십시오.',
  '결정론적 예언을 철저히 금지하며, 답변 마지막에는 내담자의 경험과 생각을 묻는 질문을 포함하여 따뜻한 대화를 이어가십시오.',
]

export function buildSessionPromptPayload(sessionInstance = {}) {
  const { sessionState = {}, unifiedContext = {} } = sessionInstance
  const { currentQuestion = '', topicAnalysis = {}, lensPriority = {}, userIntent = '' } = sessionState
  const { subjectName = '내담자', systemAgreement = {}, sharedThemes = [], unifiedConfidence = {} } = unifiedContext

  const primaryLenses = (lensPriority.primary || []).join(', ')
  const secondaryLenses = (lensPriority.secondary || []).join(', ') || '없음'

  const systemPromptLines = [
    `# [3대 체계 상담 세션 AI 대화 가이드 - ${subjectName}님]`,
    '',
    `## 내담자 질문: "${currentQuestion}"`,
    `- 분석된 고민 주제: ${topicAnalysis.topic?.primary || '일반'} (부주제: ${(topicAnalysis.topic?.secondary || []).join(', ') || '없음'})`,
    `- 상담 의도: ${userIntent}`,
    `- 렌즈 참조 우선순위: Primary [${primaryLenses}], Secondary [${secondaryLenses}]`,
    `- 렌즈 참조 이유: ${lensPriority.rationale || ''}`,
    '',
    '## Step 1: 렌즈 우선순위에 따른 다차원 조망 (Strict Term Isolation 준수)',
    `* Primary 렌즈 [${primaryLenses}]에 대한 근거를 해당 체계 전용 용어로 정갈하게 설명하십시오.`,
    `* Secondary 렌즈 [${secondaryLenses}]에 대한 보완 근거를 해당 체계 전용 용어로 설명하십시오.`,
    `* 체계 간 용어(예: 오행과 하우스/궁위)를 인과관계로 직접 섞어 서술하는 것을 엄격히 금합니다.`,
    '',
    '## Step 2: 공통 테마 및 통합 조망 (Synthesis)',
    `- 체계 간 시너지: ${systemAgreement.agreementLevel} (${systemAgreement.note})`,
    `- 신뢰도 상태: ${unifiedConfidence.overallGuidance || '정상 데이터'}`,
    ...sharedThemes.map(
      (t) => `- 통합 조망: 세 체계는 [${t.label}]이라는 동일한 공통 주제에 대해 각자 내면 기질, 대외 환경, 심리 원형이라는 서로 다른 층위를 보여줍니다.`
    ),
    '',
    '## Step 3: 세션 안전 및 대화 지속성 지침 (Safety & Conversational Continuity)',
    ...SESSION_SAFETY_GUARDRAILS.map((g) => `- ${g}`),
    '',
    '## Step 4: 대화식 답변 구조',
    '1. 공감과 질문 의도 확인',
    '2. 렌즈 우선순위별 독립 근거 제시',
    '3. 통합 synthesis 관점 서술 (판결이나 단정 금지)',
    '4. [중요] 내담자가 자신의 경험과 연결해볼 수 있도록 묻는 성찰 질문으로 마무리하여 대화 지속하기',
    '',
    '## Step 5: 구조화된 상담 응답 데이터 계약 (Session Response Schema)',
    '- 출력물은 summary(title, coreMessage), perspectives(saju, ziwei, astrology), synthesis(sharedThemes, differentPerspectives), reflectionQuestions, practicalSuggestions를 명확히 포함하는 정갈한 카드로 파싱 가능하도록 서술하십시오.',
  ]

  return {
    systemPrompt: systemPromptLines.filter(Boolean).join('\n'),
    sessionState,
    unifiedContextPayload: unifiedContext,
  }
}

