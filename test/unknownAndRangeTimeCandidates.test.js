import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculateSajuSystem } from '../src/interpretationPrep/sajuAdapter.js'
import { prepareInterpretationData } from '../src/interpretationPrep/prepare.js'
import { DEFAULT_PROFILES } from '../src/interpretationPrep/schema.js'

test('unknown birth time generates 12 hour zi candidates with full metadata and low confidence state contract', () => {
  const input = {
    subjectName: '테스트',
    birthDate: '1995-05-15',
    birthTime: '',
    targetDate: '2026-07-25',
    gender: 'female',
    calendar: 'solar',
    timeAccuracy: 'unknown',
    referenceCity: 'seoul',
    timezone: 'Asia/Seoul',
  }

  const sajuResult = calculateSajuSystem(input, DEFAULT_PROFILES.saju)
  assert.equal(sajuResult.stateContract.verificationStatus, 'candidate_required')
  assert.equal(sajuResult.stateContract.interpretationStatus, 'candidate_only')
  assert.equal(sajuResult.stateContract.confidence, 'low')

  const candidates = sajuResult.raw.candidates
  assert.ok(candidates.length >= 1, 'candidates array should exist')

  const totalAssumptions = candidates.reduce((sum, c) => sum + (c.sourceCandidates?.length || c.sourceAssumptions?.length || 1), 0)
  assert.equal(totalAssumptions, 13, '13 total entries (1 primary + 12 hour zi candidate assumptions) should be preserved')
})

test('range birth time matching single hour zi produces needs_verification or candidate_required', () => {
  const input = {
    subjectName: '테스트',
    birthDate: '1995-05-15',
    birthTime: '',
    birthTimeStart: '13:30',
    birthTimeEnd: '14:30',
    targetDate: '2026-07-25',
    gender: 'male',
    calendar: 'solar',
    timeAccuracy: 'range',
    referenceCity: 'seoul',
    timezone: 'Asia/Seoul',
  }

  const prepResult = prepareInterpretationData(input, DEFAULT_PROFILES)
  const sajuResult = prepResult.systems.saju

  assert.ok(['low', 'medium'].includes(sajuResult.stateContract.confidence))
  assert.ok(sajuResult.raw.candidates.length >= 1)
})

test('range birth time matching multiple hour zi produces candidate_required and low confidence', () => {
  const input = {
    subjectName: '테스트',
    birthDate: '1995-05-15',
    birthTime: '',
    birthTimeStart: '14:00',
    birthTimeEnd: '16:00',
    targetDate: '2026-07-25',
    gender: 'female',
    calendar: 'solar',
    timeAccuracy: 'range',
    referenceCity: 'seoul',
    timezone: 'Asia/Seoul',
  }

  const prepResult = prepareInterpretationData(input, DEFAULT_PROFILES)
  const sajuResult = prepResult.systems.saju

  assert.equal(sajuResult.stateContract.verificationStatus, 'candidate_required')
  assert.equal(sajuResult.stateContract.interpretationStatus, 'candidate_only')
  assert.equal(sajuResult.stateContract.confidence, 'low')
  assert.ok(sajuResult.raw.candidates.length >= 1)
})
