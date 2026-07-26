import test from 'node:test'
import assert from 'node:assert/strict'
import { buildChatHandoffPackage } from '../src/interpretationPrep/chatHandoffPackage.js'
import { prepareThreeSystemInterpretationData } from '../src/interpretationPrep/threeSystemPrepPipeline.js'

const INPUT = {
  subjectName: '한규',
  birthDate: '1997-04-21',
  birthTime: '14:40',
  targetDate: '2026-07-26',
  placeName: '대한민국',
  referenceCity: 'seoul',
  timezone: 'Asia/Seoul',
  latitude: '37.57',
  longitude: '126.97',
  gender: 'male',
  calendar: 'solar',
  isLeapMonth: false,
  timeAccuracy: 'exact',
}

function build(topicCategory, userQuestion = '현재 흐름이 궁금해요.') {
  const prepared = prepareThreeSystemInterpretationData(INPUT)
  return {
    prepared,
    pkg: buildChatHandoffPackage({
      result: prepared.result,
      unifiedContext: prepared.unifiedContext,
      userQuestion,
      topicCategory,
    }),
  }
}

test('full handoff preserves detailed saju and experimental ziwei evidence while blocking astrology simulation', () => {
  const { prepared, pkg } = build('timing')
  const full = pkg.copies.full

  assert.deepEqual(prepared.unifiedContext.availableSystems, ['saju', 'ziwei'])
  assert.equal(prepared.unifiedContext.systemType, 'unified_2system')
  assert.match(full, /연주 정축 · 월주 갑진 · 일주 계사 · 시주 기미/)
  assert.match(full, /오행 표면 분포/)
  assert.match(full, /십성 표면 분포/)
  assert.match(full, /천간 관계/)
  assert.match(full, /지지 관계/)
  assert.match(full, /Candidate Set Consensus/)
  assert.match(full, /대운 배열/)
  assert.match(full, /세운 병오/)
  assert.match(full, /월운 을미/)
  assert.match(full, /일진 신축/)
  assert.match(full, /\[Experimental · low\] 강약/)
  assert.match(full, /자미두수 · 고정 RuleSet 기반 실험적 계산/)
  assert.match(full, /14주성/)
  assert.match(full, /12궁 및 삼방사정/)
  assert.match(full, /needs_external_verification/)
  assert.match(full, /서양 점성학 · Simulation 차단/)
  assert.doesNotMatch(full, /Sun in /)
  assert.doesNotMatch(full, /meeus_approx_v1/)
  assert.doesNotMatch(full, /arcminute_level/)
})
test('topic focused copy changes the actual selected evidence for all four topics', () => {
  const personality = build('personality').pkg.copies.topicFocused
  const career = build('career').pkg.copies.topicFocused
  const relationship = build('relationship').pkg.copies.topicFocused
  const timing = build('timing').pkg.copies.topicFocused

  assert.match(personality, /오행 표면 분포/)
  assert.match(personality, /복덕궁/)
  assert.match(career, /직업 관련 시기 근거/)
  assert.match(career, /관록궁/)
  assert.match(relationship, /일지·관계 관련 합충형파해/)
  assert.match(relationship, /부처궁/)
  assert.match(timing, /대운·세운·월운·일진·경계 후보/)
  assert.match(timing, /시기 값을 생성하지 않음/)
  assert.equal(new Set([personality, career, relationship, timing]).size, 4)
})

test('privacy minimal copy removes direct identifiers and question PII', () => {
  const question = '한규 010-1234-5678 test@example.com 서울에서 1997-04-21 14:40 관계 고민'
  const privacy = build('relationship', question).pkg.copies.privacyMinimal

  assert.doesNotMatch(privacy, /한규/)
  assert.doesNotMatch(privacy, /1997-04-21/)
  assert.doesNotMatch(privacy, /14:40/)
  assert.doesNotMatch(privacy, /서울/)
  assert.doesNotMatch(privacy, /010-1234-5678/)
  assert.doesNotMatch(privacy, /test@example\.com/)
  assert.match(privacy, /질문 요약: 관계에서 반복되는 패턴 탐색/)
})
