/**
 * userInsightMemoryEvaluation.js
 *
 * Phase UX-4 User Insight Profile Memory & Session Pipeline 검증 스크립트
 */

import { createEmptyUserInsightProfile, extractUserInsights, clearUserInsightProfile } from '../src/interpretationPrep/userInsightMemory.js'
import { transformRawLlmResponseToSchema } from '../src/interpretationPrep/sessionResponsePipeline.js'
import { validateSessionResponseSchema } from '../src/interpretationPrep/sessionResponseSchema.js'

function runInsightMemoryEvaluation() {
  console.log('=== Phase UX-4 User Insight Profile Memory & Pipeline Evaluation ===\n')

  // 1. Initial Empty Profile
  const profile0 = createEmptyUserInsightProfile('홍길동')
  console.log('[1. Initial Profile Created]')
  console.log(`  - Subject Name: ${profile0.subjectName}`)
  console.log(`  - Initial Insights Count: ${Object.values(profile0.insights).flat().length}`)

  // 2. Extract Insights from Conversation Context
  const userFeedbackList = [
    '실제로 주변에서 나에게 고민 상담이나 직업 조언을 구해오는 경우가 많아요.',
    '사람들과 친해질 때는 천천히 관찰하며 깊은 관계를 형성하는 편이에요.',
    '자율성이 보장되는 환경에서 일할 때 가장 만족감이 높아요.',
  ]

  const profile1 = extractUserInsights(userFeedbackList, profile0)

  console.log('\n[2. Extracted User Insight Profile]')
  console.log('  - Relationship Patterns:', profile1.insights.relationshipPattern)
  console.log('  - Career Preferences:', profile1.insights.careerPreference)
  console.log('  - Core Values:', profile1.insights.coreValues)

  const hasRelationship = profile1.insights.relationshipPattern.length > 0
  const hasCareer = profile1.insights.careerPreference.length > 0

  // 3. Clear Profile Support
  const profileCleared = clearUserInsightProfile('홍길동')
  const isCleared = Object.values(profileCleared.insights).flat().length === 0

  // 4. Session Response Pipeline Fallback Test
  const mockRawLlmText = '사주와 자미두수와 서양점성학 3대 체계가 내담자님의 주체적 표현 역량을 조명하고 있습니다.'
  const transformedSchema = transformRawLlmResponseToSchema(mockRawLlmText, { subjectName: '홍길동' })
  const schemaValidation = validateSessionResponseSchema(transformedSchema)

  console.log('\n[3. Pipeline Transformation Test]')
  console.log(`  - Schema Validation Result: ${schemaValidation.valid ? 'VALID' : 'INVALID'}`)
  console.log(`  - Transformed Title: "${transformedSchema.summary.title}"`)

  console.log('\n[Validation Summary]')
  console.log(`  - User Insight Extraction: ${hasRelationship && hasCareer ? 'PASS' : 'FAIL'}`)
  console.log(`  - User Profile Clearance Control: ${isCleared ? 'PASS' : 'FAIL'}`)
  console.log(`  - Session Pipeline Fallback: ${schemaValidation.valid ? 'PASS' : 'FAIL'}`)

  if (hasRelationship && hasCareer && isCleared && schemaValidation.valid) {
    console.log('\nSUCCESS: User Insight Memory & Session Response Pipeline 100% Operational!')
  }
}

if (process.argv[1].endsWith('userInsightMemoryEvaluation.js')) {
  runInsightMemoryEvaluation()
}
