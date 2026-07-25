/**
 * sessionConversationLoopEvaluation.js
 *
 * Phase UX-3 Session Conversation Loop & Context Memory Layer 검증 스크립트
 */

import { createInterpretationSession, continueSession } from '../src/interpretationPrep/interpretationSession.js'
import { buildSessionPromptPayload } from '../src/interpretationPrep/sessionPromptAdapter.js'

function runConversationLoopEvaluation() {
  console.log('=== Phase UX-3 Session Conversation Loop Evaluation ===\n')

  const sajuContext = { subjectName: '홍길동', candidateSetConsensus: { factual: { dayMaster: '甲' } } }
  const ziweiContext = { subjectName: '홍길동', candidateSetConsensus: { factual: { mingGongBranch: '寅' } } }
  const astrologyContext = { subjectName: '홍길동', astrologyContextSnapshot: { factualSigns: { sunSign: 'Aries' } } }

  // Turn 1: Initial Question
  const turn1Session = createInterpretationSession({
    userQuestion: '직업 적성과 커리어 방향에 대해 고민이에요.',
    sajuContext,
    ziweiContext,
    astrologyContext,
  })

  console.log('[Turn 1 Initial State]')
  console.log(`  - Question: "${turn1Session.sessionState.currentQuestion}"`)
  console.log(`  - Primary Lenses: [${turn1Session.sessionState.lensPriority.primary.join(', ')}]`)
  console.log(`  - User Provided Context Length: ${turn1Session.sessionState.userProvidedContext.length}`)

  // Turn 2: User responds to Reflection Question
  const turn2UserResponse = '실제로 주변에서 나에게 고민 상담이나 직업 조언을 구해오는 경우가 많아요.'
  const turn2Session = continueSession({
    currentSession: turn1Session,
    userResponse: turn2UserResponse,
  })

  const turn2Payload = buildSessionPromptPayload(turn2Session)

  console.log('\n[Turn 2 Continued State]')
  console.log(`  - Accumulated Insights Count: ${turn2Session.sessionState.previousInsights.length}`)
  console.log(`  - Latest User Context: "${turn2Session.sessionState.userProvidedContext[0]}"`)

  const hasContextSaved = turn2Session.sessionState.userProvidedContext.includes(turn2UserResponse)
  const hasPreviousInsightsSaved = turn2Session.sessionState.previousInsights.length === 1

  console.log('\n[Validation Result]')
  console.log(`  - Context Memory Preserved: ${hasContextSaved ? 'PASS' : 'FAIL'}`)
  console.log(`  - Previous Insights Preserved: ${hasPreviousInsightsSaved ? 'PASS' : 'FAIL'}`)

  if (hasContextSaved && hasPreviousInsightsSaved) {
    console.log('\nSUCCESS: Session Conversation Loop & Context Memory Layer operational!')
  }
}

if (process.argv[1].endsWith('sessionConversationLoopEvaluation.js')) {
  runConversationLoopEvaluation()
}
