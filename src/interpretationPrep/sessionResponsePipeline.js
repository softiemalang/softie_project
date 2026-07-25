/**
 * sessionResponsePipeline.js
 *
 * LLM 출력 텍스트(자연어 마크다운 또는 JSON)를 수신하여
 * UI가 100% 안전하게 바인딩할 수 있는 Session Response Schema 규격으로 변환 및 폴백 처리하는 파이프라인
 */

import { createStructuredSessionResponse, validateSessionResponseSchema } from './sessionResponseSchema.js'

export function transformRawLlmResponseToSchema(rawLlmOutput = '', sessionContext = {}) {
  const { sessionState = {}, unifiedContext = {} } = sessionContext
  const subjectName = sessionContext.subjectName || unifiedContext.subjectName || '내담자'

  let parsedObj = null

  // 1. Try parsing JSON
  try {
    const jsonMatch = rawLlmOutput.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      parsedObj = JSON.parse(jsonMatch[0])
    }
  } catch (err) {
    // Non-JSON format, proceed to fallback parser
  }

  // 2. If valid schema object exists, use it
  if (parsedObj) {
    const validation = validateSessionResponseSchema(parsedObj)
    if (validation.valid) {
      return parsedObj
    }
  }

  // 3. Fallback Parser for Natural Language Text
  const sajuFactual = unifiedContext.sajuContext?.candidateSetConsensus?.factual || {}
  const ziweiFactual = unifiedContext.ziweiContext?.candidateSetConsensus?.factual || {}
  const astrologyFactual = unifiedContext.astrologyContext?.astrologyContextSnapshot?.factualSigns || {}

  const fallbackTitle = `[${(sessionState.currentTopic?.primary || '통합').toUpperCase()}] 함께 살펴본 3-System 관점`
  const fallbackMessage = rawLlmOutput.slice(0, 200) || `${subjectName}님의 고민에 대한 3대 점술 체계의 입체적 조망입니다.`

  return createStructuredSessionResponse({
    sessionId: sessionState.sessionId || `session-${Date.now()}`,
    topic: sessionState.currentTopic?.primary || 'general',
    confidenceSummary: unifiedContext.unifiedConfidence?.overallConfidence || 'high',
    statusType: 'complete',
    summary: {
      title: fallbackTitle,
      coreMessage: fallbackMessage,
    },
    perspectives: {
      saju: {
        label: '사주 렌즈 (내면 오행 기질)',
        insight: sajuFactual.dayMaster
          ? `일간 ${sajuFactual.dayMaster} 중심의 내면 오행 기질과 수양 역량을 나타냅니다.`
          : '사주는 내면의 오행 축적과 에너지 조화에 주목합니다.',
        evidence: [sajuFactual.dayMaster ? `일간 ${sajuFactual.dayMaster} 오행 생극제화` : '일간 중심 내부 기질'],
      },
      ziwei: {
        label: '자미두수 렌즈 (대외 환경·관계)',
        insight: ziweiFactual.mingGongBranch
          ? `${ziweiFactual.mingGongBranch}宮 명궁 중심의 사회적 관계망과 대외 무대 흐름을 보여줍니다.`
          : '자미두수는 삼방사정 중심의 환경적 표현에 주목합니다.',
        evidence: [ziweiFactual.mingGongBranch ? `${ziweiFactual.mingGongBranch}宮 삼방사정 배치` : '명궁 삼방사정 체계'],
      },
      astrology: {
        label: '서양점성학 렌즈 (원형적 심리·시간선)',
        insight: astrologyFactual.sunSign
          ? `${astrologyFactual.sunSign} 태양 및 상승궁 중심의 심리 원형과 발전 여정을 비춥니다.`
          : '점성학은 원형적 심리 역동과 상징적 시간선에 주목합니다.',
        evidence: [
          astrologyFactual.sunSign ? `Sun in ${astrologyFactual.sunSign}` : '태양/달/상승궁 원형',
          astrologyFactual.ascendantSign ? `Ascendant in ${astrologyFactual.ascendantSign}` : 'ASC 하우스 축',
        ],
      },
    },
    synthesis: {
      sharedThemes: [
        {
          theme: '주체적 역량 발휘와 삶의 방향',
          description: '세 체계는 사주의 내면 동력, 자미두수의 환경 무대, 점성학의 심리 원형이라는 다른 층위에서 같은 주제를 보여줍니다.',
        },
      ],
      differentPerspectives: [
        '사주는 내면 오행, 자미두수는 사회적 인연망, 점성학은 심리적 상징 시간선을 입체적으로 비춥니다.',
      ],
    },
    reflectionQuestions: [
      '최근 자신의 경험 속에서 세 관점 중 가장 공감되는 모습이 있으셨나요?',
      '실제 삶에서 주변 환경과의 관계를 어떻게 조화시키고 계신가요?',
    ],
    practicalSuggestions: [
      '내면 기질과 대외 환경의 결이 맞는 방향으로 작은 실천을 시도해보세요.',
    ],
  })
}
