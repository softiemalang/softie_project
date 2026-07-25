/**
 * interpretationSession.js
 *
 * 내담자의 질문, 대화 맥락 상태(Session Context State),
 * 3-System Unified Interpretation Context를 결합하는 세션 오케스트레이션 모듈
 */

import { analyzeQuestionTopic } from './topicRouter.js'
import { createUnifiedInterpretationContext } from './unifiedInterpretationContext.js'

export function createInterpretationSession({
  sessionId = `session-${Date.now()}`,
  userQuestion = '',
  sajuContext = {},
  ziweiContext = {},
  astrologyContext = {},
  sessionHistory = {},
} = {}) {
  // 1. Analyze topic & intent
  const topicAnalysis = analyzeQuestionTopic(userQuestion)

  // 2. Build 3-System Unified Context
  const unifiedContext = createUnifiedInterpretationContext(sajuContext, ziweiContext, astrologyContext)

  // 3. Construct Conversational Session State
  const sessionState = {
    sessionId,
    currentQuestion: userQuestion,
    topicAnalysis,
    userIntent: topicAnalysis.intent,
    currentTopic: topicAnalysis.topic,
    lensPriority: topicAnalysis.lensPriority,
    previousInsights: sessionHistory.previousInsights || [],
    userProvidedContext: sessionHistory.userProvidedContext || [],
    followUpQuestions: sessionHistory.followUpQuestions || [],
  }

  return {
    sessionState,
    unifiedContext,
  }
}

export function continueSession({ currentSession = {}, userResponse = '' } = {}) {
  const { sessionState = {}, unifiedContext = {} } = currentSession
  const prevInsights = sessionState.previousInsights || []
  const prevUserCtx = sessionState.userProvidedContext || []

  // Accumulate previous turn summary into insights
  const newInsights = [
    ...prevInsights,
    {
      turn: prevInsights.length + 1,
      question: sessionState.currentQuestion,
      intent: sessionState.userIntent,
    },
  ]

  const newUserCtx = userResponse.trim()
    ? [...prevUserCtx, userResponse.trim()]
    : prevUserCtx

  const nextSessionState = {
    ...sessionState,
    previousInsights: newInsights,
    userProvidedContext: newUserCtx,
  }

  return {
    sessionState: nextSessionState,
    unifiedContext,
  }
}

