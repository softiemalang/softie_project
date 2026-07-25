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
