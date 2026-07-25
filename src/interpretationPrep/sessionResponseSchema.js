/**
 * sessionResponseSchema.js
 *
 * LLM 상담 응답 데이터를 UI 컴포넌트(요약 카드, 3대 렌즈 탭, 통합 시너지, 성찰 질문)에서
 * 직접 직관적으로 바인딩할 수 있도록 구조화하는 출력 계약(Session Response Schema) 모듈
 */

export function createStructuredSessionResponse({
  sessionId = `session-${Date.now()}`,
  topic = 'general',
  confidenceSummary = 'high',
  statusType = 'complete',
  warnings = [],
  summary = {},
  perspectives = {},
  synthesis = {},
  reflectionQuestions = [],
  practicalSuggestions = [],
} = {}) {
  return {
    metadata: {
      sessionId,
      createdAt: new Date().toISOString(),
      topic,
      confidenceSummary,
    },
    status: {
      type: statusType, // 'complete' | 'partial' | 'insufficient_data'
      warnings,
    },
    summary: {
      title: summary.title || '성찰과 자기 이해의 여정',
      coreMessage: summary.coreMessage || '세 관점이 다차원적으로 당신의 삶의 주제를 비추고 있습니다.',
    },
    perspectives: {
      saju: {
        label: perspectives.saju?.label || '사주 렌즈 (내면 오행 기질)',
        insight: perspectives.saju?.insight || '내면의 에너지 및 생극제화 흐름',
        evidence: perspectives.saju?.evidence || [],
      },
      ziwei: {
        label: perspectives.ziwei?.label || '자미두수 렌즈 (대외 환경·관계)',
        insight: perspectives.ziwei?.insight || '사회적 무대 및 인연 관계망',
        evidence: perspectives.ziwei?.evidence || [],
      },
      astrology: {
        label: perspectives.astrology?.label || '서양점성학 렌즈 (원형적 심리·시간선)',
        insight: perspectives.astrology?.insight || '원형적 심리 상징 및 의식 여정',
        evidence: perspectives.astrology?.evidence || [],
      },
    },
    synthesis: {
      sharedThemes: synthesis.sharedThemes || [],
      differentPerspectives: synthesis.differentPerspectives || [],
    },
    reflectionQuestions: reflectionQuestions.length > 0
      ? reflectionQuestions
      : ['최근 자신의 경험 속에서 어떤 느낌이나 패턴을 발견하셨나요?'],
    practicalSuggestions: practicalSuggestions.length > 0
      ? practicalSuggestions
      : ['스스로의 내면 기질과 대외 환경의 조화를 관찰해보세요.'],
  }
}

export function validateSessionResponseSchema(responseObj = {}) {
  const errors = []

  if (!responseObj.metadata || !responseObj.metadata.sessionId) {
    errors.push('metadata field or sessionId is missing.')
  }

  if (!responseObj.status || !responseObj.status.type) {
    errors.push('status field or status.type is missing.')
  }

  if (!responseObj.summary || !responseObj.summary.title || !responseObj.summary.coreMessage) {
    errors.push('summary field (title, coreMessage) is missing or incomplete.')
  }

  if (!responseObj.perspectives || !responseObj.perspectives.saju || !responseObj.perspectives.ziwei || !responseObj.perspectives.astrology) {
    errors.push('perspectives field (saju, ziwei, astrology) is missing.')
  }

  if (!responseObj.synthesis || !Array.isArray(responseObj.synthesis.sharedThemes)) {
    errors.push('synthesis field or sharedThemes array is missing.')
  }

  if (!Array.isArray(responseObj.reflectionQuestions) || responseObj.reflectionQuestions.length === 0) {
    errors.push('reflectionQuestions array is empty or missing.')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

