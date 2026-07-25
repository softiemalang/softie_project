/**
 * unifiedPromptAdapter.js
 *
 * UnifiedInterpretationContext를 받아 사주+자미두수 통합 AI/LLM 프롬프트 페이로드를 생성하는 모듈
 */

export const UNIFIED_SAFETY_GUARDRAILS = [
  '사주와 자미두수 두 체계의 해석을 단일한 결론으로 억지 합산하거나 특정 체계의 결과를 우위로 단정하지 마십시오.',
  '사주는 내면적 기질과 오행 흐름의 관점으로, 자미두수는 삼방사정 궁위 관계와 환경적 표현 관점으로 입체적 서술하십시오.',
  '불확실성 요소(윤달, 시간 경계, 절기 경계)가 존재할 경우 특정 명반을 확정하지 말고 후보군 비교 안내를 유지하십시오.',
  '내담자의 자율성과 환경 맥락을 존중하며 현실적인 선택을 돕는 대화형 가이드를 제공하십시오.',
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
  } = unifiedContext

  const overallConfidence = unifiedConfidence.overallConfidence || 'high'
  const isLowConfidence = overallConfidence === 'low' || overallConfidence === 'medium'

  const systemPromptLines = [
    `# [사주 + 자미두수 통합 AI 해석 가이드 - ${subjectName}님]`,
    '',
    '## Step 1: 각 체계별 독립 관점 설명',
    `- 사주 관점: 내면의 기질, 오행 및 십성 에너지 흐름 중심`,
    `- 자미두수 관점: 명궁 중심의 삼방사정(三方四正) 환경 및 인간관계 네트워크 중심`,
    '',
    '## Step 2: 공통 테마와 입체적 관점 차이',
    `- 체계 간 일치도 수준: ${systemAgreement.agreementLevel} (${systemAgreement.note})`,
    `- 공통 강조 테마: ${sharedThemes.map((t) => t.label).join(', ')}`,
    `- 관점 차이 및 상후 보완: ${differentPerspectives.map((p) => p.description).join(' / ')}`,
    '',
    '## Step 3: 통합 안전 지침 (Safety & Guardrails)',
    ...UNIFIED_SAFETY_GUARDRAILS.map((g) => `- ${g}`),
    isLowConfidence
      ? `- [주의] 사주/자미두수 중 불확실 요소가 포함되어 있으므로 미래 단정적 예언을 절대 금하고 후보 비교 안내를 유지하십시오.`
      : '',
    '',
    '## Step 4: 대화형 가이드 및 현실적 적용 제안',
    `- 질문 도메인: ${domainProfile}`,
    `- 내담자가 두 명리 체계의 시각을 균형 있게 참고하여 스스로 방향을 탐색할 수 있도록 따뜻하고 명확한 대화를 이끌어주십시오.`,
  ]

  const contextPayload = {
    subjectName,
    overallConfidence,
    systemAgreement,
    sharedThemes,
    differentPerspectives,
    sajuConfidence: unifiedConfidence.sajuConfidence,
    ziweiConfidence: unifiedConfidence.ziweiConfidence,
  }

  return {
    systemPrompt: systemPromptLines.filter(Boolean).join('\n'),
    contextPayload,
  }
}
