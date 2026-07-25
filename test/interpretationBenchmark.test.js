import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareInterpretationData } from '../src/interpretationPrep/prepare.js'
import { buildInterpretationPrompt } from '../src/interpretationPrep/promptAdapter.js'

test('Benchmark Case A: exact + career - enables clean strength & workplace guidance without warning overload', () => {
  const prep = prepareInterpretationData({
    subjectName: '커리어_정확',
    birthDate: '1990-05-15',
    birthTime: '14:30',
    timeAccuracy: 'exact',
    targetDate: '2026-07-25',
    gender: 'female',
    calendar: 'solar',
    referenceCity: 'seoul',
    timezone: 'Asia/Seoul',
  })

  const pkg = buildInterpretationPrompt(prep.interpretationContext, {
    topicId: 'career',
    question: '제게 가장 잘 맞는 직업적 강점과 업무 환경이 궁금합니다.',
  })

  assert.equal(pkg.contextPayload.calculationConfidence.stateContract.confidence, 'high')
  assert.equal(pkg.contextPayload.uncertainFactors.length, 0)
  assert.ok(!pkg.systemInstruction.includes('[HIGH PRIORITY]'))
  assert.ok(pkg.interpretationTask.framework.includes('바탕 명식에 드러난 원천적 적성과 업무 스타일 (Consensus)'))
  assert.ok(pkg.userQuestionPrompt.includes('[상담 주제]: 직업 및 적성 탐색'))
})

test('Benchmark Case B: unknown + personality - compresses 12 candidates into consensus & comparative guidance', () => {
  const prep = prepareInterpretationData({
    subjectName: '성향_시간모름',
    birthDate: '1990-05-15',
    timeAccuracy: 'unknown',
    targetDate: '2026-07-25',
    gender: 'male',
    calendar: 'solar',
    referenceCity: 'seoul',
    timezone: 'Asia/Seoul',
  })

  const pkg = buildInterpretationPrompt(prep.interpretationContext, {
    topicId: 'personality',
    question: '제 본질적인 기질과 성향의 공통 특징을 알고 싶어요.',
  })

  assert.equal(pkg.contextPayload.calculationConfidence.stateContract.confidence, 'low')
  assert.ok(pkg.systemInstruction.includes('확정적 표현을 절대 금하며'))
  assert.ok(pkg.systemInstruction.includes('후보별 가능성을 비교하여 조건별 분기'))
  assert.ok(pkg.interpretationTask.framework.includes('내면의 바탕 오행/십신 성향 설명 (Consensus)'))
  assert.ok(pkg.contextPayload.interpretationConstraints.some((c) => c.includes('12개 시주 후보가 생성되었으므로')))
})

test('Benchmark Case C: historical_dst + relationship - contrasts time candidates neutral in relationship context', () => {
  const prep = prepareInterpretationData({
    subjectName: '관계_DST',
    birthDate: '1988-05-10',
    birthTime: '01:30',
    timeAccuracy: 'exact',
    targetDate: '2026-07-25',
    gender: 'female',
    calendar: 'solar',
    referenceCity: 'seoul',
    timezone: 'Asia/Seoul',
  })

  const pkg = buildInterpretationPrompt(prep.interpretationContext, {
    topicId: 'relationship',
    question: '대인관계에서 소통할 때 제가 주의할 점과 갈등 해결 방식이 궁금합니다.',
  })

  assert.equal(pkg.contextPayload.calculationConfidence.stateContract.confidence, 'low')
  assert.ok(pkg.interpretationTask.framework.includes('후보별 감정 표현 및 갈등 대응 방식의 차이 (Variances)'))
  assert.ok(pkg.interpretationTask.framework.includes('상대방과의 건강한 관계 형성을 위한 소통 질문'))
  assert.ok(pkg.contextPayload.interpretationConstraints.some((c) => c.includes('복수의 명식 해석 후보가 존재하므로')))
})

test('Benchmark Case D: solar_term/timing + low confidence - forbids deterministic future prediction and demands preparedness', () => {
  const prep = prepareInterpretationData({
    subjectName: '시점_절기경계',
    birthDate: '1990-02-04',
    birthTime: '11:10',
    timeAccuracy: 'exact',
    targetDate: '2026-07-25',
    gender: 'female',
    calendar: 'solar',
    referenceCity: 'seoul',
    timezone: 'Asia/Seoul',
  })

  const pkg = buildInterpretationPrompt(prep.interpretationContext, {
    topicId: 'timing',
    question: '입춘 경계에 태어났는데 2027년에 제 삶에 큰 변화가 크게 올까요?',
  })

  assert.equal(pkg.contextPayload.calculationConfidence.stateContract.confidence, 'low')
  assert.ok(pkg.systemInstruction.includes('미래 특정 연도나 날짜에 특정 사건이 일어난다고 단정적으로 예언하지 마십시오'))
  assert.ok(pkg.systemInstruction.includes('운의 흐름은 절대적 운명이 아닌 "환경적 변동성과 시도의 적기"로 설명하십시오'))
  assert.ok(pkg.systemInstruction.includes('사용자 질문에 포함된 전제나 가정'))
  assert.ok(pkg.contextPayload.interpretationConstraints.some((c) => c.includes('절기 입절 시각 경계에 위치하여')))
})

test('Benchmark Case E: exact + relationship - cleanly presents relationship traits & reflection question without warning bloat', () => {
  const prep = prepareInterpretationData({
    subjectName: '관계_정확',
    birthDate: '1990-05-15',
    birthTime: '14:30',
    timeAccuracy: 'exact',
    targetDate: '2026-07-25',
    gender: 'female',
    calendar: 'solar',
    referenceCity: 'seoul',
    timezone: 'Asia/Seoul',
  })

  const pkg = buildInterpretationPrompt(prep.interpretationContext, {
    topicId: 'relationship',
    question: '제 대인관계 소통 패턴과 조화로운 관계를 위한 조언을 듣고 싶어요.',
  })

  assert.equal(pkg.contextPayload.calculationConfidence.stateContract.confidence, 'high')
  assert.equal(pkg.contextPayload.uncertainFactors.length, 0)
  assert.ok(!pkg.systemInstruction.includes('[HIGH PRIORITY]'))
  assert.ok(pkg.interpretationTask.framework.includes('기본 소통 스타일과 대인관계적 바탕 (Consensus)'))
  assert.ok(pkg.userQuestionPrompt.includes('[상담 주제]: 대인관계 및 소통 패턴'))
})
