/**
 * ziweiPromptAdapter.js
 *
 * ZiweiInterpretationContext를 받아 AI/LLM용 안전한 Prompt Payload를 생성하는 어댑터 모듈
 */

export const ZIWEI_SAFETY_GUARDRAILS = [
  '특정 성좌(칠살, 파군 등)나 사화(화기)를 성격 결함, 불행, 결정론적 재앙으로 단정하지 마십시오.',
  '길성과 살성을 절대적인 좋음/나쁨으로 이분법적 판단하지 말고 성향과 주의할 에너지 관점으로 서술하십시오.',
  '현재 계산 규칙 기준 생성된 후보 명반 집합 내 공통 구조와 삼방사정 궁위 관계를 중심으로 통합 설명하십시오.',
  '미래의 이벤트를 일방적으로 예언하지 말고 내담자의 자율성과 환경 맥락을 존중하는 대화형 가이드를 제공하십시오.',
]

export function buildZiweiPromptPayload(ziweiInterpretationContext = {}, domainProfile = 'personality') {
  const {
    subjectName = '내담자',
    palaceContexts = {},
    interpretivePatterns = {},
    candidateSetConsensus = {},
    uncertainFactors = [],
    calculationConfidence = {},
    interpretationWarnings = [],
  } = ziweiInterpretationContext

  const confidenceState = calculationConfidence.stateContract?.confidence || 'high'
  const isLowConfidence = confidenceState === 'low'

  // 1. 도메인 프로필별 집중 궁위 파악
  let patternKey = 'careerPattern'
  if (domainProfile === 'relationship') patternKey = 'relationshipPattern'
  if (domainProfile === 'wealth') patternKey = 'wealthPattern'

  const pattern = interpretivePatterns[patternKey] || interpretivePatterns['careerPattern']
  const primaryPalaceId = pattern?.primaryPalaceId || 'life'
  const primaryContext = palaceContexts[primaryPalaceId] || {}

  // 2. 4단계 Protocol 프롬프트 구축
  const systemPromptLines = [
    `# [자미두수 AI 해석 가이드 - ${subjectName}님]`,
    '',
    '## 1단계: Consensus (후보 명반 집합 내 공통 구조 서술)',
    `- 현재 계산 규칙 기준 생성된 후보 명반 집합에서 공통으로 확인되는 지지 구조:`,
    `  * 명궁: ${candidateSetConsensus.factual?.mingGongBranch || '미정'}宮, 신궁: ${candidateSetConsensus.factual?.shenGongBranch || '미정'}宮, 오행국: ${candidateSetConsensus.factual?.fiveElementsBureau || '미정'}`,
    '',
    '## 2단계: Variance & Candidates (불확실성 및 후보 안내)',
    isLowConfidence
      ? `- 현재 출생조건(윤달/시간 경계 등)으로 인해 복수의 명반 후보가 존재합니다. 단정적 해석을 금하고 후보별 차이를 투명하게 설명하십시오.`
      : `- 현재 조건은 단일 정격 명반으로 안정적인 삼방사정 분석이 가능합니다.`,
    '',
    '## 3단계: Safety & Guardrails (안전 지침)',
    ...ZIWEI_SAFETY_GUARDRAILS.map((g) => `- ${g}`),
    '',
    '## 4단계: Domain Focus & 삼방사정(三方四正) 관계 구조',
    `- 도메인 주제: ${domainProfile}`,
    `- 주 집중 궁위: ${primaryContext.palaceName || '명궁'}(${primaryContext.branch || ''}宮)`,
    `- 대궁(Opposite): ${primaryContext.relationship?.opposite?.palaceName || '미정'}(${primaryContext.relationship?.opposite?.branch || ''}宮)`,
    `- 삼방(Trine): ${primaryContext.relationship?.trine?.palaces?.map((p) => `${p.palaceName}(${p.branch}宮)`).join(', ') || '미정'}`,
  ]

  const contextPayload = {
    subjectName,
    confidenceState,
    isLowConfidence,
    interpretationFocus: {
      primaryPalace: primaryPalaceId,
      relatedPalaces: pattern?.relatedPalaceIds || [],
      relationTypes: ['trine', 'opposite'],
    },
    primaryPalaceContext: primaryContext,
    candidateConsensus: candidateSetConsensus,
    uncertainFactors,
    warnings: interpretationWarnings,
  }

  return {
    systemPrompt: systemPromptLines.join('\n'),
    contextPayload,
  }
}
