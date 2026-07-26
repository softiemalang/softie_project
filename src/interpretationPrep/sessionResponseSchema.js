/**
 * LAB ONLY — not imported by InterpretationPrepPage.
 *
 * Availability-aware response contract for the preserved Session UI assets.
 */

export function createStructuredSessionResponse({
  sessionId = `session-${Date.now()}`,
  topic = 'general',
  confidenceSummary = 'not_available',
  statusType = 'insufficient_data',
  warnings = [],
  summary = {},
  perspectives = {},
  synthesis = {},
  reflectionQuestions = [],
  practicalSuggestions = [],
} = {}) {
  const availablePerspectives = Object.fromEntries(
    Object.entries(perspectives)
      .filter(([, perspective]) => perspective?.status !== 'unavailable')
      .map(([system, perspective]) => [system, {
        label: perspective.label || system,
        insight: perspective.insight || '',
        evidence: perspective.evidence || [],
        status: perspective.status || 'available',
      }]),
  )

  return {
    metadata: {
      sessionId,
      createdAt: new Date().toISOString(),
      topic,
      confidenceSummary,
    },
    status: {
      type: statusType,
      warnings,
    },
    summary: {
      title: summary.title || '성찰과 자기 이해의 여정',
      coreMessage: summary.coreMessage || '사용 가능한 계산 관점만 분리해 살펴봅니다.',
    },
    perspectives: availablePerspectives,
    synthesis: {
      sharedThemes: synthesis.sharedThemes || [],
      differentPerspectives: synthesis.differentPerspectives || [],
    },
    reflectionQuestions: reflectionQuestions.length > 0
      ? reflectionQuestions
      : ['최근 자신의 경험 속에서 어떤 느낌이나 패턴을 발견하셨나요?'],
    practicalSuggestions: practicalSuggestions.length > 0
      ? practicalSuggestions
      : ['계산 자료를 확정 판정이 아닌 자기 관찰의 질문으로 활용해보세요.'],
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
  if (!responseObj.perspectives || typeof responseObj.perspectives !== 'object') {
    errors.push('perspectives field is missing.')
  }
  if (
    responseObj.status?.type !== 'insufficient_data'
    && Object.keys(responseObj.perspectives || {}).length === 0
  ) {
    errors.push('available perspectives are required unless status is insufficient_data.')
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

