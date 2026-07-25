import test from 'node:test'
import assert from 'node:assert/strict'
import { buildChatHandoffPackage } from '../src/interpretationPrep/chatHandoffPackage.js'
import { createUnifiedInterpretationContext } from '../src/interpretationPrep/unifiedInterpretationContext.js'

test('chat handoff includes only supported saju facts and excludes invented system values', () => {
  const unifiedContext = createUnifiedInterpretationContext(
    {
      subjectName: '테스트',
      candidateSetConsensus: {
        factual: {
          yearPillar: '정축',
          monthPillar: '갑진',
          dayPillar: '계사',
          hourPillar: '기미',
          dayMaster: '계',
        },
      },
      calculationConfidence: {
        stateContract: { confidence: 'high' },
      },
      interpretationWarnings: ['실험적 판정은 확정하지 않습니다.'],
    },
    { status: 'needs_profile', raw: null },
    { status: 'unsupported', raw: null },
  )

  const pkg = buildChatHandoffPackage(unifiedContext, '현재 흐름이 궁금해요.', 'timing')

  assert.deepEqual(unifiedContext.availableSystems, ['saju'])
  assert.equal(unifiedContext.systemAgreement.agreementLevel, 'single_system_only')
  assert.equal(unifiedContext.sharedThemes.length, 0)
  assert.match(pkg.copies.full, /사주 계산 기반 AI 해석 요청 자료/)
  assert.match(pkg.copies.full, /정축 · 월주 갑진 · 일주 계사 · 시주 기미/)
  assert.match(pkg.copies.full, /자미두수·서양 점성학 값을 추정하거나 새로 만들어내지 마십시오/)
  assert.doesNotMatch(pkg.copies.full, /명궁 .*미상/)
  assert.doesNotMatch(pkg.copies.full, /Sun in 미상/)
  assert.doesNotMatch(pkg.copies.quick, /3대 체계/)
})
