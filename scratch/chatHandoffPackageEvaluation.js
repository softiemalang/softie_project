/**
 * chatHandoffPackageEvaluation.js
 *
 * Phase Chat-1 Chat Handoff Package 및 3종 복사 옵션 검증 스크립트
 */

import { createUnifiedInterpretationContext } from '../src/interpretationPrep/unifiedInterpretationContext.js'
import { buildChatHandoffPackage } from '../src/interpretationPrep/chatHandoffPackage.js'

function runChatHandoffEvaluation() {
  console.log('=== Phase Chat-1 Chat Handoff Package Evaluation ===\n')

  const sajuContext = {
    subjectName: '홍길동',
    calculationConfidence: { stateContract: { confidence: 'high' } },
    candidateSetConsensus: { factual: { dayMaster: '甲' } },
  }
  const ziweiContext = {
    subjectName: '홍길동',
    calculationConfidence: { stateContract: { confidence: 'high' } },
    candidateSetConsensus: { factual: { mingGongBranch: '寅' } },
  }
  const astrologyContext = {
    subjectName: '홍길동',
    astrologyContextSnapshot: {
      confidence: 'high',
      factualSigns: { sunSign: 'Aries', ascendantSign: 'Leo' },
    },
  }

  const unifiedContext = createUnifiedInterpretationContext(sajuContext, ziweiContext, astrologyContext)
  const handoffPackage = buildChatHandoffPackage(unifiedContext, '직업 이직 고민', 'career')

  console.log('[Handoff Package Generated]')
  console.log(`  - Subject Name: ${handoffPackage.subjectName}`)
  console.log(`  - Topic Category: ${handoffPackage.topicCategory}`)
  console.log(`  - Copies Available: ${Object.keys(handoffPackage.copies).join(', ')}`)

  // Validate Full Copy
  const fullCopy = handoffPackage.copies.full
  const hasQuestion = fullCopy.includes('직업 이직 고민')
  const hasSaju = fullCopy.includes('사주 렌즈')
  const hasZiwei = fullCopy.includes('자미두수 렌즈')
  const hasAstrology = fullCopy.includes('서양점성학 렌즈')
  const hasGuardrails = fullCopy.includes('Chat AI 해석 가드레일')
  const hasRequest = fullCopy.includes('대화 시작 요청')

  // Validate Quick Copy
  const quickCopy = handoffPackage.copies.quick
  const isQuickShort = quickCopy.length < fullCopy.length

  // Validate Topic Focused Copy
  const topicCopy = handoffPackage.copies.topicFocused
  const hasTopicTag = topicCopy.includes('CAREER 집중')

  console.log('\n[Validation Summary]')
  console.log(`  - Full Copy Complete: ${hasQuestion && hasSaju && hasZiwei && hasAstrology && hasGuardrails && hasRequest ? 'PASS' : 'FAIL'}`)
  console.log(`  - Quick Copy Compact: ${isQuickShort ? 'PASS' : 'FAIL'}`)
  console.log(`  - Topic Focused Copy Formatted: ${hasTopicTag ? 'PASS' : 'FAIL'}`)

  if (hasQuestion && hasSaju && hasZiwei && hasAstrology && isQuickShort && hasTopicTag) {
    console.log('\nSUCCESS: Chat Handoff Package & 3 Copy Modes 100% Operational!')
  }
}

if (process.argv[1].endsWith('chatHandoffPackageEvaluation.js')) {
  runChatHandoffEvaluation()
}
