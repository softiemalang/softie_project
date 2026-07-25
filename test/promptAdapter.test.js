import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareInterpretationData } from '../src/interpretationPrep/prepare.js'
import { buildInterpretationPrompt } from '../src/interpretationPrep/promptAdapter.js'

test('promptAdapter: exact birth time generates clean prompt package with system instruction and task', () => {
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

  const context = prepResult.interpretationContext
  const promptPkg = buildInterpretationPrompt(context, {
    topicId: 'career',
    question: '제 직업적 경향성이 궁금합니다.',
    task: { goal: '직업적 강점 및 적성 분석' },
  })

  assert.ok(promptPkg)
  assert.ok(promptPkg.systemInstruction.includes('사주명리학적 바탕과 불확실성을 객관적으로 설명하는'))
  assert.equal(promptPkg.interpretationTask.topicId, 'career')
  assert.equal(promptPkg.interpretationTask.goal, '직업적 강점 및 적성 분석')
  assert.ok(Array.isArray(promptPkg.interpretationTask.avoid))
  assert.ok(promptPkg.userQuestionPrompt.includes('제 직업적 경향성이 궁금합니다.'))
})

test('promptAdapter: unknown birth time adds low confidence guardrails to SYSTEM instruction', () => {
  const prepResult = prepareInterpretationData({
    subjectName: '시모름',
    birthDate: '1990-05-15',
    timeAccuracy: 'unknown',
    targetDate: '2026-07-25',
    gender: 'male',
    calendar: 'solar',
    referenceCity: 'seoul',
    timezone: 'Asia/Seoul',
  })

  const context = prepResult.interpretationContext
  const promptPkg = prepResult.interpretationPrompt

  assert.ok(promptPkg)
  assert.equal(context.calculationConfidence.stateContract.confidence, 'low')
  assert.equal(promptPkg.contextPayload.calculationConfidence.stateContract.confidence, 'low')
  assert.ok(promptPkg.systemInstruction.includes('[HIGH PRIORITY]'))
  assert.ok(promptPkg.systemInstruction.includes('확정적 표현을 절대 금하며'))
  assert.ok(promptPkg.contextPayload.interpretationConstraints.some((c) => c.includes('12개 시주 후보가 생성되었으므로')))
  assert.ok(promptPkg.userQuestionPrompt.includes('[해석 시 필수 준수 가이드라인]'))
})

test('promptAdapter: solar term boundary case includes term constraints and candidateFacts guidance', () => {
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

  assert.ok(promptPkg)
  assert.ok(
    promptPkg.contextPayload.interpretationConstraints.some((c) => c.includes('절기 입절 시각 경계에 위치하여'))
  )
  assert.ok(promptPkg.systemInstruction.includes('가정적 가능성'))
})

test('promptAdapter: historical DST case ensures standard time candidate warnings in constraints', () => {
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

  assert.ok(promptPkg)
  assert.ok(promptPkg.formattedPromptPackage)
  assert.ok(promptPkg.systemInstruction)
})
