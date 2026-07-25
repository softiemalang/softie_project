/**
 * sessionResponseSchemaEvaluation.js
 *
 * Session Response Schema 파서/검증 모듈 벤치마크 테스트 스크립트
 */

import { createStructuredSessionResponse, validateSessionResponseSchema } from '../src/interpretationPrep/sessionResponseSchema.js'
import { createInterpretationSession } from '../src/interpretationPrep/interpretationSession.js'

function runSchemaEvaluation() {
  console.log('=== Phase UX-1.5 Session Response Schema Evaluation ===\n')

  // Mock LLM Raw Data Transformation Test
  const mockSajuContext = { subjectName: '홍길동', candidateSetConsensus: { factual: { dayMaster: '甲' } } }
  const mockZiweiContext = { subjectName: '홍길동', candidateSetConsensus: { factual: { mingGongBranch: '寅' } } }
  const mockAstrologyContext = { subjectName: '홍길동', astrologyContextSnapshot: { factualSigns: { sunSign: 'Aries' } } }

  const sessionInstance = createInterpretationSession({
    userQuestion: '직업 적성에 대해 알고 싶어요.',
    sajuContext: mockSajuContext,
    ziweiContext: mockZiweiContext,
    astrologyContext: mockAstrologyContext,
  })

  const structuredOutput = createStructuredSessionResponse({
    summary: {
      title: '사회적 역할과 내면 역량의 조화',
      coreMessage: '자미두수 관록궁 중심의 대외 환경과 사주 일간 오행이 조화를 이루고 있습니다.',
    },
    perspectives: {
      saju: {
        label: '사주 렌즈',
        insight: '일간 甲 중심의 내면적 에너지와 축적된 수양 역량',
        evidence: ['일간 甲 중심 오행 흐름'],
      },
      ziwei: {
        label: '자미두수 렌즈',
        insight: '명궁 寅宮 삼방사정 중심의 사회적 직업 네트워크',
        evidence: ['명궁 寅宮 삼방사정 배치'],
      },
      astrology: {
        label: '서양점성학 렌즈',
        insight: 'Aries 태양 중심의 창의적 도전과 발전 여정',
        evidence: ['Sun in Aries'],
      },
    },
    synthesis: {
      sharedThemes: [
        {
          theme: '주체적 역량 발휘 및 직업 선택',
          description: '세 체계가 서로 다른 렌즈로 직업적 성장과 자기 표현을 비춥니다.',
        },
      ],
      differentPerspectives: [
        '사주는 내면 동력, 자미두수는 환경 무대, 점성학은 심리 원형을 보여줍니다.',
      ],
    },
    reflectionQuestions: [
      '최근 직업이나 일을 하면서 가장 보람을 느꼈던 경험은 무엇이었나요?',
    ],
    practicalSuggestions: [
      '자신의 내면 기질과 잘 맞는 대외 파트너십 기회를 적극 활용해보세요.',
    ],
  })

  const validation = validateSessionResponseSchema(structuredOutput)

  console.log(`[Schema Validation] Result: ${validation.valid ? 'VALID' : 'INVALID'}`)
  if (!validation.valid) {
    console.log('Errors:', validation.errors)
  } else {
    console.log('Structured Output Snapshot:')
    console.log(JSON.stringify(structuredOutput, null, 2))
  }
}

if (process.argv[1].endsWith('sessionResponseSchemaEvaluation.js')) {
  runSchemaEvaluation()
}
