/**
 * unifiedPromptAdapter.js
 *
 * UnifiedInterpretationContext를 받아 사주+자미두수+서양점성학 3대 체계 통합 AI/LLM 프롬프트 페이로드를 생성하는 모듈
 */

export const UNIFIED_SAFETY_GUARDRAILS = [
  '사주, 자미두수, 서양 점성학 3대 체계의 해석을 단일 결론으로 억지 합산하거나 특정 체계의 우위를 단정하지 마십시오.',
  '각 체계의 용어(사주의 오행/십신, 자미두수의 주성/궁위, 점성학의 행성/하우스)는 해당 체계 내부 의미로만 설명하십시오.',
  '서로 다른 체계의 상징을 직접 인과관계로 연결하거나, 한 체계가 다른 체계를 증명한다고 표현하지 마십시오.',
  '공통 테마는 동일한 삶의 주제에 대해 관찰되는 공통 패턴으로 설명하고, 차이점은 입체적 보완 관점으로 서술하십시오.',
  '불확실성 요소(윤달, 시간 경계, 절기 경계, 하우스 경계)가 존재할 경우 특정 결과를 단정하지 말고 불확실성을 분리 고지하십시오.',
  '운명의 결정론적 예언을 철저히 금지하며, 내담자의 성찰과 주체적 선택을 돕는 현실적 대화 가이드를 제공하십시오.',
]

export function buildUnifiedPromptPayload(unifiedContext = {}, domainProfile = 'personality') {
  const {
    subjectName = '내담자',
    systemAgreement = {},
    sharedThemes = [],
    differentPerspectives = [],
    unifiedConfidence = {},
    sajuContext = {},
    ziweiContext = {},
    astrologyContext = {},
  } = unifiedContext

  const overallConfidence = unifiedConfidence.overallConfidence || 'high'
  const isLowConfidence = overallConfidence === 'low' || overallConfidence === 'medium'

  const systemPromptLines = [
    `# [사주 + 자미두수 + 서양점성학 3대 체계 통합 AI 해석 가이드 - ${subjectName}님]`,
    '',
    '## Step 1: 3대 체계별 독립 렌즈 설명',
    `- 사주 관점: 내면의 기질, 오행 생극제화 및 십성 에너지 흐름`,
    `- 자미두수 관점: 명궁 중심의 삼방사정(三方四正) 환경 배치 및 인연 네트워크`,
    `- 서양점성학 관점: 태양·달·상승궁 및 하우스/애스펙트 중심의 심리 원형과 상징적 시간선`,
    '',
    '## Step 2: 공통 테마 (Shared Themes & Synthesis)',
    `- 체계 간 시너지 상태: ${systemAgreement.agreementLevel} (${systemAgreement.note})`,
    `- 통합 신뢰도 가이드: ${unifiedConfidence.overallGuidance || '정상 데이터'}`,
    ...sharedThemes.map(
      (t) =>
        `- 공통 테마 [${t.label}]:\n  * 사주 시각: ${t.sajuPerspective}\n  * 자미두수 시각: ${t.ziweiPerspective}\n  * 점성학 시각: ${t.astrologyPerspective || '점성학적 원형 조명'}\n  * 통합 조망(Synthesis): ${t.synthesis || '세 관점의 입체적 보완'}`
    ),
    `- 관점 차이 및 구별: ${differentPerspectives.map((p) => p.description).join(' / ')}`,
    '',
    '## Step 3: 통합 안전 및 용어 분리 지침 (Safety & Strict Term Isolation)',
    ...UNIFIED_SAFETY_GUARDRAILS.map((g) => `- ${g}`),
    isLowConfidence
      ? `- [주의] 일부 체계에 불확실 요소가 포함되어 있으므로 미래 단정적 예언을 절대 금하고 분리 고지 안내를 유지하십시오.`
      : '',
    '',
    '## Step 4: 대화형 가이드 및 현실적 적용 제안',
    `- 질문 도메인: ${domainProfile}`,
    `- 내담자가 세 점술 체계의 다차원 시각을 균형 있게 참고하여 주체적으로 삶의 방향을 탐색할 수 있도록 조율해주십시오.`,
  ]

  const contextPayload = {
    subjectName,
    overallConfidence,
    systemAgreement,
    sharedThemes,
    differentPerspectives,
    sajuConfidence: unifiedConfidence.sajuConfidence,
    ziweiConfidence: unifiedConfidence.ziweiConfidence,
    astrologyConfidence: unifiedConfidence.astrologyConfidence,
    overallGuidance: unifiedConfidence.overallGuidance,
  }

  return {
    systemPrompt: systemPromptLines.filter(Boolean).join('\n'),
    contextPayload,
  }
}

