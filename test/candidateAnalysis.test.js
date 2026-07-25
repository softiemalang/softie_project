import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculateSajuSystem } from '../src/interpretationPrep/sajuAdapter.js'
import { prepareInterpretationData } from '../src/interpretationPrep/prepare.js'
import { DEFAULT_PROFILES } from '../src/interpretationPrep/schema.js'
import { analyzeCandidateSet } from '../src/interpretationPrep/candidateAnalysis.js'

test('analyzeCandidateSet extracts factual consensus and distribution for 12 unknown time candidates', () => {
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
  const candidateAnalysis = sajuResult.raw.candidateAnalysis

  assert.ok(candidateAnalysis, 'candidateAnalysis should exist')
  assert.ok(candidateAnalysis.candidateCount >= 12)

  // Factual Consensus - 연주와 월주는 미상시에도 공통
  const factual = candidateAnalysis.consensus.factual
  assert.equal(factual.pillars.year, '을해')
  assert.equal(factual.pillars.month, '신사')

  // Interpretive Agreement (may or may not agree)
  assert.ok(candidateAnalysis.consensus.interpretiveAgreement !== undefined)

  // Variances & Distributions
  const distributions = candidateAnalysis.variances.distributions
  assert.ok(distributions.hourBranch, 'hourBranch distribution should exist')

  // Statistics
  assert.equal(candidateAnalysis.statistics.candidateCount, 12)
})

test('prepareInterpretationData includes candidate set consensus and variance analysis for range time input', () => {
  const input = {
    subjectName: '테스트',
    birthDate: '1995-05-15',
    birthTime: '13:00',
    birthTimeStart: '13:00',
    birthTimeEnd: '16:00',
    targetDate: '2026-07-25',
    gender: 'female',
    calendar: 'solar',
    timeAccuracy: 'range',
    referenceCity: 'seoul',
    timezone: 'Asia/Seoul',
  }

  const prepResult = prepareInterpretationData(input, DEFAULT_PROFILES)
  const payload = prepResult.systems.saju.raw.candidateAnalysis

  assert.ok(payload, 'candidateAnalysis should exist in prepResult')
  assert.equal(payload.consensus.factual.dayMaster, '병')
})
