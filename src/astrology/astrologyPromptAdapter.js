/**
 * astrologyPromptAdapter.js
 *
 * 서양 점성학(Western Astrology) 4단계 프로토콜 프롬프트 페이로드 및 Safety Guardrail 산출 모듈
 */

export function buildAstrologyPromptPayload(interpCtx = {}, domainProfile = 'personality') {
  const subjectName = interpCtx.subjectName || '내담자'
  const confidence = interpCtx.calculationConfidence?.stateContract?.confidence || 'high'
  const isLowConfidence = confidence === 'low'

  const consensus = interpCtx.candidateSetConsensus || { factual: {}, interpretiveAgreement: {} }
  const factual = consensus.factual || {}
  const interpretive = consensus.interpretiveAgreement || {}

  // 1. System Prompt & Safety Guardrails
  const systemPrompt = `
[시스템 역할: 서양 점성학(Western Astrology) 전문 상담 및 성찰 어댑터]
당신은 서양 점성학의 행성, 별자리, 하우스 및 각(Aspect) 상징을 바탕으로 내담자의 자기 이해와 내면 성찰을 돕는 주체적 대화 가이드입니다.

[CRITICAL SAFETY GUARDRAILS - 필수 준수 사항]
1. 상징과 사실의 분리: 행성, 하우스, Aspect는 심리적·상징적 해석 체계이며, 객관적 사건 발생이나 미래 성격의 절대적 확정 증거로 다루지 마십시오.
2. 결정론적 예언 금지: 토성(Saturn), 명왕성(Pluto), 8/12하우스, 행성 역행(Retrograde), 스퀘어/오퍼지션 각도를 '불행', '재앙', '시련', '숨겨진 상처'로 단정 짓지 마십시오.
3. 성장의 과제 전환: 모든 하드 아스펙트 및 중성적 요소는 내담자가 삶에서 경험하고 발전시킬 수 있는 내면의 역동이자 성장 과제로 건설적으로 서술하십시오.
4. 불확실성 전파: 출생시각/장소 미상으로 신뢰도가 낮은 경우 특정 하우스나 상승궁(ASC)을 단정하지 말고, 공통 상징을 중심으로 가이드를 제공하십시오.
`.trim()

  // 2. Astrology Context Snapshot
  const astrologyContextSnapshot = {
    subjectName,
    ruleSetVersion: interpCtx.chartSystem?.ruleSetVersion || 'western_tropical_placidus_v1',
    confidence,
    factualSigns: {
      sunSign: factual.sunSign || 'unknown',
      moonSign: factual.moonSign || 'unknown',
      ascendant: factual.ascendant || 'unknown',
      mc: factual.mc || 'unknown',
    },
    dominantElements: interpretive.dominantElements || {},
    dominantModalities: interpretive.dominantModalities || {},
    majorPatterns: interpretive.majorPatterns || [],
    houseAxes: interpretive.houseAxes || [],
    uncertainFactors: interpCtx.uncertainFactors || [],
  }

  // 3. Domain Instruction
  const domainInstructionMap = {
    personality: `[도메인: 기질 및 자아 표현 (Personality)] 태양, 달, 상승궁(ASC) 및 원소/양태 분포를 중심으로 내담자의 주체적 자아 표현 방식을 비춥니다.`,
    career: `[도메인: 커리어 및 사회적 역할 (Career)] MC, 10하우스, 토성 및 흙 원소 경향성을 바탕으로 사회적 역할 및 직업적 발현 구조를 탐색합니다.`,
    relationship: `[도메인: 관계 및 대인 상호작용 (Relationship)] 금성, 화성, 7하우스 및 1H-7H 축 배치를 중심으로 관계 속의 안정감과 조화를 조명합니다.`,
    timing: `[도메인: 시기적 흐름 및 준비 (Timing)] 트랜짓/진행 흐름을 미래 예언이 아닌 시기적 과제와 주체적 선택의 준비 관점으로 가이드합니다.`,
  }

  const domainInstruction = domainInstructionMap[domainProfile] || domainInstructionMap.personality

  // 4. Interactive Question Guide
  let interactiveQuestionGuide = `[대화형 성찰 질문 Guide] 내담자가 자신의 삶의 경험과 연결하여 스스로 성찰할 수 있도록 질문을 던집니다.`
  if (isLowConfidence) {
    interactiveQuestionGuide += ` (주의: 출생시각 미상 불확실성이 존재하므로, 후보별 상징 차이를 내담자의 실제 경험에 비추어 질문하십시오.)`
  }

  return {
    systemPrompt,
    astrologyContextSnapshot,
    domainInstruction,
    interactiveQuestionGuide,
  }
}
