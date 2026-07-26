/**
 * LAB ONLY — not imported by InterpretationPrepPage.
 *
 * Preserved fallback parser. It must never fabricate a perspective for an
 * unavailable system or report a complete response without calculation data.
 */

import { createStructuredSessionResponse, validateSessionResponseSchema } from './sessionResponseSchema.js'

export function transformRawLlmResponseToSchema(rawLlmOutput = '', sessionContext = {}) {
  const { sessionState = {}, unifiedContext = {} } = sessionContext
  const subjectName = sessionContext.subjectName || unifiedContext.subjectName || '내담자'

  let parsedObj = null
  try {
    const jsonMatch = rawLlmOutput.match(/\{[\s\S]*\}/)
    if (jsonMatch) parsedObj = JSON.parse(jsonMatch[0])
  } catch {
    // Non-JSON format; continue with the availability-aware Lab fallback.
  }

  if (parsedObj) {
    const validation = validateSessionResponseSchema(parsedObj)
    if (validation.valid) return parsedObj
  }

  const availableSystems = unifiedContext.availableSystems || []
  const sajuFactual = unifiedContext.systems?.saju?.context?.candidateSetConsensus?.factual
    || unifiedContext.sajuContext?.candidateSetConsensus?.factual
    || {}
  const ziweiFactual = unifiedContext.systems?.ziwei?.context?.candidateSetConsensus?.factual
    || unifiedContext.ziweiContext?.candidateSetConsensus?.factual
    || {}
  const perspectives = {}

  if (availableSystems.includes('saju')) {
    perspectives.saju = {
      label: '사주 렌즈',
      insight: sajuFactual.dayMaster
        ? `일간 ${sajuFactual.dayMaster} 중심의 계산 근거를 확인합니다.`
        : '제공된 사주 계산 Context를 확인합니다.',
      evidence: sajuFactual.dayMaster ? [`일간 ${sajuFactual.dayMaster}`] : [],
    }
  }
  if (availableSystems.includes('ziwei')) {
    perspectives.ziwei = {
      label: '자미두수 렌즈 (Experimental)',
      insight: ziweiFactual.mingGongBranch
        ? `명궁 ${ziweiFactual.mingGongBranch}宮의 고정 RuleSet 계산 근거를 확인합니다.`
        : '제공된 자미두수 계산 Context를 확인합니다.',
      evidence: ziweiFactual.mingGongBranch ? [`명궁 ${ziweiFactual.mingGongBranch}宮`] : [],
    }
  }

  const fallbackTitle = `[${(sessionState.currentTopic?.primary || '통합').toUpperCase()}] 사용 가능한 계산 관점`
  const fallbackMessage = rawLlmOutput.slice(0, 200)
    || (availableSystems.length > 0
      ? `${subjectName}님의 고민을 사용 가능한 계산 근거 안에서 살펴봅니다.`
      : '사용 가능한 계산 자료가 없어 응답을 생성하지 않습니다.')

  return createStructuredSessionResponse({
    sessionId: sessionState.sessionId || `session-${Date.now()}`,
    topic: sessionState.currentTopic?.primary || 'general',
    confidenceSummary: unifiedContext.unifiedConfidence?.overallConfidence || 'not_available',
    statusType: availableSystems.length > 0 ? 'partial' : 'insufficient_data',
    warnings: unifiedContext.warnings || [],
    summary: {
      title: fallbackTitle,
      coreMessage: fallbackMessage,
    },
    perspectives,
    synthesis: {
      sharedThemes: unifiedContext.sharedThemes || [],
      differentPerspectives: unifiedContext.differentPerspectives || [],
    },
    reflectionQuestions: [
      '제공된 계산 관점 중 실제 경험과 맞닿는 부분과 다른 부분은 무엇인가요?',
    ],
    practicalSuggestions: [
      '계산 근거를 확정 판정이 아닌 자기 관찰의 출발점으로 활용해보세요.',
    ],
  })
}
