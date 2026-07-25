/**
 * chatHandoffPrivacyEvaluation.js
 *
 * Phase Chat-2 Handoff Experience Polish & Privacy Minimal Copy 검증 스크립트
 */

import { createUnifiedInterpretationContext } from '../src/interpretationPrep/unifiedInterpretationContext.js'
import { buildChatHandoffPackage } from '../src/interpretationPrep/chatHandoffPackage.js'

function runChatHandoffPrivacyEvaluation() {
  console.log('=== Phase Chat-2 Handoff Experience Polish Evaluation ===\n')

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

  console.log('[Handoff Package 4 Copy Modes Generated]')
  console.log(`  - Full Copy Length: ${handoffPackage.characterCounts.full} chars`)
  console.log(`  - Quick Copy Length: ${handoffPackage.characterCounts.quick} chars`)
  console.log(`  - Topic Focused Copy Length: ${handoffPackage.characterCounts.topicFocused} chars`)
  console.log(`  - Privacy Minimal Copy Length: ${handoffPackage.characterCounts.privacyMinimal} chars`)

  // 1. Privacy Minimal Copy Validation (no subjectName)
  const privacyText = handoffPackage.copies.privacyMinimal
  const isAnonymized = !privacyText.includes('홍길동님') && privacyText.includes('개인정보 비공개 모드')
  const hasSchemaTag = privacyText.includes('SCHEMA v1.0')

  // 2. Character Counts Match Validation
  const fullMatch = handoffPackage.copies.full.length === handoffPackage.characterCounts.full

  console.log('\n[Validation Results]')
  console.log(`  - Privacy Anonymization: ${isAnonymized ? 'PASS' : 'FAIL'}`)
  console.log(`  - Schema Version Tagging: ${hasSchemaTag ? 'PASS' : 'FAIL'}`)
  console.log(`  - Character Count Calculation: ${fullMatch ? 'PASS' : 'FAIL'}`)

  if (isAnonymized && hasSchemaTag && fullMatch) {
    console.log('\nSUCCESS: Phase Chat-2 Handoff Experience Polish 100% Operational!')
  }
}

if (process.argv[1].endsWith('chatHandoffPrivacyEvaluation.js')) {
  runChatHandoffPrivacyEvaluation()
}
