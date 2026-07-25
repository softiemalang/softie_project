import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareInterpretationData } from '../src/interpretationPrep/prepare.js'
import { buildInterpretationPrompt } from '../src/interpretationPrep/promptAdapter.js'

test('promptSafetyContract: exact case enables clean interpretation without noise', () => {
  const prepResult = prepareInterpretationData({
    subjectName: '정확시간',
    birthDate: '1990-05-15',
    birthTime: '14:30',
    timeAccuracy: 'exact',
    targetDate: '2026-07-25',
    gender: 'female',
    calendar: 'solar',
    referenceCity: 'seoul',
    timezone: 'Asia/Seoul',
  })

  const promptPkg = buildInterpretationPrompt(prepResult.interpretationContext)

  assert.equal(promptPkg.contextPayload.calculationConfidence.stateContract.confidence, 'high')
  assert.equal(promptPkg.contextPayload.uncertainFactors.length, 0)
  assert.ok(!promptPkg.systemInstruction.includes('[HIGH PRIORITY]'))
})

test('promptSafetyContract: unknown birth time enforces both negative guardrails and positive comparative guidance', () => {
  const prepResult = prepareInterpretationData({
    subjectName: '시간모름',
    birthDate: '1990-05-15',
    timeAccuracy: 'unknown',
    targetDate: '2026-07-25',
    gender: 'male',
    calendar: 'solar',
    referenceCity: 'seoul',
    timezone: 'Asia/Seoul',
  })

  const promptPkg = prepResult.interpretationPrompt

  assert.equal(promptPkg.contextPayload.calculationConfidence.stateContract.confidence, 'low')
  assert.ok(promptPkg.systemInstruction.includes('확정적 표현을 절대 금하며'))
  assert.ok(promptPkg.systemInstruction.includes('후보별 가능성을 비교'))
  assert.ok(promptPkg.systemInstruction.includes('조건별 가정적 가능성'))
  assert.ok(promptPkg.contextPayload.interpretationConstraints.some((c) => c.includes('12개 시주 후보가 생성되었으므로')))
})

test('promptSafetyContract: DST case distinguishes time candidates and demands comparative guidance', () => {
  const prepResult = prepareInterpretationData({
    subjectName: 'DST사례',
    birthDate: '1988-05-10',
    birthTime: '01:30',
    timeAccuracy: 'exact',
    targetDate: '2026-07-25',
    gender: 'female',
    calendar: 'solar',
    referenceCity: 'seoul',
    timezone: 'Asia/Seoul',
  })

  const promptPkg = prepResult.interpretationPrompt

  assert.equal(promptPkg.contextPayload.calculationConfidence.stateContract.confidence, 'low')
  assert.ok(promptPkg.systemInstruction.includes('확정적 표현을 절대 금하며'))
  assert.ok(promptPkg.systemInstruction.includes('후보별 가능성을 비교'))
  assert.ok(promptPkg.contextPayload.interpretationConstraints.some((c) => c.includes('복수의 명식 해석 후보가 존재하므로')))
})

test('promptSafetyContract: solar term boundary case demands rule candidate comparison and premise neutrality', () => {
  const prepResult = prepareInterpretationData({
    subjectName: '절기경계',
    birthDate: '1990-02-04',
    birthTime: '11:10',
    timeAccuracy: 'exact',
    targetDate: '2026-07-25',
    gender: 'female',
    calendar: 'solar',
    referenceCity: 'seoul',
    timezone: 'Asia/Seoul',
  })

  const promptPkg = prepResult.interpretationPrompt

  assert.equal(promptPkg.contextPayload.calculationConfidence.stateContract.confidence, 'low')
  assert.ok(promptPkg.systemInstruction.includes('사용자 질문에 포함된 전제나 가정'))
  assert.ok(promptPkg.contextPayload.interpretationConstraints.some((c) => c.includes('절기 입절 시각 경계에 위치하여')))
})

test('promptSafetyContract: domain profile (career) injects 4-step protocol and career framework', () => {
  const prepResult = prepareInterpretationData({
    subjectName: '커리어질문',
    birthDate: '1990-05-15',
    birthTime: '14:30',
    timeAccuracy: 'exact',
    targetDate: '2026-07-25',
    gender: 'female',
    calendar: 'solar',
    referenceCity: 'seoul',
    timezone: 'Asia/Seoul',
  })

  const promptPkg = buildInterpretationPrompt(prepResult.interpretationContext, {
    topicId: 'career',
    question: '제게 맞는 적성과 업무 환경이 궁금합니다.',
  })

  assert.equal(promptPkg.interpretationTask.topicId, 'career')
  assert.ok(promptPkg.systemInstruction.includes('4단계 해석 프로토콜 준수'))
  assert.ok(promptPkg.systemInstruction.includes('직업 및 적성 탐색'))
  assert.ok(promptPkg.userQuestionPrompt.includes('[상담 주제]: 직업 및 적성 탐색'))
})

test('promptSafetyContract: timing profile + low confidence forbids deterministic future prediction and demands preparedness guidance', () => {
  const prepResult = prepareInterpretationData({
    subjectName: '시점질문_DST',
    birthDate: '1988-05-10',
    birthTime: '01:30',
    timeAccuracy: 'exact',
    targetDate: '2026-07-25',
    gender: 'female',
    calendar: 'solar',
    referenceCity: 'seoul',
    timezone: 'Asia/Seoul',
  })

  const promptPkg = buildInterpretationPrompt(prepResult.interpretationContext, {
    topicId: 'timing',
    question: '2027년에 제 운이 크게 좋아지는 시기인가요?',
  })

  assert.equal(promptPkg.contextPayload.calculationConfidence.stateContract.confidence, 'low')
  assert.equal(promptPkg.contextPayload.calculationConfidence.stateContract.verificationStatus, 'candidate_required')
  assert.ok(promptPkg.systemInstruction.includes('미래 특정 연도나 날짜에 특정 사건이 일어난다고 단정적으로 예언하지 마십시오'))
  assert.ok(promptPkg.systemInstruction.includes('운의 흐름은 절대적 운명이 아닌 "환경적 변동성과 시도의 적기"로 설명하십시오'))
  assert.ok(promptPkg.systemInstruction.includes('[HIGH PRIORITY]'))
})
