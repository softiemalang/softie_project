/**
 * promptAdapter.js
 *
 * [역할 및 원칙]
 * - Prompt Adapter는 계산이나 명리학 판단을 직접 생성하지 않는 '순수 변환 및 대화 UX 통역사 계층(Pure Translator & Guardrail)'입니다.
 * - InterpretationContext를 주입받아 LLM이 환각, 단정, 과장 없이
 *   4단계 해석 프로토콜(Consensus -> Variances -> Reflective Question -> Practical Guidance)과
 *   도메인별 Prompt Profile(personality, career, relationship, timing)에 맞춰 고품질 상담 대화를 이끌도록 프롬프트를 구성합니다.
 */

export const INTERPRETATION_PROTOCOLS = [
  '1단계 [공통 바탕(Consensus) 설명]: 현재 생성된 후보 범위 안에서 안정적으로 확인되는 공통 명식 바탕과 기본 성향을 먼저 안내합니다.',
  '2단계 [후보/변동(Variances) 비교 대조]: 시주/절기/DST 등으로 인한 분기 항목이 있을 경우, "A라면 X 경향, B라면 Y 경향" 형태로 조건별 차이를 객관적으로 대조 설명합니다.',
  '3단계 [사용자 경험 성찰 질문 유도]: "실제 어떤 환경이나 행동 패턴이 스스로에게 더 친숙하게 와닿으시나요?"와 같이 사용자가 스스로를 돌아보도록 질문을 돌려줍니다.',
  '4단계 [현실적 적용 방향 제안]: 길흉 예언이나 단정적 미래 예측 대신, 현재 상황에서 주체적으로 시도해 볼 수 있는 태도와 대안 중심 조언을 제시합니다.',
]

