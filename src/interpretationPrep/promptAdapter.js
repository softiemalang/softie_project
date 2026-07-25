/**
 * promptAdapter.js
 *
 * [역할 및 원칙]
 * - Prompt Adapter는 계산이나 해석 내용을 직접 생성하지 않는 '순수 변환 및 통역사 계층(Pure Translator & Guardrail)'입니다.
 * - InterpretationContext를 주입받아 LLM(Large Language Model)이 환각, 단정, 과장 없이
 *   책임감 있게 해석하도록 보장하는 SYSTEM 지침, Structured Context Payload, USER Prompt 패키지를 조합합니다.
 */

export function buildInterpretationPrompt(interpretationContext, options = {}) {
  if (!interpretationContext || typeof interpretationContext !== 'object') {
    return null
  }

  const {
    candidateSetConsensus,
    candidateFacts,
    uncertainFactors,
    calculationConfidence,
    interpretationWarnings,
  } = interpretationContext

  const taskOptions = options.task || {}
  const topicId = options.topicId || 'general'
  const userQuestion = options.question || '전반적인 사주 특성과 경향성을 안내해 주세요.'

  // 1. SYSTEM Instruction & Constraints
  const systemInstruction = buildSystemInstruction({
    calculationConfidence,
    interpretationWarnings,
  })

  // 2. Interpretation Task (해석 과제 및 톤앤매너)
  const interpretationTask = {
    topicId,
    goal: taskOptions.goal || '사주 명식의 공통 바탕과 불확실성/후보 가능성을 균형 있게 설명',
    tone: taskOptions.tone || '차분하고 수용적이며 객관적인 상담형 어조',
    avoid: [
      '길흉화복이나 길/흉의 확정적 미래 예언',
      '단일 사주 명식으로 운명을 절대 단정하는 표현',
      '의학적·법률적·재정적 절대 조언',
      '후보 간 분기 사항을 하나의 확정된 사실로 일관 기재하는 행위',
      ...(taskOptions.avoid || []),
    ],
  }

  // 3. Structured Context Payload (LLM 전달용 정제 데이터)
  const contextPayload = {
    candidateSetConsensus: candidateSetConsensus || {},
    candidateFacts: Array.isArray(candidateFacts) ? candidateFacts : [],
    uncertainFactors: Array.isArray(uncertainFactors) ? uncertainFactors : [],
    calculationConfidence: calculationConfidence || {
      stateContract: { confidence: 'high', verificationStatus: 'verified' },
    },
    interpretationConstraints: Array.isArray(interpretationWarnings) ? interpretationWarnings : [],
  }

  // 4. User Question & Formatted Prompt
  const userQuestionPrompt = buildUserPrompt({
    userQuestion,
    candidateSetConsensus,
    uncertainFactors,
    interpretationConstraints: contextPayload.interpretationConstraints,
  })

  return {
    systemInstruction,
    interpretationTask,
    contextPayload,
    userQuestionPrompt,
    formattedPromptPackage: {
      system: systemInstruction,
      task: interpretationTask,
      data: contextPayload,
      user: userQuestionPrompt,
    },
  }
}

function buildSystemInstruction({ calculationConfidence, interpretationWarnings }) {
  const isLowConfidence = calculationConfidence?.stateContract?.confidence === 'low'
  const needsVerification = calculationConfidence?.stateContract?.verificationStatus === 'needs_verification'

  return [
    '너는 사주명리학적 바탕과 불확실성을 객관적으로 설명하는 정교한 AI 해석 보조자이다.',
    '다음의 엄격한 해석 제약 조건(Interpretation Constraints)을 반드시 준수하여 응답해야 한다:',
    '1. [candidateSetConsensus] 항목은 현재 생성된 후보 집합 내에서 공통으로 확인되는 바탕 자료일 뿐, 우주적 절대 진실로 과장하여 단정하지 않는다.',
    '2. [candidateFacts] 및 [uncertainFactors]에 분기 항목이 존재하는 경우, 단일 명식으로 확정 짓지 말고 "가정적 가능성"과 "조건별 분기"로 나누어 설명한다.',
    '3. [interpretationConstraints] 제약 목록의 지침을 최우선 안전 가이드라인으로 엄수한다.',
    '4. 사용자 질문에 포함된 전제나 가정(예: "입춘이라 바뀐다" 등)을 검증 없이 무조건 사실로 받아들이지 말고, 제공된 [contextPayload]의 실제 데이터와 제약 조건을 우선 기준으로 활용한다.',
    isLowConfidence ? '5. [HIGH PRIORITY] 본 입력은 신뢰도(Confidence)가 낮거나(Low) 후보 분기가 존재하므로 모든 해석에서 확정적 표현을 절대 금하며, 후보 간 비교와 가능성 제시 위주로 서술한다.' : '',
    needsVerification ? '6. [HIGH PRIORITY] 표준시/지역보정/역사적 검증이 필요한 구간(needs_verification)이므로 산출 결과의 가변성을 분명히 안내한다.' : '',
  ].filter(Boolean).join('\n')
}

function buildUserPrompt({ userQuestion, candidateSetConsensus, uncertainFactors, interpretationConstraints }) {
  const factualPillars = candidateSetConsensus?.factual || {}
  const pillarsSummary = [
    factualPillars.yearPillar && `연주:${factualPillars.yearPillar}`,
    factualPillars.monthPillar && `월주:${factualPillars.monthPillar}`,
    factualPillars.dayPillar && `일주:${factualPillars.dayPillar}`,
    factualPillars.hourPillar && `시주:${factualPillars.hourPillar}`,
  ].filter(Boolean).join(' ') || '명식 정보 제공됨'

  const hasUncertainty = uncertainFactors && uncertainFactors.length > 0
  const constraintsText = interpretationConstraints && interpretationConstraints.length > 0
    ? `\n[해석 시 필수 준수 가이드라인]\n- ${interpretationConstraints.join('\n- ')}`
    : ''

  return [
    `[사용자 질문]: ${userQuestion}`,
    `[공통 바탕 명식 요약]: ${pillarsSummary} (일간: ${factualPillars.dayMaster || '미상'})`,
    hasUncertainty ? `[주요 변동 요소]: ${uncertainFactors.map((u) => u.field).join(', ')} (상세 내역은 data 참조)` : '[주요 변동 요소]: 없음 (단일 기준 계산)',
    constraintsText,
    '\n위 데이터 구조와 제약 조건을 바탕으로 차분하고 객관적인 상담 어조로 질문에 답변해 주세요.',
  ].filter(Boolean).join('\n')
}
