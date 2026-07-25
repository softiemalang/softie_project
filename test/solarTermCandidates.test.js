import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateSajuSystem } from '../src/interpretationPrep/sajuAdapter.js'
import { DEFAULT_PROFILES } from '../src/interpretationPrep/schema.js'

test('solar term boundary (LiChun / 입춘) generates 2 rule interpretation candidates affecting year and month', () => {
  // 1990년 입춘 시각 근방 입력 (1990-02-04 11:10 KST)
  const input = {
    subjectName: '입춘경계테스트',
    birthDate: '1990-02-04',
    birthTime: '11:10',
    targetDate: '2026-07-25',
    gender: 'female',
    calendar: 'solar',
    timeAccuracy: 'exact',
    referenceCity: 'seoul',
    timezone: 'Asia/Seoul',
  }

  const result = calculateSajuSystem(input, DEFAULT_PROFILES.saju)
  const raw = result.raw

  assert.ok(raw.candidates, 'candidates array should exist')
  assert.equal(raw.candidates.length, 2, 'Should generate 2 solar term candidates')

  const candA = raw.candidates[0]
  const candB = raw.candidates[1]

  assert.equal(candA.candidateOrigin, 'solar_term_boundary')
  assert.equal(candA.candidatePriority, 2)
  assert.equal(candA.ruleAssumption.termName, '입춘')
  assert.deepEqual(candA.affectedFields, ['year', 'month'])
  assert.equal(candA.actualBirthTime, '1990-02-04 11:10')
  assert.ok(candA.boundaryPolicy.method)
  assert.ok(candA.boundaryContext.termExactUtc)

  // candidateAnalysis verify
  const analysis = raw.candidateAnalysis
  assert.ok(analysis, 'candidateAnalysis should exist')
  assert.equal(analysis.candidateCount, 2)
  assert.deepEqual(analysis.consensus.factual.dayMaster, '경')
  assert.ok(analysis.variances.fields.includes('pillars.month') || analysis.variances.fields.includes('pillars.year'))
})

test('general solar term boundary generates candidates affecting month pillar only', () => {
  // 1995년 청명 시각 근방 입력 (1995-04-05 15:10 KST)
  const input = {
    subjectName: '청명경계테스트',
    birthDate: '1995-04-05',
    birthTime: '15:10',
    targetDate: '2026-07-25',
    gender: 'male',
    calendar: 'solar',
    timeAccuracy: 'exact',
    referenceCity: 'seoul',
    timezone: 'Asia/Seoul',
  }

  const result = calculateSajuSystem(input, DEFAULT_PROFILES.saju)
  const raw = result.raw

  assert.ok(raw.candidates)
  assert.equal(raw.candidates.length, 2)

  const cand = raw.candidates[0]
  assert.equal(cand.candidateOrigin, 'solar_term_boundary')
  assert.deepEqual(cand.affectedFields, ['month'])
})

test('normal input away from solar term boundary does NOT generate solar term candidates', () => {
  // 절기 입절 시각에서 며칠 떨어진 지점 (1995-05-15 14:30 KST)
  const input = {
    subjectName: '정상입력테스트',
    birthDate: '1995-05-15',
    birthTime: '14:30',
    targetDate: '2026-07-25',
    gender: 'female',
    calendar: 'solar',
    timeAccuracy: 'exact',
    referenceCity: 'seoul',
    timezone: 'Asia/Seoul',
  }

  const result = calculateSajuSystem(input, DEFAULT_PROFILES.saju)
  const raw = result.raw

  assert.ok(raw.candidates)
  assert.equal(raw.candidates.length, 1, 'Single primary candidate for exact normal input')
  assert.equal(raw.candidates[0].candidateOrigin, 'user_input')
})