export const TOPIC_PROFILES = {
  personality: {
    topicId: 'personality',
    label: '성향 및 기질 분석',
    goal: '내면의 바탕과 본질적 기질, 행동 패턴 및 스스로를 이해하기 위한 성찰 질문 제공',
    framework: [
      '내면의 바탕 오행/십신 성향 설명 (Consensus)',
      '후보 간 기질 표출 방식의 차이 비교 (Variances)',
      '자기 이해를 돕는 성찰적 질문 던지기',
    ],
  },
  career: {
    topicId: 'career',
    label: '직업 및 적성 탐색',
    goal: '원천적 강점, 적합한 업무 환경적 요인, 잠재적 리스크 및 현실적 커리어 조언',
    framework: [
      '바탕 명식에 드러난 원천적 적성과 업무 스타일 (Consensus)',
      '후보별 강점과 주의해야 할 업무 환경 차이 (Variances)',
      '현실적 커리어 선택과 역량 발휘 방향 조언',
    ],
  },
  relationship: {
    topicId: 'relationship',
    label: '대인관계 및 소통 패턴',
    goal: '상대방과의 소통 방식, 갈등 발생 양상, 조화로운 대인 관계 환경 조성',
    framework: [
      '기본 소통 스타일과 대인관계적 바탕 (Consensus)',
      '후보별 감정 표현 및 갈등 대응 방식의 차이 (Variances)',
      '상대방과의 건강한 관계 형성을 위한 소통 질문',
    ],
  },
  timing: {
    topicId: 'timing',
    label: '운의 흐름 및 변화 대비',
    goal: '단정적 미래 예언을 엄금하고, 환경적 변동 가능성과 유연한 주체적 준비 방향 안내',
    framework: [
      '대운/세운 흐름이 제공하는 공통적 환경 바탕 (Consensus)',
      '시주/절기 분기에 따른 변화 시점 및 양상의 가변성 (Variances)',
      '특정 연도 단정 예언 금지 및 주체적 대비책 질문 유도',
    ],
    specialConstraints: [
      '미래 특정 연도나 날짜에 특정 사건이 일어난다고 단정적으로 예언하지 마십시오.',
      '운의 흐름은 절대적 운명이 아닌 "환경적 변동성과 시도의 적기"로 설명하십시오.',
    ],
  },
  general: {
    topicId: 'general',
    label: '전반적인 사주 특성 안내',
    goal: '사주 명식의 공통 바탕과 불확실성/후보 가능성을 균형 있게 종합 설명',
    framework: [
      '명식 전체 공통 바탕 설명',
      '변동 항목 대조',
      '성찰 질문 및 방향 조언',
    ],
  },
}

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

  const topicId = options.topicId || 'general'
  const profile = TOPIC_PROFILES[topicId] || TOPIC_PROFILES.general
  const taskOptions = options.task || {}
  const userQuestion = options.question || '전반적인 사주 특성과 경향성을 안내해 주세요.'

  // 1. SYSTEM Instruction & Constraints
  const systemInstruction = buildSystemInstruction({
    calculationConfidence,
    interpretationWarnings,
    profile,
  })

  // 2. Interpretation Task (해석 과제 및 톤앤매너)
  const interpretationTask = {
    topicId: profile.topicId,
    topicLabel: profile.label,
    goal: taskOptions.goal || profile.goal,
    tone: taskOptions.tone || '차분하고 수용적이며 객관적인 상담형 어조',
    framework: profile.framework,
    protocol: INTERPRETATION_PROTOCOLS,
    avoid: [
      '길흉화복이나 길/흉의 확정적 미래 예언',
      '단일 사주 명식으로 운명을 절대 단정하는 표현',
      '의학적·법률적·재정적 절대 조언',
      '후보 간 분기 사항을 하나의 확정된 사실로 일관 기재하는 행위',
      ...(profile.specialConstraints || []),
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
    profile,
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

function buildSystemInstruction({ calculationConfidence, interpretationWarnings, profile }) {
  const isLowConfidence = calculationConfidence?.stateContract?.confidence === 'low'
  const needsVerification = calculationConfidence?.stateContract?.verificationStatus === 'needs_verification'

  return [
    `너는 사주명리학적 바탕과 불확실성을 객관적으로 설명하고, 사용자의 자기 성찰을 돕는 정교한 AI 해석 보조자이다. (상담 도메인: ${profile.label})`,
    '다음의 엄격한 해석 제약 조건(Interpretation Constraints) 및 4단계 해석 프로토콜을 반드시 준수하여 응답해야 한다:',
    '1. [4단계 해석 프로토콜 준수]:',
    ...INTERPRETATION_PROTOCOLS.map((p) => `   - ${p}`),
    '2. [candidateSetConsensus] 항목은 현재 생성된 후보 집합 내에서 공통으로 확인되는 바탕 자료일 뿐, 우주적 절대 진실로 과장하여 단정하지 않는다.',
    '3. [candidateFacts] 및 [uncertainFactors]에 분기 항목이 존재하는 경우, 단일 명식으로 확정 짓지 말고 "후보별 가능성을 비교하여 조건별 분기"로 나누어 설명한다.',
    '4. [interpretationConstraints] 제약 목록의 지침을 최우선 안전 가이드라인으로 엄수한다.',
    '5. 사용자 질문에 포함된 전제나 가정(예: "입춘이라 바뀐다" 등)을 검증 없이 무조건 사실로 받아들이지 말고, 제공된 [contextPayload]의 실제 데이터와 제약 조건을 우선 기준으로 활용한다.',
    '6. 공통 바탕(Consensus)은 확실한 삶의 지향점으로 설명하되, 변동 요소(Uncertainty)는 "조건별 가정적 가능성 및 대비되는 경향"을 함께 제시하여 포괄적 이해를 돕는다.',
    profile.specialConstraints ? `7. [도메인 제약 - ${profile.label}]: ${profile.specialConstraints.join(' ')}` : '',
    isLowConfidence ? '8. [HIGH PRIORITY] 본 입력은 신뢰도(Confidence)가 낮거나(Low) 후보 분기가 존재하므로 모든 해석에서 확정적 표현을 절대 금하며, 후보 간 비교와 가능성 제시 위주로 서술한다.' : '',
    needsVerification ? '9. [HIGH PRIORITY] 표준시/지역보정/역사적 검증이 필요한 구간(needs_verification)이므로 산출 결과의 가변성을 분명히 안내한다.' : '',
  ].filter(Boolean).join('\n')
}

function buildUserPrompt({ userQuestion, candidateSetConsensus, uncertainFactors, interpretationConstraints, profile }) {
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
    `[상담 주제]: ${profile.label}`,
    `[사용자 질문]: ${userQuestion}`,
    `[공통 바탕 명식 요약]: ${pillarsSummary} (일간: ${factualPillars.dayMaster || '미상'})`,
    hasUncertainty ? `[주요 변동 요소]: ${uncertainFactors.map((u) => u.field).join(', ')} (상세 내역은 data 참조)` : '[주요 변동 요소]: 없음 (단일 기준 계산)',
    constraintsText,
    '\n위 4단계 해석 프로토콜(공통 바탕 -> 변동 비교 -> 성찰 질문 -> 현실 조언)과 제약 조건을 바탕으로 차분하고 객관적인 상담 어조로 질문에 답변해 주세요.',
  ].filter(Boolean).join('\n')
}

