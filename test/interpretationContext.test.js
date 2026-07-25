import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateSajuSystem } from '../src/interpretationPrep/sajuAdapter.js'
import { prepareInterpretationData } from '../src/interpretationPrep/prepare.js'
import { buildInterpretationContext } from '../src/interpretationPrep/interpretationContext.js'
import { DEFAULT_PROFILES } from '../src/interpretationPrep/schema.js'

test('interpretationContext: builds structured context without mutating calculation raw result', () => {
  const input = {
    subjectName: '테스트1',
    birthDate: '1990-05-15',
    birthTime: '14:30',
    targetDate: '2026-07-25',
    gender: 'female',
    calendar: 'solar',
    timeAccuracy: 'exact',
    referenceCity: 'seoul',
    timezone: 'Asia/Seoul',
  }

  const result = calculateSajuSystem(input, DEFAULT_PROFILES.saju)
  const rawCopy = JSON.parse(JSON.stringify(result.raw))

  const context = buildInterpretationContext(result, { generatedAt: '2026-07-25T12:00:00.000Z' })

  assert.ok(context)
  assert.equal(context.contextVersion, '1.0.0')
  assert.equal(context.generatedAt, '2026-07-25T12:00:00.000Z')
  assert.ok(context.candidateSetConsensus.factual.yearPillar)
  assert.ok(context.calculationConfidence.stateContract)
  assert.ok(Array.isArray(context.interpretationWarnings))

  // Ensure pure transformation without mutating raw
  assert.deepEqual(result.raw, rawCopy)
})

test('interpretationContext: unknown birth time generates candidateFacts and safety warnings', () => {
  const prepResult = prepareInterpretationData({
    subjectName: '미상테스트',
    birthDate: '1990-05-15',
    timeAccuracy: 'unknown',
    targetDate: '2026-07-25',
    gender: 'male',
    calendar: 'solar',
    referenceCity: 'seoul',
    timezone: 'Asia/Seoul',
  })

  const context = prepResult.interpretationContext

  assert.ok(context)
  assert.equal(context.candidateFacts.length, 12)
  assert.ok(context.uncertainFactors.some((u) => u.field.includes('hour') || u.field.includes('pillars')))
  assert.equal(context.calculationConfidence.stateContract.confidence, 'low')
  assert.ok(
    context.interpretationWarnings.some((w) => w.includes('12개 시주 후보가 생성되었으므로'))
  )
})

test('interpretationContext: solar term boundary reflects candidateSetConsensus and term warnings', () => {
  const prepResult = prepareInterpretationData({
    subjectName: '절기경계테스트',
    birthDate: '1990-02-04',
    birthTime: '11:10',
    timeAccuracy: 'exact',
    targetDate: '2026-07-25',
    gender: 'female',
    calendar: 'solar',
    referenceCity: 'seoul',
    timezone: 'Asia/Seoul',
  })

  const context = prepResult.interpretationContext

  assert.ok(context)
  assert.ok(
    context.interpretationWarnings.some((w) => w.includes('절기') || w.includes('후보'))
  )
  assert.ok(context.candidateSetConsensus)
})
